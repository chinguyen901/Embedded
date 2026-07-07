import { NextResponse } from "next/server";
import { getLeagueById } from "@/lib/utils/leagues";
import { getUpcomingFixtures } from "@/lib/fixtures/football-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  const league = leagueId ? getLeagueById(leagueId) : undefined;

  if (!league) {
    return NextResponse.json({ message: "Giải đấu không hợp lệ." }, { status: 400 });
  }

  const fixtures = await getUpcomingFixtures(league.id);
  return NextResponse.json({ fixtures });
}
