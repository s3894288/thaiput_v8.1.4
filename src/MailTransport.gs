/**
 * MailTransport.gs · Đường gửi email cố định (chunk 5Q, thay MailFix; chunk 5S thêm Amazon SES)
 *
 * Chỗ DUY NHẤT trong code được gọi dịch vụ gửi thư và đọc hạn mức email (test I133 quét src/, gọi ở file khác là đỏ;
 * từ 5S cả UrlFetchApp cũng chỉ được gọi ở đây). Mọi email vẫn đi qua sendMail_ (Notify.gs) và sendTpl_ (luật 19, 32).
 *
 * CONFIG MAIL_TRANSPORT:
 *   GMAILAPP (mặc định) = GmailApp.sendEmail, đúng cách MailFix đã chạy từ 22/10: thư có bản HTML kèm bản chữ thuần,
 *                         tên hiển thị MAIL_FROM_NAME, trả lời về ADMIN_EMAIL. Không bị trả về hàng loạt như MailApp.
 *   MAILAPP             = MailApp.sendEmail (cách cũ, dự phòng; thư từng bị trả về trên tên miền của trường).
 *   SES                 = Amazon SES (chunk 5S, kế hoạch v9 P0): gửi qua HTTP (UrlFetchApp) với chữ ký AWS Signature V4,
 *                         không bị hạn mức 1.500 (hay khoảng 100 khi Workspace còn dùng thử) của Google. Khoá ở Script
 *                         Properties SES_KEY, SES_SECRET, SES_REGION (mặc định ap-southeast-1); địa chỉ gửi MAIL_FROM_ADDRESS
 *                         (trống = no-reply@mail.<tên miền của ADMIN_EMAIL>), phải thuộc tên miền đã xác minh trong SES.
 *                         SES hỏng (thiếu khoá, mất mạng, AWS từ chối) thì thư đó tự gửi lại bằng GmailApp (ghi MAIL_FALLBACK,
 *                         báo admin 1 lần mỗi giờ) để email quan trọng không mất. Hạn mức ngày tự đặt ở CONFIG MAIL_DAILY_CAP
 *                         (tăng dần khi warm up; 0 = không giới hạn), đếm số thư SES hôm nay (bộ đệm theo ngày, mất thì đếm MAIL_LOG).
 *   Gõ sai hoặc trống: dùng GMAILAPP.
 * Quyền: GmailApp dùng gmail.send (từ 5J); SES dùng script.external_request (từ 5S). Google báo thiếu quyền khi gửi bằng
 * GmailApp thì thư đó tự gửi lại bằng MailApp (ghi MAIL_FALLBACK, báo admin).
 * Hạn mức Google: tính chung mọi thư Apps Script gửi trong ngày; đọc bằng MailApp.getRemainingDailyQuota (GmailApp
 * không có hàm đọc hạn mức). Đọc lỗi thì trả -1 (không rõ).
 */

var MAIL_TRANSPORTS_ = ['GMAILAPP', 'MAILAPP', 'SES'];
var MAIL_FALLBACK_NOTIFIED_ = false;
/** Đường gửi của thư gần nhất trong lượt chạy này (menu Kiểm tra gửi email hiện đường thật đã dùng, kể cả khi tự gửi lại). */
var LAST_MAIL_TRANSPORT_ = '';
/** Mã thư (MessageId) SES của thư gần nhất, để tra trong AWS khi cần. */
var LAST_MAIL_ID_ = '';
var SES_DEFAULT_REGION_ = 'ap-southeast-1';

function mailTransport_() {
  var m = ''; try { m = String(cfg_('MAIL_TRANSPORT') || '').trim().toUpperCase(); } catch (e) { }
  return MAIL_TRANSPORTS_.indexOf(m) === -1 ? 'GMAILAPP' : m;
}

/** Hạn mức email còn lại hôm nay (số người nhận). -1 = không đọc được (SES: MAIL_DAILY_CAP = 0 là không giới hạn). */
function mailBudget_() {
  if (mailTransport_() === 'SES') {
    var cap = 0; try { cap = Number(cfg_('MAIL_DAILY_CAP')) || 0; } catch (e) { }
    if (cap <= 0) return -1;
    var n = sesSentToday_(0);
    return n < 0 ? -1 : Math.max(0, cap - n);
  }
  try { var q = Number(MailApp.getRemainingDailyQuota()); return isNaN(q) ? -1 : q; } catch (e2) { return -1; }
}

/** Bản chữ thuần từ HTML (thư có cả 2 bản ít bị coi là thư rác hơn). Chép từ MailFix. */
function mailPlainText_(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n\n')
    .replace(/<\/(td|th)>/gi, ' ')
    .replace(/<a\s[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d{1,6});/g, function (m, n) { var c = Number(n); return c > 0 && c < 65536 ? String.fromCharCode(c) : m; })
    .replace(/&amp;/g, '&')
    .split('\n').map(function (l) { return l.replace(/[ \t]+$/, ''); }).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isMailPermissionError_(e) {
  return /permission|authori[sz]|scope|quyền|không có quyền|not allowed to/i.test(String((e && e.message) || e));
}

/**
 * Gửi một thư. msg = { to, subject, htmlBody, name, replyTo, cc, bcc }. Ném lỗi khi dịch vụ từ chối (sendMail_ bắt và ghi MAIL_FAILED).
 * Trả tên đường đã gửi ('SES', 'GMAILAPP' hoặc 'MAILAPP').
 */
function mailDeliver_(msg) {
  var to = String(msg.to || '').trim();
  if (!to) throw new Error('Thiếu người nhận email');
  var subject = String(msg.subject || '').replace(/[\r\n]+/g, ' ');
  var opts = {};
  ['htmlBody', 'name', 'replyTo', 'cc', 'bcc'].forEach(function (k) {
    if (msg[k] !== undefined && msg[k] !== null && String(msg[k]) !== '') opts[k] = msg[k];
  });
  var body = msg.body || (msg.htmlBody ? mailPlainText_(msg.htmlBody) : '');
  if (mailTransport_() === 'SES') {
    try { sesSend_(to, subject, body, opts); return (LAST_MAIL_TRANSPORT_ = 'SES'); }
    catch (se) {
      // SES hỏng: gửi lại bằng đường Google để email quan trọng không mất; báo admin tối đa 1 lần mỗi giờ.
      var sErr = String((se && se.message) || se), used;
      try { used = mailDeliverGoogle_(to, subject, body, opts); }
      catch (ge) { throw new Error('SES: ' + sErr + ' | ' + String((ge && ge.message) || ge)); }
      mailFallbackNotice_(to, sErr, 'SES', used);
      return used;
    }
  }
  return mailDeliverGoogle_(to, subject, body, opts);
}

/** Đường Google: MAILAPP khi chọn, còn lại GmailApp (thiếu quyền thì tự gửi lại bằng MailApp). Trả tên đường đã dùng. */
function mailDeliverGoogle_(to, subject, body, opts) {
  if (mailTransport_() === 'MAILAPP') {
    MailApp.sendEmail(Object.assign({ to: to, subject: subject, body: body }, opts));
    return (LAST_MAIL_TRANSPORT_ = 'MAILAPP');
  }
  try {
    GmailApp.sendEmail(to, subject, body, opts);
    return (LAST_MAIL_TRANSPORT_ = 'GMAILAPP');
  } catch (e) {
    if (!isMailPermissionError_(e)) throw e;
    // Thiếu quyền GmailApp (appsscript.json bị dán thiếu dòng gmail.send): gửi lại bằng MailApp để email quan trọng không mất.
    var gErr = String((e && e.message) || e);
    try { MailApp.sendEmail(Object.assign({ to: to, subject: subject, body: body }, opts)); }
    catch (e2) { throw new Error('GmailApp: ' + gErr + ' | MailApp: ' + String((e2 && e2.message) || e2)); }
    mailFallbackNotice_(to, gErr, 'GMAILAPP', 'MAILAPP');
    return (LAST_MAIL_TRANSPORT_ = 'MAILAPP');
  }
}

/**
 * Báo admin đường gửi chính hỏng và thư đã tự gửi lại bằng đường khác: tối đa 1 lần mỗi giờ (mỗi lượt chạy là một lần chạy mới,
 * cờ trong bộ nhớ không đủ). from = 'SES' hoặc 'GMAILAPP' (đường hỏng), used = đường đã gửi thay.
 */
function mailFallbackNotice_(to, err, from, used) {
  // Đặt dấu TRƯỚC khi báo: notify_ có thể gửi thư, thư đó lại tự gửi lại và gọi hàm này; dấu đã có nên dừng.
  try { var c = CacheService.getScriptCache(); if (c.get('mail_fb_notice')) return; c.put('mail_fb_notice', '1', 3600); }
  catch (x) { if (MAIL_FALLBACK_NOTIFIED_) return; MAIL_FALLBACK_NOTIFIED_ = true; }
  try { logActivity_('SYSTEM', 'MAIL_FALLBACK', 'MAIL', '', { to: to, from: from || 'GMAILAPP', used: used || 'MAILAPP', error: String(err).substring(0, 300) }); } catch (x) { }
  try {
    // Không báo qua email (đường gửi đang hỏng; email đi bằng đường dự phòng dễ bị trả về): chỉ ghi NOTIFICATIONS, như sendMail_.
    var r = notifyRule_('MAIL_FAILED'); if (r.channel === NOTIFY_CHANNEL.EMAIL) return;
    var ses = from === 'SES';
    notify_('MAIL_FAILED', {
      message: ses
        ? 'SES lỗi, thư vừa gửi lại bằng ' + used + ' (hạn mức Google). Kiểm Thuộc tính tập lệnh SES_KEY, SES_SECRET, SES_REGION, tài khoản AWS (sandbox, hạn mức, tên miền đã xác minh), rồi chạy menu Email → Kiểm tra gửi email. Lỗi: ' + err
        : 'GmailApp thiếu quyền, thư vừa gửi lại bằng MailApp (dễ bị trả về). Mở appsscript.json, kiểm dòng gmail.send, chạy menu Email → Kiểm tra gửi email để cấp quyền lại. Lỗi: ' + err,
      message_en: ses
        ? 'SES failed, the email was resent with ' + used + ' (Google quota). Check script properties SES_KEY, SES_SECRET, SES_REGION, the AWS account (sandbox, quota, verified domain), then run the mail test menu. Error: ' + err
        : 'GmailApp lacks permission, the email was resent with MailApp (may bounce). Check the gmail.send line in appsscript.json, run the mail test menu to re-authorize. Error: ' + err
    });
  } catch (x) { }
}

// ── Amazon SES (chunk 5S) ──

/** Khoá SES trong Script Properties. Trả null khi thiếu. */
function sesConfig_() {
  var p; try { p = props_().getProperties(); } catch (e) { return null; }
  var key = String(p.SES_KEY || '').trim(), secret = String(p.SES_SECRET || '').trim();
  if (!key || !secret) return null;
  var region = String(p.SES_REGION || '').trim() || SES_DEFAULT_REGION_;
  return { key: key, secret: secret, region: region, host: 'email.' + region + '.amazonaws.com' };
}

/** Địa chỉ gửi qua SES: CONFIG MAIL_FROM_ADDRESS, trống thì no-reply@mail.<tên miền của ADMIN_EMAIL>. Trống cả hai: ''. */
function mailFromAddress_() {
  var a = ''; try { a = String(cfg_('MAIL_FROM_ADDRESS') || '').trim(); } catch (e) { }
  if (a) return a;
  var adm = ''; try { adm = String(cfgList_('ADMIN_EMAIL')[0] || ''); } catch (e2) { }
  var dom = adm.indexOf('@') !== -1 ? adm.split('@')[1].trim() : '';
  return dom ? 'no-reply@mail.' + dom : '';
}

/** Mảng byte UTF-8 (có dấu, kiểu Java) của một chuỗi. */
function utf8Bytes_(s) { return Utilities.newBlob(String(s)).getBytes(); }
/** Chuỗi hex từ mảng byte có dấu. */
function bytesHex_(bytes) {
  return bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
}
/** HMAC SHA256: khoá là mảng byte, dữ liệu là chuỗi. Trả mảng byte. */
function hmacBytes_(keyBytes, value) { return Utilities.computeHmacSha256Signature(utf8Bytes_(value), keyBytes); }
/** Mốc giờ UTC dạng yyyyMMddTHHmmssZ cho AWS (hàm thuần). */
function amzDate_(d) {
  var p = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z';
}

/**
 * Hàm thuần: chữ ký AWS Signature V4 cho một yêu cầu HTTP.
 * req = { method, path, query, headers: { tên: giá trị } (phải có host và x-amz-date), payload, amzDate, region, service, key, secret }.
 * Trả { authorization, signedHeaders, canonicalRequest, stringToSign, signature }. Test I136 so với bản tính độc lập bằng Node.
 */
function sigV4_(req) {
  var hdr = {};
  Object.keys(req.headers || {}).forEach(function (k) { hdr[String(k).toLowerCase()] = String(req.headers[k]).trim().replace(/\s+/g, ' '); });
  var names = Object.keys(hdr).sort(), signed = names.join(';');
  var canonical = [String(req.method || 'GET').toUpperCase(), req.path || '/', req.query || '',
    names.map(function (h) { return h + ':' + hdr[h] + '\n'; }).join(''), signed, sha256Hex_(req.payload || '')].join('\n');
  var date = String(req.amzDate).substring(0, 8), scope = date + '/' + req.region + '/' + req.service + '/aws4_request';
  var sts = ['AWS4-HMAC-SHA256', req.amzDate, scope, sha256Hex_(canonical)].join('\n');
  var k = hmacBytes_(utf8Bytes_('AWS4' + req.secret), date);
  k = hmacBytes_(k, req.region); k = hmacBytes_(k, req.service); k = hmacBytes_(k, 'aws4_request');
  var sig = bytesHex_(hmacBytes_(k, sts));
  return {
    authorization: 'AWS4-HMAC-SHA256 Credential=' + req.key + '/' + scope + ', SignedHeaders=' + signed + ', Signature=' + sig,
    signedHeaders: signed, canonicalRequest: canonical, stringToSign: sts, signature: sig
  };
}

/** Hàm thuần: thân JSON cho SES v2 SendEmail. Trả chuỗi JSON. */
function sesPayload_(from, name, to, subject, body, opts) {
  var split = function (s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; }); };
  var fromFull = name ? '"' + String(name).replace(/["\r\n]/g, '') + '" <' + from + '>' : from;
  var dest = { ToAddresses: split(to) };
  if (opts.cc) dest.CcAddresses = split(opts.cc);
  if (opts.bcc) dest.BccAddresses = split(opts.bcc);
  var content = { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: body, Charset: 'UTF-8' } } } };
  if (opts.htmlBody) content.Simple.Body.Html = { Data: String(opts.htmlBody), Charset: 'UTF-8' };
  return JSON.stringify({ FromEmailAddress: fromFull, Destination: dest, ReplyToAddresses: opts.replyTo ? split(opts.replyTo) : [], Content: content });
}

/** Gửi một thư qua SES v2 (POST /v2/email/outbound-emails). Ném lỗi khi thiếu khoá, mất mạng hay AWS trả mã khác 2xx. Trả MessageId. */
function sesSend_(to, subject, body, opts) {
  var c = sesConfig_();
  if (!c) throw new Error('Thiếu SES_KEY, SES_SECRET trong Thuộc tính tập lệnh (Script Properties)');
  var from = mailFromAddress_();
  if (!from) throw new Error('Thiếu MAIL_FROM_ADDRESS (và ADMIN_EMAIL không có tên miền để suy ra)');
  var payload = sesPayload_(from, opts.name, to, subject, body, opts);
  // Giờ thật của Google (luật 1, ngoại lệ chữ ký): AWS từ chối chữ ký lệch quá 15 phút so với giờ của AWS.
  var amzDate = amzDate_(new Date(realNowMs_())), path = '/v2/email/outbound-emails';
  // Chỉ ký host và x-amz-date: UrlFetchApp tự đặt Content-Type, không ký để không lệch chữ ký khi Google thêm charset.
  var sig = sigV4_({ method: 'POST', path: path, query: '', headers: { host: c.host, 'x-amz-date': amzDate }, payload: payload,
    amzDate: amzDate, region: c.region, service: 'ses', key: c.key, secret: c.secret });
  var res = UrlFetchApp.fetch('https://' + c.host + path, {
    method: 'post', contentType: 'application/json', payload: payload, muteHttpExceptions: true,
    headers: { 'X-Amz-Date': amzDate, Authorization: sig.authorization }
  });
  var code = Number(res.getResponseCode()), text = String(res.getContentText() || '');
  if (code < 200 || code >= 300) throw new Error('SES trả mã ' + code + ': ' + text.substring(0, 300));
  var id = ''; try { id = String(JSON.parse(text).MessageId || ''); } catch (e) { }
  LAST_MAIL_ID_ = id;
  sesSentToday_(1);
  return id;
}

/**
 * Số thư SES đã gửi hôm nay (theo ngày của getNow_). add = 1 sau mỗi thư gửi xong, 0 để đọc. Bộ đệm theo ngày trong CacheService;
 * mất bộ đệm thì đếm lại MAIL_LOG một lần rồi đặt lại. -1 = không đọc được bộ đệm.
 */
function sesSentToday_(add) {
  var c; try { c = CacheService.getScriptCache(); } catch (e) { return -1; }
  var key = 'ses_sent_' + dateKey_(getNow_()), cur = c.get(key);
  var n = (cur === null || cur === undefined) ? sesCountMailLog_() : (Number(cur) || 0);
  n += Number(add) || 0;
  try { c.put(key, String(n), 21600); } catch (e2) { }
  return n;
}
/** Đếm trong MAIL_LOG số người nhận đã gửi qua SES hôm nay (chỉ chạy khi bộ đệm mất). */
function sesCountMailLog_() {
  var today = dateKey_(getNow_()), n = 0;
  try {
    table_('MAIL_LOG').all().forEach(function (m) {
      if (String(m.transport || '') !== 'SES') return;
      var t = asDate_(m.time); if (!t || dateKey_(t) !== today) return;
      n += String(m.to || '').split(',').filter(function (x) { return x.trim(); }).length;
    });
  } catch (e) { }
  return n;
}
