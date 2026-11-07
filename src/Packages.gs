/**
 * Packages.gs · Luật gói học, viết thành hàm thuần (v8, câu 1 đến 8 và 45)
 *
 * Không đọc Sheets ở đây. Mọi hàm nhận dữ liệu và trả kết quả, để test bằng Node.
 *
 * Dạng dữ liệu:
 *   def (một dòng PACKAGES):      { code, type: 'DAYS' | 'SESSIONS', days, sessions }
 *   sp  (một dòng STUDENT_PACKAGES): { sp_id, package_code, status, start_date, end_date, start_source,
 *                                      sessions_total, suspended_days, purchased_at }
 *   bk  (một dòng BOOKINGS):      { sp_id, date, status }
 *
 * Hai kiểu ngày bắt đầu (start_source):
 *   BOOKING  ngày bắt đầu = ngày học của buổi sớm nhất đang trừ buổi (câu 1). Huỷ buổi đó thì tính lại (câu 1, B11, B12).
 *   FIXED    ngày bắt đầu cố định: gói nối tiếp (câu 6), gói tự kích hoạt sau 30 ngày (câu 3), gói đã chạy từ trước.
 */

/** Số ngày hiệu lực thực tế = số ngày gói + số ngày được cộng bù do tạm khoá (câu 7). */
function pkgSpanDays_(sp, def) { return Number(def.days || 0) + Number(sp.suspended_days || 0); }

/** Số buổi tối đa: Trial và gói cũ có giới hạn; gói 2 tuần, 1 tháng không giới hạn (câu 8). 0 nghĩa là không giới hạn. */
function pkgSessionLimit_(sp, def) {
  var n = Number(sp.sessions_total || 0);
  if (n > 0) return n;
  return def.type === 'SESSIONS' ? Number(def.sessions || 0) : 0;
}

/** Buổi trừ lượt của gói: đang giữ chỗ, đã học, học viên vắng, huỷ muộn, kỹ thuật lỗi học viên (chunk 5M). */
function spConsumingBookings_(sp, bookings) {
  return bookings.filter(function (b) { return String(b.sp_id) === String(sp.sp_id) && bookingDeducts_(b); });
}

/**
 * Khoảng hiệu lực của gói, có tính thêm các ngày dự định đặt (extraDates).
 * Trả: { unbounded: true } cho gói tính buổi; { open: true } cho gói chưa có buổi nào; hoặc { start, end }.
 */
function pkgWindow_(sp, def, bookings, extraDates) {
  if (def.type === 'SESSIONS') return { unbounded: true };
  // FIXED (nối đuôi, tự kích hoạt) và LOCKED (đã khoá ở buổi làm mốc, chunk 5M): ngày bắt đầu cố định, hạn theo ô end_date.
  if ((sp.start_source === 'FIXED' || sp.start_source === 'LOCKED') && sp.start_date) {
    return { start: sp.start_date, end: sp.end_date || addDays_(sp.start_date, pkgSpanDays_(sp, def) - 1) };
  }
  var dates = spConsumingBookings_(sp, bookings).map(function (b) { return b.date; }).concat(extraDates || []);
  if (!dates.length) return { open: true };
  var start = dates.reduce(function (a, b) { return b < a ? b : a; });
  // Chunk 5M (soát 01/11 C): ngày bù admin cộng tay cũng nằm trong hạn khi ngày bắt đầu còn tạm tính.
  return { start: start, end: addDays_(start, pkgSpanDays_(sp, def) + intOr0_(sp.comp_days_admin) - 1), dates: dates };
}

/**
 * Gói này có nhận thêm buổi vào ngày `date` không.
 * pendingDates: các ngày đã được chấp nhận cho gói này trong cùng lần gửi (đặt nhiều ngày một lần).
 */
function pkgCheckDate_(sp, def, bookings, date, pendingDates) {
  if (sp.status === PKG_STATUS.EXPIRED) return { ok: false, reason: REASONS.EXPIRED };
  var pend = pendingDates || [];
  if (def.type !== 'SESSIONS') {
    var w = pkgWindow_(sp, def, bookings, pend.concat([date]));
    if (!w.open) {
      if (w.dates) {
        // Ngày bắt đầu tính theo buổi sớm nhất: mọi buổi phải nằm trong (số ngày gói) kể từ buổi sớm nhất.
        var maxD = w.dates.reduce(function (a, b) { return b > a ? b : a; });
        if (maxD > w.end) return { ok: false, reason: REASONS.OUT_OF_RANGE };
      } else if (date < w.start || date > w.end) {
        return { ok: false, reason: REASONS.OUT_OF_RANGE };
      }
    }
  }
  var limit = pkgSessionLimit_(sp, def);
  if (limit > 0) {
    var used = spConsumingBookings_(sp, bookings).length + pend.length;
    if (used >= limit) return { ok: false, reason: REASONS.NO_SESSIONS };
  }
  return { ok: true };
}

/**
 * Chọn gói dùng cho ngày `date` trong các gói của một học viên.
 * pendingBySp: { sp_id: [Date, ...] } các ngày vừa chấp nhận trong cùng lần gửi.
 * Trả { ok: true, sp } hoặc { ok: false, reason } với thứ tự ưu tiên lý do:
 *   NO_SESSIONS > OUT_OF_RANGE > EXPIRED > NO_PACKAGE
 */
function resolvePackageForDate_(sps, defsByCode, bookings, date, pendingBySp) {
  var pend = pendingBySp || {};
  var ordered = sps.slice().sort(function (a, b) {
    var ka = a.start_date || a.purchased_at || new Date(8640000000000000);
    var kb = b.start_date || b.purchased_at || new Date(8640000000000000);
    return ka - kb;
  });
  var reasons = [];
  for (var i = 0; i < ordered.length; i++) {
    var sp = ordered[i], def = defsByCode[sp.package_code];
    if (!def) continue;
    var r = pkgCheckDate_(sp, def, bookings, date, pend[sp.sp_id] || []);
    if (r.ok) return { ok: true, sp: sp };
    reasons.push(r.reason);
  }
  var order = [REASONS.NO_SESSIONS, REASONS.OUT_OF_RANGE, REASONS.EXPIRED];
  for (var j = 0; j < order.length; j++) if (reasons.indexOf(order[j]) !== -1) return { ok: false, reason: order[j] };
  return { ok: false, reason: REASONS.NO_PACKAGE };
}

/**
 * Sau khi đặt hoặc huỷ buổi: tính lại trạng thái và ngày của gói kiểu BOOKING.
 * Trả patch để ghi xuống STUDENT_PACKAGES, hoặc null nếu không đổi.
 */
function pkgRecomputeAfterChange_(sp, def, bookings) {
  if (def.type === 'SESSIONS' || sp.start_source === 'FIXED' || sp.start_source === 'LOCKED' || sp.status === PKG_STATUS.EXPIRED) return null;
  var w = pkgWindow_(sp, def, bookings, []);
  var patch;
  if (w.open) patch = { status: PKG_STATUS.INACTIVE, start_date: '', end_date: '', start_source: '' };
  else patch = { status: PKG_STATUS.ACTIVE, start_date: w.start, end_date: w.end, start_source: 'BOOKING' };
  var same = String(sp.status) === String(patch.status) &&
    sameOrBothEmpty_(sp.start_date, patch.start_date) && sameOrBothEmpty_(sp.end_date, patch.end_date);
  return same ? null : patch;
}
function sameOrBothEmpty_(a, b) {
  if (!a && !b) return true;
  return a instanceof Date && b instanceof Date && sameDate_(a, b);
}

/**
 * Chuyển trạng thái hằng ngày (dailyJob):
 *   INACTIVE quá N ngày từ ngày mua, chưa có buổi nào: tự ACTIVE từ hôm nay (câu 3)
 *   QUEUED đến ngày bắt đầu: ACTIVE (câu 6)
 *   Gói theo ngày đã qua ngày kết thúc: EXPIRED
 */
function pkgDailyTransition_(sp, def, bookings, today, autoActivateDays, opts) {
  if (def.type === 'SESSIONS') return null;
  // Chunk 5M: học viên đang tạm khoá thì gói không đổi trạng thái (không hết hạn khi đang khoá; mở khoá cộng đủ ngày).
  if (opts && opts.suspended) return null;
  var t = toMidnight_(today);
  if (sp.status === PKG_STATUS.INACTIVE) {
    var hasBooking = spConsumingBookings_(sp, bookings).length > 0;
    // Chunk 5M: đếm N ngày từ ngày muộn hơn giữa ngày mua và ngày của buổi lỗi phía trường gần nhất của gói này.
    var base = sp.purchased_at ? toMidnight_(new Date(sp.purchased_at)) : null;
    bookings.forEach(function (b) { if (String(b.sp_id) === String(sp.sp_id) && b.date && bookingCompensable_(b) && (!base || b.date > base)) base = toMidnight_(b.date); });
    if (!hasBooking && base && diffDays_(base, t) >= autoActivateDays) {
      var span = pkgSpanDays_(sp, def) + intOr0_(sp.comp_days_admin);
      return { status: PKG_STATUS.ACTIVE, start_date: t, end_date: addDays_(t, span - 1), start_source: 'FIXED', start_date_locked: t };
    }
    return null;
  }
  if (sp.status === PKG_STATUS.QUEUED && sp.start_date && t >= sp.start_date) {
    if (sp.end_date && t > sp.end_date) return { status: PKG_STATUS.EXPIRED };
    return { status: PKG_STATUS.ACTIVE };
  }
  if (sp.status === PKG_STATUS.ACTIVE && sp.end_date && t > sp.end_date) return { status: PKG_STATUS.EXPIRED };
  return null;
}

/**
 * Gói mới được duyệt khi học viên đã có gói: nối tiếp sau gói đang chạy (câu 6).
 * Trả { status, start_date, end_date, start_source } cho gói mới.
 */
function pkgPlanNewPurchase_(existingSps, defsByCode, newDef, today) {
  if (newDef.type === 'SESSIONS') return { status: PKG_STATUS.ACTIVE, start_date: '', end_date: '', start_source: '' };
  var t = toMidnight_(today), lastEnd = null;
  existingSps.forEach(function (sp) {
    var d = defsByCode[sp.package_code];
    if (!d || d.type === 'SESSIONS' || sp.status === PKG_STATUS.EXPIRED) return;
    if ((sp.status === PKG_STATUS.ACTIVE || sp.status === PKG_STATUS.QUEUED) && sp.end_date && sp.end_date >= t) {
      if (!lastEnd || sp.end_date > lastEnd) lastEnd = sp.end_date;
    }
  });
  if (lastEnd) {
    var start = addDays_(lastEnd, 1);
    return { status: PKG_STATUS.QUEUED, start_date: start, end_date: addDays_(start, Number(newDef.days) - 1), start_source: 'FIXED', start_date_locked: start };
  }
  return { status: PKG_STATUS.INACTIVE, start_date: '', end_date: '', start_source: '' };
}

/** Mở khoá sau tạm khoá: cộng số ngày bị khoá vào hạn các gói theo ngày còn hiệu lực (câu 7). */
function pkgUnsuspendPatch_(sp, def, suspendedFrom, unsuspendOn) {
  if (def.type === 'SESSIONS' || sp.status === PKG_STATUS.EXPIRED) return null;
  var days = Math.max(0, diffDays_(suspendedFrom, unsuspendOn));
  if (!days) return null;
  // Chunk 5M (soát 01/11 B): gói QUEUED chưa chạy ngày nào nên chỉ DỜI cả khoảng (start, start_date_locked, end), không cộng
  // suspended_days (cộng nữa thì công thức hạn tính hai lần, và ngày đã khoá cũ kéo gói về chồng lên gói trước).
  if (sp.status === PKG_STATUS.QUEUED && sp.start_date) {
    var q = { start_date: addDays_(sp.start_date, days), start_date_locked: addDays_(sp.start_date, days) };
    if (sp.end_date) q.end_date = addDays_(sp.end_date, days);
    return q;
  }
  var patch = { suspended_days: Number(sp.suspended_days || 0) + days };
  if (sp.end_date) patch.end_date = addDays_(sp.end_date, days);
  return patch;
}

/** Thông tin gói để hiển thị trên cổng học viên. */
function pkgSummary_(sp, def, bookings) {
  var limit = pkgSessionLimit_(sp, def);
  var used = spConsumingBookings_(sp, bookings).length;
  var src = String(sp.start_source || ''), comp = intOr0_(sp.comp_days) + intOr0_(sp.comp_days_admin);
  return {
    sp_id: sp.sp_id, code: sp.package_code, name: def.name || sp.package_code, nameEn: def.name_en || def.name || sp.package_code, status: sp.status,
    start: sp.start_date ? dateKey_(sp.start_date) : '', end: sp.end_date ? dateKey_(sp.end_date) : '',
    sessionLimit: limit, sessionsUsed: used, sessionsLeft: limit > 0 ? Math.max(0, limit - used) : null,
    // Chunk 5M: ngày bắt đầu còn tạm tính (chưa có buổi hoàn chỉnh đầu tiên) và tổng ngày bù đã cộng.
    startPending: def.type !== 'SESSIONS' && src === 'BOOKING', compDays: comp > 0 ? comp : 0
  };
}

// ══ Chunk 5M: khoá ngày bắt đầu, bù ngày (plan/TU_VAN_BU_BUOI.md, BL40, BL42, BL46, BL47, BL48) ══

function intOr0_(v) { var n = Number(v); return v === '' || v === null || v === undefined || isNaN(n) ? 0 : Math.round(n); }
function hasCompValue_(v) { return v !== '' && v !== null && v !== undefined && !isNaN(Number(v)); }

/** Lỗi của buổi kỹ thuật. Dòng cũ chưa có tech_fault: payroll_override TRUE là lỗi khách quan (có lương, không trừ), còn lại lỗi tutor. */
function techFault_(b) {
  var f = String(b.tech_fault || '').trim().toUpperCase();
  if (TECH_FAULT[f]) return f;
  return (b.payroll_override === true || String(b.payroll_override).toUpperCase() === 'TRUE') ? TECH_FAULT.OBJECTIVE : TECH_FAULT.TUTOR;
}
/** Buổi trừ lượt và giữ ngày bắt đầu tạm tính: CONSUMING_STATUSES, huỷ muộn, kỹ thuật lỗi học viên. */
/**
 * Chunk 5N: admin đã xử lý buổi sau kết quả cuối: admin_done_at có và không cũ hơn result_at. Cùng nghĩa với luật tô màu BOOKINGS
 * (Setup.gs highlightSpecs_: chưa xử lý = admin_done_at trống hoặc < result_at) và danh sách chờ kết quả của trang quản trị.
 */
function adminHandled_(b) {
  if (!b || !b.admin_done_at) return false;
  var d = new Date(b.admin_done_at).getTime();
  if (isNaN(d)) return false;
  if (!b.result_at) return true;
  var r = new Date(b.result_at).getTime();
  return isNaN(r) || d >= r;
}

function bookingDeducts_(b) {
  if (isConsuming_(b.status) || b.status === BOOKING_STATUS.CANCELLED_LATE) return true;
  return b.status === BOOKING_STATUS.TECH_ISSUE && techFault_(b) === TECH_FAULT.STUDENT;
}
/** Buổi làm mốc khoá ngày bắt đầu: học xong, học viên vắng, huỷ muộn, kỹ thuật lỗi học viên.
 *  Không hoàn thành (5J) KHÔNG làm mốc và chưa là kết quả cuối: vẫn trừ lượt, giữ ngày tạm tính, nhưng chờ admin làm rõ mới khoá
 *  (soát 5J H1: khoá theo buổi chưa chắc đã diễn ra thì admin sửa sau sẽ làm học viên mất ngày). */
function bookingAnchors_(b) {
  var s = String(b.status);
  return s === 'COMPLETED' || s === 'STUDENT_ABSENT' || s === 'CANCELLED_LATE' || (s === 'TECH_ISSUE' && techFault_(b) === TECH_FAULT.STUDENT);
}
/** Buổi lỗi phía trường: không trừ lượt, được bù ngày khi ngày bắt đầu đã khoá. */
function bookingCompensable_(b) {
  if (COMP_STATUSES_.indexOf(String(b.status)) !== -1) return true;
  return b.status === BOOKING_STATUS.TECH_ISSUE && techFault_(b) !== TECH_FAULT.STUDENT;
}
/** Buổi đã có kết quả cuối. Kỹ thuật mà admin chưa chọn lỗi: cuối khi đã quá techHours giờ (giữ mặc định lỗi tutor). */
function bookingFinal_(b, now, techHours) {
  if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN || b.status === BOOKING_STATUS.NOT_COMPLETED) return false;
  if (b.status === BOOKING_STATUS.TECH_ISSUE && !b.tech_decided_at) {
    var from = b.result_at ? new Date(b.result_at) : null;
    if (!from || isNaN(from.getTime())) from = slotEnd_(b.date, b.slot);
    return now.getTime() - from.getTime() >= Number(techHours) * 3600000;
  }
  return true;
}
function bySlotStart_(a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); }

/**
 * Buổi làm mốc để khoá ngày bắt đầu: buổi làm mốc sớm nhất, và mọi buổi sớm hơn của gói đã có kết quả cuối.
 * Chưa đủ điều kiện thì trả null (chờ, ví dụ buổi 14/10 23:30 chưa xác nhận mà buổi 15/10 đã Hoàn thành).
 */
function pkgLockAnchor_(sp, bookings, now, techHours) {
  var mine = bookings.filter(function (b) { return String(b.sp_id) === String(sp.sp_id) && b.date instanceof Date; });
  var anchors = mine.filter(bookingAnchors_).sort(bySlotStart_);
  if (!anchors.length) return null;
  var a = anchors[0], at = slotStart_(a.date, a.slot).getTime();
  var waiting = mine.some(function (b) { return b !== a && slotStart_(b.date, b.slot).getTime() < at && !bookingFinal_(b, now, techHours); });
  return waiting ? null : a;
}

/**
 * Ngày đặt được đầu tiên F tính từ lúc now (BL48: kịp hạn đặt, không bảo đảm có giờ trống).
 * Luật 15:00 hôm trước: trước 15:00 là ngày mai, từ 15:00 là ngày kia. BOOKING_LEAD_HOURS > 0: ngày đầu còn giờ học cuối sau mốc đặt trước.
 */
function firstBookableDay_(now) {
  var t = toMidnight_(now), lead = bookingLeadHours_(), last = cfg_('SLOT_LAST');
  for (var i = 0; i < 4; i++) {
    var d = addDays_(t, i);
    if (lead < 0 ? now < bookingDeadline_(d) : now < bookingDeadlineFor_(d, last)) return d;
  }
  return addDays_(t, 2);
}

/** Bối cảnh tính gói, đọc CONFIG một lần. */
function compCtx_(now) {
  return { now: now, today: toMidnight_(now), F: firstBookableDay_(now), techHours: Number(cfg_('TECH_DECIDE_HOURS')),
    per: Number(cfg_('COMP_DAYS_PER_SESSION')), trialPer: Number(cfg_('COMP_DAYS_TRIAL')), trialMax: Number(cfg_('COMP_TRIAL_MAX_DAYS')),
    reopenDays: Number(cfg_('COMP_REOPEN_DAYS')) };
}

/**
 * Hàm thuần: tính lại một gói theo ngày (chunk 5M). Không ghi gì; trả việc cần ghi.
 *   sp, def:   dòng STUDENT_PACKAGES và PACKAGES
 *   bookings:  BOOKINGS của học viên (lọc theo sp_id bên trong)
 *   ctx:       compCtx_ cộng thêm:
 *     next:        { end, dates } của gói QUEUED nối đuôi ngay sau gói này (để chặn rút bù đẩy buổi của gói sau ra ngoài hạn)
 *     nextStarted: gói nối đuôi đã bắt đầu chạy (không tự mở lại gói này)
 * Trả { patch (null nếu không đổi), bookings: [{ b, patch }], events: [{ type, b, days, blockers }], end, start, locked }
 *
 * Luật:
 *   1. Ngày bắt đầu tạm tính = buổi trừ lượt sớm nhất (như cũ). Khoá ở buổi làm mốc (pkgLockAnchor_); FIXED (nối đuôi, tự kích hoạt)
 *      coi như đã khoá. Khoá rồi không bao giờ đổi; lấy lại từ start_date_locked (tự lành khi ô start_date bị sửa).
 *   2. Sau khi khoá: mỗi buổi lỗi phía trường có ngày học từ ngày bắt đầu trở đi được ghi comp_days MỘT lần
 *      (Trial: COMP_DAYS_TRIAL tới trần COMP_TRIAL_MAX_DAYS; gói khác COMP_DAYS_PER_SESSION), cộng phần để còn kịp đặt:
 *      hạn mới = max(hạn, F − 1) + số ngày. Buổi hết được bù (đổi lỗi kỹ thuật sang học viên) thì rút, trừ khi học viên đã đặt
 *      buổi trong phần ngày sắp bị rút (báo admin).
 *   3. Hạn = ngày bắt đầu + số ngày gói + suspended_days + comp_days + comp_days_admin − 1.
 *   4. Gói EXPIRED: buổi bù trong hạn gói, hết hạn chưa quá COMP_REOPEN_DAYS, gói sau chưa chạy: tự cộng và mở lại. Ngoài ra ghi 0 ngày,
 *      báo admin cộng tay (COMP_ON_EXPIRED).
 */
function pkgPlan_(sp, def, bookings, ctx) {
  var out = { patch: null, bookings: [], events: [], end: null, start: null, locked: false };
  if (def.type === 'SESSIONS') return out;
  var now = ctx.now, today = ctx.today, mine = bookings.filter(function (b) { return String(b.sp_id) === String(sp.sp_id) && b.date instanceof Date; });
  var src = String(sp.start_source || ''), want = {}, locked = src === 'LOCKED' || src === 'FIXED', start = null;
  var expired = sp.status === PKG_STATUS.EXPIRED;
  if (locked) start = sp.start_date_locked instanceof Date ? sp.start_date_locked : (sp.start_date instanceof Date ? sp.start_date : null);
  if (locked && !start) locked = false;   // dữ liệu hỏng (không còn ngày nào): tính như tạm
  if (!locked) {
    if (expired) return out;   // gói kiểu cũ đã hết hạn: không đụng
    var a = pkgLockAnchor_(sp, mine, now, ctx.techHours);
    if (a) { locked = true; start = toMidnight_(a.date); want.start_source = 'LOCKED'; want.start_date_locked = start; want.start_locked_at = now; want.start_booking_id = a.booking_id; }
  } else {
    want.start_source = src;
    if (!(sp.start_date_locked instanceof Date) || !sameDate_(sp.start_date_locked, start)) want.start_date_locked = start;
  }
  if (!locked) {
    var dates = mine.filter(bookingDeducts_).map(function (b) { return b.date; });
    if (!dates.length) {
      want = { status: PKG_STATUS.INACTIVE, start_date: '', end_date: '', start_source: '' };
      out.patch = pkgDiff_(sp, want);
      return out;
    }
    start = dates.reduce(function (x, y) { return y < x ? y : x; });
    want.start_source = 'BOOKING';
  }
  out.start = start; out.locked = locked;
  var limit = pkgSessionLimit_(sp, def), trial = limit > 0, susp = intOr0_(sp.suspended_days), compAdmin = intOr0_(sp.comp_days_admin);
  var resum = 0, baseUsed = 0;
  mine.forEach(function (b) { if (hasCompValue_(b.comp_days)) { resum += intOr0_(b.comp_days); baseUsed += intOr0_(b.comp_days) - intOr0_(b.comp_gap); } });
  // Gói đã hết hạn: buổi cũ có thể đã chuyển sang file lưu trữ, nên giữ tổng đã ghi và chỉ cộng trừ phần đổi lần này.
  var compSum = expired && hasCompValue_(sp.comp_days) ? intOr0_(sp.comp_days) : resum;
  var endOf = function () { return addDays_(start, Number(def.days || 0) + susp + compSum + compAdmin - 1); };
  // ctx.prevEnd: hạn trước lần admin sửa tay (ô end_date đã mang giá trị mới khi tính lại).
  var oldEnd = ctx.prevEnd instanceof Date ? ctx.prevEnd : (sp.end_date instanceof Date ? sp.end_date : null);
  if (locked) {
    var sorted = mine.slice().sort(bySlotStart_);
    // Rút trước (buổi hết được bù), rồi mới cộng (buổi mới được bù), theo thứ tự ngày học.
    sorted.forEach(function (b) {
      if (!hasCompValue_(b.comp_days) || (bookingCompensable_(b) && b.date >= start)) return;
      var d = intOr0_(b.comp_days);
      if (d > 0) {
        var newEnd = addDays_(endOf(), -d);
        var blockers = mine.filter(function (o) { return o !== b && bookingDeducts_(o) && o.date > newEnd; }).map(function (o) { return o.booking_id; });
        if (ctx.next) (ctx.next.dates || []).forEach(function (x) { if (x.date > addDays_(ctx.next.end, -d)) blockers.push(x.booking_id); });
        if (blockers.length) { out.events.push({ type: 'COMP_RETRACT_BLOCKED', b: b, days: d, blockers: blockers }); return; }
        compSum -= d; baseUsed -= d - intOr0_(b.comp_gap);
        out.events.push({ type: 'COMP_RETRACTED', b: b, days: d });
      }
      out.bookings.push({ b: b, patch: { comp_days: '', comp_gap: '' } });
    });
    sorted.forEach(function (b) {
      if (hasCompValue_(b.comp_days) || !bookingCompensable_(b) || !(b.date >= start)) return;
      var base = trial ? Math.max(0, Math.min(ctx.trialPer, ctx.trialMax - baseUsed)) : ctx.per, cur = endOf();
      if (expired && (diffDays_(cur, today) > ctx.reopenDays || ctx.nextStarted || b.date > cur)) {
        out.bookings.push({ b: b, patch: { comp_days: 0, comp_gap: 0 } });
        // Soát 01/11 F: gói nối đuôi đã chạy (gia hạn bình thường) mà buổi bù trong hạn, chưa quá COMP_REOPEN_DAYS: ngày bù chuyển
        // sang gói sau (comp_days_admin của gói sau), để kết quả không phụ thuộc admin bấm trước hay sau 06:00.
        var toNext = ctx.nextStarted && base > 0 && !(diffDays_(cur, today) > ctx.reopenDays) && !(b.date > cur);
        out.events.push({ type: toNext ? 'COMP_TO_NEXT' : 'COMP_ON_EXPIRED', b: b, days: base });
        return;
      }
      var gap = 0, total = 0;
      if (base > 0) { var fm1 = addDays_(ctx.F, -1); gap = fm1 > cur ? diffDays_(cur, fm1) : 0; total = base + gap; }
      compSum += total; baseUsed += base;
      out.bookings.push({ b: b, patch: { comp_days: total, comp_gap: gap } });
      out.events.push({ type: total > 0 ? 'COMP_EXTENDED' : 'COMP_NO_DAYS', b: b, days: total });
    });
  }
  var end = endOf(), status = sp.status;
  // Trạng thái suy từ ngày (soát 01/11 G: ô status bị dán đè thì tự lành). dailyJob vẫn là nơi chuyển ACTIVE sang EXPIRED, QUEUED sang ACTIVE.
  // Soát vòng 2 (5): gói nối đuôi (FIXED) chưa tới ngày bắt đầu luôn là QUEUED, xét trước mọi luật khác (dán đè INACTIVE, EXPIRED).
  if (locked && src === 'FIXED' && start > today) status = PKG_STATUS.QUEUED;
  else if (!locked || status === PKG_STATUS.INACTIVE) status = PKG_STATUS.ACTIVE;
  else if (expired && end >= today) status = PKG_STATUS.ACTIVE;   // mở lại (bù, admin sửa hạn), hoặc EXPIRED bị dán đè lên gói còn hạn
  else if (!PKG_STATUS[status]) status = end < today && !ctx.suspended ? PKG_STATUS.EXPIRED : (src === 'FIXED' && start > today ? PKG_STATUS.QUEUED : PKG_STATUS.ACTIVE);
  else if (status === PKG_STATUS.ACTIVE && src === 'FIXED' && start > today) status = PKG_STATUS.QUEUED;
  want.status = status; want.start_date = start; want.end_date = end; want.comp_days = compSum;
  if (oldEnd && !sameDate_(oldEnd, end) && sp.expiry_notice_at) want.expiry_notice_at = '';
  out.end = end;
  // Soát 01/11 D: ngày bắt đầu khoá sớm hơn (đổi lỗi kỹ thuật sang học viên trước khi khoá) làm buổi đã đặt rơi ra ngoài hạn: báo admin.
  var outside = mine.filter(function (b) { return (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) && (b.date > end || b.date < start); });
  if (outside.length) out.events.push({ type: 'BOOKING_OUT_OF_RANGE', b: null, days: 0, blockers: outside.map(function (b) { return b.booking_id; }) });
  // Soát 01/11 E (plan mục 2.5): Trial vượt số lượt sau khi đổi lỗi kỹ thuật sang học viên: báo admin, không tự huỷ buổi nào.
  if (trial && spConsumingBookings_(sp, mine).length > limit) out.events.push({ type: 'TRIAL_OVER_LIMIT', b: null, days: spConsumingBookings_(sp, mine).length - limit });
  if (trial && out.events.some(function (e) { return e.type === 'COMP_NO_DAYS'; })) {
    var left = limit - spConsumingBookings_(sp, mine).length;
    if (left > 0 && end < ctx.F) out.events.push({ type: 'TRIAL_LEFT_UNUSED', b: null, days: left });
  }
  out.patch = pkgDiff_(sp, want);
  return out;
}
/** Chỉ các ô thật sự đổi. Ô ngày so theo ngày; số so theo giá trị; trống và 0 của comp_days coi như nhau. */
function pkgDiff_(sp, want) {
  var p = {}, n = 0;
  Object.keys(want).forEach(function (k) {
    var a = sp[k], b = want[k], same;
    if (k === 'start_locked_at') same = false;   // chỉ có trong want khi vừa khoá
    else if (a instanceof Date || b instanceof Date) same = a instanceof Date && b instanceof Date ? sameDate_(a, b) : !a && !b;
    else if (k === 'comp_days') same = intOr0_(a) === intOr0_(b);
    else same = String(a === null || a === undefined ? '' : a) === String(b === null || b === undefined ? '' : b);
    if (!same) { p[k] = b; n++; }
  });
  return n ? p : null;
}

/**
 * Gói QUEUED nối đuôi: gói trước đổi hạn từ oldEnd sang newEnd thì dời ngày bắt đầu (Q7). Trả bản sao gói đã dời, hoặc null.
 * Chỉ dời gói có start_date đúng bằng oldEnd + 1 (nối liền); gói đã chạy (ACTIVE) không dời.
 */
function pkgShiftQueued_(sp, oldEnd, newEnd) {
  if (sp.status !== PKG_STATUS.QUEUED || !(sp.start_date instanceof Date) || !oldEnd || !newEnd) return null;
  if (!sameDate_(addDays_(oldEnd, 1), sp.start_date)) return null;
  var d = diffDays_(oldEnd, newEnd);
  if (!d) return null;
  var copy = Object.assign({}, sp), s = addDays_(sp.start_date, d);
  copy.start_date = s; copy.start_date_locked = s;
  return copy;
}

// ── Chunk 5L: kiểm tab PACKAGES, admin thêm gói ──
var PKG_TYPES_ = ['DAYS', 'SESSIONS'];
var PKG_CODE_RE_ = /^[A-Z0-9_]{2,20}$/;

/** Lỗi của một dòng gói (hàm thuần). Trả mảng câu lỗi, rỗng là hợp lệ. */
function packageRowErrors_(p) {
  var e = [], code = String(p.code || '').trim(), type = String(p.type || 'DAYS').trim().toUpperCase();
  var num = function (v) { return v === '' || v === null || v === undefined ? NaN : Number(v); };
  if (String(p.code || '') !== code) e.push('mã "' + p.code + '" có khoảng trắng thừa ở đầu hoặc cuối');
  if (!PKG_CODE_RE_.test(code)) e.push('mã "' + code + '" phải là 2 đến 20 ký tự A đến Z, 0 đến 9 hoặc _ (chữ in hoa, không dấu, không khoảng trắng)');
  if (!String(p.name || '').trim()) e.push('thiếu tên tiếng Việt (cột name)');
  if (PKG_TYPES_.indexOf(type) === -1) e.push('kiểu "' + p.type + '" phải là DAYS (theo ngày) hoặc SESSIONS (theo buổi)');
  if (type === 'DAYS' && !(Math.floor(num(p.days)) === num(p.days) && num(p.days) > 0)) e.push('gói theo ngày cần số ngày (cột days) là số nguyên lớn hơn 0');
  if (type === 'SESSIONS' && !(Math.floor(num(p.sessions)) === num(p.sessions) && num(p.sessions) > 0)) e.push('gói theo buổi cần số buổi (cột sessions) là số nguyên lớn hơn 0');
  if (p.sessions !== '' && p.sessions !== null && p.sessions !== undefined && !(num(p.sessions) >= 0)) e.push('số buổi (cột sessions) phải là số');
  if (!(num(p.price_vnd === '' ? 0 : p.price_vnd) >= 0)) e.push('giá (cột price_vnd) phải là số từ 0 trở lên');
  return e;
}

/**
 * Kiểm cả tab PACKAGES (hàm thuần, menu 2). Mã trùng: phần đặt lịch dùng dòng CUỐI (pkgDefs_), menu 1 dùng dòng ĐẦU, nên
 * báo đỏ kèm dòng đang có hiệu lực. Trả { errors, warnings, duplicates: { code: [số hàng] } }.
 */
function packageIssues_(rows) {
  var errors = [], warnings = [], seen = {};
  rows.forEach(function (p) {
    var code = String(p.code || '').trim();
    (seen[code] = seen[code] || []).push(p._row);
    packageRowErrors_(p).forEach(function (m) { errors.push('PACKAGES dòng ' + p._row + ' (' + (code || 'trống') + '): ' + m); });
    var type = String(p.type || 'DAYS').trim().toUpperCase();
    if (code === 'TRIAL' && type === 'DAYS' && !(Number(p.sessions) > 0)) warnings.push('Gói TRIAL không có số buổi (cột sessions): học viên Trial đặt không giới hạn buổi trong hạn gói');
    if (coerceCfg_(p.active, true) && !String(p.name_en || '').trim()) warnings.push('Gói ' + code + ' chưa có tên tiếng Anh (cột name_en): trang tiếng Anh hiện tên tiếng Việt');
  });
  var dup = {};
  Object.keys(seen).forEach(function (c) {
    if (seen[c].length < 2) return;
    dup[c] = seen[c];
    errors.push('Mã gói ' + c + ' trùng ở các dòng ' + seen[c].join(', ') + ': đặt lịch dùng dòng ' + seen[c][seen[c].length - 1] + ', menu 1 dùng dòng ' + seen[c][0] + '. Xoá dòng thừa; trong lúc trùng, trang đăng ký không nhận gói này');
  });
  return { errors: errors, warnings: warnings, duplicates: dup };
}

/** Mã gói đang trùng hoặc dòng gói sai (không cho đăng ký). */
function brokenPackageCodes_() {
  var rows = table_('PACKAGES').all(), out = {}, seen = {};
  rows.forEach(function (p) { var c = String(p.code || '').trim(); seen[c] = (seen[c] || 0) + 1; if (packageRowErrors_(p).length) { out[c] = true; out[String(p.code)] = true; } });
  // Soát 5L L9: mã có khoảng trắng thừa: chặn cả mã gõ thừa lẫn mã sạch tới khi admin sửa.
  rows.forEach(function (p) { if (seen[String(p.code || '').trim()] > 1) out[String(p.code)] = true; });
  Object.keys(seen).forEach(function (c) { if (seen[c] > 1) out[c] = true; });
  return out;
}

/** Admin thêm gói (menu "Thêm gói"). o: { code, name, name_en, type, days, sessions, price_vnd, active }. */
function addPackage_(o, actor) {
  var row = { code: String(o.code || '').trim().toUpperCase(), name: String(o.name || '').trim().substring(0, 80), name_en: String(o.name_en || '').trim().substring(0, 80),
    type: String(o.type || 'DAYS').trim().toUpperCase(), days: o.days === '' || o.days === undefined ? '' : Number(o.days),
    sessions: o.sessions === '' || o.sessions === undefined ? '' : Number(o.sessions), price_vnd: Number(o.price_vnd || 0), active: o.active !== false };
  if (row.type === 'SESSIONS' && row.days === '') row.days = '';
  var errs = packageRowErrors_(row);
  if (errs.length) return { ok: false, reason: REASONS.INVALID_INPUT, errors: errs };
  return withLock_(function () {
    var t = table_('PACKAGES');
    if (t.all().some(function (p) { return String(p.code).trim() === row.code; })) return { ok: false, reason: REASONS.INVALID_INPUT, errors: ['mã ' + row.code + ' đã có trong PACKAGES'] };
    t.insert(row);
    logActivity_(actor, 'PACKAGE_ADDED', 'PACKAGES', row.code, row);
    return { ok: true, code: row.code };
  });
}
