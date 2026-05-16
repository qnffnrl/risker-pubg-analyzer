CREATE TABLE IF NOT EXISTS "weapon_stats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "player_id" uuid NOT NULL REFERENCES "players"("id"),
  "weapon_data" jsonb NOT NULL,
  "fetched_at" timestamptz NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_weapon_stats_player_id" ON "weapon_stats" ("player_id");
