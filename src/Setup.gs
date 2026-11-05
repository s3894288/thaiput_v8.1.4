/**
 * Setup.gs · Cài đặt lần đầu, trigger, kiểm tra hệ thống (v8)
 *
 * Mỗi môi trường (STAGING, PRODUCTION) = một file Google Sheets + một Apps Script gắn vào file đó.
 * Chạy menu thaiput > 1. Cài đặt lần đầu trong file Sheets. Chạy lại bao nhiêu lần cũng an toàn:
 * chỉ tạo phần còn thiếu, không xoá dữ liệu.
 * Chạy được trên Gmail thường; khi chuyển sang Workspace chỉ cần sửa vài ô trong CONFIG.
 */

// Gói mặc định: [code, tên tiếng Việt, loại, số ngày, số buổi, giá, đang bán, tên tiếng Anh]. Giá để 0: admin điền giá thật.
function defaultPackages_() { return [
  ['TRIAL', 'Trial 2 buổi', 'DAYS', DEFAULTS_.PKG_TRIAL_DAYS, DEFAULTS_.TRIAL_SESSIONS, 0, true, 'Trial, 2 lessons'],
  ['PASS_2W', 'Gói 2 tuần', 'DAYS', DEFAULTS_.PKG_2W_DAYS, '', 0, true, '2 week pass'],
  ['PASS_1M', 'Gói 1 tháng', 'DAYS', DEFAULTS_.PKG_1M_DAYS, '', 0, true, '1 month pass']]; }   // 5L: bỏ hẳn LEGACY (gói chuyển từ v6)

var TRIGGER_HANDLERS_ = ['reminderJob', 'hourlyJob', 'dailyJob', 'sundayRemind', 'nightlyBackup', 'weeklyExport', 'onEditInstallable', 'calendarJob', 'onChangeInstallable'];
// Số trigger hệ thống tạo: 8 từ chunk 5J (bỏ 2 trigger sundayRemind Chủ nhật; nhắc tutor chạy trong hourlyJob). Tên sundayRemind vẫn
// nằm trong TRIGGER_HANDLERS_ để menu 3 xoá trigger cũ.
var TRIGGER_COUNT_ = 8;

function setupFirstRun(e) { requireOwner_(e); var r = setupCore_(SpreadsheetApp.getActive()); logMenu_(e, 'SETUP_RUN', 'SYSTEM', APP.VERSION, JSON.stringify({ version: APP.VERSION, steps: r.lines.length })); return r; }

/** Biến file Sheets đang mở thành PRODUCTION. Chạy một lần từ trình soạn Apps Script của bản thật. */
function switchToProduction(e) { requireOwner_(e);
  props_().setProperty('ENV', 'PRODUCTION');
  props_().setProperty('DB_ID_PRODUCTION', SpreadsheetApp.getActive().getId());
  forgetEnvMemo_();
  props_().deleteProperty('SIM_NOW');
  loadTestDisable_();   // chunk 5G: PRODUCTION không bao giờ mở cổng thử tải
  clearNowCache_();
  var r = setupFirstRun();
  // Chạy thật: khoá menu "Xoá dữ liệu test" (muốn mở lại phải tự sửa CONFIG, và chỉ chủ file chạy được).
  withLock_(function () { var t = table_('CONFIG'), row = t.byId('ALLOW_DATA_RESET'); if (row) t.update(row, { value: 'FALSE' }); else t.insert({ key: 'ALLOW_DATA_RESET', value: 'FALSE', note: '' }); });
  clearConfigCache_();
  r.lines.push('Đã khoá menu Xoá dữ liệu test (ALLOW_DATA_RESET = FALSE)');
  logMenu_(e, 'ENV_PRODUCTION', 'SYSTEM', SpreadsheetApp.getActive().getId(), APP.VERSION);
  return r;
}

var MIG_SHORT_ = { hashes: [], users: [] };
function setupCore_(ss) {
  var lines = [], env = getEnv_();
  props_().setProperty('ENV', env);
  props_().setProperty('DB_ID_' + env, ss.getId());
  forgetEnvMemo_(); clearDbCache_(); clearConfigCache_();
  try { ss.setSpreadsheetTimeZone(APP.TIMEZONE); } catch (e) { }
  lines.push('Môi trường: ' + env + ' · file ' + ss.getName());
  // Chunk 5G: phiên bản code đổi thì sao lưu DB vào Releases TRƯỚC khi đổi cấu trúc (không tự xoá).
  var relLine = releaseSnapshot_(ss); if (relLine) lines.push(relLine);
  // Chunk 5H: tab CONTENT bản cũ (một cột value) đổi tên thành CONTENT_CU_808 và ẩn đi; bước 1 tạo tab song ngữ mới,
  // sau bước gieo chữ thì chép lại chữ admin đã sửa. Không xoá tab cũ.
  var oldContent = contentDetachOld_(ss);
  if (oldContent) lines.push('Tab CONTENT bản cũ đổi tên thành ' + oldContent + ' (ẩn, giữ nguyên để đối chiếu)');

  // 1. Tab và cột
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name), cols = SCHEMA[name].cols;
    if (!sh) { sh = ss.insertSheet(name); lines.push('Tạo tab ' + name); }
    var header = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    var missing = cols.filter(function (c) { return header.indexOf(c) === -1; });
    if (missing.length) {
      // Ghi sau cột tiêu đề cuối cùng có chữ (không đếm số ô có chữ: có ô tiêu đề trống ở giữa sẽ ghi đè cột thật).
      var lastNonEmpty = 0; header.forEach(function (h, i) { if (String(h).trim() !== '') lastNonEmpty = i + 1; });
      var start = lastNonEmpty + 1, need = start + missing.length - 1;
      // Chunk 5M: tab mới của Google chỉ có 26 cột (A đến Z); BOOKINGS từ 8.1.0 có 27 cột. Thêm cột trước khi ghi tiêu đề.
      if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
      sh.getRange(1, start, 1, missing.length).setValues([missing]);
      if (header.length) lines.push('Thêm cột vào ' + name + ': ' + missing.join(', '));
    }
    try { sh.setFrozenRows(1); } catch (e) { }
    var full = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    // Tab mới của Google có 1.000 hàng; định dạng chữ cho mọi hàng hiện có, hàng thêm sau do Db.gs tự định dạng.
    var rows = sh.getMaxRows() - 1;
    (SCHEMA[name].text || []).forEach(function (c) { sh.getRange(2, full.indexOf(c) + 1, rows, 1).setNumberFormat('@'); });
  });
  if (!ss.getSheetByName('REPORT_MONTH')) ss.insertSheet('REPORT_MONTH');

  // 2. Dropdown cho admin
  Object.keys(dropdownSpec_()).forEach(function (n) { var sh = ss.getSheetByName(n); applyDropdowns_(sh, n, 2, sh.getMaxRows() - 1); });

  // 3. CONFIG: thêm khoá còn thiếu với giá trị mặc định
  clearDbCache_();
  var cfgT = table_('CONFIG'), have = {};
  cfgT.all().forEach(function (r) { have[r.key] = r; });
  var me = ''; try { me = Session.getEffectiveUser().getEmail(); } catch (e) { }
  var added = 0;
  // Chunk 5J: khoá đổi tên. Khoá cũ admin đã chỉnh (khác mặc định cũ): chép sang khoá mới TRƯỚC bước thêm mặc định; ghi chú khoá cũ.
  Object.keys(CFG_RENAMED_).forEach(function (k) {
    var r = CFG_RENAMED_[k], old = have[r[0]];
    if (old && !String(old.note || '').trim()) cfgT.update(old, { note: 'Không dùng từ ' + (r[2] || '8.1.1') + ', thay bằng ' + Object.keys(CFG_RENAMED_).filter(function (x) { return CFG_RENAMED_[x][0] === r[0]; }).join(', ') });
    if (have[k] || !old) return;
    var v = coerceCfg_(old.value, r[1]);
    if (v === r[1]) return;
    have[k] = cfgT.insert({ key: k, value: v, note: 'Chép từ ' + r[0] + ' (bản ' + (r[2] || '8.1.1') + ')' }); added++;
  });
  ['TUTOR_DEADLINE_HOUR', 'TUTOR_REMIND_HOURS', 'LOGIN_LINK_MAX_PER_WINDOW', 'LOGIN_LINK_WINDOW_MINUTES'].forEach(function (k) {
    if (have[k] && !String(have[k].note || '').trim()) cfgT.update(have[k], { note: 'Không dùng từ 8.1.1 (xem TUTOR_REMIND_AT, TUTOR_DEADLINE_AT, LOGIN_LINK_COOLDOWN_MINUTES)' });
  });
  if (have.ARCHIVE_LOG_KEEP_MONTHS && !String(have.ARCHIVE_LOG_KEEP_MONTHS.note || '').trim()) cfgT.update(have.ARCHIVE_LOG_KEEP_MONTHS, { note: 'Không dùng từ 8.1.2 (xem LOG_KEEP_DAYS)' });
  Object.keys(DEFAULTS_).forEach(function (k) {
    if (have[k]) return;
    var v = DEFAULTS_[k];
    if (k === 'ADMIN_EMAIL' && me) v = me;
    if (k === 'ALLOW_DATA_RESET') v = env !== 'PRODUCTION';   // STAGING: được xoá dữ liệu test; PRODUCTION: không
    cfgT.insert({ key: k, value: v, note: '' }); added++;
  });
  if (added) lines.push('Thêm ' + added + ' khoá cấu hình vào CONFIG');
  // 15/10: bỏ email nhắc 8:00 sáng (quyết định anh Chris). Chỉ đổi 1 lần, và chỉ khi ô còn giá trị mặc định cũ 8.
  if (have.MORNING_REMINDER_HOUR && String(have.MORNING_REMINDER_HOUR.value).trim() === '8' && !props_().getProperty('MIG_MORNING_OFF')) {
    cfgT.update(have.MORNING_REMINDER_HOUR, { value: '-1' }); lines.push('Tắt email nhắc 8:00 (MORNING_REMINDER_HOUR = -1)');
  }
  props_().setProperty('MIG_MORNING_OFF', '1');
  // 16/10 (quyết định anh Chris): Calendar QUEUE thay NIGHTLY, phiên tutor 30 ngày thay 90. Chỉ đổi 1 lần, và chỉ khi ô
  // còn đúng giá trị mặc định cũ (admin đã tự chọn giá trị khác thì giữ). Mẫu email STAFF_NEW_LOGIN cũ chỉ tới nút
  // "Thoát mọi thiết bị" đã bỏ: đổi sang câu mới nếu admin chưa sửa.
  if (!props_().getProperty('MIG_1610')) {
    [['CALENDAR_MODE', 'NIGHTLY', 'QUEUE'], ['TUTOR_SESSION_DAYS', '90', '30']].forEach(function (x) {
      var r = have[x[0]];
      if (r && String(r.value).trim().toUpperCase() === x[1]) { cfgT.update(r, { value: x[2] }); lines.push('Đổi ' + x[0] + ' từ ' + x[1] + ' sang ' + x[2] + ' (quyết định 16/10)'); }
    });
    // Phiên tutor đã cấp với hạn 90 ngày: rút về 30 ngày tính từ lúc đăng nhập (soát R1 L7, R2 T16).
    clearConfigCache_();
    var short = 0, td = Number(cfg_('TUTOR_SESSION_DAYS')) || 30, tutorIds = {};
    table_('USERS').all().forEach(function (u) { if (u.role === 'TUTOR') tutorIds[u.user_id] = true; });
    withLock_(function () {
      var at = table_('AUTH'), shortHashes = [], shortUsers = [];
      at.filter(function (a) { return a.kind === 'SESSION' && tutorIds[a.user_id]; }).forEach(function (a) {
        var cap = new Date(new Date(a.created_at).getTime() + td * 86400000);
        if (!isNaN(cap.getTime()) && new Date(a.expires_at) > cap) { at.update(a, { expires_at: cap }); short++; shortHashes.push(a.token_hash); if (shortUsers.indexOf(a.user_id) === -1) shortUsers.push(a.user_id); }
      });
      MIG_SHORT_ = { hashes: shortHashes, users: shortUsers };
      // Chữ web đã bỏ (danh sách thiết bị ở cổng học viên, tutor): xoá dòng cũ ở tab CONTENT để menu Làm mới chữ không cảnh báo (soát R2 T15).
      var gone = ['s.devices_title', 's.device_current', 's.device_since', 's.logout_all', 's.logout_all_q', 's.logout_all_yes', 's.logout_all_no', 's.logout_all_done',
        't.devices_title', 't.device_current', 't.device_since', 't.devices_note', 't.logout_all', 't.logout_all_q', 't.logout_all_yes', 't.logout_all_no', 't.logout_all_done'];
      var nGone = purgeRows_('CONTENT', function (r) { return gone.indexOf(String(r.key)) === -1; });
      if (nGone) lines.push('Xoá ' + nGone + ' dòng chữ web đã bỏ (thiết bị đăng nhập) ở tab CONTENT');
    });
    if (short) { forgetSessions_(MIG_SHORT_.hashes, MIG_SHORT_.users); lines.push('Rút ' + short + ' phiên tutor về hạn ' + td + ' ngày'); }
    var et0 = table_('EMAIL_TEMPLATES'), nl = et0.byId('STAFF_NEW_LOGIN'), d0 = DEFAULT_EMAIL_TEMPLATES_.STAFF_NEW_LOGIN;
    if (nl && /Thoát mọi thiết bị/.test(String(nl.body_vi)) && /Log out of all devices/.test(String(nl.body_en)) &&
        String(nl.body_vi).indexOf('vào mục Tài khoản, bấm **Thoát mọi thiết bị**, rồi nhắn Zalo admin.') !== -1) {
      et0.update(nl, { body_vi: d0[3], body_en: d0[6] }); lines.push('Cập nhật mẫu email STAFF_NEW_LOGIN (bỏ nút Thoát mọi thiết bị)');
    }
    props_().setProperty('MIG_1610', '1');
  }

  // 3b. Luật thông báo cho admin (chunk 5B): thêm sự kiện còn thiếu, không ghi đè dòng admin đã sửa
  var nr = table_('NOTIFY_RULES'), nAdded = 0;
  Object.keys(DEFAULT_NOTIFY_RULES_).forEach(function (ev) {
    if (nr.byId(ev)) return;
    var d = DEFAULT_NOTIFY_RULES_[ev];
    nr.insert({ event: ev, level: d[0], channel: d[1], note: d[2] }); nAdded++;
  });
  if (nAdded) lines.push('Thêm ' + nAdded + ' luật thông báo vào NOTIFY_RULES');
  var cs = seedContent_();
  if (cs.content || cs.templates) lines.push('Thêm ' + cs.content + ' dòng chữ web vào CONTENT, ' + cs.templates + ' mẫu email vào EMAIL_TEMPLATES');
  var carried = contentCarryPending_(ss);
  if (carried) {
    clearContentCache_();
    if (carried.missing) lines.push('CẢNH BÁO: không thấy tab ' + carried.sheet + ' để chép chữ đã sửa; chữ web dùng chữ gốc');
    else lines.push('Chép ' + carried.moved + ' chữ admin đã sửa từ tab ' + carried.sheet + ' sang CONTENT song ngữ (cột note ghi "Chép từ bản 8.0.8", nên xem lại)' +
      (carried.keys.length ? ': ' + carried.keys.slice(0, 15).join(', ') + (carried.keys.length > 15 ? '...' : '') : '') +
      (carried.skipped.length ? '; bỏ qua key không còn dùng: ' + carried.skipped.slice(0, 10).join(', ') : '') +
      (carried.kept && carried.kept.length ? '; giữ chữ đã sửa ở tab mới: ' + carried.kept.slice(0, 10).join(', ') : ''));
  }
  if (cs.upgraded) lines.push('Cập nhật ' + cs.upgraded + ' ô chữ web, mẫu email còn chữ gốc cũ sang chữ gốc mới (ô admin đã sửa giữ nguyên)');
  if (cs.marketing) lines.push('Thêm dòng ví dụ VI_DU vào MARKETING_EMAILS (status DRAFT, không tự gửi)');
  applyHighlights_(ss);

  // 4. Gói mặc định (giá để 0: admin điền giá thật trong tab PACKAGES)
  var pk = table_('PACKAGES');
  defaultPackages_().forEach(function (p) {
    var cur = pk.byId(p[0]);
    if (!cur) { pk.insert({ code: p[0], name: p[1], name_en: p[7], type: p[2], days: p[3], sessions: p[4], price_vnd: p[5], active: p[6] }); lines.push('Thêm gói ' + p[0]); return; }
    // Chunk 5I: cột name_en mới. Gói mặc định chưa đổi tên tiếng Việt thì điền sẵn tên tiếng Anh; gói đã đổi tên thì để admin tự điền.
    if ('name_en' in pk.colIndex && !String(cur.name_en || '').trim() && String(cur.name) === p[1]) { pk.update(cur, { name_en: p[7] }); lines.push('Điền tên tiếng Anh cho gói ' + p[0]); }
  });
  // 4a. Chunk 5L: bỏ hẳn gói LEGACY (chuyển từ v6). Chỉ xoá dòng khi không còn gói học viên nào mang mã này.
  removeLegacyPackage_(lines);
  // 4b. Chunk 5M (bản 8.1.0): chuyển buổi kỹ thuật cũ, ghi ngày bắt đầu cố định, tính lại gói theo luật bù buổi. Một lần (MIG_5M).
  migrate5M_().forEach(function (l) { lines.push(l); });
  // 4b2. Soát 5K: đổi tên file lưu trữ kiểu cũ.
  try { var rn = archiveRenameOldFiles_(); if (rn) lines.push('Đổi tên ' + rn + ' file lưu trữ sang tên mới (THAIPUT · Lưu trữ · ...)'); } catch (re2) { }
  // 4c. Chunk 5L: ghi tab META (phiên bản, mốc mã tự sinh) mỗi lần chạy menu 1, để chuyển hệ thống đọc được.
  try { withLock_(function () { writeMetaInLock_(); }); } catch (me) { lines.push('LƯU Ý: chưa ghi được tab META (' + me.message + ')'); }
  protectPackageCols_(ss, lines);

  // 5. Thư mục Drive và lịch Calendar
  clearConfigCache_();
  var setCfg = function (k, v) { var r = table_('CONFIG').byId(k); if (r) table_('CONFIG').update(r, { value: v }); else table_('CONFIG').insert({ key: k, value: v }); clearConfigCache_(); };
  if (!cfg_('UPLOADS_FOLDER_ID') || !cfg_('BACKUP_FOLDER_ID') || !cfg_('EXPORT_FOLDER_ID')) {
    var root = DriveApp.createFolder('THAIPUT_V8_' + env);
    setCfg('UPLOADS_FOLDER_ID', root.createFolder('Uploads').getId());
    setCfg('BACKUP_FOLDER_ID', root.createFolder('Backup').getId());
    setCfg('EXPORT_FOLDER_ID', root.createFolder('Export').getId());
    lines.push('Tạo thư mục Drive THAIPUT_V8_' + env + ' (Uploads, Backup, Export)');
  }
  if (!cfg_('LESSON_CALENDAR_ID')) {
    var cal = Calendar.Calendars.insert({ summary: 'Thaiput · Lịch học' + (env === 'PRODUCTION' ? '' : ' (' + env + ')'), timeZone: APP.TIMEZONE });
    setCfg('LESSON_CALENDAR_ID', cal.id);
    lines.push('Tạo lịch Calendar ' + cal.summary);
  }
  // Chỉ nhận link /exec (bản đã deploy). Chạy từ trình soạn thảo, Google có thể trả link /dev chỉ người sửa code mở được.
  try { var url = ScriptApp.getService().getUrl(); if (url && /\/exec$/.test(url) && !cfg_('WEBAPP_URL')) { setCfg('WEBAPP_URL', url); lines.push('Ghi WEBAPP_URL'); } } catch (e) { }

  // 6. Trigger
  lines.push('Trigger: ' + createTriggers_(ss) + ' cái');
  SpreadsheetApp.flush();
  var recLine = releaseRecord_(); if (recLine) lines.push(recLine);
  lines.push('Xong. Chạy tiếp menu 2. Kiểm tra hệ thống.');
  return { ok: true, lines: lines };
}

/**
 * Tô màu việc cần admin chú ý (chunk 5B). Chạy lại an toàn: thay toàn bộ luật tô màu của các tab này.
 *   NOTIFICATIONS: đỏ = CRITICAL chưa đọc, vàng = WARNING chưa đọc, xanh = đã tick ô read. Cột read là ô tick.
 *   REGISTRATIONS: vàng = Chờ duyệt.  AVAILABILITY: đỏ = tutor xin huỷ chờ duyệt, xám = BLOCKED.
 *   BOOKINGS: đỏ = TECH_ISSUE, vàng = STUDENT_ABSENT hoặc PENDING_REASSIGN.
 */
function applyHighlights_(ss) {
  var RED = '#f8d7da', YELLOW = '#fff3cd', GREEN = '#d1e7dd', GREY = '#e9ecef';
  var colLetter = function (sh, col) {
    var i = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String).indexOf(col), out = '';
    if (i === -1) return null;
    for (var n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out;   // 27 = AA
    return out;
  };
  var setRules = function (name, specs) {
    var sh = ss.getSheetByName(name); if (!sh) return;
    var width = sh.getLastColumn(), range = sh.getRange(2, 1, sh.getMaxRows() - 1, width);
    var rules = specs.map(function (sp) {
      var f = sp[0].replace(/\{(\w+)\}/g, function (m, c) { return '$' + colLetter(sh, c) + '2'; });
      return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f).setBackground(sp[1]).setRanges([range]).build();
    });
    sh.setConditionalFormatRules(rules);
  };
  setRules('NOTIFICATIONS', [['={read}=TRUE', GREEN], ['=AND({level}="CRITICAL",{read}<>TRUE)', RED], ['=AND({level}="WARNING",{read}<>TRUE)', YELLOW]]);
  setRules('REGISTRATIONS', [['={admin_action}="' + ADMIN_DECISION.PENDING + '"', YELLOW]]);
  setRules('AVAILABILITY', [['={status}="CANCEL_PENDING"', RED], ['={status}="BLOCKED"', GREY]]);
  // Chunk 5M: buổi kỹ thuật đỏ tới khi admin chọn lỗi (tech_decided_at có giá trị); chọn xong thì hết màu.
  var bkh = ss.getSheetByName('BOOKINGS'), hasDecided = bkh && bkh.getRange(1, 1, 1, bkh.getLastColumn()).getValues()[0].map(String).indexOf('tech_decided_at') !== -1;
  var hasNotice = bkh && bkh.getRange(1, 1, 1, bkh.getLastColumn()).getValues()[0].map(String).indexOf('result_notice_at') !== -1;
  // Chunk 5J: tutor quá hạn chọn kết quả (đã báo đỏ) và buổi Không hoàn thành: đỏ, tới khi có kết quả.
  setRules('BOOKINGS', [[hasDecided ? '=AND({status}="TECH_ISSUE",{tech_decided_at}="")' : '={status}="TECH_ISSUE"', RED]]
    .concat(hasNotice ? [['=OR(AND({status}="CONFIRMED",{result_notice_at}<>""),{status}="NOT_COMPLETED")', RED]] : [])
    .concat([['=OR({status}="STUDENT_ABSENT",{status}="PENDING_REASSIGN")', YELLOW]]));
  // Ô tick cột read: chỉ đặt cho hàng có dữ liệu (Db.gs tự đặt cho hàng mới). Bản 5B từng đặt cả cột: gỡ, và xoá FALSE ở hàng trống.
  var nt = ss.getSheetByName('NOTIFICATIONS');
  if (nt) {
    var hdr = nt.getRange(1, 1, 1, nt.getLastColumn()).getValues()[0].map(String), ci = hdr.indexOf('read') + 1, ii = hdr.indexOf('notif_id') + 1;
    if (ci > 0 && nt.getMaxRows() > 1) {
      nt.getRange(2, ci, nt.getMaxRows() - 1, 1).setDataValidation(null);
      var last = nt.getLastRow();
      if (last >= 2) {
        var ids = nt.getRange(2, ii, last - 1, 1).getValues(), reads = nt.getRange(2, ci, last - 1, 1).getValues(), dataRows = 0;
        for (var r = 0; r < ids.length; r++) { if (String(ids[r][0]) === '') { if (reads[r][0] === false) nt.getRange(r + 2, ci).clearContent(); } else dataRows = r + 1; }
        if (dataRows) nt.getRange(2, ci, dataRows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      }
    }
  }
}

/**
 * Đưa chữ web và mẫu email gốc vào 2 tab (chunk 5C, song ngữ 5H). Dòng CONTENT đã có: giữ nguyên chữ admin đã sửa (vi, en, note),
 * chỉ ghi lại các cột code quản lý. Dòng chưa có: thêm với chữ gốc, admin thấy và sửa trực tiếp.
 */
function seedContent_() {
  return withLock_(function () {
  var ct = table_('CONTENT'), et = table_('EMAIL_TEMPLATES'), nc = 0, ne = 0, nm = 0, nu = 0;
  var defs = contentDefaults_();
  // Chunk 5H: dòng chưa có thì thêm với chữ gốc ở cả cột vi và en (admin sửa thẳng trong ô). Dòng đã có: chỉ ghi lại các
  // cột code quản lý (page, position, shown_when, default_vi, default_en), không đụng chữ admin đã sửa.
  Object.keys(defs).forEach(function (k) {
    var d = defs[k], r = ct.byId(k), meta = { page: d.page, position: d.position, shown_when: d.shown_when, default_vi: d.vi, default_en: d.en };
    if (!r) { ct.insert(Object.assign({ key: k, vi: d.vi, en: d.en, note: '' }, meta)); nc++; return; }
    var patch = {}; Object.keys(meta).forEach(function (c) { if (String(r[c] === undefined || r[c] === null ? '' : r[c]) !== meta[c]) patch[c] = meta[c]; });
    // Chunk 5J: chữ gốc đổi mà ô vi hoặc en còn đúng chữ gốc cũ (admin chưa sửa): thay bằng chữ gốc mới. Ô admin đã sửa giữ nguyên.
    [['vi', 'default_vi'], ['en', 'default_en']].forEach(function (x) { var cur = String(r[x[0]] || ''), old = String(r[x[1]] || ''); if (old && cur === old && old !== meta[x[1]]) { patch[x[0]] = meta[x[1]]; nu++; } });
    if (Object.keys(patch).length) ct.update(r, patch);
  });
  Object.keys(DEFAULT_EMAIL_TEMPLATES_).forEach(function (k) {
    var cur = et.byId(k);
    if (cur && TEMPLATE_UPGRADES_[k]) {
      var up = {}, olds = TEMPLATE_UPGRADES_[k], dd = DEFAULT_EMAIL_TEMPLATES_[k];
      Object.keys(olds).forEach(function (c) { if (String(cur[c]) === olds[c]) up[c] = dd[TEMPLATE_COLS_.indexOf(c)]; });
      if (Object.keys(up).length) { et.update(cur, up); nu++; }
    }
    if (cur) return;
    var d = DEFAULT_EMAIL_TEMPLATES_[k];
    et.insert({ key: k, audience: d[0], active: true, subject_vi: d[1], title_vi: d[2], body_vi: d[3], subject_en: d[4], title_en: d[5], body_en: d[6], variables: d[7], note: '' });
    ne++;
  });
  // Email marketing: một dòng ví dụ khi tab còn trống, để admin thấy cách viết (DRAFT: menu gửi từ chối).
  var mt = table_('MARKETING_EMAILS');
  if (!mt.all().length) { mt.insert(MARKETING_EXAMPLE_); nm++; }
  clearContentCache_();
  return { content: nc, templates: ne, marketing: nm, upgraded: nu };
  });
}

/**
 * Chunk 5M, lớp 1: bảo vệ kiểu cảnh báo cho cột hệ thống của STUDENT_PACKAGES (Google hỏi lại trước khi sửa). Không chặn cứng được
 * chủ file; lớp 2 (onEdit trả lại) và lớp 3 (hourlyJob tự lành) lo phần còn lại. Chạy lại an toàn: gỡ bảo vệ cũ của hệ thống trước.
 */
var PKG_PROTECT_DESC_ = 'thaiput: ô hệ thống, không sửa tay';
function protectPackageCols_(ss, lines) {
  try {
    var sh = ss.getSheetByName('STUDENT_PACKAGES');
    if (!sh || !sh.protect) return;
    sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { if (p.getDescription() === PKG_PROTECT_DESC_) p.remove(); });
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), n = 0;
    PKG_SYSTEM_COLS_.forEach(function (c) {
      var i = hdr.indexOf(c) + 1;
      if (!i) return;
      // Vùng mở cả cột (ví dụ E2:E) để hàng thêm sau cũng được bảo vệ (soát kỹ thuật L9).
      var L = colLetter_(i);
      sh.getRange(L + '2:' + L).protect().setDescription(PKG_PROTECT_DESC_).setWarningOnly(true); n++;
    });
    if (n && lines) lines.push('Bảo vệ kiểu cảnh báo ' + n + ' cột hệ thống của STUDENT_PACKAGES');
  } catch (e) { if (lines) lines.push('LƯU Ý: không đặt được bảo vệ cột STUDENT_PACKAGES (' + e.message + '); onEdit vẫn trả lại giá trị'); }
}

/** Cột có dropdown cho admin chọn (REGISTRATIONS.admin_action, AVAILABILITY.admin_decision, BOOKINGS.admin_action). */
function dropdownSpec_() {
  var d = [ADMIN_DECISION.PENDING, ADMIN_DECISION.APPROVE, ADMIN_DECISION.REJECT], T = TUTOR_CANCEL_DECISION;
  return { REGISTRATIONS: { admin_action: d }, AVAILABILITY: { admin_decision: [T.PENDING, T.AUTO, T.ASSIGN, T.CANCEL, T.REJECT] }   /* 5K: bỏ 'Duyệt' khỏi danh sách; ô cũ ghi 'Duyệt' vẫn hiểu như tự chọn tutor thay */,
    BOOKINGS: { admin_action: BOOKING_ADMIN_ACTIONS }, EMAIL_TEMPLATES: { audience: ['STUDENT', 'TUTOR', 'ADMIN', 'ALL', 'MARKETING'] },
    MARKETING_EMAILS: { status: MARKETING_STATUSES_, audience: Object.keys(MARKETING_AUDIENCES_) }, USERS: { lang: LANGS_ }, NOTIFY_RULES: { level: ['CRITICAL', 'WARNING', 'INFO'], channel: ['EMAIL', 'DIGEST', 'LOG'] } };
}

/** Đặt dropdown cho n hàng bắt đầu từ fromRow. Db.gs gọi lại khi tự thêm hàng để hàng mới vẫn có dropdown. */
function applyDropdowns_(sh, tableName, fromRow, n) {
  var spec = dropdownSpec_()[tableName];
  if (!spec || n <= 0) return;
  var full = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  Object.keys(spec).forEach(function (col) {
    var i = full.indexOf(col);
    if (i === -1) return;
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(spec[col], true).setAllowInvalid(false).build();
    sh.getRange(fromRow, i + 1, n, 1).setDataValidation(rule);
  });
}

/** Xoá trigger cũ của hệ thống rồi tạo lại đúng TRIGGER_COUNT_ cái (chạy lại an toàn, không tạo trùng). */
function createTriggers_(ss) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('reminderJob').timeBased().everyMinutes(15).create();
  // Hàng đợi Calendar (chunk 5F). Không có việc thì thoát ngay, không mở Sheets (xem CalendarQueue.gs).
  ScriptApp.newTrigger('calendarJob').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('hourlyJob').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(6).inTimezone(APP.TIMEZONE).create();
  ScriptApp.newTrigger('nightlyBackup').timeBased().everyDays(1).atHour(2).inTimezone(APP.TIMEZONE).create();
  ScriptApp.newTrigger('weeklyExport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(3).inTimezone(APP.TIMEZONE).create();
  ScriptApp.newTrigger('onEditInstallable').forSpreadsheet(ss || SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('onChangeInstallable').forSpreadsheet(ss || SpreadsheetApp.getActive()).onChange().create();
  saveSheetSnapshot_(ss);   // danh sách tab để trigger onChange biết đúng tab bị xoá, đổi tên (soát 5I vòng 2 N3)
  return ScriptApp.getProjectTriggers().filter(function (t) { return TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1; }).length;
}

/** Kiểm tra toàn bộ cấu hình. Trả { errors, warnings, lines }. */
function testSystem(e) { requireOperator_(e);
  var errors = [], warnings = [], lines = [];
  var ok = function (m) { lines.push('ĐẠT  ' + m); };
  var err = function (m) { errors.push(m); lines.push('LỖI  ' + m); };
  var warn = function (m) { warnings.push(m); lines.push('LƯU Ý  ' + m); };
  clearDbCache_(); clearConfigCache_(); clearNowCache_();
  var ss;
  try { ss = dbSpreadsheet_(); ok('Mở được file DB (' + getEnv_() + ')'); } catch (e) { err(e.message); return { errors: errors, warnings: warnings, lines: lines }; }
  Object.keys(SCHEMA).forEach(function (t) { try { table_(t); } catch (e) { err(e.message); } });
  if (!errors.length) ok('Đủ ' + Object.keys(SCHEMA).length + ' tab và cột');
  if (Session.getScriptTimeZone() !== APP.TIMEZONE) err('Múi giờ Apps Script là ' + Session.getScriptTimeZone() + ', phải là ' + APP.TIMEZONE + ' (Project Settings)'); else ok('Múi giờ Apps Script đúng');
  try { if (ss.getSpreadsheetTimeZone() !== APP.TIMEZONE) err('Múi giờ file Sheets sai: File > Settings > Time zone'); else ok('Múi giờ file Sheets đúng'); } catch (e) { }
  // Chunk 5J: lịch tutor dạng THỨ GIỜ hợp lệ; đăng nhập Google cho admin là đường chính.
  var sch = tutorSchedule_();
  if (sch.errors.length) sch.errors.forEach(function (x) { err(x + ' (đang dùng mặc định)'); });
  else ok('Lịch tutor: nhắc ' + cfgList_('TUTOR_REMIND_AT').join(', ') + ', hạn mở lịch ' + cfg_('TUTOR_DEADLINE_AT') + ', thông báo học viên từ ' + cfg_('STUDENT_WEEK_BANNER_FROM'));
  var glUrl = String(cfg_('GOOGLE_LOGIN_URL') || ''), glKey = !!props_().getProperty('GOOGLE_LOGIN_SECRET');
  if (!glUrl || !glKey) warn('Đăng nhập Google cho admin chưa cài xong (' + (!glUrl ? 'GOOGLE_LOGIN_URL trống' : '') + (!glUrl && !glKey ? ', ' : '') + (!glKey ? 'chưa tạo khoá bí mật: menu Đăng nhập Google' : '') + '). Admin đang đăng nhập bằng link email ' + linkMinutesFor_({ role: 'ADMIN' }) + ' phút');
  else ok('Đăng nhập Google cho admin đã cài' + (cfg_('ADMIN_LINK_LOGIN') ? ' (link email dự phòng đang bật: ADMIN_LINK_LOGIN)' : ''));
  // 5K (BL06): gói đang bán có giá 0 không chọn được trên web (chỉ nút Zalo). Không còn gói có giá thì không ai đăng ký được.
  try {
    var dfs = pkgDefs_(), sale = Object.keys(dfs).filter(function (k) { return dfs[k].active; });
    var free = sale.filter(function (k) { return !(dfs[k].price_vnd > 0); });
    if (sale.length && free.length === sale.length) warn('QUAN TRỌNG: mọi gói đang bán đều có giá 0 trong PACKAGES, trang đăng ký không có gói nào chọn được (chỉ nút Zalo). Điền price_vnd cho gói bán trên web');
    else if (free.length) warn('Gói đang bán có giá 0 (chỉ đăng ký qua Zalo, không chọn được trên web): ' + free.join(', '));
    if (free.length && !String(cfg_('ADMIN_ZALO_URL') || '').trim()) warn('Có gói giá 0 nhưng ADMIN_ZALO_URL trống: gói đó không có nút Zalo');
  } catch (pe) { }
  var calId = cfg_('LESSON_CALENDAR_ID');
  if (!calId) err('Thiếu LESSON_CALENDAR_ID: chạy lại Cài đặt lần đầu');
  else { try { var tz = Calendar.Calendars.get(calId).timeZone; if (tz !== APP.TIMEZONE) err('Múi giờ lịch Calendar là ' + tz); else ok('Lịch Calendar đúng múi giờ'); } catch (e) { err('Không mở được lịch Calendar: ' + e.message + ' (bật dịch vụ Calendar trong Services)'); } }
  ['UPLOADS_FOLDER_ID', 'BACKUP_FOLDER_ID', 'EXPORT_FOLDER_ID'].forEach(function (k) {
    try { DriveApp.getFolderById(cfg_(k)); } catch (e) { err('Thư mục ' + k + ' không mở được'); }
  });
  var trig = ScriptApp.getProjectTriggers().filter(function (t) { return TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1; }).length;
  if (trig !== TRIGGER_COUNT_) err('Có ' + trig + '/' + TRIGGER_COUNT_ + ' trigger: chạy menu 3. Tạo lại trigger'); else ok('Đủ ' + TRIGGER_COUNT_ + ' trigger');
  if (!cfg_('ADMIN_EMAIL')) err('Thiếu ADMIN_EMAIL trong CONFIG');
  var nSlots = 0; try { nSlots = slotList_().length; } catch (e) { }
  if (!nSlots) err('Khung giờ SLOT_START, SLOT_LAST trong CONFIG không đọc được: sửa lại dạng 08:00 và 23:30 (ô định dạng văn bản)'); else ok('Có ' + nSlots + ' slot mỗi ngày (' + cfg_('SLOT_START') + ' đến ' + cfg_('SLOT_LAST') + ')');
  if (!cfg_('ADMIN_ZALO_URL') || !cfg_('ADMIN_PHONE')) warn('Chưa điền ADMIN_ZALO_URL hoặc ADMIN_PHONE: nút liên hệ admin sẽ ẩn');
  var wurl = String(cfg_('WEBAPP_URL') || '');
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(wurl)) err('WEBAPP_URL chưa đúng (đang là "' + wurl + '"): Deploy > Manage deployments, chép link kết thúc bằng /exec vào CONFIG. Link đăng nhập trong email dùng link này, không dùng link Google Sites.');
  else ok('WEBAPP_URL là link /exec');
  // Link hiện trên trang web: chỉ https mới hiện (trang tự ẩn link khác để chống chèn mã), nên báo trước cho admin.
  ['ADMIN_ZALO_URL', 'SCHOOL_SITE_URL', 'POLICY_URL', 'GOOGLE_LOGIN_URL'].forEach(function (k) { var v = String(cfg_(k) || ''); if (v && !/^https:\/\/[^\s"'<>]+$/i.test(v)) warn(k + ' không bắt đầu bằng https:// nên trang web sẽ ẩn link này: ' + v); });
  if (!cfg_('BANK_ACCOUNT')) warn('Chưa điền thông tin ngân hàng (BANK_NAME, BANK_ACCOUNT, BANK_HOLDER)');
  // 5L: kiểm mọi dòng PACKAGES (mã trùng, kiểu, số ngày, số buổi, giá).
  try { var pi = packageIssues_(table_('PACKAGES').all()); pi.errors.forEach(err); pi.warnings.forEach(warn); if (!pi.errors.length) ok('PACKAGES: ' + table_('PACKAGES').all().length + ' dòng hợp lệ'); } catch (pe2) { err('Kiểm PACKAGES lỗi: ' + pe2.message); }
  if (!activeTutors_().length) warn('Chưa có tutor: dùng menu Thêm tutor');
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM' && activeTutors_().some(function (t) { return t.status === USER_STATUS.ACTIVE && !t.meet_room; })) err('MEET_MODE = TUTOR_ROOM nhưng có tutor chưa có meet_room');
  try { if (props_().getProperty('SIM_NOW')) warn('Đang bật giả lập thời gian: ' + fmtDateTime_(getNow_())); } catch (e) { }
  // Chunk 5G
  try { var mm = maintMode_(); if (mm !== 'OFF') warn('Đang BẢO TRÌ (' + mm + '): học viên, tutor ' + (mm === 'CLOSED' ? 'không vào được cổng' : 'chỉ xem được') + '. Tắt: menu Bảo trì: tắt'); } catch (e) { }
  try {
    if (props_().getProperty('LOADTEST_SECRET')) { if (isProduction_()) err('PRODUCTION có khoá thử tải: chạy switchToProduction lại hoặc xoá Script Property LOADTEST_SECRET'); else if (loadTestOn_()) warn('Cổng thử tải đang mở (tự đóng lúc ' + fmtDateTime_(new Date(Number(props_().getProperty('LOADTEST_UNTIL')))) + ')'); }
  } catch (e) { }
  try { var opn = ARCHIVE_TABS_.filter(function (t) { return props_().getProperty('ARCH_OPEN_' + t); }); if (opn.length) warn('Lưu trữ có lô dở ở ' + opn.join(', ') + ': lượt lưu trữ sau tự hoàn tất (hoặc menu Lưu trữ: chạy ngay)'); } catch (e) { }
  if (cfg_('ARCHIVE_FOLDER_ID')) { try { if (DriveApp.getFolderById(cfg_('ARCHIVE_FOLDER_ID')).isTrashed()) err('Thư mục lưu trữ (ARCHIVE_FOLDER_ID) đang ở thùng rác: khôi phục ngay (Google xoá hẳn sau 30 ngày)'); } catch (e) { err('Thư mục ARCHIVE_FOLDER_ID không mở được: lưu trữ sẽ dừng'); } }
  try { var apr = props_().getProperties(); Object.keys(apr).forEach(function (k) {
    if (k.indexOf('ARCH_FILE_' + getEnv_() + '_') === 0) { try { if (DriveApp.getFileById(apr[k]).isTrashed()) err('File lưu trữ năm ' + k.split('_').pop() + ' đang ở thùng rác: khôi phục ngay'); } catch (fe) { err('Không mở được file lưu trữ năm ' + k.split('_').pop()); } }
    if (k.indexOf('PURGE_OPEN_') === 0) warn('Tab ' + k.substring(11) + ' có lần bỏ dòng dở: job mỗi giờ tự dọn (hoặc chạy hourlyJob)');
  }); } catch (e) { }
  try { var bk = table_('BOOKINGS').all().length; if (bk > 15000) warn('BOOKINGS có ' + bk + ' dòng: kiểm ARCHIVE_ENABLED, ARCHIVE_KEEP_MONTHS (đặt lịch chậm dần khi tab lớn)'); } catch (e) { }
  // Chunk 5I: hạn mức email kèm giải thích (Workspace dùng thử chỉ khoảng 100, không phải 1.500).
  // Chunk 5Q: đường gửi email và tài khoản gửi. Trigger gửi thư dưới tài khoản đã chạy menu 3, trang web dưới tài khoản đã Triển khai.
  try {
    var mb = mailBudget_(), snd = mailSender_(), adm = (cfgList_('ADMIN_EMAIL')[0] || '').toLowerCase();
    lines.push('Đường gửi email: ' + mailTransport_() + (String(cfg_('MAIL_TRANSPORT') || '').trim() && String(cfg_('MAIL_TRANSPORT')).trim().toUpperCase() !== mailTransport_() ? ' (ô MAIL_TRANSPORT gõ sai, đang dùng mặc định)' : ''));
    if (mailTransport_() === 'MAILAPP') warn('MAIL_TRANSPORT = MAILAPP: thư từng bị trả về trên tên miền của trường. Chỉ dùng khi GMAILAPP hỏng; sửa xong đổi lại GMAILAPP.');
    if (snd && adm && snd.toLowerCase() !== adm) warn('Menu đang chạy bằng ' + snd + ', khác ADMIN_EMAIL (' + adm + '). Trigger gửi thư từ tài khoản đã chạy menu 3, trang web từ tài khoản đã Triển khai: hai việc này phải làm bằng cùng một tài khoản chủ hệ thống. Cố ý để ADMIN_EMAIL là hộp thư khác thì bỏ qua dòng này.');
    // 5Q: file MailFix.gs cũ còn trong dự án thì testMailFix là hàm công khai không kiểm quyền (trang web mở cho mọi người, luật 24).
    if (typeof testMailFix === 'function' || typeof sendEmailFix_ === 'function') err('Dự án Apps Script còn file MailFix.gs cũ: xoá file đó ngay (từ 8.1.4 gửi email cố định, không cần MailFix, không tìm và thay).');
    if (mb < 0) warn('Không đọc được hạn mức email (Google chưa cấp quyền gửi thư): chạy menu Email → Kiểm tra gửi email để cấp quyền.');
    else { var qi = mailQuotaInfo_(mb, mailSentToday_(), snd); qi.lines.forEach(function (l) { lines.push(l); }); qi.warnings.forEach(warn); }
  } catch (e) { }
  return { errors: errors, warnings: warnings, lines: lines };
}
function pkgDefsList_() { var d = pkgDefs_(); return Object.keys(d).map(function (k) { return d[k]; }); }

/** Chunk 5L: xoá dòng PACKAGES mã LEGACY khi không còn STUDENT_PACKAGES nào dùng (anh xác nhận không có). Ghi PACKAGE_REMOVED. */
function removeLegacyPackage_(lines) { return withLock_(function () {
  var pk = table_('PACKAGES');
  if (!pk.all().some(function (p) { return String(p.code).trim() === 'LEGACY'; })) return 0;
  var used = table_('STUDENT_PACKAGES').all().filter(function (sp) { return String(sp.package_code).trim() === 'LEGACY'; }).length;
  if (used) { lines.push('CHÚ Ý: còn ' + used + ' gói học viên mang mã LEGACY nên chưa xoá dòng gói LEGACY'); return 0; }
  var n = purgeRows_('PACKAGES', function (p) { return String(p.code).trim() !== 'LEGACY'; });
  if (n) { logActivity_(adminActor_(), 'PACKAGE_REMOVED', 'PACKAGES', 'LEGACY', ''); lines.push('Xoá dòng gói LEGACY (không còn học viên dùng)'); }
  return n;
}); }
