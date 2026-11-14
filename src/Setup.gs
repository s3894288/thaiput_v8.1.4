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
  upgradeStart_(ss);   // 5R: nhớ file mới tinh hay đã có dữ liệu, bắt đầu đo những gì lượt này làm (Release.gs)
  props_().setProperty('ENV', env);
  props_().setProperty('DB_ID_' + env, ss.getId());
  forgetEnvMemo_(); clearDbCache_(); clearConfigCache_();
  try { ss.setSpreadsheetTimeZone(APP.TIMEZONE); } catch (e) { }
  lines.push('Môi trường: ' + env + ' · file ' + ss.getName() + ' · phiên bản code ' + APP.VERSION + ' (' + APP.VERSION_DATE + ')');
  // Chunk 5G: phiên bản code đổi thì sao lưu DB vào Releases TRƯỚC khi đổi cấu trúc (không tự xoá).
  var relLine = releaseSnapshot_(ss); if (relLine) lines.push(relLine);
  // Chunk 5H: tab CONTENT bản cũ (một cột value) đổi tên thành CONTENT_CU_808 và ẩn đi; bước 1 tạo tab song ngữ mới,
  // sau bước gieo chữ thì chép lại chữ admin đã sửa. Không xoá tab cũ.
  var oldContent = contentDetachOld_(ss);
  if (oldContent) lines.push('Tab CONTENT bản cũ đổi tên thành ' + oldContent + ' (ẩn, giữ nguyên để đối chiếu)');

  // 1. Tab và cột
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name), cols = SCHEMA[name].cols;
    if (!sh) { sh = ss.insertSheet(name); lines.push('Tạo tab ' + name); upgradeAdd_('TAB_ADDED', name, 'Tab mới ' + name + ' (' + cols.length + ' cột)', 'New tab ' + name + ' (' + cols.length + ' columns)'); }
    var header = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    var missing = cols.filter(function (c) { return header.indexOf(c) === -1; });
    if (missing.length) {
      // Ghi sau cột tiêu đề cuối cùng có chữ (không đếm số ô có chữ: có ô tiêu đề trống ở giữa sẽ ghi đè cột thật).
      var lastNonEmpty = 0; header.forEach(function (h, i) { if (String(h).trim() !== '') lastNonEmpty = i + 1; });
      var start = lastNonEmpty + 1, need = start + missing.length - 1;
      // Chunk 5M: tab mới của Google chỉ có 26 cột (A đến Z); BOOKINGS từ 8.1.0 có 27 cột. Thêm cột trước khi ghi tiêu đề.
      if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
      sh.getRange(1, start, 1, missing.length).setValues([missing]);
      if (header.length) { lines.push('Thêm cột vào ' + name + ': ' + missing.join(', ')); missing.forEach(function (c) { upgradeAdd_('COLUMN_ADDED', name + '.' + c, 'Cột mới ' + name + '.' + c + ' (thêm ở bên phải, dòng cũ để trống)', 'New column ' + name + '.' + c + ' (added on the right, old rows empty)'); }); }
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

  // 2b. Gộp dòng trùng key ở EMAIL_TEMPLATES và CONTENT TRƯỚC khi gieo chữ gốc (soát T1): một key một dòng, không mất chữ admin sửa.
  // Chữ admin bị bỏ luôn được ghi đủ vào ACTIVITY_LOG (TEMPLATE_DEDUPE_TEXT) trước khi ghi đè. Sao lưu trước cập nhật hỏng: không gộp key nào sẽ bỏ chữ admin.
  var dupRep = [], dupFail = null;
  try { dupRep = dedupeDuplicateKeys_({ protectText: RELEASE_SNAPSHOT_FAILED_ }); }
  catch (de) { dupFail = de; dupRep = de.partial || []; }
  try {
    var dupLines = dupReportLines_(dupRep);
    dupLines.forEach(function (l) { lines.push(l); });
    dupRep.forEach(function (p, i) {
      if (p.skipped) { upgradeAdd_('DUP_SKIPPED', p.tab + '.' + p.key, dupLines[i], 'NOT merged: key ' + p.key + ' in ' + p.tab + ' (rows ' + p.rows.join(', ') + ') because the pre-upgrade backup failed and the merge would discard admin text; rows left as they are.'); return; }
      upgradeAdd_('DUP_MERGED', p.tab + '.' + p.key, dupLines[i], 'Merged ' + p.rows.length + ' duplicate rows of key ' + p.key + ' in ' + p.tab + ' into one (rows ' + p.rows.join(', ') + '); admin edits kept.');
    });
    // Mâu thuẫn ở ô active: dòng riêng, nổi bật (không chôn trong dòng gộp dài), và có trong tóm tắt cập nhật.
    dupActiveWarnings_(dupRep).forEach(function (w) { lines.push(w.vi); upgradeAdd_('DUP_ACTIVE', w.tab + '.' + w.key, w.vi, w.en); });
  } catch (de3) { lines.push('LƯU Ý: chưa lập được dòng báo gộp key trùng (' + de3.message + ').'); }
  if (dupFail) lines.push('CẢNH BÁO: chưa gộp được dòng trùng key ở EMAIL_TEMPLATES, CONTENT (' + dupFail.message + '). Menu 2 vẫn báo key trùng; chạy lại menu 1 sau khi xem tab.');

  // 3. CONFIG: thêm khoá còn thiếu với giá trị mặc định
  clearDbCache_();
  var cfgT = table_('CONFIG'), have = {};
  cfgT.all().forEach(function (r) { have[r.key] = r; });
  var me = ''; try { me = Session.getEffectiveUser().getEmail(); } catch (e) { }
  var added = 0;
  // 5R: lượt cập nhật phiên bản trên file đã có dữ liệu thì khoá CONFIG thêm mới được ghi chú "Mới ở <bản>: ..." (không bao giờ ghi đè ô có sẵn).
  var upgrading = !!UPGRADE_RUN_ && !UPGRADE_RUN_.fresh && props_().getProperty('APP_VERSION_LAST') !== APP.VERSION;
  // Chunk 5J: khoá đổi tên. Khoá cũ admin đã chỉnh (khác mặc định cũ): chép sang khoá mới TRƯỚC bước thêm mặc định; ghi chú khoá cũ.
  Object.keys(CFG_RENAMED_).forEach(function (k) {
    var r = CFG_RENAMED_[k], old = have[r[0]];
    if (old && !String(old.note || '').trim()) cfgT.update(old, { note: 'Không dùng từ ' + (r[2] || '8.1.1') + ', thay bằng ' + Object.keys(CFG_RENAMED_).filter(function (x) { return CFG_RENAMED_[x][0] === r[0]; }).join(', ') });
    if (have[k] || !old) return;
    var v = coerceCfg_(old.value, r[1]);
    if (v === r[1]) return;
    have[k] = cfgT.insert({ key: k, value: v, note: 'Chép từ ' + r[0] + ' (bản ' + (r[2] || '8.1.1') + ')' }); added++;
    upgradeAdd_('CONFIG_RENAMED', k, 'Khoá ' + k + ' chép từ ' + r[0] + ' (admin đã chỉnh khoá cũ), giá trị ' + String(v), 'Key ' + k + ' copied from ' + r[0] + ' (admin had changed the old key), value ' + String(v));
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
    cfgT.insert({ key: k, value: v, note: upgrading ? releaseConfigNote_(k, APP.VERSION) : '' }); added++;
    var shown = String(v === '' ? 'trống' : v).substring(0, 80), shownEn = String(v === '' ? 'empty' : v).substring(0, 80);
    upgradeAdd_('CONFIG_ADDED', k, 'Khoá CONFIG mới ' + k + ', giá trị mặc định: ' + shown, 'New CONFIG key ' + k + ', default value: ' + shownEn);
  });
  try { upgradeUnknownConfig_(cfgT.all()); } catch (ue) { }
  if (added) lines.push('Thêm ' + added + ' khoá cấu hình vào CONFIG');
  // 15/10: bỏ email nhắc 8:00 sáng (quyết định anh Chris). Chỉ đổi 1 lần, và chỉ khi ô còn giá trị mặc định cũ 8.
  if (have.MORNING_REMINDER_HOUR && String(have.MORNING_REMINDER_HOUR.value).trim() === '8' && !props_().getProperty('MIG_MORNING_OFF')) {
    cfgT.update(have.MORNING_REMINDER_HOUR, { value: '-1' }); lines.push('Tắt email nhắc 8:00 (MORNING_REMINDER_HOUR = -1)');
    upgradeAdd_('MIGRATION', 'MIG_MORNING_OFF', 'Tắt email nhắc 8:00 (MORNING_REMINDER_HOUR = -1, ô còn giá trị mặc định cũ 8)', 'Turned off the 8:00 reminder email (MORNING_REMINDER_HOUR = -1, the cell still had the old default 8)');
  }
  props_().setProperty('MIG_MORNING_OFF', '1');
  // 16/10 (quyết định anh Chris): Calendar QUEUE thay NIGHTLY, phiên tutor 30 ngày thay 90. Chỉ đổi 1 lần, và chỉ khi ô
  // còn đúng giá trị mặc định cũ (admin đã tự chọn giá trị khác thì giữ). Mẫu email STAFF_NEW_LOGIN cũ chỉ tới nút
  // "Thoát mọi thiết bị" đã bỏ: đổi sang câu mới nếu admin chưa sửa.
  if (!props_().getProperty('MIG_1610')) {
    var n1610 = lines.length;
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
    lines.slice(n1610).forEach(function (l) { upgradeAdd_('MIGRATION', 'MIG_1610', l, l); });   // 5R: đo đúng những gì bước này làm
  }

  // 3b. Luật thông báo cho admin (chunk 5B): thêm sự kiện còn thiếu, không ghi đè dòng admin đã sửa
  var nr = table_('NOTIFY_RULES'), nAdded = 0;
  Object.keys(DEFAULT_NOTIFY_RULES_).forEach(function (ev) {
    if (nr.byId(ev)) return;
    var d = DEFAULT_NOTIFY_RULES_[ev];
    nr.insert({ event: ev, level: d[0], channel: d[1], note: d[2] }); nAdded++;
    upgradeAdd_('NOTIFY_RULE_ADDED', ev, 'Luật thông báo mới ' + ev + ' (' + d[0] + ', ' + d[1] + ')', 'New notification rule ' + ev + ' (' + d[0] + ', ' + d[1] + ')');
  });
  if (nAdded) lines.push('Thêm ' + nAdded + ' luật thông báo vào NOTIFY_RULES');
  var cs = seedContent_();
  (cs.contentKeys || []).forEach(function (k) { upgradeAdd_('CONTENT_ADDED', k, 'Dòng chữ web mới ' + k, 'New web text row ' + k); });
  (cs.templateKeys || []).forEach(function (k) { upgradeAdd_('TEMPLATE_ADDED', k, 'Mẫu email mới ' + k, 'New email template ' + k); });
  (cs.refreshed || []).forEach(function (x) { upgradeAdd_('CONTENT_REFRESHED', x.key + ' (' + x.col + ')', 'Ô ' + x.col + ' của ' + x.key + ' chưa bị sửa nên nâng lên chữ gốc mới', 'Cell ' + x.col + ' of ' + x.key + ' was not edited so it was upgraded to the new default'); });
  (cs.kept || []).forEach(function (x) { upgradeAdd_('CONTENT_KEPT', x.key + ' (' + x.col + ')', 'Ô ' + x.col + ' của ' + x.key + ' bạn đã sửa nên GIỮ nguyên dù chữ gốc đổi; chữ gốc mới nằm ở cột default_' + x.col, 'Cell ' + x.col + ' of ' + x.key + ' was edited by you so it is KEPT although the default changed; the new default is in column default_' + x.col); });
  (cs.templatesUpgraded || []).forEach(function (x) { upgradeAdd_('TEMPLATE_UPGRADED', x.key, 'Mẫu email ' + x.key + ' còn chữ gốc cũ nên nâng lên chữ gốc mới (ô: ' + x.cols.join(', ') + ')', 'Email template ' + x.key + ' still had the old default so it was upgraded (cells: ' + x.cols.join(', ') + ')'); });
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
  if (carried && !carried.missing && carried.moved) upgradeAdd_('MIGRATION', 'CONTENT_CU_808', 'Chép ' + carried.moved + ' chữ admin đã sửa từ tab CONTENT bản cũ sang CONTENT song ngữ', 'Copied ' + carried.moved + ' admin-edited texts from the old CONTENT tab into the bilingual CONTENT');
  if (cs.marketing) lines.push('Thêm dòng ví dụ VI_DU vào MARKETING_EMAILS (status DRAFT, không tự gửi)');
  applyHighlights_(ss);

  // 4. Gói mặc định (giá để 0: admin điền giá thật trong tab PACKAGES)
  var pk = table_('PACKAGES');
  defaultPackages_().forEach(function (p) {
    var cur = pk.byId(p[0]);
    if (!cur) { pk.insert({ code: p[0], name: p[1], name_en: p[7], type: p[2], days: p[3], sessions: p[4], price_vnd: p[5], active: p[6] }); lines.push('Thêm gói ' + p[0]); return; }
    // Chunk 5I: cột name_en mới. Gói mặc định chưa đổi tên tiếng Việt thì điền sẵn tên tiếng Anh; gói đã đổi tên thì để admin tự điền.
    if ('name_en' in pk.colIndex && !String(cur.name_en || '').trim() && String(cur.name) === p[1]) { pk.update(cur, { name_en: p[7] }); lines.push('Điền tên tiếng Anh cho gói ' + p[0]); upgradeAdd_('DATA_FILLED', 'PACKAGES.' + p[0], 'Điền tên tiếng Anh cho gói ' + p[0] + ' (ô name_en trống, tên tiếng Việt còn là tên gốc)', 'Filled the English name of package ' + p[0] + ' (name_en was empty and the Vietnamese name was still the default)'); }
  });
  // 4a. Chunk 5L: bỏ hẳn gói LEGACY (chuyển từ v6). Chỉ xoá dòng khi không còn gói học viên nào mang mã này.
  removeLegacyPackage_(lines);
  // 4b. Chunk 5M (bản 8.1.0): chuyển buổi kỹ thuật cũ, ghi ngày bắt đầu cố định, tính lại gói theo luật bù buổi. Một lần (MIG_5M).
  migrate5M_().forEach(function (l) { lines.push(l); upgradeAdd_('MIGRATION', 'MIG_5M', l, l); });
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
  RELEASE_SUMMARY_LINES_.forEach(function (l) { lines.push(l); });   // 5R: tóm tắt cập nhật (chỉ có khi phiên bản đổi trên file đã có dữ liệu)
  lines.push('Xong. Chạy tiếp menu 2. Kiểm tra hệ thống.');
  return { ok: true, lines: lines };
}

/**
 * Tô màu việc cần admin chú ý (chunk 5B, đổi 5N). Chạy lại an toàn: thay toàn bộ luật tô màu của các tab này.
 * Luật đầu tiên khớp thắng (Sheets), nên thứ tự trong danh sách là thứ tự ưu tiên. Màu và cách làm hết màu: PROGRESS.md mục 5N.
 *   NOTIFICATIONS: đỏ = CRITICAL chưa đọc, vàng = WARNING chưa đọc, xanh = đã tick ô read. Cột read là ô tick.
 *   REGISTRATIONS: vàng = Chờ duyệt.  AVAILABILITY: đỏ = tutor xin huỷ chờ duyệt, xám = BLOCKED.
 *   BOOKINGS (5N): đỏ = tutor quá hạn chọn kết quả, Không hoàn thành chưa xử lý; cam đậm = Chờ đổi tutor (luôn hiện);
 *     hồng = Vấn đề kỹ thuật chưa chọn lỗi; vàng = Vắng học viên chưa xử lý (BL13); xanh dương nhạt = buổi được bù; xám = Huỷ muộn.
 *     "Chưa xử lý" = admin_done_at trống hoặc cũ hơn result_at (kết quả đổi sau lần admin xử lý trước thì hiện lại).
 *   STUDENT_PACKAGES (5N): đỏ = còn thông báo COMP_ON_EXPIRED chưa đọc (chờ admin cộng tay comp_days_admin); xám = hết hạn;
 *     vàng = còn EXPIRY_NOTICE_DAYS ngày; tím = admin đã cộng tay; xanh dương = có ngày bù.
 * Vùng tô màu phủ từ hàng 2 tới hết tab; tab tự thêm hàng (Db.gs ensureRows_) thì nới vùng các luật đang có (extendHighlightRanges_),
 * không thay luật: luật admin tự thêm vẫn giữ. Đổi EXPIRY_NOTICE_DAYS trong CONFIG: chạy lại menu 1 để màu vàng đổi theo.
 */
var HL_ = { RED: '#ea9999', ORANGE: '#f6b26b', PINK: '#f9d2e4', YELLOW: '#fff3cd', LIGHT_BLUE: '#cfe2f3', BLUE: '#9fc5e8',
  PURPLE: '#d9d2e9', GREEN: '#d1e7dd', GREY: '#e9ecef', SOFT_RED: '#f8d7da' };
var HIGHLIGHT_TABLES_ = ['NOTIFICATIONS', 'REGISTRATIONS', 'AVAILABILITY', 'BOOKINGS', 'STUDENT_PACKAGES'];

/** Chữ cột (A, B, ..., AA) của một cột theo tên ở hàng tiêu đề; null nếu tab không có cột đó. */
function hlColLetter_(sh, col) {
  if (!sh || sh.getLastColumn() < 1) return null;
  var i = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String).indexOf(col), out = '';
  if (i === -1) return null;
  for (var n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out;   // 27 = AA
  return out;
}

/** Luật tô màu của một tab: danh sách [công thức, màu]. {cột} là ô cùng hàng; [[TAB.cột]] là cả cột ở tab khác (qua INDIRECT). */
function highlightSpecs_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var has = function (c) { return !!hlColLetter_(sh, c); };
  if (name === 'NOTIFICATIONS') return [['={read}=TRUE', HL_.GREEN], ['=AND({level}="CRITICAL",{read}<>TRUE)', HL_.SOFT_RED], ['=AND({level}="WARNING",{read}<>TRUE)', HL_.YELLOW]];
  if (name === 'REGISTRATIONS') return [['={admin_action}="' + ADMIN_DECISION.PENDING + '"', HL_.YELLOW]];
  if (name === 'AVAILABILITY') return [['={status}="CANCEL_PENDING"', HL_.SOFT_RED], ['={status}="BLOCKED"', HL_.GREY]];
  if (name === 'BOOKINGS') {
    // Thiếu cột (chưa chạy menu 1 sau khi dán code): dùng luật cũ, không viết công thức trỏ vào cột không có.
    var open = has('admin_done_at') ? 'OR({admin_done_at}="",{admin_done_at}<{result_at})' : 'TRUE';
    var red = [];
    if (has('result_notice_at')) red.push('AND({status}="CONFIRMED",{result_notice_at}<>"")');
    red.push('AND({status}="NOT_COMPLETED",' + open + ')');
    return [
      ['=OR(' + red.join(',') + ')', HL_.RED],
      ['={status}="PENDING_REASSIGN"', HL_.ORANGE],
      [has('tech_decided_at') ? '=AND({status}="TECH_ISSUE",{tech_decided_at}="")' : '={status}="TECH_ISSUE"', HL_.PINK],
      ['=AND({status}="STUDENT_ABSENT",' + open + ')', HL_.YELLOW],
      has('comp_days') ? ['=N({comp_days})>0', HL_.LIGHT_BLUE] : null,
      ['={status}="CANCELLED_LATE"', HL_.GREY]
    ].filter(Boolean);
  }
  if (name === 'STUDENT_PACKAGES') {
    var nt = ss.getSheetByName('NOTIFICATIONS'), canNotif = nt && hlColLetter_(nt, 'entity_id') && hlColLetter_(nt, 'event') && hlColLetter_(nt, 'read');
    return [
      // IF: hàng trống không chạy COUNTIFS trên cả cột NOTIFICATIONS (Sheets bỏ qua nhánh không dùng).
      canNotif ? ['=IF({sp_id}="",FALSE,COUNTIFS([[NOTIFICATIONS.entity_id]],{sp_id},[[NOTIFICATIONS.event]],"COMP_ON_EXPIRED",[[NOTIFICATIONS.read]],"<>TRUE")>0)', HL_.RED] : null,
      ['={status}="' + PKG_STATUS.EXPIRED + '"', HL_.GREY],
      ['=AND({status}="' + PKG_STATUS.ACTIVE + '",{end_date}<>"",{end_date}>=TODAY(),{end_date}-TODAY()<=' + Number(cfg_('EXPIRY_NOTICE_DAYS')) + ')', HL_.YELLOW],
      has('comp_days_admin') ? ['=N({comp_days_admin})<>0', HL_.PURPLE] : null,
      has('comp_days') ? ['=N({comp_days})>0', HL_.BLUE] : null
    ].filter(Boolean);
  }
  return [];
}

/** Đặt lại luật tô màu một tab, vùng từ hàng 2 tới hết tab. */
function applyHighlightsFor_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh || sh.getMaxRows() < 2) return 0;
  var range = sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getLastColumn());
  var rules = highlightSpecs_(ss, name).map(function (sp) {
    var f = sp[0].replace(/\[\[(\w+)\.(\w+)\]\]/g, function (m, tab, c) { var l = hlColLetter_(ss.getSheetByName(tab), c); return 'INDIRECT("' + tab + '!$' + l + '$2:$' + l + '")'; })
      .replace(/\{(\w+)\}/g, function (m, c) { return '$' + hlColLetter_(sh, c) + '2'; });
    return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f).setBackground(sp[1]).setRanges([range]).build();
  });
  sh.setConditionalFormatRules(rules);
  return rules.length;
}

/**
 * Tab vừa thêm hàng (oldMax → newMax): mọi luật tô màu (của hệ thống và của admin) có vùng chạm hàng cuối cũ được nới tới hàng cuối mới.
 * Không đổi công thức, màu hay thứ tự luật. Trả số luật đã nới.
 */
function extendHighlightRanges_(sheet, oldMax, newMax) {
  var rules = sheet.getConditionalFormatRules(), n = 0;
  if (!rules || !rules.length) return 0;
  var out = rules.map(function (r) {
    var changed = false;
    var rs = r.getRanges().map(function (g) {
      if (g.getRow() + g.getNumRows() - 1 < oldMax) return g;
      changed = true;
      return sheet.getRange(g.getRow(), g.getColumn(), newMax - g.getRow() + 1, g.getNumColumns());
    });
    if (!changed) return r;
    n++;
    return r.copy().setRanges(rs).build();
  });
  if (n) sheet.setConditionalFormatRules(out);
  return n;
}

function applyHighlights_(ss) {
  HIGHLIGHT_TABLES_.forEach(function (name) { applyHighlightsFor_(ss, name); });
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
  // 5R: danh sách những gì seedContent_ thực sự làm, cho tóm tắt cập nhật (Release.gs). Chỉ đọc thêm, không đổi cách gieo.
  var contentKeys = [], templateKeys = [], refreshed = [], kept = [], templatesUpgraded = [];
  var defs = contentDefaults_();
  // Soát T1: tìm dòng theo key đã cắt khoảng trắng (đúng như emailTemplate_ và contentMapLoad_ đọc lúc chạy). byId so khớp
  // nguyên văn nên ô key có dấu cách thừa ("LOGIN_LINK ") làm gieo chữ thêm một dòng trùng. Trùng key còn sót: lấy dòng cuối (dòng đang dùng khi gửi).
  var ctBy = rowsByTrimmedKey_(ct), etBy = rowsByTrimmedKey_(et);
  // Chunk 5H: dòng chưa có thì thêm với chữ gốc ở cả cột vi và en (admin sửa thẳng trong ô). Dòng đã có: chỉ ghi lại các
  // cột code quản lý (page, position, shown_when, default_vi, default_en), không đụng chữ admin đã sửa.
  Object.keys(defs).forEach(function (k) {
    var d = defs[k], r = ctBy[k] || null, meta = { page: d.page, position: d.position, shown_when: d.shown_when, default_vi: d.vi, default_en: d.en };
    if (!r) { ctBy[k] = ct.insert(Object.assign({ key: k, vi: d.vi, en: d.en, note: '' }, meta)); nc++; contentKeys.push(k); return; }
    var patch = {}; Object.keys(meta).forEach(function (c) { if (String(r[c] === undefined || r[c] === null ? '' : r[c]) !== meta[c]) patch[c] = meta[c]; });
    // Chunk 5J: chữ gốc đổi mà ô vi hoặc en còn đúng chữ gốc cũ (admin chưa sửa): thay bằng chữ gốc mới. Ô admin đã sửa giữ nguyên.
    [['vi', 'default_vi'], ['en', 'default_en']].forEach(function (x) {
      var cur = String(r[x[0]] || ''), old = String(r[x[1]] || '');
      if (old && cur === old && old !== meta[x[1]]) { patch[x[0]] = meta[x[1]]; nu++; refreshed.push({ key: k, col: x[0] }); }
      else if (old && old !== meta[x[1]] && cur !== meta[x[1]]) kept.push({ key: k, col: x[0] });   // chữ gốc đổi, ô admin đã sửa: giữ, báo để admin biết có chữ gốc mới
    });
    if (Object.keys(patch).length) ct.update(r, patch);
  });
  Object.keys(DEFAULT_EMAIL_TEMPLATES_).forEach(function (k) {
    var cur = etBy[k] || null;
    if (cur && TEMPLATE_UPGRADES_[k]) {
      var up = {}, olds = TEMPLATE_UPGRADES_[k], dd = DEFAULT_EMAIL_TEMPLATES_[k];
      Object.keys(olds).forEach(function (c) { if (String(cur[c]) === olds[c]) up[c] = dd[TEMPLATE_COLS_.indexOf(c)]; });
      if (Object.keys(up).length) { et.update(cur, up); nu++; templatesUpgraded.push({ key: k, cols: Object.keys(up) }); }
    }
    if (cur) return;
    var d = DEFAULT_EMAIL_TEMPLATES_[k];
    etBy[k] = et.insert({ key: k, audience: d[0], active: true, subject_vi: d[1], title_vi: d[2], body_vi: d[3], subject_en: d[4], title_en: d[5], body_en: d[6], variables: d[7], note: '' });
    ne++; templateKeys.push(k);
  });
  // Email marketing: một dòng ví dụ khi tab còn trống, để admin thấy cách viết (DRAFT: menu gửi từ chối).
  var mt = table_('MARKETING_EMAILS');
  if (!mt.all().length) { mt.insert(MARKETING_EXAMPLE_); nm++; }
  clearContentCache_();
  return { content: nc, templates: ne, marketing: nm, upgraded: nu, contentKeys: contentKeys, templateKeys: templateKeys, refreshed: refreshed, kept: kept, templatesUpgraded: templatesUpgraded };
  });
}

/** Bảng key (đã cắt khoảng trắng) → dòng, cho tab có cột key. Key trùng: dòng CUỐI thắng, đúng như emailTemplate_ lúc gửi (soát T1). */
function rowsByTrimmedKey_(table) {
  var m = Object.create(null);
  table.all().forEach(function (r) { var k = String(r.key === undefined || r.key === null ? '' : r.key).trim(); if (k) m[k] = r; });
  return m;
}

/*
 * Soát T1: dòng trùng key ở EMAIL_TEMPLATES và CONTENT.
 * Nguyên nhân chứng minh được (test I141 f): seedContent_ tìm dòng bằng byId, so khớp NGUYÊN VĂN, trong khi lúc chạy emailTemplate_ và
 * contentMapLoad_ cắt khoảng trắng key. Ô key có dấu cách thừa (gõ hay dán tay) thì menu 1 coi là "chưa có" và gieo thêm một dòng cùng key.
 * Đã sửa (seedContent_ dùng rowsByTrimmedKey_) và có bước gộp dưới đây cho dòng trùng đã tồn tại.
 * Trước khi gộp, lúc gửi email dùng dòng CUỐI của key (emailTemplate_), còn DbTable.byId và TEMPLATE_UPGRADES_ tác động dòng ĐẦU.
 * Không đổi byId toàn cục (mọi tab dùng); chờ menu 1 gộp, menu 2 báo key trùng.
 */

/** Chữ cắt gọn để ghi báo cáo và nhật ký. */
function dupTrunc_(v) { var s = String(v === undefined || v === null ? '' : v); return s.length > 300 ? s.substring(0, 300) + '...' : s; }

/**
 * Hàm thuần: gộp các dòng cùng key thành một. rows theo thứ tự trong tab (dòng đầu là dòng giữ lại).
 * spec: { key, cols (ô admin sửa), fixed (ô code quản lý: lấy dòng đầu, trống thì lấy dòng sau có chữ),
 *   start: 'row' (ô của dòng cuối, như emailTemplate_) hoặc 'nonEmpty' (ô có chữ cuối cùng, như contentMapLoad_),
 *   isDefault(col, giá trị, dòng) → true nếu ô là chữ gốc (chữ gốc hiện tại hoặc chữ gốc cũ) }.
 * Mỗi ô: bắt đầu từ giá trị đang có hiệu lực; nếu trống hoặc là chữ gốc mà dòng khác có chữ admin sửa thì lấy chữ admin sửa (dòng gần cuối nhất);
 * hai bản admin sửa khác nhau: giữ bản đang có hiệu lực, ghi bản bị bỏ vào báo cáo. Trả { patch (cho dòng đầu), cells, removed }.
 */
function dupMergeRows_(rows, spec) {
  var patch = {}, cells = [], first = rows[0], active = null, pick = {}, paired = {};
  var has = function (v) { return !(v === undefined || v === null || String(v) === ''); };
  spec.cols.forEach(function (c) {
    var vals = rows.map(function (r) { return r[c]; });
    var admin = function (i) { return has(vals[i]) && !spec.isDefault(c, vals[i], rows[i]); };
    var cur = vals.length - 1;
    if (spec.start === 'nonEmpty') { while (cur >= 0 && !has(vals[cur])) cur--; }
    var chosen = cur, adopted = false;
    if (cur < 0 || !admin(cur)) {
      for (var j = vals.length - 1; j >= 0; j--) if (admin(j)) { chosen = j; adopted = true; break; }
    }
    pick[c] = chosen;
    var value = chosen < 0 ? '' : vals[chosen], seen = {}, discarded = [];
    for (var i = vals.length - 1; i >= 0; i--) {
      if (i === chosen || !admin(i) || String(vals[i]) === String(value) || seen[String(vals[i])]) continue;
      // text: bản cắt gọn cho dòng chữ của menu 1; full: chữ đầy đủ, ghi nguyên vẹn vào ACTIVITY_LOG trước khi ghi đè (dupTextLogRows_).
      seen[String(vals[i])] = true; discarded.push({ row: rows[i]._row, text: dupTrunc_(vals[i]), full: String(vals[i]) });
    }
    if (chosen >= 0 && String(first[c] === undefined || first[c] === null ? '' : first[c]) !== String(value)) patch[c] = value;
    if (adopted || discarded.length) cells.push({ col: c, adopted_from: adopted ? rows[chosen]._row : null, kept_row: chosen >= 0 ? rows[chosen]._row : null, discarded: discarded });
  });
  // Ô trạng thái bật tắt (EMAIL_TEMPLATES.active): KHÔNG phải chữ để chọn bản "admin sửa". Dòng CUỐI luôn thắng, đúng cái emailTemplate_ đang dùng
  // lúc gửi thư (bản 8.1.4 cũng đọc dòng cuối), theo cả hai chiều: gộp không bao giờ đổi việc một email đang gửi hay đang tắt.
  if (spec.stateCol) {
    var sc = spec.stateCol, lastRow = rows[rows.length - 1], lastOn = spec.isOn(lastRow[sc]);
    if (String(first[sc] === undefined || first[sc] === null ? '' : first[sc]) !== String(lastRow[sc] === undefined || lastRow[sc] === null ? '' : lastRow[sc])) patch[sc] = lastRow[sc] === undefined || lastRow[sc] === null ? '' : lastRow[sc];
    var opposite = rows.filter(function (r) { return spec.isOn(r[sc]) !== lastOn; }).map(function (r) { return r._row; });
    if (opposite.length) active = { col: sc, kept_on: lastOn, kept_row: lastRow._row, opposite_rows: opposite };
  }
  // Ô chữ gốc ghi kèm (CONTENT.default_vi, default_en) lấy từ CÙNG dòng với ô chữ đã chọn (vi, en): "ô bằng chữ gốc đã ghi" phải còn đúng sau khi gộp.
  // Lấy từ dòng đầu trong khi vi lấy từ dòng khác thì lần gieo chữ sau coi ô chưa sửa là "admin đã sửa" (CONTENT_KEPT) và không bao giờ nâng chữ gốc mới.
  Object.keys(spec.paired || {}).forEach(function (d) {
    var src = pick[spec.paired[d]];
    if (src === undefined || src < 0 || !has(rows[src][d])) return;
    paired[d] = true;
    if (String(first[d] === undefined || first[d] === null ? '' : first[d]) !== String(rows[src][d])) patch[d] = rows[src][d];
  });
  (spec.fixed || []).forEach(function (c) {
    if (paired[c] || has(first[c])) return;
    for (var j = rows.length - 1; j > 0; j--) if (has(rows[j][c])) { patch[c] = rows[j][c]; return; }
  });
  return { patch: patch, cells: cells, removed: rows.length - 1, active: active };
}

/** Quy tắc gộp của từng tab. */
function dupSpec_(tab) {
  if (tab === 'EMAIL_TEMPLATES') return {
    cols: ['subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'note'], fixed: ['audience', 'variables'], start: 'row',
    stateCol: 'active', isOn: emailActiveOn_,
    isDefault: function (c, v, row) {
      var key = String(row.key).trim();
      var s = String(v).trim(), d = DEFAULT_EMAIL_TEMPLATES_[key], i = TEMPLATE_COLS_.indexOf(c), old = TEMPLATE_UPGRADES_[key] && TEMPLATE_UPGRADES_[key][c];
      return (d && i !== -1 && s === String(d[i]).trim()) || (old !== undefined && s === String(old).trim());
    }
  };
  var defs = contentDefaults_();
  return {
    cols: ['vi', 'en', 'note'], fixed: ['page', 'position', 'shown_when', 'default_vi', 'default_en'], paired: { default_vi: 'vi', default_en: 'en' }, start: 'nonEmpty',
    isDefault: function (c, v, row) {
      if (c === 'note') return false;
      var s = String(v).trim(), d = defs[String(row.key).trim()];
      return (d && s === String(d[c]).trim()) || (String(row['default_' + c] || '').trim() !== '' && s === String(row['default_' + c]).trim());
    }
  };
}

/** Hàm thuần: kế hoạch gộp một tab (danh sách dòng) → [{ tab, key, rows, removed, patch, cells }] cho các key xuất hiện hơn một lần. */
function dupPlanTab_(tab, rows) {
  var groups = {}, order = [], spec = dupSpec_(tab);
  rows.forEach(function (r) {
    var k = String(r.key === undefined || r.key === null ? '' : r.key).trim();
    if (!k) return;
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(r);
  });
  return order.filter(function (k) { return groups[k].length > 1; }).map(function (k) {
    var g = groups[k], m = dupMergeRows_(g, spec);
    if (String(g[0].key) !== k) m.patch.key = k;   // key ghi SAU cùng các ô khác (DbTable.update kiểm lại khoá dòng theo cột key)
    return { tab: tab, key: k, first: g[0], rows: g.map(function (r) { return r._row; }), removed: m.removed, patch: m.patch, cells: m.cells, active: m.active };
  });
}

/** Hàm thuần: số key trùng của một tab → [{ key, rows }]. Menu 2 dùng. */
function dupKeysOf_(rows) {
  var g = {}, order = [];
  rows.forEach(function (r) { var k = String(r.key === undefined || r.key === null ? '' : r.key).trim(); if (!k) return; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(r._row); });
  return order.filter(function (k) { return g[k].length > 1; }).map(function (k) { return { key: k, rows: g[k] }; });
}

/** Cỡ tối đa (ký tự, tính theo dạng JSON đã thoát) của chữ trong MỘT ô nhật ký khi lưu chữ admin bị bỏ. Giới hạn của Sheets là 50.000 ký tự mỗi ô; chừa dư cho phần bọc. */
var DUP_TEXT_CHUNK_ = 30000;
/** Cỡ tối đa (ký tự) của ô chi tiết dòng tóm tắt TEMPLATE_DEDUPE; danh sách dài hơn thì cắt bớt kèm số còn lại. */
var DUP_SUMMARY_MAX_ = 30000;

/**
 * Hàm thuần: chia chữ thành các đoạn sao cho mỗi đoạn, sau khi thoát JSON (xuống dòng, dấu nháy kép, ký tự điều khiển dài hơn 1 ký tự), không quá maxJson ký tự.
 * Không cắt giữa một cặp thay thế (ký tự ngoài BMP). Nối các đoạn lại cho đúng chữ gốc. Chữ rỗng trả [''].
 */
function dupSplitText_(text, maxJson) {
  var s = String(text === undefined || text === null ? '' : text), parts = [], cur = '', curLen = 0, i = 0;
  while (i < s.length) {
    var cp = s.charCodeAt(i), len = (cp >= 0xD800 && cp <= 0xDBFF && i + 1 < s.length) ? 2 : 1, ch = s.substr(i, len), el = JSON.stringify(ch).length - 2;
    if (curLen + el > maxJson && cur) { parts.push(cur); cur = ''; curLen = 0; }
    cur += ch; curLen += el; i += len;
  }
  parts.push(cur);
  return parts;
}

/**
 * Hàm thuần: các dòng nhật ký TEMPLATE_DEDUPE_TEXT cho MỌI bản chữ admin bị bỏ của một kế hoạch gộp (không cắt chữ). Mỗi bản bị bỏ một hoặc nhiều dòng;
 * chữ dài chia nhiều dòng (part 1..parts) để ô không bao giờ vượt giới hạn Sheets. Khôi phục: chọn các dòng cùng entity, entity_id, col, row, nối text theo part.
 */
function dupTextLogRows_(p) {
  var out = [];
  p.cells.forEach(function (c) {
    c.discarded.forEach(function (d) {
      var parts = dupSplitText_(d.full, DUP_TEXT_CHUNK_);
      parts.forEach(function (txt, i) {
        out.push({ tab: p.tab, key: p.key, detail: JSON.stringify({ col: c.col, row: d.row, kept_row: c.kept_row, part: i + 1, parts: parts.length, chars: String(d.full).length, text: txt }) });
      });
    });
  });
  return out;
}

/** Hàm thuần: chi tiết dòng tóm tắt TEMPLATE_DEDUPE: không chứa chữ bị bỏ (đã ở dòng TEMPLATE_DEDUPE_TEXT riêng), và không bao giờ quá DUP_SUMMARY_MAX_ ký tự. */
function dupSummaryDetail_(plan) {
  var items = plan.map(function (p) {
    return { key: String(p.key).substring(0, 120), rows: p.rows.slice(0, 40), rows_total: p.rows.length, active: p.active || undefined,
      cells: p.cells.map(function (c) { return { col: c.col, adopted_from: c.adopted_from, kept_row: c.kept_row, discarded: c.discarded.map(function (d) { return { row: d.row, chars: String(d.full).length }; }) }; }) };
  });
  var out = [], used = 2;
  for (var i = 0; i < items.length; i++) {
    var j = JSON.stringify(items[i]);
    if (used + j.length + 60 > DUP_SUMMARY_MAX_ && out.length) { out.push({ truncated: items.length - i }); break; }
    out.push(items[i]); used += j.length + 1;
  }
  var s = JSON.stringify(out);
  return s.length > DUP_SUMMARY_MAX_ ? JSON.stringify([{ truncated: items.length }]) : s;
}

/** Hàm thuần: kế hoạch này có bỏ chữ admin đã sửa không (bản bị bỏ khác bản giữ). Chỉ ô chữ, không tính ô active (dòng cuối luôn thắng, báo riêng). */
function dupDiscardsText_(p) { return p.cells.some(function (c) { return c.discarded.length > 0; }); }

/**
 * Menu 1: gộp mỗi key trùng thành MỘT dòng, ở vị trí dòng đầu tiên. Chạy trong khoá. Không có key trùng: không ghi gì, không đụng tab.
 * Thứ tự: ghi nhật ký (TEMPLATE_DEDUPE mỗi tab một dòng tóm tắt, và MỖI bản chữ admin bị bỏ một hoặc nhiều dòng TEMPLATE_DEDUPE_TEXT, chữ đầy đủ),
 * GHI XUỐNG SHEETS NGAY (flushDb_) rồi mới ghi ô vào dòng đầu (DbTable.update), rồi purgeRows_ bỏ dòng sau (quyết định theo nội dung đọc mới, luật 10).
 * Ghi nhật ký lỗi thì ném lỗi, tab đó không bị gộp (e.partial = báo cáo các tab đã gộp xong). opts.protectText (sao lưu trước cập nhật hỏng): key nào gộp
 * sẽ bỏ chữ admin thì để nguyên dòng trùng (entry skipped: true), key chỉ có dòng giống nhau hay chữ admin so với chữ gốc vẫn gộp.
 * Trả [{ tab, key, rows, removed, cells, active, skipped }].
 */
function dedupeDuplicateKeys_(opts) {
  opts = opts || {};
  return withLock_(function () {
    var all = [];
    try {
      ['EMAIL_TEMPLATES', 'CONTENT'].forEach(function (tab) {
        var t = table_(tab), full = dupPlanTab_(tab, t.all());
        if (!full.length) return;
        var plan = [], keep = {};
        full.forEach(function (p) {
          if (opts.protectText && dupDiscardsText_(p)) { keep[p.key] = true; all.push({ tab: p.tab, key: p.key, rows: p.rows, removed: 0, cells: p.cells, active: p.active, skipped: true }); }
          else plan.push(p);
        });
        if (!plan.length) return;
        logActivity_(adminActor_(), 'TEMPLATE_DEDUPE', tab, String(plan.length), dupSummaryDetail_(plan));
        plan.forEach(function (p) { dupTextLogRows_(p).forEach(function (r) { logActivity_(adminActor_(), 'TEMPLATE_DEDUPE_TEXT', r.tab, r.key, r.detail); }); });
        // Nhật ký (kể cả chữ admin sắp bị bỏ) phải nằm trong Sheets TRƯỚC khi ghi đè dòng đầu: ghi ngay, không chờ purgeRows_. Ghi lỗi thì dừng, chưa đụng tab.
        flushDb_(); SpreadsheetApp.flush();
        plan.forEach(function (p) {
          if (!Object.keys(p.patch).length) return;
          // Ô key ghi sau cùng: DbTable.update kiểm lại khoá dòng bằng chính cột key.
          var patch = {}, k;
          for (k in p.patch) if (k !== 'key') patch[k] = p.patch[k];
          if ('key' in p.patch) patch.key = p.patch.key;
          t.update(p.first, patch);
        });
        var seen = {}, want = plan.reduce(function (n, p) { return n + p.removed; }, 0);
        var got = purgeRows_(tab, function (o) {
          var k = String(o.key === undefined || o.key === null ? '' : o.key).trim();
          if (!k || keep[k]) return true;
          if (seen[k]) return false;
          seen[k] = true; return true;
        });
        if (got !== want) throw new Error('Gộp dòng trùng ' + tab + ': dự định bỏ ' + want + ' dòng, thực tế bỏ ' + got + ' (kiểm tab rồi chạy lại menu 1)');
        plan.forEach(function (p) { all.push({ tab: p.tab, key: p.key, rows: p.rows, removed: p.removed, cells: p.cells, active: p.active }); });
      });
    } catch (e) { e.partial = all; throw e; }
    return all;
  });
}

/** Cảnh báo tiếng Việt cho menu 2 và nút cập nhật chữ: mỗi key xuất hiện hơn một lần ở EMAIL_TEMPLATES hoặc CONTENT. */
function dupKeyWarnings_() {
  var out = [];
  ['EMAIL_TEMPLATES', 'CONTENT'].forEach(function (tab) {
    dupKeysOf_(table_(tab).all()).forEach(function (d) {
      out.push(tab + ': key "' + d.key + '" xuất hiện ' + d.rows.length + ' lần (hàng ' + d.rows.join(', ') + '). Khi gửi hoặc hiện trang, hệ thống dùng dòng cuối; chạy menu 1 để gộp thành một dòng (không mất chữ admin đã sửa).');
    });
  });
  return out;
}

/** Hàm thuần: báo cáo gộp → các dòng chữ tiếng Việt cho kết quả menu 1 (mỗi phần tử báo cáo đúng một dòng). Dòng chỉ cắt gọn chữ bị bỏ; chữ đầy đủ nằm ở ACTIVITY_LOG. */
function dupReportLines_(report) {
  return (report || []).map(function (p) {
    if (p.skipped) return 'CẢNH BÁO: KHÔNG gộp key trùng ' + p.tab + ': ' + p.key + ' (hàng ' + p.rows.join(', ') + ') vì chưa sao lưu được trước cập nhật mà việc gộp sẽ bỏ chữ admin đã sửa. Để nguyên các dòng; chạy menu "Phát hành: sao lưu ngay" rồi chạy lại menu 1 (menu 2 vẫn báo key trùng).';
    var s = 'Gộp dòng trùng ' + p.tab + ': key ' + p.key + ' có ' + p.rows.length + ' dòng (hàng ' + p.rows.join(', ') + '), giữ 1 dòng ở hàng ' + p.rows[0] + ', bỏ ' + p.removed + ' dòng';
    p.cells.forEach(function (c) {
      if (c.adopted_from) s += '; ô ' + c.col + ' lấy chữ admin đã sửa ở hàng ' + c.adopted_from;
      c.discarded.forEach(function (d) { s += '; ô ' + c.col + ' có 2 bản admin sửa khác nhau, giữ bản ở hàng ' + c.kept_row + ' (dòng đang dùng), BỎ bản ở hàng ' + d.row + ': "' + d.text + '"' + (String(d.full).length > 300 ? ' (' + String(d.full).length + ' ký tự, dòng này chỉ hiện 300 ký tự đầu)' : ''); });
      if (c.discarded.length) s += ' [chữ đầy đủ đã lưu ở tab ACTIVITY_LOG: hành động TEMPLATE_DEDUPE_TEXT, entity ' + p.tab + ', entity_id ' + p.key + ']';
    });
    return s;
  });
}

/**
 * Hàm thuần: báo cáo gộp → MỘT dòng cảnh báo nổi bật cho mỗi key mà các dòng trùng nói khác nhau về ô active (EMAIL_TEMPLATES). Dòng cuối luôn thắng:
 * trạng thái giữ lại đúng là cái hệ thống đang dùng lúc gửi thư trước khi gộp. Trả [{ tab, key, vi, en, state: 'ON' | 'OFF', rows }].
 */
function dupActiveWarnings_(report) {
  return (report || []).filter(function (p) { return p.active && !p.skipped; }).map(function (p) {
    var a = p.active, on = a.kept_on, rows = a.opposite_rows.join(', ');
    return { tab: p.tab, key: p.key, state: on ? 'ON' : 'OFF', rows: a.opposite_rows,
      vi: 'CHÚ Ý QUAN TRỌNG: mẫu email ' + p.key + ' có nhiều dòng nói KHÁC NHAU về ô active. Đã giữ trạng thái của dòng cuối (hàng ' + a.kept_row + '): ' + (on ? 'ĐANG GỬI' : 'ĐANG TẮT') +
        ', đúng như hệ thống đang làm trước khi gộp; dòng ở hàng ' + rows + ' ghi ngược lại (' + (on ? 'tắt' : 'bật') + '). Nếu muốn đổi, sửa ô active của dòng ' + p.key + ' trong tab EMAIL_TEMPLATES.',
      en: 'IMPORTANT: email template ' + p.key + ' had several rows that disagreed about the active cell. Kept the state of the last row (row ' + a.kept_row + '): ' + (on ? 'SENDING' : 'OFF') +
        ', exactly what the system was doing before the merge; the row(s) at ' + rows + ' said the opposite (' + (on ? 'off' : 'on') + '). To change it, edit the active cell of ' + p.key + ' in the EMAIL_TEMPLATES tab.' };
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
  // T2: ảnh QR chuyển khoản (trống chỉ là thông tin; hỏng thì lỗi, vì trang đang âm thầm bỏ ô QR).
  // Soát 5R: mỗi lần kiểm là một lần LÀM MỚI cho khách (tăng BANK_QR_REV: bỏ bộ nhớ đệm máy chủ, kể cả mục lỗi, và ảnh trong trình duyệt), dù kết quả thế nào,
  // vì thay file ảnh nguyên link không đổi mã file nên không có gì khác báo cho trang biết ảnh đã đổi.
  try {
    var qrv = String(cfg_('BANK_QR_IMAGE') || '').trim(), qrNote = '';
    try { bankQrBump_(); qrNote = ' Đã làm mới ảnh cho khách xem trang (bộ nhớ đệm ảnh cũ bị bỏ).'; } catch (be) { qrNote = ' CHƯA làm mới được bộ nhớ đệm ảnh (' + be.message + ').'; }
    if (!qrv) ok('BANK_QR_IMAGE để trống: trang đăng ký không hiện mã QR (không bắt buộc)');
    else { var qr = bankQrRead_(qrv); if (qr.ok) ok('BANK_QR_IMAGE hợp lệ: ' + qr.type + ', ' + qr.kb + ' KB.' + qrNote + ' Sau này thay file ảnh dưới CÙNG link: chạy lại menu 2 này hoặc menu Email > Làm mới ảnh QR chuyển khoản để khách thấy ảnh mới ngay (không thì chờ tới 6 giờ).'); else err('BANK_QR_IMAGE hỏng (' + qr.code + '): ' + qr.fix + ' Trang đăng ký đang ẩn ô QR.' + qrNote); }
  } catch (qe) { err('Kiểm BANK_QR_IMAGE lỗi: ' + qe.message); }
  // 5L: kiểm mọi dòng PACKAGES (mã trùng, kiểu, số ngày, số buổi, giá).
  try { var pi = packageIssues_(table_('PACKAGES').all()); pi.errors.forEach(err); pi.warnings.forEach(warn); if (!pi.errors.length) ok('PACKAGES: ' + table_('PACKAGES').all().length + ' dòng hợp lệ'); } catch (pe2) { err('Kiểm PACKAGES lỗi: ' + pe2.message); }
  // Soát T1: key trùng ở EMAIL_TEMPLATES, CONTENT (admin không biết dòng nào đang dùng).
  try { dupKeyWarnings_().forEach(warn); } catch (de2) { err('Kiểm key trùng EMAIL_TEMPLATES, CONTENT lỗi: ' + de2.message); }
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
