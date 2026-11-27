# Hướng dẫn đọc file trong project thaiput v8

*27/11/2026. Mô tả các file trong claude.ai project sau đợt dọn dẹp ngày 27/11 (bản code 8.1.4).*

## Thay đổi so với bản trước

Bản đầu tiên (27/11). Sửa tối 27/11: dòng "Làm bằng Claude Code trên GitHub" ghi trạng thái repo sau khi đồng bộ.

## 1. Thứ tự đọc nhanh

1. `v8/PROJECT_MEMORY.md`: đọc đầu tiên, ở mọi chat mới. File bàn giao: trạng thái hiện tại, việc kế tiếp, luật làm việc.
2. `v8/PROGRESS.md`, chỉ phần đầu: từ đầu file tới trước tiêu đề "Chunk 5Q phần A". Phần này ghi trạng thái mới nhất, xếp từ mới tới cũ.
3. `v8/BACKLOG.md`: các dòng "Thay đổi so với bản" ở đầu file và mục A (câu hỏi chờ chốt). Chú ý các dòng có cột "Chặn" trùng sub chunk đang làm.
4. Sau đó đọc theo việc, tra bảng ở mục 2.

Chat mới không thấy chat cũ. Mọi thứ cần biết nằm trong file của project, nên không bỏ qua bước 1.

## 2. Bảng tra theo việc

| Việc | File cần đọc | Phần cần đọc |
|---|---|---|
| Làm sub chunk code | `v8/plan/KE_HOACH_5J_5P.md`; `v8/BACKLOG.md`; `v8/CLAUDE.md`; `v8/repo/BOOTSTRAP.md` | Plan: mục 0 (luật mọi chunk), phần của sub chunk ở mục 2, mục 4 (bảng lỗ hổng). BACKLOG: mục A, các câu chặn sub chunk đó. CLAUDE.md: các luật đánh số và mục "Quy ước làm việc". BOOTSTRAP: cách dựng repo |
| Dán code lên STAGING | `v8/HUONG_DAN_PHAT_HANH.md`; `v8/dist/Code.gs`, `v8/dist/Index.html`, `v8/dist/appsscript.json` | Mục 2 (mỗi lần cập nhật), mục 3 (nâng STAGING từ 8.0.10 lên 8.1.4), mục 4 (quay lui). Dựng STAGING mới: `v8/HUONG_DAN_TRIEN_KHAI_WORKSPACE.md` mục 3. Không đọc `dist/` vào chat, chỉ đưa file cho người dán |
| Admin vận hành hằng ngày | `v8/HUONG_DAN_VAN_HANH.md` | Phần H (việc hằng ngày, tuần, tháng), Phần C (menu thaiput), Phần L (xử lý tình huống, L4 là "Đặt thay"), Phần B (98 ô CONFIG), Phần K (thao tác trên từng tab) |
| Rà BACKLOG | `v8/BACKLOG.md`; `v8/plan/KE_HOACH_5J_5P.md` | BACKLOG: mục A (chờ trả lời), B (câu cũ chưa thấy trả lời), C (để sau), D (còn phải kiểm trên Google thật), "Đã chốt". Rà ở lượt cuối của chunk 5, sau 5N và 5O; coder nhắc lúc đó |
| Go live chunk 6 | `v8/plan/KE_HOACH_5J_5P.md`; `v8/HUONG_DAN_PHAT_HANH.md`; `v8/HUONG_DAN_TRIEN_KHAI_WORKSPACE.md`; `v8/docs/04_CHECKLIST.md`; `v8/HUONG_DAN_VAN_HANH.md` | Plan: mục 5. Phát hành: mục 6. Triển khai: mục 7. Checklist: phần B, C, D. Vận hành: Phần C, nhóm "Chuyển hệ thống". Hai mục 6 và 7 chỉ là ghi chú tạm, hướng dẫn go live mới viết khi vào chunk 6 |
| Thử tải | `v8/HUONG_DAN_THU_TAI.md`; `v8/loadtest/run.js`, `v8/loadtest/browser.js` | Mục 1 (đo gì), mục 2 (chuẩn bị), mục 3 (mỗi lượt thử), mục 4 (dọn), mục 5 (an toàn), mục 6 (khác biệt với người thật). Chỉ chạy trên STAGING |
| Làm bằng Claude Code trên GitHub | `v8/HUONG_DAN_GITHUB_CLAUDE_CODE.md`; `v8/CLAUDE.md`; `v8/README.md` | Hướng dẫn: mục 1 đến 4. CLAUDE.md: mục "Làm việc bằng Claude Code". README: Cấu trúc, Lệnh. Repo `s3894288/thaiput_v8.1.4`: main là 8.1.4 (đã đồng bộ với project 27/11); nhánh `claude/wizardly-gates-8xzfbn` (PR 1, chưa gộp) là 8.1.9, có BACKLOG và PROGRESS riêng. Xem `v8/PROJECT_MEMORY.md` mục 3 |
| Dựng lại repo trong chat | `v8/repo/BOOTSTRAP.md`; `v8/repo/SRC_BUNDLE.txt`; `v8/repo/TEST_BUNDLE.txt` | BOOTSTRAP: mục 1 (giải bundle, cài, chạy test) và mục 4 (cuối việc: đóng lại bundle). Chỉ đưa bundle cho công cụ giải, không đọc vào chat |
| Tra quyết định nghiệp vụ | `v8/docs/01_QUYET_DINH_50_CAU.md`; `v8/plan/TU_VAN_BU_BUOI.md`; `v8/policy/` | 01: 7 nhóm quyết định (mục 1 đến 7) và các mục "Thay đổi ngày ..." cuối file. TU_VAN_BU_BUOI: luật bù buổi, bù ngày. Policy: luật nhìn từ học viên và tutor. Lý do một thiết kế: `v8/plan/TRA_LOI_01_11.md` |
| Tra lịch sử cũ | Thư mục `archive/` trên GitHub, repo `s3894288/thaiput_v8.1.4` | `v8/archive/` đã xoá khỏi project ngày 27/11. Đọc thư mục `archive/` trên GitHub repo `s3894288/thaiput_v8.1.4`. Lịch sử gần: tìm trong `v8/PROGRESS.md` bằng `project_search` |

## 3. Danh mục file

Tổng cộng **36 file** trong project. Cỡ tính bằng KB (1 KB = 1.024 byte), làm tròn tới số nguyên; "< 1" là dưới nửa KB. Tên file viết đầy đủ đường dẫn trong project.

### Gốc `v8/`

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/PROJECT_MEMORY.md` | Bàn giao giữa các chat: trạng thái hiện tại, việc kế tiếp, luật làm việc (mới 27/11, thay KHOI_DONG_CHAT_MOI.md) | 18 | Đầu mọi chat mới, luôn đọc trước | Cập nhật ở cuối mỗi việc |
| `v8/HUONG_DAN_DOC_PROJECT.md` | File này: bản đồ các file trong project và cách đọc | 14 | Khi cần biết file nào chứa gì | Cập nhật khi thêm, xoá, đổi tên file |
| `v8/PROGRESS.md` | Tiến độ từng chunk: làm gì, kết quả test, việc của admin, giới hạn còn lại | 72 | Đầu mọi việc code (chỉ phần đầu); tra lịch sử bằng tìm kiếm | Lớn; không đọc từ đầu tới cuối |
| `v8/BACKLOG.md` | Câu hỏi chờ chốt, việc để sau, việc còn phải kiểm trên Google thật, mục đã chốt | 18 | Đầu mọi việc code; khi rà BACKLOG | Mục chưa duyệt chỉ ghi ở đây |
| `v8/CLAUDE.md` | Luật kỹ thuật đánh số, quy ước làm việc, cách làm bằng Claude Code | 29 | Trước khi sửa code | Bản trên GitHub cũng là file này |
| `v8/README.md` | Giới thiệu repo: cấu trúc thư mục, lệnh Node, cách đưa code lên Apps Script | 4 | Lần đầu làm quen với repo |  |
| `v8/HUONG_DAN_VAN_HANH.md` | Hướng dẫn admin vận hành: CONFIG, menu, email, việc hằng ngày, tình huống, đăng nhập Google (Phần A đến M) | 102 | Khi cần chỉ admin cách làm hoặc xử lý tình huống | Rất lớn, chỉ tra theo Phần |
| `v8/HUONG_DAN_PHAT_HANH.md` | Phát hành, cập nhật, quay lui; nâng STAGING lên 8.1.4 (mục 3) | 18 | Khi dán code lên STAGING hoặc quay lui | Mục 6 go live chưa viết lại |
| `v8/HUONG_DAN_THU_TAI.md` | Thử tải trên STAGING: chuẩn bị, mỗi lượt thử, dọn, an toàn | 8 | Khi thử tải | Chỉ chạy trên STAGING |
| `v8/HUONG_DAN_TRIEN_KHAI_WORKSPACE.md` | Triển khai trên Google Workspace: 2 môi trường, dựng STAGING mới, chạy thử đầu cuối, sự cố, email | 43 | Khi dựng môi trường mới hoặc xử lý sự cố hệ thống | Lớn, chỉ tra theo mục |
| `v8/HUONG_DAN_GITHUB_CLAUDE_CODE.md` | Đưa repo lên GitHub, mở bằng Claude Code, đưa code lên Apps Script (dán tay hoặc clasp) | 5 | Khi làm việc bằng Claude Code trên GitHub |  |
| `v8/THIET_KE_GIAO_DIEN.md` | Thiết kế giao diện 19/10: màu, chữ, khối | 3 | Khi sửa giao diện | Thiết kế cũ, kiểm lại với code |
| `v8/CLEANUP_REPORT.md` | Báo cáo dọn dẹp project ngày 30/10 (bản 8.0.10) | 17 | Chỉ khi cần biết file v6 cũ đã bỏ và vì sao | Nhắc tới thư mục archive/ đã xoá khỏi project 27/11 |

### Thư mục `v8/dist/` (bản dán tay)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/dist/Code.gs` | Code.gs gộp từ 38 file trong src/, bản 8.1.4 | 755 | Chỉ khi cần dán lên Apps Script hoặc tra một hàm | Rất lớn, không đọc vào chat; không sửa tay; sinh từ src/ |
| `v8/dist/Index.html` | Giao diện gộp thành một file HTML | 179 | Như trên | Lớn, không đọc vào chat; không sửa tay; sinh từ src/ |
| `v8/dist/appsscript.json` | Manifest dự án Apps Script chính (quyền, cấu hình) | 1 | Khi đổi quyền hoặc dán code | Không sửa tay; sinh từ src/ |

### Thư mục `v8/dist_google_login/` (dự án phụ đăng nhập Google cho admin)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/dist_google_login/GoogleLogin.gs` | Mã dự án phụ: hỏi Google ai đang đăng nhập, ký kết quả, chuyển sang trang chính | 3 | Khi cài hoặc sửa đăng nhập Google (HUONG_DAN_VAN_HANH.md Phần M) | Không sửa tay; sinh từ companion/ trong bundle |
| `v8/dist_google_login/appsscript.json` | Manifest của dự án phụ | < 1 | Như trên | Không sửa tay |

### Thư mục `v8/docs/` (đặc tả đã chốt)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/docs/01_QUYET_DINH_50_CAU.md` | Bảng chốt 50 quyết định nghiệp vụ, khoá CONFIG tương ứng, nhật ký thay đổi cuối file | 23 | Khi tra một luật nghiệp vụ | Nguồn quyết định nghiệp vụ |
| `v8/docs/02_PLAN_CODE.md` | Plan code: kiến trúc, cấu trúc dữ liệu, luật viết thành hàm, cấu trúc file | 29 | Khi cần hiểu kiến trúc hoặc cấu trúc dữ liệu | Viết từ bản v7, một số chỗ cũ |
| `v8/docs/03_KICH_BAN_TEST_40.md` | 40 kịch bản test và dữ liệu mẫu | 18 | Khi thêm hoặc đối chiếu kịch bản test | Không tự sửa kết quả mong đợi (luật 15 trong CLAUDE.md) |
| `v8/docs/04_CHECKLIST.md` | Checklist từ chuẩn bị đến vận hành: A chuẩn bị, B test STAGING, C go live, D 7 ngày đầu, E sổ tay sự cố | 11 | Khi test STAGING thật và khi go live |  |
| `v8/docs/06_HUONG_DAN_TEN_MIEN_WORKSPACE.md` | Mua tên miền, cài Google Workspace, bản ghi DNS, gắn vào Google Sites | 12 | Khi làm phần tên miền và Workspace | Dùng tên miền ví dụ thaiput.vn |

### Thư mục `v8/loadtest/` (công cụ thử tải)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/loadtest/run.js` | Công cụ thử tải bằng Node: người ảo cùng bấm Đặt | 9 | Khi thử tải (HUONG_DAN_THU_TAI.md) | Chỉ STAGING |
| `v8/loadtest/browser.js` | Thử bằng trình duyệt thật (Playwright) | 5 | Như trên | Chỉ STAGING |

### Thư mục `v8/plan/` (kế hoạch)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/plan/KE_HOACH_5J_5P.md` | Kế hoạch sub chunk 5J đến 5Q: luật mọi chunk (mục 0), chi tiết (mục 2), lỗ hổng (mục 4), go live chunk 6 (mục 5) | 34 | Trước mỗi sub chunk code; khi vào chunk 6 | Bảng số phiên bản trong plan là số cũ |
| `v8/plan/KE_HOACH_SAU_GO_LIVE.md` | Kế hoạch sau go live: từ v8 lên v9 (web app riêng, database thật) | 10 | Khi bàn việc sau go live | Đã duyệt 01/11, chờ hiệu lệnh |
| `v8/plan/LO_TRINH_V8_TOI_CUOI.md` | Lộ trình v8 từ hôm nay tới bước cuối | 7 | Khi cần nhìn toàn cảnh tiến trình | Ngày tháng là ước lượng |
| `v8/plan/TRA_LOI_01_11.md` | Trả lời và tư vấn 01/11: hạn gói, gửi email, đăng nhập, lịch nhắc, lưu trữ, chuyển hệ thống, gói học | 26 | Khi cần lý do của một thiết kế | Chỉ tra theo mục |
| `v8/plan/TRA_LOI_29_10.md` | Trả lời các câu hỏi ngày 29/10 (hạn mức gửi email và các câu khác) | 4 | Khi cần số liệu hạn mức gửi email | Có phần đã được 01/11 thay |
| `v8/plan/TU_VAN_BU_BUOI.md` | Luật bù buổi, bù ngày (chốt 01/11) | 22 | Khi tra hoặc sửa luật bù | Nguồn luật bù |

### Thư mục `v8/policy/` (chính sách, bản nháp)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/policy/CHINH_SACH_HOC_VIEN.md` | Chính sách học viên: gói, đặt lịch, huỷ, bù, khoá tài khoản, đăng nhập | 8 | Khi tra luật cho học viên | Bản nháp 02/11, chưa công bố |
| `v8/policy/CHINH_SACH_TUTOR.md` | Chính sách tutor: mở lịch, sau buổi học, lương, đăng nhập, nghỉ hẳn | 6 | Khi tra luật cho tutor | Bản nháp 02/11, chưa công bố |

### Thư mục `v8/repo/` (bản dự phòng dựng lại repo trong chat)

| Đường dẫn | Nội dung | Cỡ (KB) | Khi nào đọc | Lưu ý |
|---|---|---:|---|---|
| `v8/repo/BOOTSTRAP.md` | Cách dựng lại repo từ 2 bundle, chạy test, đóng bundle cuối việc (bản 12/11) | khoảng 5 | Khi sửa code ngay trong chat | Bundle và GitHub lệch nhau thì tin GitHub |
| `v8/repo/SRC_BUNDLE.txt` | Mã nguồn đóng gói: src/, companion/, loadtest/, package.json, .github/ và file ẩn (56 file) | 983 | Chỉ khi dựng lại repo | Rất lớn, không đọc vào chat; sinh bằng test/tools/bundle.js |
| `v8/repo/TEST_BUNDLE.txt` | Bộ test đóng gói: thư mục test/ (13 file) | 580 | Chỉ khi dựng lại repo | Rất lớn, không đọc vào chat; sinh bằng test/tools/bundle.js |

## 4. Cách đọc file lớn

1. `project_read` trả về `local_file` cho tài liệu lớn. Đọc từng phần của file đó bằng offset và limit, hoặc tìm bằng grep. Không đọc cả file một lần.
2. Với file có nhiều Phần hoặc mục (ví dụ `v8/HUONG_DAN_VAN_HANH.md`): liệt kê tiêu đề trước bằng grep dòng bắt đầu bằng `## `, rồi chỉ đọc đúng đoạn cần.
3. Không đọc `v8/dist/` và 2 bundle `v8/repo/` vào chat. Các file này rất lớn và chỉ dành cho việc dán code hoặc dựng lại repo.
4. Tra lịch sử bên trong `v8/PROGRESS.md` bằng `project_search`, không đọc từ đầu tới cuối.
5. Không tìm file project trên ổ đĩa bằng Glob hay Grep. Đọc bằng `project_read` hoặc `project_search`.

## 5. Quy tắc giữ project gọn

1. Ghi đè tại chỗ: file mới nhất thay file cũ cùng đường dẫn, không tạo thêm bản có hậu tố ngày hoặc số.
2. Xoá file đã bị thay thế ngay sau khi file mới được ghi.
3. Giữ 2 bundle `v8/repo/` đồng bộ với `v8/dist/` sau mỗi lần đổi code: đóng lại bundle, ghi cả `dist/` và bundle trong cùng một việc.
4. Lịch sử đi theo GitHub, không giữ trong project. Cần tra bản cũ thì đọc repo GitHub.
5. Thêm, xoá hoặc đổi tên file thì cập nhật file này và số file ở mục 3.
