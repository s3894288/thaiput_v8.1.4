/**
 * Availability.gs · Lịch rảnh của tutor và quy trình xin huỷ (v8, plan mục 4.5, câu 21, 22, brief mục 9)
 */

/** Booking đang giữ slot (tutor, ngày, slot), hoặc null. */
function bookingAtSlot_(tutorId, date, slot) {
  return table_('BOOKINGS').find(function (b) {
    return b.tutor_id === tutorId && sameDate_(b.date, date) && b.slot === slot &&
      (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN);
  });
}
function availRow_(tutorId, date, slot) {
  return table_('AVAILABILITY').find(function (a) { return a.tutor_id === tutorId && sameDate_(a.date, date) && a.slot === slot; });
}

/**
 * Tutor bật hoặc tắt slot.
 * changes: [{ date: 'yyyy-MM-dd', slot: 'HH:mm', open: true | false }]
 * Trả từng dòng { date, slot, ok, state, reason } với state: OPEN, CANCELLED, CANCEL_PENDING, UNCHANGED.
 */
function setAvailabilityFor_(tutorId, changes, actor) {
  if (!Array.isArray(changes) || !changes.length) throw new Error('Không có thay đổi lịch rảnh.');
  if (changes.length > 7 * 32 * 2) throw new Error('Quá nhiều thay đổi trong một lần gửi.');
  return withLock_(function () {
    var tutor = userById_(tutorId);
    if (!tutor || tutor.role !== 'TUTOR' || tutor.status !== USER_STATUS.ACTIVE) throw new Error('Tài khoản tutor không hợp lệ: ' + tutorId);
    var now = getNow_(), today = toMidnight_(now), t = table_('AVAILABILITY'), out = [], pendingMails = [];
    changes.forEach(function (c) {
      var date = parseDateKey_(c.date), slot = String(c.slot || '');
      var res = { date: c.date, slot: slot, ok: false };
      if (!date || !isValidSlot_(slot)) { res.reason = REASONS.INVALID_INPUT; out.push(res); return; }
      if (slotStart_(date, slot) <= now || date < today) { res.reason = REASONS.DEADLINE; out.push(res); return; }
      if (date > addDays_(today, cfg_('BOOKING_HORIZON_DAYS'))) { res.reason = REASONS.TOO_FAR; out.push(res); return; }
      var row = availRow_(tutorId, date, slot);
      if (row && row.status === AVAIL_STATUS.BLOCKED) { res.reason = REASONS.SLOT_BLOCKED; out.push(res); return; }
      if (c.open) {
        // Thêm slot: luôn được, kể cả sau hạn (câu 22). Tutor bật lại slot đang chờ huỷ = rút yêu cầu.
        if (row && row.status === AVAIL_STATUS.OPEN) { res.ok = true; res.state = 'UNCHANGED'; out.push(res); return; }
        if (row) t.update(row, { status: AVAIL_STATUS.OPEN, admin_decision: '', cancel_requested_at: '' });
        else row = t.insert({ avail_id: nextId_('AVAILABILITY'), tutor_id: tutorId, date: date, slot: slot, status: AVAIL_STATUS.OPEN, created_at: now });
        logActivity_(actor, 'AVAIL_OPEN', 'AVAILABILITY', row.avail_id, c.date + ' ' + slot);
        res.ok = true; res.state = AVAIL_STATUS.OPEN; out.push(res); return;
      }
      if (!row || row.status !== AVAIL_STATUS.OPEN) { res.ok = true; res.state = 'UNCHANGED'; out.push(res); return; }
      var booking = bookingAtSlot_(tutorId, date, slot);
      var afterDeadline = !(now < tutorWeekDeadline_(date));
      if (!booking && !afterDeadline) {
        t.update(row, { status: AVAIL_STATUS.CANCELLED });
        logActivity_(actor, 'AVAIL_CLOSE', 'AVAILABILITY', row.avail_id, c.date + ' ' + slot);
        res.ok = true; res.state = AVAIL_STATUS.CANCELLED; out.push(res); return;
      }
      // Sau hạn hoặc đã có học viên: chờ admin duyệt (brief mục 9 trường hợp B).
      t.update(row, { status: AVAIL_STATUS.CANCEL_PENDING, cancel_requested_at: now, admin_decision: ADMIN_DECISION.PENDING });
      logActivity_(actor, 'AVAIL_CANCEL_REQUEST', 'AVAILABILITY', row.avail_id, { date: c.date, slot: slot, booking: booking ? booking.booking_id : '' });
      pendingMails.push({ row: row, booking: booking });
      res.ok = true; res.state = AVAIL_STATUS.CANCEL_PENDING; out.push(res);
    });
    pendingMails.forEach(function (p) {
      var stu = p.booking ? userById_(p.booking.student_id) : null;
      notify_('TUTOR_CANCEL_REQUEST', { actor: actor, tutor_id: tutorId, student_id: p.booking ? p.booking.student_id : '', entity: 'AVAILABILITY', entity_id: p.row.avail_id, link: rowLink_('AVAILABILITY', p.row._row),
        message: tutor.name + ' xin huỷ ' + fmtDayVi_(p.row.date) + ' ' + p.row.slot + (stu ? ' (đã có học viên ' + stu.name + ')' : ' (chưa có học viên)'),
        message_en: tutor.name + ' asks to cancel ' + fmtDayEn_(p.row.date) + ' ' + p.row.slot + (stu ? ' (student booked: ' + stu.name + ')' : ' (no student yet)') },
        function () { return mailAdminTutorCancelRequest_(tutor, p.row, p.booking, stu); });
    });
    return out;
  });
}

/**
 * Admin quyết định yêu cầu huỷ của tutor (dropdown ở tab AVAILABILITY, nối ở chunk 3).
 * decision: ADMIN_DECISION.APPROVE hoặc REJECT. Trả { ok, outcome } với outcome: REASSIGNED, CANCELLED_TUTOR, SLOT_CANCELLED, REJECTED.
 */
function decideTutorCancel_(availId, decision, actor) {
  return withLock_(function () { return decideTutorCancelInLock_(availId, decision, actor); });
}

/**
 * Admin quyết định yêu cầu huỷ slot của tutor (chunk 5B: 4 lựa chọn, cột outcome ghi kết quả).
 *   'Duyệt, tự chọn tutor thay' (hoặc 'Duyệt' cũ): khoá slot, hệ thống chọn tutor thay; không ai trống thì huỷ buổi.
 *   'Duyệt, chỉ định tutor thay': lấy mã tutor ở cột admin_note; tutor đó không trống thì giữ nguyên "Chờ duyệt" và báo lý do.
 *   'Duyệt, huỷ buổi': khoá slot, huỷ buổi (học viên không bị trừ buổi), báo học viên.
 *   'Từ chối': slot mở lại, tutor vẫn dạy.
 * Slot chưa có học viên thì mọi kiểu "Duyệt" đều là huỷ slot.
 */
function decideTutorCancelInLock_(availId, decision, actor) {
  var t = table_('AVAILABILITY'), row = t.byId(availId);
  if (!row) return { ok: false, reason: REASONS.NOT_FOUND };
  if (row.status !== AVAIL_STATUS.CANCEL_PENDING) return { ok: false, reason: REASONS.INVALID_INPUT };
  var D = TUTOR_CANCEL_DECISION;
  if (decision === ADMIN_DECISION.APPROVE) decision = D.AUTO;
  if ([D.AUTO, D.ASSIGN, D.CANCEL, D.REJECT].indexOf(decision) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  var now = getNow_(), tutor = userById_(row.tutor_id), booking = bookingAtSlot_(row.tutor_id, row.date, row.slot);
  var done = function (status, outcome) {
    t.update(row, { status: status, admin_decision: decision, decided_at: now, decided_by: actor, outcome: outcome + ' · ' + fmtDateTime_(now) });
  };

  if (decision === D.REJECT) {
    done(AVAIL_STATUS.OPEN, 'Từ chối, tutor vẫn dạy');
    logActivity_(actor, 'AVAIL_CANCEL_REJECTED', 'AVAILABILITY', availId, '');
    afterLock_(function () { mailTutorDecision_(tutor, row, false); });
    return { ok: true, outcome: 'REJECTED' };
  }
  if (!booking) {
    done(AVAIL_STATUS.CANCELLED, 'Đã huỷ slot (chưa có học viên)');
    logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, '');
    afterLock_(function () { mailTutorDecision_(tutor, row, true); });
    return { ok: true, outcome: 'SLOT_CANCELLED' };
  }
  if (decision === D.ASSIGN) {
    var want = String(row.admin_note || '').trim().toUpperCase().match(/T\d+/);
    if (!want) { t.update(row, { admin_decision: D.PENDING, outcome: 'Chưa chỉ định: ghi mã tutor (ví dụ T002) ở cột admin_note rồi chọn lại' }); return { ok: false, reason: REASONS.INVALID_INPUT }; }
    var r = reassignBookingInLock_(booking, [row.tutor_id], actor, 'TUTOR', want[0]);
    if (!r.ok) { t.update(row, { admin_decision: D.PENDING, outcome: 'Không chỉ định được ' + want[0] + ': tutor này không mở hoặc đã bận giờ đó · ' + fmtDateTime_(now) }); return r; }
    done(AVAIL_STATUS.BLOCKED, 'Đã đổi sang ' + want[0] + ' (admin chỉ định)');
    logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, 'BLOCKED, giao ' + want[0]);
    return r;
  }
  // Slot đang có học viên mà duyệt huỷ: tutor bận giờ đó, khoá hẳn (BLOCKED), không ai đặt hay tự mở lại được.
  if (decision === D.CANCEL) {
    done(AVAIL_STATUS.BLOCKED, 'Đã huỷ buổi ' + booking.booking_id + ', học viên không bị trừ buổi');
    logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, JSON.stringify({ status: 'BLOCKED', booking: 'CANCELLED' }));
    cancelBookingInternal_(booking, BOOKING_STATUS.CANCELLED_TUTOR, actor, 'Tutor huỷ, admin chọn không dạy thay', 'TUTOR');
    afterLock_(function () { mailTutorDecision_(tutor, row, true); });
    return { ok: true, outcome: 'CANCELLED_TUTOR' };
  }
  done(AVAIL_STATUS.BLOCKED, 'Đang tìm tutor thay');
  logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, 'BLOCKED');
  var out = reassignBookingInLock_(booking, [row.tutor_id], actor, 'TUTOR', null);
  t.update(row, { outcome: (out.outcome === 'REASSIGNED' ? 'Đã đổi sang ' + out.tutorId + ' (tự chọn)' : 'Không có tutor trống: đã huỷ buổi, học viên không bị trừ buổi') + ' · ' + fmtDateTime_(now) });
  return out;
}

/**
 * Gán lại tutor cho một booking (dùng khi duyệt huỷ của tutor, và khi admin đổi tutor ở chunk 3).
 * forcedTutorId: admin chỉ định tutor cụ thể (bỏ qua luật chọn ngẫu nhiên nhưng vẫn kiểm tra tutor đó rảnh).
 * Không có ai thay: huỷ booking với trạng thái CANCELLED_TUTOR, hoàn buổi nếu là Trial hoặc gói cũ (câu 19).
 */
function reassignBookingInLock_(booking, excludeIds, actor, cause, forcedTutorId) {
  var tb = table_('BOOKINGS'), oldTutor = userById_(booking.tutor_id), student = userById_(booking.student_id);
  tb.update(booking, { status: BOOKING_STATUS.PENDING_REASSIGN });
  var cands = buildTutorCandidates_(booking.date, booking.slot, activeTutors_(), table_('AVAILABILITY').all(),
    tb.all().filter(function (b) { return b.booking_id !== booking.booking_id; }), excludeIds);
  var newId = forcedTutorId ? (cands.some(function (c) { return c.tutor_id === forcedTutorId; }) ? forcedTutorId : null) : pickTutor_(cands);
  if (!newId) {
    if (forcedTutorId) { tb.update(booking, { status: BOOKING_STATUS.CONFIRMED }); return { ok: false, reason: REASONS.NO_TUTOR }; }
    // 5L (soát): khoá tutor: lý do riêng, không gửi thư huỷ cho tutor bị khoá.
    if (cause === 'LOCK') cancelBookingInternal_(booking, BOOKING_STATUS.CANCELLED_TUTOR, actor, 'Tutor nghỉ, không có tutor thay', 'TUTOR_LOCK');
    else cancelBookingInternal_(booking, BOOKING_STATUS.CANCELLED_TUTOR, actor, 'Tutor huỷ, không có tutor thay', 'TUTOR');
    if (cause === 'TUTOR') afterLock_(function () { mailTutorDecision_(oldTutor, { date: booking.date, slot: booking.slot }, true); });
    return { ok: true, outcome: 'CANCELLED_TUTOR' };
  }
  var newTutor = userById_(newId);
  // Chunk 5F (soát R1 T1): trong khoá chỉ ghi tutor mới. Vá sự kiện Calendar (khách mời, tiêu đề) và gửi email sau khi nhả khoá;
  // vá lỗi thì hàng đợi vá lại (cal_state RESYNC). Phòng Meet AUTO giữ nguyên link; TUTOR_ROOM dùng phòng của tutor mới.
  var link = cfg_('MEET_MODE') === 'TUTOR_ROOM' ? (newTutor.meet_room || '') : booking.meet_link;
  tb.update(booking, { tutor_id: newId, status: BOOKING_STATUS.CONFIRMED, meet_link: link });
  calendarOnReassign_(booking);
  logActivity_(actor, 'REASSIGNED', 'BOOKING', booking.booking_id, { from: oldTutor.user_id, to: newId });
  afterLock_(function () { mailReassigned_(booking, student, oldTutor, newTutor, { skipOld: cause === 'LOCK' }); });   // 5L: khoá tutor thì không thư cho tutor bị khoá
  notify_('REASSIGNED', { actor: actor, student_id: booking.student_id, tutor_id: newId, entity: 'BOOKING', entity_id: booking.booking_id, link: rowLink_('BOOKINGS', booking._row),
    message: 'Buổi ' + fmtDayVi_(booking.date) + ' ' + booking.slot + ' của ' + student.name + ': ' + oldTutor.name + ' sang ' + newTutor.name,
    message_en: 'Lesson ' + fmtDayEn_(booking.date) + ' ' + booking.slot + ' of ' + student.name + ': ' + oldTutor.name + ' to ' + newTutor.name });
  return { ok: true, outcome: 'REASSIGNED', tutorId: newId };
}

/** Lịch rảnh của chính tutor trong khoảng ngày (cho cổng tutor). */
function availabilityFor_(tutorId, fromKey, days) {
  var start = parseDateKey_(fromKey), end = addDays_(start, (days || 14) - 1), out = [];
  table_('AVAILABILITY').filter(function (a) { return a.tutor_id === tutorId && a.date >= start && a.date <= end && a.status !== AVAIL_STATUS.CANCELLED; })
    .forEach(function (a) {
      var b = bookingAtSlot_(tutorId, a.date, a.slot);
      out.push({ date: dateKey_(a.date), slot: a.slot, status: a.status, booked: !!b });
    });
  return out;
}
