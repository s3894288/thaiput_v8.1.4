/**
 * CalendarQueue.gs · Hàng đợi sự kiện Calendar (chunk 5F)
 *
 * Vì sao: tạo một sự kiện Calendar có Meet tốn 1 đến 3 giây gọi Google. Làm việc đó ngay trong lượt bấm "Đặt" làm lượt chạy
 * dài, chiếm 1 trong 30 lượt chạy cùng lúc của tài khoản lâu hơn. Từ 5F: đặt lịch chỉ ghi booking (cal_state PENDING) và gửi
 * email xác nhận ngay; sự kiện Calendar do job calendarJob (mỗi 5 phút) tạo theo CALENDAR_MODE:
 *   NIGHTLY (quyết định 15/10, từ 16/10 là phương án dự phòng): gom từ CALENDAR_NIGHTLY_HOUR (23) tới hết ngày.
 *   QUEUE (mặc định từ 16/10): trong vài phút, trừ giờ yên tĩnh.
 *   INLINE: tạo ngay khi đặt (cách cũ).
 * Đường gấp ở mọi chế độ: buổi bắt đầu trong CALENDAR_MIN_LEAD_HOURS giờ tính từ lần xử lý thường kế tiếp thì tạo ngay khi đặt
 * (ví dụ admin đặt thay buổi tối nay lúc 16:00). Huỷ: gỡ sự kiện ngay sau khi nhả khoá; lỗi thì hàng đợi gỡ lại.
 *
 * cal_state: PENDING (chờ tạo) · CREATED · RESYNC (đổi tutor, chờ vá khách mời) · FAILED (thử quá CALENDAR_MAX_ATTEMPTS lần, đã báo admin) · CANCEL_PENDING (chờ gỡ) ·
 *            CANCELLED (đã gỡ) · SKIPPED (huỷ trước khi tạo, hoặc buổi đã qua mà chưa tạo) · DETACHED (chuyển tài khoản).
 * Dòng cũ (trước 5F) để trống: có event_id coi là CREATED, buổi CONFIRMED chưa có event_id coi là PENDING (tự lành).
 * Chống tạo trùng: mã sự kiện cố định theo booking (lessonEventId_), cộng giữ chỗ 10 phút trong bộ đệm cho mỗi việc đang làm.
 */

var CAL_STATE = { PENDING: 'PENDING', CREATED: 'CREATED', RESYNC: 'RESYNC', FAILED: 'FAILED', CANCEL_PENDING: 'CANCEL_PENDING', CANCELLED: 'CANCELLED', SKIPPED: 'SKIPPED', DETACHED: 'DETACHED' };
var CAL_BACKOFF_MIN_ = [5, 15, 60, 120];
var CAL_BUDGET_MS_ = 240000;          // mỗi lần chạy tối đa 4 phút (Google dừng ở 6 phút)
var CAL_HINT_KEY_ = 'cal_due_at';     // bộ đệm: thời điểm sớm nhất có việc, để job thoát ngay khi chưa tới hạn (không mở Sheets)

function isCancelledStatus_(s) { return String(s || '').indexOf('CANCELLED') === 0; }

function calState_(b) {
  var s = String(b.cal_state || '').trim().toUpperCase();
  if (s) return s;
  if (b.event_id) return isCancelledStatus_(b.status) ? CAL_STATE.CANCELLED : CAL_STATE.CREATED;
  return b.status === BOOKING_STATUS.CONFIRMED ? CAL_STATE.PENDING : '';
}

function calendarMode_() {
  var m = String(cfg_('CALENDAR_MODE') || '').trim().toUpperCase();
  return ['INLINE', 'QUEUE', 'NIGHTLY'].indexOf(m) === -1 ? 'QUEUE' : m;   // gõ sai: về mặc định QUEUE (16/10)
}
function inQuietHours_(now) {
  var f = Number(cfg_('CALENDAR_QUIET_FROM')), t = Number(cfg_('CALENDAR_QUIET_TO')), h = now.getHours();
  if (f < 0 || t < 0 || f === t) return false;
  return f > t ? (h >= f || h < t) : (h >= f && h < t);
}
/** Cửa sổ xử lý thường đang mở không. */
function calendarWindowOpen_(now) {
  var mode = calendarMode_();
  if (mode === 'INLINE') return true;
  if (mode === 'QUEUE') return !inQuietHours_(now);
  var h = Number(cfg_('CALENDAR_NIGHTLY_HOUR'));
  return h >= 0 && now.getHours() >= h;
}
/** Thời điểm (ms) cửa sổ xử lý thường mở lần tới. */
function calendarNextWindow_(now) {
  if (calendarWindowOpen_(now)) return now.getTime();
  var day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (calendarMode_() === 'QUEUE') {
    var to = Number(cfg_('CALENDAR_QUIET_TO')), end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), to);
    if (end <= now) end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, to);   // addDays_ trả nửa đêm, không dùng ở đây
    return end.getTime();
  }
  var h = Number(cfg_('CALENDAR_NIGHTLY_HOUR'));
  if (h < 0) return now.getTime() + 86400000 * 365; // tắt gom: chỉ còn đường gấp
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h).getTime();
}
/** Mốc phải có sự kiện: giờ học trừ CALENDAR_MIN_LEAD_HOURS. */
function calendarNeedBy_(b) { return slotStart_(b.date, b.slot).getTime() - Number(cfg_('CALENDAR_MIN_LEAD_HOURS')) * 3600000; }
/** Lúc đặt: chờ cửa sổ thường thì quá muộn (trừ 15 phút phòng job chạy trễ) nên tạo ngay. */
function calendarUrgent_(b, now) {
  if (calendarMode_() === 'INLINE') return true;
  return calendarNextWindow_(now) > calendarNeedBy_(b) - 15 * 60000;
}
/** Thời điểm sớm nhất job nên tạo sự kiện cho booking này. */
function calendarDueAt_(b, now) {
  var due = Math.min(calendarNextWindow_(now), calendarNeedBy_(b) - 10 * 60000);
  var next = b.cal_next_at ? new Date(b.cal_next_at).getTime() : 0;
  return Math.max(due, isNaN(next) ? 0 : next);
}
/**
 * Khi nào thư mời (link Meet) dự kiến tới, cho email xác nhận và cổng học viên, tutor (soát R2 L3). Chuỗi "HH:mm dd/MM",
 * rỗng khi đã có sự kiện hoặc không còn chờ. Thời điểm là ước lượng: job chạy mỗi 5 phút, có thể trễ vài phút.
 */
function calendarInviteWhen_(b, now) {
  if (b.event_id || b.meet_link || calState_(b) !== CAL_STATE.PENDING || b.status !== BOOKING_STATUS.CONFIRMED) return '';
  var d = new Date(Math.max(now.getTime(), calendarDueAt_(b, now)) + 5 * 60000);
  return pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()) + ' ' + pad2_(d.getDate()) + '/' + pad2_(d.getMonth() + 1);
}

/** Ghi gợi ý "có việc lúc" cho job. Gọi trong khoá (mọi nơi ghi gợi ý đều giữ khoá nên không ghi đè lẫn nhau). */
function calendarHint_(ms) {
  try {
    var c = CacheService.getScriptCache(), cur = c.get(CAL_HINT_KEY_);
    if (cur === null || ms < Number(cur)) c.put(CAL_HINT_KEY_, String(Math.floor(ms)), 21600);
    // Số lần ghi gợi ý: job so trước và sau khi chạy để biết có việc mới phát sinh trong lúc nó đang gọi Google.
    c.put('cal_hint_seq', String(Number(c.get('cal_hint_seq') || 0) + 1), 21600);
  } catch (e) { }
}
/** Chờ trước lần thử lại. NIGHTLY: ngắn (5, 10, 15, 20 phút) để lỗi được thử lại và báo trong cùng đêm (soát R2 T5). */
function calendarBackoffMs_(attempts) {
  var list = calendarMode_() === 'NIGHTLY' ? [5, 10, 15, 20] : CAL_BACKOFF_MIN_;
  return list[Math.min(list.length - 1, Math.max(0, attempts - 1))] * 60000;
}

/**
 * Ghi kết quả gọi Calendar vào BOOKINGS. Phải gọi trong withLock_.
 * outs: [{ id, kind: 'create'|'remove'|'resync'|'skip', ev?: { eventId, meetLink }, err?: Error, gone?: bool,
 *          tutorId?: tutor đã mời, premarked?: đã tăng cal_attempts trước khi gọi Google }]
 */
function calendarApplyOutcomes_(outs) {
  var t = table_('BOOKINGS'), now = getNow_(), max = Number(cfg_('CALENDAR_MAX_ATTEMPTS')) || 5, failed = [];
  outs.forEach(function (o) {
    var b = t.byId(o.id);
    if (!b) return;
    var attempts = Number(b.cal_attempts || 0);
    var fail = function (err) {
      // Việc tạo đã đánh dấu trước (premarked) thì lần thử này đã được đếm, không đếm lại.
      if (!o.premarked) attempts++;
      var patch = { cal_attempts: attempts };
      if (attempts >= max) { patch.cal_state = CAL_STATE.FAILED; patch.cal_next_at = ''; failed.push({ b: b, err: err, kind: o.kind }); }
      else patch.cal_next_at = new Date(now.getTime() + calendarBackoffMs_(attempts));
      t.update(b, patch);
      logActivity_('SYSTEM', o.kind === 'remove' ? 'CALENDAR_REMOVE_FAILED' : o.kind === 'resync' ? 'CALENDAR_PATCH_FAILED' : 'CALENDAR_CREATE_FAILED', 'BOOKING', b.booking_id, JSON.stringify({ attempt: attempts, error: String((err && err.message) || err).substring(0, 500) }));
    };
    if (o.kind === 'skip') { t.update(b, { cal_state: CAL_STATE.SKIPPED, cal_next_at: '' }); return; }
    if (o.kind === 'create') {
      if (!o.ev) return fail(o.err);
      if (o.fixedId && o.fixedId !== lessonEventId_(b)) {
        // Booking cùng mã nhưng là buổi khác (dữ liệu test vừa xoá, mã đánh lại; soát R2 L1): gỡ sự kiện vừa tạo, không gắn.
        var other = { booking_id: b.booking_id, event_id: o.ev.eventId, created_at: b.created_at };
        afterLock_(function () { try { removeLessonEvent_(other); } catch (x) { } });
        return;
      }
      if (b.event_id && b.event_id !== o.ev.eventId) {
        // Đã có sự kiện khác (lần chạy song song): gỡ sự kiện thừa vừa tạo, không gửi thư.
        afterLock_(function () { try { Calendar.Events.remove(lessonCalendarId_(), o.ev.eventId, { sendUpdates: 'none' }); } catch (x) { } });
        return;
      }
      if (String(b.cal_state).toUpperCase() === CAL_STATE.DETACHED) {
        // Đang chuyển tài khoản (soát R1 L2): sự kiện vừa tạo trên lịch cũ phải gỡ, giữ DETACHED cho bước B tạo trên lịch mới.
        var gone = { booking_id: b.booking_id, event_id: o.ev.eventId, created_at: b.created_at };
        afterLock_(function () { try { removeLessonEvent_(gone); } catch (x) { } });
        return;
      }
      if (isCancelledStatus_(b.status)) {
        // Buổi bị huỷ trong lúc đang tạo sự kiện: không gắn sự kiện vào buổi đã huỷ; gỡ ngay sau khi nhả khoá.
        // Gỡ lỗi thì mới ghi mã sự kiện (CANCEL_PENDING) để hàng đợi gỡ lại.
        t.update(b, { cal_state: CAL_STATE.CANCEL_PENDING });
        calendarRemoveAfterLock_(b, o.ev.eventId);
        return;
      }
      // Đã đổi tutor trong lúc tạo (soát R1 C1): sự kiện đang mời tutor cũ. Gắn sự kiện rồi đồng bộ lại khách mời ngay.
      var stale = o.tutorId && o.tutorId !== b.tutor_id;
      t.update(b, { event_id: o.ev.eventId, meet_link: o.ev.meetLink || b.meet_link || '', cal_state: stale ? CAL_STATE.RESYNC : CAL_STATE.CREATED, cal_attempts: 0, cal_next_at: '' });
      if (stale) calendarResyncAfterLock_(b);
      return;
    }
    if (o.kind === 'resync') {
      if (o.err) return fail(o.err);
      if (o.tutorId && o.tutorId !== b.tutor_id) { calendarResyncAfterLock_(b); return; }   // lại đổi tutor trong lúc vá
      var patch = { cal_state: isCancelledStatus_(b.status) ? CAL_STATE.CANCEL_PENDING : CAL_STATE.CREATED, cal_attempts: 0, cal_next_at: '' };
      if (o.ev && o.ev.meetLink !== undefined) patch.meet_link = o.ev.meetLink || b.meet_link || '';
      t.update(b, patch);
      if (isCancelledStatus_(b.status)) calendarRemoveAfterLock_(b);
      return;
    }
    if (o.kind === 'remove') {
      if (o.err) return fail(o.err);
      t.update(b, { cal_state: CAL_STATE.CANCELLED, cal_next_at: '' });
    }
  });
  failed.forEach(function (f) {
    var b = f.b;
    notify_('CALENDAR_FAILED', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
      message: (f.kind === 'remove' ? 'Không gỡ được sự kiện Calendar của ' : f.kind === 'resync' ? 'Không cập nhật được tutor trên sự kiện Calendar của ' : 'Không tạo được sự kiện Calendar cho ') + b.booking_id + ' (' + dateKey_(b.date) + ' ' + b.slot + ') sau ' +
        max + ' lần: ' + String((f.err && f.err.message) || f.err) + (f.kind === 'remove' ? '. Xoá tay sự kiện trên lịch học.' : '. Booking vẫn giữ; gửi link Meet tay cho học viên, tutor, hoặc ghi lại cal_state = PENDING (chưa có sự kiện) hoặc RESYNC (đã có) để thử lại.'),
      message_en: (f.kind === 'remove' ? 'Could not remove the Calendar event of ' : f.kind === 'resync' ? 'Could not update the tutor on the Calendar event of ' : 'Could not create the Calendar event for ') + b.booking_id + ' (' + dateKey_(b.date) + ' ' + b.slot + ') after ' +
        max + ' tries: ' + String((f.err && f.err.message) || f.err) + (f.kind === 'remove' ? '. Delete the event on the lesson calendar by hand.' : '. The booking is kept; send the Meet link by hand, or set cal_state to PENDING (no event yet) or RESYNC (event exists) to retry.') });
  });
}

/**
 * Gỡ sự kiện sau khi nhả khoá (huỷ booking). Kết quả ghi trong lần ghi gom cuối. Gọi trong khoá.
 * eventId: sự kiện vừa tạo nhưng chưa gắn vào booking (huỷ trong lúc tạo); gỡ lỗi thì ghi mã này để hàng đợi gỡ lại.
 */
function calendarRemoveAfterLock_(b, eventId) {
  var copy = { booking_id: b.booking_id, event_id: eventId || b.event_id, created_at: b.created_at };
  afterLock_(function () {
    var out = { id: copy.booking_id, kind: 'remove' };
    try { out.gone = removeLessonEvent_(copy) === 'gone'; } catch (e) { out.err = e; }
    deferWrite_(function () {
      if (out.err && eventId) { var t = table_('BOOKINGS'), f = t.byId(copy.booking_id); if (f && !f.event_id) t.update(f, { event_id: eventId }); }
      calendarApplyOutcomes_([out]);
      if (out.err) calendarHint_(getNow_().getTime() + calendarBackoffMs_(1));
    });
  });
}

/**
 * Đổi khách mời và tiêu đề sự kiện theo tutor hiện tại, sau khi nhả khoá (đổi tutor, hoặc job vừa tạo với tutor cũ).
 * Đọc lại booking lúc chạy (không dùng bản trong khoá) để luôn vá theo tutor mới nhất. Gọi trong khoá.
 */
function calendarResyncAfterLock_(b) {
  var id = b.booking_id;
  afterLock_(function () {
    var out = calendarResyncNow_(id);
    if (out) deferWrite_(function () { calendarApplyOutcomes_([out]); if (out.err) calendarHint_(getNow_().getTime() + calendarBackoffMs_(1)); });
  });
}
/** Vá sự kiện của một booking theo dữ liệu hiện tại (ngoài khoá). Trả outcome 'resync' hoặc null nếu không có gì để vá. */
function calendarResyncNow_(bookingId) {
  clearDbCache_();
  var b = table_('BOOKINGS').byId(bookingId);
  if (!b || !b.event_id) return null;
  var out = { id: bookingId, kind: 'resync', tutorId: b.tutor_id };
  try { out.ev = reassignLessonEvent_(b, userById_(b.student_id) || {}, userById_(b.tutor_id) || {}); } catch (e) { out.err = e; }
  return out;
}

/**
 * Huỷ booking: quyết định việc với sự kiện Calendar. Gọi trong khoá, trước khi đổi trạng thái. Trả patch cal_state cho booking.
 * Có sự kiện (hoặc có thể đã tạo: cal_attempts > 0, job hay đường gấp đang làm) thì gỡ sau khi nhả khoá; chưa từng tạo thì bỏ qua.
 */
function calendarOnCancel_(b) {
  var st = calState_(b);
  if (st === CAL_STATE.CREATED || st === CAL_STATE.RESYNC || ((st === CAL_STATE.PENDING || st === CAL_STATE.FAILED) && (b.event_id || Number(b.cal_attempts || 0) > 0))) {
    calendarRemoveAfterLock_(b);
    return { cal_state: CAL_STATE.CANCEL_PENDING, cal_next_at: '' };
  }
  if (st === CAL_STATE.PENDING || st === CAL_STATE.FAILED) return { cal_state: CAL_STATE.SKIPPED, cal_next_at: '' };
  return {};
}

/**
 * Đổi tutor (Availability.gs reassignBookingInLock_). Gọi trong khoá SAU khi đã ghi tutor_id mới.
 * Đã có sự kiện: vá khách mời sau khi nhả khoá (RESYNC). Chưa có: hàng đợi sẽ tạo với tutor mới, không làm gì.
 */
function calendarOnReassign_(b) {
  var st = calState_(b);
  if (b.event_id && (st === CAL_STATE.CREATED || st === CAL_STATE.RESYNC || st === CAL_STATE.FAILED)) {
    table_('BOOKINGS').update(b, { cal_state: CAL_STATE.RESYNC, cal_attempts: 0, cal_next_at: '' });
    calendarResyncAfterLock_(b);
  }
}

/**
 * Đặt lịch: các booking vừa ghi (trong khoá A). Buổi gấp: đánh dấu đang tạo, tạo ngay sau khi nhả khoá. Buổi khác: chờ job.
 * Trả danh sách booking sẽ tạo ngay (để email xác nhận có link Meet).
 */
function calendarOnBooked_(bookings, now) {
  var t = table_('BOOKINGS'), urgent = [];
  bookings.forEach(function (b) {
    if (calendarUrgent_(b, now)) {
      // cal_attempts 1: huỷ ngay sau đó vẫn biết phải thử gỡ; cal_next_at: job không làm trùng trong 10 phút.
      t.update(b, { cal_state: CAL_STATE.PENDING, cal_attempts: 1, cal_next_at: new Date(now.getTime() + 600000) });
      urgent.push(b);
    } else {
      t.update(b, { cal_state: CAL_STATE.PENDING });
      calendarHint_(calendarDueAt_(b, now));
    }
  });
  return urgent;
}

/** Tạo sự kiện cho danh sách việc (ngoài khoá, việc đã đánh dấu trước). Trả outs cho calendarApplyOutcomes_. */
function calendarCreateEvents_(items, t0) {
  var outs = [];
  items.forEach(function (it) {
    var o = { id: it.b.booking_id, kind: 'create', tutorId: it.b.tutor_id, premarked: true, fixedId: lessonEventId_(it.b) };
    if (t0 && realNowMs_() - t0 > CAL_BUDGET_MS_) return;
    try { o.ev = createLessonEvent_(it.b, it.student, it.tutor); } catch (e) { o.err = e; }
    outs.push(o);
  });
  return outs;
}

/** Job mỗi 5 phút. */
function calendarJob(e) { requireOperator_(e);
  try { var out = runCalendarQueue_({}); heartbeat_('calendarJob'); return out; }
  catch (err) {
    if (String((err && err.message) || err) === BUSY_MESSAGE_) { heartbeat_('calendarJob'); return { busy: true }; }
    mailAdminError_('Job calendarJob lỗi', (err && err.stack) || String(err));
    throw err;
  }
}

/**
 * Chạy hàng đợi. opts.force: bỏ qua giờ gom và gợi ý (menu "Calendar: tạo sự kiện đang chờ ngay").
 * Trả { created, removed, resynced, skipped, failed, left } hoặc { idle } hoặc { paused }.
 */
function runCalendarQueue_(opts) {
  opts = opts || {};
  var t0 = realNowMs_(), now = getNow_(), cache = CacheService.getScriptCache();
  // Đang xoá dữ liệu test (Reset.gs): tạm dừng để không gắn kết quả trễ vào booking mới cùng mã.
  var paused = Number(props_().getProperty('CAL_PAUSED_UNTIL') || 0);
  if (paused && realNowMs_() < paused) return { paused: true };
  var hint0 = null, seq0 = null;
  try { hint0 = cache.get(CAL_HINT_KEY_); seq0 = cache.get('cal_hint_seq'); } catch (e) { }
  if (!opts.force && hint0 !== null && now.getTime() < Number(hint0)) return { idle: true };
  // Đọc ngoài khoá (không ghi gì ở bước này).
  clearDbCache_();
  var users = {}; table_('USERS').all().forEach(function (u) { users[u.user_id] = u; });
  var jobs = [], skips = [], nextDue = Infinity;
  table_('BOOKINGS').all().forEach(function (b) {
    var st = calState_(b), next = b.cal_next_at ? new Date(b.cal_next_at).getTime() : 0, due;
    if (st === CAL_STATE.PENDING) {
      if (b.status !== BOOKING_STATUS.CONFIRMED) {
        if (isCancelledStatus_(b.status)) { if (b.event_id || Number(b.cal_attempts || 0) > 0) jobs.push({ b: b, kind: 'remove', at: 0 }); else skips.push(b); }
        return; // PENDING_REASSIGN: chờ admin quyết định tutor
      }
      if (slotEnd_(b.date, b.slot) <= now) { skips.push(b); return; }
      due = calendarDueAt_(b, now);
      if (opts.force || now.getTime() >= due) jobs.push({ b: b, kind: 'create', at: slotStart_(b.date, b.slot).getTime() });
      else nextDue = Math.min(nextDue, due);
    } else if (st === CAL_STATE.CANCEL_PENDING) {
      if (opts.force || now.getTime() >= next) jobs.push({ b: b, kind: 'remove', at: 0 }); else nextDue = Math.min(nextDue, next);
    } else if (st === CAL_STATE.RESYNC) {
      if (opts.force || now.getTime() >= next) jobs.push({ b: b, kind: 'resync', at: 1 }); else nextDue = Math.min(nextDue, next);
    }
  });
  // Giữ chỗ 10 phút trong bộ đệm: hai lần chạy chồng nhau (menu và trigger) không làm cùng một việc.
  var leaseKeys = jobs.map(function (j) { return 'cal_lease_' + j.b.booking_id; }), leased = {};
  try { leased = cache.getAll(leaseKeys) || {}; } catch (e) { leased = {}; }
  // Việc đang giữ chỗ (lần chạy khác đang làm, hoặc lần trước dừng giữa chừng): xét lại sau 10 phút, không bỏ quên (soát R2 T4).
  jobs = jobs.filter(function (j) { if (leased['cal_lease_' + j.b.booking_id]) { nextDue = Math.min(nextDue, now.getTime() + 600000); return false; } return true; })
    .sort(function (a, b) { return a.at - b.at; });
  var max = Number(cfg_('CALENDAR_BATCH_MAX')) || 40, take = jobs.slice(0, max), left = jobs.length - take.length;
  if (take.length) { var put = {}; take.forEach(function (j) { put['cal_lease_' + j.b.booking_id] = '1'; }); try { cache.putAll(put, 600); } catch (e) { } }
  try { return runCalendarTake_(take, skips, left, nextDue, now, t0, users, cache, hint0, seq0); }
  finally { try { cache.removeAll(take.map(function (j) { return 'cal_lease_' + j.b.booking_id; })); } catch (e) { } }
}

/** Phần làm việc của runCalendarQueue_ (tách ra để luôn gỡ giữ chỗ dù khoá bận hay lỗi giữa chừng). */
function runCalendarTake_(take, skips, left, nextDue, now, t0, users, cache, hint0, seq0) {
  // Đánh dấu "đang tạo" trong một khoá ngắn TRƯỚC khi gọi Google (soát R1 T3): học viên huỷ đúng lúc đó thì luồng huỷ biết
  // phải thử gỡ theo mã cố định, kể cả khi lượt ghi cuối của job hỏng.
  var creates = take.filter(function (j) { return j.kind === 'create'; });
  if (creates.length) {
    withLock_(function () {
      var tb = table_('BOOKINGS'), lease = new Date(now.getTime() + 600000);
      creates.forEach(function (j) {
        var f = tb.byId(j.b.booking_id);
        if (!f || calState_(f) !== CAL_STATE.PENDING || f.status !== BOOKING_STATUS.CONFIRMED || f.event_id) { j.drop = true; return; }
        tb.update(f, { cal_attempts: Number(f.cal_attempts || 0) + 1, cal_next_at: lease });
        j.b = f;   // tutor, học viên mới nhất
      });
    });
  }

  var outs = skips.map(function (b) { return { id: b.booking_id, kind: 'skip' }; }), resynced = 0;
  take.forEach(function (j) {
    if (j.drop) return;
    if (realNowMs_() - t0 > CAL_BUDGET_MS_) { left++; return; }
    var o = { id: j.b.booking_id, kind: j.kind, tutorId: j.b.tutor_id, premarked: j.kind === 'create', fixedId: j.kind === 'create' ? lessonEventId_(j.b) : '' };
    try {
      if (j.kind === 'create') o.ev = createLessonEvent_(j.b, users[j.b.student_id] || {}, users[j.b.tutor_id] || {});
      else if (j.kind === 'resync') { o.ev = reassignLessonEvent_(j.b, users[j.b.student_id] || {}, users[j.b.tutor_id] || {}); resynced++; }
      else o.gone = removeLessonEvent_(j.b) === 'gone';
    } catch (e) { o.err = e; }
    outs.push(o);
  });
  var res = { created: 0, removed: 0, resynced: 0, skipped: skips.length, failed: 0, left: left };
  outs.forEach(function (o) { if (o.err) res.failed++; else if (o.kind === 'create') res.created++; else if (o.kind === 'remove') res.removed++; else if (o.kind === 'resync') res.resynced++; });
  withLock_(function () {
    if (outs.length) calendarApplyOutcomes_(outs);
    // Gợi ý cho lần chạy sau: còn việc thì chạy ngay lần tới; không thì ngủ tới việc sớm nhất (tối đa 6 giờ, rồi kiểm lại toàn bộ).
    var hintAt = left > 0 || res.failed ? now.getTime() : (nextDue === Infinity ? now.getTime() + 6 * 3600000 : nextDue);
    // Có người ghi gợi ý mới trong lúc job chạy (đặt lịch, huỷ lỗi): giữ giá trị nhỏ hơn, không xoá (soát R1 T2).
    try { var cur = cache.get(CAL_HINT_KEY_); if (cur !== null && cache.get('cal_hint_seq') !== seq0) hintAt = Math.min(hintAt, Number(cur)); } catch (e) { }
    try { cache.put(CAL_HINT_KEY_, String(Math.floor(hintAt)), 21600); } catch (e) { }
    if (outs.length) logActivity_('SYSTEM', 'CALENDAR_QUEUE', 'BOOKINGS', '', res);
    if (outs.length) calendarNightTally_(now, res);
    // Cả lô lỗi ngay lần đầu (dịch vụ Calendar chưa bật, sai LESSON_CALENDAR_ID, hết hạn mức): báo ngay, 1 lần mỗi ngày (soát R2 T5).
    if (res.failed >= 3 && !res.created && !res.resynced) {
      var flag = 'CAL_BATCH_FAIL_' + dateKey_(now);
      if (!props_().getProperty(flag)) {
        props_().setProperty(flag, '1');
        notify_('CALENDAR_BATCH_FAILED', { entity: 'BOOKINGS', link: rowLink_('BOOKINGS'),
          message: 'Hàng đợi Calendar: ' + res.failed + ' việc lỗi, không việc nào thành công trong lần chạy ' + fmtDateTime_(now) + '. Lỗi đầu: ' +
            String((outs.filter(function (o) { return o.err; })[0] || {}).err) + '. Kiểm tra dịch vụ Calendar, LESSON_CALENDAR_ID, hạn mức; hệ thống tự thử lại.',
          message_en: 'Calendar queue: ' + res.failed + ' jobs failed, none succeeded in the run at ' + fmtDateTime_(now) + '. First error: ' +
            String((outs.filter(function (o) { return o.err; })[0] || {}).err) + '. Check the Calendar service, LESSON_CALENDAR_ID and quota; the system retries automatically.' });
      }
    }
  });
  return res;
}

/**
 * Cộng dồn kết quả các lượt trong một đêm (NIGHTLY) vào Script Property CAL_NIGHT_<ngày>. hourlyJob sau 00:00 gửi tổng kết
 * đêm qua (calendarNightSummaryInLock_) rồi xoá khoá. Gọi trong khoá.
 */
function calendarNightTally_(now, res) {
  if (calendarMode_() !== 'NIGHTLY') return;
  var key = 'CAL_NIGHT_' + dateKey_(now), p = props_(), cur = {};
  try { cur = JSON.parse(p.getProperty(key) || '{}'); } catch (e) { cur = {}; }
  ['created', 'removed', 'resynced', 'failed', 'skipped'].forEach(function (k) { cur[k] = (cur[k] || 0) + (res[k] || 0); });
  p.setProperty(key, JSON.stringify(cur));
}
/** Tổng kết lô đêm qua: CALENDAR_NIGHTLY (LOG) khi ổn, CALENDAR_NIGHTLY_PROBLEM (EMAIL) khi còn lỗi hoặc còn buổi sắp tới chưa có sự kiện. */
function calendarNightSummaryInLock_(now) {
  var p = props_(), all = p.getProperties(), sent = 0;
  Object.keys(all).forEach(function (k) { if (/^CAL_BATCH_FAIL_/.test(k) && k !== 'CAL_BATCH_FAIL_' + dateKey_(now)) p.deleteProperty(k); });
  Object.keys(all).filter(function (k) { return /^CAL_NIGHT_/.test(k) && k !== 'CAL_NIGHT_' + dateKey_(now); }).forEach(function (k) {
    var tally = {}; try { tally = JSON.parse(all[k]); } catch (e) { }
    var q = calendarQueueStatus_(), problem = q.failed > 0 || q.pendingSoon > 0;
    notify_(problem ? 'CALENDAR_NIGHTLY_PROBLEM' : 'CALENDAR_NIGHTLY', { entity: 'BOOKINGS', link: rowLink_('BOOKINGS'),
      message: 'Lô Calendar đêm ' + k.substring(10) + ': tạo ' + (tally.created || 0) + ' sự kiện, gỡ ' + (tally.removed || 0) + ', cập nhật tutor ' + (tally.resynced || 0) +
        ', lỗi (đã thử lại) ' + (tally.failed || 0) + '. Hiện còn ' + q.pendingSoon + ' buổi trong 24 giờ tới chưa có sự kiện, ' + q.failed + ' buổi cần xử lý tay.' +
        (problem ? ' Bấm menu "Calendar: tạo sự kiện đang chờ ngay" hoặc gửi link Meet tay.' : ''),
      message_en: 'Calendar batch of the night of ' + k.substring(10) + ': created ' + (tally.created || 0) + ' events, removed ' + (tally.removed || 0) + ', tutor updated ' + (tally.resynced || 0) +
        ', failed (retried) ' + (tally.failed || 0) + '. Now ' + q.pendingSoon + ' lesson(s) in the next 24 hours have no event, ' + q.failed + ' need manual handling.' +
        (problem ? ' Use the menu "Calendar: tạo sự kiện đang chờ ngay" or send the Meet link by hand.' : '') });
    p.deleteProperty(k); sent++;
  });
  return sent;
}

/** Tình trạng hàng đợi (menu, trang admin, đo tốc độ). Chỉ đọc. */
function calendarQueueStatus_() {
  var now = getNow_(), out = { mode: calendarMode_(), windowOpen: calendarWindowOpen_(now), pending: 0, pendingSoon: 0, failed: 0, cancelPending: 0 };
  table_('BOOKINGS').all().forEach(function (b) {
    var st = calState_(b);
    if (st === CAL_STATE.PENDING && b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now) {
      out.pending++;
      if (slotStart_(b.date, b.slot).getTime() - now.getTime() < 24 * 3600000) out.pendingSoon++;
    } else if (st === CAL_STATE.FAILED && b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now) out.failed++;
    else if (st === CAL_STATE.CANCEL_PENDING) out.cancelPending++;
  });
  return out;
}

/** Menu: chạy hàng đợi ngay, bỏ qua giờ gom (dùng khi thử trên STAGING hoặc khi cần lời mời ngay). */
function menuCalendarRunNow(e) { requireOperator_(e);
  var r = runCalendarQueue_({ force: true }), s = calendarQueueStatus_();
  alert_('Hàng đợi Calendar đã chạy.\n\nĐã tạo: ' + r.created + '\nĐã gỡ: ' + r.removed + '\nBỏ qua (đã huỷ trước khi tạo, hoặc buổi đã qua): ' + r.skipped +
    '\nLỗi (sẽ thử lại): ' + r.failed + '\nCòn lại cho lần sau: ' + r.left + '\n\nChế độ: ' + s.mode + (s.windowOpen ? ' (đang trong giờ xử lý)' : '') +
    '\nCòn chờ tạo: ' + s.pending + ' (trong 24 giờ tới: ' + s.pendingSoon + ')\nĐã báo lỗi, cần xử lý tay: ' + s.failed);
  return r;
}
