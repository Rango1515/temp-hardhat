
-- Phase 1: Partner Program Database Schema

-- 1.1 Add 'partner' to voip_role enum
ALTER TYPE public.voip_role ADD VALUE IF NOT EXISTS 'partner';

-- 1.2 Add partner_id column to voip_users (links a client to their referring partner)
ALTER TABLE public.voip_users ADD COLUMN IF NOT EXISTS partner_id integer REFERENCES public.voip_users(id) ON DELETE SET NULL;

-- 1.3 Create voip_partner_profiles table
CREATE TABLE IF NOT EXISTS public.voip_partner_profiles (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES public.voip_users(id) ON DELETE CASCADE,
  phone text,
  payout_method text,
  payout_details text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.4 Create voip_partner_tokens table
CREATE TABLE IF NOT EXISTS public.voip_partner_tokens (
  id serial PRIMARY KEY,
  token_code text NOT NULL UNIQUE,
  partner_id integer NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_by integer REFERENCES public.voip_users(id),
  created_at timestamptz DEFAULT now()
);

-- 1.5 Create voip_partner_token_usage table
CREATE TABLE IF NOT EXISTS public.voip_partner_token_usage (
  id serial PRIMARY KEY,
  token_id integer NOT NULL REFERENCES public.voip_partner_tokens(id) ON DELETE CASCADE,
  client_user_id integer NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 1.6 Create voip_revenue_events table
CREATE TABLE IF NOT EXISTS public.voip_revenue_events (
  id serial PRIMARY KEY,
  client_id integer NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
  partner_id integer NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 1.7 Create voip_commissions table
CREATE TABLE IF NOT EXISTS public.voip_commissions (
  id serial PRIMARY KEY,
  revenue_event_id integer NOT NULL REFERENCES public.voip_revenue_events(id) ON DELETE CASCADE,
  partner_id integer NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
  commission_amount numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0.05,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 1.8 Create voip_partner_settings table (singleton config)
CREATE TABLE IF NOT EXISTS public.voip_partner_settings (
  id serial PRIMARY KEY,
  commission_rate numeric NOT NULL DEFAULT 0.05,
  bonus_type text NOT NULL DEFAULT 'flat_amount',
  bonus_value numeric NOT NULL DEFAULT 0,
  bonus_enabled boolean NOT NULL DEFAULT false,
  apply_bonus_once_per_client boolean NOT NULL DEFAULT true,
  updated_by integer REFERENCES public.voip_users(id),
  updated_at timestamptz DEFAULT now()
);

-- Insert default partner settings row
INSERT INTO public.voip_partner_settings (commission_rate, bonus_type, bonus_value, bonus_enabled, apply_bonus_once_per_client)
VALUES (0.05, 'flat_amount', 0, false, true);

-- 1.9 Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voip_users_partner_id ON public.voip_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_voip_partner_tokens_partner_id ON public.voip_partner_tokens(partner_id);
CREATE INDEX IF NOT EXISTS idx_voip_partner_tokens_token_code ON public.voip_partner_tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_voip_partner_tokens_status ON public.voip_partner_tokens(status);
CREATE INDEX IF NOT EXISTS idx_voip_revenue_events_partner_id ON public.voip_revenue_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_voip_revenue_events_client_id ON public.voip_revenue_events(client_id);
CREATE INDEX IF NOT EXISTS idx_voip_revenue_events_created_at ON public.voip_revenue_events(created_at);
CREATE INDEX IF NOT EXISTS idx_voip_commissions_partner_id ON public.voip_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_voip_commissions_status ON public.voip_commissions(status);
CREATE INDEX IF NOT EXISTS idx_voip_partner_token_usage_token_id ON public.voip_partner_token_usage(token_id);
