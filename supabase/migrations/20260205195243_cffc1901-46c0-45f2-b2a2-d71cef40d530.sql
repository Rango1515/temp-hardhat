-- Add contact_name column to voip_leads for the person's name (separate from company name)
ALTER TABLE public.voip_leads ADD COLUMN contact_name text DEFAULT NULL;