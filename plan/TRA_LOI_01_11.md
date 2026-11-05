# Trả lời và tư vấn ngày 01/11/2026

*Dựa trên code 8.0.10 (đọc lại trong repo ngày 01/11) và tài liệu Google. Chưa thực thi.*

## Thay đổi so với bản 01/11 lần 2

* Mục 2 dời sang chunk 5Q (làm sau cùng). Mục 3: không đặt trần cả hệ thống (BL50).

## Thay đổi so với bản 01/11 sáng (05:03)

* Mục 3: chống spam link theo quyết định của anh, **mỗi người chỉ xin link 1 lần mỗi giờ**; admin dùng **Đăng nhập Google ngay**, có danh sách việc làm được ngay hôm nay với code 8.0.10.
* Mục 4: **bỏ email Chủ nhật cho học viên**, thay bằng thông báo trên trang học viên từ thứ Bảy, khi đã có giờ trống tuần sau.
* Mục 8: hướng dẫn chỉ xuất khi anh yêu cầu; mỗi chunk chỉ giao file tiến độ.

## Thay đổi so với `TRA_LOI_29_10.md`

* Thêm: phương án gửi email cố định qua mọi phiên bản, bộ đếm hạn mức ở menu 2, đăng nhập theo vai trò, lịch nhắc tutor theo thứ và giờ, lưu trữ 60 ngày, chuyển hệ thống và đổi tài khoản, gói học, giải thích "−1".
* **Sau soát chéo kỹ thuật 01/11** (agent tìm 10 lỗ hổng mức CAO, 4 khẳng định sai): đã sửa ngay trong từng mục dưới, đánh dấu "Sửa sau soát".
* **Sửa:** bản 29/10 ghi "cấu hình hiện tại cho đặt tới sát giờ học". Sai. Hệ thống đang dùng **luật 15:00 hôm trước** (`BOOKING_LEAD_HOURS = 0` được hiểu là -1). Lý do anh nêu về thứ Hai là đúng.

## 1. Vì sao "hạn = ngày bắt đầu + số ngày gói + ... − 1"

Ngày bắt đầu đã là ngày thứ nhất của gói (câu 2 file 01: "thời hạn tính cả ngày đầu").
* Gói 7 ngày bắt đầu 14/10 gồm 14, 15, 16, 17, 18, 19, 20/10. Ngày cuối = 14 + 7 − 1 = 20/10.
* Bỏ "−1" thì ra 21/10, tức 8 ngày.

Các khoản cộng thêm (tạm khoá, bù, admin cộng tay) không trừ 1, vì mỗi khoản là số ngày nối thêm sau ngày cuối. Chi tiết ở `plan/TU_VAN_BU_BUOI.md` mục 4.

## 2. Gửi email: phương án cố định, không sửa lắt nhắt qua từng bản

**Cập nhật 01/11 05:35:** anh chốt làm phần này **sau cùng (chunk 5Q)**, trước v9. Tới đó giữ MailFix tìm và thay: `HUONG_DAN_MAILFIX.md`.

**Vấn đề gốc:** MailFix hiện được vá tay vào Code.gs (Find và Replace). Mỗi lần dán Code.gs mới là mất bản vá.

**Phương án vĩnh viễn:**
1. **Một file nguồn riêng `src/MailTransport.gs`**, là chỗ **duy nhất** được gọi dịch vụ gửi thư. Mọi email vẫn đi qua `sendMail_` hoặc `sendTpl_` như luật 19, 32.
   * Ghép một file `Code.gs`: file này tự nằm trong đó.
   * Tách nhiều file `.gs`: nó là một file riêng.
   * Cả hai cách đều sinh tự động từ `src/`, không ai phải sửa tay.
2. **Ô CONFIG `MAIL_TRANSPORT`** chọn đường gửi, đổi trong Sheets, không cần dán code:

   | Giá trị | Đường gửi | Quyền cần | Ghi chú |
   |---|---|---|---|
   | `GMAIL_API` (đề xuất mặc định) | Gmail API, dịch vụ nâng cao "Gmail" | `gmail.send` (chỉ gửi) | Đúng chữ "Gmail API" anh chọn ngày 29/10. Đi đường Gmail nên không bị trả về như MailApp. Quyền hẹp nhất. Phải tự dựng thư dạng MIME (tiêu đề có dấu, HTML kèm chữ thuần). Code dài hơn, test được trên Node |
   | `GMAILAPP` | GmailApp (cách MailFix đang chạy) | Tài liệu Google ghi cần `https://mail.google.com/` (đọc và xoá được toàn hộp thư) | Lần thử 22/10 với `gmail.send` đã gửi được, nhưng tài liệu không bảo đảm. Quyền quá rộng. **Sửa sau soát:** khi `oauthScopes` đã ghi cố định mà thiếu quyền này, chuyển sang GMAILAPP trong Sheets sẽ làm mọi thư hỏng. Vì vậy chỉ có 2 cách (BL10): bỏ hẳn chế độ này, hoặc thêm quyền rộng ngay từ đầu |
   | `MAILAPP` | MailApp (cũ) | `script.send_mail` | Đang bị trả về trên tên miền. Giữ làm đường dự phòng |
   | `RESEND` (sau này, BL31) | Dịch vụ ngoài qua UrlFetchApp | `script.external_request` | Chỉ thêm khi chuyển dịch vụ ngoài |

3. **Test chặn tái phạm:** harness quét toàn bộ `src/`. Có `MailApp.sendEmail`, `GmailApp.sendEmail`, `Gmail.Users.Messages.send` **hoặc `getRemainingDailyQuota`** ở ngoài `MailTransport.gs` thì test đỏ.
   * **Sửa sau soát:** hiện có 6 chỗ đọc hạn mức bằng MailApp: Notify.gs (bỏ thư ưu tiên thấp, menu kiểm tra), Marketing.gs (2 chỗ), Metrics.gs, Setup.gs.
   * Dùng GMAIL_API mà bộ đếm của Google không giảm thì: thư ưu tiên thấp không bao giờ bị bỏ, marketing tính sai ngân sách.
   * Tất cả phải gọi một hàm duy nhất `mailBudget_()` trong MailTransport, trả về "Còn gửi được" ở bảng dưới.
4. **Dựng thư cho Gmail API phải chống chèn dòng tiêu đề** (sửa sau soát). Tiêu đề thư có chữ do người ngoài gõ (tên trong form đăng ký công khai, nội dung thông báo). Phải:
   * bỏ ký tự xuống dòng;
   * mã hoá tiêu đề và tên người gửi đúng chuẩn cho chữ có dấu, chia đoạn đúng độ dài;
   * khai rõ bảng mã UTF‑8;
   * bỏ dòng "trả lời tới" khi ADMIN_EMAIL trống;
   * nhận nhiều người nhận cách dấu phẩy.

   Gmail API giới hạn tốc độ gửi: vòng gửi marketing phải chờ rồi thử lại khi bị từ chối vì gửi quá nhanh.
5. **Bộ giả lập test phải bắt được thư Gmail API** (sửa sau soát): giải mã thư thô vào danh sách thư đã gửi. Nếu không, các test đang giả lập `MailApp.sendEmail` sẽ xanh giả.
6. **`appsscript.json` chốt một lần** với đủ quyền cho mọi đường gửi:
   * `gmail.send` + dịch vụ nâng cao Gmail;
   * `script.send_mail` (cho MAILAPP và đọc hạn mức).

   Từ đó các bản sau không đổi quyền, chỉ dán Code.gs và Index.html. Lần đầu dán phải dán cả `appsscript.json` và bấm cấp quyền lại một lần.
7. **Người gửi là tài khoản đang chạy code.**
   * Trang web chạy dưới **người triển khai** (Deploy).
   * Trigger chạy dưới **chủ file**: menu 3 chỉ chủ file chạy được, nên không có chuyện "người khác chạy menu 3" như bản trước ghi (sai, sửa sau soát).
   * Rủi ro thật: người triển khai và chủ file là hai tài khoản khác nhau, khi đó thư đi từ hai địa chỉ.
   * Menu 2 so 3 thứ: tài khoản đang gửi, chủ file, ADMIN_EMAIL. Khác nhau thì báo đỏ.
8. **Chỉ đặt GMAIL_API làm mặc định sau khi bản thử báo Delivered** (sửa sau soát). Câu "đi đường Gmail nên không bị trả về" là suy luận từ lần thử GmailApp ngày 22/10, chưa đo với Gmail API.
9. MAIL_LOG thêm cột đường gửi (khai báo `optional`, luật 38). Đếm "đã gửi 24 giờ" giữ trong bộ đệm, không đọc cả tab mỗi thư.

**Nói thẳng:** đổi đường gửi **không tăng hạn mức** (xem `TRA_LOI_29_10.md` mục 1). Workspace dùng thử bị giới hạn 500 thư mỗi ngày (Gmail), Apps Script còn chặn thêm. Hạn mức chỉ tăng khi admin@ chuyển sang trả phí và qua đủ ngày.

### Bộ đếm hạn mức chuẩn ở menu 2 (luôn có)

| Dòng | Nguồn | Ý nghĩa |
|---|---|---|
| Google còn cho gửi | `MailApp.getRemainingDailyQuota()` | Bộ đếm duy nhất Google cung cấp; chỉ chắc chắn đúng cho đường MAILAPP |
| Đã gửi 24 giờ qua | Đếm người nhận trong MAIL_LOG, 24 giờ trượt, chia theo đường gửi | Bộ đếm của hệ thống, đúng với mọi đường gửi |
| Trần đang đặt | CONFIG `MAIL_DAILY_CAP` (mặc định 100 khi dùng thử; đổi lên khi đã trả phí) | Trần admin tự khai theo loại tài khoản |
| **Còn gửi được** | Số nhỏ nhất của (Google còn cho gửi) và (Trần đang đặt − Đã gửi 24 giờ) | Con số dùng để quyết định gửi hay bỏ thư ưu tiên thấp |
| Cảnh báo | Đạt 80% trần | Thông báo Cần xử lý |

Bản 5J đo thật: gửi một thư bằng GMAIL_API, xem "Google còn cho gửi" có giảm không. Đo xong mới ghi kết luận vào hướng dẫn, không đoán. Menu Kiểm tra gửi email đổi số "trước, sau" sang bảng này.

## 3. Đăng nhập theo vai trò (đưa vào 5J)

| Vai trò | Link dùng được trong | Số lần bấm | Phiên giữ | Ô CONFIG |
|---|---|---|---|---|
| Học viên | 15 phút | Không giới hạn | 30 ngày | mới: `STUDENT_LINK_MINUTES`, `STUDENT_LINK_MAX_USES` (0 = không giới hạn); giữ `SESSION_DAYS` |
| Tutor | 15 phút | Không giới hạn (**hiện là 1 lần**) | 30 ngày | mới: `TUTOR_LINK_MINUTES`, `TUTOR_LINK_MAX_USES`; đã có `TUTOR_SESSION_DAYS` |
| Admin | **24 giờ** | Không giới hạn (**hiện là 1 lần, 15 phút**) | 30 ngày | mới: `ADMIN_LINK_MINUTES`, `ADMIN_LINK_MAX_USES`; đã có `ADMIN_SESSION_DAYS` |

* **Sửa sau soát:** chỉ **6 ô mới** (bản trước ghi 9; 3 ô phiên đã có sẵn). Ô cũ `LOGIN_LINK_MINUTES`, `LOGIN_LINK_MAX_USES`, `STAFF_LOGIN_LINK_MAX_USES` được thay.
* Từ lúc dán code tới lúc chạy menu 1, ô mới chưa có. Vì vậy:
  * `cfg_` đọc ô cũ khi ô mới chưa có;
  * menu 1 chép ô cũ **trước** bước thêm ô mặc định, để không đè giá trị anh đã sửa.
* **Hạn link được tính lúc tạo**, nên phải đổi theo vai trò ở **mọi** nơi tạo link: đăng ký được duyệt, admin gửi link, cổng thử tải, trang xin link.
* Câu "link dùng được trong N phút" trên web và trong email đổi sang key ghi theo giờ khi trên 60 phút (tránh "1440 phút").
* Luật 36 trong CLAUDE.md sửa theo.

**Nói thẳng về link admin 24 giờ, bấm không giới hạn:** ai có thư đó (thư bị chuyển tiếp, máy bị mượn) đều vào được trang quản trị trong 24 giờ.

Có sẵn: email "Có đăng nhập mới" cho admin, nhật ký LOGIN.

**Phải thêm** (sửa sau soát):
* **Thoát mọi phiên phải huỷ cả link còn hạn.** Hiện `logoutAll_` chỉ huỷ phiên, nên thư bị chuyển tiếp vẫn mở được phiên mới ngay sau đó.
* **Chống spam gửi link (anh chốt 01/11): mỗi email chỉ xin link 1 lần mỗi giờ, áp cho mọi vai trò.**
  * Ô CONFIG `LOGIN_LINK_COOLDOWN_MINUTES = 60`, thay cho `LOGIN_LINK_MAX_PER_WINDOW` (3) và `LOGIN_LINK_WINDOW_MINUTES` (5).
  * Đếm trong bộ đệm, không ghi Sheets (luật 37).
  * Xin lại trong giờ đó: trang báo "Link đã gửi lúc HH:MM, kiểm cả mục Spam. Xin lại được sau HH:MM."
  * **Không lộ email nào có tài khoản** (luật chống dò A06): email không có tài khoản cũng nhận đúng câu báo này.
  * Thư ưu tiên cao nên được gửi kể cả khi gần hết hạn mức.
* **Hệ quả phải biết:** link học viên, tutor chỉ dùng được 15 phút. Ai mở thư muộn quá 15 phút thì phải chờ tới hết 60 phút mới xin được link mới. Hai lối thoát:
  * admin gửi hộ bằng menu "Gửi link đăng nhập" (không bị giới hạn, có ghi nhật ký);
  * phiên giữ 30 ngày, nên việc phải xin link chỉ xảy ra khoảng mỗi tháng một lần.
* **Trần cho cả hệ thống: không đặt** (anh chốt BL50). Rủi ro còn lại: kẻ phá có danh sách nhiều email vẫn gửi được 1 thư mỗi giờ cho mỗi email; theo dõi bằng nhật ký và bảng hạn mức ở menu 2.

**Mật khẩu cho admin: không khuyên.**
* Apps Script không có hàm băm mật khẩu chậm chuẩn (bcrypt, scrypt), chỉ băm nhanh. Muốn an toàn phải tự lặp nhiều vòng, tự khoá khi sai nhiều lần, tự làm luồng quên mật khẩu.
* Ước 1 cửa sổ code, thêm rủi ro.
* Admin **đã có "Đăng nhập Google"** (từ 5D, giữ cho admin ở quyết định 16/10): không cần mật khẩu, không cần thư, bảo mật do Google lo.

**Anh chốt 01/11: admin dùng Đăng nhập Google ngay.**

**Nói thẳng:** code 8.0.10 **đã có sẵn** Đăng nhập Google cho admin (từ 5D). Thứ còn thiếu là **cài dự án phụ**, việc này không cần chờ 5J. Làm được ngay hôm nay, khoảng 15 phút:

1. Vào script.google.com bằng admin@, tạo dự án mới tên "thaiput Google login".
2. Dán nội dung `v8/dist_google_login/GoogleLogin.gs`. Bật "Hiện tệp kê khai appsscript.json" trong Cài đặt dự án, rồi dán `v8/dist_google_login/appsscript.json`.
3. Trong file Sheets: menu thaiput, "Đăng nhập Google: tạo khoá bí mật (chủ file)". Chép 2 dòng hiện ra.
4. Dự án phụ, Cài đặt dự án, Thuộc tính tập lệnh: thêm `GOOGLE_LOGIN_SECRET` và `MAIN_URL` đúng như 2 dòng đó.
5. Dự án phụ, Triển khai, Triển khai mới, Ứng dụng web:
   * Thực thi với tư cách: **Người dùng truy cập ứng dụng web**;
   * Ai có quyền truy cập: **Bất kỳ ai có tài khoản Google**.

   Chép link kết thúc bằng `/exec`.
6. Tab CONFIG: `GOOGLE_LOGIN_URL` = link đó, `GOOGLE_LOGIN_ROLES` = `ADMIN`. Chờ 1 phút (bộ đệm cấu hình).
7. Mở trang đăng nhập: có nút đăng nhập bằng Google. Bấm, chọn đúng tài khoản admin@ (trình duyệt nhiều tài khoản Google thì chọn đúng), bấm Tiếp tục trong 2 phút.

Email Google phải trùng email dòng ADMIN trong tab USERS.

**Việc code ở 5J để Google thành đường chính:**
* trang đăng nhập đưa nút Google lên đầu cho admin;
* ô CONFIG `ADMIN_LINK_LOGIN` (TRUE hoặc FALSE): bật link email 24 giờ làm dự phòng; đề xuất tắt sau khi Google chạy ổn 1 tuần;
* menu 2 báo khi `GOOGLE_LOGIN_URL` trống hoặc chưa có khoá bí mật.

Mật khẩu: **không làm** (BL36 bỏ).

## 4. Lịch nhắc tutor, hạn mở lịch, thông báo học viên (đưa vào 5J)

**Kiểm lại lý do của anh: đúng.** Đặt buổi thứ Hai phải xong trước 15:00 Chủ nhật. Hạn mở lịch của tutor hiện cũng là 15:00 Chủ nhật, và thư nhắc gửi 08:00, 13:00 Chủ nhật. Tutor mở lịch sát hạn thì gần như không ai kịp đặt thứ Hai.

**Thiết kế mới:**
* 3 ô CONFIG dạng "thứ giờ":
  * `TUTOR_REMIND_AT = FRI 15` (nhiều mốc thì cách bằng dấu phẩy);
  * `TUTOR_DEADLINE_AT = SAT 22`;
  * thông báo học viên: **bỏ email**, xem điểm 2 bên dưới.
* Chỉ chỉnh được theo giờ chẵn: job chạy mỗi giờ.
* Kiểm hợp lệ: nhắc phải trước hạn, và hạn phải trước **hạn đặt buổi thứ Hai** (15:00 Chủ nhật), không chỉ trước 00:00 thứ Hai (sửa sau soát). Sai thì menu 2 báo đỏ và dùng giá trị mặc định.
* Bỏ 2 trigger `sundayRemind` (Chủ nhật 08:00, 13:00), chuyển việc nhắc vào hourlyJob. Còn 8 trigger, phải chạy lại menu 3 một lần.
  * **Sửa sau soát:** giữ hàm `sundayRemind` rỗng và giữ tên trong danh sách trigger cần xoá. Không làm thế thì trigger cũ không bị xoá và mỗi Chủ nhật báo lỗi không tìm thấy hàm.
  * Mốc "thứ giờ" đánh dấu đã làm **theo tuần**, không theo ngày. Lượt chạy bị lỡ (job chậm) vẫn được làm bù trong tuần đó.
  * **Gửi thư ngoài khoá:** hourlyJob chạy trọn trong một khoá. Gửi hàng trăm thư trong khoá sẽ chặn mọi lượt đặt buổi và có thể chạm giới hạn 6 phút. Trong khoá chỉ chọn người và đánh dấu; gửi sau khoá, có giới hạn thời gian, phần còn lại gửi ở lượt sau (giống email marketing).
* Đổi theo hạn mới mọi chỗ đang dùng hạn Chủ nhật 15:00:
  * hàm `tutorWeekDeadline_`: tutor bớt giờ sau hạn phải xin duyệt;
  * thông báo admin "tutor chưa mở lịch";
  * chữ hạn trên trang tutor;
  * mẫu email `TUTOR_REMIND` (đang ghi "hôm nay {{deadline}}", sẽ sai khi nhắc thứ Sáu);
  * câu báo admin khi tutor xin huỷ sau hạn đang **viết cứng chữ "Chủ nhật" trong code** (Notify.gs), trái luật 32. Chuyển vào mẫu.

**Thông báo học viên (anh chốt 01/11): không gửi email, hiện trên trang học viên.**

* **Khi nào hiện:** từ thời điểm ô CONFIG `STUDENT_WEEK_BANNER_FROM = SAT 00` (00:00 thứ Bảy) của tuần trước, **và** tuần sau đã có ít nhất một giờ còn đặt được. Hiện ngay khi tutor đầu tiên mở giờ thành công. Hết hiện lúc 00:00 thứ Hai.
* **Ai thấy:** học viên có gói còn hạn trong tuần sau, hoặc gói chưa kích hoạt. Học viên hết gói không thấy (thấy lời mời gia hạn như hiện nay).
* **Nội dung:** "Đã có giờ học tuần sau. Buổi thứ Hai phải đặt trước 15:00 Chủ nhật." kèm nút sang trang Đặt lịch. Chữ nằm trong tab CONTENT, sửa được, đủ 2 thứ tiếng (luật 33). Bấm "Đã xem" thì ẩn trên thiết bị đó.
* **Chi phí:** không tốn hạn mức email.
* **Không tốn thêm tốc độ:** dùng lại danh sách giờ đã có trong bộ đệm của trang Đặt lịch, không đọc thêm Sheets mỗi lần mở trang.
* **Nói thẳng:**
  * Thông báo chỉ hiện khi học viên **tự mở** trang. Ai không mở web cuối tuần sẽ không biết. Đây là cái giá của việc bỏ email.
  * Nếu cần, sau này thêm một email duy nhất cho học viên còn gói mà chưa có buổi nào tuần sau, ưu tiên thấp. Không làm ở 5J.
  * Lịch thứ Hai vẫn hẹp: buổi thứ Hai phải đặt trước 15:00 Chủ nhật, nên thông báo mới ghi rõ câu đó.
* **Tutor mở lịch tuần sau trước 15:00 thứ Sáu:** không chặn, mở sớm càng tốt (BL45 theo đề xuất).

## 5. Lưu trữ: 60 ngày cho mọi tab nhật ký, thông báo

* **Áp cho:** ACTIVITY_LOG, MAIL_LOG, NOTIFICATIONS (đã đọc hoặc mức Thông tin), METRICS.
* Một ô CONFIG `LOG_KEEP_DAYS = 60` thay cho `ACTIVITY_LOG_KEEP_DAYS` và `ARCHIVE_LOG_KEEP_MONTHS` (đang 3 tháng).
* **Sửa sau soát** (bản trước mô tả sai hiện trạng):
  * lưu trữ đang chạy **hằng ngày**, không phải hằng tháng;
  * ACTIVITY_LOG hiện nằm lâu nhất khoảng 67 ngày;
  * MAIL_LOG và NOTIFICATIONS nằm tới khoảng 4 tháng;
  * thông báo Khẩn, Cần xử lý chưa đọc **đã được giữ lại** từ trước.
* **Việc thật phải làm:**
  * hạ MAIL_LOG, NOTIFICATIONS về 60 ngày;
  * bỏ mốc chờ 7 ngày;
  * **chuyển nhiều lô mỗi lượt tới khi hết.** Hiện mỗi tab mỗi lượt chỉ chuyển 3.000 dòng mà vẫn đánh dấu "đã xong", nên phần tồn tăng mãi khi đông người (METRICS, ACTIVITY_LOG với 400 học viên);
  * METRICS: thêm vào danh sách lưu trữ, bỏ hàm xoá 90 ngày;
  * mốc dùng cho báo cáo email phải theo 60 ngày;
  * sửa luật 10, 46 trong CLAUDE.md.
* **Ngoại lệ bắt buộc:** giữ các dòng MAIL_LOG của email marketing (loại `MKT:`), vì đây là sổ chống gửi trùng. Chuyển đi thì chiến dịch kéo dài quá 60 ngày sẽ gửi lại cho người đã nhận.
* File lưu trữ theo năm, tên dễ tìm (xem 5K).

## 6. Chuyển sang hệ thống mới, đổi tài khoản admin@ (đưa vào 5L)

**Nói thẳng về giới hạn của Google:**
* Một dự án Apps Script mới (do tài khoản khác tạo, hoặc bản sao) có **link web app mới**. Đổi link thì học viên, tutor phải dùng link mới. Lời giải: **link rút gọn trên tên miền** (BL03 phương án a). Đổi hệ thống chỉ cần đổi đích của link rút gọn. Nên làm BL03 trước.
* Chuyển chủ sở hữu file Drive sang tài khoản ở **tên miền khác** thường không làm thẳng được trong Workspace. Phải kiểm lại khi làm; phương án an toàn là **chép dữ liệu**, không chuyển chủ.
* Sự kiện Calendar nằm trên lịch của tài khoản cũ: dùng menu có sẵn "Chuyển sang tài khoản mới" (bước A gỡ, bước B tạo lại).
* Trigger gắn với người tạo: tài khoản mới phải chạy menu 3.

**Sửa sau soát, 3 điều kiện bắt buộc:**
* **Mốc mã tự sinh và số phiên bản đang nằm trong Script Properties của dự án cũ**, dự án mới không đọc được. Phải có một bản cập nhật trên hệ thống cũ ghi các giá trị này vào một tab `META` **trước** khi chuyển.
* **Thứ tự Calendar:** bước A (gỡ sự kiện) phải chạy trên hệ thống cũ **trước khi chép**. Hàm tạo lại sự kiện bỏ qua buổi đã có mã sự kiện, nên chép trước thì hệ thống mới không tạo sự kiện nào.
* **Chế độ bảo trì "chỉ xem" không dừng job.** Trigger cũ vẫn gửi thư nhắc, sinh thư trùng từ 2 hệ thống. Vì vậy cần thêm menu **"Chuẩn bị chuyển" chạy trên hệ thống cũ**: đóng cổng, chạy bước A, xoá trigger, ghi META. Hệ thống mới chỉ **đọc** file cũ.

**Menu mới "Chuyển hệ thống"** (chạy trên hệ thống **mới**, sau khi hệ thống cũ đã "Chuẩn bị chuyển"):
1. **Nối hệ thống cũ:** nhập id file DB cũ. Kiểm quyền đọc; kiểm phiên bản cũ không mới hơn bản mới.
2. **Chạy thử:** đếm từng tab sẽ chép, liệt kê mã gói còn thiếu, không ghi gì.
3. **Chạy thật:**
   * đặt hệ thống cũ ở chế độ bảo trì "chỉ xem";
   * chép USERS, PACKAGES, STUDENT_PACKAGES, BOOKINGS (mọi trạng thái, giữ đúng mã), AVAILABILITY (từ hôm nay), PAYMENTS, REGISTRATIONS, CONTENT, EMAIL_TEMPLATES, NOTIFY_RULES, và CONFIG nghiệp vụ (không chép id thư mục, id lịch, link web app);
   * giữ mốc mã tự sinh (đọc từ META) để không cấp lại số cũ;
   * ghép cột theo **tên**, ghi qua lớp ghi chuẩn (giữ công thức link Zalo, định dạng chữ);
   * chép theo mã: chạy lần 2 không nhân đôi;
   * chia theo tab, có mốc chạy tiếp, để không chạm giới hạn 6 phút;
   * đếm lại sau khi chép;
   * ghi nhật ký `SYSTEM_IMPORTED`.

   Nhật ký và thông báo cũ không chép, vì đã nằm trong file lưu trữ.
4. **Đóng hệ thống cũ:** chế độ "đóng cổng", trang báo link mới.

**Hệ quả phải báo trước:**
* Phiên đăng nhập (tab AUTH) không chép, nên mọi người phải đăng nhập lại.
* Ảnh chuyển khoản cũ vẫn nằm ở Drive của hệ thống cũ.
* Chia sẻ file sang tài khoản ở tên miền khác có thể bị Workspace chặn.

**Đổi tài khoản admin@ (ví dụ đổi tên miền):** làm đúng 4 bước trên, chạy dưới tài khoản mới, cộng thêm:
* CONFIG `ADMIN_EMAIL`;
* lịch học mới;
* trigger;
* DNS cho tên miền mới.

Hướng dẫn phát hành sẽ có quy trình từng bước kèm ước lượng thời gian bảo trì.

Menu "chuyển STAGING sang PRODUCTION" hiện có giữ nguyên (đổi cờ môi trường trên cùng hệ thống).

## 7. Gói học: bỏ hẳn LEGACY, admin tự thêm gói, mang gói sang hệ thống mới (5L)

* **Bỏ hẳn LEGACY:**
  * bỏ khỏi danh sách gói mặc định;
  * bỏ chức năng chuyển dữ liệu v6 (Migration.gs, menu, test I liên quan);
  * menu 1 xoá dòng LEGACY trong PACKAGES **chỉ khi** không còn gói học viên nào mang mã đó (anh xác nhận là không có), ghi nhật ký `PACKAGE_REMOVED`.

  Kiểu gói "theo buổi" (SESSIONS) vẫn giữ trong code để admin tạo gói theo buổi sau này.
* **Sửa sau soát, phạm vi đầy đủ:**
  * code: Migration.gs, Admin.gs (menu, 2 hàm), Setup.gs, Registration.gs;
  * test: integration.js (I04 và phần giả lập v6); dữ liệu mẫu S004 là gói SESSIONS duy nhất nên **đổi mã**, không xoá; unit, scenarios, ui, harness;
  * tài liệu: file 02, 04, câu 45 file 01, 2 hướng dẫn, PROGRESS.
* **Giữ** key chữ `ad.act.MIGRATED_FROM_V6`, vì nhật ký cũ vẫn hiện tên hành động này.
* Dòng 29 của file 03 (kịch bản dùng gói LEGACY) phải anh duyệt mới được sửa (luật 15, BL49).
* **Admin tự thêm gói:**
  * menu "Thêm gói" hỏi lần lượt: mã, tên tiếng Việt và tiếng Anh, kiểu, số ngày, số buổi tối đa, giá (0 = liên hệ qua Zalo), đang bán;
  * kiểm mã không trùng, số hợp lệ;
  * thêm tay một dòng cũng được: menu 2 kiểm lại;
  * trang đăng ký tự hiện gói đang bán sau khi chạy "Cập nhật nội dung web".
* **Mang sang hệ thống mới:** bước chép (mục 6) đọc mã gói của từng gói học viên. Mã nào chưa có ở hệ thống mới thì **tự tạo dòng gói** theo định nghĩa ở hệ thống cũ, đặt "không bán", và ghi vào báo cáo chạy thử để admin xem. Gói học viên giữ nguyên mã, ngày, số ngày bù.

## 8. Hướng dẫn: đầu mỗi file ghi thay đổi so với bản trước

* Từ 5J, mọi file `.md` hướng dẫn và chính sách mở đầu bằng mục "**Thay đổi so với bản X.Y.Z**": thêm gì, bỏ gì, đổi gì, kèm số mục.
* **Anh chốt 01/11:** mỗi chunk chỉ giao file tiến độ `PROGRESS.md`, có tóm tắt test, soát chéo và việc anh cần làm trên Google. 4 hướng dẫn và 2 chính sách chỉ xuất **khi anh yêu cầu**. Khi xuất thì viết đủ mọi thay đổi tích luỹ từ lần xuất trước, kèm mục "Thay đổi so với bản trước".
* Ghi vào quy ước làm việc trong CLAUDE.md.
