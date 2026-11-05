/**
 * Reset.gs · Xoá dữ liệu test trước khi chạy thật (chunk 5E, theo yêu cầu anh Chris 15/10)
 *
 * Chỉ admin (chủ file, ADMIN_EMAIL, hoặc USERS role ADMIN đang hoạt động) chạy được, qua menu, 2 bước xác nhận:
 *   bước 1 chọn mức xoá (1 hoặc 2), bước 2 gõ đúng câu xác nhận có tên môi trường.
 * Chặn cứng khi CONFIG ALLOW_DATA_RESET khác TRUE (cài đặt STAGING tự ghi TRUE, switchToProduction tự ghi FALSE).
 * Trên PRODUCTION còn phải là chủ file.
 * Luôn sao lưu file DB trước; sao lưu hỏng thì không xoá gì.
 *
 * Giữ nguyên: CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES (cài đặt), tài khoản admin.
 * Mức 1: xoá học viên và mọi dữ liệu phát sinh, GIỮ tài khoản tutor.
 * Mức 2: xoá cả tài khoản tutor (chỉ còn admin).
 * Đây là ngoại lệ duy nhất của CLAUDE.md luật 10 (không xoá dòng BOOKINGS, PAYMENTS, ACTIVITY_LOG).
 */

var RESET_DATA_TABS_ = ['BOOKINGS', 'AVAILABILITY', 'STUDENT_PACKAGES', 'REGISTRATIONS', 'PAYMENTS', 'AUTH', 'ACTIVITY_LOG', 'MAIL_LOG', 'NOTIFICATIONS'];
var RESET_MODES_ = { '1': 'KEEP_TUTORS', '2': 'ADMINS_ONLY' };

/** Câu xác nhận có cả môi trường và mức xoá, để bước 2 nhắc lại đúng điều sắp xảy ra. */
function resetPhrase_(mode) { return 'XOA DU LIEU ' + getEnv_() + ' MUC ' + (mode === 'ADMINS_ONLY' ? '2' : '1'); }

/** Số dòng sẽ bị xoá ở mỗi tab, để admin đọc trước khi xác nhận. */
function resetPreview_(mode) {
  var out = {};
  RESET_DATA_TABS_.forEach(function (t) { out[t] = table_(t).all().length; });
  out.USERS = table_('USERS').filter(function (u) { return u.role === 'STUDENT' || (mode === 'ADMINS_ONLY' && u.role === 'TUTOR'); }).length;
  return out;
}

/**
 * Xoá dữ liệu test. mode: KEEP_TUTORS hoặc ADMINS_ONLY. phrase phải đúng resetPhrase_() (bước xác nhận thứ 2).
 * Trả { ok, backup, removed, eventsRemoved } hoặc { ok: false, error }.
 */
function resetTestData_(mode, phrase, actor) {
  if (!cfg_('ALLOW_DATA_RESET')) return { ok: false, error: 'CONFIG ALLOW_DATA_RESET đang tắt. Hệ thống đang chạy thật thì không được xoá.' };
  if (isProduction_() && !isOwnerUser_()) return { ok: false, error: 'Môi trường PRODUCTION: chỉ chủ file được xoá dữ liệu.' };
  if (mode !== 'KEEP_TUTORS' && mode !== 'ADMINS_ONLY') return { ok: false, error: 'Mức xoá không hợp lệ.' };
  if (String(phrase || '').trim() !== resetPhrase_(mode)) return { ok: false, error: 'Câu xác nhận không đúng. Không xoá gì.' };
  var backup;
  try { backup = backupDbCopy_('TRUOC_KHI_XOA'); } catch (e) { return { ok: false, error: 'Không sao lưu được (' + e.message + '). Không xoá gì. Kiểm tra CONFIG BACKUP_FOLDER_ID.' }; }

  var now = getNow_(), removed = {}, eventIds = [], sessions = [], users = [], events = 0, eventErrors = 0;
  // Tạm dừng hàng đợi Calendar 10 phút (soát R1 L8): kết quả trễ của job đang chạy không gắn nhầm vào booking mới cùng mã.
  try { props_().setProperty('CAL_PAUSED_UNTIL', String(realNowMs_() + 600000)); } catch (e) { }
  try { withLock_(function () {
    // 1. Ghi nhớ sự kiện Calendar còn trên lịch (xử lý sau khi nhả khoá): buổi chưa diễn ra có sự kiện, buổi chờ gỡ,
    // và buổi đang hoặc đã được thử tạo theo mã cố định (cal_attempts > 0) mà chưa ghi mã.
    table_('BOOKINGS').filter(function (b) {
      var st = calState_(b), future = slotStart_(b.date, b.slot) > now;
      if (st === CAL_STATE.CANCEL_PENDING) return true;
      if (!future) return false;
      if (b.event_id) return b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN;
      return Number(b.cal_attempts || 0) > 0;
    }).forEach(function (b) { eventIds.push(b.event_id || lessonEventId_(b)); });
    table_('AUTH').filter(function (a) { return a.kind === 'SESSION'; }).forEach(function (a) { sessions.push(a.token_hash); if (users.indexOf(a.user_id) === -1) users.push(a.user_id); });
    // 2. Xoá dòng (nhanh, chỉ thao tác Sheets). Nhật ký ghi ngay trong khoá để luôn còn dấu vết dù bước sau lỗi.
    // Xoá nhật ký trước rồi ghi ngay dòng "bắt đầu xoá": bước sau có lỗi giữa chừng vẫn còn dấu vết trong nhật ký mới.
    removed.ACTIVITY_LOG = purgeRows_('ACTIVITY_LOG', function () { return false; });
    logActivity_(actor, 'DATA_RESET_STARTED', 'DB', mode, { backup: backup });
    flushDb_();
    RESET_DATA_TABS_.filter(function (t) { return t !== 'ACTIVITY_LOG'; }).forEach(function (t) { removed[t] = purgeRows_(t, function () { return false; }); });
    removed.USERS = purgeRows_('USERS', function (u) { return u.role === 'ADMIN' || (mode === 'KEEP_TUTORS' && u.role === 'TUTOR'); });
    try { var rep = dbSpreadsheet_().getSheetByName('REPORT_MONTH'); if (rep) rep.clear(); } catch (e) { }
    logActivity_(actor, 'DATA_RESET', 'DB', mode, { backup: backup, removed: removed, eventsPending: eventIds.length });
  }); } finally {
    // 3. Dù bước xoá lỗi giữa chừng: phiên cũ vẫn hết hiệu lực ngay (kể cả bộ nhớ đệm).
    forgetSessions_(sessions, users);
  }
  // 4. Ngoài khoá: gỡ sự kiện Calendar không gửi thư (dữ liệu test).
  eventIds.forEach(function (id) {
    try { Calendar.Events.remove(lessonCalendarId_(), id, { sendUpdates: 'none' }); events++; } catch (e) { eventErrors++; }
  });
  // 5. Chunk 5M: bản lưu ngày bù tay (PKGADM_), dấu chống báo lặp: xoá cùng dữ liệu, mã gói cấp lại không nhận nhầm.
  // Cờ "đã chạy hôm nay" của job (tổng hợp, dọn AUTH...) để job chạy lại bình thường với dữ liệu mới; mở lại hàng đợi Calendar.
  try { var p = props_(), all = p.getProperties(); Object.keys(all).forEach(function (k) { if (/^DONE_/.test(k) || /^ARCH_OPEN_/.test(k) || k === 'CAL_PAUSED_UNTIL' || /^(PKGADM|COMPNEXT|COMPBLK|TRIALLEFT|TRIALOVER|PKGOUT|PKGMISS|TA_CONFIRM)_/.test(k)) p.deleteProperty(k); }); } catch (e) { }
  try { CacheService.getScriptCache().remove(CAL_HINT_KEY_); } catch (e) { }
  return { ok: true, backup: backup, removed: removed, eventsRemoved: events, eventErrors: eventErrors };
}

/** Menu: Xoá dữ liệu test. Bước 1 chọn mức, bước 2 gõ câu xác nhận. */
/** Người đang chạy có phải chủ file Sheets (tài khoản chạy hệ thống). */
function isOwnerUser_() {
  try { requireOwner_(); return true; } catch (e) { return false; }
}

function menuResetTestData(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (!cfg_('ALLOW_DATA_RESET')) { alert_('Đang chặn: CONFIG ALLOW_DATA_RESET khác TRUE. Hệ thống chạy thật thì không xoá dữ liệu.'); return; }
  var p1 = resetPreview_('KEEP_TUTORS'), tutors = table_('USERS').filter(function (u) { return u.role === 'TUTOR'; }).length;
  var lines = RESET_DATA_TABS_.map(function (t) { return '  ' + t + ': ' + p1[t] + ' dòng'; }).join('\n');
  var r1 = ui.prompt('Xoá dữ liệu test · Bước 1/2 (' + getEnv_() + ')',
    'Sẽ xoá:\n' + lines + '\n  Học viên trong USERS: ' + p1.USERS + '\n\n' +
    'Giữ nguyên: CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES, tài khoản admin.\n' +
    'Có sao lưu file trước khi xoá. Sự kiện Calendar của buổi chưa diễn ra bị gỡ, không gửi thư.\n\n' +
    'Nhập 1: giữ ' + tutors + ' tài khoản tutor.\nNhập 2: xoá cả tutor (chỉ còn admin).', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var mode = RESET_MODES_[String(r1.getResponseText()).trim()];
  if (!mode) { alert_('Chỉ nhập 1 hoặc 2. Không xoá gì.'); return; }
  var what = mode === 'ADMINS_ONLY' ? 'MỨC 2: xoá mọi học viên VÀ ' + tutors + ' tài khoản tutor. Chỉ còn admin.' : 'MỨC 1: xoá mọi học viên, giữ ' + tutors + ' tài khoản tutor.';
  var r2 = ui.prompt('Xoá dữ liệu test · Bước 2/2', what + '\nTutor phải mở lại lịch. Mọi người, kể cả admin, phải đăng nhập lại trên web.\n' +
    'KHÔNG HOÀN TÁC TRÊN SHEETS (chỉ khôi phục bằng bản sao lưu).\n\nGõ chính xác:  ' + resetPhrase_(mode), ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var res = resetTestData_(mode, r2.getResponseText(), adminActor_());
  if (!res.ok) { alert_(res.error); return; }
  alert_('Đã xoá. Bản sao lưu: ' + res.backup + '\nSự kiện Calendar đã gỡ: ' + res.eventsRemoved + (res.eventErrors ? ' (lỗi ' + res.eventErrors + ', gỡ tay trên lịch)' : '') +
    '\n\nẢnh chuyển khoản trong Drive không bị xoá. Giờ giả lập (nếu đang bật) giữ nguyên.');
}
