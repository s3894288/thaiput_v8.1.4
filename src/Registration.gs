/**
 * Registration.gs · Đăng ký, gia hạn, duyệt (v8, câu 5, 33, 39, 40, 50)
 *
 * Luồng: học viên gửi form kèm ảnh chuyển khoản → REGISTRATIONS "Chờ duyệt" → admin chọn "Duyệt"
 * → hệ thống tạo tài khoản (nếu chưa có), gói, khoản thu, gửi email chào mừng kèm link đăng nhập.
 * Thanh toán hoàn toàn bên ngoài; hệ thống chỉ lưu ảnh và số tiền theo bảng giá.
 */

var PKG_SHORT_ = { TRIAL: 'TR', PASS_2W: '2W', PASS_1M: '1M' };
var MAX_UPLOAD_BYTES_ = 6 * 1024 * 1024;

function isEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); }

function hasUsedTrial_(email) {
  var u = userByEmail_(email);
  if (u && studentPackages_(u.user_id).some(function (sp) { return sp.package_code === 'TRIAL'; })) return true;
  var e = String(email).toLowerCase();
  // Đăng ký Trial đang chờ duyệt hoặc đã duyệt cũng tính là đã dùng, tránh gửi 2 form Trial liền nhau.
  return table_('REGISTRATIONS').filter(function (r) {
    return String(r.email).toLowerCase() === e && r.package_code === 'TRIAL' && r.admin_action !== ADMIN_DECISION.REJECT;
  }).length > 0;
}

/**
 * Kiểm tra form, không ghi gì. Dùng chung cho trang web (báo lỗi sớm) và server.
 * form: { email, name, phone, level_self, package_code, consent, screenshot: { name, mimeType, base64 } }
 */
function validateRegistration_(form, defs) {
  var errors = [];
  if (!form || !isEmail_(form.email)) errors.push(REASONS.INVALID_INPUT);
  if (!form || !String(form.name || '').trim() || String(form.name).length > 80) errors.push(REASONS.INVALID_INPUT);
  if (form && (String(form.email || '').length > 120 || String(form.level_self || '').length > 30)) errors.push(REASONS.INVALID_INPUT);
  var ph = normalizePhone_(form && form.phone, false);
  if (!ph.ok) errors.push(REASONS.INVALID_PHONE);
  var def = form && defs[form.package_code];
  if (!def || !def.active) errors.push(REASONS.INVALID_INPUT);
  // 5K (BL06): gói giá 0 chỉ đăng ký qua Zalo admin (trang web không cho chọn); chặn cả khi gửi thẳng lên máy chủ.
  else if (!(Number(def.price_vnd) > 0)) errors.push(REASONS.PACKAGE_CONTACT);
  // 5L: mã gói đang trùng hoặc dòng gói sai: không nhận đăng ký tới khi admin sửa (menu 2 báo đỏ).
  if (def && def.active && brokenPackageCodes_()[form.package_code]) errors.push(REASONS.PACKAGE_BROKEN);
  var shot = form && form.screenshot;
  if (!shot || !shot.base64) errors.push(REASONS.MISSING_SCREENSHOT);
  else if (!/^(image\/(png|jpe?g|webp|heic|heif)|application\/pdf)$/i.test(String(shot.mimeType || ''))) errors.push(REASONS.INVALID_INPUT);
  else if (String(shot.base64).length * 0.75 > MAX_UPLOAD_BYTES_) errors.push(REASONS.INVALID_INPUT);
  if (!form || form.consent !== true) errors.push(REASONS.MISSING_CONSENT);
  if (!errors.length && form.package_code === 'TRIAL' && cfg_('TRIAL_ONCE_PER_EMAIL') && hasUsedTrial_(form.email)) errors.push(REASONS.TRIAL_USED);
  var uniq = errors.filter(function (x, i) { return errors.indexOf(x) === i; });
  return { ok: !uniq.length, reasons: uniq, phone: ph.ok ? ph.phone : '' };
}

/** Gửi form đăng ký hoặc gia hạn. Trả { ok, reasons, regId, transferCode }. */
function submitRegistration_(form) {
  return withLock_(function () {
    var defs = pkgDefs_();
    var v = validateRegistration_(form, defs);
    if (!v.ok) return { ok: false, reasons: v.reasons };
    var email = String(form.email).trim().toLowerCase(), now = getNow_(), def = defs[form.package_code];
    var user = userByEmail_(email);
    var regId = nextId_('REGISTRATIONS');
    var code = 'TP ' + (user ? user.user_id : regId) + ' ' + (PKG_SHORT_[def.code] || def.code);

    var bytes = Utilities.base64Decode(String(form.screenshot.base64).replace(/^data:[^,]+,/, ''));
    var ext = (String(form.screenshot.name || '').match(/\.[A-Za-z0-9]{2,5}$/) || [''])[0];
    var blob = Utilities.newBlob(bytes, form.screenshot.mimeType, regId + '_' + email.replace(/[^a-z0-9]/g, '_') + ext);
    var file = DriveApp.getFolderById(cfg_('UPLOADS_FOLDER_ID')).createFile(blob);

    var reg = table_('REGISTRATIONS').insert({
      reg_id: regId, created_at: now, email: email, name: String(form.name).trim(), phone: v.phone,
      level_self: String(form.level_self || '').trim(), package_code: def.code, transfer_code: code,
      screenshot_url: file.getUrl(), consent: true, kind: user ? 'RENEW' : 'NEW', admin_action: ADMIN_DECISION.PENDING
    });
    logActivity_(email, 'REG_CREATED', 'REGISTRATION', regId, { package: def.code, kind: reg.kind });
    notify_('NEW_REGISTRATION', { actor: email, entity: 'REGISTRATION', entity_id: regId, link: rowLink_('REGISTRATIONS', reg._row),
      message: (reg.kind === 'RENEW' ? 'Gia hạn' : 'Đăng ký mới') + ': ' + reg.name + ' · ' + def.name + ' · ' + code,
      message_en: (reg.kind === 'RENEW' ? 'Renewal' : 'New registration') + ': ' + reg.name + ' · ' + (def.name_en || def.name) + ' · ' + code }, function () { return mailAdminNewRegistration_(reg, def); });
    mailRegistrationReceived_(reg, def);
    return { ok: true, reasons: [], regId: regId, transferCode: code };
  });
}

/**
 * Admin duyệt (chọn "Duyệt" ở tab REGISTRATIONS; nối dropdown ở chunk 3).
 * Chạy lại nhiều lần không tạo trùng (kiểm tra processed_at).
 * loginUrlFn: hàm tạo link đăng nhập một lần cho user (Auth.gs, chunk 3); không có thì dẫn tới trang đăng nhập.
 */
function newDefDays_(def) { return def && def.type !== 'SESSIONS'; }
/** Ngày bắt đầu tạm khoá đang chạy của học viên (từ gói khác), hoặc hôm nay. */
function suspendStartOf_(sid, now) {
  var d = null;
  studentPackages_(sid).forEach(function (sp) { if (sp.suspend_started_at && (!d || new Date(sp.suspend_started_at) < d)) d = toMidnight_(new Date(sp.suspend_started_at)); });
  return d || toMidnight_(now);
}

function approveRegistration_(regId, actor, loginUrlFn) {
  return withLock_(function () {
    var reg = table_('REGISTRATIONS').byId(regId);
    if (!reg) return { ok: false, reason: REASONS.NOT_FOUND };
    if (reg.processed_at) return { ok: true, already: true };
    var defs = pkgDefs_(), def = defs[reg.package_code], now = getNow_();
    if (!def) throw new Error('Gói không tồn tại: ' + reg.package_code);
    var users = table_('USERS'), user = userByEmail_(reg.email);
    if (!user) {
      user = users.insert({
        user_id: nextId_('USERS_STUDENT'), role: 'STUDENT', email: reg.email, name: reg.name, phone: reg.phone,
        contact_link: contactFormula_(reg.phone), level: reg.level_self, status: USER_STATUS.ACTIVE, created_at: now
      });
      logActivity_(actor, 'USER_CREATED', 'USER', user.user_id, reg.email);
    } else if (reg.phone && reg.phone !== user.phone) {
      users.update(user, { phone: reg.phone, contact_link: contactFormula_(reg.phone) });
    }
    var plan = pkgPlanNewPurchase_(studentPackages_(user.user_id), defs, def, now);
    var sp = table_('STUDENT_PACKAGES').insert({
      sp_id: nextId_('STUDENT_PACKAGES'), student_id: user.user_id, package_code: def.code, status: plan.status,
      start_date: plan.start_date, end_date: plan.end_date, start_source: plan.start_source,
      sessions_total: def.sessions || '', suspended_days: 0, purchased_at: now, reg_id: regId, start_date_locked: plan.start_date_locked || '',
      // Soát vòng 2 (3): học viên đang tạm khoá mua gói mới: gói mới cũng tính từ lúc khoá, mở khoá thì dời cùng gói trước (không chồng).
      suspend_started_at: user.status === USER_STATUS.SUSPENDED && newDefDays_(def) ? (plan.status === PKG_STATUS.QUEUED ? suspendStartOf_(user.user_id, now) : toMidnight_(now)) : ''
    });
    table_('PAYMENTS').insert({
      payment_id: nextId_('PAYMENTS'), date: now, student_id: user.user_id, package_code: def.code,
      amount_vnd: def.price_vnd, screenshot_url: reg.screenshot_url, reg_id: regId, recorded_by: actor
    });
    table_('REGISTRATIONS').update(reg, { admin_action: ADMIN_DECISION.APPROVE, processed_at: now, processed_by: actor });
    logActivity_(actor, 'REG_APPROVED', 'REGISTRATION', regId, { user: user.user_id, sp: sp.sp_id, status: plan.status });
    // Mặc định dùng link đăng nhập thật (Auth.gs); test có thể truyền hàm khác.
    var url = typeof loginUrlFn === 'function' ? loginUrlFn(user) : createLoginLinkInLock_(user);
    mailWelcome_(user, def, url);
    return { ok: true, userId: user.user_id, spId: sp.sp_id };
  });
}

function rejectRegistration_(regId, actor, note) {
  return withLock_(function () {
    var reg = table_('REGISTRATIONS').byId(regId);
    if (!reg) return { ok: false, reason: REASONS.NOT_FOUND };
    if (reg.processed_at) return { ok: true, already: true };
    table_('REGISTRATIONS').update(reg, { admin_action: ADMIN_DECISION.REJECT, processed_at: getNow_(), processed_by: actor, note: note || '' });
    logActivity_(actor, 'REG_REJECTED', 'REGISTRATION', regId, note || '');
    mailRegistrationRejected_(reg, note);
    return { ok: true };
  });
}

/** Công thức trong Sheets để admin bấm mở Zalo của học viên (câu 42). */
function contactFormula_(phone) {
  return isVnPhone_(phone) ? '=HYPERLINK("' + zaloLink_(phone) + '","Zalo ' + phoneDisplay_(phone) + '")' : '';
}
