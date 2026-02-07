import { verifyJWT, extractToken } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { ImapFlow } from "npm:imapflow@1.0.171";
import { simpleParser } from "npm:mailparser@3.7.1";
import nodemailer from "npm:nodemailer@6.9.16";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface MailFolder {
  name: string;
  path: string;
  unread: number;
  total: number;
  specialUse?: string;
}

interface MailHeader {
  uid: number;
  from: string;
  fromAddress: string;
  subject: string;
  date: string;
  read: boolean;
  hasAttachments: boolean;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Response Helpers ───────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  console.error(`[voip-mail] Error (${status}):`, message);
  return json({ error: message }, status);
}

// ─── Audit Logging ──────────────────────────────────────────────────────────────
async function auditLog(adminId: number, action: string, details: Record<string, unknown>) {
  try {
    await supabase.from("voip_admin_audit_log").insert({
      admin_id: adminId,
      action,
      entity_type: "mail",
      details,
    });
  } catch (e) {
    console.error("[Audit] Failed to log:", e);
  }
}

// ─── IMAP Connection Helper ─────────────────────────────────────────────────────
async function createImapClient() {
  const port = parseInt(Deno.env.get("IMAP_PORT") || "993");
  const client = new ImapFlow({
    host: Deno.env.get("IMAP_HOST")!,
    port,
    secure: port === 993,
    auth: {
      user: Deno.env.get("MAIL_USERNAME")!,
      pass: Deno.env.get("MAIL_PASSWORD")!,
    },
    logger: false,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  await client.connect();
  console.log("[voip-mail] IMAP connected");
  return client;
}

// ─── Timeout Helper ─────────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function hasAttachmentParts(bodyStructure: any): boolean {
  if (!bodyStructure) return false;
  if (bodyStructure.disposition === "attachment") return true;
  if (bodyStructure.childNodes) {
    return bodyStructure.childNodes.some((child: any) => hasAttachmentParts(child));
  }
  return false;
}

function bufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Action: List Folders ───────────────────────────────────────────────────────
async function handleFolders(): Promise<Response> {
  const client = await createImapClient();
  try {
    const mailboxes = await client.list();
    const folders: MailFolder[] = [];

    for (const mb of mailboxes) {
      try {
        const status = await client.status(mb.path, { messages: true, unseen: true });
        folders.push({
          name: mb.name,
          path: mb.path,
          unread: status.unseen || 0,
          total: status.messages || 0,
          specialUse: mb.specialUse,
        });
      } catch {
        folders.push({ name: mb.name, path: mb.path, unread: 0, total: 0 });
      }
    }

    // Sort: INBOX first, then special folders, then alphabetical
    folders.sort((a, b) => {
      if (a.path === "INBOX") return -1;
      if (b.path === "INBOX") return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(`[voip-mail] Found ${folders.length} folders`);
    return json({ folders });
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Action: List Messages ──────────────────────────────────────────────────────
async function handleList(folder: string, page: number): Promise<Response> {
  const client = await createImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const allUids: number[] = await client.search({ all: true }, { uid: true });
      allUids.sort((a: number, b: number) => b - a);

      const perPage = 25;
      const start = (page - 1) * perPage;
      const pageUids = allUids.slice(start, start + perPage);

      if (pageUids.length === 0) {
        return json({ messages: [], total: allUids.length, page, hasMore: false });
      }

      const messages: MailHeader[] = [];
      for await (const msg of client.fetch(pageUids, {
        envelope: true,
        flags: true,
        bodyStructure: true,
      }, { uid: true })) {
        const from = msg.envelope?.from?.[0];
        messages.push({
          uid: msg.uid,
          from: from ? (from.name || from.address || "Unknown") : "Unknown",
          fromAddress: from?.address || "",
          subject: msg.envelope?.subject || "(No Subject)",
          date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
          read: msg.flags?.has("\\Seen") || false,
          hasAttachments: hasAttachmentParts(msg.bodyStructure),
        });
      }

      messages.sort((a, b) => b.uid - a.uid);
      console.log(`[voip-mail] Listed ${messages.length} messages from ${folder}, page ${page}`);
      return json({ messages, total: allUids.length, page, hasMore: start + perPage < allUids.length });
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Action: Read Message ───────────────────────────────────────────────────────
async function handleRead(folder: string, uid: number, adminId: number): Promise<Response> {

  const doRead = async () => {
    const client = await createImapClient();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        const downloadResult = await client.download(uid.toString(), undefined, { uid: true });
        if (!downloadResult?.content) {
          return errorResponse("Message not found", 404);
        }

        const parsed = await simpleParser(downloadResult.content);

        // Mark as read (non-blocking)
        client.messageFlagsAdd(uid.toString(), ["\\Seen"], { uid: true }).catch((e: any) => {
          console.warn("[voip-mail] Could not mark as read:", e);
        });

        const attachments = (parsed.attachments || []).map((att: any, index: number) => ({
          index,
          filename: att.filename || `attachment-${index}`,
          contentType: att.contentType || "application/octet-stream",
          size: att.size || 0,
        }));

        // Audit log (non-blocking)
        auditLog(adminId, "mail_message_opened", {
          subject: parsed.subject,
          from: parsed.from?.text,
          folder,
          uid,
        });

        console.log(`[voip-mail] Read message UID ${uid} from ${folder}`);
        return json({
          message: {
            uid,
            from: parsed.from?.text || "Unknown",
            fromAddress: parsed.from?.value?.[0]?.address || "",
            to: parsed.to?.text || "",
            cc: parsed.cc?.text || "",
            subject: parsed.subject || "(No Subject)",
            date: parsed.date?.toISOString() || new Date().toISOString(),
            html: parsed.html || "",
            text: parsed.text || "",
            read: true,
            attachments,
            messageId: parsed.messageId || "",
            inReplyTo: parsed.inReplyTo || "",
          },
        });
      } finally {
        lock.release();
      }
    } finally {
      try { await client.logout(); } catch { /* ignore */ }
    }
  };

  return withTimeout(doRead(), 45000, "Mail read");
}

// ─── Action: Download Attachment ────────────────────────────────────────────────
async function handleAttachment(folder: string, uid: number, index: number): Promise<Response> {
  const client = await createImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const downloadResult = await client.download(uid.toString(), undefined, { uid: true });
      const parsed = await simpleParser(downloadResult.content);

      const attachment = parsed.attachments?.[index];
      if (!attachment) {
        return errorResponse("Attachment not found", 404);
      }

      const base64Data = bufferToBase64(attachment.content);

      return json({
        filename: attachment.filename || `attachment-${index}`,
        contentType: attachment.contentType || "application/octet-stream",
        size: attachment.size || 0,
        data: base64Data,
      });
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Action: Send Email ─────────────────────────────────────────────────────────
async function handleSend(body: any, adminId: number): Promise<Response> {

  const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const secure = port === 465;
  const transporter = nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST")!,
    port,
    secure,
    // Deno edge runtime cannot perform STARTTLS upgrades reliably,
    // so skip TLS negotiation on non-implicit-TLS ports (587).
    // Mail is still authenticated; the VPS connection is internal.
    ...(secure ? {} : { ignoreTLS: true }),
    auth: {
      user: Deno.env.get("MAIL_USERNAME")!,
      pass: Deno.env.get("MAIL_PASSWORD")!,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
  });

  const mailOptions: any = {
    from: `"Admin" <${Deno.env.get("MAIL_USERNAME")}>`,
    to: body.to,
    subject: body.subject,
    html: body.body || body.text || "",
  };

  if (body.cc) mailOptions.cc = body.cc;
  if (body.bcc) mailOptions.bcc = body.bcc;
  if (body.inReplyTo) mailOptions.inReplyTo = body.inReplyTo;

  await transporter.sendMail(mailOptions);

  await auditLog(adminId, "mail_message_sent", {
    to: body.to,
    subject: body.subject,
    cc: body.cc || null,
  });

  console.log(`[voip-mail] Sent email to ${body.to}: ${body.subject}`);
  return json({ success: true });
}

// ─── Action: Mark Read/Unread ───────────────────────────────────────────────────
async function handleMark(body: any): Promise<Response> {
  const client = await createImapClient();
  try {
    const lock = await client.getMailboxLock(body.folder);
    try {
      if (body.flag === "seen") {
        await client.messageFlagsAdd(body.uid.toString(), ["\\Seen"], { uid: true });
      } else {
        await client.messageFlagsRemove(body.uid.toString(), ["\\Seen"], { uid: true });
      }
      console.log(`[voip-mail] Marked UID ${body.uid} as ${body.flag}`);
      return json({ success: true });
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Action: Move Message ───────────────────────────────────────────────────────
async function handleMove(body: any, adminId: number): Promise<Response> {
  const client = await createImapClient();
  try {
    const lock = await client.getMailboxLock(body.folder);
    try {
      await client.messageMove(body.uid.toString(), body.destination, { uid: true });

      await auditLog(adminId, "mail_message_moved", {
        from: body.folder,
        to: body.destination,
        uid: body.uid,
      });

      console.log(`[voip-mail] Moved UID ${body.uid} from ${body.folder} to ${body.destination}`);
      return json({ success: true });
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Action: Delete Message ─────────────────────────────────────────────────────
async function handleDelete(body: any, adminId: number): Promise<Response> {
  const client = await createImapClient();
  try {
    const lock = await client.getMailboxLock(body.folder);
    try {
      await client.messageDelete(body.uid.toString(), { uid: true });

      await auditLog(adminId, "mail_message_deleted", {
        folder: body.folder,
        uid: body.uid,
      });

      console.log(`[voip-mail] Deleted UID ${body.uid} from ${body.folder}`);
      return json({ success: true });
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Action: Search Messages ────────────────────────────────────────────────────
async function handleSearch(folder: string, query: string): Promise<Response> {
  const client = await createImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      // Try OR search first, fall back to subject-only if server doesn't support it
      let uids: number[] = [];
      try {
        uids = await client.search({ or: [{ subject: query }, { from: query }] }, { uid: true });
      } catch {
        console.warn("[voip-mail] OR search failed, falling back to subject search");
        uids = await client.search({ subject: query }, { uid: true });
      }

      uids.sort((a: number, b: number) => b - a);
      const limitedUids = uids.slice(0, 50);

      if (limitedUids.length === 0) {
        return json({ messages: [], total: 0 });
      }

      const messages: MailHeader[] = [];
      for await (const msg of client.fetch(limitedUids, {
        envelope: true,
        flags: true,
        bodyStructure: true,
      }, { uid: true })) {
        const from = msg.envelope?.from?.[0];
        messages.push({
          uid: msg.uid,
          from: from ? (from.name || from.address || "Unknown") : "Unknown",
          fromAddress: from?.address || "",
          subject: msg.envelope?.subject || "(No Subject)",
          date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
          read: msg.flags?.has("\\Seen") || false,
          hasAttachments: hasAttachmentParts(msg.bodyStructure),
        });
      }

      messages.sort((a, b) => b.uid - a.uid);
      console.log(`[voip-mail] Search "${query}" in ${folder}: ${messages.length} results`);
      return json({ messages, total: messages.length });
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth verification
    const token = extractToken(req.headers.get("Authorization"));
    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return errorResponse("Invalid or expired token", 401);
    }
    if (payload.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }

    // Rate limiting
    if (!checkRateLimit(payload.sub)) {
      return errorResponse("Rate limit exceeded. Try again in a minute.", 429);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    console.log(`[voip-mail] Action: ${action}, Admin: ${payload.email}`);

    switch (action) {
      case "folders":
        return await handleFolders();

      case "list": {
        const folder = url.searchParams.get("folder") || "INBOX";
        const page = parseInt(url.searchParams.get("page") || "1");
        return await handleList(folder, page);
      }

      case "read": {
        const folder = url.searchParams.get("folder") || "INBOX";
        const uid = parseInt(url.searchParams.get("uid") || "0");
        if (!uid) return errorResponse("UID required");
        return await handleRead(folder, uid, parseInt(payload.sub));
      }

      case "attachment": {
        const folder = url.searchParams.get("folder") || "INBOX";
        const uid = parseInt(url.searchParams.get("uid") || "0");
        const index = parseInt(url.searchParams.get("index") || "0");
        if (!uid) return errorResponse("UID required");
        return await handleAttachment(folder, uid, index);
      }

      case "send": {
        if (req.method !== "POST") return errorResponse("POST required", 405);
        const body = await req.json();
        if (!body.to || !body.subject) return errorResponse("'to' and 'subject' required");
        return await handleSend(body, parseInt(payload.sub));
      }

      case "mark": {
        if (req.method !== "POST") return errorResponse("POST required", 405);
        const body = await req.json();
        if (!body.folder || !body.uid || !body.flag) return errorResponse("folder, uid, flag required");
        return await handleMark(body);
      }

      case "move": {
        if (req.method !== "POST") return errorResponse("POST required", 405);
        const body = await req.json();
        if (!body.folder || !body.uid || !body.destination) return errorResponse("folder, uid, destination required");
        return await handleMove(body, parseInt(payload.sub));
      }

      case "delete": {
        if (req.method !== "POST") return errorResponse("POST required", 405);
        const body = await req.json();
        if (!body.folder || !body.uid) return errorResponse("folder, uid required");
        return await handleDelete(body, parseInt(payload.sub));
      }

      case "search": {
        const folder = url.searchParams.get("folder") || "INBOX";
        const query = url.searchParams.get("query") || "";
        if (!query) return errorResponse("query required");
        return await handleSearch(folder, query);
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error("[voip-mail] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
