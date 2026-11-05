# AGENTS.md · Luật làn cho Codex và Gemini CLI trên repo thaiput v8

Luật kỹ thuật đầy đủ (57 luật, quy ước làm việc) nằm ở `CLAUDE.md`: đọc file đó trước, file này chỉ thêm luật làn khi nhiều công cụ cùng làm (kế hoạch `plan/KE_HOACH_V9_TOI_UU_DIEU_PHOI.md` mục 5).

1. **Làn.** Claude Code sửa `src/`, `test/`, `dist/` (chỉ qua `npm run build`), tài liệu. Codex chỉ thêm hoặc sửa file trong `test/` (test phá, test hồi quy) và chỉ bình luận review trên PR. Gemini chỉ sửa `docs/`, `plan/`, `policy/`, file `*.md` và chữ song ngữ trong `src/Content.gs`, `src/EmailTemplates.gs` (không sửa logic). Không công cụ nào merge PR; chỉ anh Chris merge.
2. **Một việc một PR** dưới 300 dòng thay đổi, nội dung commit tiếng Việt ngắn, không ghi tên model. Không kết thúc khi `npm test` đỏ. Không sửa `dist/` bằng tay.
3. **Không bao giờ:** đổi kết quả mong đợi trong `docs/03_KICH_BAN_TEST_40.md` để test qua (luật 15); làm mock "tốt bụng" hơn Google thật (luật 14); commit `.clasp.json`, Script ID, khoá, link `/exec`; gọi dịch vụ gửi thư ngoài `src/MailTransport.gs` (luật 19).
4. **Codex review** tìm: luật nghiệp vụ sai so với `docs/01_QUYET_DINH_50_CAU.md` (dẫn số câu), hàm công khai thiếu `requireRole_` hay `requireOperator_`, ghi Sheets ngoài khoá, email hay số điện thoại lọt vào Calendar hoặc nhật ký, chạy lại tạo trùng, test thiếu nhánh lỗi. Mỗi mục ghi mức CAO, VỪA, THẤP; chỉ CAO và VỪA chặn merge. Không khen, không đề xuất đổi kiến trúc, trả lời tiếng Việt.
5. **Gemini quét** so `docs/` với `src/`: key CONTENT thiếu tiếng Anh, mẫu email thiếu biến, hướng dẫn vận hành lệch menu thật. Ghi kết quả vào `docs/REVIEW_GEMINI_<ngày>.md`, không sửa code.
6. Lệnh: `npm ci`, `npm test`, `npm run build`. Trả lời và viết tài liệu bằng tiếng Việt, không dùng dấu gạch nối.
