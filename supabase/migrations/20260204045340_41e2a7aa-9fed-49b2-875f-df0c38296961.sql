-- Create voip_leads table for storing uploaded leads
CREATE TABLE public.voip_leads (
    id SERIAL PRIMARY KEY,
    name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    assigned_to INTEGER REFERENCES public.voip_users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    attempt_count INTEGER DEFAULT 0,
    upload_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on phone for deduplication
CREATE UNIQUE INDEX idx_voip_leads_phone ON public.voip_leads(phone);

-- Create unique index on email where not null for deduplication
CREATE UNIQUE INDEX idx_voip_leads_email ON public.voip_leads(email) WHERE email IS NOT NULL;

-- Create composite index for efficient lead assignment queries
CREATE INDEX idx_voip_leads_assignment ON public.voip_leads(status, assigned_to, locked_until);

-- Enable RLS
ALTER TABLE public.voip_leads ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role full access" ON public.voip_leads FOR ALL USING (true) WITH CHECK (true);

-- Create voip_lead_uploads table for tracking file imports
CREATE TABLE public.voip_lead_uploads (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    total_lines INTEGER DEFAULT 0,
    imported_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    invalid_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voip_lead_uploads ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role full access" ON public.voip_lead_uploads FOR ALL USING (true) WITH CHECK (true);

-- Add foreign key to voip_leads for upload_id
ALTER TABLE public.voip_leads 
ADD CONSTRAINT fk_voip_leads_upload 
FOREIGN KEY (upload_id) REFERENCES public.voip_lead_uploads(id) ON DELETE SET NULL;

-- Create voip_admin_audit_log table for tracking admin actions
CREATE TABLE public.voip_admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voip_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role full access" ON public.voip_admin_audit_log FOR ALL USING (true) WITH CHECK (true);

-- Create voip_twilio_config table for Twilio settings
CREATE TABLE public.voip_twilio_config (
    id SERIAL PRIMARY KEY,
    account_sid TEXT,
    auth_token TEXT,
    outbound_number TEXT,
    is_active BOOLEAN DEFAULT false,
    updated_by INTEGER REFERENCES public.voip_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voip_twilio_config ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role full access" ON public.voip_twilio_config FOR ALL USING (true) WITH CHECK (true);

-- Create voip_worker_lead_history table to prevent repeat leads
CREATE TABLE public.voip_worker_lead_history (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES public.voip_leads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(worker_id, lead_id)
);

-- Enable RLS
ALTER TABLE public.voip_worker_lead_history ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role full access" ON public.voip_worker_lead_history FOR ALL USING (true) WITH CHECK (true);

-- Add new columns to voip_calls for lead tracking and outcomes
ALTER TABLE public.voip_calls 
ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES public.voip_leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS outcome TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS followup_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for updated_at on voip_leads
CREATE TRIGGER update_voip_leads_updated_at
BEFORE UPDATE ON public.voip_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create database function for atomic lead assignment with row locking
CREATE OR REPLACE FUNCTION public.assign_next_lead(p_worker_id INTEGER)
RETURNS TABLE(
    lead_id INTEGER,
    name TEXT,
    phone TEXT,
    email TEXT,
    website TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead_id INTEGER;
BEGIN
    -- First, release any expired locks
    UPDATE voip_leads
    SET status = 'NEW', assigned_to = NULL, assigned_at = NULL, locked_until = NULL
    WHERE status = 'ASSIGNED' 
    AND locked_until < now()
    AND id NOT IN (
        SELECT DISTINCT vc.lead_id FROM voip_calls vc WHERE vc.lead_id IS NOT NULL
    );
    
    -- Find and lock an available lead atomically
    SELECT l.id INTO v_lead_id
    FROM voip_leads l
    WHERE l.status = 'NEW'
    AND l.id NOT IN (
        SELECT wlh.lead_id FROM voip_worker_lead_history wlh WHERE wlh.worker_id = p_worker_id
    )
    ORDER BY l.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_lead_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Assign the lead to the worker
    UPDATE voip_leads
    SET status = 'ASSIGNED',
        assigned_to = p_worker_id,
        assigned_at = now(),
        locked_until = now() + interval '10 minutes'
    WHERE id = v_lead_id;
    
    -- Record in worker history to prevent repeat
    INSERT INTO voip_worker_lead_history (worker_id, lead_id)
    VALUES (p_worker_id, v_lead_id)
    ON CONFLICT (worker_id, lead_id) DO NOTHING;
    
    -- Return the lead details
    RETURN QUERY
    SELECT l.id, l.name, l.phone, l.email, l.website
    FROM voip_leads l
    WHERE l.id = v_lead_id;
END;
$$;