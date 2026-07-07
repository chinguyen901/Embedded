import type { Source } from "@/lib/ai/schemas";
import { Link2, ExternalLink } from "lucide-react";

export default function SourcesList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Link2 className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold text-slate-900">Nguồn tham khảo</h2>
      </div>
      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                {i + 1}
              </span>
              <span className="break-words text-emerald-700 group-hover:text-emerald-800 group-hover:underline">
                {s.title || s.url}
              </span>
              <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-slate-300 group-hover:text-emerald-600" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
