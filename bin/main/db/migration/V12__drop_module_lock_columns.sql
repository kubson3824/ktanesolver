-- Remove lock columns (single-person use; no multi-client locking).
ALTER TABLE modules
  DROP COLUMN IF EXISTS locked_by_client_id,
  DROP COLUMN IF EXISTS locked_at,
  DROP COLUMN IF EXISTS locked_by_display_name;
