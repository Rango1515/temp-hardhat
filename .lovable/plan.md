

# Fix Security Monitor: Production Tracking, Auto-Refresh, and Copy IP

## Issues Identified

### 1. Track traffic from hardhathosting.work (production site)
The `usePageTracker` hook currently logs `window.location.pathname` but not the hostname. Since the same code runs on both the Lovable preview (lovable.app) and the production site (hardhathosting.work), all traffic is already being logged -- but the logs don't show WHICH domain the request came from. We need to include the hostname/origin in the log payload so you can see "hardhathosting.work" vs "lovable.app" traffic in the dashboard.

### 2. Timeline should auto-refresh every 20 seconds
Currently the dashboard auto-refreshes every 30 seconds (line 186 of SecurityMonitor.tsx). Change to 20 seconds.

### 3. Copy IP button triggers tab navigation
The `CopyIpButton` component is nested inside clickable parent elements:
- The "Top Traffic IP" stat card has `onClick={() => filterByIp(...)}`  on the Card
- Each row in "Top IPs (24h)" has `onClick={() => filterByIp(...)}`  on the row div

When you click the copy button, the click event bubbles up to the parent and triggers `filterByIp()`, which switches to the Traffic Logs tab. Fix: add `e.stopPropagation()` to the copy button click handler.

---

## Changes

### File 1: `src/hooks/usePageTracker.ts`
- Add `hostname: window.location.hostname` and `origin: window.location.origin` to the beacon payload
- This distinguishes traffic from hardhathosting.work vs lovable.app

### File 2: `supabase/functions/voip-security/index.ts`
- In the `log-public` handler, read the new `hostname` field from the payload
- Store it in the `referer` column (or `details` jsonb) of `voip_request_logs` so it appears in dashboards
- Update the dashboard query to include hostname data so the admin can see which domain traffic came from

### File 3: `src/pages/voip/admin/SecurityMonitor.tsx`
Three targeted fixes:

**A) CopyIpButton -- stop event propagation**
- Add `e.stopPropagation()` to the `copy()` handler so clicking "Copy" does NOT trigger the parent's `filterByIp` navigation

**B) Auto-refresh interval -- 20 seconds**
- Change the dashboard auto-refresh `setInterval` from `30000` to `20000`

**C) Top Traffic IP card -- separate copy from filter**
- Remove the `onClick={filterByIp}` from the Card wrapper
- Add a separate small "View Logs" button next to the IP for explicit navigation
- The CopyIpButton stays as a copy-only action

---

## Technical Details

### CopyIpButton fix (stop propagation)
```tsx
const copy = (e: React.MouseEvent) => {
  e.stopPropagation();
  navigator.clipboard.writeText(ip).then(() => {
    toast({ title: "Copied", description: ip });
  });
};
```

### Top IPs rows -- separate copy and filter
Each row in "Top IPs (24h)" will keep the `CopyIpButton` for copying, and add a separate "View" button that triggers `filterByIp`. Clicking the IP text copies it; clicking "View" navigates.

### Page tracker payload update
```typescript
const payload = JSON.stringify({
  page: window.location.pathname,
  hostname: window.location.hostname,
  referrer: document.referrer || null,
  userAgent: navigator.userAgent,
});
```

### Edge function -- store hostname
The `log-public` handler will write the hostname into the `referer` column of `voip_request_logs` (since public page visits don't have a traditional referer, this field is available). This means the Traffic Logs table will show "hardhathosting.work" as the origin for production traffic.

