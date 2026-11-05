/**
 * build_dist.js · Tạo bản dán tay cho người không dùng clasp (chunk 5)
 *
 *   node test/build_dist.js   → dist/Code.gs, dist/appsscript.json, dist/Index.html (dự án chính)
 *                               dist_google_login/GoogleLogin.gs, appsscript.json (dự án phụ đăng nhập Google)
 *
 * Apps Script nạp mọi file .gs vào chung một phạm vi, nên ghép 23 file thành một Code.gs chạy y hệt.
 * Giao diện gộp vào 1 file Index.html (đã nhúng sẵn mọi file con), tên ngắn; Api.gs tự nhận cả tên "ui/Index" lẫn "Index".
 * Không sửa dist/ bằng tay: sửa src/ rồi chạy lại lệnh này. npm test có test I19 nạp đúng bản dist này.
 *
 * Bản PRODUCTION chính thức (CLAUDE.md luật 44, chỉ chạy khi anh Chris yêu cầu):
 *   node test/build_dist.js --production   → dist_production/: mỗi file src/*.gs một file, Index.html gộp, appsscript.json,
 *                                            MANIFEST.txt (phiên bản, thứ tự, mã băm SHA-256 từng file để đối chiếu sau khi dán).
 * Test I88 nạp các file theo thứ tự NGƯỢC để chắc chắn không file nào phụ thuộc thứ tự nạp (Apps Script nạp theo thứ tự trong trình soạn).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { combinedSource, sourceFiles } = require('./load');

const ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist');
fs.mkdirSync(DIST, { recursive: true });
const version = (fs.readFileSync(path.join(ROOT, 'src', 'Config.gs'), 'utf8').match(/VERSION:\s*'([^']+)'/) || [])[1];
const head = [
  '/**',
  ' * THAIPUT v' + version + ' · Code.gs (bản gộp để dán tay vào trình soạn thảo Apps Script)',
  ' * Gộp từ ' + sourceFiles().length + ' file trong src/: ' + sourceFiles().join(', '),
  ' * Không sửa file này: sửa src/ rồi chạy node test/build_dist.js. Hướng dẫn cập nhật: HUONG_DAN_PHAT_HANH.md.',
  ' * Gửi email cố định từ 8.1.4 (MailTransport.gs, GmailApp): KHÔNG cần file MailFix, KHÔNG tìm và thay. Có file MailFix.gs cũ thì xoá.',
  ' */',
  ''
].join('\n');
fs.writeFileSync(path.join(DIST, 'Code.gs'), head + combinedSource() + '\n');
fs.copyFileSync(path.join(ROOT, 'src', 'appsscript.json'), path.join(DIST, 'appsscript.json'));
// Một file Index.html duy nhất: nhúng sẵn Styles, App, Home, Login, Student, Tutor, Admin vào chỗ include_.
// Người dán tay chỉ phải tạo 1 file HTML thay vì 7 (lỗi "No HTML file named Styles" khi thiếu file con).
const uiDir = path.join(ROOT, 'src', 'ui');
fs.readdirSync(DIST).filter(f => f.endsWith('.html')).forEach(f => fs.unlinkSync(path.join(DIST, f)));
let index = fs.readFileSync(path.join(uiDir, 'Index.html'), 'utf8');
index = index.replace(/<\?!=\s*include_\('ui\/(\w+)'\);?\s*\?>/g, (m, n) => fs.readFileSync(path.join(uiDir, n + '.html'), 'utf8'));
if (/include_\(/.test(index)) throw new Error('Index.html còn include_ chưa nhúng');
const left = (index.match(/<\?[\s\S]*?\?>/g) || []);
if (left.length !== 1 || left[0].indexOf('bootJson') === -1) throw new Error('Index.html gộp chỉ được còn đúng 1 scriptlet bootJson: ' + left.join(' | '));
if ((index.split('<?').length - 1) !== 1) throw new Error('Index.html gộp có ký tự <? lạ, Apps Script sẽ hiểu nhầm là scriptlet');
fs.writeFileSync(path.join(DIST, 'Index.html'), index);
// Dự án phụ "thaiput Google login" (chunk 5D): 2 file riêng, dán vào một dự án Apps Script KHÁC.
const DIST2 = path.join(ROOT, 'dist_google_login');
fs.mkdirSync(DIST2, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'companion', 'GoogleLogin.gs'), path.join(DIST2, 'GoogleLogin.gs'));
fs.copyFileSync(path.join(ROOT, 'companion', 'appsscript.json'), path.join(DIST2, 'appsscript.json'));
const nUi = (fs.readFileSync(path.join(uiDir, 'Index.html'), 'utf8').match(/include_\(/g) || []).length;
if (process.argv.indexOf('--production') !== -1) {
  const crypto = require('crypto');
  const OUT = process.env.TP_PROD_OUT || path.join(ROOT, 'dist_production');
  fs.mkdirSync(OUT, { recursive: true });
  fs.readdirSync(OUT).forEach(f => fs.unlinkSync(path.join(OUT, f)));
  const man = ['THAIPUT v' + version + ' · bản PRODUCTION chia file', 'Tạo lúc ' + new Date().toISOString(), '', 'Dán từng file vào trình soạn Apps Script (tên file giữ nguyên, bỏ đuôi .gs khi tạo file mới).', 'Thứ tự file không ảnh hưởng (test I88).', ''];
  const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
  sourceFiles().forEach(f => {
    const txt = '// THAIPUT v' + version + ' · ' + f + ' · sinh từ src/, không sửa tay\n' + fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
    fs.writeFileSync(path.join(OUT, f), txt); man.push(f + '  ' + sha(txt));
  });
  fs.writeFileSync(path.join(OUT, 'Index.html'), index); man.push('Index.html  ' + sha(index));
  fs.copyFileSync(path.join(ROOT, 'src', 'appsscript.json'), path.join(OUT, 'appsscript.json'));
  fs.writeFileSync(path.join(OUT, 'MANIFEST.txt'), man.join('\n') + '\n');
  console.log('dist_production/: ' + sourceFiles().length + ' file .gs, Index.html, appsscript.json, MANIFEST.txt');
}
console.log('dist/: Code.gs (' + Math.round(fs.statSync(path.join(DIST, 'Code.gs')).size / 1024) + ' KB), appsscript.json, Index.html (' + Math.round(index.length / 1024) + ' KB, đã gộp ' + nUi + ' file giao diện), dist_google_login/: GoogleLogin.gs, appsscript.json (dự án phụ)');
