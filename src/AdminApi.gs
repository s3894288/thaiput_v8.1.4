/**
 * AdminApi.gs · Giao diện admin trên web (chunk 5E; song ngữ, nhật ký, ô số liệu bấm được từ chunk 5I)
 *
 * Mọi hàm bắt đầu bằng requireRole_(token, 'ADMIN') (CLAUDE.md luật 6).
 * Chunk 5I: chữ của trang admin nằm trong tab CONTENT (key ad.*, cả tiếng Việt và tiếng Anh), gửi kèm apiAdminHome, không gửi
 * cho trang của học viên, tutor. Máy chủ gửi mã (trạng thái buổi, mã sự kiện, mã hành động) và cặp câu { vi, en }; trình duyệt
 * dựng nhãn theo ngôn ngữ admin chọn bằng nút VI | EN.
 *
 *   apiAdminHome           số việc cần xử lý + thông báo chưa đọc mới nhất + chữ của trang admin
 *   apiAdminNotifications  lọc thông báo (chưa đọc, mức, theo tutor hoặc học viên)
 *   apiAdminMarkRead       đánh dấu đã đọc (tick cột read của NOTIFICATIONS)
 *   apiAdminLessons        danh sách buổi hôm nay hoặc buổi chờ tutor xác nhận (ô số liệu trên đầu trang)
 *   apiAdminPeople         danh sách tutor và học viên kèm số liệu nhanh
 *   apiAdminPerson         chi tiết một tutor hoặc học viên
 *   apiAdminBooking        chi tiết một buổi học
 *   apiAdminSlots          slot còn trống để đặt thay (bỏ qua hạn đặt), kèm tutor rảnh
 *   apiAdminBook           đặt thay học viên
 *   apiAdminCancel         huỷ buổi (không giới hạn hạn huỷ)
 *   apiAdminLog            nhật ký ACTIVITY_LOG (dòng xem trước, LOG_KEEP_DAYS ngày gần nhất)
 *   apiAdminLogEntry       một dòng nhật ký đầy đủ
 */

var ADMIN_LIST_LIMIT_ = 150;

/** Câu báo lỗi cho admin, cả hai thứ tiếng (key ad.r.MÃ trong CONTENT; không có thì dùng câu của học viên). */
function adminReasonPair_(code, vars) {
  var m = contentMap_();
  if (m['ad.r.' + code]) return { vi: contentText_('ad.r.' + code, vars, 'vi'), en: contentText_('ad.r.' + code, vars, 'en') };
  return reasonPair_(code, vars);
}
function adminReasonText_(code) { return adminReasonPair_(code).vi; }
/** Kết quả lỗi kèm câu hai thứ tiếng (trình duyệt chọn theo ngôn ngữ đang dùng). */
function adminFail_(reason, key, vars) {
  var p = { vi: contentText_(key, vars, 'vi'), en: contentText_(key, vars, 'en') };
  return { ok: false, reason: reason, message: p.vi, msg: p };
}
/** Chữ của trang admin (key ad.*) cho trình duyệt: key → [vi, en]. */
function adminContent_() {
  var m = contentMap_(), out = {};
  Object.keys(m).forEach(function (k) { if (k.indexOf('ad.') === 0) out[k] = m[k]; });
  return out;
}

function adminNotifView_(n) {
  return { id: n.notif_id, time: n.time instanceof Date ? fmtDateTime_(n.time) : String(n.time || ''), level: n.level, event: n.event, channel: n.channel,
    actor: n.actor, studentId: n.student_id, tutorId: n.tutor_id, entity: n.entity, entityId: String(n.entity_id || ''), message: n.message,
    messageEn: String(n.message_en || ''), link: n.link, read: n.read === true || String(n.read).toUpperCase() === 'TRUE' };
}
function isRead_(n) { return n.read === true || String(n.read).toUpperCase() === 'TRUE'; }

/** Thông báo mới nhất trước. q: { unread, level, personId, limit }. personId khớp cột student_id hoặc tutor_id (có thể nhiều mã cách dấu phẩy). */
function adminNotifications_(q) {
  q = q || {};
  var limit = Math.min(Number(q.limit) || 50, ADMIN_LIST_LIMIT_), pid = String(q.personId || '');
  var rows = table_('NOTIFICATIONS').filter(function (n) {
    if (q.unread && isRead_(n)) return false;
    if (q.level && n.level !== q.level) return false;
    if (pid && String(n.student_id).split(',').indexOf(pid) === -1 && String(n.tutor_id).split(',').indexOf(pid) === -1) return false;
    return true;
  });
  rows.sort(function (a, b) { return new Date(b.time) - new Date(a.time) || (a.notif_id < b.notif_id ? 1 : -1); });
  return { total: rows.length, items: rows.slice(0, limit).map(adminNotifView_) };
}

/** Buổi "hôm nay" và "chờ tutor xác nhận": cùng luật cho ô số liệu và danh sách (không lệch nhau). */
function adminLessonsToday_(bks, now) { var today = toMidnight_(now); return bks.filter(function (b) { return sameDate_(b.date, today) && (b.status === BOOKING_STATUS.CONFIRMED || isConsuming_(b.status)); }); }
/** Buổi chờ kết quả: đã bắt đầu mà chưa có kết quả, cộng buổi Không hoàn thành trong 60 ngày gần nhất (soát 5J: để admin thấy và sửa trên web). */
var ADMIN_NOT_COMPLETED_DAYS_ = 60;
function adminLessonsWaiting_(bks, now) {
  var from = addDays_(toMidnight_(now), -ADMIN_NOT_COMPLETED_DAYS_);
  return bks.filter(function (b) {
    if (!(b.date instanceof Date)) return false;
    if (b.status === BOOKING_STATUS.CONFIRMED) return slotStart_(b.date, b.slot) <= now;
    // 5N: Không hoàn thành mà admin đã chọn "Đã xử lý (giữ nguyên)" (hoặc kết quả khác) thì không còn chờ, như ô Sheets hết đỏ.
    return b.status === BOOKING_STATUS.NOT_COMPLETED && b.date >= from && !adminHandled_(b);
  });
}

/** Bộ lọc thông báo ban đầu của trang admin: chưa đọc, mọi mức (apiAdminHome gửi sẵn để trang không phải gọi lần hai). */
var ADMIN_FEED_FIRST_ = { unread: true, level: '', limit: 100 };

function apiAdminHome(token) {
  return apiWrap_('apiAdminHome', function () {
    var u = requireRole_(token, 'ADMIN'), now = getNow_();
    var notif = table_('NOTIFICATIONS').all(), unread = { CRITICAL: 0, WARNING: 0, INFO: 0 };
    notif.forEach(function (n) { if (!isRead_(n) && unread[n.level] !== undefined) unread[n.level]++; });
    var bks = table_('BOOKINGS').all(), today = toMidnight_(now);
    var counts = {
      // Chưa xử lý xong (kể cả dòng đã chọn "Duyệt" nhưng xử lý lỗi, chưa có processed_at): đúng những dòng cần admin nhìn.
      pendingRegistrations: table_('REGISTRATIONS').filter(function (r) { return !r.processed_at; }).length,
      pendingTutorCancels: table_('AVAILABILITY').filter(function (a) { return a.status === AVAIL_STATUS.CANCEL_PENDING; }).length,
      lessonsToday: adminLessonsToday_(bks, now).length,
      waitingResult: adminLessonsWaiting_(bks, now).length,
      techIssues: bks.filter(function (b) { return b.status === BOOKING_STATUS.TECH_ISSUE && b.date >= addDays_(today, -30); }).length
    };
    return { ok: true, data: { me: { name: u.name, email: u.email, lang: userLang_(u) }, now: fmtDateTime_(now), today: dateKey_(now), unread: unread, counts: counts,
      sheetUrl: rowLink_('NOTIFICATIONS'), links: { registrations: rowLink_('REGISTRATIONS'), availability: rowLink_('AVAILABILITY'), bookings: rowLink_('BOOKINGS') },
      feed: adminNotifications_(ADMIN_FEED_FIRST_), feedQuery: ADMIN_FEED_FIRST_, content: adminContent_(), logDays: activityKeepDays_() } };
  });
}

function apiAdminNotifications(token, q) {
  return apiWrap_('apiAdminNotifications', function () {
    requireRole_(token, 'ADMIN');
    return { ok: true, data: adminNotifications_(q || {}) };
  });
}

/** ids: mảng mã thông báo, hoặc 'ALL' (mọi thông báo chưa đọc). */
function apiAdminMarkRead(token, ids) {
  return apiWrap_('apiAdminMarkRead', function () {
    var u = requireRole_(token, 'ADMIN');
    return withLock_(function () {
      var t = table_('NOTIFICATIONS'), n = 0, all = ids === 'ALL', set = {};
      if (!all) (Array.isArray(ids) ? ids : []).slice(0, 500).forEach(function (x) { set[String(x)] = true; });
      var targets = t.all().filter(function (r) { return !isRead_(r) && (all || set[r.notif_id]); });
      n = targets.length;
      if (n > 20) setColumnForRows_(t, 'read', targets, true);   // nhiều dòng: ghi một lần cả cột, không giữ khoá lâu
      else targets.forEach(function (r) { t.update(r, { read: true }); });
      // 5K (BL02): mở một thông báo là xem, không ghi nhật ký; chỉ ghi khi bấm "Đã đọc hết" (thao tác của admin).
      if (all) logActivity_(u.email, 'NOTIF_READ', 'NOTIFICATIONS', 'ALL', String(n));
      return { ok: true, data: { count: n } };
    });
  });
}

/** Danh sách buổi cho ô số liệu: kind 'today' (hôm nay, theo giờ) hoặc 'waiting' (đã diễn ra, tutor chưa xác nhận, mới nhất trước). */
function apiAdminLessons(token, kind) {
  return apiWrap_('apiAdminLessons', function () {
    requireRole_(token, 'ADMIN');
    var now = getNow_(), bks = table_('BOOKINGS').all(), byId = usersById_(), k = kind === 'waiting' ? 'waiting' : 'today';
    var list = k === 'today' ? adminLessonsToday_(bks, now).sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); })
      : adminLessonsWaiting_(bks, now).sort(function (a, b) { return slotStart_(b.date, b.slot) - slotStart_(a.date, a.slot); });
    return { ok: true, data: { kind: k, total: list.length, items: list.slice(0, ADMIN_LIST_LIMIT_).map(function (b) { return adminBookingView_(b, byId); }), sheetLink: rowLink_('BOOKINGS'), hours: Number(cfg_('RESULT_NOTICE_AFTER_HOURS')) || 0, expireHours: Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) || 0 } };
  });
}

/** Danh sách tutor và học viên kèm số liệu nhanh cho tuần hiện tại. */
function apiAdminPeople(token) {
  return apiWrap_('apiAdminPeople', function () {
    requireRole_(token, 'ADMIN');
    var now = getNow_(), mon = mondayOf_(now), sun = addDays_(mon, 6), nextMon = addDays_(mon, 7), nextSun = addDays_(mon, 13);
    var bks = table_('BOOKINGS').all(), avail = table_('AVAILABILITY').all(), defs = pkgDefs_(), sps = table_('STUDENT_PACKAGES').all();
    var unreadBy = {};
    table_('NOTIFICATIONS').all().forEach(function (n) {
      if (isRead_(n)) return;
      String(n.student_id).split(',').concat(String(n.tutor_id).split(',')).forEach(function (id) { if (id) unreadBy[id] = (unreadBy[id] || 0) + 1; });
    });
    var tutors = [], students = [];
    table_('USERS').all().forEach(function (u) {
      if (u.role === 'TUTOR') {
        var mine = bks.filter(function (b) { return b.tutor_id === u.user_id; });
        tutors.push({ id: u.user_id, name: u.name, email: u.email, status: u.status,
          weekLessons: mine.filter(function (b) { return b.date >= mon && b.date <= sun && isConsuming_(b.status); }).length,
          toConfirm: mine.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) <= now; }).length,
          openNextWeek: avail.filter(function (a) { return a.tutor_id === u.user_id && a.status === AVAIL_STATUS.OPEN && a.date >= nextMon && a.date <= nextSun; }).length,
          unread: unreadBy[u.user_id] || 0 });
      } else if (u.role === 'STUDENT') {
        var bk = bks.filter(function (b) { return b.student_id === u.user_id; });
        var pk = sps.filter(function (sp) { return sp.student_id === u.user_id; })
          .sort(function (a, b) { var o = { ACTIVE: 0, INACTIVE: 1, QUEUED: 2, EXPIRED: 3 }, ka = a.status in o ? o[a.status] : 9, kb = b.status in o ? o[b.status] : 9; return ka - kb; /* ACTIVE = 0: không dùng ||, vì 0 bị coi là sai */ })[0];
        var sum = pk ? pkgSummary_(pk, defs[pk.package_code] || { code: pk.package_code, type: 'DAYS' }, bk) : null;
        students.push({ id: u.user_id, name: u.name, email: u.email, status: u.status,
          pkg: sum ? { name: sum.name, nameEn: sum.nameEn, status: sum.status, end: sum.end, left: sum.sessionsLeft } : null,
          upcoming: bk.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) > now; }).length,
          weekBooked: bk.filter(function (b) { return b.date >= mon && b.date <= sun && isConsuming_(b.status); }).length,
          unread: unreadBy[u.user_id] || 0 });
      }
    });
    return { ok: true, data: { tutors: tutors, students: students } };
  });
}

/** Một buổi cho trang admin: mã trạng thái (nhãn dựng ở trình duyệt theo ngôn ngữ), ngày dạng yyyy-mm-dd. */
function adminBookingView_(b, usersById) {
  var s = usersById[b.student_id] || {}, t = usersById[b.tutor_id] || {}, now = getNow_();
  // Chunk 5J: quá hạn chọn kết quả thì trang quản trị tô đỏ (overdue) và ghi giờ sẽ thành Không hoàn thành.
  var dli = b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) <= now ? resultDeadlineInfo_(b, now) : null;
  return { id: b.booking_id, date: dateKey_(b.date), slot: b.slot, status: b.status, awaiting: bookingAwaiting_(b, now),
    overdue: !!(dli && dli.overdue), expireAt: dli ? fmtDateTime_(dli.expireAt) : '',
    student: { id: b.student_id, name: s.name || b.student_id }, tutor: { id: b.tutor_id, name: t.name || b.tutor_id },
    meetLink: b.meet_link || '', past: slotStart_(b.date, b.slot) <= now,
    // Buổi đã bắt đầu không huỷ trên web (huỷ sẽ gửi thư huỷ và mất lương tutor); xử lý ở cột admin_action của BOOKINGS.
    canCancel: (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) && slotStart_(b.date, b.slot) > now, resultBy: b.result_by || '', cancelReason: b.cancel_reason || '',
    cancelReasonKey: CANCEL_REASON_KEYS_[String(b.cancel_reason || '').trim()] || '' };
}
/** Lý do huỷ do hệ thống tự ghi (tiếng Việt cố định trong BOOKINGS): trang quản trị hiện theo ngôn ngữ (key ad.reason.*), soát 5I B4. */
var CANCEL_REASON_KEYS_ = { 'Học viên huỷ': 'STUDENT', 'Tutor huỷ, admin chọn không dạy thay': 'TUTOR_NO_SUB', 'Tutor huỷ, không có tutor thay': 'TUTOR_NO_COVER', 'Tutor nghỉ, không có tutor thay': 'TUTOR_LOCKED', 'Admin huỷ': 'ADMIN' };
function usersById_() { var m = {}; table_('USERS').all().forEach(function (u) { m[u.user_id] = u; }); return m; }

function apiAdminPerson(token, id) {
  return apiWrap_('apiAdminPerson', function () {
    requireRole_(token, 'ADMIN');
    var u = userById_(String(id || ''));
    if (!u || (u.role !== 'TUTOR' && u.role !== 'STUDENT')) return { ok: false, reason: REASONS.NOT_FOUND };
    var now = getNow_(), byId = usersById_(), key = u.role === 'TUTOR' ? 'tutor_id' : 'student_id';
    var bks = table_('BOOKINGS').filter(function (b) { return b[key] === u.user_id; })
      .sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); });
    var upcoming = bks.filter(function (b) { return (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) && slotStart_(b.date, b.slot) > now; });
    var past = bks.filter(function (b) { return upcoming.indexOf(b) === -1; }).reverse().slice(0, 30);
    var out = { id: u.user_id, role: u.role, name: u.name, email: u.email, phone: phoneDisplay_(u.phone), status: u.status, level: u.level || '', note: u.note || '', lang: userLang_(u),
      sheetLink: rowLink_('USERS', u._row), upcoming: upcoming.map(function (b) { return adminBookingView_(b, byId); }),
      history: past.map(function (b) { return adminBookingView_(b, byId); }), notifications: adminNotifications_({ personId: u.user_id, limit: 30 }).items,
      sessions: listSessions_(u.user_id, '') };
    if (u.role === 'TUTOR') out.stats = tutorMonthStats_(u.user_id).months;
    else {
      var defs = pkgDefs_(), all = studentBookings_(u.user_id);
      out.packages = studentPackages_(u.user_id).map(function (sp) { return pkgSummary_(sp, defs[sp.package_code] || { code: sp.package_code, type: 'DAYS' }, all); });
    }
    return { ok: true, data: out };
  });
}

function apiAdminBooking(token, bookingId) {
  return apiWrap_('apiAdminBooking', function () {
    requireRole_(token, 'ADMIN');
    var b = table_('BOOKINGS').byId(String(bookingId || ''));
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    var v = adminBookingView_(b, usersById_());
    v.sheetLink = rowLink_('BOOKINGS', b._row);
    v.log = table_('ACTIVITY_LOG').filter(function (l) { return String(l.entity_id).split(',').indexOf(b.booking_id) !== -1; })
      .slice(-20).reverse().map(function (l) { return adminLogView_(l, false); });
    return { ok: true, data: v };
  });
}

/**
 * Slot admin đặt thay được cho học viên: từ bây giờ tới BOOKING_HORIZON_DAYS, slot chưa bắt đầu, có tutor mở và rảnh.
 * Bỏ qua hạn đặt; ngày học viên đã có buổi thì đánh dấu (vẫn bị chặn khi đặt vì 1 buổi/ngày).
 */
function adminSlotsFor_(studentId, fromKey, days) {
  var now = getNow_(), start = parseDateKey_(fromKey) || toMidnight_(now), n = Math.min(Number(days) || 14, 28);
  var horizon = addDays_(toMidnight_(now), cfg_('BOOKING_HORIZON_DAYS')), end = addDays_(start, n);
  // Chỉ giữ dòng trong khoảng ngày cần xem (12 tháng dữ liệu: quét cả bảng cho từng slot mất nhiều giây).
  var win = slotWindowData_(start, end);
  var tutors = activeTutors_(), avail = win.avail, bks = win.bookings, byId = usersById_(), out = [];
  for (var i = 0; i < n; i++) {
    var d = addDays_(start, i);
    if (d > horizon) break;
    var mine = win.bookings.some(function (b) { return b.student_id === studentId && bookingDeducts_(b) && sameDate_(b.date, d); });
    var slots = [];
    slotList_().forEach(function (slot) {
      if (!(now < slotStart_(d, slot))) return;
      var cands = buildTutorCandidates_(d, slot, tutors, avail, bks, []);
      if (cands.length) slots.push({ slot: slot, tutors: cands.map(function (c) { return { id: c.tutor_id, name: (byId[c.tutor_id] || {}).name || c.tutor_id, load: c.load }; }), auto: pickTutor_(cands) });
    });
    if (slots.length) out.push({ date: dateKey_(d), alreadyBooked: mine, slots: slots });
  }
  return out;
}

function apiAdminSlots(token, studentId, fromKey, days) {
  return apiWrap_('apiAdminSlots', function () {
    requireRole_(token, 'ADMIN');
    var s = userById_(String(studentId || ''));
    if (!s || s.role !== 'STUDENT') return { ok: false, reason: REASONS.NOT_FOUND };
    // Học viên không có gói còn dùng được hoặc đang khoá: báo ngay, không để admin chọn slot rồi mới bị từ chối.
    var defs = pkgDefs_(), usable = studentPackages_(s.user_id).some(function (sp) { return sp.status !== PKG_STATUS.EXPIRED && defs[sp.package_code]; });
    var blocker = studentAccountReason_(s) || (usable ? '' : REASONS.NO_PACKAGE);
    return { ok: true, data: adminSlotsFor_(s.user_id, fromKey, days), blocker: blocker || '', blockerMsg: blocker ? adminReasonPair_(blocker) : null };
  });
}

/** Đặt thay học viên. requests: [{ date, slot, tutorId? }]. Email xác nhận gửi học viên và tutor như khi học viên tự đặt. */
function apiAdminBook(token, studentId, requests, rid) {
  return apiWrap_('apiAdminBook', function () {
    var u = requireRole_(token, 'ADMIN');
    var s = userById_(String(studentId || ''));
    if (!s || s.role !== 'STUDENT') return { ok: false, reason: REASONS.NOT_FOUND };
    return idem_(u.user_id + '|adminbook', rid, function () {
      var res = bookSessionsFor_(s.user_id, Array.isArray(requests) ? requests : [], u.email, { override: true, requestId: rid });
      res.forEach(function (r) { if (!r.ok) { r.msg = adminReasonPair_(r.reason); r.message = r.msg.vi; } });
      return { ok: true, data: res };
    });
  });
}

function apiAdminCancel(token, bookingId, reason, rid) {
  return apiWrap_('apiAdminCancel', function () {
    var u = requireRole_(token, 'ADMIN');
    return idem_(u.user_id + '|admincancel', rid, function () { return adminCancelRun_(u, bookingId, reason); });
  });
}
function adminCancelRun_(u, bookingId, reason) {
    // Chunk 5M: mốc 15:00 hôm trước xét theo lúc admin bấm (trước khi chờ khoá), giống dropdown trong Sheets.
    var at = getNow_();
    // Vòng 2 N1: chữ mặc định trong ô lý do (tiếng Việt hoặc tiếng Anh, kể cả bản admin sửa trong CONTENT) là "không ghi lý do":
    // lưu mã cố định 'Admin huỷ' để trang hiện theo ngôn ngữ (ad.reason.ADMIN), thông báo tiếng Anh dùng câu tiếng Anh.
    var raw = String(reason || '').trim().substring(0, 200), low = raw.toLowerCase();
    var defs = ['Admin huỷ', 'Cancelled by admin', contentText_('ad.cancel_reason_default', null, 'vi'), contentText_('ad.cancel_reason_default', null, 'en')].map(function (x) { return String(x || '').trim().toLowerCase(); });
    var isDefault = !raw || defs.indexOf(low) !== -1, why = isDefault ? 'Admin huỷ' : raw;
    var cur = table_('BOOKINGS').byId(String(bookingId || ''));
    if (cur && /^CANCELLED/.test(cur.status)) {
      var f = adminFail_(REASONS.INVALID_INPUT, 'ad.cancel_already', { id: cur.booking_id, status: contentText_('ad.st.' + cur.status, null, 'vi') });
      f.msg.en = contentText_('ad.cancel_already', { id: cur.booking_id, status: contentText_('ad.st.' + cur.status, null, 'en') }, 'en');
      return f;
    }
    if (cur && !(slotStart_(cur.date, cur.slot) > getNow_())) return adminFail_(REASONS.INVALID_INPUT, 'ad.cancel_started');
    var r = adminCancelBooking_(String(bookingId || ''), u.email, why, at);
    if (r.ok) {
      // Huỷ đã xong: lỗi khi ghi thông báo (hệ thống bận) không được làm trang báo "chưa huỷ".
      try {
        var b = table_('BOOKINGS').byId(String(bookingId));
        notify_('ADMIN_CANCELLED', { actor: u.email, student_id: b ? b.student_id : '', tutor_id: b ? b.tutor_id : '', entity: 'BOOKING', entity_id: String(bookingId),
          link: b ? rowLink_('BOOKINGS', b._row) : '', message: u.name + ' huỷ buổi ' + bookingId + (b ? ' (' + fmtDayVi_(b.date) + ' ' + b.slot + ')' : '') + ': ' + why,
          message_en: u.name + ' cancelled lesson ' + bookingId + (b ? ' (' + fmtDayEn_(b.date) + ' ' + b.slot + ')' : '') + ': ' + (isDefault ? contentText_('ad.cancel_reason_default', null, 'en') : why) });
      } catch (e) { Logger.log('ADMIN_CANCELLED notify lỗi: ' + e.message); }
    }
    return r;
}

/** Thoát mọi thiết bị của một tutor hoặc học viên (mất điện thoại, nghỉ việc). Không dùng cho tài khoản admin. */
function apiAdminLogoutUser(token, id) {
  return apiWrap_('apiAdminLogoutUser', function () {
    var a = requireRole_(token, 'ADMIN'), u = userById_(String(id || ''));
    if (!u || (u.role !== 'TUTOR' && u.role !== 'STUDENT')) return { ok: false, reason: REASONS.NOT_FOUND };
    var r = logoutAll_(u, a.email);
    return { ok: true, data: { count: r.count } };
  });
}

// ── Nhật ký (chunk 5I): dòng xem trước, bấm mở đọc đủ ──

var LOG_PREVIEW_CHARS_ = 160;
function logTime_(l) { var t = l.time instanceof Date ? l.time : new Date(l.time); return isNaN(t.getTime()) ? null : t; }
/** Một dòng nhật ký cho trang admin. full: gửi đủ chi tiết (mở đọc), không thì cắt còn LOG_PREVIEW_CHARS_. */
function adminLogView_(l, full) {
  var t = logTime_(l), d = String(l.detail || '');
  return { row: l._row, ts: t ? t.getTime() : 0, time: t ? fmtDateTime_(t) : String(l.time || ''), actor: String(l.actor || ''), action: String(l.action || ''),
    entity: String(l.entity || ''), entityId: String(l.entity_id || ''), detail: full ? d.substring(0, 20000) : d.substring(0, LOG_PREVIEW_CHARS_), more: !full && d.length > LOG_PREVIEW_CHARS_,
    h: logHash_(l) };
}
/** Mã băm ngắn của chữ ký (trình duyệt gửi lại khi mở một dòng, để không mở nhầm dòng cùng giờ, cùng hành động). */
function logHash_(l) { var s = logSig_(l), h = 5381; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
/** Ai làm: hệ thống (SYSTEM, job, trống) hay người (có email; ADMIN là admin sửa trong Sheets khi Google không cho biết email). */
/** Chữ ký nội dung của một dòng nhật ký (phân biệt các dòng cùng một giây khi phân trang). */
function logSig_(l) { return [l.action, l.actor, l.entity, l.entity_id, String(l.detail || '')].join('|'); }
function logIsSystem_(l) { var a = String(l.actor || '').trim(); return !a || a === 'SYSTEM'; }

/**
 * Nhật ký mới nhất trước, chỉ LOG_KEEP_DAYS ngày gần nhất. Thứ tự cố định theo nội dung: thời gian giảm dần, cùng
 * thời gian thì theo chữ ký nội dung, dòng giống hệt nhau thì theo hàng.
 * q: { text, acts (mã hành động có nhãn khớp chữ tìm, trình duyệt gửi), sys (chữ tìm khớp nhãn "Hệ thống"), who ('people' | 'system' | ''),
 *      cursor (con trỏ "Xem thêm" lấy từ lần trước: { ts, sig, n }), limit }.
 * Soát 5I A9, vòng 2 N2: con trỏ là vị trí trong thứ tự trên (mốc giờ, chữ ký, số bản giống hệt đã thấy), không theo số hàng và
 * không giới hạn số dòng cùng một mốc giờ (STAGING giả lập giờ: mọi dòng cùng mốc), nên dời hàng, sắp xếp tab, lưu trữ giữa hai
 * lần bấm không làm trùng, sót hay lặp.
 */
function adminLogQuery_(q) {
  q = q || {};
  var text = String(q.text || '').trim().toLowerCase(), limit = Math.min(Number(q.limit) || 100, 300);
  var acts = {}; (Array.isArray(q.acts) ? q.acts : []).slice(0, 200).forEach(function (a) { acts[String(a)] = true; });
  var cur = q.cursor && typeof q.cursor === 'object' ? { ts: Number(q.cursor.ts) || 0, sig: String(q.cursor.sig || ''), n: Math.max(0, Number(q.cursor.n) || 0) } : null;
  var who = q.who === 'people' || q.who === 'system' ? q.who : '', since = addDays_(toMidnight_(getNow_()), -activityKeepDays_()).getTime();
  var list = [];
  table_('ACTIVITY_LOG').all().forEach(function (l) {
    var t = logTime_(l), ts = t ? t.getTime() : 0;
    if (t && ts < since) return;   // cũ hơn khoảng giữ: đang chờ job đêm chuyển sang file lưu trữ
    if (who && (who === 'system') !== logIsSystem_(l)) return;
    if (text && !acts[String(l.action)] && !(q.sys && logIsSystem_(l)) && !(q.admin && String(l.actor) === 'ADMIN') && [l.actor, l.action, l.entity, l.entity_id, l.detail].join(' ').toLowerCase().indexOf(text) === -1) return;
    list.push({ l: l, ts: ts, sig: logSig_(l) });
  });
  list.sort(function (a, b) { return b.ts - a.ts || (a.sig < b.sig ? -1 : a.sig > b.sig ? 1 : b.l._row - a.l._row); });
  var rest = list;
  if (cur && cur.ts) {
    var skip = cur.n;
    rest = list.filter(function (x) {
      if (x.ts !== cur.ts) return x.ts < cur.ts;
      if (x.sig !== cur.sig) return x.sig > cur.sig;
      if (skip > 0) { skip--; return false; }
      return true;
    });
  }
  var page = rest.slice(0, limit), items = page.map(function (x) { return adminLogView_(x.l, false); }), next = null;
  if (rest.length > limit && page.length) {
    var last = page[page.length - 1], n = page.filter(function (x) { return x.ts === last.ts && x.sig === last.sig; }).length;
    if (cur && cur.ts === last.ts && cur.sig === last.sig) n += cur.n;
    next = { ts: last.ts, sig: last.sig, n: n };
  }
  return { items: items, total: list.length, next: next, days: activityKeepDays_() };
}

function apiAdminLog(token, q) {
  return apiWrap_('apiAdminLog', function () {
    requireRole_(token, 'ADMIN');
    return { ok: true, data: adminLogQuery_(q) };
  });
}

/**
 * Một dòng nhật ký đầy đủ. row + ts + action + h: hàng, mốc giờ, hành động, mã băm nội dung đã thấy ở danh sách; tab bị sắp xếp
 * lại thì tìm theo mốc giờ, hành động và mã băm (soát vòng 2 N2: không mở nhầm dòng cùng giờ, cùng hành động).
 */
function apiAdminLogEntry(token, row, ts, action, h) {
  return apiWrap_('apiAdminLogEntry', function () {
    requireRole_(token, 'ADMIN');
    var rows = table_('ACTIVITY_LOG').all(), want = Number(ts) || 0, act = String(action || '');
    var hh = h ? String(h) : '';
    var match = function (l) { var t = logTime_(l); return (t ? t.getTime() : 0) === want && String(l.action) === act && (!hh || logHash_(l) === hh); };
    var l = rows.filter(function (x) { return x._row === Number(row); })[0];
    if (!l || !match(l)) l = rows.filter(match)[0];
    if (!l) return { ok: false, reason: REASONS.NOT_FOUND };
    var v = adminLogView_(l, true);
    v.link = rowLink_('ACTIVITY_LOG', l._row);
    return { ok: true, data: v };
  });
}
