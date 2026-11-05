# Kế hoạch sau go live: từ v8 (Apps Script + Sheets) lên v9 (web app riêng + database thật)

*Lập 29/10/2026. **Anh đã duyệt ngày 01/11/2026; chờ hiệu lệnh để triển khai.** Người thực thi: anh Chris, với Claude Code (gói Pro 20 USD), ChatGPT Plus 20 USD (Codex) và Google AI Pro 20 USD (Gemini 4 Argon, BL12 coi như đã xác nhận cùng lúc duyệt). Giá và hạn mức kiểm tháng 10/2026, phải kiểm lại khi bắt đầu.*

## Thay đổi so với bản 29/10

* Đánh dấu đã duyệt.
* Sửa đường dẫn theo lần dọn project 30/10 (tài liệu cũ nằm trong `archive/`).
* Thêm điều kiện bắt đầu: v8 đã qua chunk 9 (đóng v8, có bộ đặc tả theo luật đã chốt, gồm luật bù 01/11).

## 0. Nói thẳng trước khi làm

1. **Không chuyển chỉ vì muốn "xịn hơn".** v8 sau 5P đủ cho khoảng 10 tutor, 400 học viên. Chỉ bắt đầu v9 khi có ít nhất một điều sau:
   * gặp ngưỡng trong mục 6 của `PHAN_TICH_BAO_GIA_DEV.md` hoặc mục 4.2, 4.4 của `TU_VAN_KIEN_TRUC_16_10.md` (cả hai nằm trong `archive/TU_VAN_VA_KIEN_TRUC.md`) (bận nhiều lần mỗi tuần, trang đặt chậm trên 5 giây, cần hơn 1.500 email mỗi ngày, cần app điện thoại hay thanh toán tự động);
   * hoặc v8 đã chạy ổn **ít nhất 8 tuần** và anh muốn bắt đầu theo kế hoạch 3 đến 6 tháng.
2. **Hạn mức là nút thắt thật.** Theo anh nói trước đây, v8 được viết trên Claude Max 5x. Gói Pro có hạn mức bằng khoảng **một phần năm** gói đó. Anthropic không công bố số tin nhắn: có hạn theo khung 5 giờ và trần theo tuần. Cùng khối lượng việc, thời gian lịch sẽ dài hơn nhiều lần. Ba công cụ cộng lại vẫn ít hơn một gói Max. Có hai hướng:
   * (a) chấp nhận thời gian dài như bảng dưới;
   * (b) nâng Claude lên Max trong các tháng xây v9.
3. **Người không viết code tự xây một hệ thống có dữ liệu cá nhân là rủi ro.** Bắt buộc có 3 thứ:
   * test tự động chạy trước mỗi lần đưa lên;
   * một vòng soát bảo mật bởi người thật, thuê theo giờ (hướng B trong `PHAN_TICH_BAO_GIA_DEV.md`, nằm trong `archive/TU_VAN_VA_KIEN_TRUC.md`);
   * chạy bóng song song với v8 trước khi cắt chuyển.

## 1. Kiến trúc đề xuất cho v9

| Phần | Đề xuất | Vì sao | Chi phí (kiểm 10/2026) |
|---|---|---|---|
| Giao diện và máy chủ | Next.js (TypeScript) | Nhiều tài liệu, cả 3 công cụ AI viết tốt | |
| Nơi chạy | Vercel Pro hoặc Cloudflare | Vercel bản Hobby **cấm dùng thương mại**, phải dùng Pro | Vercel Pro 20 USD mỗi người mỗi tháng |
| Database | Supabase (PostgreSQL) | Ràng buộc "không trùng giờ" nằm ngay trong database (chỉ mục duy nhất), thay cho khoá Apps Script. Có sẵn đăng nhập bằng link email và Google, có phân quyền theo dòng | Gói Free tự tạm dừng sau 1 tuần không dùng, chỉ để thử. Gói Pro từ 25 USD mỗi tháng |
| Email | Resend (dịch vụ ngoài, BL31) | Gửi theo tên miền riêng, có báo đã tới hay bị trả về | Free 3.000 thư mỗi tháng, tối đa 100 mỗi ngày. Pro 20 USD được 50.000 thư mỗi tháng |
| Lịch, Meet | Giữ Google Workspace admin@, gọi Google Calendar API | Không đổi trải nghiệm học viên, tutor | Đã có |
| Đặc tả | File 01, file 03, các hàm thuần và test của v8 | Luật đã chạy thật là bản đặc tả tốt nhất | 0 |

**Tổng hạ tầng ước tính** khoảng 45 đến 65 USD mỗi tháng (Supabase Pro, Vercel Pro, Resend Free hoặc Pro), chưa tính Workspace và tên miền đang trả. Thêm 60 USD mỗi tháng cho 3 công cụ AI trong lúc xây.

**Phương án khác:**
* **(B) Cloudflare Workers + D1** như tư vấn 16/10: rẻ hơn, nhưng ít ví dụ hơn cho người mới.
* **(C) Lai:** giữ giao diện Apps Script, chỉ chuyển dữ liệu sang Supabase. Bước nhỏ nhất, nhưng vẫn kẹt giới hạn của Apps Script.

## 2. Chia việc cho 3 công cụ

| Công cụ | Vai trò | Không dùng cho |
|---|---|---|
| **Claude Code (Pro)** | Thợ chính: viết code và test trong repo, mỗi cửa sổ 5 giờ làm xong đúng 1 việc nhỏ | Đọc lướt cả repo, viết tài liệu dài |
| **ChatGPT Plus (Codex)** | Người soát độc lập, thay vai "2 agent soát chéo": đọc thay đổi của Claude, tìm lỗi, viết thêm test phá | Viết song song cùng file với Claude |
| **Google AI Pro (Gemini 4 Argon, ứng dụng Gemini, Antigravity)** | Đọc tài liệu và repo dài để soát nhất quán; viết chữ song ngữ, hướng dẫn, phác giao diện | Sửa code chính |

Ba hãng có hạn mức riêng. Làm xen kẽ thì gần như có 3 ngân sách song song: Claude viết, Codex soát, Gemini viết tài liệu.

## 3. Luật làm việc theo hạn mức 5 giờ và hạn mức tuần

1. **Tuần đo (S0):** ghi lại mỗi cửa sổ làm được bao nhiêu việc, tuần chạm trần lúc nào, cho từng công cụ. Từ tuần 2 mới xếp việc theo số đo thật. Không công cụ nào công bố con số chính xác.
2. **Mỗi cửa sổ Claude:**
   * mở đầu bằng file `NEXT.md` (việc đúng một dòng, file liên quan, test phải xanh);
   * kết thúc khi test xanh và đã cập nhật `NEXT.md`.
   * Không bao giờ dừng giữa chừng khi test đỏ.
3. **Việc nặng đọc** (soát cả repo, so đặc tả) giao Gemini. **Việc soát lỗi** giao Codex. Claude chỉ viết.
4. **Dừng ở khoảng 80% trần tuần** của mỗi công cụ, giữ phần còn lại cho sửa lỗi gấp của v8 đang chạy.
5. **Một sprint = 1 tuần**, kết thúc bằng bản chạy được trên môi trường thử và một dòng trong `PROGRESS.md`.

## 4. Lộ trình từng bước

Với đúng bộ công cụ anh nêu (Claude chỉ gói Pro): **khoảng 20 đến 24 tuần**, mỗi tuần 8 đến 10 giờ làm tập trung. Nâng Claude lên Max trong các tháng xây thì rút còn khoảng 16 tuần. Cột "Tuần" bên dưới đánh số theo bản 16 tuần; với gói Pro, mỗi sprint kéo dài khoảng 1,3 đến 1,5 lần.

| Sprint | Tuần | Việc | Claude Code | Codex | Gemini | Điều kiện xong |
|---|---|---|---|---|---|---|
| S0 | 1 | Chuẩn bị: GitHub repo, tài khoản Supabase, Vercel, Resend; cài Node và Claude Code; đo hạn mức | Dựng khung dự án | | Đọc bộ đặc tả v8, tóm tắt luật | Trang "Xin chào" chạy trên Vercel |
| S1 | 2 | Database: bảng người dùng, gói, gói học viên, buổi, giờ rảnh, thông báo, nhật ký; ràng buộc chống trùng; script nhập dữ liệu từ Sheets (CSV) | Viết schema, script nhập | Soát ràng buộc, thử nhập dữ liệu bẩn | So schema với SCHEMA v8 | Nhập đủ dữ liệu v8, không mất dòng |
| S2, S3 | 3 đến 4 | Chuyển hàm thuần sang TypeScript (gói, chọn tutor, giờ, số điện thoại, bù ngày) cùng **test chép từ v8**, kể cả 40 kịch bản. Test trước, code sau | Chuyển từng file | Viết test phá | Đối chiếu từng luật file 01 | 40 kịch bản xanh trên v9 |
| S4 | 5 | Đăng nhập (link email, Google), phân quyền theo vai trò | Code | Soát bảo mật | | Học viên không đọc được dữ liệu người khác (có test) |
| S5, S6 | 6 đến 7 | Cổng học viên: gói, đặt, huỷ, song ngữ | Code | Soát | Chữ song ngữ, phác giao diện theo thiết kế 5O | Đặt, huỷ đúng luật trên điện thoại |
| S7 | 8 | Cổng tutor: giờ rảnh, xác nhận kết quả, xin huỷ | Code | Soát | | |
| S8, S9 | 9 đến 10 | Trang admin thay cho dropdown trong Sheets: duyệt đăng ký, xử lý buổi, bù buổi, báo cáo lương | Code | Soát | Hướng dẫn vận hành v9 | Làm được mọi việc của Hướng dẫn vận hành v8 |
| S10 | 11 | Email (Resend, mẫu song ngữ), Calendar và Meet, job định kỳ | Code | Soát | | Email Delivered, Meet tạo đúng |
| S11 | 12 | Nhật ký, lưu trữ, sao lưu, giám sát | Code | Soát | | |
| S12, S13 | 13 đến 14 | **Chạy bóng:** mỗi đêm nhập bản sao dữ liệu v8, so kết quả (hạn gói, lương, slot) giữa v8 và v9 | Script so sánh | Đọc chênh lệch | Báo cáo chênh lệch | 7 đêm liền không chênh |
| S14 | 15 | Thử tải; **soát bảo mật bởi người thật** (thuê theo giờ) | Sửa lỗi | | | Không lỗi mức CAO |
| S15 | 16 | **Cắt chuyển** cuối tuần: v8 bảo trì chỉ xem, nhập dữ liệu cuối, đổi link tên miền; v8 giữ chỉ đọc 30 ngày để quay lại | Trực sửa lỗi | | Thông báo song ngữ cho học viên, tutor | Mọi người đăng nhập được, buổi tuần đầu có Meet |
| S16 | 17 trở đi | Chăm sóc sau chuyển, đóng v8 | | | | 2 tuần không lỗi CAO |

## 5. Điểm dừng an toàn (quay lại v8 bất cứ lúc nào)

* Tới hết S13, v8 vẫn là hệ thống thật. v9 chỉ đọc bản sao dữ liệu.
* Trong 30 ngày sau cắt chuyển, v8 giữ ở chế độ chỉ xem cùng bản dữ liệu cuối. Quay lại = đổi link tên miền về v8, tắt bảo trì.
* Không xoá file Sheets, file lưu trữ, thư mục Releases của v8 trong ít nhất 12 tháng.

## 6. Nguồn

* [Claude Code và Codex: hạn mức khung 5 giờ, trần tuần (morphllm, cập nhật 9/2026)](https://www.morphllm.com/comparisons/claude-code-vs-codex)
* [Antigravity với Google AI Pro: làm mới mỗi 5 giờ tới trần tuần (preuve.ai)](https://preuve.ai/blog/antigravity-review)
* [Gemini Code Assist FAQ: gói cá nhân và AI Pro đã ngừng, chuyển sang Antigravity](https://developers.google.com/gemini-code-assist/resources/faqs)
* [Supabase pricing (jetadmin, 30/09/2026)](https://www.jetadmin.io/blog/supabase-review/)
* [Resend pricing](https://www.resend.com/pricing.md)
* [Vercel pricing 2026, Hobby không dùng thương mại (dev.to)](https://dev.to/nayankyada/vercel-pricing-2026-what-you-actually-pay-for-a-real-nextjs-project-33md)
