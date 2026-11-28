# thaiput v8

Hệ thống đặt lịch luyện nói tiếng Thái 1:1, bản **8.1.4** (02/11/2026; tài liệu cập nhật 28/11/2026). Google Sheets làm database, Google Apps Script làm máy chủ (web app), một trang web cho học viên, tutor và admin (nhúng được vào Google Sites).

Repo này là bản đầy đủ của dự án: mã nguồn, bộ test chạy bằng Node (giả lập Google), bản dán tay, tài liệu, kế hoạch, lịch sử. Từ 05/11/2026 repo GitHub là nguồn chính; 2 file bundle trong claude.ai project (`v8/repo/`) giữ làm bản dự phòng. Bàn giao giữa các chat: `PROJECT_MEMORY.md` (đọc đầu tiên); bản đồ file: `HUONG_DAN_DOC_PROJECT.md`.

Nhánh (từ 28/11): `main` (8.1.4, nguồn chuẩn), `Merge-814-at-28Nov` (bản chụp main ngay sau lần gộp 28/11), `claude/wizardly-gates-8xzfbn` (PR 1, bản 8.1.9 chưa gộp, BACKLOG BL99). Ba nhánh khác còn trên repo là nhánh thừa chờ xoá (BL100).

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/` | Mã nguồn thật: 38 file `.gs`, `appsscript.json`, `ui/` (8 file `.html`). **Chỉ sửa ở đây** |
| `test/` | Bộ giả lập Google (`gas_mock.js`, `load.js`), test hàm, 46 kịch bản, 134 test tích hợp, 48 test giao diện, test công cụ thử tải; `build_dist.js` dựng bản dán tay; `tools/bundle.js` đóng gói cho chat (không cần khi dùng GitHub) |
| `dist/` | Bản dán tay sinh từ `src/`: `Code.gs` (gộp 38 file), `Index.html` (gộp giao diện), `appsscript.json`. Không sửa tay |
| `companion/`, `dist_google_login/` | Dự án phụ đăng nhập Google cho admin (nguồn và bản dán tay) |
| `loadtest/` | Công cụ thử tải STAGING (`run.js`, `browser.js`) |
| `CLAUDE.md` | Luật kỹ thuật và quy trình cho Claude Code (đọc trước khi sửa code) |
| `AGENTS.md` | Luật làn khi nhiều công cụ AI (Claude Code, Codex, Gemini CLI) cùng làm trên repo |
| `PROJECT_MEMORY.md`, `HUONG_DAN_DOC_PROJECT.md` | Bàn giao trạng thái giữa các chat; bản đồ file và cách đọc |
| `PROGRESS.md`, `BACKLOG.md` | Tiến độ từng chunk; câu hỏi chờ chốt |
| `HUONG_DAN_*.md` | 4 hướng dẫn cho admin: vận hành, phát hành và nâng cấp, thử tải, triển khai Workspace; thêm `HUONG_DAN_GITHUB_CLAUDE_CODE.md` (làm việc với repo này) |
| `policy/` | Chính sách học viên, tutor (bản nháp) |
| `docs/` | Đặc tả đã chốt: 50 quyết định, plan code, 40 kịch bản test, checklist, tên miền và Workspace |
| `plan/` | Kế hoạch 5J đến 5Q, lộ trình, kế hoạch sau go live, luật bù buổi, trả lời 29/10 và 01/11; kế hoạch v9 chưa duyệt (`KE_HOACH_V9_CHI_TIET.md`, `KE_HOACH_V9_TOI_UU_DIEU_PHOI.md`: Next.js, Supabase, Cloudflare, SES, điều phối Claude, Codex, Gemini) và `P0_BUOC_TUNG_BUOC.md` (cài SES từng bước) |
| `handoff/EMAIL_SES_RESEND/` | Bàn giao gửi email qua Amazon SES: bản vá code 8.1.5 (chunk 5S) chưa áp vào main, cách áp, thiết kế. Áp khi anh quyết BACKLOG BL80 |
| `archive/` | Lịch sử đã gộp (giải thích chunk, báo cáo, soát, tư vấn, spec v7, hồ sơ v6, bảng tra `MANIFEST.md`) |
| `THIET_KE_GIAO_DIEN.md`, `CLEANUP_REPORT.md` | Thiết kế giao diện 19/10; báo cáo dọn dẹp 30/10 |

## Lệnh (Node 18 trở lên)

```
npm install            cài jsdom (test giao diện)
npm test               chạy toàn bộ test (bắt buộc xanh trước khi đẩy code)
npm run build          dựng lại dist/ và dist_google_login/ sau khi sửa src/
npm run build:prod     dist_production/: mỗi file src/*.gs một file, kèm MANIFEST.txt
npm run clasp:push     đẩy src/ lên dự án Apps Script ghi trong .clasp.json
```

Kết quả bản 8.1.4: hàm thuần 34/34, kịch bản 46/46, tích hợp 134/134, giao diện 48/48, thử tải 2/2.

## Hai cách đưa code lên Apps Script

1. **Dán tay (đang dùng):** dán `dist/Code.gs`, `dist/Index.html`, `dist/appsscript.json` vào trình soạn. Từng bước: `HUONG_DAN_PHAT_HANH.md`.
2. **clasp (sau go live, dùng với Claude Code):** `src/` đẩy thẳng lên dự án bằng `clasp push`. Từng bước, kèm cảnh báo lần đầu: `HUONG_DAN_GITHUB_CLAUDE_CODE.md`.

Hai cách không trộn trên cùng một dự án: dự án dán tay có `Code.gs` gộp, dự án clasp có 38 file riêng; để cả hai thì mọi hàm bị khai báo hai lần.

## GitHub Actions

`.github/workflows/test.yml` chạy `npm test` mỗi lần đẩy code và báo đỏ khi `dist/` chưa dựng lại sau khi sửa `src/`.

## Không có trong repo

* `demo/` (bản demo giao diện của chunk 4) không nằm trong bản lưu của project nên `test/build_demo.js` không chạy được. Không ảnh hưởng hệ thống và test.
* Script ID, khoá bí mật, link `/exec`: không commit. `.clasp.json` bị bỏ qua (mẫu: `.clasp.json.example`).
