ALTER TABLE voip_appointments
  ADD COLUMN IF NOT EXISTS selected_plan TEXT,
  ADD COLUMN IF NOT EXISTS negotiated_price TEXT;