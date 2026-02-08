import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BLOCK_STORAGE_KEY = "waf_block_until";
const BLOCK_RULE_KEY = "waf_block_rule";
const BLOCK_DURATION_KEY = "waf_block_duration_min";

/**
 * Authenticated page tracker — fires on every route change.
 * Sends PAGE_LOAD method which the backend skips for WAF counting,
 * so normal page navigation will NEVER trigger rate-limit blocks.
 *
 * If the WAF blocks the IP on a separate API call, it redirects to /blocked.html.
 * Also checks localStorage on load to enforce existing blocks.
 */
export function useAuthPageTracker() {
  const location = useLocation();

  useEffect(() => {
    // ── Check localStorage first: if still blocked, redirect ──
    const blockUntil = localStorage.getItem(BLOCK_STORAGE_KEY);
    if (blockUntil) {
      const expiryMs = parseInt(blockUntil, 10);
      const msRemaining = expiryMs - Date.now();
      
      if (msRemaining > 5000) {
        // Only redirect if block has more than 5 seconds remaining
        // This prevents redirect loops when block is about to expire
        window.location.href = "/blocked.html";
        return;
      }
      if (msRemaining <= 0) {
        // Block fully expired — clean up
        localStorage.removeItem(BLOCK_STORAGE_KEY);
        localStorage.removeItem(BLOCK_RULE_KEY);
        localStorage.removeItem(BLOCK_DURATION_KEY);
      }
      // If between 0-5s remaining, don't redirect — let it expire naturally
    }

    // ── Fire page load log (skipped by WAF — no blocking risk) ──
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
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.blocked) {
          // WAF triggered — save block info and redirect
          const durationMin = data.duration || 1;
          const expiryMs = Date.now() + durationMin * 60 * 1000;
          localStorage.setItem(BLOCK_STORAGE_KEY, expiryMs.toString());
          localStorage.setItem(BLOCK_RULE_KEY, data.rule || "rate_limit");
          localStorage.setItem(BLOCK_DURATION_KEY, durationMin.toString());
          window.location.href = "/blocked.html";
        }
      })
      .catch(() => {
        // Fire-and-forget — don't break the app if tracking fails
      });
  }, [location.pathname]);
}
