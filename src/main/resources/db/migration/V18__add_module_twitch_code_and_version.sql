ALTER TABLE modules
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN twitch_code VARCHAR(32);

CREATE UNIQUE INDEX modules_bomb_twitch_code_uq
  ON modules (bomb_id, twitch_code)
  WHERE twitch_code IS NOT NULL;
