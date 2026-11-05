/**
 * Notifications.gs · Thông báo cho admin theo mức độ (chunk 5B)
 *
 * Mọi sự kiện cần admin biết đều ghi 1 dòng vào tab NOTIFICATIONS (lưu lại để tra cứu, tô màu theo mức).
 * Kênh của từng sự kiện do admin chỉnh ở tab NOTIFY_RULES:
 *   EMAIL   gửi email ngay tới ADMIN_EMAIL (việc cần xử lý: huỷ, lỗi, chờ duyệt)
 *   DIGEST  gom vào 1 email tổng hợp lúc DIGEST_HOUR (việc bình thường: buổi hoàn thành, đổi tutor)
 *   LOG     chỉ ghi vào tab, không email
 * Email admin chỉ gửi tới ADMIN_EMAIL (một địa chỉ, hoặc nhóm admin@ trên Workspace), để không nhân hạn mức email.
 */

var DEFAULT_NOTIFY_RULES_ = {
  SYSTEM_ERROR: ['CRITICAL', 'EMAIL', 'Lỗi hệ thống (tối đa 1 email mỗi giờ cho cùng một lỗi)'],
  CALENDAR_FAILED: ['CRITICAL', 'EMAIL', 'Không tạo hoặc sửa được sự kiện Calendar, cần gửi link Meet tay'],
  // Chunk 5F: job đối soát mỗi giờ.
  DATA_INVARIANT: ['CRITICAL', 'EMAIL', 'Dữ liệu sai luật: hai học viên cùng một tutor cùng giờ, hoặc học viên quá số buổi mỗi ngày'],
  CALENDAR_LATE: ['WARNING', 'EMAIL', 'Buổi sắp diễn ra mà chưa có sự kiện Calendar (link Meet), gộp một email mỗi lần đối soát'],
  CALENDAR_BATCH_FAILED: ['CRITICAL', 'EMAIL', 'Cả lô tạo sự kiện Calendar lỗi ngay lần đầu (dịch vụ, lịch, hạn mức)'],
  // Chunk 5G
  SHEET_REMOVED: ['CRITICAL', 'EMAIL', 'Tab dữ liệu của hệ thống bị xoá hoặc đổi tên trong Sheets: hệ thống sẽ lỗi tới khi khôi phục'],
  PURGE_CHECK: ['CRITICAL', 'EMAIL', 'Lần bỏ dòng (lưu trữ, dọn) bị cắt và tab bị sửa tay sau đó: cần admin kiểm dòng trùng ở cuối tab'],
  ARCHIVE_FAILED: ['CRITICAL', 'EMAIL', 'Lưu trữ hằng tháng: đọc lại file lưu trữ thiếu dòng, đã dừng (không bỏ dòng nào khỏi DB)'],
  CALENDAR_NIGHTLY: ['INFO', 'LOG', 'Tổng kết lô Calendar đêm qua, không có vấn đề'],
  CALENDAR_NIGHTLY_PROBLEM: ['WARNING', 'EMAIL', 'Tổng kết lô Calendar đêm qua còn lỗi hoặc còn buổi sắp tới chưa có sự kiện'],
  NEW_REGISTRATION: ['WARNING', 'EMAIL', 'Có đăng ký hoặc gia hạn mới chờ duyệt'],
  TUTOR_CANCEL_REQUEST: ['WARNING', 'EMAIL', 'Tutor xin huỷ slot, cần duyệt trước giờ học'],
  STUDENT_CANCELLED: ['WARNING', 'EMAIL', 'Học viên huỷ buổi'],
  RESULT_TECH_ISSUE: ['WARNING', 'EMAIL', 'Tutor báo buổi học gặp vấn đề kỹ thuật (không trừ buổi, xem có tính lương không)'],
  RESULT_STUDENT_ABSENT: ['WARNING', 'DIGEST', 'Tutor báo học viên vắng (vẫn trừ buổi)'],
  TUTOR_NO_AVAILABILITY: ['WARNING', 'EMAIL', 'Quá hạn mở lịch (TUTOR_DEADLINE_AT) mà tutor chưa mở giờ nào cho tuần sau'],
  RESULT_COMPLETED: ['INFO', 'DIGEST', 'Tutor xác nhận buổi hoàn thành'],
  AUTO_COMPLETED: ['INFO', 'DIGEST', 'Bản cũ tới 8.1.0: buổi tự chuyển Hoàn thành. Từ 8.1.1 không còn (xem RESULT_OVERDUE, RESULT_NOT_COMPLETED)'],
  REASSIGNED: ['INFO', 'DIGEST', 'Buổi được đổi sang tutor khác'],
  TUTOR_CANCEL_AUTO_REJECTED: ['INFO', 'DIGEST', 'Yêu cầu huỷ của tutor tự bị từ chối vì admin chưa duyệt kịp'],
  BOOKED: ['INFO', 'LOG', 'Học viên đặt buổi'],
  ADMIN_CANCELLED: ['INFO', 'LOG', 'Admin huỷ buổi trên giao diện admin'],
  MAIL_FAILED: ['WARNING', 'DIGEST', 'Email gửi không thành công (hết hạn mức hoặc địa chỉ hỏng)'],
  // Chunk 5M: bù buổi, khoá gói
  COMP_EXTENDED: ['INFO', 'DIGEST', 'Gói học được cộng ngày bù (buổi lỗi phía trường), học viên đã nhận email'],
  COMP_ON_EXPIRED: ['WARNING', 'EMAIL', 'Buổi được bù thuộc gói đã hết hạn quá lâu hoặc gói sau đã chạy: hệ thống không tự cộng, admin cộng tay ở comp_days_admin'],
  COMP_RETRACT_BLOCKED: ['WARNING', 'EMAIL', 'Không rút ngày bù được vì học viên đã đặt buổi trong những ngày đó: huỷ các buổi ấy, hoặc giữ ngày bằng cách cộng vào comp_days_admin'],
  TRIAL_LEFT_UNUSED: ['WARNING', 'EMAIL', 'Học viên Trial còn lượt mà không còn ngày đặt được (đã dùng hết lần cộng 3 ngày): admin cộng tay nếu muốn'],
  COMP_QUEUE_CONFLICT: ['WARNING', 'EMAIL', 'Gói nối đuôi dời ngày nhưng có buổi không chuyển sang gói trước được (gói trước hết lượt)'],
  PACKAGE_EDIT_DENIED: ['WARNING', 'DIGEST', 'Có người sửa ô hệ thống của STUDENT_PACKAGES: đã trả lại giá trị cũ'],
  PACKAGE_HEALED: ['WARNING', 'EMAIL', 'Đối soát mỗi giờ thấy ngày gói lệch luật (dán đè, sắp xếp, sửa qua API): đã ghi lại giá trị đúng'],
  PACKAGE_ROW_MISSING: ['CRITICAL', 'EMAIL', 'Buổi học trỏ tới gói không còn trong STUDENT_PACKAGES (dòng gói bị xoá): khôi phục từ bản sao lưu đêm'],
  PACKAGE_PASTE_UNSAFE: ['CRITICAL', 'EMAIL', 'Ô hệ thống của STUDENT_PACKAGES bị dán đè mà không tự lành được (mã gói, học viên, ngày mua...): khôi phục từ bản sao lưu đêm'],
  BOOKING_OUT_OF_RANGE: ['WARNING', 'EMAIL', 'Ngày bắt đầu khoá sớm hơn làm buổi đã đặt nằm ngoài hạn gói: huỷ buổi hoặc cộng ngày ở comp_days_admin'],
  TRIAL_OVER_LIMIT: ['WARNING', 'EMAIL', 'Trial dùng quá số lượt sau khi đổi lỗi buổi kỹ thuật sang học viên: admin quyết định, hệ thống không tự huỷ'],
  // Chunk 5J (câu 29 đổi 01/11): báo đỏ trên trang quản trị, không email (đổi kênh ở tab NOTIFY_RULES nếu muốn).
  RESULT_OVERDUE: ['CRITICAL', 'LOG', 'Tutor quá RESULT_NOTICE_AFTER_HOURS giờ chưa chọn kết quả buổi: nhắc tutor trước khi buổi thành Không hoàn thành'],
  RESULT_NOT_COMPLETED: ['WARNING', 'DIGEST', 'Buổi thành Không hoàn thành vì tutor không chọn kết quả (không tính lương)'],
  TECH_MIGRATED: ['WARNING', 'EMAIL', 'Bản 8.1.0 chuyển buổi kỹ thuật cũ "Tính lương" sang Lỗi khách quan: admin xem lại từng buổi và chọn đúng lỗi']
};

var NOTIFY_RULES_CACHE_ = null;

/** Luật của một sự kiện: { level, channel }. Tab NOTIFY_RULES ghi đè mặc định; giá trị sai thì dùng mặc định. */
function notifyRule_(event) {
  if (!NOTIFY_RULES_CACHE_) {
    NOTIFY_RULES_CACHE_ = {};
    try { table_('NOTIFY_RULES').all().forEach(function (r) { NOTIFY_RULES_CACHE_[String(r.event).trim()] = r; }); } catch (e) { }
  }
  var d = DEFAULT_NOTIFY_RULES_[event] || ['INFO', 'LOG', ''], r = NOTIFY_RULES_CACHE_[event] || {};
  var level = String(r.level || '').trim().toUpperCase(), channel = String(r.channel || '').trim().toUpperCase();
  return { level: NOTIFY_LEVEL[level] ? level : d[0], channel: NOTIFY_CHANNEL[channel] ? channel : d[1] };
}

/** Link mở thẳng đúng tab và đúng dòng trong file Sheets (cho email admin và cột link của NOTIFICATIONS). */
function rowLink_(tableName, row) {
  try {
    var ss = dbSpreadsheet_(), sh = ss.getSheetByName(tableName);
    return ss.getUrl() + '#gid=' + sh.getSheetId() + (row ? '&range=A' + row : '');
  } catch (e) { return ''; }
}

/**
 * Ghi một thông báo và gửi theo kênh. info: { actor, student_id, tutor_id, entity, entity_id, message, link }.
 * emailFn (không bắt buộc): hàm gửi email riêng cho sự kiện này (ví dụ email duyệt đăng ký có chi tiết);
 * không có thì gửi email chung. Trả dòng NOTIFICATIONS đã ghi.
 */
function notify_(event, info, emailFn) {
  info = info || {};
  var rule = notifyRule_(event), now = getNow_(), holder = { row: null };
  var write = function () {
    holder.row = table_('NOTIFICATIONS').insert({
      notif_id: nextId_('NOTIFICATIONS'), time: now, level: rule.level, event: event, channel: rule.channel,
      actor: info.actor || 'SYSTEM', student_id: info.student_id || '', tutor_id: info.tutor_id || '',
      entity: info.entity || '', entity_id: info.entity_id || '', message: String(info.message || '').substring(0, 500), message_en: String(info.message_en || '').substring(0, 500),
      link: info.link || '', read: false
    });
    return holder.row;
  };
  var markEmailed = function () {
    if (!holder.row) return;
    var t = table_('NOTIFICATIONS'), r = t.byId(holder.row.notif_id);
    if (r) t.update(r, { emailed_at: getNow_() });
  };
  var sendEmail = function () {
    var sent = false;
    try { sent = emailFn ? emailFn() !== false : mailAdminNotice_(rule.level, event, info); } catch (e) { Logger.log('notify email lỗi: ' + e.message); }
    return sent;
  };
  // Tab NOTIFICATIONS chưa có (dán code mới nhưng chưa chạy menu 1): vẫn gửi email theo kênh, không làm hỏng việc đang làm.
  var safeWrite = function () { try { write(); } catch (e) { if (String(e.message) === BUSY_MESSAGE_) throw e; Logger.log('notify_ không ghi được NOTIFICATIONS: ' + e.message); } };
  var isEmail = rule.channel === NOTIFY_CHANNEL.EMAIL;
  if (DB_LOCK_DEPTH_) {
    // Trong khoá (chunk 5F): ghi dòng ngay, email gửi sau khi nhả khoá để không giữ khoá lúc chờ Gmail.
    safeWrite();
    if (isEmail) afterLock_(function () { if (sendEmail()) deferWrite_(markEmailed); });
  } else if (deferActive_()) {
    // Sau khi đã ghi xong việc chính (pha sau khoá): gom vào lần ghi cuối, không lấy khoá riêng.
    deferWrite_(safeWrite);
    if (isEmail && sendEmail()) deferWrite_(markEmailed);
  } else {
    try { withLock_(safeWrite); } catch (e) { if (String(e.message) === BUSY_MESSAGE_) throw e; }
    if (isEmail && sendEmail() && holder.row) withLock_(markEmailed);
  }
  return holder.row;
}

/** Email chung cho admin: mức, nội dung, nút mở đúng dòng trong Sheets (mẫu ADMIN_NOTICE). */
function mailAdminNotice_(level, event, info) {
  var tag = { CRITICAL: ['Khẩn', 'Urgent'], WARNING: ['Cần xử lý', 'Action needed'], INFO: ['Thông tin', 'Info'] }[level] || [level, level];
  return sendTpl_('ADMIN_NOTICE', adminEmails_().join(','), { tag: tag[0], tag_en: tag[1], message: String(info.message || event).substring(0, 300),
    message_en: String(info.message_en || info.message || event).substring(0, 300),
    event: event, time: fmtDateTime_(getNow_()), sheet_link: info.link || '' }, { kind: 'ADMIN_' + event });
}

/**
 * Email tổng hợp cuối ngày: mọi thông báo kênh DIGEST chưa tổng hợp. Gọi từ hourlyJob, 1 lần mỗi ngày từ DIGEST_HOUR.
 * Không có gì thì không gửi. Trả số dòng đã tổng hợp.
 */
function sendDailyDigestInLock_(now) {
  var t = table_('NOTIFICATIONS');
  var rows = t.filter(function (n) { return n.channel === NOTIFY_CHANNEL.DIGEST && !n.digest_at; });
  if (!rows.length) return 0;
  var order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  rows.sort(function (a, b) { return (order[a.level] - order[b.level]) || (new Date(a.time) - new Date(b.time)); });
  var count = {};
  rows.forEach(function (n) { count[n.event] = (count[n.event] || 0) + 1; });
  var summary = Object.keys(count).map(function (k) { return '<li>' + esc_(k) + ': <b>' + count[k] + '</b></li>'; }).join('');
  var list = rows.slice(0, 200).map(function (n) {
    return '<tr><td style="padding:4px 8px;white-space:nowrap">' + esc_(fmtDateTime_(new Date(n.time))) + '</td><td style="padding:4px 8px">' + esc_(n.level) + '</td><td style="padding:4px 8px">' + esc_(n.message) + (n.message_en ? '<br><span style="color:#63635d">' + esc_(n.message_en) + '</span>' : '') + '</td></tr>';   // chunk 5I: kèm câu tiếng Anh
  }).join('');
  var ok = sendTpl_('ADMIN_DIGEST', adminEmails_().join(','), { date: fmtDate_(now), count: rows.length, summary_html: '<ul>' + summary + '</ul>',
    table_html: '<table style="border-collapse:collapse;font-size:13px">' + list + '</table>' + (rows.length > 200 ? '<p>Còn ' + (rows.length - 200) + ' dòng, xem tab NOTIFICATIONS.</p>' : ''),
    sheet_link: rowLink_('NOTIFICATIONS') }, { kind: 'ADMIN_DIGEST' });
  if (ok) rows.forEach(function (n) { t.update(n, { digest_at: now }); });
  return ok ? rows.length : 0;
}
