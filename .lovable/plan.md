

# VoIP System Major Upgrade Plan

## Overview

This plan covers four major areas: smart auto-categorization on upload, an upgraded interactive leaderboard, a consolidated admin analytics dashboard, and a new category performance card. The changes span 3 edge functions and ~8 frontend files.

---

## Phase 1: Fix Auto-Category on Upload

### Problem
The upload page defaults `uploadCategory` state to `"electricians"` (line 72 of LeadUpload.tsx), so every upload goes into Electricians unless the admin manually changes it.

### Solution
Add filename-based auto-detection and a "Create new category" option.

**LeadUpload.tsx changes:**
- When a file is selected, parse the filename to auto-suggest a category
- Filename parsing logic:
  - Remove extension (.txt, .csv, etc.)
  - Replace `_` and `-` with spaces
  - Remove filler words: leads, lead, list, import, file, data, contacts, 2026, 2025
  - Title-case the result
  - Example: `fitness_leads_list.txt` -> `fitness`
- Add two modes via toggle: "Auto from filename" (default ON) and "Manual select/enter"
- In manual mode:
  - Show existing categories (fetched from `category-counts` endpoint)
  - Show a text input "Create new category" that lets admin type a custom one
- Default category when nothing matches: `"uncategorized"` (NOT electricians)
- Add a "Category" column to the preview table so admin confirms before importing
- Show the detected/selected category in Upload History entries

**Backend (voip-leads upload action):**
- Already stores `category` correctly -- no change needed
- If category is empty/null, store `"uncategorized"` instead of null

**leadCategories.ts changes:**
- Add `extractCategoryFromFilename(filename: string): string` helper function
- Add `"uncategorized"` to KNOWN_LABELS

---

## Phase 2: Upgrade Leaderboard

### Current State
The leaderboard has Today/Week/Month tabs with podium + Most Calls + Most Appointments + Conversion Rate sections. Data comes from `voip-analytics?action=leaderboard`.

### Changes

**Backend (voip-analytics leaderboard action):**
- Add `"all"` period support (no date filter)
- Include additional per-user metrics: interested count, DNC count, follow-up count, avg session duration
- Compute a "Top Performer Score": `(calls x 1) + (interested x 3) + (appointments x 6) - (dnc x 2)`
- Return the logged-in user's own stats separately as `myRank` with their position

**Leaderboard.tsx full rewrite:**
- Add "All Time" tab
- Podium: Top 3 by "Top Performer Score" instead of just appointments
- Add hover tooltips on each user showing: Calls, Interested, Appointments, Conversion %, DNC count
- Add animated progress bars for call counts
- Add 5 ranking sections:
  1. Most Calls (existing)
  2. Most Appointments (existing)
  3. Best Conversion Rate (existing, fix min call threshold per period)
  4. Most Interested Leads (new)
  5. Lowest DNC Rate (new, min 10 calls)
- Add "My Rank" panel at top showing:
  - Current rank position
  - Calls, appointments, conversion rate
  - Distance to next rank: "You are X calls away from passing [name]"
- Add "Recent Activity Feed" section:
  - Fetch from `voip_calls` (last 10 calls with user names and outcomes)
  - Display: "[User] booked an appointment (2m ago)", "[User] completed 3 calls", etc.

**Backend (voip-analytics, new action `recent-activity`):**
- Return last 15 call records with user names and timestamps
- Include outcome type for display formatting

---

## Phase 3: Admin Dashboard + Integrated Analytics

### Current State
Admin Dashboard shows basic stats (users, calls, available leads) + call volume chart + outcomes + mini leaderboard + recent activity.
Separate Analytics page has: overview stats, calls per day, outcomes, leaderboard, lead status, reset button.

### Changes

**Admin Dashboard (AdminDashboard.tsx) -- consolidate everything:**
- Add global date filter at the top: Today / 7D / 30D / All Time
- Add category filter dropdown (populated from DB)
- Stat cards remain but become period-aware
- Add the full leaderboard (top 10 with calls + appointments + conversion)
- Add "User Performance" table (from Client Analytics) inline
- Add "Category Performance" card (new):
  - For each category: total calls, interested rate, appointment rate, conversion %
  - Sorted by conversion rate
- Keep the reset analytics button (move from Analytics page)
- Keep recent activity feed

**Backend (voip-analytics admin-stats):**
- Accept optional `period` param (today/week/month/all) and `category` param
- Filter calls by date range and optionally by lead category
- Return category performance breakdown:
  - Join calls with leads on lead_id to get category
  - Group by category: total calls, interested count, appointment count, conversion rate

**Backend (voip-admin-ext analytics):**
- No major changes needed -- dashboard will call both endpoints in parallel

**Analytics.tsx page:**
- Keep it as-is but make the sidebar still link to it as an alternative view
- It becomes a secondary page; the Admin Dashboard is primary

---

## Phase 4: Category Performance Card

**New section in AdminDashboard.tsx:**
- Card titled "Best Performing Lead Categories"
- Table/list showing for each category:
  - Category name
  - Total Calls
  - Interested Rate (interested / total calls)
  - Appointment Rate (appointments / total calls)
  - Conversion % (appointments / interested)
- Color-coded: green for high conversion, red for low
- Example: "Electricians: 6% | Fitness: 2% | Roofing: 9%"

---

## Technical Details

### Files to Create/Edit

| File | Action | Description |
|------|--------|-------------|
| `src/lib/leadCategories.ts` | Edit | Add `extractCategoryFromFilename()`, add "uncategorized" label |
| `src/pages/voip/admin/LeadUpload.tsx` | Edit | Auto-detect category from filename, add "create new" input, add category column to preview, fetch existing categories, default to uncategorized |
| `supabase/functions/voip-leads/index.ts` | Edit | Default null category to "uncategorized" in upload action |
| `src/pages/voip/Leaderboard.tsx` | Rewrite | Add All Time tab, My Rank panel, extra ranking sections, hover tooltips, recent activity feed |
| `supabase/functions/voip-analytics/index.ts` | Edit | Add "all" period to leaderboard, add per-user detailed metrics (interested/DNC/score), add `recent-activity` action, add `period` + `category` filters to admin-stats, add category performance data |
| `src/pages/voip/admin/AdminDashboard.tsx` | Rewrite | Add date/category filters, add user performance table, add category performance card, add full leaderboard, consolidate analytics |

### Edge Functions to Deploy
- `voip-leads`
- `voip-analytics`

### Data Sources (no new tables needed)
- `voip_calls` -- call outcomes, durations, appointments
- `voip_worker_lead_history` -- lead assignments (leads requested)
- `voip_leads` -- categories, statuses
- `voip_users` -- names
- `voip_admin_audit_log` -- recent admin activity

### Key Backend Logic

**Filename auto-detection:**
```text
Input: "fitness_leads_list.txt"
1. Remove extension: "fitness_leads_list"
2. Replace _ with space: "fitness leads list"
3. Remove filler words: "fitness"
4. Lowercase for storage: "fitness"
5. Title case for display: "Fitness"
```

**Top Performer Score:**
```text
score = (calls * 1) + (interested * 3) + (appointments * 6) - (dnc * 2)
```

**Category Performance query logic:**
```text
For each call, join with voip_leads on lead_id to get category
Group by category:
  - totalCalls = count
  - interested = count where outcome = 'interested'
  - appointments = count where appointment_created = true
  - interestedRate = interested / totalCalls
  - conversionRate = appointments / interested
```

**Admin-stats period filtering:**
```text
period = "today" -> start_time >= today midnight
period = "week" -> start_time >= 7 days ago
period = "month" -> start_time >= 30 days ago
period = "all" -> no date filter
```

### Upload History Enhancement
The `voip_lead_uploads` table does not currently store category. Two options:
1. Store it in the `details` field of the audit log (already done -- `category` is in the audit log details)
2. Show category by looking at the leads linked to that upload_id

We will use approach 2: when fetching upload history, also return the category of leads associated with that upload.

