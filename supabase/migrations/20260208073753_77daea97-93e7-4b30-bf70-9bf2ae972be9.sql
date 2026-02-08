
-- Security monitoring tables

CREATE TABLE public.voip_security_logs (
  id serial PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  endpoint text,
  request_count integer DEFAULT 1,
  user_agent text,
  status text NOT NULL DEFAULT 'normal',
  user_id integer REFERENCES public.voip_users(id),
  rule_triggered text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.voip_blocked_ips (
  id serial PRIMARY KEY,
  ip_address text NOT NULL,
  reason text,
  blocked_by integer REFERENCES public.voip_users(id),
  blocked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (access via service-role edge functions only)
ALTER TABLE public.voip_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_blocked_ips ENABLE ROW LEVEL SECURITY;

-- Index for fast IP lookups in detection rules
CREATE INDEX idx_security_logs_ip_timestamp ON public.voip_security_logs (ip_address, timestamp DESC);
CREATE INDEX idx_security_logs_status ON public.voip_security_logs (status);
CREATE INDEX idx_blocked_ips_ip_status ON public.voip_blocked_ips (ip_address, status);
