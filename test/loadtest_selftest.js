/**
 * loadtest_selftest.js · Kiểm loadtest/run.js với máy chủ giả (chunk 5G)
 *
 * Dựng một máy chủ HTTP trên máy, chuyển POST tới doPost của backend thật chạy trên Google giả lập, trả qua một bước
 * chuyển hướng 302 như Google thật (script.google.com chuyển sang script.googleusercontent.com). Vài lượt đầu trả trang
 * lỗi HTML như khi Google từ chối (quá 30 lượt cùng lúc) để kiểm run.js tự thử lại cùng mã và không đặt trùng.
 */
'use strict';
const http = require('http');
const path = require('path');
const { execFile } = require('child_process');
const assert = require('assert');
const { mk } = require('./scenarios');

function run() {
  return new Promise((resolve) => {
    const out = [];
    const t = (id, title, fn) => out.push({ id, title, fn });
    t('L01', 'run.js qua 302 như Google: 3 lượt trang chủ và 3 lượt đặt bị từ chối trước khi tới máy chủ, 2 lượt đặt ĐÃ GHI rồi mới trả trang lỗi; 15 người ảo, huỷ 30%: không trùng, không mất, kết quả khớp Sheets', async () => {
      const c = mk(), { api } = c;
      api.loadTestSeed_(20, 4, 5);
      const on = api.loadTestEnable_(1);
      let rejHome = 3, rejBook = 3, lostAfterWrite = 2, seq = 0; const store = {};
      const srv = http.createServer((req, res) => {
        if (req.method === 'POST') {
          let body = ''; req.on('data', d => { body += d; });
          req.on('end', () => {
            const page = '<html><body>Service invoked too many times in a short time</body></html>';
            if (rejHome > 0 && /"fn":"home"/.test(body)) { rejHome--; res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(page); return; }
            if (rejBook > 0 && /"fn":"book"/.test(body)) { rejBook--; res.writeHead(429, { 'Content-Type': 'text/html' }); res.end(page); return; }
            const id = String(++seq); store[id] = api.doPost({ postData: { contents: body } }).getContent();
            // Máy chủ đã ghi xong nhưng phản hồi mất (trả trang lỗi): run.js phải gửi lại CÙNG mã, nhận lại kết quả cũ
            if (lostAfterWrite > 0 && /"fn":"book"/.test(body) && /"ok":true/.test(store[id])) { lostAfterWrite--; res.writeHead(500, { 'Content-Type': 'text/html' }); res.end('<html>Error</html>'); return; }
            res.writeHead(302, { Location: '/echo?id=' + id }); res.end();
          });
          return;
        }
        const id = new URL(req.url, 'http://x').searchParams.get('id');
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(store[id] || '{}');
      });
      await new Promise(r => srv.listen(0, r));
      const url = 'http://127.0.0.1:' + srv.address().port + '/exec', file = path.join(require('os').tmpdir(), 'tp_lt_' + process.pid + '.json');
      const env = Object.assign({}, process.env);
      const code = await new Promise(r => execFile(process.execPath, [path.join(__dirname, '..', 'loadtest', 'run.js'), '--url', url, '--secret', on.secret, '--users', '15', '--ramp', '0', '--cancel', '0.3', '--out', file], { env, timeout: 120000 }, (err, so, se) => r({ code: err ? err.code : 0, so, se })));
      srv.close();
      assert.strictEqual(code.code, 0, 'run.js thoát 0: ' + code.so.slice(-600) + code.se);
      const rep = JSON.parse(require('fs').readFileSync(file, 'utf8'));
      assert.strictEqual(rep.tong_ket.google_tu_choi, 8, 'đếm đúng lượt bị từ chối (6 trước máy chủ, 2 sau khi ghi)');
      const bookRetried = rep.luot.filter(x => x.fn === 'book' && x.try > 1).length;
      assert.ok(bookRetried >= 5, 'lượt đặt có thử lại: ' + bookRetried);
      const booked = rep.nguoi.filter(x => x.result === 'BOOKED').length, cancelled = rep.nguoi.filter(x => x.cancel === 'CANCELLED').length;
      const chk = api.loadTestCheck_();
      assert.deepStrictEqual([chk.duplicateRequest, chk.doubleBookedSlot, chk.overPerDay], [0, 0, 0], JSON.stringify(chk));
      assert.strictEqual(chk.bookings, booked, 'số booking trong Sheets = số người ảo báo đặt được');
      assert.strictEqual(chk.cancelled, cancelled);
      assert.ok(booked >= 10, 'đa số đặt được: ' + JSON.stringify(rep.tong_ket.ket_qua));
    });
    t('L02', 'run.js báo lỗi khi máy chủ bận mãi: thử lại đúng 9 lần cùng một mã rồi dừng, kết quả BUSY, thoát mã 3 (không coi là bình thường)', async () => {
      const c = mk(), { api } = c;
      api.loadTestSeed_(3, 2, 3);
      const on = api.loadTestEnable_(1), rids = {};
      const srv = http.createServer((req, res) => {
        let body = ''; req.on('data', d => { body += d; });
        req.on('end', () => {
          if (/"fn":"book"/.test(body)) { const b = JSON.parse(body); (rids[b.as] = rids[b.as] || []).push(b.args[1]); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, reason: 'BUSY' })); return; }
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(api.doPost({ postData: { contents: body } }).getContent());
        });
      });
      await new Promise(r => srv.listen(0, r));
      const url = 'http://127.0.0.1:' + srv.address().port + '/exec', file = path.join(require('os').tmpdir(), 'tp_lt2_' + process.pid + '.json');
      const code = await new Promise(r => execFile(process.execPath, [path.join(__dirname, '..', 'loadtest', 'run.js'), '--url', url, '--secret', on.secret, '--users', '3', '--ramp', '0', '--out', file], { env: Object.assign({}, process.env, { TP_LT_FAST: '1' }), timeout: 60000 }, (err, so, se) => r({ code: err ? err.code : 0, so, se })));
      srv.close();
      assert.strictEqual(code.code, 3, 'thoát mã 3: ' + code.so.slice(-300));
      Object.keys(rids).forEach(k => { assert.strictEqual(rids[k].length, 9, k + ' thử 9 lần'); assert.strictEqual(new Set(rids[k]).size, 1, 'cùng một mã'); });
      const rep = JSON.parse(require('fs').readFileSync(file, 'utf8'));
      assert.ok(rep.nguoi.every(x => x.result === 'BUSY'), JSON.stringify(rep.tong_ket.ket_qua));
    });
    (async () => {
      const results = [];
      for (const x of out) { try { await x.fn(); results.push({ id: x.id, title: x.title, ok: true }); } catch (e) { results.push({ id: x.id, title: x.title, ok: false, err: e.message }); } }
      resolve(results);
    })();
  });
}
module.exports = { run };
if (require.main === module) run().then(r => { r.forEach(x => console.log((x.ok ? 'ĐẠT  ' : 'KHÔNG ĐẠT  ') + x.id + ' ' + x.title + (x.ok ? '' : '\n   ' + x.err))); process.exit(r.some(x => !x.ok) ? 1 : 0); });
