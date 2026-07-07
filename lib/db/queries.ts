import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { matchAnalyses, matches } from "./schema";
import type { Prediction, Source, StructuredAnalysis } from "../ai/schemas";

export interface MatchInput {
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | null;
  cacheKey: string;
}

export interface StoredAnalysis {
  matchId: string;
  analysisId: string;
  rawSearchText: string;
  sources: Source[];
  structuredAnalysis: StructuredAnalysis;
  prediction: Prediction;
  isMock: boolean;
  fetchedAt: Date;
  expiresAt: Date;
}

export async function getOrCreateMatch(input: MatchInput): Promise<string> {
  if (!db) throw new Error("DB không được cấu hình");

  const existing = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.cacheKey, input.cacheKey))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const inserted = await db
    .insert(matches)
    .values({
      league: input.league,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      matchDate: input.matchDate,
      cacheKey: input.cacheKey,
    })
    .onConflictDoNothing({ target: matches.cacheKey })
    .returning({ id: matches.id });

  if (inserted.length > 0) return inserted[0].id;

  const retry = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.cacheKey, input.cacheKey))
    .limit(1);
  return retry[0].id;
}

export async function getLatestAnalysis(matchId: string): Promise<StoredAnalysis | null> {
  if (!db) return null;

  const rows = await db
    .select()
    .from(matchAnalyses)
    .where(eq(matchAnalyses.matchId, matchId))
    .orderBy(desc(matchAnalyses.fetchedAt))
    .limit(1);

  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function getLatestAnalysisById(analysisId: string): Promise<StoredAnalysis | null> {
  if (!db) return null;

  const rows = await db
    .select()
    .from(matchAnalyses)
    .where(eq(matchAnalyses.id, analysisId))
    .limit(1);

  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function insertAnalysis(params: {
  matchId: string;
  rawSearchText: string;
  sources: Source[];
  structuredAnalysis: StructuredAnalysis;
  prediction: Prediction;
  modelStage1: string;
  modelStage2: string;
  isMock: boolean;
  expiresAt: Date;
}): Promise<StoredAnalysis> {
  if (!db) throw new Error("DB không được cấu hình");

  const inserted = await db
    .insert(matchAnalyses)
    .values({
      matchId: params.matchId,
      rawSearchText: params.rawSearchText,
      sources: params.sources,
      structuredAnalysis: params.structuredAnalysis,
      prediction: params.prediction,
      modelStage1: params.modelStage1,
      modelStage2: params.modelStage2,
      isMock: params.isMock,
      expiresAt: params.expiresAt,
    })
    .returning();

  return mapRow(inserted[0]);
}

function mapRow(row: typeof matchAnalyses.$inferSelect): StoredAnalysis {
  return {
    matchId: row.matchId,
    analysisId: row.id,
    rawSearchText: row.rawSearchText,
    sources: row.sources as Source[],
    structuredAnalysis: row.structuredAnalysis as StructuredAnalysis,
    prediction: row.prediction as Prediction,
    isMock: row.isMock,
    fetchedAt: row.fetchedAt,
    expiresAt: row.expiresAt,
  };
}
