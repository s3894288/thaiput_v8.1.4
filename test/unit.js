/**
 * unit.js · Test hàm thuần và lớp Db (U01 đến U26, P01 đến P08)
 *
 * VIẾT LẠI ngày 10/11/2026 (chunk 5S, kế hoạch P0 mục C3): file gốc không được đưa lên repo GitHub ngày 05/11. Mã và ý của
 * từng test lấy theo danh sách U01 đến U26 trong archive/BAO_CAO_CHUNKS.md và P01 đến P08 (chunk 5M, PROGRESS.md). Test nào
 * nghiệp vụ đã đổi sau khi viết bản gốc thì viết theo luật hiện hành và ghi rõ (U03: lịch tutor THỨ GIỜ, 5J; U06: số điện thoại
 * tự do, 5K; U25: chọn tutor ít buổi nhất rồi xoay vòng, 5A). Kết quả mong đợi lấy từ docs/01, docs/03 (B07 đến B24), không lấy
 * từ code (CLAUDE.md luật 15). Có bản gốc (TEST_BUNDLE.txt) thì thay file này bằng bản gốc và giữ test nào bản gốc thiếu.
 */
'use strict';
const assert = require('assert');
const { scenarioEnv, D, DB_ID } = require('./fixtures');

const results = [];
function t(id, title, fn) {
  try { fn(); results.push({ id, title, ok: true }); }
  catch (e) { results.push({ id, title, ok: false, err: e.message }); }
}
const env = () => scenarioEnv({ now: '2026-10-12 10:00' });
const key = (api, d) => (d ? api.dateKey_(d) : '');
/** Gói theo ngày, kiểu dòng PACKAGES. */
const DEF = {
  TRIAL: { code: 'TRIAL', type: 'DAYS', days: 7, sessions: 2 },
  PASS_2W: { code: 'PASS_2W', type: 'DAYS', days: 14, sessions: '' },
  PASS_1M: { code: 'PASS_1M', type: 'DAYS', days: 30, sessions: '' },
  PACK_12: { code: 'PACK_12', type: 'SESSIONS', days: '', sessions: 12 }
};
let bkSeq = 0;
const bk = (sp, date, status, slot, extra) => Object.assign({ booking_id: 'BK' + String(++bkSeq).padStart(6, '0'), sp_id: sp, date, slot: slot || '19:00', status }, extra || {});

// ── Thời gian ──

t('U01', 'Có 32 slot từ 08:00 đến 23:30, bước 30 phút; slot ngoài danh sách không hợp lệ; nhãn 23:30 qua nửa đêm', () => {
  const { api } = env();
  const s = api.slotList_();
  assert.strictEqual(s.length, 32);
  assert.deepStrictEqual([s[0], s[1], s[31]], ['08:00', '08:30', '23:30']);
  assert.ok(api.isValidSlot_('19:00') && !api.isValidSlot_('19:15') && !api.isValidSlot_('07:30') && !api.isValidSlot_('9:00'));
  assert.strictEqual(api.slotLabel_('23:30'), '23:30 - 00:00');
});

t('U02', 'Hạn đặt và hạn huỷ buổi 14/10 là 15:00 ngày 13/10 (câu 10, 12); hạn đầu tháng lùi về cuối tháng trước', () => {
  const { api } = env();
  assert.strictEqual(api.bookingDeadline_(D(14, 10)).getTime(), new Date(2026, 9, 13, 15, 0, 0).getTime());
  assert.strictEqual(api.cancelDeadline_(D(14, 10)).getTime(), new Date(2026, 9, 13, 15, 0, 0).getTime());
  assert.strictEqual(api.bookingDeadline_(D(1, 11)).getTime(), new Date(2026, 9, 31, 15, 0, 0).getTime());
  assert.strictEqual(api.bookingDeadlineFor_(D(14, 10), '19:00').getTime(), new Date(2026, 9, 13, 15, 0, 0).getTime(), 'BOOKING_LEAD_HOURS = 0: luật 15:00 hôm trước');
});

t('U03', 'Lịch tutor THỨ GIỜ (5J, câu 21 đổi 01/11): hạn mở lịch tuần 19/10 là 22:00 thứ Bảy 17/10, nhắc 15:00 thứ Sáu 16/10; mốc sai dạng hoặc sau hạn đặt buổi thứ Hai thì dùng mặc định và báo lỗi', () => {
  const { api } = env();
  assert.strictEqual(api.tutorWeekDeadline_(D(21, 10)).getTime(), new Date(2026, 9, 17, 22, 0, 0).getTime());
  const sch = api.tutorSchedule_();
  assert.deepStrictEqual(sch.errors, []);
  assert.strictEqual(api.dowHourBefore_(sch.remind[0], D(19, 10)).getTime(), new Date(2026, 9, 16, 15, 0, 0).getTime());
  assert.deepStrictEqual(api.parseDowHour_('T7 22'), { off: 5, hour: 22 });
  assert.deepStrictEqual(api.parseDowHour_('cn 9:00'), { off: 6, hour: 9 });
  assert.strictEqual(api.parseDowHour_('SAT 24'), null);
  assert.strictEqual(api.parseDowHour_('thứ bảy'), null);
  assert.strictEqual(api.fmtDowTimeVi_(new Date(2026, 9, 17, 22, 0)), '22:00 Thứ 7 17/10');
});

t('U04', 'Giả lập thời gian (SIM_NOW) chạy trên STAGING và bị bỏ qua ở PRODUCTION; bật giả lập trên PRODUCTION thì báo lỗi', () => {
  const { api, env: e } = env();
  assert.strictEqual(api.dateKey_(api.getNow_()), '2026-10-12');
  api.setSimNow_('2026-12-31 23:59');
  assert.strictEqual(api.getNow_().getTime(), new Date(2026, 11, 31, 23, 59, 0).getTime());
  e.state.props.ENV = 'PRODUCTION'; api.clearNowCache_();
  assert.ok(Math.abs(api.getNow_().getTime() - Date.now()) < 5000, 'PRODUCTION dùng giờ thật');
  assert.throws(() => api.setSimNow_('2026-10-12 10:00'), /PRODUCTION/);
});

// ── Số điện thoại ──

t('U05', 'Chuẩn hoá các kiểu nhập số di động Việt Nam về +84912345678', () => {
  const { api } = env();
  ['0912 345 678', '0912.345.678', '+84 912 345 678', '84912345678', '912345678', '(+84) 912-345-678', '+84 0912 345 678'].forEach(s => {
    const r = api.normalizePhoneVN_(s);
    assert.ok(r.ok && r.phone === '+84912345678', s + ' → ' + JSON.stringify(r));
  });
  assert.strictEqual(api.normalizePhone_('0912345678').phone, '+84912345678');
});

t('U06', 'Số điện thoại tự do (5K, đổi 01/11): không bao giờ từ chối; số bàn, số thiếu, chữ lưu nguyên văn; số nước ngoài có mã nước lưu +chữ số; trống lưu trống; cắt 40 ký tự', () => {
  const { api } = env();
  assert.strictEqual(api.normalizePhoneVN_('0243 123 4567').ok, false, 'số bàn không phải di động VN');
  assert.strictEqual(api.normalizePhoneVN_('0212 345 678').ok, false, 'đủ 10 số nhưng đầu số 02 không phải di động');
  assert.deepStrictEqual(api.normalizePhone_('0212 345 678'), { ok: true, phone: '0212 345 678' }, 'lưu nguyên văn, không thành +84');
  assert.deepStrictEqual(api.normalizePhone_('0243 123 4567'), { ok: true, phone: '0243 123 4567' });
  assert.deepStrictEqual(api.normalizePhone_('0912 345'), { ok: true, phone: '0912 345' });
  assert.deepStrictEqual(api.normalizePhone_('+66 81 234 5678'), { ok: true, phone: '+66812345678' });
  assert.deepStrictEqual(api.normalizePhone_('Line: lan_0987654321'), { ok: true, phone: 'Line: lan_0987654321' });
  assert.deepStrictEqual(api.normalizePhone_('   '), { ok: true, phone: '' });
  assert.strictEqual(api.normalizePhone_('', true).ok, false, 'bắt buộc mà trống');
  assert.strictEqual(api.normalizePhone_('x'.repeat(60)).phone.length, 40);
  assert.strictEqual(api.normalizePhone_('a\u0000\u0007b').phone, 'a b', 'bỏ ký tự điều khiển');
});

t('U07', 'Link Zalo và hiển thị: số Việt Nam có link Zalo, hiện 0912 345 678; số khác không có link, hiện nguyên văn', () => {
  const { api } = env();
  assert.strictEqual(api.zaloLink_('+84912345678'), 'https://zalo.me/0912345678');
  assert.strictEqual(api.phoneDisplay_('+84912345678'), '0912 345 678');
  assert.strictEqual(api.zaloLink_('+66812345678'), '');
  assert.strictEqual(api.phoneDisplay_('+66812345678'), '+66812345678');
  assert.strictEqual(api.zaloLink_('Line: lan_0987654321'), '', 'chữ có số bên trong không thành link');
  assert.strictEqual(api.telLink_('+84912345678'), 'tel:+84912345678');
  assert.strictEqual(api.telLink_(''), '');
});

// ── Db ──

t('U08', 'Ghi số điện thoại qua Db giữ nguyên chữ +84 (ô định dạng chữ), đọc lại vẫn là chữ', () => {
  const { api, env: e } = env();
  api.withLock_(() => { const u = api.table_('USERS'); u.update(u.byId('S001'), { phone: '+84987654321' }); });
  const sh = e.state.spreadsheets[DB_ID].sheets.USERS, col = api.SCHEMA.USERS.cols.indexOf('phone');
  const row = sh.values.find(r => r[0] === 'S001');
  assert.strictEqual(row[col], '+84987654321');
  api.clearDbCache_();
  assert.strictEqual(api.table_('USERS').byId('S001').phone, '+84987654321');
});

t('U09', 'Harness không "tốt bụng" (luật 14): ô thường bị Sheets đổi +84... thành số và 19:00 thành giờ năm 1899', () => {
  const { env: e } = env();
  e.createSpreadsheet('RAW', 'raw');
  const sh = e.globals.SpreadsheetApp.openById('RAW').insertSheet('X');
  sh.getRange(1, 1, 1, 2).setValues([['+84912345678', '19:00']]);
  const v = sh.getRange(1, 1, 1, 2).getValues()[0];
  assert.strictEqual(v[0], 84912345678);
  assert.ok(v[1] instanceof Date && v[1].getFullYear() === 1899 && v[1].getHours() === 19);
});

t('U10', 'Slot và ngày đọc lại đúng kiểu; ngày ghi luôn là nửa đêm; ô slot bị Sheets đổi thành giờ vẫn đọc ra 19:00', () => {
  const { api } = env();
  api.withLock_(() => {
    api.table_('AVAILABILITY').insert({ avail_id: 'AV900001', tutor_id: 'T001', date: new Date(2026, 9, 20, 17, 45), slot: '21:30', status: 'OPEN', created_at: api.getNow_() });
  });
  api.clearDbCache_();
  const a = api.table_('AVAILABILITY').byId('AV900001');
  assert.ok(a.date instanceof Date);
  assert.deepStrictEqual([a.date.getHours(), a.date.getMinutes(), a.date.getDate()], [0, 0, 20]);
  assert.strictEqual(a.slot, '21:30');
  assert.strictEqual(api.asSlot_(new Date(1899, 11, 30, 19, 0, 0)), '19:00');
  assert.strictEqual(key(api, api.asDate_('2026-10-20T10:00:00')), '2026-10-20');
  assert.strictEqual(api.parseDateKey_('2026-02-31'), null, 'ngày không tồn tại');
});

t('U11', 'cfg_ đọc tab CONFIG, ép kiểu theo mặc định, rơi về mặc định khi trống; ô giờ bị Sheets đổi thành Date vẫn ra HH:mm; khoá lạ thì ném lỗi', () => {
  const { api } = env();
  assert.strictEqual(api.cfg_('ADMIN_EMAIL'), 'admin@thaiput.vn', 'từ tab CONFIG');
  assert.strictEqual(api.cfg_('BOOKING_CUTOFF_HOUR'), 15, 'mặc định, kiểu số');
  assert.strictEqual(api.coerceCfg_('20', 15), 20);
  assert.strictEqual(api.coerceCfg_('abc', 15), 15);
  assert.strictEqual(api.coerceCfg_('', 15), 15);
  assert.strictEqual(api.coerceCfg_('có', false), true);
  assert.strictEqual(api.coerceCfg_('FALSE', true), false);
  assert.strictEqual(api.coerceCfg_(new Date(1899, 11, 30, 8, 0), '08:00'), '08:00');
  assert.throws(() => api.cfg_('KHONG_CO_KHOA_NAY'), /không tồn tại/);
});

// ── Gói học (docs/03 B07 đến B18) ──

t('U12', 'B07: Trial đặt buổi đầu 14/10 thì gói 14/10 đến 20/10', () => {
  const { api } = env();
  const sp = { sp_id: 'SP1', package_code: 'TRIAL', status: 'INACTIVE', sessions_total: 2 };
  const p = api.pkgRecomputeAfterChange_(sp, DEF.TRIAL, [bk('SP1', D(14, 10), 'CONFIRMED')]);
  assert.strictEqual(p.status, 'ACTIVE');
  assert.deepStrictEqual([key(api, p.start_date), key(api, p.end_date), p.start_source], ['2026-10-14', '2026-10-20', 'BOOKING']);
});

t('U13', 'B08: Trial 2 buổi, buổi thứ ba bị NO_SESSIONS (kể cả khi gửi cùng một lần)', () => {
  const { api } = env();
  const sp = { sp_id: 'SP1', package_code: 'TRIAL', status: 'ACTIVE', sessions_total: 2 };
  const two = [bk('SP1', D(14, 10), 'CONFIRMED'), bk('SP1', D(15, 10), 'CONFIRMED')];
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.TRIAL, two, D(16, 10)).reason, 'NO_SESSIONS');
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.TRIAL, [two[0]], D(16, 10), [D(15, 10)]).reason, 'NO_SESSIONS');
  assert.ok(api.pkgCheckDate_(sp, DEF.TRIAL, [two[0]], D(16, 10)).ok);
});

t('U14', 'B09: Trial bắt đầu 14/10 hết 20/10, đặt 21/10 bị OUT_OF_RANGE; 20/10 được', () => {
  const { api } = env();
  const sp = { sp_id: 'SP1', package_code: 'TRIAL', status: 'ACTIVE', sessions_total: 2 };
  const b = [bk('SP1', D(14, 10), 'CONFIRMED')];
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.TRIAL, b, D(21, 10)).reason, 'OUT_OF_RANGE');
  assert.ok(api.pkgCheckDate_(sp, DEF.TRIAL, b, D(20, 10)).ok);
});

t('U15', 'B10: gói 1 tháng cố định hết 03/11, ngày 03/11 được, 04/11 OUT_OF_RANGE', () => {
  const { api } = env();
  const sp = { sp_id: 'SP3', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED' };
  assert.ok(api.pkgCheckDate_(sp, DEF.PASS_1M, [], D(3, 11)).ok);
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.PASS_1M, [], D(4, 11)).reason, 'OUT_OF_RANGE');
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.PASS_1M, [], D(4, 10)).reason, 'OUT_OF_RANGE', 'trước ngày bắt đầu');
});

t('U16', 'B11: gói 2 tuần đặt 14/10 và 16/10 thì 14 đến 27/10; huỷ 14/10 thì 16 đến 29/10', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'INACTIVE' };
  const a = bk('SP2', D(14, 10), 'CONFIRMED'), b = bk('SP2', D(16, 10), 'CONFIRMED');
  const p1 = api.pkgRecomputeAfterChange_(sp, DEF.PASS_2W, [a, b]);
  assert.deepStrictEqual([key(api, p1.start_date), key(api, p1.end_date)], ['2026-10-14', '2026-10-27']);
  Object.assign(sp, p1); a.status = 'CANCELLED_STUDENT';
  const p2 = api.pkgRecomputeAfterChange_(sp, DEF.PASS_2W, [a, b]);
  assert.deepStrictEqual([key(api, p2.start_date), key(api, p2.end_date)], ['2026-10-16', '2026-10-29']);
});

t('U17', 'B12: huỷ buổi duy nhất thì gói về INACTIVE, ngày để trống', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(14, 10), end_date: D(27, 10), start_source: 'BOOKING' };
  const p = api.pkgRecomputeAfterChange_(sp, DEF.PASS_2W, [bk('SP2', D(14, 10), 'CANCELLED_STUDENT')]);
  assert.deepStrictEqual(p, { status: 'INACTIVE', start_date: '', end_date: '', start_source: '' });
});

t('U18', 'B13: mua gói 1 tháng khi gói 2 tuần còn hạn tới 25/10 thì gói mới QUEUED 26/10 đến 24/11', () => {
  const { api } = env();
  const cur = [{ sp_id: 'SP7', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(12, 10), end_date: D(25, 10), start_source: 'FIXED' }];
  const p = api.pkgPlanNewPurchase_(cur, DEF, DEF.PASS_1M, D(15, 10));
  assert.deepStrictEqual([p.status, key(api, p.start_date), key(api, p.end_date), p.start_source], ['QUEUED', '2026-10-26', '2026-11-24', 'FIXED']);
  assert.strictEqual(api.pkgPlanNewPurchase_([], DEF, DEF.PASS_1M, D(15, 10)).status, 'INACTIVE', 'không có gói đang chạy');
});

t('U19', 'B14: tạm khoá 12/10, mở khoá 15/10 thì hạn 30/10 thành 02/11 (cộng 3 ngày, ghi suspended_days)', () => {
  const { api } = env();
  const sp = { sp_id: 'SP5', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(1, 10), end_date: D(30, 10), start_source: 'FIXED' };
  const p = api.pkgUnsuspendPatch_(sp, DEF.PASS_1M, D(12, 10), D(15, 10));
  assert.deepStrictEqual([p.suspended_days, key(api, p.end_date)], [3, '2026-11-02']);
  assert.strictEqual(api.pkgUnsuspendPatch_(sp, DEF.PACK_12, D(12, 10), D(15, 10)), null, 'gói tính buổi không đổi');
});

t('U20', 'B15: mua 10/10 chưa đặt buổi nào, ngày 09/11 tự kích hoạt (30 ngày); ngày 08/11 chưa', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'INACTIVE', purchased_at: D(10, 10) };
  assert.strictEqual(api.pkgDailyTransition_(sp, DEF.PASS_2W, [], D(8, 11), 30), null);
  const p = api.pkgDailyTransition_(sp, DEF.PASS_2W, [], D(9, 11), 30);
  assert.deepStrictEqual([p.status, key(api, p.start_date), key(api, p.end_date), p.start_source], ['ACTIVE', '2026-11-09', '2026-11-22', 'FIXED']);
});

t('U21', 'B17: gói tính buổi còn 1 buổi, gửi 2 ngày thì ngày thứ hai NO_SESSIONS', () => {
  const { api } = env();
  const sp = { sp_id: 'SP4', package_code: 'PACK_12', status: 'ACTIVE', sessions_total: 1 };
  assert.ok(api.pkgCheckDate_(sp, DEF.PACK_12, [], D(14, 10)).ok);
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.PACK_12, [], D(15, 10), [D(14, 10)]).reason, 'NO_SESSIONS');
});

t('U22', 'B18: gói đã hết hạn thì EXPIRED; không có gói thì NO_PACKAGE; nhiều gói thì báo lý do ưu tiên NO_SESSIONS > OUT_OF_RANGE > EXPIRED', () => {
  const { api } = env();
  const exp = { sp_id: 'SP6', package_code: 'PASS_2W', status: 'EXPIRED', start_date: D(20, 9), end_date: D(3, 10), start_source: 'FIXED' };
  assert.deepStrictEqual(api.resolvePackageForDate_([exp], DEF, [], D(14, 10)), { ok: false, reason: 'EXPIRED' });
  assert.deepStrictEqual(api.resolvePackageForDate_([], DEF, [], D(14, 10)), { ok: false, reason: 'NO_PACKAGE' });
  const fixed = { sp_id: 'SP3', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED' };
  assert.deepStrictEqual(api.resolvePackageForDate_([exp, fixed], DEF, [], D(10, 11)), { ok: false, reason: 'OUT_OF_RANGE' });
  assert.strictEqual(api.resolvePackageForDate_([exp, fixed], DEF, [], D(14, 10)).sp.sp_id, 'SP3');
});

t('U23', 'Gói kiểu BOOKING: buổi mới không được đẩy buổi cũ ra ngoài hạn (có buổi 30/10, đặt thêm 14/10 thì OUT_OF_RANGE)', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(30, 10), end_date: D(12, 11), start_source: 'BOOKING' };
  const b = [bk('SP2', D(30, 10), 'CONFIRMED')];
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.PASS_2W, b, D(14, 10)).reason, 'OUT_OF_RANGE');
  assert.ok(api.pkgCheckDate_(sp, DEF.PASS_2W, b, D(17, 10)).ok, '17/10 đến 30/10 vừa đủ 14 ngày');
  assert.strictEqual(api.pkgCheckDate_(sp, DEF.PASS_2W, b, D(16, 10)).reason, 'OUT_OF_RANGE');
});

t('U24', 'Gói nối tiếp đến ngày thì ACTIVE; gói qua hạn thì EXPIRED; học viên tạm khoá thì không đổi', () => {
  const { api } = env();
  const q = { sp_id: 'SP9', package_code: 'PASS_1M', status: 'QUEUED', start_date: D(26, 10), end_date: D(24, 11), start_source: 'FIXED' };
  assert.strictEqual(api.pkgDailyTransition_(q, DEF.PASS_1M, [], D(25, 10), 30), null);
  assert.deepStrictEqual(api.pkgDailyTransition_(q, DEF.PASS_1M, [], D(26, 10), 30), { status: 'ACTIVE' });
  const a = { sp_id: 'SP7', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(12, 10), end_date: D(25, 10), start_source: 'FIXED' };
  assert.strictEqual(api.pkgDailyTransition_(a, DEF.PASS_2W, [], D(25, 10), 30), null, 'ngày cuối vẫn còn hạn');
  assert.deepStrictEqual(api.pkgDailyTransition_(a, DEF.PASS_2W, [], D(26, 10), 30), { status: 'EXPIRED' });
  assert.strictEqual(api.pkgDailyTransition_(a, DEF.PASS_2W, [], D(26, 10), 30, { suspended: true }), null);
});

// ── Chọn tutor ──

t('U25', 'C25 (đổi 5A, không còn ngẫu nhiên): chọn trong nhóm ít buổi nhất tuần, trong nhóm xoay vòng theo lần được giao gần nhất (chưa từng được giao trước), hoà thì theo mã', () => {
  const { api } = env();
  assert.strictEqual(api.pickTutor_([]), null);
  assert.strictEqual(api.pickTutor_([{ tutor_id: 'T001', load: 2, last: 1 }, { tutor_id: 'T002', load: 1, last: 99 }]), 'T002', 'ít buổi nhất');
  assert.strictEqual(api.pickTutor_([{ tutor_id: 'T001', load: 1, last: 50 }, { tutor_id: 'T002', load: 1, last: 10 }]), 'T002', 'lâu chưa được giao');
  assert.strictEqual(api.pickTutor_([{ tutor_id: 'T002', load: 1, last: 10 }, { tutor_id: 'T003', load: 1, last: -1 }]), 'T003', 'chưa từng được giao');
  assert.strictEqual(api.pickTutor_([{ tutor_id: 'T003', load: 0, last: -1 }, { tutor_id: 'T001', load: 0, last: -1 }]), 'T001', 'hoà theo mã');
  // Xoay vòng thật: 4 lượt giao liên tiếp cho 2 tutor bằng tải chia đều
  const last = { T001: -1, T002: -1 }, got = [];
  for (let i = 0; i < 4; i++) { const id = api.pickTutor_(Object.keys(last).map(k => ({ tutor_id: k, load: 0, last: last[k] }))); got.push(id); last[id] = i; }
  assert.deepStrictEqual(got, ['T001', 'T002', 'T001', 'T002']);
});

t('U26', 'Tutor đã có học viên ở slot, đang chờ huỷ, bị khoá, hoặc bị loại trừ thì không là ứng viên; tải chỉ đếm buổi trừ lượt trong tuần (thứ Hai đến Chủ nhật)', () => {
  const { api } = env();
  const tut = (id, status) => ({ user_id: id, role: 'TUTOR', status: status || 'ACTIVE' });
  const tutors = [tut('T001'), tut('T002'), tut('T003'), tut('T004'), tut('T005', 'DISABLED')];
  const av = (id, status, d, s) => ({ tutor_id: id, date: d || D(14, 10), slot: s || '19:00', status: status || 'OPEN' });
  const avail = [av('T001'), av('T002'), av('T003', 'CANCEL_PENDING'), av('T004'), av('T005')];
  const bks = [
    { tutor_id: 'T001', date: D(14, 10), slot: '19:00', status: 'CONFIRMED', created_at: D(10, 10) },
    { tutor_id: 'T002', date: D(12, 10), slot: '20:00', status: 'COMPLETED', created_at: D(9, 10) },
    { tutor_id: 'T002', date: D(18, 10), slot: '20:00', status: 'CONFIRMED', created_at: D(9, 10) },
    { tutor_id: 'T002', date: D(19, 10), slot: '20:00', status: 'CONFIRMED', created_at: D(9, 10) },
    { tutor_id: 'T002', date: D(13, 10), slot: '20:00', status: 'CANCELLED_STUDENT', created_at: D(9, 10) }
  ];
  const c = api.buildTutorCandidates_(D(14, 10), '19:00', tutors, avail, bks, ['T004']);
  assert.deepStrictEqual(c.map(x => x.tutor_id), ['T002']);
  assert.strictEqual(c[0].load, 2, 'thứ Hai 12/10 và Chủ nhật 18/10 trong tuần; 19/10 tuần sau; buổi huỷ không tính');
});

// ── Bù buổi, khoá ngày bắt đầu (chunk 5M, plan/TU_VAN_BU_BUOI.md, docs/03 B19 đến B24) ──

const ctxAt = (api, s) => { api.setSimNow_(s); return api.compCtx_(api.getNow_()); };

t('P01', 'Khoá ngày bắt đầu ở buổi Hoàn thành đầu tiên: start_source LOCKED, ghi start_date_locked và buổi làm mốc; buổi Không hoàn thành không làm mốc', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(14, 10), end_date: D(27, 10), start_source: 'BOOKING' };
  const a = bk('SP2', D(14, 10), 'COMPLETED'), b = bk('SP2', D(16, 10), 'CONFIRMED');
  const r = api.pkgPlan_(sp, DEF.PASS_2W, [a, b], ctxAt(api, '2026-10-15 10:00'));
  assert.ok(r.locked);
  assert.deepStrictEqual([r.patch.start_source, key(api, r.patch.start_date_locked), r.patch.start_booking_id, key(api, r.end)], ['LOCKED', '2026-10-14', a.booking_id, '2026-10-27']);
  a.status = 'NOT_COMPLETED';
  const r2 = api.pkgPlan_(sp, DEF.PASS_2W, [a, b], ctxAt(api, '2026-10-15 10:00'));
  assert.ok(!r2.locked, 'Không hoàn thành chờ admin làm rõ');
  assert.strictEqual(key(api, r2.start), '2026-10-14', 'vẫn giữ ngày tạm tính, vẫn trừ lượt');
});

t('P02', 'Buổi sớm hơn chưa có kết quả cuối thì chưa khoá (buổi 14/10 chưa xác nhận mà 15/10 đã Hoàn thành); kỹ thuật chưa chọn lỗi là cuối sau TECH_DECIDE_HOURS', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'ACTIVE', start_source: 'BOOKING' };
  const early = bk('SP2', D(14, 10), 'CONFIRMED', '23:30'), done = bk('SP2', D(15, 10), 'COMPLETED');
  assert.strictEqual(api.pkgLockAnchor_(sp, [early, done], new Date(2026, 9, 16, 10), 48), null);
  early.status = 'TECH_ISSUE'; early.result_at = new Date(2026, 9, 15, 0, 0);
  assert.strictEqual(api.pkgLockAnchor_(sp, [early, done], new Date(2026, 9, 16, 23, 59), 48), null, 'chưa đủ 48 giờ');
  assert.strictEqual(api.pkgLockAnchor_(sp, [early, done], new Date(2026, 9, 17, 0, 0), 48), done, 'đủ 48 giờ: coi như lỗi tutor, kết quả cuối');
});

t('P03', 'Sau khi khoá: buổi Vắng tutor từ ngày bắt đầu được bù 1 ngày (COMP_DAYS_PER_SESSION), ghi comp_days một lần; tính lại lần nữa không cộng thêm', () => {
  const { api } = env();
  const sp = { sp_id: 'SP3', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED', start_date_locked: D(5, 10) };
  const ab = bk('SP3', D(14, 10), 'TUTOR_ABSENT');
  const ctx = ctxAt(api, '2026-10-15 10:00');
  const r = api.pkgPlan_(sp, DEF.PASS_1M, [ab], ctx);
  assert.deepStrictEqual(r.bookings.map(x => x.patch), [{ comp_days: 1, comp_gap: 0 }]);
  assert.strictEqual(key(api, r.end), '2026-11-04');
  assert.ok(r.events.some(e => e.type === 'COMP_EXTENDED' && e.days === 1));
  Object.assign(ab, r.bookings[0].patch); Object.assign(sp, r.patch);
  const again = api.pkgPlan_(sp, DEF.PASS_1M, [ab], ctx);
  assert.deepStrictEqual(again.bookings, []);
  assert.strictEqual(key(api, again.end), '2026-11-04');
  // Buổi lỗi trước ngày bắt đầu: không bù
  const before = api.pkgPlan_(Object.assign({}, sp, { comp_days: 0, end_date: D(3, 11) }), DEF.PASS_1M, [bk('SP3', D(4, 10), 'CANCELLED_TUTOR')], ctx);
  assert.deepStrictEqual(before.bookings, []);
});

t('P04', 'Trial: mỗi buổi lỗi phía trường bù COMP_DAYS_TRIAL (3) ngày tới trần COMP_TRIAL_MAX_DAYS (3): buổi lỗi thứ hai ghi 0', () => {
  const { api } = env();
  const sp = { sp_id: 'SP1', package_code: 'TRIAL', status: 'ACTIVE', sessions_total: 2, start_date: D(14, 10), end_date: D(20, 10), start_source: 'LOCKED', start_date_locked: D(14, 10) };
  const b1 = bk('SP1', D(15, 10), 'CANCELLED_ADMIN'), b2 = bk('SP1', D(16, 10), 'TUTOR_ABSENT');
  const r = api.pkgPlan_(sp, DEF.TRIAL, [bk('SP1', D(14, 10), 'COMPLETED'), b1, b2], ctxAt(api, '2026-10-14 10:00'));
  const pt = r.bookings.map(x => [x.b.booking_id, x.patch.comp_days]);
  assert.deepStrictEqual(pt, [[b1.booking_id, 3], [b2.booking_id, 0]]);
  assert.strictEqual(key(api, r.end), '2026-10-23');
});

t('P05', 'Phần để còn kịp đặt (comp_gap): hạn đã qua ngày đặt được đầu tiên F thì hạn mới = F − 1 + số ngày bù', () => {
  const { api } = env();
  const sp = { sp_id: 'SP2', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(1, 10), end_date: D(14, 10), start_source: 'LOCKED', start_date_locked: D(1, 10) };
  // 14/10 16:00: đã qua 15:00 nên F = 16/10; hạn 14/10 < F − 1 = 15/10 nên gap 1, tổng 2, hạn mới 16/10
  const ctx = ctxAt(api, '2026-10-14 16:00');
  assert.strictEqual(key(api, ctx.F), '2026-10-16');
  const r = api.pkgPlan_(sp, DEF.PASS_2W, [bk('SP2', D(14, 10), 'TUTOR_ABSENT')], ctx);
  assert.deepStrictEqual(r.bookings[0].patch, { comp_days: 2, comp_gap: 1 });
  assert.strictEqual(key(api, r.end), '2026-10-16');
});

t('P06', 'Đổi lỗi kỹ thuật từ tutor sang học viên: rút ngày bù đã cộng; học viên đã đặt buổi trong phần ngày sắp rút thì không rút, báo admin COMP_RETRACT_BLOCKED', () => {
  const { api } = env();
  const sp = { sp_id: 'SP3', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(4, 11), start_source: 'LOCKED', start_date_locked: D(5, 10), comp_days: 1 };
  const tech = bk('SP3', D(14, 10), 'TECH_ISSUE', '19:00', { tech_fault: 'STUDENT', tech_decided_at: D(15, 10), comp_days: 1, comp_gap: 0 });
  const ctx = ctxAt(api, '2026-10-16 10:00');
  const r = api.pkgPlan_(sp, DEF.PASS_1M, [tech], ctx);
  assert.ok(r.events.some(e => e.type === 'COMP_RETRACTED' && e.days === 1));
  assert.deepStrictEqual(r.bookings[0].patch, { comp_days: '', comp_gap: '' });
  assert.strictEqual(key(api, r.end), '2026-11-03');
  const late = bk('SP3', D(4, 11), 'CONFIRMED');
  const r2 = api.pkgPlan_(sp, DEF.PASS_1M, [tech, late], ctx);
  const ev = r2.events.find(e => e.type === 'COMP_RETRACT_BLOCKED');
  assert.ok(ev && ev.blockers[0] === late.booking_id, JSON.stringify(r2.events));
  assert.strictEqual(key(api, r2.end), '2026-11-04', 'giữ hạn cũ');
});

t('P07', 'Gói EXPIRED: buổi bù trong hạn, hết hạn chưa quá COMP_REOPEN_DAYS (7) thì tự mở lại; quá 7 ngày thì ghi 0 và báo admin COMP_ON_EXPIRED', () => {
  const { api } = env();
  const mkSp = () => ({ sp_id: 'SP6', package_code: 'PASS_2W', status: 'EXPIRED', start_date: D(1, 10), end_date: D(14, 10), start_source: 'LOCKED', start_date_locked: D(1, 10), comp_days: 0 });
  const r = api.pkgPlan_(mkSp(), DEF.PASS_2W, [bk('SP6', D(14, 10), 'TUTOR_ABSENT')], ctxAt(api, '2026-10-16 10:00'));
  assert.strictEqual(r.patch.status, 'ACTIVE', 'mở lại');
  assert.ok(r.end >= D(16, 10));
  const r2 = api.pkgPlan_(mkSp(), DEF.PASS_2W, [bk('SP6', D(14, 10), 'TUTOR_ABSENT')], ctxAt(api, '2026-10-22 10:00'));
  assert.deepStrictEqual(r2.bookings[0].patch, { comp_days: 0, comp_gap: 0 });
  assert.ok(r2.events.some(e => e.type === 'COMP_ON_EXPIRED' && e.days === 1));
  assert.ok(!r2.patch || r2.patch.status === undefined || r2.patch.status === 'EXPIRED');
});

t('P08', 'Hạn = ngày bắt đầu + số ngày gói + suspended_days + comp_days + comp_days_admin − 1; gói nối đuôi chưa tới ngày luôn QUEUED (kể cả ô bị dán đè); gói QUEUED dời theo gói trước', () => {
  const { api } = env();
  const sp = { sp_id: 'SP3', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'LOCKED', start_date_locked: D(5, 10), suspended_days: 2, comp_days_admin: 3 };
  const r = api.pkgPlan_(sp, DEF.PASS_1M, [], ctxAt(api, '2026-10-15 10:00'));
  assert.strictEqual(key(api, r.end), '2026-11-08', '5/10 + 30 + 2 + 3 − 1');
  const q = { sp_id: 'SP9', package_code: 'PASS_1M', status: 'INACTIVE', start_date: D(26, 10), end_date: D(24, 11), start_source: 'FIXED', start_date_locked: D(26, 10) };
  assert.strictEqual(api.pkgPlan_(q, DEF.PASS_1M, [], ctxAt(api, '2026-10-15 10:00')).patch.status, 'QUEUED');
  const shifted = api.pkgShiftQueued_(Object.assign({}, q, { status: 'QUEUED' }), D(25, 10), D(27, 10));
  assert.deepStrictEqual([key(api, shifted.start_date), key(api, shifted.start_date_locked)], ['2026-10-28', '2026-10-28']);
  assert.strictEqual(api.pkgShiftQueued_(Object.assign({}, q, { status: 'QUEUED' }), D(20, 10), D(22, 10)), null, 'không nối liền thì không dời');
});

module.exports = { results };
if (require.main === module) {
  results.forEach(r => console.log((r.ok ? 'ĐẠT  ' : 'KHÔNG ĐẠT  ') + r.id + ' ' + r.title + (r.ok ? '' : '\n   ' + r.err)));
  process.exit(results.some(r => !r.ok) ? 1 : 0);
}
