import { format } from "date-fns";

// ─── Safe Data Accessors ────────────────────────────────────────────────────────

export function safeSubject(subject: string | null | undefined): string {
  if (!subject || subject === "null" || subject === "undefined" || subject.trim() === "") {
    return "(No Subject)";
  }
  return subject;
}

export function safeSender(from: string | null | undefined): string {
  if (!from || from === "null" || from === "undefined" || from.trim() === "") {
    return "Unknown Sender";
  }
  return from;
}

export function safeBody(html: string | null | undefined, text: string | null | undefined): { html: string; text: string } {
  const cleanHtml = (!html || html === "null" || html === "undefined") ? "" : html;
  const cleanText = (!text || text === "null" || text === "undefined") ? "" : text;
  return { html: cleanHtml, text: cleanText };
}

// ─── Formatting ─────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return format(d, "h:mm a");
    }
    if (d.getFullYear() === now.getFullYear()) {
      return format(d, "MMM d");
    }
    return format(d, "MMM d, yyyy");
  } catch {
    return dateStr || "";
  }
}

export function formatFullDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "PPp");
  } catch {
    return dateStr || "";
  }
}

export function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── HTML Sanitization ──────────────────────────────────────────────────────────

const DANGEROUS_TAGS = /(<\s*\/?\s*(script|iframe|object|embed|applet|form|input|button|select|textarea|meta|link|base|svg)\b[^>]*>)/gi;
const TRACKING_PIXELS = /(<img[^>]+(width|height)\s*=\s*["']?1["']?[^>]*>)/gi;
const ON_HANDLERS = /\s+on\w+\s*=\s*["'][^"']*["']/gi;

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  let cleaned = html;
  // Remove dangerous tags
  cleaned = cleaned.replace(DANGEROUS_TAGS, "<!-- removed -->");
  // Remove event handlers
  cleaned = cleaned.replace(ON_HANDLERS, "");
  // Remove tracking pixels
  cleaned = cleaned.replace(TRACKING_PIXELS, "<!-- tracking pixel removed -->");
  return cleaned;
}

// ─── Decode HTML entities ───────────────────────────────────────────────────────

export function decodeEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

// ─── Footer Detection ───────────────────────────────────────────────────────────

const FOOTER_PATTERNS = [
  /unsubscribe/i,
  /privacy\s*policy/i,
  /view\s*(in|this)\s*(email\s*in\s*your\s*)?browser/i,
  /©\s*\d{4}/,
  /terms\s*(of\s*service|&\s*conditions)/i,
  /contact\s*support/i,
  /manage\s*(your\s*)?(preferences|subscription)/i,
];

export function detectFooterIndex(text: string): number {
  const lines = text.split("\n");
  // Walk backwards to find the start of the footer block
  let footerStart = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    const isFooterLine = FOOTER_PATTERNS.some((p) => p.test(line)) || line.startsWith("---");
    if (isFooterLine) {
      footerStart = i;
    } else if (footerStart !== -1) {
      // If we found footer lines but hit a non-footer line, check if we have enough
      const footerLines = lines.slice(i + 1).filter((l) => l.trim()).length;
      if (footerLines >= 2) break;
      footerStart = -1; // False positive, reset
    }
  }
  return footerStart;
}

// ─── URL Linkification ──────────────────────────────────────────────────────────

export function shortenUrl(url: string, maxLen = 60): string {
  try {
    const u = new URL(url);
    const domain = u.hostname.replace("www.", "");
    const path = u.pathname + u.search;
    const full = domain + path;
    if (full.length <= maxLen) return full;
    return domain + path.substring(0, maxLen - domain.length - 3) + "…";
  } catch {
    return url.length > maxLen ? url.substring(0, maxLen - 1) + "…" : url;
  }
}

// ─── Separator Detection ────────────────────────────────────────────────────────

export function isDashedSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^[-=_]{5,}$/.test(trimmed);
}
