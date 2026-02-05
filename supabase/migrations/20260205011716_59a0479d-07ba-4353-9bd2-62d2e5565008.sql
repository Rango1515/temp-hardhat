-- Drop all permissive "Service role full access" policies that expose data publicly
-- Edge Functions use service role key which bypasses RLS entirely
-- With RLS enabled and NO policies, only service role can access - this is the correct pattern

DROP POLICY IF EXISTS "Service role full access" ON public.voip_users;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_phone_numbers;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_calls;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_api_keys;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_number_requests;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_signup_tokens;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_refresh_tokens;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_leads;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_lead_uploads;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_admin_audit_log;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_twilio_config;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_duplicate_leads;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_appointments;
DROP POLICY IF EXISTS "Service role full access" ON public.voip_worker_lead_history;