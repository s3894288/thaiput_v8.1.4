# Hướng dẫn triển khai thaiput v8 trên Google Workspace (bản 8.1.4)

*Cập nhật 02/11/2026. Dùng cho cả thử nghiệm (STAGING) lẫn chạy thật (PRODUCTION); cả hai đều chạy trên tài khoản Google Workspace, không dùng Gmail thường. Không cần biết code. Làm lần lượt từ trên xuống; mỗi mục ghi thời gian dự kiến.*

## Thay đổi so với bản trước (8.0.10, 17/10)

* **Không còn MailFix:** từ 8.1.4 email gửi cố định qua GmailApp trong code. Không tạo file MailFix, không tìm và thay. Mục 1.5, 12.
* Bộ file (mục 2) thêm 2 file của dự án phụ đăng nhập Google; cài theo `HUONG_DAN_VAN_HANH.md` Phần M.
* Số trigger: **8** (trước đây 10). File có 19 tab (thêm META).
* Menu gom nhóm (8.1.3): đường dẫn menu trong mục 3.4, 5, 11 đã sửa theo menu mới.
* Mục 4 (cập nhật STAGING đã có) chuyển sang `HUONG_DAN_PHAT_HANH.md` mục 3 (nâng 8.0.10 lên 8.1.4).
* Mục 7 (go live) và mục 10 (đổi tài khoản) **tạm thay bằng ghi chú**: menu chuyển dữ liệu v6 và menu "Chuyển sang tài khoản mới" đã bỏ ở 8.1.3, thay bằng menu **Chuyển hệ thống** 4 bước. Hướng dẫn go live đầy đủ (2 bản chạy song song, tắt trigger STAGING) viết ở chunk 6.
* Mục 5 thêm bước thử gói giá 0, khoá tutor, đường gửi email; link tutor bấm được nhiều lần trong 15 phút (8.1.1).

Cách đọc: chữ **đậm** là tên nút hoặc mục menu cần bấm. `Chữ đơn cách` là tên tab, cột, ô hoặc nội dung cần gõ đúng từng ký tự. "Menu 1", "menu 2" là các mục **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc** và **thaiput → 2. Kiểm tra hệ thống** trong file Google Sheets.

## 0. Mô hình: 2 môi trường, 2 tài khoản

| | STAGING (thử) | PRODUCTION (chạy thật) |
|---|---|---|
| Tài khoản chạy hệ thống | `admintest@<tên miền>` (Workspace dùng thử 14 ngày) | `admin@<tên miền>` (Workspace trả phí) |
| File Sheets | `THAIPUT_DB_STAGING` | `THAIPUT_DB_PRODUCTION` (file mới, không chép từ STAGING) |
| Hàm cài đặt lần đầu | `setupFirstRun` | `switchToProduction` |
| Lịch học | "Thaiput · Lịch học (STAGING)" | "Thaiput · Lịch học" |
| Ô `ADMIN_EMAIL` | `admintest@` | `admin@` (2 co-founder dùng chung, cả hai cùng nhận) |
| Menu Test, giả lập thời gian, thử tải, xoá dữ liệu test | Có | Không (bị khoá) |

Mỗi môi trường gồm **một file Google Sheets và một dự án Apps Script gắn vào file đó**, chạy dưới **một tài khoản**. Tài khoản đó là chủ file dữ liệu, lịch học, thư mục Drive, mọi email gửi đi và mọi trigger (việc chạy tự động theo giờ). Không dùng chung file hay lịch giữa 2 môi trường.

Hai co-founder dùng chung `admin@`: không cần tài khoản admin thứ hai, không cần Google Group.

## 1. Chuẩn bị tên miền và tài khoản Workspace (làm 1 lần)

### 1.1 Mua tên miền (15 phút)

1. Vào trang một nhà đăng ký tên miền (PA Vietnam, Mắt Bão, Tenten, Nhân Hoà...), gõ tên muốn mua, xem đuôi nào còn trống. `.vn` (khoảng 450.000đ năm đầu, cần giấy tờ người hoặc tổ chức đứng tên) tạo tin cậy với học viên Việt Nam; `.com` rẻ hơn, không cần giấy tờ.
2. **Không mua thêm** hosting, email, SSL hay công cụ làm web: Google lo các phần đó.
3. Nên để trường hoặc chủ trường đứng tên tên miền.
4. Bật **tự động gia hạn** và đặt nhắc trước ngày hết hạn 30 ngày. Mất tên miền là mất cả email lẫn trang web.
5. Tìm mục **Quản lý DNS** (có nơi gọi Cấu hình DNS, DNS Records) trong trang quản lý tên miền. Mỗi bản ghi DNS có 4 ô: Tên (Host), Loại (Type), Giá trị (Value), Ưu tiên (Priority, chỉ bản ghi MX).

### 1.2 Đăng ký Workspace và bật email (20 phút, cộng thời gian chờ DNS)

1. workspace.google.com → **Bắt đầu dùng thử**. Số nhân viên: chỉ một người. Khu vực: Việt Nam.
2. Chọn **Có, tôi có một miền**, nhập tên miền đã mua.
3. Tài khoản đầu tiên: tên người dùng **`admin`** (thành `admin@<tên miền>`). Đây là tài khoản chạy hệ thống PRODUCTION và là quản trị viên Workspace. Đặt mật khẩu mạnh.
4. Google đưa một bản ghi để **xác minh tên miền**. Thêm vào DNS rồi bấm **Xác minh** (chưa thấy thì chờ 15 phút, bấm lại):

| Tên | Loại | Giá trị |
|---|---|---|
| `@` (có nơi để trống) | TXT | `google-site-verification=...` (chép nguyên từ Google) |

5. **Bật Gmail:** xoá mọi bản ghi MX cũ của nhà đăng ký, thêm đúng 1 bản ghi:

| Tên | Loại | Giá trị | Ưu tiên |
|---|---|---|---|
| `@` | MX | `smtp.google.com` | 1 |

6. Thử: từ một Gmail cá nhân gửi email tới `admin@`; mở gmail.com bằng `admin@` thấy email tới.
7. Bật **xác minh 2 bước** (myaccount.google.com → Bảo mật), tải **mã dự phòng**, chia cho cả 2 co-founder, lưu ngoài tài khoản này.

### 1.3 Xác thực email để không vào Spam (15 phút, rồi chờ khoảng 1 giờ)

| Bản ghi | Tên | Loại | Giá trị |
|---|---|---|---|
| SPF | `@` | TXT | `v=spf1 include:_spf.google.com ~all` |
| DKIM | `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=...` (lấy ở bước dưới) |
| DMARC | `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:admin@<tên miền>` |

* SPF: đã có một bản ghi TXT bắt đầu bằng `v=spf1` thì **sửa** bản ghi đó, không tạo bản thứ hai.
* DKIM: admin.google.com → **Ứng dụng → Google Workspace → Gmail → Xác thực email → Tạo bản ghi mới**, độ dài khoá 2048, tiền tố `google`. Trang DNS báo chuỗi quá dài (trên 255 ký tự): tạo lại với khoá 1024. Tổ chức vừa bật Gmail có thể phải chờ 24 đến 72 giờ mới tạo được khoá. Dán bản ghi xong, thường khoảng 1 giờ là đủ, Google ghi có thể tới 48 giờ; quay lại bấm **Bắt đầu xác thực**. DKIM không tự bật nếu bỏ qua bước bấm này.
* DMARC: `p=none` chỉ theo dõi, an toàn giai đoạn đầu. Chạy ổn 1 tháng thì đổi `p=quarantine`.

### 1.4 Cài đặt bắt buộc trong admin.google.com (10 phút)

| # | Mục | Đặt | Thiếu thì |
|---|---|---|---|
| 1 | **Ứng dụng → Google Workspace → Drive và Tài liệu → Cài đặt chia sẻ** | **Bật** chia sẻ ra ngoài tổ chức | Khi triển khai trang web không có lựa chọn "Bất kỳ ai"; học viên không mở được trang |
| 2 | **Ứng dụng → Google Workspace → Lịch → Cài đặt chia sẻ** | Cho phép mời khách ngoài tổ chức | Học viên, tutor dùng Gmail cá nhân không nhận thư mời |
| 3 | **Ứng dụng → Google Workspace → Google Meet → Cài đặt an toàn** | Bật **Truy cập nhanh** | Học viên, tutor phải chờ chủ phòng duyệt mới vào được Meet |
| 4 | myaccount.google.com và **Cài đặt** của Google Calendar | Múi giờ **(GMT+07:00) Ho Chi Minh** | Giờ trên thư mời lệch |

### 1.5 Tài khoản thử admintest@

1. Chọn một trong hai cách, mỗi cách có hệ quả riêng:
   * **Cùng tổ chức với admin@:** admin.google.com → **Thư mục → Người dùng → Thêm người dùng**: `admintest` (thêm 1 suất người dùng). Hạn mức email, tình trạng dùng thử hay trả phí là của **cả tổ chức**: tổ chức còn dùng thử thì cả STAGING lẫn PRODUCTION cùng chịu hạn mức thấp; hết hạn dùng thử mà chưa trả phí thì cả hai cùng bị tạm dừng.
   * **Tổ chức Workspace dùng thử riêng** (tên miền phụ hoặc tên miền khác): STAGING tách hẳn khỏi PRODUCTION; hạn dùng thử 14 ngày và hạn mức thấp chỉ ảnh hưởng STAGING.
   Cả hai cách đều làm lại mục 1.4 cho tài khoản đó.
2. **Hạn mức email thấp hơn tài khoản trả phí:** email hệ thống gửi qua Apps Script (GmailApp từ 8.1.4). Google ghi hạn mức 1.500 người nhận mỗi ngày cho Workspace, nhưng tài khoản Workspace dùng thử bị giới hạn thêm; thực tế thường thấy khoảng **100 người nhận mỗi ngày**, đúng con số menu 2 báo. Hạn mức chỉ tăng sau khi tổ chức đã chuyển sang trả phí, đã trả tổng cộng 100 USD và đã qua 60 ngày kể từ lúc đạt mức đó (trang hỗ trợ Gmail của Google ghi có thể mất tới 75 ngày). Google không công bố con số chính xác cho tài khoản dùng thử; số 100 là số Apps Script tự báo còn lại. Code không đổi được con số này; chi tiết và cách ứng phó ở mục 12. Hệ thống tự đọc hạn mức còn lại: gần hết thì bỏ email ưu tiên thấp (nhắc buổi, sắp hết hạn), email xác nhận và huỷ vẫn gửi. Thử tải dùng địa chỉ giả nên không tốn hạn mức.
3. **Tổ chức riêng của STAGING hết 14 ngày dùng thử mà không trả phí thì bị tạm dừng và STAGING ngừng chạy.** Trước hạn chọn một trong ba:
   * (a) trả phí tiếp cho tổ chức dùng thử (giữ STAGING riêng hẳn; nên chọn khi còn sửa lỗi nhiều sau go live);
   * (b) chuyển sang cách cùng tổ chức: tạo `admintest@` trong tổ chức trả phí của `admin@` (thêm 1 suất người dùng), dựng lại STAGING theo mục 3;
   * (c) bỏ STAGING sau go live, sửa thẳng trên PRODUCTION (không nên: mất nơi thử an toàn).

## 2. Bộ file cần có (bản 8.1.4)

Coder gửi 3 file cho dự án chính và 2 file cho dự án phụ đăng nhập Google:

| File | Dán vào |
|---|---|
| `Code.gs` (khoảng 10.000 dòng, dòng đầu ghi `THAIPUT v8.1.4`) | File `Code.gs` của dự án Apps Script |
| `Index.html` (đã gộp sẵn 7 phần giao diện) | File HTML tên `Index` |
| `appsscript.json` | Tệp kê khai của dự án chính |
| `GoogleLogin.gs`, `appsscript.json` (dự án phụ, file nhỏ có `USER_ACCESSING`) | Dự án phụ "thaiput Google login" (`HUONG_DAN_VAN_HANH.md` Phần M). Không dán vào dự án chính |

Bản chia nhiều file cho PRODUCTION chỉ có khi admin yêu cầu "xuất PRODUCTION"; chạy giống hệt bản một file.

**Trước khi làm:** mở Chrome bằng **một hồ sơ riêng** (hoặc cửa sổ ẩn danh) chỉ đăng nhập đúng tài khoản chạy hệ thống. Chrome đăng nhập nhiều tài khoản cùng lúc là nguyên nhân lỗi hay gặp nhất (cấp quyền nhầm tài khoản, file thuộc nhầm chủ).

## 3. Dựng STAGING mới trên admintest@ (khoảng 60 phút)

### 3.1 Tạo file và dán code (20 phút)

1. sheets.google.com → bảng tính trống, đặt tên `THAIPUT_DB_STAGING`.
2. **Tiện ích mở rộng → Apps Script**. Đổi tên dự án thành `thaiput v8 STAGING`.
3. **Cài đặt dự án** (bánh răng): tick **Hiện tệp kê khai "appsscript.json" trong trình chỉnh sửa**; múi giờ **(GMT+07:00) Ho Chi Minh**.
4. **Trình chỉnh sửa** (biểu tượng `< >`):
   * `appsscript.json`: xoá hết, dán nội dung file `appsscript.json`, **Lưu**;
   * `Code.gs`: xoá hết, dán `Code.gs`, **Lưu**;
   * bấm **+** cạnh Tệp → **HTML**, gõ tên `Index` (chữ I hoa, không gõ `.html`), xoá nội dung mẫu, dán `Index.html`, **Lưu**;
   * dự án chỉ có 3 file: `appsscript.json`, `Code.gs`, `Index.html`. Không tạo file MailFix.
5. Cột trái, mục **Dịch vụ** phải có **Calendar**. Không thấy: **+** cạnh Dịch vụ → Google Calendar API → **Thêm**.

### 3.2 Cài đặt lần đầu và cấp quyền (10 phút)

1. Ô chọn hàm cạnh nút **Chạy**: chọn `setupFirstRun`, bấm **Chạy**.
2. **Xem lại quyền** → chọn đúng admintest@ → **Cho phép**. Hiện "Google chưa xác minh ứng dụng này": **Nâng cao → Đi tới thaiput v8 STAGING**. Quyền xin: Sheets, Drive, Calendar, gửi email (Apps Script và Gmail), trigger, giao diện Sheets, email người dùng. Học viên và tutor không bao giờ thấy màn hình này.
3. Chờ "Execution completed" (30 đến 90 giây).
4. Quay lại tab Sheets, **tải lại trang (F5)**. Có menu **thaiput**; file có 19 tab: CONFIG, PACKAGES, USERS, REGISTRATIONS, STUDENT_PACKAGES, PAYMENTS, AVAILABILITY, BOOKINGS, ACTIVITY_LOG, AUTH, MAIL_LOG, METRICS, NOTIFICATIONS, META, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES, MARKETING_EMAILS, REPORT_MONTH.
5. Drive có thư mục `THAIPUT_V8_STAGING` (Uploads, Backup, Export). Calendar có lịch "Thaiput · Lịch học (STAGING)". 8 trigger đã được tạo.

### 3.3 Đưa trang web lên (10 phút)

1. **Triển khai → Tùy chọn triển khai mới**, bánh răng cạnh "Chọn loại" → **Ứng dụng web**:
   * Mô tả: `8.1.4`;
   * **Thực thi với tư cách: Tôi**;
   * **Ai có quyền truy cập: Bất kỳ ai**. Không có lựa chọn này: làm mục 1.4 bước 1, chờ 10 phút, thử lại.
2. Bấm **Triển khai**, chép **URL ứng dụng web** (kết thúc bằng `/exec`).
3. Tab CONFIG, dòng `WEBAPP_URL`, cột `value`: dán link. Link kết thúc `/dev` chỉ người sửa code mở được; link đăng nhập trong email dùng chính link `/exec` này.
4. Mở link trên điện thoại: thấy trang chủ thaiput, các gói học, nút **VI | EN** ở góc trên.

### 3.4 Điền thông tin (15 phút)

Tab CONFIG, chỉ sửa cột `value`. Ô nào không nói dưới đây thì để mặc định (hạn đặt 15:00 hôm trước, 1 buổi mỗi ngày, giờ 08:00 đến 23:30, link đăng nhập 15 phút, phiên tutor 30 ngày...).

| Ô | Điền | Ví dụ |
|---|---|---|
| `ADMIN_EMAIL` | Một địa chỉ duy nhất nhận email hệ thống. Menu 1 tự ghi tài khoản đang chạy | `admintest@...` |
| `ADMIN_ZALO_URL` | Link Zalo admin (nút Zalo nổi, nút liên hệ); phải bắt đầu `https://` | `https://zalo.me/0909123456` |
| `ADMIN_PHONE` | Số admin (chỉ admin dùng; trang web không có nút gọi) | `0909123456` |
| `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` | Thông tin chuyển khoản trên form đăng ký, gia hạn | |
| `MAIL_FROM_NAME` | Tên người gửi email | `thaiput` |
| `SCHOOL_SITE_URL`, `POLICY_URL` | Trang web trường, trang chính sách dữ liệu | `https://www.<tên miền>` |
| `MEET_MODE` | `AUTO` (mỗi buổi một link Meet) | `AUTO` |
| `CALENDAR_MODE` | `QUEUE` (thư mời tạo trong vài phút sau khi đặt) | `QUEUE` |

* Tab **PACKAGES**: điền giá thật ở cột `price_vnd`. Giá 0: gói không đăng ký được trên web, trang hiện thẻ Zalo thay cho form (menu 2 báo LƯU Ý). Tên gói tiếng Việt ở cột `name`, tên tiếng Anh ở cột `name_en` (trang và email tiếng Anh dùng `name_en`; ô `name_en` trống thì hiện tên tiếng Việt).
* **Tài khoản admin cho trang quản trị trên web:** menu **thaiput → Người dùng → Thêm admin**, nhập tên và chính email chạy hệ thống (admintest@ trên STAGING, admin@ trên PRODUCTION). Thiếu bước này thì trang quản trị báo không có quyền. Email hệ thống vẫn chỉ gửi tới `ADMIN_EMAIL`.
* **Đăng nhập Google cho admin:** cài dự án phụ theo `HUONG_DAN_VAN_HANH.md` Phần M (15 phút).
* **Thêm tutor:** menu **thaiput → Người dùng → Thêm tutor** (tên, email, số). Chọn dòng tutor ở USERS → menu **Người dùng → Gửi link đăng nhập (các dòng đang chọn ở USERS)**. Tutor mở tab **Giờ rảnh** (tiếng Anh: Availability) và mở giờ tuần này, tuần sau; chưa có giờ rảnh thì học viên không có giờ để đặt.

### 3.5 Kiểm tra hệ thống (2 phút)

Menu 2: phải **KHÔNG CÓ LỖI** và "Đủ 8 trigger". Dòng "LƯU Ý" chỉ là nhắc việc.

## 4. Cập nhật STAGING đã có lên bản mới

Làm theo `HUONG_DAN_PHAT_HANH.md`: mục 3 khi nâng từ 8.0.10 lên 8.1.4, mục 2 cho mọi lần cập nhật sau. Thứ tự luôn là: dán code, **Lưu**, F5 Sheets, menu 1, menu 2, **Triển khai phiên bản mới** (sửa bản triển khai cũ, không tạo bản mới).

## 5. Chạy thử đầu cuối trên STAGING (khoảng 60 phút, trên điện thoại)

Dùng 2 email phụ: 1 làm học viên, 1 làm tutor (Gmail cá nhân được).

| # | Làm | Đúng khi |
|---|---|---|
| 1 | **Đăng ký:** mở link `/exec` bằng email học viên, điền form, số `0912 345 678`, tải ảnh chuyển khoản, **Gửi đăng ký** | Trang hiện mã chuyển khoản; REGISTRATIONS có dòng mới, cột phone `+84912345678`; ảnh nằm trong Uploads; admintest@ nhận "[Đăng ký mới]" |
| 2 | **Duyệt:** cột `admin_action` của dòng đó chọn **Duyệt** | USERS có học viên; học viên nhận email "Chào mừng" có nút đăng nhập |
| 3 | **Đăng nhập học viên lần đầu:** bấm nút trong email | Hiện hộp **Chọn ngôn ngữ · Choose your language**. Chọn **English**: cổng học viên tiếng Anh (Book, My lessons, Account); cột `lang` của học viên trong USERS ghi `en` |
| 4 | **Đổi ngôn ngữ:** bấm **VI \| EN** ở góc trên | Mọi chữ đổi sang tiếng Việt, tab đang xem và giờ đang chọn giữ nguyên; USERS ghi `vi`. Đóng hẳn trình duyệt, mở lại link: vẫn đăng nhập, vẫn tiếng Việt |
| 5 | **Đặt lịch:** chọn 2 ngày, mỗi ngày 1 giờ, bấm **Đặt** | Email xác nhận gộp tới ngay, thứ tiếng đã chọn nằm ở trên; tutor nhận "New lessons"; 5 đến 10 phút sau mỗi người nhận thư mời Calendar có link Meet (đặt lúc 22:00 đến 07:00 thì thư mời tới khoảng 07:05). Mô tả sự kiện không có email, số điện thoại học viên |
| 6 | **Vào Meet:** đến giờ, học viên và tutor mỗi người một thiết bị bấm link trong thư mời | Cả hai vào thẳng, không ai chờ duyệt. Phải chờ: kiểm mục 1.4 bước 3, và học viên phải vào bằng đúng email được mời |
| 7 | **Huỷ:** huỷ 1 buổi trước 15:00 hôm trước | Thư huỷ Calendar tới cả hai; buổi sau 15:00 hôm trước không còn nút Huỷ |
| 8 | **Tutor:** xin link bằng email tutor; bấm link 2 lần; xin link lần 2 ngay sau đó | Lần đầu hỏi ngôn ngữ, nút chính là English; lần bấm 2 trong 15 phút vẫn vào được; link quá 15 phút báo "đã hết hạn"; xin lần 2 báo "link đã được gửi lúc ..., xin link mới sau ..." |
| 9 | **Tutor mở giờ, xin huỷ giờ đã có học viên** | Admin nhận email; AVAILABILITY cột `admin_decision` hiện "Chờ duyệt" |
| 10 | **Trang quản trị:** đăng nhập bằng Google (Phần M) hoặc link email, tài khoản admintest@ (đã thêm ở mục 3.4) | Lần đầu hỏi ngôn ngữ. Ô số liệu gọn một hàng và **cả 6 ô bấm được**: Khẩn, Cần xử lý lọc thông báo; Đăng ký chờ duyệt, Tutor xin huỷ mở đúng tab Sheets; Buổi hôm nay, Chờ tutor xác nhận mở danh sách buổi. Thông báo mỗi dòng một tin, gom "Hôm nay", "Hôm qua"; bấm một tin mở chi tiết và tin đó thành đã đọc |
| 10b | **Trang quản trị song ngữ:** bấm **VI \| EN** | Ô số liệu, tab, thông báo, nhãn trạng thái, tên gói đổi sang tiếng Anh ngay, trang đang mở giữ nguyên; cột `lang` của dòng admin trong USERS đổi theo |
| 10c | **Nhật ký:** tab Nhật ký | Mỗi hoạt động một dòng ngắn (giờ, việc gì, ai làm); bấm một dòng mở hộp đọc đủ chi tiết; vừa sửa một ô trong tab CONFIG thì có dòng "Sửa tay trong Sheets" ghi giá trị cũ và mới |
| 11 | **Sửa chữ trên web:** tab CONTENT, dòng `h.hero_title`, sửa cột `vi`; menu **Email → Cập nhật nội dung web và email**; tải lại trang chủ | Tiêu đề mới hiện khi chọn VI; chọn EN vẫn là chữ cột `en` |
| 12 | **Email marketing:** tab MARKETING_EMAILS, dòng `VI_DU`; menu **Email → Email marketing: gửi thử một chiến dịch cho tôi**, gõ `VI_DU` | admintest@ nhận email tiêu đề bắt đầu `[THỬ · TEST]`, có nút Gia hạn, có câu từ chối nhận ở chân |
| 13 | **Giờ khác không phải chờ:** menu **Test (chỉ STAGING) → Bật giả lập thời gian**, gõ `2026-10-12 14:59`: đặt cho ngày 13 được; gõ `2026-10-12 15:00`: bị chặn | Nhớ **Tắt giả lập thời gian** sau khi thử |
| 14 | **Email không vào Spam:** menu **Email → Kiểm tra gửi email** tới Gmail cá nhân; mở thư → ba chấm → **Hiển thị bản gốc** | Hộp thoại ghi đường gửi `GMAILAPP`; tab MAIL_LOG dòng mới cột `transport` là `GMAILAPP`; thư tới hộp thư chính; SPF, DKIM, DMARC đều PASS. Không thấy thư: mục 12 |
| 15 | **Bảo trì:** menu **Cập nhật phiên bản → Bảo trì: chỉ xem**; học viên bấm Đặt | Câu báo bảo trì theo đúng ngôn ngữ đang chọn, không có dòng mới ở BOOKINGS; thanh vàng đầu trang. **Bảo trì: đóng cổng**: cổng học viên hiện trang bảo trì, form đăng ký khoá nút Gửi, admin vẫn vào được. **Bảo trì: tắt**: mọi thứ như cũ |
| 16 | **Sao lưu phát hành:** menu **Cập nhật phiên bản → Phát hành: sao lưu ngay** | Có file mới trong thư mục `THAIPUT_V8_STAGING_Releases` |
| 17 | **Trang health:** mở link `/exec` thêm `?page=health` ở cuối | Chữ `OK` |
| 18 | **Gói giá 0:** tab PACKAGES, đặt `price_vnd` của một gói thành 0; mở trang chủ | Gói đó hiện thẻ Zalo, không chọn được trong form. Trả lại giá thật |
| 19 | **Số điện thoại tự do:** form đăng ký gõ `Line: abc` | Gửi được; REGISTRATIONS lưu nguyên văn |
| 20 | **Khoá tutor:** tutor thử có 1 buổi sắp tới; chọn dòng ở USERS → menu **Người dùng → Khoá tutor** | Xem trước đúng buổi; hỏi lại 2 lần; buổi đổi tutor hoặc huỷ, học viên nhận email; tutor bị thoát. **Mở khoá tutor** sau khi thử |

## 6. Thử tải trước go live (khoảng 1 giờ, chỉ STAGING)

Mục đích: đo xem bao nhiêu người cùng bấm Đặt thì hệ thống bắt đầu chậm hay bị Google từ chối (giới hạn 30 lượt chạy cùng lúc của một tài khoản), và chắc chắn không có booking trùng hay mất. Địa chỉ giả `@loadtest.invalid` không bao giờ nhận email hay thư mời thật.

1. Máy tính cài **Node 18 trở lên** (nodejs.org, bản LTS); gõ `node -v` trong Terminal (Mac) hoặc PowerShell (Windows) để kiểm.
2. Một thư mục riêng chứa 2 file `run.js` và `browser.js` coder gửi.
3. Sheets STAGING: menu **Test → Thử tải: tạo dữ liệu giả** (100 học viên giả, 10 tutor giả mở mọi giờ 14 ngày tới).
4. Menu **Test → Thử tải: bật 2 giờ**: hộp thoại hiện **KHOÁ** và **LINK**. Không gửi khoá qua chat, email.
5. Terminal, trong thư mục ở bước 2, chạy lần lượt:

```
node run.js --url "LINK" --secret "KHOÁ" --users 10 --ramp 10
node run.js --url "LINK" --secret "KHOÁ" --users 30 --ramp 10 --start 11
node run.js --url "LINK" --secret "KHOÁ" --users 50 --ramp 0 --start 41
```

6. Mỗi lượt in bảng tổng kết. Đạt khi: dòng `ket_qua` chỉ có `BOOKED`, `NO_TUTOR`, `ONE_PER_DAY` (không có `BUSY`, `rejected`, `network`, `SERVER_ERROR`) và dòng `dat_ms_ca_thu_lai` có p95 dưới 8.000 ms.
7. Menu **Test → Thử tải: kiểm kết quả**: phải "Dữ liệu đúng luật".
8. Menu **Test → Thử tải: tắt**. Dọn dữ liệu: `HUONG_DAN_THU_TAI.md` mục 4 (menu **Công cụ kỹ thuật → Xoá dữ liệu test** mức 1 xoá MỌI học viên, buổi, gói, nhật ký, không chỉ dữ liệu giả).
9. Gửi coder các file `ketqua_*.json` và ảnh hộp thoại kiểm kết quả.

## 7. Go live: PRODUCTION (viết lại ở chunk 6)

Hướng dẫn go live bản 8.0.10 cũ **không dùng nữa**: menu "Chuyển dữ liệu từ v6" đã bỏ ở 8.1.3, cách chuyển dữ liệu đổi sang menu **Chuyển hệ thống** 4 bước (`HUONG_DAN_VAN_HANH.md` C6). Đã chốt cho chunk 6: cách đơn giản nhất, không mất dữ liệu, 2 bản có chức năng tương đương chạy song song một thời gian, và hướng dẫn tắt hết trigger của STAGING (menu **Công cụ kỹ thuật → Tắt hết trigger tự động**) khi PRODUCTION chạy chính thức. Hướng dẫn từng bước viết ở chunk 6.

Những phần vẫn đúng và sẽ dùng lại: chọn giờ vắng (sau 23:30 hoặc trước 08:00; tránh 13:00 đến 15:00 và tối thứ Bảy, lúc tutor mở lịch), Chrome hồ sơ riêng chỉ đăng nhập admin@, mục 1.4 cho tổ chức của admin@, hàm `switchToProduction` thay cho `setupFirstRun` trên file PRODUCTION, mục 8 (Sites, tên miền), mục 9 (giám sát).

## 8. Nhúng Google Sites và gắn tên miền (khoảng 20 phút, tuỳ chọn)

1. sites.google.com bằng tài khoản chạy hệ thống, tạo trang `thaiput`.
2. **Chèn → Nhúng → Theo URL**, dán link `/exec`, chọn **Toàn bộ trang**, kéo khung cao hết màn hình. **Xuất bản**.
3. Trong Sites: bánh răng **Cài đặt → Miền tuỳ chỉnh → Bắt đầu thiết lập → Dùng một miền từ bên thứ ba**, nhập `www.<tên miền>`. Thêm bản ghi DNS rồi bấm **Hoàn tất** (chờ 15 phút đến vài giờ):

| Tên | Loại | Giá trị |
|---|---|---|
| `www` | CNAME | `ghs.googlehosted.com` |

4. Cho tên miền không có `www` tự chuyển về `https://www.<tên miền>`: mục **Chuyển hướng tên miền** (URL forwarding) ở nhà đăng ký. Nhà đăng ký không hỗ trợ chuyển hướng có HTTPS: hỏi coder phương án khác.

Link đăng nhập trong email luôn mở thẳng link `/exec`, không qua Sites: Sites không chuyển tham số đăng nhập vào khung nhúng, và Safari hay chặn lưu đăng nhập trong khung nhúng.

**Toàn bộ bản ghi DNS sau khi xong:**

| Tên | Loại | Giá trị | Ưu tiên | Để làm gì |
|---|---|---|---|---|
| `@` | TXT | `google-site-verification=...` | | Xác minh tên miền |
| `@` | MX | `smtp.google.com` | 1 | Nhận email |
| `@` | TXT | `v=spf1 include:_spf.google.com ~all` | | SPF |
| `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=...` | | DKIM |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:admin@<tên miền>` | | DMARC |
| `www` | CNAME | `ghs.googlehosted.com` | | Trang web |

## 9. Giám sát từ bên ngoài (khoảng 10 phút, làm sau go live)

Hệ thống tự báo lỗi qua email, nhưng khi chính Google Apps Script ngừng chạy (sự cố của Google, trigger bị gỡ, hết thời gian chạy trong ngày) thì không còn gì gửi báo. Một dịch vụ bên ngoài cứ 5 phút mở link health và báo khi không thấy chữ `OK`.

* Link health: link `/exec` thêm `?page=health`. Trả `OK` khi trang chạy được và mọi job định kỳ còn chạy đúng nhịp; trả `STALE` khi một job ngừng quá hạn (hourlyJob 150 phút, reminderJob 45 phút, calendarJob 30 phút, sao lưu đêm và dailyJob 26 giờ). Không đọc dữ liệu, không lộ thông tin.
* Google trả nội dung qua một bước chuyển hướng: dịch vụ giám sát phải **đi theo chuyển hướng**.

Phương án đề xuất cho PRODUCTION: **UptimeRobot gói Solo** (khoảng 9 đến 10 USD mỗi tháng; gói miễn phí chỉ cho dùng phi thương mại):

1. Đăng ký uptimerobot.com bằng admin@, mua gói Solo.
2. **Add New Monitor**: loại **Keyword**; URL: link `/exec` của PRODUCTION thêm `?page=health`; Keyword: `OK`; báo khi **không có** keyword; khoảng kiểm 5 phút.
3. **Alert contacts**: admin@ và email cá nhân của 2 co-founder.
4. Thử trên STAGING: trình soạn Apps Script → **Trình kích hoạt**, tạm xoá trigger `calendarJob`; khoảng 35 phút sau link health chuyển `STALE` và dịch vụ phải gửi email. Menu **3. Tạo lại trigger tự động**, link về `OK`.

Phương án không tốn tiền: Google Cloud Monitoring (miễn phí trong 1 triệu lượt kiểm mỗi tháng, cần dự án Google Cloud có thẻ thanh toán); phải thử trước xem có đọc được chữ `OK` qua bước chuyển hướng không. STAGING không cần giám sát.

## 10. Khi phải đổi tài khoản chạy hệ thống (hiếm)

Dùng menu **Chuyển hệ thống** (từ 8.1.3): Bước 1 trên hệ thống cũ (đóng cổng, gỡ sự kiện các buổi sắp tới, xoá trigger, ghi META và `MOVED_TO_URL`); dựng hệ thống mới theo mục 3 dưới tài khoản mới; Bước 2 (chạy thử, chỉ đọc), Bước 3 (chép thật, chạy lại không nhân đôi), Bước 4 (tạo lại sự kiện, thư mời mới) trên hệ thống mới. Hệ thống mới chỉ đọc file cũ, không sửa. Cần chia sẻ file dữ liệu cũ cho tài khoản mới quyền xem. Hướng dẫn từng bước viết cùng go live ở chunk 6; trước đó chỉ làm khi có coder đi cùng.

File lưu trữ (`THAIPUT · Lưu trữ · ...`) và thư mục Releases của tài khoản cũ vẫn thuộc tài khoản cũ: chia sẻ cho tài khoản mới để đọc; không chuyển chủ, không xoá.

## 11. Khi có sự cố

| Hiện tượng | Nguyên nhân hay gặp | Cách xử lý |
|---|---|---|
| Triển khai không có "Bất kỳ ai" | Chưa bật chia sẻ ra ngoài | Mục 1.4 bước 1, chờ 10 phút |
| Học viên phải "Xin tham gia" Meet | Chưa bật Truy cập nhanh, hoặc vào bằng email khác email được mời | Mục 1.4 bước 3; dặn vào bằng đúng email đã đăng ký |
| Không nhận thư mời Calendar | Lịch chưa cho mời khách ngoài; hoặc đang giờ yên tĩnh 22:00 đến 07:00 | Mục 1.4 bước 2; chờ 07:05 hoặc menu **Calendar: tạo sự kiện đang chờ ngay** |
| Email vào Spam | Thiếu SPF, hoặc DKIM chưa "Bắt đầu xác thực" | Mục 1.3 |
| Không nhận email gửi tới admin@ | Còn bản ghi MX cũ | Xoá hết MX cũ, chỉ giữ `smtp.google.com` |
| "No HTML file named ..." hoặc "Thiếu file HTML" | File HTML không tên đúng `Index`, hoặc thêm file sau khi triển khai | Đặt tên `Index`, triển khai phiên bản mới |
| Trang trắng, hoặc sửa code mà trang không đổi | Chưa triển khai phiên bản mới | **Triển khai → Quản lý các lần triển khai → bút chì → Phiên bản mới → Triển khai** |
| Trang hiện chữ dạng `s.tab_book` thay vì chữ thật | Dòng đó trong CONTENT bị xoá key, hoặc chưa chạy menu 1 sau khi dán code mới | Menu 1, rồi menu **Email → Cập nhật nội dung web và email** |
| Menu thaiput không hiện | Chưa tải lại Sheets, hoặc mở bằng tài khoản khác | F5; kiểm góc phải trên đúng tài khoản |
| "Chỉ chủ file (...) được chạy cài đặt và tạo trigger" | Đang đăng nhập tài khoản không phải chủ file | Đăng nhập đúng tài khoản chạy hệ thống |
| Menu 2 báo "Có x/8 trigger" | Trigger bị xoá hoặc chưa tạo | Menu **3. Tạo lại trigger tự động** |
| Menu 2 báo còn file MailFix.gs | Bản cũ còn sót | Trình soạn: file `MailFix.gs` → ba chấm → **Xoá** |
| Hộp thoại Kiểm tra gửi email ghi đường gửi MAILAPP | GmailApp thiếu quyền, thư tự gửi lại bằng MailApp | `appsscript.json` phải có dòng `gmail.send`; `HUONG_DAN_VAN_HANH.md` L3 |
| Chọn "Duyệt" mà không có gì xảy ra | Trigger onEdit chưa có | Menu 3 |
| Học viên báo "Hệ thống đang bận" | Nhiều thao tác trùng lúc | Trang tự thử lại; lặp lại nhiều thì gửi coder số đo ở tab METRICS |
| Học viên thấy "Hệ thống đang bảo trì" | `MAINTENANCE_MODE` khác OFF | Menu **Bảo trì: tắt** |
| Không nhận email, hạn mức vẫn bị trừ | Google đã nhận thư nhưng thư bị lọc, bị trả lại, hoặc địa chỉ không có hộp thư | Mục 12 |
| Menu 2 báo hạn mức khoảng 100 dù là Workspace | Tài khoản Workspace đang ở mức dùng thử | Mục 12 |
| Mọi thao tác chậm | Xem mục 13 | Mục 13 |
| Tài khoản dùng thử hết hạn | Hết 14 ngày | Mục 1.5 bước 3 |
| Lỗi lạ | | Trình soạn code → **Lần thực thi**: chép dòng lỗi và giờ xảy ra, gửi coder |

## 12. Email không tới người nhận, hạn mức 100 mỗi ngày

### 12.1 Hạn mức bị trừ không có nghĩa là thư đã tới

Con số "Email còn gửi được hôm nay" giảm ngay khi Google **nhận** thư từ script để gửi đi. Sau đó thư còn phải qua máy chủ của người nhận. Thư có thể bị lọc vào Thư rác, bị trả lại, hoặc gửi tới địa chỉ không có hộp thư. Vì vậy "hạn mức bị trừ mà người nhận không thấy thư" là chuyện của đường giao thư, không phải của code gửi.

### 12.2 Tìm đúng nguyên nhân (15 phút, làm theo thứ tự)

1. **Gửi thư kiểm tra có mã:** Sheets → menu **thaiput → Email → Kiểm tra gửi email (thư có mã, hướng dẫn tìm thư bị mất)**. Nhập một địa chỉ đang không nhận được thư (tốt nhất là Gmail cá nhân và một địa chỉ của tutor hoặc học viên). Hộp thoại báo mã kiểm tra dạng `MT...`, tài khoản gửi, đường gửi (`GMAILAPP` là bình thường), hạn mức trước và sau. Nhật ký trên trang quản trị có dòng "Gửi email kiểm tra".
2. **Tìm thư ở hộp thư người nhận:** tìm mã `MT...` ở cả Thư rác (Spam), Quảng cáo, Tất cả thư. Có trong Thư rác: nguyên nhân là xác thực tên miền (bước 4).
3. **Đọc nhật ký giao thư của Google:** đăng nhập admin.google.com bằng tài khoản quản trị → **Menu → Báo cáo (Reporting) → Tìm kiếm nhật ký email (Email log search)**, hoặc mở thẳng địa chỉ `admin.google.com/ac/emaillogsearch`. Người gửi là tài khoản gửi trong hộp thoại, người nhận là địa chỉ vừa thử, thời gian hôm nay. Google trả kết quả tìm sau 1 phút tới 1 giờ tuỳ số thư khớp; chưa thấy dòng nào thì chờ rồi tìm lại. Tên trạng thái giao thư hay gặp:
   * **Delivered** (hoặc Delivered to Gmail inbox, Delivered to an SMTP server): Google đã giao thư tới hộp thư Gmail hoặc máy chủ thư của người nhận. Thư bị lọc ở phía người nhận: tìm lại trong Thư rác, nhờ người nhận đánh dấu "Không phải thư rác" và thêm địa chỉ gửi vào danh bạ;
   * **Marked spam**: Gmail xếp thư vào Thư rác: làm bước 4;
   * **Bounced**: thư bị trả lại; bấm vào dòng đọc lý do. Hay gặp nhất là tên miền chưa xác thực (bước 4), địa chỉ sai, hoặc hộp thư không tồn tại;
   * **Dropped**: thư không được giao vì máy chủ gửi bị đánh giá uy tín kém: làm bước 4 và gửi đều đặn, ít thư một lúc;
   * **In progress**: thư đang đi qua máy chủ Google; chờ rồi tìm lại;
   * **Không có dòng nào:** thư chưa rời Google. Kiểm tra hộp thư của chính tài khoản gửi có thư "Mail Delivery Subsystem" không, và trang **Lần thực thi** của dự án Apps Script có lỗi không.
4. **Kiểm tra xác thực tên miền:** cách chắc nhất là mở thư kiểm tra đã tới một hộp Gmail cá nhân (kể cả trong Thư rác) → ba chấm → **Hiển thị bản gốc**: ba dòng SPF, DKIM, DMARC phải là PASS. Công cụ Check MX (toolbox.googleapps.com/apps/checkmx, tên đầy đủ "Check MX and SPF Records") kiểm bản ghi MX và SPF của tên miền; nhập thêm `google` ở ô **DKIM selector (optional)** để kiểm cả bản ghi DKIM. Công cụ không thay được bước đọc bản gốc. Thiếu PASS thì làm lại mục 1.3. DKIM không tự bật: sau khi bản ghi DNS có hiệu lực phải vào admin.google.com bấm **Bắt đầu xác thực**. Tên miền mới chưa bật DKIM là nguyên nhân hay gặp khiến Gmail đưa thư vào Thư rác hoặc trả lại.
5. **Địa chỉ cùng tên miền:** tutor hoặc học viên dùng địa chỉ `...@<tên miền>` mà chưa có tài khoản Workspace (chưa có hộp thư) thì thư không có nơi nhận. Dùng Gmail cá nhân của tutor, học viên, hoặc tạo tài khoản hay nhóm cho địa chỉ đó.
6. **Dữ liệu thử:** tài khoản tutor, học viên tạo để thử bằng địa chỉ bịa thì không có ai nhận. Kiểm cột `email` trong tab USERS.

Một ghi chú về cách đọc thư: email đăng nhập chứa link `script.google.com/.../exec`. Bộ lọc thư rác có thể nghi ngờ thư từ tên miền mới có link loại này. Khi tên miền đã có đủ SPF, DKIM, DMARC và đã gửi đều đặn một thời gian, hiện tượng này giảm.

### 12.3 Vì sao Workspace mà hạn mức chỉ khoảng 100

Trang hạn mức của Apps Script ghi: Gmail thường 100 người nhận mỗi ngày, Workspace 1.500, và **tài khoản dùng thử có giới hạn thêm** (Google không công bố con số). Hạn mức chỉ tăng sau khi tổ chức đã chuyển sang trả phí, đã trả tổng cộng 100 USD và đã qua 60 ngày kể từ lúc đó (trang hỗ trợ Gmail ghi tới 75 ngày). Tài khoản Workspace mới đăng ký đang ở giai đoạn này, nên menu 2 báo khoảng 100 (số Apps Script tự báo). Menu 2 có dòng LƯU Ý giải thích khi thấy tình trạng này. Mỗi người nhận tính 1, kể cả email gửi cho admin.

Ảnh hưởng thực tế khi chỉ có 100 mỗi ngày:
* mỗi lượt đặt tốn khoảng 2 (học viên và tutor), mỗi lần xin link đăng nhập tốn 1, email nhắc buổi tốn 1 mỗi buổi;
* email marketing không gửi được nếu `MARKETING_QUOTA_RESERVE` (mặc định 100) không nhỏ hơn hạn mức; menu 2 báo trước;
* `MAIL_LOW_QUOTA_RESERVE` (mặc định 15) là phần giữ lại cho email quan trọng: còn ít hơn chừng đó thì email nhắc tự bỏ.

Ba cách ứng phó (chọn một):
* **(a) Chờ hết giai đoạn dùng thử:** chuyển tổ chức sang trả phí (admin.google.com → Thanh toán). Hạn mức chỉ tăng khi đủ hai điều kiện ở trên. Trong lúc chờ: tạm tắt email ít quan trọng (CONFIG `MORNING_REMINDER_HOUR` = -1; mẫu email không cần thiết thì đặt `active` FALSE trong tab EMAIL_TEMPLATES), không chạy email marketing.
* **(b) Gửi bằng Gmail API (chưa làm, BACKLOG):** từ 8.1.4 hệ thống gửi bằng GmailApp. Đổi đường gửi không tự tăng hạn mức. Cách kiểm GmailApp có trừ cùng hạn mức không: menu Kiểm tra gửi email, số hạn mức trước và sau giảm 1 là có trừ. Ghi chú cũ về Gmail API: trang giới hạn gửi của Gmail (knowledge.workspace.google.com, mục Gmail sending limits in Google Workspace) ghi tài khoản dùng thử gửi tối đa **500 thư mỗi ngày**, không tăng trong thời gian dùng thử, và Gmail API tối đa 500 người nhận mỗi thư. Không có tài liệu nào của Google nói thư gửi qua Gmail API có trừ vào hạn mức MailApp (khoảng 100) hay không; chưa kiểm chứng được. Nếu không trừ thì đường này có thể nâng lên tới 500 mỗi ngày trong lúc dùng thử. Cần coder thêm một đường gửi mới, thêm quyền gửi thư Gmail, đổi luật gửi email của hệ thống, và thử trên STAGING trước. Không giải quyết được thư vào Thư rác (bước 4).
* **(c) Dịch vụ gửi email chuyên dụng** (có tên miền xác thực riêng): hạn mức lớn, thêm chi phí và một bước cài đặt; chưa làm.

## 13. Hệ thống chậm: đo trước, sửa sau

### 13.1 Bản 8.0.10 đã bớt việc thừa ở máy chủ

Coder đếm số lần mỗi thao tác gọi tới Google (mở file, đọc, ghi) trên bản giả lập và sửa các chỗ thừa:
* một lượt đặt lịch trước đây mở file dữ liệu 4 lần, nay tối đa 3 lần: ngoài khoá dùng lại file đã mở, mỗi lần vào khoá mở lại một lần để dữ liệu quyết định ghi (giờ trống, gói) luôn đọc mới;
* đọc cấu hình môi trường (Script Properties) từ khoảng 18 lần còn khoảng 2 lần mỗi lượt;
* ghi một dòng nhật ký hay một dòng MAIL_LOG trước đây phải đọc **cả** tab trong lúc giữ khoá; hai tab này lớn nhanh nhất nên mọi thao tác chậm dần theo thời gian. Nay chỉ ghi thêm ở cuối tab. Đo trên 20.000 dòng nhật ký: lượt đặt không còn đọc 120.000 ô của tab nhật ký;
* trang quản trị mở lần đầu chỉ còn một lượt gọi máy chủ (trước đây hai).

Không có tài liệu nào của Google nói Apps Script trên Workspace chạy chậm hơn trên Gmail thường. Mỗi lần trang gọi máy chủ luôn mất khoảng nửa giây tới hơn một giây dù việc rất nhỏ; bản demo chạy ngay trong trình duyệt nên nhanh hơn hẳn bản thật, so hai bản là so sai.

### 13.2 Đo trên hệ thống thật (10 phút)

1. Sheets → menu **thaiput → Công cụ kỹ thuật → Đo tốc độ (chỉ đọc)**. Chép toàn bộ hộp thoại (từng phần việc kèm số mili giây).
2. Trình soạn Apps Script → **Lần thực thi**: chép thời gian chạy của 5 dòng gần nhất có tên `apiStudentHome`, `apiStudentBook`, `apiAdminHome`, và các dòng màu đỏ nếu có.
3. Tab METRICS: chép các dòng của giờ thấy chậm (cột `p95_ms`, `max_ms`, `busy`).
4. Ghi lại: chậm ở thao tác nào (mở trang, đặt lịch, gõ trong Sheets), trên máy nào, mạng nào.

Cách đọc nhanh:

| Thấy | Thường là | Làm |
|---|---|---|
| "Mở file DB" trên 2.000 ms | Google chậm lúc đó, hoặc file quá nhiều tab, định dạng | Đo lại giờ khác; xoá tab không dùng |
| "Đọc tab ..." trên 1.500 ms | Tab quá nhiều dòng | Menu **Lưu trữ: xem tình trạng**, kiểm `ARCHIVE_ENABLED` |
| "Lấy khoá rồi nhả" trên 3.000 ms, hoặc cột `busy` trong METRICS lớn | Job đang giữ khoá cùng lúc | Gửi coder dòng METRICS |
| Lần thực thi có lỗi "too much computer time" | Trigger vượt thời gian chạy trong ngày | Gửi coder ngay |
| Mọi số đều nhỏ nhưng trang vẫn chậm | Mạng, trình duyệt nhiều tài khoản Google, trang nhúng Google Sites | Thử Chrome hồ sơ riêng chỉ đăng nhập một tài khoản, mở thẳng link `/exec` |
| Gõ trong Sheets bị khựng | Trigger sửa tay ghi nhật ký mỗi lần sửa (bản 8.0.10) | Bình thường mỗi lần sửa chạy nền vài giây, không chặn việc gõ; khựng rõ thì gửi coder |

Gửi coder bốn mục ở trên; không đoán trước khi có số đo.
