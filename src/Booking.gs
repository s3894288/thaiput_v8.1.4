/**
 * Booking.gs · Đặt và huỷ buổi học (v8, plan mục 4.2, 4.4)
 *
 * Hàm có hậu tố For_ nhận student_id ĐÃ XÁC THỰC từ phiên (Api.gs, chunk 3).
 * Không bao giờ nhận student_id từ trình duyệt (CLAUDE.md luật 6).
 */

// ── Truy vấn dùng chung cho các dịch vụ ──

function pkgDefs_() {
  var out = {};
  table_('PACKAGES').all().forEach(function (p) {
    out[p.code] = { code: p.code, name: p.name, name_en: String(p.name_en || '').trim() || p.name, type: String(p.type || 'DAYS').toUpperCase(), days: Number(p.days || 0), sessions: Number(p.sessions || 0), price_vnd: Number(p.price_vnd || 0), active: coerceCfg_(p.active, true) };
  });
  return out;
}
function userById_(id) { return table_('USERS').byId(id); }
function userByEmail_(email) {
  var e = String(email || '').trim().toLowerCase();
  return table_('USERS').find(function (u) { return String(u.email).trim().toLowerCase() === e; });
}
function studentPackages_(sid) { return table_('STUDENT_PACKAGES').filter(function (s) { return s.student_id === sid; }); }
function studentBookings_(sid) { return table_('BOOKINGS').filter(function (b) { return b.student_id === sid; }); }
function activeTutors_() { return table_('USERS').filter(function (u) { return u.role === 'TUTOR'; }); }

/**
 * Sau mỗi thay đổi buổi: tính lại ngày bắt đầu, hạn, ngày bù của các gói theo ngày (chunk 1 quyết định 2; chunk 5M).
 * Đã chạy menu 1 của 8.1.0 (đủ cột mới): luật khoá ngày bắt đầu và bù ngày (Compensation.gs). Chưa: luật cũ 8.0.10.
 * Trả danh sách thay đổi (chỉ khi dùng luật mới).
 */
function recomputeStudentPackages_(sid, actor, opts) {
  if (pkgCompReady_()) return recomputeCompFor_(sid, actor, opts);
  var defs = pkgDefs_(), bks = studentBookings_(sid), t = table_('STUDENT_PACKAGES');
  studentPackages_(sid).forEach(function (sp) {
    var def = defs[sp.package_code];
    if (!def) return;
    var patch = pkgRecomputeAfterChange_(sp, def, bks);
    if (patch) {
      t.update(sp, patch);
      logActivity_(actor, 'PACKAGE_RECOMPUTED', 'STUDENT_PACKAGE', sp.sp_id, { status: patch.status, start: patch.start_date ? dateKey_(patch.start_date) : '', end: patch.end_date ? dateKey_(patch.end_date) : '' });
    }
  });
  return [];
}

/** Kiểm tra trạng thái tài khoản học viên trước khi đặt. */
function studentAccountReason_(user) {
  if (!user || user.role !== 'STUDENT') return REASONS.FORBIDDEN;
  if (user.status === USER_STATUS.SUSPENDED) return REASONS.SUSPENDED;
  if (user.status !== USER_STATUS.ACTIVE) return REASONS.NOT_ACTIVE;
  return null;
}

// ── Đặt ──

/**
 * Đặt một hoặc nhiều buổi trong một lần gửi.
 * requests: [{ date: 'yyyy-MM-dd', slot: 'HH:mm' }]
 * Trả: [{ date, slot, ok, reason, tutorName, meetLink, bookingId }]
 */
function bookSessionsFor_(studentId, requests, actor, opts) {
  // opts.override (admin đặt thay, chunk 5E): bỏ qua hạn đặt và BOOKING_ENABLED, chỉ cần slot chưa bắt đầu;
  // vẫn giữ 1 buổi/ngày, hạn gói, slot BLOCKED và trùng giờ. Mỗi yêu cầu có thể chỉ định tutorId.
  // opts.requestId (chunk 5F): mã chống gửi trùng do trình duyệt sinh. Gửi lại cùng mã (mạng chập chờn, tự thử lại)
  // thì trả lại đúng các buổi đã đặt lần trước, không đặt thêm.
  opts = opts || {};
  var override = !!opts.override, rid = validRequestId_(opts.requestId);
  if (!Array.isArray(requests) || !requests.length) throw new Error('Không có buổi nào để đặt.');
  if (requests.length > 14) throw new Error('Mỗi lần đặt tối đa 14 buổi.');
  // Chịu tải (chunk 5B, 5F): trong khoá chỉ kiểm tra luật và ghi dòng (BOOKINGS, nhật ký, thông báo): một lần lấy khoá.
  // Calendar (chỉ buổi gấp) và email làm sau khi nhả khoá (afterLock_); mã sự kiện ghi trong một khoá ngắn cuối (deferWrite_).
  // Lỗi ở pha sau khoá không bao giờ biến kết quả đã ghi thành "thất bại".
  var phase = withLock_(function () {
    var tb = table_('BOOKINGS');
    if (rid) {
      var prev = tb.filter(function (b) { return b.request_id === rid && b.student_id === studentId; });
      if (prev.length) return { replay: prev.map(function (b) { var tu = userById_(b.tutor_id) || {}; return { date: dateKey_(b.date), slot: b.slot, ok: true, reason: REASONS.OK, bookingId: b.booking_id, tutorName: tu.name || '', meetLink: b.meet_link || '', replay: true }; }) };
    }
    var student = userById_(studentId);
    var accountReason = studentAccountReason_(student);
    if (!cfg_('BOOKING_ENABLED') && !override) accountReason = REASONS.DISABLED;
    var reqs = requests.map(function (r) { return { date: String((r && r.date) || ''), slot: String((r && r.slot) || ''), tutorId: override && r && r.tutorId ? String(r.tutorId) : '' }; })
      .sort(function (a, b) { return (a.date + a.slot) < (b.date + b.slot) ? -1 : 1; });
    if (accountReason) return reqs.map(function (r) { return { date: r.date, slot: r.slot, ok: false, reason: accountReason }; }); // mảng: không có pha sau khoá

    var now = getNow_(), defs = pkgDefs_(), sps = studentPackages_(studentId);
    var tutors = activeTutors_(), usersById = {};
    table_('USERS').all().forEach(function (u) { usersById[u.user_id] = u; });
    var avail = table_('AVAILABILITY').all();
    // Buổi vừa chấp nhận trong cùng lần gửi đã nằm trong bảng (insert cập nhật cache), nên đếm 1 buổi/ngày
    // và số buổi của gói tự tính cả chúng; không cần cộng thêm.
    var results = [], byTutor = {}, accepted = [];
    var maxPerDay = cfg_('MAX_BOOKINGS_PER_DAY');
    // Một lần gửi chọn nhiều slot hơn mức cho phép trong cùng một ngày: từ chối cả ngày đó (C21),
    // vì không biết học viên muốn giữ slot nào. Trang web cũng chặn từ trước.
    var perDayInRequest = {};
    reqs.forEach(function (r) { perDayInRequest[r.date] = (perDayInRequest[r.date] || 0) + 1; });

    reqs.forEach(function (r) {
      var res = { date: r.date, slot: r.slot, ok: false };
      var date = parseDateKey_(r.date);
      if (!date) { res.reason = REASONS.INVALID_INPUT; results.push(res); return; }
      if (!override && !(now < bookingDeadline_(date)) && bookingLeadHours_() < 0) { res.reason = REASONS.DEADLINE; results.push(res); return; }
      if (date > addDays_(toMidnight_(now), cfg_('BOOKING_HORIZON_DAYS'))) { res.reason = REASONS.TOO_FAR; results.push(res); return; }
      if (!isValidSlot_(r.slot)) { res.reason = REASONS.INVALID_SLOT; results.push(res); return; }
      if (override ? !(now < slotStart_(date, r.slot)) : !(now < bookingDeadlineFor_(date, r.slot))) { res.reason = REASONS.DEADLINE; results.push(res); return; }
      if (perDayInRequest[r.date] > maxPerDay) { res.reason = REASONS.ONE_PER_DAY; results.push(res); return; }

      var mine = tb.filter(function (b) { return b.student_id === studentId && bookingDeducts_(b) && sameDate_(b.date, date); }).length;
      if (mine >= maxPerDay) { res.reason = REASONS.ONE_PER_DAY; results.push(res); return; }

      var pk = resolvePackageForDate_(sps, defs, studentBookings_(studentId), date, {});
      if (!pk.ok) { res.reason = pk.reason; results.push(res); return; }

      var cands = buildTutorCandidates_(date, r.slot, tutors, avail, tb.all(), []);
      var tutorId = r.tutorId ? (cands.some(function (c) { return c.tutor_id === r.tutorId; }) ? r.tutorId : null) : pickTutor_(cands);
      if (!tutorId) { res.reason = REASONS.NO_TUTOR; results.push(res); return; }
      var tutor = usersById[tutorId];

      var booking = tb.insert({
        booking_id: nextId_('BOOKINGS'), student_id: studentId, tutor_id: tutorId, sp_id: pk.sp.sp_id,
        // created_at cắt về giây (soát R2 L8): mã sự kiện cố định băm theo giây, bản trong bộ nhớ và bản đọc lại phải giống nhau.
        date: date, slot: r.slot, status: BOOKING_STATUS.CONFIRMED, created_at: new Date(Math.floor(now.getTime() / 1000) * 1000), payroll_override: false, request_id: rid || '', tech_fault: ''
      });
      logActivity_(actor, 'BOOKED', 'BOOKING', booking.booking_id, { student: studentId, tutor: tutorId, date: r.date, slot: r.slot });

      res.ok = true; res.reason = REASONS.OK; res.bookingId = booking.booking_id; res.tutorName = tutor.name; res.meetLink = '';
      res._booking = booking; res._tutor = tutor;
      (byTutor[tutorId] = byTutor[tutorId] || []).push({ booking: booking, student: student });
      accepted.push(res);
      results.push(res);
    });
    if (!accepted.length) return { results: results };

    recomputeStudentPackages_(studentId, actor);
    // Một thông báo cho cả lần đặt (không mỗi buổi một dòng), ghi ngay trong khoá này (không lấy khoá thêm).
    notify_('BOOKED', { actor: actor, student_id: studentId, tutor_id: accepted.map(function (r) { return r._booking.tutor_id; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(','),
      entity: 'BOOKING', entity_id: accepted.map(function (r) { return r.bookingId; }).join(','),
      message: (override ? 'Admin ' + actor + ' đặt thay ' + student.name + ' ' : student.name + ' đặt ') + accepted.length + ' buổi: ' + accepted.map(function (r) { return fmtDayVi_(parseDateKey_(r.date)) + ' ' + r.slot + ' (' + r.tutorName + ')'; }).join(', '),
      message_en: (override ? 'Admin ' + actor + ' booked for ' + student.name + ' ' : student.name + ' booked ') + accepted.length + ' lesson(s): ' + accepted.map(function (r) { return fmtDayEn_(parseDateKey_(r.date)) + ' ' + r.slot + ' (' + r.tutorName + ')'; }).join(', ') });
    // Calendar: buổi gấp tạo ngay sau khi nhả khoá; buổi khác chờ hàng đợi (CalendarQueue.gs).
    var urgent = calendarOnBooked_(accepted.map(function (r) { return r._booking; }), now);
    afterLock_(function () {
      var outs = calendarCreateEvents_(urgent.map(function (b) { return { b: b, student: student, tutor: usersById[b.tutor_id] }; }));
      outs.forEach(function (o) {
        if (!o.ev) return;
        accepted.forEach(function (r) { if (r.bookingId === o.id) { r.meetLink = o.ev.meetLink; r._booking.meet_link = o.ev.meetLink; } });
      });
      if (outs.length) deferWrite_(function () { calendarApplyOutcomes_(outs); if (outs.some(function (o) { return o.err; })) calendarHint_(getNow_().getTime()); });
    });
    // Email gộp cho học viên và cho từng tutor (có link Meet nếu sự kiện vừa tạo; không thì ghi link sẽ đến cùng lời mời lịch).
    afterLock_(function () { mailBookingSummary_(student, results); });
    afterLock_(function () { Object.keys(byTutor).forEach(function (tid) { try { mailTutorNewLessons_(usersById[tid], byTutor[tid]); } catch (e) { afterLockError_(e); } }); });
    return { results: results };
  });
  var clean = function (list) { return list.map(function (r) { var o = {}; Object.keys(r).forEach(function (k) { if (k.charAt(0) !== '_') o[k] = r[k]; }); return o; }); };
  if (Array.isArray(phase)) return phase; // lỗi tài khoản: đã là mảng kết quả
  if (phase.replay) return phase.replay;
  return clean(phase.results);
}

/** Mã chống gửi trùng hợp lệ: 8 đến 64 ký tự chữ, số, gạch dưới. Sai dạng thì bỏ qua (chạy như không có mã). */
function validRequestId_(rid) { rid = typeof rid === 'string' ? rid : ''; return /^[A-Za-z0-9_]{8,64}$/.test(rid) ? rid : ''; }

// ── Huỷ ──

/** Huỷ của học viên: chỉ booking của chính mình, trước 15:00 hôm trước (câu 12). */
function cancelBookingFor_(studentId, bookingId, actor) {
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.student_id !== studentId) {
      logActivity_(actor, 'FORBIDDEN_CANCEL_ATTEMPT', 'BOOKING', bookingId, { by: studentId, owner: b.student_id });
      return { ok: false, reason: REASONS.FORBIDDEN };
    }
    if (b.status !== BOOKING_STATUS.CONFIRMED) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (!(getNow_() < cancelDeadline_(b.date))) return { ok: false, reason: REASONS.CANCEL_DEADLINE };
    cancelBookingInternal_(b, BOOKING_STATUS.CANCELLED_STUDENT, actor, 'Học viên huỷ', 'STUDENT');
    var stu = userById_(studentId), tut = userById_(b.tutor_id);
    notify_('STUDENT_CANCELLED', { actor: actor, student_id: studentId, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: bookingId, link: rowLink_('BOOKINGS', b._row),
      message: (stu ? stu.name : studentId) + ' huỷ buổi ' + fmtDayVi_(b.date) + ' ' + b.slot + ' với ' + (tut ? tut.name : b.tutor_id),
      message_en: (stu ? stu.name : studentId) + ' cancelled ' + fmtDayEn_(b.date) + ' ' + b.slot + ' with ' + (tut ? tut.name : b.tutor_id) });
    return { ok: true, reason: REASONS.OK };
  });
}

/**
 * Huỷ dùng chung (học viên, admin, tutor không có người thay). Phải gọi bên trong withLock_.
 * Đổi trạng thái, huỷ sự kiện Calendar, tính lại gói, gửi email, ghi log.
 */
function cancelBookingInternal_(b, newStatus, actor, reason, byWhom) {
  var tb = table_('BOOKINGS');
  // Chunk 5F: Calendar và email ra khỏi khoá (soát kiến trúc F3). Gỡ sự kiện (nếu đã có) ngay sau khi nhả khoá, rồi mới gửi
  // email huỷ. Gỡ lỗi thì hàng đợi Calendar thử lại (cal_state CANCEL_PENDING).
  var calPatch = calendarOnCancel_(b);
  tb.update(b, Object.assign({ status: newStatus, cancelled_at: getNow_(), cancel_reason: reason || '' }, calPatch));
  recomputeStudentPackages_(b.student_id, actor);
  var student = userById_(b.student_id), tutor = userById_(b.tutor_id);
  afterLock_(function () { mailCancelled_(b, student, tutor, byWhom); });
  logActivity_(actor, 'CANCELLED', 'BOOKING', b.booking_id, { status: newStatus, reason: reason || '' });
}

// ── Dữ liệu cho cổng học viên (Api.gs dùng ở chunk 3) ──

/** Các slot còn đặt được trong khoảng ngày, cho trang Đặt lịch. Không lộ tên tutor (brief flow 2 bước 5). */
/**
 * Dữ liệu cho việc liệt kê slot trong [start, end): AVAILABILITY trong khoảng, BOOKINGS từ thứ Hai của tuần đầu
 * (số buổi trong tuần của tutor) tới end, cộng buổi tạo gần nhất của mỗi tutor (xoay vòng). Kết quả ứng viên giống hệt
 * khi đưa cả bảng vào buildTutorCandidates_, nhưng nhanh hơn nhiều khi bảng lớn.
 */
function slotWindowData_(start, end) {
  var from = mondayOf_(start), lastByTutor = {};
  var avail = table_('AVAILABILITY').filter(function (a) { return a.date && a.date >= start && a.date < end; });
  var all = table_('BOOKINGS').all(), bookings = [];
  all.forEach(function (b) {
    if (b.created_at) { var tc = new Date(b.created_at).getTime(); if (!isNaN(tc) && (!lastByTutor[b.tutor_id] || tc > new Date(lastByTutor[b.tutor_id].created_at).getTime())) lastByTutor[b.tutor_id] = b; }
    if (b.date && b.date >= from && b.date < addDays_(end, 7)) bookings.push(b);
  });
  Object.keys(lastByTutor).forEach(function (k) { if (bookings.indexOf(lastByTutor[k]) === -1) bookings.push(lastByTutor[k]); });
  return { avail: avail, bookings: bookings };
}

/**
 * Lưới slot còn trống, dùng chung cho mọi học viên (chunk 5F): [{ date, label, slots }]. Đệm trong CacheService
 * SLOT_CACHE_SECONDS giây theo "phiên bản slot" (tăng mỗi khi BOOKINGS hoặc AVAILABILITY đổi) và theo phút (hạn đặt).
 * Đệm cũ chỉ làm học viên thấy một slot vừa hết; đặt lịch luôn kiểm lại trong khoá và báo "hết tutor".
 */
function slotGrid_(start, days) {
  var now = getNow_(), sec = Number(cfg_('SLOT_CACHE_SECONDS')) || 0, cache = null, key = '';
  if (sec > 0) {
    try {
      cache = CacheService.getScriptCache();
      key = 'slots_' + slotsVersion_() + '_' + dateKey_(start) + '_' + days + '_' + Math.floor(now.getTime() / 60000);
      var hit = cache.get(key);
      if (hit) return JSON.parse(hit);
    } catch (e) { cache = null; }
  }
  var win = slotWindowData_(start, addDays_(start, days)), tutors = activeTutors_(), out = [];
  for (var i = 0; i < days; i++) {
    var d = addDays_(start, i);
    if (!(now < bookingDeadline_(d)) && bookingLeadHours_() < 0) continue;
    var slots = slotList_().filter(function (s) { return now < bookingDeadlineFor_(d, s) && buildTutorCandidates_(d, s, tutors, win.avail, win.bookings, []).length > 0; });
    if (slots.length) out.push({ date: dateKey_(d), label: fmtDayVi_(d), slots: slots });
  }
  if (cache) { try { cache.put(key, JSON.stringify(out), Math.min(sec, 21600)); } catch (e) { } }
  return out;
}
function slotsVersion_() { try { return CacheService.getScriptCache().get('slots_v') || '0'; } catch (e) { return '0'; } }
/** Đổi phiên bản slot: mọi bản đệm cũ hết hiệu lực. Db.gs gọi khi ghi BOOKINGS hoặc AVAILABILITY; onEdit gọi khi admin sửa tay. */
function bumpSlotsVersion_() { try { CacheService.getScriptCache().put('slots_v', String(Date.now()) + Math.floor(Math.random() * 1000), 21600); } catch (e) { } }

function availableSlotsFor_(studentId, fromKey, days) {
  var now = getNow_(), start = parseDateKey_(fromKey) || toMidnight_(now);
  days = days || 14;
  var grid = slotGrid_(start, days), mineByDay = {}, end = addDays_(start, days);
  studentBookings_(studentId).forEach(function (b) { if (bookingDeducts_(b) && b.date >= start && b.date < end) mineByDay[dateKey_(b.date)] = true; });
  return grid.map(function (g) { return { date: g.date, label: g.label, slots: g.slots, alreadyBooked: !!mineByDay[g.date] }; });
}
