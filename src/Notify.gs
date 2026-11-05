/**
 * Notify.gs · Email (v8, plan mục 4.9)
 *
 * Mọi email đi qua sendMail_():
 *   gửi qua mailDeliver_ (MailTransport.gs, mặc định GmailApp như MailFix cũ), tên hiển thị MAIL_FROM_NAME,
 *   trả lời về ADMIN_EMAIL (CLAUDE.md luật 19); MAIL_LOG ghi đường gửi (cột transport, chunk 5Q)
 *   ghi MAIL_LOG để đếm số email mỗi ngày
 *   ưu tiên: 'high' luôn gửi; 'low' (nhắc buổi, sắp hết hạn) bị tạm bỏ khi hạn mức còn lại thấp,
 *   để Gmail thường (khoảng 100 người nhận/ngày) vẫn đủ cho email quan trọng
 * Tiếng Việt cho học viên và admin, tiếng Anh cho tutor (câu 37).
 */

var MAIL_FAIL_NOTIFYING_ = false;
function sendMail_(to, subject, html, kind, priority, opts) {
  if (!to) throw new Error('Thiếu người nhận email: ' + kind);
  if (priority === 'low') {
    var remaining = mailBudget_();
    if (remaining >= 0 && remaining <= cfg_('MAIL_LOW_QUOTA_RESERVE')) {
      logActivity_('SYSTEM', 'MAIL_SKIPPED_LOW_QUOTA', 'MAIL', '', { to: to, kind: kind, remaining: remaining });
      return false;
    }
  }
  // Email gửi sau khi dữ liệu đã ghi (đặt lịch, huỷ...). Gửi lỗi (hết hạn mức, địa chỉ hỏng) thì ghi log và báo false,
  // không ném lỗi, để trang web không báo "có lỗi" cho một thao tác đã thành công.
  var transport = '';
  try {
    // Chunk 5G: địa chỉ thử tải (@loadtest.invalid, tên miền không bao giờ có thật) không gửi thật, nhưng vẫn ghi MAIL_LOG
    // như email thật để lượt thử tải đo đúng phần ghi Sheets.
    if (!isTestAddress_(to)) transport = mailDeliver_({ to: to, subject: subject, htmlBody: html, name: cfg_('MAIL_FROM_NAME'), replyTo: cfgList_('ADMIN_EMAIL')[0] || '' });
  } catch (e) {
    logActivity_('SYSTEM', 'MAIL_FAILED', 'MAIL', '', { to: to, kind: kind, error: String((e && e.message) || e) });
    if (!MAIL_FAIL_NOTIFYING_) {
      MAIL_FAIL_NOTIFYING_ = true;
      try { var r = notifyRule_('MAIL_FAILED'); if (r.channel !== NOTIFY_CHANNEL.EMAIL) notify_('MAIL_FAILED', { message: 'Không gửi được email ' + kind + ' tới ' + to + ': ' + String((e && e.message) || e), message_en: 'Could not send email ' + kind + ' to ' + to + ': ' + String((e && e.message) || e) }); } catch (x) { }
      MAIL_FAIL_NOTIFYING_ = false;
    }
    return false;
  }
  var logRow = { time: getNow_(), to: to, subject: subject, kind: kind, transport: transport };
  // Chunk 5H: email marketing tự ghi MAIL_LOG theo lô, có chống trùng (Marketing.gs).
  if (opts && opts.collect) { opts.collect.push(logRow); return true; }
  // Chunk 5F: trong khoá ghi luôn; sau khoá (pha gửi email của một lượt đặt, huỷ) gom vào lần ghi cuối, không lấy khoá riêng mỗi email.
  if (!DB_LOCK_DEPTH_ && deferActive_()) deferWrite_(function () { logAppend_('MAIL_LOG', logRow); });
  else logAppend_('MAIL_LOG', logRow);
  return true;
}

/**
 * Địa chỉ nhận email hệ thống cho admin: chỉ CONFIG ADMIN_EMAIL (chunk 5B, theo quyết định 13/10 của anh Chris).
 * Nên để 1 địa chỉ, hoặc nhóm admin@ trên Workspace (1 địa chỉ, Google tự chia cho thành viên).
 * Tài khoản role ADMIN trong USERS (admin dự phòng, nhân viên) có quyền thao tác nhưng KHÔNG nhận email.
 * Mỗi địa chỉ tính 1 vào hạn mức người nhận mỗi ngày của tài khoản chạy script.
 */
function adminEmails_() {
  var out = [];
  cfgList_('ADMIN_EMAIL').forEach(function (e) { e = String(e || '').trim().toLowerCase(); if (e && out.indexOf(e) === -1) out.push(e); });
  return out;
}

function esc_(s) {
  return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function portalUrl_(page) { var u = cfg_('WEBAPP_URL') || cfg_('SCHOOL_SITE_URL'); return u + (page ? (u.indexOf('?') === -1 ? '?' : '&') + 'page=' + page : ''); }

/** Khung email dùng chung, có chân trang liên hệ Zalo và điện thoại admin (câu 42). */
function emailWrap_(title, inner, lang) {
  var en = lang === 'en';
  var zalo = cfg_('ADMIN_ZALO_URL');
  var contact = [];
  if (zalo) contact.push('<a href="' + esc_(zalo) + '" style="color:#0068ff;text-decoration:none;font-weight:600">' + (lang === 'bi' ? 'Nhắn Zalo admin · Message admin on Zalo' : en ? 'Message admin on Zalo' : 'Nhắn Zalo admin') + '</a>');
  return '<div style="background:#f5f3ef;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#1f2937">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e2d9">' +
    '<div style="background:#14532d;color:#fff;padding:18px 22px;font-size:18px;font-weight:700;letter-spacing:.3px">' + esc_(cfg_('SCHOOL_NAME')) + '</div>' +
    '<div style="padding:22px">' +
    '<h2 style="margin:0 0 14px;font-size:19px;color:#14532d">' + esc_(title) + '</h2>' + inner + '</div>' +
    '<div style="padding:14px 22px;background:#faf8f4;font-size:13px;color:#6b7280;border-top:1px solid #eee">' +
    (contact.length ? contact.join(' &nbsp;·&nbsp; ') + '<br>' : '') +
    '<a href="' + esc_(cfg_('SCHOOL_SITE_URL')) + '" style="color:#6b7280">' + esc_(cfg_('SCHOOL_SITE_URL')) + '</a></div></div></div>';
}
function btn_(href, label) {
  return '<p style="margin:18px 0"><a href="' + esc_(href) + '" style="background:#14532d;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">' + esc_(label) + '</a></p>';
}
function lessonLineVi_(b, extra) {
  return '<li style="margin:6px 0"><b>' + esc_(fmtDayVi_(b.date)) + '</b> · ' + esc_(slotLabel_(b.slot)) + (extra ? ' · ' + extra : '') + '</li>';
}
function lessonLineEn_(b, extra) {
  return '<li style="margin:6px 0"><b>' + esc_(fmtDayEn_(b.date)) + '</b> · ' + esc_(slotLabel_(b.slot)) + (extra ? ' · ' + extra : '') + '</li>';
}
/** Link Meet trong email. Chưa có (sự kiện Calendar đang chờ hàng đợi, chunk 5F): nói rõ link đến cùng lời mời lịch. */
function meetA_(link, lang, when) {
  if (link) return '<a href="' + esc_(link) + '">Google Meet</a>';
  if (when) return lang === 'en' ? 'Meet link comes with the Google Calendar invite (around ' + esc_(when) + ')' : 'link Meet đến cùng lời mời Google Calendar (khoảng ' + esc_(when) + ')';
  return lang === 'en' ? 'Meet link comes with the Google Calendar invite' : 'link Meet đến cùng lời mời Google Calendar';
}
function inviteWhenSafe_(b) { try { return calendarInviteWhen_(b, getNow_()); } catch (e) { return ''; } }

// ── Dựng sẵn khối HTML cho mẫu email (danh sách buổi học) ──

function lessonsHtml_(items, lang) {
  return '<ul style="padding-left:18px;margin:0 0 12px">' + items.map(function (it) { return (lang === 'en' ? lessonLineEn_ : lessonLineVi_)(it.booking, it[lang] || ''); }).join('') + '</ul>';
}
function isTutorUser_(u) { return u && u.role === 'TUTOR'; }
function bookingRuleText_(lang) {
  var lead = bookingLeadHours_(), k = cfg_('CANCEL_CUTOFF_HOUR') + ':00';
  if (lang === 'en') return lead < 0 ? 'book tomorrow\'s lessons before ' + cfg_('BOOKING_CUTOFF_HOUR') + ':00 today; cancel before ' + k + ' the day before.' : 'book at least ' + lead + ' hour(s) before the lesson; cancel before ' + k + ' the day before.';
  return lead < 0 ? 'đặt buổi cho ngày mai trước ' + cfg_('BOOKING_CUTOFF_HOUR') + ':00 hôm nay; huỷ cũng phải trước ' + k + ' hôm trước.' : 'đặt trước giờ học ít nhất ' + lead + ' tiếng; huỷ phải trước ' + k + ' hôm trước.';
}

// ── Đăng ký ──

function mailRegistrationReceived_(reg, def) {
  return sendTpl_('REG_RECEIVED', reg.email, { name: reg.name, package: def.name || reg.package_code, package_en: def.name_en || def.name || reg.package_code, transfer_code: reg.transfer_code }, { kind: 'REG_RECEIVED' });
}
function mailAdminNewRegistration_(reg, def) {
  return sendTpl_('ADMIN_NEW_REG', adminEmails_().join(','), {
    kind: reg.kind === 'RENEW' ? 'Gia hạn' : 'Đăng ký mới', kind_en: reg.kind === 'RENEW' ? 'Renewal' : 'New student',
    name: reg.name, email: reg.email, phone: reg.phone ? phoneDisplay_(reg.phone) : '', package: def.name || reg.package_code, package_en: def.name_en || def.name || reg.package_code,
    price: Number(def.price_vnd || 0).toLocaleString('vi-VN') + 'đ', transfer_code: reg.transfer_code, screenshot_url: reg.screenshot_url,
    sheet_link: rowLink_('REGISTRATIONS', reg._row)
  }, { kind: 'ADMIN_NEW_REG' });
}
function mailWelcome_(user, def, loginUrl) {
  return sendTpl_('WELCOME', user.email, { name: user.name, package: def.name || def.code, package_en: def.name_en || def.name || def.code, rule: bookingRuleText_('vi'), rule_en: bookingRuleText_('en'),
    login_url: loginUrl || portalUrl_('login'), link_note: linkUseText_(false, user), link_note_en: linkUseText_(true, user) }, { kind: 'WELCOME' });
}
function mailRegistrationRejected_(reg, note) {
  return sendTpl_('REG_REJECTED', reg.email, { name: reg.name, note: note ? ': ' + note : '' }, { kind: 'REG_REJECTED' });
}

// ── Đặt và huỷ ──

function mailBookingSummary_(student, results) {
  var ok = results.filter(function (r) { return r.ok; }), bad = results.filter(function (r) { return !r.ok; });
  var failed = function (lang) {
    if (!bad.length) return '';
    return '<p style="margin:0 0 6px">' + (lang === 'en' ? 'Not booked:' : 'Các buổi chưa đặt được:') + '</p><ul style="padding-left:18px;margin:0 0 12px">' +
      bad.map(function (r) { return '<li>' + esc_(r.date) + ' ' + esc_(r.slot) + ': ' + esc_(reasonText_(r.reason, lang === 'en' ? 'en' : 'vi')) + '</li>'; }).join('') + '</ul>';
  };
  var items = ok.map(function (r) { var w = r.meetLink ? '' : inviteWhenSafe_(r._booking); return { booking: r._booking, vi: 'Tutor ' + esc_(r.tutorName) + ' · ' + meetA_(r.meetLink, 'vi', w), en: 'Tutor ' + esc_(r.tutorName) + ' · ' + meetA_(r.meetLink, 'en', w) }; });
  var vars = { name: student.name, count: ok.length, lessons_html_vi: lessonsHtml_(items, 'vi'), lessons_html_en: lessonsHtml_(items, 'en'),
    failed_html_vi: failed('vi'), failed_html_en: failed('en'), portal_url: portalUrl_('student'),
    cancel_rule: 'Huỷ buổi trước ' + cfg_('CANCEL_CUTOFF_HOUR') + ':00 hôm trước trong mục "Lịch của tôi".', cancel_rule_en: 'Cancel before ' + cfg_('CANCEL_CUTOFF_HOUR') + ':00 the day before in "My lessons".' };
  vars.lessons_html = vars.lessons_html_vi; vars.failed_html = vars.failed_html_vi;
  return sendTpl_(ok.length ? 'BOOKING_CONFIRM' : 'BOOKING_NONE', student.email, vars, { kind: 'BOOKING_CONFIRM' });
}
function mailTutorNewLessons_(tutor, items) {
  var list = items.map(function (it) {
    var who = esc_(it.student.name) + (it.student.level ? ' (' + esc_(it.student.level) + ')' : '') + ' · ';
    var w = it.booking.meet_link ? '' : inviteWhenSafe_(it.booking);
    return { booking: it.booking, vi: 'Học viên: ' + who + meetA_(it.booking.meet_link, 'vi', w), en: 'Student: ' + who + meetA_(it.booking.meet_link, 'en', w) };
  });
  return sendTpl_('TUTOR_NEW', tutor.email, { name: tutor.name, count: items.length, s: items.length > 1 ? 's' : '',
    lessons_html_vi: lessonsHtml_(list, 'vi'), lessons_html_en: lessonsHtml_(list, 'en'), portal_url: portalUrl_('tutor') }, { enFirst: true, kind: 'TUTOR_NEW' });
}
function mailCancelled_(booking, student, tutor, byWhom) {
  var reason = { STUDENT: ['bạn đã huỷ', 'you cancelled'], ADMIN: ['admin đã huỷ', 'admin cancelled it'], TUTOR: ['tutor không thể dạy và không có tutor thay', 'the tutor cannot teach and no other tutor is free'], TUTOR_LOCK: ['tutor không thể dạy và không có tutor thay', 'the tutor cannot teach and no other tutor is free'] }[byWhom] || ['đã huỷ', 'cancelled'];
  // Chunk 5M: admin huỷ từ CANCEL_CUTOFF_HOUR hôm trước (học viên xin huỷ muộn): buổi vẫn được tính (câu 12, BL46).
  if (booking.status === BOOKING_STATUS.CANCELLED_LATE) { var hh = cfg_('CANCEL_CUTOFF_HOUR') + ':00'; reason = ['admin đã huỷ theo yêu cầu huỷ muộn (từ ' + hh + ' hôm trước), buổi vẫn được tính là đã học', 'admin cancelled it on a late request (from ' + hh + ' the day before), so the lesson is still counted']; }
  var one = [{ booking: booking }];
  var rebook = byWhom === 'TUTOR' || byWhom === 'TUTOR_LOCK';
  sendTpl_('CANCEL_STUDENT', student.email, { name: student.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot,
    lesson_html_vi: lessonsHtml_(one, 'vi'), lesson_html_en: lessonsHtml_(one, 'en'), reason: reason[0], reason_en: reason[1],
    rebook_html_vi: rebook ? '<p>Buổi này không bị trừ. Bạn có thể đặt lại khung giờ khác.</p>' + btn_(portalUrl_('student'), 'Đặt lại') : '',
    rebook_html_en: rebook ? '<p>This lesson is not counted. You can book another time.</p>' + btn_(portalUrl_('student'), 'Book again') : '' }, { kind: 'CANCEL_STUDENT' });
  if (tutor && byWhom !== 'TUTOR_LOCK') {   // 5L: tutor bị khoá không nhận thư huỷ
    var withStudent = [{ booking: booking, vi: 'Học viên: ' + esc_(student.name), en: 'Student: ' + esc_(student.name) }];
    sendTpl_('CANCEL_TUTOR', tutor.email, { name: tutor.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot,
      lesson_html_vi: lessonsHtml_(withStudent, 'vi'), lesson_html_en: lessonsHtml_(withStudent, 'en') }, { enFirst: true, kind: 'CANCEL_TUTOR' });
  }
}
function mailReassigned_(booking, student, oldTutor, newTutor, opts) {
  var item = [{ booking: booking, vi: 'Tutor mới: <b>' + esc_(newTutor.name) + '</b> · ' + meetA_(booking.meet_link, 'vi'), en: 'New tutor: <b>' + esc_(newTutor.name) + '</b> · ' + meetA_(booking.meet_link, 'en') }];
  sendTpl_('REASSIGN_STUDENT', student.email, { name: student.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot, new_tutor: newTutor.name,
    lesson_html_vi: lessonsHtml_(item, 'vi'), lesson_html_en: lessonsHtml_(item, 'en') }, { kind: 'REASSIGN_STUDENT' });
  var plain = [{ booking: booking }];
  if (!(opts && opts.skipOld)) sendTpl_('REASSIGN_OLD', oldTutor.email, { name: oldTutor.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot,
    lesson_html_vi: lessonsHtml_(plain, 'vi'), lesson_html_en: lessonsHtml_(plain, 'en') }, { enFirst: true, kind: 'REASSIGN_OLD' });
  mailTutorNewLessons_(newTutor, [{ booking: booking, student: student }]);
}
function mailAdminTutorCancelRequest_(tutor, avail, booking, student) {
  var D = TUTOR_CANCEL_DECISION;
  return sendTpl_('ADMIN_TUTOR_CANCEL', adminEmails_().join(','), {
    tutor: tutor.name, lesson: fmtDayVi_(avail.date) + ' ' + slotLabel_(avail.slot), lesson_en: fmtDayEn_(avail.date) + ' ' + slotLabel_(avail.slot),
    // Chunk 5J: hạn theo TUTOR_DEADLINE_AT (không còn viết cứng "Chủ nhật").
    booked_note: booking ? 'Slot đã có học viên: ' + (student ? student.name : booking.student_id) + '.' : 'Slot chưa có học viên (xin huỷ sau hạn ' + fmtDowTimeVi_(tutorWeekDeadline_(avail.date)) + ').',
    booked_note_en: booking ? 'A student is booked: ' + (student ? student.name : booking.student_id) + '.' : 'No student booked yet (request after the ' + fmtDowTimeEn_(tutorWeekDeadline_(avail.date)) + ' deadline).',
    options: '"' + D.AUTO + '", "' + D.ASSIGN + '" (ghi mã tutor ở cột admin_note trước), "' + D.CANCEL + '", "' + D.REJECT + '"',
    hours: cfg_('TUTOR_CANCEL_DECIDE_BEFORE_HOURS'), sheet_link: rowLink_('AVAILABILITY', avail._row)
  }, { kind: 'ADMIN_TUTOR_CANCEL' });
}
function mailTutorDecision_(tutor, avail, approved) {
  return sendTpl_(approved ? 'TUTOR_DECISION_APPROVED' : 'TUTOR_DECISION_REJECTED', tutor.email, { name: tutor.name, date: fmtDayVi_(avail.date), date_en: fmtDayEn_(avail.date),
    slot: avail.slot, lesson: fmtDayVi_(avail.date) + ' ' + slotLabel_(avail.slot), lesson_en: fmtDayEn_(avail.date) + ' ' + slotLabel_(avail.slot) }, { enFirst: true, kind: 'TUTOR_DECISION' });
}

// ── Nhắc, hết hạn ──

function mailLessonReminder_(booking, person, isTutor, other) {
  if (isTutor) {
    var it = [{ booking: booking, vi: 'Học viên: ' + esc_(other.name) + ' · ' + meetA_(booking.meet_link, 'vi'), en: 'Student: ' + esc_(other.name) + ' · ' + meetA_(booking.meet_link, 'en') }];
    return sendTpl_('REMINDER_TUTOR', person.email, { name: person.name, slot: booking.slot, lesson_html_vi: lessonsHtml_(it, 'vi'), lesson_html_en: lessonsHtml_(it, 'en') },
      { enFirst: true, kind: 'REMINDER_TUTOR', priority: 'low' });
  }
  var st = [{ booking: booking, vi: 'Tutor ' + esc_(other.name), en: 'Tutor ' + esc_(other.name) }];
  return sendTpl_('REMINDER_STUDENT', person.email, { name: person.name, slot: booking.slot, lesson_html_vi: lessonsHtml_(st, 'vi'), lesson_html_en: lessonsHtml_(st, 'en'),
    meet_url: booking.meet_link || portalUrl_('student') }, { kind: 'REMINDER_STUDENT', priority: 'low' });
}
/** Email nhắc buổi sáng: các buổi hôm nay của một người. */
function mailMorningReminder_(person, bookings, isTutor) {
  if (!person || !person.email) return false;
  var items = bookings.map(function (b) {
    var other = isTutor ? userById_(b.student_id) : userById_(b.tutor_id), nm = esc_(other ? other.name : ''), m = b.meet_link ? ' · ' + meetA_(b.meet_link) : '';
    return { booking: b, vi: (isTutor ? 'Học viên: ' : 'Tutor: ') + nm + m, en: (isTutor ? 'Student: ' : 'Tutor: ') + nm + m };
  });
  return sendTpl_(isTutor ? 'MORNING_TUTOR' : 'MORNING_STUDENT', person.email, { name: person.name, count: bookings.length, s: bookings.length > 1 ? 's' : '',
    lessons_html_vi: lessonsHtml_(items, 'vi'), lessons_html_en: lessonsHtml_(items, 'en') }, { enFirst: isTutor, kind: isTutor ? 'MORNING_TUTOR' : 'MORNING_STUDENT', priority: 'low' });
}

function mailExpirySoon_(student, sp, def) {
  return sendTpl_('EXPIRY_SOON', student.email, { name: student.name, package: def.name || def.code, package_en: def.name_en || def.name || def.code, end_date: fmtDate_(sp.end_date), renew_url: portalUrl_('renew') },
    { kind: 'EXPIRY_SOON', priority: 'low' });
}
function mailTutorRemindAvailability_(tutor, weekStart, deadline) {
  var dl = deadline || tutorWeekDeadline_(weekStart);
  return sendTpl_('TUTOR_REMIND', tutor.email, { name: tutor.name, week: fmtDate_(weekStart), deadline: fmtDowTimeVi_(dl), deadline_en: fmtDowTimeEn_(dl), portal_url: portalUrl_('tutor') },
    { enFirst: true, kind: 'TUTOR_REMIND' });
}
function mailAdminError_(subject, detail) {
  // Ghi thông báo CRITICAL (tab NOTIFICATIONS) rồi email theo luật SYSTEM_ERROR; cùng một lỗi chỉ email 1 lần mỗi giờ.
  var send = function () {
    var cache = null, key = 'adminerr:' + String(subject).substring(0, 200);
    try { cache = CacheService.getScriptCache(); if (cache.get(key)) { Logger.log('Bỏ qua email lỗi lặp lại: ' + subject); return false; } } catch (x) { cache = null; }
    var sent = sendTpl_('ADMIN_ERROR', adminEmails_().join(','), { subject: subject, detail_html: '<pre style="white-space:pre-wrap">' + esc_(detail) + '</pre>' }, { kind: 'ADMIN_ERROR' });
    if (sent && cache) cache.put(key, '1', 3600); // chỉ đánh dấu khi đã gửi được, gửi hỏng thì lần sau thử lại
    return sent;
  };
  // Cùng một lỗi trong 1 giờ: không ghi thêm dòng, không lấy khoá (một người cố tình gửi dữ liệu lạ không làm đầy NOTIFICATIONS).
  try { if (CacheService.getScriptCache().get('adminerr:' + String(subject).substring(0, 200))) { Logger.log('Bỏ qua lỗi lặp lại: ' + subject); return; } } catch (x) { }
  try { notify_('SYSTEM_ERROR', { message: subject + ': ' + String(detail).split('\n')[0], message_en: 'System error · ' + subject + ': ' + String(detail).split('\n')[0] }, send); }
  catch (e) { try { send(); } catch (x) { } } // tab NOTIFICATIONS chưa có hoặc hệ thống bận: vẫn email
}

// ── Chunk 5I: kiểm tra đường gửi email và hạn mức ──

/** Tài khoản đang gửi email (chủ script, người triển khai web app). */
function mailSender_() { try { return String(Session.getEffectiveUser().getEmail() || ''); } catch (e) { return ''; } }
/**
 * Số người nhận đã gửi thật trong 24 giờ qua theo MAIL_LOG (soát 5I A4: Google tính hạn mức theo 24 giờ trượt, không theo 0 giờ;
 * bỏ địa chỉ thử tải vì không gửi thật). Chỉ là ước tính: thư do dự án khác của cùng tài khoản gửi không có ở đây.
 */
function mailSentToday_() {
  // Vòng 2 N6: MAIL_LOG ghi theo giờ giả lập; đang giả lập giờ (STAGING) thì không ước tính được.
  if (Math.abs(getNow_().getTime() - realNowMs_()) > 300000) return null;
  var from = realNowMs_() - 24 * 3600000, n = 0;
  table_('MAIL_LOG').all().forEach(function (m) {
    var t = m.time instanceof Date ? m.time : new Date(m.time);
    if (isNaN(t.getTime()) || t.getTime() < from) return;
    n += String(m.to || '').split(',').filter(function (x) { return x.trim() && !isTestAddress_(x.trim()); }).length;
  });
  return n;
}
/**
 * Hàm thuần: giải thích hạn mức email. remaining = mailBudget_() (MailTransport.gs); sent = đã gửi hôm nay; sender = tài khoản gửi.
 * Google ghi cho Apps Script: Gmail thường 100 người nhận mỗi ngày, Workspace 1.500, nhưng tài khoản Workspace dùng thử có giới hạn
 * thêm và chỉ tự tăng khi tổ chức đã trả tổng cộng 100 USD và đã qua 60 ngày kể từ lúc đó.
 */
function mailQuotaInfo_(remaining, sent, sender) {
  var unknown = sent === null || sent === undefined;
  remaining = Number(remaining) || 0; sent = Number(sent) || 0;
  var limit = remaining + sent, gmail = /@(gmail|googlemail)\.com$/i.test(String(sender || '')), lines = [], warnings = [];
  if (unknown && !gmail) {
    lines.push('Email còn gửi được hôm nay: ' + remaining + ' người nhận (tài khoản gửi ' + (sender || 'không rõ') + '). Đang giả lập giờ (SIM_NOW) nên không ước tính được hạn mức ngày; tắt giả lập để xem chẩn đoán.');
    return { limit: 0, kind: 'UNKNOWN', lines: lines, warnings: warnings };
  }
  var kind = gmail ? 'GMAIL' : limit <= 150 ? 'WORKSPACE_LIMITED' : 'WORKSPACE';
  lines.push('Email còn gửi được hôm nay: ' + remaining + ' người nhận (24 giờ qua đã gửi khoảng ' + sent + ', hạn mức ước tính ' + limit + ' mỗi ngày, tài khoản gửi ' + (sender || 'không rõ') + ')');
  if (kind === 'WORKSPACE_LIMITED') warnings.push('Hạn mức email ước tính khoảng ' + limit + ' người nhận mỗi ngày dù là Workspace: nhiều khả năng tài khoản đang ở mức dùng thử của Google (Apps Script ghi 1.500 cho Workspace, tài khoản dùng thử bị giới hạn thêm). Kiểm ở admin.google.com, mục Thanh toán. Sau khi chuyển từ dùng thử sang trả phí, hạn mức tự tăng khi tổ chức đã trả tổng cộng 100 USD và qua 60 ngày (trang Gmail của Google ghi có thể tới 75 ngày). Code không đổi được con số này.');
  if (kind === 'GMAIL') warnings.push('Tài khoản gửi là Gmail thường: hạn mức cố định 100 người nhận mỗi ngày.');
  var mres = 0, lres = 0; try { mres = Number(cfg_('MARKETING_QUOTA_RESERVE')) || 0; lres = Number(cfg_('MAIL_LOW_QUOTA_RESERVE')) || 0; } catch (e) { }
  if (limit && mres >= limit) warnings.push('Email marketing sẽ không gửi được: MARKETING_QUOTA_RESERVE (' + mres + ') không nhỏ hơn hạn mức ngày (' + limit + ').');
  if (limit && lres * 4 >= limit) warnings.push('MAIL_LOW_QUOTA_RESERVE (' + lres + ') chiếm phần lớn hạn mức ' + limit + ': email nhắc buổi sẽ bị bỏ sớm.');
  return { limit: limit, kind: kind, lines: lines, warnings: warnings };
}
/** Gửi một email kiểm tra có mã. Trả { ok, to, code, sender, before, after, time }. */
function mailTest_(to, e) {
  // e: sự kiện menu (lấy email người bấm) hoặc chuỗi email người làm (test).
  var ev = typeof e === 'string' ? { user: { getEmail: function () { return e; } } } : e;
  var sender = mailSender_(), before = -1, after = -1, now = new Date(realNowMs_());   // giờ thật: tìm trong nhật ký giao thư của Google theo giờ này
  to = String(to || '').trim() || sender;
  if (!isEmail_(to)) return { ok: false, error: 'địa chỉ không hợp lệ: ' + to };
  var code = 'MT' + Utilities.formatDate(now, APP.TIMEZONE, 'ddHHmmss');
  // Vòng 2 N5: mẫu tắt thì nói đúng nguyên nhân, không báo "Google từ chối".
  var tpl = emailTemplate_('MAIL_TEST'); if (!tpl || !tpl.active) return { ok: false, error: 'mẫu email MAIL_TEST đang tắt (tab EMAIL_TEMPLATES, cột active). Bật lại rồi thử lại.' };
  before = mailBudget_(); LAST_MAIL_TRANSPORT_ = '';
  var ok = sendTpl_('MAIL_TEST', to, { code: code, time: fmtDateTime_(now), sender: sender }, { kind: 'MAIL_TEST' });
  after = mailBudget_();
  // Thư đã gửi: ghi nhật ký qua logMenu_ (khoá bận thì vào hàng chờ), không để lỗi khoá làm menu báo sai rồi bị bấm gửi lại.
  logMenu_(ev, 'MAIL_TEST', 'MAIL', to, JSON.stringify({ code: code, ok: !!ok, quota: before + ' → ' + after }));
  return { ok: ok, to: to, code: code, sender: sender, before: before, after: after, time: fmtDateTime_(now), transport: LAST_MAIL_TRANSPORT_ || mailTransport_() };
}
function menuMailTest(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), sender = mailSender_();
  var res = ui.prompt('Kiểm tra gửi email', 'Nhập địa chỉ nhận thử, nên là Gmail cá nhân hoặc email của tutor, học viên đang không nhận được thư.\nĐể trống: gửi tới ' + sender, ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var r = mailTest_(res.getResponseText(), e);
  if (!r.ok && r.error) { alert_('Không gửi: ' + r.error); return; }
  alert_((r.ok ? 'Google đã NHẬN thư' : 'Google TỪ CHỐI thư (xem ACTIVITY_LOG, MAIL_FAILED)') + ' · mã ' + r.code + '\n' +
    'Từ ' + r.sender + ' tới ' + r.to + ' lúc ' + r.time + ', đường gửi ' + r.transport + (r.transport !== mailTransport_() ? ' (GmailApp thiếu quyền, đã tự gửi lại bằng MailApp: kiểm appsscript.json)' : '') + '. Hạn mức còn: ' + r.before + ' → ' + r.after + '.\n\n' +
    'Hạn mức bị trừ chỉ có nghĩa là Google đã nhận thư để gửi, KHÔNG có nghĩa là thư đã vào hộp thư người nhận.\n\n' +
    '1. Mở hộp thư ' + r.to + ', tìm mã ' + r.code + ' ở cả Thư rác (Spam), Quảng cáo, Tất cả thư.\n' +
    '2. Hộp thư ' + r.sender + ' có thư "Mail Delivery Subsystem" thì mở ra đọc lý do bị trả lại (thường là địa chỉ sai, hoặc thiếu SPF, DKIM: lỗi 5.7.26).\n' +
    '3. admin.google.com → Menu → Báo cáo (Reporting) → Tìm kiếm nhật ký email (Email log search), link thẳng admin.google.com/ac/emaillogsearch. Người gửi ' + r.sender + ', người nhận ' + r.to + ', hôm nay. Google trả kết quả tìm sau 1 phút tới 1 giờ. Đọc trạng thái: Delivered (đã giao, tìm trong Thư rác), Marked spam, Bounced (bị trả lại, bấm xem lý do), Dropped, In progress.\n' +
    '4. Xác thực tên miền: DKIM của Workspace phải tự bật (admin.google.com → Ứng dụng → Google Workspace → Gmail → Xác thực email, bấm Bắt đầu xác thực). Thư đã tới thì mở ba chấm → Hiển thị bản gốc: SPF, DKIM, DMARC phải PASS. Công cụ toolbox.googleapps.com/apps/checkmx kiểm MX, SPF và DKIM (nhập google ở ô DKIM selector).');
}
