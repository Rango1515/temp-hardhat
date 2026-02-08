import { useEffect, useRef } from "react";

/**
 * Lightweight public page tracker — fires a single beacon to voip-security
 * on mount to log the visit. No auth required. Fire-and-forget.
 */
export function usePageTracker() {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-security?action=log-public`;

    // Use sendBeacon for minimal impact, fall back to fetch
    const payload = JSON.stringify({
      page: window.location.pathname,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);
}
