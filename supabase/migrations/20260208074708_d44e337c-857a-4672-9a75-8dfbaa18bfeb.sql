
-- WAF Rules table (configurable detection rules)
CREATE TABLE public.voip_waf_rules (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL, -- 'rate_limit', 'brute_force', 'endpoint_abuse'
  max_requests integer NOT NULL DEFAULT 60,
  time_window_seconds integer NOT NULL DEFAULT 10,
  block_duration_minutes integer NOT NULL DEFAULT 15,
  target_endpoints text[], -- null = all endpoints
  scope text NOT NULL DEFAULT 'all', -- 'all', 'sensitive_only'
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voip_waf_rules ENABLE ROW LEVEL SECURITY;

-- Request Logs table (sampled traffic logs)
CREATE TABLE public.voip_request_logs (
  id bigserial PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  method text,
  path text,
  status_code integer,
  response_ms integer,
  user_agent text,
  referer text,
  user_id integer REFERENCES public.voip_users(id),
  country text,
  is_suspicious boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  rule_triggered text,
  action_taken text
);

ALTER TABLE public.voip_request_logs ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX idx_request_logs_ip_timestamp ON public.voip_request_logs (ip_address, timestamp DESC);
CREATE INDEX idx_request_logs_timestamp ON public.voip_request_logs (timestamp DESC);
CREATE INDEX idx_request_logs_suspicious ON public.voip_request_logs (is_suspicious) WHERE is_suspicious = true;

-- Enhance blocked_ips table with new columns
ALTER TABLE public.voip_blocked_ips
  ADD COLUMN IF NOT EXISTS rule_id integer REFERENCES public.voip_waf_rules(id),
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS created_by_type text NOT NULL DEFAULT 'admin';

-- Add better index on blocked_ips for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active_lookup 
  ON public.voip_blocked_ips (ip_address, status, expires_at);

-- Add index on waf_rules
CREATE INDEX idx_waf_rules_enabled ON public.voip_waf_rules (enabled) WHERE enabled = true;

-- Seed default WAF rules
INSERT INTO public.voip_waf_rules (name, description, rule_type, max_requests, time_window_seconds, block_duration_minutes, scope)
VALUES 
  ('Rate Flood', 'More than 60 requests in 10 seconds', 'rate_limit', 60, 10, 15, 'all'),
  ('Sustained Flood', 'More than 300 requests in 60 seconds', 'rate_limit', 300, 60, 60, 'all'),
  ('Brute Force Login', 'More than 15 failed logins in 2 minutes', 'brute_force', 15, 120, 30, 'sensitive_only'),
  ('Sensitive Endpoint Abuse', 'Excessive hits to admin/leads/auth routes', 'endpoint_abuse', 30, 30, 15, 'sensitive_only');
