import type { Prediction } from "@/lib/ai/schemas";

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

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-bold text-slate-900">Dự đoán tỷ lệ thắng/hòa/thua</h2>

      <div className="space-y-3">
        <ProbabilityRow label={homeTeam} value={homeWinProb} colorClass="bg-emerald-500" />
        <ProbabilityRow label="Hòa" value={drawProb} colorClass="bg-slate-400" />
        <ProbabilityRow label={awayTeam} value={awayWinProb} colorClass="bg-blue-500" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{rationale}</p>
    </section>
  );
}

function ProbabilityRow({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{pct(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: pct(value) }}
        />
      </div>
    </div>
  );
}
