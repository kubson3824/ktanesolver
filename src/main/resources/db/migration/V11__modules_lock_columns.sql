-- Add lock columns for multi-client module locking (heartbeat 30s TTL).
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS locked_by_client_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS locked_by_display_name VARCHAR(255);
