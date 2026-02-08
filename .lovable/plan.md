

# Security Monitor - Implementation Plan

## Overview
Add a new "Security Monitor" admin tab that tracks request patterns, detects suspicious activity (possible Layer 7 attacks), and gives admins tools to respond (block IPs, rate limit endpoints). All security events are logged to new database tables.

---

## 1. Database Tables (Migration)

Two new tables will be created:

### `voip_security_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| timestamp | timestamptz | Default now() |
| ip_address | text | Request origin IP |
| endpoint | text | Route/function hit |
| request_count | integer | Aggregated count in window |
| user_agent | text | Browser/bot identifier |
| status | text | `normal`, `suspicious`, `blocked` |
| user_id | integer | Nullable - linked user if authenticated |
| rule_triggered | text | Which detection rule fired |
| details | jsonb | Extra metadata (failed login info, etc.) |
| created_at | timestamptz | Default now() |

### `voip_blocked_ips`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| ip_address | text | Blocked IP |
| reason | text | Why it was blocked |
| blocked_by | integer | Admin who blocked it |
| blocked_at | timestamptz | Default now() |
| expires_at | timestamptz | When the block lifts (null = permanent) |
| status | text | `active`, `expired`, `manual_unblock` |
| created_at | timestamptz | Default now() |

Both tables will have RLS enabled (consistent with all other voip_ tables). Access is via service-role edge functions only.

---

## 2. Backend: New Edge Function `voip-security`

A new edge function that handles all security monitoring logic:

### Actions (admin-only unless noted):

**`log-request`** (POST, available to all authenticated users)
- Called by the frontend API hook to log every request
- Records: IP (from headers), endpoint, user agent, user ID
- Runs detection rules in real-time:
  - **Rule 1**: More than 50 requests from same IP in 10 seconds --> mark `suspicious`
  - **Rule 2**: More than 10 failed logins in 1 minute --> mark `suspicious`
  - **Rule 3**: Repeated hits to sensitive routes (`voip-leads`, `voip-auth`) from same IP in short window --> mark `suspicious`
- If IP is in `voip_blocked_ips` (active, not expired), return a `blocked` indicator

**`dashboard`** (GET, admin-only)
- Returns aggregated security stats:
  - Total requests tracked (last 24h)
  - Suspicious events count
  - Currently blocked IPs count
  - Top offending IPs (by request volume)
  - Recent suspicious events (last 20)
  - Attack timeline data (requests per minute, last hour)

**`logs`** (GET, admin-only)
- Paginated security logs with filters (status, IP, endpoint)

**`block-ip`** (POST, admin-only)
- Adds an IP to `voip_blocked_ips` with configurable duration (15 min, 1 hour, 24 hours, permanent)
- Logs the action to the audit log

**`unblock-ip`** (POST, admin-only)
- Sets status to `manual_unblock` on a blocked IP

**`blocked-ips`** (GET, admin-only)
- Lists all currently blocked IPs

**`clear-logs`** (DELETE, admin-only)
- Purges old security logs

### Detection Logic (runs inside `log-request`):
```text
1. Count recent requests from this IP in last 10 seconds
2. If count > 50 --> insert as "suspicious", rule = "rate_flood"
3. Check failed login count from this IP in last 60 seconds
4. If count > 10 --> insert as "suspicious", rule = "brute_force"
5. Check if IP hit sensitive endpoints > 20 times in 30 seconds
6. If yes --> insert as "suspicious", rule = "endpoint_abuse"
7. Check if IP is blocked --> return blocked status
```

---

## 3. Frontend: Request Tracking Integration

Modify `src/hooks/useVoipApi.ts` to send a lightweight background log for each API call:
- Fire-and-forget POST to `voip-security?action=log-request`
- Include: endpoint, method, user agent, timestamp
- Use a similar inflight guard to prevent recursion (don't log the security logging call itself)
- Throttled: at most one log per 2 seconds to avoid creating the very traffic pattern we're trying to detect

---

## 4. Frontend: Security Monitor Page

New file: `src/pages/voip/admin/SecurityMonitor.tsx`

### Layout sections:

**Attack Alert Banner** (top of page, conditional)
- Red/orange banner shown only when suspicious events detected in last 5 minutes
- Shows: "Possible DDoS / Bot Attack Detected" with IP and endpoint details
- Includes quick-action buttons: "Block IP for 15 min", "View Details"

**Stats Cards Row**
- Total Requests (24h)
- Suspicious Events
- Blocked IPs (active)
- Top Threat IP

**Traffic Timeline Chart**
- Recharts area/line chart showing requests per minute for the last hour
- Suspicious events highlighted in red

**Security Logs Table**
- Filterable by status (all / suspicious / blocked)
- Columns: Time, IP Address, Endpoint, Request Count, User Agent, Status, Rule
- Pagination (reuses existing pattern from AuditLog)

**Blocked IPs Card**
- List of currently blocked IPs with reason, expiry, and "Unblock" button
- "Block IP" form to manually add an IP

**Auto-Response Options Panel**
- "Block IP for 15 minutes" button (per-IP from logs)
- "Rate limit this endpoint" toggle (saves a flag; edge function checks it)
- "Require CAPTCHA on login" toggle (saves to a settings row; auth function checks it)
- These are presented as action buttons on suspicious log entries

---

## 5. Routing and Navigation

### App.tsx
- Add lazy import for `SecurityMonitor`
- Add route: `/voip/admin/security` wrapped in `AdminRoute`

### VoipSidebar.tsx
- Add nav item with `Shield` icon: `{ href: "/voip/admin/security", label: "Security Monitor", icon: Shield }`
- Position it in the admin section near the Audit Log entry
- Add a badge indicator that shows count of suspicious events (polled alongside tickets/followups)

### config.toml
- Add `[functions.voip-security]` with `verify_jwt = false` (JWT validated in code)

---

## 6. Notification System

**Dashboard Alert**: The attack banner on the Security Monitor page auto-refreshes every 30 seconds. If new suspicious events are found, a toast notification fires on any admin page.

**Optional Webhook**: The `voip-security` edge function can POST to a configured webhook URL (stored as a Supabase secret) when an attack is detected. This is optional and can be configured later without code changes.

---

## 7. Master Reset Integration

The existing master reset in `voip-admin-ext` will be updated to also clear:
- `voip_security_logs`
- `voip_blocked_ips`

---

## Technical Details

### Files to Create:
1. `supabase/functions/voip-security/index.ts` - New edge function
2. `src/pages/voip/admin/SecurityMonitor.tsx` - New admin page

### Files to Modify:
1. `src/App.tsx` - Add route + lazy import
2. `src/components/voip/layout/VoipSidebar.tsx` - Add nav item + badge
3. `src/hooks/useVoipApi.ts` - Add request logging call
4. `supabase/config.toml` - Add function entry
5. `supabase/functions/voip-admin-ext/index.ts` - Add tables to master reset

### Database Migration:
- Create `voip_security_logs` and `voip_blocked_ips` tables with RLS enabled

### No New Secrets Required:
- All functionality uses existing database and JWT infrastructure

