#!/usr/bin/env node
/**
 * Mail Relay HTTP Server
 * 
 * A lightweight HTTP server that accepts JSON POST requests and sends
 * emails via the local Postfix/sendmail installation.
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Copy this file to your VPS:
 *    scp mail-relay.js root@your-vps:/opt/mail-relay/mail-relay.js
 * 
 * 2. Install dependencies on the VPS:
 *    cd /opt/mail-relay
 *    npm init -y
 *    npm install nodemailer
 * 
 * 3. Set environment variables (add to /etc/environment or use systemd):
 *    MAIL_RELAY_KEY=<your-secret-key>   (same key you set in Lovable secrets)
 *    MAIL_FROM=admin@hardhathosting.work
 *    RELAY_PORT=8587                     (optional, defaults to 8587)
 * 
 * 4. Create systemd service for auto-start:
 *    sudo nano /etc/systemd/system/mail-relay.service
 *    (paste the service file content from mail-relay.service)
 *    sudo systemctl daemon-reload
 *    sudo systemctl enable mail-relay
 *    sudo systemctl start mail-relay
 * 
 * 5. Open the firewall port:
 *    sudo ufw allow 8587/tcp
 * 
 * 6. Set the Lovable secret MAIL_RELAY_URL to:
 *    https://mail.hardhathosting.work:8587/send
 *    (or http://your-vps-ip:8587/send if not using HTTPS)
 */

const http = require("http");
const nodemailer = require("nodemailer");

const PORT = parseInt(process.env.RELAY_PORT || "8587");
const API_KEY = process.env.MAIL_RELAY_KEY;
const MAIL_FROM = process.env.MAIL_FROM || "admin@hardhathosting.work";

if (!API_KEY) {
  console.error("ERROR: MAIL_RELAY_KEY environment variable is required");
  process.exit(1);
}

// Use local Postfix via sendmail transport (no SMTP ports needed)
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: "unix",
  path: "/usr/sbin/sendmail",
});

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/send") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Verify API key via X-Relay-Key header
  const providedKey = req.headers["x-relay-key"] || "";
  if (providedKey !== API_KEY) {
    console.log(`[mail-relay] Unauthorized request from ${req.socket.remoteAddress}`);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // Parse JSON body
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    const data = JSON.parse(body);
    const { to, from, subject, html, cc, bcc, inReplyTo } = data;

    if (!to || !subject) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required fields: to, subject" }));
      return;
    }

    const mailOptions = {
      from: from || `"Admin" <${MAIL_FROM}>`,
      to,
      subject,
      html: html || "",
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (inReplyTo) mailOptions.inReplyTo = inReplyTo;

    const info = await transporter.sendMail(mailOptions);
    console.log(`[mail-relay] ✅ Sent to ${to}: ${subject} (messageId: ${info.messageId})`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, messageId: info.messageId }));
  } catch (err) {
    console.error(`[mail-relay] ❌ Send failed:`, err.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`[mail-relay] ✅ Listening on port ${PORT}`);
  console.log(`[mail-relay] Send POST to http://localhost:${PORT}/send`);
});
