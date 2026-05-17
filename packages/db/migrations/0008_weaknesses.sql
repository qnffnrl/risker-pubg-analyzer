ALTER TABLE play_style_analyses
  ADD COLUMN IF NOT EXISTS top_weakness jsonb,
  ADD COLUMN IF NOT EXISTS all_weaknesses jsonb;
