# Hướng dẫn thử tải trên STAGING (bản 8.1.4)

*Cập nhật 02/11/2026. Chỉ chạy trên STAGING (tài khoản Workspace chạy STAGING). PRODUCTION không bao giờ mở được cổng thử tải. Làm trước go live.*

## Thay đổi so với bản trước (8.0.10, 17/10)

* Cách thử, lệnh chạy, file `run.js`, `browser.js` không đổi.
* Menu **Xoá dữ liệu test** nay nằm ở **thaiput → Công cụ kỹ thuật** (menu gom nhóm 8.1.3). Sửa mô tả sai của bản trước: mức 1 xoá mọi học viên và dữ liệu phát sinh, không chỉ dữ liệu giả (mục 4). Menu thử tải vẫn ở **thaiput → Test (chỉ STAGING)**.
* Email của học viên giả vẫn không gửi thật; dòng MAIL_LOG của họ có cột `transport` trống (8.1.4).
* Bản cần có: 8.1.4 đã **Triển khai phiên bản mới**.
* Mỗi email chỉ xin link đăng nhập 1 lần mỗi giờ trên trang (8.1.1): không ảnh hưởng thử tải vì người ảo được đăng nhập sẵn qua cổng thử tải.

Cách đọc: chữ **đậm** là tên nút hoặc mục menu trong file Google Sheets STAGING. `Chữ đơn cách` là lệnh hoặc nội dung gõ đúng từng ký tự.

## 1. Thử tải đo gì, và không đo gì

**Đo được trên Google thật:**
* bao nhiêu người cùng bấm Đặt thì bắt đầu có lượt "Google từ chối" (giới hạn 30 lượt chạy cùng lúc của một tài khoản) hay "hệ thống bận" (chờ khoá dữ liệu quá lâu);
* thời gian người dùng chờ, kể cả các lần trang tự thử lại (p50: nửa số người nhanh hơn mức này; p95: 95 người trên 100 nhanh hơn);
* có booking nào bị mất, bị trùng, hay hai học viên cùng một tutor cùng giờ không.

**Không đo:** email thật (địa chỉ `@loadtest.invalid` không bao giờ được gửi, chỉ ghi vào tab MAIL_LOG như thật), thư mời Calendar tới khách (sự kiện vẫn được tạo trên lịch học, không mời khách giả), tốc độ mạng của từng học viên.

## 2. Chuẩn bị (1 lần, khoảng 10 phút)

1. STAGING đã chạy bản 8.1.4, **đã Triển khai phiên bản mới** sau khi dán code (link `/exec` của bản quá cũ không có cổng thử tải).
2. Máy tính của admin cài **Node 18 trở lên** (nodejs.org, bản LTS). Kiểm: mở Terminal (Mac) hoặc PowerShell (Windows), gõ `node -v`.
3. Tạo một thư mục, ví dụ `thaiput_loadtest`, chép vào đó 2 file `run.js` và `browser.js` coder gửi.
4. Sheets STAGING: menu **thaiput → Test (chỉ STAGING) → Thử tải: tạo dữ liệu giả**. Tạo 100 học viên `lt0001@loadtest.invalid` đến `lt0100@loadtest.invalid`, mỗi người một gói 1 tháng đang chạy, và 10 tutor `ltt01@...` đến `ltt10@...` mở mọi giờ 14 ngày tới. Chạy lại không tạo trùng.

## 3. Mỗi lượt thử (khoảng 15 phút)

1. Menu **Test → Thử tải: bật 2 giờ**. Hộp thoại hiện **KHOÁ** (một chuỗi dài) và **LINK** `/exec`. Chép cả hai. Không gửi khoá qua chat, email.
2. Terminal, trong thư mục ở mục 2 bước 3:

```
node run.js --url "LINK" --secret "KHOÁ" --users 10 --ramp 10
```

3. Tăng dần; mỗi lượt dùng một dải học viên mới (`--start`) để không vướng luật 1 buổi mỗi ngày:

```
node run.js --url "LINK" --secret "KHOÁ" --users 30 --ramp 10 --start 11
node run.js --url "LINK" --secret "KHOÁ" --users 50 --ramp 5 --start 41
node run.js --url "LINK" --secret "KHOÁ" --users 50 --ramp 0 --start 41 --cancel 0.3
```

   * Lượt cuối dùng lại dải 41 đến 90 nên có `ONE_PER_DAY` (bình thường).
   * `--ramp 0`: mọi người bấm trong cùng một giây (trường hợp xấu nhất, ví dụ ngay sau khi admin báo mở lịch trên Zalo).
   * `--cancel 0.3`: 3 trên 10 người huỷ ngay buổi vừa đặt.
   * Muốn thêm học viên giả (mặc định 100, tối đa 2.000): nhờ coder đổi số rồi chạy lại menu tạo dữ liệu giả.
4. Mỗi lượt in ra bảng tổng kết và ghi file `ketqua_<giờ>.json`. Đọc 5 dòng:

| Dòng | Đọc thế nào |
|---|---|
| `ket_qua` | `BOOKED` là đặt được. `NO_TUTOR`, `ONE_PER_DAY`: bình thường khi nhiều người chọn trùng giờ. Có `BUSY`, `rejected`, `network`, `SERVER_ERROR`: lỗi thật; run.js in "KẾT QUẢ BẤT THƯỜNG" và thoát mã 3 |
| `google_tu_choi` | Số lượt Google không cho chạy (quá 30 lượt cùng lúc). Có số là bình thường khi đông; trang tự thử lại |
| `may_chu_bao_ban` | Số lượt chờ khoá quá 30 giây. Lớn hơn 0 ở mức 30 người là dấu hiệu cần nâng cấp hạ tầng (báo coder) |
| `dat_ms_ca_thu_lai` | Thời gian từ lúc bấm Đặt tới khi có kết quả, kể cả thử lại. Mục tiêu p95 dưới 8.000 ms |
| `trang_chu_ms` | Thời gian mở cổng học viên kèm danh sách giờ |

5. Sheets STAGING: menu **Test → Thử tải: kiểm kết quả**. Phải "Dữ liệu đúng luật": 0 trùng lần bấm, 0 hai người cùng tutor cùng giờ, 0 quá số buổi mỗi ngày. Số booking ở đây phải bằng tổng số `BOOKED` cộng dồn các lượt.
6. (Tuỳ chọn) Trình duyệt thật, đi đúng đường của trang web:

```
npm i playwright
npx playwright install chromium
node browser.js --url "LINK" --secret "KHOÁ" --users 5 --start 81
```

   Mỗi người ảo mở link đăng nhập trong một cửa sổ riêng (nửa số cửa sổ cỡ điện thoại, nửa cỡ máy tính), bấm 1 giờ, bấm Đặt. Thêm `--headed` để xem cửa sổ. Không chạy quá 15 người trên một máy. Báo "Không thấy cổng học viên": chạy lại với `--headed`, chụp màn hình gửi coder.
7. Xong: menu **Test → Thử tải: tắt** (hoặc để tự đóng sau 2 giờ). Gửi coder các file `ketqua_*.json` và ảnh hộp thoại "Thử tải: kiểm kết quả".

## 4. Dọn sau khi thử

Menu **Công cụ kỹ thuật → Xoá dữ liệu test (2 bước xác nhận)**. **Cẩn thận:** mức 1 xoá **MỌI** học viên (thật lẫn giả), mọi buổi, giờ rảnh (cả của tutor thật), gói, đăng ký, thanh toán, phiên đăng nhập, nhật ký, MAIL_LOG (cả sổ chống gửi trùng marketing), thông báo; chỉ giữ tutor, admin và các tab cài đặt (CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES). Sao lưu trước khi xoá. Mức 2 xoá thêm mọi tutor. Không có cách chỉ xoá dữ liệu giả: STAGING đang giữ dữ liệu thử cần dùng tiếp thì không chạy menu này; để học viên giả `@loadtest.invalid` lại cũng không sao (không bao giờ nhận email). Trên 500 booking có thể quá 6 phút một lượt: chạy lại menu lần nữa.

## 5. An toàn của cổng thử tải

* Chỉ mở khi có khoá còn hạn (mỗi lần bật 2 giờ sinh khoá mới). Sai khoá, hết giờ, hoặc là PRODUCTION: trả lời ngay, không đọc ghi dữ liệu, không lấy khoá.
* Chỉ thay mặt được tài khoản `@loadtest.invalid` (tên miền `.invalid` không bao giờ có thật). Không đăng nhập thay được người thật, không gọi được việc của admin.
* Gọi đúng các việc thật (đặt, huỷ, mở cổng, danh sách giờ, lịch tutor), nên đo đúng khoá dữ liệu, bộ đệm, chống gửi trùng, hàng đợi Calendar.
* Hàm `switchToProduction` xoá khoá. Menu **2. Kiểm tra hệ thống** báo lỗi nếu PRODUCTION còn khoá.
* Email marketing không bao giờ gửi tới địa chỉ `@loadtest.invalid`.

## 6. Khác biệt với người thật (đọc khi đánh giá số)

* Người thật gọi máy chủ từ trong trang; `run.js` gọi thẳng link `/exec`. Cả hai đều là một lượt chạy Apps Script, tính vào giới hạn 30 lượt cùng lúc. `browser.js` đi đúng đường người thật.
* Người ảo được đăng nhập sẵn trước khi bấm giờ (người thật đã đăng nhập từ trước).
* Một máy tính gửi mọi lượt: mạng của máy đó có thể là nút thắt khi trên 50 người ảo. Khi đó chạy song song trên 2 máy với 2 dải `--start` khác nhau.
