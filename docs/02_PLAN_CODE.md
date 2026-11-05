# Thaiput v7 · Plan code (Google Apps Script + Google Workspace + trang web đăng ký và đặt lịch)

*Cập nhật: 05/10/2026 · Dựa trên: brief admin, hệ thống v6.0.1, file 01_QUYET_DINH_50_CAU.md*

## 0. Tóm tắt một đoạn

v7 giữ Google Sheets làm database và giữ phần lõi đã chạy ổn của v6 (tạo Meet, email, khoá chống đặt trùng, giả lập thời gian). Thứ thay đổi: **bỏ Google Form**, thay bằng một trang web do Apps Script phục vụ, gồm 4 màn hình (Trang chủ và đăng ký, Đăng nhập, Học viên, Tutor), nhúng vào Google Sites dưới tên miền riêng `www.thaiput.vn`. Toàn bộ chạy dưới tài khoản **Google Workspace** `booking@thaiput.vn`, nên email không còn bị giới hạn 100/ngày và lịch học được liên kết đầy đủ với Google Calendar của học viên và tutor. Admin tiếp tục làm việc trên Sheets, thêm menu và các ô dropdown. Tổng thời gian code ước tính khoảng 17 giờ làm việc với Claude Max, chia 7 phase. Phase 1 cho anh **xem demo bấm được trong khoảng 1 giờ đầu**.

*Trong file này `thaiput.vn` là tên miền ví dụ; thay bằng tên miền anh mua.*

## 1. Kiến trúc

```
                ┌───────────────────────────────────────────────┐
 Học viên  ───► │  www.thaiput.vn  (Google Sites, tên miền riêng) │
 Tutor     ───► │   └─ nhúng Web App Apps Script                  │
                │       Trang chủ · Đăng ký · Đăng nhập           │
                │       Cổng học viên · Cổng tutor                │
                └───────────────┬─────────────────────────────────┘
                                │ google.script.run (gọi hàm server)
                ┌───────────────▼─────────────────────────────────┐
                │  Apps Script, chạy dưới booking@thaiput.vn       │
                │  Auth · Booking · Packages · Availability        │
                │  Sessions · Admin · Notify · Calendar · Jobs     │
                └──┬────────────┬──────────────────┬──────────────┘
                   │            │                  │
            Google Sheets   Google Calendar      Gmail (Workspace)
            (database)      lịch "Thaiput ·      email từ booking@,
                            Lịch học", Meet,     khoảng 1.500 người
                            mời HV và tutor      nhận/ngày
                   ▲
 Admin ────────────┘  làm việc trên Sheets + menu "thaiput",
                      xem lịch chung trên Google Calendar,
                      bấm số điện thoại HV để mở Zalo hoặc gọi
```

**Vì sao chọn kiến trúc này:**
1. Phần lõi v6 đã test 62/62 và đã chạy thật, giữ lại giúp tiết kiệm nhiều nhất.
2. Hạ tầng gần như 0đ: Apps Script, Sheets, Sites, Calendar miễn phí. Chi phí duy nhất là 1 tài khoản Workspace (khoảng 86k/tháng) và tên miền.
3. Admin không phải học công cụ mới, vẫn là Sheets, cộng thêm một lịch chung trên Google Calendar để xem theo ngày và theo tutor (brief mục 7, phần Calendar).
4. Tutor và học viên **không còn quyền mở file Sheets**, nên không ai sửa nhầm dữ liệu. Đây là điểm yếu lớn nhất của v6 và được xử lý triệt để.

**Phương án thay thế cho phần giao diện:** trang chủ làm riêng trên Cloudflare Pages (miễn phí, đẹp hơn), gọi vào Apps Script qua địa chỉ web app. Chỉ nên làm khi cần thương hiệu mạnh; bản đầu không cần.

## 2. Những gì giữ, sửa, bỏ so với v6

| Thành phần v6 | Số phận trong v7 | Lý do |
|---|---|---|
| `getNow_()` và giả lập thời gian `SIM_NOW` | **Giữ nguyên** | Bắt buộc để test 40 kịch bản |
| `LockService` khi đặt và huỷ | **Giữ** | Chống 2 người đặt cùng slot cuối |
| `createMeetEvent_`, `deleteMeetEvent_` | **Viết lại** thành module Calendar: tạo trên lịch chung, có khách mời, cập nhật khi đổi tutor | Liên kết Calendar đầy đủ (câu 41) |
| Khung email HTML (`emailWrapper_` ...) | **Giữ**, viết lại nội dung theo luật mới, thêm bản tiếng Anh cho tutor | Đã đẹp và ổn định |
| Luật ngày tháng (cột ngày là nửa đêm, tháng JS bắt đầu từ 0, timezone HCM) | **Giữ nguyên** | Bài học xương máu từ v2 đến v6 |
| Google Form đặt lịch và đăng ký, `FormLink.gs` | **Bỏ** | Thay bằng trang web |
| `CHECK_SLOT`, `ACTIVE_WEEK_START`, `weeklyRollover` | **Bỏ** | Lịch rảnh lưu theo ngày cụ thể nên không cần khái niệm "tuần active" |
| Tab `Tutor-<Tên>` dạng lưới gõ "x" | **Bỏ**, thay bằng bảng `AVAILABILITY` dạng dòng | Tutor tick trên web; dạng dòng dễ truy vấn và khoá quyền |
| Quota theo số buổi (`COUNTIFS`) | **Thay** bằng tính gói theo thời hạn, vẫn hỗ trợ gói buổi cũ | Mô hình gói mới |
| Round Robin theo tuần | **Thay** bằng ngẫu nhiên trong nhóm ít buổi nhất tuần | Câu 18 |
| Điểm danh tự động 00:30 | **Thay** bằng tutor xác nhận, quá 24 giờ tự hoàn thành | Câu 26, 29 |
| Payroll | **Giữ ý tưởng**, viết lại theo trạng thái mới | Câu 25 |

## 3. Cấu trúc dữ liệu (Google Sheets)

Hai file Sheets: **THAIPUT_DB** (dữ liệu thật) và **THAIPUT_DB_STAGING** (bản thử, cấu trúc giống hệt). Script chọn file theo thuộc tính `ENV` trong Script Properties. Hai lịch Calendar tương ứng: "Thaiput · Lịch học" và "Thaiput · Lịch học (STAGING)".

| Tab | Mỗi dòng là | Cột chính |
|---|---|---|
| `CONFIG` | một tham số | `key`, `value`, `note` (toàn bộ khoá ở file 01) |
| `PACKAGES` | một loại gói | `code` (TRIAL, PASS_2W, PASS_1M, LEGACY), `name`, `type` (SESSIONS hoặc DAYS), `days`, `sessions`, `price_vnd`, `active` |
| `USERS` | một người dùng | `user_id` (S0001, T001, A01), `role` (STUDENT, TUTOR, ADMIN), `email` (khoá chính, viết thường), `name`, `phone` (chữ, dạng `+84912345678`), `contact_link` (công thức tạo link Zalo và gọi, chỉ admin thấy), `level`, `status` (ACTIVE, SUSPENDED, DISABLED), `note`, `created_at`, `last_login_at` |
| `REGISTRATIONS` | một lần đăng ký hoặc gia hạn | `reg_id`, `created_at`, `email`, `name`, `phone`, `level_self`, `package_code`, `transfer_code`, `screenshot_url`, `consent`, `kind` (NEW, RENEW), `admin_action` (dropdown: Chờ duyệt, Duyệt, Từ chối), `processed_at`, `processed_by` |
| `STUDENT_PACKAGES` | một gói của một học viên | `sp_id`, `student_id`, `package_code`, `status` (INACTIVE, ACTIVE, QUEUED, EXPIRED, SUSPENDED), `start_date`, `end_date`, `sessions_total`, `suspended_days`, `suspend_started_at`, `purchased_at`, `reg_id` |
| `PAYMENTS` | một khoản thu | `payment_id`, `date`, `student_id`, `package_code`, `amount_vnd`, `screenshot_url`, `reg_id`, `recorded_by` |
| `AVAILABILITY` | một slot rảnh của một tutor | `avail_id`, `tutor_id`, `date` (nửa đêm), `slot` ("19:00"), `status` (OPEN, CANCEL_PENDING, CANCELLED), `created_at`, `cancel_requested_at`, `admin_decision` (dropdown: Chờ duyệt, Duyệt, Từ chối) |
| `BOOKINGS` | một buổi học | `booking_id`, `student_id`, `tutor_id`, `sp_id`, `date` (nửa đêm), `slot`, `status`, `meet_link`, `event_id`, `reminder_sent_at`, `created_at`, `cancelled_at`, `cancel_reason`, `result_at`, `result_by`, `payroll_override` (TRUE/FALSE, cho buổi kỹ thuật), `admin_action` (dropdown cho admin) |
| `ACTIVITY_LOG` | một hành động | `time`, `actor` (email hoặc SYSTEM), `action`, `entity`, `entity_id`, `detail` |
| `AUTH` | một phiên hoặc link đăng nhập | `token_hash`, `user_id`, `kind` (LINK, SESSION), `expires_at`, `used_at` |
| `REPORT_MONTH` | bảng tính sẵn bằng công thức | buổi theo tutor theo tháng, doanh thu theo tháng, số email đã gửi theo ngày (admin chỉ xem) |

**Trạng thái booking** (cột `status`):

| Mã | Hiển thị | Trừ buổi Trial/LEGACY | Chặn ngày đó (1 buổi/ngày) | Tính lương |
|---|---|---|---|---|
| CONFIRMED | Xác nhận | Có | Có | Không (chưa dạy) |
| PENDING_REASSIGN | Chờ xác nhận | Có | Có | Không |
| COMPLETED | Hoàn thành | Có | Có | Có |
| STUDENT_ABSENT | Vắng học viên | Có | Có | Có |
| TECH_ISSUE | Vấn đề kỹ thuật | Không | Không | Chỉ khi `payroll_override` |
| TUTOR_ABSENT | Vắng tutor | Không | Không | Không |
| CANCELLED_STUDENT | Huỷ bởi học viên | Không | Không | Không |
| CANCELLED_TUTOR | Huỷ bởi tutor | Không | Không | Không |
| CANCELLED_ADMIN | Huỷ bởi admin | Không | Không | Không |

## 4. Luật nghiệp vụ viết thành hàm

Toàn bộ luật nằm trong các hàm thuần (không đọc Sheets trực tiếp), nhận dữ liệu và trả kết quả. Nhờ vậy test được trên máy mà không cần Google.

### 4.1 Gói học (`Packages.gs`)
1. `resolveActivePackage_(student, bookingDate, allPackages, allBookings)` trả gói dùng cho ngày đó, hoặc lý do từ chối: `NO_PACKAGE`, `SUSPENDED`, `EXPIRED`, `OUT_OF_RANGE`, `NO_SESSIONS`.
2. Gói INACTIVE: buổi đặt đầu tiên quyết định `start_date` = ngày học của buổi **sớm nhất** đang còn hiệu lực. `end_date` = `start_date` cộng (số ngày gói trừ 1).
3. Nếu buổi kích hoạt bị huỷ trước hạn: tính lại `start_date` theo buổi sớm nhất còn lại; không còn buổi nào thì gói trở về INACTIVE.
4. Gói QUEUED (mua khi gói cũ còn hạn): `start_date` = ngày sau `end_date` của gói trước, cố định ngay lúc kích hoạt.
5. Gói TRIAL: thêm điều kiện số buổi đang trừ < 2. Gói LEGACY: không có hạn, chỉ xét số buổi.
6. Tạm khoá: khi mở khoá, cộng số ngày bị khoá vào `end_date`.
7. Job hằng ngày: INACTIVE quá 30 ngày từ ngày mua thì Active từ hôm đó; gói qua `end_date` thì EXPIRED; gói QUEUED đến ngày thì ACTIVE.

### 4.2 Đặt lịch (`Booking.gs`)
Hàm `bookSessions(sessionToken, requests[])`, với `requests` là danh sách `{date, slot}`. Xử lý từng yêu cầu theo thứ tự ngày tăng dần, trong một lần giữ khoá:
1. Xác thực phiên, lấy `student_id` **từ phiên**, không bao giờ nhận từ trình duyệt.
2. Kiểm tra `BOOKING_ENABLED` và tài khoản ACTIVE.
3. Kiểm tra hạn đặt: thời điểm hiện tại phải trước 15:00 của ngày liền trước ngày học.
4. Kiểm tra slot hợp lệ: 08:00 đến 23:30, bước 30 phút.
5. Kiểm tra 1 buổi/ngày: không có booking chặn ngày ở ngày đó (tính cả các yêu cầu vừa được chấp nhận trong cùng lần gửi).
6. Kiểm tra gói theo 4.1.
7. Chọn tutor theo 4.3. Không có tutor thì `NO_TUTOR`.
8. Ghi booking CONFIRMED, tạo sự kiện Calendar theo 4.11, ghi log.
9. Sau vòng lặp: gửi **một** email xác nhận gộp cho học viên và một email cho mỗi tutor liên quan (ngoài thư mời của Calendar).
10. Trả về từng dòng `{date, slot, ok, reason, tutorName, meetLink}` để trang web hiện kết quả riêng từng ngày.

### 4.3 Gán tutor (`Assign.gs`)
1. Ứng viên = tutor ACTIVE, có dòng AVAILABILITY OPEN tại (date, slot), chưa có booking chặn tại (date, slot).
2. Đếm số booking đang chặn ngày của mỗi ứng viên trong tuần (thứ Hai đến Chủ nhật) chứa `date`.
3. Lấy nhóm có số đếm nhỏ nhất, chọn ngẫu nhiên một người. Hàm ngẫu nhiên được truyền vào để test cố định kết quả.

### 4.4 Huỷ của học viên
1. Chỉ huỷ booking của chính mình, trạng thái CONFIRMED.
2. Thời điểm hiện tại phải trước 15:00 của ngày liền trước ngày học, ngược lại từ chối `CANCEL_DEADLINE`.
3. Chuyển CANCELLED_STUDENT, huỷ sự kiện Calendar (khách mời nhận thư huỷ), tính lại gói (4.1 bước 3), email học viên và tutor, ghi log.

### 4.5 Lịch rảnh của tutor (`Availability.gs`)
1. Hạn của tuần bắt đầu thứ Hai W là **Chủ nhật trước đó lúc 15:00**.
2. Thêm slot: luôn được, kể cả sau hạn (câu 22). Không cho thêm slot của ngày đã qua.
3. Bớt slot trước hạn và chưa có booking: xoá ngay (chuyển CANCELLED).
4. Bớt slot sau hạn **hoặc** đã có booking: chuyển CANCEL_PENDING, email admin.
5. Admin chọn "Duyệt": slot CANCELLED; nếu có booking thì đổi booking sang PENDING_REASSIGN, chạy 4.3 (loại tutor này). Có người thay: booking CONFIRMED với tutor mới, đổi khách mời trên sự kiện Calendar (tutor cũ bị gỡ, tutor mới được mời), email học viên, tutor cũ, tutor mới. Không có người thay: CANCELLED_TUTOR, huỷ sự kiện, hoàn buổi nếu Trial/LEGACY, email học viên mời đặt lại.
6. Admin chọn "Từ chối", hoặc job tự từ chối khi còn dưới 3 giờ trước buổi: slot trở về OPEN, email tutor "bạn vẫn dạy buổi này".

### 4.6 Sau buổi học (`Sessions.gs`)
1. Tutor chỉ xác nhận được booking của mình, sau giờ bắt đầu buổi.
2. Ba lựa chọn: COMPLETED, STUDENT_ABSENT, TECH_ISSUE.
3. Job mỗi giờ: booking CONFIRMED đã qua giờ kết thúc 24 giờ thì COMPLETED, `result_by = SYSTEM`, email tổng hợp cho admin.

### 4.7 Admin trên Sheets (`Admin.gs`)
Trigger chỉnh sửa (installable `onEdit`) bắt các ô dropdown:
1. `REGISTRATIONS.admin_action = Duyệt`: tạo hoặc tìm USER theo email (kèm số điện thoại), tạo STUDENT_PACKAGE (INACTIVE hoặc QUEUED), tạo PAYMENTS, gửi email chào mừng kèm link đăng nhập. Chạy lại không tạo trùng (kiểm tra `processed_at`).
2. `AVAILABILITY.admin_decision`: theo 4.5 bước 5 và 6.
3. `BOOKINGS.admin_action`: Huỷ bởi admin, Đổi tutor (chọn tutor ở cột ghi chú), Đánh dấu vắng tutor, Tính lương buổi kỹ thuật.
4. Menu "thaiput": Kiểm tra hệ thống, Tạo trigger, Tạo lịch Calendar, Thêm tutor, Tạm khoá học viên, Mở khoá học viên, Xuất báo cáo tháng, Khôi phục từ backup (hướng dẫn), Bật hoặc tắt giả lập thời gian (chỉ ở STAGING).

### 4.8 Đăng nhập (`Auth.gs`)
1. Học viên hoặc tutor nhập email. Nếu email có trong USERS và đang ACTIVE: tạo link một lần (token ngẫu nhiên 64 ký tự), lưu **mã băm SHA 256** của token, hết hạn 15 phút, gửi email. Email không tồn tại: vẫn hiện "nếu email hợp lệ, bạn sẽ nhận được link" để không lộ danh sách học viên.
2. Giới hạn 3 lần gửi link mỗi email mỗi 15 phút (CacheService).
3. Mở link: kiểm tra băm, chưa dùng, chưa hết hạn; đánh dấu đã dùng; tạo phiên 30 ngày; trang lưu token phiên trong bộ nhớ trình duyệt.
4. Mọi hàm server bắt đầu bằng `requireRole_(token, 'STUDENT' | 'TUTOR')`.
5. Rủi ro đã biết: khi nhúng trong Google Sites, một số trình duyệt chặn bộ nhớ của iframe, khiến phải đăng nhập lại mỗi lần. Phương án dự phòng: nút "Mở toàn màn hình" mở thẳng web app. Có mục kiểm tra riêng trong checklist.

### 4.9 Thông báo (`Notify.gs`)
Email gửi bằng `MailApp` từ `booking@thaiput.vn`, tên hiển thị `MAIL_FROM_NAME`, trả lời về `admin@thaiput.vn`. Tiếng Việt cho học viên và admin, tiếng Anh cho tutor:
1. Đăng ký đã nhận (học viên), có đăng ký mới kèm link ảnh và số điện thoại (admin).
2. Chào mừng và link đăng nhập; link đăng nhập.
3. Xác nhận đặt (gộp), lịch dạy mới (tutor).
4. Huỷ (học viên và tutor).
5. Đổi tutor; tutor huỷ mà không có người thay.
6. Yêu cầu huỷ của tutor (admin); kết quả duyệt (tutor).
7. Nhắc nộp lịch Chủ nhật 08:00 và 13:00 (tutor chưa có slot nào cho tuần sau).
8. Gói sắp hết hạn 3 ngày (học viên, gửi 1 lần).
9. **Nhắc buổi học trước 60 phút** (học viên và tutor, mỗi buổi gửi 1 lần, đánh dấu `reminder_sent_at`).
10. Tổng hợp buổi tự hoàn thành (admin).

Mọi email gửi học viên và tutor có chân trang: nút "Nhắn Zalo admin", số điện thoại admin, link trang web.

### 4.10 Job định kỳ (`Jobs.gs`)

| Trigger | Lịch | Việc |
|---|---|---|
| `reminderJob` | mỗi 15 phút | Gửi email nhắc cho buổi bắt đầu trong khoảng 45 đến 75 phút tới, chưa có `reminder_sent_at` |
| `hourlyJob` | mỗi giờ | Tự từ chối yêu cầu huỷ quá hạn; tự hoàn thành buổi quá 24 giờ |
| `dailyJob` | 06:00 | Cập nhật trạng thái gói; email sắp hết hạn |
| `sundayRemind` | Chủ nhật 08:00 và 13:00 | Nhắc tutor nộp lịch |
| `nightlyBackup` | 02:00 | Sao chép THAIPUT_DB vào thư mục Backup, giữ 30 bản mới nhất |
| `weeklyExport` | Thứ Hai 03:00 | Xuất CSV các tab vào thư mục chia sẻ với tài khoản dự phòng |
| `onEditInstallable` | khi admin sửa | Mục 4.7 |

### 4.11 Liên kết Google Calendar (`CalendarSync.gs`)
1. Menu "Tạo lịch Calendar" tạo một lịch riêng tên "Thaiput · Lịch học" trong tài khoản `booking@`, lưu id vào `LESSON_CALENDAR_ID`. Chia sẻ lịch này (quyền xem chi tiết) cho tài khoản của admin: admin xem toàn bộ buổi học theo ngày, tuần, và lọc theo tutor bằng màu.
2. Mỗi booking CONFIRMED là một sự kiện trên lịch đó, tạo bằng Calendar API nâng cao (`Calendar.Events.insert`, `conferenceDataVersion: 1`, `sendUpdates: 'all'`):
    1. Tiêu đề: `thaiput · <Tên học viên> × <Tên tutor>`. Thời gian: đúng slot 30 phút, timezone Asia/Ho_Chi_Minh.
    2. Khách mời: email học viên và email tutor. Google tự gửi thư mời kèm nút thêm vào lịch, chạy được cả với Gmail, Outlook, Apple Mail.
    3. Link Meet tự tạo. Khách mời có trong sự kiện vào phòng thẳng, không cần ai duyệt (kiểm tra thật ở checklist B).
    4. Màu sự kiện theo tutor (`colorId` lưu ở cột ghi chú của tutor trong USERS).
    5. Mô tả sự kiện: luật huỷ trước 15:00 hôm trước, link cổng học viên, nút Zalo admin. **Không** ghi số điện thoại hoặc email học viên vào mô tả, vì tutor xem được mô tả.
3. Huỷ booking: huỷ sự kiện với `sendUpdates: 'all'`, khách mời nhận thư huỷ và sự kiện biến mất khỏi lịch của họ.
4. Đổi tutor: `Calendar.Events.patch` thay danh sách khách mời và tiêu đề, giữ nguyên link Meet.
5. Lưu ý kỹ thuật: nhắc lịch (`reminders`) đặt trên sự kiện chỉ áp dụng cho lịch của người tạo, không áp dụng cho khách mời. Vì vậy nhắc trước 60 phút được gửi bằng email (`reminderJob`), còn nhắc của Calendar trên điện thoại học viên theo cài đặt riêng của họ.

### 4.12 Số điện thoại và liên hệ Zalo (`Phone.gs`)
1. `normalizePhoneVN_(input)` là hàm thuần: bỏ khoảng trắng, dấu chấm, gạch; đổi `0`, `84`, `+84` ở đầu về `+84`; chấp nhận trường hợp nhập thiếu số 0 đầu (9 chữ số). Hợp lệ khi sau `+84` có đúng 9 chữ số và chữ số đầu là 3, 5, 7, 8 hoặc 9. Không hợp lệ thì trả lỗi `INVALID_PHONE`.
2. Kiểm tra ở cả trình duyệt (báo ngay khi nhập) và server (không tin trình duyệt).
3. Ghi vào Sheets dưới dạng chữ: đặt định dạng cột là văn bản trước khi ghi, để Sheets không hiểu `+84...` là số hoặc công thức.
4. Cột `contact_link` trong USERS dùng công thức tạo 2 link: Zalo (`https://zalo.me/` cộng số dạng `0912345678`) và gọi (`tel:+84912345678`). Admin bấm từ Sheets trên điện thoại hoặc máy tính. Định dạng link Zalo được kiểm tra thật ở checklist B.
5. Nút "Nhắn Zalo admin" trong cổng học viên và cổng tutor dùng link do admin dán vào `ADMIN_ZALO_URL` (copy từ app Zalo, mục chia sẻ trang cá nhân hoặc mã QR), nút "Gọi admin" dùng `ADMIN_PHONE`.

## 5. Cấu trúc file code

```
src/
  Config.gs        đọc tab CONFIG, giá trị mặc định
  Time.gs          getNow_, SIM_NOW, ngày nửa đêm, hạn 15:00, tuần
  Db.gs            đọc ghi Sheets theo tên cột, cache trong 1 lần chạy
  Log.gs           ghi ACTIVITY_LOG
  Auth.gs          link đăng nhập, phiên, requireRole_
  Phone.gs         chuẩn hoá số điện thoại, link Zalo và gọi
  Packages.gs      luật gói (hàm thuần)
  Assign.gs        gán tutor (hàm thuần)
  Booking.gs       đặt, huỷ
  Availability.gs  lịch rảnh, yêu cầu huỷ
  Sessions.gs      xác nhận sau buổi, tự hoàn thành
  CalendarSync.gs  sự kiện, khách mời, Meet, đổi tutor
  Admin.gs         menu, onEdit, kích hoạt, duyệt
  Notify.gs        email (giữ khung v6)
  Jobs.gs          trigger định kỳ
  Backup.gs        sao lưu, xuất CSV
  Api.gs           doGet, các hàm cho google.script.run
  Migration.gs     chuyển dữ liệu từ v6
  Setup.gs         tạo tab, tạo trigger, kiểm tra hệ thống
  ui/Index.html    khung trang, điều hướng
  ui/Styles.html   giao diện, ưu tiên điện thoại
  ui/App.html      JavaScript phía trình duyệt
  ui/Home.html  Login.html  Student.html  Tutor.html
test/
  harness.js       giả lập Sheets, Calendar, Mail, thời gian
  scenarios.js     40 kịch bản ở file 03
  fixtures.js      dữ liệu mẫu
CLAUDE.md          luật kỹ thuật cho Claude Code (trước đây là file 05; bản hiện hành là `v8/CLAUDE.md`, bản v7 cũ nằm trong `archive/V7_SPEC_CU.md`)
```

## 6. Các màn hình

**Trang chủ và đăng ký** (công khai): giới thiệu ngắn, bảng gói và giá, form: họ tên, email, **số điện thoại** (gợi ý định dạng `0912 345 678`), level tự khai, chọn gói, thông tin chuyển khoản kèm mã nội dung tự sinh, tải ảnh chụp chuyển khoản, ô đồng ý chính sách. Gửi xong: "Đã nhận, admin sẽ xác nhận trong giờ làm việc", kèm nút "Nhắn Zalo admin".

**Đăng nhập:** ô email, nút "Gửi link đăng nhập".

**Cổng học viên:** thẻ gói (tên gói, trạng thái, ngày bắt đầu và kết thúc hoặc "Bắt đầu khi bạn học buổi đầu", số buổi còn lại với Trial/LEGACY). Tab Đặt lịch: chọn ngày (chỉ ngày còn đặt được), mỗi ngày hiện các slot còn tutor, chọn tối đa 1 slot mỗi ngày, gửi cùng lúc nhiều ngày, nhận kết quả từng ngày. Tab Lịch của tôi: buổi sắp tới (tên tutor, link Meet, nút Huỷ nếu còn hạn), lịch sử. Nút Gia hạn: mở form gia hạn giống form đăng ký. Thanh dưới cùng: "Nhắn Zalo admin", "Gọi admin".

**Cổng tutor (tiếng Anh):** tab Availability: lưới 7 ngày × 32 slot cho tuần tới và tuần này, bấm để bật hoặc tắt, hiện rõ hạn chót; slot đã có học viên hiện khoá, bấm thì gửi yêu cầu huỷ. Tab Schedule: buổi hôm nay và sắp tới (tên học viên, level, ghi chú, link Meet). Tab To confirm: buổi đã diễn ra chờ chọn kết quả. Nút "Message admin on Zalo", "Call admin".

## 7. Bảo mật và dự phòng sự cố

1. Web app triển khai "Execute as: Me" bằng `booking@thaiput.vn`, "Who has access: Anyone". Mọi kiểm tra quyền nằm ở server. Workspace phải cho phép chia sẻ ra ngoài tổ chức thì mới chọn được "Anyone" (bước cài đặt ở file 06).
2. File Sheets chỉ chia sẻ cho admin. Tutor và học viên không có quyền nào trên file. Số điện thoại và email học viên chỉ admin thấy.
3. Token đăng nhập chỉ lưu dạng băm; link dùng 1 lần, 15 phút.
4. Tài khoản `booking@` bật xác minh 2 bước, mã dự phòng cất nơi an toàn; admin dùng tài khoản riêng của mình được chia sẻ quyền chỉnh sửa.
5. Bảo vệ cột: các cột do script ghi (id, ngày, trạng thái hệ thống) đặt Protected range, chỉ `booking@` sửa được; admin chỉ sửa cột dropdown và ghi chú.
6. Email xác thực SPF, DKIM, DMARC trên tên miền để không vào Spam (file 06).
7. Backup 3 lớp: lịch sử phiên bản của Sheets (30 ngày), bản sao mỗi đêm (giữ 30 bản), CSV hằng tuần sang tài khoản khác.
8. Deploy theo phiên bản: người dùng luôn chạy phiên bản đã khoá; lỗi thì chuyển về phiên bản trước trong 1 phút (Manage deployments).
9. Sổ tay sự cố một trang (nằm trong checklist): mất dữ liệu, sai luật hàng loạt, hết quota, tài khoản bị khoá.

## 8. Các phase và thời gian (Claude Max)

| Phase | Việc | Giờ | Kết quả anh kiểm tra được |
|---|---|---|---|
| 0 | Mua tên miền, tạo Workspace, DNS email, tài khoản `booking@`, thư mục Drive, 2 file Sheets, cài clasp (file 06 và checklist A). **Làm đầu tiên vì DNS cần vài giờ để cập nhật** | 1 | Checklist A xanh |
| 1 | **Demo bấm được**: 4 màn hình HTML với dữ liệu giả, mở trên điện thoại | 1 | Bấm thử luồng đăng ký, đặt, huỷ, tutor tick lịch |
| 2 | Dữ liệu và luật lõi (Packages, Assign, Booking, Availability, Sessions, Phone) + harness + 40 kịch bản | 4 | Báo cáo test 40/40 |
| 3 | Đăng nhập, API, nối 4 màn hình vào luật thật | 4 | Đăng nhập và đặt thật trên STAGING |
| 4 | Admin trên Sheets, email, Calendar, job, backup, log | 3,5 | Duyệt, huỷ, báo cáo, thư mời Calendar chạy trên STAGING |
| 5 | Deploy STAGING, chạy checklist phần B trên điện thoại thật, sửa lỗi | 2 | Checklist B xanh |
| 6 | Chuyển dữ liệu v6, deploy PRODUCTION, nhúng Google Sites, gắn tên miền | 1,5 | Checklist C xanh |
| **Tổng** | | **17** | Demo dùng được trong 24 giờ |

Sau đó: chạy thử kín 1 đến 3 ngày, launch theo chu kỳ Chủ nhật (tutor nộp lịch tuần mới trên v7 trước 15:00).

## 9. Prompt mẫu cho Claude Code theo từng phase

Dán đúng thứ tự. Mỗi prompt kết thúc bằng yêu cầu viết file giải thích, theo quy ước của anh.

**Phase 1**
> Đọc CLAUDE.md, 01_QUYET_DINH_50_CAU.md và mục 6 của 02_PLAN_CODE.md. Làm một bản demo HTML tĩnh gồm 4 màn hình (Trang chủ và đăng ký, Đăng nhập, Cổng học viên, Cổng tutor tiếng Anh), dữ liệu giả, chạy được khi mở file trên điện thoại, ưu tiên màn hình nhỏ, có nút Zalo và gọi admin. Viết bằng HTML, CSS, JavaScript thuần để tái sử dụng làm giao diện Apps Script. Cuối cùng viết PHASE1_GIAI_THICH.md: làm gì, vì sao, cách tôi tự kiểm tra.

**Phase 2**
> Đọc CLAUDE.md và mục 3, 4 của 02_PLAN_CODE.md. Viết Time.gs, Phone.gs, Packages.gs, Assign.gs, Booking.gs, Availability.gs, Sessions.gs dưới dạng hàm thuần. Viết test/harness.js, fixtures.js, scenarios.js theo đúng 40 kịch bản trong 03_KICH_BAN_TEST_40.md. Chạy `node test/harness.js` tới khi 40/40 đạt. Không sửa kết quả mong đợi của kịch bản để test qua; nếu thấy kịch bản mâu thuẫn với file 01, dừng lại và báo tôi. Viết PHASE2_GIAI_THICH.md kèm bảng kết quả 40 kịch bản.

**Phase 3**
> Viết Auth.gs, Api.gs, Db.gs, Config.gs và nối các màn hình của phase 1 vào hàm thật qua google.script.run. Mọi hàm API phải gọi requireRole_ trước khi làm gì khác. Thêm kịch bản test truy cập chéo (học viên gọi hàm tutor, học viên A đọc booking của B). Đẩy lên STAGING bằng clasp. Viết PHASE3_GIAI_THICH.md.

**Phase 4**
> Viết Admin.gs, CalendarSync.gs (lịch chung, khách mời, Meet, đổi tutor, huỷ, theo mục 4.11), Notify.gs (giữ khung email từ src v6, thêm email nhắc 60 phút), Jobs.gs, Backup.gs, Log.gs, Setup.gs, tab REPORT_MONTH. Email tutor bằng tiếng Anh. Chạy lại toàn bộ test. Viết PHASE4_GIAI_THICH.md.

**Phase 5 và 6**
> Hướng dẫn tôi từng bước chạy checklist phần B và C trong 04_CHECKLIST.md; sau mỗi lỗi tôi báo, sửa và chạy lại test. Viết Migration.gs chuyển học viên, gói còn lại, booking tương lai từ file v6 (học viên v6 chưa có số điện thoại: để trống, cổng học viên nhắc bổ sung ở lần đăng nhập đầu). Viết PHASE5_6_GIAI_THICH.md và RUNBOOK_SU_CO.md.

## 10. Giai đoạn 2 (sau launch, theo thứ tự giá trị)

1. Nút Rate và nút báo tutor vắng trong cổng học viên.
2. Tutor đề xuất level cho học viên.
3. Popup thông báo và email hàng loạt có bộ lọc (Workspace đã đủ quota).
4. Trang chủ đẹp hơn trên Cloudflare Pages, giữ tên miền.
5. Khi vượt khoảng 10 tutor hoặc 300 học viên: chuyển database sang Supabase, giữ nguyên luật trong các hàm thuần.
