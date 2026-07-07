# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trên dự án này.

## Dự án là gì

Website phân tích & dự đoán trận đấu bóng đá, giao diện **tiếng Việt**, mobile-friendly, không có đăng nhập/tài khoản (công cụ công khai). Người dùng chọn giải đấu + 2 đội (giới hạn các giải lớn: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League), hệ thống chạy pipeline AI 3 bước để trả về phân tích và xác suất thắng/hòa/thua.

Triển khai trên **Vercel** (Hobby tier), database là **Neon Postgres**. Dự án nhỏ, một người phát triển — tránh over-engineering.

## Trạng thái hiện tại

Đã scaffold xong và chạy được full end-to-end ở **chế độ demo/mock** (xem bên dưới) — UI, pipeline 3 bước, cache layer, API routes đều đã viết. Chưa test với Neon/AI Gateway thật vì chưa có credentials — khi có, chỉ cần điền `.env.local` (xem `.env.local.example`), không cần sửa code.

## Stack thực tế

Next.js 16 (App Router, TypeScript, Turbopack mặc định) · Vercel AI SDK (`ai@6` + `@ai-sdk/gateway`) · Drizzle ORM + `@neondatabase/serverless` (driver `neon-http`) · Tailwind CSS v4 · Zod v4 · **npm** (không dùng pnpm vì máy dev không có sẵn pnpm).

Next.js 16 có vài breaking change so với 15 cần nhớ khi sửa code: `params`/`searchParams` trong page/layout/route là **Promise**, phải `await`; Turbopack là default cho cả `dev` và `build`; PPR cũ đổi thành `cacheComponents` (không dùng trong dự án này).

## Kiến trúc

**Pipeline AI 3 bước** (`lib/ai/`):
1. **Stage 1 — Search** (`stage1-search.ts`): `generateText` với model `perplexity/sonar-pro`. Lấy `result.sources` (mảng, không phải Promise, vì `generateText` không streaming) làm trích dẫn nguồn.
2. **Stage 2 — Cấu trúc hóa** (`stage2-structure.ts`): `generateObject` với model khác (mặc định `openai/gpt-4o-mini`) → JSON tiếng Việt theo `StructuredAnalysisSchema` (`lib/ai/schemas.ts`), gồm `extractedSignals` dạng số dùng cho stage 3.
3. **Stage 3 — Dự đoán** (`stage3-predict.ts`): `computeProbabilities()` là hàm thuần TypeScript tính xác suất từ `extractedSignals` (không gọi AI), sau đó gọi `generateText` ngắn để sinh `rationale` tiếng Việt.

**`lib/pipeline.ts`** — orchestrator dùng chung: `getOrRunAnalysis({league, homeTeam, awayTeam, matchDate})`. Cache-first nếu có DB (check `match_analyses` → nếu fresh trả luôn, nếu stale/lỗi chạy pipeline mới rồi lưu). Nếu lỗi giữa chừng và có bản cache cũ, trả bản cũ kèm cờ `cached: true` thay vì fail cứng. Được gọi từ **cả** `app/api/phan-tich/route.ts` (POST) **và** `app/tran-dau/[slug]/page.tsx` (Server Component) — tránh trùng lặp logic.

**Điều hướng UI** (khác với thiết kế ban đầu trong bản plan gốc — refinement hợp lý hơn cho Next.js App Router): `MatchPickerForm` (client component) **không** gọi API — nó chỉ `router.push()` sang `/tran-dau/{slug}?league=...&home=...&away=...&date=...`. Trang `app/tran-dau/[slug]/page.tsx` là async Server Component gọi trực tiếp `getOrRunAnalysis()`, và `app/tran-dau/[slug]/loading.tsx` tự động hiển thị skeleton nhờ React Suspense trong lúc chờ — đã verify bằng cách đo timing chunk HTTP thô (`curl`/Node `http.get`) rằng shell HTML được flush ở ~85ms còn nội dung thật flush sau khi pipeline xong (streaming SSR hoạt động đúng). API route `POST /api/phan-tich` vẫn tồn tại và dùng chung orchestrator, chủ yếu để dự phòng/gọi từ nơi khác sau này; `GET /api/phan-tich/[id]` dùng cho share link.

**Cache-first**: TTL mặc định 6 giờ (`ANALYSIS_TTL_HOURS`). Mỗi lần chạy pipeline tạo row `match_analyses` mới (không ghi đè) để giữ lịch sử.

## Chế độ Demo/Mock — quan trọng

Vì chưa có `AI_GATEWAY_API_KEY`/`DATABASE_URL` lúc build ban đầu, đã thêm cơ chế demo để phát triển/test UI không cần credentials thật:

- `lib/ai/gateway.ts` export `hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY)`. Nếu `false`, `stage1-search.ts`/`stage2-structure.ts`/`stage3-predict.ts` đều trả dữ liệu giả từ `lib/ai/mock-data.ts` (deterministic theo tên đội, không random thật để kết quả ổn định giữa các lần refresh cùng cặp đội) thay vì gọi AI.
- `lib/db/index.ts` export `dbEnabled = Boolean(process.env.DATABASE_URL)`. Nếu `false`, `lib/pipeline.ts` bỏ qua toàn bộ cache/persist — luôn chạy pipeline mới, không lưu DB, `matchId`/`analysisId` được gen bằng `randomUUID()` tạm thời.
- Khi `isMock === true`, UI hiển thị banner vàng "Đang chạy ở chế độ demo..." ở đầu trang kết quả (`app/tran-dau/[slug]/page.tsx`).
- **Khi có key/DB thật**: chỉ cần set 2 biến env, không cần sửa code gì — cả hai flag tự chuyển sang chế độ thật.

## Quyết định kiến trúc quan trọng — không đổi mà không thảo luận với người dùng

- **Không dùng `generateObject` trực tiếp trên Perplexity Sonar** ở stage 1 (bug đã biết giữa Sonar + ép JSON). Stage 1 luôn là `generateText` + lấy `sources`.
- **Xác suất dự đoán không hỏi trực tiếp từ LLM** — dùng công thức xác định `computeProbabilities()` trong `stage3-predict.ts` (test được, không cần mock AI). Hướng nâng cấp đã định (chưa làm): mô hình Poisson expected-goals.
- **Không thêm auth, payment, queue, Redis, microservices** trừ khi được yêu cầu rõ ràng.
- **UI navigation dùng Server Component + `loading.tsx`**, không phải client-side POST + redirect như bản plan gốc phác thảo — đơn giản hơn và tận dụng streaming SSR có sẵn của Next.js.

## Giới hạn/known issue đã biết

- **HTTP status code của trang 404**: `app/tran-dau/[slug]/page.tsx` gọi `notFound()` khi thiếu `league`/`home`/`away` hợp lệ trong query string. Vì trang này có `loading.tsx` (Suspense boundary), Next.js đã flush header `200` trước khi biết trang sẽ 404 (streaming SSR). Nội dung hiển thị đúng là trang "not found", nhưng status code trả về vẫn là `200` thay vì `404`. Ảnh hưởng: chỉ SEO/crawler, không ảnh hưởng người dùng thật (route này chỉ vào được qua URL thủ công sai, không qua form). Chưa fix vì cần tái cấu trúc thêm và không đáng công sức ở quy mô hiện tại.
- Vercel Hobby function duration mặc định 10s/60s max; cần **Fluid Compute** bật để lên tới 300s (pipeline thật có thể mất 15-40s). Xác nhận đã bật trước khi lo lắng về timeout.
- Free credit Vercel AI Gateway ~$5/tháng — khi dev/test với key thật, ưu tiên dùng lại cache thay vì gọi lại pipeline liên tục cho cùng 1 cặp đội.
- Model id trên Gateway (`perplexity/sonar-pro`, model stage 2) có thể đổi tên — kiểm tra tại trang model của Vercel AI Gateway nếu gặp lỗi "model not found".

## Bản đồ file/module

- `lib/ai/schemas.ts` — Zod: `StructuredAnalysisSchema`, `PredictionSchema`, `ExtractedSignalsSchema`. Nguồn chân lý duy nhất cho shape dữ liệu giữa các stage.
- `lib/ai/gateway.ts` — `hasGatewayKey`, model constants (`STAGE1_MODEL`, `STAGE2_MODEL`, `STAGE3_MODEL`).
- `lib/ai/mock-data.ts` — dữ liệu giả lập cho chế độ demo.
- `lib/ai/stage1-search.ts`, `stage2-structure.ts`, `stage3-predict.ts` — 3 bước pipeline.
- `lib/pipeline.ts` — orchestrator dùng chung (cache-check → pipeline → persist).
- `lib/db/schema.ts` — bảng Drizzle: `matches`, `match_analyses`.
- `lib/db/index.ts` — `db`, `dbEnabled`.
- `lib/db/queries.ts` — `getOrCreateMatch`, `getLatestAnalysis`, `getLatestAnalysisById`, `insertAnalysis`.
- `lib/cache/policy.ts` — `buildCacheKey`, `buildSlug`, `isFresh`, `computeExpiresAt`, `TTL_HOURS`.
- `lib/utils/leagues.ts` — danh sách giải đấu + đội (static), `slugifyTeamName`.
- `app/api/phan-tich/route.ts` — POST, validate bằng Zod, gọi `getOrRunAnalysis`.
- `app/api/phan-tich/[id]/route.ts` — GET theo `analysisId` (yêu cầu `dbEnabled`).
- `app/tran-dau/[slug]/page.tsx` + `loading.tsx` — trang kết quả (Server Component + streaming skeleton).
- `components/MatchPickerForm.tsx`, `PredictionCard.tsx`, `AnalysisSection.tsx`, `SourcesList.tsx` — UI, mobile-first Tailwind.

## Environment Variables

| Biến | Dùng ở đâu | Ghi chú |
|---|---|---|
| `AI_GATEWAY_API_KEY` | `lib/ai/gateway.ts` | Thiếu → toàn bộ pipeline chạy chế độ demo/mock |
| `DATABASE_URL` | `lib/db/index.ts` | Thiếu → không cache, không lưu lịch sử |
| `ANALYSIS_TTL_HOURS` | `lib/cache/policy.ts` | Mặc định 6 |
| `STAGE1_MODEL` | `lib/ai/gateway.ts` | Mặc định `perplexity/sonar-pro` |
| `STAGE2_MODEL` | `lib/ai/gateway.ts` | Mặc định `openai/gpt-4o-mini`, cũng dùng cho stage 3 rationale |

Xem `.env.local.example` để copy thành `.env.local`.

## Lệnh hay dùng

- `npm run dev` — dev server (Turbopack, port 3000 hoặc port kế tiếp nếu bận).
- `npm run build` — production build (đã verify pass).
- `npm run db:generate` / `npm run db:push` — Drizzle migration (cần `DATABASE_URL` thật).
- `npx tsc --noEmit` / `npx eslint .` — typecheck/lint (đã verify pass, 0 lỗi).

## Kiểm thử đã thực hiện

- Typecheck + ESLint: pass, 0 lỗi.
- `npm run build`: pass, cả 2 route API là dynamic (ƒ), trang chủ static, `/tran-dau/[slug]` dynamic — đúng như kỳ vọng.
- Test thủ công bằng Playwright (cài tạm ở scratchpad, không phải dependency của repo) qua các luồng: chọn giải đấu + 2 đội → submit → xem kết quả, ở cả viewport mobile (375×812) và desktop (1280×800), cho Premier League và Champions League (có kèm ngày thi đấu). Không có console error. UI responsive tốt, không overflow trên mobile.
- Verify streaming SSR của `loading.tsx` bằng cách đo timing chunk HTTP thô (không dùng Playwright vì Playwright's auto-waiting che mất frame trung gian).
- Chưa test với AI Gateway/Neon thật (chưa có credentials) — khi có, cần test lại: (1) model id đúng, (2) `generateObject` ở stage 2 không lỗi validation, (3) ghi/đọc Neon qua Drizzle đúng, (4) thời gian pipeline thật trong ngưỡng `maxDuration`.

## Ngôn ngữ

Toàn bộ text hiển thị cho người dùng (UI, thông báo lỗi, prompt yêu cầu output) đều bằng **tiếng Việt**.
