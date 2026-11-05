# Luật bù buổi, bù ngày (chốt 01/11/2026, chưa code)

## Thay đổi so với bản 01/11 sáng (05:03)

* Anh chốt: BL40 (a), BL46 trừ lượt và không cộng ngày, BL47 tự cộng trong 7 ngày sau khi gói hết hạn (thay Q6), BL48 đồng ý.
* **BL42 đổi:** Trial chỉ được bù ngày **một lần, +3 ngày, trần tổng 3 ngày**. Lần bù thứ hai trở đi trả lại lượt nhưng không cộng ngày.
* BL41 (lương buổi admin huỷ muộn) **để lại**. Code không cứng hoá: lương theo ô CONFIG `PAYROLL_STATUSES` có sẵn, mặc định **không** tính CANCELLED_LATE. Khi anh chốt "có", chỉ cần thêm chữ CANCELLED_LATE vào ô đó, không cần code.
* Mọi lỗ hổng đã tìm ra đều có việc sửa trong kế hoạch: bảng đối chiếu ở `plan/KE_HOACH_5J_5P.md` mục 4.

## Thay đổi so với bản 29/10

* Ngày bắt đầu gói theo **buổi học hoàn chỉnh đầu tiên**, không còn giữ ngày bắt đầu ở buổi được bù (anh chốt 01/11).
* Sau khi ngày bắt đầu đã khoá, mỗi buổi bù cộng **1 ngày**; riêng Trial cộng **3 ngày**. Cả hai kèm bảo đảm ngày cộng thêm **đặt được thật**.
* Ô `start_date` do hệ thống giữ: không ai sửa được, sửa thì tự trả lại.
* Admin chỉ sửa được ngày kết thúc và ô ngày bù tay.
* Lỗi kỹ thuật có 3 lựa chọn (thêm "lỗi khách quan": vẫn trả lương, vẫn bù).
* "Huỷ bởi admin" giữ 1 lựa chọn: trước 15:00 hôm trước thì bù, sau đó thì trừ lượt.
* Gói đã hết hạn: không tự mở lại, admin cộng tay (Q6).
* Q1, Q3, Q4, Q7, Q8 theo đề xuất.
* **Sau soát chéo 01/11** (agent nghiệp vụ tìm 8 lỗi mức CAO): khoá ngày bắt đầu chỉ khi mọi buổi sớm hơn đã có kết quả; lưu chính ngày đã khoá; chặn rút bù khi học viên đã đặt vào ngày được cộng; bù tự động cả khi gói vừa hết hạn (BL47); sửa luật tự kích hoạt 30 ngày; sửa lỗi gói hết hạn trong lúc tạm khoá; chặn "Đổi tutor" sau giờ học; khoá thêm các ô khác của gói.
* **Sửa một câu sai của bản 29/10.** Bản trước ghi "cấu hình hiện tại cho đặt tới sát giờ học". Sai: `BOOKING_LEAD_HOURS = 0` nghĩa là **dùng luật 15:00 hôm trước** (hàm `bookingLeadHours_` đổi 0 thành -1). Người soát thứ ba đã chỉ ra đúng. Vì vậy phần "bảo đảm đặt được" là bắt buộc, không phải tuỳ chọn.

## 1. Bảng luật

| Tình huống | Trạng thái buổi | Trừ lượt Trial | Lương tutor | Ngày bắt đầu (trước khi khoá) | Cộng ngày (sau khi khoá) |
|---|---|---|---|---|---|
| Học xong | COMPLETED | Có | Có | **Khoá** tại ngày này nếu là buổi hoàn chỉnh đầu tiên | Không |
| Học viên vắng | STUDENT_ABSENT | Có | Có | **Khoá** tại ngày này | Không |
| Học viên tự huỷ trước hạn trên web | CANCELLED_STUDENT | Không | Không | Dời, như luật cũ (BL40 a, giữ B11, B12) | Không |
| Tutor vắng | TUTOR_ABSENT | Không | Không | Dời sang buổi kế tiếp | +1 (Trial: +3 một lần) |
| Tutor huỷ không ai thay, hoặc "Đổi tutor" mà không còn ai trống | CANCELLED_TUTOR | Không | Không | Dời | +1 (Trial: +3 một lần) |
| Admin huỷ **trước** 15:00 hôm trước | CANCELLED_ADMIN | Không | Không | Dời | +1 (Trial: +3 một lần) |
| Admin huỷ **từ** 15:00 hôm trước (học viên xin huỷ muộn) | CANCELLED_LATE (mới) | **Có** (câu 12) | Theo `PAYROLL_STATUSES`, mặc định không (BL41 để sau) | **Khoá** tại ngày này | Không (BL46) |
| Kỹ thuật, lỗi tutor (mặc định) | TECH_ISSUE, `tech_fault` TUTOR | Không | Không | Dời | +1 (Trial: +3 một lần) |
| Kỹ thuật, lỗi học viên | TECH_ISSUE, STUDENT | **Có** (đổi câu 27) | Có | **Khoá** | Không |
| Kỹ thuật, lỗi khách quan | TECH_ISSUE, OBJECTIVE | Không | Có | Dời | +1 (Trial: +3 một lần) |

**Dời** nghĩa là: chưa có buổi nào khoá ngày bắt đầu, nên ngày bắt đầu tạm tính lùi sang buổi sớm nhất còn lại, giống luật hiện tại. Học viên không mất ngày, nên không cộng thêm.

## 2. Ngày bắt đầu: tạm tính rồi khoá

1. **Tạm tính:** ngày bắt đầu = ngày học của buổi sớm nhất đang giữ chỗ (Xác nhận, Chờ đổi tutor) hoặc đã khoá. Đây đúng là luật hiện tại (`pkgWindow_`).
2. **Buổi làm mốc** là buổi sớm nhất (theo ngày giờ học) thuộc một trong các trạng thái:
   * Hoàn thành (tutor xác nhận, hoặc tự hoàn thành sau 24 giờ);
   * Học viên vắng;
   * Kỹ thuật, lỗi học viên;
   * Admin huỷ muộn (CANCELLED_LATE), tức học viên xin huỷ muộn (BL40 a).
3. **Chỉ khoá khi mọi buổi sớm hơn buổi làm mốc đã có kết quả cuối.**
   * Nếu chưa, chờ: ví dụ buổi 14/10 23:30 chưa xác nhận mà buổi 15/10 đã Hoàn thành thì chưa khoá, đợi buổi 14/10 có kết quả. Không làm vậy thì khoá theo thứ tự tutor bấm, không theo thứ tự ngày học (agent soát chỉ ra).
   * Buổi Kỹ thuật chỉ tính là "có kết quả cuối" khi admin đã chọn lỗi, hoặc quá `TECH_DECIDE_HOURS` (đề xuất 48 giờ) mà admin chưa chọn (khi đó giữ mặc định lỗi tutor).
4. Khi khoá, hệ thống ghi 3 cột mới:
   * `start_locked_at`: lúc khoá;
   * `start_booking_id`: buổi làm mốc;
   * `start_date_locked`: **chính ngày đã khoá**.

   `start_source` đổi thành `LOCKED`. Tự lành (mục 4) lấy lại từ `start_date_locked`, không suy lại từ buổi, vì buổi có thể bị sửa tay hoặc đã lưu trữ.
5. **Sau khi khoá, ngày bắt đầu không bao giờ đổi:**
   * buổi làm mốc về sau bị đổi thành Vắng tutor: buổi đó tính là buổi bù, cộng ngày;
   * một buổi Kỹ thuật **sớm hơn** bị admin đổi sang lỗi học viên sau khi đã khoá: ngày bắt đầu vẫn giữ, buổi đó chỉ bị trừ lượt Trial. Nếu vì vậy Trial vượt 2 lượt thì hệ thống báo admin, không tự huỷ buổi nào.
6. **Gói tự kích hoạt** (câu 3) có ngày bắt đầu cố định từ lúc kích hoạt, coi như đã khoá.
   * **Sửa luật đếm 30 ngày:** đếm từ ngày muộn hơn giữa ngày mua và ngày của buổi lỗi phía trường gần nhất.
   * Lý do (agent soát chỉ ra): hiện nay gói mua 15/09, cả 2 buổi 14/10 và 20/10 bị tutor vắng, thì ngày 21/10 dailyJob tự kích hoạt gói dù học viên chưa học buổi nào.
7. **Gói nối đuôi** (câu 6): ngày bắt đầu do hệ thống đặt theo gói trước. Chỉ hệ thống được dời khi gói trước được cộng hoặc rút ngày (Q7). Không ai sửa tay.
8. **Ví dụ của anh** (gói 30 ngày):
   * Học viên đặt 14/10 và 20/10. Buổi 14/10 tutor vắng, buổi 20/10 hoàn thành: gói chạy 20/10 đến 18/11.
   * Cùng lịch đó nhưng 14/10 học viên vắng: gói khoá từ 14/10, chạy 14/10 đến 12/11.

## 3. Cộng ngày sau khi khoá

* **Số ngày mỗi buổi bù:** `COMP_DAYS_PER_SESSION = 1`. Trial dùng `COMP_DAYS_TRIAL = 3` và trần `COMP_TRIAL_MAX_DAYS = 3`: chỉ buổi bù **đầu tiên** sau khi khoá được +3. Phần chênh "để đặt được" không tính vào trần (anh đã yêu cầu "+3 ngày + đảm bảo đặt được").
* **Bảo đảm đặt được** (có thể là ý "+1" của anh):
  * Nghĩa là **kịp hạn đặt**, không bảo đảm tutor có giờ trống ngày đó (BL48, anh đồng ý).
  * Ngày đặt được đầu tiên F: theo luật 15:00 hôm trước, F là ngày mai khi lúc bù trước 15:00, là ngày kia khi từ 15:00 trở đi. Nếu sau này đặt `BOOKING_LEAD_HOURS` lớn hơn 0 thì F là ngày đầu tiên còn ít nhất một giờ học sau mốc đặt trước, có thể là hôm nay.
  * Hạn mới = (ngày muộn hơn giữa hạn hiện tại và F − 1) + số ngày bù.
  * Ví dụ: Trial 14/10 đến 20/10, buổi 20/10 lúc 19:00 tutor vắng, admin đánh dấu lúc 21:00. F = 22/10, nên hạn mới = 21/10 + 3 = **24/10**. Học viên đặt được 22, 23, 24/10.
* **Lưu ở đâu:**
  * Cột mới `comp_days` ở BOOKINGS: số ngày buổi đó được cộng, gồm cả phần chênh để đặt được. Ghi **một lần** khi buổi trở thành "được bù". Xoá khi buổi hết được bù (ví dụ admin đổi sang lỗi học viên).
  * STUDENT_PACKAGES `comp_days` = tổng của các buổi. Tính lại bao nhiêu lần cũng ra một số, chạy đôi không cộng hai lần.
* **Gói nối đuôi (Q7, có):** gói trước được cộng ngày thì gói QUEUED phía sau dời theo. Buổi đã đặt rơi vào khoảng mới của gói trước thì chuyển sang gói trước.
* **Gói đã hết hạn (BL47, anh chốt 01/11, thay Q6):**
  * Lý do đổi: theo Q6 nguyên văn, cùng một buổi 20/10 tutor vắng, admin đánh dấu lúc 21:00 ngày 20/10 thì tự cộng, đánh dấu lúc 08:00 ngày 21/10 thì phải cộng tay. Kết quả phụ thuộc giờ admin bấm.
  * **Luật:** buổi được bù có ngày học **nằm trong hạn gói** và gói hết hạn chưa quá `COMP_REOPEN_DAYS = 7` ngày thì hệ thống tự cộng và tự mở lại gói. Ngoài hai điều kiện đó mới để admin cộng tay.
  * Khi để admin cộng tay: hệ thống vẫn ghi `comp_days` ở buổi nhưng không đổi hạn, và email admin ngay (sự kiện mới `COMP_ON_EXPIRED`, mức Cần xử lý).
  * Admin sửa hạn (mục 4) tới hôm nay trở đi thì gói tự mở lại ACTIVE, học viên nhận email.
* **Rút bù** (admin đổi lỗi kỹ thuật sang lỗi học viên, hoặc đổi trạng thái buổi): nếu học viên **đã đặt buổi** trong những ngày sắp bị rút thì hệ thống **không rút**. Hệ thống báo admin danh sách các buổi đó; admin huỷ các buổi ấy trước, hoặc chấp nhận giữ ngày (hệ thống chuyển phần ngày đó sang `comp_days_admin`). Phần chênh "để đặt được" thuộc buổi bị rút thì rút cùng.
* **Gói nối đuôi khi rút bù:** chỉ dời gói sau về lại khi không có buổi nào bị đẩy ra ngoài hạn; có thì báo admin như trên.
* **Trial nhiều lần bù (BL42):** chỉ lần bù đầu sau khi khoá được +3. Ví dụ: 14/10 Hoàn thành (hạn 20/10); 18/10 tutor vắng, hạn thành 23/10; học viên đặt 22/10, lại tutor vắng: lượt được trả lại nhưng **không cộng ngày**, hạn giữ 23/10.
  * **Hệ quả phải biết:** học viên có lượt mà có thể không còn ngày để dùng (ví dụ lần bù thứ hai rơi vào ngày cuối). Admin cộng tay qua ô `comp_days_admin` nếu muốn. Hệ thống báo admin trường hợp "còn lượt mà hết ngày" (sự kiện mới `TRIAL_LEFT_UNUSED`).
* **Hết lượt hay hết ngày?** Trial hết 2 lượt trước khi hết ngày thì vẫn hết lượt. Ngày cộng thêm không tạo thêm lượt; lượt chỉ trả lại khi buổi không bị trừ.

## 4. Ô ngày trong STUDENT_PACKAGES: ai sửa được gì

| Cột | Ai ghi | Admin sửa tay |
|---|---|---|
| `start_date`, `start_date_locked`, `start_locked_at`, `start_booking_id`, `start_source`, `comp_days`, cùng các ô khác cũng ảnh hưởng ngày bắt đầu và hạn: `purchased_at`, `status`, `suspended_days`, `package_code`, `student_id`, `sp_id` | Chỉ hệ thống | **Không.** Hiện "Không thể chỉnh sửa" |
| `comp_days_admin` (mới, "ô ngày bù" admin sửa) | Admin | Được, số nguyên, có thể âm để rút bớt |

**Vì sao tách 2 ô ngày bù** (anh nói admin sửa "các ô số ngày bù"): `comp_days` tính lại từ BOOKINGS mỗi lần có thay đổi. Admin gõ vào đó thì lần tính sau sẽ ghi đè mất. Ô `comp_days_admin` là ô ngày bù của admin, không bao giờ bị ghi đè. Phương án khác: một ô duy nhất mà admin gõ "+2" thì hệ thống cộng vào phần tay. Rối hơn, dễ nhầm, không khuyên.
| `end_date` | Hệ thống tính; admin sửa được | Được. Hệ thống tự đổi phần chênh thành `comp_days_admin` để công thức luôn khớp |

**Cách chặn và giới hạn thật của Google Sheets (nói thẳng):**
* **Lớp 1, bảo vệ vùng kiểu cảnh báo:** Google hiện hộp cảnh báo trước khi sửa. Không chặn cứng được người **chủ file** (admin@ là chủ), vì Google không cho khoá chủ file.
* **Lớp 2, onEdit trả lại giá trị cũ ngay** và hiện thông báo "Không thể chỉnh sửa". Ghi nhật ký `PACKAGE_EDIT_DENIED`.
* **Lớp 3, tự lành:** onEdit không bắt được dán qua API, sắp xếp, cắt dán dòng. Vì `start_date` luôn **tính lại được** từ BOOKINGS và cột khoá, hourlyJob đối soát và ghi lại giá trị đúng, rồi báo admin. Sai lệch tồn tại tối đa 1 giờ.
* **Xoá cả dòng gói:** không chặn được. hourlyJob phát hiện buổi trỏ tới mã gói không còn, báo Khẩn và email, hướng dẫn khôi phục từ bản sao lưu đêm.
* **Quyền sửa ô được phép:** chỉ email trong CONFIG `PKG_EDITORS` (mặc định admin@, Q8). Người khác sửa thì cũng bị trả lại.

**Hạn được tính thế nào:**

`hạn = start_date + số ngày gói + suspended_days + comp_days + comp_days_admin − 1`

**Vì sao trừ 1:** ngày bắt đầu là ngày thứ nhất của gói, đã nằm trong số ngày gói (câu 2: "thời hạn tính cả ngày đầu").
* Gói 7 ngày bắt đầu 14/10 gồm 14, 15, 16, 17, 18, 19, 20/10. Đó là 7 ngày, ngày cuối 20/10 = 14 + 7 − 1.
* Không trừ 1 thì ngày cuối thành 21/10, tức 8 ngày.
* Ví dụ trong file 01: gói 30 ngày bắt đầu 05/10 thì ngày cuối 03/11 = 05/10 + 30 − 1.
* Các phần cộng thêm (`suspended_days`, `comp_days`, `comp_days_admin`) không trừ 1, vì mỗi số là đúng số ngày thêm vào sau ngày cuối.

## 5. Lỗi kỹ thuật: 3 lựa chọn

* **Cột mới `tech_fault`:** TUTOR (mặc định khi tutor báo), STUDENT, OBJECTIVE. Đây là **nguồn duy nhất** cho cả lương, trừ lượt và bù.
* **Cột cũ `payroll_override`:** giữ để đọc dòng cũ. Menu 1 chuyển một lần: TRUE thành STUDENT, còn lại thành TUTOR.
* **Lựa chọn ở `admin_action`:**
  * "Không tính lương buổi kỹ thuật": lỗi tutor, bù cho học viên;
  * "Tính lương buổi kỹ thuật": lỗi học viên, trừ lượt Trial, không bù;
  * "Lỗi khách quan: tính lương và bù": mới.
* Đổi qua lại bao nhiêu lần cũng đúng, vì lương, lượt và ngày bù đều tính lại từ `tech_fault`.

## 6. Huỷ bởi admin (Q5)

* Một lựa chọn. Hệ thống xét thời điểm huỷ:
  * **trước** 15:00 hôm trước buổi học (`CANCEL_CUTOFF_HOUR`): CANCELLED_ADMIN, bù;
  * **từ** 15:00 trở đi: CANCELLED_LATE, trừ lượt như câu 12, không bù.
* **Cạm bẫy phải ghi trong Hướng dẫn vận hành:** huỷ muộn vì **lỗi phía trường** (ví dụ tutor ốm báo lúc 20:00 cho buổi sáng mai) mà chọn "Huỷ bởi admin" thì học viên **bị trừ**. Đúng cách:
  * chọn "**Đổi tutor**", để trống ô ghi chú: còn người thay thì đổi; không còn ai thì hệ thống huỷ với trạng thái CANCELLED_TUTOR và **bù**;
  * hoặc, khi giờ học đã qua, chọn "Vắng tutor".
* **Thời điểm xét** là lúc admin chọn ô (giờ của sự kiện sửa ô), không phải lúc hệ thống lấy được khoá. Chọn lúc 14:59:50 thì tính là trước hạn.
* Luật chia mốc 15:00 áp cho **cả** dropdown trong Sheets lẫn nút Huỷ trên trang quản trị (`apiAdminCancel`).
* **BL46 (anh chốt):** từ 15:00 hôm trước thì trừ lượt và **không** cộng ngày.
* **Lỗi đang có cần sửa cùng lúc:**
  * "Vắng tutor" cho chọn cả buổi chưa diễn ra, và ghi đè được buổi đã Hoàn thành, Học viên vắng, Kỹ thuật. Sau sửa: chỉ cho chọn khi giờ học đã bắt đầu. Ghi đè buổi đã có kết quả phải hỏi lại, vì tutor sẽ mất lương buổi đó.
  * "Đổi tutor" không kiểm giờ học: buổi đã qua giờ vẫn đổi được, rồi tutor mới tự hoàn thành và nhận lương. Sau sửa: chặn sau giờ bắt đầu.
  * Gói **hết hạn trong lúc học viên đang bị tạm khoá**: dailyJob vẫn đóng gói, mở khoá thì `pkgUnsuspendPatch_` bỏ qua gói đã EXPIRED, nên học viên mất ngày. Sau sửa: không đóng gói của học viên đang tạm khoá.

## 7. Nội dung gửi học viên (sửa được trong Sheets như mọi email và chữ web)

Thêm mẫu vào `DEFAULT_EMAIL_TEMPLATES_` (tab EMAIL_TEMPLATES) và key vào `DEFAULT_CONTENT_` (tab CONTENT), đủ 2 thứ tiếng, có cột `variables`, `position`, `shown_when` theo luật 32, 33. Chữ dưới đây là bản nháp, admin sửa được sau khi code.

| Loại | Key | Tiếng Việt (nháp) | Tiếng Anh (nháp) | Biến |
|---|---|---|---|---|
| Email | `COMP_EXTENDED` tiêu đề | Gói học được cộng {{days}} ngày | {{days}} extra days added to your package | days |
| Email | `COMP_EXTENDED` nội dung | Chào {{name}}, buổi học {{lesson_date}} {{lesson_slot}} không diễn ra vì {{reason_vi}}. Gói {{package_name}} được cộng {{days}} ngày, hạn mới: {{new_end}}. Đặt buổi tiếp theo tại {{portal_url}}. | Hi {{name}}, your lesson on {{lesson_date}} {{lesson_slot}} did not take place because {{reason_en}}. Your {{package_name}} now has {{days}} extra days, new end date: {{new_end}}. Book your next lesson at {{portal_url}}. | name, lesson_date, lesson_slot, reason_vi, reason_en, package_name, days, new_end, portal_url |
| Email | `PACKAGE_DATES_CHANGED` | Chào {{name}}, hạn gói {{package_name}} đã được điều chỉnh: {{old_end}} thành {{new_end}}. | Hi {{name}}, the end date of your {{package_name}} changed from {{old_end}} to {{new_end}}. | name, package_name, old_end, new_end |
| Chữ web | `s.comp_note` | Đã cộng {days} ngày bù. Hạn mới: {end} | {days} make up days added. New end date: {end} | days, end |
| Chữ web | `s.start_pending` | Gói bắt đầu tính từ buổi học hoàn chỉnh đầu tiên | The package starts on your first completed lesson | |
| Chữ web | `comp.reason.TUTOR_ABSENT`, `.CANCELLED_TUTOR`, `.CANCELLED_ADMIN`, `.TECH_TUTOR`, `.TECH_OBJECTIVE` | tutor vắng; tutor bận, không có người thay; trường huỷ buổi; sự cố kỹ thuật phía trường; sự cố kỹ thuật ngoài ý muốn | the tutor was absent; the tutor was unavailable and no substitute was found; the school cancelled the lesson; a technical issue on our side; an unexpected technical issue | |

Lý do không nêu tên tutor. Thư gửi theo ngôn ngữ học viên đã chọn đặt lên trên, luôn đủ 2 thứ tiếng (luật 50).

## 8. Các lỗi phải phủ khi code (test bắt buộc)

1. Tính lại 2 lần, trigger chạy đôi, chọn dropdown 2 lần: không cộng hai lần.
2. Đổi `tech_fault` qua lại: lương, lượt, ngày khớp sau mỗi lần.
3. Buổi làm mốc bị đổi thành Vắng tutor sau khi khoá: ngày bắt đầu giữ nguyên, cộng ngày.
4. Bù lúc 14:59 và lúc 15:00: phần chênh để đặt được đúng theo F.
5. Gói hết hạn: không tự đổi hạn, có thông báo; admin sửa hạn thì mở lại, có email.
6. Gói nối đuôi có buổi đã đặt: dời gói sau, chuyển `sp_id` đúng; gói sau đã từng tạm khoá thì không đếm hai lần.
7. Trial: tối đa 2 lượt dù có cộng ngày; +3 ngày chỉ khi đã khoá ngày bắt đầu, và chỉ một lần (lần bù thứ hai: trả lượt, không cộng ngày, báo admin nếu còn lượt mà hết ngày).
8. Sửa `start_date`: bị trả lại, có thông báo, có nhật ký. Dán đè, sắp xếp: hourlyJob sửa lại trong 1 giờ.
9. Sửa `end_date` thành chữ, thành ngày trước ngày bắt đầu, hoặc bởi người không thuộc `PKG_EDITORS`: bị trả lại.
10. Xoá dòng gói: báo Khẩn.
11. Lưu trữ BOOKINGS cũ (chỉ gói EXPIRED) không làm co hạn gói còn chạy.
12. Báo cáo lương tháng khớp `tech_fault` và CANCELLED_LATE.
13. Huỷ admin đúng 15:00 hôm trước: tính là muộn (giống câu 12). Chọn 14:59:50 mà khoá chạy 15:00:03: tính là trước hạn.
14. Khoá chờ buổi sớm hơn có kết quả: 14/10 23:30 chưa xác nhận, 15/10 Hoàn thành.
15. Rút bù khi đã đặt vào ngày được cộng: không rút, báo admin.
16. Gói vừa hết hạn, buổi trong hạn được bù sau 06:00 hôm sau: tự mở lại. Hết hạn quá 7 ngày: không tự mở, báo admin.
17. Tự kích hoạt 30 ngày đếm từ buổi lỗi gần nhất.
18. Tạm khoá qua ngày hết hạn: gói không bị đóng, mở khoá cộng đủ ngày.
19. Bước chuyển đổi `payroll_override` TRUE: liệt kê từng buổi để admin chọn lỗi; mặc định đề xuất OBJECTIVE (có lương, không trừ lượt Trial về trước).

## 9. Câu hỏi còn mở

* **BL41 (để sau, không chặn 5M):** buổi admin huỷ muộn có trả lương tutor không. Code theo ô `PAYROLL_STATUSES`, mặc định không tính. Đổi bằng cách thêm `CANCELLED_LATE` vào ô đó.

Các câu khác về bù buổi đã chốt (xem `BACKLOG.md` mục "Đã chốt").
