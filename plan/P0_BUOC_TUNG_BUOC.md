# P0 từng bước: việc của anh, việc của Claude, lịch ngày

*Lập 05/11/2026 (Thứ Tư) theo hiệu lệnh "Làm P0 ngay". P0 là phần của `plan/KE_HOACH_V9_TOI_UU_DIEU_PHOI.md` mục 4 làm được ngay trong v8, không đụng hệ thống đang chạy trừ sub chunk 5R (bản 8.1.5, một sub chunk v8 bình thường: dán STAGING, kiểm, rồi PRODUCTION theo đúng thứ tự luật 38). Mỗi mục có ô tick; Claude cập nhật file này ở cuối mỗi cửa sổ.*

## 0. Hai điều phải biết trước

1. **STAGING hiện có người dùng thật** (BL11). 5R đổi đường gửi email, nên trên STAGING chỉ bật `MAIL_TRANSPORT = SES` sau khi menu Kiểm tra gửi email xanh và 5 hộp thư nhận được; đổi lại `GMAILAPP` là quay về ngay.
2. **`test/unit.js` thiếu trong repo** nên `npm test` đỏ ngay dòng nạp và GitHub Actions (thêm hôm nay) sẽ đỏ cho tới khi có lại file này. Cách nhanh nhất: anh tìm `TEST_BUNDLE.txt` trong project claude.ai cũ (bước A1). Không có thì Claude viết lại theo danh sách 34 test (bước C3), mất 1 cửa sổ và là bản viết lại, không phải bản gốc.

## 1. Lịch 10 ngày (05/11 đến 14/11)

| Ngày | Anh Chris | Claude Code | Mốc |
|---|---|---|---|
| **Thứ Tư 05/11** | A1 tìm `TEST_BUNDLE.txt`; A2 tạo tài khoản AWS, bật MFA, Budget 10 USD | C1 file repo (`.gitignore`, Actions, `AGENTS.md`, `.clasp.json.example`), file này; C2 bắt đầu 5R: SigV4, transport SES, test | PR #2 có đủ P0 phần tài liệu và repo |
| **Thứ Năm 06/11** | A3 SES: tạo identity `mail.<tên miền>`, chép 5 bản ghi DNS, DMARC; A4 xin ra khỏi sandbox; A5 IAM user | C2 xong 5R: `mailBudget_`, menu kiểm, I133 mở rộng, `VERSION 8.1.5`, `npm run build`, PROGRESS | Bản 8.1.5 trong `dist/`, test (trừ unit) xanh |
| **Thứ Sáu 07/11** | A6 nếu có bundle: dán `test/unit.js` vào repo (hoặc gửi file cho Claude); A7 cài Gemini CLI, bật Codex review | C3 nếu không có bundle: viết lại `test/unit.js`; sửa cho CI xanh | CI xanh lần đầu |
| **Thứ Bảy 08/11** | A8 DNS đã Verified, AWS đã duyệt sandbox: dán 8.1.5 lên STAGING, Script Properties `SES_KEY`, `SES_SECRET`, chạy menu 1, menu 2, Kiểm tra gửi email tới 5 hộp thư (BL69) | Trực sửa lỗi theo ảnh chụp | STAGING gửi được bằng SES |
| **Chủ nhật 09/11** | Nghỉ | | |
| **Thứ Hai 10/11** | A9 STAGING đổi `MAIL_TRANSPORT = SES`, `MAIL_DAILY_CAP = 300` (warm up ngày 1); A10 chạy prompt Gemini viết `docs/SPEC_V9.md` | C4 đọc MAIL_LOG, ACTIVITY_LOG STAGING qua ảnh anh gửi; sửa nếu có MAIL_FAILED | 1 ngày thư thật qua SES, 0 MAIL_FAILED |
| **Thứ Ba 11/11 đến Thứ Năm 13/11** | A11 tăng `MAIL_DAILY_CAP` 300 → 600 → 1.200; theo dõi Mail Delivery Subsystem và SNS bounce | C5 soát `docs/SPEC_V9.md` Gemini viết; đối chiếu với hàm thuần | Thư không vào spam ở 5 hộp thư |
| **Thứ Sáu 14/11** | A12 quyết định đưa 8.1.5 lên PRODUCTION (khi có PRODUCTION riêng, chunk 6) hoặc giữ STAGING là bản thật; `MAIL_DAILY_CAP = 1400` | C6 cập nhật `HUONG_DAN_VAN_HANH.md` B8 và `HUONG_DAN_PHAT_HANH.md` cho 8.1.5; đóng P0 trong PROGRESS | **P0 xong** |

Sau P0: tiếp chunk 6 (nghiệm thu), 7, 8 của `plan/LO_TRINH_V8_TOI_CUOI.md` với hạn mức email đã rộng. Đăng ký Cloudflare, Supabase, Sentry để tới S0 (tháng 01/2027), không cần ngay.

## 2. Việc của anh, từng bước

### A1. Tìm `TEST_BUNDLE.txt` (10 phút, hôm nay)
Mở project claude.ai cũ của v8, thư mục `v8/repo/`, tải `TEST_BUNDLE.txt`. Mở bằng Notepad, tìm dòng `=====FILE: test/unit.js=====`, chép từ dòng sau đó tới trước dòng `=====FILE:` kế tiếp, lưu thành `test/unit.js` trong repo (GitHub web: Add file → Create new file). Không có thì báo Claude "không có bundle".

### A2. Tài khoản AWS (30 phút, hôm nay)
1. aws.amazon.com → Create account bằng admin@, thẻ thanh toán, chọn gói Basic support (miễn phí).
2. Root user: bật MFA (IAM → Security credentials).
3. Billing → Budgets → Create → Monthly cost budget 10 USD → email admin@ khi 80%.
4. Góc phải chọn vùng **Asia Pacific (Singapore) ap-southeast-1** và giữ vùng này cho mọi bước sau.

### A3. SES identity và DNS (30 phút, chờ xác minh tới 72 giờ)
1. Amazon SES → Identities → Create identity → Domain → `mail.<tên miền>` (tên miền phụ, như kế hoạch) → Easy DKIM, RSA 2048 → Create.
2. SES hiện 3 bản ghi CNAME (DKIM). Thêm vào DNS (Namecheap → Advanced DNS; hoặc Cloudflare nếu đã chuyển): host là phần trước `.<tên miền>`, value giữ nguyên.
3. Identity → Custom MAIL FROM domain → `bounce.mail.<tên miền>` → SES hiện 1 bản ghi MX và 1 TXT (SPF). Thêm vào DNS.
4. Thêm TXT `_dmarc.mail` với giá trị `v=DMARC1; p=none; rua=mailto:admin@<tên miền>`.
5. Chờ identity chuyển Verified (xem lại sau vài giờ).

### A4. Xin ra khỏi sandbox (10 phút, AWS trả lời trong 24 giờ)
SES → Account dashboard → Request production access. Mail type: Transactional. Website: tên miền trường. Use case (viết tiếng Anh): "Lesson booking confirmations, lesson reminders and account emails for students and tutors of a Thai language school in Vietnam. Recipients are registered users who agreed to receive these emails; every marketing email has an unsubscribe link; bounces and complaints are handled automatically." Ước lượng: 2.000 thư mỗi ngày.

### A5. IAM user cho Apps Script (10 phút)
IAM → Users → Create user `thaiput-apps-script` (không cần console) → Attach policy inline:
```
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*" } ] }
```
→ Security credentials → Create access key → Application running outside AWS → chép Access key và Secret (chỉ hiện 1 lần). Dán vào Script Properties của dự án STAGING: Apps Script → Cài đặt dự án → Thuộc tính tập lệnh: `SES_KEY`, `SES_SECRET`, `SES_REGION = ap-southeast-1`. Không dán vào CONFIG, không gửi qua chat.

### A6. Dán `test/unit.js` (nếu có bundle)
Như A1. Sau khi dán, tab Actions của GitHub phải xanh sau vài phút.

### A7. Gemini CLI và Codex review (20 phút)
1. Máy có Node 18 trở lên: `npm install -g @google/gemini-cli`, chạy `gemini`, đăng nhập Google cá nhân (free tier 1.000 lượt mỗi ngày).
2. ChatGPT Plus → Codex → Settings → Connect GitHub → chọn repo `thaiput_v8.1.4` → bật Code review tự động cho PR. Từ đây mỗi PR của Claude được Codex soát; Claude đang theo dõi PR nên tự sửa theo.

### A8. Dán 8.1.5 lên STAGING (30 phút, Thứ Bảy)
Theo `HUONG_DAN_PHAT_HANH.md` mục 3: dán `dist/Code.gs`, `dist/Index.html`, `dist/appsscript.json` (8.1.5 thêm quyền `script.external_request`, Google sẽ hỏi cấp quyền lại), lưu, chạy menu 1 (Cập nhật cấu trúc), menu 2 (Kiểm tra hệ thống) phải không LỖI, rồi Triển khai phiên bản mới. Script Properties như A5. Menu Email → Kiểm tra gửi email → nhập lần lượt 5 địa chỉ (Gmail, Outlook, Yahoo, email tên miền trường, Workspace khác): mỗi thư phải tới hộp chính, đường gửi hiện `SES`.

### A9 đến A11. Bật SES và warm up
CONFIG `MAIL_TRANSPORT = SES`, `MAIL_DAILY_CAP = 300`. Mỗi 2 ngày tăng gấp đôi tới 1.400. Mỗi sáng xem: tab MAIL_LOG cột `transport` là SES, ACTIVITY_LOG không có MAIL_FAILED, hộp admin@ không có thư SNS bounce bất thường. Có vấn đề: đổi `MAIL_TRANSPORT = GMAILAPP`, chụp màn hình gửi Claude.

### A10. Gemini viết bản luật v9 (15 phút, chạy một lần)
Trong thư mục repo đã clone, chạy `gemini` và dán:
```
Đọc docs/01_QUYET_DINH_50_CAU.md, docs/03_KICH_BAN_TEST_40.md, CLAUDE.md, src/Packages.gs, src/Compensation.gs, src/Time.gs, src/Assign.gs, src/Phone.gs, src/Schema.gs.
Viết docs/SPEC_V9.md bằng tiếng Việt, không dùng dấu gạch nối: mỗi luật nghiệp vụ một mục có số, nêu nguồn (số câu file 01, tên hàm), đầu vào, đầu ra, ví dụ ngày cụ thể lấy từ test. Không bỏ luật nào trong 57 luật CLAUDE.md có liên quan nghiệp vụ. Không sửa file khác.
```
Kết quả commit lên nhánh `gemini/spec-v9`, mở PR; Claude soát ở C5.

## 3. Việc của Claude, từng bước

### C1. File repo (hôm nay, trong PR #2) ✅
* `.gitignore`: `node_modules/`, `.clasp.json`, `test/REPORT.md`, `dist_production/`, file tạm.
* `.github/workflows/test.yml`: Node 20, `npm ci`, `npm test`, `npm run build`, `git diff --exit-code -- dist dist_google_login` (đỏ khi `dist/` lệch `src/`, luật 28).
* `AGENTS.md`: luật làn cho Codex và Gemini trên repo v8 (Claude vẫn đọc `CLAUDE.md`).
* `.clasp.json.example`: mẫu như `HUONG_DAN_GITHUB_CLAUDE_CODE.md` mô tả.

### C2. 5R email SES, bản 8.1.5 (05 đến 06/11)
1. `src/MailTransport.gs`: `MAIL_TRANSPORTS_` thêm `SES`; hàm thuần `sesSigningKey_`, `sesCanonical_`, `sesAuthHeader_` (SigV4, test với vector mẫu của AWS); `mailDeliver_` nhánh SES: `UrlFetchApp.fetch` tới `https://email.<vùng>.amazonaws.com/v2/email/outbound-emails`, thân JSON (From có tên hiển thị, ReplyTo = ADMIN_EMAIL, Simple content HTML và Text), `muteHttpExceptions`; mã khác 2xx hoặc lỗi mạng thì tự gửi lại GmailApp và ghi MAIL_FALLBACK (dùng lại `mailFallbackNotice_`); thiếu `SES_KEY` thì báo rõ. Chỉ file này gọi `UrlFetchApp` tới `amazonaws.com` (I133 mở rộng).
2. `mailBudget_` với SES: `MAIL_DAILY_CAP` trừ số thư SES đã gửi hôm nay (bộ đếm `CacheService` theo ngày, mất thì đếm lại MAIL_LOG một lần rồi đặt lại bộ đếm).
3. CONFIG mới: `MAIL_DAILY_CAP` (mặc định 1400; `CFG_DOC` giải thích), `MAIL_TRANSPORT` nhận `SES`. Menu 2 báo LƯU Ý khi `MAIL_TRANSPORT = SES` mà thiếu Script Properties.
4. `appsscript.json` thêm `https://www.googleapis.com/auth/script.external_request`; `dist_google_login/` không đổi.
5. Test: U (hoặc I nếu unit chưa có) cho SigV4 vector mẫu, cho `mailDeliver_` SES 200, 400, 500, lỗi mạng, thiếu khoá; I cho `mailBudget_` SES và MAIL_LOG `transport = SES`; I133 mở rộng; mock thêm `UrlFetchApp` và `Utilities.computeHmacSha256Signature` nhận mảng byte (như Google thật, luật 14).
6. `VERSION = '8.1.5'`, `npm run build`, PROGRESS, HUONG_DAN_VAN_HANH B8 (ô mới), HUONG_DAN_PHAT_HANH (quyền mới).

### C3. `test/unit.js` viết lại (chỉ khi A1 không có bundle, 07/11)
Theo danh sách U01 đến U26 trong `archive/BAO_CAO_CHUNKS.md` dòng 105 đến 130 và các U mới ghi trong PROGRESS (U03 lịch THỨ GIỜ, U46, U47, U48, U49 quét MailTransport). Mỗi test giữ đúng kết quả mong đợi đã ghi (luật 15); test nào nghiệp vụ đã đổi (U06 số điện thoại không còn bị từ chối từ 5K) viết theo luật hiện hành và ghi rõ trong PROGRESS.

### C4 đến C6. Trực STAGING, soát SPEC_V9, đóng P0
Như lịch mục 1.

## 4. Điều kiện P0 xong

* [ ] GitHub Actions xanh trên `main` (unit.js có lại, dist khớp src).
* [ ] 8.1.5 trên STAGING gửi bằng SES 3 ngày liền, 0 MAIL_FAILED, 5 hộp thư nhận ở hộp chính.
* [ ] `MAIL_DAILY_CAP` đạt 1.400 (hơn hạn mức Workspace, không phụ thuộc tuổi tài khoản).
* [ ] `AGENTS.md` trong repo, Codex review bật, Gemini CLI chạy được, `docs/SPEC_V9.md` có PR.
* [ ] BACKLOG ghi quyết định đã dùng: BL80 (a) SES, BL84 có.
