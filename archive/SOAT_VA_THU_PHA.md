# Các vòng soát chéo (5F đến 5I, soát giao diện 20/10) và nhật ký thử phá 5H, 5I

*Tệp lưu trữ, gộp ngày 30/10/2026 trong đợt dọn dẹp bản 8.0.10. Gộp nguyên văn 15 file trước đây nằm ở `v8/reports/SOAT_*` và `v8/reports/THU_PHA_*`. Các file `.txt` được đặt trong khung mã để giữ nguyên xuống dòng.*

*Mỗi file gốc nằm giữa hai dòng `<!-- BEGIN FILE ... -->` và `<!-- END FILE ... -->`, kèm số byte và mã sha256 của file gốc để kiểm chứng. Nội dung giữa hai dòng đó là nguyên văn.*

## Mục lục

1. `v8/reports/SOAT_5F_R1.md`
2. `v8/reports/SOAT_5F_R2.md`
3. `v8/reports/SOAT_5G_R1.md`
4. `v8/reports/SOAT_5G_R2.md`
5. `v8/reports/SOAT_5G_R3.md`
6. `v8/reports/SOAT_5H_R1_MAYCHU.md`
7. `v8/reports/SOAT_5H_R1_GIAODIEN.md`
8. `v8/reports/SOAT_5H_R2.md`
9. `v8/reports/THU_PHA_5H.txt`
10. `v8/reports/SOAT_5I_R1_MAYCHU.md`
11. `v8/reports/SOAT_5I_R1_GIAODIEN.md`
12. `v8/reports/SOAT_5I_R2_MAYCHU.md`
13. `v8/reports/SOAT_5I_R2_GIAODIEN.md`
14. `v8/reports/THU_PHA_5I.txt`
15. `v8/reports/SOAT_GIAO_DIEN_20_10.md`

---

## `v8/reports/SOAT_5F_R1.md`

*Ngày tạo trong Project: 2026-10-16T03:01:48Z*

<!-- BEGIN FILE: v8/reports/SOAT_5F_R1.md | bytes=21629 | sha256=fd53f79ed353d7080638383a3eb805fbddfc6ec9b59065974bef66fd13d15bd7 | created=2026-10-16T03:01:48Z -->
# Soát R1 · sub-chunk 5F (thaiput v8.0.7)

Trọng tâm: đúng sai và an toàn dữ liệu khi chạy đồng thời trên Google thật (khoá, afterLock_ và deferWrite_, thứ tự ghi, hàng đợi Calendar và cal_state ở mọi luồng, idem_ và request_id, verifyRow_, bộ đệm CONFIG và slot, đối soát, hạn mức 6 phút và 30 lượt).

Cách làm: đọc toàn bộ Db.gs, CalendarQueue.gs, CalendarSync.gs, Booking.gs, Api.gs, AdminApi.gs, AdminOps.gs, Availability.gs, Admin.gs, Jobs.gs, Sessions.gs, Notify.gs, Notifications.gs, Log.gs, Config.gs, Reset.gs, Metrics.gs, phần liên quan của Auth.gs, Schema.gs, ui/App.html. Repo gốc không sửa. PoC chạy trên bản chép:

```
cd /tmp/claude-0/-home-claude/dd50bc10-d7be-5531-bd10-84767e5e2c71/scratchpad/rev5f/R1
TZ=Asia/Ho_Chi_Minh node poc_r1.js
```

Kết quả PoC (cả 8 đều tái hiện):

```
LỖI TÁI HIỆN P1: job={"created":1,...} tutor cũ T001 -> mới T002; khách mời sự kiện = ["s003@student.test","van@tutor.test",...]; cal_state=CREATED; tiêu đề="thaiput · Học viên 3 × Vân"; đối soát báo 0 vấn đề
LỖI TÁI HIỆN P2: booking BK000002 (21:00 hôm nay, đặt 16:00 lúc job đang chạy) cal_state=PENDING; gợi ý sau job = 22:00; 23 lượt job 16:05..17:55: idle 23, tạo 0; tới 17:55 event_id=""
LỖI TÁI HIỆN P3: job={"busy":true}, chạy lại={"created":0,...}; booking CANCELLED_STUDENT/SKIPPED; sự kiện tp36... trạng thái confirmed, khách ["s003@student.test","van@tutor.test",...]
LỖI TÁI HIỆN P4: đổi tutor {"ok":true,"outcome":"REASSIGNED","tutorId":"T003"}; buổi cần đổi BK000001: PENDING_REASSIGN/T001; buổi KHÁC BK000002: tutor T002 -> T003, meet đổi=true
LỖI TÁI HIỆN P5: hourlyJob issues=0; DATA_INVARIANT=0; log: ["Đối soát lỗi: Exception: Argument too large: expirationInSeconds"]
LỖI TÁI HIỆN P6: booking COMPLETED/CANCELLED; lệnh gỡ có gửi thư: 1
LỖI TÁI HIỆN P7: sau Bước A: booking cal_state=CREATED event_id=tp36... (Bước B ở hệ thống mới bỏ qua vì đã có event_id)
LỖI TÁI HIỆN P8: tutor đóng 70 slot trong 1 khoá: 74 lần đọc Sheets, 73 lần ghi (đọc ghi xen kẽ)
```

Ghi chú về PoC: "lượt chạy khác" được giả lập bằng cách gọi hàm dịch vụ thật bên trong lời gọi Calendar giả (đúng cách I67 đang làm). Mock khoá trả bận ngay thay vì chờ 30 giây; kết quả logic giống nhau.

---

## Nghiêm trọng

Không có lỗi nào làm hỏng dữ liệu hàng loạt hoặc mất booking trong luồng thường.

## Cao

### C1. Job Calendar tạo sự kiện với tutor đã bị đổi: sự kiện mời tutor CŨ, tutor mới không có lời mời, không ai phát hiện (PoC P1)

* CalendarQueue.gs:219 và :221 đọc USERS và BOOKINGS ngoài khoá; :248 tạo sự kiện bằng `users[j.b.tutor_id]` của bản đọc đó (mỗi việc 1 đến 3 giây, cả lô tới 4 phút).
* CalendarQueue.gs:111 và :112 (calendarApplyOutcomes_) chỉ kiểm `status`, không kiểm `tutor_id` hiện tại so với tutor đã mời, rồi ghi `CREATED`.
* Availability.gs:150 và :151 (reassignBookingInLock_ gọi reassignLessonEvent_) và CalendarSync.gs:129 bỏ qua khi booking chưa có `event_id`.

Kịch bản: chế độ QUEUE (job chạy suốt ngày khi có việc) hoặc lô NIGHTLY lúc 23:00. Job đọc buổi X (tutor Vân). Trong lúc job đang gọi Calendar, admin chọn "Đổi tutor" (hoặc duyệt tutor xin huỷ, kiểu tự chọn hay chỉ định). Vì X chưa có event_id nên không có patch Calendar; tutor_id đổi sang Ánh và Ánh nhận email "buổi mới" với câu "link Meet đến cùng lời mời Google Calendar". Job ghi CREATED với sự kiện mời Vân, tiêu đề "Học viên 3 × Vân". Lời mời không bao giờ tới Ánh; Vân (người xin nghỉ) vẫn có buổi trên lịch. Đối soát mỗi giờ không thấy gì vì buổi đã có event_id.

Cùng gốc, cửa sổ nhỏ hơn: (a) đường gấp sau khoá (Booking.gs:136, tutor lấy từ `usersById` trong khoá A); (b) nhánh 409 của createLessonEvent_ (CalendarSync.gs:91 đến :96) dùng lại sự kiện cũ mà không so khách mời với tutor hiện tại, nên nếu admin đổi tutor khi mã sự kiện chưa kịp ghi (lượt ghi trễ bị bỏ), lần tạo sau dùng lại sự kiện mời tutor cũ.

Đề xuất sửa:
1. Mỗi `out` của việc tạo mang theo `tutorId`, `studentId` đã dùng. Trong calendarApplyOutcomes_ nhánh create: nếu `b.tutor_id !== o.tutorId` thì vẫn gắn event_id nhưng đăng ký `afterLock_` gọi reassignLessonEvent_ với tutor hiện tại (gửi thư cho học viên và tutor mới, gỡ tutor cũ); lỗi thì ghi trạng thái chờ đồng bộ lại (xem T1).
2. Trong nhánh 409 của createLessonEvent_: so `ev.attendees` với email học viên và tutor hiện tại, lệch thì patch.
3. Thêm test: đổi tutor trong lúc job đang tạo (giống P1) và trong lúc đường gấp đang tạo.

### C2. Đối soát mỗi giờ đặt hạn bộ đệm 86400 giây, vượt giới hạn 21600 của CacheService (PoC P5, cần xác nhận hành vi Google)

Jobs.gs:114: `cache.put(k, '1', 86400)`. Tài liệu CacheService ghi tối đa 21600 giây; chính code dự án ghi ở Auth.gs:192 "giá trị lớn hơn bị Google từ chối" và tự kẹp 21600 ở đó. gas_mock.js không kiểm hạn nên test I72 xanh (trái luật 14: harness không được tốt bụng hơn Google).

Hai khả năng trên Google thật, cả hai đều sai:
* Google ném lỗi (đúng như Auth.gs:192 tin): `once()` ném ở vấn đề đầu tiên, trước `notify_`. hourlyJob bắt lỗi ở Jobs.gs:177 và chỉ ghi Logger. Toàn bộ lưới an toàn của 5F (DATA_INVARIANT, CALENDAR_LATE, giục hàng đợi ở Jobs.gs:144) im lặng đúng lúc có vấn đề. P5 tái hiện với mock chặt.
* Google kẹp về 6 giờ: "1 lần mỗi ngày" thành tối đa 4 email Khẩn mỗi ngày cho cùng một vấn đề.

Đề xuất: dùng 21600 (khoá đã có ngày nên chỉ cần sống tới hết ngày; muốn đúng 1 lần mỗi ngày thì kiểm NOTIFICATIONS cùng ngày, cùng entity_id, hoặc Script Properties có dọn); đặt `once` sau khi notify_ thành công; sửa gas_mock.js cho `put` ném lỗi khi hạn > 21600 và khi giá trị > 100 KB, khoá > 250 ký tự.

## Trung bình

### T1. Đổi tutor vẫn gọi Calendar và gửi email TRONG khoá; patch Calendar lỗi không có hàng đợi làm lại; mở cửa cho ghi nhầm dòng (PoC P4)

* Availability.gs:151 reassignLessonEvent_ (Events.get, tối đa 3 lần patch) và :158 mailReassigned_ (3 email) chạy trong khoá; decideTutorCancelInLock_ gọi mailTutorDecision_ trong khoá ở Availability.gs:99, :105, :122, :146; hourlyJob tự từ chối hàng loạt cũng gửi trong khoá (Jobs.gs:163). Trái luật 5 ("Calendar, email đăng ký bằng afterLock_") mà 5F đã áp cho đặt và huỷ.
* Patch lỗi (Availability.gs:152 đến :155) chỉ ghi log và email admin; cal_state vẫn CREATED nên hàng đợi không bao giờ sửa lại sự kiện: học viên giữ lời mời với tutor cũ.
* Thêm vào đó, verifyRow_ chỉ kiểm mỗi dòng 1 lần trong một khoá (Db.gs:173 và :183, cờ `_verified`). reassignBookingInLock_ ghi dòng booking 2 lần (Availability.gs:139 rồi :156), giữa hai lần là vài giây gọi Calendar trong khoá. Admin sắp xếp tab BOOKINGS đúng lúc đó (đúng kịch bản F8 mà verifyRow_ sinh ra để chặn) thì lần ghi thứ hai bỏ qua kiểm tra và ghi `tutor_id`, `status`, `meet_link` vào dòng của buổi KHÁC. P4: buổi cần đổi kẹt PENDING_REASSIGN với tutor cũ, buổi bên cạnh bị đổi tutor và link Meet, sự kiện Calendar của buổi cần đổi lại đã đổi sang tutor mới. Các chỗ khác ghi cùng dòng 2 lần trong một khoá: decideTutorCancelInLock_ (done() ở :93 rồi :128 sau khi reassign), recreateFutureEvents_.

Đề xuất: (1) verifyRow_ kiểm ở mỗi lần gọi `update` (bỏ cờ `_verified` sống suốt khoá, hoặc đặt lại cờ sau mỗi việc chậm); (2) đổi tutor: trong khoá chỉ ghi tutor_id, status và một trạng thái Calendar mới (ví dụ `cal_state = RESYNC`), gỡ khách admin, patch và email làm bằng afterLock_; lỗi thì hàng đợi patch lại (job xử lý RESYNC như việc create, có backoff và FAILED).

### T2. Job ghi đè gợi ý `cal_due_at` thay vì lấy giá trị nhỏ hơn: booking đặt trong lúc job chạy bị bỏ quên tới 6 giờ (PoC P2)

CalendarQueue.gs:258 và :259 đặt thẳng `hintAt` tính từ bản đọc ngoài khoá (:221). Mọi nơi khác dùng calendarHint_ lấy min (:77 đến :82). Booking đặt sau lúc job đọc BOOKINGS và trước lượt ghi cuối của job (cửa sổ là toàn bộ thời gian gọi Calendar, tới 4 phút) bị xoá gợi ý.

P2: chế độ QUEUE, 16:00 admin đặt thay buổi 21:00 hôm nay (không gấp vì cần có sự kiện trước 18:00). Job đang chạy cho việc khác ghi gợi ý 22:00. 23 lượt job từ 16:05 tới 17:55 đều idle; tới 18:00 buổi vẫn chưa có sự kiện. Chỉ được cứu khi hourlyJob đối soát thấy "trễ" (và gửi email CALENDAR_LATE cho admin), nhưng nếu C2 xảy ra theo kiểu ném lỗi thì đối soát cũng không cứu. Ở NIGHTLY: buổi admin đặt thay hoặc đặt theo BOOKING_LEAD_HOURS trong lúc lô 23:00 chạy bị lùi tới khoảng 05:00.

Đề xuất: đọc gợi ý lúc job bắt đầu (`hint0`); trong lượt ghi cuối, nếu giá trị hiện tại khác `hint0` (có người ghi gợi ý mới trong lúc chạy) thì `hintAt = min(hintAt, hiện tại)`. Test: đặt lịch trong lúc job gọi Calendar (P2).

### T3. Học viên huỷ trong lúc job đang tạo sự kiện: nếu lượt ghi cuối của job hỏng thì sự kiện có lời mời còn mãi (PoC P3)

calendarOnCancel_ (CalendarQueue.gs:157 và :161): PENDING, không có event_id, cal_attempts 0 thì ghi SKIPPED và không gọi Google. Job không tăng cal_attempts trước khi gọi Calendar (chỉ đường gấp làm việc này ở :174). Bình thường calendarApplyOutcomes_ cứu được (thấy status đã huỷ thì gỡ). Nhưng nếu lượt withLock_ cuối của job (:255) gặp khoá bận quá 30 giây (calendarJob trả `{busy:true}`) hoặc job bị Google dừng (giới hạn 6 phút, lỗi hạ tầng) thì: booking đã SKIPPED, job không bao giờ nhìn lại SKIPPED, sự kiện mã cố định còn trên lịch, học viên và tutor giữ lời mời cho buổi đã huỷ (tutor có thể vẫn vào dạy). Cùng hậu quả khi chạy "Xoá dữ liệu test" đúng lúc job đang tạo (Reset.gs:45 chỉ lấy buổi đã có event_id).

Đề xuất: calendarOnCancel_ coi buổi có lease đang giữ (`cal_lease_<id>` trong bộ đệm) là "có thể đã tạo", đi đường gỡ theo mã cố định. Chắc hơn: job đánh dấu đang tạo (tăng cal_attempts, đặt cal_next_at) trong một khoá ngắn trước khi gọi Google, như đường gấp. Phương án khác: đối soát thỉnh thoảng thử `Events.get` mã cố định của buổi SKIPPED trong 24 giờ qua.

### T4. Trình duyệt báo "hệ thống bận" cho một lượt ghi thực ra đang chạy hoặc đã xong

Api.gs:124: lượt gửi lại cùng mã trong lúc lượt đầu đang chạy nhận `BUSY`. ui/App.html:90 cho lượt ghi có rid tối đa 3 lần, chờ 0,6 rồi 1,2 giây; App.html:104 chỉ gắn `uncertain` khi kết quả cuối là NETWORK. Kịch bản: điện thoại rớt mạng ngay sau khi gửi "Đặt" (lần 1 NETWORK, máy chủ vẫn chạy: chờ khoá tới 30 giây, rồi Calendar gấp và email), lần 2 và 3 nhận BUSY trong vòng khoảng 2 giây, trang báo "Hệ thống đang bận, vui lòng thử lại". Học viên bấm lại, mã mới, nhận "Mỗi ngày chỉ được đặt 1 buổi" cho chính các buổi vừa đặt; huỷ thì nhận "thông tin chưa hợp lệ". Dữ liệu không sai, nhưng kết quả hiển thị sai đúng loại mà luật 39 muốn tránh.

Đề xuất: idem_ trả mã riêng (ví dụ `IN_PROGRESS`) khi gặp RUNNING; trình duyệt với API trong RID_APIS: gặp IN_PROGRESS hoặc đã từng NETWORK thì tiếp tục hỏi lại cùng mã tới khoảng 60 giây, hết hạn thì gắn `uncertain` và tải lại dữ liệu thay vì báo bận.

## Thấp

### L1. Trạng thái không phải CONFIRMED đều bị coi là "đã huỷ" khi gắn kết quả tạo sự kiện (PoC P6)
CalendarQueue.gs:111 đến :118: COMPLETED, STUDENT_ABSENT, TECH_ISSUE, TUTOR_ABSENT đi nhánh gỡ, `removeLessonEvent_` gửi thư huỷ (`sendUpdates: 'all'`). Job vẫn nhận buổi đang diễn ra (:228 chỉ bỏ buổi đã kết thúc), nên tutor bấm "Hoàn thành" đúng lúc job tạo thì học viên và tutor nhận thư "đã huỷ" cho buổi vừa học. Sửa: chỉ gỡ khi `isCancelledStatus_(b.status)`; trạng thái kết quả thì ghi CREATED bình thường (hoặc bỏ qua tạo khi buổi đã bắt đầu).

### L2. Chuyển tài khoản: DETACHED bị ghi đè thành CREATED (PoC P7)
CalendarSync.gs:208 và :211 gắn DETACHED; job hoặc đường gấp đang chạy gắn kết quả ở CalendarQueue.gs:112 thành CREATED với sự kiện trên lịch của tài khoản cũ; Bước B (CalendarSync.gs:222) bỏ qua vì đã có event_id: buổi đó không có sự kiện trên lịch mới. Thêm: Bước A không gỡ sự kiện mã cố định của buổi PENDING mà mã chưa kịp ghi. Sửa: calendarApplyOutcomes_ thấy DETACHED thì gỡ sự kiện vừa tạo và giữ DETACHED; Bước A gỡ cả theo mã cố định khi cal_attempts > 0.

### L3. Chuyển tài khoản và chuyển dữ liệu gọi Calendar hàng loạt trong MỘT khoá
detachFutureEvents_ (CalendarSync.gs:205 đến :215) và recreateFutureEvents_ (:219 đến :231): mỗi buổi 2 đến 4 lời gọi Calendar trong khoá. 100 buổi có thể quá 6 phút: lượt chạy bị dừng giữa chừng và suốt thời gian đó mọi lượt đặt, huỷ nhận "bận". Nhờ mã cố định nên chạy lại không tạo trùng, nhưng nên đổi Bước B thành "ghi cal_state PENDING trong khoá, rồi chạy hàng đợi có ngân sách thời gian" (menuCalendarRunNow), Bước A tương tự với CANCEL_PENDING.

### L4. verifyRow_ biến mỗi lần ghi theo hàng thành đọc rồi ghi xen kẽ (PoC P8)
Db.gs:175: lần update đầu của mỗi dòng đọc 1 ô. Trên Google, mỗi lần đọc buộc đẩy lô ghi đang chờ, nên vòng lặp update không còn được gom. P8: tutor đóng 70 slot trong 1 khoá = 74 lần đọc, 73 lần ghi xen kẽ. Các vòng tương tự giữ khoá lâu hơn: calendarApplyOutcomes_ cho lô 40 buổi lúc 23:00, autoComplete, nhắc buổi, dailyJob. Sửa: kiểm theo lô (một getValues cột khoá cho cả tab ở lần update đầu trong khoá, so mọi dòng sẽ ghi), chỉ kiểm lại sau việc chậm.

### L5. Phiên bản slot tăng TRƯỚC khi dữ liệu tới Sheets
Db.gs:162, :163 và :205 đến :207 gọi bumpSlotsVersion_ ngay sau setValue, còn SpreadsheetApp.flush ở Db.gs:334 chạy cuối khoá (có khi vài giây sau, ví dụ huỷ rồi tính lại gói). Lượt đọc slot của người khác trong khoảng đó lấy phiên bản MỚI nhưng dữ liệu CŨ và đệm dưới khoá mới tới 60 giây. Hệ quả nhỏ (slot vừa trống chưa hiện, hoặc slot vừa hết vẫn hiện; đặt lịch kiểm lại trong khoá). Sửa: đánh dấu "bẩn" trong khoá, tăng phiên bản trong withLock_ sau SpreadsheetApp.flush.

### L6. CONFIG đệm có thể ghi lại bản cũ sau khi admin sửa, và được dùng cho quyết định ghi
Config.gs:289 đến :305: lượt A đọc tab (cũ), admin sửa, onEdit xoá đệm, A ghi bản cũ vào đệm thêm 60 giây. BOOKING_ENABLED, MAX_BOOKINGS_PER_DAY, các hạn đặt và huỷ, ALLOW_DATA_RESET đọc qua đệm này ngay trong khoá (Booking.gs:75, :87; Reset.gs:35), lệch với luật 41 "không đệm dữ liệu dùng để quyết định ghi". Rủi ro 60 giây; cách sửa rẻ: trong withLock_ đọc CONFIG thẳng từ tab (bỏ qua CacheService), hoặc ghi kèm phiên bản `cfg_v` tăng ở onEdit và chỉ nhận bản đệm có cùng phiên bản đọc TRƯỚC khi mở tab.

### L7. Mã sự kiện cố định phụ thuộc mili giây của created_at (cần kiểm trên Google thật)
CalendarSync.gs:77 băm `created_at.getTime()`. Đường gấp dùng đối tượng trong bộ nhớ (có mili giây), job, huỷ và Bước A dùng giá trị đọc lại từ Sheets. Nếu Sheets làm tròn tới giây thì hai mã khác nhau: mất tác dụng chống trùng (lượt ghi trễ bị bỏ thì job tạo sự kiện thứ hai, gửi lời mời lần hai) và gỡ theo mã cố định trượt. Mock giữ nguyên Date nên test không bắt được. Sửa rẻ: băm `Math.floor(getTime() / 1000)`; hoặc thử trên STAGING: ghi `new Date()` rồi đọc lại so mili giây.

### L8. Xoá dữ liệu test bỏ sót sự kiện
Reset.gs:45: chỉ gỡ buổi CONFIRMED hoặc PENDING_REASSIGN đã có event_id. Bỏ sót buổi CANCEL_PENDING (gỡ trước đó lỗi), buổi PENDING có sự kiện mã cố định chưa ghi mã, và việc job hoặc đường gấp đang làm (mã booking đánh lại từ BK000001 sau khi xoá, nên kết quả trễ còn có thể gắn nhầm vào booking mới cùng mã). Sửa: gỡ cả theo cal_state CANCEL_PENDING và theo mã cố định khi cal_attempts > 0; tạm chặn calendarJob (cờ trong Script Properties) trong lúc xoá.

### L9. Endpoint công khai ghi bộ đệm không giới hạn trước khi kiểm đầu vào
Api.gs:211 và :224: apiExchangeToken và apiGoogleExchange bọc idem_ trước khi kiểm link hay chữ ký; mỗi lượt với token rác và rid mới ghi 2 khoá sống 6 giờ (Api.gs:126, :131). Theo bài đo công khai của Justin Poehnelt, script cache giữ khoảng 1.000 mục và xoá theo thứ tự cũ trước (chưa xác nhận trong tài liệu chính thức). Nếu đúng, người ngoài có thể đẩy bật các khoá chống spam (login_rl_, reg:, adminerr:) và gợi ý hàng đợi. Sửa: kiểm dạng và tra AUTH (hoặc kiểm chữ ký) trước, chỉ dùng idem_ khi token hợp lệ.

---

## Đã kiểm, KHÔNG thấy lỗi

* withLock_, afterLock_, deferWrite_, runAfterLock_, flushDeferred_: gọi lồng chạy thẳng; việc sau khoá chạy sau releaseLock; withLock_ lồng trong việc sau khoá không chạy runAfterLock_ đệ quy; ghi gom flush cuối runAfterLock_ và cuối apiWrap_; lỗi ở pha sau không đổi kết quả (khớp I67). Đặt và huỷ lấy khoá tối đa 2 lần (khớp I68).
* Mọi deferWrite_ đọc lại dòng theo khoá (byId) trong khoá mới, không dùng số hàng cũ; nên verifyRow_ không bị cờ `_verified` cũ qua các khoá khác nhau.
* request_id: kiểm trong khoá, phạm vi theo học viên, còn hiệu lực khi bộ đệm mất. idem_: lỗi ném thì xoá khoá, BUSY thì xoá khoá; phạm vi có mã người dùng.
* Mã sự kiện cố định và nhánh 409 (sự kiện còn: dùng lại, không gửi thư lần hai; đã huỷ: tạo mới). Đường gấp đặt cal_attempts 1 và cal_next_at +10 phút nên job không làm trùng và huỷ ngay sau đó vẫn đi đường gỡ. Huỷ trong lúc đường gấp đang tạo: calendarApplyOutcomes_ thấy đã huỷ thì gỡ (khi lượt ghi cuối thành công).
* Hai lần chạy job chồng nhau: lease trong bộ đệm cộng mã cố định, không tạo trùng.
* flush_ dời lô khi có dòng gõ tay ở cuối; verifyRow_ với một lần update sau khi admin sắp xếp (khớp I71).
* Booking: kiểm luật, chọn tutor, 1 buổi mỗi ngày, gói, đều làm lại trong khoá; bộ đệm slot chỉ ảnh hưởng hiển thị.
* notify_ trong khoá: ghi dòng ngay, email sau khoá, đánh dấu emailed bằng ghi gom; ngoài khoá trong lượt API thì gom.
* reminderJob: đánh dấu trong khoá, gửi sau khoá, gửi hỏng cả hai thì bỏ đánh dấu.
* onEditInstallable cho BOOKINGS.admin_action: nhận việc bằng xoá ô trong khoá, trigger chạy 2 lần không xử lý 2 lần.
* Xoá dữ liệu test: phiên bị quên sau khi nhả khoá (finally), sự kiện gỡ ngoài khoá, không gửi thư.
* apiClientReport, ?page=health: chỉ bộ đệm, không Sheets, không khoá. metricAdd_ không khoá (mất cộng dồn khi chạy song song là đã chấp nhận).
* Ngân sách thời gian calendarJob (240 giây cộng tối đa 30 giây chờ khoá) nằm trong 6 phút; job idle chỉ đọc bộ đệm nên 288 lượt mỗi ngày không đáng kể với giới hạn 30 lượt đồng thời.
* Kích thước bộ đệm: CONFIG, lưới slot 14 ngày, số đo mỗi giờ, kết quả idem_ của 448 thay đổi slot đều dưới 100 KB; khoá dưới 250 ký tự.

<!-- END FILE: v8/reports/SOAT_5F_R1.md -->

---

## `v8/reports/SOAT_5F_R2.md`

*Ngày tạo trong Project: 2026-10-16T03:01:49Z*

<!-- BEGIN FILE: v8/reports/SOAT_5F_R2.md | bytes=25405 | sha256=b2ad31f6030d6672b23324b47464fedd614c6d000b86b7ef7e60ba6990cc58b4 | created=2026-10-16T03:01:49Z -->
# Soát R2 · sub-chunk 5F (thaiput v8.0.7, sau bản sửa theo R1)

Trọng tâm: (a) trải nghiệm thật trên điện thoại và máy tính; (b) bảo mật hàm công khai mới, rid, luật 24 và 37; (c) vận hành chế độ NIGHTLY, job 5 phút, nhiễu email admin, menu Đo tốc độ, METRICS, Script Properties; (d) kiểm lại các bản sửa theo R1.

Cách làm: đọc Api.gs, AdminApi.gs, CalendarQueue.gs, CalendarSync.gs, Booking.gs, Availability.gs, Sessions.gs, Jobs.gs, Metrics.gs, Notifications.gs, Notify.gs (phần email), EmailTemplates.gs (phần đặt, đổi tutor), Db.gs (verifyRow_, withLock_, sau khoá), Config.gs (phiên bản CONFIG), Reset.gs, Auth.gs (exchangeLoginToken_, requireOperator_), ui/App.html, Student.html, Tutor.html, Styles.html, phần liên quan Admin.html, Home.html, Login.html, gas_mock.js, I76 đến I78. So bản trước sửa (bản chép cũ) với bản hiện tại để soát riêng các bản sửa theo R1. Repo gốc không sửa; `npm test` trên bản chép: 26/26, 40/40, 78/78, 29/29.

Bản chép và PoC:

```
cd /tmp/claude-0/-home-claude/dd50bc10-d7be-5531-bd10-84767e5e2c71/scratchpad/rev5f/R2/repo
TZ=Asia/Ho_Chi_Minh node poc_r2.js
```

```
LỖI TÁI HIỆN Q1: lượt 1 ok=true (máy chủ đã tạo phiên, trình duyệt mất kết quả); lượt 2 cùng rid trong lúc lượt 1 chưa xong: {"ok":false,"reason":"LINK_USED"} (App.html không thử lại mã này); lượt 3 (nếu có) ok=true replay=true
LỖI TÁI HIỆN Q2: job={"created":1,...}; booking mới BK000001 (S900, 20/10 08:00) nhận event_id=tpe999f2... cal_state=CREATED; sự kiện: "thaiput · Học viên Mới × Minh" 2026-10-14T19:00:00+07:00, khách ["moi@student.test","minh@tutor.test",...]; CAL_PAUSED_UNTIL còn=đã xoá
LỖI TÁI HIỆN Q3: 2 buổi tối 13/10 chưa có sự kiện; hourlyJob 17:00 -> 2 dòng CALENDAR_LATE, 2 email admin riêng lẻ; buổi BK000001 (FAILED, đã có meet_link tay) vẫn bị báo: "... chưa có sự kiện Calendar. Hệ thống đang thử lại; ..."
LỖI TÁI HIỆN Q4: admin đặt thay lúc 23:58 (ok=true) buổi 13/10 08:00; job 5 phút: sự kiện tạo (gửi thư mời) lúc 2026-10-13 04:50
LỖI TÁI HIỆN Q5: buổi BK000001 16/10 19:00; các lần thử: 10-12 23:00, 10-12 23:05, 10-12 23:20, 10-13 23:00, 10-14 23:00; thông báo admin: ["CALENDAR_FAILED@14/10/2026 23:00"]
LỖI TÁI HIỆN Q6: lượt 23:00 {"busy":true}; lượt 23:05 {"created":0,...,"left":0} (gợi ý ghi lúc đó: now + 6 giờ); các lượt có làm việc: 10-12 23:05, 10-13 05:05, 10-13 23:00; sự kiện của BK000001 tạo lúc 2026-10-13 23:00 (đáng lẽ 23:05 hoặc 23:10 ngày 12/10)
```

Ghi chú PoC: "lượt chạy khác" giả lập bằng cách gọi hàm dịch vụ thật bên trong lời gọi Google giả (cách I67, I76 đến I78). Mock không có hạn bộ đệm, nên Q6 tự xoá `cal_lease_` sau 10 phút như Google.

Giao diện: bản demo dựng từ repo mới (`node test/build_demo.js`), thêm móc giả lập mạng (rớt mạng, bận, IN_PROGRESS, "máy chủ đã làm nhưng trình duyệt mất kết quả") và idem theo rid: `R2/mkdemo.js` ra `R2/demo_new.html`; kịch bản Playwright `R2/ui2.js` (390 điện thoại, 900, 1280), đo bố cục `R2/m2.js`. Ảnh: `/tmp/claude-0/-home-claude/dd50bc10-d7be-5531-bd10-84767e5e2c71/scratchpad/rev5f/R2/shots2/`.

---

## Nghiêm trọng

Không có.

## Cao

Không có. Không thấy đường nào làm mất booking, đặt trùng, hay lộ dữ liệu của người khác.

## Trung bình

### T1. Sửa L9 (okOnly) làm mất chống gửi trùng khi đổi link đăng nhập của tutor, admin: mạng rớt thì nhận "link đã dùng" (PoC Q1)

Api.gs:130 và :132: với `okOnly` không đặt cờ RUNNING. Auth.gs:143 tới :147: link tutor, admin dùng 1 lần bị đánh dấu đã dùng trong khoá, rồi `mailNewLogin_` gửi email "Có đăng nhập mới" NGOÀI khoá nhưng TRƯỚC khi idem_ lưu kết quả (cửa sổ 0,5 đến 2 giây). Đúng kịch bản mà rid sinh ra để chặn: tutor bấm link trên điện thoại, mạng rớt (App.html coi là NETWORK, máy chủ vẫn chạy), 0,6 giây sau trình duyệt gửi lại cùng rid, không có RUNNING nên chạy lại `exchangeLoginToken_` và nhận LINK_USED. App.html:95 không thử lại mã này; Login.html:35 hiện "Đăng nhập không thành công". Tutor phải xin link mới, trong khi hộp thư đã có email "Có đăng nhập mới" cho một lần đăng nhập mà họ không thấy (dễ tưởng bị lộ tài khoản). Trước bản sửa R1 lượt 2 nhận RUNNING và lượt 3 nhận lại đúng phiên.

Đề xuất: giữ ý của L9 (rác không ghi bộ đệm) nhưng đặt RUNNING sau khi đầu vào đã hợp lệ: cho idem_ nhận `opts.gate` (hàm kiểm rẻ: đúng dạng và có trong AUTH, hoặc chữ ký đúng) và chỉ đặt RUNNING khi gate qua; hoặc trong exchangeLoginToken_ trả kết quả, để Api.gs lưu idem_ trước, rồi mới gửi `mailNewLogin_` bằng afterLock_. Thêm test: gọi lại cùng rid bên trong MailApp giả (như Q1) phải nhận IN_PROGRESS.

### T2. Nút hành động kẹt chữ "Đang đặt..." hoặc "Saving..." sau khi hệ thống báo bận (đã chụp)

Student.html:118 và :120 tới :122; Tutor.html:187 và :189 tới :190 (lưu slot); Tutor.html:244 và :246 tới :247 (xác nhận kết quả). Lượt hỏng thì chỉ `btn.disabled = false`, không trả lại chữ cũ. Playwright, mọi cỡ màn hình: sau BUSY 3 lần nút học viên `{"text":"Đang đặt...","disabled":false}`, nút tutor `{"text":"Saving...","disabled":false}`; toast biến mất sau 3,8 giây nên người dùng thấy "Đang đặt..." mãi và chờ (ảnh `shots2/s_busy_390.png`, `t_busy_*.png`). Đây đúng là tình huống đông người mà 5F nhắm tới.

Đề xuất: trả lại nhãn (`updateBar(root)` ở học viên, `updateBar`/`updateConfirmBar` ở tutor) trong mọi nhánh lỗi.

### T3. Câu "Trang đang tải lại" áp cho mọi API ghi, nhưng phần lớn trang không tải lại (đã chụp)

App.html:106 gắn `uncertain` và câu `a.write_unknown` ("...Trang đang tải lại để hiện đúng tình trạng") cho MỌI API không nằm trong READ_APIS khi kết quả cuối là NETWORK, kể cả API không có rid và không thử lại. Chỉ Student.html:122 (đặt) và Tutor.html:247 (kết quả) tải lại. Các chỗ không tải lại: Tutor.html:190 lưu slot (Playwright: sau 9 lượt, toast "Reloading to show the real status", trang giữ nguyên các ô đã đổi, nút "Saving..."), Admin.html:268 đặt thay, :212 huỷ, Home.html:104 tới :110 đăng ký (form có ảnh chuyển khoản: người dùng gửi lại thì tạo đăng ký trùng), Login.html:22, Student.html:193 hồ sơ, :218 gia hạn. Ngoài ra lượt huỷ của học viên không có dấu hiệu đang chạy (không khoá nút, toast chỉ 3,8 giây) trong suốt tới khoảng 50 giây thử lại; bấm Huỷ lần nữa tạo rid mới và nhận "thông tin chưa hợp lệ".

Đề xuất: chỉ gắn `uncertain` cho RID_APIS; với API khác dùng câu "Mạng chập chờn, chưa chắc đã gửi. Kiểm tra email hoặc thử lại sau". Mỗi trang gọi API trong RID_APIS xử lý `uncertain` bằng tải lại dữ liệu (lưu slot: `drawAvail`; admin: `openPerson`). Khi đang thử lại, giữ một dải "Đang thử lại..." tới khi xong thay vì toast 3,8 giây; khoá nút Huỷ của buổi đang huỷ.

### T4. Lượt 23:00 gặp khoá bận thì cả lô NIGHTLY trễ 24 giờ (PoC Q6)

CalendarQueue.gs:300 đặt giữ chỗ `cal_lease_` 10 phút trước bước đánh dấu (:305, withLock_ chờ 30 giây). Khoá bận thì ngoại lệ thoát khỏi runCalendarQueue_, :339 (gỡ giữ chỗ) không chạy. Lượt 23:05: :298 lọc bỏ việc đang giữ chỗ và KHÔNG đưa chúng vào `nextDue`, nên :333 ghi gợi ý `now + 6 giờ` (05:05). Lúc 05:05 cửa sổ đã đóng, việc dời sang 23:00 hôm sau. Q6: buổi 14/10 19:00 lẽ ra có lời mời lúc 23:05 ngày 12/10, thực tế 23:00 ngày 13/10. Buổi sáng hôm sau (cần trước 04:50) bị tạo lúc 05:05, sau mốc và sinh email CALENDAR_LATE. Cùng gốc ở chế độ QUEUE (trễ 6 giờ), và khi lượt ghi cuối (:330) bận.

Đề xuất: bọc phần sau :300 bằng try/finally gỡ giữ chỗ; khi lọc việc đang giữ chỗ thì `nextDue = Math.min(nextDue, now + 10 phút)`. Test: lockBusy ở bước đánh dấu rồi chạy job 5 phút một (như Q6).

### T5. NIGHTLY không có "tổng kết 23h"; lỗi Calendar cả lô chỉ báo từng buổi, có buổi sau 48 giờ (PoC Q5)

Ý chủ sân: "ghi nhận booking và gửi mail xác nhận xong, 23h tổng kết rồi set calendar và gửi invitation". Phần ghi nhận và email xác nhận ngay, tạo sự kiện từ 23:00 là đúng (CalendarQueue.gs:43 tới :61, Booking.gs:134 tới :145). Phần "tổng kết" không có: lô 23:00 chỉ ghi một dòng ACTIVITY_LOG (CalendarQueue.gs:337). Khi cả lô lỗi (dịch vụ Calendar nâng cao chưa bật, hết hạn mức, đổi LESSON_CALENDAR_ID sai), lùi lần thử (`CAL_BACKOFF_MIN_` :20) cộng cửa sổ đêm làm lần 4 và 5 rơi vào 23:00 các đêm sau: Q5 báo CALENDAR_FAILED lúc 23:00 ngày 14/10 cho lỗi bắt đầu 23:00 ngày 12/10, mỗi buổi một email. Buổi sáng hôm sau chỉ được báo qua CALENDAR_LATE khoảng 3 giờ trước giờ học.

Đề xuất: cuối lượt có việc trong cửa sổ đêm (hoặc lượt cuối trước 00:00) gửi một notify `CALENDAR_NIGHTLY_SUMMARY` (mặc định EMAIL khi có lỗi, LOG khi đủ): đã tạo, lỗi, còn chờ, kèm danh sách buổi lỗi. Lỗi ở lần thử đầu của cả lô (ví dụ tất cả việc đều lỗi) thì báo ngay, không chờ đủ CALENDAR_MAX_ATTEMPTS. Phương án khác: trong NIGHTLY, lần thử lại vẫn nằm trong cùng đêm (backoff 5, 10, 15 phút) để FAILED xảy ra trước 23:59.

### T6. Đối soát gửi email riêng từng buổi, báo cả buổi admin đã xử lý tay, câu chữ sai (PoC Q3)

Jobs.gs:144 chỉ xét `event_id`, nên buổi FAILED mà admin đã dán `meet_link` tay đúng như email CALENDAR_FAILED hướng dẫn vẫn bị báo mỗi ngày; câu ở :153 "Hệ thống đang thử lại" sai với FAILED (hàng đợi không thử lại FAILED). :149 tới :153 mỗi buổi trễ một notify EMAIL (CALENDAR_LATE mặc định EMAIL, Notifications.gs). Calendar hỏng một buổi tối có 20 buổi thì admin nhận khoảng 20 email CALENDAR_LATE cộng 20 email CALENDAR_FAILED.

Đề xuất: bỏ qua buổi có `meet_link` hoặc `cal_state` FAILED (đã báo); gộp mọi buổi trễ của một lượt đối soát thành một notify (entity_id là danh sách, so "đã báo hôm nay" theo từng mã trong danh sách); câu chữ theo trạng thái (PENDING: "đang thử lại"; FAILED: "cần gửi link tay").

### T7. Tab METRICS: đọc toàn bộ tab mỗi giờ trong khoá, phình không giới hạn trong file DB

Metrics.gs:55 `table_('METRICS')` đọc cả tab bằng `getDataRange().getValues()` (Db.gs:56) chỉ để thêm dòng, trong khoá của hourlyJob (Jobs.gs:182). Mỗi giờ có ít nhất 2 dòng (`_lock_wait`, `_lock_hold` của các job), giờ có người dùng 10 đến 25 dòng (mỗi hàm API một dòng). Ước tính 150 đến 250 dòng mỗi ngày, 55 đến 90 nghìn dòng mỗi năm, 0,5 đến 0,8 triệu ô trong cùng file DB (giới hạn 10 triệu ô cho cả file). Không có dọn. Sau một năm, mỗi lượt hourlyJob đọc thêm gần một triệu ô trong khoá (vài giây giữ khoá mỗi giờ, tăng dần).

Đề xuất: thêm dòng mà không nạp tab (ghi thẳng `getRange(getLastRow() + 1, 1, n, width).setValues`, có kiểm tab đầy), hoặc để METRICS ở file riêng; giữ 60 hoặc 90 ngày (dọn 1 lần mỗi ngày cùng AUTHPURGE), hoặc gộp theo ngày sau 7 ngày.

## Thấp

### L1. Sửa L8 (tạm dừng hàng đợi khi xoá dữ liệu test) không chặn được lượt job đang chạy: buổi mới cùng mã nhận sự kiện sai giờ (PoC Q2)
Reset.gs:44 đặt `CAL_PAUSED_UNTIL`, nhưng CalendarQueue.gs:269 chỉ kiểm ở ĐẦU lượt; lượt đang gọi Google (đúng trường hợp R1 nêu) vẫn gắn kết quả ở lượt ghi cuối, sau khi reset nhả khoá. Reset.gs:74 lại xoá cờ ngay cuối reset, nên cờ chỉ sống vài giây. Q2: sau reset, admin nạp học viên mới và đặt BK000001 (20/10 08:00); job gắn sự kiện của BK000001 cũ (14/10 19:00), thấy tutor khác nên RESYNC và gửi thư mời cho học viên MỚI vào ngày giờ SAI, cal_state CREATED, đối soát không phát hiện. Chỉ xảy ra quanh lần xoá dữ liệu test (thường ngay trước khi chạy thật). Sửa: trong calendarApplyOutcomes_ nhánh create, nếu `o.ev.eventId !== lessonEventId_(b)` (mã cố định phụ thuộc booking_id và created_at) thì coi là booking khác: gỡ sự kiện vừa tạo, không gắn. Hoặc reset tăng một "thế hệ dữ liệu" trong Script Properties, job so thế hệ lúc đầu và lúc ghi.

### L2. NIGHTLY gửi thư mời lúc 04:50 sáng (PoC Q4)
Đặt sau 23:55 (admin đặt thay, hoặc khi bật BOOK_UNTIL_START hay BOOKING_LEAD_HOURS > 0), việc còn dư của lô 23:00 (quá CALENDAR_BATCH_MAX, quá 4 phút), và lần thử lại sau lỗi của lô đêm: CalendarQueue.gs:72 dời tới `needBy - 10 phút`, với buổi 08:00 là 04:50. Học viên, tutor nhận email Calendar giữa đêm. Sửa: trong NIGHTLY, việc chưa gấp mà lỡ cửa sổ thì chạy tiếp tới CALENDAR_NIGHTLY_HOUR + 1 (ví dụ tới 00:30) hoặc dời sang 07:00 nếu needBy còn cho phép; chỉ tạo giữa đêm khi buổi thật sự gấp.

### L3. Học viên không biết khi nào có lời mời
EmailTemplates.gs:34 "Bạn cũng nhận được thư mời Google Calendar cho từng buổi"; Notify.gs:87 "link Meet đến cùng lời mời"; Content.gs:147, :148 "trước giờ học". Ở NIGHTLY thư mời đến khoảng 23:00 (có khi 04:50, L2); học viên đặt buổi sáng thấy email xác nhận không có link, tìm thư mời không thấy, dễ nhắn admin. Sửa: thêm biến `invite_when` (ví dụ "Thư mời có link Meet gửi tối nay khoảng 23:00") vào BOOKING_CONFIRM và `s.meet_pending`, tính theo calendarDueAt_. Phương án khác: đổi CALENDAR_NIGHTLY_HOUR sớm hơn (ví dụ 21:00) để thư mời không đến lúc khuya.

### L4. Màn hình 900 đến khoảng 1020px: lưới slot học viên hẹp hơn điện thoại (đã đo)
Styles.html:222 và :225: cột trái 300px cộng 2 cột ngày. Đo `R2/m2.js`: 899px mỗi thẻ ngày 528px, 6 nút một hàng; 900px còn 144px, 1 nút một hàng, tiêu đề "Thứ 7 17/10" xuống 3 dòng, nhãn "Đã có buổi" tràn ra ngoài thẻ (3 chỗ); 960px 174px, 1 nút; 1024px 206px, 2 nút; từ 1180px mới đẹp (3 nút). Ảnh `shots2/s_book_900.png`. Sửa: 1 cột ngày dưới 1180px (`.day-grid` 2 cột chỉ khi `min-width: 1180px`), hoặc cột trái 240px. Không có cuộn ngang ở 390, 900, 1280 cho học viên, tutor, admin.

### L5. Lượt thử lại kéo dài vẫn vẽ lại trang cũ sau khi người dùng đã chuyển tab
Student.html:162 và :122, Tutor.html:247: callback của lượt thử lại (tới khoảng 50 giây) gọi `render` dù người dùng đã sang tab khác (mất các slot đang chọn). Trong demo, chuyển vai trò trong lúc lượt huỷ còn thử lại thì trang học viên vẽ lại bằng phiên tutor và bị đưa về trang đăng nhập. Sửa: chỉ vẽ lại khi `T.state.page` và tab vẫn như lúc gửi.

### L6. Email đổi tutor và email nhắc: phần tiếng Anh in câu tiếng Việt khi chưa có link
Notify.gs:162 và :189 gọi `meetA_(booking.meet_link)` không truyền `'en'`. Ở NIGHTLY, đổi tutor trước 23:00 (chưa có sự kiện) nay là chuyện thường nên tutor đọc thấy "link Meet đến cùng lời mời Google Calendar" trong phần tiếng Anh. Sửa: truyền `'vi'`, `'en'`.

### L7. apiClientReport và trang health
* Api.gs:144: hàm công khai không chống spam (luật 24 ghi "có chống spam"). Chỉ ghi bộ đệm nên không phá luật 37, nhưng người ngoài cộng được tới 50 lượt "_client_fail" mỗi lần gọi vào METRICS và làm mất số đo thật (metricAdd_ đọc rồi ghi một khối JSON chung, Metrics.gs:17 tới :27). Sửa: chặn khi `_client_*` của giờ đã quá ngưỡng (ví dụ 2.000), hoặc ghi vào khoá riêng `m_client_<giờ>`.
* Api.gs:63 tới :67: `?page=health` công khai lộ phiên bản và số lượt gọi trong giờ (mức độ đông khách). Nhỏ; có thể chỉ trả "OK".

### L8. Sửa L7 (mã sự kiện theo giây) còn rủi ro ở biên giây, và đổi mã của dữ liệu cũ
CalendarSync.gs:78: `Math.floor(ms / 1000)` vẫn lệch nếu Sheets làm tròn lên (12:00:00.9996 đọc lại thành 12:00:01.000). Bản trong bộ nhớ (đường gấp) và bản đọc lại (job, huỷ) khi đó ra 2 mã. Chắc hơn: cắt mili giây ngay khi ghi `created_at` (Booking.gs:116 dùng `new Date(Math.floor(now / 1000) * 1000)`). Booking trên STAGING tạo trước bản sửa mà chưa ghi event_id sẽ không gỡ được theo mã cố định (mã đã đổi); trước khi chạy thật nên "Xoá dữ liệu test".

### L9. Executions bị 288 dòng calendarJob mỗi ngày
Không phải lỗi tài nguyên (xem phần đã kiểm), nhưng admin tìm lượt lỗi trên trang Executions khó hơn. Có thể ghi chú trong tài liệu vận hành (lọc theo tên hàm).

---

## Kiểm lại các bản sửa theo R1

| R1 | Bản sửa | Kết luận R2 |
|---|---|---|
| C1 đổi tutor lúc đang tạo | outcome mang `tutorId`; lệch thì RESYNC và vá sau khoá (CalendarQueue.gs:129 tới :131); nhánh 409 so khách mời (CalendarSync.gs:97 tới :105) | Đúng (I76). Nhánh 409 vá có gửi thư cho học viên và tutor hiện tại, hợp lý. |
| C2 hạn bộ đệm 86400 | đối soát tra NOTIFICATIONS cùng ngày (Jobs.gs:114 tới :118); mock ném lỗi khi hạn > 21600, khoá > 250, giá trị > 100 KB | Đúng. Mock vẫn không mô phỏng hết hạn (đã thấy hậu quả ở Q6). |
| T1 đổi tutor trong khoá | Availability.gs:150 tới :156: chỉ ghi, RESYNC, email sau khoá | Đúng; thứ tự sau khoá: vá Calendar trước, email sau. |
| T2 ghi đè gợi ý | `cal_hint_seq` (CalendarQueue.gs:82, :335) | Đúng (I77). Nhưng xem T4: việc đang giữ chỗ không được tính vào gợi ý. |
| T3 huỷ lúc job tạo | đánh dấu trước trong khoá ngắn (CalendarQueue.gs:303 tới :314), calendarOnCancel_ thấy cal_attempts > 0 thì gỡ theo mã cố định | Đúng (I77). Thêm một lần lấy khoá mỗi lượt có việc; khoá bận ở đây sinh T4. |
| T4 IN_PROGRESS | Api.gs:128, App.html:95 tới :106 | Đúng ở máy chủ và trình duyệt: Playwright thấy cùng một rid qua 3 lượt rớt mạng, 4 lượt IN_PROGRESS, và lượt "đã làm nhưng mất kết quả" nhận lại đúng kết quả. Phần hiển thị còn T2, T3. |
| L1 trạng thái kết quả bị coi là huỷ | chỉ `isCancelledStatus_` mới gỡ | Đúng (I77). |
| L2 DETACHED | gỡ sự kiện vừa tạo, giữ DETACHED; bước A gỡ theo mã cố định khi cal_attempts > 0 | Đúng khi đọc code. |
| L4 verifyRow_ | đọc cột khoá 1 lần cho cả lô, dùng lại 1,5 giây (Db.gs:173 tới :190) | Đúng; còn rủi ro nhỏ khi admin sắp xếp trong 1,5 giây sau lần đọc (chấp nhận được). |
| L5 phiên bản slot | đánh dấu trong khoá, tăng sau `SpreadsheetApp.flush` (Db.gs:289, :350) | Đúng. |
| L6 CONFIG đệm cũ | `cfg_ver` đọc trước khi mở tab (Config.gs:279 tới :323) | Đúng (I78); hết hạn `cfg_ver` chỉ làm bỏ đệm, không dùng bản cũ. |
| L7 mili giây | theo giây | Xem L8. |
| L8 xoá dữ liệu test | gỡ thêm CANCEL_PENDING và mã cố định; tạm dừng hàng đợi | Phần gỡ đúng; phần tạm dừng không có tác dụng (L1, Q2). |
| L9 bộ đệm cho link rác | `okOnly` | Đạt mục tiêu luật 37 nhưng sinh T1 (Q1). |

R1 L3 (chuyển tài khoản gọi Calendar hàng loạt trong khoá) chưa sửa; vẫn đúng như R1 mô tả.

---

## Đã kiểm, KHÔNG thấy lỗi

**Trải nghiệm (Playwright trên demo dựng từ repo mới, 390, 900, 1280px)**
* Đặt lịch khi rớt mạng 2 lần: toast "Đang đông người, hệ thống đang tự thử lại...", 3 lượt cùng rid, kết quả đúng 1 buổi. IN_PROGRESS 3 lần: 4 lượt cùng rid, kết quả đúng. Máy chủ đã làm nhưng trình duyệt mất kết quả: lượt 2 nhận lại kết quả cũ, không đặt thêm.
* Đặt lịch mất mạng hẳn: trang chuyển sang "Lịch của tôi" và tải lại (đúng luật 39).
* Tutor xác nhận 2 bước: chọn kết quả (bấm lại để bỏ), thanh dưới "Save 1 result(s)", hộp xem lại liệt kê ngày, giờ, học viên, kết quả cùng câu "chỉ admin sửa được sau khi lưu", nút Save và Back; một lượt gọi cho cả lô, một khoá. Ảnh `shots2/t_review_390.png`.
* Bố cục từ 900px: thanh tab thành cột trái 220px cho học viên, tutor, admin; thanh hành động và toast dịch theo; hộp thoại ra giữa màn hình; lịch rảnh tutor 4 cột (900 đến 1180) rồi 7 cột; không cuộn ngang ở cả ba cỡ.
* Ghi chú link Meet trên trang (lịch học viên, lịch tutor, hộp kết quả đặt) có mặt khi chưa có link; email xác nhận khi chưa có Meet ghi "link Meet đến cùng lời mời Google Calendar" ở cả hai thứ tiếng (chỉ thiếu thời điểm, L3).
* Cổng học viên dùng slot đi kèm lượt mở cổng (1 lượt gọi), dùng lại 60 giây, đặt hoặc huỷ xong thì bỏ.

**Bảo mật**
* rid không phát lại được kết quả của người khác: idem_ băm `phạm vi | rid`, phạm vi luôn có user_id lấy từ phiên (Api.gs:301, :312, :370, :377, :389; AdminApi.gs:221, :232) hoặc băm của link, chữ ký (công khai). `request_id` ở BOOKINGS so cả `student_id` (Booking.gs:70). Học viên gửi rid của admin đặt thay cho chính mình chỉ nhận lại buổi của chính mình. rid sai dạng bị bỏ (Booking.gs:155).
* Luật 37: apiClientReport chỉ nhận 3 loại, kẹp 1 đến 50, chỉ ghi bộ đệm, không Sheets, không khoá; `?page=health` trả trước mọi `cfg_` và không mở Sheets; đổi link rác không ghi gì vào bộ đệm (I78).
* Luật 24: mọi hàm công khai không đuôi `_` ngoài `api*`, `doGet`, `onOpen` đều gọi `requireOperator_` hoặc `requireOwner_` ở dòng đầu (tự liệt kê lại bằng grep: calendarJob, menuCalendarRunNow, menuSpeedTest có). Ngoại lệ chữ nghĩa: apiClientReport (L7).

**Vận hành**
* NIGHTLY: booking ghi và email xác nhận gửi ngay; sự kiện và thư mời tạo từ 23:00 (I61); buổi cần trước lần gom kế tiếp được tạo ngay (đường gấp), đúng ý "ghi nhận, gửi xác nhận, 23h tạo lịch và gửi thư mời". Thiếu phần "tổng kết" (T5).
* Thời gian chạy calendarJob: lượt rảnh chỉ `requireOperator_` (một lần `ScriptApp.getProjectTriggers`), 2 lần đọc Script Properties, 2 lần đọc bộ đệm, không mở Sheets, không đọc CONFIG (kiểm gợi ý trước mọi `cfg_`). Ước tính 0,3 đến 1 giây mỗi lượt, 288 lượt là khoảng 2 đến 5 phút mỗi ngày, xa hạn mức trigger (Workspace 6 giờ, Gmail thường 90 phút). Quét đầy đủ chỉ khi có gợi ý tới hạn, gợi ý mất, hoặc đối soát nhắc (tối đa vài lần mỗi giờ khi có buổi trễ).
* Script Properties: 5F chỉ thêm 2 khoá cố định (MET_LAST, CAL_PAUSED_UNTIL); GL_USED tự dọn sau 5 phút. Khoá `DONE_<việc>_<ngày>` (có từ 5B) tăng khoảng 780 khoá, 22 KB mỗi năm so với giới hạn 500 KB: chưa đáng lo nhiều năm, nhưng nên dọn khoá cũ hơn 7 ngày cùng AUTHPURGE.
* Bộ đệm số đo: khối JSON mỗi giờ dưới 40 KB với khoảng 45 tên hàm, 120 mẫu mỗi tên; khoá dưới 250 ký tự.
* Menu Đo tốc độ: chỉ đọc, một lần lấy và nhả khoá trống, một dòng SPEED_TEST trong khoá; có `requireOperator_`. Tác dụng phụ nhỏ, không hại: làm mới phiên bản slot và phiên bản CONFIG (mọi bản đệm đọc lại một lần).
* Nhiễu email: DATA_INVARIANT báo mỗi bộ buổi 1 lần mỗi ngày, đúng; nhiễu nằm ở CALENDAR_LATE (T6) và CALENDAR_FAILED từng buổi (T5).

<!-- END FILE: v8/reports/SOAT_5F_R2.md -->

---

## `v8/reports/SOAT_5G_R1.md`

*Ngày tạo trong Project: 2026-10-16T13:10:31Z*

<!-- BEGIN FILE: v8/reports/SOAT_5G_R1.md | bytes=16346 | sha256=6742f554d0d0a292ce1f78e8d0b736d0d0a88f28868e994078be833f7bc58acb | created=2026-10-16T13:10:31Z -->
# Soát chunk 5G · R1 (thaiput v8, bản 8.0.8)

Phạm vi: Archive.gs, Maintenance.gs, Release.gs, LoadTest.gs, nhịp tim, migration MIG_1610, UI bảo trì, Db.gs (nextId_, purgeRows_). Không sửa gì trong `/home/claude/thaiput_v8`. Thử nghiệm ở bản chép `scratchpad/rev5g_r1_work`, file `test/rev_r1.js`, `test/rev_d.js`, `test/rev_b2.js` (harness gốc vẫn xanh: 26/40/89/31/1).

Tóm tắt: 1 High, 3 Medium, 10 Low. Rủi ro lớn nhất nằm ở `purgeRows_` (Db.gs). Hàm này có từ trước, nhưng 5G đưa nó vào chạy tự động mỗi tháng trên BOOKINGS, AVAILABILITY và ACTIVITY_LOG.

---

## H1 · High · Db.gs:235–236 (gọi từ Archive.gs:193 và :150) · Xoá trắng tab trước khi ghi lại: hỏng giữa chừng thì mất mọi dòng GIỮ LẠI

`purgeRows_` gọi `rng.clearContent()` trên toàn bộ dữ liệu, sau đó mới `setValues(keepRows)`. Nếu lượt chạy chết sau clearContent mà trước setValues (vượt 6 phút, hoặc lỗi "Service Spreadsheets timed out" khi ghi khoảng 500k đến 1 triệu ô), tab DB trống trơn. Lượt sau đi đường khôi phục (ARCH_OPEN): không còn dòng nào khớp, `redo = 0`, rồi **xoá ARCH_OPEN**. Không có cảnh báo nào.

- Đã chứng minh (test A): giả lập lỗi ở setValues ngay sau clearContent. Kết quả: BOOKINGS từ 6 dòng còn 0. Ba dòng không đủ điều kiện (BK900003 gói còn chạy, BK900004 có admin_action, BK900006 mới) mất hẳn. Lượt khôi phục trả `{archived:0}`.
- Test I86 bỏ sót trường hợp này: mock `failClearOnce` ném lỗi TRƯỚC khi xoá ô, tức là mock "tốt bụng" hơn Google (luật 14).
- Yếu tố làm nặng thêm:
  - Không có ngân sách thời gian: archive chạy sau toàn bộ hourlyJob, gồm cả AUTHPURGE và METPURGE lúc 03:00.
  - Mỗi tab đọc cả tab 3 lần (table_, raw, purge với getValues + getFormulas) rồi ghi lại cả tab.
  - Nhịp tim hourlyJob ghi TRƯỚC phần archive (Jobs.gs:204), nên bị giết giữa chừng vẫn báo health OK. DONE_ARCHIVE không được đặt, nên mỗi giờ lại thử, mỗi lần lại đi qua cửa sổ nguy hiểm.
  - Archive không kiểm bản sao 02:00 đêm đó đã thành công chưa.
- Chưa chắc: Google có gom clearContent và setValues thành một lệnh nguyên tử hay không. Nhưng cửa sổ này có thật về mặt code, và sửa rẻ.
- Sửa:
  1. Ghi đè tại chỗ: `setValues(keepRows)` vào hàng 2..k+1 TRƯỚC, sau đó mới `clearContent` phần đuôi k+2..last. Chết giữa chừng thì chỉ có dòng trùng ở đuôi, không mất dòng. Cách khác: `deleteRows` theo từng khối liền nhau, từ dưới lên, chỉ đụng các dòng đã lưu trữ.
  2. `runArchive_` dừng trước khi bắt đầu một tab mới nếu đã dùng quá khoảng 4 phút.
  3. Chỉ lưu trữ khi `HB_nightlyBackup` thuộc hôm nay.
  4. Mock: thêm chế độ lỗi SAU clearContent, và test cho trường hợp đó.

## M1 · Medium · Db.gs:228–240, Archive.gs:150, :193 · purgeRows_ dùng số hàng của bản đọc cũ: admin sắp xếp hoặc thêm dòng tay đúng lúc lưu trữ thì xoá nhầm, mất dòng

Giữa lúc đọc bảng (Archive.gs:131) và lúc purge có tạo file, ghi, flush, đọc lại, kéo dài nhiều giây đến vài chục giây. Khoá script không chặn được người sửa tay trên Sheets. `purgeRows_` ánh xạ `t.rows[*]._row` (cũ) vào `raw` (đọc mới), chỉ ghi lại các dòng có trong bản cũ, rồi xoá mọi thứ khác. Luật 42 (kiểm khoá dòng trước khi ghi theo số hàng) không được áp dụng ở đây.

- Test B: admin sắp xếp Z đến A theo booking_id trong cửa sổ đó. Kết quả: **BK900003, BK900006 (không lưu trữ) bị xoá khỏi DB và mất**, còn BK900002, BK900005 (đã chép sang file lưu trữ) vẫn nằm trong DB, tức là trùng.
- Test B2: admin gõ tay 1 dòng mới cuối tab (BK_MANUAL) trong cửa sổ đó. Dòng này mất.
- Khả năng xảy ra: menu "Lưu trữ: chạy ngay" chạy ban ngày, hai co-founder dùng chung admin@ (một người bấm, một người đang sửa tab), hoặc đang ở chế độ bảo trì CLOSED (xem M2).
- Hệ quả phụ (chưa chắc, mức Low): định dạng hoặc ghi chú từng ô do admin tô tay đứng yên trong khi nội dung dời lên trên, nên lệch dòng. Công thức tương đối ở cột admin tự thêm được ghi lại nguyên văn ở hàng mới, nên tham chiếu sai hàng.
- Sửa: quyết định bỏ dòng nào dựa trên nội dung đọc MỚI, không dựa trên `_row`.
  - Tab có khoá (BOOKINGS, AVAILABILITY, NOTIFICATIONS): bỏ theo tập id đã chép, giữ mọi dòng khác của bản đọc mới.
  - Tab nhật ký: so chữ ký của bản đọc mới với bản cũ. Lệch thì ném lỗi và giữ ARCH_OPEN, để đường khôi phục (vốn so theo nội dung) hoàn tất.

## M2 · Medium · Archive.gs:230–237 · Lưu trữ vẫn chạy khi đang bảo trì

`archiveIfDue_` không xét `maintMode_()`. Theo chú thích của Maintenance.gs, CLOSED dùng "khi phải sửa dữ liệu lớn (sửa tay nhiều dòng BOOKINGS)", tức là đúng lúc M1 dễ xảy ra nhất. Test E: bật CLOSED, hourlyJob 03:10 vẫn chuyển 3 dòng BOOKINGS. Sửa: `if (maintMode_() !== 'OFF') return null;` trong `archiveIfDue_`. Với `menuArchiveNow`, hỏi xác nhận khi đang bảo trì.

## M3 · Medium (chưa chắc phần hành vi Google) · Archive.gs:82, :94 · File hoặc thư mục lưu trữ nằm trong thùng rác vẫn được ghi tiếp, 30 ngày sau mất hẳn

`DriveApp.getFolderById` và `SpreadsheetApp.openById` vẫn mở được mục đã vào thùng rác (theo hiểu biết của tôi, chưa thử trên Google thật). Nếu một co-founder lỡ xoá thư mục `THAIPUT_V8_*_Archive` hoặc một file năm, code vẫn chép vào đó và bỏ dòng khỏi DB. Google xoá vĩnh viễn sau 30 ngày. Bản sao đêm của DB (BACKUP_KEEP 30) cũng xoay vòng hết trong khoảng đó, nên dữ liệu đã lưu trữ mất vĩnh viễn. File lưu trữ là bản dài hạn duy nhất: nightlyBackup và weeklyExport không chép file lưu trữ. Mock không có trạng thái thùng rác cho thư mục. Sửa: kiểm `isTrashed()` của file và thư mục trong `archiveFile_`, `archiveFolder_` và testSystem; thấy trong thùng rác thì dừng và báo Khẩn. Nên có thêm một bản chép file lưu trữ (ví dụ mỗi tháng, sau lượt lưu trữ).

## L1 · Low · Archive.gs:139–153 · Đường khôi phục không nâng ID_FLOOR và ARCH_CUTOFF_MAIN

Đường khôi phục bỏ dòng khỏi DB nhưng không gọi `bumpIdFloor_` và không ghi `ARCH_CUTOFF_MAIN`. Test C: đọc lại thiếu, sau đó khôi phục bỏ BK999990 khỏi DB, mà `ID_FLOOR_BOOKINGS` vẫn trống. Mã chỉ bị cấp lại khi dòng đã chuyển đi có số lớn nhất của tab (tab hầu như không có hoạt động mới trong 3 đến 6 tháng, ví dụ STAGING). Báo cáo tháng cũng không ghi "CHÚ Ý" nếu chỉ có lượt khôi phục. Sửa: gom các dòng bị bỏ trong keepFn rồi gọi `bumpIdFloor_(tab, removedRows)`; với BOOKINGS thì cập nhật ARCH_CUTOFF_MAIN.

## L2 · Low · Archive.gs:150, :162 · Khôi phục so nguyên dòng nên dễ trùng; mã lô có thể trùng

- Một dòng bị sửa (ví dụ admin_note) giữa lô hỏng và lượt khôi phục thì không khớp chữ ký. Dòng đó ở lại DB và bị chép lần hai. `test/rev_d.js`: file lưu trữ có cả `BK999990/` lẫn `BK999990/sua`.
- Mã lô = 3 chữ đầu tên tab + `yyyyMMddHHmm` + số dòng. Hai lượt trong cùng một phút với cùng số dòng cho ra cùng mã, đã thấy khi chạy rev_d lần đầu (`BOO202610121000_3` hai lần). Đường khôi phục khi đó đếm cả dòng của lô trước, chỉ gây hại khi có dòng nhật ký giống hệt nhau.
- Sửa: mã lô thêm giây và chuỗi ngẫu nhiên (`Utilities.getUuid().slice(0,6)`). Tab có khoá thì khôi phục theo id, không theo chữ ký.

## L3 · Low · Jobs.gs:188 + Maintenance.gs:17 · READONLY chặn tutor xác nhận kết quả, nhưng job tự Hoàn thành vẫn chạy

Bảo trì READONLY kéo dài quá AUTO_COMPLETE_AFTER_HOURS (24 giờ) thì buổi STUDENT_ABSENT hoặc TECH_ISSUE bị tự chuyển COMPLETED. Điều này sai lương, và với TECH_ISSUE thì sai cả số buổi. Sửa: bỏ qua autoComplete khi bảo trì khác OFF, hoặc cho `apiTutorSubmitResult(s)` chạy trong READONLY.

## L4 · Low · ui/App.html:128–133 · Thanh bảo trì không tự tắt

Thanh báo bảo trì chỉ được bật khi máy chủ trả MAINT_*. Admin tắt bảo trì trong lúc trang đang mở thì thanh "đang bảo trì" ở đó tới khi tải lại trang. Sửa: trong `T.authed`, nếu `r.ok` mà `T.boot.maint.mode !== 'OFF'` thì đặt OFF và gọi `T.maint(T.state.page)`. Lượt gọi thành công của API ghi bị chặn ở READONLY đồng nghĩa với việc đã tắt bảo trì.

## L5 · Low · LoadTest.gs:44–49 · Phiên giả của thử tải nằm trong bộ đệm 6 giờ, không tự làm mới

Sau "Xoá dữ liệu test" hoặc admin thoát phiên, `lt_sess_*` vẫn trả token cũ. Mọi lượt gọi trả SESSION_INVALID suốt tối đa 6 giờ (test F: `r2=false/SESSION_INVALID`). Sửa: kết quả trả về là SESSION_INVALID thì xoá khoá đệm, tạo phiên mới một lần rồi gọi lại.

## L6 · Low · Release.gs:236–247 · Sao lưu trước cập nhật hỏng thì không bao giờ thử lại

`releaseSnapshot_` lỗi chỉ thêm một dòng cảnh báo vào danh sách kết quả, sau đó `releaseRecord_` vẫn ghi APP_VERSION_LAST. Lần chạy menu 1 sau coi như đã sao lưu. Sửa: chỉ ghi phiên bản khi sao lưu thành công (hoặc đặt cờ RELEASE_SNAPSHOT_PENDING), và hiện alert riêng.

## L7 · Low · Setup.gs:85–96 + Auth.gs:118 · MIG_1610 (90 thành 30 ngày) chỉ áp dụng cho phiên mới

Phiên tutor đã cấp với hạn 90 ngày vẫn sống đủ 90 ngày, vì `expires_at` được ghi lúc tạo phiên. Nếu mục đích của quyết định 16/10 là an toàn thì cần một lần rút hạn các phiên TUTOR còn sống xuống `created_at + 30`. Chưa chắc ý định, ghi để anh Chris quyết.

## L8 · Low · Archive.gs:232, Jobs.gs:38, Api.gs:71 · Script Properties phình dần

Mỗi ngày thêm `DONE_ARCHIVE_<ngày>`, cộng với các khoá DONE_ đã có (DIGEST, AUTHPURGE, METPURGE, NOAVAIL). Không có gì dọn trên PRODUCTION (chỉ Reset dọn). `healthStatus_` gọi `getProperties()` cho mỗi lượt kiểm tra của dịch vụ giám sát, đọc cả kho. Giới hạn 500 KB chỉ chạm sau nhiều năm, nhưng chi phí đọc tăng đều. Sửa: hourlyJob xoá các khoá DONE_ cũ hơn 7 ngày; health chỉ đọc 3 khoá HB_.

## L9 · Low · Report.gs:36–38 · Báo cáo tháng chỉ cảnh báo theo mốc BOOKINGS

Cờ `archived` chỉ dựa trên ARCH_CUTOFF_MAIN (6 tháng). Phần "Email theo ngày" lấy từ MAIL_LOG, vốn lưu trữ sau 3 tháng, nên thiếu số mà không có cảnh báo cho các tháng cách nay 3 đến 6 tháng. Sửa: thêm ARCH_CUTOFF_LOG, hoặc ghi chú riêng cho phần email.

## L10 · Low · CLAUDE.md luật 10, Db.gs:218–222, Archive.gs:7 · Tài liệu và luật chưa cập nhật

- Luật 10 vẫn ghi "ngoại lệ duy nhất: resetTestData_".
- Archive.gs dẫn "luật 46", nhưng CLAUDE.md chỉ có 45 luật.
- Chú thích `purgeRows_` vẫn nói không dùng cho BOOKINGS và ACTIVITY_LOG.
- `CHUNK5G_GIAI_THICH.md` được nhắc trong mô tả file Drive (Archive.gs:99) và trong Release.gs nhưng chưa có.

Sửa: thêm luật 46 (lưu trữ: chép, đọc lại, rồi mới bỏ; chỉ qua Archive.gs) và cập nhật luật 10.

---

## Đã kiểm, không thấy lỗi

### Bảo trì: mọi api* trong src

Cổng chặn nằm trong `apiRun_`, trước `fn()` và trước `requireRole_`, nên không ghi Sheets, không lấy khoá. Tên lấy từ chuỗi truyền vào `apiWrap_`: đã đối chiếu, cả 29 chuỗi khớp đúng tên hàm (apiClientReport không qua apiWrap_, chỉ ghi bộ đệm).

| Nhóm | Hàm | OFF | READONLY | CLOSED |
|---|---|---|---|---|
| Công khai, đọc | apiPublicInfo | chạy | chạy | chạy |
| Công khai, chỉ ghi bộ đệm | apiClientReport | chạy | chạy | chạy |
| Công khai, ghi | apiSubmitRegistration | chạy | chặn | chặn |
| Đăng nhập (cố ý mở) | apiRequestLogin, apiExchangeToken, apiGoogleExchange, apiLogout | chạy | chạy | chạy |
| Học viên, đọc | apiStudentHome, apiStudentSlots | chạy | chạy | chặn |
| Học viên, ghi | apiStudentBook, apiStudentCancel, apiStudentUpdateProfile, apiStudentRenew | chạy | chặn | chặn |
| Tutor, đọc | apiTutorHome, apiTutorAvailability, apiTutorStats | chạy | chạy | chặn |
| Tutor, ghi | apiTutorSetAvailability, apiTutorSubmitResult, apiTutorSubmitResults | chạy | chặn | chặn |
| Admin (11 hàm) | apiAdminHome, Notifications, MarkRead, People, Person, Booking, Slots, Book, Cancel, LogoutUser, Log | chạy | chạy | chạy |

Không có API ghi nào của học viên hoặc tutor lọt khỏi danh sách chặn. Cổng doPost thử tải gọi đúng các hàm api* nên cũng bị chặn như trang web. Đăng nhập vẫn tạo phiên và gửi link trong CLOSED: đây là chủ ý, để admin vào được.

### doPost

- Gate tắt (PRODUCTION luôn tắt qua `isProduction_`), sai JSON hay sai khoá: trả ngay, chỉ đọc Script Properties, không mở Sheets, không lấy khoá.
- So khoá bằng `safeEqual_`, chỉ lộ độ dài khoá.
- Chỉ thay mặt `@loadtest.invalid`. Kiểm địa chỉ trước khi đọc USERS.
- `switchToProduction` xoá khoá, testSystem báo lỗi nếu PRODUCTION còn khoá.
- POST của Apps Script trả 302 sang googleusercontent; `fetch` của Node chuyển thành GET khi theo redirect nên đọc được JSON; trang lỗi HTML được coi là `rejected` và thử lại cùng rid.
- Mức Low ngoài lề: `loadTestSeed_` gọi `nextId_` cho từng dòng nên tốn O(n²). Không sao với cỡ mặc định 100/10/14, nhưng gần tới 6 phút nếu sửa lên cỡ tối đa (60 tutor, 21 ngày).

### Nhịp tim

- calendarJob ghi nhịp tim cả khi idle hoặc paused; runJob_ ghi cả khi BUSY; dùng `realNowMs_` nên SIM_NOW không gây sai.
- Ngưỡng 150, 45 và 30 phút ổn so với chu kỳ trigger.
- Chưa có mốc nào thì coi là OK: chấp nhận được.
- Điểm yếu đã nêu ở H1: phần archive chạy sau nhịp tim.

### Gói và số buổi

- Buổi chỉ được chuyển khi gói EXPIRED và `end_date < cutoff`.
- Gói SESSIONS (LEGACY) không bao giờ tự EXPIRED nên mọi buổi được giữ.
- TRIAL_ONCE kiểm qua STUDENT_PACKAGES và REGISTRATIONS (không lưu trữ).
- Luật 1 buổi mỗi ngày và đối soát chỉ xét ngày tương lai.
- Rủi ro còn lại: admin sửa tay gói EXPIRED thành ACTIVE thì số buổi đã dùng bị tính thiếu (Low, do sửa tay).

### Khác

- MIG_1610 chạy lại an toàn (cờ trong Script Properties, chỉ đổi khi ô còn đúng giá trị cũ).
- Chữ bắt đầu bằng `=` vào file lưu trữ được giữ nguyên văn, cột chữ có '@'.
- Thêm hàng và cột trước khi ghi đúng luật 25.
- Đã bỏ hết apiMySessions, apiLogoutAll và T.devices (không còn tham chiếu nào).
- Thanh bảo trì dùng textContent, trang bảo trì thoát HTML.

### Mock so với Google thật

- `SpreadsheetApp.create` của mock không tạo tab "Sheet1" mặc định (Google thật có, chỉ ảnh hưởng hiển thị).
- `flush` của mock không làm gì nên che việc Google gom lệnh ghi (liên quan H1).
- Mock không có thùng rác cho thư mục (liên quan M3).
- `failClearOnce` của mock ném lỗi trước khi xoá ô (liên quan H1).

<!-- END FILE: v8/reports/SOAT_5G_R1.md -->

---

## `v8/reports/SOAT_5G_R2.md`

*Ngày tạo trong Project: 2026-10-16T13:10:32Z*

<!-- BEGIN FILE: v8/reports/SOAT_5G_R2.md | bytes=15991 | sha256=3388b75062ff1224475737f5db2e6a26e0920b879257ae8f8f28f2b4dde2dba4 | created=2026-10-16T13:10:32Z -->
# Soát độc lập chunk 5G, vòng R2 (hồi quy, chất lượng test, vận hành thật, bảo trì)

Phạm vi: `/home/claude/thaiput_v8` (chỉ đọc). Thử nghiệm làm trên bản sao `rev5g_r2_work`, đã trả về nguyên trạng (harness 26/26, 40/40, 89/89, 31/31, 1/1).
Mốc so sánh 5F: `v8/dist/Code.gs` 8.0.7 và `v8/dist/Index.html` trong Project, tách lại theo file rồi so với `src/`.
Kịch bản thử nằm ở `scratchpad/exp/` (e1 đến e4 và 4 test giao diện X1 đến X4 chạy tạm trong bản sao).

Tóm tắt: 2 High, 7 Medium, 17 Low. Không thấy hồi quy ở luồng đặt, huỷ, gia hạn, slot, kết quả, admin, đăng nhập link và Google khi bảo trì TẮT.

## High

### T1. Lưu trữ xoá theo SỐ HÀNG: admin sắp xếp hoặc chèn dòng trong lúc lưu trữ thì mất booking đang chạy (đã chạy thử)
- `src/Archive.gs:193` gọi `purgeRows_(tab, r => !ids[r._row])`; `src/Db.gs:232` ghép `t.rows` (đọc ở đầu lượt) với `raw` (đọc lại ngay lúc xoá) chỉ theo `_row`, không kiểm khoá dòng.
- Tái hiện (`exp/e1_sort_race.js`): 2 booking CONFIRMED + 3 booking cũ đủ điều kiện; giả lập admin đảo thứ tự tab BOOKINGS trong lúc chép sang file lưu trữ (giữa ghi và đọc lại). Kết quả: `BK900004` (CONFIRMED, buổi sắp tới) biến mất khỏi DB, `BK900002` đã chép sang file lưu trữ vẫn còn trong DB (trùng). Admin thêm dòng tay ở cuối tab cũng mất dòng đó (`clearContent` xoá cả vùng, chỉ ghi lại dòng có trong `t.rows`).
- Cửa sổ rủi ro: vài giây đến vài chục giây mỗi tab (tạo file, ghi 3.000 dòng, flush, đọc lại). Menu "Lưu trữ: chạy ngay" do chủ file bấm trong lúc người đồng sáng lập có thể đang sửa Sheets; job 03:00 vẫn chạy cả khi `MAINTENANCE_MODE = CLOSED`, đúng lúc admin được khuyên sửa tay hàng loạt BOOKINGS (`src/Maintenance.gs:9,14`).
- Sửa: trong `purgeRows_`, đối chiếu cột khoá (`SCHEMA[tab].id`, tab nhật ký dùng `archiveSig_`) của `raw[r._row-2]` với `r`, lệch một dòng là ném lỗi trước `clearContent`; chọn dòng bỏ theo mã chứ không theo số hàng. Bỏ qua lưu trữ khi bảo trì khác OFF. Thêm test: đảo thứ tự tab trong `SpreadsheetApp.flush` giả, kỳ vọng không mất dòng CONFIRMED nào.

### T2. `purgeRows_` xoá trắng rồi mới ghi lại: lượt chạy bị Google cắt (6 phút) giữa 2 bước làm rỗng BOOKINGS (đã giả lập)
- `src/Db.gs:235-236`: `rng.clearContent()` rồi `setValues(keepRows)`. Lưu trữ chạy ở CUỐI `hourlyJob` lúc 03:00 (`src/Jobs.gs:204`), sau AUTHPURGE và METPURGE (cũng xoá trắng rồi ghi lại), không có ngân sách thời gian. BOOKINGS 20.000 dòng × khoảng 35 cột: đọc giá trị, đọc công thức, ghi lại 700.000 ô trong một lượt.
- Giả lập (`exp/e4_kill.js`, cờ ném lỗi ở lần `setValues` ngay sau `clearContent`): BOOKINGS còn `[]`, cả 2 buổi CONFIRMED mất; lượt sau trả `archived: 0` vì `src/Archive.gs:135` thoát sớm khi tab rỗng, `ARCH_OPEN_BOOKINGS` treo mãi. Chỉ cứu được từ bản sao 02:00.
- I86 chỉ giả lập lỗi NÉM TRƯỚC khi xoá (`failClearOnce`), nên không bắt được trường hợp này; mock không mô phỏng giới hạn thời gian.
- Sửa: ghi `keepRows` đè từ hàng 2 trước, rồi mới xoá phần đuôi (bị cắt giữa chừng chỉ gây trùng, không mất), hoặc `deleteRows` theo khối từ dưới lên; kiểm `Date.now() - t0` trước mỗi tab (ví dụ dừng khi quá 3 phút) hoặc cho lưu trữ một trigger riêng; kiểm lô mở trước dòng `if (last < 2)`.

## Medium

### T3. Link "mở đúng dòng" lưu trong NOTIFICATIONS và email trỏ sai dòng sau mỗi lần lưu trữ
- `src/Notifications.gs:55` lưu `#gid=..&range=A<số hàng>`; `src/AdminApi.gs:33` trả nguyên `n.link` cho trang admin. Lưu trữ giữ lại đúng các thông báo Khẩn, Cần xử lý chưa đọc, nhưng bỏ các dòng phía trên trong BOOKINGS, AVAILABILITY nên số hàng dịch lên.
- Kịch bản: tutor xin huỷ slot (WARNING, chưa đọc, link `AVAILABILITY!A812`); đêm đó lưu trữ bỏ 300 dòng AVAILABILITY cũ; admin bấm link, rơi vào slot của tutor khác và chọn `admin_decision` trên dòng sai.
- Sửa: dựng link lúc hiển thị từ `entity` + `entity_id` (tìm số hàng hiện tại), hoặc ghi rõ mã trong nhãn link và dặn kiểm mã. Thêm vào I85.

### T4. Lượt ghi đã lưu nhưng mất phản hồi, lần thử lại gặp bảo trì: trang báo "đang bảo trì" dù booking đã có (đã chạy thử)
- `src/Api.gs:104-106`: `maintBlock_` chặn TRƯỚC `idem_`, nên lần gửi lại cùng `rid` không nhận kết quả đã lưu; `src/ui/App.html:116` chỉ đánh dấu `uncertain` với NETWORK, IN_PROGRESS.
- Tái hiện (X1): lần 1 ghi xong rồi mất phản hồi, admin bật READONLY, lần 2 nhận `MAINT_READONLY`. BOOKINGS tăng 1, trang hiện toast bảo trì, thanh "Đặt 1 buổi" vẫn còn, không tải lại "Lịch của tôi". Với CLOSED thì học viên chỉ thấy trang bảo trì.
- Sửa: với `RID_APIS`, `maintBlock_` tra kết quả đã lưu của `rid` trước khi chặn (đọc bộ đệm, không khoá); hoặc phía trình duyệt coi MAINT_* sau một lần NETWORK là `uncertain`.

### T5. `loadtest/browser.js` mặc định dùng học viên giả lt0101 trở đi, menu chỉ tạo 100 (đã chạy thử)
- `loadtest/browser.js:17` `start: 101`; `src/LoadTest.gs:180` menu tạo `loadTestSeed_(100, 10, 14)`. `exp/e3_link.js`: `link` cho lt0101 trả `NOT_FOUND`, mọi người ảo thành `ERROR: Không lấy được link`.
- Sửa: menu tạo 120 (hoặc hỏi số), hoặc `browser.js` mặc định `--start 91`; ghi rõ trong đầu file.

### T6. L01 không kiểm được đường "Đặt bị từ chối hoặc mất phản hồi rồi gửi lại cùng mã"
- `test/loadtest_selftest.js:23,28`: 15 người ảo cùng gọi `home` trước nên cả 6 lượt từ chối rơi vào `home` (đã ghi log: `REJECT home` × 6). Nhánh thử lại `book` không chạy; trường hợp nguy hiểm hơn (máy chủ đã ghi, Google trả trang lỗi) không có.
- Đã thử thêm: chạy `doPost` rồi trả HTML 500 cho 8 lượt `book`/`cancel` đầu: run.js vẫn đúng (15 BOOKED, không trùng). Nên đưa vào L01: từ chối riêng theo `fn` (`book` 3 lần), thêm chế độ "ghi rồi mất phản hồi", thêm HTTP 429, Location tuyệt đối sang host khác (như `script.googleusercontent.com`), và một lượt cổng hết hạn giữa chừng (`LOADTEST_OFF`).

### T7. U31 "bấm Đặt nhận câu bảo trì" là khẳng định rỗng (đã thử phá)
- `test/ui.js:730` `/bảo trì/.test(p.text())`: thanh báo luôn chứa chữ "bảo trì", nên xoá hẳn toast lỗi trong `src/ui/Student.html:123` U31 vẫn ĐẠT.
- Sửa: kiểm `#tp-toast` có `MAINT_READONLY` message, nút `#ab-go` không kẹt, `p.calls` có đúng 1 lượt `apiStudentBook` (không thử lại). Thêm: tab Tài khoản tutor không còn `#devices`, không có lượt gọi `apiMySessions`.

### T8. Vận hành trên tài khoản Workspace dùng thử và tài khoản mới trả tiền (chưa chắc về con số)
- Trang hạn mức Apps Script ghi "Additional limits apply for trial accounts" và hạn mức đầy đủ chỉ mở khi tên miền đã trả cộng dồn 100 USD và qua 60 ngày. Nguồn bên thứ ba nói tài khoản dùng thử gửi khoảng 500 email mỗi ngày. Như vậy luật 12 (khoảng 1.500 người nhận/ngày) chưa đúng trong khoảng 2 tháng đầu PRODUCTION; Calendar (10.000 sự kiện/ngày) và Properties (500.000/ngày) có thể thấp hơn khi dùng thử.
- Code tự điều chỉnh qua `MailApp.getRemainingDailyQuota()` (`src/Notify.gs:17`), nên không vỡ, nhưng email ưu tiên low sẽ bị bỏ sớm. Đề xuất: ghi vào hướng dẫn 5G; trước thử tải chạy menu Đo tốc độ để xem hạn mức thật; thử tải với ít người trước.
- Nguồn: [Apps Script quotas](https://developers.google.com/apps-script/quotas), [Sheetgo: Gmail sending limits](https://support.sheetgo.com/en/articles/8529694-gmail-sending-limits-in-google-workspace).

### T9. Kiểm danh sách API bị chặn khi bảo trì đang viết tay, test không tự liệt kê
- `src/Maintenance.gs:17` `MAINT_WRITE_APIS_` liệt kê tay. I84 chỉ kiểm Book, Cancel, SetAvailability, Registration; không kiểm UpdateProfile, Renew, SubmitResults bị chặn ở READONLY, không kiểm `apiRequestLogin`, `apiAdminCancel` chạy ở CLOSED. Thêm API ghi mới sau này mà quên danh sách thì READONLY vẫn cho ghi.
- Sửa: test giống I12, liệt kê mọi `api*` của học viên, tutor, công khai: hàm không nằm trong READ_APIS và không thuộc danh sách cho phép (đăng nhập, Logout, ClientReport) phải bị chặn ở READONLY, kèm đếm `lockCalls` không tăng.

## Low

| ID | Vị trí | Vấn đề (đã kiểm) | Gợi ý |
|---|---|---|---|
| T10 | `src/ui/Student.html:223` | CLOSED bật giữa lúc gửi gia hạn: `T.authed` ném `Error('MAINT')`, catch hiện toast chữ thô "MAINT" trên trang bảo trì (X2). | Bỏ qua `err.message === 'MAINT'` như 'SESSION'. |
| T11 | `src/ui/App.html:130` | Thanh báo chỉ được BẬT khi API trả MAINT_*, không bao giờ tắt cho tới khi tải lại: admin tắt bảo trì, học viên đặt được nhưng vẫn thấy "Đang bảo trì" (X3). | Lượt gọi thành công thì nếu `T.boot.maint` khác OFF, đặt về OFF và gọi `T.maint`. |
| T12 | `src/ui/Styles.html:213,224`, `src/ui/App.html:260` | Trang bảo trì trên máy tính: body vẫn `padding-left: 220px` dù không còn thanh tab; ở cổng học viên `main` vẫn lưới 300px + 1fr nên tiêu đề nằm cột hẹp, nút Zalo cột trái. Điện thoại: nút Zalo nổi vẫn nâng 84px như còn thanh tab (đọc CSS, jsdom không đo bố cục, chưa chắc về hình thật). | Đặt `data-page="maint"` cho body khi vẽ trang bảo trì. |
| T13 | `src/ui/Home.html` | CLOSED: trang chủ vẫn cho điền form, chọn ảnh chuyển khoản, chỉ báo bảo trì sau khi bấm Gửi (X4). | Khi `T.boot.maint.mode` khác OFF, hiện câu báo trên form và khoá nút Gửi. |
| T14 | `test/integration.js:646-647` | I35 không bắt key ghép (`'a.maint_readonly'` đứng sau dấu `?` rồi `,`, các key `k + '_en'`): xoá 3 key bảo trì khỏi Content.gs, I35 vẫn ĐẠT. Không có chiều ngược (key mặc định không còn dùng). | Thêm danh sách key bắt buộc của bảo trì; quét mọi chuỗi `'[ahlst]\.[a-z_]+'`. |
| T15 | `src/Setup.gs:82-96` | CONTENT tab cũ còn 14 dòng `s.devices_*`, `t.logout_all*`; menu Làm mới chữ (`src/Admin.gs:287`) cảnh báo 14 dòng "không được trang web dùng". | MIG_1610 xoá hoặc đánh dấu các key đã bỏ. |
| T16 | `src/Setup.gs:86-88` | MIG đổi `TUTOR_SESSION_DAYS` 90 thành 30 nhưng phiên tutor đã cấp vẫn giữ `expires_at` 90 ngày (`src/Auth.gs:122`). Hệ thống chưa chạy thật nên tác động nhỏ. | Nếu cần đúng 30 ngày: rút `expires_at` của phiên TUTOR còn hạn trong MIG. |
| T17 | `src/EmailTemplates.gs:109` | Mẫu STAFF_NEW_LOGIN nay chỉ gửi ADMIN, câu lại bảo người nhận "báo ngay cho admin qua Zalo". | Viết lại cho người nhận là admin. |
| T18 | `src/CalendarSync.gs:110`, `src/Reset.gs:70` | Thử tải: mỗi sự kiện giả vẫn được thêm người đồng sáng lập (ADMIN ACTIVE khác chủ) làm khách nên lịch của người đồng sáng lập đầy sự kiện "LT Student"; Xoá dữ liệu test gỡ sự kiện tuần tự trong 1 lượt, vài trăm sự kiện có thể quá 6 phút (chưa chắc). | Bỏ `adminGuests_` và Meet cho booking của `@loadtest.invalid`, hoặc đặt `cal_state` SKIPPED. |
| T19 | `src/LoadTest.gs:48` | Lượt đầu của mỗi người ảo tạo phiên trong khoá: đo `home` bị đội và dễ BUSY, không giống người thật (phiên có từ trước). | Thêm bước làm nóng phiên trước khi bấm giờ; tách số đo lượt đầu. |
| T20 | `loadtest/run.js:111` | Mã thoát 0 khi kết quả là `LOADTEST_OFF` (cổng hết giờ giữa chừng) hoặc `FORBIDDEN` (`--users` lớn hơn số đã tạo). | Chỉ coi BOOKED và lý do nghiệp vụ (NO_TUTOR, SLOT_BLOCKED, NO_SLOT...) là bình thường; mọi lý do khác là lỗi. |
| T21 | `loadtest/browser.js:28` | Bộ chọn `#app .tabs` không tồn tại (lớp thật là `.tabbar`); học viên không còn slot nào thì chờ 90 giây rồi báo sai "Không thấy cổng học viên". Tìm khung lồng qua `page.frames()` thì đúng với 2 lớp iframe của Apps Script. | Dùng `#app .tabbar`. |
| T22 | `src/Api.gs:70`, `src/Jobs.gs:26` | Health: job chỉ "bận" mãi (khoá bị giữ) vẫn ghi nhịp nên báo OK; `dailyJob`, `nightlyBackup` không được giám sát. I89 không kiểm job lỗi thì không ghi nhịp. | Thêm mốc "đã làm việc thật" với hạn dài hơn; thêm nightlyBackup 26 giờ. |
| T23 | `src/Jobs.gs:36-41`, `src/Archive.gs:232` | Khoá `DONE_*` cộng 4 mỗi ngày (thêm DONE_ARCHIVE_), không bao giờ dọn ngoài Xoá dữ liệu test; health gọi `getProperties()` mỗi lần giám sát. Giới hạn 500 KB còn xa (khoảng 45 KB/năm). | Dọn `DONE_` cũ hơn 7 ngày trong hourlyJob. |
| T24 | `src/CalendarQueue.gs:7,35` | Đầu file vẫn ghi "NIGHTLY (mặc định)", và ô CONFIG gõ sai thì rơi về NIGHTLY thay vì QUEUE. | Sửa chú thích, đổi giá trị dự phòng thành QUEUE. |
| T25 | `src/Archive.gs:7,99`, `src/Release.gs:4`, `CLAUDE.md:18,32,44` | Code dẫn "luật 46" (không có) và `CHUNK5G_GIAI_THICH.md` (chưa có; câu này còn được ghi vào mô tả file lưu trữ trên Drive). CLAUDE.md luật 10 chưa cho phép lưu trữ bỏ dòng BOOKINGS, ACTIVITY_LOG; luật 24 chưa có `doPost`; luật 36 vẫn nói tutor nhận "Có đăng nhập mới". | Cập nhật CLAUDE.md, viết CHUNK5G_GIAI_THICH.md trước khi giao. |
| T26 | `test/gas_mock.js:121,142` | Mock không "tốt bụng" ở các điểm 5G cần (moveTo, insertColumnsAfter, ContentService, khoảng ô ngoài bảng ném lỗi). Khác Google: `SpreadsheetApp.create` không có tab mặc định (thật có "Sheet1" hoặc "Trang tính1", file lưu trữ sẽ có thêm tab trống); Properties không chặn 9 KB/giá trị, 500 KB tổng; không mô phỏng giới hạn 6 phút (gốc của T2). | Thêm tab mặc định vào `create`, kiểm kích thước Properties như CacheService. |

## Hồi quy so với 5F (đã soát, không lỗi)
- Diff `src/` với 5F: chỉ các chỗ có chủ đích (bảo trì, nhịp tim, lưu trữ, mốc mã `idFloor_`, `realGuests_`, `NEW_LOGIN_EMAIL_ROLES`, bỏ `apiMySessions`, `apiLogoutAll`). `READ_APIS` đã bỏ `apiMySessions`; không còn chỗ nào gọi hai hàm đã bỏ (UI, demo, `demo_mock.js`); trang admin vẫn có Thoát mọi thiết bị theo người (`listSessions_`, `logoutAll_` còn). Đăng nhập link, Google, admin không đổi ngoài email đăng nhập mới.
- Bảo trì OFF: `maintBlock_` trả null trước khi làm gì, không thêm lượt đọc Sheets (CONFIG có đệm). Thanh báo song ngữ ở trang chủ, đăng nhập; tiếng Việt ở cổng học viên; tiếng Anh ở cổng tutor (X4).
- Bản demo và `dist/` đã dựng lại từ src hiện tại. Lưu ý: chạy harness (I88) ghi lại `dist/` trong repo.

<!-- END FILE: v8/reports/SOAT_5G_R2.md -->

---

## `v8/reports/SOAT_5G_R3.md`

*Ngày tạo trong Project: 2026-10-16T13:10:33Z*

<!-- BEGIN FILE: v8/reports/SOAT_5G_R3.md | bytes=15261 | sha256=52143772d2ccf756283cc16443643873f3f77452b55e8ffbf99eed04c0ad850d | created=2026-10-16T13:10:33Z -->
# Soát chunk 5G · R3 (kiểm bản sửa theo R1, R2)

Phạm vi: `/home/claude/thaiput_v8` (chỉ đọc). Thử nghiệm trên bản chép `scratchpad/rev5g_r3_work`. Harness gốc xanh (26/40/91/31/2), vẫn xanh sau khi tôi thêm 1 móc `state.onSetValues` vào `test/gas_mock.js` của bản chép (không đổi hành vi khi không đặt móc).
Test của tôi: `scratchpad/rev5g/rev_r3.js` (chép vào `test/` của bản chép để chạy), gồm các ca A đến I nhắc bên dưới.

Tóm tắt: phần lớn đã sửa đúng. Bản viết lại `purgeRows_` sinh **1 lỗi High mới** (N1: lượt dọn PURGE_OPEN xoá mất các dòng MỚI NHẤT khi `setValues` lỗi) và 1 lỗi Medium (N2: dọn theo số hàng sau khi admin sắp xếp tab). Ngoài ra nhịp tim của nightlyBackup vẫn được ghi khi job bỏ lượt vì bận, nên điều kiện "phải có bản sao đêm nay" của lưu trữ bị vượt qua (N3).

## 1. Đối chiếu từng phát hiện

### R1

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| H1 | Sửa một phần | Đã có: ghi dòng giữ lại trước rồi xoá đuôi (Db.gs:257-258), mốc PURGE_OPEN và purgeRecover_, ngân sách 3,5 phút (Archive.gs:259-267), cần bản sao đêm nay (Archive.gs:305-306), mock lỗi sau khi ghi (I86). Còn hở: N1 (lỗi ở chính setValues thì lượt dọn xoá dòng thật), N2, N3; nhịp tim hourlyJob vẫn ghi TRƯỚC phần lưu trữ (Jobs.gs:20 so với :215). |
| M1 | Đã sửa (phần chính) | purgeRows_ quyết định theo nội dung đọc mới, so chữ ký (Db.gs:241-251, Archive.gs:140-145); I90 đảo thứ tự tab và gõ thêm dòng tay giữa lúc chép và lúc bỏ: không mất, không trùng. Phần phụ (công thức tương đối ở cột admin tự thêm) chưa sửa, xem N8. |
| M2 | Đã sửa | Archive.gs:303 (job), :336 (menu chạy ngay); I86 kiểm `skipped: 'MAINTENANCE'`. |
| M3 | Sửa một phần | Kiểm thùng rác của file (Archive.gs:88-89) và thư mục (:73, nhưng chỉ khi tạo file năm mới), sao 1 bản mỗi tháng vào Releases (:283-292). testSystem chưa kiểm thùng rác (Setup.gs:306 chỉ thử mở thư mục). File nằm trong thư mục đã vào thùng rác có trả `isTrashed()=true` hay không: chưa chắc. |
| L1 | Sửa một phần | Đường khôi phục đã gọi bumpIdFloor_ (qua archivePurgeBySig_). Chưa ghi ARCH_CUTOFF_MAIN, ARCH_CUTOFF_MAIL ở đường khôi phục (Archive.gs:156-168): lần lưu trữ đầu tiên bị cắt thì báo cáo tháng không có dòng CHÚ Ý. |
| L2 | Đã sửa mã lô; phần còn lại chấp nhận được | Mã lô có giây và uuid (Archive.gs:184). Khôi phục vẫn theo chữ ký: dòng admin sửa giữa chừng ở lại DB và được chép lần 2 (đã ghi rõ ở Archive.gs:137-138). Không mất dữ liệu. |
| L3 | Đã sửa | Jobs.gs:196, tự Hoàn thành dừng khi bảo trì khác OFF. |
| L4 | Đã sửa | App.html:129-137 (lượt thành công không có r.maint thì tắt thanh báo); U31 kiểm. |
| L5 | Đã sửa | LoadTest.gs:88-92: SESSION_INVALID thì bỏ khoá đệm, tạo phiên mới, gọi lại 1 lần. |
| L6 | Đã sửa | Release.gs:35-45: sao lưu hỏng thì không ghi APP_VERSION_LAST. |
| L7 | Đã sửa | Setup.gs:89-99: rút expires_at của phiên TUTOR về created_at + 30 ngày, xoá bộ đệm phiên. |
| L8 | Sửa một phần | cleanDoneProps_ (Jobs.gs:46-50, chạy 1 lần mỗi ngày). healthStatus_ vẫn đọc cả kho bằng getProperties() (Api.gs:72). |
| L9 | Đã sửa | Report.gs: ARCH_CUTOFF_MAIL, dòng CHÚ Ý riêng cho phần email. |
| L10 | Đã sửa | CLAUDE.md luật 10, 46-49; có CHUNK5G_GIAI_THICH.md; chú thích purgeRows_ đã cập nhật. |

### R2

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| T1 | Đã sửa | Như M1 (I90). |
| T2 | Sửa một phần | Như H1. Kiểm lô mở đã nằm trước `if (last < 2)` (Archive.gs:156). Còn N1, N2. |
| T3 | Đã sửa (link trong DB) | shiftRowLinksInLock_ (Archive.gs:227-242), I90. Email đã gửi vẫn mang link cũ (đã ghi rõ). Lệch 1 hàng khi tab có hàng trống ở giữa: N6. |
| T4 | Đã sửa | Cổng bảo trì của 5 API có idem_ nằm SAU bước trả kết quả cũ (Api.gs:110, :153, :167); I91 kiểm lượt gửi lại nhận "đã đặt". Lỗ hổng phụ khi CacheService lỗi: N4. |
| T5 | Đã sửa | browser.js:18 `start: 81` (menu tạo 100). |
| T6 | Sửa một phần (chấp nhận được) | L01 đã có từ chối riêng `book` (429), "ghi xong rồi mất phản hồi" (500), 302. Chưa có Location tuyệt đối sang host khác và cổng hết hạn giữa chừng (LOADTEST_OFF). |
| T7 | Đã sửa | U31 kiểm nội dung `#tp-toast` (ui.js:730). Chưa kiểm đúng 1 lượt apiStudentBook: chấp nhận được. |
| T8 | Đã sửa | CLAUDE.md luật 12 ghi giới hạn tài khoản dùng thử. |
| T9 | Đã sửa | I91 tự liệt kê api* không thuộc READ_APIS hay danh sách miễn, kiểm bị chặn ở READONLY. |
| T10 | Đã sửa | Student.html:223 bỏ qua 'MAINT'. |
| T11 | Đã sửa | Như L4. |
| T12 | Đã sửa (đọc CSS) | App.html:268 đặt `data-page=maint`; các luật `padding-left: 220px`, lưới 2 cột chỉ áp student/tutor/admin; `above-tabs` chỉ student/tutor. Hình thật: chưa chắc (jsdom không đo bố cục). |
| T13 | Đã sửa | Home.html:69-73 báo trên form, khoá nút Gửi. |
| T14 | Chấp nhận được | Regex I35 không đổi (`'a.maint_readonly',` vẫn lọt), nhưng I91 (integration.js:2255) liệt kê tay 6 key bảo trì cả 2 thứ tiếng. |
| T15 | Đã sửa | MIG_1610 xoá 17 key CONTENT cũ qua purgeRows_ (Setup.gs:102-106). |
| T16 | Đã sửa | Như L7. |
| T17 | Sửa một phần | Bản tiếng Việt đã viết cho admin. Bản tiếng Anh (EmailTemplates.gs:111) vẫn "message admin on Zalo right away so admin can sign your account out everywhere"; MIG cũng ghi bản này vào tab. |
| T18 | Sửa một phần | adminGuests_ bỏ qua địa chỉ thử tải (CalendarSync.gs:60). Xoá dữ liệu test vẫn gỡ sự kiện tuần tự trong 1 lượt (thời gian với vài trăm sự kiện: chưa chắc). |
| T19 | Đã sửa | fn `warm` (LoadTest.gs:57), run.js:92 làm nóng trước khi bấm giờ. |
| T20 | Đã sửa | run.js:62 NORMAL, :126-128 thoát mã 3; :95, :101 thoát 1. L02 kiểm. |
| T21 | Đã sửa | browser.js:29 `#app .tabbar, #app #maint-screen`. |
| T22 | Sửa một phần | Đã giám sát nightlyBackup, dailyJob 26 giờ (Api.gs:70). Job bỏ lượt vì bận vẫn ghi nhịp (Jobs.gs:26), nên job "bận mãi" vẫn OK; xem thêm N3. |
| T23 | Đã sửa | Như L8 (health vẫn getProperties, nhỏ). |
| T24 | Đã sửa | CalendarQueue.gs:7-8 chú thích mới, :35 gõ sai về QUEUE. |
| T25 | Đã sửa | Như L10; luật 24 có doPost, luật 36 đã đổi. |
| T26 | Đã sửa | gas_mock.js:122 tab Sheet1, :146-148 giới hạn 9 KB, 500 KB, thùng rác thư mục :257. Giới hạn 6 phút chưa mô phỏng: chấp nhận được. |

## 2. Lỗi mới

### N1 · High · Db.gs:256-259, :272-277 · setValues lỗi sau khi đặt PURGE_OPEN: lượt dọn sau xoá mất các dòng mới nhất của tab
- Mốc `PURGE_OPEN_<tab> {keep, last}` được ghi TRƯỚC `setValues(keepRows)`, không có try/catch. `setValues` ném lỗi (ví dụ "Service Spreadsheets timed out" khi ghi lại 3.000 đến 20.000 dòng, đúng lỗi mà H1 muốn phòng) hoặc lượt chạy bị cắt trước hay trong lúc ghi: tab còn NGUYÊN dữ liệu gốc nhưng mốc vẫn còn. Lượt sau (hourlyJob Jobs.gs:210, hoặc purgeRows_ kế tiếp của tab) gọi purgeRecover_, xoá hàng keep+2 tới last của dữ liệu GỐC. Đó là các dòng cuối tab, tức booking mới nhất (CONFIRMED sắp tới), không bị cảnh báo.
- Test A: giả lập `setValues` của BOOKINGS ném lỗi ở lần ghi dòng giữ lại. Tab còn đủ, mốc `{"keep":9,"last":11}`. purgeRecover_ chạy xong thì **mất BK777002** (CONFIRMED 25/10).
- Áp dụng cho mọi nơi gọi: AUTH, METRICS (03:00 mỗi ngày), CONTENT (MIG), resetTestData_ (USERS), lưu trữ.
- Sửa:
  1. Ghi kèm vào mốc một dấu vân tay: số dòng, mã hoặc chữ ký của dòng giữ đầu và cuối, và băm của đoạn đuôi (hàng keep+2 đến last sau khi ghi).
  2. purgeRecover_ đọc lại tab. Chỉ xoá đuôi khi hàng 2 đến keep+1 khớp dấu vân tay, tức là bước ghi đã chạy thật. Lệch thì không xoá, xoá mốc và báo Khẩn.
  3. Bọc setValues trong try/catch: lỗi thì so lại hàng 2 đến keep+1 với keepRows; chưa ghi thì xoá mốc rồi ném lại.
  4. Thêm chế độ mock `failSetValuesOnce` và test cho trường hợp này.

### N2 · Medium · Db.gs:272-277 · Dọn đuôi theo số hàng: admin sắp xếp, chèn hoặc xoá hàng sau khi hỏng thì xoá nhầm
- Giữa lúc hỏng (03:xx) và lượt dọn (hourlyJob giờ sau), tab có đuôi trùng. Admin sắp xếp tab, hoặc chèn hay xoá một hàng, trong khoảng đó thì purgeRecover_ vẫn xoá đúng khối hàng keep+2..last. Kết quả: mất bản duy nhất của dòng thật, còn bản trùng thì ở lại.
- Test B: lỗi ở bước xoá đuôi (failClearOnce), sắp xếp A đến Z theo booking_id, rồi dọn. Kết quả: **mất BK999990** (dòng không thuộc lô lưu trữ), còn **BK777002 bị trùng**.
- Sửa: cùng dấu vân tay như N1, cho cả đoạn đuôi. Với tab có khoá, nên dọn theo nội dung: bỏ dòng có mã đã xuất hiện ở hàng trên, và bỏ các mã của lô đã bỏ (ghi trong mốc nếu vừa 9 KB, không thì ghi băm). Tab nhật ký: đuôi lệch băm thì dừng và báo admin.

### N3 · Medium · Jobs.gs:26 + Archive.gs:305-306 · nightlyBackup bỏ lượt vì bận vẫn ghi nhịp tim, lưu trữ chạy khi chưa có bản sao
- runJob_ ghi `HB_nightlyBackup` cả khi khoá bận và không sao file nào. archiveIfDue_ coi đó là "bản sao đêm nay đã xong". Lúc 02:00 hourlyJob và calendarJob cũng có thể đang giữ khoá. Trang health cũng báo OK.
- Test G: khoá bận lúc 02:00, nightlyBackup trả null, 0 file sao mới, HB có. hourlyJob 03:10 vẫn chuyển BOOKINGS (`archived: 1`).
- Sửa: chỉ ghi mốc "đã sao" (ví dụ `BACKUP_OK_<ngày>` hoặc HB riêng) sau khi backupDbCopy_ thành công, và cho lưu trữ đọc mốc đó. Bỏ lượt vì bận thì ghi mốc khác (HB_*_busy). Không cần giữ khoá script khi makeCopy.

### N4 · Low · Api.gs:161 · idem_ bỏ qua cổng bảo trì khi CacheService lỗi
- `try { c = CacheService.getScriptCache(); } catch (e) { return fn(); }`. Với 5 API trong MAINT_IDEM_APIS_, apiRun_ đã bỏ cổng, nên lượt ghi chạy thật trong READONLY hoặc CLOSED. Đây là đường ghi duy nhất tôi thấy lọt qua cả hai cổng.
- Test E: READONLY, CacheService ném lỗi, apiStudentBook trả `ok:true` và **thêm 1 dòng BOOKINGS**.
- Sửa: `return gate() || fn();`.

### N5 · Low · Jobs.gs:210 · Lượt dọn PURGE_OPEN chạy ở CUỐI hourlyJob
- Trong khoảng có đuôi trùng, các bước trước đều thấy dòng trùng: tự Hoàn thành, nhắc buổi sáng, số buổi còn lại của gói, và đối soát.
- Test H: đối soát gửi 2 thông báo DATA_INVARIANT sai (`BK777001,BK777001`) ngay trong lượt hourlyJob có dọn.
- Danh sách tab ở dòng 210 thiếu USERS, CONTENT và các tab của Reset. Mốc của các tab này chỉ được dọn khi tab đó có lượt purge kế tiếp.
- Sửa: dọn ở ĐẦU hourlyJob, duyệt mọi khoá `PURGE_OPEN_*`. testSystem cảnh báo khi còn mốc (Setup.gs:305 hiện chỉ xét ARCH_OPEN).

### N6 · Low · Archive.gs:227-241 + Db.gs:243-244 · Link "mở đúng dòng" lệch khi tab có hàng trống ở giữa
- purgeRows_ bỏ luôn hàng trống ở giữa tab (gọn tab) nhưng không đưa vào removedRows. shiftRowLinksInLock_ vì thế dời thiếu.
- Test I: admin xoá nội dung một hàng AVAILABILITY, sau đó lưu trữ. AV900002 từ hàng 115 về 113, nhưng link thành `A114`.
- Sửa: purgeRows_ trả bảng đổi hàng cũ sang hàng mới (opts.rowMap), shiftRowLinksInLock_ dùng bảng đó.

### N7 · Low (chưa chắc hành vi Google) · Db.gs:258 · Đuôi NOTIFICATIONS còn ô tick FALSE sau clearContent
- Theo hiểu biết của tôi, `clearContent` trên ô có kiểm tra dữ liệu dạng ô tick để lại FALSE chứ không làm trống ô. Khi đó getLastRow không giảm, flush_ (Db.gs:151) ghi dòng mới sau mốc cao nhất cũ, và tab NOTIFICATIONS dài ra mãi dù đã lưu trữ hằng tháng.
- Sửa: sau khi xoá đuôi, gọi `clearDataValidations()` trên cột checkbox của đoạn đuôi, hoặc `deleteRows` cho đoạn đuôi. Nên thử một lần trên Google thật.

### N8 · Low (có từ trước, phần phụ của R1 M1) · Db.gs:248-249 · Công thức tương đối ở cột admin tự thêm bị lệch hàng
- Công thức được ghi lại nguyên chữ vào hàng mới.
- Test F: AUTH có cột phụ `=A<hàng>`. Bỏ dòng 2 xong thì hàng 2 chứa `=A3`.
- Sửa: đọc `getFormulasR1C1` và ghi bằng `setFormulasR1C1` cho các ô có công thức (hai bước ghi), hoặc testSystem cảnh báo khi có công thức ngoài cột của SCHEMA.

### N9 · Low · Archive.gs:283-292 · Bản sao hằng tháng tăng mãi
- Mỗi tháng sao MỌI file năm vào Releases, và Releases không bao giờ tự xoá. Khoảng 12 bản mỗi file mỗi năm. Không mất dữ liệu, chỉ tốn dung lượng Drive.
- Có thể chấp nhận. Nếu muốn gọn: chỉ sao file năm vừa có lô mới, hoặc giữ N bản gần nhất mỗi năm.

## 3. Đã kiểm, không thấy lỗi mới
- Bảo trì: ngoài N4, không đường ghi nào của học viên, tutor hay khách lọt cả cổng apiRun_ lẫn cổng idem_. Cả 5 API trong MAINT_IDEM_APIS_ đều luôn gọi idem_. Lượt bị chặn không được lưu làm kết quả cũ. Đăng nhập và phiên thử tải vẫn ghi AUTH: có chủ ý.
- purgeRows_ với lượt ghi đang gom: `flushDb_()` chạy đầu hàm. Sau khi bỏ dòng, nạp lại vào chính đối tượng bảng (`t._ids = null`, pending rỗng). Bản đệm slot được tăng phiên bản sau flush (markSlotsDirty_ trong khoá). Trong khoảng có đuôi trùng, byId và verifyRow_ trỏ vào bản trên (bản được giữ), nên lượt ghi không mất.
- Dòng tay gõ SAU hàng cuối cũ khi đang có đuôi trùng: không bị lượt dọn đụng tới (I86).
- Nhật ký PURGE_RECOVERED khi tab là ACTIVITY_LOG vẫn được ghi (đã thử, không mất).
- idFloor_, bumpIdFloor_: mốc chỉ tăng, bộ nhớ trong lượt chạy được xoá khi nâng mốc.
- EXEC_T0_ là biến toàn cục, Apps Script nạp lại mỗi lượt chạy, nên ngân sách thời gian tính từ đầu lượt.

<!-- END FILE: v8/reports/SOAT_5G_R3.md -->

---

## `v8/reports/SOAT_5H_R1_MAYCHU.md`

*Ngày tạo trong Project: 2026-10-17T16:43:29Z*

<!-- BEGIN FILE: v8/reports/SOAT_5H_R1_MAYCHU.md | bytes=16757 | sha256=db31ce220d023c3b63c7c27e2a451c85b5b0dc2b83db4fd277fcc31f065e5f19 | created=2026-10-17T16:43:29Z -->
# Soát độc lập chunk 5H (8.0.9), phần máy chủ

Phạm vi: src/*.gs đổi so với bản 8.0.8 (Content, Schema, Setup, Api, Auth, EmailTemplates, Marketing, Admin, Maintenance, Config).
Bộ test hiện tại xanh hết (`node test/harness.js`: 26/26, 40/40, 100/100, 35/35, 2/2). Mọi script chứng minh nằm trong
`/tmp/claude-0/-home-claude/dd50bc10-d7be-5531-bd10-84767e5e2c71/scratchpad/review_server/`, chạy bằng `node <tên file>`.

Ghi chú: trong lúc soát có một tiến trình khác chạy thử đột biến (sửa tạm rồi trả lại file src). Các script dưới đây đã chạy lại khi file đã về bản gốc.

---

## 1. CAO · Chuyển tab CONTENT bị ngắt giữa chừng thì chữ admin đã sửa không bao giờ được chép sang (im lặng)

- Vị trí: src/Setup.gs:41-42 (gọi `contentDetachOld_`) và src/Setup.gs:131-135 (chép); src/Content.gs:408-421.
- Mô tả: `contentDetachOld_` đổi tên tab cũ thành CONTENT_CU_808 ngay đầu `setupCore_`, còn bước chép (`contentCarryOld_`) nằm tận sau bước 1, 2, 3, MIG_1610, NOTIFY_RULES và `seedContent_`. Danh sách dòng cũ chỉ nằm trong biến `oldContent` của lượt chạy đó. Lượt chạy hỏng ở giữa thì lần chạy lại thấy tab CONTENT mới đã có cột `vi`, `contentDetachOld_` trả `null`, và không chỗ nào đọc lại CONTENT_CU_808. Dữ liệu không mất (tab ẩn vẫn còn), nhưng web quay về chữ gốc và menu 1 không báo gì.
- Kịch bản: hệ thống đang chạy thật, admin bấm menu 1. `seedContent_` (mới bọc `withLock_`) hoặc `withLock_` của bước chép gặp khoá bận quá 30 giây và ném BUSY. Cũng xảy ra khi lượt chạy vượt 6 phút, hoặc lỗi bất kỳ ở bước 1 đến 3. Admin bấm lại menu 1: chạy "thành công", nhưng mọi chữ đã sửa (tiêu đề trang chủ, nút Zalo...) thành chữ gốc. Chạy thêm lần nữa cũng vậy.
- Đã chứng minh: `p1_migration_partial.js`. Lần 1 lỗi BUSY sau khi đã đổi tên. Lần 2 và lần 3 không có dòng "Chép"; `h.hero_title` = chữ gốc thay vì "Tiêu đề admin đã sửa"; `a.zalo` = "Nhắn Zalo admin" thay vì "Chat Zalo".
- Cách sửa: cho bước chép chạy lại được. Ví dụ mỗi lần menu 1, nếu có tab tên `/^CONTENT_CU_808(_\d+)?$/` mà thuộc tính script `MIG_CONTENT_809` chưa đặt, đọc tab đó, chép, rồi mới đặt thuộc tính. Hoặc đặt thuộc tính "đang chuyển" (lưu tên tab) trước khi đổi tên, và chỉ xoá thuộc tính sau khi chép xong. Kèm một test: ném lỗi giữa hai bước, chạy lại, chữ admin phải có.

## 2. CAO · Hai lượt "Gửi chiến dịch" chạy cùng lúc thì mỗi người nhận 2 email

- Vị trí: src/Marketing.gs:147-168 (`marketingSend_`), :215-228 (`menuMarketingSend`).
- Mô tả: không có gì chặn hai lượt chạy song song. Mỗi lượt chỉ đọc danh sách đã gửi (MAIL_LOG `MKT:<mã>`) một lần lúc bắt đầu, không đọc lại giữa các lô. Thêm nữa, MAIL_LOG chỉ được ghi sau mỗi lô 10 email. Vì vậy lượt thứ hai không thấy những người lượt đầu đang gửi. Điều này trái luật 51 ("mỗi người một lần mỗi mã").
- Kịch bản: hai co-founder dùng chung admin@ cùng bấm menu. Hoặc một người bấm lại menu vì lượt đầu chạy tới 4,5 phút mà không có thanh tiến độ, tưởng treo (Sheets vẫn cho chạy menu thứ hai trong lúc menu đầu đang chạy). Kết quả: cả nhóm nhận 2 email, tốn gấp đôi hạn mức, và `sent_count` vẫn ghi 8.
- Đã chứng minh: `p2_marketing_double_run.js`. Hai bản chạy riêng biến toàn cục nhưng chung dữ liệu giả lập; lượt B chạy trọn trong lúc lượt A gửi email thứ 2. Mỗi học viên trong 8 người nhận 2 email, MAIL_LOG có 16 dòng `MKT:DUP`, `sent_count` = 8.
- Cách sửa: thêm dấu "đang gửi" cho từng mã, ví dụ thuộc tính script `MKT_RUN_<mã>` = mốc thời gian, đặt và kiểm trong một `withLock_` ngắn. Lượt khác thấy dấu còn mới (dưới 7 phút) thì từ chối và báo "đang có lượt khác gửi". Xoá dấu trong `finally`. Ngoài ra, trước mỗi lô nên đọc lại tập đã gửi (hoặc ít nhất các dòng MAIL_LOG mới).

## 3. TRUNG BÌNH · Đồng hồ 4,5 phút bắt đầu SAU hai hộp thoại và hai lần đọc kế hoạch; khi bị cắt thì mất nhật ký của lô đang gửi

- Vị trí: src/Marketing.gs:152 (`t0 = realNowMs_()` trong `marketingSend_`), :216-226; vòng lặp :153-168 không có `try/finally` để ghi nhật ký.
- Mô tả: `t0` lấy sau `ui.prompt` (nhập mã), `marketingPlan_` (đọc USERS, STUDENT_PACKAGES, cả tab MAIL_LOG), `ui.alert` (hỏi "Gửi thật?"), rồi `marketingPlan_` thêm lần nữa. Thời gian admin đọc hộp thoại vẫn tính vào 6 phút của lượt chạy menu (hộp thoại chặn lượt chạy phía máy chủ; *phần này theo hành vi đã biết của Apps Script, chưa đo trên Google thật*). Đọc hai hộp thoại mất hơn khoảng 80 đến 90 giây, cộng 270 giây gửi, là vượt 6 phút. Google cắt lượt chạy giữa một lô. Các dòng MAIL_LOG của lô đó đang nằm trong `DEFER_WRITES_` (tối đa 10 người) và mất theo, nên lần chạy sau những người này nhận lại email. Dòng chiến dịch cũng không được cập nhật (`status` và `last_result` cũ). Hậu quả giống hệt nếu `marketingRender_` hoặc `sendMail_` ném lỗi bất ngờ giữa lô: lỗi thoát khỏi vòng lặp mà không gọi `marketingFlushLog_`.
- Đã chứng minh: chỉ bằng đọc code. Bộ giả lập không mô phỏng thời gian chờ hộp thoại.
- Cách sửa: `menuMarketingSend` ghi mốc thời điểm bắt đầu và truyền vào `marketingSend_` (giới hạn tính từ đầu lượt chạy, ví dụ 5 phút trừ phần đã dùng). Bọc vòng lặp bằng `try { ... } finally { marketingFlushLog_(); }` để lỗi bất ngờ vẫn ghi đủ nhật ký đã gửi.

## 4. TRUNG BÌNH · Không dừng được chiến dịch đang gửi; trạng thái admin vừa đổi bị ghi đè

- Vị trí: src/Marketing.gs:174-176.
- Mô tả: trong lúc gửi, code không đọc lại `status`. Khi xong, code ghi `status` = SENDING hoặc SENT bất kể admin đã đổi gì.
- Kịch bản: admin phát hiện sai chữ, đổi status thành DRAFT để dừng trong lúc lượt đang chạy. Lượt chạy vẫn gửi hết phần còn lại trong 4,5 phút, rồi ghi đè DRAFT thành SENDING. Lần bấm menu sau sẽ gửi tiếp thay vì bị chặn.
- Đã chứng minh: đọc code (không có lệnh đọc lại status trong vòng lặp; lệnh update ở dòng 176 không có điều kiện).
- Cách sửa: trước mỗi lô, đọc lại dòng chiến dịch (`clearDbCache_` rồi `marketingRow_`). Status khác READY hoặc SENDING thì dừng với `stopped = 'HUY'`. Lúc ghi kết quả, nếu status mới đọc là DRAFT thì giữ DRAFT, chỉ cập nhật `sent_count` và `last_result`.

## 5. THẤP · `marketingFlushLog_` ghi trùng dòng MAIL_LOG khi lỗi xảy ra sau lúc dòng đã ghi

- Vị trí: src/Marketing.gs:181-189.
- Mô tả: `withLock_` ghi các dòng đang gom (`flushDb_`) rồi mới gọi `SpreadsheetApp.flush()`. Nếu bước sau ném lỗi (ví dụ "Service Spreadsheets timed out"), dòng đã xuống Sheets nhưng `catch` vẫn đưa cả lô lại hàng đợi, và lần thử thứ hai ghi thêm lần nữa. Email không bị gửi trùng (`sent_count` đếm theo địa chỉ khác nhau), nhưng MAIL_LOG dài gấp đôi và sổ sách lệch. Khác với `flushDeferred_`, ở đây từng hàm ghi cũng không được bọc `try`.
- Đã chứng minh: `p3_flushlog_dup.js`. Gửi 4 email, MAIL_LOG có 8 dòng `MKT:FL`.
- Cách sửa: đánh dấu "đã ghi" cho từng phần tử (hoặc ghép thẳng các dòng MAIL_LOG vào một mảng rồi `insert` trong khoá). Chỉ đưa lại hàng đợi khi lỗi là BUSY, tức là chưa lấy được khoá.

## 6. THẤP · Bước chép coi "value khác default_value" là admin đã sửa, nên chép cả chữ gốc CŨ

- Vị trí: src/Content.gs:428-447 (dòng `if (v === '' || v === dv) return;`).
- Mô tả: `seedContent_` bản cũ chỉ ghi lại `default_value` khi chữ gốc trong code đổi, không ghi `value`. Những key admin chưa từng sửa nhưng chữ gốc đã đổi qua các bản thì có `value` (chữ gốc cũ) khác `default_value`. Bước chép đưa chữ cũ này vào cột vi hoặc en, che chữ gốc 5H. Không thụt lùi so với 8.0.8 (bản cũ cũng hiện `value`), nhưng phần chữ mới của 5H cho các key đó không bao giờ hiện. Menu 1 chỉ báo con số "Chép N chữ", không nói key nào.
- Đã chứng minh: `p4_stale_default.js`. `a.zalo` vi = "Liên hệ Zalo" (chữ gốc cũ giả định), không phải "Nhắn Zalo admin".
- Cách sửa: liệt kê các key đã chép trong kết quả menu 1, hoặc ghi vào cột `note` của dòng mới (ví dụ "chép từ bản cũ 8.0.8"), để admin xem lại. Không có cách tự phân biệt chắc chắn nếu không có lịch sử chữ gốc.

## 7. THẤP · Tiêu đề tab CONTENT cũ có khoảng trắng thừa thì không được nhận ra; chữ admin bị bỏ qua im lặng

- Vị trí: src/Content.gs:411 (`map(String)` không `trim`). Trong khi đó `table_` (src/Db.gs:57) có cắt khoảng trắng, nên bản 8.0.8 vẫn chạy bình thường với tiêu đề `"value "`.
- Kịch bản: tiêu đề tab cũ là `"value "`. Menu 1 không đổi tên tab mà thêm 7 cột mới vào chính tab cũ. Cột `vi` và `en` trống nên web hiện chữ gốc. Chữ admin vẫn nằm ở cột `value` nhưng không còn ai đọc.
- Đã chứng minh: `p5_header_space.js`.
- Cách sửa: `.map(function (h) { return String(h).trim(); })` ở `contentDetachOld_`.

## 8. THẤP · `seedContent_` giờ ghi từng ô trong khoá script

- Vị trí: src/Setup.gs:221-234.
- Mô tả: dòng CONTENT đã có mà cột code quản lý (page, position, shown_when, default_vi, default_en) khác thì gọi `ct.update` từng dòng. Mỗi cột tốn 2 lệnh (`setNumberFormat` và `setValue`), kèm `verifyRow_` đọc lại cột khoá mỗi 1,5 giây. Trước 5H việc này chạy ngoài khoá; nay giữ khoá suốt thời gian đó. Lần chuyển 8.0.9 không bị ảnh hưởng (tab mới, chỉ `insert` gom một lần). Bản sau mà sửa câu mô tả hàng loạt thì menu 1 giữ khoá lâu, và học viên đang đặt nhận BUSY.
- Đã đo: `p6_seed_lock_writes.js`. Đổi cột position của 230 key thì có 460 lệnh ghi Sheets trong một `withLock_` (mock không đo thời gian thật).
- Cách sửa: ghi lại các cột meta bằng một `setValues` cho mỗi khối cột liền nhau (page đến shown_when; default_vi, default_en), hoặc làm phần meta ngoài khoá (cột do code sở hữu). Chỉ `insert` dòng mới trong khoá.

## 9. THẤP · Các điểm nhỏ khác (đã đọc code)

- Hạn mức marketing chỉ đọc một lần lúc bắt đầu (src/Marketing.gs:137, 152). Email hệ thống gửi song song trong 4,5 phút làm phần còn lại thực tế xuống dưới `MARKETING_QUOTA_RESERVE`. Nên gọi lại `MailApp.getRemainingDailyQuota()` mỗi lô (lệnh rẻ). Ngoài phần này, phép tính `budget = quota - reserve` đúng, không lệch một (test I99 khớp).
- `menuMarketingSend` hỏi "Gửi thật?" rồi mới báo "hạn mức không đủ" (src/Marketing.gs:224-225): nên kiểm `canSend` trước hộp hỏi.
- Luật 51 nói chân từ chối nhận "luôn có", nhưng code cho tắt: mẫu MARKETING_FOOTER `active` FALSE, hoặc ô body ghi `-`, thì email marketing không có câu từ chối (src/Marketing.gs:111-113, EmailTemplates.gs:137). Hoặc bỏ khả năng tắt, hoặc sửa luật. *(Ngoài phạm vi, chưa kiểm: quy định chống thư rác của Việt Nam, Nghị định 91/2020, có thể yêu cầu nhãn và cách từ chối nhận cho thư quảng cáo; nên hỏi người nắm pháp lý.)*
- `marketingCheck_` cho dùng `{{button:name|...}}` (biến `name` là tên học viên tự nhập) làm đường link của nút. Đã được thoát HTML nên không chèn được mã, nhưng nên chỉ cho biến đuôi `_url` trong nút.
- Hai dòng USERS cùng email (vừa tutor vừa học viên) với nhóm ALL: chỉ dòng đầu được tính, và vai trò của dòng đó quyết định link và thứ tự ngôn ngữ (src/Marketing.gs:59-70). Chấp nhận được, nên ghi chú.
- Cửa sổ ngắn khi chạy menu 1 lúc đang dùng thật: web app đang triển khai vẫn là code 8.0.8 (luật 38: triển khai sau menu 1). Sau khi tab CONTENT mới thay tab cũ, `table_('CONTENT')` của code cũ thiếu cột `value` nên ném lỗi, lỗi bị bắt, web hiện chữ gốc (mất chữ admin) cho tới khi bấm Triển khai. Tự hết khi triển khai; nên ghi một dòng vào HUONG_DAN_PHAT_HANH: "triển khai ngay sau menu 1".
- Chú thích cũ ở src/Setup.gs:218 vẫn nói "chỉ cập nhật default_value".
- Có từ trước 5H, không do 5H gây ra: `mailBookingSummary_` (src/Notify.gs:134) dùng câu lỗi tiếng Việt cho cả phần tiếng Anh ("Not booked: ... Ngày này bạn đã có buổi rồi nhé."). Giờ đã có `reasonPair_`, sửa bằng `reasonText_(r.reason, lang)`.

## Đã kiểm và thấy ổn

- `withLock_` lồng nhau: có đếm độ sâu (Db.gs:427), không ai gọi `setupCore_` từ trong khoá, `purgeRows_` của MIG_1610 vẫn trong khoá riêng. `seedContent_`, `contentCarryOld_`, `apiSetLanguage`, cập nhật dòng chiến dịch đều ghi trong khoá qua `DbTable.update` và `insert` (luật 25, 42).
- CacheService: hai giá trị khoảng 16KB và 14KB (dưới 100KB), khoá ngắn, hạn 300 giây. `getAll` phải trúng cả hai khoá mới dùng bộ đệm.
- Kiểm dữ liệu (dropdown) USERS.lang, MARKETING_EMAILS: code chỉ ghi '', 'vi', 'en', và DRAFT, SENDING, SENT, đều hợp lệ. Ô trống không bị từ chối. Cột lang mới nên không có giá trị cũ.
- Gặp tab CONTENT_CU_808 do admin tạo sẵn thì code đổi thành `_2`. Chạy menu 1 lần hai sau khi chuyển xong không chuyển lại (I96). Ánh xạ key cũ sang key mới: cả 311 key cũ đều có đích. Không key `t.*` cũ nào là tiếng Việt, không key `_en` nào ngoài `a.*` (đã quét bằng `keys.js`).
- Không còn chỗ nào trong src hay test đọc `a.*_en`, `re.*`, `a.zalo_vi`, `a.zalo_en`, `value`, `default_value` của CONTENT (trừ phần chuyển dữ liệu và dữ liệu giả của I96). `reasonText_` với 'both' đúng. API admin vẫn trả tiếng Việt.
- `apiSetLanguage`: bắt đầu bằng `requireRole_`, chỉ sửa đúng người của phiên, đọc USERS mới mỗi lượt (không có bản đệm user giữa các lượt nên không bị cũ). Chọn lại cùng thứ tiếng không ghi. Có trong `MAINT_WRITE_APIS_`. Trang quản trị không gọi nên không vướng luật "admin không bị chặn".
- Thoát HTML: tên người dùng, tiêu đề, nút trong email marketing đều qua `esc_`. Menu marketing có `requireOperator_` (luật 24).

---

## Kết luận

Phần máy chủ của 5H làm đúng phần lớn việc đã hứa: dữ liệu song ngữ, bộ đệm, câu báo lỗi `msg {vi, en}`, ngôn ngữ người dùng và lọc người nhận đều chạy đúng, và test xanh. Còn hai lỗi thật nên sửa trước khi đưa lên PRODUCTION. Một là bước chuyển tab CONTENT không chạy lại được: chỉ cần một lần menu 1 bị khoá bận hoặc quá 6 phút là chữ admin đã sửa biến mất khỏi web mà không có báo gì (đã chứng minh). Hai là gửi marketing không chống được hai lượt chạy song song (đã chứng minh mỗi người nhận 2 email). Ngoài ra nên sửa sớm: đồng hồ 4,5 phút tính sai mốc và thiếu `finally` ghi nhật ký (có thể gửi lại tối đa 10 người), và việc không dừng được chiến dịch đang chạy. Các mục THẤP còn lại sửa khi tiện. Không thấy vi phạm luật khoá, `getNow_`, `requireRole_` hay `sendMail_` trong code mới.

<!-- END FILE: v8/reports/SOAT_5H_R1_MAYCHU.md -->

---

## `v8/reports/SOAT_5H_R1_GIAODIEN.md`

*Ngày tạo trong Project: 2026-10-17T16:43:30Z*

<!-- BEGIN FILE: v8/reports/SOAT_5H_R1_GIAODIEN.md | bytes=18761 | sha256=4bcbc97f95ed0032c40384ca6be1327a05694d371f21a447dd804dc22020624f | created=2026-10-17T16:43:30Z -->
# Soát giao diện chunk 5H (v8.0.9), chỉ phía trình duyệt (src/ui)

Người soát: reviewer front end độc lập. Không sửa gì trong /home/claude/thaiput_v8.

Bằng chứng nằm ở thư mục `/tmp/claude-0/-home-claude/dd50bc10-d7be-5531-bd10-84767e5e2c71/scratchpad/review_ui/`:
- `rharness.js` + `mytests.js`: test jsdom viết thêm (dựng trang từ doGet thật, google.script.run nối vào máy chủ thật, như test/ui.js). Chạy: `node rharness.js`. Kết quả lưu ở `review_tests.log`.
- `shots/`: ảnh chụp Chromium thật của bản demo, 375px và 1280px, sáng và tối (`v_*` là ảnh khung nhìn, không có `v_` là ảnh cả trang). `shots.js`, `extra.js`, `nocm.js`, `probe1.js` là script chụp.
- `node test/harness.js` của dự án: xanh hết (40/40, 100/100, 35/35 giao diện).

Gốc chung của 4 lỗi đầu: mọi hàm `relabel` vẽ lại cả khung bằng `innerHTML`, nên nút đang khoá (`btn.disabled = true`) bị thay bằng nút mới đang bật. Biến `btn` trong lượt gọi đang chạy trỏ vào nút cũ đã rời trang. Không trang nào ghi nhớ "đang gửi" trong trạng thái của view.

---

## 1. CAO · Đổi ngôn ngữ khi form đăng ký đang gửi: gửi được lần 2, tạo 2 đăng ký với 2 mã chuyển khoản khác nhau
- File: `src/ui/Home.html:37-50` (relabel gọi `draw`), `:128` (khoá nút chỉ trên nút cũ), `:135`.
- Kịch bản: khách điền form, chọn Gói 2 tuần, bấm Gửi (ảnh đang tải lên, nút "Đang gửi..."), bấm EN. Nút mới hiện "Send registration" và bấm được (relabel còn giữ cả tick đồng ý và ảnh đã chọn). Khách tưởng chưa gửi, bấm lại.
- Kết quả sai: REGISTRATIONS có 2 dòng `TP R00001 2W` và `TP R00002 2W`, 2 hộp thoại "đã nhận" chồng nhau. Khách chuyển khoản theo một mã, admin thấy 2 đăng ký chờ duyệt. `apiSubmitRegistration` không có `rid` và máy chủ không lọc trùng. Với gói Trial thì lượt 2 bị chặn (TRIAL_USED), nhưng trang hiện hộp thoại thành công cùng lúc với lỗi đỏ "Trial can be used once per email".
- Sửa: giữ cờ `busy` ở mức module (Home: `var sending = false`), relabel vẽ lại xong thì khoá lại nút và đặt chữ `a.sending` khi `sending`; hoặc khi đang gửi thì relabel chỉ đổi chữ (không thay DOM form). Nên chặn ngay ở `T.relabel`: nếu `document.querySelector('button[disabled][data-busy]')` thì hoãn vẽ lại tới khi xong. Lâu dài: thêm `rid` cho apiSubmitRegistration và apiStudentRenew.
- ĐÃ CHỨNG MINH: test R01 (`review_tests.log`).

## 2. CAO · Học viên đổi ngôn ngữ khi đang đặt: nút Đặt bật lại, gửi lượt đặt thứ 2, 2 hộp thoại kết quả mâu thuẫn
- File: `src/ui/Student.html:23` (relabel gọi `frame`), `:134-136`, `:106` (`updateBar` hiện lại thanh với nút bật).
- Kịch bản: chọn 1 giờ, bấm "Đặt 1 buổi" (giờ đông có thể tự thử lại tới 60 giây), bấm VI|EN, bấm lại nút "Book 1".
- Kết quả sai: 2 lượt `apiStudentBook` (rid khác nhau). Hộp 1 "1 lesson(s) booked", hộp 2 nằm trên "No lessons booked · Only 1 lesson per day". Không đặt trùng nhờ luật 1 buổi/ngày, nhưng học viên thấy câu "không đặt được" ở trên cùng. Nếu chọn nhiều ngày và lượt 1 còn đang chạy trong khoá, hai lượt tranh nhau; kết quả dễ hiểu nhầm.
- Sửa: `st.busy = true` trong `submitBooking`, `updateBar` khoá nút và ghi `s.booking` khi `st.busy`; xoá cờ trong `.then`. Tương tự cho nút Huỷ buổi (`:177`).
- ĐÃ CHỨNG MINH: test R02.

## 3. CAO · Tab Tài khoản học viên: đổi ngôn ngữ làm mất chữ đang sửa, gói gia hạn đã chọn, ảnh đã chọn; gửi gia hạn lần 2 thành 2 yêu cầu gia hạn KHÁC gói
- File: `src/ui/Student.html:23` → `frame` → `drawAccount` `:190-243` (không có cơ chế giữ giá trị như Home).
- Kịch bản: sửa tên thành "Tên đang sửa", chọn Gói 1 tháng, chọn ảnh, bấm Gửi gia hạn, bấm EN. Tên trở về "Học viên 5", gói nhảy về Gói 2 tuần (gói đầu), ảnh mất, nút Gửi bật lại. Học viên chọn lại ảnh, bấm Gửi.
- Kết quả sai: REGISTRATIONS có 2 dòng RENEW: `PASS_1M` và `PASS_2W` (lượt 2 lấy gói mặc định vì lựa chọn đã mất). Admin phải đoán học viên muốn gói nào.
- Sửa: relabel của Student giữ giá trị các ô `#p-name #p-phone #p-level #r-phone`, gói `rpkg`, file đã chọn (biến như `chosenFile` của Home) và cờ đang gửi; hoặc tab Tài khoản chỉ đổi chữ nhãn mà không dựng lại form.
- ĐÃ CHỨNG MINH: test R04.

## 4. TRUNG BÌNH · Tutor đổi ngôn ngữ khi đang lưu giờ rảnh hoặc kết quả: lưu lần 2, 2 hộp "Đã lưu" (hộp sau rỗng)
- File: `src/ui/Tutor.html:25`, `:190-192` (save), `:252-254` (reviewResults, cùng kiểu).
- Kịch bản: mở 1 giờ, bấm Lưu, bấm VI|EN, bấm Lưu lại (nút mới bật, chữ "Lưu").
- Kết quả sai: 2 lượt `apiTutorSetAvailability`; hộp 1 "Đã lưu · Đã mở 1 giờ", hộp 2 "Đã lưu" không có dòng nào. Với Lưu kết quả buổi dạy (căn cứ tính lương), lượt 2 sẽ báo lỗi từng buổi "đã xác nhận" và làm tutor hoang mang (suy từ code, chưa chạy).
- Sửa: như mục 2, cờ `st.busy` và `updateBar`/`updateConfirmBar` tôn trọng cờ.
- ĐÃ CHỨNG MINH (giờ rảnh): test R03.

## 5. TRUNG BÌNH · Trang bảo trì ĐÓNG biến mất khi bấm VI|EN, cổng cũ hiện lại bằng dữ liệu cũ
- File: `src/ui/App.html:81-86` (`T.relabel` gọi `T.views[T.state.page].relabel`), `:324-334` (`T.maintScreen` không đổi `T.state.page`, vẫn vẽ topbar có nút VI|EN).
- Kịch bản: học viên đang trong cổng, admin đặt MAINTENANCE_MODE = CLOSED, học viên bấm Đặt → hiện trang bảo trì. Bấm EN.
- Kết quả sai: `#maint-screen` mất, cổng học viên với 30 ô giờ (dữ liệu cũ) hiện lại, `body[data-page]` vẫn là `maint` nên bố cục máy tính cũng sai (không chừa cột tab trái). Mỗi thao tác sau đó lại bị trả MAINT_CLOSED.
- Sửa: `T.maintScreen` đặt cờ `T.state.maintClosed = true` (hoặc `T.state.page = 'maint'` với view `maint` có `relabel` vẽ lại chính trang bảo trì bằng `T.t`), `T.relabel` kiểm cờ trước. Câu `msg` của máy chủ nên giữ cả cặp `{vi,en}` để vẽ lại đúng tiếng.
- ĐÃ CHỨNG MINH: test R05.

## 6. TRUNG BÌNH · Trang quản trị lẫn tiếng Anh khi máy đã lưu `thaiput_lang = en`
- File: `src/ui/App.html:371` (`T.start` lấy `storedLang()` cho mọi trang), `src/ui/Login.html:69` (admin `return go()` không đặt tiếng Việt), `App.html:127` (`r.message = T.m(r)` theo `T.lang`).
- Kịch bản: hai co-founder dùng chung máy; ai đó từng bấm EN ở trang chủ (hoặc thử cổng tutor). Mở trang quản trị.
- Kết quả sai: `T.lang = en`, `<html lang="en">`. Mọi câu lỗi máy chủ thành tiếng Anh ("Not found. (S999999)" khi mở người không có), dải thử lại, câu "write_unknown", nhãn đọc màn hình của logo ("Go to thaiput home page") cũng tiếng Anh, giữa giao diện tiếng Việt cố định.
- Sửa: trong `T.go`, nếu `page === 'admin'` thì `T.setLang('vi', { local: true })` (không ghi lại máy), và khi rời admin thì trả lại `T.storedLang()`.
- ĐÃ CHỨNG MINH: test R06.

## 7. TRUNG BÌNH · Nút VI|EN không giới hạn: mỗi lần bấm là một lượt ghi có khoá
- File: `src/ui/App.html:77`, `:102-107`.
- Kịch bản: bấm VI|EN 6 lần liên tiếp (người dùng nghịch, hoặc bấm đúp hai lần).
- Kết quả: 6 lượt `apiSetLanguage`, 6 lần lấy `LockService` (Api.gs:305), 6 dòng `LANG_SET` trong ACTIVITY_LOG. Lúc đông người, các lượt này chen khoá với đặt lịch. Ngoài ra google.script.run chạy các lượt song song không theo thứ tự, nên giá trị cuối trong USERS có thể khác giá trị cuối trên màn hình; lần mở sau `adoptLang` sẽ đổi trang sang ngôn ngữ sai (phần thứ tự là SUY ĐOÁN, mock chạy tuần tự nên không chứng minh được).
- Sửa: gom lại, gửi một lượt sau 1,5 giây kể từ lần bấm cuối (`clearTimeout` + `setTimeout`), chỉ gửi nếu khác giá trị đã gửi gần nhất.
- ĐÃ CHỨNG MINH (số lượt gọi và số dòng nhật ký): test R07.

## 8. TRUNG BÌNH · Đổi ngôn ngữ trên tab tutor ghi đè phiên chung của tab admin vừa đăng nhập
- File: `src/ui/App.html:75` (`T.session.set(s)` ghi cả `thaiput_session` chung); cũng xảy ra mỗi lần `adoptLang` đổi giá trị.
- Kịch bản: tab A là tutor, tab B vừa đăng nhập admin (phiên chung = admin). Ở tab A bấm VI|EN.
- Kết quả sai: `localStorage.thaiput_session` thành phiên TUTOR. Tab mới mở ra (hoặc mở lại trình duyệt) vào cổng tutor thay vì admin. Trước 5H phiên chung chỉ đổi khi đăng nhập.
- Sửa: khi chỉ đổi `lang`, ghi phiên của tab (`T.store.tab`), và chỉ cập nhật phiên chung nếu `last.token === s.token`.
- ĐÃ CHỨNG MINH: test R15.

## 9. THẤP · Trang đăng nhập: đổi ngôn ngữ khi đang gửi link → gửi 2 email; câu "đã gửi" biến mất
- File: `src/ui/Login.html:20`, `:29-33`.
- Kịch bản: nhập email, bấm Gửi link, bấm EN, bấm lại.
- Kết quả sai: 2 lượt `apiRequestLogin`, 2 email tới học viên. Sau khi đã gửi xong mà đổi ngôn ngữ thì hộp xanh "Link đã được gửi" mất, người dùng tưởng chưa gửi và gửi lại (tốn hạn mức email, luật 12).
- Sửa: relabel giữ trạng thái `#l-msg` (loại và key) và cờ đang gửi.
- ĐÃ CHỨNG MINH: test R10.

## 10. THẤP · Trang auth: lựa chọn vừa bấm bị giá trị trên máy chủ đè, trái với quy tắc `langTouched`
- File: `src/ui/Login.html:70` (`if (d.lang) T.setLang(d.lang, {})` không xét `T.langTouched`).
- Kịch bản: tutor có USERS.lang = vi mở link; trong lúc "Đang đăng nhập..." bấm EN.
- Kết quả sai: vào cổng bằng tiếng Việt, `localStorage.thaiput_lang` bị ghi lại thành vi; lựa chọn EN mất. Thêm nữa, bấm VI|EN ở trang này dùng `T.session.get()` (có thể là phiên cũ còn trong localStorage của người khác trên cùng máy) để gọi `apiSetLanguage`, tức đổi ngôn ngữ của tài khoản cũ (phần này SUY TỪ CODE). Điểm tốt: không gọi `apiExchangeToken` lần 2 (đã kiểm, 1 lượt).
- Sửa: `if (T.langTouched) T.setLang(T.lang, { save: true }) else if (d.lang) ...`; trên trang auth và gauth không gọi `apiSetLanguage` bằng phiên cũ (chỉ lưu trên máy, gửi sau khi có phiên mới).
- ĐÃ CHỨNG MINH (phần đè): test R08.

## 11. THẤP · Admin: mở thông báo là "đã đọc" nhưng số đếm không giảm; "Hôm nay" cố định theo lúc mở trang
- File: `src/ui/Admin.html:124` (chỉ đổi class dòng), `:68` (`today` lấy `st.home.now` lúc tải trang).
- Kịch bản 1: 1 thông báo Khẩn chưa đọc, bấm mở rồi Đóng. Số đỏ trên tab "Thông báo", nút "Chưa đọc", nút "Khẩn", ô KPI "Khẩn chưa đọc" vẫn là 1. Admin tưởng còn việc.
- Kịch bản 2 (suy từ code): để trang quản trị mở qua đêm, bấm lọc sau 0 giờ: nhóm ngày vẫn tính theo hôm qua (thông báo hôm qua ghi "Hôm nay", hôm nay ghi "Thứ 7 18/10").
- Sửa: giảm `st.home.unread[n.level]` rồi cập nhật các số (hoặc gọi lại apiAdminHome nhẹ); máy chủ trả `now` trong apiAdminNotifications và `notifList` dùng giá trị đó.
- ĐÃ CHỨNG MINH (kịch bản 1): test R14. Ghép chuỗi ngày "Hôm qua" qua tháng, năm thì ĐÚNG (Date.UTC với ngày 0 lùi sang tháng trước).

## 12. THẤP · Truy cập bằng bàn phím và trình đọc màn hình
- `src/ui/App.html:81-84`: vẽ lại cả trang nên focus rơi về `<body>` sau khi bấm VI|EN bằng phím (test R09). Sửa: sau `T.relabel`, `document.querySelector('[data-langsw]').focus()`.
- `src/ui/App.html:91`: `aria-label="Đổi ngôn ngữ"` che nội dung VI/EN, trình đọc không biết đang ở tiếng nào. Sửa: nhãn kiểu "Ngôn ngữ: Tiếng Việt. Chuyển sang English" hoặc 2 nút có `aria-pressed`.
- `src/ui/App.html:230-245`: hộp thoại không giữ focus. Đang mở hộp, bấm Tab 8 lần là tới nút VI|EN phía sau, Enter đổi ngôn ngữ và vẽ lại trang dưới hộp (chuột thì bị lớp phủ chặn, đã kiểm `elementFromPoint`). ĐÃ CHỨNG MINH: `probe1.js`.

## 13. THẤP (hình ảnh) · Thanh đầu trang trong suốt trên trình duyệt không có color-mix()
- File: `src/ui/Styles.html:82`. Bản 8.0.8 có `background: var(--bg)`; bản mới chỉ có `color-mix(...)`. Safari iOS dưới 16.2 (iPhone đời cũ kẹt iOS 15), Chrome dưới 111 bỏ cả dòng, nền thành trong suốt; chữ và ô giờ cuộn xuyên qua logo và nút Thoát.
- Sửa: thêm `background: var(--bg);` ngay trước dòng color-mix (trình duyệt mới vẫn dùng dòng sau). Các chỗ color-mix khác chỉ là viền, hỏng nhẹ.
- ĐÃ CHỨNG MINH (giả lập bằng cách làm hỏng hàm color-mix): `shots/nocm_light_375_student_scrolled.png`, nền tính ra `rgba(0,0,0,0)`.

## 14. THẤP (hình ảnh) · Lỗi bố cục nhỏ thấy trên ảnh chụp
- Bộ lọc mức ở admin điện thoại: `.seg` có `flex-wrap: wrap` với bo tròn 999px, "Thông tin" rơi xuống dòng 2 trong một khối bo méo (`Styles.html:248`). Ảnh: `shots/v_light_375_admin_feed.png`. Sửa: `flex-wrap: nowrap; overflow-x: auto` hoặc thu gọn chữ. Tên `.seg` không đụng CSS khác trong sản phẩm, chỉ đụng thanh demo (demo tự ghi đè, không sao).
- Số đỏ trên tab "Cần xác nhận" của tutor (điện thoại, tiếng Việt) rơi xuống dòng dưới chữ (`Tutor.html:66`, `Styles.html:187`). Ảnh: `shots/v_light_375_tutor_avail.png`. Sửa: đặt `.count` tuyệt đối ở góc icon.
- Nhãn mức "Khẩn" trong hộp chi tiết thông báo bị kéo dài hết chiều ngang (`Admin.html:126`, hộp là flex cột). Ảnh: `shots/v_light_1280_admin_notif_sheet.png`. Sửa: `.sheet > .pill { align-self: flex-start; }`.
- Nút Zalo nổi đè lên nút "Send renewal request" và giá gói ở cạnh phải khi cuộn (`shots/v_light_375_student_account_en.png`, `shots/light_375_guest.png`). Nếu trình duyệt không có `:has()` (Firefox dưới 121) thì nút Zalo còn đè nút "Đặt N buổi" trên thanh hành động (`Styles.html:199-200`, SUY TỪ CSS).
- Chế độ tối: số đỏ trên tab (`#fff` trên `#ff8a80`) và chữ vàng logo trên nền xanh nhạt độ tương phản thấp (khoảng 2:1). Chế độ sáng: `.pill.gold` (vàng trên vàng nhạt) khoảng 3:1, dưới mức AA cho chữ nhỏ.

## 15. THẤP · Trình độ học viên hiện tiếng Việt cho tutor đang dùng tiếng Anh
- File: `src/ui/Tutor.html:71` hiện `s.level` nguyên văn; Sheets luôn lưu bản tiếng Việt (Home.html:20). Tutor Thái chọn EN vẫn thấy "Sơ cấp". Sửa: tra vị trí trong `h.levels` bản vi và hiện bản theo `T.lang`. SUY TỪ CODE (ảnh `shots/v_light_375_tutor_confirm.png` cho thấy giá trị lưu là tiếng Việt).

## Đã kiểm và KHÔNG thấy lỗi
- Trang auth/gauth: đổi ngôn ngữ trong lúc đổi link không gọi `apiExchangeToken`/`apiGoogleExchange` lần 2 (R08: 1 lượt). Link dùng 1 lần của tutor an toàn.
- Bộ nhớ trình duyệt bị chặn (Google Sites): không ném lỗi, ngôn ngữ giữ trong trang (R11). Mở lại trang thì mất lựa chọn trên máy, nhưng đã đăng nhập thì `adoptLang` lấy lại từ máy chủ.
- XSS: mọi `innerHTML` mới (dòng thông báo, `title`, nhóm ngày, hộp chọn ngôn ngữ, nhãn trạng thái, `T.m(x)`, nút lọc) đều qua `T.esc`. Thử thông báo chứa `<img onerror>`: không tạo thẻ img (R14).
- `T.dow` tính bằng `Date.UTC` + `getUTCDay`, đúng ở mọi múi giờ. `h.levels` bản vi và en cùng 4 mục; giá trị gửi lên lấy theo vị trí gốc nên ô trống giữa danh sách không làm lệch (chỉ lệch nếu admin nhập hai bản khác số mục, đã ghi chú ở cột position).
- `T.relabel` không dùng lại `T.state.opts` cho các trang có `relabel` (không mở lại mục gia hạn, không chạy lại thao tác). Không vẽ đôi.
- Tiêu đề "Hôm qua" qua ranh giới tháng và năm đúng.
- Không có cuộn ngang ở 375px và 1280px (script kiểm `scrollWidth`).

## Nhận định về hình ảnh
Bản làm mới nhìn chuyên nghiệp hơn rõ: bảng màu xanh đậm và vàng kim có cá tính, chữ số đơn cách cho giờ và ngày dễ quét, thẻ gói học là điểm nhấn đẹp, chế độ tối được làm cẩn thận chứ không chỉ đảo màu. Trên máy tính, cột tab trái và lưới tuần 7 cột của tutor dùng tốt màn rộng; thanh hành động nổi ở giữa gọn. Trên điện thoại, nhịp khoảng cách đều, nút đủ lớn để chạm. Điểm yếu: tab Đặt lịch tốn nhiều chỗ cho những ngày "Đã có buổi" (9 ô giờ xám mở sẵn chiếm gần nửa màn hình đầu), nút Zalo nổi hay đè lên nút hành động, cột tab trái trên máy tính có khoảng trống phía trên không dùng tới (logo nằm ở vùng nội dung), và một vài chi tiết nhỏ (bộ lọc admin gãy dòng, số đếm rơi dòng) làm mất cảm giác hoàn thiện ở 375px.

Ba cải tiến hình ảnh đáng làm nhất:
1. Ngày "Đã có buổi" thu gọn mặc định (không `open`, không vẽ 9 ô xám) và ưu tiên mở 3 ngày còn trống đầu tiên; màn đầu của học viên sẽ thấy ngay giờ đặt được.
2. Nút Zalo nổi: trên trang có thanh tab thì đưa vào thanh tab hoặc topbar (biểu tượng nhỏ), hoặc thu thành hình tròn 44px; bỏ phụ thuộc `:has()`.
3. Sửa bộ lọc `.seg` không gãy dòng ở điện thoại, số đếm tab đặt ở góc icon, và đưa logo thaiput vào đầu cột tab trái trên máy tính để cột không trống phía trên.

<!-- END FILE: v8/reports/SOAT_5H_R1_GIAODIEN.md -->

---

## `v8/reports/SOAT_5H_R2.md`

*Ngày tạo trong Project: 2026-10-17T16:43:30Z*

<!-- BEGIN FILE: v8/reports/SOAT_5H_R2.md | bytes=23287 | sha256=690b98aa9d2f2de37c7208717730a1314f741b912e0dc0cdef3424158c6484a0 | created=2026-10-17T16:43:30Z -->
# Soát vòng 2 chunk 5H (8.0.9): kiểm các bản sửa

Người soát: reviewer độc lập. Không sửa gì trong /home/claude/thaiput_v8.

Thư mục bằng chứng: `/tmp/claude-0/-home-claude/dd50bc10-d7be-5531-bd10-84767e5e2c71/scratchpad/review_r2/`
- `server/`: bản chép các script cũ p1 đến p6 (chạy lại trên code mới) và script mới p7, p7b, p8, p9, p10, p11. Chạy: `node <tên file>`.
- `ui/`: `rharness.js` + `mytests.js` (test cũ R01 đến R15, chạy lại, kết quả ở `rerun.log`), `rharness2.js` + `mytests2.js` (test mới N01 đến N07), `shots/` (ảnh Chromium mới của bản demo, dựng lúc 23:17 sau lần sửa src cuối), `css_fallback.js`, `probe1.js`.
- Bộ test dự án: `node test/harness.js` xanh hết (26/26, 40/40, 102/102, 36/36, 2/2). `ONLY=U36 node test/ui.js` ĐẠT. Lọc integration: `[]`.

Cách đọc test cũ: test R viết để TÁI HIỆN lỗi, nên "TRƯỢT" nghĩa là lỗi không còn. R01, R04, R10 vẫn "ĐẠT" vì test gửi sự kiện `submit` thẳng vào form, bỏ qua nút đang khoá; người dùng thật không làm được (nút khoá thì Enter trong ô chữ cũng không gửi form, theo chuẩn HTML). Ở cả ba, sau khi bấm VI | EN nút vẫn khoá và trang không vẽ lại, đó mới là điều cần kiểm.

---

## A. Các lỗi của hai lần soát trước

### Phía máy chủ (review_server.md)

| # | Lỗi cũ | Kết luận | Bằng chứng |
|---|---|---|---|
| S1 | Chuyển tab CONTENT bị ngắt thì không bao giờ chép chữ admin | ĐÃ SỬA | `p1`: lượt 1 BUSY, lượt 2 chép đủ (`h.hero_title`, `a.zalo` đúng chữ admin), lượt 3 không chép lại. Thuộc tính MIG_CONTENT_809 ghi PENDING trước khi đổi tên (Content.gs:419), DONE sau khi chép (Content.gs:444). Các tình huống phụ xem B2, B3 |
| S2 | Hai lượt gửi chiến dịch cùng lúc, mỗi người 2 email | ĐÃ SỬA | `p2`: lượt B bị từ chối, mỗi học viên 1 email, MAIL_LOG 8 dòng. Dấu MKT_RUN_ đặt trong khoá; `withLock_` xoá bộ đệm nên tập "đã gửi" đọc lại sau khi có dấu (Marketing.gs:158-167) |
| S3 | Đồng hồ 4,5 phút tính sau hộp thoại; lỗi giữa lô mất nhật ký | ĐÃ SỬA | `menuMarketingSend` lấy mốc trước hộp nhập mã (Marketing.gs:253, 264); vòng gửi có `finally` ghi MAIL_LOG (Marketing.gs:185-189); `p9` mục 1: lỗi gửi giữa lô, dấu được xoá, MAIL_LOG đủ. Nhưng xem lỗi mới B1 |
| S4 | Không dừng được chiến dịch, status bị ghi đè | ĐÃ SỬA | `p10`: đổi DRAFT sau email thứ 3, lượt dừng ở cuối lô (10 email), status giữ DRAFT, last_result ghi "dừng vì status đổi thành DRAFT". Lưu ý: dừng tay có hiệu lực ở ranh giới lô, tối đa 9 email nữa |
| S5 | `marketingFlushLog_` ghi trùng MAIL_LOG | ĐÃ SỬA (phần trùng) | `p3`: 4 email, 4 dòng. Nhưng cách sửa mở ra lỗi ngược chiều, xem B1 |
| S6 | Chép cả chữ gốc cũ như chữ admin sửa | ĐÃ SỬA theo đề xuất | Cột note ghi "Chép từ bản 8.0.8 (vi), xem lại" và menu 1 liệt kê 15 key đầu (Content.gs:464-466, Setup.gs:136). `p4` vẫn cho `a.zalo` = chữ gốc cũ, đúng như dự kiến: không có cách tự phân biệt |
| S7 | Tiêu đề có khoảng trắng thừa không nhận ra | ĐÃ SỬA | `contentHeader_` cắt khoảng trắng (Content.gs:411). `p5`: đổi tên, chép đúng |
| S8 | `seedContent_` ghi từng ô trong khoá | CHƯA SỬA | Setup.gs:230-233 vẫn `ct.update` từng dòng. `p6`: 462 lệnh ghi trong một `withLock_` khi đổi 1 cột của 231 dòng. Không có ghi chú chấp nhận trong CHUNK5H_GIAI_THICH.md |
| S9a | Hạn mức chỉ đọc 1 lần | ĐÃ SỬA | Đọc lại mỗi lô (Marketing.gs:174). `p10`: email hệ thống tốn 9 giữa lô 1, lượt dừng sau lô 1 với QUOTA. Còn lại 93 so với mức giữ 100: trong một lô vẫn có thể hụt tối đa 9, chấp nhận được |
| S9b | Hỏi "Gửi thật?" rồi mới báo thiếu hạn mức | ĐÃ SỬA | Marketing.gs:262 kiểm `canSend` trước hộp hỏi |
| S9c | Chân từ chối nhận tắt được | ĐÃ SỬA | `p11`: active FALSE và ô `-` đều dùng chữ gốc. Còn kẽ hở nhỏ, xem B6 |
| S9d | Nút dùng biến không phải link | ĐÃ SỬA | Marketing.gs:95 báo lỗi khi biến nút không có đuôi `_url` |
| S9e | Hai dòng USERS cùng email với nhóm ALL | CHẤP NHẬN (không đổi) | Code như cũ, không có ghi chú |
| S9f | Web bản cũ hiện chữ gốc giữa menu 1 và Triển khai | ĐÃ SỬA (tài liệu) | HUONG_DAN_PHAT_HANH.md:34 "Riêng bản 8.0.9: làm bước 5 ngay sau bước 4", kèm cách quay lui ở dòng 44 |
| S9g | Chú thích cũ ở Setup.gs | ĐÃ SỬA | Setup.gs:228-229 |
| S9h | `mailBookingSummary_` dùng câu lỗi tiếng Việt ở phần tiếng Anh | ĐÃ SỬA | Notify.gs:134 dùng `reasonText_(r.reason, lang)` |

### Phía giao diện (review_ui.md)

| # | Lỗi cũ | Kết luận | Bằng chứng |
|---|---|---|---|
| U1 | Đổi ngôn ngữ khi form đăng ký đang gửi, gửi được lần 2 | ĐÃ SỬA | R01: sau bấm EN nút vẫn khoá "Đang gửi...". `T.hold()` giữ cả bước đọc ảnh (Home.html:129, nhả ở cả nhánh lỗi :142). Trang không vẽ lại khi `T.inflight > 0` (App.html:123) |
| U2 | Đổi ngôn ngữ khi đang đặt, lượt đặt thứ 2 | ĐÃ SỬA | R02 TRƯỢT: 1 lượt `apiStudentBook`, 1 hộp kết quả, nút vẫn khoá |
| U3 | Tab Tài khoản mất chữ đang sửa, gửi gia hạn khác gói | ĐÃ SỬA | R04: chữ, gói PASS_1M, ảnh giữ nguyên, nút khoá. Khi không gửi, relabel giữ ô và gói (Student.html:27-33), U36 kiểm |
| U4 | Tutor lưu giờ rảnh 2 lần | ĐÃ SỬA | R03 TRƯỢT: 1 lượt, 1 hộp, nút khoá |
| U5 | Trang bảo trì ĐÓNG biến mất khi bấm VI \| EN | ĐÃ SỬA | R05 TRƯỢT; N01: chữ trang báo đổi sang tiếng Anh ("Under maintenance", câu `msg.en`). Lỗi phụ nhỏ ở nút Zalo, xem C2 |
| U6 | Trang quản trị lẫn tiếng Anh | ĐÃ SỬA | R06 TRƯỢT: `T.lang = vi`, câu lỗi "Không tìm thấy dữ liệu", nhãn logo tiếng Việt (App.html:337). Phần "trả lại ngôn ngữ đã lưu khi rời admin" chưa làm, xem C5 |
| U7 | Mỗi lần bấm VI \| EN là một lượt ghi có khoá | ĐÃ SỬA | R07 TRƯỢT: 6 lần bấm, 1 lượt `apiSetLanguage`, 0 dòng LANG_SET (giá trị cuối trùng giá trị cũ) |
| U8 | Đổi ngôn ngữ đè phiên chung của tab khác | ĐÃ SỬA | R15: phiên chung vẫn là ADMIN (`T.session.update`, App.html:47-51). Còn một đường khác, xem C3 |
| U9 | Trang đăng nhập gửi 2 email, mất câu "đã gửi" | ĐÃ SỬA | R10: nút vẫn khoá khi đổi ngôn ngữ; câu "đã gửi" còn (`sentTo`, Login.html:34) |
| U10 | Trang auth: giá trị máy chủ đè lựa chọn vừa bấm | ĐÃ SỬA | R08: trong lúc đổi link, nút VI \| EN bị chặn (apiExchangeToken là lượt ghi) và hiện "Đang gửi, đổi ngôn ngữ sau"; nhánh `T.langTouched` có ở Login.html:72; trang auth không dùng phiên cũ để lưu (App.html:81) |
| U11 | Admin: số đếm không giảm khi mở thông báo; "Hôm nay" cố định | MỘT PHẦN | N07: đóng hộp thì tải lại cả trang, KPI Khẩn 1 thành 0. Nhưng `apiAdminNotifications` vẫn không trả `now`, nên bấm lọc sau nửa đêm vẫn nhóm theo hôm qua; và có điểm mới, xem C6 |
| U12a | Mất focus sau khi bấm VI \| EN bằng phím | ĐÃ SỬA | R09: focus về lại nút (App.html:102) |
| U12b | aria-label che ngôn ngữ đang dùng | ĐÃ SỬA | "Current language: English. Tap to switch to Tiếng Việt" (key `a.lang_aria`) |
| U12c | Hộp thoại không giữ focus | MỘT PHẦN | `probe1.js`: Tab 8 lần vẫn tới nút VI \| EN phía sau, nhưng Enter không còn đổi trang (App.html:124 chặn khi có `.sheet-backdrop`). Các nút khác phía sau vẫn tới được bằng Tab |
| U13 | Thanh đầu trang trong suốt khi không có color-mix() | CHƯA SỬA | Đã thêm `background: var(--bg)` (Styles.html:84) nhưng không có tác dụng. Xem C1 |
| U14a | Bộ lọc `.seg` gãy dòng | ĐÃ SỬA | `shots/light_375_admin_feed.png`: một dòng, cuộn ngang trong khối |
| U14b | Số đếm tab tutor rơi dòng | ĐÃ SỬA ở tutor, GÂY LỖI MỚI ở admin | `shots/light_375_tutor_avail.png` đúng; admin xem C4 |
| U14c | Nhãn "Khẩn" kéo dài hết hộp | ĐÃ SỬA | `shots/light_1280_admin_notif_sheet.png` (Styles.html:209) |
| U14d | Nút Zalo nổi đè nội dung | MỘT PHẦN | Nút nhỏ hơn nhưng vẫn đè ô tải ảnh (`light_375_student_account_en.png`) và ô 15:00 (`light_375_tutor_avail.png`); vẫn dựa vào `:has()` (Styles.html:202, 306) |
| U14e | Độ tương phản tối | ĐÃ SỬA phần chữ | `--on-bad` tối là #2a0d0b trên #ff8a80; `.pill.gold` dùng `--gold-ink`. Logo vàng trên xanh vẫn thấp nhưng chỉ trang trí (`aria-hidden`), chấp nhận |
| U15 | Tutor thấy trình độ tiếng Việt | ĐÃ SỬA | `levelLabel` (Tutor.html:28-31) tra vị trí trong `h.levels` bản vi; U36 kiểm |

### Những điểm được yêu cầu dò riêng

- `T.inflight` kẹt trên 0: không tìm thấy đường kẹt mãi. `callOnce` luôn resolve (cả khi `google.script.run` ném lỗi đồng bộ), `apiCall` luôn resolve, `T.api` trừ bộ đếm trước khi `T.authed` ném SESSION hay MAINT (App.html:179, 213, 219). Hai chỗ dùng `T.hold` nhả bằng `.then(release, release)` ở cuối chuỗi, chạy cả khi `.catch` tự ném lỗi. Chỉ kẹt tạm khi Google chưa gọi lại (lượt chạy treo tới giới hạn 6 phút) hoặc khi tự thử lại tới 60 giây; lúc đó bấm VI | EN hiện thông báo chờ.
- Lượt lưu ngôn ngữ trễ: mã phiên giữ từ lúc bấm (App.html:88) nên không gửi nhầm người khi đổi tài khoản trong tab. Ngôn ngữ đọc lúc gửi (`T.lang`); chỉ khác lựa chọn cuối khi bấm tiếp ở trang không có phiên (lúc đó mã phiên cũ đã bị thoát nên máy chủ trả SESSION_INVALID). Xem C3, C7.
- Dấu MKT_RUN_: không kẹt mãi. `p9`: dấu 1 phút tuổi chặn kèm giờ bắt đầu; dấu 8 phút tuổi bị bỏ qua; dấu hỏng (không phải số) coi như cũ; lỗi giữa lô vẫn xoá dấu. Lượt bị Google cắt cứng để dấu lại tối đa khoảng 7 phút. Lượt thật không thể sống quá 7 phút tính từ lúc đặt dấu (giới hạn 6 phút tính từ lúc mở menu, dấu đặt sau đó).
- MIG_CONTENT_809 (`p8`): cài mới hoàn toàn, thuộc tính không được đặt, không có dòng cảnh báo (A). Bản đã có tab song ngữ: `contentDetachOld_` trả null vì có cột `vi`, không đụng thuộc tính. Admin xoá CONTENT_CU_808 trước bước chép: lượt sau đánh DONE và báo "CẢNH BÁO: không thấy tab CONTENT_CU_808 ..." (B), chữ web về chữ gốc, đúng hành vi mong đợi vì dữ liệu do admin xoá. Hai tình huống chưa ổn ở B2, B3.

---

## B. Lỗi mới phía máy chủ

### B1. TRUNG BÌNH · Ghi MAIL_LOG marketing hỏng một lần là bỏ cả lô; lần chạy sau gửi lại tối đa 10 người
- File: src/Marketing.gs:214-226 (`marketingFlushLog_`), kết hợp src/Db.gs:145-161 (`flush_` xoá danh sách chờ TRƯỚC khi `setValues`).
- Kịch bản: lỗi không phải BUSY khi ghi MAIL_LOG (ví dụ "Service Spreadsheets timed out" ở lệnh `setValues`). Bản sửa S5 chỉ thử lại khi BUSY, nên danh sách bị bỏ, dòng chưa xuống Sheets. Lượt dừng với câu "dừng vì không ghi được nhật ký gửi; chạy lại sau ít phút". Admin làm theo, những người của lô đó nhận lần 2. Trái luật 51 ("mỗi người một lần mỗi mã"). Bản trước khi sửa thử lại và ghi được. Ngược lại, khi dòng ĐÃ ghi mà lỗi ở `SpreadsheetApp.flush` (`p3`), câu báo "không ghi được nhật ký" lại sai.
- ĐÃ CHỨNG MINH: `p7b_flushlog_lost_midway.js`: lượt 1 gửi 10, MAIL_LOG 0 dòng, status SENDING; lượt 2 gửi 12; 10 người nhận 2 email. (`p7_flushlog_lost.js`: 4 tutor, status thành SENT với MAIL_LOG 0, đổi lại READY sau này cũng gửi trùng.)
- Cách sửa: làm việc ghi nhật ký marketing chạy lại được an toàn: gom `{to, kind, subject}` vào mảng riêng (không dùng closure của `deferWrite_`), trong khoá đọc lại MAIL_LOG và chỉ `insert` địa chỉ chưa có `kind` đó, lỗi gì cũng thử lại. Khi đã chống trùng theo nội dung thì thử lại không thể ghi đôi. Kèm test: hỏng `setValues` một lần, lượt sau không gửi lại ai.

### B2. THẤP · MIG_CONTENT_809 là thuộc tính chung của project, còn việc chuyển là theo từng file DB
- File: src/Content.gs:410, 419, 438-444.
- Kịch bản: cùng một project chạy STAGING rồi `switchToProduction` (Setup.gs:15 dùng file đang mở làm DB PRODUCTION). Menu 1 trên STAGING bị cắt sau khi đổi tên (PENDING). Menu 1 trên file PRODUCTION (không có tab cũ hoặc có tab cũ cùng tên): lượt này đánh DONE (hoặc ghi đè PENDING bằng tab của file PRODUCTION). Quay lại STAGING thì chữ admin của STAGING không bao giờ được chép, không có cảnh báo.
- ĐÃ CHỨNG MINH: `p8` mục C. Chỉ xảy ra nếu dùng chung project cho hai file DB; nếu STAGING và PRODUCTION là hai project riêng (quy ước 3) thì không gặp.
- Cách sửa: khoá theo file: `'MIG_CONTENT_809_' + ss.getId()`.

### B3. THẤP · Chép bù ở lượt sau ghi đè chữ admin đã sửa trong tab CONTENT mới
- File: src/Content.gs:452-470 (`contentCarryOld_` ghi `vi`/`en` không xét giá trị hiện tại).
- Kịch bản: menu 1 lỗi sau khi đổi tên; admin không để ý, Triển khai, sửa chữ ngay trong tab CONTENT song ngữ; vài hôm sau chạy menu 1: chữ 8.0.8 đè chữ mới.
- ĐÃ CHỨNG MINH: `p8` mục D: "Chữ admin sửa ở tab MỚI" thành "Tiêu đề admin đã sửa".
- Cách sửa: chỉ chép khi ô đích còn bằng `default_vi`/`default_en` (chưa ai sửa); ô đã khác thì bỏ qua và liệt kê trong dòng báo.

### B4. THẤP · Nhánh BUSY hai lần: xoá dấu "đang gửi" trước khi ghi MAIL_LOG còn lại
- File: src/Marketing.gs:188, 192; src/Db.gs:447 (`runAfterLock_` chạy SAU khi nhả khoá).
- Kịch bản: ghi nhật ký BUSY hai lần, các dòng nằm lại trong `DEFER_WRITES_`. Khoá xoá dấu ở dòng 192 xoá dấu trước, rồi mới ghi các dòng đó sau khi nhả khoá. Lượt khác vào đúng khe này đọc MAIL_LOG thiếu và gửi lại tối đa 10 người. Nếu cả khoá dòng 192 và dòng 199 đều BUSY thì lượt ném lỗi, các dòng mất theo tiến trình (cũng gửi lại khi chạy lại).
- Chưa chứng minh (đọc code; cần hai tiến trình xen kẽ trong khe ngắn). Sửa cùng B1: ghi nhật ký còn lại rồi mới xoá dấu, trong cùng một khoá; không xoá dấu khi còn dòng chưa ghi (để hết hạn 7 phút).

### B5. THẤP · Gửi bằng chữ đọc lúc bắt đầu, không phải chữ vừa sửa
- File: src/Marketing.gs:166, 181 (`row` đọc một lần; `fresh` đọc mỗi lô chỉ dùng để xem status).
- Kịch bản: admin thấy lỗi chính tả, sửa body khi status vẫn READY (không đổi DRAFT): phần còn lại vẫn đi với chữ cũ. Chưa chứng minh (đọc code). Sửa: render bằng `fresh`, hoặc ghi rõ trong hướng dẫn "muốn sửa chữ thì đổi DRAFT trước".

### B6. THẤP · Chân từ chối nhận vẫn có thể rỗng hoặc thiếu câu từ chối khi admin tự viết
- File: src/Marketing.gs:112-116.
- Kịch bản: admin sửa body MARKETING_FOOTER thành chữ chỉ có biến không tồn tại, hoặc câu không có hướng dẫn từ chối. `p11` mục cuối: email không còn câu từ chối ở cả hai thứ tiếng. Mẫu không qua `marketingCheck_`.
- ĐÃ CHỨNG MINH: `p11_footer.js`. Sửa: nếu `renderBody_` của chân trả rỗng thì dùng chữ gốc; menu "Gửi thử" cảnh báo khi chân khác chữ gốc.

---

## C. Lỗi mới phía giao diện

### C1. THẤP (hình ảnh) · Bản sửa thanh đầu trang không có tác dụng trên trình duyệt cũ
- File: src/ui/Styles.html:84 (`background: var(--bg); background: color-mix(in srgb, var(--bg) 92%, transparent);`).
- Vì sao: khai báo có `var()` luôn được nhận lúc đọc CSS; trình duyệt không biết `color-mix` chỉ thấy sai lúc tính giá trị, khi đó thuộc tính về giá trị đầu (trong suốt), KHÔNG quay về dòng `var(--bg)` phía trước. Safari iOS dưới 16.2, Chrome dưới 111 vẫn thấy chữ cuộn xuyên qua logo và nút Thoát.
- ĐÃ CHỨNG MINH: `shots/nocm_light_375_student_scrolled.png`, nền tính ra `rgba(0, 0, 0, 0)` dù đã có dòng dự phòng; `css_fallback.js` cho thấy cơ chế: có `var()` thì trong suốt, không có `var()` thì về trắng.
- Cách sửa: đặt dòng color-mix trong `@supports (background: color-mix(in srgb, red 50%, transparent)) { .topbar { ... } }` để sau dòng gốc, hoặc dùng token màu tính sẵn (ví dụ `--bg-glass: rgba(...)` khai báo cho sáng và tối).

### C2. THẤP (hình ảnh) · Trang bảo trì: bấm VI | EN gắn lại `above-tabs` cho nút Zalo
- File: src/ui/App.html:98-100 (`T.maintScreen` gọi `T.fab('maint')`, rồi `T.relabel` gọi `T.fab(page)` với `page = 'student'`).
- ĐÃ CHỨNG MINH: N01: trước `fab-zalo`, sau `fab-zalo above-tabs`, trang không có thanh tab, nút nổi cao bất thường trên điện thoại.
- Cách sửa: tính trang hiệu lực `var eff = data-page === 'maint' ? 'maint' : page` rồi gọi `T.fab(eff)`.

### C3. THẤP · Thoát ở tab A khi phiên chung là của người B: bấm VI | EN ở trang đăng nhập đổi ngôn ngữ tài khoản B
- File: src/ui/App.html:38-44 (`T.session.get` lấy phiên chung khi tab không có phiên và chép vào tab), :81-90.
- Kịch bản: tab A tutor, tab B vừa đăng nhập học viên S005 (phiên chung là S005). Tab A bấm Thoát, ở trang đăng nhập bấm VI | EN. Trang lấy phiên S005, lưu ngôn ngữ cho S005, và tab A âm thầm mang phiên S005 (`T.token()` là của S005).
- ĐÃ CHỨNG MINH: N03: USERS.lang S005 từ "vi" thành "en", 2 lượt `apiSetLanguage` bằng mã của S005.
- Cách sửa: khi lưu ngôn ngữ chỉ dùng phiên riêng của tab (`T.store.tab`), không dùng phiên chung; trang login (như auth, gauth) chỉ lưu trên máy.

### C4. THẤP (hình ảnh, do bản sửa U14b) · Số đếm tab "Thông báo" của admin đè lên chữ trên điện thoại
- File: src/ui/Styles.html:189 (`.tab .count` tuyệt đối theo góc icon), src/ui/Admin.html:49 (tab admin không có icon).
- ĐÃ CHỨNG MINH: `shots/crop_light_375_admin_feed.png`, `shots/crop_dark_375_admin_feed.png`: chấm đỏ "3" che chữ "báo".
- Cách sửa: chỉ đặt tuyệt đối khi tab có icon, ví dụ `.tab .ic ~ span .count { position: absolute; ... }` và mặc định `position: static; margin-left: 4px`; hoặc thêm class cho tab admin.

### C5. THẤP · Rời trang quản trị vẫn tiếng Việt dù máy đã lưu EN
- File: src/ui/App.html:337 (chỉ đặt `vi` khi vào admin, không trả lại khi rời).
- ĐÃ CHỨNG MINH: N04: bấm logo về trang chủ, `T.lang = vi`, máy lưu `en`. Bấm Thoát rồi trang đăng nhập cũng tiếng Việt.
- Cách sửa: trong `T.go`, nếu `page !== 'admin'` và ngôn ngữ đang là giá trị ép của admin thì `T.setLang(T.storedLang() || T.lang, { local: true })`.

### C6. THẤP · Admin đóng thông báo: tải lại cả trang, có thể vẫn ra số cũ
- File: src/ui/Admin.html:128 (`apiAdminMarkRead` không chờ), :133 (`backToList` gọi `apiAdminHome` ngay khi đóng).
- Kịch bản: trên Google thật hai lượt `google.script.run` chạy song song; `apiAdminMarkRead` lấy khoá và ghi, `apiAdminHome` đọc không khoá. Admin liếc rồi đóng trong khoảng 1 đến 2 giây thì Home có thể đọc trước khi ghi xong, số đếm quay lại như cũ (số đã trừ tại chỗ ở dòng 127 bị thay bằng dữ liệu máy chủ). Ngoài ra mỗi lần đóng là một lần hiện khung chờ và mất chỗ cuộn, xử lý 10 thông báo phải cuộn lại 10 lần.
- Chưa chứng minh phần đua (bộ giả lập chạy tuần tự: N07 ra MarkRead trước Home). Cách sửa: giữ promise của MarkRead và tải lại trong `.then` của nó; hoặc không gọi máy chủ, chỉ `frame(root)` lại từ `st.home` đã trừ.

### C7. THẤP · Bấm VI | EN rồi Thoát trong 1,2 giây: lựa chọn không tới máy chủ
- File: src/ui/App.html:86-89, :387-392.
- ĐÃ CHỨNG MINH: N02: `apiSetLanguage` trả SESSION_INVALID, USERS.lang vẫn "vi" (máy vẫn lưu "en"). Thiết bị khác và email dùng ngôn ngữ cũ.
- Cách sửa: `T.logout` gửi ngay lượt lưu ngôn ngữ đang chờ (clearTimeout rồi gọi), và gọi `apiLogout` trong `.then` của nó.

### C8. THẤP · Luật 50 "relabel không gọi máy chủ" chưa đúng ở hai chỗ (có từ trước vòng này)
- Student tab Đặt lịch sau hơn 60 giây: relabel gọi lại `apiStudentSlots` (src/ui/Student.html:87). N05: 1 lượt gọi thêm; giờ đã chọn vẫn giữ.
- Tutor tab Tài khoản: relabel gọi lại `apiTutorStats` (src/ui/Tutor.html:46-47, 56). N06: 1 lượt gọi thêm.
- ĐÃ CHỨNG MINH. Không hại dữ liệu. Sửa: relabel dùng `st.days` có sẵn bất kể tuổi; giữ kết quả thống kê trong `st` và vẽ lại từ đó. Hoặc ghi rõ ngoại lệ vào luật 50.

Ghi chú nhỏ, không tính là lỗi: trên trang auth, gauth, nút VI | EN giờ luôn bị chặn trong lúc đổi link (apiExchangeToken được đếm là lượt ghi) và hiện "Đang gửi, đổi ngôn ngữ sau khi xong nhé"; `relabelWaiting` gần như không còn dùng tới. Học viên chọn EN vẫn thấy ô Trình độ "Sơ cấp" ở tab Tài khoản (ô chữ tự sửa, Student.html:207), khác với U15 của tutor.

---

## Tóm tắt
Phần lớn lỗi cũ đã sửa và có bằng chứng chạy lại: 2 lỗi CAO phía máy chủ (S1, S2) và 4 lỗi CAO/TRUNG BÌNH chống gửi trùng phía giao diện (U1 đến U4) đều hết. Còn lại: S8 chưa sửa; U13 tưởng đã sửa nhưng không có tác dụng (C1); U11, U12c, U14d mới sửa một phần. Lỗi mới đáng sửa trước khi lên PRODUCTION: B1 (bản sửa S5 làm mất nhật ký khi Sheets lỗi, dẫn tới gửi marketing trùng, đã chứng minh). Các lỗi mới còn lại đều THẤP.

<!-- END FILE: v8/reports/SOAT_5H_R2.md -->

---

## `v8/reports/THU_PHA_5H.txt`

*Ngày tạo trong Project: 2026-10-17T16:43:31Z*

<!-- BEGIN FILE: v8/reports/THU_PHA_5H.txt | bytes=5926 | sha256=4a1f668fc4e5787c70ad6ba3ef23a11adf97c1f739c41d3385afbdd06be372c0 | created=2026-10-17T16:43:31Z -->
```text
Thử phá code chunk 5H: mỗi dòng một lỗi cài cố ý, test nào bắt.
G1 BỊ BẮT I96
G2 BỊ BẮT I96
G3 BỊ BẮT I60,I96
G4 BỊ BẮT I96
G5 BỊ BẮT I96
G6 BỊ BẮT I97
G7 BỊ BẮT I97
G8 BỊ BẮT I91,I97
G9 BỊ BẮT I97
G10 BỊ BẮT I98
G11 BỊ BẮT I98
G12 BỊ BẮT I98
G13 BỊ BẮT I98,I99,I102
G14 BỊ BẮT I99
G15 BỊ BẮT I99
G16 BỊ BẮT I99
G17 BỊ BẮT I98
G18 BỊ BẮT I98
G19 BỊ BẮT I98,I102
G20 BỊ BẮT I98
G21 BỊ BẮT I100
G22 BỊ BẮT I100
G23 BỊ BẮT I100
G24 BỊ BẮT I39
G25 BỊ BẮT I97
G26 BỊ BẮT I98,I99,I102
U1 BỊ BẮT TRƯỢT U33 Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu v
U2 BỊ BẮT TRƯỢT U33 Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu v
U3 BỊ BẮT TRƯỢT U34 Tutor đổi ngôn ngữ giữa chừng: giờ rảnh chưa lưu và thanh Lưu vẫn còn, chữ đổi sang tiếng Việt, lưu USERS.lang; admin không có nút VI | EN
U4 BỊ BẮT TRƯỢT U32 Trang chủ: bấm EN đổi mọi chữ sang tiếng Anh, giữ chữ đã nhập và ảnh đã chọn; trình độ gửi lên vẫn là bản tiếng Việt; mở lại trang vẫn tiếng Anh
U5 BỊ BẮT TRƯỢT U32 Trang chủ: bấm EN đổi mọi chữ sang tiếng Anh, giữ chữ đã nhập và ảnh đã chọn; trình độ gửi lên vẫn là bản tiếng Việt; mở lại trang vẫn tiếng Anh
U6 BỊ BẮT TRƯỢT U21 Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc | TRƯỢT U35 Th
U7 BỊ BẮT TRƯỢT U32 Trang chủ: bấm EN đổi mọi chữ sang tiếng Anh, giữ chữ đã nhập và ảnh đã chọn; trình độ gửi lên vẫn là bản tiếng Việt; mở lại trang vẫn tiếng Anh
U8 BỊ BẮT TRƯỢT U33 Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu v
U9 BỊ BẮT TRƯỢT U33 Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu v
U10 BỊ BẮT TRƯỢT U31 16/10: tab Tài khoản học viên không còn mục thiết bị; 5G: bảo trì CHỈ XEM hiện thanh báo, bấm Đặt nhận câu bảo trì và không ghi; ĐÓNG thì cổng hiện tr
U11 BỊ BẮT TRƯỢT U35 Thông báo admin gọn (5H): mỗi thông báo một dòng, gom Hôm nay, Hôm qua; lọc bằng nút Khẩn, Tất cả; bấm dòng mở chi tiết; điện thoại và máy tính
G27 BỊ BẮT I96,I101
G28 BỊ BẮT I101
G29 BỊ BẮT I102
G30 BỊ BẮT I102
G31 BỊ BẮT I102
G32 SỐNG SÓT, tương đương: chữ rỗng đã có lớp chặn thứ hai (dùng chữ gốc)
G33 BỊ BẮT I102
G34 BỊ BẮT I98,I99,I102
U12 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U13 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U14 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U15 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U16 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U17 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U18 BỊ BẮT TRƯỢT U36 Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang 
U19 BỊ BẮT TRƯỢT U35 Thông báo admin gọn (5H): mỗi thông báo một dòng, gom Hôm nay, Hôm qua; lọc bằng nút Khẩn, Tất cả; bấm dòng mở chi tiết; điện thoại và máy tính
G35 BỊ BẮT I102
G36 BỊ BẮT I102
G37 BỊ BẮT I101
G38 BỊ BẮT I101
G39 SỐNG SÓT, tương đương: email dựng ra không bao giờ rỗng
U20 BỊ BẮT TRƯỢT U37 Soát 5H vòng 2: rời trang quản trị trả lại ngôn ngữ đã lưu; bấm EN rồi Thoát ngay vẫn lưu lên máy chủ; tab đã thoát không đổi ngôn ngữ của tài khoản t
U21 BỊ BẮT TRƯỢT U37 Soát 5H vòng 2: rời trang quản trị trả lại ngôn ngữ đã lưu; bấm EN rồi Thoát ngay vẫn lưu lên máy chủ; tab đã thoát không đổi ngôn ngữ của tài khoản t
U22 SỐNG SÓT, tương đương: trang đăng nhập đã chặn lưu từ trước
U23 BỊ BẮT TRƯỢT U37 Soát 5H vòng 2: rời trang quản trị trả lại ngôn ngữ đã lưu; bấm EN rồi Thoát ngay vẫn lưu lên máy chủ; tab đã thoát không đổi ngôn ngữ của tài khoản t
```
<!-- END FILE: v8/reports/THU_PHA_5H.txt -->

---

## `v8/reports/SOAT_5I_R1_MAYCHU.md`

*Ngày tạo trong Project: 2026-10-18T14:59:30Z*

<!-- BEGIN FILE: v8/reports/SOAT_5I_R1_MAYCHU.md | bytes=28927 | sha256=cbdf7a253230e0f13bce624eef0834e2955bdce0f16631e06d8308d99c8d3cb4 | created=2026-10-18T14:59:30Z -->
# Soát 5I vòng 1 · phía máy chủ (reviewer A)

Ngày 18/10/2026. Phạm vi: src/*.gs sau chunk 5I (kể cả thay đổi apiSetLanguage kiểm bảo trì trong hàm qua MAINT_ROLE_APIS_). Không sửa file nào trong src, test, dist, demo.

Cách làm: đọc mã, chạy `node test/harness.js` (xanh: 26/26, 40/40, 108/108, 42/42, 2/2), viết script tái hiện trong `/tmp/claude-0/review_a/` (r1_purge_formula.js, r2_misc.js, r3_logpage.js, r4_recover_log.js, r5_onedit_cost.js, notify_en.js, actkeys.js, menulog.js, size.js). Chạy: `node /tmp/claude-0/review_a/<tên>.js`.

## Tóm tắt

* A1 VỪA · purgeRows_ (lưu trữ ACTIVITY_LOG mỗi đêm) biến chữ đã thêm dấu nháy thành công thức (phá luật 26). Đã tái hiện.
* A2 VỪA · Thay đổi cấu trúc trong Sheets (xoá dòng, chèn dòng, xoá hay đổi tên tab) không được ghi nhật ký: không có trigger onChange.
* A3 VỪA · Mỗi lần sửa tay lấy khoá toàn script; khoá bận quá 10 giây thì dòng SHEET_EDIT mất im lặng.
* A4 VỪA · mailQuotaInfo_ chẩn đoán sai "tài khoản dùng thử" sau một ngày gửi nhiều (đếm từ 0 giờ, Google tính 24 giờ trượt; đếm cả địa chỉ thử tải). Đã tái hiện.
* A5 VỪA (chưa tái hiện) · Giữ đối tượng Spreadsheet qua nhiều khoá: không có nguồn chính thức xác nhận đọc lại luôn mới; Google có nói về bộ đệm đọc trước.
* A6 THẤP · notify_ CALENDAR_NIGHTLY không có message_en. Đã tái hiện (quét tĩnh).
* A7 THẤP · Chữ một thứ tiếng còn gửi cho trang quản trị và cổng: detail nhật ký, lý do huỷ mặc định "Admin huỷ", tiêu đề lỗi ADMIN_ERROR, label và statusText của cổng học viên.
* A8 THẤP · Job chạy bằng trigger (BACKUP_DONE) ghi nhật ký dưới email admin, bộ lọc "Hệ thống" bỏ sót. Đã tái hiện.
* A9 THẤP · "Xem thêm" của nhật ký phân trang theo số hàng: sau job lưu trữ đêm hoặc admin sắp xếp thì trùng hoặc sót dòng. Đã tái hiện (40 dòng trùng).
* A10 THẤP · Dòng PURGE_RECOVERED của chính ACTIVITY_LOG bị mất. Đã tái hiện.
* A11 THẤP · SHEET_EDIT: sửa nhiều ô không ghi giá trị; ô không có e.oldValue ghi thành "" (có thể sai khi dán).
* A12 THẤP · Còn thao tác đổi trạng thái không ghi nhật ký: switchToProduction, setupFirstRun chạy từ trình soạn, bật tắt giả lập giờ, đóng cổng thử tải.
* A13 THẤP · Hướng dẫn trong menuMailTest có chỗ chưa đúng nguồn (thời gian chờ Email Log Search, Check MX, thiếu bước DKIM); mã thư theo giờ giả lập.
* A14 THẤP · Điều kiện tăng hạn mức ghi thiếu "sau khi chuyển sang trả phí", và Google có chỗ ghi tới 75 ngày (Notify.gs, CLAUDE.md luật 12).
* A15 THẤP (chưa tái hiện trên Google thật) · appendRowsRaw_ ghi ô trống vào mọi cột tiêu đề, kể cả cột admin tự thêm.
* A16 THẤP · Lưu trữ ACTIVITY_LOG mỗi đêm viết lại cả tab trong khoá (trước đây mỗi tháng một lần).

Mục 5 (chẩn đoán có nguồn) ở cuối báo cáo.

## Chi tiết

### A1 VỪA · purgeRows_ biến chữ có dấu nháy thành công thức

File: src/Db.gs:270 đến 292 (purgeRows_), gọi từ src/Archive.gs:151 đến 156 (archivePurgeBySig_).

Cơ chế: appendRowsRaw_ và DbTable ghi chữ bắt đầu bằng = + - @ ở cột không phải `text` kèm dấu nháy (safeCellText_). Google trả `getValues()` KHÔNG có dấu nháy và `getFormulas()` trống. purgeRows_ chép lại nguyên `raw` (chỉ thay bằng công thức khi getFormulas có), ghi bằng setValues: chữ "=1+1" thành công thức thật. Mock mô phỏng đúng điều này (gas_mock.js dòng 74 bỏ dấu nháy khi ghi, getValues trả chữ không nháy) và ghi lại vào `state.formulaWrites`.

Chunk 5I làm lỗi này hay xảy ra hơn: ACTIVITY_LOG giờ bị purgeRows_ MỖI ĐÊM, và SHEET_EDIT ghi `entity_id` lấy từ ô khoá do admin gõ (khoá CONFIG, CONTENT, EMAIL_TEMPLATES, NOTIFY_RULES, mã gói, mã chiến dịch marketing) vào cột `entity_id` (không thuộc `text`). MAIL_TEST ghi `entity_id` là địa chỉ admin nhập (isEmail_ chấp nhận "=x@y.z").

Tái hiện (r1_purge_formula.js): ghi một dòng cũ 70 ngày và một dòng SHEET_EDIT với entity_id "=1+1"; sau khi ghi, ô lưu là chữ, formulaWrites rỗng. Chạy archiveTabInLock_('ACTIVITY_LOG'): lưu trữ 1 dòng, và `formulaWrites` có `{ sheet: 'ACTIVITY_LOG', cell: '2:5', value: '=1+1' }`.

Hậu quả: nhật ký kiểm toán bị đổi giá trị (hiện kết quả công thức hoặc #ERROR), công thức có thể gọi IMPORTXML, HYPERLINK; phá luật 26. Cùng lỗi áp dụng cho MAIL_LOG.kind, cột không phải `text` của NOTIFICATIONS, BOOKINGS (admin_action, status), AVAILABILITY khi lưu trữ hằng tháng.

Sửa đề xuất: trong purgeRows_, khi dựng `out`, với cột không thuộc `text` và không thuộc `formulas`, ô không có công thức thì `out[j] = safeCellText_(line[j])`. Thêm test: dòng có "=1+1" ở cột không phải text, chạy purgeRows_ bỏ dòng khác, `formulaWrites` phải rỗng.

### A2 VỪA · Thay đổi cấu trúc trong Sheets không được ghi nhật ký

File: src/Admin.gs:86 đến 129 (onEditInstallable, logSheetEdit_), src/Setup.gs:17 và 299 (chỉ tạo trigger onEdit).

Google: "An installable edit trigger runs when a user modifies a value in a spreadsheet" và "An installable change trigger runs when a user modifies the structure of a spreadsheet itself" (developers.google.com/apps-script/guides/triggers/installable); onChange có changeType INSERT_ROW, REMOVE_ROW, INSERT_COLUMN, REMOVE_COLUMN, INSERT_GRID, REMOVE_GRID, FORMAT, OTHER (developers.google.com/apps-script/guides/triggers/events).

Kịch bản: admin chọn 3 dòng trong BOOKINGS, chuột phải, Xoá hàng. Không có sự kiện edit, không có dòng SHEET_EDIT, không có gì trong ACTIVITY_LOG. Đây chính là thao tác luật 10 cấm và nguy hiểm nhất; người dùng yêu cầu "ghi mọi activity". Tương tự: xoá hoặc đổi tên tab, chèn cột.

Hậu quả: thao tác phá dữ liệu nặng nhất không để lại dấu vết.

Sửa đề xuất: thêm trigger cài đặt onChange (ví dụ `onChangeInstallable`), ghi `SHEET_CHANGE` với changeType, tên tab đang hoạt động (`e.source.getActiveSheet()`), người làm; thêm vào TRIGGER_HANDLERS_, sửa số 9 trigger trong testSystem và I01, I12; thêm key ad.act.SHEET_CHANGE.

### A3 VỪA · Mỗi lần sửa tay lấy khoá toàn script; khoá bận thì mất nhật ký im lặng

File: src/Log.gs:22 đến 24 (logMenu_ chờ khoá 10 giây, lỗi chỉ Logger.log), src/Admin.gs:93 (gọi trước bộ xử lý dropdown).

Đo trong mock (r5_onedit_cost.js): sửa 1 ô USERS.note tốn 1 lần lấy khoá, 6 lượt đọc, 3 lượt ghi, cộng SpreadsheetApp.flush và ScriptApp.getProjectTriggers (requireOperator_). Trên Google thật mỗi lượt đọc, ghi vài trăm mili giây.

Kịch bản: lúc 03:00 job lưu trữ giữ khoá vài phút (runJob_ của hourlyJob, dailyJob cũng giữ khoá cả job); admin sửa tay vài ô trong lúc đó. Mỗi lần sửa chờ 10 giây rồi bỏ, dòng SHEET_EDIT không bao giờ được ghi, không báo admin. Khi đông người đặt lịch, mỗi lần admin gõ một ô lại tranh khoá với lượt đặt; với ô dropdown, lấy khoá ghi nhật ký TRƯỚC rồi bộ xử lý mới lấy khoá lần nữa (toast chậm thêm).

Hậu quả: "ghi mọi activity" không được bảo đảm đúng lúc hệ thống bận; sửa tay làm chậm đặt lịch.

Sửa đề xuất: onEdit không lấy khoá cho nhật ký: đẩy dòng vào hàng chờ CacheService hoặc Script Properties (khoá theo giờ thật + số ngẫu nhiên), calendarJob mỗi 5 phút hoặc lượt ghi kế tiếp gom ghi bằng logAppend_. Hoặc tối thiểu: khi lấy khoá thất bại thì ghi hàng chờ đó thay vì bỏ.

### A4 VỪA · mailQuotaInfo_ chẩn đoán sai "tài khoản dùng thử"

File: src/Notify.gs:243 đến 258 (mailSentToday_, mailQuotaInfo_), src/Setup.gs:351.

Cơ chế: `limit = remaining + sent`, `sent` đếm MAIL_LOG từ 0 giờ hôm nay. Google: Apps Script "Quotas are per user and reset 24 hours after the first request"; Gmail "Limits per day are applied over a rolling 24-hour period, not a set time of day". mailSentToday_ đếm cả dòng `@loadtest.invalid` (sendMail_ ghi MAIL_LOG mà không gửi thật), không đếm thư do dự án khác của cùng tài khoản gửi (ví dụ dự án phụ đăng nhập Google, mẫu gửi thử).

Tái hiện (r2_misc.js):
* 60 dòng MAIL_LOG tới `@loadtest.invalid` hôm nay: mailSentToday_ = 60, hạn mức ước tính 1.560 (sai).
* remaining 20, gửi hôm nay 10: kind WORKSPACE_LIMITED, câu "Hạn mức email khoảng 30 người nhận mỗi ngày dù là Workspace: tài khoản đang ở mức dùng thử".

Kịch bản thật: tài khoản đủ 1.500, 21:00 tối qua gửi chiến dịch marketing 1.400 thư; 08:00 sáng nay admin chạy menu 2: remaining khoảng 100, sent hôm nay 0, limit 100, testSystem cảnh báo "tài khoản dùng thử, code không đổi được". Admin đi tìm nguyên nhân sai chỗ đúng ngày cần chẩn đoán nhất.

Sửa đề xuất: đếm 24 giờ trượt (từ `getNow_() - 24h`), bỏ địa chỉ isTestAddress_, ghi rõ "ước tính"; chỉ kết luận WORKSPACE_LIMITED khi `remaining + sent24h <= 150` VÀ không có chiến dịch marketing trong 24 giờ; câu cảnh báo nói "có thể", kèm cách kiểm (Admin console, Billing).

### A5 VỪA (chưa tái hiện) · Giữ đối tượng Spreadsheet qua nhiều khoá

File: src/Db.gs:29 đến 39 (SS_CACHE_, SS_CACHE_ID_), src/Config.gs:271 (loadConfigTab_ dùng dbSpreadsheet_).

Câu hỏi: lần chạy A mở file, đọc BOOKINGS trong khoá 1, nhả khoá; lần chạy B ghi BOOKINGS và flush; A vào khoá 2 và đọc lại bằng CÙNG đối tượng Spreadsheet: có thấy dòng của B không.

Nguồn: tài liệu chính thức chỉ nói "Apps Script uses built-in optimization like look-ahead and write caching" (developers.google.com/apps-script/guides/support/best-practices), không nói bộ đệm đọc trước gắn với đối tượng nào và có bị xoá khi lần chạy khác ghi hay không. Tôi KHÔNG tìm được nguồn khẳng định theo chiều nào; không khẳng định có lỗi. Mock luôn đọc dữ liệu sống nên harness không thể tái hiện.

Hậu quả nếu có: đọc cũ trong khoá phá giả định "dữ liệu quyết định ghi luôn kiểm lại trong khoá" (luật 41), có thể đặt trùng slot. Mã cũ đặt SS_CACHE_ = null khi vào khoá có lẽ chính vì lý do này.

CLAUDE.md vừa thêm luật 53 (giữ file qua khoá) dựa trên giả định này; nên kiểm chứng trước khi coi là luật.

Sửa đề xuất: (1) thử trên STAGING: script A `openById`, đọc A1, `Utilities.sleep(20000)`, đọc lại A1 bằng cùng đối tượng; trong lúc A ngủ, chạy script B ghi A1 và `SpreadsheetApp.flush()`. A thấy giá trị mới thì giữ thiết kế 5I, ghi kết quả vào tài liệu. (2) Chưa thử được thì dung hoà: mở lại một lần ở mỗi khoá ngoài cùng (2 lần mỗi lượt đặt thay vì 4), không giữ qua ranh giới khoá.

### A6 THẤP · CALENDAR_NIGHTLY không có message_en

File: src/CalendarQueue.gs:403 đến 406. Tái hiện: `node notify_en.js` liệt kê đúng một lời gọi notify_ thiếu message_en. Hậu quả: trang quản trị ở chế độ EN hiện câu tiếng Việt (adminNotifView_ messageEn rỗng); email ADMIN_NOTICE phần tiếng Anh dùng lại câu tiếng Việt (Notifications.gs:109). Sửa: thêm message_en.

### A7 THẤP · Chữ một thứ tiếng còn gửi từ máy chủ

* Chi tiết nhật ký do code viết bằng tiếng Việt, hiện nguyên trong apiAdminLog, apiAdminLogEntry, apiAdminBooking (AdminApi.gs:304 đến 308): SHEET_EDIT "sửa N ô một lần (dán hoặc xoá vùng)", "đã sửa (không ghi giá trị)" (Admin.gs:117 đến 119); MAIL_TEST "gửi được, gửi lỗi, hạn mức" (Notify.gs:274); BACKUP_DONE "xoá N bản cũ" (Backup.gs:14); ARCHIVE_RECOVER (Archive.gs:176); PURGE_RECOVERED (Db.gs:338); MARKETING_TEST, MAIL_PREVIEW "gửi tới, lỗi" (Marketing.gs:255, Admin.gs:374); CONTENT_REFRESHED "cảnh báo" (Admin.gs:312).
* Lý do huỷ mặc định "Admin huỷ" (AdminApi.gs:268) lưu vào cancel_reason, gửi lại thành `cancelReason` cho trang quản trị và vào message_en của ADMIN_CANCELLED ("...: Admin huỷ").
* mailAdminError_ đặt message_en = 'System error · ' + subject tiếng Việt (Notify.gs:234), ví dụ "Lưu trữ BOOKINGS lỗi"; mẫu ADMIN_ERROR dùng {{subject}} ở cả hai nửa.
* bookingViewForStudent_ vẫn gửi `label: fmtDayVi_` và `statusText` tiếng Việt (Api.gs:327, 330); Student.html:39 dùng statusText khi thiếu key, nên một trạng thái không có key st.* sẽ hiện tiếng Việt ở chế độ EN. Booking.gs:237 cũng còn `label: fmtDayVi_`.

Sửa đề xuất: detail ghi mã và số (JSON), trình duyệt dựng câu bằng key ad.det.*; lý do huỷ mặc định để trống và trình duyệt hiện nhãn; bỏ label, statusText khỏi phản hồi cổng (giảm dung lượng, đúng luật 33).

### A8 THẤP · Job chạy bằng trigger ghi nhật ký dưới email admin

File: src/Log.gs:22 đến 24, src/Backup.gs:14, src/Admin.gs:77 đến 83.

logMenu_ luôn dùng adminActor_(e): không có e.user thì lấy Session.getActiveUser(). Google: trong trigger cài đặt, getEffectiveUser "returns the account of the user who created the trigger"; getActiveUser không nói rõ, thường trùng (developers.google.com/apps-script/reference/base/session).

Tái hiện (r2_misc.js): nightlyBackup gọi như trigger: BACKUP_DONE actor = booking@thaiput.vn, logIsSystem_ = false. Trên trang nhật ký, lọc "Hệ thống" không thấy sao lưu đêm; lọc "Người" lại có, như admin tự bấm lúc 02:00.

Sửa: logMenu_ nhận cờ; với `isProjectTriggerEvent_(e)` và không có `e.range` thì actor 'SYSTEM'.

### A9 THẤP · Phân trang nhật ký theo số hàng

File: src/AdminApi.gs:316 đến 331 (`before` là số hàng).

Tái hiện (r3_logpage.js): 40 dòng cũ ở đầu tab và 150 dòng mới; trang 1 lấy 100 dòng; job lưu trữ chuyển 40 dòng cũ (các hàng dời lên 40); trang 2 với `before` cũ trả 90 dòng, trong đó 40 dòng trùng trang 1. Admin sắp xếp tab ngược lại (đã có test I107) thì "Xem thêm" có thể sót dòng. Thứ tự "mới nhất trước" cũng giả định tab theo thời gian.

Sửa: con trỏ theo (ts, row) và lọc `ts < ts_cuối || (ts == ts_cuối && khác dòng đã thấy)`, sắp xếp theo ts thay vì theo hàng.

### A10 THẤP · Mất dòng PURGE_RECOVERED của chính ACTIVITY_LOG

File: src/Db.gs:264 đến 266, 296 đến 298, 333 đến 338.

Cơ chế: purgeRows_('ACTIVITY_LOG') gọi flushDb_, rồi purgeRecover_ xoá DB_CACHE_ và ghi PURGE_RECOVERED vào hàng chờ LOG_APPEND_; `table_(name)` chuyển dòng đó vào bảng thành dòng chờ ghi; cuối purgeRows_ đặt `t.pending = []` nên dòng mất, đồng thời `t.lastRow` tăng 1 cho một dòng không tồn tại (lần insert sau trong cùng khoá để lại một hàng trống). Kiểu lỗi này có từ 5G; 5I làm purgeRows_ ACTIVITY_LOG chạy mỗi đêm.

Tái hiện (r4_recover_log.js): đặt mốc PURGE_OPEN_ACTIVITY_LOG kiểu "chưa ghi", chạy purgeRows_: mốc được dọn nhưng không có dòng PURGE_RECOVERED. Cùng kịch bản với MAIL_LOG thì có dòng.

Sửa: trong purgeRows_, giữ lại các dòng chờ của `t` có hàng lớn hơn `last` (dời số hàng theo bảng mới) thay vì bỏ; hoặc purgeRecover_ ghi nhật ký sau khi purgeRows_ xong.

### A11 THẤP · Chi tiết SHEET_EDIT thiếu hoặc sai

File: src/Admin.gs:115 đến 128.

* Sửa nhiều ô (dán, xoá vùng, kéo điền): chỉ ghi "sửa N ô", không giá trị nào. Admin dán đè 20 dòng BOOKINGS không biết đã đổi gì.
* Google: oldValue "Only available if the edited range is a single cell", và không có khi ô trước đó trống (developers.google.com/apps-script/guides/triggers/events). Code không phân biệt "ô trống" với "không có thông tin": khi dán đè 1 ô (theo nhiều báo cáo cộng đồng thì e.oldValue và e.value không có, CHƯA kiểm chứng trên Google thật), nhật ký ghi `"" → "Vân"` như thể ô cũ trống (r5_onedit_cost.js in ra đúng câu này).

Sửa: vùng tối đa khoảng 20 ô thì ghi giá trị mới đọc từ `r.getValues()`; khi cả `e.value` và `e.oldValue` không có thì ghi "giá trị cũ: không rõ".

### A12 THẤP · Thao tác đổi trạng thái chưa ghi nhật ký

* switchToProduction (Setup.gs:22 đến 34): đổi ENV, đổi DB_ID, khoá ALLOW_DATA_RESET qua table_.update, không có dòng nhật ký riêng (chỉ RELEASE nếu phiên bản đổi).
* setupFirstRun chạy từ trình soạn (không qua menuSetup, Admin.gs:392) không ghi SETUP_RUN.
* menuSimNow, menuClearSimNow (Admin.gs:387 đến 391), menuLoadTestOff (LoadTest.gs:198): đổi trạng thái STAGING, không ghi.
* Thao tác chỉ xem của admin trên web (xem hồ sơ, số điện thoại, nhật ký) không ghi; nếu "mọi activity" gồm cả "ai xem gì" thì còn thiếu (quét bằng menulog.js).

Sửa: thêm logMenu_ hoặc logActivity_ cho các hàm trên; quyết định với anh Chris có cần ghi lượt xem hay không.

### A13 THẤP · Hướng dẫn của menuMailTest

File: src/Notify.gs:266 đến 290.

* Email Log Search: đường chính thức là Admin console, Menu, Reporting (Báo cáo), Email Log Search; link thẳng admin.google.com/ac/emaillogsearch; cần quyền Gmail Settings administrator; "Search results are returned within 1 minute to 1 hour". Câu "Sau 5 phút vẫn không thấy" và kết luận "không có dòng nào (thư chưa rời Google)" có thể sai trong giờ đầu.
* Tên trạng thái "Đã gửi", "Bị trả lại", "Bị từ chối" không đối chiếu được với trang chính thức (trang ELS dẫn sang trang định nghĩa riêng).
* Check MX: trang chính thức mô tả công cụ để "find common misconfigurations in your MX DNS records"; câu "MX, SPF, DKIM, DMARC phải đạt" không có nguồn chính thức cho phần SPF, DKIM, DMARC.
* Thiếu bước có nguồn rõ nhất: DKIM của Workspace phải tự bật (Apps, Google Workspace, Gmail, Authenticate email; chờ 24 đến 72 giờ mới lấy được khoá, tới 48 giờ mới có hiệu lực).
* Mã thư và giờ dùng getNow_ (Notify.gs:267, 270): trên STAGING bật SIM_NOW thì mã và giờ là giờ giả lập, admin tìm trong ELS theo giờ đó sẽ không thấy. Nên dùng realNowMs_ (chẩn đoán theo đồng hồ thật).

### A14 THẤP · Điều kiện tăng hạn mức ghi chưa đủ

File: src/Notify.gs:250 đến 258, CLAUDE.md luật 12. Code ghi "Tự tăng khi tổ chức đã trả tổng cộng 100 USD và qua 60 ngày". Nguồn: Apps Script "After you convert from a free trial account to a paid subscription, your account limits automatically increase when" đủ hai điều kiện (đã trả tổng cộng 100 USD; ít nhất 60 ngày kể từ khi đạt mốc). Trang Gmail sending limits: "limits aren't increased during the free trial period", và "can take up to 75 days after meeting this payment threshold". Sửa câu: thêm "sau khi chuyển từ dùng thử sang trả phí", "60 ngày (Google có chỗ ghi tới 75 ngày)".

### A15 THẤP (chưa tái hiện trên Google thật) · appendRowsRaw_ ghi đè cột admin tự thêm

File: src/Db.gs:369 đến 374. appendRowsRaw_ ghi đủ `getLastColumn()` cột theo tiêu đề thật, cột không thuộc SCHEMA nhận ''. DbTable trước 5I chỉ ghi tới cột cuối của SCHEMA. Nếu admin thêm cột phụ có ARRAYFORMULA ở hàng tiêu đề tab ACTIVITY_LOG hay MAIL_LOG, ô '' chặn mảng tràn xuống (lỗi #REF). Sửa: chỉ ghi tới cột cuối thuộc SCHEMA (như DbTable.width).

### A16 THẤP · Viết lại cả tab ACTIVITY_LOG mỗi đêm trong khoá

File: src/Archive.gs:39 đến 43 (mốc theo ngày), src/Db.gs:292 (setValues mọi dòng giữ lại). Trước 5I ACTIVITY_LOG chỉ có việc một ngày mỗi tháng; nay mỗi đêm đọc cả tab hai lần (archiveTabInLock_ và purgeRows_), viết lại khoảng 60 ngày dòng, mở file lưu trữ, flush, trong một khoá. Lượt đặt lúc đó nhận "bận"; SHEET_EDIT mất (A3). Chưa đo được trên Google thật. Sửa gợi ý: chạy ACTIVITY_LOG mỗi tuần, hoặc chỉ khi số dòng quá hạn vượt một ngưỡng (ví dụ 2.000).

## Đã kiểm, không thấy lỗi

* Config.gs: mọi nơi ghi ENV, DB_ID (switchToProduction, setupCore_) gọi forgetEnvMemo_ ngay sau; dbSpreadsheet_ so SS_CACHE_ID_ với getDbId_ nên đổi DB thì mở lại.
* logAppend_, flushLogAppend_, table_: thứ tự dòng giữ đúng khi tab được đọc giữa chừng trong cùng khoá; lỗi ở flushLogAppend_ không làm mất hàng chờ của tab còn lại (flushDb_ ở finally chạy lại). Chống chèn công thức khi ghi thêm (safeCellText_ cột không phải text) đúng; cột text được đặt '@' trước khi ghi.
* onEdit không tự lặp: dòng do script ghi không kích trigger ("Script executions and API requests don't cause triggers to run", trang installable triggers); tab nhật ký bị bỏ qua.
* Bộ đệm CONTENT sau khi thêm 251 key ad.*: 28.856 byte (vi) và 24.950 byte (en), dưới giới hạn 100KB mỗi giá trị (size.js).
* Mọi hành động ghi nhật ký đều có key ad.act.* (actkeys.js).
* Marketing chống gửi trùng dựa vào MAIL_LOG kind MKT:<mã>, không dựa vào ACTIVITY_LOG; báo cáo tháng không đọc ACTIVITY_LOG (mốc ARCH_CUTOFF chỉ có BOOKINGS, MAIL_LOG). Lưu trữ 60 ngày theo nửa đêm giờ Asia/Ho_Chi_Minh, apiAdminLog dùng cùng mốc.
* apiSetLanguage (thay đổi mới): admin không bị chặn; học viên, tutor ở READONLY nhận MAINT_READONLY, không ghi Sheets.

## Mục 5 · Chẩn đoán có nguồn

(a) Workspace mà MailApp.getRemainingDailyQuota() báo 100
* Bảng Apps Script: 100 người nhận mỗi ngày (tài khoản thường), 1.500 (Workspace); "Additional limits apply for trial accounts". Google không ghi con số của tài khoản dùng thử trong bảng; con số 100 khớp nhiều báo cáo cộng đồng (bài Zenn 18/07/2023 thấy còn 100; diễn đàn Google Developer 23/01/2026: tài khoản Workspace mới, kể cả nonprofit, bắt đầu 100 mỗi ngày).
* Điều kiện tăng (Apps Script): chuyển từ dùng thử sang trả phí, rồi tự tăng khi đủ hai điều kiện: tên miền đã trả tổng cộng ít nhất 100 USD, và ít nhất 60 ngày kể từ khi đạt mốc đó. Trang Gmail sending limits nói việc tăng "can take up to 75 days after meeting this payment threshold" và không tăng trong thời gian dùng thử. Vậy: 100 USD; 60 ngày theo Apps Script, có thể tới 75 ngày theo trang Gmail.
* Business Starter dùng thử: không tìm thấy giới hạn riêng cho Business Starter trong tài liệu chính thức; trang Gmail ghi 500 mỗi ngày cho tài khoản dùng thử (giới hạn Gmail, không phải MailApp). Lưu ý: theo một câu trả lời được chấp nhận trên cộng đồng Workspace, gói Workspace Individual không bao giờ được hạn mức Apps Script cao hơn; Business Starter là gói Business nên theo cột Workspace.
* Hạn mức đặt lại "24 hours after the first request" (Apps Script); Gmail tính 24 giờ trượt.

(b) Hạn mức bị trừ mà người nhận không thấy thư
* Hạn mức tính khi Google nhận thư để gửi, không phải khi thư vào hộp thư (Apps Script đếm người nhận).
* Thiếu xác thực tên miền: Gmail yêu cầu mọi người gửi tới tài khoản Gmail cá nhân "Set up SPF or DKIM"; thư không xác thực "might be marked as spam or rejected with a 5.7.26 error" (support.google.com/mail/answer/81126). DKIM của Workspace phải tự bật ở Admin console: Apps, Google Workspace, Gmail, Authenticate email (chờ 24 đến 72 giờ sau khi bật Gmail mới lấy được khoá; tới 48 giờ để có hiệu lực).
* Thư bị trả lại (địa chỉ sai): thư báo lỗi về hộp thư người gửi; vẫn đã trừ hạn mức.
* Email Log Search: Admin console, Menu, Reporting, Email Log Search (admin.google.com/ac/emaillogsearch), cần quyền Gmail Settings administrator; tìm tuỳ chọn trong 30 ngày; kết quả có thể mất 1 phút đến 1 giờ.
* Google Admin Toolbox Check MX: https://toolbox.googleapps.com/apps/checkmx/ ; trang chính thức mô tả công cụ tìm cấu hình sai của bản ghi MX. Phần kiểm SPF, DKIM, DMARC: chưa tìm thấy nguồn chính thức. Với một thư đã tới, công cụ Messageheader của Toolbox phân tích tiêu đề thư để tìm lỗi chuyển thư.

(c) Gmail API (dịch vụ nâng cao)
* Trang quota Apps Script ghi "Email recipients per day (for example, with MailApp)" và không nhắc Gmail API. Không tìm thấy nguồn chính thức xác nhận thư gửi bằng Gmail API có trừ vào MailApp.getRemainingDailyQuota() hay không: CHƯA KIỂM CHỨNG.
* Gmail API có hạn mức riêng: users.messages.send tốn 100 đơn vị, mỗi người dùng tối đa 6.000 đơn vị mỗi phút cho mỗi Cloud project (developers.google.com/workspace/gmail/api/reference/quota). Giới hạn gửi của tài khoản Gmail vẫn áp dụng: 500 người nhận mỗi thư khi gửi qua Gmail API, giới hạn ngày theo trang Gmail sending limits (dùng thử 500), không tăng trong thời gian dùng thử. Đổi sang Gmail API không vượt được giới hạn của tài khoản dùng thử, và không sửa được lỗi xác thực ở (b); còn phải đổi luật 19.

(d) Web app trên Workspace và link /a/macros/<tên miền>/
* Không tìm thấy nguồn chính thức hay đo đạc nào nói web app Apps Script trên Workspace chậm hơn trên Gmail thường.
* Link /a/macros/<tên miền>/s/.../exec với người ngoài tổ chức: không tìm thấy nguồn chính thức. Vấn đề có thật đã ghi nhận: người dùng đăng nhập nhiều tài khoản Google bị chuyển hướng tới /u/1 và gặp 404 (nhóm google-apps-script-community, 2020, còn báo năm 2023; cách vòng năm 2024 thêm /a/~/ trước macros, chưa chính thức). Nên thử trên cửa sổ ẩn danh bằng Gmail ngoài tổ chức và bằng trình duyệt đăng nhập 2 tài khoản trước khi phát hành. Ngoài ra, trang web app chính thức ghi web app nhúng chỉ chạy khi "the permissions set by the web app owner and the domain administrator allow its use".

Nguồn:
* https://developers.google.com/apps-script/guides/services/quotas
* https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace
* https://zenn.dev/gas/articles/7b8bf039ff0186
* https://discuss.google.dev/t/apps-script-email-sending-limits-problem/323472
* https://community.looker.com/gc/Workspace-Q-A/Apps-Script-Quota-Limit/td-p/547869
* https://knowledge.workspace.google.com/admin/support/troubleshooting/find-messages-with-email-log-search
* https://knowledge.workspace.google.com/admin/support/troubleshooting/google-workspace-diagnostic-tools
* https://knowledge.workspace.google.com/admin/security/set-up-dkim
* https://support.google.com/mail/answer/81126
* https://developers.google.com/workspace/gmail/api/reference/quota
* https://groups.google.com/g/google-apps-script-community/c/1xrlqlkGEQ0
* https://developers.google.com/apps-script/guides/web
* https://developers.google.com/apps-script/guides/support/best-practices
* https://developers.google.com/apps-script/guides/triggers/installable
* https://developers.google.com/apps-script/guides/triggers/events
* https://developers.google.com/apps-script/reference/base/session

<!-- END FILE: v8/reports/SOAT_5I_R1_MAYCHU.md -->

---

## `v8/reports/SOAT_5I_R1_GIAODIEN.md`

*Ngày tạo trong Project: 2026-10-18T14:59:31Z*

<!-- BEGIN FILE: v8/reports/SOAT_5I_R1_GIAODIEN.md | bytes=21485 | sha256=df439dc313c320b2cd7313ac941ef381198126e496e82fa1d2ddaf05a2965161 | created=2026-10-18T14:59:31Z -->
# Soát chunk 5I, vòng 1, giao diện (reviewer B)

Ngày 18/10/2026. Phạm vi: src/ui/Admin.html, App.html, Login.html, Home.html, Student.html, Styles.html, demo/demo_mock.js (bản có BK000096 hôm nay và nhật ký mẫu), demo/thaiput_demo.html đã dựng lại. Chỉ đọc và chạy thử, không sửa file nào trong src/, test/, dist/, demo/.

## Cách soát

1. `node test/harness.js`: xanh (26/26, 40/40, 108/108, giao diện 42/42, thử tải 2/2).
2. Quét tĩnh: mọi chuỗi có chữ trong src/ui/*.html (script quét `/tmp/claude-0/review_b/scan.js`); đối chiếu key `L('...')` của Admin.html với `contentDefaults_()`, biến `{..}` giữa vi và en, họ nhãn động (`ad.st.*`, `ad.pkg.*`, `ad.us.*`, `ad.ev.*` với DEFAULT_NOTIFY_RULES_, `ad.act.*` với mọi hành động `logActivity_` và `logMenu_` trong src) (script `/tmp/claude-0/review_b/keys.js`).
3. Bấm thử bằng jsdom trên máy chủ thật của harness (`/tmp/claude-0/review_b/lib.js` nạp `open`, `uiLoginEmail`, `adminFixture` từ test/ui.js; kịch bản `r1.js` đến `r7.js`).
4. Playwright Chromium mở demo/thaiput_demo.html qua file:// ở 360, 375, 390, 400, 900, 1024, 1280px (`pw1.js` đến `pw4.js`, ảnh trong `/tmp/claude-0/review_b/shots/`). Bấm lần lượt mọi nút admin của demo: 6 ô số liệu, mọi dòng thông báo và mọi nút trong hộp chi tiết, mọi dòng nhật ký và nút trong hộp đọc đủ, lọc Người dùng / Hệ thống, tìm, 3 tutor, 3 học viên, thoát thiết bị, đặt thay, huỷ.

Lưu ý: trong lúc soát có một lượt thử phá chạy song song đổi tạm src/Notifications.gs, src/AdminApi.gs, src/ui/Admin.html, src/ui/App.html (khoảng 14:54 đến 15:06). Mọi kịch bản dưới đây đã chạy lại sau khi các file trở về bản gốc (Admin.html md5 474934c4...). Một quan sát lúc file đang bị đổi (thông báo mất câu tiếng Anh) đã bị loại vì không tái hiện trên bản gốc.

## Điểm đạt

1. Không còn chữ viết cứng trong Admin.html: mọi chữ qua `L()`; 125 key tĩnh đều có mặc định; biến `{..}` của mọi key khớp giữa vi và en; mọi hành động ghi nhật ký trong src đều có nhãn `ad.act.*`; mọi sự kiện thông báo có nhãn `ad.ev.*`; đủ nhãn trạng thái buổi, gói, tài khoản.
2. Thoát chữ HTML: chèn `<img onerror>` vào tên học viên, ghi chú, nội dung thông báo, người làm, mã sự kiện, mã hành động, chi tiết nhật ký, link `javascript:`; đi qua thông báo, hộp chi tiết, trang học viên, đặt thay, danh sách buổi, nhật ký, hộp đọc đủ: không tạo phần tử nào, link lạ bị bỏ (`r2.js`).
3. Demo: bấm toàn bộ nút admin ở 390 và 1280px không có lỗi JavaScript nào; mọi nút trong hộp thông báo, hộp nhật ký mở đúng buổi, đúng người.
4. Không tràn ngang ở 360 đến 1280px trên mọi trang con admin (scrollWidth bằng innerWidth); thanh tab không che dòng cuối.
5. Đổi ngôn ngữ ở trang Thông báo, Tutor, Học viên, trang người, đặt thay (giữ giờ đã chọn), nhật ký (giữ chữ đang tìm và danh sách đã Xem thêm) không gọi lại máy chủ khi dữ liệu đã có; đang ghi hoặc đang mở hộp thoại thì không vẽ lại.
6. Nhật ký Xem thêm: 320 dòng, lọc Hệ thống, có dòng mới ghi giữa hai lần bấm: 160 dòng, không trùng, không sót (`r6.js`).

## Phát hiện

### B1 · VỪA · Trang người về muộn đè lên tab khác
- File: src/ui/Admin.html:287 đến 301 (dòng 299 `drawPerson(T.$('#tab-body', root) || body, ...)` vẽ vào khung hiện tại, không kiểm `st.view` còn là người này không).
- Tái hiện (`r1.js`): tab Học viên, bấm S003, bấm ngay tab Nhật ký trước khi apiAdminPerson trả. Kết quả: tab Nhật ký sáng, nhưng thân trang là trang học viên S003 (có nút Đặt thay), không có ô tìm nhật ký. Bấm EN thì trang nhảy sang Nhật ký.
- Hậu quả: vẽ sai trang so với tab đang chọn; bấm hai người liên tiếp mà lượt trả về đảo thứ tự thì hiện người cũ trong khi `st.view` là người mới (đổi ngôn ngữ lại nhảy sang người kia). Trên Apps Script thật apiAdminPerson mất 1 đến 3 giây nên dễ gặp.
- Sửa: giữ biến `v = st.view` lúc mở; khi kết quả về chỉ vẽ nếu `st.view === v` (như openBookFor đã làm), không thì chỉ lưu `v.data`.

### B2 · VỪA · Huỷ xong thì danh sách buổi đè lên trang đã rời đi; ô số liệu không cập nhật
- File: src/ui/Admin.html:241 (hàm tải lại `drawLessons(T.$('#tab-body', root), ...)` không kiểm trang đang mở), 359 (`after()` chạy khi huỷ xong); tương tự 337 (`openPerson` sau khi huỷ ở trang người kéo admin quay về trang người dù đã rời đi).
- Tái hiện (`r1.js` phần R3): bấm ô Buổi hôm nay, bấm Huỷ một buổi, xác nhận, bấm ngay Quay lại (về Thông báo). Khi huỷ xong: thân trang thành "Buổi hôm nay (1)" trong khi tab Thông báo vẫn sáng; ô "Buổi hôm nay" vẫn ghi 2; bấm EN thì trang lại thành Notifications.
- Hậu quả: vẽ sai trang, số trên ô số liệu lệch với danh sách vừa hiện. Huỷ mất vài giây (Calendar, email) nên admin rất hay bấm đi chỗ khác.
- Sửa: hàm tải lại chỉ chạy khi `st.view` vẫn là danh sách đó (so sánh đối tượng view); sau khi huỷ, giảm `st.home.counts.lessonsToday` hoặc gọi lại apiAdminHome rồi vẽ lại ô số liệu.

### B3 · VỪA · Tìm nhật ký theo chữ đang hiện không ra kết quả
- File: src/AdminApi.gs:325 (máy chủ chỉ tìm trong mã thô actor, action, entity, entity_id, detail); src/ui/Admin.html:449 (trang hiện nhãn đã dịch `actLabel`), 457 và src/Content.gs:375 (`ad.log_search` mời "Tìm ... hành động").
- Tái hiện (`r7.js`): tab Nhật ký tiếng Việt hiện các dòng "Đặt buổi", "Đăng nhập", "Đổi ngôn ngữ". Gõ "Đặt buổi": 0 dòng; "Đăng nhập": 0; "Đổi ngôn ngữ": 0; gõ mã "BOOKED": 2 dòng. Tiếng Anh cũng vậy với nhãn không trùng mã (ví dụ "Signed in" so với LOGIN, "Slots opened" so với AVAIL_OPEN). Gõ "Hệ thống" cũng 0 dòng.
- Hậu quả: song ngữ nửa mùa đúng ở chỗ người dùng nhìn: chữ trên màn hình không tìm được, phải biết mã nội bộ.
- Sửa: trình duyệt tìm các mã có nhãn (vi hoặc en) chứa chữ gõ, gửi thêm `acts: [...]` cho apiAdminLog; máy chủ khớp nếu action thuộc danh sách hoặc chữ thô chứa chữ gõ. Có thể làm tương tự cho "Hệ thống" / "System" (khớp actor SYSTEM hoặc trống).

### B4 · VỪA · Lý do huỷ do hệ thống ghi chỉ có tiếng Việt, trang tiếng Anh hiện thẳng
- File: src/ui/Admin.html:372 (`L('cancel_reason_x', { r: b.cancelReason })`); nguồn chữ: src/Booking.gs:172 ('Học viên huỷ'), src/Availability.gs:122 và 146 ('Tutor huỷ, ...'), src/AdminOps.gs:50 và src/AdminApi.gs:268 ('Admin huỷ' khi ô lý do để trống).
- Tái hiện (`r4.js`): học viên huỷ một buổi; admin chọn EN, mở thông báo, bấm View lesson. Hộp hiện "Cancelled by student ... Cancel reason: Học viên huỷ".
- Hậu quả: đúng loại lỗi "chữ máy chủ gửi một thứ tiếng mà trang hiện thẳng". Admin xoá trống ô lý do khi đang ở EN cũng ra chữ tiếng Việt 'Admin huỷ' trong câu thông báo tiếng Anh.
- Sửa: lý do hệ thống ghi bằng mã (ví dụ `SYS:STUDENT`, `SYS:TUTOR_NO_SUB`) hoặc trình duyệt nhận diện các câu cố định và dịch qua key `ad.reason.*`; lý do admin tự gõ giữ nguyên. Máy chủ dùng `contentText_('ad.cancel_reason_default', null, lang)` thay chữ cứng.

### B5 · VỪA · Ô số liệu tiếng Anh bị cắt chữ ở điện thoại 360 đến 375px
- File: src/ui/Styles.html:247 (`.kpi span` có `overflow: hidden; text-overflow: ellipsis` trong lưới 3 cột), src/Content.gs:256 (`ad.kpi.regs` en "Registrations to approve").
- Tái hiện (`pw2.js`, ảnh `shots/feed_en_360.png`): demo, Admin, bấm EN ở 360 và 375px: ô thứ 3 hiện "Registrati… to approve ↗" (từ Registrations không vừa một dòng nên bị cắt). 390px trở lên không cắt. Đo bằng phông dự phòng; phông thật Be Vietnam Pro rộng hơn nên còn dễ cắt hơn (chưa tái hiện với phông thật vì máy soát không có mạng).
- Hậu quả: chữ chính ở màn hình đầu của admin tiếng Anh bị cắt trên các điện thoại Android phổ biến nhất.
- Sửa: thêm `overflow-wrap: anywhere` hoặc `hyphens: auto` cho `.kpi span`, bỏ `overflow: hidden`; hoặc đổi chữ ngắn hơn ("Sign ups to approve", "New sign ups"). Nên kiểm cả thanh lọc mức (`.seg`, ở 360px đo 327/327, vừa khít; phông thật có thể tràn và nút Info / Thông tin bị khuất trong vùng cuộn ngang ẩn thanh cuộn).

### B6 · THẤP · Đọc thông báo rồi đi xem buổi học: ô số liệu, số trên tab và danh sách Chưa đọc không cập nhật
- File: src/ui/Admin.html:198 đến 210 (`afterRead` chỉ chạy khi bấm Đóng; nhánh `booking` không gọi).
- Tái hiện (`r3.js` phần R4): thông báo Khẩn chưa đọc, bấm dòng, bấm "Xem buổi học BK000001", đóng hộp buổi học. Máy chủ đã ghi đã đọc, nhưng ô Khẩn vẫn 1, số trên tab vẫn 2, dòng vẫn nằm trong danh sách Chưa đọc. Bấm EN thì ô thành 0 mà dòng vẫn còn.
- Sửa: gọi `afterRead(n)` cả khi chọn nút khác Đóng (sau khi hộp con đóng), hoặc cập nhật ô số liệu và bỏ dòng ngay khi đánh dấu đọc.

### B7 · THẤP · Mở trang lỗi rồi bấm VI | EN thì kẹt khung đang tải mãi
- File: src/ui/Admin.html:41 (`if (!st.home) { ... T.skeleton(3); return; }`), 28.
- Tái hiện (`r3.js` phần R5): apiAdminHome hỏng cả 4 lần thử (mất mạng). Trang báo "Không kết nối được...". Bấm EN: câu báo biến mất, thay bằng 3 khung xám đứng yên, không gọi lại máy chủ, không có nút thử lại.
- Sửa: lưu lỗi cuối (`st.err`); relabel khi `!st.home` mà không có lượt đang tải thì vẽ lại câu báo theo ngôn ngữ mới kèm nút Thử lại (gọi `render`).

### B8 · THẤP · Đổi ngôn ngữ lúc trang con đang tải gọi máy chủ lần hai
- File: src/ui/Admin.html:219 (view danh sách buổi: `drawLessons(..., null)` gọi lại), 289 (view người: `openPerson` gọi lại).
- Tái hiện (`r3.js` phần R6): bấm ô Buổi hôm nay rồi bấm EN ngay: apiAdminLessons gọi 2 lần; bấm một học viên rồi EN ngay: apiAdminPerson gọi 2 lần. Lượt đầu vẽ vào khung đã bị thay (vô hại).
- Hậu quả: trái tinh thần luật 50 (đổi ngôn ngữ không gọi lại máy chủ); không sai dữ liệu.
- Sửa: view giữ cờ `loading`; relabel lúc đang tải chỉ vẽ khung chờ, để lượt đầu vẽ khi về (kết hợp sửa B1).

### B9 · THẤP · Tiếng Anh sai số nhiều: "1 lessons", "1 devices"
- File: src/Content.gs:304 (`ad.left_n` "{n} lessons left"), 331 (`ad.kicked_n` "Signed out {n} devices"), 361 (`ad.free_n`), 365 (`ad.tutor_load`), 366 (`ad.book_n` "Book {n} lessons"), 368 (`ad.booked_n`), 272 (`ad.read_n`), 300 (`ad.tutor_line`).
- Tái hiện: demo EN, tab Students: "Trial, 2 lessons (Active, ends 23/10, 1 lessons left)" (ảnh `shots/students_en_900.png`); trang học viên, Sign out everywhere: "Signed out 1 devices"; đặt thay chọn 1 giờ: nút "Book 1 lessons" (test U39 còn khẳng định đúng chữ này).
- Sửa: dùng "lesson(s)" như `s.res_title_ok`, hoặc thêm key `_one` và chọn theo n ở `L()`.

### B10 · THẤP · Mã thô còn hiện trên trang đã dịch
- File: src/ui/Admin.html:206 (hộp chi tiết thông báo hiện `n.actor` nguyên văn: "SYSTEM"), 501 (hộp đọc đủ nhật ký: `l.actor || L('system')` nên actor 'SYSTEM' hiện "SYSTEM" trong khi dòng xem trước hiện "Hệ thống"), 56 (hành động MAINTENANCE_OFF, READONLY, CLOSED hiện "Bảo trì: READONLY").
- Sửa: dùng `actorShort`/`L('system')` cho actor SYSTEM ở cả hai hộp; thêm nhãn `ad.maint.OFF|READONLY|CLOSED`.

### B11 · THẤP · Câu hướng dẫn chứa tên khoá cấu hình thay cho con số
- File: src/Content.gs:294 (`ad.waiting_note`: "Quá AUTO_COMPLETE_AFTER_HOURS giờ, hệ thống tự chuyển Hoàn thành").
- Tái hiện: ô "Chờ tutor xác nhận", dòng ghi chú hiện nguyên tên khoá (test U38 còn khẳng định chữ này).
- Sửa: máy chủ gửi `autoCompleteHours` trong apiAdminLessons (hoặc apiAdminHome), câu dùng biến `{hours}`.

### B12 · THẤP · Tiêu đề trang chỉ có tiếng Việt
- File: src/ui/Index.html:7, src/Api.gs:19 (`setTitle(... ' · Đặt lịch luyện nói 1:1')`); không chỗ nào đổi `document.title` theo ngôn ngữ.
- Hậu quả: mở thẳng link web app (không qua Google Sites) ở EN, thẻ trình duyệt vẫn tiếng Việt. Trong Google Sites không thấy.
- Sửa: tiêu đề song ngữ cố định ("thaiput · Đặt lịch / Booking") hoặc key `a.page_title` và gán `document.title` trong `setLang` (lưu ý HtmlService có thể bỏ qua đổi tiêu đề trong khung iframe).

### B13 · THẤP · Trình độ trong tab Tài khoản của học viên hiện tiếng Việt ở EN
- File: src/ui/Student.html:208 (ô chữ tự do hiện `p.level` nguyên văn).
- Tái hiện: học viên đăng ký chọn "Elementary" (lưu "Sơ cấp"); chọn EN, tab Account: ô Level hiện "Sơ cấp". Gõ đè "Beginner" thì Tutor.html:28 không còn dịch được (giá trị lạ hiện nguyên văn).
- Sửa: dùng `<select>` như form đăng ký (`levelOptions`, giá trị luôn bản tiếng Việt), giữ giá trị lạ làm một lựa chọn.

### B14 · THẤP · Admin đăng nhập bằng Google không được hỏi ngôn ngữ
- File: src/ui/Login.html:94 (`T.signedIn(r.data, false)`).
- Hậu quả: đúng chữ luật 50 (bản CLAUDE.md cập nhật trong lúc soát: chỉ đăng nhập bằng link mới hỏi), nhưng đường đăng nhập chính của admin là Google (5D), nên trên thực tế admin gần như không bao giờ được hỏi; USERS.lang của admin để trống tới khi bấm VI | EN, trang theo ngôn ngữ còn lưu trên máy (có thể của người khác dùng chung máy).
- Sửa: cho gauth hỏi khi `d.lang` trống (`ask = true`); hoặc giữ như cũ và ghi rõ quyết định này trong CHUNK5I_GIAI_THICH.

### B15 · THẤP · Bàn phím: mất chỗ đứng sau hộp thoại và sau khi vẽ lại
- File: src/ui/App.html:268 đến 283 (`T.sheet` không trả focus về nút đã mở hộp, không đóng bằng Esc, không giữ focus trong hộp), src/ui/Admin.html:140 (nhóm `.seg` không có `aria-label`), 125 (tab vẫn `aria-current="page"` khi đang ở trang con dù không sáng).
- Tái hiện (`r4.js`): mở thông báo bằng bàn phím rồi Close: `document.activeElement` là BODY; phải Tab lại từ đầu trang. Bấm ô số liệu hoặc nút lọc cũng mất focus vì cả khung vẽ lại.
- Sửa: `T.sheet` nhớ `document.activeElement` và trả focus khi đóng, thêm Esc; đặt `aria-label` cho các nhóm lọc; sau `frame()` đưa focus về phần tử tương ứng (data-kpi, data-tab).

### B16 · THẤP · Ô số liệu thiếu link vẫn hiện mũi tên mở ra ngoài
- File: src/ui/Admin.html:94 (`href ? ' ↗' : ' ›'` dùng `href` thô, mà khi thiếu link frame truyền '-').
- Tái hiện: `rowLink_('REGISTRATIONS')` trả rỗng: ô thành nút (bấm hiện câu hướng dẫn, đúng) nhưng vẫn mang dấu ↗ như một link.
- Sửa: dùng `url` (đã qua `T.safeUrl`) thay `href` khi chọn dấu.

### B17 · THẤP · Thông báo nhiều mã hoặc đối tượng USER không có nút đi tới
- File: src/ui/Admin.html:194 đến 196.
- Tái hiện theo mã: AUTO_COMPLETED (entity BOOKING, entity_id "BK1,BK2,...") không có nút xem buổi nào; TUTOR_NO_AVAILABILITY (entity USER, entity_id "T001,T002", không điền tutor_id) chỉ có Đóng và link Sheets.
- Sửa: với BOOKING nhiều mã hiện tối đa 3 nút "Xem BKxxx"; với entity USER lấy mã từ entity_id làm nút xem người.

### B18 · THẤP · Số đếm nhật ký tính cả dòng mới mà danh sách không có cách xem
- File: src/AdminApi.gs:326 (`total++` trước khi lọc `before`), src/ui/Admin.html:473.
- Tái hiện (`r6.js`): có dòng mới ghi sau khi mở nhật ký; bấm Xem thêm tới hết: "160 dòng mới nhất / tổng 161", không còn nút Xem thêm, dòng mới chỉ thấy khi tải lại.
- Sửa: khi `total > items.length` mà `next = 0`, hiện nút "Tải lại" hoặc câu "Có n dòng mới".

### B19 · THẤP · Dữ liệu demo lệch dạng dữ liệu thật
- File: demo/demo_mock.js:59 (`fmt(add(now(), 0))`: `add` trả nửa đêm nên mọi thông báo hiện 00:00), 62 đến 64 (câu thông báo dùng ngày dạng 2026-10-19; máy chủ thật dùng `fmtDayVi_`, `fmtDayEn_` "Thứ 2 19/10" / "Mon 19/10"), 320 (`adminView` luôn là học viên S0001: thông báo nói Quốc Bảo huỷ BK000095 nhưng chi tiết BK000095 là Minh Anh, trạng thái Đã xác nhận và còn nút Huỷ), 200 (`note()` của tutor xác nhận kết quả không có `messageEn`: admin EN thấy câu tiếng Việt, máy chủ thật luôn có message_en), 252 (mã người lạ trả "Thu Hà" thay vì NOT_FOUND; Quốc Bảo trong danh sách có 1 buổi sắp tới nhưng trang người không có buổi nào); test/build_demo.js thanh điều khiển demo (Khách, Học viên, Làm mới dữ liệu, câu hướng dẫn đăng nhập) chỉ tiếng Việt.
- Hậu quả: người xem demo thấy giờ 00:00, câu lẫn ngày ISO, chi tiết buổi trái với thông báo; không ảnh hưởng bản thật.
- Sửa: `var t = fmt(now())`; dựng câu bằng nhãn ngày như máy chủ; lưu học viên cho từng buổi demo (BK000095 thuộc S0002, trạng thái CANCELLED_STUDENT); thêm `messageEn` cho mọi `note()`; trả `no('NOT_FOUND', ...)` với mã lạ.

## Chưa tái hiện, ghi để theo dõi

1. Thanh lọc mức thông báo ở 360px với phông thật có thể tràn (đo bằng phông dự phòng: vừa khít 327/327). Cần chụp lại trên máy có mạng.
2. Admin sắp xếp tab ACTIVITY_LOG giữa hai lần Xem thêm: con trỏ theo số hàng vẫn không trùng (mỗi hàng chỉ đi qua một lần), nhưng nhóm theo ngày sẽ lặp tiêu đề vì danh sách không còn theo thời gian. Không phải đường dùng thường.
3. Câu báo lỗi đã vẽ (hộp đỏ) giữ ngôn ngữ lúc nhận vì `r.message` được chọn khi trả về; các trang con vẽ lại bằng cách gọi lại nên không gặp, trừ trường hợp B7.

## Tóm tắt mức

| Mã | Mức | Một dòng |
|---|---|---|
| B1 | VỪA | Trang người về muộn đè lên tab khác hoặc người khác |
| B2 | VỪA | Huỷ xong thì danh sách buổi đè lên trang đã rời đi; ô số liệu không đổi |
| B3 | VỪA | Tìm nhật ký theo nhãn đang hiện (Đặt buổi, Đăng nhập, Hệ thống) ra 0 dòng |
| B4 | VỪA | Lý do huỷ hệ thống ghi tiếng Việt hiện thẳng trên trang EN |
| B5 | VỪA | Ô "Registrations to approve" bị cắt ở 360 đến 375px |
| B6 | THẤP | Đọc thông báo qua nút Xem buổi học: số đếm và danh sách Chưa đọc không cập nhật |
| B7 | THẤP | Trang lỗi rồi bấm VI / EN: kẹt khung đang tải, mất câu báo |
| B8 | THẤP | Đổi ngôn ngữ lúc trang con đang tải gọi máy chủ lần hai |
| B9 | THẤP | Tiếng Anh sai số nhiều: "1 lessons", "1 devices", "Book 1 lessons" |
| B10 | THẤP | "SYSTEM" và mã bảo trì thô trong hộp chi tiết |
| B11 | THẤP | Ghi chú hiện tên khoá AUTO_COMPLETE_AFTER_HOURS thay con số |
| B12 | THẤP | Tiêu đề trang chỉ tiếng Việt |
| B13 | THẤP | Trình độ trong tab Tài khoản học viên hiện tiếng Việt ở EN, ô chữ tự do |
| B14 | THẤP | Đăng nhập Google (đường chính của admin) không hỏi ngôn ngữ |
| B15 | THẤP | Bàn phím mất chỗ đứng sau hộp thoại và sau khi vẽ lại; thiếu nhãn nhóm lọc |
| B16 | THẤP | Ô số liệu thiếu link vẫn có dấu ↗ |
| B17 | THẤP | Thông báo nhiều mã buổi hoặc đối tượng USER không có nút đi tới |
| B18 | THẤP | Tổng nhật ký tính dòng mới nhưng không có cách xem nếu không tải lại |
| B19 | THẤP | Dữ liệu demo: giờ 00:00, ngày ISO, buổi sai học viên, thiếu câu tiếng Anh |

Không có phát hiện mức CAO: không có XSS, không gửi trùng, không lỗi JavaScript, mọi nút admin trong demo và trong jsdom đều bấm được và có tác dụng.

<!-- END FILE: v8/reports/SOAT_5I_R1_GIAODIEN.md -->

---

## `v8/reports/SOAT_5I_R2_MAYCHU.md`

*Ngày tạo trong Project: 2026-10-18T14:59:32Z*

<!-- BEGIN FILE: v8/reports/SOAT_5I_R2_MAYCHU.md | bytes=7473 | sha256=acda97c3c0428dfdcdbbccc73db054e356e263ef266b8b93b5baf07b4a22d371 | created=2026-10-18T14:59:32Z -->
# Soát 5I vòng 2 · Máy chủ

Ngày 18/10/2026. Phạm vi: src/*.gs và test/gas_mock.js. Người soát không sửa file nào trong repo. `node test/harness.js` chạy một lần: xanh (26/26, 40/40, 109/109, 43/43, 2/2). Script tái hiện: r1_queue.js (hàng chờ nhật ký), r2_purge_cols.js (purgeRows_), r3_logpage.js (phân trang nhật ký), r4_opens.js (số lần mở file, lấy khoá của một lượt API, onEdit, onChange), r5_mail.js (mailSentToday_), r6_dropdown.js (dropdown admin), notify_en.js và log_vi.js (quét tĩnh).

## 1. Đối chiếu A1 đến A16

| Mục | Kết luận | File:dòng | Ghi chú |
|---|---|---|---|
| A1 | ĐÃ SỬA (cột ngoài SCHEMA còn lỗi, N4) | Db.gs:273, 283 đến 287 | `plainCol` chỉ áp `safeCellText_` cho chuỗi; ngày, số, boolean, ô tick đi qua nguyên. "-5" và "+84901234567" vẫn là chữ. Cột công thức đi nhánh `fx` |
| A2 | SỬA CHƯA ĐỦ | Admin.gs:144 đến 151; Setup.gs:17 đến 19, 303 | Có trigger onChange, nhưng xoá tab ghi sai tên (N3); mỗi lần sửa ô thêm một lượt chạy (N7) |
| A3 | SỬA CHƯA ĐỦ | Log.gs:26 đến 49; Admin.gs:93 | Hàng chờ khi khoá bận mất hoặc trùng dòng và có trần dung lượng (N1). Một lần chọn dropdown "Huỷ bởi admin" lấy khoá 5 lần, mở file 5 lần |
| A4 | ĐÃ SỬA (STAGING còn sai, N6) | Notify.gs:246 đến 272 | 24 giờ trượt, bỏ địa chỉ thử tải, câu "ước tính" |
| A5 | ĐÃ SỬA | Db.gs:480 đến 482 | apiStudentBook mở file 3 lần, lấy khoá 2 lần (trước 5I: 4 lần mở) |
| A6 | ĐÃ SỬA | CalendarQueue.gs:403 đến 409 | 20/20 lời gọi notify_ có message_en |
| A7 | SỬA CHƯA ĐỦ | Archive.gs:177; Db.gs:347; Notify.gs:234; Api.gs:327, 330; Setup.gs:21 | N8 |
| A8 | ĐÃ SỬA | Log.gs:27 | |
| A9 | ĐÃ SỬA (lỗi biên, N2) | AdminApi.gs:324 đến 351 | |
| A10 | ĐÃ SỬA | Db.gs:303 đến 308 | |
| A11 | ĐÃ SỬA | Admin.gs:113 đến 135 | |
| A12 | ĐÃ SỬA | Setup.gs:21, 36; Admin.gs:412, 414; LoadTest.gs:198 | Detail SETUP_RUN tiếng Việt (gộp N8) |
| A13 | ĐÃ SỬA | Notify.gs:273 đến 297 | |
| A14 | ĐÃ SỬA | Notify.gs:265; CLAUDE.md luật 12 | |
| A15 | ĐÃ SỬA cho appendRowsRaw_ | Db.gs:379 đến 382 | purgeRows_ vẫn ghi đủ mọi cột (N4) |
| A16 | SỬA CHƯA ĐỦ | Archive.gs:162, 195 đến 198 | Ngưỡng 500 dòng ngược chiều tải (N9) |

## 2. Phát hiện mới

### N1 VỪA · Hàng chờ nhật ký `logq_v1`: mất dòng, trùng dòng, vượt 100KB thì mất dòng mới
Log.gs:29 đến 49; Db.gs:109 đến 115. (1) `drainLogQueue_` xoá khoá cache trước khi dòng tới Sheets; `flushLogAppend_` đặt `LOG_APPEND_[n] = []` trước `appendRowsRaw_`; Google từ chối lệnh ghi thì các dòng vừa rút mất hẳn. (2) Đã ghi mà lỗi sau đó (flush timeout): `catch` vẫn đưa dòng hiện tại vào hàng chờ, ghi lần hai. (3) `slice(-300)` giới hạn số dòng, không giới hạn byte; Google: 100KB mỗi khoá cache (developers.google.com/apps-script/reference/cache/cache). (4) Không nguyên tử: hai lượt cùng đọc, cùng ghi thì mất một dòng (lập luận). Tái hiện r1_queue.js: (a) Q1 chờ, ghi lỗi một lần, ghi Q2, Q3: tab có Q2, Q3, Q1 mất; (b) flush lỗi sau khi ghi: D1, D1, D2; (c) 80 dòng SHEET_EDIT dài: còn 77 dòng (102.247 byte). Sửa: mỗi dòng một khoá Script Properties `LOGQ_<ms>_<uuid>` (cắt chi tiết khoảng 1.500 byte); chỉ xoá khoá sau khi khoá ghi trả về thành công; chỉ đưa lại vào hàng chờ khi lỗi là khoá bận.

### N2 THẤP · "Xem thêm" lặp vô tận khi hơn 300 dòng cùng một mốc giờ
AdminApi.gs:328, 348. Con trỏ giữ tối đa 300 chữ ký ở mốc `beforeTs`; STAGING bật SIM_NOW thì mọi dòng cùng mốc. Tái hiện r3_logpage.js: 450 dòng cùng mốc, 12 lần bấm thấy 400 dòng, lặp 800 lần, không tới dòng hôm qua. Cùng gốc: `apiAdminLogEntry` tìm lại theo ts và action có thể mở nhầm dòng. Sửa: con trỏ (ts, chữ ký, số bản trùng), apiAdminLogEntry nhận thêm chữ ký.

### N3 THẤP · onChange xoá tab ghi sai tên tab
Admin.gs:146 đến 148. REMOVE_GRID: tab vừa xoá không còn nên không thể là tab đang mở; đổi tên chỉ còn tên mới. Lập luận từ mã, tài liệu chỉ ghi `source` là Spreadsheet. Sửa: lưu danh sách `sheetId:tên`, so khi INSERT_GRID, REMOVE_GRID, OTHER; tab hệ thống bị xoá thì báo Khẩn.

### N4 THẤP · purgeRows_ vẫn ghi đè cột admin tự thêm
Db.gs:268, 283 đến 287, 297. Cột ngoài SCHEMA: chữ có dấu nháy "=..." thành công thức. Tái hiện r2_purge_cols.js: cột `ghi_chu_admin` gõ `'=gọi lại sau`, purgeRows_ ghi công thức. Sửa: cột ngoài SCHEMA, ô không có công thức cũng `safeCellText_`. Nghi ngờ chưa tái hiện: ARRAYFORMULA làm getLastRow thành hàng cuối tab.

### N5 THẤP · mailTest_ ghi nhật ký bằng withLock_ 30 giây
Notify.gs:279 đến 281. Khoá bận thì menu báo "đang bận" sau khi thư đã gửi; bấm lại là gửi lần hai. Mẫu MAIL_TEST tắt thì báo "Google TỪ CHỐI thư", sai nguyên nhân. Sửa: dùng logMenu_; báo rõ mẫu đang tắt.

### N6 THẤP · mailSentToday_ trên STAGING đếm 0 khi bật SIM_NOW
Notify.gs:247: cửa sổ theo giờ thật, MAIL_LOG.time theo giờ giả lập. Tái hiện r5_mail.js. Sửa: bỏ ước tính khi SIM_NOW bật.

### N7 THẤP · onChangeInstallable kiểm quyền trước khi lọc changeType
Admin.gs:144 đến 145. Google gọi onChange cả với EDIT, FORMAT; `requireOperator_` gọi getProjectTriggers trước. Sửa: lọc trước.

### N8 THẤP · Còn chi tiết nhật ký và chữ một thứ tiếng
Archive.gs:177 ARCHIVE_RECOVER, Db.gs:347 PURGE_RECOVERED (A7 nêu đích danh, chưa sửa); Setup.gs:21 SETUP_RUN; Notify.gs:234 message_en của SYSTEM_ERROR ghép tiêu đề tiếng Việt; Api.gs:327, 330 `label`, `statusText`; chi tiết cũ Auth.gs:185, 348; Availability.gs:121; CalendarQueue.gs:119; CalendarSync.gs:228, 244; Release.gs:48. Sửa: JSON hoặc mã.

### N9 THẤP · Ngưỡng gom lưu trữ ACTIVITY_LOG ngược chiều tải
Archive.gs:162, 197. Trên khoảng 500 dòng mỗi ngày thì mỗi đêm lại viết lại cả tab (khoảng 30.000 dòng). Sửa: chỉ gom theo tuổi.

## 3. Độ trung thực của gas_mock.js (đánh dấu `_lit`)
Đúng với Google ở các nhánh code đang dùng. Lệch vô hại: `clearContent` không xoá `_lit`; ô '@' ghi `"'x"` giữ dấu nháy (code không dùng). "Tốt bụng" hơn Google (có từ trước): `autoParse` chỉ đổi số và 'HH:mm', Google còn đổi TRUE, FALSE, chuỗi dạng ngày. Ví dụ REPORT_REFRESHED ghi entity_id "2026-10" vào cột không phải text, Sheets thật có thể hiểu là ngày (nghi ngờ). Gợi ý: đưa `action`, `entity`, `entity_id` của ACTIVITY_LOG và `kind` của MAIL_LOG vào `text` (luật 22).

## 4. Đã kiểm, không thấy lỗi
Thứ tự ghi bù; logAppend_ và table_ không trùng dòng chờ; requireOperator_ với onChange thật (có triggerUid); apiAdminLogEntry kiểm quyền và tìm lại dòng; withLock_ chỉ mở lại ở khoá ngoài cùng; đối tượng Sheet lấy ngoài khoá vẫn dùng được.

<!-- END FILE: v8/reports/SOAT_5I_R2_MAYCHU.md -->

---

## `v8/reports/SOAT_5I_R2_GIAODIEN.md`

*Ngày tạo trong Project: 2026-10-18T14:59:33Z*

<!-- BEGIN FILE: v8/reports/SOAT_5I_R2_GIAODIEN.md | bytes=6848 | sha256=fc4d418ee4683a3632efbed9230bb2b17f8e9960ba7b7cf0006bd26b802b45c6 | created=2026-10-18T14:59:33Z -->
# Soát 5I vòng 2 · Giao diện và tài liệu

Ngày 18/10/2026. Phạm vi: src/ui/*.html, key `ad.*` trong src/Content.gs, demo/demo_mock.js, test/build_demo.js, 4 hướng dẫn. Người soát không sửa file nào trong repo. `node test/harness.js` xanh (26/26, 40/40, 109/109, 43/43, 2/2). Script tái hiện: n1_cancel_reason.js, n2_log_search.js, n3_feed_cache.js, n3b_log_cache.js, n6_err_retry.js, n7_escape.js, r1.js đến r5.js, pw_demo.js (Playwright mở demo).

Quét nhanh không lỗi: không còn chữ tiếng Việt viết cứng ngoài `T.t`/`L` (trừ ký hiệu tiền 'đ' và tiêu đề song ngữ); 267 key `ad.*` đủ bản en, biến `{..}` khớp; đủ nhãn trạng thái, sự kiện, hành động; demo đúng bằng bản dựng lại.

## 1. Đối chiếu B1 đến B19

| Mã | Kết luận | Ghi chú |
|---|---|---|
| B1 | ĐÃ SỬA | Còn sót nhỏ ở đặt thay (N8) |
| B2 | ĐÃ SỬA | |
| B3 | SỬA CHƯA ĐỦ | Nhãn họ chung và "Admin (sửa trong Sheets)" không tìm được (N5) |
| B4 | SỬA CHƯA ĐỦ | Chữ điền sẵn trong ô lý do làm hỏng cách sửa (N1) |
| B5 | ĐÃ SỬA | Ở 360 và 375px chữ bẻ giữa từ "Registratio / ns"; nên đổi en |
| B6 | ĐÃ SỬA (phần số) | Dòng đã đọc còn trong danh sách Chưa đọc tới khi vẽ lại; chấp nhận được |
| B7 | SỬA CHƯA ĐỦ | Nút Thử lại hiện mã `ad.retry` (N3) |
| B8 | SỬA CHƯA ĐỦ | Danh sách thông báo, nhật ký vẫn gọi máy chủ hai lần (N4) |
| B9 | ĐÃ SỬA | |
| B10 | ĐÃ SỬA | Có thể còn sót actor `ADMIN` hiện nguyên chữ |
| B11 | ĐÃ SỬA | CONFIG đặt 0 thì hiện 24; demo không gửi `hours` |
| B12, B13, B14, B16, B17 | ĐÃ SỬA | B14: hướng dẫn chưa cập nhật (D7) |
| B15 | SỬA CHƯA ĐỦ | Trường hợp thường gặp nhất vẫn mất focus (N6) |
| B18 | ĐÃ SỬA (khi xem hết trang) | Không giải quyết danh sách cũ khi chuyển tab (N2) |
| B19 | SỬA CHƯA ĐỦ | N7 |

## 2. Phát hiện mới

* **N1 VỪA · Lý do huỷ mặc định theo ngôn ngữ đang chọn, cách sửa B4 không bao giờ chạy.** Admin.html điền sẵn `L('cancel_reason_default')`; máy chủ chỉ dịch khi lý do trống. Admin VI: `message_en` ra "...: Admin huỷ"; admin EN: BOOKINGS lưu "Cancelled by admin", không khớp key, trang VI hiện tiếng Anh, email mang câu một thứ tiếng. Sửa: trình duyệt gửi rỗng khi chữ bằng mặc định (so cả vi và en), hoặc máy chủ coi cả hai bản là mặc định.
* **N2 VỪA · Chuyển tab dùng lại danh sách cũ, tin mới không hiện.** Bộ nhớ `st.feed`, `st.log`, `st.people` dựng cho đổi ngôn ngữ nhưng `frame()` khi bấm tab cũng dùng. Để trang mở cả ngày không thấy thông báo Khẩn mới hay dòng nhật ký mới; ô số liệu không đổi; nút Tải lại chỉ hiện khi đã xem hết. Sửa: chỉ dùng bộ nhớ khi đổi ngôn ngữ; bấm tab luôn tải lại (cả số trên ô); nút Tải lại thường trực.
* **N3 THẤP · Trang lỗi hiện nút "ad.retry", câu báo không đổi ngôn ngữ.** `ad.*` chưa có khi apiAdminHome lỗi. Sửa: key chung `a.retry`; dựng lại câu báo mỗi lần vẽ.
* **N4 THẤP · Đổi ngôn ngữ lúc danh sách thông báo, nhật ký đang tải: gọi máy chủ hai lần.** Sửa: `seq` và cờ đang tải lên `st`.
* **N5 THẤP · Tìm nhật ký không ra "Bảo trì: chỉ xem", "Gói chuyển sang Hết hạn", "Admin (sửa trong Sheets)".** Sửa: ghép họ nhãn `ad.pkg.*`, `ad.maint.*` thành mã `PACKAGE_x`, `MAINTENANCE_x`; thêm cờ cho actor ADMIN.
* **N6 THẤP · Bàn phím mất chỗ đứng.** Đóng thông báo chưa đọc, bấm ô số liệu hoặc tab: focus về BODY; hộp thoại không có `aria-labelledby`, không giữ phím Tab trong hộp.
* **N7 THẤP · Demo lệch hợp đồng API và tự mâu thuẫn.** apiAdminLog đọc `q.before`, trả `next` là số hàng (Xem thêm sẽ lặp trang 1); thiếu `acts`/`sys`; apiAdminLessons thiếu `hours`; CALENDAR_FAILED của BK000094 có nút S0002, T003 trong khi buổi là Minh Anh với Ánh (T002); S0003 ở danh sách và trang người khác nhau; thông báo BOOKED ngày ISO; build_demo.js còn chữ một thứ tiếng, thanh vai trò tràn ở 360px.
* **N8 THẤP · Đặt thay: lỗi về sau khi đổi ngôn ngữ thì trang trắng** (lập luận). Sửa: ghi lỗi vào `#tab-body` hiện tại khi `current(v)`.
* **N9 THẤP · Thông báo BOOKED dùng ngày ISO** (Booking.gs:133, 134). Sửa: `fmtDayVi_`, `fmtDayEn_`.
* Nghi ngờ chưa tái hiện: đọc thông báo rồi bấm ngay Xem học viên, số Khẩn có thể giảm hai lần.

## 3. Đối chiếu yêu cầu chủ dự án

Song ngữ trang admin: gần đủ (N1, N3, N9). Tên gói song ngữ: đạt (hướng dẫn còn câu cũ, D1). Nhật ký ghi mọi hoạt động, xem trước, đọc đủ: đạt. Chuyển lưu trữ sau 2 tháng: đạt, nhưng danh sách không tự làm mới (N2). Mọi nút trong khu thông báo bấm được: đạt.

## 4. Tài liệu

Đúng với trang chính thức của Google: hạn mức MailApp 100, 1.500, giới hạn thêm cho dùng thử, 100 USD và 60 ngày, 30 lượt chạy cùng lúc, 6 phút (developers.google.com/apps-script/guides/services/quotas); tới 75 ngày (knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace); dùng thử 14 ngày; đường vào Email log search và địa chỉ admin.google.com/ac/emaillogsearch; DKIM khoá 2048 hoặc 1024, tiền tố google.

| Mã | Mức | Vấn đề |
|---|---|---|
| D1 | VỪA | Hướng dẫn triển khai còn dặn ghi tên gói song ngữ ở cột `name` |
| D2 | THẤP | Mô hình admintest@ lẫn giữa cùng tổ chức và tổ chức riêng |
| D3 | THẤP | DKIM: có thể tới 48 giờ |
| D4 | THẤP | "1 phút tới 1 giờ" là thời gian trả kết quả tìm; tên trạng thái phải theo bảng chính thức (thiếu Dropped, In progress; không có Rejected) |
| D5 | THẤP | Check MX có tên "Check MX and SPF Records" và ô DKIM selector |
| D6 | THẤP | Gmail API: ghi số 500 thư mỗi ngày cho tài khoản dùng thử kèm nguồn |
| D7 | THẤP | Câu lỗi thời trong hướng dẫn vận hành (lưu trữ mỗi đêm, nút Thử lại của danh sách buổi, tìm theo nhãn, Tải lại, hỏi ngôn ngữ khi đăng nhập Google) |
| D8 | THẤP | Đại từ "của họ", "cho mình" |
| D9 | THẤP | Số dòng chữ trang quản trị (251) và số dòng Code.gs đã đổi |

Không có phát hiện mức CAO: không XSS, không gửi trùng, không lỗi JavaScript.

<!-- END FILE: v8/reports/SOAT_5I_R2_GIAODIEN.md -->

---

## `v8/reports/THU_PHA_5I.txt`

*Ngày tạo trong Project: 2026-10-18T14:59:34Z*

<!-- BEGIN FILE: v8/reports/THU_PHA_5I.txt | bytes=3349 | sha256=830767e189d2b3414e5685d98af1f9af340e56927e0f48be3903cc401f9e02e5 | created=2026-10-18T14:59:34Z -->
```text
Thử phá chunk 5I (cài lỗi cố ý vào code, chạy node test/harness.js, test phải đỏ)

Vòng A (bản 5I trước soát): 20 lỗi cài, 19 bị bắt. Lỗi lọt: bỏ điều kiện DB_CACHE_ trong logAppend_ (dòng nhật ký trong khoá đọc cả tab). Thêm kiểm vào I103 (đếm ô đọc), chạy lại: bị bắt.

Vòng B (kiểm từng bản sửa của soát vòng 1, 18/10):
Máy chủ (I109)
  A1   bỏ safeCellText_ ở cột thường trong purgeRows_            BẮT
  A2   onChangeInstallable không ghi SHEET_CHANGE                BẮT
  A3   khoá bận không đưa nhật ký vào hàng chờ                   BẮT
  A3b  logMenu_ không ghi bù hàng chờ                            BẮT
  A8   job theo giờ ghi email admin thay SYSTEM                  BẮT
  A10  purgeRows_ bỏ dòng chờ ghi của chính tab                  BẮT
  A15  appendRowsRaw_ ghi tới cột cuối tab                       SỐNG lần đầu (test đặt sai hàng); sửa test, chạy lại: BẮT
  A16  bỏ điều kiện gom 500 dòng                                 BẮT
  A16b bỏ điều kiện quá hạn 7 ngày                               BẮT
Giao diện (U43)
  B1   bỏ kiểm view còn mở khi danh sách buổi về muộn            BẮT
  B2   huỷ xong không đọc lại số trên ô                          BẮT
  B7   lỗi mạng khi mở trang không hiện nút Thử lại              BẮT
  B17a thông báo nhiều buổi hiện hết nút (không giới hạn 3)      BẮT
  B17b thông báo tài khoản không có nút xem người                BẮT
  B3   tìm nhật ký không khớp tên hành động                      BẮT

Mock: ô ghi '=1+1 (có dấu nháy) hoặc ô định dạng chữ nay trả getFormulas rỗng như Google thật (trước đây mock coi mọi chuỗi bắt đầu bằng = là công thức).

Vòng C (kiểm từng bản sửa của soát vòng 2, 18/10): 25 lỗi cài, 23 bị bắt ngay, 2 lọt:
  N1c  bỏ trần 150 dòng của hàng chờ nhật ký      SỐNG → thêm kiểm vào I109 (155 dòng khi khoá bận, hàng chờ dừng ở 150): BẮT
  N4ui danh sách thông báo gọi máy chủ hai lần khi đổi ngôn ngữ lúc đang tải   SỐNG → thêm kiểm vào U44: BẮT
Bị bắt ngay: N1a xoá hàng chờ trước khi ghi, N1b đưa lại mọi lỗi vào hàng chờ, N1d không cắt chi tiết, N2a bỏ đếm bản trùng của con trỏ,
  N2b mở dòng không so mã băm, N3a bỏ so danh sách tab, N3b không báo tab hệ thống, N4 bỏ bảo vệ cột ngoài SCHEMA, N5 bỏ kiểm mẫu tắt,
  N6 bỏ kiểm giả lập giờ, N7 kiểm quyền trước khi lọc, lý do mặc định (máy chủ và trình duyệt), ngày ISO, bấm tab dùng danh sách cũ,
  nhật ký gọi hai lần, nút ad.retry, bỏ họ nhãn, bỏ cờ Admin sửa Sheets, không trả focus, hộp thoại không tên, đặt thay lỗi không hiện,
  nút Tải lại hỏng.

Tổng 3 vòng: 60 lỗi cài, 60 bị bắt (4 lần đầu lọt, đã thêm kiểm và chạy lại đều bị bắt).
Giới hạn còn lại: mock chưa mô phỏng Sheets tự đổi chuỗi dạng ngày, TRUE, FALSE; đã xử lý bằng cách đặt các cột mã của nhật ký là cột chữ.
```
<!-- END FILE: v8/reports/THU_PHA_5I.txt -->

---

## `v8/reports/SOAT_GIAO_DIEN_20_10.md`

*Ngày tạo trong Project: 2026-10-19T22:19:58Z*

<!-- BEGIN FILE: v8/reports/SOAT_GIAO_DIEN_20_10.md | bytes=1820 | sha256=ac70589e469d096c72caf6f8fcbc47c42aa04dd1de347199ee0df574f9a09255 | created=2026-10-19T22:19:58Z -->
# Soát chéo giao diện 20/10 (2 agent độc lập)

## Agent hiển thị
900 ảnh chụp: 5 cỡ (360, 390, 768, 1024, 1366), máy sáng và máy tối, VI và EN, 27 trạng thái của 4 vai trò. Đạt: máy tối vẫn hiện giao diện sáng; thanh vai trò chỉ một thứ tiếng (806/806 ảnh); không tràn ngang, không lỗi JavaScript. Phát hiện 3 CAO (thông báo nhỏ bị bóp, thanh hành động che nội dung cuối, nút Zalo đè nút cuối trang), 15 VỪA, 16 THẤP. Đã sửa: toàn bộ CAO, VỪA (trừ V15 làm theo cách cuộn ngang ô số liệu), THẤP T1 đến T14. Chưa sửa: T15 (viền đỏ từng ô form thiếu, cần đổi logic kiểm form), T16 (chi tiết nhật ký mẫu cũ còn tiếng Việt, là dữ liệu).

## Agent code
Harness xanh; 113 class JS tạo ra đều có kiểu; Playwright 8 cỡ, mọi vai trò, mọi tab, mọi hộp thoại: 0 lỗi JS, 0 phần tử bị che, 0 tràn; wrapper đổi ngôn ngữ của demo không lọt vào dist; Code.gs không đổi. Phát hiện: nút Zalo che nút Đặt trên trình duyệt không có `:has()` (đã thêm luật dự phòng, đã kiểm bằng giả lập); nhãn tab bị cắt dưới 350px (đã sửa); `.pill.info` thiếu kiểu (đã thêm); thay đổi JS ngoài danh sách (đã ghi vào changelog); trang chủ vẽ đè trang đăng nhập và nút Đăng nhập không bấm được khi đang tải (đã sửa trong Home.html).

## Kiểm lại sau khi sửa
Chạy lại script của agent code (walk.js với phông thật): 0 lỗi, 0 bị che, 0 tràn, 0 cắt chữ; repro_nohas với luật dự phòng: nút Đặt bấm được; tabs_narrow: hết cắt; dbg4/dbg5: bấm Đăng nhập lúc đang tải vào đúng trang đăng nhập. Harness 222/222 xanh.

<!-- END FILE: v8/reports/SOAT_GIAO_DIEN_20_10.md -->

---
