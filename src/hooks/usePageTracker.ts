import { useEffect, useRef } from "react";

/**
 * Lightweight public page tracker — fires a single request to voip-security
 * on mount to log the visit. No auth required.
 * If the WAF blocks the IP, redirects to the appropriate block page.
 */
export function usePageTracker() {
  const hasFired = useRef(false);

  useEffect(() => {
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

    // Use fetch instead of sendBeacon so we can read the response
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "blocked" && data?.rule) {
          // Redirect to the WAF block page with the rule name
          const ruleSlug = data.rule
            .toLowerCase()
            .replace(/\s*\(cross-isolate\)\s*/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-z_]/g, "");
          const duration = data.duration || "";
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
