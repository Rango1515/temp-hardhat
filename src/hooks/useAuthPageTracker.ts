import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BLOCK_STORAGE_KEY = "waf_block_until";
const BLOCK_RULE_KEY = "waf_block_rule";
const BLOCK_DURATION_KEY = "waf_block_duration_min";

/**
 * Authenticated page tracker — fires on every page load / route change
 * to check WAF rules against the current IP. Unlike usePageTracker (public),
 * this one sends the auth token and fires on EVERY load (no hasFired guard),
 * so rapid F5 refreshes will actually accumulate hits in the WAF.
 *
 * If the WAF blocks the IP it redirects to /blocked.html.
 * Also checks localStorage on load to enforce existing blocks.
 */
export function useAuthPageTracker() {
  const location = useLocation();

  useEffect(() => {
    // ── Check localStorage first: if still blocked, redirect immediately ──
    const blockUntil = localStorage.getItem(BLOCK_STORAGE_KEY);
    if (blockUntil) {
      const expiryMs = parseInt(blockUntil, 10);
      if (Date.now() < expiryMs) {
        window.location.href = "/blocked.html";
        return;
      }
      // Block expired — clean up
      localStorage.removeItem(BLOCK_STORAGE_KEY);
      localStorage.removeItem(BLOCK_RULE_KEY);
      localStorage.removeItem(BLOCK_DURATION_KEY);
    }

    // ── Fire WAF check ──
    const currentToken = localStorage.getItem("voip_token");
    if (!currentToken) return; // Not logged in yet, nothing to track

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-security?action=log-request`;

    const payload = JSON.stringify({
      endpoint: `page:${location.pathname}`,
      method: "PAGE_LOAD",
      userAgent: navigator.userAgent,
    });

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: payload,
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        // If the WAF blocked this IP (either from log-request response or 403 early-exit)
        if (
          (data?.status === "suspicious" && data?.blocked === true) ||
          data?.blocked === true
        ) {
          const duration = data.duration || 1;
          const ruleName = data.rule || "";

          const blockExpiry = Date.now() + duration * 60 * 1000;
          localStorage.setItem(BLOCK_STORAGE_KEY, String(blockExpiry));
          localStorage.setItem(BLOCK_RULE_KEY, ruleName);
          localStorage.setItem(BLOCK_DURATION_KEY, String(duration));

          window.location.href = "/blocked.html";
        }
      })
      .catch(() => {
        // Fire-and-forget — don't break the app if tracking fails
      });
  }, [location.pathname]);
}
