ALTER TABLE "play_style_analyses"
  ADD COLUMN IF NOT EXISTS "consistency_score" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "clutch_score" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "consistency_metrics" jsonb,
  ADD COLUMN IF NOT EXISTS "clutch_metrics" jsonb;
