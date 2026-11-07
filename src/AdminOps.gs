/**
 * AdminOps.gs · Thao tác của admin (v8, brief mục 13, câu 7, 25, 28)
 *
 * Đây là lớp dịch vụ. Menu và dropdown trên Sheets (Admin.gs, chunk 3) chỉ gọi các hàm ở đây.
 * actor luôn là email admin để ACTIVITY_LOG ghi đúng người làm.
 */

/** Tạm khoá học viên (câu 7): chặn đặt lịch, ghi mốc để cộng bù ngày khi mở khoá. */
function suspendStudent_(studentId, actor) {
  return withLock_(function () {
    var u = userById_(studentId);
    if (!u || u.role !== 'STUDENT') return { ok: false, reason: REASONS.NOT_FOUND };
    if (u.status === USER_STATUS.SUSPENDED) return { ok: true, already: true };
    var today = toMidnight_(getNow_()), defs = pkgDefs_();
    table_('USERS').update(u, { status: USER_STATUS.SUSPENDED });
    studentPackages_(studentId).forEach(function (sp) {
      var d = defs[sp.package_code];
      if (d && d.type !== 'SESSIONS' && sp.status !== PKG_STATUS.EXPIRED) table_('STUDENT_PACKAGES').update(sp, { suspend_started_at: today });
    });
    logActivity_(actor, 'STUDENT_SUSPENDED', 'USER', studentId, '');
    return { ok: true };
  });
}

/** Mở khoá: cộng số ngày bị khoá vào hạn gói (câu 7, B14). */
function unsuspendStudent_(studentId, actor) {
  return withLock_(function () {
    var u = userById_(studentId);
    if (!u || u.status !== USER_STATUS.SUSPENDED) return { ok: false, reason: REASONS.INVALID_INPUT };
    var today = toMidnight_(getNow_()), defs = pkgDefs_(), t = table_('STUDENT_PACKAGES');
    studentPackages_(studentId).forEach(function (sp) {
      var d = defs[sp.package_code];
      if (!d || !sp.suspend_started_at) return;
      var patch = pkgUnsuspendPatch_(sp, d, toMidnight_(new Date(sp.suspend_started_at)), today) || {};
      patch.suspend_started_at = '';
      t.update(sp, patch);
    });
    table_('USERS').update(u, { status: USER_STATUS.ACTIVE });
    // Chunk 5M: tính lại ngay (gói chuyển trạng thái trong lúc khoá, khoá ngày bắt đầu); chạy lại không cộng thêm.
    recomputeStudentPackages_(studentId, actor);
    logActivity_(actor, 'STUDENT_UNSUSPENDED', 'USER', studentId, '');
    return { ok: true };
  });
}

/**
 * Admin huỷ một booking (Q5, BL46, chunk 5M). Một lựa chọn, hệ thống xét thời điểm admin chọn (at, mặc định bây giờ):
 *   trước CANCEL_CUTOFF_HOUR hôm trước buổi học: CANCELLED_ADMIN (lỗi phía trường, học viên được bù);
 *   từ mốc đó trở đi: CANCELLED_LATE (học viên xin huỷ muộn: trừ lượt như câu 12, không cộng ngày).
 * at là giờ của sự kiện sửa ô (onEdit) hoặc lúc gọi API, không phải lúc lấy được khoá: chọn 14:59:50 thì tính là trước hạn.
 */
function adminCancelBooking_(bookingId, actor, reason, at) {
  var when = at instanceof Date ? at : getNow_();
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.status !== BOOKING_STATUS.CONFIRMED && b.status !== BOOKING_STATUS.PENDING_REASSIGN) return { ok: false, reason: REASONS.INVALID_INPUT };
    var late = !(when < cancelDeadline_(b.date)), st = late ? BOOKING_STATUS.CANCELLED_LATE : BOOKING_STATUS.CANCELLED_ADMIN;
    cancelBookingInternal_(b, st, actor, reason || 'Admin huỷ', 'ADMIN');
    return { ok: true, status: st, late: late };
  });
}

/** Admin đổi tutor. tutorId trống: hệ thống tự chọn theo luật; có tutorId: dùng đúng người đó nếu rảnh. Chặn sau giờ bắt đầu (5M). */
function adminReassignBooking_(bookingId, actor, tutorId) {
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b || b.status !== BOOKING_STATUS.CONFIRMED) return { ok: false, reason: b ? REASONS.INVALID_INPUT : REASONS.NOT_FOUND };
    if (!(getNow_() < slotStart_(b.date, b.slot))) return { ok: false, reason: REASONS.SLOT_STARTED };
    return reassignBookingInLock_(b, [b.tutor_id], actor, 'ADMIN', tutorId || null);
  });
}

/** Trạng thái đã có kết quả mà "Vắng tutor" ghi đè được (sau khi admin xác nhận lần hai: tutor mất lương buổi đó). */
var TUTOR_ABSENT_OVERWRITE_ = ['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE'];
/**
 * Đánh dấu Vắng tutor (câu 28): không trừ buổi học viên, không tính lương, học viên được bù (5M).
 * Chỉ sau giờ bắt đầu buổi. Buổi đã có kết quả (Hoàn thành, Vắng học viên, Kỹ thuật) phải có opts.confirm, không thì trả NEED_CONFIRM.
 */
function adminMarkTutorAbsent_(bookingId, actor, opts) {
  opts = opts || {};
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (/^CANCELLED/.test(b.status) || b.status === BOOKING_STATUS.TUTOR_ABSENT) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (getNow_() < slotStart_(b.date, b.slot)) return { ok: false, reason: REASONS.TOO_EARLY };
    if (TUTOR_ABSENT_OVERWRITE_.indexOf(String(b.status)) !== -1 && !opts.confirm) return { ok: false, reason: 'NEED_CONFIRM', status: b.status };
    var prev = b.status;
    table_('BOOKINGS').update(b, { status: BOOKING_STATUS.TUTOR_ABSENT, result_at: getNow_(), result_by: actor });
    recomputeStudentPackages_(b.student_id, actor);
    logActivity_(actor, 'TUTOR_ABSENT', 'BOOKING', bookingId, prev === BOOKING_STATUS.CONFIRMED ? '' : { from: prev });
    return { ok: true };
  });
}

/**
 * Admin chọn lỗi của buổi Vấn đề kỹ thuật (câu 25, 27; chunk 5M). Nguồn duy nhất cho lương, trừ lượt Trial, bù ngày:
 *   TUTOR: không lương, không trừ, bù; STUDENT: có lương, trừ lượt Trial, không bù; OBJECTIVE: có lương, không trừ, bù.
 * Đổi qua lại bao nhiêu lần cũng đúng: tính lại gói ngay (rút hoặc cộng ngày bù).
 */
function adminSetTechFault_(bookingId, actor, fault) {
  if (!TECH_FAULT[fault]) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b || b.status !== BOOKING_STATUS.TECH_ISSUE) return { ok: false, reason: REASONS.INVALID_INPUT };
    table_('BOOKINGS').update(b, { tech_fault: fault, tech_decided_at: getNow_(), payroll_override: fault !== TECH_FAULT.TUTOR });
    recomputeStudentPackages_(b.student_id, actor);
    logActivity_(actor, 'TECH_FAULT', 'BOOKING', bookingId, fault);
    return { ok: true };
  });
}

/**
 * Chunk 5N: "Đã xử lý (giữ nguyên)" ở cột admin_action của BOOKINGS. Không đổi trạng thái, lương hay gói: chỉ ghi admin_done_at
 * (dòng hết tô vàng Vắng học viên, hết đỏ Không hoàn thành). Không cho chọn khi màu chỉ hết bằng việc thật:
 *   CONFIRMED, PENDING_REASSIGN (buổi chưa có kết quả hoặc chưa có tutor), TECH_ISSUE chưa chọn lỗi (chọn 1 trong 3 lựa chọn lỗi).
 * Trả { ok } hoặc { ok: false, reason, block: 'OPEN' | 'TECH' } để phần nối (Admin.gs) báo đúng việc cần làm.
 */
function adminMarkDone_(bookingId, actor) {
  return withLock_(function () {
    var t = table_('BOOKINGS'), b = t.byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) return { ok: false, reason: REASONS.INVALID_INPUT, block: 'OPEN', status: b.status };
    if (b.status === BOOKING_STATUS.TECH_ISSUE && !b.tech_decided_at) return { ok: false, reason: REASONS.INVALID_INPUT, block: 'TECH', status: b.status };
    logActivity_(actor, 'ADMIN_MARK_DONE', 'BOOKING', bookingId, { status: b.status });
    return { ok: true };
  });
}

/** Bản cũ (giữ tên cho code và test cũ): "Tính lương buổi kỹ thuật" = lỗi học viên; tắt = lỗi tutor. */
function adminPayrollOverride_(bookingId, actor, on) {
  return adminSetTechFault_(bookingId, actor, on !== false ? TECH_FAULT.STUDENT : TECH_FAULT.TUTOR);
}
