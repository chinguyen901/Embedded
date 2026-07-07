CREATE TABLE "match_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"raw_search_text" text NOT NULL,
	"sources" jsonb NOT NULL,
	"structured_analysis" jsonb NOT NULL,
	"prediction" jsonb NOT NULL,
	"model_stage1" text NOT NULL,
	"model_stage2" text NOT NULL,
	"is_mock" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"match_date" text,
	"cache_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
ALTER TABLE "match_analyses" ADD CONSTRAINT "match_analyses_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_analyses_match_id_fetched_at_idx" ON "match_analyses" USING btree ("match_id","fetched_at");