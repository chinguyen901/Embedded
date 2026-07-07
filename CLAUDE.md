# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trên dự án này.

## Dự án là gì

Website phân tích & dự đoán trận đấu bóng đá, giao diện **tiếng Việt**, mobile-friendly, không có đăng nhập/tài khoản (công cụ công khai). Người dùng chọn giải đấu (giới hạn: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, **FIFA World Cup 2026**) → chọn 1 trận trong danh sách trận sắp diễn ra (30 ngày tới, lấy từ football-data.org) hoặc tự chọn 2 đội thủ công → hệ thống chạy pipeline AI 3 bước để trả về phân tích và xác suất thắng/hòa/thua.

Triển khai trên **Vercel** (Hobby tier), database là **Neon Postgres**. Dự án nhỏ, một người phát triển — tránh over-engineering.

## Trạng thái hiện tại

Đã scaffold xong, đã kết nối GitHub + Vercel + Neon (Marketplace integration), và **đã test thành công pipeline AI thật với Gemini** (`GOOGLE_GENERATIVE_AI_API_KEY` thật đã có trong `.env.local`, xem lưu ý bảo mật bên dưới) — mất khoảng **35-70 giây/lần phân tích** (đo thật, xem "Hiệu năng pipeline"). `FOOTBALL_DATA_API_KEY` thật cũng đã có nhưng **không gọi được từ máy dev** do bị Trellix chặn TLS (xem "Giới hạn đã biết") — chưa xác nhận hoạt động thật, chỉ xác nhận đúng logic + key hợp lệ. `DATABASE_URL` vẫn để trống ở local vì đang tạo bảng trực tiếp qua Neon web console/psql thay vì `vercel env pull`. UI đã qua 1 lượt redesign toàn diện (xem "Thiết kế UI").

## Stack thực tế

Next.js 16 (App Router, TypeScript, Turbopack mặc định) · Vercel AI SDK (`ai@6`) + `@ai-sdk/google` (Gemini, gọi trực tiếp — **không** qua Vercel AI Gateway) · Drizzle ORM + `@neondatabase/serverless` (driver `neon-http`) · Tailwind CSS v4 · Zod v4 · **npm** (không dùng pnpm vì máy dev không có sẵn pnpm).

Next.js 16 có vài breaking change so với 15 cần nhớ khi sửa code: `params`/`searchParams` trong page/layout/route là **Promise**, phải `await`; Turbopack là default cho cả `dev` và `build`; PPR cũ đổi thành `cacheComponents` (không dùng trong dự án này).

`ai@6` đã **deprecate `generateObject`** — dùng `generateText({ output: Output.object({ schema }) })` rồi đọc `result.output` (không phải `result.experimental_output`, cũng đã deprecated). Xem `lib/ai/stage2-structure.ts`.

## Kiến trúc

**Pipeline AI 3 bước** (`lib/ai/`), tất cả dùng Gemini qua `@ai-sdk/google` (`google(modelId)`), key lấy từ `GOOGLE_GENERATIVE_AI_API_KEY`:
1. **Stage 1 — Search** (`stage1-search.ts`): `generateText` với `tools: { google_search: google.tools.googleSearch({}) }` (Google Search grounding — cú pháp tool-based của `@ai-sdk/google@3`, **không phải** `useSearchGrounding: true` như một số ví dụ cũ trên mạng, API đó không tồn tại trong bản đã cài). Lấy `result.sources` (mảng, không phải Promise) làm trích dẫn nguồn.
2. **Stage 2 — Cấu trúc hóa** (`stage2-structure.ts`): `generateText` với `output: Output.object({ schema: StructuredAnalysisSchema })` (không phải `generateObject`, đã deprecated) → JSON tiếng Việt (`lib/ai/schemas.ts`), gồm `extractedSignals` dạng số dùng cho stage 3. Đọc kết quả qua `result.output`.
3. **Stage 3 — Dự đoán** (`stage3-predict.ts`): `computeProbabilities()` là hàm thuần TypeScript tính xác suất từ `extractedSignals` (không gọi AI), sau đó gọi `generateText` ngắn (Gemini, không kèm tool) để sinh `rationale` tiếng Việt.

**`lib/pipeline.ts`** — orchestrator dùng chung: `getOrRunAnalysis({league, homeTeam, awayTeam, matchDate})`. Cache-first nếu có DB (check `match_analyses` → nếu fresh trả luôn, nếu stale/lỗi chạy pipeline mới rồi lưu). Nếu lỗi giữa chừng và có bản cache cũ, trả bản cũ kèm cờ `cached: true` thay vì fail cứng. Được gọi từ **cả** `app/api/phan-tich/route.ts` (POST) **và** `app/tran-dau/[slug]/page.tsx` (Server Component) — tránh trùng lặp logic.

**Điều hướng UI** (khác với thiết kế ban đầu trong bản plan gốc — refinement hợp lý hơn cho Next.js App Router): `MatchPickerForm` (client component) **không** gọi `/api/phan-tich` — nó chỉ `router.push()` sang `/tran-dau/{slug}?league=...&home=...&away=...&date=...`. Trang `app/tran-dau/[slug]/page.tsx` là async Server Component gọi trực tiếp `getOrRunAnalysis()`, và `app/tran-dau/[slug]/loading.tsx` tự động hiển thị skeleton nhờ React Suspense trong lúc chờ — đã verify bằng cách đo timing chunk HTTP thô rằng shell HTML được flush sớm còn nội dung thật flush sau khi pipeline xong (streaming SSR hoạt động đúng). API route `POST /api/phan-tich` vẫn tồn tại và dùng chung orchestrator, chủ yếu để dự phòng/gọi từ nơi khác sau này; `GET /api/phan-tich/[id]` dùng cho share link.

**Cache-first**: TTL mặc định 6 giờ (`ANALYSIS_TTL_HOURS`). Mỗi lần chạy pipeline tạo row `match_analyses` mới (không ghi đè) để giữ lịch sử.

## Hiệu năng pipeline (đo thật)

3 lời gọi Gemini tuần tự, đo trực tiếp (không qua Trellix vì Gemini không bị chặn cục bộ): stage 1 (search grounding) ~4-13s, stage 2 (structured output, schema 10 field lồng nhau) ~6-22s — **chậm nhất**, stage 3 (rationale) ~9s. **Tổng thực tế: 35-70 giây**, có lúc hơn. Đây là lý do:
- `app/tran-dau/[slug]/page.tsx` **bắt buộc phải có** `export const maxDuration = 120;` — thiếu dòng này từng là 1 bug thật (đã fix), vì mặc định Vercel Hobby giới hạn 10-60s, sẽ timeout giữa chừng khi deploy nếu thiếu.
- `loading.tsx` là client component mô phỏng tiến trình 3 bước (search → cấu trúc hóa → dự đoán) bằng timer ước lượng theo timing đo được ở trên, **không phải progress thật từ server** (Next.js không có cách nào đẩy progress thật từ 1 Server Component đang chạy ra ngoài qua `loading.tsx`) — đây là fake-progress UX hợp lệ, không đánh lừa vì không tự nhận "xong" trước khi nội dung thật thay thế nó.
- Nếu cần nhanh hơn thật sự trong tương lai: cân nhắc model nhẹ hơn (`gemini-2.5-flash-lite`) cho stage 2/3, đánh đổi chất lượng cấu trúc hóa lấy tốc độ — chưa làm, chỉ ghi nhận hướng đi.
- **Free tier Gemini có rate limit ngắn hạn** (thông báo thực tế: `limit: 20` cho `generate_content_free_tier_requests`, gợi ý retry sau ~55s) — test dồn dập nhiều lần liên tiếp (như trong phiên làm việc này) sẽ dính lỗi `429`/quota exceeded, khiến cả lần gọi chính lẫn lần retry đều fail → banner lỗi chung chung cho người dùng dù server log có chi tiết đầy đủ. **Đây từng là nguyên nhân thật của 1 lỗi người dùng báo cáo** ("Không thể lấy dữ liệu trận đấu") — không phải bug code, mà do test quá nhiều trong thời gian ngắn. Khi có `DATABASE_URL` thật, cache-first sẽ giảm mạnh số lần gọi lặp lại cho cùng 1 trận.

## Fixture list (trận đấu sắp diễn ra)

- `lib/fixtures/football-data.ts` — `getUpcomingFixtures(leagueId)` cache-first qua Neon (bảng `league_fixtures_cache`, cùng TTL với `ANALYSIS_TTL_HOURS`) rồi mới gọi football-data.org REST API (`/v4/competitions/{code}/matches`, header `X-Auth-Token`), lấy trận `SCHEDULED` trong **15 ngày tới** (đã giảm từ 30 xuống 15 theo yêu cầu). Map `LeagueId` nội bộ → mã competition của football-data.org (`PL`, `PD`, `SA`, `BL1`, `FL1`, `CL`, `WC`). Gói **Free** của football-data.org (không cần thẻ) đã bao gồm đủ các giải này.
- **Luôn trả về `[]` thay vì throw** khi thiếu `FOOTBALL_DATA_API_KEY`, lỗi API, hoặc rate-limit — quyết định có chủ đích, cùng pattern với chế độ mock-mode của AI: không bao giờ để thiếu 1 API key làm chết tính năng.
- `app/api/lich-thi-dau/route.ts` — GET `?league=<id>`, trả `{ fixtures: Fixture[] }`.
- `lib/db/schema.ts` có thêm bảng `leagueFixturesCache` (`league_fixtures_cache`, `league` UNIQUE, `fixtures` jsonb, `fetched_at`, `expires_at`); `lib/db/queries.ts` có `getCachedFixtures`/`upsertFixturesCache`. Nếu không có `DATABASE_URL`, bỏ qua cache, gọi API trực tiếp mỗi lần (giống hành vi cache của match analyses).
- **`components/MatchPickerForm.tsx` đã đơn giản hóa mạnh** (theo yêu cầu người dùng, bỏ hẳn chọn đội thủ công): chỉ còn 1 dropdown chọn giải đấu → tự động fetch và hiện danh sách trận trong 15 ngày tới → **bấm 1 trận là điều hướng thẳng** sang trang phân tích (`router.push`), không còn nút submit riêng, không còn state `mode`/`homeTeam`/`awayTeam` thủ công. Nếu danh sách rỗng (vd football-data.org lỗi hoặc hết mùa giải), chỉ hiện thông báo — **không có fallback nhập tay nữa**, đây là đánh đổi có chủ đích người dùng chấp nhận.
- Cần `FOOTBALL_DATA_API_KEY` (đăng ký free tại football-data.org, chọn gói **Free**, không cần thẻ) để tính năng này hoạt động thật. Key thật đã có trong `.env.local` nhưng **chưa test được từ máy dev** vì bị Trellix chặn (xem "Giới hạn đã biết") — chỉ verify qua mock response tạm thời rồi revert.

## Chế độ Demo/Mock — quan trọng

Vì chưa có API key/DB thật lúc build ban đầu, đã thêm cơ chế demo để phát triển/test UI không cần credentials thật:

- `lib/ai/provider.ts` export `hasAiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)`. Nếu `false`, `stage1-search.ts`/`stage2-structure.ts`/`stage3-predict.ts` đều trả dữ liệu giả từ `lib/ai/mock-data.ts` (deterministic theo tên đội, không random thật để kết quả ổn định giữa các lần refresh cùng cặp đội) thay vì gọi AI.
- `lib/db/index.ts` export `dbEnabled = Boolean(process.env.DATABASE_URL)`. Nếu `false`, `lib/pipeline.ts` bỏ qua toàn bộ cache/persist — luôn chạy pipeline mới, không lưu DB, `matchId`/`analysisId` được gen bằng `randomUUID()` tạm thời.
- Khi `isMock === true`, UI hiển thị banner vàng "Đang chạy ở chế độ demo..." ở đầu trang kết quả (`app/tran-dau/[slug]/page.tsx`).
- **Khi có key/DB thật**: chỉ cần set biến env, không cần sửa code gì — cả hai flag tự chuyển sang chế độ thật.

## Quyết định kiến trúc quan trọng — không đổi mà không thảo luận với người dùng

- **Không kết hợp Google Search grounding + structured output trong cùng 1 lời gọi Gemini** (Gemini không hỗ trợ — xác nhận qua GitHub issue `vercel/ai#11815`). Vì vậy stage 1 (search, `generateText` + tool `googleSearch`) và stage 2 (cấu trúc hóa, `generateText` + `output: Output.object(...)`) luôn là 2 lời gọi tách biệt, không được gộp lại để "tối ưu".
- **Xác suất dự đoán không hỏi trực tiếp từ LLM** — dùng công thức xác định `computeProbabilities()` trong `stage3-predict.ts` (test được, không cần mock AI). Hướng nâng cấp đã định (chưa làm): mô hình Poisson expected-goals.
- **Không thêm auth, payment, queue, Redis, microservices** trừ khi được yêu cầu rõ ràng.
- **UI navigation dùng Server Component + `loading.tsx`**, không phải client-side POST + redirect như bản plan gốc phác thảo — đơn giản hơn và tận dụng streaming SSR có sẵn của Next.js.
- **Provider AI là Google Gemini trực tiếp (`@ai-sdk/google`), không phải Vercel AI Gateway** — xem "Lịch sử quyết định" để biết lý do (Gateway bắt buộc thẻ tín dụng). Không đổi lại Gateway trừ khi lý do này không còn đúng.

## Lịch sử quyết định (đổi provider AI)

Thiết kế ban đầu dùng **Perplexity Sonar qua Vercel AI Gateway**. Khi có `AI_GATEWAY_API_KEY` thật để test, phát hiện 2 vấn đề:
1. Máy dev có Trellix Endpoint Security (antivirus công ty) chặn/soi HTTPS hệ thống → lỗi `self-signed certificate in certificate chain` khi gọi bất kỳ API bên ngoài nào từ local. Vấn đề của máy dev, không phải code — không ảnh hưởng khi deploy lên Vercel.
2. Vercel AI Gateway **bắt buộc thẻ tín dụng trên file** để phục vụ request, kể cả dùng free credit (`customer_verification_required`).

Người dùng muốn tránh cần thẻ tín dụng → đã khảo sát và chuyển sang **Google Gemini API (Google AI Studio)**: free vĩnh viễn, không cần thẻ, và có **Google Search grounding miễn phí tới 1.500 request/ngày** (đủ dùng cho quy mô app này) — thay thế hoàn hảo cho Perplexity Sonar ở stage 1, dùng luôn cho stage 2/3. Đổi 1 provider duy nhất (`@ai-sdk/google`, 1 key `GOOGLE_GENERATIVE_AI_API_KEY`) thay vì phối 2 provider riêng (phương án khác đã cân nhắc: Tavily cho search + Groq cho suy luận, cũng free không cần thẻ nhưng nhiều code hơn).

**Lưu ý**: đổi provider **không** giải quyết vấn đề #1 (TLS ở local) một cách toàn diện — Trellix chặn theo domain, không phải chặn tất cả. Đã xác nhận thực nghiệm: **Gemini (`generativelanguage.googleapis.com`) gọi được bình thường từ máy dev**, nhưng **football-data.org (`api.football-data.org`) vẫn bị chặn** (cùng lỗi `self-signed certificate in certificate chain`). Tức là mỗi domain bên ngoài có thể có kết quả khác nhau trên máy này — không giả định "đổi 1 provider là hết vấn đề TLS", phải test riêng từng domain nếu gặp lỗi lạ ở local.

## Thiết kế UI

Đã làm 1 lượt redesign toàn diện (yêu cầu "chuyên nghiệp hơn, như 1 app xịn"):
- Cài `lucide-react` cho icon (nhẹ, tree-shakeable), dùng xuyên suốt thay vì emoji/text thuần.
- `app/globals.css`: thêm palette biến CSS (`--brand`, `--brand-dark`, `--brand-light`), animation `shimmer` cho skeleton loading. **Đã xóa** `@media (prefers-color-scheme: dark)` auto-invert màu — trước đó là bug tiềm ẩn: rule CSS thuần (unlayered) này có specificity cao hơn Tailwind utility classes (nằm trong `@layer utilities`), nên có thể ghi đè `bg-slate-50`/`text-slate-900` một cách không mong muốn nếu OS/browser ở dark mode. Giờ set cứng `color-scheme: light` vì app chưa hỗ trợ dark mode thật.
- `app/layout.tsx`: header sticky + backdrop-blur, logo mark gradient (Trophy icon).
- `app/page.tsx`: thêm hero badge, gradient text, 3 step-card giới thiệu quy trình.
- `components/MatchPickerForm.tsx`: fixture card có team badge (avatar chữ cái đầu, gradient tròn) — **lưu ý layout**: dùng 2 cột riêng cho tên đội nhà/khách (không phải 1 dòng text chung `truncate`), vì cách cũ cắt chữ giữa từ ("Manches...ter"), gây khó đọc.
- `components/PredictionCard.tsx`: thanh xác suất gộp 3 màu, khối phần trăm lớn có crown badge cho kết quả khả năng cao nhất. **Lưu ý**: nhãn tên đội dùng `line-clamp-2` (cho phép xuống 2 dòng) thay vì `truncate` 1 dòng — tên đội dài (vd "Manchester City") không đủ chỗ ở cột 1/3 trên mobile nếu ép 1 dòng.
- `components/AnalysisSection.tsx`, `SourcesList.tsx`: card bo tròn hơn (`rounded-3xl`), badge màu cho điểm mạnh/yếu/chấn thương, số thứ tự nguồn dạng hình tròn.
- `app/tran-dau/[slug]/loading.tsx`: đổi từ spinner chung chung sang **step indicator 3 bước thật** (search/cấu trúc hóa/dự đoán) với timing ước lượng theo số đo thật — xem "Hiệu năng pipeline".
- `app/icon.tsx`: favicon tự sinh bằng `next/og` `ImageResponse` (SVG bóng đá đơn giản). **Lưu ý quan trọng**: ban đầu dùng emoji `⚽` làm nội dung — build fail vì `ImageResponse`/satori fetch font emoji qua mạng, bị Trellix chặn (lỗi giống hệt các domain khác). Đã đổi sang SVG thuần (không cần fetch gì) để build không phụ thuộc mạng, chạy được cả ở máy có TLS interception.
- Xóa `app/favicon.ico` mặc định và các SVG template không dùng (`public/*.svg`) từ `create-next-app`.

## Giới hạn/known issue đã biết

## Giới hạn/known issue đã biết

- **TLS bị chặn ở máy dev local** (Trellix Endpoint Security), **theo từng domain** — Gemini gọi được, football-data.org bị chặn, Vercel AI Gateway (không dùng nữa) từng bị chặn. Không fix, test qua Vercel khi cần domain nào đó bị chặn cục bộ.
- **Pipeline thật chậm** (35-70s/lần, đo thật) — xem "Hiệu năng pipeline". `maxDuration = 120` đã set ở `app/tran-dau/[slug]/page.tsx` để không bị Vercel cắt giữa chừng.
- **HTTP status code của trang 404**: `app/tran-dau/[slug]/page.tsx` gọi `notFound()` khi thiếu `league`/`home`/`away` hợp lệ trong query string. Vì trang này có `loading.tsx` (Suspense boundary), Next.js đã flush header `200` trước khi biết trang sẽ 404 (streaming SSR). Nội dung hiển thị đúng là trang "not found", nhưng status code trả về vẫn là `200` thay vì `404`. Ảnh hưởng: chỉ SEO/crawler. Chưa fix vì không đáng công sức ở quy mô hiện tại.
- Vercel Hobby function duration mặc định 10s/60s max; cần **Fluid Compute** bật để lên tới 300s (pipeline thật có thể mất 15-40s do gọi search + 2 lời gọi Gemini). Xác nhận đã bật trước khi lo lắng về timeout.
- Free tier Gemini API: rate limit theo phút (10-30 RPM tùy model) + 1.500 request grounded/ngày miễn phí cho `gemini-2.5-flash`. Model id có thể đổi theo thời gian — kiểm tra tại ai.google.dev nếu gặp lỗi "model not found".
- Free tier football-data.org: 10 request/phút.
- **Thư mục `Embedded/`** (project Angular/Arduino không liên quan) đang nằm chung thư mục gốc với web bóng đá (do lịch sử git remote trỏ tới repo cũ). Đã exclude khỏi `tsconfig.json` và `eslint.config.mjs` để không phá typecheck/lint của Next.js app. Theo yêu cầu người dùng: **không tự động dọn/xóa thư mục này**, họ sẽ tự xử lý.
- Trang kết quả **không hiển thị chi tiết lỗi kỹ thuật** cho người dùng (đã sửa sau khi phát hiện banner lỗi từng leak nguyên văn message của AI SDK) — lỗi chi tiết chỉ log qua `console.error` phía server (`app/tran-dau/[slug]/page.tsx`), người dùng chỉ thấy "Không thể lấy dữ liệu trận đấu lúc này. Vui lòng thử lại sau."
- **Bảo mật**: không paste API key trực tiếp vào chat/tin nhắn — key trước đó (Vercel AI Gateway) đã bị dán vào chat, đã ghi vào `.env.local` (gitignored) rồi bỏ khi đổi provider; nội dung chat có thể được lưu log ở nơi khác ngoài tầm kiểm soát của repo này.

## Bản đồ file/module

- `lib/ai/schemas.ts` — Zod: `StructuredAnalysisSchema`, `PredictionSchema`, `ExtractedSignalsSchema`. Nguồn chân lý duy nhất cho shape dữ liệu giữa các stage.
- `lib/ai/provider.ts` — `hasAiKey`, model constants (`STAGE1_MODEL`, `STAGE2_MODEL`, `STAGE3_MODEL`, mặc định `gemini-2.5-flash`).
- `lib/ai/mock-data.ts` — dữ liệu giả lập cho chế độ demo.
- `lib/ai/stage1-search.ts`, `stage2-structure.ts`, `stage3-predict.ts` — 3 bước pipeline (Gemini qua `@ai-sdk/google`).
- `lib/pipeline.ts` — orchestrator dùng chung (cache-check → pipeline → persist).
- `lib/db/schema.ts` — bảng Drizzle: `matches`, `match_analyses`, `league_fixtures_cache`.
- `lib/db/index.ts` — `db`, `dbEnabled`.
- `lib/db/queries.ts` — `getOrCreateMatch`, `getLatestAnalysis`, `getLatestAnalysisById`, `insertAnalysis`, `getCachedFixtures`, `upsertFixturesCache`.
- `lib/cache/policy.ts` — `buildCacheKey`, `buildSlug`, `isFresh`, `computeExpiresAt`, `TTL_HOURS`.
- `lib/utils/leagues.ts` — danh sách giải đấu + đội (static, gồm cả `world-cup-2026`), `slugifyTeamName`.
- `lib/fixtures/football-data.ts` — `getUpcomingFixtures(leagueId)`, luôn trả `[]` khi lỗi/thiếu key.
- `app/api/phan-tich/route.ts` — POST, validate bằng Zod, gọi `getOrRunAnalysis`.
- `app/api/phan-tich/[id]/route.ts` — GET theo `analysisId` (yêu cầu `dbEnabled`).
- `app/api/lich-thi-dau/route.ts` — GET `?league=<id>`, trả danh sách trận sắp diễn ra.
- `app/tran-dau/[slug]/page.tsx` (`maxDuration = 120`) + `loading.tsx` (client component, step indicator giả lập) — trang kết quả.
- `app/icon.tsx` — favicon SVG tự sinh qua `next/og`, không dùng emoji (xem "Thiết kế UI").
- `components/MatchPickerForm.tsx` — chọn giải → chọn trận (fixtures) hoặc tự chọn đội (manual), `PredictionCard.tsx`, `AnalysisSection.tsx`, `SourcesList.tsx` — UI, mobile-first Tailwind, icon từ `lucide-react`.

## Environment Variables

| Biến | Dùng ở đâu | Ghi chú |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | `lib/ai/provider.ts` | Free tại aistudio.google.com, không cần thẻ. Thiếu → toàn bộ pipeline chạy chế độ demo/mock |
| `DATABASE_URL` | `lib/db/index.ts` | Thiếu → không cache, không lưu lịch sử |
| `ANALYSIS_TTL_HOURS` | `lib/cache/policy.ts` | Mặc định 6 |
| `STAGE1_MODEL` / `STAGE2_MODEL` / `STAGE3_MODEL` | `lib/ai/provider.ts` | Mặc định `gemini-2.5-flash` cho cả 3 |
| `FOOTBALL_DATA_API_KEY` | `lib/fixtures/football-data.ts` | Free tại football-data.org (gói Free), không cần thẻ. Thiếu → danh sách trận rỗng, UI tự fallback sang chọn đội thủ công |

Xem `.env.local.example` để copy thành `.env.local`.

## Lệnh hay dùng

- `npm run dev` — dev server (Turbopack, port 3000 hoặc port kế tiếp nếu bận).
- `npm run build` — production build (đã verify pass).
- `npm run db:generate` / `npm run db:push` — Drizzle migration (cần `DATABASE_URL` thật).
- `npx tsc --noEmit` / `npx eslint .` — typecheck/lint (đã verify pass, 0 lỗi).

## Kiểm thử đã thực hiện

- Typecheck + ESLint: pass, 0 lỗi (đã exclude `Embedded/`).
- `npm run build`: pass, các route API là dynamic (ƒ), trang chủ + `/icon` static, `/tran-dau/[slug]` dynamic — đúng như kỳ vọng.
- Test thủ công bằng Playwright (cài tạm ở scratchpad, không phải dependency của repo), sau redesign UI: luồng chọn giải đấu + 2 đội (mobile 375×812 + desktop 1280×900, nhiều giải kể cả World Cup 2026), luồng chọn trận từ danh sách fixtures (tạm mock response football-data.org để verify UI rồi revert — layout đã sửa 1 lần vì bug truncate tên đội), luồng fallback sang chọn thủ công, màn loading step-indicator (verify bằng cách tạm thêm delay giả rồi revert), và trạng thái lỗi khi AI thật fail. Không có console error ở bất kỳ luồng nào.
- **Đã test thành công pipeline Gemini thật** (có `GOOGLE_GENERATIVE_AI_API_KEY` thật): nhiều lần gọi trực tiếp (không qua UI) để đo timing từng stage, và 1 lần qua route thật (`/tran-dau/...`) — tất cả đều trả kết quả đúng, không mock, thời gian 35-70s khớp với timing đo riêng từng stage.
- **`FOOTBALL_DATA_API_KEY` thật đã có nhưng chưa test được** — bị Trellix chặn ở máy dev (xem "Giới hạn đã biết"). Code path graceful-fallback đã verify kỹ (mock response), nhưng chưa có bằng chứng thực nghiệm là key/endpoint đúng — cần test trên Vercel.
- Đã generate migration Drizzle (`drizzle/0000_confused_talkback.sql` + `drizzle/0001_petite_maverick.sql` cho bảng `league_fixtures_cache`) khớp `lib/db/schema.ts`, đưa cho người dùng chạy trực tiếp qua Neon SQL Editor/psql (chưa xác nhận đã chạy xong — **cần chạy cả 2 file theo thứ tự** nếu chưa chạy file 0000).

## Ngôn ngữ

Toàn bộ text hiển thị cho người dùng (UI, thông báo lỗi, prompt yêu cầu output) đều bằng **tiếng Việt**.
