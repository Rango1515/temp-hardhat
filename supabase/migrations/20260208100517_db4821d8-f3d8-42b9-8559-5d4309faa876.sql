
-- Create IP whitelist table
CREATE TABLE public.voip_whitelisted_ips (
  id SERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  label TEXT,
  added_by INTEGER REFERENCES public.voip_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (managed via edge functions with service role)
ALTER TABLE public.voip_whitelisted_ips ENABLE ROW LEVEL SECURITY;

-- Unblock the user's IP
UPDATE public.voip_blocked_ips 
SET status = 'manual_unblock' 
WHERE ip_address = '71.83.199.165' AND status = 'active';

-- Whitelist the user's IP
INSERT INTO public.voip_whitelisted_ips (ip_address, label)
VALUES ('71.83.199.165', 'Admin — Owner IP')
ON CONFLICT (ip_address) DO NOTHING;
