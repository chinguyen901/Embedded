import type { StructuredAnalysis } from "@/lib/ai/schemas";

export default function AnalysisSection({
  homeTeam,
  awayTeam,
  analysis,
}: {
  homeTeam: string;
  awayTeam: string;
  analysis: StructuredAnalysis;
}) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-900">Phân tích chi tiết</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamBlock
          title={homeTeam}
          formSummary={analysis.homeFormSummary}
          strengths={analysis.homeStrengths}
          weaknesses={analysis.homeWeaknesses}
          injuries={analysis.homeInjuries}
        />
        <TeamBlock
          title={awayTeam}
          formSummary={analysis.awayFormSummary}
          strengths={analysis.awayStrengths}
          weaknesses={analysis.awayWeaknesses}
          injuries={analysis.awayInjuries}
        />
      </div>

      <div>
        <h3 className="mb-1.5 text-sm font-semibold text-slate-700">Lịch sử đối đầu</h3>
        <p className="text-sm text-slate-600">{analysis.headToHeadSummary}</p>
      </div>

      {analysis.keyFactors.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-semibold text-slate-700">Yếu tố chính</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {analysis.keyFactors.map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function TeamBlock({
  title,
  formSummary,
  strengths,
  weaknesses,
  injuries,
}: {
  title: string;
  formSummary: string;
  strengths: string[];
  weaknesses: string[];
  injuries: string[];
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <h3 className="mb-1.5 font-semibold text-slate-800">{title}</h3>
      <p className="mb-2 text-sm text-slate-600">{formSummary}</p>

      {strengths.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">Điểm mạnh</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-600">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-amber-700">Điểm yếu</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-600">
            {weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {injuries.length > 0 && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-red-700">Chấn thương / treo giò</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-600">
            {injuries.map((inj, i) => (
              <li key={i}>{inj}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
