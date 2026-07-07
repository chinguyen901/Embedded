CREATE TABLE "league_fixtures_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league" text NOT NULL,
	"fixtures" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "league_fixtures_cache_league_unique" UNIQUE("league")
);
