/**
 * make_fixture_8_1_4.js · Dựng "cơ sở dữ liệu của bản 8.1.4 đang chạy thật" để thử nâng cấp (chunk 5R)
 *
 * Việc làm: nạp NGUYÊN mã nguồn bản 8.1.4 (git commit 7bb6780) vào môi trường Google giả lập, chạy menu 1 của chính bản đó, rồi
 *   1. admin tuỳ chỉnh: CONFIG (số, ngân hàng, ghi chú, một khoá lạ), CONTENT (vi, en, h.bank_note, một ô "-"), EMAIL_TEMPLATES (sửa ô,
 *      một mẫu tắt, dòng TRÙNG key LOGIN_LINK và REG_RECEIVED), PACKAGES, NOTIFY_RULES;
 *   2. dữ liệu nghiệp vụ tạo bằng API thật của 8.1.4: tutor, admin, học viên (đăng ký rồi duyệt), thanh toán, giờ rảnh, đặt buổi,
 *      huỷ, kết quả (hoàn thành, vắng, kỹ thuật), yêu cầu huỷ slot, phiên đăng nhập, nhật ký, email, thông báo, sự kiện Calendar.
 *   3. ghi toàn bộ trạng thái ra test/fixtures/db_8_1_4.json (không có dữ liệu cá nhân thật: email example.com, số điện thoại giả) và
 *      test/fixtures/release_baseline_8_1_4.json (dấu vân tay mặc định của mã 8.1.4: khoá CONFIG, chữ web, mẫu email, luật thông báo, cột tab).
 *
 * Chạy lại (cần lịch sử git có commit 7bb6780; test thường KHÔNG cần, vì đọc thẳng file JSON đã commit):
 *     TZ=Asia/Ho_Chi_Minh node test/tools/make_fixture_8_1_4.js
 * Giờ giả lập cuối: thứ Ba 10/11/2026 10:00 (SIM_NOW nằm trong Script Properties của fixture). Mọi dữ liệu, trừ mã băm token đăng nhập (ngẫu nhiên mỗi lần),
 * giống nhau giữa các lần chạy; chạy lại sẽ đổi file JSON ở các ô token_hash của tab AUTH và dấu băm, không đổi gì khác.
 */
'use strict';
process.env.TZ = 'Asia/Ho_Chi_Minh';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { load } = require('../load');
const { dump, stringify } = require('./fixture_io');
const { fingerprint } = require('./release_baseline');

const ROOT = path.join(__dirname, '..', '..');
const BASE_COMMIT = '7bb6780';
const OUT_DB = path.join(ROOT, 'test', 'fixtures', 'db_8_1_4.json');
const OUT_FP = path.join(ROOT, 'test', 'fixtures', 'release_baseline_8_1_4.json');

/** Mã nguồn bản 8.1.4 từ git, ghép theo đúng thứ tự nạp của load.js. */
function load814() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'thaiput814-'));
  const tar = execFileSync('git', ['-C', ROOT, 'archive', BASE_COMMIT, 'src'], { maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', tmp], { input: tar });
  const src = path.join(tmp, 'src'), first = ['Config.gs', 'Schema.gs', 'Time.gs'];
  const files = fs.readdirSync(src).filter(f => f.endsWith('.gs')).sort((a, b) => { const ia = first.indexOf(a), ib = first.indexOf(b); if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib); return a.localeCompare(b); });
  const source = files.map(f => '// ── ' + f + ' ──\n' + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
  return load({ props: {}, source, srcDir: src });
}

function main() {
  const { api, env } = load814();
  if (api.APP.VERSION !== '8.1.4') throw new Error('Mã nạp không phải 8.1.4: ' + api.APP.VERSION);
  const st = env.state;
  const ADMIN = 'admin@example.com', SHOT = { name: 'ck.jpg', mimeType: 'image/jpeg', base64: Buffer.from('anh-chup-gia').toString('base64') };
  const withL = (fn) => api.withLock_(fn);
  const fresh = () => { api.clearDbCache_(); api.clearConfigCache_(); };

  // ── 1. Cài đặt lần đầu bằng menu 1 của 8.1.4 (chủ file bấm) ──
  st.activeUserEmail = st.effectiveUserEmail;
  env.createSpreadsheet('NEW_DB', 'THAIPUT_DB_STAGING'); st.activeSpreadsheetId = 'NEW_DB';
  api.setSimNow_('2026-11-02 09:00');
  api.setupFirstRun();
  fresh();

  // ── 2. Admin tuỳ chỉnh CONFIG, PACKAGES, NOTIFY_RULES ──
  const setCfg = (k, v, note) => withL(() => { const t = api.table_('CONFIG'), r = t.byId(k); if (r) t.update(r, note === undefined ? { value: v } : { value: v, note }); else t.insert({ key: k, value: v, note: note || '' }); });
  setCfg('ADMIN_EMAIL', ADMIN); setCfg('ADMIN_ZALO_URL', 'https://zalo.me/0900000000'); setCfg('ADMIN_PHONE', '+84900000000');
  setCfg('SCHOOL_NAME', 'Thaiput Demo', 'Tên hiện trong email'); setCfg('WEBAPP_URL', 'https://script.google.com/macros/s/AKfycbExample/exec');
  setCfg('BANK_NAME', 'Vietcombank', 'Tài khoản công ty'); setCfg('BANK_ACCOUNT', '0123456789'); setCfg('BANK_HOLDER', 'CONG TY THAIPUT');
  setCfg('BOOKING_CUTOFF_HOUR', 14); setCfg('REMINDER_BEFORE_MINUTES', 45); setCfg('SESSION_DAYS', 14); setCfg('EXPIRY_NOTICE_DAYS', 5);
  setCfg('BACKUP_KEEP', 10); setCfg('DIGEST_HOUR', 20); setCfg('TUTOR_DEADLINE_AT', 'SAT 20', 'Hạn mở lịch sớm hơn mặc định');
  setCfg('LOG_KEEP_DAYS', 45); setCfg('MAX_BOOKINGS_PER_DAY', 1);
  setCfg('MY_CUSTOM_FLAG', 'abc', 'Khoá admin tự thêm, code không dùng');   // khoá lạ: phải còn nguyên sau nâng cấp
  fresh();
  withL(() => {
    const p = api.table_('PACKAGES');
    [['TRIAL', 150000], ['PASS_2W', 990000], ['PASS_1M', 1790000]].forEach(x => p.update(p.byId(x[0]), { price_vnd: x[1] }));
    p.update(p.byId('PASS_2W'), { name: 'Gói 2 tuần (khuyến mãi)', name_en: 'Two-week pass (promo)' });
    const n = api.table_('NOTIFY_RULES');
    n.update(n.byId('BOOKED'), { channel: 'DIGEST', note: 'Admin đổi: gom vào email tổng hợp' });
    n.update(n.byId('STUDENT_CANCELLED'), { channel: 'LOG' });
  });

  // ── 3. Admin sửa CONTENT, EMAIL_TEMPLATES (cũng là ô admin dán thêm dòng trùng key) ──
  withL(() => {
    const c = api.table_('CONTENT'), e = api.table_('EMAIL_TEMPLATES');
    const setC = (k, patch) => c.update(c.byId(k), patch);
    setC('h.hero_title', { vi: 'Luyện nói tiếng Thái cùng thaiput', en: 'Practise Thai speaking with thaiput' });
    setC('h.bank_title', { en: 'Pay by bank transfer' });
    setC('h.bank_note', { vi: 'Nội dung chuyển khoản: vui lòng chỉ ghi số điện thoại của bạn.', en: 'Transfer reference: Please enter only your phone number.' });
    setC('h.hero_sub', { en: '-' });   // cố ý để trống (luật 34)
    setC('a.pkg_none', { note: 'Admin ghi chú: chờ giá mới' });
    const setE = (k, patch) => e.update(e.byId(k), patch);
    setE('WELCOME', { subject_vi: 'Chào mừng bạn đến thaiput!', body_vi: 'Chào {{name}},\n\nTài khoản học viên của bạn đã sẵn sàng. {{button:login_url|Vào thaiput}}\n\nHẹn gặp bạn!' });
    setE('BOOKING_CONFIRM', { title_en: 'Your lesson is booked' });
    setE('REMINDER_STUDENT', { note: 'Admin ghi chú: nhắc 45 phút trước' });
    setE('STAFF_NEW_LOGIN', { active: false });
    setE('REG_RECEIVED', { body_en: 'Thaiput received your registration and will review your payment soon. Thank you!' });
    // Dòng TRÙNG key (admin dán thêm hoặc ô key có dấu cách thừa): REG_RECEIVED dòng cuối = chữ gốc; LOGIN_LINK dòng cuối có chữ admin sửa.
    const dReg = api.DEFAULT_EMAIL_TEMPLATES_.REG_RECEIVED, dLog = api.DEFAULT_EMAIL_TEMPLATES_.LOGIN_LINK;
    const rowOf = (key, d, extra) => Object.assign({ key, audience: d[0], active: true, subject_vi: d[1], title_vi: d[2], body_vi: d[3], subject_en: d[4], title_en: d[5], body_en: d[6], variables: d[7], note: '' }, extra || {});
    e.insert(rowOf('REG_RECEIVED', dReg));
    e.insert(rowOf('LOGIN_LINK', dLog, { subject_vi: 'Link đăng nhập thaiput của bạn' }));
  });

  // ── 4. Tutor, admin, học viên (API thật của 8.1.4) ──
  const tutors = [['Vân', 'van@example.com', '0901 000 001'], ['Ánh', 'anh@example.com', '0901 000 002'], ['Lan', 'lan@example.com', '0901 000 003']];
  tutors.forEach(t => { const r = api.addTutor_({ name: t[0], email: t[1], phone: t[2], rate_vnd: 120000 }, ADMIN); if (!r.ok) throw new Error('addTutor_ ' + t[1]); });
  withL(() => { api.table_('USERS').insert({ user_id: api.nextId_('USERS_ADMIN'), role: 'ADMIN', email: ADMIN, name: 'Admin Demo', status: 'ACTIVE', created_at: api.getNow_(), lang: 'vi' }); });
  fresh();
  const students = [['An', 'an@example.com', 'TRIAL', '0912 000 001'], ['Bình', 'binh@example.com', 'PASS_2W', '0912 000 002'], ['Chi', 'chi@example.com', 'PASS_1M', '0912 000 003'],
    ['Dũng', 'dung@example.com', 'PASS_1M', '0912 000 004'], ['Em', 'em@example.com', 'TRIAL', '0912 000 005'], ['Phúc', 'phuc@example.com', 'PASS_2W', '+66 81 234 5678']];
  const sid = {};
  students.forEach(s => {
    const r = api.submitRegistration_({ email: s[1], name: s[0], phone: s[3], level_self: 'A1', package_code: s[2], consent: true, screenshot: SHOT });
    if (!r.ok) throw new Error('đăng ký ' + s[1] + ': ' + r.reasons);
    const a = api.approveRegistration_(r.regId, ADMIN); if (!a.ok) throw new Error('duyệt ' + s[1]);
    sid[s[0]] = a.userId;
  });
  // một đăng ký bị từ chối, một đăng ký còn chờ duyệt
  const rj = api.submitRegistration_({ email: 'tuchoi@example.com', name: 'Từ Chối', phone: '0912 000 009', level_self: 'B1', package_code: 'PASS_1M', consent: true, screenshot: SHOT });
  api.rejectRegistration_(rj.regId, ADMIN, 'Ảnh chuyển khoản không đọc được');
  api.submitRegistration_({ email: 'cho@example.com', name: 'Đang Chờ', phone: '0912 000 010', level_self: 'A2', package_code: 'TRIAL', consent: true, screenshot: SHOT });
  fresh();

  // ── 5. Giờ rảnh: 3 tutor, 02/11 đến 20/11, 4 khung mỗi ngày ──
  const tid = api.table_('USERS').filter(u => u.role === 'TUTOR').map(u => u.user_id);
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const days = []; for (let i = 2; i <= 20; i++) days.push(key(new Date(2026, 10, i)));
  tid.forEach(t => {
    const ch = []; days.forEach(d => ['09:00', '19:00', '20:00', '21:00'].forEach(s => ch.push({ date: d, slot: s, open: true })));
    for (let i = 0; i < ch.length; i += 100) api.setAvailabilityFor_(t, ch.slice(i, i + 100), 'x');
  });
  fresh();

  // ── 6. Đăng nhập thật (tạo phiên AUTH): admin, một tutor, hai học viên ──
  const login = (uid) => { const url = withL(() => api.createLoginLinkInLock_(api.userById_(uid))); const r = api.apiExchangeToken(url.match(/[?&]t=([a-f0-9]{64})/)[1], 'Chrome · Windows'); if (!r.ok) throw new Error('đăng nhập ' + uid); return r.data.sessionToken; };
  login(api.userByEmail_(ADMIN).user_id); login(tid[0]); login(sid['An']); login(sid['Chi']);

  // ── 7. Đặt buổi (ngày làm việc 04/11 đến 13/11) và huỷ ──
  const book = (name, list) => { const r = api.bookSessionsFor_(sid[name], list.map(x => ({ date: x[0], slot: x[1] })), name.toLowerCase() + '@example.com'); r.forEach(x => { if (!x.ok) throw new Error('đặt ' + name + ' ' + x.reason); }); return r; };
  api.setSimNow_('2026-11-03 10:00');
  book('An', [['2026-11-05', '19:00'], ['2026-11-06', '19:00']]);                      // Trial: 2 buổi
  book('Bình', [['2026-11-05', '20:00'], ['2026-11-09', '20:00'], ['2026-11-12', '20:00']]);
  book('Chi', [['2026-11-04', '09:00'], ['2026-11-06', '20:00'], ['2026-11-10', '19:00'], ['2026-11-11', '19:00'], ['2026-11-13', '19:00']]);
  book('Dũng', [['2026-11-05', '21:00'], ['2026-11-11', '20:00']]);
  book('Em', [['2026-11-06', '21:00']]);
  book('Phúc', [['2026-11-09', '21:00'], ['2026-11-12', '21:00']]);
  fresh();
  const bks = () => { fresh(); return api.table_('BOOKINGS').all(); };
  const find = (name, date, slot) => bks().find(b => b.student_id === sid[name] && api.dateKey_(b.date) === date && b.slot === slot);
  // học viên huỷ trước hạn một buổi tương lai, rồi đặt lại
  const toCancel = find('Phúc', '2026-11-12', '21:00');
  const cr = api.cancelBookingFor_(sid['Phúc'], toCancel.booking_id, 'phuc@example.com'); if (!cr.ok) throw new Error('huỷ ' + cr.reason);
  book('Phúc', [['2026-11-13', '21:00']]);

  // Calendar và email nhắc chạy theo giờ (như trigger)
  const tick = (now) => { api.setSimNow_(now); api.calendarJob({ triggerUid: 'x' }); api.reminderJob({ triggerUid: 'x' }); };
  tick('2026-11-03 12:00');

  // ── 8. Các buổi đã qua: tutor chọn kết quả ──
  const result = (name, date, slot, res) => { const b = find(name, date, slot), r = api.submitSessionResultFor_(b.tutor_id, b.booking_id, res, api.userById_(b.tutor_id).email, {}); if (!r.ok) throw new Error('kết quả ' + name + ' ' + r.reason); };
  api.setSimNow_('2026-11-04 12:00'); result('Chi', '2026-11-04', '09:00', 'COMPLETED');
  api.setSimNow_('2026-11-05 22:30');
  result('An', '2026-11-05', '19:00', 'COMPLETED'); result('Bình', '2026-11-05', '20:00', 'STUDENT_ABSENT'); result('Dũng', '2026-11-05', '21:00', 'TECH_ISSUE');
  api.setSimNow_('2026-11-06 22:30'); result('An', '2026-11-06', '19:00', 'COMPLETED'); result('Chi', '2026-11-06', '20:00', 'COMPLETED'); result('Em', '2026-11-06', '21:00', 'COMPLETED');
  api.setSimNow_('2026-11-09 22:30'); result('Bình', '2026-11-09', '20:00', 'COMPLETED'); result('Phúc', '2026-11-09', '21:00', 'COMPLETED');

  // ── 9. Tutor xin huỷ một slot đã có học viên (AVAILABILITY CANCEL_PENDING), sau đó job theo giờ và đêm ──
  api.setSimNow_('2026-11-09 23:00');
  const upcoming = bks().find(b => b.status === 'CONFIRMED' && api.dateKey_(b.date) === '2026-11-13' && b.student_id === sid['Chi']);
  api.setAvailabilityFor_(upcoming.tutor_id, [{ date: '2026-11-13', slot: '19:00', open: false }], 'x');
  api.setSimNow_('2026-11-10 06:00'); api.dailyJob({ triggerUid: 'x' });
  api.setSimNow_('2026-11-10 07:30'); api.hourlyJob({ triggerUid: 'x' });
  api.setSimNow_('2026-11-10 08:00'); api.nightlyBackup({ triggerUid: 'x' }); api.calendarJob({ triggerUid: 'x' });
  api.setSimNow_('2026-11-10 10:00');
  fresh();

  // ── 10. Dọn trạng thái không thuộc dữ liệu: thư đã gửi, nhật ký gọi, bộ nhớ đệm (restore() cũng bỏ) ──
  st.mails = []; st.calendarCalls = []; st.cache = {};

  // ── 11. Kiểm trạng thái đúng là "bản 8.1.4 đang chạy" ──
  const ss = st.spreadsheets.NEW_DB;
  if (st.props.APP_VERSION_LAST !== '8.1.4') throw new Error('APP_VERSION_LAST = ' + st.props.APP_VERSION_LAST);
  if (ss.sheets.RELEASE_LOG) throw new Error('8.1.4 không có tab RELEASE_LOG');
  if (ss.sheets.BOOKINGS.values[0].indexOf('admin_done_at') !== -1) throw new Error('8.1.4 không có cột admin_done_at');
  const cfgKeys = ss.sheets.CONFIG.values.map(r => r[0]);
  if (cfgKeys.indexOf('BANK_QR_IMAGE') !== -1 || cfgKeys.indexOf('REASSIGN_STUCK_HOURS') !== -1) throw new Error('CONFIG đã có khoá mới');

  const data = dump(env);
  fs.mkdirSync(path.dirname(OUT_DB), { recursive: true });
  fs.writeFileSync(OUT_DB, stringify(data) + '\n');
  fs.writeFileSync(OUT_FP, JSON.stringify(fingerprint(api, '8.1.4'), null, 1) + '\n');
  const rows = {}; Object.keys(ss.sheets).forEach(n => { rows[n] = Math.max(0, ss.sheets[n].values.length - 1); });
  console.log('Đã ghi', path.relative(ROOT, OUT_DB), Math.round(fs.statSync(OUT_DB).size / 1024) + ' KB;', path.relative(ROOT, OUT_FP));
  console.log('Số dòng dữ liệu mỗi tab:', JSON.stringify(rows));
}

if (require.main === module) main();
module.exports = { load814 };
