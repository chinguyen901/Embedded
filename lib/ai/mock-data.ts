import type { ExtractedSignals, Prediction, Source, StructuredAnalysis } from "./schemas";

/**
 * Dữ liệu giả lập dùng khi chưa cấu hình GOOGLE_GENERATIVE_AI_API_KEY, để có thể phát triển
 * và kiểm tra giao diện mà không cần gọi AI thật. Xem CLAUDE.md mục "Chế độ demo".
 */

function seedFromNames(homeTeam: string, awayTeam: string): number {
  const str = homeTeam + awayTeam;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function rand(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

export function mockRawSearchText(homeTeam: string, awayTeam: string): string {
  return `[DỮ LIỆU DEMO - chưa cấu hình GOOGLE_GENERATIVE_AI_API_KEY]
${homeTeam} gần đây thi đấu ổn định trên sân nhà, trong khi ${awayTeam} có phong độ thất thường ở các trận sân khách gần nhất.
Không có dữ liệu chấn thương/treo giò xác thực trong chế độ demo.
Đây là văn bản giả lập để kiểm tra giao diện, không phản ánh thông tin thật.`;
}

export function mockSources(homeTeam: string, awayTeam: string): Source[] {
  return [
    { url: "https://example.com/demo-source-1", title: `Phong độ gần đây của ${homeTeam} (demo)` },
    { url: "https://example.com/demo-source-2", title: `Thống kê đối đầu ${homeTeam} vs ${awayTeam} (demo)` },
  ];
}

export function mockStructuredAnalysis(homeTeam: string, awayTeam: string): StructuredAnalysis {
  const seed = seedFromNames(homeTeam, awayTeam);
  const homeForm = rand(seed, 0.35, 0.85);
  const awayForm = rand(seed + 1, 0.35, 0.85);

  const extractedSignals: ExtractedSignals = {
    homeRecentFormScore: Number(homeForm.toFixed(2)),
    awayRecentFormScore: Number(awayForm.toFixed(2)),
    homeGoalsForAvg: Number(rand(seed + 2, 1.0, 2.4).toFixed(2)),
    homeGoalsAgainstAvg: Number(rand(seed + 3, 0.6, 1.6).toFixed(2)),
    awayGoalsForAvg: Number(rand(seed + 4, 1.0, 2.4).toFixed(2)),
    awayGoalsAgainstAvg: Number(rand(seed + 5, 0.6, 1.6).toFixed(2)),
    homeKeyPlayersOutCount: Math.round(rand(seed + 6, 0, 3)),
    awayKeyPlayersOutCount: Math.round(rand(seed + 7, 0, 3)),
    headToHeadFactor: Number(rand(seed + 8, 0.3, 0.7).toFixed(2)),
    bookmakerOddsImplied: null,
  };

  return {
    homeFormSummary: `[Demo] ${homeTeam} có phong độ ${homeForm > 0.6 ? "tốt" : "trung bình"} trong 5 trận gần nhất trên sân nhà.`,
    awayFormSummary: `[Demo] ${awayTeam} có phong độ ${awayForm > 0.6 ? "khá tốt" : "không ổn định"} khi thi đấu xa nhà gần đây.`,
    headToHeadSummary: `[Demo] Hai đội có lịch sử đối đầu cân bằng trong các lần gặp nhau gần nhất.`,
    keyFactors: [
      "Đây là dữ liệu demo, chưa kết nối AI thật.",
      `${homeTeam} có lợi thế sân nhà.`,
      `${awayTeam} cần cải thiện khả năng ghi bàn xa nhà.`,
    ],
    homeStrengths: [`Hàng công ổn định`, `Lợi thế sân nhà`],
    homeWeaknesses: [`Hàng thủ đôi lúc thiếu chắc chắn`],
    awayStrengths: [`Phản công nhanh`],
    awayWeaknesses: [`Thiếu vắng một số trụ cột`],
    homeInjuries: extractedSignals.homeKeyPlayersOutCount > 0 ? [`${extractedSignals.homeKeyPlayersOutCount} cầu thủ chấn thương (demo)`] : [],
    awayInjuries: extractedSignals.awayKeyPlayersOutCount > 0 ? [`${extractedSignals.awayKeyPlayersOutCount} cầu thủ chấn thương (demo)`] : [],
    extractedSignals,
  };
}

export function mockRationale(homeTeam: string, awayTeam: string, prediction: Pick<Prediction, "homeWinProb" | "drawProb" | "awayWinProb">): string {
  const leader = prediction.homeWinProb >= prediction.awayWinProb ? homeTeam : awayTeam;
  return `[Demo] ${leader} được đánh giá nhỉnh hơn dựa trên phong độ gần đây và dữ liệu giả lập. Đây không phải dự đoán thật vì chưa cấu hình GOOGLE_GENERATIVE_AI_API_KEY.`;
}
