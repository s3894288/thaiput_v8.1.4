# BACKLOG thaiput v8

*Cập nhật 05/11/2026 chiều (lần 10). **5N, 5O dời sang tuần sau (anh chốt 02/11). Anh rà toàn bộ file này ở lượt cuối của chunk 5, sau 5N, 5O; coder nhắc lúc đó.** Trả lời theo mã, ví dụ "BL40 theo đề xuất". Dòng đã chốt chuyển xuống mục "Đã chốt" kèm ngày.*

## Thay đổi so với bản 05/11 lần 9

* Thêm BL79 đến BL84 theo bản 2 kế hoạch v9 (`plan/KE_HOACH_V9_TOI_UU_DIEU_PHOI.md`): mức hạ tầng, SES thay Resend (thay đề xuất BL70), bỏ Google AI Pro, Max 2 tháng, tách Worker jobs, làm P0 trong tháng 11.

## Thay đổi so với bản 02/11 lần 8

* Thêm BL70 đến BL78: quyết định cho kế hoạch v9 chi tiết (`plan/KE_HOACH_V9_CHI_TIET.md`): email bên thứ ba sớm (5R), đăng nhập, repo, Storage, PITR, nâng Claude Max, sửa `CLAUDE.md`.
* Phát hiện `test/unit.js` không có trong repo GitHub (`npm test` đỏ ngay dòng nạp): ghi mục D.

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
| BL79 | Mức hạ tầng v9: (a) Pro gọn 35 USD mỗi tháng (Cloudflare Workers 5 + Supabase Pro 25 + SES 5); (b) An toàn 65 USD (Vercel Pro mỗi ghế + Supabase Pro + Resend Pro); (c) Tột cùng 10 USD (Workers + D1 + SES, tự viết đăng nhập) | (a), thử nghiệm S0 đỏ thì web về Vercel | v9 S0 |
| BL80 | Email: (a) Amazon SES ngay từ 5R (0,10 USD mỗi 1.000 thư, một lần cài, dùng tới hết v9; thay đề xuất Resend ở BL70); (b) Resend Pro 20 USD ở 5R rồi đổi SES ở v9. Kèm: thêm `REMINDER_MODE` giảm khoảng 40% thư ở v9 | (a); `REMINDER_MODE` làm ở v9 | 5R |
| BL81 | Công cụ AI: (a) bỏ Google AI Pro, dùng Gemini CLI miễn phí 1.000 lượt mỗi ngày cho vai đọc dài và viết chữ; (b) giữ AI Pro | (a) trừ khi anh dùng AI Pro cho việc khác | v9 S0 |
| BL82 | Nâng Claude Max 5x chỉ trong 2 tháng nặng nhất của v9 (P2, P3), khoảng +160 USD một lần | Có | v9 P2 |
| BL83 | Tách Worker "jobs" (Hono, TypeScript thuần: cron, outbox, webhook SES) khỏi Worker "web" (Next.js qua vinext hoặc OpenNext) | Có | v9 S0 |
| BL84 | Làm P0 ngay trong tháng 11 xen kẽ chunk 6, 7: lấy lại `test/unit.js`, `.gitignore`, GitHub Actions, `AGENTS.md` dùng chung, 5R email | Có | P0 |
| BL70 | Dịch vụ email bên thứ ba cho bước 0 (5R, trước v9) để có hơn 1.500 thư mỗi ngày không chờ Workspace qua 60 ngày: (a) Resend Pro 20 USD, 50.000 thư mỗi tháng, không trần ngày; (b) Postmark; (c) Amazon SES | (a) | 5R |
| BL71 | Làm 5R khi nào: (a) ngay sau 5N, 5O, trước chunk 6 để go live đã có hạn mức rộng; (b) sau chunk 7 | (a) | 5R |
| BL72 | Đăng nhập v9: (a) Supabase Auth (link email hạn chung, ví dụ 15 phút; Google cho admin), bỏ hạn link theo vai trò của luật 36; (b) giữ bảng link tự viết như v8 | (a) | v9 S4 |
| BL73 | Repo v9: (a) repo GitHub riêng `thaiput_v9`, repo v8 giữ làm đặc tả và sửa lỗi tới khi đóng; (b) thư mục trong repo v8 | (a) | v9 S0 |
| BL74 | Ảnh chuyển khoản ở v9: (a) Supabase Storage bucket riêng tư; (b) giữ Google Drive | (a) | v9 S1 |
| BL75 | Số đo tốc độ ở v9: (a) bỏ bảng METRICS, dùng Sentry và Vercel; (b) giữ bảng để báo cáo riêng | (a) | v9 S11 |
| BL76 | Sao lưu v9: (a) sao lưu ngày của Supabase Pro + `pg_dump` đêm lên Drive; (b) thêm PITR (thêm phí) | (a) giai đoạn đầu | v9 S11 |
| BL77 | Nâng Claude lên Max trong các tháng xây v9 (16 tuần thay vì 20 đến 24) | Có, nếu muốn 16 tuần | v9 S0 |
| BL78 | Dòng "không thêm máy chủ ngoài" trong `CLAUDE.md`: (a) chỉ sửa trong `CLAUDE.md` của repo v9 khi vào S0, repo v8 giữ nguyên; (b) sửa ngay | (a) | v9 S0 |
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
| BL08 | Thiết kế đen trắng, có đổ bóng, đảo quyết định 19/10. Gửi lại ảnh tham chiếu nếu cần | Đổi theo yêu cầu 29/10 | 5O |
| BL09 | Email hiện bản phẳng ở Outlook và ứng dụng không hỗ trợ màu chuyển, đổ bóng | Chấp nhận | 5O |
| BL13 | Màu vàng "Vắng học viên": (a) bỏ; (b) giữ tới khi admin chọn "Đã xử lý" | (b) | 5N |

## B. Câu hỏi cũ chưa thấy trả lời

| Mã | Câu hỏi | Nguồn | Đề xuất |
|---|---|---|---|
| BL20 | Giám sát trang health: (A) Google Cloud; (B) UptimeRobot khoảng 9 đến 10 USD/tháng; (C) Better Stack; (D) chưa giám sát | mục `TU_VAN_GIAM_SAT_16_10.md` trong `archive/TU_VAN_VA_KIEN_TRUC.md` | B cho PRODUCTION |
| BL21 | "Vắng học viên" báo admin ngay bằng email (đổi NOTIFY_RULES, không cần code) hay giữ email tổng hợp 21 giờ | Trả lời 22/10 | Giữ tổng hợp |
| BL22 | Form đăng ký: viền đỏ đúng ô nhập sai | Soát giao diện 20/10 | Làm ở 5O |
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
* **Mới:**
  * Gmail API có trừ vào bộ đếm hạn mức của Apps Script không (đo ở 5J);
  * GmailApp (8.1.4) trừ cùng hạn mức: menu Kiểm tra gửi email, số "trước → sau" giảm 1;
  * thư GmailApp tới hộp thư cùng tên miền trường (lý do có MailFix);
  * chuyển chủ sở hữu file sang tài khoản ở tên miền khác (chỉ khi đổi tài khoản).
* **05/11:** `test/unit.js` (34 test hàm thuần và Db) không có trong repo GitHub; `test/harness.js` dòng 21 nạp `./unit` nên `npm test` và GitHub Actions đỏ. Lấy lại từ `TEST_BUNDLE.txt` của project claude.ai cũ rồi commit; làm trước 5R.

## Đã chốt

| Ngày | Mã | Kết quả |
|---|---|---|
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
