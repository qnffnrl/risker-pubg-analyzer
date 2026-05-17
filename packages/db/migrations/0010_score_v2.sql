ALTER TABLE play_style_analyses
  ADD COLUMN IF NOT EXISTS score_version varchar(8) DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS aggression_score_v2 numeric(5,2),
  ADD COLUMN IF NOT EXISTS survival_score_v2 numeric(5,2),
  ADD COLUMN IF NOT EXISTS positioning_score_v2 numeric(5,2),
  ADD COLUMN IF NOT EXISTS teamplay_score_v2 numeric(5,2),
  ADD COLUMN IF NOT EXISTS aggression_metrics_v2 jsonb,
  ADD COLUMN IF NOT EXISTS survival_metrics_v2 jsonb,
  ADD COLUMN IF NOT EXISTS positioning_score_v2_metrics jsonb,
  ADD COLUMN IF NOT EXISTS teamplay_metrics_v2 jsonb,
  ADD COLUMN IF NOT EXISTS skill_score numeric(5,2);
