# Thaiput v7 · 40 kịch bản test

*Cập nhật: 05/10/2026 · Áp dụng cho: plan code v7 (file 02) · Luật đối chiếu: file 01*

## Cách dùng file này

1. **Claude chạy tự động cả 40 kịch bản** trên bản giả lập (`node test/harness.js`), mỗi kịch bản khởi động lại từ dữ liệu mẫu bên dưới, đặt giờ giả lập đúng cột "Thời điểm", rồi so kết quả với cột "Mong đợi". Một lần chạy mất vài giây; cả vòng viết code, chạy, sửa nằm gọn trong một phiên 5 giờ.
2. Kết quả ghi ra `test/REPORT.md`: mỗi kịch bản Đạt hoặc Không đạt, kèm lý do.
3. Anh chỉ cần đọc REPORT.md. Kịch bản nào Không đạt mà Claude đề nghị **sửa kết quả mong đợi** thay vì sửa code, anh phải xem kỹ: đó là dấu hiệu luật bị hiểu sai.
4. Booking, lịch rảnh hay trạng thái được nhắc tới trong cột "Thao tác" (ví dụ "S003 đã có 14/10 19:00", "chỉ T001 mở") là phần chuẩn bị: harness tự dựng sẵn trước khi chạy kịch bản.
5. Các kịch bản đánh dấu **(thật)** chạy thêm một lần trên môi trường STAGING thật, theo checklist phần B, vì giả lập không bắt được hết lỗi của Google (bài học hotfix v6.0.1: test giả lập đạt hết nhưng trigger thật gửi dữ liệu khác).
6. Phần Calendar và email trong giả lập được kiểm tra qua "nhật ký gọi" của harness (ai được mời, sự kiện nào bị huỷ, email gửi cho ai, mấy lần). Việc thư mời có thật sự tới hộp thư và hiện trong lịch hay không chỉ kiểm tra được ở bản thật.

## Dữ liệu mẫu (fixtures)

**Lịch:** tuần A từ thứ Hai 12/10/2026 đến Chủ nhật 18/10/2026; tuần B từ 19/10 đến 25/10. Giờ giả lập mặc định: **thứ Hai 12/10 lúc 10:00**.

**Tutor** (đều ACTIVE, có số điện thoại): T001 Vân, T002 Ánh, T003 Lan, T004 Minh.

**Lịch rảnh mặc định:** tuần A, cả 4 tutor mở 19:00, 20:00, 21:00 mỗi ngày; T001 và T002 mở thêm 08:00 và 23:30 mỗi ngày. Tuần B chưa ai mở, trừ khi kịch bản nói khác.

**Học viên** (đều có email và số điện thoại hợp lệ dạng `+849...`):

| Mã | Gói | Trạng thái gói ban đầu |
|---|---|---|
| S001 | TRIAL (2 buổi, 7 ngày) | INACTIVE, mua 10/10 |
| S002 | PASS_2W (14 ngày) | INACTIVE, mua 10/10 |
| S003 | PASS_1M (30 ngày) | ACTIVE, 05/10 đến 03/11 |
| S004 | Gói theo buổi PACK_12 (12 buổi, ngừng bán) **[đổi 01/11, 5L, BL49: thay LEGACY]** | đã dùng 11, còn 1 |
| S005 | PASS_1M | ACTIVE, 01/10 đến 30/10 |
| S006 | PASS_2W | EXPIRED, 20/09 đến 03/10 |
| S007 | PASS_2W | ACTIVE, 12/10 đến 25/10 |
| S008 | PASS_1M | ACTIVE, 05/10 đến 03/11 |

## A. Đăng ký và tài khoản

| # | Thời điểm | Thao tác | Mong đợi | Câu |
|---|---|---|---|---|
| A01 **(thật)** | 12/10 10:00 | Khách gửi form đăng ký: email new1@test.com, số điện thoại `0912 345 678`, gói PASS_1M, có ảnh chụp, tick đồng ý | REGISTRATIONS thêm 1 dòng "Chờ duyệt" có mã chuyển khoản; số điện thoại lưu đúng chữ `+84912345678` (không mất dấu cộng, không thành số); ảnh nằm trong Drive và có link; email cho nhóm admin kèm link ảnh và số điện thoại; email "đã nhận" cho khách; log REG_CREATED | 33, 50 |
| A02 **[đổi 13/10, đổi 01/11 5K: số không cần định dạng]** | 12/10 10:00 | Gửi form thiếu ảnh; gửi form không tick đồng ý; gửi với số `0212345678`, `091234567`, `1 415 555 0100` (số nước ngoài thiếu dấu +); gửi lần lượt với `+84 912.345.678`, `84912345678`, `912345678`; gửi với số trống, `+1 415 555 0100`, `+66 81 234 5678` | 2 lần đầu (thiếu ảnh, thiếu đồng ý) bị chặn, báo lỗi rõ ràng, không ghi dòng nào. 3 số `0212345678`, `091234567`, `1 415 555 0100` được nhận và lưu nguyên văn (5K). Các lần sau đều được nhận: số Việt Nam lưu `+84912345678`, số trống lưu trống, số nước ngoài lưu `+14155550100`, `+66812345678` | 33 |
| A03 | 12/10 10:05 | Email của S001 (đã từng có Trial) đăng ký gói TRIAL | Từ chối "Mỗi email chỉ dùng Trial 1 lần"; vẫn chọn được gói khác | 5 |
| A04 **(thật)** | 12/10 10:10 | Admin chọn "Duyệt" cho dòng của A01, sau đó chọn "Duyệt" thêm lần nữa | Lần 1: USERS thêm học viên ACTIVE có số điện thoại và link liên hệ; STUDENT_PACKAGES thêm PASS_1M INACTIVE; PAYMENTS thêm 1 dòng đúng giá; email chào mừng có link đăng nhập. Lần 2: không tạo thêm bất cứ gì | 33, 39 |
| A05 **(thật) [đổi 13/10]** | 12/10 10:15 | Mở link đăng nhập lần 1; mở lại chính link đó; đặt `LOGIN_LINK_MAX_USES = 2` rồi mở lần 3; mở một link khác sau 16 phút | Lần 1 và lần 2 vào được (mặc định dùng nhiều lần trong 15 phút); lần 3 báo "link đã dùng"; link quá 15 phút báo "hết hạn" | 32 |
| A06 **[đổi 01/11, 5J]** | 12/10 10:20 và 11:21 | Xin link 2 lần liên tiếp cho cùng email; xin 2 lần cho email không có trong hệ thống; 11:21 xin lại; admin gửi hộ bằng menu | Lần 1 gửi, lần 2 báo "link đã gửi lúc 10:20, xin lại sau 11:20" (LINK_COOLDOWN); email lạ nhận đúng các câu đó, không có email nào được gửi; qua 60 phút xin lại được; admin gửi hộ không bị giới hạn | 32 |

## B. Gói học, thời hạn và nhắc lịch

| # | Thời điểm | Thao tác | Mong đợi | Câu |
|---|---|---|---|---|
| B07 | 12/10 10:00 | S001 (Trial, chưa dùng) đặt 14/10 19:00 | CONFIRMED; gói ACTIVE, bắt đầu 14/10, kết thúc 20/10; còn 1 buổi | 1, 2 |
| B08 | 12/10 10:00 | S001 gửi cùng lúc 14/10 19:00 và 16/10 20:00; sau đó đặt thêm 17/10 19:00 | 2 buổi đầu CONFIRMED, còn 0 buổi; 17/10 từ chối NO_SESSIONS | 4 |
| B09 | 12/10 10:00 | Sau B07, tutor mở 21/10 19:00; S001 đặt 21/10 19:00 | Từ chối OUT_OF_RANGE (gói hết 20/10) | 2 |
| B10 | 02/11 10:00 | Tutor mở 03/11 23:30 và 04/11 08:00; S003 (hết 03/11) đặt cả hai | 03/11 23:30 CONFIRMED; 04/11 từ chối OUT_OF_RANGE | 2, 17 |
| B11 | 12/10 10:00 | S002 (2 tuần, chưa dùng) đặt 14/10 và 16/10; lúc 13/10 10:00 huỷ buổi 14/10 | Sau khi đặt: 14/10 đến 27/10. Sau khi huỷ: 16/10 đến 29/10 | 1 |
| B12 | 12/10 10:00 | S002 chỉ đặt 16/10 rồi huỷ (trước hạn) | Gói trở về INACTIVE, ngày bắt đầu và kết thúc để trống | 1 |
| B13 | 12/10 10:00 | S007 (2 tuần, 12/10 đến 25/10) mua thêm PASS_1M, admin duyệt; tutor mở 26/10 19:00; S007 đặt 26/10 19:00 | Gói mới QUEUED, 26/10 đến 24/11; booking 26/10 gắn vào gói mới | 6 |
| B14 | 12/10 10:00 | Admin tạm khoá S005 ngày 12/10; S005 đặt 14/10; ngày 15/10 admin mở khoá | Đặt bị từ chối SUSPENDED; sau khi mở khoá, ngày kết thúc thành 02/11 (cộng 3 ngày) | 7 |
| B15 | 31/10 06:00 và 09/11 06:00 | dailyJob chạy ngày 31/10 với S003 (hết 03/11), chạy lại lần 2 cùng ngày; dailyJob chạy ngày 09/11 với một gói INACTIVE mua ngày 10/10 | 31/10: email "gói sắp hết hạn" gửi cho S003 đúng 1 lần. 09/11: gói INACTIVE thành ACTIVE, bắt đầu 09/11, kết thúc theo số ngày của gói | 3, 41 |
| B16 **(thật)** | 14/10 18:00 và 18:15 | S003 có buổi 14/10 19:00 (CONFIRMED) và 14/10 là ngày duy nhất; S008 có buổi 14/10 19:00 đã huỷ; S007 có buổi 14/10 21:00. reminderJob chạy 18:00, chạy lại 18:15 | Lúc 18:00: đúng 2 email nhắc (S003 và tutor của S003), có link Meet và nút Zalo admin; `reminder_sent_at` được ghi. Lúc 18:15: không gửi thêm. Buổi đã huỷ và buổi 21:00 không nhận nhắc | 41 |
| B17 | 12/10 10:00 | S004 (gói theo buổi còn 1 buổi) gửi cùng lúc 14/10 và 15/10 | 14/10 CONFIRMED; 15/10 từ chối NO_SESSIONS | 45 |
| B18 | 12/10 10:00 | S006 (gói đã hết hạn) đặt 14/10 | Từ chối EXPIRED; trang hiện nút Gia hạn | brief, flow 6 |
| B19 *(5M)* | 12/10 đến 20/10 | S002 (2 tuần) đặt 14/10 và 20/10; 14/10 21:00 admin chọn Vắng tutor; 20/10 19:40 T001 chọn Hoàn thành | Sau Vắng tutor: tạm tính 20/10 đến 02/11. Sau Hoàn thành: khoá 20/10 (LOCKED), hạn 02/11, không cộng ngày | 1 (01/11) |
| B20 *(5M, đổi 5J)* | 12/10 đến 17/10 09:00 | S002 đặt 14/10 23:30 và 15/10 19:00; 15/10 Hoàn thành; 14/10 chưa xác nhận; hourlyJob 16/10 00:05 và 17/10 00:05; 17/10 09:00 admin chọn "Hoàn thành (admin chọn)" cho buổi 14/10 | 16/10 chưa khoá; 17/10 00:05 buổi 14/10 thành Không hoàn thành, vẫn chưa khoá (chờ admin); admin chọn Hoàn thành thì khoá 14/10 | 1, 29 |
| B21 *(5M)* | 14/10 đến 22/10 | S001 (Trial) 14/10 Hoàn thành; 18/10 20:00 Vắng tutor; đặt 22/10; 22/10 20:00 Vắng tutor | Hạn 20/10 thành 23/10, 1 email cộng 3 ngày; lần hai trả lượt (còn 1), hạn giữ 23/10, báo admin TRIAL_LEFT_UNUSED | 27 (01/11), BL42 |
| B22 *(5M)* | 14/10 15:00:03 và 16/10 15:00 | S001 đặt 15/10, 17/10; admin chọn Huỷ bởi admin lúc 14:59:50 (khoá chạy 15:00:03) cho 15/10; lúc 16/10 15:00 cho 17/10 | 15/10 CANCELLED_ADMIN, trả lượt, ngày bắt đầu lùi 17/10. 17/10 CANCELLED_LATE, trừ lượt (còn 1), khoá 17/10, hạn 23/10 | 12 (01/11), BL46 |
| B23 *(5M)* | 14/10 19:40, 15/10 09:00 | S003 (cố định 05/10 đến 03/11) buổi 14/10 tutor báo Vấn đề kỹ thuật; admin chọn Tính lương; rồi Lỗi khách quan | Mặc định lỗi tutor: hạn 04/11, không lương. Lỗi học viên: hạn 03/11, có lương. Lỗi khách quan: hạn 04/11, có lương | 25, 27 (01/11) |
| B24 *(5M)* | 26/10 06:00 và 08:00; 12/10 | S007 (12/10 đến 25/10) buổi 25/10; dailyJob 26/10; 08:00 Vắng tutor. S006 (hết 03/10) có buổi 03/10 ghi Vắng tutor ngày 12/10 | S007 EXPIRED rồi tự mở lại, hạn 27/10. S006 giữ EXPIRED, báo admin COMP_ON_EXPIRED | BL47 |

## C. Đặt lịch và Calendar

| # | Thời điểm | Thao tác | Mong đợi | Câu |
|---|---|---|---|---|
| C19 **(thật)** | 13/10 14:59:59 và 15:00:00 | S003 đặt 14/10 19:00 lúc 14:59:59; S008 đặt 14/10 20:00 lúc 15:00:00 | Lần đầu CONFIRMED; lần sau từ chối DEADLINE | 10 |
| C20 | 12/10 10:00 | S003 đặt chính ngày hôm nay 12/10 21:00 | Từ chối DEADLINE | 10 |
| C21 | 12/10 10:00 | S003 đã có 14/10 19:00, đặt thêm 14/10 21:00; trong một lần gửi khác chọn 2 slot cùng ngày 15/10 | Cả hai bị từ chối ONE_PER_DAY. Trang không cho chọn 2 slot cùng ngày, nhưng server vẫn tự kiểm tra | 4 |
| C22 | 12/10 10:00 | S003 đặt 14/10 23:30 và 15/10 08:00 | Cả hai CONFIRMED vì khác ngày | 17 |
| C23 **(thật)** | 12/10 10:00 | Ngày 15/10 lúc 19:00 chỉ T001 mở và đã có học viên; S003 gửi 14/10 19:00, 15/10 19:00, 16/10 19:00 | 14 và 16 CONFIRMED; 15 từ chối NO_TUTOR với câu "Slot này hiện không còn Tutor. Vui lòng chọn khung giờ khác."; học viên nhận đúng 1 email xác nhận gộp. Mỗi buổi CONFIRMED có 1 sự kiện trên lịch "Thaiput · Lịch học": đúng giờ, có link Meet, khách mời gồm đúng email S003 và email tutor được gán, mô tả không chứa số điện thoại hay email học viên | 15, 41 |
| C24 **(thật)** | 12/10 10:00 | Slot 14/10 21:00 chỉ còn 1 tutor rảnh; S003 và S008 gửi gần như cùng lúc | Đúng 1 người CONFIRMED, người kia NO_TUTOR; không tutor nào bị gán 2 học viên cùng slot | brief 3.2 |
| C25 **[đổi 13/10]** | 12/10 10:00 | T001 đã có 3 buổi, T002 có 1, T003 có 1 trong tuần; đặt thật 4 buổi liên tiếp ở các slot chỉ T002, T003 mở | Chỉ T002 hoặc T003 được chọn; chia đều 2 và 2; hai buổi liên tiếp không cùng một tutor (xoay vòng) | 18 |
| C26 | 12/10 10:00 | S003 muốn đặt 21/10 khi chưa tutor nào mở tuần 19/10 | Trang không hiện ngày 21/10; gọi API thẳng thì bị từ chối NO_TUTOR | 11 |

## D. Huỷ của học viên

| # | Thời điểm | Thao tác | Mong đợi | Câu |
|---|---|---|---|---|
| D27 **(thật)** | 13/10 14:59 | S001 (Trial) huỷ buổi 14/10 19:00 | CANCELLED_STUDENT; số buổi còn lại tăng 1; sự kiện Calendar bị huỷ với thông báo cho khách mời (học viên và tutor nhận thư huỷ, sự kiện biến mất khỏi lịch của họ); email huỷ cho học viên và tutor; slot trống lại cho người khác đặt | brief 10, 41 |
| D28 | 13/10 15:00 | S003 huỷ buổi 14/10 19:00 | Từ chối CANCEL_DEADLINE; booking giữ nguyên CONFIRMED | 12 |
| D29 | 13/10 10:00 và 14/10 15:30 | S003 huỷ 14/10 19:00 lúc 13/10 10:00 rồi đặt 14/10 21:00 lúc 13/10 10:05; S008 huỷ buổi 15/10 lúc 13/10 10:00 rồi đặt lại 15/10 lúc 14/10 15:30 | S003 đặt lại thành công; S008 đặt lại bị từ chối DEADLINE | 13 |
| D30 | 12/10 10:00 | Phiên của S003 gửi lệnh huỷ kèm mã booking của S008 (sửa lời gọi API) | Từ chối FORBIDDEN; booking của S008 không đổi; log ghi cảnh báo | bảo mật |

## E. Tutor và lịch rảnh

| # | Thời điểm | Thao tác | Mong đợi | Câu |
|---|---|---|---|---|
| E31 **[đổi 01/11, 5J]** | 10/10 14:00 | Bắt đầu từ lịch rảnh trống. T001 mở 19:00 và 20:00 cho cả 7 ngày tuần A, rồi tắt slot 18/10 20:00 | 14 slot OPEN; slot 18/10 20:00 CANCELLED ngay (trước hạn 22:00 thứ Bảy, chưa có học viên) | 21 |
| E32 **[đổi 01/11, 5J: tắt lúc 10/10 22:01, sau hạn 22:00 thứ Bảy]** | 10/10 22:01 | T001 tắt slot 18/10 19:00 (chưa có học viên); admin chọn Duyệt | Slot thành CANCEL_PENDING, nhóm admin nhận email; sau khi duyệt thì CANCELLED | brief 9 |
| E33 **(thật)** | 12/10 10:00 | S003 có buổi 16/10 20:00 với T001; T001 xin huỷ slot đó; T002 rảnh 16/10 20:00; admin Duyệt | Booking qua PENDING_REASSIGN rồi CONFIRMED với T002, giữ nguyên mã booking; sự kiện Calendar giữ nguyên link Meet, khách mời đổi từ T001 sang T002 (T001 nhận thư huỷ, T002 nhận thư mời); email cho S003, T001, T002; log REASSIGNED | 30, 41 |
| E34 | 12/10 10:00 | Như E33 nhưng không tutor nào khác rảnh, và học viên là S001 (Trial) | Booking CANCELLED_TUTOR; sự kiện bị huỷ; S001 được hoàn 1 buổi; email mời đặt lại | 19 |
| E35 | 15/10 16:00 | Lúc 15/10 10:00, T002 xin huỷ slot 15/10 19:00 đã có học viên; admin không làm gì; hourlyJob chạy lúc 16:00 | Yêu cầu tự bị từ chối; slot về OPEN; T002 nhận email "bạn vẫn dạy buổi này"; booking không đổi | 20 |
| E36 | 13/10 18:00 | T003 thêm slot 15/10 22:00 (đã qua hạn tuần); lúc 13/10 18:05, S003 đặt slot đó | Slot OPEN ngay; S003 đặt thành công (hạn của học viên cho ngày 15/10 là 14/10 15:00) | 22 |
| E37 | 12/10 10:00 | Phiên của T001 gọi API xem lịch của T002; xem chi tiết học viên của buổi mình dạy | Xem lịch T002 bị từ chối FORBIDDEN; chi tiết học viên chỉ có tên, level, ghi chú, không có email và số điện thoại | 35 |

## F. Sau buổi học và vận hành

| # | Thời điểm | Thao tác | Mong đợi | Câu |
|---|---|---|---|---|
| F38 | 14/10 19:40 | T001 chọn kết quả cho 3 buổi đã diễn ra: Hoàn thành; Vắng học viên; Vấn đề kỹ thuật (buổi của học viên Trial). Thử chọn kết quả cho một buổi chưa bắt đầu | Trạng thái lần lượt COMPLETED, STUDENT_ABSENT, TECH_ISSUE; buổi kỹ thuật hoàn 1 buổi Trial và không tính lương; buổi chưa bắt đầu bị từ chối | 26, 27 |
| F39 **[đổi 01/11, 5J]** | 15/10 19:31 đến 17/10 09:00 | Buổi 14/10 19:00 chưa được xác nhận; hourlyJob chạy 15/10 19:29, 19:31, 20:31, 16/10 19:29, 19:32, 21:05; admin chọn "Hoàn thành (admin chọn)" | 19:31: vẫn CONFIRMED, báo đỏ (RESULT_OVERDUE, Khẩn) đúng 1 lần, trang tutor tô đỏ kèm giờ 16/10 19:31; 16/10 19:32: NOT_COMPLETED, người ghi SYSTEM, không tính lương; vào email tổng hợp 21:00; admin sửa được thành COMPLETED | 29 |
| F40 **(thật)** | 01/11 09:00 | Admin dùng dropdown: huỷ 1 booking; đổi tutor 1 booking; đánh dấu Vắng tutor cho 1 buổi Trial. Mở REPORT_MONTH tháng 10. Chạy nightlyBackup 31 đêm liên tiếp | Huỷ và đổi tutor có đủ email, Calendar, log với người thực hiện là email admin; buổi Vắng tutor hoàn 1 buổi Trial; báo cáo tháng 10 đếm đúng số buổi (Hoàn thành và Vắng học viên) theo tutor và tổng tiền PAYMENTS khớp số Claude tính tay trong fixtures; thư mục Backup còn đúng 30 bản | 25, 28, brief 13 |

## Tổng hợp theo luật

| Nhóm luật | Kịch bản |
|---|---|
| Hạn 15:00 hôm trước (đặt và huỷ) | C19, C20, D27, D28, D29, E36 |
| 1 buổi/ngày | B08, C21, C22 |
| Thời hạn gói, kích hoạt, nối tiếp, tạm khoá | B07, B09 đến B15, B18 |
| Khoá ngày bắt đầu, bù ngày (5M) | B19 đến B24 |
| Số buổi Trial và gói cũ | B08, B17, D27, E34, F38, F40 |
| Gán tutor, công bằng, đặt trùng | C23, C24, C25, E33 |
| Quy trình huỷ của tutor | E31 đến E35 |
| Calendar (sự kiện, khách mời, Meet, huỷ, đổi tutor) | C23, D27, E33, E34, F40 |
| Email (gộp, nhắc 60 phút, sắp hết hạn, không gửi trùng) | A01, B15, B16, C23 |
| Số điện thoại và liên hệ | A01, A02, A04, E37 |
| Phân quyền và bảo mật | A05, A06, D30, E37 |
| Job tự động | B15, B16, E35, F39, F40 |

**Đếm:** nhóm A 6, B 12, C 8, D 4, E 7, F 3, tổng **40 kịch bản** (cộng 6 kịch bản B19 đến B24 của chunk 5M, ngày 01/11/2026, tổng **46**), trong đó **10 kịch bản (thật)**: A01, A04, A05, B16, C19, C23, C24, D27, E33, F40. Chúng được chạy lại trên STAGING qua các mục tương ứng của checklist phần B.
