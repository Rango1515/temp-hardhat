-- =============================================
-- 1. Channel Read State Tracking (for unread badges)
-- =============================================
CREATE TABLE public.voip_chat_channel_reads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
    channel_id INTEGER NOT NULL REFERENCES public.voip_chat_channels(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_voip_chat_channel_reads_user ON public.voip_chat_channel_reads(user_id);
CREATE INDEX idx_voip_chat_channel_reads_channel ON public.voip_chat_channel_reads(channel_id);

-- Enable RLS (edge function handles auth)
ALTER TABLE public.voip_chat_channel_reads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. Support Tickets System
-- =============================================
CREATE TABLE public.voip_support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    assigned_to INTEGER REFERENCES public.voip_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_voip_support_tickets_user ON public.voip_support_tickets(user_id);
CREATE INDEX idx_voip_support_tickets_status ON public.voip_support_tickets(status);
CREATE INDEX idx_voip_support_tickets_assigned ON public.voip_support_tickets(assigned_to);

-- Ticket messages/replies
CREATE TABLE public.voip_support_ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES public.voip_support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT DEFAULT NULL,
    is_admin_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_voip_support_ticket_messages_ticket ON public.voip_support_ticket_messages(ticket_id);

-- Enable RLS
ALTER TABLE public.voip_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. User Preferences (for theme persistence)
-- =============================================
CREATE TABLE public.voip_user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.voip_users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    accent_color TEXT DEFAULT 'orange',
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_voip_user_preferences_user ON public.voip_user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.voip_user_preferences ENABLE ROW LEVEL SECURITY;