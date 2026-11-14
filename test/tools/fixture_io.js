/**
 * fixture_io.js · Lưu và nạp lại TOÀN BỘ trạng thái của môi trường Google giả lập (chunk 5R)
 *
 * dump(env)         trạng thái → đối tượng JSON thuần (ngày tháng là { $d: mili giây })
 * restore(env, obj) nạp lại vào một env mới (load() từ test/load.js): file Sheets (giá trị, định dạng ô, luật tô màu, kích thước tab,
 *                   cờ "ô là chữ" của dấu nháy), Script Properties, Drive (file, thư mục), Calendar, trigger, bộ đếm mã.
 * Không lưu: bộ nhớ đệm (cache), thư đã gửi (mails), nhật ký gọi Calendar, bộ đếm đọc ghi: lượt thử nào cũng bắt đầu từ trạng thái sạch
 * để đếm đúng thư và sự kiện mới. Dùng cho fixture bản 8.1.4 (make_fixture_8_1_4.js) và test nâng cấp 8.1.4 lên bản mới (integration.js).
 */
'use strict';

/** Chuỗi JSON gọn: Date → { $d }. */
function stringify(obj) {
  return JSON.stringify(obj, function (k, v) {
    const raw = this[k];
    if (raw instanceof Date) return { $d: isNaN(raw.getTime()) ? null : raw.getTime() };
    return v;
  });
}
function parse(text) {
  return JSON.parse(text, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 1 && '$d' in v ? new Date(v.$d === null ? NaN : v.$d) : v));
}

/** Định dạng ô { 'hàng:cột': kiểu } → [[cột, kiểu, [[hàng đầu, hàng cuối], ...]]]: gọn hơn nhiều (mỗi tab có hàng nghìn ô định dạng chữ). */
function packFormats(f) {
  const by = {};
  Object.keys(f).forEach(k => { const p = k.split(':'), r = Number(p[0]), c = Number(p[1]), id = c + '|' + f[k]; (by[id] = by[id] || []).push(r); });
  return Object.keys(by).map(id => {
    const rows = by[id].sort((a, b) => a - b), runs = [];
    rows.forEach(r => { const last = runs[runs.length - 1]; if (last && last[1] === r - 1) last[1] = r; else runs.push([r, r]); });
    const i = id.indexOf('|');
    return [Number(id.substring(0, i)), id.substring(i + 1), runs];
  });
}
function unpackFormats(list) {
  const f = {};
  list.forEach(x => x[2].forEach(run => { for (let r = run[0]; r <= run[1]; r++) f[r + ':' + x[0]] = x[1]; }));
  return f;
}

function dump(env) {
  const st = env.state, out = { spreadsheets: {}, props: Object.assign({}, st.props), drive: { files: {}, folders: {} }, calendars: st.calendars, events: st.events,
    triggers: [], counter: st.counter, activeUserEmail: st.activeUserEmail, effectiveUserEmail: st.effectiveUserEmail, activeSpreadsheetId: st.activeSpreadsheetId || null };
  Object.keys(st.spreadsheets).forEach(id => {
    const ss = st.spreadsheets[id], o = { id: ss.id, name: ss.name, tz: ss.tz, sheets: {} };
    Object.keys(ss.sheets).forEach(n => {
      const sh = ss.sheets[n], lits = {};
      const values = sh.values.map((line, r) => {
        if (line._lit) lits[r] = Object.keys(line._lit).map(Number);
        const row = []; for (let c = 0; c < line.length; c++) row.push(line[c] === undefined ? '' : line[c]);
        return row;
      });
      while (values.length && values[values.length - 1].every(x => x === '' || x === null)) values.pop();
      const cf = (sh.cfRules || []).map(r => ({ formula: r.formula, bg: r.bg, ranges: (r.getRanges ? r.getRanges() : []).map(g => [g.getRow(), g.getColumn(), g.getNumRows(), g.getNumColumns()]) }));
      o.sheets[n] = { values, lits, formats: packFormats(sh.formats), maxRows: sh.maxRows || 1000, maxCols: sh.maxCols || 26, hidden: !!sh.hidden, cf };
    });
    out.spreadsheets[id] = o;
  });
  Object.keys(st.drive.files).forEach(id => { out.drive.files[id] = st.drive.files[id]; });
  Object.keys(st.drive.folders).forEach(id => { out.drive.folders[id] = st.drive.folders[id]; });
  st.triggers.forEach(t => out.triggers.push({ fn: t.fn, uid: t.uid, every: t.every, hour: t.hour, weekDay: t.weekDay, onEdit: t.onEdit, onChange: t.onChange }));
  return out;
}

function restore(env, data) {
  const st = env.state, SA = env.globals.SpreadsheetApp;
  st.props = Object.assign({}, data.props);
  st.counter = data.counter; st.activeUserEmail = data.activeUserEmail; st.effectiveUserEmail = data.effectiveUserEmail; st.activeSpreadsheetId = data.activeSpreadsheetId || undefined;
  st.calendars = JSON.parse(JSON.stringify(data.calendars)); st.events = JSON.parse(JSON.stringify(data.events));
  st.drive.files = {}; st.drive.folders = {};
  Object.keys(data.drive.files).forEach(id => { st.drive.files[id] = Object.assign({}, data.drive.files[id]); });
  Object.keys(data.drive.folders).forEach(id => { st.drive.folders[id] = Object.assign({}, data.drive.folders[id]); });
  Object.keys(data.spreadsheets).forEach(id => {
    const d = data.spreadsheets[id];
    env.createSpreadsheet(id, d.name);
    const ss = st.spreadsheets[id]; ss.tz = d.tz; ss.sheets = {};
    Object.keys(d.sheets).forEach(n => {
      const s = d.sheets[n];
      const sh = { values: s.values.map(r => r.slice()), formats: unpackFormats(s.formats), maxRows: s.maxRows, maxCols: s.maxCols };
      if (s.hidden) sh.hidden = true;
      Object.keys(s.lits || {}).forEach(r => { const line = sh.values[Number(r)]; if (line) { Object.defineProperty(line, '_lit', { value: {}, writable: true, enumerable: false }); s.lits[r].forEach(c => { line._lit[c] = true; }); } });
      ss.sheets[n] = sh;
    });
    // Luật tô màu dựng lại bằng chính API giả lập (có getRanges, copy).
    Object.keys(d.sheets).forEach(n => {
      const s = d.sheets[n]; if (!s.cf || !s.cf.length) return;
      const api = SA.openById(id).getSheetByName(n);
      ss.sheets[n].cfRules = s.cf.map(r => SA.newConditionalFormatRule().whenFormulaSatisfied(r.formula).setBackground(r.bg).setRanges(r.ranges.map(g => api.getRange(g[0], g[1], g[2], g[3]))).build());
    });
  });
  st.triggers = [];
  data.triggers.forEach(d => { const t = { fn: d.fn, uid: d.uid, every: d.every, hour: d.hour, weekDay: d.weekDay, onEdit: d.onEdit, onChange: d.onChange, getHandlerFunction: () => d.fn, getUniqueId: () => d.uid }; st.triggers.push(t); });
  st.mails = []; st.calendarCalls = []; st.cache = {};
}

module.exports = { dump, restore, stringify, parse };
