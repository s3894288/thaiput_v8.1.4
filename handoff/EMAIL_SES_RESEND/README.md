# Bàn giao: gửi email qua dịch vụ bên thứ ba (Amazon SES, Resend) cho v8

*Xuất 14/11/2026 từ nhánh `claude/hopeful-galileo-xa1dv9` (PR #2, đang tạm dừng theo lệnh anh Chris). Mục đích: mang toàn bộ phần email sang nhánh khác để hoàn thiện tiếp v8 đang vận hành, trong vòng 5S. Thư mục này tự đủ: không cần đọc nhánh cũ.*

*Ghi chú 28/11: chunk này đã đổi tên từ 5R thành 5S; các file patch giữ tên cũ (`01_code_5R_ses.patch`) và giữ nguyên comment cũ ghi 5R vì đã xuất trước khi đổi tên.*

## 1. Tóm tắt một đoạn

v8 gửi email qua Google (GmailApp), bị hạn mức của Google: khoảng 100 thư mỗi ngày khi Workspace còn dùng thử, 1.500 khi đã trả phí đủ ngày. Đã viết xong và test xong đường gửi thứ ba qua **Amazon SES** (bản 8.1.5), cắm vào đúng chỗ `src/MailTransport.gs` đã chừa từ 5Q. Bật bằng một ô CONFIG `MAIL_TRANSPORT = SES`; chưa bật thì email chạy y như 8.1.4. **Chưa gửi thật qua AWS lần nào**: chữ ký đã khớp vector mẫu của AWS trong test, lần gửi đầu trên STAGING là lần kiểm thật. **Resend** là phương án dự phòng: đã lên kế hoạch, chưa viết code.

## 2. Các file trong thư mục này

| File | Là gì | Bắt buộc |
|---|---|---|
| `README.md` | File này: quyết định, thiết kế, cách áp, việc còn lại | Đọc trước |
| `01_code_5R_ses.patch` | Code SES và test (7 file: `src/MailTransport.gs`, `src/Config.gs`, `src/Setup.gs`, `src/appsscript.json`, `test/gas_mock.js`, `test/load.js`, `test/integration.js`) | Có |
| `02_test_unit_js.patch` | `test/unit.js` viết lại (34 test). Repo hiện thiếu file này nên `npm test` đỏ ngay dòng nạp | Có, trừ khi nhánh đích đã có `test/unit.js` |
| `03_repo_ci.patch` | `.github/workflows/test.yml` (CI chạy `npm test` và kiểm `dist/` khớp `src/`), `.gitignore`, `.clasp.json.example` | Nên có |
| `04_HUONG_DAN_CAI_SES_TUNG_BUOC.md` | Hướng dẫn admin cài AWS và SES từng bước (A2 đến A12), lịch thử, điều kiện xong | Cho admin |

## 3. Cách áp sang nhánh khác

Đã thử ngày 14/11: áp cả 3 patch lên `main` sạch (`648057d`) thì `npm test` xanh hết (34/34, 46/46, 137/137, 48/48, 2/2).

```bash
git checkout -b <nhánh-mới> origin/main
```

```bash
git checkout claude/hopeful-galileo-xa1dv9 -- handoff/EMAIL_SES_RESEND
```

```bash
git apply handoff/EMAIL_SES_RESEND/01_code_5R_ses.patch handoff/EMAIL_SES_RESEND/02_test_unit_js.patch handoff/EMAIL_SES_RESEND/03_repo_ci.patch
```

```bash
npm ci && npm test && npm run build
```

Lưu ý khi áp:
1. **Số phiên bản:** patch 01 đổi `VERSION` trong `src/Config.gs` từ `8.1.4` thành `8.1.5`. Nhánh đích đã ở bản khác thì sửa tay số này cho đúng thứ tự (luật 49: menu 1 dựa vào số này để sao lưu).
2. **Nhánh đích đã sửa `MailTransport.gs`, `Setup.gs` hay `integration.js`:** `git apply` báo xung đột. Dùng `git apply --3way` rồi gộp tay; phần code nằm gọn ở mục 4 bên dưới để đối chiếu.
3. **`dist/` không nằm trong patch** (luật 28): chạy `npm run build` sau khi áp, commit cả `dist/`.
4. **Mã test:** patch dùng I136, I137, I138 cho test SES. Nhánh đích đã dùng các mã này thì đổi sang mã trống kế tiếp.

## 4. Thiết kế đã làm (bản 8.1.5, chunk 5S)

### 4.1 Chỗ cắm
Mọi email đi `sendTpl_` → `sendMail_` (Notify.gs) → `mailDeliver_` (MailTransport.gs). Chỉ `MailTransport.gs` được gọi dịch vụ gửi thư, đọc hạn mức và (từ 5S) gọi `UrlFetchApp`; test I133 quét `src/` và báo đỏ nếu file khác gọi (luật 19).

### 4.2 Gửi qua SES
* API SES v2: `POST https://email.<vùng>.amazonaws.com/v2/email/outbound-emails`, thân JSON (`FromEmailAddress` có tên hiển thị, `Destination` To, Cc, Bcc, `ReplyToAddresses` = ADMIN_EMAIL, `Content.Simple` có Subject, Text, Html, đều UTF-8).
* Chữ ký AWS Signature V4 viết thành hàm thuần `sigV4_(req)`: ký 2 header `host` và `x-amz-date` (không ký Content-Type vì Google tự thêm charset). HMAC dùng dạng byte của `Utilities.computeHmacSha256Signature` (Google có 2 dạng: chuỗi, chuỗi và byte, byte; không trộn được).
* Giờ ký lấy từ `realNowMs_()` (giờ thật, ngoại lệ luật 1): AWS từ chối chữ ký lệch quá 15 phút, nên giờ giả lập SIM_NOW không được dùng ở đây.
* Hàm: `sesConfig_`, `mailFromAddress_`, `utf8Bytes_`, `bytesHex_`, `hmacBytes_`, `amzDate_`, `sigV4_`, `sesPayload_`, `sesSend_`, `sesSentToday_`, `sesCountMailLog_`.

### 4.3 Khoá và cấu hình
| Nơi | Tên | Giá trị |
|---|---|---|
| Script Properties | `SES_KEY`, `SES_SECRET` | Khoá IAM chỉ có quyền `ses:SendEmail`, `ses:SendRawEmail`. **Không bao giờ để ở CONFIG** |
| Script Properties | `SES_REGION` | Mặc định `ap-southeast-1` (Singapore) |
| CONFIG mới | `MAIL_TRANSPORT` | Nhận thêm `SES` (vẫn có `GMAILAPP` mặc định, `MAILAPP`) |
| CONFIG mới | `MAIL_FROM_ADDRESS` | Trống = `no-reply@mail.<tên miền của ADMIN_EMAIL>`; phải thuộc tên miền đã xác minh trong SES |
| CONFIG mới | `MAIL_DAILY_CAP` | Mặc định 1400; 0 = không giới hạn. Hạn mức tự đặt khi dùng SES |
| `appsscript.json` | `script.external_request` | Quyền mới để gọi `UrlFetchApp` (**quyền đổi**, Google hỏi cấp lại ở menu 1) |

### 4.4 Khi SES hỏng
Thiếu khoá, AWS trả mã khác 2xx, hay mất mạng: thư đó **tự gửi lại bằng đường Google** (GmailApp, thiếu quyền thì MailApp), ghi `MAIL_FALLBACK` vào ACTIVITY_LOG (chi tiết `{ to, from: 'SES', used, error }`), thông báo `MAIL_FAILED` song ngữ tối đa 1 lần mỗi giờ (dấu `mail_fb_notice` trong CacheService). Cả hai đường cùng hỏng: `MAIL_FAILED` như cũ, `sendMail_` trả false, không ném lỗi (luật 27, 39).

### 4.5 Hạn mức
`mailBudget_()` với SES = `MAIL_DAILY_CAP` trừ số người nhận đã gửi qua SES hôm nay. Bộ đếm theo ngày trong CacheService (`ses_sent_<yyyy-MM-dd>`), mất bộ đệm thì đếm lại MAIL_LOG cột `transport = SES` một lần. `MAIL_LOW_QUOTA_RESERVE` (bỏ thư nhắc ưu tiên thấp) và `MARKETING_QUOTA_RESERVE` (dừng marketing) tự tính trên số này. Ngày tính theo lịch (0 giờ), AWS tính 24 giờ trượt: đặt `MAIL_DAILY_CAP` dưới hạn mức AWS cấp.

### 4.6 Menu
* Menu 2: LỖI khi `MAIL_TRANSPORT = SES` mà thiếu `SES_KEY` hoặc `SES_SECRET`; LƯU Ý khi `MAIL_FROM_ADDRESS` trống; dòng "Email còn gửi được hôm nay qua SES: N (MAIL_DAILY_CAP X, đã gửi Y)".
* Menu Email → Kiểm tra gửi email: hiện đường gửi thật đã dùng (`SES`, hoặc `GMAILAPP` khi SES lỗi và đã tự gửi lại).

### 4.7 Test và thử phá
| Test | Kiểm gì |
|---|---|
| I136 | `sigV4_` khớp vector mẫu trong tài liệu AWS (IAM ListUsers, chữ ký `5d672d79…b5d7`) và khớp bản tính độc lập bằng Node cho yêu cầu SES có tiếng Việt, tiếng Thái; header lộn thứ tự, chữ hoa, khoảng trắng thừa; mock từ chối trộn chuỗi và byte như Google |
| I137 | Gửi qua SES: địa chỉ API, chữ ký, thân thư, CC, BCC, tên có dấu nháy; mã 400, 500, mất mạng, thiếu khoá thì tự gửi lại GmailApp và báo 1 lần; cả hai hỏng thì MAIL_FAILED; menu 2 báo LỖI thiếu khoá; menu Kiểm tra gửi email báo SES |
| I138 | Hạn mức: trừ đúng, đếm lại khi mất bộ đệm, ngày mới về 0, thư nhắc dừng ở MAIL_LOW_QUOTA_RESERVE còn thư quan trọng vẫn đi, `MAIL_DAILY_CAP = 0` không giới hạn, quyền `external_request` có trong `appsscript.json` |
| I133 | Mở rộng: ngoài `MailTransport.gs` không file nào gọi `UrlFetchApp` hay `amazonaws.com` |

Mock thêm: `UrlFetchApp` (test tự đặt máy chủ giả qua `state.urlFetch`, không bao giờ gọi mạng), `Utilities.newBlob(chuỗi).getBytes()`, `computeDigest` và `computeHmacSha256Signature` nhận mảng byte.
Thử phá: 3 đột biến SES (bỏ sắp xếp header ký, coi mã 400 là thành công, không trừ số đã gửi) bị bắt cả 3. `test/unit.js`: 25 đột biến bị bắt cả 25.

## 5. Vì sao chọn SES trước Resend

| | Amazon SES (đã làm) | Resend (dự phòng, chưa làm) |
|---|---|---|
| Giá cho khoảng 1.500 thư mỗi ngày (45.000 mỗi tháng) | khoảng 5 USD (0,10 USD mỗi 1.000 thư; tài khoản mới không còn tầng miễn phí) | Pro 20 USD (50.000 thư mỗi tháng, không trần ngày). Free chỉ 100 thư mỗi ngày |
| Cài đặt | Nhiều bước: tài khoản AWS, xin ra khỏi sandbox (khoảng 24 giờ), IAM, DKIM, SNS | Ít bước: tài khoản, 3 bản ghi DNS, khoá API |
| Gọi từ Apps Script | Phải ký SigV4 (đã viết, khoảng 60 dòng) | Một lệnh HTTP với header `Authorization: Bearer <khoá>` |
| Báo thư tới, trả về | SNS gửi email về admin (v8); webhook ở v9 | Trang quản lý có sẵn; webhook ở v9 |
| Dùng tiếp ở v9 | Có (Cloudflare Worker gọi SES) | Có |

Kết luận (BL80, chờ anh duyệt): SES rẻ hơn khoảng 4 lần và dùng thẳng tới v9, không phải chuyển hai lần. Chọn Resend khi AWS từ chối cho ra khỏi sandbox hoặc anh muốn trang quản lý thư dễ xem hơn.

### 5.1 Nếu cần làm Resend (khoảng 1 cửa sổ Claude)
Cắm cùng chỗ, không đụng file khác:
1. `MAIL_TRANSPORTS_` thêm `RESEND`; Script Property `RESEND_API_KEY`.
2. `resendSend_(to, subject, body, opts)`: `UrlFetchApp.fetch('https://api.resend.com/emails', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + key }, payload: JSON.stringify({ from: '"<tên>" <' + from + '>', to: [...], cc, bcc, reply_to: ADMIN_EMAIL, subject, html, text, tags: [{ name: 'kind', value: kind }] }) })`. Mã khác 2xx thì ném lỗi; dùng lại nhánh tự gửi lại GmailApp và `mailFallbackNotice_` như SES (đổi `from` thành `RESEND`).
3. `mailBudget_` với RESEND: dùng chung `MAIL_DAILY_CAP` và bộ đếm như SES (đổi tên khoá đếm theo transport). Gói Free đặt `MAIL_DAILY_CAP = 90`.
4. Menu 2 báo LỖI thiếu `RESEND_API_KEY`. I133 quét thêm `api.resend.com`.
5. Test như I137, I138 với máy chủ giả trả `{ "id": "..." }`.
6. Admin: resend.com bằng admin@, Domains thêm `mail.<tên miền>`, chép 3 bản ghi DNS (MX, SPF, DKIM), DMARC `p=none`, tạo khoá "Sending access" chỉ cho tên miền đó, dán vào Script Properties.

## 6. Việc của admin để chạy thật (chi tiết: `04_HUONG_DAN_CAI_SES_TUNG_BUOC.md`)

| Bước | Việc | Thời gian |
|---|---|---|
| A2 | Tài khoản AWS bằng admin@, MFA, ngân sách báo động 10 USD, vùng Singapore | 30 phút |
| A3 | SES identity `mail.<tên miền>`: 3 CNAME DKIM, MAIL FROM `bounce.mail.<tên miền>` (MX, TXT), DMARC `p=none` | 30 phút, chờ xác minh tới 72 giờ |
| A4 | Xin ra khỏi sandbox (mẫu chữ tiếng Anh có sẵn) | 10 phút, chờ khoảng 24 giờ |
| A5 | IAM user chỉ quyền gửi thư, tạo access key | 10 phút |
| A6 | SNS topic báo thư trả về và báo spam về admin@ | 10 phút |
| A8 | Dán bản có SES lên STAGING, menu 1 (cấp quyền mới), dán 3 khoá vào Script Properties | 30 phút |
| A9 | `MAIL_TRANSPORT = SES`, Kiểm tra gửi email tới 5 loại hộp thư (Gmail, Outlook, Yahoo, tên miền trường, Workspace khác); SPF, DKIM, DMARC đều PASS | 20 phút |
| A10 đến A12 | Chạy thật, tăng dần `MAIL_DAILY_CAP` 300 → 600 → 1400 mỗi 2 ngày (warm up tên miền mới) | 5 phút mỗi sáng |

Quay về bất cứ lúc nào: đổi `MAIL_TRANSPORT = GMAILAPP`, không cần dán lại code.

## 7. Còn lại, giới hạn đã biết

1. **Chưa thử trên AWS thật** (rủi ro chính). Lỗi thì thư tự đi GmailApp, không mất thư.
2. v8 không đọc thư bị trả về hay bị báo spam: `doPost` chỉ dành cho cổng thử tải (luật 48). SES báo qua SNS về email admin; admin sửa email học viên bằng tay. v9 nhận webhook.
3. Chưa làm (BACKLOG): BL69 bảng hạn mức 5 dòng ở menu 2, kiểm 5 loại hộp thư; BL64 Gmail API; Resend (mục 5.1); `REMINDER_MODE` giảm khoảng 40% thư (BL80, để v9).
4. Hướng dẫn vận hành B8 và hướng dẫn phát hành đã có đoạn cho 8.1.5 trên nhánh cũ; khi áp sang nhánh mới, chép 3 dòng bảng B8 sau (Phần B thành 100 ô):

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `MAIL_TRANSPORT` | GMAILAPP | Thêm giá trị `SES`: gửi qua Amazon SES, cần Script Properties `SES_KEY`, `SES_SECRET`, `SES_REGION`. SES lỗi thì thư tự gửi lại bằng GmailApp, thông báo MAIL_FAILED tối đa 1 lần mỗi giờ |
| `MAIL_FROM_ADDRESS` | (trống) | Chỉ dùng với SES: địa chỉ gửi, thuộc tên miền đã xác minh. Trống: `no-reply@mail.<tên miền của ADMIN_EMAIL>`. Trả lời vẫn về ADMIN_EMAIL |
| `MAIL_DAILY_CAP` | 1400 | Chỉ dùng với SES: số thư tối đa mỗi ngày. Tuần đầu 300, mỗi 2 ngày gấp đôi tới 1400. 0 = không giới hạn |

## 8. Quyết định đang chờ anh (BACKLOG trên nhánh cũ)

| Mã | Câu hỏi | Đề xuất |
|---|---|---|
| BL31 | Gửi email qua dịch vụ ngoài | Đã làm SES ở 5S |
| BL69 | Bảng hạn mức 5 dòng ở menu 2, kiểm 5 loại hộp thư | Làm cùng lần thử A9 |
| BL70 | Dịch vụ: Resend, Postmark hay SES | Đổi thành SES (BL80) |
| BL71 | Làm email bên thứ ba khi nào | Trước khi PRODUCTION tách riêng, để go live đã có hạn mức rộng |
| BL80 | SES ngay, không đi vòng qua Resend | SES |
| BL85 | `test/unit.js` viết lại hay lấy bản gốc từ `TEST_BUNDLE.txt` | Bản gốc nếu còn, không thì giữ bản viết lại |

## 9. Lộ trình liên quan (để đặt vào vòng 5S)

1. Áp patch, test xanh, `npm run build`, đánh số phiên bản theo nhánh đích.
2. Dán lên STAGING với `MAIL_TRANSPORT = GMAILAPP` (không đổi hành vi), cấp quyền mới.
3. Admin làm A2 đến A6 (song song, không ảnh hưởng hệ thống).
4. Thử A9 trên STAGING; xanh thì chạy thật và warm up A10 đến A12.
5. Theo dõi 1 tuần: MAIL_LOG cột `transport`, ACTIVITY_LOG không có MAIL_FAILED, MAIL_FALLBACK, hộp admin@ không có thư SNS bất thường.
6. Ổn định thì ghi SES vào bộ đặc tả v8 chuẩn; v9 dùng lại cùng tài khoản SES, cùng tên miền (đã "ấm").
