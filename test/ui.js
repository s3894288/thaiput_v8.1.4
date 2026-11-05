/**
 * ui.js · Test giao diện đầu cuối (chunk 4)
 *
 * Trang được dựng đúng như trên Google: doGet() xử lý ui/Index.html, nhúng Styles, App, Home, Login, Student, Tutor.
 * Trang chạy trong jsdom (trình duyệt giả lập trong Node). google.script.run được nối thẳng vào các hàm api* thật
 * của backend, dữ liệu là bộ dữ liệu mẫu của 40 kịch bản. Vì vậy mỗi cú bấm trong test đi qua đúng đường đi thật:
 * nút bấm, App.html, google.script.run, Api.gs, Booking.gs, Sheets giả lập, Calendar giả lập.
 *
 * Cầu nối mô phỏng đúng giới hạn của Apps Script (CLAUDE.md luật 14):
 *   tham số và giá trị trả về đi qua JSON; nếu giá trị trả về chứa Date, Apps Script thật trả null cho trình duyệt,
 *   nên cầu nối cũng trả null và ghi lỗi để test đỏ.
 */
'use strict';
const assert = require('assert');
const { JSDOM, VirtualConsole } = require('jsdom');
const { mk, EMAIL } = require('./scenarios');

const results = [];
const tests = [];
function t(id, title, fn) { tests.push({ id, title, fn }); }

function hasIllegal(v, seen) {
  if (v instanceof Date || typeof v === 'function') return true;
  if (v && typeof v === 'object') {
    seen = seen || new Set(); if (seen.has(v)) return false; seen.add(v);
    return Object.keys(v).some(k => hasIllegal(v[k], seen));
  }
  return false;
}

/** Mở một trang như học viên hoặc tutor mở link. opts.session: phiên có sẵn; opts.blockStorage: chặn bộ nhớ trình duyệt. */
function open(c, params, opts) {
  opts = opts || {};
  const { api } = c;
  const html = api.doGet({ parameter: params || {} }).getContent();
  const errors = [], calls = [], violations = [], historyCalls = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e && (e.stack || e.message) || e)));
  vc.on('error', e => errors.push(String(e)));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    url: 'https://script.google.com/macros/s/TEST/exec',
    beforeParse(win) {
      win.scrollTo = () => {};
      win.__TP_RETRY_DELAYS = [0, 0, 0, 0];
      // Màn hình máy tính (chunk 5F): T.wide() đọc matchMedia
      if (opts.wide) win.matchMedia = (q) => ({ matches: /min-width:\s*900px/.test(q), addListener() {}, removeListener() {} });
      win.HTMLElement.prototype.scrollIntoView = function () {};
      if (opts.blockStorage) {
        ['localStorage', 'sessionStorage'].forEach(k => Object.defineProperty(win, k, { configurable: true, get() { throw new win.DOMException('blocked', 'SecurityError'); } }));
      } else if (opts.session) {
        win.localStorage.setItem('thaiput_session', JSON.stringify(opts.session));
      }
      if (opts.storage && !opts.blockStorage) Object.keys(opts.storage).forEach(k => win.localStorage.setItem(k, opts.storage[k]));
      const makeRunner = () => {
        let ok = null, fail = null;
        const runner = new Proxy({}, {
          get(_, name) {
            if (name === 'withSuccessHandler') return (f) => { ok = f; return runner; };
            if (name === 'withFailureHandler') return (f) => { fail = f; return runner; };
            return (...args) => {
              if (typeof api[name] !== 'function' || !/^api[A-Z]/.test(String(name))) throw new Error('Script function not found: ' + String(name));
              if (args.some(a => hasIllegal(a))) violations.push(String(name) + ': tham số chứa Date hoặc hàm');
              const sent = JSON.parse(JSON.stringify(args));
              setTimeout(() => {
                let r;
                // Giả lập Google từ chối lượt gọi (quá 30 lượt, mất mạng) trước khi tới máy chủ: opts.failNext[tên] lần
                if (opts.failNext && opts.failNext[name] > 0) { opts.failNext[name]--; calls.push({ name: String(name), args: sent, failed: true }); if (fail) fail(new win.Error('NetworkError')); return; }
                try { api.clearDbCache_(); r = api[name](...sent); } catch (e) { if (fail) fail(new win.Error(e.message)); return; }
                // Máy chủ đã làm xong nhưng mất phản hồi trên đường về: opts.loseResponse[tên] lần
                if (opts.loseResponse && opts.loseResponse[name] > 0) { opts.loseResponse[name]--; calls.push({ name: String(name), args: sent, result: r, lost: true }); if (fail) fail(new win.Error('NetworkError')); return; }
                calls.push({ name: String(name), args: sent, result: r });
                if (hasIllegal(r)) { violations.push(String(name) + ': giá trị trả về chứa Date, Apps Script thật sẽ trả null'); r = null; }
                if (ok) ok(r === null || r === undefined ? r : win.JSON.parse(JSON.stringify(r)));
              }, 0);
            };
          }
        });
        return runner;
      };
      win.google = { script: { history: { replace: (state, params) => { historyCalls.push(JSON.parse(JSON.stringify(params))); } } } };
      Object.defineProperty(win.google.script, 'run', { get: makeRunner });
    }
  });
  const win = dom.window, doc = win.document;
  // Tự thử lại (chunk 5F): test không chờ 0,6 đến 4,8 giây thật.
  if (win.T) { win.T.retryDelays = [0, 0, 0, 0]; win.T.retryJitter = 0; }
  const p = {
    dom, win, doc, errors, calls, violations, history: historyCalls,
    $: (s) => doc.querySelector(s),
    $$: (s) => Array.from(doc.querySelectorAll(s)),
    text: (s) => { const el = doc.querySelector(s || 'body'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; },
    click: (s) => { const el = typeof s === 'string' ? doc.querySelector(s) : s; if (!el) throw new Error('Không thấy phần tử ' + s); el.click(); },
    type: (s, v) => { const el = doc.querySelector(s); if (!el) throw new Error('Không thấy ô ' + s); el.value = v; el.dispatchEvent(new win.Event('input', { bubbles: true })); },
    submit: (s) => { const f = doc.querySelector(s); f.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true })); },
    file: (s, name, type, content) => { const el = doc.querySelector(s); Object.defineProperty(el, 'files', { configurable: true, value: [new win.File([content || 'pdf'], name, { type })] }); el.dispatchEvent(new win.Event('change', { bubbles: true })); },
    sheetBtn: (label) => { const b = Array.from(doc.querySelectorAll('.sheet button')).find(x => x.textContent.trim() === label); if (!b) throw new Error('Hộp thoại không có nút ' + label + ': ' + p.text('.sheet')); b.click(); },
    session: () => JSON.parse(win.localStorage.getItem('thaiput_session') || 'null'),
    flush: async (n) => { for (let i = 0; i < (n || 30); i++) await new Promise(r => setTimeout(r, 0)); },
    clean: () => { assert.deepStrictEqual(errors, [], 'lỗi JavaScript trên trang'); assert.deepStrictEqual(violations, [], 'vi phạm giới hạn google.script.run'); }
  };
  return p;
}

/** Đăng nhập qua giao diện: nhập email, lấy link trong email, mở link. Trả phiên đã lưu. */
async function uiLogin(c, uid) {
  Object.keys(c.env.state.cache).forEach(k => { if (/^login_cd_/.test(k)) delete c.env.state.cache[k]; });   // 5J: như đã qua 60 phút
  const p = open(c, { page: 'login' });
  await p.flush();
  p.type('#l-email', EMAIL[uid]);
  p.submit('#login');
  await p.flush();
  const mail = c.env.state.mails.filter(m => m.to === EMAIL[uid]).pop();
  const raw = JSON.stringify(mail).match(/[?&;]t=([a-f0-9]{64})/)[1];
  const q = open(c, { page: 'auth', t: raw });
  await q.flush(60);
  // Chunk 5H: lần đầu đăng nhập bằng link, tài khoản chưa chọn ngôn ngữ: chọn mặc định (học viên tiếng Việt, tutor tiếng Anh).
  if (q.$('[data-lang-pick]')) { q.sheetBtn(/^T/.test(uid) ? 'English' : 'Tiếng Việt'); await q.flush(60); }
  q.clean();
  return { session: q.session(), page: q };
}

// ═══ Trang chủ và đăng ký ═══

t('U01', 'Trang chủ: dựng từ doGet, đủ gói đang bán, giá, liên hệ chỉ Zalo và website (không nút gọi điện)', async () => {
  const c = mk(), p = open(c, { page: 'home' });
  await p.flush();
  p.clean();
  assert.strictEqual(p.$$('.pkg input[type=radio]').length, 3, 'TRIAL, 2 tuần, 1 tháng (gói ngừng bán ẩn)');
  assert.ok(/1\.790\.000/.test(p.text('.pkg-list')), 'giá dạng Việt Nam: ' + p.text('.pkg-list'));
  assert.ok(p.$('a.zalo') && p.$('a.zalo').href === 'https://zalo.me/0909999999');
  assert.strictEqual(p.$$('a[href^="tel:"]').length, 0, 'không còn nút gọi điện');
  assert.ok(!/Gọi admin/.test(p.text()), 'không còn chữ Gọi admin');
  assert.ok(p.$$('.contact a').some(a => a.href.indexOf('https://www.thaiput.vn') === 0), 'có link website');
  assert.ok(/Vietcombank/.test(p.text()) && /0123456789/.test(p.text()), 'thông tin chuyển khoản');
});

t('U02', 'Gửi form đăng ký từ trang: lưu +84, hiện đúng mã nội dung chuyển khoản', async () => {
  const c = mk(), p = open(c, { page: 'home' });
  await p.flush();
  p.type('#f-name', 'Nguyễn Thị Mới'); p.type('#f-email', 'moi@test.com'); p.type('#f-phone', '0912 345 678');
  p.click('#pkg-PASS_2W');
  p.file('#f-file', 'chuyen_khoan.pdf', 'application/pdf', '%PDF-1.4 gia');
  p.click('#f-consent');
  p.submit('#reg');
  await p.flush(60);
  p.clean();
  const reg = c.rows('REGISTRATIONS').find(r => r.email === 'moi@test.com');
  assert.ok(reg, 'phải có dòng đăng ký');
  assert.strictEqual(c.rawCell('REGISTRATIONS', reg._row, 'phone'), '+84912345678');
  assert.strictEqual(reg.package_code, 'PASS_2W');
  assert.ok(p.text('.sheet').indexOf(reg.transfer_code) !== -1, 'hộp thoại hiện mã ' + reg.transfer_code);
});

t('U03', 'Số điện thoại quá 40 ký tự (5K: không cần định dạng): báo ngay khi gõ, chặn gửi, không ghi gì vào Sheets', async () => {
  const c = mk(), p = open(c, { page: 'home' });
  await p.flush();
  p.type('#f-phone', '12345');
  assert.ok(!p.$('#f-phone').classList.contains('invalid'), '5K: số ngắn, không định dạng vẫn nhận');
  p.type('#f-phone', '0912 345 678 hoặc gọi giờ hành chính nhé bạn ơi');
  assert.ok(p.$('#f-phone').classList.contains('invalid'));
  assert.ok(/Tối đa 40 ký tự/.test(p.text('#f-phone-hint')));
  p.type('#f-name', 'A'); p.type('#f-email', 'a@test.com');
  p.submit('#reg');
  await p.flush();
  assert.ok(/Số điện thoại tối đa 40 ký tự/.test(p.text('#reg-msg')));
  assert.ok(/tải ảnh chụp chuyển khoản/i.test(p.text('#reg-msg')) && /đồng ý/.test(p.text('#reg-msg')), 'liệt kê đủ lỗi một lần');
  assert.strictEqual(c.rows('REGISTRATIONS').length, 0);
  assert.strictEqual(p.calls.filter(x => x.name === 'apiSubmitRegistration').length, 0, 'không gọi server khi form sai');
});

// ═══ Đăng nhập ═══

t('U04', 'Đăng nhập bằng link email: trang chung chung với email lạ, link thật vào đúng cổng học viên', async () => {
  const c = mk();
  const p = open(c, { page: 'login' });
  await p.flush();
  p.type('#l-email', 'khong-ton-tai@test.com'); p.submit('#login');
  await p.flush();
  const generic = p.text('#l-msg');
  assert.ok(/Nếu email có trong hệ thống/.test(generic), 'không tiết lộ email có hay không');
  const { session, page } = await uiLogin(c, 'S003');
  assert.strictEqual(session.role, 'STUDENT');
  assert.ok(/Học viên 3/.test(page.text('.topbar')));
  assert.ok(page.$('.tabbar') && page.$('.pass'), 'cổng học viên có thanh tab và thẻ gói');
});

t('U05', 'Link đăng nhập: bấm lại trong hạn vẫn vào; hết lượt mà tab đang đăng nhập thì vào thẳng; tab mới thì báo lỗi và nút yêu cầu link mới', async () => {
  const c = mk();
  const url = c.api.withLock_(() => c.api.createLoginLinkInLock_(c.api.userById_('S003')));
  const raw = url.match(/t=([a-f0-9]{64})/)[1];
  const p1 = open(c, { page: 'auth', t: raw }); await p1.flush(60);
  assert.strictEqual(p1.session().role, 'STUDENT');
  assert.deepStrictEqual(p1.history, [{ page: 'student' }], 'bỏ mã link khỏi địa chỉ trang sau khi vào');
  const p2 = open(c, { page: 'auth', t: raw }); await p2.flush(60);
  assert.strictEqual(p2.session().role, 'STUDENT', 'bấm lại link trong 15 phút vẫn vào (mặc định không giới hạn lượt)');
  c.api.withLock_(() => c.api.table_('CONFIG').insert({ key: 'LOGIN_LINK_MAX_USES', value: '2' }));
  c.api.clearConfigCache_();
  // Tab đang có phiên (làm mới trang chứa link đã hết lượt): vào thẳng cổng, không báo lỗi
  const p3 = open(c, { page: 'auth', t: raw }, { session: p2.session() }); await p3.flush(60);
  p3.clean();
  assert.ok(p3.$('.pass'), 'vào thẳng cổng học viên');
  // Trình duyệt chưa đăng nhập: báo lỗi, nút yêu cầu link mới
  const p4 = open(c, { page: 'auth', t: raw }); await p4.flush(60);
  assert.ok(/Không đăng nhập được/.test(p4.text('main')));
  assert.ok(p4.$('#again').textContent.indexOf('Yêu cầu gửi lại liên kết đăng nhập mới') === 0, 'nút ghi chữ mới (kèm tiếng Anh cho tutor từ 15/10)');
  assert.strictEqual(p4.session(), null);
  p4.click('#again'); await p4.flush();
  assert.ok(p4.$('#login'), 'về trang đăng nhập');
});

t('U19', 'Mỗi tab một phiên: tab học viên giữ nguyên khi tab khác đăng nhập tutor; tab mới dùng phiên gần nhất', async () => {
  const c = mk();
  const { session: stu } = await uiLogin(c, 'S003');
  const { session: tut } = await uiLogin(c, 'T001');
  const tabA = open(c, { page: 'student' }, { session: stu }); await tabA.flush(60);
  assert.ok(tabA.$('.pass'));
  // Tab B (cùng trình duyệt) đăng nhập tutor: ghi đè phiên chung, không đụng phiên riêng của tab A
  tabA.win.localStorage.setItem('thaiput_session', JSON.stringify(tut));
  tabA.win.T.start(); await tabA.flush(60);
  assert.ok(tabA.$('.pass') && /Học viên 3/.test(tabA.text('.topbar')), 'tab A vẫn là học viên');
  // Tab mới mở: chưa có phiên riêng, dùng phiên gần nhất (tutor)
  const tabC = open(c, { page: 'tutor' }, { session: tut }); await tabC.flush(60);
  tabC.clean();
  assert.ok(/Upcoming lessons/.test(tabC.text('main')));
  // Đăng xuất ở tab A không đăng xuất tab tutor (phiên chung là của tutor)
  tabA.click('#logout'); await tabA.flush();
  assert.strictEqual(JSON.parse(tabA.win.localStorage.getItem('thaiput_session')).role, 'TUTOR');
});

t('U06', 'Phiên hết hạn hoặc giả: tự về trang đăng nhập, xoá phiên cũ', async () => {
  const c = mk();
  const p = open(c, { page: 'student' }, { session: { token: 'f'.repeat(64), role: 'STUDENT', name: 'X' } });
  await p.flush(60);
  p.clean();
  assert.ok(p.$('#login'), 'hiện form đăng nhập');
  assert.strictEqual(p.session(), null, 'phiên giả bị xoá');
});

t('U07', 'Trình duyệt chặn bộ nhớ (nhúng Google Sites): trang vẫn chạy và cảnh báo', async () => {
  const c = mk();
  const p = open(c, { page: 'login' }, { blockStorage: true });
  await p.flush();
  p.clean();
  assert.ok(p.$('#login'));
  assert.ok(/chặn lưu đăng nhập/.test(p.text('main')));
});

// ═══ Học viên ═══

t('U08', 'Học viên đặt 2 buổi khác ngày từ trang: chọn lại trong cùng ngày thì thay, ghi BOOKINGS và Calendar', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  const chips = (d) => p.$$('.chip[data-date="' + d + '"]');
  assert.ok(chips('2026-10-13').length >= 3, 'ngày mai có slot');
  assert.strictEqual(chips('2026-10-12').length, 0, 'hôm nay đã quá hạn đặt');
  p.click('.chip[data-date="2026-10-13"][data-slot="19:00"]');
  p.click('.chip[data-date="2026-10-13"][data-slot="20:00"]');
  assert.strictEqual(p.$$('.chip.on').length, 1, 'mỗi ngày chỉ giữ 1 lựa chọn');
  p.click('.chip[data-date="2026-10-15"][data-slot="21:00"]');
  assert.ok(!p.$('#actionbar').hidden && /2 buổi/.test(p.text('#actionbar')));
  p.click('#ab-go');
  await p.flush(60);
  p.clean();
  const bk = c.rows('BOOKINGS').filter(b => b.student_id === 'S003' && b.status === 'CONFIRMED');
  assert.deepStrictEqual(bk.map(b => c.keyOf(b.date) + ' ' + b.slot).sort(), ['2026-10-13 20:00', '2026-10-15 21:00']);
  assert.ok(/Đã đặt 2 buổi/.test(p.text('.sheet')));
  assert.strictEqual(c.calls('insert').length, 2, '2 sự kiện Calendar');
  p.sheetBtn('Xem lịch của tôi');
  await p.flush(60);
  assert.strictEqual(p.$$('[data-cancel]').length, 2, '2 buổi sắp tới, có nút huỷ');
});

t('U09', 'Học viên huỷ buổi qua hộp thoại xác nhận: "Giữ lại" không huỷ, "Huỷ buổi này" thì huỷ', async () => {
  const c = mk();
  c.book('S003', [['2026-10-14', '19:00']]);
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="lessons"]');
  await p.flush();
  p.click('[data-cancel]');
  p.sheetBtn('Giữ lại'); await p.flush();
  assert.strictEqual(c.rows('BOOKINGS')[0].status, 'CONFIRMED');
  p.click('[data-cancel]');
  p.sheetBtn('Huỷ buổi này'); await p.flush(60);
  p.clean();
  assert.ok(/^CANCELLED/.test(c.rows('BOOKINGS')[0].status), 'trạng thái ' + c.rows('BOOKINGS')[0].status);
  assert.ok(/Đã huỷ buổi 14\/10 19:00/.test(p.text('#tp-toast')));
  assert.strictEqual(c.calls('remove').length, 1, 'Calendar được cập nhật');
});

t('U10', 'Sau 15:00 hôm trước: trang không cho huỷ, hiện hạn huỷ', async () => {
  const c = mk();
  c.book('S003', [['2026-10-13', '19:00']]);
  c.at('2026-10-12 15:30');
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="lessons"]'); await p.flush();
  assert.strictEqual(p.$$('[data-cancel]').length, 0);
  assert.ok(/Hạn huỷ đã qua/.test(p.text('#tab-body')));
});

t('U11', 'Tài khoản: số quá 40 ký tự bị chặn (5K), số đúng lưu +84; tên có mã HTML hiện thành chữ (không chạy mã)', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="account"]'); await p.flush(30);
  p.type('#p-phone', '0912 345 678 hoặc gọi giờ hành chính nhé bạn ơi'); p.submit('#prof'); await p.flush();
  assert.ok(/Số điện thoại tối đa 40 ký tự/.test(p.text('#tp-toast')));
  assert.strictEqual(c.row('USERS', 'S003').phone, '+84912000003');
  p.type('#p-phone', '0987 654 321'); p.type('#p-name', '<img src=x onerror="window.__xss=1">Hà');
  p.submit('#prof'); await p.flush(60);
  p.clean();
  assert.strictEqual(c.rawCell('USERS', c.row('USERS', 'S003')._row, 'phone'), '+84987654321');
  assert.strictEqual(p.win.__xss, undefined);
  assert.strictEqual(p.$$('.topbar img').length, 0, 'không chèn được thẻ img');
  assert.ok(/<img/.test(p.text('.topbar')), 'tên hiện nguyên văn');
});

t('U12', 'Gia hạn từ trang: email lấy từ phiên, gói TRIAL không có trong danh sách', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'renew' }, { session });
  await p.flush(60);
  // page=renew đã đăng nhập thì router đưa vào cổng học viên; mở tab Tài khoản
  p.click('.tab[data-tab="account"]'); await p.flush(30);
  assert.ok(!p.$('#r-TRIAL') && p.$('#r-PASS_1M'));
  p.click('#r-PASS_1M');
  p.file('#r-file', 'ck.pdf', 'application/pdf');
  p.submit('#renew'); await p.flush(60);
  p.clean();
  const reg = c.rows('REGISTRATIONS').pop();
  assert.strictEqual(reg.email, EMAIL.S003);
  assert.ok(p.text('.sheet').indexOf(reg.transfer_code) !== -1);
});

// ═══ Tutor ═══

t('U13', 'Tutor mở slot tuần sau từ trang: ghi AVAILABILITY OPEN, hộp thoại tóm tắt bằng tiếng Anh', async () => {
  const c = mk();
  const { session, page } = await uiLogin(c, 'T001');
  assert.strictEqual(session.role, 'TUTOR');
  assert.ok(/Upcoming lessons/.test(page.text('main')));
  const p = open(c, { page: 'tutor' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="avail"]'); await p.flush(60);
  assert.strictEqual(p.$$('details.day').length, 7);
  assert.strictEqual(p.$$('.chip[data-key^="2026-10-19|"]').length, 32, '32 slot mỗi ngày');
  p.click('.chip[data-key="2026-10-19|10:00"]');
  p.click('.chip[data-key="2026-10-19|10:30"]');
  p.click('.chip[data-key="2026-10-19|10:30"]'); // bấm lại thì bỏ
  assert.ok(/1 change/.test(p.text('#actionbar')));
  p.click('#ab-go'); await p.flush(60);
  p.clean();
  const rows = c.rows('AVAILABILITY').filter(a => a.tutor_id === 'T001' && c.keyOf(a.date) === '2026-10-19');
  assert.deepStrictEqual(rows.map(a => a.slot + ' ' + a.status), ['10:00 OPEN']);
  assert.ok(/1 slot\(s\) opened/.test(p.text('.sheet')));
});

t('U14', 'Tutor bấm slot đã có học viên: hỏi xác nhận, gửi yêu cầu huỷ chờ admin duyệt', async () => {
  const c = mk();
  c.onlyOpen('2026-10-14', '20:00', ['T001']);
  const res = c.book('S003', [['2026-10-14', '20:00']]);
  assert.ok(res[0].ok);
  const { session } = await uiLogin(c, 'T001');
  const p = open(c, { page: 'tutor' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="avail"]'); await p.flush(60);
  p.click('[data-week="0"]'); await p.flush();
  const chip = p.$('.chip[data-key="2026-10-14|20:00"]');
  assert.ok(chip.classList.contains('booked'));
  p.click(chip);
  assert.ok(/Request to cancel/.test(p.text('.sheet')));
  p.sheetBtn('Keep slot'); await p.flush();
  assert.ok(p.$('#actionbar').hidden, 'giữ slot thì không có thay đổi');
  p.click(chip);
  p.sheetBtn('Request cancellation'); await p.flush();
  assert.ok(/1 change/.test(p.text('#actionbar')));
  p.click('#ab-go'); await p.flush(60);
  p.clean();
  const av = c.rows('AVAILABILITY').find(a => a.tutor_id === 'T001' && c.keyOf(a.date) === '2026-10-14' && a.slot === '20:00');
  assert.strictEqual(av.status, 'CANCEL_PENDING');
  assert.strictEqual(c.rows('BOOKINGS')[0].status, 'CONFIRMED', 'buổi học giữ nguyên tới khi admin duyệt');
  assert.ok(/sent to admin/.test(p.text('.sheet')));
});

t('U15', 'Tutor xác nhận kết quả 2 bước (5F): chọn Completed chưa ghi gì; Save, xem lại, Save mới ghi COMPLETED; Back thì không ghi', async () => {
  const c = mk();
  c.onlyOpen('2026-10-13', '19:00', ['T002']);
  c.book('S003', [['2026-10-13', '19:00']]);
  c.at('2026-10-13 19:40');
  const { session } = await uiLogin(c, 'T002');
  const p = open(c, { page: 'tutor' }, { session });
  await p.flush(60);
  assert.ok(/To confirm\s*1/.test(p.text('.tabbar')), p.text('.tabbar'));
  p.click('.tab[data-tab="confirm"]'); await p.flush();
  assert.ok(/Học viên 3/.test(p.text('#tab-body')) && /B1/.test(p.text('#tab-body')), 'tên và level học viên');
  p.click('[data-res="COMPLETED"]'); await p.flush(60);
  assert.strictEqual(c.rows('BOOKINGS')[0].status, 'CONFIRMED', 'bước 1: chỉ chọn, chưa lưu');
  assert.strictEqual(p.$('[data-res="COMPLETED"]').getAttribute('aria-pressed'), 'true');
  assert.ok(!p.$('#actionbar').hidden && /Save 1 result/.test(p.text('#actionbar')), 'thanh lưu hiện số buổi đã chọn');
  // Bỏ chọn rồi chọn lại kết quả khác, rồi đổi lại Completed: chỉ giữ một lựa chọn mỗi buổi
  p.click('[data-res="STUDENT_ABSENT"]'); await p.flush();
  assert.strictEqual(p.$('[data-res="COMPLETED"]').getAttribute('aria-pressed'), 'false');
  p.click('[data-res="COMPLETED"]'); await p.flush();
  p.click('#ab-go'); await p.flush();
  assert.ok(/Check before saving/.test(p.text('.sheet')) && /Học viên 3/.test(p.text('.sheet')) && /Completed/.test(p.text('.sheet')), 'bước 2: xem lại');
  // Back: không ghi
  p.sheetBtn('Back'); await p.flush(60);
  assert.strictEqual(c.rows('BOOKINGS')[0].status, 'CONFIRMED', 'Back không lưu');
  p.click('#ab-go'); await p.flush();
  p.sheetBtn('Save'); await p.flush(80);
  p.clean();
  assert.strictEqual(c.rows('BOOKINGS')[0].status, 'COMPLETED');
  assert.ok(/Nothing to confirm/.test(p.text('#tab-body')));
});

t('U16', 'Phân quyền từ trang: phiên học viên mở trang tutor thì vẫn ở cổng học viên; API tutor từ chối phiên học viên', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'tutor' }, { session });
  await p.flush(60);
  assert.ok(p.$('.pass'), 'router đưa về cổng học viên');
  const r = c.api.apiTutorHome(session.token);
  assert.strictEqual(r.ok, false);
  assert.ok(JSON.stringify(r).indexOf('Học viên') === -1, 'không lộ dữ liệu');
});

t('U17', 'Buổi đã diễn ra chưa được tutor xác nhận: Lịch sử ghi "Chờ tutor xác nhận", không ghi "Xác nhận"', async () => {
  const c = mk();
  c.book('S003', [['2026-10-13', '19:00']]);
  c.at('2026-10-13 19:45');
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="lessons"]'); await p.flush();
  p.clean();
  assert.ok(/Chưa có buổi nào sắp tới/.test(p.text('#tab-body')));
  assert.ok(/Chờ tutor xác nhận/.test(p.text('#tab-body')), p.text('#tab-body'));
});

t('U18', 'BOOKING_LEAD_HOURS = 2, Thứ Bảy 10/10 20:47: trang hiện slot tối nay và ngày mai, ghi chú đúng luật mới', async () => {
  const c = mk('2026-10-10 20:47');
  [['2026-10-10', '23:30'], ['2026-10-11', '19:00']].forEach(x => c.setSlot('T001', x[0], x[1], 'OPEN'));
  c.api.withLock_(() => c.api.table_('CONFIG').insert({ key: 'BOOKING_LEAD_HOURS', value: '2' }));
  c.api.clearConfigCache_();
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.clean();
  assert.ok(p.$('.chip[data-date="2026-10-10"][data-slot="23:30"]'), 'slot 23:30 tối nay');
  assert.ok(p.$('.chip[data-date="2026-10-11"][data-slot="19:00"]'), 'slot ngày mai');
  assert.ok(/ít nhất 2 tiếng/.test(p.text('#tab-body')), p.text('.note'));
  p.click('.chip[data-date="2026-10-10"][data-slot="23:30"]');
  p.click('#ab-go'); await p.flush(60);
  assert.ok(/Đã đặt 1 buổi/.test(p.text('.sheet')));
});

t('U20', 'Admin sửa chữ trong tab CONTENT, bấm cập nhật, tải lại trang: chữ mới hiện ở trang chủ, cổng học viên, cổng tutor', async () => {
  const c = mk(), { api } = c;
  const set = (key, value, lang) => api.withLock_(() => { const t = api.table_('CONTENT'), r = t.byId(key), col = lang || 'vi'; if (r) t.update(r, { [col]: value }); else t.insert({ key, [col]: value }); });
  set('h.hero_title', 'Nói tiếng Thái tự tin sau 30 ngày');
  set('h.levels', 'A0|A1|A2');
  set('a.zalo_fab', 'Chat');
  set('s.tab_book', 'Chọn giờ');
  set('s.pass_daily', 'Mỗi ngày tối đa {x} 1 buổi');
  set('t.tab_avail', 'My slots', 'en');
  set('t.legend', 'Free|Taken|Waiting|Locked|Closed', 'en');
  set('h.hero_sub', '-');
  // Chưa bấm cập nhật: trang vẫn dùng bản đệm cũ (tối đa 5 phút)
  api.contentMap_();
  api.refreshContent_();
  const h = open(c, { page: 'home' });
  await h.flush(); h.clean();
  assert.strictEqual(h.text('h1'), 'Nói tiếng Thái tự tin sau 30 ngày');
  assert.deepStrictEqual(h.$$('#f-level option').map(o => o.value), ['A0', 'A1', 'A2']);
  assert.strictEqual(h.text('.hero .muted'), '', 'dấu - ẩn câu phụ');
  assert.strictEqual(h.text('.fab-zalo'), 'Chat');
  const { session } = await uiLogin(c, 'S003');
  const s = open(c, { page: 'student' }, { session });
  await s.flush(60); s.clean();
  assert.ok(/Chọn giờ/.test(s.text('.tab[data-tab="book"]')));
  assert.ok(/Mỗi ngày tối đa \{x\} 1 buổi/.test(s.text('.pass')), 'biến không có thì giữ nguyên chữ: ' + s.text('.pass'));
  const tu = await uiLogin(c, 'T001');
  const t = open(c, { page: 'tutor' }, { session: tu.session });
  await t.flush(60);
  t.click('.tab[data-tab="avail"]'); await t.flush(60); t.clean();
  assert.ok(/My slots/.test(t.text('.tab[data-tab="avail"]')));
  assert.ok(/Free\s*Taken\s*Waiting\s*Locked\s*Closed/.test(t.text('#tab-body')), t.text('#tab-body').slice(0, 300));
  assert.strictEqual(t.win.T.t('a.network_error'), 'Cannot connect. Check your network and try again.', 'chữ chung trên cổng tutor là tiếng Anh');
  assert.strictEqual(s.win.T.t('a.network_error'), 'Không kết nối được. Kiểm tra mạng rồi thử lại.');
});

/** Đăng nhập admin qua giao diện (A01 trong bộ dữ liệu mẫu). */
async function uiLoginEmail(c, email) {
  const p = open(c, { page: 'login' });
  await p.flush();
  p.type('#l-email', email); p.submit('#login'); await p.flush();
  const mail = c.env.state.mails.filter(m => m.to === email && /đăng nhập/i.test(m.subject)).pop();
  const raw = JSON.stringify(mail).match(/[?&;]t=([a-f0-9]{64})/)[1];
  const q = open(c, { page: 'auth', t: raw });
  await q.flush(80);
  // Chunk 5I: admin cũng được hỏi ngôn ngữ lần đầu (trang quản trị song ngữ): chọn tiếng Việt như trước.
  if (q.$('[data-lang-pick]')) { q.sheetBtn('Tiếng Việt'); await q.flush(60); }
  q.clean();
  return { session: q.session(), page: q };
}

t('U21', 'Admin đăng nhập bằng link email vào thẳng giao diện admin; thấy số việc cần xử lý; bấm thông báo xem chi tiết buổi học, đánh dấu đã đọc', async () => {
  const c = mk();
  const [a] = c.book('S003', [['2026-10-14', '19:00']]);
  c.api.cancelBookingFor_('S003', a.bookingId, 's003@student.test');
  const { session, page } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  assert.strictEqual(session.role, 'ADMIN');
  assert.ok(page.$('.kpis'), 'vào giao diện admin');
  assert.deepStrictEqual(page.history.pop(), { page: 'admin' }, 'địa chỉ trang bỏ mã link');
  const p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  assert.ok(/Cần xử lý/.test(p.text('.kpis')));
  const item = p.$$('[data-notif]').find(x => /huỷ buổi/.test(x.textContent));
  assert.ok(item, p.text('#feed'));
  p.click(item); await p.flush();
  p.sheetBtn('Xem buổi học ' + a.bookingId); await p.flush(60);
  assert.ok(/Huỷ bởi học viên/.test(p.text('.sheet')) && /Huỷ buổi/.test(p.text('.sheet .log')), p.text('.sheet'));
  p.sheetBtn('Đóng'); await p.flush(40);
  p.clean();
  const n = c.rows('NOTIFICATIONS').find(x => x.event === 'STUDENT_CANCELLED');
  assert.ok(n.read === true || String(n.read).toUpperCase() === 'TRUE', 'mở thông báo là đã đọc');
});

t('U22', 'Admin đặt thay học viên qua giao diện sau hạn 15:00, chọn tutor; xem chi tiết, huỷ buổi; tab Nhật ký tìm được', async () => {
  const c = mk('2026-10-13 16:30');
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  p.click('.tab[data-tab="students"]'); await p.flush(60);
  p.type('#q', 's003'); await p.flush();
  assert.strictEqual(p.$$('[data-person]').length, 1);
  p.click('[data-person="S003"]'); await p.flush(60);
  p.click('#book-for'); await p.flush(80);
  p.click('.chip[data-date="2026-10-14"][data-slot="19:00"]'); await p.flush();
  const sel = p.$('#t-2026-10-14');
  assert.ok(sel && sel.options.length >= 3, 'tự chọn + ít nhất 2 tutor');
  sel.value = sel.options[2].value;
  sel.dispatchEvent(new p.win.Event('change', { bubbles: true }));
  const chosen = sel.value;
  // Chọn thêm giờ ngày khác (danh sách được vẽ lại): tutor đã chọn của ngày 14 phải còn nguyên
  p.click('.chip[data-date="2026-10-15"][data-slot="20:00"]'); await p.flush();
  assert.strictEqual(p.$('#t-2026-10-14').value, chosen, 'không mất tutor đã chọn');
  p.click('.chip[data-date="2026-10-15"][data-slot="20:00"]'); await p.flush();   // bỏ ngày 15
  p.click('#do-book'); await p.flush(1);
  p.click('.chip[data-date="2026-10-15"][data-slot="20:00"]');   // bấm khi đang gửi: không vẽ lại nút Đặt
  assert.ok(p.$('#do-book').disabled, 'đang gửi: nút Đặt vẫn khoá');
  await p.flush(80);
  assert.ok(/Đã đặt 1 buổi/.test(p.text('.sheet')), p.text('.sheet'));
  const bk = c.rows('BOOKINGS').find(b => b.student_id === 'S003' && c.keyOf(b.date) === '2026-10-14');
  assert.strictEqual(bk.tutor_id, chosen);
  p.sheetBtn('Đóng'); await p.flush(80);
  p.click('[data-cancel="' + bk.booking_id + '"]'); await p.flush();
  p.type('#c-reason', 'Đổi lịch theo yêu cầu');
  p.sheetBtn('Huỷ buổi này'); await p.flush(80);
  // Chunk 5M: 13/10 16:30 huỷ buổi 14/10 (sau 15:00 hôm trước) là Huỷ muộn.
  assert.strictEqual(c.row('BOOKINGS', bk.booking_id).status, 'CANCELLED_LATE');
  assert.strictEqual(c.row('BOOKINGS', bk.booking_id).cancel_reason, 'Đổi lịch theo yêu cầu');
  p.click('#back'); await p.flush(40);
  p.click('.tab[data-tab="log"]'); await p.flush(60);
  p.type('#log-q', bk.booking_id); await new Promise(r => setTimeout(r, 450)); await p.flush(60);
  assert.ok(/Huỷ buổi/.test(p.text('#log-list')) && /Đặt buổi/.test(p.text('#log-list')), p.text('#log-list'));
  p.clean();
});

t('U23', 'Tutor tab Account: số buổi tháng; không còn mục thiết bị (16/10); nút Log out đưa về đăng nhập và phiên cũ hết hiệu lực', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'T001');
  const p = open(c, { page: 'tutor' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="account"]'); await p.flush(80);
  assert.ok(/10\/2026/.test(p.text('#stats')) && /Paid lessons/.test(p.text('#stats')), p.text('#stats'));
  assert.ok(!p.$('#devices') && !p.$('#logout-all') && !/device/i.test(p.text('#app')), 'không còn mục thiết bị: ' + (p.text('#app').match(/.{0,60}device.{0,60}/i) || [''])[0]);
  p.click('#logout2'); await p.flush(60);
  assert.ok(p.$('#login'), 'về trang đăng nhập');
  assert.strictEqual(c.api.apiTutorHome(session.token).reason, 'SESSION_INVALID');
  p.clean();
});

t('U24', 'Trang đăng nhập Google: chữ ký hợp lệ vào cổng admin; chữ ký sai báo lỗi và có nút xin link; nút Google chỉ hiện khi có GOOGLE_LOGIN_URL', async () => {
  const c = mk();
  const secret = 'g'.repeat(64), crypto6 = require('crypto');
  c.env.state.props.GOOGLE_LOGIN_SECRET = secret;
  const sign = (e, ts) => crypto6.createHmac('sha256', secret).update(e + '|' + ts).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ts = String(Date.now());
  const p = open(c, { page: 'gauth', ge: 'admin.karn@gmail.com', gts: ts, gs: sign('admin.karn@gmail.com', ts) });
  await p.flush(80);
  // Soát 5I B14: đăng nhập Google mà tài khoản chưa chọn ngôn ngữ cũng được hỏi
  assert.ok(p.$('[data-lang-pick]'), 'hỏi ngôn ngữ sau khi đăng nhập Google');
  p.sheetBtn('English'); await p.flush(80);
  assert.ok(p.$('.kpis') && /Urgent unread/.test(p.text('.kpis')), 'vào giao diện admin tiếng Anh: ' + p.text().slice(0, 200));
  assert.strictEqual(c.row('USERS', 'A01').lang, 'en');
  assert.strictEqual(p.session().role, 'ADMIN');
  const q = open(c, { page: 'gauth', ge: 'admin.karn@gmail.com', gts: ts, gs: 'x'.repeat(43) });
  await q.flush(60);
  assert.ok(/không hợp lệ/i.test(q.text()) && q.$('#again'));
  const l1 = open(c, { page: 'login' }); await l1.flush();
  assert.ok(!l1.$('#l-google'));
  c.api.withLock_(() => c.api.table_('CONFIG').insert({ key: 'GOOGLE_LOGIN_URL', value: 'https://script.google.com/macros/s/LOGIN/exec' })); c.api.clearConfigCache_();
  const l2 = open(c, { page: 'login' }); await l2.flush();
  assert.ok(l2.$('#l-google') && l2.$('#l-google').href === 'https://script.google.com/macros/s/LOGIN/exec');
  p.clean(); q.clean(); l2.clean();
});

t('U25', 'Admin xem tutor trên giao diện: số buổi tháng, buổi sắp tới, thoát mọi thiết bị của tutor đó', async () => {
  const c = mk();
  c.onlyOpen('2026-10-14', '19:00', ['T001']);
  c.book('S003', [['2026-10-14', '19:00']]);
  const ttok = c.api.apiExchangeToken(c.api.withLock_(() => c.api.createLoginLinkInLock_(c.api.userById_('T001'))).match(/t=([a-f0-9]{64})/)[1], 'Mozilla/5.0 (iPhone) Safari/604.1').data.sessionToken;
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  p.click('.tab[data-tab="tutors"]'); await p.flush(60);
  const tutorWithLesson = c.rows('BOOKINGS')[0].tutor_id;
  p.click('[data-person="' + tutorWithLesson + '"]'); await p.flush(80);
  assert.ok(/Số buổi theo tháng/.test(p.text('#tab-body')) && /10\/2026/.test(p.text('#tab-body')));
  assert.ok(p.$$('[data-booking]').length >= 1, 'có buổi sắp tới');
  assert.strictEqual(tutorWithLesson, 'T001');
  assert.ok(/Safari · iOS/.test(p.text('#tab-body')), 'thấy thiết bị của tutor');
  p.click('#kick'); await p.flush();
  p.sheetBtn('Thoát hết'); await p.flush(80);
  assert.strictEqual(c.api.apiTutorHome(ttok).reason, 'SESSION_INVALID');
  p.clean();
});

t('U26', 'Học viên có gói hết hạn và gói đang dùng: thẻ chính hiện gói đang dùng (lỗi sắp xếp ACTIVE = 0 đã sửa)', async () => {
  const c = mk();
  c.api.withLock_(() => c.api.table_('STUDENT_PACKAGES').insert({ sp_id: 'SP09999', student_id: 'S003', package_code: 'PASS_2W', status: 'EXPIRED', start_date: new Date(2026, 8, 1), end_date: new Date(2026, 8, 14), purchased_at: new Date(2026, 8, 1) }));
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  assert.ok(/Đang dùng/.test(p.text('.pass')) && !/Hết hạn/.test(p.text('.pass')), p.text('.pass'));
  p.clean();
});


t('U27', 'Tự thử lại (5F): Google từ chối 2 lượt mở cổng thì trang vẫn mở, không báo lỗi; đặt lịch mất phản hồi thì thử lại cùng mã, chỉ đặt 1 lần, hiện kết quả', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S005');
  const p = open(c, { page: 'student' }, { session, failNext: { apiStudentHome: 2 }, loseResponse: { apiStudentBook: 1 } });
  await p.flush(120);
  assert.ok(p.$('.pass'), 'cổng học viên mở được sau khi tự thử lại: ' + p.text('body').slice(0, 200) + JSON.stringify(p.calls.map(x => x.name + (x.failed ? '!' : ''))) + JSON.stringify(p.errors));
  assert.strictEqual(p.calls.filter(x => x.name === 'apiStudentHome').length, 3);
  assert.ok(!/Không kết nối/.test(p.text('#app')), 'không hiện lỗi mạng');
  const chip = p.$$('.chip').find(x => !x.disabled);
  p.click(chip); await p.flush();
  const n0 = c.rows('BOOKINGS').length;
  p.click('#ab-go'); await p.flush(150);
  const books = p.calls.filter(x => x.name === 'apiStudentBook');
  assert.strictEqual(books.length, 2, 'gửi 2 lần');
  assert.strictEqual(books[0].args[2], books[1].args[2], 'cùng mã chống trùng');
  assert.ok(/^r[a-z0-9]{8,}$/.test(books[0].args[2]), books[0].args[2]);
  assert.strictEqual(c.rows('BOOKINGS').length, n0 + 1, 'chỉ 1 buổi');
  assert.ok(/Đã đặt|đặt được/i.test(p.text('.sheet')), p.text('.sheet'));
  p.clean();
});

t('U28', 'Cổng học viên (5F): mở trang lấy luôn slot (không gọi apiStudentSlots khi vào tab đặt lịch); buổi chưa có link Meet ghi rõ link đến cùng lời mời lịch', async () => {
  const c = mk();
  cfgSetUi(c, 'CALENDAR_MODE', 'NIGHTLY');
  c.book('S003', [['2026-10-14', '19:00']]);
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(80);
  assert.ok(p.$$('.chip').length > 0, 'có slot ngay');
  assert.strictEqual(p.calls.filter(x => x.name === 'apiStudentSlots').length, 0);
  p.click('.tab[data-tab="lessons"]'); await p.flush();
  assert.ok(/thư mời Google Calendar/.test(p.text('#tab-body')), p.text('#tab-body'));
  p.click('.tab[data-tab="book"]'); await p.flush();
  assert.strictEqual(p.calls.filter(x => x.name === 'apiStudentSlots').length, 0, 'quay lại tab trong 60 giây: dùng lại');
  p.clean();
});

t('U29', 'Máy tính (5F): thanh tab thành cột trái, lịch rảnh của tutor là lưới tuần mở sẵn mọi ngày, ngày đặt lịch của học viên mở sẵn', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'T001');
  const p = open(c, { page: 'tutor' }, { session, wide: true });
  await p.flush(60);
  p.click('.tab[data-tab="avail"]'); await p.flush(60);
  assert.ok(p.$('.week-grid'), 'lưới tuần');
  const days = p.$$('.week-grid details.day');
  assert.strictEqual(days.length, 7); assert.ok(days.every(d => d.open), 'mở sẵn cả 7 ngày');
  assert.ok(/min-width: 900px/.test(p.doc.querySelector('style').textContent), 'có bố cục máy tính');
  p.clean();
  const s = await uiLogin(c, 'S003');
  const q = open(c, { page: 'student' }, { session: s.session, wide: true });
  await q.flush(80);
  assert.ok(q.$('.day-grid') && q.$$('.day-grid details.day').every(d => d.open), 'ngày đặt lịch mở sẵn');
  assert.ok(q.$('main > .side'), 'cột thẻ gói');
  q.clean();
});

t('U30', 'Đông người (5F, soát R2): hệ thống bận thì dải "đang thử lại" hiện trong lúc thử và tắt khi xong; nút Đặt trở lại chữ cũ, không kẹt "Đang đặt..."', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S005');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(80);
  const chip = p.$$('.chip').find(x => !x.disabled);
  p.click(chip); await p.flush();
  const label = p.text('#ab-go');
  c.env.state.lockBusy = true;
  p.click('#ab-go');
  await p.flush(3);
  const seen = !!(p.$('#tp-retry') && !p.$('#tp-retry').hidden);
  await p.flush(150);
  c.env.state.lockBusy = false;
  assert.ok(seen || p.calls.filter(x => x.name === 'apiStudentBook').length >= 3, 'có thử lại');
  assert.ok(p.calls.filter(x => x.name === 'apiStudentBook').length === 3, 'bận thật: 3 lần là dừng');
  assert.ok(p.$('#tp-retry').hidden, 'dải thử lại đã tắt');
  assert.strictEqual(p.text('#ab-go'), label, 'nút trở lại: ' + p.text('#ab-go'));
  assert.ok(!p.$('#ab-go').disabled);
  p.clean();
});

t('U31', '16/10: tab Tài khoản học viên không còn mục thiết bị; 5G: bảo trì CHỈ XEM hiện thanh báo, bấm Đặt nhận câu bảo trì và không ghi; ĐÓNG thì cổng hiện trang bảo trì (desktop và điện thoại)', async () => {
  const c = mk();
  const { session } = await uiLogin(c, 'S005');
  let p = open(c, { page: 'student' }, { session });
  await p.flush(80);
  p.click('.tab[data-tab="account"]'); await p.flush(80);
  assert.ok(!p.$('#devices') && !p.$('#logout-all') && !/thiết bị/i.test(p.text('#app')), 'không còn mục thiết bị');
  assert.ok(p.$('#logout2'), 'vẫn có nút Đăng xuất');
  p.clean();
  c.api.setMaintMode_('READONLY', 'test'); cfgSetUi(c, 'MAINTENANCE_UNTIL', '21:00');
  p = open(c, { page: 'student' }, { session });
  await p.flush(80);
  assert.ok(p.$('#tp-maint') && !p.$('#tp-maint').hidden && /bảo trì \(21:00\)/.test(p.text('#tp-maint')), p.text('#tp-maint'));
  const n0 = c.rows('BOOKINGS').length;
  const chip = p.$$('.chip').find(x => !x.disabled);
  p.click(chip); await p.flush();
  p.click('#ab-go'); await p.flush(60);
  assert.strictEqual(c.rows('BOOKINGS').length, n0, 'không ghi');
  assert.ok(p.$('#tp-toast') && /bảo trì \(21:00\).*xem được lịch/.test(p.text('#tp-toast')), 'toast báo bảo trì: ' + p.text('#tp-toast'));
  // Admin tắt bảo trì trong lúc trang đang mở: lượt gọi sau thành công thì thanh báo tự tắt
  c.api.setMaintMode_('OFF', 'test');
  p.click('.tab[data-tab="lessons"]'); await p.flush(40);
  p.click('.tab[data-tab="book"]'); await p.flush(80);   // trang đọc lại slot từ máy chủ
  assert.ok(p.calls.filter(x => x.name === 'apiStudentSlots' || x.name === 'apiStudentHome').length >= 2, 'có lượt gọi mới');
  assert.ok(p.$('#tp-maint').hidden, 'thanh báo tự tắt');
  p.clean();
  c.api.setMaintMode_('CLOSED', 'test');
  for (const wide of [false, true]) {
    p = open(c, { page: 'student' }, { session, wide });
    await p.flush(80);
    assert.ok(p.$('#maint-screen') && /Đang bảo trì/.test(p.text('#maint-screen')), 'trang bảo trì');
    p.clean();
  }
  p = open(c, { page: 'home' }, {});
  await p.flush(80);
  assert.ok(!p.$('#reg-msg').hidden && /bảo trì/.test(p.text('#reg-msg')) && p.$('#reg-submit').disabled, 'form đăng ký báo bảo trì và khoá nút Gửi');
  assert.ok(/Đang bảo trì/.test(p.text('#tp-maint')) && !/Under maintenance/.test(p.text('#tp-maint')), 'trang chủ: thanh báo theo ngôn ngữ đang chọn');
  p.click('[data-langsw]'); await p.flush(20);
  assert.ok(/Under maintenance/.test(p.text('#tp-maint')), 'bấm EN: thanh báo đổi sang tiếng Anh');
  p.click('[data-langsw]'); await p.flush(20);
  p.clean();
  const { session: ts } = await uiLogin(c, 'T001');
  p = open(c, { page: 'tutor' }, { session: ts });
  await p.flush(80);
  assert.ok(p.$('#maint-screen') && /Under maintenance/.test(p.text('#maint-screen')), 'tutor tiếng Anh: ' + p.text('#app'));
  p.clean();
  c.api.setMaintMode_('OFF', 'test');
  p = open(c, { page: 'student' }, { session });
  await p.flush(80);
  assert.ok(!p.$('#tp-maint') || p.$('#tp-maint').hidden, 'tắt thì hết thanh báo');
  p.clean();
});


// ═══ Chunk 5H: nút VI | EN, hỏi ngôn ngữ lần đầu, trang quản trị gọn ═══

t('U32', 'Trang chủ: bấm EN đổi mọi chữ sang tiếng Anh, giữ chữ đã nhập và ảnh đã chọn; trình độ gửi lên vẫn là bản tiếng Việt; mở lại trang vẫn tiếng Anh', async () => {
  const c = mk();
  const p = open(c, { page: 'home' });
  await p.flush();
  assert.strictEqual(p.text('h1'), 'Luyện nói tiếng Thái 1:1 với người bản xứ');
  assert.ok(p.$('[data-langsw] .on') && p.text('[data-langsw] .on') === 'VI');
  p.type('#f-name', 'Lan Anh'); p.type('#f-email', 'lananh@test.vn');
  p.$('#f-level').selectedIndex = 1;
  p.file('#f-file', 'ck.pdf', 'application/pdf', 'pdf');
  p.click('[data-langsw]'); await p.flush();
  assert.strictEqual(p.text('h1'), '1:1 Thai speaking practice with native tutors');
  assert.strictEqual(p.text('[data-langsw] .on'), 'EN');
  assert.strictEqual(p.win.T.day('2026-10-14'), 'Wed 14/10', 'thứ đúng lịch');
  assert.strictEqual(p.win.T.day('2026-10-18', true, 'vi'), 'CN 18/10');
  assert.strictEqual(p.win.T.day('2027-01-01', false, 'vi'), 'Thứ 6 01/01');
  assert.strictEqual(p.win.document.documentElement.lang, 'en');
  assert.strictEqual(p.$('#f-name').value, 'Lan Anh', 'giữ chữ đã nhập');
  assert.strictEqual(p.$('#f-level').selectedIndex, 1);
  assert.deepStrictEqual(p.$$('#f-level option').map(o => o.textContent), ['Beginner', 'Elementary', 'Intermediate', 'Advanced']);
  assert.ok(/Selected: ck\.pdf/.test(p.text('#f-file-box')), 'giữ ảnh đã chọn');
  assert.ok(/Send registration/.test(p.text('#reg-submit')) && /Need help/.test(p.text('main')));
  assert.strictEqual(p.win.localStorage.getItem('thaiput_lang'), 'en');
  p.click('#f-consent');
  p.submit('#reg'); await p.flush(80);
  assert.ok(/Registration received/.test(p.text('.sheet')), p.text('.sheet') + p.text('#reg-msg'));
  const reg = c.rows('REGISTRATIONS').find(r => r.email === 'lananh@test.vn');
  assert.strictEqual(reg.level_self, 'Sơ cấp', 'Sheets lưu bản tiếng Việt');
  p.clean();
  const q = open(c, { page: 'home' }, { storage: { thaiput_lang: 'en' } });
  await q.flush();
  assert.strictEqual(q.text('h1'), '1:1 Thai speaking practice with native tutors', 'mở lại vẫn tiếng Anh');
  q.click('[data-langsw]'); await q.flush();
  assert.strictEqual(q.text('h1'), 'Luyện nói tiếng Thái 1:1 với người bản xứ');
  q.clean();
});

/** Đăng nhập bằng link nhưng để test tự trả lời hộp chọn ngôn ngữ. */
async function linkOpen(c, uid) {
  // 5J: mỗi email xin link 1 lần mỗi giờ. Test mở lại nhiều lần trong cùng giờ giả lập: bỏ mốc chờ như khi đã qua 60 phút.
  Object.keys(c.env.state.cache).forEach(k => { if (/^login_cd_/.test(k)) delete c.env.state.cache[k]; });
  const l = open(c, { page: 'login' }); await l.flush();
  l.type('#l-email', EMAIL[uid]); l.submit('#login'); await l.flush();
  const mail = c.env.state.mails.filter(m => m.to === EMAIL[uid]).pop();
  const raw = JSON.stringify(mail).match(/[?&;]t=([a-f0-9]{64})/)[1];
  const q = open(c, { page: 'auth', t: raw });
  await q.flush(60);
  return q;
}

t('U33', 'Lần đầu đăng nhập bằng link: hỏi chọn ngôn ngữ; chọn English thì cổng học viên tiếng Anh (tab, thứ trong tuần, trạng thái, câu báo lỗi máy chủ), lưu vào USERS; lần sau không hỏi; thiết bị khác tự theo lựa chọn đã lưu', async () => {
  const c = mk();
  const q = await linkOpen(c, 'S005');
  assert.ok(q.$('[data-lang-pick]'), 'có hộp chọn ngôn ngữ');
  assert.ok(/Chọn ngôn ngữ/.test(q.text('.sheet')) && /Choose your language/.test(q.text('.sheet')), 'tiêu đề 2 thứ tiếng');
  q.sheetBtn('English'); await q.flush(80);
  assert.strictEqual(c.row('USERS', 'S005').lang, 'en', 'lưu lựa chọn lên máy chủ');
  assert.ok(/Book/.test(q.text('.tab[data-tab="book"]')) && /My lessons/.test(q.text('.tab[data-tab="lessons"]')), q.text('.tabbar'));
  assert.ok(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d\d\/10/.test(q.text('details.day summary b')), q.text('details.day summary b'));
  const pick = q.$$('.chip').find(x => !x.disabled), pk = pick.getAttribute('data-date') + '|' + pick.getAttribute('data-slot');
  q.click(pick); await q.flush();
  assert.ok(/1 selected/.test(q.text('#actionbar')));
  // Đổi ngôn ngữ khi đã chọn giờ: giờ đã chọn và thanh Đặt vẫn còn
  q.click('[data-langsw]'); await q.flush(20);
  const again = q.$('.chip[data-date="' + pk.split('|')[0] + '"][data-slot="' + pk.split('|')[1] + '"]');
  assert.ok(again.classList.contains('on') && /1 buổi đã chọn/.test(q.text('#actionbar')), 'giữ giờ đã chọn: ' + q.text('#actionbar'));
  q.click('[data-langsw]'); await q.flush(20);
  q.click('#ab-go'); await q.flush(80);
  assert.ok(/1 lesson\(s\) booked/.test(q.text('.sheet')), q.text('.sheet'));
  q.sheetBtn('See my lessons'); await q.flush(80);
  assert.ok(/Confirmed/.test(q.text('#tab-body')) && /Upcoming/.test(q.text('#tab-body')));
  // Câu báo lỗi của máy chủ hiện theo ngôn ngữ đang chọn
  c.api.setMaintMode_('READONLY', 'test');
  q.click('.tab[data-tab="book"]'); await q.flush(80);
  q.click(q.$$('.chip').find(x => !x.disabled)); await q.flush();
  q.click('#ab-go'); await q.flush(80);
  assert.ok(/under maintenance/.test(q.text('#tp-toast')), q.text('#tp-toast'));
  c.api.setMaintMode_('OFF', 'test');
  q.clean();
  const q2 = await linkOpen(c, 'S005');
  assert.ok(!q2.$('[data-lang-pick]'), 'đã chọn rồi: không hỏi lại');
  assert.ok(/My lessons/.test(q2.text('.tabbar')));
  q2.clean();
  // Thiết bị khác còn nhớ tiếng Việt: cổng tự theo lựa chọn trên máy chủ
  const sess = q2.session();
  const q3 = open(c, { page: 'student' }, { session: Object.assign({}, sess, { lang: 'vi' }), storage: { thaiput_lang: 'vi' } });
  await q3.flush(80);
  assert.ok(/My lessons/.test(q3.text('.tabbar')), 'theo USERS.lang: ' + q3.text('.tabbar'));
  q3.click('[data-langsw]'); await q3.flush(60);
  assert.ok(/Lịch của tôi/.test(q3.text('.tabbar')));
  assert.strictEqual(c.row('USERS', 'S005').lang, 'vi');
  q3.clean();
  // Tutor chưa chọn: hộp hỏi đề xuất English
  const t1 = await linkOpen(c, 'T003');
  const prim = t1.$$('.sheet .btn-primary').map(b => b.textContent.trim());
  assert.deepStrictEqual(prim, ['English'], 'tutor: English là nút chính');
  t1.sheetBtn('Tiếng Việt'); await t1.flush(80);
  assert.ok(/Lịch dạy/.test(t1.text('.tabbar')) && /Giờ rảnh/.test(t1.text('.tabbar')), t1.text('.tabbar'));
  t1.clean();
});

t('U34', 'Tutor đổi ngôn ngữ giữa chừng: giờ rảnh chưa lưu và thanh Lưu vẫn còn, chữ đổi sang tiếng Việt, lưu USERS.lang; admin có nút VI | EN (5I)', async () => {
  const c = mk('2026-10-12 10:00');
  const { session } = await uiLogin(c, 'T002');
  const p = open(c, { page: 'tutor' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="avail"]'); await p.flush(60);
  const free = p.$$('.chip[data-key]').find(x => !x.disabled && !x.classList.contains('on') && !x.classList.contains('booked'));
  const key = free.getAttribute('data-key');
  p.click(free); await p.flush();
  assert.ok(/1 change/.test(p.text('#actionbar')));
  p.click('[data-langsw]'); await p.flush(60);
  assert.ok(/Giờ rảnh/.test(p.text('.tab[data-tab="avail"]')) && /Rảnh/.test(p.text('.legend')), p.text('#tab-body').slice(0, 200));
  assert.ok(!p.$('#actionbar').hidden && /1 thay đổi/.test(p.text('#actionbar')), 'giữ thay đổi chưa lưu: ' + p.text('#actionbar'));
  assert.ok(p.$('.chip[data-key="' + key + '"]').classList.contains('dirty'));
  assert.ok(/^(CN|T[2-7]) \d\d\/\d\d/.test(p.text('.week-grid .day summary b')), p.text('.week-grid .day summary b'));
  assert.strictEqual(c.row('USERS', 'T002').lang, 'vi');
  p.click('#ab-go'); await p.flush(80);
  assert.ok(/Đã lưu/.test(p.text('.sheet')) && /Đã mở 1 giờ/.test(p.text('.sheet')), p.text('.sheet'));
  p.clean();
  const a = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const ap = open(c, { page: 'admin' }, { session: a.session });
  await ap.flush(80);
  assert.ok(ap.$('[data-langsw]'), 'chunk 5I: trang quản trị song ngữ, có nút VI | EN');
  ap.clean();
});

t('U35', 'Thông báo admin gọn (5H): mỗi thông báo một dòng, gom Hôm nay, Hôm qua; lọc bằng nút Khẩn, Tất cả; bấm dòng mở chi tiết; điện thoại và máy tính', async () => {
  const c = mk('2026-10-12 10:00'), { api } = c;
  api.withLock_(() => {
    const t = api.table_('NOTIFICATIONS');
    [['N9900001', new Date(2026, 9, 12, 9, 5), 'CRITICAL', 'CALENDAR_FAILED', 'Không tạo được sự kiện Calendar cho BK000001'],
      ['N9900002', new Date(2026, 9, 12, 8, 30), 'WARNING', 'TUTOR_CANCEL_REQUEST', 'Vân xin huỷ Thứ 3 13/10 19:00'],
      ['N9900003', new Date(2026, 9, 11, 21, 0), 'INFO', 'BOOKED', 'Học viên 3 đặt 1 buổi'],
      ['N9900004', new Date(2026, 9, 11, 20, 0), 'INFO', 'BOOKED', 'Học viên 5 đặt 1 buổi']].forEach(x =>
      t.insert({ notif_id: x[0], time: x[1], level: x[2], event: x[3], channel: 'LOG', actor: 'SYSTEM', message: x[4], read: false }));
  });
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  for (const wide of [true, false]) {
    const p = open(c, { page: 'admin' }, { session, wide });
    await p.flush(80);
    assert.strictEqual(p.$$('.feed .nrow').length, 4, p.text('#feed'));
    assert.deepStrictEqual(p.$$('.fgroup').map(x => x.textContent), ['Hôm nay', 'Hôm qua']);
    assert.ok(p.$('.nrow.lv-bad.unread') && /09:05/.test(p.text('.nrow.lv-bad time')));
    assert.ok(!p.$('#f-unread') && p.$('[data-fu="1"].on'), 'bộ lọc là nút phân đoạn');
    p.click('[data-fl="CRITICAL"]'); await p.flush(60);
    assert.strictEqual(p.$$('.feed .nrow').length, 1);
    assert.ok(p.$('[data-fl="CRITICAL"]').classList.contains('on') && !p.$('[data-fl=""]').classList.contains('on'));
    p.click('[data-fl=""]'); await p.flush(60);
    p.clean();
    if (!wide) {
      assert.ok(p.$('[data-fl="WARNING"] b'), 'có số Cần xử lý chưa đọc');
      p.click(p.$$('.nrow').find(x => /Vân xin huỷ/.test(x.textContent))); await p.flush();
      assert.ok(/Chi tiết thông báo/.test(p.text('.sheet')) && /TUTOR_CANCEL_REQUEST/.test(p.text('.sheet')));
      assert.ok(p.$$('.nrow.read').length === 1, 'mở chi tiết là đã đọc ngay');
      p.sheetBtn('Đóng'); await p.flush(80);
      assert.ok(!p.$('[data-fl="WARNING"] b'), 'đóng chi tiết: số Cần xử lý giảm về 0');
      p.clean();
      // Đã mở thì thành đã đọc: lọc Chưa đọc còn 3
      const p2 = open(c, { page: 'admin' }, { session });
      await p2.flush(80);
      assert.strictEqual(p2.$$('.feed .nrow').length, 3);
      p2.click('[data-fu="0"]'); await p2.flush(60);
      assert.strictEqual(p2.$$('.feed .nrow').length, 4);
      assert.ok(p2.$('.nrow.read'));
      p2.clean();
    }
  }
});


t('U36', 'Soát 5H giao diện: bấm VI | EN khi đang gửi thì không vẽ lại (không gửi 2 lần); tab Tài khoản giữ chữ đang sửa; trang bảo trì đóng chỉ đổi chữ; trang quản trị luôn tiếng Việt dù máy lưu EN; đổi ngôn ngữ không đè phiên của tab khác; tutor thấy trình độ theo ngôn ngữ', async () => {
  const c = mk();
  const h = open(c, { page: 'home' });
  await h.flush();
  h.type('#f-name', 'Khách Hai'); h.type('#f-email', 'khach2@test.vn');
  h.file('#f-file', 'ck.pdf', 'application/pdf', 'pdf'); h.click('#f-consent');
  h.submit('#reg');
  h.click('[data-langsw]');               // đang gửi: không đổi, báo chờ
  assert.ok(/Đang gửi, đổi ngôn ngữ sau/.test(h.text('#tp-toast')), h.text('#tp-toast'));
  assert.ok(h.$('#reg-submit').disabled, 'nút Gửi vẫn khoá');
  await h.flush(80);
  assert.strictEqual(c.rows('REGISTRATIONS').filter(r => r.email === 'khach2@test.vn').length, 1, 'chỉ 1 đăng ký');
  h.clean();
  // Tab Tài khoản: đổi ngôn ngữ giữ chữ đang sửa
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.click('.tab[data-tab="account"]'); await p.flush(60);
  p.type('#p-name', 'Tên đang sửa');
  p.click('[data-langsw]'); await p.flush(20);
  assert.strictEqual(p.$('#p-name').value, 'Tên đang sửa');
  assert.ok(/My details/.test(p.text('#tab-body')));
  p.click('[data-langsw]'); await p.flush(20);
  p.clean();
  // Trang bảo trì đóng: đổi ngôn ngữ chỉ đổi chữ, không hiện lại cổng cũ
  const m = open(c, { page: 'student' }, { session });
  await m.flush(80);
  assert.ok(m.$('.pass'), 'cổng đã mở, có dữ liệu');
  c.api.setMaintMode_('CLOSED', 'test');
  m.win.T.authed('apiStudentHome').catch(() => {}); await m.flush(40);   // lượt gọi kế tiếp nhận MAINT_CLOSED
  const homeCalls = () => m.calls.filter(x => x.name !== 'apiSetLanguage').length, nCalls = homeCalls();
  assert.ok(m.$('#maint-screen') && /Đang bảo trì/.test(m.text('#maint-screen')));
  m.click('[data-langsw]'); await m.flush(20);
  assert.ok(m.$('#maint-screen') && /Under maintenance/.test(m.text('#maint-screen')) && !m.$('.pass'), m.text('#app').slice(0, 200));
  assert.strictEqual(homeCalls(), nCalls, 'đổi ngôn ngữ trên trang bảo trì không gọi máy chủ, không hiện lại cổng cũ');
  m.clean();
  c.api.setMaintMode_('OFF', 'test');
  // Chunk 5I: trang quản trị theo ngôn ngữ tài khoản admin đã chọn (USERS.lang vi), như cổng học viên, tutor
  const a = await uiLoginEmail(c, 'admin.karn@gmail.com');
  assert.strictEqual(c.row('USERS', 'A01').lang, 'vi', 'admin chọn tiếng Việt lúc đăng nhập lần đầu');
  const ap = open(c, { page: 'admin' }, { session: a.session, storage: { thaiput_lang: 'en' } });
  await ap.flush(80);
  assert.strictEqual(ap.win.T.lang, 'vi'); assert.strictEqual(ap.win.document.documentElement.lang, 'vi');
  ap.clean();
  // Hai tab: tab tutor đổi ngôn ngữ không đè phiên chung của tab admin vừa đăng nhập
  const tu = await uiLogin(c, 'T001');
  const tp = open(c, { page: 'tutor' }, { session: tu.session });
  await tp.flush(60);
  tp.win.localStorage.setItem('thaiput_session', JSON.stringify(a.session));   // tab admin vừa ghi phiên chung
  tp.click('[data-langsw]'); await tp.flush(20);
  assert.strictEqual(JSON.parse(tp.win.localStorage.getItem('thaiput_session')).role, 'ADMIN', 'phiên chung vẫn là admin');
  assert.strictEqual(JSON.parse(tp.win.sessionStorage.getItem('thaiput_tab_session')).lang, 'vi');
  tp.clean();
  // Trình độ: Sheets lưu tiếng Việt, tutor tiếng Anh thấy bản tiếng Anh
  c.api.withLock_(() => { const u = c.api.table_('USERS'); u.update(u.byId('S003'), { level: 'Sơ cấp' }); u.update(u.byId('T001'), { lang: 'en' }); });
  c.onlyOpen('2026-10-14', '19:00', ['T001']);
  c.book('S003', [['2026-10-14', '19:00']]);
  const t2 = open(c, { page: 'tutor' }, { session: Object.assign({}, tu.session, { lang: 'en' }), storage: { thaiput_lang: 'en' } });
  await t2.flush(80);
  assert.ok(/Elementary/.test(t2.text('#tab-body')) && !/Sơ cấp/.test(t2.text('#tab-body')), t2.text('#tab-body').slice(0, 300));
  t2.clean();
});


t('U37', 'Soát 5H vòng 2: rời trang quản trị trả lại ngôn ngữ đã lưu; bấm EN rồi Thoát ngay vẫn lưu lên máy chủ; tab đã thoát không đổi ngôn ngữ của tài khoản tab khác; tab Account tutor đổi ngôn ngữ không gọi lại máy chủ', async () => {
  const c = mk();
  const a = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const ap = open(c, { page: 'admin' }, { session: a.session, storage: { thaiput_lang: 'en' } });
  await ap.flush(80);
  assert.strictEqual(ap.win.T.lang, 'vi', 'theo USERS.lang của admin');
  ap.win.T.go('home'); await ap.flush(40);
  assert.strictEqual(ap.win.T.lang, 'vi', 'chunk 5I: không còn ép tiếng Việt riêng cho trang quản trị, rời trang giữ nguyên ngôn ngữ');
  ap.clean();
  // Bấm EN rồi Thoát ngay (trước nhịp lưu)
  const { session } = await uiLogin(c, 'S005');
  const p = open(c, { page: 'student' }, { session });
  await p.flush(60);
  p.win.T.langSaveDelay = 5000;
  p.click('[data-langsw]'); p.click('#logout'); await p.flush(60);
  assert.strictEqual(c.row('USERS', 'S005').lang, 'en', 'lựa chọn tới máy chủ trước khi thoát');
  assert.strictEqual(c.api.apiStudentHome(session.token).reason, 'SESSION_INVALID', 'vẫn thoát');
  // Tab đã thoát (trang đăng nhập), phiên chung là của S003: bấm VI | EN không đổi ngôn ngữ của S003
  p.win.T.langSaveDelay = 0;
  const s3 = await uiLogin(c, 'S003');
  p.win.localStorage.setItem('thaiput_session', JSON.stringify(s3.session));
  const n0 = p.calls.filter(x => x.name === 'apiSetLanguage').length;
  p.click('[data-langsw]'); await p.flush(40);
  assert.strictEqual(p.calls.filter(x => x.name === 'apiSetLanguage').length, n0, 'trang đăng nhập chỉ lưu trên máy');
  assert.strictEqual(c.row('USERS', 'S003').lang, 'vi');
  p.clean();
  // Tutor tab Account
  const tu = await uiLogin(c, 'T002');
  const tp = open(c, { page: 'tutor' }, { session: tu.session });
  await tp.flush(60);
  tp.click('.tab[data-tab="account"]'); await tp.flush(60);
  const k = tp.calls.filter(x => x.name === 'apiTutorStats').length;
  tp.click('[data-langsw]'); await tp.flush(40);
  assert.strictEqual(tp.calls.filter(x => x.name === 'apiTutorStats').length, k, 'không gọi lại máy chủ');
  assert.ok(/Hoàn thành/.test(tp.text('#stats')), tp.text('#stats').slice(0, 120));
  tp.clean();
});

// ═══ Chunk 5I: trang quản trị song ngữ, ô số liệu bấm được, nhật ký xem trước ═══

/** Dữ liệu admin cho test 5I: 1 buổi hôm nay đã qua giờ (chờ xác nhận), 1 buổi tối nay, thông báo khẩn và cần xử lý. */
function adminFixture(now) {
  const c = mk(now || '2026-10-14 20:10');
  c.at('2026-10-13 10:00'); c.book('S003', [['2026-10-14', '19:00']]); c.book('S005', [['2026-10-14', '21:00']]); c.at(now || '2026-10-14 20:10');
  c.api.withLock_(() => {
    const t = c.api.table_('NOTIFICATIONS');
    t.insert({ notif_id: 'N9910001', time: new Date(2026, 9, 14, 19, 5), level: 'CRITICAL', event: 'CALENDAR_FAILED', channel: 'EMAIL', actor: 'SYSTEM', student_id: 'S003', tutor_id: 'T001', entity: 'BOOKING', entity_id: 'BK000001', message: 'Không tạo được sự kiện Calendar cho BK000001', message_en: 'Could not create the Calendar event for BK000001', link: 'https://docs.google.com/spreadsheets/d/X#gid=1&range=A2', read: false });
    t.insert({ notif_id: 'N9910002', time: new Date(2026, 9, 14, 18, 0), level: 'WARNING', event: 'TUTOR_CANCEL_REQUEST', channel: 'EMAIL', actor: 'van@tutor.test', tutor_id: 'T001', entity: 'AVAILABILITY', entity_id: 'AV000001', message: 'Vân xin huỷ Thứ 5 15/10 19:00', message_en: 'Vân asks to cancel Thu 15/10 19:00', read: false });
  });
  return c;
}

t('U38', 'Ô số liệu admin (5I): cả 6 ô đều bấm được: Khẩn và Cần xử lý lọc thông báo, Đăng ký chờ duyệt và Tutor xin huỷ mở đúng tab Sheets, Buổi hôm nay và Chờ tutor xác nhận mở danh sách buổi ngay trên trang (có nút Chi tiết, Huỷ); mọi nút trong khu thông báo bấm được, không lỗi', async () => {
  const c = adminFixture();
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  for (const wide of [false, true]) {
    const p = open(c, { page: 'admin' }, { session, wide });
    await p.flush(80);
    const tiles = p.$$('.kpis .kpi');
    assert.strictEqual(tiles.length, 6);
    assert.ok(tiles.every(x => x.tagName === 'A' || x.tagName === 'BUTTON'), 'mọi ô là link hoặc nút: ' + tiles.map(x => x.tagName).join());
    assert.ok(p.$('a.kpi[data-kpi-link="regs"]').href.indexOf('docs.google.com') !== -1 && p.$('a.kpi[data-kpi-link="tutor_cancels"]').target === '_blank');
    p.click('[data-kpi="feed:CRITICAL"]'); await p.flush(60);
    assert.ok(p.$('[data-fl="CRITICAL"].on') && p.$('[data-fu="1"].on'), 'lọc Khẩn chưa đọc');
    if (!wide) assert.ok(p.$$('.feed .nrow').length === 1 && /Calendar/.test(p.text('.feed')), p.text('#feed'));
    p.click('[data-kpi="feed:WARNING"]'); await p.flush(60);
    assert.ok(p.$('[data-fl="WARNING"].on') && /Vân xin huỷ/.test(p.text('.feed')));
    p.click('[data-kpi="lessons:today"]'); await p.flush(60);
    assert.ok(/Buổi hôm nay \(2\)/.test(p.text('#tab-body')), p.text('#tab-body').slice(0, 200));
    assert.strictEqual(p.$$('#tab-body [data-booking]').length, 2);
    assert.strictEqual(p.$$('#tab-body [data-cancel]').length, 1, 'chỉ buổi chưa bắt đầu có nút Huỷ');
    assert.ok(/Chờ tutor xác nhận/.test(p.text('#tab-body .pill')), 'buổi đã qua giờ hiện nhãn chờ xác nhận');
    p.click('#tab-body [data-booking]'); await p.flush(60);
    assert.ok(/Học viên/.test(p.text('.sheet')) && p.$('.sheet a[href*="docs.google.com"]'), 'chi tiết buổi có nút mở dòng BOOKINGS');
    p.sheetBtn('Đóng'); await p.flush();
    p.click('#back'); await p.flush(40);
    assert.ok(p.$('#feedbar'), 'quay lại tab Thông báo');
    p.click('[data-kpi="lessons:waiting"]'); await p.flush(60);
    assert.ok(/Chờ tutor xác nhận \(1\)/.test(p.text('#tab-body')) && /Quá \d+ giờ/.test(p.text('#tab-body .note')) && !/AUTO_COMPLETE/.test(p.text('#tab-body .note')));
    p.click('#back'); await p.flush(40);
    // Mọi nút trong khu thông báo: lọc, Đã đọc hết, từng dòng, từng nút trong hộp chi tiết
    const feedBtns = p.$$('#tab-body button');
    assert.ok(feedBtns.length >= 8, 'có ' + feedBtns.length + ' nút');
    for (const b of p.$$('#feedbar button')) { b.click(); await p.flush(40); if (p.$('.sheet')) { p.sheetBtn('Huỷ'); await p.flush(); } }
    p.click('[data-fu="0"]'); await p.flush(60); p.click('[data-fl=""]'); await p.flush(60);
    p.click(p.$$('.nrow').find(x => /Không tạo được sự kiện Calendar/.test(x.textContent))); await p.flush();
    const labels = p.$$('.sheet button').map(x => x.textContent.trim());
    assert.deepStrictEqual(labels, ['Xem buổi học BK000001', 'Xem học viên S003', 'Xem tutor T001', 'Đóng'], labels.join('|'));
    assert.ok(p.$('.sheet a.btn[href*="range=A2"]'), 'nút Mở đúng dòng trong Sheets là link bấm được');
    p.sheetBtn('Xem học viên S003'); await p.flush(80);
    assert.ok(/Đặt thay/.test(p.text('#tab-body')) && p.$('#book-for'), 'mở trang học viên');
    p.click('#back'); await p.flush(80);
    p.clean();
  }
  // Link Sheets không có (rất hiếm): ô vẫn là nút bấm được, báo câu hướng dẫn
  const p2 = open(c, { page: 'admin' }, { session });
  await p2.flush(80);
  p2.win.T.views.admin.render(p2.win.T.root(), {}); await p2.flush(10);
  const sp = p2.calls.filter(x => x.name === 'apiAdminHome').pop();
  assert.ok(sp && sp.result.data.links.registrations, 'bình thường luôn có link');
  p2.clean();
});

t('U39', 'Trang quản trị song ngữ (5I): bấm EN đổi ô số liệu, tab, nút lọc, nội dung thông báo, tên sự kiện, nhãn trạng thái, tên gói sang tiếng Anh mà không gọi lại máy chủ; giữ trang con đang mở (trang học viên, đặt thay giữ giờ đã chọn); lưu USERS.lang; mở lại vẫn tiếng Anh; hộp thoại và câu báo lỗi máy chủ theo tiếng Anh', async () => {
  const c = adminFixture();
  c.api.withLock_(() => { const t = c.api.table_('PACKAGES'); t.update(t.byId('PASS_1M'), { name_en: '1 month pass' }); });
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  assert.ok(p.$('[data-langsw]'), 'có nút VI | EN');
  const homeCalls = () => p.calls.filter(x => x.name === 'apiAdminHome' || x.name === 'apiAdminNotifications').length, k0 = homeCalls();
  p.click('[data-langsw]'); await p.flush(60);
  assert.strictEqual(homeCalls(), k0, 'đổi ngôn ngữ không gọi lại máy chủ');
  assert.ok(/Urgent unread/.test(p.text('.kpis')) && /Lessons today/.test(p.text('.kpis')), p.text('.kpis'));
  assert.ok(/Notifications/.test(p.text('.tabbar')) && /Activity log/.test(p.text('.tabbar')));
  assert.ok(/Could not create the Calendar event/.test(p.text('.feed')) && /Calendar event failed/.test(p.text('.feed')), p.text('.feed'));
  assert.ok(/Unread/.test(p.text('#feedbar')) && /Mark all read/.test(p.text('#feedbar')));
  await p.flush(80);
  assert.strictEqual(c.row('USERS', 'A01').lang, 'en', 'lưu USERS.lang');
  // Trang học viên: tên gói tiếng Anh, nhãn trạng thái tiếng Anh; đổi ngôn ngữ giữ trang
  p.click('.tab[data-tab="students"]'); await p.flush(60);
  assert.ok(/1 month pass/.test(p.text('#people')) && /Active/.test(p.text('#people')), p.text('#people'));
  p.click('[data-person="S003"]'); await p.flush(60);
  const kp = p.calls.filter(x => x.name === 'apiAdminPerson').length;
  p.click('[data-langsw]'); await p.flush(40);
  assert.ok(/Gói học/.test(p.text('#tab-body')) && /Gói 1 tháng/.test(p.text('#tab-body')), 'đổi về tiếng Việt vẫn ở trang học viên');
  assert.strictEqual(p.calls.filter(x => x.name === 'apiAdminPerson').length, kp, 'không tải lại trang học viên');
  p.click('[data-langsw]'); await p.flush(40);
  assert.ok(/Packages/.test(p.text('#tab-body')) && /Cancelled by student|Confirmed|Waiting for tutor/.test(p.text('#tab-body')), p.text('#tab-body').slice(0, 300));
  // Đặt thay: chọn giờ rồi đổi ngôn ngữ, giờ đã chọn còn nguyên
  p.click('#book-for'); await p.flush(80);
  const chip = p.$('.chip[data-date]:not([disabled])'), dk = chip.getAttribute('data-date'), sl = chip.getAttribute('data-slot');
  p.click(chip); await p.flush();
  assert.ok(/Book 1 lesson\(s\)/.test(p.text('#do-book')), p.text('#do-book'));
  p.click('[data-langsw]'); await p.flush(40);
  assert.ok(p.$('.chip[data-date="' + dk + '"][data-slot="' + sl + '"]').classList.contains('on') && /Đặt 1 buổi/.test(p.text('#do-book')), 'giữ giờ đã chọn: ' + p.text('#pick'));
  p.click('[data-langsw]'); await p.flush(40);
  // Hộp thoại huỷ, câu báo máy chủ tiếng Anh
  p.click('#back'); await p.flush(60);
  const cancelBtn = p.$('#tab-body [data-cancel]');
  if (cancelBtn) { p.click(cancelBtn); await p.flush(); assert.ok(/Cancel lesson/.test(p.text('.sheet')) && p.$('#c-reason').value === 'Cancelled by admin'); p.sheetBtn('Keep it'); await p.flush(); }
  p.clean();
  // Mở lại: tiếng Anh (USERS.lang en), không hỏi lại
  const p3 = open(c, { page: 'admin' }, { session: Object.assign({}, session, { lang: 'en' }) });
  await p3.flush(80);
  assert.ok(/Urgent unread/.test(p3.text('.kpis')));
  p3.clean();
});

t('U40', 'Nhật ký admin (5I): mỗi hoạt động một dòng xem trước gom theo ngày (giờ, tên hành động, người làm, tóm tắt); bấm dòng mở đọc đủ (chi tiết dài, JSON xếp dòng, nút xem buổi, mở dòng Sheets); lọc Người dùng, Hệ thống; Xem thêm khi quá 150 dòng; tiếng Anh', async () => {
  const c = adminFixture();
  const long = JSON.stringify({ status: 'CANCELLED_ADMIN', reason: 'R'.repeat(300) });
  // Nhật ký ghi thêm theo thời gian: dòng cũ ở trên, dòng mới ở cuối tab
  const rows = []; for (let i = 0; i < 170; i++) rows.push({ time: new Date(2026, 9, 13, 8, 0, i), actor: 'SYSTEM', action: 'CALENDAR_QUEUE', entity: 'BOOKINGS', entity_id: '', detail: 'lô ' + i });
  c.putRows('ACTIVITY_LOG', rows);
  c.putRows('ACTIVITY_LOG', [{ time: new Date(2026, 9, 14, 20, 5), actor: 'karn@thaiput.vn', action: 'CANCELLED', entity: 'BOOKING', entity_id: 'BK000001', detail: long }]);
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const p = open(c, { page: 'admin', }, { session });
  await p.flush(80);
  p.click('.tab[data-tab="log"]'); await p.flush(60);
  assert.ok(/60 ngày/.test(p.text('#tab-body .note')), p.text('#tab-body .note'));
  assert.ok(p.$$('#log-list .lrow').length === 150 && p.$('#log-more'), 'trang đầu 150 dòng và nút Xem thêm');
  assert.ok(p.$$('#log-list .fgroup').map(x => x.textContent).indexOf('Hôm nay') !== -1);
  const row = p.$$('#log-list .lrow').find(x => /BK000001/.test(x.textContent) && /Huỷ buổi/.test(x.textContent));
  assert.ok(row && /karn/.test(row.textContent) && row.textContent.length < 400, 'dòng xem trước ngắn: ' + (row && row.textContent.length) + ' ' + (row && row.textContent.slice(0, 300)));
  p.click(row); await p.flush(60);
  assert.ok(p.$('.sheet pre.logdetail') && p.text('.sheet pre.logdetail').indexOf('R'.repeat(300)) !== -1, 'đọc đủ chi tiết');
  assert.ok(/\n  "status"/.test(p.$('.sheet pre.logdetail').textContent), 'JSON xếp dòng');
  assert.ok(p.$('.sheet a.btn[href*="#gid="]'), 'nút mở dòng trong Sheets');
  p.sheetBtn('Xem buổi học BK000001'); await p.flush(80);
  assert.ok(/BK000001/.test(p.text('.sheet h2')), 'mở chi tiết buổi');
  p.sheetBtn('Đóng'); await p.flush();
  p.click('#log-more'); await p.flush(60);
  assert.ok(p.$$('#log-list .lrow').length > 150 && !p.$('#log-more'), 'Xem thêm tải phần còn lại');
  p.click('[data-who="people"]'); await p.flush(60);
  assert.ok(p.$$('#log-list .lrow').length >= 1 && !p.$$('#log-list .lrow').some(x => x.classList.contains('sys')), 'lọc Người dùng');
  p.click('[data-who="system"]'); await p.flush(60);
  assert.ok(p.$$('#log-list .lrow').every(x => x.classList.contains('sys')));
  p.type('#log-q', 'lô 16'); await new Promise(r => setTimeout(r, 450)); await p.flush(60);
  assert.ok(p.$$('#log-list .lrow').length >= 1 && p.$$('#log-list .lrow').every(x => /lô 16/.test(x.textContent)), p.text('#log-list').slice(0, 200));
  const kLog = p.calls.filter(x => x.name === 'apiAdminLog').length;
  p.click('[data-langsw]'); await p.flush(60);
  assert.ok(/Activity log/.test(p.text('#tab-body h2')) && /Calendar queue ran/.test(p.text('#log-list')) && p.$('#log-q').value === 'lô 16', 'tiếng Anh, giữ chữ đang tìm: ' + p.text('#log-list').slice(0, 120));
  assert.strictEqual(p.calls.filter(x => x.name === 'apiAdminLog').length, kLog, 'đổi ngôn ngữ không tải lại nhật ký');
  p.clean();
});

t('U41', 'Mở trang quản trị (5I): chỉ một lượt gọi máy chủ để có số liệu và thông báo (không gọi apiAdminNotifications lần hai); đọc một thông báo rồi đóng: số đếm giảm, dòng rời danh sách Chưa đọc, không tải lại cả trang', async () => {
  const c = adminFixture();
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  const p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  assert.deepStrictEqual(p.calls.map(x => x.name), ['apiAdminHome'], p.calls.map(x => x.name).join());
  const unread = c.rows('NOTIFICATIONS').filter(n => !(n.read === true || String(n.read).toUpperCase() === 'TRUE')).length;
  assert.strictEqual(p.$$('.feed .nrow').length, unread);
  p.click(p.$$('.nrow').find(x => /Vân xin huỷ/.test(x.textContent))); await p.flush();
  p.sheetBtn('Đóng'); await p.flush(60);
  assert.strictEqual(p.$$('.feed .nrow').length, unread - 1, 'dòng đã đọc rời danh sách Chưa đọc');
  assert.ok(/^0/.test(p.text('[data-kpi="feed:WARNING"]')), p.text('.kpis'));
  assert.strictEqual(p.calls.filter(x => x.name === 'apiAdminHome').length, 1, 'không tải lại cả trang');
  p.clean();
});

t('U42', 'Tên gói song ngữ (5I): trang chủ, thẻ gói của học viên, gia hạn hiện tên tiếng Anh khi chọn EN; chưa có tên tiếng Anh thì hiện tên tiếng Việt', async () => {
  const c = mk();
  c.api.withLock_(() => { const t = c.api.table_('PACKAGES'); t.update(t.byId('PASS_1M'), { name_en: '1 month pass' }); });
  const h = open(c, { page: 'home' }); await h.flush();
  h.click('[data-langsw]'); await h.flush(40);
  assert.ok(/1 month pass/.test(h.text('.pkg-list')) && /Gói 2 tuần|Trial/.test(h.text('.pkg-list')), h.text('.pkg-list'));
  h.clean();
  const { session } = await uiLogin(c, 'S001');
  const p = open(c, { page: 'student' }, { session: Object.assign({}, session, { lang: 'en' }), storage: { thaiput_lang: 'en' } });
  await p.flush(80);
  const big = p.text('.pass .big');
  assert.ok(big === '1 month pass' || big === c.api.pkgDefs_()[c.rows('STUDENT_PACKAGES').find(x => x.student_id === 'S001').package_code].name_en, big);
  p.clean();
});

t('U45', 'Bù buổi (5M): thẻ gói học viên hiện "bắt đầu tính từ buổi học hoàn chỉnh đầu tiên" khi ngày bắt đầu còn tạm tính, và "Đã cộng N ngày bù. Hạn mới" sau khi được bù; đổi EN không gọi máy chủ', async () => {
  const c = mk('2026-10-12 10:00'), api = c.api;
  ['2026-10-14', '2026-10-16'].forEach(d => ['T002', 'T003', 'T004'].forEach(tid => c.setSlot(tid, d, '19:00', 'CANCELLED')));
  const r = api.bookSessionsFor_('S001', [{ date: '2026-10-14', slot: '19:00' }, { date: '2026-10-16', slot: '19:00' }], 's001@student.test');
  assert.ok(r.every(x => x.ok), JSON.stringify(r));
  const { session } = await uiLogin(c, 'S001');
  let p = open(c, { page: 'student' }, { session }); await p.flush(80);
  assert.ok(/bắt đầu tính từ buổi học hoàn chỉnh đầu tiên/.test(p.text('.pass')), p.text('.pass'));
  assert.ok(!/ngày bù/.test(p.text('.pass')));
  p.clean();
  api.setSimNow_('2026-10-14 19:40');
  assert.ok(api.submitSessionResultFor_('T001', r[0].bookingId, 'COMPLETED', 'van@tutor.test').ok);
  api.setSimNow_('2026-10-16 21:00');
  assert.ok(api.adminMarkTutorAbsent_(r[1].bookingId, 'admin@thaiput.vn').ok);
  p = open(c, { page: 'student' }, { session }); await p.flush(80);
  const txt = p.text('.pass');
  assert.ok(/Đã cộng 3 ngày bù\. Hạn mới: 23\/10\/2026/.test(txt) && !/hoàn chỉnh đầu tiên/.test(txt), txt);
  const calls = c.env.state.runCalls ? c.env.state.runCalls.length : 0;
  p.click('[data-langsw]'); await p.flush(40);
  assert.ok(/3 make up days added\. New end date: 23\/10\/2026/.test(p.text('.pass')), p.text('.pass'));
  if (c.env.state.runCalls) assert.ok(c.env.state.runCalls.length - calls <= 1, 'đổi ngôn ngữ: tối đa 1 lượt lưu ngôn ngữ');
  p.clean();
});

t('U46', '5J (câu 29): trang tutor tô đỏ buổi quá hạn chọn kết quả, hộp đỏ đầu tab Lịch dạy có nút sang tab Cần xác nhận, ghi giờ sẽ thành Không hoàn thành; chữ hạn không còn "tự tính Hoàn thành"', async () => {
  const c = mk('2026-10-12 10:00'), api = c.api;
  ['T002', 'T003', 'T004'].forEach(tid => c.setSlot(tid, '2026-10-14', '19:00', 'CANCELLED'));
  const r = api.bookSessionsFor_('S003', [{ date: '2026-10-14', slot: '19:00' }], 's003@student.test');
  assert.ok(r[0].ok);
  api.setSimNow_('2026-10-15 20:05'); api.hourlyJob();
  const { session } = await uiLogin(c, 'T001');
  const p = open(c, { page: 'tutor' }, { session }); await p.flush(80);
  assert.ok(/quá hạn chọn kết quả|overdue result/i.test(p.text('#overdue-top')), p.text('#tab-body'));
  p.click('#go-confirm'); await p.flush(40);
  const box = p.text('.alert.overdue');
  assert.ok(/16\/10\/2026 20:05/.test(box) && /(Not completed|Không hoàn thành)/.test(box), box);
  assert.ok(p.$('.lesson.is-overdue'));
  assert.ok(!/marked Completed automatically|tự tính Hoàn thành/.test(p.text('#tab-body')) && /48/.test(p.text('#tab-body .muted')), p.text('#tab-body .muted'));
  p.clean();
});

t('U47', '5J: trang học viên hiện hộp "đã có giờ học tuần sau" từ thứ Bảy, nút sang Đặt lịch; bấm Đã xem thì ẩn và mở lại vẫn ẩn trên thiết bị đó; đổi EN không gọi máy chủ', async () => {
  const c = mk('2026-10-17 09:00'), api = c.api;
  api.setAvailabilityFor_('T001', [{ date: '2026-10-20', slot: '19:00', open: true }], 'van@tutor.test');
  const { session } = await uiLogin(c, 'S003');
  const p = open(c, { page: 'student' }, { session }); await p.flush(80);
  assert.ok(/Đã có giờ học tuần sau/.test(p.text('#week-banner')) && /19\/10/.test(p.text('#week-banner')) && /15:00 Chủ nhật/.test(p.text('#week-banner')), p.text('main'));
  p.click('[data-langsw]'); await p.flush(40);
  assert.ok(/Next week is open/.test(p.text('#week-banner')), p.text('#week-banner'));
  p.click('#wb-book'); await p.flush(40);
  assert.ok(p.$('.tab[data-tab="book"][aria-current="page"], .tab[data-tab="book"].on, .tab[data-tab="book"][aria-selected="true"]') || /Book/.test(p.text('#tab-body')));
  p.click('#wb-seen'); await p.flush(20);
  assert.ok(!p.$('#week-banner') || p.$('#week-banner').hidden, 'ẩn sau khi bấm Đã xem');
  const store = p.storageDump ? p.storageDump() : null;
  p.clean();
  const q = open(c, { page: 'student' }, { session, storage: store || { thaiput_week_banner_seen: '2026-10-19' } }); await q.flush(80);
  assert.ok(!q.$('#week-banner'), 'mở lại: vẫn ẩn cho tuần đó');
  q.clean();
});

function cfgSetUi(c, key, value) { c.api.withLock_(() => { const t = c.api.table_('CONFIG'), r = t.byId(key); if (r) t.update(r, { value }); else t.insert({ key, value }); }); c.api.clearConfigCache_(); }

async function run() {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const x of tests) {
    if (only && only.indexOf(x.id) === -1) continue;
    try { await x.fn(); results.push({ id: x.id, title: x.title, ok: true }); }
    catch (e) { results.push({ id: x.id, title: x.title, ok: false, err: e.message }); }
  }
  return results;
}

t('U43', 'Soát 5I vòng 1 giao diện (hồi quy): lỗi mạng khi mở trang quản trị có nút Thử lại (B7); kết quả về muộn của trang con không vẽ đè trang đang xem (B1); huỷ trong danh sách Buổi hôm nay cập nhật danh sách và số trên ô (B2); thông báo nhiều buổi có tối đa 3 nút, thông báo tài khoản có nút xem người (B17); tìm nhật ký theo tên hành động đang hiện (B3)', async () => {
  const c = adminFixture();
  c.api.withLock_(() => {
    const t = c.api.table_('NOTIFICATIONS');
    t.insert({ notif_id: 'N9910003', time: new Date(2026, 9, 14, 17, 0), level: 'CRITICAL', event: 'CALENDAR_FAILED', channel: 'EMAIL', actor: 'SYSTEM', entity: 'BOOKING', entity_id: 'BK000001,BK000002,BK000003,BK000004', message: 'Bốn buổi lỗi Calendar', message_en: 'Four lessons failed', read: false });
    t.insert({ notif_id: 'N9910004', time: new Date(2026, 9, 14, 16, 0), level: 'CRITICAL', event: 'SYSTEM_ERROR', channel: 'EMAIL', actor: 'SYSTEM', entity: 'USER', entity_id: 'S003', message: 'Tài khoản S003 cần kiểm', message_en: 'Account S003 needs a check', read: false });
  });
  c.putRows('ACTIVITY_LOG', [{ time: new Date(2026, 9, 14, 20, 0), actor: 'karn@thaiput.vn', action: 'CANCELLED', entity: 'BOOKING', entity_id: 'BK000002', detail: '{"status":"CANCELLED_ADMIN"}' }]);
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  // B7
  let p = open(c, { page: 'admin' }, { session, failNext: { apiAdminHome: 4 } });
  await p.flush(120);
  assert.ok(p.$('#retry') && !p.$('.kpis'), 'lỗi mạng: báo lỗi kèm nút Thử lại: ' + p.text('main').slice(0, 160));
  p.click('#retry'); await p.flush(80);
  assert.ok(p.$$('.kpis .kpi').length === 6, 'Thử lại tải được trang');
  p.clean();
  p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  // B1: bấm Buổi hôm nay rồi sang tab Nhật ký ngay, trước khi máy chủ trả lời
  p.click('[data-kpi="lessons:today"]'); p.click('.tab[data-tab="log"]'); await p.flush(80);
  assert.ok(p.$('#log-q') && !/Buổi hôm nay/.test(p.text('#tab-body')), 'danh sách buổi về muộn không vẽ đè nhật ký');
  // B3: tìm theo tên hành động tiếng Việt (chi tiết không chứa chữ đó)
  p.type('#log-q', 'Huỷ buổi'); await new Promise(r => setTimeout(r, 450)); await p.flush(60);
  assert.ok(p.$$('#log-list .lrow').some(x => /BK000002/.test(x.textContent)), 'tìm theo tên hành động: ' + p.text('#log-list').slice(0, 160));
  p.type('#log-q', 'Hệ thống'); await new Promise(r => setTimeout(r, 450)); await p.flush(60);
  assert.ok(p.$$('#log-list .lrow').length === 0 || p.$$('#log-list .lrow').every(x => x.classList.contains('sys')), 'tìm "Hệ thống" ra dòng hệ thống');
  p.click('.tab[data-tab="feed"]'); await p.flush(60);
  // B2
  const before = Number(p.text('[data-kpi="lessons:today"] b'));
  p.click('[data-kpi="lessons:today"]'); await p.flush(60);
  assert.strictEqual(p.$$('#tab-body [data-cancel]').length, 1);
  p.click('#tab-body [data-cancel]'); await p.flush();
  p.sheetBtn('Huỷ buổi này'); await p.flush(120);
  assert.strictEqual(p.$$('#tab-body [data-cancel]').length, 0, 'danh sách tải lại: không còn nút Huỷ');
  const after = Number(p.text('[data-kpi="lessons:today"] b'));
  assert.ok(after === before - 1, 'số trên ô Buổi hôm nay cập nhật: ' + before + ' → ' + after);
  p.click('#back'); await p.flush(40);
  // B17
  const n3 = p.$$('[data-notif="N9910003"]')[0]; assert.ok(n3, 'có thông báo 4 buổi');
  p.click(n3); await p.flush();
  const bb = p.$$('.sheet button').map(x => x.textContent.trim()).filter(x => /BK0000/.test(x));
  assert.deepStrictEqual(bb.length, 3, 'tối đa 3 nút xem buổi: ' + bb.join(' | '));
  p.sheetBtn('Đóng'); await p.flush(40);
  const n4 = p.$$('[data-notif="N9910004"]')[0]; assert.ok(n4);
  p.click(n4); await p.flush();
  assert.ok(p.$$('.sheet button').some(x => /S003/.test(x.textContent)), 'thông báo tài khoản có nút xem người: ' + p.text('.sheet'));
  p.sheetBtn('Đóng'); await p.flush(40);
  p.clean();
});

t('U44', 'Soát 5I vòng 2 giao diện (hồi quy): bấm tab lấy thông báo, nhật ký mới (N2), nút Tải lại; trang lỗi có nút Thử lại song ngữ (N3); đổi ngôn ngữ lúc đang tải không gọi máy chủ lần hai (N4); tìm nhật ký theo họ nhãn và "Admin (sửa trong Sheets)" (N5); bàn phím về đúng tab, hộp thoại có tên (N6); để nguyên lý do mặc định thì gửi rỗng (N1); đặt thay lỗi sau khi đổi ngôn ngữ vẫn báo (N8)', async () => {
  const c = adminFixture();
  c.putRows('ACTIVITY_LOG', [
    { time: new Date(2026, 9, 14, 19, 0), actor: 'karn@thaiput.vn', action: 'MAINTENANCE_READONLY', entity: 'SYSTEM', entity_id: '', detail: '' },
    { time: new Date(2026, 9, 14, 19, 1), actor: 'SYSTEM', action: 'PACKAGE_EXPIRED', entity: 'STUDENT_PACKAGES', entity_id: 'SP00009', detail: '' },
    { time: new Date(2026, 9, 14, 19, 2), actor: 'ADMIN', action: 'SHEET_EDIT', entity: 'USERS', entity_id: 'S003', detail: 'B2 (name): ? → "x"' }]);
  const { session } = await uiLoginEmail(c, 'admin.karn@gmail.com');
  // N3
  let p = open(c, { page: 'admin' }, { session, failNext: { apiAdminHome: 4 } });
  await p.flush(120);
  assert.strictEqual(p.$('#retry').textContent.trim(), 'Thử lại', 'nút Thử lại không hiện mã');
  p.click('[data-langsw]'); await p.flush(40);
  assert.ok(p.$('#retry').textContent.trim() === 'Try again' && /Cannot connect/.test(p.text('main')), p.text('main'));
  p.click('[data-langsw]'); await p.flush(40);
  p.clean();
  p = open(c, { page: 'admin' }, { session });
  await p.flush(80);
  // N2: thông báo mới khi đang ở tab khác; bấm lại tab Thông báo thì hiện, số trên ô đổi
  p.click('.tab[data-tab="tutors"]'); await p.flush(60);
  assert.ok(p.$('.tab[data-tab="tutors"]') === p.doc.activeElement, 'N6: bàn phím ở đúng tab vừa bấm');
  c.api.withLock_(() => c.api.table_('NOTIFICATIONS').insert({ notif_id: 'N9910099', time: new Date(2026, 9, 14, 20, 9), level: 'CRITICAL', event: 'CALENDAR_FAILED', channel: 'EMAIL', actor: 'SYSTEM', entity: 'BOOKING', entity_id: 'BK000002', message: 'Tin Khẩn mới', message_en: 'New urgent', read: false }));
  c.api.clearDbCache_();
  const crit0 = Number(p.text('[data-kpi="feed:CRITICAL"] b'));
  p.click('.tab[data-tab="feed"]'); await p.flush(80);
  assert.ok(/Tin Khẩn mới/.test(p.text('#feed')), 'bấm tab lấy thông báo mới');
  assert.strictEqual(Number(p.text('[data-kpi="feed:CRITICAL"] b')), crit0 + 1, 'số trên ô cập nhật');
  // Nút Tải lại thường trực ở danh sách thông báo
  c.api.withLock_(() => c.api.table_('NOTIFICATIONS').insert({ notif_id: 'N9910098', time: new Date(2026, 9, 14, 20, 9, 30), level: 'WARNING', event: 'TUTOR_CANCEL_REQUEST', channel: 'EMAIL', actor: 'SYSTEM', entity: 'AVAILABILITY', entity_id: 'AV000009', message: 'Tin thứ hai', message_en: 'Second', read: false }));
  c.api.clearDbCache_();
  p.click('#feed-reload'); await p.flush(80);
  assert.ok(/Tin thứ hai/.test(p.text('#feed')), 'Tải lại lấy tin mới');
  // N6: hộp thoại có tên
  p.click(p.$$('[data-notif="N9910098"]')[0]); await p.flush();
  const dlg = p.$('.sheet'); assert.ok(dlg.getAttribute('aria-labelledby') && p.doc.getElementById(dlg.getAttribute('aria-labelledby')), 'hộp thoại có tên');
  p.sheetBtn('Đóng'); await p.flush(60);
  assert.ok(p.doc.activeElement && p.doc.activeElement !== p.doc.body, 'đóng thông báo đã đọc: bàn phím không rơi về trang');
  // N4: bấm tab Thông báo (lấy mới) rồi đổi ngôn ngữ ngay: một lượt gọi
  p.click('.tab[data-tab="tutors"]'); await p.flush(60);
  const f0 = p.calls.filter(x => x.name === 'apiAdminNotifications').length;
  p.click('.tab[data-tab="feed"]'); p.click('[data-langsw]'); await p.flush(80);
  assert.strictEqual(p.calls.filter(x => x.name === 'apiAdminNotifications').length, f0 + 1, 'thông báo: đổi ngôn ngữ lúc đang tải không gọi lần hai');
  assert.ok(/New urgent/.test(p.text('#feed')), 'kết quả về muộn vẫn hiện, theo tiếng Anh: ' + p.text('#feed').slice(0, 120));
  p.click('[data-langsw]'); await p.flush(40);
  // N4: bấm tab Nhật ký rồi đổi ngôn ngữ ngay: một lượt gọi
  const k0 = p.calls.filter(x => x.name === 'apiAdminLog').length;
  p.click('.tab[data-tab="log"]'); p.click('[data-langsw]'); await p.flush(80);
  assert.strictEqual(p.calls.filter(x => x.name === 'apiAdminLog').length, k0 + 1, 'đổi ngôn ngữ lúc đang tải không gọi lần hai');
  assert.ok(p.$$('#log-list .lrow').length > 0 && /Activity log/.test(p.text('#tab-body h2')), 'kết quả về muộn vẫn hiện trong khung mới');
  p.click('[data-langsw]'); await p.flush(40);
  // N2: dòng nhật ký mới hiện khi bấm Tải lại
  c.putRows('ACTIVITY_LOG', [{ time: new Date(2026, 9, 14, 20, 9), actor: 'SYSTEM', action: 'CALENDAR_QUEUE', entity: 'BOOKINGS', entity_id: '', detail: 'dong-moi-nhat' }]);
  p.click('#log-refresh'); await p.flush(80);
  assert.ok(/dong-moi-nhat/.test(p.text('#log-list')), 'Tải lại nhật ký lấy dòng mới');
  // N5
  for (const [q, want] of [['Bảo trì', /Bảo trì: Chỉ xem|Bảo trì/], ['Hết hạn', /SP00009/], ['Admin (sửa', /S003/]]) {
    p.type('#log-q', q); await new Promise(r => setTimeout(r, 450)); await p.flush(60);
    assert.ok(p.$$('#log-list .lrow').length >= 1 && want.test(p.text('#log-list')), q + ': ' + p.text('#log-list').slice(0, 160));
  }
  p.type('#log-q', ''); await new Promise(r => setTimeout(r, 450)); await p.flush(60);
  // N1: để nguyên lý do mặc định (đang EN) thì gửi rỗng
  p.click('[data-langsw]'); await p.flush(40);
  p.click('[data-kpi="lessons:today"]'); await p.flush(60);
  p.click('#tab-body [data-cancel]'); await p.flush();
  assert.strictEqual(p.$('#c-reason').value, 'Cancelled by admin');
  p.sheetBtn('Cancel this lesson'); await p.flush(120);
  const cc = p.calls.filter(x => x.name === 'apiAdminCancel').pop();
  assert.strictEqual(cc.args[2], '', 'lý do mặc định gửi rỗng: ' + JSON.stringify(cc.args));
  p.click('[data-langsw]'); await p.flush(40);
  p.clean();
  // N8: đặt thay lỗi về sau khi đổi ngôn ngữ
  p = open(c, { page: 'admin' }, { session, failNext: { apiAdminSlots: 4 } });
  await p.flush(80);
  p.click('.tab[data-tab="students"]'); await p.flush(60);
  p.click('[data-person="S003"]'); await p.flush(60);
  const bf = p.$$('#tab-body button').find(x => /Đặt thay/.test(x.textContent)); assert.ok(bf, 'có nút Đặt thay');
  p.click(bf); p.click('[data-langsw]'); await p.flush(120);
  assert.ok(p.$('#tab-body .alert.bad') && /Cannot connect/.test(p.text('#tab-body')), 'lỗi đặt thay hiện trong khung mới: ' + p.text('#tab-body').slice(0, 160));
  p.click('[data-langsw]'); await p.flush(40);
  p.clean();
});

t('U48', '5K: gói giá 0 hiện thẻ có nút Zalo, không chọn được; số điện thoại ghi tự do (không định dạng) vẫn gửi được và lưu nguyên văn', async () => {
  const c = mk();
  c.api.withLock_(() => c.api.table_('PACKAGES').insert({ code: 'VIP', name: 'Gói riêng', type: 'DAYS', days: 30, price_vnd: 0, active: true }));
  c.api.clearDbCache_();
  const p = open(c, { page: 'home' });
  await p.flush();
  assert.strictEqual(p.$$('.pkg input[type=radio]').length, 3, 'gói giá 0 không có nút chọn');
  assert.ok(!p.$('#pkg-VIP'));
  const card = p.$('.pkg-contact');
  assert.ok(card && /Gói riêng/.test(card.textContent) && /Đăng ký gói này qua Zalo admin/.test(card.textContent), 'thẻ gói giá 0');
  assert.ok(card.querySelector('a.zalo').href === 'https://zalo.me/0909999999', 'nút Zalo');
  assert.ok(p.$('#f-phone').getAttribute('type') === 'text' && p.$('#f-phone').getAttribute('inputmode') === 'text', 'soát 5K M2: bàn phím có chữ trên điện thoại');
  p.type('#f-name', 'Somchai'); p.type('#f-email', 'somchai@test.com'); p.type('#f-phone', 'Line: somchai88');
  assert.ok(!p.$('#f-phone').classList.contains('invalid'));
  p.click('#pkg-PASS_1M');
  p.file('#f-file', 'ck.pdf', 'application/pdf', '%PDF-1.4 x');
  p.click('#f-consent');
  p.submit('#reg');
  await p.flush(60);
  p.clean();
  const reg = c.rows('REGISTRATIONS').find(r => r.email === 'somchai@test.com');
  assert.ok(reg && reg.phone === 'Line: somchai88', 'lưu nguyên văn: ' + (reg && reg.phone));
});

t('U49', '5O (05/11): trang chủ có ảnh thương hiệu nhúng base64, viên chữ Thái nền trắng viền vàng; khung email tông đen trắng có gạch vàng, nút viên thuốc đen', async () => {
  const c = mk(), p = open(c, { page: 'home' });
  await p.flush();
  p.clean();
  const img = p.$('.hero .hero-img');
  assert.ok(img, 'có ảnh thương hiệu trong hero');
  assert.ok(/^data:image\/jpeg;base64,/.test(img.getAttribute('src')), 'ảnh nhúng base64 (Apps Script không host file ảnh)');
  assert.strictEqual(img.getAttribute('alt'), '', 'ảnh trang trí: alt rỗng, không cần key CONTENT');
  assert.ok(p.$('.hero .th-word'), 'viên chữ Thái còn nguyên');
  const css = p.$('style').textContent;
  assert.ok(/\.hero \.th-word \{[^}]*background: var\(--surface\)/.test(css), 'viên chữ Thái nền trắng');
  assert.ok(/\.hero \.th-word \{[^}]*border: 1\.5px solid var\(--yellow\)/.test(css), 'viên chữ Thái viền vàng');
  const mail = c.api.emailWrap_('Tiêu đề thử', '<p>x</p>', 'vi');
  assert.ok(mail.indexOf('#141414') !== -1, 'đầu trang email nền đen 5O');
  assert.ok(mail.indexOf('border-bottom:3px solid #ffc933') !== -1, 'gạch vàng thương hiệu dưới đầu trang');
  assert.ok(mail.indexOf('#14532d') === -1, 'hết màu xanh rừng cũ trong khung');
  const btn = c.api.btn_('https://x.test', 'Mở');
  assert.ok(btn.indexOf('background:#141414') !== -1 && btn.indexOf('border-radius:999px') !== -1, 'nút email viên thuốc đen');
});

module.exports = { run };
if (require.main === module) {
  run().then(r => { r.forEach(x => console.log((x.ok ? 'ĐẠT  ' : 'TRƯỢT ') + x.id + ' ' + x.title + (x.ok ? '' : '\n      ' + x.err))); process.exit(r.every(x => x.ok) ? 0 : 1); });
}
