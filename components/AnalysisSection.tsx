import type { StructuredAnalysis } from "@/lib/ai/schemas";
import { ClipboardList, Swords, ThumbsUp, ThumbsDown, HeartPulse, ListChecks } from "lucide-react";

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
    <section className="space-y-5 rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ClipboardList className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold text-slate-900">Phân tích chi tiết</h2>
      </div>

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

      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Swords className="h-3.5 w-3.5 text-slate-500" />
          Lịch sử đối đầu
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{analysis.headToHeadSummary}</p>
      </div>

      {analysis.keyFactors.length > 0 && (
        <div className="rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
            <ListChecks className="h-3.5 w-3.5" />
            Yếu tố chính
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {analysis.keyFactors.map((factor, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                {factor}
              </li>
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
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="mb-1.5 font-bold text-slate-800">{title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-slate-600">{formSummary}</p>

      {strengths.length > 0 && (
        <TagGroup icon={ThumbsUp} label="Điểm mạnh" items={strengths} tone="text-emerald-700 bg-emerald-50" />
      )}
      {weaknesses.length > 0 && (
        <TagGroup icon={ThumbsDown} label="Điểm yếu" items={weaknesses} tone="text-amber-700 bg-amber-50" />
      )}
      {injuries.length > 0 && (
        <TagGroup icon={HeartPulse} label="Chấn thương / treo giò" items={injuries} tone="text-red-700 bg-red-50" />
      )}
    </div>
  );
}

function TagGroup({
  icon: Icon,
  label,
  items,
  tone,
}: {
  icon: typeof ThumbsUp;
  label: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className="mb-2.5 last:mb-0">
      <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <ul className="mt-1 space-y-0.5 pl-1 text-sm text-slate-600">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-slate-300">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
