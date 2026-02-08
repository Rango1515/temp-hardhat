import { useEffect, useRef } from "react";

const BLOCK_STORAGE_KEY = "waf_block_until";

/**
 * Lightweight public page tracker — fires a single request to voip-security
 * on mount to log the visit. No auth required.
 * If the WAF blocks the IP, sets localStorage and redirects to block page.
 * Also checks localStorage on load to prevent bypass via refresh.
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
        // Still blocked — redirect to block page (no API call = no extra request)
        window.location.href = "/blocked.html";
        return;
      }
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
          const duration = data.duration || 1; // minutes
          // Persist block in localStorage — this is the lock that survives refresh
          const blockExpiry = Date.now() + duration * 60 * 1000;
          localStorage.setItem(BLOCK_STORAGE_KEY, String(blockExpiry));
          window.location.href = "/blocked.html";
        }
      })
      .catch(() => {
        // Fire-and-forget — don't block the page if tracking fails
      });
  }, []);
}
