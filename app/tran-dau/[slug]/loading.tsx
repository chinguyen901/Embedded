"use client";

import { useEffect, useState } from "react";
import { Search, ListChecks, Percent, Check } from "lucide-react";

const STEPS = [
  { icon: Search, label: "Tìm kiếm thông tin mới nhất", durationMs: 13000 },
  { icon: ListChecks, label: "Phân tích phong độ & đối đầu", durationMs: 22000 },
  { icon: Percent, label: "Tính toán dự đoán", durationMs: 12000 },
];

export default function Loading() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex >= STEPS.length - 1) return;
    const timer = setTimeout(() => setStepIndex((i) => i + 1), STEPS[stepIndex].durationMs);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 sm:p-8">
        <div className="mx-auto max-w-xs space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-200"
                        : "bg-slate-100 text-slate-300"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />}
                </span>
                <span
                  className={`text-sm font-medium transition ${
                    done ? "text-slate-400 line-through" : active ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Quá trình này có thể mất đến 60 giây tùy vào tải hệ thống AI.
        </p>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
          <div className="skeleton-shimmer mb-3 h-4 w-1/3 rounded" />
          <div className="skeleton-shimmer mb-2 h-3 w-full rounded" />
          <div className="skeleton-shimmer h-3 w-5/6 rounded" />
        </div>
      ))}
    </div>
  );
}
