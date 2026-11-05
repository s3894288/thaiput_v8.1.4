/**
 * unit.js · Test các hàm thuần và lớp Db (chunk 1)
 *
 * Mỗi test chạy trên một môi trường mới (scenarioEnv) để không ảnh hưởng nhau.
 * Các phép tính ngày khớp bảng "Các phép tính ngày đã soát lại" trong docs/00.
 */
'use strict';
const assert = require('assert');
const { scenarioEnv, D, DB_ID } = require('./fixtures');

const results = [];
function t(id, title, fn) {
  try { fn(); results.push({ id, title, ok: true }); }
  catch (e) { results.push({ id, title, ok: false, err: e.message }); }
}
const key = (api, d) => (d ? api.dateKey_(d) : '');

// ── Thời gian ──
t('U01', 'Có 32 slot từ 08:00 đến 23:30', () => {
  const { api } = scenarioEnv();
  const s = api.slotList_();
  assert.strictEqual(s.length, 32); assert.strictEqual(s[0], '08:00'); assert.strictEqual(s[31], '23:30');
  assert.ok(api.isValidSlot_('19:30')); assert.ok(!api.isValidSlot_('19:15')); assert.ok(!api.isValidSlot_('07:30'));
});
t('U02', 'Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12)', () => {
  const { api } = scenarioEnv();
  assert.strictEqual(api.fmtDateTime_(api.bookingDeadline_(D(14, 10))), '13/10/2026 15:00');
  assert.strictEqual(api.fmtDateTime_(api.cancelDeadline_(D(14, 10))), '13/10/2026 15:00');
  assert.strictEqual(api.fmtDateTime_(api.bookingDeadline_(D(1, 11))), '31/10/2026 15:00');
});
t('U03', '5J: hạn tutor mở lịch tuần 12/10 là 22:00 thứ Bảy 10/10 (câu 21 đổi 01/11); mốc THỨ GIỜ kiểm hợp lệ', () => {
  const { api } = scenarioEnv();
  assert.strictEqual(api.fmtDateTime_(api.tutorWeekDeadline_(D(18, 10))), '10/10/2026 22:00');
  assert.strictEqual(api.fmtDateTime_(api.tutorWeekDeadline_(D(12, 10))), '10/10/2026 22:00');
  assert.deepStrictEqual(api.parseDowHour_('fri 15'), { off: 4, hour: 15 });
  assert.deepStrictEqual(api.parseDowHour_('CN 8'), { off: 6, hour: 8 });
  ['FRI', 'XYZ 10', 'SAT 24', '', 'SAT 22:30'].forEach(x => assert.strictEqual(api.parseDowHour_(x), null, x));
  const sch = api.tutorSchedule_();
  assert.strictEqual(sch.errors.length, 0);
  assert.strictEqual(api.fmtDateTime_(api.dowHourBefore_(sch.remind[0], D(12, 10))), '09/10/2026 15:00', 'nhắc 15:00 thứ Sáu');
  assert.strictEqual(api.fmtDateTime_(api.dowHourBefore_(sch.banner, D(12, 10))), '10/10/2026 00:00', 'thông báo học viên từ 00:00 thứ Bảy');
  // Hạn sau hạn đặt buổi thứ Hai (15:00 Chủ nhật), nhắc sau hạn: báo lỗi, dùng mặc định
  api.withLock_(() => { api.table_('CONFIG').insert({ key: 'TUTOR_DEADLINE_AT', value: 'SUN 16' }); api.table_('CONFIG').insert({ key: 'TUTOR_REMIND_AT', value: 'FRI 15, SAT 23, abc' }); });
  api.clearConfigCache_();
  const bad = api.tutorSchedule_();
  assert.strictEqual(bad.errors.length, 3, bad.errors.join(' | '));
  assert.strictEqual(api.fmtDateTime_(api.tutorWeekDeadline_(D(12, 10))), '10/10/2026 22:00', 'sai thì dùng mặc định');
  assert.strictEqual(bad.remind.length, 1, 'mốc SAT 23 ở sau hạn mặc định SAT 22: bỏ');
});
t('U04', 'Giả lập thời gian hoạt động, và bị bỏ qua ở PRODUCTION', () => {
  const { api, env } = scenarioEnv({ now: '2026-10-13 14:59:59' });
  assert.strictEqual(api.fmtDateTime_(api.getNow_()), '13/10/2026 14:59');
  env.state.props.ENV = 'PRODUCTION'; env.state.props.DB_ID_PRODUCTION = DB_ID; api.clearNowCache_();
  assert.throws(() => api.setSimNow_('2026-10-13 10:00'));
  assert.ok(Math.abs(api.getNow_().getTime() - Date.now()) < 5000, 'PRODUCTION phải dùng giờ thật');
});

// ── Số điện thoại (phần số điện thoại của A01, A02) ──
t('U05', 'Chuẩn hoá các kiểu nhập hợp lệ về +84912345678', () => {
  const { api } = scenarioEnv();
  ['0912 345 678', '0912.345.678', '+84 912.345.678', '84912345678', '912345678', '(+84) 912-345-678', '+84 0912 345 678'].forEach(x => {
    const r = api.normalizePhoneVN_(x);
    assert.ok(r.ok, 'phải hợp lệ: ' + x); assert.strictEqual(r.phone, '+84912345678', x);
  });
});
t('U06', 'Từ chối số bàn, thiếu số, số nước ngoài, rỗng', () => {
  const { api } = scenarioEnv();
  ['0212345678', '091234567', '+1 415 555 0100', '', '09123456789', 'abc', '0112345678'].forEach(x => {
    const r = api.normalizePhoneVN_(x);
    assert.ok(!r.ok, 'phải bị từ chối: ' + x); assert.strictEqual(r.reason, 'INVALID_PHONE');
  });
});
t('U07', 'Link Zalo và gọi', () => {
  const { api } = scenarioEnv();
  assert.strictEqual(api.zaloLink_('+84912345678'), 'https://zalo.me/0912345678');
  assert.strictEqual(api.telLink_('+84912345678'), 'tel:+84912345678');
  assert.strictEqual(api.phoneDisplay_('+84912345678'), '0912 345 678');
});

// ── Lớp Db: harness trung thực với Sheets ──
t('U08', 'Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ)', () => {
  const { api, env } = scenarioEnv();
  const u = api.table_('USERS').insert({ user_id: 'S0099', role: 'STUDENT', email: 'x@y.z', name: 'X', phone: '+84912345678', status: 'ACTIVE' });
  const raw = env.state.spreadsheets[DB_ID].sheets.USERS.values[u._row - 1][api.SCHEMA.USERS.cols.indexOf('phone')];
  assert.strictEqual(raw, '+84912345678');
  api.clearDbCache_();
  assert.strictEqual(api.table_('USERS').byId('S0099').phone, '+84912345678');
});
t('U09', 'Harness không "tốt bụng": ô thường bị Sheets đổi +84... thành số', () => {
  const { api, env } = scenarioEnv();
  const sh = env.globals.SpreadsheetApp.openById(DB_ID).getSheetByName('MAIL_LOG');
  sh.getRange(5, 2).setValue('+84912345678');
  sh.getRange(5, 3).setValue('19:00');
  const v = env.state.spreadsheets[DB_ID].sheets.MAIL_LOG.values[4];
  assert.strictEqual(v[1], 84912345678); assert.ok(v[2] instanceof Date);
});
t('U10', 'Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm', () => {
  const { api } = scenarioEnv();
  const b = api.table_('BOOKINGS').insert({ booking_id: 'BK000001', student_id: 'S003', tutor_id: 'T001', date: new Date(2026, 9, 14, 12, 30), slot: '19:00', status: 'CONFIRMED' });
  assert.strictEqual(b.slot, '19:00'); assert.strictEqual(b.date.getHours(), 0);
  api.clearDbCache_();
  const r = api.table_('BOOKINGS').byId('BK000001');
  assert.strictEqual(r.slot, '19:00'); assert.strictEqual(key(api, r.date), '2026-10-14');
  assert.strictEqual(api.nextId_('BOOKINGS'), 'BK000002');
  assert.strictEqual(api.nextId_('USERS_STUDENT'), 'S0009');
  assert.strictEqual(api.nextId_('USERS_TUTOR'), 'T005');
});
t('U11', 'cfg_ đọc tab CONFIG, ép kiểu, rơi về mặc định', () => {
  const { api } = scenarioEnv();
  assert.strictEqual(api.cfg_('ADMIN_EMAIL'), 'admin@thaiput.vn');
  assert.strictEqual(api.cfg_('BOOKING_CUTOFF_HOUR'), 15);
  assert.strictEqual(api.cfg_('BOOKING_ENABLED'), true);
  assert.deepStrictEqual(api.cfgList_('PAYROLL_STATUSES'), ['COMPLETED', 'STUDENT_ABSENT']);
  assert.throws(() => api.cfg_('KHOA_KHONG_TON_TAI'));
});

// ── Gói học (mức hàm thuần, cùng phép tính với B07 đến B18) ──
function pk(api) {
  const defs = {}; api.table_('PACKAGES').all().forEach(p => { defs[p.code] = p; });
  const sps = (sid) => api.table_('STUDENT_PACKAGES').filter(s => s.student_id === sid);
  return { defs, sps };
}
const bk = (sp_id, d, status) => ({ sp_id, date: d, status: status || 'CONFIRMED' });

t('U12', 'B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const sp = sps('S001')[0];
  const r = api.resolvePackageForDate_([sp], defs, [], D(14, 10));
  assert.ok(r.ok);
  const p = api.pkgRecomputeAfterChange_(sp, defs.TRIAL, [bk('SP00001', D(14, 10))]);
  assert.strictEqual(p.status, 'ACTIVE'); assert.strictEqual(key(api, p.start_date), '2026-10-14'); assert.strictEqual(key(api, p.end_date), '2026-10-20');
});
t('U13', 'B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const sp = sps('S001')[0];
  const r1 = api.resolvePackageForDate_([sp], defs, [], D(14, 10), {});
  const r2 = api.resolvePackageForDate_([sp], defs, [], D(16, 10), { SP00001: [D(14, 10)] });
  const r3 = api.resolvePackageForDate_([sp], defs, [bk('SP00001', D(14, 10)), bk('SP00001', D(16, 10))], D(17, 10));
  assert.ok(r1.ok && r2.ok); assert.strictEqual(r3.reason, 'NO_SESSIONS');
});
t('U14', 'B09: Trial hết 20/10, đặt 21/10 bị OUT_OF_RANGE', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const r = api.resolvePackageForDate_(sps('S001'), defs, [bk('SP00001', D(14, 10))], D(21, 10));
  assert.strictEqual(r.reason, 'OUT_OF_RANGE');
});
t('U15', 'B10: gói hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  assert.ok(api.resolvePackageForDate_(sps('S003'), defs, [], D(3, 11)).ok);
  assert.strictEqual(api.resolvePackageForDate_(sps('S003'), defs, [], D(4, 11)).reason, 'OUT_OF_RANGE');
});
t('U16', 'B11: 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const sp = sps('S002')[0];
  const p1 = api.pkgRecomputeAfterChange_(sp, defs.PASS_2W, [bk('SP00002', D(14, 10)), bk('SP00002', D(16, 10))]);
  assert.strictEqual(key(api, p1.start_date) + '|' + key(api, p1.end_date), '2026-10-14|2026-10-27');
  const sp2 = Object.assign({}, sp, p1);
  const p2 = api.pkgRecomputeAfterChange_(sp2, defs.PASS_2W, [bk('SP00002', D(14, 10), 'CANCELLED_STUDENT'), bk('SP00002', D(16, 10))]);
  assert.strictEqual(key(api, p2.start_date) + '|' + key(api, p2.end_date), '2026-10-16|2026-10-29');
});
t('U17', 'B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const sp = Object.assign({}, sps('S002')[0], { status: 'ACTIVE', start_date: D(16, 10), end_date: D(29, 10), start_source: 'BOOKING' });
  const p = api.pkgRecomputeAfterChange_(sp, defs.PASS_2W, [bk('SP00002', D(16, 10), 'CANCELLED_STUDENT')]);
  assert.strictEqual(p.status, 'INACTIVE'); assert.strictEqual(p.start_date, ''); assert.strictEqual(p.end_date, '');
});
t('U18', 'B13: mua 1 tháng khi gói 2 tuần còn hạn thì QUEUED 26/10 đến 24/11', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const plan = api.pkgPlanNewPurchase_(sps('S007'), defs, defs.PASS_1M, D(12, 10));
  assert.strictEqual(plan.status, 'QUEUED');
  assert.strictEqual(key(api, plan.start_date) + '|' + key(api, plan.end_date), '2026-10-26|2026-11-24');
  const queued = Object.assign({ sp_id: 'SPQ', package_code: 'PASS_1M', purchased_at: D(12, 10) }, plan);
  const r = api.resolvePackageForDate_(sps('S007').concat([queued]), defs, [], D(26, 10));
  assert.ok(r.ok); assert.strictEqual(r.sp.sp_id, 'SPQ');
});
t('U19', 'B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const p = api.pkgUnsuspendPatch_(sps('S005')[0], defs.PASS_1M, D(12, 10), D(15, 10));
  assert.strictEqual(key(api, p.end_date), '2026-11-02'); assert.strictEqual(p.suspended_days, 3);
});
t('U20', 'B15: mua 10/10, ngày 09/11 tự kích hoạt; ngày 08/11 chưa', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const sp = sps('S002')[0];
  assert.strictEqual(api.pkgDailyTransition_(sp, defs.PASS_2W, [], D(8, 11), 30), null);
  const p = api.pkgDailyTransition_(sp, defs.PASS_2W, [], D(9, 11), 30);
  assert.strictEqual(p.status, 'ACTIVE'); assert.strictEqual(key(api, p.start_date) + '|' + key(api, p.end_date), '2026-11-09|2026-11-22');
});
t('U21', 'B17: gói cũ còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  assert.ok(api.resolvePackageForDate_(sps('S004'), defs, [], D(14, 10), {}).ok);
  assert.strictEqual(api.resolvePackageForDate_(sps('S004'), defs, [], D(15, 10), { SP00004: [D(14, 10)] }).reason, 'NO_SESSIONS');
});
t('U22', 'B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  assert.strictEqual(api.resolvePackageForDate_(sps('S006'), defs, [], D(14, 10)).reason, 'EXPIRED');
  assert.strictEqual(api.resolvePackageForDate_([], defs, [], D(14, 10)).reason, 'NO_PACKAGE');
});
t('U23', 'Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn', () => {
  const { api } = scenarioEnv(); const { defs, sps } = pk(api);
  const r = api.resolvePackageForDate_(sps('S002'), defs, [bk('SP00002', D(30, 10))], D(14, 10));
  assert.strictEqual(r.reason, 'OUT_OF_RANGE');
});
t('U24', 'Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED', () => {
  const { api } = scenarioEnv(); const { defs } = pk(api);
  const q = { sp_id: 'Q', package_code: 'PASS_1M', status: 'QUEUED', start_date: D(26, 10), end_date: D(24, 11), start_source: 'FIXED' };
  assert.strictEqual(api.pkgDailyTransition_(q, defs.PASS_1M, [], D(25, 10), 30), null);
  assert.strictEqual(api.pkgDailyTransition_(q, defs.PASS_1M, [], D(26, 10), 30).status, 'ACTIVE');
  const a = { sp_id: 'A', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED' };
  assert.strictEqual(api.pkgDailyTransition_(a, defs.PASS_1M, [], D(3, 11), 30), null);
  assert.strictEqual(api.pkgDailyTransition_(a, defs.PASS_1M, [], D(4, 11), 30).status, 'EXPIRED');
});

// ── Gán tutor (C25) ──
t('U25', 'C25: chỉ chọn trong nhóm ít buổi nhất, tỷ lệ 35% đến 65% mỗi người', () => {
  const { api } = scenarioEnv();
  const users = api.table_('USERS').all();
  const avail = api.table_('AVAILABILITY').filter(a => !(a.tutor_id === 'T004' && api.sameDate_(a.date, D(14, 10)) && a.slot === '19:00'));
  const bks = [];
  const add = (tid, dd, slot) => bks.push({ tutor_id: tid, date: D(dd, 10), slot, status: 'CONFIRMED' });
  add('T001', 12, '20:00'); add('T001', 13, '20:00'); add('T001', 15, '20:00'); add('T002', 13, '21:00'); add('T003', 16, '21:00');
  const cands = api.buildTutorCandidates_(D(14, 10), '19:00', users, avail, bks, []);
  assert.deepStrictEqual(cands.map(c => c.tutor_id + ':' + c.load).sort(), ['T001:3', 'T002:1', 'T003:1']);
  // Xoay vòng (chunk 5A): cùng ít buổi nhất, chưa ai được giao gần đây thì theo mã; ai vừa được giao thì nhường người kia.
  assert.strictEqual(api.pickTutor_(cands), 'T002');
  bks[3].created_at = new Date(2026, 9, 11, 9, 0); // T002 vừa được giao
  const c2 = api.buildTutorCandidates_(D(14, 10), '19:00', users, avail, bks, []);
  assert.strictEqual(api.pickTutor_(c2), 'T003');
  bks[4].created_at = new Date(2026, 9, 11, 10, 0); // T003 được giao sau T002
  assert.strictEqual(api.pickTutor_(api.buildTutorCandidates_(D(14, 10), '19:00', users, avail, bks, [])), 'T002');
});
t('U26', 'Tutor đã có học viên ở slot, đang chờ huỷ, hoặc bị loại trừ thì không là ứng viên', () => {
  const { api } = scenarioEnv();
  const users = api.table_('USERS').all();
  const avail = api.table_('AVAILABILITY').all().map(a => (a.tutor_id === 'T003' && api.sameDate_(a.date, D(14, 10)) && a.slot === '19:00') ? Object.assign({}, a, { status: 'CANCEL_PENDING' }) : a);
  const cands = api.buildTutorCandidates_(D(14, 10), '19:00', users, avail, [{ tutor_id: 'T001', date: D(14, 10), slot: '19:00', status: 'CONFIRMED' }], ['T004']);
  assert.deepStrictEqual(cands.map(c => c.tutor_id), ['T002']);
});

// ── Chunk 5M: khoá ngày bắt đầu, bù ngày (hàm thuần, plan/TU_VAN_BU_BUOI.md) ──
const DT = (dd, mm, hh, mi) => new Date(2026, mm - 1, dd, hh || 0, mi || 0);
const BK = (id, dd, mm, slot, status, extra) => Object.assign({ booking_id: id, sp_id: 'X', student_id: 'S1', tutor_id: 'T001', date: D(dd, mm), slot, status,
  result_at: '', tech_fault: '', tech_decided_at: '', comp_days: '', comp_gap: '', payroll_override: false }, extra || {});
const SP = (code, extra) => Object.assign({ sp_id: 'X', student_id: 'S1', package_code: code, status: 'INACTIVE', start_date: '', end_date: '', start_source: '',
  sessions_total: code === 'TRIAL' ? 2 : '', suspended_days: 0, purchased_at: D(1, 10), start_date_locked: '', start_locked_at: '', start_booking_id: '', comp_days: '', comp_days_admin: '' }, extra || {});
/** Áp kết quả pkgPlan_ vào bản sao (như ghi xuống Sheets), để chạy lần hai kiểm không cộng hai lần. */
function applyPlan(sp, bks, plan) {
  const sp2 = Object.assign({}, sp, plan.patch || {});
  const bk2 = bks.map(b => { const x = plan.bookings.find(q => q.b === b); return x ? Object.assign({}, b, x.patch) : b; });
  return { sp: sp2, bks: bk2 };
}
const ctxAt = (api, now) => api.compCtx_(now);

t('P01', '5M: khoá ngày bắt đầu ở buổi làm mốc, chỉ khi mọi buổi sớm hơn đã có kết quả cuối (kể cả buổi kỹ thuật sau 48 giờ)', () => {
  const { api } = scenarioEnv();
  const sp = SP('PASS_1M'), now = DT(16, 10, 10);
  // 14/10 23:30 chưa xác nhận, 15/10 Hoàn thành: chưa khoá
  let bks = [BK('B1', 14, 10, '23:30', 'CONFIRMED'), BK('B2', 15, 10, '19:00', 'COMPLETED')];
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, now, 48), null);
  bks[0].status = 'COMPLETED';
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, now, 48).booking_id, 'B1');
  // Buổi đầu tutor vắng: mốc là buổi kế tiếp
  bks = [BK('B1', 14, 10, '19:00', 'TUTOR_ABSENT'), BK('B2', 20, 10, '19:00', 'COMPLETED')];
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, DT(21, 10, 10), 48).booking_id, 'B2');
  // Buổi kỹ thuật sớm hơn, admin chưa chọn lỗi: chờ tới 48 giờ sau khi tutor báo
  bks = [BK('B1', 14, 10, '19:00', 'TECH_ISSUE', { result_at: DT(14, 10, 19, 40) }), BK('B2', 15, 10, '19:00', 'COMPLETED')];
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, DT(16, 10, 19, 39), 48), null);
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, DT(16, 10, 19, 40), 48).booking_id, 'B2');
  bks[0].tech_decided_at = DT(15, 10, 9); bks[0].tech_fault = 'STUDENT';
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, DT(15, 10, 10), 48).booking_id, 'B1', 'lỗi học viên là mốc');
  // Huỷ muộn là mốc (BL40 a); học viên tự huỷ đúng hạn không là mốc
  bks = [BK('B1', 14, 10, '19:00', 'CANCELLED_STUDENT'), BK('B2', 16, 10, '19:00', 'CANCELLED_LATE')];
  assert.strictEqual(api.pkgLockAnchor_(sp, bks, DT(16, 10, 10), 48).booking_id, 'B2');
});

t('P02', '5M: ví dụ của anh Chris (gói 30 ngày): 14/10 tutor vắng, 20/10 hoàn thành thì gói 20/10 đến 18/11; 14/10 học viên vắng thì 14/10 đến 12/11', () => {
  const { api } = scenarioEnv();
  const defs = api.pkgDefs_();
  let bks = [BK('B1', 14, 10, '19:00', 'TUTOR_ABSENT'), BK('B2', 20, 10, '19:00', 'COMPLETED')];
  let pl = api.pkgPlan_(SP('PASS_1M'), defs.PASS_1M, bks, ctxAt(api, DT(21, 10, 10)));
  assert.strictEqual(key(api, pl.patch.start_date) + '|' + key(api, pl.patch.end_date) + '|' + pl.patch.start_source + '|' + pl.patch.status, '2026-10-20|2026-11-18|LOCKED|ACTIVE');
  assert.strictEqual(pl.patch.start_booking_id, 'B2');
  assert.ok(!pl.bookings.length, 'buổi 14/10 trước ngày bắt đầu: không cộng ngày (ngày bắt đầu đã lùi)');
  bks = [BK('B1', 14, 10, '19:00', 'STUDENT_ABSENT'), BK('B2', 20, 10, '19:00', 'COMPLETED')];
  pl = api.pkgPlan_(SP('PASS_1M'), defs.PASS_1M, bks, ctxAt(api, DT(21, 10, 10)));
  assert.strictEqual(key(api, pl.patch.start_date) + '|' + key(api, pl.patch.end_date), '2026-10-14|2026-11-12');
  // Đã khoá: buổi làm mốc về sau bị đổi thành Vắng tutor: ngày bắt đầu giữ, cộng 1 ngày (+ phần để kịp đặt nếu cần)
  const a = applyPlan(SP('PASS_1M'), bks, pl);
  a.bks[0] = Object.assign({}, a.bks[0], { status: 'TUTOR_ABSENT' });
  const p2 = api.pkgPlan_(a.sp, defs.PASS_1M, a.bks, ctxAt(api, DT(22, 10, 10)));
  assert.strictEqual(key(api, p2.start) + '|' + key(api, p2.end), '2026-10-14|2026-11-13');
  assert.deepStrictEqual(p2.bookings.map(x => x.patch), [{ comp_days: 1, comp_gap: 0 }]);
  // Chưa có buổi hoàn chỉnh: ngày bắt đầu tạm tính theo buổi giữ chỗ sớm nhất (như 8.0.10)
  const p3 = api.pkgPlan_(SP('PASS_1M'), defs.PASS_1M, [BK('B1', 25, 10, '19:00', 'CONFIRMED')], ctxAt(api, DT(21, 10, 10)));
  assert.strictEqual(p3.patch.start_source + '|' + key(api, p3.patch.start_date), 'BOOKING|2026-10-25');
});

t('P03', '5M: phần để còn kịp đặt (BL48): bù lúc 14:59 và 15:00; Trial 14/10 đến 20/10, buổi 20/10 19:00 tutor vắng, ghi lúc 21:00 thì hạn 24/10', () => {
  const { api } = scenarioEnv();
  assert.strictEqual(key(api, api.firstBookableDay_(DT(20, 10, 14, 59))), '2026-10-21');
  assert.strictEqual(key(api, api.firstBookableDay_(DT(20, 10, 15, 0))), '2026-10-22');
  const defs = api.pkgDefs_(), sp = SP('TRIAL', { status: 'ACTIVE', start_source: 'LOCKED', start_date: D(14, 10), start_date_locked: D(14, 10), end_date: D(20, 10) });
  const bks = [BK('B1', 14, 10, '19:00', 'COMPLETED'), BK('B2', 20, 10, '19:00', 'TUTOR_ABSENT')];
  const pl = api.pkgPlan_(sp, defs.TRIAL, bks, ctxAt(api, DT(20, 10, 21)));
  assert.strictEqual(key(api, pl.patch.end_date), '2026-10-24');
  assert.deepStrictEqual(pl.bookings[0].patch, { comp_days: 4, comp_gap: 1 });
  assert.strictEqual(pl.events[0].type + ':' + pl.events[0].days, 'COMP_EXTENDED:4');
  // Ghi lúc 14:59 ngày 20/10 (giả định): F = 21/10 nên không cần phần thêm, hạn 23/10
  const p2 = api.pkgPlan_(sp, defs.TRIAL, bks, ctxAt(api, DT(20, 10, 14, 59)));
  assert.strictEqual(key(api, p2.patch.end_date), '2026-10-23');
});

t('P04', '5M: Trial chỉ +3 ngày một lần (BL42, trần 3); lần bù sau trả lượt, không cộng ngày, báo admin khi còn lượt mà hết ngày', () => {
  const { api } = scenarioEnv();
  const defs = api.pkgDefs_();
  let sp = SP('TRIAL', { status: 'ACTIVE', start_source: 'LOCKED', start_date: D(14, 10), start_date_locked: D(14, 10), end_date: D(20, 10) });
  let bks = [BK('B1', 14, 10, '19:00', 'COMPLETED'), BK('B2', 18, 10, '19:00', 'TUTOR_ABSENT')];
  let pl = api.pkgPlan_(sp, defs.TRIAL, bks, ctxAt(api, DT(18, 10, 20)));
  assert.strictEqual(key(api, pl.patch.end_date), '2026-10-23');
  let a = applyPlan(sp, bks, pl);
  a.bks.push(BK('B3', 22, 10, '19:00', 'TUTOR_ABSENT'));
  pl = api.pkgPlan_(a.sp, defs.TRIAL, a.bks, ctxAt(api, DT(22, 10, 20)));
  assert.ok(!pl.patch || !('end_date' in pl.patch), 'hạn giữ 23/10');
  assert.deepStrictEqual(pl.bookings.map(x => x.patch), [{ comp_days: 0, comp_gap: 0 }]);
  assert.deepStrictEqual(pl.events.map(e => e.type), ['COMP_NO_DAYS', 'TRIAL_LEFT_UNUSED']);
  const after = applyPlan(a.sp, a.bks, pl);
  assert.strictEqual(api.pkgSummary_(after.sp, defs.TRIAL, after.bks).sessionsLeft, 1, 'còn 1 lượt: 2 buổi tutor vắng không trừ');
  // Trial chưa khoá (buổi đầu tutor vắng): không cộng ngày, ngày bắt đầu lùi
  const p3 = api.pkgPlan_(SP('TRIAL'), defs.TRIAL, [BK('B1', 14, 10, '19:00', 'TUTOR_ABSENT'), BK('B2', 16, 10, '19:00', 'CONFIRMED')], ctxAt(api, DT(15, 10, 10)));
  assert.strictEqual(key(api, p3.patch.start_date) + '|' + p3.patch.start_source + '|' + p3.bookings.length, '2026-10-16|BOOKING|0');
});

t('P05', '5M: tính lại lần hai (trigger chạy đôi, chọn dropdown 2 lần) không cộng thêm; tổng comp_days ở gói = tổng các buổi', () => {
  const { api } = scenarioEnv();
  const defs = api.pkgDefs_();
  const sp = SP('PASS_2W', { status: 'ACTIVE', start_source: 'LOCKED', start_date: D(12, 10), start_date_locked: D(12, 10), end_date: D(25, 10) });
  const bks = [BK('B1', 12, 10, '19:00', 'COMPLETED'), BK('B2', 14, 10, '19:00', 'TUTOR_ABSENT'), BK('B3', 15, 10, '19:00', 'CANCELLED_ADMIN'),
    BK('B4', 16, 10, '19:00', 'TECH_ISSUE', { tech_fault: 'OBJECTIVE' }), BK('B5', 17, 10, '19:00', 'TECH_ISSUE', { tech_fault: 'STUDENT' }), BK('B6', 18, 10, '19:00', 'CANCELLED_LATE')];
  const pl = api.pkgPlan_(sp, defs.PASS_2W, bks, ctxAt(api, DT(18, 10, 20)));
  assert.strictEqual(pl.patch.comp_days, 3, 'tutor vắng, admin huỷ trước hạn, lỗi khách quan: 3 buổi × 1 ngày');
  assert.strictEqual(key(api, pl.patch.end_date), '2026-10-28');
  const a = applyPlan(sp, bks, pl);
  const again = api.pkgPlan_(a.sp, defs.PASS_2W, a.bks, ctxAt(api, DT(18, 10, 21)));
  assert.strictEqual(again.patch, null); assert.strictEqual(again.bookings.length, 0); assert.strictEqual(again.events.length, 0);
});

t('P06', '5M: đổi lỗi kỹ thuật qua lại: lương, lượt, ngày khớp; rút bù bị chặn khi học viên đã đặt vào ngày được cộng', () => {
  const { api } = scenarioEnv();
  const defs = api.pkgDefs_();
  const sp = SP('PASS_2W', { status: 'ACTIVE', start_source: 'LOCKED', start_date: D(12, 10), start_date_locked: D(12, 10), end_date: D(25, 10) });
  let bks = [BK('B1', 12, 10, '19:00', 'COMPLETED'), BK('B2', 14, 10, '19:00', 'TECH_ISSUE', { tech_fault: 'TUTOR' })];
  let a = applyPlan(sp, bks, api.pkgPlan_(sp, defs.PASS_2W, bks, ctxAt(api, DT(14, 10, 21))));
  assert.strictEqual(key(api, a.sp.end_date) + '|' + a.bks[1].comp_days, '2026-10-26|1');
  a.bks[1].tech_fault = 'STUDENT';
  assert.ok(api.bookingDeducts_(a.bks[1]) && !api.bookingCompensable_(a.bks[1]));
  let pl = api.pkgPlan_(a.sp, defs.PASS_2W, a.bks, ctxAt(api, DT(15, 10, 9)));
  assert.strictEqual(key(api, pl.patch.end_date) + '|' + pl.events[0].type, '2026-10-25|COMP_RETRACTED');
  a = applyPlan(a.sp, a.bks, pl);
  assert.strictEqual(a.bks[1].comp_days, '');
  a.bks[1].tech_fault = 'OBJECTIVE';
  a = applyPlan(a.sp, a.bks, api.pkgPlan_(a.sp, defs.PASS_2W, a.bks, ctxAt(api, DT(15, 10, 10))));
  assert.strictEqual(key(api, a.sp.end_date), '2026-10-26');
  // Học viên đặt ngày 26/10 (ngày được cộng), rồi admin đổi sang lỗi học viên: không rút, báo admin
  a.bks.push(BK('B3', 26, 10, '19:00', 'CONFIRMED'));
  a.bks[1].tech_fault = 'STUDENT';
  pl = api.pkgPlan_(a.sp, defs.PASS_2W, a.bks, ctxAt(api, DT(16, 10, 10)));
  assert.ok(!pl.patch || !('end_date' in pl.patch));
  assert.strictEqual(pl.events[0].type + ':' + pl.events[0].blockers.join(','), 'COMP_RETRACT_BLOCKED:B3');
  // Lương theo tech_fault (báo cáo dùng chung countPayroll_)
  const pay = api.cfgList_('PAYROLL_STATUSES');
  const cnt = f => { const tt = { COMPLETED: 0, STUDENT_ABSENT: 0, TECH_PAID: 0, TECH_UNPAID: 0, TUTOR_ABSENT: 0, payable: 0 }; api.countPayroll_(tt, { status: 'TECH_ISSUE', tech_fault: f }, pay); return tt.TECH_PAID + '/' + tt.TECH_UNPAID; };
  assert.deepStrictEqual(['TUTOR', 'STUDENT', 'OBJECTIVE', ''].map(cnt), ['0/1', '1/0', '1/0', '0/1']);
  assert.strictEqual(api.techFault_({ status: 'TECH_ISSUE', tech_fault: '', payroll_override: 'TRUE' }), 'OBJECTIVE', 'dòng cũ Tính lương: lỗi khách quan');
});

t('P07', '5M: gói vừa hết hạn có buổi trong hạn được bù: tự cộng và mở lại (BL47); hết hạn quá 7 ngày hoặc gói sau đã chạy: ghi 0 ngày, báo admin', () => {
  const { api } = scenarioEnv();
  const defs = api.pkgDefs_();
  const sp = SP('PASS_2W', { status: 'EXPIRED', start_source: 'LOCKED', start_date: D(7, 10), start_date_locked: D(7, 10), end_date: D(20, 10), comp_days: 0 });
  const bks = [BK('B1', 7, 10, '19:00', 'COMPLETED'), BK('B2', 20, 10, '19:00', 'TUTOR_ABSENT')];
  let pl = api.pkgPlan_(sp, defs.PASS_2W, bks, ctxAt(api, DT(21, 10, 8)));
  assert.strictEqual(pl.patch.status + '|' + key(api, pl.patch.end_date), 'ACTIVE|2026-10-22', 'F = 22/10: hạn = 21/10 + 1');
  pl = api.pkgPlan_(sp, defs.PASS_2W, bks, ctxAt(api, DT(28, 10, 8)));
  assert.strictEqual(pl.events[0].type, 'COMP_ON_EXPIRED');
  assert.deepStrictEqual(pl.bookings[0].patch, { comp_days: 0, comp_gap: 0 });
  assert.ok(!pl.patch || !pl.patch.status, 'không mở lại');
  pl = api.pkgPlan_(sp, defs.PASS_2W, bks, Object.assign(ctxAt(api, DT(21, 10, 8)), { nextStarted: true }));
  assert.strictEqual(pl.events[0].type + ':' + pl.events[0].days, 'COMP_TO_NEXT:1', 'gói sau đã chạy: không mở lại gói này, chuyển ngày bù sang gói sau (soát 01/11 F)');
  assert.ok(!pl.patch || !pl.patch.status);
});

t('P08', '5M: tạm khoá không làm hết hạn; tự kích hoạt 30 ngày đếm từ buổi lỗi phía trường gần nhất; dời gói nối đuôi; sửa tay ô gói', () => {
  const { api } = scenarioEnv();
  const defs = api.pkgDefs_();
  const act = SP('PASS_1M', { status: 'ACTIVE', start_source: 'FIXED', start_date: D(1, 10), end_date: D(30, 10) });
  assert.strictEqual(api.pkgDailyTransition_(act, defs.PASS_1M, [], D(31, 10), 30, { suspended: true }), null);
  assert.strictEqual(api.pkgDailyTransition_(act, defs.PASS_1M, [], D(31, 10), 30).status, 'EXPIRED');
  const ina = SP('PASS_1M', { purchased_at: D(15, 9) });
  const bks = [BK('B1', 14, 10, '19:00', 'TUTOR_ABSENT'), BK('B2', 20, 10, '19:00', 'TUTOR_ABSENT')];
  assert.strictEqual(api.pkgDailyTransition_(ina, defs.PASS_1M, bks, D(21, 10), 30), null, 'mua 15/09, buổi lỗi gần nhất 20/10: chưa tự kích hoạt');
  const on = api.pkgDailyTransition_(ina, defs.PASS_1M, bks, D(19, 11), 30);
  assert.strictEqual(on.status + '|' + key(api, on.start_date) + '|' + key(api, on.start_date_locked), 'ACTIVE|2026-11-19|2026-11-19');
  const q = SP('PASS_1M', { status: 'QUEUED', start_source: 'FIXED', start_date: D(31, 10), end_date: D(29, 11) });
  const sh = api.pkgShiftQueued_(q, D(30, 10), D(31, 10));
  assert.strictEqual(key(api, sh.start_date) + '|' + key(api, sh.start_date_locked), '2026-11-01|2026-11-01');
  assert.strictEqual(api.pkgShiftQueued_(Object.assign({}, q, { status: 'ACTIVE' }), D(30, 10), D(31, 10)), null);
  assert.strictEqual(api.pkgShiftQueued_(Object.assign({}, q, { start_date: D(2, 11) }), D(30, 10), D(31, 10)), null, 'gói không nối liền (cách ngày) thì không dời');
  // Sửa tay STUDENT_PACKAGES
  const sp = SP('PASS_1M', { status: 'ACTIVE', start_source: 'LOCKED', start_date: D(14, 10), end_date: D(12, 11), comp_days: 1 });
  const ed = ['admin@thaiput.vn'];
  assert.strictEqual(api.pkgEditDecision_('start_date', 'admin@thaiput.vn', D(1, 10), '', sp, defs.PASS_1M, ed).action, 'REVERT');
  assert.strictEqual(api.pkgEditDecision_('end_date', 'other@x.com', D(20, 11), '', sp, defs.PASS_1M, ed).reason, 'NOT_EDITOR');
  assert.strictEqual(api.pkgEditDecision_('end_date', 'admin@thaiput.vn', 'mai', '', sp, defs.PASS_1M, ed).reason, 'NOT_DATE');
  assert.strictEqual(api.pkgEditDecision_('end_date', 'admin@thaiput.vn', D(10, 10), '', sp, defs.PASS_1M, ed).reason, 'BEFORE_START');
  assert.deepStrictEqual(api.pkgEditDecision_('end_date', 'ADMIN@thaiput.vn', D(20, 11), '', sp, defs.PASS_1M, ed.map(x => x.toLowerCase())).patch, { comp_days_admin: 7 }, '14/10 + 30 + 1 + 7 − 1 = 20/11');
  assert.strictEqual(api.pkgEditDecision_('comp_days_admin', 'admin@thaiput.vn', '2.5', '', sp, defs.PASS_1M, ed).reason, 'NOT_INT');
  assert.deepStrictEqual(api.pkgEditDecision_('comp_days_admin', 'admin@thaiput.vn', '-2', '', sp, defs.PASS_1M, ed).patch, { comp_days_admin: -2 });
  assert.strictEqual(api.pkgEditDecision_('note', 'x', 'y', '', sp, defs.PASS_1M, ed).action, 'IGNORE');
});

module.exports = { results };
if (require.main === module) {
  results.forEach(r => console.log((r.ok ? '  ĐẠT       ' : '  KHÔNG ĐẠT ') + r.id + '  ' + r.title + (r.ok ? '' : '\n              ' + r.err)));
  const bad = results.filter(r => !r.ok).length;
  console.log('\n  ' + (results.length - bad) + '/' + results.length + ' đạt');
  process.exit(bad ? 1 : 0);
}
