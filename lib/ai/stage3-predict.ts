import { generateText } from "ai";
import { hasGatewayKey, STAGE3_MODEL } from "./gateway";
import { mockRationale } from "./mock-data";
import type { ExtractedSignals, Prediction } from "./schemas";

const HOME_ADVANTAGE = 0.1;
const DRAW_BASE = 0.24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizedGoalDiff(goalsFor: number | null, goalsAgainst: number | null): number {
  if (goalsFor === null || goalsAgainst === null) return 0.5;
  const diff = goalsFor - goalsAgainst;
  // squash diff (-3..3) into 0..1
  return clamp(0.5 + diff / 6, 0, 1);
}

function injuryImpact(count: number): number {
  return clamp(count / 5, 0, 1);
}

function bookmakerStrength(prob: number | undefined): number {
  return typeof prob === "number" ? clamp(prob, 0, 1) : 0.5;
}

/**
 * Tính xác suất thắng/hòa/thua bằng công thức xác định (không gọi AI).
 * Xem CLAUDE.md mục "Quyết định kiến trúc quan trọng" để biết lý do không
 * hỏi thẳng LLM về xác suất.
 */
export function computeProbabilities(
  signals: ExtractedSignals,
): Pick<Prediction, "homeWinProb" | "drawProb" | "awayWinProb"> {
  const homeStrength =
    0.35 * signals.homeRecentFormScore +
    0.2 * normalizedGoalDiff(signals.homeGoalsForAvg, signals.homeGoalsAgainstAvg) +
    0.15 * (1 - injuryImpact(signals.homeKeyPlayersOutCount)) +
    0.15 * bookmakerStrength(signals.bookmakerOddsImplied?.home) +
    0.15 * signals.headToHeadFactor +
    HOME_ADVANTAGE;

  const awayStrength =
    0.35 * signals.awayRecentFormScore +
    0.2 * normalizedGoalDiff(signals.awayGoalsForAvg, signals.awayGoalsAgainstAvg) +
    0.15 * (1 - injuryImpact(signals.awayKeyPlayersOutCount)) +
    0.15 * bookmakerStrength(signals.bookmakerOddsImplied?.away) +
    0.15 * (1 - signals.headToHeadFactor);

  const diff = homeStrength - awayStrength;
  const drawProb = clamp(DRAW_BASE - Math.abs(diff) * 0.15, 0.12, 0.32);
  const remaining = 1 - drawProb;
  const homeWinProb = remaining * (1 / (1 + Math.exp(-4 * diff)));
  const awayWinProb = remaining - homeWinProb;

  return {
    homeWinProb: Number(homeWinProb.toFixed(3)),
    drawProb: Number(drawProb.toFixed(3)),
    awayWinProb: Number(awayWinProb.toFixed(3)),
  };
}

async function generateRationale(
  homeTeam: string,
  awayTeam: string,
  probs: Pick<Prediction, "homeWinProb" | "drawProb" | "awayWinProb">,
  keyFactors: string[],
  isMock: boolean,
): Promise<string> {
  if (!hasGatewayKey || isMock) {
    return mockRationale(homeTeam, awayTeam, probs);
  }

  try {
    const { text } = await generateText({
      model: STAGE3_MODEL,
      prompt: `Trận đấu ${homeTeam} (nhà) vs ${awayTeam} (khách). Xác suất đã tính: ${homeTeam} thắng ${(probs.homeWinProb * 100).toFixed(0)}%, hòa ${(probs.drawProb * 100).toFixed(0)}%, ${awayTeam} thắng ${(probs.awayWinProb * 100).toFixed(0)}%.
Các yếu tố chính: ${keyFactors.join("; ")}.
Hãy viết 2-4 câu bằng tiếng Việt giải thích ngắn gọn vì sao tỷ lệ trên hợp lý, dựa trên các yếu tố đã cho. Không lặp lại con số phần trăm nguyên văn nhiều lần, chỉ giải thích nguyên nhân.`,
    });
    return text;
  } catch {
    return `Dự đoán dựa trên phân tích phong độ, lịch sử đối đầu và các yếu tố hiện có giữa ${homeTeam} và ${awayTeam}.`;
  }
}

export async function predictMatch(
  homeTeam: string,
  awayTeam: string,
  signals: ExtractedSignals,
  keyFactors: string[],
  isMock: boolean,
): Promise<Prediction> {
  const probs = computeProbabilities(signals);
  const rationale = await generateRationale(homeTeam, awayTeam, probs, keyFactors, isMock);
  return {
    ...probs,
    rationale,
    methodology: "heuristic-v1",
  };
}
