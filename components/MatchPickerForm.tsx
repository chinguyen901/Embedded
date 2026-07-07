"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LEAGUES, slugifyTeamName } from "@/lib/utils/leagues";

export default function MatchPickerForm() {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const league = useMemo(() => LEAGUES.find((l) => l.id === leagueId)!, [leagueId]);

  function handleLeagueChange(id: string) {
    setLeagueId(id as typeof leagueId);
    setHomeTeam("");
    setAwayTeam("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeam || !awayTeam) {
      setError("Vui lòng chọn cả đội nhà và đội khách.");
      return;
    }
    if (homeTeam === awayTeam) {
      setError("Đội nhà và đội khách không được trùng nhau.");
      return;
    }
    const slug = `${league.id}-${slugifyTeamName(homeTeam)}-vs-${slugifyTeamName(awayTeam)}`;
    const params = new URLSearchParams({
      league: league.id,
      home: homeTeam,
      away: awayTeam,
    });
    if (matchDate) params.set("date", matchDate);
    router.push(`/tran-dau/${slug}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <label htmlFor="league" className="mb-1.5 block text-sm font-medium text-slate-700">
          Giải đấu
        </label>
        <select
          id="league"
          value={leagueId}
          onChange={(e) => handleLeagueChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          {LEAGUES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="homeTeam" className="mb-1.5 block text-sm font-medium text-slate-700">
            Đội nhà
          </label>
          <select
            id="homeTeam"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">-- Chọn đội --</option>
            {league.teams.map((t) => (
              <option key={t} value={t} disabled={t === awayTeam}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="awayTeam" className="mb-1.5 block text-sm font-medium text-slate-700">
            Đội khách
          </label>
          <select
            id="awayTeam"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">-- Chọn đội --</option>
            {league.teams.map((t) => (
              <option key={t} value={t} disabled={t === homeTeam}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="matchDate" className="mb-1.5 block text-sm font-medium text-slate-700">
          Ngày thi đấu <span className="font-normal text-slate-400">(không bắt buộc)</span>
        </label>
        <input
          id="matchDate"
          type="date"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-semibold text-white transition active:scale-[0.99] hover:bg-emerald-700"
      >
        Phân tích trận đấu
      </button>
    </form>
  );
}
