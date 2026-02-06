
# VoIP System Enhancement Plan

## Overview
This plan covers 8 features: dynamic lead categories with search, analytics fixes, admin dashboard improvements, timer reset behavior, TextNow auto-open, and a "How To?" guide page.

---

## 1. Dynamic Lead Categories with Search + Landscapers

### What Changes
- Remove the hard-coded `LEAD_CATEGORIES` array from `src/lib/leadCategories.ts`
- Update `category-counts` backend action to return ALL distinct categories from the `voip_leads` table (not just known ones), with their available (NEW status) counts
- Update `src/pages/voip/Dialer.tsx` to:
  - Fetch categories dynamically from the API instead of using the static list
  - Replace the `<Select>` dropdown with a searchable `<Command>` (cmdk) popover that filters categories live as the user types
  - Show "No matches. Request admin to upload leads for: [typed value]" when search has no results
  - "Landscapers" will automatically appear once an admin uploads leads with that category
- Add "landscapers" as a default option in the `LeadUpload.tsx` category selector
- Keep `leadCategories.ts` as a fallback label map, but the dropdown is driven by DB data

### Files to Edit
- `src/lib/leadCategories.ts` -- add "landscapers" to the static label map, add a helper that returns labels for dynamic categories
- `supabase/functions/voip-leads/index.ts` -- update `category-counts` action to return distinct categories from DB
- `src/pages/voip/Dialer.tsx` -- replace Select with searchable Command popover, fetch categories dynamically
- `src/pages/voip/admin/LeadUpload.tsx` -- add "Landscapers" to the upload category selector

---

## 2. Fix Analytics (Client + Admin) -- Compute from Real Data

### Current Problem
Analytics rely on `voip_activity_events` for "leads requested" and "leads completed" counts. These events are tracked separately and can get out of sync. The actual source of truth is:
- `voip_calls` table (each call outcome = one record)
- `voip_worker_lead_history` table (each lead assignment = one record)
- `voip_leads` table (lead status)

### What Changes
**Backend (`voip-analytics`):**
- Rewrite `my-stats` action to compute stats directly from `voip_calls` and `voip_worker_lead_history`:
  - **Leads Requested** = count of rows in `voip_worker_lead_history` for that user
  - **Leads Completed** = count of `voip_calls` with a final outcome (no_answer, not_interested, voicemail, interested, dnc, wrong_number, followup)
  - **Completion Rate** = Completed / Requested
  - **Appointments** = count of `voip_calls` where `appointment_created = true`
  - **Conversion Rate** = Appointments / Interested outcomes (tooltip: "Appointments / Interested leads")
  - **Avg Time/Lead** = average `session_duration_seconds` from `voip_calls` where session_duration > 0
- Rewrite `admin-stats` action using the same logic but across all users
- Rewrite `user-performance` action to use the same source-of-truth tables
- Rewrite `leaderboard` action to use `voip_calls` directly (it already does, but ensure appointment counts are correct)

**Ensure call logging is complete:**
- In the `complete` action of `voip-leads`, verify `session_duration_seconds` is stored (it's already being passed from the frontend but the insert needs to include it -- currently it's missing from the insert!)
- Add `session_duration_seconds` to the voip_calls insert in the `complete` action

**Frontend pages (no logic changes needed, just verify data flows):**
- `MyAnalytics.tsx` -- already displays the right fields; data will now be correct
- `Analytics.tsx` (Admin) -- already wired; data will now be correct
- `ClientAnalytics.tsx` -- already has the performance table; data will now be correct
- `Leaderboard.tsx` -- already wired; data will now be correct

### Files to Edit
- `supabase/functions/voip-analytics/index.ts` -- rewrite `my-stats`, `admin-stats`, `user-performance` to use real tables
- `supabase/functions/voip-leads/index.ts` -- add `session_duration_seconds` to the `complete` action insert

---

## 3. Fix Admin Dashboard + Add Analytics

### Current Problem
The Admin Dashboard calls `voip-admin-ext?action=analytics` which only returns basic counts (users, calls, numbers). It doesn't show call volume trends, recent activity, or user performance data.

### What Changes
- Update the `analytics` action in `voip-admin-ext` to also return:
  - Recent activity from `voip_admin_audit_log` (last 10 entries with user names)
  - Daily call volume for the last 30 days from `voip_calls`
  - Available leads count from `voip_leads` where status = 'NEW'
- Update `AdminDashboard.tsx` to:
  - Add "Available Leads" stat card
  - Show call outcomes breakdown (reuse admin-stats data)
  - Show a mini leaderboard (top 5 users by calls)
  - Fetch data from both `voip-admin-ext?action=analytics` (for system counts) and `voip-analytics?action=admin-stats` (for call analytics) in parallel

### Files to Edit
- `supabase/functions/voip-admin-ext/index.ts` -- enhance `analytics` action with recent activity + daily calls + available leads
- `src/pages/voip/admin/AdminDashboard.tsx` -- add analytics cards, call volume chart, outcomes breakdown, mini leaderboard

---

## 4. Call Timer: Reset on Each New Lead

### Current Behavior
Timer persists across lead requests (by design per previous requirement). Now the user wants it to reset each time.

### What Changes
- In `Dialer.tsx`, when `requestNextLead` is called and a lead is successfully assigned:
  - Reset `sessionStartTime` to `Date.now()` immediately
  - Set `hasStartedSession` to `true`
  - This makes the timer auto-start at 00:00 when a new lead arrives
- Remove the dependency on "Open TextNow" to start the timer -- timer starts on lead assignment
- Timer stops when outcome is submitted (already works)

### Files to Edit
- `src/pages/voip/Dialer.tsx` -- modify `requestNextLead` success handler to set sessionStartTime = Date.now()

---

## 5. TextNow: Auto-Open on Every New Lead

### What Changes
- In `Dialer.tsx`, after a lead is successfully assigned in `requestNextLead`:
  - Programmatically trigger TextNow open/focus
  - Pass a ref or callback to `CallTools` to trigger the open
- In `CallTools.tsx`:
  - Expose an `openTextNow` method via `useImperativeHandle` or accept a trigger prop
  - If popup is blocked, show a persistent warning banner at the top of the Call Tools card
- Track popup blocked state and show a small banner: "Popup blocked -- allow popups for this site to auto-open TextNow"

### Files to Edit
- `src/components/voip/dialer/CallTools.tsx` -- expose open method via ref, add popup-blocked banner
- `src/pages/voip/Dialer.tsx` -- call CallTools open on lead assignment

---

## 6. Add "How To?" Client Tab

### What Changes
- Create a new page `src/pages/voip/HowTo.tsx` with:
  - A clean card layout with the cold call script
  - Sections: Intro, Reason, Value, Hook Question, Offer, Close
  - Objections handling section
  - "Copy Script" button that copies the full script to clipboard
  - DNC compliance note
- Add route `/voip/how-to` in `App.tsx`
- Add "How To?" nav item in `VoipSidebar.tsx` under the CLIENT section (after "Support", before "Leaderboard")

### Files to Create/Edit
- `src/pages/voip/HowTo.tsx` -- new page
- `src/App.tsx` -- add route
- `src/components/voip/layout/VoipSidebar.tsx` -- add nav item

---

## Technical Details

### Backend Changes Summary

**`voip-leads/index.ts` (complete action):**
```text
// Add session_duration_seconds to the voip_calls insert:
await supabase.from("voip_calls").insert({
  ...existing fields...,
  session_duration_seconds: sessionDurationSeconds || 0,
});
```

**`voip-leads/index.ts` (category-counts action):**
```text
// Query all distinct categories from voip_leads where status = 'NEW'
// Return: { counts: { electricians: 24, landscapers: 10, ... } }
// Also return the full list of distinct categories (including those with 0 NEW leads)
```

**`voip-analytics/index.ts` (my-stats):**
```text
// Leads Requested = COUNT from voip_worker_lead_history WHERE worker_id = userId
// Leads Completed = COUNT from voip_calls WHERE user_id = userId AND outcome IS NOT NULL
// Completion Rate = Completed / Requested
// Appointments = COUNT from voip_calls WHERE appointment_created = true
// Conversion Rate = Appointments / COUNT(outcome = 'interested')
// Avg Time/Lead = AVG(session_duration_seconds) WHERE session_duration_seconds > 0
```

**`voip-admin-ext/index.ts` (analytics):**
```text
// Add: available leads count, recent audit log entries (last 10), daily call volume (30 days)
```

### Frontend Changes Summary

**Dialer.tsx -- Searchable Category Selector:**
- Replace `<Select>` with a `<Popover>` + `<Command>` (from cmdk, already installed)
- Command input filters categories dynamically
- Empty state: "No matches. Request admin to upload leads for: [search term]"

**Dialer.tsx -- Timer + TextNow on lead request:**
- On successful lead assignment: set `sessionStartTime = Date.now()`, call `callToolsRef.current?.openTextNow()`
- Remove the "click Open TextNow to start timer" instruction

**AdminDashboard.tsx:**
- Fetch both admin-ext analytics and voip-analytics admin-stats in parallel
- Display: system stats + call volume chart + outcomes breakdown + recent activity + mini leaderboard

### Data Flow for Analytics

```text
Worker clicks "Request Next Lead"
  -> voip_worker_lead_history gets a row (already exists)
  -> voip_leads status = ASSIGNED

Worker submits outcome
  -> voip_calls gets a row with outcome + session_duration_seconds
  -> voip_leads status updated

Analytics queries:
  Leads Requested = COUNT(voip_worker_lead_history WHERE worker_id = X)
  Leads Completed = COUNT(voip_calls WHERE user_id = X)
  Appointments = COUNT(voip_calls WHERE appointment_created = true)
```

### Edge Functions to Deploy
- `voip-leads` (session_duration_seconds fix + dynamic category-counts)
- `voip-analytics` (rewritten stats computation)
- `voip-admin-ext` (enhanced analytics action)

### New Files
- `src/pages/voip/HowTo.tsx`

### Modified Files
- `src/lib/leadCategories.ts`
- `src/pages/voip/Dialer.tsx`
- `src/components/voip/dialer/CallTools.tsx`
- `src/pages/voip/admin/AdminDashboard.tsx`
- `src/pages/voip/admin/LeadUpload.tsx`
- `src/components/voip/layout/VoipSidebar.tsx`
- `src/App.tsx`
- `supabase/functions/voip-leads/index.ts`
- `supabase/functions/voip-analytics/index.ts`
- `supabase/functions/voip-admin-ext/index.ts`
