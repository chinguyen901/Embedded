import type { Source } from "@/lib/ai/schemas";

export default function SourcesList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-lg font-bold text-slate-900">Nguồn tham khảo</h2>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm">
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-words text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
            >
              {s.title || s.url}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
