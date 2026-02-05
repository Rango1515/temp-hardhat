-- Add category column to voip_support_tickets
ALTER TABLE public.voip_support_tickets
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Add has_new_reply column to track unread admin replies for users
ALTER TABLE public.voip_support_tickets
ADD COLUMN IF NOT EXISTS has_new_reply BOOLEAN DEFAULT false;