
# Pricing Update, Appointment Enhancements, Follow-ups Migration, and Notification Badges

## Overview

This plan covers 7 distinct changes across pricing, appointment workflow, follow-up management, and notification badges.

---

## 1. Update Pricing Card (Dialer + How-To)

The current pricing card shows monthly hosting prices ($25/$30/$50). The user wants to clarify that those are hosting-only prices, and add the one-time website build costs alongside a discretion/negotiation note.

**Updated Pricing Structure:**

| Service | Build Cost | Hosting |
|---------|-----------|---------|
| Standard Landing Page | $300 | $25/mo |
| Advanced Website | $500 | $30/mo |
| Full Custom Website | $1,500 | $50/mo |

**Changes:**
- **`PricingCard.tsx`**: Update the `PRICING` array to include both build cost and hosting cost columns. Add a note below: *"Prices are negotiable -- use your discretion based on the client's needs."*
- **`HowTo.tsx`**: Update the Pricing Pitch Guide talking points to reference the new prices ($300/$500/$1,500 builds + monthly hosting). Update objection handlers accordingly.

---

## 2. Add Plan/Pricing Selection to Appointment Modal

When a caller books an appointment (especially after an "Interested" outcome), they should be able to record which plan the client wants and what price was discussed.

**Changes to `AppointmentModal.tsx`:**
- Add a "Plan Selected" dropdown with options:
  - Standard Landing Page ($300 + $25/mo)
  - Advanced Website ($500 + $30/mo)
  - Full Custom Website ($1,500 + $50/mo)
  - Other (shows a text input for custom pricing)
- Add a "Negotiated Price" optional text input for any custom price agreed upon
- Pass `selectedPlan` and `negotiatedPrice` in the API body to `create-appointment`

**Backend changes (`voip-leads-ext`):**
- Accept and store `selected_plan` and `negotiated_price` fields on the appointments table

**Database migration:**
- Add `selected_plan TEXT` and `negotiated_price TEXT` columns to the `voip_appointments` table

**Appointments page (`Appointments.tsx`):**
- Display the plan and negotiated price in both calendar and list views

---

## 3. Remove "Schedule Appointment" Trigger from Follow-up Outcome

Currently, when a caller selects "Follow-up Scheduled" as an outcome, the appointment modal pops up with "Schedule a follow-up call with this lead." The user wants this removed -- selecting "Follow-up" should only create the follow-up (date/time/priority/notes already captured in the Dialer's inline follow-up section), not also trigger the appointment modal.

**Changes to `Dialer.tsx`:**
- In `handleSubmitOutcome`, change the condition from:
  ```
  if (selectedOutcome === "interested" || selectedOutcome === "followup")
  ```
  to:
  ```
  if (selectedOutcome === "interested")
  ```
  This keeps the appointment modal for "Interested" but removes it for "Follow-up."

---

## 4. Move Scheduled Follow-ups to the Appointments Tab

Currently, follow-ups are displayed on the Lead Info page. The user wants them moved to the Appointments page instead, displayed in a dedicated section/tab.

**Changes to `Appointments.tsx`:**
- Add a third tab: "Follow-ups" alongside Calendar and List
- Fetch follow-ups using the existing `voip-leads` edge function (`action: "followups"`)
- Display each follow-up with full info: lead name, phone number, company, assigned caller, follow-up date/time, priority badge, and notes
- Add a delete button per follow-up (using existing `delete-followup` action)
- Add a "Clear All" button to clear all follow-up notifications

**Changes to `LeadInfo.tsx`:**
- Remove the "Scheduled Follow-ups" card section (lines 291-330)
- Remove the `followups` state, `fetchFollowups`, and `handleDeleteFollowup` functions since they move to Appointments

---

## 5. Add Notification Red Bubble Badges to Sidebar Tabs

Add a red notification badge (number) on sidebar tabs that have pending items, similar to how the ticket count badge already works.

**Tabs that get badges:**
- **Appointments** (admin sidebar): Shows count of upcoming scheduled appointments
- **Follow-ups** will be under Appointments, so the badge reflects follow-up count too

**Changes to `VoipSidebar.tsx`:**
- Add a new API call to fetch follow-up count (or reuse the follow-ups endpoint to get the count)
- Add a new API call to fetch upcoming appointment count
- Display a red badge on the Appointments tab with the combined count
- When follow-ups are deleted, the count decreases (handled by re-fetching on the polling interval)

**Badge behavior:**
- Badge shows on the Appointments nav item when there are pending follow-ups or upcoming appointments
- The number decreases when items are deleted/completed
- "Clear all notifications" button on the Appointments page will mark items as "seen" (or just clearing follow-ups counts as reducing the badge)

---

## 6. Clear All Notifications Option

Add a "Clear All" button on tabs that have notification badges, allowing the admin to dismiss all pending notifications.

**Changes to `Appointments.tsx`:**
- Add a "Clear All Notifications" button in the Follow-ups tab
- This calls the backend to clear all follow-ups (set `followup_at` to null for all records)

**Backend (`voip-leads` edge function):**
- Add a new action `clear-all-followups` that nullifies `followup_at`, `followup_priority`, and `followup_notes` on all `voip_calls` records that have pending follow-ups

---

## Technical Details

### Database Migration

```text
ALTER TABLE voip_appointments
  ADD COLUMN selected_plan TEXT,
  ADD COLUMN negotiated_price TEXT;
```

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/voip/dialer/PricingCard.tsx` | Update pricing data to show build cost + hosting, add negotiation discretion note |
| `src/pages/voip/HowTo.tsx` | Update Pricing Pitch Guide with new prices |
| `src/components/voip/AppointmentModal.tsx` | Add plan selector dropdown and negotiated price input |
| `src/pages/voip/Dialer.tsx` | Remove "followup" from appointment modal trigger condition |
| `src/pages/voip/admin/Appointments.tsx` | Add Follow-ups tab with full info display, delete, clear all |
| `src/pages/voip/admin/LeadInfo.tsx` | Remove follow-ups section (moved to Appointments) |
| `src/components/voip/layout/VoipSidebar.tsx` | Add follow-up/appointment count badges |
| `supabase/functions/voip-leads/index.ts` | Add `clear-all-followups` action |
| `supabase/functions/voip-leads-ext/index.ts` | Accept `selected_plan` and `negotiated_price` in create-appointment |

### PricingCard New Structure

```text
Card Header: "Current Pricing" + DollarSign icon + Info tooltip
Content:
  Row: Standard Landing Page .... Build: $300 .... Hosting: $25/mo
  Row: Advanced Website ......... Build: $500 .... Hosting: $30/mo
  Row: Full Custom Website ...... Build: $1,500 .. Hosting: $50/mo
  Note: "Prices are negotiable -- use your discretion"
```

### Appointment Modal Plan Selector

```text
Select: "Plan Selected"
  - Standard Landing Page ($300 + $25/mo)
  - Advanced Website ($500 + $30/mo)  
  - Full Custom Website ($1,500 + $50/mo)
  - Other

If "Other" selected:
  Input: "Custom plan details"

Input: "Negotiated Price (optional)"
  Placeholder: "e.g. $400 build + $20/mo"
```

### Sidebar Badge Logic

```text
VoipSidebar:
  - Poll followup count every 15 seconds (alongside existing ticket poll)
  - Display red badge on "Appointments" nav item
  - Badge shows followup count number
  - Decreases when follow-ups are deleted
```
