/**
 * load.js · Nạp toàn bộ src/*.gs vào một môi trường giả lập mới (mỗi kịch bản một môi trường riêng)
 *
 * Dùng new Function thay vì vm để Date, Array dùng chung một "realm" với test (instanceof Date đúng).
 * Các dịch vụ Google được truyền vào làm tham số, nên mỗi lần nạp hoàn toàn tách biệt.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { createGasEnv } = require('./gas_mock');

const SRC = path.join(__dirname, '..', 'src');

function sourceFiles() {
  return fs.readdirSync(SRC).filter(f => f.endsWith('.gs')).sort((a, b) => {
    // Config, Schema, Time nạp trước cho dễ đọc lỗi; Apps Script thật nạp mọi file trước khi chạy nên thứ tự không ảnh hưởng logic.
    const first = ['Config.gs', 'Schema.gs', 'Time.gs'];
    const ia = first.indexOf(a), ib = first.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });
}

let CACHED = null;
/** Ghép các file .gs theo đúng thứ tự nạp. Dùng chung cho test và cho bản dán tay dist/Code.gs. */
function combinedSource() {
  return sourceFiles().map(f => '// ── ' + f + ' ──\n' + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
}
function compile(src) {
  const names = new Set();
  const reFn = /^function\s+([A-Za-z0-9_$]+)\s*\(/gm, reVar = /^var\s+([A-Za-z0-9_$]+)\s*=/gm;
  let m;
  while ((m = reFn.exec(src))) names.add(m[1]);
  while ((m = reVar.exec(src))) names.add(m[1]);
  const globalsList = ['SpreadsheetApp', 'PropertiesService', 'LockService', 'CacheService', 'Utilities', 'MailApp', 'GmailApp', 'Calendar', 'DriveApp', 'ScriptApp', 'Session', 'Logger', 'HtmlService', 'ContentService'];
  const body = src + '\nreturn {' + Array.from(names).map(n => JSON.stringify(n) + ': (typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined)').join(',\n') + '};';
  const factory = new Function(...globalsList, body);
  return { factory, globalsList };
}
function compiled() {
  if (!CACHED) CACHED = compile(combinedSource());
  return CACHED;
}

/** Tạo một môi trường mới: trả { api, env } với api là mọi hàm và biến toàn cục của src. */
function load(opts) {
  opts = opts || {};
  const env = createGasEnv(opts);
  const c = opts.source ? compile(opts.source) : compiled();
  const args = c.globalsList.map(g => env.globals[g]);
  const api = c.factory(...args);
  env.scope = api; // để scriptlet trong HTML gọi được include_ và các hàm khác
  return { api, env };
}

module.exports = { load, sourceFiles, combinedSource };
