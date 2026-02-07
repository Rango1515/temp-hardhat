import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ChevronDown, Copy, ExternalLink, ImageOff } from "lucide-react";
import type { FullMessage } from "./types";
import {
  sanitizeHtml,
  safeBody,
  detectFooterIndex,
  shortenUrl,
  isDashedSeparator,
} from "./utils";

// ─── Iframe Styles ──────────────────────────────────────────────────────────────

const IFRAME_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.7;
    color: #e4e4e7;
    background: transparent;
    margin: 0;
    padding: 20px 24px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 72ch;
  }
  p { margin: 0 0 12px; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  img.blocked { display: none !important; }
  a { color: #60a5fa; text-decoration: none; word-break: break-all; }
  a:hover { text-decoration: underline; }
  pre, code {
    overflow-x: auto;
    background: rgba(255,255,255,0.05);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  }
  blockquote {
    border-left: 3px solid rgba(255,255,255,0.15);
    margin: 12px 0;
    padding: 4px 16px;
    color: #a1a1aa;
  }
  table { max-width: 100%; border-collapse: collapse; margin: 8px 0; }
  td, th { padding: 6px 10px; border: 1px solid rgba(255,255,255,0.1); }
  hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0; }
  h1, h2, h3, h4, h5, h6 { color: #fafafa; margin: 16px 0 8px; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  li { margin: 4px 0; }
  td a, p a { max-width: 100%; display: inline; overflow: hidden; text-overflow: ellipsis; }
  img[width="1"], img[height="1"], img[width="0"], img[height="0"] { display: none !important; }
  .email-footer { opacity: 0.5; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 16px; padding-top: 12px; font-size: 12px; }
`;

// ─── Block external images by default ───────────────────────────────────────────

function blockExternalImages(html: string): string {
  return html.replace(/<img\b([^>]*)\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi, (match, pre, src) => {
    return `<img${pre} src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-original-src="${src}" class="blocked"`;
  });
}

function unblockImages(html: string): string {
  return html.replace(/src="data:image\/gif;base64,[^"]*"\s*data-original-src="([^"]+)"\s*class="blocked"/gi, (_, src) => {
    return `src="${src}"`;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface EmailBodyProps {
  message: FullMessage;
  showRawSource?: boolean;
}

export function EmailBody({ message, showRawSource }: EmailBodyProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [footerExpanded, setFooterExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { html, text } = safeBody(message.html, message.text);

  // Reset state on message change
  useEffect(() => {
    setIframeLoaded(false);
    setImagesLoaded(false);
    setFooterExpanded(false);
  }, [message.uid]);

  // Auto-resize iframe
  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const tryResize = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          const h = doc.body.scrollHeight;
          iframe.style.height = `${Math.max(h + 40, 200)}px`;
        }
      } catch { /* cross-origin fallback */ }
    };
    tryResize();
    const timer = setTimeout(tryResize, 500);
    return () => clearTimeout(timer);
  }, [iframeLoaded, imagesLoaded]);

  // ── Raw source view ───────────────────────────────────────────────────────
  if (showRawSource) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parsed Parts</h4>
          <div className="text-xs space-y-1">
            <p><span className="text-muted-foreground">HTML length:</span> {html.length} chars</p>
            <p><span className="text-muted-foreground">Text length:</span> {text.length} chars</p>
            <p><span className="text-muted-foreground">Attachments:</span> {message.attachments?.length || 0}</p>
            <p><span className="text-muted-foreground">Message-ID:</span> <code className="text-xs">{message.messageId || "—"}</code></p>
            <p><span className="text-muted-foreground">In-Reply-To:</span> <code className="text-xs">{message.inReplyTo || "—"}</code></p>
          </div>
        </div>
        {html && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Raw HTML</h4>
            <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-80 whitespace-pre-wrap break-all border border-border">
              {html.substring(0, 50000)}
              {html.length > 50000 && "\n\n... [truncated]"}
            </pre>
          </div>
        )}
        {text && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Raw Text</h4>
            <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-80 whitespace-pre-wrap break-all border border-border">
              {text.substring(0, 50000)}
              {text.length > 50000 && "\n\n... [truncated]"}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // ── HTML Rendering ────────────────────────────────────────────────────────
  if (html) {
    const sanitized = sanitizeHtml(html);
    const processedHtml = imagesLoaded ? unblockImages(sanitized) : blockExternalImages(sanitized);
    const hasExternalImages = /data-original-src="/i.test(blockExternalImages(sanitized));

    const iframeSrcDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>${IFRAME_CSS}</style></head>
<body>${processedHtml}</body></html>`;

    return (
      <div className="relative flex-1 flex flex-col">
        {/* Image loading bar */}
        {hasExternalImages && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground">
            {imagesLoaded ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>External images loaded</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setImagesLoaded(false)}
                >
                  <EyeOff className="w-3 h-3 mr-1" /> Hide
                </Button>
              </>
            ) : (
              <>
                <ImageOff className="w-3.5 h-3.5" />
                <span>External images blocked for privacy</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setImagesLoaded(true)}
                >
                  <Eye className="w-3 h-3 mr-1" /> Load images
                </Button>
              </>
            )}
          </div>
        )}

        {/* Skeleton overlay */}
        {!iframeLoaded && (
          <div className="absolute inset-0 p-5 space-y-3 bg-card z-10 animate-pulse">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-11/12 rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
            <div className="py-2" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-10/12 rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="py-2" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        )}

        <iframe
          ref={iframeRef}
          srcDoc={iframeSrcDoc}
          key={`${message.uid}-${imagesLoaded}`}
          sandbox="allow-same-origin"
          className={cn(
            "w-full border-0 transition-opacity duration-300 min-h-[200px]",
            iframeLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ height: "400px" }}
          title="Email content"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    );
  }

  // ── Plain Text Rendering ──────────────────────────────────────────────────
  if (text) {
    return <PlainTextBody text={text} footerExpanded={footerExpanded} onToggleFooter={() => setFooterExpanded(!footerExpanded)} />;
  }

  // ── No content ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
      <p className="text-sm italic">This email has no displayable content.</p>
    </div>
  );
}

// ─── Plain Text Sub-Component ───────────────────────────────────────────────────

function PlainTextBody({
  text,
  footerExpanded,
  onToggleFooter,
}: {
  text: string;
  footerExpanded: boolean;
  onToggleFooter: () => void;
}) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const lines = text.split("\n");
  const footerIdx = detectFooterIndex(text);

  const mainLines = footerIdx >= 0 ? lines.slice(0, footerIdx) : lines;
  const footerLines = footerIdx >= 0 ? lines.slice(footerIdx) : [];

  return (
    <div className="p-5 text-sm leading-relaxed text-foreground max-w-[72ch]">
      {/* Main content */}
      {mainLines.map((line, i) => {
        if (isDashedSeparator(line)) {
          return <hr key={i} className="border-border my-3" />;
        }
        return (
          <div key={i} className={line.trim() === "" ? "h-3" : undefined}>
            <LinkifiedLine line={line} regex={urlRegex} />
          </div>
        );
      })}

      {/* Collapsed footer */}
      {footerLines.length > 0 && (
        <div className="mt-4">
          <button
            onClick={onToggleFooter}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", footerExpanded && "rotate-180")} />
            Email footer ({footerLines.filter((l) => l.trim()).length} lines)
          </button>
          {footerExpanded && (
            <div className="mt-2 pl-4 border-l-2 border-border text-muted-foreground/70 text-xs space-y-0.5">
              {footerLines.map((line, i) => (
                <div key={i}>
                  <LinkifiedLine line={line} regex={urlRegex} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Linkified Line ─────────────────────────────────────────────────────────────

function LinkifiedLine({ line, regex }: { line: string; regex: RegExp }) {
  const parts = line.split(regex);
  if (parts.length <= 1) return <>{line}</>;

  return (
    <>
      {parts.map((part, i) => {
        if (regex.test(part)) {
          return (
            <span key={i} className="inline-flex items-center gap-0.5">
              <a
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
                title={part}
              >
                {shortenUrl(part)}
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(part);
                }}
                className="inline-flex text-muted-foreground/50 hover:text-muted-foreground"
                title="Copy link"
              >
                <Copy className="w-3 h-3" />
              </button>
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
