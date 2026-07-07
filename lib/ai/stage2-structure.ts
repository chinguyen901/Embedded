import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { hasAiKey, STAGE2_MODEL } from "./provider";
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
 * Stage 2: dùng Gemini (không kèm tool search) để cấu trúc hóa dữ liệu thô
 * thành JSON tiếng Việt theo StructuredAnalysisSchema, qua `generateText` với
 * `output: Output.object(...)` (API `generateObject` đã deprecated trong ai@6).
 * Tách riêng khỏi stage 1 vì Gemini không hỗ trợ kết hợp search grounding +
 * structured output trong cùng 1 lời gọi — xem CLAUDE.md.
 */
export async function structureAnalysis(
  homeTeam: string,
  awayTeam: string,
  rawText: string,
  isMock: boolean,
): Promise<StructuredAnalysis> {
  if (!hasAiKey || isMock) {
    return mockStructuredAnalysis(homeTeam, awayTeam);
  }

  const runOnce = () =>
    generateText({
      model: google(STAGE2_MODEL),
      output: Output.object({ schema: StructuredAnalysisSchema }),
      prompt: buildPrompt(homeTeam, awayTeam, rawText),
    });

  try {
    try {
      const result = await runOnce();
      return result.output;
    } catch {
      const result = await runOnce();
      return result.output;
    }
  } catch (err) {
    throw new Error(
      `Không thể cấu trúc hóa dữ liệu phân tích (stage 2): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
