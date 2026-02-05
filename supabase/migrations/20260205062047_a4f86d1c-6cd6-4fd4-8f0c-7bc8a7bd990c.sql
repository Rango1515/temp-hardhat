-- Enable RLS on new tables (accessed via edge functions)
ALTER TABLE voip_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voip_user_sessions ENABLE ROW LEVEL SECURITY;