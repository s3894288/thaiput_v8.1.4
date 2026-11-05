/**
 * MailTransport.gs · Đường gửi email cố định (chunk 5Q, thay MailFix)
 *
 * Chỗ DUY NHẤT trong code được gọi dịch vụ gửi thư và đọc hạn mức email (test U49 quét src/, gọi ở file khác là đỏ).
 * Mọi email vẫn đi qua sendMail_ (Notify.gs) và sendTpl_ (luật 19, 32).
 *
 * CONFIG MAIL_TRANSPORT:
 *   GMAILAPP (mặc định) = GmailApp.sendEmail, đúng cách MailFix đã chạy từ 22/10: thư có bản HTML kèm bản chữ thuần,
 *                         tên hiển thị MAIL_FROM_NAME, trả lời về ADMIN_EMAIL. Không bị trả về hàng loạt như MailApp.
 *   MAILAPP             = MailApp.sendEmail (cách cũ, dự phòng; thư từng bị trả về trên tên miền của trường).
 *   Gõ sai hoặc trống: dùng GMAILAPP.
 * Quyền: GmailApp dùng quyền gmail.send (đã có trong appsscript.json từ 5J). Google báo thiếu quyền khi gửi bằng GmailApp
 * thì thư đó tự gửi lại bằng MailApp (ghi MAIL_FALLBACK, báo admin), để email quan trọng không mất.
 * Hạn mức: Google tính chung mọi thư Apps Script gửi trong ngày; đọc bằng MailApp.getRemainingDailyQuota (GmailApp
 * không có hàm đọc hạn mức). Đọc lỗi thì trả -1 (không rõ).
 */

var MAIL_TRANSPORTS_ = ['GMAILAPP', 'MAILAPP'];
var MAIL_FALLBACK_NOTIFIED_ = false;
/** Đường gửi của thư gần nhất trong lượt chạy này (menu Kiểm tra gửi email hiện đường thật đã dùng, kể cả khi tự gửi lại). */
var LAST_MAIL_TRANSPORT_ = '';

function mailTransport_() {
  var m = ''; try { m = String(cfg_('MAIL_TRANSPORT') || '').trim().toUpperCase(); } catch (e) { }
  return MAIL_TRANSPORTS_.indexOf(m) === -1 ? 'GMAILAPP' : m;
}

/** Hạn mức email còn lại hôm nay (số người nhận). -1 = không đọc được. */
function mailBudget_() {
  try { var n = Number(MailApp.getRemainingDailyQuota()); return isNaN(n) ? -1 : n; } catch (e) { return -1; }
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
 * Gửi một thư. msg = { to, subject, htmlBody, name, replyTo, cc, bcc }. Ném lỗi khi Google từ chối (sendMail_ bắt và ghi MAIL_FAILED).
 * Trả tên đường đã gửi ('GMAILAPP' hoặc 'MAILAPP').
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
    mailFallbackNotice_(to, gErr);
    return (LAST_MAIL_TRANSPORT_ = 'MAILAPP');
  }
}

/** Báo admin GmailApp thiếu quyền: tối đa 1 lần mỗi giờ (mỗi lượt chạy là một lần chạy mới, cờ trong bộ nhớ không đủ). */
function mailFallbackNotice_(to, err) {
  // Đặt dấu TRƯỚC khi báo: notify_ có thể gửi thư, thư đó lại tự gửi lại và gọi hàm này; dấu đã có nên dừng.
  try { var c = CacheService.getScriptCache(); if (c.get('mail_fb_notice')) return; c.put('mail_fb_notice', '1', 3600); }
  catch (x) { if (MAIL_FALLBACK_NOTIFIED_) return; MAIL_FALLBACK_NOTIFIED_ = true; }
  try { logActivity_('SYSTEM', 'MAIL_FALLBACK', 'MAIL', '', { to: to, error: String(err).substring(0, 300) }); } catch (x) { }
  try {
    // Không báo qua email (đường gửi đang hỏng; email đi bằng MailApp dễ bị trả về): chỉ ghi NOTIFICATIONS, như sendMail_.
    var r = notifyRule_('MAIL_FAILED'); if (r.channel === NOTIFY_CHANNEL.EMAIL) return;
    notify_('MAIL_FAILED', {
      message: 'GmailApp thiếu quyền, thư vừa gửi lại bằng MailApp (dễ bị trả về). Mở appsscript.json, kiểm dòng gmail.send, chạy menu Email → Kiểm tra gửi email để cấp quyền lại. Lỗi: ' + err,
      message_en: 'GmailApp lacks permission, the email was resent with MailApp (may bounce). Check the gmail.send line in appsscript.json, run the mail test menu to re-authorize. Error: ' + err
    });
  } catch (x) { }
}
