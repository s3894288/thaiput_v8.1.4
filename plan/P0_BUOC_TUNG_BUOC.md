# P0 từng bước: việc của anh, việc của Claude, lịch ngày

> **Ghi chú gộp 28/11/2026 (đọc trước):** file này đến từ nhánh `claude/hopeful-galileo-xa1dv9` (PR 2). Anh Chris chốt 28/11: **main giữ code 8.1.4**, chỉ gộp tài liệu; nhánh PR 2 xoá sau khi gộp. Trên main: code SES (bản 8.1.5, chunk 5S) CHƯA có, nằm ở `handoff/EMAIL_SES_RESEND/01_code_5R_ses.patch`; `test/unit.js` là bản gốc; `.github/workflows/test.yml`, `.gitignore`, `.clasp.json.example` đã có. Số BACKLOG BL70 đến BL85 giữ nguyên số của nhánh PR 2 (nhánh 8.1.9 đã đổi số của nó sang BL150 đến BL175 ngày 28/11, không trùng).
>
> Lịch ngày ở mục 1 là lịch cũ của nhánh PR 2, bỏ qua. Bước A1 (duyệt PR 2) thay bằng: áp bản vá theo `handoff/EMAIL_SES_RESEND/README.md` mục 3. Bước A8 dán bản có SES theo số phiên bản lúc áp. Các bước A2 đến A12 dùng nguyên.
*Lập 05/11/2026, cập nhật 10/11/2026 (phần code của Claude đã xong, bản 8.1.5). P0 là phần của `plan/KE_HOACH_V9_TOI_UU_DIEU_PHOI.md` mục 4 làm ngay trong v8. Chỉ sub chunk 5S đụng hệ thống đang chạy, và chỉ khi anh đổi `MAIL_TRANSPORT = SES`; trước đó 8.1.5 gửi email y như 8.1.4.*

## 0. Ba điều phải biết trước

1. **STAGING đang có người dùng thật** (BL11). Chỉ đổi `MAIL_TRANSPORT = SES` sau khi Kiểm tra gửi email xanh ở cả 5 hộp thư. Đổi lại `GMAILAPP` là quay về ngay, không cần dán lại code.
2. **Khoá AWS chỉ dán ở Script Properties** (Apps Script → Cài đặt dự án → Thuộc tính tập lệnh). Không dán vào tab CONFIG, không gửi qua chat, không chụp màn hình có khoá.
3. **Chưa thử trên AWS thật.** Chữ ký đã khớp vector mẫu của AWS trong test, nhưng lần gửi đầu ở bước A8 mới là lần kiểm thật. Lỗi thì thư tự đi bằng GmailApp, không mất thư.

## 1. Lịch (từ Thứ Ba 11/11 đến Thứ Sáu 21/11)

| Ngày | Anh Chris | Claude Code | Mốc |
|---|---|---|---|
| ~~05/11 đến 10/11~~ | | ✅ C1 repo (`.gitignore`, Actions, `AGENTS.md`); ✅ C2 5S SES; ✅ C3 `test/unit.js` viết lại | Bản 8.1.5, CI xanh |
| **Thứ Ba 11/11** | A1 duyệt PR 2 (merge vào `main`); A2 tài khoản AWS | Trực PR, sửa nếu Codex hay CI báo | `main` có 8.1.5, Actions xanh |
| **Thứ Tư 12/11** | A3 SES identity, DNS; A4 xin ra khỏi sandbox; A5 IAM; A6 SNS báo thư trả về | | Chờ AWS duyệt (khoảng 24 giờ), DNS Verified (tới 72 giờ) |
| **Thứ Năm 13/11** | A7 cài Gemini CLI, bật Codex review; A8 dán 8.1.5 lên STAGING (chưa đổi SES) | Trực sửa lỗi theo ảnh chụp | STAGING chạy 8.1.5 bằng GmailApp |
| **Thứ Sáu 14/11** | A9 khi AWS đã duyệt và DNS Verified: Kiểm tra gửi email bằng SES tới 5 hộp thư | Đọc kết quả, sửa nếu có | 5 hộp thư nhận ở hộp chính |
| **Thứ Hai 17/11** | A10 đổi `MAIL_TRANSPORT = SES`, `MAIL_DAILY_CAP = 300`; A11 chạy prompt Gemini viết `docs/SPEC_V9.md` | C4 đọc MAIL_LOG, ACTIVITY_LOG qua ảnh anh gửi | Ngày đầu thư thật qua SES, 0 MAIL_FAILED |
| **Thứ Tư 19/11** | A12 `MAIL_DAILY_CAP = 600` | C5 soát PR `docs/SPEC_V9.md` của Gemini | |
| **Thứ Sáu 21/11** | A12 `MAIL_DAILY_CAP = 1400` | C6 đóng P0 trong PROGRESS | **P0 xong** |

Sau P0: tiếp chunk 6, 7, 8 của `plan/LO_TRINH_V8_TOI_CUOI.md` với hạn mức email đã rộng. Đăng ký Cloudflare, Supabase, Sentry để tới S0 (01/2027), chưa cần.

## 2. Việc của anh, từng bước

### A1. Duyệt PR (10 phút)
Mở PR "Kế hoạch v9 ..." trên GitHub (link trong tin nhắn của Claude). Tab **Checks** phải xanh. Bấm **Ready for review** rồi **Merge pull request**. Từ đây `main` là bản 8.1.5.

### A2. Tài khoản AWS (30 phút)
1. aws.amazon.com → Create account bằng admin@, thẻ thanh toán, gói Basic support (miễn phí).
2. Root user: bật MFA (góc phải tên tài khoản → Security credentials → Assign MFA device).
3. Billing → Budgets → Create budget → Monthly cost budget 10 USD → email admin@ khi tới 80%.
4. Góc phải chọn vùng **Asia Pacific (Singapore) ap-southeast-1**, giữ vùng này cho mọi bước sau.

### A3. SES identity và DNS (30 phút, xác minh tới 72 giờ)
1. Amazon SES → Configuration → Identities → Create identity → Domain → `mail.<tên miền>` → Advanced DKIM: Easy DKIM, RSA 2048 → Create identity.
2. SES hiện 3 bản ghi CNAME. Thêm vào DNS (Namecheap → Domain List → Manage → Advanced DNS → Add new record → CNAME): ô Host là phần trước `.<tên miền>`, ô Value chép nguyên.
3. Trong identity vừa tạo → Custom MAIL FROM domain → Edit → `bounce.mail.<tên miền>` → Save. SES hiện 1 bản ghi MX và 1 TXT: thêm vào DNS như trên.
4. Thêm TXT, Host `_dmarc.mail`, Value `v=DMARC1; p=none; rua=mailto:admin@<tên miền>`.
5. Chờ identity hiện **Verified** (xem lại sau vài giờ).

### A4. Xin ra khỏi sandbox (10 phút, AWS trả lời khoảng 24 giờ)
SES → Get set up → Request production access. Mail type: **Transactional**. Website URL: trang của trường. Use case description (tiếng Anh):
```
Lesson booking confirmations, lesson reminders and account emails for students and tutors of a Thai language school in Vietnam. Recipients are registered users who agreed to receive these emails. Every marketing email has an unsubscribe link. Bounces and complaints go to the admin mailbox through SNS and the address is removed. Expected volume: up to 2,000 emails per day.
```

### A5. IAM user cho Apps Script (10 phút)
IAM → Users → Create user `thaiput-apps-script` (không tick quyền vào console) → Next → Attach policies directly → Create policy → JSON, dán:
```
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*" } ] }
```
→ tên `thaiput-ses-send` → gắn vào user. Mở user → Security credentials → Create access key → **Application running outside AWS** → chép **Access key** và **Secret access key** (chỉ hiện 1 lần, lưu vào trình quản lý mật khẩu).

### A6. SNS báo thư trả về và báo spam (10 phút)
1. Amazon SNS (vùng Singapore) → Topics → Create topic → Standard → tên `thaiput-ses-feedback` → Create.
2. Create subscription → Protocol **Email** → Endpoint admin@ → mở thư AWS gửi tới admin@, bấm **Confirm subscription**.
3. SES → Identities → `mail.<tên miền>` → Notifications → Edit → Bounce feedback và Complaint feedback chọn topic `thaiput-ses-feedback` → Save.
Từ đây thư bị trả về hay bị báo spam có email báo tới admin@. Gặp thư báo: tìm học viên đó, sửa hoặc xoá email trong USERS.

### A7. Gemini CLI và Codex review (20 phút)
1. Máy có Node 18 trở lên: chạy `npm install -g @google/gemini-cli`, rồi `gemini`, đăng nhập Google cá nhân (miễn phí 1.000 lượt mỗi ngày).
2. ChatGPT Plus → Codex → Settings → Connect GitHub → chọn repo `thaiput_v8.1.4` → bật Code review cho PR. Codex đọc `AGENTS.md` trong repo để biết luật.

### A8. Dán 8.1.5 lên STAGING (30 phút), chưa đổi SES
Theo `HUONG_DAN_PHAT_HANH.md` mục 2: dán `dist/Code.gs`, `dist/Index.html`, `dist/appsscript.json` (quyền đổi), Lưu, F5 Sheets, chạy menu 1 (Google hỏi quyền "Kết nối với dịch vụ bên ngoài": chọn admin@, **Cho phép**, chạy lại menu 1), menu 2 không LỖI, Triển khai phiên bản mới. Rồi dán khoá: Apps Script → Cài đặt dự án → Thuộc tính tập lệnh → Thêm:
* `SES_KEY` = Access key ở A5
* `SES_SECRET` = Secret access key ở A5
* `SES_REGION` = `ap-southeast-1`
Tab CONFIG: `MAIL_FROM_ADDRESS` = `booking@mail.<tên miền>` (hoặc để trống dùng `no-reply@mail.<tên miền>`).

### A9. Thử SES (20 phút), khi A3 Verified và A4 đã duyệt
1. Tab CONFIG: `MAIL_TRANSPORT` = `SES`, `MAIL_DAILY_CAP` = `300`.
2. Menu **Email → Kiểm tra gửi email**, lần lượt 5 địa chỉ: Gmail cá nhân, Outlook hoặc Hotmail, Yahoo, email tên miền trường, một Workspace khác. Hộp thoại phải ghi **đường gửi SES**.
3. Mỗi thư phải tới **hộp chính**, không vào Spam. Mở thư → ba chấm → Hiển thị bản gốc: SPF, DKIM, DMARC đều PASS.
4. Hộp thoại ghi GMAILAPP (SES lỗi, đã tự gửi lại): mở tab NOTIFICATIONS, dòng "SES lỗi" có mã lỗi. Chụp màn hình gửi Claude (che khoá), đổi `MAIL_TRANSPORT` về `GMAILAPP`.
5. Chưa muốn chạy thật ngay: đổi `MAIL_TRANSPORT` về `GMAILAPP` sau khi thử.

### A10 đến A12. Chạy thật và tăng dần
`MAIL_TRANSPORT = SES` từ Thứ Hai 17/11 với `MAIL_DAILY_CAP = 300`, sau 2 ngày 600, sau 2 ngày nữa 1400. Mỗi sáng xem: tab MAIL_LOG cột `transport` là SES, ACTIVITY_LOG không có MAIL_FAILED hay MAIL_FALLBACK, hộp admin@ không có thư báo SNS bất thường. Có vấn đề: đổi về `GMAILAPP`, chụp màn hình gửi Claude.

### A11. Gemini viết bản luật v9 (15 phút, chạy một lần)
Clone repo về máy, mở thư mục repo, chạy `gemini` và dán:
```
Đọc docs/01_QUYET_DINH_50_CAU.md, docs/03_KICH_BAN_TEST_40.md, CLAUDE.md, AGENTS.md, src/Packages.gs, src/Compensation.gs, src/Time.gs, src/Assign.gs, src/Phone.gs, src/Schema.gs.
Viết docs/SPEC_V9.md bằng tiếng Việt, không dùng dấu gạch nối: mỗi luật nghiệp vụ một mục có số, nêu nguồn (số câu file 01, tên hàm), đầu vào, đầu ra, ví dụ ngày cụ thể lấy từ test. Không bỏ luật nào trong CLAUDE.md có liên quan nghiệp vụ. Không sửa file khác.
```
Commit lên nhánh `gemini/spec-v9`, mở PR. Claude soát ở C5.

## 3. Việc của Claude

| Mã | Việc | Trạng thái |
|---|---|---|
| C1 | `.gitignore`, `.clasp.json.example`, `.github/workflows/test.yml`, `AGENTS.md` | ✅ 05/11 |
| C2 | 5S: SES trong `MailTransport.gs` (SigV4, gửi, tự gửi lại, hạn mức `MAIL_DAILY_CAP`), `MAIL_FROM_ADDRESS`, menu 2, quyền `script.external_request`, test I136 đến I138, I133 mở rộng, thử phá, `VERSION 8.1.5`, `dist/`, hướng dẫn | ✅ 10/11 |
| C3 | `test/unit.js` viết lại 34 test, thử phá 25 đột biến | ✅ 10/11 |
| C4 | Trực STAGING khi anh gửi ảnh MAIL_LOG, ACTIVITY_LOG | Chờ A10 |
| C5 | Soát PR `docs/SPEC_V9.md` của Gemini, đối chiếu hàm thuần | Chờ A11 |
| C6 | Đóng P0 trong PROGRESS, BACKLOG | Chờ A12 |

## 4. Điều kiện P0 xong

* [x] GitHub Actions xanh (unit.js có lại, `dist/` khớp `src/`).
* [ ] 8.1.5 trên STAGING gửi bằng SES 3 ngày liền, 0 MAIL_FAILED, 5 hộp thư nhận ở hộp chính.
* [ ] `MAIL_DAILY_CAP` đạt 1400, không phụ thuộc tuổi tài khoản Workspace.
* [ ] Codex review bật, Gemini CLI chạy được, `docs/SPEC_V9.md` có PR.
* [ ] Anh duyệt BL80 (SES), BL84 (P0 tháng 11), BL85 (`test/unit.js` viết lại).
