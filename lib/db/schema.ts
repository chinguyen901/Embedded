import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  league: text("league").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  matchDate: text("match_date"),
  cacheKey: text("cache_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchAnalyses = pgTable(
  "match_analyses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    rawSearchText: text("raw_search_text").notNull(),
    sources: jsonb("sources").notNull(),
    structuredAnalysis: jsonb("structured_analysis").notNull(),
    prediction: jsonb("prediction").notNull(),
    modelStage1: text("model_stage1").notNull(),
    modelStage2: text("model_stage2").notNull(),
    isMock: boolean("is_mock").notNull().default(false),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("match_analyses_match_id_fetched_at_idx").on(table.matchId, table.fetchedAt)],
);
