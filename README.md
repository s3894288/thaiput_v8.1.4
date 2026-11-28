# thaiput v8

Hệ thống đặt lịch luyện nói tiếng Thái 1:1, bản **8.1.9** (14/11/2026, đã soát chéo 15/11; hệ thống đang chạy thật vẫn là 8.1.4, `main` vẫn là 8.1.4). Google Sheets làm database, Google Apps Script làm máy chủ (web app), một trang web cho học viên, tutor và admin (nhúng được vào Google Sites).

Repo này là bản đầy đủ của dự án: mã nguồn, bộ test chạy bằng Node (giả lập Google), bản dán tay, tài liệu, kế hoạch, lịch sử. Từ 05/11/2026 repo GitHub thay cho 2 file bundle trong claude.ai project.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/` | Mã nguồn thật: 38 file `.gs`, `appsscript.json`, `ui/` (8 file `.html`). **Chỉ sửa ở đây** |
| `test/` | Bộ giả lập Google (`gas_mock.js`, `load.js`), test hàm, 46 kịch bản, 228 test tích hợp, 71 test giao diện, test công cụ thử tải; `build_dist.js` dựng bản dán tay; `tools/bundle.js` đóng gói cho chat (không cần khi dùng GitHub) |
| `dist/` | Bản dán tay sinh từ `src/`: `Code.gs` (gộp 38 file), `Index.html` (gộp giao diện), `appsscript.json`. Không sửa tay |
| `companion/`, `dist_google_login/` | Dự án phụ đăng nhập Google cho admin (nguồn và bản dán tay) |
| `loadtest/` | Công cụ thử tải STAGING (`run.js`, `browser.js`) |
| `CLAUDE.md` | Luật kỹ thuật và quy trình cho Claude Code (đọc trước khi sửa code) |
| `PROGRESS.md`, `BACKLOG.md` | Tiến độ từng chunk; câu hỏi chờ chốt |
| `HUONG_DAN_TIEP_NHAN_8.1.9.md` | Bàn giao trạng thái 8.1.9 cho một chat mới (claude.ai Project hoặc Claude Code): cách dùng, danh sách file, prompt dán sẵn, câu hỏi kiểm tra |
| `HUONG_DAN_*.md` | 4 hướng dẫn cho admin: vận hành, phát hành và nâng cấp, thử tải, triển khai Workspace; thêm `HUONG_DAN_GITHUB_CLAUDE_CODE.md` (làm việc với repo này) |
| `policy/` | Chính sách học viên, tutor (bản nháp) |
| `docs/` | Đặc tả đã chốt: 50 quyết định, plan code, 40 kịch bản test, checklist, tên miền và Workspace |
| `plan/` | Kế hoạch 5J đến 5Q, lộ trình, kế hoạch sau go live, luật bù buổi, trả lời 29/10 và 01/11 |
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

Kết quả bản 8.1.9 (tới commit `5292935`, rà lại ngày 26 đến 27/11, sau soát chéo): hàm thuần 34/34, kịch bản 46/46, tích hợp 228/228 (211 tới `5292935`; I213 đến I229 thêm ở lượt rà lần 2), giao diện 71/71 (67 tới `5292935`; U68 đến U71 thêm ở lượt rà lần 2), thử tải 2/2. `npm test` mất khoảng 2,5 phút.

**Soát chéo 5R (14 đến 15/11):** bản giao đầu của 8.1.9 chỉ có test và 13 đột biến tự làm. Anh yêu cầu soát gắt: hai agent độc lập (X1, X2; X2 chạy 102 đột biến: 69 bị bắt, 33 sống sót, 9 tương đương), ba vòng sửa, supervisor soát từng vòng (vòng soát 3 tìm ra thêm lỗi hai lượt chạy chen nhau có thể làm hai email tóm tắt, đã sửa) và một lượt soát xác nhận cuối do supervisor (Opus) làm trên commit `5292935`: kết luận ĐẠT (PASS), kèm một cuộc đua thấp, không chặn, có từ trước (hai lượt menu 1 bấm sát nhau có thể giao tóm tắt hai lần, BL174; cách tránh: bấm menu 1 một lần và chờ hộp thoại). Soát tìm ra lỗi thật (mất chữ admin khi gộp key trùng, `active` của mẫu email đổi theo dòng sai, ảnh QR cũ tới 6 giờ, tóm tắt nâng cấp mất khi bị ngắt, email có thể gửi hai lần, khoá CONFIG có khoảng trắng thừa) và đã sửa; câu "156/156 xanh" và "13 đột biến bắt cả 13" của bản giao đầu được rút lại. Chi tiết và kết luận soát xác nhận: `PROGRESS.md` mục "Soát chéo và sửa (14 đến 15/11)". Vẫn chưa chạy trên Google thật.

## Hai cách đưa code lên Apps Script

1. **Dán tay (đang dùng):** dán `dist/Code.gs`, `dist/Index.html`, `dist/appsscript.json` vào trình soạn. Từng bước: `HUONG_DAN_PHAT_HANH.md`.
2. **clasp (sau go live, dùng với Claude Code):** `src/` đẩy thẳng lên dự án bằng `clasp push`. Từng bước, kèm cảnh báo lần đầu: `HUONG_DAN_GITHUB_CLAUDE_CODE.md`.

Hai cách không trộn trên cùng một dự án: dự án dán tay có `Code.gs` gộp, dự án clasp có 38 file riêng; để cả hai thì mọi hàm bị khai báo hai lần.

## GitHub Actions

`.github/workflows/test.yml` chạy `npm test` mỗi lần đẩy code và báo đỏ khi `dist/` chưa dựng lại sau khi sửa `src/`.

## Không có trong repo

* `demo/` (bản demo giao diện của chunk 4) không nằm trong bản lưu của project nên `test/build_demo.js` không chạy được. Không ảnh hưởng hệ thống và test.
* Script ID, khoá bí mật, link `/exec`: không commit. `.clasp.json` bị bỏ qua (mẫu: `.clasp.json.example`).
