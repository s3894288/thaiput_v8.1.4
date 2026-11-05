# Hai tài liệu spec v7 đã được thay thế: bài đọc trước và bản CLAUDE.md cũ

*Tệp lưu trữ, gộp ngày 30/10/2026 trong đợt dọn dẹp bản 8.0.10. Gộp nguyên văn `v8/docs/00_DOC_TRUOC_GIAI_THICH.md` và `v8/docs/05_CLAUDE.md` (ngày 05/10/2026). Luật hiện hành nằm ở `v8/CLAUDE.md`. Các spec còn được code và CLAUDE.md dẫn tên (01, 02, 03, 04, 06) vẫn để nguyên ở `v8/docs/`.*

*Mỗi file gốc nằm giữa hai dòng `<!-- BEGIN FILE ... -->` và `<!-- END FILE ... -->`, kèm số byte và mã sha256 của file gốc để kiểm chứng. Nội dung giữa hai dòng đó là nguyên văn.*

## Mục lục

1. `v8/docs/00_DOC_TRUOC_GIAI_THICH.md`
2. `v8/docs/05_CLAUDE.md`

---

## `v8/docs/00_DOC_TRUOC_GIAI_THICH.md`

*Ngày tạo trong Project: 2026-10-29T14:40:52Z*

<!-- BEGIN FILE: v8/docs/00_DOC_TRUOC_GIAI_THICH.md | bytes=10483 | sha256=b7f46b2da3ae935df00d72d45bab6d400ff90bfb1bb9e9f3613e88ee68a11be8 | created=2026-10-29T14:40:52Z -->
# Thaiput v7 · Đọc trước: mình đã làm gì, vì sao, kiểm tra thế nào

*Cập nhật: 05/10/2026 · Bộ tài liệu chuẩn bị code v7, chưa có dòng code nào được viết*

## 1. Bộ này gồm những gì

| File | Nội dung | Anh dùng để |
|---|---|---|
| `00_DOC_TRUOC_GIAI_THICH.md` | File này | Hiểu tổng thể, biết đọc gì trước |
| `01_QUYET_DINH_50_CAU.md` | 50 quyết định nghiệp vụ theo cột Đề xuất, 5 chỗ điều chỉnh, quy định số điện thoại, khoá cấu hình | Gửi admin xác nhận; đối chiếu khi test |
| `02_PLAN_CODE.md` | Kiến trúc, dữ liệu, luật viết thành hàm, Calendar, số điện thoại, màn hình, bảo mật, 7 phase, prompt cho Claude Code | Đưa cho Claude Code làm theo |
| `03_KICH_BAN_TEST_40.md` | 40 kịch bản có dữ liệu mẫu, giờ giả lập, kết quả mong đợi | Claude chạy tự động; anh đọc báo cáo |
| `04_CHECKLIST.md` | Checklist chuẩn bị, test thật, go live, 7 ngày đầu, sổ tay sự cố | Anh tự tick từng mục |
| `05_CLAUDE.md` | Luật kỹ thuật bắt buộc | Đổi tên thành `CLAUDE.md`, đặt ở thư mục gốc repo |
| `06_HUONG_DAN_TEN_MIEN_WORKSPACE.md` | Mua tên miền, đăng ký Workspace, bản ghi DNS, xác thực email, gắn tên miền vào trang web | Làm theo từng bước trước khi code |

## 2. Bản cập nhật này đổi gì so với bản trước

Bản trước được viết theo hướng cắt chi phí tối đa (Gmail thường, chưa mua tên miền, nhắc lịch bằng Calendar). Theo yêu cầu mới của anh, bản này đổi 4 điểm:

| Yêu cầu mới | Thay đổi trong tài liệu | Nằm ở |
|---|---|---|
| Mặc định dùng Google Workspace, gỡ giới hạn email | Hệ thống chạy dưới `booking@<tên miền>`, giới hạn khoảng 1.500 người nhận/ngày thay vì khoảng 100. Bỏ mọi chỗ "tiết kiệm email". Thêm nhóm `admin@` miễn phí để anh và admin cùng nhận thông báo | 01 câu 36, 41, 49; 02 mục 1, 4.9; 05 luật 12, 19 |
| Thu số điện thoại +84 để nhắn Zalo hoặc gọi | Số điện thoại bắt buộc trong form; chuẩn hoá về `+84xxxxxxxxx`; chỉ nhận số di động Việt Nam; lưu dạng chữ. Nút "Nhắn Zalo admin", "Gọi admin" trong cổng học viên, cổng tutor và chân email. Admin bấm số học viên trong Sheets để mở Zalo hoặc gọi. Tutor vẫn không thấy số học viên | 01 câu 33, 42 và mục "Quy định về số điện thoại"; 02 mục 4.12; 03 A01, A02 |
| Mua tên miền, có hướng dẫn chi tiết | File mới 06: chọn đuôi, mua, bản ghi DNS, Workspace, SPF, DKIM, DMARC, gắn `www` vào Google Sites | 01 câu 38; file 06; checklist A |
| Liên kết Calendar và email đầy đủ | Lịch chung "Thaiput · Lịch học"; mỗi buổi là một sự kiện mời học viên và tutor, có Meet, tự cập nhật khi huỷ hoặc đổi tutor; admin xem toàn bộ lịch theo màu tutor. Nhắc trước 60 phút bằng **email** | 01 câu 41; 02 mục 4.11; 03 B16, C23, D27, E33 |

**Một điểm mình sửa so với bản trước, anh nên biết:** bản trước định nhắc học viên trước 1 giờ bằng nhắc lịch của sự kiện Calendar. Thực tế nhắc lịch đặt trên sự kiện chỉ hiện cho người tạo sự kiện (`booking@`), còn khách mời nhận nhắc theo cài đặt riêng của họ. Nên bản này chuyển sang hệ thống tự gửi email nhắc mỗi 15 phút quét một lần, chắc chắn tới tay học viên và tutor.

## 3. Trả lời 3 câu hỏi của anh

**Phương án nào cho anh thấy demo ngay?** Phase 1 trong plan: bản demo HTML bấm được với dữ liệu giả, khoảng 1 giờ sau khi bắt đầu code, mở được trên điện thoại. Chính file HTML này được giữ lại làm giao diện thật ở phase 3, nên không phí công.

**Apps Script kết hợp trang đăng ký và đặt lịch có tương thích database, dễ cho admin không?** Có. Trang web gọi thẳng các hàm Apps Script, Apps Script ghi vào Google Sheets; không có lớp trung gian nào phải đồng bộ. Admin làm mọi việc trên Sheets bằng ô dropdown và menu: duyệt đăng ký (xem ảnh chuyển khoản ngay trong dòng), duyệt tutor huỷ, huỷ hoặc đổi tutor, xem báo cáo tháng. Lịch học hiện thêm trên Google Calendar của admin.

**Wix hay Notion có khả thi không?**
1. **Notion: không.** Notion làm được trang giới thiệu và form thu thông tin, nhưng không có logic: không chặn 1 buổi/ngày, không hạn 15:00, không tự gán tutor, không đăng nhập theo vai trò.
2. **Wix: làm được một phần, nhưng không đáng.** Tính năng đặt lịch của Wix cần gói trả phí hằng tháng (gói Business, từ khoảng $29/tháng, tương đương khoảng 750k), không tự tạo link Google Meet. Các luật riêng như gán ngẫu nhiên trong nhóm ít buổi nhất, tutor huỷ cần duyệt, gói tính từ buổi đầu đều phải tự code bằng công cụ Velo của Wix. Nghĩa là vẫn phải code, lại tốn phí hằng tháng và dữ liệu bị khoá trong Wix.
3. Hai công cụ này phù hợp nếu sau này muốn một **trang giới thiệu đẹp**, bấm nút thì dẫn sang trang đăng ký của v7. Hiện Google Sites gắn tên miền riêng đã làm được việc này miễn phí.

## 4. Mình đã làm gì và vì sao

**Chọn kiến trúc: Apps Script phục vụ trang web, Google Sheets làm database, nhúng vào Google Sites có tên miền riêng, chạy dưới Workspace.**
Vì sao: giữ được phần lõi v6 đã chạy thật (email, khoá chống đặt trùng, giả lập thời gian), hạ tầng gần như 0đ ngoài Workspace và tên miền, admin vẫn dùng Sheets quen thuộc. Thay đổi lớn nhất là bỏ Google Form; tutor và học viên dùng trang web có đăng nhập, không còn quyền mở file Sheets nên không ai sửa nhầm dữ liệu.

**Áp cột Đề xuất cho 50 câu, điều chỉnh 5 câu (33, 38, 39, 41, 42).**
Vì sao: anh đưa yêu cầu mới sau khi bảng câu hỏi được viết. Năm dòng này được đánh dấu **[ĐIỀU CHỈNH]** trong file 01, kèm lý do.

**Bỏ khái niệm "tuần active" và tab lưới của tutor.**
Vì sao: lịch rảnh giờ lưu theo ngày cụ thể (bảng AVAILABILITY), nên không cần chuyển tuần mỗi Chủ nhật. Bỏ được cả một nhóm lỗi v6 từng gặp (rollover nhảy tuần, mất dấu "x" đầu tháng).

**Viết luật thành hàm thuần.**
Vì sao: hàm thuần nhận dữ liệu và trả kết quả, không phụ thuộc Google, nên Claude test 40 kịch bản trên máy trong vài giây, sửa rồi chạy lại liên tục trong một phiên 5 giờ.

**Đánh dấu 10 kịch bản "(thật)".**
Vì sao: bản v6.0 đạt 50/50 test giả lập nhưng vẫn lỗi khi chạy thật (hotfix v6.0.1). Các kịch bản dễ khác biệt nhất giữa giả lập và Google thật (email tới hộp thư, thư mời Calendar, vào phòng Meet, hai người bấm cùng lúc) được chạy lại trên STAGING theo checklist phần B.

**Viết sẵn CLAUDE.md.**
Vì sao: Claude Code đọc file này mỗi phiên, nên không quên các luật xương máu (ngày nửa đêm, tháng JS bắt đầu từ 0, timezone, `getNow_`, không nhận mã học viên từ trình duyệt, số điện thoại lưu dạng chữ, không lộ thông tin học viên trên sự kiện Calendar).

## 5. Anh kiểm tra bộ tài liệu thế nào (khoảng 30 phút)

1. Đọc file 01: 5 dòng [ĐIỀU CHỈNH], mục quy định số điện thoại, 3 điểm cuối file. Gửi admin xác nhận.
2. Đọc mục 0, 1, 4.11, 4.12, 6, 8 của file 02. Các mục còn lại dành cho Claude Code.
3. Đọc lướt nhóm B và C trong file 03. Kiểm tra vài phép tính ngày ở mục 6 dưới đây có hợp lý không.
4. Làm ngay file 06 và checklist phần A, vì Claude không tự mua tên miền, tạo tài khoản hay đăng nhập Google thay anh được.

## 6. Các phép tính ngày đã soát lại

| Kịch bản | Phép tính | Kết quả |
|---|---|---|
| B07 | Trial bắt đầu 14/10, 7 ngày tính cả ngày đầu | hết 20/10 |
| B11 | Gói 2 tuần bắt đầu 14/10, sau đó dời sang 16/10 | hết 27/10, rồi 29/10 |
| B13 | Gói 1 tháng nối tiếp từ 26/10 | hết 24/11 |
| B14 | Gói hết 30/10, tạm khoá từ 12/10 đến 15/10 (3 ngày) | hết 02/11 |
| B15 | Mua 10/10, quá 30 ngày chưa dùng | tự kích hoạt 09/11 |
| B15 | Gói hết 03/11, nhắc trước 3 ngày | gửi 31/10 |
| B16 | Buổi 14/10 19:00, nhắc trước 60 phút, job quét mỗi 15 phút | gửi ở lần quét 18:00 |
| C19 | Buổi 14/10, hạn đặt | trước 15:00 ngày 13/10 |
| E35 | Buổi 15/10 19:00, hạn admin duyệt 3 giờ trước | 16:00 ngày 15/10 |
| F39 | Buổi 14/10 kết thúc 19:30, tự hoàn thành sau 24 giờ | 19:30 ngày 15/10 |

## 7. Chi phí năm đầu theo phương án này

Tỷ giá giả định 26.000đ/USD.

| Khoản | Chi phí |
|---|---|
| Tên miền `.vn` (gồm VAT) | khoảng 495k |
| Google Workspace Business Starter, 1 người dùng | khoảng 1,03 triệu |
| Claude Max 20x, 1 tháng build (hoặc Max 5x: 2,6 triệu) | 5,2 triệu |
| Claude Pro khoảng 3 tháng bảo trì rải rác trong năm | khoảng 1,56 triệu |
| Hạ tầng còn lại (Apps Script, Sheets, Sites, Calendar, Meet, Group) | 0đ |
| **Tổng** | **khoảng 8,3 triệu** (hoặc khoảng 5,7 triệu nếu build bằng Max 5x) |

Từ năm 2, nếu không cần sửa nhiều: khoảng 1,5 triệu/năm cho tên miền và Workspace.

## 8. Việc tiếp theo

1. Làm file 06 mục 2 đến 5 và checklist phần A1 đến A9 (khoảng 1 giờ). DNS sẽ tự cập nhật trong lúc chờ.
2. Song song: mở Claude Code trong một thư mục mới, đặt 7 file này vào, đổi `05_CLAUDE.md` thành `CLAUDE.md`, dán prompt Phase 1 trong mục 9 của file 02. Khoảng 1 giờ sau anh có demo bấm được trên điện thoại.
3. Gửi Claude thông tin ở checklist A15 để bắt đầu phase 2.

<!-- END FILE: v8/docs/00_DOC_TRUOC_GIAI_THICH.md -->

---

## `v8/docs/05_CLAUDE.md`

*Ngày tạo trong Project: 2026-10-29T14:40:57Z*

<!-- BEGIN FILE: v8/docs/05_CLAUDE.md | bytes=4389 | sha256=685c27e86ec69d18a3af0fdf470322fc0d7dae8ae3afed024467860c50dca8f2 | created=2026-10-29T14:40:57Z -->
# CLAUDE.md · Luật kỹ thuật cho dự án Thaiput v7

Đặt file này ở thư mục gốc của repo với tên `CLAUDE.md`. Claude Code tự đọc file này mỗi phiên làm việc.

## Bối cảnh
Hệ thống đặt lịch học nói 1:1 của thaiput. Google Apps Script + Google Sheets làm database + web app HtmlService nhúng Google Sites dưới tên miền riêng. Chạy dưới tài khoản Google Workspace `booking@<tên miền>`. Spec đầy đủ: `02_PLAN_CODE.md`. Quyết định nghiệp vụ: `01_QUYET_DINH_50_CAU.md`. Kịch bản test: `03_KICH_BAN_TEST_40.md`. Tên miền và Workspace: `06_HUONG_DAN_TEN_MIEN_WORKSPACE.md`.

## Luật không được phá
1. Mọi "bây giờ" lấy từ `getNow_()`, không bao giờ dùng `new Date()` trực tiếp để lấy thời điểm hiện tại.
2. Mọi cột ngày trong Sheets lưu `new Date(y, m, d)` (nửa đêm). Ngày dùng để hiển thị hoặc so sánh khoảng dùng `makeNoon_` (12:00) để không lệch ngày theo timezone.
3. Tháng trong JavaScript bắt đầu từ 0: `new Date(2026, 9, 5)` là ngày 5 tháng **10**.
4. Timezone của project, của file Sheets và của lịch Calendar đều là `Asia/Ho_Chi_Minh`. `testSystem()` phải kiểm tra cả ba.
5. Đặt lịch, huỷ, duyệt yêu cầu huỷ, kích hoạt đăng ký đều chạy trong `LockService.getScriptLock()`, timeout 30 giây.
6. Mọi hàm server gọi từ trình duyệt phải bắt đầu bằng `requireRole_(token, role)`. Không bao giờ nhận `student_id` hoặc `tutor_id` từ trình duyệt; luôn lấy từ phiên.
7. Luật nghiệp vụ viết thành hàm thuần (nhận dữ liệu, trả kết quả) để test bằng Node không cần Google.
8. Không `return` im lặng khi thiếu dữ liệu bắt buộc; ném lỗi để admin nhận email lỗi.
9. "Completed" trong trang Executions chỉ có nghĩa là không có exception. Sau mỗi thay đổi, kiểm chứng bằng dữ liệu trong Sheets và trên lịch Calendar.
10. Không xoá dòng trong BOOKINGS, PAYMENTS, ACTIVITY_LOG. Muốn huỷ thì đổi trạng thái.
11. Mọi thay đổi trạng thái quan trọng ghi một dòng ACTIVITY_LOG với `actor`.
12. Gửi email theo lô: một lần đặt nhiều ngày chỉ gửi một email xác nhận cho học viên và một email cho mỗi tutor. Workspace cho khoảng 1.500 người nhận/ngày, nhưng vẫn tránh gửi trùng: email nhắc và email sắp hết hạn phải có cột đánh dấu đã gửi.
13. Tham số nghiệp vụ đọc từ tab CONFIG qua `cfg_(key)`, có giá trị mặc định trong `Config.gs`. Không viết cứng số 15, 30, 3, 24, 60 trong code luật.
14. Harness không được "tốt bụng" hơn Google thật: không tự tính lại giá trị mà Sheets thật không tự tính; mô phỏng đúng dạng dữ liệu Google trả về.
15. Không sửa kết quả mong đợi trong `03_KICH_BAN_TEST_40.md` để test qua. Kịch bản mâu thuẫn với file 01 thì dừng và hỏi.
16. Số điện thoại luôn đi qua `normalizePhoneVN_()` ở server, lưu dạng chữ `+84xxxxxxxxx`. Trước khi ghi, đặt định dạng ô là văn bản (`setNumberFormat('@')`), nếu không Sheets sẽ hiểu dấu cộng là công thức hoặc bỏ số 0.
17. Sự kiện Calendar luôn tạo trên `LESSON_CALENDAR_ID` (không tạo trên lịch chính của `booking@`), có khách mời học viên và tutor, `sendUpdates: 'all'` khi tạo, huỷ, đổi khách mời. Không dựa vào `reminders` của sự kiện để nhắc khách mời; nhắc bằng `reminderJob`.
18. Không ghi email hoặc số điện thoại học viên vào tiêu đề hoặc mô tả sự kiện Calendar, vì tutor xem được.
19. Email gửi qua `MailApp` với `name: cfg_('MAIL_FROM_NAME')` và `replyTo: cfg_('ADMIN_EMAIL')`.

## Quy ước làm việc
1. Mỗi phase kết thúc bằng file `PHASEx_GIAI_THICH.md`: làm gì, vì sao, file nào đổi, cách tự kiểm tra, rủi ro còn lại.
2. Chạy `node test/harness.js` trước khi đẩy code; không đẩy khi còn test đỏ.
3. Đẩy lên STAGING trước (`clasp push` vào project staging), chỉ đẩy PRODUCTION khi checklist phần B xanh.
4. Trả lời và viết tài liệu bằng tiếng Việt, tránh dùng dấu gạch nối.

<!-- END FILE: v8/docs/05_CLAUDE.md -->

---
