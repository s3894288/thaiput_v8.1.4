# Chính sách tutor thaiput (BẢN NHÁP 02/11/2026, theo code 8.1.4)

*Trạng thái: nháp, chưa công bố. Mục **[chờ chốt BLxx]** chờ quyết định ở `v8/BACKLOG.md`. Số giờ, số ngày lấy theo cấu hình mặc định, admin có thể đổi trong tab CONFIG. Mức lương mỗi buổi ghi riêng trong hợp đồng, không nằm trong bản này. Bản tiếng Anh dịch sau khi bản tiếng Việt được duyệt.*

## Thay đổi so với bản trước

Bản nháp 02/11 lần 5 (code 8.1.3, 8.1.4):
* mục 5: khoá tài khoản **đã có trong code** (bỏ nhãn chờ code); thêm mở khoá lại; còn chờ duyệt BL04, BL62;
* mục 2: ghi rõ admin chọn kết quả thay tutor khi tutor quên (Hoàn thành, Vắng học viên, Vấn đề kỹ thuật) **[đã làm theo đề xuất, chờ chốt BL55]**;
* mục 4: link bấm không giới hạn số lần trong 15 phút; email gửi từ địa chỉ của trường.

Trước đó, bản nháp 01/11 lần 4 (code 5J, bản 8.1.1): lịch mở giờ, thông báo học viên, đăng nhập đã có trong code; tutor không chọn kết quả thì **không còn tự ghi Hoàn thành** (mục 2, mục 3). Trước đó, lần 3: luật bù buổi đã có trong code bản 8.1.0 (bỏ các nhãn chờ code 5M). Trước đó, lần 2: trường thông báo học viên trên web từ thứ Bảy (không email Chủ nhật); xin link 1 lần mỗi giờ; BL41 để sau.

## 1. Mở lịch dạy cho tuần sau

| Mốc | Mặc định (từ 8.1.1) |
|---|---|
| Email nhắc mở lịch (chỉ gửi tutor chưa mở giờ nào cho tuần sau) | **Thứ Sáu 15:00** (admin chỉnh được, đặt được nhiều mốc) |
| Hạn chót mở lịch | **Thứ Bảy 22:00** (admin chỉnh được, phải trước giờ chốt đặt lịch Chủ nhật) |
| Thông báo học viên đặt lịch tuần sau | **Trên trang học viên từ thứ Bảy 00:00**, khi đã có giờ trống (không gửi email) |

* **Thêm giờ dạy** được bất cứ lúc nào, kể cả sau hạn, không cần duyệt.
* **Bớt giờ:**
  * trước hạn, giờ chưa có học viên: bớt ngay;
  * sau hạn, hoặc giờ đã có học viên: gửi yêu cầu huỷ, chờ admin duyệt.
* Admin phải quyết trước giờ học ít nhất 3 giờ. Quá hạn thì yêu cầu tự bị từ chối và **tutor vẫn phải dạy**.
* Admin có thể:
  * đổi sang tutor khác;
  * huỷ buổi (học viên được bù);
  * từ chối.

## 2. Trong và sau buổi học

* Vào đúng giờ theo link Meet trong lịch Google Calendar.
* Sau khi buổi bắt đầu, chọn **một** kết quả trên trang tutor:
  * Hoàn thành;
  * Vắng học viên;
  * Vấn đề kỹ thuật.
* Không chọn kết quả sau **24 giờ** kể từ giờ kết thúc: buổi hiện **thông báo đỏ** trên trang tutor và trang admin để admin nhắc. Hệ thống **không tự ghi Hoàn thành**.
* Vẫn không chọn sau **48 giờ** kể từ giờ kết thúc (và ít nhất 24 giờ sau khi hiện thông báo đỏ): buổi tự chuyển **Không hoàn thành** và **không tính lương**. Job chạy mỗi giờ nên mốc có thể trễ tới khoảng 1 giờ. Hệ thống bảo trì (tutor không chọn được kết quả) thì mốc dời theo: mở lại xong tutor còn đủ 24 giờ.
* Với học viên, buổi Không hoàn thành tính là **buổi đã dùng** (như buổi hoàn thành). Admin có thể đổi kết quả sau khi làm rõ: Hoàn thành, Vắng học viên (có lương), Vấn đề kỹ thuật (lương theo lỗi, mục 3), hoặc Vắng tutor (học viên được bù). Admin cũng chọn được 3 kết quả này thay tutor ngay khi tutor quên chọn **[chờ chốt BL55]**.
* Buổi đã ghi kết quả vẫn có thể bị admin đổi thành **Vắng tutor** khi học viên phản ánh. Khi đó buổi không được tính lương.
* Thông tin học viên (email, số điện thoại) không hiện cho tutor và không được xin ngoài hệ thống.

## 3. Lương theo từng loại buổi

| Loại buổi | Tính lương |
|---|---|
| Hoàn thành | Có |
| Học viên vắng | Có |
| Học viên xin huỷ muộn (từ 15:00 hôm trước), admin huỷ hộ | Chưa quyết (BL41). Đến khi quyết: **không** |
| Vấn đề kỹ thuật, admin xác định lỗi phía học viên | Có (admin chọn "Tính lương buổi kỹ thuật", đã có) |
| Vấn đề kỹ thuật, admin xác định lỗi khách quan (không ai có lỗi) | Có |
| Vấn đề kỹ thuật, lỗi phía tutor, hoặc admin chưa xác định | Không |
| Tutor vắng | Không |
| Không hoàn thành (tutor không chọn kết quả sau 48 giờ) | Không |
| Buổi bị huỷ đúng hạn, hoặc đổi sang tutor khác trước giờ học | Không |

* Khi chưa xác định, buổi vấn đề kỹ thuật **mặc định là lỗi phía tutor**.
* Admin có thể đổi quyết định sau khi làm việc với các bên. Báo cáo lương tháng tính theo quyết định cuối.

## 4. Đăng nhập

* Link đăng nhập gửi qua email, bấm được nhiều lần trong 15 phút (admin chỉnh được). Email gửi từ địa chỉ của trường, tên người gửi "thaiput".
* Mỗi email chỉ xin link được 1 lần mỗi giờ. Không thấy email thì kiểm mục Spam; cần gấp thì nhắn admin gửi hộ.
* Nghi lộ link hoặc mất điện thoại: nhắn admin để thoát mọi thiết bị; mọi phiên và mọi link còn hạn đều mất hiệu lực.
* Phiên giữ 30 ngày, chỉnh được trong CONFIG.
* Không chia sẻ link đăng nhập.

## 5. Khi nghỉ hẳn, bị khoá tài khoản

* Admin khoá tài khoản (xem trước danh sách buổi và hỏi lại 2 lần): mọi phiên đăng nhập và link còn hạn bị huỷ; mọi giờ rảnh từ hôm đó trở đi bị huỷ.
* Các buổi sắp tới (chưa bắt đầu) được chuyển sang tutor khác đang mở giờ đó. Buổi không chuyển được thì bị huỷ và học viên được bù **[đã làm theo đề xuất, chờ chốt BL04]**. Buổi chuyển đi hoặc bị huỷ không tính lương.
* Buổi đã dạy mà chưa chọn kết quả: admin chọn thay (tutor bị khoá không đăng nhập được).
* Mở khoá lại: tài khoản dùng lại được; giờ rảnh đã huỷ **không** tự mở lại, tutor mở lại trên trang **[chờ chốt BL62]**.
