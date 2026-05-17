ALTER TABLE "player_match_stats"
  ADD COLUMN IF NOT EXISTS "dbnos" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "kill_streaks" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "swim_distance" numeric(10,2) DEFAULT '0';
