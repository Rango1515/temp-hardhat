
# HardhatHosting Client Dashboard Implementation Plan

## Overview
This plan transforms the existing VoIP Portal into a fully-featured **HardhatHosting Client Dashboard** with lead management, secure dialing, role-based access control, and comprehensive analytics. The implementation focuses on security, atomic operations, and preventing duplicate leads.

---

## Phase 1: Branding Updates

### 1.1 UI Text Changes
Update branding across all client-facing pages:

| Location | Current | New |
|----------|---------|-----|
| Login page title | "VoIP Dialer Portal" | "HardhatHosting Client Login" |
| Sidebar header | "Client Portal" | "HardhatHosting Client Dashboard" |
| Mobile header | "Client Portal" | "Client Dashboard" |
| Dialer nav item | "Dialer" | "Client Dashboard" |
| Dashboard subtitle | "VoIP activity" | "Your calling activity" |

**Files to modify:**
- `src/pages/voip/Auth.tsx`
- `src/components/voip/layout/VoipSidebar.tsx`
- `src/components/voip/layout/VoipHeader.tsx`
- `src/pages/voip/ClientDashboard.tsx`

---

## Phase 2: Role-Based Access Control

### 2.1 Remove API Keys from Client Access

**Frontend changes:**
- Remove "API Keys" from `clientNavItems` in `VoipSidebar.tsx`
- Remove the route `/voip/api-keys` from client routes in `App.tsx`
- Create new `AdminApiKeys.tsx` page under admin routes

**Backend changes:**
- Update `voip-api-keys` edge function to verify admin role before any operation
- Return 403 Forbidden for non-admin users

### 2.2 Updated Navigation Structure

**Client sidebar:**
- Dashboard
- Dialer (leads + calling)
- Call History
- My Numbers
- Settings

**Admin sidebar (existing items + new):**
- Admin Dashboard
- Users
- Numbers
- Lead Upload (NEW)
- Analytics
- Requests
- Invite Tokens
- API Keys (moved here)
- Twilio Settings (NEW)

---

## Phase 3: Database Schema Changes

### 3.1 New Tables

```text
voip_leads
+-------------------+-------------------+----------------------------------------+
| Column            | Type              | Description                            |
+-------------------+-------------------+----------------------------------------+
| id                | SERIAL PRIMARY KEY| Lead identifier                        |
| name              | TEXT              | Contact name (nullable)                |
| phone             | TEXT NOT NULL     | E.164 phone number (unique index)      |
| email             | TEXT              | Email address (nullable, unique index) |
| website           | TEXT              | Website URL (nullable)                 |
| status            | TEXT NOT NULL     | NEW, ASSIGNED, COMPLETED, DNC          |
| assigned_to       | INTEGER           | FK to voip_users                       |
| assigned_at       | TIMESTAMPTZ       | When assigned                          |
| locked_until      | TIMESTAMPTZ       | Lock expiration                        |
| attempt_count     | INTEGER DEFAULT 0 | Call attempts made                     |
| upload_id         | INTEGER           | FK to voip_lead_uploads                |
| created_at        | TIMESTAMPTZ       | Created timestamp                      |
| updated_at        | TIMESTAMPTZ       | Updated timestamp                      |
+-------------------+-------------------+----------------------------------------+

voip_lead_uploads
+-------------------+-------------------+----------------------------------------+
| Column            | Type              | Description                            |
+-------------------+-------------------+----------------------------------------+
| id                | SERIAL PRIMARY KEY| Upload identifier                      |
| admin_id          | INTEGER NOT NULL  | FK to voip_users (admin who uploaded)  |
| filename          | TEXT NOT NULL     | Original filename                      |
| total_lines       | INTEGER           | Total lines in file                    |
| imported_count    | INTEGER           | Successfully imported                  |
| duplicate_count   | INTEGER           | Duplicates skipped                     |
| invalid_count     | INTEGER           | Invalid entries skipped                |
| created_at        | TIMESTAMPTZ       | Upload timestamp                       |
+-------------------+-------------------+----------------------------------------+

voip_call_logs (enhanced from voip_calls)
+-------------------+-------------------+----------------------------------------+
| Column            | Type              | Description                            |
+-------------------+-------------------+----------------------------------------+
| id                | SERIAL PRIMARY KEY| Call log identifier                    |
| lead_id           | INTEGER           | FK to voip_leads                       |
| worker_id         | INTEGER NOT NULL  | FK to voip_users                       |
| from_number       | TEXT NOT NULL     | Caller ID number                       |
| to_number         | TEXT NOT NULL     | Destination number                     |
| call_start        | TIMESTAMPTZ       | Call start time                        |
| call_end          | TIMESTAMPTZ       | Call end time                          |
| duration_seconds  | INTEGER           | Call duration                          |
| outcome           | TEXT              | Call disposition                       |
| notes             | TEXT              | Optional notes                         |
| followup_at       | TIMESTAMPTZ       | Scheduled follow-up                    |
| created_at        | TIMESTAMPTZ       | Record created                         |
+-------------------+-------------------+----------------------------------------+

voip_admin_audit_log
+-------------------+-------------------+----------------------------------------+
| Column            | Type              | Description                            |
+-------------------+-------------------+----------------------------------------+
| id                | SERIAL PRIMARY KEY| Log identifier                         |
| admin_id          | INTEGER NOT NULL  | FK to voip_users                       |
| action            | TEXT NOT NULL     | Action performed                       |
| entity_type       | TEXT              | leads, api_keys, twilio, etc.          |
| entity_id         | INTEGER           | Related entity ID                      |
| details           | JSONB             | Additional context                     |
| created_at        | TIMESTAMPTZ       | Action timestamp                       |
+-------------------+-------------------+----------------------------------------+

voip_twilio_config
+-------------------+-------------------+----------------------------------------+
| Column            | Type              | Description                            |
+-------------------+-------------------+----------------------------------------+
| id                | SERIAL PRIMARY KEY| Config identifier                      |
| account_sid       | TEXT              | Encrypted Twilio SID                   |
| auth_token        | TEXT              | Encrypted Twilio Auth Token            |
| outbound_number   | TEXT              | Outbound caller ID                     |
| is_active         | BOOLEAN           | Whether Twilio is enabled              |
| updated_by        | INTEGER           | Last admin who updated                 |
| updated_at        | TIMESTAMPTZ       | Last update time                       |
+-------------------+-------------------+----------------------------------------+

voip_worker_lead_history
+-------------------+-------------------+----------------------------------------+
| Column            | Type              | Description                            |
+-------------------+-------------------+----------------------------------------+
| id                | SERIAL PRIMARY KEY| History identifier                     |
| worker_id         | INTEGER NOT NULL  | FK to voip_users                       |
| lead_id           | INTEGER NOT NULL  | FK to voip_leads                       |
| created_at        | TIMESTAMPTZ       | When worker saw lead                   |
+-------------------+-------------------+----------------------------------------+
UNIQUE (worker_id, lead_id)
```

### 3.2 Indexes
- `voip_leads`: Unique index on `phone`
- `voip_leads`: Unique index on `email` where `email IS NOT NULL`
- `voip_leads`: Index on `status, assigned_to, locked_until` for assignment queries
- `voip_worker_lead_history`: Unique index on `(worker_id, lead_id)`

---

## Phase 4: Lead Upload System (Admin Only)

### 4.1 New Edge Function: `voip-leads`

**Endpoints:**
- `POST /upload` - Parse and import leads from file content
- `GET /uploads` - List all upload history
- `DELETE /lead?id=X` - Delete a lead (admin only)

**File Parsing Logic:**
1. Accept base64-encoded file content
2. Detect file type (.txt, .doc, .docx)
3. Parse line by line with `|` delimiter
4. Skip header if detected
5. For each line:
   - Extract name, phone, email, website
   - Treat `none`, `null`, `—`, empty as missing
   - Normalize phone to E.164 (strip symbols, add +1 if US)
   - Normalize email to lowercase
   - Normalize website (lowercase, add https:// if missing)
6. Check for duplicates by phone (primary) and email (secondary)
7. Insert non-duplicate leads with status `NEW`
8. Return summary: imported, duplicates, invalid

### 4.2 Admin Lead Upload UI

**New file:** `src/pages/voip/admin/LeadUpload.tsx`

Features:
- File upload (.txt, .doc, .docx)
- Preview table showing parsed leads before import
- Import button with confirmation
- Summary display after import
- Upload history table

---

## Phase 5: Lead Assignment System

### 5.1 Atomic Lead Assignment Edge Function

**Update:** `voip-leads` edge function

**Endpoint:** `POST /request-next`

**Logic (atomic with row locking):**
```text
1. Check rate limit (1 request per 5 seconds per worker)
2. BEGIN TRANSACTION
3. Release any expired locks (locked_until < now())
4. SELECT lead with status = 'NEW' 
   WHERE lead.id NOT IN (
     SELECT lead_id FROM voip_worker_lead_history 
     WHERE worker_id = current_worker
   )
   ORDER BY created_at ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED
5. If no lead found, ROLLBACK, return "No leads available"
6. UPDATE lead SET 
     status = 'ASSIGNED',
     assigned_to = worker_id,
     assigned_at = now(),
     locked_until = now() + interval '10 minutes'
7. INSERT INTO voip_worker_lead_history (worker_id, lead_id)
8. COMMIT
9. Return lead details
```

### 5.2 Auto-Release Mechanism
Leads automatically release when:
- `locked_until < now()` AND no call was made
- On each lead request, expired locks are cleared first

---

## Phase 6: Dialer Overhaul

### 6.1 Updated Dialer UI

**Modify:** `src/pages/voip/Dialer.tsx`

New layout:
```text
+------------------------------------------+
|          Request Next Lead [Button]       |
+------------------------------------------+
|  Current Lead:                            |
|  Name: John Smith (or "—")                |
|  Phone: +1 555-222-1111                   |
|  Email: john@gmail.com (or "None")        |
|  Website: johnroofing.com (or "None")     |
+------------------------------------------+
|          [Call Button]                    |
|          Call Timer: 0:00                 |
+------------------------------------------+
|  After Call - Select Outcome:             |
|  [ ] No Answer                            |
|  [ ] Voicemail                            |
|  [ ] Not Interested                       |
|  [ ] Interested                           |
|  [ ] Follow-up Scheduled                  |
|  [ ] Wrong Number                         |
|  [ ] Do Not Call                          |
|                                           |
|  Notes: [________________]                |
|  Follow-up: [Date picker]                 |
|                                           |
|  [Submit & Get Next Lead]                 |
+------------------------------------------+
```

### 6.2 Call Initiation
- Implement Twilio API integration in `voip-calls` edge function
- Use admin-configured Twilio credentials from `voip_twilio_config`
- If Twilio not configured, continue with simulation mode
- Auto-populate phone number from assigned lead

### 6.3 Outcome Processing

| Outcome | Lead Status | Notes |
|---------|-------------|-------|
| No Answer | If attempt_count < 2: stays ASSIGNED. If >= 2: COMPLETED | Increment attempt_count |
| Voicemail | Stays ASSIGNED | Increment attempt_count |
| Not Interested | COMPLETED | Lead finished |
| Interested | COMPLETED | Lead finished |
| Follow-up Scheduled | Stays ASSIGNED | Set followup_at |
| Wrong Number | COMPLETED | Lead finished |
| Do Not Call | DNC | Permanently blocked |

---

## Phase 7: Twilio Integration (Admin Settings)

### 7.1 New Edge Function: `voip-twilio`

**Endpoints:**
- `GET /config` - Get current config (masked tokens)
- `POST /config` - Update Twilio settings (admin only)
- `POST /test-call` - Initiate test call

### 7.2 Admin Twilio Settings Page

**New file:** `src/pages/voip/admin/TwilioSettings.tsx`

Features:
- Account SID input
- Auth Token input (masked)
- Outbound Number input
- Enable/Disable toggle
- Test Call button with phone number input
- Save button

---

## Phase 8: Analytics Overhaul

### 8.1 Remove Revenue Metrics

Update analytics endpoints and UI to remove:
- Total Revenue
- Total Cost
- Any $X.XX displays

### 8.2 New Analytics Metrics

**For Workers (their own stats only):**
- Calls made today/this week/total
- Outcomes breakdown (pie chart)
- Connect rate
- Average call duration
- Leads remaining in queue

**For Admins (system-wide):**
- Calls per day (bar chart)
- Call outcomes breakdown (pie chart)
- Connect rate over time
- Average call duration
- Leads: total, remaining, completed, DNC
- Calls per worker (table)

### 8.3 Files to Update
- `src/pages/voip/admin/AdminDashboard.tsx`
- `src/pages/voip/admin/Analytics.tsx`
- `src/pages/voip/ClientDashboard.tsx`
- `supabase/functions/voip-analytics/index.ts`

---

## Phase 9: Audit Logging

### 9.1 Actions to Log

| Action | Entity Type | Details |
|--------|-------------|---------|
| lead_upload | leads | filename, counts |
| lead_delete | leads | lead_id, phone |
| api_key_create | api_keys | key_id, name |
| api_key_delete | api_keys | key_id |
| twilio_config_update | twilio | fields changed |
| user_role_change | users | user_id, old_role, new_role |

### 9.2 Implementation
- Add audit logging to relevant edge functions
- Store in `voip_admin_audit_log` table
- Display in Admin Dashboard "Recent Activity" section

---

## Phase 10: Security Hardening

### 10.1 API Key Protection
- `voip-api-keys` function: Verify `role === 'admin'` on all operations
- Never return API key values to non-admins

### 10.2 Lead Access Control
- Workers can only access their assigned leads
- Workers cannot see leads assigned to others
- `voip_worker_lead_history` prevents repeat assignments

### 10.3 Rate Limiting
- Lead request: 1 per 5 seconds per worker
- Implement using in-memory or database-based tracking

---

## Technical Summary

### New Files to Create
| File | Purpose |
|------|---------|
| `src/pages/voip/admin/LeadUpload.tsx` | Admin lead upload UI |
| `src/pages/voip/admin/TwilioSettings.tsx` | Twilio configuration UI |
| `src/pages/voip/admin/AdminApiKeys.tsx` | Move API keys to admin |
| `supabase/functions/voip-leads/index.ts` | Lead management edge function |
| `supabase/functions/voip-twilio/index.ts` | Twilio config edge function |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/voip/Auth.tsx` | Branding update |
| `src/pages/voip/Dialer.tsx` | Lead-based dialing, outcomes |
| `src/pages/voip/ClientDashboard.tsx` | Remove revenue, branding |
| `src/components/voip/layout/VoipSidebar.tsx` | Navigation changes |
| `src/components/voip/layout/VoipHeader.tsx` | Branding |
| `src/App.tsx` | Route updates |
| `src/pages/voip/admin/AdminDashboard.tsx` | Analytics updates |
| `src/pages/voip/admin/Analytics.tsx` | Remove revenue, add new charts |
| `supabase/functions/voip-admin/index.ts` | Audit logging |
| `supabase/functions/voip-analytics/index.ts` | New metrics |
| `supabase/functions/voip-api-keys/index.ts` | Admin-only check |
| `supabase/functions/voip-calls/index.ts` | Twilio integration, outcomes |
| `supabase/config.toml` | New function configs |

### Database Migrations
1. Create `voip_leads` table with indexes
2. Create `voip_lead_uploads` table
3. Create `voip_admin_audit_log` table
4. Create `voip_twilio_config` table
5. Create `voip_worker_lead_history` table with unique constraint
6. Modify `voip_calls` to add lead_id, outcome, notes, followup_at

### Key Security Enforcements
- API keys: Admin-only at backend level
- Lead deduplication: Unique constraints + insert checks
- No repeat leads: `voip_worker_lead_history` tracking
- Atomic assignment: Database transactions with row locking
- Rate limiting: 5-second cooldown on lead requests
- Audit trail: All admin actions logged with timestamps (UTC)
