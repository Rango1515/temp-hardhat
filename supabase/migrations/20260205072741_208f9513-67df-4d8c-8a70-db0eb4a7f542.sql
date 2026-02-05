-- Add soft delete columns to voip tables for trash functionality
ALTER TABLE public.voip_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.voip_appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.voip_calls ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.voip_signup_tokens ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.voip_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_voip_leads_deleted_at ON public.voip_leads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_voip_appointments_deleted_at ON public.voip_appointments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_voip_calls_deleted_at ON public.voip_calls(deleted_at);

-- Create storage bucket for chat uploads and documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voip-uploads', 'voip-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voip-uploads bucket
CREATE POLICY "Anyone can view voip uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'voip-uploads');

CREATE POLICY "Authenticated users can upload to voip-uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'voip-uploads');

CREATE POLICY "Users can update their own uploads" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'voip-uploads');

CREATE POLICY "Users can delete their own uploads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'voip-uploads');

-- Team Chat Tables
CREATE TABLE IF NOT EXISTS public.voip_chat_channels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    admin_only BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES public.voip_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.voip_chat_messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES public.voip_chat_channels(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.voip_users(id),
    content TEXT NOT NULL,
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.voip_chat_user_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_muted BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMP WITH TIME ZONE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default channels
INSERT INTO public.voip_chat_channels (name, description, admin_only) VALUES
('general', 'General discussion for all team members', FALSE),
('support', 'Get help from the team', FALSE),
('announcements', 'Important updates from admins', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for chat
CREATE INDEX IF NOT EXISTS idx_voip_chat_messages_channel ON public.voip_chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_voip_chat_messages_user ON public.voip_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_voip_chat_messages_created ON public.voip_chat_messages(created_at DESC);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.voip_chat_messages;