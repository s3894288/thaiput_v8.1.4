/**
 * Jobs.gs · Job định kỳ (v8, plan mục 4.10)
 *
 * Mỗi job chạy trong withLock_ và tự bắt lỗi: lỗi thì gửi email admin rồi ném lại để trang Executions ghi Failed
 * (CLAUDE.md luật 8: không nuốt lỗi im lặng). Trigger được tạo ở Setup.gs (chunk 3).
 * Thời lượng mỗi lần chạy được ghi ACTIVITY_LOG khi quá 20 giây, để theo dõi hạn mức 90 phút/ngày của Gmail thường.
 */

/**
 * Nhịp tim (chunk 5G): job chạy xong (kể cả bỏ lượt vì bận) ghi giờ thật vào Script Property HB_<tên>. Trang
 * ?page=health đọc các mốc này (không đọc Sheets) và trả STALE khi job dừng chạy, để dịch vụ giám sát bên ngoài báo
 * admin cả khi chính Apps Script không gửi được email. Lỗi ghi không làm hỏng job.
 */
function heartbeat_(name) { try { props_().setProperty('HB_' + name, String(realNowMs_())); } catch (e) { } }

function runJob_(name, fn) {
  var t0 = Date.now();
  try {
    var out = withLock_(fn);
    heartbeat_(name);
    var ms = Date.now() - t0;
    if (ms > 20000) { try { withLock_(function () { logActivity_('SYSTEM', 'JOB_SLOW', 'JOB', name, ms + ' ms'); }); } catch (e) { } }
    return out;
  } catch (e) {
    // Khoá đang bận (ví dụ tutor lưu nhiều slot): bỏ lượt này, lượt sau chạy tiếp; không email admin.
    if (String((e && e.message) || e) === BUSY_MESSAGE_) { heartbeat_(name); Logger.log('Job ' + name + ' bỏ lượt vì hệ thống bận'); return null; }
    mailAdminError_('Job ' + name + ' lỗi', (e && e.stack) || String(e));
    throw e;
  }
}

/**
 * Chạy fn một lần mỗi ngày, khi giờ hiện tại >= hour. Đánh dấu trong Script Properties (khoá theo ngày) để
 * hourlyJob chạy lại trong cùng ngày không làm lại. Trả kết quả fn, hoặc null nếu chưa tới giờ hoặc đã làm.
 */
function onceAfterHour_(name, hour, now, fn) {
  if (Number(hour) < 0 || now.getHours() < Number(hour)) return null;   // giờ âm (ví dụ -1) = tắt việc này
  var key = 'DONE_' + name + '_' + dateKey_(now), props = props_();
  if (props.getProperty(key)) return null;
  var out = fn();
  props.setProperty(key, '1');
  return out;
}

/** Xoá khoá DONE_<việc>_<ngày> cũ hơn 7 ngày (khoá theo ngày tăng mãi nếu không dọn). Trả số khoá đã xoá. */
function cleanDoneProps_(now) {
  var p = props_(), all = p.getProperties(), limit = dateKey_(addDays_(toMidnight_(now), -7)), n = 0;
  Object.keys(all).forEach(function (k) { var m = k.match(/^DONE_.+_(\d{4}-\d{2}-\d{2})$/); if (m && m[1] < limit) { p.deleteProperty(k); n++; } });
  // Chunk 5M: dấu chống báo lặp (giá trị là mốc ms) giữ 60 ngày; dấu chờ xác nhận Vắng tutor giữ 1 ngày.
  var cut60 = now.getTime() - 60 * 86400000, cut1 = now.getTime() - 86400000;
  Object.keys(all).forEach(function (k) {
    var ms = Number(all[k]);
    if (/^(COMPBLK|TRIALLEFT|TRIALOVER|PKGOUT|PKGMISS)_/.test(k) && ms && ms < cut60) { p.deleteProperty(k); n++; }
    else if (/^TA_CONFIRM_/.test(k) && ms && ms < cut1) { p.deleteProperty(k); n++; }
  });
  return n;
}

/**
 * Nhắc buổi học buổi sáng (từ MORNING_REMINDER_HOUR): mỗi học viên và mỗi tutor 1 email liệt kê buổi hôm nay chưa bắt đầu.
 * Cột day_reminder_at đánh dấu từng buổi, nên chạy lại không gửi trùng. Ưu tiên low (tự bỏ khi gần hết hạn mức email).
 */
function morningRemindersInLock_(now) {
  var h = now.getHours(), from = Number(cfg_('MORNING_REMINDER_HOUR'));
  if (from < 0 || h < from || h >= from + 4) return 0;   // -1 = tắt nhắc buổi sáng
  var t = table_('BOOKINGS'), today = toMidnight_(now);
  var list = t.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && !b.day_reminder_at && sameDate_(b.date, today) && slotStart_(b.date, b.slot) > now; });
  if (!list.length) return 0;
  var byStudent = {}, byTutor = {};
  list.sort(function (a, b) { return a.slot < b.slot ? -1 : 1; }).forEach(function (b) {
    (byStudent[b.student_id] = byStudent[b.student_id] || []).push(b);
    (byTutor[b.tutor_id] = byTutor[b.tutor_id] || []).push(b);
  });
  var sent = 0;
  Object.keys(byStudent).forEach(function (sid) { if (mailMorningReminder_(userById_(sid), byStudent[sid], false)) sent++; });
  Object.keys(byTutor).forEach(function (tid) { if (mailMorningReminder_(userById_(tid), byTutor[tid], true)) sent++; });
  list.forEach(function (b) { t.update(b, { day_reminder_at: now }); });
  return sent;
}

/** Thứ Hai của tuần sau, tính từ now. */
function nextWeekMonday_(now) { return addDays_(mondayOf_(toMidnight_(now)), 7); }
/** Tutor ACTIVE chưa mở giờ nào (OPEN) trong tuần bắt đầu thứ Hai mon. */
function tutorsWithoutSlots_(mon) {
  var sun = addDays_(mon, 6), avail = table_('AVAILABILITY').all();
  return activeTutors_().filter(function (t) {
    return t.status === USER_STATUS.ACTIVE && !avail.some(function (a) { return a.tutor_id === t.user_id && a.status === AVAIL_STATUS.OPEN && a.date >= mon && a.date <= sun; });
  });
}

/**
 * Chunk 5J (câu 21 đổi 01/11): sau hạn TUTOR_DEADLINE_AT, báo admin danh sách tutor chưa mở giờ nào cho tuần sau. 1 lần mỗi tuần,
 * làm bù nếu lượt chạy đúng giờ bị lỡ (mốc theo tuần, không theo giờ).
 */
function tutorNoAvailabilityInLock_(now) {
  var mon = nextWeekMonday_(now), dl = tutorWeekDeadline_(mon);
  if (now < dl) return null;
  var key = 'DONE_NOAVAILW_' + dateKey_(mon), p = props_();
  if (p.getProperty(key)) return null;
  // Ngày nâng cấp từ 8.1.0: job Chủ nhật cũ đã báo cho tuần này (mốc DONE_NOAVAIL_<Chủ nhật>) thì không báo lại.
  if (p.getProperty('DONE_NOAVAIL_' + dateKey_(addDays_(mon, -1)))) { p.setProperty(key, '1'); return null; }
  var missing = tutorsWithoutSlots_(mon);
  p.setProperty(key, '1');
  if (!missing.length) return 0;
  notify_('TUTOR_NO_AVAILABILITY', { entity: 'USER', entity_id: missing.map(function (t) { return t.user_id; }).join(','), link: rowLink_('AVAILABILITY'),
    message: missing.length + ' tutor chưa mở lịch tuần ' + fmtDate_(mon) + ' sau hạn ' + fmtDowTimeVi_(dl) + ': ' + missing.map(function (t) { return t.name + ' (' + t.user_id + ')'; }).join(', '),
    message_en: missing.length + ' tutor(s) have not opened the week of ' + fmtDate_(mon) + ' after the ' + fmtDowTimeEn_(dl) + ' deadline: ' + missing.map(function (t) { return t.name + ' (' + t.user_id + ')'; }).join(', ') });
  return missing.length;
}

/**
 * Chunk 5J: nhắc tutor chưa mở giờ cho tuần sau theo TUTOR_REMIND_AT (thay 2 trigger sundayRemind cũ). Trong khoá chỉ chọn tutor
 * và ghi mốc theo tuần (DONE_TREMIND<i>_<thứ Hai>, giá trị là danh sách còn phải gửi). Gửi sau khi nhả khoá, tối đa 60 giây;
 * còn lại gửi ở lượt sau, tới hạn mở lịch. Lỡ nhiều mốc (job chậm) thì chỉ gửi theo mốc mới nhất, không gửi trùng.
 */
var TUTOR_REMIND_BUDGET_MS_ = 60000, TUTOR_REMIND_STALE_MS_ = 600000, TUTOR_REMIND_MAX_TRIES_ = 3;
function tutorRemindInLock_(now) {
  var sch = tutorSchedule_(), mon = nextWeekMonday_(now), dl = dowHourBefore_(sch.deadline, mon), p = props_();
  if (!(now < dl) || !sch.remind.length) return 0;
  var last = -1;
  sch.remind.forEach(function (r, i) { if (!(now < dowHourBefore_(r, mon))) last = i; });
  if (last < 0) return 0;
  var key = 'DONE_TREMIND' + last + '_' + dateKey_(mon), st = p.getProperty(key), pending, nowMs = Date.now();
  var still = {}; tutorsWithoutSlots_(mon).forEach(function (t) { still[t.user_id] = t; });
  if (st === null || st === undefined) pending = Object.keys(still);
  else {
    var v; try { v = JSON.parse(st); } catch (e) { v = []; }
    // Soát 5J (kỹ thuật): lượt khác đang gửi (dấu sending dưới 10 phút) thì bỏ qua, chống gửi trùng khi hai hourlyJob chồng nhau.
    // Dấu cũ hơn 10 phút (lượt trước bị Google dừng giữa chừng) thì gửi lại phần còn trong danh sách.
    if (v && !Array.isArray(v) && v.sending) { if (nowMs - Number(v.sending) < TUTOR_REMIND_STALE_MS_) return 0; pending = v.list || []; }
    else pending = Array.isArray(v) ? v : [];
  }
  pending = pending.filter(function (id) { return still[id]; });   // tutor đã mở giờ trong lúc chờ: thôi nhắc
  if (!pending.length) { p.setProperty(key, '[]'); return 0; }
  p.setProperty(key, JSON.stringify({ sending: nowMs, list: pending }));
  var list = pending.map(function (id) { return still[id]; }), tryKey = 'DONE_TREMTRY' + last + '_' + dateKey_(mon);
  afterLock_(function () {
    var t0 = Date.now(), left = [], tpl = emailTemplate_('TUTOR_REMIND'), tries = {};
    try { tries = JSON.parse(props_().getProperty(tryKey) || '{}') || {}; } catch (e) { tries = {}; }
    if (tpl && !tpl.active) { try { props_().setProperty(key, '[]'); } catch (e) { } return; }   // admin tắt mẫu: thôi nhắc, không thử lại mỗi giờ
    list.forEach(function (t) {
      if (Date.now() - t0 > TUTOR_REMIND_BUDGET_MS_) { left.push(t.user_id); return; }
      var ok = false;
      try { ok = mailTutorRemindAvailability_(t, mon, dl) !== false; } catch (e) { afterLockError_(e); }
      // Gửi lỗi (hết hạn mức, địa chỉ hỏng): thử lại ở lượt sau, tối đa TUTOR_REMIND_MAX_TRIES_ lần mỗi mốc.
      if (!ok) { tries[t.user_id] = (tries[t.user_id] || 0) + 1; if (tries[t.user_id] < TUTOR_REMIND_MAX_TRIES_) left.push(t.user_id); }
    });
    try { props_().setProperty(key, JSON.stringify(left)); if (Object.keys(tries).length) props_().setProperty(tryKey, JSON.stringify(tries)); } catch (e) { }
  });
  return list.length;
}

/**
 * Mỗi 15 phút: email nhắc buổi học trước REMINDER_BEFORE_MINUTES phút, mỗi buổi 1 lần (câu 41, B16).
 * Chunk 5F (soát kiến trúc F4): trong khoá chỉ chọn buổi và đánh dấu đã nhắc; đọc link Meet và gửi email sau khi nhả khoá.
 * Gửi hỏng cả hai email thì bỏ đánh dấu để lần sau gửi lại.
 */
function reminderJob(e) { requireOperator_(e);
  return runJob_('reminderJob', function () {
    var now = getNow_(), target = cfg_('REMINDER_BEFORE_MINUTES'), win = cfg_('REMINDER_WINDOW_MINUTES'), t = table_('BOOKINGS'), due = [];
    t.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && !b.reminder_sent_at; }).forEach(function (b) {
      var mins = (slotStart_(b.date, b.slot).getTime() - now.getTime()) / 60000;
      if (mins > target - win && mins <= target + win) {
        due.push({ b: b, s: userById_(b.student_id), t: userById_(b.tutor_id) });
        t.update(b, { reminder_sent_at: now });
      }
    });
    if (due.length) afterLock_(function () {
      var failed = [];
      due.forEach(function (d) {
        fillMeetLink_(d.b);
        var a = false, c = false;
        try { a = mailLessonReminder_(d.b, d.s, false, d.t); } catch (x) { afterLockError_(x); }
        try { c = mailLessonReminder_(d.b, d.t, true, d.s); } catch (x2) { afterLockError_(x2); }
        if (!a && !c) failed.push(d.b.booking_id);
      });
      if (failed.length) deferWrite_(function () {
        var tb = table_('BOOKINGS');
        failed.forEach(function (id) { var f = tb.byId(id); if (f) tb.update(f, { reminder_sent_at: '' }); });
      });
    });
    return due.length;
  });
}

/**
 * Đối soát mỗi giờ (chunk 5F): tìm dữ liệu sai luật mà code không bao giờ được tạo ra (sửa tay trên Sheets, lỗi chưa biết)
 * và buổi sắp diễn ra mà chưa có sự kiện Calendar. Báo admin, mỗi vấn đề 1 lần mỗi ngày. Không tự sửa dữ liệu.
 * Phải gọi trong withLock_. Trả số vấn đề mới báo.
 */
function reconcileInLock_(now) {
  var today = toMidnight_(now), found = 0;
  // Mỗi vấn đề 1 lần mỗi ngày: tra chính tab NOTIFICATIONS (soát R1 C2: bộ đệm sống tối đa 6 giờ, không dùng cho "mỗi ngày").
  var sent = {};
  table_('NOTIFICATIONS').filter(function (n) { return (n.event === 'DATA_INVARIANT' || n.event === 'CALENDAR_LATE') && n.time && toMidnight_(new Date(n.time)).getTime() === today.getTime(); })
    .forEach(function (n) { sent[n.event + '|' + n.entity_id] = true; });
  var once = function (event, entityId) { return !sent[event + '|' + entityId]; };
  var bks = table_('BOOKINGS').filter(function (b) { return b.date && b.date >= today; });
  var bySlot = {}, byDay = {}, maxPerDay = cfg_('MAX_BOOKINGS_PER_DAY');
  bks.forEach(function (b) {
    if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) {
      var k = b.tutor_id + '|' + dateKey_(b.date) + '|' + b.slot; (bySlot[k] = bySlot[k] || []).push(b.booking_id);
    }
    if (bookingDeducts_(b)) { var d = b.student_id + '|' + dateKey_(b.date); (byDay[d] = byDay[d] || []).push(b.booking_id); }
  });
  Object.keys(bySlot).forEach(function (k) {
    if (bySlot[k].length > 1 && once('DATA_INVARIANT', bySlot[k].join(','))) {
      found++;
      notify_('DATA_INVARIANT', { entity: 'BOOKING', entity_id: bySlot[k].join(','), link: rowLink_('BOOKINGS'),
        message: 'Một tutor có ' + bySlot[k].length + ' học viên cùng giờ (' + k.replace(/\|/g, ' ') + '): ' + bySlot[k].join(', ') + '. Đổi tutor hoặc huỷ bớt một buổi.',
        message_en: 'One tutor has ' + bySlot[k].length + ' students at the same time (' + k.replace(/\|/g, ' ') + '): ' + bySlot[k].join(', ') + '. Reassign or cancel one lesson.' });
    }
  });
  Object.keys(byDay).forEach(function (k) {
    if (byDay[k].length > maxPerDay && once('DATA_INVARIANT', byDay[k].join(','))) {
      found++;
      notify_('DATA_INVARIANT', { entity: 'BOOKING', entity_id: byDay[k].join(','), link: rowLink_('BOOKINGS'),
        message: 'Học viên ' + k.split('|')[0] + ' có ' + byDay[k].length + ' buổi ngày ' + k.split('|')[1] + ' (tối đa ' + maxPerDay + '): ' + byDay[k].join(', '),
        message_en: 'Student ' + k.split('|')[0] + ' has ' + byDay[k].length + ' lessons on ' + k.split('|')[1] + ' (max ' + maxPerDay + '): ' + byDay[k].join(', ') });
    }
  });
  if (cfg_('MEET_MODE') !== 'TUTOR_ROOM') {
    // Buổi sắp diễn ra chưa có sự kiện. Bỏ qua buổi admin đã dán link Meet tay. Gộp MỘT email cho cả lượt (soát R2 T6),
    // câu chữ theo trạng thái: đang chờ hàng đợi (tự thử lại) hay FAILED (cần gửi link tay).
    var lead = Number(cfg_('CALENDAR_MIN_LEAD_HOURS')) * 3600000, late = [];
    bks.forEach(function (b) {
      if (b.status !== BOOKING_STATUS.CONFIRMED || b.event_id || b.meet_link) return;
      var left = slotStart_(b.date, b.slot).getTime() - now.getTime();
      if (left > 0 && left <= lead && once('CALENDAR_LATE', b.booking_id)) late.push(b);
    });
    if (late.length) {
      calendarHint_(now.getTime());   // nhắc hàng đợi chạy ngay lần tới
      found += late.length;
      var line = function (b) { return b.booking_id + ' (' + fmtDayVi_(b.date) + ' ' + b.slot + (calState_(b) === CAL_STATE.FAILED ? ', đã lỗi: gửi link Meet tay' : ', hệ thống đang thử lại') + ')'; };
      var lineEn = function (b) { return b.booking_id + ' (' + fmtDayEn_(b.date) + ' ' + b.slot + (calState_(b) === CAL_STATE.FAILED ? ', failed: send the Meet link by hand' : ', the system is retrying') + ')'; };
      late.forEach(function (b) {
        notify_('CALENDAR_LATE', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
          message: 'Chưa có sự kiện Calendar: ' + line(b), message_en: 'No Calendar event yet: ' + lineEn(b) }, late.length > 1 && b !== late[0] ? function () { return false; } : (late.length > 1 ? function () {
            return mailAdminNotice_('WARNING', 'CALENDAR_LATE', { message: late.length + ' buổi sắp diễn ra chưa có sự kiện Calendar: ' + late.map(line).join('; ') +
              '. Nếu 30 phút nữa vẫn chưa có: bấm menu "Calendar: tạo sự kiện đang chờ ngay" hoặc gửi link Meet tay.',
              message_en: late.length + ' upcoming lessons have no Calendar event: ' + late.map(lineEn).join('; ') + '. If still missing in 30 minutes: use the menu "Calendar: tạo sự kiện đang chờ ngay" or send the Meet link by hand.', link: rowLink_('BOOKINGS') });
          } : undefined));
      });
    }
  }
  return found;
}

/** Mỗi giờ: tự từ chối yêu cầu huỷ quá hạn duyệt (câu 20), tự hoàn thành buổi quá 24 giờ (câu 29). */
function hourlyJob(e) { requireOperator_(e);
  var logQueued = [];
  var res = runJob_('hourlyJob', function () {
    // Chunk 5G (soát R3 N5): dọn lần bỏ dòng dở TRƯỚC mọi bước khác, để đối soát không thấy dòng trùng ở đuôi.
    try { var pp = props_().getProperties(); Object.keys(pp).forEach(function (k) { var tn = k.replace(/^PURGE_OPEN_/, ''); if (k !== tn && SCHEMA[tn]) purgeRecover_(tn); }); } catch (pe) { Logger.log('Dọn lần bỏ dòng dở lỗi: ' + pe.message); }
    logQueued = drainLogQueue_(true);   // chunk 5I: nhật ký từng gặp khoá bận; xoá hàng chờ sau khi ra khỏi khoá
    // Làm đầu tiên: bước sau có lỗi thì phiên của tài khoản DISABLED vẫn bị huỷ.
    var revoked = revokeDisabledSessionsInLock_(getNow_());
    var now = getNow_(), limitMs = cfg_('TUTOR_CANCEL_DECIDE_BEFORE_HOURS') * 3600000, rejected = 0;
    table_('AVAILABILITY').filter(function (a) { return a.status === AVAIL_STATUS.CANCEL_PENDING; }).forEach(function (a) {
      if (slotStart_(a.date, a.slot).getTime() - now.getTime() <= limitMs) {
        decideTutorCancelInLock_(a.avail_id, ADMIN_DECISION.REJECT, 'SYSTEM');
        notify_('TUTOR_CANCEL_AUTO_REJECTED', { tutor_id: a.tutor_id, entity: 'AVAILABILITY', entity_id: a.avail_id, link: rowLink_('AVAILABILITY', a._row),
          message: 'Tự từ chối yêu cầu huỷ của ' + a.tutor_id + ' (' + fmtDayVi_(a.date) + ' ' + a.slot + ') vì quá hạn duyệt',
          message_en: 'Auto rejected the cancel request of ' + a.tutor_id + ' (' + fmtDayEn_(a.date) + ' ' + a.slot + ') because the decision deadline passed' });
        rejected++;
      }
    });
    // Bảo trì: tutor không xác nhận được kết quả, nên tạm dừng tự Hoàn thành (soát R1 L3); hết bảo trì thì chạy tiếp.
    // Chunk 5J (câu 29 đổi 01/11): không tự Hoàn thành. Báo đỏ khi quá hạn xác nhận; quá hạn tiếp thì Không hoàn thành.
    // Bảo trì: tutor không xác nhận được, nên tạm dừng bước chuyển Không hoàn thành (vẫn báo).
    var completed = resultOverdueInLock_(now, maintMode_() === 'OFF');
    // Chunk 5M: tính lại gói còn chạy (khoá ngày bắt đầu khi buổi kỹ thuật quá TECH_DECIDE_HOURS, tự lành ô bị sửa ngoài hệ thống).
    var heal = null; try { heal = pkgHealAllInLock_(now); } catch (he) { Logger.log('Tính lại gói lỗi: ' + he.message); mailAdminError_('Tính lại gói (hourlyJob)', (he && he.stack) || String(he)); }
    // Việc theo giờ trong ngày (chunk 5B), mỗi việc tối đa 1 lần mỗi ngày hoặc mỗi tuần:
    var morning = morningRemindersInLock_(now);
    var noAvail = tutorNoAvailabilityInLock_(now);
    var tutorRemind = 0; try { tutorRemind = tutorRemindInLock_(now); } catch (te) { Logger.log('Nhắc tutor lỗi: ' + te.message); }
    var digest = onceAfterHour_('DIGEST', cfg_('DIGEST_HOUR'), now, function () { return sendDailyDigestInLock_(now); });
    // Dọn tab AUTH 1 lần mỗi ngày từ 03:00 (chunk 5D).
    var authPurged = onceAfterHour_('AUTHPURGE', 3, now, function () { return purgeAuthInLock_(now); });
    // Chunk 5F: tổng kết lô Calendar đêm qua (sau 00:00), đối soát dữ liệu, chép số đo, dọn METRICS cũ.
    var night = 0; try { night = calendarNightSummaryInLock_(now); } catch (ne) { Logger.log('Tổng kết Calendar lỗi: ' + ne.message); }
    // 5K: METRICS không xoá 90 ngày nữa, chuyển sang file lưu trữ cùng nhật ký (Archive.gs, LOG_KEEP_DAYS).
    var issues = 0; try { issues = reconcileInLock_(now); } catch (re) { Logger.log('Đối soát lỗi: ' + re.message); }
    var metrics = 0; try { metrics = flushMetricsInLock_(); } catch (me) { Logger.log('Ghi số đo lỗi: ' + me.message); }
    // Chunk 5G: dọn khoá DONE_ cũ hơn 7 ngày (soát R1 L8, R2 T23); dọn lần bỏ dòng dở (purgeRows_ bị cắt).
    onceAfterHour_('PROPCLEAN', 3, now, function () { return cleanDoneProps_(now); });

    return { rejected: rejected, completed: completed, packages: heal, morning: morning, noAvailability: noAvail, tutorRemind: tutorRemind, digest: digest, authPurged: authPurged, revoked: revoked, issues: issues, metrics: metrics, calendarNight: night };
  });
  if (res) forgetLogQueue_(logQueued);   // dữ liệu đã ghi khi ra khỏi khoá: mới xoá hàng chờ nhật ký
  if (res && res.revoked) { forgetSessions_(res.revoked.hashes, res.revoked.users); res.revoked = res.revoked.hashes.length; }
  // Chunk 5G: lưu trữ hằng tháng, 1 lần mỗi ngày từ ARCHIVE_HOUR, mỗi tab một khoá ngắn riêng (ngoài khoá của hourlyJob).
  if (res) { try { res.archive = archiveIfDue_(getNow_()); } catch (ae) { mailAdminError_('Lưu trữ lỗi', (ae && ae.stack) || String(ae)); } }
  return res;
}

/** 06:00 hằng ngày: chuyển trạng thái gói, email sắp hết hạn (câu 3, 6, 41). */
function dailyJob(e) { requireOperator_(e);
  return runJob_('dailyJob', function () {
    var today = toMidnight_(getNow_()), defs = pkgDefs_(), t = table_('STUDENT_PACKAGES'), bks = table_('BOOKINGS').all();
    var autoDays = cfg_('INACTIVE_AUTO_ACTIVATE_DAYS'), notice = cfg_('EXPIRY_NOTICE_DAYS'), changed = 0, mailed = 0;
    // Chunk 5M: học viên đang tạm khoá thì gói không đổi trạng thái (không hết hạn khi đang khoá).
    var suspended = {}; table_('USERS').all().forEach(function (u) { if (u.status === USER_STATUS.SUSPENDED) suspended[u.user_id] = true; });
    t.all().forEach(function (sp) {
      var def = defs[sp.package_code];
      if (!def) return;
      var patch = pkgDailyTransition_(sp, def, bks.filter(function (b) { return b.student_id === sp.student_id; }), today, autoDays, { suspended: !!suspended[sp.student_id] });
      if (patch) { t.update(sp, patch); changed++; logActivity_('SYSTEM', 'PACKAGE_' + patch.status, 'STUDENT_PACKAGE', sp.sp_id, ''); }
      if (sp.status === PKG_STATUS.ACTIVE && def.type !== 'SESSIONS' && sp.end_date && !sp.expiry_notice_at && diffDays_(today, sp.end_date) === notice) {
        var hasNext = t.filter(function (o) { return o.student_id === sp.student_id && o.status === PKG_STATUS.QUEUED; }).length > 0;
        if (!hasNext && mailExpirySoon_(userById_(sp.student_id), sp, def)) { t.update(sp, { expiry_notice_at: getNow_() }); mailed++; }
      }
    });
    return { changed: changed, mailed: mailed };
  });
}

/**
 * Bỏ từ 5J: nhắc tutor chạy trong hourlyJob (tutorRemindInLock_). Giữ hàm rỗng để trigger Chủ nhật của bản cũ (chưa chạy lại menu 3)
 * không báo lỗi "không tìm thấy hàm"; menu 3 xoá trigger này vì tên vẫn nằm trong TRIGGER_HANDLERS_.
 */
function sundayRemind(e) { requireOperator_(e); return 0; }
