import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueById } from "@/lib/utils/leagues";
import { getOrRunAnalysis } from "@/lib/pipeline";
import PredictionCard from "@/components/PredictionCard";
import AnalysisSection from "@/components/AnalysisSection";
import SourcesList from "@/components/SourcesList";
import { ArrowLeft, AlertTriangle, FlaskConical, Clock } from "lucide-react";

export const maxDuration = 120;

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const leagueId = typeof sp.league === "string" ? sp.league : undefined;
  const homeTeam = typeof sp.home === "string" ? sp.home : undefined;
  const awayTeam = typeof sp.away === "string" ? sp.away : undefined;
  const matchDate = typeof sp.date === "string" ? sp.date : null;

  const league = leagueId ? getLeagueById(leagueId) : undefined;
  if (!league || !homeTeam || !awayTeam) {
    notFound();
  }

  let result;
  let hasError = false;
  try {
    result = await getOrRunAnalysis({ league: league.id, homeTeam, awayTeam, matchDate });
  } catch (err) {
    hasError = true;
    console.error(`[phan-tich] ${league.id} ${homeTeam} vs ${awayTeam}:`, err);
  }

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Chọn trận đấu khác
      </Link>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-5 py-6 text-center text-white shadow-lg shadow-emerald-900/20 sm:py-8">
        <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
          {league.name}
        </span>
        <h1 className="text-xl font-extrabold sm:text-2xl">
          {homeTeam} <span className="font-normal text-emerald-200">vs</span> {awayTeam}
        </h1>
      </div>

      {hasError && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Không thể lấy dữ liệu trận đấu lúc này. Vui lòng thử lại sau.
        </div>
      )}

      {result && (
        <>
          {result.isMock && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800 ring-1 ring-amber-200">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
              Đang chạy ở chế độ demo (chưa cấu hình GOOGLE_GENERATIVE_AI_API_KEY) — dữ liệu bên dưới là dữ liệu giả lập, không phải thông tin thật.
            </div>
          )}
          {result.cached && !result.isMock && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Kết quả được lấy từ bộ nhớ đệm lúc {new Date(result.fetchedAt).toLocaleString("vi-VN")}
            </p>
          )}

          <PredictionCard homeTeam={homeTeam} awayTeam={awayTeam} prediction={result.prediction} />
          <AnalysisSection homeTeam={homeTeam} awayTeam={awayTeam} analysis={result.structuredAnalysis} />
          <SourcesList sources={result.sources} />
        </>
      )}
    </div>
  );
}
