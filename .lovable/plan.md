
# Lead Category System

## Overview
Add a category field to the lead management system so workers can choose what type of leads they want to call, and admins can assign categories when uploading leads.

## What Changes

### 1. Database
- Add a `category` column (VARCHAR, nullable, default `NULL`) to the `voip_leads` table
- Update the `assign_next_lead` PostgreSQL function to accept an optional `p_category` parameter and filter leads by it
- Add a `lead_category` column to `voip_user_preferences` table to persist each user's last selected category

### 2. Backend (Edge Functions)

**voip-leads (request-next action)**
- Accept a `category` query parameter
- Pass it to the updated `assign_next_lead` database function
- Return a "No more leads available in this category" message when empty

**voip-leads (upload action)**
- Accept a `category` field from the request body
- Store it on each inserted lead

**voip-leads (stats action)**
- Add a new `category-counts` action that returns the count of available (NEW status) leads grouped by category

**voip-leads (all-leads action)**
- Include the `category` field in the returned lead data

**voip-preferences**
- Support saving/loading `lead_category` from `voip_user_preferences`

### 3. Dialer Page (Worker UI)
- Add a dropdown labeled "Select Lead Type" above the "Request Next Lead" button
- Options: Electricians, General Contractors, Roofing Companies, HVAC, Plumbing, Coffee Shops, Restaurants, Custom / Other
- Each option shows remaining lead count in parentheses, e.g. "Electricians (24)"
- Selected category is saved to localStorage immediately and synced to the database
- Default category: Electricians
- When no leads remain in the selected category, show: "No more leads available in this category."
- Styled to match the dark theme with rounded modern appearance

### 4. Lead Upload Page (Admin UI)
- Add a required "Lead Category" dropdown above the Import button
- Same category options as the Dialer
- The selected category is sent with every lead in the upload batch
- Category column shown in the upload preview table

### 5. Lead Info Page (Admin UI)
- Add a Category column to the leads table so admins can see each lead's category

## Category Options
| Value | Label |
|-------|-------|
| `electricians` | Electricians |
| `general_contractors` | General Contractors |
| `roofing` | Roofing Companies |
| `hvac` | HVAC |
| `plumbing` | Plumbing |
| `coffee_shops` | Coffee Shops |
| `restaurants` | Restaurants |
| `other` | Custom / Other |

## Technical Details

### Database Migration SQL
```text
-- Add category column to voip_leads
ALTER TABLE voip_leads ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT NULL;

-- Add lead_category preference column
ALTER TABLE voip_user_preferences ADD COLUMN IF NOT EXISTS lead_category VARCHAR DEFAULT 'electricians';

-- Replace assign_next_lead function to accept category filter
CREATE OR REPLACE FUNCTION assign_next_lead(p_worker_id INTEGER, p_category VARCHAR DEFAULT NULL)
RETURNS TABLE(...) -- same columns as before
-- Adds: AND (p_category IS NULL OR l.category = p_category) to the WHERE clause
```

### Files to Create/Edit
- **Migration**: New SQL migration for `category` column and updated function
- **supabase/functions/voip-leads/index.ts**: Update `request-next`, `upload`, `all-leads` actions; add `category-counts` action
- **supabase/functions/voip-preferences/index.ts**: Include `lead_category` in get/save
- **src/pages/voip/Dialer.tsx**: Add category dropdown, fetch counts, persist selection
- **src/pages/voip/admin/LeadUpload.tsx**: Add required category selector, send with upload
- **src/pages/voip/admin/LeadInfo.tsx**: Show category column in leads table

### Data Flow
```text
Admin uploads leads with category
        |
        v
voip_leads table stores category per lead
        |
        v
Worker selects category in Dialer dropdown
        |
        v
"Request Next Lead" passes category to assign_next_lead()
        |
        v
Only leads matching that category are assigned
```
