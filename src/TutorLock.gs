/**
 * TutorLock.gs · Khoá, mở khoá tutor (chunk 5L, BL04 phương án a)
 *
 * Khoá tutor (menu Người dùng, dòng đang chọn ở USERS), làm trong MỘT khoá:
 *   1. Mọi buổi sắp tới (chưa bắt đầu) của tutor: tự đổi sang tutor khác đang mở giờ đó (như "Duyệt, tự chọn tutor thay");
 *      không còn ai thì huỷ buổi kiểu CANCELLED_TUTOR, học viên không bị trừ buổi và được bù theo luật 5M.
 *   2. Giờ rảnh từ hôm nay trở đi (OPEN, CANCEL_PENDING) chuyển CANCELLED, ghi outcome.
 *   3. USERS.status = DISABLED. Sau khoá: thoát mọi phiên và link còn hạn (logoutAll_).
 * Buổi đã bắt đầu hoặc đã qua giữ nguyên. Tài khoản DISABLED không đăng nhập được, nên buổi đã qua chưa có kết quả thì
 * admin chọn kết quả ở cột admin_action của BOOKINGS.
 * Trước khi chạy: menu hiện bản xem trước (buổi nào đổi được, buổi nào phải huỷ) và hỏi lại 2 lần.
 * Mở khoá: status ACTIVE; giờ rảnh đã huỷ không tự mở lại (tutor mở lại trên trang).
 */

/** Buổi sắp tới của tutor (chưa bắt đầu, còn giữ chỗ). */
function tutorFutureBookings_(tutorId, now) {
  return table_('BOOKINGS').filter(function (b) {
    return b.tutor_id === tutorId && (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) &&
      b.date instanceof Date && now < slotStart_(b.date, b.slot);
  }).sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); });
}

/** Xem trước (chỉ đọc): { tutor, bookings: [{ id, date, slot, student, candidates }], slots }. */
function tutorLockPlan_(tutorId) {
  var u = userById_(tutorId), now = getNow_();
  if (!u || u.role !== 'TUTOR') return { ok: false, reason: REASONS.NOT_FOUND };
  var today = toMidnight_(now), tutors = activeTutors_(), avail = table_('AVAILABILITY').all(), all = table_('BOOKINGS').all();
  var list = tutorFutureBookings_(tutorId, now).map(function (b) {
    var cands = buildTutorCandidates_(b.date, b.slot, tutors, avail, all.filter(function (x) { return x.booking_id !== b.booking_id; }), [tutorId]);
    var s = userById_(b.student_id) || {};
    return { id: b.booking_id, date: dateKey_(b.date), label: fmtDayVi_(b.date) + ' ' + b.slot, student: s.name || b.student_id, candidates: cands.length };
  });
  var slots = avail.filter(function (a) { return a.tutor_id === tutorId && a.date instanceof Date && a.date >= today && (a.status === AVAIL_STATUS.OPEN || a.status === AVAIL_STATUS.CANCEL_PENDING); }).length;
  return { ok: true, tutor: { id: u.user_id, name: u.name, status: u.status }, bookings: list, slots: slots };
}

function lockTutor_(tutorId, actor) {
  var res = withLock_(function () {
    var u = userById_(tutorId), now = getNow_();
    if (!u || u.role !== 'TUTOR') return { ok: false, reason: REASONS.NOT_FOUND };
    if (u.status === USER_STATUS.DISABLED) return { ok: false, reason: REASONS.INVALID_INPUT, already: true };
    var out = { ok: true, reassigned: [], cancelled: [], slots: 0 };
    // Khoá trước: tutor bị khoá không bao giờ được chọn lại làm tutor thay (activeTutors_ chỉ lọc vai trò).
    table_('USERS').update(u, { status: USER_STATUS.DISABLED });
    tutorFutureBookings_(tutorId, now).forEach(function (b) {
      var r = reassignBookingInLock_(b, [tutorId], actor, 'LOCK', null);
      if (r.outcome === 'REASSIGNED') out.reassigned.push(b.booking_id + ' → ' + r.tutorId); else out.cancelled.push(b.booking_id);
    });
    var today = toMidnight_(now), av = table_('AVAILABILITY');
    av.filter(function (a) { return a.tutor_id === tutorId && a.date instanceof Date && a.date >= today && (a.status === AVAIL_STATUS.OPEN || a.status === AVAIL_STATUS.CANCEL_PENDING); })
      .forEach(function (a) { av.update(a, { status: AVAIL_STATUS.CANCELLED, outcome: 'Tutor bị khoá · ' + fmtDateTime_(now) }); out.slots++; });
    bumpSlotsVersion_();
    logActivity_(actor, 'TUTOR_DISABLED', 'USER', tutorId, { reassigned: out.reassigned.length, cancelled: out.cancelled.length, slots: out.slots });
    return out;
  });
  if (res.ok) { var u2 = userById_(tutorId); if (u2) logoutAll_(u2, actor); }
  return res;
}

function unlockTutor_(tutorId, actor) {
  return withLock_(function () {
    var u = userById_(tutorId);
    if (!u || u.role !== 'TUTOR') return { ok: false, reason: REASONS.NOT_FOUND };
    if (u.status === USER_STATUS.ACTIVE) return { ok: false, reason: REASONS.INVALID_INPUT, already: true };
    table_('USERS').update(u, { status: USER_STATUS.ACTIVE });
    logActivity_(actor, 'TUTOR_ENABLED', 'USER', tutorId, '');
    return { ok: true };
  });
}

function menuLockTutor(e) { requireOperator_(e);
  var id = selectedUserRow_(), p = tutorLockPlan_(id), ui = SpreadsheetApp.getUi();
  if (!p.ok) { alert_('Dòng đang chọn không phải tutor (' + id + ').'); return null; }
  if (p.tutor.status === USER_STATUS.DISABLED) { alert_(p.tutor.name + ' (' + id + ') đã bị khoá.'); return null; }
  var lines = p.bookings.map(function (b) { return b.label + ' · ' + b.student + ': ' + (b.candidates ? 'đổi sang tutor khác (' + b.candidates + ' người rảnh)' : 'KHÔNG ai rảnh, sẽ huỷ, học viên được bù'); });
  var text = 'Khoá ' + p.tutor.name + ' (' + id + '):\n\n' + (lines.length ? p.bookings.length + ' buổi sắp tới:\n' + lines.slice(0, 30).join('\n') + (lines.length > 30 ? '\n...' : '') : 'Không có buổi sắp tới.') +
    '\n\n' + p.slots + ' giờ rảnh từ hôm nay sẽ bị huỷ. Tutor bị thoát khỏi mọi thiết bị, không đăng nhập được nữa.\n\nTiếp tục?';
  if (ui.alert('Khoá tutor: xem trước', text, ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  if (ui.alert('Xác nhận lần 2', 'Chắc chắn khoá ' + p.tutor.name + '? Học viên của các buổi trên sẽ nhận email đổi tutor hoặc huỷ buổi.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var r = lockTutor_(id, adminActor_(e));
  alert_(r.ok ? 'Đã khoá ' + p.tutor.name + '.\nĐổi tutor: ' + r.reassigned.length + (r.reassigned.length ? ' (' + r.reassigned.join(', ') + ')' : '') + '\nHuỷ và bù: ' + r.cancelled.length + (r.cancelled.length ? ' (' + r.cancelled.join(', ') + ')' : '') + '\nGiờ rảnh huỷ: ' + r.slots : 'Không khoá được: ' + r.reason);
  return r;
}

function menuUnlockTutor(e) { requireOperator_(e);
  var id = selectedUserRow_(), u = userById_(id);
  if (!u || u.role !== 'TUTOR') { alert_('Dòng đang chọn không phải tutor (' + id + ').'); return null; }
  var r = unlockTutor_(id, adminActor_(e));
  alert_(r.ok ? 'Đã mở khoá ' + u.name + '. Giờ rảnh đã huỷ không tự mở lại: tutor mở lại trên trang tutor, rồi gửi link đăng nhập (menu Người dùng).' : (r.already ? u.name + ' đang hoạt động.' : 'Không mở khoá được: ' + r.reason));
  return r;
}
