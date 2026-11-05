# Giải thích từng chunk (chunk 1 đến 5I) và bản tổng hợp 5A đến 5G

*Tệp lưu trữ, gộp ngày 30/10/2026 trong đợt dọn dẹp bản 8.0.10. Gộp nguyên văn 15 file trước đây nằm ở `v8/history/`. Thứ tự: chunk 1 đến 5I theo thời gian, bản tổng hợp 5A đến 5G ở cuối.*

*Mỗi file gốc nằm giữa hai dòng `<!-- BEGIN FILE ... -->` và `<!-- END FILE ... -->`, kèm số byte và mã sha256 của file gốc để kiểm chứng. Nội dung giữa hai dòng đó là nguyên văn.*

## Mục lục

1. `v8/history/CHUNK1_GIAI_THICH.md`
2. `v8/history/CHUNK2_GIAI_THICH.md`
3. `v8/history/CHUNK3_GIAI_THICH.md`
4. `v8/history/CHUNK4_GIAI_THICH.md`
5. `v8/history/CHUNK5_GIAI_THICH.md`
6. `v8/history/CHUNK5A_GIAI_THICH.md`
7. `v8/history/CHUNK5B_GIAI_THICH.md`
8. `v8/history/CHUNK5C_GIAI_THICH.md`
9. `v8/history/CHUNK5D_GIAI_THICH.md`
10. `v8/history/CHUNK5E_GIAI_THICH.md`
11. `v8/history/CHUNK5F_GIAI_THICH.md`
12. `v8/history/CHUNK5G_GIAI_THICH.md`
13. `v8/history/CHUNK5H_GIAI_THICH.md`
14. `v8/history/CHUNK5I_GIAI_THICH.md`
15. `v8/history/GIAI_THICH_TONG_HOP_5A_5G.md`

---

## `v8/history/CHUNK1_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:40:59Z*

<!-- BEGIN FILE: v8/history/CHUNK1_GIAI_THICH.md | bytes=6694 | sha256=a946f2e384c2cfe17f74cdb440d7b0b2c40526e2b7795b5e42da3bcd42972a0d | created=2026-10-29T14:40:59Z -->
# Chunk 1 · Giải thích: mình đã làm gì, vì sao, kiểm tra thế nào

*05/10/2026 · Thaiput v8 · Kết quả: 26/26 test hàm thuần và Db đạt*

## 1. Tóm tắt một đoạn

Chunk 1 dựng **nền móng** của v8: chốt file 01, khung thư mục, cấu hình, quy ước ngày giờ, chuẩn hoá số điện thoại, lớp đọc ghi Google Sheets, toàn bộ luật gói học, luật gán tutor, và một bộ giả lập Google để test mà không cần tài khoản Google. Đây là phần khó và dễ sai nhất (ngày tháng, gói tính từ buổi đầu, nối tiếp, tạm khoá), nên làm trước và khoá bằng test. Chưa có giao diện; chưa cần tên miền hay Workspace.

## 2. File đã tạo

| File | Làm gì |
|---|---|
| `docs/01_QUYET_DINH_50_CAU.md` | Thêm dấu **ĐÃ CHỐT 05/10/2026 cho v8** ở đầu file |
| `CLAUDE.md` | Luật kỹ thuật, trỏ đúng đường dẫn v8 |
| `PROGRESS.md` | Bảng tiến độ 5 chunk, quyết định kỹ thuật, việc của chunk sau |
| `src/appsscript.json` | Múi giờ Hồ Chí Minh, bật Calendar nâng cao, web app chạy dưới `booking@`, mở cho mọi người |
| `src/Config.gs` | Toàn bộ khoá cấu hình theo file 01, đọc tab CONFIG bằng `cfg_()`, mã lý do từ chối và câu tiếng Việt |
| `src/Schema.gs` | Cấu trúc 11 tab, cột nào phải lưu dạng chữ, cột nào là ngày, các trạng thái |
| `src/Time.gs` | `getNow_()` có giả lập, 32 slot, hạn đặt, hạn huỷ, hạn tutor nộp lịch |
| `src/Phone.gs` | Chuẩn hoá số về `+84...`, link Zalo, link gọi |
| `src/Db.gs` | Đọc ghi Sheets theo tên cột, cache, khoá tự sinh, khoá chống ghi đồng thời |
| `src/Log.gs` | Ghi ACTIVITY_LOG |
| `src/Packages.gs` | Luật gói: chọn gói cho ngày, tính lại khi đặt hoặc huỷ, nối tiếp, tự kích hoạt, hết hạn, tạm khoá |
| `src/Assign.gs` | Luật gán tutor ngẫu nhiên trong nhóm ít buổi nhất tuần |
| `test/gas_mock.js` | Giả lập Sheets, Calendar, Gmail, Drive, khoá, cache |
| `test/load.js`, `test/fixtures.js` | Nạp code vào môi trường giả lập; dữ liệu mẫu đúng như file 03 |
| `test/unit.js`, `test/scenarios.js`, `test/harness.js` | 26 test hàm thuần; khung 40 kịch bản; chạy tất cả và ghi `test/REPORT.md` |

## 3. Các quyết định quan trọng và lý do

**1. Gói kiểu ngày có hai cách tính ngày bắt đầu (`start_source`).**
File 01 câu 1 nói gói tính từ buổi học đầu tiên; câu 6 nói gói mua thêm thì nối tiếp gói cũ; câu 3 nói gói để lâu thì tự kích hoạt. Ba luật này cho ba kiểu ngày bắt đầu khác nhau, nên mỗi gói lưu thêm một cột cho biết ngày bắt đầu đến từ đâu:
* `BOOKING`: ngày bắt đầu là ngày học sớm nhất đang có hiệu lực, tự tính lại khi đặt hoặc huỷ (đúng kịch bản B11, B12).
* `FIXED`: ngày bắt đầu cố định, không đổi khi huỷ buổi.

**2. Buổi mới không được đẩy buổi cũ ra ngoài hạn.** Ví dụ gói 2 tuần đã có buổi 30/10, học viên đặt thêm 14/10: nếu chấp nhận thì gói tính từ 14/10, hết 27/10, buổi 30/10 thành ngoài hạn. Hệ thống từ chối với lý do "ngày nằm ngoài thời hạn gói". Tình huống này file 01 chưa nói, mình chọn cách an toàn cho học viên (test U23).

**3. Giả lập thời gian bị khoá ở PRODUCTION.** v6 cho phép bật giả lập ở mọi nơi; nếu quên tắt trên hệ thống thật thì mọi hạn 15:00 sai. v8 bỏ qua giả lập khi đang chạy PRODUCTION (test U04).

**4. Harness "trung thực" với Google Sheets.** Sheets thật tự đổi `+84912345678` thành số `84912345678` (mất dấu cộng) và đổi `19:00` thành giờ, nếu ô không đặt định dạng chữ. Bộ giả lập làm y hệt, nên nếu code quên đặt định dạng, test sẽ đỏ ngay trên máy thay vì lỗi ngầm khi chạy thật (test U08, U09). Đây là bài học trực tiếp từ hotfix v6.0.1.

**5. Mọi đọc ghi Sheets đi qua một cửa (Db.gs).** Ghi theo tên cột thay vì số cột, nên admin chèn thêm cột ghi chú vào tab cũng không làm lệch dữ liệu. Cột ngày luôn ghi nửa đêm, đúng luật ngày tháng của v6.

## 4. So với plan (file 02), có gì thêm

| Thêm | Lý do |
|---|---|
| Cột `start_source` trong STUDENT_PACKAGES | Quyết định 1 ở trên |
| Cột `expiry_notice_at` trong STUDENT_PACKAGES | Đánh dấu đã gửi email sắp hết hạn, tránh gửi trùng (B15) |
| Cột `color_id` trong USERS | Màu sự kiện theo tutor trên lịch chung (plan 4.11) |
| Cột `decided_at`, `decided_by` trong AVAILABILITY; `admin_note` trong BOOKINGS | Ghi ai duyệt, lúc nào; ô để admin chọn tutor thay khi đổi tutor |
| Tab `MAIL_LOG` | Đếm số email mỗi ngày cho REPORT_MONTH (checklist D3) |

Không có thay đổi nào với luật nghiệp vụ trong file 01.

## 5. Cách anh tự kiểm tra (5 phút, không cần biết code)

1. Mở `test/REPORT.md`: phần "Hàm thuần và Db" phải 26/26 Đạt. 40 kịch bản đang ghi "Chưa cài (chunk 2 hoặc 3)", đúng kế hoạch.
2. Đối chiếu vài dòng với bảng phép tính ngày trong docs/00: U12 (Trial 14/10 đến 20/10), U16 (14 đến 27/10, rồi 16 đến 29/10), U18 (nối tiếp 26/10 đến 24/11), U19 (cộng bù thành 02/11), U20 (tự kích hoạt 09/11).
3. Nếu có máy cài Node: mở thư mục `thaiput_v8`, chạy `npm test`.

**Bằng chứng test không "dễ dãi":** mình đã cố tình sửa sai hai chỗ trong code (cho phép số bàn bắt đầu bằng 02; tính thừa 1 ngày hạn gói) và chạy lại: test lập tức đỏ đúng các mục U06, U12, U14, U16. Sau đó trả code về đúng.

## 6. Rủi ro còn lại

1. Chưa chạy trên Google thật; các điểm khác biệt sẽ được bắt ở checklist phần B sau khi anh có Workspace.
2. Học viên có hai gói cùng chưa kích hoạt (mua 2 gói liền khi chưa học buổi nào) thì gói thứ hai không tự nối tiếp gói đầu mà cũng chờ buổi học. Hiếm gặp; admin xử lý tay bằng cách sửa ngày trong Sheets. Ghi lại để quyết định sau.

## 7. Chunk tiếp theo

Chunk 2 viết lớp dịch vụ: đăng ký và duyệt, đặt và huỷ, lịch rảnh của tutor, xác nhận sau buổi, Calendar, email, các job tự động; cài 35 kịch bản đầu cuối. Đây là chunk nặng nhất.

<!-- END FILE: v8/history/CHUNK1_GIAI_THICH.md -->

---

## `v8/history/CHUNK2_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:00Z*

<!-- BEGIN FILE: v8/history/CHUNK2_GIAI_THICH.md | bytes=6465 | sha256=195d8e90abb5904760a375bbd2fe65feda7d9e3088d09ae7f1dffeaca824a05d | created=2026-10-29T14:41:00Z -->
# Chunk 2 · Giải thích: mình đã làm gì, vì sao, kiểm tra thế nào

*05/10/2026 · Thaiput v8 · Kết quả: 26/26 test hàm thuần và 35/35 kịch bản đầu cuối đạt (5 kịch bản còn lại thuộc chunk 3)*

## 1. Tóm tắt một đoạn

Chunk 2 viết toàn bộ **nghiệp vụ chạy thật**: học viên đăng ký kèm ảnh chuyển khoản và admin duyệt; đặt nhiều ngày một lần; huỷ; tutor mở và tắt slot, xin huỷ cần duyệt, đổi tutor hoặc huỷ khi không có người thay; tutor xác nhận kết quả buổi học; Google Calendar có Meet và thư mời; mọi email; các job tự động (nhắc 60 phút, tự từ chối yêu cầu huỷ, tự hoàn thành, chuyển trạng thái gói, nhắc tutor Chủ nhật). Code chạy được trên **cả Gmail thường lẫn Workspace**.

## 2. File đã tạo hoặc sửa

| File | Làm gì |
|---|---|
| `src/Registration.gs` | Kiểm tra form (ảnh, đồng ý, số điện thoại, Trial 1 lần), lưu ảnh vào Drive, mã chuyển khoản `TP R00001 1M`; duyệt tạo tài khoản, gói, khoản thu; từ chối |
| `src/Booking.gs` | Đặt nhiều ngày một lần, kết quả riêng từng ngày; huỷ của học viên; danh sách slot còn đặt được cho trang web |
| `src/Availability.gs` | Tutor mở và tắt slot; xin huỷ chờ duyệt; admin duyệt hoặc từ chối; đổi tutor hoặc huỷ khi không có người thay |
| `src/Sessions.gs` | Tutor chọn Hoàn thành, Vắng học viên, Vấn đề kỹ thuật; tự hoàn thành sau 24 giờ; lịch dạy của tutor |
| `src/CalendarSync.gs` | Tạo, đổi khách mời, huỷ sự kiện trên lịch chung; Meet tự tạo hoặc phòng cố định của tutor |
| `src/Notify.gs` | 17 mẫu email (tiếng Việt cho học viên và admin, tiếng Anh cho tutor), chân email có nút Zalo và số điện thoại admin |
| `src/Jobs.gs` | reminderJob (15 phút), hourlyJob, dailyJob, sundayRemind |
| `src/AdminOps.gs` | Tạm khoá, mở khoá (cộng bù ngày), admin huỷ, đổi tutor, vắng tutor, tính lương buổi kỹ thuật |
| `src/Config.gs`, `src/Schema.gs` | Thêm `MEET_MODE`, `MAIL_LOW_QUOTA_RESERVE`, cột `meet_room` |
| `test/scenarios.js` | Cài 35 kịch bản theo đúng file 03 |
| `CLAUDE.md` | Thêm luật 19 đến 21 |

## 3. Các quyết định quan trọng và lý do

**1. Chạy được bằng Gmail thường trước khi mua Workspace.**
* `MEET_MODE = AUTO` (mặc định): mỗi buổi một link Meet tự tạo. Nếu khi chạy thử, học viên bị bắt "xin tham gia" mà không ai duyệt, đổi ô này thành `TUTOR_ROOM` và điền link phòng Meet cố định của từng tutor vào cột `meet_room` trong USERS. Khi đó tutor là chủ phòng và tự duyệt được.
* Email chia hai mức ưu tiên. Email quan trọng (xác nhận, huỷ, đổi tutor, chào mừng, báo admin) luôn gửi. Email nhắc buổi và sắp hết hạn tự tạm bỏ khi hạn mức còn lại từ 15 trở xuống, và ghi vào log để admin biết.

**2. Ẩn danh sách khách mời trên sự kiện Calendar.** Mặc định Google Calendar cho khách mời thấy email của nhau, tức tutor sẽ thấy email học viên, trái câu 35. Mình tắt quyền này trên mọi sự kiện; test C23 bắt lỗi nếu ai bật lại.

**3. Gửi 2 slot cùng một ngày trong một lần thì từ chối cả hai** (đúng kịch bản C21), vì hệ thống không biết học viên muốn giữ slot nào.

**4. Lỗi Calendar không làm mất booking.** Nếu Google Calendar lỗi lúc tạo hoặc huỷ sự kiện, booking vẫn được ghi hoặc huỷ đúng, đồng thời admin nhận email "Lỗi hệ thống" kèm hướng dẫn xử lý tay. Lý do: mất booking của học viên nặng hơn thiếu một sự kiện trên lịch.

**5. Buổi "Vấn đề kỹ thuật" với gói Trial:** buổi được hoàn. Nếu đó là buổi duy nhất thì gói trở lại trạng thái chưa kích hoạt (ngày bắt đầu tính lại từ buổi học thật đầu tiên). Hệ quả này đúng theo câu 1 và câu 27 của file 01.

## 4. Một chỗ mình làm chặt hơn file 03

Kịch bản B16 (email nhắc) yêu cầu chạy lại lúc 18:15 và không gửi thêm. Khi tự kiểm tra, mình phát hiện mốc 18:15 nằm đúng mép cửa sổ nhắc, nên test sẽ đạt kể cả khi code bị lỗi gửi trùng. Mình **giữ nguyên** mốc 18:15 và thêm một lần chạy lúc 18:05. Không có kết quả mong đợi nào bị sửa.

## 5. Bằng chứng test không dễ dãi

Mình cố tình làm hỏng 5 chỗ, mỗi lần một chỗ, và chạy lại toàn bộ test:

| Lỗi cố tình | Test bắt được |
|---|---|
| Bỏ hạn đặt 15:00 | C19, C20, D29 |
| Cho khách mời thấy email của nhau | C23 |
| Email nhắc gửi trùng | B16 (sau khi thêm lần chạy 18:05) |
| Huỷ buổi mà không tính lại ngày của gói | B11, B12 |
| Bỏ hạn tutor nộp lịch | E32 |

Sau đó code được trả về đúng và chạy lại: 26/26 và 35/35 đạt.

## 6. Cách anh tự kiểm tra (5 phút)

1. Mở `test/REPORT.md`: 35 kịch bản Đạt, 5 kịch bản "Chưa cài (chunk 3)" là A05, A06, D30, E37, F40.
2. Đọc lướt `src/Notify.gs` phần tiêu đề email (dòng có `sendMail_(`) để xem câu chữ gửi học viên và tutor; muốn đổi câu chữ thì báo mình.
3. Mở `src/Config.gs`, tìm `MEET_MODE` và `MAIL_LOW_QUOTA_RESERVE`: hai khoá dùng khi chạy thử bằng Gmail thường.

## 7. Rủi ro còn lại

1. Chưa chạy trên Google thật: thư mời Calendar, quyền vào phòng Meet, email vào Spam hay không. Sẽ kiểm tra ở checklist phần B; riêng phần Meet trên Gmail thường đã có phương án dự phòng `TUTOR_ROOM`.
2. Thư mời Calendar gửi từ tài khoản hệ thống. Học viên dùng email không phải Gmail sẽ nhận thư mời dạng tệp lịch, vẫn thêm vào lịch được nhưng giao diện khác.

## 8. Chunk tiếp theo

Chunk 3: đăng nhập bằng link email, API cho trang web, menu và dropdown admin trên Sheets, báo cáo tháng, backup, cài đặt lần đầu (tự tạo file Sheets, lịch, thư mục, trigger), chuyển dữ liệu v6; cài 5 kịch bản còn lại.

<!-- END FILE: v8/history/CHUNK2_GIAI_THICH.md -->

---

## `v8/history/CHUNK3_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:01Z*

<!-- BEGIN FILE: v8/history/CHUNK3_GIAI_THICH.md | bytes=6903 | sha256=c1d6dd211b8d391afa43b27018e1a78275e06628f0af65bb6507b691e969efdc | created=2026-10-29T14:41:01Z -->
# Chunk 3 · Giải thích và báo cáo: mình đã làm gì, vì sao, kiểm tra thế nào

*05/10/2026 · Thaiput v8 · Kết quả: 26/26 hàm thuần, **40/40 kịch bản**, 11/11 test tích hợp đạt*

## 1. Báo cáo nhanh

| Phần | Đạt | Tổng | So với chunk 2 |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | giữ nguyên |
| 40 kịch bản (file 03) | **40** | 40 | +5 (A05, A06, D30, E37, F40) |
| Test tích hợp (mới) | 11 | 11 | mới |
| Lỗi thật phát hiện và đã sửa | 1 | | xem mục 4 |

Chi tiết từng dòng: `reports/REPORT_CHUNK3.md` (bản sao của `test/REPORT.md` lúc kết thúc chunk).

## 2. Tóm tắt một đoạn

Chunk 3 viết mọi thứ để hệ thống **tự đứng được trên Google**: đăng nhập bằng link email, lớp API cho trang web, menu và dropdown cho admin trên Sheets, báo cáo tháng (buổi dạy, lương, doanh thu, số email), sao lưu mỗi đêm, xuất CSV mỗi tuần, nút cài đặt lần đầu (tự tạo tab, cấu hình, gói, thư mục Drive, lịch Calendar, 8 trigger) và chuyển dữ liệu từ v6. Sau chunk này, chỉ còn thiếu giao diện (chunk 4).

## 3. File đã tạo hoặc sửa

| File | Làm gì |
|---|---|
| `src/Auth.gs` | Link đăng nhập 1 lần, 15 phút; phiên 30 ngày; chỉ lưu mã băm; giới hạn 3 lần xin link mỗi 15 phút; kiểm tra vai trò |
| `src/Api.gs` | `doGet` và 15 hàm cho trang web (công khai, học viên, tutor); lỗi bất ngờ trả câu chung và email admin |
| `src/Admin.gs` | Menu "thaiput"; dropdown Duyệt, Từ chối, Huỷ bởi admin, Đổi tutor, Vắng tutor, Tính lương; thêm tutor |
| `src/Report.gs` | Tab REPORT_MONTH: buổi và lương theo tutor, doanh thu theo gói, email theo ngày |
| `src/Backup.gs` | Sao lưu file DB mỗi đêm giữ 30 bản; CSV mỗi tuần giữ 8 tuần (bỏ tab AUTH) |
| `src/Setup.gs` | Cài đặt lần đầu, chạy lại an toàn; 8 trigger; kiểm tra hệ thống 15 hạng mục; chuyển sang PRODUCTION |
| `src/Migration.gs` | Chuyển tutor, học viên, số buổi còn lại, booking tương lai từ v6; có chạy thử |
| `src/Registration.gs` | Email chào mừng có link đăng nhập thật |
| `src/Config.gs`, `src/Schema.gs` | Mã lỗi đăng nhập; cột `rate_vnd`; sửa lỗi ô CONFIG (mục 4) |
| `test/scenarios.js`, `test/integration.js`, `test/gas_mock.js`, `test/harness.js` | 5 kịch bản cuối; 11 test tích hợp; giả lập HtmlService; báo cáo thêm phần tích hợp |
| `CLAUDE.md` | Thêm luật 22, 23 |

## 4. Lỗi thật mà bộ giả lập bắt được

Khi chạy "Cài đặt lần đầu" trên một file Sheets trống, hệ thống ghi giá trị mặc định vào tab CONFIG, trong đó có `SLOT_START = 08:00`. Google Sheets tự hiểu `08:00` là **giờ**, không phải chữ. Kết quả: hệ thống đọc ra một giá trị lạ, tính được **0 slot mỗi ngày**, không học viên nào đặt được buổi nào, mà không báo lỗi gì.

Lỗi này chỉ xảy ra trên Google thật. Bộ test bắt được vì bộ giả lập được viết để hành xử giống Sheets thật (luật 14 trong CLAUDE.md). Mình sửa ở hai lớp:
1. Cột `value` của tab CONFIG được đặt định dạng văn bản ngay khi cài đặt.
2. Hàm đọc cấu hình tự đổi ngược nếu ô đã lỡ bị Sheets đổi thành giờ (ví dụ admin gõ tay sau này).

Thêm vào đó, nút "Kiểm tra hệ thống" giờ báo lỗi ngay nếu số slot bằng 0.

## 5. Các quyết định quan trọng và lý do

**1. Mỗi môi trường là một file Sheets có Apps Script gắn kèm.** Bản chạy thử (STAGING) và bản thật (PRODUCTION) là hai file riêng, cùng một bộ code. Admin mở file nào thì thấy menu của file đó. Không bao giờ lẫn dữ liệu thử vào dữ liệu thật.

**2. Đăng nhập không cần mật khẩu.** Học viên và tutor nhập email, bấm link trong email là vào. Link dùng 1 lần, hết hạn sau 15 phút; phiên giữ 30 ngày. Người lạ nhập email bất kỳ chỉ thấy câu "nếu email hợp lệ, bạn sẽ nhận được link", không dò được ai là học viên.

**3. Học viên bị tạm khoá vẫn đăng nhập xem lịch được**, chỉ không đặt được (đúng brief mục 6 flow 6). Tài khoản bị vô hiệu hoá (DISABLED) thì không đăng nhập được.

**4. Chuyển dữ liệu v6 không trừ buổi hai lần.** v6 đã tính các buổi sắp tới vào "đã dùng". Các buổi đó được chuyển sang v8 và gắn vào gói cũ, nên mình cộng lại vào tổng số buổi. Ví dụ: học viên còn 7 buổi trên v6, có 2 buổi sắp tới; sau khi chuyển vẫn còn đúng 7 buổi (test I04).

**5. Thao tác admin để lại dấu vết.** Sau khi admin chọn một dropdown ở tab BOOKINGS, ô đó tự trống lại, cột `admin_note` ghi "Đã: Đổi tutor · 01/11/2026 09:00 · email admin", và ACTIVITY_LOG có một dòng ghi email admin. Trên Gmail thường, Google đôi khi không cho biết email người sửa; khi đó log ghi "ADMIN".

## 6. Bằng chứng test không dễ dãi

| Lỗi cố tình | Test bắt được |
|---|---|
| Bỏ phần sửa lỗi 08:00 trong CONFIG | I01, I04 |
| Không kiểm tra vai trò (tutor gọi được hàm học viên) | E37 |
| Link đăng nhập dùng lại được | A05 |
| Chuyển v6 trừ buổi hai lần | I04 |

Sau đó code được trả về đúng: 26/26, 40/40, 11/11.

## 7. Cách anh tự kiểm tra (5 phút)

1. Mở `reports/REPORT_CHUNK3.md`: ba phần đều đạt hết.
2. Đọc `src/Admin.gs` phần chú thích đầu file: đó là toàn bộ thao tác admin làm trên Sheets.
3. Đọc `src/Setup.gs` hàm `testSystem`: đây là danh sách hạng mục sẽ hiện khi anh bấm "Kiểm tra hệ thống" trên Google thật.

## 8. Rủi ro còn lại

1. **Đăng nhập khi nhúng trong Google Sites:** một số trình duyệt chặn bộ nhớ của trang nhúng, có thể phải đăng nhập lại mỗi lần mở. Chunk 4 làm thêm nút "Mở toàn màn hình" để dự phòng; checklist B11 kiểm tra thật.
2. Tab AUTH lớn dần (mỗi lần đăng nhập một dòng). Vài nghìn dòng chưa ảnh hưởng tốc độ; khi cần sẽ thêm việc dọn dòng hết hạn vào dailyJob.
3. Chưa chạy trên Google thật. Hướng dẫn chạy thử bằng Gmail thường từng bước nằm ở chunk 5.

## 9. Chunk tiếp theo

Chunk 4: giao diện 4 màn hình (trang chủ và đăng ký, đăng nhập, cổng học viên, cổng tutor tiếng Anh), ưu tiên điện thoại, và một bản demo dữ liệu giả để anh bấm thử ngay trên điện thoại.

<!-- END FILE: v8/history/CHUNK3_GIAI_THICH.md -->

---

## `v8/history/CHUNK4_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:02Z*

<!-- BEGIN FILE: v8/history/CHUNK4_GIAI_THICH.md | bytes=8434 | sha256=a6d7faa649e9cab3e6a1ae7921c592efe33aa23c657192e38cd44b2f727f8611 | created=2026-10-29T14:41:02Z -->
# Chunk 4 · Giao diện web: làm gì, vì sao, kiểm tra thế nào

*Ngày 05/10/2026. Đọc file này cùng `reports/REPORT_CHUNK4.md` (kết quả test) và bản demo.*

## 1. Chunk 4 làm gì

Chunk 1 đến 3 làm phần "bộ não" (luật đặt lịch, Sheets, Calendar, email, đăng nhập). Chunk 4 làm phần học viên và tutor nhìn thấy và bấm vào: một trang web duy nhất, mở trên điện thoại là dùng được, có 4 màn hình.

| Màn hình | Ai dùng | Làm được gì |
|---|---|---|
| Trang chủ | Khách mới | Xem 3 gói và giá, điền form đăng ký, tải ảnh chuyển khoản, nhận mã nội dung chuyển khoản (ví dụ `TP R00012 1M`) |
| Đăng nhập | Học viên, tutor | Nhập email, nhận link đăng nhập qua email (không mật khẩu), bấm link là vào |
| Cổng học viên (tiếng Việt) | Học viên | Thẻ gói (còn hạn tới ngày nào); tab Đặt lịch (chọn giờ, mỗi ngày 1 buổi, đặt nhiều ngày một lần); tab Lịch của tôi (vào phòng Meet, huỷ trước 15:00 hôm trước, lịch sử); tab Tài khoản (sửa tên, số Zalo, gia hạn gói) |
| Cổng tutor (tiếng Anh) | Tutor | Lịch dạy sắp tới; mở hoặc đóng slot theo tuần (32 ô giờ mỗi ngày, chép một ngày sang cả tuần); xin huỷ slot đã có học viên (chờ admin duyệt); xác nhận kết quả sau buổi học |

Màn hình nào cũng có nút "Nhắn Zalo admin", "Gọi admin" và số admin hiện thành chữ để chép được.

## 2. File mới và file đổi

| File | Nội dung |
|---|---|
| `src/ui/Index.html` | Khung trang. doGet đưa vào trang cần mở và token link đăng nhập |
| `src/ui/Styles.html` | Toàn bộ giao diện: màu xanh lá thaiput, vàng kim làm điểm nhấn, chế độ sáng và tối tự theo điện thoại, ô giờ dạng thẻ |
| `src/ui/App.html` | Lõi: gọi máy chủ, giữ phiên đăng nhập, hộp thoại xác nhận, thông báo nhỏ, kiểm tra số điện thoại ngay khi gõ, thu nhỏ ảnh trước khi gửi |
| `src/ui/Home.html`, `Login.html`, `Student.html`, `Tutor.html` | 4 màn hình ở mục 1 |
| `src/Api.gs` | Thêm `bootJson_()` (lọc tham số URL), sửa chữ trạng thái "Chờ tutor xác nhận" |
| `test/ui.js` | 17 test giao diện (U01 đến U17) |
| `test/gas_mock.js`, `test/load.js` | HtmlService giả lập giờ đọc file HTML thật và xử lý scriptlet như Google |
| `test/harness.js`, `package.json` | `npm test` chạy thêm phần giao diện; cần gói `jsdom` (chỉ dùng để test, không lên Google) |
| `test/build_demo.js`, `demo/demo_mock.js`, `demo/thaiput_demo.html` | Bản demo |

## 3. Vì sao làm như vậy

1. **Một trang, 4 màn hình, chuyển bằng code thay vì tải trang mới.** Trên Google Sites, mỗi lần tải lại trang web Apps Script mất 1 đến 3 giây. Chuyển màn hình trong trang thì gần như tức thì.
2. **Không dùng hộp thoại `alert` hay `confirm` của trình duyệt.** Khi nhúng trong Google Sites, trình duyệt có thể chặn chúng. Mọi xác nhận (huỷ buổi, xin huỷ slot) dùng hộp thoại trượt từ dưới lên do trang tự vẽ.
3. **Phiên đăng nhập có 3 lớp dự phòng.** Ưu tiên bộ nhớ lâu dài của trình duyệt; nếu Google Sites chặn (Safari hay chặn trong khung nhúng) thì dùng bộ nhớ theo tab; nếu vẫn chặn thì giữ trong trang và hiện cảnh báo "có thể phải đăng nhập lại". Trang không bao giờ trắng vì chuyện này.
4. **Trình duyệt không bao giờ gửi mã học viên hay tutor.** Chỉ gửi token phiên; máy chủ tự biết là ai (luật 6 trong CLAUDE.md). Học viên sửa code trên máy mình cũng không đặt hộ người khác được.
5. **Mọi chữ do người dùng nhập đều được "thoát" trước khi hiện.** Ai đó đặt tên là một đoạn mã thì trang hiện nguyên văn đoạn mã, không chạy nó (U11).
6. **Ô giờ dùng font đơn cách, chữ tiếng Việt dùng Be Vietnam Pro.** Giờ thẳng hàng dễ quét mắt; tiếng Việt có dấu luôn đúng.

## 4. Test giao diện chạy thế nào (điểm quan trọng nhất của chunk 4)

Test không kiểm tra từng hàm giao diện riêng lẻ mà mô phỏng đúng đường đi thật:

1. `doGet()` dựng trang từ đúng các file `ui/*.html` như Google làm.
2. Trang chạy trong jsdom (một trình duyệt giả lập trong Node).
3. `google.script.run` được nối vào các hàm `api*` thật, dữ liệu là bộ mẫu của 40 kịch bản.
4. Test "bấm" như người thật: gõ email, chọn giờ, bấm Đặt, bấm Huỷ, rồi kiểm tra trong Sheets giả lập và Calendar giả lập.

Cầu nối còn bắt chước một giới hạn ít người biết của Apps Script: nếu máy chủ trả về có kiểu ngày giờ (Date), trình duyệt nhận được `null` và trang hỏng im lặng. Test M2 chứng minh lỗi này bị bắt ngay.

Danh sách 17 test và kết quả: `reports/REPORT_CHUNK4.md`.

## 5. Bản demo

`demo/thaiput_demo.html` (đã đăng thành trang xem được trên điện thoại). Demo dùng **đúng** các file `ui/*.html` của sản phẩm, chỉ thay máy chủ bằng dữ liệu giả trong trình duyệt. Sửa giao diện thật rồi chạy `node test/build_demo.js` là demo cập nhật theo.

Thanh trên cùng của demo có 3 nút Khách, Học viên, Tutor và nút "Làm mới dữ liệu". Demo không gửi email, link Meet trỏ về trang chủ Google Meet.

Khác biệt giữa demo và bản thật: demo kiểm tra luật ở mức đủ để bấm thử (hạn 15:00, 1 buổi mỗi ngày, gói còn hạn). Bản thật kiểm tra toàn bộ luật ở máy chủ như 40 kịch bản.

## 6. Anh tự kiểm tra thế nào

**Trên điện thoại (5 phút, với bản demo):**

1. Bấm **Khách**: thấy 3 gói và giá. Gõ số `12345` vào ô điện thoại, chữ gợi ý chuyển đỏ ngay.
2. Bấm **Học viên**: chọn 2 giờ ở 2 ngày khác nhau, rồi bấm thêm một giờ khác trong ngày đã chọn: giờ cũ tự bỏ (mỗi ngày 1 buổi). Bấm "Đặt 2 buổi".
3. Tab **Lịch của tôi**: buổi 21:00 ngày mai có nút Huỷ nếu bây giờ trước 15:00; sau 15:00 nút biến mất và ghi "Hạn huỷ đã qua".
4. Bấm **Tutor**, tab **Availability**: bấm một ô trống, thanh "1 change" hiện lên, bấm Save. Bấm một ô đã có học viên (viền xanh): hiện hộp thoại xin huỷ.
5. Đổi điện thoại sang chế độ tối: giao diện tự đổi màu, chữ vẫn đọc rõ.

**Trên máy có Node (1 phút):** trong thư mục repo chạy `npm install` rồi `npm test`. Kết quả phải là 26/26, 40/40, 11/11, 17/17.

## 7. Rủi ro còn lại

| Rủi ro | Mức | Xử lý |
|---|---|---|
| Safari trên iPhone chặn lưu đăng nhập khi trang nhúng trong Google Sites | Trung bình | Đã có dự phòng và cảnh báo; email link đăng nhập mở trang web toàn màn hình nên phiên vẫn giữ. Kiểm tra thật ở checklist B11 |
| Giao diện chưa chạy trên Google thật (chỉ jsdom và Chromium) | Trung bình | Chunk 5 có hướng dẫn deploy staging và danh sách bấm thử trên điện thoại thật |
| Font Google không tải được ở mạng chậm | Thấp | Đã khai báo font dự phòng có hỗ trợ tiếng Việt và tiếng Thái |
| Học viên mua 2 gói chưa kích hoạt liền nhau, gói thứ hai không tự nối | Thấp | Như ghi chú chunk 3: admin xử lý tay, hiếm gặp |

## 8. Phương án khác anh có thể chọn

1. **Tutor cũng dùng tiếng Việt** nếu tutor của thaiput đọc được tiếng Việt: đổi chữ trong `Tutor.html`, khoảng 20 phút.
2. **Tách trang đăng ký ra Google Form** thay vì form trên web: dễ sửa câu hỏi hơn nhưng mất kiểm tra số điện thoại ngay khi gõ và mã chuyển khoản tức thì. Không khuyên.
3. **Thêm lịch dạng lưới tuần cho học viên** (giống Google Calendar) thay cho danh sách ngày: đẹp trên máy tính nhưng chật trên điện thoại. Có thể làm sau khi chạy thử vài tuần nếu học viên yêu cầu.

<!-- END FILE: v8/history/CHUNK4_GIAI_THICH.md -->

---

## `v8/history/CHUNK5_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:03Z*

<!-- BEGIN FILE: v8/history/CHUNK5_GIAI_THICH.md | bytes=7751 | sha256=0dbf5b696ddac7af23fe2dfb006cfd9ab8835505bee284a9df4e92f9af2be86a | created=2026-10-29T14:41:03Z -->
# Chunk 5 · Soát độc lập, sửa lỗi, đóng gói để anh chạy thử bằng Gmail thường

*Ngày 05/10/2026. Đây là chunk cuối của v8. Kết quả test chi tiết: `reports/REPORT_CHUNK5.md`.*

## 1. Chunk 5 làm gì

1. **Soát code độc lập 2 lượt.** Một agent không tham gia viết code đọc toàn bộ hệ thống. Agent đó chỉ tìm chỗ sẽ hỏng trên Google thật mà bộ giả lập không lộ ra, nhất là khi chạy bằng Gmail thường. Lượt 2 kiểm lại chính các bản sửa.
2. **Sửa 16 lỗi** tìm được. Trong đó 2 lỗi nghiêm trọng mà mọi test cũ đều không bắt được (mục 2).
3. **Đóng gói bản dán tay** `dist/`: anh không cần cài gì, chỉ dán 3 file vào trình soạn Apps Script (bản 09/10; bản đầu là 9 file).
4. **Viết 2 hướng dẫn:**
   * `HUONG_DAN_CHAY_THU_GMAIL.md`: chạy thử ngay hôm nay;
   * `CHUYEN_SANG_WORKSPACE.md`: chuyển khi đã mua, có đường mang theo học viên và buổi học thật.
5. **Thêm 3 công cụ vận hành vào menu:**
   * chuyển dữ liệu từ v6 (chạy thử rồi chạy thật);
   * gỡ và tạo lại sự kiện Calendar khi đổi tài khoản.

## 2. Vì sao test cũ xanh mà vẫn có lỗi nghiêm trọng

Bộ giả lập Google (test/gas_mock.js) cũ "dễ tính" hơn Google thật ở 2 chỗ:

1. **Số hàng của tab.**
   * Google thật: tab mới chỉ có 1.000 hàng, ghi vượt là báo lỗi.
   * Bộ giả lập cũ: tự thêm hàng.
   * Hậu quả: bước Cài đặt lần đầu sẽ chết ngay trên Google thật. Nếu vá được bước đó, vài tuần sau khi nhật ký đủ 1.000 dòng, mọi thao tác ghi sẽ lỗi.
2. **Ai gọi được hàm nào.**
   * Trang web mở cho "Bất kỳ ai" thì trình duyệt gọi được mọi hàm không có dấu `_` ở cuối, kể cả "Tạo lại trigger", "Chuyển sang PRODUCTION", "Sao lưu".
   * Người biết mở bảng điều khiển của trình duyệt có thể xoá trigger hoặc xoá dần bản sao lưu.

Cách làm ở chunk 5 (đúng luật 14 và 15 của CLAUDE.md):
1. sửa bộ giả lập cho giống Google;
2. chạy lại để lỗi hiện đỏ;
3. sửa code;
4. viết test mới (I12 đến I21);
5. cài lại lỗi cố ý để chứng minh test bắt được (10/10).

## 3. Thay đổi chính, giải thích bằng lời thường

| Thay đổi | Lợi ích cho anh |
|---|---|
| Tab tự thêm 500 hàng khi sắp đầy, kèm dropdown | Không bao giờ "đầy" |
| Hàm vận hành chỉ chạy khi là trigger của hệ thống, chủ file hoặc admin; riêng cài đặt và tạo trigger chỉ chủ file | Người lạ không phá được; không thể vô tình có 2 bộ trigger gửi email trùng |
| Ô tên, email, ghi chú lưu dạng chữ; chữ bắt đầu bằng `=` không bao giờ thành công thức | Không ai chèn được công thức lấy trộm danh sách học viên khi admin mở file |
| Gửi email hỏng không làm hỏng việc đặt lịch; email lỗi cho admin tối đa 1 lần mỗi giờ | Hợp với hạn mức 100 email mỗi ngày của Gmail thường |
| Form đăng ký: tối đa 20 lượt mỗi giờ, ô ẩn bẫy máy spam | Gmail của trường không bị biến thành máy gửi spam |
| Dòng mới gom lại ghi một lần | Tutor lưu cả tuần (192 slot) chỉ còn 12 lần ghi Sheets thay vì 960, học viên khác không bị "hệ thống bận" |
| Ghi buổi học xuống Sheets trước khi gửi thư mời Calendar | Không có thư mời "ma" nếu Google dừng giữa chừng |
| Link đăng nhập luôn là link `/exec` | Học viên bấm link trong email là vào được |
| Dropdown "Đổi tutor", "Huỷ bởi admin" nhận việc trong khoá | Không bao giờ xử lý 2 lần |

## 4. File mới và file đổi trong chunk 5

| File | Nội dung |
|---|---|
| `HUONG_DAN_CHAY_THU_GMAIL.md` | Từng bước từ file Sheets trống đến chạy thử trên điện thoại, kèm bảng khác biệt Gmail và Workspace |
| `CHUYEN_SANG_WORKSPACE.md` | 2 đường chuyển, có bảng 13 bước mang theo dữ liệu thật |
| `README.md` | Bản đồ repo: đọc gì trước, thư mục nào chứa gì |
| `dist/` (3 file) | Bản dán tay: `Code.gs` gộp 23 file, `appsscript.json`, `Index.html` gộp 7 file giao diện |
| `src/Db.gs` | Ghi theo lô, tự thêm hàng, chống công thức, khoá gọi lồng |
| `src/Auth.gs` | `requireOperator_`, `requireOwner_` |
| `src/Schema.gs`, `src/Config.gs` | Cột chữ mới; khoá `BOOKING_HORIZON_DAYS`, `REG_MAX_PER_HOUR`; mã `BUSY`, `TOO_FAR` |
| `src/Notify.gs`, `src/Jobs.gs`, `src/Api.gs`, `src/Registration.gs`, `src/Booking.gs`, `src/Availability.gs`, `src/AdminOps.gs`, `src/CalendarSync.gs`, `src/Setup.gs`, `src/Admin.gs` | Các bản sửa ở mục 3, menu chuyển dữ liệu v6 và chuyển tài khoản |
| `src/ui/Home.html`, `Student.html`, `Tutor.html`, `Styles.html` | Ô ẩn bẫy spam, ô số điện thoại khi gia hạn, câu báo slot quá xa |
| `test/gas_mock.js` | Giống Google hơn: giới hạn hàng, dấu nháy, công thức, chủ file, mã trigger, khoá bận |
| `test/integration.js` | I12 đến I21 |
| `test/scenarios.js` | F40 đặt giá trị dropdown trước khi gọi xử lý, như admin chọn thật (không đổi kết quả mong đợi) |
| `test/build_dist.js`, `test/load.js` | Dựng `dist/` từ chính code đã test |
| `CLAUDE.md` | Luật 24 đến 28 |

## 5. Anh tự kiểm tra thế nào

1. Làm theo `HUONG_DAN_CHAY_THU_GMAIL.md`, mục 1 đến 7. Mục 7 là danh sách bấm thử có kết quả mong đợi từng bước.
2. Ba điểm chỉ kiểm được trên Google thật, cần anh ghi lại kết quả:
   * học viên có vào thẳng phòng Meet không (mục 7 bước 5);
   * đóng trình duyệt mở lại còn đăng nhập không (bước 3);
   * gõ thử tên `=1+1` khi đăng ký rồi xem tab REGISTRATIONS: phải hiện đúng chữ `=1+1`, không phải số 2.
3. Trên máy có Node: `npm install` rồi `npm test` phải ra 26/26, 40/40, 21/21, 17/17.

## 6. Rủi ro còn lại

| Rủi ro | Mức | Xử lý |
|---|---|---|
| Gmail thường bắt học viên chờ duyệt khi vào Meet | Trung bình | `MEET_MODE = TUTOR_ROOM` (hướng dẫn mục 7 bước 5); hết hẳn khi lên Workspace |
| Hạn mức 100 email mỗi ngày khi pilot quá 25 học viên học đều | Trung bình | Email nhắc tự bỏ trước; theo dõi dòng "Email còn gửi được hôm nay"; chuyển Workspace |
| Safari chặn lưu đăng nhập trong Google Sites | Thấp | Link trong email mở thẳng `/exec`; có cảnh báo trên trang |
| Tab AUTH và nhật ký lớn dần | Thấp | Ổn 1 đến 2 năm; thêm dọn định kỳ khi cần |
| Chưa chạy trên Google thật | Trung bình | Đây chính là mục đích buổi chạy thử. Lỗi lạ: chép dòng lỗi trong mục Lần thực thi gửi Claude |

## 7. Phương án khác anh có thể chọn

1. **Chạy thử bằng clasp thay vì dán tay** (hướng dẫn mục 2, đoạn cuối): sửa code về sau nhanh hơn, cần cài Node.
2. **Bỏ qua pilot Gmail, mua Workspace ngay rồi làm Đường 1 của hướng dẫn chuyển:** đỡ một lần chuyển, đổi lại mất 2 ngày thử miễn phí. Nếu đã chắc chắn mua thì đây là đường ngắn nhất.
3. **Pilot với vài học viên thân quen trước khi mở cho tất cả:** giữ v6 chạy song song tuần đầu, chỉ chuyển dữ liệu v6 khi checklist phần B đã xanh.

<!-- END FILE: v8/history/CHUNK5_GIAI_THICH.md -->

---

## `v8/history/CHUNK5A_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:03Z*

<!-- BEGIN FILE: v8/history/CHUNK5A_GIAI_THICH.md | bytes=5518 | sha256=37ee01aaecf814f08ccfc3c47d1c7be98c2b3967b8169d908a653a776602037f | created=2026-10-29T14:41:03Z -->
# Sub-chunk 5A · Đăng nhập, phiên, quyền, dữ liệu nền

*Ngày 13/10/2026. Phiên bản 8.0.2. Kết quả test: `reports/REPORT_CHUNK5A.md`. Kế hoạch tổng: `KE_HOACH_CHUNK5_MO_RONG.md`.*

## 1. Cập nhật lên STAGING (10 phút)

1. Trong trình soạn Apps Script, dán đè **`Code.gs`** và **`Index.html`** bằng 2 file mới, rồi lưu.
2. **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai.**
3. **Bắt buộc:** trong Sheets chạy menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Bước này thêm:
   * cột `use_count` vào tab AUTH;
   * 2 khoá mới vào CONFIG: `LOGIN_LINK_MAX_USES`, `LOGIN_LINK_WINDOW_MINUTES`.

   Ô `ASSIGN_STRATEGY` cũ (`RANDOM_LEAST_LOADED`) chỉ để ghi nhớ, code không đọc. Anh có thể sửa thành `ROUND_ROBIN_LEAST_LOADED` cho khớp.

   Bỏ qua bước này thì đăng nhập sẽ báo lỗi "Tab AUTH thiếu cột use_count".
4. Chạy menu **2. Kiểm tra hệ thống**: KHÔNG CÓ LỖI.

## 2. Thay đổi và cách tự kiểm tra

| Thay đổi | Anh tự kiểm tra |
|---|---|
| **Nhiều admin ngang quyền.** CONFIG `ADMIN_EMAIL` nhận nhiều địa chỉ cách nhau dấu phẩy. Menu **Thêm admin** tạo tài khoản role ADMIN trong USERS. Mọi email hệ thống gửi cho tất cả admin trong cùng 1 email. | Thêm admin thứ 2 bằng menu; chia sẻ file Sheets cho email đó (Người chỉnh sửa); gửi một đăng ký thử: cả 2 admin nhận "[Đăng ký mới]" |
| **Link đăng nhập dùng nhiều lần trong 15 phút.** `LOGIN_LINK_MAX_USES = 0` là không giới hạn; điền `2` nếu muốn đúng 2 lần. | Bấm link trong email 2 lần trên 2 trình duyệt: cả 2 vào được |
| **Làm mới trang không mất đăng nhập.** Vào xong, địa chỉ trang tự đổi từ `...page=auth&t=...` thành `...page=student`. | Vào bằng link, bấm làm mới: vẫn ở cổng học viên |
| **Mỗi tab một tài khoản.** | Tab 1 đăng nhập học viên. Mở tab 2, đăng xuất, đăng nhập tutor. Quay lại tab 1, làm mới: vẫn là học viên |
| **Xin link quá nhiều.** 3 lần mỗi 5 phút, báo "thử lại sau 5 phút". | Bấm "Gửi link" 4 lần liền |
| **Gửi link hàng loạt.** Menu **Gửi link đăng nhập (các dòng đang chọn ở USERS)**. Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều dòng rời nhau. Admin và tài khoản DISABLED tự bỏ qua. | Chọn 3 dòng, chạy menu: hộp thoại liệt kê ai đã nhận |
| **Số điện thoại không bắt buộc.** Nhận số Việt Nam (lưu `+84...`) và số nước ngoài bắt đầu bằng `+` và mã nước (ví dụ `+66 81 234 5678`). Nút Zalo trong cột `contact_link` chỉ có với số Việt Nam. | Đăng ký thử không điền số, và với `+66 81 234 5678` |
| **Chia tutor xoay vòng.** Trong nhóm ít buổi nhất tuần, người lâu nhất chưa được giao buổi mới được chọn. Không còn may rủi. | Hai tutor cùng mở một khung giờ; đặt 4 buổi liên tiếp: chia 2 và 2, xen kẽ |
| **Slot tutor xin huỷ đã duyệt bị khoá (BLOCKED).** Áp dụng khi slot đang có học viên và admin chọn Duyệt. Không ai đặt được giờ đó với tutor này, tutor không tự mở lại (ô gạch đỏ "Blocked"). Admin mở lại bằng cách sửa cột `status` của dòng đó trong AVAILABILITY thành `OPEN`. | Tutor xin huỷ một buổi đã có học viên, admin Duyệt: cổng tutor hiện ô đỏ, bấm vào báo đã khoá |
| **Bỏ nút gọi điện** trên web và trong email. Chỉ còn "Nhắn Zalo admin" và "Website". Số admin vẫn ở CONFIG `ADMIN_PHONE` để admin tự dùng. | Mở cổng học viên và một email bất kỳ |
| **Bấm logo "thaiput" về trang chủ.** | Bấm logo ở cổng học viên |
| **Đổi chữ** "Xin link mới" thành "Yêu cầu gửi lại liên kết đăng nhập mới". | Mở lại một link đã hết hạn |

## 3. Thay đổi quyết định đã ghi lại

* File `docs/01_QUYET_DINH_50_CAU.md`: câu 18, 32, 33, 42, cộng mục "Thay đổi ngày 13/10/2026".
* File `docs/03_KICH_BAN_TEST_40.md`: A02, A05, A06, C25 có nhãn "[đổi 13/10]". Kết quả mong đợi đổi theo yêu cầu của anh, không phải để test qua (CLAUDE.md luật 15).

## 4. Rủi ro còn lại

* **Bỏ mã khỏi địa chỉ trang** dùng `google.script.history.replace` của Apps Script. Test giả lập đạt, nhưng cần anh kiểm trên điện thoại thật (bước làm mới ở mục 2).
* **Mỗi tab một phiên** dựa vào bộ nhớ theo tab của trình duyệt. Trong Google Sites nếu trình duyệt chặn bộ nhớ, trang tự giữ phiên trong trang như trước, nhưng làm mới thì phải đăng nhập lại.
* **Admin mới phải được chia sẻ file Sheets** thì mới dùng được menu. Thêm vào USERS chỉ giúp họ nhận email và (sau 5E) vào giao diện admin.

## 5. Tiếp theo: sub-chunk 5B

Nhắc 8:00 sáng ngày học; báo các admin khi tutor chưa nộp lịch Chủ nhật; báo admin khi học viên huỷ và khi tutor chọn kết quả; link trong email admin mở thẳng đúng dòng trong Sheets; admin luôn vào được phòng Meet; dropdown xử lý tutor xin huỷ 4 lựa chọn và cột kết quả; tô màu việc chờ duyệt.

<!-- END FILE: v8/history/CHUNK5A_GIAI_THICH.md -->

---

## `v8/history/CHUNK5B_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:05Z*

<!-- BEGIN FILE: v8/history/CHUNK5B_GIAI_THICH.md | bytes=4943 | sha256=48f1a7f3cb9a6c074bb6941ff100b8ec6a59d4aea4f586f69ee22213fc78d191 | created=2026-10-29T14:41:05Z -->
# Sub-chunk 5B · Thông báo theo mức, job, chịu tải

*Ngày 13/10/2026. Phiên bản 8.0.3, giao cùng 5C (8.0.4) trong một lần dán. Kết quả test: `reports/REPORT_CHUNK5B.md`. Kế hoạch: `KE_HOACH_CHUNK5_V2.md`.*

## 1. Cập nhật lên STAGING một lần cho cả 5B và 5C (15 phút)

1. Trong trình soạn Apps Script, dán đè **`Code.gs`** và **`Index.html`** bằng 2 file mới, rồi lưu.
2. **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai.**
3. **Bắt buộc:** trong Sheets chạy menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Bước này:
   * tạo 4 tab mới: NOTIFICATIONS, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES, và điền sẵn nội dung gốc;
   * thêm cột `admin_note`, `outcome` vào AVAILABILITY và `day_reminder_at` vào BOOKINGS;
   * thêm khoá CONFIG mới: `MORNING_REMINDER_HOUR`, `DIGEST_HOUR`, `ADMIN_JOIN_MEET`;
   * cài tô màu và ô tick.

   Bỏ qua bước này thì hệ thống báo lỗi "thiếu cột" ngay lần đặt lịch đầu tiên.
4. Tab CONFIG, dòng **`ADMIN_EMAIL`**: ghi **đúng một địa chỉ** (hoặc nhóm `admin@` khi lên Workspace). Từ bản này chỉ địa chỉ đó nhận email hệ thống.
5. Tab USERS: tài khoản admin dự phòng đặt cột `status` là `DISABLED`.
6. Chạy menu **2. Kiểm tra hệ thống**: KHÔNG CÓ LỖI.

Không cần tạo lại trigger: nhắc 8:00, tổng hợp 21:00, cảnh báo Chủ nhật chạy trong job mỗi giờ đã có.

## 2. Thay đổi và cách tự kiểm tra

| Thay đổi | Anh tự kiểm tra |
|---|---|
| **Một địa chỉ admin nhận email.** Tài khoản role ADMIN trong USERS có quyền, không nhận email | Học viên huỷ một buổi: chỉ `ADMIN_EMAIL` nhận "[Cần xử lý] ..." |
| **Tab NOTIFICATIONS**: mọi sự kiện admin cần biết, mỗi sự kiện 1 dòng, tô đỏ (khẩn), vàng (cần xử lý), xanh (đã đọc khi tick cột `read`) | Sau bước trên, mở tab: thấy dòng STUDENT_CANCELLED màu vàng. Tick ô `read`: thành xanh |
| **Tab NOTIFY_RULES**: mỗi sự kiện chọn mức và kênh. EMAIL = email ngay; DIGEST = gom vào email tổng hợp 21:00; LOG = chỉ ghi tab | Đổi STUDENT_CANCELLED sang LOG, huỷ thử một buổi: không có email, tab NOTIFICATIONS vẫn có dòng |
| **Mặc định**: email ngay khi học viên huỷ, tutor báo lỗi kỹ thuật, đăng ký mới, tutor xin huỷ, tutor chưa nộp lịch, lỗi hệ thống, lỗi Calendar. Vào tổng hợp: Completed, tự hoàn thành, học viên vắng, đổi tutor | Tutor bấm Completed: không có email ngay; 21:00 có email "[Tổng hợp ...]" |
| **Link mở đúng dòng**: nút trong email admin mở thẳng tab và dòng liên quan | Bấm nút trong email "[Cần xử lý]": Sheets mở đúng dòng BOOKINGS |
| **Nhắc 8:00 sáng ngày học**: mỗi học viên và tutor có buổi trong ngày nhận 1 email liệt kê | Đặt một buổi tối mai; sáng mai sau 8:00 kiểm hộp thư |
| **Cảnh báo Chủ nhật**: sau `TUTOR_DEADLINE_HOUR` Chủ nhật, admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau | Bật giả lập thời gian (menu Test) tới Chủ nhật 15:30, chạy job mỗi giờ |
| **Admin vào được mọi phòng Meet**: `ADMIN_EMAIL` được thêm làm khách mà không gửi thư mời. Buổi hiện trên lịch của admin | Đặt một buổi: lịch Google của `ADMIN_EMAIL` có buổi đó; hộp thư admin **không** có thư mời mới. Đây là điểm phải kiểm trên Google thật |
| **Tutor xin huỷ: 4 lựa chọn** ở cột `admin_decision` (AVAILABILITY): Duyệt, tự chọn tutor thay / Duyệt, chỉ định tutor thay / Duyệt, huỷ buổi / Từ chối. Chỉ định: ghi mã tutor (ví dụ `T002`) vào `admin_note` trước khi chọn. Kết quả ghi ở cột `outcome` | Tutor xin huỷ slot đã có học viên; ghi `T002` vào `admin_note`, chọn "Duyệt, chỉ định tutor thay": `outcome` ghi "Đã đổi sang T002" |
| **Đặt lịch chịu tải tốt hơn**: Calendar được gọi ngoài khoá, người khác không phải chờ | Không cần kiểm tay; test I32 đo |

## 3. Rủi ro còn lại
* **Thêm admin vào sự kiện "không gửi thư"**: giả lập đúng, Google thật cần anh xác nhận ở bước kiểm Meet trên.
* **Email tổng hợp gửi từ 21:00 đến 21:59** (job chạy mỗi giờ, giờ chạy chính xác do Google chọn).
* **Hạn mức email:** mô phỏng ở `KE_HOACH_CHUNK5_V2.md` mục 3: khoảng 190 đến 210 người nhận mỗi ngày ở 100 học viên. Gmail thường (100) không đủ.

## 4. Tiếp theo
Xem `CHUNK5C_GIAI_THICH.md` (cùng lần dán này), rồi sub-chunk 5D: đăng nhập chuyên nghiệp cho tutor và admin.

<!-- END FILE: v8/history/CHUNK5B_GIAI_THICH.md -->

---

## `v8/history/CHUNK5C_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:05Z*

<!-- BEGIN FILE: v8/history/CHUNK5C_GIAI_THICH.md | bytes=6540 | sha256=86c9801578615593522b0422d39c00a50c7bea5e46ca275b15a6d78cc7f7d32e | created=2026-10-29T14:41:05Z -->
# Sub-chunk 5C · Chữ trên web và email sửa trực tiếp trên Sheets, song ngữ

*Ngày 13/10/2026. Phiên bản 8.0.4. Kết quả test: `reports/REPORT_CHUNK5C.md`. Cập nhật lên STAGING: mục 1 của `CHUNK5B_GIAI_THICH.md` (một lần dán cho cả 5B và 5C).*

## 1. Hai tab mới anh sửa trực tiếp

| Tab | Chứa gì | Sửa ở cột nào |
|---|---|---|
| **CONTENT** (242 dòng) | Mọi chữ trên trang web: trang chủ, đăng nhập, cổng học viên (tiếng Việt), cổng tutor (tiếng Anh), câu báo lỗi (`r.MÃ` tiếng Việt cho học viên, `re.MÃ` tiếng Anh cho tutor) | `value`. Cột `default_value` là chữ gốc để đối chiếu hoặc chép lại; cột `note` giải thích chữ đó hiện ở đâu |
| **EMAIL_TEMPLATES** (24 mẫu) | Mọi email gửi đi: học viên, tutor, admin. Mỗi mẫu có tiêu đề, dòng tiêu đề lớn, nội dung, cho cả tiếng Việt và tiếng Anh | `subject_vi`, `title_vi`, `body_vi`, `subject_en`, `title_en`, `body_en`, `active` |

**Luật ô:**
* Ô để trống = dùng chữ gốc trong code.
* Ô chỉ ghi dấu `-` = cố ý để trống (ví dụ bỏ câu phụ dưới tiêu đề trang chủ, hoặc bỏ tiêu đề tiếng Anh của một email).
* Cột `active` = FALSE: mẫu đó không gửi nữa (ghi vào nhật ký).

**Cú pháp trong ô email:**

| Viết | Ra |
|---|---|
| `{{name}}` | Chèn giá trị. Danh sách biến của mẫu nằm ở cột `variables`, chỉ dùng biến trong danh sách đó |
| `{{button:login_url\|Đăng nhập}}` | Nút bấm. Bỏ nút này khỏi email WELCOME là học viên mới **không có nút đăng nhập** |
| `**chữ đậm**` | **chữ đậm** |
| Một dòng trống | Sang đoạn mới |

**Cú pháp trong ô CONTENT:** `{n}`, `{date}`... là chỗ code chèn số liệu (cột `note` ghi rõ). Ô có thể dùng thẻ `<b>`, `<br>`.

**Thứ tự hai thứ tiếng:** email cho học viên và admin: tiếng Việt trên, tiếng Anh dưới. Email cho tutor: tiếng Anh trên. Tiêu đề email ghép "tiếng Việt | tiếng Anh" (tutor: ngược lại).

## 2. Quy trình sửa (bắt buộc làm đủ 3 bước)

1. Sửa ô trong CONTENT hoặc EMAIL_TEMPLATES.
2. Menu **thaiput → Cập nhật nội dung web và email**. Hộp thoại báo:
   * key lạ trong CONTENT (gõ sai key thì trang không dùng);
   * biến không có trong cột `variables` (sẽ hiện trống);
   * mẫu đã sửa làm mất nút có trong mẫu gốc (ví dụ mất nút đăng nhập).
3. Kiểm tra:
   * chữ web: tải lại trang web;
   * email: menu **thaiput → Gửi thử một mẫu email cho tôi**, nhập key (ví dụ `WELCOME`). Email gửi tới chính anh với dữ liệu minh hoạ.

Không bấm bước 2 thì chữ mới vẫn có hiệu lực, chậm nhất sau 5 phút.

## 3. Phương án test khả năng sửa (anh làm trên STAGING, khoảng 15 phút)

| # | Làm | Kết quả đúng |
|---|---|---|
| 1 | CONTENT, key `h.hero_title`: sửa `value` thành "Nói tiếng Thái tự tin sau 30 ngày". Bấm menu cập nhật. Tải lại trang chủ | Tiêu đề lớn đổi |
| 2 | Key `h.levels`: ghi `A0\|A1\|A2` | Ô "Trình độ hiện tại" còn đúng 3 lựa chọn |
| 3 | Key `h.hero_sub`: ghi `-` | Câu phụ dưới tiêu đề biến mất |
| 4 | Key `t.tab_avail`: ghi `My slots`. Đăng nhập tutor | Tab "Availability" thành "My slots" |
| 5 | Key `r.ONE_PER_DAY`: sửa câu. Học viên đặt 2 buổi cùng ngày | Buổi thứ hai báo đúng câu mới |
| 6 | EMAIL_TEMPLATES, dòng `BOOKING_CONFIRM`: sửa `subject_vi` thành "Lịch học mới của {{name}}". Bấm cập nhật. Đặt 1 buổi | Email xác nhận có tiêu đề "Lịch học mới của <tên> \| 1 lesson(s) confirmed" |
| 7 | Cùng dòng: `subject_en` ghi `-` | Tiêu đề chỉ còn phần tiếng Việt |
| 8 | Cùng dòng: xoá `{{button:portal_url\|...}}` khỏi `body_vi`. Bấm cập nhật | Hộp thoại cảnh báo mất nút |
| 9 | Cùng dòng: `active` = FALSE. Đặt 1 buổi | Đặt thành công, không có email xác nhận; ACTIVITY_LOG có `MAIL_TEMPLATE_OFF` |
| 10 | Thêm dòng mới: key `PROMO_TET`, audience `MARKETING`, điền 4 ô tiêu đề và nội dung, `variables` = `name`. Menu gửi thử, nhập `PROMO_TET` | Nhận email song ngữ với tên "Minh Anh" |
| 11 | Xoá chữ trong các ô vừa sửa (để trống), bấm cập nhật | Mọi thứ về chữ gốc |

Mọi bước trên đã có test tự động tương ứng (I35 đến I41, U20); bước trên Google thật để xác nhận Sheets thật và Gmail thật hiển thị đúng.

## 4. Thay đổi khác trong 5C

| Thay đổi | Anh tự kiểm tra |
|---|---|
| **Nút Zalo nổi** góc dưới phải mọi trang (khi CONFIG có `ADMIN_ZALO_URL`) | Mở trang trên điện thoại |
| **Cổng tutor toàn tiếng Anh**, kể cả câu báo lỗi từ máy chủ và câu mất mạng | Tutor mở link đăng nhập đã hết hạn: câu báo có cả tiếng Việt và tiếng Anh |
| **Tắt bớt email**: CONFIG `MORNING_REMINDER_HOUR = -1` tắt nhắc 8:00; `DIGEST_HOUR = -1` tắt email tổng hợp | Chỉ dùng khi muốn tiết kiệm hạn mức |
| **Đăng ký và thanh toán giữ trên web như cũ** | Trang chủ vẫn có thông tin chuyển khoản và ô tải ảnh |

## 5. Rủi ro còn lại
* **Chữ trong CONTENT hiện dạng HTML.** Gõ dấu `<` lẻ có thể làm vỡ một đoạn chữ trên trang. Sửa xong luôn tải lại trang để xem.
* **Ai có quyền sửa file Sheets là sửa được chữ học viên thấy.** Chỉ chia sẻ file cho người tin được.
* **Nhãn trạng thái buổi học** (ví dụ "Chờ tutor xác nhận") và **tên gói** chưa nằm trong CONTENT: tên gói sửa ở tab PACKAGES như cũ, nhãn trạng thái đưa vào ở 5E.
* Email tiếng Thái cho tutor: chưa có, theo quyết định cổng tutor dùng tiếng Anh (câu 37).

## 6. Tiếp theo: sub-chunk 5D
Đăng nhập chuyên nghiệp: tutor dùng link một lần, phiên dài trên thiết bị của mình, email báo đăng nhập mới, danh sách thiết bị và "Thoát mọi thiết bị", số buổi đã dạy trong tháng; admin đăng nhập bằng tài khoản Google; máy chủ không đọc cả tab AUTH mỗi lần gọi và dọn AUTH hằng tuần. Chi tiết: `KE_HOACH_CHUNK5_V2.md` mục 2.

<!-- END FILE: v8/history/CHUNK5C_GIAI_THICH.md -->

---

## `v8/history/CHUNK5D_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:06Z*

<!-- BEGIN FILE: v8/history/CHUNK5D_GIAI_THICH.md | bytes=7533 | sha256=6324e7bb28e437631d1302027d1729d23468b404b122b483c0a08e079533498b | created=2026-10-29T14:41:06Z -->
# Sub-chunk 5D · Đăng nhập chuyên nghiệp cho tutor và admin

*Ngày 15/10/2026. Phiên bản 8.0.5, giao cùng 5E (8.0.6) trong một lần dán. Kết quả test và 2 vòng soát độc lập: `reports/REPORT_CHUNK5D.md`. Tư vấn và các câu hỏi cần anh chốt: `TU_VAN_15_10.md`.*

## 1. Cập nhật lên STAGING (một lần cho cả 5D và 5E, khoảng 15 phút)

**Thứ tự này quan trọng. Lần soát độc lập phát hiện thứ tự cũ (triển khai trước, chạy menu 1 sau) có thể làm hỏng đăng nhập.** Trigger chạy code vừa lưu ngay lập tức, không chờ "Triển khai".
1. Trong trình soạn Apps Script, dán đè **`Code.gs`** và **`Index.html`**, bấm Lưu.
2. **Ngay sau đó**, trong Sheets chạy menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Bước này:
   * thêm cột `device` vào tab AUTH;
   * thêm khoá CONFIG mới (đăng nhập, xoá dữ liệu test, đăng nhập Google);
   * đổi `MORNING_REMINDER_HOUR` từ 8 thành -1, tức tắt email nhắc 8:00 (chỉ đổi một lần);
   * ghi `ALLOW_DATA_RESET = TRUE` vì đây là STAGING;
   * sửa ô tick cột `read` của NOTIFICATIONS.
3. **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai.**
4. Chạy menu **2. Kiểm tra hệ thống**: KHÔNG CÓ LỖI. Nếu có "LƯU Ý ... không bắt đầu bằng https://": sửa link đó trong CONFIG (trang web tự ẩn link không phải https).
5. Tab USERS: co-founder thứ hai phải có dòng role `ADMIN`, status `ACTIVE`. Thêm bằng menu **Thêm admin**, rồi chia sẻ file Sheets cho email đó với quyền Người chỉnh sửa.

Nếu lỡ làm sai thứ tự: hệ thống đã được làm cho chịu được (thiếu cột `device` vẫn đăng nhập được, thiếu tab NOTIFICATIONS vẫn đặt lịch được). Chạy menu 1 ngay khi nhớ ra.

## 2. Thay đổi và cách tự kiểm tra

| Thay đổi | Anh tự kiểm tra |
|---|---|
| **Link đăng nhập của tutor và admin dùng 1 lần** (`STAFF_LOGIN_LINK_MAX_USES = 1`). Học viên giữ dùng nhiều lần trong 15 phút | Tutor bấm link 2 lần: lần 2 báo "đã được dùng" |
| **Phiên tutor 90 ngày** (`TUTOR_SESSION_DAYS`), admin 30 ngày, học viên 30 ngày | Tutor ít phải xin link lại |
| **Email "Có đăng nhập mới"** cho tutor và admin mỗi lần đăng nhập, ghi giờ và thiết bị (ví dụ "Safari · iOS") | Đăng nhập tutor trên điện thoại: hộp thư tutor có email tiếng Anh "New sign in" |
| **Tab Account trong cổng tutor**: số buổi tháng này và tháng trước (Completed, Student absent, Technical issue có tính và không tính, Tutor absent, buổi tính lương, buổi chờ xác nhận), cùng luật với báo cáo lương | So với menu "Làm mới báo cáo tháng này": khớp từng số |
| **Danh sách thiết bị và "Thoát mọi thiết bị"** cho tutor (tab Account) và học viên (tab Tài khoản) | Đăng nhập 2 thiết bị, bấm Thoát mọi thiết bị trên 1 máy: máy kia cũng bị đẩy ra |
| **Khoá tài khoản là thoát ngay**: đổi `status` thành `DISABLED` trong USERS (onEdit) và job mỗi giờ huỷ hẳn phiên. Mở lại tài khoản không làm phiên cũ sống lại | Khoá một tutor đang đăng nhập rồi mở lại: tutor phải xin link mới |
| **Mỗi kết quả buổi học ghi mã phiên đã bấm** (ACTIVITY_LOG, dòng SESSION_RESULT) | Bằng chứng khi tranh chấp lương |
| **Máy chủ không đọc cả tab AUTH mỗi lần gọi** (bộ nhớ đệm 120 giây), **dọn AUTH mỗi ngày từ 03:00** (bỏ link và phiên hết hạn quá 7 ngày) | Tab AUTH không phình mãi |
| **Chống phá từ bên ngoài**: link lạ, mã lạ, email không có, form rác, chữ ký Google sai đều không ghi Sheets và không lấy khoá | Không cần kiểm tay; test I45, I59 |

## 3. Đăng nhập bằng tài khoản Google (thử nghiệm, anh đã đồng ý ở mục 2.5)

### 3.1 Cài đặt (khoảng 15 phút, làm bằng tài khoản admin@)
1. Trong Sheets: menu **thaiput → Đăng nhập Google: tạo khoá bí mật (chủ file)**. Hộp thoại hiện 2 dòng `GOOGLE_LOGIN_SECRET` và `MAIN_URL`. **Không gửi khoá qua email hay Zalo.**
2. Mở script.google.com → **Dự án mới**, đặt tên "thaiput Google login".
3. Dán nội dung `dist_google_login/GoogleLogin.gs` vào file Code.gs của dự án mới.
4. **Cài đặt dự án** (bánh răng) → tick "Hiển thị tệp kê khai appsscript.json". Mở `appsscript.json`, dán nội dung `dist_google_login/appsscript.json`.
5. **Cài đặt dự án → Thuộc tính tập lệnh**: thêm 2 dòng ở bước 1.
6. **Triển khai → Lần triển khai mới → Ứng dụng web**:
   * Thực thi với tư cách: **Người dùng truy cập ứng dụng web**;
   * Ai có quyền truy cập: **Bất kỳ ai có tài khoản Google**;
   * chép link `/exec`.
7. Trong Sheets, tab CONFIG: `GOOGLE_LOGIN_URL` = link ở bước 6.
8. Thử: mở trang đăng nhập, bấm **"Admin: đăng nhập bằng tài khoản Google"**. Trang phụ hiện email Google của anh; bấm "Tiếp tục". Anh vào thẳng giao diện admin.

### 3.2 Những gì chỉ biết khi thử trên Google thật
* **Lần đầu Google hỏi cấp quyền.** Dự án phụ chỉ cần quyền đọc email. Nếu hiện "Google chưa xác minh ứng dụng này": bấm "Nâng cao" rồi "Đi tới thaiput Google login". Ghi lại cho em biết có hiện hay không.
* **Trình duyệt đăng nhập nhiều tài khoản Google** thường làm trang phụ báo lỗi hoặc lấy nhầm tài khoản. Dùng cửa sổ ẩn danh, hoặc một hồ sơ Chrome chỉ có tài khoản admin.
* **Sai tài khoản:** trang chính báo "Tài khoản Google ... chưa được cấp quyền" kèm cách làm tiếp.
* **Chỉ dùng được trong 2 phút và 1 lần.** Làm mới trang sau khi đã vào thì hệ thống tự vào thẳng, không báo lỗi.
* Chạy ổn 1 tuần thì đặt `ADMIN_LINK_LOGIN = FALSE` (tắt đăng nhập admin bằng link email). Muốn tutor cũng đăng nhập Google: `GOOGLE_LOGIN_ROLES = ADMIN,TUTOR`.

## 4. Khoá CONFIG mới

| Khoá | Mặc định | Ý nghĩa |
|---|---|---|
| `STAFF_LOGIN_LINK_MAX_USES` | 1 | Số lần dùng link của tutor và admin |
| `TUTOR_SESSION_DAYS`, `ADMIN_SESSION_DAYS` | 90, 30 | Thời hạn phiên |
| `ADMIN_LINK_LOGIN` | TRUE | Admin xin link bằng email được |
| `STAFF_NEW_LOGIN_EMAIL` | TRUE | Email "Có đăng nhập mới" |
| `SESSION_CACHE_SECONDS` | 120 | Bộ nhớ đệm phiên. Sửa tay dòng AUTH thì có hiệu lực sau tối đa chừng ấy giây |
| `AUTH_PURGE_AFTER_DAYS` | 7 | Dọn AUTH |
| `GOOGLE_LOGIN_URL`, `GOOGLE_LOGIN_ROLES` | trống, ADMIN | Đăng nhập Google |
| `MORNING_REMINDER_HOUR` | -1 | Tắt nhắc 8:00 (ghi 8 để bật lại) |

## 5. Rủi ro còn lại
* Đăng nhập Google: mục 3.2.
* Email "Có đăng nhập mới" gửi vào chính hộp thư đã nhận link. Nếu kẻ xấu đọc được hộp thư đó thì email này không giúp được. Nó giúp khi link bị chuyển tiếp, hoặc khi điện thoại tutor bị mất.
* Apps Script **không cho biết địa chỉ IP**. Thiết bị chỉ ghi loại trình duyệt và hệ điều hành.

<!-- END FILE: v8/history/CHUNK5D_GIAI_THICH.md -->

---

## `v8/history/CHUNK5E_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:07Z*

<!-- BEGIN FILE: v8/history/CHUNK5E_GIAI_THICH.md | bytes=6301 | sha256=2493b5adbae8bb530a817ebf77664637b02a61a77860e5c9f1eae090caa55573 | created=2026-10-29T14:41:07Z -->
# Sub-chunk 5E · Giao diện admin trên web, menu xoá dữ liệu test

*Ngày 15/10/2026. Phiên bản 8.0.6. Cập nhật lên STAGING: mục 1 của `CHUNK5D_GIAI_THICH.md` (một lần dán cho cả 5D và 5E). Kết quả test: `reports/REPORT_CHUNK5E.md`.*

## 1. Vào giao diện admin
* Trang đăng nhập: nhập email admin (dòng role ADMIN, ACTIVE trong USERS). Link dùng 1 lần, bấm là vào thẳng giao diện admin.
* Hoặc bấm "Admin: đăng nhập bằng tài khoản Google" khi đã cài mục 3 của `CHUNK5D_GIAI_THICH.md`.
* Trên máy tính trang rộng hơn (1.000px). Trên điện thoại vẫn dùng một tay được. Không có nút Zalo nổi ở trang admin.

## 2. Có gì và tự kiểm tra thế nào

| Phần | Làm gì | Anh tự kiểm tra |
|---|---|---|
| **Ô số liệu đầu trang** | Khẩn chưa đọc, Cần xử lý, Đăng ký chờ duyệt, Tutor xin huỷ, Buổi hôm nay, Chờ tutor xác nhận. Hai ô có dấu ↗ mở thẳng tab Sheets cần xử lý | Gửi 1 đăng ký thử: ô "Đăng ký chờ duyệt" tăng 1, bấm vào mở tab REGISTRATIONS |
| **Thông báo** | Lọc chưa đọc hoặc tất cả, theo mức. Bấm một dòng: xem nội dung, mở đúng dòng Sheets, xem buổi học, học viên, tutor liên quan. Mở là đánh dấu đã đọc. "Đã đọc hết" hỏi lại kèm số lượng | Học viên huỷ 1 buổi: dòng vàng xuất hiện, bấm vào, bấm "Xem buổi học" |
| **Tutor** | Danh sách: buổi tuần này, chờ xác nhận, slot đã mở tuần sau, số thông báo mới. Bấm vào một tutor: số buổi theo tháng (cùng luật lương), buổi sắp tới, lịch sử, thông báo, thiết bị đang đăng nhập, **Thoát mọi thiết bị của người đó** | So số buổi tháng với menu báo cáo tháng |
| **Học viên** | Tìm theo tên, email, mã. Bấm vào: gói (còn bao nhiêu buổi, hạn), sắp tới, lịch sử, thông báo, thiết bị | Tìm "s0" ra danh sách học viên |
| **Đặt thay** | Trong trang học viên. Bỏ qua hạn đặt; vẫn giữ 1 buổi/ngày, hạn và số buổi gói, slot khoá, trùng giờ. Chọn tutor cụ thể hoặc "Tự chọn theo luật". Học viên chưa có gói hoặc đang khoá: báo ngay từ đầu. Học viên và tutor nhận email như khi tự đặt | Sau 15:00, đặt thay một buổi ngày mai cho học viên, chọn tutor B: BOOKINGS ghi tutor B, học viên nhận email |
| **Huỷ** | Nút Huỷ ở buổi chưa bắt đầu. Hộp thoại ghi rõ ngày, giờ, học viên, tutor, ô lý do (ghi vào Sheets). Học viên được trả lại buổi. Buổi đã bắt đầu thì xử lý ở cột admin_action của BOOKINGS như cũ | Huỷ một buổi sau hạn 15:00: trạng thái "Huỷ bởi admin", lý do đúng chữ anh gõ |
| **Nhật ký** | Tìm theo email, mã buổi, hành động (BOOKED, CANCELLED, LOGIN, JOB_SLOW...) | Gõ mã một buổi: thấy BOOKED và CANCELLED |

Chữ trang admin để tiếng Việt cố định, không nằm trong CONTENT, đúng như anh nói. **Nhãn trạng thái buổi học hiện cho học viên** (ví dụ "Chờ tutor xác nhận") nay đã chuyển vào CONTENT, khoá `st.*`.

## 3. Menu "Xoá dữ liệu test"

**Ai bấm được:** chủ file, ADMIN_EMAIL, hoặc tài khoản role ADMIN đang hoạt động. Trên PRODUCTION chỉ chủ file.

**Khi nào chạy được:** CONFIG `ALLOW_DATA_RESET = TRUE`. Menu 1 trên STAGING tự ghi TRUE. `switchToProduction` tự ghi FALSE.

**Hai bước:**
1. Hộp thoại liệt kê số dòng sẽ xoá ở từng tab. Nhập **1** (giữ tài khoản tutor) hoặc **2** (xoá cả tutor, chỉ còn admin).
2. Hộp thoại nói lại mức đã chọn bằng chữ. Anh gõ đúng câu có tên môi trường và mức, ví dụ `XOA DU LIEU STAGING MUC 1`. Gõ câu của mức khác thì không xoá.

**Hệ thống làm, theo thứ tự:**
* sao lưu file DB vào thư mục BACKUP (sao lưu hỏng thì dừng, không xoá gì);
* xoá dòng ở BOOKINGS, AVAILABILITY, STUDENT_PACKAGES, REGISTRATIONS, PAYMENTS, AUTH, ACTIVITY_LOG, MAIL_LOG, NOTIFICATIONS và học viên trong USERS;
* ghi 2 dòng nhật ký `DATA_RESET_STARTED`, `DATA_RESET`;
* mọi người phải đăng nhập lại;
* gỡ sự kiện Calendar của buổi chưa diễn ra, không gửi thư.

**Giữ nguyên:** CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES, tài khoản admin.

**Không đụng tới:**
* ảnh chuyển khoản trong Drive: anh tự xoá thư mục tải lên, vì đó là dữ liệu cá nhân của người thử;
* email đã gửi;
* sự kiện đã qua trên lịch;
* giờ giả lập.

**Tư vấn thẳng:** go live trên file PRODUCTION mới, không xoá file test rồi dùng tiếp. Lý do ở mục 6 của `TU_VAN_15_10.md`.

## 4. Kịch bản thử trên STAGING (khoảng 30 phút)
1. Đăng nhập admin bằng link. Link dùng lần 2 phải báo "đã được dùng".
2. Tab Thông báo: lọc "Cần xử lý", mở một dòng, bấm "Mở đúng dòng trong Sheets".
3. Học viên: tìm 1 học viên, xem gói, bấm "Đặt thay" sau 15:00 cho ngày mai, chọn tutor cụ thể, đặt. Kiểm hộp thư học viên và tutor.
4. Huỷ chính buổi đó với lý do riêng. Kiểm BOOKINGS và hộp thư.
5. Tutor: mở 1 tutor, bấm "Thoát mọi thiết bị". Tutor đó tải lại trang: phải đăng nhập lại.
6. Nhật ký: tìm mã buổi vừa làm.
7. Menu Xoá dữ liệu test: nhập 1, gõ sai câu (không xoá); làm lại, gõ đúng (xoá). Mở thư mục BACKUP: có bản `TRUOC_KHI_XOA`.

## 5. Rủi ro còn lại
* "Đã đọc hết" đánh dấu mọi thông báo chưa đọc, không chỉ những dòng đang lọc. Hộp thoại có ghi rõ số lượng.
* Trang admin đọc cả bảng mỗi lần mở (BOOKINGS, NOTIFICATIONS, ACTIVITY_LOG). Sau vài tháng sẽ chậm dần cho tới khi có lưu trữ hằng tháng (5G).
* Sửa tay ô `status` của USERS bằng cách dán hàng loạt hoặc kéo thả không kích hoạt onEdit. Job mỗi giờ vẫn huỷ phiên của tài khoản DISABLED, nhưng có thể chậm tới 1 giờ.

<!-- END FILE: v8/history/CHUNK5E_GIAI_THICH.md -->

---

## `v8/history/CHUNK5F_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:08Z*

<!-- BEGIN FILE: v8/history/CHUNK5F_GIAI_THICH.md | bytes=10420 | sha256=993a903a683607fc6354823b60320542689dd3fadc6a6e699e1cc5ffc1655d09 | created=2026-10-29T14:41:08Z -->
# Sub-chunk 5F · Chống nghẽn, hàng đợi Calendar 23h, xác nhận 2 bước, máy tính

*Ngày 16/10/2026. Phiên bản 8.0.7. Kết quả test, 2 vòng soát độc lập và thử phá code: `reports/REPORT_CHUNK5F.md`. Tư vấn kiến trúc "30 lượt" và 5 câu hỏi cần anh chốt: `TU_VAN_KIEN_TRUC_16_10.md`.*

## 1. Cập nhật lên STAGING (khoảng 15 phút, đúng thứ tự)

1. Dán đè **`Code.gs`** và **`Index.html`**, bấm Lưu.
2. **Ngay sau đó** chạy menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Bước này:
   * thêm 4 cột vào BOOKINGS: `cal_state`, `cal_attempts`, `cal_next_at`, `request_id`;
   * thêm tab **METRICS** (số đo tốc độ theo giờ);
   * thêm khoá CONFIG mới (mục 4);
   * tạo lại trigger, thêm **calendarJob mỗi 5 phút** (tổng 9 trigger).
3. **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai.**
4. Menu **2. Kiểm tra hệ thống**: phải "Đủ 9 trigger".

**Buổi cũ không mất gì:** buổi đã có sự kiện được coi là đã tạo; buổi CONFIRMED chưa có sự kiện (ví dụ Calendar lỗi trước đây) được hàng đợi tự tạo.

## 2. Thay đổi chính và cách anh tự kiểm

| Thay đổi | Ý nghĩa với người dùng | Anh tự kiểm |
|---|---|---|
| **Calendar gom 23h** (theo quyết định của anh) | Đặt xong là có email xác nhận ngay; sự kiện Calendar có link Meet và thư mời tạo từ 23:00. Email và trang ghi rõ "link Meet đến cùng lời mời Google Calendar, khoảng 23:05 12/10" | Mục 3 |
| **Đường gấp** | Buổi cần có sự kiện trước lần gom kế tiếp (ví dụ admin đặt thay buổi tối nay) được tạo ngay khi đặt, email có link Meet | Mục 3, bước 7 |
| **Mỗi thao tác lấy khoá tối đa 2 lần** (trước: 5 đến 7) | Lúc đông người ít "hệ thống bận" hơn hẳn | Không cần kiểm tay; test I68 |
| **Không còn "bận" sau khi đã đặt xong** | Trước: có thể đã đặt, đã có email, mà màn hình báo "bận"; học viên đặt lại bị "1 buổi mỗi ngày" | Test I67 |
| **Trình duyệt tự thử lại** khi Google từ chối lượt gọi hoặc máy chủ bận | Dải vàng "Đang đông người, hệ thống đang tự thử lại..." ở đầu trang thay vì lỗi. Lượt ghi gửi lại cùng một mã: không bao giờ đặt hay huỷ 2 lần | Tắt wifi giữa lúc bấm Đặt rồi bật lại: chỉ 1 buổi trong BOOKINGS |
| **Mở cổng học viên 1 lượt gọi** (kèm sẵn slot 14 ngày); **danh sách slot dùng chung trong bộ đệm 60 giây** | Vào tab Đặt lịch không phải chờ | Mở cổng, bấm Đặt lịch: hiện ngay |
| **Tutor xác nhận kết quả 2 bước** | Chọn kết quả từng buổi (bấm lại để bỏ chọn) → "Save N results" → bảng xem lại → Save. Kết quả là căn cứ lương nên không lưu ngay khi lỡ tay | Đăng nhập tutor có buổi đã dạy, chọn, bấm Back: không lưu; Save: lưu |
| **Bố cục máy tính** (từ 900px) | Thanh tab thành cột trái; học viên 2 cột (thẻ gói bên trái); lịch rảnh tutor thành lưới tuần mở sẵn 7 ngày | Mở trên laptop |
| **Đổi tutor ngoài khoá** | Vá sự kiện Calendar và gửi email sau khi nhả khoá; vá lỗi thì hàng đợi vá lại (`cal_state` RESYNC) | Duyệt một tutor xin huỷ: học viên nhận thư "đã cập nhật" từ Calendar |
| **Đối soát mỗi giờ** | Email Khẩn khi 2 học viên trùng một tutor cùng giờ, hoặc học viên quá số buổi mỗi ngày (chỉ xảy ra khi sửa tay Sheets). Một email gộp khi có buổi trong 3 giờ tới chưa có link Meet | Sửa tay 2 dòng BOOKINGS trùng tutor, chạy hourlyJob |
| **Chống ghi nhầm dòng** khi admin bấm sắp xếp tab đúng lúc hệ thống ghi | Không ghi sang buổi khác | Không cần kiểm tay; test I71 |
| **Menu "Đo tốc độ (chỉ đọc)"** | Đo từng phần việc với dữ liệu thật (mở file, đọc từng tab, cổng học viên, slot, khoá, Calendar, hạn mức email) | Chạy trên STAGING sau khi nạp dữ liệu, chụp kết quả gửi em |
| **Tab METRICS** | Mỗi giờ: số lượt, p50, p95, lớn nhất, lỗi, bận của từng hàm; thời gian chờ và giữ khoá; lượt trình duyệt thất bại sau khi thử lại. Giữ 90 ngày | Xem tab sau 2 giờ dùng thử |
| **Trang health** `<link web app>?page=health` | Trả chữ "OK" cho dịch vụ giám sát (UptimeRobot), không đọc Sheets | Mở link trên trình duyệt |
| **Tổng kết lô Calendar đêm qua** (sau 00:00) | Dòng NOTIFICATIONS; email khi còn lỗi hoặc còn buổi sắp tới chưa có sự kiện. Cả lô lỗi ngay lần đầu thì email Khẩn ngay | Mục 3, bước 10 |
| **2 co-founder dùng chung admin@** (quyết định 16/10) | Không cần dòng ADMIN thứ hai trong USERS. Email "Có đăng nhập mới" của admin tới chính admin@ nên cả hai cùng thấy | Không có gì phải làm |

## 3. Kiểm tay cơ chế "Calendar 23h" trên STAGING (khoảng 40 phút)

Dùng giờ giả lập (menu **Test (chỉ STAGING) → Bật giả lập thời gian**). Lưu ý: trigger thật cũng đọc giờ giả lập, nên đổi giờ là cả hệ thống "sống" theo giờ đó. Dùng email thật của anh cho học viên và tutor thử để thấy thư mời.

| Bước | Làm | Phải thấy |
|---|---|---|
| 1 | CONFIG: `CALENDAR_MODE = NIGHTLY`, `CALENDAR_NIGHTLY_HOUR = 23`. Giả lập 10:00 hôm nay | |
| 2 | Học viên đặt 2 buổi: ngày mai 19:00 và ngày kia 19:00 | BOOKINGS: `cal_state` PENDING, `event_id` trống. Email xác nhận tới ngay, ghi "link Meet đến cùng lời mời Google Calendar (khoảng 23:05 ...)". Lịch "Thaiput · Lịch học" chưa có sự kiện |
| 3 | Cổng học viên, tab Lịch của tôi | Thay cho nút "Vào phòng": "Link Meet có trong thư mời Google Calendar, gửi khoảng 23:05 ..." |
| 4 | Menu Test → **Chạy calendarJob** | Không có gì thay đổi (chưa tới 23:00) |
| 5 | Học viên huỷ buổi ngày kia | `cal_state` SKIPPED, không có thư huỷ nào từ Calendar (sự kiện chưa từng tạo) |
| 6 | Giả lập 23:05, chạy calendarJob | Buổi ngày mai: `cal_state` CREATED, có `event_id`, `meet_link`; học viên và tutor nhận thư mời Google Calendar; admin@ là chủ sự kiện, không nhận thư |
| 7 | Giả lập 16:00 hôm sau. Admin (giao diện web) đặt thay một buổi 20:00 tối đó | Sự kiện tạo NGAY (đường gấp), email xác nhận có link Meet |
| 8 | Một tutor xin huỷ một buổi PENDING (đặt mới, chưa tới 23:00), admin duyệt "tự chọn tutor" | Buổi đổi tutor; lúc 23:05 sự kiện tạo với tutor MỚI |
| 9 | Huỷ buổi đã CREATED | `cal_state` CANCELLED, học viên và tutor nhận thư huỷ từ Calendar |
| 10 | Sửa `LESSON_CALENDAR_ID` thành sai, đặt 3 buổi, giả lập 23:05, chạy calendarJob | Email Khẩn "CALENDAR_BATCH_FAILED". Sửa lại đúng, giả lập 23:15, chạy lại: tạo đủ. Giả lập 00:20, chạy hourlyJob: NOTIFICATIONS có tổng kết lô đêm |
| 11 | Menu **Calendar: tạo sự kiện đang chờ ngay** | Tạo ngay mọi buổi đang chờ, bỏ qua giờ gom; bảng báo số đã tạo, còn chờ, lỗi |
| 12 | Tắt giả lập | |

Muốn thử chế độ khác: đổi `CALENDAR_MODE = QUEUE` (tạo trong 5 đến 10 phút, trừ 22:00 đến 07:00) và lặp bước 2, 6.

## 4. Khoá CONFIG mới

| Khoá | Mặc định | Ý nghĩa |
|---|---|---|
| `CALENDAR_MODE` | NIGHTLY | NIGHTLY (gom theo giờ), QUEUE (vài phút, có giờ yên tĩnh), INLINE (tạo ngay khi bấm Đặt, cách cũ, chậm nhất khi đông) |
| `CALENDAR_NIGHTLY_HOUR` | 23 | Giờ bắt đầu gom. Gom tới hết ngày |
| `CALENDAR_QUIET_FROM`, `CALENDAR_QUIET_TO` | 22, 7 | Giờ yên tĩnh của QUEUE |
| `CALENDAR_MIN_LEAD_HOURS` | 3 | Buổi phải có sự kiện trước giờ học chừng này giờ; chờ lần gom kế tiếp sẽ trễ thì tạo ngay |
| `CALENDAR_BATCH_MAX` | 40 | Mỗi lượt job tạo tối đa chừng này sự kiện (lượt sau 5 phút làm tiếp) |
| `CALENDAR_MAX_ATTEMPTS` | 5 | Lỗi quá chừng này lần thì FAILED, báo Khẩn |
| `SLOT_CACHE_SECONDS` | 60 | Danh sách slot dùng chung trong bộ đệm. 0 = tắt |

**Xử lý tay buổi FAILED:** gửi link Meet tay cho học viên và tutor (dán vào cột `meet_link`), hoặc sửa nguyên nhân rồi ghi `cal_state = PENDING` (chưa có sự kiện) hay `RESYNC` (đã có sự kiện, cần vá tutor) để hàng đợi làm lại.

## 5. Rủi ro còn lại, nói thẳng

1. **Thư mời lúc 23:00 tới 24:00.** Đúng chế độ anh chọn, nhưng điện thoại học viên và tutor sẽ có chuông lúc khuya. Cả hai chuyên gia không khuyên. Đổi bằng 1 ô CONFIG (Q2 trong tư vấn).
2. **Buổi gấp đặt sau 23:55, buổi thử lại lỗi lúc nửa đêm** có thể nhận thư mời lúc 01:00 tới 05:00. Ít gặp.
3. **Các bước chuyển tài khoản (menu "Chuyển sang tài khoản mới") vẫn gọi Calendar hàng loạt trong một khoá.** Chạy 1 lần lúc chuyển, vào giờ vắng. 100 buổi có thể quá 6 phút; chạy lại an toàn nhờ mã sự kiện cố định.
4. **Đăng nhập Google:** lần gửi lại cùng mã ngay lúc lượt đầu còn chạy có thể nhận "đã dùng". Cửa sổ rất nhỏ; link email là đường dự phòng.
5. **Bộ đệm của Google có thể bị xoá sớm.** Mọi thứ đặt trong bộ đệm (CONFIG, slot, gợi ý hàng đợi, số đo) chỉ để nhanh; mất thì hệ thống đọc lại từ Sheets, không sai dữ liệu. Số đo trong METRICS là gần đúng.
6. **Trang Executions có thêm 288 dòng calendarJob mỗi ngày.** Lọc theo tên hàm khi tìm lỗi.
7. **Chưa đo trên Google thật:** thời gian một lượt, thời gian tạo một sự kiện, độ trễ `google.script.run`. Chạy menu Đo tốc độ trên STAGING và gửi em kết quả.

<!-- END FILE: v8/history/CHUNK5F_GIAI_THICH.md -->

---

## `v8/history/CHUNK5G_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:09Z*

<!-- BEGIN FILE: v8/history/CHUNK5G_GIAI_THICH.md | bytes=18580 | sha256=cb6f0826a7b9d3e46c5557b84b15d5ff0098d8cfc2d9581820897a857785c261 | created=2026-10-29T14:41:09Z -->
# Sub-chunk 5G · Quyết định 16/10, lưu trữ, bảo trì, phát hành khi đang chạy, thử tải, giám sát

*Ngày 16/10/2026. Phiên bản 8.0.8. Kết quả test, 2 vòng soát độc lập, thử phá code: `reports/REPORT_CHUNK5G.md`. Tổng hợp cả 5A đến 5G: `GIAI_THICH_TONG_HOP_5A_5G.md`, `reports/REPORT_TONG_HOP_5A_5G.md`, `PROGRESS.md`.*

Tài liệu đi kèm 5G (đọc khi cần):

| File | Dùng khi |
|---|---|
| `HUONG_DAN_VAN_HANH.md` | Tra nghĩa từng ô CONFIG (80 khoá) và từng mục menu thaiput |
| `HUONG_DAN_PHAT_HANH.md` | Cập nhật code khi đang chạy thật, quay lui, cam kết không mất file |
| `HUONG_DAN_THU_TAI.md` | Thử tải trên STAGING trước go live (Q5) |
| `TU_VAN_GIAM_SAT_16_10.md` | Q4: giám sát là gì, các phương án, anh chọn |

## 1. Cập nhật STAGING một lượt (theo quyết định của anh: sau 5G mới cập nhật)

STAGING chạy dưới **admintest@** (Workspace Business Standard dùng thử 14 ngày). Hai trường hợp:

**A. Dùng lại file STAGING cũ (đang chạy bản 5A đến 5E):**
1. Mở trình soạn Apps Script của file STAGING. Dán đè **`Code.gs`** và **`Index.html`** bằng 2 file mới, bấm Lưu.
2. **Ngay sau đó**, trong Sheets chạy menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Bước này tự làm, theo thứ tự:
   * **sao lưu file DB vào thư mục `THAIPUT_V8_STAGING_Releases`** trước khi đổi gì (bản này không bao giờ tự xoá);
   * thêm cột, tab còn thiếu của 5F (BOOKINGS 4 cột, tab METRICS), khoá CONFIG mới của 5F và 5G;
   * một lần duy nhất: `CALENDAR_MODE` NIGHTLY thành **QUEUE**, `TUTOR_SESSION_DAYS` 90 thành **30**, rút phiên tutor đã cấp về 30 ngày, đổi mẫu email `STAFF_NEW_LOGIN`, xoá 17 dòng chữ "thiết bị đăng nhập" cũ trong tab CONTENT (chỉ đổi ô còn giá trị mặc định cũ; ô anh đã tự sửa thì giữ);
   * tạo lại trigger (9 trigger, có calendarJob 5 phút);
   * ghi RELEASE vào ACTIVITY_LOG.
3. **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai.** Mô tả phiên bản: ghi `8.0.8`.
4. Menu **2. Kiểm tra hệ thống**: KHÔNG CÓ LỖI, "Đủ 9 trigger".
5. Mở tab CONFIG, kiểm 3 ô: `CALENDAR_MODE = QUEUE`, `TUTOR_SESSION_DAYS = 30`, `NEW_LOGIN_EMAIL_ROLES = ADMIN`.

**B. Tạo STAGING mới trên admintest@:** làm theo `CHUYEN_SANG_WORKSPACE.md` (tạo file Sheets mới, dán 2 file, menu 1, triển khai, điền `WEBAPP_URL`, menu 2). File mới đã có sẵn mọi mặc định 16/10.

**Hạn mức tài khoản dùng thử (đã tra tài liệu Google, đọc kỹ):** Google ghi tài khoản dùng thử có hạn mức thấp hơn và không tăng trong lúc dùng thử. Gmail ghi **500 thư mỗi ngày** cho tài khoản dùng thử (tài khoản trả phí 2.000). Apps Script ghi hạn mức đầy đủ chỉ mở khi tên miền đã trả đủ **100 USD** và qua **60 ngày**. Hệ thống tự đọc hạn mức còn lại (`MailApp.getRemainingDailyQuota`), nên không vỡ: chỉ bỏ email ưu tiên thấp (nhắc buổi, sắp hết hạn) sớm hơn. Thử tải dùng địa chỉ `@loadtest.invalid` nên **không tốn hạn mức email**.

## 2. Bốn quyết định 16/10 đã vào code

| Anh chốt | Code làm | Anh tự kiểm |
|---|---|---|
| **Q2 (a): QUEUE**, giờ yên tĩnh 22:00 đến 07:00 | Mặc định `CALENDAR_MODE = QUEUE`. Đặt xong: email xác nhận ngay; sự kiện Calendar có link Meet tạo trong khoảng 5 phút (job calendarJob). Đặt lúc 22:00 đến 07:00: sự kiện tạo từ 07:00, trừ buổi gấp (bắt đầu trong 3 giờ tới) tạo ngay. Ô gõ sai giá trị cũng về QUEUE. NIGHTLY (23h) vẫn giữ làm phương án dự phòng | Đặt 1 buổi ngày mai lúc 10:00: trong 5 đến 10 phút học viên và tutor nhận thư mời Calendar |
| **Tutor đăng nhập: link dùng 1 lần, hạn 15 phút**, bỏ truy cập thiết bị, bỏ đăng nhập Google cho tutor | Link tutor dùng 1 lần (`STAFF_LOGIN_LINK_MAX_USES = 1`), hạn 15 phút (`LOGIN_LINK_MINUTES = 15`). Phiên sau khi bấm link: **30 ngày** (trước 5D cũng là 30; 5D tăng lên 90). Tutor **không còn nhận email "Có đăng nhập mới"** (`NEW_LOGIN_EMAIL_ROLES = ADMIN`). Đăng nhập Google chỉ cho admin (`GOOGLE_LOGIN_ROLES = ADMIN`, như cũ) | Tutor xin link, bấm 2 lần: lần 2 báo "đã được dùng"; chờ 16 phút mới bấm: "đã hết hạn" |
| **Bỏ "thiết bị đăng nhập" ở mọi giao diện user** | Cổng học viên (tab Tài khoản) và cổng tutor (tab Account) không còn danh sách thiết bị và nút "Thoát mọi thiết bị". Máy chủ bỏ luôn 2 API đó. Mẫu email "Có đăng nhập mới" không còn chỉ tới nút đã bỏ | Mở tab Tài khoản học viên và Account tutor trên điện thoại và máy tính |
| **Admin đăng nhập giữ nguyên** | Không đổi: link email 1 lần, đăng nhập Google, email "Có đăng nhập mới" cho admin, trong trang quản trị vẫn có "Thoát mọi thiết bị của [tên]" theo từng người (dùng khi tutor mất điện thoại, nghỉ việc) | Trang quản trị → Tutor → bấm 1 tutor: còn mục thiết bị |

Mọi phần khác trên web giữ nguyên ở cả điện thoại và máy tính (soát R2 đối chiếu bản 5F: không hồi quy khi bảo trì tắt). Ảnh chụp kiểm ở 390px và 1366px: không tràn ngang.

## 3. Tính năng mới của 5G

### 3.1 Lưu trữ hằng tháng (file DB luôn nhỏ, không mất dòng nào)

**Vì sao:** đặt lịch đọc cả tab BOOKINGS và AVAILABILITY trong khoá. Sau 1 năm BOOKINGS khoảng 24.000 dòng, mỗi lần đặt chậm dần. Lưu trữ chuyển dòng **cũ và đã xong** sang file riêng.

**Chuyển gì** (mốc = ngày 1 của tháng, lùi `ARCHIVE_KEEP_MONTHS` = 6 tháng; nhật ký lùi `ARCHIVE_LOG_KEEP_MONTHS` = 3 tháng):

| Tab | Chuyển | Giữ lại trong DB |
|---|---|---|
| BOOKINGS | Buổi trước mốc, đã xong, của gói **EXPIRED** hết hạn trước mốc (hoặc không có gói) | Buổi của gói còn chạy (số buổi còn lại tính từ BOOKINGS), buổi có `admin_action` |
| AVAILABILITY | Slot trước mốc | Slot tutor xin huỷ đang chờ duyệt |
| ACTIVITY_LOG, MAIL_LOG | Trước mốc nhật ký | |
| NOTIFICATIONS | Trước mốc nhật ký, đã đọc hoặc mức INFO | Khẩn, Cần xử lý chưa đọc |
| USERS, STUDENT_PACKAGES, PAYMENTS, REGISTRATIONS, CONFIG, tab cấu hình | **Không bao giờ** | |

**Đi đâu:** file `THAIPUT_ARCHIVE_STAGING_2026` (một file mỗi năm theo ngày của dòng), trong thư mục `THAIPUT_V8_STAGING_Archive` (`ARCHIVE_FOLDER_ID`). Mỗi tab cùng tên, cùng cột, thêm `_archived_at` và `_batch` (mã lô). Mỗi tháng có lưu trữ: sao 1 bản mỗi file lưu trữ vào thư mục Releases.

**Thứ tự an toàn (đã thử phá từng bước):**
1. Ghi nhớ lô (Script Property `ARCH_OPEN_<tab>`).
2. Chép sang file lưu trữ, đặt định dạng chữ cho cột giờ, số điện thoại (`08:00` không thành giờ).
3. Đọc lại, đếm đủ dòng của lô. Thiếu: dừng, báo Khẩn `ARCHIVE_FAILED`, **không bỏ dòng nào**; lượt sau đối chiếu lại.
4. Bỏ khỏi DB **theo nội dung đọc mới ngay lúc bỏ**: admin sắp xếp tab hay gõ thêm dòng tay đúng lúc đó cũng không bỏ nhầm. Ghi dòng giữ lại lên đầu tab trước, xoá phần đuôi sau: bị Google cắt giữa chừng thì tab chỉ thừa đuôi, **không bao giờ trống**. Lượt sau (đầu job mỗi giờ) so **dấu vân tay** nội dung: khớp thì xoá đúng phần đuôi; lệnh ghi chưa chạy thì không xoá gì; tab đã bị sửa tay sau khi hỏng thì **không tự xoá**, báo Khẩn `PURGE_CHECK` để admin xoá tay dòng trùng.
5. Sửa link "mở đúng dòng" của thông báo còn lại cho đúng hàng mới; nâng mốc mã (`ID_FLOOR_<tab>`): mã mới không bao giờ trùng mã đã lưu trữ.

**Khi nào chạy:** job mỗi giờ, 1 lần mỗi ngày từ 03:00 (`ARCHIVE_HOUR`), tối đa 3.000 dòng mỗi tab (`ARCHIVE_MAX_ROWS`). **Không chạy** khi: đang bảo trì; bản sao DB đêm nay (02:00) chưa có file (job sao lưu bỏ lượt vì bận cũng tính là chưa có); lượt chạy đã quá 3,5 phút; file hoặc thư mục lưu trữ nằm trong thùng rác. Bình thường mỗi tháng chỉ có 1 ngày có việc. Hệ thống mới chạy: 6 tháng đầu không có gì để chuyển.

**Báo cáo tháng cũ:** tháng có buổi đã chuyển đi, tab REPORT_MONTH ghi dòng "CHÚ Ý ... số dưới đây KHÔNG đủ; xem file lưu trữ".

**Menu:** thaiput → Bảo trì và phát hành → **Lưu trữ: xem tình trạng** (số dòng sẽ chuyển, file đã có) và **Lưu trữ: chạy ngay** (chủ file, khi không bảo trì).

### 3.2 Chế độ bảo trì

| `MAINTENANCE_MODE` | Học viên, tutor | Khách (trang chủ) | Admin |
|---|---|---|---|
| `OFF` | Bình thường | Bình thường | Bình thường |
| `READONLY` | Đăng nhập và **xem** được. Đặt, huỷ, lưu slot, xác nhận kết quả, sửa hồ sơ, gia hạn: báo "Hệ thống đang bảo trì..." và **không ghi gì** | Form đăng ký báo bảo trì, nút Gửi bị khoá | Bình thường |
| `CLOSED` | Cổng thành **trang bảo trì** (nút Zalo, Đăng xuất) | Như trên | Bình thường |

* Bật tắt: menu **Bảo trì và phát hành → Bảo trì: chỉ xem / đóng cổng / tắt** (có hiệu lực ngay). Ô `MAINTENANCE_UNTIL` (tuỳ chọn): chữ tự do, ví dụ `21:00 hôm nay`, hiện trong câu báo.
* Thanh báo song ngữ: học viên tiếng Việt, tutor tiếng Anh, trang chủ và đăng nhập cả hai. Admin tắt bảo trì khi trang đang mở: lượt gọi sau thành công thì thanh báo tự tắt.
* Lượt đặt đã ghi xong mà mạng rớt, trình duyệt gửi lại đúng lúc anh bật bảo trì: học viên vẫn nhận "đã đặt" (không báo bảo trì sai).
* Trong lúc bảo trì: tạm dừng tự Hoàn thành buổi (tutor không xác nhận được), tạm dừng lưu trữ. Calendar, email nhắc, sao lưu vẫn chạy.
* Đăng nhập luôn chạy (để admin vào được). Chữ câu báo sửa ở CONTENT `a.maint_*` và câu lỗi `r.MAINT_*`, `re.MAINT_*`.

### 3.3 Phát hành và quay lui khi đang chạy thật

Chi tiết từng bước: `HUONG_DAN_PHAT_HANH.md`. Code mới giúp:
* menu 1 tự **sao lưu DB vào Releases trước khi đổi cấu trúc** mỗi khi phiên bản code đổi; sao lưu hỏng thì cảnh báo to và lần chạy menu 1 sau thử lại;
* menu **Phát hành: sao lưu ngay** trước mỗi lần sửa tay lớn;
* ACTIVITY_LOG có dòng RELEASE (từ phiên bản nào sang phiên bản nào, ai chạy);
* thư mục Releases không bao giờ bị dọn theo `BACKUP_KEEP`.

### 3.4 Thử tải trước go live (Q5)

Từng bước: `HUONG_DAN_THU_TAI.md`. Tóm tắt: menu tạo 100 học viên giả `@loadtest.invalid` và 10 tutor giả; menu mở cổng thử tải 2 giờ (khoá bí mật); máy tính của anh chạy `node run.js` (Node 18, không cài gì) hoặc `node browser.js` (Playwright, trình duyệt thật); menu kiểm kết quả (trùng giờ, trùng lần bấm, quá 1 buổi mỗi ngày, số đo p95). Cổng chỉ có trên STAGING, tự đóng sau 2 giờ, chỉ thay mặt được tài khoản giả; địa chỉ giả không nhận email thật, không được mời Calendar, không làm đầy lịch admin.

### 3.5 Nhịp tim cho giám sát (chuẩn bị cho Q4)

Mỗi job chạy xong ghi giờ (`HB_<job>` trong Script Properties). Trang `.../exec?page=health` trả **OK**, hoặc **STALE** khi một job ngừng quá hạn (hourlyJob 150 phút, reminderJob 45 phút, calendarJob 30 phút, nightlyBackup và dailyJob 26 giờ). Không đọc Sheets, không lấy khoá. Anh chọn dịch vụ đọc trang này ở `TU_VAN_GIAM_SAT_16_10.md`.

### 3.6 Xuất bản PRODUCTION chia nhiều file (chỉ khi anh yêu cầu)

Lệnh `node test/build_dist.js --production` sinh `dist_production/`: mỗi file `src/*.gs` một file, `Index.html`, `appsscript.json`, `MANIFEST.txt` (mã băm từng file để đối chiếu sau khi dán). Test I88 nạp các file theo thứ tự ngược vẫn chạy (Apps Script nạp theo thứ tự trong trình soạn). **Chưa sinh** bộ file này (luật 44): anh nói "xuất PRODUCTION" thì em sinh và gửi.

## 4. Kịch bản anh kiểm tay trên STAGING sau khi cập nhật (khoảng 40 phút)

| # | Làm | Đúng khi |
|---|---|---|
| 1 | Menu 2 Kiểm tra hệ thống | Không lỗi, đủ 9 trigger |
| 2 | Học viên đặt 1 buổi ngày mai (10:00 đến 21:00) | Email xác nhận ngay; 5 đến 10 phút sau có thư mời Calendar có link Meet |
| 3 | Học viên đặt 1 buổi lúc 22:30 cho ngày mốt | Email xác nhận ghi giờ thư mời dự kiến khoảng 07:0x; sáng hôm sau mới có thư mời |
| 4 | Tutor xin link, bấm 2 lần; xin link khác, chờ 16 phút mới bấm | Lần 2 "đã được dùng"; link chờ lâu "đã hết hạn"; tutor không nhận "New sign in" |
| 5 | Mở tab Tài khoản học viên, Account tutor (điện thoại và máy tính) | Không còn mục thiết bị; số buổi tháng của tutor vẫn đủ |
| 6 | Admin đăng nhập | Admin vẫn nhận "Có đăng nhập mới"; trang quản trị như cũ |
| 7 | Menu Bảo trì: chỉ xem. Học viên bấm Đặt | Câu bảo trì, không có dòng mới ở BOOKINGS; thanh vàng đầu trang |
| 8 | Menu Bảo trì: đóng cổng. Mở cổng học viên, trang chủ | Trang bảo trì; form đăng ký khoá nút Gửi; admin vẫn vào được |
| 9 | Menu Bảo trì: tắt | Mọi thứ như cũ, thanh báo tự tắt sau lượt bấm kế |
| 10 | Menu Lưu trữ: xem tình trạng | Hiện số dòng mỗi tab (bình thường "0 sẽ chuyển" vì dữ liệu chưa đủ 6 tháng) |
| 11 | Menu Phát hành: sao lưu ngay | Có file trong thư mục `THAIPUT_V8_STAGING_Releases` |
| 12 | Mở `WEBAPP_URL?page=health` (thêm `?page=health` vào cuối link /exec) | Chữ OK |
| 13 | Thử tải theo `HUONG_DAN_THU_TAI.md` | Menu kiểm kết quả: "Dữ liệu đúng luật" |
| 14 | Menu Xoá dữ liệu test (mức 1) sau thử tải | Học viên giả và booking giả hết; sự kiện Calendar giả bị gỡ |

## 5. Rủi ro còn lại (nói thẳng)

* **Chưa đo trên Google thật.** Mọi số trong 5F và 5G là đếm và giả lập. Thử tải (mục 3.4) là lần đầu có số thật. Nếu p95 đặt lịch quá 8 giây hoặc có "Google từ chối" khi 30 đến 50 người cùng bấm: đó là lúc cân nhắc giai đoạn 1 (Cloudflare) theo lệnh của anh.
* **Lưu trữ chỉ chạy thật sau 6 tháng.** Code đã thử phá 13 kiểu hỏng (thiếu dòng khi đọc lại; bị cắt giữa chép và bỏ; bị cắt giữa ghi và xoá đuôi; lệnh ghi bị Google từ chối; admin sắp xếp tab hoặc gõ dòng tay lúc bỏ; admin sắp xếp tab sau khi hỏng; file ở thùng rác; mã trùng; link lệch kể cả khi có hàng trống; đang bảo trì; chưa có bản sao; sao lưu bỏ lượt vì bận). Trên Google thật chưa chạy lần nào. Trước tháng thứ 6 em đề nghị chạy menu "Lưu trữ: xem tình trạng" để xem số dòng.
* **Email đã gửi trước khi lưu trữ** có link "mở đúng dòng" theo số hàng cũ; link trong NOTIFICATIONS thì đã được sửa.
* **Hỏng giữa chừng rồi admin sửa tay tab đó trước lượt dọn** (cửa sổ tối đa 1 giờ): hệ thống không tự xoá, gửi email Khẩn `PURGE_CHECK`; admin xoá tay dòng trùng ở cuối tab theo hướng dẫn trong email.
* **Cột công thức admin tự thêm** (ngoài cột của hệ thống) dùng tham chiếu tương đối, ví dụ `=A5`: sau khi bỏ dòng, công thức bị chép nguyên chữ sang hàng mới nên trỏ lệch. Cột của hệ thống không có công thức kiểu này. Muốn thêm cột tính toán: dùng tab riêng, hoặc hỏi em.
* **Bản sao hằng tháng của file lưu trữ** trong Releases tăng dần (mỗi tháng 1 bản mỗi năm). Chỉ tốn dung lượng Drive; xoá tay bản cũ nếu cần.
* **Phiên tutor đang mở** trong bộ đệm có thể sống thêm tối đa 2 phút sau khi menu 1 rút hạn.
* **`browser.js` tìm trang web trong khung lồng của Apps Script** (2 lớp iframe). Đã thử với bản demo, chưa thử với trang Apps Script thật; nếu báo "Không thấy cổng học viên", gửi em ảnh màn hình (chạy với `--headed`).
* **Xoá dữ liệu test sau thử tải lớn:** gỡ sự kiện Calendar từng cái một. Với trên 500 buổi giả có thể quá 6 phút; khi đó chạy lại menu lần nữa.
* **Hạn mức dùng thử** (mục 1) thấp hơn tài khoản trả phí trong 2 tháng đầu.

## 6. Câu hỏi cần anh chốt (mỗi câu có phương án)

1. **Q4 giám sát:** chọn phương án trong `TU_VAN_GIAM_SAT_16_10.md` (A Google Cloud miễn phí, B UptimeRobot trả phí khoảng 9 đến 10 USD/tháng, C Better Stack nhịp tim, D chưa giám sát). Em đề xuất B cho PRODUCTION, D cho STAGING.
2. **Phiên tutor 30 ngày:** (a) giữ 30 ngày như trước 5D (em đã làm); (b) 7 ngày (tutor xin link mỗi tuần); (c) 1 ngày (xin link mỗi ngày, an toàn nhất, phiền nhất); (d) 90 ngày như 5D.
3. **Email "Có đăng nhập mới" cho tutor:** (a) tắt (em đã làm, khớp với bỏ thiết bị); (b) bật lại chỉ báo giờ đăng nhập, không ghi thiết bị (ghi `NEW_LOGIN_EMAIL_ROLES = ADMIN,TUTOR`).
4. **Mốc lưu trữ:** (a) BOOKINGS giữ 6 tháng, nhật ký 3 tháng (em đã làm); (b) 12 tháng và 6 tháng (file DB lớn gấp đôi, đặt lịch chậm hơn ở năm thứ 2); (c) tắt lưu trữ (`ARCHIVE_ENABLED = FALSE`) tới khi anh yêu cầu.
5. **Thời điểm xuất bản PRODUCTION chia file:** sau khi anh báo STAGING ổn, anh chỉ cần nói "xuất PRODUCTION".

<!-- END FILE: v8/history/CHUNK5G_GIAI_THICH.md -->

---

## `v8/history/CHUNK5H_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:10Z*

<!-- BEGIN FILE: v8/history/CHUNK5H_GIAI_THICH.md | bytes=13447 | sha256=897c0257655a4968374925d9c93c24cb0d0ce1d407a0035d8af2277b27d4d515 | created=2026-10-29T14:41:10Z -->
# Giải thích chunk 5H · Hai thứ tiếng, CONTENT có chỉ đường, email marketing, giao diện mới (bản 8.0.9)

*Ngày 17/10/2026. Viết cho admin, không cần biết code.*

## 1. Đã làm gì (theo đúng yêu cầu 17/10)

| # | Yêu cầu | Đã làm |
|---|---|---|
| 1 | Code.gs, Index.html không tách file | Vẫn một file mỗi loại (`dist/Code.gs` khoảng 7.400 dòng, `dist/Index.html` khoảng 1.900 dòng, đã gộp 7 phần giao diện) |
| 2 | Giao diện đẹp, chuyên nghiệp hơn trên máy tính và điện thoại | Làm lại toàn bộ phần trình bày: logo có ký hiệu chữ Thái, thanh đầu trang mờ khi cuộn, thẻ gói học có viền vàng, ô giờ rõ hơn, ô buổi học có tên thứ, thanh tab có vạch chỉ tab đang mở, số đỏ trên tab có việc cần làm, hộp thoại có tay kéo trên điện thoại, chế độ tối đủ màu. Máy tính từ 900px: cột trái 232px, lưới tuần của tutor |
| 3 | Thông báo của admin gọn hơn | Mỗi thông báo một dòng: chấm màu theo mức (đỏ Khẩn, cam Cần xử lý, xanh Thông tin), nội dung, giờ. Gom theo ngày (Hôm nay, Hôm qua, ngày). Bộ lọc là nút bấm có số đếm thay cho 2 ô chọn. Ô số liệu trên cùng nhỏ lại, máy tính một hàng 6 ô. Bấm một thông báo là mở chi tiết và đánh dấu đã đọc luôn |
| 4 | Nút Vi/Eng cho từng người tự chọn | Nút **VI \| EN** góc trên mọi trang (trừ trang quản trị). Lựa chọn lưu trên máy và ở cột mới `lang` của USERS, nên mở trên thiết bị khác vẫn đúng |
| 5 | Hỏi ngôn ngữ khi đăng nhập lần đầu qua link | Hộp **Chọn ngôn ngữ · Choose your language** hiện một lần, trước khi vào cổng, khi tài khoản chưa chọn. Nút chính: học viên Tiếng Việt, tutor English |
| 6 | Tab CONTENT đổi theo, có cột giải thích để điều hướng, áp cho cả Vi và Eng | Tab CONTENT mới: `key`, `page` (trang nào), `position` (chỗ nào), `shown_when` (hiện khi nào), `vi`, `en`, `default_vi`, `default_en`, `note`. Đủ 267 dòng, dòng nào cũng có đủ giải thích. Chữ admin đã sửa ở tab cũ được chép sang đúng cột |
| 7 | Email marketing: tab riêng, cách sửa, cách gửi qua menu, ghi vào hướng dẫn vận hành | Tab mới MARKETING_EMAILS (mỗi dòng một chiến dịch), menu **Email marketing → Gửi thử một chiến dịch cho tôi** và **Gửi chiến dịch**; hướng dẫn Phần G của `HUONG_DAN_VAN_HANH.md` |
| 8 | Các hướng dẫn viết độc lập, dễ hiểu, không nhắc file khác, bỏ đại từ nhân xưng | Viết lại 4 file: triển khai Workspace, vận hành, thử tải, phát hành. Mỗi file tự đủ (đã chép phần DNS, giám sát, kiểm tay, thử tải vào hướng dẫn triển khai). Không còn "anh", "em", "bạn"; chỗ cần người làm ghi "admin" hoặc "coder" |

## 2. Hai thứ tiếng chạy thế nào

* Máy chủ gửi cho trang **cả hai thứ tiếng** của mọi chữ. Trang hiện thứ tiếng đang chọn. Bấm VI | EN đổi ngay, không tải lại, không gọi máy chủ, nên giờ đang chọn, giờ rảnh chưa lưu, chữ đang gõ trong form, ảnh chuyển khoản đã chọn đều giữ nguyên.
* Câu báo lỗi của máy chủ (đặt không được, hết hạn huỷ, bảo trì...) cũng gửi cả hai thứ tiếng; trang hiện đúng thứ tiếng đang chọn.
* Tên thứ trong tuần, nhãn trạng thái buổi học (Xác nhận, Hoàn thành...) giờ do trang dựng từ mã, theo thứ tiếng đang chọn. Trước đây máy chủ gửi sẵn chữ tiếng Việt (cổng học viên) hoặc tiếng Anh (cổng tutor).
* Email hệ thống vẫn luôn có hai thứ tiếng; thứ tiếng người nhận đã chọn nằm trên.
* Trang quản trị giữ tiếng Việt (2 co-founder dùng), không có nút đổi.
* Không đổi: tên gói (tab PACKAGES), thông tin ngân hàng hiện nguyên văn như admin ghi.

## 3. Email marketing chạy thế nào

1. Viết một dòng ở MARKETING_EMAILS: mã, nhóm nhận (mọi học viên, học viên còn gói, học viên hết gói, tutor, tất cả), chữ hai thứ tiếng, `status = DRAFT`.
2. **Gửi thử cho tôi**: một email `[THỬ · TEST]` tới chính người bấm, không tính là đã gửi.
3. Đổi `READY`, bấm **Gửi chiến dịch**: hộp thoại hiện số người, số đã nhận, hạn mức còn lại; bấm Có mới gửi.
4. An toàn: mỗi người một lần mỗi mã (chạy lại chỉ gửi người chưa nhận); dừng khi hạn mức email trong ngày chỉ còn 100 (giữ cho email xác nhận, huỷ, link đăng nhập); dừng sau 4,5 phút và chạy lại để gửi tiếp; người xin ngừng nhận (ô `marketing_opt_out` của USERS ghi TRUE), tài khoản khoá, admin, địa chỉ thử tải không bao giờ nhận; chân email luôn có câu hướng dẫn ngừng nhận.

## 4. File nào đổi

| File | Đổi gì |
|---|---|
| `src/Content.gs` | Viết lại: 267 chữ, mỗi chữ có tiếng Việt, tiếng Anh, vị trí, lúc xuất hiện; câu báo lỗi hai thứ tiếng; chuyển tab CONTENT cũ sang mới; ngôn ngữ của người dùng |
| `src/Marketing.gs` (mới) | Chiến dịch, nhóm nhận, kiểm lỗi, dựng email, gửi có chống trùng, hạn mức, giới hạn thời gian, 2 menu |
| `src/Schema.gs` | Tab CONTENT cột mới; USERS thêm `lang`, `marketing_opt_out`; tab MARKETING_EMAILS |
| `src/Setup.gs` | Menu 1: đổi tên tab cũ, gieo chữ mới, chép chữ đã sửa, dòng ví dụ marketing, ô chọn cho `status`, `audience`, `lang` |
| `src/Api.gs`, `src/Auth.gs` | Câu báo lỗi hai thứ tiếng; `apiSetLanguage`; đăng nhập trả ngôn ngữ đã chọn |
| `src/EmailTemplates.gs` | Thứ tiếng người nhận đã chọn lên trên; mẫu `MARKETING_FOOTER` |
| `src/Admin.gs` | Menu Email marketing; nút kiểm nội dung báo thêm lỗi `{...}`, danh sách `\|`, chiến dịch |
| `src/Maintenance.gs`, `src/Config.gs` | `apiSetLanguage` bị chặn khi bảo trì; ô `MARKETING_QUOTA_RESERVE`; phiên bản 8.0.9 |
| `src/ui/*.html` | Giao diện mới, nút VI \| EN, hộp chọn ngôn ngữ, thông báo admin gọn |
| 4 hướng dẫn | Viết lại độc lập |
| `test/*` | 7 test tích hợp mới (I96 đến I102), 6 test giao diện mới (U32 đến U37), sửa 8 test cũ theo cấu trúc mới; mock thêm `Sheet.setName` |

## 5. Tự kiểm tra trên STAGING (khoảng 30 phút)

Cập nhật đúng thứ tự: dán `Code.gs`, `Index.html` → **Lưu** → menu 1 → **Triển khai phiên bản mới** → menu 2. Rồi:

| # | Làm | Đúng khi |
|---|---|---|
| 1 | Đọc hộp thoại menu 1 | Có "Tab CONTENT bản cũ đổi tên thành CONTENT_CU_808", "Chép N chữ admin đã sửa", "Tạo tab MARKETING_EMAILS" |
| 2 | Mở tab CONTENT, lọc cột `page` = Cổng tutor | Thấy chữ tutor, cột `vi` và `en` đều có chữ, cột `position`, `shown_when` có giải thích |
| 3 | Mở trang chủ trên điện thoại, bấm VI \| EN | Toàn bộ chữ đổi; chữ đã gõ trong form còn nguyên |
| 4 | Xoá trống ô `lang` của một học viên thử, gửi link đăng nhập, bấm link | Hộp chọn ngôn ngữ; chọn English thì cổng tiếng Anh, ô `lang` ghi `en` |
| 5 | Học viên đó đặt 1 buổi | Email xác nhận tiếng Anh ở trên |
| 6 | Trang quản trị trên máy tính và điện thoại | Thông báo mỗi dòng một tin, gom theo ngày, lọc bằng nút |
| 7 | MARKETING_EMAILS: **Gửi thử một chiến dịch cho tôi**, mã `VI_DU` | Email `[THỬ · TEST]` tới hộp thư người bấm |
| 8 | Đổi `VI_DU` sang READY, nhóm `TUTORS`, **Gửi chiến dịch**, bấm Không | Không ai nhận; hộp thoại có số người |
| 9 | Menu 2 | Không lỗi |

## 6. Đã soát thế nào

* 3 agent độc lập, 2 vòng. Vòng 1: một agent soát máy chủ, một agent soát giao diện (có chạy trình duyệt thật, chụp ảnh 375px và 1280px). Vòng 2: agent thứ ba kiểm lại từng bản sửa và tìm lỗi mới do bản sửa gây ra.
* Lỗi đã sửa sau soát (chi tiết ở `reports/REPORT_CHUNK5H.md`):
  * menu 1 bị ngắt sau khi đổi tên tab CONTENT cũ thì chữ admin đã sửa không bao giờ được chép (giờ chạy lại menu 1 là chép tiếp);
  * hai người cùng bấm gửi một chiến dịch thì mỗi học viên nhận 2 email (giờ lượt thứ hai bị từ chối);
  * Google lỗi lúc ghi nhật ký gửi thì lần sau gửi lại tới 10 người (giờ ghi lại có chống trùng);
  * không dừng được chiến dịch đang gửi (giờ đổi DRAFT là dừng);
  * bấm VI | EN lúc đang gửi đăng ký, đặt lịch, gia hạn, lưu giờ rảnh thì nút gửi bật lại và gửi được 2 lần (giờ trong lúc gửi nút VI | EN chỉ báo chờ);
  * đổi ngôn ngữ làm mất chữ đang sửa ở tab Tài khoản; trang bảo trì biến mất khi đổi ngôn ngữ; trang quản trị lẫn tiếng Anh;
  * 12 lỗi nhỏ khác (thanh đầu trang trong suốt trên iPhone đời cũ, số đếm đè chữ, tutor thấy trình độ tiếng Việt...).
* Thử phá code: cài cố ý 62 lỗi vào phần code mới. Test bắt 59; 3 lỗi còn lại không đổi hành vi thật (một chỗ đã có lớp chặn thứ hai, một chỗ không bao giờ xảy ra, một chỗ đã bị chặn sớm hơn).
* Bộ test: 26/26, 40/40 kịch bản, 102/102 tích hợp, 37/37 giao diện, 2/2 thử tải.

## 7. Rủi ro còn lại (nói thẳng)

* **Chưa chạy trên Google thật.** Đổi tên tab, ẩn tab, gửi email theo lô, hộp thoại menu đều chạy trong bộ giả lập. Lần cập nhật STAGING đầu tiên là lần chạy thật đầu tiên; làm đúng mục 5.
* **Bước chép chữ cũ chép cả chữ gốc cũ.** Bản 8.0.8 không tự cập nhật ô `value` khi chữ gốc trong code đổi, nên vài dòng admin chưa từng sửa cũng được chép (che chữ gốc mới của 8.0.9). Mỗi dòng đã chép có ghi chú "Chép từ bản 8.0.8, xem lại" ở cột `note`; nên lọc cột đó và xoá trống những ô không cố ý sửa. Không có cách tự phân biệt.
* **Giữa menu 1 và Triển khai**, trang web bản cũ tạm hiện chữ gốc (không đọc được tab CONTENT mới). Triển khai ngay sau menu 1.
* **Dừng chiến dịch có độ trễ một lô:** đổi DRAFT thì có thể thêm tối đa 9 email nữa mới dừng.
* **Nhớ người đã nhận theo MAIL_LOG trong 3 tháng.** Gửi lại cùng mã sau hơn 3 tháng có thể tới lại người đã nhận (MAIL_LOG cũ đã chuyển sang file lưu trữ). Chiến dịch mới dùng mã mới.
* **Email marketing chưa có nhãn quảng cáo và link một bấm để ngừng nhận.** Hiện người nhận phải nhắn Zalo để ngừng. Luật Việt Nam về thư điện tử quảng cáo có thể đòi nhãn và cách từ chối riêng: chưa kiểm được vì nguồn tra luật không kết nối trong phiên này. Xem câu hỏi 3.
* **Hai dòng USERS cùng một email** (vừa học viên vừa tutor), nhóm ALL: người đó nhận 1 email theo dòng đầu tiên.
* **Menu 1 sửa câu giải thích hàng loạt ở bản sau** sẽ ghi từng ô trong khoá (vài trăm lệnh ghi): chạy menu 1 giờ vắng. Bản 8.0.9 không bị (tab mới, ghi một lần).
* **Hộp thoại trên web không giữ phím Tab** (bấm Tab có thể đi ra nút phía sau; Enter trên nút VI | EN phía sau đã bị chặn). Nút Zalo nổi vẫn có lúc che một phần nút ở mép phải khi cuộn.
* **Trang quản trị để mở qua đêm:** nhóm "Hôm nay" chỉ đổi khi tải lại trang.

## 8. Cần admin quyết định (mỗi câu có phương án)

1. **2 file hướng dẫn cũ** (`HUONG_DAN_CHAY_THU_GMAIL.md`, `CHUYEN_SANG_WORKSPACE.md`, đã được thay bằng hướng dẫn triển khai Workspace): (a) để trong project, thêm dòng đầu "ĐÃ THAY, không dùng"; (b) xoá khỏi project (coder đề xuất, tránh làm theo nhầm); (c) để nguyên.
2. **Trang quản trị có cần VI | EN không?** (a) giữ tiếng Việt (đã làm, 2 co-founder dùng); (b) thêm VI | EN cho trang quản trị: đưa toàn bộ chữ cố định của trang quản trị vào CONTENT (một chunk nhỏ).
3. **Cách ngừng nhận email marketing:** (a) giữ như hiện tại: nhắn Zalo, admin ghi `TRUE` ở `marketing_opt_out`; (b) thêm link "Ngừng nhận" một bấm trong chân email (trang xác nhận trên web, tự ghi `TRUE`), và thêm tiền tố nhãn quảng cáo trong tiêu đề nếu luật đòi (coder đề xuất trước khi gửi chiến dịch lớn); (c) (b) cộng tra luật trước, khi có nguồn tra luật hoặc người nắm pháp lý xác nhận.
4. **Ngày đã có buổi trong tab Đặt lịch:** đã đổi thành gập sẵn để màn hình đầu thấy giờ còn đặt được. (a) giữ; (b) mở như cũ.

<!-- END FILE: v8/history/CHUNK5H_GIAI_THICH.md -->

---

## `v8/history/CHUNK5I_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:41:11Z*

<!-- BEGIN FILE: v8/history/CHUNK5I_GIAI_THICH.md | bytes=15889 | sha256=d8a9d29c3119afd915aa40c280da32f78d46e27c69f4da04787764096136e8c0 | created=2026-10-29T14:41:11Z -->
# Giải thích chunk 5I · Email không tới, tốc độ, song ngữ toàn diện trang quản trị, nhật ký đầy đủ (bản 8.0.10)

*18/10/2026. Đọc riêng file này là đủ; không cần mở file khác.*

## 1. Đã làm gì (theo đúng yêu cầu 18/10)

| Yêu cầu | Kết quả |
|---|---|
| Gửi link đăng nhập bằng admin@ mà người nhận không thấy thư, menu 2 vẫn trừ hạn mức | Chẩn đoán có nguồn (mục 2). Thêm menu **Kiểm tra gửi email (thư có mã, hướng dẫn tìm thư bị mất)**: gửi thư có mã `MT...`, báo tài khoản gửi, hạn mức trước và sau, 4 bước tìm thư (hộp thư và Thư rác, thư báo lỗi, Email log search, xác thực tên miền). Hướng dẫn triển khai có mục 12 riêng |
| Tại sao Workspace mà hạn mức chỉ 100 | Tài khoản Workspace đang dùng thử bị giới hạn thêm (Google ghi rõ, không công bố số). Menu 2 nhận ra tình trạng này và ghi dòng LƯU Ý; con số "đã gửi hôm nay" nay đếm 24 giờ trượt như Google, không đếm địa chỉ thử tải |
| Triển khai bằng admin@ chậm hơn hẳn | Đo số lần gọi Google trên giả lập, sửa phần thừa (mục 3). Không có tài liệu nào nói Workspace chậm hơn Gmail; có quy trình đo trên hệ thống thật (hướng dẫn triển khai mục 13) |
| Song ngữ toàn diện giao diện admin, tên gói | Mọi chữ trang quản trị đi qua key `ad.*` (khoảng 260 key, đủ tiếng Việt và tiếng Anh): ô số liệu, tab, nút, hộp thoại, tên sự kiện, tên hành động nhật ký, trạng thái, lý do huỷ, câu báo lỗi máy chủ. Thông báo mới lưu thêm `message_en`. Gói có cột `name_en`, hiện ở trang chủ, thẻ gói, gia hạn, email. Tiêu đề trang, thanh demo cũng hai thứ tiếng. Admin chọn ngôn ngữ như học viên, tutor (lần đầu được hỏi, kể cả đăng nhập bằng Google) |
| Nhật ký admin ghi mọi hoạt động, xoá tin cũ sau 2 tháng, hiện xem trước, bấm vào đọc | Ghi mọi API ghi, job, menu có thay đổi, đăng nhập, thoát, sửa tay trong Sheets (ô, giá trị cũ và mới), đổi cấu trúc tab (chèn, xoá dòng, cột; thêm, xoá, đổi tên tab ghi đúng tên; tab hệ thống bị xoá hoặc đổi tên thì báo Khẩn). Trang hiện 60 ngày; cũ hơn job đêm chuyển sang file lưu trữ theo năm, khoảng mỗi tuần một lần (không xoá hẳn, giữ luật 10). Khoá bận thì dòng nhật ký vào hàng chờ bền, ghi bù sau, không mất, không trùng. Mỗi dòng một câu xem trước khoảng 160 ký tự; bấm mở hộp đọc đủ (JSON xếp dòng), nút đi tới buổi, người, đúng dòng Sheets. Lọc Người dùng, Hệ thống; tìm theo tên hành động đang hiện ở cả hai thứ tiếng; Xem thêm không trùng, không sót, không lặp; nút Tải lại, bấm tab là lấy mới |
| Mọi nút của thông báo admin bấm được | Cả 6 ô số liệu bấm được (lọc thông báo, mở tab Sheets, danh sách buổi hôm nay và chờ tutor xác nhận ngay trên trang). Hộp thông báo có nút xem buổi (tối đa 3 buổi), xem học viên, tutor, xem tài khoản, mở dòng Sheets. Danh sách thông báo có nút Tải lại; bấm tab hay ô số liệu là lấy tin mới và số mới |
| 4a | Giữ nguyên: ngày đã đặt vẫn thu gọn |

## 2. Chẩn đoán email (có nguồn)

1. **Hạn mức bị trừ không có nghĩa là thư đã tới.** Apps Script đếm người nhận khi Google nhận thư từ script. Sau đó thư còn qua máy chủ người nhận: có thể vào Thư rác, bị trả lại, hoặc tới địa chỉ không có hộp thư.
2. **Nguyên nhân hay gặp nhất với tên miền mới:** chưa bật DKIM (DKIM của Workspace không tự bật, phải bấm Bắt đầu xác thực trong admin.google.com) hoặc thiếu SPF. Gmail ghi thư không xác thực có thể bị đánh dấu thư rác hoặc bị từ chối với lỗi 5.7.26.
3. **Cách biết chắc:** admin.google.com → Báo cáo → Tìm kiếm nhật ký email (`admin.google.com/ac/emaillogsearch`), kết quả hiện sau 1 phút tới 1 giờ: Đã giao, Bị trả lại, hoặc không có dòng nào.
4. **Hạn mức 100:** bảng hạn mức Apps Script ghi 100 người nhận mỗi ngày cho tài khoản thường, 1.500 cho Workspace, và "Additional limits apply for trial accounts". Hạn mức chỉ tăng sau khi chuyển sang trả phí, đã trả tổng cộng 100 USD và qua 60 ngày (trang Gmail ghi có thể tới 75 ngày). Code không đổi được con số này.
5. **Gửi bằng Gmail API:** trang giới hạn gửi của Gmail ghi tài khoản dùng thử gửi tối đa 500 thư mỗi ngày, không tăng trong thời gian dùng thử. Không có tài liệu nào của Google nói thư gửi qua Gmail API có trừ vào hạn mức MailApp hay không: chưa kiểm chứng. Không sửa được thư vào Thư rác.
6. **Tên trạng thái trong Email log search** (theo bảng chính thức của Google): Delivered, Marked spam, Bounced, Dropped, In progress. Công cụ Check MX kiểm MX, SPF và DKIM (ô DKIM selector nhập `google`).

## 3. Tốc độ: đã sửa gì

* Một lượt đặt lịch trước mở file dữ liệu tới 4 lần, nay tối đa 3 (mở lại một lần mỗi khi vào khoá để dữ liệu quyết định ghi luôn mới); đọc cấu hình môi trường từ khoảng 18 lần còn khoảng 2.
* Ghi một dòng nhật ký hay MAIL_LOG không còn đọc cả tab (hai tab lớn nhanh nhất). Đo trên 20.000 dòng nhật ký: lượt đặt không còn đọc 120.000 ô.
* Trang quản trị mở lần đầu một lượt gọi máy chủ (trước hai).
* Không có nguồn chính thức nói Apps Script trên Workspace chạy chậm hơn. Mỗi lượt gọi máy chủ luôn mất khoảng nửa giây tới hơn một giây; bản demo chạy trong trình duyệt nên nhanh hơn hẳn, so hai bản là so sai.

## 4. File nào đổi

* Máy chủ: Config.gs (8.0.10, nhớ ENV và DB_ID trong lượt chạy, `ACTIVITY_LOG_KEEP_DAYS` 60), Db.gs (mở file DB qua `dbSpreadsheet_`, `logAppend_`, `purgeRows_` không biến chữ thành công thức, giữ dòng chờ ghi; `appendRowsRaw_` không ghi đè cột admin thêm), Api.gs, AdminApi.gs (viết lại: song ngữ, danh sách buổi, nhật ký phân trang theo thời gian, đọc đủ một dòng), Content.gs (key `ad.*`), Schema.gs (`name_en`, `message_en`), Setup.gs (gói mặc định có tên tiếng Anh, 10 trigger, dòng hạn mức ở menu 2), Notify.gs (hạn mức 24 giờ trượt, chẩn đoán dùng thử, thư kiểm tra), EmailTemplates.gs (MAIL_TEST, ADMIN_NOTICE song ngữ), Notifications.gs, Log.gs (`logMenu_`, hàng chờ khi khoá bận), Admin.gs (SHEET_EDIT, SHEET_CHANGE, menu mới), Archive.gs (nhật ký theo ngày, gom mới chuyển), Maintenance.gs, Auth.gs, Backup.gs, Marketing.gs, Booking.gs, Packages.gs, CalendarQueue.gs, Jobs.gs, Time.gs, LoadTest.gs, và mọi chỗ gọi `notify_` (thêm `message_en`).
* Giao diện: ui/Admin.html (viết lại), App.html, Login.html, Home.html, Student.html, Styles.html, Index.html.
* Test: gas_mock.js (trigger onChange; ô chữ có dấu nháy không bị coi là công thức, như Google thật), integration.js (I103 đến I110), ui.js (U38 đến U44).
* Demo: demo_mock.js theo hợp đồng API mới, dữ liệu nhất quán; thanh demo hai thứ tiếng.
* Tài liệu: 4 hướng dẫn (triển khai Workspace mục 12, 13 mới; vận hành Phần I mới), CLAUDE.md (luật 12, 33, 45, 46, 47, 50, 52, 53).

## 5. Tự kiểm tra trên STAGING (khoảng 30 phút)

1. Dán `dist/Code.gs`, `dist/Index.html`, **Lưu**, chạy menu 1, rồi **Triển khai → Quản lý các lần triển khai → phiên bản mới**.
2. Menu 2: KHÔNG CÓ LỖI, "Đủ 10 trigger", đọc các dòng về hạn mức email.
3. Menu **Kiểm tra gửi email** tới một Gmail cá nhân và một địa chỉ tutor không nhận được thư. Ghi mã `MT...`, làm đủ 4 bước trong hộp thoại. Gửi coder kết quả bước Email log search nếu thư vẫn không tới.
4. Mở trang web bằng admin, chọn English: mọi chữ tiếng Anh; bấm lần lượt 6 ô số liệu, một thông báo, các nút trong hộp.
5. Tab Nhật ký: thấy dòng đăng nhập, dòng "Gửi email kiểm tra". Sửa một ô trong tab CONFIG, chèn rồi xoá một dòng trống trong tab USERS, thêm rồi xoá một tab trống tên THU: trang Nhật ký (bấm Tải lại) có dòng "Sửa tay trong Sheets" và "Đổi cấu trúc tab" ghi đúng tên tab THU. Không đổi tên tab hệ thống để thử (sẽ có thông báo Khẩn và email).
6. Tab PACKAGES: điền `name_en` cho gói còn trống; trang chủ ở English hiện tên tiếng Anh.
7. Menu **Đo tốc độ (chỉ đọc)** và trang Lần thực thi: chép số liệu nếu vẫn thấy chậm (hướng dẫn triển khai mục 13.2).

## 6. Đã soát thế nào

* Test: 26/26 hàm thuần, 40/40 kịch bản, 110/110 tích hợp, 44/44 giao diện, 2/2 thử tải.
* Soát độc lập vòng 1 bởi 2 agent (máy chủ 16 mục, giao diện 19 mục): sửa đủ 35 mục, test hồi quy I109, U43; thử phá lại 15 bản sửa: test bắt đủ 15.
* Soát độc lập vòng 2 bởi 2 agent khác trên bản đã sửa: máy chủ 9 phát hiện mới (N1 VỪA), giao diện và tài liệu 9 phát hiện mới (N1, N2 VỪA) cùng 9 mục tài liệu (D1 VỪA). Không có mức CAO. Đã sửa hết, test hồi quy I110, U44 và bổ sung I104, I108, I109.
* Thử phá 3 vòng: 60 lỗi cài cố ý vào code 5I, cả 60 bị test bắt (4 lỗi lần đầu lọt, đã thêm kiểm rồi chạy lại đều bị bắt).

## 7. Vòng 2 đã sửa gì

* Hàng chờ nhật ký khi khoá bận chuyển từ bộ nhớ đệm (có thể mất, trùng, vượt 100KB) sang Script Properties, mỗi dòng một khoá, chỉ xoá sau khi đã ghi xong.
* "Xem thêm" của nhật ký không lặp vô tận khi hàng trăm dòng cùng một giờ (STAGING giả lập giờ); mở chi tiết không nhầm dòng cùng giờ, cùng hành động.
* Thêm, xoá, đổi tên tab ghi đúng tên tab; tab hệ thống bị xoá hoặc đổi tên thì báo Khẩn và email (sự kiện mới SHEET_REMOVED).
* Bỏ dòng (lưu trữ) không biến chữ "=..." của cột admin tự thêm thành công thức.
* Menu Kiểm tra gửi email: mẫu MAIL_TEST tắt thì nói đúng nguyên nhân; khoá bận không làm menu báo sai rồi bị bấm gửi lại; đang giả lập giờ thì không đưa ra chẩn đoán hạn mức sai.
* Trigger đổi cấu trúc bỏ ngay các lần sửa ô, đổi định dạng (không tốn lượt chạy).
* Chi tiết nhật ký cũ (khôi phục lưu trữ, dọn dòng, đăng nhập bị từ chối, lỗi Calendar...) ghi dạng JSON trung tính; mã hành động, mã đối tượng trong nhật ký là chữ (không bị Sheets đổi thành ngày); thông báo đặt buổi ghi ngày theo thứ ở cả hai thứ tiếng.
* Lưu trữ nhật ký gom theo tuổi (khoảng mỗi tuần một lần), không theo số dòng.
* Lý do huỷ mặc định: để nguyên chữ có sẵn thì lưu lý do mặc định, trang và thông báo hiện đúng thứ tiếng.
* Bấm tab hay ô số liệu là lấy thông báo, nhật ký, số mới; nút Tải lại thường trực ở danh sách thông báo và nhật ký.
* Trang lỗi có nút Thử lại và câu báo theo ngôn ngữ; đổi ngôn ngữ lúc đang tải không gọi máy chủ lần hai; tìm nhật ký ra cả "Gói chuyển sang ...", "Bảo trì: ...", "Admin (sửa trong Sheets)"; bàn phím về đúng nút sau khi vẽ lại, hộp thoại có tên và giữ phím Tab trong hộp; đặt thay lỗi sau khi đổi ngôn ngữ vẫn báo; ô số liệu tiếng Anh không bẻ chữ ở 360px.
* Demo theo đúng hợp đồng máy chủ (Xem thêm, tìm theo nhãn, số giờ chờ), dữ liệu nhất quán, thanh demo hai thứ tiếng, không tràn ở 360px.
* Tài liệu: tên gói song ngữ (name, name_en); hai cách tạo admintest@ và hệ quả; DKIM tới 48 giờ; Email log search; Check MX; Gmail API 500 thư mỗi ngày khi dùng thử; các câu lỗi thời; đại từ; số dòng.

## 8. Rủi ro còn lại (nói thẳng)

* Mở lại file DB mỗi lần vào khoá dựa trên suy luận an toàn; Google không ghi rõ đối tượng Spreadsheet có giữ bộ đệm đọc giữa hai khoá. Cần chạy STAGING có người đặt cùng lúc trước PRODUCTION.
* Hạn mức email 100 mỗi ngày là giới hạn của Google trong thời gian dùng thử; code chỉ dùng tiết kiệm và cảnh báo.
* Nhật ký ghi theo kiểu "ít nhất một lần": Google ghi xong mà báo lỗi sau đó thì các dòng ghi bù có thể bị ghi lần hai (hiếm, không mất dòng).
* Một lần admin chọn dropdown trong Sheets (ví dụ Huỷ bởi admin) lấy khoá nhiều lần (nhật ký và xử lý riêng); không sai dữ liệu, chỉ chậm hơn vài trăm mili giây.
* Dòng nhật ký và thông báo ghi trước 8.0.10 chỉ có tiếng Việt; tiêu đề lỗi hệ thống (SYSTEM_ERROR) giữ câu tiếng Việt của chỗ báo lỗi, thường kèm câu lỗi tiếng Anh của Google.
* Menu trong Google Sheets và hộp thoại menu vẫn chỉ tiếng Việt (chỉ admin dùng); kết quả menu 1 chỉ ghi số bước vào nhật ký.
* Đổi tên tab: Google không gửi tên cũ; hệ thống suy ra từ danh sách tab đã lưu (một tab mất, một tab mới trong cùng lần đổi).

## 9. Cần admin quyết định (mỗi câu có phương án)

1. **Gửi email trong lúc tổ chức còn dùng thử (khoảng 100 mỗi ngày):**
   * (a) chuyển tổ chức sang trả phí, chờ Google tự tăng hạn mức; trong lúc chờ tắt bớt email ít quan trọng (khuyến nghị: không đổi code, không rủi ro);
   * (b) coder thêm đường gửi bằng Gmail API, thử trên STAGING xem có thoát hạn mức MailApp không (chưa có nguồn chính thức; tối đa 500 mỗi ngày khi dùng thử);
   * (c) dùng dịch vụ gửi email chuyên dụng có xác thực tên miền (thêm chi phí và một bước cài đặt).
2. **Nhật ký cũ hơn 2 tháng:**
   * (a) chuyển sang file lưu trữ theo năm, trang quản trị không hiện (đang làm; khuyến nghị: còn bằng chứng khi tranh chấp, giữ luật không xoá nhật ký);
   * (b) xoá hẳn (cần bỏ luật không xoá nhật ký; mất bằng chứng).
3. **Có ghi cả lượt xem (mở trang, xem danh sách) vào nhật ký không:**
   * (a) không ghi lượt xem, chỉ ghi thao tác có thay đổi và đăng nhập, thoát (đang làm; khuyến nghị: tab nhật ký không phình nhanh, không chậm);
   * (b) chỉ ghi khi admin mở trang một học viên, tutor;
   * (c) ghi mọi lượt xem (tab lớn rất nhanh, mỗi lượt xem thêm một lần ghi).
4. **Menu trong Google Sheets (chỉ admin dùng):**
   * (a) giữ tiếng Việt (đang làm; khuyến nghị);
   * (b) làm song ngữ menu và hộp thoại menu (thêm chữ, không đổi chức năng).
5. **Hai câu từ chunk trước vẫn chờ:** xử lý các file hướng dẫn cũ (giữ, gộp, hay bỏ); và cách học viên từ chối nhận email marketing cùng phần pháp lý đi kèm.

<!-- END FILE: v8/history/CHUNK5I_GIAI_THICH.md -->

---

## `v8/history/GIAI_THICH_TONG_HOP_5A_5G.md`

*Ngày tạo trong Project: 2026-10-29T14:41:12Z*

<!-- BEGIN FILE: v8/history/GIAI_THICH_TONG_HOP_5A_5G.md | bytes=9811 | sha256=44666a04f14cfb70c722974f03504f1f92262a2315691e99dd0a75810148441f | created=2026-10-29T14:41:12Z -->
# Giải thích tổng hợp chunk 5A đến 5G · thaiput v8 bản 8.0.8

*Ngày 16/10/2026. Một file để anh đọc thay cho 7 file giải thích riêng. Chi tiết từng phần: `CHUNK5A_GIAI_THICH.md` đến `CHUNK5G_GIAI_THICH.md`. Kết quả test, soát, thử phá: `reports/REPORT_TONG_HOP_5A_5G.md`. Tiến độ: `PROGRESS.md`.*

## 1. Cập nhật STAGING một lượt (anh chốt: sau 5G mới cập nhật)

Menu 1 cộng dồn mọi thay đổi cấu trúc từ 5A đến 5G, nên file STAGING đang ở bản nào cũng cập nhật được một lần:

1. Trình soạn Apps Script của STAGING: dán đè **`Code.gs`** và **`Index.html`** (2 file trong `dist/`), bấm **Lưu**.
2. **Ngay sau đó** menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Hộp thoại liệt kê mọi thứ đã thêm hoặc đổi. Phải có dòng "Sao lưu trước cập nhật".
3. **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai** (mô tả: `8.0.8`).
4. Menu **2. Kiểm tra hệ thống**: không lỗi, đủ 9 trigger. Điền các ô menu 2 nhắc (ví dụ `WEBAPP_URL`, `ADMIN_ZALO_URL`, ngân hàng).
5. CONFIG: `ADMIN_EMAIL` là admintest@ trên STAGING (admin@ trên PRODUCTION).

Thứ tự Lưu → menu 1 → Triển khai là bắt buộc: trigger chạy code vừa Lưu ngay, không chờ Triển khai.

## 2. Hệ thống làm gì sau 5A đến 5G, theo từng phần

### 2.1 Đăng nhập và phiên (5A, 5D, đổi 16/10)
* Không mật khẩu. Nhập email, nhận link hạn **15 phút**.
* Học viên: link dùng nhiều lần trong 15 phút; phiên 30 ngày; mỗi tab trình duyệt giữ phiên riêng; làm mới trang không mất đăng nhập.
* Tutor: link **dùng 1 lần**, hạn 15 phút, phiên **30 ngày** (16/10). Không có danh sách thiết bị, không có email "Có đăng nhập mới" (16/10).
* Admin: link 1 lần hoặc đăng nhập bằng tài khoản Google (dự án phụ); email "Có đăng nhập mới" tới admin@ (2 co-founder cùng thấy). Admin thoát mọi phiên của bất kỳ tutor, học viên nào trong trang quản trị; đặt status DISABLED trong USERS là thoát ngay.
* Chống phá: xin link tối đa 3 lần mỗi 5 phút; link lạ, mã lạ, form rác không ghi Sheets, không lấy khoá.

### 2.2 Đặt lịch, huỷ, gói (chunk 2 đến 4, 5A, 5F)
* Hạn đặt và huỷ 15:00 hôm trước (hoặc `BOOKING_LEAD_HOURS`), 1 buổi mỗi ngày, trong hạn gói.
* Chia tutor xoay vòng trong nhóm ít buổi nhất tuần.
* Đặt nhiều ngày một lần: 1 email xác nhận. Trình duyệt tự thử lại khi đông người với cùng một mã lần bấm: không bao giờ đặt hay huỷ 2 lần.
* Mỗi thao tác lấy khoá tối đa 2 lần; lỗi sau khi đã ghi không bao giờ báo "thất bại".

### 2.3 Calendar và link Meet (5B, 5F, đổi 16/10)
* Đặt xong: booking ghi ngay, email xác nhận ngay.
* Sự kiện Calendar có link Meet và thư mời do hàng đợi tạo: **QUEUE** (16/10), trong khoảng 5 phút, trừ 22:00 đến 07:00. Buổi gấp (trong 3 giờ tới) tạo ngay. NIGHTLY 23h giữ làm dự phòng (1 ô CONFIG).
* Lỗi Calendar: thử lại có chờ, quá 5 lần báo Khẩn; cả lô lỗi báo Khẩn ngay.
* Admin@ là chủ sự kiện, vào được mọi phòng Meet, không nhận thư mời.

### 2.4 Thông báo cho admin (5B)
* Mọi sự kiện cần biết ghi tab NOTIFICATIONS (đỏ Khẩn, vàng Cần xử lý, xanh Đã đọc). Kênh EMAIL, DIGEST (tổng hợp 21:00) hay LOG chọn ở tab NOTIFY_RULES.
* Link trong email mở đúng dòng Sheets.
* Đối soát mỗi giờ: hai học viên trùng tutor cùng giờ, buổi sắp tới chưa có link Meet.
* Tutor xin huỷ slot đã có học viên: 4 lựa chọn, quá hạn tự Từ chối.

### 2.5 Chữ trên web và email sửa trên Sheets (5C)
* Tab CONTENT (chữ web) và EMAIL_TEMPLATES (mọi email, song ngữ). Ô trống = chữ gốc; ô `-` = cố ý để trống.
* Sửa xong: menu **Cập nhật nội dung web và email**, menu **Gửi thử một mẫu email cho tôi**.

### 2.6 Giao diện admin trên web (5E)
* Ô số liệu, thông báo lọc theo mức và người, chi tiết tutor, học viên, đặt thay, huỷ có lý do, nhật ký.
* Menu **Xoá dữ liệu test** 2 bước (chỉ STAGING; PRODUCTION khoá).

### 2.7 Chịu tải và đo (5F)
* Bộ đệm CONFIG 60 giây, slot 60 giây, phiên 120 giây. Mất bộ đệm thì đọc lại, không sai dữ liệu.
* Tab METRICS: số lượt, p95, bận, lỗi mỗi giờ. Menu **Đo tốc độ**.
* Tutor xác nhận kết quả 2 bước. Bố cục máy tính từ 900px.

### 2.8 Vận hành khi đang chạy (5G)
* **Bảo trì** chỉ xem hoặc đóng cổng, admin luôn dùng được (menu Bảo trì và phát hành).
* **Phát hành**: menu 1 tự sao lưu DB trước mỗi lần đổi phiên bản vào thư mục Releases (không bao giờ tự xoá). Quy trình và quay lui: `HUONG_DAN_PHAT_HANH.md`.
* **Lưu trữ hằng tháng** dòng cũ đã xong sang file theo năm (từ tháng thứ 7), không mất, không trùng.
* **Thử tải** trên STAGING: `HUONG_DAN_THU_TAI.md`.
* **Nhịp tim** cho giám sát bên ngoài: `?page=health` trả OK hoặc STALE. Chọn dịch vụ: `TU_VAN_GIAM_SAT_16_10.md`.
* Tra CONFIG và menu: `HUONG_DAN_VAN_HANH.md`.

## 3. Nhật ký quyết định của anh Chris (để không ai làm ngược)

| Ngày | Quyết định | Ở đâu trong code |
|---|---|---|
| 13/10 | Số điện thoại không bắt buộc; bỏ nút gọi; chia tutor xoay vòng; mỗi tab một phiên | Phone.gs, Assign.gs, App.html |
| 13/10 | Một địa chỉ admin nhận email; thông báo theo mức; chữ web và email sửa trên Sheets | Notifications.gs, Content.gs, EmailTemplates.gs |
| 15/10 | Một tài khoản Workspace admin@; tắt nhắc 8:00; giao diện admin; xoá dữ liệu test 2 bước | Config.gs, AdminApi.gs, Reset.gs |
| 15/10 | Không tách file `.gs` tới khi xuất PRODUCTION; làm đủ 5A đến 5G rồi xuất một lượt; không đóng băng; go live file PRODUCTION mới, giữ hết lịch sử, cập nhật được bất cứ lúc nào | CLAUDE.md luật 44, Release.gs |
| 16/10 | 2 co-founder dùng chung admin@ | CLAUDE.md bối cảnh |
| 16/10 | Q1 (b): Cloudflare chỉ khi anh ra lệnh; ưu tiên Apps Script 100% | Không có code Cloudflare |
| 16/10 | Q2 (a): Calendar QUEUE, giờ yên tĩnh 22:00 đến 07:00 | `CALENDAR_MODE = QUEUE` |
| 16/10 | Q3: STAGING trên admintest@ (Workspace dùng thử), PRODUCTION trên admin@; chấp nhận hạn mức dùng thử | CHUNK5G mục 1 |
| 16/10 | Q5: thử tải trước go live | LoadTest.gs, `loadtest/` |
| 16/10 | Tutor: link 1 lần, 15 phút; bỏ thiết bị ở mọi giao diện user; bỏ đăng nhập Google cho tutor; admin giữ nguyên; mọi phần khác trên web giữ nguyên | Auth.gs, Student.html, Tutor.html |

## 4. Kiểm tay trên STAGING sau khi cập nhật

Làm theo thứ tự, mỗi bảng ở file giải thích của chunk đó:
1. `CHUNK5G_GIAI_THICH.md` mục 4 (14 bước, khoảng 40 phút): quyết định 16/10, bảo trì, lưu trữ, phát hành, health, thử tải.
2. `CHUNK5C_GIAI_THICH.md` mục 3 (11 bước): sửa chữ web và email.
3. `CHUNK5E_GIAI_THICH.md` mục 2: giao diện admin.
4. `CHUNK5F_GIAI_THICH.md` mục 3: hàng đợi Calendar. Bản 5F viết cho NIGHTLY; với QUEUE, bước 6 "giả lập 23:05" thay bằng "chờ 5 đến 10 phút" hoặc menu **Calendar: tạo sự kiện đang chờ ngay**.
5. `CHUNK5D_GIAI_THICH.md` mục 3: đăng nhập Google cho admin (tuỳ chọn).

Gửi em: ảnh menu 2, file `ketqua_*.json` của thử tải, ảnh "Thử tải: kiểm kết quả", ảnh menu Đo tốc độ, và mọi chỗ thấy khác mô tả.

## 5. Rủi ro còn lại của cả 5A đến 5G (nói thẳng)

1. **Chưa chạy trên Google thật bản 5D trở đi.** Toàn bộ test chạy trên Google giả lập (đã làm cho giả lập khó tính như Google thật ở các điểm biết được). Những điểm chỉ Google thật trả lời: thêm khách Meet không gửi thư, giữ đăng nhập trong Google Sites, bỏ mã khỏi địa chỉ trang, khung lồng của trang Apps Script cho `browser.js`, chuyển hướng 302 của trang health với dịch vụ giám sát, ô tick sau khi xoá đuôi tab.
2. **Giới hạn 30 lượt chạy cùng lúc của một tài khoản** vẫn là giới hạn cứng của Apps Script. 5F giảm thời gian mỗi lượt và tự thử lại; thử tải sẽ cho số thật. Vượt được hẳn chỉ khi lên giai đoạn 1 (Cloudflare), theo lệnh của anh.
3. **Hạn mức tài khoản dùng thử** trên STAGING thấp hơn PRODUCTION (500 thư Gmail mỗi ngày; hạn mức Apps Script đầy đủ sau 100 USD và 60 ngày).
4. **Lưu trữ chỉ có việc từ tháng thứ 7.** Đã thử phá 13 kiểu hỏng trong giả lập; chưa chạy trên Google thật.
5. **Sửa tay trên Sheets** vẫn là cách phá dữ liệu dễ nhất: đối soát mỗi giờ báo Khẩn khi thấy sai luật, nhưng không tự sửa. Trước khi sửa tay nhiều dòng: menu Bảo trì: đóng cổng, Phát hành: sao lưu ngay.

## 6. Câu hỏi đang chờ anh chốt

Ở `CHUNK5G_GIAI_THICH.md` mục 6 (giám sát Q4, phiên tutor, email đăng nhập mới cho tutor, mốc lưu trữ, thời điểm xuất PRODUCTION). Các câu cũ ở `TU_VAN_15_10.md` và `TU_VAN_KIEN_TRUC_16_10.md` đã được anh trả lời và đã vào code (mục 3).

<!-- END FILE: v8/history/GIAI_THICH_TONG_HOP_5A_5G.md -->

---
