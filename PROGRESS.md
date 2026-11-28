# Thaiput v8 · Tiến độ theo chunk

**Trạng thái 15/11/2026: 5R XONG VÀ ĐÃ SOÁT CHÉO ĐỘC LẬP, bản 8.1.9.** Hệ thống anh đang chạy vẫn là **8.1.4**; repo giữ 8.1.9 ở nhánh `claude/wizardly-gates-8xzfbn` (draft PR #1, `main` vẫn là 8.1.4). Bốn việc của 5R: (1) gộp dòng trùng key ở EMAIL_TEMPLATES và CONTENT (anh thấy tận mắt LOGIN_LINK, REG_RECEIVED bị 2 dòng); (2) khung chuyển khoản mới có ô mã QR (CONFIG `BANK_QR_IMAGE`) và dòng lưu ý đậm, nổi; (3) tăng tốc tải trang, 5 mục an toàn; (4) tóm tắt thay đổi sau mỗi lần nâng cấp (tab RELEASE_LOG, thông báo và email), kèm bài thử nâng cấp thật từ database 8.1.4 lên 8.1.9 so từng ô. Sau khi giao lần đầu (14/11), anh yêu cầu soát gắt: hai agent soát chéo độc lập (X1 soát chéo toàn bộ 5R; X2 soát bằng đột biến và vận hành), rồi ba vòng sửa, mỗi vòng có supervisor (Opus) soát lại. Soát tìm ra lỗi thật (bảng ở mục "Soát chéo và sửa (14 đến 15/11)"), đã sửa hết; vòng soát thứ ba trả REVISE với một lỗi chặn (job mỗi giờ hoặc một lượt menu 1 thứ hai chen vào giữa lúc niêm phong bản ghi và lúc nhận gửi email có thể làm admin nhận 2 email tóm tắt, 2 thông báo, RELEASE_LOG gấp đôi; dữ liệu nghiệp vụ không bị ảnh hưởng), đã sửa ở commit `5292935`. Test tới commit `5292935`: hàm thuần 34/34, kịch bản 46/46, tích hợp 211/211 (228/228 sau lượt rà lần 2, thêm I213 đến I229), giao diện web 67/67 (71/71 sau lượt rà lần 2, thêm U68 đến U71), thử tải 2/2. **Hai câu ở bản giao 14/11 đã rút lại:** "13 đột biến bắt cả 13" quá lạc quan (lần soát đột biến 102 cái cho thấy 69 bị bắt, 33 sống sót), và "tích hợp 156/156 xanh" chỉ đúng khoảng 30 phút sau khi dựng dữ liệu mẫu, vì test I151 phụ thuộc đồng hồ thật. **Kết luận soát xác nhận của supervisor (Opus) trên commit sửa cuối `5292935`: ĐẠT (PASS).** Supervisor tự chạy lại ma trận của riêng mình: xen một lượt chạy thứ hai trước MỖI lần lấy khoá (6 kiểu ghép, 17, 17, 10, 10, 10 và 10 điểm khoá) cho 0 lượt giao trùng; cắt hoặc báo khoá bận ở MỌI lời gọi dịch vụ (cả menu 1: 1590 điểm; phần giao: 201 điểm; job mỗi giờ làm nốt: 417 và 336 điểm) cho 0 email, 0 thông báo và 0 dòng `RELEASE` thừa, chỉ đúng các cửa sổ đã ghi (9, 4 và 3 điểm); 30 mẫu email dựng ra chữ không đổi (180 trên 180 phép so sánh giống bản trước); các tab nghiệp vụ sau menu 1 trên database 8.1.4 mẫu giống hệt. Còn một cuộc đua thấp, không chặn, có từ trước đợt này: hai lượt menu 1 bấm cách nhau trong khoảng 6 lời gọi dịch vụ, trước lúc phiên bản được ghi nhận, đều có thể giao tóm tắt (2 email, 2 thông báo, RELEASE_LOG gấp đôi); supervisor đánh giá gần như không thể xảy ra trên Google thật. Lời khuyên: bấm menu 1 một lần và chờ hộp thoại hiện. Hỏi "có chạy bản này trên database 8.1.4 đang chạy thật không", supervisor trả lời: có, sau khi chạy thử một lượt trên bản sao STAGING của database thật (BL174). **Chưa chạy trên Google thật** (danh sách việc chỉ kiểm được trong bộ mô phỏng ở mục Giới hạn). BACKLOG còn **55 câu chờ anh** (mục A 52, mục B 3; thêm BL175 ngày 27/11, giao diện 390 px bằng tiếng Anh): 17 câu là của 5R (BL156 đến BL166 và BL169 đến BL174), BL167 và BL168 đã đóng. Hai việc nên quyết trước: **BL169** (PR #2 "gửi email qua Amazon SES" cũng đòi số bản 8.1.5 và xung đột với nhánh này ở 12 file) và **BL156** (chữ chuyển khoản tự mâu thuẫn). Chi tiết: mục "Chunk 5R" dưới đây.

**Trạng thái 12/11/2026: VÁ NỐT 2 MỤC PLAN CÒN THIẾU CỦA 5N VÀ 5O, bản 8.1.8.** Soát lại toàn bộ plan 5J đến 5P bằng 2 sub agent trước khi go live chunk 6 thì thấy 2 mục có tên trong plan nhưng chưa làm, nay đã làm:

* **5N mục 6 (bảng màu trong Hướng dẫn vận hành):** trước đó bảng màu chỉ nằm trong `PROGRESS.md`, còn `HUONG_DAN_VAN_HANH.md` vẫn tả màu CŨ (2 màu), nay SAI so với 8.1.7. Đã viết lại K6 BOOKINGS (6 màu) và K5 STUDENT_PACKAGES (5 màu), mỗi bảng có cột "làm gì để hết màu"; thêm lựa chọn "Đã xử lý (giữ nguyên)" vào bảng `admin_action`, ô CONFIG `REASSIGN_STUCK_HOURS` vào Phần B (99 ô), thông báo `REASSIGN_STUCK` vào Phần J, cột `admin_done_at` vào danh sách cột hệ thống. Hướng dẫn lên bản 8.1.7, có mục "Thay đổi so với bản trước".
* **5O mục Form (BL22, viền đỏ đúng ô nhập sai):** trước đó chỉ ô số điện thoại có viền đỏ, các ô khác chỉ gộp câu báo vào hộp đỏ phía trên. Nay gửi form thiếu thì tô viền đỏ ĐÚNG ô sai (tên, email, điện thoại, ảnh chuyển khoản, ô đồng ý, nhóm gói), con trỏ nhảy về ô sai đầu tiên, sửa ô nào thì ô đó hết đỏ ngay. Test mới U50 (giao diện web 50/50).

Còn lại trước go live chunk 6: **5P** (xuất 3 hướng dẫn còn lại và 2 chính sách, soát tổng 2 agent, thử tải lại) và phần còn lại của 5Q (BL69). BACKLOG còn **37 câu chờ anh** (mục A 34, mục B 3).

**Trạng thái 07/11/2026: 5N XONG, bản 8.1.7** (tô màu Sheets mới, "Đã xử lý (giữ nguyên)", báo buổi kẹt Chờ đổi tutor; soát chéo 2 agent tìm ra và đã sửa lỗi buổi kẹt không xử lý được). Chi tiết: mục "Chunk 5N" dưới đây. Chunk 5 còn 5P (hợp nhất, chốt v8). BACKLOG còn **38 câu chờ anh** (mục A 34, mục B 4). **Đến lượt anh rà BACKLOG** (đã hẹn sau 5N, 5O).

## Chunk 5R: key trùng, mã QR chuyển khoản, tốc độ, tóm tắt nâng cấp (14/11/2026, bản 8.1.9; soát chéo và sửa 14 đến 15/11)

### Làm gì

Phần này tả code ở commit `5292935` (đã gồm các sửa sau soát chéo). Bản giao đầu (14/11, commit `bbd2aef`) khác ở những chỗ ghi rõ "sau soát" dưới đây.

**T1. Hết dòng trùng key ở EMAIL_TEMPLATES (và CONTENT)**

* Triệu chứng anh gặp trên file thật: tab EMAIL_TEMPLATES có từng cặp 2 dòng cùng key (LOGIN_LINK, REG_RECEIVED).
* **Gốc lỗi đã chứng minh:** khi thêm dòng mặc định, menu 1 tra key bằng so khớp tuyệt đối, còn khi gửi thư thì key được cắt khoảng trắng đầu cuối. Một ô key có khoảng trắng thừa làm menu 1 thêm dòng thứ hai. Ngoài ra khi gửi thư dùng dòng CUỐI, còn phần logic menu dùng dòng ĐẦU, nên hai nơi hiểu khác nhau.
* **Đã sửa:** tra key sau khi cắt khoảng trắng; hai nơi dùng chung một dòng. Menu 1 tự **gộp** dòng trùng ở EMAIL_TEMPLATES và CONTENT thành một dòng ở vị trí đầu: chữ admin đã sửa thắng chữ mặc định hoặc ô trống; hai dòng cùng có chữ admin khác nhau thì dòng CUỐI (dòng 8.1.4 thật sự dùng khi gửi) thắng.
* **Chữ admin bị bỏ khi gộp luôn lưu ĐỦ (sau soát):** ở tab ACTIVITY_LOG, hành động `TEMPLATE_DEDUPE_TEXT`, ghi xuống Sheets TRƯỚC khi ghi đè bất kỳ dòng nào. Mỗi lượt gộp một tab có mã `run` (cũng nằm ở dòng tóm tắt `TEMPLATE_DEDUPE`, dòng này không chứa chữ); chữ dài chia mảnh 19.000 ký tự (`part`, `parts`) để ô không vượt giới hạn và trang quản trị hiện đủ. Hộp thoại menu 1 chỉ hiện 300 ký tự đầu của chữ bị bỏ và nói chỗ lấy bản đủ (cách ghép lại: `HUONG_DAN_VAN_HANH.md` Phần F). Bản giao đầu chỉ ghi bản cắt ngắn ở kết quả menu 1: chữ dài của anh có thể mất thật.
* **Cột `active` của mẫu email theo dòng CUỐI (sau soát):** 8.1.4 đọc dòng cuối khi gửi thư, nên gộp không được đổi việc một email đang gửi hay đang tắt. Nếu các dòng trùng nói khác nhau về `active`, menu 1 ghi riêng dòng "CHÚ Ý QUAN TRỌNG: mẫu email <key> có nhiều dòng nói KHÁC NHAU về ô active ..." (cũng vào RELEASE_LOG và email tóm tắt). Bản giao đầu coi chữ `FALSE` ở bất kỳ dòng nào là "anh đã sửa" và cho thắng, nên có thể tắt một email mà 8.1.4 đang gửi.
* **Sao lưu trước nâng cấp hỏng thì không gộp key nào sẽ bỏ chữ admin (sau soát):** để nguyên các dòng trùng, ghi "CẢNH BÁO: KHÔNG gộp key trùng ...", menu 2 vẫn nhắc. Gộp xong mà bị ngắt giữa chừng: dòng "CẢNH BÁO: gộp dở ..." trỏ tới chữ đã lưu; chạy lại menu 1 để gộp nốt.
* Gộp CONTENT lấy `default_vi`, `default_en` từ CÙNG dòng với chữ `vi`, `en` đã chọn (sau soát), nếu không lần gieo chữ sau coi ô chưa sửa là "anh đã sửa" và không bao giờ nâng chữ gốc mới.
* Menu 2 và menu **Cập nhật nội dung web và email** báo khi một key xuất hiện 2 lần.
* **Anh cần biết hệ quả:** nếu dòng đầu có chữ anh sửa mà dòng cuối là chữ mặc định, thì sau khi gộp chữ anh sửa trở thành chữ thật sự được gửi (ví dụ thân tiếng Anh của REG_RECEIVED bắt đầu "Thaiput received"). Đó là chữ anh đã viết, nhưng trước đây thư gửi đi dùng dòng cuối, nên thư có thể đổi nội dung sau lần menu 1 này. Đọc lại các mẫu sau menu 1 (Việc của admin, bước 6).
* Test: I141 đến I145 (bản đầu); sau soát: I159 đến I162, I164, I175 đến I179, I190 đến I193.

**T2. Khung chuyển khoản mới, có mã QR**

* Khung ở trang đăng ký và trang gia hạn của học viên dùng chung một hàm dựng (`T.bankPanel`). Có ô QR vuông: 200 x 200 px trên điện thoại (nằm giữa, dưới các dòng tài khoản), 184 x 184 px trên máy tính (cột phải của khung). Ô CONFIG trống thì không hiện ô QR; `BANK_ACCOUNT` trống thì không dựng khung (kể cả khi có ảnh).
* Dòng lưu ý (key `h.bank_note`) thành khung nổi: chữ khoảng 16,8 px, đậm 700, nền vàng nhạt, vạch vàng bên trái, ở cả hai ngôn ngữ. Chữ mặc định mới: "Nội dung chuyển khoản: vui lòng chỉ ghi số điện thoại của bạn." và "Transfer reference: Please enter only your phone number." Chữ anh đã sửa trong CONTENT được giữ. Key mới `h.bank_qr_alt`.
* Ô CONFIG mới **`BANK_QR_IMAGE`**: link chia sẻ Drive hoặc mã file của ảnh. Máy chủ đọc file (png, jpeg, webp, gif; tối đa 300 KB) bằng `bankQrRead_`, nhớ đệm tối đa 6 giờ (mảnh 90.000 ký tự, dưới giới hạn 100 KB của CacheService; lỗi chỉ nhớ 300 giây); trình duyệt tải ảnh SAU khi khung đã hiện, qua API công khai `apiBankQr` (không đăng nhập, chỉ đọc), nên trang không chậm đi. `apiPublicInfo` chỉ mang dấu ngắn 10 ký tự (`qr`), JSON khởi động không mang gì về ngân hàng; cả hai không mang mã file hay ảnh. Menu 2 báo: trống, hợp lệ (loại, KB), hoặc hỏng (mã lỗi và cách sửa).
* **Ảnh mới hiện ngay, không chờ 6 giờ (sau soát):** số phiên bản ảnh nằm ở Script Property `BANK_QR_REV`, là một phần của dấu (`bankQrMarker_`) và của khoá bộ nhớ đệm máy chủ lẫn khoá ảnh trong trình duyệt (bộ nhớ của tab, theo dấu máy chủ trả về). Số này tăng bởi 3 đường: (1) mỗi lần chạy **menu 2**; (2) sửa tay ô `BANK_QR_IMAGE`, `BANK_NAME`, `BANK_ACCOUNT` hoặc `BANK_HOLDER` ở tab CONFIG (trigger sửa tay; đổi tài khoản mà còn QR cũ là chuyển nhầm tiền); (3) menu mới **thaiput → Email → Làm mới ảnh QR chuyển khoản (sau khi thay file ảnh)** (ghi nhật ký `BANK_QR_REFRESH`). Đổi LINK thì dấu đổi nên ảnh mới hiện ngay như trước. Bản giao đầu chỉ có cách đổi LINK; thay nội dung file cùng link thì khách thấy QR của tài khoản cũ tới 6 giờ (đây là BL167, nay đã đóng; phần còn lại là BL170).
* Test: U51, I146 (bản đầu); sau soát: I165, I180 đến I182, I194, U55 đến U61, U66.

**Phê bình ý anh muốn dán ảnh THẲNG VÀO ô CONFIG, và quyết định**

Anh muốn chèn ảnh vào ô của tab CONFIG. Không làm, 3 lý do:

1. Apps Script không đọc được nội dung ảnh nằm trong ô; chỉ lấy được một link tạm của Google, hết hạn hoặc trả về rỗng. Web không có gì để gửi cho học viên.
2. Cột `value` của CONFIG là chữ; `cfg_` và bộ nhớ đệm CONFIG 60 giây chỉ chứa chữ, không chứa đối tượng ảnh.
3. Nhật ký sửa tay (`logSheetEdit_`, luật 52) sẽ gặp một đối tượng ảnh thay vì chữ.

Cách đã chọn: ảnh là một file trên Drive, ô CONFIG giữ link. Anh vẫn làm đúng việc chỉ một chỗ (dán link), và ảnh nằm ngoài Sheets nên không làm file dữ liệu nặng thêm.

**T3. Tăng tốc tải trang**

Kiểm toàn bộ đường tải rồi làm 5 mục an toàn: (1) stylesheet Google Fonts không còn chặn hiển thị và lượt gọi máy chủ đầu tiên; (2) khung chờ tĩnh trong `#app` nên có gì đó hiện trước khi chạy script; (3) ảnh bìa có sẵn rộng và cao (không giật bố cục); (4) cổng tutor tải trước giờ rảnh ở nền, mở tab Giờ rảnh là hiện ngay khi dữ liệu còn mới (dưới 60 giây); bản tải trước gắn với phiên của đúng tutor đã tải nó (sau soát: tutor khác vào cùng tab không bao giờ thấy giờ rảnh của người trước); (5) đọc tab tính sẵn bộ chuẩn hoá từng cột (nhanh hơn khoảng 9 phần trăm trên tab 5.000 dòng trong bộ mô phỏng). Test U52, U53, I147; sau soát U54, U62 đến U65, U67.

**Một lỗi tutor có từ 8.1.4, sửa trong lượt soát:** ở trang tutor, phản hồi tải giờ rảnh tới muộn (sau khi tutor đổi tab rồi mở lại và chọn giờ chưa lưu) ghi đè giờ vừa chọn, rồi nút Lưu không gửi gì. Đã chặn phản hồi cũ (đối chiếu `git diff` Tutor.html giữa `origin/main` và HEAD: hàm `drawAvail` của 8.1.4 gán `st.av`, `st.dirty` cho mọi phản hồi, không kiểm lượt vẽ). Test U62, U67.

Số đo khi kiểm toán: `Index.html` dựng xong khoảng 290 KB, khoảng 125 KB nén, trong đó ảnh bìa nhúng khoảng 74 KB (59 phần trăm). Trang chủ cần 1 lượt gọi máy chủ (`apiPublicInfo`); cổng học viên và cổng tutor mỗi nơi 1 lượt. Các mục tối ưu lớn hơn (nén ảnh bìa, nhúng thông tin công khai vào trang đầu, kéo dài bộ nhớ đệm, gửi email link ngoài khoá...) cần anh quyết: BL157 đến BL164. Con số tăng tốc vẫn là ước lượng cho tới khi đo trên Google thật.

**T4. Bản 8.1.9 và tóm tắt nâng cấp**

* Đóng số bản 8.1.9, ngày 14/11/2026 (đầu `Code.gs`, dòng đầu menu 1, JSON khởi động, `package.json`).
* `RELEASE_NOTES_` trong code giữ ghi chú của 8.1.5 đến 8.1.9. Khi menu 1 thấy phiên bản đã đổi trên file đã có dữ liệu, nó lập **tóm tắt**: ghi chú tĩnh của mọi bản sau bản đang chạy, cộng những gì lượt chạy THẬT SỰ làm (khoá CONFIG thêm, khoá CONFIG lạ chỉ báo không xoá, dòng CONTENT thêm, chữ mặc định làm mới ở ô admin chưa sửa, chữ admin được giữ khi mặc định đổi, mẫu email thêm, dòng trùng gộp, cột và tab thêm). Tóm tắt đi ba đường: hộp thoại menu 1, tab mới **RELEASE_LOG** (chỉ ghi thêm), và MỘT thông báo `RELEASE_NOTES` cùng MỘT email (mẫu `ADMIN_RELEASE_NOTES`, tới `ADMIN_EMAIL`) mỗi lần đổi phiên bản. Menu mới **Cập nhật phiên bản → Phát hành: xem thay đổi của bản này**. Khoá CONFIG mới được thêm ghi chú "Mới ở <bản>: ..." ở cột note; giá trị và ghi chú đã có không bao giờ bị ghi đè. Trên bộ dữ liệu mẫu 8.1.4, RELEASE_LOG có 64 dòng (44 mục ghi chú cộng 20 mục đo thật).
* **Giao bền (sau soát):** bản ghi `RELEASE_PENDING` trong Script Properties (tối đa 12 phần, mỗi giá trị dưới 8.000 byte UTF-8) được ghi CÙNG một lệnh với dấu phiên bản. Năm đường giao có trạng thái riêng: nhật ký `RELEASE`, tab RELEASE_LOG, thông báo, email, dòng MAIL_LOG của email. Khoá bận, bị Google cắt giữa chừng hay email lỗi thì menu 1 lần sau (cùng phiên bản; hộp thoại ghi "TIẾP TỤC giao tóm tắt cập nhật bản ...") hoặc job mỗi giờ làm nốt đúng phần thiếu, không làm lại phần đã xong; khi còn đường chưa xong hộp thoại ghi "CÒN DỞ (...)". Bản giao đầu ghi nhận phiên bản rồi mới giao: cắt giữa chừng là mất tóm tắt vĩnh viễn.
* **Email gửi đúng một lần (sau soát):** email đi qua `sendTpl_` (luật 32; tuỳ chọn mới `opts.beforeSend`, `opts.collect`). Lượt chạy nhận việc gửi trong khoá (dấu 4 ghi bền) TRƯỚC khi gửi, nên một bản ghi không bao giờ cho hai email (bấm menu 1 hai lần sát nhau vẫn có thể sinh hai bản ghi, BL174). Mỗi đường giao (nhật ký `RELEASE`, RELEASE_LOG, thông báo, email, dòng MAIL_LOG) còn đọc lại bản ghi đang lưu TRONG khoá của nó (`sync`), ghi và đánh dấu trong cùng khoá, và một bản ghi đã được lượt khác giao xong thì lượt này không bao giờ ghi lại (`gone`); việc nhận gửi cũng kiểm mốc ghi nhận `at`. Lượt đến sau trong hộp thoại ghi "một lượt chạy khác đã giao (hoặc đang giao) tóm tắt này". Bản ghi chưa niêm phong còn sót thì menu 1 cùng phiên bản hoặc job mỗi giờ dọn. Email lỗi thật thì thử lại tối đa 5 lần rồi báo MỘT thông báo `MAIL_FAILED` chỉ chỗ đọc tóm tắt; khoá bận không tính là lần lỗi. Đường dòng MAIL_LOG cũng bỏ cuộc sau 5 lỗi thật (ghi log, không nuốt im). Nếu một lượt bị ngắt đúng khoảng hẹp từ lúc nhận việc tới lúc Google nhận thư, hoặc ngay sau khi Google nhận thư, anh có thể KHÔNG nhận email, hoặc nhận email mà vẫn có thông báo "có thể đã hoặc chưa gửi"; trong cả hai trường hợp chỉ MỘT thông báo và tóm tắt nằm ở tab RELEASE_LOG (quyết định: thà thiếu email còn hơn gửi trùng, BL173).
* **Chạy lại menu 1 cùng phiên bản:** khi mọi đường giao đã xong thì im lặng: không tóm tắt, không dòng RELEASE_LOG, không email, không thông báo, không sao lưu thêm; chỉ thêm đúng một dòng `SETUP_RUN` ở ACTIVITY_LOG (luật 11), và lần chạy lại đầu tiên (lượt 2 trong test I155) cập nhật một ô META (mốc mã thông báo) cho kịp thông báo vừa tạo (test I155). Khi còn đường chưa giao xong thì KHÔNG im lặng: nó làm nốt và nói rõ.
* **Số đo của menu 1 bị ngắt giữa chừng được giữ (sau soát)** qua các lượt, nên tóm tắt cuối vẫn đủ.
* **Khoá CONFIG có khoảng trắng thừa hoặc ký tự vô hình (sau soát):** khoá được so khớp sau khi chuẩn hoá (`cfgKeyNorm_`: bỏ U+200B, U+200C, U+200D, U+2060, U+FEFF rồi cắt khoảng trắng), ô khoá được cắt gọn và báo, nên menu 1 không còn thêm dòng mặc định trống đè giá trị của anh. Hai dòng chỉ khác nhau ở khoảng trắng hoặc ký tự vô hình: giữ cả hai, không xoá, không tự đổi giá trị, báo ở menu 1 và menu 2. Dòng có hiệu lực là dòng CUỐI trong các dòng có khoá sạch; dòng chỉ khác ở ký tự vô hình chỉ là dự phòng, nên nếu nó nằm SAU khoá sạch thì dòng khoá sạch vẫn là dòng được dùng (câu báo nêu đúng số hàng). Nếu dòng đang có hiệu lực mang giá trị mặc định hoặc trống trong khi dòng kia có giá trị khác thì thêm câu "CHÚ Ý" nêu số hàng và cách sửa tay (BL171).
* Menu 1 cũng dọn mốc bỏ dòng dở `PURGE_OPEN_<tab>` còn sót từ lần bỏ dòng bị cắt (trước đây báo nhầm "tab bị sửa tay").
* **Bằng chứng nâng cấp:** một database 8.1.4 đầy đủ (dựng bằng chạy chính code 8.1.4) được nâng bằng menu 1 của 8.1.9 trong test I151 đến I157, so từng ô (bảng dưới); PACKAGES, USERS, REGISTRATIONS, STUDENT_PACKAGES, PAYMENTS, AVAILABILITY, AUTH, METRICS, MARKETING_EMAILS không đổi một ô nào, BOOKINGS chỉ thêm tiêu đề cột. Dán code mới mà chưa chạy menu 1 thì trang, đăng nhập, đặt, huỷ, job vẫn chạy (I151). Sau soát, dữ liệu mẫu không còn phụ thuộc đồng hồ thật (I158). Đây là bằng chứng trong bộ mô phỏng, chưa phải trên Google thật.
* Không đổi `appsscript.json` (quyền Drive đã có). Số trigger vẫn 8.

### Ảnh QR: thông số cho admin

| Mục | Giá trị |
|---|---|
| Định dạng | PNG (nhận cả JPG, WEBP, GIF) |
| Kích thước | **600 x 600 px**, VUÔNG đúng 1:1 |
| Cắt | Cắt sát thẻ QR nền trắng, gồm cả logo ngân hàng |
| Lề trắng | Ít nhất 16 px mỗi cạnh |
| Dung lượng | Dưới 300 KB (khuyên dưới 150 KB) |
| Hiện trên web | 200 x 200 px trên điện thoại (giữa, dưới các dòng tài khoản); 184 x 184 px trên máy tính (cột phải của khung) |
| Ô CONFIG | `BANK_QR_IMAGE`: link chia sẻ Drive hoặc mã file. Trống = không hiện ô QR |
| Kiểm | Menu 2: trống (thông tin), hợp lệ (loại, KB), hoặc hỏng (mã lỗi và cách sửa) |
| Đổi ảnh | Đổi LINK: hiện ngay. Thay nội dung file giữ nguyên link: chạy **menu 2** hoặc menu **Email → Làm mới ảnh QR chuyển khoản**, hoặc sửa tay một trong 4 ô `BANK_QR_IMAGE`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` thì hiện ngay; không làm cách nào thì tới 6 giờ (BL170) |

### Soát chéo và sửa (14 đến 15/11)

Anh yêu cầu soát gắt bản 8.1.9 với supervisor Opus. Bản giao 14/11 (commit `bbd2aef`) chỉ có một orchestrator và mỗi việc một worker, nên luật "Soát" của CLAUDE.md chưa được áp dụng (BL168, nay đóng). Lượt soát dưới đây đã áp dụng. Thứ tự và kết quả:

| Ai | Làm gì | Kết quả |
|---|---|---|
| A1 (chỉ đọc) | Kiểm mọi sản phẩm của 5O (8.1.5, 8.1.6), 5N (8.1.7) và bản vá 8.1.8 còn nguyên trong `src/` và `dist/` ở 8.1.9 | Đủ. Trong 322 dòng thêm giữa 8.1.4 và 8.1.8, ở 8.1.9 chỉ 2 dòng khác đi (số phiên bản; dòng ảnh bìa có thêm rộng và cao). Không test nào bị xoá, đổi tên hay làm yếu bởi 5R. 0 khai báo cấp cao trùng trong 846 tên (673 hàm và 173 biến; đếm lại 27/11 bằng bộ phân tích cú pháp acorn trên từng file `src/*.gs`, 38 file; số 797 của lượt A1 dùng cách đếm khác), 0 khoá object trùng. `dist/` dựng lại giống từng byte. `appsscript.json` không đổi từ 8.1.4. Lịch sử git thẳng |
| X1 (Opus) | Soát chéo 5R | REVISE: có lỗi thật |
| X2 | Soát bằng đột biến và vận hành: 102 đột biến của `src/` | 69 bị test bắt, 33 sống sót, trong đó 9 đột biến tương đương (đổi code mà hành vi không đổi) nên 24 là lỗ hổng test thật; thêm lỗi vận hành thật (bảng dưới) |
| Vòng sửa 1 | Commit `45f6285` (sửa các lỗi của lượt soát chéo đầu) | Supervisor S1: REVISE, 1 trung bình và 7 thấp, đã áp dụng hết ở commit `9b49cdc` |
| Vòng sửa 2 | Commit `84a0b96` (lỗi vận hành và đột biến của X2) | Supervisor S2: REVISE, 2 cao, 2 trung bình và các mục thấp, đã áp dụng hết ở commit `c59cbce` |
| Soát vòng 3 | Supervisor (Opus) soát hai commit sửa `9b49cdc` và `c59cbce` | REVISE: 1 lỗi chặn, 1 trung bình và các mục thấp, đã áp dụng hết ở commit `5292935`. Lỗi chặn: job mỗi giờ hoặc một lượt menu 1 thứ hai chen vào giữa lúc niêm phong bản ghi và lúc nhận gửi email có thể làm admin nhận 2 email tóm tắt, 2 thông báo `RELEASE_NOTES`, RELEASE_LOG gấp đôi (122 dòng thay vì 61) và 2 dòng nhật ký `RELEASE`; dữ liệu nghiệp vụ không bị ảnh hưởng |
| Vòng sửa 3 | Commit `5292935` (lỗi chặn và các mục của vòng soát 3) | Xem hàng 25 đến 29 của bảng lỗi |
| Soát xác nhận | Supervisor (Opus) soát lại commit `5292935` và tự chạy lại các ma trận của mình | ĐẠT (PASS), chỉ còn một cuộc đua thấp, không chặn, có từ trước (BL174); chi tiết ở dòng đầu file này |
| Rà lại 26/11 | Opus rà lại commit `8f08d3d` (không có commit mới từ 15/11) | ĐẠT: `npm test` 34/34, 46/46, 211/211, 67/67, 2/2; `npm run build` không làm lệch `dist/`; CI xanh; 320 trên 322 dòng thêm từ 8.1.4 tới 8.1.8 còn nguyên ở 8.1.9 (2 dòng khác: số phiên bản, thẻ ảnh bìa thêm kích thước); các dòng 5R xoá hoặc thay của bản cũ đều đã chuyển chỗ (menu 1 vẫn chạy `migrate5M_`, thêm luật thông báo, điền `name_en`, tô màu); `dist/Code.gs` và 8 đoạn script của `dist/Index.html` hợp lệ cú pháp; `appsscript.json` không đổi từ 8.1.4. Phát hiện mới: số điện thoại không bắt buộc nên dòng đậm "chỉ ghi số điện thoại" không dùng được cho học viên bỏ trống số (ghi thêm vào BL156) |
| Rà lại lần 2, 26 đến 27/11 | Opus rà lại lần nữa: dựng thật bằng Playwright 5 trang x 2 chiều rộng x 2 ngôn ngữ, có QR và không QR; kiểm sự thật tài liệu (338 nhóm khẳng định); thử lại đột biến | ĐẠT: Playwright 0 tràn ngang, 0 khoá chữ thô, 0 lỗi console; kiểm tài liệu 338 nhóm khẳng định. Sửa ở commit này (F1 đến F16): F1 chú thích bảng số của tutor `t.stats_note` hứa tự tính Hoàn thành sau 24 giờ, sai luật 55, **là lỗi sản phẩm duy nhất phải sửa ngay (BL175 là lỗi giao diện nhỏ, để BACKLOG), có từ 8.1.4** (chữ gốc mới, ghi chú phát hành, test I213, các test nâng cấp I149 đến I157 cập nhật đúng phần làm mới này, comment cũ ở `Jobs.gs`); F2 ghi chú phát hành và tài liệu nói đúng ngoại lệ BL174 về email gửi hai lần; F3 đến F5, F7 đến F12 chữ tài liệu cho khớp mã (trỏ mục 3A.4, mẫu REG_RECEIVED và ADMIN_NEW_REG ở BL156, cách gộp key, chữ hộp thoại sao lưu, danh sách test I197 đến I210, mốc META lần chạy lại đầu, JSON khởi động, phạm vi BL170); F6 chữ nói ACTIVITY_LOG sang file lưu trữ sau LOG_KEEP_DAYS; F13 nhãn `CONFIG_KEY_TWIN` đúng luật dòng có khoá sạch; F14 số, ngày, đếm 846 tên; F15 bỏ khai báo `xWindows` chết trong `test/integration.js`; F16 thêm BL175. Thử lại đột biến: thử phá lại trên mã cuối: 144 đột biến (ít nhất 13 mỗi vùng), bắt 116, lọt 28 (4 tương đương, 24 là khe test); thêm 19 test vá (I214 đến I229, U68 đến U70), supervisor xác nhận không có lỗi sản phẩm mức cao; sửa thêm một lỗi nhỏ: ảnh QR bị ẩn tới khi tải lại trang nếu lần tải ảnh hỏng vì mạng (test U71); sửa test I166 lúc đỏ lúc xanh (đồng hồ thật chen giữa lúc ghi và lúc đọc bộ nhớ đệm) |
| Đánh lại số 28/11 | Để nhánh này gộp được với draft PR #2 (số BL và số test ở hai nhánh trùng nhau cho các mục khác nhau) | Chỉ đổi số, không đổi hành vi hay kết quả test: BACKLOG BL70 đến BL95 thành BL150 đến BL175 (mỗi số cộng 80, trong BACKLOG, PROGRESS, CLAUDE, hướng dẫn, README, `src/Release.gs` và `dist/Code.gs` (dựng lại bằng build)); test tích hợp I136, I137, I138 thành I230, I231, I232. Số câu chờ anh vẫn là 55 (mục A 52, mục B 3). Chi tiết ở dòng BL169 của BACKLOG |

**Danh sách lỗi và việc đã làm.** Cột "Mức" là ước lượng của người viết tài liệu theo hậu quả (cao: mất chữ hoặc dữ liệu của admin, gửi trùng hoặc đổi việc gửi thư; trung bình: hiện hoặc báo sai, rò rỉ, bằng chứng test sai; thấp: gọn gàng, tài liệu). Mức do từng reviewer chấm riêng cho từng lỗi không có trong tay tôi; chỉ có số đếm theo vòng ở bảng trên.

| # | Lỗi (hậu quả nếu không sửa) | Mức | Đã làm | Test |
|---|---|---|---|---|
| 1 | Test I151 phụ thuộc đồng hồ thật: dữ liệu mẫu lưu mốc theo đồng hồ thật (nhịp tim job, `BACKUP_OK_AT`, `MET_LAST`), khoảng 30 phút sau khi dựng thì trang health báo STALE và test đỏ. "156/156 xanh" chỉ đúng khoảng 30 phút | Trung bình (bằng chứng sai) | Nạp dữ liệu mẫu dời mốc đồng hồ thật về "bây giờ" theo TÊN khoá (`rebaseRealClock`); khoá mốc thời gian chưa phân loại thì ném lỗi | I158 |
| 2 | Chữ admin bị bỏ khi gộp key chỉ hiện bản cắt ngắn ở kết quả menu 1: chữ dài của anh mất thật | Cao | Lưu ĐỦ ở ACTIVITY_LOG `TEMPLATE_DEDUPE_TEXT`, ghi xuống Sheets TRƯỚC khi ghi đè; mã `run` để ghép đúng lượt; mảnh 19.000 ký tự vừa trang quản trị; báo "gộp dở" | I159, I160, I190 đến I192 |
| 3 | Sao lưu trước nâng cấp hỏng mà vẫn gộp bỏ chữ admin | Cao | Không gộp key nào sẽ bỏ chữ admin khi sao lưu hỏng; CẢNH BÁO; menu 2 vẫn nhắc | I161 |
| 4 | Cột `active` của mẫu trùng: dòng nào ghi FALSE thì thắng, trong khi 8.1.4 gửi theo dòng cuối; gộp có thể tắt một email đang gửi | Cao | `active` theo dòng cuối, hai chiều; dòng "CHÚ Ý QUAN TRỌNG" riêng; `emailActiveOn_` khớp biểu thức của 8.1.4 | I162, I193 |
| 5 | Ảnh QR cũ sống tới 6 giờ sau khi thay file cùng link (đổi tài khoản ngân hàng mà khách còn thấy QR cũ) | Cao | `BANK_QR_REV` trong dấu, khoá bộ nhớ đệm máy chủ và trình duyệt; tăng bởi menu 2, sửa tay 4 ô CONFIG, menu Làm mới ảnh QR; số mới lấy từ UUID, không từ đồng hồ; ảnh nhớ theo dấu máy chủ trả về | I165, I194, U60, U61, U66 |
| 6 | Bản ghi `RELEASE_PENDING` cắt theo ký tự: chữ Việt có dấu vượt 9 KB mỗi giá trị của Script Properties thì mất mục hoặc lỗi ghi | Trung bình | Cắt theo byte UTF-8; phần quá 8.000 byte sang `RELEASE_PENDING_1`, `_2`...; báo mục không lưu hết | I163, I171, I187 |
| 7 | Gộp CONTENT: `default_vi`, `default_en` lấy từ dòng đầu trong khi `vi`, `en` lấy từ dòng khác; lần gieo sau không bao giờ nâng chữ gốc mới | Thấp | Lấy cùng dòng với chữ đã chọn | I164 |
| 8 | Bản giờ rảnh tutor tải trước không gắn với phiên: tutor B vào cùng tab trong 60 giây có thể thấy giờ rảnh của tutor A | Trung bình (rò rỉ giữa hai người dùng chung máy) | Gắn bản tải trước với phiên đã tải; quên dữ liệu người trước khi đổi phiên | U54, U63 đến U65 |
| 9 | Tóm tắt nâng cấp không bền: ghi nhận phiên bản rồi mới giao, nên khoá bận hoặc Google cắt giữa chừng làm mất tóm tắt, RELEASE_LOG, thông báo, email vĩnh viễn | Cao | Bản ghi `RELEASE_PENDING` ghi cùng lệnh với dấu phiên bản; 5 đường giao có trạng thái riêng; làm nốt bằng menu 1 hoặc job mỗi giờ | I166 đến I169, I197 đến I199 |
| 10 | Số đo của menu 1 bị ngắt mất, vì lượt sau không còn gì để đo (dữ liệu đã đổi) | Trung bình | Ghi bền số đo từng bước, gộp không trùng qua các lượt | I170, I171, I188 |
| 11 | Khoá CONFIG có khoảng trắng thừa ("BANK_NAME "): menu 1 thêm dòng mặc định trống ở dưới và dòng đó thắng, giá trị của anh biến mất khỏi trang (theo ghi chú trong code, đây là kiểu hỏng đã có ở menu 1 bản 8.1.4) | Cao | So khớp khoá sau chuẩn hoá, cắt gọn ô khoá, báo; hai dòng song sinh giữ cả hai và báo, không đoán | I172, I173, I200 đến I202 |
| 12 | Mốc `PURGE_OPEN` sót sau lần bỏ dòng bị cắt: báo nhầm "tab bị sửa tay" | Thấp | Menu 1 và job mỗi giờ dọn khi tab nhất quán; tab thật sự bị sửa thì không xoá gì và báo Khẩn | I174, I207 |
| 13 | Mock CacheService lỏng hơn Google (luật 14): bộ test tự tin hơn thực tế | Trung bình | Mock nghiêm như Google: mục hết hạn trả null, giá trị phải là chữ, khoá không trống, hạn 1 đến 21.600 giây; mock Script Properties giữ hạn mức tổng 500 KB | I166, I203 |
| 14 | Tutor: phản hồi tải giờ rảnh tới muộn xoá giờ vừa chọn chưa lưu, nút Lưu không gửi gì (có từ 8.1.4) | Trung bình | Chặn phản hồi của lượt vẽ cũ | U62, U67 |
| 15 | Khoá bận đúng lúc ghi MAIL_LOG sau khi Google ĐÃ nhận email: menu 1 nói sai "CHƯA gửi" và lượt sau gửi LẦN HAI | Cao | Dòng MAIL_LOG giao qua bản ghi bền, khoá bận không tính là lần lỗi | I196 |
| 16 | Hai lượt chạy cùng lúc (job và menu, ...) cùng gửi email: hai email | Cao | Nhận việc gửi trong khoá (dấu 4) trước khi gửi; lượt sau thấy dấu 4 thì không gửi, báo một thông báo trung thực. Chưa đủ: xem hàng 25 | I199, I210 |
| 17 | Dòng nhật ký ghi trong khoá của job mỗi giờ chưa xuống Sheets mà đã đánh dấu đường giao xong | Trung bình | Ghi xuống Sheets rồi mới đánh dấu | I197 |
| 18 | Khoá CONFIG cũ có khoảng trắng bị cập nhật hai lần trong một lượt (cắt khoá rồi ghi chú "Không dùng từ"): menu 1 ném lỗi "không thấy dòng" | Trung bình | Menu 1 không ném lỗi "không thấy dòng"; khoá đổi tên được chép trong cùng lượt | I200 |
| 19 | Hai dòng CONFIG song sinh mà giá trị của anh nằm ở dòng KHÔNG có hiệu lực (dòng đang dùng mang mặc định hoặc trống) mà chỉ báo chung chung | Trung bình | Thêm câu "CHÚ Ý" nêu số hàng và cách sửa tay; hệ thống không tự đổi giá trị đang chạy | I201 |
| 20 | Khoá CONFIG có ký tự vô hình (U+200B, U+200C, U+200D, U+2060, U+FEFF) hoặc dấu cách không ngắt U+00A0 | Trung bình | Chuẩn hoá `cfgKeyNorm_` | I202 |
| 21 | Bản ghi giao có thể phình vượt kho Script Properties 500 KB | Thấp | Tối đa 12 phần; phần quá đếm vào `trunc` và báo "MEASURED_TRUNCATED" | I203 |
| 22 | Giao nốt tóm tắt của bản trước bị bỏ phần nào thì biến mất im lặng; bản ghi chưa niêm phong mồ côi | Trung bình | Một thông báo trung thực; không để bản ghi mồ côi | I204, I205 |
| 23 | Cờ `--same-version` của `release_baseline.js` (ghi lại baseline khi mặc định đổi mà số bản không đổi) chưa buộc gõ kèm đúng số phiên bản hiện tại; dễ ghi baseline nhầm cho một bản đã phát hành | Thấp | Phải kèm đúng `APP.VERSION` hiện tại | I195 |
| 24 | Các lỗ hổng test do đột biến sống sót (key trùng nhiều dòng, ảnh QR, lỗi bất ngờ khi dựng tóm tắt, quá 400 mục, khoá CONFIG lạ...) | Thấp đến trung bình | Test mới mang tên đột biến (M07 đến M90 trong tiêu đề): chạy khô `seedContent_`, mốc `PURGE_OPEN`, quay về 8.1.4 rồi nâng lần hai, khoá bận ở mọi đường | I175 đến I189, I205 đến I209, U55 đến U59 |
| 25 | Hai lượt chạy chen nhau (job mỗi giờ hoặc menu 1 thứ hai chạy giữa lúc niêm phong bản ghi và lúc nhận gửi email, rồi ghi lại bản ghi cũ): admin nhận 2 email tóm tắt, 2 thông báo `RELEASE_NOTES`, RELEASE_LOG gấp đôi, 2 dòng `RELEASE`. Dữ liệu nghiệp vụ không bị ảnh hưởng | Cao (lỗi chặn của vòng soát 3) | Mỗi đường đọc lại bản ghi trong khoá (`sync`), ghi và đánh dấu trong cùng khoá; bản ghi đã giao xong và bị xoá không bao giờ được ghi lại (`gone`); nhận gửi kiểm cả mốc `at`; hộp thoại nói "một lượt chạy khác đã giao"; bản ghi chưa niêm phong mồ côi bị menu 1 cùng phiên bản hoặc job mỗi giờ dọn | I210 |
| 26 | Đường dòng MAIL_LOG nuốt lỗi thật im lặng và thử mãi | Trung bình | Ghi log, đếm lỗi, bỏ cuộc sau 5 lần (báo admin một lần, xoá bản ghi) | I212 |
| 27 | Email tóm tắt gọi thẳng `sendMail_` thay vì `sendTpl_` (trái luật 32) | Thấp | Đi qua `sendTpl_` với `opts.beforeSend` (nhận việc gửi trước khi gọi Google) và `opts.collect` | I210 đến I212 (đường gửi mới), `src/EmailTemplates.gs` |
| 28 | Khoá CONFIG có ký tự vô hình nằm SAU khoá sạch: câu báo vẫn nói "dòng CUỐI có hiệu lực" (sai: dòng khoá sạch mới được dùng) | Thấp | `cfgTwinText_` nêu đúng dòng có hiệu lực; menu 1 nhắc cả khoá có ký tự vô hình | I211, I212 |
| 29 | Giao nốt bản ghi bản trước còn dở chỉ ở đường MAIL_LOG: thông báo không nêu đúng đường, danh sách có thể trống | Thấp | Thêm đường `mlog`, danh sách không bao giờ trống | I212 |

**Thử phá (đột biến), nói thẳng.** Con số "13 đột biến bắt cả 13" của bản giao đầu quá lạc quan: chỉ 13 đột biến, chọn theo test đã có. Lần soát độc lập bằng 102 đột biến cho 69 bị bắt (khoảng 68 phần trăm), 33 sống sót, trong đó 9 là tương đương, tức 24 lỗ hổng test thật. Các test mới ở hàng 24 viết ra để bắt các đột biến sống sót đó. Tôi KHÔNG có số đo lại trọn bộ 102 đột biến sau khi thêm test: chưa có bằng chứng "đột biến sống sót còn bao nhiêu", chỉ biết các test mới đang xanh.

**Bài thử cắt ngang (kill matrix), nói bằng lời.** Bộ mô phỏng giả vờ Google ngắt lượt chạy, hoặc báo "hệ thống bận" (khoá), ở MỌI lời gọi dịch vụ Google trong lượt giao tóm tắt, rồi cho các lượt sau (job mỗi giờ, menu 1) chạy tiếp tới khi yên và kiểm: có đúng một thông báo, một dòng `RELEASE`, RELEASE_LOG đủ và không trùng, không bao giờ hai email từ một bản ghi (hai lượt bấm menu 1 thật sát nhau thì khác, BL174). Kết quả ở commit `5292935` theo test I197, I198, I210 (số điểm cắt do từng test tự đếm khi chạy; ma trận của supervisor bọc nhiều lời gọi dịch vụ hơn của test nên số điểm của hai bên khác nhau, số của supervisor ghi ở dòng đầu file này): không điểm nào cho hai email, hai thông báo hay hai dòng `RELEASE`; khoá bận không bao giờ làm mất email, sinh thông báo hay thừa dòng MAIL_LOG. Trong mỗi ma trận cắt có 3 nhóm điểm rơi vào các cửa sổ còn lại (mục dưới): 9 điểm liền nhau (không email cộng một thông báo), 4 điểm liền nhau (email đã đi nhưng vẫn có thông báo "có thể đã hoặc chưa gửi" và không có dòng MAIL_LOG) và 3 điểm (thừa một dòng MAIL_LOG). **Xen kẽ hai lượt chạy (I210, sau vòng soát 3):** một lượt thứ hai chạy HẾT ngay trước MỖI lần lấy khoá của lượt thứ nhất, ở 6 cặp (menu 1 nâng cấp mới, menu 1 làm nốt, job mỗi giờ làm nốt, mỗi loại xen với menu 1 và với job mỗi giờ), theo test I210 (số điểm khoá do test tự đếm): không vi phạm nào (đúng một email, một thông báo, một dòng `RELEASE`, RELEASE_LOG đủ một bộ, hết bản ghi, không thông báo trung thực). Hai lượt chạy CÙNG LÚC ở cả bốn kiểu ghép (job và menu, job và job, menu và job, menu và menu) cho tối đa một email (I199). Đây là bằng chứng trong bộ mô phỏng; khoá thật của Google và giới hạn 6 phút chưa thử.

**Các cửa sổ còn lại (cố ý, đã đo, ghi trong comment phía trên `RELEASE_LEG_NAME_` của `src/Release.gs`; có bốn):**

1. Không email cộng một thông báo trung thực: lượt nhận việc gửi (dấu 4) rồi bị cắt trước khi Google nhận thư (9 điểm liền nhau mỗi ma trận). Hai lượt chạy cùng lúc cũng có thể báo thông báo đó dù email của lượt kia đã đi. Quyết định hiện tại: không dùng hạn thuê theo giờ (BL173).
2. Thừa một dòng MAIL_LOG nếu lượt chạy bị cắt đúng giữa lúc ghi dòng đó và lúc đánh dấu (3 điểm; dòng này chỉ để đếm hạn mức email trong ngày).
3. Thừa một dòng nhật ký `RELEASE` chỉ khi sau lần ghi dở có hơn 300 dòng nhật ký khác được ghi trước khi lượt sau chạy (lượt sau chỉ đọc 300 dòng cuối để nhận ra dòng đã ghi; ma trận cắt: 0 điểm).
4. Email ĐÃ đi nhưng vẫn có một thông báo "có thể đã hoặc chưa gửi" và không bao giờ có dòng MAIL_LOG: bị cắt ngay SAU khi Google nhận thư, trước khi bản ghi kịp đánh dấu email đã gửi (4 điểm liền nhau); dòng MAIL_LOG của email đó không còn ai ghi (chỉ ảnh hưởng số đếm hạn mức trong ngày).
5. Hai dòng CONFIG song sinh chỉ được BÁO, không tự sửa (BL171). Khoá có ký tự vô hình ở EMAIL_TEMPLATES và CONTENT chỉ được cắt khoảng trắng, chưa chuẩn hoá ký tự vô hình (BL172).
6. Thay file ảnh QR cùng link mà không chạy menu 2, không dùng menu Làm mới và không sửa 4 ô CONFIG liên quan thì tới 6 giờ mới đổi (BL170).

### Kết quả test

Chạy `npm test` (TZ Asia/Ho_Chi_Minh) trên nhánh ở commit `5292935`:

| Bộ | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 |
| 40 kịch bản | 46/46 |
| Tích hợp | 228/228 (211 tới `5292935`; I213 đến I229 thêm ở lượt rà lần 2: I213 chữ t.stats_note, I214 đến I229 là 16 test vá khe do thử phá). Bản giao đầu 156 test (I141 đến I145 key trùng, I146 ảnh QR, I147 đọc tab nhanh, I148 mỗi bản có ghi chú phát hành, I149 đối chiếu ghi chú với code, I150 tóm tắt và RELEASE_LOG, I151 đến I157 nâng cấp 8.1.4 lên 8.1.9 so từng ô). Sau soát thêm 55 test: I158 đến I165 (vòng sửa 1), I166 đến I189 (vòng sửa 2, gồm các test đột biến), I190 đến I195 (sửa theo S1), I196 đến I209 (sửa theo S2, gồm ma trận cắt ngang I197, I198 và hai lượt chạy cùng lúc I199), I210 đến I212 (sửa theo soát vòng 3: I210 xen kẽ hai lượt chạy ở mọi lần lấy khoá, I211 các đột biến M08, M13, M25, I212 đường MAIL_LOG và khoá có ký tự vô hình) |
| Giao diện web | 71/71. Bản giao đầu 53 (U51 khung chuyển khoản và QR, U52, U53 tải trang); sau soát thêm U54 đến U67; lượt rà lần 2 thêm U68 đến U70 (3 test vá khe do thử phá) và U71 (hồi quy lỗi ảnh QR bị ẩn khi tải hỏng vì mạng) |
| Thử tải | 2/2 |
| Thử phá | Bản giao đầu: 13 đột biến, "cả 13 bị bắt": ĐÃ RÚT LẠI vì quá ít. Soát độc lập X2: 102 đột biến, 69 bị bắt, 33 sống sót (9 tương đương, 24 lỗ hổng test thật); đã thêm test cho các lỗ hổng đó; chưa chạy lại trọn bộ 102 (xem mục Soát chéo) |
| Soát chéo | X1, X2 độc lập; supervisor S1, S2 và vòng soát 3 (REVISE, đã sửa ở `5292935`) sau mỗi vòng sửa; soát xác nhận trên `5292935` (kết luận ở dòng đầu file). Đây là bản soát đầu tiên của 5R, thay cho "chưa chạy" ở bản giao 14/11 |

Nói thẳng về bản giao 14/11: câu "tích hợp 156/156" chỉ đúng khoảng 30 phút sau khi dựng dữ liệu mẫu, vì test I151 phụ thuộc đồng hồ thật (lỗi số 1 ở bảng trên). Con số 211/211 hiện nay không còn phụ thuộc đồng hồ (I158).

### Nâng cấp từ 8.1.4: những gì đổi trong database

Đây là danh sách khác biệt DUY NHẤT test I152 cho phép khi nâng database 8.1.4 (bộ dữ liệu mẫu) lên 8.1.9 bằng menu 1. Gì ngoài danh sách là lỗi và test đỏ. Có đúng 10 tab có khác biệt; các tab còn lại không đổi một ô nào. Đối chiếu trực tiếp với `test/integration.js` (I152, I154).

| Loại | Nội dung |
|---|---|
| Tab mới | `RELEASE_LOG` (chỉ ghi thêm). Trên bộ dữ liệu mẫu có 64 dòng: 44 mục ghi chú của 8.1.5 đến 8.1.9 cộng 20 mục đo thật |
| Cột mới (chỉ tiêu đề) | `BOOKINGS.admin_done_at` (BOOKINGS từ 28 lên 29 cột; các dòng cũ để trống) |
| Dòng thêm ở CONFIG (2 khoá) | `BANK_QR_IMAGE` (mặc định trống), `REASSIGN_STUCK_HOURS` (mặc định 1); đều có ghi chú "Mới ở ..." ở cột `note` |
| Dòng thêm ở NOTIFY_RULES (2) | `REASSIGN_STUCK`, `RELEASE_NOTES` |
| Dòng thêm ở CONTENT (8 key) | `h.bank_qr_alt`, `ad.ev.REASSIGN_STUCK`, `ad.ev.RELEASE_NOTES`, `ad.act.REASSIGN_STUCK`, `ad.act.ADMIN_MARK_DONE`, `ad.act.BANK_QR_REFRESH`, `ad.act.TEMPLATE_DEDUPE`, `ad.act.TEMPLATE_DEDUPE_TEXT` |
| Dòng thêm ở EMAIL_TEMPLATES (1) | `ADMIN_RELEASE_NOTES` |
| Dòng ghi thêm | 1 thông báo ở NOTIFICATIONS (`RELEASE_NOTES`), 1 dòng MAIL_LOG (email tóm tắt), 3 dòng ACTIVITY_LOG (`RELEASE`, `SETUP_RUN`, `TEMPLATE_DEDUPE`). Nếu có chữ admin bị bỏ khi gộp thì thêm các dòng `TEMPLATE_DEDUPE_TEXT` (bộ dữ liệu mẫu không có trường hợp này) |
| Dòng bỏ | CHỈ các dòng EMAIL_TEMPLATES trùng key (ở bộ dữ liệu mẫu: một dòng của `LOGIN_LINK`, một dòng của `REG_RECEIVED`). Không bỏ dòng nào ở CONTENT và CONFIG |
| Ô đổi giá trị (tổng 16) | CONTENT: 3 ô do code quản lý của `h.bank_note` (`position`, `default_vi`, `default_en`); cột `vi`, `en` của anh KHÔNG đổi. CONTENT: 4 ô của `t.stats_note` (dòng chú thích dưới bảng số của tutor; chữ gốc 8.1.4 nói sai là tự tính Hoàn thành sau 24 giờ, ô chưa sửa nên `vi`, `en`, `default_vi`, `default_en` đều nâng lên chữ gốc mới; ô anh đã sửa thì giữ nguyên). EMAIL_TEMPLATES: 1 ô (tiêu đề tiếng Việt của `LOGIN_LINK`, chữ anh sửa ở dòng cuối được chuyển lên dòng giữ lại). META: 8 ô (phiên bản `APP_VERSION`, giờ `META_AT`, 6 mốc mã tự sinh `ID_FLOOR_*`) |
| Script Properties đổi | Đúng 3 khoá: `APP_VERSION_LAST`, `RELEASES_FOLDER_ID`, `SHEET_SNAP` (bản ghi `RELEASE_PENDING` được xoá khi giao xong). `BANK_QR_REV` chỉ xuất hiện khi menu 2, menu Làm mới ảnh QR hoặc sửa tay 4 ô CONFIG liên quan chạy |
| Không đổi | PACKAGES, USERS, REGISTRATIONS, STUDENT_PACKAGES, PAYMENTS, AVAILABILITY, AUTH, METRICS, MARKETING_EMAILS; mọi ô của BOOKINGS (ngoài tiêu đề cột mới). Sự kiện Calendar, 8 trigger, định dạng ô: không đổi. Tô màu và dropdown của 5 tab NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS, STUDENT_PACKAGES được đặt lại (3, 1, 2, 6, 5 luật) |

So với bản giao 14/11, bảng này sửa 3 chỗ: CONTENT thêm 8 key chứ không phải 6 (thêm `ad.act.BANK_QR_REFRESH` và `ad.act.TEMPLATE_DEDUPE_TEXT`); thêm dòng Script Properties; ghi rõ số ô đổi.

### Việc của admin (STAGING, theo thứ tự luật 38)

Theo quy ước 5, bản này chỉ dán STAGING; không có bước PRODUCTION. Vì hệ thống đang chạy là 8.1.4, cùng thứ tự này áp dụng khi anh nâng hệ thống thật sau này, và tóm tắt sẽ gồm đủ thay đổi của 8.1.5 đến 8.1.9. Chi tiết từng bước, cách xử lý từng dòng cảnh báo và cách quay lui: `HUONG_DAN_PHAT_HANH.md` mục 3A.

1. **Bảo trì chỉ xem** (khuyên dùng). Chạy thêm **Phát hành: sao lưu ngay** và ghi lại tên bản sao.
2. Dán `dist/Code.gs` (dòng 2 ghi bản 8.1.9) và `dist/Index.html`, **Lưu** từng file. `appsscript.json` KHÔNG đổi.
3. F5 Sheets. **Trước menu 1**, chạy **menu 2** (menu 2 của 8.1.9; menu 2 của 8.1.4 chưa có hai kiểm tra này). Trong bộ mô phỏng, trên database 8.1.4 chưa nâng, menu 2 chỉ báo LỖI "Thiếu tab RELEASE_LOG ..." (bình thường, menu 1 sẽ tạo tab; test I151). Đọc kỹ: nếu có dòng "CONFIG: khoá ... có N dòng chỉ khác nhau ở dấu cách hoặc ký tự vô hình" thì dừng, xử lý tay theo câu hướng dẫn trong dòng đó (chép giá trị đúng sang dòng đang có hiệu lực, thường là dòng cuối nhưng câu trong dòng nêu đúng số hàng; rồi xoá dòng thừa), rồi mới sang bước 4. Có dòng "key ... xuất hiện N lần" ở EMAIL_TEMPLATES hoặc CONTENT thì bình thường (menu 1 sẽ gộp), nhưng nên chụp lại các dòng đó trước khi gộp.
4. Chạy **menu 1: bấm một lần, rồi chờ hộp thoại hiện** (đừng bấm lại khi chưa thấy hộp thoại; xem BL174). Đọc hộp thoại và tìm ba loại dòng: **"CHÚ Ý QUAN TRỌNG"** (mẫu email có `active` mâu thuẫn giữa các dòng trùng, đã giữ trạng thái của dòng cuối), **"CẢNH BÁO"** (không gộp key vì sao lưu hỏng; "gộp dở"; hai dòng CONFIG song sinh) và **"CÒN DỞ"** hoặc "TIẾP TỤC giao tóm tắt" (một đường giao tóm tắt chưa xong: chạy lại menu 1, hoặc chờ job mỗi giờ). Có "CẢNH BÁO: chưa sao lưu được trước cập nhật": **dừng**, chạy **Phát hành: sao lưu ngay**, rồi chạy lại menu 1.
5. Mở tab **RELEASE_LOG** và email "Tóm tắt cập nhật" (tới `ADMIN_EMAIL`) đối chiếu với hộp thoại. Không thấy email mà có một thông báo MAIL_FAILED nói "có thể đã hoặc chưa gửi": đúng thiết kế (xem mục Soát chéo, cửa sổ 1); đọc tab RELEASE_LOG. Cũng có thể thấy cả email lẫn thông báo đó (cửa sổ 4): đọc RELEASE_LOG như thường.
6. Mở tab EMAIL_TEMPLATES: **mỗi key đúng một dòng**. Hộp thoại báo chữ bị bỏ khi gộp: lấy bản đủ ở ACTIVITY_LOG, hành động `TEMPLATE_DEDUPE_TEXT` (cách ghép: `HUONG_DAN_VAN_HANH.md` Phần F), rồi quyết giữ hay sửa. Đọc lại thân REG_RECEIVED và LOGIN_LINK: chữ đang hiện là chữ sẽ được gửi. Kiểm ô `active` của mọi mẫu có dòng "CHÚ Ý QUAN TRỌNG".
7. Tải ảnh QR (PNG 600 x 600 px, vuông, dưới 300 KB) lên Drive của tài khoản chủ hệ thống, dán link vào CONFIG `BANK_QR_IMAGE`. **Sau khi tải lên, và mỗi lần thay file ảnh sau này, chạy menu 2** (hoặc menu **Email → Làm mới ảnh QR chuyển khoản**).
8. Chạy **menu 2**: dòng `BANK_QR_IMAGE hợp lệ`, không dòng LỖI, không dòng cảnh báo khoá CONFIG song sinh.
9. Triển khai phiên bản mới (sửa bản cũ, KHÔNG "Triển khai mới"). Tắt bảo trì.
10. Mở trang đăng ký trên điện thoại và máy tính: khung chuyển khoản, dòng lưu ý đậm; quét mã QR bằng ứng dụng ngân hàng thật; kiểm cả trang gia hạn của học viên. Gửi thử đăng ký để chắc chữ chuyển khoản (BL156).

### Giới hạn còn lại (nói thẳng)

* **Chưa chạy trên Google thật.** Mọi hành vi mới và bằng chứng soát chéo chỉ ở bộ mô phỏng Node và ảnh chụp trình duyệt không giao diện. Danh sách việc chỉ kiểm được trong bộ mô phỏng, chưa kiểm trên Google thật: Drive đọc ảnh QR bằng tài khoản chạy web app; giới hạn chia mảnh của CacheService; link font nạp không chặn (`onload`) trong khung HtmlService; `setProperties` của Script Properties có ghi nguyên tử nhiều khoá không (thiết kế giao bền dựa vào việc này); tranh chấp khoá thật và giới hạn 6 phút (ma trận cắt ngang chỉ chạy trên khoá mô phỏng); ô bắt đầu bằng `=`, `+`, `-`, `@` ở CONTENT và EMAIL_TEMPLATES có còn là chữ khi `purgeRows_` ghi lại tab không; sắp xếp hoặc xoá dòng ở CONFIG có kích hoạt trigger sửa tay (và làm mới ảnh QR) không; quét mã QR bằng điện thoại thật; email tóm tắt hiển thị ra sao ở Gmail web, Gmail điện thoại, Outlook.
* **Con số tăng tốc là ước lượng** cho tới khi đo bằng menu **Đo tốc độ** trước và sau.
* **Soát chéo đã chạy**, nhưng còn: bộ 102 đột biến chưa chạy lại sau các sửa; việc soát tổng 2 agent trước go live (5P) vẫn còn. Soát xác nhận cuối trên `5292935` ĐẠT (dòng đầu file).
* **Cuộc đua còn lại, thấp, không chặn, có từ trước đợt này (BL174):** hai lượt menu 1 bấm cách nhau trong khoảng 6 lời gọi dịch vụ, trước lúc phiên bản được ghi nhận, đều có thể giao tóm tắt: 2 email, 2 thông báo, RELEASE_LOG gấp đôi (dữ liệu nghiệp vụ không bị ảnh hưởng). Supervisor đánh giá gần như không thể xảy ra trên Google thật. Cách tránh: bấm menu 1 một lần và chờ hộp thoại hiện. Cách sửa hẳn (niêm phong trong khoá và đọc lại `APP_VERSION_LAST` ở đó) là thay đổi nhỏ nhưng cần thêm một vòng soát, nên chờ anh quyết ở BL174.
* Các cửa sổ còn lại đã nêu ở mục Soát chéo (bốn cửa sổ giao tóm tắt: không email cộng một thông báo; thừa một dòng MAIL_LOG; thừa một dòng RELEASE nếu có hơn 300 dòng nhật ký xen vào; email đã đi nhưng có thông báo "có thể đã hoặc chưa gửi" và không có dòng MAIL_LOG; ngoài ra hai dòng CONFIG song sinh chỉ báo; khoá có ký tự vô hình ở EMAIL_TEMPLATES, CONTENT chỉ cắt khoảng trắng; ảnh QR cũ tới 6 giờ nếu không làm mới).
* Menu 1 vẫn thay toàn bộ luật tô màu ở 5 tab (NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS, STUDENT_PACKAGES): luật anh tự thêm bằng tay ở đó mất (hành vi cũ, nay ghi trong tóm tắt; BL165).
* Nguồn gốc các cặp dòng trùng thật anh thấy (đứng cạnh nhau) mới giải thích được MỘT PHẦN: key có khoảng trắng thừa làm ra bản trùng đã chứng minh, nhưng chưa chắc là nguyên nhân duy nhất trên file của anh.
* Chữ chuyển khoản còn mâu thuẫn: dòng đậm bảo ghi số điện thoại, nhưng sau khi gửi, web và email còn đưa mã chuyển khoản ("Mã nội dung chuyển khoản", "Nội dung chuyển khoản của bạn") (BL156, chờ anh; không chặn kỹ thuật nhưng làm học viên bối rối).
* Quay lui: tôi chưa có test chạy code 8.1.4 trên database đã nâng lên 8.1.9; theo thiết kế bản cũ bỏ qua cột và tab lạ (chưa kiểm trên Google thật).
* **Nhánh khác xung đột:** draft PR #2 (nhánh `claude/hopeful-galileo-xa1dv9`, "8.1.5 gửi email qua Amazon SES") cũng ghi số bản 8.1.5 và xung đột với nhánh này ở 12 file (BL169). Đã kiểm bằng `git merge-tree`.
* Chưa làm phần còn lại của 5Q (BL69), 5P (hướng dẫn còn lại, chính sách, soát tổng, thử tải lại).
* BACKLOG còn **55 câu chờ anh** (mục A 52, mục B 3); 5R thêm BL156 đến BL166 và BL169 đến BL174 còn mở, BL167 và BL168 đã đóng; BL175 (giao diện 390 px, 27/11) không thuộc 5R.

## Chunk 5N: tô màu Sheets (07/11/2026, bản 8.1.7)

### Làm gì

* **Cột mới `BOOKINGS.admin_done_at`** (optional, luật 38): ghi khi một lựa chọn ở `admin_action` chạy thành công. Lựa chọn lỗi thì không ghi.
* **Lựa chọn mới "Đã xử lý (giữ nguyên)"** ở dropdown `admin_action` của BOOKINGS: không đổi trạng thái, lương hay gói; chỉ ghi `admin_done_at` và nhật ký `ADMIN_MARK_DONE`. Không cho chọn khi màu chỉ hết bằng việc thật: buổi chưa có kết quả (CONFIRMED), Chờ đổi tutor, Vấn đề kỹ thuật chưa chọn lỗi; ô báo rõ việc cần làm.
* **"Chưa xử lý"** = `admin_done_at` trống HOẶC cũ hơn `result_at`: kết quả đổi sau lần admin xử lý trước (tutor sửa lại) thì màu hiện lại.
* **Màu mới** (luật đầu tiên khớp thắng, theo thứ tự trong bảng dưới). Vùng tô màu phủ tới hết tab; tab tự thêm hàng thì đặt lại (trước đây hàng thêm sau không có màu).
* **Báo buổi kẹt Chờ đổi tutor:** job mỗi giờ thấy buổi ở PENDING_REASSIGN quá `REASSIGN_STUCK_HOURS` giờ (CONFIG mới, mặc định 1, -1 = tắt) thì báo Khẩn qua email (REASSIGN_STUCK), một lần mỗi lần kẹt. Nhiều buổi kẹt cùng lượt: MỘT email liệt kê hết. Chịu lệch nhịp trigger 15 phút.
* **Sửa theo soát chéo (cả 2 agent cùng thấy, HIGH):** buổi kẹt trước đây KHÔNG xử lý được như thư báo bảo: "Đổi tutor" luôn lỗi, "Huỷ bởi admin" sau 15:00 hôm trước thành Huỷ muộn (học viên mất lượt cho lỗi phía trường). Nay "Đổi tutor" nhận buổi kẹt; chỉ định tutor bận thì buổi vẫn kẹt (trước đây thành CONFIRMED với tutor cũ, người không dạy); "Huỷ bởi admin" buổi kẹt luôn là Huỷ bởi admin, được bù (BL154). Trang quản trị bỏ buổi Không hoàn thành đã "Đã xử lý" khỏi danh sách chờ (cùng một hàm `adminHandled_` với màu Sheets). Tab tự thêm hàng thì chỉ nới vùng tô màu, giữ luật admin tự thêm.

### Màu nghĩa là gì, làm gì để hết màu

| Tab | Màu | Nghĩa | Làm gì để hết màu |
|---|---|---|---|
| BOOKINGS | Đỏ | Tutor quá hạn chọn kết quả; hoặc buổi Không hoàn thành chưa xử lý | Nhắc tutor; hoặc chọn kết quả ở `admin_action` (Hoàn thành, Vắng học viên, Vắng tutor); giữ Không hoàn thành thì chọn "Đã xử lý (giữ nguyên)" |
| BOOKINGS | Cam đậm | Chờ đổi tutor: buổi chưa có tutor dạy (luôn hiện) | Chọn "Đổi tutor" (ghi mã tutor ở `admin_note` nếu muốn) hoặc "Huỷ bởi admin" |
| BOOKINGS | Hồng | Vấn đề kỹ thuật chưa chọn lỗi | Chọn 1 trong 3 lựa chọn lỗi kỹ thuật |
| BOOKINGS | Vàng | Vắng học viên chưa xem (BL13) | "Đã xử lý (giữ nguyên)" |
| BOOKINGS | Xanh dương nhạt | Buổi được bù ngày (`comp_days` > 0) | Chỉ để biết, không cần làm |
| BOOKINGS | Xám | Huỷ muộn (trừ lượt, không bù) | Chỉ để biết |
| STUDENT_PACKAGES | Đỏ | Có thông báo "Bù cho gói đã hết hạn" (COMP_ON_EXPIRED) chưa đọc: chờ admin cộng tay | Cộng ngày ở `comp_days_admin` (của gói đang chạy), rồi đánh dấu đã đọc thông báo đó |
| STUDENT_PACKAGES | Xám | Gói hết hạn | Chỉ để biết |
| STUDENT_PACKAGES | Vàng | Gói đang dùng còn `EXPIRY_NOTICE_DAYS` ngày (mặc định 3) | Chỉ để biết (học viên đã nhận email sắp hết hạn) |
| STUDENT_PACKAGES | Tím | Admin đã cộng tay ngày (`comp_days_admin` khác 0) | Chỉ để biết |
| STUDENT_PACKAGES | Xanh dương | Gói có ngày bù (`comp_days` > 0) | Chỉ để biết |

### Kết quả test

| Bộ | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 |
| 40 kịch bản | 46/46 |
| Tích hợp | 139/139 (mới I230 màu BOOKINGS và "Đã xử lý", I231 màu STUDENT_PACKAGES, I232 báo buổi kẹt, I139 vùng tô màu khi thêm hàng và khi thiếu cột, I140 hồi quy xử lý buổi kẹt; I34 đổi số luật). Test chạy CÔNG THỨC THẬT trên dữ liệu thật qua bộ tính công thức trong test (AND, OR, N, TODAY, COUNTIFS, INDIRECT, so sánh), không chỉ so chuỗi |
| Giao diện web | 49/49 |
| Thử tải | 2/2 |
| Thử phá | 39 đột biến (sau vòng sửa): 38 bắt, 1 tương đương (đảo thứ tự luật đỏ và cam: không dòng nào khớp cả hai). Đặt lại 2 lỗi gốc của soát chéo thì I140 bắt cả hai. Các vòng trước lộ 4 lỗ test (admin tự chọn kết quả cùng lúc; báo trùng sau nhiều giờ; tab không tròn 1.000 hàng; mốc bằng nhau ở adminHandled_), đã thêm test |
| Soát chéo | 2 agent độc lập (code và luật; vận hành, nâng cấp, dữ liệu): 1 HIGH (cả hai cùng thấy: buổi kẹt không xử lý được), 6 MEDIUM, 12 LOW. Đã sửa HIGH và mọi MEDIUM sửa được trong phạm vi (thư báo kẹt gộp, lệch nhịp trigger, web khớp màu Sheets, chống mất thông báo); 4 câu cần anh quyết ghi BACKLOG BL152 đến BL155 |

### Việc của admin (STAGING, theo thứ tự luật 38)

1. Bảo trì chỉ xem (khuyên dùng).
2. Dán `dist/Code.gs` và `dist/Index.html` (bản 8.1.7 gồm cả giao diện 5O), Lưu. Không đổi `appsscript.json`.
3. Chạy **menu 1** (tự sao lưu trước vì phiên bản đổi; thêm cột `admin_done_at`, dropdown có lựa chọn mới cho mọi hàng, đặt màu mới).
4. Triển khai phiên bản mới (sửa bản cũ). Tắt bảo trì.
5. Mở BOOKINGS và STUDENT_PACKAGES kiểm màu theo bảng trên.

### Giới hạn còn lại (nói thẳng)

* Bảng màu ở trên chưa đưa vào `HUONG_DAN_VAN_HANH.md` (hướng dẫn chỉ xuất khi anh yêu cầu, quy ước 1); sẽ gộp ở 5P.
* Màu đỏ gói "chờ cộng tay" hết khi thông báo được đánh dấu đã đọc (kể cả "Đã đọc hết"): cộng ngày xong rồi mới đánh dấu (BL153).
* Buổi Vắng học viên, Không hoàn thành có từ trước vẫn tô màu tới khi chọn "Đã xử lý" từng dòng (BL152).
* Đổi `EXPIRY_NOTICE_DAYS`: chạy lại menu 1 để màu vàng đổi theo (BL155).
* Công thức tô màu được kiểm bằng bộ tính trong test, chưa kiểm trên Google Sheets thật: sau menu 1 trên STAGING, xem đúng màu ở vài dòng mẫu.
* Phần còn lại của 5Q (BL69: bảng hạn mức 5 dòng, kiểm thư 5 loại hộp thư) chưa làm.

**Trạng thái 05/11/2026 tối: 5O XONG CẢ WEB LẪN KHUNG EMAIL, bản 8.1.6.** Thêm so với 8.1.5: ảnh banner thương hiệu nhúng base64 vào trang chủ (đã cắt lề trắng, ~78KB); viên chữ Thái đổi nền trắng, chữ đen, viền vàng (yêu cầu anh 05/11); khung email `emailWrap_`, `btn_`, `emailWrapBi_` theo thiết kế 5O (đầu trang đen gạch vàng `#ffc933`, nút viên thuốc đen, đồng bộ xám `#63635d`); test mới U49 (49/49 web). Soát chéo 2 agent: 0 HIGH, 0 MEDIUM về code, các LOW đã dọn. CHƯA gửi thử email tới Gmail web, Gmail điện thoại, Outlook (việc của admin trên STAGING, BL09); chữ trong ảnh banner là tiếng Việt cố định — BL151 chờ anh chọn. BACKLOG còn **34 câu chờ anh** (mục A 30, mục B 4).

**Trạng thái 05/11/2026 chiều: 5O PHẦN GIAO DIỆN WEB xong, bản 8.1.5** (đen trắng theo ảnh thương hiệu, chỉ `src/ui/Styles.html` + token màu; phần email của 5O chưa làm). Đồng thời khôi phục 5 file bị sót khi upload repo GitHub (`test/unit.js`, `.gitignore`, workflow CI, `.clasp.json.example`, `THIET_KE_GIAO_DIEN.md`) lấy từ zip còn trong lịch sử git — trước đó `npm test` không chạy được vì thiếu `test/unit.js`. BACKLOG còn **33 câu chờ anh** (mục A 29, mục B 4). Chi tiết: mục "Chunk 5O phần giao diện" dưới đây.

## Chunk 5O phần giao diện web (05/11/2026, bản 8.1.5)

> **Mục này ghi lại đúng bản 8.1.5 lúc đó.** Những việc mục này ghi là "chưa làm" đều đã làm ở các bản sau: khung email ở 8.1.6 (trạng thái 05/11 tối), tô màu Sheets 5N ở 8.1.7 (mục "Chunk 5N" đầu file). Giữ lại để tra lịch sử.

### Làm gì

* Giao diện mới theo ảnh thương hiệu (BL08, kế hoạch 5O): nền trắng; màu chính ĐEN TRẮNG (nút chính, mục đang chọn là viên thuốc đen chữ trắng); vàng thương hiệu `#ffc933` chỉ cho dấu nhận diện (ô logo, viên chữ Thái trang chủ, thẻ gói học); màu phụ xanh lá, tím, vàng, xanh dương dạng phấn cho trạng thái; khối bo góc, ĐỔ BÓNG THAY VIỀN. Đúng phạm vi kế hoạch: chỉ `src/ui/Styles.html` và token màu, mọi class, id, cấu trúc giữ nguyên; viền đỏ đúng ô nhập sai giữ nguyên (`input.invalid`).
* Sửa theo soát chéo: thanh đầu trang có vạch chân mảnh (hết trắng trên trắng khi cuộn), ô số liệu giữ bóng khi trỏ chuột, bóng không bị cắt ở hàng số liệu cuộn ngang trên điện thoại, 3 mã màu tông xanh lá cũ còn sót đổi về token mới, ô `.chip:disabled` đạt tương phản 4.5:1 (lỗi có từ trước).
* `THIET_KE_GIAO_DIEN.md` viết lại theo bản 5O (BL150, chờ anh duyệt). `VERSION` 8.1.5, `dist/` dựng lại bằng `npm run build`.

### Kết quả test

| Bộ | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 |
| 40 kịch bản | 46/46 |
| Tích hợp | 134/134 |
| Giao diện web | 48/48 |
| Thử tải | 2/2 |
| Ảnh màn hình | 4 trang (chủ, học viên, tutor, admin) × 4 cỡ (360, 390, 768, 1280): không vỡ, luật 43 đạt |
| Soát chéo | 2 agent độc lập (kỹ thuật CSS; thiết kế theo kế hoạch và ảnh chụp): 0 HIGH, 4 MEDIUM, 9 LOW; đã sửa mọi MEDIUM sửa được trong phạm vi và các LOW có ảnh hưởng thật |

### Việc của admin (STAGING, theo thứ tự luật 38)

1. Dán `dist/Code.gs`, `dist/Index.html` vào project STAGING (không đổi `appsscript.json`), Lưu.
2. Chạy menu 1 (phiên bản code đổi nên tự sao lưu DB trước, luật 49; không có cột mới).
3. Triển khai phiên bản mới (sửa bản cũ).
4. Mở web kiểm trên điện thoại và máy tính: nền trắng, nút đen, logo vàng; form nhập sai thấy viền đỏ đúng ô.

### Giới hạn còn lại (nói thẳng)

* Phần email của 5O CHƯA làm: khung `emailWrap_` (Notify.gs) vẫn tông xanh rừng cũ, lệch bản nhận diện mới; chưa gửi thử mọi mẫu email tới Gmail web, Gmail điện thoại, Outlook (BL09). *(Đã làm ở 8.1.6; riêng việc gửi thử 3 hộp thư vẫn chờ anh làm tay trên STAGING.)*
* Bộ ảnh chưa có ảnh chụp trạng thái ô nhập sai (`input.invalid`); code giữ nguyên bản cũ đã test.
* Nút Zalo nổi đè nội dung khi cuộn tới đúng vị trí trên điện thoại: hành vi có từ trước 5O, không đổi ở bản này.
* 5N (tô màu Sheets, BL13) chưa làm. *(Đã làm ở 8.1.7.)*

**05/11/2026: chuyển sang repo GitHub cho Claude Code** (không đổi code, vẫn bản 8.1.4). Repo có đủ `src/`, `test/`, `dist/`, tài liệu; thêm `.gitignore`, `.clasp.json.example`, GitHub Actions chạy `npm test` và kiểm `dist/` khớp `src/`, lệnh `npm run build`, `npm run clasp:push`. Bỏ 2 bundle `v8/repo/` và `repo/BOOTSTRAP.md`. Hướng dẫn: `HUONG_DAN_GITHUB_CLAUDE_CODE.md`; quy trình cho Claude Code: `CLAUDE.md` mục cuối. Test lại sau khi dựng repo từ bundle: 34/34, 46/46, 134/134, 48/48, 2/2; `dist/` dựng lại trùng từng byte với bản trong project.

**Trạng thái 02/11/2026: 5Q phần gửi email XONG, bản 8.1.4** (= 8.1.3 + gửi email cố định qua GmailApp trong code, **không còn MailFix**). Code giao: `dist/Code.gs`, `dist/Index.html`, `dist/appsscript.json` (không đổi quyền so với 8.1.1), `dist_google_login/` (dự án phụ, thêm `oauthScopes`). Việc của admin: `HUONG_DAN_PHAT_HANH.md` mục 3 (nâng STAGING từ 8.0.10 lên thẳng 8.1.4) và `HUONG_DAN_VAN_HANH.md` Phần M (đăng nhập Google). **5N, 5O dời sang tuần sau.** BACKLOG còn **32 câu chờ anh** (mục A 28, mục B 4), rà sau 5N, 5O. Phiên sau: mở repo GitHub bằng Claude Code, đọc `CLAUDE.md` (luật 19, 54 đổi), file này.

**Trạng thái 01/11/2026 tối: chunk 5K và 5L XONG, bản 8.1.3** (vận hành gọn, lưu trữ 60 ngày, số điện thoại tự do, gói giá 0 qua Zalo, khoá tutor, bỏ LEGACY, kiểm gói, chuyển hệ thống).

**01/11/2026 tối:** chưa tách STAGING và PRODUCTION tới hết chunk 5 (go live ở chunk 6). BACKLOG còn **26 câu chờ anh** (mục A 22, mục B 4), rà ở 5Q. Luật thông báo đã ghi vào Hướng dẫn vận hành Phần J (bản nháp, xuất khi anh yêu cầu). Mã nguồn đã lưu vào project (`v8/repo/`) để làm tiếp ở chat khác.

**01/11/2026 sáng: chunk 5M xong, bản 8.1.0** (bù buổi, khoá ngày bắt đầu, bảo vệ tab STUDENT_PACKAGES).

**30/10/2026: dọn dẹp project (bản 8.0.10, không đổi logic).** Xoá mã và test v6 (hồ sơ v6 trong `archive/V6_HO_SO_CU.md`), gộp 60 file lịch sử thành 6 file ở `archive/`, bảng đường dẫn cũ sang mới ở `archive/MANIFEST.md`, báo cáo `CLEANUP_REPORT.md`.

**29/10 và 01/11/2026: kế hoạch.** Sub chunk 5J đến 5Q (`plan/KE_HOACH_5J_5P.md`), lộ trình (`plan/LO_TRINH_V8_TOI_CUOI.md`), sau go live (`plan/KE_HOACH_SAU_GO_LIVE.md`), luật bù buổi (`plan/TU_VAN_BU_BUOI.md`), câu hỏi chờ chốt (`BACKLOG.md`).

## Chunk 5Q phần A: gửi email cố định (02/11/2026, bản 8.1.4)

### 5Q.1 Làm gì

* File mới `src/MailTransport.gs`: chỗ duy nhất gọi dịch vụ gửi thư (`mailDeliver_`) và đọc hạn mức (`mailBudget_`). Mặc định GmailApp, đúng cách MailFix đã chạy từ 22/10: thư HTML kèm bản chữ thuần, tên `MAIL_FROM_NAME`, trả lời về `ADMIN_EMAIL`. Ô CONFIG mới `MAIL_TRANSPORT` (`GMAILAPP` mặc định, `MAILAPP` dự phòng).
* GmailApp báo thiếu quyền: thư tự gửi lại bằng MailApp, ghi `MAIL_FALLBACK`, báo admin tối đa 1 lần mỗi giờ (không báo qua email khi kênh là EMAIL). Lỗi khác (hết hạn mức, địa chỉ sai): không gửi lại, `MAIL_FAILED` như cũ.
* Tiêu đề bỏ ký tự xuống dòng. MAIL_LOG thêm cột `transport` (optional). Menu Kiểm tra gửi email ghi đường gửi thật đã dùng. Menu 2 báo đường gửi, tài khoản đang chạy khác `ADMIN_EMAIL`, và **LỖI khi dự án còn file MailFix.gs**.
* 6 chỗ đọc hạn mức (Notify 2, Marketing 2, Metrics, Setup) chuyển sang `mailBudget_` (-1 = không rõ, không chặn thư quan trọng, marketing coi như 0).
* Soát 5Q (agent nâng cấp): bản 8.0.10 nâng thẳng lên 8.1.4 thì job mỗi giờ có thể chạy giữa lúc menu 1 thêm cột và lúc chuyển dữ liệu 8.1.0, làm mất hạn gói admin đã kéo dài tay. Sửa: luật bù buổi chỉ chạy khi bước MIG_5M đã chạy (`pkgCompReady_`).
* Soát tài liệu tìm ra 2 lỗi code có từ trước: (1) chọn `Từ chối` sau khi đã `Duyệt` (hoặc ngược lại) thì ô và thông báo ghi đã đổi mà dữ liệu không đổi; nay ô tự trả về kết quả thật và báo "KHÔNG đổi được"; (2) `Đổi tutor` khi `admin_note` còn chữ cũ ("Đã: ...", "Lỗi: ...") báo không có tutor dù có người rảnh; nay chỉ lấy đúng mã tutor trong ô.
* Nút Đăng nhập Google mở thẻ mới (Google Sites có thể chặn chuyển trang). Dự án phụ có `oauthScopes` (`userinfo.email`).
* Không làm ở bản này (BACKLOG BL64 đến BL69): chế độ Gmail API, bảng hạn mức 5 dòng, kiểm thư tới 5 loại hộp thư, BL51 tự phát hiện thư bị trả về.

### 5Q.2 Kết quả test

| Bộ | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 |
| 40 kịch bản | 46/46 |
| Tích hợp | 134/134 (mới I132 đường gửi, I133 chặn gọi thư ngoài MailTransport và báo MailFix còn sót, I134 nâng thẳng 8.0.10, I135 chọn lại đăng ký đã xử lý, Đổi tutor khi `admin_note` còn chữ cũ) |
| Giao diện web | 48/48 |
| Thử tải | 2/2 |
| Thử phá | 22 đột biến hợp lệ: 21 bắt, 1 tương đương. 1 đột biến sống lúc đầu (chặn báo 1 lần mỗi giờ) lộ lỗ test, đã sửa test |
| Soát chéo | 2 agent độc lập soát code (đường gửi email; nâng cấp 8.0.10 lên 8.1.4 và đăng nhập Google): 0 HIGH, 5 MEDIUM, 9 LOW; đã sửa mọi MEDIUM và các LOW có ảnh hưởng thật. 1 agent soát cuối 6 tài liệu: 3 HIGH, 10 MEDIUM, 6 LOW, đã sửa hết; 2 trong số đó là lỗi code (dưới) |

### 5Q.3 Việc của admin

`HUONG_DAN_PHAT_HANH.md` mục 3 (từng bước, khoảng 45 phút). Tóm tắt: Bảo trì chỉ xem → sao lưu → dán `appsscript.json` (giữ dòng `mail.google.com` nếu bản cũ có), `Code.gs` (không tìm và thay), `Index.html` → **xoá `MailFix.gs`** → F5 → xem trước bù buổi → menu 1 → các bước chuyển dữ liệu → menu 2 → kiểm giá PACKAGES → Kiểm tra gửi email (đường gửi GMAILAPP) → Triển khai phiên bản mới (sửa bản cũ) → Bảo trì tắt → đăng nhập Google (Phần M).

### 5Q.4 Giới hạn còn lại (nói thẳng)

* Tài liệu Google ghi GmailApp cần quyền `https://mail.google.com/`; bản này giữ `gmail.send` như lần thử 22/10. Google siết quyền thì thư tự đi MailApp (dễ bị trả về trên tên miền trường) và admin được báo. Cách sửa ghi ở hướng dẫn.
* Chưa đo trên Google thật: GmailApp có trừ cùng hạn mức `getRemainingDailyQuota` không (menu Kiểm tra gửi email cho thấy số trước và sau).
* Đổi đường gửi không tăng hạn mức. Workspace dùng thử vẫn khoảng 100 người nhận mỗi ngày.
* Thư bị trả về vẫn chỉ thấy ở Email log search (BL51 chưa làm).
* Giới hạn của 5K, 5L giữ nguyên (khoá tutor mỗi buổi 1 email; Calendar trong khoá khi chuyển hệ thống).

### 5Q.5 Hướng dẫn đã xuất (02/11)

4 hướng dẫn và 2 chính sách viết lại theo 8.1.4, mở đầu bằng "Thay đổi so với bản trước": `HUONG_DAN_VAN_HANH.md` (đủ 98 ô CONFIG, menu, tab, tình huống, đăng nhập Google), `HUONG_DAN_PHAT_HANH.md`, `HUONG_DAN_THU_TAI.md`, `HUONG_DAN_TRIEN_KHAI_WORKSPACE.md`, `policy/CHINH_SACH_HOC_VIEN.md`, `policy/CHINH_SACH_TUTOR.md`. Xoá khỏi project: `HUONG_DAN_MAILFIX.md` (2 bản), `HUONG_DAN_GO_LIVE_8010.md`, `dist_golive/` (đều dựa trên MailFix, lỗi thời). Mục "MailFix" ở các chunk 5J, 5KL, 5M bên dưới chỉ còn giá trị lịch sử.

| Chunk | Nội dung | Trạng thái | Kết quả test |
|---|---|---|---|
| 5Q (phần A) | Gửi email cố định GmailApp, bỏ MailFix, chặn nâng cấp mất hạn gói, nút Google thẻ mới | **Xong 02/11** (8.1.4) | 34/34, 46/46, 134/134, 48/48, 2/2; thử phá 22 (21 bắt, 1 tương đương); soát 2 agent code, 1 agent tài liệu |
| 5N, 5O | Chịu tải, giao diện | **Dời sang tuần sau** | |

## Chunk 5K và 5L (01/11/2026 tối, bản 8.1.3)

Hai sub chunk giao chung một bộ code (8.1.3 gồm cả 5K, bản 8.1.2 không phát hành riêng). Soát chéo 1 agent mỗi sub chunk (anh chốt 01/11 tối; từ 5P lại 2 agent).

### 5KL.1 Làm gì

**5K · Vận hành gọn**

| Phần | Nội dung |
|---|---|
| Nhật ký | Không ghi đổi ngôn ngữ (LANG_SET) và mở từng thông báo (NOTIF_READ); vẫn ghi "Đã đọc hết". Dòng cũ vẫn hiện đúng tên (BL02 theo đề xuất) |
| Lưu trữ | Một ô `LOG_KEEP_DAYS` = 60 cho nhật ký, email, thông báo, METRICS (thay `ACTIVITY_LOG_KEEP_DAYS` và `ARCHIVE_LOG_KEEP_MONTHS`; ô cũ anh đã chỉnh vẫn dùng, menu 1 chép sang). Bỏ mốc chờ 7 ngày. Một lượt chạy **nhiều lô tới khi hết**; hết giờ thì giờ sau làm tiếp. METRICS chuyển vào lưu trữ thay vì xoá sau 90 ngày. **Không bao giờ** chuyển dòng email marketing (sổ chống gửi trùng). File tên mới `THAIPUT · Lưu trữ · STAGING · 2026`, có tab `DOC_TRUOC`; file tên cũ được đổi tên ở menu 1. Menu mới "Lưu trữ: mở file" |
| Menu | Gom nhóm: Người dùng, Gói học, Báo cáo, Email, Cập nhật phiên bản, Chuyển hệ thống, Lưu trữ, Công cụ kỹ thuật, Test (chỉ STAGING). Bỏ menu chuyển dữ liệu v6. Không xoá mục nào khác (BL05 theo đề xuất) |
| Link rút gọn | 4 ô CONFIG `SHORT_URL_HOME`, `SHORT_URL_LOGIN`, `SHORT_URL_STUDENT`, `SHORT_URL_TUTOR`. Menu "Xem link trang web" hiện link rút gọn và đích cần đặt ở Namecheap (URL Redirect, BL03 phương án a). Email vẫn dùng link /exec |
| AVAILABILITY | Bỏ "Duyệt" khỏi danh sách chọn; ô cũ ghi "Duyệt" vẫn chạy như "Duyệt, tự chọn tutor thay" |
| Số điện thoại | Không bắt buộc, không cần định dạng ở form đăng ký, hồ sơ học viên, thêm tutor. Số di động Việt Nam vẫn lưu `+84...` và có link Zalo; số nước ngoài có + lưu gọn; mọi thứ khác (ví dụ "Line: abc") lưu nguyên văn, tối đa 40 ký tự. Ô nhập trên điện thoại có bàn phím chữ. Học viên xoá được số |
| Gói giá 0 | Không chọn được trên web; trang hiện thẻ gói kèm nút "Nhắn Zalo admin" (BL06 theo đề xuất b). Menu 2 báo |

**5L · Tutor, gói, chuyển hệ thống**

| Phần | Nội dung |
|---|---|
| Khoá tutor | Menu Người dùng > "Khoá tutor" (dòng đang chọn ở USERS): hiện xem trước từng buổi sắp tới (đổi được hay phải huỷ), hỏi lại 2 lần. Khi khoá: buổi sắp tới tự đổi sang tutor rảnh; không ai rảnh thì huỷ kiểu lỗi tutor, học viên được bù theo luật 5M và nhận email; giờ rảnh từ hôm nay bị huỷ; tutor bị thoát mọi thiết bị. "Mở khoá tutor" bật lại tài khoản (giờ rảnh không tự mở lại). BL04 theo đề xuất a |
| Bỏ LEGACY | Bỏ gói LEGACY khỏi gói mặc định, xoá chức năng chuyển dữ liệu v6. Menu 1 xoá dòng LEGACY trong PACKAGES khi không học viên nào dùng. Kiểu gói theo buổi (SESSIONS) vẫn giữ. Kịch bản file 03 dòng S004 đổi sang gói PACK_12 (BL49 theo đề xuất) |
| Gói | Menu Gói học > "Thêm gói" hỏi lần lượt từng ô, kiểm hợp lệ. Menu 2 kiểm mọi dòng PACKAGES: mã trùng (báo dòng đang có hiệu lực), kiểu, số ngày, số buổi, giá, Trial thiếu số buổi, thiếu tên tiếng Anh. Gói trùng mã hoặc dòng sai: không nhận đăng ký, trang ẩn gói đó |
| Chuyển hệ thống | Menu Chuyển hệ thống, 4 bước: (1) hệ thống cũ "Chuẩn bị chuyển": đóng cổng, trang báo link mới, gỡ sự kiện Calendar, xoá trigger, ghi tab META; (2) hệ thống mới chạy thử (chỉ đọc); (3) chép thật (theo mã, chạy lại không nhân đôi, có mốc chạy tiếp, đếm lại); (4) tạo lại sự kiện. Không chép phiên đăng nhập, nhật ký, thông báo, khoá CONFIG hạ tầng. Mã gói thiếu tự tạo dòng "không bán". Đây là nền cho go live chunk 6 |
| Tắt trigger | Công cụ kỹ thuật > "Tắt hết trigger tự động" (dùng cho STAGING khi PRODUCTION chạy chính thức) |
| Tab META | Menu 1 ghi phiên bản, mốc mã tự sinh, bước chuyển dữ liệu đã chạy. Menu Cập nhật phiên bản > "Các bước chuyển dữ liệu theo phiên bản (chỉ đọc)" |

Tài liệu đã cập nhật trong project: `docs/01` (quy định số điện thoại, câu 33, 45, mục Thay đổi 01/11 tối), `docs/03` (A02, dòng S004, B17), `CLAUDE.md` (luật 10, 16, 46 đổi; luật 56, 57 mới), `BACKLOG.md` (BL60 đến BL63), kế hoạch. Không gửi lại các file này.

### 5KL.2 Kết quả test

| Phần | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 |
| Kịch bản | 46/46. A02 đổi kết quả mong đợi theo kế hoạch 5K anh đã ra lệnh (3 số trước bị chặn nay lưu nguyên văn). B17 chỉ đổi tên gói (PACK_12 thay LEGACY), kết quả giữ nguyên |
| Tích hợp | 130/130 (I125 đến I131 mới; I04 chuyển v6 bỏ; I01, I02, I03, I07, I82, I85, I86, I90, I94, I97, I109 sửa theo luật mới) |
| Giao diện | 48/48 (U48 mới; U03, U11 sửa theo số điện thoại tự do) |
| Thử tải | 2/2 |
| Thử phá | 52 đột biến: bắt 51, 1 tương đương (cờ "còn dòng" chỉ lặp lại kết quả lô cuối). 11 đột biến sống ở vòng đầu đã thêm test để bắt. Thử phá còn tìm ra 2 test cũ đúng vì lý do sai (đếm trigger theo tên trường không có), đã sửa |
| Soát độc lập | 1 agent mỗi sub chunk. 5K: 2 trung bình, 5 nhỏ. 5L: 1 cao, 4 trung bình, 7 nhỏ. Đã sửa hết trừ 3 mục ghi ở 5KL.7, mỗi lỗi có test hồi quy |

Lỗi soát tìm ra và đã sửa:
* **Chuyển hệ thống chép thiếu mà báo thành công** (cao): hệ thống mới đã tự sinh dòng trùng mã (ví dụ tutor thử lấy mã T001) thì dòng cũ bị bỏ qua, buổi học trỏ sang người khác. Nay chạy thử báo trùng, chép thật dừng trước khi ghi; mốc mã tự sinh nâng trước khi ghi.
* Trùng email làm gói, buổi của người đó mất chủ, và không chạy lại được. Nay dừng trước khi ghi; chép xong thì xoá mốc chạy tiếp.
* Ô CONFIG bị Sheets đổi thành giờ (08:00) chép sang thành chữ dài, hệ thống mới 0 giờ học. Nay sửa như hệ thống cũ đọc.
* Bước chuyển dữ liệu mà hệ thống cũ chưa chạy bị bỏ qua ở hệ thống mới. Nay menu 1 sau khi chép sẽ chạy lại bước đó.
* Khoá tutor gửi tutor bị khoá thư "Đã duyệt huỷ" và thư huỷ từng buổi. Nay tutor bị khoá không nhận thư; lý do huỷ ghi "Tutor nghỉ, không có tutor thay".
* Mốc mã USERS dùng chung S, T, A (mã tutor mới thành T151). Nay không ghi mốc USERS.
* Mốc nhắc tutor theo tuần không đi theo dữ liệu (tutor nhận nhắc 2 lần). Nay chép theo META.
* Thông báo Khẩn, Cần xử lý chưa đọc mất khi chuyển. Nay được chép (mã mới).
* Mã gói có khoảng trắng thừa lọt qua chặn trùng; mã trùng trong file cũ bị chép 2 lần. Đã sửa.
* Ghi chú có dãy số ("Line: lan_0987654321") bị đổi thành số Việt Nam +84 và có link Zalo sai người. Nay chỉ chuẩn hoá khi cả ô là số điện thoại.
* Ô số điện thoại trên điện thoại mở bàn phím số, không gõ được chữ. Nay bàn phím chữ.
* Thiếu tab METRICS làm lưu trữ lỗi mỗi giờ; file lưu trữ năm cũ không đổi tên; học viên không xoá được số; file CSV hằng tuần chạy công thức khi mở bằng Excel. Đã sửa hết.

### 5KL.3 Đọc kỹ trước khi cập nhật

* **Giá gói:** gói đang bán có giá 0 không còn chọn được trên web. Mở tab PACKAGES kiểm `price_vnd` của TRIAL, PASS_2W, PASS_1M **trước** khi thử đăng ký. Menu 2 báo LƯU Ý nếu còn gói giá 0.
* **Chưa dán 8.1.1** (bản 5J): bản 8.1.3 đã gồm 8.1.1. Phải làm thêm 2 việc của 8.1.1: dán `appsscript.json` (file đã gửi ở 5J, không đổi) và chạy `testMailFix` để cấp quyền; chạy menu 3 (còn 8 trigger).
* **Menu 1 lần này** tự: thêm tab META, thêm các ô CONFIG mới (`LOG_KEEP_DAYS`, `SHORT_URL_*`, `MOVED_TO_URL`), chép ô `ACTIVITY_LOG_KEEP_DAYS` nếu anh từng chỉnh, xoá dòng gói LEGACY (nếu không học viên nào dùng), đổi tên file lưu trữ kiểu cũ.
* **Lưu trữ lần đầu sau khi dán:** email và thông báo cũ hơn 60 ngày (trước đây giữ 3 tháng) được chuyển sang file lưu trữ ở lượt 03:00 đầu tiên. Không mất, xem bằng menu Lưu trữ > mở file.
* **Menu đã gom nhóm:** mục cũ nằm trong menu con (ví dụ "Tạm khoá học viên" ở Người dùng, "Bảo trì" ở Cập nhật phiên bản, "Sao lưu ngay" ở Công cụ kỹ thuật).
* **Chuyển hệ thống chưa dùng tới** ở chunk 5. Đây là công cụ cho go live chunk 6. Không chạy Bước 1 trên STAGING đang dùng: Bước 1 đóng cổng và xoá trigger.

### 5KL.4 MailFix (bắt buộc mỗi lần dán Code.gs mới, tới khi xong 5Q)

Hướng dẫn đầy đủ: `HUONG_DAN_MAILFIX.md`. Bản 8.1.3 là **bản gốc** (cách B): không có `function sendEmailFix_`.

1. Dự án đã có file `MailFix` (cách B): giữ nguyên, không sửa. Chưa có: làm mục 3 của `HUONG_DAN_MAILFIX.md` trước.
2. Mở `Code.gs` trong trình soạn Apps Script, chọn hết nội dung cũ, dán `dist/Code.gs` bản 8.1.3, bấm **Lưu**.
3. Đứng trong `Code.gs`, mở Tìm và thay: Windows **Ctrl + H**, Mac **Cmd + Option + F**.
4. Ô Tìm: `MailApp.sendEmail(` · Ô Thay: `sendEmailFix_(` (gõ đúng, có dấu mở ngoặc; tắt các nút Aa, .*, ab).
5. Số kết quả phải là **đúng 1**. Khác 1: dừng, chụp màn hình gửi coder.
6. Bấm **Thay tất cả**, **Lưu**.
7. Kiểm 3 điều trong `Code.gs`:
   * `MailApp.sendEmail(`: **0** kết quả;
   * `sendEmailFix_(`: **1** kết quả;
   * `MailApp.getRemainingDailyQuota`: **8** kết quả (không thay).
8. `appsscript.json` không đổi so với 8.1.1: chỉ kiểm vẫn còn dòng `https://www.googleapis.com/auth/gmail.send`. Chưa dán 8.1.1 thì dán file `appsscript.json` đã gửi ở 5J.
9. Chạy `testMailFix`, thư "thaiput · thử MailFix" phải tới (kể cả Spam).

Phương án khác: coder gửi thêm bản Code.gs đã vá sẵn (cách A, không cần tìm và thay). Khi đó phải **xoá** file MailFix riêng trong dự án. Không trộn hai cách.

### 5KL.5 Cập nhật STAGING (chưa có PRODUCTION)

1. Dán `dist/Code.gs`, làm MailFix (5KL.4 bước 1 đến 7, 9).
2. Mở `Index.html` trong trình soạn, chọn hết, dán `dist/Index.html`, **Lưu**.
3. Tải lại trang Sheets (F5). Menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Kiểm dòng báo (tab META, ô CONFIG mới, LEGACY, tên file lưu trữ).
4. Chưa dán 8.1.1: menu **3. Tạo lại trigger tự động** (báo 8).
5. Menu **2. Kiểm tra hệ thống**: không có LỖI. Đọc các dòng LƯU Ý về PACKAGES.
6. **Triển khai → Quản lý bản triển khai → sửa → Phiên bản mới → Triển khai.**
7. Thử nhanh:
   * trang đăng ký: gõ số điện thoại kiểu "Line: abc" gửi được; gói giá 0 (nếu có) chỉ có nút Zalo;
   * menu **Xem link trang web**: thấy 4 dòng link rút gọn (chưa điền thì báo ô CONFIG cần ghi);
   * menu **Gói học → Thêm gói**: thêm thử một gói, menu 2 không báo lỗi gói đó; thêm một dòng trùng mã bằng tay: menu 2 báo đỏ, trang đăng ký ẩn gói đó; xoá dòng thử;
   * tạo một tutor thử có 1 buổi sắp tới, chọn dòng ở USERS, menu **Người dùng → Khoá tutor**: xem trước đúng, hỏi lại 2 lần, buổi đổi tutor hoặc huỷ, học viên nhận email; **Mở khoá tutor**;
   * menu **Lưu trữ → mở file**: thấy tên file mới;
   * menu **Cập nhật phiên bản → Các bước chuyển dữ liệu**: các bước đều ĐÃ CHẠY.

### 5KL.6 Quyết định coder tự chọn (chờ anh duyệt, đã ghi BACKLOG)

* BL02, BL03, BL04, BL05, BL06, BL49 làm theo đề xuất (anh chưa trả lời).
* BL60: số nước ngoài gõ không có + (ví dụ số Thái 081...) bị hiểu là số Việt Nam. Phương án khác: chuẩn hoá chặt hơn.
* BL61: mọi gói giá 0 chỉ báo LƯU Ý ở menu 2. Phương án khác: báo LỖI.
* BL62: mở khoá tutor không tự mở lại giờ rảnh đã huỷ. Phương án khác: tự mở lại.
* BL63: chuyển hệ thống trùng email hoặc trùng mã thì dừng hẳn. Phương án khác: tự gộp.
* Gói 8.1.2 (5K) không phát hành riêng; 8.1.3 gồm cả hai sub chunk.

### 5KL.7 Giới hạn còn lại (nói thẳng)

* Khoá tutor có nhiều buổi: mỗi buổi một email cho học viên (chưa gộp theo học viên). 30 buổi là khoảng 30 đến 60 email, đáng kể với hạn mức tài khoản dùng thử. Gộp email làm ở 5N hoặc 5Q.
* Bước 1 và Bước 4 của chuyển hệ thống gọi Calendar trong khoá (có từ trước 5L, luật 5). Danh sách buổi sắp tới rất dài có thể chạm giới hạn 6 phút; chạy lại an toàn (mã sự kiện cố định). Sửa ở chunk 6 trước khi go live.
* Chuyển hệ thống không chép: phiên đăng nhập (mọi người đăng nhập lại), nhật ký, thông báo đã đọc (đã ở file lưu trữ cũ), ảnh chuyển khoản (vẫn ở Drive cũ, link vẫn mở được nếu còn quyền).
* Link rút gọn: hệ thống chỉ hiện để đối chiếu. Tạo URL Redirect ở Namecheap anh làm tay. Email vẫn dùng link /exec.

### 5KL.8 Hướng dẫn đã lỗi thời (chỉ viết lại khi anh yêu cầu)

* `HUONG_DAN_VAN_HANH.md` (bản nháp): Phần B (ô mới `LOG_KEEP_DAYS`, `SHORT_URL_*`, `MOVED_TO_URL`; ô cũ bỏ), Phần C (menu gom nhóm, các menu mới: Khoá tutor, Thêm gói, Lưu trữ mở file, Chuyển hệ thống 4 bước, Tắt hết trigger, Các bước chuyển dữ liệu), B12 lưu trữ 60 ngày, tab META, số điện thoại tự do, gói giá 0.
* `HUONG_DAN_PHAT_HANH.md`: quy trình chuyển hệ thống và đổi tài khoản admin@ (dùng menu Chuyển hệ thống); viết ở chunk 6 cùng hướng dẫn go live.

| Chunk | Nội dung | Trạng thái | Kết quả test |
|---|---|---|---|
| 5K, 5L | Nhật ký, lưu trữ 60 ngày nhiều lô, menu gom nhóm, link rút gọn, số điện thoại tự do, gói giá 0; khoá tutor, bỏ LEGACY và v6, kiểm gói, Thêm gói, tab META, chuyển hệ thống 4 bước | **Xong 01/11 tối** (8.1.3) | 34/34, 46/46, 130/130, 48/48, 2/2; thử phá 52 (51 bắt, 1 tương đương); soát 1 agent mỗi sub chunk |

## Chunk 5J (01/11/2026 chiều, bản 8.1.1)

### 5J.1 Làm gì

| Phần | Nội dung |
|---|---|
| Quyền | `appsscript.json` thêm `https://www.googleapis.com/auth/gmail.send` (cho MailFix cách B). Dán xong phải cấp quyền lại |
| Link đăng nhập | Học viên, tutor: hạn 15 phút, bấm không giới hạn lần. Admin: hạn 24 giờ, không giới hạn lần. Phiên 30 ngày. Khoá mới: `STUDENT_LINK_MINUTES`, `STUDENT_LINK_MAX_USES`, `TUTOR_LINK_MINUTES`, `TUTOR_LINK_MAX_USES`, `ADMIN_LINK_MINUTES`, `ADMIN_LINK_MAX_USES` (0 = không giới hạn). Ô cũ admin đã chỉnh (`LOGIN_LINK_MINUTES`, `STAFF_LOGIN_LINK_MAX_USES`...) được dùng tiếp và menu 1 chép sang khoá mới; ô cũ ghi "Không dùng từ 8.1.1" |
| Xin link | Mỗi email 1 lần mỗi `LOGIN_LINK_COOLDOWN_MINUTES` (60). Câu báo giống nhau cho email có và không có tài khoản: "link đã được gửi lúc HH:mm, kiểm Spam, xin link mới sau HH:mm". Khoá bận hoặc gửi thư lỗi thì chưa tính lượt. Admin gửi hộ bằng menu không bị giới hạn |
| Thoát mọi thiết bị | Huỷ cả link còn hạn. Tài khoản DISABLED cũng vậy |
| Trang đăng nhập | Nút Google lên đầu (cho admin), form email bên dưới |
| Lịch tutor | Nhắc mở lịch `TUTOR_REMIND_AT` = `FRI 15` (nhiều mốc cách nhau dấu phẩy), hạn `TUTOR_DEADLINE_AT` = `SAT 22`, thông báo học viên `STUDENT_WEEK_BANNER_FROM` = `SAT 00`. Dạng THỨ GIỜ: MON TUE WED THU FRI SAT SUN hoặc T2 đến T7, CN. Sai dạng hoặc hạn không trước 15:00 Chủ nhật: dùng mặc định, menu 2 báo LỖI |
| Nhắc tutor | Chạy trong hourlyJob (bỏ 2 trigger Chủ nhật, còn **8 trigger**). Chỉ tutor chưa mở giờ nào tuần sau. Gửi sau khi nhả khoá, tối đa 60 giây mỗi lượt, phần còn lại gửi lượt sau. Lỡ lượt thì gửi bù, không gửi trùng (kể cả hai lượt chạy chồng nhau). Thư lỗi thử lại tối đa 3 lần. Mẫu TUTOR_REMIND bỏ chữ "hôm nay" (áp ngay, không chờ menu 1) |
| Sau hạn mở lịch | Thông báo TUTOR_NO_AVAILABILITY sau 22:00 thứ Bảy. Bớt giờ sau hạn phải chờ admin duyệt (như cũ) |
| Trang học viên | Từ 00:00 thứ Bảy tới 15:00 Chủ nhật: khung "Tuần sau đã có giờ trống" khi học viên đặt được thật (tài khoản đang hoạt động, gói phủ ngày đó, còn lượt, ngày đó chưa đủ buổi). Bấm "Đã xem" thì ẩn tới tuần sau. Không gửi email |
| Câu 29 (đổi theo lệnh 01/11) | Tutor không chọn kết quả sau 24 giờ kể từ giờ kết thúc: **báo đỏ** trên trang tutor (dòng đỏ, khung đỏ đầu trang) và trang quản trị (nhãn đỏ, thông báo Khẩn RESULT_OVERDUE). Không tự Hoàn thành. Sau 48 giờ kể từ giờ kết thúc và đủ 24 giờ sau báo đỏ: trạng thái mới **NOT_COMPLETED** "Không hoàn thành", không lương, vào email tổng hợp. Đang bảo trì thì mốc dời, mở lại xong tutor còn đủ 24 giờ. Dòng BOOKINGS đỏ (cột mới `result_notice_at`) |
| Admin sửa kết quả | Cột admin_action thêm: "Hoàn thành (admin chọn)", "Vắng học viên (admin chọn)", "Vấn đề kỹ thuật (admin chọn)" (sau đó chọn lỗi như buổi kỹ thuật thường). "Vắng tutor" vẫn dùng được. Trang quản trị mục chờ kết quả hiện cả buổi Không hoàn thành 60 ngày gần nhất |
| Báo cáo tháng | Thêm cột "Không hoàn thành" và "Chờ tutor chọn kết quả" (chưa vào lương; chốt lương sau khi cột này về 0) |

Tài liệu đã cập nhật trong project: `docs/01` (câu 21, 29, 32 và mục Thay đổi 01/11 chiều), `docs/03` (A06, B20, E31, E32, F39), `CLAUDE.md` (luật 36 đổi, luật 52 số trigger, luật 55 mới), 2 bản nháp chính sách. Không gửi lại các file này.

### 5J.2 Kết quả test

| Phần | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 (U03 viết lại cho lịch THỨ GIỜ) |
| Kịch bản | 46/46. 5 kịch bản đổi kết quả mong đợi theo luật anh chốt: A06 (xin link 1 lần mỗi giờ), B20, E31, E32 (hạn 22:00 thứ Bảy), F39 (không tự Hoàn thành) |
| Tích hợp | 124/124 (I119 đến I124 mới; I01, I02, I27, I30, I34, I41, I42, I66, I94, I105 sửa theo luật mới) |
| Giao diện | 47/47 (U46, U47 mới) |
| Thử tải | 2/2 |
| Thử phá | 42 đột biến: bắt 39; 2 tương đương (hourlyJob tính lại gói ngay sau đó; ô lỗi kỹ thuật vốn đã trống); 1 đoạn code thừa đã xoá. 10 đột biến sống ở vòng đầu đã thêm test để bắt |
| Soát độc lập | 2 agent. Nghiệp vụ: 2 cao, 2 trung bình, 6 nhỏ. Kỹ thuật: 1 trung bình, 8 nhỏ (1 lỗi cao về khoá xin link thấy lúc đang sửa). Đã sửa hết trừ 4 mục nêu ở 5J.7, mỗi lỗi có test hồi quy |

Lỗi soát tìm ra và đã sửa:
* Buổi Không hoàn thành khoá luôn ngày bắt đầu gói: admin sửa sau thì học viên mất ngày. Nay buổi này **chưa khoá** ngày bắt đầu, chờ admin làm rõ.
* Đóng dấu "đã xin link" trước khi gửi: khoá bận hoặc thư lỗi làm người dùng bị khoá 60 phút mà không có link. Nay chỉ tính khi đã gửi.
* Tắt bảo trì là buổi chuyển Không hoàn thành ngay, tutor không kịp chọn. Nay dời mốc.
* Hai lượt hourlyJob chồng nhau gửi trùng thư nhắc tutor. Nay có dấu đang gửi.
* Ngày nâng cấp (hôm nay Chủ nhật) có thể báo "tutor chưa mở lịch" hai lần. Nay đọc dấu của job cũ.
* Thông báo tuần sau hiện cả khi học viên không đặt được (Trial hết lượt, gói hết trước tuần sau) và sau hạn 15:00 Chủ nhật. Đã sửa.
* Thư nhắc lỗi không thử lại; địa chỉ hỏng thì thử mãi. Nay thử tối đa 3 lần.
* Học viên thấy nhãn "Không hoàn thành" như lỗi của mình. Nay học viên thấy "Trường đang kiểm tra"; tutor và admin vẫn thấy "Không hoàn thành".

### 5J.3 Đọc kỹ trước khi cập nhật

* **Hôm nay Chủ nhật 01/11.** Hạn mở lịch tuần 02/11 (22:00 thứ Bảy 31/10) đã qua: bản mới không gửi nhắc cho tuần này. Nhắc đầu tiên theo luật mới: 15:00 thứ Sáu 06/11 cho tuần 09/11.
* **Báo đỏ ngay sau khi cập nhật:** mọi buổi CONFIRMED đã quá 24 giờ mà tutor chưa chọn (bản cũ đã tự Hoàn thành hết, nên thường là 0) sẽ báo đỏ ở lượt hourlyJob đầu tiên. Sau đó 24 giờ mới có thể thành Không hoàn thành.
* **Giữa lúc dán code và lúc chạy menu 1** (thiếu cột `result_notice_at`): không báo đỏ, nhưng buổi vẫn thành Không hoàn thành đúng 48 giờ. Chạy menu 1 ngay sau khi dán.
* **Menu 3 bắt buộc** ở bản này: tạo lại trigger để xoá 2 trigger sundayRemind cũ (còn 8). Không chạy menu 3 thì trigger cũ vẫn chạy nhưng không làm gì (đã để hàm rỗng, không lỗi).
* **Admin đăng nhập:** chưa cài dự án phụ đăng nhập Google thì menu 2 có CẢNH BÁO; admin vẫn vào bằng link email (24 giờ) vì `ADMIN_LINK_LOGIN` mặc định TRUE.

### 5J.4 MailFix (bắt buộc mỗi lần dán Code.gs mới, tới khi xong 5Q)

Hướng dẫn đầy đủ: `HUONG_DAN_MAILFIX.md`. Bản 8.1.1 là **bản gốc** (cách B): không có `function sendEmailFix_`.

1. Dự án đã có file `MailFix` (cách B): giữ nguyên, không sửa. Chưa có: làm mục 3 của `HUONG_DAN_MAILFIX.md` trước.
2. Mở `Code.gs` trong trình soạn Apps Script, chọn hết nội dung cũ, dán `dist/Code.gs` bản 8.1.1, bấm **Lưu**.
3. Đứng trong `Code.gs`, mở Tìm và thay: Windows **Ctrl + H**, Mac **Cmd + Option + F**.
4. Ô Tìm: `MailApp.sendEmail(` · Ô Thay: `sendEmailFix_(` (gõ đúng, có dấu mở ngoặc; tắt các nút Aa, .*, ab).
5. Số kết quả phải là **đúng 1**. Khác 1: dừng, chụp màn hình gửi coder.
6. Bấm **Thay tất cả**, **Lưu**.
7. Kiểm 3 điều trong `Code.gs`:
   * `MailApp.sendEmail(`: **0** kết quả;
   * `sendEmailFix_(`: **1** kết quả;
   * `MailApp.getRemainingDailyQuota`: **8** kết quả (không thay).
8. **`appsscript.json` ĐỔI ở bản này:** Cài đặt dự án (bánh răng) → bật "Hiện tệp kê khai appsscript.json" nếu chưa bật → mở `appsscript.json`, chọn hết, dán `dist/appsscript.json`, **Lưu**. Kiểm có dòng `https://www.googleapis.com/auth/gmail.send`. File MailFix dùng quyền này nên dán là đủ.
9. Chạy `testMailFix`: Google hỏi cấp quyền (có dòng "Gửi email thay mặt bạn") → **Cho phép**. Thư "thaiput · thử MailFix" phải tới (kể cả Spam).

Phương án khác: coder gửi thêm bản Code.gs đã vá sẵn (cách A, không cần tìm và thay). Khi đó phải **xoá** file MailFix riêng trong dự án. Không trộn hai cách.

### 5J.5 Cập nhật STAGING (chưa có PRODUCTION)

Anh chốt 01/11 tối: **chưa tách STAGING và PRODUCTION tới hết chunk 5**. Mọi bản tới 5Q chỉ dán vào file STAGING đang dùng. Go live là việc của chunk 6 (xem `plan/KE_HOACH_5J_5P.md` mục 5). Bản test riêng của 5J.5 chưa làm, không bắt buộc.

1. **STAGING:**
   1. Dán `dist/Code.gs` và làm MailFix (5J.4 bước 1 đến 7).
   2. Dán `dist/appsscript.json`, chạy `testMailFix` để cấp quyền (5J.4 bước 8, 9).
   3. Mở `Index.html` trong trình soạn, chọn hết, dán `dist/Index.html`, **Lưu**.
   4. Tải lại trang Sheets (F5). Menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Kiểm dòng báo: thêm cột `result_notice_at`, thêm khoá CONFIG mới, chép ô cũ (nếu anh từng chỉnh), thêm luật thông báo RESULT_OVERDUE, RESULT_NOT_COMPLETED, cập nhật mẫu TUTOR_REMIND.
   5. Menu **3. Tạo lại trigger tự động**: báo **8** trigger.
   6. Menu **2. Kiểm tra hệ thống**: không có LỖI.
   7. **Triển khai → Quản lý bản triển khai → sửa → Phiên bản mới → Triển khai.**
   8. Thử nhanh (bật giả lập thời gian nếu cần):
      * xin link học viên 2 lần liền: lần 2 báo "link đã được gửi lúc ..., xin link mới sau ..."; bấm link 2 lần trong 15 phút đều vào được;
      * admin bấm "Thoát mọi thiết bị" cho một tutor: link vừa gửi cho tutor đó không dùng được nữa;
      * đặt 1 buổi, để tutor không chọn kết quả; giả lập tới giờ kết thúc + 25 giờ, chạy hourlyJob: trang tutor đỏ, trang quản trị đỏ, có thông báo Khẩn; + 49 giờ: buổi thành Không hoàn thành, học viên thấy "Trường đang kiểm tra";
      * admin chọn "Hoàn thành (admin chọn)" cho buổi đó: báo cáo tháng tính lương;
      * giả lập thứ Sáu 15:05 với một tutor chưa mở giờ tuần sau, chạy hourlyJob: tutor nhận thư nhắc có hạn "22:00 Thứ 7";
      * giả lập thứ Bảy 09:00, tutor đã mở giờ tuần sau: trang học viên có khung "Tuần sau đã có giờ trống".
2. **PRODUCTION:** chưa có. Không làm bước nào trên file khác.

### 5J.6 Quyết định coder tự chọn (chờ anh duyệt, đã ghi BACKLOG BL53 đến BL57)

1. **Buổi Không hoàn thành với học viên:** tạm tính là đã dùng (trừ 1 lượt Trial) nhưng chưa khoá ngày bắt đầu gói, tới khi admin làm rõ. Học viên thấy "Trường đang kiểm tra". Hệ quả: Trial 2 lượt có thể bị chặn đặt buổi thứ 2 tới khi admin sửa. Phương án khác: (a) không trừ lượt tới khi admin làm rõ (học viên có lợi, trường chịu rủi ro học viên đặt quá lượt); (b) coi như Vắng tutor (bù luôn, tutor không lương).
2. **Kênh báo đỏ:** RESULT_OVERDUE mức Khẩn, kênh LOG (chỉ trên web, không email từng buổi). RESULT_NOT_COMPLETED vào email tổng hợp 21:00. Phương án khác: đổi RESULT_OVERDUE sang EMAIL hoặc DIGEST trong tab NOTIFY_RULES (không cần coder).
3. **3 lựa chọn mới ở admin_action** (Hoàn thành, Vắng học viên, Vấn đề kỹ thuật do admin chọn), chỉ cho buổi đã bắt đầu còn chờ hoặc Không hoàn thành. Phương án khác: chỉ cho sửa bằng "Vắng tutor".
4. **Admin link 24 giờ, bấm không giới hạn:** thư bị chuyển tiếp thì người nhận vào quyền admin cả ngày; chỉ có email "Có đăng nhập mới" báo. Phương án khác: 24 giờ nhưng 1 lần bấm (`ADMIN_LINK_MAX_USES` = 1, đổi trong CONFIG, không cần coder).

### 5J.7 Giới hạn còn lại (nói thẳng)

* **Thời gian chờ 60 phút dài hơn hạn link 15 phút** (đúng như anh chốt). Học viên mở thư trễ 20 phút thì phải chờ thêm 40 phút hoặc nhắn admin gửi hộ. Người biết email học viên có thể xin link hộ mỗi giờ (thư vẫn tới đúng học viên). Phương án khác: cho xin lại khi link trước đã hết hạn, tức đặt `LOGIN_LINK_COOLDOWN_MINUTES` = 15 trong CONFIG (không cần coder). Coder khuyên đặt 15.
* Email có thật và email lạ vẫn khác nhau về thời gian phản hồi (vài trăm mili giây) và khi khoá bận. Chỉ dò được bằng công cụ, không thấy bằng mắt.
* Thư link đăng nhập vẫn gửi trong khoá (có từ trước 5J, luật 5). Sửa ở 5N cùng phần chịu tải.
* Thời gian chờ xin link tính theo giờ giả lập trên STAGING (để thử được). PRODUCTION không có giả lập nên không ảnh hưởng.
* Buổi Không hoàn thành không được admin xử lý thì dòng BOOKINGS đỏ mãi, ngày bắt đầu gói không khoá (học viên không được bù ngày cho buổi lỗi sau đó tới khi admin xử lý). Trang quản trị hiện 60 ngày.
* Câu "Slot đã có học viên" trong thư tutor xin huỷ còn viết trong code (có từ trước).

### 5J.8 Hướng dẫn đã lỗi thời (chỉ viết lại khi anh yêu cầu)

* `HUONG_DAN_VAN_HANH.md` (bản nháp trong project): **đã thêm Phần J luật thông báo** đủ 37 sự kiện (01/11 tối, theo yêu cầu anh). Còn lỗi thời: danh sách CONFIG (khoá link theo vai trò, lịch THỨ GIỜ, 3 khoá kết quả buổi; khoá cũ bỏ), admin_action (thêm 3 lựa chọn), trạng thái Không hoàn thành, màu đỏ BOOKINGS, thông báo mới, báo cáo tháng 2 cột mới, bỏ mục nhắc Chủ nhật.
* `HUONG_DAN_PHAT_HANH.md`: bản 8.1.1 cần dán `appsscript.json` và chạy menu 3.
* `HUONG_DAN_GO_LIVE_8010.md`: tên bản (8.1.1), số trigger 8, bước dán `appsscript.json`.
* `HUONG_DAN_THU_TAI.md`: không đổi.

| Chunk | Nội dung | Trạng thái | Kết quả test |
|---|---|---|---|
| 5J | Link theo vai trò, xin link 1 lần mỗi giờ, lịch tutor thứ Sáu và thứ Bảy, thông báo tuần sau, câu 29 (báo đỏ, Không hoàn thành), quyền gmail.send | **Xong 01/11 chiều** (8.1.1) | 34/34, 46/46, 124/124, 47/47, 2/2; thử phá 42 (39 bắt, 2 tương đương, 1 code thừa xoá); soát 2 agent |

## Chunk 5M (01/11/2026, bản 8.1.0)

### 5M.1 Làm gì

| Phần | Nội dung |
|---|---|
| Ngày bắt đầu | Tạm tính theo buổi đặt sớm nhất; **khoá** ở buổi học hoàn chỉnh đầu tiên (Hoàn thành, Vắng học viên, Kỹ thuật lỗi học viên, Huỷ muộn), chỉ khi mọi buổi sớm hơn đã có kết quả (buổi kỹ thuật: admin đã chọn lỗi hoặc quá `TECH_DECIDE_HOURS` 48 giờ). Khoá rồi không đổi. Cột mới `start_date_locked`, `start_locked_at`, `start_booking_id`; `start_source` = LOCKED |
| Bù ngày | Buổi lỗi phía trường sau khi khoá: +1 ngày (`COMP_DAYS_PER_SESSION`); Trial +3 ngày **một lần**, trần 3 (`COMP_DAYS_TRIAL`, `COMP_TRIAL_MAX_DAYS`); cộng thêm phần để còn kịp đặt theo luật 15:00. Ghi một lần ở BOOKINGS `comp_days`, `comp_gap`; gói `comp_days` = tổng. Email COMP_EXTENDED cho học viên; trang học viên hiện "Đã cộng N ngày bù. Hạn mới" |
| Hạn gói | start + số ngày gói + `suspended_days` + `comp_days` + `comp_days_admin` − 1 |
| Huỷ bởi admin | Xét giờ admin chọn ô: trước 15:00 hôm trước là CANCELLED_ADMIN (bù); từ 15:00 là **CANCELLED_LATE** mới (trừ lượt, không bù, khoá ngày bắt đầu, chặn đặt lại cùng ngày). Áp cho cả dropdown và nút Huỷ trên trang quản trị |
| Buổi kỹ thuật | Cột `tech_fault`: "Không tính lương buổi kỹ thuật" (lỗi tutor, mặc định, bù), "Tính lương buổi kỹ thuật" (lỗi học viên, trừ lượt, không bù), "Lỗi khách quan: tính lương và bù" (mới). Đổi qua lại bao nhiêu lần cũng khớp lương, lượt, ngày. Dòng BOOKINGS đỏ tới khi admin chọn lỗi |
| Gói hết hạn (BL47) | Hết hạn chưa quá 7 ngày, buổi bù trong hạn: tự cộng và mở lại. Gói gia hạn đã chạy: ngày bù chuyển sang gói sau (xem 5M.6). Ngoài ra báo COMP_ON_EXPIRED để admin cộng tay |
| Gói nối đuôi (Q7) | Gói trước đổi hạn (bù, admin sửa, mở khoá) thì gói sau dời theo; buổi rơi vào khoảng mới chuyển sang gói trước |
| Rút bù | Đổi sang lỗi học viên thì rút; học viên đã đặt vào ngày sắp bị rút thì không rút, báo admin |
| Tab STUDENT_PACKAGES | Ô hệ thống (mã gói, học viên, trạng thái, ngày bắt đầu, ngày bù, ngày mua, tạm khoá, số buổi): Google hỏi lại trước khi sửa; sửa một ô thì trả lại, hiện "Không thể chỉnh sửa"; hourlyJob tự lành ngày, trạng thái, ngày bù tay; ô không tự lành được thì báo Khẩn. `end_date` và `comp_days_admin` chỉ email trong `PKG_EDITORS` (trống = ADMIN_EMAIL) sửa được; sửa hạn thì phần chênh vào `comp_days_admin`, học viên nhận email PACKAGE_DATES_CHANGED. Xoá dòng gói đang có buổi: báo Khẩn |
| Lỗi cũ đã sửa | "Vắng tutor" chọn được cả buổi chưa diễn ra (nay chỉ sau giờ bắt đầu; ghi đè buổi đã có kết quả phải chọn lại lần hai trong 10 phút); "Đổi tutor" sau giờ học (nay chặn); chọn lỗi kỹ thuật không tính lại gói; admin huỷ muộn không trừ lượt; `expiry_notice_at` không xoá khi hạn đổi; gói hết hạn lúc đang tạm khoá; tự kích hoạt 30 ngày dù buổi bị lỗi phía trường (nay đếm từ buổi lỗi gần nhất); menu 1 không thêm được cột thứ 27 (tab Google mới chỉ có 26 cột) |
| Mới trong menu | "Bù buổi 8.1.0: xem trước gói sẽ đổi ngày (chỉ đọc)" |
| CONFIG mới (menu 1 tự thêm) | `COMP_DAYS_PER_SESSION` 1, `COMP_DAYS_TRIAL` 3, `COMP_TRIAL_MAX_DAYS` 3, `COMP_REOPEN_DAYS` 7, `TECH_DECIDE_HOURS` 48, `PKG_EDITORS` trống. Gmail thường không cho biết người sửa: ghi `ADMIN` vào `PKG_EDITORS` |

Tài liệu đã cập nhật trong project: `docs/01` (câu 1, 3, 7, 12, 25, 27, 28 và mục Thay đổi 01/11), `docs/03` (B19 đến B24), `CLAUDE.md` (luật 54, quy ước 1), 2 bản nháp chính sách (bỏ nhãn chờ code 5M). Không gửi lại các file này.

### 5M.2 Kết quả test

| Phần | Kết quả |
|---|---|
| Hàm thuần và Db | 34/34 (P01 đến P08 mới) |
| Kịch bản | 46/46 (40 gốc giữ nguyên kết quả mong đợi, thêm B19 đến B24) |
| Tích hợp | 118/118 (I111 đến I118 mới) |
| Giao diện | 45/45 (U45 mới) |
| Thử tải | 2/2 |
| Thử phá | 53 đột biến: bắt 50, 3 còn sống là tương đương (đã có lớp chặn thứ hai làm cùng việc) |
| Soát độc lập | Vòng 1: 2 agent (nghiệp vụ 7 lỗi, kỹ thuật 3 cao, 2 trung bình, 9 nhỏ). Vòng 2: 1 agent kiểm bản sửa, tìm thêm 6 lỗi (1 cao). Đã sửa hết, mỗi lỗi có test hồi quy |

3 test tích hợp cũ (I49, I108, U22) đổi kết quả theo luật mới anh chốt: admin huỷ sau 15:00 hôm trước nay là Huỷ muộn.

### 5M.3 Đọc kỹ trước khi cập nhật

* **Chuyển đổi một lần ở menu 1 (MIG_5M):**
  * buổi kỹ thuật cũ đã chọn "Tính lương" thành **Lỗi khách quan** (vẫn có lương, không trừ lượt, nay được bù ngày); thông báo TECH_MIGRATED liệt kê từng buổi để chọn lại nếu thật ra lỗi học viên;
  * gói nối đuôi, tự kích hoạt: ghi `start_date_locked`; hạn từng sửa tay giữ nguyên (phần chênh vào `comp_days_admin`);
  * mọi gói tính lại theo luật mới: buổi lỗi phía trường **đã qua** trong gói còn chạy được cộng ngày; **không** email học viên lúc chuyển đổi.
* **Cạm bẫy:** buổi bị huỷ muộn vì lỗi phía trường (tutor ốm báo 20:00 cho buổi sáng mai): **không** chọn "Huỷ bởi admin" (học viên bị trừ). Chọn "Đổi tutor", để trống ghi chú: còn người thay thì đổi; không còn ai thì hệ thống huỷ kiểu tutor và bù. Giờ học đã qua thì chọn "Vắng tutor".
* Trước khi chạy menu 1 (đã dán code), chọn lỗi kỹ thuật vẫn chạy theo cách cũ. Chạy menu 1 ngay sau khi dán.

### 5M.4 MailFix (bắt buộc mỗi lần dán Code.gs mới, tới khi xong 5Q)

Hướng dẫn đầy đủ: `HUONG_DAN_MAILFIX.md`. Bản 8.1.0 là **bản gốc** (cách B): không có `function sendEmailFix_`.

1. Dự án đã có file `MailFix` (cách B): giữ nguyên, không sửa. Chưa có: làm mục 3 của `HUONG_DAN_MAILFIX.md` trước.
2. Mở `Code.gs` trong trình soạn Apps Script, chọn hết nội dung cũ, dán `dist/Code.gs` bản 8.1.0, bấm **Lưu**.
3. Đứng trong `Code.gs`, mở Tìm và thay: Windows **Ctrl + H**, Mac **Cmd + Option + F**.
4. Ô Tìm: `MailApp.sendEmail(` · Ô Thay: `sendEmailFix_(` (gõ đúng, có dấu mở ngoặc; tắt các nút Aa, .*, ab).
5. Số kết quả phải là **đúng 1**. Khác 1: dừng, chụp màn hình gửi coder.
6. Bấm **Thay tất cả**, **Lưu**.
7. Kiểm 3 điều trong `Code.gs`:
   * `MailApp.sendEmail(`: **0** kết quả;
   * `sendEmailFix_(`: **1** kết quả;
   * `MailApp.getRemainingDailyQuota`: **8** kết quả (không thay).
8. `appsscript.json` không đổi ở bản này: chỉ kiểm vẫn còn dòng `https://www.googleapis.com/auth/gmail.send`.
9. Chạy `testMailFix`, thư "thaiput · thử MailFix" phải tới (kể cả Spam).

Phương án khác: coder gửi thêm bản Code.gs đã vá sẵn (cách A, không cần tìm và thay). Khi đó phải **xoá** file MailFix riêng trong dự án. Không trộn hai cách.

### 5M.5 Cập nhật: STAGING trước, PRODUCTION sau

1. **STAGING:**
   1. Dán `dist/Code.gs` và làm MailFix (5M.4).
   2. Mở file HTML `Index.html` trong trình soạn, chọn hết, dán `dist/Index.html`, **Lưu**.
   3. Tải lại trang Sheets (F5). Menu **thaiput → Bù buổi 8.1.0: xem trước gói sẽ đổi ngày**: đọc danh sách gói đổi ngày (chưa ghi gì).
   4. Menu **thaiput → 1. Cài đặt lần đầu / cập nhật cấu trúc**. Kiểm dòng báo: thêm cột, thêm 6 khoá CONFIG, thêm luật thông báo, các dòng "Chuyển … buổi kỹ thuật", "Tính lại gói theo luật bù buổi 8.1.0".
   5. Menu **2. Kiểm tra hệ thống**: không có LỖI.
   6. **Triển khai → Quản lý bản triển khai → sửa → Phiên bản mới → Triển khai.**
   7. Thử nhanh trên STAGING (bật giả lập thời gian nếu cần):
      * đặt 2 buổi cho một học viên Trial; tutor chọn Hoàn thành buổi đầu: gói ghi LOCKED;
      * buổi sau, admin chọn "Vắng tutor" sau giờ học: hạn +3, học viên nhận email "Gói học được cộng 3 ngày";
      * thử sửa ô `start_date` trong STUDENT_PACKAGES: hiện "Không thể chỉnh sửa", ô trả lại;
      * sửa `end_date` thêm 2 ngày: `comp_days_admin` = 2, học viên nhận email đổi hạn;
      * "Huỷ bởi admin" một buổi ngày mai sau 15:00: trạng thái CANCELLED_LATE.
2. **PRODUCTION:** khi STAGING ổn, làm lại đúng các bước 1.1 đến 1.6 trên file PRODUCTION theo `HUONG_DAN_GO_LIVE_8010.md` mục 7 (menu 1 tự sao lưu vào thư mục Releases trước khi đổi cấu trúc).

### 5M.6 Quyết định coder tự chọn (anh duyệt)

* **Buổi bù của gói vừa hết hạn mà gói gia hạn đã chạy:** ngày bù tự cộng vào gói sau (`comp_days_admin` của gói sau), học viên nhận email. Lý do: BL47 muốn kết quả không phụ thuộc giờ admin bấm. Đổi lỗi sang học viên thì rút lại ở gói sau (không rút khi học viên đã đặt vào ngày đó). Phương án khác: không tự cộng, chỉ báo admin cộng tay.
* **Ngày bù tay của admin** (`comp_days_admin`) có một bản lưu riêng trong Script Properties để lấy lại khi bị dán đè. Xoá dữ liệu test xoá luôn bản lưu.

### 5M.7 Giới hạn còn lại (nói thẳng)

* Google không chặn cứng được chủ file: bảo vệ cột chỉ là hộp cảnh báo. Dán đè các ô mã gói, học viên, ngày mua, tạm khoá, số buổi không tự lành được; hệ thống báo Khẩn, admin chép lại từ bản sao lưu đêm.
* Trial: lần bù thứ hai trả lượt nhưng không cộng ngày; còn lượt mà hết ngày thì hệ thống báo TRIAL_LEFT_UNUSED, admin cộng tay.
* Buổi bù của gói đã hết hạn quá 7 ngày: không tự cộng, chỉ báo.
* BL41 (lương buổi huỷ muộn) chưa chốt: mặc định không lương; chốt "có" thì thêm `CANCELLED_LATE` vào ô CONFIG `PAYROLL_STATUSES`.
* Câu lý do huỷ muộn trong email huỷ viết trong code (theo cách cũ của hàm này), chưa sửa được ở EMAIL_TEMPLATES.

### 5M.8 Hướng dẫn đã lỗi thời (chỉ viết lại khi anh yêu cầu)

* `HUONG_DAN_VAN_HANH.md`: mục cột admin_action của BOOKINGS (nay 6 lựa chọn), mục tab STUDENT_PACKAGES (ô khoá, `comp_days_admin`), danh sách CONFIG (6 khoá mới), danh sách thông báo (12 sự kiện mới), màu dòng BOOKINGS.
* `HUONG_DAN_PHAT_HANH.md`: thêm bước menu "xem trước" trước menu 1 cho bản 8.1.0.
* `HUONG_DAN_GO_LIVE_8010.md`: tên bản (8.1.0), số kết quả kiểm MailFix (`getRemainingDailyQuota` nay 8).

| Chunk | Nội dung | Trạng thái | Kết quả test |
|---|---|---|---|
| 5M | Bù buổi, khoá ngày bắt đầu, Huỷ muộn, 3 lỗi kỹ thuật, bảo vệ STUDENT_PACKAGES, 8 lỗi cũ | **Xong 01/11** (8.1.0) | 34/34, 46/46, 118/118, 45/45, 2/2; thử phá 53 (50 bắt, 3 tương đương); soát 2 vòng, 3 agent |

*Mỗi chunk vừa một phiên làm việc, kết thúc bằng test xanh và một file giải thích. Chunk sau đọc file này để nối tiếp đúng chỗ.*

| Chunk | Nội dung | Trạng thái | Kết quả test |
|---|---|---|---|
| 1 | Khung repo, chốt file 01, Config, Schema, Time, Phone, Db, Log, Packages, Assign, harness giả lập Google | **Xong 05/10** | 26/26 hàm thuần và Db |
| 2 | Registration, Booking, Availability, Sessions, CalendarSync, Notify, Jobs, AdminOps; cài 35 kịch bản | **Xong 05/10** | 26/26 và 35/35 kịch bản |
| 3 | Auth, Api, Admin (menu, onEdit), Report, Backup, Setup, Migration; 5 kịch bản cuối; 11 test tích hợp | **Xong 05/10** | 26/26, 40/40, 11/11 |
| 4 | Giao diện 4 màn hình (ui/*.html), 17 test giao diện, bản demo xem trên điện thoại | **Xong 05/10** | 26/26, 40/40, 11/11, 17/17 |
| 5 | Soát độc lập 2 lượt, sửa 16 lỗi, bản dán tay dist/, hướng dẫn chạy thử Gmail và chuyển Workspace | **Xong 05/10** | 26/26, 40/40, 21/21, 17/17 |

## Quyết định kỹ thuật đã chốt ở chunk 1 (chunk sau phải tuân theo)

1. Code đọc ghi Sheets **chỉ qua Db.gs** (`table_()`, `nextId_()`, `withLock_()`), không gọi `getRange` rải rác.
2. Gói kiểu ngày có `start_source`: `BOOKING` (tính lại theo buổi sớm nhất mỗi khi đặt hoặc huỷ) hoặc `FIXED` (nối tiếp, tự kích hoạt, gói đang chạy từ trước). Sau mỗi lần đặt hoặc huỷ phải gọi `pkgRecomputeAfterChange_`.
3. Mã lý do từ chối dùng `REASONS` trong Config.gs; câu hiển thị tiếng Việt trong `REASON_TEXT_VI`.
4. Trạng thái trừ buổi và chặn ngày: `CONSUMING_STATUSES` trong Schema.gs.
5. Test: mỗi kịch bản dùng `scenarioEnv({ now })` trong test/fixtures.js; giả lập Google trong test/gas_mock.js ghi lại mọi lời gọi Calendar và Mail vào `env.state.calendarCalls`, `env.state.mails`.

## Việc của chunk 2 (đã xong, giữ lại để tra cứu)

1. `Registration.gs`: `submitRegistration_(form)` kiểm tra ảnh, đồng ý, số điện thoại, Trial 1 lần; lưu ảnh vào `UPLOADS_FOLDER_ID`; ghi REGISTRATIONS; email admin và khách. `approveRegistration_(regRow, actor)` tạo USER, STUDENT_PACKAGE (dùng `pkgPlanNewPurchase_`), PAYMENTS, email chào mừng (link đăng nhập để chunk 3 nối vào).
2. `Booking.gs`: `bookSessionsFor_(studentId, requests, actor)` theo plan mục 4.2; `cancelBookingFor_(studentId, bookingId)` theo 4.4.
3. `Availability.gs`, `Sessions.gs`, `CalendarSync.gs`, `Notify.gs`, `Jobs.gs` theo plan 4.5, 4.6, 4.9, 4.10, 4.11.
4. Cài `run` cho 35 kịch bản trong test/scenarios.js. Không sửa kết quả mong đợi.

## Quyết định kỹ thuật thêm ở chunk 2

1. Chạy được trên Gmail thường: `MEET_MODE` (AUTO hoặc TUTOR_ROOM, cột `meet_room` trong USERS) và `MAIL_LOW_QUOTA_RESERVE`.
2. Gửi nhiều slot cùng một ngày trong một lần: từ chối cả ngày đó (C21).
3. Thao tác admin nằm ở AdminOps.gs (dịch vụ); chunk 3 chỉ nối menu và dropdown vào các hàm này.
4. Hàm có hậu tố `InLock_` (ví dụ `decideTutorCancelInLock_`, `reassignBookingInLock_`) chỉ được gọi khi đã ở trong `withLock_`.

## Việc của chunk 3 (đã xong, giữ lại để tra cứu)

1. `Auth.gs`: link đăng nhập một lần (băm SHA 256, 15 phút), phiên 30 ngày, giới hạn 3 lần xin link mỗi 15 phút, `requireRole_`. Truyền `loginUrlFn` vào `approveRegistration_` để email chào mừng có link đăng nhập thật.
2. `Api.gs`: `doGet` phục vụ giao diện; các hàm cho `google.script.run` gọi đúng dịch vụ chunk 2 với id lấy từ phiên.
3. `Admin.gs`: menu "thaiput", installable onEdit cho dropdown REGISTRATIONS.admin_action, AVAILABILITY.admin_decision, BOOKINGS.admin_action (gọi AdminOps.gs).
4. `Report.gs` (REPORT_MONTH: buổi theo tutor, doanh thu, email mỗi ngày), `Backup.gs`, `Setup.gs` (tạo file DB, tab, lịch, thư mục, trigger, testSystem), `Migration.gs` từ v6.
5. Cài A05, A06, D30, E37, F40.

## Quyết định kỹ thuật thêm ở chunk 3

1. Mỗi môi trường = 1 file Sheets + 1 Apps Script gắn vào file đó. `setupFirstRun()` (menu) tạo mọi thứ còn thiếu; `switchToProduction()` cho bản thật.
2. Cột `value` của CONFIG lưu dạng chữ; `cfg_()` tự sửa ô đã bị Sheets đổi thành giờ (lỗi thật bắt được ở chunk 3).
3. Trang web gọi các hàm `api*` trong Api.gs; mọi hàm trả `{ ok, reason, message, data }`.
4. Báo cáo tháng ghi giá trị (không công thức) vào tab REPORT_MONTH; lương = buổi tính lương × `rate_vnd` của tutor.
5. Mỗi chunk nối báo cáo test vào `archive/BAO_CAO_CHUNKS.md` (một mục mới, giữ định dạng BEGIN FILE, END FILE). Từ 01/11: chỉ giao PROGRESS.md (CLAUDE.md quy ước 1).

## Việc của chunk 4 (đã xong, giữ lại để tra cứu)

1. `src/ui/Index.html` (khung, điều hướng theo `page`, giữ token phiên trong bộ nhớ trình duyệt có dự phòng), `Styles.html`, `App.html`, `Home.html`, `Login.html`, `Student.html`, `Tutor.html`. Gọi đúng các hàm api* trong Api.gs.
2. Ưu tiên điện thoại; tiếng Việt cho học viên, tiếng Anh cho tutor; nút Zalo và gọi admin.
3. Bản demo xem được trên điện thoại với dữ liệu giả (giả lập google.script.run).

## Quyết định kỹ thuật thêm ở chunk 4

1. Trang web là một trang duy nhất (`ui/Index.html`) nhúng 6 file con; chuyển màn hình bằng `T.go(page)`, không tải lại trang.
2. Dữ liệu khởi động in bằng `<?!= bootJson ?>` (JSON đã lọc trong `bootJson_()`), không dùng `'<?= ?>'` trong thẻ script.
3. Không dùng `alert`, `confirm`, `prompt`; xác nhận qua `T.sheet()`.
4. Giá trị API trả về trình duyệt không được chứa Date (Apps Script trả null). Test giao diện tự bắt lỗi này.
5. Giao diện mới phải có test trong `test/ui.js`, chạy cùng `npm test`. Bản demo sinh từ chính file ui bằng `node test/build_demo.js`.

## Việc của chunk 5 (đã xong, giữ lại để tra cứu)

1. Hướng dẫn từng bước chạy thử trên **Gmail thường** (chưa mua Workspace): tạo file Sheets, dán code (hoặc clasp), chạy `setupFirstRun`, cấp quyền, deploy web app, nhúng Google Sites, `MEET_MODE=TUTOR_ROOM` nếu Meet tự tạo không chạy, hạn mức email.
2. Ghi chú chuyển sang Workspace (`booking@<tên miền>`): đổi CONFIG nào, chạy lại gì, không mất dữ liệu.
3. Danh sách bấm thử trên điện thoại thật (đối chiếu checklist file 04, nhất là B11 lưu đăng nhập trong Google Sites).
4. Soát toàn bộ code lần cuối (một lượt đọc độc lập), báo cáo cuối, lưu project, gửi từng file.

## Quyết định kỹ thuật thêm ở chunk 5

1. Hàm công khai không phải `api*`, `doGet`, `onOpen` phải gọi `requireOperator_(e)`; cài đặt, tạo trigger, chuyển PRODUCTION gọi `requireOwner_(e)`.
2. `DbTable.insert` trong khoá gom dòng, ghi khi ra khỏi khoá hoặc ngay trước khi gọi Calendar (`flushDb_`). Ngoài khoá tự lấy khoá ngắn.
3. Cột người dùng nhập ở `text`; cột code ghi công thức ở `formulas`; cột khác tự thêm dấu nháy.
4. `sendMail_` không ném lỗi; `mailAdminError_` 1 lần mỗi giờ mỗi tiêu đề; lỗi bận trả `BUSY`.
5. `dist/` sinh bằng `node test/build_dist.js`; I19 kiểm chính bản này.

## Trạng thái v8: HOÀN THÀNH CODE

Việc tiếp theo là của anh: chạy thử theo `HUONG_DAN_CHAY_THU_GMAIL.md`, ghi lại 3 điểm chỉ kiểm được trên Google thật (Meet, giữ đăng nhập, ô `=1+1`).
Phiên sửa lỗi sau này: đọc `CLAUDE.md`, `PROGRESS.md`, mục `REPORT_CHUNK5.md` trong `archive/BAO_CAO_CHUNKS.md`, rồi sửa trong `src/`, chạy `npm test`, dựng lại `dist/`.

## Chunk 5 mở rộng (13/10/2026): kế hoạch sửa lại tối 13/10 trong `KE_HOACH_CHUNK5_V2.md`

| Sub-chunk | Nội dung | Trạng thái | Test |
|---|---|---|---|
| 5A | Đăng nhập, phiên, quyền, dữ liệu nền | **Xong 13/10** (8.0.2) | 26/26, 40/40, 27/27, 19/19 |
| 5B | Thông báo theo mức (NOTIFICATIONS, NOTIFY_RULES), tổng hợp 21:00, nhắc 8:00, cảnh báo Chủ nhật, link đúng dòng, admin vào Meet, tutor xin huỷ 4 lựa chọn, tô màu, Calendar ra ngoài khoá, 1 địa chỉ admin | **Xong 13/10** (8.0.3) | 26/26, 40/40, 34/34, 19/19; thử phá 8/8 |
| 5C | Tab CONTENT và EMAIL_TEMPLATES, email song ngữ, câu báo lỗi chỉnh được, nút Zalo nổi, công tắc tắt nhắc 8:00 và tổng hợp | **Xong 13/10** (8.0.4) | 26/26, 40/40, 41/41, 20/20; thử phá 14/14 |
| 5D | Đăng nhập chuyên nghiệp: tutor (link 1 lần, phiên dài, email đăng nhập mới, thoát mọi thiết bị, số buổi đã dạy), admin đăng nhập Google, bộ nhớ đệm phiên, dọn AUTH, tắt nhắc 8:00 | **Xong 15/10** (8.0.5) | 26/26, 40/40, 60/60, 26/26 (chung 5E); thử phá 16/16 |
| 5E | Giao diện admin: luồng thông báo theo tutor và học viên, xem chi tiết, đặt thay, huỷ, nhật ký; menu xoá dữ liệu test 2 bước; co-founder vào Meet không nhận thư | **Xong 15/10** (8.0.6) | 26/26, 40/40, 60/60, 26/26; thử phá 42/42 và 15/15; soát độc lập 2 vòng, 5 agent |
| 5F | Chống nghẽn (khoá tối đa 2 lần, lỗi sau ghi không báo bận, tự thử lại có mã chống trùng, bộ đệm CONFIG và slot), hàng đợi Calendar gom 23h có đường gấp, đối soát, số đo, menu Đo tốc độ, tutor xác nhận 2 bước, bố cục máy tính | **Xong 16/10** (8.0.7) | 26/26, 40/40, 82/82, 30/30; thử phá 30/30; tư vấn 2 chuyên gia; soát 2 vòng |
| 5G | Quyết định 16/10 (QUEUE, tutor link 1 lần 15 phút, bỏ thiết bị ở cổng user, phiên tutor 30 ngày); lưu trữ hằng tháng an toàn; chế độ bảo trì; phát hành và quay lui (Releases); thử tải STAGING (doPost, run.js, browser.js); nhịp tim health; xuất bản PRODUCTION chia file (công cụ, chưa sinh); hướng dẫn CONFIG, menu; **báo cáo, giải thích, tiến độ tổng hợp 5A đến 5G** | **Xong 16/10** (8.0.8) | 26/26, 40/40, 95/95, 31/31, thử tải 2/2; thử phá 61 lỗi (60 bắt, 1 tương đương); soát độc lập 3 vòng (R1, R2, R3 kiểm bản sửa) |
| 5H | Hai thứ tiếng cho từng người dùng (VI \| EN, hỏi lần đầu, lưu USERS.lang, email theo ngôn ngữ), CONTENT song ngữ có chỉ đường, email marketing có chống trùng và hạn mức, giao diện mới, thông báo admin gọn, hướng dẫn độc lập | **Xong 17/10** (8.0.9) | 26/26, 40/40, 100/100, 35/35, thử tải 2/2; thử phá 37 lỗi, bắt 37; soát độc lập 2 agent (máy chủ, giao diện) |
| 5I | Email không tới (menu Kiểm tra gửi email, chẩn đoán có nguồn, hạn mức 24 giờ trượt), tốc độ (mở file DB tối đa 3 lần mỗi lượt đặt, nhớ ENV trong lượt chạy, nhật ký ghi thêm cuối tab), trang quản trị và tên gói song ngữ toàn diện, nhật ký đầy đủ có xem trước, đọc đủ, lưu trữ sau 60 ngày, ô số liệu và nút thông báo bấm được | **Xong 18/10** (8.0.10) | 26/26, 40/40, 110/110, 44/44, thử tải 2/2; thử phá 3 vòng (xem mục `THU_PHA_5I.txt` trong `archive/SOAT_VA_THU_PHA.md`); soát độc lập 2 vòng, mỗi vòng 2 agent (máy chủ; giao diện và tài liệu) |

Huỷ: "thanh toán qua Zalo" của 5D cũ. Đăng ký và thanh toán giữ trên web.

### Quyết định kỹ thuật thêm ở 5A

1. Email admin gửi `adminEmails_()`; thêm admin bằng `addAdmin_` (USERS role ADMIN).
2. AUTH có cột `use_count`; `LOGIN_LINK_MAX_USES` (0 = không giới hạn trong hạn link).
3. Phiên trình duyệt: `thaiput_tab_session` (sessionStorage, riêng từng tab) và `thaiput_session` (localStorage, phiên gần nhất).
4. `AVAIL_STATUS.BLOCKED`: duyệt huỷ slot đang có học viên. `setAvailabilityFor_` từ chối `SLOT_BLOCKED`.
5. `pickTutor_` xoay vòng theo `created_at` gần nhất của booking của tutor; không dùng ngẫu nhiên.
6. `normalizePhone_(input, required)` thay `normalizePhoneVN_` ở mọi chỗ nhận số người dùng nhập.
7. Phiên bản tăng 8.0.1 lên 8.0.2 mỗi sub-chunk tăng số cuối.

### Quyết định kỹ thuật thêm ở 5B và 5C

1. `adminEmails_()` chỉ trả CONFIG `ADMIN_EMAIL` (thay mục 1 của 5A). USERS role ADMIN có quyền, không nhận email.
2. `notify_(event, info, emailFn)` ghi NOTIFICATIONS rồi gửi theo kênh trong NOTIFY_RULES (`DEFAULT_NOTIFY_RULES_` là mặc định). Tổng hợp: `sendDailyDigestInLock_`, đánh dấu `digest_at`.
3. Việc chạy một lần mỗi ngày trong job mỗi giờ dùng `onceAfterHour_(name, hour, now, fn)` với cờ trong Script Properties. Giờ âm = tắt.
4. `bookSessionsFor_` chia 3 pha: khoá, Calendar ngoài khoá, khoá ngắn ghi mã sự kiện (gỡ sự kiện nếu buổi đã bị huỷ giữa chừng).
5. Email: `sendTpl_(key, to, vars, { enFirst, kind, priority })`, mẫu ở `DEFAULT_EMAIL_TEMPLATES_` và tab EMAIL_TEMPLATES (`emailTemplate_`). Biến chữ thoát HTML; biến đuôi `_html` chèn nguyên; biến `x_vi`, `x_en` ưu tiên theo thứ tiếng.
6. Chữ web: `contentMap_()` (CacheService 300 giây) trộn `contentDefaults_()` với tab CONTENT, đưa vào `BOOT.content`; trình duyệt dùng `T.t(key, vars)`. Câu báo lỗi: `reasonText_(code, lang)`, `apiWrap_` chọn `en` cho `apiTutor*`, `both` cho đăng nhập.
7. Ô trống = mặc định; ô `-` = cố ý để trống (cả CONTENT và EMAIL_TEMPLATES).
8. Phiên bản 8.0.3 (5B) và 8.0.4 (5C) giao trong một lần dán.

### Quyết định kỹ thuật thêm ở 5D và 5E (15/10)

1. Bối cảnh: một tài khoản Google Workspace Standard `admin@` (chủ hệ thống và ADMIN_EMAIL). Không có `booking@`. 2 admin là 2 co-founder; co-founder thứ hai là dòng USERS role ADMIN.
2. Phiên: `sessionLookup_` qua CacheService (`SESSION_CACHE_SECONDS`), huỷ phiên luôn gọi `forgetSessions_` sau `withLock_` (luật 35). Không đọc AUTH trực tiếp ở API.
3. Tutor và admin: link 1 lần, email "Có đăng nhập mới" (luật 36). Thiết bị chỉ ghi tên trình duyệt và hệ điều hành.
4. Đăng nhập Google: dự án phụ `dist_google_login/` (chạy dưới quyền người dùng) ký HMAC; dự án chính kiểm chữ ký, 2 phút, 1 lần (`GL_USED`). Khoá bí mật ở Script Properties, không ở CONFIG.
5. Endpoint công khai không ghi, không khoá khi đầu vào sai (luật 37). Cột mới thêm vào tab cũ khai báo `optional`; thứ tự cập nhật: dán, lưu, menu 1, triển khai (luật 38).
6. Xoá dòng chỉ qua `purgeRows_`; xoá dữ liệu nghiệp vụ chỉ qua `resetTestData_` với `ALLOW_DATA_RESET` (luật 10).
7. Khách admin trên Meet: `adminGuests_` (bỏ chủ sự kiện), `sendUpdates: 'none'`; `stripAdminGuests_` trước mọi thư huỷ hoặc đổi tutor (luật 29).
8. Giao diện admin `ui/Admin.html` gọi `apiAdmin*` (AdminApi.gs); chữ trang admin tiếng Việt cố định, không qua CONTENT.
9. `MORNING_REMINDER_HOUR = -1` mặc định (anh bỏ nhắc 8:00 ngày 15/10).
10. Tư vấn và câu hỏi chờ anh chốt: `TU_VAN_15_10.md`.

### Quyết định kỹ thuật thêm ở 5F (16/10)

1. Quyết định của anh Chris 16/10: không tách file `.gs` tới khi xuất bản PRODUCTION chính thức (luật 44); 2 co-founder dùng chung admin@; không đóng băng, sửa liên tục khi đang chạy; go live trên file PRODUCTION mới; Calendar gom 23h.
2. `withLock_` có `afterLock_` (việc chậm sau khi nhả khoá) và `deferWrite_` (ghi nhỏ gom vào một khoá cuối); `afterResponse_` cho việc sau khi kết quả API đã lưu (luật 5, 39, 45).
3. Hàng đợi Calendar: CalendarQueue.gs, `cal_state` (PENDING, CREATED, RESYNC, FAILED, CANCEL_PENDING, CANCELLED, SKIPPED, DETACHED), job `calendarJob` 5 phút, mã sự kiện cố định `lessonEventId_`, gợi ý `cal_due_at` và `cal_hint_seq` trong bộ đệm, giữ chỗ `cal_lease_`.
4. Mã chống gửi trùng `rid` ở API ghi (`idem_`), `request_id` ở BOOKINGS, `IN_PROGRESS`; danh sách `READ_APIS`, `RID_APIS` trong ui/App.html (luật 40).
5. Bộ đệm: CONFIG có `cfg_ver`; slot có `slots_v`; hạn tối đa 21600 giây (luật 41). Mock CacheService chặn đúng giới hạn của Google.
6. Kiểm cột khoá trước khi ghi theo hàng (`verifyRow_`, luật 42).
7. Số đo: Metrics.gs, tab METRICS (ghi bằng `appendRowsRaw_`, giữ 90 ngày), `?page=health` chỉ trả OK.
8. Test kịch bản file 03 chạy `CALENDAR_MODE = INLINE`; chế độ NIGHTLY, QUEUE có test riêng.
9. Tư vấn kiến trúc và lộ trình giai đoạn 0, 1, 2: `TU_VAN_KIEN_TRUC_16_10.md`. Giai đoạn 0 gần xong ở 5F.

### Quyết định kỹ thuật thêm ở 5G (16/10)

1. Quyết định của anh Chris 16/10: Q1 (b) Cloudflare chỉ theo lệnh, Apps Script 100%; Q2 (a) QUEUE; Q3 STAGING trên admintest@ (Workspace dùng thử), PRODUCTION trên admin@; Q5 thử tải trước go live; tutor link 1 lần 15 phút, bỏ thiết bị ở mọi giao diện user, bỏ đăng nhập Google cho tutor; admin giữ nguyên; STAGING cập nhật một lượt sau 5G.
2. Mặc định mới: `CALENDAR_MODE = QUEUE`, `TUTOR_SESSION_DAYS = 30`, `NEW_LOGIN_EMAIL_ROLES = ADMIN`. Menu 1 đổi một lần (MIG_1610) các ô còn giá trị mặc định cũ, rút phiên tutor cũ, xoá chữ CONTENT đã bỏ.
3. `purgeRows_` viết lại (luật 10): quyết định theo nội dung đọc mới, ghi dòng giữ trước rồi xoá đuôi, mốc `PURGE_OPEN_<tab>` có dấu vân tay, `purgeRecover_` ở đầu hourlyJob.
4. Lưu trữ (Archive.gs, luật 46), bảo trì (Maintenance.gs, luật 47: thêm API ghi mới phải thêm vào `MAINT_WRITE_APIS_`, test I91 tự liệt kê), cổng thử tải (LoadTest.gs, `doPost`, luật 24 và 48), phát hành (Release.gs, luật 49).
5. Nhịp tim `HB_<job>` (runJob_, calendarJob), mốc sao lưu `BACKUP_OK_AT`; `?page=health` trả OK hoặc STALE.
6. `node test/build_dist.js --production` sinh `dist_production/` (chỉ khi anh yêu cầu, luật 44); I88 nạp ngược thứ tự.
7. Harness có phần 5: `test/loadtest_selftest.js` (run.js với máy chủ giả có 302, trang lỗi, ghi rồi mất phản hồi, bận mãi).
8. Câu hỏi chờ anh: `CHUNK5G_GIAI_THICH.md` mục 6 (Q4 giám sát: `TU_VAN_GIAM_SAT_16_10.md`).

### Quyết định kỹ thuật thêm ở 5H (17/10)

1. Yêu cầu 17/10 của admin: giao diện đẹp hơn, thông báo admin gọn; nút Vi/Eng từng người tự chọn, hỏi khi đăng nhập lần đầu qua link; CONTENT đổi theo, có cột giải thích; email marketing tab riêng, có menu gửi; hướng dẫn viết độc lập, bỏ đại từ nhân xưng; Code.gs và Index.html vẫn một file.
2. `DEFAULT_CONTENT_` là key → [vi, en, position, shown_when]; `contentMap_()` trả key → [vi, en] (2 khoá bộ đệm); `BOOT.content` gửi cả hai thứ tiếng; `T.t(key, vars, lang)` (luật 33).
3. Câu báo lỗi: `r.MÃ` hai cột; API trả `msg: { vi, en }` (`reasonPair_`, `reasonsPair_`), `message` giữ ngôn ngữ mặc định của API cho trang quản trị. Bỏ key `re.*`, `a.*_en`, `a.zalo_vi`, `a.zalo_en`.
4. Ngôn ngữ người dùng: USERS.lang, `apiSetLanguage` (MAINT_WRITE_APIS_), `T.setLang`, `T.adoptLang`, `T.askLang`, view `relabel` (luật 50). Trang quản trị chỉ tiếng Việt.
5. Chuyển tab CONTENT cũ: `contentDetachOld_` (đổi tên CONTENT_CU_808, ẩn) trước bước tạo tab, `contentCarryOld_` sau `seedContent_`. Mock có `Sheet.setName`.
6. Email marketing: Marketing.gs (luật 51), menu `menuMarketingTest`, `menuMarketingSend`, mẫu chân `MARKETING_FOOTER`, ô CONFIG `MARKETING_QUOTA_RESERVE`.

## Quyết định kỹ thuật thêm ở chunk 5I

* Hạn mức email tính khi Google nhận thư, không phải khi thư tới; chẩn đoán bằng Email log search và xác thực tên miền. Không đổi đường gửi (MailApp) khi chưa có quyết định của admin.
* File DB mở qua `dbSpreadsheet_()`, mở lại mỗi lần vào khoá ngoài cùng; ENV và DB_ID nhớ trong lượt chạy.
* ACTIVITY_LOG, MAIL_LOG ghi thêm cuối tab (`logAppend_`), không nạp cả tab. Mã hành động, đối tượng, mã đối tượng, loại thư là cột chữ.
* Trang quản trị dùng key `ad.*` gửi kèm apiAdminHome; tên hành động `ad.act.*`, sự kiện `ad.ev.*`; thông báo mới có `message_en`, gói có `name_en`.
* Nhật ký: hàng chờ bền khi khoá bận (Script Properties), con trỏ Xem thêm `{ ts, sig, n }`, giữ 60 ngày, chuyển lưu trữ khi dòng cũ nhất quá hạn 7 ngày, trigger onChange với danh sách tab `SHEET_SNAP` (10 trigger).
* Bấm tab trên trang quản trị luôn lấy dữ liệu mới; dữ liệu đã có chỉ dùng khi đổi ngôn ngữ.

## Thiết kế giao diện 19/10 (trên 8.0.10, chỉ đổi dist/Index.html)

* Ngôn ngữ thiết kế mới theo ảnh tham chiếu: nền xám lá, khối trắng bo 24px, màu phấn cho trạng thái, viên thuốc xanh rừng cho nút chính và mục đang chọn, một phông Be Vietnam Pro. Chi tiết: `THIET_KE_GIAO_DIEN.md`, `CHANGELOG_GIAO_DIEN_19_10.md`.
* Chỉ đổi src/ui/Styles.html, 4 biểu tượng tab trong Admin.html, dòng tải phông trong Index.html. Không đổi id, class, nội dung, máy chủ. Test 222/222 xanh.
