import MatchPickerForm from "@/components/MatchPickerForm";
import { Search, ListChecks, Percent } from "lucide-react";

const STEPS = [
  { icon: Search, label: "Tìm kiếm thông tin mới nhất bằng AI" },
  { icon: ListChecks, label: "Phân tích phong độ, đối đầu, chấn thương" },
  { icon: Percent, label: "Dự đoán tỷ lệ thắng / hòa / thua" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          Miễn phí · Cập nhật theo thời gian thực
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Phân Tích &amp; Dự Đoán
          <br />
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            Trận Đấu Bóng Đá
          </span>
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          Chọn giải đấu và trận đấu, AI sẽ tìm kiếm thông tin mới nhất và đưa ra phân tích, dự đoán tỷ lệ thắng/hòa/thua.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200 sm:p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">{label}</span>
          </div>
        ))}
      </div>

      <MatchPickerForm />
    </div>
  );
}
