import { generateObject } from "ai";
import { hasGatewayKey, STAGE2_MODEL } from "./gateway";
import { mockStructuredAnalysis } from "./mock-data";
import { StructuredAnalysisSchema, type StructuredAnalysis } from "./schemas";

function buildPrompt(homeTeam: string, awayTeam: string, rawText: string): string {
  return `Dựa trên dữ liệu thô sau đây về trận đấu giữa ${homeTeam} (sân nhà) và ${awayTeam} (sân khách), hãy trích xuất và cấu trúc lại thông tin bằng TIẾNG VIỆT, súc tích, dễ hiểu cho người hâm mộ bóng đá.

Nếu dữ liệu thô thiếu thông tin nào, hãy dùng giá trị trung tính hợp lý (ví dụ 0.5 cho các form score) và ghi chú rõ trong phần tóm tắt rằng dữ liệu không đầy đủ. Trường "headToHeadFactor" là một số từ 0 đến 1 thể hiện đội nhà có lợi thế đối đầu (0.5 = cân bằng, >0.5 = đội nhà nhỉnh hơn).

Dữ liệu thô:
"""
${rawText}
"""`;
}

/**
 * Stage 2: dùng model khác (không phải Perplexity Sonar) để cấu trúc hóa dữ liệu thô
 * thành JSON tiếng Việt theo StructuredAnalysisSchema. Xem CLAUDE.md để biết lý do
 * không dùng generateObject trực tiếp trên Sonar.
 */
export async function structureAnalysis(
  homeTeam: string,
  awayTeam: string,
  rawText: string,
  isMock: boolean,
): Promise<StructuredAnalysis> {
  if (!hasGatewayKey || isMock) {
    return mockStructuredAnalysis(homeTeam, awayTeam);
  }

  const runOnce = () =>
    generateObject({
      model: STAGE2_MODEL,
      schema: StructuredAnalysisSchema,
      prompt: buildPrompt(homeTeam, awayTeam, rawText),
    });

  try {
    try {
      const { object } = await runOnce();
      return object;
    } catch {
      const { object } = await runOnce();
      return object;
    }
  } catch (err) {
    throw new Error(
      `Không thể cấu trúc hóa dữ liệu phân tích (stage 2): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
