/**
 * SystemMove.gs · Chuyển sang hệ thống mới, đổi tài khoản admin@ (chunk 5L, plan/TRA_LOI_01_11.md mục 6)
 *
 * Giới hạn của Google: dự án Apps Script mới có link web app mới (dùng link rút gọn SHORT_URL_* để học viên không phải đổi
 * link); Script Properties của dự án cũ không đọc được từ dự án mới; trigger gắn với người tạo; sự kiện Calendar nằm trên lịch
 * của tài khoản cũ. Vì vậy chuyển theo 4 bước, hệ thống mới CHỈ ĐỌC file cũ:
 *
 *   Bước 1 (hệ thống CŨ) "Chuẩn bị chuyển": đóng cổng (bảo trì CLOSED, trang báo link mới), gỡ sự kiện Calendar các buổi sắp
 *     tới (bước A cũ), xoá trigger (job cũ không gửi thư trùng), ghi tab META (phiên bản, mốc mã tự sinh, giờ chuẩn bị).
 *   Bước 2 (hệ thống MỚI, đã chạy menu 1) "Chạy thử": đọc file cũ, đếm từng tab sẽ chép, mã gói còn thiếu; không ghi gì.
 *   Bước 3 (hệ thống MỚI) "Chép thật": chép theo mã (chạy lại không nhân đôi), ghép cột theo TÊN, ghi qua lớp ghi chuẩn (định
 *     dạng chữ, công thức link Zalo), mỗi tab một khoá, có mốc chạy tiếp khi gần hết 6 phút; nâng mốc mã tự sinh theo META;
 *     đếm lại; ghi SYSTEM_IMPORTED. Không chép AUTH (mọi người đăng nhập lại), nhật ký, thông báo (đã nằm trong file lưu trữ).
 *   Bước 4 (hệ thống MỚI) "Tạo lại sự kiện các buổi sắp tới" (bước B cũ), menu 3 (trigger), rồi đổi đích link rút gọn.
 *
 * Menu 1 cũng ghi META mỗi lần chạy, để file nào cũng có số phiên bản và mốc mã mới nhất.
 */

/** Tab và cách chép. insert: dòng mới theo mã, mã đã có thì bỏ qua; upsert: có thì ghi đè bằng bản cũ; cells: chỉ chép các cột
 *  admin sửa (dòng hệ thống mới tự có sau menu 1); config: chép giá trị, bỏ khoá hạ tầng; ledger: chỉ dòng email marketing. */
var MOVE_TABS_ = [
  { tab: 'PACKAGES', mode: 'upsert' },
  { tab: 'USERS', mode: 'insert' },
  { tab: 'STUDENT_PACKAGES', mode: 'insert' },
  { tab: 'REGISTRATIONS', mode: 'insert' },
  { tab: 'PAYMENTS', mode: 'insert' },
  { tab: 'BOOKINGS', mode: 'insert' },
  { tab: 'AVAILABILITY', mode: 'insert', fromToday: true },
  { tab: 'MARKETING_EMAILS', mode: 'upsert' },
  { tab: 'MAIL_LOG', mode: 'ledger' },
  { tab: 'NOTIFICATIONS', mode: 'notice' },   // soát 5L L8: thông báo Khẩn, Cần xử lý chưa đọc (cấp mã mới, bỏ link dòng cũ)
  { tab: 'CONTENT', mode: 'cells', cols: ['vi', 'en', 'note'] },
  { tab: 'EMAIL_TEMPLATES', mode: 'cells', cols: ['active', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'note'] },
  { tab: 'NOTIFY_RULES', mode: 'cells', cols: ['level', 'channel', 'note'] },
  { tab: 'CONFIG', mode: 'config' }
];
/** Khoá CONFIG của riêng từng hệ thống: không chép (thư mục, lịch, link, bảo trì, email admin của tài khoản mới). */
var MOVE_CONFIG_SKIP_ = ['LESSON_CALENDAR_ID', 'UPLOADS_FOLDER_ID', 'BACKUP_FOLDER_ID', 'EXPORT_FOLDER_ID', 'ARCHIVE_FOLDER_ID', 'WEBAPP_URL',
  'GOOGLE_LOGIN_URL', 'MAINTENANCE_MODE', 'MAINTENANCE_UNTIL', 'MOVED_TO_URL', 'ALLOW_DATA_RESET', 'ADMIN_EMAIL'];
/** Soát 5L H1: cột nhận dạng của từng tab. Mã đã có ở hệ thống mới mà các cột này khác: hai dòng khác nhau trùng mã, dừng. */
var MOVE_KEY_FIELDS_ = { USERS: ['email', 'role'], STUDENT_PACKAGES: ['student_id', 'package_code'], REGISTRATIONS: ['email', 'package_code'],
  PAYMENTS: ['student_id', 'package_code', 'amount_vnd'], BOOKINGS: ['student_id', 'date', 'slot'], AVAILABILITY: ['tutor_id', 'date', 'slot'] };
var MOVE_TIME_BUDGET_MS_ = 270000;   // không bắt đầu tab mới sau 4,5 phút (giới hạn 6 phút mỗi lượt chạy)

/** Bảng mã tự sinh theo tab (để ghi META và nâng mốc ở hệ thống mới). */
// Soát 5L L6: không ghi mốc cho USERS (S, T, A dùng chung một tab; USERS không bao giờ bị lưu trữ, chép đủ nên số lớn nhất tự đúng).
function idFloorTabs_() { return Object.keys(ID_FORMAT).filter(function (k) { return k.indexOf('USERS') !== 0; }); }
function maxIdInTab_(tab) {
  var t = table_(tab), key = t.schema.id, max = 0;
  Object.keys(ID_FORMAT).forEach(function (k) {
    if ((k.indexOf('USERS') === 0 ? 'USERS' : k) !== tab) return;
    var re = new RegExp('^' + ID_FORMAT[k][0] + '(\\d+)$');
    t.rows.forEach(function (r) { var m = String(r[key]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  });
  return Math.max(max, idFloor_(tab));
}

/** Ghi tab META (gọi trong withLock_). extra: { khoá: giá trị } ghi thêm. */
function writeMetaInLock_(extra) {
  var t = table_('META'), set = function (k, v, note) { var r = t.byId(k); if (r) t.update(r, { value: String(v) }); else t.insert({ key: k, value: String(v), note: note || '' }); };
  set('APP_VERSION', APP.VERSION, 'Phiên bản code lần chạy menu 1 gần nhất');
  set('ENV', getEnv_(), 'Môi trường');
  set('META_AT', fmtDateTime_(getNow_()), 'Lần ghi META gần nhất');
  idFloorTabs_().forEach(function (tab) { set('ID_FLOOR_' + tab, maxIdInTab_(tab), 'Số lớn nhất đã cấp cho mã tự sinh của ' + tab + ' (kể cả dòng đã lưu trữ)'); });
  migrationStatus_().forEach(function (m) { if (m.done) set(m.id, 'DONE', m.label); });
  Object.keys(extra || {}).forEach(function (k) { set(k, extra[k], ''); });
}

/** So phiên bản dạng 8.1.3: trả âm, 0, dương. */
function cmpVersion_(a, b) {
  var x = String(a || '0').split('.'), y = String(b || '0').split('.');
  for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (Number(x[i]) || 0) - (Number(y[i]) || 0); if (d) return d; }
  return 0;
}

/**
 * Chunk 5L mục 6: các bước chuyển dữ liệu theo phiên bản. Mỗi bước chạy đúng MỘT lần ở menu 1 (đánh dấu ở Script Properties,
 * chép sang META để hệ thống mới biết). Menu 1 luôn sao lưu vào Releases trước (Release.gs). Menu "Cập nhật phiên bản: các
 * bước chuyển dữ liệu" chỉ đọc: bước nào đã chạy, bước nào sẽ chạy ở lần menu 1 tới; bước 5M có menu xem trước riêng.
 */
var MIGRATION_STEPS_ = [
  { id: 'MIG_MORNING_OFF', label: 'Tắt email nhắc buổi sáng (bản 8.0.x)' },
  { id: 'MIG_1610', label: 'Calendar QUEUE, phiên tutor 30 ngày (16/10)' },
  { id: 'MIG_5M', label: 'Luật bù buổi 8.1.0: chuyển buổi kỹ thuật cũ, tính lại gói (xem trước: menu Bù buổi 8.1.0)' }
];
function migrationStatus_() {
  var props = props_();
  return MIGRATION_STEPS_.map(function (m) { return { id: m.id, label: m.label, done: !!props.getProperty(m.id) }; });
}
function menuMigrationStatus(e) { requireOperator_(e);
  var st = migrationStatus_();
  alert_('Các bước chuyển dữ liệu theo phiên bản (' + APP.VERSION + '), chỉ đọc:\n\n' + st.map(function (m) { return (m.done ? 'ĐÃ CHẠY   ' : 'SẼ CHẠY ở lần menu 1 tới   ') + m.label; }).join('\n') +
    '\n\nMỗi bước chạy đúng một lần. Menu 1 sao lưu file vào thư mục Releases trước khi chạy.');
  return st;
}

// ── Bước 1: hệ thống cũ ──
function prepareMoveOld_(opts, actor) {
  opts = opts || {};
  var url = String(opts.newUrl || '').trim();
  if (url && !/^https:\/\/[^\s"'<>]+$/i.test(url)) return { ok: false, reason: REASONS.INVALID_INPUT, error: 'Link mới phải bắt đầu bằng https://' };
  withLock_(function () {
    var t = table_('CONFIG'), set = function (k, v) { var r = t.byId(k); if (r) t.update(r, { value: v }); else t.insert({ key: k, value: v, note: '' }); };
    set('MAINTENANCE_MODE', 'CLOSED');
    set('MOVED_TO_URL', url);
    logActivity_(actor, 'MAINTENANCE_CLOSED', 'CONFIG', 'MAINTENANCE_MODE', '');
  });
  clearConfigCache_();
  var det = detachFutureEvents_(actor);
  var removed = deleteSystemTriggers_();
  withLock_(function () {
    // Soát 5L L7: mốc việc theo tuần (nhắc tutor, báo chưa mở lịch) đi theo dữ liệu, để hệ thống mới không gửi lại.
    var ex = { PREPARED_AT: fmtDateTime_(getNow_()), PREPARED_BY: actor, NEW_URL: url }, pp = props_().getProperties();
    Object.keys(pp).forEach(function (k) { if (/^DONE_(TREMIND|TREMTRY|NOAVAILW|NOAVAIL)/.test(k)) ex['PROP_' + k] = pp[k]; });
    writeMetaInLock_(ex);
    logActivity_(actor, 'SYSTEM_MOVE_PREPARED', 'SYSTEM', APP.VERSION, { events: det.removed, triggers: removed, url: url });
  });
  return { ok: true, events: det.removed, triggers: removed, url: url };
}

/** Xoá trigger hệ thống của dự án này (bước 1, và menu "Tắt hết trigger" cho STAGING khi PRODUCTION chạy chính thức). */
function deleteSystemTriggers_() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) { if (TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1) { ScriptApp.deleteTrigger(t); n++; } });
  return n;
}

// ── Bước 2, 3: hệ thống mới ──
/** Đọc một tab của file cũ thành mảng object theo tên cột (chuẩn hoá như Db.gs đọc). Tab không có: null. */
function readOldTab_(ss, tab) {
  var sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() < 2) return sh ? [] : null;
  var vals = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues(), head = vals[0].map(function (h) { return String(h).trim(); }), sc = SCHEMA[tab];
  return vals.slice(1).filter(function (line) { return line.some(function (v) { return v !== '' && v !== null; }); }).map(function (line) {
    var o = {};
    sc.cols.forEach(function (c) { var j = head.indexOf(c); if (j !== -1) o[c] = normalizeCell_(sc, c, line[j]); });
    // Soát 5L M3: ô CONFIG Sheets đã đổi thành giờ (08:00 thành ngày giờ): sửa như cfg_ trước khi chép.
    if (tab === 'CONFIG' && head.indexOf('value') !== -1 && DEFAULTS_.hasOwnProperty(String(o.key).trim())) {
      var cv = coerceCfg_(line[head.indexOf('value')], DEFAULTS_[String(o.key).trim()]);
      o.value = cv === true ? 'TRUE' : cv === false ? 'FALSE' : String(cv);
    }
    return o;
  });
}

/** Mở file cũ và kiểm: đọc được, có META, đã "Chuẩn bị chuyển", phiên bản không mới hơn bản này. */
function openOldSystem_(oldId, requirePrepared) {
  var id = String(oldId || '').trim().replace(/^.*\/d\/([^/]+).*$/, '$1');
  if (!id) return { ok: false, error: 'Chưa nhập mã file DB cũ' };
  if (id === dbSpreadsheet_().getId()) return { ok: false, error: 'Đây là file DB của chính hệ thống này, không phải hệ thống cũ' };
  var ss; try { ss = SpreadsheetApp.openById(id); } catch (e) { return { ok: false, error: 'Không mở được file cũ (' + id + '): tài khoản này chưa có quyền xem file đó, hoặc mã sai' }; }
  var meta = {}; (readOldTab_(ss, 'META') || []).forEach(function (r) { meta[r.key] = r.value; });
  if (!meta.APP_VERSION) return { ok: false, error: 'File cũ chưa có tab META: trên hệ thống cũ, dán bản 8.1.3 trở lên, chạy menu 1, rồi chạy "Chuẩn bị chuyển"' };
  if (cmpVersion_(meta.APP_VERSION, APP.VERSION) > 0) return { ok: false, error: 'Hệ thống cũ chạy bản ' + meta.APP_VERSION + ', mới hơn bản này (' + APP.VERSION + '): dán bản mới nhất vào hệ thống mới trước' };
  if (requirePrepared && !meta.PREPARED_AT) return { ok: false, error: 'Hệ thống cũ chưa chạy "Chuẩn bị chuyển" (bước 1): job cũ vẫn chạy, sự kiện Calendar chưa gỡ' };
  return { ok: true, ss: ss, id: id, meta: meta };
}

/** Kế hoạch chép một tab (hàm thuần trên dữ liệu đã đọc). Trả { tab, total, insert, update, skip, conflicts, rows } . */
function movePlanTab_(spec, oldRows, newTable, today) {
  var out = { tab: spec.tab, total: 0, insert: 0, update: 0, skip: 0, conflicts: [], rows: [] }, sc = SCHEMA[spec.tab], key = sc.id;
  if (!oldRows) { out.missing = true; return out; }
  var rows = oldRows;
  if (spec.fromToday) rows = rows.filter(function (r) { return r.date instanceof Date && r.date >= today; });
  if (spec.mode === 'ledger') rows = rows.filter(function (r) { return String(r.kind || '').indexOf('MKT:') === 0; });
  if (spec.tab === 'CONFIG') rows = rows.filter(function (r) { return MOVE_CONFIG_SKIP_.indexOf(String(r.key).trim()) === -1 && DEFAULTS_.hasOwnProperty(String(r.key).trim()); });
  out.total = rows.length;
  var have = {}, emails = {};
  newTable.all().forEach(function (r) { if (key) have[String(r[key])] = r; if (spec.tab === 'USERS') emails[String(r.email).toLowerCase()] = r.user_id; });
  var sig = {}; if (spec.mode === 'ledger') newTable.all().forEach(function (r) { sig[[r.time instanceof Date ? r.time.getTime() : r.time, r.to, r.kind].join('|')] = true; });
  var nsig = {}; if (spec.mode === 'notice') newTable.all().forEach(function (r) { nsig[[r.event, r.time instanceof Date ? r.time.getTime() : r.time, r.entity_id].join('|')] = true; });
  var keyOf = function (r) { return (MOVE_KEY_FIELDS_[spec.tab] || []).map(function (c) { var v = r[c]; return v instanceof Date ? 'D' + toMidnight_(v).getTime() : String(v === undefined || v === null ? '' : v).trim().toLowerCase(); }).join('|'); };
  var planned = {};
  rows.forEach(function (r) {
    if (spec.mode === 'ledger') { var k = [r.time instanceof Date ? r.time.getTime() : r.time, r.to, r.kind].join('|'); if (sig[k]) { out.skip++; return; } sig[k] = true; out.insert++; out.rows.push({ op: 'insert', row: r }); return; }
    if (spec.mode === 'notice') {
      if (r.read === true || String(r.read).toUpperCase() === 'TRUE' || r.level === NOTIFY_LEVEL.INFO) return;
      var nk = [r.event, r.time instanceof Date ? r.time.getTime() : r.time, r.entity_id].join('|');
      if (nsig[nk]) { out.skip++; return; } nsig[nk] = true;
      out.insert++; out.rows.push({ op: 'notice', row: r }); return;
    }
    var id = String(r[key] || '').trim();
    if (!id) { out.skip++; return; }
    // Soát 5L L10: mã trùng ngay trong file cũ: chỉ chép dòng đầu, báo.
    if (planned[id]) { out.skip++; out.dupInOld = (out.dupInOld || []).concat([id]); return; }
    planned[id] = true;
    var cur = have[id];
    if (spec.tab === 'USERS' && !cur && emails[String(r.email).toLowerCase()]) { out.conflicts.push(id + ' (email ' + r.email + ' đã có ở ' + emails[String(r.email).toLowerCase()] + ')'); out.skip++; return; }
    if (spec.mode === 'insert') {
      if (cur && MOVE_KEY_FIELDS_[spec.tab] && keyOf(cur) !== keyOf(r)) { out.conflicts.push(id + ' (hệ thống mới đã có ' + id + ' là dòng khác)'); out.skip++; return; }
      if (cur) out.skip++; else { out.insert++; out.rows.push({ op: 'insert', row: r }); }
      return;
    }
    if (spec.mode === 'upsert') { if (cur) { out.update++; out.rows.push({ op: 'update', row: r }); } else { out.insert++; out.rows.push({ op: 'insert', row: r }); } return; }
    if (spec.mode === 'cells') {
      if (!cur) { out.skip++; return; }   // khoá cũ không còn trong bản này: bỏ
      var patch = {}; spec.cols.forEach(function (c) { if (c in r && String(r[c]) !== String(cur[c] === undefined ? '' : cur[c])) patch[c] = r[c]; });
      if (Object.keys(patch).length) { out.update++; out.rows.push({ op: 'patch', id: id, patch: patch }); } else out.skip++;
      return;
    }
    if (spec.mode === 'config') {
      if (cur && String(cur.value) === String(r.value)) { out.skip++; return; }
      out[cur ? 'update' : 'insert']++; out.rows.push({ op: cur ? 'patch' : 'insert', id: id, patch: { value: r.value }, row: { key: id, value: r.value, note: r.note || '' } });
    }
  });
  return out;
}

/** Mã gói học viên dùng mà file cũ và file mới đều không có dòng PACKAGES (tự tạo dòng "không bán"). */
function moveMissingPackages_(oldSps, oldPk, newPk) {
  var have = {}; (oldPk || []).concat(newPk).forEach(function (p) { have[String(p.code).trim()] = true; });
  var miss = {};
  (oldSps || []).forEach(function (sp) { var c = String(sp.package_code || '').trim(); if (c && !have[c]) miss[c] = miss[c] || { code: c, sessions: Number(sp.sessions_total || 0) }; });
  return Object.keys(miss).map(function (k) { return miss[k]; });
}

/**
 * Chạy thử (opts.dryRun) hoặc chép thật. Chép thật: mỗi tab một khoá; tab xong ghi mốc IMPORT_DONE_<mã file cũ>_<tab>
 * (Script Property) để lượt sau bỏ qua; gần hết giờ thì dừng, trả more = true (chạy lại menu để làm tiếp). Không bao giờ ghi file cũ.
 */
function moveImport_(oldId, opts, actor) {
  opts = opts || {};
  var o = openOldSystem_(oldId, !opts.dryRun);
  if (!o.ok) return o;
  var t0 = Date.now(), today = toMidnight_(getNow_()), props = props_(), report = [], more = false;
  var oldData = {}; MOVE_TABS_.forEach(function (s) { oldData[s.tab] = readOldTab_(o.ss, s.tab); });
  var missing = moveMissingPackages_(oldData.STUDENT_PACKAGES, oldData.PACKAGES, table_('PACKAGES').all());
  // Soát 5L H1, M2: trùng email hoặc trùng mã khác dòng (hệ thống mới đã tự sinh dòng trước khi chép): chép tiếp sẽ làm buổi, gói
  // trỏ sai người. Chạy thật dừng TRƯỚC khi ghi bất cứ gì; admin sửa ở hệ thống mới rồi chạy lại.
  if (!opts.dryRun) {
    var conf = [];
    MOVE_TABS_.forEach(function (sp) { if (sp.mode === 'insert' && !props.getProperty('IMPORT_DONE_' + o.id + '_' + sp.tab)) movePlanTab_(sp, oldData[sp.tab], table_(sp.tab), today).conflicts.forEach(function (x) { conf.push(sp.tab + ' ' + x); }); });
    if (conf.length) return { ok: false, error: 'Hệ thống mới đã có dòng trùng với hệ thống cũ, chưa chép gì: ' + conf.slice(0, 10).join('; ') + (conf.length > 10 ? ' ...' : '') + '. Xoá hoặc sửa các dòng đó ở hệ thống mới (thường là dòng tạo thử sau menu 1), rồi chạy lại' };
    // Nâng mốc mã tự sinh TRƯỚC khi ghi: dòng hệ thống mới sinh trong lúc chép không lấy trùng số của hệ thống cũ.
    idFloorTabs_().forEach(function (tab) { var v = Number(o.meta['ID_FLOOR_' + tab] || 0), k = 'ID_FLOOR_' + tab; if (v > Number(props.getProperty(k) || 0)) props.setProperty(k, String(v)); });
    ID_FLOOR_MEMO_ = {};
  }
  MOVE_TABS_.forEach(function (spec) {
    var doneKey = 'IMPORT_DONE_' + o.id + '_' + spec.tab;
    if (!opts.dryRun && props.getProperty(doneKey)) { report.push({ tab: spec.tab, done: true }); return; }
    if (!opts.dryRun && Date.now() - t0 > MOVE_TIME_BUDGET_MS_) { more = true; report.push({ tab: spec.tab, skipped: 'TIME' }); return; }
    if (opts.dryRun) { var p = movePlanTab_(spec, oldData[spec.tab], table_(spec.tab), today); delete p.rows; report.push(p); return; }
    var res = withLock_(function () {
      var t = table_(spec.tab), plan = movePlanTab_(spec, oldData[spec.tab], t, today);
      if (spec.tab === 'PACKAGES') missing.forEach(function (m) {
        if (t.byId(m.code)) return;
        t.insert({ code: m.code, name: m.code + ' (tự tạo khi chuyển hệ thống)', name_en: m.code, type: m.sessions ? 'SESSIONS' : 'DAYS', days: m.sessions ? '' : 30, sessions: m.sessions || '', price_vnd: 0, active: false, note: 'Tự tạo ' + fmtDateTime_(getNow_()) + ': hệ thống cũ không có định nghĩa gói này. Kiểm lại kiểu, số ngày, số buổi' });
      });
      plan.rows.forEach(function (x) {
        // USERS: ô contact_link ở file cũ đọc ra chữ hiển thị (không phải công thức): dựng lại công thức link Zalo.
        if (spec.tab === 'USERS' && x.row) x.row.contact_link = contactFormula_(x.row.phone);
        if (x.op === 'insert') t.insert(x.row);
        else if (x.op === 'update') { var cur = t.byId(String(x.row[SCHEMA[spec.tab].id])); var pt = {}; SCHEMA[spec.tab].cols.forEach(function (c) { if (c in x.row) pt[c] = x.row[c]; }); t.update(cur, pt); }
        else if (x.op === 'patch') t.update(t.byId(x.id), x.patch);
        else if (x.op === 'notice') { var nr = {}; SCHEMA.NOTIFICATIONS.cols.forEach(function (c) { if (c in x.row) nr[c] = x.row[c]; }); nr.notif_id = nextId_('NOTIFICATIONS'); nr.link = ''; t.insert(nr); }
      });
      delete plan.rows;
      return plan;
    });
    props.setProperty(doneKey, '1');
    report.push(res);
  });
  if (opts.dryRun) return { ok: true, dryRun: true, oldVersion: o.meta.APP_VERSION, prepared: !!o.meta.PREPARED_AT, tabs: report, missingPackages: missing };
  clearDbCache_(); clearConfigCache_();
  var rerun = [];
  if (!more) {
    // Soát 5L L7: mốc việc theo tuần của hệ thống cũ.
    Object.keys(o.meta).forEach(function (k) { if (k.indexOf('PROP_DONE_') === 0 && !props.getProperty(k.substring(5))) props.setProperty(k.substring(5), String(o.meta[k])); });
    // Soát 5L M4: bước chuyển dữ liệu hệ thống cũ CHƯA chạy thì bỏ dấu ở hệ thống mới, để lần menu 1 tới chạy trên dữ liệu vừa chép.
    MIGRATION_STEPS_.forEach(function (m) { if (o.meta[m.id] !== 'DONE' && props.getProperty(m.id)) { props.deleteProperty(m.id); rerun.push(m.label); } });
    // Soát 5L M2: chép xong thì xoá mốc chạy tiếp, chạy lại Bước 3 sẽ đối chiếu lại toàn bộ (chép theo mã nên không nhân đôi).
    Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf('IMPORT_DONE_' + o.id + '_') === 0) props.deleteProperty(k); });
  }
  var check = more ? null : moveRecount_(o.ss, today);
  withLock_(function () { logActivity_(actor, 'SYSTEM_IMPORTED', 'SYSTEM', o.id, { more: more, tabs: report.map(function (r) { return r.tab + ':' + (r.done ? 'done' : (r.insert || 0) + '+' + (r.update || 0)); }).join(','), mismatch: check ? check.length : null }); });
  return { ok: true, more: more, tabs: report, missingPackages: missing, mismatches: check || [], rerunSteps: rerun };
}

/** Đếm lại sau khi chép: mỗi mã của tab chép theo mã ở file cũ phải có ở file mới. Trả danh sách lệch. */
function moveRecount_(oldSs, today) {
  var bad = [];
  MOVE_TABS_.filter(function (s) { return s.mode === 'insert' || s.mode === 'upsert'; }).forEach(function (spec) {
    var rows = readOldTab_(oldSs, spec.tab) || [], key = SCHEMA[spec.tab].id, have = {};
    if (spec.fromToday) rows = rows.filter(function (r) { return r.date instanceof Date && r.date >= today; });
    table_(spec.tab).all().forEach(function (r) { have[String(r[key])] = true; });
    var miss = rows.filter(function (r) { return String(r[key] || '').trim() && !have[String(r[key])]; }).map(function (r) { return r[key]; });
    if (miss.length) bad.push(spec.tab + ': thiếu ' + miss.length + ' (' + miss.slice(0, 5).join(', ') + ')');
  });
  return bad;
}

// ── Menu ──
function menuMovePrepare(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Bước 1: Chuẩn bị chuyển (chạy trên hệ thống CŨ)', 'Đóng cổng học viên và tutor, gỡ sự kiện Calendar các buổi sắp tới (học viên, tutor nhận thư huỷ của Google Calendar, buổi học vẫn giữ), xoá trigger tự động, ghi tab META.\n\nChỉ làm khi hệ thống mới đã dán code và chạy menu 1. Tiếp tục?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var url = ui.prompt('Link mới (tuỳ chọn)', 'Link trang web của hệ thống mới (https://...), hiện cho người mở link cũ. Để trống nếu chưa có.', ui.ButtonSet.OK_CANCEL);
  if (url.getSelectedButton() !== ui.Button.OK) return null;
  if (ui.alert('Xác nhận lần 2', 'Hệ thống này sẽ ngừng phục vụ học viên, tutor. Chắc chắn?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var r = prepareMoveOld_({ newUrl: url.getResponseText() }, adminActor_(e));
  alert_(r.ok ? 'Đã chuẩn bị: cổng đóng, gỡ ' + r.events + ' sự kiện, xoá ' + r.triggers + ' trigger, ghi META.\n\nMã file DB này (nhập ở hệ thống mới): ' + dbSpreadsheet_().getId() + '\n\nSang hệ thống mới: menu Chuyển hệ thống, Bước 2 rồi Bước 3.' : 'Chưa chuẩn bị được: ' + (r.error || r.reason));
  return r;
}
function moveIdPrompt_() {
  var ui = SpreadsheetApp.getUi(), r = ui.prompt('Mã file DB của hệ thống cũ', 'Dán link file Sheets DB cũ hoặc đoạn mã giữa /d/ và /edit (hệ thống cũ báo mã này ở Bước 1).', ui.ButtonSet.OK_CANCEL);
  return r.getSelectedButton() === ui.Button.OK ? r.getResponseText() : null;
}
function moveReportText_(r) {
  var lines = r.tabs.map(function (x) { return x.tab + ': ' + (x.done ? 'đã chép ở lượt trước' : x.skipped ? 'ĐỂ LƯỢT SAU (hết giờ)' : x.missing ? 'file cũ không có tab này' : x.total + ' dòng, thêm ' + x.insert + ', cập nhật ' + x.update + ', bỏ qua ' + x.skip + (x.conflicts && x.conflicts.length ? ', TRÙNG (phải sửa trước Bước 3): ' + x.conflicts.join('; ') : '') + (x.dupInOld ? ', mã trùng trong file cũ (chép dòng đầu): ' + x.dupInOld.join(', ') : '')); });
  if (r.missingPackages && r.missingPackages.length) lines.push('', 'Mã gói thiếu (tự tạo dòng "không bán", kiểm lại sau): ' + r.missingPackages.map(function (m) { return m.code; }).join(', '));
  return lines.join('\n');
}
function menuMoveDryRun(e) { requireOperator_(e);
  var id = moveIdPrompt_(); if (id === null) return null;
  var r = moveImport_(id, { dryRun: true }, adminActor_(e));
  alert_(r.ok ? 'CHẠY THỬ (chưa ghi gì). Hệ thống cũ bản ' + r.oldVersion + (r.prepared ? '' : ', CHƯA chạy Chuẩn bị chuyển') + '\n\n' + moveReportText_(r) : 'Không chạy được: ' + r.error);
  return r;
}
function menuMoveImport(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), id = moveIdPrompt_(); if (id === null) return null;
  if (ui.alert('Bước 3: Chép dữ liệu thật', 'Chép dữ liệu từ hệ thống cũ vào file này (file cũ chỉ đọc). Chạy lại không nhân đôi. Tiếp tục?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var r = moveImport_(id, {}, adminActor_(e));
  alert_(r.ok ? (r.more ? 'CHƯA XONG (hết thời gian một lượt): chạy lại Bước 3 để chép tiếp.\n\n' : 'Đã chép xong.' + (r.mismatches.length ? ' ĐẾM LẠI LỆCH:\n' + r.mismatches.join('\n') : ' Đếm lại khớp.') + '\n\nTiếp theo: chạy menu 1' + (r.rerunSteps.length ? ' (sẽ chạy lại: ' + r.rerunSteps.join('; ') + ')' : '') + ', Bước 4 (tạo lại sự kiện), menu 3 (trigger), đổi đích link rút gọn.\n\n') + moveReportText_(r) : 'Không chạy được: ' + r.error);
  return r;
}
function menuStopTriggers(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Tắt hết trigger tự động của hệ thống này?', 'Dùng cho STAGING khi PRODUCTION đã chạy chính thức (tránh thư nhắc trùng, chiếm hạn mức). Hệ thống này không còn tự gửi nhắc, tự sao lưu, tự tạo sự kiện. Bật lại: menu 3.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var n = deleteSystemTriggers_();
  withLock_(function () { logActivity_(adminActor_(e), 'TRIGGERS_STOPPED', 'SYSTEM', getEnv_(), String(n)); });
  alert_('Đã xoá ' + n + ' trigger. Menu 2 sẽ báo thiếu trigger (đúng ý). Bật lại: menu 3.');
  return n;
}
