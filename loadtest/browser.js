#!/usr/bin/env node
/**
 * loadtest/browser.js · Thử bằng trình duyệt thật (Playwright), đi đúng đường google.script.run của trang web (chunk 5G).
 *
 *   npm i playwright && npx playwright install chromium      (1 lần)
 *   node browser.js --url "https://script.google.com/macros/s/.../exec" --secret "KHOÁ" --users 10
 *
 * Mỗi người ảo: xin link đăng nhập của một học viên giả qua cổng thử tải, mở link trong một cửa sổ riêng, chờ cổng học viên,
 * bấm slot trống đầu tiên, bấm Đặt, chờ kết quả. Đo thời gian người dùng thật thấy, kể cả lần trình duyệt tự thử lại.
 *   --users N (mặc định 5, nên ≤ 15 trên một máy), --start K (mặc định 81: học viên lt0081 trở đi, menu tạo 100 học viên;
 *   run.js mặc định dùng lt0001 đến lt0030 nên hai script không đụng nhau), --headed (xem cửa sổ)
 * Không cần khi chỉ đo máy chủ: run.js nhẹ hơn nhiều. Dùng browser.js để thấy đúng trải nghiệm trên trang.
 */
'use strict';
const { post } = require('./run');

function args() {
  const a = process.argv.slice(2), o = { users: 5, start: 81, headed: false };
  for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (k === 'headed' || k === 'demo') { o[k] = true; continue; } o[k] = a[i + 1]; i++; }
  o.users = Number(o.users); o.start = Number(o.start);
  return o;
}
const pad = (n, w) => String(n).padStart(w, '0');

/** Trang web Apps Script nằm trong 2 lớp khung (iframe): tìm khung có #app. */
async function appFrame(page, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    for (const f of page.frames()) { try { if (await f.$('#app .tabbar, #app #maint-screen')) return f; } catch (e) { } }
    await page.waitForTimeout(300);
  }
  throw new Error('Không thấy cổng học viên sau ' + Math.round(timeout / 1000) + ' giây');
}

async function oneUser(browser, o, n) {
  const ctx = await browser.newContext({ viewport: n % 2 ? { width: 390, height: 844 } : { width: 1366, height: 900 } });
  const page = await ctx.newPage(), t0 = Date.now(), r = { user: n };
  try {
    if (o.demo) { await page.goto(o.url); await page.click('button[data-role="student"]'); }
    else {
      const lk = await post(o, { fn: 'link', as: 'lt' + pad(n, 4) + '@loadtest.invalid' });
      if (!lk.body || !lk.body.ok) throw new Error('Không lấy được link: ' + JSON.stringify(lk.body || lk.snippet));
      await page.goto(lk.body.data.url, { timeout: 60000 });
    }
    const f = await appFrame(page, 90000);
    r.portal_ms = Date.now() - t0;
    if (await f.$('#maint-screen')) { r.result = 'MAINTENANCE'; return r; }
    await f.waitForSelector('.chip:not([disabled]), .day-grid, #app .panel', { timeout: 60000 });
    if (!(await f.$('.chip:not([disabled])'))) { r.result = 'NO_SLOT'; return r; }
    // Điện thoại: chỉ 3 ngày đầu mở sẵn. Chọn trong các slot đang thấy (ngày đang mở).
    const chips = [];
    for (const ch of await f.$$('details.day[open] .chip:not([disabled])')) if (await ch.isVisible()) chips.push(ch);
    if (!chips.length) throw new Error('Không có slot trống đang hiện');
    await chips[Math.floor(Math.random() * Math.min(chips.length, 20))].click();
    const t1 = Date.now();
    await f.click('#ab-go');
    await f.waitForSelector('.sheet h2, #tp-toast:not([hidden])', { timeout: 90000 });
    r.book_ms = Date.now() - t1;
    const sheet = await f.$('.sheet');
    r.result = sheet ? ((await sheet.$('.pill.ok')) ? 'BOOKED' : 'NOT_BOOKED: ' + (await sheet.innerText()).replace(/\s+/g, ' ').slice(0, 120)) : 'TOAST: ' + (await f.innerText('#tp-toast')).slice(0, 120);
    r.retry_bar_seen = !!(await f.$('#tp-retry'));
  } catch (e) { r.result = 'ERROR: ' + String(e.message || e).slice(0, 160); }
  finally { await ctx.close(); }
  return r;
}

async function main() {
  const o = args();
  if (!o.url || (!o.secret && !o.demo)) { console.error('Thiếu --url hoặc --secret. Xem đầu file browser.js.'); process.exit(2); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.error('Chưa cài Playwright: npm i playwright && npx playwright install chromium'); process.exit(2); }
  const browser = await chromium.launch({ headless: !o.headed });
  const jobs = [];
  for (let i = 0; i < o.users; i++) jobs.push(new Promise(r => setTimeout(r, i * 500)).then(() => oneUser(browser, o, o.start + i)));
  const res = await Promise.all(jobs);
  await browser.close();
  res.forEach(r => console.log(JSON.stringify(r)));
  const ok = res.filter(r => r.result === 'BOOKED').length;
  console.log('Đặt được ' + ok + '/' + res.length + '. Slot đã có người là bình thường khi nhiều người chọn trùng; ERROR là lỗi cần báo Alex.');
  process.exit(res.some(r => /^ERROR/.test(r.result)) ? 3 : 0);
}
if (require.main === module) main();
module.exports = { appFrame };
