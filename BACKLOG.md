# BACKLOG thaiput v8

*Cập nhật 28/11/2026 (lần 16). **Đánh lại số để gộp được với PR #2: BL70 đến BL95 thành BL150 đến BL175 (mỗi số cộng 80), test I136, I137, I138 thành I230, I231, I232. Số câu chờ anh không đổi (55).**

*Cập nhật 27/11/2026 (lần 15). **Rà lại lần 2 (26 đến 27/11): ghi chú BL156 ngày 26/11 (số điện thoại không bắt buộc), thêm 1 câu mới BL175 (giao diện 390 px bằng tiếng Anh). Trước đó, soát chéo 5R (bản 8.1.9) xong: BL167 và BL168 đã đóng, thêm 6 câu mới BL169 đến BL174. BACKLOG còn 55 câu chờ anh (mục A 52, mục B 3).** Đếm bằng cách đếm dòng bắt đầu bằng `| BL` trong mục A và mục B (mục C là việc để sau, không tính). Anh rà toàn bộ file này khi tiện (đã hẹn rà ở lượt cuối của chunk 5). Trả lời theo mã, ví dụ "BL169 theo đề xuất". Dòng đã chốt chuyển xuống mục "Đã chốt" kèm ngày.*

## Thay đổi so với bản 27/11 lần 15

* Đánh lại số BL của nhánh này để không trùng PR #2: BL70 đến BL95 thành BL150 đến BL175 (mỗi số cộng 80), áp dụng ở mọi tài liệu và mã; số câu chờ anh không đổi (55).
* Test tích hợp I136, I137, I138 đổi thành I230, I231, I232 (cũng để không trùng PR #2).

## Thay đổi so với bản 15/11 lần 14

* **BL156** có ghi chú thêm ngày 26/11: số điện thoại không bắt buộc (luật 16), nên học viên bỏ trống số thì dòng đậm "chỉ ghi số điện thoại" không có gì để ghi; sửa chữ dẫn tới mẫu thật (REG_RECEIVED, ADMIN_NEW_REG).
* Thêm **BL175** (27/11): nút "Log out" xuống hai dòng và tên học viên bị cắt ở thanh trên của trang học viên, màn hình 390 px, tiếng Anh. Không chặn.

## Thay đổi so với bản 14/11 lần 13

* **BL167 đã đóng** (đề xuất (c) đã làm và làm thêm): menu mới **Email → Làm mới ảnh QR chuyển khoản**, và ảnh QR còn tự làm mới khi chạy menu 2 hoặc khi sửa tay 4 ô CONFIG (`BANK_QR_IMAGE`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER`) nhờ số phiên bản `BANK_QR_REV`. Phần còn lại ghi thành BL170.
* **BL168 đã đóng** (đề xuất (b) đã làm): soát chéo độc lập 14 đến 15/11 (X1, X2 với 102 đột biến, ba vòng sửa, supervisor S1, S2 và vòng soát 3, cùng một lượt soát xác nhận trên commit cuối). Kết quả và danh sách lỗi: `PROGRESS.md` mục "Soát chéo và sửa (14 đến 15/11)". Việc soát tổng 2 agent của 5P trước go live vẫn còn.
* Thêm **BL169 đến BL174**: PR #2 SES trùng số bản 8.1.5 và xung đột 12 file (BL169), giới hạn còn lại của ảnh QR (BL170), dòng CONFIG song sinh (BL171), key có ký tự vô hình ở EMAIL_TEMPLATES, CONTENT (BL172), hai cửa sổ hẹp của email tóm tắt nâng cấp (BL173), một cuộc đua còn lại khi bấm menu 1 hai lần sát nhau (BL174; kết luận soát xác nhận cuối: ĐẠT).
* **BL156 vẫn mở** (nhắc): không chặn kỹ thuật nhưng chữ chuyển khoản tự mâu thuẫn làm học viên bối rối; nên trả lời trước 5P.
* Mục D thêm các việc cần kiểm trên Google thật rút ra từ soát chéo.
* BL169 nên quyết sớm nhất (trước khi merge bất kỳ nhánh nào vào `main`).

## Thay đổi so với bản 12/11 lần 12

* 5R xong (bản 8.1.9, 14/11/2026): gộp dòng trùng key ở EMAIL_TEMPLATES và CONTENT, khung chuyển khoản mới có ô mã QR (CONFIG `BANK_QR_IMAGE`), tăng tốc tải trang, tóm tắt thay đổi sau mỗi lần nâng cấp (tab RELEASE_LOG).
* Thêm BL156 đến BL168: 1 mâu thuẫn chữ chuyển khoản (BL156), 8 đề xuất tăng tốc từ lượt kiểm toàn bộ đường tải (BL157 đến BL164), 2 điểm hành vi cũ của menu 1 nay đã ghi trong tóm tắt nâng cấp (BL165, BL166), 1 giới hạn ảnh QR (BL167) và 1 việc chưa làm của 5R (BL168: soát chéo 2 agent).
* Mục D thêm các việc cần kiểm trên Google thật cho 5R.
* Các câu BL157 đến BL164 đều là tối ưu, không câu nào chặn go live; BL156 và BL168 nên trả lời trước 5P.

## Thay đổi so với bản 07/11 lần 11

* Soát lại plan 5J đến 5P bằng 2 sub agent trước go live: tìm ra 2 mục có tên trong plan mà chưa làm, nay đã làm ở bản 8.1.8 (bảng màu trong Hướng dẫn vận hành; viền đỏ đúng ô nhập sai).
* **BL22 đã làm** (viền đỏ đúng ô nhập sai), chuyển xuống "Đã chốt". Mục B còn 3 câu.

## Thay đổi so với bản 05/11 lần 10

* 5N xong (bản 8.1.7): BL13 đã làm theo đề xuất (b), chờ anh duyệt. Soát chéo 5N đề ra 4 câu mới: BL152 đến BL155.
* **5N, 5O đã xong: đến lượt anh rà toàn bộ BACKLOG** (đã hẹn sau 5N, 5O).

## Thay đổi so với bản 05/11 lần 9

* 5O xong cả khung email (bản 8.1.6): BL09 phần code đã làm (khung mới vẫn kèm bản chữ thuần cho ứng dụng không hỗ trợ); còn bước gửi thử tới Gmail web, Gmail điện thoại, Outlook là việc của admin trên STAGING.
* Thêm BL151 (chữ trong ảnh banner trang chủ).

## Thay đổi so với bản 02/11 lần 8

* 5O phần giao diện web xong (bản 8.1.5, theo ảnh thương hiệu): BL08 ghi "đã làm phần web, chờ anh duyệt". Phần email của 5O (khung `emailWrap_` mới, gửi thử Gmail web, Gmail điện thoại, Outlook — BL09) chưa làm.
* Thêm BL150 (tài liệu thiết kế viết lại, chờ anh duyệt).

## Thay đổi so với bản 01/11 lần 7

* 5Q phần gửi email xong (bản 8.1.4): GmailApp cố định trong code, bỏ MailFix. Phần còn lại của 5Q (Gmail API, bảng hạn mức 5 dòng, kiểm 5 loại hộp thư, BL51) ghi thành BL64 đến BL69.
* 5N, 5O dời sang tuần sau. Lượt rà BACKLOG của anh dời theo (sau 5N, 5O).
* Thêm BL64 đến BL69.

## Thay đổi so với bản 01/11 lần 6

* 5K, 5L làm theo đề xuất các câu BL02, BL03, BL04, BL05, BL06, BL49 (anh chưa trả lời): các dòng giữ ở mục A, ghi "đã làm theo đề xuất", chờ anh duyệt ở 5Q.
* Thêm BL60 đến BL63 (quyết định coder chọn ở 5K, 5L).

## Thay đổi so với bản 01/11 lần 5

* Thêm BL53 đến BL59: quyết định coder tự chọn ở 5M và 5J chưa được duyệt.
* Đã chốt 01/11 tối: chưa tách STAGING và PRODUCTION tới hết chunk 5, go live ở chunk 6; mọi mục chưa duyệt để ở file này, rà ở 5Q; luật thông báo ghi vào Hướng dẫn vận hành (Phần J). BL11 (go live trên 8.0.10) bị thay. BL52 dời sang chunk 6.

## Thay đổi so với bản 01/11 lần 4

* Gửi email cố định dời xuống chunk cuối 5Q; giữ MailFix tìm và thay tới đó. BL51 chuyển sang chặn 5Q.
* Sửa dòng BL52 thiếu cột.

## Thay đổi so với bản 01/11 lần 3

* Chốt BL10, BL11, BL50. Thêm BL51, BL52. Go live PRODUCTION trên 8.0.10.

## Thay đổi so với bản 01/11 lần 2

* Chuyển xuống "Đã chốt": BL40, BL42 (đổi: Trial bù ngày 1 lần, trần 3), BL43, BL44 (đổi: không email, thông báo trên web), BL45, BL46, BL47 (thay Q6), BL48.
* BL41 chuyển sang "Việc để sau".
* Thêm BL50.

## Thay đổi so với bản 29/10

* Chuyển xuống "Đã chốt": BL01 (8 câu bù buổi), BL12, BL32 (lỗi khách quan đưa vào 5M), và quyết định bỏ LEGACY, lưu trữ 60 ngày, duyệt kế hoạch sau go live.
* Thêm BL40 đến BL49 (BL46 đến BL49 từ soát chéo 01/11).
* Sửa BL10 theo phương án email mới.

## A. Câu hỏi chờ anh trả lời

| Mã | Câu hỏi | Đề xuất | Chặn |
|---|---|---|---|
| BL64 | Gửi email: (a) giữ GmailApp làm đường chính lâu dài (đang chạy, giống MailFix); (b) thêm chế độ Gmail API (`MAIL_TRANSPORT = GMAIL_API`, quyền hẹp `gmail.send`, phải dựng thư MIME) và chỉ đổi sau khi qua 6 bước kiểm thư tới nơi | (a) tới khi GmailApp có vấn đề; (b) làm khi cần | Tuần sau (rà) |
| BL65 | Quyền `https://mail.google.com/` (tài liệu Google ghi GmailApp cần; lần thử 22/10 chỉ với `gmail.send` vẫn gửi được): (a) không thêm, có tự gửi lại bằng MailApp khi thiếu quyền; (b) thêm cố định (màn hình cấp quyền ghi "đọc, soạn, gửi, xoá vĩnh viễn thư") | (a) | Tuần sau (rà) |
| BL66 | GmailApp báo thiếu quyền: (a) tự gửi lại bằng MailApp (dễ bị trả về trên tên miền trường), ghi MAIL_FALLBACK, báo admin tối đa 1 lần mỗi giờ; (b) không gửi lại, chỉ ghi MAIL_FAILED | (a), đã làm | Tuần sau (rà) |
| BL67 | Nút Đăng nhập Google mở thẻ mới (Google Sites có thể chặn chuyển trang trong khung nhúng); trang quản trị mở ở link `/exec`, không trong Sites. (a) giữ; (b) mở cùng thẻ | (a), đã làm | Tuần sau (rà) |
| BL68 | Nâng 8.0.10 lên 8.1.4: ô cũ `ARCHIVE_LOG_KEEP_MONTHS` không chép sang `LOG_KEEP_DAYS`, nên email, thông báo cũ hơn 60 ngày sang file lưu trữ ở đêm đầu (không mất). (a) giữ; (b) chép (đổi tháng ra ngày) | (a) | Tuần sau (rà) |
| BL69 | Phần còn lại của 5Q: bảng hạn mức 5 dòng ở menu 2 và ô `MAIL_DAILY_CAP`; kiểm thư tới 5 loại hộp thư (Gmail, Outlook, Yahoo, tên miền trường, Workspace khác) trên STAGING | Làm cùng 5N | Tuần sau |
| BL60 | Số điện thoại nước ngoài gõ không có + và mã nước (ví dụ số Thái `081 234 5678`) bị hiểu là số Việt Nam và lưu `+84812345678`, có link Zalo sai người. (a) giữ, gợi ý trên form đã ghi "số nước ngoài ghi + và mã nước"; (b) chỉ chuẩn hoá khi bắt đầu bằng 0 hoặc +84 hoặc 84 và đủ 10 hay 11 số | (a) | 5Q (rà) |
| BL61 | Gói giá 0 chỉ đăng ký qua Zalo: nếu TRIAL để giá 0 thì Trial thành chỉ qua Zalo. Bản cài mới có giá mặc định 0, menu 2 báo LƯU Ý (không phải LỖI). (a) giữ LƯU Ý; (b) báo LỖI khi mọi gói đang bán đều giá 0 | (a) | 5Q (rà) |
| BL62 | Khoá tutor huỷ giờ rảnh tương lai; mở khoá không tự mở lại giờ rảnh (tutor mở lại trên trang). (a) giữ; (b) mở khoá tự mở lại các giờ đã huỷ khi khoá mà còn ở tương lai | (a) | 5Q (rà) |
| BL63 | Chuyển hệ thống: hệ thống mới có tài khoản trùng email với hệ thống cũ (khác mã) thì Bước 3 dừng, chưa chép gì, admin sửa rồi chạy lại. (a) giữ; (b) tự gộp vào tài khoản ở hệ thống mới | (a) | 5Q (rà) |
| BL53 | Buổi Không hoàn thành (tutor không chọn kết quả sau 48 giờ), phía học viên: hiện tạm tính đã dùng (trừ 1 lượt Trial), chưa khoá ngày bắt đầu, nhãn "Trường đang kiểm tra". (a) giữ; (b) không trừ lượt tới khi admin làm rõ; (c) coi như Vắng tutor (bù luôn) | (a) | 5Q (rà) |
| BL54 | Kênh báo đỏ RESULT_OVERDUE: (a) chỉ web (LOG); (b) email tổng hợp 21:00; (c) email từng buổi. Đổi được ở NOTIFY_RULES không cần coder | (a) | 5Q (rà) |
| BL55 | 3 lựa chọn admin mới ở BOOKINGS `admin_action`: Hoàn thành, Vắng học viên, Vấn đề kỹ thuật (admin chọn). (a) giữ; (b) chỉ cho "Vắng tutor" | (a) | 5Q (rà) |
| BL56 | Link admin 24 giờ bấm không giới hạn: thư bị chuyển tiếp thì người nhận vào quyền admin cả ngày. (a) giữ; (b) 1 lần bấm (`ADMIN_LINK_MAX_USES` = 1) | (b) | 5Q (rà) |
| BL57 | Thời gian chờ xin link 60 phút dài hơn hạn link 15 phút: mở thư trễ là kẹt tới 45 phút. (a) giữ 60; (b) 15 (`LOGIN_LINK_COOLDOWN_MINUTES`, đổi trong CONFIG) | (b) | 5Q (rà) |
| BL58 | (5M.6) Buổi bù của gói vừa hết hạn mà gói gia hạn đã chạy: (a) tự cộng ngày vào gói sau, email học viên; (b) chỉ báo admin cộng tay | (a) | 5Q (rà) |
| BL59 | (5M.6) Ngày bù tay `comp_days_admin` có bản lưu riêng trong Script Properties để lấy lại khi bị dán đè; xoá dữ liệu test xoá luôn bản lưu. (a) giữ; (b) bỏ bản lưu | (a) | 5Q (rà) |
| BL51 | Tự phát hiện thư bị trả về: (a) thêm quyền đọc thư `gmail.readonly`, job hằng ngày khớp thư báo lỗi với MAIL_LOG và báo admin; (b) admin tự xem Email log search mỗi tuần | (a) | 5Q |
| BL52 | STAGING đang chạy dưới tài khoản nào? Khi có PRODUCTION (chunk 6), nếu cùng admin@: hạn mức email và thời gian trigger dùng chung. (a) tắt trigger STAGING lúc không thử; (b) chuyển STAGING sang admintest@ | (a) | Chunk 6 |
| BL49 | Sửa kịch bản dòng 29 file 03 (dùng gói LEGACY) sang gói theo buổi mới, giữ ý kiểm tra | Đồng ý | 5L (đã làm theo đề xuất ở 5L, chờ duyệt ở 5Q) |
| BL02 | "Không ghi lượt xem trang": code không có hành động này. Dòng anh thấy có thể là LOGIN, NOTIF_READ hoặc SHEET_CHANGE kiểu OTHER. Chụp 1 dòng | Bỏ NOTIF_READ, giữ LOGIN | 5K (đã làm theo đề xuất ở 5K, chờ duyệt ở 5Q) |
| BL03 | Link rút gọn: (a) URL Redirect trên Namecheap; (b) trang con Google Sites; (c) dịch vụ rút gọn ngoài | (a). Quan trọng hơn trước: đổi hệ thống hay tài khoản chỉ cần đổi đích link | 5K (đã làm theo đề xuất ở 5K, chờ duyệt ở 5Q) |
| BL04 | Khoá tutor còn buổi sắp tới: (a) tự đổi tutor, không đổi được thì huỷ và bù; (b) chặn khoá | (a), có xem trước | 5L (đã làm theo đề xuất ở 5L, chờ duyệt ở 5Q) |
| BL05 | Ngoài "Chuyển dữ liệu từ v6", mục menu nào bỏ hẳn? | Không xoá thêm, chỉ gom vào "Công cụ kỹ thuật" | 5K (đã làm theo đề xuất ở 5K, chờ duyệt ở 5Q) |
| BL06 | Gói giá 0: (a) vẫn chọn được trong form, kèm nút Zalo; (b) không chọn được, chỉ nút Zalo | (b) | 5K (đã làm theo đề xuất ở 5K, chờ duyệt ở 5Q) |
| BL08 | Thiết kế đen trắng, có đổ bóng, đảo quyết định 19/10. Gửi lại ảnh tham chiếu nếu cần | Đổi theo yêu cầu 29/10 | 5O (phần web đã làm 05/11 theo ảnh thương hiệu, bản 8.1.5, chờ anh duyệt trên STAGING) |
| BL150 | `THIET_KE_GIAO_DIEN.md` viết lại theo bản 5O (file gốc tả bản 19/10 không còn đúng; hơi ngoài phạm vi "chỉ Styles.html" của kế hoạch). (a) giữ file đã cập nhật; (b) bỏ file, chỉ giữ chú thích đầu Styles.html | (a) | Tuần này (rà) |
| BL151 | Ảnh banner trang chủ (anh đưa 05/11) có chữ "THAIPUT LUYỆN NÓI TIẾNG THÁI 1-1 với người Thái Lan" tiếng Việt cố định, đứng ngay trên h1 cùng ý; người xem tiếng Anh (nút EN) vẫn thấy chữ Việt trong ảnh. (a) giữ nguyên (ảnh là nhận diện); (b) cắt ảnh chỉ lấy phần minh hoạ, bỏ khối chữ, h1 lo thông điệp; (c) 2 bản ảnh VI và EN (nặng thêm ~80KB) | (a), đã làm | Tuần này (rà) |
| BL09 | Email hiện bản phẳng ở Outlook và ứng dụng không hỗ trợ màu chuyển, đổ bóng | Chấp nhận | 5O |
| BL13 | Màu vàng "Vắng học viên": (a) bỏ; (b) giữ tới khi admin chọn "Đã xử lý" | (b) | 5N (đã làm theo đề xuất ở 8.1.7, chờ duyệt) |
| BL152 | Buổi Vắng học viên (vàng) và Không hoàn thành (đỏ) có TRƯỚC 8.1.7 vẫn tô màu sau nâng cấp (như 8.1.6, không phải lỗi mới), admin phải chọn "Đã xử lý" từng dòng. (a) giữ; (b) bước chuyển dữ liệu một lần: đánh dấu đã xem mọi buổi Vắng học viên cũ hơn 7 ngày (không đụng Không hoàn thành, luật 55 cần admin làm rõ); (c) mục menu đánh dấu hàng loạt | (b) | Tuần này (rà) |
| BL153 | Màu đỏ STUDENT_PACKAGES "chờ admin cộng tay" dựa vào thông báo COMP_ON_EXPIRED CHƯA ĐỌC: bấm "Đã đọc hết" hoặc mở thông báo trên web là hết đỏ dù chưa cộng ngày. (a) giữ, hướng dẫn ghi "cộng xong mới đánh dấu đã đọc"; (b) cột hệ thống mới `comp_pending_days`: đỏ theo dữ liệu, hết khi admin sửa `comp_days_admin` (bỏ được công thức đọc tab NOTIFICATIONS) | (b) ở 5P | Tuần này (rà) |
| BL154 | Huỷ bởi admin một buổi KẸT Chờ đổi tutor (lỗi phía trường): luôn Huỷ bởi admin (không trừ lượt, được bù), kể cả sau mốc huỷ muộn 15:00 hôm trước (ngoại lệ của luật huỷ muộn ở 5M). (a) giữ; (b) vẫn xét mốc | (a), đã làm | Tuần này (rà) |
| BL155 | Màu vàng "còn N ngày" chép số EXPIRY_NOTICE_DAYS vào công thức: đổi CONFIG thì chạy lại menu 1 mới đổi màu; công thức dùng ngày thật (TODAY), không theo giờ giả lập SIM_NOW trên STAGING. (a) giữ, ghi hướng dẫn; (b) sửa ô CONFIG đó thì tự tô lại | (a) | Tuần này (rà) |
| BL156 | Chữ chuyển khoản tự mâu thuẫn: dòng đậm trên form nay ghi "chỉ ghi số điện thoại của bạn", nhưng sau khi gửi, web (key `h.done_code`, `s.renew_done_code`) và email REG_RECEIVED còn nói "Mã nội dung chuyển khoản của bạn:" kèm mã, email REG_RECEIVED (chữ mặc định) ghi "Nội dung chuyển khoản của bạn: {{transfer_code}}", email ADMIN_NEW_REG cho admin cũng hiện mã đó. Học viên có thể chuyển khoản theo mã thay vì số điện thoại. (a) giữ cả hai; (b) đổi các chữ đó thành "mã đăng ký" chỉ để tham khảo, không nói là nội dung chuyển khoản; (c) bỏ `transfer_code` khỏi chữ học viên thấy, chỉ admin còn thấy | (b). Bản admin đang chạy đã tự đổi tên thành "mã đăng ký" ở REG_RECEIVED (theo ảnh chụp tab), nên đổi chữ mặc định cho khớp | Trước 5P. **Nhắc 15/11:** vẫn mở; không chặn kỹ thuật, nhưng học viên đọc hai chỉ dẫn khác nhau (số điện thoại và mã nội dung) có thể chuyển khoản sai nội dung. **Thêm 26/11:** số điện thoại không bắt buộc (luật 16: `normalizePhone_` không bao giờ từ chối, ô trống lưu trống), nên học viên bỏ trống số điện thoại thì dòng đậm "chỉ ghi số điện thoại" không có gì để ghi; khi quyết BL156 cần chọn luôn nội dung chuyển khoản cho người không có số (ví dụ email đăng ký hoặc mã đăng ký) |
| BL157 | Ảnh bìa trang chủ nặng khoảng 74 KB trên khoảng 125 KB tải lần đầu (59 phần trăm). (a) giữ; (b) nén lại ở rộng 800 px (nhẹ hơn khoảng 30 đến 40 KB, hơi mềm hơn trên điện thoại); (c) đưa ảnh lên Drive như ảnh QR, tải sau | (a) tới khi đo trên Google thật; nếu chậm thì (b) | Không (tối ưu) |
| BL158 | Trang chủ cần 1 lượt gọi máy chủ (`apiPublicInfo`: gói, ngân hàng) sau khi tải. (a) giữ; (b) nhúng thông tin công khai vào trang đầu để khỏi gọi thêm (nhanh hơn khoảng 0,4 đến 1,5 giây); giá hoặc ngân hàng admin sửa có thể hiện trễ vài phút trừ khi sửa PACKAGES cũng làm mới bộ nhớ đệm | (a) tới khi đo; (b) nếu số đo thấy chậm | Không (tối ưu) |
| BL159 | Bộ nhớ đệm CONFIG 60 giây và CONTENT 300 giây hết hạn nhanh nên giờ vắng khách hay phải đọc lại Sheets. (a) giữ; (b) kéo dài khoảng 10 và 30 phút, làm mới khi sửa Sheets (tiết kiệm 0,4 đến 0,9 giây mỗi lượt vào giờ vắng); đổi luật 41, sửa bằng script phải chạy menu làm mới | (a) | Không (tối ưu) |
| BL160 | Bộ nhớ đệm danh sách slot đặt theo phút nên gần như luôn trượt khi ít khách. (a) giữ; (b) làm lại: nhớ danh sách và áp hạn đặt lúc đọc | (a) | Không (tối ưu) |
| BL161 | `SESSION_CACHE_SECONDS` 120 giây: phiên bị hỏi lại Sheets sau mỗi 2 phút. (a) giữ 120; (b) 900 hoặc 3600 (nhanh hơn, nhưng sửa tay tab AUTH có hiệu lực trễ tới chừng đó; thoát mọi thiết bị qua web vẫn tức thì, luật 35) | (a) | Không (tối ưu) |
| BL162 | Gửi email link đăng nhập đang nằm TRONG khoá, trái ý luật 5 (việc chậm đăng ký ra sau khoá). (a) giữ; (b) chuyển ra ngoài khoá (nhanh hơn 0,5 đến 1,5 giây, nhả khoá sớm); cần quyết cách đóng dấu chống xin lại và dạng nhật ký | (b) ở 5P | Không (tối ưu) |
| BL163 | Đo tốc độ (METRICS) ghi cả API đọc: (a) giữ; (b) chỉ lấy mẫu một phần API đọc để nhẹ hơn | (a) | Không (ưu tiên thấp) |
| BL164 | Mã trang quản trị được gửi cho mọi người dùng (học viên, tutor cũng tải). (a) giữ; (b) chỉ gửi mã quản trị cho admin | (a) | Không (ưu tiên thấp) |
| BL165 | Menu 1 thay TOÀN BỘ luật tô màu của 5 tab NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS, STUDENT_PACKAGES: luật admin tự thêm bằng tay ở các tab này mất sau mỗi lần chạy (hành vi cũ từ 5N; nay ghi rõ trong tóm tắt nâng cấp). (a) giữ và nhắc admin ở hướng dẫn; (b) giữ lại luật lạ (không phải của hệ thống) | (a) | 5P |
| BL166 | `removeLegacyPackage_` chạy ở MỖI lần menu 1: dòng PACKAGES có mã `LEGACY` mà chưa học viên nào dùng sẽ bị xoá, kể cả khi admin cố ý thêm lại gói tên đó. (a) giữ; (b) chỉ chạy một lần (đánh dấu bước chuyển dữ liệu) | (b) | 5P |
| BL169 | Draft PR #2 (nhánh `claude/hopeful-galileo-xa1dv9`, "8.1.5 gửi email qua Amazon SES", liên quan BL31 và ô `MAIL_DAILY_CAP` của BL69) xung đột với nhánh 8.1.9 này ở 12 file: `.github/workflows/test.yml`, `.gitignore`, `BACKLOG.md`, `HUONG_DAN_PHAT_HANH.md`, `HUONG_DAN_VAN_HANH.md`, `PROGRESS.md`, `README.md`, `dist/Code.gs`, `package.json`, `src/Config.gs`, `test/integration.js`, `test/unit.js` (đã kiểm bằng `git merge-tree`), và cũng ghi `VERSION: '8.1.5'`, trùng số với bản 8.1.5 (giao diện đen trắng) của nhánh này. Nhánh nào vào `main` trước? (a) nhánh này (8.1.9) vào trước, nhánh SES rebase lên rồi đổi số bản thành 8.2.0 hoặc số trống kế tiếp (kèm mục `RELEASE_NOTES_` và baseline); (b) nhánh SES vào trước, đánh lại số bản của nhánh này; (c) để SES tới sau go live. **Cập nhật 28/11:** anh đã quyết từng file; đây là phần của nhánh này (PR #1, 8.1.9). (1) `.github/workflows/test.yml`: giữ bản nhánh này, chỉ thêm `cache: npm`; khi gộp vẫn còn xung đột hai file khác nhau (add/add). (2) `.gitignore`: chưa xử lý, còn xung đột. (3) `package.json`: nhánh này giữ 8.1.9. (4) `src/Config.gs`: giữ 8.1.9, không thêm khoá SES (`MAIL_FROM_ADDRESS`, `MAIL_DAILY_CAP`); còn xung đột ở dòng số bản. (5) `dist/Code.gs`: chưa xử lý, còn xung đột (dựng lại bằng build khi gộp). (6, 9, 10) `README.md`, `HUONG_DAN_PHAT_HANH.md`, `HUONG_DAN_VAN_HANH.md`: giữ nguyên; không coi là xung đột cần xử lý vì SES chỉ là phương án đề xuất chưa được duyệt ở PR #2. (7) `PROGRESS.md`: chunk SES ở PR #2 đổi tên thành 5S (làm trên nhánh PR #2 cùng đợt 28/11), chunk 5R của nhánh này giữ tên. (8) `BACKLOG.md`: BL70 đến BL95 của nhánh này đánh lại thành BL150 đến BL175 (mỗi số cộng 80); BL01 đến BL69 (có trước khi hai nhánh tách) và số BL của PR #2 giữ nguyên. (11) `test/integration.js`: test I136 đến I138 của nhánh này đánh lại thành I230 đến I232; không đụng test SES. (12) `test/unit.js`: giữ file gốc của nhánh này (khôi phục từ lịch sử git), file viết lại của PR #2 không cần. Ba va chạm liên quan SES (hai khoá CONFIG mới, quyền `script.external_request`, test SES): bỏ qua theo quyết định của anh. Đo lại bằng `git merge-tree --write-tree --name-only` với đầu nhánh PR #2 là `4e231d7` (trước khi nhánh đó đổi tên chunk SES): vẫn còn 12 file xung đột, đúng danh sách ở đầu câu hỏi này (`.github/workflows/test.yml`, `.gitignore`, `BACKLOG.md`, `HUONG_DAN_PHAT_HANH.md`, `HUONG_DAN_VAN_HANH.md`, `PROGRESS.md`, `README.md`, `dist/Code.gs`, `package.json`, `src/Config.gs`, `test/integration.js`, `test/unit.js`). Đo trên đầu nhánh này `32cd310` và trên bản làm việc đã đánh lại số (chưa commit), cùng kết quả; việc đánh lại số chưa làm số file giảm vì hai nhánh vẫn cùng sửa các file này. Đo cả với bản PR #2 đã đổi tên chunk SES thành 5S: vẫn đúng 12 file trên. **Lưu ý khi gộp (28/11):** không có cách gộp PR #2 mà chỉ lấy phần không phải SES. Gộp nhánh là kéo vào TOÀN BỘ mã SES không báo xung đột: `src/MailTransport.gs` (gửi qua SES, tự gửi lại bằng GmailApp), `src/Setup.gs` (menu 2 kiểm SES), hai khoá `MAIL_FROM_ADDRESS`, `MAIL_DAILY_CAP` trong `src/Config.gs` và quyền `script.external_request` trong `appsscript.json` (anh phải cấp quyền lại khi dán bản mới). Vì SES chưa được duyệt: KHÔNG gộp PR #2 vào nhánh này hay vào `main` cho tới khi anh duyệt SES. Khi duyệt: lấy số bản mới sau 8.1.9, thêm mục `RELEASE_NOTES_` cho hai khoá mới, ghi lại baseline, sửa các test nâng cấp đếm khoá mới (thử gộp 27/11: 11 test đỏ, đều do hai khoá này), và đổi các câu tài liệu nói `appsscript.json` không đổi từ 8.1.4. Tên chunk 5S đã thuộc về SES: chunk kế tiếp của nhánh này không dùng tên 5S. | (a). Nhánh này đã soát chéo và có bài thử nâng cấp 8.1.4 lên 8.1.9; SES là tính năng mới chưa chạy thật | Trước khi merge bất kỳ nhánh nào |
| BL170 | Ảnh QR cũ còn tới 6 giờ mỗi khi anh thay nội dung file ảnh dưới cùng link mà sau đó không chạy menu 2, menu Làm mới ảnh QR hay sửa tay một trong 4 ô CONFIG liên quan; trường hợp dễ gặp nhất: anh sửa tài khoản ngân hàng trước (sửa tay `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` làm mới ngay), RỒI MỚI thay nội dung file ảnh dưới cùng link mà không chạy menu 2 hay menu Làm mới ảnh QR. (a) giữ, hướng dẫn "thay file xong thì chạy menu Làm mới ảnh QR" (đã ghi ở menu 2 và hướng dẫn); (b) cho `apiBankQr` kiểm ngày cập nhật cuối của file Drive tối đa mỗi 5 phút và tự làm mới khi thấy đổi (tốn hạn mức Drive, chưa đo) | (a); làm (b) nếu anh thấy dễ quên | Không |
| BL171 | Hai dòng CONFIG chỉ khác nhau ở dấu cách hoặc ký tự vô hình, mà giá trị anh nhập nhiều khả năng nằm ở dòng KHÔNG có hiệu lực (dòng đang có hiệu lực, thường là dòng cuối, đang mang mặc định hoặc trống; nếu có dòng khoá sạch và dòng ký tự vô hình nằm sau nó thì dòng khoá sạch mới được dùng). Hiện chỉ BÁO (menu 1, menu 2, RELEASE_LOG, email) kèm cách sửa tay. (a) giữ chỉ báo; (b) thêm sửa tự động hẹp: chỉ khi dòng có hiệu lực là mặc định hoặc trống VÀ dòng kia có giá trị khác mặc định, chép giá trị sang dòng có hiệu lực, ghi nhật ký, vẫn không xoá dòng | (a): tự đổi giá trị đang chạy (có thể là khoá bí mật, số tài khoản) mà không hỏi rủi ro hơn là báo; hiếm gặp | Không |
| BL172 | Key có ký tự vô hình (U+200B, U+200C, U+200D, U+2060, U+FEFF) ở EMAIL_TEMPLATES và CONTENT chỉ được cắt khoảng trắng hai đầu, chưa chuẩn hoá như khoá CONFIG; hai key trông giống nhau nhưng khác ký tự vô hình bị coi là hai key khác, menu 2 không báo. (a) giữ; (b) dùng cùng hàm chuẩn hoá `cfgKeyNorm_` cho hai tab | (a) tới khi thấy trường hợp thật trên file của anh; (b) nếu menu 1 trên file thật còn để lại cặp trùng | Không |
| BL173 | Email tóm tắt nâng cấp: có hai trường hợp hẹp mà anh thấy thông báo `MAIL_FAILED` nói "có thể đã hoặc chưa gửi" (tóm tắt luôn nằm ở tab RELEASE_LOG), không bao giờ hai email từ một bản ghi tóm tắt (bấm menu 1 hai lần thật sát nhau thì khác, xem BL174). (1) Lượt chạy bị ngắt từ lúc nhận việc gửi tới lúc Google nhận thư: anh KHÔNG nhận email (9 điểm liền nhau trong mỗi ma trận cắt ngang, theo test I197 và I198). (2) Bị ngắt ngay SAU khi Google nhận thư, trước khi bản ghi đánh dấu đã gửi: anh nhận email NHƯNG vẫn có thông báo đó, và dòng MAIL_LOG của email không bao giờ được ghi (4 điểm liền nhau; chỉ lệch số đếm hạn mức email trong ngày). Hai lượt chạy cùng lúc cũng có thể báo thông báo dù email của lượt kia đã đi. (a) chấp nhận; (b) thêm hạn thuê theo giờ: sau N phút mà dấu "đang gửi" chưa xong thì cho gửi lại (có thể trùng một email, đổi lại hiếm khi thiếu) | (a): tóm tắt luôn còn ở RELEASE_LOG và thông báo; thiếu một email hay lệch một dòng đếm hạn mức tốt hơn gửi trùng | Không |
| BL174 | Cuộc đua còn lại khi nâng cấp, thấp và không chặn, có từ trước đợt 5R, do soát xác nhận cuối tìm ra: hai lượt menu 1 bấm cách nhau trong khoảng 6 lời gọi dịch vụ (trước lúc phiên bản được ghi nhận) đều có thể giao tóm tắt, nên anh nhận 2 email, 2 thông báo `RELEASE_NOTES` và RELEASE_LOG gấp đôi; dữ liệu nghiệp vụ không bị ảnh hưởng. Supervisor đánh giá gần như không thể xảy ra trên Google thật. (a) giữ nguyên, chỉ dặn: **bấm menu 1 một lần, chờ hộp thoại** (đã ghi ở `PROGRESS.md` mục "Việc của admin" và `HUONG_DAN_PHAT_HANH.md` mục 3A.1); (b) làm chặt: niêm phong bản ghi trong khoá và đọc lại `APP_VERSION_LAST` ngay trong khoá đó (thay đổi nhỏ, cần thêm một vòng soát) | (a): rủi ro rất thấp, tóm tắt trùng không làm hỏng dữ liệu; làm (b) nếu sau này muốn gỡ hẳn | Không |
| BL175 | Giao diện điện thoại 390 px bằng tiếng Anh (phát hiện 27/11 khi dựng thật bằng Playwright): ở thanh trên của trang học viên, nút "Log out" xuống hai dòng và tên học viên bị cắt bớt (luật CSS `.topbar-right .who` trong `src/ui/Styles.html`, `max-width: 14ch`). Không mất chức năng, chỉ xấu. (a) giữ tới 5P (soát giao diện tổng); (b) sửa ngay: `.topbar-right .btn { white-space: nowrap }` và `.topbar-right .who { min-width: 0 }`, rồi kiểm lại 5 trang ở 390 px và 900 px, hai ngôn ngữ | (a) | Không |

## B. Câu hỏi cũ chưa thấy trả lời

| Mã | Câu hỏi | Nguồn | Đề xuất |
|---|---|---|---|
| BL20 | Giám sát trang health: (A) Google Cloud; (B) UptimeRobot khoảng 9 đến 10 USD/tháng; (C) Better Stack; (D) chưa giám sát | mục `TU_VAN_GIAM_SAT_16_10.md` trong `archive/TU_VAN_VA_KIEN_TRUC.md` | B cho PRODUCTION |
| BL21 | "Vắng học viên" báo admin ngay bằng email (đổi NOTIFY_RULES, không cần code) hay giữ email tổng hợp 21 giờ | Trả lời 22/10 | Giữ tổng hợp |
| BL23 | Tutor không dùng Gmail vào thẳng Meet: (1) mở Meet cho người chưa đăng nhập; (2) tutor tạo tài khoản Google bằng email đang có; (3) cấp Workspace | Chat tên miền 22/10 | (1) ngay, (2) song song |

## C. Việc để sau

| Mã | Việc | Ghi chú |
|---|---|---|
| BL30 | **Học viên từ chối nhận email marketing:** link "Ngừng nhận" một bấm, nhãn quảng cáo trong tiêu đề nếu luật đòi, tra luật Việt Nam về thư điện tử quảng cáo trước chiến dịch lớn | Anh yêu cầu để backlog 29/10 |
| BL31 | Gửi email qua dịch vụ ngoài (Resend, Postmark) | MailTransport ở 5J đã chừa chế độ RESEND; làm khi cần |
| BL33 | Nút học viên tự báo tutor vắng, đánh giá buổi học, tutor đề xuất level | `docs/02_PLAN_CODE.md` mục 10 |
| BL34 | Khoá đổi quyết định lỗi kỹ thuật sau ngày chốt lương tháng | Chưa có khái niệm chốt lương |
| BL35 | Dữ liệu mẫu demo: vài dòng nhật ký cũ chi tiết tiếng Việt | Nhỏ |
| BL36 | Mật khẩu admin | Bỏ: admin dùng Đăng nhập Google (01/11) |
| BL41 | Buổi admin huỷ muộn (CANCELLED_LATE) có trả lương tutor không | Để sau (01/11). Không cần code: thêm `CANCELLED_LATE` vào ô `PAYROLL_STATUSES` khi chốt "có". Mặc định không tính |

## D. Còn phải kiểm trên Google thật

* Thư kiểm tra có mã tới Gmail cá nhân và tutor; Email log search.
* Đặt cùng lúc từ 2 máy.
* Thêm, xoá tab thử: nhật ký ghi đúng tên tab.
* Đo tốc độ.
* Vùng tô màu khi tab tự thêm hàng (sửa ở 5N).
* **Mới ở 5R (bản 8.1.9):**
  * Drive: web đọc đúng file ảnh QR bằng tài khoản chạy hệ thống; menu 2 báo "BANK_QR_IMAGE hợp lệ" với ảnh thật, báo LỖI đúng với link sai, file ở thùng rác, file quá 300 KB;
  * quét thử mã QR bằng ứng dụng ngân hàng thật trên điện thoại, ở cả hai cỡ (200 px trên điện thoại, 184 px trên máy tính), trang đăng ký lẫn gia hạn; kiểm ô trống thì không hiện khung QR;
  * bộ nhớ đệm mảnh dưới 100 KB: ảnh gần 300 KB vẫn hiện; đổi link thì ảnh mới hiện ngay;
  * nâng cấp thật 8.1.4 lên 8.1.9: tóm tắt trong hộp thoại menu 1, tab RELEASE_LOG, email "Tóm tắt cập nhật" tới `ADMIN_EMAIL`; chạy lại menu 1 khi đã giao đủ thì im lặng (chỉ thêm một dòng `SETUP_RUN` ở nhật ký; lần chạy lại đầu tiên còn có thể nâng mốc mã thông báo ở META cho kịp lượt trước, I155);
  * trên file Sheets thật: EMAIL_TEMPLATES và CONTENT mỗi key đúng một dòng sau menu 1; chữ gửi đi đúng là chữ admin đã sửa (ví dụ thân REG_RECEIVED tiếng Anh bắt đầu "Thaiput received"); nguồn gốc các cặp dòng trùng đứng cạnh nhau mới giải thích một phần;
  * tốc độ: đo bằng menu **Đo tốc độ** trước và sau khi dán 8.1.9 (số tăng tốc ở PROGRESS.md mới là ước lượng).
* **Mới ở soát chéo 5R (15/11), chỉ mới kiểm trong bộ mô phỏng Node:**
  * link font nạp không chặn (`onload`) chạy đúng trong khung HtmlService của trang thật;
  * `setProperties` của Script Properties có ghi nguyên tử nhiều khoá không (bản ghi giao tóm tắt `RELEASE_PENDING` cùng dấu phiên bản dựa vào đó);
  * tranh chấp khoá thật và giới hạn 6 phút của menu 1 (ma trận cắt ngang và xen kẽ hai lượt chạy chỉ chạy trên khoá mô phỏng);
  * ô bắt đầu bằng `=`, `+`, `-`, `@` ở CONTENT và EMAIL_TEMPLATES còn là chữ sau khi `purgeRows_` ghi lại tab lúc menu 1 gộp key trùng;
  * sắp xếp hoặc xoá dòng ở tab CONFIG có kích hoạt trigger sửa tay không, và có làm mới ảnh QR không;
  * email "Tóm tắt cập nhật" hiển thị ra sao ở Gmail web, Gmail điện thoại, Outlook (cả khối "Cần bạn xem" màu đỏ);
  * chạy code 8.1.4 trên database đã nâng lên 8.1.9 (quay lui code): chưa có test, theo thiết kế bản cũ bỏ qua cột và tab lạ.
* **Mới:**
  * Gmail API có trừ vào bộ đếm hạn mức của Apps Script không (đo ở 5J);
  * GmailApp (8.1.4) trừ cùng hạn mức: menu Kiểm tra gửi email, số "trước → sau" giảm 1;
  * thư GmailApp tới hộp thư cùng tên miền trường (lý do có MailFix);
  * chuyển chủ sở hữu file sang tài khoản ở tên miền khác (chỉ khi đổi tài khoản).

## Đã chốt

| Ngày | Mã | Kết quả |
|---|---|---|
| 15/11 | BL168 | Soát chéo độc lập cho 5R (đề xuất (b)) đã chạy 14 đến 15/11: X1 và X2 (102 đột biến: 69 bị bắt, 33 sống sót, 9 tương đương) tìm ra lỗi thật; hai vòng sửa (`45f6285`, `84a0b96`), các sửa theo supervisor S1, S2 (`9b49cdc`, `c59cbce`) và theo vòng soát 3 (`5292935`, sửa lỗi hai lượt chạy chen nhau làm hai email tóm tắt); soát xác nhận trên commit cuối. Kết quả, danh sách lỗi và số test: `PROGRESS.md` mục "Soát chéo và sửa (14 đến 15/11)". Soát tổng 2 agent của 5P trước go live vẫn còn |
| 15/11 | BL167 | Làm theo đề xuất (c) và hơn: menu **Email → Làm mới ảnh QR chuyển khoản**; số phiên bản `BANK_QR_REV` (Script Property) nằm trong dấu và khoá bộ nhớ đệm máy chủ và trình duyệt, tăng khi chạy menu 2, khi sửa tay 4 ô CONFIG (`BANK_QR_IMAGE`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER`) và khi dùng menu Làm mới, nên khách thấy ảnh mới ngay. Phần còn lại (thay file sau khi đã sửa tài khoản, không chạy menu nào): BL170. Test I165, I194, U66 |
| 12/11 | BL22 | Form đăng ký tô viền đỏ ĐÚNG ô nhập sai (tên, email, điện thoại, ảnh, ô đồng ý, nhóm gói), con trỏ về ô sai đầu tiên, sửa ô nào thì ô đó hết đỏ ngay. Làm ở bản 8.1.8, test U50 |
| 01/11 tối | Mới | 5K, 5L soát chéo 1 agent mỗi sub chunk; từ 5P lại 2 agent |
| 01/11 tối | Mới | Chưa tách STAGING và PRODUCTION tới hết chunk 5; mọi bản chỉ dán STAGING. Chunk 6: chuyển PRODUCTION đơn giản nhất, không mất dữ liệu, 2 bản chức năng tương đương chạy song song, hướng dẫn tắt hết trigger STAGING khi PRODUCTION chạy chính thức. Thay BL11 |
| 01/11 tối | Mới | Mục chưa duyệt, chưa trả lời, chưa xử lý giữ ở BACKLOG; anh rà ở sub chunk cuối chunk 5 (5Q), coder nhắc |
| 01/11 tối | Mới | Luật thông báo chi tiết ghi vào `HUONG_DAN_VAN_HANH.md` (Phần J), xuất khi anh yêu cầu |
| 01/11 chiều | Câu 29 | Không tự Hoàn thành: báo đỏ sau 24 giờ, Không hoàn thành sau 48 giờ, không lương |
| 01/11 | BL10 | Gửi thư: Gmail API làm chính sau khi qua 6 bước kiểm thư tới nơi trên cả 2 môi trường; GmailApp (MailFix) giữ tới lúc đó; MailApp dự phòng. **Làm ở 5Q, cuối cùng trước v9** |
| 01/11 | Mới | Tới 5Q: giữ MailFix như đang chạy (file MailFix riêng, tìm và thay sau mỗi lần dán Code.gs); mỗi `PROGRESS.md` nhắc lại các bước (`HUONG_DAN_MAILFIX.md`) |
| 01/11 | BL11 | Chưa có học viên thật; go live ngay trên 8.0.10 theo `HUONG_DAN_GO_LIVE_8010.md`: cách A (file PRODUCTION mới, STAGING giữ làm nơi thử) hoặc cách B (bản hiện tại thành PRODUCTION, bản sao làm nơi thử) |
| 01/11 | BL50 | Không đặt trần gửi link cho cả hệ thống |
| 01/11 | BL01 Q1 | Cộng n ngày, kèm bảo đảm ngày cộng thêm đặt được |
| 01/11 | BL01 Q2 | Ngày bắt đầu = buổi học hoàn chỉnh đầu tiên; học viên vắng thì khoá ở buổi đó; đã khoá thì không đổi |
| 01/11 | BL01 Q3 | Bù mọi lúc |
| 01/11 | BL01 Q4 | Lỗi kỹ thuật "Tính lương" (lỗi học viên): trừ lượt Trial |
| 01/11 | BL01 Q5 | Một lựa chọn "Huỷ bởi admin": trước 15:00 hôm trước thì bù, sau đó thì trừ; ghi hướng dẫn chi tiết |
| 01/11 | BL01 Q6, BL47 | Buổi được bù nằm trong hạn gói, gói vừa hết hạn chưa quá 7 ngày: tự cộng và mở lại gói; ngoài ra admin cộng tay |
| 01/11 | BL01 Q7 | Gói nối đuôi dời theo, chuyển buổi đã đặt sang gói trước |
| 01/11 | BL01 Q8 | `PKG_EDITORS` = admin@ |
| 01/11 | BL42 | Trial: bù ngày **một lần**, +3 ngày, trần tổng 3 ngày (phần chênh để đặt được không tính vào trần); lần bù sau chỉ trả lượt |
| 01/11 | BL40 | Khoá ngày bắt đầu khi học viên xin huỷ muộn (admin huỷ hộ từ 15:00 hôm trước); huỷ đúng hạn trên web thì không khoá, giữ B11, B12 |
| 01/11 | BL46 | Admin huỷ từ 15:00 hôm trước: trừ lượt, không cộng ngày |
| 01/11 | BL48 | "Bảo đảm đặt được" là kịp hạn đặt, không bảo đảm tutor có giờ trống |
| 01/11 | BL43 | Admin dùng Đăng nhập Google ngay; link email 24 giờ dự phòng, tắt được; không làm mật khẩu |
| 01/11 | BL44 | Bỏ email nhắc học viên Chủ nhật; thông báo trên trang học viên từ 00:00 thứ Bảy, khi tuần sau đã có giờ trống |
| 01/11 | BL45 | Không chặn tutor mở lịch sớm |
| 01/11 | Mới | Mỗi email xin link đăng nhập 1 lần mỗi giờ, mọi vai trò |
| 01/11 | Mới | Mỗi chunk chỉ giao PROGRESS.md; hướng dẫn và chính sách xuất khi anh yêu cầu |
| 01/11 | Mới | Sửa mọi lỗ hổng đã tìm ra (34 mục, bảng ở `plan/KE_HOACH_5J_5P.md` mục 4) |
| 01/11 | Mới | Ô ngày bắt đầu chỉ hệ thống ghi; admin sửa ngày kết thúc và ô ngày bù tay; sửa ô bị khoá hiện "Không thể chỉnh sửa" |
| 01/11 | BL32 | Lỗi kỹ thuật thêm lựa chọn "lỗi khách quan": trả lương và bù (5M) |
| 01/11 | Mới | Bỏ hẳn LEGACY (không học viên nào giữ); admin tự thêm gói; mang gói sang hệ thống mới, tự tạo mã còn thiếu |
| 01/11 | Mới | Lưu trữ 60 ngày cho mọi tab nhật ký và thông báo |
| 01/11 | Mới | Menu Chuyển hệ thống và đổi tài khoản admin@ |
| 01/11 | Mới | Đầu mọi file hướng dẫn ghi thay đổi so với bản trước |
| 01/11 | Mới | Đăng nhập: học viên, tutor link 15 phút bấm không giới hạn, phiên 30 ngày; admin link 24 giờ (dự phòng cho Đăng nhập Google); tất cả chỉnh được trong CONFIG |
| 01/11 | Mới | Nhắc tutor thứ Sáu 15:00, hạn thứ Bảy 22:00, đều chỉnh được |
| 01/11 | BL12 | Kế hoạch sau go live đã duyệt (Gemini 4 Argon qua Google AI Pro) |
| 29/10 | 5I mục 8 câu 1 | Xoá 2 hướng dẫn cũ khỏi project |
| 29/10 | Trả lời 22/10 | Làm cơ chế bù buổi thật; Hướng dẫn vận hành phủ mọi tình huống |
| 16/10 | `TU_VAN_15_10` Q4, Q5 | Không đóng băng; go live trên file PRODUCTION mới |
| 16/10 | 5G câu 2, 3 | Phiên tutor 30 ngày; email "Có đăng nhập mới" chỉ cho ADMIN |
| 18/10 | 5I | Trang quản trị song ngữ; ngày đã có buổi gập sẵn |
