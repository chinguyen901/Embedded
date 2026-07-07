import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phân Tích Bóng Đá AI",
  description: "Phân tích và dự đoán trận đấu bóng đá bằng AI: phong độ, đối đầu, chấn thương và xác suất thắng/hòa/thua.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-emerald-700">
              <span aria-hidden>⚽</span>
              <span>Phân Tích Bóng Đá AI</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4 text-xs text-slate-500 text-center">
            Dự đoán chỉ mang tính tham khảo, không đảm bảo kết quả thực tế.
          </div>
        </footer>
      </body>
    </html>
  );
}
