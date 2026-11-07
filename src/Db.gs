/**
 * Db.gs · Đọc ghi Google Sheets theo tên cột (v8)
 *
 * Dùng:
 *   var t = table_('BOOKINGS');
 *   t.all()                    mọi dòng dạng object, kèm _row (số hàng trong Sheets)
 *   t.filter(fn), t.find(fn), t.byId('BK000001')
 *   t.insert({ ... })          ghi dòng mới cuối tab, trả object vừa ghi
 *   t.update(rowObj, { status: 'CONFIRMED' })   chỉ ghi các ô thay đổi
 *   nextId_('BOOKINGS')        khoá tự sinh tiếp theo
 *
 * Cache trong một lần chạy: mỗi tab chỉ đọc Sheets 1 lần, insert và update cập nhật luôn cache.
 * Mọi thao tác ghi quan trọng phải nằm trong withLock_() (Booking.gs và các file dịch vụ).
 *
 * Ghi dòng mới (chunk 5, sau lượt soát độc lập):
 *   Trong khoá: dòng mới gom lại, ghi một lần khi ra khỏi khoá (một setValues cho mỗi tab) để tutor lưu 200 slot
 *   không giữ khoá cả phút. Tab tự thêm hàng khi sắp đầy (tab mới của Google chỉ có 1.000 hàng).
 *   Ngoài khoá (ghi log khi kiểm tra phiên, ghi MAIL_LOG sau lỗi): tự lấy khoá ngắn rồi ghi, để hai lần chạy cùng lúc
 *   không ghi đè dòng của nhau.
 *   Chữ do người dùng nhập bắt đầu bằng = + - @ không bao giờ thành công thức (chống chèn công thức vào Sheets).
 */

var DB_CACHE_ = {};
var SS_CACHE_ = null;
var DB_LOCK_DEPTH_ = 0;
var DB_GROW_ROWS_ = 500;
var BUSY_MESSAGE_ = 'Hệ thống đang bận, vui lòng thử lại sau ít giây.';

/*
 * Chunk 5I: dùng lại file đã mở ngoài khoá (trước đây mở lại cả lúc vào lẫn lúc ra khoá: một lượt đặt lịch mở file 4 lần, mỗi
 * lần vài trăm mili giây). Vào khoá ngoài cùng vẫn mở lại (withLock_). Đổi DB (cài đặt, PRODUCTION) thì mở lại.
 */
var SS_CACHE_ID_ = '';
function dbSpreadsheet_() {
  var id = getDbId_();
  if (!SS_CACHE_ || SS_CACHE_ID_ !== id) { SS_CACHE_ = SpreadsheetApp.openById(id); SS_CACHE_ID_ = id; }
  return SS_CACHE_;
}
function clearDbCache_() { flushDb_(); DB_CACHE_ = {}; SS_CACHE_ = null; forgetEnvMemo_(); }

/** Ghi mọi dòng mới đang gom của các tab xuống Sheets. */
function flushDb_() {
  Object.keys(DB_CACHE_).forEach(function (k) { DB_CACHE_[k].flush_(); });
  if (DB_LOCK_DEPTH_) flushLogAppend_();   // dòng nhật ký gom (logAppend_) chỉ có trong khoá
}

/** Tab chưa đủ hàng thì thêm hàng (getRange vượt số hàng của tab sẽ báo lỗi trên Google thật), kèm dropdown cho hàng mới. */
function ensureRows_(sheet, tableName, lastNeeded) {
  var max = sheet.getMaxRows();
  if (lastNeeded <= max) return;
  var add = Math.max(DB_GROW_ROWS_, lastNeeded - max);
  sheet.insertRowsAfter(max, add);
  applyDropdowns_(sheet, tableName, max + 1, add);
  // Chunk 5N: luật tô màu có vùng cố định (hàng 2 tới hết tab lúc đặt): nới vùng để phủ cả hàng vừa thêm (giữ luật admin tự thêm).
  // Lỗi tô màu không được làm hỏng lượt ghi dữ liệu (luật 39): chỉ ghi log.
  try { extendHighlightRanges_(sheet, max, max + add); } catch (e) { Logger.log('Nới vùng tô màu ' + tableName + ' lỗi: ' + e.message); }
}

/** Chữ bắt đầu bằng = + - @ ở cột không phải dạng chữ: thêm dấu nháy đơn để Sheets lưu nguyên văn, không chạy công thức. */
function safeCellText_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }

function table_(name) {
  if (DB_CACHE_[name]) return DB_CACHE_[name];
  var schema = SCHEMA[name];
  if (!schema) throw new Error('Tab không có trong SCHEMA: ' + name);
  var sh = dbSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Thiếu tab ' + name + ' trong file DB. Chạy menu thaiput > Cài đặt lần đầu.');
  var values = sh.getDataRange().getValues();
  var header = (values[0] || []).map(function (h) { return String(h).trim(); });
  var colIndex = {};
  var missing = [];
  schema.cols.forEach(function (c) {
    var i = header.indexOf(c);
    if (i === -1) {
      // Cột mới thêm ở bản cập nhật mà admin chưa chạy menu 1: cột "optional" đọc là trống, ghi thì bỏ qua (không làm sập đăng nhập).
      if (schema.optional && schema.optional.indexOf(c) !== -1) { missing.push(c); return; }
      throw new Error('Tab ' + name + ' thiếu cột "' + c + '". Chạy menu thaiput > 1. Cài đặt lần đầu / cập nhật cấu trúc.');
    }
    colIndex[c] = i;
  });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var line = values[r];
    var empty = true;
    // FALSE của ô tick (checkbox) chưa dùng không tính là dữ liệu.
    for (var k = 0; k < line.length; k++) { if (line[k] !== '' && line[k] !== null && line[k] !== false) { empty = false; break; } }
    if (empty) continue;
    var obj = { _row: r + 1 };
    schema.cols.forEach(function (c) { obj[c] = c in colIndex ? normalizeCell_(schema, c, line[colIndex[c]]) : ''; });
    rows.push(obj);
  }
  var t = new DbTable_(name, schema, sh, colIndex, rows, sh.getLastRow());
  DB_CACHE_[name] = t;
  // Dòng nhật ký đang chờ ghi thêm (logAppend_) mà trong cùng khoá lại cần đọc cả tab: chuyển vào bảng để đọc thấy ngay.
  if (LOG_APPEND_[name] && LOG_APPEND_[name].length) { var q = LOG_APPEND_[name]; LOG_APPEND_[name] = []; q.forEach(function (o) { t.insert(o); }); }
  return t;
}

/*
 * Chunk 5I (đo số lượt gọi Google): ghi một dòng ACTIVITY_LOG hay MAIL_LOG trước đây phải đọc CẢ tab (DbTable) trong khoá.
 * Hai tab này chỉ ghi thêm và lớn nhanh nhất (60 ngày nhật ký có thể vài chục nghìn dòng), nên mỗi lượt đặt, huỷ, đăng nhập
 * chậm dần theo thời gian. logAppend_ gom dòng trong khoá và ghi thêm ở cuối tab một lần (appendRowsRaw_: chỉ đọc hàng tiêu đề
 * và số hàng cuối). Ngoài khoá thì lấy một khoá ngắn như trước. Tab đã được đọc trong khoá này thì ghi qua bảng như cũ.
 */
var LOG_APPEND_ = {};
var LOG_APPEND_TABS_ = ['ACTIVITY_LOG', 'MAIL_LOG'];
function logAppend_(name, obj) {
  if (!DB_LOCK_DEPTH_) { withLock_(function () { logAppend_(name, obj); }); return; }
  if (DB_CACHE_[name]) { DB_CACHE_[name].insert(obj); return; }
  (LOG_APPEND_[name] || (LOG_APPEND_[name] = [])).push(obj);
}
function flushLogAppend_() {
  LOG_APPEND_TABS_.forEach(function (n) {
    var q = LOG_APPEND_[n];
    if (!q || !q.length) return;
    LOG_APPEND_[n] = [];
    appendRowsRaw_(n, q);
  });
}

function normalizeCell_(schema, col, v) {
  if (schema.dates && schema.dates.indexOf(col) !== -1) return asDate_(v);
  if (schema.text && schema.text.indexOf(col) !== -1) {
    if (col === 'slot') return asSlot_(v);
    return v === null || v === undefined ? '' : String(v);
  }
  return v;
}

function DbTable_(name, schema, sheet, colIndex, rows, lastRow) {
  this.name = name; this.schema = schema; this.sheet = sheet; this.colIndex = colIndex;
  this.rows = rows; this.lastRow = lastRow;
  this.pending = []; this.pendingByRow = {};
  var w = 0; Object.keys(colIndex).forEach(function (c) { w = Math.max(w, colIndex[c] + 1); });
  this.width = w;
}
DbTable_.prototype.isText_ = function (c) { return !!(this.schema.text && this.schema.text.indexOf(c) !== -1); };
DbTable_.prototype.isFormula_ = function (c) { return !!(this.schema.formulas && this.schema.formulas.indexOf(c) !== -1); };
DbTable_.prototype.all = function () { return this.rows.slice(); };
DbTable_.prototype.filter = function (fn) { return this.rows.filter(fn); };
DbTable_.prototype.find = function (fn) { for (var i = 0; i < this.rows.length; i++) if (fn(this.rows[i])) return this.rows[i]; return null; };
DbTable_.prototype.byId = function (id) {
  var key = this.schema.id;
  if (!key) throw new Error('Tab ' + this.name + ' không có cột khoá.');
  return this.find(function (r) { return String(r[key]) === String(id); });
};

/** Chuẩn bị giá trị ghi xuống ô: ngày ở cột ngày luôn là nửa đêm (luật CLAUDE.md số 2). */
DbTable_.prototype.cellValue_ = function (col, v) {
  if (v === undefined || v === null) return '';
  if (this.schema.dates && this.schema.dates.indexOf(col) !== -1 && v instanceof Date) return toMidnight_(v);
  return v;
};
/** Giá trị thật ghi xuống ô. Cột chữ có định dạng '@' nên Sheets không chạy công thức; cột công thức (contact_link) do code tự tạo. */
DbTable_.prototype.writeValue_ = function (col, v) {
  return !this.isText_(col) && !this.isFormula_(col) ? safeCellText_(v) : v;
};

DbTable_.prototype.insert = function (obj) {
  var self = this;
  var line = []; for (var i = 0; i < this.width; i++) line.push('');
  var stored = {};
  this.schema.cols.forEach(function (c) {
    var v = self.cellValue_(c, obj[c]);
    if (c in self.colIndex) line[self.colIndex[c]] = self.writeValue_(c, v);
    stored[c] = c in self.colIndex ? v : '';
  });
  // Ngoài khoá (log khi kiểm tra phiên, MAIL_LOG sau lỗi): lấy khoá ngắn để không ghi đè dòng của lần chạy khác.
  if (!DB_LOCK_DEPTH_) { var name = this.name; return withLock_(function () { return table_(name).insert(obj); }); }
  var row = this.lastRow + 1;
  var entry = { row: row, line: line, stored: stored };
  this.pending.push(entry); this.pendingByRow[row] = entry;
  this.lastRow = row;
  stored._row = row;
  this.schema.cols.forEach(function (c) { stored[c] = normalizeCell_(self.schema, c, stored[c]); });
  this.rows.push(stored);
  return stored;
};

/** Ghi các dòng đang gom: một lần thêm hàng nếu cần, một lần đặt định dạng chữ mỗi cột, một setValues. */
DbTable_.prototype.flush_ = function () {
  if (!this.pending.length) return;
  var self = this, list = this.pending, first = list[0].row, n = list.length;
  this.pending = []; this.pendingByRow = {};
  // Chống ghi đè (chunk 5F): ai đó gõ tay thêm dòng ở cuối tab trong lúc lượt này giữ khoá thì hàng định ghi không còn trống.
  // Dời cả lô xuống sau dòng cuối thật, sửa lại _row của các dòng vừa thêm.
  var realLast = this.sheet.getLastRow();
  if (realLast >= first) {
    var shift = realLast + 1 - first;
    list.forEach(function (e) { e.row += shift; if (e.stored) e.stored._row = e.row; });
    first += shift; this.lastRow = Math.max(this.lastRow + shift, first + n - 1);
  }
  ensureRows_(this.sheet, this.name, first + n - 1);
  (this.schema.text || []).forEach(function (c) { if (c in self.colIndex) self.sheet.getRange(first, self.colIndex[c] + 1, n, 1).setNumberFormat('@'); });
  // Ô tick chỉ đặt cho hàng có dữ liệu (đặt cả cột thì Sheets có thể ghi FALSE vào hàng trống, làm tab trông như đầy).
  (this.schema.checkbox || []).forEach(function (c) { if (c in self.colIndex) self.sheet.getRange(first, self.colIndex[c] + 1, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build()); });
  this.sheet.getRange(first, 1, n, this.width).setValues(list.map(function (e) { return e.line; }));
  if (this.name === 'CONFIG') { dropConfigCache_(); markSlotsDirty_(); }
  if (this.name === 'BOOKINGS' || this.name === 'AVAILABILITY') markSlotsDirty_();
  this._ids = null;   // vừa thêm dòng: lần kiểm sau đọc lại cột khoá
};

/**
 * Chống ghi nhầm dòng (chunk 5F, soát kiến trúc F8): admin sắp xếp (sort) tab hoặc xoá dòng tay đúng lúc một lượt ghi đang chạy
 * thì số hàng đọc lúc vào khoá không còn đúng. Trước mỗi lần ghi theo hàng, so khoá của dòng với cột khoá thật trên Sheets.
 * Cột khoá đọc MỘT lần cho cả lô (getValues) và dùng lại tối đa VERIFY_FRESH_MS_ (soát R1 L4: đọc từng ô xen kẽ với ghi làm
 * mất việc gom ghi của Google). Lệch thì ghi vào hàng thật theo khoá. Không thấy khoá thì dừng (thà báo lỗi còn hơn ghi nhầm).
 */
var VERIFY_FRESH_MS_ = 1500;
DbTable_.prototype.verifyRow_ = function (rowObj) {
  var key = this.schema.id;
  if (!key || !(key in this.colIndex)) return;
  var want = String(rowObj[key]), now = Date.now();
  if (!this._ids || now - this._idsAt > VERIFY_FRESH_MS_) {
    var col = this.colIndex[key] + 1, last = this.sheet.getLastRow();
    var vals = last >= 2 ? this.sheet.getRange(2, col, last - 1, 1).getValues() : [];
    this._ids = {}; this._idRows = {};
    for (var i = 0; i < vals.length; i++) { var id = String(vals[i][0]); this._ids[i + 2] = id; if (!(id in this._idRows)) this._idRows[id] = i + 2; }
    this._idsAt = now;
  }
  if (this._ids[rowObj._row] === want) return;
  var found = this._idRows[want];
  if (!found) throw new Error('Tab ' + this.name + ': không thấy dòng ' + want + ' (có thể vừa bị xoá tay). Không ghi gì thêm.');
  try { Logger.log('Tab ' + this.name + ': dòng ' + want + ' đã dời từ hàng ' + rowObj._row + ' sang ' + found + ' (có người sắp xếp tab).'); } catch (e) { }
  rowObj._row = found;
};

DbTable_.prototype.update = function (rowObj, patch) {
  var self = this;
  if (!rowObj || !rowObj._row) throw new Error('update cần dòng đã đọc từ ' + this.name);
  var pend = this.pendingByRow[rowObj._row];
  Object.keys(patch).forEach(function (c) {
    if (!(c in self.colIndex)) {
      if (self.schema.optional && self.schema.optional.indexOf(c) !== -1) return;
      throw new Error('Tab ' + self.name + ' không có cột ' + c);
    }
    var v = self.cellValue_(c, patch[c]);
    if (pend) pend.line[self.colIndex[c]] = self.writeValue_(c, v); // dòng chưa ghi xuống Sheets: sửa trong lô
    else {
      self.verifyRow_(rowObj);
      var range = self.sheet.getRange(rowObj._row, self.colIndex[c] + 1);
      if (self.isText_(c)) range.setNumberFormat('@');
      range.setValue(self.writeValue_(c, v));
    }
    rowObj[c] = normalizeCell_(self.schema, c, v);
  });
  if (this.name === 'CONFIG') { dropConfigCache_(); markSlotsDirty_(); }
  // Danh sách slot đệm (Booking.gs slotGrid_) hết hiệu lực khi lịch thay đổi; cột sổ sách Calendar, nhắc thì không ảnh hưởng slot.
  if ((this.name === 'BOOKINGS' || this.name === 'AVAILABILITY') && Object.keys(patch).some(function (c) { return SLOT_NEUTRAL_COLS_.indexOf(c) === -1; })) markSlotsDirty_();
  return rowObj;
};
var SLOT_NEUTRAL_COLS_ = ['event_id', 'meet_link', 'cal_state', 'cal_attempts', 'cal_next_at', 'reminder_sent_at', 'day_reminder_at', 'admin_action', 'admin_note', 'result_at', 'result_by', 'tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap', 'result_notice_at', 'admin_done_at'];

/**
 * Bỏ các dòng mà keepFn trả false (keepFn nhận object của dòng, đọc MỚI từ Sheets ngay lúc bỏ). Phải gọi trong withLock_.
 * Chunk 5G (soát R1 H1, M1; R2 T1, T2; R3 N1, N2, N6, N7):
 *   1. Quyết định giữ hay bỏ theo NỘI DUNG đọc lại trong lúc bỏ, không theo số hàng của lần đọc trước: admin sắp xếp tab
 *      hay gõ thêm dòng tay đúng lúc đó cũng không làm bỏ nhầm dòng.
 *   2. Ghi các dòng giữ lại lên đầu tab TRƯỚC, rồi mới xoá phần đuôi thừa: bị cắt giữa hai bước thì tab chỉ thừa đuôi
 *      (trùng), không bao giờ trống. Trước khi ghi, mốc PURGE_OPEN_<tab> lưu số dòng giữ, hàng cuối cũ và DẤU VÂN TAY
 *      (băm nội dung gốc, phần giữ, phần đuôi). purgeRecover_ chỉ xoá đuôi khi nội dung khớp đúng dấu vân tay.
 *   3. Ô tick ở đuôi: gỡ ô tick rồi mới xoá, để hàng thật sự trống (tab không dài ra mãi).
 * Trả số dòng đã bỏ. opts.removed (mảng): nhận các object đã bỏ. opts.rowMap (object): hàng cũ → hàng mới của dòng giữ lại.
 */
function purgeRows_(name, keepFn, opts) {
  if (!DB_LOCK_DEPTH_) throw new Error('purgeRows_ phải chạy trong withLock_');
  flushDb_();
  purgeRecover_(name);
  var t = table_(name), sh = t.sheet, last = sh.getLastRow();
  if (last < 2) return 0;
  var width = sh.getLastColumn();
  var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  var rng = sh.getRange(2, 1, last - 1, width), raw = rng.getValues(), fx = rng.getFormulas();
  var schema = t.schema, colIdx = {}, plainCol = {}, knownCol = {};
  schema.cols.forEach(function (c) { colIdx[c] = header.indexOf(c); if (colIdx[c] !== -1) knownCol[colIdx[c]] = true; });
  schema.cols.forEach(function (c) { if (colIdx[c] !== -1 && (schema.text || []).indexOf(c) === -1 && (schema.formulas || []).indexOf(c) === -1) plainCol[colIdx[c]] = true; });
  var keepRows = [], keepVals = [], removed = 0, rowMap = {};
  for (var i = 0; i < raw.length; i++) {
    var line = raw[i], empty = true;
    for (var q = 0; q < line.length; q++) { if (line[q] !== '' && line[q] !== null && line[q] !== false) { empty = false; break; } }
    if (empty) continue;   // hàng trống giữa tab: bỏ luôn (gọn tab), không tính là dòng bị bỏ
    var obj = { _row: i + 2 };
    schema.cols.forEach(function (c) { obj[c] = colIdx[c] === -1 ? '' : normalizeCell_(schema, c, line[colIdx[c]]); });
    // getValues trả kết quả hiển thị của công thức (ví dụ HYPERLINK cột contact_link): ghi lại công thức gốc, không ghi chữ.
    var out = line.slice();
    for (var j = 0; j < out.length; j++) {
      if (fx[i] && fx[i][j]) out[j] = fx[i][j];
      // Soát 5I A1: Google trả chữ "=1+1" đã thêm dấu nháy KHÔNG kèm dấu nháy; ghi lại nguyên sẽ thành công thức (phá luật 26).
      // Vòng 2 N4: cột admin tự thêm (ngoài SCHEMA) cũng vậy.
      else if (plainCol[j] || !knownCol[j]) out[j] = safeCellText_(line[j]);
    }
    if (keepFn(obj)) { rowMap[i + 2] = keepRows.length + 2; keepRows.push(out); keepVals.push(line); }
    else { removed++; if (opts && opts.removed) opts.removed.push(obj); }
  }
  if (!removed) return 0;   // không bỏ dòng nào (hàng trống giữa tab để nguyên)
  if (name === 'BOOKINGS' || name === 'AVAILABILITY') markSlotsDirty_();
  if (opts && opts.rowMap) Object.keys(rowMap).forEach(function (k) { opts.rowMap[k] = rowMap[k]; });
  var props = props_(), key = 'PURGE_OPEN_' + name, k = keepRows.length;
  props.setProperty(key, JSON.stringify({ keep: k, last: last, width: width,
    all: purgeHash_(raw), kept: purgeHash_(keepVals), tail: purgeHash_(raw.slice(k)) }));
  if (k) sh.getRange(2, 1, k, width).setValues(keepRows);
  if (last > k + 1) purgeClearTail_(sh, schema, header, k + 2, last - k - 1, width);
  props.deleteProperty(key);
  // Nạp lại ngay vào chính đối tượng bảng đang được giữ, để lần insert hoặc update sau trong cùng khoá dùng đúng số hàng mới.
  // Soát 5I A10: dòng đang chờ ghi của chính tab này (ví dụ PURGE_RECOVERED của ACTIVITY_LOG vừa ghi ở trên) phải giữ lại,
  // ghi tiếp sau phần giữ lại, không bỏ.
  var carry = t.pending.map(function (e) { var o = {}; schema.cols.forEach(function (c) { o[c] = e.stored[c]; }); return o; });
  delete DB_CACHE_[name];
  var fresh = table_(name);
  t.rows = fresh.rows; t.lastRow = fresh.lastRow; t.pending = []; t.pendingByRow = {}; t._ids = null;
  DB_CACHE_[name] = t;
  carry.forEach(function (o) { t.insert(o); });
  return removed;
}

/** Băm nội dung các hàng (giá trị hiển thị; ngày giờ tới giây) làm dấu vân tay cho purgeRecover_. */
function purgeHash_(rows) {
  return sha256Hex_(JSON.stringify(rows.map(function (r) { return r.map(function (v) { return v instanceof Date ? 'D' + Math.round(v.getTime() / 1000) : v; }); })));
}
/** Xoá đuôi: gỡ ô tick ở các cột checkbox trước (ô tick bị xoá vẫn còn FALSE), rồi xoá nội dung. */
function purgeClearTail_(sh, schema, header, fromRow, n, width) {
  (schema.checkbox || []).forEach(function (c) { var ci = header.indexOf(c); if (ci !== -1) sh.getRange(fromRow, ci + 1, n, 1).setDataValidation(null); });
  sh.getRange(fromRow, 1, n, width).clearContent();
}

/**
 * Lần purgeRows_ trước bị cắt (mốc PURGE_OPEN_<tab> còn). Đọc lại tab, so dấu vân tay:
 *   phần giữ đã ghi xong, đuôi còn nguyên như lúc hỏng → xoá đúng đuôi (hàng keep+2 tới hàng cuối cũ);
 *   tab còn nguyên như trước khi ghi (lệnh ghi không chạy) → chỉ bỏ mốc;
 *   khác cả hai (admin đã sắp xếp, sửa tay sau khi hỏng) → KHÔNG xoá gì, báo Khẩn để admin kiểm dòng trùng.
 * Dòng thêm sau khi hỏng nằm sau hàng cuối cũ nên không bao giờ bị đụng. Phải gọi trong withLock_. Trả số hàng đã dọn.
 */
function purgeRecover_(name) {
  var props = props_(), key = 'PURGE_OPEN_' + name, rawMark = props.getProperty(key);
  if (!rawMark) return 0;
  var o = JSON.parse(rawMark), sh = dbSpreadsheet_().getSheetByName(name), n = o.last - o.keep - 1, outcome = 'none', cleared = 0;
  if (sh && o.last >= 2) {
    var width = o.width || sh.getLastColumn(), cur = sh.getRange(2, 1, o.last - 1, width).getValues();
    if (purgeHash_(cur) === o.all) outcome = 'not_written';
    else if (purgeHash_(cur.slice(0, o.keep)) === o.kept && purgeHash_(cur.slice(o.keep)) === o.tail) {
      if (n > 0) { var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); }); purgeClearTail_(sh, SCHEMA[name], header, o.keep + 2, n, width); cleared = n; }
      outcome = 'cleared';
    } else outcome = 'changed';
  }
  props.deleteProperty(key);
  delete DB_CACHE_[name];
  if (outcome === 'changed') {
    try { notify_('PURGE_CHECK', { entity: 'SHEET', entity_id: name, link: rowLink_(name),
      message: 'Tab ' + name + ': lần bỏ dòng (lưu trữ hoặc dọn) bị cắt giữa chừng và tab đã bị sửa tay sau đó, hệ thống không tự dọn. Kiểm dòng trùng ở cuối tab (từ hàng ' + (o.keep + 2) + ' tới ' + o.last + ') và xoá tay bản trùng.', message_en: 'Tab ' + name + ': a row removal (archive or cleanup) was cut midway and the tab was edited by hand afterwards, so the system will not clean up. Check duplicate rows at the end of the tab (rows ' + (o.keep + 2) + ' to ' + o.last + ') and delete the duplicates by hand.' }); } catch (e) { }
  }
  try { logActivity_('SYSTEM', 'PURGE_RECOVERED', 'SHEET', name, JSON.stringify({ outcome: outcome, cleared: cleared })); } catch (e) { }
  if (cleared && (name === 'BOOKINGS' || name === 'AVAILABILITY')) markSlotsDirty_();
  return cleared;
}

/**
 * Ghi cùng một giá trị vào cột col cho nhiều dòng bằng một lần setValues (thay vì mỗi dòng một lần ghi).
 * Phải gọi trong withLock_. Dòng không nằm trong rows giữ nguyên giá trị đang có.
 */
function setColumnForRows_(t, col, rows, value) {
  if (!DB_LOCK_DEPTH_) throw new Error('setColumnForRows_ phải chạy trong withLock_');
  flushDb_();
  var c = t.colIndex[col] + 1, last = t.sheet.getLastRow();
  if (last < 2 || !rows.length) return 0;
  var rng = t.sheet.getRange(2, c, last - 1, 1), vals = rng.getValues(), want = {};
  rows.forEach(function (r) { want[r._row] = true; });
  for (var i = 0; i < vals.length; i++) if (want[i + 2]) vals[i][0] = value;
  rng.setValues(vals);
  rows.forEach(function (r) { r[col] = value; });
  return rows.length;
}

/**
 * Thêm dòng vào cuối một tab KHÔNG đọc cả tab (chunk 5F, soát R2 T7): chỉ đọc hàng tiêu đề. Dùng cho tab chỉ ghi thêm,
 * không tra cứu trong code (METRICS). Phải gọi trong withLock_. Trả số dòng đã ghi.
 */
function appendRowsRaw_(name, objs) {
  if (!DB_LOCK_DEPTH_) throw new Error('appendRowsRaw_ phải chạy trong withLock_');
  if (!objs.length) return 0;
  var sh = dbSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Thiếu tab ' + name);
  var all = sh.getLastColumn(), header = sh.getRange(1, 1, 1, all).getValues()[0].map(function (h) { return String(h).trim(); });
  // Soát 5I A15: chỉ ghi tới cột cuối thuộc SCHEMA (như DbTable), không ghi ô trống đè cột admin tự thêm (ARRAYFORMULA).
  var width = 0; SCHEMA[name].cols.forEach(function (c) { width = Math.max(width, header.indexOf(c) + 1); });
  if (!width) throw new Error('Tab ' + name + ' thiếu cột. Chạy menu 1.');
  header = header.slice(0, width);
  var first = sh.getLastRow() + 1;
  ensureRows_(sh, name, first + objs.length - 1);
  var text = SCHEMA[name].text || [];
  // Cột chữ liền nhau đặt định dạng một lần (ACTIVITY_LOG: 1 lệnh cho 5 cột), không mỗi cột một lệnh.
  var tcols = header.map(function (h, i) { return text.indexOf(h) !== -1 ? i + 1 : 0; }).filter(Boolean);
  for (var a = 0; a < tcols.length;) { var b = a; while (b + 1 < tcols.length && tcols[b + 1] === tcols[b] + 1) b++; sh.getRange(first, tcols[a], objs.length, tcols[b] - tcols[a] + 1).setNumberFormat('@'); a = b + 1; }
  sh.getRange(first, 1, objs.length, width).setValues(objs.map(function (o) { return header.map(function (h) { var v = o[h]; return v === undefined || v === null ? '' : (text.indexOf(h) === -1 ? safeCellText_(v) : v); }); }));
  return objs.length;
}

var ID_FLOOR_MEMO_ = {};
function idFloor_(tableName) {
  if (!(tableName in ID_FLOOR_MEMO_)) { var v = 0; try { v = Number(props_().getProperty('ID_FLOOR_' + tableName) || 0); } catch (e) { } ID_FLOOR_MEMO_[tableName] = v; }
  return ID_FLOOR_MEMO_[tableName];
}

/** Khoá tiếp theo, ví dụ BK000124. Phải gọi trong withLock_ để hai người không lấy trùng. */
function nextId_(kind) {
  var fmt = ID_FORMAT[kind];
  if (!fmt) throw new Error('Không có định dạng khoá cho ' + kind);
  var tableName = kind.indexOf('USERS') === 0 ? 'USERS' : kind;
  var t = table_(tableName), key = t.schema.id, prefix = fmt[0], width = fmt[1], max = 0;
  var re = new RegExp('^' + prefix + '(\\d+)$');
  t.rows.forEach(function (r) { var m = String(r[key]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  max = Math.max(max, idFloor_(tableName));   // chunk 5G: không cấp lại số của dòng đã chuyển sang file lưu trữ
  var n = String(max + 1);
  while (n.length < width) n = '0' + n;
  return prefix + n;
}

/**
 * Chạy fn trong khoá toàn script (luật CLAUDE.md số 5). Luôn đọc lại dữ liệu mới sau khi lấy khoá.
 * Gọi lồng (đã giữ khoá) thì chạy luôn. Ra khỏi khoá: ghi các dòng đang gom, xoá cache để lần đọc sau không dùng số hàng cũ.
 *
 * Chunk 5F (giảm thời gian giữ khoá, soát kiến trúc F1 đến F3):
 *   afterLock_(fn): việc chậm (Calendar, email) đăng ký trong khoá, chạy NGAY SAU khi nhả khoá ngoài cùng, trước khi withLock_ trả về.
 *   deferWrite_(fn): ghi nhỏ phát sinh sau khi nhả khoá (mã sự kiện, MAIL_LOG, nhật ký) gom lại, ghi trong MỘT khoá ngắn cuối cùng.
 *   Lỗi trong hai loại việc này không làm hỏng kết quả đã ghi (booking đã ghi thì không bao giờ báo "hệ thống bận").
 */
/**
 * Phiên bản danh sách slot đệm (Booking.gs slotGrid_) tăng SAU khi dữ liệu đã tới Sheets (soát R1 L5): trong khoá chỉ đánh dấu,
 * withLock_ tăng phiên bản sau SpreadsheetApp.flush. Ngoài khoá tăng ngay.
 */
var SLOTS_DIRTY_ = false;
function markSlotsDirty_() { if (DB_LOCK_DEPTH_) SLOTS_DIRTY_ = true; else bumpSlotsVersion_(); }

var AFTER_LOCK_ = [];
var DEFER_WRITES_ = [];
var AFTER_LOCK_RUNNING_ = false;
var DEFER_ACTIVE_ = 0;

function afterLock_(fn) {
  if (DB_LOCK_DEPTH_) { AFTER_LOCK_.push(fn); return; }
  try { fn(); } catch (e) { afterLockError_(e); }
}
function deferWrite_(fn) {
  if (DB_LOCK_DEPTH_) return fn();
  DEFER_WRITES_.push(fn);
}
/** true khi đang ở pha sau khoá hoặc trong một lượt gọi API: ghi nhỏ ngoài khoá được gom thay vì lấy khoá riêng. */
function deferActive_() { return AFTER_LOCK_RUNNING_ || DEFER_ACTIVE_ > 0; }
function afterLockError_(e) {
  try { Logger.log('Việc sau khoá lỗi: ' + ((e && e.stack) || e)); } catch (x) { }
  try { metricAdd_('_after_lock_error', 0, { error: true }); } catch (x2) { }
}

/** Chạy các việc sau khoá, rồi ghi các thay đổi đã gom trong một khoá ngắn. Không ném lỗi. */
function runAfterLock_() {
  if (AFTER_LOCK_RUNNING_) return;
  AFTER_LOCK_RUNNING_ = true;
  try {
    for (var guard = 0; AFTER_LOCK_.length && guard < 5; guard++) {
      var list = AFTER_LOCK_; AFTER_LOCK_ = [];
      list.forEach(function (fn) { try { fn(); } catch (e) { afterLockError_(e); } });
    }
  } finally { AFTER_LOCK_RUNNING_ = false; }
  flushDeferred_();
}

/** Ghi mọi thay đổi đã gom (deferWrite_) trong một khoá. Khoá bận quá 10 giây thì bỏ, ghi vào số đo (hàng đợi tự làm lại). */
function flushDeferred_() {
  if (!DEFER_WRITES_.length || DB_LOCK_DEPTH_) return;
  var list = DEFER_WRITES_; DEFER_WRITES_ = [];
  try {
    withLock_(function () { list.forEach(function (fn) { try { fn(); } catch (e) { afterLockError_(e); } }); }, 10000);
  } catch (e) {
    try { Logger.log('Không ghi được ' + list.length + ' thay đổi sau khoá: ' + e.message); } catch (x) { }
    try { metricAdd_('_deferred_dropped', 0, { error: true }); } catch (x2) { }
  }
}

function withLock_(fn, waitMs) {
  if (DB_LOCK_DEPTH_) return fn();
  var lock = LockService.getScriptLock(), t0 = Date.now();
  if (!lock.tryLock(waitMs || 30000)) { try { metricAdd_('_lock_busy', Date.now() - t0, { busy: true }); } catch (x) { } throw new Error(BUSY_MESSAGE_); }
  var t1 = Date.now();
  DB_LOCK_DEPTH_ = 1;
  var out;
  try {
    // Soát 5I A5: mở lại file mỗi lần vào khoá ngoài cùng. Google không ghi rõ đối tượng Spreadsheet đã mở có giữ bộ đệm đọc
    // giữa hai khoá hay không; dữ liệu quyết định ghi (slot, gói) luôn đọc bằng đối tượng mở trong khoá. Ngoài khoá thì dùng lại.
    DB_CACHE_ = {}; SS_CACHE_ = null;
    out = fn();
    flushDb_();
    SpreadsheetApp.flush();
  } finally {
    try { flushDb_(); } catch (fe) { Logger.log('Ghi dòng còn lại khi thoát khoá lỗi: ' + fe.message); } finally {
      if (SLOTS_DIRTY_) { SLOTS_DIRTY_ = false; try { SpreadsheetApp.flush(); } catch (x) { } bumpSlotsVersion_(); }
      DB_LOCK_DEPTH_ = 0;
      DB_CACHE_ = {};
      lock.releaseLock();
      try { metricAdd_('_lock_wait', t1 - t0, {}); metricAdd_('_lock_hold', Date.now() - t1, {}); } catch (x) { }
    }
    // Ngoài khoá: Calendar, email đã đăng ký trong khoá, rồi ghi gom. Chạy cả khi fn ném lỗi, vì dòng đã ghi (flushDb_ ở trên).
    if (AFTER_LOCK_.length || DEFER_WRITES_.length) runAfterLock_();
  }
  return out;
}
