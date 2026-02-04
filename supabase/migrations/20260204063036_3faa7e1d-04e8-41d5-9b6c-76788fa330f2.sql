-- Create appointments table
CREATE TABLE IF NOT EXISTS voip_appointments (
  id serial PRIMARY KEY,
  lead_id integer REFERENCES voip_leads(id) ON DELETE SET NULL,
  lead_name text,
  lead_phone text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  notes text,
  created_by integer REFERENCES voip_users(id) ON DELETE SET NULL,
  created_by_name text,
  outcome text, -- 'interested', 'followup', or 'manual'
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE voip_appointments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON voip_appointments FOR ALL USING (true) WITH CHECK (true);

-- Create index for date queries
CREATE INDEX idx_voip_appointments_scheduled_at ON voip_appointments(scheduled_at);