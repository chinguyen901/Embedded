import type { LeagueId } from "../utils/leagues";
import { dbEnabled } from "../db";
import { getCachedFixtures, upsertFixturesCache } from "../db/queries";
import { computeExpiresAt, isFresh } from "../cache/policy";

const COMPETITION_CODE: Record<LeagueId, string> = {
  "premier-league": "PL",
  "la-liga": "PD",
  "serie-a": "SA",
  bundesliga: "BL1",
  "ligue-1": "FL1",
  "champions-league": "CL",
  "world-cup-2026": "WC",
};

const FIXTURE_WINDOW_DAYS = 15;

export interface Fixture {
  id: number;
  utcDate: string;
  homeTeam: string;
  awayTeam: string;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchFixturesFromApi(leagueId: LeagueId): Promise<Fixture[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const code = COMPETITION_CODE[leagueId];
  if (!apiKey || !code) return [];

  const now = new Date();
  const to = new Date(now.getTime() + FIXTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const url = `https://api.football-data.org/v4/competitions/${code}/matches?dateFrom=${toDateOnly(now)}&dateTo=${toDateOnly(to)}&status=SCHEDULED`;

  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`football-data.org trả lỗi ${res.status} cho giải ${leagueId}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.matches)) return [];

    return data.matches.map((m: { id: number; utcDate: string; homeTeam: { name: string }; awayTeam: { name: string } }) => ({
      id: m.id,
      utcDate: m.utcDate,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
    }));
  } catch (err) {
    console.warn(`Không thể lấy lịch thi đấu cho ${leagueId}:`, err);
    return [];
  }
}

/**
 * Lấy danh sách trận đấu sắp diễn ra (15 ngày tới) cho 1 giải đấu.
 * Cache-first qua Neon (bảng `league_fixtures_cache`, cùng TTL với phân tích trận đấu)
 * để tránh gọi lại football-data.org mỗi lần mở trang — chỉ áp dụng khi có DATABASE_URL.
 * Luôn trả về mảng rỗng thay vì throw khi thiếu key/lỗi API/rate-limit.
 * Xem CLAUDE.md mục "Fixture list".
 */
export async function getUpcomingFixtures(leagueId: LeagueId): Promise<Fixture[]> {
  if (dbEnabled) {
    const cached = await getCachedFixtures(leagueId);
    if (cached && isFresh(cached.expiresAt)) return cached.fixtures;
  }

  const fixtures = await fetchFixturesFromApi(leagueId);

  if (dbEnabled) {
    await upsertFixturesCache(leagueId, fixtures, computeExpiresAt());
  }

  return fixtures;
}
