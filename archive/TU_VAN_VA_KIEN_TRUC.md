# Tư vấn, ý kiến chuyên gia kiến trúc, phân tích báo giá dev, thay đổi giao diện 19/10

*Tệp lưu trữ, gộp ngày 30/10/2026 trong đợt dọn dẹp bản 8.0.10. Gộp nguyên văn 7 file: `v8/history/TU_VAN_*`, `KIEN_TRUC_CHUYEN_GIA_A/B`, `CHANGELOG_GIAO_DIEN_19_10` và `v8/PHAN_TICH_BAO_GIA_DEV.md`.*

*Mỗi file gốc nằm giữa hai dòng `<!-- BEGIN FILE ... -->` và `<!-- END FILE ... -->`, kèm số byte và mã sha256 của file gốc để kiểm chứng. Nội dung giữa hai dòng đó là nguyên văn.*

## Mục lục

1. `v8/history/TU_VAN_15_10.md`
2. `v8/history/TU_VAN_GIAM_SAT_16_10.md`
3. `v8/history/TU_VAN_KIEN_TRUC_16_10.md`
4. `v8/history/KIEN_TRUC_CHUYEN_GIA_A.md`
5. `v8/history/KIEN_TRUC_CHUYEN_GIA_B.md`
6. `v8/PHAN_TICH_BAO_GIA_DEV.md`
7. `v8/history/CHANGELOG_GIAO_DIEN_19_10.md`

---

## `v8/history/TU_VAN_15_10.md`

*Ngày tạo trong Project: 2026-10-29T14:41:13Z*

<!-- BEGIN FILE: v8/history/TU_VAN_15_10.md | bytes=16176 | sha256=815c99f03c90f22a1ad3c2552384501d6c6419eb4d574125f429acd612d31347 | created=2026-10-29T14:41:13Z -->
# Tư vấn ngày 15/10 · Trả lời thẳng và các quyết định anh cần chốt

*Ghi rõ từng số liệu thuộc loại nào: **hạn mức Google** (trang quotas chính thức của Apps Script), **đo** (công cụ `test/tools/load_profile.js`), **ước tính** (phép tính từ giả định nêu rõ). Không có số nào em đoán mà không ghi là ước tính.*

## Mục lục quyết định cần anh chốt
| # | Câu hỏi | Em đề xuất |
|---|---|---|
| Q1 | Giới hạn 30 lượt chạy cùng lúc: làm tới tầng nào ngay bây giờ? | Tầng 1 và 2 ở 5F, tầng 3 chỉ khi đo thấy cần |
| Q2 | "Đặt lịch dựa trên booking cuối ngày 23h" anh muốn nói ý nào (mục 2)? | Giữ đặt ngay; thêm hàng đợi khi bận (phương án C) |
| Q3 | Co-founder thứ hai đăng nhập bằng email nào? | Gmail riêng của người đó, thêm vào USERS role ADMIN |
| Q4 | Đóng băng tính năng hay "chuyến tàu phát hành hằng tuần"? | Đóng băng 5 ngày trước go live, sau đó chuyến tàu hằng tuần |
| Q5 | Go live trên file đang test (xoá dữ liệu rồi dùng tiếp) hay file mới? | File mới sạch, dùng menu xoá chỉ cho STAGING |

## 1. Giới hạn 30 lượt chạy cùng lúc: cơ chế, khi nào chạm, cách xử lý

### 1.1 Cơ chế (hạn mức Google)
* Web app chạy "với tư cách chủ" (`admin@`). Mọi học viên, tutor bấm trang đều chạy **dưới tài khoản admin@**. Google cho mỗi tài khoản tối đa **30 lượt chạy cùng lúc**.
* Lượt thứ 31 **không xếp hàng chờ**: Google từ chối ngay. Trang hiện "Không kết nối được". Dữ liệu không hỏng, không ai bị đặt nhầm. Nhưng với người dùng, nó trông như sập.
* "Cùng lúc" nghĩa là các lượt **đang chạy chồng lên nhau**, không phải số người đang mở trang. Một người mở trang rồi đọc 5 phút chỉ chiếm 1 đến 2 lượt, mỗi lượt vài giây.

### 1.2 Công thức quyết định mọi thứ
**Số lượt chạy cùng lúc ≈ số lượt gọi mỗi giây × thời gian một lượt (giây).**
* *Ước tính:* mỗi lượt 2 giây thì 30 lượt chồng nhau tương đương **15 lượt gọi mỗi giây**, khoảng 900 lượt mỗi phút.
* 100 học viên một tháng, ngày thường: vài chục lượt mỗi phút. Còn cách trần rất xa.
* Trần bị chạm khi **nhiều người bấm trong cùng vài giây**. Ví dụ anh nhắn cả lớp "20:00 mở lịch tuần sau".

### 1.3 "200 lượt song song làm treo máy?"
Không treo. 30 lượt chạy, **170 lượt bị từ chối ngay**. Muốn có 200 lượt chồng nhau cần khoảng 100 người bấm trong cùng 1 đến 2 giây. Ở 100 học viên, chuyện này chỉ xảy ra khi anh tự tạo ra thời điểm đồng loạt.

### 1.4 Bốn tầng xử lý, xếp từ rẻ tới đắt
| Tầng | Làm gì | Chi phí | Tác dụng |
|---|---|---|---|
| **1. Vận hành** | Không hẹn giờ mở lịch đồng loạt. Tutor mở lịch dần, học viên đặt bất cứ lúc nào | 0 | Xoá gốc của cao điểm |
| **2. Rút ngắn và gộp lượt gọi** (5F) | Gộp "mở cổng" và "xem slot" thành 1 lượt. Đệm danh sách slot 30 đến 60 giây (học viên cùng xem dùng chung). Trang **tự thử lại** lượt chỉ đọc sau 1 đến 3 giây, ngẫu nhiên | 1 sub-chunk | Mỗi lượt ngắn hơn: theo công thức 1.2, sức chứa tăng tương ứng. Lượt bị từ chối thành lượt chậm, không thành lỗi |
| **3. Đọc không qua Apps Script** | Mỗi khi lịch thay đổi, hệ thống ghi một bản danh sách slot ra file công khai chỉ đọc. Trang đọc thẳng file đó; chỉ lượt **đặt và huỷ** mới qua Apps Script | 2 đến 3 ngày | Lượt đọc (khoảng 80% số lượt) không còn tính vào giới hạn 30 |
| **4. Đổi nền tảng** | Máy chủ thật (Firebase, Supabase), Sheets chỉ còn là bảng xem của admin | Vài tuần, có chi phí hằng tháng | Không còn giới hạn 30; chỉ đáng làm khi hàng nghìn học viên |

**Cách không dùng được:** chuyển web app sang "chạy với tư cách người truy cập" để chia hạn mức cho từng người. Khi đó học viên phải có tài khoản Google, phải cấp quyền, và phải có quyền sửa file Sheets. Không chấp nhận được.

**Q1, anh chọn:**
* (a) Tầng 1 và 2 ở 5F (em khuyên).
* (b) Thêm tầng 3 ngay.
* (c) Chỉ tầng 1, đợi số đo thật trên STAGING.

## 2. "Đặt lịch load và thực hiện dựa trên booking cuối ngày 23h"
Câu này hiểu được theo 2 nghĩa. Em trình bày cả 2 để anh chọn.

**Nghĩa 1: gom yêu cầu đặt trong ngày, 23:00 xếp tutor một lượt rồi báo kết quả.**

| | A. Như hiện tại: đặt là có ngay | B. Gom, 23:00 xếp | C. Đặt ngay, chỉ khi bận mới xếp hàng |
|---|---|---|---|
| Học viên biết kết quả | Ngay, có tutor và link Meet | Tối muộn | Ngay; lúc cao điểm thì vài phút sau qua email |
| Cao điểm 30 lượt | Có thể chạm | Không | Không mất yêu cầu nào |
| Hạn đặt 15:00 cho ngày mai | Đúng luật | **Mâu thuẫn**: 23:00 đã quá hạn của buổi sáng hôm sau | Đúng luật |
| Hai người cùng muốn slot cuối | Ai bấm trước được | Vẫn phải có luật ưu tiên, nhưng người thua biết muộn, hết slot khác | Ai bấm trước được |
| Số email | Như hiện tại | Thêm email "không xếp được" | Thêm email "đã xếp" lúc cao điểm |

**Đánh giá:** B tốn trải nghiệm để giải một vấn đề chưa xảy ra ở 100 học viên, và phá luật hạn đặt. Nếu lo cao điểm, C là bản đúng: yêu cầu nào gặp "hệ thống bận" thì ghi vào hàng đợi, trigger mỗi phút xử lý và gửi email kết quả.

**Nghĩa 2: 23:00 mỗi ngày tính sẵn danh sách slot, ban ngày trang đọc bản tính sẵn cho nhanh.**
Đây chính là tầng 3 ở mục 1.4, nhưng tính **mỗi khi lịch đổi** chứ không chỉ 23:00. Nếu chỉ tính lúc 23:00, slot vừa có người đặt lúc 10:00 vẫn hiện trống tới đêm. Người khác bấm vào sẽ báo lỗi.

**Q2, anh chọn:**
* (a) Giữ A (em khuyên), thêm C ở 5F.
* (b) Làm B (em không khuyên).
* (c) Ý anh là nghĩa 2.

## 3. "Thời gian trigger mỗi ngày" là gì

**Trigger** là việc hệ thống tự chạy theo giờ hoặc theo sự kiện, không cần ai bấm:
* `reminderJob` mỗi 15 phút (gửi nhắc trước 60 phút);
* `hourlyJob` mỗi giờ (tự hoàn thành buổi, tổng hợp 21:00, dọn AUTH, huỷ phiên của tài khoản bị khoá);
* `dailyJob` 06:00 (chuyển trạng thái gói);
* sao lưu ban đêm, xuất CSV hằng tuần;
* `onEditInstallable`: chạy **mỗi lần admin sửa ô** trong file DB.

**Hạn mức Google:** mỗi tài khoản Workspace được tổng cộng **6 giờ chạy trigger mỗi ngày**. Gmail thường chỉ có 90 phút; không còn liên quan vì anh dùng Workspace. Lượt gọi từ trang web (học viên, tutor bấm) **không** tính vào 6 giờ này; chúng tính vào giới hạn 30 lượt cùng lúc ở mục 1. Riêng mỗi lần chạy, kể cả trigger, tối đa **6 phút**.

**Chuyện gì xảy ra khi vượt:** trigger ngừng chạy tới hết hạn mức ngày. Nhắc buổi học không đi, buổi không tự hoàn thành. Web vẫn chạy.

**Ước tính cho 10 tutor, 100 học viên:**

| Việc | Số lần mỗi ngày | Giả định thời gian | Tổng mỗi ngày |
|---|---|---|---|
| reminderJob | 96 | 3 đến 10 giây | 5 đến 16 phút |
| hourlyJob | 24 | 5 đến 15 giây | 2 đến 6 phút |
| onEdit (admin sửa ô) | 50 đến 200 | 1 đến 2 giây | 1 đến 7 phút |
| Sao lưu, dailyJob, xuất CSV | vài lần | 10 đến 60 giây | dưới 3 phút |
| **Tổng** | | | **khoảng 10 đến 32 phút, dưới 10% của 6 giờ** |

**Rủi ro thật** không nằm ở tổng 6 giờ. Nó nằm ở **một lần chạy vượt 6 phút** khi dữ liệu phình to (mỗi việc đọc cả bảng). Vì vậy lưu trữ hằng tháng (5G) là bắt buộc. Hệ thống đã ghi `JOB_SLOW` vào nhật ký khi một job chạy quá 20 giây; anh lọc chữ này ở tab Nhật ký của giao diện admin.

Mục này không cần anh quyết gì. Chỉ cần anh nhớ: thấy `JOB_SLOW` thì báo em.

## 4. Hạn mức email khi chỉ có admin@, và khi mua thêm marketing@

**Đúng.**
* Hạn mức gửi email của Apps Script tính **theo từng tài khoản**. Workspace là **1.500 người nhận mỗi ngày**; mỗi địa chỉ To, CC, BCC tính 1.
* `admin@` có 1.500 riêng. Một tài khoản `marketing@` trả phí sẽ có **1.500 riêng, không dùng chung**.

Ba điều kiện kèm theo, nói thẳng:
1. **Email marketing phải được gửi BỞI marketing@.** Tức là một dự án Apps Script riêng do marketing@ làm chủ, hoặc gửi từ Gmail của marketing@. Hệ thống đặt lịch chạy dưới admin@, nên mọi email nó gửi vẫn trừ vào 1.500 của admin@.
2. **Uy tín gửi thư tính theo tên miền, không theo tài khoản.** Người nhận bấm "Spam" với email khuyến mãi từ marketing@thaiput.vn thì Gmail, Outlook hạ điểm cả `thaiput.vn`. Email xác nhận buổi học từ admin@ sẽ dễ vào thư rác hơn. Email hàng loạt nên gửi bằng công cụ chuyên dụng (Brevo, Mailchimp) với tên miền phụ riêng, ví dụ `news.thaiput.vn`. Nó rẻ hơn một tài khoản Workspace và không kéo theo email hệ thống.
3. **admin@ vừa là hộp thư người dùng vừa là máy gửi hệ thống.** Email anh tự gửi từ Gmail admin@ và email hệ thống cùng đi ra từ một tài khoản. Gmail công bố giới hạn tổng số thư mỗi ngày cho Workspace (2.000 thư). Hai luồng **nhiều khả năng** tính chung giới hạn đó; em chưa xác minh được phần này. Ở 200 email hệ thống mỗi ngày thì còn xa.

**Rủi ro lớn hơn hạn mức:** admin@ là tài khoản Workspace duy nhất, nên cũng là **quản trị viên cao nhất** của tên miền. Một tài khoản vừa dùng hằng ngày vừa là chìa khoá tổng là điểm yếu bảo mật lớn nhất của hệ thống. Tối thiểu phải:
* bật xác minh 2 bước;
* in mã dự phòng cất ngoài máy tính;
* có email và số điện thoại khôi phục do người còn lại giữ.

## 5. Vì sao em đề nghị đóng băng tính năng, và phương án nếu anh không đồng ý

**Lập luận thẳng:**
1. **Mỗi tính năng mới đổi code dùng chung.** Ví dụ hôm nay, đăng nhập tutor đổi `Auth.gs`, file mà mọi lượt gọi đều đi qua. Test tự động bắt lỗi logic, nhưng **không** bắt được phần chỉ Google thật mới có: Calendar gửi thư, Gmail lọc spam, Sheets chèn ô tick. Phần đó chỉ lộ ra khi người thật dùng.
2. **Mỗi thay đổi bắt anh làm lại vòng kiểm trên STAGING.** Thử nhiều lần mà mỗi lần lại có code mới thì không bao giờ biết bản nào đã ổn.
3. **Lần soát độc lập hôm nay là bằng chứng.**
   * 3 agent tìm ra lỗi thật trong code mới viết, có test xanh. Ví dụ: người lạ có thể ghi đầy nhật ký và giữ khoá; menu xoá dữ liệu mở cả khi chạy thật.
   * Code mới luôn có lỗi chưa thấy. Tốc độ thêm tính năng càng nhanh thì số lỗi chưa thấy lúc go live càng nhiều.
4. **Khi go live, anh cần một mốc ổn định** để phân biệt lỗi do người dùng làm lạ hay do code mới.

**Em không đề nghị dừng phát triển.** Em đề nghị:
* **Đóng băng 5 ngày quanh go live.** Từ lúc 5G xong tới 3 ngày sau go live chỉ sửa lỗi. Tính năng mới vẫn được viết, nhưng chưa đưa lên.
* **Sau đó chạy "chuyến tàu" hằng tuần.** Tính năng mới gom lại, thứ Tư đưa lên STAGING, thứ Sáu lên PRODUCTION nếu checklist xanh. Lỗi nghiêm trọng có đường sửa nhanh riêng, không chờ tàu.
* **Dùng công tắc trong CONFIG.** Tính năng mới mặc định tắt, bật cho nhóm nhỏ trước. Hệ thống đã làm vậy với đăng nhập Google, nhắc 8:00, tổng hợp 21:00.

**Q4, anh chọn:**
* (a) Đóng băng 5 ngày rồi chạy chuyến tàu hằng tuần (em khuyên).
* (b) Không đóng băng; mỗi tính năng lên ngay sau khi test xanh. Rủi ro thuộc về anh, em ghi rõ trong báo cáo.

## 6. Menu "Xoá dữ liệu test": tư vấn thẳng
Đã làm:
* chỉ admin bấm được;
* 2 bước: chọn mức xoá, rồi gõ đúng câu có tên môi trường;
* luôn sao lưu trước, sao lưu hỏng thì không xoá gì;
* STAGING mặc định mở; `switchToProduction` tự khoá; PRODUCTION chỉ chủ file xoá được.

Phần nói thẳng:
1. **Không nên go live bằng cách xoá dữ liệu trên file đang test rồi dùng tiếp.** Làm vậy vẫn sót lại:
   * ảnh chuyển khoản trong Drive, là dữ liệu cá nhân của người thử;
   * sự kiện cũ trên lịch Calendar;
   * email đã gửi;
   * Script Properties;
   * ô CONFIG đã đổi khi test, ví dụ `BOOK_UNTIL_START`, giờ giả lập.

   Cách sạch:
   * tạo file PRODUCTION mới;
   * chạy `switchToProduction`;
   * thêm tutor thật;
   * giữ file STAGING để test tiếp, menu xoá chỉ dùng ở đó.
2. **Xoá không đụng tới:** ảnh trong thư mục Drive tải lên (anh tự xoá), email đã gửi, sự kiện đã qua.
3. **Mã đánh lại từ đầu sau khi xoá** (S0001, BK000001). Link Meet và email cũ trỏ tới mã cũ, có thể trùng mã mới. Chỉ là dữ liệu test nên chấp nhận được. Đây thêm một lý do để không xoá file sẽ chạy thật.
4. **Ai có quyền sửa file Sheets là có thể tự thêm mình vào USERS role ADMIN** rồi dùng menu. Chỉ chia sẻ file cho 2 co-founder.

**Q5, anh chọn:**
* (a) File PRODUCTION mới (em khuyên).
* (b) Dùng tiếp file test sau khi xoá. Khi đó em thêm checklist dọn CONFIG và Drive.

## 7. Đăng nhập Google (anh đã đồng ý thử)
Đã làm ở dự án phụ `dist_google_login/`. Hướng dẫn cài từng bước nằm trong `CHUNK5D_GIAI_THICH.md`. Những điểm chỉ thử trên Google thật mới biết:
1. **Màn hình xin quyền lần đầu:** dự án phụ chỉ xin quyền đọc email, là quyền không nhạy cảm. Nhiều khả năng không có cảnh báo "ứng dụng chưa xác minh", nhưng em chưa khẳng định được.
2. **Trình duyệt đăng nhập nhiều tài khoản Google:** web app "chạy với tư cách người truy cập" thường lấy tài khoản mặc định. Đây là lỗi quen thuộc của Google. Cách tránh: cửa sổ ẩn danh, hoặc một hồ sơ Chrome chỉ có tài khoản admin.
3. Link email cho admin vẫn mở (`ADMIN_LINK_LOGIN = TRUE`) làm đường dự phòng. Đăng nhập Google chạy ổn 1 tuần thì đặt FALSE.

## 8. Mô hình admin anh đã chốt và một câu hỏi
* `admin@` là tài khoản Workspace duy nhất. Một người giữ mật khẩu; tài khoản này là chủ hệ thống và nhận mọi email hệ thống. **Đã làm.**
* 2 admin là co-founder. **Q3:** co-founder thứ hai dùng email nào để vào giao diện admin? Em đề xuất Gmail riêng của người đó:
  * thêm vào USERS role ADMIN bằng menu "Thêm admin";
  * chia sẻ file Sheets quyền Người chỉnh sửa;
  * người đó tự động là khách của mọi phòng Meet, không nhận thư mời;
  * đăng nhập bằng Google hoặc link email.

<!-- END FILE: v8/history/TU_VAN_15_10.md -->

---

## `v8/history/TU_VAN_GIAM_SAT_16_10.md`

*Ngày tạo trong Project: 2026-10-29T14:41:14Z*

<!-- BEGIN FILE: v8/history/TU_VAN_GIAM_SAT_16_10.md | bytes=7791 | sha256=49dc7090204d58e8e602afcca6193e8eb500b2dedcc929cbd142e8f771b3dcf6 | created=2026-10-29T14:41:14Z -->
# Tư vấn Q4 · Giám sát từ bên ngoài là gì, cần không, chọn phương án nào

*Ngày 16/10/2026, trả lời câu "Q4: tôi không hiểu giám sát này là gì, tư vấn chi tiết lại". Số liệu giá và hạn mức tra ngày 16/10/2026 (nguồn cuối file); dịch vụ bên ngoài có thể đổi giá.*

## 1. Giám sát là gì, nói bằng một ví dụ

Hệ thống đã tự báo lỗi cho admin khá đủ: lỗi máy chủ (email "Lỗi hệ thống"), Calendar lỗi (Khẩn), dữ liệu sai luật (đối soát mỗi giờ), lưu trữ thiếu dòng, job chạy chậm. **Nhưng mọi cảnh báo đó đều do chính Apps Script gửi.** Có những lúc chính Apps Script không chạy được, nên không ai báo:

| Tình huống | Tự báo được không | Ai phát hiện nếu không có giám sát |
|---|---|---|
| Google Apps Script hoặc Sheets gặp sự cố diện rộng | Không (code không chạy) | Học viên nhắn Zalo "không vào được" |
| Trigger bị gỡ (ví dụ tài khoản bị yêu cầu cấp quyền lại sau khi Google đổi chính sách, hoặc lỡ chạy sai menu) | Không (job không chạy thì không gửi gì) | Không ai, cho tới khi buổi học không có link Meet, không ai nhận email nhắc |
| Hết hạn mức thời gian chạy trigger trong ngày (6 giờ mỗi ngày) | Không | Như trên |
| Lần triển khai mới làm hỏng trang web | Có khi có, có khi không | Học viên |
| Job lỗi lặp lại mỗi giờ | Có (email lỗi, tối đa 1 lần mỗi giờ) | Admin, nếu đọc email |

**Giám sát từ bên ngoài** là một dịch vụ trên internet, cứ vài phút mở một đường link của hệ thống và đọc chữ trả về. Không đọc được chữ "OK" vài lần liền thì dịch vụ đó gửi email (hoặc tin nhắn) cho anh. Vì nó nằm ngoài Google, nó vẫn báo được khi chính Google hỏng.

## 2. Hệ thống đã chuẩn bị gì (5F, 5G)

Đường link: `WEBAPP_URL?page=health` (link /exec trong CONFIG, thêm `?page=health`).
* Trả **OK** khi web app chạy được **và** mọi job định kỳ còn chạy đúng nhịp.
* Trả **STALE** khi một job ngừng quá hạn: hourlyJob 150 phút, reminderJob 45 phút, calendarJob 30 phút, sao lưu đêm và dailyJob 26 giờ (5G: mỗi job chạy xong ghi một mốc giờ).
* Không đọc Sheets, không lấy khoá, không lộ phiên bản hay số người dùng. Mỗi lần kiểm là 1 lượt chạy Apps Script rất ngắn: 1 lần mỗi 5 phút là 288 lượt mỗi ngày, không đáng kể so với giới hạn.

Lưu ý kỹ thuật: Google trả nội dung này qua một bước chuyển hướng (302) sang `script.googleusercontent.com`. Google ghi rõ người đọc phải "đi theo chuyển hướng". Dịch vụ giám sát nào **không** đi theo chuyển hướng thì chỉ thấy trang chuyển hướng, không thấy chữ OK hay STALE.

## 3. Các phương án

| | A. Google Cloud Monitoring | B. UptimeRobot (gói Solo) | C. Better Stack (nhịp tim) | D. Chưa giám sát |
|---|---|---|---|---|
| Giá | Miễn phí trong 1 triệu lượt kiểm mỗi tháng (kiểm 5 phút một lần từ 3 vùng khoảng 26.000 lượt). Cần tạo dự án Google Cloud và gắn thẻ thanh toán | Khoảng 9 USD/tháng trả theo năm, 10 USD trả theo tháng. **Gói miễn phí chỉ cho dùng cá nhân, phi thương mại từ 10/2024**, thaiput là kinh doanh nên không dùng gói miễn phí | Gói miễn phí cho dùng thương mại: 10 mục kiểm và 10 nhịp tim, kiểm 3 phút một lần | 0 |
| Kiểm chữ OK, STALE | Có kiểm chữ trong nội dung. **Chưa chắc** có đi theo chuyển hướng 302 không (tài liệu Google không ghi). Nếu không đi theo: chỉ biết "link còn trả lời", không biết job ngừng | Có. UptimeRobot ghi mọi mục kiểm mặc định đi theo chuyển hướng; mục "Keyword" báo khi không thấy chữ OK | **Chưa chắc** có kiểm chữ trong gói miễn phí. Cách dùng hợp hơn là "nhịp tim": hệ thống tự gọi Better Stack mỗi giờ; không thấy gọi là báo. Cần thêm code gọi ra ngoài (UrlFetch) và **cấp quyền lại** cho script |
| Báo qua | Email | Email (SMS, gọi điện mua thêm) | Email, ứng dụng | Không |
| Cùng nhà Google | Có (sự cố lớn của Google có thể ảnh hưởng cả hai) | Không | Không | |
| Cài đặt | 20 đến 30 phút (dự án Cloud, thanh toán, mục kiểm, chính sách cảnh báo) | 10 phút | 10 phút đăng ký, cộng 1 bản cập nhật code của em | 0 |

## 4. Đề xuất

* **STAGING (admintest@, đang thử 14 ngày): D**, chưa cần giám sát. Đang thử thì anh và em ngồi xem trực tiếp.
* **PRODUCTION: B (UptimeRobot Solo)**, kiểm `?page=health` 5 phút một lần, mục Keyword chứa `OK`, báo email tới admin@ và email cá nhân của 2 co-founder. Lý do: rẻ, đi theo chuyển hướng (đã ghi rõ), nằm ngoài Google, kiểm được cả chữ STALE nên biết khi trigger ngừng, không cần đổi code.
* Phương án dự phòng không tốn tiền: **A**, với điều kiện thử trước 15 phút xem có đọc được chữ OK qua chuyển hướng không. Nếu đọc được, A ngang B về chức năng.

## 5. Cách cài phương án B khi anh chốt (khoảng 10 phút, làm sau go live)

1. Đăng ký uptimerobot.com bằng admin@, mua gói Solo.
2. **Add New Monitor**: loại **Keyword**; URL: link /exec của PRODUCTION thêm `?page=health`; Keyword: `OK`; báo khi **không có** keyword; khoảng kiểm 5 phút.
3. **Alert contacts**: admin@ và email cá nhân của 2 co-founder.
4. Thử: trong trình soạn Apps Script của STAGING, tạm xoá trigger calendarJob; sau khoảng 35 phút trang health chuyển STALE, UptimeRobot phải gửi email. Chạy menu 3 tạo lại trigger, trang về OK.
5. Gửi em ảnh trang monitor để em ghi vào tài liệu vận hành.

## 6. Câu hỏi cho anh

**Q4 mới:** anh chọn (A) Google Cloud miễn phí, thử chuyển hướng trước; (B) UptimeRobot Solo khoảng 9 đến 10 USD/tháng (em đề xuất cho PRODUCTION); (C) Better Stack nhịp tim miễn phí, cần em thêm code gọi ra ngoài và cấp quyền lại; (D) chưa giám sát tới khi go live?

Nguồn:
* [Apps Script Content Service: nội dung chuyển hướng sang script.googleusercontent.com, phải đi theo chuyển hướng](https://developers.google.com/apps-script/guides/content?hl=en)
* [Google Cloud Observability pricing: uptime check 1 triệu lượt miễn phí mỗi tháng, 0,30 USD mỗi 1.000 lượt](https://cloud.google.com/monitoring/pricing)
* [Google Cloud: kiểm nội dung phản hồi, chấp nhận mã 3xx](https://docs.cloud.google.com/monitoring/uptime-checks/response-validation)
* [UptimeRobot: mọi mục kiểm đi theo chuyển hướng, có tuỳ chọn tắt](https://uptimerobot.com/blog/july-2023-dont-follow-redirects-secondary-e-mail-address)
* [UptimeRobot pricing 2026 (bài của Notifier, đối thủ): gói miễn phí phi thương mại từ 10/2024, Solo 9 USD/tháng theo năm](https://notifier.so/guides/uptimerobot-pricing-2026/)
* [Better Stack vs UptimeRobot (bài của Notifier, đối thủ): gói miễn phí 10 mục kiểm và 10 nhịp tim, 3 phút, cho dùng thương mại](https://notifier.so/guides/better-stack-vs-uptimerobot/)
* [Better Stack: khoảng kiểm 3 phút ở gói miễn phí](https://betterstack.com/docs/uptime/check-frequency.md)
* [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas?hl=en)

<!-- END FILE: v8/history/TU_VAN_GIAM_SAT_16_10.md -->

---

## `v8/history/TU_VAN_KIEN_TRUC_16_10.md`

*Ngày tạo trong Project: 2026-10-29T14:41:15Z*

<!-- BEGIN FILE: v8/history/TU_VAN_KIEN_TRUC_16_10.md | bytes=27760 | sha256=31e7d1dae9d8331d959f4a49832019ce1e9da86fb84d4236986310f95037a0f7 | created=2026-10-29T14:41:15Z -->
# Tư vấn kiến trúc 16/10 · Chạy mượt, không sập khi đông người

*Hai chuyên gia kiến trúc độc lập (A và B) cùng làm một đề bài, không trao đổi với nhau. Alex tổng hợp và đối chiếu với code. Báo cáo gốc nằm trong project: `v8/tu_van/KIEN_TRUC_CHUYEN_GIA_A.md`, `v8/tu_van/KIEN_TRUC_CHUYEN_GIA_B.md`. Mọi hạn mức và giá đã kiểm trên trang chính thức ngày 15/10/2026, link ở mục 9. Số nào là ước tính đều ghi rõ.*

## 0. Kết luận trong 8 dòng

1. **"Không crash, không delay cho bất cứ ai, bằng bất cứ giá nào" không đạt được tuyệt đối với bất kỳ nền tảng nào.** Google chỉ cam kết 99,9% cho Sheets, Calendar, Gmail, và **không cam kết gì cho Apps Script**. Hai người tranh slot cuối thì một người phải thua. Tiền mua được "hầu như luôn dưới 1 giây", không mua được 100%. Thay vào đó em đặt mục tiêu đo được (SLO, mục 2).
2. Cả hai chuyên gia, độc lập, ra cùng một kết luận: **không rời Apps Script trước go live**, mà **cứng hoá ngay** rồi **chuẩn bị đường rời có kế hoạch**, kích hoạt bằng số đo.
3. Ở 100 học viên, giới hạn 30 lượt cùng lúc gần như không bị người dùng thật chạm tới. Thứ làm hệ thống "trông như sập" lúc go live là **khoá ghi bị giữ lâu và bị lấy nhiều lần**, cộng **lỗi hiện ra sau khi đã ghi xong**. Đọc code thấy một lượt đặt lấy khoá 5 đến 7 lần.
4. **5F đã làm xong gần hết "giai đoạn 0" của cả hai chuyên gia** (mục 3): mỗi thao tác lấy khoá tối đa 2 lần, lỗi sau khi ghi không còn báo "bận", trình duyệt tự thử lại với mã chống trùng, hàng đợi Calendar, bộ đệm slot và CONFIG, số đo tốc độ, đối soát mỗi giờ.
5. Trần thật của Apps Script, ước tính: **email vỡ trước** ở khoảng 500 đến 700 học viên, khoá ghi thành nút thắt ở khoảng 1.000, Sheets chạm 10 triệu ô ở vài nghìn.
6. Đường rời khi lớn: **Cloudflare Workers + D1 + Durable Object**, Apps Script ở lại làm "công nhân" cho Calendar và bảng Sheets của admin. Khoảng 5 USD mỗi tháng ở 100 học viên, 11 USD ở 1.000, 65 đến 70 USD ở 10.000 (ước tính, chưa gồm Workspace). Phương án thay: Supabase 25 USD mỗi tháng, ít khoá nhà cung cấp nhất.
7. Quyết định "Calendar gom 23h" của anh: **đúng hướng, sai giờ** theo cả hai chuyên gia (mục 6). Em đã làm đúng như anh chọn, kèm đường gấp và công tắc đổi chế độ.
8. Rủi ro lớn nhất của sản phẩm chuyên nghiệp lúc go live **không phải số người dùng**, mà là **sửa code trên bản đang chạy** (trigger chạy ngay code vừa lưu) và **STAGING dùng chung tài khoản với PRODUCTION** (thử tải STAGING sẽ ăn 30 lượt của PRODUCTION).

## 1. Hạn mức đã kiểm (tài liệu chính thức, 15/10/2026)

| Hạn mức | Giá trị | Ý nghĩa cho thaiput |
|---|---|---|
| Lượt chạy cùng lúc mỗi người dùng | 30 | Web app "chạy với tư cách tôi": mọi học viên, tutor, mọi trigger và onEdit dùng chung 30 lượt của admin@ |
| Thời gian một lần chạy | 6 phút | Job gom Calendar phải chia lô (đã làm: 40 sự kiện hoặc 4 phút mỗi lượt) |
| Thời gian trigger mỗi ngày | 6 giờ | Job Calendar 5 phút thoát ngay khi chưa có việc; ước tính 2 đến 5 phút mỗi ngày |
| Người nhận email MailApp | 1.500 mỗi ngày | Nút thắt đầu tiên khi tăng trưởng |
| Calendar API | 600 lượt mỗi phút mỗi người dùng | Google khuyên **tránh job dồn cùng giờ, ví dụ đồng bộ nửa đêm** |
| Lời mời Calendar ra ngoài tên miền | khoảng 10.000 "trong thời gian ngắn" thì bị bóp vài giờ, hồi phục có thể một tháng | Gom lời mời vào một giờ là đúng kiểu bị bóp khi lớn |
| Trigger theo giờ | `atHour(23)` thực tế chạy ngẫu nhiên từ 23:00 tới 24:00 | "Đúng 23:00" không có thật |
| CacheService | 100 KB mỗi khoá, tối đa 6 giờ, có thể bị xoá sớm | Chỉ làm đệm, không làm nơi lưu |
| Ô trong một file Sheets | 10 triệu | |
| SLA Workspace | 99,9% cho Gmail, Calendar, Sheets, Drive, Meet | **Apps Script không có trong danh sách** |

Không có tài liệu chính thức về độ trễ khởi động của `google.script.run`. Con số 0,5 đến 2 giây là giả định; menu "Đo tốc độ" (5F) và thử tải (5G) thay bằng số đo thật.

## 2. Mục tiêu đo được (SLO) thay cho "không bao giờ sập"

Hai nhóm: **bất biến dữ liệu** phải bằng 0, không có ngân sách lỗi; **trải nghiệm** có ngân sách lỗi.

| Loại | Chỉ số | Giai đoạn 0 (Apps Script) | Giai đoạn 2 (Cloudflare) | Đo bằng (đã có ở 5F hay chưa) |
|---|---|---|---|---|
| Bất biến | Hai học viên cùng một tutor cùng giờ | 0 | 0 | Đối soát mỗi giờ, báo Khẩn (có) |
| Bất biến | Màn hình báo "thành công" mà không có dòng booking | 0 | 0 | Mã chống trùng `request_id` (có) |
| Bất biến | Booking đã ghi mà màn hình báo lỗi | 0 | 0 | Luật 39 (có), test I67 |
| Bất biến | Buổi sắp diễn ra trong 3 giờ chưa có link Meet | 0 không báo | 0 | Đối soát CALENDAR_LATE (có) |
| Trải nghiệm | Lượt thất bại người dùng thấy, sau tự thử lại | ≤ 0,5% mỗi tuần | ≤ 0,1% | Trình duyệt báo `_client_fail` (có), tab METRICS |
| Trải nghiệm | p95 mở trang và xem slot | ≤ 3 giây | ≤ 1 giây | Tab METRICS (có, phía máy chủ) |
| Trải nghiệm | p95 bấm "Đặt" tới khi thấy kết quả | ≤ 5 giây | ≤ 1,5 giây | Tab METRICS |
| Trải nghiệm | Độ sẵn sàng (kiểm từ ngoài mỗi 5 phút) | ≥ 99,5% mỗi tháng | ≥ 99,9% | `?page=health` (có) + dịch vụ giám sát (anh cài, mục 4.1) |

Các ngưỡng giai đoạn 0 là mục tiêu, **phải xác nhận lại sau khi đo thật trên STAGING**. Không đạt thì hạ mục tiêu hoặc làm sớm giai đoạn 1, không giấu.

**Thay cho đóng băng (anh không đóng băng): luật ngân sách lỗi.** Một bất biến dữ liệu bị vi phạm, hoặc tỉ lệ lỗi người dùng thấy trong 7 ngày vượt SLO, thì tạm ngừng đưa **tính năng mới** lên PRODUCTION tới khi số đo xanh 7 ngày. **Sửa lỗi vẫn đưa lên bình thường.** Phanh theo số đo, không theo lịch.

## 3. Giai đoạn 0 · Cứng hoá Apps Script: đã làm gì ở 5F

| Việc chuyên gia đề xuất | Chuyên gia | 5F | Ghi chú |
|---|---|---|---|
| Một lượt đặt chỉ lấy khoá 1 lần chính + 1 lần ghi gom | B 0.1 | **Xong** | Test I68: đặt và huỷ tối đa 2 lần (trước: 5 đến 7) |
| Lỗi sau khi ghi không biến kết quả thành thất bại | B 0.2 | **Xong** | Luật 39, test I67 |
| Hàng đợi Calendar, mã sự kiện cố định, đường gấp, thử lại có chờ tăng dần, FAILED báo admin | A 0.8, B 0.3 | **Xong** | CalendarQueue.gs, test I61 đến I65, I76, I77, I80 |
| Huỷ: Calendar và email ra ngoài khoá | B 0.4 | **Xong** | Đổi tutor và duyệt tutor xin huỷ cũng ra ngoài khoá (soát R1) |
| Nhắc trước 60 phút gửi ngoài khoá | B F4 | **Xong** | Test I68 |
| Mã chống gửi trùng cho mọi thao tác ghi | A 0.2, B 0.5 | **Xong** | `rid`, `request_id`, IN_PROGRESS; test I66, I78, I79 |
| Trình duyệt tự thử lại có chờ tăng dần, ngẫu nhiên | A 0.1, B 0.5 | **Xong** | Lượt đọc 4 lần; lượt ghi có mã hỏi lại tới 60 giây; dải "đang thử lại" |
| CONFIG đệm 60 giây | A 0.4 | **Xong** | Có phiên bản, không dùng bản cũ sau khi admin sửa |
| Mở cổng gộp 1 lượt, slot đệm dùng chung | A 0.5, A 0.6, B 0.6 | **Xong** | Học viên mở cổng: 1 lượt có sẵn slot |
| Đo: số đo máy chủ, trình duyệt, tab METRICS, trang health | A 0.9, B 0.7 | **Xong** | Menu "Đo tốc độ" |
| Đối soát mỗi giờ (trùng giờ, quá buổi mỗi ngày, trễ Calendar) | B 0.8 | **Xong** | Một email gộp mỗi lượt |
| Chống ghi nhầm dòng khi admin sắp xếp tab | B F8 | **Xong** | Kiểm cột khoá trước khi ghi |
| Trang "Đang bảo trì" chuyên nghiệp | B 0.10 | 5G | Cùng quy trình cập nhật khi đang chạy |
| Điểm thử tải chỉ bật trên STAGING (k6) | A 0.10 | 5G | Cần quyết định Q5 |
| Lưu trữ hằng tháng | A 0.11, B 0.9 | 5G | Bắt buộc trước tháng thứ 3 |
| `slotWindowData_` không đọc cả BOOKINGS | A 0.7 | 5G | Đi cùng lưu trữ hằng tháng |

## 4. Lộ trình khuyến nghị (go live ngay trên Apps Script, không đóng băng)

```
Giai đoạn 0  (đang làm: 5F xong, 5G còn lại)    cứng hoá, đo, thử tải          0 USD thêm
     │  chuyển khi 1 dòng ở bảng 4.2 đúng
Giai đoạn 1  (1 đến 1,5 tuần)                    email chuyên dụng, slot ra Cloudflare   0 đến 30 USD/tháng
     │  chuyển khi 1 dòng ở bảng 4.4 đúng
Giai đoạn 2  (4 đến 6 tuần, chạy bóng 2 tuần)    dữ liệu sang D1 + Durable Object       khoảng 5 đến 70 USD/tháng
     │
Giai đoạn 3  (hàng nghìn buổi mỗi ngày)          Calendar qua tài khoản dịch vụ hoặc phòng Meet cố định
```

### 4.1 Giai đoạn 0 · Việc 2 anh tự làm, từng bước (không cần code)

1. **Tách tài khoản STAGING khỏi admin@.** Cả hai chuyên gia coi đây là việc rẻ nhất và đáng nhất. Lý do: hạn mức 30 lượt tính theo người dùng; STAGING cùng chủ admin@ thì mọi lần thử, nhất là thử tải, ăn vào 30 lượt của PRODUCTION.
   * Cách rẻ (chuyên gia A): tạo Gmail miễn phí, ví dụ `thaiput.staging@gmail.com`, bật xác minh 2 bước. Làm lại file STAGING dưới tài khoản này theo `HUONG_DAN_CHAY_THU_GMAIL.md`. Gmail thường chỉ 100 email mỗi ngày: đủ cho thử.
   * Cách chuẩn (chuyên gia B): thêm người dùng `staging@<tên miền>` gói Business Starter (đại lý Việt Nam ghi khoảng 220.000 đồng mỗi tháng chưa VAT, cần anh kiểm lại giá).
2. **Kỷ luật cập nhật code PRODUCTION.** Không bao giờ gõ sửa code trong trình soạn thảo của PRODUCTION. Code chỉ đi một đường: em sửa trong `src/`, test xanh, lên STAGING, anh kiểm, rồi mới lên PRODUCTION theo luật 38. 5G viết thành quy trình có đường lùi.
3. **Bảo vệ tab dữ liệu.** File PRODUCTION, tab BOOKINGS: Dữ liệu, Bảo vệ trang tính và dải ô, chọn "Hiển thị cảnh báo khi chỉnh sửa". Làm tương tự cho AVAILABILITY, AUTH, STUDENT_PACKAGES, PAYMENTS, ACTIVITY_LOG. Muốn xem theo điều kiện thì dùng **Chế độ xem bộ lọc**, không bấm sắp xếp trên dữ liệu thật. (Code đã tự chống ghi nhầm dòng khi có người sắp xếp, nhưng đây là lớp bảo vệ thứ hai.)
4. **Giám sát từ bên ngoài.** Tạo tài khoản UptimeRobot, thêm Monitor kiểu HTTP(s), URL `<link /exec của web app>?page=health`, chu kỳ 5 phút, báo về email và điện thoại. Lưu ý: gói Free ghi "cho dự án cá nhân, phi lợi nhuận"; dùng cho kinh doanh nên tính gói trả phí (khoảng 7 đến 12 USD mỗi tháng tuỳ kỳ trả).
5. **Không tạo đỉnh nhân tạo.** Không nhắn cả lớp "20:00 mở lịch". Cần mở đồng loạt thì chia nhóm, mỗi nhóm cách 10 phút.
6. **Thử tải trên STAGING trước go live** (mục 7).

### 4.2 Điều kiện chuyển sang giai đoạn 1 (1 dòng đúng là đủ, đo 7 ngày gần nhất)

| Chỉ số | Ngưỡng | Lấy ở đâu |
|---|---|---|
| Học viên hoạt động mỗi tháng | > 300 | tab USERS |
| Người nhận email mỗi ngày (đỉnh) | > 1.000 (67% của 1.500) | MAIL_LOG |
| Lượt thất bại người dùng thấy giờ cao điểm | > 0,3% | METRICS `_client_fail` |
| p95 xem slot | > 3 giây trong 3 ngày | METRICS |
| Anh dự định chiến dịch "mở lịch đồng loạt" hoặc khuyến mãi giờ vàng | có | lịch marketing |

### 4.3 Giai đoạn 1 · Email chuyên dụng, slot đọc từ Cloudflare

**Code (em làm):** kênh gửi email `MAIL_PROVIDER = MAILAPP | RESEND | SES`, khoá API trong Script Properties; một Cloudflare Worker nhỏ nhận bản chụp slot (không có dữ liệu cá nhân) từ Apps Script, trình duyệt đọc slot từ đó; Apps Script đẩy bản chụp sau mỗi thay đổi và mỗi 5 phút. Đặt lịch vẫn kiểm lại trong khoá ở Apps Script.

**Anh làm, từng bước:**
1. Email (chọn 1). Resend dễ hơn: resend.com, đăng ký, Domains, thêm `mail.<tên miền>`, chép 3 đến 4 bản ghi DNS (SPF, DKIM) sang nơi quản lý tên miền, chờ "Verified", tạo API key quyền "Sending access", dán vào Script Properties theo hướng dẫn em viết. Amazon SES rẻ hơn khi lớn (0,10 USD mỗi 1.000 email) nhưng cần tài khoản AWS có thẻ và xin thoát chế độ thử. Dùng tên miền phụ `mail.` để uy tín gửi thư của email hệ thống tách khỏi hộp thư admin@.
2. Cloudflare: dash.cloudflare.com, đăng ký. Giai đoạn 1 chưa cần chuyển DNS, dùng địa chỉ `<tên>.workers.dev`. Workers & Pages, Create, tên `thaiput-slots`, dán code em viết, Deploy. Tạo KV namespace `SLOTS`, gắn vào Worker. Thêm Secret `PUSH_KEY` (chuỗi ngẫu nhiên em tạo), dán cùng chuỗi vào Script Properties.
3. Chạy lại thử tải.

Một điểm chưa kiểm được, phải thử trên STAGING đầu giai đoạn 1: trang trong khung Google Sites gọi được `workers.dev` hay không.

### 4.4 Điều kiện chuyển sang giai đoạn 2 (1 dòng đúng là đủ)

| Chỉ số | Ngưỡng |
|---|---|
| Học viên hoạt động mỗi tháng | > 700, hoặc kế hoạch đạt 1.000 trong 3 tháng |
| p95 chờ khoá khi đặt | > 2 giây trong 3 ngày (METRICS `_lock_wait`) |
| Lỗi bận trên tổng lượt đặt | > 0,5% mỗi tuần |
| Tổng ô trong file DB | > 5 triệu |
| Sai dữ liệu do sửa tay trên Sheets | ≥ 1 lần mỗi tháng |

### 4.5 Giai đoạn 2 · Dữ liệu thật sang Cloudflare D1, Apps Script làm "công nhân"

```
Trình duyệt ──> Cloudflare Worker (app.<tên miền>): trang web và API
   Đặt lịch: Worker ──> Durable Object "Bàn đặt chỗ" (một bản duy nhất, xử lý lần lượt)
                       ──> D1: một giao dịch (booking, gói, hàng đợi email và Calendar, nhật ký)
                           chỉ mục duy nhất chặn trùng kể cả khi code sai
             trả kết quả khoảng 0,2 đến 1 giây (ước tính)
Apps Script (dưới admin@, chỉ chạy bằng trigger):
   mỗi 1 đến 5 phút: lấy hàng đợi Calendar từ Worker, tạo sự kiện Meet, báo lại link
   mỗi 1 đến 5 phút: chép thay đổi vào các tab Sheets (bảng xem cho admin)
   onEdit tab "LỆNH": duyệt đăng ký, duyệt huỷ... gọi API Worker
```

**Chống trùng ba lớp:** Durable Object xử lý tuần tự; D1 batch là giao dịch; chỉ mục duy nhất có điều kiện (ví dụ một tutor một giờ chỉ một booking giữ chỗ). Lớp 3 là lưới cuối mà Sheets không làm được.

**Không mất booking:** D1 Time Travel khôi phục tới bất kỳ phút nào trong 30 ngày, cộng bản sao Sheets cập nhật vài phút một lần, cộng bản xuất SQL hằng đêm.

**Vì sao Calendar vẫn để Apps Script:** gọi Calendar từ ngoài cần tài khoản dịch vụ, và tài khoản dịch vụ không mời được khách nếu không bật ủy quyền toàn miền (cấu hình bảo mật khó cho người không lập trình). Code `CalendarSync.gs` hiện tại dùng lại nguyên.

**Đi tiếp từ 5F, không bỏ công:** hàng đợi Calendar, mã chống trùng, đối soát, số đo, luật nghiệp vụ dạng hàm thuần đều dùng lại ở giai đoạn 2.

**Anh làm, từng bước:** tạo GitHub, kho riêng tư `thaiput-app`; Cloudflare nối kho, mỗi lần em đẩy code nhánh `main` là tự triển khai, nhánh `staging` cho STAGING; tạo D1 `thaiput-prod`, `thaiput-staging`; nâng Workers Paid 5 USD (cần cho Time Travel 30 ngày). **Chuyển DNS tên miền sang Cloudflare là bước nguy hiểm nhất**: phải kiểm tay đủ MX, SPF, DKIM của Google Workspace và bản ghi Google Sites trước khi đổi nameserver; thiếu MX là mất email toàn tên miền. Làm buổi sáng ngày thường, có em hướng dẫn trực tiếp. **Chạy bóng 2 tuần** (Apps Script vẫn là nguồn thật, mọi lượt ghi gửi song song sang Worker, so sánh mỗi giờ), lệch bằng 0 trong 7 ngày mới chuyển. Diễn tập quay lui và diễn tập khôi phục D1 trước ngày chuyển.

### 4.6 Bảng so sánh phương án

| | A. Apps Script cứng hoá | B. Cửa trước Cloudflare (giai đoạn 1) | C. D1 + Durable Object (giai đoạn 2) | D. Supabase (thay C) |
|---|---|---|---|---|
| Hết giới hạn 30 lượt | Không, chỉ đẩy xa | Gần như (lượt đọc không qua Apps Script) | Có | Có |
| Lưới chống trùng ở tầng dữ liệu | Không (khoá + đối soát) | Không | Có | Có, mạnh nhất |
| p95 đặt lịch, ước tính | 3 đến 6 giây | 2 đến 5 giây | dưới 1,5 giây | dưới 1,5 giây |
| Chi phí thêm mỗi tháng ở 100 / 1.000 / 10.000 học viên (ước tính) | 0 / 6 đến 29 / không khả thi | 5 / 11 đến 34 / không khả thi | 5 / 11 đến 34 / khoảng 66 | 25 / 31 đến 59 / 90 đến 135 |
| Thời gian làm | xong ở 5F, 5G | 1 đến 1,5 tuần | 4 đến 7 tuần | 5 đến 8 tuần |
| Độ khó vận hành cho 2 người không lập trình | Thấp | Trung bình | Trung bình | Trung bình đến khó |
| Khoá nhà cung cấp | Google (đã có) | Thấp | Trung bình (D1 là SQLite, xuất được) | Thấp nhất (Postgres) |
| Quay lui | Công tắc CONFIG, phiên bản triển khai | 1 phút: đổi link | Công tắc từng phần | Công tắc từng phần |

Firebase và Cloud Run bị cả hai chuyên gia loại: Firebase khoá nhà cung cấp cao và có rủi ro chi phí bỏ chạy khi code lỗi; Cloud Run bản thân không có cơ sở dữ liệu, vận hành nặng hơn mà không thêm lợi ích ở quy mô này.

## 5. Nói thẳng về "bằng bất cứ giá nào"

* **Viết lại toàn bộ trước go live là đổi rủi ro tải (chưa xảy ra ở 100 học viên) lấy rủi ro lỗi mới (chắc chắn xảy ra).** Hai chuyên gia cùng phản đối. Code mới luôn có lỗi chưa thấy; lượt soát 5F vừa tìm ra 2 lỗi mức Cao trong code đã có test xanh.
* **Chi phí lớn nhất không nằm trong bảng giá:** giờ làm của 2 anh và một lần sai dữ liệu (hoàn tiền, mất uy tín). Vì vậy tiền nên đổ vào lưới an toàn dữ liệu trước, tốc độ sau.
* **Không đóng băng chỉ an toàn khi có đủ 3 thứ:** STAGING tách tài khoản, quy trình đưa code có đường lùi, và số đo tự động. 5F có số đo; 5G làm quy trình; tách tài khoản là việc của anh (mục 4.1).
* **admin@ dùng chung vẫn là điểm hỏng lớn nhất**, lớn hơn mọi giới hạn tải: bị Google khoá vì đăng nhập lạ là toàn hệ thống dừng. Tối thiểu: xác minh 2 bước bằng ứng dụng hoặc khoá bảo mật, mã dự phòng in ra cất ngoài máy, email và số khôi phục do người còn lại giữ.

## 6. Quyết định "Calendar gom 23h": đánh giá thẳng

**Lợi ích thật:** tạo sự kiện Meet tốn 1 đến 3 giây gọi Google. Bỏ việc đó khỏi lượt bấm "Đặt" làm lượt chạy ngắn hơn, chiếm 1 trong 30 lượt ngắn hơn. Lợi ích này có thật, và đã đạt.

**Nhưng lợi ích đó đạt trọn vẹn bằng hàng đợi vài phút, không cần chờ tới 23h.** Cái giá riêng của 23h:
1. **Thư mời và chuông điện thoại lúc 23:00 tới 24:00.** Trigger theo giờ chạy ngẫu nhiên trong giờ đó. Không chuyên nghiệp.
2. **Email xác nhận không có link Meet.** Đã xử lý: email và cổng học viên ghi "link Meet đến cùng lời mời Google Calendar, khoảng 23:05 12/10".
3. **Buổi sát giờ** (admin đặt thay buổi tối nay, hoặc khi bật đặt trong ngày): đã xử lý bằng đường gấp, tạo ngay khi đặt.
4. **Một điểm hỏng mỗi đêm:** đã xử lý bằng thử lại trong cùng đêm (5, 10, 15, 20 phút), báo Khẩn ngay khi cả lô lỗi, tổng kết lô đêm sau 00:00, đối soát mỗi giờ.
5. **Ngược khuyến nghị của Google** (tránh job dồn nửa đêm) và đúng kiểu bị bóp lời mời khi lên hàng nghìn học viên.

**Ba lựa chọn, đổi bằng một ô CONFIG, không cần code:**

| Chế độ | Ô CONFIG | Học viên có link Meet | Chuông điện thoại ban đêm | Hai chuyên gia |
|---|---|---|---|---|
| Gom 23h (đang chạy, theo anh) | `CALENDAR_MODE = NIGHTLY`, `CALENDAR_NIGHTLY_HOUR = 23` | khoảng 23:05 cùng ngày đặt | Có | Không khuyên |
| Gom sớm hơn | `NIGHTLY`, `CALENDAR_NIGHTLY_HOUR = 20` hoặc 21 | khoảng 20:05 hoặc 21:05 | Không | Chấp nhận được |
| Hàng đợi vài phút, giờ yên tĩnh 22:00 đến 07:00 | `CALENDAR_MODE = QUEUE` | trong 5 đến 10 phút | Không | **Cả hai khuyên** |

## 7. Thử tải trước go live (cổng go live)

**Công cụ:** k6 (miễn phí) bắn vào một cửa `doPost` **chỉ bật trên STAGING** gọi đúng các hàm `api*` thật, nên chiếm đúng 30 lượt như người dùng thật; Playwright chạy 10 đến 40 trình duyệt thật đi đúng đường `google.script.run` trong khung Google Sites; dữ liệu sinh bằng `test/tools/load_profile.js` cho 1 tháng và 12 tháng.

| # | Kịch bản | Ngưỡng đạt |
|---|---|---|
| T1 | Một người, từng thao tác, 20 lần, dữ liệu 1 và 12 tháng (menu Đo tốc độ + Playwright) | p95 xem slot ≤ 3 giây, đặt ≤ 5 giây (dữ liệu 1 tháng) |
| T2 | Buổi tối thường: 0,5 lượt mỗi giây trong 30 phút | lỗi người dùng thấy ≤ 0,5% |
| T3 | **"Nhắn cả lớp 20:00" ở 2 lần quy mô**: 200 học viên ảo vào trong 60 giây, 30 người tranh 10 slot | **0 đặt trùng, mọi lượt "thành công" có dòng, mọi lượt thua có câu rõ ràng**, lỗi sau tự thử lại ≤ 1%, p95 đặt ≤ 8 giây |
| T4 | 50 người tranh 1 slot cuối | đúng 1 thành công, 49 nhận "hết tutor" |
| T5 | Tìm trần: tăng dần lượt mỗi giây tới khi lỗi > 1% | trần ≥ 3 lần đỉnh dự kiến |
| T6 | Mất mạng giữa lượt đặt (Playwright tắt mạng) | không đặt 2 lần, trang hiện đúng sau khi có mạng |
| T7 | Hàng đợi Calendar: 50 booking dồn, huỷ 10 trước khi tạo | 40 sự kiện, 0 sự kiện cho buổi đã huỷ, mỗi lượt < 4 phút |
| T8 | Ngâm 2 giờ ở 2 lần mức thường, trigger chạy thật | không chậm dần, job không bỏ lượt quá 1 lần liên tiếp |

Không đạt T3 thì không go live, trừ khi anh chấp nhận rủi ro bằng văn bản và tạm tránh mọi hành động tạo đỉnh. **Sau go live tuyệt đối không thử tải trên STAGING nếu STAGING vẫn dưới admin@.**

## 8. Năm quyết định anh cần chốt

| # | Câu hỏi | Em khuyên | Phương án khác |
|---|---|---|---|
| **Q1** | Lộ trình kiến trúc | (a) Go live trên Apps Script đã cứng hoá, đo thật, chuyển giai đoạn theo bảng 4.2 và 4.4 | (b) Go live trên Apps Script nhưng bắt đầu viết giai đoạn 2 ngay song song (4 đến 6 tuần, khoảng 5 USD mỗi tháng). (c) Hoãn go live, làm giai đoạn 2 trước (cả hai chuyên gia phản đối) |
| **Q2** | Chế độ Calendar | `QUEUE` với giờ yên tĩnh 22:00 đến 07:00 | Giữ `NIGHTLY` 23h như hiện tại; hoặc `NIGHTLY` 20h hay 21h |
| **Q3** | Tách tài khoản STAGING | Gmail miễn phí riêng cho STAGING | `staging@<tên miền>` trả phí; hoặc giữ chung (không thử tải sau go live) |
| **Q4** | Giám sát từ ngoài | UptimeRobot gói trả phí (khoảng 7 đến 12 USD mỗi tháng) | Gói Free (điều khoản ghi phi lợi nhuận); hoặc không giám sát (không khuyên) |
| **Q5** | Thử tải trước go live (cửa `doPost` chỉ STAGING + kịch bản k6 + hướng dẫn chạy) | Làm ở 5G, anh chạy trên máy anh theo hướng dẫn (khoảng 1 buổi) | Em chỉ làm Playwright 10 trình duyệt; hoặc bỏ thử tải, dựa vào số đo sau go live |

## 9. Nguồn (xem ngày 15/10/2026)

* Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
* Class Lock: https://developers.google.com/apps-script/reference/lock/lock
* Class Cache: https://developers.google.com/apps-script/reference/cache/cache
* ClockTriggerBuilder: https://developers.google.com/apps-script/reference/script/clock-trigger-builder
* Installable triggers: https://developers.google.com/apps-script/guides/triggers/installable
* Calendar API quota: https://developers.google.com/workspace/calendar/api/guides/quota
* Calendar events (mã sự kiện do mình đặt): https://developers.google.com/workspace/calendar/api/v3/reference/events
* Avoid Calendar use limits: https://knowledge.workspace.google.com/admin/calendar/avoid-calendar-use-limits
* Gmail sending limits in Workspace: https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace
* Workspace SLA: https://workspace.google.com/terms/sla/
* Sheets 10 triệu ô: https://workspaceupdates.googleblog.com/2022/03/ten-million-cells-google-sheets.html
* Sheets API limits: https://developers.google.com/workspace/sheets/api/limits
* Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
* D1 limits: https://developers.cloudflare.com/d1/platform/limits/
* D1 Time Travel: https://developers.cloudflare.com/d1/reference/time-travel/
* Durable Objects: https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
* KV: https://developers.cloudflare.com/kv/concepts/how-kv-works/
* Supabase pricing: https://supabase.com/pricing
* Firebase pricing: https://firebase.google.com/pricing
* Cloud Run pricing: https://cloud.google.com/run/pricing
* Resend pricing: https://resend.com/pricing
* Amazon SES pricing: https://aws.amazon.com/ses/pricing/
* UptimeRobot pricing: https://uptimerobot.com/pricing/
* k6: https://grafana.com/docs/k6/latest/

**Chưa kiểm được, ghi rõ:** độ trễ thật của `google.script.run` và một lần tạo sự kiện Calendar (đo bằng menu Đo tốc độ trên STAGING); thư mời Calendar có tính vào hạn mức 1.500 của MailApp không; trang trong Google Sites gọi được `workers.dev` không; giá Workspace chính thức tại Việt Nam (trang Google không hiện số khi tải); SLA của gói Cloudflare 5 USD.

<!-- END FILE: v8/history/TU_VAN_KIEN_TRUC_16_10.md -->

---

## `v8/history/KIEN_TRUC_CHUYEN_GIA_A.md`

*Ngày tạo trong Project: 2026-10-29T14:41:16Z*

<!-- BEGIN FILE: v8/history/KIEN_TRUC_CHUYEN_GIA_A.md | bytes=60792 | sha256=d31ba03767630fb4c7c02a58c848c89fe2fad0912f10d1314b352416a7c1d414 | created=2026-10-29T14:41:16Z -->
# Báo cáo chuyên gia A · Kiến trúc để thaiput không sập, không chậm khi đông người

*Ngày viết và ngày xem mọi nguồn: 15/10/2026. Mỗi con số ghi rõ một trong ba loại: **[hạn mức]** hoặc **[giá]** (đọc từ trang chính thức, có link ở mục 10), **[code]** (đọc trực tiếp từ `/home/claude/thaiput_v8/src`), **[ước tính]** (phép tính từ giả định nêu ngay cạnh). Em không sửa file nào trong thư mục dự án.*

## 0. Tóm tắt cho người bận

1. **"Không crash, không delay cho bất cứ ai bằng bất cứ giá nào" không đạt được tuyệt đối**, với bất kỳ nền tảng nào và bất kỳ số tiền nào. Apps Script không nằm trong danh sách dịch vụ có cam kết SLA của Google Workspace; Cloudflare chỉ cam kết 100% ở gói Business. Hai người cùng bấm slot cuối thì một người phải thua. Thứ mua được là **mục tiêu đo được (SLO)** và **hệ thống tự hồi phục**, nêu ở mục 2.
2. Tiền không phải nút thắt: phương án mạnh nhất tốn khoảng **5 đến 70 USD mỗi tháng** ở 100 đến 10.000 học viên [giá, ước tính]. Nút thắt thật là **thời gian làm và độ phức tạp vận hành** cho 2 người không lập trình.
3. Ở quy mô go live (100 học viên), giới hạn 30 lượt chỉ bị chạm khi **nhiều người bấm trong cùng vài giây**. Nhưng code hiện tại biến lượt bị từ chối thành **lỗi hiện ra ngay** (không tự thử lại) [code]. Đó là việc phải sửa trước go live, rẻ và nhanh.
4. Lộ trình em khuyên, không đóng băng: **GĐ0** (trước go live, giữ Apps Script, làm cho lượt gọi ngắn, ít, tự thử lại an toàn, Calendar ra hàng đợi) → **GĐ1** (cửa trước Cloudflare: giao diện tĩnh, đọc slot ở biên, cổng xếp hàng giữ Apps Script dưới 30 lượt) → **GĐ2** (dữ liệu thật chuyển sang Cloudflare D1, Sheets chỉ là bảng xem của admin) → **GĐ3** (tách tài khoản tổ chức lịch, email chuyên dụng khối lớn). Mỗi bước kích hoạt bằng số đo, mục 5.
5. Quyết định **"Calendar gom lúc 23h": đúng hướng (tách Calendar khỏi lượt bấm của người dùng), sai thời điểm.** Gom một cục lúc 23h làm lời mời rung điện thoại lúc nửa đêm, dồn lời mời vào một khoảng ngắn (chính là điều kiện Google bóp lời mời ra ngoài tên miền), hỏng với buổi đặt sát giờ, và một lần lỗi làm hỏng cả ngày. Cách đúng: **hàng đợi lịch xử lý liên tục mỗi 5 phút, có giờ yên lặng 22:00 đến 07:00 và ưu tiên buổi gần nhất**, mục 6.

## 1. Kiểm chứng hạn mức và giá

### 1.1 Hạn mức Google liên quan (tài khoản Workspace)

| Hạn mức | Giá trị | Ý nghĩa với thaiput | Nguồn |
|---|---|---|---|
| Lượt chạy đồng thời mỗi người dùng | **30** [hạn mức] | Web app "Execute as me" luôn chạy dưới danh tính chủ (`admin@`), nên mọi học viên, tutor, admin, mọi trigger, mọi lần `onEdit` **dùng chung 30 lượt này** | Quotas, mục Current limitations; trang Web Apps: "the script always executes as you, the owner of the script, no matter who accesses the web app" |
| Lượt chạy đồng thời mỗi script | 1.000 [hạn mức] | Chỉ có ích khi web app chạy dưới danh tính người truy cập, tức học viên phải đăng nhập Google và được cấp quyền: đã loại | Quotas |
| Thời gian một lần chạy | 6 phút [hạn mức] | Job gom lịch, sao lưu, lưu trữ phải chia lô | Quotas |
| Tổng thời gian trigger mỗi ngày | 6 giờ [hạn mức] | Job mỗi 1 đến 5 phút vẫn vừa nếu thoát nhanh khi không có việc | Quotas |
| Người nhận email mỗi ngày (MailApp) | 1.500 ngoài tên miền, 2.000 trong tên miền [hạn mức] | Ở 100 học viên dùng khoảng 200 [ước tính, KE_HOACH_CHUNK5_V2 mục 3.3]. **Ở 1.000 học viên vượt** | Quotas |
| Sự kiện Calendar tạo mỗi ngày (Apps Script) | 10.000 [hạn mức] | 4.300 mỗi ngày ở 10.000 học viên [ước tính] | Quotas |
| Calendar API | 10.000 lượt mỗi phút mỗi project; 600 lượt mỗi phút mỗi người dùng; giới hạn vận hành "có thể bị giới hạn bất cứ lúc nào", ví dụ ghi liên tiếp vào một lịch [hạn mức] | Gom nhiều sự kiện vào một lịch trong vài phút là đúng kiểu bị bóp | Calendar API quota |
| Lời mời Calendar ra ngoài tên miền | 10.000 lời mời "trong một khoảng ngắn" thì bị bóp, có thể vài giờ; hồi phục "có thể một tháng" [hạn mức] | Ở 10.000 học viên khoảng 8.600 lời mời mỗi ngày [ước tính]; gom 23h dồn hết vào một giờ | Avoid Calendar use limits |
| CacheService | khoá 250 ký tự, giá trị 100 KB, sống tối đa 6 giờ, tối đa 1.000 mục, **có thể bị xoá sớm** [hạn mức] | Dùng làm đệm được, không dùng làm nơi lưu duy nhất | Cache reference |
| LockService `getScriptLock` | Khoá chung mọi người dùng; `getDocumentLock` trả `null` trong web app độc lập [hạn mức] | Mọi thao tác ghi của cả hệ thống xếp một hàng | LockService reference |
| Trigger theo phút | `everyMinutes` chỉ nhận 1, 5, 10, 15, 30; `nearMinute` lệch ±15 phút [hạn mức] | "Đúng 23:00" không có thật; chạy trong khung giờ | ClockTriggerBuilder |
| Ô trong một file Sheets | 10 triệu ô [hạn mức] | BOOKINGS có 19 cột [code]; ở 10.000 học viên một năm khoảng 1,55 triệu dòng × 19 ≈ 29 triệu ô [ước tính]: **không chứa nổi** | Drive help 37603 |
| Sheets API (nếu đồng bộ từ ngoài vào) | 300 lượt đọc, 300 lượt ghi mỗi phút mỗi project; 60 mỗi phút mỗi người dùng [hạn mức] | Đồng bộ bảng xem phải theo lô | Sheets API limits |
| SLA | Workspace cam kết 99,9% cho Gmail, Calendar, Sheets, Meet...; **Apps Script không có trong danh sách** [hạn mức] | Không ai bồi thường khi Apps Script chậm hay lỗi | Workspace SLA |

**Độ trễ khởi động của `google.script.run` (0,5 đến 2 giây)**: em không tìm được tài liệu chính thức nào công bố con số này. Coi là **giả định cần đo** (mục 7).

### 1.2 Điều em đọc được từ code (bằng chứng, không đoán)

1. **Không tự thử lại.** `T.api` trong `src/ui/App.html` dòng 56 đến 66: `withFailureHandler` trả ngay `NETWORK` và câu "lỗi mạng". Lượt thứ 31 bị Google từ chối sẽ hiện lỗi cho người dùng, kể cả khi 1 giây sau hệ thống đã rảnh.
2. **Đặt lịch không chống gửi trùng.** `apiStudentBook` không nhận mã yêu cầu. Nếu thêm tự thử lại mà không có mã chống trùng, một lần mạng chập chờn có thể đặt hai lần (dù luật 1 buổi mỗi ngày chặn phần lớn).
3. **Mỗi lượt gọi đọc tab CONFIG từ Sheets.** `cfg_` (`src/Config.gs` dòng 223) chỉ đệm trong một lần chạy, không qua CacheService.
4. **Mỗi lượt đọc cả bảng.** `table_` (`src/Db.gs` dòng 56) dùng `getDataRange().getValues()`. `slotWindowData_` (`src/Booking.gs` dòng 208) đọc toàn bộ BOOKINGS chỉ để tìm buổi tạo gần nhất của mỗi tutor. Số ô đã đo ở `KE_HOACH_CHUNK5_V2.md` mục 3.2: xem slot 55.022 ô sau 1 tháng, 641.432 ô sau 12 tháng.
5. **Calendar và email nằm trong lượt bấm của học viên.** `bookSessionsFor_` (`src/Booking.gs` dòng 126 đến 158): sau khi nhả khoá vẫn gọi `Calendar.Events.insert` cho từng buổi, lấy khoá lần hai, rồi gửi email, tất cả trong cùng một lần chạy. Khoá đã ngắn (sửa ở 5B), nhưng **lượt chạy vẫn dài**, và theo công thức ở mục 3.2, lượt càng dài càng chiếm nhiều trong 30 lượt.
6. **Mọi thao tác ghi dùng một khoá chung**: đặt, huỷ, tutor lưu slot, xin link đăng nhập (`src/Auth.gs` dòng 83), đổi link lấy phiên (dòng 132), thoát (dòng 229), sửa hồ sơ. Một đợt 100 người xin link đăng nhập cùng lúc sẽ xếp hàng chung với người đang đặt lịch.
7. **Trigger và `onEdit` chạy dưới `admin@`** nên cũng tiêu 30 lượt. Nếu file STAGING cũng do `admin@` làm chủ thì **thử tải trên STAGING sẽ ăn vào 30 lượt của PRODUCTION**.
8. **Trigger luôn chạy code đang lưu mới nhất**, không theo phiên bản triển khai (CLAUDE.md luật 38). Với chủ trương sửa liên tục trên bản đang chạy, bấm Lưu trong trình soạn thảo PRODUCTION là thay code của job ngay lập tức.

### 1.3 Giá các dịch vụ em đề xuất (USD, xem ngày 15/10/2026)

| Dịch vụ | Gói | Giá và phần đã gồm [giá] |
|---|---|---|
| Cloudflare Workers | Free | 0 USD; 100.000 lượt mỗi ngày; 10 ms CPU mỗi lượt; quá hạn báo lỗi 1027 |
| Cloudflare Workers | Paid | **tối thiểu 5 USD mỗi tháng**; gồm 10 triệu lượt và 30 triệu ms CPU; thêm 0,30 USD mỗi triệu lượt |
| Workers static assets | mọi gói | lượt tải tài nguyên tĩnh **miễn phí, không giới hạn** |
| Durable Objects (Paid) | | gồm 1 triệu lượt, 400.000 GB giây; dữ liệu SQLite gồm 5 GB tháng |
| D1 (Paid) | | gồm 25 tỷ dòng đọc, 50 triệu dòng ghi mỗi tháng, 5 GB; CSDL tối đa 10 GB; Time Travel 30 ngày |
| Workers KV (Paid) | | gồm 10 triệu lượt đọc, 1 triệu lượt ghi; thay đổi có thể mất **60 giây hoặc hơn** mới thấy ở nơi khác |
| Queues (Paid) | | gồm 1 triệu thao tác; thêm 0,40 USD mỗi triệu; một tin nhắn thường tốn 3 thao tác |
| Supabase | Free | 0 USD; **tạm dừng sau 1 tuần không hoạt động**: không dùng cho bản thật |
| Supabase | Pro | **từ 25 USD mỗi tháng**, gồm 10 USD tín dụng máy (đủ cỡ Micro, 1 GB RAM); cỡ Small khoảng 15 USD, Medium khoảng 60 USD; sao lưu hằng ngày giữ 7 ngày; email đăng nhập dùng máy gửi sẵn có chỉ **2 email mỗi giờ**, phải gắn SMTP riêng |
| Firebase | Blaze | Firestore miễn phí 50.000 lượt đọc, 20.000 lượt ghi mỗi ngày; sau đó 0,03 USD mỗi 100.000 lượt đọc, 0,09 USD mỗi 100.000 lượt ghi; Functions miễn phí 2 triệu lượt mỗi tháng |
| Cloud Run | | miễn phí 2 triệu lượt, 180.000 vCPU giây mỗi tháng; sau đó 0,40 USD mỗi triệu lượt |
| Resend (email) | Free / Pro / Scale | 3.000 email mỗi tháng, tối đa 100 mỗi ngày / **20 USD** cho 50.000 / 90 USD cho 100.000; thêm 0,90 USD mỗi 1.000 |
| Amazon SES (email) | | **0,10 USD mỗi 1.000 email** |
| Grafana Cloud k6 (thử tải trên mây) | Free | 500 giờ người dùng ảo mỗi tháng; k6 chạy trên máy mình thì miễn phí |
| UptimeRobot | Free / Solo | 50 điểm theo dõi, 5 phút một lần, ghi là "cho dự án sở thích và phi lợi nhuận" / Solo khoảng 12 USD mỗi tháng (trả năm) |
| Google Workspace | | Anh đã trả cho `admin@`. Trang giá công khai không hiện số khi em đọc, nên em **không ghi giá** một tài khoản thêm; xem trong Admin console |

Quy đổi tiền Việt em dùng **26.000 đồng mỗi USD [ước tính tỷ giá]**.

## 2. Nói thẳng: "không crash, không delay bằng bất cứ giá nào"

### 2.1 Vì sao không đạt tuyệt đối
1. **Không nhà cung cấp nào cam kết 100% ở gói anh sẽ dùng.** Apps Script ngoài SLA. Cloudflare chỉ cam kết 100% cho khách hàng gói Business; trang Workers không công bố SLA cho Free hay Paid.
2. **Mạng của học viên** (4G yếu, wifi quán cà phê) nằm ngoài tầm kiểm soát.
3. **Tranh chấp là bản chất nghiệp vụ.** 50 người cùng muốn slot 20:00 tối thứ Sáu, 1 tutor rảnh: 49 người nhận "hết chỗ". Đó không phải lỗi, nhưng với người dùng nó là "không được như ý".
4. **Anh chọn sửa liên tục trên bản đang chạy.** Mỗi lần đưa code mới là một lần rủi ro. Phần lớn sự cố của hệ thống nhỏ đến từ chính thay đổi của mình, không từ tải.
5. **Độ trễ có sàn vật lý.** Một lượt Apps Script có thời gian khởi động; một lượt từ Việt Nam đi tới máy chủ ở nước khác có thời gian truyền. "Không delay" phải hiểu là "nhanh tới mức người dùng không thấy chờ".

### 2.2 Tiền mua được gì
* Bỏ các trần cứng (30 lượt, 1.500 email, 10 triệu ô) ra khỏi đường đi của người dùng.
* Biến lỗi thành chờ ngắn (xếp hàng, tự thử lại an toàn).
* Đo được và báo động sớm, trước khi học viên nhắn Zalo.
* Đường lùi trong vài phút khi bản mới hỏng.

### 2.3 Mục tiêu đo được (SLO) em đề xuất

| Chỉ số (SLI) | Cách tính | GĐ0 Apps Script | GĐ1 cửa trước Cloudflare | GĐ2 dữ liệu D1 |
|---|---|---|---|---|
| Thao tác thành công | số thao tác người dùng thấy thành công (sau tự thử lại) ÷ tổng, tính theo tháng | ≥ 99,5% | ≥ 99,9% đọc; ≥ 99,5% ghi | ≥ 99,9% |
| Xem slot | p95 thời gian từ bấm tới hiện danh sách, đo ở trình duyệt | ≤ 3 giây | ≤ 0,8 giây | ≤ 0,5 giây |
| Đặt lịch | p95 từ bấm "Đặt" tới thấy kết quả | ≤ 6 giây | ≤ 5 giây | ≤ 1,5 giây |
| Lỗi người dùng thấy | sau tự thử lại | < 0,5% | < 0,2% | < 0,1% |
| Toàn vẹn | đặt trùng slot, booking mất (đã báo thành công mà không có dòng) | **0, không có ngân sách lỗi** | 0 | 0 |
| Email xác nhận | gửi đi trong 5 phút sau khi đặt | ≥ 99% | ≥ 99% | ≥ 99,5% |
| Lời mời lịch và link Meet | có trước giờ học ít nhất 2 giờ | ≥ 99,5% | ≥ 99,5% | ≥ 99,9% |

* "p95 ≤ 3 giây" nghĩa là 95 trên 100 lượt xong trong 3 giây.
* 99,5% mỗi tháng tương đương khoảng 3,6 giờ "không dùng được" quy đổi. Đó là **ngân sách lỗi**: tiêu hết trong tháng thì ngừng đưa tính năng mới, chỉ sửa độ ổn định. Đây là cách duy nhất để chủ trương "sửa liên tục" không ăn mòn độ tin cậy.
* Các con số ở cột GĐ1, GĐ2 là **mục tiêu [ước tính]**, phải được xác nhận bằng thử tải (mục 7) trước khi cam kết với học viên.

### 2.4 Đo thế nào
* **Ở trình duyệt (nguồn sự thật cho trải nghiệm):** bọc `T.api` đo thời gian từng lượt, số lần thử lại, lý do lỗi. Gửi kèm số đo của các lượt trước **vào lượt gọi kế tiếp** (không tạo thêm lượt chạy). Server cộng dồn trong CacheService theo phút; job mỗi giờ ghi 1 dòng tổng hợp vào tab METRICS (p50, p95, lỗi, số lần thử lại theo từng hàm).
* **Ở server:** mỗi hàm `api*` ghi `console.log` một dòng JSON {hàm, bắt đầu, thời gian, chờ khoá, ok}. `exceptionLogging: STACKDRIVER` đã bật trong `appsscript.json` [code]; gắn script vào một project Google Cloud chuẩn để xem và lọc log. Từ thời điểm bắt đầu và kết thúc tính được **số lượt chồng nhau cao nhất mỗi phút**, chỉ số báo trước giới hạn 30.
* **Từ bên ngoài:** một điểm theo dõi gọi trang mỗi 5 phút (UptimeRobot hoặc Cloudflare khi có GĐ1), báo Zalo hoặc email khi lỗi 2 lần liên tiếp.
* **Báo cáo:** email tổng hợp 21:00 sẵn có thêm 3 dòng: p95 đặt lịch hôm nay, số lượt bị từ chối, số lượt chồng nhau cao nhất.

## 3. Mô hình tải và giả định dùng cho mọi phương án

### 3.1 Giả định [ước tính]

| | 100 học viên | 1.000 | 10.000 |
|---|---|---|---|
| Tutor | 10 | 100 | 1.000 |
| Buổi mỗi ngày (3 buổi mỗi tuần mỗi học viên) | 43 | 430 | 4.300 |
| Lượt gọi API mỗi tháng (200 mỗi học viên, 300 mỗi tutor) | khoảng 23.000 | 230.000 | 2,3 triệu |
| Người nhận email mỗi ngày (theo đo ở KE_HOACH_CHUNK5_V2 mục 3.3, tỉ lệ thuận) | khoảng 200 | 2.000 | 20.000 |
| Email mỗi tháng | 6.000 | 60.000 | 600.000 |
| Lời mời lịch ra ngoài tên miền mỗi ngày (học viên và tutor dùng Gmail riêng) | khoảng 86 | 860 | 8.600 |
| Dòng BOOKINGS mỗi năm | 15.500 (đo) | 155.000 | 1,55 triệu |

### 3.2 Công thức quyết định giới hạn 30 lượt
**Số lượt chạy chồng nhau ≈ số lượt gọi mỗi giây × thời gian một lượt (giây).**

| Tình huống [ước tính, thời gian một lượt giả định 3 giây] | 100 | 1.000 | 10.000 |
|---|---|---|---|
| Giờ cao điểm bình thường (30% lượt trong ngày rơi vào 19:00 đến 21:00, nhân 5 cho đợt dồn trong một phút) | khoảng 0,5 lượt chồng | khoảng 5 | khoảng 50: **vượt 30 hằng ngày** |
| Nhắn cả lớp "20:00 mở lịch", mọi người vào trong 20 giây, mỗi người 3 lượt | khoảng 45: **vượt** | hàng trăm | hàng nghìn |
| Thời gian một lượt khi dữ liệu 12 tháng không lưu trữ | đã đo khối lượng tăng 11 lần | lớn hơn nữa | không chạy được |

Kết luận: ở 100 học viên, rủi ro chỉ là **đợt dồn do chính mình tạo ra** và **lỗi hiện ngay vì không tự thử lại**. Ở 1.000, Sheets chậm dần kéo dài mỗi lượt và đẩy số lượt chồng lên. Ở 10.000, Apps Script cộng Sheets không thể là nguồn dữ liệu nữa.

## 4. Các phương án kiến trúc

Bốn phương án, xếp từ ít thay đổi tới nhiều thay đổi. Phần nghiệp vụ đã viết thành hàm thuần (CLAUDE.md luật 7: `Assign.gs`, `Packages.gs`, `Time.gs`...) chạy được trong mọi môi trường JavaScript, nên **dùng lại được ở cả B, C, D**. Đây là lợi thế lớn của cách đã làm.

### Phương án A · Giữ Apps Script, làm gọn (chính là GĐ0)

**Ý tưởng:** không đổi nền tảng; làm mỗi lượt ngắn hơn, ít lượt hơn, và lượt bị từ chối thành lượt chậm chứ không thành lỗi.

```
Đọc slot   : Trình duyệt → google.script.run apiStudentBoot (gộp Home + Slots)
             → đọc bản slot tính sẵn trong CacheService (theo số phiên bản) → trả về
             (hết đệm: tính lại từ Sheets, lưu đệm)
Đặt lịch   : Trình duyệt (mã yêu cầu ngẫu nhiên) → apiStudentBook
             → khoá chung → kiểm luật, ghi BOOKINGS (trạng thái lịch: CHỜ TẠO) → nhả khoá
             → email xác nhận ngay → trả kết quả (không chờ Calendar)
Huỷ        : → khoá → đổi trạng thái; lịch CHỜ TẠO thì bỏ, đã tạo thì đánh CHỜ HUỶ → email
Đăng nhập  : như hiện tại (link email, phiên đệm CacheService)
Email      : MailApp qua sendTpl_ (1.500 người nhận mỗi ngày)
Calendar   : trigger mỗi 5 phút đọc hàng đợi, tạo hoặc huỷ sự kiện, ghi link Meet, giờ yên lặng
Admin      : Sheets như hiện tại, giao diện admin web như hiện tại
Lỗi 30 lượt: trình duyệt tự thử lại sau 0,5; 1; 2; 4 giây (cộng ngẫu nhiên), tối đa 10 giây
```

* **Chống đặt trùng:** giữ `withLock_` và luật hiện tại; thêm **mã yêu cầu** (requestId) để thử lại không tạo booking thứ hai.
* **Giới hạn còn lại:** vẫn 30 lượt (chỉ đẩy xa hơn), vẫn khoá chung 30 giây, vẫn 1.500 email mỗi ngày, Sheets vẫn chậm dần nếu không lưu trữ (5G), không SLA.
* **Chi phí mỗi tháng:** 100 học viên: **0 USD** thêm. 1.000: Apps Script còn chạy nếu lưu trữ tốt, nhưng email vượt 1.500 nên cần Resend Pro 20 USD hoặc SES khoảng 6 USD [giá, ước tính]. 10.000: **không khả thi** (vượt 10 triệu ô, vượt 30 lượt hằng ngày).
* **Thời gian làm:** 7 đến 10 ngày gồm thử tải [ước tính].
* **Độ phức tạp vận hành:** thấp, như hiện tại.
* **Khoá nhà cung cấp:** cao (Apps Script) nhưng đang có sẵn.
* **Quay lui:** mỗi thay đổi có công tắc trong CONFIG; Apps Script giữ phiên bản triển khai cũ, chọn lại trong "Quản lý các lần triển khai".

### Phương án B · Cửa trước Cloudflare, Apps Script và Sheets vẫn là nguồn dữ liệu (chính là GĐ1)

**Ý tưởng:** đặt một lớp Cloudflare Workers trước Apps Script. Giao diện là file tĩnh (miễn phí, không giới hạn lượt), danh sách slot đọc từ biên, chỉ thao tác ghi mới tới Apps Script, và **một Durable Object làm "người gác cổng"** không bao giờ cho quá 20 lượt cùng lúc đi vào Apps Script; phần dư xếp hàng vài giây thay vì bị từ chối.

```
Giao diện  : app.<tên miền> → Worker trả HTML, JS tĩnh (không tốn lượt Apps Script, không còn doGet)
Đọc slot   : Trình duyệt → Worker /api/slots → bản slot JSON trong Durable Object "Snapshot"
             (Apps Script đẩy bản mới mỗi khi có đặt, huỷ, tutor lưu slot, bằng UrlFetchApp)
Đọc trang  : Worker /api/home → dữ liệu riêng từng học viên Apps Script đã đẩy lên (khoá theo mã học viên)
cá nhân      Worker biết mã học viên nhờ bảng phiên Apps Script đẩy lên lúc đăng nhập
Đặt, huỷ   : Trình duyệt → Worker /api/book (mã yêu cầu) → Durable Object "Cổng"
             (đếm lượt đang bay ≤ 20, còn lại xếp hàng tối đa 20 giây)
             → fetch POST tới Apps Script doPost (chữ ký bí mật dùng chung) → withLock_ như cũ
             → trả kết quả; Worker tự thử lại khi Apps Script từ chối
Đăng nhập  : xin link và đổi link vẫn qua Cổng tới Apps Script; email như cũ
Email      : MailApp; khi vượt 1.000 người nhận mỗi ngày chuyển sang Resend hoặc SES
Calendar   : hàng đợi Apps Script như phương án A
Admin      : Sheets và giao diện admin như hiện tại
```

* **Chống đặt trùng:** không đổi (`withLock_` trong Apps Script). Cổng còn giảm tranh chấp khoá vì số lượt vào cùng lúc có trần.
* **Vì sao Durable Object mà không phải KV cho bản slot:** KV có thể trễ 60 giây hoặc hơn mới thấy thay đổi [hạn mức]. Học viên sẽ thấy slot vừa bị đặt vẫn trống. Durable Object nhất quán mạnh và đơn luồng [hạn mức].
* **Giới hạn còn lại:** sức ghi vẫn là một hàng qua khoá chung (khoảng 30 đến 60 lượt đặt mỗi phút nếu mỗi lượt giữ khoá 1 đến 2 giây [ước tính]); Sheets vẫn lớn dần; 6 phút; 1.500 email. Lượt chờ ở cổng là **delay có kiểm soát**, không phải lỗi.
* **Chi phí mỗi tháng [giá, ước tính]:** 100: **5 USD**. 1.000: 5 USD + email 6 đến 29 USD. 10.000: **không khả thi** (Sheets không chứa nổi, sức ghi qua một khoá).
* **Thời gian làm:** 8 đến 12 ngày [ước tính].
* **Độ phức tạp vận hành:** trung bình. Thêm một tài khoản Cloudflare, chuyển DNS tên miền về Cloudflare, cài Node.js để triển khai Worker.
* **Khoá nhà cung cấp:** thấp. Worker chỉ là lớp mỏng; bỏ nó đi thì Apps Script vẫn chạy.
* **Quay lui:** trong 1 phút: đổi nút "Đặt lịch" trên Google Sites trỏ về link Apps Script cũ. Web app Apps Script cũ **giữ chạy song song** suốt GĐ1.

### Phương án C · Dữ liệu thật ở Cloudflare D1, Sheets chỉ là bảng xem của admin (chính là GĐ2)

**Ý tưởng:** nguồn dữ liệu chuyển sang D1 (SQL, sao lưu Time Travel 30 ngày). Mọi thao tác người dùng chạy hoàn toàn ở Cloudflare. Apps Script chỉ còn 3 việc nó làm tốt nhất và không đụng người dùng: **tạo lịch và Meet dưới `admin@`**, **đồng bộ bảng xem Sheets**, **menu admin**.

```
Giao diện   : Worker tĩnh (như B)
Đọc slot    : Worker → bảng tổng hợp slot_capacity (ngày, slot, số tutor mở, số đã đặt) trong D1
              + đệm 5 đến 10 giây ở Worker (mọi học viên xem chung)
Đặt lịch    : Worker → Durable Object "Điều phối đặt lịch" (một bản duy nhất, xử lý lần lượt từng yêu cầu)
              → đọc ứng viên, chọn tutor bằng pickTutor_ (dùng lại hàm thuần)
              → D1 batch (giao dịch): INSERT booking + cập nhật gói + ghi outbox email, outbox lịch
              → trả kết quả trong khoảng 0,2 đến 1 giây [ước tính]
Huỷ         : như trên, đổi trạng thái + outbox
Đăng nhập   : Worker tự làm link email (băm SHA 256 như hiện tại), phiên trong D1, đệm ở Worker
Email       : Queue → Resend hoặc SES (tự thử lại, không mất thư)
Calendar    : trigger Apps Script mỗi 5 phút gọi Worker /internal/calendar-outbox (chữ ký bí mật)
              → tạo sự kiện bằng Calendar Advanced Service dưới admin@ → gửi lại event_id, link Meet
Admin Sheets: trigger Apps Script mỗi 5 đến 10 phút kéo dòng thay đổi từ Worker → ghi tab xem (khoá sửa)
              Thao tác admin: giao diện admin web (đã có) hoặc ô dropdown → onEdit → gọi Worker
```

* **Vì sao Calendar vẫn để Apps Script:** gọi Calendar trực tiếp từ Cloudflare cần tài khoản dịch vụ. Tài khoản dịch vụ không mời được khách nếu không bật ủy quyền toàn miền (Domain Wide Delegation) [cộng đồng ghi nhận lỗi "Service accounts cannot invite attendees without Domain Wide Delegation of Authority", nguồn mục 10]. Để Apps Script làm thì giữ nguyên code `CalendarSync.gs` đang chạy, không phải cấu hình bảo mật khó.
* **Chống đặt trùng, hai lớp:**
  1. Mọi yêu cầu đặt đi qua **một Durable Object duy nhất**: đơn luồng [hạn mức], thay đúng vai `LockService` nhưng mỗi lượt giữ vài mili giây thay vì 1 đến 2 giây.
  2. **Chỉ mục duy nhất trong D1** làm lưới cuối:
     ```sql
     CREATE UNIQUE INDEX one_tutor_slot ON bookings(tutor_id, date, slot)
       WHERE status IN ('CONFIRMED','COMPLETED','STUDENT_ABSENT','TUTOR_ABSENT','TECH_ISSUE');
     ```
     D1 batch là giao dịch, lỗi một câu thì huỷ cả lô [hạn mức]. D1 xử lý từng truy vấn một [hạn mức].
* **Giới hạn còn lại:** Durable Object khoảng 1.000 lượt mỗi giây mỗi bản [hạn mức], dư sức; D1 10 GB mỗi CSDL [hạn mức]; Calendar vẫn dưới một tài khoản `admin@` (vấn đề ở 10.000, xem GĐ3).
* **Chi phí mỗi tháng [giá, ước tính]:**

  | | 100 | 1.000 | 10.000 |
  |---|---|---|---|
  | Workers Paid (gồm D1, Durable Objects, KV trong phần đã gồm) | 5 | 5 | 5 đến 6 (Queues thêm khoảng 0,3) |
  | Email bằng SES | khoảng 0,6 | khoảng 6 | khoảng 60 |
  | Email bằng Resend (dễ cài hơn) | 20 | khoảng 29 | khoảng 540 |
  | **Tổng (chọn SES ở quy mô lớn)** | **6 đến 25 USD** | **11 đến 34 USD** | **khoảng 66 USD** (khoảng 1,7 triệu đồng) |

  Phép tính D1 ở 10.000 học viên: nếu mỗi lần xem slot quét thô AVAILABILITY 14 ngày × 1.000 tutor × 8 slot thì khoảng 112.000 dòng mỗi lần, vượt 25 tỷ dòng mỗi tháng. Vì vậy **bắt buộc** có bảng tổng hợp `slot_capacity`, mỗi lần xem chỉ đọc khoảng 200 dòng.
* **Thời gian làm:** 4 đến 7 tuần [ước tính], làm song song với bản đang chạy.
* **Độ phức tạp vận hành:** trung bình. Không có máy chủ phải vá; nhưng có 2 nơi chứa code (Worker, Apps Script) và 1 CSDL phải hiểu.
* **Khoá nhà cung cấp:** trung bình. D1 là SQLite: xuất được file SQL sang bất kỳ CSDL nào. Durable Object là riêng của Cloudflare, nhưng chỉ làm việc điều phối, thay được bằng khoá của Postgres.
* **Quay lui:** chuyển theo từng phần có công tắc (mục 5, GĐ2). Trong 2 tuần đầu, Apps Script tiếp tục ghi song song vào Sheets như bản dự phòng nóng.

### Phương án D · Supabase (Postgres) làm nguồn dữ liệu (phương án thay cho C)

```
Giao diện   : Cloudflare tĩnh hoặc Supabase không phục vụ tĩnh → vẫn cần nơi đặt giao diện
Đọc slot    : PostgREST / hàm SQL, có quyền theo dòng (RLS)
Đặt lịch    : gọi hàm Postgres book_sessions() (một giao dịch, khoá dòng tutor theo slot
              + chỉ mục duy nhất từng phần như phương án C)
Đăng nhập   : Supabase Auth link email có sẵn (bắt buộc gắn SMTP riêng: máy gửi sẵn có chỉ 2 email mỗi giờ)
Email       : Edge Function → Resend hoặc SES
Calendar    : trigger Apps Script kéo hàng đợi qua REST (khoá dịch vụ để trong Script Properties)
Admin Sheets: trigger Apps Script kéo về; hoặc admin xem thẳng bảng trong Supabase Studio
```

* **Chống đặt trùng:** giao dịch Postgres và chỉ mục duy nhất, đúng kiểu sách giáo khoa.
* **Chi phí mỗi tháng [giá, ước tính]:** 100: 25 USD + email. 1.000: 25 đến 30 USD + email. 10.000: 30 đến 75 USD (cỡ Small hoặc Medium) + email khoảng 60 USD. Gói Free bị tạm dừng sau 1 tuần không hoạt động, **không dùng cho bản thật**.
* **Thời gian làm:** 5 đến 8 tuần [ước tính].
* **Độ phức tạp vận hành:** trung bình đến cao: hiểu RLS, khoá dịch vụ, nâng cỡ máy, kết nối.
* **Khoá nhà cung cấp:** **thấp nhất**: Postgres chuẩn, `pg_dump` mang đi đâu cũng được.
* **Quay lui:** như C.
* **Biến thể Firebase:** Firestore giao dịch với mã tài liệu `tutor_ngày_slot` chống trùng; chi phí ở 100 học viên gần 0, ở 10.000 khoảng 10 đến 20 USD đọc ghi [ước tính]; khoá nhà cung cấp cao (dữ liệu dạng tài liệu riêng của Google), em không khuyên.
* **Cloud Run:** rẻ, mạnh, nhưng phải quản lý container, quyền IAM, khởi động lạnh. Không hợp đội không lập trình. Loại.

### 4.5 So sánh nhanh

| | A Apps Script gọn | B Cửa trước Cloudflare | C D1 nguồn dữ liệu | D Supabase |
|---|---|---|---|---|
| Hết giới hạn 30 lượt | Không, chỉ đẩy xa | Gần như: lượt đọc không qua Apps Script, lượt ghi xếp hàng | **Có** | **Có** |
| Đặt trùng | Khoá chung | Khoá chung | Điều phối đơn luồng + chỉ mục duy nhất | Giao dịch + chỉ mục |
| p95 đặt lịch [ước tính] | 3 đến 6 giây | 2 đến 5 giây | dưới 1,5 giây | dưới 1,5 giây |
| Chi phí ở 100 / 1.000 / 10.000 | 0 / 6 đến 20 / không khả thi | 5 / 11 đến 34 / không khả thi | 6 đến 25 / 11 đến 34 / khoảng 66 | 25+ / 31 đến 59 / 90 đến 135 |
| Thời gian làm | 7 đến 10 ngày | 8 đến 12 ngày | 4 đến 7 tuần | 5 đến 8 tuần |
| Vận hành cho người không lập trình | Dễ | Trung bình | Trung bình | Trung bình đến khó |
| Khoá nhà cung cấp | Cao | Thấp | Trung bình | Thấp |
| Quay lui | Công tắc, phiên bản | 1 phút, đổi link | Công tắc từng phần | Công tắc từng phần |

## 5. Khuyến nghị: một lộ trình theo giai đoạn (không đóng băng)

**Đường chính em khuyên: A → B → C.** B và C dùng chung một nền tảng nên công sức ở B không bỏ đi; C chỉ thay phần phía sau cửa. Chi phí phẳng 5 USD tới hàng nghìn học viên.

**Đường thay thế 1 (nhanh hơn, rủi ro hơn):** A → C thẳng, bắt đầu viết C ngay sau go live, chuyển trong 6 đến 8 tuần. Hợp nếu anh dự kiến tăng nhanh (chạy quảng cáo lớn trong quý đầu).
**Đường thay thế 2 (ít khoá nhà cung cấp nhất):** A → B → D. Hợp nếu anh muốn sau này thuê lập trình viên quen Postgres.

### Luật chung cho mọi giai đoạn (vì anh không đóng băng)
1. **Hai môi trường, hai tài khoản chủ.** STAGING chuyển sang một tài khoản Gmail miễn phí riêng (Gmail thường cũng có 30 lượt riêng [hạn mức]; email chỉ 100 mỗi ngày nhưng STAGING tắt email hàng loạt). Thử tải và thử nghiệm không còn ăn 30 lượt của PRODUCTION.
2. **Không bao giờ bấm Lưu code trong trình soạn thảo PRODUCTION.** Code chỉ vào PRODUCTION bằng `clasp push` sau khi STAGING xanh (vì trigger chạy ngay code vừa lưu [code, luật 38]).
3. **Hai bản triển khai trên PRODUCTION:** "ổn định" (link cho học viên) và "beta" (link cho 2 đồng sáng lập và 1 đến 2 tutor tin cậy). Bản mới chạy beta 24 giờ rồi mới chuyển ổn định.
4. **Công tắc CONFIG** cho mọi tính năng mới, mặc định tắt.
5. **Ngân sách lỗi** (mục 2.3): tháng nào tiêu hết thì tuần sau chỉ sửa ổn định.

### GĐ0 · Trước go live (giữ Apps Script). Mục tiêu: không còn lỗi hiện ra vì 30 lượt; lượt ngắn và ít

**Việc không cần code (làm ngay, 1 buổi):**
1. Quy tắc vận hành: **không nhắn cả lớp mở lịch cùng một giờ**. Tutor mở lịch dần; nếu cần mở đồng loạt thì chia nhóm, mỗi nhóm cách 10 phút.
2. Tạo tài khoản Gmail mới, ví dụ `thaiput.staging@gmail.com`, bật xác minh 2 bước. Tạo file STAGING mới dưới tài khoản này theo `HUONG_DAN_CHAY_THU_GMAIL.md`. Đặt CONFIG STAGING tắt gửi email học viên thật.
3. Bật xác minh 2 bước cho `admin@`, in mã dự phòng, như `TU_VAN_15_10.md` mục 4.
4. Tạo tài khoản UptimeRobot (hoặc dùng tạm Free trong lúc chờ GĐ1), thêm điểm theo dõi link web app, báo về email đồng sáng lập thứ hai.

**Việc phải code (giao cho AI, mỗi mục kèm tiêu chí chấp nhận):**

| # | Việc | Tiêu chí chấp nhận |
|---|---|---|
| 0.1 | `T.api` tự thử lại: lượt chỉ đọc thử lại 4 lần, chờ 0,5; 1; 2; 4 giây cộng ngẫu nhiên 0 đến 500 ms, tổng không quá 10 giây; sau 1,5 giây hiện "Đang đông người, hệ thống đang thử lại" thay vì lỗi | Test giao diện: giả lập lỗi 3 lần liên tiếp rồi thành công, người dùng không thấy lỗi |
| 0.2 | Mã yêu cầu chống trùng cho mọi lượt ghi (`apiStudentBook`, `apiStudentCancel`, `apiTutorSetAvailability`, `apiTutorSubmitResult`): trình duyệt sinh mã, server lưu kết quả theo mã trong CacheService 6 giờ và cột `request_id` (khai báo `optional`) | Gửi cùng mã 5 lần → đúng 1 booking, 5 lần cùng kết quả |
| 0.3 | Lượt ghi cũng tự thử lại (nhờ 0.2), tối đa 3 lần | Như trên |
| 0.4 | `cfg_` đệm toàn tab CONFIG trong CacheService 60 giây, xoá đệm khi admin sửa CONFIG (onEdit) | Lượt `apiStudentSlots` không còn đọc tab CONFIG khi đệm còn |
| 0.5 | Gộp `apiStudentHome` và `apiStudentSlots` lúc mở cổng thành `apiStudentBoot`; tương tự `apiTutorBoot` | Mở cổng học viên: 2 lượt chạy (doGet + Boot) thay vì 3 |
| 0.6 | Bản slot tính sẵn: một khoá `slots_v` tăng mỗi khi đặt, huỷ, tutor lưu slot, admin đổi; bản slot 21 ngày lưu trong CacheService theo phiên bản (chia mảnh dưới 100 KB); phần riêng học viên (ngày đã đặt) tính từ dữ liệu của chính học viên | Lượt xem slot thứ hai trở đi không đọc AVAILABILITY và BOOKINGS; kết quả giống hệt bản tính trực tiếp (test so sánh) |
| 0.7 | `slotWindowData_` bỏ đọc toàn bảng để tìm buổi gần nhất của tutor: lưu "lần giao gần nhất" của mỗi tutor trong Script Properties, cập nhật trong khoá | Kết quả `pickTutor_` không đổi trên bộ kịch bản 40 |
| 0.8 | Hàng đợi lịch (thay gom 23h, chi tiết mục 6): cột `cal_state`, `cal_attempts`, `cal_next_at`; `bookSessionsFor_` không gọi Calendar nữa; job `calendarOutboxJob` mỗi 5 phút | Đặt 3 buổi: lượt chạy không có lời gọi Calendar; trong 5 phút sau có sự kiện và link Meet; huỷ trước khi tạo không gọi Calendar |
| 0.9 | Đo: bọc `apiWrap_` ghi log JSON thời gian và chờ khoá; số đo trình duyệt gửi kèm lượt sau; job mỗi giờ ghi tab METRICS; thêm 3 dòng vào email tổng hợp 21:00 | Tab METRICS có p50, p95, lỗi, thử lại theo hàm |
| 0.10 | Điểm thử tải chỉ có ở STAGING: `doPost` nhận {hàm, đối số, chữ ký}, gọi đúng hàm `api*`, tắt bằng CONFIG `LOADTEST_ENDPOINT` (PRODUCTION luôn tắt, `switchToProduction` tự tắt) | Test I12 vẫn xanh; gọi khi tắt trả lỗi, không ghi gì |
| 0.11 | Lưu trữ hằng tháng (5G) kéo lên trước go live hoặc ngay tuần đầu | BOOKINGS đang dùng chỉ giữ buổi từ 35 ngày trước trở đi |

**Điều kiện được go live (cổng GĐ0):** đạt toàn bộ ngưỡng ở mục 7.3 trên STAGING.

**Thời gian [ước tính]:** 7 đến 10 ngày làm cộng 2 ngày thử tải. Nếu giữ mốc 26/10 thì ưu tiên 0.1, 0.2, 0.3, 0.8, 0.9, 0.10 trước; 0.5 đến 0.7 làm tuần đầu sau go live.

### Chuyển GĐ0 → GĐ1 khi BẤT KỲ điều nào sau đây đúng (đo trong 7 ngày gần nhất)
* p95 đặt lịch > 5 giây trong 3 ngày;
* lượt bị Google từ chối (trước khi tự thử lại) > 0,5% số lượt trong giờ cao điểm, hoặc **bất kỳ** lượt nào người dùng thấy lỗi sau tự thử lại;
* số lượt chồng nhau cao nhất trong một phút > 15 (một nửa trần 30);
* học viên đang hoạt động > 300;
* anh định chạy chiến dịch quảng cáo lớn hoặc sự kiện mở lịch đồng loạt.

**Tách riêng email** (làm bất cứ lúc nào, không phụ thuộc giai đoạn): khi người nhận mỗi ngày > 1.000 trong 3 ngày (67% của 1.500), chuyển email học viên sang Resend hoặc SES.

### GĐ1 · Cửa trước Cloudflare (phương án B)

**Bước cho người không lập trình:**
1. **Tạo tài khoản Cloudflare** tại dash.cloudflare.com bằng email `admin@`, bật xác minh 2 bước ngay (Profile → Authentication).
2. **Đưa tên miền về Cloudflare (DNS):**
   * Bấm "Add a domain", nhập tên miền, chọn gói Free.
   * Cloudflare quét bản ghi DNS. **Đối chiếu trước khi đổi**: phải thấy đủ bản ghi MX của Google (email Workspace), TXT có `v=spf1 include:_spf.google.com`, TXT `google._domainkey` (DKIM), bản ghi của Google Sites. Thiếu cái nào thì mở trang quản lý DNS cũ, chép sang. Thiếu MX là **mất email công ty**.
   * Cloudflare đưa 2 nameserver. Vào trang quản trị của nhà đăng ký tên miền (nơi anh mua tên miền), mục "Nameserver" hoặc "Máy chủ tên miền", thay bằng 2 nameserver đó. Chờ tới khi Cloudflare báo "Active" (thường vài giờ, có thể tới 24 giờ).
   * Ngay sau khi Active: gửi thử 1 email tới `admin@` từ Gmail ngoài và ngược lại.
3. **Bật Workers Paid:** Workers & Pages → Plans → Workers Paid, 5 USD mỗi tháng, thẻ Visa hoặc Mastercard thanh toán quốc tế.
4. **Cài công cụ trên máy tính:** Node.js bản LTS từ nodejs.org; Visual Studio Code. Mở Terminal:
   ```bash
   npm create cloudflare@latest thaiput-edge
   cd thaiput-edge
   npx wrangler login
   ```
5. **Giao AI viết Worker** theo đặc tả ở bảng "việc phải code" dưới đây, rồi:
   ```bash
   npx wrangler secret put APPS_SCRIPT_URL      # dán link /exec của web app Apps Script
   npx wrangler secret put EDGE_SHARED_SECRET   # chuỗi ngẫu nhiên dài, giữ giống Script Properties
   npx wrangler deploy
   ```
6. **Gắn tên miền:** Worker → Settings → Domains & Routes → Add Custom Domain → `app.<tên miền>` (cần tên miền đã Active ở bước 2 [hạn mức]).
7. **Apps Script:** Project Settings → Script Properties: thêm `EDGE_URL` và `EDGE_SECRET` (giống bước 5). Triển khai phiên bản mới.
8. **Chuyển người dùng:** trên Google Sites, nút "Đặt lịch" trỏ sang `https://app.<tên miền>`. Link Apps Script cũ **vẫn chạy** làm đường lùi.
9. **Theo dõi:** Workers → Metrics (lượt, lỗi, thời gian). Thêm health check của Cloudflare hoặc UptimeRobot trỏ `https://app.<tên miền>/health`.

**Việc phải code:**
* Worker: phục vụ `ui/*` dạng tĩnh; `/api/slots` đọc Durable Object "Snapshot"; `/api/*` khác chuyển qua Durable Object "Cổng" (trần 20 lượt bay, hàng chờ tối đa 20 giây, quá thì trả "đang đông, đã giữ yêu cầu, thử lại sau 5 giây" kèm mã yêu cầu); tự thử lại khi Apps Script trả lỗi quá tải; header bảo mật; chống spam đơn đăng ký công khai ở biên.
* Apps Script: `doPost` thật (kiểm chữ ký HMAC và mốc thời gian 2 phút, cơ chế đã có ở đăng nhập Google 5D) gọi đúng hàm `api*`; sau mỗi thay đổi đẩy bản slot mới và dữ liệu trang chủ của học viên liên quan tới Worker bằng `UrlFetchApp` (100.000 lượt mỗi ngày [hạn mức]); lúc tạo hoặc huỷ phiên đẩy {mã băm phiên → mã học viên, vai trò, hạn}.
* Giao diện: thay `google.script.run` bằng `fetch('/api/...')` trong một chỗ duy nhất là `T.api`; phần còn lại giữ nguyên.
* Thử nghiệm: phải thử trên Google thật cách Apps Script `doPost` trả kết quả qua chuyển hướng `script.googleusercontent.com` khi gọi từ Worker. Đây là điểm em **chưa kiểm chứng được** từ tài liệu.

**Thời gian [ước tính]:** 8 đến 12 ngày, chạy song song với bản đang dùng.

### Chuyển GĐ1 → GĐ2 khi BẤT KỲ điều nào đúng
* học viên đang hoạt động > 800 hoặc buổi mỗi ngày > 300;
* thời gian chờ khoá p95 > 2 giây, hoặc thời gian chờ ở Cổng p95 > 3 giây;
* BOOKINGS cộng AVAILABILITY đang dùng (sau lưu trữ) > 60.000 dòng, hoặc đọc một tab > 2 giây;
* cần báo cáo hoặc tính năng mà Sheets làm quá chậm.

Nếu anh tin sẽ tăng nhanh, **bắt đầu viết GĐ2 ngay khi vào GĐ1**, không chờ chạm ngưỡng; chuyển khi chạm.

### GĐ2 · Dữ liệu thật sang D1 (phương án C)

**Bước cho người không lập trình:**
1. Tạo CSDL:
   ```bash
   npx wrangler d1 create thaiput-prod --location=apac
   npx wrangler d1 create thaiput-staging --location=apac
   ```
   chép `database_id` vào `wrangler.toml` theo hướng dẫn trên màn hình.
2. Áp cấu trúc bảng (AI viết file migration): `npx wrangler d1 migrations apply thaiput-prod --remote`.
3. Tạo tài khoản email chuyên dụng:
   * **Resend** (dễ nhất): đăng ký, Domains → Add Domain → nhập tên miền phụ, ví dụ `mail.<tên miền>`; Resend hiện các bản ghi DNS, thêm **đúng các bản ghi đó** vào Cloudflare DNS; chờ "Verified"; tạo API Key; `npx wrangler secret put RESEND_API_KEY`.
   * Hoặc **Amazon SES** khi vượt khoảng 50.000 email mỗi tháng (rẻ hơn nhiều, mục 1.3): tạo tài khoản AWS, chọn vùng Singapore, xác minh tên miền, **gửi yêu cầu ra khỏi chế độ sandbox** (AWS duyệt thủ công), tạo khoá truy cập.
4. Apps Script: thêm Script Properties `WORKER_INTERNAL_URL`, `WORKER_INTERNAL_SECRET`; cài trigger `calendarOutboxJob` (đã có từ GĐ0, chỉ đổi nguồn) và `sheetsMirrorJob` mỗi 10 phút.
5. Trên Sheets PRODUCTION: các tab dữ liệu thành **bảng xem**, khoá bằng Data → Protect sheets (chỉ `admin@` sửa, và job ghi). Ghi rõ dòng đầu "Bảng xem, sửa ở giao diện admin".

**Việc phải code:**
* Cấu trúc bảng D1 tương ứng SCHEMA hiện tại; bảng `slot_capacity`; chỉ mục duy nhất từng phần; bảng `outbox_email`, `outbox_calendar`, `idempotency`.
* Durable Object "Điều phối đặt lịch" dùng lại `buildTutorCandidates_`, `pickTutor_`, các hàm gói và thời gian (sao chép sang module JS, chạy lại bộ test Node hiện có trên chính module đó).
* Đăng nhập, phiên, quyền chuyển sang Worker (giữ đúng luật 6, 35, 36, 37 của CLAUDE.md).
* Công cụ chuyển dữ liệu một lần Sheets → D1, chạy lại được nhiều lần, so khớp số dòng và tổng kiểm.
* **Chuyển theo từng phần, mỗi phần một công tắc ở Worker:** (1) ghi kép: Apps Script vẫn là nguồn, mỗi thay đổi đồng thời ghi D1; (2) đọc bóng: Worker đọc cả hai, so sánh, ghi chênh lệch; (3) khi 7 ngày không chênh lệch, đọc từ D1; (4) chuyển đặt và huỷ sang D1; Apps Script đổi chiều thành bảng xem. Mỗi bước đều quay lui bằng cách tắt công tắc.

**Thời gian [ước tính]:** 4 đến 7 tuần.

### Chuyển GĐ2 → GĐ3 khi BẤT KỲ điều nào đúng
* học viên > 5.000, hoặc lời mời lịch ra ngoài tên miền > 5.000 mỗi ngày (một nửa ngưỡng 10.000 [hạn mức]);
* email > 300.000 mỗi tháng.

### GĐ3 · Quy mô lớn
* **Lịch:** tạo sự kiện **không mời học viên qua Calendar** (`sendUpdates: 'none'` cho học viên), chỉ mời tutor; học viên nhận link Meet và file `.ics` trong email của hệ thống. Lời mời ra ngoài giảm khoảng một nửa. Nếu vẫn cao: chia tutor cho 2 đến 3 tài khoản tổ chức lịch Workspace (mỗi tài khoản có hạn mức riêng [hạn mức]; giá mỗi tài khoản xem Admin console).
* **Email:** SES, tên miền phụ riêng cho email hệ thống, theo dõi tỉ lệ bị trả về và báo spam.
* **Con người:** một người (thuê ngoài theo giờ) có thể xử lý sự cố ngoài giờ; sổ tay sự cố một trang.

## 6. Đánh giá thẳng quyết định "Calendar gom lúc 23h"

### 6.1 Lợi ích thật về tải
* Tạo sự kiện **đã nằm ngoài khoá** từ 5B [code], nên gom 23h **không làm khoá ngắn thêm**.
* Lợi ích thật là **lượt chạy của học viên ngắn đi**: bỏ được mỗi buổi một lần gọi Calendar (ước tính 1 đến 3 giây mỗi sự kiện, phải đo) cộng một lần lấy khoá thứ hai. Học viên đặt 3 buổi tiết kiệm khoảng 3 đến 9 giây chạy [ước tính]. Theo công thức 3.2, sức chứa giờ cao điểm tăng tương ứng. **Đây là lợi ích lớn và đúng.**
* Một lỗi Calendar không còn làm chậm học viên.

### 6.2 Cái giá của việc chọn đúng 23h

| Vấn đề | Chi tiết |
|---|---|
| Lời mời lúc nửa đêm | Google Calendar gửi email mời và thông báo điện thoại tới học viên, tutor lúc 23h. Với 43 buổi là 86 người bị đánh thức hoặc thấy thông báo ban đêm. Không chuyên nghiệp |
| Dồn vào một khoảng ngắn | Ngưỡng bóp lời mời ra ngoài là "trong một khoảng ngắn" [hạn mức]. Gom 23h biến 860 (ở 1.000 học viên) hay 8.600 (ở 10.000) lời mời thành một đợt dồn, đúng hình mẫu bị bóp, và hồi phục "có thể một tháng" |
| Không đúng 23:00 | Trigger theo giờ chạy trong khung giờ, không đúng phút [hạn mức] |
| Giới hạn 6 phút | 43 sự kiện vừa; 430 sự kiện (ước tính 7 đến 21 phút) phải chia lô, job phải tự chạy tiếp |
| Buổi sát giờ | Luật hiện tại hạn đặt 15:00 hôm trước nên phần lớn buổi kịp. Nhưng `BOOKING_LEAD_HOURS` (đặt trước N giờ) và admin đặt thay (chỉ cần slot chưa bắt đầu) [code] tạo buổi **trong ngày**: buổi 19:00 đặt lúc 14:00 sẽ không có lịch và Meet trước giờ học |
| Link Meet trong email xác nhận | Email xác nhận gửi ngay sẽ **không có link Meet**. Phải nói rõ "link Meet gửi qua lời mời lịch" và nhắc trước 60 phút phải lấy link từ booking |
| Huỷ trước khi tạo | Thực ra là lợi (đỡ một lần gọi), nhưng code phải xử lý trạng thái "đã huỷ, chưa từng có sự kiện" ở mọi luồng: huỷ, đổi tutor, tutor xin huỷ slot, admin đổi |
| Một điểm hỏng mỗi ngày | Job 23h lỗi (Calendar trục trặc, hết 6 phút) thì cả ngày không có lịch, và không ai thức để sửa |

### 6.3 Cách làm đúng
1. **Hàng đợi lịch (outbox), không phải lô 23h.** Đặt lịch chỉ ghi `cal_state = CHỜ_TẠO` trong khoá. Job `calendarOutboxJob` chạy **mỗi 5 phút**:
   * thoát ngay trong vài trăm mili giây nếu một cờ trong CacheService báo "không có việc" (tiết kiệm 6 giờ trigger);
   * xử lý theo **giờ học gần nhất trước**; ngân sách 4 phút mỗi lần, còn lại để lần sau;
   * mỗi dòng: CHỜ_TẠO và booking còn hiệu lực → tạo; booking đã huỷ → BỎ_QUA, không gọi Calendar; CHỜ_HUỶ → xoá sự kiện; lỗi → tăng `cal_attempts`, thử lại sau 5, 15, 60 phút;
   * `requestId` của Meet dựa trên `booking_id` để chạy lại không tạo hai phòng.
2. **Giờ yên lặng** `CAL_QUIET_START = 22`, `CAL_QUIET_END = 7` (CONFIG): trong khung này chỉ xử lý buổi bắt đầu trước 09:00 sáng hôm sau; còn lại để 07:00. Lời mời tới vào buổi sáng.
3. **Rải tải:** tối đa N sự kiện mỗi lần chạy (CONFIG, mặc định 60), để lời mời ra ngoài trải đều trong ngày.
4. **Lưới an toàn:** buổi còn dưới 3 giờ mà vẫn chưa có sự kiện → thông báo mức EMAIL cho admin (dùng `notify_` sẵn có) kèm nút tạo tay.
5. **Email xác nhận gửi ngay**, ghi "Link Meet sẽ có trong lời mời lịch và trong cổng học viên trước 07:00 ngày học (hoặc trong vài phút)". Email nhắc trước 60 phút luôn có link.
6. **Phương án thay thế để có link ngay:** `MEET_MODE = TUTOR_ROOM` (đã có [code]): mỗi tutor một phòng Meet cố định, link biết ngay lúc đặt; Calendar chỉ còn là tiện ích. Cái giá: học viên trước có thể vào nhầm giờ của học viên sau; tutor phải bật "chỉ người được mời" hoặc duyệt người vào.

## 7. Kế hoạch đo và thử tải trước go live

### 7.1 Công cụ
* **k6** (chạy trên máy, miễn phí; Grafana Cloud k6 Free 500 giờ người dùng ảo mỗi tháng nếu muốn chạy trên mây [giá]): bắn vào điểm thử tải `doPost` của STAGING (việc 0.10). Đo được sức chứa phía server và lỗi 30 lượt.
* **Playwright** (thư viện điều khiển trình duyệt, miễn phí): 10 đến 20 trình duyệt thật đi đúng đường `google.script.run` trong khung Google Sites. Đo được độ trễ thật người dùng thấy, gồm cả khởi động.
* **Menu "Đo tốc độ"** (kế hoạch 5F): đo từng thao tác một mình, thời gian giữ khoá.
* **Dữ liệu:** `test/tools/load_profile.js` sinh dữ liệu 1 tháng và 12 tháng, nạp vào STAGING.
* **Trước khi chạy:** STAGING dưới tài khoản Gmail riêng (mục 5, luật chung 1); tắt email (học viên ảo dùng địa chỉ không có thật sẽ làm hỏng uy tín gửi thư) và tắt Calendar mời khách trong CONFIG STAGING.

Ví dụ khung kịch bản k6 (AI viết đầy đủ):
```js
import http from 'k6/http';
export const options = {
  scenarios: {
    spike: { executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s',
             preAllocatedVUs: 200, stages: [{ target: 15, duration: '20s' }, { target: 15, duration: '40s' }, { target: 0, duration: '10s' }] },
  },
  thresholds: { 'http_req_failed': ['rate<0.005'], 'http_req_duration{fn:slots}': ['p(95)<3000'], 'http_req_duration{fn:book}': ['p(95)<6000'] },
};
```

### 7.2 Kịch bản
| # | Kịch bản | Cách chạy | Đo gì |
|---|---|---|---|
| T1 | Nền: một người, từng thao tác, 20 lần | Menu Đo tốc độ + Playwright 1 trình duyệt | p50, p95 từng thao tác; số thật thay mọi chữ "giả định 3 giây" |
| T2 | Ngày thường | k6 tốc độ đến đều 0,5 lượt mỗi giây trong 30 phút, trộn 60% xem, 20% trang chủ, 15% đặt, 5% huỷ | p95, lỗi, chờ khoá |
| T3 | Đợt dồn "20:00 mở lịch" ở **2 lần quy mô** | 200 học viên ảo vào trong 60 giây, mỗi người Boot, xem slot, đặt 3 buổi; đồng thời 20 tutor lưu slot | lỗi trước và sau tự thử lại, p95, số lượt chồng cao nhất |
| T4 | Tranh slot cuối | 50 học viên ảo cùng đặt 1 slot chỉ còn 1 tutor | đúng 1 thành công, 49 nhận "hết tutor"; 0 đặt trùng |
| T5 | Tìm điểm gãy | k6 tăng dần tốc độ đến tới khi lỗi trước thử lại > 1% | sức chứa thật (lượt mỗi giây); đặt ngưỡng báo động ở 50% |
| T6 | Dữ liệu 12 tháng | lặp T2 trên dữ liệu 12 tháng | thời gian mỗi lượt tăng bao nhiêu; xác nhận 5G là bắt buộc |
| T7 | Gửi trùng và đứt mạng | gửi cùng mã yêu cầu 5 lần; ngắt mạng Playwright giữa lượt đặt | đúng 1 booking; trang hiện đúng kết quả sau khi có mạng |
| T8 | Hàng đợi lịch | tạo 100 booking, huỷ 20 trong số đó trước 5 phút | 80 sự kiện, 0 sự kiện cho buổi đã huỷ, mỗi lần chạy < 4 phút |
| T9 | Ngâm | T2 trong 2 giờ | không rò rỉ (dòng log, đệm), không lỗi tăng dần |

### 7.3 Ngưỡng đạt (cổng go live GĐ0)
* T3 (2 lần quy mô): **0 lỗi người dùng thấy sau tự thử lại**; lỗi trước thử lại < 5%; p95 xem slot ≤ 3 giây; p95 đặt ≤ 6 giây; số lượt chồng cao nhất ≤ 25.
* T4, T7: **0 đặt trùng, 0 booking mất, 0 booking thừa**. Không có ngoại lệ.
* T2: p95 xem slot ≤ 2 giây, chờ khoá p95 ≤ 1 giây.
* T5: sức chứa ≥ 3 lần mức T2.
* T6: không lượt nào > 30 giây.
* T8: 100% sự kiện đúng; 0 lời gọi Calendar cho buổi đã huỷ.
* Mọi số đo ghi vào `reports/LOADTEST_<ngày>.md` kèm phiên bản code, để so sánh sau mỗi lần thay đổi lớn. Chạy lại T3 và T4 **sau mỗi thay đổi đụng tới Db.gs, Booking.gs, Auth.gs, Api.gs**.

Ở GĐ1 và GĐ2 dùng cùng bộ kịch bản, đổi đích thành `https://app-staging.<tên miền>` và đổi ngưỡng theo bảng 2.3.

## 8. Phản biện thêm, nói thẳng

1. **Lời khuyên cũ ("tầng 1, 2, 3") không sai, nhưng thiếu hai thứ quan trọng nhất:** tự thử lại có mã chống trùng, và tách STAGING khỏi tài khoản PRODUCTION. Hai việc này rẻ nhất và đáng nhất.
2. **Phần "đọc qua file công khai" của lời khuyên cũ (tầng 3)** nên làm bằng Cloudflare (GĐ1), không bằng file Drive công khai: Drive không làm máy phục vụ JSON tốc độ cao, và file công khai làm lộ lịch tutor.
3. **"Bằng bất cứ giá nào" dễ thành viết lại toàn bộ trước go live.** Em phản đối: viết lại trước go live là đổi rủi ro tải (chưa xảy ra ở 100 học viên) lấy rủi ro lỗi mới (chắc chắn xảy ra). Đi theo giai đoạn, mỗi bước có đường lùi.
4. **Sửa liên tục trên bản đang chạy chỉ an toàn khi có 3 thứ:** STAGING riêng tài khoản, bản triển khai beta, và số đo tự động. Thiếu một trong ba thì đó là chơi may rủi với học viên thật.
5. **Một tài khoản `admin@` vẫn là điểm hỏng lớn nhất**, lớn hơn mọi giới hạn tải: bị khoá vì đăng nhập lạ là toàn hệ thống dừng (GĐ0 đến GĐ1) hoặc mất Calendar (GĐ2). Ở GĐ2 rủi ro này giảm vì người dùng không còn đi qua Apps Script.

## 9. Điều em chưa kiểm chứng được
* Thời gian thật mỗi lượt Apps Script, độ trễ `google.script.run`, thời gian một lần `Calendar.Events.insert`: phải đo bằng T1.
* Cách Apps Script `doPost` trả kết quả khi gọi từ Cloudflare Worker (chuyển hướng sang `script.googleusercontent.com`): phải thử ở đầu GĐ1.
* Văn bản lỗi chính xác Google trả khi vượt 30 lượt: ghi nguyên văn trong log ở GĐ0.
* Giá một tài khoản Workspace thêm: trang giá công khai không hiện số khi em đọc.
* Thông báo "tài khoản dịch vụ không mời được khách nếu không có ủy quyền toàn miền" dựa trên nguồn cộng đồng và trình theo dõi lỗi của Google, không phải trang tài liệu chính.
* Gói UptimeRobot Free có được dùng thương mại hay không: trang giá ghi "cho dự án sở thích và phi lợi nhuận"; nên dùng Solo hoặc health check của Cloudflare.

## 10. Nguồn (xem ngày 15/10/2026)

**Google**
* Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
* Apps Script web apps (execute as me): https://developers.google.com/apps-script/guides/web
* LockService: https://developers.google.com/apps-script/reference/lock/lock-service
* CacheService (Cache): https://developers.google.com/apps-script/reference/cache/cache
* ClockTriggerBuilder: https://developers.google.com/apps-script/reference/script/clock-trigger-builder
* Calendar API quota: https://developers.google.com/workspace/calendar/api/guides/quota
* Avoid Calendar use limits: https://knowledge.workspace.google.com/admin/calendar/avoid-calendar-use-limits (chuyển từ https://support.google.com/a/answer/2905486)
* Sheets API limits: https://developers.google.com/workspace/sheets/api/limits
* Giới hạn 10 triệu ô: https://support.google.com/drive/answer/37603
* Workspace SLA: https://workspace.google.com/terms/sla/
* Workspace pricing (không hiện số khi đọc): https://workspace.google.com/pricing
* Firebase pricing: https://firebase.google.com/pricing
* Firestore pricing: https://cloud.google.com/firestore/pricing
* Cloud Run pricing: https://cloud.google.com/run/pricing

**Cloudflare**
* Workers pricing (gồm D1, Durable Objects, KV): https://developers.cloudflare.com/workers/platform/pricing/
* Workers limits: https://developers.cloudflare.com/workers/platform/limits/
* Static assets billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
* Custom domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
* Durable Objects là gì: https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
* Durable Objects limits: https://developers.cloudflare.com/durable-objects/platform/limits/
* D1 limits: https://developers.cloudflare.com/d1/platform/limits/
* D1 batch: https://developers.cloudflare.com/d1/worker-api/d1-database/
* KV hoạt động thế nào: https://developers.cloudflare.com/kv/concepts/how-kv-works/
* Queues pricing: https://developers.cloudflare.com/queues/platform/pricing/
* Business SLA: https://www.cloudflare.com/business-sla/

**Khác**
* Supabase pricing: https://supabase.com/pricing
* Supabase compute: https://supabase.com/docs/guides/platform/compute-and-disk
* Supabase auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
* Resend pricing: https://resend.com/pricing
* Amazon SES pricing: https://aws.amazon.com/ses/pricing/
* Grafana Cloud pricing (k6): https://grafana.com/pricing/
* UptimeRobot pricing: https://uptimerobot.com/pricing/
* Tài khoản dịch vụ và khách mời Calendar (nguồn cộng đồng): https://issuetracker.google.com/issues/408598694 ; https://www.technetexperts.com/service-account-dwd-calendar-attendees/amp/

<!-- END FILE: v8/history/KIEN_TRUC_CHUYEN_GIA_A.md -->

---

## `v8/history/KIEN_TRUC_CHUYEN_GIA_B.md`

*Ngày tạo trong Project: 2026-10-29T14:41:17Z*

<!-- BEGIN FILE: v8/history/KIEN_TRUC_CHUYEN_GIA_B.md | bytes=59068 | sha256=a23e0bfd456bc9e58988ebc6c63c88da4fbf2472d1bec7fe2e3ceedf0886ae55 | created=2026-10-29T14:41:17Z -->
# Báo cáo chuyên gia B · Kiến trúc để thaiput không sập, không chậm khi đông người

*Góc nhìn ưu tiên: vận hành thực tế bởi 2 người không lập trình, chi phí, an toàn dữ liệu (không đặt trùng, không mất booking). Làm độc lập. Ngày soạn và ngày xem mọi nguồn: 15/10/2026.*

*Mỗi con số gắn một nhãn: **[Google]**, **[Cloudflare]**... là số trên tài liệu chính thức (link ở mục 9); **[code]** là điều em đọc thấy trong `/home/claude/thaiput_v8/src`; **[đo cũ]** là số trong `KE_HOACH_CHUNK5_V2.md` mục 3; **[ước tính]** là phép tính từ giả định ghi ngay bên cạnh.*

---

## 0. Kết luận trong 10 dòng

1. "Không crash, không delay cho bất cứ ai bằng bất cứ giá nào" **không đạt được tuyệt đối** với bất kỳ nền tảng nào. Google chỉ cam kết 99,9% cho Sheets, Calendar, Gmail và **không cam kết gì cho Apps Script** [Google SLA]. Tiền mua được độ tin cậy cao hơn, không mua được 100%. Cần thay bằng SLO đo được (mục 2).
2. **Em phản biện giả định "phải rời Apps Script".** Ở 100 học viên, giới hạn 30 lượt chạy cùng lúc gần như không bao giờ bị chạm bởi người dùng thật. Thứ sẽ làm hệ thống "trông như sập" lúc go live là **khoá ghi (LockService) bị giữ quá lâu và bị lấy quá nhiều lần**, cộng với vài lỗi xử lý sau khi đã ghi xong. Cả hai sửa được trong Apps Script, trong khoảng 1 đến 1,5 tuần.
3. Em đọc code và thấy **một lượt đặt lịch lấy khoá từ 5 đến 7 lần**, mỗi lần đọc lại cả tab, và **có thể báo "Hệ thống đang bận" cho học viên SAU KHI booking đã được ghi**. Đây là rủi ro "mất booking trong mắt người dùng" lớn nhất hiện nay (mục 1.3).
4. Rời Apps Script **có lý do thật** nhưng ở ngưỡng khác: khoảng 500 đến 700 học viên thì hết hạn mức email 1.500 người nhận/ngày; khoảng 1.000 học viên thì khoá ghi thành nút thắt; 10.000 học viên thì Sheets vượt 10 triệu ô trong vài tháng [ước tính, mục 1.4].
5. Lộ trình em khuyên: **Giai đoạn 0** cứng hoá Apps Script trước go live (0 đồng thêm). **Giai đoạn 1** đưa email sang nhà cung cấp chuyên dụng và đưa lượt đọc slot ra Cloudflare (khoảng 0 đến 30 USD/tháng). **Giai đoạn 2** chuyển nguồn dữ liệu sang Cloudflare D1 + Durable Object, **Apps Script ở lại làm "công nhân"** cho Calendar, Meet, bảng Sheets cho admin (khoảng 5 đến 10 USD/tháng cho phần Cloudflare). Mỗi lần chuyển giai đoạn có điều kiện bằng số đo.
6. Phương án thay thế cho giai đoạn 2 nếu anh muốn khoá nhà cung cấp thấp nhất: Supabase (Postgres) 25 USD/tháng.
7. Quyết định "Calendar gom lúc 23h": **đúng hướng (tách Calendar khỏi lượt bấm), sai thời điểm.** Làm đúng là hàng đợi chạy mỗi 1 đến 5 phút, có đường gấp cho buổi sát giờ (mục 5).
8. Không đóng băng là quyền của anh; em đề nghị một thứ thay thế khách quan: **ngân sách lỗi** (mục 2.4). Hết ngân sách thì tạm dừng tính năng mới tới khi xanh lại. Không phải đóng băng theo lịch, mà theo số đo.
9. Trước go live phải thử tải trên STAGING bằng k6 và trình duyệt thật, với kịch bản "nhắn cả lớp lúc 20:00" (mục 6). **Không thử tải STAGING sau go live nếu STAGING chạy dưới cùng tài khoản admin@**, vì nó ăn chung 30 lượt của PRODUCTION.
10. Rủi ro lớn nhất của sản phẩm "chuyên nghiệp" lúc go live không phải số người dùng, mà là **sửa code trên bản đang chạy** (trigger chạy ngay code vừa lưu, không qua bản triển khai) và **tài khoản admin@ dùng chung**.

---

## 1. Kiểm chứng hạn mức và đọc code: nút thắt thật ở đâu

### 1.1 Hạn mức Google đã kiểm (tài liệu chính thức, xem 15/10/2026)

| Hạn mức | Workspace | Ghi chú cho thaiput | Nguồn |
|---|---|---|---|
| Lượt chạy cùng lúc mỗi người dùng | 30 | Web app "execute as me": mọi học viên, tutor, cả trigger và onEdit đều chạy dưới admin@ | [Google quotas] |
| Lượt chạy cùng lúc mỗi script | 1.000 | Không liên quan khi execute as me | [Google quotas] |
| Thời gian mỗi lần chạy | 6 phút | Ảnh hưởng job gom Calendar lớn | [Google quotas] |
| Tổng thời gian trigger | 6 giờ/ngày | | [Google quotas] |
| Người nhận email (MailApp) | 1.500/ngày | Nút thắt đầu tiên khi tăng trưởng | [Google quotas] |
| Sự kiện Calendar tạo bằng script | 10.000/ngày | | [Google quotas] |
| UrlFetch | 100.000/ngày | Dùng khi Apps Script gọi Cloudflare hoặc nhà cung cấp email | [Google quotas] |
| Calendar API | 600 yêu cầu/phút mỗi người dùng; 10.000/phút mỗi project; cửa sổ trượt | Google khuyên **tránh job chạy dồn cùng giờ, ví dụ đồng bộ lúc nửa đêm** | [Calendar API quota] |
| Giới hạn sử dụng Calendar | Khoảng 10.000 lời mời gửi ra ngoài tên miền "trong thời gian ngắn" thì bị bóp vài giờ, có thể mất khoảng 1 tháng để hồi | Học viên, tutor dùng Gmail riêng là "ngoài tên miền" | [Calendar use limits] |
| Gmail Workspace | 2.000 thư/ngày mỗi tài khoản, tính theo 24 giờ trượt; vượt thì không gửi được tới 24 giờ | Hộp thư admin@ dùng tay cũng tính | [Gmail sending limits] |
| CacheService | 100 KB mỗi khoá, tối đa 6 giờ, có thể bị xoá sớm | Chỉ dùng làm đệm, không làm nguồn dữ liệu | [CacheService] |
| LockService `tryLock` | Không ghi giới hạn tối đa; khoá tự nhả khi script kết thúc | Code đang dùng 30 s | [Lock] |
| Trigger theo giờ | `everyMinutes` chỉ nhận 1, 5, 10, 15, 30; giờ chạy "có thể ngẫu nhiên", ví dụ đặt 9:00 có thể chạy từ 9:00 tới 10:00 | **Job "23h" thật ra chạy lúc 23:00 đến 24:00** | [ClockTriggerBuilder], [Installable triggers] |
| Ô trong một file Sheets | 10 triệu | | [Sheets 10M] |
| SLA Workspace | 99,9%/tháng cho Gmail, Calendar, Sheets, Drive, Sites, Meet... **Apps Script không nằm trong danh sách** | | [Workspace SLA] |
| Sheets API (nếu dịch vụ ngoài ghi vào Sheets) | 300 yêu cầu/phút mỗi project, 60/phút mỗi người dùng | Lý do em không cho Cloudflare ghi thẳng Sheets | [Sheets API limits] |

**Không có tài liệu chính thức** cho độ trễ khởi động của `google.script.run`. Con số 0,5 đến 2 s trong đề bài em coi là **ước tính**, phải đo (mục 6).

### 1.2 Mô hình tải: khi nào chạm 30 lượt

Công thức: **số lượt chạy cùng lúc ≈ số lượt gọi mỗi giây × thời gian một lượt**.

[ước tính] Giả định: mỗi lượt đọc 1,5 đến 3 s; một học viên vào cổng và đặt lịch tốn khoảng 4 lượt gọi.

| Tình huống | Lượt gọi/giây | Lượt cùng lúc trung bình | Chạm 30? |
|---|---|---|---|
| 100 học viên, buổi tối thường (30 người dùng trong 3 giờ) | khoảng 0,01 | dưới 0,1 | Không |
| 100 học viên, "nhắn cả lớp 20:00", 50 người phản hồi trong 5 phút | khoảng 0,7 | khoảng 2 | Không, trừ khi khoá ghi bị nghẽn (1.3) |
| 1.000 học viên, nhắn cả lớp, 500 người trong 5 phút | khoảng 7 | khoảng 14 đến 20 | Sát ngưỡng, đỉnh vài giây sẽ vượt |
| 10.000 học viên, giờ cao điểm thường | khoảng 5 đến 10 | 10 đến 30 | Có, thường xuyên |

**Điều tài liệu cũ chưa nói:** lượt đặt lịch **đứng chờ khoá vẫn chiếm 1 trong 30 lượt**. Nếu khoá bị giữ lâu, 10 người cùng đặt sẽ thành 10 lượt đứng chờ, cộng lượt đọc của người khác, và chạm 30 ở quy mô nhỏ hơn nhiều so với bảng trên. Vì vậy ở 100 học viên, **đòn bẩy số 1 là rút ngắn thời gian giữ khoá**, không phải rời Google.

Một nguồn tạo đỉnh khác do chính mình gây ra: **tự thử lại sai cách**. Nếu trang thử lại ngay khi lỗi, mỗi lỗi sinh thêm lượt gọi đúng lúc hệ thống đang quá tải. Thử lại phải có chờ tăng dần và ngẫu nhiên (mục 4, việc 0.5).

### 1.3 Phát hiện khi đọc code (chỉ đọc, không sửa)

| # | Phát hiện [code] | Hậu quả | Mức |
|---|---|---|---|
| F1 | `withLock_` (Db.gs dòng 237) xoá bộ đệm và **đọc lại cả tab** mỗi lần vào khoá. `bookSessionsFor_` lấy khoá chính, rồi khoá ngắn ghi mã sự kiện; sau đó `notify_` lấy khoá ghi NOTIFICATIONS (có thể thêm 1 lần ghi `emailed_at`); mỗi email gửi thành công ghi MAIL_LOG **ngoài khoá nên tự lấy khoá mới** (Db.gs `insert`, Notify.gs dòng 36). | Một lượt đặt 3 buổi cho 2 tutor: **khoảng 5 đến 7 lần lấy khoá**, mỗi lần đọc lại tab liên quan. Thông lượng ghi của cả hệ thống chia cho 5 đến 7. | Cao |
| F2 | Sau khi booking đã ghi xong, khoá ngắn ghi `event_id`, `notify_` (Notifications.gs dòng 68 ném lại lỗi bận) và ghi MAIL_LOG đều **có thể ném "Hệ thống đang bận"**, lỗi này chạy ra `apiWrap_` thành `{ ok: false, reason: BUSY }`. | Đúng lúc đông người: học viên **đã có booking, có thể đã nhận email xác nhận**, nhưng màn hình báo "bận, thử lại". Học viên đặt lại thì gặp lỗi 1 buổi/ngày hoặc đặt sang ngày khác ngoài ý muốn. Nếu lỗi xảy ra ở khoá ghi `event_id`: sự kiện Calendar đã tạo và đã gửi thư mời nhưng booking không có `event_id`, **huỷ booking sau này không gỡ được sự kiện** (sự kiện mồ côi), nhắc trước 60 phút thiếu link Meet. | **Rất cao (an toàn dữ liệu)** |
| F3 | Huỷ (`cancelBookingInternal_`) gọi Calendar (`stripAdminGuests_` + `remove`, 2 đến 3 lượt gọi) và gửi 2 email **bên trong khoá**. | Mỗi lượt huỷ giữ khoá thêm vài giây [ước tính], người đặt cùng lúc phải chờ. 5B đã đưa Calendar ra khỏi khoá cho đặt lịch nhưng chưa làm cho huỷ. | Cao |
| F4 | `reminderJob` chạy cả trong khoá, gọi Calendar (`fillMeetLink_`) và gửi email trong khoá. | Mỗi 15 phút, khoá bị giữ suốt thời gian gửi nhắc. Cao điểm nhắc (trước các buổi 19:00 đến 21:00) trùng giờ học viên đặt lịch buổi tối. | Trung bình |
| F5 | `runJob_` gặp khoá bận thì **bỏ lượt** không báo ai (Jobs.gs dòng 18). | Với job 15 phút thì chấp nhận được. Với **job 1 lần mỗi ngày như "Calendar 23h"** thì bỏ lượt = toàn bộ buổi ngày mai không có sự kiện, không link Meet. | Cao nếu làm 23h |
| F6 | Không có **khoá chống lặp (idempotency key)** cho đặt và huỷ. | Khi mạng chập chờn, học viên bấm lại, hoặc trang tự thử lại lượt ghi: không phân biệt được "lượt mới" và "lượt cũ gửi lại". Luật 1 buổi/ngày đang vô tình chặn trùng, nhưng không chặn trường hợp đặt nhiều ngày. | Cao |
| F7 | Trigger `onEditInstallable` chạy dưới admin@ cho **mọi ô admin sửa** ở mọi tab (thoát sớm nếu không phải 4 tab, nhưng vẫn là 1 lượt chạy). | Admin sửa nhanh nhiều ô lúc cao điểm cũng ăn vào 30 lượt. Nhỏ, nhưng nên biết. | Thấp |
| F8 | Code ghi `update` theo số hàng `_row` đọc lúc vào khoá. | Admin **sắp xếp (sort) tab BOOKINGS** đúng lúc một lượt ghi đang chạy có thể làm lượt đó ghi vào dòng khác. Hiếm, nhưng hậu quả là sai dữ liệu im lặng. | Trung bình |
| F9 | Trigger theo giờ **chạy code đã lưu (HEAD), không chạy bản đã triển khai** (CLAUDE.md luật 38 ghi đúng điều này). | Sửa code trực tiếp trên project PRODUCTION khi "không đóng băng" = job chạy ngay code dở dang. | Cao về vận hành |
| F10 | STAGING và PRODUCTION nếu cùng chủ là admin@ thì **chung 30 lượt** (hạn mức tính theo người dùng). | Thử tải STAGING sau go live làm PRODUCTION từ chối người thật. | Cao khi thử tải |

### 1.4 Khi nào Apps Script + Sheets thật sự hết đường [ước tính]

Giả định giữ tỉ lệ hiện tại: 100 học viên ≈ 43 buổi/ngày; 10 học viên/tutor; email khoảng 150 đến 210 người nhận/ngày ở 100 học viên [đo cũ, đã tắt nhắc 8:00 thì gần 150].

| Quy mô | Buổi/ngày | Email người nhận/ngày | So với 1.500 | Ô Sheets tăng mỗi tháng (BOOKINGS 19 cột, AVAILABILITY 12 cột) | Lời mời Calendar ra ngoài/ngày |
|---|---|---|---|---|---|
| 100 | 43 | 150 đến 210 | 10 đến 14% | khoảng 50.000 | khoảng 86 |
| 1.000 | 430 | 1.500 đến 2.100 | **100 đến 140%, vỡ** | khoảng 500.000 | khoảng 860 |
| 10.000 | 4.300 | 15.000 đến 21.000 | vỡ xa | khoảng 5 triệu, **chạm 10 triệu ô sau khoảng 2 tháng** | khoảng 8.600, **sát ngưỡng bóp 10.000** |

Kết luận: **email vỡ trước** (khoảng 500 đến 700 học viên), rồi tới khoá ghi và độ chậm khi đọc cả bảng (khoảng 1.000), rồi tới giới hạn file Sheets và Calendar (vài nghìn). Ở 100 học viên lúc go live, không thứ nào trong bảng là lý do để đổi nền tảng.

---

## 2. "Không crash, không delay tuyệt đối": nói thẳng và mục tiêu đo được

### 2.1 Vì sao không tuyệt đối
* **Không nhà cung cấp nào cam kết 100%.** Workspace 99,9% và không gồm Apps Script [Workspace SLA]; Firestore 99,99% vùng đơn, 99,999% đa vùng [Firestore SLA]. 99,9% nghĩa là được phép ngừng khoảng 43 phút mỗi tháng (43.200 phút × 0,1%).
* **Mạng của người dùng** (4G yếu, wifi quán cà phê) nằm ngoài tầm kiểm soát.
* **Hai người tranh slot cuối cùng thì một người phải thua.** "Không lỗi cho bất cứ ai" là mâu thuẫn logic; mục tiêu đúng là người thua nhận câu báo rõ trong 1 đến 2 giây và được gợi ý slot khác.
* **Lỗi do chính mình đưa lên** (sửa code liên tục trên bản chạy) thường gây sập nhiều hơn tải.

"Bằng bất cứ giá nào" mua được: đổi từ mức "thỉnh thoảng chậm vài giây" sang "hầu như luôn dưới 1 giây", và giảm thời gian sự cố. Không mua được 100%.

### 2.2 SLO em đề xuất

Hai nhóm: **bất biến dữ liệu** (không có ngân sách lỗi, phải bằng 0) và **trải nghiệm** (có ngân sách lỗi).

| Loại | Chỉ số | Giai đoạn 0 và 1 (Apps Script) | Giai đoạn 2 (Cloudflare) | Đo bằng |
|---|---|---|---|---|
| Bất biến | Hai booking giữ chỗ cùng tutor, cùng ngày, cùng slot | **0** | **0** | Job đối soát mỗi giờ + ràng buộc duy nhất trong DB (giai đoạn 2) |
| Bất biến | Học viên thấy "đặt thành công" mà không có dòng booking | **0** | **0** | Đối soát nhật ký trình duyệt (requestId) với BOOKINGS |
| Bất biến | Booking đã ghi nhưng màn hình báo lỗi | **0** (sau khi sửa F2) | **0** | Đối soát requestId |
| Bất biến | Buổi CONFIRMED chưa có sự kiện + link Meet khi còn 60 phút | **0** | **0** | Job đối soát, cảnh báo ngay |
| Trải nghiệm | Độ sẵn sàng (kiểm tra tổng hợp mỗi 5 phút thành công) | ≥ 99,5%/tháng | ≥ 99,9%/tháng | UptimeRobot hoặc tương đương |
| Trải nghiệm | Lượt gọi thất bại người dùng thấy (sau tự thử lại) | ≤ 0,5%/tuần | ≤ 0,1%/tuần | Bộ đếm phía trình duyệt |
| Trải nghiệm | p95 thời gian mở trang và xem slot | ≤ 3 s | ≤ 1 s | `performance.now()` phía trình duyệt |
| Trải nghiệm | p95 thời gian bấm "Đặt" tới khi thấy kết quả | ≤ 5 s | ≤ 1,5 s | như trên |
| Trải nghiệm | Email xác nhận tới trong 2 phút | ≥ 99% | ≥ 99% | Thời điểm ghi MAIL_LOG hoặc webhook nhà cung cấp |
| Trải nghiệm | Sự kiện Calendar + Meet có trong 10 phút sau khi đặt | ≥ 99% | ≥ 99% | cột `cal_created_at` trừ `created_at` |

Các con số ngưỡng giai đoạn 0 là mục tiêu em đặt, **phải xác nhận lại sau khi đo thật trên STAGING**; nếu đo cho thấy không đạt thì hạ mục tiêu hoặc làm sớm giai đoạn 1, không giấu.

### 2.3 Cách đo trên Apps Script (không tốn lượt chạy, không tốn khoá)
1. **Phía trình duyệt**: bọc mọi `google.script.run` trong một hàm đo thời gian và đếm thất bại (kể cả lượt bị Google từ chối, vốn **không bao giờ tới máy chủ** nên máy chủ không tự biết). Gom số đo, gửi kèm lượt gọi thành công kế tiếp (không thêm lượt gọi riêng).
2. **Phía máy chủ**: cộng dồn vào CacheService theo phút (không ghi Sheets, không lấy khoá), gồm thời gian chờ khoá, thời gian giữ khoá, số lỗi BUSY.
3. **Mỗi giờ**: `hourlyJob` chép số tổng hợp sang tab METRICS (một lần ghi). Tab có biểu đồ dựng sẵn để 2 anh nhìn.
4. **Kiểm tra từ bên ngoài**: một dịch vụ giám sát gọi `?page=health` mỗi 5 phút. Trang health chỉ đọc CacheService, trả chữ "OK" và tuổi của số đo gần nhất. Gói miễn phí UptimeRobot có 50 monitor, chu kỳ 5 phút, ghi là dành cho dự án cá nhân, phi lợi nhuận; gói trả phí rẻ nhất 12 USD/tháng trả theo năm [UptimeRobot]. Dùng cho kinh doanh nên tính sẵn khả năng phải trả.
5. **Trang Executions** của Apps Script lọc "Running" để xem số lượt chạy cùng lúc, theo gợi ý của chính tài liệu hạn mức [Google quotas].

### 2.4 Ngân sách lỗi thay cho đóng băng
Anh không muốn đóng băng. Em đề nghị luật khách quan: **khi một bất biến dữ liệu bị vi phạm, hoặc tỉ lệ lỗi người dùng thấy trong 7 ngày vượt SLO, thì dừng đưa tính năng mới lên PRODUCTION cho tới khi số đo xanh lại 7 ngày.** Sửa lỗi vẫn đưa lên bình thường. Như vậy "sửa liên tục trên bản đang chạy" vẫn giữ, nhưng có phanh tự động dựa trên số đo, không dựa trên cảm giác.

---

## 3. Bốn phương án kiến trúc

Quy ước chung cho mọi phương án:
* "Giữ chỗ" = trạng thái booking chiếm slot của tutor (CONFIRMED và các trạng thái giữ chỗ khác trong `isHolding_`).
* Học viên không chọn tutor; hệ thống chọn tutor theo xoay vòng (`pickTutor_`). Vì vậy "chống đặt trùng" có hai ràng buộc: **(tutor, ngày, slot) giữ chỗ là duy nhất** và **(học viên, ngày) không quá MAX_BOOKINGS_PER_DAY**, cộng kiểm tra số buổi còn lại của gói.
* Chi phí dưới đây **chưa gồm Workspace** của admin@ (chi phí nền có ở mọi phương án vì anh vẫn cần email tên miền, Calendar, Meet). Giá Workspace: Google không hiện số trên trang giá khi em tải; nguồn thứ ba ghi Business Standard 14 USD/người/tháng trả theo năm, 16,80 USD trả theo tháng [EVS]; đại lý Việt Nam Tenten ghi 440.000 VNĐ/người/tháng giá thường, 216.000 VNĐ giá khuyến mãi năm đầu, chưa VAT [Tenten].
* Email: khối lượng [ước tính] khoảng 6.000/tháng ở 100 học viên, 60.000 ở 1.000, 600.000 ở 10.000. Giá: Amazon SES 0,10 USD/1.000 email [SES]; Resend Pro 20 USD/tháng gồm 50.000 email, vượt 0,90 USD/1.000; gói miễn phí 3.000/tháng, 100/ngày [Resend].

### Phương án A · Giữ Apps Script, cứng hoá (giảm lượt gọi, giảm khoá, hàng đợi)

**Luồng**
```
Đọc slot:   Trình duyệt ──1 lượt gọi gộp──> Apps Script ──> CacheService (bản chụp slot, 60 s, có số phiên bản)
                                                       └─ (hết hạn) đọc Sheets một lần, dựng lại bản chụp
Đặt lịch:   Trình duyệt (requestId) ──> Apps Script
              ├─ KHOÁ 1 lần, ngắn: kiểm luật, ghi BOOKINGS (cal_state=PENDING), ghi ACTIVITY, NOTIFICATIONS, tăng phiên bản slot
              ├─ ngoài khoá: gửi email xác nhận (ngay, theo quyết định của anh)
              └─ trả kết quả; mọi lỗi SAU khi ghi đều nuốt, ghi log, vẫn trả "thành công"
Calendar:   Trigger mỗi 1 phút ──> lấy tối đa N việc PENDING ──> Calendar.insert (mã sự kiện định trước) ──> khoá ngắn ghi event_id, meet_link
Huỷ:        KHOÁ ngắn: đổi trạng thái, cal_state=CANCEL_PENDING ──> ngoài khoá: email ──> trigger gỡ sự kiện
Đăng nhập:  như hiện tại (link 1 lần, phiên ở AUTH + CacheService)
Email:      MailApp; vượt 1.000 người nhận/ngày thì chuyển sang SES/Resend qua UrlFetchApp
Admin:      Sheets như hiện tại, tab dữ liệu đặt bảo vệ dạng "cảnh báo khi sửa", chỉ dùng chế độ lọc (filter view), không sort
```

**Chống đặt trùng**: một khoá script cho mọi lượt ghi (đã có) + kiểm lại luật trong khoá (đã có) + requestId chống lặp (mới) + job đối soát mỗi giờ (mới). Điểm yếu còn lại: người sửa tay trực tiếp trong Sheets đi vòng qua khoá; xử lý bằng bảo vệ vùng và kỷ luật.

**Giới hạn còn lại**: 30 lượt cùng lúc; khoá đơn (thông lượng ghi khoảng 60 chia thời gian giữ khoá theo giây mỗi phút, ví dụ giữ 1 s thì khoảng 60 lượt ghi/phút [ước tính]); email 1.500/ngày; đọc cả bảng chậm dần nếu không lưu trữ hằng tháng; không SLA.

**Chi phí hằng tháng thêm** [ước tính]: 100 học viên: 0 USD. 1.000: email SES khoảng 6 USD, hoặc Resend khoảng 29 USD. 10.000: **không khả thi** (mục 1.4).

**Thời gian làm** [ước tính, làm cùng AI, gồm test]: 6 đến 8 ngày làm việc.

**Độ phức tạp vận hành**: thấp nhất. Mọi thứ trong giao diện Google anh đã quen.

**Khoá nhà cung cấp**: cao, nhưng đã có sẵn; không tăng thêm.

**Quay lui**: mỗi thay đổi có công tắc CONFIG (ví dụ `CALENDAR_MODE = INLINE` quay về tạo sự kiện ngay như hiện tại); bản triển khai cũ chọn lại trong "Quản lý các lần triển khai".

### Phương án B · Cloudflare làm cửa trước và nguồn dữ liệu, Apps Script làm "công nhân Google" (em khuyên cho giai đoạn 2)

**Luồng**
```
Trình duyệt ──HTTPS──> Cloudflare Worker (app.<tên miền>), phục vụ cả trang web lẫn API
  Đọc slot:  Worker ──> KV (bản chụp slot, cập nhật sau mỗi thay đổi; KV chậm tới khoảng 60 s ở nơi khác)
                    └─ hoặc D1 truy vấn trực tiếp khi cần chính xác
  Đặt lịch:  Worker kiểm phiên (bảng sessions trong D1)
             ──> Durable Object "BànĐặtChỗ" (1 thực thể, xử lý tuần tự từng yêu cầu)
                 ──> D1: một batch giao dịch: kiểm gói, chèn booking, chèn outbox (EMAIL, CALENDAR), chèn nhật ký
                     (chỉ mục duy nhất chặn trùng kể cả khi code sai)
             ──> gọi API email gửi xác nhận ngay (SES hoặc Resend)
             ──> trả kết quả, thường dưới 1 s [ước tính]
  Huỷ:       tương tự, outbox CALENDAR_CANCEL
  Đăng nhập: link 1 lần gửi qua nhà cung cấp email; phiên là cookie HttpOnly trên tên miền app
Apps Script (dưới admin@, chỉ chạy bằng trigger, không còn web app cho người dùng):
  Mỗi 1 phút: UrlFetch lấy outbox CALENDAR từ Worker (khoá bí mật) ──> Calendar.insert/remove ──> báo lại event_id, meet_link
  Mỗi 1 đến 5 phút: kéo thay đổi từ Worker ──> ghi vào các tab Sheets (bảng xem cho admin)
  onEdit trên tab "LỆNH" (duyệt đăng ký, duyệt huỷ...): gọi API Worker, hiện kết quả bằng toast
Nhắc trước 60 phút: Cron của Worker hoặc trigger Apps Script, gửi qua nhà cung cấp email
```

**Chống đặt trùng**: ba lớp. (1) Durable Object xử lý tuần tự, một thực thể, đơn luồng, lưu trữ nhất quán mạnh [DO concept]; (2) D1 mỗi cơ sở dữ liệu xử lý từng truy vấn một [D1 limits], batch là giao dịch; (3) **chỉ mục duy nhất có điều kiện** trong SQLite, ví dụ:
```sql
CREATE UNIQUE INDEX one_tutor_slot ON bookings(tutor_id, date, slot) WHERE status IN ('CONFIRMED','CANCEL_PENDING');
CREATE UNIQUE INDEX one_per_day   ON bookings(student_id, date)     WHERE status IN ('CONFIRMED','COMPLETED');  -- khi MAX_BOOKINGS_PER_DAY = 1
CREATE UNIQUE INDEX idem          ON bookings(request_id);
```
Lớp 3 là lưới an toàn cuối: kể cả code do AI viết có lỗi logic, cơ sở dữ liệu vẫn từ chối dòng trùng. Đây là điều Sheets không làm được.

**Không mất booking**: D1 Time Travel khôi phục tới **bất kỳ phút nào trong 30 ngày** (gói trả phí) [D1 Time Travel]; cộng bản sao trong Sheets cập nhật mỗi vài phút; cộng bản xuất SQL hằng đêm.

**Giới hạn còn lại**: Durable Object giới hạn mềm 1.000 yêu cầu/giây mỗi thực thể [DO limits]; D1 khoảng 1.000 truy vấn/giây nếu mỗi truy vấn 1 ms [D1 limits]; cơ sở dữ liệu tối đa 10 GB [D1 limits]. Phía Google: Calendar vẫn qua Apps Script (6 giờ trigger/ngày, 10.000 sự kiện/ngày, lời mời ngoài tên miền). Em **không tìm thấy SLA** cho gói Workers 5 USD; coi như không có cam kết.

**Chi phí hằng tháng** (giá Cloudflare [CF pricing]; khối lượng là [ước tính]):

| | 100 học viên | 1.000 | 10.000 |
|---|---|---|---|
| Workers Paid (gồm 10 triệu yêu cầu, 30 triệu ms CPU) | 5 USD (có thể 0 USD với gói miễn phí 100.000 yêu cầu/ngày, nhưng CPU 10 ms/lượt quá chặt; em khuyên trả 5 USD) | 5 USD | 5 USD; khoảng 3 đến 6 triệu yêu cầu/tháng vẫn trong gói |
| D1, Durable Objects, KV | trong phần đã gồm | trong phần đã gồm | 0 đến 5 USD |
| Email | MailApp 0 USD hoặc SES khoảng 0,6 USD | SES khoảng 6 USD | SES khoảng 60 USD |
| **Cộng (chưa Workspace)** | **khoảng 5 đến 6 USD** | **khoảng 11 USD** | **khoảng 65 đến 70 USD** |

**Thời gian làm** [ước tính]: 4 đến 6 tuần (viết lại API đặt, huỷ, đăng nhập, admin; giữ giao diện và luật nghiệp vụ dạng hàm thuần đã có; 2 tuần chạy bóng song song).

**Độ phức tạp vận hành**: trung bình. Thêm một bảng điều khiển (Cloudflare), một kho code GitHub tự triển khai khi đẩy code, một khoá bí mật. Admin vẫn làm việc trên Sheets nhưng **Sheets thành bảng xem + tab lệnh**, không sửa trực tiếp dữ liệu. Đây là thay đổi thói quen lớn nhất.

**Khoá nhà cung cấp**: trung bình. D1 là SQLite, xuất ra file SQL được; Durable Object là mã riêng của Cloudflare nhưng chỉ khoảng một trăm dòng.

**Quay lui**: Sheets luôn là bản sao gần như tức thời. Quay về Apps Script = bật `BOOKING_BACKEND = SHEETS` trong CONFIG, tạm khoá đặt lịch 5 phút để đồng bộ lần cuối, đổi link web về Apps Script. Diễn tập quay lui 1 lần trước khi chuyển thật.

### Phương án C · Supabase (Postgres) làm nguồn dữ liệu

**Luồng**: trang web tĩnh (phục vụ từ Cloudflare Workers như B) ──> Supabase Edge Function hoặc hàm SQL `book_session()` chạy trong một giao dịch (`SELECT ... FOR UPDATE` trên dòng gói của học viên, chèn booking, chèn outbox) ──> email qua nhà cung cấp ──> Apps Script công nhân lấy outbox cho Calendar và Sheets như B.

**Chống đặt trùng**: giao dịch Postgres + chỉ mục duy nhất có điều kiện như B. Đây là đảm bảo mạnh và quen thuộc nhất ngành.

**Giới hạn**: gói Free **tạm dừng dự án sau 1 tuần không hoạt động** [Supabase], không dùng cho chạy thật. Pro: 8 GB đĩa, 250 GB băng thông, 100.000 người dùng hoạt động/tháng, 2 triệu lượt Edge Function [Supabase].

**Chi phí** [Supabase; ước tính khối lượng]: 25 USD/tháng (gồm 10 USD tín dụng máy chủ Micro) ở 100 và 1.000 học viên; 10.000 học viên khoảng 25 đến 60 USD nếu phải nâng máy [ước tính]. Cộng email như B.

**Thời gian làm** [ước tính]: 5 đến 8 tuần.

**Vận hành**: trung bình cao. Rủi ro điển hình của ứng dụng do AI viết trên Supabase là **cấu hình RLS (quyền theo dòng) sai làm lộ dữ liệu học viên**. Phải soát bảo mật kỹ.

**Khoá nhà cung cấp**: thấp nhất (Postgres mã nguồn mở, mang đi đâu cũng chạy).

**Quay lui**: như B.

### Phương án D · Firebase (Firestore + Cloud Functions)

**Luồng**: Hosting ──> Cloud Function `book` ──> giao dịch Firestore: tạo tài liệu khoá `slots/{tutor}_{ngày}_{slot}` (tạo thất bại nếu đã có), cập nhật gói, tạo booking, tạo outbox ──> email ──> Apps Script công nhân như B.

**Chống đặt trùng**: giao dịch Firestore + mã tài liệu định trước làm khoá duy nhất. Đúng nếu viết đúng; không có ràng buộc duy nhất kiểu SQL làm lưới an toàn.

**Giới hạn**: miễn phí 50.000 lượt đọc, 20.000 lượt ghi mỗi ngày; Cloud Functions chỉ có ở gói Blaze trả theo dùng [Firebase]. Giá vượt mức: đọc 0,03 USD/100.000, ghi 0,09 USD/100.000 theo trang giá Google Cloud [Firestore pricing]; trang không tách giá theo vùng, phải kiểm lại khi tạo dự án. SLA 99,99% vùng đơn [Firestore SLA].

**Chi phí** [ước tính, giả định mỗi lượt xem slot đọc khoảng 10 tài liệu]: 100 học viên khoảng 0 USD; 1.000 khoảng 1 đến 5 USD; 10.000 khoảng 15 đến 40 USD. Cộng email. **Rủi ro chi phí bỏ chạy** khi code lỗi đọc lặp vô hạn; bắt buộc đặt cảnh báo ngân sách.

**Thời gian làm** [ước tính]: 5 đến 8 tuần.

**Vận hành**: trung bình cao (IAM của Google Cloud, quy tắc bảo mật Firestore, thanh toán theo dùng).

**Khoá nhà cung cấp**: cao (cơ sở dữ liệu tài liệu riêng của Google).

### 3.5 Bảng so sánh

| | A Apps Script cứng hoá | B Cloudflare + Apps Script công nhân | C Supabase | D Firebase |
|---|---|---|---|---|
| Hết giới hạn 30 lượt | Không, chỉ đẩy xa | Có | Có | Có |
| Lưới an toàn chống trùng ở tầng DB | Không (chỉ khoá + đối soát) | Có (chỉ mục duy nhất) | Có (mạnh nhất) | Một phần |
| Khôi phục dữ liệu | Lịch sử phiên bản Sheets + sao lưu đêm | Time Travel 30 ngày theo phút | (chưa kiểm giá sao lưu) | (chưa kiểm) |
| Chi phí thêm, 100 / 1.000 / 10.000 HV (USD/tháng, ước tính) | 0 / 6 đến 29 / không khả thi | 5 / 11 / 65 đến 70 | 25 / 31 / 85 đến 120 | 0 / 7 đến 11 / 75 đến 100 |
| Thời gian làm | 1 đến 1,5 tuần | 4 đến 6 tuần | 5 đến 8 tuần | 5 đến 8 tuần |
| Độ khó cho 2 người không lập trình | Thấp | Trung bình | Trung bình cao | Trung bình cao |
| Khoá nhà cung cấp | Google (đã có) | Trung bình | Thấp | Cao |
| Làm được khi đang chạy thật, không đóng băng | Có | Có (chạy bóng) | Có (chạy bóng) | Có (chạy bóng) |

**Cloud Run** em không đưa vào phương án chính: giá rẻ (2 triệu yêu cầu miễn phí/tháng, 0,40 USD mỗi triệu sau đó [Cloud Run]) nhưng bản thân Cloud Run không có cơ sở dữ liệu; ghép thêm Cloud SQL hoặc Firestore thì vận hành nặng hơn B mà không thêm lợi ích cho quy mô này.

---

## 4. Lộ trình khuyến nghị (một lộ trình, tương thích go live ngay trên Apps Script)

```
Giai đoạn 0 (trước go live, 1 đến 1,5 tuần) ─ cứng hoá Apps Script, đo, thử tải
      │  điều kiện chuyển: bất kỳ 1 dòng trong bảng 4.2
Giai đoạn 1 (1 đến 1,5 tuần) ─ email sang SES/Resend; bản chụp slot ra Cloudflare; lưu trữ hằng tháng
      │  điều kiện chuyển: bảng 4.4
Giai đoạn 2 (4 đến 6 tuần, chạy bóng) ─ nguồn dữ liệu sang D1 + Durable Object; Apps Script thành công nhân
      │  điều kiện chuyển: bảng 4.6
Giai đoạn 3 ─ tách Calendar khỏi một tài khoản, Calendar qua tài khoản dịch vụ; cân nhắc thêm vùng, thêm người trực
```

### 4.1 Giai đoạn 0 · Trước go live

**Việc phải code** (giao cho AI, mỗi việc kèm test trong `test/harness.js`):

| # | Việc | Sửa phát hiện | Công tắc CONFIG để quay lui |
|---|---|---|---|
| 0.1 | **Một lượt đặt chỉ lấy khoá 1 lần chính + 1 lần ngắn cuối.** Ghi ACTIVITY_LOG, NOTIFICATIONS ngay trong khoá chính. MAIL_LOG gom trong bộ nhớ, ghi một lần trong khoá ngắn cuối cùng (hoặc ghi vào CacheService, `hourlyJob` chép sang Sheets). | F1 | không cần |
| 0.2 | **Sau khi booking đã ghi, không lỗi nào được đổi kết quả thành thất bại.** Mọi bước sau (Calendar, email, thông báo, MAIL_LOG) bọc try/catch, lỗi chỉ ghi log và đưa vào hàng đợi làm lại. Trả `ok: true` kèm `warning` nếu cần. | F2 | không cần |
| 0.3 | **Hàng đợi Calendar** (cột `cal_state`: PENDING, CREATED, CANCEL_PENDING, CANCELLED, FAILED; `cal_attempts`, `cal_next_at`). Trigger `calendarWorker` mỗi 1 phút: nhận tối đa 20 việc, dừng ở 4 phút, chờ tăng dần khi lỗi, mã sự kiện định trước sinh từ booking_id (chữ a đến v, số 0 đến 9, dài 5 đến 1024 [Calendar events]); trước khi tạo lại, đọc thử mã đó để không tạo hai lần. Đường gấp: buổi bắt đầu trong vòng 3 giờ thì tạo ngay sau khi trả kết quả cho học viên. | thay "23h", F5 | `CALENDAR_MODE = INLINE / QUEUE / NIGHTLY` |
| 0.4 | **Huỷ đưa Calendar và email ra ngoài khoá** như đặt lịch (đặt `cal_state = CANCEL_PENDING`, công nhân gỡ). `reminderJob`: lấy danh sách trong khoá, gửi ngoài khoá, đánh dấu trong khoá ngắn. | F3, F4 | không cần |
| 0.5 | **requestId chống lặp** cho đặt và huỷ: trình duyệt sinh mã mỗi lần bấm; máy chủ lưu kết quả theo mã trong CacheService 6 giờ và cột `request_id` ở BOOKINGS; gửi lại cùng mã thì trả lại đúng kết quả cũ. Tự thử lại: lượt đọc tối đa 3 lần, chờ 1, 2, 4 s cộng ngẫu nhiên; lượt ghi tối đa 2 lần **cùng requestId**, sau đó tự tải "Lịch của tôi" để học viên thấy sự thật. | F6 | `CLIENT_RETRY = TRUE/FALSE` |
| 0.6 | **Gộp lượt gọi**: mở cổng học viên = 1 lượt (`apiStudentBoot` trả hồ sơ, gói, lịch, slot 14 ngày). **Bản chụp slot dùng chung** trong CacheService theo số phiên bản tăng mỗi khi lịch rảnh hoặc booking đổi; phần "ngày đã có buổi của tôi" ghép ở trình duyệt. | 1.2 | `SLOT_CACHE_SECONDS = 0` để tắt |
| 0.7 | **Đo**: bộ đếm trình duyệt và máy chủ, tab METRICS, trang `?page=health` (mục 2.3). | | |
| 0.8 | **Job đối soát mỗi giờ**: trùng (tutor, ngày, slot); quá số buổi/ngày; buổi còn dưới 2 giờ chưa có sự kiện; sự kiện Calendar không có booking tương ứng (sự kiện mồ côi); requestId thành công mà không có dòng. Vi phạm thì email admin ngay. | an toàn | |
| 0.9 | Đưa phần **lưu trữ hằng tháng (5G)** lên trước, hoặc ít nhất tách BOOKINGS thành "đang dùng" (tương lai và 30 ngày gần nhất) và "lưu trữ". | 1.4 | |
| 0.10 | Trang hiện **"Đang bảo trì"** đẹp khi `BOOKING_ENABLED = FALSE` hoặc khi trình duyệt thất bại liên tiếp 3 lượt, kèm nút Zalo. Người dùng thấy thông báo chuyên nghiệp thay vì "Không kết nối được". | | có sẵn |

**Việc 2 anh tự làm, từng bước:**

1. **Tách tài khoản STAGING khỏi admin@** (để thử tải không ăn 30 lượt của PRODUCTION):
   1. Vào admin.google.com bằng admin@ > Người dùng > Thêm người dùng mới, tên `staging@<tên miền>`. Gói Business Starter là đủ (giá đại lý khoảng 220.000 VNĐ/tháng chưa VAT [Tenten]; nguồn thứ ba ghi 7 đến 8,40 USD [EVS]).
   2. Đăng nhập `staging@` trong một hồ sơ Chrome riêng. Tạo bản sao file Sheets STAGING và project Apps Script STAGING **dưới tài khoản này**.
   3. Chạy menu cài đặt lần đầu trên STAGING. Mọi lần thử tải chỉ chạy ở đây.
2. **Bảo vệ tab dữ liệu** (chống F8): mở file PRODUCTION > tab BOOKINGS > Dữ liệu > Bảo vệ trang tính và dải ô > chọn trang tính BOOKINGS > "Hiển thị cảnh báo khi chỉnh sửa dải ô này". Làm tương tự cho AVAILABILITY, AUTH, STUDENT_PACKAGES, PAYMENTS, ACTIVITY_LOG. Muốn xem theo điều kiện thì dùng **Dữ liệu > Chế độ xem bộ lọc > Tạo chế độ xem bộ lọc mới**, không bấm sắp xếp trên dữ liệu thật.
3. **Kỷ luật cập nhật code** (chống F9): không bao giờ gõ sửa code trong trình soạn thảo của project PRODUCTION. Code chỉ đi theo đường: AI sửa trong `src/`, chạy `npm test`, đẩy lên STAGING, kiểm, rồi mới đẩy PRODUCTION theo thứ tự luật 38 (dán, lưu, menu 1, triển khai).
4. **Giám sát ngoài**: tạo tài khoản UptimeRobot > Add New Monitor > loại HTTP(s) > URL `https://script.google.com/macros/s/<mã>/exec?page=health` > chu kỳ 5 phút > thêm email và (nếu muốn) ứng dụng điện thoại để nhận báo động.
5. **An toàn tài khoản admin@**: bật xác minh 2 bước bằng khoá bảo mật hoặc ứng dụng; in mã dự phòng; email và số điện thoại khôi phục do người còn lại giữ.
6. **Thử tải theo mục 6** trên STAGING, ghi số vào bảng; chỉ go live khi đạt ngưỡng.

### 4.2 Điều kiện chuyển sang giai đoạn 1 (đo trong 7 ngày gần nhất, chỉ cần 1 dòng đúng)

| Chỉ số | Ngưỡng | Lấy ở đâu |
|---|---|---|
| Học viên hoạt động/tháng | > 300 | tab USERS |
| Người nhận email/ngày (đỉnh) | > 1.000 (67% của 1.500) | MAIL_LOG, `MailApp.getRemainingDailyQuota()` |
| Lượt gọi thất bại phía trình duyệt trong giờ cao điểm | > 0,3% | METRICS |
| p95 xem slot | > 3 s trong 3 ngày liên tiếp | METRICS |
| Lượt chạy cùng lúc ước tính ở đỉnh (lượt/giây × thời gian lượt) | > 10 (một phần ba trần) | METRICS |
| Anh dự định chiến dịch "mở lịch đồng loạt" hoặc khuyến mãi giờ vàng | có | lịch marketing |

### 4.3 Giai đoạn 1 · Email chuyên dụng, slot ra Cloudflare, lưu trữ

**Việc phải code:**
1. `sendMail_` có thêm kênh `MAIL_PROVIDER = MAILAPP / SES / RESEND`; gọi API qua `UrlFetchApp`, khoá API trong Script Properties (không trong CONFIG).
2. Một Cloudflare Worker nhỏ (khoảng 50 dòng) nhận bản chụp slot từ Apps Script (POST có khoá bí mật) và lưu vào KV; trình duyệt đọc slot từ Worker. Bản chụp **không chứa dữ liệu cá nhân** (chỉ ngày, slot, còn chỗ hay không). KV có thể chậm tới khoảng 60 giây ở nơi khác [KV]; chấp nhận được vì lượt đặt vẫn kiểm lại trong khoá ở Apps Script và trả "slot vừa có người đặt, chọn slot khác" kèm gợi ý.
3. Apps Script đẩy bản chụp mới sau mỗi thay đổi lịch (ngoài khoá) và mỗi 5 phút (phòng lỡ).
4. Hoàn thiện lưu trữ hằng tháng.

**Việc 2 anh làm, từng bước:**
1. **Email (chọn 1)**:
   * Resend (dễ hơn): resend.com > Sign up > Domains > Add Domain `mail.<tên miền>` > Resend hiện 3 đến 4 bản ghi DNS (SPF, DKIM) > vào nơi quản lý tên miền thêm đúng các bản ghi đó > chờ "Verified" > API Keys > Create, quyền "Sending access" > dán khoá vào Script Properties theo hướng dẫn AI viết. Ngưỡng: 1.000 học viên tốn khoảng 29 USD/tháng [Resend].
   * Amazon SES (rẻ hơn khi lớn, 0,10 USD/1.000 email [SES]): cần tài khoản AWS có thẻ, xác minh tên miền bằng DNS, và **gửi yêu cầu thoát chế độ thử (sandbox)** trước khi gửi được cho người lạ. Khó hơn cho người không lập trình; em khuyên dùng Resend tới khi vượt khoảng 100.000 email/tháng rồi mới chuyển SES.
   * Dùng tên miền phụ `mail.` cho email hệ thống để uy tín gửi thư tách khỏi hộp thư admin@.
2. **Cloudflare**:
   1. dash.cloudflare.com > Sign up. Ở giai đoạn 1 **chưa cần chuyển DNS**: dùng địa chỉ `<tên>.workers.dev` có sẵn.
   2. Workers & Pages > Create > "Hello World" Worker > đặt tên `thaiput-slots` > Deploy. Dán code AI viết vào Edit code > Deploy.
   3. Storage & Databases > KV > Create namespace `SLOTS` > quay lại Worker > Settings > Bindings > Add > KV namespace > tên biến `SLOTS`.
   4. Worker > Settings > Variables and Secrets > Add > loại Secret > tên `PUSH_KEY` > giá trị là một chuỗi ngẫu nhiên dài AI tạo; dán cùng chuỗi vào Script Properties của Apps Script.
   5. Bắt đầu ở gói Free (100.000 yêu cầu/ngày [CF pricing]); khi METRICS cho thấy trên 50.000 lượt/ngày hoặc Worker báo lỗi vượt CPU thì Workers Plans > Paid 5 USD.
3. **Thử tải lại** kịch bản mục 6 trên STAGING.

### 4.4 Điều kiện chuyển sang giai đoạn 2 (1 dòng đúng là đủ)

| Chỉ số | Ngưỡng |
|---|---|
| Học viên hoạt động/tháng | > 700, hoặc kế hoạch đạt 1.000 trong 3 tháng |
| p95 thời gian chờ khoá khi đặt | > 2 s trong 3 ngày |
| Lỗi BUSY trên tổng lượt đặt | > 0,5%/tuần |
| p95 đặt lịch sau khi đã lưu trữ hằng tháng | > 6 s |
| Tổng ô trong file DB | > 5 triệu (50% của 10 triệu) |
| Vi phạm bất biến dữ liệu do sửa tay trên Sheets | ≥ 1 lần/tháng |

### 4.5 Giai đoạn 2 · Nguồn dữ liệu sang D1 + Durable Object (phương án B)

**Việc phải code** (theo thứ tự, mỗi bước đều có đường lui):
1. Lược đồ D1 tương ứng SCHEMA hiện tại, kèm 3 chỉ mục duy nhất ở mục 3 B.
2. Worker API: đăng nhập, phiên, cổng học viên, cổng tutor, admin. **Luật nghiệp vụ dạng hàm thuần đã có** (`pkgRecomputeAfterChange_`, `buildTutorCandidates_`, `pickTutor_`, hàm thời gian...) mang sang dùng lại, cùng bộ test Node.
3. Durable Object `BookingDesk`: nhận yêu cầu đặt, huỷ, lưu lịch rảnh; chạy luật; ghi D1 bằng một batch.
4. Apps Script đổi vai: bỏ web app cho người dùng; thêm `calendarWorker`, `sheetsMirror`, `commandBridge` (onEdit tab LỆNH gọi Worker).
5. **Chạy bóng 2 tuần**: Apps Script vẫn là nguồn thật; mỗi lượt ghi đồng thời gửi sang Worker; job so sánh hai bên mỗi giờ. Lệch = 0 trong 7 ngày liên tiếp mới chuyển.
6. **Chuyển**: tạm khoá đặt 10 phút (thông báo trước), đồng bộ cuối, đổi link trang web sang `app.<tên miền>`, mở lại.
7. **Diễn tập quay lui** trên STAGING trước ngày chuyển, và **diễn tập khôi phục D1 Time Travel** (`wrangler d1 time-travel restore`) [D1 Time Travel].

**Việc 2 anh làm, từng bước:**
1. Tạo tài khoản GitHub, kho riêng tư `thaiput-app`; AI đẩy code vào đó.
2. Cloudflare > Workers & Pages > Create > Import a repository > chọn kho > mỗi lần đẩy code lên nhánh `main` là tự triển khai. Nhánh `staging` triển khai sang Worker STAGING.
3. Storage & Databases > D1 > Create database `thaiput-prod` (và `thaiput-staging`) > gắn vào Worker như KV ở giai đoạn 1.
4. Nâng Workers Paid 5 USD (cần cho Time Travel 30 ngày và giới hạn CPU).
5. **Chuyển DNS tên miền sang Cloudflare** (để có `app.<tên miền>`): Cloudflare > Add a domain > Cloudflare tự quét bản ghi cũ > **kiểm tay đủ các bản ghi MX, SPF, DKIM của Google Workspace và bản ghi của Google Sites** trước khi đổi nameserver ở nhà đăng ký tên miền Việt Nam. Thiếu MX là mất email toàn tên miền. Làm vào buổi sáng ngày thường, có AI hướng dẫn trực tiếp.
6. Đặt cảnh báo: Cloudflare > Notifications > thêm cảnh báo sử dụng; giữ UptimeRobot trỏ vào `app.<tên miền>/health`.

### 4.6 Điều kiện sang giai đoạn 3
* Buổi/ngày > 2.000, hoặc lời mời Calendar ra ngoài tên miền > 5.000/ngày (50% ngưỡng bóp [Calendar use limits]), hoặc trigger Apps Script > 3 giờ/ngày (50% của 6 giờ).
* Việc: tạo sự kiện Calendar từ Worker bằng tài khoản dịch vụ có ủy quyền toàn miền, chia lịch học sang 2 tài khoản chủ, hoặc bỏ thư mời Calendar và gửi link Meet bằng email (tạo phòng Meet cố định cho mỗi tutor, chế độ `TUTOR_ROOM` đã có sẵn trong code).

---

## 5. Đánh giá thẳng quyết định "Calendar gom lúc 23h"

### 5.1 Lợi ích thật
* Mỗi buổi tạo sự kiện tốn khoảng 2 đến 3 lượt gọi Calendar [code: insert, patch thêm khách admin, có thể get lại]. Đưa ra khỏi lượt bấm của học viên làm **lượt "Đặt" ngắn đi nhiều giây** [ước tính], tức là chiếm 1 trong 30 lượt ngắn hơn. **Lợi ích này có thật.**
* **Không có lợi ích cho khoá ghi**: từ 5B, Calendar đã nằm ngoài khoá khi đặt [đo cũ: "Calendar khi giữ khoá: 0"].
* Lợi ích trên **đạt được trọn vẹn bằng hàng đợi mỗi 1 phút**. Gom tới 23h không thêm lợi ích tải nào so với hàng đợi 1 phút.

### 5.2 Cái giá của 23h
1. **Thư mời và thông báo điện thoại lúc 23:00 đến 24:00.** Trigger `atHour(23)` chạy ngẫu nhiên trong giờ đó [Installable triggers]. Tutor và học viên nhận chuông lúc gần nửa đêm, nhiều thư dồn một lúc. Không chuyên nghiệp.
2. **Email xác nhận không có link Meet.** Học viên đặt lúc 9:00 phải chờ tới gần nửa đêm mới có link; thắc mắc qua Zalo tăng.
3. **Buổi sát giờ.** Luật mặc định "đặt trước 15:00 hôm trước" thì buổi ngày mai được tạo kịp. Nhưng **admin đặt thay chỉ cần slot chưa bắt đầu** [code: `override`], và `BOOKING_LEAD_HOURS` cho phép đặt trong ngày: buổi 20:00 đặt lúc 17:00 sẽ **không có sự kiện tới sau khi học xong**.
4. **Huỷ, đổi tutor trước khi tạo.** Phải có máy trạng thái (`cal_state`) để không tạo sự kiện cho buổi đã huỷ và tạo đúng tutor mới. Hàng đợi 1 phút cũng cần, nhưng cửa sổ rủi ro 1 phút thay vì 14 giờ.
5. **Một điểm hỏng duy nhất mỗi ngày.** `runJob_` gặp khoá bận thì **bỏ lượt** [code F5]. Một lần bỏ = cả ngày mai không có Meet.
6. **Giới hạn 6 phút mỗi lần chạy** [Google quotas]. [ước tính, giả định 2 đến 4 s mỗi buổi] 43 buổi mất khoảng 1,5 đến 3 phút; 430 buổi (1.000 học viên) mất 15 đến 30 phút, **phải chia nhiều lần**.
7. **Ngược khuyến nghị của Google**: tài liệu Calendar API khuyên tránh job chạy dồn cùng giờ, ví dụ đồng bộ nửa đêm [Calendar API quota]. Ở 10.000 học viên, khoảng 8.600 lời mời ra ngoài tên miền trong một khung ngắn sát ngưỡng bị bóp 10.000 [Calendar use limits].

### 5.3 Làm đúng
* **Mặc định `CALENDAR_MODE = QUEUE`**: ghi booking và gửi email xác nhận ngay (đúng ý anh); trigger mỗi 1 phút tạo sự kiện theo lô nhỏ (việc 0.3). Học viên có link Meet trong vài phút. Email xác nhận ghi "Link Meet sẽ gửi qua lời mời Google Calendar trong ít phút".
* **Giờ yên tĩnh** (nếu anh không muốn thư mời ban đêm): `CALENDAR_QUIET_FROM = 22`, `CALENDAR_QUIET_TO = 7`. Trong giờ yên tĩnh chỉ tạo sự kiện cho buổi bắt đầu trong 12 giờ tới; còn lại để 7:00.
* **Đường gấp**: buổi bắt đầu trong 3 giờ thì tạo ngay.
* **Lưới an toàn**: `reminderJob` trước 60 phút thấy buổi chưa có sự kiện thì tạo ngay và báo admin; job đối soát mỗi giờ (việc 0.8).
* **Nếu anh vẫn muốn gom một lần mỗi ngày**: em khuyên 20:00 thay vì 23:00 (thư mời vào giờ người ta còn thức), có lượt chạy bù 20:30, 21:00, có đường gấp, và cảnh báo khi còn việc chưa xong. Chế độ này để sẵn là `CALENDAR_MODE = NIGHTLY` để anh tự bật.

---

## 6. Kế hoạch đo và thử tải trước go live

### 6.1 Công cụ
* **k6** (mã nguồn mở) [k6] cho tải HTTP theo tốc độ đến (arrival rate). Vì `google.script.run` không phải API HTTP công khai, AI thêm **một cửa `doPost` chỉ bật trên STAGING** (`LOAD_TEST_ENABLED = TRUE`, khoá bí mật), gọi đúng các hàm `api*` thật. Lượt `doPost` chạy dưới cùng tài khoản nên **chiếm cùng 30 lượt** như người dùng thật: đo đúng giới hạn.
* **Playwright** (playwright.dev, mã nguồn mở) chạy 20 đến 40 trình duyệt thật cùng lúc để đo trọn đường đi gồm độ trễ của `google.script.run` và trang nhúng trong Google Sites.
* **Bộ dữ liệu**: dùng `test/tools/load_profile.js` sinh dữ liệu 1 tháng và 12 tháng, nạp vào STAGING (đúng như mục 3.2 tài liệu cũ, nhưng đo mili giây thật).
* **Ghi số**: tab METRICS (việc 0.7) + bảng tổng kết k6.

### 6.2 Kịch bản

| # | Kịch bản | Cách chạy | Ngưỡng đạt |
|---|---|---|---|
| T1 | Nền: 1 người, từng thao tác, dữ liệu 1 tháng và 12 tháng | k6 1 người dùng ảo, 20 lần mỗi thao tác | Ghi p50, p95; p95 xem slot ≤ 3 s, đặt ≤ 5 s ở dữ liệu 1 tháng |
| T2 | Buổi tối thường | 0,5 lượt/giây trong 30 phút, trộn 80% đọc, 15% đặt, 5% huỷ | Lỗi người dùng thấy ≤ 0,5%; p95 như T1 |
| T3 | **"Nhắn cả lớp 20:00"** | 60 học viên ảo mở cổng trong 60 giây; 30 người đặt vào cùng 10 slot (tranh nhau) | **0 đặt trùng; mọi lượt "thành công" có dòng; mọi lượt thua nhận câu rõ ràng**; lỗi sau tự thử lại ≤ 1%; p95 đặt ≤ 8 s |
| T4 | Tìm trần | Tăng dần 1 đến 20 lượt/giây, mỗi mức 2 phút | Ghi mức lượt/giây mà lỗi vượt 1%. **Trần phải ≥ 3 lần đỉnh dự kiến** (100 học viên: đỉnh khoảng 0,7 lượt/giây, cần trần ≥ 2 lượt/giây) |
| T5 | Ngâm | 2 giờ ở 2 lần mức T2, các trigger chạy thật (nhắc, hourly, calendarWorker) | Không rò: thời gian không tăng dần; job không bỏ lượt quá 1 lần liên tiếp |
| T6 | Mất mạng giữa chừng | Playwright tắt mạng ngay sau khi bấm "Đặt", bật lại | Không đặt hai lần (requestId); màn hình hiện đúng trạng thái sau khi tải lại |
| T7 | Hàng đợi Calendar | 50 booking dồn trong 2 phút, huỷ 10 trong số đó trước khi công nhân chạy | 40 sự kiện, 0 sự kiện mồ côi, 0 trùng; 99% có Meet trong 10 phút |
| T8 | Admin sửa Sheets trong lúc tải | Một người thật duyệt huỷ, đổi trạng thái trên Sheets khi T3 chạy | Đối soát sạch |

### 6.3 Luật thử tải
* Chỉ chạy trên STAGING **dưới tài khoản staging@** (mục 4.1). Trước go live có thể chạy dưới admin@ vì chưa có người thật, sau go live thì tuyệt đối không.
* Email trên STAGING gửi về địa chỉ thử (hộp thư nhóm), và để ý hạn mức 1.500 của tài khoản chạy.
* Không đạt ngưỡng T3 thì **không go live**, trừ khi anh ký nhận rủi ro bằng văn bản và tạm tránh mọi hành động tạo đỉnh (không nhắn cả lớp cùng giờ).

---

## 7. Phản biện giả định "phải rời Apps Script"

**Ủng hộ ở lại (lúc go live):**
* Ở 100 học viên, số liệu (1.2, 1.4) cho thấy không giới hạn Google nào bị chạm bởi tải thật nếu sửa F1 đến F6.
* Đổi nền tảng ngay trước go live, khi hai người không lập trình và code đổi hằng ngày, **làm tăng rủi ro mất booking** (di chuyển dữ liệu, hai nguồn sự thật, luồng đăng nhập mới) nhiều hơn nó giảm rủi ro tải.
* Mọi phương án khác vẫn **cần Apps Script** cho Calendar và Sheets của admin (tài khoản dịch vụ ủy quyền toàn miền khó cấu hình hơn nhiều với người không lập trình).

**Ủng hộ rời đi (khi lớn):**
* Sheets không có ràng buộc duy nhất; một khoá cho cả hệ thống; đọc cả bảng mỗi lượt; không SLA; email 1.500/ngày. Tất cả là trần cứng ở khoảng 700 đến 1.000 học viên.
* Admin sửa trực tiếp dữ liệu thật trên Sheets là nguồn sai dữ liệu im lặng mà không công cụ nào chặn được hoàn toàn.

**Kết luận**: không rời Apps Script **trước** go live; **chuẩn bị** để rời có kế hoạch, kích hoạt bằng số đo. Trong lúc chờ, mỗi việc ở giai đoạn 0 và 1 đều **dùng lại được** ở giai đoạn 2 (hàng đợi outbox, requestId, job đối soát, METRICS, luật dạng hàm thuần), nên không có công nào bỏ đi.

---

## 8. Chi phí tổng hợp theo lộ trình [ước tính, chưa gồm Workspace admin@]

| Giai đoạn | 100 học viên | 1.000 học viên | 10.000 học viên |
|---|---|---|---|
| 0 (Apps Script cứng hoá) | 0 USD; thêm staging@ khoảng 7 đến 8,40 USD hoặc 220.000 VNĐ nếu tách tài khoản | không khuyên ở quy mô này | không khả thi |
| 1 (+ email chuyên dụng, slot trên Cloudflare) | 0 đến 5 USD | khoảng 29 USD (Resend) hoặc 6 USD (SES) + 0 đến 5 USD Cloudflare | không khả thi |
| 2 (D1 + Durable Object) | khoảng 5 USD | khoảng 11 USD (SES) đến 34 USD (Resend) | khoảng 65 đến 70 USD (SES) |
| Giám sát (nếu cần gói trả phí) | 0 đến 12 USD | 12 USD | 12 USD |

Chi phí lớn nhất không nằm trong bảng: **giờ làm của 2 anh và AI**, và **chi phí của một lần sai dữ liệu** (hoàn tiền, mất uy tín). Vì vậy em xếp ưu tiên tiền vào lưới an toàn dữ liệu trước, tốc độ sau.

---

## 9. Nguồn (xem ngày 15/10/2026)

* [Google quotas] Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
* [Lock] Class Lock: https://developers.google.com/apps-script/reference/lock/lock
* [CacheService] Class Cache: https://developers.google.com/apps-script/reference/cache/cache
* [ClockTriggerBuilder] https://developers.google.com/apps-script/reference/script/clock-trigger-builder
* [Installable triggers] https://developers.google.com/apps-script/guides/triggers/installable
* [Calendar API quota] https://developers.google.com/workspace/calendar/api/guides/quota
* [Calendar events] Events resource (mã sự kiện do mình đặt): https://developers.google.com/workspace/calendar/api/v3/reference/events
* [Calendar use limits] https://knowledge.workspace.google.com/admin/calendar/avoid-calendar-use-limits
* [Gmail sending limits] https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace
* [Workspace SLA] https://workspace.google.com/terms/sla/
* [Sheets 10M] https://workspaceupdates.googleblog.com/2022/03/ten-million-cells-google-sheets.html
* [Sheets API limits] https://developers.google.com/workspace/sheets/api/limits
* [EVS] Giá Workspace (nguồn thứ ba, bài ngày 22/6/2026): https://www.emailvendorselection.com/google-workspace-pricing/ (trang chính thức https://workspace.google.com/pricing không hiện số khi tải)
* [Tenten] Giá Workspace đại lý Việt Nam: https://tenten.vn/en/email-server/gsuite
* [CF pricing] Cloudflare Workers, KV, D1, Durable Objects: https://developers.cloudflare.com/workers/platform/pricing/
* [Workers limits] https://developers.cloudflare.com/workers/platform/limits/
* [D1 limits] https://developers.cloudflare.com/d1/platform/limits/
* [D1 Time Travel] https://developers.cloudflare.com/d1/reference/time-travel/
* [DO concept] https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
* [DO limits] https://developers.cloudflare.com/durable-objects/platform/limits/
* [KV] https://developers.cloudflare.com/kv/concepts/how-kv-works/
* [Supabase] https://supabase.com/pricing
* [Firebase] https://firebase.google.com/pricing
* [Firestore pricing] https://cloud.google.com/firestore/pricing
* [Firestore SLA] https://cloud.google.com/firestore/sla
* [Cloud Run] https://cloud.google.com/run/pricing
* [Resend] https://resend.com/pricing
* [SES] https://aws.amazon.com/ses/pricing/
* [UptimeRobot] https://uptimerobot.com/pricing/
* [k6] https://grafana.com/docs/k6/latest/

**Điều em chưa kiểm được, ghi rõ để không ai hiểu nhầm:** độ trễ thật của `google.script.run`; thời gian giữ khoá thật của một lượt đặt (phải đo ở T1); thư mời do Calendar gửi có tính vào hạn mức 1.500 của MailApp không (em cho là không, cần đo bằng `MailApp.getRemainingDailyQuota()` trước và sau khi tạo sự kiện); SLA của Cloudflare gói 5 USD và giá sao lưu của Supabase; giá Workspace chính thức tại Việt Nam trên trang Google; `fetch` từ trang HtmlService tới `workers.dev` (giai đoạn 1) chạy được trong khung nhúng Google Sites hay không, phải thử trên STAGING trước khi làm.

<!-- END FILE: v8/history/KIEN_TRUC_CHUYEN_GIA_B.md -->

---

## `v8/PHAN_TICH_BAO_GIA_DEV.md`

*Ngày tạo trong Project: 2026-10-12T17:57:27Z*

<!-- BEGIN FILE: v8/PHAN_TICH_BAO_GIA_DEV.md | bytes=15183 | sha256=1776156121c4cbc528153fdfca98323440faa96720e2d480ad245a9135cab66d | created=2026-10-12T17:57:27Z -->
# Phân tích báo giá dev ngoài và những gì áp dụng được cho thaiput v8

Ngày: 13/10/2026 (bản 2: thêm mục 9 soát code v8 và mục 10 phương án trả lời)
Đầu vào: tin nhắn báo giá của bạn dev (10/10/2026), trạng thái v8 hiện tại (Apps Script web app, 3 cổng Học viên / Tutor / Admin, 94 test đạt), bảng giới hạn chính thức của Google Apps Script (cập nhật 03/09/2026), mã nguồn v8.0.2 (dist/Code.gs).

---

## 1. Tóm tắt nhanh

* Báo giá **hợp lý và trung thực** cho một web app viết riêng: 200 triệu phí làm, 5 đến 15 triệu/năm vận hành, 3 triệu/tháng bảo trì tùy chọn.
* Điều quan trọng nhất bạn dev nói: **dự án này lớn** (nhiều vai trò, phân quyền, tích hợp Meet và email). v8 đã làm đúng phạm vi đó. Nói cách khác, giá thị trường của phần anh đang có là khoảng **200 triệu**.
* Câu hỏi đáng giá nhất: **concurrent user** (bao nhiêu người dùng cùng lúc). Mục 4 trả lời bằng số. Mục 9 cho thấy điểm nghẽn thật của v8 không nằm ở số người mà ở **thời gian giữ khóa** và **dữ liệu phình theo thời gian**.
* Kết luận: **không cần thuê làm lại lúc này**. Dùng báo giá làm thước đo, sửa 2 điểm nghẽn ở mục 9 trước khi làm giao diện đẹp, và đặt sẵn "ngưỡng nâng cấp" (mục 6).

---

## 2. Bóc tách báo giá

### 2.1 Phí phát triển: 200 triệu

| Giả định của bạn dev | Số giờ thực tế | Giá mỗi giờ |
|:--|:--|:--|
| 2 tháng, 4 giờ/ngày, 5 ngày/tuần | khoảng 173 giờ | khoảng 1,15 triệu/giờ |
| 3 tháng, 4 giờ/ngày, 5 ngày/tuần | khoảng 260 giờ | khoảng 770 nghìn/giờ |

Nhận xét:

* 173 đến 260 giờ chỉ tương đương **1 đến 1,6 tháng làm toàn thời gian**. Bạn dev làm bán thời gian (4 giờ/ngày), nghĩa là việc làm thêm ngoài giờ. Rủi ro trễ hạn cao hơn so với một đội làm toàn thời gian.
* Bạn dev nói rõ là "xem sơ các chức năng chính". Đây là ước lượng nhanh, chưa phải báo giá chốt; sai số có thể lớn.
* Ý "làm với 1 người nữa sẽ nhanh hơn": cần hỏi rõ **nhanh hơn nhưng giá giữ 200 triệu hay tăng**. Thêm người thường rút ngắn thời gian, hiếm khi giảm tiền, và tốn thêm công phối hợp.
* 5 hạng mục bạn dev liệt kê (UI, code, rule nghiệp vụ, tích hợp Meet/email, Admin) khớp gần như 1:1 với 5 chunk của v8. **Rule nghiệp vụ** là phần khó và rủi ro nhất với người ngoài, và anh đã có sẵn: file 01 (50 quyết định) cùng 40 kịch bản test.

### 2.2 Chi phí vận hành: 5 đến 15 triệu/năm (khách tự trả)

| Khoản | Bạn dev ước tính | Ghi chú |
|:--|:--|:--|
| Tên miền | 300 nghìn đến 1 triệu/năm | Tùy đuôi và độ ngắn |
| Hosting app | Miễn phí đến 5 triệu/năm, thường 1 đến 2 triệu | Theo băng thông, số lần build, thời gian chạy |
| Database | Miễn phí đến 5 triệu/năm | Tương tự hosting |
| Email, Google Workspace | Gộp trong 5 đến 15 triệu | |

Điểm tinh tế: **ngay cả web app viết riêng vẫn phải trả Google Workspace** nếu muốn tự tạo link Meet và gửi mail ổn định. Phụ thuộc vào Google không mất đi khi chuyển stack, chỉ cộng thêm tiền hosting và database.

Lưu ý "free tier": nhiều gói miễn phí tự tạm dừng khi ít truy cập hoặc khởi động chậm ở lượt đầu. Với hệ thống đặt lịch, học viên vào lúc hệ thống đang "ngủ" sẽ thấy trang chậm.

### 2.3 Bảo trì: 3 triệu/tháng, tùy chọn

Tương đương 36 triệu/năm. Bạn dev nói thẳng là hệ thống ổn định thì bỏ, đây là dấu hiệu trung thực.

### 2.4 Những gì báo giá chưa nói (cần hỏi nếu đi tiếp)

1. Danh sách tính năng chốt và tiêu chí nghiệm thu.
2. Lịch thanh toán theo mốc (ví dụ 30 / 40 / 30).
3. **Quyền sở hữu mã nguồn** và các tài khoản (domain, hosting, database phải đứng tên thaiput).
4. Thời gian bảo hành lỗi miễn phí sau bàn giao (khác với bảo trì trả phí).
5. Viết test và tài liệu có nằm trong 200 triệu không.
6. Chuyển dữ liệu từ Google Sheets hiện tại sang database mới.
7. Cách tính phí khi đổi yêu cầu giữa chừng.
8. Dùng stack và dịch vụ cụ thể nào (hosting, database, dịch vụ gửi mail).

---

## 3. So sánh v8 với phương án thuê ngoài

| Tiêu chí | v8 (Apps Script, tự làm) | Web app thuê ngoài |
|:--|:--|:--|
| Phí làm | Chi phí gói Claude và thời gian của anh | 200 triệu |
| Thời gian | Đã có bản chạy thử | 2 đến 3 tháng, có thể lâu hơn |
| Vận hành/năm | Tên miền + 1 tài khoản Workspace: khoảng 2,5 đến 3,7 triệu | 5 đến 15 triệu |
| Hosting, database | Không tốn (Google lo, dữ liệu nằm trong Sheets) | Tự trả, tự theo dõi |
| Người dùng cùng lúc | Trần cứng 30 lệnh chạy song song; nghẽn thật ở khóa (mục 9) | Gần như không giới hạn nếu trả thêm |
| Test, tài liệu | 94 test giả lập, file giải thích từng chunk | Chưa rõ |
| Người hiểu hệ thống | Chỉ anh (cùng Claude) | Bạn dev |

Workspace Business Starter khoảng 7 USD/người/tháng trả theo năm. Hệ thống chỉ cần **1 tài khoản** đứng tên (ví dụ booking@tênmiền).

---

## 4. Trả lời câu hỏi "concurrent user" cho v8

### 4.1 Giới hạn của Google liên quan trực tiếp

| Giới hạn | Gmail thường (chạy thử) | Workspace |
|:--|:--|:--|
| Lệnh chạy song song mỗi tài khoản | 30 | 30 |
| Thời gian mỗi lệnh | 6 phút | 6 phút |
| Người nhận email/ngày | 100 | 1.500 |
| Tổng thời gian trigger/ngày | 90 phút | 6 giờ |
| Sự kiện Calendar tạo/ngày | 5.000 | 10.000 |

v8 deploy dạng "chạy dưới quyền người deploy", nên trần **30 lệnh song song là trần chung cho toàn hệ thống**, cộng cả trigger.

### 4.2 Ước tính tải thực tế

* Một người đang mở trang chỉ chiếm lệnh khi bấm. Nếu mỗi người bấm khoảng 15 giây một lần và mỗi lệnh 2 giây, 50 người mở trang cùng lúc chỉ tạo khoảng 7 lệnh song song.
* 4 tutor × 32 slot = tối đa 128 buổi/ngày về lý thuyết. Quy tắc ước lượng: người dùng cùng lúc lúc cao điểm bằng khoảng 5 đến 10% số học viên đang hoạt động; đỉnh dồn vào trước hạn chót 15:00.
* Con số trả lời bạn dev: **bình thường dưới 10, đỉnh khoảng 20 đến 30**. Không cần server riêng hay server cloud.

### 4.3 Điểm nghẽn thật: hàng đợi khóa

Xem mục 9.1. Đây là chỗ v8 sẽ báo "Hệ thống đang bận" trước khi chạm trần 30.

### 4.4 Giới hạn email khi chạy thử trên Gmail thường

Mỗi lượt đặt gửi mail cho học viên và tutor: trần 100 người nhận/ngày tương đương khoảng **33 đến 50 lượt đặt hoặc huỷ mỗi ngày**, chưa tính mail nhắc. Lý do chính để lên Workspace sớm.

---

## 5. Cải tiến cho v8 rút ra từ báo giá

### 5.1 Đo và chịu tải (từ câu hỏi concurrent user)
* Rút ngắn thời gian giữ khóa: **v8.0.2 hiện CHƯA làm điều này** (xem 9.1).
* Thêm test mô phỏng 10 đến 20 lượt đặt cùng lúc: tất cả thành công hoặc nhận "đang bận, thử lại", không lượt nào đặt trùng.
* Phía trình duyệt: khóa nút sau khi bấm, tự thử lại 1 lần sau vài giây nếu nhận lỗi BUSY.
* Trong tuần chạy thử, xem **My Executions** để lấy thời gian chạy thật của từng hàm.

### 5.2 Theo dõi hạn mức
* Trigger hằng ngày kiểm tra `MailApp.getRemainingDailyQuota()`; còn dưới 20% thì báo admin.

### 5.3 Bảng chi phí vận hành tách riêng
* Danh sách: tên miền, Workspace, ngày gia hạn, ai trả, tài khoản đứng tên ai. Mọi tài khoản đứng tên thaiput.

### 5.4 Sao lưu
* v8 đã có `nightlyBackup` (giữ 30 bản) và `weeklyExport` CSV. Đủ.

### 5.5 Sổ tay bảo trì (từ mức 3 triệu/tháng)
* Viết `BAO_TRI.md`: việc hằng tháng, cách thêm tutor, cách xử lý khi Google đổi giới hạn. Đây cũng là cách giảm rủi ro "chỉ một người hiểu hệ thống" (9.3).

### Gắn tên miền
Link web app nằm ở script.google.com nên tên miền chỉ cần **chuyển hướng** hoặc **nhúng qua Google Sites**, không tốn hosting.

---

## 6. Ngưỡng nâng cấp: khi nào 200 triệu mới đáng chi

Chuyển sang web app viết riêng khi xảy ra **ít nhất một** trong các điều sau:

1. My Executions thường xuyên thấy trên 20 lệnh chạy cùng lúc, hoặc học viên báo lỗi "đang bận" nhiều lần mỗi tuần **sau khi đã sửa 9.1**.
2. Cần gửi trên 1.500 email/ngày.
3. Cần thanh toán online tự động, app điện thoại, hoặc nhiều chi nhánh.
4. Số tutor vượt khoảng 15 đến 20, hoặc trang Đặt lịch chậm trên 5 giây dù đã lưu trữ dữ liệu cũ (9.2).
5. Doanh thu đủ để 200 triệu hoàn vốn trong khoảng 12 đến 18 tháng.

---

## 7. Các hướng đi

| Hướng | Mô tả | Chi phí | Phù hợp khi |
|:--|:--|:--|:--|
| **A. Giữ v8, chạy thử (đề xuất)** | Sửa 9.1 và 9.2, chạy thử Gmail thường, lên Workspace | Khoảng 2,5 đến 3,7 triệu/năm | Hiện tại |
| B. Giữ v8, thuê bạn dev soát code | Trả theo giờ 10 đến 20 giờ để soát bảo mật và tải | Khoảng 8 đến 23 triệu một lần (theo đơn giá ngầm của báo giá) | Muốn người thật kiểm tra trước khi chạy chính thức |
| C. Thuê làm lại toàn bộ | Theo báo giá, đòi báo giá chốt theo đặc tả | 200 triệu + 5 đến 15 triệu/năm | Chạm ngưỡng mục 6 |
| D. Lai | Giữ backend Apps Script, chỉ thuê trang giới thiệu trên tên miền | Thấp hơn nhiều | Muốn thương hiệu đẹp mà chưa cần đổi lõi |

---

## 9. Bổ sung 13/10: soát code v8.0.2 theo góc nhìn của bạn dev

### 9.1 Khóa bị giữ trong lúc gọi Calendar và gửi mail (nghiêm trọng nhất)

Trong `bookSessionsFor_`, toàn bộ việc sau nằm **bên trong** `withLock_`:
đọc 6 tab, kiểm tra luật, ghi booking, `Calendar.Events.insert` có tạo Meet (lần đầu có thể chờ thêm `Utilities.sleep(1000)`), tính lại gói, gửi mail học viên, gửi mail từng tutor.
`cancelBookingInternal_` cũng vậy: xoá sự kiện Calendar và gửi 2 mail khi đang giữ khóa.

Ước tính thời gian giữ khóa (cần đo thật trên My Executions):

| Thao tác | Giữ khóa |
|:--|:--|
| Đặt 1 buổi | khoảng 4 đến 8 giây |
| Đặt 7 buổi một lần | khoảng 12 đến 25 giây |
| Đặt 14 buổi một lần (mức tối đa cho phép) | khoảng 20 đến 45 giây |

`withLock_` chỉ chờ 30 giây (`tryLock(30000)`). Một học viên đặt 14 buổi có thể khiến mọi người khác (kể cả tutor lưu lịch, admin bấm duyệt, người xin link đăng nhập) nhận "Hệ thống đang bận". Lúc 14:50 trước hạn 15:00, 3 đến 4 người đặt nhiều buổi cùng lúc là đủ gây lỗi hàng loạt.

Cách sửa (giữ nguyên luật chống đặt trùng):
1. Trong khóa: kiểm tra, chọn tutor, ghi các dòng BOOKINGS (chưa có event_id), `flushDb_`, nhả khóa.
2. Ngoài khóa: tạo sự kiện Calendar, gửi mail.
3. Khóa ngắn lần 2: ghi `event_id`, `meet_link` theo booking_id.
4. Huỷ: đổi trạng thái trong khóa, xoá sự kiện và gửi mail sau khi nhả khóa.
5. Lỗi Calendar ở bước 2 đã có sẵn đường xử lý (log + báo admin + `fillMeetLink_`), không đổi.

### 9.2 Dữ liệu phình làm trang chậm dần (lời bạn dev về "database")

`table_()` đọc **toàn bộ** tab mỗi lần chạy. `availableSlotsFor_` gọi `buildTutorCandidates_` cho 14 ngày × 32 slot = 448 lần, mỗi lần duyệt **toàn bộ** AVAILABILITY và BOOKINGS.

| Sau | AVAILABILITY (ước) | BOOKINGS (ước) | Số lượt so sánh mỗi lần mở trang Đặt lịch |
|:--|:--|:--|:--|
| 1 tháng | 1.200 đến 3.900 | khoảng 900 | khoảng 1 đến 2 triệu |
| 6 tháng | 7.000 đến 23.000 | khoảng 5.500 | khoảng 6 đến 13 triệu |
| 12 tháng | 15.000 đến 47.000 | khoảng 11.000 | khoảng 12 đến 26 triệu |

Hệ quả: trang Đặt lịch và thời gian giữ khóa khi đặt đều chậm dần theo tháng, dù số học viên không đổi. Tab AUTH, ACTIVITY_LOG, MAIL_LOG cũng chỉ tăng.

Cách sửa:
1. Trong `availableSlotsFor_` và `bookSessionsFor_`: lọc AVAILABILITY và BOOKINGS về đúng khoảng ngày cần xem **một lần**, dựng bảng tra theo `ngày|slot`, rồi mới lặp 448 slot. Rẻ, lợi lớn.
2. Job hằng tháng: chuyển AVAILABILITY cũ hơn 35 ngày, BOOKINGS đã kết thúc cũ hơn 90 ngày sang file lưu trữ; xoá dòng AUTH đã hết hạn. Báo cáo tháng chạy trước khi chuyển.
3. Kiểm tra kế hoạch 5G (hiện chỉ nói lưu trữ log) có gồm 2 việc trên.

### 9.3 Rủi ro con người: chỉ một người hiểu hệ thống

Bạn dev tính 3 triệu/tháng bảo trì vì luôn có người chịu trách nhiệm. v8 hiện chỉ anh (cùng Claude) hiểu. Giảm rủi ro bằng `BAO_TRI.md`, hoặc thuê bạn dev soát code (hướng B) để có một người ngoài từng đọc hệ thống.

### 9.4 Thứ tự ưu tiên đề xuất cho các sub chunk còn lại

Sửa 9.1 và 9.2 (bước 1) **trước** 5F (thiết kế lại giao diện). Giao diện đẹp không cứu được trang báo bận lúc 14:55.

---

## 10. Phương án trả lời bạn dev

1. **Cảm ơn, giữ làm thước đo, chưa thuê**: trả lời con số concurrent user, nói đang chạy thử bản tự dựng, hẹn quay lại khi chạm ngưỡng.
2. **Thuê soát code theo giờ**: 10 đến 15 giờ, phạm vi khóa chống đặt trùng, phân quyền, điểm nghẽn dữ liệu.
3. **Xin báo giá chốt theo đặc tả**: gửi file 01, 40 kịch bản, giao diện mẫu; yêu cầu tách giá 1 người và 2 người, mốc thanh toán, bảo hành, stack, quyền sở hữu.

---

## 11. Nguồn

* [Quotas for Google Services, Apps Script](https://developers.google.com/apps-script/guides/services/quotas) (cập nhật 03/09/2026)
* [Google Workspace, các phiên bản Business](https://knowledge.workspace.google.com/admin/getting-started/editions/business-editions?hl=vi)
* Báo giá gốc: ảnh chụp tin nhắn ngày 10/10/2026
* Mã nguồn: v8/dist/Code.gs (8.0.2)

<!-- END FILE: v8/PHAN_TICH_BAO_GIA_DEV.md -->

---

## `v8/history/CHANGELOG_GIAO_DIEN_19_10.md`

*Ngày tạo trong Project: 2026-10-29T14:41:13Z*

<!-- BEGIN FILE: v8/history/CHANGELOG_GIAO_DIEN_19_10.md | bytes=3885 | sha256=a51c1326c0eeb8bebd0c31fd7c780e29d6f7a4c04c896ceb711e4dd5e3d41ef6 | created=2026-10-29T14:41:13Z -->
# Thay đổi giao diện 19/10 và 20/10/2026 (trên bản 8.0.10)

## File cần dán lại

Chỉ dán lại **Index.html**. Code.gs không đổi (đã so mã kiểm tra: giống hệt bản 8.0.10 gửi ngày 18/10), không cần chạy menu 1. Sau khi dán, bấm Lưu rồi Triển khai phiên bản mới.

## Đã đổi gì

1. **Bảng màu, phông, khoảng cách, bo góc mới** theo ảnh tham chiếu:
   - nền xám lá, khối trắng bo tròn lớn;
   - màu phấn cho trạng thái;
   - nút và mục đang chọn là viên thuốc xanh rừng.
2. **Giờ, giá, ngày** dùng chính phông Be Vietnam Pro thay phông đơn cách IBM Plex Mono. Chữ Thái dùng Noto Sans Thai Looped (đầu tròn, đọc rõ là chữ Thái).
3. **Thẻ gói học** đổi từ khối xanh đậm sang thẻ bạc hà, vẫn giữ chữ Thái chìm.
4. **Thanh tab:** điện thoại là thanh nổi bo tròn; máy tính là khối trắng bên trái.
5. **Thông báo và nhật ký của admin:** mỗi dòng là một viên trắng trên khay xám. Ô số liệu số lớn hơn.
6. **Bộ lọc** đổi thành các viên thuốc rời.
7. **Trang quản trị có thêm biểu tượng ở 4 tab**, cùng kiểu với cổng học viên, tutor.
8. **Nhãn nhỏ** không còn viết hoa toàn bộ. Chữ vẫn y như cũ, chỉ đổi cách hiện.
9. **Chỉ giao diện sáng (20/10):** bỏ chế độ tối; điện thoại, máy tính đặt chế độ tối vẫn hiện nền sáng, màu phấn như ảnh tham chiếu.
10. **Bản demo:** thanh chọn vai trò chỉ hiện một ngôn ngữ, đổi theo nút VI | EN.
11. **Sửa sau soát chéo 20/10:** thông báo nhỏ không bị bóp; nội dung cuối trang không bị thanh hành động, nút Zalo che; nút Zalo trên máy tính nằm đáy cột trái; logo nằm đầu cột trái; ô số liệu trên điện thoại thành một hàng cuộn ngang; chữ phụ, số đếm, chữ Thái đủ tương phản; ô giờ đã qua đọc được; nhãn trạng thái buổi ở trang quản trị có màu như cổng học viên (thêm class `ok`, `bad`); mũi tên trong ô số liệu không rơi xuống dòng; trang chủ không vẽ đè lên trang đăng nhập, nút Đăng nhập bấm được ngay cả khi trang chủ đang tải; trình duyệt cũ không hiểu `:has()` vẫn không bị nút Zalo che nút Đặt.

## Vì sao

Giao diện cũ trộn nhiều kiểu: 5 mức bo góc, khối vừa có viền vừa có bóng, hai phông cho số và chữ, khối lồng khối. Bản mới thống nhất một ngôn ngữ, gọn và dịu mắt hơn. Màu phấn giúp nhận ra trạng thái nhanh hơn trên điện thoại.

## Không đổi

- Không đổi một chữ nội dung nào: chữ trên web vẫn lấy từ tab CONTENT.
- Không đổi id, class, tên trường form, thứ tự trường, luồng đặt lịch, đăng ký, đăng nhập.
- Không đổi hàm máy chủ, dữ liệu, trigger, email.

Đã kiểm:
- 222 test xanh, gồm 44 test bấm thử giao diện.
- Ảnh chụp ở 360, 390, 1024 và 1366px, sáng và tối: không tràn ngang, không lỗi JavaScript.

Phần code đổi ngoài bảng màu, kiểu chữ:
- 4 biểu tượng tab của admin (thuần trang trí, trình đọc màn hình bỏ qua);
- màu nhãn trạng thái buổi ở trang quản trị, khoảng trắng không ngắt trước mũi tên ô số liệu;
- một dòng chặn vẽ đè ở trang chủ (Home.html);
- dòng tải phông trong Index.html: bỏ IBM Plex Mono, thêm Noto Sans Thai Looped, thêm thẻ chỉ dùng giao diện sáng.

## Quay lại bản cũ

Triển khai, Quản lý các lần triển khai, chọn phiên bản trước rồi Triển khai. Trang về giao diện cũ trong khoảng 1 phút. Dữ liệu không bị ảnh hưởng.

<!-- END FILE: v8/history/CHANGELOG_GIAO_DIEN_19_10.md -->

---
