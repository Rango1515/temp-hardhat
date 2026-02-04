-- Create enum for VoIP user roles
CREATE TYPE public.voip_role AS ENUM ('admin', 'client');

-- VoIP Users table (separate from Supabase auth for custom auth flow)
CREATE TABLE public.voip_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role voip_role NOT NULL DEFAULT 'client',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VoIP Phone Numbers
CREATE TABLE public.voip_phone_numbers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.voip_users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    friendly_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    monthly_cost DECIMAL(10,2) DEFAULT 1.00,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VoIP Calls
CREATE TABLE public.voip_calls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.voip_users(id) ON DELETE CASCADE,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'outbound',
    status TEXT NOT NULL DEFAULT 'completed',
    duration_seconds INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    recording_url TEXT
);

-- VoIP API Keys
CREATE TABLE public.voip_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.voip_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['calls:read', 'calls:write'],
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VoIP Number Requests
CREATE TABLE public.voip_number_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.voip_users(id) ON DELETE CASCADE,
    area_code TEXT,
    country TEXT DEFAULT 'US',
    number_type TEXT DEFAULT 'local',
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    assigned_number_id INTEGER REFERENCES public.voip_phone_numbers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VoIP Signup Tokens (invite-only system)
CREATE TABLE public.voip_signup_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    email TEXT,
    created_by INTEGER REFERENCES public.voip_users(id),
    used_by INTEGER REFERENCES public.voip_users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VoIP Refresh Tokens
CREATE TABLE public.voip_refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.voip_users(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.voip_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_number_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_signup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies allowing service role full access (Edge Functions use service role)
CREATE POLICY "Service role full access" ON public.voip_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.voip_phone_numbers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.voip_calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.voip_api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.voip_number_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.voip_signup_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.voip_refresh_tokens FOR ALL USING (true) WITH CHECK (true);

-- Insert admin user (password will be hashed by the edge function on first login attempt)
-- Using bcrypt hash for: jQgICR3qcuhkHo4ThS15iovqmoq
INSERT INTO public.voip_users (name, email, password_hash, role, status)
VALUES ('Admin', 'admin@hardhathosting.work', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjC9kBq5QJQKpf6KJxB5TE5fYxvFOi', 'admin', 'active');

-- Insert initial admin signup token for backup
INSERT INTO public.voip_signup_tokens (token, email, expires_at)
VALUES ('ADMIN-SETUP-2024', 'admin@hardhathosting.work', NOW() + INTERVAL '30 days');