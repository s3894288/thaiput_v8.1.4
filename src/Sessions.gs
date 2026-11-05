/**
 * Sessions.gs · Kết quả sau buổi học (v8, plan mục 4.6, câu 26, 27, 29)
 */

var SESSION_RESULTS = ['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE'];

/** Tutor chọn kết quả cho buổi của mình, sau giờ bắt đầu. */
function submitSessionResultFor_(tutorId, bookingId, result, actor, opts) {
  if (SESSION_RESULTS.indexOf(result) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.tutor_id !== tutorId) {
      logActivity_(actor, 'FORBIDDEN_RESULT_ATTEMPT', 'BOOKING', bookingId, { by: tutorId });
      return { ok: false, reason: REASONS.FORBIDDEN };
    }
    if (b.status !== BOOKING_STATUS.CONFIRMED) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (getNow_() < slotStart_(b.date, b.slot)) return { ok: false, reason: REASONS.TOO_EARLY };
    var patch = { status: result, result_at: getNow_(), result_by: actor };
    // Chunk 5M: buổi kỹ thuật mặc định lỗi tutor (không trừ lượt, được bù) tới khi admin chọn lỗi khác.
    if (result === 'TECH_ISSUE') { patch.tech_fault = TECH_FAULT.TUTOR; patch.tech_decided_at = ''; }
    table_('BOOKINGS').update(b, patch);
    // Chunk 5M: mọi kết quả đều tính lại gói (Hoàn thành, Vắng học viên khoá ngày bắt đầu; kỹ thuật được bù).
    recomputeStudentPackages_(b.student_id, actor);
    // Ghi mã phiên (thiết bị) đã bấm: bằng chứng khi có tranh chấp (chunk 5D).
    logActivity_(actor, 'SESSION_RESULT', 'BOOKING', bookingId, opts && opts.session ? { result: result, session: opts.session } : result);
    var stu = userById_(b.student_id), tut = userById_(tutorId);
    notify_('RESULT_' + result, { actor: actor, student_id: b.student_id, tutor_id: tutorId, entity: 'BOOKING', entity_id: bookingId, link: rowLink_('BOOKINGS', b._row),
      message: (tut ? tut.name : tutorId) + ' xác nhận ' + (BOOKING_STATUS_VI[result] || result) + ': ' + (stu ? stu.name : b.student_id) + ' · ' + fmtDayVi_(b.date) + ' ' + b.slot,
      message_en: (tut ? tut.name : tutorId) + ' confirmed ' + (BOOKING_STATUS_EN_[result] || result) + ': ' + (stu ? stu.name : b.student_id) + ' · ' + fmtDayEn_(b.date) + ' ' + b.slot });
    return { ok: true, reason: REASONS.OK };
  });
}

/**
 * Job mỗi giờ (câu 29, đổi 01/11 chunk 5J). Phải gọi trong withLock_. Không còn tự Hoàn thành.
 *   1. Buổi CONFIRMED quá RESULT_NOTICE_AFTER_HOURS giờ sau giờ kết thúc: ghi result_notice_at, báo đỏ (RESULT_OVERDUE, mức Khẩn)
 *      trên trang quản trị; trang tutor tô đỏ buổi đó.
 *   2. Quá RESULT_EXPIRE_AFTER_HOURS giờ sau giờ kết thúc VÀ đã báo được RESULT_EXPIRE_AFTER_NOTICE_HOURS giờ: NOT_COMPLETED
 *      (không tính lương), báo admin (RESULT_NOT_COMPLETED), tính lại gói. allowExpire false (bảo trì): chỉ báo, không chuyển.
 * Trả số buổi chuyển NOT_COMPLETED.
 */
function resultOverdueInLock_(now, allowExpire) {
  var t = table_('BOOKINGS'), hasCol = 'result_notice_at' in t.colIndex, H = 3600000;
  var notice = Number(cfg_('RESULT_NOTICE_AFTER_HOURS')) * H, expire = Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) * H, after = Number(cfg_('RESULT_EXPIRE_AFTER_NOTICE_HOURS')) * H;
  var noticed = [], done = [];
  t.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && b.date instanceof Date; }).forEach(function (b) {
    var late = now.getTime() - slotEnd_(b.date, b.slot).getTime();
    if (late < notice) return;
    var at = b.result_notice_at ? new Date(b.result_notice_at) : null;
    if (at && isNaN(at.getTime())) at = null;
    if (!at) {
      // Chưa chạy menu 1 (thiếu cột): coi như đã báo đúng lúc quá hạn xác nhận, để vẫn chuyển sau đủ giờ.
      if (!hasCol) at = new Date(slotEnd_(b.date, b.slot).getTime() + notice);
      else { t.update(b, { result_notice_at: now }); at = now; noticed.push(b); }
    }
    // Soát 5J M2: đang bảo trì (tutor không chọn được kết quả) thì dời mốc báo đỏ theo giờ hiện tại: mở lại xong tutor còn đủ
    // RESULT_EXPIRE_AFTER_NOTICE_HOURS giờ. Thiếu cột (chưa chạy menu 1) thì không dời được.
    if (!allowExpire && hasCol && at.getTime() < now.getTime()) { t.update(b, { result_notice_at: now }); at = now; }
    if (allowExpire && late >= expire && now.getTime() - at.getTime() >= after) {
      t.update(b, { status: BOOKING_STATUS.NOT_COMPLETED, result_at: now, result_by: 'SYSTEM' });
      logActivity_('SYSTEM', 'RESULT_NOT_COMPLETED', 'BOOKING', b.booking_id, { tutor: b.tutor_id });
      done.push(b);
    }
  });
  var names = {}; table_('USERS').all().forEach(function (u) { names[u.user_id] = u.name; });
  noticed.forEach(function (b) {
    var exp = new Date(Math.max(slotEnd_(b.date, b.slot).getTime() + expire, now.getTime() + after));
    logActivity_('SYSTEM', 'RESULT_OVERDUE', 'BOOKING', b.booking_id, { tutor: b.tutor_id, expire: fmtDateTime_(exp) });
    notify_('RESULT_OVERDUE', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
      message: (names[b.tutor_id] || b.tutor_id) + ' chưa chọn kết quả buổi ' + fmtDayVi_(b.date) + ' ' + b.slot + ' (' + (names[b.student_id] || b.student_id) + '). Nhắc tutor; tới ' + fmtDateTime_(exp) + ' chưa chọn thì buổi thành Không hoàn thành, không tính lương.',
      message_en: (names[b.tutor_id] || b.tutor_id) + ' has not chosen the result of ' + fmtDayEn_(b.date) + ' ' + b.slot + ' (' + (names[b.student_id] || b.student_id) + '). Remind the tutor; by ' + fmtDateTime_(exp) + ' it becomes Not completed, unpaid.' });
  });
  if (done.length) notify_('RESULT_NOT_COMPLETED', { entity: 'BOOKING', entity_id: done.map(function (b) { return b.booking_id; }).join(','), link: rowLink_('BOOKINGS'),
    message: done.length + ' buổi thành Không hoàn thành (tutor không chọn kết quả, không tính lương): ' + done.map(function (b) { return b.booking_id + ' (' + (names[b.tutor_id] || b.tutor_id) + ')'; }).join(', ') + '. Buổi không diễn ra thì chọn Vắng tutor; đã học thì chọn Hoàn thành.',
    message_en: done.length + ' lesson(s) became Not completed (no result from the tutor, unpaid): ' + done.map(function (b) { return b.booking_id + ' (' + (names[b.tutor_id] || b.tutor_id) + ')'; }).join(', ') + '. If it did not happen pick Tutor absent; if it happened pick Completed.' });
  var sids = {}; done.forEach(function (b) { sids[b.student_id] = true; });
  Object.keys(sids).forEach(function (sid) { recomputeStudentPackages_(sid, 'SYSTEM'); });
  return done.length;
}

/** Hạn xác nhận của một buổi chưa có kết quả: { overdue, expireAt } để trang tutor, admin hiện (chunk 5J). */
function resultDeadlineInfo_(b, now) {
  var H = 3600000, end = slotEnd_(b.date, b.slot).getTime(), notice = Number(cfg_('RESULT_NOTICE_AFTER_HOURS')) * H;
  var at = b.result_notice_at ? new Date(b.result_notice_at).getTime() : end + notice;
  if (isNaN(at)) at = end + notice;
  var exp = Math.max(end + Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) * H, at + Number(cfg_('RESULT_EXPIRE_AFTER_NOTICE_HOURS')) * H);
  return { overdue: now.getTime() - end >= notice, expireAt: new Date(exp) };
}

/**
 * Admin chọn kết quả thay tutor (chunk 5J): buổi đã bắt đầu còn CONFIRMED, hoặc đã thành NOT_COMPLETED.
 * result: COMPLETED hoặc STUDENT_ABSENT. Tính lương theo kết quả admin chọn.
 */
function adminSetResult_(bookingId, actor, result) {
  // Soát 5J: thêm Vấn đề kỹ thuật; sau đó admin chọn lỗi (tutor, học viên, khách quan) ở cùng cột như buổi kỹ thuật tutor báo.
  if (['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE'].indexOf(result) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.status !== BOOKING_STATUS.CONFIRMED && b.status !== BOOKING_STATUS.NOT_COMPLETED) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (getNow_() < slotStart_(b.date, b.slot)) return { ok: false, reason: REASONS.TOO_EARLY };
    var prev = b.status;
    var patch = { status: result, result_at: getNow_(), result_by: actor };
    if (result === 'TECH_ISSUE' && 'tech_fault' in table_('BOOKINGS').colIndex) { patch.tech_fault = ''; patch.tech_decided_at = ''; }
    table_('BOOKINGS').update(b, patch);
    recomputeStudentPackages_(b.student_id, actor);
    logActivity_(actor, 'ADMIN_RESULT', 'BOOKING', bookingId, { result: result, from: prev });
    return { ok: true };
  });
}

/** Lịch dạy của chính tutor: sắp tới và chờ xác nhận. Chỉ tên, level, ghi chú học viên (câu 35). */
function tutorScheduleFor_(tutorId) {
  var now = getNow_(), out = { upcoming: [], toConfirm: [] };
  table_('BOOKINGS').filter(function (b) { return b.tutor_id === tutorId && b.status === BOOKING_STATUS.CONFIRMED; })
    .sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); })
    .forEach(function (b) {
      var s = userById_(b.student_id) || {};
      // Chunk 5J: quá hạn xác nhận thì tô đỏ, kèm giờ sẽ thành Không hoàn thành (chuỗi, không gửi Date ra trình duyệt).
      var dlInfo = slotStart_(b.date, b.slot) <= now ? resultDeadlineInfo_(b, now) : null;
      var item = { bookingId: b.booking_id, date: dateKey_(b.date), label: fmtDayEn_(b.date), slot: b.slot, meetLink: b.meet_link, inviteWhen: calendarInviteWhen_(b, now),
        overdue: !!(dlInfo && dlInfo.overdue), expireAt: dlInfo ? fmtDateTime_(dlInfo.expireAt) : '',
        student: { name: s.name || '', level: s.level || '', note: s.note || '' } };
      if (slotStart_(b.date, b.slot) <= now) out.toConfirm.push(item); else out.upcoming.push(item);
    });
  return out;
}

/**
 * Số buổi của một tutor theo tháng (tháng này và tháng trước), dùng đúng luật của báo cáo lương computeMonthReport_.
 * toConfirm: buổi đã diễn ra trong tháng mà tutor chưa xác nhận (quá RESULT_EXPIRE_AFTER_HOURS giờ thì thành Không hoàn thành, 5J).
 */
function tutorMonthStats_(tutorId) {
  var now = getNow_(), out = [];
  [0, 1].forEach(function (back) {
    var d = new Date(now.getFullYear(), now.getMonth() - back, 1), y = d.getFullYear(), m = d.getMonth() + 1;
    // Cùng luật với báo cáo lương (countPayroll_), nhưng chỉ đọc BOOKINGS của tutor này (không đọc PAYMENTS, MAIL_LOG).
    var from = new Date(y, m - 1, 1), to = new Date(y, m, 0), pay = cfgList_('PAYROLL_STATUSES');
    var t = { COMPLETED: 0, STUDENT_ABSENT: 0, TECH_PAID: 0, TECH_UNPAID: 0, TUTOR_ABSENT: 0, NOT_COMPLETED: 0, payable: 0 }, waiting = 0;
    table_('BOOKINGS').filter(function (b) { return b.tutor_id === tutorId && b.date >= from && b.date <= to; }).forEach(function (b) {
      countPayroll_(t, b, pay);
      if (b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) <= now) waiting++;
    });
    t.payable += t.TECH_PAID;
    out.push({ month: pad2_(m) + '/' + y, completed: t.COMPLETED, studentAbsent: t.STUDENT_ABSENT, techPaid: t.TECH_PAID, techUnpaid: t.TECH_UNPAID,
      tutorAbsent: t.TUTOR_ABSENT, notCompleted: t.NOT_COMPLETED, payable: t.payable, toConfirm: waiting });
  });
  return { months: out };
}
