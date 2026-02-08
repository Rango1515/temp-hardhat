import { useEffect, useRef } from "react";

const BLOCK_STORAGE_KEY = "waf_block_until";

/**
 * Lightweight public page tracker — fires a single request to voip-security
 * on mount to log the visit. No auth required.
 * If the WAF blocks the IP, redirects to the appropriate block page.
 * Uses localStorage to persist block state so refreshing can't bypass it.
 */
export function usePageTracker() {
  const hasFired = useRef(false);

  useEffect(() => {
    // ── Check localStorage first: if still blocked, redirect immediately ──
    const blockUntil = localStorage.getItem(BLOCK_STORAGE_KEY);
    if (blockUntil && Date.now() < parseInt(blockUntil, 10)) {
      window.location.href = "/blocked.html";
      return;
    } else if (blockUntil) {
      // Block expired, clean up
      localStorage.removeItem(BLOCK_STORAGE_KEY);
    }

    if (hasFired.current) return;
    hasFired.current = true;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-security?action=log-public`;

    const payload = JSON.stringify({
      page: window.location.pathname,
      hostname: window.location.hostname,
      origin: window.location.origin,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
    });

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        // Handle both the log-public "blocked" response and the 403 early-exit response
        if ((data?.status === "blocked" && data?.rule) || data?.blocked === true) {
          const rule = data.rule || "rate_limited";
          const duration = data.duration || 5;
          const ruleSlug = rule
            .toLowerCase()
            .replace(/\s*\(cross-isolate\)\s*/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-z_]/g, "");

          // Persist block in localStorage so refresh can't bypass
          const blockExpiry = Date.now() + duration * 60 * 1000;
          localStorage.setItem(BLOCK_STORAGE_KEY, String(blockExpiry));

          const params = new URLSearchParams({ rule: ruleSlug });
          if (duration) params.set("duration", String(duration));
          window.location.href = `/blocked.html?${params.toString()}`;
        }
      })
      .catch(() => {
        // Fire-and-forget — don't block the page if tracking fails
      });
  }, []);
}
