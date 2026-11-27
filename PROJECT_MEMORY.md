# PROJECT_MEMORY · Bàn giao dự án thaiput v8 (đọc đầu tiên ở mọi chat mới)

*Bản 27/11/2026 (lần 2, tối). Dành cho Claude ở chat mới trong project "Thai Class". Lưu tại `v8/PROJECT_MEMORY.md`.*

## Thay đổi so với bản trước

**Lần 2 (tối 27/11):** repo main đã đồng bộ với project (PR 3, BL97 xong); phát hiện nhánh 8.1.9 chưa gộp (PR 1, BL99: 5O, 5N, 5R đã làm ở đó); PR 2 (SES) đã đóng; chuyển Private bị chặn (BL98, anh tự làm); đánh số lại BL70, BL71, BL72 của main thành BL96, BL97, BL98. Sửa mục 3, 4, 5, 6.

Bản trước nữa là `v8/KHOI_DONG_CHAT_MOI.md` (13/11/2026), đã gộp vào file này và xoá. Lần 1 thêm:

* Mục 4 (dòng thời gian quyết định và việc đã xong, 01/11 đến 27/11) và mục 5 (9 việc còn tồn, xếp theo thứ tự làm).
* Mục 2 trỏ tới `v8/HUONG_DAN_DOC_PROJECT.md` (bản đồ đầy đủ các file project). `v8/archive/` đã xoá khỏi project ngày 27/11, chỉ còn trên GitHub.
* Mục 3: kết quả đối chiếu repo GitHub 27/11 (thiếu 5 mục, cũ 4 file, repo đang Public) và BACKLOG còn 35 câu chờ (mục A 31, mục B 4) với BL97, BL98 mới.
* Mục 8: gộp luật giao tiếp cũ với luật làm việc của anh Chris (quy trình soát chéo, quy trình nhiều model, giới hạn chọn model của Alex).
* Mục 9: bỏ các mục đã được sửa hôm nay; memory chỉ để tham khảo, file project thắng.
* Mục 11: câu mẫu để anh mở chat mới.

## 1. Hai điều cần nhớ ngay

* Chat mới KHÔNG thấy chat cũ. Mọi thứ cần biết nằm trong file của project và memory. Memory có hồ sơ, sở thích của anh Chris và vài ghi chú về dự án, nhưng chỉ để tham khảo. Memory và file project nói khác nhau thì tin file project (PROGRESS.md, BACKLOG.md, file này), rồi báo anh.
* Chỉ làm đúng việc anh giao ở tin nhắn đầu. Kế hoạch chưa được anh ra lệnh thì không tự thực thi. Tin nhắn đầu chỉ có câu "đọc file này" mà không có việc cụ thể: tóm tắt tình hình cho anh rồi hỏi làm gì tiếp.

Đọc file project bằng `project_read` hoặc `project_search`. Không tìm file project trên ổ đĩa bằng Glob hay Grep.

## 2. Thứ tự đọc để nắm việc (đọc xong mới trả lời)

Bản đồ đầy đủ các file project nằm ở `v8/HUONG_DAN_DOC_PROJECT.md`. Từ 27/11/2026 thư mục `v8/archive/` không còn trong project (7 file lịch sử, bản gốc còn ở thư mục `archive/` trên GitHub, đã so trùng). Cần tra lịch sử cũ: đọc thư mục `archive/` của repo GitHub (`archive/MANIFEST.md` là bảng tra), không đoán.

1. File này.
2. `v8/PROGRESS.md`, chỉ phần đầu: từ đầu file tới trước tiêu đề "Chunk 5Q phần A". Phần đó có trạng thái mới nhất, xếp từ mới nhất xuống cũ hơn. Các mục chunk phía sau là lịch sử, tra khi cần bằng `project_search` (ví dụ tìm "5Q.2 Kết quả test"). File rất dài, không cần đọc hết.
3. `v8/BACKLOG.md`: các dòng "Thay đổi so với bản" ở đầu, và mục A (câu hỏi chờ anh). Đọc kỹ các dòng có cột "Chặn" trùng sub chunk được giao.
4. File plan của sub chunk được giao: `v8/plan/KE_HOACH_5J_5P.md`, mục 0 (luật cho mọi chunk), phần của sub chunk ở mục 2, mục 4 (bảng lỗ hổng), mục 5 (chunk 6 go live).
5. Chỉ khi sửa code: `v8/CLAUDE.md` (các luật đánh số và mục "Quy ước làm việc") và `v8/repo/BOOTSTRAP.md`.
6. Chỉ khi cần tra: `v8/docs/01_QUYET_DINH_50_CAU.md` (quyết định nghiệp vụ), `v8/docs/03_KICH_BAN_TEST_40.md` (không tự sửa kết quả mong đợi để test qua; chỉ đổi khi anh duyệt, luật 15 trong `CLAUDE.md`), `v8/HUONG_DAN_VAN_HANH.md`. Không đọc `v8/dist/` và hai bundle trừ khi cần tra (rất lớn).

## 3. Trạng thái tại 27/11/2026

*Mục này và mục 5 phải được cập nhật ở cuối mỗi việc (xem mục 7).*

* **Bản code hiện tại: 8.1.4** (`src/Config.gs` VERSION '8.1.4'). Sub chunk 5Q phần A (gửi email cố định bằng GmailApp qua `src/MailTransport.gs`, bỏ MailFix) xong 02/11/2026. Ngày 12/11 và 27/11 chỉ đồng bộ file và tài liệu, không đổi code.
* **Kết quả test 8.1.4 (chạy lại 12/11 và 27/11/2026):** hàm thuần 34/34, kịch bản 46/46, tích hợp 134/134, giao diện 48/48, thử tải 2/2. `dist/` dựng lại trùng `src/`.
* **Code đã giao:** `dist/Code.gs`, `dist/Index.html`, `dist/appsscript.json`, `dist_google_login/` (dự án phụ đăng nhập Google). Hai bundle `v8/repo/SRC_BUNDLE.txt` (56 file) và `v8/repo/TEST_BUNDLE.txt` (13 file) là bản dự phòng, đóng lại 12/11.
* **Repo GitHub `s3894288/thaiput_v8.1.4` (kiểm tối 27/11):**
  * **main = 8.1.4**, đã đồng bộ với project qua PR 3 (gộp 27/11): đủ `.github/`, `.gitignore`, `.clasp.json.example`, `THIET_KE_GIAO_DIEN.md`, `test/unit.js`, mọi file md mới nhất. Anh chốt giữ main 8.1.4, không đụng các nhánh khác.
  * **Nhánh `claude/wizardly-gates-8xzfbn` (PR 1, nháp, CHƯA gộp) = 8.1.9:** đã làm 5O (8.1.5, 8.1.6: giao diện đen trắng, khung email mới), 5N (8.1.7: tô màu Sheets, "Đã xử lý (giữ nguyên)", báo buổi kẹt Chờ đổi tutor), bản vá 8.1.8 (viền đỏ đúng ô nhập sai, bảng màu vào hướng dẫn), 5R (gộp dòng trùng EMAIL_TEMPLATES và CONTENT, ô QR chuyển khoản, tăng tốc tải, tóm tắt thay đổi sau nâng cấp). Soát chéo PASS. Alex chạy test nhánh này 27/11: 34/34, 46/46, 228/228, 71/71, 2/2. Chưa kiểm trên Google thật. Nhánh có BACKLOG riêng (lần 15, 55 câu chờ) và `HUONG_DAN_TIEP_NHAN_8.1.9.md`; số BL70 đến BL95 ở nhánh đó là câu khác với main. Xem BL99.
  * **Nhánh `claude/hopeful-galileo-xa1dv9` (PR 2 đã đóng 27/11, nhánh giữ):** bản 8.1.5 gửi email qua Amazon SES và kế hoạch v9 (Cloudflare, Supabase, SES), tạm dừng từ 14/11, xung đột 12 file với PR 1.
  * Repo đang **Public**: chuyển Private bị proxy chặn, anh tự làm (BL98).
* **STAGING và PRODUCTION:** chưa tách tới hết chunk 5. Mọi bản chỉ dán vào STAGING. Go live ở chunk 6 (`plan/KE_HOACH_5J_5P.md` mục 5).
* **BACKLOG còn 35 câu chờ anh** (mục A 31, mục B 4), theo số liệu 27/11. Mới nhất: BL99 (nhánh 8.1.9 chưa gộp), BL98 (repo Public), BL96 (admin chưa mở được giờ rảnh hộ tutor). BL97 đã xong. Từ 27/11 số câu mới của main bắt đầu từ BL100.
* **Việc của anh trên Google:** các file không ghi anh đã dán 8.1.4 lên STAGING chưa. Hỏi anh trước khi giả định.

## 4. Dòng thời gian quyết định và việc đã xong

* **01/11:** anh chốt tối 01/11: KHÔNG tách STAGING và PRODUCTION tới hết chunk 5, mọi bản chỉ dán STAGING. Chunk 6 go live: đơn giản nhất, không mất dữ liệu, 2 bản chức năng tương đương chạy song song, có hướng dẫn tắt hết trigger STAGING.
* **02/11:** giao bản 8.1.4 (5Q phần A): email cố định qua `src/MailTransport.gs` (GmailApp mặc định, CONFIG `MAIL_TRANSPORT`, thiếu quyền thì tự gửi lại bằng MailApp và báo 1 lần mỗi giờ), bỏ hẳn MailFix; đăng nhập Google cho admin (`dist_google_login/`, `HUONG_DAN_VAN_HANH.md` Phần M); xuất 4 hướng dẫn (vận hành, phát hành, thử tải, triển khai Workspace) và 2 chính sách (học viên, tutor); hướng dẫn nâng STAGING từ 8.0.10 lên 8.1.4 (`HUONG_DAN_PHAT_HANH.md` mục 3). Anh dời 5N, 5O sang tuần sau; chốt rà BACKLOG ở lượt cuối chunk 5, sau 5N và 5O, và muốn được nhắc lúc đó; nói sẽ cần thêm một bản thử song song để cập nhật code (chưa làm).
* **05/11:** xuất repo đầy đủ (zip 120 file) để làm việc bằng Claude Code gói Pro. Chiến lược sau go live: JavaScript trên Apps Script, kiểm bằng Node, đưa lên bằng clasp hoặc dán `dist/`. Tạo `HUONG_DAN_GITHUB_CLAUDE_CODE.md`, viết lại README.md, thêm mục "Làm việc bằng Claude Code" vào CLAUDE.md. Anh tải lên GitHub repo `s3894288/thaiput_v8.1.4` (4 commit, 13:43 đến 13:53, commit cuối "Delete thaiput_v8_github.zip").
* **12/11:** anh hỏi admin có tạo được buổi học vào giờ tutor chưa mở không. Trả lời (đã kiểm code và test giả lập): KHÔNG. "Đặt thay" (`apiAdminBook`) chỉ bỏ qua hạn 15:00 hôm trước, vẫn đòi dòng AVAILABILITY `OPEN` và tutor rảnh (báo `NO_TUTOR`); chỉ tutor tự mở giờ (`apiTutorSetAvailability`). Cách làm: nhờ tutor mở giờ (mở thêm được kể cả sau hạn thứ Bảy 22:00, giờ chưa bắt đầu, trong `BOOKING_HORIZON_DAYS` 28 ngày) rồi admin Đặt thay; cách phụ gõ tay dòng AVAILABILITY (chưa thử trên Google thật). Ghi vào `HUONG_DAN_VAN_HANH.md` Phần L4 và BACKLOG BL96. Đóng lại 2 bundle 8.1.4, viết lại `v8/repo/BOOTSTRAP.md`, sửa `test/tools/bundle.js`, ghi 41 file vào project. BACKLOG còn 33 câu chờ (A 29, B 4).
* **13/11:** tạo `v8/KHOI_DONG_CHAT_MOI.md` qua quy trình nhiều agent (agent soát chéo sửa 9 lỗi). Phát hiện memory `overview.md` lỗi thời; anh chưa trả lời có sửa không.
* **27/11:** anh yêu cầu sửa memory cho khớp, rà đồng bộ, tóm tắt cả chuỗi hội thoại thành tài liệu bàn giao, gộp vào KHOI_DONG_CHAT_MOI rồi đổi tên thành PROJECT_MEMORY, tạo md hướng dẫn đọc file project, đối chiếu repo GitHub, tối ưu dung lượng. Anh duyệt xoá 7 file `v8/archive/` khỏi project (bản gốc còn trên GitHub, đã so trùng; không nằm trong bundle). Việc sửa GitHub ghi vào BACKLOG (BL97, BL98), chưa làm. Memory (`overview.md`, `ways-of-working.md` của project) đã sửa cho khớp 8.1.4. CLAUDE.md sửa quy ước 6 (rà BACKLOG sau 5N, 5O) và 7 (bundle giữ làm dự phòng). Không đổi code; test chạy lại xanh hết.
* **27/11 tối:** anh lệnh làm các việc bị chặn. Đồng bộ main qua PR 3 (đã gộp). Phát hiện 2 PR cũ từ phiên Claude Code mà tài liệu project chưa biết: PR 1 (8.1.9) và PR 2 (8.1.5 SES). Anh chốt: giữ main 8.1.4, không đụng nhánh khác, đóng PR 2 giữ nhánh. Chuyển Private bị chặn. Đánh số lại BL96, BL97, BL98; thêm BL99.

## 5. Việc còn tồn, xếp theo thứ tự làm

Chỉ làm khi anh ra lệnh. Mục không có lệnh thì chỉ hỏi hoặc nhắc.

1. **Hỏi anh đã dán 8.1.4 lên STAGING chưa** (`HUONG_DAN_PHAT_HANH.md` mục 3, nâng thẳng từ 8.0.10, khoảng 45 phút). KHÔNG có file nào ghi anh đã làm. Chat sau phải hỏi. Nếu chưa, cài đăng nhập Google cho admin chỉ khi menu 2 báo chưa cài (`HUONG_DAN_VAN_HANH.md` Phần M, `HUONG_DAN_PHAT_HANH.md` mục 3.6).
2. **Quyết BL99 trước, rồi mới 5N, 5O.** 5N và 5O ĐÃ LÀM trên nhánh 8.1.9 (PR 1, chưa gộp). Làm lại trên main là làm trùng việc. Hỏi anh: gộp PR 1 (sau khi diễn tập trên bản sao STAGING) hay làm lại. Nếu làm lại trên main: **5N rồi 5O**, theo `plan/KE_HOACH_5J_5P.md` mục 2. 5N (tô màu Sheets, lựa chọn "Đã xử lý", báo buổi kẹt PENDING_REASSIGN) chặn bởi BL13. 5O (giao diện đen trắng, email HTML mới, viền đỏ đúng ô nhập sai) chặn bởi BL08, BL09, BL22. Chỉ bắt đầu khi anh ra lệnh đúng tên sub chunk. Câu chặn chưa được trả lời thì làm theo đề xuất trong BACKLOG, ghi rõ trong PROGRESS, giữ dòng đó ở BACKLOG.
3. **Sau 5N, 5O: nhắc anh rà toàn bộ `BACKLOG.md`** (anh chốt 02/11).
4. **BL96 và phần còn lại của 5Q** (`BACKLOG.md` mục A). BL96 chờ anh duyệt (không code khi chưa duyệt, vì đổi quyền mở giờ). BL69 (bảng hạn mức 5 dòng, kiểm thư tới 5 loại hộp thư; đề xuất làm cùng 5N), BL51 (phát hiện thư bị trả về), BL64 (chế độ Gmail API). BL65 đến BL68 là quyết định đã làm trong 8.1.4, chờ anh duyệt.
5. **Hướng dẫn bản thử song song để cập nhật code** (anh yêu cầu 02/11, chưa làm, chưa có file). Nền để đọc: `HUONG_DAN_PHAT_HANH.md` mục 3.
6. **Hướng dẫn go live chunk 6** (chưa viết). Đọc `plan/KE_HOACH_5J_5P.md` mục 5, `plan/LO_TRINH_V8_TOI_CUOI.md`, `BACKLOG.md` BL52.
7. **GitHub:** main đã đồng bộ (BL97 xong). Còn: anh chuyển repo sang Private (BL98: Settings, Danger Zone, Change visibility, Make private), và quyết nhánh 8.1.9 (BL99).
8. **Đề xuất chờ anh duyệt từ 13/11:** khi sửa code trong chat bằng bundle (không qua GitHub) thì cuối việc phải báo anh "GitHub chưa có bản này" và gửi file đổi. Xem mục 6 của file này.
9. **Số phiên bản kế tiếp:** bảng ở `plan/KE_HOACH_5J_5P.md` mục 1 là số cũ. Đề xuất 8.1.5 cho 5N, báo anh khi làm.

## 6. Khi cần sửa code

Cách chia hai đường dưới đây là đề xuất, rút từ `BOOTSTRAP.md` và `CLAUDE.md`; anh chưa chốt riêng. Chọn một trong hai đường cho mỗi việc, không trộn trong cùng một việc.

* **Đường 1, làm ngay trong chat bằng bundle dự phòng.** Dựng repo theo `v8/repo/BOOTSTRAP.md` mục 1: giải 2 file `v8/repo/SRC_BUNDLE.txt` và `v8/repo/TEST_BUNDLE.txt`, `npm install`, chạy `TZ=Asia/Ho_Chi_Minh node test/harness.js` (phải xanh hết), dựng `dist/` rồi so với `v8/dist/Code.gs`. Test đỏ, bundle hỏng, hoặc `dist/` không trùng: dừng, báo anh, không code tiếp. Chat không chạy được lệnh (không có môi trường chạy mã): dừng, chỉ làm việc kế hoạch hoặc tài liệu.
* **Đường 2, làm trên repo GitHub bằng Claude Code** theo `v8/HUONG_DAN_GITHUB_CLAUDE_CODE.md`. Phù hợp việc lớn. Lưu ý: main là 8.1.4; muốn làm tiếp trên bản 8.1.9 thì làm trên nhánh `claude/wizardly-gates-8xzfbn` và đọc BACKLOG, PROGRESS của chính nhánh đó (khác main).
* **Nguồn đúng của code là GitHub** theo BOOTSTRAP: bundle và GitHub lệch nhau thì tin GitHub (hiện `src/` hai bên trùng 8.1.4). Đề xuất chờ anh duyệt: nếu làm Đường 1, cuối việc phải nói rõ với anh "GitHub chưa có bản này", gửi từng file đã đổi để anh đưa lên GitHub, và ghi dòng đó vào PROGRESS.
* Mọi thay đổi code: test mới cho thay đổi đó, tăng `VERSION` trong `src/Config.gs` (số kế tiếp sau 8.1.4, đề xuất 8.1.5 và báo anh), việc lớn soát chéo 2 agent độc lập và thử phá, việc nhỏ 1 agent. Không sửa `dist/` bằng tay (luật 28).

## 7. Cuối mỗi việc (bắt buộc, nếu không chat sau mất công)

Các bước 1, 2, 4, 5 dưới đây dành cho việc làm trong chat (Đường 1, theo `BOOTSTRAP.md` mục 4). Việc làm bằng Claude Code (Đường 2) thì test, `npm run build` và commit theo `CLAUDE.md` mục "Làm việc bằng Claude Code"; bước 3 và 6 áp dụng cho cả hai đường.

1. Harness xanh, dựng `dist/`.
2. Đóng bundle (`node test/tools/bundle.js pack`) rồi `project_write` bằng `local_path`: `v8/repo/SRC_BUNDLE.txt`, `v8/repo/TEST_BUNDLE.txt`, `v8/dist/Code.gs`, `v8/dist/Index.html`, `v8/dist/appsscript.json` (nếu đổi), `v8/dist_google_login/*` (nếu đổi), `v8/PROGRESS.md`, cùng mọi file md đã sửa. Xoá thư mục `repo_bundle/` sau khi ghi.
3. Cập nhật `v8/BACKLOG.md` (mục mới, số câu còn chờ) và **mục 3 và mục 5 của `v8/PROJECT_MEMORY.md`** (trạng thái, số phiên bản, kết quả test, việc còn tồn), thêm dòng "Thay đổi so với bản trước".
4. Kiểm lại: đọc lại bundle vừa ghi và giải thử vào thư mục tạm, phải OK.
5. Gửi anh từng file riêng (Code.gs, Index.html, appsscript.json nếu đổi, PROGRESS.md). Không zip, trừ khi anh yêu cầu xuất cả repo. Không gửi lại file md không đổi.
6. Quyết định mới anh chốt trong chat phải được ghi vào file (BACKLOG mục "Đã chốt", PROGRESS) trước khi đóng chat.

## 8. Luật làm việc của anh Chris

* Trả lời bằng tiếng Việt. Gọi trợ lý là Alex. Gọi anh Chris là "anh". Anh không viết code: giải thích bằng ngôn ngữ đơn giản, tránh thuật ngữ nặng, nêu rõ từng bước anh phải làm trên Google.
* Không dùng dấu gạch nối làm dấu câu trong câu trả lời và văn bản. Gạch đầu dòng markdown thì được.
* Nói thẳng, harsh, không fluff, không bịa. Con số nào cũng phải lấy từ file hoặc từ kết quả chạy thật. Không biết thì nói không biết. Chủ động nêu giới hạn và rủi ro còn lại.
* Luôn đưa phương án khác khi đề xuất một hướng.
* Soát chéo bằng agent độc lập: việc lớn 2 agent và thử phá, việc nhỏ 1 agent.
* Anh hay chỉ định quy trình nhiều model (orchestrator, worker, supervisor) và mức effort. Alex chỉ chọn được dòng model (sonnet, opus, haiku) và effort cho agent con, không chọn được số phiên bản; Haiku không có effort.
* Mỗi sub chunk giao `PROGRESS.md` (kết quả test, việc của admin, số câu BACKLOG còn chờ) cùng file code đổi (Code.gs, Index.html, appsscript.json khi đổi quyền). Code.gs và Index.html là MỘT file gộp mỗi loại. Gửi file lẻ từng cái, không zip (trừ khi anh yêu cầu xuất cả repo). Không gửi lại md không đổi.
* Hướng dẫn và chính sách chỉ xuất khi anh yêu cầu; mở đầu bằng "Thay đổi so với bản trước"; viết độc lập, không dùng đại từ nhân xưng.
* Kế hoạch chưa được anh ra lệnh thì không làm. Mục chưa duyệt để ở `BACKLOG.md`.
* Sau mỗi việc cập nhật file mới nhất vào claude.ai project (`v8/`) bằng `project_write`, gồm cả 2 bundle; xoá bản thay thế, giữ project gọn.

## 9. Chỗ tài liệu còn lệch (biết trước để khỏi vấp)

* Bảng phiên bản ở `plan/KE_HOACH_5J_5P.md` mục 1 (5N 8.1.1, 5O 8.2.0, 5P 8.2.1, 5Q 8.2.2) là số cũ, 8.1.1 đã dùng cho 5J, 8.1.4 cho 5Q phần A. Nội dung 5Q trong plan là bản gốc, phần đã làm xem PROGRESS mục 5Q.
* Memory chỉ để tham khảo, file project thắng.

## 10. Nếu bí

Hỏi anh một câu ngắn, kèm 2 đến 3 phương án để anh chọn. Không đoán, không tự mở rộng phạm vi.

## 11. Câu mẫu cho anh Chris mở chat mới

Ba câu đầu tiên mẫu:

* "Đọc v8/PROJECT_MEMORY.md rồi làm 5N."
* "Đọc v8/PROJECT_MEMORY.md rồi cho anh biết tình hình, chưa làm gì."
* "Đọc v8/PROJECT_MEMORY.md rồi rà BACKLOG với anh."

Dòng tuỳ chọn cho Project instructions (để chat mới tự đọc file này):

* "Khi bắt đầu chat mới, đọc v8/PROJECT_MEMORY.md trước khi làm bất cứ việc gì. Trả lời tiếng Việt, gọi trợ lý là Alex."
