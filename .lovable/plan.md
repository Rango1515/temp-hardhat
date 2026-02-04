

# Dialer Enhancement & System Improvements Plan

## Overview
This plan addresses several improvements to the HardhatHosting Client Dashboard:
1. Add numpad to the client Dialer with side-by-side layout
2. Ensure Twilio test call works properly (already implemented)
3. Remove "My Numbers" from client sidebar
4. Add CSV file support to lead upload
5. Additional recommendations for improved functionality

---

## Phase 1: Dialer Layout Redesign

### Current State
The dialer currently shows lead information vertically with a simple call button, but no numpad for manual entry.

### Proposed Layout
```text
+------------------------+-------------------------+
|  LEFT SIDE: LEAD       |  RIGHT SIDE: DIALER     |
+------------------------+-------------------------+
|  Current Lead:         |    Phone Number Display |
|  Name: John Smith      |    +1 (555) 222-1111   |
|  Phone: +1 555-222...  |                         |
|  Email: john@gmail.com |    [1] [2] [3]          |
|  Website: example.com  |    [4] [5] [6]          |
|                        |    [7] [8] [9]          |
|  Request Next Lead     |    [*] [0] [#]          |
|      [Button]          |                         |
|                        |   [Clear] [Call] [End]  |
+------------------------+-------------------------+
|           Call Outcome Section                   |
+--------------------------------------------------+
```

### Technical Changes
**File: `src/pages/voip/Dialer.tsx`**
- Import `DialPad` component from `@/components/voip/dialer/DialPad`
- Import `Input` component for phone number display
- Restructure layout using a responsive grid:
  - Left column: Lead info card with "Request Next Lead" button
  - Right column: Phone number input + DialPad + call controls
- Add state for manual phone number entry
- Update call button to use either lead phone or manual entry
- When lead is assigned, auto-populate the phone field

---

## Phase 2: Remove "My Numbers" from Client Sidebar

### Technical Changes
**File: `src/components/voip/layout/VoipSidebar.tsx`**

Remove the "My Numbers" navigation item from `clientNavItems`:

```typescript
// Before (lines 19-25)
const clientNavItems = [
  { href: "/voip/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/voip/dialer", label: "Dialer", icon: Phone },
  { href: "/voip/calls", label: "Call History", icon: History },
  { href: "/voip/numbers", label: "My Numbers", icon: Hash },  // Remove this
  { href: "/voip/settings", label: "Settings", icon: Settings },
];

// After
const clientNavItems = [
  { href: "/voip/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/voip/dialer", label: "Dialer", icon: Phone },
  { href: "/voip/calls", label: "Call History", icon: History },
  { href: "/voip/settings", label: "Settings", icon: Settings },
];
```

Also remove the unused `Hash` import from lucide-react.

---

## Phase 3: Add CSV Support to Lead Upload

### Current State
The lead upload currently accepts `.txt`, `.doc`, and `.docx` files only.

### Technical Changes
**File: `src/pages/voip/admin/LeadUpload.tsx`**

1. Update file type validation (around line 115):
```typescript
// Before
if (!["txt", "doc", "docx"].includes(ext || ""))

// After
if (!["txt", "doc", "docx", "csv"].includes(ext || ""))
```

2. Update input accept attribute (around line 209):
```typescript
// Before
accept=".txt,.doc,.docx"

// After
accept=".txt,.doc,.docx,.csv"
```

3. Update parsing logic to handle CSV format:
   - Detect file type by extension
   - For CSV: Split by comma instead of pipe (`|`)
   - Handle quoted values in CSV (e.g., `"John, Smith",555-1234`)

4. Update UI text to reflect new supported formats:
```typescript
// Line 199
"Upload a .txt, .doc, .docx, or .csv file with one lead per line"

// Line 213
"Supported formats: .txt, .doc, .docx, .csv"
```

---

## Phase 4: Twilio Configuration Testing

### Current State
The Twilio test call functionality is already implemented in both:
- **Frontend:** `src/pages/voip/admin/TwilioSettings.tsx` (lines 76-106)
- **Backend:** `supabase/functions/voip-twilio/index.ts` (lines 134-196)

### To Test With Your Credentials
1. Navigate to `/voip/admin/twilio`
2. Enter:
   - Account SID: `ACd7e5bee593f843bc330a853e304fcf76`
   - Auth Token: `0f316457fcf87d718b7f9a50e809696f`
   - Outbound Number: `+17063974010`
3. Toggle "Enable Twilio" ON
4. Click "Save Settings"
5. Enter a test phone number and click "Make Test Call"

The system will use Twilio's demo TwiML (`http://demo.twilio.com/docs/voice.xml`) to verify the configuration works.

---

## Phase 5: Additional Recommendations

### 5.1 Mobile-Responsive Dialer
The new side-by-side layout should stack vertically on mobile:
- Use `lg:grid-cols-2 grid-cols-1` for responsive grid
- Numpad and controls should appear below lead info on mobile

### 5.2 Backspace Button on DialPad
Add a backspace/delete button to the DialPad for easier phone number editing:
- Add a backspace callback prop to DialPad component
- Include delete icon button below the numpad

### 5.3 Quick Dial Integration
When a lead is loaded, show a "Use Lead Number" button that populates the dialpad with the lead's phone number.

### 5.4 Call Status Indicator
Add a visual indicator showing:
- Twilio configured: Green dot
- Twilio not configured: Yellow dot (demo mode)
- This helps workers understand if calls are real or simulated

### 5.5 Lead Counter
Show remaining leads count on the dialer page:
- "X leads available in queue"
- Helps workers know if there's more work available

---

## Technical Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/voip/Dialer.tsx` | Add numpad, two-column layout, manual number input |
| `src/components/voip/layout/VoipSidebar.tsx` | Remove "My Numbers" from client nav |
| `src/pages/voip/admin/LeadUpload.tsx` | Add CSV support with comma parsing |
| `src/components/voip/dialer/DialPad.tsx` | Add backspace button (optional) |

### No New Files Required
All changes are modifications to existing components.

### Backend Changes
None required - Twilio and lead upload edge functions already support the needed functionality.

### Testing Checklist
After implementation:
1. Test dialer with numpad on desktop (side-by-side layout)
2. Test dialer on mobile (stacked layout)
3. Verify "My Numbers" is removed from client sidebar
4. Upload a .csv file with leads and verify parsing
5. Save Twilio credentials and make a test call
6. Request a lead and verify phone auto-populates in dialpad
7. Make a call (real or simulated) and submit outcome

