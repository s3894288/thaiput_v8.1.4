# Báo cáo dọn dẹp project thaiput (30/10/2026, bản 8.0.10)

*Viết cho người không viết code. Không có dòng code nghiệp vụ nào bị đổi. Không chạy clasp push, không triển khai, không đụng Script Properties hay dữ liệu thật.*

## 1. Kết quả trong một đoạn

Project có 101 file. Sau dọn dẹp còn 34 file. 60 file lịch sử, báo cáo, soát, tư vấn đã được gộp nguyên văn vào 6 file trong `v8/archive/`, mỗi file gốc có số byte và mã kiểm tra (sha256) để chứng minh không mất chữ nào. 15 file là mã và test của hệ thống cũ v6 đã bị xoá vì không còn liên quan. 26 file còn lại giữ nguyên chỗ, trong đó 9 file đã được sửa nhẹ cho đúng đường dẫn mới. Thêm 8 file mới: 6 file gộp, bảng tra `MANIFEST.md` và báo cáo này. File `appsscript.json` của bản 8.0.10 đã được đối chiếu với code từng quyền một và **không cần đổi**. Một bản sao lưu đầy đủ 101 file nằm ngoài project, nên anh luôn quay lại được.

## 2. Thư mục `src` ở gốc project: bỏ

Đây là mã của **v6** (Main.gs, Quota.gs, FormLink.gs, FormUpdater.gs và 8 file khác, gắn vào file Sheets cũ và Google Form). v8 không gọi hàm nào trong đó: toàn bộ 35 file nguồn của v8 đã nằm trong `v8/dist/Code.gs`. Thư mục `test/` ở gốc cũng của v6 (nạp đúng 11 file v6). Cả hai đã xoá, kèm `src/appsscript.json` của v6 (có quyền `forms` mà v8 không dùng).

Kiểm tra riêng `Migration.gs` của v8: nó chỉ **đọc dữ liệu** từ file Sheets v6 (tab TUTOR_INFO, STUDENT_INFO, BOOKINGS) bằng `SpreadsheetApp.openById`, không gọi hàm nào của mã v6. Nên xoá mã v6 không làm hỏng việc chuyển dữ liệu. Phần mô tả bố cục sheet v6 (tài liệu và khuôn mẫu) vẫn giữ trong `archive/V6_HO_SO_CU.md`.

Lưu ý quan trọng: **thư mục `src/` và `test/` thật của v8 không nằm trong project này** (chúng nằm trong repo trên máy anh). Vì vậy tôi không dựng lại được `dist/` để so sánh với `src/` thật. Xem mục 9.

## 3. Đã xoá và vì sao (15 file, đều của v6)

| File | Lý do |
|---|---|
| `src/Main.gs`, `Helpers.gs`, `Setup.gs`, `Config.gs` | Mã cấu hình, cài đặt v6. v8 có Config, Setup, Time, Db riêng. |
| `src/FormLink.gs`, `FormUpdater.gs` | Liên kết Google Form v6. v8 bỏ Google Form. |
| `src/MeetIntegration.gs` | Tạo Meet v6. v8 có `CalendarSync.gs`. |
| `src/Registration.gs`, `Quota.gs`, `Attendance.gs` | Đăng ký, hạn mức theo CHECK_SLOT, điểm danh của v6. v8 có Registration, Booking, Packages, Sessions. |
| `src/Archive.gs`, `WeeklyMaintenance.gs` | Lưu trữ và bảo trì tuần v6. v8 có Archive, Jobs, Maintenance. |
| `src/appsscript.json` | Manifest v6 (có quyền `forms`). v8 dùng `v8/dist/appsscript.json`. |
| `test/harness.js`, `test/formlink.test.js` | Test của v6. Tên `test/harness.js` trùng với test của v8 trong repo thật nhưng không phải cùng file. |

Mã v6 này lấy lại được từ file sao lưu (mục 11). Không có dữ liệu nào chỉ nằm trong các file này.

## 4. Đã gộp vào đâu (60 file thành 6 file)

Cách gộp: mỗi file gốc giữ **nguyên văn**, nằm giữa hai dòng `<!-- BEGIN FILE: đường dẫn | bytes | sha256 | created -->` và `<!-- END FILE: ... -->`, có mục lục ở đầu và ngày tạo gốc. File `.txt` và các file mã nằm trong khung mã để giữ nguyên xuống dòng. Bảng đầy đủ từng file cũ sang chỗ mới: `v8/archive/MANIFEST.md`.

| File gộp mới | Gồm | Số file |
|---|---|---|
| `archive/GIAI_THICH_CHUNKS.md` | Giải thích chunk 1 đến 5I và bản tổng hợp 5A đến 5G (trước đây `history/CHUNK*_GIAI_THICH.md`) | 15 |
| `archive/BAO_CAO_CHUNKS.md` | Báo cáo test chunk 3 đến 5I và tổng hợp 5A đến 5G (`reports/REPORT_*.md`) | 13 |
| `archive/SOAT_VA_THU_PHA.md` | Các vòng soát 5F đến 5I, soát giao diện 20/10, nhật ký thử phá 5H và 5I | 15 |
| `archive/TU_VAN_VA_KIEN_TRUC.md` | Tư vấn 15/10 và 16/10, hai ý kiến chuyên gia kiến trúc, phân tích báo giá dev, thay đổi giao diện 19/10 | 7 |
| `archive/V7_SPEC_CU.md` | Bài đọc trước và CLAUDE.md bản v7 cũ (`docs/00`, `docs/05`) | 2 |
| `archive/V6_HO_SO_CU.md` | Tài liệu v6 (README, CHANGELOG, HOTFIX, DEVELOPER_GUIDE, tổng hợp) và 3 khuôn mẫu sheet v6 | 8 |

Kiểm chứng: sau khi gộp, một chương trình rút lại từng file gốc từ file gộp và so với bản cũ từng byte: 60/60 khớp. Thư mục `history/` và `reports/` không còn vì đã trống.

## 5. Giữ nguyên chỗ và vì sao

| File | Lý do giữ |
|---|---|
| `v8/dist/Code.gs`, `Index.html`, `appsscript.json` | Bản đang dán vào Apps Script. |
| `v8/dist_google_login/*` | Dự án phụ đăng nhập Google, còn dùng. |
| `v8/loadtest/run.js`, `browser.js` | Công cụ thử tải STAGING, được các hướng dẫn gọi tên. |
| `v8/CLAUDE.md` | Luật kỹ thuật hiện hành cho Claude Code. |
| `v8/README.md`, `PROGRESS.md`, `BACKLOG.md` | Cửa vào, tiến độ, danh sách việc chờ. |
| `v8/HUONG_DAN_TRIEN_KHAI_WORKSPACE.md`, `HUONG_DAN_VAN_HANH.md`, `HUONG_DAN_PHAT_HANH.md`, `HUONG_DAN_THU_TAI.md` | Bốn hướng dẫn đang dùng. |
| `v8/THIET_KE_GIAO_DIEN.md` | Thiết kế giao diện hiện hành (bản 19/10). |
| `v8/docs/01_QUYET_DINH_50_CAU.md`, `02_PLAN_CODE.md`, `03_KICH_BAN_TEST_40.md`, `04_CHECKLIST.md`, `06_HUONG_DAN_TEN_MIEN_WORKSPACE.md` | Code và CLAUDE.md dẫn tên các file này (ví dụ "câu 37", "file 03"). Đổi chỗ sẽ làm gãy tham chiếu. |
| `v8/plan/*` (5 file) | Kế hoạch chưa thực hiện: 5J đến 5P, lộ trình, sau go live, bù buổi, trả lời 29/10. |

## 6. File `appsscript.json` cuối cùng của 8.0.10

Tôi lập danh sách dịch vụ từ chính code trong `Code.gs`, rồi so với file hiện có. **Kết quả: file hiện có đã đúng, giữ nguyên từng byte** (không viết lại để khỏi tạo khác biệt vô nghĩa). Nội dung: múi giờ `Asia/Ho_Chi_Minh`, `runtimeVersion` V8, `exceptionLogging` STACKDRIVER, dịch vụ nâng cao Calendar v3, web app `executeAs` USER_DEPLOYING và `access` ANYONE_ANONYMOUS, 7 quyền.

| Quyền | Vì sao cần | Hàm tiêu biểu (file) |
|---|---|---|
| `spreadsheets` | Đọc ghi file DB, lưu trữ, tạo trigger gắn Sheets, chuyển dữ liệu v6 | `withLock_`, `dbSpreadsheet_` (Db), `archiveFile_` (Archive), `setupCore_` (Setup), `migrateFromV6_` (Migration), `onEditInstallable` (Admin) |
| `script.container.ui` | Menu thaiput và hộp thoại trong Sheets | `onOpen`, `menuAddTutor` (Admin), `menuMarketingSend` (Marketing), `menuMailTest` (Notify), `menuResetTestData` (Reset) |
| `drive` | Sao lưu, xuất file, thư mục lưu trữ, ảnh chuyển khoản, đọc chủ file | `nightlyBackup`, `weeklyExport` (Backup), `archiveMonthlyCopy_` (Archive), `submitRegistration_` (Registration), `releaseCopy_` (Release), `requireOwner_` (Auth) |
| `calendar` | Tạo, sửa, huỷ sự kiện buổi học và tạo lịch chung | `createLessonEvent_`, `removeLessonEvent_`, `reassignLessonEvent_` (CalendarSync), `calendarApplyOutcomes_` (CalendarQueue), `setupCore_`, `testSystem` (Setup) |
| `script.send_mail` | Gửi email và đọc hạn mức còn lại | `sendMail_`, `mailTest_` (Notify), `marketingSend_` (Marketing), `speedTest_` (Metrics) |
| `script.scriptapp` | Tạo và xoá 10 trigger | `createTriggers_`, `testSystem` (Setup), `isProjectTriggerEvent_` (Auth) |
| `userinfo.email` | Biết ai đang bấm (người chủ, admin) | `isOperator_`, `requireOwner_` (Auth), `adminActor_` (Admin), `mailSender_` (Notify) |

Dịch vụ không cần quyền riêng: CacheService, LockService, PropertiesService, HtmlService, ContentService, Utilities, Logger. Code **không** dùng UrlFetchApp (nên không cần `script.external_request`), GmailApp, FormApp hay dịch vụ nâng cao nào khác ngoài Calendar.

**MailApp hay GmailApp (cần anh lưu ý).** Code nguồn 8.0.10 chỉ dùng `MailApp` (1 chỗ gửi thư, 7 chỗ đọc hạn mức), nên quyền `script.send_mail` là đủ. Tài liệu kế hoạch 5J ghi rằng thư MailApp từng bị trả về trên tên miền, và bản đang chạy thật có thể đã được vá tay sang Gmail (MailFix). **Tôi không đoán** bản đang chạy thật là gì. Nếu bản thật dùng GmailApp thì manifest thật cần thêm quyền `https://mail.google.com/` và vẫn giữ `script.send_mail` để đọc hạn mức. Anh nên mở trình soạn Apps Script thật, tìm chữ `GmailApp` để biết chắc. Tôi không thêm quyền đó vào `dist` vì code 8.0.10 trong project không cần.

**Dự án phụ `dist_google_login`**: manifest chỉ có múi giờ, runtime, `USER_ACCESSING` và `ANYONE`, không có khối quyền. Code của nó chỉ dùng `Session.getActiveUser` (quyền email, Google tự suy ra), PropertiesService, Utilities, HtmlService. Nhất quán, để nguyên.

## 7. Cập nhật tài liệu đang dùng

* `README.md`: viết lại, vì bản cũ còn nói "v7", trỏ tới hai hướng dẫn đã bỏ, cả `test/REPORT.md`, nhiều số liệu cũ. Bản mới ghi 8.0.10 và đường dẫn đúng.
* `PROGRESS.md`, `BACKLOG.md`, `CLAUDE.md`, `plan/KE_HOACH_5J_5P.md`, `plan/KE_HOACH_SAU_GO_LIVE.md`, `plan/LO_TRINH_V8_TOI_CUOI.md`, `docs/02_PLAN_CODE.md`: sửa các lời trỏ tới file đã gộp, đã bỏ, hoặc không còn (ví dụ `HUONG_DAN_CHAY_THU_GMAIL.md`, `KE_HOACH_CHUNK5_V2.md`, `history/`, `reports/`). `CLAUDE.md` có một đổi cách làm việc: mỗi chunk nối mục giải thích và mục báo cáo mới vào hai file gộp thay vì tạo file mới (quy ước 1).
* Bốn file hướng dẫn: không phải sửa. Tôi đã đối chiếu số liệu với code: 82 ô CONFIG, 10 trigger, 18 tab (17 trong SCHEMA cộng REPORT_MONTH) đều đúng, phiên bản đều 8.0.10.
* `v8/dist/Code.gs` dòng 4: đổi lời trỏ từ `HUONG_DAN_CHAY_THU_GMAIL.md` (không còn) sang `HUONG_DAN_PHAT_HANH.md`. Chỉ một dòng chú thích (597.678 byte thành 597.673 byte), không đổi logic. `Index.html` và `appsscript.json` không đổi.

## 8. Những chỗ cố ý để nguyên

* Hai chỗ trong `Code.gs` vẫn nhắc `CHUNK5G_GIAI_THICH.md`: dòng 2173 là **chuỗi chữ chạy thật** (ghi vào mô tả file lưu trữ trên Drive), nên đổi là đổi code; dòng 7465 là chú thích. File này nay nằm trong `archive/GIAI_THICH_CHUNKS.md`. Kế hoạch 5K (`plan/KE_HOACH_5J_5P.md`, chunk 5K, phần "Thêm phần tìm cho dễ", dòng "mô tả file trỏ tới HUONG_DAN_VAN_HANH.md") đã có việc sửa.
* `BACKLOG.md` dòng 55 vẫn ghi tên hai hướng dẫn cũ vì đó là dòng nhật ký "đã xoá ngày 29/10".
* Nội dung trong `archive/` giữ nguyên văn nên vẫn chứa đường dẫn cũ (ví dụ `reports/...`). Đó là bản ghi lịch sử, bảng tra là `archive/MANIFEST.md`.

## 9. Điều tôi không làm được, nói thẳng

1. **Không dựng lại `dist/` để so với `src/` thật.** Thư mục `src/`, `test/` và `build_dist.js` thật không nằm trong project, nên không chạy được `node test/build_dist.js` và `npm test`. Các agent kiểm chéo cũng vì thế không chạy test. Anh cần chạy hai lệnh này trong repo thật.
2. **Dòng đầu `Code.gs` mới chỉ sửa ở `dist`.** Lần dựng `dist` kế tiếp sẽ ghi đè về chữ cũ nếu mẫu dòng đầu trong `test/build_dist.js` (và `src/`) chưa sửa. Dòng cần sửa là chữ `Hướng dẫn: HUONG_DAN_CHAY_THU_GMAIL.md` thành `Hướng dẫn: HUONG_DAN_PHAT_HANH.md`. Việc này đã nằm trong 5J mục 8.
3. **Không biết bản đang chạy thật có khớp `dist` không** (xem mục MailApp ở trên).

## 10. Kết quả hai vòng kiểm chéo (Sonnet 5, mức cao, agent chỉ nhận danh sách file và đường dẫn)

### Vòng 1 (3 agent song song)

| Agent | Kết luận | Lỗi tìm ra và cách sửa |
|---|---|---|
| Bảo toàn nội dung | Đạt. Lúc kiểm: 19 giữ nguyên, 7 sửa nhẹ (sau đó thêm 2 file sửa nhẹ nữa, nên số cuối là 17 và 9), 60 gộp đúng từng byte, 15 xoá (đều là mã v6). Không mất nội dung. | Báo `CLEANUP_REPORT.md` chưa tồn tại dù 3 chỗ trỏ tới (đã viết file này). Báo `plan/LO_TRINH_V8_TOI_CUOI.md` dòng 32 còn trỏ `history/` (đã sửa). |
| Cấu hình | Đạt cả 5 mục: 7 quyền đủ, không thừa, không thiếu; Calendar v3 khớp; MailApp đúng quyền; dự án phụ nhất quán. Gợi ý không bắt buộc: `calendar` hơi rộng nhưng cần vì có `Calendars.insert`. | Không có lỗi. |
| Tham chiếu | 4 tham chiếu hỏng, 1 chữ "file 05" cũ. | `CLEANUP_REPORT.md` (đã viết), `LO_TRINH` (đã sửa), `docs/02_PLAN_CODE.md` "file 05" (đã sửa), 2 chỗ trong `Code.gs` (để nguyên có lý do, mục 8). Bảng gộp thiếu ghi chú về file `.txt` trong khung mã (đã thêm vào `archive/MANIFEST.md`). |

Sau khi sửa, kiểm tham chiếu được chạy lại bằng một agent mới: **đạt**, không còn tham chiếu sống bị hỏng. Agent này chỉ ra thêm 3 lỗi chữ trong chính báo cáo này (số liệu vòng 1 lệch, dòng đánh số, thiếu chú thích), đã sửa.

### Vòng 2 (3 agent mới hoàn toàn, cố phá kết quả)

| Agent | Kết luận | Lỗi tìm ra và cách xử lý |
|---|---|---|
| Thử phá bản `dist` | Đạt cả 6 bước. `Index.html` và `appsscript.json` giống bản cũ từng byte. `Code.gs` chỉ khác dòng 4 (nhỏ hơn 5 byte). Tách đúng 35 phần đúng thứ tự như dòng đầu, không trùng tên hàm (510 hàm), cú pháp đúng, nạp thử trong môi trường giả lập không lỗi, không có hàm gọi mà chưa định nghĩa, phiên bản 8.0.10. | Không có lỗi. Lưu ý: không dựng lại được từ `src/` thật (mục 9). |
| Săn tên file đã xoá | Không tìm thấy tham chiếu hỏng hay thay đổi ngoài ý muốn (không CRLF, BOM, file rỗng). | (1) Công thức kiểm sha256 ghi trong `archive/MANIFEST.md` thiếu chi tiết "bỏ một dấu xuống dòng trước dòng END": **đã sửa**. (2) Dòng giữ chỗ chưa điền của báo cáo: **đã điền**. (3) Quy ước 1 trong `CLAUDE.md` chưa nói rõ các file `archive/` chỉ có trong project, repo thật vẫn viết file riêng: **đã sửa**. (4) Hai chỗ `Code.gs` nhắc `CHUNK5G_GIAI_THICH.md` và vài lời mẫu cũ trong `docs/02_PLAN_CODE.md` (nhắc `PHASEn_GIAI_THICH.md`): giữ nguyên, có lý do ở mục 8. |
| Lấy mẫu ngẫu nhiên | Mẫu 1: 17/20 đoạn tìm lại được. Mẫu 2 (chọn đoạn khó nhất): 7/10. Toàn bộ 60 khối trong 6 file gộp khớp từng byte và đúng mã sha256. | Các đoạn không tìm thấy gồm: 9 đoạn thuộc 15 file mã v6 đã xoá (chủ ý, nằm trong file sao lưu, mục 3), và 1 đoạn thuộc câu chữ cũ của `README.md` đã viết lại. **Nói thẳng: câu chữ cũ của 9 file đã sửa (chỉ đổi lời trỏ) và mã v6 chỉ còn trong file sao lưu `.tar.gz`, không còn trong project.** Vì vậy giữ file `.tar.gz` là bắt buộc. |

Tổng: không mất nội dung nào của 86 file được gộp, giữ nguyên hoặc chỉ đổi lời trỏ; phần chỉ còn trong bản sao lưu là mã v6 (15 file) và câu chữ cũ của các đoạn đã đổi lời trỏ.

## 11. Cây thư mục cuối

```
v8/
  CLAUDE.md  README.md  PROGRESS.md  BACKLOG.md  CLEANUP_REPORT.md
  THIET_KE_GIAO_DIEN.md
  HUONG_DAN_TRIEN_KHAI_WORKSPACE.md  HUONG_DAN_VAN_HANH.md
  HUONG_DAN_PHAT_HANH.md  HUONG_DAN_THU_TAI.md
  dist/               Code.gs  Index.html  appsscript.json
  dist_google_login/  GoogleLogin.gs  appsscript.json
  loadtest/           run.js  browser.js
  docs/               01_QUYET_DINH_50_CAU.md  02_PLAN_CODE.md  03_KICH_BAN_TEST_40.md
                      04_CHECKLIST.md  06_HUONG_DAN_TEN_MIEN_WORKSPACE.md
  plan/               KE_HOACH_5J_5P.md  KE_HOACH_SAU_GO_LIVE.md  LO_TRINH_V8_TOI_CUOI.md
                      TRA_LOI_29_10.md  TU_VAN_BU_BUOI.md
  archive/            MANIFEST.md  GIAI_THICH_CHUNKS.md  BAO_CAO_CHUNKS.md
                      SOAT_VA_THU_PHA.md  TU_VAN_VA_KIEN_TRUC.md
                      V7_SPEC_CU.md  V6_HO_SO_CU.md
```

Các thư mục ở gốc project `src/`, `test/`, `docs/`, `templates/` (của v6, không phải `v8/docs/`) và `v8/history/`, `v8/reports/` không còn.

## 12. Cách quay lại như cũ

1. Tôi gửi kèm 3 file: `SNAPSHOT_BEFORE_thaiput_project.tar.gz` (đủ 101 file như trước khi dọn, đúng đường dẫn cũ), `MANIFEST_BEFORE.tsv` (số byte và sha256 của từng file cũ), `MANIFEST_AFTER.tsv` (của bản mới).
2. Muốn quay lại: đưa file `.tar.gz` cho Claude và nói "khôi phục project Thai Class từ bản sao lưu này". Claude giải nén, ghi lại 101 file vào project và xoá 8 file mới (`archive/*` gồm 7 file, và `CLEANUP_REPORT.md`). Có thể tự kiểm bằng `MANIFEST_BEFORE.tsv`.
3. Muốn lấy riêng một file cũ (ví dụ một file v6): nó vẫn nằm nguyên văn trong `archive/` (trừ 15 file mã v6, chỉ có trong file `.tar.gz`). Bảng tra: `archive/MANIFEST.md`.
4. Giữ file `.tar.gz` ở nơi an toàn ngoài project, vì project không có bản của nó.
