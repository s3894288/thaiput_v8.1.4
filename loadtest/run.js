#!/usr/bin/env node
/**
 * loadtest/run.js · Thử tải thaiput trên STAGING (chunk 5G). Chỉ cần Node 18 trở lên, không cài thêm gì.
 *
 *   node run.js --url "https://script.google.com/macros/s/.../exec" --secret "KHOÁ_TỪ_MENU" --users 40 --ramp 20
 *
 * Mỗi người ảo là một học viên giả (lt0001@loadtest.invalid...): mở trang chủ kèm slot, chọn ngẫu nhiên 1 slot,
 * bấm Đặt với mã lần bấm riêng. Gặp bận hoặc Google từ chối thì tự thử lại CÙNG mã như trình duyệt thật
 * (tối đa 9 lần trong 60 giây), nên không bao giờ đặt trùng.
 *   --users N     số người ảo (mặc định 30; tối đa bằng số học viên giả đã tạo)
 *   --ramp S      rải người ảo trong S giây (mặc định 10; 0 = cùng một lúc)
 *   --start K     học viên giả bắt đầu từ số K (mặc định 1), để chạy nhiều lượt không đụng nhau
 *   --cancel P    tỉ lệ người ảo huỷ ngay buổi vừa đặt (0..1, mặc định 0)
 *   --out FILE    ghi chi tiết từng lượt ra file JSON (mặc định ketqua_<giờ>.json)
 * Kết quả: số đặt được, slot đã có người (bình thường khi đông), bận sau 9 lần, Google từ chối, thời gian p50 p95.
 * Sau đó mở Sheets STAGING: menu thaiput > Test > Thử tải: kiểm kết quả.
 */
'use strict';
const fs = require('fs');

function args() {
  const a = process.argv.slice(2), o = { users: 30, ramp: 10, start: 1, cancel: 0 };
  for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); o[k] = a[i + 1]; i++; }
  ['users', 'ramp', 'start', 'cancel'].forEach(k => { o[k] = Number(o[k]); });
  if (!o.url || !o.secret) { console.error('Thiếu --url hoặc --secret. Xem đầu file run.js.'); process.exit(2); }
  return o;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pad = (n, w) => String(n).padStart(w, '0');
const rid = () => 'lt' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
const DELAYS = process.env.TP_LT_FAST ? [0, 0, 0, 0, 0, 0, 0, 0] : [600, 1200, 2400, 4800, 8000, 10000, 10000, 12000];   // như trình duyệt (ui/App.html T.retryDelays); TP_LT_FAST chỉ cho test
const RETRY_REASONS = { BUSY: 1, IN_PROGRESS: 1 };

/** Một lượt POST. Trả { ok, http, body, ms, kind } với kind: json | rejected (Google trả trang lỗi) | network. */
async function post(o, payload) {
  const t0 = Date.now();
  try {
    const r = await fetch(o.url, { method: 'POST', body: JSON.stringify(Object.assign({ secret: o.secret }, payload)), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' });
    const text = await r.text(), ms = Date.now() - t0;
    try { return { http: r.status, body: JSON.parse(text), ms, kind: 'json' }; }
    catch (e) { return { http: r.status, body: null, ms, kind: 'rejected', snippet: text.replace(/\s+/g, ' ').slice(0, 160) }; }
  } catch (e) { return { http: 0, body: null, ms: Date.now() - t0, kind: 'network', snippet: String(e.message || e).slice(0, 160) }; }
}

/** Gọi với thử lại như trình duyệt. write = có mã lần bấm (thử lại cùng mã tới 9 lần trong 60 giây). */
async function call(o, payload, write, log) {
  const t0 = Date.now(), max = write ? 9 : 4;
  let last = null;
  for (let i = 0; i < max; i++) {
    last = await post(o, payload);
    log.push({ fn: payload.fn, as: payload.as, try: i + 1, http: last.http, kind: last.kind, reason: last.body && last.body.reason, ms: last.ms, server_ms: last.body && last.body.server_ms });
    const retry = last.kind !== 'json' || (last.body && !last.body.ok && RETRY_REASONS[last.body.reason]);
    if (!retry) break;
    if (Date.now() - t0 > 60000) break;
    await sleep(DELAYS[Math.min(i, DELAYS.length - 1)] + (process.env.TP_LT_FAST ? 0 : Math.floor(Math.random() * 400)));
  }
  last.total_ms = Date.now() - t0; last.tries = log.filter(x => x.fn === payload.fn && x.as === payload.as).length;
  return last;
}

/** Lý do bình thường khi nhiều người tranh nhau (không phải lỗi hệ thống). Mọi lý do khác làm run.js thoát mã 3. */
const NORMAL = { BOOKED: 1, NO_SLOT: 1, NO_TUTOR: 1, ONE_PER_DAY: 1, DEADLINE: 1, SLOT_BLOCKED: 1, NO_SESSIONS: 1, TOO_FAR: 1, OUT_OF_RANGE: 1 };

async function virtualUser(o, n, log, out) {
  const as = 'lt' + pad(n, 4) + '@loadtest.invalid';
  const t0 = Date.now();
  const home = await call(o, { fn: 'home', as, args: [{ slots: true }] }, false, log);
  if (!home.body || !home.body.ok) { out.push({ as, step: 'home', result: home.kind === 'json' ? home.body.reason : home.kind, ms: Date.now() - t0 }); return; }
  const days = (home.body.data.slots || []).filter(d => d.slots && d.slots.length && !d.alreadyBooked);
  if (!days.length) { out.push({ as, step: 'home', result: 'NO_SLOT', ms: Date.now() - t0 }); return; }
  const d = days[Math.floor(Math.random() * days.length)], s = d.slots[Math.floor(Math.random() * d.slots.length)];
  const slot = typeof s === 'string' ? s : s.slot;
  const book = await call(o, { fn: 'book', as, args: [[{ date: d.date, slot }], rid()] }, true, log);
  const ok = book.body && book.body.ok && book.body.data && book.body.data[0] && book.body.data[0].ok;
  const res = { as, step: 'book', date: d.date, slot, result: ok ? 'BOOKED' : book.kind === 'json' ? (book.body.ok ? book.body.data[0].reason : book.body.reason) : book.kind, tries: book.tries, ms: book.total_ms, homeMs: home.total_ms };
  if (ok && Math.random() < o.cancel) {
    const c = await call(o, { fn: 'cancel', as, args: [book.body.data[0].bookingId, rid()] }, true, log);
    res.cancel = c.body && c.body.ok ? 'CANCELLED' : (c.body ? c.body.reason : c.kind);
  }
  out.push(res);
}

function pct(arr, p) { if (!arr.length) return 0; const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.max(0, Math.ceil(p / 100 * a.length) - 1))]; }

async function main() {
  const o = args(), log = [], out = [], t0 = Date.now();
  const ping = await post(o, { fn: 'info' });
  // Làm nóng: tạo sẵn phiên cho từng học viên giả (người thật đã đăng nhập từ trước), 5 người một lúc, không tính giờ.
  if (ping.body && ping.body.ok) {
    process.stdout.write('Làm nóng phiên ' + o.users + ' người ảo...');
    for (let i = 0; i < o.users; i += 5) {
      const batch = []; for (let k = i; k < Math.min(o.users, i + 5); k++) batch.push(call(o, { fn: 'warm', as: 'lt' + pad(o.start + k, 4) + '@loadtest.invalid' }, false, []));
      const res = await Promise.all(batch);
      const bad = res.find(r => !r.body || !r.body.ok);
      if (bad) { console.error('\nKhông tạo được phiên: ' + JSON.stringify(bad.body || bad.snippet) + '. --users hoặc --start vượt số học viên giả đã tạo?'); process.exit(1); }
    }
    console.log(' xong.');
  }
  if (!ping.body || ping.body.reason === 'LOADTEST_OFF' || ping.body.reason === 'FORBIDDEN') {
    console.error('Cổng thử tải chưa mở hoặc sai khoá: ' + JSON.stringify(ping.body || ping.snippet) + '\nMở Sheets STAGING: menu thaiput > Test > Thử tải: bật 2 giờ. Đã "Triển khai > Phiên bản mới" sau khi dán code 5G chưa?');
    process.exit(1);
  }
  console.log('Bắt đầu: ' + o.users + ' người ảo trong ' + o.ramp + ' giây...');
  const jobs = [];
  for (let i = 0; i < o.users; i++) {
    const delay = o.users > 1 ? Math.floor(o.ramp * 1000 * i / (o.users - 1)) : 0;
    jobs.push(sleep(delay).then(() => virtualUser(o, o.start + i, log, out)));
  }
  await Promise.all(jobs);
  const by = {}; out.forEach(r => { by[r.result] = (by[r.result] || 0) + 1; });
  const bookMs = out.filter(r => r.step === 'book').map(r => r.ms), homeMs = out.filter(r => r.homeMs).map(r => r.homeMs);
  const tries = log.filter(x => x.fn === 'book'), rejected = log.filter(x => x.kind !== 'json').length, busy = log.filter(x => x.reason === 'BUSY').length;
  const serverMs = log.filter(x => x.server_ms >= 0).map(x => x.server_ms);
  const sum = {
    nguoi_ao: o.users, thoi_gian_giay: Math.round((Date.now() - t0) / 1000), ket_qua: by,
    luot_goi: log.length, google_tu_choi: rejected, may_chu_bao_ban: busy, lan_bam_dat: tries.length,
    trang_chu_ms: { p50: pct(homeMs, 50), p95: pct(homeMs, 95), max: pct(homeMs, 100) },
    dat_ms_ca_thu_lai: { p50: pct(bookMs, 50), p95: pct(bookMs, 95), max: pct(bookMs, 100) },
    may_chu_ms: { p50: pct(serverMs, 50), p95: pct(serverMs, 95), max: pct(serverMs, 100) }
  };
  const file = o.out || ('ketqua_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  fs.writeFileSync(file, JSON.stringify({ tong_ket: sum, nguoi: out, luot: log }, null, 1));
  console.log(JSON.stringify(sum, null, 2));
  console.log('Chi tiết: ' + file + '\nTiếp: Sheets STAGING > menu thaiput > Test > Thử tải: kiểm kết quả.');
  // Thoát 3 khi có kết quả không thuộc nhóm bình thường (BUSY sau 9 lần, Google từ chối mãi, lỗi máy chủ, hết giờ cổng...).
  const abnormal = Object.keys(by).filter(k => !NORMAL[k]);
  if (abnormal.length) console.log('KẾT QUẢ BẤT THƯỜNG: ' + abnormal.map(k => k + ' ' + by[k]).join(', ') + ' (gửi file chi tiết cho Alex)');
  process.exit(abnormal.length ? 3 : 0);
}
if (require.main === module) main();
module.exports = { post, call, virtualUser, pct };
