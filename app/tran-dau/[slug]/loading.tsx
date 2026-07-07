export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-700">
            Đang phân tích trận đấu, vui lòng đợi khoảng 30 giây...
          </p>
          <p className="text-xs text-slate-500">
            AI đang tìm kiếm thông tin mới nhất và tính toán tỷ lệ thắng/hòa/thua.
          </p>
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
          <div className="mb-2 h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
