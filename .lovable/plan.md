
# VoIP System Overhaul: Twilio Removal & TextNow Integration

This plan transforms the current Twilio-based calling system into a "Bring Your Own Dialer" model using TextNow/Google Voice, adds comprehensive analytics tracking, and implements user management enhancements.

---

## Phase 1: Remove Twilio Dependencies

### Files to Delete
| File/Folder | Purpose |
|-------------|---------|
| `supabase/functions/voip-twilio/` | Twilio edge function |
| `src/pages/voip/admin/TwilioSettings.tsx` | Twilio config page |
| `src/pages/voip/admin/AdminApiKeys.tsx` | API keys (Twilio-only) |
| `src/pages/voip/admin/Numbers.tsx` | Phone number management |
| `src/pages/voip/admin/Requests.tsx` | Number request handling |
| `src/pages/voip/MyNumbers.tsx` | User's assigned numbers |
| `src/pages/voip/RequestNumber.tsx` | Request number page |
| `src/components/voip/dialer/CallControls.tsx` | Twilio call controls |
| `src/components/voip/dialer/CallTimer.tsx` | Call duration timer |
| `src/components/voip/dialer/DialPad.tsx` | Phone keypad |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Remove routes for deleted pages |
| `src/components/voip/layout/VoipSidebar.tsx` | Remove Twilio/Numbers nav items |
| `supabase/config.toml` | Remove `voip-twilio` function config |
| `src/pages/voip/ClientDashboard.tsx` | Remove numbers section and related API calls |

---

## Phase 2: Redesign Dialer Page

### New Dialer Workflow
The Dialer becomes a call session manager with external dialer integration.

```text
+------------------------------------------+
|  DIALER PAGE                             |
+------------------------------------------+
|  [Request Next Lead]                     |
+------------------------------------------+
|  Lead Details                            |
|  - Name: John Smith                      |
|  - Phone: (909) 555-1234                 |
|  - Email: john@example.com               |
|  - Website: johnsmith.com                |
+------------------------------------------+
|  CALL TOOLS                              |
|  [Copy Number] [Open TextNow]            |
|  [Open Google Voice] [Dial on Device]   |
+------------------------------------------+
|  SESSION TIMER: 00:02:34                 |
|  Step 1: Call in TextNow                 |
|  Step 2: Log outcome below               |
|  Step 3: Schedule appointment if needed  |
+------------------------------------------+
|  OUTCOME LOGGING                         |
|  ( ) No Answer  ( ) Voicemail            |
|  ( ) Not Interested  (*) Interested      |
|  ( ) Wrong Number  ( ) DNC               |
|  [Notes textarea]                        |
|  [Submit Outcome]                        |
+------------------------------------------+
```

### Call Tools Implementation
| Button | Action |
|--------|--------|
| Copy Number | Copies normalized phone to clipboard, shows "Copied!" toast |
| Open TextNow | Opens `https://www.textnow.com/messaging` in popup (480x780), fallback to new tab |
| Open Google Voice | Opens `https://voice.google.com/u/0/calls` in new tab |
| Dial on Device | `tel:` link for mobile users |

### Phone Number Normalization
```typescript
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '');
}
```

### Session Timer
- Starts when user clicks "Open TextNow"
- Tracks local session duration
- Displayed prominently during active session
- Duration stored with call log on submission

### Outcome Enforcement
- User MUST select an outcome before requesting another lead
- If outcome = "Interested", automatically prompt for appointment scheduling
- `appointment_created` boolean tracked in call logs

---

## Phase 3: Database Schema Updates

### New Tables

**voip_activity_events**
```sql
CREATE TABLE voip_activity_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES voip_users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- lead_requested, lead_viewed, dialer_opened_textnow, lead_completed, appointment_created
  lead_id INTEGER REFERENCES voip_leads(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**voip_user_sessions**
```sql
CREATE TABLE voip_user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES voip_users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  is_idle BOOLEAN DEFAULT FALSE,
  total_active_seconds INTEGER DEFAULT 0
);
```

### Modify voip_calls Table
```sql
ALTER TABLE voip_calls ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER;
ALTER TABLE voip_calls ADD COLUMN IF NOT EXISTS appointment_created BOOLEAN DEFAULT FALSE;
```

### Modify voip_users Table
```sql
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
```

---

## Phase 4: New Analytics System

### Activity Event Tracking
Track these events via the voip-leads edge function:
- `lead_requested` - When user clicks "Request Next Lead"
- `lead_viewed` - When lead details are displayed
- `dialer_opened_textnow` - When TextNow popup is opened
- `lead_completed` - When outcome is submitted
- `appointment_created` - When appointment is scheduled

### Admin Analytics Dashboard Enhancements
Expand `Analytics.tsx` to include:
- Leads requested vs completed (completion rate)
- Outcomes breakdown (pie chart)
- Average time per lead
- Appointments created count
- Conversion rate (Interested -> Appointment)
- Per-user leaderboard
- Date range filters
- Activity sessions table with expandable details

### Client Analytics Page (New)
Create `src/pages/voip/MyAnalytics.tsx`:
- Personal stats only (RLS enforced)
- Leads requested/completed
- Completion rate
- Outcomes breakdown
- Appointments created
- Average time per lead
- Daily activity chart
- Session history table

### Admin Client Analytics Page (New)
Create `src/pages/voip/admin/ClientAnalytics.tsx`:
- Session time tracking per user
- Online now indicator (heartbeat within last 30s)
- Time on site: today, 7d, 30d
- Click user to drill down into timeline/sessions

---

## Phase 5: User Management Enhancements

### User Statuses
```typescript
type UserStatus = 'active' | 'pending' | 'suspended' | 'disabled';
```

### Suspension Flow
1. Admin selects user and sets status to "suspended"
2. Admin enters suspension reason (required)
3. System immediately invalidates user's session
4. User sees full-screen modal: "Your account has been suspended. Reason: [reason]"

### Admin Password Reset
Add to Users page:
- "Reset Password" button per user
- Opens modal with new password fields
- Calls secure edge function (not exposing service key)
- Optionally force password change on next login
- Logs action in audit log
- User is logged out immediately

### Account Deletion
Already implemented, but add cascade cleanup for new tables.

---

## Phase 6: Appointment Pipeline

### Pipeline Stages
```typescript
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
```

### Admin Appointments Page Updates
- Pipeline view: Scheduled -> Confirmed -> Completed
- Drag-and-drop status changes
- Calendar integration (existing)
- Filter by status, date range, worker

---

## Phase 7: Reset Analytics (Admin Only)

### Reset Function
Add "Reset Analytics" button to Admin Dashboard:
1. Confirmation modal: Type "RESET" to confirm
2. Deletes: `voip_activity_events`, call logs (optional), aggregates
3. Logs action in `voip_admin_audit_log`
4. Toast confirmation

---

## Phase 8: Lead & Follow-Up Deletion Controls

### Admin Leads Page
- Add "Delete Lead" button with confirmation
- Add "Delete All Leads" bulk action (type "DELETE ALL" to confirm)
- Option to include related call logs

### Admin Follow-Ups Page
- Add "Delete Follow-Up" button
- Add "Delete All Follow-Ups" bulk action

All deletions logged in audit log.

---

## Phase 9: Terms of Service & Privacy Policy

### New Pages
| Route | Component |
|-------|-----------|
| `/terms` | `src/pages/Terms.tsx` |
| `/privacy` | `src/pages/Privacy.tsx` |

### Content Requirements
**Terms of Service includes:**
- All purchases final and non-refundable
- Chargeback policy: account suspension, fee recovery
- Fraudulent chargebacks = breach of agreement

### Signup Integration
1. Add checkbox: "I agree to the Terms of Service and Privacy Policy"
2. Links open `/terms` and `/privacy` in new tab
3. Signup button disabled until checked
4. Store `tos_accepted`, `privacy_accepted`, `consent_accepted_at` in database

### Footer Integration
Add links to Terms and Privacy in Footer component.

---

## Phase 10: Navigation Updates

### Client Sidebar
| Item | Route | Action |
|------|-------|--------|
| Dashboard | `/voip/dashboard` | Keep |
| Dialer | `/voip/dialer` | Redesign |
| My Analytics | `/voip/my-analytics` | NEW |
| Settings | `/voip/settings` | Keep |

### Admin Sidebar
| Item | Route | Action |
|------|-------|--------|
| Admin Dashboard | `/voip/admin` | Keep |
| Users | `/voip/admin/users` | Keep + Enhance |
| Lead Upload | `/voip/admin/leads` | Keep |
| Lead Info | `/voip/admin/lead-info` | Keep |
| Appointments | `/voip/admin/appointments` | Keep |
| Duplicate Review | `/voip/admin/duplicates` | Keep |
| Analytics | `/voip/admin/analytics` | Enhance |
| Client Analytics | `/voip/admin/client-analytics` | NEW |
| Caller Resources | `/voip/admin/resources` | NEW (scripts/docs) |
| Invite Tokens | `/voip/admin/invite-tokens` | Keep |
| Audit Log | `/voip/admin/audit-log` | NEW |

### Removed from Navigation
- Numbers, Requests, API Keys, Twilio Settings

---

## Phase 11: Session Heartbeat System

### Frontend Implementation
```typescript
// In VoipAuthContext or VoipLayout
useEffect(() => {
  if (!isAuthenticated) return;
  
  const heartbeat = () => {
    apiCall('voip-analytics', { 
      method: 'POST', 
      params: { action: 'heartbeat' } 
    });
  };
  
  // Initial heartbeat
  heartbeat();
  
  // Every 30 seconds
  const interval = setInterval(heartbeat, 30000);
  
  // Idle detection (5 min)
  let idleTimer: NodeJS.Timeout;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      apiCall('voip-analytics', { 
        method: 'POST', 
        params: { action: 'idle' } 
      });
    }, 5 * 60 * 1000);
  };
  
  window.addEventListener('mousemove', resetIdle);
  window.addEventListener('keypress', resetIdle);
  resetIdle();
  
  return () => {
    clearInterval(interval);
    clearTimeout(idleTimer);
    window.removeEventListener('mousemove', resetIdle);
    window.removeEventListener('keypress', resetIdle);
  };
}, [isAuthenticated]);
```

### Backend Implementation
Edge function tracks sessions in `voip_user_sessions` table.

---

## Phase 12: Live Kick for Suspended Users

### Implementation
1. Frontend polls user status every 30s (or use heartbeat response)
2. If status = "suspended" or "disabled", show blocking modal
3. Modal displays: "Your account has been suspended. Reason: [reason]"
4. User cannot dismiss modal, only option is to close tab
5. Pending users see: "Your account is pending approval"

---

## File Summary

### New Files
| Path | Description |
|------|-------------|
| `src/pages/voip/MyAnalytics.tsx` | User's personal analytics |
| `src/pages/voip/admin/ClientAnalytics.tsx` | Admin view of user sessions |
| `src/pages/voip/admin/AuditLog.tsx` | Admin audit log viewer |
| `src/pages/voip/admin/CallerResources.tsx` | Scripts/training docs |
| `src/pages/Terms.tsx` | Terms of Service |
| `src/pages/Privacy.tsx` | Privacy Policy |
| `src/components/voip/SuspendedModal.tsx` | Suspension blocking modal |
| `src/components/voip/dialer/CallTools.tsx` | TextNow/GV buttons |
| `src/components/voip/dialer/SessionTimer.tsx` | Local session timer |

### Modified Files
| Path | Changes |
|------|---------|
| `src/pages/voip/Dialer.tsx` | Complete redesign for TextNow workflow |
| `src/pages/voip/Auth.tsx` | Add TOS/Privacy checkbox |
| `src/pages/voip/admin/Analytics.tsx` | Enhanced with new metrics |
| `src/pages/voip/admin/Users.tsx` | Add password reset, suspension reason |
| `src/pages/voip/ClientDashboard.tsx` | Remove numbers section |
| `src/components/voip/layout/VoipSidebar.tsx` | Update navigation |
| `src/App.tsx` | Update routes |
| `supabase/functions/voip-leads/index.ts` | Add activity event tracking |
| `supabase/functions/voip-admin/index.ts` | Add password reset, audit log actions |
| `supabase/functions/voip-analytics/index.ts` | Add heartbeat, session tracking |
| `src/contexts/VoipAuthContext.tsx` | Add status checking |
| `src/components/Footer.tsx` | Add Terms/Privacy links |

### Deleted Files
- `supabase/functions/voip-twilio/`
- `src/pages/voip/admin/TwilioSettings.tsx`
- `src/pages/voip/admin/AdminApiKeys.tsx`
- `src/pages/voip/admin/Numbers.tsx`
- `src/pages/voip/admin/Requests.tsx`
- `src/pages/voip/MyNumbers.tsx`
- `src/pages/voip/RequestNumber.tsx`
- `src/components/voip/dialer/CallControls.tsx`
- `src/components/voip/dialer/CallTimer.tsx`
- `src/components/voip/dialer/DialPad.tsx`

---

## Implementation Order

1. **Database migrations** - Add new tables and columns
2. **Remove Twilio** - Delete files, update routes, clean navigation
3. **Redesign Dialer** - New call tools, session timer, outcome enforcement
4. **Analytics backend** - Activity events, session tracking, heartbeat
5. **Analytics frontend** - MyAnalytics, enhanced Admin Analytics, Client Analytics
6. **User management** - Suspension flow, password reset, live kick
7. **Legal pages** - Terms, Privacy, signup checkbox
8. **Admin controls** - Reset analytics, lead/followup deletion, audit log
9. **UI polish** - Ensure dark theme consistency, smooth workflows

---

## Technical Notes

### Popup Window for TextNow
```typescript
const openTextNow = () => {
  const popup = window.open(
    'https://www.textnow.com/messaging',
    'TextNow',
    'width=480,height=780,resizable=yes'
  );
  if (!popup || popup.closed) {
    // Popup blocked, open in new tab
    window.open('https://www.textnow.com/messaging', '_blank');
  }
  // Start session timer
  setSessionStartTime(Date.now());
};
```

### Phone Number Button Disabled State
```typescript
const hasPhone = currentLead?.phone && normalizePhone(currentLead.phone).length >= 10;
// If !hasPhone, disable buttons and show "No phone number available"
```

### RLS for User Analytics
```sql
CREATE POLICY "Users can view their own analytics"
ON voip_activity_events FOR SELECT
TO authenticated
USING (user_id = current_user_id());
```
