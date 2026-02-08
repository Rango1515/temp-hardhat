import { useEffect, useRef } from "react";

const BLOCK_STORAGE_KEY = "waf_block_until";
const BLOCK_RULE_KEY = "waf_block_rule";
const BLOCK_DURATION_KEY = "waf_block_duration_min";

/**
 * Lightweight public page tracker — fires a single request to voip-security
 * on mount to log the visit. No auth required.
 * If the WAF blocks the IP, stores block info in localStorage and redirects
 * to the SINGLE canonical block page (/blocked.html).
 * Also checks localStorage on load to prevent bypass via refresh or new tab.
 */
export function usePageTracker() {
  const hasFired = useRef(false);

  useEffect(() => {
    // ── Check localStorage first: if still blocked, redirect immediately ──
    // This is the PRIMARY enforcement — no API call needed, can't be bypassed
    const blockUntil = localStorage.getItem(BLOCK_STORAGE_KEY);
    if (blockUntil) {
      const expiryMs = parseInt(blockUntil, 10);
      if (Date.now() < expiryMs) {
        // Still blocked — redirect to the SAME canonical block page
        // No API call = no extra request = no re-trigger
        window.location.href = "/blocked.html";
        return;
      }
      // Block expired, clean up all block keys
      localStorage.removeItem(BLOCK_STORAGE_KEY);
      localStorage.removeItem(BLOCK_RULE_KEY);
      localStorage.removeItem(BLOCK_DURATION_KEY);
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
          const duration = data.duration || 1; // minutes
          const ruleName = data.rule || "";

          // Persist ALL block info in localStorage — this is the lock that survives
          // refresh, page navigation, new tabs, everything
          const blockExpiry = Date.now() + duration * 60 * 1000;
          localStorage.setItem(BLOCK_STORAGE_KEY, String(blockExpiry));
          localStorage.setItem(BLOCK_RULE_KEY, ruleName);
          localStorage.setItem(BLOCK_DURATION_KEY, String(duration));

          // Always redirect to the ONE canonical block page
          window.location.href = "/blocked.html";
        }
      })
      .catch(() => {
        // Fire-and-forget — don't block the page if tracking fails
      });
  }, []);
}
