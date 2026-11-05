# Hướng dẫn phát hành, cập nhật và quay lui (bản 8.1.4)

*Cập nhật 02/11/2026. Áp dụng cho STAGING ngay; cho PRODUCTION sau go live (chunk 6). Nguyên tắc đã chốt: không đóng băng hệ thống; giữ hết lịch sử; không bao giờ mất file; sửa lỗi được bất cứ lúc nào khi đang chạy.*

## Thay đổi so với bản trước (8.0.10, 18/10)

* **Không còn MailFix:** từ 8.1.4 không tạo file MailFix, không tìm và thay sau khi dán `Code.gs`. Còn file `MailFix.gs` cũ trong dự án thì xoá (menu 2 báo LỖI nếu còn).
* **Mục 3 mới:** nâng STAGING từ 8.0.10 lên thẳng 8.1.4, từng bước, kèm việc phải kiểm sau mỗi bước.
* Mục 2: tên menu theo menu gom nhóm (**Cập nhật phiên bản → ...**), thêm bước F5 Sheets, bước Kiểm tra gửi email; menu 3 tạo 8 trigger.
* Mục 4: thêm cách quay lui từ 8.1.4.
* Mục 5: bỏ "Chuyển sang tài khoản mới" (thay bằng menu **Chuyển hệ thống**).
* Mục 6: go live viết lại ở chunk 6; bỏ bước chuyển dữ liệu v6 (menu đã bỏ).

Cách đọc: chữ **đậm** là tên nút hoặc mục menu. `Chữ đơn cách` là tên tab, cột, ô hoặc nội dung gõ đúng từng ký tự. "Menu 1" là **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**, "menu 2" là **thaiput → 2. Kiểm tra hệ thống**, "menu 3" là **thaiput → 3. Tạo lại trigger tự động**. "Trình soạn" là trình soạn Apps Script: trong file Sheets bấm **Tiện ích mở rộng → Apps Script**.

## 1. Năm lớp giữ dữ liệu (không lớp nào tự xoá dữ liệu của lớp khác)

| Lớp | Ở đâu | Giữ bao lâu | Khôi phục thế nào |
|---|---|---|---|
| Lịch sử phiên bản của Google Sheets | Trong file dữ liệu: **Tệp → Nhật ký phiên bản** | Google tự giữ | Chọn mốc giờ → **Khôi phục**, hoặc **Tạo bản sao** để so |
| Bản sao mỗi đêm 02:00 | Thư mục `THAIPUT_V8_<môi trường>/Backup` | 30 bản gần nhất (ô `BACKUP_KEEP`); bản cũ vào thùng rác 30 ngày | Mở bản sao, chép tab cần thiết |
| **Bản sao trước mỗi lần cập nhật** | Thư mục `THAIPUT_V8_<môi trường>_Releases` | **Mãi mãi** (hệ thống không bao giờ dọn) | Như trên |
| File lưu trữ theo năm | Thư mục `THAIPUT_V8_<môi trường>_Archive`, tên `THAIPUT · Lưu trữ · <môi trường> · <năm>` | Mãi mãi | Chép dòng về lại tab của file dữ liệu (cột trùng tên) |
| Code | Trình soạn: **Triển khai → Quản lý các lần triển khai** (mỗi phiên bản giữ nguyên) và **Lịch sử dự án** | Mãi mãi | Chọn lại phiên bản cũ |

Quyền: mọi file và thư mục do tài khoản chạy hệ thống tạo. Không chia sẻ quyền chỉnh sửa cho tutor.

## 2. Mỗi lần cập nhật code (khoảng 15 phút)

**Không sửa code trực tiếp trong trình soạn.** Mọi sửa đổi đi qua coder: coder sửa, chạy đủ bộ test, gửi `Code.gs`, `Index.html`, và `appsscript.json` khi quyền đổi.

1. Thử trên STAGING trước (khi đã có PRODUCTION).
2. (Nên làm) Menu **Cập nhật phiên bản → Bảo trì: chỉ xem**. Học viên, tutor vẫn xem lịch; đặt, huỷ, lưu tạm dừng trong vài phút cập nhật.
3. Trình soạn: mở từng file, **chọn hết (Ctrl+A, Mac: Cmd+A), dán đè**, bấm **Lưu** (biểu tượng đĩa) sau mỗi file:
   * `Code.gs` ← file `Code.gs` coder gửi. Kiểm dòng đầu ghi đúng số phiên bản;
   * `Index` (Index.html) ← file `Index.html`;
   * `appsscript.json` ← chỉ khi coder ghi "quyền đổi".
   **Không tìm và thay gì trong code.**
4. Tải lại trang Sheets (**F5**) để menu mới hiện.
5. **Ngay sau đó** chạy menu 1. Google hỏi cấp quyền (khi quyền đổi): chọn đúng tài khoản chạy hệ thống → **Cho phép**, rồi chạy lại menu 1. Hộp thoại phải có dòng "Sao lưu trước cập nhật (<bản cũ> sang <bản mới>): THAIPUT_DB_..._TRUOC_<bản mới>_...". Có dòng "CẢNH BÁO: chưa sao lưu được": **dừng**, chạy **Cập nhật phiên bản → Phát hành: sao lưu ngay**, thành công mới đi tiếp.
6. Coder ghi "chạy menu 3": chạy menu 3, hộp thoại báo 8.
7. Menu 2: không có dòng LỖI.
8. **Triển khai → Quản lý các lần triển khai** → chọn bản triển khai đang dùng → **bút chì (Chỉnh sửa)** → ô **Phiên bản** chọn **Phiên bản mới** → Mô tả: số phiên bản → **Triển khai**. Link `/exec` giữ nguyên. **Không bấm "Triển khai mới"**: tạo link `/exec` mới, làm hỏng `WEBAPP_URL`, Google Sites, đăng nhập Google, link rút gọn.
9. Bước 2 có bật thì: **Cập nhật phiên bản → Bảo trì: tắt**.
10. Thử: mở trang học viên trên điện thoại, đặt thử 1 buổi bằng tài khoản thử, huỷ ngay; bấm **VI | EN**; trang quản trị, tab Nhật ký có dòng "Chạy menu 1". Menu **Email → Kiểm tra gửi email** tới Gmail cá nhân: thư tới, đường gửi `GMAILAPP`.

Vì sao thứ tự Lưu → menu 1 → Triển khai: trigger (việc chạy tự động mỗi 5, 15, 60 phút) chạy **code vừa Lưu** ngay, không chờ Triển khai. Menu 1 phải chạy trước để cột, tab, ô CONFIG mới có sẵn. Trang web chỉ đổi khi Triển khai. Lỡ làm sai thứ tự: chạy menu 1 ngay khi nhớ ra (code chịu được việc thiếu cột mới trong lúc chờ).

## 3. Nâng STAGING từ 8.0.10 lên 8.1.4 (một lần, khoảng 45 phút)

Bản 8.1.4 gồm mọi thay đổi của 8.1.0 (bù buổi), 8.1.1 (đăng nhập theo vai trò, lịch tutor, kết quả buổi), 8.1.3 (menu gom nhóm, lưu trữ 60 ngày, khoá tutor, gói, chuyển hệ thống) và 8.1.4 (gửi email cố định). Menu 1 cộng dồn mọi thay đổi nên lên thẳng được, không cần dán từng bản. Chọn giờ vắng (sau 23:30 hoặc trước 08:00).

### 3.1 Chuẩn bị (5 phút)

1. Chrome hồ sơ riêng (hoặc cửa sổ ẩn danh) chỉ đăng nhập tài khoản chạy STAGING.
2. Có đủ 5 file coder gửi: `Code.gs`, `Index.html`, `appsscript.json` (dự án chính); `GoogleLogin.gs`, `appsscript.json` dự án phụ (cho bước 3.6). Hai file `appsscript.json` khác nhau: file dự án chính dài, có `oauthScopes` với 8 dòng; file dự án phụ ngắn, có `USER_ACCESSING`.
3. File Sheets STAGING (đang chạy 8.0.10, menu cũ): **thaiput → Bảo trì và phát hành → Bảo trì: chỉ xem**.
4. **thaiput → Bảo trì và phát hành → Phát hành: sao lưu ngay**. Hộp thoại báo tên bản sao.

### 3.2 Dán code (10 phút)

1. **Tiện ích mở rộng → Apps Script**. Cột trái mục **Tệp** hiện các file đang có: `appsscript.json` (nếu đã bật hiện tệp kê khai), `Code.gs`, `MailFix.gs`, `Index.html`.
2. `appsscript.json`: chưa thấy thì bánh răng **Cài đặt dự án** → tick **Hiện tệp kê khai "appsscript.json" trong trình chỉnh sửa** → quay lại trình soạn. Mở `appsscript.json`, **đọc trước khi dán**: có dòng `"https://mail.google.com/",` không? Ghi lại. Chọn hết, dán `appsscript.json` dự án chính. Lúc nãy có dòng `mail.google.com`: dán lại dòng đó ngay dưới dòng `"https://www.googleapis.com/auth/gmail.send",`. Kiểm có dòng `gmail.send`. **Lưu**.
3. `Code.gs`: mở, chọn hết, xoá, dán `Code.gs` mới. **Lưu**. Dòng đầu phải là `/**`, dòng 2 ghi `THAIPUT v8.1.4`. **Không tìm và thay `MailApp.sendEmail(`** như trước: bản này có 2 chỗ `MailApp.sendEmail(` là đường dự phòng, phải giữ nguyên.
4. `Index.html`: mở, chọn hết, dán `Index.html` mới. **Lưu**.
5. **Xoá `MailFix.gs`:** rê chuột vào tên file → ba chấm → **Xoá** → xác nhận. Dự án còn đúng 3 file: `appsscript.json`, `Code.gs`, `Index.html`. Có file `.gs` lạ khác: hỏi coder trước khi xoá.
6. Cột trái mục **Dịch vụ** vẫn có **Calendar**.

### 3.3 Chạy menu (10 phút)

1. Quay lại tab Sheets, **F5**. Menu **thaiput** có dạng mới: 1, 2, 3, Xem link trang web, rồi các menu con (Người dùng, Gói học, Báo cáo, Email, Cập nhật phiên bản, Chuyển hệ thống, Lưu trữ, Công cụ kỹ thuật, Test).
2. **Cập nhật phiên bản → Bù buổi 8.1.0: xem trước gói sẽ đổi ngày (chỉ đọc)**. Google hỏi cấp quyền: chọn đúng tài khoản → **Nâng cao → Đi tới ...** → **Cho phép**, rồi chạy lại menu. Đọc danh sách gói sẽ đổi hạn (dữ liệu thử nên thường ít). Chưa ghi gì.
3. **Menu 1**. Đọc hộp thoại, phải có các dòng (con số tuỳ dữ liệu):
   * "Sao lưu trước cập nhật (8.0.10 sang 8.1.4): THAIPUT_DB_STAGING_TRUOC_8.1.4_..., thư mục Releases (không tự xoá)". Có dòng "CẢNH BÁO: chưa sao lưu được": **dừng**, chạy **Cập nhật phiên bản → Phát hành: sao lưu ngay**, thành công mới chạy lại menu 1;
   * "Tạo tab META";
   * "Thêm cột vào STUDENT_PACKAGES: start_date_locked, ...", "Thêm cột vào BOOKINGS: tech_fault, ..., result_notice_at", "Thêm cột vào MAIL_LOG: transport";
   * "Thêm ... khoá cấu hình vào CONFIG", có thể kèm dòng chép ô cũ đã sửa sang ô mới (link đăng nhập, lịch tutor, `LOG_KEEP_DAYS`);
   * "Thêm ... luật thông báo", "Thêm ... dòng chữ web vào CONTENT", mẫu email cập nhật;
   * dòng về gói LEGACY (xoá khi không học viên nào dùng);
   * "Tính lại gói theo luật bù buổi 8.1.0: ... gói đổi ngày hoặc trạng thái";
   * "Trigger: 8 cái";
   * "Ghi nhận phiên bản 8.1.4".
   Hộp thoại báo lỗi, hoặc hết giờ (quá 6 phút) giữa chừng: chạy lại menu 1 ngay; menu 1 tự làm tiếp phần còn thiếu, không làm lặp phần đã xong.
4. **Cập nhật phiên bản → Các bước chuyển dữ liệu theo phiên bản (chỉ đọc)**: mọi bước ghi ĐÃ CHẠY.
5. **Menu 2**. Không có dòng LỖI. Dòng LƯU Ý hay gặp ở lần đầu:
   * "Đăng nhập Google cho admin chưa cài xong": làm bước 3.6;
   * gói giá 0: làm bước 3.4;
   * tài khoản đang chạy khác `ADMIN_EMAIL`: đúng tài khoản chạy hệ thống thì sửa ô `ADMIN_EMAIL`; cố ý dùng hộp thư khác thì bỏ qua.
   Có LỖI "còn file MailFix.gs": quay lại bước 3.2 mục 5.
6. Menu 2 báo không đủ 8 trigger: menu 3.

### 3.4 Kiểm dữ liệu (5 phút)

1. Tab PACKAGES: `price_vnd` của TRIAL, PASS_2W, PASS_1M phải là giá thật. Giá 0 thì gói không đăng ký được trên web (chỉ nút Zalo). Menu 2 không còn LỖI gói.
2. Tab CONFIG: có các ô mới `MAIL_TRANSPORT` (`GMAILAPP`), `LOG_KEEP_DAYS` (60), `STUDENT_LINK_MINUTES`, `TUTOR_REMIND_AT` (`FRI 15`), `TUTOR_DEADLINE_AT` (`SAT 22`), `SHORT_URL_*`. Ô cũ còn nằm đó không sao (`HUONG_DAN_VAN_HANH.md` B15).
3. Tab META có dòng `APP_VERSION` = `8.1.4`.

### 3.5 Kiểm email và triển khai (10 phút)

1. **Email → Kiểm tra gửi email**, nhập Gmail cá nhân. Lần đầu Google hỏi quyền gửi email qua Gmail: **Cho phép**, chạy lại menu. Hộp thoại phải ghi "Google đã NHẬN thư" và **đường gửi GMAILAPP**. Mở Gmail cá nhân tìm mã `MT...` (cả Thư rác). Tab MAIL_LOG dòng cuối cột `transport` là `GMAILAPP`.
   * Hộp thoại ghi đường gửi MAILAPP: GmailApp thiếu quyền. Kiểm `appsscript.json` còn dòng `gmail.send`, Lưu, chạy lại. Vẫn MAILAPP và Lần thực thi báo lỗi nhắc `https://mail.google.com/`: thêm dòng `"https://mail.google.com/",` vào `oauthScopes`, Lưu, chạy lại, cho phép.
   * So số hạn mức "trước → sau" trong hộp thoại: giảm 1 là GmailApp trừ cùng hạn mức Apps Script.
2. Trình soạn: **Triển khai → Quản lý các lần triển khai** → bản đang dùng → **bút chì** → **Phiên bản mới** → Mô tả `8.1.4` → **Triển khai**. Không bấm "Triển khai mới".
3. Sheets: **Cập nhật phiên bản → Bảo trì: tắt**.
4. Thử nhanh trên điện thoại:
   * trang chủ: gói hiện đúng giá; form đăng ký gõ số điện thoại kiểu `Line: abc` gửi được;
   * học viên thử xin link 2 lần liền: lần 2 báo "link đã được gửi lúc ..."; bấm link trong email 2 lần trong 15 phút đều vào được;
   * đặt 1 buổi, huỷ ngay; email xác nhận và email huỷ tới;
   * menu **Xem link trang web** hiện đủ link;
   * trang quản trị mở được (đăng nhập bằng link email vì `ADMIN_LINK_LOGIN` đang TRUE, hoặc Google sau bước 3.6).
5. Lượt lưu trữ 03:00 đầu tiên: email đã gửi, thông báo đã đọc, nhật ký cũ hơn 60 ngày được chuyển sang file lưu trữ (trước đây giữ 3 tháng). Không mất; xem bằng **Lưu trữ → Lưu trữ: mở file**.

### 3.6 Đăng nhập Google cho admin (15 phút)

Bản 8.0.10 đã có đăng nhập Google. **Chỉ làm khi menu 2 báo "Đăng nhập Google cho admin chưa cài xong".**

* Menu 2 báo đã cài (dự án phụ đã có): không tạo dự án phụ mới, không tạo khoá mới, **không cần làm gì**. `GoogleLogin.gs` không đổi; `appsscript.json` dự án phụ mới chỉ ghi rõ quyền xem email (bản cũ Google tự nhận ra quyền này), không bắt buộc dán. Muốn dán: dán, **Lưu**, **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai**, mở link dự án phụ 1 lần, cho phép.
* Thử: trang đăng nhập → nút Google → thẻ mới → **Tiếp tục** → trang quản trị mở ở thẻ đó. Lưu dấu trang link `/exec` này.
* Menu 2 báo chưa cài: làm `HUONG_DAN_VAN_HANH.md` Phần M1, bước 1 đến 11.

Sau 1 tuần chạy ổn: `ADMIN_LINK_LOGIN = FALSE`.

### 3.7 Những gì khác đi sau khi lên 8.1.4 (báo tutor, học viên khi cần)

* Tutor: link đăng nhập bấm được nhiều lần trong 15 phút; mỗi email xin link 1 lần mỗi giờ. Nhắc mở lịch tuần sau lúc 15:00 thứ Sáu, hạn 22:00 thứ Bảy. Không còn tự Hoàn thành: tutor phải chọn kết quả, quá 24 giờ thì báo đỏ, quá 48 giờ thành Không hoàn thành (không lương).
* Học viên: buổi lỗi phía trường được cộng ngày bù và có email báo. Huỷ muộn (admin huỷ sau 15:00 hôm trước theo yêu cầu học viên) bị trừ lượt.
* Admin: menu gom nhóm; xử lý theo `HUONG_DAN_VAN_HANH.md`.

## 4. Quay lui khi bản mới có lỗi

| Lỗi | Làm |
|---|---|
| Trang web lỗi, dữ liệu không sao | **Triển khai → Quản lý các lần triển khai → bút chì → chọn phiên bản cũ** → **Triển khai**. Trang về bản cũ trong 1 phút. Sau đó dán lại code cũ vào trình soạn và **Lưu** (để trigger cũng chạy code cũ). Code cũ: coder gửi lại, hoặc trình soạn → **Lịch sử dự án** |
| Việc chạy tự động (trigger) lỗi | Như trên; bước dán lại code cũ là bắt buộc |
| Dữ liệu bị ghi sai | 1. **Bảo trì: đóng cổng học viên và tutor**. 2. Mở bản sao mới nhất trong Releases hoặc **Nhật ký phiên bản**, so và chép lại dòng đúng. 3. Gửi coder mô tả. 4. **Bảo trì: tắt** |
| Không chắc lỗi do đâu | **Bảo trì: chỉ xem**, gửi coder: ảnh lỗi, giờ xảy ra, các dòng gần đó ở NOTIFICATIONS và ACTIVITY_LOG |
| Muốn quay về 8.0.10 sau khi đã chạy menu 1 của 8.1.4 | **Không nên.** Menu 1 đã chuyển dữ liệu (ngày bù, ngày bắt đầu khoá, buổi kỹ thuật, xoá gói LEGACY, đổi tên ô CONFIG); code 8.0.10 không hiểu các thay đổi đó và lại cần MailFix. Lỗi: bật **Bảo trì: chỉ xem** và báo coder sửa trên 8.1.4. Chỉ khi coder đồng ý và coder làm cùng: khôi phục chính file dữ liệu bằng **Tệp → Nhật ký phiên bản** về mốc trước menu 1 (mất mọi dữ liệu ghi sau lúc đó; không dùng bản sao trong Releases để chạy vì hệ thống vẫn trỏ vào file gốc), coder xoá các dấu `MIG_*` trong Script Properties để lần nâng sau chạy lại bước chuyển dữ liệu, dán lại code 8.0.10 và MailFix |
| Quay về 8.0.9 hoặc 8.0.8 | Như bản hướng dẫn 8.0.10 (giữ trong lịch sử project); hiếm khi cần |

Cột, tab do bản mới thêm không gây hại khi quay về bản cũ (bản cũ bỏ qua cột lạ). Không xoá cột, tab do bản mới thêm.

## 5. Những việc KHÔNG làm

* Không sửa code trong trình soạn khi chưa có bản test của coder.
* Không tìm và thay trong `Code.gs` (từ 8.1.4).
* Không bấm **Triển khai mới** khi cập nhật (đổi link `/exec`).
* Không xoá file, thư mục `THAIPUT_V8_*`, file `THAIPUT · Lưu trữ · ...` trên Drive. File lưu trữ nằm trong thùng rác thì lưu trữ tự dừng và menu 2 báo lỗi.
* Không đổi tên tab hay tiêu đề cột trong file dữ liệu.
* Không chạy hàm `switchToProduction` trên file STAGING.
* Không chạy **Chuyển hệ thống → Bước 1** trên hệ thống đang dùng khi chưa có kế hoạch go live (Bước 1 đóng cổng, gỡ sự kiện, xoá trigger).
* Không chạy **Công cụ kỹ thuật → Tắt hết trigger** trên hệ thống đang chạy chính thức.
* Không đổi chủ sở hữu file dữ liệu, file lưu trữ sang tài khoản khác khi đang chạy. Đổi tài khoản: menu **Chuyển hệ thống**, có coder đi cùng.

## 6. Go live (chunk 6)

Đã chốt: chưa tách STAGING và PRODUCTION tới hết chunk 5. Go live ở chunk 6: cách đơn giản nhất, không mất dữ liệu, 2 bản chức năng tương đương chạy song song, kèm hướng dẫn tắt hết trigger STAGING khi PRODUCTION chạy chính thức. Hướng dẫn từng bước viết ở chunk 6. Từ lần cập nhật đầu tiên sau go live: dùng mục 2 của file này cho từng môi trường.

Khi admin nói "xuất PRODUCTION": coder gửi thêm bộ chia nhiều file `.gs` (kèm MANIFEST.txt có mã băm từng file). Bộ chia file chạy giống hệt bản một file.
