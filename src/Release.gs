/**
 * Release.gs · Phát hành và quay lui khi đang chạy thật (chunk 5G)
 *
 * Cập nhật code khi đang chạy thật không làm mất dữ liệu nếu đi đúng thứ tự (CHUNK5G_GIAI_THICH.md mục Phát hành):
 *   1. Sửa và thử trên STAGING trước. 2. Trên PRODUCTION: dán code, lưu, chạy menu 1 (tự sao lưu DB trước khi đổi cấu trúc,
 *   bản sao nằm ở thư mục Releases, KHÔNG BAO GIỜ tự xoá). 3. Triển khai > Quản lý > Phiên bản mới (mô tả ghi số phiên bản).
 *   Quay lui code: Triển khai > Quản lý > chọn lại phiên bản cũ (dữ liệu giữ nguyên; trigger chạy code đã lưu nên dán lại
 *   code cũ rồi lưu). Quay lui dữ liệu: mở bản sao trong Releases (hoặc Lịch sử phiên bản của Sheets).
 * Mỗi lần phiên bản đổi, menu 1 ghi RELEASE vào ACTIVITY_LOG (từ, đến, người chạy).
 *
 * Chunk 5R (bản 8.1.9): tóm tắt cập nhật cho admin. Khi phiên bản đổi trên file đã có dữ liệu, menu 1 lập MỘT bản tóm tắt gồm
 * (1) ghi chú phát hành do code giữ (RELEASE_NOTES_: mỗi bản sau 8.1.4, nhóm theo loại) và (2) những gì lượt chạy này THỰC SỰ làm
 * (đo ngay trong setupCore_: khoá CONFIG thêm, cột, tab, dòng chữ, mẫu email, key trùng gộp, ô chữ admin sửa được giữ...).
 * Giao năm đường: dòng RELEASE trong ACTIVITY_LOG, tab RELEASE_LOG (chỉ ghi thêm), một thông báo RELEASE_NOTES, một email tới ADMIN_EMAIL và dòng MAIL_LOG của email; chữ tóm tắt cũng hiện trong kết quả menu 1.
 * Chỉ MỘT lần mỗi lần đổi phiên bản (cùng lúc ghi APP_VERSION_LAST): chạy lại menu 1 cùng phiên bản làm nốt đường còn thiếu (nếu có), còn không thì im lặng (chỉ thêm dòng SETUP_RUN) và không gửi thư.
 * Soát X2: bản tóm tắt ghi bền (RELEASE_PENDING) cùng lệnh với APP_VERSION_LAST; mỗi đường giao có trạng thái riêng và được làm nốt (menu 1 lần sau, job mỗi giờ) nếu dở;
 * số đo được ghi bền từng bước của setupCore_ nên menu 1 bị cắt giữa chừng không làm mất việc đã đo.
 * File mới tinh (chưa có tab CONFIG) không có tóm tắt. Thêm bản mới: thêm một phần tử vào CUỐI RELEASE_NOTES_, đổi APP.VERSION,
 * rồi chạy `node test/tools/release_baseline.js --write` (test I148 buộc: mặc định CONFIG, chữ web, mẫu email, luật thông báo,
 * cột tab mà đổi thì phải có ghi chú khớp).
 */

/** Thư mục Releases (Script Property RELEASES_FOLDER_ID, tự tạo). Bản sao trong đây không bị pruneFolder_ dọn. */
function releasesFolder_() {
  var props = props_(), id = props.getProperty('RELEASES_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var f = DriveApp.createFolder('THAIPUT_V8_' + getEnv_() + '_Releases');
  props.setProperty('RELEASES_FOLDER_ID', f.getId());
  return f;
}

/** Sao một bản DB vào Releases. Trả tên file. */
function releaseCopy_(ss, label) {
  var name = 'THAIPUT_DB_' + getEnv_() + '_' + label + '_' + Utilities.formatDate(getNow_(), APP.TIMEZONE, 'yyyyMMdd_HHmm');
  DriveApp.getFileById(ss.getId()).makeCopy(name, releasesFolder_());
  return name;
}

/**
 * Đầu menu 1: phiên bản code khác lần chạy trước (hoặc lần đầu có tính năng này trên file đã có dữ liệu) thì sao lưu DB
 * trước khi đổi cấu trúc. Lỗi sao lưu không chặn cài đặt nhưng hiện cảnh báo to. Trả dòng báo, hoặc null.
 */
function releaseSnapshot_(ss) {
  var last = props_().getProperty('APP_VERSION_LAST');
  if (last === APP.VERSION || !ss.getSheetByName('CONFIG')) return null;
  try { var line = 'Sao lưu trước cập nhật (' + (last || 'bản cũ') + ' sang ' + APP.VERSION + '): ' + releaseCopy_(ss, 'TRUOC_' + APP.VERSION) + ', thư mục Releases (không tự xoá)'; RELEASE_SNAPSHOT_FAILED_ = false; return line; }
  catch (e) { RELEASE_SNAPSHOT_FAILED_ = true; return 'CẢNH BÁO: chưa sao lưu được trước cập nhật (' + e.message + '). Chạy menu "Phát hành: sao lưu ngay" trước khi dùng tiếp; lần chạy menu 1 sau sẽ thử sao lưu lại.'; }
}
var RELEASE_SNAPSHOT_FAILED_ = false;

/**
 * Cuối menu 1: ghi nhận phiên bản, rồi (file đã có dữ liệu) giao tóm tắt cập nhật. Dòng tóm tắt chữ nằm ở RELEASE_SUMMARY_LINES_.
 * Soát X2 (FIX A): bản tóm tắt (số đo, bản trước, bản đích) được GHI BỀN vào Script Properties cùng lúc, trong MỘT lệnh ghi, với dấu ghi nhận phiên bản
 * (APP_VERSION_LAST). Từ đó mỗi đường giao (nhật ký RELEASE, tab RELEASE_LOG, thông báo, email) có trạng thái riêng trong bản ghi; bản ghi chỉ bị xoá khi cả
 * bốn đường đã xong (hoặc bỏ cuộc sau số lần thử tối đa). Khoá bận hay bị cắt giữa chừng thì menu 1 lần sau (cùng phiên bản) và job mỗi giờ làm nốt đúng
 * phần còn thiếu, không làm lại phần đã xong. Lỗi giao không bao giờ làm hỏng menu 1 (luật 27, 39).
 */
function releaseRecord_() {
  var props = props_(), last = props.getProperty('APP_VERSION_LAST');
  if (last === APP.VERSION) return releaseResumeFromMenu_();   // phiên bản đã ghi nhận ở lượt trước: chỉ làm nốt phần giao còn dở (nếu có)
  // Sao lưu trước cập nhật hỏng: chưa ghi nhận phiên bản, để lần chạy menu 1 sau thử sao lưu lại (soát R1 L6).
  // Số đo của lượt này giữ lại (RELEASE_PENDING) vì lượt sau sẽ không còn gì để đo.
  if (RELEASE_SNAPSHOT_FAILED_) { releasePersist_(true); return null; }
  var who = ''; try { who = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail(); } catch (e) { }
  var msg = 'Ghi nhận phiên bản ' + APP.VERSION + (last ? ' (trước đó ' + last + ')' : '');
  if (!UPGRADE_RUN_ || UPGRADE_RUN_.fresh) {   // file mới tinh: không có tóm tắt
    props.setProperty('APP_VERSION_LAST', APP.VERSION);
    try { withLock_(function () { logActivity_(who || 'SYSTEM', 'RELEASE', 'SYSTEM', APP.VERSION, JSON.stringify({ from: last || '' })); }); } catch (e) { }
    return msg;
  }
  // Bước chuyển dữ liệu chạy lần đầu ở cả lần nâng cấp này (đo bằng Script Properties MIG_*, so với danh sách lúc BẮT ĐẦU lần nâng cấp).
  releaseMigMeasure_();
  var rec = releaseSealRecord_(last || '', who);
  var saved = false;
  try { releasePendingWrite_(rec, { APP_VERSION_LAST: APP.VERSION }); saved = true; }
  catch (e) {
    // Không lưu bền được (hạn mức Script Properties): vẫn ghi nhận phiên bản, giao một lần theo kiểu cũ; không có bản ghi để thử lại.
    try { props.setProperty('APP_VERSION_LAST', APP.VERSION); releasePendingClear_(true); } catch (e2) { }   // bản ghi chưa niêm phong không còn ý nghĩa (soát X2 L4)
    RELEASE_SUMMARY_LINES_ = ['LƯU Ý: không lưu bền được bản ghi giao tóm tắt (' + e.message + '); giao một lần ngay bây giờ, nếu đường nào lỗi sẽ KHÔNG tự thử lại.'];
  }
  try { RELEASE_SUMMARY_LINES_ = RELEASE_SUMMARY_LINES_.concat(releaseLegs_(rec, false, saved).lines); }
  catch (e) { RELEASE_SUMMARY_LINES_.push('LƯU Ý: chưa lập được tóm tắt cập nhật (' + e.message + ').'); }
  return msg;
}

function menuReleaseBackup(e) { requireOperator_(e);
  var name = releaseCopy_(dbSpreadsheet_(), 'THU_CONG');
  withLock_(function () { logActivity_(adminActor_(), 'RELEASE_BACKUP', 'SYSTEM', APP.VERSION, name); });
  alert_('Đã sao lưu: ' + name + '\nThư mục: THAIPUT_V8_' + getEnv_() + '_Releases (không tự xoá).');
  return name;
}

/**
 * Ghi chú phát hành do code giữ (chunk 5R). Mỗi phần tử một bản, thứ tự tăng dần. Nhóm:
 *   users      thay đổi người dùng thấy (học viên, tutor, admin)
 *   config     khoá CONFIG: { key, kind: 'ADDED' | 'CHANGED' | 'REMOVED' | 'RENAMED', value (mặc định), vi, en }
 *   content    chữ web (tab CONTENT): { key, kind: 'ADDED' | 'CHANGED' | 'REMOVED', vi, en }; CHANGED = chữ gốc đổi (ô admin đã sửa được giữ)
 *   templates  mẫu email (tab EMAIL_TEMPLATES): { key, kind, vi, en }; phần tử không có key là ghi chú chung (ví dụ khung email)
 *   notify     luật thông báo (tab NOTIFY_RULES): { key, kind, vi, en }
 *   data       dữ liệu và cấu trúc: { key (TAB hoặc TAB.cột), kind, vi, en } hoặc ghi chú chung
 *   admin      việc admin cần làm hoặc cần biết
 * Mỗi phần tử có { vi, en } (thêm key, kind khi gắn với một khoá). CONFIG kind ADDED còn là nguồn ghi chú cho cột note của CONFIG
 * khi menu 1 thêm khoá (releaseConfigNote_). Nội dung lấy từ PROGRESS.md và từ so sánh thật mã 8.1.4 với mã hiện tại;
 * test I149 đối chiếu tự động, không ghi điều không có.
 */
var RELEASE_NOTES_ = [
  { version: '8.1.5', date: '05/11/2026',
    users: [
      { vi: 'Giao diện web đổi theo ảnh thương hiệu: nền trắng, nút chính đen, vàng thương hiệu chỉ cho dấu nhận diện, khối bo góc, đổ bóng thay viền.', en: 'New web look from the brand image: white background, black primary buttons, brand yellow only for identity marks, rounded blocks, shadows instead of borders.' },
      { vi: 'Sửa tương phản nút bị khoá, vạch chân thanh đầu trang, bóng ô số liệu trên điện thoại.', en: 'Fixed disabled button contrast, the header bottom line and the stat tile shadows on phones.' }
    ],
    data: [{ vi: 'Không đổi cấu trúc dữ liệu, không thêm khoá CONFIG, chữ web hay mẫu email.', en: 'No data structure change, no new CONFIG key, web text or email template.' }],
    admin: [{ vi: 'Mở web trên điện thoại và máy tính xem giao diện mới (nền trắng, nút đen, logo vàng).', en: 'Open the web app on a phone and a computer to see the new look (white background, black buttons, yellow logo).' }]
  },
  { version: '8.1.6', date: '05/11/2026',
    users: [
      { vi: 'Trang chủ có ảnh banner thương hiệu; viên chữ Thái đổi nền trắng, chữ đen, viền vàng.', en: 'The home page has the brand banner image; the Thai text pill is now white with black text and a yellow border.' }
    ],
    templates: [
      { vi: 'Khung mọi email đổi sang đen trắng, gạch vàng dưới đầu trang, nút hình viên thuốc đen. CHỮ của mẫu email không đổi: mẫu admin đã sửa vẫn có hiệu lực y nguyên.', en: 'Every email frame is now black and white with a yellow rule under the header and black pill buttons. Template TEXT is unchanged: templates edited by admin keep working as before.' }
    ],
    data: [{ vi: 'Không đổi cấu trúc dữ liệu, không thêm khoá CONFIG hay chữ web.', en: 'No data structure change, no new CONFIG key or web text.' }],
    admin: [{ vi: 'Gửi thử vài loại email tới Gmail web, Gmail điện thoại và Outlook để xem khung mới (menu Email, gửi thử một mẫu).', en: 'Send a few test emails to Gmail web, Gmail mobile and Outlook to see the new frame (Email menu, send one template).' }]
  },
  { version: '8.1.7', date: '07/11/2026',
    users: [
      { vi: 'Tô màu Sheets mới: BOOKINGS 6 màu, STUDENT_PACKAGES 5 màu; vùng tô phủ tới hết tab, tab tự thêm hàng thì vùng tô nới theo và giữ luật tô màu admin tự thêm.', en: 'New Sheets colouring: 6 colours in BOOKINGS, 5 in STUDENT_PACKAGES; the coloured area covers the whole tab and grows when the tab adds rows, keeping rules admin added.' },
      { vi: 'Lựa chọn mới "Đã xử lý (giữ nguyên)" ở cột admin_action của BOOKINGS: không đổi trạng thái, lương hay gói, chỉ ghi admin_done_at và nhật ký ADMIN_MARK_DONE để hết màu.', en: 'New choice "Đã xử lý (giữ nguyên)" in the BOOKINGS admin_action column: changes no status, pay or package, only writes admin_done_at and the ADMIN_MARK_DONE log so the colour goes away.' },
      { vi: 'Buổi kẹt ở Chờ đổi tutor quá REASSIGN_STUCK_HOURS giờ: job mỗi giờ báo Khẩn một lần (một email gộp nhiều buổi). "Đổi tutor" nhận được buổi kẹt; "Huỷ bởi admin" buổi kẹt luôn là Huỷ bởi admin (học viên được bù), không thành Huỷ muộn; chỉ định tutor bận thì buổi vẫn kẹt.', en: 'Lessons stuck in Pending reassignment for over REASSIGN_STUCK_HOURS hours: the hourly job raises one urgent alert (one email for many lessons). "Đổi tutor" now accepts a stuck lesson; "Huỷ bởi admin" on a stuck lesson is always Cancelled by admin (student compensated), never Late cancel; assigning a busy tutor leaves the lesson stuck.' },
      { vi: 'Trang quản trị bỏ buổi Không hoàn thành đã được chọn "Đã xử lý" khỏi danh sách chờ kết quả (cùng nghĩa với màu Sheets).', en: 'The admin page drops Not completed lessons already marked handled from the waiting list (same meaning as the Sheets colour).' }
    ],
    config: [
      { key: 'REASSIGN_STUCK_HOURS', kind: 'ADDED', value: '1', vi: 'Buổi kẹt ở trạng thái Chờ đổi tutor quá số giờ này thì job mỗi giờ báo Khẩn (REASSIGN_STUCK). -1 = tắt.', en: 'Lessons stuck in Pending reassignment longer than this many hours trigger an urgent alert (REASSIGN_STUCK). -1 = off.' }
    ],
    content: [
      { key: 'ad.ev.REASSIGN_STUCK', kind: 'ADDED', vi: 'Tên sự kiện "Buổi kẹt chờ đổi tutor" trên trang quản trị.', en: 'Event name "Lesson stuck waiting for a tutor" on the admin page.' },
      { key: 'ad.act.REASSIGN_STUCK', kind: 'ADDED', vi: 'Tên hành động nhật ký "Báo buổi kẹt chờ đổi tutor".', en: 'Log action name "Stuck reassignment alert".' },
      { key: 'ad.act.ADMIN_MARK_DONE', kind: 'ADDED', vi: 'Tên hành động nhật ký "Admin đánh dấu đã xử lý".', en: 'Log action name "Admin marked as handled".' }
    ],
    notify: [
      { key: 'REASSIGN_STUCK', kind: 'ADDED', vi: 'Luật thông báo mới: Khẩn, gửi email ngay khi có buổi kẹt Chờ đổi tutor.', en: 'New notification rule: urgent, emailed immediately when a lesson is stuck in Pending reassignment.' }
    ],
    data: [
      { key: 'BOOKINGS.admin_done_at', kind: 'ADDED', vi: 'Cột mới BOOKINGS.admin_done_at (lúc một lựa chọn admin_action chạy thành công). Menu 1 thêm cột ở bên phải, dòng cũ để trống.', en: 'New column BOOKINGS.admin_done_at (when an admin_action choice succeeded). Menu 1 adds it on the right; old rows stay empty.' },
      { vi: 'Menu 1 đặt lại dropdown admin_action (thêm lựa chọn mới) và luật tô màu của 5 tab NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS, STUDENT_PACKAGES (luật tô màu admin tự thêm riêng ở 5 tab này bị thay bằng luật hệ thống). Dữ liệu ô không đổi.', en: 'Menu 1 resets the admin_action dropdown (new choice) and the colour rules of the 5 tabs NOTIFICATIONS, REGISTRATIONS, AVAILABILITY, BOOKINGS, STUDENT_PACKAGES (colour rules admin added by hand on these 5 tabs are replaced by the system rules). Cell data is unchanged.' }
    ],
    admin: [
      { vi: 'Sau menu 1, mở BOOKINGS và STUDENT_PACKAGES kiểm màu theo bảng trong PROGRESS.md mục 5N.', en: 'After menu 1, open BOOKINGS and STUDENT_PACKAGES and check the colours against the table in PROGRESS.md section 5N.' },
      { vi: 'Buổi Vắng học viên hoặc Không hoàn thành có từ trước vẫn tô màu tới khi chọn "Đã xử lý (giữ nguyên)" từng dòng (BL72).', en: 'Student absent or Not completed lessons from before stay coloured until you choose "Đã xử lý (giữ nguyên)" on each row (BL72).' },
      { vi: 'Đổi EXPIRY_NOTICE_DAYS thì chạy lại menu 1 để màu vàng của STUDENT_PACKAGES đổi theo.', en: 'After changing EXPIRY_NOTICE_DAYS, run menu 1 again so the yellow colour in STUDENT_PACKAGES follows.' }
    ]
  },
  { version: '8.1.8', date: '12/11/2026',
    users: [
      { vi: 'Form đăng ký: gửi thiếu thì viền đỏ đúng ô sai (tên, email, số điện thoại, ảnh chuyển khoản, ô đồng ý, nhóm gói), con trỏ nhảy về ô sai đầu tiên, sửa ô nào thì ô đó hết đỏ ngay.', en: 'Registration form: when something is missing, the red border marks exactly the wrong field (name, email, phone, payment image, consent box, package group), focus jumps to the first wrong field, and a field clears as soon as it is fixed.' }
    ],
    data: [{ vi: 'Không đổi cấu trúc dữ liệu, không thêm khoá CONFIG, chữ web hay mẫu email.', en: 'No data structure change, no new CONFIG key, web text or email template.' }]
  },
  { version: '8.1.9', date: '14/11/2026',
    users: [
      { vi: 'Khung chuyển khoản có ô mã QR vuông (200 px trên điện thoại, 184 px trên máy tính) ở trang đăng ký và trang gia hạn của học viên; ảnh tải sau khi khung hiện nên trang không chậm đi.', en: 'The bank transfer panel has a square QR code (200 px on phones, 184 px on desktop) on the registration page and the student renewal page; the image loads after the panel appears so the page is not slower.' },
      { vi: 'Dòng lưu ý chuyển khoản đậm và nổi hơn, ở cả hai ngôn ngữ.', en: 'The transfer note line is bolder and more prominent in both languages.' },
      { vi: 'Tăng tốc tải trang: font không chặn hiển thị, khung chờ tĩnh hiện ngay, ảnh bìa có kích thước sẵn, tutor tải trước giờ rảnh ở nền (bản tải trước gắn với phiên của đúng tutor đó), đọc tab nhanh hơn nhờ chọn sẵn bộ chuẩn hoá cột. Kèm sửa một lỗi có từ bản 8.1.4 ở trang tutor: phản hồi tải giờ rảnh tới muộn có thể xoá giờ vừa chọn mà chưa lưu, rồi nút Lưu không gửi gì.', en: 'Faster page loads: non-blocking fonts, a static placeholder shown at once, cover image with fixed size, tutors preload their availability in the background (the preloaded copy is bound to that tutor session), faster tab reads with column normalisers chosen once. Also fixes a bug present since 8.1.4 on the tutor page: a late availability response could wipe hours you had just picked but not saved, and Save then sent nothing.' }
    ],
    config: [
      { key: 'BANK_QR_IMAGE', kind: 'ADDED', value: '', vi: 'Ảnh mã QR chuyển khoản: link chia sẻ Google Drive hoặc mã file của ảnh VUÔNG 600 x 600 px, PNG, dưới 300 KB (JPG, WEBP, GIF cũng nhận). Trống = trang không hiện ô QR. Menu 2 kiểm ảnh.', en: 'Bank transfer QR image: a Google Drive share link or file ID of a SQUARE 600 x 600 px PNG under 300 KB (JPG, WEBP, GIF also accepted). Empty = the page shows no QR. Menu 2 checks the image.' }
    ],
    content: [
      { key: 'h.bank_note', kind: 'CHANGED', vi: 'Chữ gốc mới: "Nội dung chuyển khoản: vui lòng chỉ ghi số điện thoại của bạn." (en: "Transfer reference: Please enter only your phone number."). Ô admin đã sửa được giữ nguyên; chữ gốc mới nằm ở cột default_vi, default_en.', en: 'New default text: "Nội dung chuyển khoản: vui lòng chỉ ghi số điện thoại của bạn." (en: "Transfer reference: Please enter only your phone number."). Cells admin edited are kept; the new default is in default_vi, default_en.' },
      { key: 't.stats_note', kind: 'CHANGED', vi: 'Chữ gốc mới của dòng chú thích dưới bảng số của tutor, nói đúng luật thật: buổi chưa chọn kết quả được báo đỏ, quá hạn mà vẫn chưa chọn thì thành Không hoàn thành và không tính lương (chữ cũ nói sai là tự tính Hoàn thành sau 24 giờ). Ô admin đã sửa được giữ nguyên; chữ gốc mới nằm ở cột default_vi, default_en.', en: 'New default text of the footnote under the tutor stats, stating the real rule: lessons without a result are flagged red, and if still unconfirmed after the deadline they become Not completed and are not paid (the old text wrongly said they count as Completed after 24 hours). Cells admin edited are kept; the new default is in default_vi, default_en.' },
      { key: 'h.bank_qr_alt', kind: 'ADDED', vi: 'Chữ thay thế (alt) của ảnh mã QR trong khung chuyển khoản.', en: 'Alternative text (alt) of the QR image in the transfer panel.' },
      { key: 'ad.act.TEMPLATE_DEDUPE', kind: 'ADDED', vi: 'Tên hành động nhật ký "Gộp dòng trùng key".', en: 'Log action name "Merged duplicate key rows".' },
      { key: 'ad.act.TEMPLATE_DEDUPE_TEXT', kind: 'ADDED', vi: 'Tên hành động nhật ký "Lưu chữ admin bị bỏ khi gộp dòng trùng key" (chữ đầy đủ, chữ dài chia nhiều dòng).', en: 'Log action name "Saved admin text dropped by a duplicate key merge" (the full text, long text split over several rows).' },
      { key: 'ad.act.BANK_QR_REFRESH', kind: 'ADDED', vi: 'Tên hành động nhật ký "Làm mới ảnh QR chuyển khoản" (menu Email).', en: 'Log action name "Refreshed the bank transfer QR image" (Email menu).' },
      { key: 'ad.ev.RELEASE_NOTES', kind: 'ADDED', vi: 'Tên sự kiện "Tóm tắt cập nhật phiên bản" trên trang quản trị.', en: 'Event name "Update summary" on the admin page.' }
    ],
    templates: [
      { key: 'ADMIN_RELEASE_NOTES', kind: 'ADDED', vi: 'Mẫu email mới gửi ADMIN_EMAIL một lần sau menu 1 khi phiên bản đổi: tổng hợp thay đổi và những gì lượt chạy đã làm.', en: 'New email template sent once to ADMIN_EMAIL after menu 1 when the version changes: a summary of changes and what the run did.' }
    ],
    notify: [
      { key: 'RELEASE_NOTES', kind: 'ADDED', vi: 'Luật thông báo mới: Thông tin, gửi email một lần mỗi lần đổi phiên bản.', en: 'New notification rule: info level, emailed once per version change.' }
    ],
    data: [
      { key: 'RELEASE_LOG', kind: 'ADDED', vi: 'Tab mới RELEASE_LOG (chỉ ghi thêm): mỗi lần đổi phiên bản, menu 1 ghi mỗi mục tóm tắt một dòng (at, from_version, to_version, kind, item, detail). Không lưu trữ, không bị xoá khi xoá dữ liệu test, không chuyển sang hệ thống mới.', en: 'New append-only tab RELEASE_LOG: at each version change menu 1 writes one row per summary item (at, from_version, to_version, kind, item, detail). Not archived, kept by the test data reset, not copied to a new system.' },
      { vi: 'Menu 1 tự gộp dòng trùng key ở EMAIL_TEMPLATES và CONTENT thành một dòng (giữ chữ admin đã sửa, ghi nhật ký TEMPLATE_DEDUPE); menu 2 báo key trùng. Hai bản chữ admin sửa khác nhau: dòng cuối thắng (dòng đang dùng khi gửi), bản bị bỏ được lưu ĐỦ trong ACTIVITY_LOG (hành động TEMPLATE_DEDUPE_TEXT, mỗi lượt gộp có mã run, chữ dài chia nhiều dòng theo part) TRƯỚC khi ghi đè; dòng menu 1 chỉ hiện 300 ký tự đầu và chỉ chỗ lấy chữ đủ. Ô active của mẫu email luôn theo dòng cuối (đúng như 8.1.4 đang gửi), nếu các dòng nói khác nhau thì có dòng "CHÚ Ý QUAN TRỌNG" riêng. Sao lưu trước cập nhật hỏng thì không gộp key nào sẽ bỏ chữ admin (có dòng "CẢNH BÁO"). Lượt gộp bị ngắt giữa chừng thì có dòng "CẢNH BÁO: gộp dở"; chạy lại menu 1 để gộp nốt. Menu 1 ghi chú "Mới ở <bản>:" vào cột note của khoá CONFIG vừa thêm (không ghi đè ghi chú hay giá trị đã có).', en: 'Menu 1 merges duplicate key rows in EMAIL_TEMPLATES and CONTENT into one row (keeping admin edits, logging TEMPLATE_DEDUPE); menu 2 reports duplicate keys. When two rows hold different admin edits the last row wins (the one used when sending) and the discarded text is saved IN FULL in ACTIVITY_LOG (action TEMPLATE_DEDUPE_TEXT, each merge run has a run id, long text split over several rows by part) BEFORE it is overwritten; the menu 1 line shows only the first 300 characters and where to find the full text. The active cell of an email template always follows the last row (exactly what 8.1.4 was sending); if the rows disagree there is a separate "CHÚ Ý QUAN TRỌNG" line. If the pre-upgrade backup failed, no key is merged when that would discard admin text (a "CẢNH BÁO" line says so). A merge cut off half way gives a "CẢNH BÁO: gộp dở" line; run menu 1 again to finish it. Menu 1 writes "Mới ở <version>:" into the note column of a newly added CONFIG key (never overwriting an existing note or value).' },
      { vi: 'Ảnh QR chuyển khoản có số phiên bản (Script Property BANK_QR_REV) nằm trong dấu và khoá bộ nhớ đệm: menu 2, sửa tay CONFIG (BANK_QR_IMAGE, BANK_NAME, BANK_ACCOUNT, BANK_HOLDER) và menu Email "Làm mới ảnh QR chuyển khoản" đều làm khách thấy ảnh mới ngay. Thay file ảnh dưới cùng link mà không làm một trong ba cách này thì khách có thể còn thấy ảnh cũ tới 6 giờ.', en: 'The bank transfer QR image has a revision number (Script Property BANK_QR_REV) inside its marker and cache keys: menu 2, manual edits of CONFIG (BANK_QR_IMAGE, BANK_NAME, BANK_ACCOUNT, BANK_HOLDER) and the Email menu "Làm mới ảnh QR chuyển khoản" all make visitors see the new image at once. If you replace the image file under the same link and do none of these three, visitors may still see the old image for up to 6 hours.' },
      { vi: 'Tóm tắt cập nhật được ghi BỀN (Script Properties RELEASE_PENDING) cùng lúc với dấu phiên bản; năm đường giao (nhật ký RELEASE, tab RELEASE_LOG, thông báo, email, dòng MAIL_LOG của email) có trạng thái riêng. Khoá bận, bị cắt giữa chừng hay email lỗi thì menu 1 lần sau (cùng phiên bản, hộp thoại ghi "TIẾP TỤC giao tóm tắt...") và job mỗi giờ làm nốt đúng phần thiếu, không ghi trùng; hộp thoại ghi "CÒN DỞ" khi còn đường chưa xong. Email được nhận việc gửi trong khoá TRƯỚC khi gửi, nên mỗi bản tóm tắt chỉ gửi email một lần: email gửi lỗi thật thì thử lại tối đa 5 lần rồi báo một thông báo MAIL_FAILED chỉ chỗ đọc tóm tắt (khoá bận không tính là lần lỗi); lượt gửi bị ngắt đúng khoảng hẹp từ lúc nhận việc tới lúc Google nhận thư thì admin có thể KHÔNG nhận email nhưng nhận đúng MỘT thông báo MAIL_FAILED nói thật là email có thể đã hoặc chưa gửi; ngắt ngay sau khi Google nhận thư thì email vẫn tới nhưng vẫn có thông báo đó và dòng MAIL_LOG của email không được ghi. Tóm tắt luôn nằm ở tab RELEASE_LOG. Menu 1 và job mỗi giờ chạy gần nhau không giao tóm tắt hai lần: mỗi đường đọc lại bản ghi trong khoá. Còn một trường hợp hiếm: bấm menu 1 hai lần thật sát nhau, trước khi hộp thoại đầu hiện, thì có thể nhận hai email, hai thông báo và RELEASE_LOG gấp đôi (BL94); dữ liệu không bị ảnh hưởng. Bấm menu 1 một lần rồi chờ hộp thoại. Dòng MAIL_LOG của email đã gửi được ghi nốt ở lượt sau nếu khoá bận (hiếm khi thừa một dòng nếu bị ngắt đúng lúc ghi; dòng này chỉ để đếm hạn mức email). Số đo của menu 1 bị cắt giữa chừng được giữ qua các lượt. Khoá CONFIG có dấu cách thừa ("BANK_NAME ") hoặc ký tự vô hình (U+200B, U+200C, U+200D, U+2060, U+FEFF) được so khớp sau khi chuẩn hoá và ô khoá được cắt gọn (có báo ở menu 1, RELEASE_LOG), nên không còn thêm dòng mặc định trống đè giá trị. Hai dòng chỉ khác nhau ở dấu cách hoặc ký tự vô hình thì giữ cả hai, không xoá, không tự đổi giá trị, báo ở menu 1 và menu 2; hệ thống dùng dòng CUỐI trong các dòng có khoá sạch (dòng chỉ khác ở ký tự vô hình chỉ là dự phòng, nên nếu nằm sau khoá sạch thì dòng khoá sạch vẫn được dùng). Nếu dòng đang có hiệu lực mang giá trị mặc định hoặc trống trong khi dòng kia có giá trị khác thì có thêm câu "CHÚ Ý" nêu số hàng và cách sửa tay (chép giá trị đúng sang dòng đang có hiệu lực rồi xoá dòng thừa). Mốc bỏ dòng dở PURGE_OPEN còn sót được menu 1 dọn.', en: 'The update summary is stored DURABLY (Script Property RELEASE_PENDING) together with the version mark; its five delivery legs (RELEASE log entry, RELEASE_LOG tab, notification, email, the MAIL_LOG row of the email) each have their own state. If the lock is busy, the run is cut or the email fails, the next menu 1 run (same version, the dialog says "TIẾP TỤC giao tóm tắt...") and the hourly job finish exactly what is missing without duplicates; the dialog says "CÒN DỞ" while a leg is unfinished. The email is claimed inside the lock BEFORE it is sent, so each summary sends its email only once: a real send failure is retried at most 5 times and then one MAIL_FAILED notification says where to read the summary (a busy lock does not count as a failure); if a run is cut in the narrow window between claiming the send and Google accepting the mail, you may get NO email but exactly ONE MAIL_FAILED notification saying honestly that the email may or may not have been sent; if the cut comes right after Google accepted the mail, the email still arrives but the same notification appears and its MAIL_LOG row is never written. The summary is always in the RELEASE_LOG tab. Menu 1 and the hourly job running close together do not deliver the summary twice: each leg re-reads the record inside its lock. One rare case remains: pressing menu 1 twice in quick succession, before the first dialog appears, can give two emails, two notifications and a doubled RELEASE_LOG (BL94); business data is not affected. Press menu 1 once and wait for the dialog. The MAIL_LOG row of a sent email is written by a later run if the lock was busy (rarely one extra row if a run is cut exactly while writing it; that row only counts the daily email quota). Measured items of an interrupted menu 1 are kept across runs. CONFIG keys with stray whitespace ("BANK_NAME ") or invisible characters (U+200B, U+200C, U+200D, U+2060, U+FEFF) are matched after normalisation and the key cell is cleaned (reported in menu 1 and RELEASE_LOG), so no empty default row overrides the value any more. Two rows that differ only by whitespace or invisible characters are both kept, never deleted, never changed automatically, and reported in menu 1 and menu 2; the system uses the LAST row among the rows with a clean key (a row differing only by invisible characters is just a fallback, so if it comes after the clean key the clean row is still used). If the row in effect holds the default or an empty value while the other row holds a different value, an extra "CHÚ Ý" sentence names the rows and the manual fix (copy the right value into the row in effect, then delete the extra row). A leftover PURGE_OPEN marker of an interrupted row removal is cleaned by menu 1.' }
    ],
    admin: [
      { vi: 'Muốn hiện mã QR: tải ảnh VUÔNG 600 x 600 px PNG dưới 300 KB lên Drive của tài khoản chủ hệ thống, dán link hoặc mã file vào CONFIG BANK_QR_IMAGE, rồi chạy menu 2 kiểm ảnh. Để trống thì không hiện QR. Sau này thay file ảnh dưới CÙNG link (ví dụ đổi tài khoản ngân hàng) thì chạy lại menu 2 hoặc menu Email > Làm mới ảnh QR chuyển khoản để khách thấy ảnh mới ngay.', en: 'To show the QR: upload a SQUARE 600 x 600 px PNG under 300 KB to the system owner account Drive, paste the link or file ID into CONFIG BANK_QR_IMAGE, then run menu 2 to check the image. Leave it empty to hide the QR. If you later replace the image file under the SAME link (for example a new bank account), run menu 2 again or the Email menu item Làm mới ảnh QR chuyển khoản so visitors see the new image at once.' },
      { vi: 'Nếu đã sửa h.bank_note trong tab CONTENT thì chữ của bạn được giữ; muốn dùng chữ gốc mới thì xoá ô vi, en đó (hoặc dán chữ ở cột default_vi, default_en).', en: 'If you edited h.bank_note in the CONTENT tab your text is kept; to use the new default clear its vi and en cells (or paste the text from default_vi, default_en).' },
      { vi: 'Đọc tab RELEASE_LOG và email "Tóm tắt cập nhật" để xem mọi thay đổi từ bản bạn đang chạy; menu "Phát hành: xem thay đổi của bản này" hiện ghi chú của bản đang cài. Nếu hộp thoại menu 1 có dòng "CHÚ Ý QUAN TRỌNG" hoặc "CẢNH BÁO", hoặc dòng báo việc giao tóm tắt còn dở, thì đọc và làm theo dòng đó (giao dở: chạy lại menu 1 để giao nốt).', en: 'Read the RELEASE_LOG tab and the "update summary" email to see every change since the version you were running; the menu "Phát hành: xem thay đổi của bản này" shows the notes of the installed version. If the menu 1 dialog has a line starting "CHÚ Ý QUAN TRỌNG", "CẢNH BÁO" or "CÒN DỞ", read it and do what it says (CÒN DỞ: run menu 1 again to finish delivery).' }
    ]
  }
];

var RELEASE_LOG_MAX_ROWS_ = 400;
/** Nhóm trong RELEASE_NOTES_: [tên nhóm, mã kind trong RELEASE_LOG, nhãn tiếng Việt, nhãn tiếng Anh]. */
var RELEASE_GROUPS_ = [
  ['users', 'NOTE_USERS', 'Người dùng thấy', 'What users see'], ['config', 'NOTE_CONFIG', 'Khoá CONFIG', 'CONFIG keys'], ['content', 'NOTE_CONTENT', 'Chữ web (CONTENT)', 'Web text (CONTENT)'],
  ['templates', 'NOTE_TEMPLATE', 'Mẫu email (EMAIL_TEMPLATES)', 'Email templates (EMAIL_TEMPLATES)'], ['notify', 'NOTE_NOTIFY', 'Luật thông báo (NOTIFY_RULES)', 'Notification rules (NOTIFY_RULES)'],
  ['data', 'NOTE_DATA', 'Dữ liệu và cấu trúc', 'Data and structure'], ['admin', 'NOTE_ADMIN', 'Việc admin cần làm', 'What the admin must do']
];
var RELEASE_KIND_VI_ = { ADDED: 'mới', CHANGED: 'chữ gốc đổi', REMOVED: 'bỏ', RENAMED: 'đổi tên' };
var RELEASE_KIND_EN_ = { ADDED: 'new', CHANGED: 'default changed', REMOVED: 'removed', RENAMED: 'renamed' };

/** Hàm thuần: các bản trong RELEASE_NOTES_ lớn hơn `prev` (trống hoặc không rõ: tất cả) và không lớn hơn `cur`. */
function releaseNotesBetween_(prev, cur, notes) {
  notes = notes || RELEASE_NOTES_;
  return notes.filter(function (n) { return (!prev || cmpVersion_(n.version, prev) > 0) && cmpVersion_(n.version, cur) <= 0; });
}

/** Hàm thuần: ghi chú CONFIG cho khoá vừa thêm: "Mới ở <bản>: ...". Khoá chưa có trong RELEASE_NOTES_ thì ghi chú chung. Không bao giờ trống. */
function releaseConfigNote_(key, cur, notes) {
  notes = notes || RELEASE_NOTES_;
  for (var i = notes.length - 1; i >= 0; i--) {
    var hit = (notes[i].config || []).filter(function (c) { return c.key === key && (c.kind === 'ADDED' || c.kind === 'RENAMED'); })[0];
    if (hit) return 'Mới ở ' + notes[i].version + ': ' + hit.vi;
  }
  return 'Mới ở ' + cur + ': khoá thêm khi cập nhật, chưa có mô tả (xem tab RELEASE_LOG).';
}

/**
 * Hàm thuần: ghi chú tĩnh → danh sách mục { kind, item, vi, en }, mỗi gạch đầu dòng một mục.
 * item = "<bản>" hoặc "<bản> · <khoá>".
 */
function releaseNoteItems_(list) {
  var out = [];
  list.forEach(function (n) {
    RELEASE_GROUPS_.forEach(function (g) {
      (n[g[0]] || []).forEach(function (x) {
        var def = x.kind === 'ADDED' && g[0] === 'config';
        var tag = x.kind ? ' [' + (RELEASE_KIND_VI_[x.kind] || x.kind) + (def ? ', mặc định ' + (x.value === '' ? 'trống' : '"' + x.value + '"') : '') + ']' : '';
        var tagEn = x.kind ? ' [' + (RELEASE_KIND_EN_[x.kind] || x.kind) + (def ? ', default ' + (x.value === '' ? 'empty' : '"' + x.value + '"') : '') + ']' : '';
        out.push({ kind: g[1], item: n.version + (x.key ? ' · ' + x.key : ''), vi: x.vi + tag, en: x.en + tagEn });
      });
    });
  });
  return out;
}

// ── Đo những gì lượt menu 1 này thực sự làm (setupCore_ gọi upgradeAdd_ ở từng chỗ ghi) ──
// Soát X2 (FIX B): số đo được GHI BỀN từng bước (releasePersist_, theo phiên bản đích) để menu 1 bị cắt giữa chừng (khoá bận, hết giờ, Google ngắt) không làm
// mất những gì lượt đó đã làm: lượt sau không còn gì để đo vì dữ liệu đã đổi rồi. Nạp lại ở upgradeStart_, gộp không trùng (kind, item, chữ).
var UPGRADE_RUN_ = null;
var RELEASE_SUMMARY_LINES_ = [];
/** Loại số đo là TRẠNG THÁI (đo lại mỗi lượt), không phải việc đã làm: không lưu bền giữa các lượt. */
var RELEASE_STATE_KINDS_ = ['CONFIG_UNKNOWN', 'CONFIG_KEY_TWIN'];
function releaseMigProps_() { try { return Object.keys(props_().getProperties()).filter(function (k) { return /^MIG_/.test(k); }); } catch (e) { return []; } }
/** Khoá bỏ trùng của một mục đo. Gộp key, cắt khoá CONFIG: MỘT mục cho mỗi key dù lượt chạy lại tính chữ khác (lượt trước đã sửa tab nên báo cáo lượt sau ít chi tiết hơn). */
function releaseItemKey_(x) { return x.kind + '\u0001' + x.item + (RELEASE_ONCE_KINDS_.indexOf(x.kind) === -1 ? '\u0001' + x.vi : ''); }
var RELEASE_ONCE_KINDS_ = ['DUP_MERGED', 'DUP_ACTIVE', 'DUP_SKIPPED', 'CONFIG_KEY_TRIMMED', 'CONFIG_KEY_TWIN'];
/**
 * Đầu setupCore_, TRƯỚC khi tạo tab: nhớ đây là file mới tinh (chưa có CONFIG) hay file đã có dữ liệu. File mới không có tóm tắt cập nhật.
 * Nạp số đo của các lượt trước chưa ghi nhận được phiên bản (cùng phiên bản đích). Bản ghi của phiên bản đích KHÁC không bao giờ lẫn vào:
 * chưa niêm phong thì bỏ; đã niêm phong (phiên bản đó đã ghi nhận nhưng giao dở) thì giao nốt rồi mới bỏ.
 */
function upgradeStart_(ss) {
  var fresh = !ss.getSheetByName('CONFIG'), items = [], rec = null, last = null;
  try { last = props_().getProperty('APP_VERSION_LAST'); } catch (e) { }
  try {
    rec = releasePendingRead_();
    if (rec && fresh) { releasePendingClear_(true); rec = null; }
    else if (rec && rec.target !== APP.VERSION) {
      if (rec.sealed) {
        // Giao nốt (cố gắng) tóm tắt của bản trước rồi bỏ: đường nào vẫn dở thì KHÔNG biến mất im lặng, báo admin một thông báo trung thực (soát X2 L3).
        var fin = false, leg = rec.legs || {};
        try { fin = releaseLegs_(rec, true, true).finished; } catch (e) { Logger.log('Giao nốt tóm tắt bản ' + rec.target + ' lỗi: ' + e.message); }
        if (!fin) {
          var left = ['act', 'log', 'notif', 'mail', 'mlog'].filter(function (k) { return leg[k] === 0 || leg[k] === 4; }).map(function (k) { return RELEASE_LEG_NAME_[k]; }).join(', ') || 'không rõ đường nào (xem tab RELEASE_LOG)';
          releaseNotice_(rec.target, 'Tóm tắt cập nhật bản ' + rec.target + ' chưa giao đủ trước khi nâng lên bản ' + APP.VERSION + ' (còn dở: ' + left + '). Bản ghi tạm đã bỏ; đọc ghi chú phát hành ở menu "Phát hành: xem thay đổi của bản này" và tab RELEASE_LOG.',
            'The update summary of version ' + rec.target + ' was not fully delivered before upgrading to ' + APP.VERSION + ' (left: ' + left + '). The temporary record was dropped; read the release notes from the menu and the RELEASE_LOG tab.');
        }
      }
      releasePendingClear_(true); rec = null;
    } else if (rec && !rec.sealed && last === APP.VERSION) { releasePendingClear_(true); rec = null;   // bản ghi chưa niêm phong còn sót (lần giao không bền): phiên bản đã ghi nhận xong, bỏ (soát X2 L4)
    } else if (rec && rec.sealed && last !== APP.VERSION) rec.sealed = false;   // không khớp dấu phiên bản (ai đó xoá hoặc đặt lại): coi như chưa niêm phong, giữ số đo
    if (rec && !rec.sealed) items = rec.items.filter(function (x) { return RELEASE_STATE_KINDS_.indexOf(x.kind) === -1; });   // trạng thái (khoá lạ, khoá trùng): lượt này đo lại
  } catch (e) { rec = null; items = []; }
  UPGRADE_RUN_ = { fresh: fresh, items: items, seen: {}, dirty: false, rec: rec, last: last, carried: items.length,
    migBefore: (rec && rec.mig0) || releaseMigProps_(), writes: 0 };
  items.forEach(function (x) { UPGRADE_RUN_.seen[releaseItemKey_(x)] = true; });
  RELEASE_SUMMARY_LINES_ = [];
}
function upgradeAdd_(kind, item, vi, en) {
  var R = UPGRADE_RUN_; if (!R) return;
  var x = { kind: kind, item: String(item), vi: String(vi || ''), en: String(en || vi || '') }, k = releaseItemKey_(x);
  if (R.seen[k]) return;   // cùng một việc đo hai lần (lượt trước bị cắt rồi lượt này đo lại): chỉ một dòng
  R.seen[k] = true; R.items.push(x); R.dirty = true;
}
/** Bước chuyển dữ liệu mới chạy (Script Property MIG_* chưa có lúc bắt đầu LẦN NÂNG CẤP này, kể cả các lượt bị cắt trước đó). Gọi lại an toàn. */
function releaseMigMeasure_() {
  var R = UPGRADE_RUN_; if (!R || R.fresh) return;
  var before = R.migBefore || [];
  releaseMigProps_().filter(function (k) { return before.indexOf(k) === -1; }).forEach(function (k) {
    var st = (typeof MIGRATION_STEPS_ !== 'undefined' ? MIGRATION_STEPS_ : []).filter(function (m) { return m.id === k; })[0];
    upgradeAdd_('MIGRATION', k, 'Bước chuyển dữ liệu ' + k + ' chạy lần đầu' + (st ? ': ' + st.label : ''), 'Data migration ' + k + ' ran for the first time' + (st ? ': ' + st.label : ''));
  });
}
/**
 * Ghi bền số đo của lượt này (một lệnh ghi Script Properties; không ghi nếu không có gì mới, trừ force). Gọi cuối mỗi bước của setupCore_ và TRƯỚC khi
 * ghi những thay đổi mà lượt sau sẽ không đo lại được (ghi trước khi làm). Không làm gì với file mới tinh, và khi phiên bản đã được niêm phong ở lượt trước.
 * Lỗi ghi chỉ ghi log, không làm hỏng menu 1.
 */
function releasePersist_(force) {
  var R = UPGRADE_RUN_;
  if (!R || R.fresh || R.last === APP.VERSION || (!R.dirty && !force)) return false;
  try {
    releaseMigMeasure_();
    var rec = R.rec && !R.rec.sealed ? R.rec : releaseEmptyRecord_();
    rec.sealed = false; rec.mig0 = R.migBefore; rec.carried = R.carried;
    rec.items = R.items.filter(function (x) { return RELEASE_STATE_KINDS_.indexOf(x.kind) === -1; });
    releasePendingWrite_(rec); R.rec = rec; R.dirty = false; R.writes++;
    return true;
  } catch (e) { try { Logger.log('Không lưu được số đo cập nhật: ' + e.message); } catch (x) { } return false; }
}
/** Tên cũ (soát R1): lưu số đo khi sao lưu hỏng. Nay là một lần ghi bền như mọi bước khác. */
function releasePendingSave_() { return releasePersist_(true); }
/** Khoá CONFIG lạ: có trong tab mà code không còn dùng. Chỉ báo, không bao giờ xoá. Trả danh sách khoá. */
function upgradeUnknownConfig_(rows) {
  var out = [];
  rows.forEach(function (r) {
    var k = cfgKeyNorm_(r.key);
    if (!k || k in DEFAULTS_) return;
    var dep = /^Không dùng từ/.test(String(r.note || ''));
    upgradeAdd_('CONFIG_UNKNOWN', k, 'Khoá "' + k + '" có trong CONFIG nhưng code không dùng' + (dep ? ' (cột note đã ghi không dùng nữa)' : ' (khoá bạn tự thêm hoặc khoá đã bỏ)') + '; giá trị giữ nguyên, hệ thống không xoá.',
      'Key "' + k + '" is in CONFIG but the code does not use it' + (dep ? ' (the note column already says it is unused)' : ' (a key you added or one that was removed)') + '; its value is kept, the system never deletes it.');
    out.push(k);
  });
  return out;
}

function releaseItems_(items, kind) { return items.filter(function (x) { return x.kind === kind; }).map(function (x) { return x.item; }); }
function releaseShort_(list, max) { max = max || 8; return list.slice(0, max).join(', ') + (list.length > max ? ' (+' + (list.length - max) + ')' : ''); }

/**
 * Hàm thuần: bản tóm tắt. Trả { notes (các bản), items (ghi chú tĩnh rồi số đo), noteItems, measured, menuLines, admin (việc cần làm, bỏ trùng) }.
 * prev trống: tất cả ghi chú. Dòng cho menu 1 gọn: số lượng cùng các mục quan trọng, trỏ tới tab RELEASE_LOG.
 */
function releaseBuildSummary_(prev, cur, curDate, measured, notes, opts) {
  opts = opts || {};
  var list = releaseNotesBetween_(prev, cur, notes), nItems = releaseNoteItems_(list), m = measured || [], all = nItems.concat(m);
  var admin = [], seen = {};
  // Việc của bản MỚI NHẤT lên đầu (bản cũ hơn xuống dưới): menu 1 chỉ hiện vài việc đầu.
  list.slice().reverse().forEach(function (n) { (n.admin || []).forEach(function (a) { if (!seen[a.vi]) { seen[a.vi] = true; admin.push(a); } }); });
  var lines = ['CẬP NHẬT PHIÊN BẢN ' + (prev || 'cũ') + ' → ' + cur + (curDate ? ' (' + curDate + ')' : '') + ': đầy đủ ở tab RELEASE_LOG (' + all.length + ' dòng) và trong email gửi ADMIN_EMAIL.'];
  if (list.length) lines.push('Thay đổi theo bản: ' + list.map(function (n) { return n.version + ' (' + n.date + ')'; }).join(', ') + '.');
  var did = [], add = function (label, kind) { var l = releaseItems_(m, kind); if (l.length) did.push(label + ' ' + l.length + ': ' + releaseShort_(l)); };
  add('thêm khoá CONFIG', 'CONFIG_ADDED'); add('chép khoá CONFIG đổi tên', 'CONFIG_RENAMED'); add('thêm tab', 'TAB_ADDED'); add('thêm cột', 'COLUMN_ADDED');
  add('thêm dòng chữ web', 'CONTENT_ADDED'); add('làm mới ô chữ web chưa sửa', 'CONTENT_REFRESHED'); add('thêm mẫu email', 'TEMPLATE_ADDED'); add('nâng mẫu email', 'TEMPLATE_UPGRADED');
  add('thêm luật thông báo', 'NOTIFY_RULE_ADDED'); add('gộp key trùng', 'DUP_MERGED'); add('chạy bước chuyển dữ liệu', 'MIGRATION'); add('điền dữ liệu', 'DATA_FILLED');
  add('cắt dấu cách thừa ở khoá CONFIG', 'CONFIG_KEY_TRIMMED');
  // Số đo cộng cả các lượt menu 1 bị ngắt trước đó (opts.carried mục): câu "không phải thêm" chỉ nói khi đúng cho CẢ đợt cập nhật, và không bao giờ khi có mục đo không lưu hết (opts.truncated).
  var scope = opts.carried ? 'Cả đợt cập nhật này (kể cả ' + opts.carried + ' mục của lượt menu 1 bị ngắt trước đó)' : 'Lượt chạy này';
  if (did.length) lines.push(scope + ' đã (đo thật): ' + did.join('; ') + '.');
  else if (!opts.truncated) lines.push(scope + ' không phải thêm khoá, cột, tab hay dòng chữ nào.');
  var kept = releaseItems_(m, 'CONTENT_KEPT');
  if (kept.length) lines.push('GIỮ chữ bạn đã sửa dù chữ gốc đã đổi (' + kept.length + ' ô): ' + releaseShort_(kept) + '. Chữ gốc mới ở cột default_vi, default_en của tab CONTENT.');
  var unk = releaseItems_(m, 'CONFIG_UNKNOWN');
  if (unk.length) lines.push('Khoá CONFIG lạ (không xoá, chỉ báo): ' + releaseShort_(unk) + '.');
  var dact = releaseItems_(m, 'DUP_ACTIVE'), dskip = releaseItems_(m, 'DUP_SKIPPED');
  if (dact.length) lines.push('CHÚ Ý: ' + dact.length + ' mẫu email có các dòng trùng key nói KHÁC NHAU về ô active, đã giữ trạng thái của dòng cuối (đúng như đang gửi): ' + releaseShort_(dact) + '. Đọc dòng "CHÚ Ý QUAN TRỌNG" của từng mẫu và kiểm lại ô active.');
  if (dskip.length) lines.push('CẢNH BÁO: ' + dskip.length + ' key trùng CHƯA gộp vì sao lưu trước cập nhật hỏng: ' + releaseShort_(dskip) + '.');
  var twin = releaseItems_(m, 'CONFIG_KEY_TWIN');
  if (twin.length) lines.push('CẢNH BÁO: ' + twin.length + ' khoá CONFIG có hai dòng chỉ khác nhau ở dấu cách hoặc ký tự vô hình (không xoá, không đoán): ' + releaseShort_(twin) + '. Dòng đang có hiệu lực được nêu ở dòng cảnh báo riêng của menu 1 và ở menu 2 (thường là dòng CUỐI); xoá dòng thừa hoặc chép giá trị đúng sang dòng đang có hiệu lực.' + (m.some(function (x) { return x.kind === 'CONFIG_KEY_TWIN' && / CHÚ Ý: /.test(x.vi); }) ? ' CHÚ Ý: có khoá mà giá trị bạn nhập nhiều khả năng KHÔNG được dùng (dòng đang có hiệu lực mang giá trị mặc định hoặc trống): đọc chi tiết và cách sửa tay ở tab RELEASE_LOG.' : ''));
  if (opts.truncated) { var tr = m.filter(function (x) { return x.kind === 'MEASURED_TRUNCATED'; })[0]; lines.push(tr ? tr.vi : 'CẢNH BÁO: một phần số đo không lưu hết được.'); }
  if (admin.length) { lines.push('VIỆC ADMIN CẦN LÀM:'); admin.slice(0, 6).forEach(function (a, i) { lines.push('  ' + (i + 1) + '. ' + a.vi); }); if (admin.length > 6) lines.push('  (còn ' + (admin.length - 6) + ' việc nữa, xem tab RELEASE_LOG)'); }
  return { notes: list, items: all, noteItems: nItems, measured: m, menuLines: lines, admin: admin };
}

var RELEASE_MEASURED_LABEL_ = {
  CONFIG_ADDED: ['Khoá CONFIG thêm', 'CONFIG keys added'], CONFIG_RENAMED: ['Khoá CONFIG chép từ tên cũ', 'CONFIG keys copied from the old name'], CONFIG_UNKNOWN: ['Khoá CONFIG lạ (giữ nguyên, không xoá)', 'Unknown CONFIG keys (kept, never deleted)'],
  TAB_ADDED: ['Tab thêm', 'Tabs added'], COLUMN_ADDED: ['Cột thêm', 'Columns added'], CONTENT_ADDED: ['Dòng chữ web thêm', 'Web text rows added'],
  CONTENT_REFRESHED: ['Ô chữ web chưa sửa, đã nâng lên chữ gốc mới', 'Unedited web text cells upgraded to the new default'], CONTENT_KEPT: ['Ô chữ web bạn đã sửa, GIỮ dù chữ gốc đổi', 'Web text cells you edited, KEPT although the default changed'],
  TEMPLATE_ADDED: ['Mẫu email thêm', 'Email templates added'], TEMPLATE_UPGRADED: ['Mẫu email nâng lên chữ gốc mới', 'Email templates upgraded to the new default'], NOTIFY_RULE_ADDED: ['Luật thông báo thêm', 'Notification rules added'],
  DUP_MERGED: ['Key trùng đã gộp', 'Duplicate keys merged'],
  CONFIG_KEY_TRIMMED: ['Khoá CONFIG có dấu cách thừa, đã cắt gọn (giá trị giữ nguyên)', 'CONFIG keys with stray whitespace, trimmed (value kept)'],
  CONFIG_KEY_TWIN: ['Khoá CONFIG có hai dòng chỉ khác dấu cách hoặc ký tự vô hình (không xoá, dùng dòng cuối có khoá sạch)', 'CONFIG keys with two rows differing only by whitespace or invisible characters (kept, the last row with a clean key wins)'],
  MEASURED_TRUNCATED: ['Số đo KHÔNG lưu hết được', 'Measured items NOT stored in full'],
  DUP_ACTIVE: ['Mẫu email có ô active mâu thuẫn giữa các dòng trùng (đã giữ trạng thái của dòng cuối, đúng như đang gửi)', 'Email templates whose duplicate rows disagreed about active (kept the last row state, exactly what was being sent)'],
  DUP_SKIPPED: ['Key trùng KHÔNG gộp (sao lưu trước cập nhật hỏng)', 'Duplicate keys NOT merged (pre-upgrade backup failed)'], MIGRATION: ['Bước chuyển dữ liệu chạy', 'Data migrations run'], DATA_FILLED: ['Dữ liệu điền thêm', 'Data filled in']
};

/** Hàm thuần: HTML cho email, một ngôn ngữ ('vi' hoặc 'en'). Chữ được thoát; code dựng danh sách. */
function releaseSummaryHtml_(sum, lang) {
  var en = lang === 'en', out = '';
  sum.notes.forEach(function (n) {
    out += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc_((en ? 'Version ' : 'Bản ') + n.version + ' · ' + n.date) + '</h3>';
    var its = releaseNoteItems_([n]);
    RELEASE_GROUPS_.forEach(function (g) {
      var l = its.filter(function (x) { return x.kind === g[1]; });
      if (!l.length) return;
      out += '<div style="margin:8px 0 2px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#63635d">' + esc_(en ? g[3] : g[2]) + '</div><ul style="margin:0 0 6px;padding-left:20px">' +
        l.map(function (x) { return '<li style="margin:3px 0">' + (x.item.indexOf(' · ') !== -1 ? '<b>' + esc_(x.item.split(' · ')[1]) + '</b>: ' : '') + esc_(en ? x.en : x.vi) + '</li>'; }).join('') + '</ul>';
    });
  });
  var m = sum.measured;
  out += '<h3 style="margin:22px 0 6px;font-size:16px">' + esc_(en ? 'What this run actually did (measured)' : 'Lượt chạy này thực sự đã làm (đo thật)') + '</h3>';
  // Việc cần admin đọc kỹ: nổi bật, mỗi việc một khối, không chôn trong danh sách.
  m.filter(function (x) { return x.kind === 'DUP_ACTIVE' || x.kind === 'DUP_SKIPPED' || x.kind === 'CONFIG_KEY_TWIN' || x.kind === 'MEASURED_TRUNCATED'; }).forEach(function (x) {
    out += '<p style="margin:8px 0;padding:8px 12px;border-left:4px solid #b00020;background:#fff4f4"><b>' + esc_(en ? 'Needs your attention' : 'Cần bạn xem') + ':</b> ' + esc_(en ? x.en : x.vi) + '</p>';
  });
  if (!m.length) out += '<p style="margin:0">' + esc_(en ? 'Nothing to add: keys, columns, tabs and texts were already in place.' : 'Không phải thêm gì: khoá, cột, tab, chữ đã có sẵn.') + '</p>';
  else {
    var kinds = []; m.forEach(function (x) { if (kinds.indexOf(x.kind) === -1) kinds.push(x.kind); });
    out += '<ul style="margin:0;padding-left:20px">' + kinds.map(function (k) {
      var l = m.filter(function (x) { return x.kind === k; });
      return '<li style="margin:3px 0"><b>' + esc_(RELEASE_MEASURED_LABEL_[k] ? RELEASE_MEASURED_LABEL_[k][en ? 1 : 0] : k) + ' (' + l.length + ')</b>: ' +
        esc_(l.slice(0, 12).map(function (x) { return x.item; }).join(', ') + (l.length > 12 ? ' (+' + (l.length - 12) + ')' : '')) + '</li>';
    }).join('') + '</ul>';
  }
  return out;
}

/** Ghi RELEASE_LOG (chỉ ghi thêm, appendRowsRaw_ theo luật 45). at (không bắt buộc): thời điểm ghi nhận bản tóm tắt (giữ nguyên khi thử lại). Trả số dòng ghi. */
function releaseLogWrite_(prev, cur, items, at) {
  at = at || getNow_();
  var rows = items.slice(0, RELEASE_LOG_MAX_ROWS_).map(function (x) { return { at: at, from_version: prev || '', to_version: cur, kind: x.kind, item: x.item, detail: x.vi }; });
  if (items.length > RELEASE_LOG_MAX_ROWS_) rows.push({ at: at, from_version: prev || '', to_version: cur, kind: 'TRUNCATED', item: String(items.length - RELEASE_LOG_MAX_ROWS_), detail: 'Còn ' + (items.length - RELEASE_LOG_MAX_ROWS_) + ' mục nữa không ghi (quá ' + RELEASE_LOG_MAX_ROWS_ + ' dòng).' });
  return withLock_(function () { return appendRowsRaw_('RELEASE_LOG', rows); });
}

/** Hàm thuần: độ dài UTF-8 (byte) của chữ. Script Properties giới hạn 9 KB mỗi giá trị theo BYTE, chữ Việt có dấu mỗi ký tự 2 đến 3 byte. */
function utf8Len_(str) {
  var s = String(str), n = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c < 0x80) n += 1; else if (c < 0x800) n += 2; else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) { n += 4; i++; } else n += 3;
  }
  return n;
}

// ── Bản ghi giao tóm tắt (soát X2: FIX A, FIX B) ──
// Script Property RELEASE_PENDING = JSON { v, target (phiên bản đích), from, date, at (ms, mốc ghi nhận), who, sealed, mig0, carried, legs, tries, trunc, parts, items }.
//   sealed false: số đo của lượt menu 1 chưa ghi nhận được phiên bản (bị cắt giữa chừng hay sao lưu hỏng); true: phiên bản đã ghi nhận, đang giao.
//   legs: trạng thái từng đường { act: nhật ký RELEASE, log: tab RELEASE_LOG, notif: thông báo, mail: email }: 0 chưa xong, 1 xong, 2 không cần (luật hay mẫu tắt email), 3 bỏ cuộc.
//   tries: số lần LỖI THẬT của từng đường (khoá bận không tính). items: các mục đo; phần quá 8.000 byte chuyển sang RELEASE_PENDING_1, _2, ... (mỗi giá trị một mảng JSON).
//   trunc: số mục đo KHÔNG lưu hết được (quá RELEASE_ITEMS_MAX_ hoặc quá RELEASE_PENDING_MAX_PARTS_ phần): luôn được báo cho admin, không bao giờ im lặng.
/** Cỡ tối đa (byte UTF-8) của MỘT giá trị Script Property của bản ghi: giới hạn thật 9.216 byte (tính cả tên khoá), chừa dư cho sai lệch cách đếm. */
var RELEASE_PENDING_MAX_BYTES_ = 8000;
var RELEASE_PENDING_MAX_PARTS_ = 12;   // soát X2 L2: 12 x 8.000 byte = 96 KB, chừa chỗ cho hàng chờ nhật ký LOGQ_ và các khoá khác trong kho 500 KB
var RELEASE_ITEMS_MAX_ = 400;   // bằng RELEASE_LOG_MAX_ROWS_: quá số này RELEASE_LOG cũng không ghi hết
var RELEASE_MAIL_MAX_TRIES_ = 5;
var RELEASE_LEG_MAX_FAILS_ = 5;
var RELEASE_PARTS_SEEN_ = null;

function releaseEmptyRecord_() {
  return { v: 2, target: APP.VERSION, from: '', date: APP.VERSION_DATE, at: 0, who: '', sealed: false, mig0: null, carried: 0, legs: { act: 0, log: 0, notif: 0, mail: 0, mlog: 1 }, tries: {}, trunc: 0, items: [], mailLog: null };
}
/** Thu một mục cho vừa cap byte (chỉ khi mục đơn lẻ quá lớn): rút ngắn chữ vi, en, item. */
function releaseFitItem_(x, cap) {
  var o = { kind: x.kind, item: x.item, vi: x.vi, en: x.en }, guard = 0;
  while (utf8Len_(JSON.stringify(o)) > cap && guard++ < 60) {
    var f = ['vi', 'en', 'item'].filter(function (c) { return o[c].length > 40; }).sort(function (a, b) { return o[b].length - o[a].length; })[0];
    if (!f) break;
    o[f] = o[f].substring(0, Math.max(40, Math.floor(o[f].length * 0.7)));
  }
  return o;
}
/** Hàm thuần: bản ghi → { RELEASE_PENDING: chữ, RELEASE_PENDING_1: chữ, ... }, mỗi giá trị dưới RELEASE_PENDING_MAX_BYTES_ byte. */
function releasePack_(rec) {
  var cap = RELEASE_PENDING_MAX_BYTES_, trunc = Number(rec.trunc) || 0, items = rec.items;
  var head = function (first, parts, tr) { return JSON.stringify({ v: 2, target: rec.target, from: rec.from, date: rec.date, at: rec.at, who: rec.who, sealed: !!rec.sealed, mig0: rec.mig0, carried: rec.carried, legs: rec.legs, tries: rec.tries, mailLog: rec.mailLog || undefined, trunc: tr, parts: parts, items: first }); };
  var capOf = function (g) { return g === 0 ? cap - utf8Len_(head([], RELEASE_PENDING_MAX_PARTS_, trunc + RELEASE_ITEMS_MAX_ * 2)) - 2 : cap - 2; };
  var groups = [[]], used = 0, g = 0, full = false;
  items.forEach(function (x) {
    if (full) { trunc++; return; }   // hết chỗ: bỏ phần đuôi, đếm vào trunc (báo cho admin)
    var fit = releaseFitItem_(x, Math.max(capOf(g), 300)), b = utf8Len_(JSON.stringify(fit)) + 1;
    if (used + b > capOf(g) && groups[g].length) {
      if (g + 1 >= RELEASE_PENDING_MAX_PARTS_) { full = true; trunc++; return; }
      g++; used = 0; groups.push([]);
    }
    groups[g].push(fit); used += b;
  });
  var out = {}; out.RELEASE_PENDING = head(groups[0], groups.length, trunc);
  for (var i = 1; i < groups.length; i++) out['RELEASE_PENDING_' + i] = JSON.stringify(groups[i]);
  return out;
}
/** Ghi bản ghi bằng MỘT lệnh setProperties (kèm extra, ví dụ dấu phiên bản APP_VERSION_LAST: cùng một lệnh nên không bao giờ có phiên bản đã ghi mà thiếu bản tóm tắt). */
function releasePendingWrite_(rec, extra) {
  var props = props_(), texts = releasePack_(rec), n = Object.keys(texts).length, obj = {};
  Object.keys(texts).forEach(function (k) { obj[k] = texts[k]; });
  if (extra) Object.keys(extra).forEach(function (k) { obj[k] = extra[k]; });
  props.setProperties(obj);
  for (var i = n; RELEASE_PARTS_SEEN_ && i < RELEASE_PARTS_SEEN_; i++) props.deleteProperty('RELEASE_PENDING_' + i);   // phần cũ thừa (bản ghi ngắn lại)
  RELEASE_PARTS_SEEN_ = n;
}
/** Đọc bản ghi (ghép lại mọi phần). Không có hoặc hỏng: null. Bản ghi dạng cũ { target, items } đọc như chưa niêm phong. */
function releasePendingRead_() {
  var props = props_(), raw = props.getProperty('RELEASE_PENDING'), o = null;
  if (!raw) { RELEASE_PARTS_SEEN_ = 0; return null; }
  try { o = JSON.parse(raw); } catch (e) { o = null; }
  if (!o || typeof o !== 'object' || !o.target) { RELEASE_PARTS_SEEN_ = 1; releasePendingClear_(true); return null; }
  var rec = releaseEmptyRecord_(), isItem = function (x) { return x && typeof x === 'object' && typeof x.kind === 'string'; };
  rec.target = String(o.target); rec.from = o.from === undefined || o.from === null ? '' : String(o.from); rec.date = o.date || ''; rec.at = Number(o.at) || 0; rec.who = o.who || '';
  rec.sealed = !!o.sealed; rec.mig0 = Array.isArray(o.mig0) ? o.mig0 : null; rec.carried = Number(o.carried) || 0; rec.trunc = Number(o.trunc) || 0;
  rec.legs = Object.assign(rec.legs, o.legs || {}); rec.mailLog = o.mailLog && typeof o.mailLog === 'object' ? o.mailLog : null; rec.tries = o.tries && typeof o.tries === 'object' ? o.tries : {};
  rec.items = (Array.isArray(o.items) ? o.items : []).filter(isItem).map(function (x) { return { kind: x.kind, item: String(x.item || ''), vi: String(x.vi || ''), en: String(x.en === undefined ? x.vi || '' : x.en) }; });
  var parts = Math.max(1, Number(o.parts) || 1);
  for (var i = 1; i < parts; i++) {
    var arr = null; try { arr = JSON.parse(props.getProperty('RELEASE_PENDING_' + i)); } catch (e) { arr = null; }
    if (Array.isArray(arr)) rec.items = rec.items.concat(arr.filter(isItem)); else rec.lostParts = (rec.lostParts || 0) + 1;
  }
  RELEASE_PARTS_SEEN_ = parts;
  return rec;
}
/** Xoá bản ghi và mọi phần phụ. scan: quét Script Properties tìm phần phụ mồ côi (bản ghi bỏ đi có thể không còn tiêu đề đúng). */
function releasePendingClear_(scan) {
  var props = props_(), n = RELEASE_PARTS_SEEN_ === null ? 0 : RELEASE_PARTS_SEEN_;
  props.deleteProperty('RELEASE_PENDING');
  for (var i = 1; i < n; i++) props.deleteProperty('RELEASE_PENDING_' + i);
  if (scan) Object.keys(props.getProperties()).forEach(function (k) { if (/^RELEASE_PENDING_\d+$/.test(k)) props.deleteProperty(k); });
  RELEASE_PARTS_SEEN_ = 0;
}
/** Niêm phong số đo của lượt này thành bản ghi giao (chưa ghi). Quá RELEASE_ITEMS_MAX_ mục thì giữ việc đã làm, bỏ bớt trạng thái (khoá lạ) trước, ghi số mục bỏ vào trunc. */
function releaseSealRecord_(last, who) {
  var R = UPGRADE_RUN_, rec = releaseEmptyRecord_(), isState = function (x) { return RELEASE_STATE_KINDS_.indexOf(x.kind) !== -1; };
  var items = R.items.filter(function (x) { return !isState(x); }).concat(R.items.filter(isState));
  rec.sealed = true; rec.from = last || ''; rec.who = who || ''; rec.at = getNow_().getTime(); rec.mig0 = R.migBefore; rec.carried = R.carried;
  rec.trunc = (R.rec && R.rec.trunc) || 0;
  if (items.length > RELEASE_ITEMS_MAX_) { rec.trunc += items.length - RELEASE_ITEMS_MAX_; items = items.slice(0, RELEASE_ITEMS_MAX_); }
  rec.items = items;
  return rec;
}
/** Hàm thuần-ish: tóm tắt dựng lại hoàn toàn từ bản ghi (ghi chú tĩnh từ RELEASE_NOTES_ theo bản trước và bản đích, cộng số đo đã lưu). */
function releaseSummaryOfRec_(rec) {
  var m = rec.items.slice(), lost = (Number(rec.trunc) || 0) + (rec.lostParts ? 1 : 0);
  if (lost) m.unshift({ kind: 'MEASURED_TRUNCATED', item: String(rec.trunc || '?'),
    vi: 'CẢNH BÁO: ' + (rec.trunc ? rec.trunc + ' mục đo' : 'một phần số đo') + ' KHÔNG lưu hết được (quá nhiều mục hoặc hết chỗ trong Script Properties) nên không có trong bản tóm tắt này. Dữ liệu vẫn đúng; đối chiếu bằng ACTIVITY_LOG (SETUP_RUN) và các tab CONFIG, CONTENT, EMAIL_TEMPLATES.',
    en: 'WARNING: ' + (rec.trunc ? rec.trunc + ' measured items' : 'part of the measured items') + ' could NOT be stored in full (too many items or Script Properties space) so they are not in this summary. The data is correct; compare with ACTIVITY_LOG (SETUP_RUN) and the CONFIG, CONTENT, EMAIL_TEMPLATES tabs.' });
  return releaseBuildSummary_(rec.from, rec.target, rec.date, m, null, { carried: rec.carried || 0, truncated: lost });
}

/** MỘT thông báo trung thực cho admin (sự kiện MAIL_FAILED, kênh theo NOTIFY_RULES): tóm tắt cập nhật không giao đủ hoặc không rõ đã gửi email chưa. Không bao giờ ném lỗi. */
function releaseNotice_(target, vi, en) {
  try { notify_('MAIL_FAILED', { actor: 'SYSTEM', entity: 'RELEASE', entity_id: target, link: rowLink_('RELEASE_LOG'), message: vi, message_en: en }); } catch (x) { }
}

/**
 * Lần thử lại: dòng nhật ký RELEASE của bản này đã nằm trong ACTIVITY_LOG chưa (lượt trước ghi xong rồi bị cắt trước khi đánh dấu)? Chỉ đọc 300 dòng CUỐI (dòng nhật ký chỉ ghi thêm
 * ở cuối), không đọc cả tab. Tìm theo hành động RELEASE, bản đích, giờ >= mốc ghi nhận của bản ghi (bản nâng cấp trước cùng số bản có giờ cũ hơn nên không nhầm).
 */
function releaseActSeen_(rec, atSec) {
  var sh = dbSpreadsheet_().getSheetByName('ACTIVITY_LOG'), last = sh ? sh.getLastRow() : 0;
  if (last < 2) return false;
  var width = sh.getLastColumn(), hdr = sh.getRange(1, 1, 1, width).getValues()[0].map(String), ia = hdr.indexOf('action'), ie = hdr.indexOf('entity_id'), it = hdr.indexOf('time');
  if (ia < 0 || ie < 0 || it < 0) return false;
  var n = Math.min(300, last - 1), vals = sh.getRange(last - n + 1, 1, n, width).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][ia]) === 'RELEASE' && String(vals[i][ie]) === rec.target && Math.floor(new Date(vals[i][it]).getTime() / 1000) >= atSec) return true;
  }
  return false;
}

/*
 * CỬA SỔ CÒN LẠI CỦA ĐƯỜNG GIAO (cố ý; đo bằng ma trận cắt tại MỌI cuộc gọi dịch vụ Google, test I197, I198, và xen kẽ hai lượt chạy ở MỌI lần lấy khoá, test I210, I199):
 *  1. KHÔNG EMAIL + MỘT THÔNG BÁO TRUNG THỰC. Lượt chạy nhận việc gửi (dấu mail = 4, ghi bền trong khoá) rồi bị cắt trước khi Google nhận thư; hoặc hai lượt chạy cùng lúc
 *     và lượt sau thấy dấu 4. Lượt sau KHÔNG gửi lại (không bao giờ hai email) mà bỏ đường email và báo MỘT thông báo MAIL_FAILED nói thật: email có thể đã hoặc chưa gửi,
 *     tóm tắt nằm ở tab RELEASE_LOG. Cửa sổ chỉ gồm các cuộc gọi từ lúc nhận tới lúc Google nhận thư (nhả khoá: SpreadsheetApp.flush, releaseLock, hai cặp ghi số đo khoá).
 *     Đo: 9 điểm cắt liền nhau mỗi ma trận. Hai lượt cùng lúc có thể báo thông báo đó dù email của lượt kia đã đi (quyết định: không dùng hạn thuê theo giờ).
 *  2. THỪA MỘT DÒNG MAIL_LOG. Bị cắt giữa lúc ghi dòng MAIL_LOG (đường mlog) và lúc đánh dấu đường đó: lượt sau ghi lại dòng (chỉ dùng để đếm hạn mức email trong ngày). Đo: 3 điểm.
 *  3. THỪA MỘT DÒNG NHẬT KÝ RELEASE chỉ khi sau lần ghi dở có hơn 300 dòng nhật ký khác được ghi trước khi lượt sau chạy (lượt sau chỉ đọc 300 dòng cuối để nhận ra dòng đã ghi).
 *     Ma trận cắt: 0 điểm.
 *  4. EMAIL ĐÃ ĐI NHƯNG CÓ MỘT THÔNG BÁO "CÓ THỂ ĐÃ HOẶC CHƯA GỬI" VÀ KHÔNG BAO GIỜ CÓ DÒNG MAIL_LOG. Bị cắt ngay SAU khi Google nhận thư, trước khi bản ghi kịp ghi mail = 1 (đọc lại bản ghi,
 *     ghi trạng thái): lượt sau thấy dấu 4, không gửi lại, báo thông báo ở mục 1; dòng MAIL_LOG của email đó không còn ai ghi (chỉ ảnh hưởng số đếm hạn mức trong ngày). Đo: 4 điểm liền nhau.
 * Mọi điểm cắt khác: đúng một thông báo, đúng một dòng RELEASE, đúng một email, RELEASE_LOG đủ và không trùng. Hai lượt chạy xen kẽ ở bất kỳ lần lấy khoá nào: mỗi đường làm đồng bộ lại
 * bản ghi TRONG khoá (sync), nên lượt đến sau thấy việc đã làm (hoặc bản ghi đã xoá: gone) và không làm lại.
 */
var RELEASE_LEG_NAME_ = { act: 'nhật ký RELEASE (ACTIVITY_LOG)', log: 'tab RELEASE_LOG', notif: 'thông báo RELEASE_NOTES', mail: 'email ADMIN_RELEASE_NOTES', mlog: 'dòng MAIL_LOG của email' };

/**
 * Giao các đường còn chưa xong của một bản ghi đã niêm phong. check: đây là lần thử lại (đường nào đã làm xong mà chưa kịp đánh dấu thì nhận ra, không làm lại:
 * RELEASE_LOG tìm theo mốc ghi nhận, thông báo tìm theo sự kiện, bản và mốc). durable false: không có bản ghi bền (không lưu được), không ghi trạng thái.
 * Mỗi đường lỗi chỉ thành một dòng báo, không ném lỗi (luật 27, 39). Khoá bận không tính là lần lỗi và dừng các đường cần khoá còn lại (khỏi chờ 30 giây nhiều lần).
 * Email: tối đa RELEASE_MAIL_MAX_TRIES_ lần lỗi, rồi MỘT thông báo MAIL_FAILED (kênh theo NOTIFY_RULES) chỉ chỗ đọc tóm tắt; không email admin mỗi giờ.
 * Bản ghi chỉ bị xoá khi mọi đường đã xong, không cần, hoặc bỏ cuộc. Trả { lines (cho menu 1), finished }.
 */
function releaseLegs_(rec, check, durable) {
  var L = rec.legs, T = rec.tries = rec.tries || {}, out = [], stop = false, sum = null, gone = false;
  var isBusy = function (e) { return String((e && e.message) || e) === BUSY_MESSAGE_; };
  var save = function () { if (durable === false || gone) return; try { releasePendingWrite_(rec); } catch (e) { try { Logger.log('Không lưu được trạng thái giao tóm tắt: ' + e.message); } catch (x) { } } };
  // Lỗi thật (không phải khoá bận): đếm; đủ số lần thì bỏ cuộc (3) và báo admin một lần.
  var fail = function (leg, e, max) {
    if (isBusy(e)) { stop = true; return 'busy'; }
    T[leg] = (T[leg] || 0) + 1;
    if (T[leg] >= max) {
      L[leg] = 3;
      if (leg !== 'mail') { try { mailAdminError_('Tóm tắt cập nhật bản ' + rec.target + ': bỏ cuộc đường ' + RELEASE_LEG_NAME_[leg], 'Sau ' + T[leg] + ' lần lỗi. Lỗi cuối: ' + String((e && e.message) || e)); } catch (x) { } }
      return 'gaveup';
    }
    return 'retry';
  };
  try { sum = releaseSummaryOfRec_(rec); }
  catch (e) {
    T.build = (T.build || 0) + 1;
    if (T.build >= RELEASE_LEG_MAX_FAILS_) {
      if (durable !== false) releasePendingClear_();
      try { mailAdminError_('Tóm tắt cập nhật bản ' + rec.target + ': không dựng được', String((e && e.stack) || e)); } catch (x) { }
      return { lines: ['LƯU Ý: không dựng được tóm tắt cập nhật (' + e.message + ') sau ' + T.build + ' lần; đã bỏ cuộc và báo admin. Đọc ghi chú phát hành ở menu "Phát hành: xem thay đổi của bản này".'], finished: true };
    }
    save();
    return { lines: ['LƯU Ý: chưa lập được tóm tắt cập nhật (' + e.message + '). Bản ghi được giữ lại và sẽ thử lại (lần ' + T.build + '/' + RELEASE_LEG_MAX_FAILS_ + ').'], finished: false };
  }
  var atMs = rec.at || getNow_().getTime(), sec = function (d) { return Math.floor(new Date(d).getTime() / 1000); };

  var find = function () { try { return table_('NOTIFICATIONS').filter(function (n) { return n.event === 'RELEASE_NOTES' && String(n.entity_id) === rec.target && sec(n.time) >= sec(atMs); })[0] || null; } catch (x) { return null; } };
  var allDone = function () { return L.act !== 0 && L.log !== 0 && L.notif !== 0 && L.mail !== 0 && L.mlog !== 0; };
  // Bản ghi đã bị một lượt chạy khác giao xong và xoá (hoặc thay bằng bản của lần nâng cấp khác): gone. Từ đó lượt này KHÔNG ghi gì (save, finish không làm gì) để không bao giờ
  // làm sống lại bản ghi đã xoá (soát X2 vòng 4: lượt khác chạy giữa lúc niêm phong và lúc nhận gửi email làm hai email, hai thông báo).
  var finish = function () { if (gone) return; if (allDone() && durable !== false) releasePendingClear_(); else save(); };
  /**
   * Chạy TRONG khoá của từng đường: đọc lại bản ghi đang lưu. Không còn, hoặc đích hay mốc ghi nhận khác (bản ghi của lần nâng cấp khác): gone, dừng, không ghi gì.
   * Còn: chép sang bộ nhớ mọi đường mà bản ghi đã đánh dấu khác 0 (lượt khác đã làm), rồi trả true nếu đường leg vẫn còn phải làm.
   */
  var sync = function (leg) {
    if (durable === false) return L[leg] === 0;
    var cur = releasePendingRead_();
    if (!cur || cur.target !== rec.target || Number(cur.at) !== Number(rec.at)) { gone = true; stop = true; return false; }
    Object.keys(cur.legs).forEach(function (k) { if (L[k] === 0 && cur.legs[k] !== 0) L[k] = cur.legs[k]; });
    if (L.mlog === 0 && !rec.mailLog && cur.mailLog) rec.mailLog = cur.mailLog;
    return L[leg] === 0;
  };
  // Trong khoá của job mỗi giờ, dòng ghi (logAppend_, DbTable.insert) chỉ xuống Sheets khi job nhả khoá: phải ghi xuống TRƯỚC khi đánh dấu đường đã xong.
  var land = function () { if (DB_LOCK_DEPTH_) { flushDb_(); SpreadsheetApp.flush(); } };
  // Dòng MAIL_LOG của email đã gửi: ghi qua bản ghi bền (đường mlog), KHÔNG bao giờ làm email đã gửi thành "lỗi" khi khoá bận; lần sau ghi nốt. Ghi dòng rồi đánh dấu (trong cùng một khoá):
  // bị cắt giữa hai việc thì có thể thừa một dòng MAIL_LOG (chỉ để đếm hạn mức). Lỗi thật được ghi log và đếm (bỏ cuộc sau RELEASE_LEG_MAX_FAILS_ lần, state 3).
  var mlogWrite = function () {
    if (L.mlog !== 0 || gone) return;
    if (!rec.mailLog) { L.mlog = 1; return; }
    try { withLock_(function () { if (!sync('mlog')) return; var m = rec.mailLog; logAppend_('MAIL_LOG', { time: new Date(m.time), to: m.to, subject: m.subject, kind: m.kind, transport: m.transport }); land(); L.mlog = 1; rec.mailLog = null; save(); }); }
    catch (e) { if (!isBusy(e)) { try { Logger.log('Không ghi được dòng MAIL_LOG của email tóm tắt: ' + e.message); } catch (x) { } } fail('mlog', e, RELEASE_LEG_MAX_FAILS_); save(); }
  };
  // 1. Nhật ký RELEASE (ACTIVITY_LOG): đồng bộ, ghi, xuống Sheets, đánh dấu, tất cả trong MỘT khoá.
  if (L.act === 0 && !stop) {
    try { withLock_(function () { if (!sync('act')) return; if (!(check && releaseActSeen_(rec, sec(atMs)))) { logActivity_(rec.who || 'SYSTEM', 'RELEASE', 'SYSTEM', rec.target, JSON.stringify({ from: rec.from || '' })); land(); } L.act = 1; save(); }); }
    catch (e) { var r1 = fail('act', e, RELEASE_LEG_MAX_FAILS_); out.push(r1 === 'busy' ? 'CHƯA ghi được nhật ký RELEASE (hệ thống đang bận); sẽ tự làm lại ở menu 1 lần sau hoặc job mỗi giờ.' : 'CHƯA ghi được nhật ký RELEASE (' + e.message + ')' + (r1 === 'gaveup' ? '; đã bỏ cuộc.' : '; sẽ tự thử lại.')); save(); }
  }
  // 2. Tab RELEASE_LOG
  if (L.log === 0 && !stop) {
    try {
      var logged = withLock_(function () {
        if (!sync('log')) return null;
        if (check) {
          var have = table_('RELEASE_LOG').filter(function (r) { return String(r.to_version) === rec.target && sec(r.at) === sec(atMs); }).length;
          if (have) { L.log = 1; save(); return { rows: have, already: true }; }
        }
        var n = releaseLogWrite_(rec.from, rec.target, sum.items, new Date(atMs)); L.log = 1; save();
        return { rows: n, already: false };
      });
      if (logged) out.push(logged.already ? 'Tab RELEASE_LOG đã có ' + logged.rows + ' dòng của bản này (ghi ở lần trước, không ghi trùng).' : 'Đã ghi ' + logged.rows + ' dòng vào tab RELEASE_LOG.');
    } catch (e) { var r2 = fail('log', e, RELEASE_LEG_MAX_FAILS_); out.push(r2 === 'busy' ? 'CHƯA ghi được tab RELEASE_LOG (hệ thống đang bận). Tóm tắt đã được giữ lại an toàn; menu 1 lần sau và job mỗi giờ sẽ tự ghi tiếp (không ghi trùng).' : 'CHƯA ghi được tab RELEASE_LOG (' + e.message + ')' + (r2 === 'gaveup' ? '; đã bỏ cuộc sau ' + T.log + ' lần và báo admin.' : '; sẽ tự thử lại.')); save(); }
  }
  // 3. Thông báo RELEASE_NOTES (chỉ ghi dòng NOTIFICATIONS; email là đường riêng bên dưới): notify_ gọi TRONG khoá đã đồng bộ, xuống Sheets, rồi đánh dấu.
  if (L.notif === 0 && !stop) {
    try {
      withLock_(function () {
        if (!sync('notif')) return;
        var row = check ? find() : null;
        if (!row) {
          var nVi = 'Đã cập nhật từ ' + (rec.from || 'bản cũ') + ' lên ' + rec.target + ' (' + rec.date + '): ' + sum.notes.length + ' bản, ' + sum.measured.length + ' việc đo được ở lượt chạy này. Xem tab RELEASE_LOG.';
          var nEn = 'Updated from ' + (rec.from || 'an older version') + ' to ' + rec.target + ' (' + rec.date + '): ' + sum.notes.length + ' versions, ' + sum.measured.length + ' items measured in this run. See the RELEASE_LOG tab.';
          row = notify_('RELEASE_NOTES', { actor: 'SYSTEM', entity: 'RELEASE', entity_id: rec.target, message: nVi, message_en: nEn, link: rowLink_('RELEASE_LOG') }, function () { return false; });
        }
        if (!row) throw new Error('không ghi được dòng NOTIFICATIONS');
        land(); L.notif = 1; save(); out.push('Đã tạo thông báo RELEASE_NOTES (tab NOTIFICATIONS).');
      });
    } catch (e) {
      var r3b = fail('notif', e, RELEASE_LEG_MAX_FAILS_), seen = false;
      // notify_ ném lỗi sau khi đã ghi dòng (hiếm): nhận ra trong khoá đã đồng bộ, không tạo dòng thứ hai
      try { withLock_(function () { if (sync('notif') && find()) { L.notif = 1; stop = false; save(); seen = true; } }); } catch (x) { }
      if (seen) out.push('Đã tạo thông báo RELEASE_NOTES (tab NOTIFICATIONS).');
      else { out.push(r3b === 'busy' ? 'CHƯA tạo được thông báo RELEASE_NOTES (hệ thống đang bận); sẽ tự làm lại ở menu 1 lần sau hoặc job mỗi giờ.' : 'CHƯA tạo được thông báo RELEASE_NOTES (' + e.message + ')' + (r3b === 'gaveup' ? '; đã bỏ cuộc sau ' + T.notif + ' lần và báo admin.' : '; sẽ tự thử lại.')); save(); }
    }
  }
  // 4. Email ADMIN_RELEASE_NOTES (sau khi có thông báo; kênh EMAIL của luật RELEASE_NOTES quyết định có gửi không)
  var mailPending = false;
  if (L.mlog === 0 && !stop && !gone) { mlogWrite(); }
  if (L.mail === 4 && !stop && !gone) {
    // Một lượt trước đã nhận gửi email (dấu 4) rồi không báo kết quả (bị cắt, hoặc đang gửi song song): không gửi lại (không bao giờ hai email), báo một lần. Đồng bộ trong khoá trước.
    var give = false;
    try { withLock_(function () { sync('mail'); if (gone || L.mail !== 4) return; L.mail = 3; save(); give = true; }); } catch (ge) { }
    if (give) {
      releaseNotice_(rec.target, 'Email tóm tắt cập nhật bản ' + rec.target + ' có thể ĐÃ hoặc CHƯA gửi (lượt gửi bị ngắt hoặc đang gửi song song). Không gửi lại để tránh trùng. Đọc tóm tắt ở tab RELEASE_LOG.',
        'The update summary email for version ' + rec.target + ' may or may NOT have been sent (the sending run was cut or is sending in parallel). Not resent to avoid a duplicate. Read the summary in the RELEASE_LOG tab.');
      out.push('Email tóm tắt: lượt gửi trước bị ngắt hoặc đang chạy song song, không rõ đã gửi chưa; KHÔNG gửi lại (tránh trùng), đã tạo một thông báo. Đọc tóm tắt ở tab RELEASE_LOG.');
    }
  }
  if (L.mail === 0 && L.notif !== 0 && !stop && !gone) {
    var rule = null, tpl = null; try { rule = notifyRule_('RELEASE_NOTES'); } catch (x) { }
    try { tpl = emailTemplate_('ADMIN_RELEASE_NOTES'); } catch (x2) { }
    if (rule && rule.channel !== NOTIFY_CHANNEL.EMAIL) { L.mail = 2; save(); out.push('Không gửi email: luật RELEASE_NOTES ở tab NOTIFY_RULES dùng kênh ' + rule.channel + ', không phải EMAIL (thông báo vẫn nằm ở tab NOTIFICATIONS).'); }
    else if (tpl && !tpl.active) { L.mail = 2; save(); out.push('Không gửi email: mẫu ADMIN_RELEASE_NOTES đang tắt ở tab EMAIL_TEMPLATES (active).'); }
    else {
      mailPending = true;
      // Sau khi gửi (không giữ khoá): đọc lại bản ghi để không ghi đè tiến độ của lượt khác và không làm sống lại bản ghi đã xoá.
      var refresh = function () {
        if (durable === false) return;
        var cur = releasePendingRead_();
        if (!cur || cur.target !== rec.target || Number(cur.at) !== Number(rec.at)) { gone = true; return; }
        Object.keys(cur.legs).forEach(function (k) { if (k !== 'mail') L[k] = cur.legs[k]; }); rec.tries = cur.tries || {}; T = rec.tries; if (cur.mailLog && !rec.mailLog) rec.mailLog = cur.mailLog;
      };
      var sendIt = function () {
        var err = null, ok = false, col = [], called = false, veto = null, deferred = false;
        // Email gửi QUA sendTpl_ (luật 32): beforeSend chạy sau khi thư đã dựng xong, ngay trước khi gọi Google. Nhận việc gửi trong khoá (dấu 4, ghi bền TRƯỚC khi gửi), đọc lại bản ghi mới nhất:
        // hai lượt chạy cùng lúc không cùng gửi; bị cắt sau khi nhận thì lượt sau không gửi lại. Cùng mốc ghi nhận (at) mới được nhận (bản ghi sống lại hay của lần nâng cấp khác thì không).
        try {
          ok = sendTpl_('ADMIN_RELEASE_NOTES', adminEmails_().join(','), { from: rec.from || 'bản cũ', from_en: rec.from || 'an older version', to: rec.target, date: rec.date,
            summary_html: releaseSummaryHtml_(sum, 'vi'), summary_html_en: releaseSummaryHtml_(sum, 'en'), sheet_link: rowLink_('RELEASE_LOG') }, { kind: 'ADMIN_RELEASE_NOTES', collect: col, beforeSend: function () {
              called = true;
              if (durable !== false) {
                var claim = 'busy';
                try {
                  claim = withLock_(function () {
                    var cur = releasePendingRead_();
                    if (!cur || cur.target !== rec.target || Number(cur.at) !== Number(rec.at)) { gone = true; return 'taken'; }
                    if (!cur.legs || cur.legs.mail !== 0) return 'taken';
                    cur.legs.mail = 4; releasePendingWrite_(cur);
                    Object.keys(cur.legs).forEach(function (k) { L[k] = cur.legs[k]; }); rec.tries = cur.tries || {}; T = rec.tries; if (cur.mailLog && !rec.mailLog) rec.mailLog = cur.mailLog;
                    return 'mine';
                  });
                } catch (ce) { claim = isBusy(ce) ? 'busy' : 'err'; }
                if (claim !== 'mine') { veto = claim; return false; }
              }
              DEFER_ACTIVE_++; deferred = true; return true;   // MAIL_LOG và nhật ký lỗi của lần gửi gom lại (khoá bận không làm một email đã gửi thành "lỗi")
            } }) !== false;
        } catch (e) { ok = false; err = e; }
        finally { if (deferred) DEFER_ACTIVE_--; }
        if (veto === 'taken') return gone ? 'Một lượt chạy khác đã giao xong tóm tắt này; lượt này không gửi.' : 'Email tóm tắt đã được một lượt chạy khác nhận gửi; lượt này không gửi.';
        if (veto) return 'CHƯA gửi email tóm tắt (hệ thống đang bận; không tính là lần thử lỗi); menu 1 lần sau hoặc job mỗi giờ sẽ gửi.';
        if (!called && !err && !ok) { L.mail = 2; save(); return 'Không gửi email: mẫu ADMIN_RELEASE_NOTES đang tắt ở tab EMAIL_TEMPLATES (active).'; }
        refresh();
        var msg;
        if (ok) {
          L.mail = 1; if (col.length) { rec.mailLog = { time: new Date(col[0].time).getTime(), to: col[0].to, subject: col[0].subject, kind: col[0].kind, transport: col[0].transport }; L.mlog = 0; }
          save(); mlogWrite(); finish(); msg = 'Đã gửi email "Tóm tắt cập nhật" tới ADMIN_EMAIL (luật RELEASE_NOTES ở tab NOTIFY_RULES).';
          var mark = function () { var t = table_('NOTIFICATIONS'), n = find(); if (n) t.update(n, { emailed_at: getNow_() }); };
          deferWrite_(mark);
          if (!AFTER_LOCK_RUNNING_) flushDeferred_();
        } else {
          if (L.mail === 4) L.mail = 0;   // chắc chắn chưa gửi (Google từ chối hoặc không dựng được thư): trả lại việc gửi
          if (!AFTER_LOCK_RUNNING_) flushDeferred_();
          T.mail = (T.mail || 0) + 1;
          if (T.mail >= RELEASE_MAIL_MAX_TRIES_) {
            L.mail = 3; finish(); msg = 'CHƯA gửi được email tóm tắt cập nhật sau ' + T.mail + ' lần thử; đã bỏ cuộc và báo admin một lần. Đọc tóm tắt ở tab RELEASE_LOG' + (L.log === 1 ? '' : ' (chưa ghi xong, tóm tắt vẫn được giữ trong hệ thống)') + '.';
            releaseNotice_(rec.target, 'Không gửi được email tóm tắt cập nhật bản ' + rec.target + ' sau ' + T.mail + ' lần thử. Đọc tóm tắt ở tab RELEASE_LOG (và thông báo RELEASE_NOTES).',
              'Could not send the update summary email for version ' + rec.target + ' after ' + T.mail + ' attempts. Read the summary in the RELEASE_LOG tab (and the RELEASE_NOTES notification).');
          } else { save(); msg = 'CHƯA gửi được email tóm tắt cập nhật (lần thử ' + T.mail + '/' + RELEASE_MAIL_MAX_TRIES_ + (err ? ': ' + err.message : '') + '). Menu 1 lần sau và job mỗi giờ sẽ thử lại; tóm tắt đầy đủ' + (L.log === 1 ? ' đã nằm ở tab RELEASE_LOG.' : ' sẽ nằm ở tab RELEASE_LOG khi ghi xong (đang giữ trong hệ thống).'); }
        }
        return msg;
      };
      if (DB_LOCK_DEPTH_) afterLock_(sendIt);   // trong khoá (job mỗi giờ): gửi sau khi nhả khoá, luật 5; kết quả ghi vào bản ghi lúc đó
      else out.push(sendIt());
      if (DB_LOCK_DEPTH_) out.push('Email tóm tắt sẽ gửi sau khi nhả khoá.');
    }
  }
  var finished = gone || allDone();
  if (finished && !gone && durable !== false) releasePendingClear_();
  // Dòng đầu của tóm tắt: chỉ nói "đầy đủ ở RELEASE_LOG và email" khi đúng như vậy
  var head = sum.menuLines.slice();
  if (gone) { head[0] = 'CẬP NHẬT PHIÊN BẢN ' + (rec.from || 'cũ') + ' → ' + rec.target + (rec.date ? ' (' + rec.date + ')' : '') + ': một lượt chạy khác đã giao (hoặc đang giao) tóm tắt này nên lượt này không làm gì thêm; xem tab RELEASE_LOG và thông báo RELEASE_NOTES.'; }
  else if (!(L.log === 1 && L.mail === 1)) head[0] = 'CẬP NHẬT PHIÊN BẢN ' + (rec.from || 'cũ') + ' → ' + rec.target + (rec.date ? ' (' + rec.date + ')' : '') + ': ' + sum.items.length + ' mục tóm tắt; ' +
    (L.log === 1 ? 'đã ghi đầy đủ ở tab RELEASE_LOG' : 'CHƯA ghi xong vào tab RELEASE_LOG (đang giữ an toàn trong hệ thống)') + (L.mail === 1 ? ' và đã gửi email.' : (L.mail === 2 ? '; không gửi email (xem bên dưới).' : '; email CHƯA gửi (xem bên dưới).'));
  var pend = [];
  ['act', 'log', 'notif', 'mail', 'mlog'].forEach(function (k) { if (L[k] === 0) pend.push(RELEASE_LEG_NAME_[k]); });
  if (pend.length && durable !== false && !gone) out.push('CÒN DỞ (' + pend.join(', ') + '): bản ghi được giữ lại, menu 1 lần sau (cùng phiên bản) và job mỗi giờ sẽ làm nốt đúng phần còn thiếu, không làm lại phần đã xong.');
  return { lines: head.concat(out), finished: finished };
}

/** Menu 1 chạy lại cùng phiên bản: nếu bản ghi giao còn dở thì làm nốt phần thiếu (kết quả ở RELEASE_SUMMARY_LINES_). Luôn trả null (không có dòng ghi nhận mới). */
function releaseResumeFromMenu_() {
  var rec = null; try { rec = releasePendingRead_(); } catch (e) { rec = null; }
  if (rec && !rec.sealed && rec.target === APP.VERSION) { try { releasePendingClear_(true); } catch (e) { } return null; }   // phiên bản đã ghi nhận xong (lượt khác niêm phong rồi giao hết): bản ghi chưa niêm phong còn sót là rác, bỏ
  if (!rec || !rec.sealed || rec.target !== APP.VERSION) return null;
  try { RELEASE_SUMMARY_LINES_ = ['TIẾP TỤC giao tóm tắt cập nhật bản ' + rec.target + ' (lần chạy trước chưa giao xong; chỉ làm phần còn thiếu, phần đã xong không làm lại):'].concat(releaseLegs_(rec, true, true).lines); }
  catch (e) { RELEASE_SUMMARY_LINES_ = ['LƯU Ý: chưa làm nốt được phần giao tóm tắt cập nhật còn dở (' + e.message + '); sẽ thử lại.']; }
  return null;
}
/** Job mỗi giờ (trong khoá): làm nốt phần giao tóm tắt còn dở của bản đã ghi nhận. Không làm gì nếu không có bản ghi đã niêm phong. Trả 1 nếu có làm. */
function releaseResumeInLock_() {
  if (!props_().getProperty('RELEASE_PENDING')) return 0;
  var rec = releasePendingRead_();
  if (rec && !rec.sealed && props_().getProperty('APP_VERSION_LAST') === rec.target) { releasePendingClear_(true); return 0; }   // phiên bản đã ghi nhận xong mà còn bản ghi chưa niêm phong: rác (lượt menu 1 khác ghi sau), bỏ
  if (!rec || !rec.sealed) return 0;   // chưa niêm phong: thuộc về lần menu 1 đang dở, không phải việc của job
  releaseLegs_(rec, true, true);
  return 1;
}

/** Menu: hiện ghi chú của bản đang cài (tĩnh, từ code). Bản cũ hơn và việc lượt menu 1 đã làm: tab RELEASE_LOG. */
function menuReleaseNotes(e) { requireOperator_(e);
  var list = RELEASE_NOTES_.filter(function (n) { return n.version === APP.VERSION; });
  if (!list.length) { alert_('Chưa có ghi chú phát hành cho bản ' + APP.VERSION + ' trong code.'); return; }
  var lines = ['THAY ĐỔI CỦA BẢN ' + APP.VERSION + ' (' + (APP.VERSION_DATE || list[0].date) + ')'];
  releaseNoteItems_(list).forEach(function (x) {
    var g = RELEASE_GROUPS_.filter(function (y) { return y[1] === x.kind; })[0];
    lines.push('· [' + (g ? g[2] : x.kind) + '] ' + (x.item.indexOf(' · ') !== -1 ? x.item.split(' · ')[1] + ': ' : '') + x.vi);
  });
  lines.push('', 'Các bản trước và những gì menu 1 đã làm lúc cập nhật: tab RELEASE_LOG.');
  alert_(lines.join('\n'));
}
