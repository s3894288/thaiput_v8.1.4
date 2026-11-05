# Thaiput v7 · Checklist từ chuẩn bị đến vận hành

*Cập nhật: 05/10/2026 · Đánh dấu [x] khi xong. Mục nào không đạt: chụp màn hình, dán cho Claude, ghi số mục.*

*`thaiput.vn` là tên miền ví dụ; thay bằng tên miền anh mua. Hướng dẫn từng bước cho phần A nằm ở file 06.*

## A. Chuẩn bị trước khi code (khoảng 1 giờ thao tác, anh tự làm)

**Làm phần A1 đến A6 đầu tiên, vì DNS cần từ vài phút đến vài giờ để cập nhật; trong lúc chờ, Claude code phase 1.**

**Tên miền và Workspace** (file 06, mục 2 đến 5)
* [ ] A1. Mua tên miền (đề xuất `thaiput.vn`), đứng tên trường hoặc chủ trường. Lưu tài khoản quản lý tên miền ở nơi an toàn.
* [ ] A2. Đăng ký Google Workspace Business Starter bằng tên miền vừa mua; tài khoản đầu tiên là `booking@thaiput.vn` (tài khoản hệ thống, cũng là quản trị Workspace).
* [ ] A3. Xác minh tên miền với Google (bản ghi TXT) và trỏ email về Google (bản ghi MX). Gửi thử 1 email từ Gmail cá nhân tới `booking@thaiput.vn`: nhận được.
* [ ] A4. Bật xác thực email: SPF, DKIM, DMARC (file 06 mục 4). Chờ DKIM báo "Authenticating email".
* [ ] A5. `booking@` bật xác minh 2 bước, tải mã dự phòng, cất ở nơi an toàn (không lưu trong chính tài khoản đó).
* [ ] A6. Tạo Google Group `admin@thaiput.vn` (miễn phí), thêm Gmail của anh và của admin Karn làm thành viên, cho phép người ngoài tổ chức gửi thư vào nhóm.

**Cài đặt Workspace cho web app và Calendar** (file 06 mục 5)
* [ ] A7. Admin console, Drive: cho phép chia sẻ ra ngoài tổ chức (bắt buộc để web app chọn được "Anyone").
* [ ] A8. Admin console, Calendar: cho phép mời khách ngoài tổ chức và cảnh báo khi mời khách ngoài (để nguyên cảnh báo, không chặn).
* [ ] A9. Admin console, Meet: bật truy cập nhanh để khách mời vào phòng không cần chủ phòng có mặt.

**Dữ liệu và công cụ**
* [ ] A10. Trong Drive của `booking@` tạo thư mục `THAIPUT_V7`, bên trong có `Uploads` (ảnh chuyển khoản), `Backup`, `Export`.
* [ ] A11. Tạo 2 file Sheets trống: `THAIPUT_DB` và `THAIPUT_DB_STAGING`. Đặt timezone của cả hai: File, Settings, Time zone, (GMT+07:00) Ho Chi Minh.
* [ ] A12. Chia sẻ thư mục `Export` cho một tài khoản Google khác do trường giữ (dự phòng khi `booking@` gặp sự cố).
* [ ] A13. Chia sẻ quyền chỉnh sửa 2 file Sheets cho Gmail của anh và của admin. Không chia sẻ cho tutor.
* [ ] A14. Cài Claude Code và Node.js trên máy; cài clasp (`npm install -g @google/clasp`); chạy `clasp login` bằng `booking@`; bật Apps Script API tại script.google.com/home/usersettings (đăng nhập bằng `booking@`).
* [ ] A15. Gửi Claude danh sách: email và số điện thoại 4 tutor, link Zalo và số điện thoại admin, giá 4 gói, thông tin ngân hàng, tên miền đã mua.
* [ ] A16. Báo admin: từ ngày launch, tutor nộp lịch trên web thay cho file Sheets.

## B. Test trên STAGING thật (sau phase 5, khoảng 1,5 đến 2 giờ)

**Môi trường**
* [ ] B1. Menu thaiput, Kiểm tra hệ thống: 0 lỗi, timezone đúng, đủ tab, đủ trigger, lịch "Thaiput · Lịch học (STAGING)" tồn tại.
* [ ] B2. Trang Executions trong Apps Script: không có dòng Failed sau các bước dưới.

**Email**
* [ ] B3. Gửi một email từ hệ thống tới Gmail của anh, mở email, chọn "Hiển thị bản gốc" (Show original): SPF, DKIM, DMARC đều **PASS**.
* [ ] B4. Email nằm trong **Hộp thư đến**, không nằm trong Spam, ở cả Gmail và một hộp thư khác (Outlook hoặc Yahoo).

**Học viên (dùng 1 điện thoại iPhone và 1 điện thoại Android nếu có)**
* [ ] B5. Mở `www.thaiput.vn` (hoặc link Sites tạm) trên điện thoại: trang chủ hiện đúng bảng giá, chữ không tràn màn hình.
* [ ] B6. Gửi form đăng ký kèm ảnh chụp từ thư viện ảnh điện thoại, số điện thoại nhập kiểu `0912 345 678` (A01). Ảnh có trong `Uploads`; cột phone trong REGISTRATIONS hiện đúng `+84912345678`.
* [ ] B7. Thử số sai `091234567`: form báo lỗi ngay, không gửi được (A02).
* [ ] B8. Admin chọn Duyệt (A04): email chào mừng tới; chọn Duyệt lần nữa không tạo trùng.
* [ ] B9. Trong USERS, bấm link Zalo của học viên vừa tạo: mở đúng trang Zalo của số đó. Bấm link gọi trên điện thoại: mở trình gọi đúng số.
* [ ] B10. Bấm link đăng nhập trong email trên điện thoại (A05): vào được cổng học viên.
* [ ] B11. **Đóng hẳn trình duyệt, mở lại trang:** vẫn còn đăng nhập. Nếu bị đăng xuất khi mở qua Google Sites, thử nút "Mở toàn màn hình". Ghi lại kết quả cho cả hai cách (rủi ro mục 4.8 của plan).
* [ ] B12. Đặt 2 ngày cùng lúc (C23): nhận 1 email xác nhận gộp và 2 thư mời Calendar. Bấm "Có" trong thư mời: sự kiện hiện trong lịch của học viên. Thử với cả một email không phải Gmail.
* [ ] B13. Mở sự kiện trên lịch "Thaiput · Lịch học (STAGING)" bằng tài khoản admin: thấy đủ buổi, màu theo tutor; mô tả không có số điện thoại hay email học viên.
* [ ] B14. **Vào Meet:** học viên và tutor (2 thiết bị, 2 tài khoản khác `booking@`) bấm link Meet đúng giờ, cả hai vào phòng được mà không cần ai duyệt.
* [ ] B15. Email nhắc 60 phút (B16): dùng giả lập thời gian hoặc đặt một buổi thật gần giờ trên STAGING, nhận đúng 1 email nhắc có link Meet.
* [ ] B16. Hạn 15:00 (C19): bật giả lập thời gian 14:59 đặt được, 15:00 bị chặn.
* [ ] B17. Hai người đặt cùng slot cuối (C24): anh và một người khác bấm cùng lúc trên 2 điện thoại; chỉ 1 người thành công.
* [ ] B18. Huỷ trước hạn (D27): thư huỷ của Calendar tới cả học viên và tutor, sự kiện biến mất khỏi lịch của cả hai; email huỷ tới cả hai.
* [ ] B19. Huỷ sau hạn bị chặn, nút Huỷ ẩn hoặc báo lý do.
* [ ] B20. Nút "Nhắn Zalo admin" và "Gọi admin" trong cổng học viên mở đúng Zalo và số của admin.

**Tutor (dùng tài khoản email tutor thật hoặc email test)**
* [ ] B21. Đăng nhập cổng tutor: giao diện tiếng Anh, lưới lịch rảnh dùng được trên điện thoại.
* [ ] B22. Tick và bỏ tick slot trước hạn, sau hạn (E31, E32): sau hạn thì nhóm admin nhận email yêu cầu duyệt.
* [ ] B23. Admin duyệt huỷ một slot đã có học viên (E33): học viên nhận email đổi tutor; tutor cũ nhận thư huỷ Calendar, tutor mới nhận thư mời; link Meet giữ nguyên.
* [ ] B24. Tutor xác nhận kết quả sau buổi (F38). Không thấy email và số điện thoại học viên.

**Admin**
* [ ] B25. Đổi tutor và huỷ booking bằng dropdown (F40): ACTIVITY_LOG có dòng ghi email admin.
* [ ] B26. Tab REPORT_MONTH hiện đúng số buổi theo tutor, doanh thu, số email theo ngày.
* [ ] B27. Sáng hôm sau: có bản backup mới trong `Backup`.
* [ ] B28. **Diễn tập khôi phục:** mở một bản backup, sao chép tab BOOKINGS vào STAGING, hệ thống vẫn chạy. Mất khoảng 10 phút; làm đúng 1 lần để biết cách.
* [ ] B29. Diễn tập quay về phiên bản cũ: Deploy, Manage deployments, chọn phiên bản trước, lưu. Trang vẫn chạy.

## C. Ngày go live

* [ ] C1. Chạy Migration trên PRODUCTION: số học viên, số gói còn hiệu lực, số booking tương lai **khớp** với v6 (Claude in bảng so sánh). Booking tương lai có sự kiện trên lịch chính thức và thư mời mới.
* [ ] C2. Deploy PRODUCTION với **phiên bản đánh số**, không dùng bản nháp (Head).
* [ ] C3. Nhúng web app PRODUCTION vào Google Sites, publish, gắn tên miền `www.thaiput.vn` (file 06 mục 6). Mở thử `thaiput.vn` không có www: tự chuyển sang `www`.
* [ ] C4. Tắt nhận phản hồi của 2 Google Form v6 và để lời nhắn trỏ sang link mới. Giữ file v6 nguyên vẹn, không xoá.
* [ ] C5. Tắt các trigger của v6 để không gửi email trùng; sự kiện Calendar cũ của v6 cho các buổi đã chuyển sang v7 thì xoá để học viên không thấy 2 sự kiện.
* [ ] C6. Gửi email hoặc tin nhắn Zalo cho học viên và tutor: link mới, cách đăng nhập bằng email, hạn 15:00. Học viên v6 chưa có số điện thoại sẽ được nhắc bổ sung ở lần đăng nhập đầu.
* [ ] C7. Thời điểm chuyển: tutor nộp lịch tuần mới trên v7 trước 15:00 Chủ nhật; booking tuần cũ còn lại đã được chuyển ở C1.
* [ ] C8. Anh và admin mỗi người đặt thử 1 buổi thật, huỷ thử 1 buổi thật.

## D. 7 ngày đầu (mỗi sáng 5 phút)

* [ ] D1. Executions: không có lỗi mới. Có lỗi thì dán cho Claude.
* [ ] D2. Hộp thư nhóm admin: email lỗi tự động, email yêu cầu duyệt, đăng ký mới.
* [ ] D3. Số email đã gửi hôm qua (REPORT_MONTH). Bình thường dưới 200; vượt 1.000/ngày là bất thường, báo Claude kiểm tra.
* [ ] D4. Hỏi nhanh 1 tutor và 1 học viên: có gì khó dùng không.
* [ ] D5. Chỉ deploy bản sửa trong khung 10:00 đến 12:00 hoặc sau 00:00. Không deploy 13:00 đến 15:00 hằng ngày và 12:00 đến 15:00 Chủ nhật.

## E. Sổ tay sự cố (đọc 1 lần, dùng khi cần)

| Tình huống | Làm ngay | Sau đó |
|---|---|---|
| Bản mới lỗi, học viên không đặt được | Manage deployments, chọn lại phiên bản trước (1 phút) | Gửi lỗi cho Claude sửa trên STAGING |
| Dữ liệu bị xoá hoặc sửa sai | File, Version history trong Sheets, khôi phục; hoặc lấy bản trong `Backup` | Kiểm tra ACTIVITY_LOG xem ai làm gì |
| Email vào Spam hàng loạt | Kiểm tra lại SPF, DKIM, DMARC trong file 06 mục 4; nhắn Zalo học viên đánh dấu "Không phải spam" | Gửi Claude một email mẫu (bản gốc) để soát |
| Google báo vượt giới hạn gửi | Hệ thống vẫn ghi booking, Calendar vẫn gửi thư mời; admin báo tay qua Zalo cho người liên quan | Giới hạn tự hồi sau 24 giờ; Claude kiểm tra vòng lặp gửi trùng |
| Tài khoản `booking@` bị khoá hoặc mất | Dùng bản CSV trong thư mục `Export` ở tài khoản dự phòng; báo học viên qua Zalo | Khôi phục bằng mã dự phòng (A5) hoặc qua Google Workspace hỗ trợ |
| Tên miền sắp hết hạn | Gia hạn ngay ở nhà đăng ký; bật tự động gia hạn | Mất tên miền là mất cả email lẫn trang web, nên đặt nhắc lịch trước hạn 30 ngày |
| Lỗi luật hàng loạt (ví dụ gán sai tutor) | Admin tạm tắt đặt lịch bằng khoá `BOOKING_ENABLED=FALSE` trong CONFIG; mở lại Google Form v6 nếu cần | Claude sửa, chạy lại 40 kịch bản, rồi bật lại |
