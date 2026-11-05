# v9 bản 2: tối ưu hiệu năng trên giá tới tận cùng, kế hoạch tổng và điều phối Claude, Codex, Gemini

*Lập 05/11/2026, trả lời câu hỏi "đã tối ưu performance per price theo chuẩn pro chưa". Trả lời thẳng: **bản 1 (`KE_HOACH_V9_CHI_TIET.md`) chưa.** Nó an toàn cho người không viết code nhưng trả đắt ở 3 chỗ: hosting (gấp 4), email (gấp 4), công cụ AI (thừa 1 gói). Bản này sửa 3 chỗ đó, giữ nguyên phần còn lại của bản 1 (điểm nghẽn, bảng dữ liệu, ánh xạ luật, sprint), và thêm phần điều phối ba công cụ. Giá kiểm 05/11/2026 bằng tìm kiếm web, nguồn ở mục 9; vẫn phải mở trang giá chính thức trước khi đăng ký.*

## 1. Tối ưu chi phí: bảng so sánh thẳng

| Khoản | Bản 1 | Bản 2 (đề xuất) | Tiết kiệm mỗi tháng | Đánh đổi |
|---|---|---|---|---|
| Hosting web | Vercel Pro 20 USD **mỗi ghế** (2 đồng sáng lập vào dashboard = 40) | Cloudflare Workers Paid **5 USD cả tài khoản**, không tính ghế; gồm 10 triệu request, Cron Triggers, KV, Hyperdrive (pool kết nối Postgres), R2 10 GB miễn phí | 15 đến 35 | Next.js trên Cloudflare đi qua bộ chuyển (OpenNext hoặc vinext, Cloudflare khuyên vinext từ 02/2026, còn thực nghiệm). Cần 1 cửa sổ thử ở S0; thất bại thì về Vercel Pro |
| Database | Supabase Pro 25 | **Giữ Supabase Pro 25** cho production (sao lưu ngày, không tạm dừng, Auth, 10 USD compute credit, bật spend cap); **staging dùng dự án Free** (tạm dừng sau 7 ngày không dùng, bấm là chạy lại) | 0 (staging 0 thay vì 25) | Phương án tột cùng: Cloudflare D1 (có sẵn trong 5 USD) + tự viết đăng nhập: tổng 10 USD mỗi tháng nhưng mất Auth, Postgres, sao lưu có sẵn; xem 1.1 |
| Email | Resend Pro 20 (50.000 thư) | **Amazon SES: 0,10 USD mỗi 1.000 thư**; 1.500 thư mỗi ngày = 45.000 thư = khoảng 5 USD; vùng Singapore; không còn tầng miễn phí cho tài khoản mới | 15 | Cài đặt nhiều bước hơn (tài khoản AWS, xin ra khỏi sandbox 1 ngày, DKIM, SNS cho thư trả về); từ Apps Script phải ký SigV4 (khoảng 60 dòng, `Utilities.computeHmacSha256Signature`) |
| Ảnh chuyển khoản | Supabase Storage | Cloudflare R2 (10 GB miễn phí) hoặc Supabase Storage (Pro có 100 GB) | 0 | |
| DNS, chống bot, WAF | Namecheap DNS, tự đếm trong CacheService | DNS chuyển về Cloudflare (miễn phí): WAF, rate limit cơ bản, Turnstile chống bot ở form đăng ký và xin link (thay một nửa luật 37) | 0 | Một lần đổi nameserver |
| Giám sát | Sentry, Better Stack free | Giữ, cộng Workers Logs và Analytics có sẵn | 0 | |
| **Hạ tầng v9 chạy thật** | **65 USD** | **35 USD** (Cloudflare 5 + Supabase 25 + SES 5) | **30** | |
| Công cụ AI lúc xây | Claude Pro 20 + ChatGPT Plus 20 + Google AI Pro 20 = 60 | Claude Pro 20 + ChatGPT Plus 20 + **Gemini CLI miễn phí** (1.000 lượt mỗi ngày với tài khoản Google cá nhân, đủ cho vai đọc dài và viết chữ) = **40** | 20 | Gemini app trong gói AI Pro không cần cho việc này; nếu anh dùng AI Pro cho việc khác thì giữ |
| Nâng Claude Max | tuỳ chọn cả kỳ (+80) | Chỉ nâng Max 5x trong 2 tháng nặng nhất (S4 đến S10), +160 USD một lần | | Max không "rẻ hơn mỗi lượt", chỉ rút ngắn lịch; là quyết định về thời gian, không phải giá |

### 1.1 Ba mức để anh chọn (BL79)

| Mức | Hạ tầng mỗi tháng | Gồm | Hợp với |
|---|---|---|---|
| **Pro gọn (đề xuất)** | 35 USD | Cloudflare Workers + Supabase Pro + SES | Dữ liệu có tiền, cần sao lưu và đăng nhập có sẵn, người không viết code vận hành |
| An toàn tối đa | 65 USD (85 với 2 ghế) | Vercel Pro + Supabase Pro + Resend Pro | Không muốn thử bộ chuyển Cloudflare, muốn dashboard email đẹp |
| Tột cùng | 10 USD | Cloudflare Workers + D1 (SQLite) + SES, tự viết đăng nhập bằng link | Chỉ khi ngân sách là ràng buộc cứng; mất Auth, sao lưu ngày, Postgres, và tự chịu rủi ro đăng nhập (điểm 3 của "nói thẳng") |

Hiệu năng ở quy mô dự kiến (10 tutor, 400 học viên, khoảng 170 buổi mỗi ngày) là như nhau ở cả ba mức; chênh nhau ở độ an toàn và công sức vận hành, không ở tốc độ.

### 1.2 Cái gì KHÔNG nên tiết kiệm

* Sao lưu ngày của Supabase Pro (lý do duy nhất không chọn Free cho production).
* Soát bảo mật bởi người thật một lần trước cắt chuyển (300 đến 800 USD).
* Spend cap Supabase bật; AWS Budget 10 USD có báo động; Cloudflare không có hoá đơn bất ngờ ở mức này.

## 2. Kiến trúc bản 2 (chỉ ghi chỗ khác bản 1)

```
Cloudflare (1 tài khoản, 5 USD)
  ├── Worker "web":   Next.js qua vinext (dự phòng OpenNext), tên miền chính và staging.<tên miền>
  ├── Worker "jobs":  Hono + TypeScript thuần: Cron Triggers (outbox mỗi phút, reminder 15 phút, hourly, daily 06:00),
  │                   webhook SES (SNS: delivered, bounce, complaint), /health
  ├── Hyperdrive:     pool kết nối tới Postgres của Supabase (Workers không giữ kết nối lâu)
  ├── KV:             idempotency ngắn hạn, bộ đệm lưới slot theo tutor và tuần (tag để xoá)
  ├── R2:             ảnh chuyển khoản (bucket riêng tư, link ký thời hạn)
  ├── Turnstile, WAF, rate limiting: form công khai
  └── DNS
Supabase Pro: Postgres + Auth (link email, Google) + sao lưu ngày
Amazon SES (ap-southeast-1): email giao dịch và marketing; SNS → webhook jobs
Google Workspace admin@: Calendar API (service account uỷ quyền toàn miền), gọi bằng fetch + JWT ký WebCrypto, không dùng gói googleapis nặng
Sentry, Better Stack: miễn phí
```

**Vì sao tách Worker "jobs" khỏi Worker "web":** bộ chuyển Next.js trên Cloudflare còn đổi nhanh; việc nền (tiền, email, Calendar) không được phụ thuộc vào nó. Worker jobs là TypeScript thuần, chạy ổn định bất kể web dùng vinext, OpenNext hay chuyển về Vercel. Cả hai dùng chung `packages/core` và `packages/db`.

**Thử nghiệm S0 (1 cửa sổ, quyết định hosting):** (1) dựng Next.js rỗng có Server Action lên Worker web bằng vinext; (2) Worker jobs gọi Postgres Supabase qua Hyperdrive trong giao dịch; (3) tạo 1 sự kiện Calendar bằng JWT ký WebCrypto; (4) gửi 1 thư SES bằng `@aws-sdk/client-sesv2`. Bốn việc xanh thì chốt Cloudflare; việc 1 đỏ sau 1 cửa sổ thì web về Vercel Pro (+20 USD), jobs vẫn ở Cloudflare.

**Hiệu năng kỹ thuật (mục tiêu đo ở S14):** p95 xem lưới slot dưới 500 ms (KV cache 60 giây theo tutor và tuần, xoá khi có booking), p95 đặt dưới 1,5 giây (1 giao dịch, 2 lần đi tới Postgres), 50 người đặt cùng lúc không lỗi bận (khoá dòng thay khoá toàn cục), cron lệch dưới 1 phút. Chỉ mục: `bookings (tutor_id, date, slot)`, `bookings (student_id, date)`, `student_packages (student_id, status)`, `outbox (run_after) WHERE done_at IS NULL`.

## 3. Email: làm SES ngay ở 5R, không đi vòng qua Resend

Bản 1 đề xuất Resend ở 5R rồi có thể đổi SES ở v9: trả 20 USD mỗi tháng và chuyển hai lần. Bản 2: **SES một lần, dùng từ 5R tới hết v9**.

| Bước | Ai | Thời gian |
|---|---|---|
| Tạo tài khoản AWS bằng admin@, bật MFA, AWS Budget 10 USD có email báo | anh Chris | 30 phút |
| SES vùng ap-southeast-1: Verified identity cho `mail.<tên miền>` (Easy DKIM 3 bản ghi CNAME + MAIL FROM `bounce.mail.<tên miền>` 2 bản ghi), DMARC `p=none` | anh Chris, DNS ở Namecheap hoặc Cloudflare | 30 phút, chờ xác minh tới 72 giờ |
| Xin ra khỏi sandbox: ghi mục đích "thư xác nhận và nhắc lịch học cho học viên đã đăng ký, có opt out", ước 2.000 thư mỗi ngày | anh Chris | 1 ngày chờ |
| IAM user chỉ quyền `ses:SendEmail` cho identity đó; khoá vào Script Properties `SES_KEY`, `SES_SECRET` | anh Chris | 10 phút |
| `MailTransport.gs`: transport `SES`, ký SigV4 (hàm thuần `sesSign_` có test với vector mẫu của AWS), gọi `UrlFetchApp` tới `email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails`; lỗi thì tự gửi lại GmailApp + MAIL_FALLBACK; `mailBudget_` = `MAIL_DAILY_CAP` trừ số MAIL_LOG hôm nay transport SES; I133 quét thêm `amazonaws.com` | Claude | 2 cửa sổ |
| Thư trả về trong v8: SNS topic → đăng ký email tới admin@ (không cần webhook, luật 48); v9 nhận SNS qua Worker jobs | anh Chris | 10 phút |
| Kiểm 5 loại hộp thư (BL69), warm up: ngày đầu 200 thư, tăng gấp đôi mỗi 2 ngày | anh Chris | 1 tuần |

Dự phòng nếu AWS từ chối ra khỏi sandbox (hiếm với mục đích rõ): Resend Pro 20 USD theo bản 1, cùng chỗ cắm, đổi 1 ô CONFIG.

**Giảm số thư gửi (đòn bẩy sản phẩm, BL80):** hiện mỗi buổi có thư nhắc riêng cộng thư buổi sáng; thêm ô CONFIG `REMINDER_MODE = PER_LESSON | MORNING_ONLY` cho học viên có nhiều buổi mỗi tuần, giảm khoảng 40% thư. Không bắt buộc, SES rẻ nên có thể để nguyên.

## 4. Kế hoạch tổng (gắn với lộ trình v8)

| Giai đoạn | Thời gian (ước, Claude Pro) | Việc | Điều kiện sang giai đoạn sau |
|---|---|---|---|
| **P0 · Trong v8** | 11 đến 12/2026, xen kẽ chunk 6, 7 | Lấy lại `test/unit.js`, thêm `.gitignore`, GitHub Actions cho v8; **5R email SES**; `AGENTS.md` dùng chung 3 công cụ (mục 5); đăng ký Cloudflare, Supabase, AWS, Sentry (chưa trả tiền); Gemini viết "bản luật v9" từ file 01, 03 và hàm thuần | v8 PRODUCTION chạy ổn 2 tuần (chunk 8); bản luật v9 anh duyệt |
| **P1 · Nền** | 01/2027, 4 tuần (S0 đến S3) | Thử nghiệm S0 chốt hosting; repo v9; migration; `import_sheets`; core TypeScript + 46 kịch bản | 46 kịch bản xanh; nhập đủ dữ liệu v8 |
| **P2 · Sản phẩm** | 02 đến 03/2027, 8 tuần (S4 đến S9) | Đăng nhập; cổng học viên; cổng tutor; trang admin | Mọi việc của hướng dẫn vận hành làm được trên web |
| **P3 · Nền tảng** | 04/2027, 3 tuần (S10, S11) | Worker jobs: outbox, SES, Calendar, cron; giám sát, sao lưu, health | Email Delivered qua SNS; Meet tạo đúng; báo động trong 5 phút |
| **P4 · Chạy bóng và cắt chuyển** | 05/2027, 5 tuần (S12 đến S15) | 14 đêm so sánh; k6; soát bảo mật người thật; cắt chuyển cuối tuần | 7 đêm không chênh; không lỗi CAO |
| **P5 · Chăm sóc** | 06/2027 | Đóng v8 sau 30 ngày; sổ tay sự cố; bàn giao đồng sáng lập thứ hai | 2 tuần không lỗi CAO |

Tổng khoảng 22 tuần từ 01/2027 với Claude Pro; nâng Max trong P2 và P3 thì khoảng 16 tuần, cắt chuyển cuối 04/2027. Điều kiện bắt đầu P1 giữ như bản 01/11: v8 ổn định hoặc chạm ngưỡng; P0 làm được ngay vì không đụng v8 đang chạy (trừ 5R, là một sub chunk bình thường của v8).

## 5. Điều phối ba công cụ: một repo, một luật, ba làn

### 5.1 Nguyên tắc

1. **GitHub là bus điều phối duy nhất.** Không chat chuyển tay giữa công cụ. Việc = Issue; kết quả = PR; nhận xét = review trên PR. Người duy nhất bấm Merge là anh Chris.
2. **Một file luật cho cả ba:** `AGENTS.md` ở gốc repo (Codex đọc tên này mặc định). `CLAUDE.md` chỉ chứa một dòng `@AGENTS.md` (Claude Code nạp file nhập). Gemini CLI đặt `context.fileName = "AGENTS.md"` trong `.gemini/settings.json`. Sửa luật một chỗ, ba công cụ cùng thấy.
3. **Mỗi công cụ một làn, không giẫm file nhau cùng lúc:**

| | Claude Code | Codex (ChatGPT Plus) | Gemini CLI (miễn phí) |
|---|---|---|---|
| Vai | Thợ chính: code, test, migration | Người soát độc lập: review PR, thử phá, viết test đột biến | Người đọc dài và viết chữ: so đặc tả, tài liệu, song ngữ, mẫu email, hướng dẫn |
| Được sửa | `apps/`, `packages/`, `supabase/`, `tests/` | chỉ `tests/` (thêm test phá) trong PR riêng | chỉ `docs/`, `content/` (chữ song ngữ, mẫu email mặc định), `*.md` |
| Không được | merge; sửa luật trong `AGENTS.md` khi chưa có Issue | sửa code sản phẩm | sửa code, test |
| Cách gọi | phiên Claude Code trên cloud (như phiên này), nhánh `claude/<việc>` | Codex cloud nối GitHub: review tự động mỗi PR, hoặc bình luận `@codex review` ; Codex CLI tại máy cho thử phá | `gemini` tại máy hoặc GitHub Action hằng đêm (free tier 1.000 lượt mỗi ngày) |
| Kiểm được bằng CI | CI kiểm Claude PR không đụng `docs/` quá 20% dòng | CI kiểm Codex PR chỉ đụng `tests/` | CI kiểm Gemini PR chỉ đụng `docs/`, `content/`, `*.md` |

4. **Một cửa sổ Claude = một PR dưới 300 dòng, test xanh mới kết thúc.** `NEXT.md` ghi việc kế tiếp một dòng, file liên quan, test phải xanh (giữ luật 3 của bản 01/11).
5. **Việc lớn (đổi luật nghiệp vụ, đăng nhập, tiền, dữ liệu):** Codex review bắt buộc + 1 PR test phá trước khi anh merge. Việc nhỏ: CI xanh là đủ.

### 5.2 Vòng đời một việc

```
Issue (anh Chris hoặc Claude ở phiên kế hoạch, theo bảng sprint)
  → Claude Code: nhánh, code + test, PR nháp, tự theo dõi PR (như đang làm với PR #2)
  → CI: typecheck, Vitest core, Vitest server trên Postgres thật (supabase start), Playwright, kiểm làn
  → Codex: review tự động trên PR; Claude sửa theo review; lặp tới khi Codex không còn mục đỏ
  → (việc lớn) Codex CLI mở PR "tests: thử phá <việc>" vào nhánh của Claude; Claude sửa cho xanh
  → Gemini (hằng đêm): đọc diff ngày, đối chiếu docs/SPEC_V9.md, mở PR docs nếu lệch; cập nhật hướng dẫn vận hành
  → anh Chris merge vào staging → tự deploy staging → anh thử 10 phút theo checklist của Issue
  → cuối tuần: PR staging → main (production), workflow chờ anh duyệt migration
```

### 5.3 MCP và quyền cho từng công cụ

| MCP | Claude Code | Codex | Gemini | Ghi chú |
|---|---|---|---|---|
| GitHub (đang có) | đọc, tạo PR, bình luận | review, bình luận | tạo PR docs | Không công cụ nào có quyền merge |
| Supabase MCP `read_only=true`, `project_ref` = staging | có | có | không | Chỉ staging; Supabase ghi rõ MCP là công cụ phát triển, không trỏ vào production |
| Cloudflare MCP (logs, deploy status) | có (chỉ đọc) | không | không | Deploy chỉ qua GitHub Actions |
| Playwright MCP | có | có | không | Gỡ lỗi e2e trên staging |
| Context7 (tài liệu thư viện đúng phiên bản) | có | có | có | Giảm viết sai API Next.js, Supabase |
| Google Calendar, Gmail, Drive (phiên cloud đã có) | có | không | không | Kiểm sự kiện Meet trên lịch thử; đọc Sheets v8 khi viết `import_sheets` |

Bí mật: không MCP nào cầm khoá production. Khoá SES, service account Calendar, Supabase service role chỉ nằm ở GitHub Secrets và Cloudflare Secrets.

### 5.4 Nhịp tuần (gói Pro, mỗi công cụ hạn 5 giờ và trần tuần)

| Ngày | Claude | Codex | Gemini | anh Chris |
|---|---|---|---|---|
| Thứ Hai | Phiên kế hoạch 30 phút: đọc `PROGRESS.md`, tách 4 đến 6 Issue từ bảng sprint, ghi `NEXT.md` | | Tóm tắt tuần trước, cập nhật `docs/` | Duyệt Issue, trả BACKLOG |
| Thứ Ba đến Thứ Năm | 1 đến 2 cửa sổ mỗi ngày, mỗi cửa sổ 1 PR | Review mỗi PR khi mở; thứ Năm: thử phá việc lớn | Hằng đêm: quét lệch đặc tả | Merge vào staging, thử 10 phút mỗi PR |
| Thứ Sáu | Sửa theo review, đóng PR tồn | Review cuối | Viết hướng dẫn cho tính năng vừa xong | PR staging → main, duyệt migration |
| Cuối tuần | Nghỉ; giữ 20% trần tuần cho sửa lỗi v8 | | | |

Tuần S0 là tuần đo: ghi số cửa sổ và số PR thực làm được của từng công cụ, từ tuần 2 xếp việc theo số đo thật.

### 5.5 Mẫu file (chép vào repo v9 ở S0)

**`AGENTS.md` (khung, luật đầy đủ lấy từ mục 5 bản 1):**

```
# AGENTS.md · Luật cho Claude Code, Codex, Gemini CLI trên repo thaiput_v9
1. Đọc NEXT.md trước. Một việc một PR dưới 300 dòng. Không kết thúc khi test đỏ.
2. Làn: Claude sửa apps/ packages/ supabase/ tests/. Codex chỉ tests/. Gemini chỉ docs/ content/ *.md. Không ai merge.
3. Luật nghiệp vụ ở packages/core, hàm thuần, clock truyền vào. Không gọi database ngoài withTx hoặc db.read.
4. Mọi Server Action và Route Handler bắt đầu bằng requireRole(). Không nhận student_id hay tutor_id từ trình duyệt.
5. Một lượt ghi là một giao dịch: khoá dòng, kiểm luật, ghi, activity_log, outbox. Ngoài giao dịch không làm gì.
6. API trả { ok, reason, message: { vi, en }, data }. Chữ qua content, email qua email_templates, cấu hình qua cfg().
7. Không ghi email, số điện thoại vào Calendar, Sentry, log.
8. Không sửa kết quả mong đợi trong docs/SPEC_V9.md và 46 kịch bản để test qua.
9. Lệnh: pnpm test, pnpm e2e, pnpm typecheck, pnpm db:reset. Trả lời và viết tài liệu bằng tiếng Việt, không dùng dấu gạch nối.
```

**`NEXT.md`:**

```
Việc: <một dòng>   Issue: #<số>   Sprint: S<n>
File: <danh sách>
Test phải xanh: <tên test hoặc kịch bản>
Điều kiện xong: <một dòng kiểm được>
```

**Prompt cho Codex review (đặt ở `.github/codex/review.md` hoặc dán khi gọi `@codex review`):**

```
Soát PR này theo AGENTS.md. Tìm: luật nghiệp vụ sai so với docs/SPEC_V9.md (dẫn số câu), thiếu requireRole, ghi ngoài giao dịch,
dữ liệu cá nhân lọt vào log hay Calendar, test thiếu nhánh lỗi, chạy lại tạo trùng. Mỗi mục: mức CAO, VỪA, THẤP; chỉ CAO và VỪA mới chặn.
Không khen. Không đề xuất đổi kiến trúc. Trả lời tiếng Việt.
```

**Prompt cho Codex thử phá (Codex CLI, mỗi việc lớn):**

```
Đọc packages/core/<module>.ts và test hiện có. Viết thêm test làm vỡ code: biên ngày (cuối tháng, năm nhuận, 23:59 ngày đặt),
gói hết hạn đúng ngày, hai booking cùng slot, request_id trùng, tutor bị khoá giữa chừng. Chỉ thêm file trong tests/. Mở PR vào nhánh hiện tại.
```

**Prompt cho Gemini quét đêm (GitHub Action, free tier):**

```
Đọc docs/SPEC_V9.md, docs/01_QUYET_DINH_50_CAU.md và diff của ngày hôm nay. Liệt kê chỗ code hoặc chữ song ngữ lệch đặc tả,
key content thiếu tiếng Anh, mẫu email thiếu biến. Ghi vào docs/REVIEW_GEMINI_<ngày>.md. Không sửa code. Nếu không có gì lệch thì không tạo file.
```

## 6. Thay đổi so với bản 1, tóm tắt để cập nhật

* Hosting: Cloudflare Workers (web qua vinext hoặc OpenNext, jobs bằng Hono riêng) thay Vercel; Vercel là dự phòng nếu thử nghiệm S0 đỏ.
* Email: SES từ 5R, Resend là dự phòng; không chuyển hai lần.
* Công cụ: bỏ Google AI Pro, dùng Gemini CLI miễn phí; Max chỉ 2 tháng nặng.
* Thêm: Worker jobs tách riêng, Hyperdrive, KV cache slot, Turnstile, mục tiêu hiệu năng đo được, kế hoạch tổng P0 đến P5, điều phối 3 làn, MCP và quyền, nhịp tuần, 4 mẫu file.
* Chi phí hạ tầng 65 → 35 USD mỗi tháng; công cụ 60 → 40 USD mỗi tháng.

## 7. Quyết định cần anh chốt (BACKLOG BL79 đến BL84)

| Mã | Câu hỏi | Đề xuất |
|---|---|---|
| BL79 | Mức hạ tầng: Pro gọn 35 USD, An toàn 65 USD, Tột cùng 10 USD | Pro gọn |
| BL80 | Email: SES ngay từ 5R (thay BL70 Resend) và thêm `REMINDER_MODE` giảm thư | SES; `REMINDER_MODE` làm ở v9 |
| BL81 | Bỏ Google AI Pro, dùng Gemini CLI miễn phí | Bỏ, trừ khi anh dùng AI Pro việc khác |
| BL82 | Nâng Claude Max 5x chỉ trong P2, P3 (2 tháng) | Có |
| BL83 | Tách Worker jobs bằng Hono riêng khỏi web | Có |
| BL84 | Làm P0 (test/unit.js, .gitignore, Actions, AGENTS.md, 5R) ngay trong tháng 11 xen kẽ chunk 6, 7 | Có |

## 8. Việc làm ngay (không chờ chốt, không tốn tiền)

1. Repo v8: lấy lại `test/unit.js`, thêm `.gitignore`, thêm GitHub Actions `npm test` và kiểm `dist/` khớp `src/` (PROGRESS 05/11 ghi có nhưng repo không có).
2. Đăng ký Cloudflare (free), chuyển DNS tên miền về Cloudflare; đăng ký AWS và xin SES ra khỏi sandbox (mất 1 ngày chờ, làm sớm).
3. Cài Gemini CLI đăng nhập Google cá nhân (free); bật Codex code review trên repo GitHub (trong ChatGPT Plus).
4. Gemini viết `docs/SPEC_V9.md` từ file 01, 03 và 6 file hàm thuần (`Packages.gs`, `Compensation.gs`, `Time.gs`, `Assign.gs`, `Phone.gs`, `Schema.gs`).

## 9. Nguồn (kiểm 05/11/2026)

* Cloudflare Workers giá và giới hạn: [developers.cloudflare.com/workers/platform/pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits)
* vinext và OpenNext trên Cloudflare: [developers.cloudflare.com/workers/framework-guides/web-apps/nextjs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/index.md), [opennext.js.org/cloudflare](https://opennext.js.org/cloudflare), [IT Brief: Cloudflare unveils vinext](https://itbrief.co.uk/story/cloudflare-unveils-vinext-a-vite-based-next-js-rival)
* Vercel Pro 20 USD mỗi ghế, Hobby cấm thương mại, cron: [vercel.com/docs/limits/fair-use-guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [vercel.com/docs/cron-jobs/usage-and-pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
* Supabase: [supabase.com/pricing](https://supabase.com/pricing), [database only cost](https://supabase.com/kb/faqs/platform/database-only-cost), [Supabase pricing 2026 (jetadmin)](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
* Amazon SES 0,10 USD mỗi 1.000 thư, hết tầng miễn phí cho tài khoản mới: [SES pricing 2026 (usecarly)](https://www.usecarly.com/blog/amazon-ses-pricing/), [SES pricing (costbench)](https://www.costbench.com/software/email-api/amazon-ses/)
* Resend Free 3.000 thư mỗi tháng và 100 mỗi ngày, Pro 20 USD 50.000 thư: [Resend pricing 2026 (usecarly)](https://www.usecarly.com/blog/resend-pricing/), [automationatlas](https://automationatlas.io/answers/resend-pricing-explained-2026/)
* Postmark 15 USD cho 10.000 thư: [automationatlas](https://automationatlas.io/answers/postmark-pricing-explained-2026/)
* Gemini CLI 1.000 lượt mỗi ngày miễn phí: [geminicli.com/docs/resources/quota-and-pricing](https://geminicli.com/docs/resources/quota-and-pricing/)
* Codex trong ChatGPT Plus (CLI, review trên GitHub, hạn 5 giờ và tuần): [uibakery: Codex pricing 2026](https://uibakery.io/blog/openai-codex-pricing), [developersdigest: Codex usage limits 2026](https://www.developersdigest.tech/blog/codex-usage-limits-pricing-2026)
* Supabase MCP chỉ đọc: [dev.to: Supabase MCP for Claude Code read only](https://dev.to/juholee/supabase-mcp-for-claude-code-a-read-only-one-project-setup-in-2-minutes-3ha)
