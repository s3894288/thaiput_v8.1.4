# Kế hoạch chi tiết v9: gỡ điểm nghẽn Apps Script, email bên thứ ba sớm, chuyển lên Next.js + Supabase

*Lập 05/11/2026, bám `plan/KE_HOACH_SAU_GO_LIVE.md` (anh đã duyệt 01/11, BL12). File này không thay file đó: nó chi tiết hoá từng sprint, thêm một bước làm NGAY trong v8 (email bên thứ ba) và liệt kê từng điểm nghẽn của Apps Script cùng cách gỡ. Mọi mục cần anh chốt ghi ở mục 12 và BACKLOG BL70 đến BL78. Giá và hạn mức kiểm tháng 10 và 11/2026, phải kiểm lại khi bắt đầu từng sprint.*

> **Bản 2 (05/11/2026 chiều): `KE_HOACH_V9_TOI_UU_DIEU_PHOI.md` sửa 3 chỗ trả đắt của file này** (hosting Cloudflare Workers thay Vercel, email Amazon SES thay Resend ngay từ 5R, bỏ Google AI Pro dùng Gemini CLI miễn phí: hạ tầng 65 → 35 USD mỗi tháng) **và thêm kế hoạch tổng P0 đến P5, điều phối Claude, Codex, Gemini.** Mục 2, 3, 10 và BL70 của file này đọc theo bản 2; phần còn lại giữ nguyên.

## Thay đổi so với bản 01/11 (`KE_HOACH_SAU_GO_LIVE.md`)

* Thêm **bước 0 làm ngay trong v8, trước v9:** gửi email qua dịch vụ bên thứ ba (Resend) để có hơn 1.500 thư mỗi ngày mà không phải chờ Workspace qua 60 ngày trả phí. Đây là sub chunk 5R (bản 8.1.5), đi qua đúng chỗ `MailTransport.gs` đã chừa (BL31, luật 19).
* Liệt kê 14 điểm nghẽn của Apps Script + Sheets và cái thay thế trong v9 (mục 1). Trước đây chỉ nói chung.
* Chốt kiến trúc ở mức có thể bắt tay viết: cấu trúc repo, bảng Postgres, ràng buộc, ánh xạ 57 luật `CLAUDE.md`, cron, hàng đợi, môi trường, CI/CD, giám sát, sao lưu, soát bảo mật.
* Lộ trình giữ nguyên S0 đến S16 và cách chia việc cho 3 công cụ; mỗi sprint có việc cụ thể, test phải chép từ v8 và điều kiện xong.
* Ghi rõ những gì của v8 **không chuyển** vì Postgres và máy chủ thật đã lo (mục 5.3).

## 0. Nói thẳng trước khi làm (giữ nguyên 3 điểm của bản 01/11, thêm 2)

1. **Không chuyển chỉ vì muốn "xịn hơn".** Điều kiện bắt đầu v9 không đổi: v8 chạy ổn ít nhất 8 tuần sau chunk 9, hoặc chạm một ngưỡng trong mục 4.2, 4.4 của tư vấn 16/10 (`archive/TU_VAN_VA_KIEN_TRUC.md`): trên 300 học viên hoạt động mỗi tháng, trên 1.000 người nhận email mỗi ngày, p95 xem slot trên 3 giây trong 3 ngày, lỗi bận trên 0,5% lượt đặt mỗi tuần.
2. **Hạn mức công cụ AI là nút thắt thật** (Claude Pro bằng khoảng một phần năm Max). 16 tuần với Max, 20 đến 24 tuần với Pro.
3. **Người không viết code tự xây hệ thống có dữ liệu cá nhân là rủi ro:** bắt buộc test tự động, một vòng soát bảo mật bởi người thật, chạy bóng song song trước khi cắt chuyển.
4. **Mới:** riêng email thì **không cần chờ v9**. Điểm nghẽn hạn mức thư là điểm duy nhất chặn tăng trưởng ngay bây giờ (tài khoản dùng thử khoảng 100 thư mỗi ngày, trả phí 1.500) và v8 đã có chỗ cắm đường gửi khác. Làm ở 5R, khoảng 2 cửa sổ Claude, không đụng luật nghiệp vụ.
5. **Mới:** `CLAUDE.md` hiện ghi "không thêm máy chủ ngoài" (quyết định 16/10). Bước 0 chỉ thêm một dịch vụ gửi thư (không phải máy chủ chạy code), vẫn hợp luật 19 và BL31. Khi vào S0 của v9 mới sửa dòng chiến lược đó; tới lúc ấy v8 vẫn là hệ thống thật và `CLAUDE.md` của repo v8 giữ nguyên.

## 1. Điểm nghẽn của Apps Script + Sheets và cách gỡ trong v9

| # | Điểm nghẽn hiện tại (v8 đã phải né bằng gì) | Cách gỡ ở v9 |
|---|---|---|
| 1 | **Hạn mức email** MailApp 1.500 người nhận mỗi ngày, dùng thử khoảng 100; `sendMail_` ưu tiên `low` tự bỏ thư nhắc khi gần hết; marketing dừng ở `MARKETING_QUOTA_RESERVE` | Resend (bước 0, làm ngay trong v8): Pro 20 USD được 50.000 thư mỗi tháng, không trần ngày; có báo đã tới, bị trả về, báo spam. v9 dùng tiếp |
| 2 | **Một khoá toàn hệ thống** `LockService` 30 giây: mọi lượt đặt, huỷ, duyệt xếp hàng; lỗi "hệ thống đang bận"; phải gom ghi `afterLock_`, `deferWrite_`, tối đa 2 lần lấy khoá | Giao dịch Postgres: khoá theo dòng (`SELECT ... FOR UPDATE` gói của học viên), chỉ mục duy nhất chống trùng slot và trùng ngày. Hai học viên đặt hai tutor khác nhau chạy song song |
| 3 | **Giới hạn 6 phút mỗi lần chạy:** lưu trữ cắt lô 3,5 phút, marketing dừng 4,5 phút, nhắc tutor có giới hạn giờ, `DONE_<việc>` để làm bù | Việc nền chạy theo hàng đợi (bảng `outbox`), mỗi lượt cron xử lý một lô, không có trần 6 phút ở mức hệ thống; việc dài chia lô tự nhiên |
| 4 | **Sheets làm database:** đọc cả tab mỗi lần (`table_`), không giao dịch, không kiểu dữ liệu (luật 22, 26: cột text, dấu nháy), 10 triệu ô, phải lưu trữ 60 ngày để tab nhỏ, `purgeRows_` phức tạp, admin sửa tay làm hỏng (onEdit trả lại, `pkgHealAllInLock_`) | PostgreSQL: kiểu dữ liệu, ràng buộc `CHECK`, khoá ngoại, chỉ mục; hàng triệu dòng không cần lưu trữ; không ai sửa tay vì mọi việc qua trang admin; nhật ký chỉ ghi thêm bằng quyền và trigger |
| 5 | **Trigger:** tối đa 20 mỗi tài khoản, nhịp tối thiểu 1 phút, lệch giờ, "Completed" chỉ là không ném lỗi (luật 9), 8 trigger phải tạo bằng menu 3 | Cron của Vercel gọi `/api/jobs/<tên>` có khoá bí mật; mỗi lượt ghi bảng `job_runs` (bắt đầu, kết thúc, số dòng, lỗi); trang health đọc bảng này; không cần tạo tay |
| 6 | **Web app HtmlService:** nhúng khung Google Sites, mỗi `google.script.run` mất 1 đến 3 giây, khởi động lạnh, không định tuyến thật, không SEO, phiên bằng token trong trình duyệt, Google Sites chặn chuyển trang (BL67) | Next.js trên tên miền riêng: trang render ở máy chủ, cookie phiên httpOnly, đường dẫn thật (`/hoc-vien`, `/tutor`, `/admin`), điện thoại tốt |
| 7 | **Đăng nhập tự viết:** link email, `AUTH` băm token, dự án phụ `companion/` ký chữ ký Google, `sessionLookup_` qua CacheService | Supabase Auth: link email và Google OAuth có sẵn, phiên và làm mới token đã được kiểm chứng; vai trò nằm ở bảng `profiles`; máy chủ Next.js vẫn là nơi duy nhất quyết định quyền (luật 6) |
| 8 | **Bộ đệm và hàng chờ bằng CacheService, Script Properties** (`LOGQ_`, `DONE_`, `MKT_RUN_`, `slots_v`, `cfg_ver`, hạn 21.600 giây) | Bảng Postgres (`job_marks`, `outbox`) và bộ đệm của Next.js; cần tốc độ hơn thì thêm Upstash Redis sau, không bắt buộc |
| 9 | **Idempotency** `idem_` + `rid` giữ trong CacheService (mất là gửi trùng) | Bảng `idempotency_keys (scope, rid) UNIQUE` và cột `bookings.request_id UNIQUE`: chống trùng ở mức dữ liệu |
| 10 | **Giám sát:** trang Executions, email lỗi cho admin 1 lần mỗi giờ, tab METRICS, nhịp tim `HB_<job>`, `?page=health` | Sentry (lỗi có ngữ nguyên vẹn), log của Vercel và Supabase, Better Stack hoặc UptimeRobot gọi `/api/health` mỗi phút, bảng `job_runs`; vẫn gửi email và thông báo cho admin như NOTIFY_RULES |
| 11 | **Phát hành:** dán `dist/` hoặc `clasp push`, chạy menu 1 bằng tay, thứ tự luật 38, sao lưu Releases, STAGING và PRODUCTION là hai file Sheets | Git: nhánh `main` lên production, nhánh `staging` lên staging, mỗi PR có bản xem thử; migration SQL chạy bằng GitHub Actions có bước duyệt tay cho production; rollback bằng redeploy bản trước |
| 12 | **Test:** harness tự viết giả lập Google (`gas_mock.js`), luật 14 "không tốt bụng hơn Google" | Vitest cho hàm thuần (chép nguyên test vector và 40 kịch bản), test tích hợp chạy trên Postgres thật trong CI (`supabase start`), Playwright cho 3 cổng |
| 13 | **Ngôn ngữ:** V8 runtime nhưng viết kiểu ES5 (`var`, không module, không gói npm, không kiểu), 38 file gộp thành một `Code.gs` 12.000 dòng | TypeScript, module, gói npm, kiểu dữ liệu sinh từ schema (`supabase gen types`), lint và typecheck trong CI |
| 14 | **Sao lưu:** bản sao file Sheets hằng đêm vào Drive, file lưu trữ theo năm | Supabase: sao lưu hằng ngày (Pro), PITR tuỳ chọn; thêm `pg_dump` hằng đêm đẩy lên Google Drive của admin@ để giữ thói quen và có bản ngoài Supabase |

Giữ nguyên, không phải điểm nghẽn: Google Calendar và Meet (sự kiện trên `LESSON_CALENDAR_ID`, mã sự kiện cố định `lessonEventId_`, khách mời học viên và tutor), tài khoản admin@ Workspace, tên miền.

## 2. Bước 0 (ngay trong v8): email qua bên thứ ba, chunk 5R, bản 8.1.5

**Mục tiêu:** hệ thống gửi được 1.500 thư mỗi ngày trở lên ngay, không phụ thuộc tuổi tài khoản Workspace; thư đi từ tên miền riêng có SPF, DKIM, DMARC; biết thư nào bị trả về.

**Chọn dịch vụ (BL70):** đề xuất **Resend**. Lý do: API một lệnh HTTP, tài liệu dễ, gói Free 3.000 thư mỗi tháng nhưng trần 100 mỗi ngày (chỉ để thử trên STAGING); gói Pro 20 USD mỗi tháng 50.000 thư, không trần ngày, dùng cho PRODUCTION. Phương án khác: Postmark (giá theo 10.000 thư, deliverability rất tốt), Amazon SES (rẻ nhất, cài đặt khó hơn cho người mới). Cả ba đều dùng được cùng một chỗ cắm.

**Việc của code (Claude, khoảng 2 cửa sổ):**

1. `MailTransport.gs`: thêm `RESEND` vào `MAIL_TRANSPORTS_`; `mailDeliver_` gọi `UrlFetchApp.fetch('https://api.resend.com/emails')` với khoá `RESEND_API_KEY` trong Script Properties (không ghi vào CONFIG vì CONFIG tutor không xem nhưng admin chép tab dễ lộ), `from` là `MAIL_FROM_NAME <booking@mail.<tên miền>>`, `reply_to` là `ADMIN_EMAIL`, gửi cả HTML và bản chữ thuần (`mailPlainText_` đã có), gắn `tags` = kind để tra trong Resend. Resend trả lỗi (mạng, 4xx, 5xx) thì tự gửi lại bằng GmailApp và ghi MAIL_FALLBACK như cơ chế thiếu quyền hiện có (1 thông báo mỗi giờ). Chỉ file này được gọi `UrlFetchApp` tới dịch vụ thư; test I133 mở rộng quét thêm `api.resend.com`.
2. `mailBudget_` khi transport là RESEND: hạn mức = `MAIL_DAILY_CAP` (CONFIG, mặc định 1.400 cho Pro, 90 cho Free) trừ số dòng MAIL_LOG hôm nay có cột `transport = RESEND` (đếm qua `logAppend_` không được, cần đếm nhanh: giữ bộ đếm theo ngày trong CacheService, mất thì đếm lại MAIL_LOG một lần). Hạn mức này cũng là bảng 5 dòng ở menu 2 mà BL69 đang chờ: làm chung.
3. Menu Email → Kiểm tra gửi email: hiện đường gửi thật (đã có `LAST_MAIL_TRANSPORT_`), thêm mục "Kiểm Resend" gửi 1 thư tới ADMIN_EMAIL và đọc trạng thái qua API `GET /emails/{id}` (delivered, bounced).
4. Không làm webhook trong v8: `doPost` theo luật 48 chỉ dành cho cổng thử tải STAGING. Thư bị trả về đọc bằng API khi admin bấm kiểm (hoặc `hourlyJob` đọc 20 thư gần nhất, ghi MAIL_BOUNCED vào NOTIFICATIONS). v9 mới nhận webhook.
5. Email marketing (Marketing.gs) đi cùng đường, giữ `MARKETING_QUOTA_RESERVE`; với Resend có thể hạ reserve vì hạn mức rộng.
6. Test: U mới cho `mailDeliver_` RESEND (mock `UrlFetchApp` trả 200, 429, 500, mất mạng), I mới cho fallback và MAIL_LOG ghi `transport = RESEND`, I133 mở rộng. `appsscript.json` đã có quyền `script.external_request`? Nếu chưa thì thêm (đổi quyền, báo trong PROGRESS theo quy ước 1).

**Việc của admin (anh Chris, khoảng 1 giờ, theo mẫu mục 4 của `docs/06_HUONG_DAN_TEN_MIEN_WORKSPACE.md`):**

1. Đăng ký resend.com bằng admin@, chọn Pro khi lên PRODUCTION.
2. Domains → Add → `mail.<tên miền>` (tên miền phụ, để tiếng xấu nếu có không ảnh hưởng thư tay của admin@). Chép 3 bản ghi DNS (MX cho bounce, TXT SPF, TXT DKIM) sang Namecheap. Thêm DMARC `_dmarc.mail.<tên miền>` với `p=none` trước, sau 2 tuần đổi `p=quarantine`.
3. Chờ Verified (vài phút tới vài giờ). API Keys → tạo khoá "Sending access" chỉ cho tên miền đó, dán vào Script Properties `RESEND_API_KEY` (hướng dẫn có hình).
4. STAGING: CONFIG `MAIL_TRANSPORT = RESEND`, chạy Kiểm tra gửi email, kiểm thư tới 5 loại hộp thư (BL69). Rồi PRODUCTION.
5. Giữ `GMAILAPP` làm dự phòng; đổi lại một ô CONFIG là quay về.

**Rủi ro:** thư từ tên miền phụ mới có "tuổi" 0, hai tuần đầu nên gửi dần (Resend có hướng dẫn warm up); `reply_to` về admin@ nên học viên trả lời vẫn vào hộp admin; Calendar vẫn mời khách bằng Google (hạn mức lời mời ra ngoài tên miền riêng, không liên quan Resend).

## 3. Kiến trúc v9 (chi tiết hoá bảng mục 1 của bản 01/11)

```
Trình duyệt (học viên, tutor, admin)
    │  HTTPS, cookie phiên httpOnly
    ▼
Next.js (TypeScript, App Router) trên Vercel Pro, tên miền riêng
    ├── Server Components, Server Actions, Route Handlers: NƠI DUY NHẤT kiểm quyền và gọi database
    ├── packages/core: luật nghiệp vụ thuần (chuyển từ v8), không biết database
    ├── /api/jobs/*: cron (Vercel Cron) có khoá bí mật
    └── /api/webhooks/resend: báo thư tới, trả về
Supabase Pro
    ├── PostgreSQL: dữ liệu, ràng buộc, chỉ mục, trigger chỉ ghi thêm, RLS (lớp phòng vệ thứ hai)
    ├── Auth: link email, Google OAuth
    └── Storage: ảnh chuyển khoản (thay screenshot_url trên Drive)
Google Workspace admin@
    └── Calendar API (service account uỷ quyền toàn miền hoặc OAuth admin@): sự kiện, Meet, khách mời
Resend: email giao dịch và marketing (đã dùng từ bước 0)
Sentry, Better Stack: lỗi và nhịp sống; GitHub Actions: test, migration, deploy
```

**Nguyên tắc kiến trúc (chuyển từ luật v8):**

1. **Trình duyệt không bao giờ gọi Supabase trực tiếp.** Mọi đọc ghi qua máy chủ Next.js với khoá service role nằm ở biến môi trường máy chủ. RLS vẫn bật và viết chính sách cho từng vai trò để nếu một ngày có app điện thoại gọi thẳng thì vẫn an toàn. Đây là cách giữ luật 6 (không nhận `student_id` từ trình duyệt) đơn giản nhất.
2. **Luật nghiệp vụ là hàm thuần trong `packages/core`** (luật 7): nhận dữ liệu, trả kết quả, có `clock` truyền vào thay `getNow_` (luật 1), ngày là chuỗi `YYYY-MM-DD` và giờ là `HH:MM` (hết chuyện nửa đêm và 12:00 của luật 2, 3; timezone cố định `Asia/Ho_Chi_Minh` ở một chỗ).
3. **Một lượt ghi = một giao dịch.** Trong giao dịch: khoá dòng cần, đọc, kiểm luật bằng core, ghi, ghi `activity_log`, ghi `outbox`. Ngoài giao dịch không có gì chạy. Việc chậm (Calendar, email) do worker đọc `outbox` (thay `afterLock_`, `deferWrite_`, CalendarQueue). Luật 39 thành tự nhiên: dữ liệu đã commit thì không gì đổi kết quả được.
4. **Kết quả API** vẫn `{ ok, reason, message: { vi, en }, data }` (luật 23, 33) để chép lại test và mẫu chữ.
5. **Cấu hình, chữ, mẫu email ở bảng** (`config`, `content`, `email_templates`, `notify_rules`) với mặc định trong code như v8 (luật 13, 32, 33, 34); trang admin có màn sửa thay tab Sheets.

**Lựa chọn kỹ thuật cụ thể (chốt để không bàn lại mỗi sprint):**

| Việc | Chọn | Không chọn, vì |
|---|---|---|
| Next.js | bản ổn định mới nhất tại S0, App Router, TypeScript strict | Pages Router: cũ |
| Giao diện | Tailwind CSS + shadcn/ui, thiết kế đen trắng của 5O | Thư viện nặng (MUI) |
| Kiểm đầu vào | Zod ở mọi Server Action và Route Handler | Tin trình duyệt |
| Database | SQL migration trong `supabase/migrations`, kiểu sinh bằng `supabase gen types` | ORM (Prisma, Drizzle): thêm một lớp phải học; cân nhắc lại khi đội có người viết code |
| Giao dịch | hàm `withTx` dùng `pg` (node-postgres) qua Supabase connection pooler (transaction mode) | PostgREST của supabase-js: không có giao dịch nhiều câu |
| Đăng nhập | Supabase Auth: link email cho mọi vai trò, Google cho admin; cookie qua `@supabase/ssr` | Tự viết lại AUTH như v8 (BL72 nếu anh muốn giữ hạn link theo vai trò) |
| Việc nền | Vercel Cron gọi `/api/jobs/*` + bảng `outbox`, `job_runs` | pg_cron trong Supabase: khó debug; Inngest, Trigger.dev: thêm dịch vụ |
| Email | Resend SDK, webhook `email.delivered`, `email.bounced`, `email.complained` | |
| Calendar | `googleapis` với service account và uỷ quyền toàn miền trên admin@ (một lần cài ở Admin Console) | OAuth tay của admin@: token hết hạn khi đổi mật khẩu |
| Lỗi, log | Sentry (Next.js SDK), log cấu trúc JSON | |
| Thử tải | k6 chạy trên staging, kịch bản chép từ `loadtest/` | |
| Test | Vitest (core, server), Playwright (3 cổng), Postgres thật trong CI | jsdom giả lập như `test/ui.js` |

## 4. Mô hình dữ liệu Postgres (ánh xạ từ `src/Schema.gs`)

Mã cũ (`S0001`, `T001`, `SP00012`, `BK000123`, `AV000045`) **giữ nguyên ở cột `code`** duy nhất, vì: học viên và tutor quen, email và Calendar đã ghi mã, `lessonEventId_` suy từ mã buổi nên v9 cập nhật đúng sự kiện Calendar cũ không tạo trùng. Khoá chính kỹ thuật là `bigint identity`. Mã mới sinh bằng sequence theo tiền tố (`ID_FORMAT` v8), không bao giờ cấp lại số cũ (luật 46, ID_FLOOR_).

| Bảng v9 | Từ tab v8 | Điểm chính |
|---|---|---|
| `profiles` | USERS | `role` enum (STUDENT, TUTOR, ADMIN), `email citext UNIQUE`, `status` enum, `lang`, `marketing_opt_out`, `color_id`, `meet_room`, `rate_vnd`, liên kết `auth.users.id` khi người đó đã đăng nhập lần đầu. Số điện thoại lưu `E.164` hoặc nguyên văn như luật 16 (hàm `normalizePhone` chuyển sang core) |
| `packages` | PACKAGES | `type` enum (DAYS, SESSIONS), `CHECK (days > 0 OR sessions > 0)`, `active`, `price_vnd`; giá 0 vẫn là "liên hệ Zalo" (5K) |
| `registrations` | REGISTRATIONS | `kind`, `admin_action`, ảnh chuyển khoản là đường dẫn trong Storage bucket riêng tư |
| `student_packages` | STUDENT_PACKAGES | `status` enum (INACTIVE, ACTIVE, QUEUED, EXPIRED), `start_date`, `end_date`, `start_date_locked`, `start_booking_id`, `suspended_days`, `comp_days`, `comp_days_admin`; `CHECK (end_date >= start_date)`; chỉ mục `(student_id, status)` |
| `payments` | PAYMENTS | chỉ ghi thêm: trigger `BEFORE UPDATE OR DELETE` ném lỗi (luật 10) |
| `availability` | AVAILABILITY | `slot time`, `status` enum (OPEN, CANCEL_PENDING, CANCELLED, BLOCKED); `UNIQUE (tutor_id, date, slot)` |
| `bookings` | BOOKINGS | `status` enum 11 giá trị như `BOOKING_STATUS`; `request_id UNIQUE`; `tech_fault` enum; cột Calendar `event_id`, `meet_link`, `cal_state`; **chỉ mục duy nhất một phần** `(tutor_id, date, slot) WHERE status IN (HOLDING_STATUSES)` và `(student_id, date) WHERE status IN (CONSUMING_STATUSES)` (khi `MAX_BOOKINGS_PER_DAY` giữ 1; nếu anh đổi thành nhiều hơn thì kiểm trong giao dịch thay cho chỉ mục); không xoá (trigger như payments, chỉ đổi trạng thái) |
| `activity_log` | ACTIVITY_LOG | chỉ ghi thêm, `detail jsonb`, chỉ mục `(time)`, `(entity, entity_id)`; con trỏ phân trang `(time, id)` thay `{ ts, sig, n }` |
| `mail_log` | MAIL_LOG | thêm `provider_id`, `delivered_at`, `bounced_at`, `complained_at` (webhook Resend); `kind` giữ `MKT:<mã>` cho sổ chống gửi trùng marketing |
| `notifications`, `notify_rules` | NOTIFICATIONS, NOTIFY_RULES | như v8, `read boolean` |
| `config`, `meta` | CONFIG, META | `value text`, mặc định trong `packages/core/config.ts`; `cfg()` ép kiểu theo khai báo (hết luật 22) |
| `content`, `email_templates`, `marketing_emails` | CONTENT, EMAIL_TEMPLATES, MARKETING_EMAILS | như v8; quy ước "trống = mặc định, `-` = cố ý trống" (luật 34) giữ để admin không học lại |
| `metrics` | METRICS | có thể bỏ, Sentry và Vercel đo thay; giữ nếu anh muốn báo cáo riêng |
| `outbox` | (afterLock_, deferWrite_, CalendarQueue, LOGQ_) | `kind` (MAIL, CALENDAR_CREATE, CALENDAR_UPDATE, CALENDAR_CANCEL, NOTIFY), `payload jsonb`, `run_after`, `attempts`, `last_error`, `done_at`; worker lấy bằng `FOR UPDATE SKIP LOCKED` |
| `idempotency_keys` | (idem_ trong CacheService) | `(scope, rid) UNIQUE`, `response jsonb`, hết hạn 24 giờ |
| `job_runs`, `job_marks` | (HB_, DONE_ trong Script Properties) | lượt chạy cron và dấu "đã làm việc tuần này" |
| `login_links` | AUTH | chỉ cần nếu chọn BL72 phương án giữ hạn link theo vai trò; mặc định dùng Supabase Auth, không có bảng này |

Cột sinh từ công thức (`contact_link`, HYPERLINK) không còn: trang web dựng link Zalo lúc hiển thị.

## 5. Ánh xạ 57 luật `CLAUDE.md` sang v9

### 5.1 Luật giữ nguyên nghĩa, đổi cơ chế

| Luật v8 | Cơ chế v9 |
|---|---|
| 1, 2, 3, 4 (getNow_, ngày nửa đêm, tháng từ 0, timezone) | `clock` truyền vào core; kiểu `date` và `time` của Postgres; mọi so sánh ngày bằng chuỗi `YYYY-MM-DD`; `SIM_NOW` của STAGING thành biến môi trường `SIM_NOW` chỉ nhận ở staging |
| 5, 25, 42, 53 (khoá, gom ghi, ghi theo số hàng, mở lại DB trong khoá) | một giao dịch `withTx`; khoá dòng `FOR UPDATE`; không còn số hàng |
| 6, 24, 35, 36, 37 (requireRole_, hàm công khai, phiên, link, endpoint công khai) | `requireRole(role)` ở đầu mọi Server Action và Route Handler (test quét như I12); Supabase Auth; endpoint công khai (đăng ký, xin link) có rate limit theo IP và email trong bảng `rate_limits` hoặc Vercel WAF, không ghi gì khi đầu vào sai |
| 8, 23, 27, 39 (ném lỗi, apiWrap_, email không ném, pha sau không đổi kết quả) | `apiWrap` ghi Sentry và trả `{ ok: false, reason: 'INTERNAL' }`; mọi pha sau qua `outbox` |
| 10, 11, 45, 52 (không xoá, ACTIVITY_LOG, logAppend_, logMenu_) | trigger chống xoá; `activity_log` ghi trong cùng giao dịch, hết chuyện hàng chờ LOGQ_ |
| 12, 19, 27, 32, 51 (email lô, sendMail_, mẫu, marketing) | `sendTpl(key, to, vars)` ghi một dòng `outbox` kind MAIL; worker gọi Resend; gom lô như v8; marketing là job đọc `marketing_emails` |
| 13, 22, 34 (cfg_, cột text, trống và `-`) | `cfg()` có kiểu; không còn ô Sheets |
| 17, 18, 20, 29 (Calendar: hàng đợi, không ghi email học viên, guestsCanSeeOtherGuests, admin khách Meet) | `outbox` kind CALENDAR_*; `lessonEventId` giữ nguyên công thức; cùng tham số `sendUpdates`, `guestsCanSeeOtherGuests: false` |
| 31, 33, 50 (notify_, T.t song ngữ, ngôn ngữ người dùng) | `notify()` ghi `notifications` + `outbox`; i18n đọc từ `content` với mặc định trong code; `profiles.lang` |
| 40 (rid, idem_) | `idempotency_keys` + `request_id UNIQUE`; trình duyệt vẫn gửi `rid` |
| 41 (bộ đệm) | cache của Next.js (`revalidateTag`) cho slot công khai; mọi quyết định ghi đọc trong giao dịch |
| 43 (điện thoại và 900px) | giữ, test Playwright hai cỡ |
| 47 (bảo trì OFF, READONLY, CLOSED) | `config.MAINTENANCE_MODE` đọc ở middleware; admin không bị chặn |
| 49 (phát hành, health) | GitHub Actions, migration; `/api/health` đọc `job_runs` |
| 54, 55, 57 (gói theo ngày, lịch tutor, khoá tutor) | chuyển nguyên hàm thuần `pkgPlan_`, `recomputeCompFor_`, `tutorWeekDeadline_`, `lockTutor_` sang core với cùng test |
| 56 (menu gọn, link rút gọn) | trang admin thay menu; `SHORT_URL_*` giữ ở `config` |

### 5.2 Luật mới của v9

* Không gọi database ngoài `withTx` hoặc `db.read`; không có service role ở phía client; test quét `apps/web` tìm `createClient(` sai chỗ.
* Mọi migration có bước `down` hoặc ghi rõ "không quay lại được" và cách sao lưu trước.
* Mỗi job có `job_runs` và có thể chạy lại không tạo trùng (idempotent), như hàng đợi Calendar v8.
* Không bao giờ ghi dữ liệu cá nhân vào Sentry (dùng `beforeSend` xoá email, số điện thoại).

### 5.3 Của v8 không chuyển (Postgres và máy chủ thật lo)

`DbTable`, `purgeRows_`, `purgeRecover_`, `appendRowsRaw_`, lưu trữ sang file theo năm (Archive.gs; thay bằng chính sách giữ nhật ký 12 tháng nếu muốn), `onEdit` trả lại ô hệ thống và `pkgHealAllInLock_` (không ai sửa tay), SystemMove.gs (thay bằng script nhập Sheets → Postgres một lần), Reset.gs (staging có lệnh `supabase db reset`), Release.gs sao lưu Releases, LoadTest.gs `doPost` (k6 gọi thẳng API staging bằng tài khoản `@loadtest.invalid`), `companion/` đăng nhập Google, `dist/` và `build_dist.js`, `MAIL_TRANSPORT` MAILAPP, GMAILAPP (chỉ còn Resend; muốn dự phòng thì thêm SES sau).

## 6. Repo, môi trường, CI/CD

**Repo mới `thaiput_v9`** (giữ repo v8 nguyên làm bản đặc tả và để sửa lỗi v8 tới khi đóng):

```
apps/web/            Next.js (app/, components/, server/ (actions, jobs, webhooks), lib/)
packages/core/       luật thuần: time, slots, packages, compensation, assign, phone, content, templates, config
packages/db/         withTx, truy vấn có kiểu, kiểu sinh từ Supabase
supabase/            config.toml, migrations/*.sql, seed.sql (dữ liệu test), policies.sql
scripts/             import_sheets.ts (nhập từ v8), shadow_compare.ts (chạy bóng), export_sheets.ts (xuất xem)
tests/               core (Vitest, kèm 40 kịch bản), server (Postgres thật), e2e (Playwright), load (k6)
docs/                đặc tả chép từ v8 (01, 03), hướng dẫn vận hành v9, sổ tay sự cố
CLAUDE.md, PROGRESS.md, BACKLOG.md, NEXT.md
```

**Ba môi trường:**

| | Local | Staging | Production |
|---|---|---|---|
| Database | `supabase start` (Docker) | dự án Supabase riêng | dự án Supabase riêng (Pro) |
| Web | `next dev` | Vercel, nhánh `staging`, tên miền `staging.<tên miền>` | Vercel, nhánh `main`, tên miền chính |
| Email | Resend chế độ test (không gửi thật) hoặc hộp thư giả | Resend tên miền phụ `staging-mail.` chỉ gửi tới `@<tên miền>` và danh sách cho phép | Resend `mail.<tên miền>` |
| Calendar | giả lập | lịch thử trên admin@ | `LESSON_CALENDAR_ID` thật |
| Đăng nhập | tài khoản seed | thật | thật |

**GitHub Actions trên mỗi PR:** lint, typecheck, Vitest core và server (khởi động Postgres bằng `supabase start`), Playwright trên bản build, `supabase db diff` để chắc migration khớp. **Merge vào `staging`:** Vercel deploy, workflow chạy `supabase db push` lên staging. **Merge vào `main`:** workflow chờ duyệt tay (environment protection của GitHub) rồi `db push` production và Vercel deploy. Bí mật chỉ ở GitHub Secrets, Vercel và Supabase, không bao giờ trong repo (quy ước 6 của v8).

## 7. Chuyển dữ liệu, chạy bóng, cắt chuyển (chi tiết S1, S12 đến S15)

**Nhập (`scripts/import_sheets.ts`):** đọc file Sheets v8 bằng Google Sheets API (service account chỉ đọc), ánh xạ cột theo tên, chuẩn hoá (ngày nửa đêm → `date`, giờ `'08:00'` → `time`, số điện thoại qua `normalizePhone`, `TRUE/FALSE` → boolean), upsert theo `code` (chạy lại không nhân đôi, như luật của SystemMove), ghi báo cáo đếm từng bảng và tổng kiểm (số buổi theo trạng thái, tổng tiền PAYMENTS, số gói ACTIVE) so với số đếm trên Sheets. Dòng không hợp lệ ghi vào `import_issues`, không bỏ qua im lặng (luật 8). Nhập cả file lưu trữ theo năm để nhật ký liền mạch.

**Chạy bóng 14 đêm (S12, S13):** mỗi đêm nhập lại bản sao v8, rồi `shadow_compare.ts` tính trên v9 và so với v8: hạn gói từng học viên (`pkgPlan`), slot còn trống 14 ngày tới cho từng tutor, báo cáo lương tháng, danh sách buổi cần nhắc hôm sau. Chênh lệch ghi ra bảng để Codex đọc, Gemini tổng hợp. Điều kiện: 7 đêm liền không chênh (giữ nguyên bản 01/11).

**Cắt chuyển (S15, cuối tuần, 3 giờ):**

1. v8 bật `MAINTENANCE_MODE = READONLY` (đã có ở 5G), tắt 8 trigger bằng menu 3 (hướng dẫn chunk 6).
2. Nhập lần cuối, kiểm đếm, chạy `shadow_compare` lần cuối phải bằng 0.
3. Đổi DNS tên miền sang Vercel; Google Sites giữ trang thông báo có link mới.
4. Bật cron v9, gửi email song ngữ "hệ thống mới, đăng nhập lại" cho ACTIVE (mẫu NEW_SYSTEM).
5. Sự kiện Calendar đang có: không tạo lại; v9 chỉ cập nhật khi buổi đổi (cùng `lessonEventId`).
6. v8 giữ READONLY 30 ngày; quay lại = đổi DNS về Sites, tắt bảo trì, bật trigger. Không xoá file Sheets, file lưu trữ, Releases trong 12 tháng.

## 8. Lộ trình sprint (giữ S0 đến S16 của bản 01/11, thêm việc cụ thể)

Thời gian như bản 01/11: 16 tuần với Claude Max, 20 đến 24 tuần với Pro. Vai trò: Claude viết, Codex soát và thử phá, Gemini đọc dài và viết chữ. Mỗi sprint kết thúc bằng bản chạy trên staging và một dòng `PROGRESS.md`.

| Sprint | Việc cụ thể | Test chép từ v8 | Điều kiện xong |
|---|---|---|---|
| **5R** (trước v9, trong v8) | Email Resend (mục 2) | U mới, I133 mở rộng | 1.500 thư mỗi ngày trên PRODUCTION, 5 hộp thư nhận được |
| **S0** | Tài khoản Supabase, Vercel, Resend, Sentry, Better Stack; repo v9 theo mục 6; CI chạy test rỗng; `CLAUDE.md` v9 (chép luật mục 5); đo hạn mức 3 công cụ | | Trang "Xin chào" trên `staging.<tên miền>`, CI xanh |
| **S1** | Migration đầy đủ mục 4, RLS, trigger chống xoá, sequence mã; `import_sheets.ts`; kiểu sinh | Kiểm ràng buộc bằng dữ liệu bẩn (Codex) | Nhập đủ v8, số đếm khớp, chỉ mục duy nhất chặn trùng slot |
| **S2, S3** | Chuyển core: Time, Phone, Packages (`pkgPlan_`, `pkgDailyTransition_`, `pkgPlanNewPurchase_`), Compensation, Assign (`buildTutorCandidates_`, `pickTutor_`), trạng thái buổi, `tutorSchedule_`; `config` mặc định; `content` và `email_templates` mặc định chuyển nguyên | `test/unit.js` (34, hiện thiếu trong repo, mục 11), `scenarios.js` 46 kịch bản | 46 kịch bản xanh trên core v9 |
| **S4** | Supabase Auth: link email, Google; `profiles` liên kết; `requireRole`; cookie; đăng xuất mọi thiết bị; rate limit đăng ký và xin link; trang chọn ngôn ngữ lần đầu | I về phiên, DISABLED, link hết hạn | Test chứng minh học viên không đọc được dữ liệu người khác (cả qua API lẫn RLS) |
| **S5, S6** | Cổng học viên: trang chủ gói, lưới slot 14 ngày, đặt nhiều ngày trong một giao dịch, huỷ, gia hạn, hồ sơ, song ngữ, `rid` | I đặt và huỷ (I1 đến I40 nhóm đặt), UI 48 chuyển sang Playwright | Đặt, huỷ đúng luật trên điện thoại và 900px; hai người đặt cùng slot thì một thành công |
| **S7** | Cổng tutor: giờ rảnh theo tuần, xin huỷ, xác nhận kết quả (một và nhiều), thống kê | I nhóm tutor | Hạn tuần `tutorWeekDeadline` đúng |
| **S8, S9** | Trang admin thay mọi menu và dropdown Sheets: duyệt đăng ký và thanh toán (ảnh từ Storage), người dùng (khoá tutor, tạm khoá, đổi tutor), buổi (kết quả, lỗi kỹ thuật, bù), gói (sửa `comp_days_admin`), duyệt tutor huỷ, thông báo, nhật ký có con trỏ, CONFIG, CONTENT, EMAIL_TEMPLATES, marketing, báo cáo lương, bảo trì, kiểm tra gửi email | I nhóm admin (AdminApi), I106 quét `ad.act.*` | Làm được mọi việc của `HUONG_DAN_VAN_HANH.md` Phần C và I |
| **S10** | `outbox` worker; Resend SDK + webhook; Calendar API với service account, `lessonEventId`, khách mời, Meet, admin khách `sendUpdates: 'none'`; cron: reminder 15 phút, hourly, daily 06:00, outbox mỗi phút; nhắc tutor và học viên theo tuần | I nhóm CalendarQueue, Jobs, Notify | Email Delivered trên webhook; Meet tạo đúng trên lịch thử; chạy lại job không tạo trùng |
| **S11** | `activity_log` đầy đủ, `job_runs`, `/api/health`, Sentry, Better Stack, `pg_dump` đêm lên Drive, chính sách giữ nhật ký, trang trạng thái nội bộ | | Báo động tới admin trong 5 phút khi cron ngừng |
| **S12, S13** | Chạy bóng 14 đêm (mục 7) | `shadow_compare` | 7 đêm liền không chênh |
| **S14** | k6 trên staging theo `HUONG_DAN_THU_TAI.md`; **soát bảo mật bởi người thật** thuê theo giờ (OWASP Top 10, RLS, rate limit, bí mật); sửa | | Không lỗi mức CAO; p95 xem slot dưới 1 giây, đặt dưới 2 giây ở 50 người đồng thời |
| **S15** | Cắt chuyển (mục 7) | | Mọi người đăng nhập được, buổi tuần đầu có Meet, email tới |
| **S16+** | Chăm sóc, đóng v8 sau 30 ngày, viết sổ tay sự cố, bàn giao đồng sáng lập thứ hai | | 2 tuần không lỗi CAO |

## 9. Vận hành chuyên nghiệp (những gì v8 chưa có)

1. **Giám sát và báo động:** Better Stack gọi `/api/health` mỗi phút (OK, STALE như 5G); Sentry gửi email khi có lỗi mới; `notify_` giữ NOTIFY_RULES; Resend báo bounce rate trên 2% là ngừng marketing tự động.
2. **Phát hành theo chuyến:** mỗi tuần một lần ngày cố định (như chunk 8), phiên bản `9.x.y` trong `package.json` và bảng `meta`, CHANGELOG song ngữ, mỗi PR một việc, review bởi Codex trước merge.
3. **Sao lưu và khôi phục:** sao lưu hằng ngày của Supabase + `pg_dump` lên Drive; **tập khôi phục thử mỗi quý** vào staging (v8 chưa từng thử khôi phục).
4. **Sổ tay sự cố một trang** (từ mục GĐ3 của tư vấn 16/10): cron ngừng, Resend từ chối, Calendar hết hạn mức, Supabase tạm dừng, Vercel lỗi deploy; mỗi mục: dấu hiệu, lệnh kiểm, cách tạm, ai gọi.
5. **Tài khoản và bí mật:** mọi dịch vụ đăng ký bằng admin@, bật xác thực 2 bước, bí mật xoay 6 tháng, ghi danh sách dịch vụ và chủ sở hữu trong `docs/DICH_VU.md` (không ghi khoá).
6. **Dữ liệu cá nhân:** ghi rõ mục đích và thời hạn lưu trong chính sách học viên (`policy/`), nút xin xoá dữ liệu cho học viên đã nghỉ (ẩn danh hoá, không xoá dòng kế toán), kiểm với Nghị định 13/2023 về bảo vệ dữ liệu cá nhân trước S15 (nhờ người thật, không tự kết luận).
7. **Tài liệu:** 4 hướng dẫn v8 viết lại cho v9 (Gemini), có hình; `CLAUDE.md` v9 giữ cấu trúc "luật không được phá" để Claude Code làm tiếp.
8. **Người thứ hai:** đồng sáng lập thứ hai làm được toàn bộ Phần H "việc hằng ngày" của hướng dẫn vận hành trên trang admin mà không mở Sheets; kiểm ở S16.

## 10. Chi phí hằng tháng (kiểm 11/2026, chưa gồm Workspace và tên miền đang trả)

| Khoản | Từ khi nào | USD mỗi tháng |
|---|---|---|
| Resend Pro | bước 0 (5R), chỉ khi cần trên 100 thư mỗi ngày | 20 |
| Supabase Pro (1 dự án production; staging có thể Free nhưng tự dừng sau 1 tuần không dùng) | S0 | 25 (PITR thêm nếu chọn, BL76) |
| Vercel Pro (1 ghế) | S0 | 20 |
| Sentry, Better Stack | S11 | 0 (gói free đủ) |
| Soát bảo mật người thật | S14, một lần | 300 đến 800 một lần |
| 3 công cụ AI trong lúc xây | S0 đến S16 | 60 (Pro) hoặc 140 đến 240 nếu nâng Claude lên Max |

Tổng hạ tầng chạy thật sau S15: khoảng 65 USD mỗi tháng. Trong lúc xây thêm 60 đến 240 USD mỗi tháng tiền công cụ.

## 11. Rủi ro và cách giảm

| Rủi ro | Giảm |
|---|---|
| `test/unit.js` (34 test hàm thuần) **không có trong repo GitHub**: `npm test` hiện đỏ ngay dòng nạp; `test/harness.js:21` | Việc ngay: lấy lại từ bundle `TEST_BUNDLE.txt` hoặc project claude.ai cũ, đưa vào repo trước 5R; GitHub Actions hiện cũng đỏ vì chuyện này |
| Hạn mức AI làm sprint kéo dài, dở dang giữa chừng | `NEXT.md` một dòng mỗi cửa sổ; không dừng khi test đỏ; dừng ở 80% trần tuần |
| Hai hệ thống cùng gửi email và mời Calendar trong lúc chạy bóng | v9 staging chặn gửi ra ngoài (danh sách cho phép ở Resend, Calendar lịch thử); v8 vẫn là nguồn tới S15 |
| Supabase Auth không có hạn link theo vai trò như luật 36 | BL72: chấp nhận một hạn chung (15 phút) hoặc giữ bảng `login_links` tự viết; đề xuất chấp nhận |
| Service account Calendar cần Admin Console uỷ quyền toàn miền (bước admin, dễ sai) | Hướng dẫn có hình ở S10; phương án dự phòng OAuth admin@ với refresh token |
| Resend tên miền mới bị coi là spam tuần đầu | Warm up 2 tuần ngay ở 5R (sớm hơn v9 nhiều tháng), DMARC `p=none` rồi `quarantine` |
| Một người hiểu hệ thống | Mục 9.8; sổ tay sự cố; mỗi sprint Gemini cập nhật hướng dẫn |

## 12. Quyết định cần anh chốt (ghi BACKLOG BL70 đến BL78)

| Mã | Câu hỏi | Đề xuất |
|---|---|---|
| BL70 | Dịch vụ email bước 0: Resend, Postmark hay SES | Resend Pro |
| BL71 | Làm 5R khi nào: ngay sau 5N, 5O (trước chunk 6) hay sau go live chunk 7 | Ngay sau 5N, 5O: go live đã có hạn mức rộng |
| BL72 | Đăng nhập v9: Supabase Auth (hạn link chung) hay giữ link theo vai trò tự viết | Supabase Auth |
| BL73 | Repo v9 tách riêng hay thư mục trong repo v8 | Tách riêng |
| BL74 | Ảnh chuyển khoản: Supabase Storage hay giữ Drive | Storage |
| BL75 | Giữ bảng `metrics` hay dùng Sentry và Vercel | Bỏ, dùng Sentry |
| BL76 | Supabase PITR (thêm phí) hay chỉ sao lưu ngày + `pg_dump` | Sao lưu ngày + `pg_dump` ở giai đoạn đầu |
| BL77 | Nâng Claude lên Max trong các tháng xây v9 | Có, nếu muốn 16 tuần |
| BL78 | Sửa dòng "không thêm máy chủ ngoài" trong `CLAUDE.md` v8 khi nào | Khi vào S0, trong repo v9; repo v8 giữ nguyên |

## 13. Việc làm được ngay, không chờ chốt

1. Đưa `test/unit.js` về repo, GitHub Actions xanh lại.
2. Đăng ký Resend bằng admin@, thêm `mail.<tên miền>`, chờ Verified (không tốn tiền, không đổi code).
3. Gemini đọc `docs/01`, `docs/03`, `src/Packages.gs`, `src/Compensation.gs`, `src/Time.gs`, `src/Assign.gs`, `src/Phone.gs` và viết "bản luật cho v9" (đặc tả S2, S3) ngay từ bây giờ; file này cũng là đầu ra của chunk 9.
4. Đọc lại `KE_HOACH_SAU_GO_LIVE.md` mục 3 (luật hạn mức 5 giờ) và bắt đầu tuần đo S0 khi có hiệu lệnh.

## 14. Nguồn

* `plan/KE_HOACH_SAU_GO_LIVE.md` (01/11, đã duyệt), `archive/TU_VAN_VA_KIEN_TRUC.md` mục 4 và 7, `CLAUDE.md` 57 luật, `src/Schema.gs`, `src/MailTransport.gs`, `BACKLOG.md` BL31, BL64 đến BL69.
* [Resend pricing](https://resend.com/pricing), [Resend: gửi email bằng HTTP API](https://resend.com/docs/api-reference/emails/send-email), [Resend webhooks](https://resend.com/docs/dashboard/webhooks/introduction)
* [Supabase pricing](https://supabase.com/pricing), [Supabase connection pooler và giao dịch](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase Auth với Next.js (`@supabase/ssr`)](https://supabase.com/docs/guides/auth/server-side/nextjs)
* [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs), [Vercel pricing](https://vercel.com/pricing)
* [Google Calendar API: uỷ quyền toàn miền cho service account](https://developers.google.com/workspace/guides/create-credentials#optional_set_up_domain-wide_delegation_for_a_service_account)
* [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)
