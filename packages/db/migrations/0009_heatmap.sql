ALTER TABLE play_style_analyses
  ADD COLUMN IF NOT EXISTS heatmap_data jsonb;
