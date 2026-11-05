# Báo cáo kết quả test theo chunk (chunk 3 đến 5I) và báo cáo tổng hợp 5A đến 5G

*Tệp lưu trữ, gộp ngày 30/10/2026 trong đợt dọn dẹp bản 8.0.10. Gộp nguyên văn 13 file trước đây nằm ở `v8/reports/REPORT_*.md`. Nhiều báo cáo chứa nguyên báo cáo `npm test` của chunk đó.*

*Mỗi file gốc nằm giữa hai dòng `<!-- BEGIN FILE ... -->` và `<!-- END FILE ... -->`, kèm số byte và mã sha256 của file gốc để kiểm chứng. Nội dung giữa hai dòng đó là nguyên văn.*

## Mục lục

1. `v8/reports/REPORT_CHUNK3.md`
2. `v8/reports/REPORT_CHUNK4.md`
3. `v8/reports/REPORT_CHUNK5.md`
4. `v8/reports/REPORT_CHUNK5A.md`
5. `v8/reports/REPORT_CHUNK5B.md`
6. `v8/reports/REPORT_CHUNK5C.md`
7. `v8/reports/REPORT_CHUNK5D.md`
8. `v8/reports/REPORT_CHUNK5E.md`
9. `v8/reports/REPORT_CHUNK5F.md`
10. `v8/reports/REPORT_CHUNK5G.md`
11. `v8/reports/REPORT_CHUNK5H.md`
12. `v8/reports/REPORT_CHUNK5I.md`
13. `v8/reports/REPORT_TONG_HOP_5A_5G.md`

---

## `v8/reports/REPORT_CHUNK3.md`

*Ngày tạo trong Project: 2026-10-05T05:45:09Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK3.md | bytes=7255 | sha256=18c98532ae94266ea3ada9511ce62a38c30f0e3eed77743db1be4ee533d60b2f | created=2026-10-05T05:45:09Z -->
# Thaiput v8 · Báo cáo test

*Chạy lúc 12:44:00 5/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 11 | 11 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán ngẫu nhiên trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK3.md -->

---

## `v8/reports/REPORT_CHUNK4.md`

*Ngày tạo trong Project: 2026-10-05T07:41:21Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK4.md | bytes=12028 | sha256=32777cbc4cea074edffb3d81e66281f03b5f34712abd3cd7ef840b0bbb5883ef | created=2026-10-05T07:41:21Z -->
# Thaiput v8 · Báo cáo chunk 4 (giao diện web)

*Ngày 05/10/2026. Phần đầu là các kiểm tra riêng của chunk 4, phần sau là báo cáo đầy đủ do `npm test` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 đạt |
| 40 kịch bản file 03 | 40/40 đạt |
| Tích hợp | 11/11 đạt (I06 viết lại: kiểm tra trang thật do doGet dựng và chặn tham số URL độc) |
| Giao diện web, mới | 17/17 đạt (U01 đến U17) |
| Thử phá code (mutation) | 5/5 lỗi cài cố ý đều bị test bắt |
| Xem thật trên Chromium khổ 390px, sáng và tối | 0 lỗi JavaScript, không tràn ngang; chỉ báo không tải được font Google do máy test không có mạng |

## Thử phá code: cài lỗi cố ý, xem test có bắt không

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| M1 | Bỏ thoát HTML ở tên học viên trên thanh trên cùng | U11 (thẻ img lọt vào trang) |
| M2 | API trả thẳng Date (Apps Script thật sẽ trả null cho trình duyệt) | U04, U08, U09 |
| M3 | Bỏ lọc tham số `page` trong doGet | I06 |
| M4 | Bỏ hộp thoại xác nhận khi tutor bấm slot đã có học viên | U14 |
| M5 | Cho chọn 2 giờ trong cùng một ngày | U08 |

Sau mỗi lần thử, file được trả về nguyên trạng và chạy lại `npm test`: xanh toàn bộ.

## Lỗi và điểm yếu tìm ra trong chunk 4 (đã sửa)

| # | Vấn đề | Hậu quả nếu để nguyên | Cách sửa |
|---|---|---|---|
| 1 | `Index.html` in `page` và token bằng `'<?= ?>'` trong thẻ script | Apps Script tự thêm dấu nháy khi in chuỗi trong JavaScript, link đăng nhập có thể không đọc được token | `bootJson_()` trong Api.gs tạo JSON, chỉ nhận `page` chữ thường và token hex; Index in bằng `<?!= ?>` |
| 2 | Ảnh chuyển khoản: nếu trình duyệt không báo đọc ảnh xong, nút Gửi treo mãi | Khách tưởng web lỗi | Sau 8 giây tự gửi file gốc |
| 3 | Buổi đã học nhưng tutor chưa xác nhận hiện chữ "Xác nhận" trong Lịch sử | Học viên hiểu nhầm | Hiện "Chờ tutor xác nhận" (U17) |
| 4 | Ghi chú hạn tuần của tutor luôn ghi "this week" kể cả khi xem tuần sau | Tutor nhìn nhầm hạn | Ghi "Deadline for the week of dd/mm" |
| 5 | Nhãn trạng thái trong hộp thoại kết quả đặt lịch kéo dài hết dòng; chữ tiếng Việt in bằng font đơn cách bị vỡ dấu khi font Google chưa tải | Xấu, khó đọc | Nhãn co theo chữ; chỉ số và giờ dùng font đơn cách |

---


*Chạy lúc 14:39:31 5/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 11 | 11 | 0 |
| Giao diện web (jsdom + backend thật) | 17 | 17 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán ngẫu nhiên trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ Zalo và số admin dạng chữ | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập dùng lần 2: báo lỗi dễ hiểu và nút xin link mới | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả sau buổi học: nút Completed ghi COMPLETED | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK4.md -->

---

## `v8/reports/REPORT_CHUNK5.md`

*Ngày tạo trong Project: 2026-10-05T08:42:08Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5.md | bytes=17198 | sha256=00628b5d6f603220a14c6e39bed3381f36c09fcc7ef979157c527ad00f9cae1e | created=2026-10-05T08:42:08Z -->
# Thaiput v8 · Báo cáo chunk 5 (soát độc lập, sửa lỗi, đóng gói chạy thử)

*Ngày 05/10/2026. Phần đầu là kết quả riêng của chunk 5, phần sau là báo cáo đầy đủ do `npm test` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 đạt |
| 40 kịch bản file 03 | 40/40 đạt |
| Tích hợp | 21/21 đạt (10 test mới: I12 đến I21) |
| Giao diện web | 17/17 đạt |
| Soát code độc lập (2 lượt, người soát không viết code) | Lượt 1: 2 nghiêm trọng, 3 cao, 3 trung bình, 4 thấp. Lượt 2 kiểm lại bản sửa: 3 trung bình, 3 thấp. Đã sửa tất cả trừ 2 mục ghi ở cuối |
| Thử phá code chunk 5 | 10/10 lỗi cài cố ý bị test bắt (1 lần cài thêm cho thấy lớp bảo vệ thứ hai đang che, đúng thiết kế) |
| Bản dán tay `dist/Code.gs` | Kiểm cú pháp đạt; test I19 cài đặt và mở trang web từ chính bản này |
| Demo trên Chromium 390px, sáng và tối | 0 lỗi JavaScript |

## Lỗi do người soát độc lập tìm ra và cách sửa

Bộ giả lập cũ "dễ tính" hơn Google ở 2 chỗ nên test xanh mà không lộ lỗi. Đã sửa bộ giả lập trước, cho lỗi hiện đỏ, rồi mới sửa code.

| # | Mức | Lỗi | Hậu quả trên Google thật | Sửa | Test |
|---|---|---|---|---|---|
| 1 | Nghiêm trọng | Ghi vượt 1.000 hàng của tab | Cài đặt lần đầu chết ngay; vài tuần sau mọi thao tác ghi đều lỗi | Tab tự thêm 500 hàng khi sắp đầy, kèm dropdown; Setup định dạng đúng số hàng có thật | I13, I01 |
| 2 | Nghiêm trọng | Người lạ gọi được hàm menu và job qua trang web | Xoá trigger, chuyển sang PRODUCTION, xoá bản sao lưu, spam email tutor | `requireOperator_`: chỉ trigger của project, chủ script hoặc admin; cài đặt và tạo trigger chỉ chủ file | I12 |
| 3 | Cao | Chữ người dùng bắt đầu bằng `=` thành công thức trong Sheets | Lộ email, số điện thoại học viên ra ngoài khi admin mở file | Cột chữ dạng `@` cho mọi ô người dùng nhập; cột khác tự thêm dấu nháy | I14 |
| 4 | Cao | Gửi email lỗi sau khi đã ghi | Học viên thấy "có lỗi" dù buổi đã đặt; hết hạn mức thì không ai đăng nhập được; job lỗi đốt hạn mức | Gửi lỗi ghi `MAIL_FAILED`, không ném; email lỗi cho admin 1 lần mỗi giờ; "đang bận" không email | I15, I17 |
| 5 | Cao | Form đăng ký công khai không giới hạn | Máy spam gửi email hàng loạt từ Gmail của trường | Tối đa 20 đăng ký mỗi giờ, ô ẩn bẫy máy, giới hạn độ dài | I17 |
| 6 | Trung bình | Ghi log ngoài khoá dùng số hàng cũ | Mất dòng ACTIVITY_LOG, MAIL_LOG | Ghi ngoài khoá tự lấy khoá ngắn; xoá cache khi ra khỏi khoá | I13, toàn bộ kịch bản |
| 7 | Trung bình | Giữ khoá lâu khi tutor lưu nhiều slot | Học viên khác bị "hệ thống bận" | Gom dòng mới, ghi một lần: 192 slot từ 960 lần ghi còn 12 | I16 |
| 8 | Trung bình | Link đăng nhập có thể là link `/dev` hoặc link Google Sites | Học viên bấm link trong email không vào được | Chỉ nhận link `/exec`; Kiểm tra hệ thống báo lỗi nếu sai | I18 |
| 9 | Thấp | Link Meet đôi khi tạo chậm | Email xác nhận thiếu link Meet | Đọc lại 1 lần; email nhắc tự điền link còn thiếu | các kịch bản C |
| 10 | Thấp | Học viên chưa có số điện thoại (từ v6) không gia hạn và không đổi tên được | Kẹt ở tab Tài khoản | Ô số điện thoại trong form gia hạn; bỏ trống không chặn lưu tên | U11, U12 |
| 11 | Thấp | "Vắng tutor" áp được cho buổi đã huỷ | Slot tutor bị giữ nhầm | Chặn buổi đã huỷ | F40 |
| 12 | Thấp | Server không giới hạn ngày đặt xa | Gọi thẳng API để đặt xa, dời ngày bắt đầu gói | Tối đa 28 ngày (`BOOKING_HORIZON_DAYS`) cho đặt lịch và mở slot | I17 |
| 13 | Trung bình (lượt 2) | Thư mời Calendar gửi trước khi dòng BOOKINGS ghi xuống Sheets | Lần chạy bị dừng đột ngột để lại thư mời không có buổi | Ghi dòng đang gom ngay trước khi gọi Calendar | I21 |
| 14 | Trung bình (lượt 2) | Admin khác chủ file bấm "Tạo lại trigger" tạo bộ trigger thứ hai | Dropdown xử lý 2 lần (đổi tutor 2 lần), email nhắc trùng | Chỉ chủ file chạy cài đặt và tạo trigger; dropdown BOOKINGS "nhận việc" trong khoá, lần chạy thứ hai bỏ qua | I12, F40 |
| 15 | Trung bình (lượt 2) | Chờ link Meet tới 3 giây mỗi buổi trong khoá | Đặt 14 buổi giữ khoá thêm 40 giây | Chỉ chờ 1 lần mỗi lần chạy, 1 giây | |
| 16 | Thấp (lượt 2) | Email lỗi gửi hỏng vẫn bị đánh dấu đã gửi | Lỗi bị im 1 giờ | Chỉ đánh dấu khi gửi được | I15 |

## Thử phá code chunk 5

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| N1 | Bỏ tự thêm hàng | I13 |
| N2 | Bỏ thêm dấu nháy cho cột không phải chữ | I14 |
| N3 | Bỏ cột chữ của REGISTRATIONS | Không đỏ: lớp dấu nháy (N2) vẫn chặn được, đúng thiết kế 2 lớp |
| N4 | Bỏ chặn ở reminderJob | I12 |
| N5 | Email lỗi ném ra ngoài | I15, B15 |
| N6 | Ghi từng dòng như cũ | I16 (960 lần ghi) |
| N7 | "Đang bận" vẫn email admin | I17 |
| N8 | Ai đăng nhập Google cũng là admin | I12 |
| N9 | Bỏ ghi dòng trước khi gửi thư mời | I21 |
| N10 | Bỏ "nhận việc" dropdown | F40 |
| N11 | Bỏ giới hạn chỉ chủ file | I12 |

## Chưa sửa (đã cân nhắc)

1. **Tab AUTH không tự dọn dòng cũ.** Khoảng 100 dòng mỗi tháng với 50 học viên; đọc vẫn nhanh trong 1 đến 2 năm. Khi cần, thêm dọn trong dailyJob.
2. **Mỗi lần gọi API đọc cả tab.** Ổn với quy mô hiện tại (vài nghìn dòng). Khi BOOKINGS vượt khoảng 20.000 dòng, nên chuyển dòng cũ sang tab lưu trữ.
3. **Một số điểm chỉ kiểm được trên Google thật:**
   * ô có dấu nháy và ô dạng `@` giữ `=...` nguyên văn;
   * Meet trên Gmail thường có bắt chờ duyệt không;
   * Safari giữ đăng nhập.

   Cả ba đã đưa vào hướng dẫn chạy thử mục 7.

---


*Chạy lúc 15:40:36 5/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 21 | 21 | 0 |
| Giao diện web (jsdom + backend thật) | 17 | 17 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán ngẫu nhiên trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ Zalo và số admin dạng chữ | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập dùng lần 2: báo lỗi dễ hiểu và nút xin link mới | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả sau buổi học: nút Completed ghi COMPLETED | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5.md -->

---

## `v8/reports/REPORT_CHUNK5A.md`

*Ngày tạo trong Project: 2026-10-12T17:57:05Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5A.md | bytes=15248 | sha256=04f45af3d73ae6dcd424b823e8dfb691090265c13f61cf4bb32db09ab4cbcd72 | created=2026-10-12T17:57:05Z -->
# Thaiput v8 · Báo cáo sub-chunk 5A (đăng nhập, phiên, quyền, dữ liệu nền)

*Ngày 13/10/2026. Phiên bản 8.0.2. Phần sau là báo cáo đầy đủ do `npm test` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Đã sửa A02, A05, C25 theo quyết định mới của anh; file 01 và 03 có ghi chú "[đổi 13/10]" |
| Tích hợp | 27/27 (mới: I24 đến I27) |
| Giao diện web | 19/19 (mới: U19; sửa U01, U03, U05, U11) |
| Thử phá code | 7/7 lỗi cài cố ý bị bắt. Lần thứ 8 (trả số điện thoại admin ra web) không đỏ, đúng thiết kế: giao diện không còn đọc số này |

## Đã làm

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | 2 đến 3 admin ngang quyền | `ADMIN_EMAIL` nhận nhiều địa chỉ, cộng mọi tài khoản role ADMIN trong USERS; menu **Thêm admin**; mọi email hệ thống gửi tất cả admin trong 1 email | I24 |
| 2 | Link đăng nhập dùng nhiều lần trong 15 phút | `LOGIN_LINK_MAX_USES` (0 = không giới hạn, mặc định); cột mới `use_count` trong AUTH | A05, U05 |
| 3 | Xin link quá nhiều: thử lại sau 5 phút | 3 lần mỗi 5 phút (`LOGIN_LINK_WINDOW_MINUTES`) | A06, I27 |
| 4 | Làm mới trang sau khi vào bằng link không mất đăng nhập | Vào xong, địa chỉ trang tự bỏ mã link; link hết lượt mà tab còn phiên thì vào thẳng | U05 |
| 5 | Mỗi tab đăng nhập một tài khoản | Phiên riêng từng tab, tab mới dùng phiên gần nhất; đăng xuất tab này không đăng xuất tab khác | U19 |
| 6 | Gửi link đăng nhập hàng loạt | Menu **Gửi link đăng nhập (các dòng đang chọn ở USERS)**: chọn nhiều dòng hoặc nhiều vùng | I26 |
| 7 | Số điện thoại không bắt buộc | Nhận trống, số Việt Nam, số nước ngoài có `+` và mã nước. Nút Zalo trong Sheets chỉ với số Việt Nam | A02, I27, U03 |
| 8 | Chia tutor xoay vòng | Nhóm ít buổi nhất tuần, người lâu nhất chưa được giao được chọn trước; không còn ngẫu nhiên | C25, U25 |
| 9 | Slot tutor xin huỷ (đã có học viên, được duyệt) không ai đặt được | Trạng thái BLOCKED: không là ứng viên, tutor không tự mở lại (báo `SLOT_BLOCKED`), cổng tutor hiện ô gạch đỏ | I25 |
| 10 | Bỏ nút gọi điện | Web và email chỉ còn Zalo và website | U01, I27 |
| 11 | Bấm logo về trang chủ | Logo "thaiput" là nút về trang chủ, vẫn giữ đăng nhập | xem demo |
| 12 | Đổi chữ "Xin link mới" | "Yêu cầu gửi lại liên kết đăng nhập mới" ở web, email, câu báo lỗi | A05, U05 |

## Thử phá code

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| P1 | Chọn tutor ngẫu nhiên lại | U25 |
| P2 | Duyệt huỷ không khoá slot | I25 |
| P3 | Tutor mở lại được slot BLOCKED | I25 |
| P4 | Bỏ admin trong USERS khỏi danh sách nhận | I24 |
| P5 | Link chỉ dùng 1 lần như cũ | A05, U05 |
| P6 | Mọi tab dùng chung một phiên | U19 |
| P7 | Không bỏ mã link khỏi địa chỉ | U05 |

---


*Chạy lúc 00:56:09 13/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 27 | 27 | 0 |
| Giao diện web (jsdom + backend thật) | 19 | 19 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Nhiều admin ngang quyền: ADMIN_EMAIL nhiều địa chỉ cộng USERS role ADMIN cùng nhận một email; thêm admin bằng menu | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả sau buổi học: nút Completed ghi COMPLETED | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5A.md -->

---

## `v8/reports/REPORT_CHUNK5B.md`

*Ngày tạo trong Project: 2026-10-13T14:09:38Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5B.md | bytes=4061 | sha256=a86a8204e62282557e4ad203067faf1d38dd3d9d233f6c44333809beef568524 | created=2026-10-13T14:09:38Z -->
# Thaiput v8 · Báo cáo sub-chunk 5B (thông báo theo mức, job, chịu tải)

*Ngày 13/10/2026. Phiên bản 8.0.3, giao cùng 8.0.4 (5C) trong một lần dán. Kết quả chạy đầy đủ mới nhất: cuối file `REPORT_CHUNK5C.md`.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Sửa cách kiểm, không sửa kết quả mong đợi: F39 kiểm email tổng hợp 21:05 thay cho email từng buổi; E33 lọc lượt sửa sự kiện có gửi thư (lượt đầu giờ là lượt thêm admin không gửi thư) |
| Tích hợp | I24 viết lại theo mô hình 1 địa chỉ admin; mới I28 đến I34; I21 đổi kỳ vọng [2,2] vì thêm cột |
| Thử phá code | **8/8** lỗi cài cố ý bị bắt (B1 đến B8 dưới đây). Lần đầu B8 lọt, em thêm kiểm tra vào I28 rồi chạy lại: bắt được |
| Đo tải | `test/tools/load_profile.js` (mới): số lần đọc, số ô đọc, số lần ghi, số lần gọi Calendar, số người nhận email cho từng thao tác, sau 1 và 12 tháng dữ liệu |

## Đã làm

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | Email chỉ tới 1 admin hoặc nhóm admin@ | `adminEmails_()` chỉ trả CONFIG `ADMIN_EMAIL`. USERS role ADMIN có quyền, không nhận email; admin dự phòng để DISABLED | I24 |
| 2 | Thông báo theo mức | Tab NOTIFICATIONS (mọi sự kiện) và NOTIFY_RULES (14 sự kiện, mức CRITICAL, WARNING, INFO; kênh EMAIL, DIGEST, LOG; admin sửa được) | I28 |
| 3 | Việc bình thường không email từng cái | Completed, tự hoàn thành, đổi tutor, học viên vắng: vào email tổng hợp lúc `DIGEST_HOUR` (21:00). Lỗi kỹ thuật, huỷ, lỗi hệ thống, đăng ký mới: email ngay | I28, F39 |
| 4 | Link trong email admin mở đúng dòng | `rowLink_`: mở đúng tab, đúng dòng trong Sheets | I28, I34 |
| 5 | Nhắc 8:00 sáng ngày học | Mỗi học viên, mỗi tutor 1 email liệt kê buổi trong ngày; cột `day_reminder_at` chống gửi trùng; buổi đã bắt đầu bỏ qua | I29 |
| 6 | Báo admin khi tutor chưa mở lịch tuần sau | Chủ nhật sau `TUTOR_DEADLINE_HOUR`: 1 thông báo liệt kê tutor chưa mở | I30 |
| 7 | Admin luôn vào được phòng Meet | Thêm `ADMIN_EMAIL` làm khách của sự kiện mà không gửi thư (`sendUpdates: 'none'`); tắt bằng `ADMIN_JOIN_MEET = FALSE` | I33, E33 |
| 8 | Tutor xin huỷ: 4 lựa chọn, thấy kết quả | Dropdown: tự chọn tutor thay, chỉ định tutor thay (mã ở `admin_note`), huỷ buổi, từ chối. Cột `outcome` ghi kết quả | I31 |
| 9 | Tô màu việc chờ xử lý | Đỏ, vàng, xanh, xám trên NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS; ô tick `read` | I34 |
| 10 | Chịu tải | Đặt lịch chia 3 pha: khoá (ghi buổi) → ngoài khoá (Calendar) → khoá ngắn (ghi mã sự kiện; buổi bị huỷ giữa chừng thì gỡ sự kiện). Mỗi lần đặt 1 thông báo BOOKED | I32 |

## Thử phá code

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| B1 | Admin trong USERS lại nhận email | I24, kịch bản liên quan |
| B2 | Bỏ qua tab NOTIFY_RULES | I28 |
| B3 | Gọi Calendar khi đang giữ khoá | I32 |
| B4 | Nhắc sáng không đánh dấu, gửi trùng | I29 |
| B5 | Cảnh báo Chủ nhật nêu cả tutor đã mở lịch | I30 |
| B6 | Thêm admin vào Meet có gửi thư mời | I33, E33 |
| B7 | "Chỉ định tutor thay" bỏ qua `admin_note` | I31 |
| B8 | Email tổng hợp không đánh dấu, hôm sau gửi lại tin cũ | I28 (thêm sau lần đầu lọt) |

## Chưa kiểm được ở đây
* Thêm khách vào sự kiện Calendar mà không gửi thư: giả lập đạt; trên Google thật cần anh xem hộp thư `ADMIN_EMAIL` không có thư mời mới khi học viên đặt buổi.
* Tô màu và ô tick: tạo bằng API Sheets thật; giả lập chỉ kiểm công thức.

<!-- END FILE: v8/reports/REPORT_CHUNK5B.md -->

---

## `v8/reports/REPORT_CHUNK5C.md`

*Ngày tạo trong Project: 2026-10-13T14:09:39Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5C.md | bytes=19166 | sha256=99a62ece04c2651aa0c961e1fdfbacf6286a1407482fc2277559bb5c38a1ca1f | created=2026-10-13T14:09:39Z -->
# Thaiput v8 · Báo cáo sub-chunk 5C (chữ web và email chỉnh trên Sheets, song ngữ)

*Ngày 13/10/2026. Phiên bản 8.0.4. Phần sau là báo cáo đầy đủ do `npm test` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. A05: đổi cách kiểm từ "bằng đúng câu tiếng Việt" sang "bắt đầu bằng câu tiếng Việt", vì trang đăng nhập nay hiện thêm câu tiếng Anh cho tutor. Kết quả mong đợi trong file 03 ("báo link đã dùng") giữ nguyên |
| Tích hợp | 41/41 (mới: I35 đến I41; I27 đổi cách kiểm như A05) |
| Giao diện web | 20/20 (mới: U20) |
| Thử phá code | **14/14** lỗi cài cố ý bị bắt (Q1 đến Q14 dưới đây) |
| Ảnh chụp demo | Trang chủ, cổng học viên, cổng tutor dựng đúng, không lộ key, nút Zalo nổi đúng chỗ |

## Đã làm

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | Chữ trên web chỉnh trên Sheets | Tab CONTENT: 182 dòng chữ giao diện (trang chủ, đăng nhập, cổng học viên, cổng tutor). Sửa cột `value`, bấm menu cập nhật, tải lại trang | U20, I39 |
| 2 | Câu báo lỗi cũng chỉnh được | 60 dòng `r.MÃ` (học viên, tiếng Việt) và `re.MÃ` (tutor, tiếng Anh). Trang đăng nhập hiện cả hai thứ tiếng | I41 |
| 3 | Email song ngữ, chỉnh được | Tab EMAIL_TEMPLATES: 24 mẫu, mỗi mẫu tiêu đề và nội dung tiếng Việt, tiếng Anh. Học viên: tiếng Việt trên. Tutor: tiếng Anh trên | I35, I36, I37 |
| 4 | Bấm cập nhật là áp dụng | Menu "Cập nhật nội dung web và email": xoá bộ nhớ đệm, kiểm lỗi, báo cảnh báo. Không bấm thì tự áp dụng sau tối đa 5 phút | I39, U20 |
| 5 | Cách kiểm tra khả năng sửa | Menu "Gửi thử một mẫu email cho tôi" với dữ liệu minh hoạ; cảnh báo biến sai tên, key lạ, mẫu mất nút có trong mẫu gốc | I35, I38 |
| 6 | Chừa chỗ email marketing | Thêm dòng mới, audience MARKETING, gửi thử được ngay | I38 |
| 7 | Tắt một email | Cột `active` = FALSE: không gửi, ghi nhật ký `MAIL_TEMPLATE_OFF` | I37 |
| 8 | Ẩn một câu, bỏ nửa tiếng Anh | Ô chỉ ghi dấu `-` là cố ý để trống; ô trống là dùng mẫu gốc | I36, U20 |
| 9 | Nút Zalo ở góc | Nút nổi góc dưới phải mọi trang khi CONFIG có `ADMIN_ZALO_URL` | ảnh chụp demo |
| 10 | Cổng tutor toàn tiếng Anh | Chữ chung (mất mạng, hết phiên, đóng) có bản `_en` trên cổng tutor | U20 |
| 11 | Công tắc bớt email (thêm, theo mô phỏng tải) | `MORNING_REMINDER_HOUR = -1` tắt nhắc 8:00; `DIGEST_HOUR = -1` tắt email tổng hợp | I40 |
| 12 | Sửa lỗi nhỏ phát hiện khi soát | Hàm tính chữ cột tô màu hỏng khi bảng quá 26 cột (chưa xảy ra, BOOKINGS đang 19 cột); câu báo "Thêm admin" còn ghi "nhận mọi email" | chạy lại I34 |

## Thử phá code

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| Q1 | Bỏ qua tab CONTENT | I39, U20 |
| Q2 | Chữ trong ô email không thoát HTML | I36 |
| Q3 | Bỏ qua cột active | I37 |
| Q4 | Bỏ qua dòng EMAIL_TEMPLATES | I36, I37, I38 |
| Q5 | Nút cập nhật không xoá bộ nhớ đệm | I36, I39 |
| Q6 | Email tutor không để tiếng Anh trên | I37 |
| Q7 | Dấu `-` không ẩn | I36 |
| Q8 | Trang web không đọc chữ từ máy chủ | U08 đến U20 |
| Q9 | Kiểm tra không báo biến lạ | I38 |
| Q10 | `-1` không tắt nhắc sáng | I40 |
| Q11 | `-1` không tắt tổng hợp | I40 |
| Q12 | Tutor nhận câu lỗi tiếng Việt | I41 |
| Q13 | Câu lỗi không đọc tab CONTENT | I41 |
| Q14 | Cổng tutor không dùng chữ chung tiếng Anh | U20 |

## Giới hạn đã biết
* Chữ trong CONTENT được hiện **dạng HTML** (để giữ được chữ đậm, xuống dòng). Ai có quyền sửa file Sheets là chèn được thẻ HTML vào trang. Người có quyền sửa file vốn đã toàn quyền, nên không thêm rủi ro mới, nhưng phải sửa cẩn thận.
* Câu trong tab CONFIG, PACKAGES (tên gói) và nhãn trạng thái buổi học do máy chủ trả (ví dụ "Chờ tutor xác nhận") chưa đưa vào CONTENT. Tên gói sửa ở PACKAGES như cũ. Nhãn trạng thái đưa vào ở 5E cùng giao diện admin.
* Kích thước `Code.gs` 235 KB. Các bản trước dán chạy được; Google không công bố giới hạn kích thước từng file mà em xác minh được, nên em ghi nhận để theo dõi. 5G chia lại thành nhiều file.

---

# Thaiput v8 · Báo cáo test

*Chạy lúc 21:07:43 13/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 41 | 41 | 0 |
| Giao diện web (jsdom + backend thật) | 20 | 20 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |
| I28 | Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực | Đạt |
| I29 | Nhắc buổi sáng: mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua | Đạt |
| I30 | Chủ nhật sau 15:00: admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên | Đạt |
| I31 | Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên | Đạt |
| I32 | Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ | Đạt |
| I33 | Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm | Đạt |
| I34 | Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng | Đạt |
| I35 | Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử | Đạt |
| I36 | Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML | Đạt |
| I37 | Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên | Đạt |
| I38 | Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ | Đạt |
| I39 | Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật | Đạt |
| I41 | Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi | Đạt |
| I40 | MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả sau buổi học: nút Completed ghi COMPLETED | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |
| U20 | Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5C.md -->

---

## `v8/reports/REPORT_CHUNK5D.md`

*Ngày tạo trong Project: 2026-10-15T15:32:23Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5D.md | bytes=6987 | sha256=79d35e161dd92d4e5ad0b829b3b79e83425ac66a390f7297f7c6e105ff021ca0 | created=2026-10-15T15:32:23Z -->
# Thaiput v8 · Báo cáo sub-chunk 5D (đăng nhập chuyên nghiệp cho tutor và admin)

*Ngày 15/10/2026. Phiên bản 8.0.5, giao cùng 5E (8.0.6) trong một lần dán. Báo cáo `npm test` đầy đủ ở cuối `REPORT_CHUNK5E.md` (một lần chạy cho cả hai).*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Không sửa kết quả mong đợi nào trong file 03. A04 nay đọc công thức gốc của ô (mock trả chữ hiển thị như Google thật); E33 lọc bỏ email "Có đăng nhập mới" của admin khi đếm email |
| Tích hợp | 60/60 (của 5D: I42 đến I46, I52, I54, I55, I59, một phần I60) |
| Giao diện web | 26/26 (của 5D: U23, U24) |
| Thử phá code | Vòng 1 lúc viết: 42/42 (5D và 5E). Vòng 2 sau sửa: 15/15. **Chạy lại toàn bộ trên code cuối cùng** (bản sao riêng, không đụng `src/`): 41/41 bắt được; D10 không còn áp dụng (xem dưới) |
| Soát độc lập | 2 vòng, 5 agent riêng biệt (vòng 1: bảo mật, đúng sai, chất lượng test; vòng 2: kiểm lại bản sửa, trải nghiệm người dùng nhìn mới) |

## Đã làm

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | Link tutor và admin dùng 1 lần | `STAFF_LOGIN_LINK_MAX_USES = 1`. Học viên giữ dùng nhiều lần trong 15 phút | I42 |
| 2 | Phiên dài theo vai trò | Tutor 90 ngày, admin 30 ngày, học viên 30 ngày | I42 |
| 3 | Email "Có đăng nhập mới" | Mẫu `STAFF_NEW_LOGIN` song ngữ (tutor tiếng Anh trên), ghi giờ và thiết bị dạng "Chrome · Windows" | I42 |
| 4 | Thiết bị và "Thoát mọi thiết bị" | Tab Account (tutor), tab Tài khoản (học viên) | I43, U23 |
| 5 | Số buổi đã dạy cho tutor | Tháng này, tháng trước, cùng hàm `countPayroll_` với báo cáo lương | I46, U23 |
| 6 | Mỗi kết quả buổi học ghi mã phiên | ACTIVITY_LOG `SESSION_RESULT` có `session` | I46 |
| 7 | Bộ nhớ đệm phiên | `sessionLookup_`, 120 giây, mốc `ct` và dấu huỷ `rev_<uid>`; API không đọc AUTH mỗi lần | I43 |
| 8 | Dọn AUTH | Mỗi ngày từ 03:00, bỏ dòng hết hạn quá 7 ngày, giữ công thức | I44 |
| 9 | Khoá tài khoản là thoát ngay | onEdit USERS `status = DISABLED` gọi `logoutAll_`; job mỗi giờ huỷ hẳn phiên; mở lại không hồi sinh phiên cũ | I54, I60 |
| 10 | Đăng nhập Google (anh đồng ý thử 2.5) | Dự án phụ chạy dưới quyền người dùng, ký HMAC SHA 256 `email|ts`; dự án chính kiểm chữ ký, 2 phút, 1 lần (Script Property `GL_USED`), vai trò `GOOGLE_LOGIN_ROLES` | I45, I52, U24 |
| 11 | Chống phá từ ngoài (luật 37) | Link lạ, mã lạ, email lạ, form rác, chữ ký sai: không ghi Sheets, không lấy khoá, chỉ đếm trong bộ đệm | I45, I59 |
| 12 | Dán code mà quên chạy menu 1 | Cột `device` khai báo `optional`; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được | I55 |
| 13 | Tắt email nhắc 8:00 (anh chốt 15/10) | `MORNING_REMINDER_HOUR = -1`; file đang chạy có 8 tự đổi thành -1 một lần (`MIG_MORNING_OFF`) | I56 |

## Soát độc lập: lỗi tìm thấy ở phần 5D và cách sửa

| Vòng | Lỗi | Mức | Sửa |
|---|---|---|---|
| 1 | Chữ ký Google sai được ghi ACTIVITY_LOG: kẻ lạ làm đầy nhật ký | Cao | Chỉ đếm trong CacheService, không ghi, không khoá |
| 1 | Khoá tài khoản DISABLED nhưng phiên vẫn sống tới khi hết hạn | Cao | `revokeDisabledSessionsInLock_` chạy đầu job mỗi giờ, onEdit USERS |
| 1 | Thoát xong, một lần gọi song song ghi lại phiên cũ vào bộ đệm | Cao | `forgetSessions_` sau khi ra khỏi khoá, mốc `ct`, dấu huỷ theo người (luật 35) |
| 1 | Chống dùng lại đăng nhập Google chỉ dựa vào bộ đệm (mất bộ đệm là dùng lại được) | Cao | Lưu vào Script Property `GL_USED` |
| 1 | Thứ tự cập nhật cũ (triển khai trước, menu 1 sau) làm hỏng đăng nhập vì thiếu cột | Cao | Cột `optional`, thứ tự mới ghi vào luật 38 và hướng dẫn |
| 1 | So chữ ký không đều thời gian | Thấp | `sameString_` |
| 2 | Tham số không phải chữ làm sập hàm công khai | Trung bình | `str_()` chặn ở đầu |
| 2 | Endpoint công khai vẫn lấy khoá với đầu vào sai | Trung bình | Kiểm trước ngoài khoá (exchange, logout, xin link, đăng ký) |
| 2 | Giới hạn dò chữ ký chặn luôn người có chữ ký đúng | Trung bình | Kiểm chữ ký trước, chỉ chữ ký sai mới bị đếm |
| 2 | `requireOwner_` cho qua khi không xác định được chủ file | Cao | Từ chối (fail closed) |
| 2 | Câu đăng nhập (đã gửi, đang vào, lỗi) chỉ tiếng Việt | Thấp | Song ngữ qua CONTENT |
| 2 | Chưa có câu báo khi tài khoản Google chưa được cấp quyền | Thấp | `GLOGIN_DENIED` kèm email |

## Thử phá code (phần 5D)

Cột "Test bắt" lấy từ lần chạy lại cuối trên code đã sửa xong. D11, D13 viết lại cho khớp code mới (neo cũ đổi ở vòng 2) và vẫn bị bắt.

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| D1 | Link tutor dùng nhiều lần | I42 |
| D2 | Thoát không xoá bộ đệm | I43 |
| D3 | Thoát mọi thiết bị không xoá bộ đệm | I43, I54, I60, U23 |
| D4 | Bộ đệm bỏ qua tài khoản DISABLED | I43 |
| D5 | Google không kiểm hạn 2 phút | I45 |
| D6 | Google dùng lại được | I45 |
| D7 | Google bỏ qua vai trò, trạng thái | I45 |
| D8 | Dọn AUTH xoá cả phiên còn hạn | I44 |
| D9 | Không gửi email đăng nhập mới | I42 |
| D10 | Bỏ giới hạn dò chữ ký | Không còn áp dụng: vòng soát 2 bỏ hẳn việc chặn theo số lần dò (vì nó chặn luôn admin thật). Thay bằng S12 "chữ ký đúng không bị chặn", bắt bởi I45 |
| D11 | Chữ ký sai lại ghi nhật ký | I45 |
| D12 | Bỏ mốc thoát trong bộ đệm | I54 |
| D13 | Job không huỷ phiên DISABLED | I54 |
| D14 | Không giới hạn 6 giờ bộ đệm | I54 |
| O1 | Cột mới bắt buộc ngay | I55 |
| O2 | Thiếu NOTIFICATIONS làm hỏng | I55 |

## Chỉ kiểm được trên Google thật
1. Đăng nhập Google: màn hình cấp quyền, cảnh báo "chưa xác minh", trình duyệt nhiều tài khoản Google (xem mục 3.2 `CHUNK5D_GIAI_THICH.md`).
2. Bộ nhớ đệm hết hạn đúng 120 giây: mock không mô phỏng thời gian sống của bộ đệm.
3. Chuỗi thiết bị thật từ trình duyệt điện thoại.

## Chấp nhận, chưa sửa
* Apps Script không cho biết địa chỉ IP: email đăng nhập mới chỉ có trình duyệt và hệ điều hành.
* Sửa tay dòng AUTH có hiệu lực sau tối đa 120 giây (bộ đệm).

<!-- END FILE: v8/reports/REPORT_CHUNK5D.md -->

---

## `v8/reports/REPORT_CHUNK5E.md`

*Ngày tạo trong Project: 2026-10-15T15:32:24Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5E.md | bytes=28367 | sha256=4707d9e984a92541caa2da10ce100aed92b2ab47e4934647c23ae816d36381ef | created=2026-10-15T15:32:24Z -->
# Thaiput v8 · Báo cáo sub-chunk 5E (giao diện admin trên web, menu xoá dữ liệu test)

*Ngày 15/10/2026. Phiên bản 8.0.6. Phần sau là báo cáo đầy đủ do `npm test` sinh ra (một lần chạy cho cả 5D và 5E).*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40 |
| Tích hợp | 60/60 (của 5E: I47 đến I51, I53, I56 đến I58, I60) |
| Giao diện web | 26/26 (của 5E: U21, U22, U25, U26) |
| Thử phá code | Vòng 1: 42/42 (5D và 5E). Vòng 2: 15/15 (S1 đến S15). Chạy lại vòng 1 trên code cuối cùng: 41/41 (D10 không còn áp dụng) |
| Soát độc lập | 2 vòng, 5 agent riêng biệt |
| Bản dán | `dist/Code.gs` 300 KB, `dist/Index.html` 99 KB (7 file giao diện), `dist_google_login/` |
| Ảnh chụp demo | Điện thoại và máy tính: không lỗi JavaScript, không cuộn ngang; đặt thay, chi tiết người, hộp thoại huỷ hiển thị đúng |

## Đã làm

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | Giao diện admin trên web | `ui/Admin.html`: ô số liệu (2 ô mở thẳng tab Sheets), thông báo lọc theo mức và người, chi tiết, đánh dấu đã đọc theo lô | I47, U21 |
| 2 | Xem theo tutor và học viên | Danh sách, chi tiết: gói, sắp tới, lịch sử, thông báo, thiết bị, số buổi tháng | I47, U25 |
| 3 | Đặt thay | Bỏ qua hạn đặt và `BOOKING_ENABLED`, chọn tutor; giữ luật 1 buổi/ngày, gói, slot khoá, trùng giờ. Báo trước khi chưa có gói hoặc đang khoá | I48, U22 |
| 4 | Huỷ trên web | Lý do ghi Sheets, trả buổi, thông báo `ADMIN_CANCELLED`; từ chối buổi đã bắt đầu hoặc đã huỷ | I49, U22 |
| 5 | Nhật ký | Tìm theo email, mã buổi, hành động | U22 |
| 6 | Thoát mọi thiết bị của một người | Nút trong trang chi tiết | I54, U25 |
| 7 | Menu xoá dữ liệu test 2 bước (anh yêu cầu 15/10) | `resetTestData_`: khoá `ALLOW_DATA_RESET`, câu xác nhận có môi trường và mức, sao lưu trước, gỡ sự kiện tương lai không gửi thư, mọi phiên hết hiệu lực; PRODUCTION chỉ chủ file | I50, I53, I56 |
| 8 | Co-founder vào Meet không nhận thư Calendar | Khách admin thêm với `sendUpdates: 'none'`, bỏ chủ sự kiện, gỡ trước thư huỷ và thư đổi tutor | I51, I57 |
| 9 | Nhãn trạng thái buổi cho học viên chỉnh trên Sheets | Khoá CONTENT `st.*` | I60 |
| 10 | Lỗi cũ lộ ra khi soát | Sắp xếp gói ACTIVE = 0 làm thẻ chính hiện gói hết hạn (có từ cổng học viên trước 5E) | U26, I60 |

## Soát độc lập: lỗi tìm thấy ở phần 5E và cách sửa

| Vòng | Lỗi | Mức | Sửa |
|---|---|---|---|
| 1 | Menu xoá chạy được trên PRODUCTION | Nghiêm trọng | `ALLOW_DATA_RESET` mặc định FALSE, `switchToProduction` ghi FALSE, PRODUCTION chỉ chủ file |
| 1 | Xoá không trọn gói (lỗi giữa chừng để lại nửa dữ liệu, không có dấu vết) | Cao | Sao lưu trước, nhật ký `DATA_RESET_STARTED`, `forgetSessions_` trong finally |
| 1 | Xoá dòng làm mất công thức, bảng trong bộ nhớ còn dòng cũ | Cao | `purgeRows_` giữ công thức, nạp lại bảng tại chỗ |
| 1 | Co-founder nhận thư mời và thư huỷ Calendar | Cao | `sendUpdates: 'none'`, `stripAdminGuests_` |
| 1 | Link trong CONFIG có thể là `javascript:` | Cao | `T.safeUrl`, testSystem cảnh báo link không https |
| 1 | Liệt kê slot cho admin quét cả bảng mỗi ngày | Trung bình | `slotWindowData_` lọc trước |
| 1 | Đánh dấu đã đọc từng dòng; ô tick tạo dòng ảo | Trung bình | Ghi theo lô `setColumnForRows_`; dòng chỉ có FALSE coi là trống |
| 1 | Đếm đăng ký chờ sai; nút Huỷ hiện cả buổi đã qua | Trung bình | Đếm theo `processed_at`; `canCancel` chỉ buổi tương lai |
| 1 | Câu báo viết cứng trong code | Thấp | Chuyển vào CONTENT |
| 2 | Gỡ admin dựa vào cài đặt hiện tại: tắt `ADMIN_JOIN_MEET` là co-founder vẫn nhận thư huỷ | Cao | Gỡ mọi email admin, không phụ thuộc cài đặt |
| 2 | `POLICY_URL` không qua lọc link | Trung bình | `safeUrl` |
| 2 | Đặt thay mất tutor đã chọn khi tải lại slot; bấm 2 lần đặt 2 lần | Trung bình | Giữ lựa chọn, khoá nút khi đang gửi |
| 2 | Huỷ không có tiến trình, không chi tiết | Thấp | Hộp thoại có ngày, giờ, người, trạng thái đang xử lý |
| 2 | Bước 2 menu xoá không nói rõ mức đã chọn | Trung bình | Câu xác nhận chứa mức, gõ câu mức khác không xoá |
| 2 | Học viên chưa có gói: chọn slot xong mới báo | Thấp | Báo ngay từ đầu |
| 2 | Huỷ buổi đã huỷ báo lỗi mơ hồ | Thấp | Câu báo riêng |
| 2 | Số đếm cũ sau thao tác, đường cụt khi quay lại, "Đã đọc hết" không nói số lượng, gọi chồng nhau | Thấp | Làm mới khi quay lại, số lượng trong hộp thoại, bỏ kết quả cũ |

## Thử phá code

Vòng 1, phần 5E (26 lỗi; 16 lỗi của 5D ở `REPORT_CHUNK5D.md`). Cột "Test bắt" lấy từ lần chạy lại cuối; R2, G2, G3 viết lại cho khớp code mới và vẫn bị bắt:

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| E1 | API admin không kiểm vai trò | I47 |
| E2 | Đặt thay bỏ qua 1 buổi/ngày | I48 |
| E3 | Đặt thay cho slot đã bắt đầu | I48 |
| E4 | Đặt thay bỏ qua tutor chỉ định | I48, U22 |
| E5 | Đọc tất cả bỏ qua ALL | I47 |
| E6 | Tutor chỉ định chỉ cần tồn tại | I48 |
| E7 | Huỷ buổi đã bắt đầu | I49 |
| E8 | Đếm đăng ký chờ sai | I47 |
| E9 | Lọc theo mức hỏng | I47 |
| E10 | Thoát thiết bị người khác hỏng | I54, U25 |
| E11 | Thống kê tutor sai cột | I46 |
| R1 | Xoá không cần ALLOW_DATA_RESET | I50 |
| R2 | Xoá không cần câu xác nhận | I50, I53 |
| R3 | Xoá cả admin | I50 |
| R4 | Xoá gửi thư huỷ | I50 |
| R5 | Xoá không sao lưu | I50 |
| R6 | Xoá không huỷ phiên đệm | I50 |
| R7 | PRODUCTION ai cũng xoá được | I56 |
| R8 | Production không khoá menu xoá | I56 |
| R9 | Dọn mất công thức | I50 |
| R10 | Bảng cũ sau dọn | I58 |
| R11 | Không đổi nhắc 8:00 thành -1 | I56 |
| G1 | Admin Meet thêm cả chủ sự kiện | I51 |
| G2 | Không gỡ admin trước thư huỷ | I57 |
| G3 | Không gỡ admin khi đổi tutor | I57 (lần đầu LỌT; đã thêm kiểm vào I57, chạy lại bắt được) |
| U1 | Huỷ trên web mất lý do | U22 |

Vòng 2 (sau khi sửa lỗi lượt soát 2):

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| S1 | Sắp xếp gói học viên sai | U26 |
| S2 | Sắp xếp gói admin sai | I60 |
| S3 | Đặt thay quên tutor đã chọn | U22 |
| S4 | Đặt thay không khoá khi đang gửi | U22 |
| S5 | Khoá USERS không thoát thiết bị | I60 |
| S6 | Gỡ admin theo cài đặt hiện tại | I60 |
| S7 | Không rõ chủ file vẫn cho qua | I60 |
| S8 | Ô CONTENT `-` không ẩn | I60 |
| S9 | Link lạ lấy khoá | I59 |
| S10 | Form rác tính vào hạn mức | I17, I59 |
| S11 | `requireRole_` nhận object | I45 |
| S12 | Chữ ký đúng bị chặn khi bị dò | I45 |
| S13 | Câu xác nhận không có mức | I50, I53 |
| S14 | Huỷ lại không báo rõ | I60 |
| S15 | Không báo học viên chưa có gói | I60 |

Mock được sửa cho giống Google thật trong lúc làm (luật 14): `getValues` trả chữ hiển thị của ô HYPERLINK, gỡ sự kiện đã huỷ ném lỗi 410, file Sheets có chủ, `getUi` mô phỏng hộp thoại.

## Chấp nhận, chưa sửa (anh quyết)
| Việc | Vì sao chưa sửa | Khi nào |
|---|---|---|
| Trang chi tiết buổi đọc cả ACTIVITY_LOG | Chậm dần theo tháng, chưa ảnh hưởng ở quy mô hiện tại | 5G (lưu trữ hằng tháng) |
| Menu xoá không xoá ảnh chuyển khoản trong Drive | Xoá file Drive tự động là rủi ro mất dữ liệu thật nếu cấu hình sai thư mục | Anh xoá tay |
| Mã (S0001, B0001) có thể dùng lại sau khi xoá | Chỉ ảnh hưởng file test; PRODUCTION là file mới | Không sửa nếu go live trên file mới |
| Đăng nhập Google, admin vào Meet không nhận thư | Chỉ kiểm được trên Google thật | Anh thử trên STAGING |
| Bộ đếm "Technical issue" chưa hiện ở ô số liệu | Chưa có trong yêu cầu 5E | 5F nếu anh muốn |

# Thaiput v8 · Báo cáo test

*Chạy lúc 22:18:21 15/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 60 | 60 | 0 |
| Giao diện web (jsdom + backend thật) | 26 | 26 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |
| I28 | Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực | Đạt |
| I29 | Nhắc buổi sáng (mặc định tắt, bật bằng CONFIG): mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua | Đạt |
| I30 | Chủ nhật sau 15:00: admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên | Đạt |
| I31 | Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên | Đạt |
| I32 | Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ | Đạt |
| I33 | Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm | Đạt |
| I34 | Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng | Đạt |
| I35 | Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử | Đạt |
| I36 | Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML | Đạt |
| I37 | Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên | Đạt |
| I38 | Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ | Đạt |
| I39 | Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật | Đạt |
| I41 | Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi | Đạt |
| I40 | MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy | Đạt |
| I42 | Tutor và admin: link dùng 1 lần, phiên theo vai trò, email "Có đăng nhập mới" ghi đúng thiết bị; học viên vẫn dùng link nhiều lần | Đạt |
| I43 | Bộ nhớ đệm phiên: không đọc tab AUTH mỗi lần gọi; thoát, thoát mọi thiết bị có hiệu lực ngay; danh sách thiết bị đúng | Đạt |
| I44 | Dọn tab AUTH mỗi ngày từ 03:00: bỏ link và phiên hết hạn quá 7 ngày, giữ phiên còn hạn; chạy lại trong ngày không làm gì | Đạt |
| I45 | Đăng nhập Google: chữ ký đúng thì vào; dùng lại (kể cả khi bộ đệm mất), quá 2 phút, sai chữ ký, sai vai trò, admin DISABLED bị chặn; chữ ký sai, đối số lạ không ghi Sheets, không lấy khoá, không khoá được chữ ký đúng | Đạt |
| I46 | Tutor tự xem số buổi tháng này, tháng trước: mọi cột khớp báo cáo lương; kết quả buổi học ghi đúng mã phiên đã bấm | Đạt |
| I47 | API admin: chỉ phiên ADMIN gọi được; số việc cần xử lý, lọc thông báo theo người và theo mức, đánh dấu đã đọc (lô), danh sách và chi tiết tutor, học viên, buổi học | Đạt |
| I48 | Admin đặt thay: qua hạn đặt vẫn đặt được, chỉ định tutor; vẫn chặn 1 buổi/ngày, slot đã bắt đầu, tutor không mở; email như khi học viên tự đặt | Đạt |
| I49 | Admin huỷ trên web: không giới hạn hạn huỷ, học viên được trả lại buổi, có thông báo ADMIN_CANCELLED; buổi đã huỷ hoặc đã bắt đầu không huỷ | Đạt |
| I50 | Xoá dữ liệu test: chặn khi ALLOW_DATA_RESET tắt hoặc gõ sai câu; mức 1 giữ tutor và admin, sao lưu trước, gỡ sự kiện tương lai không gửi thư, phiên hết hiệu lực ngay; mức 2 chỉ còn admin | Đạt |
| I51 | Admin vào Meet: thêm cả admin USERS đang hoạt động (co-founder), bỏ tài khoản chạy hệ thống (chủ sự kiện) và admin DISABLED | Đạt |
| I52 | Dự án phụ đăng nhập Google (dist_google_login) ký đúng định dạng mà dự án chính kiểm: mở link là vào; chưa cài khoá thì báo rõ, không có nút | Đạt |
| I53 | Menu Xoá dữ liệu test qua hộp thoại 2 bước: Huỷ ở bước nào cũng không xoá; nhập sai mức hoặc sai câu không xoá; đúng cả 2 bước mới xoá; người lạ không chạy được | Đạt |
| I54 | Tài khoản DISABLED: job mỗi giờ huỷ hẳn phiên, mở lại tài khoản không làm phiên cũ sống lại; admin thoát mọi thiết bị của một người trên web; phiên đọc AUTH ngay trước khi thoát không sống lại trong bộ đệm | Đạt |
| I55 | Dán code mới nhưng CHƯA chạy menu 1: thiếu cột AUTH.device vẫn đăng nhập được; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được | Đạt |
| I56 | Khoá menu xoá theo môi trường: cài đặt STAGING ghi ALLOW_DATA_RESET TRUE; switchToProduction ghi FALSE; PRODUCTION chỉ chủ file được xoá; nhắc 8:00 cũ (8) tự đổi -1 đúng một lần | Đạt |
| I57 | Huỷ và đổi tutor: khách admin (co-founder) được gỡ không gửi thư trước khi gửi thư huỷ, thư đổi tutor; sau đổi tutor admin được thêm lại không gửi thư | Đạt |
| I58 | purgeRows_: insert và update trong cùng khoá sau khi dọn vẫn ghi đúng hàng; dòng giữ lại còn nguyên | Đạt |
| I59 | Endpoint công khai không lấy khoá với đầu vào sai: link lạ, thoát với mã lạ, xin link cho email không có; 20 form đăng ký rác không làm khoá form của người thật | Đạt |
| I60 | Sửa sau lượt soát 2: khoá tài khoản trong USERS thoát mọi thiết bị ngay; gỡ khách admin cả khi đã tắt ADMIN_JOIN_MEET; chủ file không xác định thì từ chối; ô CONTENT "-" ẩn chữ trong email; cảnh báo link không https; huỷ lại báo rõ; đặt thay cho học viên không có gói báo trước; danh sách học viên hiện gói đang dùng | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả sau buổi học: nút Completed ghi COMPLETED | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |
| U20 | Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor | Đạt |
| U21 | Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc | Đạt |
| U22 | Admin đặt thay học viên qua giao diện sau hạn 15:00, chọn tutor; xem chi tiết, huỷ buổi; tab Nhật ký tìm được | Đạt |
| U23 | Tutor tab Account: số buổi tháng, thiết bị đang đăng nhập; Thoát mọi thiết bị đưa về đăng nhập và phiên cũ hết hiệu lực | Đạt |
| U24 | Trang đăng nhập Google: chữ ký hợp lệ vào cổng admin; chữ ký sai báo lỗi và có nút xin link; nút Google chỉ hiện khi có GOOGLE_LOGIN_URL | Đạt |
| U25 | Admin xem tutor trên giao diện: số buổi tháng, buổi sắp tới, thoát mọi thiết bị của tutor đó | Đạt |
| U26 | Học viên có gói hết hạn và gói đang dùng: thẻ chính hiện gói đang dùng (lỗi sắp xếp ACTIVE = 0 đã sửa) | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5E.md -->

---

## `v8/reports/REPORT_CHUNK5F.md`

*Ngày tạo trong Project: 2026-10-16T03:01:47Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5F.md | bytes=36678 | sha256=843ad54fc4a88d6324129d8699c5364ee8dad3dc58254d6b7821a4d6aa6fea86 | created=2026-10-16T03:01:47Z -->
# Thaiput v8 · Báo cáo sub-chunk 5F (chống nghẽn, hàng đợi Calendar 23h, xác nhận 2 bước, máy tính)

*Ngày 16/10/2026. Phiên bản 8.0.7. Phần cuối là báo cáo đầy đủ do `npm test` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Không sửa kết quả mong đợi nào. Bộ dữ liệu kịch bản chạy `CALENDAR_MODE = INLINE` vì file 03 viết trước quyết định gom 23h (15/10) và kiểm cơ chế tạo, sửa, gỡ sự kiện ngay khi đặt; chế độ mặc định NIGHTLY và QUEUE có test riêng (I61 trở đi) |
| Tích hợp | 82/82 (mới: I61 đến I82; I01, I02 đổi 8 thành 9 trigger) |
| Giao diện web | 30/30 (mới: U27 đến U30; U15 viết lại cho xác nhận 2 bước) |
| Thử phá code | **30/30** lỗi cài cố ý bị bắt (4 lỗi lọt ở lượt đầu; đã thêm kiểm vào test rồi chạy lại, bắt đủ) |
| Tư vấn kiến trúc | 2 chuyên gia độc lập, tổng hợp ở `TU_VAN_KIEN_TRUC_16_10.md` |
| Soát code độc lập | 2 vòng, 2 agent riêng: R1 (đúng sai, an toàn dữ liệu khi chạy đồng thời), R2 (trải nghiệm, bảo mật, vận hành, kiểm lại bản sửa của R1) |
| Bản dán | `dist/Code.gs` 373 KB, `dist/Index.html` 111 KB |
| Ảnh chụp demo | 390px, 960px, 1366px: không lỗi JavaScript, không cuộn ngang |

## Đã làm

| # | Việc | Test |
|---|---|---|
| 1 | Hàng đợi Calendar `cal_state`, 3 chế độ, mặc định NIGHTLY 23h theo quyết định của anh; đường gấp; mã sự kiện cố định; thử lại có chờ; FAILED báo Khẩn; job 5 phút thoát ngay khi chưa có việc | I61 đến I65 |
| 2 | Mỗi thao tác lấy khoá tối đa 2 lần (afterLock_, deferWrite_); huỷ, đổi tutor, nhắc 60 phút đưa Calendar và email ra ngoài khoá | I63, I68, I76 |
| 3 | Lỗi sau khi đã ghi không đổi kết quả thành thất bại (luật 39) | I67 |
| 4 | Mã chống gửi trùng cho mọi thao tác ghi; `request_id` ở BOOKINGS; IN_PROGRESS | I66, I78, I79 |
| 5 | Trình duyệt tự thử lại, dải "đang thử lại", lượt ghi hỏi lại tới 60 giây cùng mã | U27, U30 |
| 6 | Bộ đệm CONFIG (có phiên bản) và slot (có phiên bản); mở cổng học viên 1 lượt | I69, I70, I78, U28 |
| 7 | Chống ghi nhầm dòng khi admin sắp xếp tab; dời lô khi có dòng gõ tay | I71 |
| 8 | Đối soát mỗi giờ (trùng giờ, quá buổi mỗi ngày, trễ Calendar gộp 1 email) | I72, I81 |
| 9 | Số đo theo giờ (METRICS, giữ 90 ngày, ghi không đọc cả tab), trang health, trình duyệt báo lỗi | I73, I82 |
| 10 | Tutor xác nhận 2 bước, lưu cả lô 1 lượt | I74, U15 |
| 11 | Menu Đo tốc độ, menu Calendar chạy ngay | I75 |
| 12 | Tổng kết lô Calendar đêm qua; báo Khẩn khi cả lô lỗi | I80 |
| 13 | Giờ dự kiến của thư mời trong email xác nhận và cổng | I82 |
| 14 | Bố cục máy tính từ 900px; nút Zalo không che thanh Lưu | U29, ảnh chụp |
| 15 | 2 co-founder dùng chung admin@ (CLAUDE.md, tài liệu) | |

## Soát độc lập: lỗi tìm thấy và cách sửa

| Vòng | Mã | Lỗi | Mức | Sửa | Test |
|---|---|---|---|---|---|
| R1 | C1 | Đổi tutor đúng lúc job tạo sự kiện: sự kiện mời tutor cũ, không ai biết | Cao | Kết quả mang tutor đã mời; lệch thì gắn rồi vá ngay (RESYNC); nhánh 409 so khách mời | I76 |
| R1 | C2 | Đối soát đặt hạn bộ đệm 86400 giây (Google tối đa 21600): đối soát chết đúng lúc cần | Cao | Tra NOTIFICATIONS cùng ngày; mock CacheService ném lỗi như Google | I72 |
| R1 | T1 | Đổi tutor gọi Calendar và gửi email trong khoá; vá lỗi không làm lại; kiểm dòng chỉ 1 lần mỗi khoá | Trung bình | Ra ngoài khoá, RESYNC có thử lại; kiểm cột khoá theo lô, làm mới mỗi 1,5 giây | I76 |
| R1 | T2 | Job ghi đè gợi ý, booking đặt lúc job chạy bị quên tới 6 giờ | Trung bình | Đếm số lần ghi gợi ý (`cal_hint_seq`), gộp giá trị nhỏ hơn | I77 |
| R1 | T3 | Huỷ đúng lúc job tạo, lượt ghi cuối của job hỏng: sự kiện còn mãi | Trung bình | Job đánh dấu "đang tạo" trong khoá ngắn trước khi gọi Google | I77 |
| R1 | T4 | Gửi lại khi lượt đầu còn chạy nhận "bận" | Trung bình | IN_PROGRESS, trình duyệt hỏi lại cùng mã tới 60 giây | I78 |
| R1 | L1 | Trạng thái kết quả (Hoàn thành...) bị coi là huỷ, gửi thư huỷ | Thấp | Chỉ trạng thái huỷ mới gỡ | I77 |
| R1 | L2 | DETACHED bị ghi đè thành CREATED khi chuyển tài khoản | Thấp | Giữ DETACHED, gỡ sự kiện vừa tạo; bước A gỡ theo mã cố định | đọc code |
| R1 | L4 | Kiểm dòng đọc từng ô xen kẽ ghi, chậm | Thấp | Đọc cột khoá theo lô | I71 |
| R1 | L5 | Phiên bản slot tăng trước khi dữ liệu tới Sheets | Thấp | Tăng sau `SpreadsheetApp.flush` | I69 |
| R1 | L6 | CONFIG đệm có thể ghi lại bản cũ sau khi admin sửa | Thấp | Phiên bản `cfg_ver` | I78 |
| R1 | L7 | Mã sự kiện phụ thuộc mili giây | Thấp | Theo giây; `created_at` cắt về giây khi ghi (R2 L8) | I78 |
| R1 | L8 | Xoá dữ liệu test bỏ sót sự kiện, kết quả trễ gắn nhầm | Thấp | Gỡ cả CANCEL_PENDING và mã cố định; tạm dừng hàng đợi; R2 L1 bổ sung kiểm danh tính | I82 |
| R1 | L9 | Link rác ghi được bộ đệm | Thấp | Chỉ đặt cờ khi link có thật, chỉ lưu kết quả thành công | I78 |
| R2 | T1 | Bản sửa L9 làm tutor mất mạng lúc đăng nhập nhận "link đã dùng" | Trung bình | Cờ IN_PROGRESS sau khi kiểm link có thật; email "Có đăng nhập mới" gửi sau khi kết quả đã lưu (`afterResponse_`) | I79 |
| R2 | T2 | Nút kẹt chữ "Đang đặt...", "Saving..." sau khi bận | Trung bình | Trả lại nhãn mọi nhánh lỗi | U30 |
| R2 | T3 | "Trang đang tải lại" cho mọi API ghi nhưng nhiều trang không tải lại; huỷ không có dấu hiệu đang chạy | Trung bình | Chỉ API có mã mới tải lại (và tải lại thật); API khác nói thật; dải "đang thử lại"; khoá nút Huỷ | U30 |
| R2 | T4 | Khoá bận đúng lúc đánh dấu: cả lô đêm trễ 24 giờ | Trung bình | Luôn gỡ giữ chỗ; việc đang giữ chỗ xét lại sau 10 phút | I80 |
| R2 | T5 | Không có tổng kết 23h; cả lô lỗi chỉ báo từng buổi, sau 48 giờ | Trung bình | Thử lại trong cùng đêm; báo Khẩn khi cả lô lỗi; tổng kết lô đêm sau 00:00 | I80 |
| R2 | T6 | Đối soát mỗi buổi một email, báo cả buổi admin đã dán link tay, câu sai | Trung bình | Gộp 1 email, bỏ buổi đã có link, câu theo trạng thái | I81 |
| R2 | T7 | METRICS đọc cả tab mỗi giờ trong khoá, phình mãi | Trung bình | Ghi thêm không đọc tab, giữ 90 ngày | I82 |
| R2 | L1 | Tạm dừng khi xoá dữ liệu không chặn lượt đang chạy | Thấp | So mã sự kiện cố định lúc ghi kết quả: buổi khác thì gỡ, không gắn | I82 |
| R2 | L3 | Không nói khi nào có thư mời | Thấp | "khoảng 23:05 12/10" trong email và cổng | I82 |
| R2 | L4 | 900 đến 1180px lưới ngày quá hẹp | Thấp | 2 cột chỉ từ 1180px | ảnh 960px |
| R2 | L5 | Lượt thử lại dài vẽ lại trang cũ sau khi đã chuyển trang | Thấp | Chỉ vẽ lại khi còn ở trang đó | đọc code |
| R2 | L6 | Email đổi tutor, nhắc: phần tiếng Anh in câu tiếng Việt | Thấp | Truyền ngôn ngữ | đọc code |
| R2 | L7 | apiClientReport không giới hạn; health lộ phiên bản | Thấp | 2.000 lượt mỗi giờ; health chỉ "OK" | I73, I82 |

## Thử phá code (30 lỗi cài cố ý, chạy trên bản sao, không đụng `src/`)

| # | Lỗi cài vào | Test bắt |
|---|---|---|
| F1 | Việc chậm (Calendar, email) chạy trong khoá | I32, I63, I64, I67, I68, I76, I77 |
| F2 | Bỏ kiểm dòng khi admin sắp xếp | I71 |
| F3 | Bỏ dời lô khi có dòng gõ tay | I71 |
| F4 | Huỷ không gỡ sự kiện đã tạo | I57, I60, I63, I64, I77, U09, D27, E34, F40 |
| F5 | Mã sự kiện ngẫu nhiên | 15 test |
| F6 | Không nhận lỗi 409 (đã tồn tại) | I20, I64, I67 |
| F7 | Job không đánh dấu trước khi tạo | I65, I77 |
| F8 | Bỏ qua đổi tutor trong lúc tạo | I76 |
| F9 | Job ghi đè gợi ý | I77 |
| F10 | Không gỡ giữ chỗ khi lỗi | I65, I76, I80 |
| F11 | Gửi lại khi đang chạy báo "bận" | I78 |
| F12 | Bỏ request_id ở BOOKINGS | I66 |
| F13 | Không ghi gom cuối lượt API | I49 |
| F14 | Slot đệm không đổi phiên bản | I69 |
| F15 | CONFIG đệm không kiểm phiên bản | I78 (lượt đầu LỌT; viết lại test cho đúng thời điểm sửa, bắt được) |
| F16 | NIGHTLY mở cả ngày | I61, I62, I82 |
| F17 | Tắt đường gấp | I62 |
| F18 | Nhắc trước 60 phút gửi trong khoá | I68 |
| F19 | Đối soát báo lặp | I72 |
| F20 | Trình duyệt không thử lại | U27 |
| F21 | Đổi tutor không vá Calendar | I57, I76, E33 |
| F22 | Không báo khi cả lô lỗi | I80 |
| F23 | Trang health lộ phiên bản | I73 |
| F24 | Bỏ giới hạn báo từ trình duyệt | I82 |
| F25 | Gắn sự kiện của buổi cũ cùng mã | I82 |
| F26 | Đăng nhập gửi lại nhận "link đã dùng" | I79 (lượt đầu LỌT; thêm kiểm lúc chờ khoá, bắt được) |
| F27 | Nút Đặt kẹt chữ khi bận | U30 |
| F28 | Tutor lưu kết quả ngay khi chọn | U15 |
| F29 | Email đối soát không gộp | I81 (lượt đầu LỌT; đếm đúng mọi email admin, bắt được) |
| F30 | METRICS đọc cả tab | I82 (lượt đầu LỌT; thêm đếm lần đọc cả tab, bắt được) |

## Chấp nhận, chưa sửa (anh quyết)

| Việc | Vì sao | Khi nào |
|---|---|---|
| Thư mời lúc 23:00 tới 24:00 | Đúng chế độ anh chọn; đổi bằng 1 ô CONFIG | Câu hỏi Q2 |
| Thư mời đôi khi 01:00 tới 05:00 (buổi gấp đặt sau 23:55, lỗi thử lại qua nửa đêm) | Ít gặp; sửa triệt để cần đổi chế độ | Q2 |
| Chuyển tài khoản gọi Calendar hàng loạt trong một khoá (R1 L3) | Chạy 1 lần, giờ vắng, chạy lại an toàn | Nếu anh chuyển tài khoản |
| Đăng nhập Google: gửi lại cùng mã ngay lúc lượt đầu chạy có thể nhận "đã dùng" | Cửa sổ rất nhỏ, có link email dự phòng | Không sửa |
| Mock CacheService không mô phỏng hết hạn | Đã chặn đúng giới hạn kích thước và hạn tối đa | Không sửa |
| 288 dòng calendarJob mỗi ngày trên trang Executions | Không tốn tài nguyên đáng kể | Ghi chú vận hành |
| Chưa đo trên Google thật | Môi trường này không gọi được Google | Anh chạy menu Đo tốc độ trên STAGING |

# Thaiput v8 · Báo cáo test

*Chạy lúc 09:58:23 16/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 82 | 82 | 0 |
| Giao diện web (jsdom + backend thật) | 30 | 30 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 9 trigger (thêm calendarJob ở 5F) | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |
| I28 | Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực | Đạt |
| I29 | Nhắc buổi sáng (mặc định tắt, bật bằng CONFIG): mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua | Đạt |
| I30 | Chủ nhật sau 15:00: admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên | Đạt |
| I31 | Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên | Đạt |
| I32 | Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ | Đạt |
| I33 | Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm | Đạt |
| I34 | Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng | Đạt |
| I35 | Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử | Đạt |
| I36 | Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML | Đạt |
| I37 | Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên | Đạt |
| I38 | Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ | Đạt |
| I39 | Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật | Đạt |
| I41 | Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi | Đạt |
| I40 | MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy | Đạt |
| I42 | Tutor và admin: link dùng 1 lần, phiên theo vai trò, email "Có đăng nhập mới" ghi đúng thiết bị; học viên vẫn dùng link nhiều lần | Đạt |
| I43 | Bộ nhớ đệm phiên: không đọc tab AUTH mỗi lần gọi; thoát, thoát mọi thiết bị có hiệu lực ngay; danh sách thiết bị đúng | Đạt |
| I44 | Dọn tab AUTH mỗi ngày từ 03:00: bỏ link và phiên hết hạn quá 7 ngày, giữ phiên còn hạn; chạy lại trong ngày không làm gì | Đạt |
| I45 | Đăng nhập Google: chữ ký đúng thì vào; dùng lại (kể cả khi bộ đệm mất), quá 2 phút, sai chữ ký, sai vai trò, admin DISABLED bị chặn; chữ ký sai, đối số lạ không ghi Sheets, không lấy khoá, không khoá được chữ ký đúng | Đạt |
| I46 | Tutor tự xem số buổi tháng này, tháng trước: mọi cột khớp báo cáo lương; kết quả buổi học ghi đúng mã phiên đã bấm | Đạt |
| I47 | API admin: chỉ phiên ADMIN gọi được; số việc cần xử lý, lọc thông báo theo người và theo mức, đánh dấu đã đọc (lô), danh sách và chi tiết tutor, học viên, buổi học | Đạt |
| I48 | Admin đặt thay: qua hạn đặt vẫn đặt được, chỉ định tutor; vẫn chặn 1 buổi/ngày, slot đã bắt đầu, tutor không mở; email như khi học viên tự đặt | Đạt |
| I49 | Admin huỷ trên web: không giới hạn hạn huỷ, học viên được trả lại buổi, có thông báo ADMIN_CANCELLED; buổi đã huỷ hoặc đã bắt đầu không huỷ | Đạt |
| I50 | Xoá dữ liệu test: chặn khi ALLOW_DATA_RESET tắt hoặc gõ sai câu; mức 1 giữ tutor và admin, sao lưu trước, gỡ sự kiện tương lai không gửi thư, phiên hết hiệu lực ngay; mức 2 chỉ còn admin | Đạt |
| I51 | Admin vào Meet: thêm cả admin USERS đang hoạt động (co-founder), bỏ tài khoản chạy hệ thống (chủ sự kiện) và admin DISABLED | Đạt |
| I52 | Dự án phụ đăng nhập Google (dist_google_login) ký đúng định dạng mà dự án chính kiểm: mở link là vào; chưa cài khoá thì báo rõ, không có nút | Đạt |
| I53 | Menu Xoá dữ liệu test qua hộp thoại 2 bước: Huỷ ở bước nào cũng không xoá; nhập sai mức hoặc sai câu không xoá; đúng cả 2 bước mới xoá; người lạ không chạy được | Đạt |
| I54 | Tài khoản DISABLED: job mỗi giờ huỷ hẳn phiên, mở lại tài khoản không làm phiên cũ sống lại; admin thoát mọi thiết bị của một người trên web; phiên đọc AUTH ngay trước khi thoát không sống lại trong bộ đệm | Đạt |
| I55 | Dán code mới nhưng CHƯA chạy menu 1: thiếu cột AUTH.device vẫn đăng nhập được; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được | Đạt |
| I56 | Khoá menu xoá theo môi trường: cài đặt STAGING ghi ALLOW_DATA_RESET TRUE; switchToProduction ghi FALSE; PRODUCTION chỉ chủ file được xoá; nhắc 8:00 cũ (8) tự đổi -1 đúng một lần | Đạt |
| I57 | Huỷ và đổi tutor: khách admin (co-founder) được gỡ không gửi thư trước khi gửi thư huỷ, thư đổi tutor; sau đổi tutor admin được thêm lại không gửi thư | Đạt |
| I58 | purgeRows_: insert và update trong cùng khoá sau khi dọn vẫn ghi đúng hàng; dòng giữ lại còn nguyên | Đạt |
| I59 | Endpoint công khai không lấy khoá với đầu vào sai: link lạ, thoát với mã lạ, xin link cho email không có; 20 form đăng ký rác không làm khoá form của người thật | Đạt |
| I60 | Sửa sau lượt soát 2: khoá tài khoản trong USERS thoát mọi thiết bị ngay; gỡ khách admin cả khi đã tắt ADMIN_JOIN_MEET; chủ file không xác định thì từ chối; ô CONTENT "-" ẩn chữ trong email; cảnh báo link không https; huỷ lại báo rõ; đặt thay cho học viên không có gói báo trước; danh sách học viên hiện gói đang dùng | Đạt |
| I61 | Calendar gom ban đêm (NIGHTLY, mặc định): đặt không gọi Calendar, email xác nhận báo link đến cùng lời mời; job trước 23:00 thoát không mở Sheets; từ 23:00 tạo đủ, chạy lại không trùng | Đạt |
| I62 | Đường gấp: buổi tối nay do admin đặt thay lúc 16:00, và buổi trong giờ yên tĩnh của QUEUE, được tạo sự kiện ngay khi đặt, email có link Meet | Đạt |
| I63 | Huỷ: chưa tạo sự kiện thì không gọi Google (SKIPPED); đã tạo thì gỡ sau khi nhả khoá (CANCELLED); gỡ lỗi thì hàng đợi gỡ lại | Đạt |
| I64 | Mã sự kiện cố định: lần trước đã tạo trên Google nhưng chưa ghi được mã thì lần sau dùng lại, không tạo sự kiện thứ hai, không gửi thư mời lần hai; huỷ vẫn gỡ đúng sự kiện | Đạt |
| I65 | Calendar lỗi: thử lại có chờ tăng dần; quá CALENDAR_MAX_ATTEMPTS lần thì FAILED và báo admin mức Khẩn đúng 1 lần | Đạt |
| I66 | Chống gửi trùng: cùng mã yêu cầu thì đặt đúng 1 lần, kể cả khi bộ đệm mất (mã lưu ở BOOKINGS); huỷ và đổi link đăng nhập gửi lại cùng mã nhận lại kết quả cũ | Đạt |
| I67 | Sau khi booking đã ghi, lỗi phía sau (khoá bận, Gmail lỗi) không biến kết quả thành thất bại; hàng đợi tự gắn sự kiện đã tạo | Đạt |
| I68 | Số lần lấy khoá: đặt lịch và huỷ mỗi việc tối đa 2 lần (trước 5F: 5 đến 7 lần); job nhắc gửi email khi không giữ khoá, gửi hỏng thì bỏ đánh dấu để gửi lại | Đạt |
| I69 | Danh sách slot dùng chung trong bộ đệm: lần xem thứ hai không tính lại; có người đặt hoặc tutor đổi lịch thì hết hiệu lực ngay; SLOT_CACHE_SECONDS = 0 tắt | Đạt |
| I70 | CONFIG đệm 60 giây: lần chạy mới không mở tab CONFIG; admin sửa tab CONFIG (onEdit) hoặc code ghi CONFIG thì có hiệu lực ngay | Đạt |
| I71 | Chống ghi nhầm dòng: admin sắp xếp tab BOOKINGS đúng lúc ghi thì vẫn ghi đúng buổi; ai đó gõ thêm dòng ở cuối thì dòng mới ghi sau, không đè | Đạt |
| I72 | Đối soát mỗi giờ: hai học viên cùng một tutor cùng giờ thì báo Khẩn 1 lần mỗi ngày; buổi trong 3 giờ tới chưa có sự kiện thì báo và giục hàng đợi | Đạt |
| I73 | Số đo: mỗi lượt API cộng vào bộ đệm theo giờ; job mỗi giờ chép giờ trước sang tab METRICS một lần; trang health trả OK mà không mở Sheets | Đạt |
| I74 | Tutor xác nhận nhiều buổi một lần: một lần lấy khoá, buổi sai hoặc của tutor khác báo riêng từng buổi, gửi lại cùng mã không ghi 2 lần | Đạt |
| I75 | Menu Đo tốc độ: đo từng phần việc với dữ liệu thật, ghi SPEED_TEST; menu Calendar chạy hàng đợi ngay bỏ qua giờ gom | Đạt |
| I76 | Đổi tutor đúng lúc hàng đợi đang tạo sự kiện: sự kiện được vá sang tutor mới ngay (không mời tutor cũ); đổi tutor buổi đã có sự kiện thì vá ngoài khoá, vá lỗi thì hàng đợi vá lại | Đạt |
| I77 | Hàng đợi: booking gấp đặt trong lúc job đang chạy không bị xoá gợi ý; huỷ đúng lúc job đang tạo mà lượt ghi cuối của job hỏng thì vẫn gỡ được sự kiện; tutor xác nhận kết quả lúc job tạo thì không gửi thư huỷ | Đạt |
| I78 | Chống gửi trùng: lần gửi lại khi lần đầu còn chạy nhận IN_PROGRESS (không phải "bận"); đổi link rác không ghi gì vào bộ đệm; mã sự kiện không đổi khi Sheets làm tròn mili giây; CONFIG đệm cũ ghi sau khi admin sửa thì bị bỏ | Đạt |
| I79 | Đăng nhập tutor: gửi lại cùng mã trong lúc lượt đầu đang gửi email "Có đăng nhập mới" nhận IN_PROGRESS rồi đúng phiên (không "link đã dùng"); email gửi sau khi kết quả đã lưu | Đạt |
| I80 | Hàng đợi: khoá bận đúng lúc đánh dấu thì giữ chỗ được gỡ, lượt 5 phút sau làm tiếp (không trễ 24 giờ); cả lô lỗi thì báo Khẩn ngay 1 lần; sau 00:00 có tổng kết lô đêm | Đạt |
| I81 | Đối soát gộp: 3 buổi trễ Calendar thì 3 dòng thông báo nhưng 1 email; buổi admin đã dán link Meet tay không bị báo; câu chữ theo trạng thái | Đạt |
| I82 | METRICS ghi thêm không đọc cả tab, dọn dòng cũ hơn 90 ngày; apiClientReport giới hạn 2.000 lượt mỗi giờ; email xác nhận NIGHTLY ghi giờ dự kiến của thư mời; booking cùng mã sau khi xoá dữ liệu không nhận sự kiện của buổi cũ | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả 2 bước (5F): chọn Completed chưa ghi gì; Save, xem lại, Save mới ghi COMPLETED; Back thì không ghi | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |
| U20 | Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor | Đạt |
| U21 | Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc | Đạt |
| U22 | Admin đặt thay học viên qua giao diện sau hạn 15:00, chọn tutor; xem chi tiết, huỷ buổi; tab Nhật ký tìm được | Đạt |
| U23 | Tutor tab Account: số buổi tháng, thiết bị đang đăng nhập; Thoát mọi thiết bị đưa về đăng nhập và phiên cũ hết hiệu lực | Đạt |
| U24 | Trang đăng nhập Google: chữ ký hợp lệ vào cổng admin; chữ ký sai báo lỗi và có nút xin link; nút Google chỉ hiện khi có GOOGLE_LOGIN_URL | Đạt |
| U25 | Admin xem tutor trên giao diện: số buổi tháng, buổi sắp tới, thoát mọi thiết bị của tutor đó | Đạt |
| U26 | Học viên có gói hết hạn và gói đang dùng: thẻ chính hiện gói đang dùng (lỗi sắp xếp ACTIVE = 0 đã sửa) | Đạt |
| U27 | Tự thử lại (5F): Google từ chối 2 lượt mở cổng thì trang vẫn mở, không báo lỗi; đặt lịch mất phản hồi thì thử lại cùng mã, chỉ đặt 1 lần, hiện kết quả | Đạt |
| U28 | Cổng học viên (5F): mở trang lấy luôn slot (không gọi apiStudentSlots khi vào tab đặt lịch); buổi chưa có link Meet ghi rõ link đến cùng lời mời lịch | Đạt |
| U29 | Máy tính (5F): thanh tab thành cột trái, lịch rảnh của tutor là lưới tuần mở sẵn mọi ngày, ngày đặt lịch của học viên mở sẵn | Đạt |
| U30 | Đông người (5F, soát R2): hệ thống bận thì dải "đang thử lại" hiện trong lúc thử và tắt khi xong; nút Đặt trở lại chữ cũ, không kẹt "Đang đặt..." | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5F.md -->

---

## `v8/reports/REPORT_CHUNK5G.md`

*Ngày tạo trong Project: 2026-10-16T13:10:30Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5G.md | bytes=39787 | sha256=be9a71c70fba0d702a9e6371dcc5350f69f07f916629ecbc1fa4c0086a1e31bc | created=2026-10-16T13:10:30Z -->
# Thaiput v8 · Báo cáo sub-chunk 5G (quyết định 16/10, lưu trữ, bảo trì, phát hành, thử tải, giám sát)

*Ngày 16/10/2026. Phiên bản 8.0.8. Phần cuối là báo cáo đầy đủ do `npm test` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Không sửa kết quả mong đợi nào |
| Tích hợp | 95/95 (mới: I83 đến I95; sửa I42, I43, I46, I55, I61, I79, I86 theo quyết định 16/10; I12 nhận thêm `doPost`) |
| Giao diện web | 31/31 (mới: U31; U23 viết lại: tab Account không còn thiết bị) |
| Bộ thử tải (phần 5 mới của harness) | 2/2 (L01, L02: `loadtest/run.js` với máy chủ giả có chuyển hướng 302, trang lỗi, 429, ghi xong rồi mất phản hồi, bận mãi) |
| `loadtest/browser.js` | Chạy thật bằng Chromium với bản demo: 4/4 người ảo đặt được, cỡ điện thoại và máy tính |
| Thử phá code | **61 lỗi cài cố ý: 60 bị bắt, 1 tương đương** (G9: bỏ điều kiện admin ở cổng bảo trì không đổi hành vi vì danh sách chặn không có API admin). Vòng 1: 54 lỗi, 4 lọt (G30, G48, G54 và G34 neo sai) → thêm kiểm vào I89, I94, L02 → vòng 2 trên code cuối: 12/12 (gồm 7 lỗi mới cho bản sửa R3) |
| Soát độc lập | 3 vòng, 3 agent riêng: R1 (đúng sai, an toàn dữ liệu), R2 (hồi quy so với 5F, chất lượng test, vận hành thật), R3 (kiểm từng bản sửa của R1, R2 và tìm lỗi mới do bản sửa). File: `SOAT_5G_R1.md`, `SOAT_5G_R2.md`, `SOAT_5G_R3.md` |
| Bản dán | `dist/Code.gs` 438 KB, `dist/Index.html` 113 KB |
| Ảnh chụp | 390px và 1366px: thanh bảo trì, trang bảo trì đóng cổng, tab Account tutor không thiết bị; không cuộn ngang |

## Đã làm theo quyết định 16/10

| # | Quyết định | Kết quả | Test |
|---|---|---|---|
| 1 | Q2 (a) QUEUE | Mặc định `CALENDAR_MODE = QUEUE`; ô gõ sai về QUEUE; menu 1 đổi một lần ô NIGHTLY cũ | I61, I83 |
| 2 | Tutor link 1 lần, 15 phút | Có từ 5D, kiểm thêm hạn 15 phút | I42 |
| 3 | Bỏ truy cập thiết bị | Phiên tutor 30 ngày (rút phiên 90 ngày cũ); không email "Có đăng nhập mới" cho tutor (`NEW_LOGIN_EMAIL_ROLES`) | I42, I83 |
| 4 | Bỏ "thiết bị đăng nhập" ở mọi giao diện user | Bỏ ở cổng học viên, tutor; bỏ `apiMySessions`, `apiLogoutAll`; xoá 17 dòng CONTENT cũ; mẫu email không còn chỉ tới nút đã bỏ | I43, U23, U31, I83 |
| 5 | Admin giữ nguyên | Không đổi (link, Google, email đăng nhập mới, thoát theo người trong trang quản trị) | I42, I54 |
| 6 | Q5 thử tải | LoadTest.gs, `loadtest/run.js`, `loadtest/browser.js`, `HUONG_DAN_THU_TAI.md` | I87, L01, L02 |
| 7 | Q4 giải thích lại | `TU_VAN_GIAM_SAT_16_10.md`; nhịp tim job, trang health OK hoặc STALE | I89 |
| 8 | Q3 admintest@ | Hướng dẫn, hạn mức dùng thử (đã tra tài liệu Google) | Không cần test |

## Việc 5G khác

| # | Việc | Test |
|---|---|---|
| 1 | Lưu trữ hằng tháng (Archive.gs) | I85, I86, I90, I92, I93, I95 |
| 2 | `purgeRows_` viết lại: theo nội dung đọc mới, ghi trước xoá sau, dấu vân tay, `purgeRecover_` | I86, I90, I92, I95 |
| 3 | Chế độ bảo trì (Maintenance.gs, UI) | I84, I91, I94, U31 |
| 4 | Phát hành: sao lưu trước cập nhật vào Releases, RELEASE log | I83 |
| 5 | Xuất bản PRODUCTION chia file (công cụ) | I88 |
| 6 | Hướng dẫn CONFIG (80 khoá) và menu | `HUONG_DAN_VAN_HANH.md` |
| 7 | Báo cáo, giải thích, tiến độ tổng hợp 5A đến 5G | `REPORT_TONG_HOP_5A_5G.md`, `GIAI_THICH_TONG_HOP_5A_5G.md`, `PROGRESS.md` |

## Soát độc lập: phát hiện và xử lý

**R1** (1 High, 3 Medium, 10 Low), **R2** (2 High, 7 Medium, 17 Low), **R3** kiểm bản sửa (thêm 1 High, 2 Medium, 6 Low mới).

| Phát hiện | Mức | Xử lý | Test |
|---|---|---|---|
| R1 H1, R2 T2: `purgeRows_` xoá trắng tab rồi mới ghi lại; bị cắt giữa chừng là tab trống | High | Ghi dòng giữ trước, xoá đuôi sau; mốc PURGE_OPEN | I86 |
| R1 M1, R2 T1: bỏ dòng theo số hàng cũ, admin sắp xếp hay gõ dòng tay đúng lúc thì mất dòng | High | Quyết định theo nội dung đọc mới (chữ ký) | I90 |
| R3 N1: lệnh ghi bị từ chối mà mốc còn, lần dọn sau xoá dòng mới nhất | High | Dấu vân tay (băm nội dung gốc, phần giữ, đuôi): chỉ xoá đuôi khi khớp | I92 |
| R3 N2: admin sắp xếp tab sau khi hỏng, lần dọn xoá nhầm | Medium | Không khớp dấu vân tay thì không xoá, báo Khẩn PURGE_CHECK | I92 |
| R1 M2: lưu trữ chạy khi bảo trì | Medium | Bỏ qua khi bảo trì (job và menu) | I86 |
| R1 M3: file lưu trữ ở thùng rác vẫn được ghi | Medium | Dừng khi file hoặc thư mục ở thùng rác; menu 2 báo lỗi; mỗi tháng sao 1 bản vào Releases | I90 |
| R3 N3: sao lưu bỏ lượt vì bận vẫn cho lưu trữ chạy | Medium | Mốc `BACKUP_OK_AT` chỉ ghi khi có file | I92 |
| R2 T3, R3 N6: link "mở đúng dòng" lệch sau lưu trữ | Medium, Low | Sửa link theo bảng hàng cũ sang hàng mới | I90, I93 |
| R2 T4: lượt đặt đã ghi, gửi lại lúc bật bảo trì nhận câu bảo trì | Medium | Cổng bảo trì nằm trong `idem_`, sau bước trả kết quả cũ | I91 |
| R2 T5: `browser.js` mặc định dùng học viên không tồn tại | Medium | Mặc định `--start 81` | Chạy với demo |
| R2 T6: L01 không kiểm thử lại ở bước đặt | Medium | Thêm 429 ở bước đặt, "ghi xong rồi mất phản hồi" | L01 |
| R2 T7: U31 có khẳng định luôn đúng | Medium | Kiểm nội dung toast | U31 |
| R2 T8: hạn mức tài khoản dùng thử | Medium | Tra tài liệu, ghi vào CLAUDE.md luật 12 và hướng dẫn | Không cần |
| R2 T9: danh sách API bị chặn viết tay | Medium | I91 tự liệt kê mọi `api*` | I91 |
| R1 L1: phục hồi không nâng mốc mã, mốc báo cáo | Low | Nâng cả hai | I85, I95 |
| R1 L2: mã lô trùng | Low | Thêm giây và chuỗi ngẫu nhiên | I86 |
| R1 L3: tự Hoàn thành chạy khi bảo trì | Low | Tạm dừng | I94 |
| R1 L4, R2 T11: thanh báo không tự tắt | Low | Máy chủ gắn `r.maint`; trang tự bật tắt | U31 |
| R1 L5: phiên giả trong bộ đệm không làm mới | Low | Tạo lại 1 lần khi SESSION_INVALID | Đọc code |
| R1 L6: sao lưu trước cập nhật hỏng vẫn ghi phiên bản | Low | Chưa ghi, lần sau thử lại | I83 |
| R1 L7, R2 T16: phiên tutor 90 ngày cũ | Low | Menu 1 rút về 30 ngày | I83 |
| R1 L8, R2 T23: khoá DONE_ tăng mãi | Low | Dọn khoá cũ hơn 7 ngày mỗi ngày | Đọc code |
| R1 L9: báo cáo không cảnh báo email đã lưu trữ | Low | Thêm dòng chú ý | Đọc code |
| R1 L10, R2 T25: tài liệu, luật chưa cập nhật | Low | CLAUDE.md luật 1, 10, 12, 24, 36, 46 đến 49; file giải thích | Không cần |
| R2 T10: toast chữ thô "MAINT" | Low | Bỏ qua lỗi MAINT | Đọc code |
| R2 T12: trang bảo trì trên máy tính chừa lề tab | Low | `data-page=maint` | Ảnh chụp 1366px |
| R2 T13: form đăng ký không báo bảo trì | Low | Báo trên form, khoá nút Gửi | U31 |
| R2 T14: I35 bỏ sót key ghép | Low | I91 kiểm đủ 6 key bảo trì | I91 |
| R2 T15: CONTENT còn key cũ | Low | Menu 1 xoá 17 dòng | I83 |
| R2 T17: mẫu email đăng nhập mới bảo admin "báo admin" | Low | Viết lại cho admin (tiếng Việt), tutor (tiếng Anh) | Đọc code |
| R2 T18: sự kiện giả mời co-founder | Low | Không thêm admin vào sự kiện của học viên giả | Đọc code |
| R2 T19: lượt đầu tạo phiên làm đội số đo | Low | Làm nóng phiên trước khi bấm giờ | L01 |
| R2 T20: run.js thoát 0 khi bất thường | Low | Thoát 3 khi có lý do ngoài nhóm bình thường | L02 |
| R2 T21: bộ chọn `.tabs` sai | Low | `.tabbar` | Chạy với demo |
| R2 T22: health không theo dõi sao lưu, dailyJob | Low | Thêm, sao lưu theo mốc có file | I89 |
| R2 T24: chú thích còn ghi NIGHTLY mặc định | Low | Sửa, ô gõ sai về QUEUE | Đọc code |
| R2 T26: mock thiếu tab mặc định, giới hạn Properties | Low | Thêm Sheet1, giới hạn 9 KB và 500 KB, thùng rác thư mục, lỗi ghi | Toàn bộ test |
| R3 N4: bộ đệm hỏng thì lượt ghi lọt cổng bảo trì | Low | Qua cổng cả khi bộ đệm hỏng | I92 |
| R3 N5: lần dọn chạy cuối job mỗi giờ, thiếu tab | Low | Dọn ở đầu job, mọi tab có mốc; menu 2 cảnh báo | I92 |
| R3 N7: ô tick ở đuôi không trống hẳn | Low (chưa chắc trên Google) | Gỡ ô tick trước khi xoá đuôi | Kiểm trên Google thật |

**Chấp nhận, không sửa (có lý do, ghi trong `CHUNK5G_GIAI_THICH.md` mục 5):**
* R3 N8: cột công thức admin tự thêm có tham chiếu tương đối bị lệch sau khi bỏ dòng (cột hệ thống không có loại này).
* R3 N9: bản sao hằng tháng file lưu trữ tăng dần trong Releases (chỉ tốn dung lượng).
* R2 T18 phần 2: Xoá dữ liệu test gỡ sự kiện từng cái; trên 500 buổi giả chạy lại menu.
* R2 T6 phần còn lại: chưa giả lập chuyển hướng sang host khác và cổng hết giờ giữa lượt.
* R1 L8 phần health đọc cả kho Script Properties: kho nhỏ (dưới 50 KB mỗi năm), 1 lần đọc mỗi lượt kiểm.

## Còn phải kiểm trên Google thật (không giả lập được)

1. Ô tick sau khi xoá đuôi tab NOTIFICATIONS có trống hẳn không (R3 N7).
2. `browser.js` tìm đúng khung lồng của trang Apps Script.
3. Dịch vụ giám sát đọc được chữ OK qua chuyển hướng 302 (Q4).
4. `SpreadsheetApp.create` và `moveTo` đặt file lưu trữ đúng thư mục.
5. Thời gian một lượt đặt khi 30, 50 người cùng bấm (thử tải).

---

# Thaiput v8 · Báo cáo test

*Chạy lúc 20:08:26 16/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 95 | 95 | 0 |
| Giao diện web (jsdom + backend thật) | 31 | 31 | 0 |
| Bộ thử tải (loadtest/run.js với máy chủ giả) | 2 | 2 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 9 trigger (thêm calendarJob ở 5F) | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |
| I28 | Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực | Đạt |
| I29 | Nhắc buổi sáng (mặc định tắt, bật bằng CONFIG): mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua | Đạt |
| I30 | Chủ nhật sau 15:00: admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên | Đạt |
| I31 | Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên | Đạt |
| I32 | Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ | Đạt |
| I33 | Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm | Đạt |
| I34 | Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng | Đạt |
| I35 | Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử | Đạt |
| I36 | Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML | Đạt |
| I37 | Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên | Đạt |
| I38 | Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ | Đạt |
| I39 | Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật | Đạt |
| I41 | Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi | Đạt |
| I40 | MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy | Đạt |
| I42 | Tutor và admin: link dùng 1 lần, hạn 15 phút, phiên theo vai trò (tutor 30 ngày từ 16/10); email "Có đăng nhập mới" chỉ cho admin (16/10); học viên vẫn dùng link nhiều lần | Đạt |
| I43 | Bộ nhớ đệm phiên: không đọc tab AUTH mỗi lần gọi; thoát, thoát mọi thiết bị có hiệu lực ngay; danh sách thiết bị đúng | Đạt |
| I44 | Dọn tab AUTH mỗi ngày từ 03:00: bỏ link và phiên hết hạn quá 7 ngày, giữ phiên còn hạn; chạy lại trong ngày không làm gì | Đạt |
| I45 | Đăng nhập Google: chữ ký đúng thì vào; dùng lại (kể cả khi bộ đệm mất), quá 2 phút, sai chữ ký, sai vai trò, admin DISABLED bị chặn; chữ ký sai, đối số lạ không ghi Sheets, không lấy khoá, không khoá được chữ ký đúng | Đạt |
| I46 | Tutor tự xem số buổi tháng này, tháng trước: mọi cột khớp báo cáo lương; kết quả buổi học ghi đúng mã phiên đã bấm | Đạt |
| I47 | API admin: chỉ phiên ADMIN gọi được; số việc cần xử lý, lọc thông báo theo người và theo mức, đánh dấu đã đọc (lô), danh sách và chi tiết tutor, học viên, buổi học | Đạt |
| I48 | Admin đặt thay: qua hạn đặt vẫn đặt được, chỉ định tutor; vẫn chặn 1 buổi/ngày, slot đã bắt đầu, tutor không mở; email như khi học viên tự đặt | Đạt |
| I49 | Admin huỷ trên web: không giới hạn hạn huỷ, học viên được trả lại buổi, có thông báo ADMIN_CANCELLED; buổi đã huỷ hoặc đã bắt đầu không huỷ | Đạt |
| I50 | Xoá dữ liệu test: chặn khi ALLOW_DATA_RESET tắt hoặc gõ sai câu; mức 1 giữ tutor và admin, sao lưu trước, gỡ sự kiện tương lai không gửi thư, phiên hết hiệu lực ngay; mức 2 chỉ còn admin | Đạt |
| I51 | Admin vào Meet: thêm cả admin USERS đang hoạt động (co-founder), bỏ tài khoản chạy hệ thống (chủ sự kiện) và admin DISABLED | Đạt |
| I52 | Dự án phụ đăng nhập Google (dist_google_login) ký đúng định dạng mà dự án chính kiểm: mở link là vào; chưa cài khoá thì báo rõ, không có nút | Đạt |
| I53 | Menu Xoá dữ liệu test qua hộp thoại 2 bước: Huỷ ở bước nào cũng không xoá; nhập sai mức hoặc sai câu không xoá; đúng cả 2 bước mới xoá; người lạ không chạy được | Đạt |
| I54 | Tài khoản DISABLED: job mỗi giờ huỷ hẳn phiên, mở lại tài khoản không làm phiên cũ sống lại; admin thoát mọi thiết bị của một người trên web; phiên đọc AUTH ngay trước khi thoát không sống lại trong bộ đệm | Đạt |
| I55 | Dán code mới nhưng CHƯA chạy menu 1: thiếu cột AUTH.device vẫn đăng nhập được; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được | Đạt |
| I56 | Khoá menu xoá theo môi trường: cài đặt STAGING ghi ALLOW_DATA_RESET TRUE; switchToProduction ghi FALSE; PRODUCTION chỉ chủ file được xoá; nhắc 8:00 cũ (8) tự đổi -1 đúng một lần | Đạt |
| I57 | Huỷ và đổi tutor: khách admin (co-founder) được gỡ không gửi thư trước khi gửi thư huỷ, thư đổi tutor; sau đổi tutor admin được thêm lại không gửi thư | Đạt |
| I58 | purgeRows_: insert và update trong cùng khoá sau khi dọn vẫn ghi đúng hàng; dòng giữ lại còn nguyên | Đạt |
| I59 | Endpoint công khai không lấy khoá với đầu vào sai: link lạ, thoát với mã lạ, xin link cho email không có; 20 form đăng ký rác không làm khoá form của người thật | Đạt |
| I60 | Sửa sau lượt soát 2: khoá tài khoản trong USERS thoát mọi thiết bị ngay; gỡ khách admin cả khi đã tắt ADMIN_JOIN_MEET; chủ file không xác định thì từ chối; ô CONTENT "-" ẩn chữ trong email; cảnh báo link không https; huỷ lại báo rõ; đặt thay cho học viên không có gói báo trước; danh sách học viên hiện gói đang dùng | Đạt |
| I61 | Calendar gom ban đêm (NIGHTLY, dự phòng; mặc định QUEUE từ 16/10): đặt không gọi Calendar, email xác nhận báo link đến cùng lời mời; job trước 23:00 thoát không mở Sheets; từ 23:00 tạo đủ, chạy lại không trùng | Đạt |
| I62 | Đường gấp: buổi tối nay do admin đặt thay lúc 16:00, và buổi trong giờ yên tĩnh của QUEUE, được tạo sự kiện ngay khi đặt, email có link Meet | Đạt |
| I63 | Huỷ: chưa tạo sự kiện thì không gọi Google (SKIPPED); đã tạo thì gỡ sau khi nhả khoá (CANCELLED); gỡ lỗi thì hàng đợi gỡ lại | Đạt |
| I64 | Mã sự kiện cố định: lần trước đã tạo trên Google nhưng chưa ghi được mã thì lần sau dùng lại, không tạo sự kiện thứ hai, không gửi thư mời lần hai; huỷ vẫn gỡ đúng sự kiện | Đạt |
| I65 | Calendar lỗi: thử lại có chờ tăng dần; quá CALENDAR_MAX_ATTEMPTS lần thì FAILED và báo admin mức Khẩn đúng 1 lần | Đạt |
| I66 | Chống gửi trùng: cùng mã yêu cầu thì đặt đúng 1 lần, kể cả khi bộ đệm mất (mã lưu ở BOOKINGS); huỷ và đổi link đăng nhập gửi lại cùng mã nhận lại kết quả cũ | Đạt |
| I67 | Sau khi booking đã ghi, lỗi phía sau (khoá bận, Gmail lỗi) không biến kết quả thành thất bại; hàng đợi tự gắn sự kiện đã tạo | Đạt |
| I68 | Số lần lấy khoá: đặt lịch và huỷ mỗi việc tối đa 2 lần (trước 5F: 5 đến 7 lần); job nhắc gửi email khi không giữ khoá, gửi hỏng thì bỏ đánh dấu để gửi lại | Đạt |
| I69 | Danh sách slot dùng chung trong bộ đệm: lần xem thứ hai không tính lại; có người đặt hoặc tutor đổi lịch thì hết hiệu lực ngay; SLOT_CACHE_SECONDS = 0 tắt | Đạt |
| I70 | CONFIG đệm 60 giây: lần chạy mới không mở tab CONFIG; admin sửa tab CONFIG (onEdit) hoặc code ghi CONFIG thì có hiệu lực ngay | Đạt |
| I71 | Chống ghi nhầm dòng: admin sắp xếp tab BOOKINGS đúng lúc ghi thì vẫn ghi đúng buổi; ai đó gõ thêm dòng ở cuối thì dòng mới ghi sau, không đè | Đạt |
| I72 | Đối soát mỗi giờ: hai học viên cùng một tutor cùng giờ thì báo Khẩn 1 lần mỗi ngày; buổi trong 3 giờ tới chưa có sự kiện thì báo và giục hàng đợi | Đạt |
| I73 | Số đo: mỗi lượt API cộng vào bộ đệm theo giờ; job mỗi giờ chép giờ trước sang tab METRICS một lần; trang health trả OK mà không mở Sheets | Đạt |
| I74 | Tutor xác nhận nhiều buổi một lần: một lần lấy khoá, buổi sai hoặc của tutor khác báo riêng từng buổi, gửi lại cùng mã không ghi 2 lần | Đạt |
| I75 | Menu Đo tốc độ: đo từng phần việc với dữ liệu thật, ghi SPEED_TEST; menu Calendar chạy hàng đợi ngay bỏ qua giờ gom | Đạt |
| I76 | Đổi tutor đúng lúc hàng đợi đang tạo sự kiện: sự kiện được vá sang tutor mới ngay (không mời tutor cũ); đổi tutor buổi đã có sự kiện thì vá ngoài khoá, vá lỗi thì hàng đợi vá lại | Đạt |
| I77 | Hàng đợi: booking gấp đặt trong lúc job đang chạy không bị xoá gợi ý; huỷ đúng lúc job đang tạo mà lượt ghi cuối của job hỏng thì vẫn gỡ được sự kiện; tutor xác nhận kết quả lúc job tạo thì không gửi thư huỷ | Đạt |
| I78 | Chống gửi trùng: lần gửi lại khi lần đầu còn chạy nhận IN_PROGRESS (không phải "bận"); đổi link rác không ghi gì vào bộ đệm; mã sự kiện không đổi khi Sheets làm tròn mili giây; CONFIG đệm cũ ghi sau khi admin sửa thì bị bỏ | Đạt |
| I79 | Đăng nhập tutor: gửi lại cùng mã trong lúc lượt đầu đang gửi email "Có đăng nhập mới" nhận IN_PROGRESS rồi đúng phiên (không "link đã dùng"); email gửi sau khi kết quả đã lưu | Đạt |
| I80 | Hàng đợi: khoá bận đúng lúc đánh dấu thì giữ chỗ được gỡ, lượt 5 phút sau làm tiếp (không trễ 24 giờ); cả lô lỗi thì báo Khẩn ngay 1 lần; sau 00:00 có tổng kết lô đêm | Đạt |
| I81 | Đối soát gộp: 3 buổi trễ Calendar thì 3 dòng thông báo nhưng 1 email; buổi admin đã dán link Meet tay không bị báo; câu chữ theo trạng thái | Đạt |
| I82 | METRICS ghi thêm không đọc cả tab, dọn dòng cũ hơn 90 ngày; apiClientReport giới hạn 2.000 lượt mỗi giờ; email xác nhận NIGHTLY ghi giờ dự kiến của thư mời; booking cùng mã sau khi xoá dữ liệu không nhận sự kiện của buổi cũ | Đạt |
| I83 | Menu 1 sau 16/10: CALENDAR_MODE NIGHTLY cũ thành QUEUE, phiên tutor 90 thành 30, mẫu email cũ đổi; chỉ 1 lần (admin chọn lại thì giữ); phiên bản đổi thì sao lưu DB vào Releases trước, ghi RELEASE | Đạt |
| I84 | Bảo trì: READONLY chặn đặt, huỷ, lưu slot, đăng ký (không ghi, không lấy khoá) nhưng vẫn xem được; CLOSED chặn cả xem; admin và đăng nhập luôn chạy; OFF chạy lại | Đạt |
| I85 | Lưu trữ: chép dòng cũ đã xong sang file theo năm, đọc lại đủ rồi mới bỏ khỏi DB; gói còn chạy, admin_action, chờ duyệt, thông báo chưa đọc giữ lại; mã mới không trùng mã đã lưu trữ | Đạt |
| I86 | Lưu trữ an toàn khi hỏng: đọc lại thiếu thì không bỏ dòng nào và báo Khẩn; hỏng lúc bỏ khỏi DB thì lần sau hoàn tất đúng lô, không chép lần hai; job chỉ chạy từ 03:00, 1 lần mỗi ngày | Đạt |
| I87 | Thử tải: cổng POST đóng mặc định (không chạm Sheets); mở bằng khoá, chỉ thay mặt tài khoản @loadtest.invalid; đặt qua cổng đi đúng API thật, gửi lại cùng mã không trùng; email, Calendar không gửi tới địa chỉ giả; PRODUCTION xoá khoá | Đạt |
| I88 | Bản PRODUCTION chia file (luật 44): mỗi file src một file, có MANIFEST băm; nạp theo thứ tự NGƯỢC vẫn cài đặt, kiểm tra hệ thống, thêm tutor, mở trang được | Đạt |
| I89 | Giám sát (Q4): health trả OK khi job còn chạy, STALE khi một job ngừng quá hạn (hourly 150, reminder 45, calendar 30 phút); bận vẫn tính là còn sống; health không mở Sheets | Đạt |
| I90 | Lưu trữ khi admin sửa tay cùng lúc (soát R1 M1, R2 T1): sắp xếp lại tab và gõ thêm dòng giữa lúc chép và lúc bỏ thì không mất, không trùng; link "mở đúng dòng" của thông báo dời theo; file lưu trữ ở thùng rác thì dừng; mỗi tháng sao 1 bản file lưu trữ vào Releases | Đạt |
| I91 | Bảo trì không bỏ sót API (soát R2 T9): mọi api* ghi của học viên, tutor, form đăng ký đều bị chặn ở READONLY; lượt đặt đã ghi mà gửi lại lúc bảo trì vẫn nhận "đã đặt" (soát R2 T4); trang nhận trạng thái bảo trì qua r.maint; đủ chữ bảo trì 2 thứ tiếng | Đạt |
| I92 | Bỏ dòng an toàn (soát R3): lệnh ghi bị từ chối thì lần dọn sau không xoá gì; tab bị sắp xếp sau khi hỏng thì không tự xoá, báo Khẩn; sao lưu đêm bỏ lượt vì bận thì không lưu trữ; bộ đệm hỏng vẫn qua cổng bảo trì; link dời đúng khi có hàng trống | Đạt |
| I93 | Link "mở đúng dòng" dời đúng khi tab có hàng trống ở giữa (soát R3 N6) | Đạt |
| I94 | Bảo trì tạm dừng tự Hoàn thành (soát R1 L3): buổi đã qua 24 giờ giữ CONFIRMED khi đang bảo trì, tắt bảo trì thì job tự Hoàn thành | Đạt |
| I95 | Lô lưu trữ BOOKINGS hỏng ở bước xoá đuôi: lượt sau dọn đuôi, đóng lô, vẫn ghi mốc tháng đã chuyển cho báo cáo (soát R3 L1) | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả 2 bước (5F): chọn Completed chưa ghi gì; Save, xem lại, Save mới ghi COMPLETED; Back thì không ghi | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |
| U20 | Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor | Đạt |
| U21 | Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc | Đạt |
| U22 | Admin đặt thay học viên qua giao diện sau hạn 15:00, chọn tutor; xem chi tiết, huỷ buổi; tab Nhật ký tìm được | Đạt |
| U23 | Tutor tab Account: số buổi tháng; không còn mục thiết bị (16/10); nút Log out đưa về đăng nhập và phiên cũ hết hiệu lực | Đạt |
| U24 | Trang đăng nhập Google: chữ ký hợp lệ vào cổng admin; chữ ký sai báo lỗi và có nút xin link; nút Google chỉ hiện khi có GOOGLE_LOGIN_URL | Đạt |
| U25 | Admin xem tutor trên giao diện: số buổi tháng, buổi sắp tới, thoát mọi thiết bị của tutor đó | Đạt |
| U26 | Học viên có gói hết hạn và gói đang dùng: thẻ chính hiện gói đang dùng (lỗi sắp xếp ACTIVE = 0 đã sửa) | Đạt |
| U27 | Tự thử lại (5F): Google từ chối 2 lượt mở cổng thì trang vẫn mở, không báo lỗi; đặt lịch mất phản hồi thì thử lại cùng mã, chỉ đặt 1 lần, hiện kết quả | Đạt |
| U28 | Cổng học viên (5F): mở trang lấy luôn slot (không gọi apiStudentSlots khi vào tab đặt lịch); buổi chưa có link Meet ghi rõ link đến cùng lời mời lịch | Đạt |
| U29 | Máy tính (5F): thanh tab thành cột trái, lịch rảnh của tutor là lưới tuần mở sẵn mọi ngày, ngày đặt lịch của học viên mở sẵn | Đạt |
| U30 | Đông người (5F, soát R2): hệ thống bận thì dải "đang thử lại" hiện trong lúc thử và tắt khi xong; nút Đặt trở lại chữ cũ, không kẹt "Đang đặt..." | Đạt |
| U31 | 16/10: tab Tài khoản học viên không còn mục thiết bị; 5G: bảo trì CHỈ XEM hiện thanh báo, bấm Đặt nhận câu bảo trì và không ghi; ĐÓNG thì cổng hiện trang bảo trì (desktop và điện thoại) | Đạt |

## Bộ thử tải

| # | Test | Kết quả |
|---|---|---|
| L01 | run.js qua 302 như Google: 3 lượt trang chủ và 3 lượt đặt bị từ chối trước khi tới máy chủ, 2 lượt đặt ĐÃ GHI rồi mới trả trang lỗi; 15 người ảo, huỷ 30%: không trùng, không mất, kết quả khớp Sheets | Đạt |
| L02 | run.js báo lỗi khi máy chủ bận mãi: thử lại đúng 9 lần cùng một mã rồi dừng, kết quả BUSY, thoát mã 3 (không coi là bình thường) | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5G.md -->

---

## `v8/reports/REPORT_CHUNK5H.md`

*Ngày tạo trong Project: 2026-10-17T16:43:28Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5H.md | bytes=40299 | sha256=7979ff560e1dc3cd3946e54f79a5b53a492d4a942953455029b6fa8c821ab78a | created=2026-10-17T16:43:28Z -->
# Thaiput v8 · Báo cáo chunk 5H (hai thứ tiếng, CONTENT có chỉ đường, email marketing, giao diện mới, hướng dẫn độc lập)

*Ngày 17/10/2026. Phiên bản 8.0.9. Phần cuối là báo cáo đầy đủ do `node test/harness.js` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Không sửa kết quả mong đợi nào |
| Tích hợp | 102/102 (mới: I96 đến I102; sửa I06, I39, I41, I91 theo cấu trúc song ngữ) |
| Giao diện web | 37/37 (mới: U32 đến U37; sửa U15, U20, U31 theo nút VI \| EN) |
| Bộ thử tải | 2/2 |
| Thử phá code | 62 lỗi cài cố ý vào code 5H: 59 bị bắt, 3 tương đương (G32: chân email đã có lớp chặn thứ hai; G39: email không bao giờ rỗng; U22: trang đăng nhập đã chặn sớm hơn). Vòng đầu 37 lỗi, 2 lọt (G4, U9) → thêm kiểm vào I96, U33; sau sửa soát thêm 25 lỗi cho bản sửa, 4 lọt (G35, U16, U19, U22) → thêm kiểm vào I102, U35, U36, U37. File: `THU_PHA_5H.txt` |
| Soát độc lập | 3 agent, 2 vòng: R1 máy chủ (`SOAT_5H_R1_MAYCHU.md`), R1 giao diện (`SOAT_5H_R1_GIAODIEN.md`, có trình duyệt thật và ảnh chụp), R2 kiểm từng bản sửa (`SOAT_5H_R2.md`) |
| Bản dán | `dist/Code.gs` 497 KB (7.386 dòng), `dist/Index.html` 140 KB (1.921 dòng). Một file mỗi loại theo yêu cầu |
| Ảnh chụp | 360px tối, 390px sáng, 1280px sáng: trang chủ VI và EN, cổng học viên, giờ rảnh tutor, thông báo admin; không cuộn ngang |

## Đã làm theo yêu cầu 17/10

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | Code.gs, Index.html không tách file | Một file mỗi loại | Bản dựng |
| 2 | Giao diện đẹp, chuyên nghiệp hơn trên máy tính và điện thoại | Styles.html viết lại (màu, chữ, thanh đầu trang, tab, thẻ gói, ô giờ có tên thứ, hộp thoại, chế độ tối, cột trái máy tính) | U01 đến U37, ảnh chụp |
| 3 | Thông báo admin gọn | Một dòng mỗi tin, gom theo ngày, nút lọc có số đếm, ô số liệu nhỏ, mở là đã đọc | U21, U35 |
| 4 | Nút Vi/Eng từng người tự chọn | VI \| EN mọi trang (trừ quản trị), lưu trên máy và USERS.lang, thiết bị khác tự theo | U32, U33, U34, U36, U37, I97 |
| 5 | Hỏi ngôn ngữ khi đăng nhập lần đầu qua link | Hộp chọn hai thứ tiếng, đề xuất theo vai trò, lưu lên máy chủ | U33 |
| 6 | CONTENT đổi theo, cột giải thích, áp cả Vi và Eng | 267 dòng, cột page, position, shown_when, vi, en, default_vi, default_en, note; chuyển tab cũ an toàn, chạy lại được | I39, I96, I101 |
| 7 | Email marketing tab riêng, menu gửi, hướng dẫn | Tab MARKETING_EMAILS, 2 menu, chống trùng, hạn mức, giới hạn thời gian, dừng tay, từ chối nhận; hướng dẫn vận hành Phần G | I98, I99, I102 |
| 8 | Hướng dẫn độc lập, dễ hiểu, không nhắc file khác, bỏ đại từ | 4 file viết lại; đã quét: không còn tên file .md khác, không "anh", "em", "bạn" (chữ "tôi" chỉ còn trong tên menu và nút của Google) | Quét bằng lệnh |

## Soát độc lập: phát hiện và xử lý

| Phát hiện | Mức | Xử lý | Test |
|---|---|---|---|
| R1 S1: menu 1 bị ngắt sau khi đổi tên tab CONTENT cũ thì không bao giờ chép chữ admin | Cao | Ghi PENDING (theo từng file) trước khi đổi tên; bước chép đọc lại tab cũ, chạy lại được | I101 |
| R1 S2: hai lượt gửi cùng chiến dịch, mỗi người 2 email | Cao | Dấu "đang gửi" MKT_RUN_<mã> trong khoá, hết hạn 7 phút | I102 |
| R1 giao diện R01 đến R04: đổi ngôn ngữ khi đang gửi làm nút gửi bật lại, gửi 2 lần (đăng ký, đặt, gia hạn, lưu giờ rảnh) | Cao | `T.inflight` đếm lượt ghi đang chờ, `T.hold` cho bước đọc ảnh; nút VI \| EN chỉ báo chờ | U36 |
| R1 giao diện R04: tab Tài khoản mất chữ đang sửa, gói, ảnh | Cao | relabel giữ ô, gói, ảnh | U36 |
| R1 S3: đồng hồ 4,5 phút tính sau hộp thoại; lỗi giữa lô mất nhật ký | Trung bình | Mốc lấy lúc mở menu; `finally` ghi nhật ký | I99, I102 |
| R1 S4: không dừng được chiến dịch, status bị ghi đè | Trung bình | Đọc lại status mỗi lô; DRAFT là dừng và được giữ | I102 |
| R2 B1: lỗi Sheets lúc ghi nhật ký làm mất nhật ký, gửi lại 10 người | Trung bình | Nhật ký marketing riêng, lần thử lại đọc lại MAIL_LOG và chỉ thêm địa chỉ chưa có; lỗi gì cũng thử lại | I102 (2 kiểu lỗi) |
| R1 giao diện R05, R06, R07, R15 | Trung bình | Trang bảo trì chỉ đổi chữ; trang quản trị ép tiếng Việt tại chỗ và trả lại khi rời; lưu ngôn ngữ gom một lượt; không đè phiên tab khác | U36, U37 |
| R1 S5 đến S9, R2 B2 đến B6 | Thấp | Ghi trùng nhật ký; ghi chú "Chép từ bản 8.0.8"; tiêu đề cột có khoảng trắng; khoá chuyển theo file; không đè chữ đã sửa ở tab mới; chữ đọc lại mỗi lô; chân từ chối nhận luôn có (kể cả khi tắt mẫu hoặc sửa ra rỗng); nút chỉ dùng biến link; kiểm hạn mức trước hộp hỏi; đọc lại hạn mức mỗi lô; câu lỗi tiếng Anh trong email xác nhận | I101, I102 |
| R1 giao diện R08 đến R14, R2 C1 đến C8 | Thấp | Trang auth theo lựa chọn vừa bấm; câu "đã gửi" giữ khi đổi ngôn ngữ; số đếm admin giảm sau khi đóng (chờ ghi xong); focus về nút sau khi đổi; nhãn đọc màn hình nói ngôn ngữ đang dùng; thanh đầu trang có nền đặc trên trình duyệt cũ (`@supports`); số đếm tab không đè chữ; nhãn mức không kéo dài; tương phản số đỏ và nhãn vàng; trình độ hiện theo ngôn ngữ tutor; Thoát gửi lựa chọn ngôn ngữ đang chờ; trang đăng nhập chỉ lưu ngôn ngữ trên máy; relabel không gọi lại máy chủ ở tab Đặt lịch, Account tutor; nút Zalo đúng chỗ trên trang bảo trì; ngày đã có buổi gập sẵn | U33 đến U37, ảnh chụp |

**Chấp nhận, không sửa (ghi ở CHUNK5H_GIAI_THICH.md mục 7):** R1 S8 (menu 1 ghi từng ô khi sửa câu giải thích hàng loạt ở bản sau), R1 S9e (hai dòng USERS cùng email), R2 U12c (hộp thoại không giữ phím Tab; Enter trên nút phía sau đã chặn), R2 U14d (nút Zalo có lúc che mép phải), R2 U11 phần "Hôm nay" khi để trang qua đêm, chép cả chữ gốc cũ (có ghi chú để xem lại).

## Còn phải kiểm trên Google thật

* Đổi tên và ẩn tab CONTENT cũ (`Sheet.setName`, `hideSheet`) trên file STAGING có dữ liệu thật của admin.
* Hộp thoại menu Email marketing, thời gian thật của một lượt gửi vài trăm email, hạn mức thật của tài khoản dùng thử (500).
* Giao diện trên iPhone (Safari) và Android (Chrome) thật, trong khung nhúng Google Sites.

## Báo cáo test đầy đủ

# Thaiput v8 · Báo cáo test

*Chạy lúc 23:43:12 17/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 102 | 102 | 0 |
| Giao diện web (jsdom + backend thật) | 37 | 37 | 0 |
| Bộ thử tải (loadtest/run.js với máy chủ giả) | 2 | 2 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 9 trigger (thêm calendarJob ở 5F) | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |
| I28 | Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực | Đạt |
| I29 | Nhắc buổi sáng (mặc định tắt, bật bằng CONFIG): mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua | Đạt |
| I30 | Chủ nhật sau 15:00: admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên | Đạt |
| I31 | Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên | Đạt |
| I32 | Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ | Đạt |
| I33 | Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm | Đạt |
| I34 | Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng | Đạt |
| I35 | Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử | Đạt |
| I36 | Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML | Đạt |
| I37 | Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên | Đạt |
| I38 | Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ | Đạt |
| I39 | Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật | Đạt |
| I41 | Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi | Đạt |
| I40 | MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy | Đạt |
| I42 | Tutor và admin: link dùng 1 lần, hạn 15 phút, phiên theo vai trò (tutor 30 ngày từ 16/10); email "Có đăng nhập mới" chỉ cho admin (16/10); học viên vẫn dùng link nhiều lần | Đạt |
| I43 | Bộ nhớ đệm phiên: không đọc tab AUTH mỗi lần gọi; thoát, thoát mọi thiết bị có hiệu lực ngay; danh sách thiết bị đúng | Đạt |
| I44 | Dọn tab AUTH mỗi ngày từ 03:00: bỏ link và phiên hết hạn quá 7 ngày, giữ phiên còn hạn; chạy lại trong ngày không làm gì | Đạt |
| I45 | Đăng nhập Google: chữ ký đúng thì vào; dùng lại (kể cả khi bộ đệm mất), quá 2 phút, sai chữ ký, sai vai trò, admin DISABLED bị chặn; chữ ký sai, đối số lạ không ghi Sheets, không lấy khoá, không khoá được chữ ký đúng | Đạt |
| I46 | Tutor tự xem số buổi tháng này, tháng trước: mọi cột khớp báo cáo lương; kết quả buổi học ghi đúng mã phiên đã bấm | Đạt |
| I47 | API admin: chỉ phiên ADMIN gọi được; số việc cần xử lý, lọc thông báo theo người và theo mức, đánh dấu đã đọc (lô), danh sách và chi tiết tutor, học viên, buổi học | Đạt |
| I48 | Admin đặt thay: qua hạn đặt vẫn đặt được, chỉ định tutor; vẫn chặn 1 buổi/ngày, slot đã bắt đầu, tutor không mở; email như khi học viên tự đặt | Đạt |
| I49 | Admin huỷ trên web: không giới hạn hạn huỷ, học viên được trả lại buổi, có thông báo ADMIN_CANCELLED; buổi đã huỷ hoặc đã bắt đầu không huỷ | Đạt |
| I50 | Xoá dữ liệu test: chặn khi ALLOW_DATA_RESET tắt hoặc gõ sai câu; mức 1 giữ tutor và admin, sao lưu trước, gỡ sự kiện tương lai không gửi thư, phiên hết hiệu lực ngay; mức 2 chỉ còn admin | Đạt |
| I51 | Admin vào Meet: thêm cả admin USERS đang hoạt động (co-founder), bỏ tài khoản chạy hệ thống (chủ sự kiện) và admin DISABLED | Đạt |
| I52 | Dự án phụ đăng nhập Google (dist_google_login) ký đúng định dạng mà dự án chính kiểm: mở link là vào; chưa cài khoá thì báo rõ, không có nút | Đạt |
| I53 | Menu Xoá dữ liệu test qua hộp thoại 2 bước: Huỷ ở bước nào cũng không xoá; nhập sai mức hoặc sai câu không xoá; đúng cả 2 bước mới xoá; người lạ không chạy được | Đạt |
| I54 | Tài khoản DISABLED: job mỗi giờ huỷ hẳn phiên, mở lại tài khoản không làm phiên cũ sống lại; admin thoát mọi thiết bị của một người trên web; phiên đọc AUTH ngay trước khi thoát không sống lại trong bộ đệm | Đạt |
| I55 | Dán code mới nhưng CHƯA chạy menu 1: thiếu cột AUTH.device vẫn đăng nhập được; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được | Đạt |
| I56 | Khoá menu xoá theo môi trường: cài đặt STAGING ghi ALLOW_DATA_RESET TRUE; switchToProduction ghi FALSE; PRODUCTION chỉ chủ file được xoá; nhắc 8:00 cũ (8) tự đổi -1 đúng một lần | Đạt |
| I57 | Huỷ và đổi tutor: khách admin (co-founder) được gỡ không gửi thư trước khi gửi thư huỷ, thư đổi tutor; sau đổi tutor admin được thêm lại không gửi thư | Đạt |
| I58 | purgeRows_: insert và update trong cùng khoá sau khi dọn vẫn ghi đúng hàng; dòng giữ lại còn nguyên | Đạt |
| I59 | Endpoint công khai không lấy khoá với đầu vào sai: link lạ, thoát với mã lạ, xin link cho email không có; 20 form đăng ký rác không làm khoá form của người thật | Đạt |
| I60 | Sửa sau lượt soát 2: khoá tài khoản trong USERS thoát mọi thiết bị ngay; gỡ khách admin cả khi đã tắt ADMIN_JOIN_MEET; chủ file không xác định thì từ chối; ô CONTENT "-" ẩn chữ trong email; cảnh báo link không https; huỷ lại báo rõ; đặt thay cho học viên không có gói báo trước; danh sách học viên hiện gói đang dùng | Đạt |
| I61 | Calendar gom ban đêm (NIGHTLY, dự phòng; mặc định QUEUE từ 16/10): đặt không gọi Calendar, email xác nhận báo link đến cùng lời mời; job trước 23:00 thoát không mở Sheets; từ 23:00 tạo đủ, chạy lại không trùng | Đạt |
| I62 | Đường gấp: buổi tối nay do admin đặt thay lúc 16:00, và buổi trong giờ yên tĩnh của QUEUE, được tạo sự kiện ngay khi đặt, email có link Meet | Đạt |
| I63 | Huỷ: chưa tạo sự kiện thì không gọi Google (SKIPPED); đã tạo thì gỡ sau khi nhả khoá (CANCELLED); gỡ lỗi thì hàng đợi gỡ lại | Đạt |
| I64 | Mã sự kiện cố định: lần trước đã tạo trên Google nhưng chưa ghi được mã thì lần sau dùng lại, không tạo sự kiện thứ hai, không gửi thư mời lần hai; huỷ vẫn gỡ đúng sự kiện | Đạt |
| I65 | Calendar lỗi: thử lại có chờ tăng dần; quá CALENDAR_MAX_ATTEMPTS lần thì FAILED và báo admin mức Khẩn đúng 1 lần | Đạt |
| I66 | Chống gửi trùng: cùng mã yêu cầu thì đặt đúng 1 lần, kể cả khi bộ đệm mất (mã lưu ở BOOKINGS); huỷ và đổi link đăng nhập gửi lại cùng mã nhận lại kết quả cũ | Đạt |
| I67 | Sau khi booking đã ghi, lỗi phía sau (khoá bận, Gmail lỗi) không biến kết quả thành thất bại; hàng đợi tự gắn sự kiện đã tạo | Đạt |
| I68 | Số lần lấy khoá: đặt lịch và huỷ mỗi việc tối đa 2 lần (trước 5F: 5 đến 7 lần); job nhắc gửi email khi không giữ khoá, gửi hỏng thì bỏ đánh dấu để gửi lại | Đạt |
| I69 | Danh sách slot dùng chung trong bộ đệm: lần xem thứ hai không tính lại; có người đặt hoặc tutor đổi lịch thì hết hiệu lực ngay; SLOT_CACHE_SECONDS = 0 tắt | Đạt |
| I70 | CONFIG đệm 60 giây: lần chạy mới không mở tab CONFIG; admin sửa tab CONFIG (onEdit) hoặc code ghi CONFIG thì có hiệu lực ngay | Đạt |
| I71 | Chống ghi nhầm dòng: admin sắp xếp tab BOOKINGS đúng lúc ghi thì vẫn ghi đúng buổi; ai đó gõ thêm dòng ở cuối thì dòng mới ghi sau, không đè | Đạt |
| I72 | Đối soát mỗi giờ: hai học viên cùng một tutor cùng giờ thì báo Khẩn 1 lần mỗi ngày; buổi trong 3 giờ tới chưa có sự kiện thì báo và giục hàng đợi | Đạt |
| I73 | Số đo: mỗi lượt API cộng vào bộ đệm theo giờ; job mỗi giờ chép giờ trước sang tab METRICS một lần; trang health trả OK mà không mở Sheets | Đạt |
| I74 | Tutor xác nhận nhiều buổi một lần: một lần lấy khoá, buổi sai hoặc của tutor khác báo riêng từng buổi, gửi lại cùng mã không ghi 2 lần | Đạt |
| I75 | Menu Đo tốc độ: đo từng phần việc với dữ liệu thật, ghi SPEED_TEST; menu Calendar chạy hàng đợi ngay bỏ qua giờ gom | Đạt |
| I76 | Đổi tutor đúng lúc hàng đợi đang tạo sự kiện: sự kiện được vá sang tutor mới ngay (không mời tutor cũ); đổi tutor buổi đã có sự kiện thì vá ngoài khoá, vá lỗi thì hàng đợi vá lại | Đạt |
| I77 | Hàng đợi: booking gấp đặt trong lúc job đang chạy không bị xoá gợi ý; huỷ đúng lúc job đang tạo mà lượt ghi cuối của job hỏng thì vẫn gỡ được sự kiện; tutor xác nhận kết quả lúc job tạo thì không gửi thư huỷ | Đạt |
| I78 | Chống gửi trùng: lần gửi lại khi lần đầu còn chạy nhận IN_PROGRESS (không phải "bận"); đổi link rác không ghi gì vào bộ đệm; mã sự kiện không đổi khi Sheets làm tròn mili giây; CONFIG đệm cũ ghi sau khi admin sửa thì bị bỏ | Đạt |
| I79 | Đăng nhập tutor: gửi lại cùng mã trong lúc lượt đầu đang gửi email "Có đăng nhập mới" nhận IN_PROGRESS rồi đúng phiên (không "link đã dùng"); email gửi sau khi kết quả đã lưu | Đạt |
| I80 | Hàng đợi: khoá bận đúng lúc đánh dấu thì giữ chỗ được gỡ, lượt 5 phút sau làm tiếp (không trễ 24 giờ); cả lô lỗi thì báo Khẩn ngay 1 lần; sau 00:00 có tổng kết lô đêm | Đạt |
| I81 | Đối soát gộp: 3 buổi trễ Calendar thì 3 dòng thông báo nhưng 1 email; buổi admin đã dán link Meet tay không bị báo; câu chữ theo trạng thái | Đạt |
| I82 | METRICS ghi thêm không đọc cả tab, dọn dòng cũ hơn 90 ngày; apiClientReport giới hạn 2.000 lượt mỗi giờ; email xác nhận NIGHTLY ghi giờ dự kiến của thư mời; booking cùng mã sau khi xoá dữ liệu không nhận sự kiện của buổi cũ | Đạt |
| I83 | Menu 1 sau 16/10: CALENDAR_MODE NIGHTLY cũ thành QUEUE, phiên tutor 90 thành 30, mẫu email cũ đổi; chỉ 1 lần (admin chọn lại thì giữ); phiên bản đổi thì sao lưu DB vào Releases trước, ghi RELEASE | Đạt |
| I84 | Bảo trì: READONLY chặn đặt, huỷ, lưu slot, đăng ký (không ghi, không lấy khoá) nhưng vẫn xem được; CLOSED chặn cả xem; admin và đăng nhập luôn chạy; OFF chạy lại | Đạt |
| I85 | Lưu trữ: chép dòng cũ đã xong sang file theo năm, đọc lại đủ rồi mới bỏ khỏi DB; gói còn chạy, admin_action, chờ duyệt, thông báo chưa đọc giữ lại; mã mới không trùng mã đã lưu trữ | Đạt |
| I86 | Lưu trữ an toàn khi hỏng: đọc lại thiếu thì không bỏ dòng nào và báo Khẩn; hỏng lúc bỏ khỏi DB thì lần sau hoàn tất đúng lô, không chép lần hai; job chỉ chạy từ 03:00, 1 lần mỗi ngày | Đạt |
| I87 | Thử tải: cổng POST đóng mặc định (không chạm Sheets); mở bằng khoá, chỉ thay mặt tài khoản @loadtest.invalid; đặt qua cổng đi đúng API thật, gửi lại cùng mã không trùng; email, Calendar không gửi tới địa chỉ giả; PRODUCTION xoá khoá | Đạt |
| I88 | Bản PRODUCTION chia file (luật 44): mỗi file src một file, có MANIFEST băm; nạp theo thứ tự NGƯỢC vẫn cài đặt, kiểm tra hệ thống, thêm tutor, mở trang được | Đạt |
| I89 | Giám sát (Q4): health trả OK khi job còn chạy, STALE khi một job ngừng quá hạn (hourly 150, reminder 45, calendar 30 phút); bận vẫn tính là còn sống; health không mở Sheets | Đạt |
| I90 | Lưu trữ khi admin sửa tay cùng lúc (soát R1 M1, R2 T1): sắp xếp lại tab và gõ thêm dòng giữa lúc chép và lúc bỏ thì không mất, không trùng; link "mở đúng dòng" của thông báo dời theo; file lưu trữ ở thùng rác thì dừng; mỗi tháng sao 1 bản file lưu trữ vào Releases | Đạt |
| I91 | Bảo trì không bỏ sót API (soát R2 T9): mọi api* ghi của học viên, tutor, form đăng ký đều bị chặn ở READONLY; lượt đặt đã ghi mà gửi lại lúc bảo trì vẫn nhận "đã đặt" (soát R2 T4); trang nhận trạng thái bảo trì qua r.maint; đủ chữ bảo trì 2 thứ tiếng | Đạt |
| I92 | Bỏ dòng an toàn (soát R3): lệnh ghi bị từ chối thì lần dọn sau không xoá gì; tab bị sắp xếp sau khi hỏng thì không tự xoá, báo Khẩn; sao lưu đêm bỏ lượt vì bận thì không lưu trữ; bộ đệm hỏng vẫn qua cổng bảo trì; link dời đúng khi có hàng trống | Đạt |
| I93 | Link "mở đúng dòng" dời đúng khi tab có hàng trống ở giữa (soát R3 N6) | Đạt |
| I94 | Bảo trì tạm dừng tự Hoàn thành (soát R1 L3): buổi đã qua 24 giờ giữ CONFIRMED khi đang bảo trì, tắt bảo trì thì job tự Hoàn thành | Đạt |
| I95 | Lô lưu trữ BOOKINGS hỏng ở bước xoá đuôi: lượt sau dọn đuôi, đóng lô, vẫn ghi mốc tháng đã chuyển cho báo cáo (soát R3 L1) | Đạt |
| I96 | Tab CONTENT bản cũ (cột value) tự chuyển sang bản song ngữ: tab cũ đổi tên CONTENT_CU_808 và ẩn (không xoá); chữ admin đã sửa sang đúng cột vi hoặc en; key bỏ được báo; chạy lại không đổi gì | Đạt |
| I97 | Chọn ngôn ngữ: apiSetLanguage lưu USERS.lang (chọn lại cùng thứ tiếng không ghi); đăng nhập bằng link trả lang; bảo trì chặn ghi; email đặt lịch theo ngôn ngữ người nhận ở trên | Đạt |
| I98 | Email marketing: nháp không gửi được; gửi thử cho mình không tính; gửi thật đúng nhóm, bỏ người từ chối và địa chỉ thử tải, ngôn ngữ người nhận ở trên, có chân từ chối; chạy lại không gửi trùng; người mới vào thì chỉ gửi người mới | Đạt |
| I99 | Email marketing an toàn hạn mức và thời gian: dừng khi còn đúng phần giữ lại cho email hệ thống, trạng thái SENDING; chạy lại gửi tiếp không trùng; quá thời gian thì dừng; menu hỏi lại kèm số người, Không thì không gửi | Đạt |
| I100 | Nút kiểm tra nội dung (5H): báo chữ CONTENT làm mất {bien}, danh sách cách nhau | sai số mục, chiến dịch marketing READY có lỗi; câu báo lỗi nhiều mã và lỗi phiên có đủ hai thứ tiếng | Đạt |
| I101 | Soát 5H S1: menu 1 bị cắt ngay sau khi đổi tên tab CONTENT cũ; lần chạy sau vẫn chép chữ admin đã sửa (đánh dấu ghi chú để xem lại); tiêu đề cột có khoảng trắng vẫn nhận ra | Đạt |
| I102 | Soát 5H S2 đến S5: hai lượt gửi cùng một chiến dịch thì lượt sau bị từ chối; admin đổi status DRAFT giữa chừng là dừng và giữ DRAFT; chân từ chối nhận luôn có kể cả khi tắt mẫu; nút chỉ nhận biến link | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả 2 bước (5F): chọn Completed chưa ghi gì; Save, xem lại, Save mới ghi COMPLETED; Back thì không ghi | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |
| U20 | Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor | Đạt |
| U21 | Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc | Đạt |
| U22 | Admin đặt thay học viên qua giao diện sau hạn 15:00, chọn tutor; xem chi tiết, huỷ buổi; tab Nhật ký tìm được | Đạt |
| U23 | Tutor tab Account: số buổi tháng; không còn mục thiết bị (16/10); nút Log out đưa về đăng nhập và phiên cũ hết hiệu lực | Đạt |
| U24 | Trang đăng nhập Google: chữ ký hợp lệ vào cổng admin; chữ ký sai báo lỗi và có nút xin link; nút Google chỉ hiện khi có GOOGLE_LOGIN_URL | Đạt |
| U25 | Admin xem tutor trên giao diện: số buổi tháng, buổi sắp tới, thoát mọi thiết bị của tutor đó | Đạt |
| U26 | Học viên có gói hết hạn và gói đang dùng: thẻ chính hiện gói đang dùng (lỗi sắp xếp ACTIVE = 0 đã sửa) | Đạt |
| U27 | Tự thử lại (5F): Google từ chối 2 lượt mở cổng thì trang vẫn mở, không báo lỗi; đặt lịch mất phản hồi thì thử lại cùng mã, chỉ đặt 1 lần, hiện kết quả | Đạt |
| U28 | Cổng học viên (5F): mở trang lấy luôn slot (không gọi apiStudentSlots khi vào tab đặt lịch); buổi chưa có link Meet ghi rõ link đến cùng lời mời lịch | Đạt |
| U29 | Máy tính (5F): thanh tab thành cột trái, lịch rảnh của tutor là lưới tuần mở sẵn mọi ngày, ngày đặt lịch của học viên mở sẵn | Đạt |
| U30 | Đông người (5F, soát R2): hệ thống bận thì dải "đang thử lại" hiện trong lúc thử và tắt khi xong; nút Đặt trở lại chữ cũ, không kẹt "Đang đặt..." | Đạt |
| U31 | 16/10: tab Tài khoản học viên không còn mục thiết bị; 5G: bảo trì CHỈ XEM hiện thanh báo, bấm Đặt nhận câu bảo trì và không ghi; ĐÓNG thì cổng hiện trang bảo trì (desktop và điện thoại) | Đạt |
| U32 | Trang chủ: bấm EN đổi mọi chữ sang tiếng Anh, giữ chữ đã nhập và ảnh đã chọn; trình độ gửi lên vẫn là bản tiếng Việt; mở lại trang vẫn tiếng Anh | Đạt |
| U33 | Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu vào USERS; lần sau không hỏi; thiết bị khác tự theo lựa chọn đã lưu | Đạt |
| U34 | Tutor đổi ngôn ngữ giữa chừng: giờ rảnh chưa lưu và thanh Lưu vẫn còn, chữ đổi sang tiếng Việt, lưu USERS.lang; admin không có nút VI | EN | Đạt |
| U35 | Thông báo admin gọn (5H): mỗi thông báo một dòng, gom Hôm nay, Hôm qua; lọc bằng nút Khẩn, Tất cả; bấm dòng mở chi tiết; điện thoại và máy tính | Đạt |
| U36 | Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang quản trị luôn tiếng Việt dù máy lưu EN; đổi ngôn ngữ không đè phiên của tab khác; tutor thấy trình độ theo ngôn ngữ | Đạt |
| U37 | Soát 5H vòng 2: rời trang quản trị trả lại ngôn ngữ đã lưu; bấm EN rồi Thoát ngay vẫn lưu lên máy chủ; tab đã thoát không đổi ngôn ngữ của tài khoản tab khác; tab Account tutor đổi ngôn ngữ không gọi lại máy chủ | Đạt |

## Bộ thử tải

| # | Test | Kết quả |
|---|---|---|
| L01 | run.js qua 302 như Google: 3 lượt trang chủ và 3 lượt đặt bị từ chối trước khi tới máy chủ, 2 lượt đặt ĐÃ GHI rồi mới trả trang lỗi; 15 người ảo, huỷ 30%: không trùng, không mất, kết quả khớp Sheets | Đạt |
| L02 | run.js báo lỗi khi máy chủ bận mãi: thử lại đúng 9 lần cùng một mã rồi dừng, kết quả BUSY, thoát mã 3 (không coi là bình thường) | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5H.md -->

---

## `v8/reports/REPORT_CHUNK5I.md`

*Ngày tạo trong Project: 2026-10-18T14:59:30Z*

<!-- BEGIN FILE: v8/reports/REPORT_CHUNK5I.md | bytes=44983 | sha256=2a0a763cb49e2043a389fb2d8d99ba858b1e30fb6fe27e82ac456e4db67fd372 | created=2026-10-18T14:59:30Z -->
# Thaiput v8 · Báo cáo chunk 5I (email không tới, tốc độ, song ngữ toàn diện trang quản trị, nhật ký đầy đủ)

*Ngày 18/10/2026. Phiên bản 8.0.10. Phần cuối là báo cáo đầy đủ do `node test/harness.js` sinh ra.*

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Hàm thuần và Db | 26/26 |
| 40 kịch bản | 40/40. Không sửa kết quả mong đợi nào |
| Tích hợp | 110/110 (mới: I103 đến I110; sửa I01, I02 theo 10 trigger, I34, I47, I60, I78, I104, I107, I108) |
| Giao diện web | 44/44 (mới: U38 đến U44; sửa U21, U22, U24, U34, U36, U37 theo trang quản trị song ngữ) |
| Bộ thử tải | 2/2 |
| Thử phá code | 3 vòng, 60 lỗi cài cố ý vào code 5I: cả 60 bị bắt. 4 lỗi lần đầu lọt (logAppend_ đọc cả tab; appendRowsRaw_ ghi đè cột admin; trần hàng chờ nhật ký; gọi máy chủ hai lần khi đổi ngôn ngữ), đã thêm kiểm vào I103, I109, U44 và chạy lại: bị bắt. File: `THU_PHA_5I.txt` |
| Soát độc lập | 4 agent, 2 vòng. Vòng 1: máy chủ 16 mục (`SOAT_5I_R1_MAYCHU.md`), giao diện 19 mục (`SOAT_5I_R1_GIAODIEN.md`). Vòng 2 trên bản đã sửa: máy chủ 9 phát hiện mới (`SOAT_5I_R2_MAYCHU.md`), giao diện và tài liệu 9 phát hiện mới cùng 9 mục tài liệu (`SOAT_5I_R2_GIAODIEN.md`). Không có mức CAO. Đã sửa hết |
| Bản dán | `dist/Code.gs` 584 KB (8.143 dòng), `dist/Index.html` 164 KB (2.232 dòng). Một file mỗi loại |
| Demo | Dựng lại theo hợp đồng API mới, bấm thử bằng trình duyệt thật ở 360px và 420px: không lỗi JavaScript, không tràn ngang |

## Đã làm theo yêu cầu 18/10

| # | Yêu cầu | Kết quả | Test |
|---|---|---|---|
| 1 | Gửi link đăng nhập: người nhận không thấy thư, hạn mức vẫn bị trừ | Chẩn đoán có nguồn; menu Kiểm tra gửi email (thư có mã, hạn mức trước và sau, 4 bước tìm thư); hướng dẫn triển khai mục 12 | I104 |
| 2 | Triển khai bằng admin@ chậm | Đo trên giả lập, sửa việc thừa (mở file, đọc cấu hình, ghi nhật ký không đọc cả tab, trang quản trị một lượt gọi); quy trình đo trên hệ thống thật (mục 13) | I103, U41 |
| 3 | Workspace mà hạn mức 100 | Giới hạn của tài khoản dùng thử (Google ghi, không công bố số); menu 2 nhận ra và giải thích; đếm 24 giờ trượt; không ước tính khi giả lập giờ | I104 |
| 4 | Song ngữ trang quản trị, tên gói, toàn diện | 268 key `ad.*`; nhãn sự kiện, hành động, trạng thái, lý do huỷ, câu báo máy chủ; `message_en`, `name_en`; ngày theo thứ; trang lỗi, demo song ngữ | I105, I106, I108, U39, U42, U44 |
| 5 | Nhật ký ghi mọi hoạt động, tự xoá tin cũ sau 2 tháng, xem trước, bấm đọc | Ghi API, job, menu, đăng nhập, thoát, sửa tay, đổi cấu trúc tab; hiện 60 ngày, chuyển lưu trữ (không xoá hẳn, luật 10); xem trước 160 ký tự, đọc đủ, tìm theo nhãn, Xem thêm không trùng, không lặp | I106, I107, I109, I110, U40, U43, U44 |
| 6 | Mọi nút thông báo admin bấm được | 6 ô số liệu, nút trong hộp thông báo (tối đa 3 buổi, người, tài khoản, dòng Sheets), Tải lại | U38, U43, U44 |
| 7 | 4a | Giữ nguyên ngày đã đặt thu gọn | không đổi |

## Soát độc lập vòng 2: phát hiện và xử lý

| Phát hiện | Mức | Xử lý | Test |
|---|---|---|---|
| Máy chủ N1: hàng chờ nhật ký mất, trùng, vượt 100KB | VỪA | Script Properties, mỗi dòng một khoá, xoá sau khi ghi, chỉ đưa lại khi khoá bận, trần 150 dòng, chi tiết 1.500 ký tự | I109 |
| N2: Xem thêm lặp khi hơn 300 dòng cùng giờ; mở nhầm dòng | THẤP | Con trỏ `{ ts, sig, n }`; mã băm nội dung khi mở | I107, I109 |
| N3: xoá tab ghi sai tên | THẤP | Danh sách tab `SHEET_SNAP`; báo Khẩn khi tab hệ thống bị xoá, đổi tên | I110 |
| N4: bỏ dòng ghi công thức ở cột admin thêm | THẤP | `safeCellText_` cho cột ngoài SCHEMA | I109 |
| N5: menu kiểm tra email báo sai khi mẫu tắt, khoá bận | THẤP | Kiểm mẫu trước; ghi nhật ký qua logMenu_ | I104 |
| N6: hạn mức sai khi giả lập giờ | THẤP | Không ước tính, báo rõ | I104 |
| N7: onChange kiểm quyền trước khi lọc | THẤP | Lọc EDIT, FORMAT trước | I110 |
| N8: chi tiết nhật ký tiếng Việt | THẤP | JSON trung tính; bỏ `label`, `statusText` một thứ tiếng | I110 |
| N9: lưu trữ theo 500 dòng ngược chiều tải | THẤP | Gom theo tuổi 7 ngày | I109 |
| Mock "tốt bụng" (mã dạng ngày) | THẤP | Cột action, entity, entity_id, kind thành chữ | I109 |
| Giao diện N1: lý do huỷ mặc định | VỪA | Trình duyệt gửi rỗng; máy chủ nhận cả hai bản mặc định | I108, U44 |
| N2: chuyển tab dùng danh sách cũ | VỪA | Bấm tab, ô số liệu luôn lấy mới; Tải lại thường trực | U44 |
| N3: nút "ad.retry" | THẤP | Key chung `a.retry`, câu báo theo ngôn ngữ | U44 |
| N4: gọi máy chủ hai lần khi đổi ngôn ngữ | THẤP | Cờ đang tải, số lượt trên trạng thái chung | U44 |
| N5: tìm theo họ nhãn | THẤP | Ghép nhãn gói, bảo trì; cờ Admin sửa Sheets | U44 |
| N6: mất chỗ đứng bàn phím, hộp thoại không tên | THẤP | Trả focus sau khi vẽ lại; aria-labelledby; giữ Tab trong hộp | U44 |
| N7: demo lệch hợp đồng | THẤP | Chép đúng con trỏ, tìm theo nhãn, dữ liệu nhất quán, thanh demo song ngữ | Playwright |
| N8: đặt thay lỗi sau đổi ngôn ngữ | THẤP | Vẽ lỗi vào khung đang hiện | U44 |
| N9: thông báo đặt buổi ngày ISO | THẤP | Ngày theo thứ hai thứ tiếng | I110 |
| D1 đến D9 tài liệu | VỪA, THẤP | Sửa theo trang chính thức của Google (link trong báo cáo soát) | đọc lại |

## Còn phải kiểm trên Google thật

* Thư kiểm tra có mã tới Gmail cá nhân và tới địa chỉ tutor không nhận được thư; kết quả Email log search.
* Đặt cùng lúc từ 2 máy trên STAGING (mở lại file mỗi lần vào khoá).
* Thêm, xoá một tab thử: nhật ký ghi đúng tên tab (trigger onChange thật).
* Menu Đo tốc độ, trang Lần thực thi nếu vẫn thấy chậm.

## Báo cáo test đầy đủ

# Thaiput v8 · Báo cáo test

*Chạy lúc 21:10:48 18/10/2026 · Node v22.22.0*

| Phần | Đạt | Tổng | Chưa cài |
|---|---|---|---|
| Hàm thuần và Db | 26 | 26 | 0 |
| 40 kịch bản | 40 | 40 | 0 |
| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | 110 | 110 | 0 |
| Giao diện web (jsdom + backend thật) | 44 | 44 | 0 |
| Bộ thử tải (loadtest/run.js với máy chủ giả) | 2 | 2 | 0 |

## 40 kịch bản

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| A01 | Gửi form đăng ký, số điện thoại lưu đúng chữ +84 | Đạt |  |
| A02 | Form thiếu ảnh, thiếu đồng ý, số sai bị chặn; số đúng được chuẩn hoá; số trống và số nước ngoài được nhận | Đạt |  |
| A03 | Mỗi email chỉ dùng Trial 1 lần | Đạt |  |
| A04 | Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng | Đạt |  |
| A05 | Link đăng nhập dùng 1 lần, hết hạn sau 15 phút | Đạt |  |
| A06 | Giới hạn 3 lần xin link; email lạ không lộ thông tin | Đạt |  |
| B07 | Trial đặt buổi đầu, gói 14/10 đến 20/10 | Đạt |  |
| B08 | Trial 2 buổi, buổi thứ ba NO_SESSIONS | Đạt |  |
| B09 | Đặt ngoài hạn Trial OUT_OF_RANGE | Đạt |  |
| B10 | Ngày cuối gói 23:30 được, ngày sau bị chặn | Đạt |  |
| B11 | Gói 2 tuần tính lại khi huỷ buổi đầu | Đạt |  |
| B12 | Huỷ buổi duy nhất, gói về INACTIVE | Đạt |  |
| B13 | Gói nối tiếp QUEUED và buổi gắn đúng gói mới | Đạt |  |
| B14 | Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày | Đạt |  |
| B15 | dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày | Đạt |  |
| B16 | Email nhắc 60 phút gửi đúng 1 lần, đúng người | Đạt |  |
| B17 | Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS | Đạt |  |
| B18 | Gói hết hạn bị từ chối EXPIRED | Đạt |  |
| C19 | Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn | Đạt |  |
| C20 | Không đặt buổi trong ngày | Đạt |  |
| C21 | 1 buổi/ngày, server tự kiểm tra | Đạt |  |
| C22 | 23:30 và 08:00 hôm sau là 2 ngày khác nhau | Đạt |  |
| C23 | Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet | Đạt |  |
| C24 | Hai người tranh slot cuối, chỉ 1 người được | Đạt |  |
| C25 | Gán xoay vòng trong nhóm ít buổi nhất | Đạt |  |
| C26 | Ngày tutor chưa mở lịch không đặt được | Đạt |  |
| D27 | Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại | Đạt |  |
| D28 | Huỷ sau hạn bị chặn | Đạt |  |
| D29 | Huỷ rồi đặt lại cùng ngày theo hạn 15:00 | Đạt |  |
| D30 | Không huỷ được booking của người khác | Đạt |  |
| E31 | Tutor mở và tắt slot trước hạn | Đạt |  |
| E32 | Tắt slot sau hạn cần admin duyệt | Đạt |  |
| E33 | Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời | Đạt |  |
| E34 | Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial | Đạt |  |
| E35 | Admin không duyệt kịp: tự từ chối, tutor vẫn dạy | Đạt |  |
| E36 | Tutor thêm slot sau hạn, học viên đặt được | Đạt |  |
| E37 | Tutor không xem được lịch tutor khác và thông tin riêng học viên | Đạt |  |
| F38 | Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương | Đạt |  |
| F39 | Quá 24 giờ tự hoàn thành, báo admin | Đạt |  |
| F40 | Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản | Đạt |  |

## Tích hợp

| # | Test | Kết quả |
|---|---|---|
| I01 | Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 10 trigger (calendarJob 5F, onChangeInstallable 5I) | Đạt |
| I02 | Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu | Đạt |
| I03 | Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001 | Đạt |
| I04 | Chuyển dữ liệu v6: chạy thử ra bảng so sánh, chạy thật khớp số, không trừ buổi 2 lần | Đạt |
| I05 | Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản | Đạt |
| I06 | doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật | Đạt |
| I07 | Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên | Đạt |
| I08 | Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết | Đạt |
| I09 | MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới | Đạt |
| I10 | Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng | Đạt |
| I11 | Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được | Đạt |
| I12 | Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy | Đạt |
| I13 | Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange) | Đạt |
| I14 | Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets | Đạt |
| I15 | Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ | Đạt |
| I16 | Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút | Đạt |
| I17 | Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin | Đạt |
| I18 | WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec | Đạt |
| I19 | Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web | Đạt |
| I20 | Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới | Đạt |
| I21 | Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi) | Đạt |
| I22 | Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được | Đạt |
| I23 | Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không | Đạt |
| I24 | Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền | Đạt |
| I25 | Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay | Đạt |
| I26 | Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin | Đạt |
| I27 | Xin link quá nhiều: 3 lần mỗi 5 phút, báo thử lại sau 5 phút; email không còn số điện thoại admin | Đạt |
| I28 | Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực | Đạt |
| I29 | Nhắc buổi sáng (mặc định tắt, bật bằng CONFIG): mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua | Đạt |
| I30 | Chủ nhật sau 15:00: admin nhận 1 email liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên | Đạt |
| I31 | Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên | Đạt |
| I32 | Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ | Đạt |
| I33 | Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm | Đạt |
| I34 | Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng | Đạt |
| I35 | Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử | Đạt |
| I36 | Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML | Đạt |
| I37 | Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên | Đạt |
| I38 | Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ | Đạt |
| I39 | Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật | Đạt |
| I41 | Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi | Đạt |
| I40 | MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy | Đạt |
| I42 | Tutor và admin: link dùng 1 lần, hạn 15 phút, phiên theo vai trò (tutor 30 ngày từ 16/10); email "Có đăng nhập mới" chỉ cho admin (16/10); học viên vẫn dùng link nhiều lần | Đạt |
| I43 | Bộ nhớ đệm phiên: không đọc tab AUTH mỗi lần gọi; thoát, thoát mọi thiết bị có hiệu lực ngay; danh sách thiết bị đúng | Đạt |
| I44 | Dọn tab AUTH mỗi ngày từ 03:00: bỏ link và phiên hết hạn quá 7 ngày, giữ phiên còn hạn; chạy lại trong ngày không làm gì | Đạt |
| I45 | Đăng nhập Google: chữ ký đúng thì vào; dùng lại (kể cả khi bộ đệm mất), quá 2 phút, sai chữ ký, sai vai trò, admin DISABLED bị chặn; chữ ký sai, đối số lạ không ghi Sheets, không lấy khoá, không khoá được chữ ký đúng | Đạt |
| I46 | Tutor tự xem số buổi tháng này, tháng trước: mọi cột khớp báo cáo lương; kết quả buổi học ghi đúng mã phiên đã bấm | Đạt |
| I47 | API admin: chỉ phiên ADMIN gọi được; số việc cần xử lý, lọc thông báo theo người và theo mức, đánh dấu đã đọc (lô), danh sách và chi tiết tutor, học viên, buổi học | Đạt |
| I48 | Admin đặt thay: qua hạn đặt vẫn đặt được, chỉ định tutor; vẫn chặn 1 buổi/ngày, slot đã bắt đầu, tutor không mở; email như khi học viên tự đặt | Đạt |
| I49 | Admin huỷ trên web: không giới hạn hạn huỷ, học viên được trả lại buổi, có thông báo ADMIN_CANCELLED; buổi đã huỷ hoặc đã bắt đầu không huỷ | Đạt |
| I50 | Xoá dữ liệu test: chặn khi ALLOW_DATA_RESET tắt hoặc gõ sai câu; mức 1 giữ tutor và admin, sao lưu trước, gỡ sự kiện tương lai không gửi thư, phiên hết hiệu lực ngay; mức 2 chỉ còn admin | Đạt |
| I51 | Admin vào Meet: thêm cả admin USERS đang hoạt động (co-founder), bỏ tài khoản chạy hệ thống (chủ sự kiện) và admin DISABLED | Đạt |
| I52 | Dự án phụ đăng nhập Google (dist_google_login) ký đúng định dạng mà dự án chính kiểm: mở link là vào; chưa cài khoá thì báo rõ, không có nút | Đạt |
| I53 | Menu Xoá dữ liệu test qua hộp thoại 2 bước: Huỷ ở bước nào cũng không xoá; nhập sai mức hoặc sai câu không xoá; đúng cả 2 bước mới xoá; người lạ không chạy được | Đạt |
| I54 | Tài khoản DISABLED: job mỗi giờ huỷ hẳn phiên, mở lại tài khoản không làm phiên cũ sống lại; admin thoát mọi thiết bị của một người trên web; phiên đọc AUTH ngay trước khi thoát không sống lại trong bộ đệm | Đạt |
| I55 | Dán code mới nhưng CHƯA chạy menu 1: thiếu cột AUTH.device vẫn đăng nhập được; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được | Đạt |
| I56 | Khoá menu xoá theo môi trường: cài đặt STAGING ghi ALLOW_DATA_RESET TRUE; switchToProduction ghi FALSE; PRODUCTION chỉ chủ file được xoá; nhắc 8:00 cũ (8) tự đổi -1 đúng một lần | Đạt |
| I57 | Huỷ và đổi tutor: khách admin (co-founder) được gỡ không gửi thư trước khi gửi thư huỷ, thư đổi tutor; sau đổi tutor admin được thêm lại không gửi thư | Đạt |
| I58 | purgeRows_: insert và update trong cùng khoá sau khi dọn vẫn ghi đúng hàng; dòng giữ lại còn nguyên | Đạt |
| I59 | Endpoint công khai không lấy khoá với đầu vào sai: link lạ, thoát với mã lạ, xin link cho email không có; 20 form đăng ký rác không làm khoá form của người thật | Đạt |
| I60 | Sửa sau lượt soát 2: khoá tài khoản trong USERS thoát mọi thiết bị ngay; gỡ khách admin cả khi đã tắt ADMIN_JOIN_MEET; chủ file không xác định thì từ chối; ô CONTENT "-" ẩn chữ trong email; cảnh báo link không https; huỷ lại báo rõ; đặt thay cho học viên không có gói báo trước; danh sách học viên hiện gói đang dùng | Đạt |
| I61 | Calendar gom ban đêm (NIGHTLY, dự phòng; mặc định QUEUE từ 16/10): đặt không gọi Calendar, email xác nhận báo link đến cùng lời mời; job trước 23:00 thoát không mở Sheets; từ 23:00 tạo đủ, chạy lại không trùng | Đạt |
| I62 | Đường gấp: buổi tối nay do admin đặt thay lúc 16:00, và buổi trong giờ yên tĩnh của QUEUE, được tạo sự kiện ngay khi đặt, email có link Meet | Đạt |
| I63 | Huỷ: chưa tạo sự kiện thì không gọi Google (SKIPPED); đã tạo thì gỡ sau khi nhả khoá (CANCELLED); gỡ lỗi thì hàng đợi gỡ lại | Đạt |
| I64 | Mã sự kiện cố định: lần trước đã tạo trên Google nhưng chưa ghi được mã thì lần sau dùng lại, không tạo sự kiện thứ hai, không gửi thư mời lần hai; huỷ vẫn gỡ đúng sự kiện | Đạt |
| I65 | Calendar lỗi: thử lại có chờ tăng dần; quá CALENDAR_MAX_ATTEMPTS lần thì FAILED và báo admin mức Khẩn đúng 1 lần | Đạt |
| I66 | Chống gửi trùng: cùng mã yêu cầu thì đặt đúng 1 lần, kể cả khi bộ đệm mất (mã lưu ở BOOKINGS); huỷ và đổi link đăng nhập gửi lại cùng mã nhận lại kết quả cũ | Đạt |
| I67 | Sau khi booking đã ghi, lỗi phía sau (khoá bận, Gmail lỗi) không biến kết quả thành thất bại; hàng đợi tự gắn sự kiện đã tạo | Đạt |
| I68 | Số lần lấy khoá: đặt lịch và huỷ mỗi việc tối đa 2 lần (trước 5F: 5 đến 7 lần); job nhắc gửi email khi không giữ khoá, gửi hỏng thì bỏ đánh dấu để gửi lại | Đạt |
| I69 | Danh sách slot dùng chung trong bộ đệm: lần xem thứ hai không tính lại; có người đặt hoặc tutor đổi lịch thì hết hiệu lực ngay; SLOT_CACHE_SECONDS = 0 tắt | Đạt |
| I70 | CONFIG đệm 60 giây: lần chạy mới không mở tab CONFIG; admin sửa tab CONFIG (onEdit) hoặc code ghi CONFIG thì có hiệu lực ngay | Đạt |
| I71 | Chống ghi nhầm dòng: admin sắp xếp tab BOOKINGS đúng lúc ghi thì vẫn ghi đúng buổi; ai đó gõ thêm dòng ở cuối thì dòng mới ghi sau, không đè | Đạt |
| I72 | Đối soát mỗi giờ: hai học viên cùng một tutor cùng giờ thì báo Khẩn 1 lần mỗi ngày; buổi trong 3 giờ tới chưa có sự kiện thì báo và giục hàng đợi | Đạt |
| I73 | Số đo: mỗi lượt API cộng vào bộ đệm theo giờ; job mỗi giờ chép giờ trước sang tab METRICS một lần; trang health trả OK mà không mở Sheets | Đạt |
| I74 | Tutor xác nhận nhiều buổi một lần: một lần lấy khoá, buổi sai hoặc của tutor khác báo riêng từng buổi, gửi lại cùng mã không ghi 2 lần | Đạt |
| I75 | Menu Đo tốc độ: đo từng phần việc với dữ liệu thật, ghi SPEED_TEST; menu Calendar chạy hàng đợi ngay bỏ qua giờ gom | Đạt |
| I76 | Đổi tutor đúng lúc hàng đợi đang tạo sự kiện: sự kiện được vá sang tutor mới ngay (không mời tutor cũ); đổi tutor buổi đã có sự kiện thì vá ngoài khoá, vá lỗi thì hàng đợi vá lại | Đạt |
| I77 | Hàng đợi: booking gấp đặt trong lúc job đang chạy không bị xoá gợi ý; huỷ đúng lúc job đang tạo mà lượt ghi cuối của job hỏng thì vẫn gỡ được sự kiện; tutor xác nhận kết quả lúc job tạo thì không gửi thư huỷ | Đạt |
| I78 | Chống gửi trùng: lần gửi lại khi lần đầu còn chạy nhận IN_PROGRESS (không phải "bận"); đổi link rác không ghi gì vào bộ đệm; mã sự kiện không đổi khi Sheets làm tròn mili giây; CONFIG đệm cũ ghi sau khi admin sửa thì bị bỏ | Đạt |
| I79 | Đăng nhập tutor: gửi lại cùng mã trong lúc lượt đầu đang gửi email "Có đăng nhập mới" nhận IN_PROGRESS rồi đúng phiên (không "link đã dùng"); email gửi sau khi kết quả đã lưu | Đạt |
| I80 | Hàng đợi: khoá bận đúng lúc đánh dấu thì giữ chỗ được gỡ, lượt 5 phút sau làm tiếp (không trễ 24 giờ); cả lô lỗi thì báo Khẩn ngay 1 lần; sau 00:00 có tổng kết lô đêm | Đạt |
| I81 | Đối soát gộp: 3 buổi trễ Calendar thì 3 dòng thông báo nhưng 1 email; buổi admin đã dán link Meet tay không bị báo; câu chữ theo trạng thái | Đạt |
| I82 | METRICS ghi thêm không đọc cả tab, dọn dòng cũ hơn 90 ngày; apiClientReport giới hạn 2.000 lượt mỗi giờ; email xác nhận NIGHTLY ghi giờ dự kiến của thư mời; booking cùng mã sau khi xoá dữ liệu không nhận sự kiện của buổi cũ | Đạt |
| I83 | Menu 1 sau 16/10: CALENDAR_MODE NIGHTLY cũ thành QUEUE, phiên tutor 90 thành 30, mẫu email cũ đổi; chỉ 1 lần (admin chọn lại thì giữ); phiên bản đổi thì sao lưu DB vào Releases trước, ghi RELEASE | Đạt |
| I84 | Bảo trì: READONLY chặn đặt, huỷ, lưu slot, đăng ký (không ghi, không lấy khoá) nhưng vẫn xem được; CLOSED chặn cả xem; admin và đăng nhập luôn chạy; OFF chạy lại | Đạt |
| I85 | Lưu trữ: chép dòng cũ đã xong sang file theo năm, đọc lại đủ rồi mới bỏ khỏi DB; gói còn chạy, admin_action, chờ duyệt, thông báo chưa đọc giữ lại; mã mới không trùng mã đã lưu trữ | Đạt |
| I86 | Lưu trữ an toàn khi hỏng: đọc lại thiếu thì không bỏ dòng nào và báo Khẩn; hỏng lúc bỏ khỏi DB thì lần sau hoàn tất đúng lô, không chép lần hai; job chỉ chạy từ 03:00, 1 lần mỗi ngày | Đạt |
| I87 | Thử tải: cổng POST đóng mặc định (không chạm Sheets); mở bằng khoá, chỉ thay mặt tài khoản @loadtest.invalid; đặt qua cổng đi đúng API thật, gửi lại cùng mã không trùng; email, Calendar không gửi tới địa chỉ giả; PRODUCTION xoá khoá | Đạt |
| I88 | Bản PRODUCTION chia file (luật 44): mỗi file src một file, có MANIFEST băm; nạp theo thứ tự NGƯỢC vẫn cài đặt, kiểm tra hệ thống, thêm tutor, mở trang được | Đạt |
| I89 | Giám sát (Q4): health trả OK khi job còn chạy, STALE khi một job ngừng quá hạn (hourly 150, reminder 45, calendar 30 phút); bận vẫn tính là còn sống; health không mở Sheets | Đạt |
| I90 | Lưu trữ khi admin sửa tay cùng lúc (soát R1 M1, R2 T1): sắp xếp lại tab và gõ thêm dòng giữa lúc chép và lúc bỏ thì không mất, không trùng; link "mở đúng dòng" của thông báo dời theo; file lưu trữ ở thùng rác thì dừng; mỗi tháng sao 1 bản file lưu trữ vào Releases | Đạt |
| I91 | Bảo trì không bỏ sót API (soát R2 T9): mọi api* ghi của học viên, tutor, form đăng ký đều bị chặn ở READONLY; lượt đặt đã ghi mà gửi lại lúc bảo trì vẫn nhận "đã đặt" (soát R2 T4); trang nhận trạng thái bảo trì qua r.maint; đủ chữ bảo trì 2 thứ tiếng | Đạt |
| I92 | Bỏ dòng an toàn (soát R3): lệnh ghi bị từ chối thì lần dọn sau không xoá gì; tab bị sắp xếp sau khi hỏng thì không tự xoá, báo Khẩn; sao lưu đêm bỏ lượt vì bận thì không lưu trữ; bộ đệm hỏng vẫn qua cổng bảo trì; link dời đúng khi có hàng trống | Đạt |
| I93 | Link "mở đúng dòng" dời đúng khi tab có hàng trống ở giữa (soát R3 N6) | Đạt |
| I94 | Bảo trì tạm dừng tự Hoàn thành (soát R1 L3): buổi đã qua 24 giờ giữ CONFIRMED khi đang bảo trì, tắt bảo trì thì job tự Hoàn thành | Đạt |
| I95 | Lô lưu trữ BOOKINGS hỏng ở bước xoá đuôi: lượt sau dọn đuôi, đóng lô, vẫn ghi mốc tháng đã chuyển cho báo cáo (soát R3 L1) | Đạt |
| I96 | Tab CONTENT bản cũ (cột value) tự chuyển sang bản song ngữ: tab cũ đổi tên CONTENT_CU_808 và ẩn (không xoá); chữ admin đã sửa sang đúng cột vi hoặc en; key bỏ được báo; chạy lại không đổi gì | Đạt |
| I97 | Chọn ngôn ngữ: apiSetLanguage lưu USERS.lang (chọn lại cùng thứ tiếng không ghi); đăng nhập bằng link trả lang; bảo trì chặn ghi; email đặt lịch theo ngôn ngữ người nhận ở trên | Đạt |
| I98 | Email marketing: nháp không gửi được; gửi thử cho mình không tính; gửi thật đúng nhóm, bỏ người từ chối và địa chỉ thử tải, ngôn ngữ người nhận ở trên, có chân từ chối; chạy lại không gửi trùng; người mới vào thì chỉ gửi người mới | Đạt |
| I99 | Email marketing an toàn hạn mức và thời gian: dừng khi còn đúng phần giữ lại cho email hệ thống, trạng thái SENDING; chạy lại gửi tiếp không trùng; quá thời gian thì dừng; menu hỏi lại kèm số người, Không thì không gửi | Đạt |
| I100 | Nút kiểm tra nội dung (5H): báo chữ CONTENT làm mất {bien}, danh sách cách nhau | sai số mục, chiến dịch marketing READY có lỗi; câu báo lỗi nhiều mã và lỗi phiên có đủ hai thứ tiếng | Đạt |
| I101 | Soát 5H S1: menu 1 bị cắt ngay sau khi đổi tên tab CONTENT cũ; lần chạy sau vẫn chép chữ admin đã sửa (đánh dấu ghi chú để xem lại); tiêu đề cột có khoảng trắng vẫn nhận ra | Đạt |
| I102 | Soát 5H S2 đến S5: hai lượt gửi cùng một chiến dịch thì lượt sau bị từ chối; admin đổi status DRAFT giữa chừng là dừng và giữ DRAFT; chân từ chối nhận luôn có kể cả khi tắt mẫu; nút chỉ nhận biến link | Đạt |
| I103 | Tốc độ (5I): một lượt đặt mở file DB tối đa 3 lần (mở lại khi vào khoá), đọc ENV và DB_ID tối đa 2 lần; ghi nhật ký và MAIL_LOG không đọc cả tab (20.000 dòng nhật ký không làm lượt đặt đọc thêm); dòng nhật ký vẫn đủ và đúng thứ tự | Đạt |
| I104 | Email (5I): hạn mức 100 trên Workspace được giải thích là mức dùng thử; Gmail thường; MARKETING_QUOTA_RESERVE không nhỏ hơn hạn mức thì báo trước; menu Kiểm tra gửi email gửi thư có mã, ghi nhật ký, báo hạn mức trước và sau; địa chỉ sai không gửi | Đạt |
| I105 | Song ngữ (5I): tên gói tiếng Anh (cột name_en, menu 1 điền cho gói mặc định chưa đổi tên, gói đã đổi tên để trống); email dùng tên gói tiếng Anh ở nửa tiếng Anh; mọi thông báo có nội dung tiếng Anh; email ADMIN_NOTICE đủ tiếng Anh (mẫu cũ còn chữ gốc được cập nhật, mẫu đã sửa giữ nguyên); chữ trang quản trị không gửi cho trang công khai | Đạt |
| I106 | Nhãn song ngữ đủ (5I): mọi hành động ghi nhật ký, mọi sự kiện thông báo, mọi trạng thái buổi, gói, tài khoản đều có tên tiếng Việt và tiếng Anh; mọi chữ ad.* trang quản trị dùng đều có trong DEFAULT_CONTENT_, đủ 4 phần | Đạt |
| I107 | Nhật ký admin (5I): chỉ 60 ngày gần nhất; lọc người dùng, hệ thống, chữ; xem thêm theo trang; đọc đủ một dòng (tab bị sắp xếp vẫn tìm đúng); thoát, sửa tay Sheets, menu đều ghi; dòng cũ hơn 60 ngày được lưu trữ mỗi đêm, MAIL_LOG vẫn theo tháng | Đạt |
| I108 | Ô số liệu admin (5I): danh sách buổi hôm nay và chờ tutor xác nhận khớp đúng số trên ô; huỷ lại báo cả hai thứ tiếng; đặt thay bị từ chối có câu hai thứ tiếng; admin đổi ngôn ngữ được lưu | Đạt |
| I109 | Soát 5I vòng 1 (hồi quy): bỏ dòng không biến chữ "=..." thành công thức (A1); đổi cấu trúc tab ghi SHEET_CHANGE (A2); khoá bận thì nhật ký vào hàng chờ rồi ghi bù (A3); job theo giờ ghi SYSTEM (A8); PURGE_RECOVERED của ACTIVITY_LOG không mất (A10); METRICS không ghi đè cột admin thêm (A15); nhật ký quá hạn gom mới chuyển (A16) | Đạt |
| I110 | Soát 5I vòng 2 (hồi quy): trigger đổi cấu trúc biết đúng tab bị thêm, xoá, đổi tên (N3), tab hệ thống bị đổi tên thì báo Khẩn; sửa ô (EDIT) bỏ ngay không kiểm quyền (N7); thông báo đặt buổi ghi ngày theo thứ (N9 giao diện); chi tiết nhật ký dạng JSON (N8) | Đạt |

## Giao diện web

| # | Test | Kết quả |
|---|---|---|
| U01 | Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện) | Đạt |
| U02 | Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản | Đạt |
| U03 | Số điện thoại sai: báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets | Đạt |
| U04 | Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên | Đạt |
| U05 | Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới | Đạt |
| U19 | Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất | Đạt |
| U06 | Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ | Đạt |
| U07 | Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo | Đạt |
| U08 | Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar | Đạt |
| U09 | Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ | Đạt |
| U10 | Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ | Đạt |
| U11 | Tài khoản: số sai bị chặn, số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã) | Đạt |
| U12 | Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách | Đạt |
| U13 | Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh | Đạt |
| U14 | Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt | Đạt |
| U15 | Tutor xác nhận kết quả 2 bước (5F): chọn Completed chưa ghi gì; Save, xem lại, Save mới ghi COMPLETED; Back thì không ghi | Đạt |
| U16 | Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên | Đạt |
| U17 | Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận" | Đạt |
| U18 | BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới | Đạt |
| U20 | Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor | Đạt |
| U21 | Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc | Đạt |
| U22 | Admin đặt thay học viên qua giao diện sau hạn 15:00, chọn tutor; xem chi tiết, huỷ buổi; tab Nhật ký tìm được | Đạt |
| U23 | Tutor tab Account: số buổi tháng; không còn mục thiết bị (16/10); nút Log out đưa về đăng nhập và phiên cũ hết hiệu lực | Đạt |
| U24 | Trang đăng nhập Google: chữ ký hợp lệ vào cổng admin; chữ ký sai báo lỗi và có nút xin link; nút Google chỉ hiện khi có GOOGLE_LOGIN_URL | Đạt |
| U25 | Admin xem tutor trên giao diện: số buổi tháng, buổi sắp tới, thoát mọi thiết bị của tutor đó | Đạt |
| U26 | Học viên có gói hết hạn và gói đang dùng: thẻ chính hiện gói đang dùng (lỗi sắp xếp ACTIVE = 0 đã sửa) | Đạt |
| U27 | Tự thử lại (5F): Google từ chối 2 lượt mở cổng thì trang vẫn mở, không báo lỗi; đặt lịch mất phản hồi thì thử lại cùng mã, chỉ đặt 1 lần, hiện kết quả | Đạt |
| U28 | Cổng học viên (5F): mở trang lấy luôn slot (không gọi apiStudentSlots khi vào tab đặt lịch); buổi chưa có link Meet ghi rõ link đến cùng lời mời lịch | Đạt |
| U29 | Máy tính (5F): thanh tab thành cột trái, lịch rảnh của tutor là lưới tuần mở sẵn mọi ngày, ngày đặt lịch của học viên mở sẵn | Đạt |
| U30 | Đông người (5F, soát R2): hệ thống bận thì dải "đang thử lại" hiện trong lúc thử và tắt khi xong; nút Đặt trở lại chữ cũ, không kẹt "Đang đặt..." | Đạt |
| U31 | 16/10: tab Tài khoản học viên không còn mục thiết bị; 5G: bảo trì CHỈ XEM hiện thanh báo, bấm Đặt nhận câu bảo trì và không ghi; ĐÓNG thì cổng hiện trang bảo trì (desktop và điện thoại) | Đạt |
| U32 | Trang chủ: bấm EN đổi mọi chữ sang tiếng Anh, giữ chữ đã nhập và ảnh đã chọn; trình độ gửi lên vẫn là bản tiếng Việt; mở lại trang vẫn tiếng Anh | Đạt |
| U33 | Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu vào USERS; lần sau không hỏi; thiết bị khác tự theo lựa chọn đã lưu | Đạt |
| U34 | Tutor đổi ngôn ngữ giữa chừng: giờ rảnh chưa lưu và thanh Lưu vẫn còn, chữ đổi sang tiếng Việt, lưu USERS.lang; admin có nút VI | EN (5I) | Đạt |
| U35 | Thông báo admin gọn (5H): mỗi thông báo một dòng, gom Hôm nay, Hôm qua; lọc bằng nút Khẩn, Tất cả; bấm dòng mở chi tiết; điện thoại và máy tính | Đạt |
| U36 | Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang quản trị luôn tiếng Việt dù máy lưu EN; đổi ngôn ngữ không đè phiên của tab khác; tutor thấy trình độ theo ngôn ngữ | Đạt |
| U37 | Soát 5H vòng 2: rời trang quản trị trả lại ngôn ngữ đã lưu; bấm EN rồi Thoát ngay vẫn lưu lên máy chủ; tab đã thoát không đổi ngôn ngữ của tài khoản tab khác; tab Account tutor đổi ngôn ngữ không gọi lại máy chủ | Đạt |
| U38 | Ô số liệu admin (5I): cả 6 ô đều bấm được: Khẩn và Cần xử lý lọc thông báo, Đăng ký chờ duyệt và Tutor xin huỷ mở đúng tab Sheets, Buổi hôm nay và Chờ tutor xác nhận mở danh sách buổi ngay trên trang (có nút Chi tiết, Huỷ); mọi nút trong khu thông báo bấm được, không lỗi | Đạt |
| U39 | Trang quản trị song ngữ (5I): bấm EN đổi ô số liệu, tab, nút lọc, nội dung thông báo, tên sự kiện, nhãn trạng thái, tên gói sang tiếng Anh mà không gọi lại máy chủ; giữ trang con đang mở (trang học viên, đặt thay giữ giờ đã chọn); lưu USERS.lang; mở lại vẫn tiếng Anh; hộp thoại và câu báo lỗi máy chủ theo tiếng Anh | Đạt |
| U40 | Nhật ký admin (5I): mỗi hoạt động một dòng xem trước gom theo ngày (giờ, tên hành động, người làm, tóm tắt); bấm dòng mở đọc đủ (chi tiết dài, JSON xếp dòng, nút xem buổi, mở dòng Sheets); lọc Người dùng, Hệ thống; Xem thêm khi quá 150 dòng; tiếng Anh | Đạt |
| U41 | Mở trang quản trị (5I): chỉ một lượt gọi máy chủ để có số liệu và thông báo (không gọi apiAdminNotifications lần hai); đọc một thông báo rồi đóng: số đếm giảm, dòng rời danh sách Chưa đọc, không tải lại cả trang | Đạt |
| U42 | Tên gói song ngữ (5I): trang chủ, thẻ gói của học viên, gia hạn hiện tên tiếng Anh khi chọn EN; chưa có tên tiếng Anh thì hiện tên tiếng Việt | Đạt |
| U43 | Soát 5I vòng 1 giao diện (hồi quy): lỗi mạng khi mở trang quản trị có nút Thử lại (B7); kết quả về muộn của trang con không vẽ đè trang đang xem (B1); huỷ trong danh sách Buổi hôm nay cập nhật danh sách và số trên ô (B2); thông báo nhiều buổi có tối đa 3 nút, thông báo tài khoản có nút xem người (B17); tìm nhật ký theo tên hành động đang hiện (B3) | Đạt |
| U44 | Soát 5I vòng 2 giao diện (hồi quy): bấm tab lấy thông báo, nhật ký mới (N2), nút Tải lại; trang lỗi có nút Thử lại song ngữ (N3); đổi ngôn ngữ lúc đang tải không gọi máy chủ lần hai (N4); tìm nhật ký theo họ nhãn và "Admin (sửa trong Sheets)" (N5); bàn phím về đúng tab, hộp thoại có tên (N6); để nguyên lý do mặc định thì gửi rỗng (N1); đặt thay lỗi sau khi đổi ngôn ngữ vẫn báo (N8) | Đạt |

## Bộ thử tải

| # | Test | Kết quả |
|---|---|---|
| L01 | run.js qua 302 như Google: 3 lượt trang chủ và 3 lượt đặt bị từ chối trước khi tới máy chủ, 2 lượt đặt ĐÃ GHI rồi mới trả trang lỗi; 15 người ảo, huỷ 30%: không trùng, không mất, kết quả khớp Sheets | Đạt |
| L02 | run.js báo lỗi khi máy chủ bận mãi: thử lại đúng 9 lần cùng một mã rồi dừng, kết quả BUSY, thoát mã 3 (không coi là bình thường) | Đạt |

## Hàm thuần và Db

| # | Test | Kết quả |
|---|---|---|
| U01 | Có 32 slot từ 08:00 đến 23:30 | Đạt |
| U02 | Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12) | Đạt |
| U03 | Hạn tutor nộp lịch tuần 12/10 là Chủ nhật 11/10 15:00 (câu 21) | Đạt |
| U04 | Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION | Đạt |
| U05 | Chuẩn hoá các kiểu nhập hợp lệ về +84912345678 | Đạt |
| U06 | Từ chối số bàn, thiếu số, số nước ngoài, rỗng | Đạt |
| U07 | Link Zalo và gọi | Đạt |
| U08 | Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ) | Đạt |
| U09 | Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số | Đạt |
| U10 | Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm | Đạt |
| U11 | cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định | Đạt |
| U12 | B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10 | Đạt |
| U13 | B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS | Đạt |
| U14 | B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE | Đạt |
| U15 | B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE | Đạt |
| U16 | B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10 | Đạt |
| U17 | B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống | Đạt |
| U18 | B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11 | Đạt |
| U19 | B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 | Đạt |
| U20 | B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa | Đạt |
| U21 | B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS | Đạt |
| U22 | B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE | Đạt |
| U23 | Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn | Đạt |
| U24 | Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED | Đạt |
| U25 | C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người | Đạt |
| U26 | Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên | Đạt |

<!-- END FILE: v8/reports/REPORT_CHUNK5I.md -->

---

## `v8/reports/REPORT_TONG_HOP_5A_5G.md`

*Ngày tạo trong Project: 2026-10-16T13:10:31Z*

<!-- BEGIN FILE: v8/reports/REPORT_TONG_HOP_5A_5G.md | bytes=6221 | sha256=594c23e0a506001ad90c74be4a147ac90a50c3dde1468540a79f16824d9609ce | created=2026-10-16T13:10:31Z -->
# Thaiput v8 · Báo cáo tổng hợp chunk 5A đến 5G

*Ngày 16/10/2026. Bản cuối 8.0.8. Báo cáo từng chunk: `REPORT_CHUNK5A.md` đến `REPORT_CHUNK5G.md`. Giải thích cho anh: `GIAI_THICH_TONG_HOP_5A_5G.md`.*

## 1. Kết quả test trên code cuối cùng (8.0.8)

| Phần | Đạt | Ghi chú |
|---|---|---|
| Hàm thuần và Db | 26/26 | |
| 40 kịch bản file 03 | 40/40 | Không sửa kết quả mong đợi nào để test qua (luật 15). Các kịch bản đổi theo quyết định của anh có nhãn "[đổi 13/10]" trong file 03 |
| Tích hợp | 95/95 | I24 đến I95 là của chunk 5 |
| Giao diện web (jsdom nối backend thật) | 31/31 | U19 đến U31 là của chunk 5 |
| Bộ thử tải (`loadtest/run.js`) | 2/2 | Phần 5 của harness, từ 5G |

Chạy: `TZ=Asia/Ho_Chi_Minh node test/harness.js` (khoảng 25 giây).

## 2. Từng sub-chunk

| Sub-chunk | Phiên bản | Nội dung chính | Test lúc giao | Thử phá | Soát độc lập |
|---|---|---|---|---|---|
| 5A | 8.0.2 | Đăng nhập nhiều lần trong 15 phút, mỗi tab một phiên, gửi link hàng loạt, số điện thoại không bắt buộc, chia tutor xoay vòng, slot BLOCKED, bỏ nút gọi | 26, 40, 27, 19 | 7/7 | 1 lượt |
| 5B | 8.0.3 | NOTIFICATIONS, NOTIFY_RULES, tổng hợp 21:00, link đúng dòng, admin vào Meet, tutor xin huỷ 4 lựa chọn, Calendar ra ngoài khoá | 26, 40, 34, 19 | 8/8 | |
| 5C | 8.0.4 | CONTENT, EMAIL_TEMPLATES song ngữ, câu lỗi sửa được, nút Zalo nổi | 26, 40, 41, 20 | 14/14 | |
| 5D | 8.0.5 | Đăng nhập tutor và admin (link 1 lần), email đăng nhập mới, đăng nhập Google cho admin, bộ đệm phiên, dọn AUTH | 26, 40, 60, 26 | 41/41 (chạy lại trên code cuối) | 2 vòng, 5 agent (chung 5E) |
| 5E | 8.0.6 | Giao diện admin trên web, đặt thay, huỷ, nhật ký, xoá dữ liệu test 2 bước | 26, 40, 60, 26 | 42/42 và 15/15 | |
| 5F | 8.0.7 | Khoá tối đa 2 lần, tự thử lại có mã chống trùng, bộ đệm CONFIG và slot, hàng đợi Calendar, đối soát, METRICS, đo tốc độ, xác nhận 2 bước, bố cục máy tính | 26, 40, 82, 30 | 30/30 | 2 vòng (R1, R2) và tư vấn kiến trúc 2 chuyên gia |
| 5G | 8.0.8 | Quyết định 16/10, lưu trữ, bảo trì, phát hành, thử tải, nhịp tim health, công cụ xuất PRODUCTION chia file, hướng dẫn vận hành | 26, 40, 95, 31, 2 | 60/61 (1 tương đương) | 3 vòng (R1, R2, R3 kiểm bản sửa) |

Cộng dồn chunk 5: khoảng **180 lỗi cài cố ý** (không tính các lần chạy lại) được test bắt; **8 vòng soát độc lập** bởi agent riêng không thấy quá trình viết code.

## 3. Lỗi nặng mà soát độc lập tìm ra và đã sửa (chọn lọc, để biết hệ thống đã được thử ở đâu)

| Chunk | Lỗi | Hậu quả nếu không sửa |
|---|---|---|
| 5D | Thứ tự cập nhật (triển khai trước, menu 1 sau) làm hỏng đăng nhập | Không ai đăng nhập được sau khi cập nhật |
| 5D | Phiên đã thoát vẫn sống trong bộ đệm khi có lượt gọi song song | Thoát mọi thiết bị không có tác dụng |
| 5F | Lỗi sau khi đã ghi (Calendar, email) báo "bận" cho học viên | Học viên đặt lại, bị "1 buổi mỗi ngày", hoang mang |
| 5F | Đăng nhập gửi lại mất cờ "đang chạy" | Tutor bấm link, mạng rớt, lần thử lại báo "link đã dùng" |
| 5F | Bộ đệm slot không làm mới khi admin sửa CONFIG | Học viên thấy slot sai trong 60 giây |
| 5G | `purgeRows_` xoá trắng tab rồi mới ghi lại | Bị Google cắt giữa chừng là tab BOOKINGS trống |
| 5G | Bỏ dòng theo số hàng cũ | Admin sắp xếp tab đúng lúc lưu trữ là mất booking thật |
| 5G | Lần dọn sau khi hỏng xoá đuôi khi lệnh ghi chưa từng chạy | Mất các booking mới nhất, không cảnh báo |
| 5G | Lưu trữ chạy khi sao lưu đêm bỏ lượt | Chuyển dòng khi chưa có bản sao mới |

## 4. Rủi ro đã chấp nhận (anh đã biết, có cách xử lý)

| Rủi ro | Từ chunk | Cách xử lý |
|---|---|---|
| Giới hạn 30 lượt chạy cùng lúc của Apps Script | 5F | Tự thử lại có mã chống trùng; thử tải đo số thật; giai đoạn 1 Cloudflare theo lệnh của anh |
| Chưa chạy trên Google thật từ 5D | 5D đến 5G | Cập nhật STAGING một lượt, kiểm tay theo `GIAI_THICH_TONG_HOP_5A_5G.md` mục 4 |
| Bộ đệm của Google có thể bị xoá sớm | 5D, 5F | Chỉ để nhanh; mất thì đọc lại Sheets |
| Chuyển tài khoản gọi Calendar hàng loạt trong một khoá | 5F | Chạy 1 lần vào giờ vắng; chạy lại an toàn |
| Đăng nhập Google: cửa sổ rất nhỏ nhận "đã dùng" khi gửi lại | 5F | Link email là đường dự phòng |
| Hạn mức Workspace dùng thử thấp hơn | 5G | Hệ thống tự bỏ email ưu tiên thấp; thử tải không tốn hạn mức |
| Cột công thức admin tự thêm lệch sau lưu trữ | 5G | Không thêm cột công thức tương đối vào tab dữ liệu |
| Bản sao hằng tháng file lưu trữ tăng dần | 5G | Chỉ tốn dung lượng Drive |
| Xoá dữ liệu test sau thử tải lớn quá 6 phút | 5G | Chạy lại menu |

## 5. Bàn giao

| File | Dùng để |
|---|---|
| `dist/Code.gs`, `dist/Index.html` | Dán vào STAGING (một lượt) |
| `dist_google_login/` | Dự án phụ đăng nhập Google cho admin (không đổi từ 5D) |
| `loadtest/run.js`, `loadtest/browser.js` | Thử tải từ máy tính của anh |
| `CHUNK5G_GIAI_THICH.md`, `GIAI_THICH_TONG_HOP_5A_5G.md` | Cập nhật, kiểm tay, câu hỏi |
| `HUONG_DAN_VAN_HANH.md`, `HUONG_DAN_PHAT_HANH.md`, `HUONG_DAN_THU_TAI.md`, `TU_VAN_GIAM_SAT_16_10.md` | Vận hành |
| `PROGRESS.md`, `CLAUDE.md` | Phiên sửa lỗi sau đọc trước |
| `reports/SOAT_5G_R1.md`, `R2`, `R3` | Chi tiết soát độc lập 5G |

Bộ chia file PRODUCTION (`dist_production/`) **chưa sinh**: anh nói "xuất PRODUCTION" thì em sinh và gửi (luật 44).

<!-- END FILE: v8/reports/REPORT_TONG_HOP_5A_5G.md -->

---
