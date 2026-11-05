# Kế hoạch sub chunk 5J đến 5Q (sau 8.0.10)

*Bản 01/11/2026 (lần 7). 5M, 5J, 5K, 5L đã xong (8.1.0, 8.1.1, 8.1.3 gồm 5K và 5L). Chỉ bắt đầu sub chunk nào khi anh ra lệnh đúng tên sub chunk đó. Câu hỏi chặn ở `BACKLOG.md`. Chi tiết luật bù: `plan/TU_VAN_BU_BUOI.md`. Lý do từng thiết kế: `plan/TRA_LOI_01_11.md`.*

## Thay đổi so với bản 01/11 lần 6

* 5K và 5L xong, giao chung bản 8.1.3, soát chéo 1 agent mỗi sub chunk (anh chốt 01/11 tối; 5P trở lại 2 agent).
* Lỗ hổng mục 4 đã sửa: 7, 8, 29, 30, 31, 32, 33, 34. Bước Chuyển hệ thống (5L) là nền cho go live chunk 6 (mục 5).
* Bản tiếp theo đánh số từ 8.1.4.

## Thay đổi so với bản 01/11 lần 5

* **Anh chốt 01/11 tối: chưa tách STAGING và PRODUCTION tới hết chunk 5.** Mọi bản 5K đến 5Q chỉ dán vào STAGING. Bỏ các bước "dán PRODUCTION" ở mục 0 việc 2 và mọi `PROGRESS.md` tới 5Q. Go live dời sang **chunk 6** (mục 5 mới). Thay cho cách go live trên 8.0.10 ở bản lần 3, lần 4.
* **Mọi mục chưa duyệt, chưa trả lời, chưa xử lý nằm ở `BACKLOG.md`**; anh rà một lượt ở **sub chunk cuối của chunk 5 (5Q)**. Coder nhắc ở đầu 5Q và ghi số mục còn chờ trong mỗi `PROGRESS.md`.
* Số phiên bản đã dùng: 5M là 8.1.0, 5J là 8.1.1. Các chunk sau đánh số tiếp từ 8.1.2 (bảng mục 1 giữ để tham khảo nội dung).
* Làm tiếp ở chat khác: mục 6 mới.

## Thay đổi so với bản 01/11 lần 4

* **Gửi email cố định chuyển xuống cuối danh sách: chunk 5Q** (anh chốt 01/11 05:35), làm sau mọi việc khác, trước v9. Phần A, A2, A3 của 5J cũ (MailTransport, kiểm thư tới nơi, phát hiện thư bị trả về BL51) dời nguyên sang 5Q.
* Tới 5Q: **giữ MailFix như đang chạy** (file MailFix riêng, tìm và thay sau mỗi lần dán Code.gs). Mỗi `PROGRESS.md` có mục MailFix bắt buộc. Hướng dẫn đầy đủ từ đầu: `HUONG_DAN_MAILFIX.md` (mới).
* **5J còn:** đăng nhập theo vai trò, admin Đăng nhập Google, lịch tutor, thông báo học viên trên web, thêm `gmail.send` cố định vào `src/appsscript.json`. Còn 3 cửa sổ.
* Go live 8.0.10: `HUONG_DAN_GO_LIVE_8010.md` lần 2 có thêm cách B (biến bản hiện tại thành PRODUCTION, tạo bản thử riêng) và dùng MailFix kiểu tìm và thay.

## Thay đổi so với bản 01/11 lần 3

* **Go live PRODUCTION ngay trên 8.0.10** kèm MailFix (`HUONG_DAN_GO_LIVE_8010.md`, file dán ở `v8/dist_golive/`). Từ đây mỗi chunk lên STAGING trước, PRODUCTION sau.
* BL10 chốt: Gmail API làm chính sau khi đo Delivered, kèm 6 việc kiểm thư tới nơi (5J mục A2). Thêm BL51 (tự phát hiện thư bị trả về).
* BL11: chưa có học viên thật; không cần bản thử riêng. Thêm BL52 (STAGING dùng chung tài khoản admin@).
* BL50: không đặt trần cả hệ thống.

## Thay đổi so với bản 01/11 lần 2

* Anh chốt BL40, BL42 (Trial bù ngày một lần, trần 3 ngày), BL46, BL47, BL48; BL41 để sau (không chặn, lương theo `PAYROLL_STATUSES`).
* 5J:
  * chống spam link **1 lần mỗi giờ mỗi email**;
  * **admin Đăng nhập Google ngay** (việc làm được hôm nay, xem `TRA_LOI_01_11.md` mục 3);
  * **bỏ email Chủ nhật cho học viên**, thay bằng thông báo trên trang học viên từ thứ Bảy.
* Tài liệu: mỗi chunk chỉ giao `PROGRESS.md`; hướng dẫn và chính sách xuất khi anh yêu cầu.
* Thêm mục 4: bảng mọi lỗ hổng đã tìm ra và chunk sửa.
* 5J giảm việc (bỏ email học viên); 5M chỉ còn chặn bởi BL11.

## Thay đổi so với bản 29/10

* **5J mở rộng**, ưu tiên làm trước:
  * gửi email qua một file riêng, cố định qua mọi bản;
  * bộ đếm hạn mức ở menu 2;
  * đăng nhập theo vai trò;
  * lịch nhắc tutor theo thứ và giờ, thông báo học viên Chủ nhật;
  * luật ghi "thay đổi so với bản trước" ở đầu mọi hướng dẫn.
* **5K:** lưu trữ 60 ngày cho mọi tab nhật ký, thông báo, METRICS, chạy hằng tuần.
* **5L:**
  * bỏ hẳn LEGACY và công cụ chuyển dữ liệu v6;
  * admin tự thêm gói;
  * menu **Chuyển hệ thống** (lên hệ thống mới, đổi tài khoản admin@), tự tạo mã gói còn thiếu.
* **5M** theo luật chốt 01/11:
  * ngày bắt đầu tạm tính rồi khoá;
  * +1 ngày, Trial +3, bảo đảm đặt được;
  * khoá ô ngày bắt đầu;
  * lỗi kỹ thuật 3 lựa chọn;
  * huỷ admin theo giờ;
  * gói hết hạn do admin cộng tay;
  * mẫu email và chữ web sửa được.
* Ước lượng tăng từ 16 đến 17 lên **khoảng 22 đến 24 cửa sổ** (sau soát chéo 01/11: 2 agent tìm 18 lỗ hổng mức CAO trong kế hoạch, đã đưa hết vào việc của từng chunk).
* Trước khi thực thi có thêm bước đồng bộ repo với project (mục 0, việc 6).

## 0. Luật làm việc cho mọi chunk

1. **Một file mỗi loại:** `Code.gs` và `Index.html` luôn một file cho tới khi anh ra lệnh khác (luật 44). Code viết ở `src/`, `node test/build_dist.js` gộp lại.
2. **Mỗi chunk là một sprint nhỏ,** có số phiên bản riêng. Tới hết chunk 5 chỉ dán vào STAGING, thử theo `PROGRESS.md` (anh chốt 01/11 tối). PRODUCTION làm ở chunk 6 (mục 5).
3. **Xong một chunk phải có đủ:**
   * harness xanh, test mới cho mọi thay đổi;
   * 2 agent độc lập soát chéo (máy chủ; giao diện và tài liệu), sửa hết rồi soát vòng 2;
   * thử phá code;
   * **`PROGRESS.md` là file tài liệu duy nhất giao mỗi chunk** (anh chốt 01/11): đã làm gì, vì sao, file đổi, kết quả test và soát chéo, việc anh cần làm trên Google, rủi ro còn lại;
   * gửi từng file riêng (Code.gs, Index.html, appsscript.json khi đổi quyền, PROGRESS.md), lưu project v8;
   * **mục "MailFix" bắt buộc trong `PROGRESS.md`** tới khi 5Q xong: Code.gs của bản là bản gốc; tìm `MailApp.sendEmail(` phải ra đúng N kết quả (bản 8.0.10 là 1; bản nào đổi chỗ gửi thư thì ghi số mới); trình tự tìm và thay, 3 lần kiểm, `testMailFix` (`HUONG_DAN_MAILFIX.md` mục 4, 5).
4. **Hướng dẫn và chính sách chỉ xuất khi anh yêu cầu:** 4 hướng dẫn (VAN_HANH, PHAT_HANH, THU_TAI, TRIEN_KHAI_WORKSPACE) và 2 chính sách.
   * Khi xuất: viết đủ mọi thay đổi tích luỹ từ lần xuất trước, mở đầu bằng mục "Thay đổi so với bản trước".
   * Hướng dẫn vận hành phủ mọi lựa chọn dropdown, mục menu, màu, email, màn hình web của 4 vai trò.
   * Trong lúc chưa xuất, `PROGRESS.md` ghi rõ "hướng dẫn chưa cập nhật mục X", để không ai làm theo hướng dẫn cũ.
5. **Ước lượng tính bằng "cửa sổ"** (một khung 5 giờ hạn mức), lấy từ các chunk 5F đến 5I. Chạm trần tuần thì dừng ở điểm an toàn (test xanh, ghi chú bàn giao).
6. **Trước lệnh thực thi đầu tiên:** chép về repo các file mà lần dọn project 30/10 đã sửa: `CLAUDE.md`, `README.md`, `PROGRESS.md`, `docs/02_PLAN_CODE.md`. Đặt `archive/` của project làm nguồn lịch sử. Không làm thì bản tiếp theo sẽ ghi đè các sửa đó.

## 1. Tổng quan sprint

| Sprint | Chunk | Phiên bản | Nội dung | Cửa sổ | Chặn bởi |
|---|---|---|---|---|---|
| 1 | 5J | 8.0.11 | Đăng nhập theo vai trò, chống spam link 1 lần mỗi giờ, admin Đăng nhập Google; lịch nhắc tutor; thông báo học viên trên web | 3 | |
| 2 | 5K | 8.0.12 | Nhật ký, lưu trữ 60 ngày, menu, AVAILABILITY, số điện thoại, gói giá 0, link rút gọn | 2 | BL02, BL03, BL05, BL06 |
| 3 | 5L | 8.0.13 | Khoá tutor; bỏ LEGACY và v6; thêm gói; Chuyển hệ thống, đổi tài khoản | 3 đến 4 | BL04 |
| 4 | 5M | 8.1.0 | Luật bù buổi, bù ngày, khoá ô ngày bắt đầu, lỗi kỹ thuật 3 lựa chọn, huỷ admin theo giờ, 4 lỗi đang có | 6 đến 7 | BL52 nên xong trước |
| 5 | 5N | 8.1.1 | Tô màu mới, "Đã xử lý", báo buổi kẹt | 1 | BL13 |
| 6 | 5O | 8.2.0 | Giao diện đen trắng, email HTML mới | 3 | BL08, BL09, BL22 |
| 7 | 5P | 8.2.1 | Soát tổng, thử tải lại; xuất hướng dẫn và chính sách song ngữ nếu anh yêu cầu | 2 | |
| 8 | **5Q** | 8.2.2 | **Gửi email cố định** (MailTransport, Gmail API, bộ đếm hạn mức, kiểm thư tới nơi, phát hiện thư bị trả về), bỏ MailFix tay. Cuối cùng, trước v9 | 3 | BL51, anh ra lệnh |

**Tổng 5J đến 5P khoảng 21 đến 23 cửa sổ; 5Q thêm khoảng 3.** Mỗi ngày 1 đến 2 cửa sổ và tuần không chạm trần thì 5J đến 5P xong khoảng đầu tháng 12. Thứ tự:
* đăng nhập, lịch tutor làm trước; email tạm ổn nhờ MailFix nên để cuối (5Q);
* rồi tới dọn dẹp và công cụ chuyển hệ thống;
* rồi luật nghiệp vụ lớn;
* phần nhìn làm cuối.

## 2. Chi tiết

### 5J · Đăng nhập, lịch tutor (8.0.11), ưu tiên số 1

**A. Email trong 5J:** chỉ thêm `https://www.googleapis.com/auth/gmail.send` cố định vào `src/appsscript.json`, để dán `appsscript.json` mới không bao giờ làm mất quyền của MailFix. Mọi việc gửi email cố định ở 5Q.

**B. Đăng nhập theo vai trò** (`TRA_LOI_01_11.md` mục 3)

1. 6 ô CONFIG mới (3 ô phiên đã có sẵn):
   * học viên và tutor: link 15 phút, bấm không giới hạn, phiên 30 ngày;
   * admin: link 24 giờ, bấm không giới hạn, phiên 30 ngày.
2. Chép giá trị cũ an toàn:
   * `cfg_` đọc ô cũ khi ô mới chưa có;
   * menu 1 chép ô cũ trước bước thêm ô mặc định.
3. Đổi hạn link theo vai trò ở mọi nơi tạo link: Registration.gs, Admin.gs, LoadTest.gs, Auth.gs. Câu "dùng được trong N" ghi theo giờ khi trên 60 phút.
4. **Thoát mọi phiên huỷ cả link còn hạn**, kể cả khi khoá tài khoản.
5. **Chống spam link (anh chốt):** mỗi email xin link **1 lần mỗi giờ**, mọi vai trò.
   * `LOGIN_LINK_COOLDOWN_MINUTES = 60` thay 2 ô cũ;
   * đếm trong bộ đệm (luật 37);
   * câu báo giống nhau cho email có và không có tài khoản;
   * admin gửi hộ bằng menu không bị giới hạn;
   * không đặt trần cho cả hệ thống (BL50).
6. **Admin Đăng nhập Google làm đường chính:**
   * nút Google lên đầu trang đăng nhập;
   * ô `ADMIN_LINK_LOGIN` bật hoặc tắt link email 24 giờ dự phòng;
   * menu 2 báo khi chưa cài xong.

   Việc cài dự án phụ anh làm được **ngay hôm nay** với 8.0.10 (7 bước ở `TRA_LOI_01_11.md` mục 3). Không làm mật khẩu.
7. Sửa luật 36 trong CLAUDE.md.

**C. Lịch tutor và thông báo học viên** (`TRA_LOI_01_11.md` mục 4)

1. Ô CONFIG dạng thứ giờ:
   * `TUTOR_REMIND_AT = FRI 15`;
   * `TUTOR_DEADLINE_AT = SAT 22`;
   * `STUDENT_WEEK_BANNER_FROM = SAT 00`.

   Có kiểm hợp lệ.
2. Viết lại `tutorWeekDeadline_` theo hạn mới. Đổi theo mọi chỗ dùng hạn:
   * duyệt bớt giờ;
   * thông báo "tutor chưa mở lịch";
   * chữ trên trang tutor;
   * mẫu `TUTOR_REMIND`.
3. Bỏ 2 trigger `sundayRemind`, chuyển việc nhắc vào hourlyJob.
   * Giữ hàm `sundayRemind` rỗng và giữ tên trong danh sách trigger cần xoá.
   * `TRIGGER_COUNT_` 10 thành 8; sửa test đếm trigger (unit.js, integration.js); hướng dẫn phát hành ghi phải chạy menu 3.
   * Đánh dấu đã làm theo tuần, có làm bù khi lượt chạy bị lỡ.
   * Gửi thư **sau khi nhả khoá**, có giới hạn thời gian, phần còn lại gửi ở lượt sau.
   * Kiểm hợp lệ: hạn tutor phải trước hạn đặt buổi thứ Hai (15:00 Chủ nhật).
   * Bỏ chữ "Chủ nhật" viết cứng trong Notify.gs (trái luật 32); sửa mẫu `TUTOR_REMIND` (đang ghi "hôm nay").
4. **Thông báo trên trang học viên** (anh chốt: không email):
   * hiện từ 00:00 thứ Bảy, khi tuần sau đã có ít nhất một giờ còn đặt được (ngay khi tutor đầu tiên mở giờ thành công); hết lúc 00:00 thứ Hai;
   * chỉ học viên có gói còn hạn tuần sau hoặc gói chưa kích hoạt;
   * chữ trong CONTENT, 2 thứ tiếng, ghi rõ "buổi thứ Hai phải đặt trước 15:00 Chủ nhật", nút sang Đặt lịch, nút "Đã xem";
   * dùng lại danh sách giờ trong bộ đệm, không đọc thêm Sheets.
5. Sửa câu 21 file 01 (ghi thay đổi), chính sách tutor bỏ chữ "[chờ code 5J]".

**D. Quy ước tài liệu** (CLAUDE.md, sửa quy ước 1): mỗi chunk giao `PROGRESS.md`; hướng dẫn, chính sách chỉ xuất khi anh yêu cầu, mở đầu bằng mục "Thay đổi so với bản trước".

**Test mới:**
* đăng nhập: link tutor bấm lần 2 trong 15 phút vẫn vào; link admin hết hạn sau 24 giờ; xin link lần 2 trong 60 phút bị từ chối với câu báo giống email không có tài khoản; admin gửi hộ vẫn được; thoát mọi phiên làm link cũ hết hiệu lực;
* lịch thứ giờ: hạn thứ Bảy 22:00, tutor bớt giờ lúc 22:01 phải xin duyệt;
* nhắc thứ Sáu 15:00 chỉ gửi tutor chưa mở giờ;
* thông báo trên web: thứ Sáu chưa hiện; thứ Bảy chưa có giờ trống thì chưa hiện; tutor mở giờ đầu tiên thì hiện; học viên hết gói không thấy; thứ Hai hết hiện;
* kịch bản file 03 liên quan câu 21 chạy lại (đổi kết quả mong đợi phải anh duyệt, luật 15).

**Anh kiểm trên bản thử:**
* dán `appsscript.json` lần đầu, cấp quyền;
* menu Kiểm tra gửi email: Email log search báo Delivered;
* menu 2 xem bảng hạn mức;
* menu 3 tạo lại trigger;
* bấm link tutor 2 lần;
* đăng nhập admin bằng Google;
* thứ Bảy mở trang học viên xem thông báo.

### 5K · Vận hành gọn (8.0.12)

1. **Nhật ký:**
   * bỏ ghi `LANG_SET` (sửa test I97, I106);
   * bỏ loại "xem trang" theo BL02.
2. **Lưu trữ** (`TRA_LOI_01_11.md` mục 5):
   * `LOG_KEEP_DAYS = 60` cho ACTIVITY_LOG, MAIL_LOG, NOTIFICATIONS, METRICS (lưu trữ đã chạy hằng ngày; bỏ mốc chờ 7 ngày);
   * **chuyển nhiều lô mỗi lượt tới khi hết**, chỉ đánh dấu xong khi hết dòng (hiện mỗi lượt 3.000 dòng mà vẫn đánh dấu xong);
   * giữ thông báo Khẩn, Cần xử lý chưa đọc (đã có); **giữ dòng MAIL_LOG loại `MKT:`** (sổ chống gửi trùng marketing);
   * METRICS chuyển lưu trữ thay vì xoá 90 ngày; sửa mốc báo cáo email, luật 10, 46;
   * tên file `THAIPUT · Lưu trữ · <môi trường> · <năm>`, tab `DOC_TRUOC`;
   * mô tả file trỏ tới `HUONG_DAN_VAN_HANH.md` (đang trỏ `CHUNK5G_GIAI_THICH.md`, nay nằm trong `archive/GIAI_THICH_CHUNKS.md`);
   * menu "Lưu trữ: mở file".
3. **Menu**, giữ tiếng Việt:
   * gom nhóm: Người dùng, Báo cáo, Email, Cập nhật phiên bản, Chuyển hệ thống, Lưu trữ, Công cụ kỹ thuật, Test (chỉ bản thử);
   * bỏ "Chuyển dữ liệu từ v6";
   * "Xem link trang web" hiện 4 link rút gọn (BL03);
   * các mục khác không xoá, chỉ gom (BL05).
4. **AVAILABILITY:** bỏ "Duyệt" khỏi danh sách. Ô cũ vẫn hiểu như "Duyệt, tự chọn tutor thay".
5. **Số điện thoại** không bắt buộc, không cần định dạng ở 3 chỗ: form đăng ký, học viên sửa hồ sơ, admin thêm tutor. Lưu nguyên văn dạng chữ; sửa luật 16.
6. **Gói giá 0:** nút Zalo tới `ADMIN_ZALO_URL` (BL06).

### 5L · Tutor, gói, chuyển hệ thống (8.0.13)

1. **Khoá, mở khoá tutor** (menu, dòng đang chọn):
   * khoá: thoát phiên, đóng giờ rảnh tương lai, xử lý buổi sắp tới theo BL04 (xem trước, hỏi lại 2 lần);
   * ghi nhật ký `TUTOR_DISABLED`, `TUTOR_ENABLED`.
2. **Bỏ hẳn LEGACY** (danh sách đầy đủ ở `TRA_LOI_01_11.md` mục 7):
   * gỡ khỏi gói mặc định;
   * xoá Migration.gs (v6), menu và test v6; dữ liệu mẫu S004 đổi mã gói, không xoá; giữ key `ad.act.MIGRATED_FROM_V6`;
   * dòng 29 file 03 sửa khi anh duyệt BL49;
   * menu 1 xoá dòng LEGACY khi không còn gói học viên nào mang mã đó, ghi `PACKAGE_REMOVED`.

   Giữ kiểu gói SESSIONS cho gói admin tạo sau này.
3. **Mã gói trùng:**
   * menu 2 báo đỏ và chỉ dòng đang có hiệu lực (phần đặt lịch dùng **dòng cuối**, menu 1 dùng **dòng đầu**);
   * chặn đăng ký gói có mã trùng;
   * ở file của anh, xoá dòng 4 PASS_1M ("Dòng này lỗi") là đúng.
4. **Admin thêm gói:**
   * menu "Thêm gói", có kiểm hợp lệ;
   * menu 2 kiểm mọi dòng PACKAGES;
   * gói Trial tự tạo thiếu `sessions_total` thì báo, vì khi đó không còn giới hạn buổi.
5. **Chuyển hệ thống** (`TRA_LOI_01_11.md` mục 6):
   * tab `META` ghi số phiên bản và mốc mã tự sinh (hiện nằm trong Script Properties, dự án khác không đọc được);
   * menu **"Chuẩn bị chuyển"** chạy trên hệ thống cũ: đóng cổng, gỡ sự kiện Calendar (bước A), xoá trigger, ghi META;
   * menu **"Chuyển hệ thống"** chạy trên hệ thống mới, chỉ đọc file cũ: nối, chạy thử, chạy thật (ghép cột theo tên, chép theo mã, chạy tiếp từng tab, tự tạo mã gói thiếu đặt "không bán"), đếm lại;
   * đóng hệ thống cũ, trang báo link mới.

   Kèm quy trình **đổi tài khoản admin@** trong Hướng dẫn phát hành. Dùng lại menu "Chuyển sang tài khoản mới" cho Calendar.
6. **Cập nhật phiên bản:** sao lưu, chạy thử, chạy thật các bước chuyển dữ liệu có mã, mỗi bước chạy đúng một lần.
7. **Test:**
   * khoá tutor;
   * mã trùng;
   * thêm gói;
   * chép sang hệ thống mới rồi đếm lại;
   * chạy chép lần 2 không nhân đôi;
   * mã gói thiếu tự tạo;
   * mã tự sinh không cấp lại số cũ.

### 5M · Luật bù buổi, bù ngày (8.1.0), chunk lớn nhất

Luật đầy đủ: `plan/TU_VAN_BU_BUOI.md`. Chia 5 bước, test xanh mới sang bước sau:

| Bước | Việc | Test |
|---|---|---|
| 5M1 | Hàm thuần: ngày bắt đầu tạm tính và khoá (`start_locked_at`, `start_booking_id`, `start_date_locked`, chờ buổi sớm hơn có kết quả); `comp_days` mỗi buổi với ngày đặt được đầu tiên F; Trial +3 một lần, trần 3; `tech_fault`; CANCELLED_LATE (trừ lượt, không cộng ngày); công thức hạn; dời gói nối đuôi | P01 đến P08 |
| 5M2 | Nối vào luồng thật: kết quả buổi, tự hoàn thành, vắng tutor (chỉ khi giờ học đã bắt đầu, hỏi lại khi ghi đè buổi đã có kết quả), huỷ admin theo giờ chọn ô, áp cả cho nút huỷ trên trang quản trị, đổi tutor (chặn sau giờ học); dropdown kỹ thuật 3 lựa chọn, `TECH_DECIDE_HOURS`, sửa nhánh `else`; lương và báo cáo đọc `tech_fault`; bước chuyển `payroll_override` cũ liệt kê từng buổi để admin chọn | I111, I112 |
| 5M3 | STUDENT_PACKAGES: bảo vệ kiểu cảnh báo, onEdit trả lại "Không thể chỉnh sửa", hourlyJob tự lành từ `start_date_locked`, báo xoá dòng; sửa `end_date` và `comp_days_admin` (`PKG_EDITORS`); chặn rút bù khi đã đặt vào ngày được cộng; tự mở lại trong 7 ngày (BL47); báo `TRIAL_LEFT_UNUSED`; admin cộng tay thì mở lại; `COMP_ON_EXPIRED`; sửa luật tự kích hoạt 30 ngày; sửa lỗi gói hết hạn trong lúc tạm khoá | I113, I114 |
| 5M4 | Mẫu email `COMP_EXTENDED`, `PACKAGE_DATES_CHANGED`; key chữ web (`TU_VAN_BU_BUOI.md` mục 7); trang học viên hiện ngày bù và "gói bắt đầu từ buổi hoàn chỉnh đầu tiên"; thông báo admin | I115, test giao diện U45 |
| 5M5 | Sửa file 01 (câu 1, 12, 27 và các câu mới, ghi ngày đổi); thêm kịch bản B19 đến B24 vào file 03 sau khi anh duyệt BL40; chạy lại 40 kịch bản; cập nhật 2 file chính sách | 40 kịch bản |

**Bắt buộc:**
* chạy trên bản thử riêng trước (BL11);
* trước khi dán vào bản đang chạy, bước "chạy thử" của menu Cập nhật phiên bản liệt kê **mọi gói sẽ đổi ngày** (ngày bắt đầu khoá theo luật mới, hạn mới) để anh duyệt;
* gói đang chạy được tính lại theo luật mới đúng một lần, có nhật ký.

### 5N · Tô màu Sheets (8.1.1)

1. Vùng tô màu phủ cả cột tới hết tab.
2. Cột `admin_done_at` ghi khi một `admin_action` chạy thành công, kể cả lựa chọn mới "Đã xử lý (giữ nguyên)".
3. **BOOKINGS:**
   * hồng: Kỹ thuật chưa xử lý;
   * vàng: Vắng học viên chưa xem (BL13);
   * cam đậm: PENDING_REASSIGN (luôn hiện);
   * xanh dương nhạt: buổi được bù;
   * xám: huỷ muộn (CANCELLED_LATE).
4. **STUDENT_PACKAGES:**
   * xanh dương: có ngày bù;
   * tím: admin đã cộng tay;
   * vàng: còn 3 ngày;
   * xám: hết hạn;
   * đỏ: gói hết hạn đang chờ admin cộng tay.
5. hourlyJob báo buổi kẹt PENDING_REASSIGN quá 1 giờ.
6. Bảng "màu nghĩa là gì, làm gì để hết màu" trong Hướng dẫn vận hành.

### 5O · Giao diện đen trắng và email (8.2.0)

Giữ như bản 29/10:
* **Màu:** chính là đen trắng; phụ là xanh lá, tím, vàng, xanh dương dạng phấn.
* **Khối:** bo góc, nền chuyển xám sang trắng, đổ bóng thay viền.
* **Phạm vi:** chỉ `Styles.html` và token màu.
* **Email:** khung `emailWrap_` viết lại theo thiết kế mới; ứng dụng không hỗ trợ thì hiện bản phẳng.
* **Form:** viền đỏ đúng ô nhập sai.
* **Kiểm:**
  * ảnh 4 cỡ màn hình;
  * gửi thử mọi mẫu email tới Gmail web, Gmail điện thoại, Outlook.

### 5P · Hợp nhất và chốt v8 (8.2.1)

1. Đề xuất anh yêu cầu xuất ở đây: đúng 4 hướng dẫn và 2 chính sách (tiếng Việt và tiếng Anh), mỗi file có mục "Thay đổi so với bản trước". Hướng dẫn phải xong trước chunk 6 (nghiệm thu đi theo Hướng dẫn vận hành).
2. Soát tổng bằng 2 agent, chạy lại 40 kịch bản, thử phá, thử tải lại.
3. Cập nhật `PROGRESS.md`, `BACKLOG.md`, project, gửi từng file.

### 5Q · Gửi email cố định (8.2.2), làm cuối cùng, trước v9

Anh chốt 01/11: tạm gác, giữ MailFix tới đây. BL10: Gmail API làm chính, kiểm thật kỹ để thư gửi từ Apps Script tới người dùng không bị trả về. Thiết kế: `TRA_LOI_01_11.md` mục 2. Nội dung chuyển nguyên từ 5J bản lần 4:

**A. Gửi email cố định qua mọi bản** (thiết kế ở `TRA_LOI_01_11.md` mục 2)

0. **Điểm xuất phát:** PRODUCTION đã chạy MailFix (GmailApp) từ bản go live. 5Q đưa MailFix vào `src/` và thêm đường Gmail API; **GMAILAPP giữ làm mặc định** cho tới khi Gmail API qua đủ bước A2 trên cả STAGING lẫn PRODUCTION, rồi mới đổi ô CONFIG.

   **Nói thẳng:** không hệ thống nào bảo đảm 0 thư bị trả về. Địa chỉ gõ sai, hộp thư đầy, máy chủ người nhận chặn vẫn trả thư về. Thứ làm được: (1) đường gửi không bị trả về **hàng loạt** như MailApp đã bị; (2) **phát hiện** từng thư bị trả về và báo admin.
1. File mới `src/MailTransport.gs`: chỗ duy nhất gọi dịch vụ gửi thư **và đọc hạn mức** (`mailBudget_()`). Ô CONFIG `MAIL_TRANSPORT` = `GMAILAPP` (đang chạy từ go live), `GMAIL_API` (đích, sau A2) hoặc `MAILAPP` (dự phòng). Quyền giữ `gmail.send` như bản go live; thêm `https://mail.google.com/` chỉ khi bước kiểm thư của hướng dẫn go live hoặc `HUONG_DAN_MAILFIX.md` mục 5.1 đã phải thêm.
   * Chế độ GMAILAPP (nếu giữ) chép đúng logic MailFix đang chạy (chat ngày 22/10).
   * Chế độ GMAIL_API tự dựng thư MIME:
     * tiêu đề và tên người gửi có dấu mã hoá đúng chuẩn, bỏ ký tự xuống dòng (chống chèn tiêu đề);
     * HTML kèm bản chữ thuần;
     * nhiều người nhận;
     * bỏ "trả lời tới" khi trống;
     * chờ rồi thử lại khi Gmail báo gửi quá nhanh.
   * 6 chỗ đang đọc hạn mức bằng MailApp chuyển sang `mailBudget_()`: Notify.gs (2), Marketing.gs (2), Metrics.gs, Setup.gs.
2. `sendMail_` (Notify.gs) gọi `MailTransport`. Lỗi gửi vẫn ghi `MAIL_FAILED`, không đổi kết quả API (luật 27, 39).
3. `src/appsscript.json` chốt một lần:
   * dịch vụ nâng cao Gmail và quyền `gmail.send`;
   * giữ `script.send_mail`.

   Giữ đúng quyền mà PRODUCTION đang chạy được sau go live.
4. Test quét `src/`: lời gọi gửi thư hoặc đọc hạn mức nằm ngoài MailTransport.gs thì đỏ.
5. Bộ giả lập thêm GmailApp và Gmail API, giải mã thư thô vào danh sách thư đã gửi, để test cũ không xanh giả. Không giả định cách Google đếm hạn mức (luật 14). MAIL_LOG thêm cột đường gửi (`optional`). Bộ đếm 24 giờ giữ trong bộ đệm.
6. Menu 2:
   * bảng hạn mức 5 dòng (`TRA_LOI_01_11.md` mục 2), ô `MAIL_DAILY_CAP`;
   * so tài khoản đang gửi, chủ file và ADMIN_EMAIL; khác nhau thì báo đỏ (trigger chạy dưới chủ file, trang web chạy dưới người triển khai);
   * menu Kiểm tra gửi email hiện bảng này thay cho số "trước, sau" của MailApp.
7. Cập nhật luật 19 (CLAUDE.md), phần đầu Notify.gs, dòng đầu Code.gs trong `test/build_dist.js`.

**A2. Kiểm thư tới nơi (BL10 "phải thật kỹ"), làm trên STAGING rồi PRODUCTION mỗi lần đổi đường gửi:**
1. Gửi thử tới 5 loại hộp thư: Gmail, Outlook hoặc Hotmail, Yahoo, một địa chỉ cùng tên miền trường, một địa chỉ Workspace của tổ chức khác (nếu có).
2. Email log search: tất cả Delivered.
3. Ở Gmail nhận được: **Hiện bản gốc**, phải thấy SPF, DKIM, DMARC đều **PASS**.
4. Admin console: DKIM đang bật cho tên miền (Gmail, Xác thực email); bản ghi SPF, DMARC đúng như bảng DNS trong `HUONG_DAN_TRIEN_KHAI_WORKSPACE.md` mục 8.
5. Nội dung: mọi thư có bản chữ thuần, không dùng link rút gọn của bên thứ ba, link trỏ đúng tên miền hoặc link `/exec`.
6. Bất kỳ bước nào trượt: giữ đường gửi cũ, không đổi CONFIG, ghi vào `PROGRESS.md`.

**A3. Phát hiện thư bị trả về (BL51):** với quyền chỉ gửi, hệ thống **không đọc được** thư báo lỗi trong hộp thư admin@. Hai cách:
* (a) thêm quyền đọc thư (`gmail.readonly`): job mỗi ngày tìm thư báo lỗi gửi (mailer daemon), khớp với MAIL_LOG, đánh dấu "bị trả về", báo admin tên người nhận để sửa email;
* (b) không thêm quyền: hướng dẫn admin xem Email log search mỗi tuần.

Đề xuất (a): đây là hộp thư riêng của hệ thống, và mục tiêu số 1 là biết thư không tới.

**Thêm khi làm 5Q:**
* MailFix tay bị bỏ: bản giao ghi rõ xoá file MailFix và bỏ bước tìm và thay;
* chỉ giao cho PRODUCTION khi STAGING đã chạy Gmail API ít nhất 3 ngày không có thư Bounced.

## 3. Câu trả lời đi kèm

* `plan/TRA_LOI_29_10.md`: hạn mức Gmail, "Duyệt" ở AVAILABILITY, lượt xem trang.
* `plan/TRA_LOI_01_11.md`:
  * "−1";
  * email cố định qua mọi bản và bộ đếm;
  * đăng nhập và mật khẩu admin;
  * lịch tutor;
  * lưu trữ;
  * chuyển hệ thống;
  * gói học.

## 4. Mọi lỗ hổng đã tìm ra và chunk sửa

| # | Lỗ hổng | Nguồn | Sửa ở |
|---|---|---|---|
| 1 | Nhánh cuối `handleAdminEdit_`: thêm "Không tính lương" sẽ trả lương | Chuyên gia B 29/10 | 5M2 |
| 2 | "Vắng tutor" chọn được cho buổi chưa diễn ra, ghi đè buổi đã có kết quả, không gỡ Calendar | Chuyên gia A 29/10, soát 01/11 | 5M2 |
| 3 | "Tính lương" không tính lại gói | B 29/10 | 5M2 |
| 4 | "Huỷ bởi admin" sau 15:00 không trừ lượt (trái câu 12) | A 29/10 | 5M2 |
| 5 | Dời hạn không xoá `expiry_notice_at` | A 29/10 | 5M3 |
| 6 | Buổi kẹt PENDING_REASSIGN không ai báo | 22/10 | 5N |
| 7 | Mã gói trùng: đặt lịch đọc dòng cuối, menu 1 đọc dòng đầu | Soát 29/10 | 5L |
| 8 | Số điện thoại vẫn báo lỗi ở hồ sơ học viên và thêm tutor | Soát 29/10 | 5K |
| 9 | Khoá ngày bắt đầu theo thứ tự tutor bấm, không theo ngày học | Soát nghiệp vụ 01/11 | 5M1 |
| 10 | Đổi lỗi kỹ thuật sau khi khoá làm Trial vượt 2 lượt | Soát nghiệp vụ 01/11 | 5M1, 5M3 |
| 11 | Rút bù khi học viên đã đặt vào ngày được cộng | Soát nghiệp vụ 01/11 | 5M3 |
| 12 | Kết quả bù phụ thuộc giờ admin bấm khi gói vừa hết hạn | Soát nghiệp vụ 01/11 | 5M3 (BL47) |
| 13 | Tự kích hoạt 30 ngày dù mọi buổi bị lỗi phía trường | Soát nghiệp vụ 01/11 | 5M3 |
| 14 | Gói hết hạn trong lúc học viên tạm khoá, mất ngày | Soát nghiệp vụ 01/11 (lỗi đang có) | 5M3 |
| 15 | "Đổi tutor" chạy với buổi đã qua giờ | Soát nghiệp vụ 01/11 (lỗi đang có) | 5M2 |
| 16 | Tự lành ngày bắt đầu suy từ buổi có thể bị sửa, lưu trữ | Soát nghiệp vụ 01/11 | 5M1, 5M3 |
| 17 | Chuyển `payroll_override` cũ trừ lượt Trial ngược về trước | Soát nghiệp vụ 01/11 | 5M2 |
| 18 | Giờ huỷ xét lúc lấy khoá, không lúc admin chọn | Soát nghiệp vụ 01/11 | 5M2 |
| 19 | 6 chỗ đọc hạn mức bằng MailApp, sai khi đổi đường gửi | Soát kỹ thuật 01/11 | 5Q |
| 20 | Chèn dòng tiêu đề thư qua tên trong form công khai | Soát kỹ thuật 01/11 | 5Q |
| 21 | Test giả lập MailApp sẽ xanh giả khi đổi đường gửi | Soát kỹ thuật 01/11 | 5Q |
| 22 | Quyền GmailApp ghi cố định trong manifest, không đổi được bằng CONFIG | Soát kỹ thuật 01/11 | 5Q (BL10) |
| 23 | Thoát mọi phiên không huỷ link còn hạn | Soát kỹ thuật 01/11 (lỗi đang có) | 5J |
| 24 | Chống spam link yếu, có thể làm cạn hạn mức email | Soát kỹ thuật 01/11 (lỗi đang có) | 5J |
| 25 | Ô cấu hình mới chưa có khi chưa chạy menu 1, đè giá trị cũ | Soát kỹ thuật 01/11 | 5J |
| 26 | Bỏ trigger cũ sai cách thì trigger mồ côi báo lỗi mỗi Chủ nhật | Soát kỹ thuật 01/11 | 5J |
| 27 | Gửi thư hàng loạt trong khoá của hourlyJob | Soát kỹ thuật 01/11 | 5J (đã bỏ email học viên; vẫn áp cho nhắc tutor) |
| 28 | Chữ "Chủ nhật" viết cứng trong code, mẫu nhắc tutor ghi "hôm nay" | Soát kỹ thuật 01/11 (lỗi đang có) | 5J |
| 29 | Lưu trữ mỗi lượt 3.000 dòng mà vẫn đánh dấu xong, phần tồn tăng mãi | Soát kỹ thuật 01/11 (lỗi đang có) | 5K |
| 30 | Lưu trữ MAIL_LOG 60 ngày làm hỏng chống gửi trùng marketing | Soát kỹ thuật 01/11 | 5K |
| 31 | Mốc mã tự sinh, phiên bản nằm trong Script Properties, hệ thống mới không đọc được | Soát kỹ thuật 01/11 | 5L |
| 32 | Chép dữ liệu trước khi gỡ Calendar thì hệ thống mới không tạo sự kiện | Soát kỹ thuật 01/11 | 5L |
| 33 | Bảo trì "chỉ xem" không dừng job, thư trùng từ 2 hệ thống | Soát kỹ thuật 01/11 | 5L |
| 34 | Bỏ LEGACY làm vỡ dữ liệu mẫu S004 và test v6 | Soát kỹ thuật 01/11 | 5L |

Mọi dòng trên đều có test riêng khi code. Lỗ hổng mới tìm ra trong lúc làm được thêm vào bảng này và báo ngay trong `PROGRESS.md`.

## 5. Chunk 6 · Go live (sau khi anh chốt tổng hợp cuối chunk 5)

Yêu cầu anh 01/11 tối: chuyển sang PRODUCTION **đơn giản nhất**, **không mất dữ liệu**, có **hai bản chức năng tương đương chạy song song**, kèm hướng dẫn **tắt hết trigger của STAGING** khi PRODUCTION chạy chính thức. Chi tiết viết khi anh ra lệnh chunk 6; khung đề xuất:

1. **Cách tạo PRODUCTION (chọn khi vào chunk 6):**
   * (a) Đề xuất: **tạo bản sao** file STAGING (Sheets kèm dự án Apps Script) thành PRODUCTION, dùng menu "Chuyển hệ thống" của 5L để chép dữ liệu thật có kiểm đếm, xoá dữ liệu thử; STAGING giữ nguyên làm nơi thử. Không đụng dữ liệu đang có.
   * (b) Biến chính file STAGING hiện tại thành PRODUCTION, rồi tạo một bản sao mới làm STAGING. Ít bước nhất, nhưng dữ liệu thử phải dọn trên file thật.
2. **Hai bản song song:** cùng `Code.gs`, `Index.html`, `appsscript.json`; khác nhau chỉ ở ô CONFIG môi trường (ENV, ADMIN_EMAIL, WEBAPP_URL, lịch, thư mục). Test quét bảo đảm không có giá trị môi trường viết cứng trong code.
3. **Chống chạy trùng:** hai bản chạy song song thì trigger STAGING gửi thư thật. Hướng dẫn: **menu 3 có thêm "Tắt hết trigger" cho STAGING**, menu 2 của PRODUCTION báo nếu STAGING còn trigger chạy dưới cùng tài khoản (BL52), STAGING chỉ bật trigger khi đang thử.
4. Kiểm đếm sau chuyển: số dòng mỗi tab, gói, buổi tương lai, sự kiện Calendar; chạy 40 kịch bản trên STAGING trước, checklist B của `docs/04_CHECKLIST.md` trên PRODUCTION.
5. Giao: hướng dẫn go live mới thay `HUONG_DAN_GO_LIVE_8010.md`, có mục "Thay đổi so với bản trước".

## 6. Làm tiếp ở chat khác trong project (tiết kiệm token)

Mã nguồn và bộ test nằm trong project ở `v8/repo/SRC_BUNDLE.txt` và `v8/repo/TEST_BUNDLE.txt` (mỗi file gói nhiều file, dòng `=====FILE: đường/dẫn=====` mở đầu từng file). Chat mới dựng lại repo theo `v8/repo/BOOTSTRAP.md`, chạy harness phải xanh trước khi làm. Cuối mỗi sub chunk: dựng lại 2 bundle, tải lên project cùng `dist/`, `PROGRESS.md`, file tài liệu đổi.
