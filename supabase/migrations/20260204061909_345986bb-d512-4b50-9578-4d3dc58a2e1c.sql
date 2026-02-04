-- Add priority column to voip_calls for follow-up priority
ALTER TABLE voip_calls ADD COLUMN IF NOT EXISTS followup_priority text DEFAULT NULL;

-- Add followup_notes column for dedicated follow-up notes
ALTER TABLE voip_calls ADD COLUMN IF NOT EXISTS followup_notes text DEFAULT NULL;

-- Create table for duplicate leads pending review
CREATE TABLE IF NOT EXISTS voip_duplicate_leads (
  id serial PRIMARY KEY,
  upload_id integer REFERENCES voip_lead_uploads(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  email text,
  website text,
  existing_lead_id integer REFERENCES voip_leads(id) ON DELETE SET NULL,
  reason text NOT NULL, -- 'phone_exists' or 'has_call_history'
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz DEFAULT NULL,
  reviewed_by integer REFERENCES voip_users(id) ON DELETE SET NULL,
  review_action text DEFAULT NULL -- 'added', 'skipped'
);

-- Enable RLS
ALTER TABLE voip_duplicate_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON voip_duplicate_leads FOR ALL USING (true) WITH CHECK (true);