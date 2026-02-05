-- Phase 1: Database Schema Updates

-- Create voip_activity_events table for tracking user actions
CREATE TABLE IF NOT EXISTS public.voip_activity_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES voip_users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  lead_id INTEGER REFERENCES voip_leads(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create voip_user_sessions table for session/heartbeat tracking
CREATE TABLE IF NOT EXISTS public.voip_user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES voip_users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  is_idle BOOLEAN DEFAULT FALSE,
  total_active_seconds INTEGER DEFAULT 0
);

-- Add new columns to voip_calls table
ALTER TABLE voip_calls ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER;
ALTER TABLE voip_calls ADD COLUMN IF NOT EXISTS appointment_created BOOLEAN DEFAULT FALSE;

-- Add new columns to voip_users table for user management
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
ALTER TABLE voip_users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voip_activity_events_user_id ON voip_activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_voip_activity_events_event_type ON voip_activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_voip_activity_events_created_at ON voip_activity_events(created_at);
CREATE INDEX IF NOT EXISTS idx_voip_user_sessions_user_id ON voip_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voip_user_sessions_last_heartbeat ON voip_user_sessions(last_heartbeat);