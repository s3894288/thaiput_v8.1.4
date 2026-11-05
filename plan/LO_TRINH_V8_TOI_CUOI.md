# Lộ trình v8 từ hôm nay tới bước cuối cùng

*Bản 01/11/2026 (lập 29/10). Ngày tháng là ước lượng, tính khi anh trả lời câu hỏi chặn trong 1 đến 2 ngày và mỗi ngày làm được 1 đến 2 cửa sổ hạn mức. Chưa thực thi.*

## Thay đổi so với bản 01/11 lần 4

* Go live 8.0.10 có 2 cách (`HUONG_DAN_GO_LIVE_8010.md` lần 2): A file PRODUCTION mới, B biến bản hiện tại thành PRODUCTION và tạo bản thử riêng. MailFix làm kiểu file riêng, tìm và thay (`HUONG_DAN_MAILFIX.md`).
* **Gửi email cố định (5Q) làm sau cùng**, trong chunk 9, trước v9. Tới đó mọi bản dán PRODUCTION có bước MailFix.

## Thay đổi so với bản 01/11 lần 3

* **Go live PRODUCTION ngay trên 8.0.10 kèm MailFix** (anh chốt 01/11), không chờ 5P. Hướng dẫn: `HUONG_DAN_GO_LIVE_8010.md`.
* Chunk 6, 7 đổi nghĩa:
  * chunk 6 là nghiệm thu bản 8.2.1 trên STAGING;
  * chunk 7 là phát hành 8.2.1 lên PRODUCTION đang chạy, không còn là "go live".
* Mọi bản 8.0.11 trở đi: STAGING trước, PRODUCTION sau.

## Thay đổi so với bản 01/11 lần 2

* Không đổi mốc. Đăng nhập Google cho admin làm được ngay với 8.0.10, không chờ 5J (`plan/TRA_LOI_01_11.md` mục 3).
* Mỗi chunk chỉ giao `PROGRESS.md`. Hướng dẫn phải được xuất (anh yêu cầu) **trước chunk 6**, vì nghiệm thu đi theo Hướng dẫn vận hành.

## Thay đổi so với bản 29/10

* 5J đến 5P tăng lên khoảng 22 đến 24 cửa sổ (thêm email cố định, đăng nhập theo vai trò, lịch tutor, chuyển hệ thống, luật bù chốt 01/11). Các mốc sau lùi khoảng 1 đến 2 tuần.
* Chunk 7 dùng menu **Chuyển hệ thống** (5L) thay cho công cụ chép dữ liệu viết riêng.
* Kế hoạch sau go live (`plan/KE_HOACH_SAU_GO_LIVE.md`) **anh đã duyệt 01/11**, chờ hiệu lệnh.

## 1. Đã xong

| Chunk | Nội dung | Bản |
|---|---|---|
| 1 đến 4 | Lõi: gói, đặt lịch, huỷ, tutor, admin qua Sheets, email, Calendar | trước 8.0.1 |
| 5 | Hoàn thiện code, bản dán một file | 8.0.1 |
| 5A | Đăng nhập, phiên, quyền, dữ liệu nền | 8.0.2 |
| 5B, 5C | Thông báo theo mức, tổng hợp 21:00; tab CONTENT, EMAIL_TEMPLATES, email song ngữ | 8.0.3, 8.0.4 |
| 5D, 5E | Đăng nhập tutor và admin, đăng nhập Google; giao diện admin, đặt thay, nhật ký | 8.0.5, 8.0.6 |
| 5F | Chịu tải: khoá ngắn, hàng đợi Calendar, chống gửi trùng, số đo | 8.0.7 |
| 5G | Lưu trữ, bảo trì, phát hành, thử tải, nhịp tim | 8.0.8 |
| 5H | Song ngữ theo người dùng, nội dung CONTENT, email marketing | 8.0.9 |
| 5I | Chẩn đoán email, tốc độ, trang quản trị song ngữ, nhật ký đầy đủ | 8.0.10 |
| Giao diện 19/10, 20/10 | Thiết kế lại theo ảnh tham chiếu, chỉ giao diện sáng | 8.0.10 (Index.html) |

## 2. Còn lại tới bước cuối

```
Go live 8.0.10  →  5J 5K 5L 5M 5N 5O 5P  →  Chunk 6     →  Chunk 7      →  Chunk 8      →  Chunk 9
(ngay, 01/11)      mỗi bản: STAGING rồi    nghiệm thu     phát hành 8.2.1   chăm sóc        đóng v8
                   PRODUCTION              8.2.1 STAGING  lên PRODUCTION    2 đến 4 tuần    sang v9
```

| Giai đoạn | Việc chính | Điều kiện xong | Ước lượng |
|---|---|---|---|
| Đồng bộ tài liệu project | Ghi đè bản 8.0.10, gom lịch sử, bỏ file cũ | **Đã làm 29/10** | |
| **Go live PRODUCTION 8.0.10** | `HUONG_DAN_GO_LIVE_8010.md`: file PRODUCTION mới trên admin@, mang CONTENT, EMAIL_TEMPLATES đã sửa, MailFix, kiểm thư tới nơi, Đăng nhập Google admin | Menu 2 không lỗi; thư Delivered tới Gmail và một hộp thư khác; tutor đăng nhập được | khoảng 2 giờ, **ngay** (anh tự làm) |
| 5J đến 5P | Xem `plan/KE_HOACH_5J_5P.md` | 8.2.1 harness xanh, soát 2 vòng; mỗi bản lên STAGING rồi PRODUCTION | khoảng 22 đến 24 cửa sổ, tới khoảng 05/12 |
| **Chunk 6 · Nghiệm thu** | Nghiệm thu bản 8.2.1 trên **STAGING**: chạy `docs/04_CHECKLIST.md` phần B. 2 đồng sáng lập và 1 đến 2 tutor đi hết mọi màn hình theo hướng dẫn vận hành. Thử tải theo `HUONG_DAN_THU_TAI.md`. Đo tốc độ thật, Email log search, Calendar | Không còn lỗi mức CAO hoặc VỪA; số đo đạt mục tiêu trong mục 2 của `TU_VAN_KIEN_TRUC_16_10.md` (trong `archive/TU_VAN_VA_KIEN_TRUC.md`) | 1 tuần, tới khoảng 12/12 |
| **Chunk 7 · Phát hành 8.2.1 lên PRODUCTION** | PRODUCTION đã chạy từ 01/11, nên đây là một lần phát hành lớn theo `HUONG_DAN_GO_LIVE_8010.md` mục 12, không phải go live. Bước "chạy thử" của menu Cập nhật phiên bản liệt kê mọi gói học viên đổi ngày theo luật bù mới để anh duyệt. Gắn link rút gọn (BL03), bật giám sát (BL20). Chia file `.gs` chỉ khi anh ra lệnh (luật 44) | Mọi gói đổi ngày đã được anh duyệt; email Delivered; có kế hoạch quay lại trong 1 giờ | 1 tuần, phát hành vào giờ vắng cuối tuần, khoảng 19/12 |
| **Chunk 8 · Chăm sóc sau go live** | Phát hành sửa lỗi theo chuyến hằng tuần (8.2.x), một ngày cố định. Mỗi tuần đọc số đo, nhật ký lỗi, BACKLOG | 2 tuần liền không lỗi CAO; số đo ổn định | 2 đến 4 tuần, tới khoảng giữa 01/2027 |
| **Chunk 9 · Đóng v8** | Chỉ sửa lỗi, không thêm tính năng. **Làm 5Q (gửi email cố định, bỏ MailFix tay) trước khi đóng.** Xuất bộ đặc tả cho v9: file 01, file 03, hàm thuần và test làm "bản luật"; xuất dữ liệu. Quyết định ngày bắt đầu v9 theo `plan/KE_HOACH_SAU_GO_LIVE.md` | Bộ đặc tả v9 xong, anh duyệt | 1 tuần, cuối 01/2027 |

## 3. Rủi ro lớn nhất trên lộ trình (nói thẳng)

1. **Bản anh gọi là STAGING đang có người dùng thật** (BL11). Mọi chunk lớn phải chạy trên một bản thử riêng trước. Không có bản thử riêng thì 5M và 5O là đổi trực tiếp trên khách hàng thật.
2. **Câu hỏi chặn trả lời chậm** sẽ đẩy cả lộ trình lùi. 5M không bắt đầu được khi BL01 chưa chốt.
3. **Hạn mức email khi admin@ còn dùng thử:** chunk 7 cần admin@ đã trả phí và qua đủ ngày, nếu không email nhắc và email xác nhận có thể bị cắt giữa ngày. Kiểm bằng menu 2 trước ngày cắt chuyển.
4. **Một người hiểu hệ thống:** anh cùng Claude. Hướng dẫn 5P phải đủ để đồng sáng lập thứ hai vận hành một mình.
