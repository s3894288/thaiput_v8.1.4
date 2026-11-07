/**
 * Admin.gs · Admin làm việc trên Google Sheets (v8, plan mục 4.7)
 *
 * Hai cách thao tác:
 *   1. Dropdown ngay trên dòng dữ liệu (trigger onEditInstallable bắt thay đổi):
 *        REGISTRATIONS.admin_action   Duyệt | Từ chối          (ghi lý do từ chối ở cột note trước)
 *        AVAILABILITY.admin_decision  Duyệt | Từ chối
 *        BOOKINGS.admin_action        Huỷ bởi admin | Đổi tutor | Vắng tutor | 3 lựa chọn lỗi buổi kỹ thuật (chunk 5M)
 *                                     | Đã xử lý (giữ nguyên) (chunk 5N: chỉ ghi admin_done_at, hết tô màu)
 *                                     (Đổi tutor: ghi mã tutor muốn chọn vào admin_note, để trống thì hệ thống tự chọn)
 *        STUDENT_PACKAGES             ô hệ thống bị trả lại; end_date, comp_days_admin chỉ PKG_EDITORS sửa (chunk 5M)
 *   2. Menu "thaiput" trên thanh công cụ.
 * Mọi thao tác gọi lớp dịch vụ (AdminOps.gs, Registration.gs, Availability.gs); file này chỉ là phần nối.
 */

var BOOKING_ADMIN_ACTIONS = ['Huỷ bởi admin', 'Đổi tutor', 'Vắng tutor', 'Không tính lương buổi kỹ thuật', 'Tính lương buổi kỹ thuật', 'Lỗi khách quan: tính lương và bù',
  'Hoàn thành (admin chọn)', 'Vắng học viên (admin chọn)', 'Vấn đề kỹ thuật (admin chọn)', 'Đã xử lý (giữ nguyên)'];
/** Chunk 5N: lựa chọn chỉ đánh dấu admin đã xem (ghi admin_done_at), không đổi dữ liệu buổi. */
var ADMIN_MARK_DONE_ACTION_ = 'Đã xử lý (giữ nguyên)';
/**
 * Soát 5Q: đăng ký đã xử lý mà admin chọn lại (ô đã bị Sheets ghi giá trị mới): trả ô về kết quả thật (có gói từ đăng ký này
 * = Duyệt, không có = Từ chối) và báo rõ là không đổi gì.
 */
function regAlreadyDone_(id) {
  return withLock_(function () {
    var t = table_('REGISTRATIONS'), reg = t.byId(id);
    if (!reg) return { ok: false, message: 'Không thấy đăng ký ' + id };
    var approved = table_('STUDENT_PACKAGES').all().some(function (sp) { return String(sp.reg_id) === String(id); });
    var real = approved ? ADMIN_DECISION.APPROVE : ADMIN_DECISION.REJECT;
    if (reg.admin_action !== real) t.update(reg, { admin_action: real });
    return { ok: false, already: true, message: 'Đăng ký ' + id + ' đã ' + (approved ? 'duyệt' : 'từ chối') + ' trước đó, KHÔNG đổi được. Ô đã trả về "' + real + '".' };
  });
}
/** Chunk 5J: admin chọn kết quả thay tutor (buổi đã bắt đầu còn chờ, hoặc đã Không hoàn thành). */
var ADMIN_RESULT_ACTIONS_ = { 'Hoàn thành (admin chọn)': 'COMPLETED', 'Vắng học viên (admin chọn)': 'STUDENT_ABSENT', 'Vấn đề kỹ thuật (admin chọn)': 'TECH_ISSUE' };
/** Chunk 5M: lựa chọn ở admin_action cho buổi Vấn đề kỹ thuật → tech_fault. */
var TECH_FAULT_ACTIONS_ = { 'Không tính lương buổi kỹ thuật': 'TUTOR', 'Tính lương buổi kỹ thuật': 'STUDENT', 'Lỗi khách quan: tính lương và bù': 'OBJECTIVE' };
/** Chọn lại "Vắng tutor" trong số phút này để xác nhận ghi đè buổi đã có kết quả. */
var TUTOR_ABSENT_CONFIRM_MIN_ = 10;

/**
 * Menu thaiput (5K: gom nhóm, tiếng Việt). 3 mục đầu dùng nhiều nhất giữ ở trên; mỗi nhóm một menu con. Mục chỉ cho
 * STAGING (Test) không hiện trên PRODUCTION. Thêm mục mới: đặt vào đúng nhóm, test I126 kiểm mọi hàm trong menu có thật.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var m = ui.createMenu('thaiput')
    .addItem('1. Cài đặt lần đầu / cập nhật cấu trúc', 'menuSetup')
    .addItem('2. Kiểm tra hệ thống', 'menuTestSystem')
    .addItem('3. Tạo lại trigger tự động', 'menuCreateTriggers')
    .addItem('Xem link trang web', 'menuShowLinks')
    .addSeparator()
    .addSubMenu(ui.createMenu('Người dùng')
      .addItem('Tạm khoá học viên (dòng đang chọn ở USERS)', 'menuSuspend')
      .addItem('Mở khoá học viên (dòng đang chọn ở USERS)', 'menuUnsuspend')
      .addItem('Gửi link đăng nhập (các dòng đang chọn ở USERS)', 'menuResendLogin')
      .addItem('Thêm tutor', 'menuAddTutor')
      .addItem('Thêm admin', 'menuAddAdmin')
      .addSeparator()
      .addItem('Khoá tutor (dòng đang chọn ở USERS, xem trước, hỏi lại 2 lần)', 'menuLockTutor')
      .addItem('Mở khoá tutor (dòng đang chọn ở USERS)', 'menuUnlockTutor'))
    .addSubMenu(ui.createMenu('Gói học')
      .addItem('Thêm gói', 'menuAddPackage'))
    .addSubMenu(ui.createMenu('Báo cáo')
      .addItem('Làm mới báo cáo tháng này', 'menuReportThisMonth')
      .addItem('Báo cáo tháng trước', 'menuReportLastMonth'))
    .addSubMenu(ui.createMenu('Email')
      .addItem('Cập nhật nội dung web và email (sau khi sửa CONTENT, EMAIL_TEMPLATES)', 'menuRefreshContent')
      .addItem('Gửi thử một mẫu email cho tôi', 'menuPreviewEmail')
      .addItem('Kiểm tra gửi email (thư có mã, hướng dẫn tìm thư bị mất)', 'menuMailTest')
      .addSeparator()
      .addItem('Email marketing: gửi thử một chiến dịch cho tôi', 'menuMarketingTest')
      .addItem('Email marketing: gửi chiến dịch (hỏi lại kèm số người nhận)', 'menuMarketingSend'))
    .addSubMenu(ui.createMenu('Cập nhật phiên bản')
      .addItem('Bảo trì: chỉ xem (học viên, tutor không đặt, huỷ được)', 'menuMaintReadonly')
      .addItem('Bảo trì: đóng cổng học viên và tutor', 'menuMaintClosed')
      .addItem('Bảo trì: tắt (chạy bình thường)', 'menuMaintOff')
      .addSeparator()
      .addItem('Phát hành: sao lưu ngay (thư mục Releases, không tự xoá)', 'menuReleaseBackup')
      .addItem('Các bước chuyển dữ liệu theo phiên bản (chỉ đọc)', 'menuMigrationStatus')
      .addItem('Bù buổi 8.1.0: xem trước gói sẽ đổi ngày (chỉ đọc)', 'menuCompDryRun'))
    .addSubMenu(ui.createMenu('Chuyển hệ thống')
      .addItem('Bước 1 (hệ thống CŨ): Chuẩn bị chuyển (đóng cổng, gỡ sự kiện, xoá trigger, ghi META)', 'menuMovePrepare')
      .addItem('Bước 2 (hệ thống MỚI): Chạy thử chép dữ liệu (chỉ đọc)', 'menuMoveDryRun')
      .addItem('Bước 3 (hệ thống MỚI): Chép dữ liệu thật (chạy lại được)', 'menuMoveImport')
      .addItem('Bước 4 (hệ thống MỚI): tạo lại sự kiện các buổi sắp tới', 'menuRecreateEvents')
      .addSeparator()
      .addItem('Chỉ gỡ sự kiện các buổi sắp tới (hệ thống cũ, đổi tài khoản lịch)', 'menuDetachEvents'))
    .addSubMenu(ui.createMenu('Lưu trữ')
      .addItem('Lưu trữ: xem tình trạng', 'menuArchiveStatus')
      .addItem('Lưu trữ: mở file (link từng năm)', 'menuArchiveFiles')
      .addItem('Lưu trữ: chạy ngay (chủ file)', 'menuArchiveNow'))
    .addSubMenu(ui.createMenu('Công cụ kỹ thuật')
      .addItem('Sao lưu ngay (thư mục Backup)', 'nightlyBackup')
      .addItem('Calendar: tạo sự kiện đang chờ ngay', 'menuCalendarRunNow')
      .addItem('Đo tốc độ (chỉ đọc)', 'menuSpeedTest')
      .addItem('Đăng nhập Google: tạo khoá bí mật (chủ file)', 'menuGoogleLoginSecret')
      .addItem('Tắt hết trigger tự động (STAGING khi PRODUCTION chạy chính thức)', 'menuStopTriggers')
      .addItem('Xoá dữ liệu test (2 bước xác nhận)', 'menuResetTestData'));
  if (!isProduction_()) {
    m.addSeparator().addSubMenu(ui.createMenu('Test (chỉ STAGING)')
      .addItem('Bật giả lập thời gian', 'menuSimNow')
      .addItem('Tắt giả lập thời gian', 'menuClearSimNow')
      .addItem('Chạy reminderJob', 'reminderJob')
      .addItem('Chạy hourlyJob', 'hourlyJob')
      .addItem('Chạy calendarJob (như trigger 5 phút)', 'calendarJob')
      .addItem('Chạy dailyJob', 'dailyJob')
      .addSeparator()
      .addItem('Thử tải: tạo dữ liệu giả (100 học viên, 10 tutor)', 'menuLoadTestSeed')
      .addItem('Thử tải: bật 2 giờ (hiện khoá)', 'menuLoadTestEnable')
      .addItem('Thử tải: tắt', 'menuLoadTestOff')
      .addItem('Thử tải: kiểm kết quả', 'menuLoadTestCheck'));
  }
  m.addToUi();
}

function adminActor_(e) {
  var email = '';
  try { email = (e && e.user && e.user.getEmail && e.user.getEmail()) || ''; } catch (x) { }
  if (!email) { try { email = Session.getActiveUser().getEmail(); } catch (x2) { } }
  // Gmail thường đôi khi không trả email người sửa cho trigger: ghi ADMIN để vẫn biết thao tác từ Sheets.
  return email || 'ADMIN';
}

/** Trigger onEdit cài đặt (installable). Chỉ xử lý 3 cột dropdown; mọi ô khác bỏ qua. */
function onEditInstallable(e) { requireOperator_(e);
  if (!e || !e.range) return;
  // Chunk 5M: giờ admin sửa ô (trước khi chờ khoá). "Huỷ bởi admin" xét mốc 15:00 hôm trước theo giờ này.
  var editedAt = getNow_();
  var sh = e.range.getSheet(), name = sh.getName();
  // Chunk 5F: admin sửa tay thì bộ đệm dùng chung hết hiệu lực ngay (CONFIG 60 giây, danh sách slot 60 giây).
  if (name === 'CONFIG') { dropConfigCache_(); bumpSlotsVersion_(); }
  if (name === 'BOOKINGS' || name === 'AVAILABILITY' || name === 'USERS') bumpSlotsVersion_();
  // Chunk 5I: nhật ký ghi mọi sửa tay trong Sheets (tab, ô, giá trị cũ và mới). Lỗi ghi nhật ký không chặn việc xử lý bên dưới.
  try { logSheetEdit_(e, sh, name); } catch (x) { Logger.log('Không ghi được nhật ký sửa tay: ' + x.message); }
  if (name === 'STUDENT_PACKAGES') {
    var pr = null;
    try { pr = handlePackageEdit_(e, sh, adminActor_(e)); } catch (pe) { mailAdminError_('Sửa tay STUDENT_PACKAGES', (pe && pe.stack) || String(pe)); }
    if (pr && pr.message) { try { SpreadsheetApp.getActive().toast(pr.message, 'thaiput', 10); } catch (x) { } }
    return pr;
  }
  if (['REGISTRATIONS', 'AVAILABILITY', 'BOOKINGS', 'USERS'].indexOf(name) === -1) return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  var header = sh.getRange(1, e.range.getColumn()).getValue();
  var value = String(e.value === undefined ? e.range.getValue() : e.value).trim();
  var idCol = SCHEMA[name].cols.indexOf(SCHEMA[name].id) + 1;
  var id = String(sh.getRange(e.range.getRow(), idCol).getValue());
  var res = handleAdminEdit_(name, String(header), id, value, adminActor_(e), { at: editedAt });
  if (res && res.message) { try { SpreadsheetApp.getActive().toast(res.message, 'thaiput', 8); } catch (x) { } }
  return res;
}

/*
 * Chunk 5I: sửa tay trong Sheets (gõ, chọn dropdown, dán, xoá ô) ghi một dòng SHEET_EDIT vào ACTIVITY_LOG. Không ghi các tab
 * nhật ký (ACTIVITY_LOG, MAIL_LOG, METRICS) để không tự sinh dòng vô tận; tab AUTH chỉ ghi ô nào bị sửa, không ghi giá trị (mã phiên).
 * Tab không thuộc hệ thống (REPORT_MONTH, tab admin tự tạo) bỏ qua.
 */
var SHEET_EDIT_SKIP_ = ['ACTIVITY_LOG', 'MAIL_LOG', 'METRICS'];
var SHEET_EDIT_HIDE_VALUES_ = ['AUTH'];
function colLetter_(n) { var out = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out; return out; }
function a1Of_(row, col, nr, nc) { var a = colLetter_(col) + row; return nr > 1 || nc > 1 ? a + ':' + colLetter_(col + nc - 1) + (row + nr - 1) : a; }
/**
 * Hàm thuần: chi tiết của một lần sửa tay (chữ trung tính, không theo một thứ tiếng). Giá trị dài cắt còn 200 ký tự.
 * oldV undefined: Google không gửi giá trị cũ (ô cũ trống, hoặc dán đè): ghi "?" thay vì giả là trống (soát 5I A11).
 * values (sửa nhiều ô, tối đa 20 ô): giá trị mới từng ô.
 */
function sheetEditDetail_(name, a1, header, oldV, newV, cells, values) {
  var cut = function (v) { v = v === undefined || v === null ? '' : String(v); return v.length > 200 ? v.substring(0, 200) + '…' : v; };
  var hide = SHEET_EDIT_HIDE_VALUES_.indexOf(name) !== -1;
  if (cells > 1) return a1 + ' ×' + cells + (values && !hide ? ': ' + values.map(function (x) { return x[0] + '="' + cut(x[1]) + '"'; }).join(', ').substring(0, 1500) : '');
  if (hide) return a1 + (header ? ' (' + header + ')' : '') + ': •••';
  return a1 + (header ? ' (' + header + ')' : '') + ': ' + (oldV === undefined ? '?' : '"' + cut(oldV) + '"') + ' → "' + cut(newV) + '"';
}
function logSheetEdit_(e, sh, name) {
  if (!SCHEMA[name] || SHEET_EDIT_SKIP_.indexOf(name) !== -1) return;
  var r = e.range, row = r.getRow(), col = r.getColumn(), nr = r.getNumRows(), nc = r.getNumColumns();
  var header = nc === 1 ? String(sh.getRange(1, col).getValue() || '') : '', id = '';
  var key = SCHEMA[name].id, ki = key ? SCHEMA[name].cols.indexOf(key) : -1;
  if (nr === 1 && row > 1 && ki !== -1) { try { var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), kc = hdr.indexOf(key) + 1; if (kc > 0) id = String(sh.getRange(row, kc).getValue() || ''); } catch (x) { } }
  var oldV = e.oldValue, newV = e.value === undefined && nr === 1 && nc === 1 ? r.getValue() : e.value, values = null;
  if (nr * nc > 1 && nr * nc <= 20) {
    try { var vv = r.getValues(); values = []; vv.forEach(function (line, i) { line.forEach(function (v, j) { values.push([a1Of_(row + i, col + j, 1, 1), v instanceof Date ? fmtDateTime_(v) : v]); }); }); } catch (x) { values = null; }
  }
  logMenu_(e, 'SHEET_EDIT', name, name === 'AUTH' ? '' : id, sheetEditDetail_(name, a1Of_(row, col, nr, nc), header, oldV, newV, nr * nc, values));
}

/**
 * Chunk 5I (soát A2): trigger đổi cấu trúc (onChange): xoá hoặc chèn dòng, cột, thêm, xoá, đổi tên tab. Ghi SHEET_CHANGE với
 * loại thay đổi và tab đang mở. Sửa giá trị ô (EDIT) đã có onEditInstallable; đổi định dạng (FORMAT) không ghi.
 */
var SHEET_CHANGE_LOG_ = ['INSERT_ROW', 'REMOVE_ROW', 'INSERT_COLUMN', 'REMOVE_COLUMN', 'INSERT_GRID', 'REMOVE_GRID', 'OTHER'];
var SHEET_SNAP_KEY_ = 'SHEET_SNAP';
/** Danh sách tab hiện có { sheetId: tên }. */
function sheetSnapshot_(ss) { var o = {}; ss.getSheets().forEach(function (s) { o[String(s.getSheetId())] = s.getName(); }); return o; }
function saveSheetSnapshot_(ss) { try { props_().setProperty(SHEET_SNAP_KEY_, JSON.stringify(sheetSnapshot_(ss || SpreadsheetApp.getActive()))); } catch (x) { } }
/**
 * Hàm thuần: so hai danh sách tab. Trả { added: [tên], removed: [tên], renamed: [[cũ, mới]] }. Một tab mất và một tab mới
 * trong cùng lần đổi kiểu OTHER là đổi tên (Google không gửi tên cũ).
 */
function sheetDiff_(oldSnap, nowSnap, type) {
  var added = [], removed = [], renamed = [];
  Object.keys(nowSnap).forEach(function (id) { if (!(id in oldSnap)) added.push(nowSnap[id]); else if (oldSnap[id] !== nowSnap[id]) renamed.push([oldSnap[id], nowSnap[id]]); });
  Object.keys(oldSnap).forEach(function (id) { if (!(id in nowSnap)) removed.push(oldSnap[id]); });
  if (type === 'OTHER' && added.length === 1 && removed.length === 1) { renamed.push([removed[0], added[0]]); added = []; removed = []; }
  return { added: added, removed: removed, renamed: renamed };
}
function onChangeInstallable(e) {
  // Soát vòng 2 N7: Google gọi trigger này cả khi sửa ô (EDIT) và đổi định dạng (FORMAT): bỏ ngay, không gọi dịch vụ nào.
  if (e && e.changeType && SHEET_CHANGE_LOG_.indexOf(String(e.changeType)) === -1) return null;
  requireOperator_(e);
  if (!e || SHEET_CHANGE_LOG_.indexOf(String(e.changeType)) === -1) return null;
  var type = String(e.changeType), ss = e.source || SpreadsheetApp.getActive(), name = '', rng = '', detail = type, touched = [];
  if (type === 'INSERT_GRID' || type === 'REMOVE_GRID' || type === 'OTHER') {
    // Soát vòng 2 N3: tab vừa xoá không còn để hỏi tên; so với danh sách tab đã lưu để biết đúng tab bị thêm, xoá, đổi tên.
    var old = null; try { old = JSON.parse(props_().getProperty(SHEET_SNAP_KEY_) || 'null'); } catch (x) { }
    var now = {}; try { now = sheetSnapshot_(ss); } catch (x) { }
    if (old) {
      var d = sheetDiff_(old, now, type);
      if (type === 'OTHER' && !d.added.length && !d.removed.length && !d.renamed.length) return null;   // OTHER không đổi tab: bỏ
      touched = d.removed.concat(d.renamed.map(function (r) { return r[0]; }));
      name = d.removed.concat(d.added, d.renamed.map(function (r) { return r[1]; })).join(',');
      detail = JSON.stringify({ type: type, added: d.added, removed: d.removed, renamed: d.renamed });
    }
    saveSheetSnapshot_(ss);
  } else {
    try { var sh = ss.getActiveSheet(); name = sh.getName(); var ar = sh.getActiveRange(); if (ar) rng = a1Of_(ar.getRow(), ar.getColumn(), ar.getNumRows(), ar.getNumColumns()); } catch (x) { }
    detail = type + (rng ? ' ' + rng : '');
  }
  logMenu_(e, 'SHEET_CHANGE', name, '', detail);
  var sys = touched.filter(function (n) { return SCHEMA[n]; });
  if (sys.length) {
    try { notify_('SHEET_REMOVED', { actor: adminActor_(e), entity: 'SHEET', entity_id: sys.join(','),
      message: 'Tab ' + sys.join(', ') + ' vừa bị xoá hoặc đổi tên trong Sheets. Hệ thống cần đúng tên tab này: khôi phục ngay (Tệp → Nhật ký phiên bản, hoặc đổi lại tên).',
      message_en: 'Tab ' + sys.join(', ') + ' was just deleted or renamed in Sheets. The system needs this exact tab name: restore it now (File → Version history, or rename it back).' }); } catch (x) { }
  }
  if (/BOOKINGS|AVAILABILITY|USERS/.test(name + ',' + touched.join(','))) bumpSlotsVersion_();
  return true;
}

/** Phần xử lý tách riêng khỏi trigger để test được. Trả { ok, message }. */
function handleAdminEdit_(sheetName, header, id, value, actor, opts) {
  opts = opts || {};
  try {
    if (sheetName === 'REGISTRATIONS' && header === 'admin_action') {
      if (value === ADMIN_DECISION.APPROVE) { var a = approveRegistration_(id, actor); return a.already ? regAlreadyDone_(id) : { ok: a.ok, message: 'Đã duyệt ' + id + ', đã gửi email chào mừng.' }; }
      if (value === ADMIN_DECISION.REJECT) {
        clearDbCache_(); var reg = table_('REGISTRATIONS').byId(id);
        var r = rejectRegistration_(id, actor, reg ? reg.note : ''); return r.already ? regAlreadyDone_(id) : { ok: r.ok, message: 'Đã từ chối ' + id + '.' };
      }
      return null;
    }
    if (sheetName === 'AVAILABILITY' && header === 'admin_decision') {
      if (!value || value === TUTOR_CANCEL_DECISION.PENDING) return null;
      var d = decideTutorCancel_(id, value, actor);
      var txt = { REASSIGNED: 'Đã duyệt, đã đổi sang tutor khác.', CANCELLED_TUTOR: 'Đã duyệt, buổi đã huỷ và báo học viên (không trừ buổi).', SLOT_CANCELLED: 'Đã duyệt huỷ slot.', REJECTED: 'Đã từ chối, tutor vẫn dạy.' };
      return { ok: d.ok, message: d.ok ? txt[d.outcome] : 'Không xử lý được: ' + (REASON_TEXT_VI[d.reason] || d.reason) };
    }
    // Khoá tài khoản (status DISABLED) trong tab USERS: thoát mọi thiết bị ngay, không chờ job mỗi giờ.
    if (sheetName === 'USERS' && header === 'status') {
      if (value !== USER_STATUS.DISABLED) return null;
      clearDbCache_(); var uu = userById_(id);
      if (!uu) return null;
      var lo = logoutAll_(uu, actor);
      return { ok: true, message: 'Đã khoá ' + id + ' và thoát ' + lo.count + ' thiết bị.' };
    }
    if (sheetName === 'BOOKINGS' && header === 'admin_action') {
      if (BOOKING_ADMIN_ACTIONS.indexOf(value) === -1) return null;
      // Nhận việc trong khoá: xoá ô admin_action trước. Trigger chạy lần 2 cho cùng một lần chọn (ví dụ có 2 bộ trigger)
      // thấy ô đã trống thì bỏ qua, không đổi tutor hay huỷ 2 lần.
      var b = withLock_(function () {
        var fresh = table_('BOOKINGS').byId(id);
        if (!fresh || fresh.admin_action !== value) return fresh ? 'DONE' : null;
        table_('BOOKINGS').update(fresh, { admin_action: '' });
        return { admin_note: fresh.admin_note };
      }), out;
      if (b === 'DONE') return null;
      if (!b) return { ok: false, message: 'Không thấy booking ' + id };
      var note = '';
      if (value === 'Huỷ bởi admin') {
        out = adminCancelBooking_(id, actor, b.admin_note || 'Admin huỷ', opts.at);
        if (out.ok && out.late) note = ' (sau ' + cfg_('CANCEL_CUTOFF_HOUR') + ':00 hôm trước: Huỷ muộn, trừ lượt, không bù)';
      } else if (value === 'Đổi tutor') {
        // Soát 5Q: admin_note thường còn chữ cũ ("Đã: ...", "Lỗi: ..."): chỉ lấy đúng một mã tutor, không có thì tự chọn.
        var tm = String(b.admin_note || '').toUpperCase().match(/\bT\d{3,}\b/);
        out = adminReassignBooking_(id, actor, tm ? tm[0] : null);
      }
      else if (value === 'Vắng tutor') {
        // Ghi đè buổi đã có kết quả: tutor mất lương buổi đó, nên phải chọn lại lần hai trong TUTOR_ABSENT_CONFIRM_MIN_ phút.
        var ck = 'TA_CONFIRM_' + id, pv = Number(props_().getProperty(ck) || 0), confirmed = !!pv && getNow_().getTime() - pv <= TUTOR_ABSENT_CONFIRM_MIN_ * 60000;
        out = adminMarkTutorAbsent_(id, actor, { confirm: confirmed });
        if (out.reason === 'NEED_CONFIRM') {
          props_().setProperty(ck, String(getNow_().getTime()));
          withLock_(function () {
            var f2 = table_('BOOKINGS').byId(id);
            table_('BOOKINGS').update(f2, { admin_action: '', admin_note: 'Chờ xác nhận: buổi đang ' + (BOOKING_STATUS_VI[out.status] || out.status) + ', ghi Vắng tutor thì tutor mất lương buổi này. Chọn lại "Vắng tutor" trong ' + TUTOR_ABSENT_CONFIRM_MIN_ + ' phút để xác nhận. · ' + fmtDateTime_(getNow_()) + ' · ' + actor });
          });
          return { ok: false, message: 'Buổi đã có kết quả (' + (BOOKING_STATUS_VI[out.status] || out.status) + '). Chọn lại "Vắng tutor" trong ' + TUTOR_ABSENT_CONFIRM_MIN_ + ' phút để xác nhận.' };
        }
        if (out.ok) props_().deleteProperty(ck);
      } else if (value === ADMIN_MARK_DONE_ACTION_) {
        out = adminMarkDone_(id, actor);
        if (out.block === 'OPEN') note = ' (buổi đang ' + (BOOKING_STATUS_VI[out.status] || out.status) + ': chưa có gì để giữ nguyên. ' + (out.status === BOOKING_STATUS.PENDING_REASSIGN ? 'Chưa tới giờ học: chọn Đổi tutor hoặc Huỷ bởi admin (không trừ lượt); đã qua giờ học: chọn Vắng tutor' : 'Chờ tutor chọn kết quả, hoặc chọn kết quả thay tutor') + ')';
        if (out.block === 'TECH') note = ' (buổi kỹ thuật chưa chọn lỗi: chọn 1 trong 3 lựa chọn lỗi kỹ thuật)';
      } else if (ADMIN_RESULT_ACTIONS_[value]) out = adminSetResult_(id, actor, ADMIN_RESULT_ACTIONS_[value]);
      else out = adminSetTechFault_(id, actor, TECH_FAULT_ACTIONS_[value]);
      withLock_(function () {
        var fresh = table_('BOOKINGS').byId(id), patch = { admin_action: '', admin_note: (out.ok ? 'Đã: ' : 'Lỗi: ') + value + note + (out.ok ? '' : ' (' + (REASON_TEXT_VI[out.reason] || out.reason) + ')') + ' · ' + fmtDateTime_(getNow_()) + ' · ' + actor };
        // Chunk 5N: chạy thành công thì ghi admin_done_at (tô màu "chưa xử lý" so mốc này với result_at). Thiếu cột (chưa chạy menu 1): bỏ qua.
        if (out.ok && 'admin_done_at' in table_('BOOKINGS').colIndex) patch.admin_done_at = getNow_();
        table_('BOOKINGS').update(fresh, patch);
      });
      return { ok: out.ok, message: (out.ok ? 'Đã xử lý: ' : 'Không xử lý được: ') + value + note };
    }
    return null;
  } catch (err) {
    mailAdminError_('Thao tác admin ' + sheetName + ' ' + id, (err && err.stack) || String(err));
    return { ok: false, message: 'Lỗi: ' + err.message };
  }
}

// ── Menu ──

/** Mã user của mọi dòng đang chọn ở tab USERS (chọn nhiều vùng bằng Ctrl hoặc Cmd, hoặc kéo nhiều dòng). */
function selectedUserIds_() {
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== 'USERS') throw new Error('Hãy chọn các dòng trong tab USERS.');
  var col = SCHEMA.USERS.cols.indexOf('user_id') + 1, ids = [];
  sh.getActiveRangeList().getRanges().forEach(function (rg) {
    for (var r = rg.getRow(); r < rg.getRow() + rg.getNumRows(); r++) {
      if (r < 2) continue;
      var id = String(sh.getRange(r, col).getValue() || '').trim();
      if (id && ids.indexOf(id) === -1) ids.push(id);
    }
  });
  if (!ids.length) throw new Error('Chưa chọn dòng nào có mã user.');
  return ids;
}

function selectedUserRow_() {
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== 'USERS') throw new Error('Hãy chọn một dòng trong tab USERS.');
  var row = sh.getActiveRange().getRow();
  if (row < 2) throw new Error('Hãy chọn dòng dữ liệu, không chọn dòng tiêu đề.');
  return String(sh.getRange(row, SCHEMA.USERS.cols.indexOf('user_id') + 1).getValue());
}
function alert_(msg) { try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); } }

function menuSuspend(e) { requireOperator_(e); var id = selectedUserRow_(); var r = suspendStudent_(id, adminActor_()); alert_(r.ok ? 'Đã tạm khoá ' + id : 'Không khoá được: ' + r.reason); }
function menuUnsuspend(e) { requireOperator_(e); var id = selectedUserRow_(); var r = unsuspendStudent_(id, adminActor_()); alert_(r.ok ? 'Đã mở khoá ' + id + ', hạn gói đã cộng bù.' : 'Không mở khoá được: ' + r.reason); }
function menuResendLogin(e) { requireOperator_(e);
  var ids = selectedUserIds_();
  var r = sendLoginLinks_(ids, adminActor_());
  alert_('Đã gửi link đăng nhập cho ' + r.sent.length + ' người' + (r.sent.length ? ': ' + r.sent.join(', ') : '') +
    (r.skipped.length ? '\nBỏ qua ' + r.skipped.length + ': ' + r.skipped.join(', ') : '') +
    '\nMỗi người là 1 email (tính vào hạn mức email mỗi ngày).');
}

/** Gửi link đăng nhập cho nhiều tài khoản một lần. Bỏ qua mã không có, tài khoản DISABLED, admin (admin dùng đăng nhập riêng). */
function sendLoginLinks_(ids, actor) {
  var sent = [], skipped = [];
  withLock_(function () {
    ids.forEach(function (id) {
      var u = userById_(id);
      if (!u || u.status === USER_STATUS.DISABLED || (u.role !== 'STUDENT' && u.role !== 'TUTOR')) { skipped.push(id); return; }
      mailLoginLink_(u, createLoginLinkInLock_(u));
      logActivity_(actor, 'LOGIN_LINK_RESENT', 'USER', id, '');
      sent.push(id);
    });
  });
  return { sent: sent, skipped: skipped };
}
function menuAddTutor(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('Tên tutor').getResponseText(), email = ui.prompt('Email tutor').getResponseText(), phone = ui.prompt('Số điện thoại tutor').getResponseText();
  var r = addTutor_({ name: name, email: email, phone: phone }, adminActor_());
  alert_(r.ok ? 'Đã thêm tutor ' + r.userId + '. Gửi link đăng nhập bằng menu "Gửi lại link đăng nhập".' : 'Không thêm được: ' + (REASON_TEXT_VI[r.reason] || r.reason));
}

/** Thêm tutor (tách riêng để test). */
function menuAddAdmin(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('Tên admin').getResponseText(), email = ui.prompt('Email admin (Gmail cá nhân hoặc email Workspace)').getResponseText();
  var r = addAdmin_({ name: name, email: email }, adminActor_());
  alert_(r.ok ? 'Đã thêm admin ' + r.userId + '. Tài khoản này có quyền admin nhưng không nhận email; email hệ thống chỉ gửi tới CONFIG ADMIN_EMAIL. Nhớ chia sẻ file Sheets này cho email đó với quyền Người chỉnh sửa. Admin dự phòng: đặt status DISABLED cho tới khi cần.' : 'Không thêm được: ' + (REASON_TEXT_VI[r.reason] || r.reason));
}
/** Thêm tài khoản admin (USERS role ADMIN): có quyền admin, KHÔNG nhận email (email chỉ tới CONFIG ADMIN_EMAIL). Admin dự phòng để DISABLED. */
function addAdmin_(o, actor) {
  if (!o || !String(o.name || '').trim() || !isEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    if (userByEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
    var u = table_('USERS').insert({ user_id: nextId_('USERS_ADMIN'), role: 'ADMIN', email: String(o.email).trim().toLowerCase(), name: String(o.name).trim(), status: USER_STATUS.ACTIVE, created_at: getNow_() });
    logActivity_(actor, 'ADMIN_ADDED', 'USER', u.user_id, u.email);
    return { ok: true, userId: u.user_id };
  });
}

function addTutor_(o, actor) {
  if (!o || !String(o.name || '').trim() || !isEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
  var ph = normalizePhone_(o.phone, false);
  if (!ph.ok) return { ok: false, reason: REASONS.INVALID_PHONE };
  return withLock_(function () {
    if (userByEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
    var u = table_('USERS').insert({ user_id: nextId_('USERS_TUTOR'), role: 'TUTOR', email: String(o.email).trim().toLowerCase(), name: String(o.name).trim(),
      phone: ph.phone, contact_link: contactFormula_(ph.phone), status: USER_STATUS.ACTIVE, rate_vnd: Number(o.rate_vnd || 0), color_id: String((table_('USERS').filter(function (x) { return x.role === 'TUTOR'; }).length % 11) + 1), created_at: getNow_() });
    logActivity_(actor, 'TUTOR_ADDED', 'USER', u.user_id, u.email);
    return { ok: true, userId: u.user_id };
  });
}

function menuReportThisMonth(e) { requireOperator_(e); refreshReportMonth_(); logMenu_(e, 'REPORT_REFRESHED', 'REPORT_MONTH', dateKey_(getNow_()).substring(0, 7), ''); alert_('Đã làm mới tab REPORT_MONTH.'); }
function menuReportLastMonth(e) { requireOperator_(e); var n = getNow_(); var d = new Date(n.getFullYear(), n.getMonth() - 1, 1); refreshReportMonth_(d.getFullYear(), d.getMonth() + 1); logMenu_(e, 'REPORT_REFRESHED', 'REPORT_MONTH', d.getFullYear() + '-' + pad2_(d.getMonth() + 1), ''); alert_('Đã ghi báo cáo tháng ' + (d.getMonth() + 1) + ' vào tab REPORT_MONTH.'); }
/**
 * 5K (BL03 phương án a): 4 link rút gọn trên tên miền (URL Redirect ở Namecheap). Đổi hệ thống hay tài khoản chỉ cần đổi
 * đích ở Namecheap; học viên, tutor giữ link cũ. Menu hiện link rút gọn đang ghi trong CONFIG và đích cần đặt ở Namecheap.
 */
var SHORT_LINKS_ = [['SHORT_URL_HOME', 'Trang đăng ký', 'home'], ['SHORT_URL_LOGIN', 'Đăng nhập (học viên, tutor, admin)', 'login'],
  ['SHORT_URL_STUDENT', 'Cổng học viên', 'student'], ['SHORT_URL_TUTOR', 'Cổng tutor', 'tutor']];
function shortLinksInfo_() {
  var url = cfg_('WEBAPP_URL'); if (!url) { try { url = ScriptApp.getService().getUrl(); } catch (x) { } }
  return { webapp: url || '', links: SHORT_LINKS_.map(function (x) {
    return { key: x[0], label: x[1], short: String(cfg_(x[0]) || '').trim(), target: url ? url + (url.indexOf('?') === -1 ? '?' : '&') + 'page=' + x[2] : '' };
  }) };
}
function menuShowLinks(e) { requireOperator_(e);
  var info = shortLinksInfo_(), lines = ['Link web app (/exec): ' + (info.webapp || '(chưa triển khai, chưa ghi WEBAPP_URL)'), ''];
  info.links.forEach(function (l) {
    lines.push(l.label + ':', '  Link rút gọn: ' + (l.short || '(chưa có, ghi vào CONFIG ' + l.key + ')'), '  Đích đặt ở Namecheap (URL Redirect): ' + (l.target || '(chưa có link web app)'), '');
  });
  lines.push('Đổi hệ thống hoặc tài khoản: chỉ sửa đích ở Namecheap, link rút gọn giữ nguyên.');
  alert_(lines.join('\n'));
  return info;
}
/** 5L: menu "Thêm gói": hỏi lần lượt từng ô, kiểm hợp lệ, thêm một dòng PACKAGES. Bấm Huỷ ở bước nào cũng dừng. */
function menuAddPackage(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), ask = function (title, hint) { var r = ui.prompt(title, hint || '', ui.ButtonSet.OK_CANCEL); if (r.getSelectedButton() !== ui.Button.OK) throw new Error('CANCEL'); return String(r.getResponseText() || '').trim(); };
  var o = {};
  try {
    o.code = ask('Mã gói', 'Chữ in hoa, số, dấu _; ví dụ PASS_3M. Không đổi được sau khi đã bán.').toUpperCase();
    o.name = ask('Tên tiếng Việt', 'Ví dụ: Gói 3 tháng');
    o.name_en = ask('Tên tiếng Anh', 'Ví dụ: 3 month pass (để trống thì trang tiếng Anh hiện tên tiếng Việt)');
    o.type = ask('Kiểu gói', 'DAYS = theo ngày (không giới hạn buổi, tối đa 1 buổi mỗi ngày); SESSIONS = theo số buổi').toUpperCase() || 'DAYS';
    o.days = ask('Số ngày', o.type === 'SESSIONS' ? 'Gói theo buổi: để trống (không giới hạn ngày)' : 'Ví dụ 90');
    o.sessions = ask('Số buổi tối đa', o.type === 'SESSIONS' ? 'Ví dụ 12' : 'Để trống = không giới hạn (Trial thì ghi số buổi)');
    o.price_vnd = ask('Giá (VND)', 'Số, không dấu chấm. 0 = chỉ đăng ký qua Zalo, không chọn được trên web').replace(/[.,\s]/g, '');
    o.active = !/^(n|no|không|khong|false|0)$/i.test(ask('Đang bán?', 'Có hoặc Không (mặc định Có)'));
  } catch (x) { if (String(x.message) === 'CANCEL') { alert_('Đã huỷ, chưa thêm gói nào.'); return null; } throw x; }
  var r = addPackage_(o, adminActor_(e));
  alert_(r.ok ? 'Đã thêm gói ' + r.code + '. Chạy menu 2 để kiểm lại; trang đăng ký hiện gói đang bán sau tối đa vài phút (hoặc chạy menu Email > Cập nhật nội dung web và email).' : 'Chưa thêm được:\n' + r.errors.join('\n'));
  return r;
}

function menuDetachEvents(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Gỡ sự kiện Calendar của mọi buổi sắp tới?', 'Học viên và tutor sẽ nhận thư huỷ của Google Calendar (buổi học vẫn giữ). Chỉ làm khi chuyển sang tài khoản mới, ngay trước Bước B.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  var r = detachFutureEvents_(adminActor_()); alert_('Đã gỡ ' + r.removed + ' sự kiện. Sang hệ thống mới chạy Bước B.');
}
function menuRecreateEvents(e) { requireOperator_(e);
  var r = recreateFutureEvents_(adminActor_());
  alert_('Đã tạo ' + r.created + ' sự kiện mới.' + (r.failed.length ? '\nLỗi ' + r.failed.length + ':\n' + r.failed.slice(0, 10).join('\n') : ''));
}

function menuRefreshContent(e) { requireOperator_(e);
  var r = refreshContent_();
  logMenu_(e, 'CONTENT_REFRESHED', 'CONTENT', '', JSON.stringify({ warnings: r.warnings.length }));
  alert_('Đã cập nhật. Tải lại trang web để thấy chữ mới; email gửi từ bây giờ dùng mẫu mới.' + (r.warnings.length ? '\n\nCần xem lại:\n' + r.warnings.slice(0, 20).join('\n') : '\nKhông thấy lỗi.'));
}
/** Xoá bộ nhớ đệm và kiểm tra: key lạ hoặc mất {bien} trong CONTENT, biến không có trong danh sách của mẫu email, chiến dịch marketing lỗi. */
function refreshContent_() {
  clearDbCache_(); clearContentCache_();
  var warnings = [];
  var defs = contentDefaults_();
  var vars = function (x) { return (String(x || '').match(/\{\w+\}/g) || []).sort().join(' '); };
  var m = contentMap_();
  table_('CONTENT').all().forEach(function (r) {
    if (!r.key) return;
    var d = defs[r.key];
    if (!d) { warnings.push('CONTENT: key "' + r.key + '" không được trang web dùng'); return; }
    // Chunk 5H: chữ đã sửa làm mất hoặc thêm {bien} (ví dụ xoá {n}): trang sẽ hiện thiếu số hoặc hiện nguyên {bien}.
    LANGS_.forEach(function (l, i) {
      var cur = m[r.key] ? m[r.key][i] : '';
      if (cur !== '' && cur !== d[l] && vars(cur) !== vars(d[l])) warnings.push('CONTENT ' + r.key + ' (' + l + '): chữ gốc có ' + (vars(d[l]) || 'không có biến') + ', bản đã sửa có ' + (vars(cur) || 'không có biến'));
    });
  });
  // Danh sách cách nhau dấu |: phải đủ số mục, hai thứ tiếng cùng số mục.
  [['a.dow', 7], ['a.dow_short', 7], ['t.legend', 5], ['h.levels', 0]].forEach(function (x) {
    var n = m[x[0]].map(function (s) { return String(s).split('|').length; });
    if ((x[1] && (n[0] !== x[1] || n[1] !== x[1])) || n[0] !== n[1]) warnings.push('CONTENT ' + x[0] + ': cần ' + (x[1] ? 'đúng ' + x[1] + ' mục' : 'cùng số mục ở vi và en') + ' cách nhau dấu | (đang có vi ' + n[0] + ', en ' + n[1] + ')');
  });
  // Email marketing đang chờ gửi: báo lỗi chữ trước khi admin bấm gửi.
  try {
    table_('MARKETING_EMAILS').all().forEach(function (r) {
      var st = String(r.status || '').trim().toUpperCase();
      if (st !== 'READY' && st !== 'SENDING') return;
      marketingCheck_(r, false).errors.forEach(function (x) { warnings.push('MARKETING_EMAILS ' + r.campaign_id + ': ' + x); });
    });
  } catch (e) { }
  table_('EMAIL_TEMPLATES').all().forEach(function (r) {
    var t = emailTemplate_(r.key);
    if (!t) return;
    var allowed = String(t.variables || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; });
    ['subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en'].forEach(function (c) {
      String(t[c] || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (m, k) {
        var name = /^button:/.test(k) ? k.substring(7).split('|')[0].trim() : k;
        if (allowed.length && allowed.indexOf(name) === -1) warnings.push('EMAIL_TEMPLATES ' + r.key + ' (' + c + '): biến {{' + name + '}} không có trong cột variables, sẽ để trống');
        return m;
      });
    });
    // Mẫu đã sửa làm mất nút hoặc biến có trong mẫu gốc (ví dụ bỏ mất nút đăng nhập): nhắc admin.
    var d = DEFAULT_EMAIL_TEMPLATES_[r.key];
    if (d) [['body_vi', 3], ['body_en', 6]].forEach(function (x) {
      if (String(t[x[0]]) === String(d[x[1]])) return;
      (String(d[x[1]]).match(/\{\{\s*button:[^|}]+/g) || []).forEach(function (b) {
        var name = b.replace(/^\{\{\s*button:/, '').trim();
        if (String(t[x[0]]).indexOf(name) === -1 && t[x[0]] !== '') warnings.push('EMAIL_TEMPLATES ' + r.key + ' (' + x[0] + '): mẫu gốc có nút {{button:' + name + '|...}} nhưng bản đã sửa không còn, người nhận sẽ không có nút này');
      });
    });
  });
  return { warnings: warnings };
}
function menuPreviewEmail(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), keys = table_('EMAIL_TEMPLATES').all().map(function (r) { return r.key; });
  var res = ui.prompt('Gửi thử mẫu email', 'Nhập key của mẫu (ví dụ WELCOME). Có: ' + keys.join(', '), ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var to = ''; try { to = Session.getActiveUser().getEmail(); } catch (x) { }
  var r = previewEmail_(res.getResponseText().trim().toUpperCase(), to || adminEmails_()[0]);
  logMenu_(e, 'MAIL_PREVIEW', 'EMAIL_TEMPLATES', r.key || res.getResponseText().trim().toUpperCase(), JSON.stringify(r.ok ? { to: r.to } : { error: r.error }));
  alert_(r.ok ? 'Đã gửi mẫu ' + r.key + ' tới ' + r.to + ' với dữ liệu minh hoạ.' : 'Không gửi được: ' + r.error);
}
/** Gửi một mẫu với dữ liệu minh hoạ (dùng để admin kiểm tra chữ vừa sửa). */
function previewEmail_(key, to) {
  clearContentCache_(); clearDbCache_();
  if (!emailTemplate_(key)) return { ok: false, error: 'không có mẫu ' + key };
  var t = emailTemplate_(key);
  if (!t.active) return { ok: false, error: 'mẫu ' + key + ' đang tắt (active FALSE)' };
  var ok = sendTpl_(key, to, sampleTplVars_(key), { kind: 'PREVIEW_' + key, enFirst: t.audience === 'TUTOR' });
  return ok ? { ok: true, key: key, to: to } : { ok: false, error: 'gửi email không thành công' };
}

function menuSimNow(e) { requireOperator_(e);
  var s = SpreadsheetApp.getUi().prompt('Giờ giả lập (YYYY-MM-DD HH:mm)').getResponseText();
  setSimNow_(s); logMenu_(e, 'SIM_NOW', 'SYSTEM', '', fmtDateTime_(getNow_())); alert_('Đã bật giả lập: ' + fmtDateTime_(getNow_()) + '. Nhớ tắt sau khi test.');
}
function menuClearSimNow(e) { requireOperator_(e); clearSimNow_(); logMenu_(e, 'SIM_NOW', 'SYSTEM', '', 'OFF'); alert_('Đã tắt giả lập thời gian.'); }
function menuSetup(e) { requireOperator_(e); var r = setupFirstRun(e); alert_(r.lines.join('\n')); }
function menuTestSystem(e) { requireOperator_(e); var r = testSystem(); alert_((r.errors.length ? 'CÓ ' + r.errors.length + ' LỖI\n' : 'KHÔNG CÓ LỖI\n') + r.lines.join('\n')); }
function menuCreateTriggers(e) { requireOwner_(e); var n = createTriggers_(); logMenu_(e, 'TRIGGERS_CREATED', 'SYSTEM', '', String(n)); alert_('Đã tạo ' + n + ' trigger.'); }

/** Tạo khoá bí mật cho đăng nhập Google (chunk 5D). Chỉ chủ file. Hiện một lần để dán vào dự án phụ. */
function menuGoogleLoginSecret(e) { requireOwner_(e);
  var ui = SpreadsheetApp.getUi(), had = !!props_().getProperty('GOOGLE_LOGIN_SECRET');
  if (had && ui.alert('Đã có khoá', 'Tạo khoá mới sẽ làm khoá cũ hết hiệu lực; phải dán lại vào dự án phụ. Tiếp tục?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var secret = createGoogleLoginSecret_();
  ui.alert('Khoá bí mật đăng nhập Google', 'Dán 2 dòng sau vào Script Properties của dự án phụ "thaiput Google login":\n\nGOOGLE_LOGIN_SECRET = ' + secret +
    '\nMAIN_URL = ' + (cfg_('WEBAPP_URL') || '(điền link web app chính)') + '\n\nKhông gửi khoá này qua email hay Zalo.', ui.ButtonSet.OK);
}
function createGoogleLoginSecret_() {
  var secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  props_().setProperty('GOOGLE_LOGIN_SECRET', secret);
  logActivity_(adminActor_(), 'GOOGLE_LOGIN_SECRET_CREATED', 'CONFIG', '', '');
  return secret;
}
