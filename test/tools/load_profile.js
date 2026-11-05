/**
 * load_profile.js · Đo khối lượng công việc của từng thao tác ở quy mô 10 tutor, 100 học viên, sau 1 tháng và 12 tháng dữ liệu.
 * Đếm được (không đoán): số lần đọc Sheets, số ô đọc, số lần ghi, số lần gọi Calendar, số người nhận email.
 * Thời gian thật trên Google phải đo trên STAGING (mục Lần thực thi); file này chỉ cho khối lượng.
 *   TZ=Asia/Ho_Chi_Minh node test/tools/load_profile.js
 */
'use strict';
const { scenarioEnv, D } = require('../fixtures');

function build(months) {
  const c = scenarioEnv({ now: '2026-10-12 10:00', noAvailability: true });
  const { api, env } = c;
  const users = [], sps = [], avail = [], bks = [];
  for (let t = 5; t <= 10; t++) users.push({ user_id: 'T' + String(t).padStart(3, '0'), role: 'TUTOR', email: 't' + t + '@x.test', name: 'Tutor ' + t, status: 'ACTIVE', created_at: D(1, 9) });
  for (let s = 9; s <= 100; s++) users.push({ user_id: 'S' + String(s).padStart(3, '0'), role: 'STUDENT', email: 's' + s + '@x.test', name: 'HV ' + s, phone: '+849120000' + String(s).padStart(2, '0'), status: 'ACTIVE', created_at: D(1, 9) });
  c.putRows('USERS', users);
  for (let s = 9; s <= 100; s++) sps.push({ sp_id: 'SPX' + s, student_id: 'S' + String(s).padStart(3, '0'), package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED', purchased_at: D(1, 10) });
  c.putRows('STUDENT_PACKAGES', sps);
  const tutors = []; for (let t = 1; t <= 10; t++) tutors.push('T' + String(t).padStart(3, '0'));
  const days = months * 30, base = new Date(2026, 9, 12 - days + 14);
  let n = 0, b = 0;
  for (let d = 0; d < days; d++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
    tutors.forEach(t => ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].forEach(s => avail.push({ avail_id: 'AV' + String(++n).padStart(7, '0'), tutor_id: t, date: day, slot: s, status: 'OPEN', created_at: day })));
    for (let k = 0; k < 43; k++) { // khoảng 43 buổi mỗi ngày (100 học viên, trung bình 3 buổi mỗi tuần)
      bks.push({ booking_id: 'BKX' + String(++b).padStart(7, '0'), student_id: 'S' + String(9 + (k * 7 + d) % 92).padStart(3, '0'), tutor_id: tutors[k % 10], sp_id: 'SPX9', date: day, slot: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'][k % 8], status: day < new Date(2026, 9, 12) ? 'COMPLETED' : 'CONFIRMED', created_at: day });
    }
  }
  c.putRows('AVAILABILITY', avail);
  c.putRows('BOOKINGS', bks);
  const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets;
  Object.keys(sh).forEach(t => { sh[t].maxRows = sh[t].values.length + 1000; }); // như tab đã tự thêm hàng
  return c;
}

function measure(c, label, fn) {
  const { api, env } = c, st = env.state;
  api.clearDbCache_(); api.clearConfigCache_();
  st.readCalls = 0; st.cellsRead = 0; st.writeCalls = 0;
  const realIns = env.globals.Calendar.Events.insert; let inLock = 0;
  env.globals.Calendar.Events.insert = function () { if (st.lockHeld) inLock++; return realIns.apply(null, arguments); };
  const cal0 = st.calendarCalls.length, mail0 = st.mails.reduce((a, m) => a + m.to.split(',').length, 0);
  fn();
  env.globals.Calendar.Events.insert = realIns;
  const mail1 = st.mails.reduce((a, m) => a + m.to.split(',').length, 0);
  return { label, reads: st.readCalls, cells: st.cellsRead, writes: st.writeCalls, calendar: st.calendarCalls.length - cal0, calInLock: inLock, mailRecipients: mail1 - mail0 };
}

function run(months) {
  const c = build(months), { api } = c;
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('S003')));
  const tok = api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const turl = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('T001')));
  const ttok = api.apiExchangeToken(turl.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  ['2026-10-19', '2026-10-21', '2026-10-23'].forEach(dk => api.withLock_(() => api.table_('AVAILABILITY').insert({ avail_id: 'AVZ' + dk, tutor_id: 'T001', date: api.parseDateKey_(dk), slot: '10:00', status: 'OPEN', created_at: api.getNow_() })));
  const rows = [
    measure(c, 'Học viên mở cổng (apiStudentHome)', () => api.apiStudentHome(tok)),
    measure(c, 'Học viên xem slot 14 ngày (apiStudentSlots)', () => api.apiStudentSlots(tok)),
    measure(c, 'Học viên đặt 3 buổi (apiStudentBook)', () => { api.apiStudentBook(tok, [{ date: '2026-10-19', slot: '10:00' }, { date: '2026-10-21', slot: '10:00' }, { date: '2026-10-23', slot: '10:00' }]); }),
    measure(c, 'Tutor mở cổng (apiTutorHome)', () => api.apiTutorHome(ttok)),
    measure(c, 'Tutor lưu 100 slot (apiTutorSetAvailability)', () => { const ch = []; for (let d = 19; d <= 25; d++) api.slotList_().slice(0, 15).forEach(s => ch.push({ date: '2026-10-' + d, slot: s, open: true })); api.apiTutorSetAvailability(ttok, ch.slice(0, 100)); }),
    measure(c, 'Job nhắc 15 phút (reminderJob)', () => api.reminderJob())
  ];
  const sizes = ['BOOKINGS', 'AVAILABILITY', 'AUTH', 'ACTIVITY_LOG'].map(t => t + ' ' + (c.env.state.spreadsheets.DB_STAGING_TEST.sheets[t].values.length - 1) + ' dòng').join(', ');
  return { months, sizes, rows };
}

[1, 12].forEach(m => {
  const r = run(m);
  console.log('\n=== Sau ' + m + ' tháng dữ liệu: ' + r.sizes);
  console.log('| Thao tác | Lần đọc Sheets | Ô đọc | Lần ghi | Gọi Calendar | Calendar khi giữ khoá | Người nhận email |');
  console.log('|---|---|---|---|---|---|---|');
  r.rows.forEach(x => console.log('| ' + x.label + ' | ' + x.reads + ' | ' + x.cells.toLocaleString('vi-VN') + ' | ' + x.writes + ' | ' + x.calendar + ' | ' + x.calInLock + ' | ' + x.mailRecipients + ' |'));
});
