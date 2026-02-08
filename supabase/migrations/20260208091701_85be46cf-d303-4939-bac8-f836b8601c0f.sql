
-- Simple key-value config table for app-level settings (Discord webhook, etc.)
CREATE TABLE public.voip_app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by INTEGER REFERENCES public.voip_users(id)
);

-- No RLS needed — accessed only via edge functions with admin auth checks
ALTER TABLE public.voip_app_config ENABLE ROW LEVEL SECURITY;
