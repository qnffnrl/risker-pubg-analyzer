CREATE TABLE IF NOT EXISTS "ranked_stats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "player_id" uuid NOT NULL REFERENCES "players"("id"),
  "season_id" text NOT NULL,
  "ranked_data" jsonb NOT NULL,
  "fetched_at" timestamptz NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ranked_stats_player_id" ON "ranked_stats" ("player_id");
