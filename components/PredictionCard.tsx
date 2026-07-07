import type { Prediction } from "@/lib/ai/schemas";
import { TrendingUp, Sparkles, Crown } from "lucide-react";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export default function PredictionCard({
  homeTeam,
  awayTeam,
  prediction,
}: {
  homeTeam: string;
  awayTeam: string;
  prediction: Prediction;
}) {
  const { homeWinProb, drawProb, awayWinProb, rationale } = prediction;
  const top = Math.max(homeWinProb, drawProb, awayWinProb);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold text-slate-900">Dự đoán tỷ lệ</h2>
      </div>

      <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-500 transition-all" style={{ width: pct(homeWinProb) }} />
        <div className="bg-slate-400 transition-all" style={{ width: pct(drawProb) }} />
        <div className="bg-blue-500 transition-all" style={{ width: pct(awayWinProb) }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Outcome label={homeTeam} value={homeWinProb} dotClass="bg-emerald-500" textClass="text-emerald-700" isTop={homeWinProb === top} />
        <Outcome label="Hòa" value={drawProb} dotClass="bg-slate-400" textClass="text-slate-600" isTop={drawProb === top} />
        <Outcome label={awayTeam} value={awayWinProb} dotClass="bg-blue-500" textClass="text-blue-700" isTop={awayWinProb === top} />
      </div>

      <div className="mt-5 flex gap-2.5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p className="text-sm leading-relaxed text-slate-700">{rationale}</p>
      </div>
    </section>
  );
}

function Outcome({
  label,
  value,
  dotClass,
  textClass,
  isTop,
}: {
  label: string;
  value: number;
  dotClass: string;
  textClass: string;
  isTop: boolean;
}) {
  return (
    <div className={`rounded-2xl px-1.5 py-3 ${isTop ? "bg-slate-50 ring-1 ring-slate-200" : ""}`}>
      <div className="mb-1.5 flex min-h-8 flex-col items-center justify-center gap-0.5">
        <span className="flex items-center gap-1">
          {isTop && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        </span>
        <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-slate-500" title={label}>
          {label}
        </span>
      </div>
      <div className={`text-lg font-extrabold sm:text-2xl ${textClass}`}>{pct(value)}</div>
    </div>
  );
}
