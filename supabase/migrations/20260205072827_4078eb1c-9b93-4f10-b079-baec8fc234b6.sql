-- Enable RLS on new chat tables
ALTER TABLE public.voip_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_chat_user_status ENABLE ROW LEVEL SECURITY;

-- Chat tables are accessed via edge functions using service role, so we don't need RLS policies
-- The edge functions handle authorization internally based on the VoIP auth system