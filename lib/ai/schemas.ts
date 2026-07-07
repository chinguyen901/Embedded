import { z } from "zod";

export const SourceSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const ExtractedSignalsSchema = z.object({
  homeRecentFormScore: z.number().min(0).max(1),
  awayRecentFormScore: z.number().min(0).max(1),
  homeGoalsForAvg: z.number().nullable(),
  homeGoalsAgainstAvg: z.number().nullable(),
  awayGoalsForAvg: z.number().nullable(),
  awayGoalsAgainstAvg: z.number().nullable(),
  homeKeyPlayersOutCount: z.number().min(0),
  awayKeyPlayersOutCount: z.number().min(0),
  headToHeadFactor: z.number().min(0).max(1),
  bookmakerOddsImplied: z
    .object({
      home: z.number(),
      draw: z.number(),
      away: z.number(),
    })
    .nullable(),
});
export type ExtractedSignals = z.infer<typeof ExtractedSignalsSchema>;

export const StructuredAnalysisSchema = z.object({
  homeFormSummary: z.string(),
  awayFormSummary: z.string(),
  headToHeadSummary: z.string(),
  keyFactors: z.array(z.string()),
  homeStrengths: z.array(z.string()),
  homeWeaknesses: z.array(z.string()),
  awayStrengths: z.array(z.string()),
  awayWeaknesses: z.array(z.string()),
  homeInjuries: z.array(z.string()),
  awayInjuries: z.array(z.string()),
  extractedSignals: ExtractedSignalsSchema,
});
export type StructuredAnalysis = z.infer<typeof StructuredAnalysisSchema>;

export const PredictionSchema = z.object({
  homeWinProb: z.number().min(0).max(1),
  drawProb: z.number().min(0).max(1),
  awayWinProb: z.number().min(0).max(1),
  rationale: z.string(),
  methodology: z.literal("heuristic-v1"),
});
export type Prediction = z.infer<typeof PredictionSchema>;

export interface MatchAnalysisResult {
  matchId: string;
  analysisId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  cached: boolean;
  isMock: boolean;
  fetchedAt: string;
  expiresAt: string;
  structuredAnalysis: StructuredAnalysis;
  prediction: Prediction;
  sources: Source[];
}
