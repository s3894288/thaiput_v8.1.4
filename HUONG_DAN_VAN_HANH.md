# Hướng dẫn vận hành thaiput v8 (bản 8.1.4)

*Cập nhật 02/11/2026. Áp dụng cho STAGING; từ chunk 6 (go live) áp dụng cho cả PRODUCTION. Mọi việc trong file này làm trên file Google Sheets của hệ thống hoặc trên trang quản trị, không cần sửa code.*

## Thay đổi so với bản trước

Bản trước: 8.0.10 (18/10/2026, đã xuất) và bản nháp 8.1.1 (01/11, chưa xuất). Những điểm mới:

* **Email gửi cố định qua GmailApp (8.1.4):** không còn file MailFix, không còn bước tìm và thay sau mỗi lần dán code. Ô mới `MAIL_TRANSPORT` (B8). Tab MAIL_LOG thêm cột `transport`. Tình huống thư không tới: Phần L3.
* **Phần B viết lại đủ 98 ô CONFIG** theo bản 8.1.4. Ô mới: bù buổi (8.1.0), link đăng nhập theo vai trò, lịch tutor kiểu `THỨ GIỜ`, 3 ô kết quả buổi (8.1.1), `LOG_KEEP_DAYS`, 4 ô `SHORT_URL_*`, `MOVED_TO_URL` (8.1.3), `MAIL_TRANSPORT` (8.1.4). Ô cũ đã bỏ: B15.
* **Phần C viết lại theo menu gom nhóm** (8.1.3): menu con Người dùng, Gói học, Báo cáo, Email, Cập nhật phiên bản, Chuyển hệ thống, Lưu trữ, Công cụ kỹ thuật, Test. Menu mới: Khoá tutor, Mở khoá tutor, Thêm gói, Lưu trữ mở file, Các bước chuyển dữ liệu, Chuyển hệ thống 4 bước, Tắt hết trigger. Menu 3 tạo **8** trigger (không còn 10). Menu chuyển dữ liệu v6 đã bỏ.
* **Phần H viết lại:** mốc tuần của tutor là thứ Sáu 15:00 (nhắc) và thứ Bảy 22:00 (hạn), không còn Chủ nhật.
* **Phần K mới:** thao tác trên từng tab Sheets (cột nào sửa được, cột nào không, lựa chọn ở ô dropdown, màu dòng).
* **Phần L mới:** bảng xử lý tình huống (học viên, tutor, gói, buổi học, email, đăng nhập, Calendar, dữ liệu, hệ thống).
* **Phần M mới:** đăng nhập Google cho admin (cài 1 lần, khoảng 15 phút).
* Phần G5, I3, B13: nhật ký, email, thông báo, METRICS giữ 60 ngày (`LOG_KEEP_DAYS`) rồi chuyển sang file lưu trữ mỗi đêm; dòng email marketing không bao giờ bị chuyển; bỏ mốc chờ 7 ngày; tên file lưu trữ mới `THAIPUT · Lưu trữ · <môi trường> · <năm>`.
* Phần I3: không còn ghi nhật ký khi đổi ngôn ngữ và khi mở từng thông báo (chỉ ghi "Đã đọc hết").
* Số điện thoại không bắt buộc, gõ tự do (Phần K2). Gói đang bán có giá 0 chỉ đăng ký qua Zalo (Phần K3).
* Phần J (37 sự kiện thông báo) giữ nguyên nội dung bản nháp 01/11, đối chiếu lại với 8.1.4: không có sự kiện mới.

Cách đọc: chữ **đậm** là tên nút hoặc mục menu. `Chữ đơn cách` là tên tab, cột, ô hoặc nội dung gõ đúng từng ký tự. "Menu 1" là **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**, "menu 2" là **thaiput → 2. Kiểm tra hệ thống**, "menu 3" là **thaiput → 3. Tạo lại trigger tự động**.

Nội dung:

* Phần A. Luật chung khi sửa CONFIG
* Phần B. 98 ô CONFIG
* Phần C. Menu thaiput
* Phần D. Chữ trên trang web (tab CONTENT), hai thứ tiếng
* Phần E. Ngôn ngữ của từng người dùng
* Phần F. Email hệ thống (tab EMAIL_TEMPLATES)
* Phần G. Email marketing (tab MARKETING_EMAILS)
* Phần H. Việc hằng ngày, hằng tuần, hằng tháng
* Phần I. Trang quản trị trên web: ô số liệu, thông báo, nhật ký
* Phần J. Luật thông báo cho admin (tab NOTIFY_RULES)
* Phần K. Thao tác trên từng tab Sheets
* Phần L. Xử lý tình huống
* Phần M. Đăng nhập Google cho admin

## Phần A. Luật chung khi sửa CONFIG

1. Mỗi dòng: cột `key` (tên ô, không sửa), cột `value` (giá trị), cột `note` (ghi chú của admin, code không đọc).
2. Ô `value` luôn ở dạng chữ. Giờ ghi `08:00`, không ghi `8:00 AM`. Đúng sai ghi `TRUE` hoặc `FALSE`. Danh sách ghi cách nhau dấu phẩy, ví dụ `ADMIN,TUTOR`.
3. Sửa xong có hiệu lực **trong tối đa 60 giây**. Sửa tay trên Sheets thì hệ thống làm mới ngay.
4. Ô thiếu trong tab: menu 1 tự thêm với giá trị mặc định. Xoá dòng một ô = quay về mặc định.
5. Ô ghi "(Setup ghi)" là mã thư mục, lịch do menu 1 tự tạo: **không sửa** trừ khi coder hướng dẫn.
6. Sửa nhiều ô một lúc: chạy menu 2 sau khi sửa.


## Phần B. 98 ô CONFIG

Mặc định là giá trị code dùng khi ô trống hoặc không có dòng. Menu 1 thêm dòng còn thiếu với giá trị mặc định, không ghi đè ô đã sửa.

### B1. Gói học

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `PKG_TRIAL_DAYS` | 7 | Số ngày của gói Trial khi menu 1 tạo gói mặc định. Đổi số ngày gói đang bán: sửa cột `days` ở tab PACKAGES (K3) |
| `PKG_2W_DAYS` | 14 | Như trên, gói 2 tuần |
| `PKG_1M_DAYS` | 30 | Như trên, gói 1 tháng |
| `TRIAL_SESSIONS` | 2 | Số buổi của Trial khi tạo gói mặc định |
| `INACTIVE_AUTO_ACTIVATE_DAYS` | 30 | Gói đã mua mà học viên chưa đặt buổi nào: quá chừng này ngày thì tự bắt đầu tính hạn |
| `MAX_BOOKINGS_PER_DAY` | 1 | Mỗi học viên tối đa mấy buổi mỗi ngày |
| `TRIAL_ONCE_PER_EMAIL` | TRUE | Mỗi email chỉ mua Trial 1 lần (tính cả đăng ký Trial đang chờ duyệt) |
| `PKG_EDITORS` | trống | Email được sửa `end_date` và `comp_days_admin` ở STUDENT_PACKAGES, cách nhau dấu phẩy. Trống = chỉ `ADMIN_EMAIL`. Google không cho biết người sửa (thường gặp với Gmail thường) thì thêm chữ `ADMIN` |

### B2. Bù buổi (từ 8.1.0)

Buổi lỗi phía trường (Vắng tutor, tutor huỷ, lỗi kỹ thuật do tutor hoặc lỗi khách quan) sau khi ngày bắt đầu gói đã khoá thì gói được cộng ngày, học viên nhận email.

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `COMP_DAYS_PER_SESSION` | 1 | Số ngày cộng cho mỗi buổi lỗi phía trường (gói theo ngày) |
| `COMP_DAYS_TRIAL` | 3 | Gói có giới hạn số buổi (Trial): trả lại lượt và cộng chừng này ngày để còn kịp đặt |
| `COMP_TRIAL_MAX_DAYS` | 3 | Trần tổng số ngày cộng thêm cho một gói Trial |
| `COMP_REOPEN_DAYS` | 7 | Gói đã hết hạn chưa quá chừng này ngày mà có buổi được bù: tự cộng ngày và mở lại gói. Quá hạn này: chỉ báo admin (`COMP_ON_EXPIRED`) |
| `TECH_DECIDE_HOURS` | 48 | Buổi Vấn đề kỹ thuật mà admin chưa chọn lỗi: sau chừng này giờ coi như lỗi tutor (không lương, học viên được bù) |

### B3. Đặt và huỷ

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `BOOKING_CUTOFF_HOUR` | 15 | Hạn đặt: trước giờ này của ngày hôm trước |
| `BOOKING_LEAD_HOURS` | 0 | 0 = theo hạn 15:00 hôm trước. Số lớn hơn 0 = cho đặt cả trong ngày, miễn trước giờ học ít nhất chừng ấy tiếng |
| `BOOK_UNTIL_START` | FALSE | Chỉ để thử: TRUE = đặt được tới sát giờ học. Không bật trên PRODUCTION |
| `CANCEL_CUTOFF_HOUR` | 15 | Hạn huỷ của học viên: trước giờ này của ngày hôm trước. Sau hạn: học viên không tự huỷ được, nhắn admin (L4) |
| `BOOKING_ENABLED` | TRUE | FALSE = tạm dừng nhận đặt lịch. Muốn dừng rộng hơn: bảo trì (B14) |
| `BOOKING_HORIZON_DAYS` | 28 | Đặt và mở giờ rảnh xa nhất bao nhiêu ngày. Trang hiện 14 ngày |
| `REG_MAX_PER_HOUR` | 20 | Chống spam form đăng ký: tối đa bao nhiêu đăng ký mỗi giờ cho cả hệ thống |

### B4. Khung giờ

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `SLOT_START` | 08:00 | Giờ đầu ngày |
| `SLOT_LAST` | 23:30 | Giờ cuối ngày |
| `SLOT_MINUTES` | 30 | Bước giữa các giờ (buổi học 25 phút). Đổi khi đã có dữ liệu: hỏi coder trước |

### B5. Tutor, lịch tuần, lương

Mốc tuần viết dạng `THỨ GIỜ`: thứ là `MON TUE WED THU FRI SAT SUN`, giờ từ 0 đến 23. Ví dụ `FRI 15` là 15:00 thứ Sáu. Mốc áp cho tuần sau. Gõ sai: dùng mặc định và menu 2 báo đỏ.

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `ASSIGN_STRATEGY` | ROUND_ROBIN_LEAST_LOADED | Chỉ để ghi nhớ; hệ thống luôn chia xoay vòng trong nhóm tutor ít buổi nhất tuần |
| `TUTOR_CANCEL_DECIDE_BEFORE_HOURS` | 3 | Tutor xin huỷ giờ đã có học viên: admin không quyết trước giờ học chừng này tiếng thì hệ thống tự Từ chối |
| `TUTOR_REMIND_AT` | FRI 15 | Lúc nhắc tutor chưa mở giờ nào cho tuần sau. Nhiều mốc cách dấu phẩy, ví dụ `FRI 15,SAT 10` |
| `TUTOR_DEADLINE_AT` | SAT 22 | Hạn mở lịch tuần sau. Sau hạn: bớt giờ phải xin admin duyệt; admin nhận thông báo `TUTOR_NO_AVAILABILITY` cho tutor chưa mở giờ nào. Phải trước hạn đặt buổi thứ Hai (15:00 Chủ nhật) |
| `STUDENT_WEEK_BANNER_FROM` | SAT 00 | Từ lúc này trang học viên hiện khung "Tuần sau đã có giờ trống" |
| `PAYROLL_STATUSES` | COMPLETED,STUDENT_ABSENT | Trạng thái buổi được tính lương. Buổi kỹ thuật tính lương theo lỗi admin chọn (K6). Muốn trả lương buổi huỷ muộn: thêm `CANCELLED_LATE` |

### B6. Kết quả buổi học (từ 8.1.1)

Không còn tự Hoàn thành. Tutor phải chọn kết quả trên trang tutor.

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `RESULT_NOTICE_AFTER_HOURS` | 24 | Quá chừng này giờ sau giờ kết thúc mà tutor chưa chọn: dòng đỏ trên trang tutor, trang quản trị, BOOKINGS; thông báo Khẩn `RESULT_OVERDUE` |
| `RESULT_EXPIRE_AFTER_HOURS` | 48 | Quá chừng này giờ (và đã báo đỏ đủ ô dưới): buổi thành **Không hoàn thành**, không tính lương |
| `RESULT_EXPIRE_AFTER_NOTICE_HOURS` | 24 | Thời gian tối thiểu từ lúc báo đỏ tới lúc thành Không hoàn thành. Đang bảo trì: mốc báo đỏ tự dời để tutor còn đủ giờ |

### B7. Đăng nhập

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `STUDENT_LINK_MINUTES` | 15 | Link đăng nhập học viên hết hạn sau chừng này phút |
| `STUDENT_LINK_MAX_USES` | 0 | Link học viên bấm được mấy lần trong hạn. 0 = không giới hạn |
| `TUTOR_LINK_MINUTES` | 15 | Như trên, tutor |
| `TUTOR_LINK_MAX_USES` | 0 | Như trên, tutor |
| `ADMIN_LINK_MINUTES` | 1440 | Như trên, admin (24 giờ) |
| `ADMIN_LINK_MAX_USES` | 0 | Như trên, admin. Đặt 1 để thư bị chuyển tiếp không vào được quyền admin cả ngày |
| `LOGIN_LINK_COOLDOWN_MINUTES` | 60 | Mỗi email xin link trên trang tối đa 1 lần trong chừng này phút. Admin gửi hộ bằng menu không bị giới hạn. Đặt 15 để bằng hạn link |
| `SESSION_DAYS` | 30 | Phiên học viên sống bao nhiêu ngày sau khi bấm link |
| `TUTOR_SESSION_DAYS` | 30 | Phiên tutor |
| `ADMIN_SESSION_DAYS` | 30 | Phiên admin |
| `ADMIN_LINK_LOGIN` | TRUE | TRUE = admin xin được link qua email (dự phòng). FALSE = admin chỉ đăng nhập bằng Google (Phần M). Tắt sau khi đăng nhập Google chạy ổn 1 tuần |
| `STAFF_NEW_LOGIN_EMAIL` | TRUE | Công tắc chung của email "Có đăng nhập mới" |
| `NEW_LOGIN_EMAIL_ROLES` | ADMIN | Vai trò nhận email đó. Muốn tutor cũng nhận: `ADMIN,TUTOR` |
| `SESSION_CACHE_SECONDS` | 120 | Bộ đệm phiên (giây). Khoá tài khoản vẫn có hiệu lực ngay |
| `AUTH_PURGE_AFTER_DAYS` | 7 | Dọn tab AUTH mỗi ngày: bỏ link, phiên đã hết hạn quá chừng này ngày |
| `GOOGLE_LOGIN_URL` | trống | Link `/exec` của dự án phụ đăng nhập Google (Phần M). Trống = không có nút |
| `GOOGLE_LOGIN_ROLES` | ADMIN | Vai trò được đăng nhập bằng Google. `ADMIN,TUTOR` nếu muốn cho tutor |
| `ALLOW_DATA_RESET` | FALSE | Menu Xoá dữ liệu test chỉ chạy khi TRUE. STAGING tự TRUE; PRODUCTION tự FALSE |

### B8. Thông báo và email

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `REMINDER_BEFORE_MINUTES` | 60 | Email nhắc trước giờ học chừng này phút |
| `REMINDER_WINDOW_MINUTES` | 15 | Độ rộng cửa sổ nhắc (bằng nhịp chạy của việc nhắc) |
| `EXPIRY_NOTICE_DAYS` | 3 | Báo học viên trước khi gói hết hạn chừng này ngày |
| `MAIL_FROM_NAME` | thaiput | Tên người gửi hiện trong hộp thư |
| `MAIL_TRANSPORT` | GMAILAPP | Đường gửi email. `GMAILAPP` (mặc định từ 8.1.4, giống MailFix cũ). `MAILAPP` chỉ dùng khi GMAILAPP hỏng (thư dễ bị trả về trên tên miền của trường). Gõ sai: dùng GMAILAPP |
| `ADMIN_EMAIL` | admin@thaiput.vn | Địa chỉ duy nhất nhận email hệ thống; địa chỉ "trả lời tới" của mọi email. Phải trùng tài khoản chạy hệ thống |
| `MAIL_LOW_QUOTA_RESERVE` | 15 | Hạn mức email còn lại trong ngày nhỏ hơn hoặc bằng số này thì tạm bỏ email ưu tiên thấp (nhắc buổi, sắp hết hạn) |
| `MARKETING_QUOTA_RESERVE` | 100 | Email marketing dừng khi hạn mức còn lại chỉ còn chừng này (Phần G) |
| `MORNING_REMINDER_HOUR` | -1 | Email nhắc buổi học buổi sáng. -1 = tắt. Bật: ghi giờ, ví dụ 8 |
| `DIGEST_HOUR` | 21 | Email tổng hợp cuối ngày cho admin. -1 = tắt |
| `ADMIN_JOIN_MEET` | TRUE | Thêm admin làm khách mọi buổi (không gửi thư) để vào được mọi phòng Meet |

### B9. Hàng đợi Calendar

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `CALENDAR_MODE` | QUEUE | QUEUE: tạo sự kiện (link Meet, thư mời) trong khoảng 5 phút sau khi đặt, trừ giờ yên tĩnh. NIGHTLY: gom tạo từ `CALENDAR_NIGHTLY_HOUR`. INLINE: tạo ngay lúc bấm Đặt (chậm nhất khi đông). Gõ sai: tự về QUEUE |
| `CALENDAR_NIGHTLY_HOUR` | 23 | Giờ gom của NIGHTLY |
| `CALENDAR_QUIET_FROM` | 22 | Đầu giờ yên tĩnh của QUEUE (không gửi thư mời) |
| `CALENDAR_QUIET_TO` | 7 | Cuối giờ yên tĩnh |
| `CALENDAR_MIN_LEAD_HOURS` | 3 | Buổi bắt đầu trong chừng này giờ được tạo sự kiện ngay, ở mọi chế độ |
| `CALENDAR_BATCH_MAX` | 40 | Mỗi lần chạy tạo tối đa chừng này sự kiện |
| `CALENDAR_MAX_ATTEMPTS` | 5 | Lỗi quá chừng này lần: dừng thử, báo Khẩn |
| `SLOT_CACHE_SECONDS` | 60 | Danh sách giờ trống dùng chung trong chừng này giây. 0 = tắt. Đặt lịch luôn kiểm lại nên không bao giờ đặt trùng |

### B10. Phòng Meet

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `MEET_MODE` | AUTO | AUTO: mỗi buổi một link. TUTOR_ROOM: phòng cố định của tutor (cột `meet_room` trong USERS) |

### B11. Liên hệ, thương hiệu, thanh toán, link

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `ADMIN_PHONE` | trống | Số admin (chỉ admin dùng; trang web không có nút gọi) |
| `ADMIN_ZALO_URL` | trống | Link Zalo admin (nút Zalo nổi, nút liên hệ, gói giá 0, chân email). Phải bắt đầu `https://` |
| `SCHOOL_NAME` | thaiput | Tên trên web, email, sự kiện |
| `SCHOOL_DOMAIN` | thaiput.vn | Tên miền |
| `SCHOOL_SITE_URL` | https://www.thaiput.vn | Nút Website |
| `WEBAPP_URL` | trống | **Bắt buộc**: link `/exec` của lần triển khai trang web. Link trong email dùng link này |
| `POLICY_URL` | trống | Link chính sách ở form đăng ký |
| `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` | trống | Thông tin chuyển khoản trên form đăng ký, gia hạn |
| `SHORT_URL_HOME`, `SHORT_URL_LOGIN`, `SHORT_URL_STUDENT`, `SHORT_URL_TUTOR` | trống | Link rút gọn trên tên miền (URL Redirect ở Namecheap), ví dụ `https://dangky.thaiput.vn`. Chỉ để menu **Xem link trang web** hiện và đối chiếu; email vẫn dùng `WEBAPP_URL` |

### B12. Hạ tầng (Setup ghi, không sửa)

| Ô | Ý nghĩa |
|---|---|
| `LESSON_CALENDAR_ID` | Lịch "Thaiput · Lịch học" chứa mọi buổi |
| `UPLOADS_FOLDER_ID` | Thư mục ảnh chuyển khoản |
| `BACKUP_FOLDER_ID` | Thư mục bản sao dữ liệu mỗi đêm |
| `EXPORT_FOLDER_ID` | Thư mục CSV mỗi tuần |
| `BACKUP_KEEP` | Số bản sao đêm giữ lại (mặc định 30, sửa được). Không áp dụng cho thư mục Releases |

### B13. Lưu trữ dữ liệu cũ

Hệ thống chuyển dữ liệu cũ đã xong sang một file lưu trữ theo năm, tên `THAIPUT · Lưu trữ · <môi trường> · <năm>` (tab đầu `DOC_TRUOC` giải thích). File dữ liệu chính luôn nhẹ. Không mất dòng nào. Mở file: menu **Lưu trữ → Lưu trữ: mở file**.

| Tab | Chuyển khi | Không bao giờ chuyển |
|---|---|---|
| BOOKINGS | Buổi của gói đã hết hạn, cũ hơn `ARCHIVE_KEEP_MONTHS` | Buổi của gói còn chạy |
| AVAILABILITY | Giờ rảnh cũ hơn `ARCHIVE_KEEP_MONTHS`, không chờ duyệt | Giờ tutor xin huỷ còn chờ duyệt |
| ACTIVITY_LOG, METRICS | Cũ hơn `LOG_KEEP_DAYS` ngày | |
| MAIL_LOG | Cũ hơn `LOG_KEEP_DAYS` ngày | Dòng email marketing (`kind` bắt đầu `MKT:`, sổ chống gửi trùng) |
| NOTIFICATIONS | Cũ hơn `LOG_KEEP_DAYS` ngày, đã đọc hoặc mức Thông tin | Khẩn, Cần xử lý chưa đọc |
| PAYMENTS | Không bao giờ | Mọi dòng |

| Ô | Mặc định | Ý nghĩa, khi nào sửa |
|---|---|---|
| `ARCHIVE_ENABLED` | TRUE | FALSE = tắt lưu trữ |
| `ARCHIVE_KEEP_MONTHS` | 6 | BOOKINGS, AVAILABILITY giữ trong file chính chừng này tháng (tối thiểu 3) |
| `LOG_KEEP_DAYS` | 60 | Nhật ký, email đã gửi, thông báo, METRICS giữ chừng này ngày (tối thiểu 30). Thay 2 ô cũ `ACTIVITY_LOG_KEEP_DAYS`, `ARCHIVE_LOG_KEEP_MONTHS` |
| `ARCHIVE_HOUR` | 3 | Chạy 1 lần mỗi ngày từ giờ này, sau bản sao đêm. -1 = chỉ chạy bằng menu |
| `ARCHIVE_MAX_ROWS` | 3000 | Số dòng mỗi lô. Một lượt chạy nhiều lô tới khi hết; quá 3,5 phút thì giờ sau làm tiếp |
| `ARCHIVE_FOLDER_ID` | trống | Thư mục file lưu trữ. Trống = tự tạo lần đầu (Setup ghi) |

Lưu trữ không chạy khi đang bảo trì hoặc khi chưa có bản sao đêm nay.

### B14. Bảo trì, chuyển hệ thống

| Ô | Mặc định | Ý nghĩa |
|---|---|---|
| `MAINTENANCE_MODE` | OFF | OFF: bình thường. READONLY: học viên, tutor chỉ xem lịch; đặt, huỷ, lưu tạm dừng. CLOSED: cổng học viên, tutor và form đăng ký tạm đóng. Admin không bao giờ bị chặn. Bật tắt nhanh bằng menu |
| `MAINTENANCE_UNTIL` | trống | Chữ tự do hiện trong câu báo, ví dụ `21:00 hôm nay` |
| `MOVED_TO_URL` | trống | Link trang web của hệ thống mới (menu Chuyển hệ thống Bước 1 ghi, phải `https://`). Trang của hệ thống cũ hiện link này |

### B15. Ô cũ đã bỏ (để nguyên hoặc xoá dòng đều được)

| Ô cũ | Thay bằng | Ghi chú |
|---|---|---|
| `LOGIN_LINK_MINUTES` | `STUDENT_LINK_MINUTES`, `TUTOR_LINK_MINUTES` | Menu 1 chép giá trị đã sửa sang ô mới |
| `LOGIN_LINK_MAX_USES`, `STAFF_LOGIN_LINK_MAX_USES` | 3 ô `*_LINK_MAX_USES` | Như trên |
| `LOGIN_LINK_MAX_PER_WINDOW`, `LOGIN_LINK_WINDOW_MINUTES` | `LOGIN_LINK_COOLDOWN_MINUTES` | Menu 1 ghi chú "không dùng" |
| `TUTOR_REMIND_HOURS`, `TUTOR_DEADLINE_HOUR` | `TUTOR_REMIND_AT`, `TUTOR_DEADLINE_AT` | Như trên |
| `AUTO_COMPLETE_AFTER_HOURS` | `RESULT_NOTICE_AFTER_HOURS` | Không còn tự Hoàn thành |
| `ACTIVITY_LOG_KEEP_DAYS` | `LOG_KEEP_DAYS` | Menu 1 chép giá trị đã sửa |
| `ARCHIVE_LOG_KEEP_MONTHS` | `LOG_KEEP_DAYS` | Không chép. Email, thông báo cũ hơn 60 ngày sang file lưu trữ ở lượt đêm đầu tiên sau khi cập nhật (không mất) |

**Không nằm trong CONFIG** (Script Properties, không sửa tay): khoá bí mật đăng nhập Google, khoá thử tải, mốc nhịp tim `HB_*`, mốc lưu trữ `ARCH_*`, `ID_FLOOR_*`, dấu bước chuyển dữ liệu `MIG_*`, dấu việc tuần `DONE_*`. Tab META (K10) ghi lại phiên bản và các mốc này để đối chiếu.

## Phần C. Menu thaiput

Menu nằm trên thanh công cụ của file Sheets (tải lại trang nếu chưa thấy). Mục ghi "chủ file" chỉ tài khoản sở hữu file chạy được.

### C1. Ba mục đầu

| Mục menu | Làm gì | Khi nào |
|---|---|---|
| **1. Cài đặt lần đầu / cập nhật cấu trúc** (chủ file) | Tạo tab, cột, ô CONFIG, gói mặc định, thư mục, lịch còn thiếu; chép ô CONFIG đổi tên; chạy các bước chuyển dữ liệu của phiên bản mới (một lần); gieo chữ web, mẫu email, luật thông báo còn thiếu; đặt dropdown, màu, bảo vệ cột; ghi tab META; tạo lại trigger. Phiên bản code đổi: tự sao lưu file dữ liệu vào thư mục Releases trước. Chạy lại bao nhiêu lần cũng an toàn | Mỗi lần dán code mới: NGAY sau khi Lưu, TRƯỚC khi Triển khai |
| **2. Kiểm tra hệ thống** | Kiểm múi giờ, trigger, CONFIG, mốc tuần, gói học, thư mục, link, bảo trì, cổng thử tải, lưu trữ, đăng nhập Google, đường gửi email, tài khoản gửi, hạn mức email. Mỗi dòng ghi ĐẠT, LỖI (phải sửa) hoặc LƯU Ý (nhắc việc) | Sau mỗi lần cập nhật; khi nghi có lỗi |
| **3. Tạo lại trigger tự động** | Xoá trigger cũ của hệ thống và tạo lại đúng **8** | Khi menu 2 báo thiếu trigger; sau khi cập nhật từ bản trước 8.1.1. Chủ file |
| **Xem link trang web** | Link `/exec` và link trang chủ, đăng nhập, học viên, tutor, kèm 4 link rút gọn (B11). Admin vào bằng link đăng nhập | Gửi link cho người mới |

### C2. Người dùng

| Mục | Làm gì | Ghi chú |
|---|---|---|
| Tạm khoá học viên (dòng đang chọn ở USERS) | status SUSPENDED. Học viên vẫn xem lịch, không đặt được buổi mới. Gói theo ngày ngừng tính ngày từ hôm nay | Nợ phí, vi phạm |
| Mở khoá học viên | status ACTIVE, cộng số ngày đã khoá vào hạn gói | |
| Gửi link đăng nhập (các dòng đang chọn ở USERS) | Gửi link cho nhiều người một lúc, không bị giới hạn 1 lần mỗi giờ. Mỗi người 1 email. Bỏ qua dòng ADMIN và dòng DISABLED (hộp thoại liệt kê dòng bỏ qua) | Người mới, người báo mất link |
| Thêm tutor / Thêm admin | Tutor: tên, email, số. Admin: tên, email | |
| Khoá tutor (xem trước, hỏi lại 2 lần) | Chọn dòng tutor ở USERS. Xem trước từng buổi sắp tới: đổi được sang tutor khác hay phải huỷ. Đồng ý 2 lần thì: tutor DISABLED, buổi sắp tới đổi tutor (không ai rảnh thì huỷ kiểu tutor huỷ, học viên không bị trừ và được bù), giờ rảnh từ hôm nay huỷ, tutor bị thoát mọi thiết bị. Học viên nhận email đổi tutor hoặc huỷ (mỗi buổi 1 email) | Tutor nghỉ hẳn |
| Mở khoá tutor | status ACTIVE. Giờ rảnh đã huỷ không tự mở lại: tutor mở lại trên trang, admin gửi link đăng nhập | |

### C3. Gói học, Báo cáo

| Mục | Làm gì |
|---|---|
| Gói học → Thêm gói | Hộp thoại hỏi mã, tên, kiểu, số ngày hoặc số buổi, giá. Kiểm như menu 2 trước khi ghi (K3) |
| Báo cáo → Làm mới báo cáo tháng này / Báo cáo tháng trước | Ghi tab REPORT_MONTH: số buổi, lương từng tutor, doanh thu, số email, buổi Không hoàn thành |

### C4. Email

| Mục | Làm gì | Khi nào |
|---|---|---|
| Cập nhật nội dung web và email | Xoá bộ đệm chữ, kiểm lỗi chữ web, mẫu email, chiến dịch marketing đang chờ gửi (Phần D, F, G) | Sau mỗi lần sửa chữ |
| Gửi thử một mẫu email cho tôi | Nhập key mẫu (ví dụ `WELCOME`); thư với dữ liệu minh hoạ tới chính người bấm | Sau khi sửa mẫu |
| **Kiểm tra gửi email** | Nhập một địa chỉ (trống = tài khoản gửi), gửi thư nhỏ có mã `MT...`. Hộp thoại báo tài khoản gửi, đường gửi (GMAILAPP hoặc MAILAPP), hạn mức trước và sau, 4 bước tìm thư bị mất. Lần đầu sau khi dán `appsscript.json` mới: Google hỏi cấp quyền, bấm cho phép | Ai đó báo không nhận được email (L3); sau mỗi lần dán `appsscript.json` |
| Email marketing: gửi thử một chiến dịch cho tôi | Gửi bản thử của chiến dịch tới chính người bấm | Phần G |
| Email marketing: gửi chiến dịch | Hiện số người nhận, hạn mức; bấm Có mới gửi | Phần G |

### C5. Cập nhật phiên bản

| Mục | Làm gì |
|---|---|
| Bảo trì: chỉ xem | `MAINTENANCE_MODE = READONLY` |
| Bảo trì: đóng cổng học viên và tutor | `MAINTENANCE_MODE = CLOSED` |
| Bảo trì: tắt | Về bình thường |
| Phát hành: sao lưu ngay | Bản sao file dữ liệu vào thư mục Releases (không bao giờ tự xoá) |
| Các bước chuyển dữ liệu theo phiên bản (chỉ đọc) | Danh sách bước chuyển dữ liệu của từng phiên bản, ĐÃ CHẠY hay CHƯA. Sau menu 1 mọi bước phải ĐÃ CHẠY |
| Bù buổi 8.1.0: xem trước gói sẽ đổi ngày (chỉ đọc) | Liệt kê gói sẽ đổi hạn khi chạy bước bù buổi. Chỉ có ích trước lần chạy menu 1 đầu tiên của bản 8.1.0 trở lên |

### C6. Chuyển hệ thống (dùng ở go live chunk 6 hoặc khi đổi tài khoản)

Không chạy Bước 1 trên hệ thống đang dùng nếu chưa có kế hoạch: Bước 1 đóng cổng, gỡ sự kiện Calendar và xoá trigger của hệ thống đó.

| Mục | Chạy ở | Làm gì |
|---|---|---|
| Bước 1: Chuẩn bị chuyển | Hệ thống CŨ | Đóng cổng (CLOSED), ghi `MOVED_TO_URL`, gỡ sự kiện các buổi sắp tới, xoá trigger, ghi META |
| Bước 2: Chạy thử chép dữ liệu | Hệ thống MỚI | Đọc file cũ, báo số dòng mỗi tab, dòng trùng mã, trùng email. Không ghi gì |
| Bước 3: Chép dữ liệu thật | Hệ thống MỚI | Chép theo mã, ghép cột theo tên. Có trùng thì dừng trước khi ghi. Chạy lại không nhân đôi |
| Bước 4: tạo lại sự kiện các buổi sắp tới | Hệ thống MỚI | Tạo sự kiện Calendar và gửi lời mời mới |
| Chỉ gỡ sự kiện các buổi sắp tới | Hệ thống CŨ | Dùng riêng khi đổi tài khoản lịch |

Chi tiết từng bước nằm trong hướng dẫn go live của chunk 6.

### C7. Lưu trữ

| Mục | Làm gì |
|---|---|
| Lưu trữ: xem tình trạng | Số dòng mỗi tab sẽ chuyển, lần chạy gần nhất, lô dở |
| Lưu trữ: mở file | Link file lưu trữ từng năm |
| Lưu trữ: chạy ngay | Chạy không chờ giờ (chủ file) |

### C8. Công cụ kỹ thuật

| Mục | Làm gì | Ghi chú |
|---|---|---|
| Sao lưu ngay | Một bản sao file dữ liệu vào thư mục Backup (bị dọn theo `BACKUP_KEEP`) | |
| Calendar: tạo sự kiện đang chờ ngay | Chạy hàng đợi Calendar ngay, bỏ qua giờ yên tĩnh | Cần link Meet gấp |
| Đo tốc độ (chỉ đọc) | Đo thời gian từng phần việc trên dữ liệu thật, kèm hạn mức email và đường gửi | Giờ vắng |
| Đăng nhập Google: tạo khoá bí mật (chủ file) | Tạo khoá cho dự án phụ (Phần M). Tạo lại làm khoá cũ hết hiệu lực | 1 lần |
| Tắt hết trigger tự động | Xoá 8 trigger của hệ thống (trigger khác do người dùng tự tạo giữ nguyên). Dùng cho STAGING khi PRODUCTION đã chạy chính thức | Hỏi lại trước khi chạy |
| Xoá dữ liệu test (2 bước xác nhận) | Mức 1 xoá **MỌI** học viên (thật lẫn giả), mọi buổi, giờ rảnh (cả của tutor thật), gói, đăng ký, thanh toán, phiên đăng nhập, nhật ký, MAIL_LOG (cả sổ chống gửi trùng marketing), thông báo; chỉ giữ tutor, admin và các tab cài đặt (CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES). Sao lưu trước khi xoá. Mức 2 xoá thêm mọi tutor | Chỉ khi `ALLOW_DATA_RESET = TRUE`; PRODUCTION bị khoá. Không chạy trên STAGING đang giữ dữ liệu cần dùng |

### C9. Test (chỉ hiện trên STAGING)

| Mục | Làm gì |
|---|---|
| Bật, tắt giả lập thời gian | Hệ thống coi "bây giờ" là giờ đã nhập. Tắt ngay khi thử xong |
| Chạy reminderJob, hourlyJob, calendarJob, dailyJob | Chạy một việc tự động ngay, không chờ trigger |
| Thử tải: tạo dữ liệu giả / bật 2 giờ / tắt / kiểm kết quả | `HUONG_DAN_THU_TAI.md` |

### C10. 8 trigger tự động (menu 3 tạo, menu 2 kiểm)

| Việc | Nhịp | Làm gì |
|---|---|---|
| calendarJob | 5 phút | Tạo sự kiện Calendar đang chờ |
| reminderJob | 15 phút | Email nhắc trước giờ học |
| hourlyJob | 1 giờ | Đối soát dữ liệu, báo đỏ kết quả buổi, nhắc tutor, hạn mở lịch, tự lành gói, ghi bù nhật ký, lưu trữ (từ `ARCHIVE_HOUR`), email tổng hợp (từ `DIGEST_HOUR`) |
| dailyJob | 06:00 mỗi ngày | Đổi trạng thái gói (hết hạn, tự kích hoạt gói chưa dùng, gói nối tiếp chạy); email gói sắp hết hạn. Học viên đang tạm khoá: gói không đổi |
| nightlyBackup | 02:00 mỗi ngày | Bản sao file dữ liệu vào thư mục Backup |
| weeklyExport | Thứ Hai 03:00 | CSV vào thư mục Export |
| onEditInstallable | Khi sửa ô | Xử lý dropdown, ghi nhật ký sửa tay, trả lại ô hệ thống |
| onChangeInstallable | Khi đổi cấu trúc | Ghi nhật ký chèn, xoá dòng, cột, tab; báo khi tab hệ thống bị xoá |

## Phần D. Chữ trên trang web (tab CONTENT), hai thứ tiếng

Mọi chữ học viên, tutor, khách và admin thấy trên trang web nằm ở tab CONTENT, mỗi dòng một chữ, có cả tiếng Việt và tiếng Anh. Sửa ô là đổi chữ trên web, không cần coder, không cần triển khai lại.

### D1. Các cột

| Cột | Ai ghi | Nghĩa |
|---|---|---|
| `key` | Hệ thống | Mã của chữ, ví dụ `s.tab_book`. **Không sửa, không xoá** |
| `page` | Hệ thống | Chữ nằm ở trang nào: Chung (mọi trang), Trang chủ, Trang đăng nhập, Cổng học viên, Cổng học viên: nhãn trạng thái buổi, Cổng tutor, Câu báo lỗi (mọi trang), Trang quản trị và các nhóm con của nó (ô số liệu, mức thông báo, tên sự kiện thông báo, tên hành động trong nhật ký, nhãn trạng thái buổi, trạng thái gói, trạng thái tài khoản, câu báo lỗi khi đặt thay, vai trò, ngôn ngữ của người dùng) |
| `position` | Hệ thống | Chỗ nào trên trang, ví dụ "Tab thứ nhất (thanh dưới trên điện thoại, cột trái trên máy tính)" |
| `shown_when` | Hệ thống | Hiện khi nào, ví dụ "Gói theo ngày", "Bấm Huỷ buổi" |
| `vi` | **Admin sửa** | Chữ tiếng Việt đang dùng |
| `en` | **Admin sửa** | Chữ tiếng Anh đang dùng |
| `default_vi`, `default_en` | Hệ thống | Chữ gốc, để đối chiếu hoặc chép lại khi sửa hỏng |
| `note` | Admin | Ghi chú tuỳ ý, hệ thống không đọc |

Năm cột của hệ thống (`page`, `position`, `shown_when`, `default_vi`, `default_en`) được ghi lại mỗi lần chạy menu 1. Sửa tay các cột này không có tác dụng.

### D2. Tìm chữ cần sửa

* Theo trang: bật bộ lọc (**Dữ liệu → Tạo bộ lọc**), lọc cột `page`.
* Theo chữ đang thấy trên web: **Ctrl+F** (Mac: Cmd+F) trong Sheets, gõ vài chữ đang thấy.
* Tiền tố của key: `a.` chung, `h.` trang chủ, `l.` đăng nhập, `s.` cổng học viên, `st.` nhãn trạng thái buổi, `t.` cổng tutor, `r.` câu báo lỗi, `ad.` trang quản trị.
* Trong trang quản trị: `ad.kpi.` ô số liệu, `ad.lv.` mức thông báo (Khẩn, Cần xử lý, Thông tin), `ad.ev.` tên sự kiện dưới mỗi thông báo (ví dụ `ad.ev.STUDENT_CANCELLED`), `ad.act.` tên hành động trong nhật ký (ví dụ `ad.act.BOOKED`), `ad.st.` nhãn trạng thái buổi cho admin, `ad.pkg.` trạng thái gói, `ad.us.` trạng thái tài khoản, `ad.r.` câu báo khi đặt thay không được.
* Hai dòng `ad.act.PACKAGE_` và `ad.act.MAINTENANCE_` là khuôn chung: `{x}` được thay bằng trạng thái gói mới hoặc chế độ bảo trì.

### D3. Cú pháp trong ô

| Viết | Nghĩa |
|---|---|
| Ô để trống | Dùng chữ gốc (cột `default_vi` hoặc `default_en`) |
| `-` (chỉ một dấu gạch) | Cố ý ẩn chữ đó |
| `{n}`, `{date}`, `{slot}`... | Chỗ hệ thống chèn số, ngày, giờ. **Giữ nguyên** khi sửa chữ quanh nó; cột `position` ghi nghĩa của từng `{...}` |
| `<b>...</b>`, `<br>` | Chữ đậm, xuống dòng (chỉ dùng ở chữ đã có sẵn thẻ này) |
| Danh sách cách nhau dấu `\|` | Ví dụ `h.levels` (trình độ), `t.legend` (chú thích màu), `a.dow` (tên 7 thứ, bắt đầu từ Chủ nhật). Hai cột `vi` và `en` phải cùng số mục, cùng thứ tự |

Trình độ (`h.levels`): người dùng thấy theo ngôn ngữ đang chọn, nhưng Sheets luôn lưu bản tiếng Việt cùng vị trí, để cột trình độ trong REGISTRATIONS và USERS chỉ có một thứ tiếng.

### D4. Sửa và kiểm

1. Sửa ô `vi` hoặc `en`.
2. Menu **Cập nhật nội dung web và email**. Hộp thoại báo "Không thấy lỗi" hoặc liệt kê việc cần xem lại:
   * chữ đã sửa làm mất hoặc thêm `{...}` so với chữ gốc (trang sẽ thiếu số hoặc hiện nguyên `{...}`);
   * danh sách `|` sai số mục (`a.dow`, `a.dow_short` cần đúng 7; `t.legend` đúng 5; `h.levels` hai thứ tiếng cùng số mục);
   * key lạ không được trang dùng (thường do gõ nhầm key);
   * chiến dịch marketing đang READY có lỗi (Phần G).
3. Tải lại trang web. Không bấm menu thì chữ mới vẫn có hiệu lực sau tối đa 5 phút.

### D5. Chữ không nằm trong CONTENT

| Chữ | Sửa ở đâu |
|---|---|
| Tên gói, giá | Tab PACKAGES: cột `name` (tiếng Việt), `name_en` (tiếng Anh), `price_vnd`. Trang và email hiện tên theo ngôn ngữ người xem chọn; `name_en` trống thì hiện tên tiếng Việt. Menu 1 tự điền `name_en` cho gói mặc định chưa đổi tên; gói admin đã đổi tên hoặc gói mới thì admin tự điền |
| Thông tin chuyển khoản, link Zalo, website, chính sách | CONFIG (B11) |
| Mọi email hệ thống | Tab EMAIL_TEMPLATES (Phần F) |
| Email marketing | Tab MARKETING_EMAILS (Phần G) |
| Nội dung từng thông báo cho admin | Hệ thống tự viết cả hai thứ tiếng lúc thông báo xảy ra (tab NOTIFICATIONS, cột `message` và `message_en`). Thông báo cũ hơn bản 8.0.10 chỉ có tiếng Việt |
| Chi tiết từng dòng nhật ký | Ghi nguyên văn dữ liệu lúc xảy ra (mã, email, số), không dịch; tên hành động thì song ngữ (`ad.act.`) |
| Menu thaiput và hộp thoại trong Sheets | Chỉ tiếng Việt (công cụ nội bộ của admin) |

### D6. Cập nhật từ bản trước 8.0.9

Tab CONTENT bản cũ có một cột `value`. Lần đầu chạy menu 1 của bản 8.0.9: tab cũ được đổi tên thành `CONTENT_CU_808` và ẩn đi (không xoá); tab CONTENT mới được tạo; chữ khác chữ gốc ở tab cũ được chép sang đúng cột (chữ của cổng tutor sang cột `en`, chữ trước đây ghi riêng bản tiếng Anh sang cột `en` của dòng tương ứng). Hộp thoại liệt kê các key đã chép và key cũ bị bỏ qua; cột `note` của các dòng đã chép ghi "Chép từ bản 8.0.8 ..., xem lại".

Vì sao nên xem lại: bản cũ không tự cập nhật ô `value` khi chữ gốc trong code đổi, nên một số dòng admin chưa từng sửa vẫn mang chữ gốc cũ và cũng được chép. Lọc cột `note` có chữ "Chép từ bản 8.0.8", so cột `vi`, `en` với `default_vi`, `default_en`: dòng nào admin không cố ý sửa thì xoá trống ô (về chữ gốc mới), rồi xoá ghi chú.

Menu 1 bị ngắt giữa chừng (khoá bận, quá 6 phút): chạy lại menu 1, bước chép tự làm tiếp. Xem tab cũ: chuột phải vào thanh tab → **Hiện trang tính ẩn**.

## Phần E. Ngôn ngữ của từng người dùng

* Mọi trang có nút **VI | EN** ở góc trên, kể cả trang quản trị. Bấm là đổi ngay toàn bộ chữ; tab đang xem, giờ đang chọn, chữ đang nhập trong form, trang con đang mở (trang một học viên, đặt thay, nhật ký đang tìm) giữ nguyên, không tải lại từ máy chủ.
* **Lần đầu đăng nhập (bằng link email hoặc bằng nút đăng nhập Google)**, người chưa chọn ngôn ngữ thấy hộp **Chọn ngôn ngữ · Choose your language**. Nút chính đề xuất: học viên và admin Tiếng Việt, tutor English. Đóng hộp mà không chọn thì dùng đề xuất đó.
* Lựa chọn được lưu ở cột `lang` của USERS (`vi` hoặc `en`) và trên máy đang dùng. Mở trên thiết bị khác vẫn đúng ngôn ngữ đã chọn.
* Admin đổi giúp: sửa ô `lang` (chọn `vi` hoặc `en`). Xoá trống ô: lần đăng nhập kế tiếp người đó được hỏi lại.
* Email hệ thống luôn có cả hai thứ tiếng; thứ tiếng người nhận đã chọn nằm ở trên, cả tiêu đề lẫn thân email. Email gửi tới `ADMIN_EMAIL` theo ngôn ngữ của dòng admin có cùng email trong USERS; email thông báo cho admin và email tổng hợp cuối ngày có câu tiếng Anh đầy đủ. Người chưa chọn: học viên tiếng Việt trước, tutor tiếng Anh trước.
* Câu báo lỗi (đặt không được, hết hạn huỷ...) hiện theo ngôn ngữ đang chọn; sửa chữ ở các dòng `r.` của CONTENT.
* Khách chưa đăng nhập: mặc định tiếng Việt; máy cài tiếng Thái thì mặc định tiếng Anh.
* Đang bảo trì chỉ xem: nút VI | EN vẫn đổi chữ trên máy, chỉ không lưu lên USERS.
* Trong lúc đang đặt, huỷ, lưu hoặc gửi form (vài giây), nút VI | EN tạm không đổi và báo "Đang gửi, đổi ngôn ngữ sau khi xong nhé", để không gửi trùng.
* Trình độ học viên (`h.levels`) hiện cho tutor theo ngôn ngữ của tutor.

## Phần F. Email hệ thống (tab EMAIL_TEMPLATES)

Mỗi dòng là một loại email hệ thống tự gửi (link đăng nhập, chào mừng, xác nhận đặt, huỷ, nhắc buổi, sắp hết hạn, thông báo cho admin...). Mỗi email có nửa tiếng Việt và nửa tiếng Anh.

| Cột | Nghĩa |
|---|---|
| `key` | Mã mẫu, không sửa |
| `audience` | Ai nhận: STUDENT, TUTOR, ADMIN, ALL. Chỉ để ghi nhớ |
| `active` | FALSE = không gửi loại email này (ghi `MAIL_TEMPLATE_OFF` vào ACTIVITY_LOG) |
| `subject_vi`, `title_vi`, `body_vi` | Tiêu đề email, tiêu đề lớn trong thư, thân thư tiếng Việt |
| `subject_en`, `title_en`, `body_en` | Như trên, tiếng Anh |
| `variables` | Danh sách biến dùng được trong mẫu này |
| `note` | Ghi chú tuỳ ý |

Cú pháp trong ô:

| Viết | Nghĩa |
|---|---|
| Ô để trống | Dùng mẫu gốc |
| `-` | Cố ý để trống (ví dụ bỏ nửa tiếng Anh) |
| `{{name}}` | Chèn giá trị của biến (chỉ biến có trong cột `variables`) |
| `{{button:login_url\|Đăng nhập}}` | Nút bấm tới link trong biến đó |
| `**chữ**` | In đậm |
| Một dòng trống | Sang đoạn mới |

Sửa xong: menu **Cập nhật nội dung web và email** (báo biến sai, nút bị mất so với mẫu gốc), rồi menu **Gửi thử một mẫu email cho tôi** để xem thư thật. Dòng `MARKETING_FOOTER` là chân của mọi email marketing (Phần G), không gửi riêng.

## Phần G. Email marketing (tab MARKETING_EMAILS)

Email marketing là email admin chủ động gửi cho một nhóm người (ưu đãi, gia hạn sớm, tin mới, chúc Tết), khác email hệ thống tự gửi. Mỗi dòng của tab MARKETING_EMAILS là một chiến dịch.

### G1. Các cột

| Cột | Ai ghi | Nghĩa |
|---|---|---|
| `campaign_id` | Admin | Mã chiến dịch, viết liền không dấu, chữ, số, dấu gạch dưới, 2 đến 30 ký tự. Ví dụ `TET2027`, `GIAHAN_T11`. Không đổi mã sau khi đã gửi (mã mới = chiến dịch mới, gửi lại cho mọi người) |
| `status` | Admin chọn | `DRAFT`: đang viết, menu gửi thật từ chối. `READY`: cho phép gửi. `SENDING`: đã gửi một phần (hệ thống ghi). `SENT`: đã gửi xong (hệ thống ghi) |
| `audience` | Admin chọn | Nhóm nhận (G2) |
| `subject_vi`, `title_vi`, `body_vi` | Admin | Tiêu đề email, tiêu đề lớn trong thư, thân thư tiếng Việt |
| `subject_en`, `title_en`, `body_en` | Admin | Như trên, tiếng Anh. Bỏ trống cả ba ô một thứ tiếng = email chỉ có thứ tiếng kia |
| `sent_count` | Hệ thống | Tổng số người đã nhận chiến dịch này |
| `last_sent_at` | Hệ thống | Lần gửi gần nhất |
| `last_result` | Hệ thống | Kết quả lần gửi gần nhất, ví dụ "gửi 120, xong" hoặc "gửi 80, còn 40 người (dừng vì gần hết hạn mức email hôm nay; chạy lại ngày mai)" |
| `note` | Admin | Ghi chú tuỳ ý |

Menu 1 tạo sẵn một dòng ví dụ `VI_DU` (status DRAFT) để xem cách viết.

### G2. Nhóm nhận (cột audience)

| Giá trị | Ai nhận |
|---|---|
| `ALL_STUDENTS` | Mọi học viên đang hoạt động (USERS status ACTIVE) |
| `ACTIVE_STUDENTS` | Học viên còn gói: đang dùng, chưa kích hoạt, hoặc gói nối tiếp |
| `EXPIRED_STUDENTS` | Học viên đã hết mọi gói (gợi ý gia hạn) |
| `TUTORS` | Mọi tutor đang hoạt động |
| `ALL` | Mọi học viên và tutor đang hoạt động |

Không bao giờ nhận: người có ô `marketing_opt_out` trong USERS ghi `TRUE`; tài khoản tạm khoá hoặc đã tắt (status khác ACTIVE); admin; địa chỉ thử tải `@loadtest.invalid`.

### G3. Viết chữ

Cùng cú pháp với email hệ thống (Phần F). Biến dùng được:

| Biến | Giá trị |
|---|---|
| `{{name}}` | Tên người nhận (cột `name` của USERS) |
| `{{portal_url}}` | Link vào lịch của người đó (cổng học viên hoặc cổng tutor) |
| `{{renew_url}}` | Link thẳng tới form gia hạn của học viên (tutor: cổng tutor) |
| `{{home_url}}` | Trang chủ |
| `{{zalo_url}}` | Link Zalo admin |
| `{{site_url}}` | Website trường |

Ví dụ thân thư:

```
Chào {{name}},

Gia hạn trước ngày 30 tháng này để nhận thêm **3 ngày** học.

{{button:renew_url|Gia hạn ngay}}
```

Biến không có trong danh sách: hệ thống từ chối gửi và báo tên biến sai. Nút bấm chỉ dùng biến link (tên đuôi `_url`). Chân email (câu "Không muốn nhận email giới thiệu, ưu đãi nữa? Nhắn Zalo admin, thaiput sẽ ngừng gửi") tự thêm vào cuối mỗi thứ tiếng; sửa chữ đó ở dòng `MARKETING_FOOTER` của EMAIL_TEMPLATES (cột `body_vi`, `body_en`). Câu từ chối nhận luôn có: tắt mẫu đó hoặc để trống ô thì hệ thống dùng chữ gốc.

### G4. Gửi một chiến dịch, từng bước

1. Thêm một dòng mới (hoặc sửa dòng `VI_DU`): mã, `status = DRAFT`, nhóm nhận, chữ hai thứ tiếng.
2. Menu **Email marketing → Gửi thử một chiến dịch cho tôi**, gõ mã. Mở hộp thư: kiểm tiêu đề (bắt đầu `[THỬ · TEST]`), chữ, nút, chân email, cả hai thứ tiếng. Gửi thử không tính là đã gửi; gửi thử bao nhiêu lần cũng được, ở mọi status.
3. Sửa đến khi ưng. Đổi `status` thành `READY`.
4. Menu **Cập nhật nội dung web và email**: không có dòng báo lỗi của chiến dịch này.
5. Menu **Email marketing → Gửi chiến dịch**, gõ mã. Hộp thoại hiện: tổng số người trong nhóm, số đã nhận trước, số còn lại, hạn mức email còn hôm nay, số giữ lại cho email hệ thống, số sẽ gửi lượt này. Bấm **Có** để gửi, **Không** để thôi.
6. Xong: hộp thoại báo kết quả; cột `last_result`, `sent_count`, `status` được ghi. `SENT` là đã xong. `SENDING` là còn người chưa nhận: đọc `last_result` để biết vì sao dừng, rồi chạy lại menu ở bước 5 (hôm sau nếu dừng vì hạn mức).

Mỗi người chỉ nhận một lần cho mỗi mã chiến dịch: chạy lại menu chỉ gửi người chưa nhận. Trong lúc một lượt đang gửi, lượt thứ hai cho cùng mã (ví dụ co-founder kia cũng bấm) bị từ chối với câu "đang có một lượt khác gửi chiến dịch"; chờ hộp thoại kết quả của lượt đầu.

**Dừng giữa chừng:** đổi `status` thành `DRAFT`. Lượt đang chạy dừng ở lô kế tiếp (tối đa 10 email nữa), giữ `DRAFT`, `last_result` ghi "dừng vì status đổi thành DRAFT". Sửa xong đổi lại `READY` và chạy menu: chỉ gửi người chưa nhận. Có học viên mới sau khi chiến dịch đã `SENT` mà muốn gửi thêm cho học viên mới: đổi `status` về `READY`, chạy menu gửi; người đã nhận không nhận lại.

### G5. Hạn mức và giới hạn

* Mỗi email tính 1 vào hạn mức người nhận mỗi ngày của tài khoản chạy hệ thống: 1.500 với Workspace đã qua giai đoạn dùng thử; tài khoản Workspace dùng thử thực tế chỉ khoảng 100 (tự tăng khi tổ chức đã trả tổng cộng 100 USD và qua 60 ngày). Menu 2 cho biết con số đang có. Với hạn mức khoảng 100 và `MARKETING_QUOTA_RESERVE` mặc định 100, email marketing không gửi được (menu 2 báo trước); muốn gửi thì giảm ô này, nhưng nên chờ hạn mức tăng. Hệ thống dừng khi hạn mức còn lại chỉ còn `MARKETING_QUOTA_RESERVE` (mặc định 100), để email xác nhận, huỷ, link đăng nhập trong ngày vẫn gửi được.
* Một lượt gửi dừng khoảng 4,5 phút sau khi bấm menu, tính cả thời gian đọc hộp thoại (Google cho mỗi lượt chạy tối đa 6 phút); thường được vài trăm email. Chạy lại menu để gửi tiếp. Hạn mức được đọc lại sau mỗi 10 email.
* Hệ thống nhớ người đã nhận theo tab MAIL_LOG (dòng có `kind` là `MKT:<mã>`). Từ 8.1.3 các dòng này không bao giờ bị chuyển sang file lưu trữ, nên mỗi người chỉ nhận một lần mỗi mã, kể cả sau nhiều tháng. Không xoá tay các dòng này.
* Mất kết nối giữa chừng: tối đa 10 người của lô đang gửi có thể chưa được ghi nhận; lần chạy sau có thể gửi lại cho đúng những người đó.

### G6. Người xin ngừng nhận

Học viên hoặc tutor nhắn Zalo xin ngừng nhận: tab USERS, dòng của người đó, ô `marketing_opt_out` ghi `TRUE`. Có hiệu lực từ lần gửi kế tiếp. Email hệ thống (xác nhận, huỷ, nhắc buổi, link đăng nhập) vẫn gửi bình thường. Xoá chữ `TRUE` để nhận lại.

### G7. Nên và không nên

* Nên gửi thử tới chính tài khoản admin trước mỗi chiến dịch; nên gửi trong giờ hành chính.
* Không gửi quá dày (mỗi người nhiều email marketing một tuần dễ bị đánh dấu Spam, kéo theo cả email hệ thống vào Spam).
* Không dùng tab EMAIL_TEMPLATES cho email marketing; tab đó chỉ cho email hệ thống tự gửi.
* Không gửi chiến dịch lớn trên STAGING khi USERS có địa chỉ thật.


## Phần H. Việc hằng ngày, hằng tuần, hằng tháng

| Khi nào | Việc |
|---|---|
| Mỗi ngày | Trang quản trị: bấm ô Khẩn, Cần xử lý, Chờ tutor xác nhận. Duyệt đăng ký ở REGISTRATIONS (cột `admin_action`). Quyết yêu cầu huỷ của tutor ở AVAILABILITY (cột `admin_decision`). Chọn lỗi cho buổi kỹ thuật (dòng đỏ ở BOOKINGS) |
| Mỗi ngày, 21:00 | Đọc email tổng hợp cuối ngày |
| Thứ Sáu 15:00 | Hệ thống tự nhắc tutor chưa mở giờ tuần sau (`TUTOR_REMIND_AT`). Không cần làm gì |
| Thứ Bảy sau 22:00 | Thông báo `TUTOR_NO_AVAILABILITY` liệt kê tutor chưa mở giờ nào: nhắn Zalo tutor đó |
| Mỗi tuần | Đọc dòng `MAIL_FAILED` trong thông báo; admin.google.com → Báo cáo → Tìm kiếm nhật ký email: xem thư Bounced (L3) |
| Cuối tháng | Menu **Báo cáo → Báo cáo tháng trước**: tab REPORT_MONTH có số buổi, lương từng tutor, doanh thu, số email. Xử lý hết buổi Không hoàn thành trước khi trả lương |
| Mỗi tháng | Menu **Lưu trữ → Lưu trữ: xem tình trạng**: không có lô dở, không có lỗi |
| Trước mỗi lần cập nhật code | `HUONG_DAN_PHAT_HANH.md` mục 2: Lưu → menu 1 → menu 3 (khi bản mới yêu cầu) → menu 2 → Triển khai phiên bản mới |

## Phần I. Trang quản trị trên web: ô số liệu, thông báo, nhật ký

Mở link trang web, đăng nhập bằng email admin. Lần đầu đăng nhập (bằng link hoặc bằng Google) được hỏi ngôn ngữ; đổi lại bằng nút **VI | EN**.

### I1. Sáu ô số liệu (đều bấm được)

| Ô | Bấm vào |
|---|---|
| Khẩn chưa đọc | Danh sách thông báo lọc sẵn: Chưa đọc, mức Khẩn |
| Cần xử lý | Danh sách thông báo lọc sẵn: Chưa đọc, mức Cần xử lý |
| Đăng ký chờ duyệt ↗ | Mở tab REGISTRATIONS trong Sheets (duyệt ở cột `admin_action`) |
| Tutor xin huỷ ↗ | Mở tab AVAILABILITY trong Sheets (quyết định ở cột `admin_decision`) |
| Buổi hôm nay | Danh sách buổi hôm nay theo giờ, mỗi buổi có nút Chi tiết, buổi chưa bắt đầu có nút Huỷ |
| Chờ tutor xác nhận | Buổi đã diễn ra mà tutor chưa chọn kết quả, mới nhất trước, cộng buổi Không hoàn thành trong 60 ngày gần nhất. Từ 8.1.1: quá `RESULT_NOTICE_AFTER_HOURS` (24) giờ thì nhãn đỏ "Quá hạn xác nhận" kèm giờ sẽ thành Không hoàn thành; quá `RESULT_EXPIRE_AFTER_HOURS` (48) giờ và đã báo đỏ đủ `RESULT_EXPIRE_AFTER_NOTICE_HOURS` (24) giờ thì thành **Không hoàn thành**, không tính lương. Không còn tự Hoàn thành |

Huỷ một buổi ngay trong danh sách: danh sách và số trên ô cập nhật lại ngay. Lỗi mạng khi mở danh sách: trang báo lỗi kèm nút **Quay lại**. Cả trang quản trị không tải được: trang báo lỗi theo ngôn ngữ đang chọn kèm nút **Thử lại**.

Dấu ↗ là mở tab Sheets ở thẻ mới; dấu › là mở ngay trên trang.

### I2. Thông báo

* Mỗi thông báo một dòng: chấm màu theo mức, nội dung, tên sự kiện, giờ; gom theo ngày "Hôm nay", "Hôm qua". Nút **Tải lại** lấy thông báo mới nhất và số mới trên các ô; bấm sang tab khác rồi quay lại tab Thông báo cũng tự lấy mới.
* Bấm một dòng: hộp chi tiết, thông báo thành đã đọc ngay. Các nút trong hộp: **Xem buổi học**, **Xem học viên**, **Xem tutor** (khi thông báo có mã tương ứng), **Mở đúng dòng trong Sheets**, **Đóng**. Đóng hộp: dòng đó rời danh sách Chưa đọc, số trên ô giảm ngay.
* **Đã đọc hết**: đánh dấu mọi thông báo chưa đọc, có hỏi lại kèm số lượng.
* Nội dung thông báo hiện theo ngôn ngữ đang chọn (thông báo trước bản 8.0.10 chỉ có tiếng Việt).

### I3. Nhật ký

* Ghi **mọi hoạt động**: đăng nhập, thoát, đặt, huỷ, mở và đóng giờ của tutor, báo kết quả buổi, đăng ký, duyệt, đặt thay, bấm **Đã đọc hết**, khoá và mở khoá tutor, thêm gói, chuyển hệ thống, email gửi lại bằng MailApp (`MAIL_FALLBACK`), mọi việc tự động của hệ thống (hàng đợi Calendar, nhắc, lưu trữ, sao lưu), mọi menu có thay đổi (menu 1, tạo trigger, cập nhật chữ, báo cáo, gửi thử email, email marketing, kiểm tra gửi email), **mọi lần sửa tay trong Sheets** (tab, ô, giá trị cũ và mới; dán hoặc xoá nhiều ô cùng lúc: ghi vùng ô và giá trị mới của tối đa 20 ô, vùng lớn hơn chỉ ghi vùng và số ô; Google không cho biết giá trị cũ thì ghi dấu `?`; riêng tab AUTH chỉ ghi ô nào bị sửa, không ghi giá trị), và **mọi lần đổi cấu trúc tab** (chèn hoặc xoá dòng, cột: ghi loại thay đổi và vùng đang chọn; thêm, xoá, đổi tên tab: ghi đúng tên tab bị thêm, xoá, tên cũ và tên mới). Xoá hoặc đổi tên một tab của hệ thống (BOOKINGS, USERS...) còn tạo thông báo **Khẩn** "Tab hệ thống bị xoá hoặc đổi tên" và email cho admin: khôi phục ngay bằng **Tệp → Nhật ký phiên bản** hoặc đổi lại đúng tên. Sửa tay ở chính các tab nhật ký (ACTIVITY_LOG, MAIL_LOG, METRICS) không ghi để tránh vòng lặp.
* Mỗi hoạt động một dòng xem trước: giờ, tên hành động, người làm (phần trước @ của email; "Hệ thống" khi tự chạy), tóm tắt tối đa khoảng 160 ký tự; gom theo ngày.
* Bấm một dòng: hộp đọc đủ (thời gian, người làm đầy đủ, mã hành động, đối tượng, toàn bộ chi tiết; dữ liệu dạng JSON được xếp dòng cho dễ đọc), nút **Xem buổi học** hoặc **Xem** người liên quan, **Mở đúng dòng trong Sheets**.
* Lọc **Tất cả / Người dùng / Hệ thống**, ô tìm (email, mã buổi, mã hành động, tên hành động đang hiện trên trang ở cả hai thứ tiếng kể cả "Gói chuyển sang ...", "Bảo trì: ...", "Hệ thống", "Admin (sửa trong Sheets)", chữ trong chi tiết). Mỗi lần hiện 150 dòng mới nhất, bấm **Xem thêm** để xem tiếp; dòng mới ghi trong lúc đang xem không làm trùng, mất hay lặp dòng. Nút **Tải lại** ở đầu nhật ký lấy dòng mới nhất và số mới trên các ô; bấm sang tab khác rồi quay lại cũng tự lấy mới.
* Chỉ hiện `LOG_KEEP_DAYS` ngày gần nhất (mặc định 60). Dòng cũ hơn được chuyển mỗi đêm (từ `ARCHIVE_HOUR`, 03:00) sang file lưu trữ theo năm, không xoá hẳn. Menu **Lưu trữ: chạy ngay** chuyển luôn. Muốn đọc dòng cũ: menu **Lưu trữ → Lưu trữ: mở file**, tab ACTIVITY_LOG.
* Không ghi: đổi ngôn ngữ, mở từng thông báo (bớt dòng thừa, từ 8.1.3).
* Nhật ký sửa tay ghi ngay sau mỗi lần sửa, không chặn việc gõ. Đúng lúc job đêm hoặc lưu trữ đang giữ khoá quá 10 giây thì dòng nhật ký vào hàng chờ, lần ghi kế tiếp hoặc job mỗi giờ ghi bù (giờ ghi vẫn là giờ sửa thật).

## Phần J. Luật thông báo cho admin (tab NOTIFY_RULES)

Mọi việc admin cần biết đều thành **một dòng ở tab NOTIFICATIONS** (cũng là danh sách Thông báo trên trang quản trị, Phần I2). Tab NOTIFY_RULES quyết định mỗi loại sự kiện có **mức** nào và gửi qua **kênh** nào. Đổi được không cần coder.

### J1. Mức và kênh

| Mức (`level`) | Trên trang quản trị | Dùng cho |
|---|---|---|
| `CRITICAL` | Khẩn (chấm đỏ, ô "Khẩn chưa đọc") | Hệ thống hỏng hoặc sắp hỏng, mất dữ liệu, học viên sắp không có link Meet |
| `WARNING` | Cần xử lý (ô "Cần xử lý") | Việc admin phải quyết hoặc làm tay |
| `INFO` | Thông tin | Để biết, không cần làm gì |

| Kênh (`channel`) | Làm gì |
|---|---|
| `EMAIL` | Ghi dòng NOTIFICATIONS **và** gửi email ngay tới `ADMIN_EMAIL` (chỉ địa chỉ này; tài khoản ADMIN khác trong USERS không nhận) |
| `DIGEST` | Ghi dòng, rồi gom vào **một** email tổng hợp mỗi ngày lúc `DIGEST_HOUR` (mặc định 21:00), xếp Khẩn trước. Không có gì thì không gửi. `DIGEST_HOUR = -1`: không gửi tổng hợp, chỉ xem trên web |
| `LOG` | Chỉ ghi dòng, không email. Xem trên trang quản trị |

Mọi kênh đều ghi dòng NOTIFICATIONS và hiện trên trang quản trị. Kênh chỉ quyết định có email hay không.

### J2. Tab NOTIFY_RULES

| Cột | Ai ghi | Nghĩa |
|---|---|---|
| `event` | Hệ thống | Mã sự kiện. **Không sửa, không xoá** |
| `level` | Admin chọn | `CRITICAL`, `WARNING`, `INFO` (ô có danh sách chọn) |
| `channel` | Admin chọn | `EMAIL`, `DIGEST`, `LOG` |
| `note` | Hệ thống ghi lần đầu, admin sửa tuỳ ý | Mô tả sự kiện. Code không đọc |

Luật dùng:

1. Đổi `level` hoặc `channel` của một dòng: có hiệu lực với **thông báo mới** trong tối đa vài phút (bộ đệm mỗi lượt chạy). Thông báo đã ghi giữ mức và kênh lúc ghi.
2. Ô gõ sai hoặc để trống: dùng mặc định của sự kiện đó (bảng J4), không báo lỗi. Gõ đúng chữ in hoa như bảng J1.
3. Xoá một dòng: dùng mặc định; menu 1 thêm lại dòng đó với giá trị mặc định.
4. Menu 1 **chỉ thêm sự kiện còn thiếu**, không ghi đè dòng đã có. Bản mới đổi mặc định của một sự kiện cũ thì dòng đang có giữ nguyên giá trị cũ; muốn theo mặc định mới: xoá dòng rồi chạy menu 1.
5. Muốn tắt hẳn email của một loại: đặt `LOG`. Không có cách tắt việc ghi dòng NOTIFICATIONS (để luôn tra cứu được).
6. Cùng một lỗi hệ thống (`SYSTEM_ERROR`) chỉ email tối đa 1 lần mỗi giờ.
7. Email thông báo gửi lỗi (hết hạn mức, địa chỉ hỏng): dòng NOTIFICATIONS vẫn có, cột `emailed_at` trống, và có thêm thông báo `MAIL_FAILED`.

### J3. Cột của tab NOTIFICATIONS

| Cột | Nghĩa |
|---|---|
| `notif_id`, `time` | Mã và giờ thông báo |
| `level`, `event`, `channel` | Mức, sự kiện, kênh lúc ghi |
| `actor` | Ai gây ra (email, hoặc `SYSTEM`) |
| `student_id`, `tutor_id`, `entity`, `entity_id` | Học viên, tutor, loại đối tượng (BOOKING, USER, STUDENT_PACKAGE...) và mã của nó. Một thông báo gom nhiều đối tượng thì mã cách nhau dấu phẩy |
| `message`, `message_en` | Nội dung tiếng Việt, tiếng Anh |
| `link` | Mở đúng tab, đúng dòng trong Sheets |
| `emailed_at` | Giờ đã gửi email (kênh EMAIL) |
| `digest_at` | Giờ đã vào email tổng hợp (kênh DIGEST) |
| `read` | Đã đọc trên trang quản trị |

Dòng cũ được chuyển sang file lưu trữ theo Phần B13; thông báo Khẩn và Cần xử lý chưa đọc không bị chuyển.

### J4. Danh sách sự kiện (mặc định bản 8.1.4, giống 8.1.1)

Cột "Tên trên web" là chữ hiện dưới mỗi thông báo trên trang quản trị (sửa ở CONTENT, key `ad.ev.<mã>`).

**Hệ thống và dữ liệu**

| Mã | Tên trên web | Mức | Kênh | Khi nào | Admin làm gì |
|---|---|---|---|---|---|
| `SYSTEM_ERROR` | Lỗi hệ thống | Khẩn | EMAIL | Một việc tự động hoặc API gặp lỗi không lường trước | Chụp nội dung email gửi coder; chạy menu 2 |
| `DATA_INVARIANT` | Dữ liệu sai luật | Khẩn | EMAIL | Đối soát mỗi giờ thấy hai học viên cùng một tutor cùng giờ, hoặc học viên quá số buổi mỗi ngày | Mở dòng theo link, huỷ hoặc đổi tutor một buổi |
| `SHEET_REMOVED` | Tab hệ thống bị xoá hoặc đổi tên | Khẩn | EMAIL | Ai đó xoá hoặc đổi tên tab BOOKINGS, USERS... | Ngay: đổi lại đúng tên hoặc **Tệp → Nhật ký phiên bản** |
| `PURGE_CHECK` | Cần kiểm dòng trùng | Khẩn | EMAIL | Lần dọn hoặc lưu trữ bị cắt giữa chừng, sau đó tab bị sửa tay | Kiểm cuối tab có dòng trùng, xoá dòng trùng |
| `ARCHIVE_FAILED` | Lưu trữ dừng | Khẩn | EMAIL | Lưu trữ đọc lại file lưu trữ thấy thiếu dòng nên dừng (chưa bỏ dòng nào khỏi file chính) | Menu **Lưu trữ: xem tình trạng**; báo coder nếu lặp lại |
| `MAIL_FAILED` | Email gửi lỗi | Cần xử lý | DIGEST | Một email không gửi được (hết hạn mức ngày, địa chỉ hỏng) | Sửa email người nhận trong USERS; hết hạn mức thì chờ hôm sau |
| `TECH_MIGRATED` | Chuyển buổi kỹ thuật cũ | Cần xử lý | EMAIL | Một lần khi lên 8.1.0: buổi kỹ thuật cũ "Tính lương" thành Lỗi khách quan | Xem từng buổi, chọn lại lỗi đúng ở `admin_action` |

**Calendar và link Meet**

| Mã | Tên trên web | Mức | Kênh | Khi nào | Admin làm gì |
|---|---|---|---|---|---|
| `CALENDAR_FAILED` | Lỗi sự kiện Calendar | Khẩn | EMAIL | Một buổi không tạo hoặc sửa được sự kiện sau `CALENDAR_MAX_ATTEMPTS` lần | Gửi link Meet tay cho học viên và tutor |
| `CALENDAR_BATCH_FAILED` | Cả lô Calendar lỗi | Khẩn | EMAIL | Cả lô tạo sự kiện lỗi ngay lần đầu (dịch vụ Google, lịch bị xoá, hạn mức) | Menu 2; menu **Calendar: tạo sự kiện đang chờ ngay** sau khi sửa |
| `CALENDAR_LATE` | Buổi sắp học chưa có Calendar | Cần xử lý | EMAIL | Buổi sắp diễn ra mà chưa có sự kiện (gộp một email mỗi lần đối soát) | Menu **Calendar: tạo sự kiện đang chờ ngay** |
| `CALENDAR_NIGHTLY` | Tổng kết Calendar đêm qua | Thông tin | LOG | Chế độ NIGHTLY chạy xong, không có vấn đề | Không |
| `CALENDAR_NIGHTLY_PROBLEM` | Calendar đêm qua còn lỗi | Cần xử lý | EMAIL | Lô đêm còn lỗi hoặc còn buổi sắp tới chưa có sự kiện | Như `CALENDAR_LATE` |

**Đăng ký, đặt, huỷ**

| Mã | Tên trên web | Mức | Kênh | Khi nào | Admin làm gì |
|---|---|---|---|---|---|
| `NEW_REGISTRATION` | Đăng ký mới | Cần xử lý | EMAIL | Có đăng ký hoặc gia hạn mới (email có chi tiết, ảnh chuyển khoản) | Duyệt ở REGISTRATIONS, cột `admin_action` |
| `BOOKED` | Đặt buổi | Thông tin | LOG | Học viên đặt buổi | Không |
| `STUDENT_CANCELLED` | Học viên huỷ | Cần xử lý | EMAIL | Học viên tự huỷ trên web (đúng hạn) | Thường không; để biết lịch tutor trống |
| `ADMIN_CANCELLED` | Admin huỷ buổi | Thông tin | LOG | Admin huỷ trên trang quản trị | Không |

**Tutor và lịch dạy**

| Mã | Tên trên web | Mức | Kênh | Khi nào | Admin làm gì |
|---|---|---|---|---|---|
| `TUTOR_CANCEL_REQUEST` | Tutor xin huỷ | Cần xử lý | EMAIL | Tutor bớt giờ sau hạn mở lịch hoặc giờ đã có học viên | Quyết ở AVAILABILITY cột `admin_decision`, trước giờ học ít nhất `TUTOR_CANCEL_DECIDE_BEFORE_HOURS` (3) giờ |
| `TUTOR_CANCEL_AUTO_REJECTED` | Tự từ chối yêu cầu huỷ | Thông tin | DIGEST | Admin không quyết kịp nên yêu cầu tự bị từ chối, tutor vẫn phải dạy | Nhắn tutor nếu cần |
| `REASSIGNED` | Đổi tutor | Thông tin | DIGEST | Buổi chuyển sang tutor khác | Không |
| `TUTOR_NO_AVAILABILITY` | Tutor chưa mở lịch | Cần xử lý | EMAIL | Sau hạn `TUTOR_DEADLINE_AT` (22:00 thứ Bảy) mà tutor chưa mở giờ nào cho tuần sau | Nhắn Zalo tutor đó |

**Kết quả buổi học**

| Mã | Tên trên web | Mức | Kênh | Khi nào | Admin làm gì |
|---|---|---|---|---|---|
| `RESULT_COMPLETED` | Buổi hoàn thành | Thông tin | DIGEST | Tutor chọn Hoàn thành | Không |
| `RESULT_STUDENT_ABSENT` | Học viên vắng | Cần xử lý | DIGEST | Tutor chọn Vắng học viên (vẫn trừ buổi, tutor có lương) | Hỏi học viên nếu vắng nhiều |
| `RESULT_TECH_ISSUE` | Báo lỗi kỹ thuật | Cần xử lý | EMAIL | Tutor chọn Vấn đề kỹ thuật | Chọn lỗi ở BOOKINGS cột `admin_action` (tutor, học viên, khách quan); chưa chọn sau `TECH_DECIDE_HOURS` (48) giờ thì tính là lỗi tutor |
| `RESULT_OVERDUE` | Tutor quá hạn chọn kết quả | Khẩn | **LOG** | Buổi quá 24 giờ sau giờ kết thúc mà tutor chưa chọn kết quả (một thông báo mỗi buổi; trang tutor và trang quản trị tô đỏ) | Nhắc tutor chọn; hoặc tự chọn ở `admin_action` ("Hoàn thành (admin chọn)", "Vắng học viên (admin chọn)", "Vấn đề kỹ thuật (admin chọn)", "Vắng tutor"). Muốn nhận email từng buổi: đổi kênh sang `EMAIL` |
| `RESULT_NOT_COMPLETED` | Buổi Không hoàn thành | Cần xử lý | DIGEST | Buổi quá 48 giờ và đã báo đỏ 24 giờ mà vẫn chưa có kết quả: thành Không hoàn thành, không lương (gom nhiều buổi một thông báo) | Làm rõ với tutor và học viên rồi chọn kết quả đúng ở `admin_action`. Chưa xử lý thì ngày bắt đầu gói của học viên chưa khoá |
| `AUTO_COMPLETED` | Tự chuyển Hoàn thành | Thông tin | DIGEST | Chỉ bản tới 8.1.0. Từ 8.1.1 không còn xảy ra; dòng giữ để đọc thông báo cũ | Không |

**Gói học và bù buổi**

| Mã | Tên trên web | Mức | Kênh | Khi nào | Admin làm gì |
|---|---|---|---|---|---|
| `COMP_EXTENDED` | Cộng ngày bù | Thông tin | DIGEST | Gói được cộng ngày vì buổi lỗi phía trường; học viên đã nhận email | Không |
| `COMP_ON_EXPIRED` | Bù cho gói đã hết hạn | Cần xử lý | EMAIL | Buổi được bù thuộc gói đã hết hạn quá `COMP_REOPEN_DAYS` (7) ngày, hoặc gói sau đã chạy | Cộng tay ở `comp_days_admin` của STUDENT_PACKAGES nếu đồng ý |
| `COMP_RETRACT_BLOCKED` | Chưa rút được ngày bù | Cần xử lý | EMAIL | Đổi lỗi sang học viên nhưng học viên đã đặt buổi trong những ngày bù | Huỷ các buổi đó, hoặc giữ ngày bằng `comp_days_admin` |
| `COMP_QUEUE_CONFLICT` | Gói nối đuôi lệch buổi | Cần xử lý | EMAIL | Gói nối đuôi dời ngày nhưng có buổi không chuyển sang gói trước được (gói trước hết lượt) | Xem buổi trong thông báo, huỷ hoặc cộng ngày |
| `TRIAL_LEFT_UNUSED` | Trial còn lượt mà hết ngày | Cần xử lý | EMAIL | Trial còn lượt nhưng không còn ngày đặt được (đã dùng lần cộng 3 ngày) | Cộng tay nếu muốn |
| `TRIAL_OVER_LIMIT` | Trial quá số lượt | Cần xử lý | EMAIL | Đổi lỗi buổi kỹ thuật sang học viên làm Trial dùng quá số lượt | Quyết giữ hay huỷ buổi thừa; hệ thống không tự huỷ |
| `BOOKING_OUT_OF_RANGE` | Buổi nằm ngoài hạn gói | Cần xử lý | EMAIL | Ngày bắt đầu khoá sớm hơn làm buổi đã đặt rơi ra ngoài hạn gói | Huỷ buổi hoặc cộng ngày ở `comp_days_admin` |
| `PACKAGE_EDIT_DENIED` | Sửa ô gói bị trả lại | Cần xử lý | DIGEST | Có người sửa ô hệ thống của STUDENT_PACKAGES; đã trả lại giá trị cũ | Hỏi người sửa; sửa hạn qua `end_date` hoặc `comp_days_admin` |
| `PACKAGE_HEALED` | Tự sửa ngày gói | Cần xử lý | EMAIL | Đối soát mỗi giờ thấy ngày gói lệch luật (dán đè, sắp xếp) và đã ghi lại đúng | Kiểm dòng; tìm ai đã dán đè |
| `PACKAGE_ROW_MISSING` | Mất dòng gói | Khẩn | EMAIL | Buổi học trỏ tới gói không còn trong STUDENT_PACKAGES | Khôi phục dòng từ bản sao lưu đêm |
| `PACKAGE_PASTE_UNSAFE` | Dán đè ô gói không tự lành | Khẩn | EMAIL | Ô mã gói, học viên, ngày mua... bị dán đè, hệ thống không tự sửa được | Chép lại từ bản sao lưu đêm |

### J5. Gợi ý chỉnh theo tình huống

| Muốn | Đổi |
|---|---|
| Nhận email ngay khi tutor quá hạn chọn kết quả | `RESULT_OVERDUE` kênh `EMAIL` (có thể nhiều email nếu nhiều buổi) hoặc `DIGEST` (một email lúc 21:00) |
| Biết ngay khi học viên vắng | `RESULT_STUDENT_ABSENT` kênh `EMAIL` |
| Bớt email học viên huỷ đúng hạn | `STUDENT_CANCELLED` kênh `DIGEST` |
| Không nhận email tổng hợp | `DIGEST_HOUR = -1` ở CONFIG; mọi thông báo DIGEST chỉ còn trên web |
| Thông báo Khẩn nhưng không email | Không nên. Nếu vẫn muốn: kênh `LOG`, và mỗi ngày mở ô "Khẩn chưa đọc" |

Sau khi đổi: không cần menu nào. Chạy menu 2 nếu đổi nhiều dòng.


## Phần K. Thao tác trên từng tab Sheets

Luật chung:

* **Không đổi tên tab, không đổi tiêu đề cột, không xoá cột.** Đổi tên hoặc xoá tab hệ thống: thông báo Khẩn `SHEET_REMOVED`, hệ thống lỗi tới khi đổi lại đúng tên.
* **Không xoá dòng** ở BOOKINGS, PAYMENTS, ACTIVITY_LOG. Muốn huỷ: đổi trạng thái qua dropdown. Dòng cũ tự sang file lưu trữ (B13).
* Sắp xếp, lọc tab được. Hệ thống ghi theo mã dòng nên sắp xếp không làm ghi nhầm dòng.
* Ô dropdown chỉ nhận giá trị trong danh sách. Chọn xong, góc phải dưới hiện thông báo nhỏ kết quả (ví dụ "Đã duyệt R00012, đã gửi email chào mừng"). Không làm được thì thông báo nhỏ ghi lý do; ở BOOKINGS cột `admin_note` ghi "Lỗi: ..." và ô `admin_action` được xoá trống để chọn lại.
* Mỗi lần sửa ô được ghi nhật ký (Phần I3). Sửa nhiều ô một lúc (dán): dropdown không chạy, chỉ ghi nhật ký. Chọn từng ô một.

### K1. CONFIG

Phần A, B. Sửa cột `value`. Không sửa cột `key`.

### K2. USERS (tài khoản)

| Cột | Sửa được | Ghi chú |
|---|---|---|
| `user_id` | Không | S0001 học viên, T001 tutor, A01 admin |
| `role` | Không | STUDENT, TUTOR, ADMIN |
| `email` | Có | Email đăng nhập. Sửa xong, lần xin link sau dùng email mới. Không để 2 dòng trùng email |
| `name` | Có | Tên hiện trên web, email, sự kiện |
| `phone` | Có | Không bắt buộc, gõ tự do (tối đa 40 ký tự). Số di động Việt Nam tự thành `+84...` và có link Zalo ở cột `contact_link`; số nước ngoài dạng `+mã nước` lưu chữ số; chữ khác (ví dụ `Line: abc`) lưu nguyên văn |
| `contact_link` | Không | Công thức tự sinh từ `phone` |
| `level` | Có | Trình độ |
| `status` | Có, cẩn thận | ACTIVE, SUSPENDED, DISABLED. **Tạm khoá học viên: dùng menu** (C2), không gõ tay, vì menu ghi mốc để cộng bù ngày. Gõ DISABLED: người đó bị thoát mọi thiết bị ngay. **Khoá tutor: dùng menu Khoá tutor** (đổi tutor các buổi sắp tới); gõ DISABLED tay cho tutor thì buổi sắp tới vẫn giữ tutor đó |
| `note` | Có | Ghi chú admin |
| `color_id` | Có | Màu sự kiện Calendar của tutor (số 1 đến 11 theo bảng màu Google Calendar) |
| `meet_room` | Có | Link phòng Meet cố định của tutor, dùng khi `MEET_MODE = TUTOR_ROOM` |
| `rate_vnd` | Có | Lương mỗi buổi của tutor (báo cáo tháng) |
| `created_at`, `last_login_at` | Không | Hệ thống ghi |
| `lang` | Có | `vi`, `en`, trống = hỏi lại khi đăng nhập |
| `marketing_opt_out` | Có | `TRUE` = không nhận email marketing |

Học viên mới không thêm tay ở USERS: học viên gửi form đăng ký, admin duyệt (K4). Tutor, admin: menu **Người dùng → Thêm tutor / Thêm admin**.

### K3. PACKAGES (gói đang bán)

| Cột | Ý nghĩa |
|---|---|
| `code` | Mã gói: 2 đến 20 ký tự in hoa, số, dấu `_`, không dấu, không khoảng trắng. **Không đổi mã của gói đã có người mua** |
| `name`, `name_en` | Tên tiếng Việt (bắt buộc), tiếng Anh (trống = dùng tên tiếng Việt) |
| `type` | `DAYS` (theo ngày, có thể giới hạn số buổi như Trial) hoặc `SESSIONS` (theo buổi) |
| `days` | Số ngày (gói `DAYS`, số nguyên lớn hơn 0) |
| `sessions` | Số buổi tối đa (Trial 2; gói `SESSIONS` bắt buộc; trống = không giới hạn) |
| `price_vnd` | Giá. **0 = gói chỉ đăng ký qua Zalo**: trang hiện thẻ Zalo thay cho form; menu 2 báo LƯU Ý |
| `active` | `TRUE` = đang bán (hiện trên form). `FALSE` = ngừng bán; học viên đã mua vẫn học bình thường |
| `note` | Ghi chú |

Thêm gói: menu **Gói học → Thêm gói** (kiểm lỗi trước khi ghi). Thêm tay cũng được, sau đó chạy menu 2. Dòng sai (mã trùng, thiếu tên, kiểu sai, khoảng trắng thừa ở mã) bị menu 2 báo LỖI, bị ẩn khỏi trang và không đăng ký được (`PACKAGE_BROKEN`) tới khi sửa. Trước khi mở bán: kiểm `price_vnd` của TRIAL, PASS_2W, PASS_1M khác 0.

### K4. REGISTRATIONS (đăng ký, gia hạn)

Mỗi lần học viên gửi form là một dòng, `admin_action = Chờ duyệt` (dòng vàng). `kind`: `NEW` (người mới) hoặc `RENEW` (học viên có tài khoản gia hạn).

1. Mở ảnh ở `screenshot_url`, đối chiếu tiền về tài khoản với giá gói và `transfer_code` (nội dung chuyển khoản).
2. Đúng: chọn `Duyệt`. Hệ thống tạo tài khoản (nếu mới), gói (gói mới nối đuôi gói đang chạy thì trạng thái `QUEUED`), dòng PAYMENTS, gửi email chào mừng kèm link đăng nhập.
3. Sai (thiếu tiền, ảnh không rõ, không thấy tiền): **ghi lý do ở cột `note` trước**, rồi chọn `Từ chối`. Học viên nhận email kèm lý do đó.
4. Đăng ký đã xử lý thì chọn lại không đổi gì: ô tự trả về kết quả thật (Duyệt hoặc Từ chối) và thông báo nhỏ ghi "đã ... trước đó, KHÔNG đổi được". Duyệt nhầm: xử lý ở L2.

Không sửa `email`, `package_code` sau khi đã duyệt. Trước khi duyệt mà email gõ sai: sửa ô `email` rồi mới duyệt.

### K5. STUDENT_PACKAGES (gói của từng học viên)

Hệ thống tính hầu hết các ô. **Ô hệ thống sửa tay bị trả lại** (thông báo "Không thể chỉnh sửa", sự kiện `PACKAGE_EDIT_DENIED`); dán đè thì job mỗi giờ tự sửa lại (`PACKAGE_HEALED`), ô không tự sửa được thì báo Khẩn `PACKAGE_PASTE_UNSAFE`.

| Cột | Sửa được | Ý nghĩa |
|---|---|---|
| `sp_id`, `student_id`, `package_code`, `purchased_at`, `reg_id` | Không | Mã, học viên, gói, ngày mua, đăng ký gốc |
| `status` | Không | `INACTIVE` (đã mua, chưa đặt buổi), `ACTIVE`, `QUEUED` (chờ gói trước hết), `EXPIRED` |
| `start_date`, `start_source` | Không | Ngày bắt đầu tính hạn, nguồn (buổi đầu, tự kích hoạt...) |
| `start_date_locked`, `start_locked_at`, `start_booking_id` | Không | Ngày bắt đầu đã khoá theo buổi đầu có kết quả cuối |
| `end_date` | Có, chỉ người trong `PKG_EDITORS` | Sửa hạn: phần chênh tự ghi vào `comp_days_admin`, học viên nhận email đổi hạn |
| `comp_days` | Không | Tổng ngày bù tự động từ buổi lỗi phía trường |
| `comp_days_admin` | Có, chỉ người trong `PKG_EDITORS` | Ngày admin cộng thêm, số nguyên (số âm để trừ). Dùng cho thông báo `COMP_ON_EXPIRED`, `TRIAL_LEFT_UNUSED`, ưu đãi |
| `sessions_total` | Không | Số buổi của gói |
| `suspended_days`, `suspend_started_at` | Không | Ngày tạm khoá (menu C2) |
| `expiry_notice_at` | Không | Lúc đã gửi email sắp hết hạn |

Hạn gói = ngày bắt đầu + số ngày + ngày tạm khoá + `comp_days` + `comp_days_admin` − 1.

### K6. BOOKINGS (buổi học)

Trạng thái (`status`): `CONFIRMED` Xác nhận, `PENDING_REASSIGN` Chờ xác nhận (đang tìm tutor thay), `COMPLETED` Hoàn thành, `STUDENT_ABSENT` Vắng học viên, `TECH_ISSUE` Vấn đề kỹ thuật, `TUTOR_ABSENT` Vắng tutor, `CANCELLED_STUDENT`, `CANCELLED_TUTOR`, `CANCELLED_ADMIN` Huỷ bởi học viên, tutor, admin, `CANCELLED_LATE` Huỷ muộn, `NOT_COMPLETED` Không hoàn thành.

**Cột `admin_action`** (chọn trên đúng dòng buổi):

| Lựa chọn | Dùng khi | Kết quả |
|---|---|---|
| Huỷ bởi admin | Buổi chưa diễn ra | Trước `CANCEL_CUTOFF_HOUR` hôm trước: `CANCELLED_ADMIN`, không trừ lượt, tính là lỗi phía trường (ngày bắt đầu gói đã khoá thì học viên được cộng ngày bù). Học viên tự đổi giờ trước hạn: để học viên tự huỷ trên web (không cộng bù). Từ mốc đó trở đi: `CANCELLED_LATE`, trừ lượt như học viên huỷ muộn, không bù. Học viên, tutor nhận email; sự kiện Calendar bị huỷ |
| Đổi tutor | Buổi chưa diễn ra, tutor bận | Ghi mã tutor muốn chọn (ví dụ `T002`) ở `admin_note` trước; ô không có mã tutor (trống hoặc chỉ có chữ cũ) thì hệ thống tự chọn tutor rảnh. Không còn ai: huỷ kiểu tutor huỷ, học viên không bị trừ, được bù |
| Vắng tutor | Giờ học đã qua, tutor không vào | `TUTOR_ABSENT`: tutor không lương, học viên không bị trừ, được bù ngày. Buổi đã có kết quả: chọn lại lần nữa trong 10 phút để xác nhận ghi đè |
| Không tính lương buổi kỹ thuật | Buổi `TECH_ISSUE`, lỗi do tutor | Tutor không lương, học viên không bị trừ, được bù |
| Tính lương buổi kỹ thuật | Buổi `TECH_ISSUE`, lỗi do học viên | Tutor có lương, học viên bị trừ lượt |
| Lỗi khách quan: tính lương và bù | Buổi `TECH_ISSUE`, không ai có lỗi (mất điện, Google lỗi) | Tutor có lương, học viên không bị trừ, được bù |
| Hoàn thành (admin chọn) | Tutor quên chọn, buổi đã học | `COMPLETED`, tutor có lương |
| Vắng học viên (admin chọn) | Tutor quên chọn, học viên không vào | `STUDENT_ABSENT`, tutor có lương, học viên bị trừ |
| Vấn đề kỹ thuật (admin chọn) | Tutor quên chọn, buổi lỗi kỹ thuật | `TECH_ISSUE`, rồi chọn tiếp 1 trong 3 dòng lỗi kỹ thuật ở trên |

3 lựa chọn "(admin chọn)" chỉ dùng cho buổi đã bắt đầu mà chưa có kết quả, hoặc buổi Không hoàn thành. Kết quả của mỗi lần chọn ghi ở `admin_note` ("Đã: ..." hoặc "Lỗi: ...").

Buổi `TECH_ISSUE` chưa chọn lỗi sau `TECH_DECIDE_HOURS` (48) giờ: hệ thống coi là lỗi tutor.

**Màu dòng:** đỏ = Vấn đề kỹ thuật chưa chọn lỗi, tutor quá hạn chọn kết quả (đã báo đỏ), Không hoàn thành; vàng = Vắng học viên, Chờ xác nhận (đang tìm tutor thay).

Cột hệ thống (không sửa): `meet_link`, `event_id`, `cal_state`, `cal_attempts`, `cal_next_at` (hàng đợi Calendar), `reminder_sent_at`, `day_reminder_at`, `request_id`, `tech_fault`, `tech_decided_at`, `comp_days`, `comp_gap`, `result_notice_at`, `result_at`, `result_by`.

### K7. AVAILABILITY (giờ rảnh của tutor)

Tutor mở và đóng giờ trên trang tutor. Trạng thái: `OPEN`, `CANCEL_PENDING` (tutor xin huỷ, dòng đỏ), `CANCELLED`, `BLOCKED` (đã duyệt cho tutor huỷ giờ có học viên, dòng xám, không ai đặt được).

Tutor xin huỷ (sau hạn mở lịch, hoặc giờ đã có học viên): chọn ở cột `admin_decision`:

| Lựa chọn | Kết quả |
|---|---|
| Duyệt, tự chọn tutor thay | Buổi của giờ đó chuyển sang tutor khác đang rảnh; không ai rảnh thì huỷ kiểu tutor huỷ, học viên được bù |
| Duyệt, chỉ định tutor thay | Ghi mã tutor (ví dụ `T002`) ở `admin_note` trước, rồi chọn |
| Duyệt, huỷ buổi | Huỷ buổi kiểu tutor huỷ, học viên không bị trừ, được bù |
| Từ chối | Giờ giữ nguyên, tutor vẫn phải dạy |

Không quyết trước giờ học `TUTOR_CANCEL_DECIDE_BEFORE_HOURS` (3) giờ: tự Từ chối, thông báo `TUTOR_CANCEL_AUTO_REJECTED`.

### K8. PAYMENTS

Hệ thống ghi khi duyệt đăng ký: số tiền theo bảng giá lúc duyệt. Không sửa, không xoá, không bao giờ bị lưu trữ. Hệ thống không có thao tác hoàn tiền: hoàn tiền làm ngoài hệ thống, ghi lại ở cột `note` của dòng học viên trong USERS; báo cáo doanh thu tháng không tự trừ khoản hoàn.

### K9. NOTIFICATIONS, NOTIFY_RULES

Phần I2, J. Tick cột `read` = đã đọc. Màu: đỏ Khẩn chưa đọc, vàng Cần xử lý chưa đọc, xanh đã đọc.

### K10. Tab chỉ đọc

| Tab | Nội dung | Ghi chú |
|---|---|---|
| ACTIVITY_LOG | Nhật ký mọi hoạt động | Không sửa, không xoá. Xem trên trang quản trị dễ hơn |
| MAIL_LOG | Mọi email đã gửi: giờ, người nhận, tiêu đề, loại, đường gửi (`transport`: GMAILAPP hoặc MAILAPP; trống = địa chỉ thử tải không gửi thật). Có dòng ở đây = Google đã nhận thư, chưa chắc thư đã tới | Không xoá dòng `kind` bắt đầu `MKT:` (sổ chống gửi trùng marketing) |
| AUTH | Link và phiên đăng nhập (mã băm) | **Không sửa, không xoá dòng**. Muốn cho ai thoát: trang quản trị, trang một người, **Thoát mọi thiết bị** |
| METRICS | Số đo tốc độ mỗi giờ | |
| META | Phiên bản, mốc mã tự sinh, bước chuyển dữ liệu đã chạy, giờ chuẩn bị chuyển | Code ghi ở menu 1 và Chuyển hệ thống Bước 1 |
| REPORT_MONTH | Báo cáo tháng | Menu Báo cáo ghi đè mỗi lần chạy |
| CONTENT, EMAIL_TEMPLATES, MARKETING_EMAILS | Chữ web, mẫu email, email marketing | Phần D, F, G |

## Phần L. Xử lý tình huống

Đọc theo cột "Làm". Mỗi thao tác đều được ghi nhật ký. Chưa chắc: bật **Bảo trì: chỉ xem**, chụp màn hình, gửi coder kèm giờ xảy ra và các dòng NOTIFICATIONS, ACTIVITY_LOG gần đó.

### L1. Học viên

| Tình huống | Làm |
|---|---|
| Người mới muốn học | Gửi link trang chủ (menu **Xem link trang web**). Học viên chọn gói, chuyển khoản, gửi form kèm ảnh. Admin duyệt ở REGISTRATIONS (K4) |
| Học viên không thấy gói muốn mua | PACKAGES: `active` phải TRUE, `price_vnd` khác 0, dòng không có lỗi (menu 2). Gói giá 0 chỉ có nút Zalo |
| Học viên muốn mua gói qua Zalo (gói giá 0, ưu đãi riêng) | Học viên vẫn cần tài khoản: nhờ học viên gửi form một gói đang bán, hoặc admin thêm gói riêng có giá thật (menu **Thêm gói**, `active` TRUE), học viên đăng ký, admin duyệt, rồi đặt `active` FALSE |
| Gia hạn | Học viên mở cổng học viên, tab **Tài khoản**, phần gia hạn. Admin duyệt dòng `kind = RENEW`. Gói mới nối đuôi (`QUEUED`), tự chạy khi gói cũ hết |
| Học viên báo không nhận được link đăng nhập | L3. Gửi hộ: chọn dòng ở USERS → menu **Người dùng → Gửi link đăng nhập** (không bị giới hạn 1 lần mỗi giờ) |
| Học viên bấm "Gửi link" báo "link đã được gửi lúc ..." | Đúng luật `LOGIN_LINK_COOLDOWN_MINUTES` (60 phút). Bảo học viên tìm thư cũ (cả Thư rác), hoặc admin gửi hộ bằng menu |
| Link báo hết hạn | Link học viên, tutor sống 15 phút. Xin link mới, hoặc admin gửi hộ |
| Học viên đổi email | USERS: sửa ô `email`. Gửi link đăng nhập bằng menu để kiểm |
| Học viên đổi số điện thoại, tên | Học viên tự sửa trên cổng học viên, tab **Tài khoản** (tên, số điện thoại, trình độ), hoặc admin sửa ô ở USERS |
| Học viên muốn tạm dừng (ốm, đi xa) | Chọn dòng ở USERS → **Tạm khoá học viên**. Gói theo ngày ngừng tính ngày. **Buổi đã đặt không tự huỷ**: huỷ từng buổi (L4). Quay lại: **Mở khoá học viên**, hạn tự cộng số ngày đã khoá |
| Học viên vi phạm, nợ phí | **Tạm khoá học viên**. Dừng hẳn: USERS `status = DISABLED` (thoát mọi thiết bị ngay); huỷ các buổi sắp tới |
| Học viên xin ngừng nhận email marketing | USERS `marketing_opt_out = TRUE`. Email hệ thống vẫn gửi |
| Học viên muốn tiếng Anh | Học viên bấm **VI \| EN**, hoặc admin sửa USERS `lang = en` |
| Học viên báo không đặt được giờ | Trang báo lý do. Thường gặp: quá hạn đặt (15:00 hôm trước), đã có 1 buổi ngày đó, gói hết hạn, hết lượt Trial, gói chưa duyệt, đang bảo trì, tài khoản bị khoá. Cần đặt gấp: admin **Đặt thay** trên trang quản trị (bỏ qua hạn đặt; vẫn giữ 1 buổi mỗi ngày, hạn và số buổi của gói, trùng giờ tutor) |
| Học viên muốn được thêm ngày (ưu đãi, đền bù) | STUDENT_PACKAGES `comp_days_admin` cộng số ngày (người trong `PKG_EDITORS`). Học viên nhận email đổi hạn |
| Hoàn tiền | Làm ngoài hệ thống; ghi ở `note` của USERS. Báo cáo doanh thu không tự trừ |

### L2. Đăng ký, gói

| Tình huống | Làm |
|---|---|
| Ảnh chuyển khoản sai, thiếu tiền | Ghi lý do ở `note` của dòng REGISTRATIONS, rồi chọn `Từ chối`. Học viên nhận email kèm lý do, gửi lại form |
| Duyệt nhầm (chưa nhận tiền) | Chọn `Từ chối` không huỷ được (ô tự trả về Duyệt). Tạm khoá học viên ngay, huỷ buổi đã đặt, báo coder để sửa dòng gói và khoản thu. Không xoá dòng PAYMENTS, STUDENT_PACKAGES |
| Học viên gửi 2 form giống nhau | Duyệt một dòng, `Từ chối` dòng kia với `note` "Gửi trùng" |
| Email trong form gõ sai | Trước khi duyệt: sửa ô `email` của REGISTRATIONS rồi duyệt. Đã duyệt: sửa ô `email` ở USERS, gửi link đăng nhập bằng menu |
| Trial: học viên đã dùng Trial muốn mua lại | Form báo không mua được (`TRIAL_ONCE_PER_EMAIL`). Gợi ý gói khác |
| Đổi giá gói | PACKAGES `price_vnd`. Áp cho đăng ký mới; khoản thu đã ghi giữ giá cũ |
| Ngừng bán một gói | PACKAGES `active = FALSE`. Học viên đang dùng không ảnh hưởng |
| Menu 2 báo LỖI gói (mã trùng, khoảng trắng, thiếu số ngày) | Sửa dòng PACKAGES theo câu báo, chạy lại menu 2. Tới khi sửa xong, gói đó bị ẩn và không đăng ký được |
| Hạn gói sai | Người trong `PKG_EDITORS` sửa `end_date` (hoặc `comp_days_admin`). Ô khác bị trả lại |
| Thông báo `COMP_ON_EXPIRED`, `TRIAL_LEFT_UNUSED`, `BOOKING_OUT_OF_RANGE`, `COMP_RETRACT_BLOCKED`, `COMP_QUEUE_CONFLICT`, `TRIAL_OVER_LIMIT` | Phần J4, cột "Admin làm gì" |
| `PACKAGE_EDIT_DENIED`, `PACKAGE_HEALED`, `PACKAGE_PASTE_UNSAFE`, `PACKAGE_ROW_MISSING` | Ai đó sửa hoặc dán đè STUDENT_PACKAGES. Kiểm dòng; ô không tự sửa được: chép lại từ bản sao đêm (thư mục Backup) |

### L3. Email

| Tình huống | Làm |
|---|---|
| Ai đó không nhận được email | 1. Menu **Email → Kiểm tra gửi email**, nhập đúng địa chỉ đó. 2. Tìm mã `MT...` ở hộp thư người nhận, cả Thư rác, Quảng cáo, Tất cả thư. 3. admin.google.com → Báo cáo → Tìm kiếm nhật ký email: Delivered (đã giao, tìm trong Thư rác), Bounced (bị trả lại, đọc lý do), Dropped. 4. Địa chỉ sai: sửa ở USERS |
| Hộp thoại kiểm tra báo "Google TỪ CHỐI thư" | Xem ACTIVITY_LOG dòng `MAIL_FAILED` (lý do). Thường là hết hạn mức ngày hoặc địa chỉ sai |
| Hộp thoại báo đường gửi MAILAPP mà ô `MAIL_TRANSPORT` là GMAILAPP | GmailApp thiếu quyền, thư đã tự gửi lại bằng MailApp (dễ bị trả về). Mở `appsscript.json` trong trình soạn: phải có dòng `"https://www.googleapis.com/auth/gmail.send",`. Lưu, chạy lại menu Kiểm tra gửi email, bấm cho phép khi Google hỏi. Vẫn báo thiếu quyền và lỗi nhắc `https://mail.google.com/`: thêm dòng `"https://mail.google.com/",` vào `oauthScopes`, Lưu, chạy lại |
| Thông báo "GmailApp thiếu quyền" (`MAIL_FAILED`, ACTIVITY_LOG `MAIL_FALLBACK`) | Như dòng trên. Hệ thống báo tối đa 1 lần mỗi giờ |
| MAIL_LOG cột `transport` | GMAILAPP là bình thường. MAILAPP: đang dự phòng hoặc thiếu quyền (dòng trên). Trống: địa chỉ thử tải, không gửi thật |
| Hết hạn mức email trong ngày | Email nhắc buổi, sắp hết hạn tự bỏ trước; email quan trọng gửi tới khi hết hẳn. Chờ hôm sau. Menu 2 cho biết hạn mức ước tính. Tài khoản Workspace dùng thử bị giới hạn khoảng 100 người nhận mỗi ngày; chỉ tăng khi đã trả phí đủ điều kiện của Google |
| Email bị vào Thư rác | Kiểm DKIM, SPF, DMARC (`HUONG_DAN_TRIEN_KHAI_WORKSPACE.md` mục 8). Bảo người nhận bấm "Không phải thư rác". Bớt email marketing |
| Muốn đổi chữ của một email | Tab EMAIL_TEMPLATES (Phần F), rồi **Gửi thử một mẫu email cho tôi** |
| Muốn tắt một loại email | EMAIL_TEMPLATES `active = FALSE` |
| GmailApp hỏng hẳn (Google đổi luật) | Tạm thời: CONFIG `MAIL_TRANSPORT = MAILAPP` (thư tới Gmail cá nhân vẫn đi; thư tới tên miền của trường dễ bị trả về). Báo coder |

### L4. Buổi học

| Tình huống | Làm |
|---|---|
| Học viên muốn huỷ sau hạn (sau 15:00 hôm trước) | Trang quản trị: ô Buổi hôm nay hoặc trang của học viên → buổi đó → **Huỷ**, hoặc BOOKINGS `admin_action = Huỷ bởi admin`. Từ mốc 15:00 hôm trước: thành Huỷ muộn, trừ lượt, không bù. Muốn bù (lý do chính đáng): huỷ rồi cộng `comp_days_admin`; cách này chỉ cộng ngày, **không trả lại lượt Trial** |
| Học viên muốn đổi giờ | Trước hạn: học viên tự huỷ trên web rồi đặt lại. Admin huỷ hộ trước hạn thì tính là lỗi phía trường (có thể cộng ngày bù): chỉ làm khi đúng là lỗi phía trường. Sau hạn: dòng dưới |
| Tutor ốm, báo trước | Buổi chưa diễn ra: BOOKINGS `admin_action = Đổi tutor` (ghi mã tutor thay ở `admin_note`, hoặc để trống cho hệ thống tự chọn). Không ai rảnh: hệ thống huỷ kiểu tutor huỷ, học viên không bị trừ, được bù. **Không chọn "Huỷ bởi admin"** cho lỗi phía trường (học viên bị trừ nếu đã qua 15:00 hôm trước) |
| Tutor xin huỷ trên trang | Dòng đỏ ở AVAILABILITY, chọn `admin_decision` (K7) trước giờ học 3 giờ |
| Tutor không vào lớp | Sau giờ học: `admin_action = Vắng tutor`. Tutor không lương, học viên được bù |
| Học viên không vào lớp | Tutor chọn Vắng học viên trên trang. Tutor quên: admin chọn `Vắng học viên (admin chọn)` |
| Lỗi kỹ thuật (mất mạng, Meet lỗi) | Tutor chọn Vấn đề kỹ thuật. Admin hỏi hai bên rồi chọn 1 trong 3 lỗi ở `admin_action` (K6) trong 48 giờ |
| Tutor quên chọn kết quả | Dòng đỏ sau 24 giờ, thông báo Khẩn. Nhắc tutor, hoặc admin chọn ở `admin_action`. Sau 48 giờ: Không hoàn thành, không lương |
| Buổi Không hoàn thành | Hỏi tutor và học viên, chọn kết quả đúng ở `admin_action`. Chưa xử lý thì ngày bắt đầu gói của học viên chưa khoá và báo cáo lương không tính buổi đó |
| Chọn nhầm kết quả | Chọn lại lựa chọn đúng ở `admin_action`. Ghi đè kết quả đã có bằng "Vắng tutor": chọn 2 lần trong 10 phút |
| Hai học viên cùng một tutor cùng giờ (`DATA_INVARIANT`) | Mở dòng theo link trong thông báo, Đổi tutor hoặc huỷ một buổi |
| Admin đặt thay cho học viên | Trang quản trị → tab **Học viên** → chọn học viên → **Đặt thay** |

### L5. Tutor

| Tình huống | Làm |
|---|---|
| Thêm tutor mới | Menu **Người dùng → Thêm tutor**, rồi **Gửi link đăng nhập**. Điền `rate_vnd`, `color_id` ở USERS |
| Tutor chưa mở lịch tuần sau | Thứ Sáu 15:00 hệ thống tự nhắc. Thứ Bảy 22:00: thông báo `TUTOR_NO_AVAILABILITY`, nhắn Zalo tutor |
| Tutor nghỉ hẳn | Trước khi khoá: nhắc tutor chọn kết quả các buổi đã dạy. Chọn dòng tutor ở USERS → menu **Người dùng → Khoá tutor**. Đọc bản xem trước, đồng ý 2 lần. Buổi sắp tới đổi tutor hoặc huỷ và bù; học viên nhận email. Buổi đã qua chưa có kết quả: admin chọn ở `admin_action` của BOOKINGS (tutor bị khoá không đăng nhập được) |
| Tutor quay lại | **Mở khoá tutor**, gửi link đăng nhập; tutor mở lại giờ rảnh |
| Tutor báo không vào được trang | Gửi link đăng nhập bằng menu. Link tutor sống 15 phút |
| Tính lương | Menu **Báo cáo → Báo cáo tháng trước**. Trước đó xử lý hết buổi Không hoàn thành và buổi kỹ thuật chưa chọn lỗi |

### L6. Đăng nhập, bảo mật

| Tình huống | Làm |
|---|---|
| Admin đăng nhập | Bằng Google (Phần M). Dự phòng: link email 24 giờ khi `ADMIN_LINK_LOGIN = TRUE` |
| Nghi lộ link, mất điện thoại | Trang quản trị → trang một người → **Thoát mọi thiết bị** (huỷ cả link còn hạn). Hoặc USERS `status = DISABLED` |
| Email "Có đăng nhập mới" lạ | Như dòng trên cho tài khoản admin; đổi mật khẩu Google |
| Nút đăng nhập Google báo "Không đọc được email Google" | Trình duyệt nhiều tài khoản Google: mở cửa sổ ẩn danh, chỉ đăng nhập admin@ |
| Nút Google báo không được phép | Email Google phải trùng email của dòng ADMIN ở USERS, `status = ACTIVE`, vai trò nằm trong `GOOGLE_LOGIN_ROLES` |
| Nút Google báo "hết hạn" | Bấm **Tiếp tục** trong 2 phút. Bấm lại nút Google |
| Đăng nhập Google hỏng mà `ADMIN_LINK_LOGIN = FALSE` | Mở file Sheets (vẫn mở được bằng tài khoản Google), CONFIG `ADMIN_LINK_LOGIN = TRUE`, chờ 1 phút, xin link trên trang đăng nhập bằng email admin. Menu Gửi link đăng nhập không gửi cho dòng ADMIN |

### L7. Calendar, Meet

| Tình huống | Làm |
|---|---|
| Học viên chưa có link Meet | Sự kiện tạo trong khoảng 5 phút sau khi đặt (trừ giờ yên tĩnh 22:00 đến 07:00). Gấp: menu **Công cụ kỹ thuật → Calendar: tạo sự kiện đang chờ ngay** |
| Thông báo `CALENDAR_FAILED`, `CALENDAR_BATCH_FAILED` | Menu 2. Gửi link Meet tay cho học viên và tutor. Sửa xong: menu Calendar tạo ngay |
| Học viên bị bắt chờ duyệt vào Meet | Tutor bấm cho vào. Lặp lại nhiều: CONFIG `MEET_MODE = TUTOR_ROOM` và điền `meet_room` cho tutor |

### L8. Dữ liệu, hệ thống

| Tình huống | Làm |
|---|---|
| Lỡ xoá hoặc đổi tên tab | Đổi lại đúng tên, hoặc **Tệp → Nhật ký phiên bản** khôi phục |
| Lỡ sửa sai nhiều ô | **Tệp → Nhật ký phiên bản**, hoặc mở bản sao đêm trong thư mục Backup, chép lại dòng đúng |
| Thông báo `SYSTEM_ERROR` | Chụp email gửi coder; chạy menu 2 |
| Menu 2 báo thiếu trigger | Menu 3 (chủ file) |
| Menu 2 báo còn file MailFix.gs | Trình soạn Apps Script: file `MailFix.gs` → ba chấm → **Xoá** |
| Menu 2 báo (LƯU Ý) tài khoản đang chạy khác `ADMIN_EMAIL` | Menu 3 và Triển khai phải làm bằng tài khoản chủ hệ thống |
| Trang web báo bảo trì | CONFIG `MAINTENANCE_MODE`; menu **Bảo trì: tắt** |
| Thông báo `ARCHIVE_FAILED`, `PURGE_CHECK` | Phần J4. Menu **Lưu trữ: xem tình trạng** |
| Trang chậm | Menu **Đo tốc độ**. BOOKINGS quá 15.000 dòng: kiểm lưu trữ đang bật |
| Cần dòng cũ (tranh chấp) | Menu **Lưu trữ → mở file**, tab cùng tên |
| Cập nhật phiên bản code | `HUONG_DAN_PHAT_HANH.md` |

## Phần M. Đăng nhập Google cho admin

Admin đăng nhập bằng tài khoản Google, không cần link email. Cần một dự án Apps Script **phụ** tên "thaiput Google login": nó hỏi Google ai đang đăng nhập trình duyệt, ký kết quả bằng khoá bí mật chung, rồi chuyển sang trang chính. Dự án phụ không đọc, không ghi Sheets, không gửi email. Làm 1 lần, khoảng 15 phút, bằng tài khoản chủ hệ thống (admin@).

### M1. Cài lần đầu

1. Trang web chính đã Triển khai, ô CONFIG `WEBAPP_URL` có link `/exec` đúng.
2. Vào script.google.com bằng admin@ → **Dự án mới**. Bấm tên "Dự án không có tiêu đề", đổi thành `thaiput Google login`.
3. File `Mã.gs` (hoặc `Code.gs`): chọn hết, xoá, dán toàn bộ file `GoogleLogin.gs` coder gửi. **Lưu**.
4. Bánh răng **Cài đặt dự án** → tick **Hiện tệp kê khai "appsscript.json" trong trình soạn thảo**. Quay lại trình soạn, mở `appsscript.json`, chọn hết, dán file `appsscript.json` của dự án phụ (file nhỏ, có `USER_ACCESSING`). **Lưu**. Không dán nhầm `appsscript.json` của dự án chính.
5. File Sheets của hệ thống: menu **thaiput → Công cụ kỹ thuật → Đăng nhập Google: tạo khoá bí mật (chủ file)**. Hộp thoại hiện 2 dòng `GOOGLE_LOGIN_SECRET = ...` và `MAIN_URL = ...`. Chép lại (không gửi qua email, Zalo). Đã có khoá thì hệ thống hỏi trước khi tạo khoá mới (khoá mới làm khoá cũ hết hiệu lực).
6. Dự án phụ: **Cài đặt dự án** → kéo xuống **Thuộc tính tập lệnh** → **Thêm thuộc tính tập lệnh** 2 lần:
   * Thuộc tính `GOOGLE_LOGIN_SECRET`, giá trị là chuỗi dài ở bước 5;
   * Thuộc tính `MAIN_URL`, giá trị là link `/exec` của trang chính.
   **Lưu thuộc tính tập lệnh**.
7. Dự án phụ: **Triển khai → Triển khai mới** → bánh răng **Chọn loại** → **Ứng dụng web**:
   * Mô tả: `Google login 1`;
   * Thực thi với tư cách: **Người dùng truy cập ứng dụng web**;
   * Ai có quyền truy cập: **Bất kỳ ai có Tài khoản Google**.
   Bấm **Triển khai**, cấp quyền khi Google hỏi. Chép **URL ứng dụng web** (kết thúc `/exec`).
8. File Sheets, tab CONFIG: `GOOGLE_LOGIN_URL` = link ở bước 7; `GOOGLE_LOGIN_ROLES` = `ADMIN`. Chờ 1 phút.
9. Menu 2: dòng "Đăng nhập Google cho admin đã cài".
10. Thử: mở trang đăng nhập (link `/exec?page=login` hoặc nút Đăng nhập) → bấm **Admin: đăng nhập bằng tài khoản Google**. Thẻ mới mở trang dự án phụ. Lần đầu Google hỏi cấp quyền xem địa chỉ email: chọn đúng admin@, bấm **Cho phép** (Google có thể hiện "Google chưa xác minh ứng dụng này": bấm **Nâng cao** → **Đi tới thaiput Google login**, vì đây là dự án của chính tổ chức). Trang hiện email đang đăng nhập và nút **Tiếp tục**: bấm trong 2 phút. Trang quản trị mở trong thẻ đó.
11. Lưu dấu trang của thẻ trang quản trị (link `/exec`). Đăng nhập Google mở trang quản trị ở link `/exec`, không ở trong Google Sites: trình duyệt giữ phiên riêng cho trang nhúng trong Sites.
12. Sau 1 tuần chạy ổn: CONFIG `ADMIN_LINK_LOGIN = FALSE` (tắt link email cho admin). Muốn để dự phòng: giữ TRUE và đặt `ADMIN_LINK_MAX_USES = 1`.

### M2. Khi nào phải làm lại

| Việc | Làm lại bước |
|---|---|
| Tạo khoá bí mật mới | 5, 6 (dán khoá mới vào dự án phụ) |
| Link `/exec` của trang chính đổi (tạo bản triển khai mới thay vì sửa bản cũ, chuyển hệ thống) | Sửa `MAIN_URL` ở bước 6 |
| Coder gửi `GoogleLogin.gs` hoặc `appsscript.json` dự án phụ mới | 3, 4, rồi **Triển khai → Quản lý các lần triển khai** → bút chì → **Phiên bản mới** → **Triển khai**; mở link dự án phụ 1 lần để cấp quyền lại |
| Cho tutor đăng nhập bằng Google | `GOOGLE_LOGIN_ROLES = ADMIN,TUTOR` |

### M3. An toàn

* Khoá bí mật chỉ nằm trong Script Properties của 2 dự án, không nằm trong Sheets. Người ngoài không mở được dự án nên không đọc được khoá.
* Mỗi lần Tiếp tục chỉ dùng được 1 lần, hạn 2 phút. Chữ ký sai không ghi Sheets, không chặn admin thật.
* Email Google phải trùng một dòng USERS vai trò ADMIN, `status = ACTIVE`. Không trùng: từ chối, ghi nhật ký `GOOGLE_LOGIN_DENIED`.
* Đăng nhập bằng Google cũng gửi email "Có đăng nhập mới" cho admin.
