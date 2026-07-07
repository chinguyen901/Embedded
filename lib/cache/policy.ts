import { slugifyTeamName } from "../utils/leagues";

export const TTL_HOURS = Number(process.env.ANALYSIS_TTL_HOURS) || 6;

export function buildCacheKey(league: string, homeTeam: string, awayTeam: string, matchDate: string | null): string {
  const parts = [league, slugifyTeamName(homeTeam), slugifyTeamName(awayTeam), matchDate ?? "unscheduled"];
  return parts.join("__");
}

export function buildSlug(league: string, homeTeam: string, awayTeam: string): string {
  return `${league}-${slugifyTeamName(homeTeam)}-vs-${slugifyTeamName(awayTeam)}`;
}

export function isFresh(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}

export function computeExpiresAt(fetchedAt: Date = new Date()): Date {
  return new Date(fetchedAt.getTime() + TTL_HOURS * 60 * 60 * 1000);
}
