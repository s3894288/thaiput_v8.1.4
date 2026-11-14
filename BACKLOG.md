# BACKLOG thaiput v8

*Cập nhật 14/11/2026 (lần 13). **5R ĐÃ XONG (bản 8.1.9), thêm 13 câu mới BL76 đến BL88. BACKLOG còn 50 câu chờ anh (mục A 47, mục B 3).** Anh rà toàn bộ file này khi tiện (đã hẹn rà ở lượt cuối của chunk 5). Trả lời theo mã, ví dụ "BL76 theo đề xuất". Dòng đã chốt chuyển xuống mục "Đã chốt" kèm ngày.*

## Thay đổi so với bản 12/11 lần 12

* 5R xong (bản 8.1.9, 14/11/2026): gộp dòng trùng key ở EMAIL_TEMPLATES và CONTENT, khung chuyển khoản mới có ô mã QR (CONFIG `BANK_QR_IMAGE`), tăng tốc tải trang, tóm tắt thay đổi sau mỗi lần nâng cấp (tab RELEASE_LOG).
* Thêm BL76 đến BL88: 1 mâu thuẫn chữ chuyển khoản (BL76), 8 đề xuất tăng tốc từ lượt kiểm toàn bộ đường tải (BL77 đến BL84), 2 điểm hành vi cũ của menu 1 nay đã ghi trong tóm tắt nâng cấp (BL85, BL86), 1 giới hạn ảnh QR (BL87) và 1 việc chưa làm của 5R (BL88: soát chéo 2 agent).
* Mục D thêm các việc cần kiểm trên Google thật cho 5R.
* Các câu BL77 đến BL84 đều là tối ưu, không câu nào chặn go live; BL76 và BL88 nên trả lời trước 5P.

## Thay đổi so với bản 07/11 lần 11

* Soát lại plan 5J đến 5P bằng 2 sub agent trước go live: tìm ra 2 mục có tên trong plan mà chưa làm, nay đã làm ở bản 8.1.8 (bảng màu trong Hướng dẫn vận hành; viền đỏ đúng ô nhập sai).
* **BL22 đã làm** (viền đỏ đúng ô nhập sai), chuyển xuống "Đã chốt". Mục B còn 3 câu.

## Thay đổi so với bản 05/11 lần 10

* 5N xong (bản 8.1.7): BL13 đã làm theo đề xuất (b), chờ anh duyệt. Soát chéo 5N đề ra 4 câu mới: BL72 đến BL75.
* **5N, 5O đã xong: đến lượt anh rà toàn bộ BACKLOG** (đã hẹn sau 5N, 5O).

## Thay đổi so với bản 05/11 lần 9

* 5O xong cả khung email (bản 8.1.6): BL09 phần code đã làm (khung mới vẫn kèm bản chữ thuần cho ứng dụng không hỗ trợ); còn bước gửi thử tới Gmail web, Gmail điện thoại, Outlook là việc của admin trên STAGING.
* Thêm BL71 (chữ trong ảnh banner trang chủ).

## Thay đổi so với bản 02/11 lần 8

* 5O phần giao diện web xong (bản 8.1.5, theo ảnh thương hiệu): BL08 ghi "đã làm phần web, chờ anh duyệt". Phần email của 5O (khung `emailWrap_` mới, gửi thử Gmail web, Gmail điện thoại, Outlook — BL09) chưa làm.
* Thêm BL70 (tài liệu thiết kế viết lại, chờ anh duyệt).

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
| BL70 | `THIET_KE_GIAO_DIEN.md` viết lại theo bản 5O (file gốc tả bản 19/10 không còn đúng; hơi ngoài phạm vi "chỉ Styles.html" của kế hoạch). (a) giữ file đã cập nhật; (b) bỏ file, chỉ giữ chú thích đầu Styles.html | (a) | Tuần này (rà) |
| BL71 | Ảnh banner trang chủ (anh đưa 05/11) có chữ "THAIPUT LUYỆN NÓI TIẾNG THÁI 1-1 với người Thái Lan" tiếng Việt cố định, đứng ngay trên h1 cùng ý; người xem tiếng Anh (nút EN) vẫn thấy chữ Việt trong ảnh. (a) giữ nguyên (ảnh là nhận diện); (b) cắt ảnh chỉ lấy phần minh hoạ, bỏ khối chữ, h1 lo thông điệp; (c) 2 bản ảnh VI và EN (nặng thêm ~80KB) | (a), đã làm | Tuần này (rà) |
| BL09 | Email hiện bản phẳng ở Outlook và ứng dụng không hỗ trợ màu chuyển, đổ bóng | Chấp nhận | 5O |
| BL13 | Màu vàng "Vắng học viên": (a) bỏ; (b) giữ tới khi admin chọn "Đã xử lý" | (b) | 5N (đã làm theo đề xuất ở 8.1.7, chờ duyệt) |
| BL72 | Buổi Vắng học viên (vàng) và Không hoàn thành (đỏ) có TRƯỚC 8.1.7 vẫn tô màu sau nâng cấp (như 8.1.6, không phải lỗi mới), admin phải chọn "Đã xử lý" từng dòng. (a) giữ; (b) bước chuyển dữ liệu một lần: đánh dấu đã xem mọi buổi Vắng học viên cũ hơn 7 ngày (không đụng Không hoàn thành, luật 55 cần admin làm rõ); (c) mục menu đánh dấu hàng loạt | (b) | Tuần này (rà) |
| BL73 | Màu đỏ STUDENT_PACKAGES "chờ admin cộng tay" dựa vào thông báo COMP_ON_EXPIRED CHƯA ĐỌC: bấm "Đã đọc hết" hoặc mở thông báo trên web là hết đỏ dù chưa cộng ngày. (a) giữ, hướng dẫn ghi "cộng xong mới đánh dấu đã đọc"; (b) cột hệ thống mới `comp_pending_days`: đỏ theo dữ liệu, hết khi admin sửa `comp_days_admin` (bỏ được công thức đọc tab NOTIFICATIONS) | (b) ở 5P | Tuần này (rà) |
| BL74 | Huỷ bởi admin một buổi KẸT Chờ đổi tutor (lỗi phía trường): luôn Huỷ bởi admin (không trừ lượt, được bù), kể cả sau mốc huỷ muộn 15:00 hôm trước (ngoại lệ của luật huỷ muộn ở 5M). (a) giữ; (b) vẫn xét mốc | (a), đã làm | Tuần này (rà) |
| BL75 | Màu vàng "còn N ngày" chép số EXPIRY_NOTICE_DAYS vào công thức: đổi CONFIG thì chạy lại menu 1 mới đổi màu; công thức dùng ngày thật (TODAY), không theo giờ giả lập SIM_NOW trên STAGING. (a) giữ, ghi hướng dẫn; (b) sửa ô CONFIG đó thì tự tô lại | (a) | Tuần này (rà) |
| BL76 | Chữ chuyển khoản tự mâu thuẫn: dòng đậm trên form nay ghi "chỉ ghi số điện thoại của bạn", nhưng sau khi gửi, web (key `h.done_code`, `s.renew_done_code`) và email REG_RECEIVED còn nói "Mã nội dung chuyển khoản của bạn: {{transfer_code}}", email REG_ADMIN cho admin cũng hiện mã đó. Học viên có thể chuyển khoản theo mã thay vì số điện thoại. (a) giữ cả hai; (b) đổi các chữ đó thành "mã đăng ký" chỉ để tham khảo, không nói là nội dung chuyển khoản; (c) bỏ `transfer_code` khỏi chữ học viên thấy, chỉ admin còn thấy | (b). Bản admin đang chạy đã tự đổi tên thành "mã đăng ký" ở REG_RECEIVED (theo ảnh chụp tab), nên đổi chữ mặc định cho khớp | Trước 5P |
| BL77 | Ảnh bìa trang chủ nặng khoảng 74 KB trên khoảng 125 KB tải lần đầu (59 phần trăm). (a) giữ; (b) nén lại ở rộng 800 px (nhẹ hơn khoảng 30 đến 40 KB, hơi mềm hơn trên điện thoại); (c) đưa ảnh lên Drive như ảnh QR, tải sau | (a) tới khi đo trên Google thật; nếu chậm thì (b) | Không (tối ưu) |
| BL78 | Trang chủ cần 1 lượt gọi máy chủ (`apiPublicInfo`: gói, ngân hàng) sau khi tải. (a) giữ; (b) nhúng thông tin công khai vào trang đầu để khỏi gọi thêm (nhanh hơn khoảng 0,4 đến 1,5 giây); giá hoặc ngân hàng admin sửa có thể hiện trễ vài phút trừ khi sửa PACKAGES cũng làm mới bộ nhớ đệm | (a) tới khi đo; (b) nếu số đo thấy chậm | Không (tối ưu) |
| BL79 | Bộ nhớ đệm CONFIG 60 giây và CONTENT 300 giây hết hạn nhanh nên giờ vắng khách hay phải đọc lại Sheets. (a) giữ; (b) kéo dài khoảng 10 và 30 phút, làm mới khi sửa Sheets (tiết kiệm 0,4 đến 0,9 giây mỗi lượt vào giờ vắng); đổi luật 41, sửa bằng script phải chạy menu làm mới | (a) | Không (tối ưu) |
| BL80 | Bộ nhớ đệm danh sách slot đặt theo phút nên gần như luôn trượt khi ít khách. (a) giữ; (b) làm lại: nhớ danh sách và áp hạn đặt lúc đọc | (a) | Không (tối ưu) |
| BL81 | `SESSION_CACHE_SECONDS` 120 giây: phiên bị hỏi lại Sheets sau mỗi 2 phút. (a) giữ 120; (b) 900 hoặc 3600 (nhanh hơn, nhưng sửa tay tab AUTH có hiệu lực trễ tới chừng đó; thoát mọi thiết bị qua web vẫn tức thì, luật 35) | (a) | Không (tối ưu) |
| BL82 | Gửi email link đăng nhập đang nằm TRONG khoá, trái ý luật 5 (việc chậm đăng ký ra sau khoá). (a) giữ; (b) chuyển ra ngoài khoá (nhanh hơn 0,5 đến 1,5 giây, nhả khoá sớm); cần quyết cách đóng dấu chống xin lại và dạng nhật ký | (b) ở 5P | Không (tối ưu) |
| BL83 | Đo tốc độ (METRICS) ghi cả API đọc: (a) giữ; (b) chỉ lấy mẫu một phần API đọc để nhẹ hơn | (a) | Không (ưu tiên thấp) |
| BL84 | Mã trang quản trị được gửi cho mọi người dùng (học viên, tutor cũng tải). (a) giữ; (b) chỉ gửi mã quản trị cho admin | (a) | Không (ưu tiên thấp) |
| BL85 | Menu 1 thay TOÀN BỘ luật tô màu của 5 tab NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS, STUDENT_PACKAGES: luật admin tự thêm bằng tay ở các tab này mất sau mỗi lần chạy (hành vi cũ từ 5N; nay ghi rõ trong tóm tắt nâng cấp). (a) giữ và nhắc admin ở hướng dẫn; (b) giữ lại luật lạ (không phải của hệ thống) | (a) | 5P |
| BL86 | `removeLegacyPackage_` chạy ở MỖI lần menu 1: dòng PACKAGES có mã `LEGACY` mà chưa học viên nào dùng sẽ bị xoá, kể cả khi admin cố ý thêm lại gói tên đó. (a) giữ; (b) chỉ chạy một lần (đánh dấu bước chuyển dữ liệu) | (b) | 5P |
| BL87 | Ảnh QR nhớ đệm 6 giờ: thay NỘI DUNG file Drive mà giữ nguyên link thì web hiện ảnh cũ tới 6 giờ (đổi LINK thì đổi tức thì). (a) giữ 6 giờ, hướng dẫn "đổi link, đừng ghi đè file"; (b) rút còn 1 giờ; (c) thêm mục menu "Làm mới ảnh QR" | (c) nếu admin hay đổi QR, không thì (a) | Không |
| BL88 | Luật Soát (CLAUDE.md): việc lớn soát bằng 2 agent độc lập và thử phá. Ở 5R anh tắt agent giám sát nên chỉ chạy 1 orchestrator và 1 worker mỗi việc; CHƯA có soát chéo 2 agent. Đã có 13 đột biến thử phá (đều bị test bắt). (a) bỏ qua; (b) chạy soát chéo 2 agent và thử phá trước go live (gộp vào 5P) | (b) | 5P |

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
  * nâng cấp thật 8.1.4 lên 8.1.9: tóm tắt trong hộp thoại menu 1, tab RELEASE_LOG, email "Tóm tắt cập nhật" tới `ADMIN_EMAIL`, chạy lại menu 1 thì im lặng;
  * trên file Sheets thật: EMAIL_TEMPLATES và CONTENT mỗi key đúng một dòng sau menu 1; chữ gửi đi đúng là chữ admin đã sửa (ví dụ thân REG_RECEIVED tiếng Anh bắt đầu "Thaiput received"); nguồn gốc các cặp dòng trùng đứng cạnh nhau mới giải thích một phần;
  * tốc độ: đo bằng menu **Đo tốc độ** trước và sau khi dán 8.1.9 (số tăng tốc ở PROGRESS.md mới là ước lượng).
* **Mới:**
  * Gmail API có trừ vào bộ đếm hạn mức của Apps Script không (đo ở 5J);
  * GmailApp (8.1.4) trừ cùng hạn mức: menu Kiểm tra gửi email, số "trước → sau" giảm 1;
  * thư GmailApp tới hộp thư cùng tên miền trường (lý do có MailFix);
  * chuyển chủ sở hữu file sang tài khoản ở tên miền khác (chỉ khi đổi tài khoản).

## Đã chốt

| Ngày | Mã | Kết quả |
|---|---|---|
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
