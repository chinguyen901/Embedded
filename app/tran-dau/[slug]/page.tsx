import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueById } from "@/lib/utils/leagues";
import { getOrRunAnalysis } from "@/lib/pipeline";
import PredictionCard from "@/components/PredictionCard";
import AnalysisSection from "@/components/AnalysisSection";
import SourcesList from "@/components/SourcesList";

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
  let errorMessage: string | null = null;
  try {
    result = await getOrRunAnalysis({ league: league.id, homeTeam, awayTeam, matchDate });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
  }

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
        ← Chọn trận đấu khác
      </Link>

      <div className="text-center">
        <h1 className="text-xl font-bold sm:text-2xl">
          {homeTeam} <span className="text-slate-400">vs</span> {awayTeam}
        </h1>
        <p className="text-sm text-slate-500">{league.name}</p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          Không thể lấy dữ liệu trận đấu lúc này: {errorMessage} Vui lòng thử lại sau.
        </div>
      )}

      {result && (
        <>
          {result.isMock && (
            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
              Đang chạy ở chế độ demo (chưa cấu hình AI_GATEWAY_API_KEY) — dữ liệu bên dưới là dữ liệu giả lập, không phải thông tin thật.
            </div>
          )}
          {result.cached && !result.isMock && (
            <p className="text-center text-xs text-slate-400">
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
