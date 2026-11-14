/**
 * release_baseline.js · Dấu vân tay các mặc định của code + kiểm ghi chú phát hành (chunk 5R)
 *
 * Mục đích: ai đổi mặc định CONFIG, chữ web gốc (DEFAULT_CONTENT_, câu báo lỗi), mẫu email gốc, luật thông báo hoặc cột/tab của SCHEMA
 * thì BẮT BUỘC thêm ghi chú phát hành khớp (RELEASE_NOTES_ ở src/Release.gs), để admin được báo khi nâng cấp. Test I148 so dấu vân tay hiện tại
 * với test/fixtures/release_baseline.json (dấu vân tay ở bản phát hành gần nhất) và đỏ khi lệch.
 *
 * Cách cập nhật khi cố ý đổi mặc định:
 *   1. Tăng APP.VERSION (và VERSION_DATE) trong src/Config.gs.
 *   2. Thêm một phần tử vào CUỐI RELEASE_NOTES_ (src/Release.gs) cho bản mới, mỗi khoá đổi một mục có key và kind
 *      (config: ADDED, CHANGED, REMOVED; content, templates, notify cũng vậy; data: key là TAB hoặc TAB.cột).
 *   3. node test/tools/release_baseline.js --write      (từ chối nếu ghi chú chưa phủ hết thay đổi, hoặc nếu chưa tăng phiên bản)
 *   4. node test/tools/release_baseline.js              (in ra thay đổi so với baseline và phần ghi chú còn thiếu, không ghi gì)
 * Bản CHƯA phát hành (chưa dán lên hệ thống nào) mà soát thêm mặc định mới: thêm mục vào phần tử RELEASE_NOTES_ của chính bản đó rồi
 *   node test/tools/release_baseline.js --write --same-version     (cho phép ghi khi APP.VERSION không đổi; vẫn từ chối nếu ghi chú chưa phủ hết)
 * Không dùng --same-version cho bản đã phát hành: admin đã nâng cấp bằng bản đó sẽ không được báo thay đổi mới (phải tăng phiên bản).
 * fingerprint(api, version) dùng cả cho fixture 8.1.4 (test/fixtures/release_baseline_8_1_4.json) để test I149 đối chiếu ghi chú 8.1.5 đến 8.1.9.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASELINE = path.join(__dirname, '..', 'fixtures', 'release_baseline.json');
const h = (x) => crypto.createHash('sha1').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex').substring(0, 10);

/** Dấu vân tay: khoá → giá trị (CONFIG, giữ nguyên giá trị mặc định) hoặc mã băm (chữ web, mẫu, luật), tab → danh sách cột. */
function fingerprint(api, version) {
  const fp = { version: version || api.APP.VERSION, config: {}, content: {}, templates: {}, notify: {}, schema: {} };
  Object.keys(api.DEFAULTS_).sort().forEach(k => { fp.config[k] = api.DEFAULTS_[k]; });
  const cd = api.contentDefaults_();
  Object.keys(cd).sort().forEach(k => { fp.content[k] = h(cd[k].vi + '\u0000' + cd[k].en); });
  Object.keys(api.DEFAULT_EMAIL_TEMPLATES_).sort().forEach(k => { fp.templates[k] = h(api.DEFAULT_EMAIL_TEMPLATES_[k]); });
  Object.keys(api.DEFAULT_NOTIFY_RULES_).sort().forEach(k => { fp.notify[k] = h(api.DEFAULT_NOTIFY_RULES_[k]); });
  Object.keys(api.SCHEMA).sort().forEach(t => { fp.schema[t] = api.SCHEMA[t].cols.slice(); });
  return fp;
}

function mapDiff(a, b) {
  const A = Object.keys(a), B = Object.keys(b);
  return { added: B.filter(k => !(k in a)), removed: A.filter(k => !(k in b)), changed: A.filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) };
}
/** So hai dấu vân tay: { config, content, templates, notify: {added, removed, changed}, tabs: {added, removed}, columns: {added, removed} } (cột dạng TAB.cột). */
function diff(oldFp, newFp) {
  const d = { config: mapDiff(oldFp.config, newFp.config), content: mapDiff(oldFp.content, newFp.content), templates: mapDiff(oldFp.templates, newFp.templates), notify: mapDiff(oldFp.notify, newFp.notify), tabs: { added: [], removed: [] }, columns: { added: [], removed: [] } };
  const t = mapDiff(oldFp.schema, newFp.schema);
  d.tabs.added = t.added; d.tabs.removed = t.removed;
  t.changed.forEach(tab => {
    newFp.schema[tab].filter(c => oldFp.schema[tab].indexOf(c) === -1).forEach(c => d.columns.added.push(tab + '.' + c));
    oldFp.schema[tab].filter(c => newFp.schema[tab].indexOf(c) === -1).forEach(c => d.columns.removed.push(tab + '.' + c));
  });
  return d;
}
function isEmpty(d) {
  return ['config', 'content', 'templates', 'notify'].every(g => !d[g].added.length && !d[g].removed.length && !d[g].changed.length) &&
    !d.tabs.added.length && !d.tabs.removed.length && !d.columns.added.length && !d.columns.removed.length;
}

/** Mọi mục thay đổi của một diff: [{ group (tên nhóm trong RELEASE_NOTES_), key, kind }]. */
function diffItems(d) {
  const out = [];
  [['config', 'config'], ['content', 'content'], ['templates', 'templates'], ['notify', 'notify']].forEach(g => {
    d[g[0]].added.forEach(k => out.push({ group: g[1], key: k, kind: 'ADDED' }));
    d[g[0]].removed.forEach(k => out.push({ group: g[1], key: k, kind: 'REMOVED' }));
    d[g[0]].changed.forEach(k => out.push({ group: g[1], key: k, kind: 'CHANGED' }));
  });
  d.tabs.added.forEach(k => out.push({ group: 'data', key: k, kind: 'ADDED' })); d.tabs.removed.forEach(k => out.push({ group: 'data', key: k, kind: 'REMOVED' }));
  d.columns.added.forEach(k => out.push({ group: 'data', key: k, kind: 'ADDED' })); d.columns.removed.forEach(k => out.push({ group: 'data', key: k, kind: 'REMOVED' }));
  return out;
}
/** Mục thay đổi chưa có ghi chú khớp (group, key, kind) trong các phần tử notes. RENAMED được tính là khớp ADDED hoặc REMOVED. */
function uncovered(d, notes) {
  const have = {};
  notes.forEach(n => Object.keys(n).forEach(g => { if (Array.isArray(n[g])) n[g].forEach(x => { if (x.key) have[g + '|' + x.key + '|' + x.kind] = true; }); }));
  return diffItems(d).filter(i => !have[i.group + '|' + i.key + '|' + i.kind] && !((i.kind === 'ADDED' || i.kind === 'REMOVED') && have[i.group + '|' + i.key + '|RENAMED']));
}
/** Ghi chú có khoá (key, kind) mà dấu vân tay không có thay đổi tương ứng: ghi điều không có. */
function invented(d, notes) {
  const real = {}; diffItems(d).forEach(i => { real[i.group + '|' + i.key + '|' + i.kind] = true; });
  const out = [];
  notes.forEach(n => Object.keys(n).forEach(g => { if (Array.isArray(n[g])) n[g].forEach(x => { if (x.key && x.kind !== 'RENAMED' && !real[g + '|' + x.key + '|' + x.kind]) out.push(n.version + ' ' + g + ' ' + x.key + ' ' + x.kind); }); }));
  return out;
}

function main() {
  process.env.TZ = process.env.TZ || 'Asia/Ho_Chi_Minh';
  const { load } = require('../load');
  const api = load().api, cur = fingerprint(api);
  const write = process.argv.indexOf('--write') !== -1;
  if (!fs.existsSync(BASELINE)) { fs.writeFileSync(BASELINE, JSON.stringify(cur, null, 1) + '\n'); console.log('Đã tạo baseline lần đầu cho bản ' + cur.version); return; }
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')), d = diff(base, cur), items = diffItems(d);
  console.log('Baseline ' + base.version + ' → code ' + cur.version + ': ' + items.length + ' thay đổi mặc định');
  items.forEach(i => console.log('  ' + i.group + ' ' + i.key + ' ' + i.kind));
  const noteOfCur = api.RELEASE_NOTES_.filter(n => n.version === cur.version);
  const miss = uncovered(d, noteOfCur);
  if (!noteOfCur.length) console.log('THIẾU phần tử RELEASE_NOTES_ cho bản ' + cur.version);
  miss.forEach(i => console.log('  THIẾU ghi chú: ' + i.group + ' ' + i.key + ' ' + i.kind));
  if (!write) return;
  if (!noteOfCur.length || miss.length) { console.error('Không ghi baseline: ghi chú phát hành chưa phủ hết.'); process.exit(1); }
  if (items.length && base.version === cur.version && process.argv.indexOf('--same-version') === -1) { console.error('Không ghi baseline: mặc định đổi nhưng APP.VERSION vẫn là ' + cur.version + '. Tăng phiên bản trước (hoặc --same-version nếu bản này chưa phát hành).'); process.exit(1); }
  fs.writeFileSync(BASELINE, JSON.stringify(cur, null, 1) + '\n');
  console.log('Đã ghi baseline cho bản ' + cur.version);
}

if (require.main === module) main();
module.exports = { fingerprint, diff, diffItems, isEmpty, uncovered, invented, BASELINE };
