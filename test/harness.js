/**
 * harness.js · Chạy toàn bộ test v8 và ghi test/REPORT.md
 *
 *   npm test            (hoặc: TZ=Asia/Ho_Chi_Minh node test/harness.js)
 *
 * Gồm 5 phần (phần 5 từ chunk 5G: loadtest_selftest.js, kiểm loadtest/run.js với máy chủ giả):
 *   1. unit.js         hàm thuần và lớp Db
 *   2. scenarios.js    40 kịch bản đầu cuối theo docs/03_KICH_BAN_TEST_40.md
 *   3. integration.js  cài đặt, dropdown admin, API, chế độ Gmail thường
 *   4. ui.js           giao diện web chạy trong jsdom, nối thẳng vào backend thật (chunk 4)
 * Thoát với mã 1 nếu có bất kỳ test nào Không đạt (không đẩy code khi còn đỏ, CLAUDE.md quy ước 2).
 */
'use strict';
if (process.env.TZ !== 'Asia/Ho_Chi_Minh') {
  // Ép múi giờ trước khi tạo bất kỳ Date nào; Node đọc lại TZ khi biến môi trường đổi.
  process.env.TZ = 'Asia/Ho_Chi_Minh';
}
const fs = require('fs');
const path = require('path');

const unit = require('./unit').results;
const scen = require('./scenarios').run();
const integ = require('./integration').results;

(async function main() {
const ui = await require('./ui').run();
const lt = await require('./loadtest_selftest').run();

const lines = [];
const now = new Date();
lines.push('# Thaiput v8 · Báo cáo test');
lines.push('');
lines.push('*Chạy lúc ' + now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) + ' · Node ' + process.version + '*');
lines.push('');
const uOk = unit.filter(r => r.ok).length;
const sDone = scen.filter(r => r.status !== 'PENDING');
const sOk = sDone.filter(r => r.status === 'PASS').length;
const sPending = scen.length - sDone.length;
lines.push('| Phần | Đạt | Tổng | Chưa cài |');
lines.push('|---|---|---|---|');
lines.push('| Hàm thuần và Db | ' + uOk + ' | ' + unit.length + ' | 0 |');
lines.push('| 40 kịch bản | ' + sOk + ' | ' + scen.length + ' | ' + sPending + ' |');
const iOk = integ.filter(r => r.ok).length;
lines.push('| Tích hợp (cài đặt, chuyển dữ liệu, admin, API) | ' + iOk + ' | ' + integ.length + ' | 0 |');
const uiOk = ui.filter(r => r.ok).length;
lines.push('| Giao diện web (jsdom + backend thật) | ' + uiOk + ' | ' + ui.length + ' | 0 |');
const ltOk = lt.filter(r => r.ok).length;
lines.push('| Bộ thử tải (loadtest/run.js với máy chủ giả) | ' + ltOk + ' | ' + lt.length + ' | 0 |');
lines.push('');
lines.push('## 40 kịch bản');
lines.push('');
lines.push('| # | Kịch bản | Kết quả | Ghi chú |');
lines.push('|---|---|---|---|');
scen.forEach(r => {
  const label = r.status === 'PASS' ? 'Đạt' : r.status === 'FAIL' ? '**Không đạt**' : 'Chưa cài (chunk ' + r.chunk + ')';
  lines.push('| ' + r.id + ' | ' + r.title + ' | ' + label + ' | ' + (r.note || '').replace(/\|/g, '/').replace(/\n/g, ' ') + ' |');
});
lines.push('');
lines.push('## Tích hợp');
lines.push('');
lines.push('| # | Test | Kết quả |');
lines.push('|---|---|---|');
integ.forEach(r => lines.push('| ' + r.id + ' | ' + r.title + ' | ' + (r.ok ? 'Đạt' : '**Không đạt**: ' + r.err.replace(/\|/g, '/').replace(/\n/g, ' ')) + ' |'));
lines.push('');
lines.push('## Giao diện web');
lines.push('');
lines.push('| # | Test | Kết quả |');
lines.push('|---|---|---|');
ui.forEach(r => lines.push('| ' + r.id + ' | ' + r.title + ' | ' + (r.ok ? 'Đạt' : '**Không đạt**: ' + r.err.replace(/\|/g, '/').replace(/\n/g, ' ')) + ' |'));
lines.push('');
lines.push('## Bộ thử tải');
lines.push('');
lines.push('| # | Test | Kết quả |');
lines.push('|---|---|---|');
lt.forEach(r => lines.push('| ' + r.id + ' | ' + r.title + ' | ' + (r.ok ? 'Đạt' : '**Không đạt**: ' + r.err.replace(/\|/g, '/').replace(/\n/g, ' ')) + ' |'));
lines.push('');
lines.push('## Hàm thuần và Db');
lines.push('');
lines.push('| # | Test | Kết quả |');
lines.push('|---|---|---|');
unit.forEach(r => lines.push('| ' + r.id + ' | ' + r.title + ' | ' + (r.ok ? 'Đạt' : '**Không đạt**: ' + r.err.replace(/\|/g, '/')) + ' |'));
lines.push('');
fs.writeFileSync(path.join(__dirname, 'REPORT.md'), lines.join('\n'));

const fails = unit.filter(r => !r.ok).length + scen.filter(r => r.status === 'FAIL').length + integ.filter(r => !r.ok).length + ui.filter(r => !r.ok).length + lt.filter(r => !r.ok).length;
console.log('Hàm thuần và Db: ' + uOk + '/' + unit.length + ' đạt');
console.log('40 kịch bản:     ' + sOk + '/' + scen.length + ' đạt, ' + sPending + ' chưa cài');
console.log('Tích hợp:        ' + iOk + '/' + integ.length + ' đạt');
console.log('Giao diện web:   ' + uiOk + '/' + ui.length + ' đạt');
console.log('Bộ thử tải:      ' + ltOk + '/' + lt.length + ' đạt');
lt.filter(r => !r.ok).forEach(r => console.log('  KHÔNG ĐẠT ' + r.id + ': ' + r.err));
integ.filter(r => !r.ok).forEach(r => console.log('  KHÔNG ĐẠT ' + r.id + ': ' + r.err));
ui.filter(r => !r.ok).forEach(r => console.log('  KHÔNG ĐẠT ' + r.id + ': ' + r.err));
scen.filter(r => r.status === 'FAIL').forEach(r => console.log('  KHÔNG ĐẠT ' + r.id + ': ' + r.note));
unit.filter(r => !r.ok).forEach(r => console.log('  KHÔNG ĐẠT ' + r.id + ': ' + r.err));
console.log('Báo cáo: test/REPORT.md');
process.exit(fails ? 1 : 0);
})();
