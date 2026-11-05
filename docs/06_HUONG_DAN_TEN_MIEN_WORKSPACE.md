# Thaiput v7 · Hướng dẫn mua tên miền, cài Google Workspace và gắn vào trang web

*Cập nhật: 05/10/2026 · Dành cho người không chuyên kỹ thuật · Làm theo đúng thứ tự*

Trong file này `thaiput.vn` là ví dụ. Thay bằng tên miền anh mua ở mọi chỗ.

## 1. Kết quả sau khi làm xong

| Thứ anh có | Dùng để |
|---|---|
| Tên miền `thaiput.vn` | Thương hiệu, địa chỉ web, địa chỉ email |
| Email `booking@thaiput.vn` (1 tài khoản Workspace trả phí) | Chạy toàn bộ hệ thống: script, Sheets, lịch, gửi email cho học viên và tutor |
| Nhóm `admin@thaiput.vn` (Google Group, miễn phí) | Nhận thông báo cho admin; anh và admin Karn cùng nhận bằng Gmail cá nhân |
| Trang web `www.thaiput.vn` | Trang chủ, đăng ký, đăng nhập, cổng học viên và tutor (Google Sites nhúng web app) |
| Email đã xác thực SPF, DKIM, DMARC | Email tới Hộp thư đến, không vào Spam |

Thời gian thao tác khoảng 1 giờ. Thời gian chờ DNS cập nhật từ vài phút đến vài giờ, hiếm khi tới 48 giờ. **Vì vậy làm phần này đầu tiên**, trong lúc chờ thì Claude code phần demo.

## 2. Mua tên miền (15 phút)

### 2.1 Chọn đuôi tên miền

| Đuôi | Giá tham khảo năm đầu | Gia hạn hằng năm | Giấy tờ | Nên chọn khi |
|---|---|---|---|---|
| `.vn` | 450.000đ | 460.000đ | Cần thông tin giấy tờ người hoặc tổ chức đứng tên | Thương hiệu Việt Nam, tin cậy với học viên trong nước. **Đề xuất** |
| `.com.vn` | 350.000đ | 360.000đ | Như `.vn` | Rẻ hơn `.vn` một chút |
| `.com` | khoảng 99.000đ (khi mua từ 2 năm) | 255.000đ | Không cần | Muốn mua nhanh, không chuẩn bị giấy tờ |

Giá tham khảo từ bảng giá PA Vietnam, chưa gồm VAT 10%. Các nhà đăng ký khác (Mắt Bão, Tenten, Nhân Hoà...) có giá tương tự; nên so 2 nơi trước khi mua.

**Lời khuyên:** mua thêm bản `.com` cùng tên nếu còn trống (khoảng 255k/năm) để người khác không lấy mất; không bắt buộc.

### 2.2 Các bước mua (ví dụ ở nhà đăng ký Việt Nam)

1. Vào trang của nhà đăng ký, gõ `thaiput` vào ô tìm tên miền, xem đuôi nào còn trống.
2. Chọn đuôi, chọn thời hạn (1 năm, hoặc 2 năm để được giá năm đầu tốt hơn với `.com`).
3. **Không mua thêm** hosting, email, SSL hay "website builder" nếu được mời. Mình dùng Google cho tất cả những thứ đó.
4. Điền thông tin chủ thể đứng tên. Với `.vn` và `.com.vn`: cá nhân dùng CCCD, tổ chức dùng giấy đăng ký kinh doanh; nhà đăng ký sẽ hướng dẫn ký bản khai điện tử. **Nên để trường hoặc chủ trường đứng tên** (câu 49 trong file 01), không để tên người làm thuê.
5. Thanh toán. Tên miền thường hoạt động trong vài phút đến vài giờ.
6. Bật **tự động gia hạn**, và đặt nhắc lịch trước ngày hết hạn 30 ngày. Mất tên miền là mất cả email lẫn trang web.
7. Lưu lại: tài khoản quản lý tên miền, mật khẩu, ngày hết hạn, vào nơi an toàn mà admin cũng truy cập được.

### 2.3 Tìm chỗ sửa bản ghi DNS

Sau khi mua, trong trang quản lý của nhà đăng ký sẽ có mục tên là "Quản lý DNS", "Cấu hình DNS" hoặc "DNS Records". Đây là nơi anh dán các bản ghi ở mục 3, 4, 6. Mỗi bản ghi gồm 4 ô: **Tên (Host)**, **Loại (Type)**, **Giá trị (Value)**, **Ưu tiên (Priority, chỉ với MX)**.

## 3. Đăng ký Google Workspace (20 phút)

1. Vào workspace.google.com, chọn **Bắt đầu dùng thử** (14 ngày miễn phí).
2. Tên doanh nghiệp: `thaiput`. Số nhân viên: **Chỉ mình bạn**. Khu vực: **Việt Nam**.
3. Thông tin liên hệ: tên và email cá nhân của anh (để Google liên lạc khi cần).
4. Câu hỏi "Doanh nghiệp của bạn có miền không?": chọn **Có, tôi có một miền** và nhập `thaiput.vn`.
5. Tạo tài khoản đầu tiên: tên người dùng **`booking`** → địa chỉ `booking@thaiput.vn`. Đây là tài khoản hệ thống và cũng là quản trị viên Workspace. Đặt mật khẩu mạnh.
6. Chọn gói **Business Starter**. Giá tham khảo qua đại lý tại Việt Nam khoảng **86.000đ/người/tháng**; mua trực tiếp từ Google có thể khác, xem giá hiển thị ở bước thanh toán. Chỉ cần **1 người dùng**.
7. Google sẽ hướng dẫn **xác minh tên miền**: hiện ra một bản ghi TXT dạng `google-site-verification=...`. Dán vào DNS:

| Tên (Host) | Loại | Giá trị |
|---|---|---|
| `@` (một số nơi để trống hoặc ghi `thaiput.vn`) | TXT | `google-site-verification=...` (copy nguyên từ Google) |

8. Quay lại Google, bấm **Xác minh**. Nếu báo chưa thấy, chờ 15 phút rồi thử lại.
9. Google hướng dẫn **bật Gmail**: xoá các bản ghi MX cũ (nếu nhà đăng ký có sẵn), thêm đúng 1 bản ghi:

| Tên (Host) | Loại | Giá trị | Ưu tiên |
|---|---|---|---|
| `@` | MX | `smtp.google.com` | 1 |

10. Kiểm tra: từ Gmail cá nhân gửi một email tới `booking@thaiput.vn`, mở gmail.com bằng `booking@` thấy email tới.
11. Bật **xác minh 2 bước** cho `booking@` (myaccount.google.com, mục Bảo mật), tải **mã dự phòng**, in ra hoặc lưu vào nơi khác, không lưu trong chính tài khoản này.

## 4. Xác thực email để không vào Spam (15 phút, rồi chờ)

Ba bản ghi này giúp Gmail, Outlook tin rằng email từ `booking@thaiput.vn` là thật.

**SPF**: thêm bản ghi:

| Tên (Host) | Loại | Giá trị |
|---|---|---|
| `@` | TXT | `v=spf1 include:_spf.google.com ~all` |

Nếu đã có một bản ghi TXT bắt đầu bằng `v=spf1`, **sửa** bản ghi đó, không tạo thêm bản thứ hai.

**DKIM**:
1. Vào admin.google.com bằng `booking@`. Chọn **Ứng dụng → Google Workspace → Gmail → Xác thực email**.
2. Bấm **Tạo bản ghi mới**, độ dài khoá 2048, tiền tố `google`. Google hiện bản ghi:

| Tên (Host) | Loại | Giá trị |
|---|---|---|
| `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=...` (copy nguyên, rất dài) |

3. Một số trang DNS không nhận chuỗi dài quá 255 ký tự. Nếu báo lỗi, quay lại tạo bản ghi với độ dài khoá **1024**.
4. Sau khi dán, chờ khoảng 1 giờ, quay lại trang Xác thực email, bấm **Bắt đầu xác thực**. Trạng thái chuyển thành "Đang xác thực email" là xong.

**DMARC**: thêm bản ghi:

| Tên (Host) | Loại | Giá trị |
|---|---|---|
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:admin@thaiput.vn` |

`p=none` nghĩa là chỉ theo dõi, an toàn cho giai đoạn đầu. Sau 1 tháng chạy ổn, đổi thành `p=quarantine`.

**Kiểm tra** (sau khi có hệ thống, checklist B3): gửi email từ hệ thống tới Gmail của anh, mở email, bấm dấu ba chấm, **Hiển thị bản gốc**. Ba dòng SPF, DKIM, DMARC đều phải là **PASS**.

## 5. Cài đặt Workspace cho web app, lịch và Meet (10 phút)

Vào admin.google.com bằng `booking@`:

1. **Nhóm admin:** Thư mục → Nhóm → Tạo nhóm, tên `admin`, email `admin@thaiput.vn`. Thêm thành viên: Gmail của anh và Gmail của admin Karn (cho phép thành viên ngoài tổ chức). Trong cài đặt nhóm, mục ai được đăng bài: chọn **Bất kỳ ai trên web**, để hệ thống và học viên gửi thư được.
2. **Drive (bắt buộc cho web app):** Ứng dụng → Google Workspace → Drive và Tài liệu → Cài đặt chia sẻ → Tuỳ chọn chia sẻ: **Bật** chia sẻ ra ngoài tổ chức. Thiếu bước này, khi deploy web app sẽ không chọn được "Anyone" và học viên không mở được trang.
3. **Calendar:** Ứng dụng → Google Workspace → Lịch → Cài đặt chia sẻ: cho phép mời khách ngoài tổ chức. Giữ cảnh báo khi mời khách ngoài (chỉ là lời nhắc, không chặn).
4. **Meet:** Ứng dụng → Google Workspace → Google Meet → Cài đặt an toàn của Meet: bật **Truy cập nhanh**, để học viên và tutor có trong thư mời vào phòng ngay, không cần `booking@` có mặt duyệt. Checklist B14 kiểm tra thật điều này.
5. **Ngôn ngữ và múi giờ:** myaccount.google.com của `booking@`, đặt múi giờ (GMT+07:00) Ho Chi Minh. Trong Google Calendar của `booking@`, Cài đặt → Múi giờ cũng đặt Ho Chi Minh.

## 6. Gắn tên miền vào trang web Google Sites (15 phút, sau phase 6)

Làm khi Claude đã nhúng web app vào Google Sites và publish.

1. Mở trang Sites bằng `booking@`, bấm biểu tượng bánh răng **Cài đặt → Miền tuỳ chỉnh → Bắt đầu thiết lập**.
2. Chọn **Dùng một miền từ bên thứ ba**, nhập `www.thaiput.vn`. Tên miền đã xác minh ở mục 3 nên Google không hỏi lại.
3. Thêm bản ghi DNS:

| Tên (Host) | Loại | Giá trị |
|---|---|---|
| `www` | CNAME | `ghs.googlehosted.com` |

4. Bấm **Hoàn tất**, chờ 15 phút đến vài giờ, mở `www.thaiput.vn` thấy trang Sites.
5. Cho `thaiput.vn` (không có www) tự chuyển về `www.thaiput.vn`: trong trang của nhà đăng ký, tìm mục **Chuyển hướng tên miền** (URL forwarding), chuyển `thaiput.vn` tới `https://www.thaiput.vn`. Nếu nhà đăng ký không hỗ trợ chuyển hướng có HTTPS, phương án thay thế: chuyển quản lý DNS sang Cloudflare (miễn phí) và dùng quy tắc chuyển hướng ở đó; nhờ Claude hướng dẫn khi cần.

## 7. Tổng hợp mọi bản ghi DNS

| Tên (Host) | Loại | Giá trị | Ưu tiên | Để làm gì |
|---|---|---|---|---|
| `@` | TXT | `google-site-verification=...` | | Xác minh tên miền với Google |
| `@` | MX | `smtp.google.com` | 1 | Nhận email |
| `@` | TXT | `v=spf1 include:_spf.google.com ~all` | | SPF |
| `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=...` | | DKIM |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:admin@thaiput.vn` | | DMARC |
| `www` | CNAME | `ghs.googlehosted.com` | | Trang web |

Chụp màn hình trang DNS sau khi xong, dán cho Claude soát lại nếu muốn chắc.

## 8. Chi phí từ phần này

| Khoản | Năm đầu | Từ năm 2 |
|---|---|---|
| Tên miền `.vn` (chưa VAT) | 450.000đ | 460.000đ |
| Google Workspace Business Starter, 1 người dùng | khoảng 1.032.000đ (86k × 12) | như năm đầu |
| Google Group, Sites, Calendar, Meet, Apps Script, Sheets | 0đ | 0đ |
| **Cộng (đã cộng VAT tên miền)** | **khoảng 1,53 triệu** | **khoảng 1,54 triệu** |

Nếu chọn `.com` thay `.vn`: bớt khoảng 200k mỗi năm.

## 9. Lỗi hay gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Google báo chưa xác minh được tên miền | DNS chưa cập nhật, hoặc dán sai ô Tên | Chờ 30 phút; kiểm tra ô Tên là `@` hoặc để trống theo hướng dẫn của nhà đăng ký |
| Không nhận được email gửi tới `booking@` | Còn bản ghi MX cũ của nhà đăng ký | Xoá hết MX cũ, chỉ giữ `smtp.google.com` |
| DKIM không lưu được | Trang DNS giới hạn 255 ký tự | Tạo lại khoá 1024 |
| Email vào Spam | Thiếu SPF hoặc DKIM chưa "Bắt đầu xác thực" | Làm lại mục 4, kiểm tra bản gốc email |
| Deploy web app không có lựa chọn "Anyone" | Chưa bật chia sẻ ra ngoài ở mục 5.2 | Bật, chờ 10 phút, deploy lại |
| Học viên phải bấm "Xin tham gia" khi vào Meet | Chưa bật Truy cập nhanh, hoặc học viên vào bằng tài khoản khác email được mời | Bật mục 5.4; hướng dẫn học viên vào bằng đúng email đã đăng ký |
| `www.thaiput.vn` không mở | CNAME chưa cập nhật, hoặc ô Tên ghi `www.thaiput.vn` thay vì `www` | Sửa ô Tên thành `www`, chờ thêm |

## Nguồn tham khảo giá

1. [Bảng giá tên miền PA Vietnam](https://www.pavietnam.vn/vn/ten-mien-bang-gia.html)
2. [Google Workspace Business Starter tại Tenten](https://tenten.vn/tin-tuc/google-workspace-business-starter-la-gi/)
3. [Bảng giá Google Workspace](https://workspace.google.com/intl/vi/pricing.html)
