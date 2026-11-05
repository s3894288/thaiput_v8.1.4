/**
 * build_demo.js · Ghép bản demo xem được trên điện thoại (chunk 4)
 *
 *   node test/build_demo.js      → demo/thaiput_demo.html
 *
 * Lấy nguyên các file src/ui/*.html của sản phẩm (không chép tay), thay máy chủ Apps Script bằng demo/demo_mock.js
 * và thêm thanh chuyển vai trò (Khách, Học viên, Tutor) ở đầu trang. Sửa giao diện thật thì chạy lại lệnh này là demo cập nhật.
 * File ra là đoạn HTML không có thẻ html/head/body vì trang Artifact tự bọc khung; mở trực tiếp bằng trình duyệt vẫn chạy.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ui = (n) => fs.readFileSync(path.join(ROOT, 'src', 'ui', n + '.html'), 'utf8');
const mock = fs.readFileSync(path.join(ROOT, 'demo', 'demo_mock.js'), 'utf8');
const { load } = require('./load');
// Chữ web cả hai thứ tiếng như máy chủ gửi (key → [vi, en]), kể cả câu báo lỗi r.MÃ.
const contentDefaults = (() => { const api = load().api, d = api.contentDefaults_(), out = {}; Object.keys(d).forEach(k => { out[k] = [d[k].vi, d[k].en]; }); return out; })();
const version = (fs.readFileSync(path.join(ROOT, 'src', 'Config.gs'), 'utf8').match(/VERSION:\s*'([^']+)'/) || [])[1] || '';

const demoBar = `
<style>
.demo-bar { max-width: 560px; margin: 0 auto; padding-inline: 16px; padding-block: 10px 0; display: flex; flex-direction: column; gap: 8px; }
.demo-bar .seg { display: grid; width: 100%; grid-template-columns: repeat(4, 1fr); gap: 4px; background: var(--surface); border: 0; border-radius: 999px; padding: 4px; }
.demo-bar .seg button { appearance: none; border: 0; border-radius: 999px; justify-content: center; background: transparent; color: var(--ink); font: 600 .85rem/1.2 var(--font-body); padding: 9px 4px; min-height: 40px; cursor: pointer; }
.demo-bar .seg button[aria-pressed="true"] { background: var(--brand); color: var(--brand-ink); }
.demo-bar .meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: .78rem; color: var(--muted); }
.demo-bar .meta button { appearance: none; border: 0; background: none; color: var(--brand); font: 600 .78rem/1 var(--font-body); cursor: pointer; padding: 6px 0; }
@media (max-width: 400px) { .demo-bar .meta { flex-wrap: wrap; } }
.demo-bar .tag { font-weight: 600; color: var(--gold-ink); }
</style>
<div class="demo-bar" role="region" aria-label="Điều khiển bản demo" data-vi-aria="Điều khiển bản demo" data-en-aria="Demo controls">
  <div class="seg" role="group" aria-label="Xem với vai trò" data-vi-aria="Xem với vai trò" data-en-aria="View as">
    <button type="button" data-role="guest" aria-pressed="true" data-vi="Khách" data-en="Guest">Khách</button>
    <button type="button" data-role="student" aria-pressed="false" data-vi="Học viên" data-en="Student">Học viên</button>
    <button type="button" data-role="tutor" aria-pressed="false">Tutor</button>
    <button type="button" data-role="admin" aria-pressed="false">Admin</button>
  </div>
  <div class="meta"><span><span class="tag">Demo v${version}</span> · <span data-vi="dữ liệu giả, không gửi email" data-en="fake data, no emails">dữ liệu giả, không gửi email</span></span><button type="button" id="demo-reset" data-vi="Làm mới" data-en="Reset">Làm mới</button></div>
</div>`;

const demoScript = `
<script>
(function () {
  function mark(role) { document.querySelectorAll('.demo-bar [data-role]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-role') === role ? 'true' : 'false'); }); }
  function as(role) {
    mark(role);
    if (role === 'guest') { T.session.clear(); T.go('home'); return; }
    if (role === 'student') { T.session.set({ token: 'demo-student', role: 'STUDENT', name: 'Minh Anh' }); T.go('student', { tab: 'book' }); return; }
    if (role === 'admin') { T.session.set({ token: 'demo-admin', role: 'ADMIN', name: 'Karn' }); T.go('admin', { tab: 'feed' }); return; }
    T.session.set({ token: 'demo-tutor', role: 'TUTOR', name: 'Vân' }); T.go('tutor', { tab: 'schedule' });
  }
  // Thanh demo theo đúng một ngôn ngữ đang chọn (VI hoặc EN), đổi cùng lúc với nút VI | EN của trang.
  function demoLang() {
    var en = T.lang === 'en';
    document.querySelectorAll('.demo-bar [data-vi]').forEach(function (el) { el.textContent = el.getAttribute(en ? 'data-en' : 'data-vi'); });
    document.querySelectorAll('.demo-bar [data-vi-aria]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute(en ? 'data-en-aria' : 'data-vi-aria')); });
  }
  var origSetLang = T.setLang;
  T.setLang = function () { var r = origSetLang.apply(T, arguments); demoLang(); return r; };
  document.querySelectorAll('.demo-bar [data-role]').forEach(function (b) { b.onclick = function () { as(b.getAttribute('data-role')); }; });
  document.getElementById('demo-reset').onclick = function () { DEMO.reset(); T.toast(T.lang === 'en' ? 'Demo data reset' : 'Đã làm mới dữ liệu demo'); as(document.querySelector('.demo-bar [aria-pressed="true"]').getAttribute('data-role')); };
  // Đăng nhập trong demo: link email được thay bằng nút vào thẳng cổng tương ứng.
  var origLogin = T.views.login.render;
  T.views.login.render = function (root, o) {
    origLogin(root, o);
    var m = root.querySelector('main');
    var tip = document.createElement('div'); tip.className = 'alert';
    tip.innerHTML = T.lang === 'en' ? 'The demo sends no emails. Use the <b>Student</b> or <b>Tutor</b> button at the top to open a portal directly.' : 'Bản demo không gửi email. Dùng nút <b>Học viên</b> hoặc <b>Tutor</b> ở đầu trang để vào thẳng cổng.';
    m.appendChild(tip);
    mark('guest');
  };
  T.session.clear();
  T.start();
  demoLang();
})();
</script>`;

const out = [
  '<title>Thaiput Portal Demo</title>',
  '<meta name="color-scheme" content="light only">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Sans+Thai:wght@600&family=Noto+Sans+Thai+Looped:wght@600&display=swap">',
  ui('Styles'),
  demoBar,
  '<div id="app"></div>',
  '<script>var BOOT = { page: "home", linkToken: "", version: ' + JSON.stringify(version) + ', zalo: "https://zalo.me/0909000000", content: ' + JSON.stringify(contentDefaults).replace(/</g, '\\u003c') + ' };</script>',
  '<script>\n' + mock + '\n</script>',
  ui('App'), ui('Home'), ui('Login'), ui('Student'), ui('Tutor'), ui('Admin'),
  demoScript
].join('\n');

if (out.indexOf('<?') !== -1) throw new Error('Còn scriptlet Apps Script trong bản demo');
fs.writeFileSync(path.join(ROOT, 'demo', 'thaiput_demo.html'), out);
console.log('Đã ghi demo/thaiput_demo.html (' + Math.round(out.length / 1024) + ' KB)');
