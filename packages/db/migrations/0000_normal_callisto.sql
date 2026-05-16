CREATE TYPE "public"."platform" AS ENUM('steam', 'kakao', 'psn', 'xbox');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pubg_id" varchar(64) NOT NULL,
	"nickname" varchar(64) NOT NULL,
	"platform" "platform" NOT NULL,
	"region" varchar(16),
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_pubg_id_unique" UNIQUE("pubg_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pubg_match_id" varchar(128) NOT NULL,
	"map_name" varchar(64),
	"mode" varchar(32),
	"played_at" timestamp with time zone,
	"duration_sec" integer,
	"total_players" integer,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_pubg_match_id_unique" UNIQUE("pubg_match_id")
);
--> statement-breakpoint
CREATE TABLE "player_match_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"placement" integer,
	"kills" integer,
	"assists" integer,
	"damage_dealt" numeric(8, 2),
	"headshot_kills" integer,
	"distance_on_foot" numeric(10, 2),
	"distance_in_vehicle" numeric(10, 2),
	"time_survived" integer,
	"boosts" integer,
	"heals" integer,
	"weapons_acquired" integer,
	"revives" integer,
	"team_kills" integer,
	"raw_stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_style_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"match_count" integer NOT NULL,
	"aggression_score" numeric(5, 2),
	"survival_score" numeric(5, 2),
	"positioning_score" numeric(5, 2),
	"teamplay_score" numeric(5, 2),
	"aggression_metrics" jsonb,
	"survival_metrics" jsonb,
	"positioning_metrics" jsonb,
	"teamplay_metrics" jsonb,
	"weapon_preferences" jsonb,
	"map_preferences" jsonb,
	"llm_summary" text,
	"llm_generated_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"bull_job_id" varchar(128),
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(256) NOT NULL,
	"method" varchar(8) NOT NULL,
	"status_code" integer,
	"ip_address" varchar(64),
	"user_agent" text,
	"duration_ms" integer,
	"searched_player" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_style_analyses" ADD CONSTRAINT "play_style_analyses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_players_nickname" ON "players" USING btree ("nickname");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_players_pubg_id" ON "players" USING btree ("pubg_id");--> statement-breakpoint
CREATE INDEX "idx_matches_pubg_match_id" ON "matches" USING btree ("pubg_match_id");--> statement-breakpoint
CREATE INDEX "idx_matches_played_at" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_player_match_stats_unique" ON "player_match_stats" USING btree ("player_id","match_id");--> statement-breakpoint
CREATE INDEX "idx_player_match_stats_player_id" ON "player_match_stats" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_play_style_analyses_player_id" ON "play_style_analyses" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_play_style_analyses_expires_at" ON "play_style_analyses" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_analysis_jobs_player_id" ON "analysis_jobs" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_analysis_jobs_status" ON "analysis_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_traffic_logs_created_at" ON "traffic_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_traffic_logs_path" ON "traffic_logs" USING btree ("path");