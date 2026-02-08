

# WAF Overhaul: Lenient Rules, Friendly Block Page, Timeline Fix, and Escalation System

## Problem Summary

1. **WAF rules are too strict** -- the "Rate Flood" rule triggers at just 10 requests per 100 seconds, meaning normal browsing can trigger a block. The "Connection Flood" triggers at 20 requests per 5 seconds, which is also too aggressive for page navigation.
2. **Block page is harsh** -- shows "403 Access Blocked" with long durations. Normal users who accidentally trip a rule get treated like attackers.
3. **"All Time" graph is broken** -- the timeline query caps at 1,000 rows and uses 7 days max. The time key normalization collapses all dates into `HH:mm` format, so multi-day data overlaps onto the same time slots, flattening the chart.
4. **Escalation system exists in code** but lacks visibility -- there's no way to filter escalated events in the dashboard, no visual indicator, and no dedicated section.

---

## 1. Fix WAF Rules (Database Update)

Update the `voip_waf_rules` table to use sensible thresholds that won't block normal users:

| Rule | Current | New | Rationale |
|------|---------|-----|-----------|
| Rate Flood (id=1) | 10 req / 100s, block 1m | **100 req / 10s**, block 1m | Only triggers on genuine floods (~10 req/sec sustained) |
| Sustained Flood (id=2) | 300 req / 60s, block 60m | **500 req / 60s**, block 30m | Higher bar, shorter punishment |
| Brute Force Login (id=3) | 15 fails / 120s, block 15m | **10 fails / 120s**, block 15m | Tighten login protection (strict) |
| Sensitive Endpoint Abuse (id=4) | 30 req / 30s, block 15m | **60 req / 30s**, block 10m | Moderate for API endpoints |
| Connection Flood (id=5) | 20 req / 5s, block 5m | **50 req / 5s**, block 1m | Only true floods, short cooldown |

Additionally, in the edge function:
- Skip WAF checks entirely for `PAGE_LOAD` requests from authenticated users (browsing pages should never trigger blocks)
- Only count API calls and public page visits toward rate limits
- Reduce the fingerprint threshold from 15 to 30 requests in 5 seconds

## 2. Friendly Block Page + Short Cooldowns

Update `public/blocked.html`:
- Change the default title/heading to a friendlier tone: "Whoa, slow down!" instead of "Access Temporarily Blocked"
- Show the message: "Too many requests detected. Please wait a moment and try again."
- For short blocks (under 2 minutes), show a simplified view with just the countdown and a retry button
- Auto-redirect home as soon as the countdown expires (already partially implemented)
- Remove the aggressive "navigation lock" (`beforeunload` trap) for short blocks -- only keep it for blocks over 5 minutes

Update block durations in the edge function:
- Default first-offense auto-blocks start at **30 seconds to 1 minute** (not 5-15 minutes)
- Escalation still increases duration for repeat offenders

## 3. Fix the "All Time" Timeline Graph

The current issues:
- The query uses `.limit(1000)` which truncates data for busy periods
- All time ranges normalize to `HH:mm` format, so multi-day "All Time" data collapses into 24 hours
- "All Time" only looks back 7 days

Fixes in the edge function (`dashboard` action):
- For "All Time" range, bucket by **day** (not hour) and use `YYYY-MM-DD` as the key
- For "24h" range, bucket by **hour** and use `YYYY-MM-DDTHH` as the key
- Increase the query limit to 5,000 for "all" range to capture more data
- Return the full ISO timestamp so the frontend can display dates properly

Fixes in the frontend (`SecurityMonitor.tsx`):
- Update the `normalizeTime` function to handle day-level buckets for "All Time"
- Show date labels (e.g., "Feb 5", "Feb 6") on the X-axis for "All Time" instead of hours
- Add a "No data" fallback state
- Add loading indicator when switching ranges

## 4. Escalation System Improvements

The escalation logic already exists in `getEscalatedDuration()` (doubling block time for repeat offenders, capping at 24h). What's missing is visibility.

### Backend changes (edge function):
- Add an `escalated` filter to the `traffic-logs` action so you can query `?status=escalated`
- In the `dashboard` action, add an `escalatedCount` field counting blocks where duration was escalated
- Mark security log entries with `status: "escalated"` when the block duration exceeds the base duration

### Frontend changes (SecurityMonitor.tsx):
- Add "Escalated" as a filter option in the traffic logs dropdown (alongside All, Suspicious, Blocked)
- Add an "Escalated" stat card showing the count of escalated blocks
- In the Recent Security Alerts card, show an "ESCALATED" badge (in red) on entries where `details.escalated === true`
- In the Blocked IPs list, show an "Escalated" badge when the block reason contains "escalated"

---

## Technical Details

### Files to modify:

1. **Database** -- SQL update to `voip_waf_rules` table (5 UPDATE statements to adjust thresholds)

2. **`supabase/functions/voip-security/index.ts`**:
   - `log-request` handler: skip WAF check when method is `PAGE_LOAD` (browsing pages should not count toward rate limits)
   - `dashboard` handler: fix timeline bucketing for "all" range (use day-level buckets), increase query limit, add `escalatedCount`
   - `traffic-logs` handler: add `escalated` status filter
   - `blockIp()` function: use `status: "escalated"` in security logs when duration is escalated
   - Fingerprint threshold: increase from 15 to 30

3. **`public/blocked.html`**:
   - Friendlier default messaging
   - Simplified view for short blocks (under 2 minutes)
   - Remove navigation lock for short blocks
   - Auto-retry button that checks server status

4. **`src/pages/voip/admin/SecurityMonitor.tsx`**:
   - Timeline chart: handle day-level keys for "All Time", format X-axis labels by range
   - Add "Escalated" filter option to traffic logs
   - Add escalated count stat card
   - Show escalated badges on alerts and blocked IPs
   - Add loading state when switching timeline ranges

5. **`src/hooks/useAuthPageTracker.ts`**:
   - Change the endpoint method from `PAGE_LOAD` to a distinct non-WAF-counted type, or skip the WAF entirely for page navigation

