
# Lead Upload Enhancement & Dialer Notepad Plan

## Overview
This plan addresses three main improvements:
1. Add ability to delete upload batches from the Lead Upload page
2. Show call history for each uploaded file (who called, how long, outcome)
3. Add a persistent notepad area to the Dialer page for workers

---

## Phase 1: Delete Upload Batches

### Current State
The upload history table shows past uploads but has no way to delete them or their associated leads.

### Technical Changes

**File: `src/pages/voip/admin/LeadUpload.tsx`**
- Add a delete button (Trash icon) to each row in the upload history table
- Add confirmation dialog before deleting
- Call new API endpoint to delete upload and cascade to leads

**File: `supabase/functions/voip-leads/index.ts`**
- Add new action: `delete-upload`
- Deletes from `voip_lead_uploads` table
- Cascade delete leads where `upload_id` matches (only NEW status leads)
- Log deletion in audit table

**Database Changes Required:**
- Add cascade delete constraint OR handle in edge function logic
- Option A: Soft delete - mark upload as deleted
- Option B: Hard delete - remove upload and NEW leads (preserve COMPLETED/DNC leads)

### UI Design
```text
| File         | Date       | Imported | Duplicates | Invalid | Actions     |
|--------------|------------|----------|------------|---------|-------------|
| leads.csv    | Feb 4...   | 50       | 5          | 2       | [View] [X]  |
```

---

## Phase 2: Show Call History Per Upload

### Current State
The upload history shows import stats but no visibility into call attempts made to those leads.

### Technical Changes

**File: `src/pages/voip/admin/LeadUpload.tsx`**
- Add expandable row or modal for each upload showing call history
- Display: Lead name, phone, caller, duration, outcome, date
- Query joins `voip_calls` with `voip_leads` where `lead.upload_id` matches

**File: `supabase/functions/voip-leads/index.ts`**
- Add new action: `upload-calls`
- Parameters: `uploadId`
- Returns: List of calls for leads in that upload batch
- Join query:
  ```sql
  SELECT c.*, l.name as lead_name, l.phone as lead_phone, u.email as caller_email
  FROM voip_calls c
  JOIN voip_leads l ON c.lead_id = l.id
  LEFT JOIN voip_users u ON c.user_id = u.id
  WHERE l.upload_id = ?
  ORDER BY c.start_time DESC
  ```

### UI Design - Expandable Row
```text
| File: leads.csv | 50 imported | Feb 4, 2026
|   [Expand/Collapse Call History v]
|   +-------------------------------------------------+
|   | Lead Name    | Phone        | Called By | Duration | Outcome     |
|   |--------------|--------------|-----------|----------|-------------|
|   | John Smith   | (555) 123... | worker1   | 2:35     | Interested  |
|   | Jane Doe     | (555) 456... | worker2   | 0:45     | No Answer   |
|   +-------------------------------------------------+
```

---

## Phase 3: Dialer Notepad

### Current State
The Dialer page has a notes field in the "Call Outcome" section, but it only appears when a lead is assigned and is submitted with the outcome.

### Proposed Enhancement
Add a persistent "Scratch Pad" or "Quick Notes" area that:
- Appears regardless of whether a lead is assigned
- Is NOT submitted with the call outcome (separate storage)
- Persists during the session (localStorage)
- Workers can jot down quick info during/before calls

### Technical Changes

**File: `src/pages/voip/Dialer.tsx`**
- Add new state: `scratchPadNotes`
- Use `localStorage` to persist notes across page refreshes
- Add a collapsible Card below the two-column layout titled "Scratch Pad"
- Include a Textarea with auto-save to localStorage
- Add a "Clear" button to reset the notepad

### UI Design
```text
+----------------------------------+
| Scratch Pad              [Clear] |
+----------------------------------+
| Quick notes for your calls...    |
|                                  |
| [Textarea - auto-saves locally]  |
|                                  |
+----------------------------------+
```

### Implementation Details
- Use `useEffect` to load notes from localStorage on mount
- Use `useEffect` with debounce to save notes on change
- Key: `voip_dialer_scratchpad`
- Does NOT sync to database (privacy for workers)

---

## Technical Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/voip/admin/LeadUpload.tsx` | Add delete button, expandable call history, confirmation dialogs |
| `supabase/functions/voip-leads/index.ts` | Add `delete-upload` and `upload-calls` actions |
| `src/pages/voip/Dialer.tsx` | Add collapsible Scratch Pad with localStorage persistence |

### New Components
- `AlertDialog` for delete confirmation (already available from shadcn)
- `Collapsible` for expandable call history rows (already available)

### Backend Changes

**New Edge Function Actions:**

1. `delete-upload` (POST):
   - Admin only
   - Parameters: `uploadId`
   - Deletes leads with status = 'NEW' only (preserves call history)
   - Deletes upload record
   - Returns: `{ deleted: true, leadsRemoved: number }`

2. `upload-calls` (GET):
   - Admin only
   - Parameters: `uploadId`
   - Returns: `{ calls: [...] }` with lead name, caller info, duration, outcome

### Database Considerations
- Leads that have been called (have entries in `voip_calls`) should NOT be deleted
- Only remove leads with status = 'NEW' that haven't been worked
- Maintain referential integrity

---

## Implementation Order

1. **Dialer Notepad** (simplest - no backend changes)
   - Add localStorage-based scratch pad
   - Collapsible card below main layout

2. **Delete Upload** (requires backend)
   - Add edge function action
   - Add delete button with confirmation
   - Handle cascade logic

3. **Call History Per Upload** (most complex)
   - Add edge function action with joins
   - Add expandable rows in UI
   - Format duration display

---

## Testing Checklist

After implementation:
1. Test scratch pad persistence across page refreshes
2. Test scratch pad clear button
3. Upload a CSV and verify it appears in history
4. Delete an upload and verify leads are removed (only NEW status)
5. Expand an upload row to see call history
6. Verify call duration displays correctly (mm:ss format)
7. Verify caller name/email displays for each call
