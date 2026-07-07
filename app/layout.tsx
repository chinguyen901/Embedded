import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Trophy, Sparkles } from "lucide-react";
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
  themeColor: "#059669",
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
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-900/20 transition group-hover:scale-105">
                <Trophy className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="text-[15px] font-bold leading-tight tracking-tight text-slate-900 sm:text-base">
                Phân Tích Bóng Đá
                <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-600">
                  AI <Sparkles className="h-3.5 w-3.5" />
                </span>
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-5 text-center text-xs text-slate-400">
            Dự đoán được tạo bởi AI, chỉ mang tính tham khảo — không đảm bảo kết quả thực tế.
          </div>
        </footer>
      </body>
    </html>
  );
}
