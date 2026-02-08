

# Harden WAF Against DDoS Attacks + Speed Up Website

## Overview

Two areas to address: (1) making the WAF actually block DDoS attacks like HTTP floods, TLS floods, and rapid refreshing, and (2) making the website load and feel faster.

---

## Part 1: WAF Hardening Against DDoS / Flood Attacks

### Current Gap

The WAF rules exist in the database but have a critical weakness: **in-memory counters reset on every cold start** of the edge function. Supabase edge functions spin up multiple isolates and can cold-start frequently, meaning a flood attack will spread across isolates and each one starts counting from zero. This makes the rate limiter mostly ineffective against real attacks.

### Fixes

**A) Add a database-backed rate counter as a fallback**
- After the in-memory check, also query `voip_request_logs` to count recent requests from the same IP within the WAF rule window
- This catches attackers across isolate restarts and multiple edge workers
- Only do this heavier check if the in-memory counter shows more than 50% of the threshold (avoids unnecessary DB queries for normal traffic)

**B) Early-exit blocked IP check with response caching**
- Move the blocked IP check to the very top of the handler (before parsing JSON body)
- Return a minimal static `403 Forbidden` response for blocked IPs (no JSON parsing, no DB calls)
- This makes blocked IP responses near-instant and saves compute

**C) Add a "Connection Flood" WAF rule**
- Create a new default WAF rule: "Connection Flood" -- more than 20 requests in 5 seconds from one IP triggers a 5-minute block
- This catches the rapid F5-refresh / automated tool attacks shown in the screenshot

**D) Add "TLS Fingerprint" tracking**
- Store the `user-agent` + IP combination as a fingerprint
- When the same fingerprint exceeds thresholds even faster than the normal rate limit, treat it as an automated tool
- Log it with a specific `rule_triggered` value like "automated_tool_detected"

**E) Add progressive block escalation**
- If an IP gets auto-blocked more than twice in 24 hours, double the block duration each time
- After 3 auto-blocks, escalate to a 24-hour block
- This prevents the "refresh flood, wait for block to expire, repeat" pattern

### Files Changed
- `supabase/functions/voip-security/index.ts` -- all WAF logic changes
- Database migration -- add the new "Connection Flood" WAF rule

---

## Part 2: Website Speed Improvements

### Current Bottlenecks Identified

1. **Google Fonts loaded synchronously** -- `@import url('https://fonts.googleapis.com/css2?...')` in `index.css` blocks rendering until the font CSS is downloaded
2. **Hero image is a large JPG imported as ES module** -- `hero-construction.jpg` loads synchronously and blocks first paint
3. **VoipAuthProvider wraps the entire app** including public pages -- public visitors (hardhathosting.work) still run token checks, heartbeats, and idle detection even though they don't need authentication
4. **Too many IntersectionObservers** -- each `AnimatedSection` creates its own observer instead of sharing one

### Fixes

**A) Move Google Fonts to HTML `<link>` with preconnect (non-blocking)**
- Remove the `@import` from `index.css`
- Add `<link rel="preconnect">` and `<link rel="stylesheet">` with `display=swap` to `index.html`
- This prevents render-blocking on font load

**B) Lazy-load the hero image**
- Add `loading="lazy"` or use CSS `background-image` for the hero
- Add `fetchpriority="high"` and `decoding="async"` to optimize the critical image
- Consider adding a low-quality placeholder while loading

**C) Skip auth overhead on public pages**
- The `VoipAuthProvider` currently wraps everything and runs heartbeats + idle detection on every page
- These effects already guard with `if (!token || !user) return;`, so the overhead is minimal, but we can further optimize by deferring the initial localStorage parse and reducing re-renders

**D) Reduce animation overhead**
- Add `will-change: transform, opacity` only during animation (already present)
- Use a shared `IntersectionObserver` for all animated sections to reduce observer count

### Files Changed
- `index.html` -- add preconnect + stylesheet links for Google Fonts
- `src/index.css` -- remove the `@import` for Google Fonts
- `src/components/Hero.tsx` -- add image optimization attributes
- `src/hooks/useScrollAnimation.ts` -- (optional) share a single observer instance

---

## Technical Details

### Database-backed rate counting (edge function)
```typescript
// After in-memory check, verify with DB for cross-isolate accuracy
async function getDbHitCount(ip: string, windowSeconds: number): Promise<number> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await supabase
    .from("voip_request_logs")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("timestamp", since);
  return count || 0;
}
```

### Progressive block escalation
```typescript
// Check how many times this IP was blocked in last 24h
const { count: priorBlocks } = await supabase
  .from("voip_blocked_ips")
  .select("*", { count: "exact", head: true })
  .eq("ip_address", ip)
  .gte("blocked_at", twentyFourHoursAgo);

// Escalate: 2x for each prior block, max 24 hours
const escalationFactor = Math.min(Math.pow(2, priorBlocks || 0), 24 * 60 / rule.block_duration_minutes);
const actualDuration = rule.block_duration_minutes * escalationFactor;
```

### Early-exit for blocked IPs (before JSON parsing)
```typescript
// At the very top of serve(), before action routing
const reqIp = extractIp(req);
if (await isIpBlocked(reqIp)) {
  return new Response("Forbidden", { status: 403, headers: corsHeaders });
}
```

### Font loading optimization (index.html)
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap" rel="stylesheet" />
```

### Hero image optimization
```tsx
<img
  src={heroImage}
  alt="Construction site"
  className="w-full h-full object-cover"
  fetchPriority="high"
  decoding="async"
/>
```

### New WAF Rule (migration)
```sql
INSERT INTO voip_waf_rules (name, description, rule_type, max_requests, time_window_seconds, block_duration_minutes, scope, enabled)
VALUES ('Connection Flood', 'More than 20 requests in 5 seconds from one IP', 'rate_limit', 20, 5, 5, 'all', true);
```

---

## Summary of All File Changes

| File | Change |
|------|--------|
| `supabase/functions/voip-security/index.ts` | Early-exit blocked IPs, DB-backed rate counting, progressive escalation, cross-isolate accuracy |
| `index.html` | Add font preconnect + stylesheet links |
| `src/index.css` | Remove `@import` for Google Fonts |
| `src/components/Hero.tsx` | Add `fetchPriority="high"` and `decoding="async"` to hero image |
| Database migration | Add "Connection Flood" WAF rule (20 req / 5s) |

