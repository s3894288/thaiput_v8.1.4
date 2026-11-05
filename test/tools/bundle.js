#!/usr/bin/env node
/**
 * Gói mã nguồn và bộ test thành 2 file chữ để lưu trong project claude.ai (chat mới dựng lại repo từ đây).
 *   node test/tools/bundle.js pack            → repo_bundle/SRC_BUNDLE.txt, repo_bundle/TEST_BUNDLE.txt
 *   node test/tools/bundle.js unpack <file> <thư mục đích>
 * Mỗi file trong bundle mở đầu bằng dòng (5 dấu bằng)FILE: đường/dẫn(5 dấu bằng) và kết thúc bằng (5 dấu bằng)END(5 dấu bằng).
 * Dòng đầu bundle ghi số file và mã kiểm (sha256) để biết dựng lại có đủ, đúng không.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..');
const GROUPS = {
  SRC_BUNDLE: ['src', 'companion', 'loadtest', 'package.json'],
  TEST_BUNDLE: ['test']
};
const SKIP = new Set(['test/REPORT.md']);
const EQ = '='.repeat(5), F_OPEN = EQ + 'FILE: ', F_END = EQ + 'END' + EQ;

function walk(rel, out) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isDirectory()) fs.readdirSync(abs).sort().forEach(n => walk(path.posix.join(rel, n), out));
  else if (!SKIP.has(rel)) out.push(rel);
}
function sha(s) { return crypto.createHash('sha256').update(s, 'utf8').digest('hex').substring(0, 16); }

function pack() {
  const dir = path.join(ROOT, 'repo_bundle');
  fs.mkdirSync(dir, { recursive: true });
  Object.keys(GROUPS).forEach(name => {
    const files = []; GROUPS[name].forEach(r => walk(r, files));
    let body = '';
    files.forEach(f => {
      const txt = fs.readFileSync(path.join(ROOT, f), 'utf8');
      if (txt.indexOf(F_END) !== -1 || txt.indexOf(F_OPEN) !== -1) throw new Error('File chứa dấu phân cách: ' + f);
      body += F_OPEN + f + EQ + '\n' + txt + (txt.endsWith('\n') ? '' : '\n') + F_END + '\n';
    });
    const head = 'THAIPUT_BUNDLE ' + name + ' files=' + files.length + ' sha=' + sha(body) + '\n';
    fs.writeFileSync(path.join(dir, name + '.txt'), head + body);
    console.log(name + '.txt: ' + files.length + ' file, ' + Math.round((head + body).length / 1024) + ' KB');
  });
}

function unpack(file, dest) {
  const all = fs.readFileSync(file, 'utf8'), nl = all.indexOf('\n');
  const head = all.substring(0, nl), body = all.substring(nl + 1);
  const m = head.match(/^THAIPUT_BUNDLE (\S+) files=(\d+) sha=([0-9a-f]+)$/);
  if (!m) throw new Error('Không phải bundle thaiput: ' + head.substring(0, 80));
  if (sha(body) !== m[3]) throw new Error('Mã kiểm sai: bundle bị cắt hoặc sửa');
  const re = new RegExp(F_OPEN + '(.+?)' + EQ + '\\n([\\s\\S]*?)' + F_END + '\\n', 'g');
  let x, n = 0;
  while ((x = re.exec(body))) {
    const rel = x[1];
    if (rel.indexOf('..') !== -1 || path.isAbsolute(rel)) throw new Error('Đường dẫn lạ: ' + rel);
    const out = path.join(dest, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, x[2]);
    n++;
  }
  if (n !== Number(m[2])) throw new Error('Thiếu file: ' + n + '/' + m[2]);
  console.log(m[1] + ': dựng lại ' + n + ' file, mã kiểm đúng');
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'pack') pack();
else if (cmd === 'unpack' && a && b) unpack(a, b);
else { console.log('Dùng: pack | unpack <file> <thư mục>'); process.exit(1); }
