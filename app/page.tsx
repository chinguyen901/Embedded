import MatchPickerForm from "@/components/MatchPickerForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Phân Tích & Dự Đoán Trận Đấu</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Chọn giải đấu và hai đội bóng, AI sẽ tìm kiếm thông tin mới nhất và đưa ra phân tích, dự đoán tỷ lệ thắng/hòa/thua.
        </p>
      </div>
      <MatchPickerForm />
    </div>
  );
}
