import { randomUUID } from "crypto";
import { searchMatchInfo } from "./ai/stage1-search";
import { structureAnalysis } from "./ai/stage2-structure";
import { predictMatch } from "./ai/stage3-predict";
import { STAGE1_MODEL, STAGE2_MODEL } from "./ai/gateway";
import type { MatchAnalysisResult } from "./ai/schemas";
import { buildCacheKey, computeExpiresAt, isFresh, TTL_HOURS } from "./cache/policy";
import { dbEnabled } from "./db";
import { getLatestAnalysis, getOrCreateMatch, insertAnalysis, type StoredAnalysis } from "./db/queries";

export interface AnalysisInput {
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate?: string | null;
}

function toResult(
  league: string,
  homeTeam: string,
  awayTeam: string,
  matchId: string,
  stored: StoredAnalysis,
  cached: boolean,
): MatchAnalysisResult {
  return {
    matchId,
    analysisId: stored.analysisId,
    league,
    homeTeam,
    awayTeam,
    cached,
    isMock: stored.isMock,
    fetchedAt: stored.fetchedAt.toISOString(),
    expiresAt: stored.expiresAt.toISOString(),
    structuredAnalysis: stored.structuredAnalysis,
    prediction: stored.prediction,
    sources: stored.sources,
  };
}

async function runFreshPipeline(league: string, homeTeam: string, awayTeam: string) {
  const stage1 = await searchMatchInfo(league, homeTeam, awayTeam);
  const structured = await structureAnalysis(homeTeam, awayTeam, stage1.rawText, stage1.isMock);
  const prediction = await predictMatch(
    homeTeam,
    awayTeam,
    structured.extractedSignals,
    structured.keyFactors,
    stage1.isMock,
  );
  return { stage1, structured, prediction };
}

/**
 * Orchestrator dùng chung cho cả API route và trang kết quả (Server Component).
 * Cache-first: luôn kiểm tra match_analyses trước khi gọi AI (TTL = ANALYSIS_TTL_HOURS giờ).
 */
export async function getOrRunAnalysis(input: AnalysisInput): Promise<MatchAnalysisResult> {
  const { league, homeTeam, awayTeam } = input;
  const matchDate = input.matchDate ?? null;
  const cacheKey = buildCacheKey(league, homeTeam, awayTeam, matchDate);

  if (dbEnabled) {
    const matchId = await getOrCreateMatch({ league, homeTeam, awayTeam, matchDate, cacheKey });
    const existing = await getLatestAnalysis(matchId);

    if (existing && isFresh(existing.expiresAt)) {
      return toResult(league, homeTeam, awayTeam, matchId, existing, true);
    }

    try {
      const { stage1, structured, prediction } = await runFreshPipeline(league, homeTeam, awayTeam);
      const fetchedAt = new Date();
      const stored = await insertAnalysis({
        matchId,
        rawSearchText: stage1.rawText,
        sources: stage1.sources,
        structuredAnalysis: structured,
        prediction,
        modelStage1: STAGE1_MODEL,
        modelStage2: STAGE2_MODEL,
        isMock: stage1.isMock,
        expiresAt: computeExpiresAt(fetchedAt),
      });
      return toResult(league, homeTeam, awayTeam, matchId, stored, false);
    } catch (err) {
      if (existing) {
        return toResult(league, homeTeam, awayTeam, matchId, existing, true);
      }
      throw err;
    }
  }

  // Không có DB: không cache, luôn chạy pipeline mới (dùng cho môi trường demo/dev).
  const { stage1, structured, prediction } = await runFreshPipeline(league, homeTeam, awayTeam);
  const fetchedAt = new Date();
  return {
    matchId: randomUUID(),
    analysisId: randomUUID(),
    league,
    homeTeam,
    awayTeam,
    cached: false,
    isMock: stage1.isMock,
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: computeExpiresAt(fetchedAt).toISOString(),
    structuredAnalysis: structured,
    prediction,
    sources: stage1.sources,
  };
}

export { TTL_HOURS };
