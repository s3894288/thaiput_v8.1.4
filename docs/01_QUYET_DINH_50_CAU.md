# Thaiput v7 · Bảng chốt 50 quyết định

*Cập nhật: 05/10/2026 · Nguồn: cột "Đề xuất" trong tài liệu "Thaiput 1:1 · Danh sách câu hỏi cần chốt", cộng các yêu cầu anh bổ sung sau đó*

> **TRẠNG THÁI: ĐÃ CHỐT ngày 05/10/2026, áp dụng cho bản code v8.** Mọi thay đổi sau ngày này phải ghi vào mục "Nhật ký thay đổi" cuối file và báo Claude chạy lại 40 kịch bản.

## Cách đọc file này

Mỗi dòng gồm: số câu, quyết định đã chốt, và **khoá cấu hình** tương ứng trong tab `CONFIG` của hệ thống v7. Khoá cấu hình nghĩa là admin đổi được giá trị trong Sheets mà **không cần sửa code**. Dòng ghi "luật cứng" là luật nằm trong code, muốn đổi phải nhờ Claude sửa.

Có 5 chỗ **điều chỉnh so với cột Đề xuất**, đánh dấu **[ĐIỀU CHỈNH]**, vì anh đã đưa yêu cầu mới sau khi bảng câu hỏi được viết:

1. Thanh toán hoàn toàn bên ngoài, admin kích hoạt sau khi xem ảnh chuyển khoản (câu 33, 39).
2. Dùng Google Workspace để bỏ giới hạn email, mua tên miền riêng (câu 38, 41).
3. Thu số điện thoại +84 để admin nhắn Zalo hoặc gọi khi có vấn đề (câu 42).

## 1. Gói học và thời hạn

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 1 | **[ĐỔI 01/11]** Gói bắt đầu tính từ **buổi học hoàn chỉnh đầu tiên** (Hoàn thành, Vắng học viên, Kỹ thuật lỗi học viên, Huỷ muộn). Trước đó ngày bắt đầu tạm tính theo buổi đặt sớm nhất. Đã khoá thì không đổi. Xem mục Thay đổi 01/11 | luật cứng |
| 2 | Thời hạn tính cả ngày đầu. Gói 30 ngày Active ngày 05/10 thì ngày cuối là 03/11 | `PKG_TRIAL_DAYS=7`, `PKG_2W_DAYS=14`, `PKG_1M_DAYS=30` |
| 3 | Gói chưa dùng (Inactive) quá 30 ngày kể từ ngày mua thì tự chuyển Active, tính từ ngày tự kích hoạt. **[ĐỔI 01/11]** Có buổi lỗi phía trường thì 30 ngày đếm từ ngày của buổi lỗi gần nhất | `INACTIVE_AUTO_ACTIVATE_DAYS=30` |
| 4 | Mọi gói, kể cả Trial, tối đa 1 buổi/ngày | `MAX_BOOKINGS_PER_DAY=1` |
| 5 | Mỗi email chỉ mua Trial 1 lần | `TRIAL_ONCE_PER_EMAIL=TRUE` |
| 6 | Mua gói mới khi gói cũ còn hạn: gói mới nối tiếp từ ngày sau khi gói cũ hết | luật cứng |
| 7 | Admin tạm khoá (Suspended) bao nhiêu ngày thì cộng bù bấy nhiêu ngày vào hạn gói. **[ĐỔI 01/11]** Gói không hết hạn trong lúc đang tạm khoá | luật cứng |
| 8 | Gói 2 tuần và 1 tháng không giới hạn tổng số buổi, chỉ áp luật 1 buổi/ngày | luật cứng |
| 9 | Bảng giá hiển thị trên trang đăng ký và trang gia hạn, lấy từ tab `PACKAGES` | tab `PACKAGES` |

## 2. Đặt lịch và huỷ của học viên

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 10 | Đặt buổi cho ngày D phải xong **trước 15:00 của ngày liền trước D**. Không có buổi đặt trong ngày | `BOOKING_CUTOFF_HOUR=15` |
| 11 | Chỉ đặt được những ngày tutor đã mở lịch | luật cứng |
| 12 | Từ 15:00 hôm trước trở đi không được huỷ; buổi đó vẫn tính là đã học (Trial bị trừ 1 buổi). **[ĐỔI 01/11]** Admin huỷ hộ từ 15:00 hôm trước: trạng thái Huỷ muộn (CANCELLED_LATE), trừ lượt, không cộng ngày, khoá ngày bắt đầu | `CANCEL_CUTOFF_HOUR=15` |
| 13 | Huỷ trước hạn rồi đặt lại ngày đó: được, nhưng lần đặt lại vẫn phải trước 15:00 hôm trước | luật cứng |
| 14 | Đổi giờ = huỷ rồi đặt lại, áp cùng các hạn trên | luật cứng |
| 15 | Đặt nhiều ngày một lần: ngày nào hợp lệ thì đặt, ngày nào lỗi thì báo riêng ngày đó | luật cứng |
| 16 | Học viên không chọn được tutor ở bản đầu | luật cứng |
| 17 | Slot 23:30 đến 00:00 tính vào ngày bắt đầu (ngày của 23:30) | luật cứng |

## 3. Tutor: lịch rảnh, huỷ, gán tutor

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 18 | **[ĐỔI 13/10]** Gán tutor: trong nhóm tutor ít buổi nhất tuần đó, **xoay vòng** (người lâu nhất chưa được giao buổi mới được chọn trước), thay cho chọn ngẫu nhiên | `ASSIGN_STRATEGY=ROUND_ROBIN_LEAST_LOADED` |
| 19 | Admin duyệt cho tutor huỷ mà không còn ai thay: booking thành "Huỷ bởi Tutor", hoàn buổi nếu là Trial hoặc gói cũ, email mời học viên đặt lại | luật cứng |
| 20 | Admin phải duyệt trước giờ học ít nhất 3 giờ; quá hạn thì yêu cầu tự bị từ chối, tutor vẫn phải dạy | `TUTOR_CANCEL_DECIDE_BEFORE_HOURS=3` |
| 21 | **[ĐỔI 01/11, 5J]** Nhắc tutor chưa mở giờ nào 15:00 thứ Sáu; hạn mở lịch 22:00 thứ Bảy cho tuần sau (sau hạn bớt giờ phải xin duyệt). Học viên không nhận email Chủ nhật: trang học viên hiện thông báo từ 00:00 thứ Bảy khi tuần sau đã có giờ trống | `TUTOR_REMIND_AT=FRI 15`, `TUTOR_DEADLINE_AT=SAT 22`, `STUDENT_WEEK_BANNER_FROM=SAT 00` |
| 22 | Sau hạn, tutor vẫn được **thêm** slot mà không cần duyệt; chỉ việc **bớt** slot mới cần duyệt | luật cứng |
| 23 | Không giới hạn số buổi/ngày của một tutor | luật cứng |
| 24 | Chưa ghép học viên theo trình độ | luật cứng |
| 25 | Lương tính theo buổi "Hoàn thành" và "Vắng học viên". **[ĐỔI 01/11]** Buổi "Vấn đề kỹ thuật" tính lương khi admin chọn lỗi học viên hoặc lỗi khách quan; lỗi tutor (mặc định) không. Huỷ muộn không tính lương tới khi chốt BL41 (thêm CANCELLED_LATE vào ô này) | `PAYROLL_STATUSES` |

## 4. Trạng thái buổi học, điểm danh, đánh giá

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 26 | Tutor chọn 1 trong 3 sau buổi: Hoàn thành / Vắng học viên / Vấn đề kỹ thuật. Thêm "Vấn đề kỹ thuật" vào danh sách trạng thái | luật cứng |
| 27 | **[ĐỔI 01/11]** "Vấn đề kỹ thuật" có 3 lỗi (cột `tech_fault`): lỗi tutor (mặc định) và lỗi khách quan không trừ lượt Trial, được bù ngày; lỗi học viên trừ lượt, không bù | `TECH_DECIDE_HOURS=48` |
| 28 | "Vắng tutor": ở bản đầu học viên báo admin qua Zalo hoặc điện thoại (nút có sẵn trong cổng học viên), admin đổi trạng thái thủ công; không trừ buổi học viên. Nút báo tự động làm ở giai đoạn 2. **[ĐỔI 01/11]** Chỉ chọn được sau giờ bắt đầu; ghi đè buổi đã có kết quả phải chọn lại lần hai trong 10 phút; học viên được bù ngày | luật cứng |
| 29 | **[ĐỔI 01/11, 5J]** Tutor không chọn kết quả sau 24 giờ kể từ giờ kết thúc: báo đỏ trên trang tutor và trang quản trị để admin nhắc. **Không** tự Hoàn thành. Sau 48 giờ kể từ giờ kết thúc và đã báo đủ 24 giờ: buổi thành "Không hoàn thành", không tính lương tutor. Với học viên, buổi vẫn tính là đã dùng (trừ lượt) nhưng **chưa khoá ngày bắt đầu** tới khi admin làm rõ (Vắng tutor nếu buổi không diễn ra; Hoàn thành, Vắng học viên hoặc Vấn đề kỹ thuật nếu đã học); học viên thấy nhãn "Trường đang kiểm tra". Đang bảo trì thì mốc báo đỏ dời theo, mở lại xong tutor còn đủ 24 giờ | `RESULT_NOTICE_AFTER_HOURS=24`, `RESULT_EXPIRE_AFTER_HOURS=48`, `RESULT_EXPIRE_AFTER_NOTICE_HOURS=24` |
| 30 | "Chờ xác nhận" chỉ dùng khi booking đang chờ admin gán lại tutor | luật cứng |
| 31 | Nút Rate (học viên đánh giá): **giai đoạn 2**, theo câu 46 | hoãn |

## 5. Tài khoản, đăng nhập, phân quyền

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 32 | **[ĐỔI 01/11, 5J]** Đăng nhập bằng link gửi qua email, bấm không giới hạn trong hạn link: học viên và tutor 15 phút, admin 24 giờ (admin đăng nhập Google là đường chính). Mỗi email xin link 1 lần mỗi giờ (admin gửi hộ bằng menu không bị giới hạn). Giữ đăng nhập 30 ngày; mỗi tab trình duyệt giữ phiên riêng. Thoát mọi thiết bị huỷ cả link còn hạn | `STUDENT_LINK_MINUTES=15`, `TUTOR_LINK_MINUTES=15`, `ADMIN_LINK_MINUTES=1440`, `*_LINK_MAX_USES=0`, `LOGIN_LINK_COOLDOWN_MINUTES=60`, `SESSION_DAYS=30` |
| 33 | **[ĐIỀU CHỈNH]** Học viên điền form đăng ký trên trang web: họ tên, email, **số điện thoại (không bắt buộc từ 13/10; không cần định dạng từ 01/11, 5K)**, level tự khai, gói, **ảnh chụp chuyển khoản**, ô đồng ý chính sách. Admin xem ảnh, chọn Duyệt thì hệ thống tự tạo tài khoản và gửi link đăng nhập. Lý do: anh yêu cầu admin tạo tài khoản sau khi xác nhận ảnh thanh toán | luật cứng |
| 34 | Level: học viên tự khai lúc đăng ký, admin sửa được trong Sheets. Tutor đề xuất level ở giai đoạn 2 | luật cứng |
| 35 | Tutor chỉ thấy tên, level, ghi chú của học viên; không thấy email và số điện thoại | luật cứng |
| 36 | 1 đến 2 admin, cùng quyền, làm việc trên Google Sheets bằng tài khoản Google của mình (được chia sẻ quyền chỉnh sửa). Email thông báo gửi về nhóm `admin@<tên miền>` (Google Group miễn phí) để cả hai cùng nhận | tab `USERS`, `ADMIN_EMAIL` |
| 37 | Học viên và admin dùng tiếng Việt; trang tutor và email gửi tutor bằng tiếng Anh | luật cứng |
| 38 | **[ĐIỀU CHỈNH]** **Mua tên miền riêng**, đề xuất `thaiput.vn` (dự phòng `thaiput.com` hoặc `thaiput.com.vn`). Tên miền dùng cho: Google Workspace (email `booking@`, `admin@`), trang web `www.` trên Google Sites. Hướng dẫn chi tiết ở file 06 | `SCHOOL_DOMAIN` |

## 6. Thông báo, thanh toán, gia hạn

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 39 | **[ĐIỀU CHỈNH]** Thanh toán hoàn toàn bên ngoài, không tích hợp cổng nào. Admin xác nhận bằng ảnh chụp màn hình rồi kích hoạt | luật cứng |
| 40 | Trang gia hạn hiển thị thông tin chuyển khoản kèm mã nội dung riêng của học viên (ví dụ `TP S0012 1M`), kèm ô tải ảnh chụp | tab `CONFIG`: thông tin ngân hàng |
| 41 | **[ĐIỀU CHỈNH]** Email gửi từ `booking@<tên miền>` qua **Google Workspace** (giới hạn khoảng 1.500 người nhận/ngày, dư nhiều lần nhu cầu). **Liên kết Calendar đầy đủ**: mỗi buổi học là một sự kiện trên lịch chung "Thaiput · Lịch học", mời học viên và tutor làm khách mời, có link Meet; đặt, huỷ, đổi tutor đều cập nhật sự kiện và Google tự gửi thư mời hoặc thư huỷ. **Nhắc trước buổi 60 phút bằng email** do hệ thống tự gửi (không phụ thuộc cài đặt lịch của từng người) | `REMINDER_BEFORE_MINUTES=60`, `LESSON_CALENDAR_ID` |
| 42 | **[ĐIỀU CHỈNH]** Không tích hợp Zalo API. Thay vào đó: thu số điện thoại +84 của học viên và tutor; cổng học viên và cổng tutor có nút **"Nhắn Zalo admin"** và link website (**bỏ nút "Gọi admin" từ 13/10**, trên web và trong email); trong Sheets, admin bấm vào số điện thoại Việt Nam của học viên để mở Zalo | `ADMIN_ZALO_URL`, `ADMIN_PHONE` |
| 43 | Popup và email hàng loạt: giai đoạn 2 | hoãn |

## 7. Vận hành, dữ liệu, phạm vi bản đầu

| # | Quyết định | Khoá cấu hình |
|---|---|---|
| 44 | Launch theo timeline gắt: demo trong 24 giờ, chạy thử kín, launch theo chu kỳ tutor nộp lịch Chủ nhật | không áp dụng |
| 45 | **[ĐỔI 01/11, 5L]** Bỏ hẳn gói LEGACY và công cụ chuyển dữ liệu v6 (không học viên nào còn gói cũ). Kiểu gói theo buổi (SESSIONS) vẫn giữ để admin tự tạo gói theo buổi (menu Thêm gói), vẫn áp luật 1 buổi/ngày | kiểu gói `SESSIONS` |
| 46 | Bản đầu gồm: đăng nhập, đặt và huỷ, tự gán tutor, Meet, Calendar và email, tutor nộp lịch và xác nhận buổi, admin kích hoạt, duyệt, sửa booking, **đếm buổi theo tutor và doanh thu theo tháng**, nút liên hệ Zalo và gọi. Để sau: Rate, popup, email hàng loạt, biểu đồ | không áp dụng |
| 47 | Chạy thử kín với 2 tutor và 3 đến 5 học viên thật, song song hệ thống v6 | không áp dụng |
| 48 | Quy mô 6 tháng tới: **chưa có số**. Bản v7 chịu được tới khoảng 10 tutor và 300 học viên đang hoạt động | câu hỏi mở |
| 49 | Toàn bộ dữ liệu, script, lịch và email nằm dưới **tài khoản Workspace `booking@<tên miền>`** của trường, không dùng tài khoản cá nhân. Tên miền đứng tên trường hoặc chủ trường | không áp dụng |
| 50 | Trang đăng ký có ô đồng ý xử lý dữ liệu cá nhân (gồm cả số điện thoại) và link trang chính sách | luật cứng |

## Quy định về số điện thoại (áp dụng câu 33, 42) **[ĐỔI 01/11, 5K]**

1. Không bắt buộc, không cần định dạng ở cả 3 chỗ: form đăng ký, học viên sửa hồ sơ, admin thêm tutor. Không bao giờ báo "số sai".
2. Số di động Việt Nam gõ kiểu nào cũng được (`0912 345 678`, `0912.345.678`, `+84 912 345 678`, `84912345678`, `912345678`) và được lưu một dạng `+84912345678`, có link Zalo trong Sheets.
3. Số nước ngoài có dấu + và mã nước lưu dạng `+<chữ số>`. Mọi thứ khác (số bàn, ghi chú như "Line: abc") lưu nguyên văn, tối đa 40 ký tự, không có link Zalo.
4. Lưu trong Sheets dưới dạng **chữ**, không phải số, để Sheets không làm mất dấu cộng hoặc biến thành công thức.

## Khoá vận hành bổ sung (không thuộc 50 câu)

| Khoá | Mặc định | Dùng để |
|---|---|---|
| `BOOKING_ENABLED` | TRUE | Tạm tắt đặt lịch khi có sự cố (xem sổ tay sự cố trong file 04) |
| `ENV` | STAGING | Chọn file dữ liệu: STAGING hoặc PRODUCTION (đặt trong Script Properties) |
| `SLOT_START` / `SLOT_LAST` | 08:00 / 23:30 | Khung giờ hoạt động theo brief, bước 30 phút, 32 slot mỗi ngày |
| `MAIL_FROM_NAME` | thaiput | Tên người gửi hiển thị trong email |
| `SCHOOL_SITE_URL` | https://www.thaiput.vn | Link trong email và nút quay lại trang chủ |

## Ba điểm anh nên xác nhận lại với admin

1. **Câu 38:** chọn tên miền. Tên miền `.vn` cần thông tin giấy tờ của người hoặc doanh nghiệp đứng tên (xem file 06), nên quyết định ai đứng tên trước khi mua.
2. **Câu 45:** học viên gói cũ cũng bị giới hạn 1 buổi/ngày. Hệ thống v6 hiện không có luật này.
3. **Câu 28:** bản đầu chưa có nút báo tutor vắng tự động; học viên bấm "Nhắn Zalo admin" để báo.


## Thay đổi ngày 13/10/2026 (chunk 5A, theo yêu cầu anh Chris)

1. Câu 18: chọn tutor xoay vòng thay cho ngẫu nhiên. Kịch bản C25 sửa theo.
2. Câu 32: link đăng nhập dùng nhiều lần trong 15 phút; xin link 3 lần mỗi 5 phút. Kịch bản A05, A06 sửa theo.
3. Câu 33: số điện thoại không bắt buộc, nhận số nước ngoài. Kịch bản A02 sửa theo.
4. Câu 42: bỏ nút gọi điện trên web và email, chỉ còn Zalo và website.
5. Nhiều admin ngang quyền: CONFIG `ADMIN_EMAIL` (nhiều địa chỉ, cách nhau dấu phẩy) cộng tài khoản role ADMIN trong USERS (menu Thêm admin). Mọi admin nhận cùng một email hệ thống.
6. Tutor xin huỷ slot đang có học viên và được duyệt: slot thành BLOCKED, không ai đặt được, tutor không tự mở lại; chỉ admin mở lại (đổi status trong tab AVAILABILITY).

## Thay đổi tối 13/10/2026 (chunk 5B và 5C, theo yêu cầu anh Chris)

7. Mục 5 ở trên thay bằng: email hệ thống chỉ gửi tới **một** địa chỉ là CONFIG `ADMIN_EMAIL` (hoặc nhóm `admin@` trên Workspace). Tài khoản role ADMIN trong USERS có quyền nhưng không nhận email. Admin dự phòng để DISABLED cho tới khi cần.
8. Thông báo admin theo mức (tab NOTIFY_RULES): huỷ buổi, lỗi kỹ thuật, lỗi hệ thống, đăng ký mới, tutor xin huỷ, tutor chưa nộp lịch: email ngay. Buổi hoàn thành, học viên vắng, đổi tutor: email tổng hợp lúc 21:00. Mọi sự kiện đều ghi tab NOTIFICATIONS, tô màu theo mức.
9. Mọi email gửi đi song ngữ (tiếng Việt trên, tiếng Anh dưới; email cho tutor tiếng Anh trên), nội dung sửa ở tab EMAIL_TEMPLATES. Mọi chữ trên web (kể cả câu báo lỗi) sửa ở tab CONTENT.
10. Đăng ký và thanh toán **giữ trên web như cũ** (thông tin chuyển khoản và tải ảnh). Không chuyển sang Zalo. Thêm nút Zalo nổi ở góc mọi trang.
11. Tutor xin huỷ slot đang có học viên: admin chọn 1 trong 4 (tự chọn tutor thay, chỉ định tutor thay, huỷ buổi, từ chối); kết quả ghi cột `outcome`.

## Thay đổi ngày 15/10/2026 (chunk 5D và 5E, theo yêu cầu anh Chris)

12. Mặc định Google Workspace Business Standard, một tài khoản duy nhất `admin@`: vừa chạy hệ thống, vừa là ADMIN_EMAIL. Chỉ có 2 admin là co-founder.
13. Bỏ email nhắc 8:00 sáng (MORNING_REMINDER_HOUR = -1). Nhắc trước 60 phút giữ nguyên.
14. Tutor và admin: link đăng nhập dùng 1 lần, phiên 90 ngày (tutor), email "Có đăng nhập mới", danh sách thiết bị và "Thoát mọi thiết bị", tutor xem số buổi tháng theo đúng luật lương. Học viên giữ như cũ.
15. Admin đăng nhập bằng tài khoản Google (thử nghiệm, dự án phụ "thaiput Google login"). Link email cho admin giữ làm dự phòng (ADMIN_LINK_LOGIN).
16. Giao diện admin trên web: thông báo, tutor, học viên, đặt thay (bỏ qua hạn đặt, giữ 1 buổi/ngày, slot khoá, trùng giờ), huỷ (buổi chưa bắt đầu), nhật ký, thoát mọi thiết bị của một người.
17. Menu "Xoá dữ liệu test": chỉ admin, 2 bước xác nhận, sao lưu trước; STAGING mặc định mở, PRODUCTION mặc định khoá và chỉ chủ file.

## Thay đổi ngày 01/11/2026 (chunk 5M, bản 8.1.0, theo quyết định anh Chris: BL40 a, BL42, BL46, BL47, BL48, Q1 đến Q8)

Luật đầy đủ và ví dụ: `plan/TU_VAN_BU_BUOI.md`. Kịch bản B19 đến B24 trong file 03.

18. **Ngày bắt đầu gói** (câu 1): tạm tính theo buổi đặt sớm nhất; khoá ở buổi học hoàn chỉnh đầu tiên, chỉ khi mọi buổi sớm hơn đã có kết quả cuối (buổi kỹ thuật: admin đã chọn lỗi, hoặc quá `TECH_DECIDE_HOURS`). Học viên tự huỷ đúng hạn trên web không khoá (giữ B11, B12). Khoá rồi không bao giờ đổi.
19. **Buổi lỗi phía trường:** Vắng tutor; tutor huỷ không có người thay (kể cả "Đổi tutor" mà không còn ai); admin huỷ trước 15:00 hôm trước; kỹ thuật lỗi tutor hoặc lỗi khách quan. Không trừ lượt. Sau khi khoá ngày bắt đầu: cộng `COMP_DAYS_PER_SESSION` (1) ngày mỗi buổi; Trial cộng `COMP_DAYS_TRIAL` (3) ngày **một lần**, trần `COMP_TRIAL_MAX_DAYS` (3). Cộng thêm phần để học viên còn kịp đặt theo luật 15:00 hôm trước (không bảo đảm có giờ trống). Trước khi khoá: ngày bắt đầu lùi, không cộng.
20. **Hạn gói** = ngày bắt đầu + số ngày gói + `suspended_days` + `comp_days` + `comp_days_admin` − 1.
21. **Gói vừa hết hạn** chưa quá `COMP_REOPEN_DAYS` (7) ngày, buổi được bù nằm trong hạn, gói sau chưa chạy: tự cộng và mở lại. Ngoài ra admin cộng tay (`comp_days_admin`), hệ thống báo COMP_ON_EXPIRED.
22. **Gói nối đuôi** dời theo gói trước; buổi rơi vào khoảng mới chuyển sang gói trước.
23. **Rút bù** (đổi lỗi kỹ thuật sang lỗi học viên): không rút khi học viên đã đặt vào ngày sắp bị rút; báo admin.
24. **Tab STUDENT_PACKAGES:** ô ngày bắt đầu và mọi ô hệ thống không sửa tay được (trả lại, ghi nhật ký, mỗi giờ tự lành). `end_date` và `comp_days_admin` chỉ email trong `PKG_EDITORS` (trống = ADMIN_EMAIL) sửa được; sửa hạn thì phần chênh vào `comp_days_admin`, học viên nhận email.
25. **"Đổi tutor"** chặn sau giờ bắt đầu buổi.

## Thay đổi ngày 01/11/2026 chiều (chunk 5J, bản 8.1.1, theo quyết định anh Chris)

26. **Câu 21:** nhắc tutor 15:00 thứ Sáu, hạn mở lịch 22:00 thứ Bảy, mốc chỉnh ở CONFIG dạng THỨ GIỜ, có kiểm hợp lệ (hạn phải trước 15:00 Chủ nhật, hạn đặt buổi thứ Hai). Bỏ 2 trigger Chủ nhật (còn 8 trigger, chạy lại menu 3). Học viên không nhận email Chủ nhật; trang học viên hiện thông báo "đã có giờ học tuần sau" từ 00:00 thứ Bảy tới 00:00 thứ Hai.
27. **Câu 29:** bỏ tự Hoàn thành; thay bằng báo đỏ sau 24 giờ và trạng thái mới NOT_COMPLETED (Không hoàn thành) sau 48 giờ, không tính lương. Admin có thêm 3 lựa chọn ở admin_action: "Hoàn thành (admin chọn)", "Vắng học viên (admin chọn)", "Vấn đề kỹ thuật (admin chọn)". Buổi Không hoàn thành không khoá ngày bắt đầu (soát 5J), hiện trong mục chờ kết quả của trang quản trị 14 ngày; báo cáo tháng thêm cột "Chờ tutor chọn kết quả". Kịch bản F39, B20 sửa theo (anh chốt 01/11).
28. **Câu 32:** link theo vai trò, bấm không giới hạn, admin 24 giờ; xin link 1 lần mỗi giờ mỗi email (thay 3 lần mỗi 5 phút). Kịch bản A06 sửa theo.
29. Kịch bản E31, E32 dời giờ theo hạn mới 22:00 thứ Bảy (luật không đổi: trước hạn tắt ngay, sau hạn chờ duyệt).

### Thay đổi ngày 01/11/2026 tối (chunk 5K, bản 8.1.2)

30. Số điện thoại: không cần định dạng (mục "Quy định về số điện thoại"). Kịch bản A02: 3 số trước đây bị chặn nay được lưu nguyên văn.
31. Gói có giá 0 không đăng ký được trên web, trang hiện nút Zalo admin (BL06 theo đề xuất).
32. Lưu trữ: nhật ký, email, thông báo, METRICS giữ 60 ngày (`LOG_KEEP_DAYS`); dòng email marketing không bao giờ chuyển.

### Thay đổi ngày 01/11/2026 tối (chunk 5L, bản 8.1.3)

33. Câu 45: bỏ LEGACY và chuyển dữ liệu v6; kịch bản dòng 29 file 03 dùng gói theo buổi PACK_12 (BL49 theo đề xuất).
34. Khoá tutor: buổi sắp tới tự đổi tutor, không ai thay thì huỷ kiểu lỗi tutor và học viên được bù (BL04 theo đề xuất a).
35. Mã gói trùng hoặc dòng gói sai: không nhận đăng ký gói đó tới khi admin sửa; menu 2 báo đỏ.
36. Chuyển hệ thống 4 bước (chuẩn bị ở hệ thống cũ, chạy thử, chép thật, tạo lại sự kiện); hệ thống mới chỉ đọc file cũ.
