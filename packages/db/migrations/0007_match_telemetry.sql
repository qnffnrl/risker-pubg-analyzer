CREATE TABLE IF NOT EXISTS "match_telemetry" (
  "match_id" uuid PRIMARY KEY REFERENCES "matches"("id") ON DELETE CASCADE,
  "payload" jsonb NOT NULL,
  "event_count" integer,
  "payload_bytes" integer,
  "fetched_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_match_telemetry_fetched_at" ON "match_telemetry"("fetched_at");
