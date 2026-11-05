/**
 * CalendarSync.gs · Liên kết Google Calendar và Meet (v8, plan mục 4.11, câu 41)
 *
 * Mỗi booking CONFIRMED = một sự kiện trên lịch chung LESSON_CALENDAR_ID, khách mời là học viên và tutor.
 * Quyền riêng tư (câu 35): ẩn danh sách khách mời để tutor không thấy email học viên và ngược lại;
 * tiêu đề và mô tả không có email hay số điện thoại.
 * Chạy được trên cả Gmail thường và Workspace. MEET_MODE = TUTOR_ROOM thì dùng phòng cố định của tutor.
 */

function lessonCalendarId_() {
  var id = cfg_('LESSON_CALENDAR_ID');
  if (!id) throw new Error('Chưa có LESSON_CALENDAR_ID trong CONFIG. Chạy menu thaiput > Cài đặt lần đầu.');
  return id;
}

function isoLocal_(d) {
  return dateKey_(d) + 'T' + pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()) + ':00+07:00';
}

function lessonEventResource_(booking, student, tutor) {
  var start = slotStart_(booking.date, booking.slot), end = slotEnd_(booking.date, booking.slot);
  var desc = [
    'Buổi luyện nói 1:1 thaiput (25 phút).',
    'Huỷ buổi: trước 15:00 hôm trước, trong cổng học viên: ' + portalUrl_('student'),
    cfg_('ADMIN_ZALO_URL') ? 'Cần hỗ trợ: ' + cfg_('ADMIN_ZALO_URL') : ''
  ].filter(function (x) { return x; }).join('\n');
  var res = {
    summary: cfg_('SCHOOL_NAME') + ' · ' + student.name + ' × ' + tutor.name,
    description: desc,
    start: { dateTime: isoLocal_(start), timeZone: APP.TIMEZONE },
    end: { dateTime: isoLocal_(end), timeZone: APP.TIMEZONE },
    attendees: realGuests_([{ email: student.email }, { email: tutor.email }]),
    guestsCanSeeOtherGuests: false,
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] }
  };
  if (tutor.color_id) res.colorId = String(tutor.color_id);
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM') {
    res.location = tutor.meet_room || '';
  } else {
    res.conferenceData = { createRequest: { requestId: 'thaiput-' + booking.booking_id + '-' + Utilities.getUuid().substring(0, 8), conferenceSolutionKey: { type: 'hangoutsMeet' } } };
  }
  return res;
}

function meetLinkOf_(ev, tutor) {
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM') return tutor.meet_room || '';
  if (ev.hangoutLink) return ev.hangoutLink;
  var eps = (ev.conferenceData && ev.conferenceData.entryPoints) || [];
  for (var i = 0; i < eps.length; i++) if (eps[i].entryPointType === 'video') return eps[i].uri;
  return '';
}

/** Tạo sự kiện. Trả { eventId, meetLink }. */
var MEET_RETRY_USED_ = false;
/** Khách admin cho sự kiện buổi học (ADMIN_JOIN_MEET), bỏ trùng với học viên và tutor. */
function adminGuests_(student, tutor) {
  if (!cfg_('ADMIN_JOIN_MEET')) return [];
  if (isTestAddress_(student.email)) return [];   // thử tải: không làm đầy lịch của admin (soát R2 T18)
  // Tài khoản chạy hệ thống (admin@ khi chỉ có 1 tài khoản Workspace) là chủ sự kiện, đã vào được phòng: không thêm lại.
  var owner = ''; try { owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase(); } catch (e) { }
  var skip = [String(student.email).toLowerCase(), String(tutor.email).toLowerCase(), owner], out = [];
  // ADMIN_EMAIL cộng các tài khoản role ADMIN đang hoạt động (ví dụ co-founder thứ hai dùng Gmail riêng).
  // Thêm làm khách với sendUpdates none nên không ai nhận thư mời; email hệ thống vẫn chỉ tới ADMIN_EMAIL (luật 29).
  adminEmails_().concat(table_('USERS').filter(function (u) { return u.role === 'ADMIN' && u.status === USER_STATUS.ACTIVE; })
    .map(function (u) { return String(u.email || '').trim().toLowerCase(); }))
    .forEach(function (e) { if (e && skip.indexOf(e) === -1 && out.indexOf(e) === -1) out.push(e); });
  return out.map(function (e) { return { email: e, optional: true, responseStatus: 'accepted' }; });
}

/**
 * Mã sự kiện cố định cho mỗi booking (chunk 5F). Tạo lại sau một lần chạy bị dừng giữa chừng thì Google báo "đã tồn tại"
 * thay vì sinh sự kiện thứ hai, và huỷ booking chưa kịp ghi mã sự kiện vẫn gỡ được đúng sự kiện. Chữ 0 đến 9, a đến v
 * (yêu cầu của Calendar API). Có thời điểm tạo booking trong chuỗi băm để mã không trùng sự kiện cũ sau khi xoá dữ liệu test.
 */
function lessonEventId_(b) {
  // Theo giây (soát R1 L7): Sheets có thể làm tròn mili giây khi lưu, bản trong bộ nhớ và bản đọc lại phải ra cùng một mã.
  var created = b.created_at instanceof Date ? Math.floor(b.created_at.getTime() / 1000) : String(b.created_at || '');
  var db = ''; try { db = getDbId_(); } catch (e) { }
  return 'tp' + sha256Hex_(db + '|' + b.booking_id + '|' + created).substring(0, 30);
}
function isGoneError_(e) { return /not found|404|410|deleted|Không thấy/i.test(String((e && e.message) || e)); }
function isDuplicateError_(e) { return /already exists|duplicate|409|đã tồn tại/i.test(String((e && e.message) || e)); }

function createLessonEvent_(booking, student, tutor) {
  // Ghi các dòng đang gom (dòng BOOKINGS vừa tạo) trước khi gửi thư mời: nếu lần chạy bị Google dừng đột ngột,
  // không có thư mời nào trỏ tới buổi học không tồn tại trong Sheets.
  flushDb_();
  var calId = lessonCalendarId_(), res = lessonEventResource_(booking, student, tutor), fixedId = lessonEventId_(booking), ev = null;
  res.id = fixedId;
  try { ev = Calendar.Events.insert(res, calId, { conferenceDataVersion: 1, sendUpdates: 'all' }); }
  catch (e) {
    if (!isDuplicateError_(e)) throw e;
    // Lần trước đã tạo nhưng chưa kịp ghi mã vào Sheets: dùng lại sự kiện đó, không tạo thêm, không gửi thư mời lần hai.
    try { ev = Calendar.Events.get(calId, fixedId); } catch (g) { ev = null; }
    if (!ev || ev.status === 'cancelled') { delete res.id; ev = Calendar.Events.insert(res, calId, { conferenceDataVersion: 1, sendUpdates: 'all' }); }
    else {
      // Sự kiện cũ có thể mời tutor trước khi đổi (soát R1 C1): khách mời lệch thì vá theo học viên, tutor hiện tại.
      var emails = (ev.attendees || []).map(function (a) { return String(a.email).toLowerCase(); });
      if (emails.indexOf(String(tutor.email).toLowerCase()) === -1 || emails.indexOf(String(student.email).toLowerCase()) === -1) {
        var fixed = reassignLessonEvent_({ booking_id: booking.booking_id, event_id: ev.id, meet_link: '' }, student, tutor);
        try { ev = Calendar.Events.get(calId, ev.id); } catch (g2) { }
        if (fixed && fixed.meetLink && !meetLinkOf_(ev, tutor)) ev.hangoutLink = fixed.meetLink;
      }
    }
  }
  var link = meetLinkOf_(ev, tutor);
  // Admin luôn vào được phòng Meet (chunk 5B): thêm ADMIN_EMAIL làm khách, không gửi thư mời (sendUpdates none).
  var have = (ev.attendees || []).map(function (a) { return String(a.email).toLowerCase(); });
  var admins = adminGuests_(student, tutor).filter(function (a) { return have.indexOf(String(a.email).toLowerCase()) === -1; });
  if (admins.length) {
    try { ev = Calendar.Events.patch({ attendees: (ev.attendees || [{ email: student.email }, { email: tutor.email }]).concat(admins) }, calId, ev.id, { sendUpdates: 'none' }) || ev; }
    catch (e) { logActivity_('SYSTEM', 'CALENDAR_ADMIN_GUEST_FAILED', 'BOOKING', booking.booking_id, e.message); }
  }
  // Google đôi khi tạo phòng Meet chậm (trạng thái pending): đợi 1 giây đọc lại, tối đa 1 lần mỗi lần chạy để không giữ khoá lâu.
  // Còn thiếu thì reminderJob tự điền trước khi gửi email nhắc (fillMeetLink_).
  if (!link && cfg_('MEET_MODE') !== 'TUTOR_ROOM' && !MEET_RETRY_USED_) {
    MEET_RETRY_USED_ = true;
    Utilities.sleep(1000);
    try { ev = Calendar.Events.get(calId, ev.id); link = meetLinkOf_(ev, tutor); } catch (e) { }
  }
  return { eventId: ev.id, meetLink: link };
}

/**
 * Gỡ sự kiện của một booking (khách mời nhận thư huỷ). Dùng event_id, chưa có thì mã cố định. Trả 'removed' hoặc 'gone'
 * (không có hoặc đã gỡ: coi như xong). Lỗi thật thì ném để hàng đợi thử lại. Không gọi trong khoá (chậm).
 */
function removeLessonEvent_(b) {
  var calId = lessonCalendarId_(), id = b.event_id || lessonEventId_(b);
  // Gỡ khách admin trước (không gửi thư), để thư huỷ chỉ tới học viên và tutor.
  stripAdminGuests_(calId, id);
  try { Calendar.Events.remove(calId, id, { sendUpdates: 'all' }); return 'removed'; }
  catch (e) { if (isGoneError_(e)) return 'gone'; throw e; }
}

/** Đổi tutor: thay khách mời và tiêu đề, giữ nguyên giờ và link Meet (chế độ AUTO). */
function reassignLessonEvent_(booking, student, newTutor) {
  if (!booking.event_id) return { meetLink: booking.meet_link };
  var calId = lessonCalendarId_(), admins = adminGuests_(student, newTutor);
  // Khách admin nhận cả thư "đã cập nhật" nếu còn trong danh sách khi gửi thư cho học viên và tutor:
  // gỡ admin không gửi thư, đổi tutor có gửi thư, rồi thêm lại admin không gửi thư (luật 29: admin chỉ nhận email hệ thống).
  stripAdminGuests_(calId, booking.event_id);
  var patch = { summary: cfg_('SCHOOL_NAME') + ' · ' + student.name + ' × ' + newTutor.name, attendees: realGuests_([{ email: student.email }, { email: newTutor.email }]) };
  if (newTutor.color_id) patch.colorId = String(newTutor.color_id);
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM') patch.location = newTutor.meet_room || '';
  Calendar.Events.patch(patch, calId, booking.event_id, { sendUpdates: 'all' });
  if (admins.length) {
    try { Calendar.Events.patch({ attendees: patch.attendees.concat(admins) }, calId, booking.event_id, { sendUpdates: 'none' }); }
    catch (e) { logActivity_('SYSTEM', 'CALENDAR_ADMIN_GUEST_FAILED', 'BOOKING', booking.booking_id, e.message); }
  }
  return { meetLink: cfg_('MEET_MODE') === 'TUTOR_ROOM' ? (newTutor.meet_room || '') : booking.meet_link };
}

/**
 * Gỡ khách admin khỏi sự kiện, không gửi thư. Không phụ thuộc cài đặt hiện tại: gỡ mọi email admin từng có
 * (ADMIN_EMAIL, USERS role ADMIN ở mọi trạng thái, tài khoản chạy hệ thống), để tắt ADMIN_JOIN_MEET hay khoá một admin
 * sau khi buổi đã tạo vẫn không làm admin nhận thư huỷ. Lỗi thì bỏ qua (tệ nhất admin nhận thêm 1 thư Calendar).
 */
function allAdminEmails_() {
  var out = adminEmails_().slice();
  try { table_('USERS').filter(function (u) { return u.role === 'ADMIN'; }).forEach(function (u) { var e = String(u.email || '').trim().toLowerCase(); if (e) out.push(e); }); } catch (e) { }
  try { out.push(String(Session.getEffectiveUser().getEmail() || '').toLowerCase()); } catch (e) { }
  return out.filter(function (e) { return e; });
}
function stripAdminGuests_(calId, eventId) {
  try {
    var skip = allAdminEmails_();
    var ev = Calendar.Events.get(calId, eventId), cur = (ev && ev.attendees) || [];
    var keep = cur.filter(function (a) { return skip.indexOf(String(a.email).toLowerCase()) === -1; });
    if (keep.length !== cur.length) Calendar.Events.patch({ attendees: keep.map(function (a) { return { email: a.email }; }) }, calId, eventId, { sendUpdates: 'none' });
  } catch (e) { }
}

/** Huỷ sự kiện ngay (dùng khi chuyển tài khoản). Lỗi Calendar không chặn việc đang làm; ghi log và báo admin. */
function cancelLessonEvent_(booking) {
  if (!booking.event_id) return false;
  try { return removeLessonEvent_(booking) === 'removed'; }
  catch (e) {
    logActivity_('SYSTEM', 'CALENDAR_REMOVE_FAILED', 'BOOKING', booking.booking_id, e.message);
    mailAdminError_('Không xoá được sự kiện Calendar ' + booking.booking_id, e.message + '\nXoá tay sự kiện trên lịch "Thaiput · Lịch học".');
    return false;
  }
}

/**
 * Buổi có sự kiện nhưng chưa có link Meet (Google tạo chậm): đọc lại sự kiện để lấy link.
 * Gọi được cả trong khoá (ghi ngay) và sau khoá (chunk 5F: gom vào lần ghi cuối).
 */
function fillMeetLink_(b) {
  if (b.meet_link || !b.event_id || cfg_('MEET_MODE') === 'TUTOR_ROOM') return b.meet_link;
  try {
    var link = meetLinkOf_(Calendar.Events.get(lessonCalendarId_(), b.event_id), {});
    if (link) {
      b.meet_link = link;
      var id = b.booking_id;
      var write = function () { var t = table_('BOOKINGS'), f = t.byId(id); if (f && !f.meet_link) t.update(f, { meet_link: link }); };
      if (DB_LOCK_DEPTH_) write(); else deferWrite_(write);
    }
    return link;
  } catch (e) { return ''; }
}

// ── Chuyển sang tài khoản khác (Gmail thường sang Workspace), chunk 5 ──
// Lịch học thuộc tài khoản đang chạy script. Khi đổi tài khoản, các buổi sắp tới phải có sự kiện trên lịch mới.
// Bước A chạy ở hệ thống cũ: gỡ sự kiện (học viên, tutor nhận thư huỷ của Calendar), buổi học vẫn giữ nguyên.
// Bước B chạy ở hệ thống mới: tạo lại sự kiện và link Meet mới, học viên, tutor nhận thư mời mới.

function futureConfirmedBookings_() {
  var now = getNow_();
  return table_('BOOKINGS').filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now; });
}

function detachFutureEvents_(actor) {
  return withLock_(function () {
    var n = 0;
    futureConfirmedBookings_().forEach(function (b) {
      if (!b.event_id) {
        // Có thể đã tạo theo mã cố định mà chưa kịp ghi mã (soát R1 L2): thử gỡ, không có thì thôi.
        if (Number(b.cal_attempts || 0) > 0) { try { if (removeLessonEvent_(b) === 'removed') n++; } catch (e) { } }
        table_('BOOKINGS').update(b, { cal_state: CAL_STATE.DETACHED }); return;
      }
      if (cancelLessonEvent_(b)) n++;
      // DETACHED: hàng đợi Calendar của hệ thống cũ không tạo lại sự kiện cho buổi này (chunk 5F).
      table_('BOOKINGS').update(b, { event_id: '', meet_link: '', cal_state: CAL_STATE.DETACHED });
    });
    logActivity_(actor, 'EVENTS_DETACHED', 'BOOKINGS', '', JSON.stringify({ events: n }));
    return { removed: n };
  });
}

function recreateFutureEvents_(actor) {
  return withLock_(function () {
    var n = 0, failed = [];
    futureConfirmedBookings_().forEach(function (b) {
      if (b.event_id) return; // đã có sự kiện trên lịch hiện tại
      try {
        var ev = createLessonEvent_(b, userById_(b.student_id), userById_(b.tutor_id));
        table_('BOOKINGS').update(b, { event_id: ev.eventId, meet_link: ev.meetLink, cal_state: CAL_STATE.CREATED, cal_attempts: 0 });
        n++;
      } catch (e) { failed.push(b.booking_id + ': ' + e.message); }
    });
    logActivity_(actor, 'EVENTS_RECREATED', 'BOOKINGS', '', JSON.stringify({ events: n }));
    return { created: n, failed: failed };
  });
}
