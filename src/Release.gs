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
 * Giao ba đường: chữ trong kết quả menu 1, tab RELEASE_LOG (chỉ ghi thêm), một thông báo RELEASE_NOTES kèm một email tới ADMIN_EMAIL.
 * Chỉ MỘT lần mỗi lần đổi phiên bản (cùng lúc ghi APP_VERSION_LAST): chạy lại menu 1 cùng phiên bản không ghi dòng nào, không gửi thư.
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

/** Cuối menu 1: ghi nhận phiên bản, rồi (file đã có dữ liệu) giao tóm tắt cập nhật. Dòng tóm tắt chữ nằm ở RELEASE_SUMMARY_LINES_. */
function releaseRecord_() {
  var props = props_(), last = props.getProperty('APP_VERSION_LAST');
  if (last === APP.VERSION) return null;
  // Sao lưu trước cập nhật hỏng: chưa ghi nhận phiên bản, để lần chạy menu 1 sau thử sao lưu lại (soát R1 L6).
  // Số đo của lượt này giữ lại (RELEASE_PENDING) vì lượt sau sẽ không còn gì để đo.
  if (RELEASE_SNAPSHOT_FAILED_) { releasePendingSave_(); return null; }
  props.setProperty('APP_VERSION_LAST', APP.VERSION);
  var who = ''; try { who = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail(); } catch (e) { }
  try { withLock_(function () { logActivity_(who || 'SYSTEM', 'RELEASE', 'SYSTEM', APP.VERSION, JSON.stringify({ from: last || '' })); }); } catch (e) { }
  if (UPGRADE_RUN_ && !UPGRADE_RUN_.fresh) {
    // Bước chuyển dữ liệu chạy lần đầu ở lượt này (đo bằng Script Properties MIG_*).
    var before = UPGRADE_RUN_.migBefore || [];
    releaseMigProps_().filter(function (k) { return before.indexOf(k) === -1; }).forEach(function (k) {
      var st = (typeof MIGRATION_STEPS_ !== 'undefined' ? MIGRATION_STEPS_ : []).filter(function (m) { return m.id === k; })[0];
      upgradeAdd_('MIGRATION', k, 'Bước chuyển dữ liệu ' + k + ' chạy lần đầu' + (st ? ': ' + st.label : ''), 'Data migration ' + k + ' ran for the first time' + (st ? ': ' + st.label : ''));
    });
    try { releaseDeliver_(last); } catch (e) { RELEASE_SUMMARY_LINES_ = ['LƯU Ý: chưa lập được tóm tắt cập nhật (' + e.message + ').']; }
  }
  return 'Ghi nhận phiên bản ' + APP.VERSION + (last ? ' (trước đó ' + last + ')' : '');
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
      { vi: 'Tăng tốc tải trang: font không chặn hiển thị, khung chờ tĩnh hiện ngay, ảnh bìa có kích thước sẵn, tutor tải trước giờ rảnh ở nền, đọc tab nhanh hơn nhờ chọn sẵn bộ chuẩn hoá cột.', en: 'Faster page loads: non-blocking fonts, a static placeholder shown at once, cover image with fixed size, tutors preload their availability in the background, faster tab reads with column normalisers chosen once.' }
    ],
    config: [
      { key: 'BANK_QR_IMAGE', kind: 'ADDED', value: '', vi: 'Ảnh mã QR chuyển khoản: link chia sẻ Google Drive hoặc mã file của ảnh VUÔNG 600 x 600 px, PNG, dưới 300 KB (JPG, WEBP, GIF cũng nhận). Trống = trang không hiện ô QR. Menu 2 kiểm ảnh.', en: 'Bank transfer QR image: a Google Drive share link or file ID of a SQUARE 600 x 600 px PNG under 300 KB (JPG, WEBP, GIF also accepted). Empty = the page shows no QR. Menu 2 checks the image.' }
    ],
    content: [
      { key: 'h.bank_note', kind: 'CHANGED', vi: 'Chữ gốc mới: "Nội dung chuyển khoản: vui lòng chỉ ghi số điện thoại của bạn." (en: "Transfer reference: Please enter only your phone number."). Ô admin đã sửa được giữ nguyên; chữ gốc mới nằm ở cột default_vi, default_en.', en: 'New default text: "Nội dung chuyển khoản: vui lòng chỉ ghi số điện thoại của bạn." (en: "Transfer reference: Please enter only your phone number."). Cells admin edited are kept; the new default is in default_vi, default_en.' },
      { key: 'h.bank_qr_alt', kind: 'ADDED', vi: 'Chữ thay thế (alt) của ảnh mã QR trong khung chuyển khoản.', en: 'Alternative text (alt) of the QR image in the transfer panel.' },
      { key: 'ad.act.TEMPLATE_DEDUPE', kind: 'ADDED', vi: 'Tên hành động nhật ký "Gộp dòng trùng key".', en: 'Log action name "Merged duplicate key rows".' },
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
      { vi: 'Menu 1 tự gộp dòng trùng key ở EMAIL_TEMPLATES và CONTENT thành một dòng (giữ chữ admin đã sửa, ghi nhật ký TEMPLATE_DEDUPE); menu 2 báo key trùng. Menu 1 ghi chú "Mới ở <bản>:" vào cột note của khoá CONFIG vừa thêm (không ghi đè ghi chú hay giá trị đã có).', en: 'Menu 1 merges duplicate key rows in EMAIL_TEMPLATES and CONTENT into one row (keeping admin edits, logging TEMPLATE_DEDUPE); menu 2 reports duplicate keys. Menu 1 writes "Mới ở <version>:" into the note column of a newly added CONFIG key (never overwriting an existing note or value).' }
    ],
    admin: [
      { vi: 'Muốn hiện mã QR: tải ảnh VUÔNG 600 x 600 px PNG dưới 300 KB lên Drive của tài khoản chủ hệ thống, dán link hoặc mã file vào CONFIG BANK_QR_IMAGE, rồi chạy menu 2 kiểm ảnh. Để trống thì không hiện QR.', en: 'To show the QR: upload a SQUARE 600 x 600 px PNG under 300 KB to the system owner account Drive, paste the link or file ID into CONFIG BANK_QR_IMAGE, then run menu 2 to check the image. Leave it empty to hide the QR.' },
      { vi: 'Nếu đã sửa h.bank_note trong tab CONTENT thì chữ của bạn được giữ; muốn dùng chữ gốc mới thì xoá ô vi, en đó (hoặc dán chữ ở cột default_vi, default_en).', en: 'If you edited h.bank_note in the CONTENT tab your text is kept; to use the new default clear its vi and en cells (or paste the text from default_vi, default_en).' },
      { vi: 'Đọc tab RELEASE_LOG và email "Tóm tắt cập nhật" để xem mọi thay đổi từ bản bạn đang chạy; menu "Phát hành: xem thay đổi của bản này" hiện ghi chú của bản đang cài.', en: 'Read the RELEASE_LOG tab and the "update summary" email to see every change since the version you were running; the menu "Phát hành: xem thay đổi của bản này" shows the notes of the installed version.' }
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
var UPGRADE_RUN_ = null;
var RELEASE_SUMMARY_LINES_ = [];
function releaseMigProps_() { try { return Object.keys(props_().getProperties()).filter(function (k) { return /^MIG_/.test(k); }); } catch (e) { return []; } }
/**
 * Đầu setupCore_, TRƯỚC khi tạo tab: nhớ đây là file mới tinh (chưa có CONFIG) hay file đã có dữ liệu. File mới không có tóm tắt cập nhật.
 * Nạp số đo của lượt trước chưa ghi nhận được phiên bản (sao lưu lỗi), cùng phiên bản đích.
 */
function upgradeStart_(ss) {
  var fresh = !ss.getSheetByName('CONFIG'), items = [];
  try {
    var pend = JSON.parse(props_().getProperty('RELEASE_PENDING') || 'null');
    if (pend && pend.target === APP.VERSION && !fresh && pend.items) items = pend.items.filter(function (x) { return x.kind !== 'CONFIG_UNKNOWN'; });   // khoá lạ là trạng thái, không phải việc đã làm: lượt này đo lại
    else if (pend) props_().deleteProperty('RELEASE_PENDING');
  } catch (e) { }
  UPGRADE_RUN_ = { fresh: fresh, items: items, migBefore: releaseMigProps_() };
  RELEASE_SUMMARY_LINES_ = [];
}
function upgradeAdd_(kind, item, vi, en) {
  if (UPGRADE_RUN_) UPGRADE_RUN_.items.push({ kind: kind, item: String(item), vi: String(vi || ''), en: String(en || vi || '') });
}
/** Khoá CONFIG lạ: có trong tab mà code không còn dùng. Chỉ báo, không bao giờ xoá. Trả danh sách khoá. */
function upgradeUnknownConfig_(rows) {
  var out = [];
  rows.forEach(function (r) {
    var k = String(r.key === undefined || r.key === null ? '' : r.key).trim();
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
function releaseBuildSummary_(prev, cur, curDate, measured, notes) {
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
  lines.push(did.length ? 'Lượt chạy này đã (đo thật): ' + did.join('; ') + '.' : 'Lượt chạy này không phải thêm khoá, cột, tab hay dòng chữ nào.');
  var kept = releaseItems_(m, 'CONTENT_KEPT');
  if (kept.length) lines.push('GIỮ chữ bạn đã sửa dù chữ gốc đã đổi (' + kept.length + ' ô): ' + releaseShort_(kept) + '. Chữ gốc mới ở cột default_vi, default_en của tab CONTENT.');
  var unk = releaseItems_(m, 'CONFIG_UNKNOWN');
  if (unk.length) lines.push('Khoá CONFIG lạ (không xoá, chỉ báo): ' + releaseShort_(unk) + '.');
  if (admin.length) { lines.push('VIỆC ADMIN CẦN LÀM:'); admin.slice(0, 6).forEach(function (a, i) { lines.push('  ' + (i + 1) + '. ' + a.vi); }); if (admin.length > 6) lines.push('  (còn ' + (admin.length - 6) + ' việc nữa, xem tab RELEASE_LOG)'); }
  return { notes: list, items: all, noteItems: nItems, measured: m, menuLines: lines, admin: admin };
}

var RELEASE_MEASURED_LABEL_ = {
  CONFIG_ADDED: ['Khoá CONFIG thêm', 'CONFIG keys added'], CONFIG_RENAMED: ['Khoá CONFIG chép từ tên cũ', 'CONFIG keys copied from the old name'], CONFIG_UNKNOWN: ['Khoá CONFIG lạ (giữ nguyên, không xoá)', 'Unknown CONFIG keys (kept, never deleted)'],
  TAB_ADDED: ['Tab thêm', 'Tabs added'], COLUMN_ADDED: ['Cột thêm', 'Columns added'], CONTENT_ADDED: ['Dòng chữ web thêm', 'Web text rows added'],
  CONTENT_REFRESHED: ['Ô chữ web chưa sửa, đã nâng lên chữ gốc mới', 'Unedited web text cells upgraded to the new default'], CONTENT_KEPT: ['Ô chữ web bạn đã sửa, GIỮ dù chữ gốc đổi', 'Web text cells you edited, KEPT although the default changed'],
  TEMPLATE_ADDED: ['Mẫu email thêm', 'Email templates added'], TEMPLATE_UPGRADED: ['Mẫu email nâng lên chữ gốc mới', 'Email templates upgraded to the new default'], NOTIFY_RULE_ADDED: ['Luật thông báo thêm', 'Notification rules added'],
  DUP_MERGED: ['Key trùng đã gộp', 'Duplicate keys merged'], MIGRATION: ['Bước chuyển dữ liệu chạy', 'Data migrations run'], DATA_FILLED: ['Dữ liệu điền thêm', 'Data filled in']
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

/** Ghi RELEASE_LOG (chỉ ghi thêm, appendRowsRaw_ theo luật 45). Trả số dòng ghi. */
function releaseLogWrite_(prev, cur, items) {
  var at = getNow_(), rows = items.slice(0, RELEASE_LOG_MAX_ROWS_).map(function (x) { return { at: at, from_version: prev || '', to_version: cur, kind: x.kind, item: x.item, detail: x.vi }; });
  if (items.length > RELEASE_LOG_MAX_ROWS_) rows.push({ at: at, from_version: prev || '', to_version: cur, kind: 'TRUNCATED', item: String(items.length - RELEASE_LOG_MAX_ROWS_), detail: 'Còn ' + (items.length - RELEASE_LOG_MAX_ROWS_) + ' mục nữa không ghi (quá ' + RELEASE_LOG_MAX_ROWS_ + ' dòng).' });
  return withLock_(function () { return appendRowsRaw_('RELEASE_LOG', rows); });
}

/** Lượt này không ghi nhận được phiên bản (sao lưu lỗi): giữ số đo ở Script Property để lượt sau cộng vào (lượt sau không còn gì để đo). */
function releasePendingSave_() {
  if (!UPGRADE_RUN_ || UPGRADE_RUN_.fresh) return;
  var items = UPGRADE_RUN_.items.slice(), pack = function () { return JSON.stringify({ target: APP.VERSION, items: items }); };
  while (items.length && pack().length > 8000) items.pop();
  try { props_().setProperty('RELEASE_PENDING', pack()); } catch (e) { }
}

/**
 * Bước cuối của releaseRecord_: tóm tắt cập nhật qua 3 đường (chữ trong kết quả menu 1, tab RELEASE_LOG, thông báo + email).
 * Mỗi đường lỗi chỉ thành một dòng cảnh báo, không bao giờ làm hỏng menu 1 (luật 27, 39).
 */
function releaseDeliver_(prev) {
  var sum = releaseBuildSummary_(prev, APP.VERSION, APP.VERSION_DATE, UPGRADE_RUN_.items.slice());
  RELEASE_SUMMARY_LINES_ = sum.menuLines.slice();
  try { RELEASE_SUMMARY_LINES_.push('Đã ghi ' + releaseLogWrite_(prev, APP.VERSION, sum.items) + ' dòng vào tab RELEASE_LOG.'); }
  catch (e) { RELEASE_SUMMARY_LINES_.push('LƯU Ý: chưa ghi được tab RELEASE_LOG (' + e.message + ').'); }
  try {
    var nVi = 'Đã cập nhật từ ' + (prev || 'bản cũ') + ' lên ' + APP.VERSION + ' (' + APP.VERSION_DATE + '): ' + sum.notes.length + ' bản, ' + sum.measured.length + ' việc đo được ở lượt chạy này. Xem tab RELEASE_LOG.';
    var nEn = 'Updated from ' + (prev || 'an older version') + ' to ' + APP.VERSION + ' (' + APP.VERSION_DATE + '): ' + sum.notes.length + ' versions, ' + sum.measured.length + ' items measured in this run. See the RELEASE_LOG tab.';
    notify_('RELEASE_NOTES', { actor: 'SYSTEM', entity: 'RELEASE', entity_id: APP.VERSION, message: nVi, message_en: nEn, link: rowLink_('RELEASE_LOG') }, function () {
      return sendTpl_('ADMIN_RELEASE_NOTES', adminEmails_().join(','), { from: prev || 'bản cũ', from_en: prev || 'an older version', to: APP.VERSION, date: APP.VERSION_DATE,
        summary_html: releaseSummaryHtml_(sum, 'vi'), summary_html_en: releaseSummaryHtml_(sum, 'en'), sheet_link: rowLink_('RELEASE_LOG') }, { kind: 'ADMIN_RELEASE_NOTES' });
    });
    RELEASE_SUMMARY_LINES_.push('Đã gửi thông báo RELEASE_NOTES (email tới ADMIN_EMAIL theo luật ở tab NOTIFY_RULES).');
  } catch (e) { RELEASE_SUMMARY_LINES_.push('LƯU Ý: chưa gửi được thông báo cập nhật (' + e.message + '). Tab RELEASE_LOG vẫn đủ.'); }
  try { props_().deleteProperty('RELEASE_PENDING'); } catch (e) { }
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
