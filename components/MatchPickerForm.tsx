"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LEAGUES, slugifyTeamName } from "@/lib/utils/leagues";
import type { Fixture } from "@/lib/fixtures/football-data";
import { CalendarDays, ChevronRight, ListVideo, Loader2, Trophy } from "lucide-react";

function formatFixtureDate(utcDate: string): string {
  return new Date(utcDate).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function TeamBadge({ name, tone }: { name: string; tone: "home" | "away" }) {
  const palette = tone === "home" ? "from-emerald-500 to-emerald-700" : "from-slate-500 to-slate-700";
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette} text-[11px] font-bold text-white shadow-sm`}
    >
      {initials(name)}
    </span>
  );
}

export default function MatchPickerForm() {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/lich-thi-dau?league=${leagueId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setFixtures(Array.isArray(data.fixtures) ? data.fixtures : []);
      })
      .catch(() => {
        if (cancelled) return;
        setFixtures([]);
      });

    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  function goToMatch(f: Fixture) {
    setNavigatingId(f.id);
    const slug = `${leagueId}-${slugifyTeamName(f.homeTeam)}-vs-${slugifyTeamName(f.awayTeam)}`;
    const params = new URLSearchParams({
      league: leagueId,
      home: f.homeTeam,
      away: f.awayTeam,
      date: f.utcDate.slice(0, 10),
    });
    router.push(`/tran-dau/${slug}?${params.toString()}`);
  }

  return (
    <div className="space-y-5 rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
      <div>
        <label htmlFor="league" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Trophy className="h-4 w-4 text-emerald-600" />
          Giải đấu
        </label>
        <select
          id="league"
          value={leagueId}
          onChange={(e) => {
            setLeagueId(e.target.value as typeof leagueId);
            setFixtures(null);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          {LEAGUES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <ListVideo className="h-4 w-4 text-emerald-600" />
          Trận đấu sắp diễn ra (15 ngày tới)
        </span>

        {fixtures === null && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải lịch thi đấu...
          </div>
        )}

        {fixtures !== null && fixtures.length === 0 && (
          <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            Không tìm thấy trận đấu nào trong 15 ngày tới cho giải này.
          </p>
        )}

        {fixtures !== null && fixtures.length > 0 && (
          <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {fixtures.map((f) => {
              const isNavigating = navigatingId === f.id;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => goToMatch(f)}
                    disabled={navigatingId !== null}
                    className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-emerald-300 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <TeamBadge name={f.homeTeam} tone="home" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800" title={f.homeTeam}>
                          {f.homeTeam}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-slate-300">VS</span>
                      <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 text-right">
                        <TeamBadge name={f.awayTeam} tone="away" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800" title={f.awayTeam}>
                          {f.awayTeam}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="h-3 w-3" />
                        {formatFixtureDate(f.utcDate)}
                      </span>
                      {isNavigating ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
