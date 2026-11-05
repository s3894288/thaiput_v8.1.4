/**
 * EmailTemplates.gs · Mẫu email song ngữ chỉnh trên tab EMAIL_TEMPLATES (chunk 5C)
 *
 * Mỗi email: nửa trên tiếng Việt, nửa dưới tiếng Anh, cùng khung emailWrap_ (thiết kế 5O đen trắng, gạch vàng thương hiệu).
 * Tiêu đề: tiếng Việt trước rồi tiếng Anh; email cho tutor để tiếng Anh trước (dễ đọc trong hộp thư của tutor).
 * Ô trống trong tab = dùng mẫu gốc dưới đây. Ô chỉ có dấu - = cố ý để trống (ví dụ bỏ tiêu đề tiếng Anh).
 * Cột active = FALSE thì không gửi mẫu đó.
 * Cú pháp: xem đầu file Content.gs.
 */

// key: [audience, subject_vi, title_vi, body_vi, subject_en, title_en, body_en, variables]
var DEFAULT_EMAIL_TEMPLATES_ = {
  LOGIN_LINK: ['ALL', 'Link đăng nhập thaiput', 'Đăng nhập thaiput',
    'Chào {{name}},\n\n{{button:login_url|Đăng nhập}}\n\n{{link_note}} Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    'Your thaiput login link', 'Log in to thaiput',
    'Hi {{name}},\n\n{{button:login_url|Log in}}\n\n{{link_note}} If you did not request it, ignore this email.',
    'name, login_url, link_note'],
  REG_RECEIVED: ['STUDENT', 'Đã nhận đăng ký {{package}}', 'Đã nhận đăng ký của bạn',
    'Chào {{name}},\n\nthaiput đã nhận đăng ký gói **{{package}}** cùng ảnh chuyển khoản. Admin sẽ xác nhận trong giờ làm việc và gửi link đăng nhập qua email này.\n\nNội dung chuyển khoản của bạn: **{{transfer_code}}**',
    'Registration received: {{package}}', 'We received your registration',
    'Hi {{name}},\n\nthaiput received your registration for **{{package}}** with the payment screenshot. Admin will confirm during working hours and send your login link to this email.\n\nYour transfer reference: **{{transfer_code}}**',
    'name, package, transfer_code'],
  WELCOME: ['STUDENT', 'Chào mừng bạn đến với thaiput', 'Tài khoản của bạn đã sẵn sàng',
    'Chào {{name}},\n\nGói **{{package}}** đã được kích hoạt. Gói bắt đầu tính từ ngày bạn học buổi đầu tiên.\n\nLưu ý: {{rule}}\n\n{{button:login_url|Đăng nhập và đặt lịch}}\n\n{{link_note}} Hết hạn thì mở trang web và yêu cầu gửi lại liên kết đăng nhập mới bằng email này.',
    'Welcome to thaiput', 'Your account is ready',
    'Hi {{name}},\n\nYour **{{package}}** package is active. It starts counting from your first lesson.\n\nNote: {{rule}}\n\n{{button:login_url|Log in and book}}\n\n{{link_note}} When it expires, open the website and request a new login link with this email.',
    'name, package, rule, login_url, link_note'],
  REG_REJECTED: ['STUDENT', 'Đăng ký chưa được xác nhận', 'Đăng ký chưa được xác nhận',
    'Chào {{name}},\n\nAdmin chưa xác nhận được khoản chuyển của bạn{{note}}.\n\nVui lòng nhắn Zalo admin để được hỗ trợ.',
    'Registration not confirmed', 'Registration not confirmed',
    'Hi {{name}},\n\nAdmin could not confirm your payment{{note}}.\n\nPlease message admin on Zalo for help.',
    'name, note'],
  BOOKING_CONFIRM: ['STUDENT', 'Xác nhận {{count}} buổi học', 'Đặt lịch thành công',
    'Chào {{name}},\n\nCác buổi đã được xác nhận:\n\n{{lessons_html}}\n\nBạn cũng nhận được thư mời Google Calendar cho từng buổi. Vào phòng đúng giờ bằng chính email này.\n\n{{failed_html}}\n\n{{cancel_rule}}\n\n{{button:portal_url|Xem lịch của tôi}}',
    '{{count}} lesson(s) confirmed', 'Booking confirmed',
    'Hi {{name}},\n\nConfirmed lessons:\n\n{{lessons_html}}\n\nYou also get a Google Calendar invitation for each lesson. Join on time with this email.\n\n{{failed_html}}\n\n{{cancel_rule}}\n\n{{button:portal_url|My lessons}}',
    'name, count, lessons_html, failed_html, cancel_rule, portal_url'],
  BOOKING_NONE: ['STUDENT', 'Chưa đặt được buổi học', 'Chưa đặt được buổi học',
    'Chào {{name}},\n\n{{failed_html}}\n\n{{button:portal_url|Chọn giờ khác}}',
    'Booking not completed', 'Booking not completed',
    'Hi {{name}},\n\n{{failed_html}}\n\n{{button:portal_url|Choose another time}}',
    'name, failed_html, portal_url'],
  TUTOR_NEW: ['TUTOR', 'Buổi học mới được giao', 'Buổi học mới của bạn',
    'Chào {{name}},\n\n{{lessons_html}}\n\n{{button:portal_url|Xem lịch dạy}}',
    'New lesson{{s}} assigned', 'New lessons assigned to you',
    'Hi {{name}},\n\n{{lessons_html}}\n\n{{button:portal_url|Open my schedule}}',
    'name, count, s, lessons_html, portal_url'],
  CANCEL_STUDENT: ['STUDENT', 'Huỷ buổi {{date}} {{slot}}', 'Buổi học đã huỷ',
    'Chào {{name}},\n\n{{lesson_html}}\n\nLý do: {{reason}}.\n\n{{rebook_html}}',
    'Lesson cancelled · {{date}} {{slot}}', 'Lesson cancelled',
    'Hi {{name}},\n\n{{lesson_html}}\n\nReason: {{reason}}.\n\n{{rebook_html}}',
    'name, date, slot, lesson_html, reason, rebook_html'],
  CANCEL_TUTOR: ['TUTOR', 'Buổi học đã huỷ · {{date}} {{slot}}', 'Buổi học đã huỷ',
    'Chào {{name}},\n\n{{lesson_html}}\n\nBuổi này đã huỷ. Slot vẫn mở cho học viên khác.',
    'Lesson cancelled · {{date}} {{slot}}', 'Lesson cancelled',
    'Hi {{name}},\n\n{{lesson_html}}\n\nThis lesson has been cancelled. The slot stays open for other students.',
    'name, date, slot, lesson_html'],
  REASSIGN_STUDENT: ['STUDENT', 'Đổi tutor buổi {{date}} {{slot}}', 'Buổi học được đổi tutor',
    'Chào {{name}},\n\n{{lesson_html}}\n\nGiờ học và link phòng giữ nguyên.',
    'Tutor changed · {{date}} {{slot}}', 'Your lesson has a new tutor',
    'Hi {{name}},\n\n{{lesson_html}}\n\nThe time and the meeting link stay the same.',
    'name, date, slot, lesson_html, new_tutor'],
  REASSIGN_OLD: ['TUTOR', 'Đã duyệt huỷ · {{date}} {{slot}}', 'Yêu cầu huỷ đã được duyệt',
    'Chào {{name}},\n\n{{lesson_html}}\n\nTutor khác sẽ dạy buổi này.',
    'Cancellation approved · {{date}} {{slot}}', 'Your cancellation was approved',
    'Hi {{name}},\n\n{{lesson_html}}\n\nAnother tutor will teach this lesson.',
    'name, date, slot, lesson_html'],
  TUTOR_DECISION_APPROVED: ['TUTOR', 'Đã duyệt · {{date}} {{slot}}', 'Yêu cầu huỷ đã được duyệt',
    'Chào {{name}},\n\nYêu cầu huỷ **{{lesson}}** đã được **duyệt**.',
    'Approved · {{date}} {{slot}}', 'Cancellation approved',
    'Hi {{name}},\n\nYour request to cancel **{{lesson}}** was **approved**.',
    'name, date, slot, lesson'],
  TUTOR_DECISION_REJECTED: ['TUTOR', 'Không duyệt · {{date}} {{slot}}', 'Bạn vẫn dạy slot này',
    'Chào {{name}},\n\nYêu cầu huỷ **{{lesson}}** **không được duyệt**. Vui lòng dạy buổi này như lịch.',
    'Not approved · {{date}} {{slot}}', 'You still teach this slot',
    'Hi {{name}},\n\nYour request to cancel **{{lesson}}** was **not approved**. Please teach this lesson as scheduled.',
    'name, date, slot, lesson'],
  REMINDER_STUDENT: ['STUDENT', 'Nhắc: buổi học lúc {{slot}} hôm nay', 'Buổi học bắt đầu sau khoảng 1 giờ',
    'Chào {{name}},\n\n{{lesson_html}}\n\n{{button:meet_url|Vào phòng học}}\n\nVào bằng chính email đã đăng ký để không phải chờ duyệt.',
    'Reminder: lesson at {{slot}} today', 'Your lesson starts in about 1 hour',
    'Hi {{name}},\n\n{{lesson_html}}\n\n{{button:meet_url|Join the lesson}}\n\nJoin with the email you registered so you do not have to wait for approval.',
    'name, slot, lesson_html, meet_url'],
  REMINDER_TUTOR: ['TUTOR', 'Nhắc: buổi dạy lúc {{slot}}', 'Buổi dạy bắt đầu sau khoảng 1 giờ',
    'Chào {{name}},\n\n{{lesson_html}}',
    'Reminder: lesson at {{slot}}', 'Your lesson starts in about 1 hour',
    'Hi {{name}},\n\n{{lesson_html}}',
    'name, slot, lesson_html'],
  MORNING_STUDENT: ['STUDENT', 'Hôm nay bạn có {{count}} buổi học', 'Buổi học hôm nay',
    'Chào {{name}},\n\n{{lessons_html}}',
    'You have {{count}} lesson{{s}} today', 'Your lessons today',
    'Hi {{name}},\n\n{{lessons_html}}',
    'name, count, s, lessons_html'],
  MORNING_TUTOR: ['TUTOR', 'Hôm nay: {{count}} buổi dạy', 'Lịch dạy hôm nay',
    'Chào {{name}},\n\n{{lessons_html}}',
    'Today: {{count}} lesson{{s}}', 'Your lessons today',
    'Hi {{name}},\n\n{{lessons_html}}',
    'name, count, s, lessons_html'],
  EXPIRY_SOON: ['STUDENT', 'Gói học sắp hết hạn {{end_date}}', 'Gói học sắp hết hạn',
    'Chào {{name}},\n\nGói **{{package}}** của bạn hết hạn ngày **{{end_date}}**.\n\n{{button:renew_url|Gia hạn gói học}}',
    'Your package ends on {{end_date}}', 'Your package is ending soon',
    'Hi {{name}},\n\nYour **{{package}}** package ends on **{{end_date}}**.\n\n{{button:renew_url|Renew my package}}',
    'name, package, end_date, renew_url'],
  // Chunk 5M: bù ngày khi buổi không diễn ra vì lỗi phía trường; hạn gói đổi (admin sửa, rút bù).
  COMP_EXTENDED: ['STUDENT', 'Gói học được cộng {{days}} ngày', 'Gói học được cộng thêm ngày',
    'Chào {{name}},\n\nBuổi học **{{lesson_date}} {{lesson_slot}}** không diễn ra vì {{reason}}. Gói **{{package}}** được cộng **{{days}} ngày**, hạn mới: **{{end_date}}**.\n\n{{button:portal_url|Đặt buổi tiếp theo}}',
    '{{days}} extra days added to your package', 'Extra days added to your package',
    'Hi {{name}},\n\nYour lesson on **{{lesson_date}} {{lesson_slot}}** did not take place because {{reason}}. Your **{{package}}** now has **{{days}} extra days**, new end date: **{{end_date}}**.\n\n{{button:portal_url|Book your next lesson}}',
    'name, lesson_date, lesson_slot, reason, package, days, end_date, portal_url'],
  PACKAGE_DATES_CHANGED: ['STUDENT', 'Hạn gói {{package}} đã điều chỉnh', 'Hạn gói học đã điều chỉnh',
    'Chào {{name}},\n\nHạn gói **{{package}}** đã được điều chỉnh: **{{old_end}}** thành **{{end_date}}**.\n\n{{button:portal_url|Xem gói học}}',
    'Your {{package}} end date changed', 'Your package end date changed',
    'Hi {{name}},\n\nThe end date of your **{{package}}** changed from **{{old_end}}** to **{{end_date}}**.\n\n{{button:portal_url|View my package}}',
    'name, package, old_end, end_date, portal_url'],
  TUTOR_REMIND: ['TUTOR', 'Vui lòng mở lịch tuần {{week}}', 'Mở lịch rảnh tuần sau',
    'Chào {{name}},\n\nBạn chưa mở slot nào cho tuần bắt đầu **{{week}}**. Hạn mở lịch: **{{deadline}}**. Sau hạn vẫn thêm giờ được; bớt giờ thì phải chờ admin duyệt.\n\n{{button:portal_url|Mở lịch rảnh}}',
    'Please submit your availability for the week of {{week}}', 'Submit next week\'s availability',
    'Hi {{name}},\n\nYou have not opened any slot for the week starting **{{week}}**. Deadline: **{{deadline}}**. After the deadline you can still add slots; removing a slot needs admin approval.\n\n{{button:portal_url|Open availability}}',
    'name, week, deadline, portal_url'],
  STAFF_NEW_LOGIN: ['ALL', 'Có đăng nhập mới vào tài khoản thaiput của bạn', 'Có đăng nhập mới',
    'Chào {{name}},\n\nTài khoản của bạn vừa đăng nhập lúc **{{time}}** trên **{{device}}** (bằng {{via}}).\n\nNếu đó là bạn hoặc người cùng quản trị, không cần làm gì. Nếu không phải: hộp thư admin có thể đã bị lộ. Đổi mật khẩu tài khoản Google ngay, kiểm tra xác minh 2 bước, rồi trong Sheets đặt status DISABLED cho dòng admin này ở tab USERS (mọi phiên bị thoát ngay), xong đặt lại ACTIVE.\n\n{{button:portal_url|Mở trang}}',
    'New sign in to your thaiput account', 'New sign in',
    'Hi {{name}},\n\nYour account just signed in at **{{time}}** on **{{device}}** (via {{via}}).\n\nIf this was you (or your co-admin), no action is needed. If not: change your Google account password now and check 2-step verification; tutors: message admin on Zalo right away so admin can sign your account out everywhere.\n\n{{button:portal_url|Open portal}}',
    'name, time, device, via, portal_url'],
  ADMIN_NEW_REG: ['ADMIN', '[Đăng ký mới] {{name}} · {{package}}', 'Có đăng ký mới cần duyệt',
    'Loại: {{kind}}\nHọ tên: **{{name}}**\nEmail: {{email}}\nĐiện thoại: {{phone}}\nGói: {{package}} · {{price}}\nMã chuyển khoản: {{transfer_code}}\nẢnh chuyển khoản: {{screenshot_url}}\n\nDuyệt tại tab REGISTRATIONS: chọn "Duyệt" ở cột admin_action.\n\n{{button:sheet_link|Mở đúng dòng trong Sheets}}',
    '[New registration] {{name}} · {{package}}', 'New registration to approve',
    'Type: {{kind}}\nName: **{{name}}**\nEmail: {{email}}\nPhone: {{phone}}\nPackage: {{package}} · {{price}}\nTransfer reference: {{transfer_code}}\nPayment screenshot: {{screenshot_url}}\n\nApprove in the REGISTRATIONS tab: choose "Duyệt" in the admin_action column.\n\n{{button:sheet_link|Open the row in Sheets}}',
    'kind, name, email, phone, package, price, transfer_code, screenshot_url, sheet_link'],
  ADMIN_TUTOR_CANCEL: ['ADMIN', '[Duyệt] {{tutor}} xin huỷ {{lesson}}', 'Tutor xin huỷ slot',
    'Tutor **{{tutor}}** xin huỷ slot **{{lesson}}**.\n\n{{booked_note}}\n\nDuyệt tại tab AVAILABILITY, cột admin_decision. Lựa chọn: {{options}}. Phải quyết định trước giờ học {{hours}} giờ, quá hạn hệ thống tự từ chối.\n\n{{button:sheet_link|Mở đúng dòng trong Sheets}}',
    '[Approve] {{tutor}} asks to cancel {{lesson}}', 'Tutor asks to cancel a slot',
    'Tutor **{{tutor}}** asks to cancel **{{lesson}}**.\n\n{{booked_note}}\n\nDecide in the AVAILABILITY tab, admin_decision column, at least {{hours}} hours before the lesson; otherwise the system rejects it automatically.\n\n{{button:sheet_link|Open the row in Sheets}}',
    'tutor, lesson, booked_note, options, hours, sheet_link'],
  ADMIN_NOTICE: ['ADMIN', '[{{tag}}] {{message}}', '{{tag}}',
    '{{message}}\n\n{{button:sheet_link|Mở trong Sheets}}\n\nSự kiện {{event}} · {{time}}',
    '[{{tag}}] {{message}}', '{{tag}}',
    '{{message}}\n\n{{button:sheet_link|Open in Sheets}}\n\nEvent {{event}} · {{time}}',
    'tag, message, event, time, sheet_link'],
  ADMIN_DIGEST: ['ADMIN', '[Tổng hợp {{date}}] {{count}} thông báo', 'Tổng hợp trong ngày',
    '{{summary_html}}\n\n{{table_html}}\n\n{{button:sheet_link|Mở tab NOTIFICATIONS}}',
    '[Daily summary {{date}}] {{count}} notifications', 'Daily summary',
    '{{count}} notifications today. Full list above and in the NOTIFICATIONS tab.',
    'date, count, summary_html, table_html, sheet_link'],
  // Chunk 5I: menu "Kiểm tra gửi email": thư nhỏ có mã để tìm trong hộp thư và trong Email Log Search của admin.google.com.
  MAIL_TEST: ['ALL', 'Kiểm tra gửi email thaiput {{code}}', 'Email kiểm tra',
    'Đây là email kiểm tra admin gửi từ menu thaiput lúc **{{time}}**.\n\nMã kiểm tra: **{{code}}**. Thấy email này nghĩa là đường gửi từ {{sender}} tới hộp thư này đang hoạt động. Không cần trả lời.',
    'thaiput email test {{code}}', 'Test email',
    'This is a test email sent by admin from the thaiput menu at **{{time}}**.\n\nTest code: **{{code}}**. If you can read this, mail from {{sender}} reaches this inbox. No reply needed.',
    'code, time, sender'],
  ADMIN_ERROR: ['ADMIN', '[Lỗi hệ thống] {{subject}}', 'Lỗi cần kiểm tra',
    '{{detail_html}}', '[System error] {{subject}}', 'Error to check',
    'Technical details are above. Copy them to Claude to fix.', 'subject, detail_html']
};
// Chunk 5H: chân của mọi email marketing (tab MARKETING_EMAILS). Không gửi riêng; tắt (active FALSE) hoặc để trống thì dùng chữ gốc (luôn có câu từ chối nhận).
DEFAULT_EMAIL_TEMPLATES_.MARKETING_FOOTER = ['MARKETING', 'Chân email marketing', '',
  'Bạn nhận email này vì đã đăng ký học tại thaiput. Không muốn nhận email giới thiệu, ưu đãi nữa? Nhắn Zalo admin, thaiput sẽ ngừng gửi.',
  'Marketing email footer', '',
  'You get this email because you signed up with thaiput. Do not want offers and news anymore? Message admin on Zalo and we will stop.',
  ''];
/*
 * Chunk 5I: mẫu gốc đã đổi mà tab EMAIL_TEMPLATES còn đúng chữ gốc cũ (admin chưa sửa): menu 1 thay bằng chữ gốc mới.
 * Ô admin đã sửa (khác chữ gốc cũ) giữ nguyên. key → { cột: chữ gốc cũ }.
 */
var TEMPLATE_UPGRADES_ = {
  ADMIN_NOTICE: { subject_en: '[{{tag}}] {{event}}', body_en: 'Event {{event}} at {{time}}. Details are in Vietnamese above and in the NOTIFICATIONS tab.' },
  // Chunk 5J: nhắc thứ Sáu nên không còn "hôm nay".
  TUTOR_REMIND: { body_vi: 'Chào {{name}},\n\nBạn chưa mở slot nào cho tuần bắt đầu **{{week}}**. Hạn: **hôm nay {{deadline}}**.\n\n{{button:portal_url|Mở lịch rảnh}}',
    body_en: 'Hi {{name}},\n\nYou have not opened any slot for the week starting **{{week}}**. Deadline: **today {{deadline}}**.\n\n{{button:portal_url|Open availability}}' }
};
var TEMPLATE_COLS_ = ['audience', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'variables'];

/** Mẫu đang dùng: dòng trong EMAIL_TEMPLATES ghi đè từng ô của mẫu gốc (ô trống thì dùng gốc). */
function emailTemplate_(key) {
  if (!TEMPLATE_CACHE_) {
    TEMPLATE_CACHE_ = {};
    try { table_('EMAIL_TEMPLATES').all().forEach(function (r) { TEMPLATE_CACHE_[String(r.key).trim()] = r; }); } catch (e) { }
  }
  var d = DEFAULT_EMAIL_TEMPLATES_[key], row = TEMPLATE_CACHE_[key] || {}, t = { key: key, active: true };
  if (!d && !TEMPLATE_CACHE_[key]) return null;
  TEMPLATE_COLS_.forEach(function (c, i) {
    var v = row[c] === undefined || row[c] === null ? '' : String(row[c]);
    // Soát 5J: ô còn đúng chữ gốc cũ (TEMPLATE_UPGRADES_) thì dùng chữ gốc mới ngay, không chờ menu 1 (luật 38).
    if (v !== '' && d && TEMPLATE_UPGRADES_[key] && TEMPLATE_UPGRADES_[key][c] === v) v = '';
    t[c] = v.trim() === '-' ? '' : (v !== '' ? v : (d ? d[i] : ''));   // ô trống = mẫu gốc; dấu - = cố ý để trống
  });
  if (row.active !== undefined && row.active !== '' && (row.active === false || String(row.active).toUpperCase() === 'FALSE')) t.active = false;
  return t;
}

/** Thay {{bien}} trong một dòng chữ thường (tiêu đề): không thoát HTML, biến _html bị bỏ. */
function renderPlain_(text, vars, lang) {
  return String(text || '').replace(/\{\{\s*([\w:|. ]+?)\s*\}\}/g, function (m, k) {
    if (/^button:/.test(k) || /_html$/.test(k)) return '';
    var v = tplVar_(vars, k, lang);
    return v === undefined ? '' : String(v);
  });
}
function tplVar_(vars, k, lang) {
  if (vars[k + '_' + lang] !== undefined) return vars[k + '_' + lang];
  return vars[k];
}
/** Chữ thường thành HTML an toàn: thoát ký tự, **đậm**. */
function inlineHtml_(s) { return esc_(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }

/**
 * Thân email: đoạn cách nhau dòng trống, dòng trong đoạn nối bằng <br>.
 * {{bien}} chữ thường được thoát; {{bien_html}} là khối HTML code dựng sẵn (danh sách buổi học); {{button:bien|Chữ}} là nút.
 * Đoạn rỗng sau khi thay biến (ví dụ không có buổi lỗi) bị bỏ.
 */
function renderBody_(text, vars, lang) {
  return String(text || '').split(/\n\s*\n/).map(function (para) {
    var blocks = [], html = '';
    var parts = para.split(/(\{\{[^}]+\}\})/);
    parts.forEach(function (p) {
      var m = p.match(/^\{\{\s*(.+?)\s*\}\}$/);
      if (!m) { html += inlineHtml_(p).replace(/\n/g, '<br>'); return; }
      var k = m[1];
      if (/^button:/.test(k)) {
        var bm = k.substring(7).split('|'), url = tplVar_(vars, bm[0].trim(), lang);
        if (url) blocks.push(btn_(String(url), (bm[1] || 'Mở').trim()));
        return;
      }
      var v = tplVar_(vars, k, lang);
      if (v === undefined || v === null) return;
      if (/_html$/.test(k)) { if (String(v)) blocks.push(String(v)); return; }
      html += esc_(String(v));
    });
    var out = (html.replace(/<br>/g, '').trim() ? '<p style="margin:0 0 12px">' + html + '</p>' : '') + blocks.join('');
    return out;
  }).join('');
}

/** Khung email song ngữ (khung 5O trong emailWrap_). Mặc định tiếng Việt trên, tiếng Anh dưới; enFirst (email cho tutor) thì đảo lại. */
function emailWrapBi_(titleVi, htmlVi, titleEn, htmlEn, enFirst) {
  var first = enFirst && htmlEn ? [titleEn, htmlEn, titleVi, htmlVi, 'Tiếng Việt'] : [titleVi, htmlVi, titleEn, htmlEn, 'English'];
  var second = first[3] ? '<div style="margin-top:22px;padding-top:18px;border-top:1px dashed #d6d6d1">' +
    '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#63635d;margin-bottom:8px">' + first[4] + '</div>' +
    '<h2 style="margin:0 0 14px;font-size:19px;color:#141414">' + esc_(first[2]) + '</h2>' + first[3] + '</div>' : '';
  return emailWrap_(first[0], first[1] + second, 'bi');
}

/**
 * Gửi email theo mẫu. opts: { enFirst (tiếng Anh trước khi người nhận chưa chọn ngôn ngữ, cho tutor), kind, priority }.
 * Trả false nếu mẫu bị tắt (active FALSE), không có mẫu, hoặc gửi không được.
 */
function sendTpl_(key, to, vars, opts) {
  opts = opts || {};
  var t = emailTemplate_(key);
  if (!t) throw new Error('Không có mẫu email ' + key);
  if (!t.active) { logActivity_('SYSTEM', 'MAIL_TEMPLATE_OFF', 'MAIL', key, to); return false; }
  vars = vars || {};
  // Chunk 5H: người nhận đã chọn ngôn ngữ (USERS.lang) thì thứ tiếng đó ở trên; chưa chọn thì theo mặc định của nơi gọi
  // (tutor tiếng Anh trước, còn lại tiếng Việt trước). Email vẫn luôn có cả hai thứ tiếng.
  var pref = userLangByEmail_(to), enFirst = pref ? pref === 'en' : !!opts.enFirst;
  var sVi = renderPlain_(t.subject_vi, vars, 'vi').trim(), sEn = renderPlain_(t.subject_en, vars, 'en').trim();
  var subject = sVi && sEn ? (enFirst ? sEn + ' | ' + sVi : sVi + ' | ' + sEn) : (sVi || sEn);
  var html = emailWrapBi_(renderPlain_(t.title_vi, vars, 'vi'), renderBody_(t.body_vi, vars, 'vi'),
    renderPlain_(t.title_en, vars, 'en'), t.body_en ? renderBody_(t.body_en, vars, 'en') : '', enFirst);
  return sendMail_(to, subject, html, opts.kind || key, opts.priority || 'high');
}

/** Dữ liệu mẫu để gửi thử (menu "Gửi thử một mẫu email cho tôi"): mọi biến có giá trị minh hoạ. */
function sampleTplVars_(key) {
  var lesson = '<ul style="padding-left:18px"><li style="margin:6px 0"><b>Thứ 4 14/10</b> · 19:00 - 19:30 · Tutor Vân · <a href="https://meet.google.com/">Google Meet</a></li></ul>';
  var url = portalUrl_('student');
  return {
    name: 'Minh Anh', package: 'Gói 1 tháng', package_en: '1 month pass', transfer_code: 'TP R00012 1M', login_url: url, link_note: linkUseText_(false), link_note_en: linkUseText_(true),
    rule: 'đặt buổi cho ngày mai trước 15:00 hôm nay; huỷ cũng phải trước 15:00 hôm trước.', rule_en: 'book tomorrow\'s lessons before 15:00 today; cancel before 15:00 the day before.',
    note: '', count: 2, s: 's', lessons_html: lesson, lesson_html: lesson, failed_html: '', cancel_rule: 'Huỷ buổi trước 15:00 hôm trước trong mục "Lịch của tôi".',
    cancel_rule_en: 'Cancel before 15:00 the day before in "My lessons".', portal_url: url, renew_url: url, meet_url: 'https://meet.google.com/', date: '14/10', slot: '19:00',
    lesson: 'Thứ 4 14/10 19:00', reason: 'bạn đã huỷ', reason_en: 'you cancelled', rebook_html: '', new_tutor: 'Ánh', end_date: '03/11/2026', week: '19/10/2026', deadline: '22:00 Thứ 7 17/10', deadline_en: '22:00 Sat 17/10',
    kind: 'Đăng ký mới', email: 'minhanh@example.com', phone: '0912 345 678', price: '1.790.000đ', screenshot_url: url, sheet_link: url,
    tutor: 'Vân', booked_note: 'Slot đã có học viên: Minh Anh.', booked_note_en: 'A student is booked: Minh Anh.', options: 'Duyệt, tự chọn tutor thay; Duyệt, chỉ định tutor thay; Duyệt, huỷ buổi; Từ chối', hours: 3,
    device: 'Chrome · Windows', via: 'link email', via_en: 'email link',
    tag: 'Cần xử lý', tag_en: 'Action needed', message: 'Ví dụ thông báo', message_en: 'Sample notification', code: 'MT0000', sender: 'admin@example.com', event: 'STUDENT_CANCELLED', time: fmtDateTime_(getNow_()),
    lesson_date: 'Thứ 2 20/10', lesson_slot: '19:00', days: 3, old_end: '20/10/2026',
    summary_html: '<ul><li>RESULT_COMPLETED: <b>5</b></li></ul>', table_html: '', subject: 'Ví dụ lỗi', detail_html: '<pre>Ví dụ chi tiết lỗi</pre>'
  };
}
