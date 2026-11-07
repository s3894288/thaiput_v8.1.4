/**
 * gas_mock.js · Giả lập các dịch vụ Google Apps Script cho test v8
 *
 * Nguyên tắc (CLAUDE.md luật 14): harness không được "tốt bụng" hơn Google thật.
 *   Sheets: ô không đặt định dạng chữ '@' thì chuỗi số bị đổi thành số ('+84912345678' thành 84912345678),
 *           chuỗi 'HH:mm' bị đổi thành giờ (Date ngày 30/12/1899). Đúng như Sheets thật tự nhận dạng.
 *   Sheets không tự tính lại gì cả; công thức chỉ được lưu dạng chuỗi.
 *   Calendar, Mail, Drive: ghi lại mọi lời gọi để kịch bản kiểm tra ai được mời, ai nhận email, mấy lần.
 */
'use strict';
const crypto = require('crypto');

function createGasEnv(opts) {
  opts = opts || {};
  const state = {
    spreadsheets: {},   // id -> { name, tz, sheets: { name -> { values: [[]], formats: {} } } }
    props: Object.assign({}, opts.props || {}),
    mails: [],
    calendarCalls: [],
    events: {},         // eventId -> resource
    calendars: {},
    cache: {},
    drive: { files: {}, folders: {} },
    triggers: [],
    activeUserEmail: opts.activeUserEmail || 'admin.karn@gmail.com',
    effectiveUserEmail: 'booking@thaiput.vn',
    lockCalls: 0,
    formulaWrites: [],  // chuỗi bắt đầu bằng = ghi vào ô không phải dạng chữ: Sheets thật sẽ chạy thành công thức
    counter: 0
  };
  const nextId = (p) => p + (++state.counter);

  // ── Sheets ──
  function autoParse(v) {
    if (typeof v !== 'string') return v;
    if (/^[+-]?\d+(\.\d+)?$/.test(v.trim())) return Number(v.trim());
    const t = v.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (t) return new Date(1899, 11, 30, Number(t[1]), Number(t[2]), 0);
    return v;
  }
  /** Chữ hiển thị của ô công thức: HYPERLINK("url";"chữ") hoặc HYPERLINK("url","chữ") hiện "chữ"; công thức khác giữ nguyên chuỗi. */
  function displayOf(v) {
    if (typeof v !== 'string' || !/^=HYPERLINK\(/i.test(v)) return v;
    const m = v.match(/^=HYPERLINK\(\s*"([^"]*)"\s*[;,]\s*"([^"]*)"\s*\)$/i);
    return m ? m[2] : v;
  }
  // Google thật: ô ghi '=1+1 (có dấu nháy) là CHỮ: getValues trả "=1+1", getFormulas trả rỗng. Đánh dấu theo hàng để đi theo khi xoá hàng.
  function lit(line, idx, on) { if (on) { if (!line._lit) Object.defineProperty(line, '_lit', { value: {}, writable: true, enumerable: false }); line._lit[idx] = true; } else if (line._lit) delete line._lit[idx]; }
  function makeSheet(ss, name) {
    const sh = ss.sheets[name];
    const ensureRow = (r) => { while (sh.values.length < r) sh.values.push([]); };
    const width = () => sh.values.reduce((m, r) => Math.max(m, r.length), 0);
    const lastRow = () => {
      for (let r = sh.values.length; r >= 1; r--) {
        const line = sh.values[r - 1] || [];
        if (line.some(x => x !== '' && x !== null && x !== undefined)) return r;
      }
      return 0;
    };
    const maxRows = () => sh.maxRows || 1000, maxCols = () => sh.maxCols || 26;
    function range(row, col, nr, nc) {
      nr = nr || 1; nc = nc || 1;
      // Google thật: vùng vượt số hàng hoặc số cột của tab thì báo lỗi, không tự thêm hàng.
      if (row < 1 || col < 1 || row + nr - 1 > maxRows() || col + nc - 1 > maxCols()) throw new Error('Exception: The coordinates of the range are outside the dimensions of the sheet. (' + name + ' hàng ' + (row + nr - 1) + '/' + maxRows() + ')');
      const R = {
        // Google thật: getValues trả KẾT QUẢ của công thức (HYPERLINK trả chữ hiển thị), getFormulas mới trả công thức.
        getValues: () => { state.readCalls = (state.readCalls || 0) + 1; state.cellsRead = (state.cellsRead || 0) + nr * nc; const out = []; for (let i = 0; i < nr; i++) { const line = sh.values[row - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) { const v = line[col - 1 + j]; o.push(v === undefined ? '' : (line._lit && line._lit[col - 1 + j]) ? v : displayOf(v)); } out.push(o); } return out; },
        getFormulas: () => { const out = []; for (let i = 0; i < nr; i++) { const line = sh.values[row - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) { const v = line[col - 1 + j]; o.push(typeof v === 'string' && v.charAt(0) === '=' && !(line._lit && line._lit[col - 1 + j]) ? v : ''); } out.push(o); } return out; },
        getValue: () => R.getValues()[0][0],
        setValues: (vals) => {
          // Giả lập Google từ chối lệnh ghi (Service timed out) trên đúng một tab, trước khi ghi gì (soát R3 N1).
          if (state.failSetValuesOnce && state.failSetValuesOnce === name && nr > 1) { state.failSetValuesOnce = null; throw new Error('Service Spreadsheets timed out (giả lập)'); }
          state.writeCalls = (state.writeCalls || 0) + 1;
          if (vals.length !== nr || vals.some(l => l.length !== nc)) throw new Error('Kích thước dữ liệu không khớp vùng ghi (' + nr + 'x' + nc + ')');
          for (let i = 0; i < nr; i++) { ensureRow(row + i); const line = sh.values[row - 1 + i]; for (let j = 0; j < nc; j++) { const key = (row + i) + ':' + (col + j); const v = vals[i][j]; lit(line, col - 1 + j, false); if (sh.formats[key] === '@') { line[col - 1 + j] = v instanceof Date ? v : (v === '' || v === null || v === undefined ? '' : String(v)); lit(line, col - 1 + j, typeof line[col - 1 + j] === 'string' && line[col - 1 + j].charAt(0) === '='); }
            else if (typeof v === 'string' && v.charAt(0) === "'") { line[col - 1 + j] = v.substring(1); lit(line, col - 1 + j, true); }
            else { if (typeof v === 'string' && /^[=+\-@]/.test(v) && !/^[+-]?\d/.test(v)) state.formulaWrites.push({ sheet: name, cell: key, value: v }); line[col - 1 + j] = autoParse(v); } } }
          return R;
        },
        setValue: (v) => R.setValues([[v]]),
        setNumberFormat: (f) => { state.writeCalls = (state.writeCalls || 0) + 1; for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) sh.formats[(row + i) + ':' + (col + j)] = f; return R; },
        setFormula: (f) => { ensureRow(row); sh.values[row - 1][col - 1] = f; lit(sh.values[row - 1], col - 1, false); return R; },
        setFontWeight: () => R, setBackground: () => R, setDataValidation: () => R, setWrap: () => R, setFontColor: () => R,
        clearContent: () => { if (state.failClearOnce) { state.failClearOnce = false; throw new Error('Service error: Spreadsheets (giả lập)'); } for (let i = 0; i < nr; i++) { const line = sh.values[row - 1 + i]; if (!line) continue; for (let j = 0; j < nc; j++) line[col - 1 + j] = ''; } return R; },
        getRow: () => row, getColumn: () => col, getNumRows: () => nr, getNumColumns: () => nc,
        getSheet: () => S
      };
      return R;
    }
    const S = {
      getName: () => name,
      getDataRange: () => range(1, 1, Math.max(1, lastRow()), Math.max(1, width())),
      getRange: (a, b, c, d) => {
        if (typeof a === 'string') {
          const r2 = a.match(/^([A-Z])(\d+):([A-Z])(\d*)$/); // ví dụ 'O2:O' (đến hết tab)
          if (r2) { const c1 = r2[1].charCodeAt(0) - 64, c2 = r2[3].charCodeAt(0) - 64, r1 = Number(r2[2]), end = r2[4] ? Number(r2[4]) : maxRows(); return range(r1, c1, end - r1 + 1, c2 - c1 + 1); }
          const m = a.match(/^([A-Z]+)(\d+)$/); return range(Number(m[2]), m[1].charCodeAt(0) - 64, 1, 1);
        }
        return range(a, b, c, d);
      },
      getLastRow: lastRow, getLastColumn: width,
      getMaxRows: maxRows, getMaxColumns: maxCols,
      insertRowsAfter: (after, n) => { sh.maxRows = maxRows() + n; return S; },
      insertColumnsAfter: (after, n) => { sh.maxCols = maxCols() + n; return S; },
      setConditionalFormatRules: (rules) => { sh.cfRules = rules; return S; }, getConditionalFormatRules: () => sh.cfRules || [],
      setFrozenRows: () => S, setTabColor: () => S, hideSheet: () => { sh.hidden = true; return S; }, autoResizeColumns: () => S,
      // Google thật: đổi tên tab, trùng tên tab khác thì báo lỗi.
      setName: (nn) => { if (nn !== name && ss.sheets[nn]) throw new Error('Exception: A sheet with the name "' + nn + '" already exists.'); delete ss.sheets[name]; ss.sheets[nn] = sh; name = nn; return S; },
      clear: () => { sh.values = []; sh.formats = {}; return S; },
      getSheetId: () => name, getParent: () => ssApi(ss),
      // Chọn dòng (5L): test đặt state.activeRow để giả lập admin chọn một dòng rồi bấm menu.
      getActiveRange: () => range(state.activeRow || 2, 1, 1, 1), getActiveRangeList: () => ({ getRanges: () => [range(state.activeRow || 2, 1, 1, 1)] })
    };
    return S;
  }
  function ssApi(ss) {
    return {
      getId: () => ss.id, getName: () => ss.name, getUrl: () => 'https://docs.google.com/spreadsheets/d/' + ss.id,
      getSheetByName: (n) => ss.sheets[n] ? makeSheet(ss, n) : null,
      getSheets: () => Object.keys(ss.sheets).map(n => makeSheet(ss, n)),
      insertSheet: (n) => { if (ss.sheets[n]) throw new Error('Sheet đã tồn tại: ' + n); ss.sheets[n] = { values: [], formats: {}, maxRows: 1000, maxCols: 26 }; return makeSheet(ss, n); },
      getSpreadsheetTimeZone: () => ss.tz, setSpreadsheetTimeZone: (tz) => { ss.tz = tz; }
    };
  }
  // File Sheets thật luôn là một file Drive có chủ (người tạo).
  function createSpreadsheet(id, name) { state.spreadsheets[id] = { id, name: name || id, tz: 'Asia/Ho_Chi_Minh', sheets: {} }; if (state.drive && !state.drive.files[id]) state.drive.files[id] = { id, name: name || id, owner: state.effectiveUserEmail, created: new Date(0) }; return ssApi(state.spreadsheets[id]); }
  const SpreadsheetApp = {
    openById: (id) => { const ss = state.spreadsheets[id]; if (!ss) throw new Error('Không mở được spreadsheet ' + id); return ssApi(ss); },
    // Google thật: file mới luôn có 1 tab trống ("Sheet1", hoặc "Trang tính1" theo ngôn ngữ) (soát R2 T26).
    create: (name) => { const ss = createSpreadsheet(nextId('SS_'), name); state.spreadsheets[ss.getId()].sheets.Sheet1 = { values: [], formats: {}, maxRows: 1000, maxCols: 26 }; return ss; },
    flush: () => {},
    getActive: () => { const id = state.activeSpreadsheetId; return id ? ssApi(state.spreadsheets[id]) : null; },
    getActiveSheet: () => { const id = state.activeSpreadsheetId || Object.keys(state.spreadsheets)[0]; return ssApi(state.spreadsheets[id]).getSheetByName(state.activeSheetName || 'USERS'); },
    // Hộp thoại: mặc định không có (như trigger). Test đặt state.uiScript = [{ button, text }] để giả lập người bấm menu.
    getUi: () => {
      if (!state.uiScript) throw new Error('Không có giao diện trong test');
      const Button = { OK: 'OK', CANCEL: 'CANCEL', YES: 'YES', NO: 'NO', CLOSE: 'CLOSE' };
      const answer = () => { const a = state.uiScript.shift(); if (!a) throw new Error('Kịch bản hộp thoại hết câu trả lời'); return a; };
      return {
        Button, ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO', YES_NO_CANCEL: 'YES_NO_CANCEL' },
        prompt: (title, msg) => { const a = answer(); (state.uiLog = state.uiLog || []).push({ kind: 'prompt', title, msg: msg || '' }); return { getSelectedButton: () => Button[a.button || 'OK'], getResponseText: () => a.text || '' }; },
        // Menu (5K): ghi lại cây menu để test kiểm từng mục trỏ tới hàm có thật.
        createMenu: (title) => { const node = { title, items: [] }; const b = { addItem: (label, fn) => { node.items.push({ label, fn }); return b; }, addSeparator: () => b, addSubMenu: (sub) => { node.items.push({ label: sub._node.title, sub: sub._node }); return b; }, addToUi: () => { state.menu = node; }, _node: node }; return b; },
        alert: (title, msg, buttons) => { (state.uiLog = state.uiLog || []).push({ kind: 'alert', title, msg: msg || '' }); if (buttons === 'YES_NO') return Button[answer().button || 'YES']; return Button.OK; }
      };
    },
    newDataValidation: () => { const b = { requireValueInList: () => b, requireCheckbox: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; },
    // Google thật: build() trả ConditionalFormatRule (getRanges, copy() ra builder mới để đổi vùng); rule đã build không sửa tại chỗ được.
    newConditionalFormatRule: () => {
      const mkb = (init) => { const r = Object.assign({}, init || {}); const b = { whenFormulaSatisfied: (f) => { r.formula = f; return b; }, setBackground: (c) => { r.bg = c; return b; }, setRanges: (x) => { r.ranges = x; return b; },
        build: () => { const rule = { formula: r.formula, bg: r.bg, ranges: r.ranges }; rule.getRanges = () => (rule.ranges || []).slice(); rule.copy = () => mkb({ formula: rule.formula, bg: rule.bg, ranges: rule.ranges }); return rule; } }; return b; };
      return mkb();
    }
  };

  // ── Properties, Lock, Cache ──
  const store = {
    getProperty: (k) => (k in state.props ? state.props[k] : null),
    // Giới hạn như Google thật (soát R2 T26): mỗi giá trị tối đa 9 KB, cả kho tối đa 500 KB.
    setProperty: (k, v) => {
      v = String(v);
      if (Buffer.byteLength(k + v, 'utf8') > 9 * 1024) throw new Error('Exception: Argument too large: value (Script Properties 9 KB)');
      const total = Object.keys(state.props).reduce((n, x) => n + (x === k ? 0 : Buffer.byteLength(x + state.props[x], 'utf8')), 0) + Buffer.byteLength(k + v, 'utf8');
      if (total > 500 * 1024) throw new Error('Exception: You have exceeded the property storage quota.');
      state.props[k] = v; return store;
    },
    deleteProperty: (k) => { delete state.props[k]; return store; },
    getProperties: () => Object.assign({}, state.props),
    setProperties: (o) => { Object.assign(state.props, o); return store; }
  };
  const PropertiesService = { getScriptProperties: () => store };
  const LockService = { getScriptLock: () => ({ tryLock: () => { state.lockCalls++; if (state.lockBusy) return false; state.lockHeld = true; return true; }, waitLock: () => { state.lockCalls++; state.lockHeld = true; }, releaseLock: () => { state.lockHeld = false; } }) };
  const cacheApi = {
    get: (k) => (k in state.cache ? state.cache[k] : null),
    // Giới hạn như Google thật (soát R1 C2): hạn tối đa 21600 giây, giá trị tối đa 100 KB, khoá tối đa 250 ký tự.
    put: (k, v, ttl) => { checkCache(k, v, ttl); state.cache[k] = String(v); },
    remove: (k) => { delete state.cache[k]; },
    removeAll: (ks) => { ks.forEach(k => { delete state.cache[k]; }); },
    getAll: (ks) => { const o = {}; ks.forEach(k => { if (k in state.cache) o[k] = state.cache[k]; }); return o; },
    putAll: (o, ttl) => { Object.keys(o).forEach(k => { checkCache(k, o[k], ttl); state.cache[k] = String(o[k]); }); }
  };
  function checkCache(k, v, ttl) {
    if (ttl !== undefined && ttl > 21600) throw new Error('Exception: Argument too large: expirationInSeconds');
    if (String(k).length > 250) throw new Error('Exception: Argument too large: key');
    if (Buffer.byteLength(String(v), 'utf8') > 102400) throw new Error('Exception: Argument too large: value');
  }
  const CacheService = { getScriptCache: () => cacheApi };

  // ── Utilities ──
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const Utilities = {
    formatDate: (d, tz, fmt) => fmt
      .replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate()))
      .replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes())).replace('ss', pad(d.getSeconds()))
      .replace('EEE', DOW[d.getDay()]),
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => Array.from(crypto.createHash(alg).update(String(s), 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)),
    getUuid: () => crypto.randomUUID(),
    // Google trả mảng byte có dấu (Java), như computeDigest.
    computeHmacSha256Signature: (value, key) => Array.from(crypto.createHmac('sha256', String(key)).update(String(value), 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)),
    base64EncodeWebSafe: (x) => Buffer.from(Array.isArray(x) ? x.map(b => (b + 256) % 256) : String(x)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    base64Decode: (s) => Array.from(Buffer.from(String(s), 'base64')),
    newBlob: (bytes, type, name) => ({ bytes, type, name, getName: () => name, getContentType: () => type, setName(n) { this.name = n; return this; } }),
    sleep: () => {}
  };

  // ── Mail ──
  const MailApp = {
    sendEmail: (a, b, c) => {
      const m = typeof a === 'object' ? a : { to: a, subject: b, body: c };
      if (!m.to) throw new Error('Thiếu người nhận email');
      state.mails.push({ to: String(m.to).toLowerCase(), subject: m.subject, htmlBody: m.htmlBody || '', body: m.body || '', name: m.name, replyTo: m.replyTo, cc: m.cc || '', inLock: !!state.lockHeld, transport: 'MAILAPP' });
    },
    // Google đếm theo người nhận (mỗi địa chỉ ở To, CC, BCC), không theo số email.
    getRemainingDailyQuota: () => (state.mailQuota || 1500) - state.mails.reduce((n, m) => n + String(m.to).split(',').filter(x => x.trim()).length, 0)
  };
  // Chunk 5Q: GmailApp.sendEmail(recipient, subject, body, options), cách gửi mặc định. body là chữ thuần (bắt buộc là chuỗi).
  // state.gmailNoPermission = true: giả lập Google báo thiếu quyền (appsscript.json thiếu gmail.send).
  const GmailApp = {
    sendEmail: (to, subject, body, o) => {
      if (state.gmailNoPermission) throw new Error('You do not have permission to call GmailApp.sendEmail. Required permissions: https://www.googleapis.com/auth/gmail.send');
      if (typeof to !== 'string' || !to) throw new Error('Thiếu người nhận email');
      if (typeof subject !== 'string' || typeof body !== 'string') throw new Error('GmailApp.sendEmail: subject và body phải là chuỗi');
      o = o || {};
      Object.keys(o).forEach(k => { if (['htmlBody', 'name', 'replyTo', 'cc', 'bcc', 'noReply', 'attachments', 'inlineImages', 'from'].indexOf(k) === -1) throw new Error('GmailApp.sendEmail: tuỳ chọn lạ ' + k); });
      state.mails.push({ to: String(to).toLowerCase(), subject, htmlBody: o.htmlBody || '', body, name: o.name, replyTo: o.replyTo, cc: o.cc || '', inLock: !!state.lockHeld, transport: 'GMAILAPP' });
      return GmailApp;
    }
  };

  // ── Calendar (dịch vụ nâng cao) ──
  const Calendar = {
    Calendars: {
      insert: (res) => { const id = nextId('cal_') + '@group.calendar.google.com'; state.calendars[id] = Object.assign({ id }, res); state.calendarCalls.push({ op: 'calendars.insert', id }); return state.calendars[id]; },
      get: (id) => { if (!state.calendars[id]) throw new Error('Không thấy lịch ' + id); return state.calendars[id]; }
    },
    Acl: { insert: (rule, calId) => { state.calendarCalls.push({ op: 'acl.insert', calId, rule }); return rule; } },
    Events: {
      insert: (res, calId, o) => {
        // Google thật: mã do mình đặt (res.id) đã có (kể cả sự kiện đã huỷ) thì báo lỗi 409.
        if (res.id && state.events[res.id]) throw new Error('API call to calendar.events.insert failed with error: The requested identifier already exists.');
        if (state.calendarFailNext) { state.calendarFailNext--; throw new Error('API call to calendar.events.insert failed with error: Backend Error'); }
        const id = res.id || nextId('evt');
        const ev = JSON.parse(JSON.stringify(res));
        ev.id = id; ev.calendarId = calId; ev.status = 'confirmed';
        ev.hangoutLink = 'https://meet.google.com/mock-' + id;
        ev.conferenceData = { entryPoints: [{ entryPointType: 'video', uri: ev.hangoutLink }] };
        state.events[id] = ev;
        state.calendarCalls.push({ op: 'insert', id, calId, attendees: (res.attendees || []).map(a => a.email), sendUpdates: o && o.sendUpdates, conferenceDataVersion: o && o.conferenceDataVersion, res });
        return ev;
      },
      patch: (res, calId, id, o) => {
        const ev = state.events[id]; if (!ev) throw new Error('Không thấy sự kiện ' + id);
        Object.assign(ev, JSON.parse(JSON.stringify(res)));
        state.calendarCalls.push({ op: 'patch', id, calId, attendees: res.attendees ? res.attendees.map(a => a.email) : undefined, sendUpdates: o && o.sendUpdates, res });
        return ev;
      },
      remove: (calId, id, o) => {
        if (state.calendarRemoveFailNext) { state.calendarRemoveFailNext--; throw new Error('API call to calendar.events.delete failed with error: Backend Error'); }
        if (!state.events[id]) throw new Error('API call to calendar.events.delete failed with error: Not Found');
        // Google thật: xoá sự kiện đã huỷ trả lỗi 410 Resource has been deleted.
        if (state.events[id].status === 'cancelled') throw new Error('API call to calendar.events.delete failed with error: Resource has been deleted');
        state.events[id].status = 'cancelled';
        state.calendarCalls.push({ op: 'remove', id, calId, sendUpdates: o && o.sendUpdates });
      },
      get: (calId, id) => { const ev = state.events[id]; if (!ev) throw new Error('API call to calendar.events.get failed with error: Not Found'); return ev; }
    }
  };

  // ── Drive ──
  function fileApi(f) {
    return {
      getId: () => f.id, getName: () => f.name, getUrl: () => 'https://drive.google.com/file/d/' + f.id + '/view',
      getOwner: () => ({ getEmail: () => f.owner || state.effectiveUserEmail }),
      getDateCreated: () => f.created, setTrashed: (t) => { f.trashed = t; }, isTrashed: () => !!f.trashed,
      makeCopy: (name, folder) => { const c = { id: nextId('FILE_'), name, parent: folder ? folder.getId() : null, created: new Date(state.counter * 1000), trashed: false }; state.drive.files[c.id] = c; return fileApi(c); },
      setDescription: (d) => { f.description = d; },
      setName: (n) => { f.name = n; if (state.spreadsheets[f.id]) state.spreadsheets[f.id].name = n; return fileApi(f); },
      moveTo: (folder) => { f.parent = folder.getId(); return fileApi(f); }
    };
  }
  function folderApi(fo) {
    return {
      getId: () => fo.id, getName: () => fo.name,
      isTrashed: () => !!fo.trashed, setTrashed: (t) => { fo.trashed = t; },
      createFile: (blob) => { const f = { id: nextId('FILE_'), name: blob.getName ? blob.getName() : 'file', parent: fo.id, created: new Date(state.counter * 1000), trashed: false, type: blob.getContentType ? blob.getContentType() : '' }; state.drive.files[f.id] = f; return fileApi(f); },
      getFiles: () => { const list = Object.values(state.drive.files).filter(f => f.parent === fo.id && !f.trashed); let i = 0; return { hasNext: () => i < list.length, next: () => fileApi(list[i++]) }; },
      createFolder: (n) => { const c = { id: nextId('FOLDER_'), name: n }; state.drive.folders[c.id] = c; return folderApi(c); }
    };
  }
  const DriveApp = {
    getFolderById: (id) => { const fo = state.drive.folders[id]; if (!fo) throw new Error('Không thấy thư mục ' + id); return folderApi(fo); },
    getFileById: (id) => { const f = state.drive.files[id]; if (!f) throw new Error('Không thấy file ' + id); return fileApi(f); },
    createFolder: (n) => { const c = { id: nextId('FOLDER_'), name: n }; state.drive.folders[c.id] = c; return folderApi(c); }
  };

  // ── Script, Session, Logger ──
  const ScriptApp = {
    getProjectTriggers: () => state.triggers.slice(),
    deleteTrigger: (t) => { state.triggers = state.triggers.filter(x => x !== t); },
    newTrigger: (fn) => {
      const t = { fn, uid: 'trig_' + (++state.counter), getHandlerFunction: () => fn };
      t.getUniqueId = () => t.uid;
      const b = {
        timeBased: () => b, everyMinutes: (n) => { t.every = n + 'm'; return b; }, everyHours: (n) => { t.every = n + 'h'; return b; },
        everyDays: () => b, atHour: (h) => { t.hour = h; return b; }, nearMinute: () => b, onWeekDay: (d) => { t.weekDay = d; return b; },
        forSpreadsheet: () => b, onEdit: () => { t.onEdit = true; return b; }, onChange: () => { t.onChange = true; return b; }, inTimezone: () => b,
        create: () => { state.triggers.push(t); return t; }
      };
      return b;
    },
    WeekDay: { SUNDAY: 'SUNDAY', MONDAY: 'MONDAY' },
    getService: () => ({ getUrl: () => state.serviceUrl || 'https://script.google.com/macros/s/MOCK/exec' })
  };
  const Session = {
    getScriptTimeZone: () => 'Asia/Ho_Chi_Minh',
    getActiveUser: () => ({ getEmail: () => state.activeUserEmail }),
    getEffectiveUser: () => ({ getEmail: () => state.effectiveUserEmail })
  };
  const logs = [];
  const Logger = { log: (m) => { logs.push(String(m)); } };

  // ── HtmlService: đọc file thật trong src/, xử lý scriptlet như Apps Script ──
  // createHtmlOutputFromFile trả nguyên văn (không chạy scriptlet), createTemplateFromFile xử lý <?= ?> (thoát HTML) và <?!= ?> (in thẳng).
  // Biểu thức trong scriptlet thấy được các hàm toàn cục của dự án (env.scope, do load.js gắn) và thuộc tính gán vào template.
  const fs = require('fs'), path = require('path');
  const SRC_DIR = opts.srcDir || path.join(__dirname, '..', 'src');
  const readHtml = (name) => {
    const f = path.join(SRC_DIR, name + '.html');
    if (!fs.existsSync(f)) throw new Error('Không có file HTML: ' + name);
    return fs.readFileSync(f, 'utf8');
  };
  const escHtml = (v) => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const htmlOut = (content) => { const o = { content, title: '', meta: {}, xfo: null, getContent: () => content, setTitle: (t) => { o.title = t; return o; }, addMetaTag: (k, v) => { o.meta[k] = v; return o; }, setXFrameOptionsMode: (m) => { o.xfo = m; return o; } }; return o; };
  const HtmlService = {
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' },
    createTemplateFromFile: (name) => {
      const raw = readHtml(name);
      const t = {
        file: name,
        evaluate: () => {
          const scope = Object.assign({}, env.scope || {});
          Object.keys(t).forEach((k) => { if (k !== 'file' && k !== 'evaluate') scope[k] = t[k]; });
          const out = raw.replace(/<\?(!?=)?([\s\S]*?)\?>/g, (m, kind, expr) => {
            if (!kind) throw new Error('Mock chưa hỗ trợ scriptlet <? ?> không in: ' + expr.trim());
            const v = new Function('__s', 'with (__s) { return (' + expr.trim().replace(/;+$/, '') + '); }')(scope);
            return kind === '!=' ? String(v) : escHtml(v);
          });
          const o = htmlOut(out); o.template = t; return o;
        }
      };
      return t;
    },
    createHtmlOutputFromFile: (name) => htmlOut(readHtml(name)),
    createHtmlOutput: (html) => htmlOut(String(html || ''))
  };

  // ── ContentService (trang health, chunk 5F) ──
  const ContentService = {
    MimeType: { TEXT: 'TEXT', JSON: 'JSON' },
    createTextOutput: (text) => { const o = { content: String(text), mime: 'TEXT', getContent: () => o.content, setMimeType: (m) => { o.mime = m; return o; } }; return o; }
  };
  const globals = { SpreadsheetApp, PropertiesService, LockService, CacheService, Utilities, MailApp, GmailApp, Calendar, DriveApp, ScriptApp, Session, Logger, HtmlService, ContentService };
  const env = { globals, state, logs, createSpreadsheet, scope: null };
  return env;
}

module.exports = { createGasEnv };
