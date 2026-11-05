/**
 * Archive.gs · Lưu trữ (chunk 5G; 5K: nhật ký 60 ngày, nhiều lô mỗi lượt, METRICS)
 *
 * Vì sao: đặt lịch đọc cả tab BOOKINGS và AVAILABILITY trong khoá. Tab lớn dần thì mỗi lần đặt chậm dần (1 năm khoảng
 * 24.000 dòng BOOKINGS). Lưu trữ chuyển dòng CŨ và ĐÃ XONG sang file lưu trữ riêng, để file DB luôn nhỏ.
 *
 * Không mất dữ liệu (CLAUDE.md luật 10, 46):
 *   1. Dòng được CHÉP sang file "THAIPUT · Lưu trữ · <môi trường> · <năm>" (một file mỗi năm, theo ngày của dòng; file tạo
 *      trước 5K tên THAIPUT_ARCHIVE_<môi trường>_<năm> được đổi tên khi mở lại), tab DOC_TRUOC giải thích, tab cùng tên,
 *      cùng cột, thêm 2 cột _archived_at và _batch (mã lô).
 *   2. Đọc lại file lưu trữ, đếm đủ số dòng của lô. Thiếu là dừng, không bỏ dòng nào khỏi DB.
 *   3. Chỉ sau đó mới bỏ các dòng đó khỏi DB (purgeRows_, giữ công thức).
 *   Chạy hỏng giữa bước 1 và 3: mã lô còn ghi ở Script Property ARCH_OPEN; lần sau đọc lô đó trong file lưu trữ, bỏ khỏi
 *   DB đúng các dòng đã chép (so nguyên dòng), không chép lần hai.
 *   File lưu trữ không bao giờ bị code xoá hay sửa. Thư mục lưu trữ nằm cạnh Backup (ARCHIVE_FOLDER_ID).
 *
 * Dòng nào được chuyển (cutoff = ngày 1 của tháng, lùi ARCHIVE_KEEP_MONTHS tháng, tối thiểu 3):
 *   BOOKINGS: ngày học trước cutoff, trạng thái đã xong (không CONFIRMED, PENDING_REASSIGN), admin_action trống,
 *     và gói của buổi đã EXPIRED với ngày hết hạn trước cutoff (hoặc buổi không có gói). Gói còn chạy giữ nguyên mọi buổi,
 *     vì số buổi còn lại tính từ BOOKINGS.
 *   AVAILABILITY: ngày trước cutoff, không còn chờ admin duyệt.
 *   ACTIVITY_LOG, METRICS: cũ hơn LOG_KEEP_DAYS ngày (mặc định 60, tối thiểu 30; chunk 5K), tính theo ngày nên mỗi đêm có việc.
 *   MAIL_LOG: cũ hơn LOG_KEEP_DAYS ngày, trừ dòng email marketing (kind MKT:, sổ chống gửi trùng, luôn giữ).
 *   NOTIFICATIONS: cũ hơn LOG_KEEP_DAYS ngày, đã đọc hoặc mức INFO (thông báo Khẩn, Cần xử lý chưa đọc thì giữ).
 *   Không bao giờ chuyển: USERS, STUDENT_PACKAGES, PAYMENTS, REGISTRATIONS, CONFIG và các tab cấu hình.
 *
 * Chạy: hourlyJob, mỗi ngày từ ARCHIVE_HOUR (mặc định 3 giờ sáng). Mỗi lô tối đa ARCHIVE_MAX_ROWS dòng mỗi tab; một lượt chạy
 * nhiều lô tới khi hết (5K). Hết thời gian của lượt thì chưa đánh dấu xong, lượt sau (giờ sau) làm tiếp. Menu "Lưu trữ: xem
 * tình trạng", "Lưu trữ: chạy ngay" (chủ file), "Lưu trữ: mở file".
 */

var ARCHIVE_TABS_ = ['BOOKINGS', 'AVAILABILITY', 'ACTIVITY_LOG', 'MAIL_LOG', 'NOTIFICATIONS', 'METRICS'];
var ARCHIVE_DATE_COL_ = { BOOKINGS: 'date', AVAILABILITY: 'date', ACTIVITY_LOG: 'time', MAIL_LOG: 'time', NOTIFICATIONS: 'time', METRICS: 'time' };
var ARCHIVE_EXTRA_COLS_ = ['_archived_at', '_batch'];

function archiveKeepMonths_() { return Math.max(3, Math.floor(Number(cfg_('ARCHIVE_KEEP_MONTHS')) || 6)); }
function archiveTabExists_(tab) { try { return !!dbSpreadsheet_().getSheetByName(tab); } catch (e) { return false; } }
/**
 * Soát 5K L2: đổi tên mọi file lưu trữ tạo trước 5K (kể cả năm cũ không còn mở lại) và thêm DOC_TRUOC. Menu 1 gọi. Lỗi thì bỏ qua.
 */
function archiveRenameOldFiles_() {
  var all = props_().getProperties(), n = 0, pre = 'ARCH_FILE_' + getEnv_() + '_';
  Object.keys(all).filter(function (k) { return k.indexOf(pre) === 0; }).forEach(function (k) {
    try {
      var ss = SpreadsheetApp.openById(all[k]), year = k.substring(pre.length);
      if (!/^THAIPUT_ARCHIVE_/.test(ss.getName())) return;
      DriveApp.getFileById(all[k]).setName(archiveFileName_(year)); archiveReadme_(ss, year); n++;
    } catch (e) { Logger.log('Đổi tên file lưu trữ ' + k + ' lỗi: ' + e.message); }
  });
  return n;
}
/** Ngày 1 của tháng hiện tại lùi n tháng (nửa đêm). */
function monthStartBack_(now, n) { return new Date(now.getFullYear(), now.getMonth() - n, 1); }
/** Chunk 5K: một mốc cho mọi tab nhật ký, thông báo, METRICS (LOG_KEEP_DAYS, tối thiểu 30). */
function logKeepDays_() { return Math.max(30, Math.floor(Number(cfg_('LOG_KEEP_DAYS')) || 60)); }
function activityKeepDays_() { return logKeepDays_(); }
/** Mốc nửa đêm của hôm nay lùi LOG_KEEP_DAYS ngày, mỗi đêm chuyển phần vừa quá hạn. */
function archiveCutoffs_(now) {
  var logCut = addDays_(toMidnight_(now), -logKeepDays_());
  return { main: monthStartBack_(now, archiveKeepMonths_()), log: logCut, activity: logCut };
}

/**
 * Hàm thuần: dòng nào của tab được chuyển. rows: dòng của DbTable; ctx: { cut: {main, log, activity}, sps: {sp_id: dòng gói} }.
 * Trả mảng dòng (theo thứ tự trong tab).
 */
function archiveEligible_(tab, rows, ctx) {
  var col = ARCHIVE_DATE_COL_[tab], cut = (tab === 'BOOKINGS' || tab === 'AVAILABILITY') ? ctx.cut.main : tab === 'ACTIVITY_LOG' && ctx.cut.activity ? ctx.cut.activity : ctx.cut.log;
  var old = function (r) { var d = r[col]; d = d instanceof Date ? d : (d ? new Date(d) : null); return !!d && !isNaN(d.getTime()) && d < cut; };
  return rows.filter(function (r) {
    if (!old(r)) return false;
    if (tab === 'BOOKINGS') {
      if (r.status === BOOKING_STATUS.CONFIRMED || r.status === BOOKING_STATUS.PENDING_REASSIGN || !r.status) return false;
      if (String(r.admin_action || '').trim()) return false;
      if (r.sp_id) {
        var sp = ctx.sps[String(r.sp_id)];
        if (sp) {
          if (sp.status !== PKG_STATUS.EXPIRED) return false;
          if (!(sp.end_date instanceof Date) || !(sp.end_date < cut)) return false;
        }
      }
      return true;
    }
    if (tab === 'AVAILABILITY') return r.status !== AVAIL_STATUS.CANCEL_PENDING;
    if (tab === 'NOTIFICATIONS') return r.read === true || String(r.read).toUpperCase() === 'TRUE' || r.level === NOTIFY_LEVEL.INFO;
    // 5K: dòng email marketing là sổ chống gửi trùng của chiến dịch (Marketing.gs): không chuyển.
    if (tab === 'MAIL_LOG') return String(r.kind || '').indexOf('MKT:') !== 0;
    return true;
  });
}

/** Thư mục lưu trữ: ARCHIVE_FOLDER_ID, trống thì tạo "Archive" và ghi lại vào CONFIG. Phải gọi trong withLock_. */
function archiveFolder_() {
  var id = String(cfg_('ARCHIVE_FOLDER_ID') || '').trim();
  if (id) {
    var fo = DriveApp.getFolderById(id);
    // Thư mục trong thùng rác vẫn mở được nhưng Google xoá hẳn sau 30 ngày (soát R1 M3): dừng, không chép thêm vào đó.
    if (fo.isTrashed()) throw new Error('Thư mục lưu trữ (ARCHIVE_FOLDER_ID) đang ở thùng rác: khôi phục từ thùng rác Drive rồi chạy lại.');
    return fo;
  }
  var f = DriveApp.createFolder('THAIPUT_V8_' + getEnv_() + '_Archive');
  var t = table_('CONFIG'), r = t.byId('ARCHIVE_FOLDER_ID');
  if (r) t.update(r, { value: f.getId() }); else t.insert({ key: 'ARCHIVE_FOLDER_ID', value: f.getId(), note: 'Thư mục file lưu trữ (tự tạo)' });
  flushDb_(); clearConfigCache_();
  logActivity_('SYSTEM', 'ARCHIVE_FOLDER_CREATED', 'CONFIG', f.getId(), '');
  return f;
}

/** Tên file lưu trữ (5K): dễ tìm trong Drive. */
function archiveFileName_(year) { return 'THAIPUT · Lưu trữ · ' + getEnv_() + ' · ' + year; }
var ARCHIVE_README_TAB_ = 'DOC_TRUOC';
/** Tab DOC_TRUOC: giải thích file cho người mở (5K). Có rồi thì thôi. */
function archiveReadme_(ss, year) {
  if (ss.getSheetByName(ARCHIVE_README_TAB_)) return;
  var sh, blank = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (blank && blank.getLastRow() === 0) { blank.setName(ARCHIVE_README_TAB_); sh = blank; } else sh = ss.insertSheet(ARCHIVE_README_TAB_);
  var lines = [
    ['File lưu trữ thaiput ' + getEnv_() + ' năm ' + year],
    ['Chứa dòng cũ đã xong được chuyển khỏi file dữ liệu chính để hệ thống luôn nhanh. Không mất dòng nào.'],
    ['Mỗi tab cùng tên và cùng cột với tab trong file chính, thêm 2 cột: _archived_at (lúc chuyển) và _batch (mã lô).'],
    ['Nhật ký, email, thông báo, số đo: dòng cũ hơn LOG_KEEP_DAYS ngày (mặc định 60). Buổi học, giờ rảnh: dòng cũ hơn ARCHIVE_KEEP_MONTHS tháng của gói đã hết hạn.'],
    ['KHÔNG sửa, KHÔNG xoá, KHÔNG đổi tên tab. Hệ thống đọc lại file này để kiểm từng lô.'],
    ['Hướng dẫn: HUONG_DAN_VAN_HANH.md, Phần B12 (Lưu trữ dữ liệu cũ).']
  ];
  sh.getRange(1, 1, lines.length, 1).setValues(lines);
}
/** File lưu trữ của một năm (mở hoặc tạo). Mã file lưu ở Script Property ARCH_FILE_<môi trường>_<năm>. */
function archiveFile_(year) {
  var key = 'ARCH_FILE_' + getEnv_() + '_' + year, props = props_(), id = props.getProperty(key);
  if (id) {
    var trashed = false; try { trashed = DriveApp.getFileById(id).isTrashed(); } catch (e) { }
    if (trashed) throw new Error('File lưu trữ năm ' + year + ' (' + id + ') đang ở thùng rác: khôi phục từ thùng rác Drive rồi chạy lại. Chưa bỏ dòng nào khỏi DB.');
    var old;
    try { old = SpreadsheetApp.openById(id); } catch (e) { throw new Error('Không mở được file lưu trữ năm ' + year + ' (' + id + '). Không xoá hay chuyển file này. Kiểm tra quyền, hoặc xoá Script Property ' + key + ' nếu chắc chắn file đã mất.'); }
    // 5K: file tạo trước 5K mang tên cũ: đổi tên, thêm tab DOC_TRUOC (không đụng dữ liệu). Lỗi thì bỏ qua.
    try { if (/^THAIPUT_ARCHIVE_/.test(old.getName())) { DriveApp.getFileById(id).setName(archiveFileName_(year)); archiveReadme_(old, year); } } catch (e) { Logger.log('Đổi tên file lưu trữ lỗi: ' + e.message); }
    return old;
  }
  var folder = archiveFolder_(), ss = SpreadsheetApp.create(archiveFileName_(year));
  try { ss.setSpreadsheetTimeZone(APP.TIMEZONE); } catch (e) { }
  try { archiveReadme_(ss, year); } catch (e) { Logger.log('Tab DOC_TRUOC lỗi: ' + e.message); }
  var f = DriveApp.getFileById(ss.getId());
  try { if (f.moveTo) f.moveTo(folder); } catch (e) { Logger.log('Chuyển file lưu trữ vào thư mục lỗi: ' + e.message); }
  try { f.setDescription('Lưu trữ thaiput ' + getEnv_() + ' năm ' + year + '. Không sửa, không xoá. Xem HUONG_DAN_VAN_HANH.md Phần B12 và tab DOC_TRUOC.'); } catch (e) { }
  props.setProperty(key, ss.getId());
  logActivity_('SYSTEM', 'ARCHIVE_FILE_CREATED', 'ARCHIVE', ss.getId(), String(year));
  return ss;
}

/** Tab trong file lưu trữ: có thì kiểm tiêu đề khớp, chưa có thì tạo với tiêu đề của DB + 2 cột lưu trữ. */
function archiveSheet_(ss, tab, header) {
  var want = header.concat(ARCHIVE_EXTRA_COLS_), sh = ss.getSheetByName(tab);
  if (!sh) {
    sh = ss.insertSheet(tab);
    if (sh.getMaxColumns() < want.length) sh.insertColumnsAfter(sh.getMaxColumns(), want.length - sh.getMaxColumns());
    sh.getRange(1, 1, 1, want.length).setValues([want]);
    try { sh.setFrozenRows(1); } catch (e) { }
    return sh;
  }
  var have = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(function (h) { return String(h).trim(); });
  // Tab DB có thêm cột mới (bản cập nhật sau): thêm cột vào trước 2 cột lưu trữ thì lệch, nên thêm vào cuối và ghi theo tên.
  var add = want.filter(function (h) { return have.indexOf(h) === -1; });
  if (add.length) {
    if (sh.getMaxColumns() < have.length + add.length) sh.insertColumnsAfter(sh.getMaxColumns(), have.length + add.length - sh.getMaxColumns());
    sh.getRange(1, have.length + 1, 1, add.length).setValues([add]);
  }
  return sh;
}

/** Mốc tháng đã lưu trữ cho báo cáo (REPORT_MONTH ghi "CHÚ Ý ... không đủ"). */
function archiveSetCutoff_(tab, cut) {
  var cutKey = tab === 'BOOKINGS' ? 'ARCH_CUTOFF_MAIN' : tab === 'MAIL_LOG' ? 'ARCH_CUTOFF_MAIL' : '', props = props_();
  if (cutKey) props.setProperty(cutKey, String(Math.max(Number(props.getProperty(cutKey) || 0), (tab === 'BOOKINGS' ? cut.main : cut.log).getTime())));
}

/** Chữ ký của một dòng theo các cột SCHEMA (giá trị đã chuẩn hoá như Db.gs đọc). Ngày giờ so tới giây. */
function archiveObjSig_(tab, obj) {
  return JSON.stringify(SCHEMA[tab].cols.map(function (c) {
    var v = obj[c];
    return v instanceof Date ? 'D' + Math.round(v.getTime() / 1000) : v === null || v === undefined ? '' : typeof v === 'string' ? v : String(v);
  }));
}
/** Dòng của file lưu trữ thành object như Db.gs đọc (để so chữ ký với dòng trong DB). */
function archiveRowObj_(tab, header, line) {
  var o = {}, sc = SCHEMA[tab];
  sc.cols.forEach(function (c) { var j = header.indexOf(c); o[c] = j === -1 ? '' : normalizeCell_(sc, c, line[j]); });
  return o;
}

/**
 * Bỏ khỏi DB các dòng có chữ ký nằm trong sigs (đếm từng bản), theo nội dung đọc mới lúc bỏ (purgeRows_). Dòng admin vừa
 * sửa tay (khác chữ ký) ở lại DB và được chép ở lô sau. Nâng mốc mã, sửa link "mở đúng dòng" của thông báo. Trả số dòng bỏ.
 */
function archivePurgeBySig_(tab, sigs) {
  var removedObjs = [], rowMap = {};
  var n = purgeRows_(tab, function (r) { var k = archiveObjSig_(tab, r); if (sigs[k] > 0) { sigs[k]--; return false; } return true; }, { removed: removedObjs, rowMap: rowMap });
  if (n) { bumpIdFloor_(tab, removedObjs); shiftRowLinksInLock_(tab, rowMap); }
  return n;
}

/**
 * Chuyển một lô của một tab. Phải gọi trong withLock_. Trả { tab, archived, year, batch } (archived 0 = không có gì).
 * Thứ tự: đánh dấu lô mở, chép, đọc lại đếm, bỏ khỏi DB theo chữ ký, đóng lô.
 */
function archiveTabInLock_(tab, now, cut, maxRows, force) {
  flushDb_(); delete DB_CACHE_[tab];
  var props = props_(), openKey = 'ARCH_OPEN_' + tab, open = props.getProperty(openKey);

  // Lô hỏng lần trước: đọc lô đó trong file lưu trữ, bỏ khỏi DB đúng các dòng thấy thật trong file, rồi mới làm lô mới.
  if (open) {
    var o = JSON.parse(open), ass = SpreadsheetApp.openById(o.file), ash = ass.getSheetByName(tab), sigs = {};
    if (ash && ash.getLastRow() > 1) {
      var ah = ash.getRange(1, 1, 1, ash.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
      var bi = ah.indexOf('_batch'), av = ash.getRange(2, 1, ash.getLastRow() - 1, ash.getLastColumn()).getValues();
      // Đếm từng chữ ký (hai dòng nhật ký giống hệt nhau thì bỏ đúng số bản đã chép, không hơn).
      av.forEach(function (r) { if (String(r[bi]) === o.batch) { var k = archiveObjSig_(tab, archiveRowObj_(tab, ah, r)); sigs[k] = (sigs[k] || 0) + 1; } });
    }
    var redo = Object.keys(sigs).length ? archivePurgeBySig_(tab, sigs) : 0;
    logActivity_('SYSTEM', 'ARCHIVE_RECOVER', 'ARCHIVE', tab, JSON.stringify({ batch: o.batch, removed: redo }));
    // Soát R3 L1: lô có dòng trong file lưu trữ thì tháng đó đã chuyển (dù dòng trong DB đã được purgeRecover_ dọn trước).
    if (Object.keys(sigs).length) archiveSetCutoff_(tab, cut);
    props.deleteProperty(openKey);
    return { tab: tab, archived: redo, recovered: true, batch: o.batch };
  }

  var t = table_(tab), sh = t.sheet, spMap = {};
  if (tab === 'BOOKINGS') table_('STUDENT_PACKAGES').all().forEach(function (sp) { spMap[String(sp.sp_id)] = sp; });
  var lastCol = sh.getLastColumn(), last = sh.getLastRow();
  if (last < 2) return { tab: tab, archived: 0 };
  var header = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var raw = sh.getRange(2, 1, last - 1, lastCol).getValues();

  var elig = archiveEligible_(tab, t.all(), { cut: cut, sps: spMap });
  if (!elig.length) return { tab: tab, archived: 0 };
  // 5K (anh chốt 01/11): bỏ mốc chờ 7 ngày của ACTIVITY_LOG; mọi tab nhật ký chuyển ngay phần vừa quá LOG_KEEP_DAYS.
  // Một năm mỗi lô (năm cũ nhất trước), tối đa maxRows dòng.
  var col = ARCHIVE_DATE_COL_[tab], yearOf = function (r) { return new Date(r[col]).getFullYear(); };
  var year = elig.reduce(function (m, r) { return Math.min(m, yearOf(r)); }, 9999);
  var pick = elig.filter(function (r) { return yearOf(r) === year; }).slice(0, maxRows);
  // Mã lô có giây và chữ ngẫu nhiên: hai lượt trong cùng phút không trùng mã (soát R1 L2).
  var batch = tab.substring(0, 3) + Utilities.formatDate(now, APP.TIMEZONE, 'yyyyMMddHHmmss') + '_' + pick.length + '_' + Utilities.getUuid().substring(0, 6);
  var ss = archiveFile_(year), ash2 = archiveSheet_(ss, tab, header);
  var ah2 = ash2.getRange(1, 1, 1, ash2.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  var textCols = (SCHEMA[tab].text || []).concat(['_batch']);
  var rowsOut = pick.map(function (r) {
    var line = raw[r._row - 2];
    return ah2.map(function (h) {
      if (h === '_archived_at') return now;
      if (h === '_batch') return batch;
      var j = header.indexOf(h); if (j === -1) return '';
      var v = line[j];
      return textCols.indexOf(h) === -1 ? safeCellText_(v) : v;
    });
  });
  var first = Math.max(2, ash2.getLastRow() + 1), need = first + rowsOut.length - 1;
  if (ash2.getMaxRows() < need) ash2.insertRowsAfter(ash2.getMaxRows(), need - ash2.getMaxRows() + 100);
  textCols.forEach(function (c) { var i = ah2.indexOf(c); if (i !== -1) ash2.getRange(first, i + 1, rowsOut.length, 1).setNumberFormat('@'); });
  props.setProperty(openKey, JSON.stringify({ file: ss.getId(), batch: batch, n: rowsOut.length, at: now.getTime() }));
  ash2.getRange(first, 1, rowsOut.length, ah2.length).setValues(rowsOut);
  SpreadsheetApp.flush();
  // Đọc lại: đủ số dòng của lô thì mới bỏ khỏi DB.
  var bi2 = ah2.indexOf('_batch'), back = ash2.getRange(first, bi2 + 1, rowsOut.length, 1).getValues();
  var okCount = back.filter(function (x) { return String(x[0]) === batch; }).length;
  if (okCount !== rowsOut.length) {
    // Giữ lô mở: lượt sau đọc lại file lưu trữ, chỉ bỏ khỏi DB các dòng thấy thật trong file; dòng thiếu ở lại DB và được
    // chép ở lô sau. Không mất, không trùng.
    notify_('ARCHIVE_FAILED', { entity: 'ARCHIVE', entity_id: tab, message: 'Lưu trữ ' + tab + ' lô ' + batch + ': đọc lại chỉ thấy ' + okCount + '/' + rowsOut.length + ' dòng. Chưa bỏ dòng nào khỏi DB; lượt sau tự đối chiếu lại. File: ' + ss.getUrl() , message_en: 'Archive ' + tab + ' batch ' + batch + ': read back only ' + okCount + '/' + rowsOut.length + ' rows. No row was removed from the DB; the next run checks again. File: ' + ss.getUrl() });
    throw new Error('Lưu trữ ' + tab + ': đọc lại thiếu dòng (' + okCount + '/' + rowsOut.length + ')');
  }
  var sigs2 = {}; pick.forEach(function (r) { var k = archiveObjSig_(tab, r); sigs2[k] = (sigs2[k] || 0) + 1; });
  var removed = archivePurgeBySig_(tab, sigs2);
  props.deleteProperty(openKey);
  logActivity_('SYSTEM', 'ARCHIVED', 'ARCHIVE', tab, JSON.stringify({ batch: batch, year: year, rows: removed, copied: pick.length, file: ss.getId() }));
  archiveSetCutoff_(tab, cut);
  return { tab: tab, archived: removed, copied: pick.length, year: year, batch: batch, url: ss.getUrl(), more: elig.length > pick.length };
}

/**
 * Link "mở đúng dòng" trong NOTIFICATIONS ghi theo số hàng (rowLink_). Sau khi bỏ dòng ở tab, hàng phía dưới dời lên:
 * sửa link của các thông báo còn trong DB theo bảng hàng cũ → hàng mới của purgeRows_ (tính cả hàng trống bị gọn, soát
 * R3 N6); dòng được trỏ tới đã chuyển đi thì link về đầu tab (soát R2 T3). Email đã gửi trước đó vẫn mang link cũ.
 * Phải gọi trong withLock_.
 */
function shiftRowLinksInLock_(tab, rowMap) {
  var gid = ''; try { gid = String(dbSpreadsheet_().getSheetByName(tab).getSheetId()); } catch (e) { return 0; }
  var nt; try { nt = table_('NOTIFICATIONS'); } catch (e) { return 0; }
  var changed = 0, re = new RegExp('#gid=' + gid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '&range=A(\\d+)$');
  nt.all().forEach(function (n) {
    var m = String(n.link || '').match(re); if (!m) return;
    var row = Number(m[1]), to = rowMap[row], link;
    if (to === row) return;
    link = to ? String(n.link).replace(/&range=A\d+$/, '&range=A' + to) : String(n.link).replace(/&range=A\d+$/, '');
    nt.update(n, { link: link }); changed++;
  });
  return changed;
}

/**
 * Mã tự sinh (BK000124...) lấy số lớn nhất trong tab. Dòng cũ đã chuyển đi thì số lớn nhất có thể giảm, mã mới trùng mã
 * đã lưu trữ. Ghi số lớn nhất đã chuyển vào Script Property ID_FLOOR_<tab>; nextId_ (Db.gs) không bao giờ cấp số nhỏ hơn.
 */
function bumpIdFloor_(tab, rows) {
  var fmt = ID_FORMAT[tab], key = SCHEMA[tab].id;
  if (!fmt || !key) return;
  var re = new RegExp('^' + fmt[0] + '(\\d+)$'), max = 0;
  rows.forEach(function (r) { var m = String(r[key]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  var props = props_(), cur = Number(props.getProperty('ID_FLOOR_' + tab) || 0);
  if (max > cur) props.setProperty('ID_FLOOR_' + tab, String(max));
  ID_FLOOR_MEMO_ = {};
}

/** Thời điểm lượt chạy (execution) này bắt đầu: Apps Script nạp lại biến toàn cục mỗi lượt chạy. */
var EXEC_T0_ = Date.now();
var ARCHIVE_TIME_BUDGET_MS_ = 210000;   // không bắt đầu tab mới sau 3,5 phút (giới hạn 6 phút mỗi lượt chạy)

/**
 * Một lượt lưu trữ cho mọi tab. Mỗi lô một khoá riêng (giữ khoá ngắn). 5K: mỗi tab chạy nhiều lô tới khi hết dòng đủ điều kiện
 * hoặc hết thời gian của lượt; còn dòng thì kết quả tab có more = true (archiveIfDue_ không đánh dấu xong, giờ sau làm tiếp).
 * Trả danh sách kết quả, mỗi tab một dòng (archived cộng dồn các lô).
 */
var ARCHIVE_MAX_BATCHES_ = 50;
function runArchive_(opts) {
  opts = opts || {};
  var now = getNow_(), cut = archiveCutoffs_(now), maxRows = Math.max(100, Number(cfg_('ARCHIVE_MAX_ROWS')) || 3000), out = [];
  ARCHIVE_TABS_.forEach(function (tab) {
    var sum = { tab: tab, archived: 0, batches: 0 };
    if (!archiveTabExists_(tab)) { sum.absent = true; out.push(sum); return; }   // soát 5K L1: tab chưa có (chưa chạy menu 1): bỏ qua
    for (var i = 0; i < ARCHIVE_MAX_BATCHES_; i++) {
      if (Date.now() - EXEC_T0_ > ARCHIVE_TIME_BUDGET_MS_) { sum.skipped = 'TIME'; sum.more = true; break; }
      var r;
      try { r = withLock_(function () { return archiveTabInLock_(tab, now, cut, maxRows, !!opts.force); }, 30000); }
      catch (e) {
        sum.error = String((e && e.message) || e);
        if (sum.error !== BUSY_MESSAGE_) mailAdminError_('Lưu trữ ' + tab + ' lỗi', (e && e.stack) || String(e));
        break;
      }
      sum.archived += r.archived || 0; sum.batches++;
      if (r.year) sum.year = r.year;
      if (r.recovered) { sum.recovered = true; continue; }   // xong lô dở: làm tiếp lô mới
      sum.more = !!r.more;
      if (!r.archived || !r.more) break;
    }
    if (i >= ARCHIVE_MAX_BATCHES_) sum.more = true;
    out.push(sum);
  });
  if (out.some(function (r) { return r.archived; })) { try { archiveMonthlyCopy_(now); } catch (e) { mailAdminError_('Sao file lưu trữ lỗi', (e && e.stack) || String(e)); } }
  return out;
}

/**
 * Mỗi tháng có lưu trữ: sao một bản mỗi file lưu trữ đã có vào thư mục Releases (không tự xoá), để file lưu trữ lỡ bị xoá
 * vẫn còn bản (soát R1 M3). 1 lần mỗi tháng (Script Property ARCH_COPY_<yyyyMM>).
 */
function archiveMonthlyCopy_(now) {
  var props = props_(), key = 'ARCH_COPY_' + Utilities.formatDate(now, APP.TIMEZONE, 'yyyyMM');
  if (props.getProperty(key)) return 0;
  var n = 0, all = props.getProperties(), folder = releasesFolder_();
  Object.keys(all).filter(function (k) { return k.indexOf('ARCH_FILE_' + getEnv_() + '_') === 0; }).forEach(function (k) {
    DriveApp.getFileById(all[k]).makeCopy(archiveFileName_(k.split('_').pop()) + ' · bản sao ' + Utilities.formatDate(now, APP.TIMEZONE, 'yyyyMMdd'), folder); n++;
  });
  props.setProperty(key, '1');
  return n;
}

/**
 * Gọi từ hourlyJob: 1 lần mỗi ngày từ ARCHIVE_HOUR. Không chạy khi:
 *   ARCHIVE_ENABLED FALSE; đang bảo trì (admin có thể đang sửa tay, soát R1 M2); bản sao DB đêm nay chưa xong
 *   (nightlyBackup chưa ghi nhịp trong 26 giờ: không chuyển dòng khi chưa có bản sao mới).
 */
function archiveIfDue_(now) {
  if (!cfg_('ARCHIVE_ENABLED')) return null;
  var hour = Number(cfg_('ARCHIVE_HOUR')), key = 'DONE_ARCHIVE_' + dateKey_(now), props = props_();
  if (hour < 0 || now.getHours() < hour || props.getProperty(key)) return null;
  if (maintMode_() !== 'OFF') return { skipped: 'MAINTENANCE' };
  // Bản sao DB của ĐÊM NAY (giờ thật, job 02:00) phải XONG (có file) trước khi chuyển dòng đi. Không dùng nhịp tim:
  // job bỏ lượt vì bận vẫn ghi nhịp mà chưa có file (soát R3 N3).
  var hb = Number(props.getProperty('BACKUP_OK_AT') || 0), rn = new Date(realNowMs_());
  if (!hb || hb < new Date(rn.getFullYear(), rn.getMonth(), rn.getDate()).getTime()) return { skipped: 'NO_BACKUP' };
  var res = runArchive_();
  if (!res.some(function (r) { return r.error || r.skipped || r.more; })) props.setProperty(key, '1');
  return res;
}

/** Tình trạng: số dòng mỗi tab, số dòng sẽ được chuyển ở lượt tới, file lưu trữ đã có. Chỉ đọc. */
function archiveStatus_() {
  var now = getNow_(), cut = archiveCutoffs_(now), spMap = {}, props = props_();
  table_('STUDENT_PACKAGES').all().forEach(function (sp) { spMap[String(sp.sp_id)] = sp; });
  var tabs = ARCHIVE_TABS_.filter(archiveTabExists_).map(function (tab) {
    var rows = table_(tab).all();
    return { tab: tab, rows: rows.length, eligible: archiveEligible_(tab, rows, { cut: cut, sps: spMap }).length, open: !!props.getProperty('ARCH_OPEN_' + tab) };
  });
  var files = Object.keys(props.getProperties()).filter(function (k) { return k.indexOf('ARCH_FILE_' + getEnv_() + '_') === 0; }).sort()
    .map(function (k) { return { year: k.split('_').pop(), id: props.getProperty(k) }; });
  return { enabled: !!cfg_('ARCHIVE_ENABLED'), cutMain: cut.main, cutLog: cut.log, cutActivity: cut.activity, tabs: tabs, files: files };
}

function menuArchiveStatus(e) { requireOperator_(e);
  var s = archiveStatus_();
  var lines = ['Bật: ' + (s.enabled ? 'có' : 'KHÔNG (ARCHIVE_ENABLED)'), 'Chuyển dòng trước ' + fmtDate_(s.cutMain) + ' (BOOKINGS, AVAILABILITY), trước ' + fmtDate_(s.cutLog) + ' (nhật ký, email, thông báo, METRICS: giữ ' + logKeepDays_() + ' ngày)', ''];
  s.tabs.forEach(function (x) { lines.push(x.tab + ': ' + x.rows + ' dòng, ' + x.eligible + ' sẽ chuyển' + (x.open ? ' (CÓ LÔ DỞ, lượt sau tự hoàn tất)' : '')); });
  lines.push('', s.files.length ? 'File lưu trữ: ' + s.files.map(function (f) { return f.year + ' https://docs.google.com/spreadsheets/d/' + f.id; }).join('\n') : 'Chưa có file lưu trữ.');
  alert_('Lưu trữ (' + APP.VERSION + ')\n\n' + lines.join('\n'));
  return s;
}

function menuArchiveNow(e) { requireOperator_(e);
  if (!isOwnerUser_()) { alert_('Chỉ chủ file chạy được lưu trữ thủ công.'); return null; }
  if (maintMode_() !== 'OFF') { alert_('Đang bảo trì: tắt bảo trì (và không sửa tay tab nào) rồi chạy lại.'); return null; }
  var res = runArchive_({ force: true });
  alert_('Lưu trữ xong:\n\n' + res.map(function (r) { return r.tab + ': ' + (r.error ? 'LỖI ' + r.error : r.archived + ' dòng' + (r.year ? ' sang file năm ' + r.year : '') + (r.recovered ? ' (có hoàn tất lô dở)' : '') + (r.more ? ', CÒN DÒNG (hết thời gian): bấm lại hoặc chờ giờ sau' : '')); }).join('\n'));
  return res;
}

/** 5K: menu "Lưu trữ: mở file": link từng file lưu trữ (chép link mở trong trình duyệt). */
function menuArchiveFiles(e) { requireOperator_(e);
  var s = archiveStatus_();
  alert_(s.files.length ? 'File lưu trữ (' + getEnv_() + '):\n\n' + s.files.map(function (f) { return archiveFileName_(f.year) + '\nhttps://docs.google.com/spreadsheets/d/' + f.id; }).join('\n\n') : 'Chưa có file lưu trữ nào (lưu trữ chưa chuyển dòng nào).');
  return s.files;
}
