# Hướng dẫn dùng repo GitHub với Claude Code (bản 8.1.4)

*Cập nhật 05/11/2026. Dành cho admin không viết code. Chiến lược: sau go live, sửa hệ thống bằng Claude Code (gói Pro) trên repo này; code JavaScript trong `src/` được kiểm bằng bộ test Node rồi đưa lên Apps Script.*

## Thay đổi so với bản trước

Bản đầu tiên. Thay cho cách cũ: 2 file bundle trong claude.ai project (`v8/repo/`) và `repo/BOOTSTRAP.md`.

## 1. Đưa repo lên GitHub (1 lần, khoảng 15 phút)

1. github.com → **New repository** → tên ví dụ `thaiput-v8` → chọn **Private** (bắt buộc: repo có tài liệu nội bộ) → **Create repository**. Không tick "Add a README".
2. Giải nén file zip trên máy tính.
3. Trang repo vừa tạo → **uploading an existing file** → kéo **toàn bộ nội dung bên trong** thư mục `thaiput_v8` (không kéo chính thư mục) vào trang → **Commit changes**. Thư mục ẩn `.github` và các file `.gitignore`, `.clasp.json.example` phải lên cùng: trên Mac bấm Cmd + Shift + . trong Finder để thấy file ẩn; trên Windows bật "Hidden items" trong File Explorer.
4. Kiểm: tab **Actions** có lượt chạy "test" màu xanh sau vài phút. Đỏ: chụp màn hình cho Claude Code.

Phương án khác: cài GitHub Desktop, chọn thư mục đã giải nén, **Publish repository** (đưa cả file ẩn, không lo sót).

## 2. Mở repo bằng Claude Code

1. claude.ai → Claude Code (web hoặc ứng dụng) → kết nối GitHub → chọn repo `thaiput-v8`.
2. Claude Code tự đọc `CLAUDE.md` (luật kỹ thuật, quy trình). Không cần dán bundle như trước.
3. Câu lệnh mẫu đầu phiên: "Đọc PROGRESS.md mục đầu và BACKLOG.md, làm sub chunk 5N theo plan/KE_HOACH_5J_5P.md, chạy npm test, npm run build, cập nhật PROGRESS.md, commit."

**Tiết kiệm lượt dùng gói Pro:**
* Mỗi phiên giao một việc rõ ràng (một sub chunk, một lỗi).
* Dặn "không đọc archive/ và dist/" (file rất lớn) trừ khi cần tra.
* Đầu phiên mới không cần kể lại bối cảnh: `CLAUDE.md`, `PROGRESS.md` đã có.
* Việc lớn mới yêu cầu 2 agent soát chéo; việc nhỏ 1 agent.

## 3. Đưa code lên Apps Script

### Cách A: dán tay (đang dùng, không cần cài gì)

Sau mỗi việc Claude Code commit `dist/`. Mở `dist/Code.gs`, `dist/Index.html` trên GitHub → nút **Copy raw file** → dán theo `HUONG_DAN_PHAT_HANH.md` mục 2.

### Cách B: clasp (đẩy thẳng `src/`, sau go live)

Chưa thử trên dự án thật của thaiput: thử trên STAGING trước.

1. Bật Apps Script API: script.google.com/home/usersettings → **Google Apps Script API: Bật**, bằng tài khoản chạy hệ thống.
2. Máy cài Node 18 trở lên. Trong thư mục repo: `npm install`, rồi `npm run clasp:login` (trình duyệt mở, đăng nhập đúng tài khoản chạy hệ thống).
3. Lấy Script ID: trình soạn Apps Script → **Cài đặt dự án** → **ID tập lệnh**. Chép `.clasp.json.example` thành `.clasp.json`, thay `DIEN_SCRIPT_ID_CUA_DU_AN_APPS_SCRIPT` bằng ID đó. File `.clasp.json` không lên GitHub (đã chặn trong `.gitignore`).
4. **Cảnh báo lần đầu:** dự án đang dùng cách A có `Code.gs` gộp và `Index.html` gộp. `npm run clasp:push` thay toàn bộ file của dự án bằng 47 file trong `src/` (38 file `.gs`, 8 file `ui/*.html`, `appsscript.json`). Sau lần đẩy đầu mở trình soạn kiểm: không còn `Code.gs`, `Index`; có `Config`, `Api`, `ui/Index`... Còn `Code.gs` gộp thì xoá tay ngay (để lại thì mọi hàm bị khai báo hai lần).
5. Mỗi lần cập nhật: **Bảo trì: chỉ xem** → `npm run clasp:push` → F5 Sheets → menu 1 → menu 2 → **Triển khai phiên bản mới** (sửa bản triển khai cũ) → **Bảo trì: tắt**. Thứ tự như `HUONG_DAN_PHAT_HANH.md` mục 2, chỉ thay bước dán bằng `clasp push`.
6. STAGING và PRODUCTION là 2 Script ID khác nhau: đổi ID trong `.clasp.json` trước khi đẩy; luôn đẩy STAGING trước.

Không trộn hai cách trên cùng một dự án. Quay về cách A: xoá hết file `.gs` riêng trong trình soạn, dán lại `dist/Code.gs`.

## 4. Những gì không có trong repo

* `demo/` (bản demo giao diện chunk 4): không có trong bản lưu của project; `test/build_demo.js` không chạy được. Không ảnh hưởng hệ thống.
* Script ID, khoá đăng nhập Google, link `/exec`, dữ liệu học viên: không bao giờ commit.
* Claude.ai project vẫn giữ tài liệu để đọc trong chat; nguồn đúng của code từ nay là GitHub.
