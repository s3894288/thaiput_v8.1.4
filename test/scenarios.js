/**
 * scenarios.js · 40 kịch bản đầu cuối (docs/03_KICH_BAN_TEST_40.md)
 *
 * Mỗi kịch bản: { id, title, chunk, run(ctx) }. run ném lỗi khi Không đạt.
 * run = null nghĩa là chưa cài (cần lớp đăng nhập và API web của chunk 3).
 * Phần "chuẩn bị" (booking có sẵn, tutor đóng slot) được dựng bằng chính dịch vụ thật hoặc ghi thẳng vào bảng,
 * đúng như mục 4 phần "Cách dùng" của file 03. Kết quả mong đợi lấy nguyên văn từ file 03.
 */
'use strict';
const assert = require('assert');
const { scenarioEnv, D } = require('./fixtures');

const S = [];
function sc(id, title, chunk, run) { S.push({ id, title, chunk, run: run || null }); }

// ── Trợ giúp ──
const K = (dd, mm) => '2026-' + String(mm).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
const EMAIL = { S001: 's001@student.test', S002: 's002@student.test', S003: 's003@student.test', S004: 's004@student.test', S005: 's005@student.test', S006: 's006@student.test', S007: 's007@student.test', S008: 's008@student.test', T001: 'van@tutor.test', T002: 'anh@tutor.test', T003: 'lan@tutor.test', T004: 'minh@tutor.test', ADMIN: 'admin@thaiput.vn' };
const SHOT = { name: 'chuyen_khoan.jpg', mimeType: 'image/jpeg', base64: Buffer.from('anh-chup-gia').toString('base64') };

function mk(now, opts) {
  const c = scenarioEnv(Object.assign({ now: now || '2026-10-12 10:00' }, opts || {}));
  const { api, env } = c;
  c.at = (s) => api.setSimNow_(s);
  c.book = (sid, list) => api.bookSessionsFor_(sid, list.map(x => ({ date: x[0], slot: x[1] })), EMAIL[sid]);
  c.reasons = (res) => res.map(r => (r.ok ? 'OK' : r.reason));
  c.rows = (t) => { api.clearDbCache_(); return api.table_(t).all(); };
  c.row = (t, id) => { api.clearDbCache_(); return api.table_(t).byId(id); };
  c.mailsTo = (e) => env.state.mails.filter(m => m.to.split(',').map(x => x.trim()).indexOf(e) !== -1);
  c.sp = (id) => c.row('STUDENT_PACKAGES', id);
  c.keyOf = (d) => (d ? api.dateKey_(d) : '');
  c.summary = (sid) => {
    api.clearDbCache_();
    const defs = api.pkgDefs_(), bks = api.studentBookings_(sid);
    return api.studentPackages_(sid).map(sp => api.pkgSummary_(sp, defs[sp.package_code], bks));
  };
  /** Đổi trạng thái slot của tutor trực tiếp trong bảng (phần chuẩn bị). */
  c.setSlot = (tid, dk, slot, status) => {
    api.clearDbCache_();
    const t = api.table_('AVAILABILITY'), d = api.parseDateKey_(dk);
    const r = t.find(a => a.tutor_id === tid && api.sameDate_(a.date, d) && a.slot === slot);
    if (r) t.update(r, { status });
    else t.insert({ avail_id: api.nextId_('AVAILABILITY'), tutor_id: tid, date: d, slot, status, created_at: api.getNow_() });
  };
  /** Chỉ giữ một số tutor mở ở (ngày, slot); các tutor khác đóng. */
  c.onlyOpen = (dk, slot, tids) => ['T001', 'T002', 'T003', 'T004'].forEach(t => c.setSlot(t, dk, slot, tids.indexOf(t) !== -1 ? 'OPEN' : 'CANCELLED'));
  c.form = (o) => Object.assign({ email: 'new1@test.com', name: 'Khách Mới', phone: '0912 345 678', level_self: 'A1', package_code: 'PASS_1M', consent: true, screenshot: SHOT }, o || {});
  c.rawCell = (table, rowNum, col) => env.state.spreadsheets['DB_STAGING_TEST'].sheets[table].values[rowNum - 1][api.SCHEMA[table].cols.indexOf(col)];
  c.calls = (op) => env.state.calendarCalls.filter(x => !op || x.op === op);
  return c;
}


/** Đăng nhập thật qua link (tạo link như email chào mừng, rồi đổi lấy phiên). */
function login(c, uid) {
  const { api } = c;
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_(uid)));
  const raw = url.match(/[?&]t=([a-f0-9]{64})/)[1];
  const r = api.apiExchangeToken(raw);
  if (!r.ok) throw new Error('đăng nhập thất bại ' + uid + ': ' + r.reason);
  return r.data.sessionToken;
}

// ═══ A. Đăng ký và tài khoản ═══

sc('A01', 'Gửi form đăng ký, số điện thoại lưu đúng chữ +84', 2, () => {
  const c = mk(), { api, env } = c;
  const r = api.submitRegistration_(c.form());
  assert.ok(r.ok, 'gửi form thất bại: ' + r.reasons);
  const reg = c.row('REGISTRATIONS', r.regId);
  assert.strictEqual(reg.admin_action, 'Chờ duyệt');
  assert.ok(/^TP R\d{5} 1M$/.test(reg.transfer_code), 'mã chuyển khoản: ' + reg.transfer_code);
  assert.strictEqual(c.rawCell('REGISTRATIONS', reg._row, 'phone'), '+84912345678', 'ô số điện thoại trong Sheets phải là chữ +84...');
  assert.ok(/drive\.google\.com/.test(reg.screenshot_url));
  assert.ok(Object.values(env.state.drive.files).some(f => f.parent === 'FOLDER_UPLOADS'), 'ảnh phải nằm trong thư mục Uploads');
  const adminMail = c.mailsTo(EMAIL.ADMIN).find(m => m.subject.indexOf('[Đăng ký mới]') === 0);
  assert.ok(adminMail && adminMail.htmlBody.indexOf('0912 345 678') !== -1 && adminMail.htmlBody.indexOf(reg.screenshot_url) !== -1, 'email admin phải có số điện thoại và link ảnh');
  assert.strictEqual(c.mailsTo('new1@test.com').length, 1);
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'REG_CREATED' && l.entity_id === r.regId));
});

// A02 đổi ngày 13/10/2026 theo yêu cầu anh Chris: số điện thoại không bắt buộc, nhận số nước ngoài có mã nước.
sc('A02', 'Form thiếu ảnh, thiếu đồng ý bị chặn; số di động Việt Nam được chuẩn hoá; số khác lưu nguyên văn (5K); số trống và số nước ngoài được nhận', 2, () => {
  const c = mk(), { api } = c;
  const bad = [
    [c.form({ screenshot: null }), 'MISSING_SCREENSHOT'],
    [c.form({ consent: false }), 'MISSING_CONSENT'],
  ];
  // 5K (đổi theo kế hoạch anh duyệt 01/11): số điện thoại không cần định dạng; số không phải di động Việt Nam lưu nguyên văn
  ['0212345678', '091234567', '1 415 555 0100'].forEach((p, i) => {
    const r = api.submitRegistration_(c.form({ phone: p, email: 'raw' + i + '@test.com' }));
    assert.ok(r.ok, 'không chặn số ' + p);
    assert.strictEqual(c.row('REGISTRATIONS', r.regId).phone, p, 'lưu nguyên văn ' + p);
  });
  bad.forEach(([f, why]) => { const r = api.submitRegistration_(f); assert.ok(!r.ok && r.reasons.indexOf(why) !== -1, 'phải chặn ' + why); });
  assert.strictEqual(c.rows('REGISTRATIONS').length, 3, 'chỉ 3 dòng số nguyên văn được ghi');
  ['+84 912.345.678', '84912345678', '912345678'].forEach((p, i) => {
    const r = api.submitRegistration_(c.form({ phone: p, email: 'ok' + i + '@test.com' }));
    assert.ok(r.ok, 'phải nhận ' + p);
    assert.strictEqual(c.row('REGISTRATIONS', r.regId).phone, '+84912345678');
  });
  [['+1 415 555 0100', '+14155550100'], ['', ''], ['+66 81 234 5678', '+66812345678']].forEach(([p, want], i) => {
    const r = api.submitRegistration_(c.form({ phone: p, email: 'intl' + i + '@test.com' }));
    assert.ok(r.ok, 'phải nhận "' + p + '": ' + r.reasons);
    assert.strictEqual(c.row('REGISTRATIONS', r.regId).phone, want);
  });
});

sc('A03', 'Mỗi email chỉ dùng Trial 1 lần', 2, () => {
  const c = mk(null, { now: '2026-10-12 10:05' }), { api } = c;
  const r1 = api.submitRegistration_(c.form({ email: EMAIL.S001, package_code: 'TRIAL' }));
  assert.deepStrictEqual(r1.reasons, ['TRIAL_USED']);
  assert.ok(api.submitRegistration_(c.form({ email: EMAIL.S001, package_code: 'PASS_2W' })).ok);
});

sc('A04', 'Admin duyệt tạo tài khoản, gói, khoản thu; duyệt lại không tạo trùng', 2, () => {
  const c = mk(), { api } = c;
  const r = api.submitRegistration_(c.form());
  c.at('2026-10-12 10:10');
  const a1 = api.approveRegistration_(r.regId, 'admin.karn@gmail.com');
  assert.ok(a1.ok && !a1.already);
  const u = c.rows('USERS').find(x => x.email === 'new1@test.com');
  assert.ok(u && u.status === 'ACTIVE' && u.role === 'STUDENT' && u.phone === '+84912345678');
  // Ô chứa công thức HYPERLINK (đọc công thức gốc của ô; getValues của Google thật chỉ trả chữ hiển thị).
  assert.ok(String(c.rawCell('USERS', u._row, 'contact_link')).indexOf('=HYPERLINK("https://zalo.me/0912345678"') === 0);
  const sps = c.rows('STUDENT_PACKAGES').filter(s => s.student_id === u.user_id);
  assert.deepStrictEqual(sps.map(s => s.package_code + ':' + s.status), ['PASS_1M:INACTIVE']);
  const pays = c.rows('PAYMENTS').filter(p => p.student_id === u.user_id);
  assert.strictEqual(pays.length, 1); assert.strictEqual(pays[0].amount_vnd, 1790000);
  assert.ok(c.mailsTo('new1@test.com').some(m => m.subject.indexOf('Chào mừng bạn đến với thaiput') === 0));
  const counts = () => [c.rows('USERS').length, c.rows('STUDENT_PACKAGES').length, c.rows('PAYMENTS').length, c.mailsTo('new1@test.com').length].join(',');
  const before = counts();
  const a2 = api.approveRegistration_(r.regId, 'admin.karn@gmail.com');
  assert.ok(a2.already); assert.strictEqual(counts(), before, 'duyệt lần 2 không được tạo thêm gì');
});

sc('A05', 'Link đăng nhập dùng 1 lần, hết hạn sau 15 phút', 3, () => {
  const c = mk(null, { now: '2026-10-12 10:10' }), { api } = c;
  const r = api.submitRegistration_(c.form());
  api.approveRegistration_(r.regId, 'admin.karn@gmail.com');
  const welcome = c.mailsTo('new1@test.com').find(m => m.subject.indexOf('Chào mừng bạn đến với thaiput') === 0);
  const raw = welcome.htmlBody.match(/[?&](?:amp;)?t=([a-f0-9]{64})/)[1];
  c.at('2026-10-12 10:15');
  const first = api.apiExchangeToken(raw);
  assert.ok(first.ok && first.data.role === 'STUDENT', 'lần 1 phải vào được');
  const tok = first.data.sessionToken;
  // Đổi ngày 13/10/2026 theo yêu cầu anh Chris: mặc định dùng được nhiều lần trong 15 phút (LOGIN_LINK_MAX_USES = 0).
  assert.ok(api.apiExchangeToken(raw).ok, 'bấm lại link trong hạn vẫn vào được');
  api.withLock_(() => api.table_('CONFIG').insert({ key: 'LOGIN_LINK_MAX_USES', value: '2' }));
  api.clearConfigCache_();
  assert.strictEqual(api.apiExchangeToken(raw).reason, 'LINK_USED', 'đặt giới hạn 2 lần thì lần 3 bị chặn');
  assert.ok(api.apiExchangeToken(raw).message.indexOf('Link này đã được dùng. Vui lòng yêu cầu gửi lại liên kết đăng nhập mới.') === 0, 'câu tiếng Việt đứng đầu (từ 13/10 trang đăng nhập hiện thêm tiếng Anh cho tutor)');
  assert.ok(api.requestLoginLink_('new1@test.com').ok);
  const raw2 = c.mailsTo('new1@test.com').filter(m => m.subject.indexOf('Link đăng nhập thaiput') === 0).pop().htmlBody.match(/[?&](?:amp;)?t=([a-f0-9]{64})/)[1];
  c.at('2026-10-12 10:31');
  assert.strictEqual(api.apiExchangeToken(raw2).reason, 'LINK_EXPIRED');
  c.at('2026-11-10 10:00');
  assert.ok(api.apiStudentHome(tok).ok, 'phiên còn hạn sau 29 ngày');
  c.at('2026-11-12 10:16');
  assert.strictEqual(api.apiStudentHome(tok).reason, 'SESSION_INVALID', 'phiên hết hạn sau 30 ngày');
  const auth = c.rows('AUTH');
  assert.ok(auth.every(a => /^[a-f0-9]{64}$/.test(a.token_hash) && a.token_hash !== raw && a.token_hash !== tok), 'chỉ lưu mã băm');
});
sc('A06', '5J (đổi 01/11): mỗi email xin link 1 lần mỗi giờ; email lạ không lộ thông tin', 5, () => {
  const c = mk('2026-10-12 10:20'), { api, env } = c;
  const res = [1, 2].map(() => api.apiRequestLogin(EMAIL.S003));
  assert.deepStrictEqual(res.map(r => (r.ok ? 'OK' : r.reason)), ['OK', 'LINK_COOLDOWN']);
  assert.strictEqual(c.mailsTo(EMAIL.S003).length, 1);
  const before = env.state.mails.length;
  const ghost = [1, 2].map(() => api.apiRequestLogin('khongco@test.com'));
  assert.ok(ghost[0].ok, 'email lạ nhận cùng thông báo như email có thật');
  assert.strictEqual(ghost[1].reason, 'LINK_COOLDOWN', 'lần 2 của email lạ cũng cùng câu chờ');
  assert.strictEqual(ghost[1].msg.vi.replace(/\d\d:\d\d/g, ''), res[1].msg.vi.replace(/\d\d:\d\d/g, ''), 'không phân biệt được email có hay không');
  assert.strictEqual(env.state.mails.length, before, 'không có email nào được gửi');
  c.at('2026-10-12 11:21');
  assert.ok(api.apiRequestLogin(EMAIL.S003).ok && c.mailsTo(EMAIL.S003).length === 2, 'qua 60 phút xin lại được');
  // Admin gửi hộ bằng menu không bị giới hạn
  c.at('2026-10-12 11:25');
  assert.deepStrictEqual(api.sendLoginLinks_(['S003'], 'admin@thaiput.vn').sent, ['S003']);
});

// ═══ B. Gói học, thời hạn và nhắc lịch ═══

sc('B07', 'Trial đặt buổi đầu, gói 14/10 đến 20/10', 2, () => {
  const c = mk();
  assert.deepStrictEqual(c.reasons(c.book('S001', [[K(14, 10), '19:00']])), ['OK']);
  const sp = c.sp('SP00001');
  assert.strictEqual(sp.status + '|' + c.keyOf(sp.start_date) + '|' + c.keyOf(sp.end_date), 'ACTIVE|2026-10-14|2026-10-20');
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 1);
});

sc('B08', 'Trial 2 buổi, buổi thứ ba NO_SESSIONS', 2, () => {
  const c = mk();
  assert.deepStrictEqual(c.reasons(c.book('S001', [[K(14, 10), '19:00'], [K(16, 10), '20:00']])), ['OK', 'OK']);
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 0);
  assert.deepStrictEqual(c.reasons(c.book('S001', [[K(17, 10), '19:00']])), ['NO_SESSIONS']);
});

sc('B09', 'Đặt ngoài hạn Trial OUT_OF_RANGE', 2, () => {
  const c = mk();
  c.book('S001', [[K(14, 10), '19:00']]);
  c.setSlot('T001', K(21, 10), '19:00', 'OPEN');
  assert.deepStrictEqual(c.reasons(c.book('S001', [[K(21, 10), '19:00']])), ['OUT_OF_RANGE']);
});

sc('B10', 'Ngày cuối gói 23:30 được, ngày sau bị chặn', 2, () => {
  const c = mk('2026-11-02 10:00');
  c.setSlot('T001', K(3, 11), '23:30', 'OPEN'); c.setSlot('T001', K(4, 11), '08:00', 'OPEN');
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(3, 11), '23:30'], [K(4, 11), '08:00']])), ['OK', 'OUT_OF_RANGE']);
});

sc('B11', 'Gói 2 tuần tính lại khi huỷ buổi đầu', 2, () => {
  const c = mk(), { api } = c;
  const r = c.book('S002', [[K(14, 10), '19:00'], [K(16, 10), '19:00']]);
  let sp = c.sp('SP00002');
  assert.strictEqual(c.keyOf(sp.start_date) + '|' + c.keyOf(sp.end_date), '2026-10-14|2026-10-27');
  c.at('2026-10-13 10:00');
  assert.ok(api.cancelBookingFor_('S002', r[0].bookingId, EMAIL.S002).ok);
  sp = c.sp('SP00002');
  assert.strictEqual(c.keyOf(sp.start_date) + '|' + c.keyOf(sp.end_date), '2026-10-16|2026-10-29');
});

sc('B12', 'Huỷ buổi duy nhất, gói về INACTIVE', 2, () => {
  const c = mk(), { api } = c;
  const r = c.book('S002', [[K(16, 10), '19:00']]);
  assert.ok(api.cancelBookingFor_('S002', r[0].bookingId, EMAIL.S002).ok);
  const sp = c.sp('SP00002');
  assert.strictEqual(sp.status, 'INACTIVE'); assert.strictEqual(sp.start_date, null); assert.strictEqual(sp.end_date, null);
});

sc('B13', 'Gói nối tiếp QUEUED và buổi gắn đúng gói mới', 2, () => {
  const c = mk(), { api } = c;
  const reg = api.submitRegistration_(c.form({ email: EMAIL.S007, name: 'Học viên 7' }));
  const ap = api.approveRegistration_(reg.regId, 'admin.karn@gmail.com');
  const sp = c.sp(ap.spId);
  assert.strictEqual(sp.status + '|' + c.keyOf(sp.start_date) + '|' + c.keyOf(sp.end_date), 'QUEUED|2026-10-26|2026-11-24');
  c.setSlot('T001', K(26, 10), '19:00', 'OPEN');
  const r = c.book('S007', [[K(26, 10), '19:00']]);
  assert.deepStrictEqual(c.reasons(r), ['OK']);
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).sp_id, ap.spId);
});

sc('B14', 'Tạm khoá chặn đặt, mở khoá cộng bù 3 ngày', 2, () => {
  const c = mk(), { api } = c;
  assert.ok(api.suspendStudent_('S005', 'admin.karn@gmail.com').ok);
  assert.deepStrictEqual(c.reasons(c.book('S005', [[K(14, 10), '19:00']])), ['SUSPENDED']);
  c.at('2026-10-15 10:00');
  assert.ok(api.unsuspendStudent_('S005', 'admin.karn@gmail.com').ok);
  assert.strictEqual(c.keyOf(c.sp('SP00005').end_date), '2026-11-02');
  assert.strictEqual(c.row('USERS', 'S005').status, 'ACTIVE');
});

sc('B15', 'dailyJob: email sắp hết hạn 1 lần; tự kích hoạt sau 30 ngày', 2, () => {
  const c = mk('2026-10-31 06:00'), { api } = c;
  api.dailyJob(); api.dailyJob();
  assert.strictEqual(c.mailsTo(EMAIL.S003).filter(m => m.subject.indexOf('Gói học sắp hết hạn') === 0).length, 1);
  c.at('2026-11-09 06:00');
  api.dailyJob();
  const sp = c.sp('SP00002');
  assert.strictEqual(sp.status + '|' + c.keyOf(sp.start_date) + '|' + c.keyOf(sp.end_date) + '|' + sp.start_source, 'ACTIVE|2026-11-09|2026-11-22|FIXED');
});

sc('B16', 'Email nhắc 60 phút gửi đúng 1 lần, đúng người', 2, () => {
  const c = mk(), { api, env } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001', 'T002']);
  const s3 = c.book('S003', [[K(14, 10), '19:00']]);
  const s8 = c.book('S008', [[K(14, 10), '19:00']]);
  api.cancelBookingFor_('S008', s8[0].bookingId, EMAIL.S008);
  c.book('S007', [[K(14, 10), '21:00']]);
  const tutorEmail = EMAIL[c.row('BOOKINGS', s3[0].bookingId).tutor_id];
  const isReminder = m => /^Nhắc: buổi học|^Reminder: lesson/.test(m.subject);
  c.at('2026-10-14 18:00'); api.reminderJob();
  const rem = env.state.mails.filter(isReminder);
  assert.deepStrictEqual(rem.map(m => m.to).sort(), [EMAIL.S003, tutorEmail].sort());
  assert.ok(rem.every(m => m.htmlBody.indexOf('meet.google.com') !== -1 && m.htmlBody.indexOf('zalo.me') !== -1), 'email nhắc phải có link Meet và nút Zalo admin');
  assert.ok(c.row('BOOKINGS', s3[0].bookingId).reminder_sent_at);
  // Chạy lại giữa cửa sổ nhắc (còn 55 phút) để chắc chắn chống gửi trùng nhờ reminder_sent_at,
  // không phải nhờ rơi ra ngoài cửa sổ; rồi chạy đúng mốc 18:15 của file 03.
  c.at('2026-10-14 18:05'); api.reminderJob();
  c.at('2026-10-14 18:15'); api.reminderJob();
  assert.strictEqual(env.state.mails.filter(isReminder).length, 2, 'không gửi lại');
});

sc('B17', 'Gói cũ còn 1 buổi, ngày thứ hai NO_SESSIONS', 2, () => {
  const c = mk();
  assert.deepStrictEqual(c.reasons(c.book('S004', [[K(14, 10), '19:00'], [K(15, 10), '19:00']])), ['OK', 'NO_SESSIONS']);
});

sc('B18', 'Gói hết hạn bị từ chối EXPIRED', 2, () => {
  const c = mk();
  assert.deepStrictEqual(c.reasons(c.book('S006', [[K(14, 10), '19:00']])), ['EXPIRED']);
});

// ═══ B19 đến B24: bù buổi, khoá ngày bắt đầu (chunk 5M, bản 8.1.0; BL40, BL42, BL46, BL47, BL48) ═══
const pick5M = (c, id, v, at) => { const { api } = c; api.withLock_(() => api.table_('BOOKINGS').update(api.table_('BOOKINGS').byId(id), { admin_action: v })); return api.handleAdminEdit_('BOOKINGS', 'admin_action', id, v, EMAIL.ADMIN, at ? { at } : undefined); };

sc('B19', 'Ngày bắt đầu là buổi học hoàn chỉnh đầu tiên: buổi đầu tutor vắng thì lùi, không cộng ngày', 5, () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001']); c.onlyOpen(K(20, 10), '19:00', ['T001']);
  const r = c.book('S002', [[K(14, 10), '19:00'], [K(20, 10), '19:00']]);
  c.at('2026-10-14 21:00'); assert.ok(pick5M(c, r[0].bookingId, 'Vắng tutor').ok);
  let sp = c.sp('SP00002');
  assert.strictEqual([sp.start_source, c.keyOf(sp.start_date), c.keyOf(sp.end_date)].join('|'), 'BOOKING|2026-10-20|2026-11-02');
  c.at('2026-10-20 19:40'); assert.ok(api.submitSessionResultFor_('T001', r[1].bookingId, 'COMPLETED', EMAIL.T001).ok);
  sp = c.sp('SP00002');
  assert.strictEqual([sp.start_source, c.keyOf(sp.start_date_locked), c.keyOf(sp.end_date), Number(sp.comp_days || 0)].join('|'), 'LOCKED|2026-10-20|2026-11-02|0');
});

sc('B20', 'Chỉ khoá khi mọi buổi sớm hơn đã có kết quả: 14/10 23:30 chưa xác nhận, 15/10 Hoàn thành (5J: 14/10 thành Không hoàn thành, admin chọn Hoàn thành mới khoá)', 5, () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(14, 10), '23:30', ['T001']); c.onlyOpen(K(15, 10), '19:00', ['T001']);
  const r = c.book('S002', [[K(14, 10), '23:30'], [K(15, 10), '19:00']]);
  c.at('2026-10-15 19:40'); assert.ok(api.submitSessionResultFor_('T001', r[1].bookingId, 'COMPLETED', EMAIL.T001).ok);
  assert.strictEqual(c.sp('SP00002').start_source, 'BOOKING', 'chưa khoá');
  // 5J: buổi 14/10 23:30 không còn tự Hoàn thành; 17/10 00:05 (quá 48 giờ, đã báo 24 giờ) thành Không hoàn thành
  c.at('2026-10-16 00:05'); api.hourlyJob();
  assert.strictEqual(c.sp('SP00002').start_source, 'BOOKING', 'chưa khoá khi buổi sớm hơn chưa có kết quả');
  c.at('2026-10-17 00:05'); api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).status, 'NOT_COMPLETED');
  // Soát 5J H1: Không hoàn thành chưa là kết quả cuối, chưa khoá; admin làm rõ (chọn Hoàn thành) mới khoá
  assert.strictEqual(c.sp('SP00002').start_source, 'BOOKING', 'Không hoàn thành: chờ admin, chưa khoá');
  c.at('2026-10-17 09:00');
  api.withLock_(() => api.table_('BOOKINGS').update(api.table_('BOOKINGS').byId(r[0].bookingId), { admin_action: 'Hoàn thành (admin chọn)' }));
  assert.ok(api.handleAdminEdit_('BOOKINGS', 'admin_action', r[0].bookingId, 'Hoàn thành (admin chọn)', EMAIL.ADMIN).ok);
  const sp = c.sp('SP00002');
  assert.strictEqual([sp.start_source, c.keyOf(sp.start_date_locked), sp.start_booking_id].join('|'), 'LOCKED|2026-10-14|' + r[0].bookingId);
});

sc('B21', 'Trial: +3 ngày một lần sau khi khoá, có email; lần bù sau chỉ trả lượt, báo admin còn lượt mà hết ngày', 5, () => {
  const c = mk(), { api } = c;
  [14, 18, 22].forEach(d => c.onlyOpen(K(d, 10), '19:00', ['T001']));
  const r = c.book('S001', [[K(14, 10), '19:00'], [K(18, 10), '19:00']]);
  c.at('2026-10-14 19:40'); api.submitSessionResultFor_('T001', r[0].bookingId, 'COMPLETED', EMAIL.T001);
  c.at('2026-10-18 20:00'); assert.ok(pick5M(c, r[1].bookingId, 'Vắng tutor').ok);
  assert.strictEqual(c.keyOf(c.sp('SP00001').end_date), '2026-10-23');
  assert.strictEqual(c.mailsTo(EMAIL.S001).filter(m => /cộng 3 ngày/.test(m.subject)).length, 1);
  const [x] = c.book('S001', [[K(22, 10), '19:00']]);
  assert.ok(x.ok, JSON.stringify(x));
  c.at('2026-10-22 20:00'); assert.ok(pick5M(c, x.bookingId, 'Vắng tutor').ok);
  assert.strictEqual(c.keyOf(c.sp('SP00001').end_date) + '|' + c.summary('S001')[0].sessionsLeft, '2026-10-23|1');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'TRIAL_LEFT_UNUSED' && n.entity_id === 'SP00001'));
});

sc('B22', 'Huỷ bởi admin: trước 15:00 hôm trước thì trả lượt và lùi ngày bắt đầu; từ 15:00 thì Huỷ muộn: trừ lượt, khoá ngày bắt đầu, không cộng ngày', 5, () => {
  const c = mk();
  c.onlyOpen(K(15, 10), '19:00', ['T001']); c.onlyOpen(K(17, 10), '19:00', ['T001']);
  const r = c.book('S001', [[K(15, 10), '19:00'], [K(17, 10), '19:00']]);
  c.at('2026-10-14 15:00:03');
  assert.ok(pick5M(c, r[0].bookingId, 'Huỷ bởi admin', new Date(2026, 9, 14, 14, 59, 50)).ok);
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).status, 'CANCELLED_ADMIN');
  assert.strictEqual(c.keyOf(c.sp('SP00001').start_date) + '|' + c.summary('S001')[0].sessionsLeft, '2026-10-17|1');
  c.at('2026-10-16 15:00');
  assert.ok(pick5M(c, r[1].bookingId, 'Huỷ bởi admin').ok);
  const sp = c.sp('SP00001');
  assert.strictEqual([c.row('BOOKINGS', r[1].bookingId).status, sp.start_source, c.keyOf(sp.start_date), c.keyOf(sp.end_date), c.summary('S001')[0].sessionsLeft].join('|'), 'CANCELLED_LATE|LOCKED|2026-10-17|2026-10-23|1');
});

sc('B23', 'Buổi kỹ thuật 3 lựa chọn: lỗi tutor (mặc định) bù, không lương; lỗi học viên trừ lượt, có lương; lỗi khách quan bù, có lương', 5, () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b] = c.book('S003', [[K(14, 10), '19:00']]);
  c.at('2026-10-14 19:40'); api.submitSessionResultFor_('T001', b.bookingId, 'TECH_ISSUE', EMAIL.T001);
  const st = () => { const rep = api.computeMonthReport_(2026, 10).tutors.T001; return c.keyOf(c.sp('SP00003').end_date) + '|' + rep.TECH_PAID + '/' + rep.TECH_UNPAID; };
  assert.strictEqual(st(), '2026-11-04|0/1');
  c.at('2026-10-15 09:00');
  pick5M(c, b.bookingId, 'Tính lương buổi kỹ thuật'); assert.strictEqual(st(), '2026-11-03|1/0');
  pick5M(c, b.bookingId, 'Lỗi khách quan: tính lương và bù'); assert.strictEqual(st(), '2026-11-04|1/0');
});

sc('B24', 'Gói vừa hết hạn: buổi trong hạn được bù thì tự mở lại; hết hạn quá 7 ngày thì không tự cộng, báo admin', 5, () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(25, 10), '19:00', ['T001']);
  const [x] = c.book('S007', [[K(25, 10), '19:00']]);
  c.at('2026-10-26 06:00'); api.dailyJob();
  assert.strictEqual(c.sp('SP00007').status, 'EXPIRED');
  c.at('2026-10-26 08:00'); assert.ok(pick5M(c, x.bookingId, 'Vắng tutor').ok);
  assert.strictEqual(c.sp('SP00007').status + '|' + c.keyOf(c.sp('SP00007').end_date), 'ACTIVE|2026-10-27');
  // S006 (20/09 đến 03/10, hết hạn 9 ngày trước 12/10): buổi 03/10 được ghi Vắng tutor
  api.withLock_(() => api.table_('BOOKINGS').insert({ booking_id: 'BK900001', student_id: 'S006', tutor_id: 'T001', sp_id: 'SP00006', date: D(3, 10), slot: '19:00', status: 'COMPLETED', created_at: new Date(2026, 8, 30) }));
  c.at('2026-10-12 10:00'); assert.ok(api.adminMarkTutorAbsent_('BK900001', EMAIL.ADMIN, { confirm: true }).ok);
  assert.strictEqual(c.sp('SP00006').status + '|' + c.keyOf(c.sp('SP00006').end_date), 'EXPIRED|2026-10-03');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'COMP_ON_EXPIRED' && n.entity_id === 'SP00006'));
});

// ═══ C. Đặt lịch và Calendar ═══

sc('C19', 'Hạn 15:00: 14:59:59 được, 15:00:00 bị chặn', 2, () => {
  const c = mk('2026-10-13 14:59:59');
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(14, 10), '19:00']])), ['OK']);
  c.at('2026-10-13 15:00:00');
  assert.deepStrictEqual(c.reasons(c.book('S008', [[K(14, 10), '20:00']])), ['DEADLINE']);
});

sc('C20', 'Không đặt buổi trong ngày', 2, () => {
  const c = mk();
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(12, 10), '21:00']])), ['DEADLINE']);
});

sc('C21', '1 buổi/ngày, server tự kiểm tra', 2, () => {
  const c = mk();
  c.book('S003', [[K(14, 10), '19:00']]);
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(14, 10), '21:00']])), ['ONE_PER_DAY']);
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(15, 10), '19:00'], [K(15, 10), '20:00']])), ['ONE_PER_DAY', 'ONE_PER_DAY']);
});

sc('C22', '23:30 và 08:00 hôm sau là 2 ngày khác nhau', 2, () => {
  const c = mk();
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(14, 10), '23:30'], [K(15, 10), '08:00']])), ['OK', 'OK']);
});

sc('C23', 'Đặt 3 ngày, 1 ngày hết tutor; email gộp; sự kiện có khách mời và Meet', 2, () => {
  const c = mk(), { api, env } = c;
  c.onlyOpen(K(15, 10), '19:00', ['T001']);
  c.book('S008', [[K(15, 10), '19:00']]);
  const callsBefore = env.state.calendarCalls.length;
  const r = c.book('S003', [[K(14, 10), '19:00'], [K(15, 10), '19:00'], [K(16, 10), '19:00']]);
  assert.deepStrictEqual(c.reasons(r), ['OK', 'NO_TUTOR', 'OK']);
  assert.strictEqual(api.REASON_TEXT_VI.NO_TUTOR, 'Slot này hiện không còn Tutor. Vui lòng chọn khung giờ khác.');
  assert.strictEqual(c.mailsTo(EMAIL.S003).length, 1, 'học viên nhận đúng 1 email gộp');
  const inserts = env.state.calendarCalls.slice(callsBefore).filter(x => x.op === 'insert');
  assert.strictEqual(inserts.length, 2);
  [r[0], r[2]].forEach((res, i) => {
    const b = c.row('BOOKINGS', res.bookingId), ins = inserts[i];
    assert.deepStrictEqual(ins.attendees, [EMAIL.S003, EMAIL[b.tutor_id]]);
    assert.strictEqual(ins.sendUpdates, 'all'); assert.strictEqual(ins.conferenceDataVersion, 1);
    assert.strictEqual(ins.calId, 'lessons_staging@group.calendar.google.com');
    assert.strictEqual(ins.res.guestsCanSeeOtherGuests, false, 'phải ẩn danh sách khách mời');
    assert.ok(ins.res.start.dateTime === K(14 + i * 2, 10) + 'T19:00:00+07:00' && ins.res.end.dateTime === K(14 + i * 2, 10) + 'T19:30:00+07:00');
    const text = ins.res.summary + ins.res.description;
    assert.ok(text.indexOf(EMAIL.S003) === -1 && text.indexOf('+8491200000') === -1 && text.indexOf('0912 000') === -1, 'không lộ email, số điện thoại học viên');
    assert.ok(/^https:\/\/meet\.google\.com\//.test(b.meet_link) && b.event_id);
  });
});

sc('C24', 'Hai người tranh slot cuối, chỉ 1 người được', 2, () => {
  const c = mk(), { env } = c;
  c.onlyOpen(K(14, 10), '21:00', ['T003']);
  const a = c.book('S003', [[K(14, 10), '21:00']]), b = c.book('S008', [[K(14, 10), '21:00']]);
  assert.deepStrictEqual(c.reasons(a).concat(c.reasons(b)).sort(), ['NO_TUTOR', 'OK']);
  const at = c.rows('BOOKINGS').filter(x => x.slot === '21:00' && c.keyOf(x.date) === K(14, 10) && x.status === 'CONFIRMED');
  assert.strictEqual(at.length, 1);
  assert.ok(env.state.lockCalls >= 2, 'mỗi lần đặt phải lấy khoá');
});

// C25 đổi ngày 13/10/2026 theo yêu cầu anh Chris: ngẫu nhiên thành xoay vòng (file 01 câu 18 đã cập nhật).
sc('C25', 'Gán xoay vòng trong nhóm ít buổi nhất', 2, () => {
  const c = mk(), { api } = c;
  const t = api.table_('BOOKINGS');
  [['T001', 12, '20:00'], ['T001', 13, '20:00'], ['T001', 15, '20:00'], ['T002', 13, '21:00'], ['T003', 16, '21:00']].forEach((x, i) =>
    t.insert({ booking_id: 'BKX' + i, student_id: 'S00' + (i + 1), tutor_id: x[0], date: D(x[1], 10), slot: x[2], status: 'CONFIRMED' }));
  c.setSlot('T004', K(14, 10), '19:00', 'CANCELLED');
  api.clearDbCache_();
  const cands = api.buildTutorCandidates_(D(14, 10), '19:00', api.activeTutors_(), api.table_('AVAILABILITY').all(), api.table_('BOOKINGS').all(), []);
  assert.deepStrictEqual(cands.map(x => x.tutor_id + ':' + x.load).sort(), ['T001:3', 'T002:1', 'T003:1']);
  // Đặt thật 4 buổi liên tiếp ở các slot cả T002, T003 đều trống: phải chia đều, luân phiên.
  const got = [];
  [[14, '20:00', 'S003'], [14, '21:00', 'S005'], [16, '19:00', 'S007'], [17, '19:00', 'S008']].forEach(([d, s, sid], i) => {
    c.onlyOpen(K(d, 10), s, ['T002', 'T003']);
    c.at('2026-10-12 10:0' + i);
    const r = c.book(sid, [[K(d, 10), s]])[0];
    assert.ok(r.ok, r.reason);
    got.push(c.row('BOOKINGS', r.bookingId).tutor_id);
  });
  assert.strictEqual(got.filter(x => x === 'T002').length, 2, 'chia đều: ' + got.join(','));
  assert.notStrictEqual(got[0], got[1], 'hai buổi liên tiếp không cùng một tutor: ' + got.join(','));
});

sc('C26', 'Ngày tutor chưa mở lịch không đặt được', 2, () => {
  const c = mk(), { api } = c;
  const days = api.availableSlotsFor_('S003', K(19, 10), 7);
  assert.ok(!days.some(d => d.date === K(21, 10)), 'trang không được hiện 21/10');
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(21, 10), '19:00']])), ['NO_TUTOR']);
});

// ═══ D. Huỷ của học viên ═══

sc('D27', 'Huỷ trước hạn: hoàn buổi, huỷ sự kiện, email, slot trống lại', 2, () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T002']);
  const r = c.book('S001', [[K(14, 10), '19:00']]);
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 1);
  const ev = c.row('BOOKINGS', r[0].bookingId).event_id;
  c.at('2026-10-13 14:59');
  assert.ok(api.cancelBookingFor_('S001', r[0].bookingId, EMAIL.S001).ok);
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).status, 'CANCELLED_STUDENT');
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 2);
  assert.ok(c.calls('remove').some(x => x.id === ev && x.sendUpdates === 'all'), 'phải huỷ sự kiện và báo khách mời');
  assert.ok(c.mailsTo(EMAIL.S001).some(m => m.subject.indexOf('Huỷ buổi') === 0));
  assert.ok(c.mailsTo(EMAIL.T002).some(m => m.subject.indexOf('Lesson cancelled') === 0));
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(14, 10), '19:00']])), ['OK'], 'slot phải trống lại');
});

sc('D28', 'Huỷ sau hạn bị chặn', 2, () => {
  const c = mk(), { api } = c;
  const r = c.book('S003', [[K(14, 10), '19:00']]);
  c.at('2026-10-13 15:00');
  assert.strictEqual(api.cancelBookingFor_('S003', r[0].bookingId, EMAIL.S003).reason, 'CANCEL_DEADLINE');
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).status, 'CONFIRMED');
});

sc('D29', 'Huỷ rồi đặt lại cùng ngày theo hạn 15:00', 2, () => {
  const c = mk(), { api } = c;
  const a = c.book('S003', [[K(14, 10), '19:00']]), b = c.book('S008', [[K(15, 10), '19:00']]);
  c.at('2026-10-13 10:00');
  assert.ok(api.cancelBookingFor_('S003', a[0].bookingId, EMAIL.S003).ok);
  assert.ok(api.cancelBookingFor_('S008', b[0].bookingId, EMAIL.S008).ok);
  c.at('2026-10-13 10:05');
  assert.deepStrictEqual(c.reasons(c.book('S003', [[K(14, 10), '21:00']])), ['OK']);
  c.at('2026-10-14 15:30');
  assert.deepStrictEqual(c.reasons(c.book('S008', [[K(15, 10), '19:00']])), ['DEADLINE']);
});

sc('D30', 'Không huỷ được booking của người khác', 3, () => {
  const c = mk(), { api } = c;
  const b8 = c.book('S008', [[K(15, 10), '19:00']])[0].bookingId;
  const tok3 = login(c, 'S003');
  const r = api.apiStudentCancel(tok3, b8);
  assert.strictEqual(r.reason, 'FORBIDDEN');
  assert.strictEqual(c.row('BOOKINGS', b8).status, 'CONFIRMED');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'FORBIDDEN_CANCEL_ATTEMPT' && l.entity_id === b8));
  assert.strictEqual(api.apiStudentCancel('token-gia-mao', b8).reason, 'SESSION_INVALID');
});

// ═══ E. Tutor và lịch rảnh ═══

sc('E31', 'Tutor mở và tắt slot trước hạn (5J: hạn 22:00 thứ Bảy)', 2, () => {
  const c = mk('2026-10-10 14:00', { noAvailability: true }), { api } = c;
  const opens = [];
  for (let i = 0; i < 7; i++) ['19:00', '20:00'].forEach(s => opens.push({ date: K(12 + i, 10), slot: s, open: true }));
  const r = api.setAvailabilityFor_('T001', opens, EMAIL.T001);
  assert.ok(r.every(x => x.ok && x.state === 'OPEN'));
  assert.strictEqual(c.rows('AVAILABILITY').filter(a => a.status === 'OPEN').length, 14);
  const r2 = api.setAvailabilityFor_('T001', [{ date: K(18, 10), slot: '20:00', open: false }], EMAIL.T001);
  assert.strictEqual(r2[0].state, 'CANCELLED');
  assert.strictEqual(c.mailsTo(EMAIL.ADMIN).length, 0, 'trước hạn, chưa có học viên thì không cần admin duyệt');
});

sc('E32', 'Tắt slot sau hạn cần admin duyệt (5J: hạn 22:00 thứ Bảy)', 2, () => {
  const c = mk('2026-10-10 21:00', { noAvailability: true }), { api } = c;
  api.setAvailabilityFor_('T001', [{ date: K(18, 10), slot: '19:00', open: true }], EMAIL.T001);
  c.at('2026-10-10 22:01');
  const r = api.setAvailabilityFor_('T001', [{ date: K(18, 10), slot: '19:00', open: false }], EMAIL.T001);
  assert.strictEqual(r[0].state, 'CANCEL_PENDING');
  assert.ok(c.mailsTo(EMAIL.ADMIN).some(m => m.subject.indexOf('[Duyệt]') === 0));
  const row = c.rows('AVAILABILITY')[0];
  const d = api.decideTutorCancel_(row.avail_id, 'Duyệt', 'admin.karn@gmail.com');
  assert.strictEqual(d.outcome, 'SLOT_CANCELLED');
  assert.strictEqual(c.row('AVAILABILITY', row.avail_id).status, 'CANCELLED');
});

function prepT001Booking(c, sid, dk, slot) {
  c.onlyOpen(dk, slot, ['T001']);
  const r = c.book(sid, [[dk, slot]]);
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).tutor_id, 'T001');
  return r[0].bookingId;
}

sc('E33', 'Duyệt huỷ có người thay: đổi tutor, giữ Meet, đổi khách mời', 2, () => {
  const c = mk(), { api } = c;
  const id = prepT001Booking(c, 'S003', K(16, 10), '20:00');
  const before = c.row('BOOKINGS', id);
  c.setSlot('T002', K(16, 10), '20:00', 'OPEN');
  const r = api.setAvailabilityFor_('T001', [{ date: K(16, 10), slot: '20:00', open: false }], EMAIL.T001);
  assert.strictEqual(r[0].state, 'CANCEL_PENDING');
  const av = c.rows('AVAILABILITY').find(a => a.tutor_id === 'T001' && c.keyOf(a.date) === K(16, 10) && a.slot === '20:00');
  const d = api.decideTutorCancel_(av.avail_id, 'Duyệt', 'admin.karn@gmail.com');
  assert.strictEqual(d.outcome, 'REASSIGNED');
  const after = c.row('BOOKINGS', id);
  assert.strictEqual(after.status + '|' + after.tutor_id, 'CONFIRMED|T002');
  assert.strictEqual(after.meet_link, before.meet_link, 'giữ nguyên link Meet');
  // Từ 5B, mỗi sự kiện có thêm lần patch thêm admin làm khách (không gửi thư); lần đổi tutor là lần gửi thư cho mọi người.
  const p = c.calls('patch').find(x => x.id === before.event_id && x.sendUpdates === 'all');
  assert.ok(p); assert.deepStrictEqual(p.attendees.filter(e => e !== EMAIL.ADMIN && e !== 'admin.karn@gmail.com'), [EMAIL.S003, EMAIL.T002]);   // bỏ khách admin (thêm không gửi thư, chunk 5B, 5E)
  assert.ok(c.mailsTo(EMAIL.S003).some(m => m.subject.indexOf('Đổi tutor') === 0));
  assert.ok(c.mailsTo(EMAIL.T001).some(m => m.subject.indexOf('Cancellation approved') === 0));
  assert.ok(c.mailsTo(EMAIL.T002).some(m => m.subject.indexOf('New lesson') === 0));
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'REASSIGNED' && l.entity_id === id));
});

sc('E34', 'Duyệt huỷ không người thay: huỷ bởi tutor, hoàn Trial', 2, () => {
  const c = mk(), { api } = c;
  const id = prepT001Booking(c, 'S001', K(16, 10), '20:00');
  const ev = c.row('BOOKINGS', id).event_id;
  api.setAvailabilityFor_('T001', [{ date: K(16, 10), slot: '20:00', open: false }], EMAIL.T001);
  const av = c.rows('AVAILABILITY').find(a => a.tutor_id === 'T001' && c.keyOf(a.date) === K(16, 10) && a.slot === '20:00');
  assert.strictEqual(api.decideTutorCancel_(av.avail_id, 'Duyệt', 'admin.karn@gmail.com').outcome, 'CANCELLED_TUTOR');
  assert.strictEqual(c.row('BOOKINGS', id).status, 'CANCELLED_TUTOR');
  assert.ok(c.calls('remove').some(x => x.id === ev));
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 2, 'hoàn buổi Trial');
  assert.ok(c.mailsTo(EMAIL.S001).some(m => m.subject.indexOf('Huỷ buổi') === 0 && m.htmlBody.indexOf('Đặt lại') !== -1));
});

sc('E35', 'Admin không duyệt kịp: tự từ chối, tutor vẫn dạy', 2, () => {
  const c = mk(), { api } = c;
  const r = c.book('S003', [[K(15, 10), '19:00']]);
  const tid = c.row('BOOKINGS', r[0].bookingId).tutor_id;
  c.at('2026-10-15 10:00');
  assert.strictEqual(api.setAvailabilityFor_(tid, [{ date: K(15, 10), slot: '19:00', open: false }], EMAIL[tid])[0].state, 'CANCEL_PENDING');
  c.at('2026-10-15 16:00');
  assert.strictEqual(api.hourlyJob().rejected, 1);
  const av = c.rows('AVAILABILITY').find(a => a.tutor_id === tid && c.keyOf(a.date) === K(15, 10) && a.slot === '19:00');
  assert.strictEqual(av.status + '|' + av.admin_decision + '|' + av.decided_by, 'OPEN|Từ chối|SYSTEM');
  assert.ok(c.mailsTo(EMAIL[tid]).some(m => m.subject.indexOf('Not approved') === 0));
  const b = c.row('BOOKINGS', r[0].bookingId);
  assert.strictEqual(b.status + '|' + b.tutor_id, 'CONFIRMED|' + tid);
});

sc('E36', 'Tutor thêm slot sau hạn, học viên đặt được', 2, () => {
  const c = mk('2026-10-13 18:00'), { api } = c;
  assert.strictEqual(api.setAvailabilityFor_('T003', [{ date: K(15, 10), slot: '22:00', open: true }], EMAIL.T003)[0].state, 'OPEN');
  c.at('2026-10-13 18:05');
  const r = c.book('S003', [[K(15, 10), '22:00']]);
  assert.deepStrictEqual(c.reasons(r), ['OK']); assert.strictEqual(r[0].tutorName, 'Lan');
});

sc('E37', 'Tutor không xem được lịch tutor khác và thông tin riêng học viên', 3, () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001']); c.book('S003', [[K(14, 10), '19:00']]);
  c.onlyOpen(K(15, 10), '19:00', ['T002']); const other = c.book('S008', [[K(15, 10), '19:00']])[0].bookingId;
  const tok1 = login(c, 'T001');
  const home = api.apiTutorHome(tok1, { tutorId: 'T002' });
  const items = home.data.schedule.upcoming.concat(home.data.schedule.toConfirm);
  assert.strictEqual(items.length, 1, 'chỉ thấy buổi của chính mình');
  assert.ok(items.every(i => i.bookingId !== other));
  assert.deepStrictEqual(Object.keys(items[0].student).sort(), ['level', 'name', 'note']);
  assert.ok(JSON.stringify(home).indexOf(EMAIL.S003) === -1 && JSON.stringify(home).indexOf('+8491200000') === -1, 'không lộ email, số điện thoại học viên');
  assert.strictEqual(api.apiStudentHome(tok1).reason, 'FORBIDDEN', 'tutor không gọi được hàm của học viên');
  c.at('2026-10-15 19:40');
  assert.strictEqual(api.apiTutorSubmitResult(tok1, other, 'COMPLETED').reason, 'FORBIDDEN');
});

// ═══ F. Sau buổi học và vận hành ═══

sc('F38', 'Tutor xác nhận 3 kết quả; buổi kỹ thuật hoàn Trial, không tính lương', 2, () => {
  const c = mk(), { api } = c;
  c.setSlot('T001', K(14, 10), '12:00', 'OPEN');
  const a = prepT001Booking(c, 'S003', K(14, 10), '08:00');
  const b = prepT001Booking(c, 'S008', K(14, 10), '12:00');
  const t = prepT001Booking(c, 'S001', K(14, 10), '19:00');
  const future = prepT001Booking(c, 'S007', K(14, 10), '21:00');
  c.at('2026-10-14 19:40');
  assert.ok(api.submitSessionResultFor_('T001', a, 'COMPLETED', EMAIL.T001).ok);
  assert.ok(api.submitSessionResultFor_('T001', b, 'STUDENT_ABSENT', EMAIL.T001).ok);
  assert.ok(api.submitSessionResultFor_('T001', t, 'TECH_ISSUE', EMAIL.T001).ok);
  assert.strictEqual(api.submitSessionResultFor_('T001', future, 'COMPLETED', EMAIL.T001).reason, 'TOO_EARLY');
  assert.deepStrictEqual([a, b, t].map(id => c.row('BOOKINGS', id).status), ['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE']);
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 2, 'buổi kỹ thuật hoàn buổi Trial');
  const tb = c.row('BOOKINGS', t);
  assert.ok(api.cfgList_('PAYROLL_STATUSES').indexOf(tb.status) === -1 && tb.payroll_override !== true, 'buổi kỹ thuật không tính lương');
});

sc('F39', '5J (câu 29 đổi 01/11): quá 24 giờ chưa chọn kết quả thì báo đỏ (không tự Hoàn thành); quá 48 giờ và đã báo 24 giờ thì Không hoàn thành, không lương', 5, () => {
  const c = mk(), { api } = c;
  const r = c.book('S003', [[K(14, 10), '19:00']]);
  c.at('2026-10-15 19:29'); api.hourlyJob();
  assert.ok(!c.row('BOOKINGS', r[0].bookingId).result_notice_at, 'chưa đủ 24 giờ');
  c.at('2026-10-15 19:31'); api.hourlyJob();
  let b = c.row('BOOKINGS', r[0].bookingId);
  assert.strictEqual(b.status, 'CONFIRMED', 'không tự Hoàn thành');
  assert.ok(b.result_notice_at instanceof Date);
  const n = c.rows('NOTIFICATIONS').filter(x => x.event === 'RESULT_OVERDUE' && x.entity_id === r[0].bookingId);
  assert.strictEqual(n.length + '|' + n[0].level, '1|CRITICAL', 'báo đỏ trên trang quản trị');
  c.at('2026-10-15 20:31'); api.hourlyJob();
  assert.strictEqual(c.rows('NOTIFICATIONS').filter(x => x.event === 'RESULT_OVERDUE').length, 1, 'không báo lặp');
  const tok = api.apiExchangeToken(api.withLock_(() => api.createLoginLinkInLock_(api.userById_(b.tutor_id))).match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const item = api.apiTutorHome(tok).data.schedule.toConfirm.find(x => x.bookingId === r[0].bookingId);
  assert.ok(item.overdue && item.expireAt === '16/10/2026 19:31', 'trang tutor tô đỏ, ghi giờ sẽ thành Không hoàn thành: ' + JSON.stringify(item));
  c.at('2026-10-16 19:29'); api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).status, 'CONFIRMED', 'chưa đủ 48 giờ');
  c.at('2026-10-16 19:32'); api.hourlyJob();
  b = c.row('BOOKINGS', r[0].bookingId);
  assert.strictEqual(b.status + '|' + b.result_by, 'NOT_COMPLETED|SYSTEM');
  assert.ok(c.rows('NOTIFICATIONS').some(x => x.event === 'RESULT_NOT_COMPLETED' && x.entity_id.indexOf(r[0].bookingId) !== -1));
  const rep = api.computeMonthReport_(2026, 10).tutors[b.tutor_id];
  assert.strictEqual(rep.NOT_COMPLETED + '|' + rep.COMPLETED, '1|0', 'không tính lương');
  c.at('2026-10-16 21:05'); api.hourlyJob();
  const dg = c.mailsTo(EMAIL.ADMIN).filter(m => m.subject.indexOf('[Tổng hợp') === 0);
  assert.ok(dg.length === 1 && dg[0].htmlBody.indexOf(r[0].bookingId) !== -1, 'Không hoàn thành vào email tổng hợp 21:00');
  // Admin sửa: đã học thật thì chọn Hoàn thành (admin chọn): tính lương
  c.at('2026-10-17 09:00');
  api.withLock_(() => api.table_('BOOKINGS').update(api.table_('BOOKINGS').byId(b.booking_id), { admin_action: 'Hoàn thành (admin chọn)' }));
  assert.ok(api.handleAdminEdit_('BOOKINGS', 'admin_action', b.booking_id, 'Hoàn thành (admin chọn)', EMAIL.ADMIN).ok);
  assert.strictEqual(c.row('BOOKINGS', b.booking_id).status, 'COMPLETED');
});

sc('F40', 'Admin huỷ, đổi tutor, vắng tutor; báo cáo tháng; backup giữ 30 bản', 3, () => {
  const c = mk(), { api, env } = c;
  const ADMIN = 'admin.karn@gmail.com';
  // Chuẩn bị tháng 10: buổi Trial của S001 với T001, các buổi có kết quả để đối chiếu báo cáo
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  const trial = c.book('S001', [[K(14, 10), '19:00']])[0].bookingId;
  const tb = api.table_('BOOKINGS');
  const prep = [['T001', 13, 'COMPLETED'], ['T001', 16, 'COMPLETED'], ['T002', 16, 'STUDENT_ABSENT'], ['T002', 17, 'TECH_ISSUE'], ['T003', 17, 'CANCELLED_STUDENT']];
  prep.forEach((x, i) => tb.insert({ booking_id: 'BKR' + i, student_id: 'S005', tutor_id: x[0], date: D(x[1], 10), slot: '08:00', status: x[2] }));
  const reg = api.submitRegistration_(c.form());
  api.approveRegistration_(reg.regId, ADMIN);
  ['T001', 'T002'].forEach(t => { c.setSlot(t, K(2, 11), '19:00', 'OPEN'); c.setSlot(t, K(2, 11), '20:00', 'OPEN'); });
  c.onlyOpen(K(2, 11), '19:00', ['T001']); const toCancel = c.book('S003', [[K(2, 11), '19:00']])[0].bookingId;
  c.onlyOpen(K(2, 11), '20:00', ['T001']); const toMove = c.book('S008', [[K(2, 11), '20:00']])[0].bookingId;
  c.setSlot('T002', K(2, 11), '20:00', 'OPEN');
  c.at('2026-11-01 09:00');
  const evCancel = c.row('BOOKINGS', toCancel).event_id, evMove = c.row('BOOKINGS', toMove).event_id;
  // Như admin chọn dropdown thật: ô admin_action đã mang giá trị khi trigger onEdit chạy.
  const pick = (id, v) => { api.withLock_(() => api.table_('BOOKINGS').update(api.table_('BOOKINGS').byId(id), { admin_action: v })); return api.handleAdminEdit_('BOOKINGS', 'admin_action', id, v, ADMIN); };
  assert.ok(pick(toCancel, 'Huỷ bởi admin').ok);
  assert.ok(pick(toMove, 'Đổi tutor').ok);
  assert.ok(pick(trial, 'Vắng tutor').ok);
  assert.strictEqual(api.handleAdminEdit_('BOOKINGS', 'admin_action', toMove, 'Đổi tutor', ADMIN), null, 'trigger chạy lần 2 cho cùng lần chọn: bỏ qua');
  assert.strictEqual(c.row('BOOKINGS', toCancel).status, 'CANCELLED_ADMIN');
  assert.ok(c.calls('remove').some(x => x.id === evCancel));
  assert.ok(c.mailsTo(EMAIL.S003).some(m => m.subject.indexOf('Huỷ buổi') === 0));
  const moved = c.row('BOOKINGS', toMove);
  assert.strictEqual(moved.tutor_id + '|' + moved.status, 'T002|CONFIRMED');
  assert.ok(c.calls('patch').some(x => x.id === evMove));
  assert.ok(c.mailsTo(EMAIL.S008).some(m => m.subject.indexOf('Đổi tutor') === 0));
  assert.ok(/^Đã: Đổi tutor/.test(moved.admin_note) && moved.admin_action === '');
  const log = c.rows('ACTIVITY_LOG');
  ['CANCELLED', 'REASSIGNED', 'TUTOR_ABSENT'].forEach(a => assert.ok(log.some(l => l.action === a && l.actor === ADMIN), 'log ' + a + ' phải ghi email admin'));
  assert.strictEqual(c.row('BOOKINGS', trial).status, 'TUTOR_ABSENT');
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 2, 'vắng tutor hoàn buổi Trial');
  // Báo cáo tháng 10, đối chiếu với số đếm tay
  const rep = api.refreshReportMonth_(2026, 10);
  assert.strictEqual(rep.tutors.T001.COMPLETED + '|' + rep.tutors.T001.payable, '2|2');
  assert.strictEqual(rep.tutors.T002.STUDENT_ABSENT + '|' + rep.tutors.T002.TECH_UNPAID + '|' + rep.tutors.T002.payable, '1|1|1');
  assert.strictEqual(rep.tutors.T001.TUTOR_ABSENT, 1);
  assert.strictEqual(rep.tutors.T003.payable, 0);
  assert.strictEqual(rep.revenueTotal, 1790000); assert.strictEqual(rep.paymentCount, 1);
  const sheet = env.state.spreadsheets.DB_STAGING_TEST.sheets.REPORT_MONTH.values;
  assert.ok(sheet[0][0] === 'BÁO CÁO THÁNG 10/2026' && sheet.some(r => r[0] === 'TỔNG' && r[2] === 1790000));
  // Backup 31 đêm
  for (let i = 0; i < 31; i++) { c.at('2026-11-' + String(1 + i % 28).padStart(2, '0') + ' 02:00'); api.nightlyBackup(); }
  const kept = Object.values(env.state.drive.files).filter(f => f.parent === 'FOLDER_BACKUP' && !f.trashed);
  assert.strictEqual(kept.length, 30);
});

function run() {
  return S.map(s => {
    if (!s.run) return { id: s.id, title: s.title, chunk: s.chunk, status: 'PENDING' };
    try { s.run(); return { id: s.id, title: s.title, chunk: s.chunk, status: 'PASS' }; }
    catch (e) { return { id: s.id, title: s.title, chunk: s.chunk, status: 'FAIL', note: e.message }; }
  });
}

module.exports = { run, S, mk, K, EMAIL };
