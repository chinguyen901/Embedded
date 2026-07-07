import { NextResponse } from "next/server";
import { getLatestAnalysisById } from "@/lib/db/queries";
import { dbEnabled } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!dbEnabled) {
    return NextResponse.json(
      { message: "Chưa cấu hình cơ sở dữ liệu, không thể tra cứu kết quả đã lưu." },
      { status: 501 },
    );
  }

  const stored = await getLatestAnalysisById(id);
  if (!stored) {
    return NextResponse.json({ message: "Không tìm thấy kết quả phân tích." }, { status: 404 });
  }

  return NextResponse.json({
    analysisId: stored.analysisId,
    matchId: stored.matchId,
    isMock: stored.isMock,
    fetchedAt: stored.fetchedAt.toISOString(),
    expiresAt: stored.expiresAt.toISOString(),
    structuredAnalysis: stored.structuredAnalysis,
    prediction: stored.prediction,
    sources: stored.sources,
  });
}
