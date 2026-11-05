# Hồ sơ hệ thống v6.0.1 (tài liệu và khuôn mẫu sheet)

*Tệp lưu trữ, gộp ngày 30/10/2026 trong đợt dọn dẹp bản 8.0.10. Gộp nguyên văn 8 file của hệ thống v6 (Google Form, file Sheets gắn kèm). Giữ lại vì `Migration.gs` đọc đúng bố cục sheet v6 (tab TUTOR_INFO, STUDENT_INFO, BOOKINGS) và các khuôn mẫu này mô tả bố cục đó. Mã nguồn v6 (`src/*.gs`, `test/*.js`) đã xoá, vẫn lấy lại được từ file sao lưu `SNAPSHOT_BEFORE_thaiput_project.tar.gz`.*

*Mỗi file gốc nằm giữa hai dòng `<!-- BEGIN FILE ... -->` và `<!-- END FILE ... -->`, kèm số byte và mã sha256 của file gốc để kiểm chứng. Nội dung giữa hai dòng đó là nguyên văn.*

## Mục lục

1. `docs/README.md`
2. `docs/CHANGELOG.md`
3. `docs/HOTFIX_v6.0.1.md`
4. `docs/DEVELOPER_GUIDE.md`
5. `docs/TAI_LIEU_TONG_HOP_v6.0.md`
6. `templates/THAIPUT_MAIN_v6.0.md`
7. `templates/THAIPUT_REGISTRATION_v6.0.md`
8. `templates/THAIPUT_TUTOR_v6.0.md`

---

## `docs/README.md`

*Ngày tạo trong Project: 2026-09-24T11:00:08Z*

<!-- BEGIN FILE: docs/README.md | bytes=3004 | sha256=156d616712764227d4a0de8a31227125dcf98914c2e471c2ea5e0248314ca317 | created=2026-09-24T11:00:08Z -->
# thaiput Booking System

![Test](../../actions/workflows/test.yml/badge.svg)

Hệ thống đặt lịch học 1:1 tự động cho **thaiput** chạy trên Google Sheets, Google Forms và Apps Script. Học viên chọn giờ qua form, hệ thống tự kiểm tra số buổi còn lại, xếp tutor theo Round Robin, tạo link Google Meet và gửi email xác nhận.

**Phiên bản:** 6.0.1 (24/09/2026) · **Test:** 62/62 nghiệp vụ, 42/42 FormLink

## Tính năng

* Đăng ký học viên qua form, kích hoạt khi đã thanh toán
* Đặt lịch theo tuần, quota theo email, chặn slot đã qua
* Xếp tutor tự động, cân bằng số buổi trong tuần
* Tự tạo Google Meet, email xác nhận / thất bại / sắp hết buổi
* Huỷ booking → xoá lịch Calendar, hoàn buổi, báo học viên
* Điểm danh Completed / NoShow, bảng lương tutor theo tháng
* Tự chuyển tuần, archive tháng, nhắc lịch tutor Chủ nhật
* Cứu phản hồi form bị sót (v6.0.1)

## Cấu trúc repo

```
src/          12 file .gs + appsscript.json → code chạy trong Apps Script
test/         harness.js, formlink.test.js → kiểm tra code trên máy, không deploy
templates/    3 file xlsx mẫu: MAIN, REGISTRATION, TUTOR
tools/        create_xlsx.py → tạo lại 3 file mẫu
docs/         Tài liệu tổng hợp, hướng dẫn lập trình viên, ghi chú hotfix
.github/      Tự chạy test mỗi lần push, mẫu báo lỗi, mẫu pull request
```

## Bạn dùng repo này để làm gì?

| Mục đích | Bắt đầu từ |
|---|---|
| **Triển khai hệ thống mới** | `docs/TAI_LIEU_TONG_HOP.md` mục 5 (10 bước). Copy file trong `src/`, dựng Sheet từ `templates/` |
| **Cập nhật hệ thống đang chạy** | `CHANGELOG.md` → xem file .gs nào đổi, chỉ thay các file đó |
| **Vận hành hằng ngày (admin)** | `docs/TAI_LIEU_TONG_HOP.md` mục 6 và 12 (troubleshooting) |
| **Thuê coder bảo trì / phát triển** | Mời vào repo, yêu cầu đọc `docs/DEVELOPER_GUIDE.md`. Mọi thay đổi qua pull request, GitHub Actions phải xanh |
| **Báo lỗi / theo dõi việc cần làm** | Tab **Issues** → New issue → mẫu "Báo lỗi" |
| **Sao lưu, xem lại lịch sử code** | Mỗi phiên bản là 1 commit / tag. Tab **Commits** để so sánh |
| **Portfolio / giới thiệu dự án** | README này + `docs/TAI_LIEU_TONG_HOP.md` mục 1 (audit) và 2 (kiến trúc) |

## Chạy test

```bash
npm test
```

Cần Node.js 18 trở lên, không cần cài thêm gì. Chi tiết: `docs/DEVELOPER_GUIDE.md` mục 4.

## Bảo mật

* `src/Config.gs` chỉ chứa **giá trị mẫu**. Điền giá trị thật trong Apps Script, **không commit lên GitHub**.
* Không đưa dữ liệu học viên thật lên repo.
* Nên để repo **Private**.

## Bản quyền

© 2026 thaiput. Mọi quyền được bảo lưu. Không sao chép hoặc sử dụng khi chưa có sự cho phép.

<!-- END FILE: docs/README.md -->

---

## `docs/CHANGELOG.md`

*Ngày tạo trong Project: 2026-09-24T11:00:09Z*

<!-- BEGIN FILE: docs/CHANGELOG.md | bytes=2062 | sha256=bd3fefc1773e58a091aa32987424823b601484e150c5b385468abbb3560a0540 | created=2026-09-24T11:00:09Z -->
# Changelog

Chi tiết từng phiên bản cũ: `docs/TAI_LIEU_TONG_HOP.md` mục 9.

## v6.0.1 (24/09/2026) HOTFIX

**Sửa bug nghiêm trọng:** trigger form đặt lịch kiểu "From form" chỉ gửi `e.response`, không có `e.values`. `processBooking_` không đọc được email, thoát êm, Executions vẫn báo Completed → phản hồi của học viên bị mất.

* `Main.gs`: `normalizeFormEvent_()` đọc được trigger Spreadsheet, trigger Form và `e` rỗng
* `Main.gs`: thiếu email → ném lỗi, admin nhận email (trước đây im lặng)
* `Main.gs`: chạy tay `onFormSubmitTrigger` → bỏ qua, không gửi email lỗi giả
* `Main.gs`: mới `recoverMissedBookings()` xử lý lại phản hồi 72 giờ gần nhất chưa có trong BOOKINGS, chạy nhiều lần không tạo trùng
* `Helpers.gs`: ghi `ACTIVE_WEEK_SET_AT` khi đổi tuần để recover không xếp nhầm phản hồi tuần cũ
* `Setup.gs`: menu Form → Xử lý lại phản hồi bị sót (72 giờ)
* `Config.gs`: `VERSION` = 6.0.1
* Test: thêm T20 (8 kiểm tra) cho trigger Form; sửa T15 lệch khi tuần active lấn sang tháng sau. 62/62 + 42/42

Chi tiết: `docs/HOTFIX_v6.0.1.md`

## v6.0 FINAL (19/09/2026)

Audit toàn diện, sửa 9 bug. BOOKINGS 14 cột (EventID). Chặn slot đã qua. Round Robin theo tuần. Rollover chống trễ. Rebuild tháng giữ đánh dấu tutor. Payroll ghi tab. `createAllTriggers`. Giả lập thời gian. 50/50 + 42/42 test.

## v5.2 (19/09/2026)

FormLink.gs: nối form bất kỳ vào hệ thống, nhận diện tab response bằng sheetId, ép thứ tự câu hỏi, form ID lưu Script Properties.

## v5.1 (18/09/2026)

Tách 3 spreadsheet (Main, Registration, Tutor). CHECK_SLOT chuyển sang giá trị đồng bộ.

## v5.0 (18/09/2026)

Registration pipeline, quota theo email, điểm danh, archive tháng, payroll.

## v1.0 đến v4.0 (08/2026 đến 09/2026)

Prototype → production: Google Meet, email, Round Robin, quota theo StudentID, sửa các bug ngày tháng.

<!-- END FILE: docs/CHANGELOG.md -->

---

## `docs/HOTFIX_v6.0.1.md`

*Ngày tạo trong Project: 2026-09-24T11:00:11Z*

<!-- BEGIN FILE: docs/HOTFIX_v6.0.1.md | bytes=4371 | sha256=03fa775652c1de3db066ede4ef90fa4afc01be97566cc081702c5451480f1f38 | created=2026-09-24T11:00:11Z -->
# thaiput v6.0.1 HOTFIX: Phản hồi form đặt lịch bị bỏ qua im lặng

Ngày: 24/09/2026 · Áp dụng cho: v6.0 FINAL

## 1. Chuyện gì đã xảy ra

| Giờ | Execution | Type | Ý nghĩa thật |
|---|---|---|---|
| 16:14:36 | onFormSubmitTrigger | Trigger | Học viên submit. Báo **Completed** nhưng **không ghi booking** |
| 16:28:28 | onFormSubmitTrigger | Trigger | Học viên submit. Báo **Completed** nhưng **không ghi booking** |
| 16:29:25 | onFormSubmitTrigger | Editor | Có người bấm Run tay → email lỗi `reading 'values'` |

Email lỗi chỉ là **triệu chứng phụ**. Lỗi thật nằm ở 2 lần chạy báo "Completed".

## 2. Nguyên nhân gốc

`FormLink.gs` tạo trigger kiểu **"From form, On form submit"**. Loại trigger này chỉ gửi `e.response`, không gửi `e.values` hay `e.namedValues`.

`processBooking_` v6.0 chỉ đọc `e.values` / `e.namedValues`, nên không thấy email, ghi log "Thiếu email" rồi **thoát êm**. Apps Script vẫn báo Completed, admin không nhận cảnh báo, học viên không có lịch.

Harness v6.0 không bắt được lỗi này vì mọi test đều giả lập event dạng `{values: [...]}` (dạng của trigger Spreadsheet).

## 3. Sửa gì

| File | Thay đổi |
|---|---|
| **Main.gs** | `normalizeFormEvent_()` đọc được cả 3 dạng event: trigger Spreadsheet (`e.values`), trigger Form (`e.response`), và `e` rỗng khi chạy tay |
| | Thiếu email giờ **ném lỗi** → admin nhận email. Không còn nuốt phản hồi im lặng |
| | Chạy tay `onFormSubmitTrigger` → bỏ qua, ghi log hướng dẫn, không gửi email lỗi giả |
| | Mới: `recoverMissedBookings()` quét phản hồi 72 giờ gần nhất, xử lý lại phản hồi chưa có trong BOOKINGS |
| **Helpers.gs** | `setActiveWeekStart_` ghi thêm `ACTIVE_WEEK_SET_AT` (lúc đổi tuần) để recover không đặt nhầm phản hồi tuần cũ sang tuần mới |
| **Setup.gs** | Menu **thaiput → Form → Xử lý lại phản hồi bị sót (72 giờ)** |
| **harness.js** | Thêm T20 (8 assertion) cho trigger Form, `e` rỗng, recover. Sửa T15 bị lệch khi tuần active lấn sang tháng sau. **62/62 PASS** |

Không đổi: FormLink.gs (giữ trigger "From form", Main.gs giờ đọc được), Registration.gs (`onRegistrationSubmit` không đọc `e`, chạy tay vẫn đúng), các file còn lại.

## 4. Cách recover phân biệt phản hồi đã xử lý

Một phản hồi được coi là **đã xử lý** khi **mọi slot** nó chọn đều đã có dòng BOOKINGS cùng email, cùng ngày, cùng khung giờ, tạo sau lúc submit (Active hay Failed đều tính).

Hệ quả:
* Chạy recover nhiều lần không tạo booking trùng
* 2 lần submit sót của cùng 1 học viên đều được cứu
* Phản hồi submit trước lúc đổi tuần active bị bỏ qua (báo trong mục "Thuộc tuần trước")

## 5. Triển khai (5 phút)

1. Apps Script: thay toàn bộ nội dung **Main.gs**, **Helpers.gs**, **Setup.gs** bằng bản v6.0.1. Lưu.
2. Reload Google Sheet MAIN để menu mới xuất hiện.
3. Menu **thaiput → Form → Xử lý lại phản hồi bị sót (72 giờ)**. Lần đầu sẽ hỏi cấp quyền Forms, bấm cho phép.
4. Đọc hộp thoại kết quả: phải thấy **"Đã xử lý lại: 2"** (hoặc số học viên đã submit từ khi deploy v6.0). Kiểm tra BOOKINGS và email học viên.
5. Test thật: submit form đặt lịch bằng email học viên test. Trong **Executions**, dòng Type **Trigger** phải kèm 1 dòng mới trong BOOKINGS.

Không cần chạy lại `createAllTriggers()` hay `relinkAllForms()`.

## 6. Quy tắc bổ sung (thêm vào 10 quy tắc kỹ thuật)

**Quy tắc 11.** Mọi handler trigger phải qua `normalizeFormEvent_()`. Không bao giờ đọc trực tiếp `e.values`. Loại trigger (Form hay Spreadsheet) có thể đổi khi kết nối lại form.

**Quy tắc 12.** Không bao giờ `return` im lặng khi thiếu dữ liệu bắt buộc. Thiếu email phải `throw` để admin được báo.

**Quy tắc 13.** "Completed" trong Executions chỉ nghĩa là không có exception, **không** nghĩa là booking đã ghi. Sau mỗi thay đổi liên quan form, kiểm chứng bằng BOOKINGS.

<!-- END FILE: docs/HOTFIX_v6.0.1.md -->

---

## `docs/DEVELOPER_GUIDE.md`

*Ngày tạo trong Project: 2026-09-24T11:00:10Z*

<!-- BEGIN FILE: docs/DEVELOPER_GUIDE.md | bytes=5376 | sha256=d2ba7c700505b84cf9dd7f129e6858ddda24d451bd079825f96a09f0a5b5fe7e | created=2026-09-24T11:00:10Z -->
# Hướng dẫn cho lập trình viên

Dành cho coder nhận bảo trì hoặc phát triển tiếp. Đọc hết trang này trước khi sửa code.

## 1. Kiến trúc trong 1 phút

```
Form Đặt lịch ──(trigger From form)──► onFormSubmitTrigger ─► processBooking_
                                                                 │
Form Đăng ký ──► Registration SS ──► onRegistrationSubmit ─► STUDENT_INFO (Main)
                                                                 │
Tutor SS (Tutor-*: đánh "x" giờ rảnh) ──► assignTutor_ (Round Robin theo tuần)
                                                                 │
                                      BOOKINGS (Main) + Google Meet + Gmail
```

| Spreadsheet | Tab chính | Ghi chú |
|---|---|---|
| MAIN (chứa script) | BOOKINGS, STUDENT_INFO, CHECK_SLOT, ĐĂNG KÝ MỚI, DASHBOARD, PAYROLL_REPORT | Script bound vào file này |
| REGISTRATION | STUDENT_REGISTRATION, PACKAGES | Mở bằng `CONFIG.REGISTRATION_SS_ID` |
| TUTOR | TUTOR_INFO, Tutor-<tên> | Mở bằng `CONFIG.TUTOR_SS_ID` |

Chi tiết cột từng tab: `docs/TAI_LIEU_TONG_HOP.md` mục 4.

## 2. Bản đồ file

| File | Trách nhiệm |
|---|---|
| Config.gs | Hằng số, tên tab, chỉ số cột. Mọi "magic number" nằm ở đây |
| Helpers.gs | Ngày giờ (`getNow_`, `makeNoon_`), tuần active, cache, đọc tutor |
| Main.gs | Nhận form đặt lịch, chuẩn hoá event, đặt slot, cứu phản hồi sót |
| Quota.gs | Tra số buổi còn lại theo email |
| MeetIntegration.gs | Tạo/xoá sự kiện Calendar + Meet, mọi email |
| FormUpdater.gs | Đồng bộ CHECK_SLOT, dropdown form, số liệu DASHBOARD |
| FormLink.gs | Nối form vào hệ thống, ép thứ tự câu hỏi, dựng trigger form |
| Registration.gs | Kích hoạt học viên đã thanh toán |
| Attendance.gs | Active → Completed / NoShow, payroll |
| WeeklyMaintenance.gs | Chuyển tuần, nhắc tutor |
| Archive.gs | Archive + dựng lại lịch tháng |
| Setup.gs | Menu, `createAllTriggers`, huỷ booking (onEdit), bộ test trên Sheets |

## 3. 13 nguyên tắc không được phá

1. **Cột G BOOKINGS luôn là midnight** `new Date(y,m,d)`. COUNTIFS so sánh tuyệt đối.
2. **Ngày hiển thị/sort dùng `makeNoon_`** để không lùi 1 ngày khi lệch timezone.
3. **JS month bắt đầu từ 0.** `new Date(2026, 8, 1)` là 1/9.
4. **Timezone project = Asia/Ho_Chi_Minh** (appsscript.json).
5. **Thứ tự câu hỏi form đặt lịch** = Họ và tên, Student ID, Thứ 2…Chủ nhật. FormLink ép, đừng sửa tay.
6. **`ACTIVE_WEEK_START` trong Script Properties** là tuần active duy nhất. Đổi tuần chỉ qua `setActiveWeekStart_`.
7. **Cần "bây giờ" thì dùng `getNow_()`**, không `new Date()` (để giả lập được).
8. **CHECK_SLOT là cache.** Quyết định đặt slot nằm ở `assignTutor_`.
9. **Gọi `clearCache_()`** đầu mỗi lần chạy.
10. **Không xoá tab tutor / dòng BOOKINGS cũ.** Payroll và archive cần lịch sử.
11. **Mọi handler trigger form phải qua `normalizeFormEvent_()`.** Không đọc thẳng `e.values`; loại trigger có thể đổi.
12. **Không `return` im lặng khi thiếu dữ liệu bắt buộc.** Phải `throw` để admin được báo.
13. **"Completed" trong Executions không có nghĩa booking đã ghi.** Luôn kiểm chứng bằng BOOKINGS.

## 4. Chạy test

Cần Node.js 18 trở lên. Không cần cài package nào.

```bash
npm test                 # cả 2 bộ
npm run test:booking     # test/harness.js: 62 kiểm tra nghiệp vụ
npm run test:formlink    # test/formlink.test.js: 42 kiểm tra FormLink
```

GitHub Actions tự chạy `npm test` mỗi lần push / mở pull request (`.github/workflows/test.yml`).

**Harness làm gì:** dựng bản giả của SpreadsheetApp, FormApp, CalendarApp, MailApp, PropertiesService, LockService rồi nạp các file trong `src/` để chạy thật. Không đụng dữ liệu thật, không tốn quota Google.

**Giới hạn:** harness chỉ đúng khi bản giả giống thật. Bug v6.0.1 lọt qua vì harness cũ chỉ giả lập trigger Spreadsheet. Sau mỗi lần deploy vẫn phải submit form thật một lần.

**Thêm test:** mỗi bug sửa phải kèm ít nhất 1 `check(...)` trong `test/harness.js` tái hiện đúng bug đó (test phải FAIL trên code cũ, PASS trên code mới).

## 5. Deploy bằng clasp (tuỳ chọn)

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json   # điền scriptId: Apps Script → Project Settings → Script ID
npm run push                          # đẩy src/ lên Apps Script
```

`.clasp.json` đã nằm trong `.gitignore`. Không deploy bằng clasp thì copy tay từng file trong `src/` vào trình soạn Apps Script.

## 6. Bảo mật khi dùng GitHub

* `src/Config.gs` trên GitHub **chỉ chứa giá trị mẫu**. Giá trị thật (email admin, ID spreadsheet, số tài khoản) chỉ điền trong Apps Script, **không commit**.
* Không đưa file xlsx có dữ liệu học viên thật lên repo. `templates/` chỉ chứa dữ liệu mẫu.
* Repo nên để **Private**. Mời coder bằng Settings → Collaborators, gỡ quyền khi xong việc.

<!-- END FILE: docs/DEVELOPER_GUIDE.md -->

---

## `docs/TAI_LIEU_TONG_HOP_v6.0.md`

*Ngày tạo trong Project: 2026-09-24T11:00:11Z*

<!-- BEGIN FILE: docs/TAI_LIEU_TONG_HOP_v6.0.md | bytes=24103 | sha256=5009a858f3b7740f28e9c038371f14f689a7773a32212c633c5c6e2b6bec01d1 | created=2026-09-24T11:00:11Z -->
# thaiput Booking System v6.0 FINAL — Tài Liệu Tổng Hợp

*Build 19/09/2026 · 50/50 test hệ thống PASS · 42/42 test FormLink PASS · 12 file .gs, 140 hàm, 0 trùng tên*

---

## Mục lục

1. Kết quả audit — 9 bug tìm thấy và cách sửa
2. Kiến trúc 3 spreadsheet
3. Bộ file giao (12 .gs + manifest + 3 XLSX + 2 harness)
4. Cấu trúc tab
5. Triển khai từ đầu (10 bước)
6. Vận hành hàng ngày
7. 8 trigger
8. Test (T0 → T11) và harness
9. Lịch sử phiên bản v1.0 → v6.0
10. Nguyên tắc kỹ thuật không được phá
11. Hạn chế còn lại và tư vấn thẳng
12. Troubleshooting

---

## 1. Kết quả audit

Tôi rà toàn bộ code v5.1 + v5.2 với câu hỏi: *"Cái gì chạy được trong harness nhưng sẽ chết trên Google Sheets thật?"* Kết quả: 9 bug, trong đó 3 nghiêm trọng, 2 bị chính harness cũ che giấu.

| # | Mức | Bug | Hậu quả thực tế | Vì sao lọt | Sửa ở |
|---|---|---|---|---|---|
| 1 | **NGHIÊM TRỌNG** | `createAllTriggers()` được tài liệu bảo chạy nhưng **không tồn tại** trong code | Không trigger nào chạy: không sync 10 phút, không điểm danh, không rollover tuần, không archive tháng. Hệ thống chỉ hoạt động khi admin bấm tay | Chưa bao giờ deploy thật | Setup.gs |
| 2 | **NGHIÊM TRỌNG** | Sau booking/huỷ chỉ gọi `updateFormOptions()`, không gọi `syncCheckSlotValues()` | CHECK_SLOT (giá trị từ v5.1) cũ tới 10 phút. Dropdown form hiện slot đã đầy, HV thứ 4 đặt vào slot 3 chỗ → bị từ chối với lý do sai | Harness cũ: `flush()` tự tính lại CHECK_SLOT như công thức. Google Sheets thật không làm vậy với giá trị | FormUpdater.gs |
| 3 | **NGHIÊM TRỌNG** | `rebuildCalendarBody_` xoá trắng tab rồi ghi lại ngày trống | Ngày 1 hàng tháng, mọi "x" tutor đã đánh cho tuần đầu tháng mới **mất sạch**. Tutor phải điền lại, không ai báo | Test archive chỉ kiểm tra archive tab tồn tại, không kiểm tra dữ liệu sau rebuild | Archive.gs |
| 4 | CAO | Huỷ booking không xoá event Calendar (không lưu EventID) | HV và tutor vẫn thấy buổi học trên lịch Google sau khi huỷ | Tài liệu v5.0 ghi "Xoá Calendar event" nhưng code không làm | Config, Main, MeetIntegration, Setup |
| 5 | CAO | Không chặn đặt slot đã qua | Thứ 4 vẫn đặt được thứ 2 tuần này → trừ quota, tạo Meet cho buổi đã qua, điểm danh 00:30 đánh Completed | Chưa ai nghĩ tới | Helpers, Main, FormUpdater |
| 6 | TRUNG BÌNH | `weeklyRollover` tính "thứ 2 kế tiếp" từ ngày chạy | Trigger Google lệch ±15 phút. Chạy 00:05 thứ 2 thay vì 23:00 CN → nhảy **2 tuần** | Trigger chưa từng chạy thật (bug #1) | WeeklyMaintenance.gs |
| 7 | TRUNG BÌNH | Test T3–T7 dùng email không có trong STUDENT_INFO demo | Chạy test trên sheet thật → toàn bộ Failed UNKNOWN_STUDENT | Harness có DB riêng nên không thấy | Setup.gs (T0) |
| 8 | TRUNG BÌNH | `testSystem` kiểm tra PACKAGES, TUTOR_INFO trong Main | Setup 3 file luôn báo lỗi thiếu tab dù đúng | Viết trước khi tách file | Setup.gs |
| 9 | THẤP | Round Robin đếm booking trọn đời | Tutor mới nhận 100% booking cho tới khi bắt kịp tutor cũ. Tutor nghỉ 1 tháng về bị "ưu tiên" ngược | Ghi nhận từ v4 nhưng chưa sửa | Helpers.gs |

Ngoài ra, sửa 4 điểm không phải bug nhưng kém:
- `generatePayrollReport` chỉ log, không ghi vào tab PAYROLL_REPORT dù tab có sẵn header → giờ ghi bảng thật.
- "Test sandbox" (`createTestSandbox`) tạo tab `_TEST_` nhưng test vẫn ghi vào BOOKINGS thật → bỏ hẳn, thay bằng T0 seed + `resetBookings` dọn. Trung thực hơn.
- Mỗi booking đọc 4 tab tutor × số slot lần (28 lần đọc external spreadsheet cho 7 slot) → cache trong 1 lần chạy, còn 4 lần.
- Form đăng ký chỉ tạo cột A–D, admin không biết gõ "Đã thanh toán" vào đâu → FormLink tự thêm header E–I + dropdown cột E.

### Bài học cho harness

Harness v6.0 **không** tự tính lại CHECK_SLOT trong `flush()`. Chỉ mô phỏng công thức COUNTIFS của STUDENT_INFO (thứ thật sự là công thức). Bug #2 và #3 giờ có test riêng (T3, T8, T15) và sẽ FAIL nếu ai đó phá lại.

---

## 2. Kiến trúc 3 spreadsheet

```
┌──────────────────────────────────────┐
│  THAIPUT_REGISTRATION                │
│  PACKAGES · STUDENT_REGISTRATION     │◄── Form Đăng ký HV (A–D form ghi, E–I script/admin)
└─────────────────┬────────────────────┘
                  │ syncRegistrations()  [menu Học viên → Kích hoạt]
                  ▼
┌──────────────────────────────────────┐
│  THAIPUT_MAIN  (chứa Apps Script)    │
│  DASHBOARD · STUDENT_INFO            │
│  CHECK_SLOT (giá trị) · BOOKINGS 14  │◄── Form Đặt lịch
│  ĐĂNG KÝ MỚI · PAYROLL · HUONG_DAN   │
└─────────────────▲────────────────────┘
                  │ syncCheckSlotValues()  [mỗi 10 phút + sau booking/huỷ/rollover]
                  │ archiveMonth()         [ngày 1 hàng tháng]
┌─────────────────┴────────────────────┐
│  THAIPUT_TUTOR                       │
│  TUTOR_INFO · Tutor-Vân/Ánh/Lan/Minh │◄── Tutor tự đánh "x"
│  _ARCHIVE_Tutor-*_YYYY_MM (ẩn)       │
└──────────────────────────────────────┘
```

**Nguyên tắc:** Main là nơi duy nhất có script và LockService. Registration và Tutor chỉ bị script **đọc** (trừ archive/rebuild ghi vào Tutor). Tutor sửa lịch trực tiếp không đụng script → không xung đột.

**Fallback:** `TUTOR_SS_ID` / `REGISTRATION_SS_ID` trống → script dùng tab trong Main. Muốn gom 1 file vẫn chạy.

---

## 3. Bộ file giao

### 12 file Apps Script (dán vào project của MAIN)

| File | So với v5.2 | Thay đổi chính |
|---|---|---|
| Config.gs | SỬA | `EVENT_ID:14`, `BOOKING_NUM_COLS:14`, `PAST_SLOT`, `MIN_LEAD_MINUTES:60`, `ROUND_ROBIN_SCOPE:'week'`, `DASHBOARD_CELLS`, bỏ TEST_PREFIX |
| Helpers.gs | SỬA | `getNow_()` (giả lập được), cache tutor/availability, `isSlotBookable_`, RR theo tuần, `getMondayOfWeek_` |
| Main.gs | SỬA | Chặn PAST_SLOT trước quota; lưu EventID cột N; `assignTutor_` trước, CHECK_SLOT chỉ để chọn thông điệp lỗi |
| MeetIntegration.gs | SỬA | `createMeetEvent_` trả `{link,eventId}`; `deleteMeetEvent_`; welcome đọc form ID từ Properties |
| Attendance.gs | SỬA | Payroll ghi bảng thật vào tab; `generatePayrollLastMonth`; `getNow_` |
| Archive.gs | SỬA | Rebuild **giữ** dòng ≥ đầu tháng kèm "x"; archive tab tự ẩn; xoá cache sau rebuild |
| WeeklyMaintenance.gs | SỬA | Rollover tính thứ 2 của tuần chứa (now+12h); không lùi tuần; báo admin khi archive lỗi |
| FormUpdater.gs | SỬA | `updateFormOptions` = sync → dashboard → form; ẩn slot đã qua/quá sát; `updateDashboardStats_` |
| FormLink.gs | SỬA | Thêm `ensureResponseSheetHeaders_` (header E–I + dropdown), `writeFormLinksToDashboard_` |
| Setup.gs | VIẾT LẠI | `createAllTriggers` (mới), `cancelBookingRow_` xoá Calendar, `testSystem` 3 file + timezone, T0 seed, T11 past slot, `testSimulateNow`, bỏ sandbox |
| Quota.gs | GIỮ | — |
| Registration.gs | GIỮ | — |

### Manifest
`appsscript.json` — timezone HCM, Calendar advanced service, scopes. Dán qua Project Settings → "Show appsscript.json".

### 3 XLSX
`THAIPUT_MAIN_v6.0.xlsx` (7 tab, BOOKINGS 14 cột) · `THAIPUT_REGISTRATION_v6.0.xlsx` (2 tab) · `THAIPUT_TUTOR_v6.0.xlsx` (5 tab, dữ liệu tháng 8/2026 + tuần đầu tháng 9 để test archive)

### Harness
`harness.js` (50 assertions, mock 3 spreadsheet, Calendar lifecycle) · `formlink_test.js` (42 assertions) · `create_xlsx.py`

---

## 4. Cấu trúc tab

### BOOKINGS (Main) — 14 cột

| Cột | Tên | Ghi chú |
|---|---|---|
| A | BookingID | `BK` + yyMMddHHmmss + 3 số ngẫu nhiên |
| B | StudentID | tra ngược từ email |
| C | StudentName | |
| D | StudentEmail | **khoá chính** cho quota (COUNTIFS trong STUDENT_INFO) |
| E | TutorID | Round Robin theo tuần |
| F | TutorName | |
| G | Date | **midnight** `new Date(y,m,d)` — bắt buộc cho COUNTIFS |
| H | TimeSlot | `"HH:mm - HH:mm"` |
| I | MeetLink | |
| J | Status | Active / Completed / NoShow / Cancelled / Failed — admin đổi thành Cancelled để huỷ |
| K | CreatedAt | |
| L | FailReason | 6 lý do trong `CONFIG.FAIL_REASONS`, hoặc ghi chú huỷ |
| M | AttendanceMarkedAt | |
| N | **EventID** | id event Calendar, dùng để xoá khi huỷ |

### STUDENT_INFO (Main)
`StudentID · Email · Họ và tên · Gói · TotalSessions · SessionsUsed (công thức) · SessionsRemaining (công thức) · Ngày kích hoạt · Trạng thái · Ghi chú`
SessionsUsed = COUNTIFS(BOOKINGS D=email, J ∈ {Active, Completed, NoShow}). Cancelled/Failed không tính → huỷ tự hoàn.

### CHECK_SLOT (Main)
`Ngày · Thứ · 14 khung giờ`. **Giá trị**, không phải công thức. `= tutor có "x" − booking đang chiếm`. Đồng bộ bởi script. Đây là cache; nguồn sự thật là `assignTutor_` đọc trực tiếp tutor + BOOKINGS.

### STUDENT_REGISTRATION (Registration)
A–D do form ghi (`Timestamp · Email · Họ và tên · Gói`). E–I do FormLink tạo header, admin/script điền (`Trạng thái TT · StudentID · Số buổi · Học phí · Synced`). Cột E có dropdown.

### Tutor-* (Tutor)
`Ngày · Thứ · 14 khung giờ`. Tutor gõ `x` vào ô rảnh. Không gõ gì khác. Không xoá cột. Không đổi tên tab.

### DASHBOARD (Main)
B11–B14: link + ID 2 form (script ghi). B17–B21: tuần active, bookings tuần này, tutor active, lần sync cuối, cảnh báo giả lập thời gian (script ghi mỗi 10 phút).

---

## 5. Triển khai từ đầu

1. Upload 3 XLSX lên Google Drive → mở từng file → File → Save as Google Sheets. Có thể xoá bản .xlsx sau.
2. Copy Spreadsheet ID của **REGISTRATION** và **TUTOR**: đoạn giữa `/d/` và `/edit` trên URL.
3. Mở **MAIN** → Extensions → Apps Script. Xoá `Code.gs`. Tạo 12 file, dán từng file `.gs` (tên file không cần đuôi).
4. Project Settings (bánh răng) → Time zone → **(GMT+07:00) Ho Chi Minh**. Bật "Show appsscript.json manifest" → quay lại editor → dán nội dung `appsscript.json`.
5. Nếu manifest không tự bật Calendar: Services (+) → Google Calendar API → Add.
6. `Config.gs`: điền `ADMIN_EMAIL`, `TUTOR_SS_ID`, `REGISTRATION_SS_ID`. Lưu (Ctrl+S).
7. Reload tab Google Sheets của MAIN → menu **thaiput** xuất hiện → **1. Kiểm tra hệ thống** → lần đầu sẽ hỏi quyền, chấp nhận hết → chạy lại → xem log (Extensions → Apps Script → Executions) phải **0 lỗi**.
8. Menu → **2. Tạo 2 Form mới + kết nối**. Xong: tab `ĐĂNG KÝ MỚI` và `STUDENT_REGISTRATION` đã nối form, dropdown đã nạp, link ghi DASHBOARD B11–B12.
9. Menu → **3. Tạo/cập nhật 8 trigger**. Log phải ghi `8/8 trigger`.
10. Menu → **Form → Kiểm tra kết nối Form** → `0 vấn đề`. Chạy **Test → Chạy tất cả**, xem log, rồi **Test → Dọn dữ liệu test**.

Go live: chia link form đăng ký (DASHBOARD B12) cho HV mới, link form đặt lịch (B11) cho HV đã kích hoạt. Tutor nhận link Tutor spreadsheet, chỉ cần quyền Editor trên file đó.

---

## 6. Vận hành hàng ngày

### Admin

| Việc | Làm gì |
|---|---|
| HV mới chuyển khoản | Mở REGISTRATION → cột E dòng đó chọn "Đã thanh toán" → Main menu **Học viên → Kích hoạt**. HV nhận email welcome kèm link đặt lịch |
| HV nạp thêm gói | HV điền lại form đăng ký. Đánh "Đã thanh toán" → Kích hoạt. Script cộng dồn TotalSessions, reset cờ cảnh báo |
| Huỷ buổi | BOOKINGS cột J → chọn **Cancelled**. Tự động: hoàn buổi, xoá lịch Calendar, email HV + tutor, cập nhật dropdown |
| HV vắng không báo | Menu **Điểm danh → Đánh NoShow** khi đang chọn dòng đó. Vẫn trừ buổi, vẫn tính lương tutor |
| Lương tháng | Menu **Báo cáo → Payroll tháng trước** → xem tab PAYROLL_REPORT |
| Thêm tutor | TUTOR spreadsheet: thêm dòng TUTOR_INFO (Status = Active) + tạo tab `Tutor-<Tên>` (copy tab có sẵn, xoá "x"). Menu **Lịch → Đảm bảo đủ ngày tuần active** |
| Tạm dừng tutor | TUTOR_INFO Status ≠ Active. Không xoá tab (lịch sử payroll cần) |
| Form hỏng | Menu **Form → Kết nối lại tất cả Form** (an toàn chạy nhiều lần) hoặc **2. Tạo 2 Form mới** |

### Tutor
Chủ nhật 06:00 nhận email nhắc. Mở tab của mình trong TUTOR spreadsheet, gõ `x` vào ô rảnh tuần tới, hạn 12:00 trưa CN. Không cần làm gì khác. Booking mới đến qua email kèm link Meet.

### Học viên
Điền form đăng ký → chuyển khoản → nhận email kích hoạt → mở link đặt lịch (dropdown chỉ hiện slot còn chỗ và chưa qua giờ) → nhận email xác nhận + Meet.

---

## 7. 8 trigger (tạo bởi menu 3, chạy lại bao nhiêu lần cũng an toàn)

| # | Handler | Loại | Lịch | Việc |
|---|---|---|---|---|
| 1 | `onRegistrationSubmit` | Form submit | khi HV đăng ký | Quét STUDENT_REGISTRATION, kích hoạt dòng "Đã thanh toán" chưa Synced |
| 2 | `onFormSubmitTrigger` | Form submit | khi HV đặt lịch | `processBooking_` |
| 3 | `updateFormOptions` | Time | mỗi 10 phút | sync CHECK_SLOT → dashboard → dropdown form |
| 4 | `markCompletedSessions` | Time | 00:30 hàng ngày | Active đã qua giờ → Completed |
| 5 | `weeklyRollover` | Time | CN 23:00 | tuần active → thứ 2 tới, thêm dòng, sync |
| 6 | `sundayReminderTutors` | Time | CN 06:00 | email nhắc tutor điền lịch |
| 7 | `monthlyRollover` | Time | ngày 1, 01:00 | archive tháng trước → rebuild tháng này (giữ "x") |
| 8 | `onEditTrigger` | On edit (installable) | khi sửa ô | cột J → Cancelled ⇒ `cancelBookingRow_` |

Trigger 3 là "nhịp tim" của hệ thống: DASHBOARD B20 (lần sync cuối) không nhảy quá 10 phút là hệ thống đang sống.

---

## 8. Test

### Trên Google Sheets (menu Test)

| Test | Kịch bản | Kỳ vọng |
|---|---|---|
| T0 | Nạp 7 HV test vào STUDENT_INFO (ghi chú TEST_SEED) | 7 dòng, công thức F/G đúng |
| T1 | Kiểm tra hệ thống | 0 lỗi |
| T2 | Đánh x tuần active cho mọi tutor (19:00, 20:00, 21:00) | CHECK_SLOT có số > 0 |
| T3 | sim@test.com đặt 1 buổi | Active, quota −1, EventID có |
| T4 | 3 HV cùng slot | 3 tutor khác nhau |
| T5 | nocredit@test.com | Failed NO_CREDITS |
| T6 | low@test.com (2 buổi) | Active + email "còn 1 buổi" |
| T7 | bao@test.com (1 buổi) đặt 2 ngày | 1 Active + 1 Failed OVER_BUDGET |
| T8 | Huỷ booking Active | quota +1, Calendar event xoá, email |
| T9 | Điểm danh | Completed → NoShow |
| T10 | Archive 8/2026 → rebuild 9/2026 | `_ARCHIVE_*_2026_08` xuất hiện, "x" tháng 9 không mất |
| T11 | Đặt slot đã qua | Failed PAST_SLOT, quota không đổi |

Giả lập thời gian: Script editor → chạy `testSimulateNow('2026-09-22 18:30')`. Mọi hàm dùng `getNow_()` thấy giờ này. DASHBOARD B21 hiện cảnh báo đỏ. Xong chạy `clearSimulatedNow()` (hoặc Dọn dữ liệu test). `testSystem` cũng cảnh báo nếu còn bật.

### Harness (máy local, `node harness.js`)
50 assertions, không cần Google. Bao gồm regression cho bug #2 (T3, T8), #3 (T15), #5 (T13), #6 (T17), #9 (T14). `node formlink_test.js` 42 assertions cho cơ chế form.

---

## 9. Lịch sử phiên bản

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| v1.0 | 08/2026 | Prototype: form → sheet → tutor thủ công |
| v2.0 | 08/2026 | Production: Google Meet, email xác nhận, Round Robin |
| v2.1 | 08/2026 | `PropertiesService.ACTIVE_WEEK_START` làm nguồn sự thật tuần; `setupMonthCalendar`; scanner 7 ngày |
| v2.1 hotfix | 08/2026 | 3 bug ngày tháng: JS month zero indexed, midnight shift theo timezone, COUNTIFS lệch vì cột G có giờ |
| v3.0 | 08/2026 | Gộp toàn bộ fix, ổn định |
| v4.0 | 09/2026 | Quota theo StudentID, BOOKINGS 12 cột, 7 bug fix (tuần vắt tháng, dòng ghi chú phá sort…) |
| v5.0 | 18/09/2026 | Registration pipeline, quota theo **email**, điểm danh Active→Completed→NoShow, archive tháng, payroll, BOOKINGS 13 cột. 25/25 test |
| v5.1 | 18/09/2026 | **Tách 3 spreadsheet** (Main / Registration / Tutor). CHECK_SLOT chuyển từ công thức sang giá trị đồng bộ. Dữ liệu tháng 8 để test archive. 27/27 test |
| v5.2 | 19/09/2026 | **FormLink.gs**: nối form bất kỳ vào hệ thống, nhận diện tab response bằng sheetId, ép thứ tự câu hỏi, dựng lại trigger, form ID vào Script Properties. 39/39 test |
| **v6.0 FINAL** | 19/09/2026 | **Audit + sửa 9 bug** (mục 1). BOOKINGS 14 cột (EventID). Chặn slot đã qua. RR theo tuần. Rollover chống trễ. Rebuild giữ "x". Payroll ghi tab. `createAllTriggers` ra đời. Giả lập thời gian. Harness trung thực. 50/50 + 42/42 test |

---

## 10. Nguyên tắc kỹ thuật không được phá

1. **Cột G BOOKINGS luôn là `new Date(y,m,d)` midnight.** COUNTIFS so sánh serial number tuyệt đối; 12:00 vs 00:00 là 2 giá trị khác nhau → quota về 0.
2. **Ngày hiển thị/sort dùng `makeNoon_`** (12:00) để không lùi 1 ngày khi timezone lệch.
3. **JS month zero indexed.** `new Date(2026, 8, 1)` là 1 tháng **9**.
4. **Timezone project = Asia/Ho_Chi_Minh.** `testSystem` kiểm tra. Sai cái này thì mọi thứ lệch 7 giờ mà không báo lỗi.
5. **Thứ tự câu hỏi form đặt lịch** = Họ và tên, Student ID, Thứ 2…Chủ nhật. `processBooking_` đọc `e.values[2..10]`. FormLink ép; đừng sửa tay thứ tự trên form.
6. **`PropertiesService.ACTIVE_WEEK_START`** là tuần active duy nhất. Không tính lại từ `new Date()` ở chỗ khác.
7. **Mọi hàm cần "bây giờ" dùng `getNow_()`**, không `new Date()`, để giả lập thời gian và test được.
8. **CHECK_SLOT là cache.** Quyết định đặt/không đặt nằm ở `assignTutor_` đọc trực tiếp tutor + BOOKINGS.
9. **Gọi `clearCache_()`** đầu mỗi lần chạy có thay đổi tutor/availability (trigger đã làm; test thủ công cũng phải làm).
10. **Không xoá tab tutor / dòng BOOKINGS cũ.** Payroll và archive cần lịch sử. Tutor nghỉ → Status ≠ Active.

---

## 11. Hạn chế còn lại và tư vấn thẳng

**Những gì tôi không sửa vì vượt quá Google Sheets, anh cần biết:**

1. **Race condition 10 phút trên dropdown form.** Dropdown chỉ cập nhật khi script chạy. Hai HV cùng thấy slot cuối, cùng bấm → HV sau nhận email "hết chỗ". Không có cách nào khác với Google Forms; muốn hết hẳn phải chuyển sang web app (Apps Script HTML Service hoặc app riêng) đọc slot real time. Với quy mô 4 tutor thì chấp nhận được.
2. **`setCollectEmail(true)` yêu cầu HV đăng nhập Google.** HV không có tài khoản Google không dùng được form. Nếu gặp, đổi sang câu hỏi text "Email" ở vị trí đầu — nhưng khi đó `e.values[1]` vẫn là email nên code không đổi, chỉ mất xác thực (HV có thể gõ email người khác).
3. **Calendar event tạo trên lịch của tài khoản chạy script.** Admin đổi tài khoản → event cũ không xoá được từ tài khoản mới. Dùng 1 tài khoản Workspace riêng cho hệ thống (ví dụ `booking@thaiput.com`), không dùng tài khoản cá nhân.
4. **Quota email MailApp**: Workspace 1.500/ngày. Mỗi booking gửi 2–3 email. 100 booking/ngày mới chạm. OK.
5. **Tutor có thể gõ nhầm.** "X" hoa được chấp nhận (lowercase), "×" hay "x " có khoảng trắng: trim + lowercase xử lý. Gõ vào cột A/B thì phá dòng. Nên khoá cột A–B của tab tutor bằng Protect range.
6. **STUDENT_INFO công thức COUNTIFS quét 2000 dòng BOOKINGS.** Sau ~1 năm với 4 tutor (~5.000 booking) sẽ chậm. Khi BOOKINGS quá 1.500 dòng: archive dòng cũ hơn 6 tháng sang tab `_ARCHIVE_BOOKINGS` và nới `$2000` lên. Chưa cần ngay.
7. **Không có backup tự động.** Google Sheets có version history 30 ngày. Đủ cho tai nạn thường; nếu muốn hơn, tạo trigger tuần copy 3 file sang folder Backup (`DriveApp.getFileById(id).makeCopy()`), 10 dòng code, tôi có thể thêm.
8. **Round Robin "tuần" reset mỗi thứ 2.** Tutor bận thứ 2–3 sẽ hơi thiệt về lượng booking tuần đó so với tutor rảnh cả tuần. Đây là tính năng, không phải bug: HV đặt theo slot tutor mở, không thể ép cân bằng tuyệt đối.

**Tư vấn:** Hệ thống này đủ tốt cho 4–10 tutor, vài trăm HV. Vượt quá đó, điểm nghẽn là Google Forms (không real time) và Google Sheets (không có transaction thật). Lúc đó không vá nữa mà chuyển sang web app + database; logic nghiệp vụ trong 12 file này (quota, RR, điểm danh, archive) port sang được nguyên vẹn vì đã tách khỏi UI.

---

## 12. Troubleshooting

| Hiện tượng | Nguyên nhân thường gặp | Xử lý |
|---|---|---|
| Menu thaiput không hiện | Chưa reload sheet sau khi dán code, hoặc lỗi cú pháp ở 1 file | Reload. Apps Script → chạy `testSystem` tay xem báo lỗi file nào |
| `testSystem` báo timezone sai | Project Settings chưa đặt | Project Settings → Time zone → Ho Chi Minh |
| Booking không tự xử lý | Trigger chưa tạo hoặc form đổi | Menu 3. Tạo/cập nhật 8 trigger → Form → Kiểm tra kết nối |
| Dropdown trống | Tutor chưa đánh "x" tuần active, hoặc tuần active lệch | TUTOR sheet kiểm tra; DASHBOARD B17 xem tuần active; menu Lịch → Chuyển tuần nếu cần |
| Booking xử lý 2 lần | Trigger trùng | Menu Form → Kiểm tra (báo số trigger) → Kết nối lại |
| Quota sai / không hoàn khi huỷ | Cột G có giờ (gõ tay) hoặc là text | Xoá dòng gõ tay. Chỉ script được ghi BOOKINGS; admin chỉ sửa cột J |
| "x" tutor biến mất ngày 1 | Đang chạy Archive.gs cũ (< v6.0) | Dán lại Archive.gs v6.0; lấy lại từ `_ARCHIVE_Tutor-*` |
| Email đặt lịch có link Meet nhưng lịch Calendar không có | Calendar API chưa bật hoặc chưa cấp quyền | Services → Calendar; chạy `testSystem` để cấp quyền lại |
| Huỷ nhưng lịch Calendar còn | Booking tạo trước v6.0 (không có EventID) | Xoá tay trên Calendar 1 lần; booking mới tự xoá |
| DASHBOARD B21 cảnh báo đỏ | Giả lập thời gian đang bật | Menu Test → Tắt giả lập thời gian |
| Response form vào tab "Form Responses 1" | Form nối trước khi có FormLink | Menu Form → Kết nối lại tất cả Form |

---

*Hết. Hệ thống ở trạng thái sẵn sàng go live sau khi qua 10 bước mục 5 với `testSystem` 0 lỗi.*

<!-- END FILE: docs/TAI_LIEU_TONG_HOP_v6.0.md -->

---

## `templates/THAIPUT_MAIN_v6.0.md`

*Ngày tạo trong Project: 2026-09-24T11:02:42Z*

<!-- BEGIN FILE: templates/THAIPUT_MAIN_v6.0.md | bytes=9738 | sha256=f994c323a45cc2266a784e736eff2dcd287efbfd81b49b02326a7a2a3ae443f4 | created=2026-09-24T11:02:42Z -->
# THAIPUT_MAIN_v6.0.xlsx (bản text để tra cứu)

Bản mô tả dạng văn bản của file mẫu `THAIPUT_MAIN_v6.0.xlsx` (thaiput v6.0.1). File .xlsx gốc nằm trong `templates/` của repo GitHub. Ô bắt đầu bằng `=` là công thức.

## Danh sách tab

| Tab | Số dòng | Số cột | Ẩn |
|---|---|---|---|
| DASHBOARD | 22 | 6 |  |
| STUDENT_INFO | 7 | 10 |  |
| CHECK_SLOT | 39 | 16 |  |
| BOOKINGS | 1 | 14 |  |
| ĐĂNG KÝ MỚI | 1 | 11 |  |
| PAYROLL_REPORT | 4 | 7 |  |
| HUONG_DAN | 30 | 1 |  |

## Tab `DASHBOARD`

| thaiput — Booking System v6.0 FINAL |  |
|---|---|
| Kiến trúc 3 spreadsheet: Main + Registration + Tutor |  |
| CẤU HÌNH |  |
| Admin email | (điền vào Config.gs) |
| Registration Spreadsheet ID | (điền sau khi upload lên Google Sheets) |
| Tutor Spreadsheet ID | (điền sau khi upload lên Google Sheets) |
| LIÊN KẾT |  |
| Form đặt lịch | (tạo bởi setupAllForms) |
| Form đăng ký | (tạo bởi setupAllForms) |
| Booking Form ID |  |
| Registration Form ID |  |
| VẬN HÀNH (script tự cập nhật mỗi 10 phút) |  |
| Tuần active | (chưa chạy) |
| Bookings tuần này | (chưa chạy) |
| Tutor Active | (chưa chạy) |
| Lần đồng bộ cuối | (chưa chạy) |
| Giả lập thời gian |  |
| HV Active | =COUNTIF(STUDENT_INFO!I:I,"Active") |

## Tab `STUDENT_INFO`

| StudentID | Email | Họ và tên | Gói đăng ký | TotalSessions | SessionsUsed | SessionsRemaining | Ngày kích hoạt | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| S001 | hoa@example.com | Lê Thị Hoa | Gói 12 buổi | 12 | =COUNTIFS(BOOKINGS!$D$2:$D$2000,$B2,BOOKINGS!$J$2:$J$2000,"Active")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B2,BOOKINGS!$J$2:$J$2000,"Completed")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B2,BOOKINGS!$J$2:$J$2000,"NoShow") | =MAX(0,E2-F2) | 20/07/2026 | Active | Kích hoạt 20/07/2026 |
| S002 | dung@example.com | Nguyễn Văn Dũng | Gói 24 buổi | 24 | =COUNTIFS(BOOKINGS!$D$2:$D$2000,$B3,BOOKINGS!$J$2:$J$2000,"Active")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B3,BOOKINGS!$J$2:$J$2000,"Completed")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B3,BOOKINGS!$J$2:$J$2000,"NoShow") | =MAX(0,E3-F3) | 20/07/2026 | Active | Kích hoạt 20/07/2026 |
| S003 | minhanh@example.com | Trần Minh Anh | Gói 12 buổi | 12 | =COUNTIFS(BOOKINGS!$D$2:$D$2000,$B4,BOOKINGS!$J$2:$J$2000,"Active")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B4,BOOKINGS!$J$2:$J$2000,"Completed")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B4,BOOKINGS!$J$2:$J$2000,"NoShow") | =MAX(0,E4-F4) | 20/07/2026 | Active | Kích hoạt 20/07/2026 |
| S004 | bao@example.com | Phạm Quốc Bảo | Gói 48 buổi | 48 | =COUNTIFS(BOOKINGS!$D$2:$D$2000,$B5,BOOKINGS!$J$2:$J$2000,"Active")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B5,BOOKINGS!$J$2:$J$2000,"Completed")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B5,BOOKINGS!$J$2:$J$2000,"NoShow") | =MAX(0,E5-F5) | 20/07/2026 | Active | Kích hoạt 20/07/2026 |
| S005 | linh@example.com | Võ Thuỳ Linh | Gói 12 buổi | 12 | =COUNTIFS(BOOKINGS!$D$2:$D$2000,$B6,BOOKINGS!$J$2:$J$2000,"Active")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B6,BOOKINGS!$J$2:$J$2000,"Completed")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B6,BOOKINGS!$J$2:$J$2000,"NoShow") | =MAX(0,E6-F6) | 20/07/2026 | Active | Kích hoạt 20/07/2026 |
| S006 | tam@example.com | Bùi Thanh Tâm | Gói 12 buổi | 12 | =COUNTIFS(BOOKINGS!$D$2:$D$2000,$B7,BOOKINGS!$J$2:$J$2000,"Active")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B7,BOOKINGS!$J$2:$J$2000,"Completed")+COUNTIFS(BOOKINGS!$D$2:$D$2000,$B7,BOOKINGS!$J$2:$J$2000,"NoShow") | =MAX(0,E7-F7) | 20/07/2026 | Active | Kích hoạt 20/07/2026 |

## Tab `CHECK_SLOT`

| Ngày | Thứ | 17:00 - 17:25 | 17:30 - 17:55 | 18:00 - 18:25 | 18:30 - 18:55 | 19:00 - 19:25 | 19:30 - 19:55 | 20:00 - 20:25 | 20:30 - 20:55 | 21:00 - 21:25 | 21:30 - 21:55 | 22:00 - 22:25 | 22:30 - 22:55 | 23:00 - 23:25 | 23:30 - 23:55 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01/08/2026 | Thứ 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 02/08/2026 | Chủ nhật | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 03/08/2026 | Thứ 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 04/08/2026 | Thứ 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 05/08/2026 | Thứ 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 06/08/2026 | Thứ 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 07/08/2026 | Thứ 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 08/08/2026 | Thứ 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 09/08/2026 | Chủ nhật | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10/08/2026 | Thứ 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11/08/2026 | Thứ 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12/08/2026 | Thứ 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13/08/2026 | Thứ 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14/08/2026 | Thứ 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 15/08/2026 | Thứ 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16/08/2026 | Chủ nhật | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 17/08/2026 | Thứ 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18/08/2026 | Thứ 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19/08/2026 | Thứ 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20/08/2026 | Thứ 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 21/08/2026 | Thứ 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 22/08/2026 | Thứ 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 23/08/2026 | Chủ nhật | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 24/08/2026 | Thứ 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 25/08/2026 | Thứ 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 26/08/2026 | Thứ 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 27/08/2026 | Thứ 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 28/08/2026 | Thứ 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 29/08/2026 | Thứ 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 30/08/2026 | Chủ nhật | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 31/08/2026 | Thứ 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 01/09/2026 | Thứ 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 02/09/2026 | Thứ 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 03/09/2026 | Thứ 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 04/09/2026 | Thứ 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 05/09/2026 | Thứ 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 06/09/2026 | Chủ nhật | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 07/09/2026 | Thứ 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Tab `BOOKINGS`

| BookingID | StudentID | StudentName | StudentEmail | TutorID | TutorName | Date | TimeSlot | MeetLink | Status | CreatedAt | FailReason | AttendanceMarkedAt | EventID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Tab `ĐĂNG KÝ MỚI`

| Timestamp | Email | Họ và tên | Student ID | Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 | Thứ 7 | Chủ nhật |
|---|---|---|---|---|---|---|---|---|---|---|

## Tab `PAYROLL_REPORT`

| BÁO CÁO LƯƠNG TUTOR |  |  |  |  |  |  |
|---|---|---|---|---|---|---|
| Từ ngày: | 01/08/2026 | Đến ngày: | 31/08/2026 |  |  |  |
| Tutor | Completed | NoShow | Active | Tổng billable | Đơn giá | Thành tiền |

## Tab `HUONG_DAN`

| HƯỚNG DẪN SỬ DỤNG — thaiput v6.0 FINAL |
|---|
| KIẾN TRÚC 3 SPREADSHEET: |
|   1. THAIPUT_MAIN: sheet chính, chứa Apps Script — STUDENT_INFO, CHECK_SLOT, BOOKINGS (14 cột), PAYROLL |
|   2. THAIPUT_REGISTRATION: form đăng ký ghi vào đây — PACKAGES + STUDENT_REGISTRATION |
|   3. THAIPUT_TUTOR: tutor tự đánh "x" — TUTOR_INFO + 4 tab tutor + archive hàng tháng |
| TRIỂN KHAI (làm theo thứ tự): |
|   1. Upload 3 file XLSX lên Drive → mở bằng Google Sheets |
|   2. Copy Spreadsheet ID của REGISTRATION và TUTOR (đoạn giữa /d/ và /edit trên URL) |
|   3. Trong MAIN: Extensions → Apps Script → dán 12 file .gs |
|   4. Project Settings → Time zone = (GMT+07:00) Ho Chi Minh; bật "Show appsscript.json" → dán appsscript.json |
|   5. Services (+) → Google Calendar API → Add |
|   6. Config.gs: điền ADMIN_EMAIL, TUTOR_SS_ID, REGISTRATION_SS_ID |
|   7. Reload sheet → menu thaiput → 1. Kiểm tra hệ thống (phải 0 lỗi) |
|   8. Menu → 2. Tạo 2 Form mới + kết nối |
|   9. Menu → 3. Tạo/cập nhật 8 trigger |
|   10. Menu → Form → Kiểm tra kết nối Form (phải 0 vấn đề) |
| LUỒNG DỮ LIỆU: |
|   HV đăng ký (Form) → STUDENT_REGISTRATION (Registration) → admin đánh "Đã thanh toán" cột E |
|   → menu Học viên → Kích hoạt → STUDENT_INFO (Main) + email welcome |
|   Tutor đánh "x" (Tutor) → script đồng bộ CHECK_SLOT (Main) mỗi 10 phút + sau mỗi booking/huỷ |
|   HV đặt lịch (Form) → BOOKINGS (Main) + Calendar/Meet + email |
|   Huỷ: đổi cột J thành Cancelled → tự hoàn buổi, xoá lịch Calendar, email |
| TEST: |
|   Menu → Test → Chạy tất cả (T0 → T11), xem log Extensions → Apps Script → Executions |
|   Xong: menu → Test → Dọn dữ liệu test |
|   Dữ liệu tháng 8/2026 nạp sẵn trong tutor tabs để test archive (T10) |

<!-- END FILE: templates/THAIPUT_MAIN_v6.0.md -->

---

## `templates/THAIPUT_REGISTRATION_v6.0.md`

*Ngày tạo trong Project: 2026-09-24T11:02:42Z*

<!-- BEGIN FILE: templates/THAIPUT_REGISTRATION_v6.0.md | bytes=2278 | sha256=5552479a7cc4dd52b17f2bdd0a1b1881eb85b0d1fd4076b37880ffddea614d51 | created=2026-09-24T11:02:42Z -->
# THAIPUT_REGISTRATION_v6.0.xlsx (bản text để tra cứu)

Bản mô tả dạng văn bản của file mẫu `THAIPUT_REGISTRATION_v6.0.xlsx` (thaiput v6.0.1). File .xlsx gốc nằm trong `templates/` của repo GitHub. Ô bắt đầu bằng `=` là công thức.

## Danh sách tab

| Tab | Số dòng | Số cột | Ẩn |
|---|---|---|---|
| PACKAGES | 4 | 4 |  |
| STUDENT_REGISTRATION | 9 | 9 |  |

## Tab `PACKAGES`

| Tên gói | Số buổi | Học phí (VND) | Ghi chú |
|---|---|---|---|
| Gói 12 buổi | 12 | 1560000 |  |
| Gói 24 buổi | 24 | 2880000 | Tiết kiệm 7.5% |
| Gói 48 buổi | 48 | 5280000 | Tiết kiệm 15% |

## Tab `STUDENT_REGISTRATION`

| Timestamp | Email | Họ và tên | Gói đăng ký | Trạng thái TT | StudentID | Số buổi | Học phí | Synced |
|---|---|---|---|---|---|---|---|---|
| 15/07/2026 10:00 | hoa@example.com | Lê Thị Hoa | Gói 12 buổi | Đã thanh toán | S001 | =VLOOKUP(D2,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D2,PACKAGES!A:C,3,FALSE) | Yes |
| 16/07/2026 10:00 | dung@example.com | Nguyễn Văn Dũng | Gói 24 buổi | Đã thanh toán | S002 | =VLOOKUP(D3,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D3,PACKAGES!A:C,3,FALSE) | Yes |
| 17/07/2026 10:00 | minhanh@example.com | Trần Minh Anh | Gói 12 buổi | Đã thanh toán | S003 | =VLOOKUP(D4,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D4,PACKAGES!A:C,3,FALSE) | Yes |
| 18/07/2026 10:00 | bao@example.com | Phạm Quốc Bảo | Gói 48 buổi | Đã thanh toán | S004 | =VLOOKUP(D5,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D5,PACKAGES!A:C,3,FALSE) | Yes |
| 19/07/2026 10:00 | linh@example.com | Võ Thuỳ Linh | Gói 12 buổi | Đã thanh toán | S005 | =VLOOKUP(D6,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D6,PACKAGES!A:C,3,FALSE) | Yes |
| 20/07/2026 10:00 | nam@example.com | Đặng Hoàng Nam | Gói 24 buổi | Chưa thanh toán | S006 | =VLOOKUP(D7,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D7,PACKAGES!A:C,3,FALSE) |  |
| 21/07/2026 10:00 | tam@example.com | Bùi Thanh Tâm | Gói 12 buổi | Đã thanh toán | S007 | =VLOOKUP(D8,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D8,PACKAGES!A:C,3,FALSE) | Yes |
| 22/07/2026 10:00 | ngan@example.com | Lý Kim Ngân | Gói 48 buổi | Chưa thanh toán | S008 | =VLOOKUP(D9,PACKAGES!A:B,2,FALSE) | =VLOOKUP(D9,PACKAGES!A:C,3,FALSE) |  |

<!-- END FILE: templates/THAIPUT_REGISTRATION_v6.0.md -->

---

## `templates/THAIPUT_TUTOR_v6.0.md`

*Ngày tạo trong Project: 2026-09-24T11:02:43Z*

<!-- BEGIN FILE: templates/THAIPUT_TUTOR_v6.0.md | bytes=13072 | sha256=ae6fb0bd5e25fa004b158f5ad937741e6bc8c8aa3b3f5fc7b1a53624076036ba | created=2026-09-24T11:02:43Z -->
# THAIPUT_TUTOR_v6.0.xlsx (bản text để tra cứu)

Bản mô tả dạng văn bản của file mẫu `THAIPUT_TUTOR_v6.0.xlsx` (thaiput v6.0.1). File .xlsx gốc nằm trong `templates/` của repo GitHub. Ô bắt đầu bằng `=` là công thức.

## Danh sách tab

| Tab | Số dòng | Số cột | Ẩn |
|---|---|---|---|
| TUTOR_INFO | 5 | 6 |  |
| Tutor-Vân | 39 | 16 |  |
| Tutor-Ánh | 39 | 16 |  |
| Tutor-Lan | 39 | 16 |  |
| Tutor-Minh | 39 | 16 |  |

## Tab `TUTOR_INFO`

| TutorID | Tên tutor | Email | Status | Đơn giá/buổi (VND) | Ghi chú |
|---|---|---|---|---|---|
| T001 | Vân | van@thaiput.com | Active | 120000 |  |
| T002 | Ánh | anh@thaiput.com | Active | 120000 |  |
| T003 | Lan | lan@thaiput.com | Active | 100000 |  |
| T004 | Minh | minh@thaiput.com | Active | 100000 |  |

## Tab `Tutor-Vân`

| Ngày | Thứ | 17:00 - 17:25 | 17:30 - 17:55 | 18:00 - 18:25 | 18:30 - 18:55 | 19:00 - 19:25 | 19:30 - 19:55 | 20:00 - 20:25 | 20:30 - 20:55 | 21:00 - 21:25 | 21:30 - 21:55 | 22:00 - 22:25 | 22:30 - 22:55 | 23:00 - 23:25 | 23:30 - 23:55 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03/08/2026 | Thứ 2 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 04/08/2026 | Thứ 3 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 05/08/2026 | Thứ 4 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 06/08/2026 | Thứ 5 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 07/08/2026 | Thứ 6 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 08/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 09/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 10/08/2026 | Thứ 2 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 11/08/2026 | Thứ 3 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 12/08/2026 | Thứ 4 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 13/08/2026 | Thứ 5 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 14/08/2026 | Thứ 6 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 15/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 16/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 17/08/2026 | Thứ 2 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 18/08/2026 | Thứ 3 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 19/08/2026 | Thứ 4 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 20/08/2026 | Thứ 5 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 21/08/2026 | Thứ 6 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 22/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 23/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 24/08/2026 | Thứ 2 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 25/08/2026 | Thứ 3 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 26/08/2026 | Thứ 4 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 27/08/2026 | Thứ 5 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 28/08/2026 | Thứ 6 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 29/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 30/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 31/08/2026 | Thứ 2 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 01/09/2026 | Thứ 3 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 02/09/2026 | Thứ 4 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 03/09/2026 | Thứ 5 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 04/09/2026 | Thứ 6 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |
| 05/09/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 06/09/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 07/09/2026 | Thứ 2 |  |  |  |  | x | x | x | x | x | x |  |  |  |  |

## Tab `Tutor-Ánh`

| Ngày | Thứ | 17:00 - 17:25 | 17:30 - 17:55 | 18:00 - 18:25 | 18:30 - 18:55 | 19:00 - 19:25 | 19:30 - 19:55 | 20:00 - 20:25 | 20:30 - 20:55 | 21:00 - 21:25 | 21:30 - 21:55 | 22:00 - 22:25 | 22:30 - 22:55 | 23:00 - 23:25 | 23:30 - 23:55 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03/08/2026 | Thứ 2 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 04/08/2026 | Thứ 3 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 05/08/2026 | Thứ 4 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 06/08/2026 | Thứ 5 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 07/08/2026 | Thứ 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 08/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 09/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 10/08/2026 | Thứ 2 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 11/08/2026 | Thứ 3 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 12/08/2026 | Thứ 4 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 13/08/2026 | Thứ 5 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 14/08/2026 | Thứ 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 15/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 16/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 17/08/2026 | Thứ 2 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 18/08/2026 | Thứ 3 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 19/08/2026 | Thứ 4 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 20/08/2026 | Thứ 5 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 21/08/2026 | Thứ 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 22/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 23/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 24/08/2026 | Thứ 2 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 25/08/2026 | Thứ 3 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 26/08/2026 | Thứ 4 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 27/08/2026 | Thứ 5 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 28/08/2026 | Thứ 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 29/08/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 30/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 31/08/2026 | Thứ 2 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 01/09/2026 | Thứ 3 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 02/09/2026 | Thứ 4 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 03/09/2026 | Thứ 5 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |
| 04/09/2026 | Thứ 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 05/09/2026 | Thứ 7 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 06/09/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 07/09/2026 | Thứ 2 |  |  |  |  |  |  | x | x | x | x | x | x |  |  |

## Tab `Tutor-Lan`

| Ngày | Thứ | 17:00 - 17:25 | 17:30 - 17:55 | 18:00 - 18:25 | 18:30 - 18:55 | 19:00 - 19:25 | 19:30 - 19:55 | 20:00 - 20:25 | 20:30 - 20:55 | 21:00 - 21:25 | 21:30 - 21:55 | 22:00 - 22:25 | 22:30 - 22:55 | 23:00 - 23:25 | 23:30 - 23:55 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01/08/2026 | Thứ 7 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 02/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03/08/2026 | Thứ 2 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 04/08/2026 | Thứ 3 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 05/08/2026 | Thứ 4 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 06/08/2026 | Thứ 5 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 07/08/2026 | Thứ 6 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 08/08/2026 | Thứ 7 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 09/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 10/08/2026 | Thứ 2 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 11/08/2026 | Thứ 3 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 12/08/2026 | Thứ 4 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 13/08/2026 | Thứ 5 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 14/08/2026 | Thứ 6 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 15/08/2026 | Thứ 7 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 16/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 17/08/2026 | Thứ 2 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 18/08/2026 | Thứ 3 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 19/08/2026 | Thứ 4 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 20/08/2026 | Thứ 5 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 21/08/2026 | Thứ 6 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 22/08/2026 | Thứ 7 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 23/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 24/08/2026 | Thứ 2 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 25/08/2026 | Thứ 3 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 26/08/2026 | Thứ 4 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 27/08/2026 | Thứ 5 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 28/08/2026 | Thứ 6 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 29/08/2026 | Thứ 7 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 30/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 31/08/2026 | Thứ 2 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 01/09/2026 | Thứ 3 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 02/09/2026 | Thứ 4 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 03/09/2026 | Thứ 5 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 04/09/2026 | Thứ 6 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 05/09/2026 | Thứ 7 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |
| 06/09/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 07/09/2026 | Thứ 2 | x | x | x | x | x | x |  |  |  |  |  |  |  |  |

## Tab `Tutor-Minh`

| Ngày | Thứ | 17:00 - 17:25 | 17:30 - 17:55 | 18:00 - 18:25 | 18:30 - 18:55 | 19:00 - 19:25 | 19:30 - 19:55 | 20:00 - 20:25 | 20:30 - 20:55 | 21:00 - 21:25 | 21:30 - 21:55 | 22:00 - 22:25 | 22:30 - 22:55 | 23:00 - 23:25 | 23:30 - 23:55 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01/08/2026 | Thứ 7 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 02/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03/08/2026 | Thứ 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04/08/2026 | Thứ 3 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 05/08/2026 | Thứ 4 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 06/08/2026 | Thứ 5 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 07/08/2026 | Thứ 6 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 08/08/2026 | Thứ 7 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 09/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 10/08/2026 | Thứ 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 11/08/2026 | Thứ 3 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 12/08/2026 | Thứ 4 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 13/08/2026 | Thứ 5 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 14/08/2026 | Thứ 6 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 15/08/2026 | Thứ 7 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 16/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 17/08/2026 | Thứ 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 18/08/2026 | Thứ 3 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 19/08/2026 | Thứ 4 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 20/08/2026 | Thứ 5 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 21/08/2026 | Thứ 6 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 22/08/2026 | Thứ 7 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 23/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 24/08/2026 | Thứ 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 25/08/2026 | Thứ 3 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 26/08/2026 | Thứ 4 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 27/08/2026 | Thứ 5 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 28/08/2026 | Thứ 6 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 29/08/2026 | Thứ 7 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 30/08/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 31/08/2026 | Thứ 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 01/09/2026 | Thứ 3 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 02/09/2026 | Thứ 4 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 03/09/2026 | Thứ 5 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 04/09/2026 | Thứ 6 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 05/09/2026 | Thứ 7 |  |  | x | x | x | x | x | x |  |  |  |  |  |  |
| 06/09/2026 | Chủ nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 07/09/2026 | Thứ 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

<!-- END FILE: templates/THAIPUT_TUTOR_v6.0.md -->

---
