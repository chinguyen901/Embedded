import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { hasAiKey, STAGE1_MODEL } from "./provider";
import { mockRawSearchText, mockSources } from "./mock-data";
import type { Source } from "./schemas";

export interface Stage1Result {
  rawText: string;
  sources: Source[];
  isMock: boolean;
}

function buildPrompt(league: string, homeTeam: string, awayTeam: string): string {
  return `Bạn là một nhà phân tích bóng đá. Hãy tìm kiếm thông tin mới nhất (ưu tiên trong 7 ngày qua) về trận đấu sắp diễn ra giữa ${homeTeam} (sân nhà) và ${awayTeam} (sân khách), thuộc giải đấu: ${league}.

Cung cấp các thông tin sau, có trích dẫn nguồn cụ thể:
1. Phong độ gần đây của mỗi đội (5 trận gần nhất: thắng/hòa/thua, bàn thắng/bàn thua).
2. Lịch sử đối đầu (head-to-head) gần đây giữa hai đội.
3. Chấn thương / treo giò của các cầu thủ quan trọng ở mỗi đội.
4. Tin tức đội hình dự kiến (lineup rumors).
5. Kèo nhà cái nếu có thông tin công khai (tỷ lệ thắng/hòa/thua hoặc kèo châu Á).
6. Vị trí hiện tại trên bảng xếp hạng của mỗi đội.

Nếu không tìm thấy thông tin xác thực cho một mục, hãy nói rõ "không có dữ liệu" thay vì suy đoán.`;
}

/**
 * Stage 1: gọi Gemini kèm tool Google Search (grounding) để lấy thông tin cập nhật.
 * Cố tình KHÔNG dùng generateObject ở bước này — Gemini không hỗ trợ kết hợp
 * search grounding + structured output trong cùng 1 lời gọi. Xem CLAUDE.md mục
 * "Quyết định kiến trúc quan trọng".
 */
export async function searchMatchInfo(
  league: string,
  homeTeam: string,
  awayTeam: string,
): Promise<Stage1Result> {
  if (!hasAiKey) {
    return {
      rawText: mockRawSearchText(homeTeam, awayTeam),
      sources: mockSources(homeTeam, awayTeam),
      isMock: true,
    };
  }

  const runOnce = () =>
    generateText({
      model: google(STAGE1_MODEL),
      tools: { google_search: google.tools.googleSearch({}) },
      prompt: buildPrompt(league, homeTeam, awayTeam),
    });

  try {
    let result;
    try {
      result = await runOnce();
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      result = await runOnce();
    }

    const sources: Source[] = result.sources
      .filter((s) => s.sourceType === "url")
      .map((s) => ({ url: s.url, title: s.title }));

    return { rawText: result.text, sources, isMock: false };
  } catch (err) {
    throw new Error(
      `Không thể tìm kiếm thông tin trận đấu (stage 1): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
