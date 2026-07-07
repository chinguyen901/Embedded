import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrRunAnalysis } from "@/lib/pipeline";

export const maxDuration = 120;

const BodySchema = z.object({
  league: z.string().min(1),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  matchDate: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Vui lòng chọn đầy đủ giải đấu và hai đội bóng." },
      { status: 400 },
    );
  }

  const { league, homeTeam, awayTeam, matchDate } = parsed.data;

  if (homeTeam === awayTeam) {
    return NextResponse.json(
      { message: "Đội nhà và đội khách không được trùng nhau." },
      { status: 400 },
    );
  }

  try {
    const result = await getOrRunAnalysis({ league, homeTeam, awayTeam, matchDate });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định." },
      { status: 502 },
    );
  }
}
