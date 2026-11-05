/**
 * thaiput Google login · Dự án Apps Script PHỤ, riêng biệt với dự án chính (chunk 5D)
 *
 * Việc duy nhất: hỏi Google "ai đang đăng nhập trình duyệt này", ký kết quả bằng khoá bí mật chung,
 * rồi đưa người dùng sang trang chính. Không đọc, không ghi Sheets, không gửi email.
 *
 * Triển khai: Web app · Thực thi với tư cách: Người dùng truy cập web app · Ai có quyền truy cập: Bất kỳ ai có tài khoản Google.
 * Script Properties (Cài đặt dự án > Thuộc tính tập lệnh):
 *   GOOGLE_LOGIN_SECRET   khoá do menu "Đăng nhập Google: tạo khoá bí mật" của dự án chính tạo ra
 *   MAIN_URL              link web app chính (kết thúc bằng /exec)
 * Người dùng chỉ thấy email của chính mình; không ai đọc được khoá vì họ không có quyền mở dự án này.
 */
function doGet() {
  var email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  var p = PropertiesService.getScriptProperties(), secret = p.getProperty('GOOGLE_LOGIN_SECRET'), main = p.getProperty('MAIN_URL');
  if (!secret || !main) return page_('Chưa cài đặt · Not set up', 'Admin chưa điền GOOGLE_LOGIN_SECRET và MAIN_URL trong Script Properties của dự án này. / Admin has not set up this sign in page yet.', '');
  if (!email) return page_('Không đọc được email Google · Google email not available', 'Hãy đăng nhập Google rồi mở lại link. Trình duyệt có nhiều tài khoản Google thì mở cửa sổ ẩn danh và chỉ đăng nhập một tài khoản. / Sign in to Google and open the link again. If your browser has several Google accounts, use a private window with one account.', '');
  var ts = String(Date.now());
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(email + '|' + ts, secret)).replace(/=+$/, '');
  var url = main + (main.indexOf('?') === -1 ? '?' : '&') + 'page=gauth&ge=' + encodeURIComponent(email) + '&gts=' + ts + '&gs=' + encodeURIComponent(sig);
  return page_('Đăng nhập thaiput · Sign in', 'Tài khoản Google / Google account: ' + email + '. Bấm trong 2 phút / Continue within 2 minutes.', url);
}

function page_(title, text, url) {
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var html = '<!DOCTYPE html><html><head><base target="_top"><meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
    '<body style="font-family:system-ui,sans-serif;max-width:420px;margin:48px auto;padding:0 16px;color:#1f2a24">' +
    '<h2 style="color:#14532d">' + esc(title) + '</h2><p>' + esc(text) + '</p>' +
    (url ? '<p><a href="' + esc(url) + '" style="display:inline-block;background:#14532d;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600">Tiếp tục · Continue</a></p>' : '') +
    '</body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('thaiput · Đăng nhập Google').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
