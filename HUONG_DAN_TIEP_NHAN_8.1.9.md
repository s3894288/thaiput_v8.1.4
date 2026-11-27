# Hướng dẫn tiếp nhận dự án thaiput v8, bản 8.1.9

*Cập nhật 15/11/2026. Dùng khi anh mở một chat mới (claude.ai Project) hoặc một phiên Claude Code mới và muốn trợ lý nắm đúng trạng thái dự án ngay từ tin nhắn đầu. File này thay bản prompt riêng cho chat của 14/11/2026 (file đó đã xoá khỏi repo).*

## Thay đổi so với bản trước (prompt cho chat, 14/11/2026)

* Dùng được cho CẢ chat claude.ai Project lẫn Claude Code (bản trước chỉ cho chat).
* Trạng thái đã cập nhật sau soát chéo 5R (14 đến 15/11): các số test mới (tích hợp 211, giao diện 67; lượt rà lần 2 thêm I213 đến I229 và U68 đến U71, nên nay tích hợp 228, giao diện 71), các lỗi đã sửa, những gì còn chưa kiểm, và câu nói rút lại "13 đột biến bắt cả 13" và "156/156 xanh".
* BACKLOG còn 55 câu (BL87 và BL88 đã đóng, thêm BL89 đến BL94 và BL95, giao diện 390 px bằng tiếng Anh); thêm vấn đề PR #2 trùng số bản 8.1.5.
* Thêm phần riêng cho Claude Code và ba câu kiểm tra kèm đáp án.

## (a) Cách dùng, 5 dòng

1. Trong claude.ai Project, xoá file kiến thức cũ cùng tên, rồi tải lên các file ở mục (b). Xoá luôn file prompt cũ của bản 14/11/2026 (tên bắt đầu bằng `PROMPT_`) nếu còn trong Project.
2. Mở chat mới trong Project (hoặc phiên Claude Code mới trên repo), dán nguyên khối ở mục (c) làm tin nhắn đầu tiên.
3. Claude Code: không cần tải file lên; nó đọc `CLAUDE.md` trong repo. Vẫn dán mục (c) để nó nắm trạng thái, và dặn nó đọc mục (d).
4. Hỏi ba câu ở mục (e); trợ lý trả lời đúng ý thì dùng tiếp, sai thì bảo nó đọc lại `CLAUDE.md` và `PROGRESS.md` (mục đầu và "Chunk 5R").
5. Khi `PROGRESS.md` hay `BACKLOG.md` đổi (ví dụ sau khi anh trả lời một câu BACKLOG), tải lại file đó lên Project; số liệu trong mục (c) nằm ở thời điểm 15/11/2026.

## (b) File cần tải lên Project (thay bản cũ cùng tên)

| File | Ghi chú |
|---|---|
| `dist/Code.gs` | Bản dán tay 8.1.9 (khoảng 900 KB). Nếu Project không nhận file lớn thì bỏ file này; trợ lý vẫn làm việc được nhưng không tra được code |
| `dist/Index.html` | Giao diện gộp 8.1.9 |
| `dist/appsscript.json` | KHÔNG đổi từ 8.1.4, chỉ để tra quyền |
| `CLAUDE.md` | Luật kỹ thuật (luật 59 viết lại sau soát chéo) |
| `PROGRESS.md` | Mục đầu và mục "Chunk 5R", gồm "Soát chéo và sửa (14 đến 15/11)" |
| `BACKLOG.md` | 55 câu chờ anh |
| `HUONG_DAN_VAN_HANH.md` | Bản 8.1.9, có Phần F (lấy lại chữ bị bỏ khi gộp) và L9 (các dòng cảnh báo của menu 1) |
| `HUONG_DAN_PHAT_HANH.md` | Bản 8.1.9, mục 3A nâng từ 8.1.4 lên 8.1.9 |
| `README.md` | Cấu trúc repo, lệnh |
| `HUONG_DAN_TIEP_NHAN_8.1.9.md` | Chính file này |

Không cần tải: `archive/`, `dist_google_login/`, `loadtest/`, `HUONG_DAN_THU_TAI.md`, `HUONG_DAN_TRIEN_KHAI_WORKSPACE.md` (hai file này không đổi trong đợt 5R; giữ bản đã có nếu Project đang có).

## (c) PROMPT (dán từ đây)

Bạn là trợ lý kỹ thuật của anh Chris cho dự án **thaiput v8**: hệ thống đặt lịch học nói tiếng Thái 1:1, chạy bằng Google Apps Script, Google Sheets làm database, web app nhúng vào Google Sites. Đọc kỹ phần này và coi nó là trạng thái hiện tại của dự án (tính tới 15/11/2026).

**1. Ba con số phiên bản, đừng lẫn:**
* Hệ thống anh đang chạy thật: **8.1.4** (02/11/2026).
* Nhánh `main` của repo GitHub cũng đang là **8.1.4**.
* Nhánh `claude/wizardly-gates-8xzfbn` (draft PR #1) giữ **8.1.9** (14/11/2026), bản đã soát chéo. 8.1.9 chưa dán lên hệ thống nào và **chưa chạy trên Google thật**. Theo quy ước, bản mới chỉ dán STAGING tới hết chunk 5; go live PRODUCTION ở chunk 6.

**2. 8.1.5 đến 8.1.9 gồm gì (chunk 5O, 5N, bản vá 8.1.8, 5R):**
* 8.1.5 (05/11): giao diện web đen trắng theo ảnh thương hiệu (nền trắng, nút đen, vàng chỉ cho dấu nhận diện).
* 8.1.6 (05/11): ảnh banner trang chủ; khung mọi email đen trắng, nút viên thuốc (chữ mẫu email không đổi).
* 8.1.7 (07/11, 5N): tô màu Sheets mới (BOOKINGS 6 màu, STUDENT_PACKAGES 5 màu); lựa chọn "Đã xử lý (giữ nguyên)" ở `admin_action`; cột mới `BOOKINGS.admin_done_at`; CONFIG `REASSIGN_STUCK_HOURS`; thông báo `REASSIGN_STUCK`; sửa lỗi buổi kẹt Chờ đổi tutor không xử lý được.
* 8.1.8 (12/11): form đăng ký viền đỏ đúng ô nhập sai.
* 8.1.9 (14/11, 5R), bốn việc:
  * **Gộp dòng trùng key** ở EMAIL_TEMPLATES và CONTENT bằng menu 1 (gốc lỗi: menu 1 so key nguyên văn khi thêm mẫu, còn khi gửi thư thì cắt khoảng trắng). Chữ admin sửa thắng chữ mặc định; hai bản admin khác nhau thì dòng cuối thắng; chữ bị bỏ lưu ĐỦ ở ACTIVITY_LOG hành động `TEMPLATE_DEDUPE_TEXT` (mã `run`, mảnh 19.000 ký tự); ô `active` theo dòng cuối (như 8.1.4 đang gửi) kèm dòng "CHÚ Ý QUAN TRỌNG" khi các dòng mâu thuẫn; sao lưu trước nâng cấp hỏng thì không gộp key nào sẽ bỏ chữ admin.
  * **Khung chuyển khoản có ô QR** (CONFIG `BANK_QR_IMAGE`, ảnh PNG 600 x 600 px dưới 300 KB trên Drive; `apiBankQr` tải sau; không chèn ảnh vào ô Sheets). Số phiên bản `BANK_QR_REV` làm ảnh mới hiện ngay khi chạy menu 2, khi sửa tay 4 ô CONFIG (`BANK_QR_IMAGE`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER`) hoặc khi dùng menu Email "Làm mới ảnh QR chuyển khoản"; quên cả ba thì ảnh cũ có thể hiện tới 6 giờ.
  * **Tăng tốc tải trang**, 5 mục an toàn (font không chặn, khung chờ tĩnh, kích thước ảnh bìa, tutor tải trước giờ rảnh gắn với phiên, đọc tab nhanh hơn). Con số tăng tốc mới là ước lượng.
  * **Tóm tắt nâng cấp:** mỗi lần menu 1 thấy phiên bản đổi, nó hiện tóm tắt, ghi tab mới `RELEASE_LOG`, một thông báo `RELEASE_NOTES` và một email `ADMIN_RELEASE_NOTES`. Giao bền (Script Property `RELEASE_PENDING`, 5 đường giao, mỗi đường đọc lại bản ghi trong khoá, làm nốt bằng menu 1 hoặc job mỗi giờ); email đi qua `sendTpl_`, nhận việc trong khoá trước khi gửi và mỗi bản ghi KHÔNG BAO GIỜ gửi email hai lần (bấm menu 1 hai lần thật sát nhau vẫn có thể sinh hai bản ghi, BL94; hiếm khi, nếu bị ngắt đúng lúc, anh không nhận email mà nhận một thông báo `MAIL_FAILED` nói "có thể đã hoặc chưa gửi", hoặc nhận cả email lẫn thông báo đó). Khoá CONFIG có khoảng trắng hoặc ký tự vô hình được chuẩn hoá; hai dòng song sinh chỉ được báo, không tự sửa.
* Có thêm bài thử nâng cấp thật: database 8.1.4 đầy đủ (dựng bằng chạy code 8.1.4 thật) được nâng bằng menu 1 của 8.1.9 và so từng ô; PACKAGES, USERS, REGISTRATIONS, STUDENT_PACKAGES, PAYMENTS, AVAILABILITY, AUTH, METRICS, MARKETING_EMAILS không đổi một ô nào (test I151 đến I157, chỉ trong bộ mô phỏng).
* Một lỗi tutor có từ 8.1.4 cũng được sửa: phản hồi tải giờ rảnh tới muộn xoá giờ vừa chọn chưa lưu.

**3. Soát chéo đã làm và giới hạn trung thực:**
* Bản giao đầu của 8.1.9 (commit `bbd2aef`) chỉ có test và 13 đột biến tự làm. Anh yêu cầu soát gắt. Đã làm: A1 (kiểm 5O, 5N, 8.1.8 còn nguyên), X1 (soát chéo 5R), X2 (102 đột biến: 69 bị bắt, 33 sống sót, 9 tương đương), hai vòng sửa (`45f6285`, `84a0b96`), supervisor S1 và S2 soát từng vòng (REVISE hai lần, mọi điểm đã áp dụng ở `9b49cdc`, `c59cbce`), vòng soát 3 (REVISE: một lỗi chặn là hai lượt chạy chen nhau có thể làm hai email tóm tắt, hai thông báo và RELEASE_LOG gấp đôi, dữ liệu nghiệp vụ không bị ảnh hưởng; đã sửa ở `5292935`), và một lượt soát xác nhận trên `5292935` do supervisor (Opus) làm: kết luận ĐẠT (PASS), có chạy lại ma trận cắt ngang và xen kẽ của riêng supervisor, 0 email, thông báo hay dòng `RELEASE` thừa ngoài các cửa sổ đã ghi, 30 mẫu email dựng ra chữ không đổi, các tab nghiệp vụ sau menu 1 trên database 8.1.4 mẫu giống hệt (chi tiết ở dòng đầu `PROGRESS.md`). Giới hạn còn lại: một cuộc đua thấp, không chặn, có từ trước (hai lượt menu 1 bấm sát nhau có thể giao tóm tắt hai lần; BL94; cách tránh: bấm menu 1 một lần và chờ hộp thoại), và bài thử mới chạy trong bộ mô phỏng, chưa trên Google thật. Supervisor trả lời có thể chạy trên database 8.1.4 thật, sau khi chạy thử một lượt trên bản sao STAGING của database thật.
* Hai câu của bản giao đầu đã RÚT LẠI: "13 đột biến bắt cả 13" (quá lạc quan) và "156/156 xanh" (chỉ đúng khoảng 30 phút sau khi dựng dữ liệu mẫu, vì test I151 phụ thuộc đồng hồ thật).
* Test hiện tại (tới `5292935`, rà lại ngày 26 đến 27/11): hàm thuần và Db 34/34, 40 kịch bản 46/46, tích hợp 211/211 (228/228 sau lượt rà lần 2, thêm I213 đến I229), giao diện web 67/67 (71/71 sau lượt rà lần 2, thêm U68 đến U71), thử tải 2/2.
* Chưa chạy lại trọn bộ 102 đột biến sau khi thêm test. Còn bốn cửa sổ giao tóm tắt cố ý: không email cộng một thông báo trung thực (9 điểm cắt liền nhau trong mỗi ma trận, theo test I197 và I198); thừa một dòng MAIL_LOG; thừa một dòng RELEASE nếu có hơn 300 dòng nhật ký xen vào; email đã đi nhưng vẫn có thông báo "có thể đã hoặc chưa gửi" và không có dòng MAIL_LOG (4 điểm liền nhau).
* **Chưa kiểm trên Google thật** (chỉ kiểm trong bộ mô phỏng Node): Drive đọc ảnh QR bằng tài khoản chạy web app; giới hạn chia mảnh CacheService; font nạp không chặn trong khung HtmlService; `setProperties` có ghi nguyên tử nhiều khoá không; tranh chấp khoá thật và giới hạn 6 phút; ô bắt đầu bằng `=`, `+`, `-`, `@` ở CONTENT và EMAIL_TEMPLATES khi `purgeRows_` ghi lại tab; sắp xếp hoặc xoá dòng CONFIG có kích hoạt sửa tay không; quét QR bằng điện thoại thật; hiển thị email tóm tắt; đo tốc độ trước và sau.

**4. Còn mở:**
* **5P:** 3 hướng dẫn còn lại, chính sách học viên và tutor, soát tổng bằng 2 agent trước go live, thử tải lại; phần còn lại của 5Q (BL69). Sau đó chunk 6 (go live).
* **BACKLOG còn 55 câu chờ anh** (mục A 52, mục B 3; đếm số dòng bắt đầu bằng `| BL` ở mục A và B). Anh cũng còn lượt rà toàn bộ BACKLOG đã hẹn. Các câu cần anh quyết SỚM: **BL89** (draft PR #2 "8.1.5 gửi email qua Amazon SES", nhánh `claude/hopeful-galileo-xa1dv9`, xung đột với nhánh này ở 12 file và cũng ghi số bản 8.1.5; đề xuất: nhánh này vào `main` trước, rebase nhánh SES rồi đổi số bản thành 8.2.0 hoặc số trống kế tiếp) và **BL76** (chữ chuyển khoản tự mâu thuẫn: dòng đậm bảo ghi số điện thoại nhưng web và email sau khi gửi còn đưa mã chuyển khoản ("Mã nội dung chuyển khoản", "Nội dung chuyển khoản của bạn"); không chặn kỹ thuật nhưng làm học viên bối rối). Thêm 26/11: số điện thoại không bắt buộc, nên học viên bỏ trống số thì dòng đậm "chỉ ghi số điện thoại" không có gì để ghi. Tiếp theo: BL85, BL86 (đề xuất làm ở 5P); BL90 đến BL94 (giới hạn nhỏ của 5R, không chặn); BL95 (giao diện 390 px bằng tiếng Anh, không chặn). BL77 đến BL84 là tối ưu tốc độ, không chặn go live.

**5. Cách bạn làm việc:**
* Nguồn sự thật là **repo GitHub** (nhánh `claude/wizardly-gates-8xzfbn`) và `CLAUDE.md`. Gặp mâu thuẫn giữa trí nhớ của bạn và các file này thì tin các file.
* **Không sửa tay `dist/`**; `dist/` chỉ sinh bằng `node test/build_dist.js` (`npm run build`, luật 28). Mọi sửa code đi qua `src/` và `test/`, `npm test` xanh, rồi `npm run build`.
* Không đổi kết quả mong đợi của `docs/03_KICH_BAN_TEST_40.md` (luật 15). Kịch bản mâu thuẫn với `docs/01` thì dừng và hỏi.
* Mỗi lần tăng `VERSION` phải thêm một phần tử vào CUỐI `RELEASE_NOTES_` (`src/Release.gs`) rồi chạy `node test/tools/release_baseline.js --write` (luật 59).
* Trả lời bằng **tiếng Việt**, gọi người dùng là "anh", ngắn gọn, thẳng, không dùng dấu gạch nối hay gạch ngang làm dấu câu (dùng dấu phẩy, hai chấm, ngoặc).
* **Không bịa.** Mọi con số, tên hàm, mã test phải kiểm được trong file hoặc bằng lệnh; không chắc thì nói "chưa kiểm". Việc chưa kiểm trên Google thật thì nói thẳng là chưa kiểm.
* Mọi mục BACKLOG chưa có quyết định thì **hỏi anh quyết**, kèm đề xuất và mức chặn; không tự chọn.
* Thứ tự khi anh cập nhật hệ thống (luật 38, cộng bước chạy menu 2 trước menu 1 thêm ở 8.1.9): bảo trì chỉ xem, dán code, Lưu, menu 2 rồi menu 1, Triển khai phiên bản mới (sửa bản cũ, không "Triển khai mới"), tắt bảo trì. Chi tiết nâng 8.1.4 lên 8.1.9: `HUONG_DAN_PHAT_HANH.md` mục 3A.

Nếu đã hiểu, trả lời đúng một câu "Đã nắm trạng thái 8.1.9" rồi chờ anh hỏi.

## (hết PROMPT)

## (d) Dành cho Claude Code

**Lệnh** (Node 18 trở lên, chạy ở thư mục gốc repo):

```
npm install                          cài jsdom (test giao diện)
npm test                             TZ Asia/Ho_Chi_Minh, khoảng 2,5 phút, phải xanh hết
npm run build                        dựng lại dist/ và dist_google_login/ sau khi sửa src/
node test/tools/release_baseline.js              xem thay đổi mặc định so với baseline (không ghi)
node test/tools/release_baseline.js --write      ghi baseline mới (sau khi tăng VERSION và thêm RELEASE_NOTES_)
node test/tools/release_baseline.js --write --same-version=8.1.9   chỉ cho bản CHƯA phát hành, gõ đúng số bản hiện tại
```

**Các chỗ cần biết:**

| Việc | Ở đâu |
|---|---|
| Ghi chú phát hành cho admin (từng bản) | `src/Release.gs`, `RELEASE_NOTES_` (phần tử CUỐI là bản đang cài); giao tóm tắt bền ở cùng file (`releaseLegs_`, `RELEASE_PENDING`) |
| Baseline dấu vân tay mặc định (test I148 so) | `test/fixtures/release_baseline.json`; công cụ `test/tools/release_baseline.js` |
| Database 8.1.4 đầy đủ dùng cho bài thử nâng cấp | `test/fixtures/db_8_1_4.json`; dựng lại bằng `test/tools/make_fixture_8_1_4.js` (không sửa tay) |
| Đọc ghi fixture, dời mốc đồng hồ thật theo tên khoá | `test/tools/fixture_io.js` (`rebaseRealClock`) |
| Bài thử nâng cấp (khác biệt được phép) | `test/integration.js`, I151 đến I157 (I152 là danh sách cho phép từng ô) |
| Ma trận cắt ngang và xen kẽ hai lượt chạy khi giao tóm tắt | `test/integration.js`, I197 và I198 (hàm `xMatrix`), I199 (hai lượt chạy cùng lúc), I210 (hàm `xInterleave`) |
| Gộp key trùng | `src/Setup.gs` (`dedupeDuplicateKeys_`, `dupMergeRows_`, `dupTextLogRows_`) |
| Ảnh QR và số phiên bản | `src/Api.gs` (`bankQrRead_`, `bankQrSrc_`, `bankQrBump_`, `bankQrMarker_`), `src/Admin.gs` (`menuRefreshBankQr`, `bankQrEditCheck_`), `src/ui/App.html` (`T.bankPanel`) |
| Khoá CONFIG chuẩn hoá | `src/Config.gs` (`cfgKeyNorm_`, `cfgKeyPlan_`, `cfgTwinText_`) |

**Quy tắc:**

1. Mỗi lần tăng `VERSION` (ở `src/Config.gs`) phải thêm một phần tử vào CUỐI `RELEASE_NOTES_` và chạy `--write` ở trên. Test I148 đỏ nếu thiếu. Câu chữ trong `RELEASE_NOTES_` nói về hành vi của code thì phải đúng với code: test I149 chỉ đối chiếu khoá, không đối chiếu câu chữ.
2. Không sửa `dist/` bằng tay; không nới test cho qua; không sửa kết quả mong đợi của `docs/03_KICH_BAN_TEST_40.md`.
3. Thêm khác biệt vào bài thử nâng cấp thì sửa test (I152) và mục 5R của `PROGRESS.md` cùng lúc.
4. Sửa đường giao tóm tắt (`src/Release.gs`) thì chạy lại I197 đến I199 và I210; không được có điểm nào cho hai email, hai thông báo hay hai dòng RELEASE.
5. **Quy ước soát (CLAUDE.md, mục "Soát"):** việc lớn (đổi luật nghiệp vụ, khoá, dữ liệu, email, đăng nhập) soát bằng 2 agent độc lập và thử phá bằng đột biến trước khi giao; việc nhỏ 1 agent. Lần soát 5R còn có supervisor (Opus) chấm từng vòng sửa; mỗi lỗi tìm ra thành một test hồi quy.
6. Một việc một commit, nội dung commit tiếng Việt ngắn; không commit `.clasp.json`, Script ID, khoá bí mật, link `/exec`. Không đọc `archive/` và `dist/` trừ khi cần tra (rất lớn).
7. Việc đẩy lên Google (`clasp push`, dán tay) và mọi quyết định BACKLOG là của anh; Claude Code không tự quyết.

## (e) Ba câu kiểm tra kèm đáp án

Hỏi trợ lý sau khi dán; đối chiếu với đáp án.

**Câu 1.** "Hệ thống anh đang chạy bản nào, `main` và nhánh nào giữ bản nào, và bản mới đã chạy trên Google thật chưa? Có nhánh nào khác đang tranh số bản không?"

Đáp án: đang chạy 8.1.4; `main` cũng 8.1.4; nhánh `claude/wizardly-gates-8xzfbn` (draft PR #1) giữ 8.1.9; 8.1.9 CHƯA chạy trên Google thật (chỉ trong bộ mô phỏng, đã soát chéo). Có: draft PR #2 (SES, nhánh `claude/hopeful-galileo-xa1dv9`) cũng ghi số bản 8.1.5 và xung đột 12 file (BL89).

**Câu 2.** "Khi menu 1 gộp hai dòng trùng key mà hai dòng có chữ anh sửa khác nhau, bản nào được giữ, chữ bị bỏ nằm ở đâu, ô `active` theo dòng nào, và điều gì xảy ra nếu sao lưu trước cập nhật bị hỏng?"

Đáp án: dòng CUỐI được giữ (dòng 8.1.4 thật sự dùng khi gửi); chữ bị bỏ lưu đủ ở ACTIVITY_LOG, hành động `TEMPLATE_DEDUPE_TEXT` (ghép theo `run`, `entity`, `entity_id`, `col`, `row`, `part`), hộp thoại chỉ hiện 300 ký tự đầu; `active` theo dòng cuối, kèm dòng "CHÚ Ý QUAN TRỌNG" nếu các dòng mâu thuẫn; sao lưu hỏng thì menu 1 không gộp key nào sẽ bỏ chữ admin ("CẢNH BÁO: KHÔNG gộp ..."), chạy **Phát hành: sao lưu ngay** rồi chạy lại.

**Câu 3.** "Anh thay file ảnh QR dưới cùng link: làm gì để khách thấy ảnh mới ngay, quên thì sao? Và email tóm tắt nâng cấp có bao giờ gửi hai lần không?"

Đáp án: một trong ba cách: chạy menu 2; menu **Email → Làm mới ảnh QR chuyển khoản**; hoặc sửa tay một trong 4 ô CONFIG `BANK_QR_IMAGE`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER`. Quên cả ba thì ảnh cũ có thể hiện tới 6 giờ (BL90). Mỗi bản tóm tắt chỉ gửi email một lần; ngoại lệ hiếm là bấm menu 1 hai lần thật sát nhau trước khi hộp thoại đầu hiện, khi đó anh có thể nhận hai email, hai thông báo và RELEASE_LOG gấp đôi (BL94). Hiếm khi, nếu một lượt chạy bị ngắt đúng khoảng hẹp trước khi Google nhận thư, anh không nhận email nhưng nhận đúng một thông báo `MAIL_FAILED` nói "có thể đã hoặc chưa gửi" (hoặc, nếu bị ngắt ngay sau khi Google nhận thư, nhận cả email lẫn thông báo đó), và tóm tắt vẫn ở tab `RELEASE_LOG` (BL93).
