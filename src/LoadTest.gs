/**
 * LoadTest.gs · Thử tải trên STAGING trước khi chạy thật (chunk 5G, quyết định Q5 ngày 16/10)
 *
 * Mục đích: đo trên Google thật (không phải ước tính) khi nhiều học viên cùng đặt: bao nhiêu lượt bị từ chối, bận,
 * chậm bao lâu, có mất hay trùng booking không. Chỉ chạy trên STAGING (tài khoản admintest@).
 *
 * Cách hoạt động:
 *   1. Menu "Thử tải: tạo dữ liệu giả": N học viên lt0001@loadtest.invalid... có gói 1 tháng đang chạy, M tutor
 *      ltt01@loadtest.invalid... mở slot 14 ngày tới. Tên miền .invalid không bao giờ có thật: email tới đây không gửi
 *      (sendMail_ bỏ qua nhưng vẫn ghi MAIL_LOG), Calendar không mời các địa chỉ này (realGuests_).
 *   2. Menu "Thử tải: bật 2 giờ": sinh khoá bí mật mới (Script Property LOADTEST_SECRET), mở cổng doPost tới
 *      LOADTEST_UNTIL. Hết giờ tự đóng. PRODUCTION không bao giờ mở (switchToProduction xoá khoá).
 *   3. Máy tính của anh chạy loadtest/run.js (Node) hoặc loadtest/browser.js (Playwright, trình duyệt thật): mỗi người
 *      ảo gửi POST tới link /exec: { secret, as: email học viên giả, fn, args }. Máy chủ gọi ĐÚNG hàm API thật
 *      (apiStudentHome, apiStudentBook...) nên đi qua khoá, bộ đệm, chống trùng, hàng đợi Calendar như người thật.
 *   4. Menu "Thử tải: kiểm kết quả": đối soát (trùng giờ, trùng mã lần bấm, quá 1 buổi mỗi ngày), số đo tab METRICS.
 *   5. Xong: menu "Xoá dữ liệu test" (bước 2 xác nhận) để dọn sạch.
 * Cổng doPost (luật 24, 37): khi tắt hoặc sai khoá thì trả ngay, không đọc ghi Sheets, không lấy khoá. Chỉ gọi được các hàm
 * trong LOADTEST_FNS_ và chỉ thay mặt tài khoản @loadtest.invalid.
 */

var LOADTEST_DOMAIN_ = 'loadtest.invalid';
function isTestAddress_(email) { return /@loadtest\.invalid$/i.test(String(email || '').trim()); }
/** Bỏ khách mời giả (thử tải) khỏi danh sách khách Calendar. */
function realGuests_(list) { return list.filter(function (a) { return a && a.email && !isTestAddress_(a.email); }); }

function loadTestOn_() {
  if (isProduction_()) return false;
  var p = props_(), s = p.getProperty('LOADTEST_SECRET'), until = Number(p.getProperty('LOADTEST_UNTIL') || 0);
  return !!s && s.length >= 32 && realNowMs_() < until;
}

function safeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length || !a.length) return false;
  var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Phiên của một học viên, tutor giả: tạo 1 lần, giữ trong bộ đệm 6 giờ. Chỉ nhận tài khoản @loadtest.invalid đang ACTIVE. */
function loadTestSession_(email) {
  email = String(email || '').trim().toLowerCase();
  if (!isTestAddress_(email)) throw new Error('AUTH:FORBIDDEN');
  var c = CacheService.getScriptCache(), key = 'lt_sess_' + sha256Hex_(email).substring(0, 32), tok = c.get(key);
  if (tok) return tok;
  var u = userByEmail_(email);
  if (!u || u.status !== USER_STATUS.ACTIVE) throw new Error('AUTH:FORBIDDEN');
  tok = withLock_(function () { return createSessionInLock_(u, 'loadtest', 'LINK'); });
  c.put(key, tok, 21600);
  return tok;
}

var LOADTEST_FNS_ = ['info', 'warm', 'home', 'slots', 'book', 'cancel', 'tutorHome', 'tutorAvail', 'tutorSet', 'link'];
function loadTestCall_(fn, tok, args) {
  switch (fn) {
    case 'info': return apiPublicInfo();
    case 'warm': return { ok: true };   // chỉ tạo sẵn phiên (run.js làm trước khi bấm giờ, soát R2 T19)
    case 'home': return apiStudentHome(tok, args[0] || {});
    case 'slots': return apiStudentSlots(tok, args[0], args[1]);
    case 'book': return apiStudentBook(tok, args[0], args[1]);
    case 'cancel': return apiStudentCancel(tok, args[0], args[1]);
    case 'tutorHome': return apiTutorHome(tok);
    case 'tutorAvail': return apiTutorAvailability(tok, args[0], args[1]);
    case 'tutorSet': return apiTutorSetAvailability(tok, args[0], args[1]);
  }
  return { ok: false, reason: REASONS.INVALID_INPUT };
}

/** Xử lý một POST thử tải. Trả object (doPost đổi thành JSON). */
function loadTestHandle_(e) {
  if (!loadTestOn_()) return { ok: false, reason: 'LOADTEST_OFF' };
  var body = null;
  try { body = JSON.parse(String((e && e.postData && e.postData.contents) || '')); } catch (x) { return { ok: false, reason: REASONS.INVALID_INPUT }; }
  if (!body || !safeEqual_(body.secret, props_().getProperty('LOADTEST_SECRET'))) return { ok: false, reason: REASONS.FORBIDDEN };
  var fn = String(body.fn || ''), args = Array.isArray(body.args) ? body.args : [];
  if (LOADTEST_FNS_.indexOf(fn) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  var t0 = Date.now(), out;
  try {
    if (fn === 'link') {
      // Link đăng nhập thật cho trình duyệt (loadtest/browser.js): đi đúng đường google.script.run của trang web.
      var em = String(body.as || '').trim().toLowerCase();
      if (!isTestAddress_(em)) return { ok: false, reason: REASONS.FORBIDDEN };
      var u = userByEmail_(em);
      if (!u || u.status !== USER_STATUS.ACTIVE) return { ok: false, reason: REASONS.NOT_FOUND };
      out = { ok: true, data: { url: withLock_(function () { return createLoginLinkInLock_(u); }) } };
    } else {
      out = loadTestCall_(fn, fn === 'info' ? '' : loadTestSession_(body.as), args);
      // Phiên giả trong bộ đệm đã bị huỷ (ví dụ Xoá dữ liệu test): bỏ bản đệm, tạo phiên mới, thử lại 1 lần (soát R1 L5).
      if (out && out.reason === REASONS.SESSION_INVALID && fn !== 'info') {
        try { CacheService.getScriptCache().remove('lt_sess_' + sha256Hex_(String(body.as || '').trim().toLowerCase()).substring(0, 32)); } catch (x) { }
        out = loadTestCall_(fn, loadTestSession_(body.as), args);
      }
    }
  } catch (err) {
    var m = String((err && err.message) || err);
    out = m === BUSY_MESSAGE_ ? { ok: false, reason: REASONS.BUSY } : m.indexOf('AUTH:') === 0 ? { ok: false, reason: m.substring(5) } : { ok: false, reason: REASONS.SERVER_ERROR, message: m.substring(0, 200) };
  }
  out = out || {};
  out.server_ms = Date.now() - t0;
  return out;
}

/** Cửa POST của web app: chỉ dùng cho thử tải trên STAGING. */
function doPost(e) {
  var out; forgetEnvMemo_();
  try { out = loadTestHandle_(e); } catch (err) { out = { ok: false, reason: REASONS.SERVER_ERROR }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Tạo dữ liệu giả (STAGING, chủ file). Chạy lại thì chỉ thêm phần còn thiếu. Trả { students, tutors, slots }. */
function loadTestSeed_(nStudents, nTutors, days) {
  if (isProduction_()) throw new Error('Không tạo dữ liệu thử tải trên PRODUCTION.');
  nStudents = Math.min(2000, Math.max(1, Math.floor(nStudents || 100)));
  nTutors = Math.min(60, Math.max(1, Math.floor(nTutors || 10)));
  days = Math.min(21, Math.max(1, Math.floor(days || 14)));
  var pad = function (n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; };
  return withLock_(function () {
    var users = table_('USERS'), sps = table_('STUDENT_PACKAGES'), av = table_('AVAILABILITY'), defs = pkgDefs_();
    var now = getNow_(), today = toMidnight_(now), def = defs.PASS_1M || defs[Object.keys(defs).filter(function (k) { return defs[k].type === 'DAYS'; })[0]];
    if (!def) throw new Error('Cần gói loại DAYS (ví dụ PASS_1M) trong tab PACKAGES.');
    var have = {}; users.all().forEach(function (u) { have[String(u.email).toLowerCase()] = u; });
    var out = { students: 0, tutors: 0, slots: 0 }, tutorIds = [];
    for (var t = 1; t <= nTutors; t++) {
      var te = 'ltt' + pad(t, 2) + '@' + LOADTEST_DOMAIN_, tu = have[te];
      if (!tu) { tu = users.insert({ user_id: nextId_('USERS_TUTOR'), role: 'TUTOR', email: te, name: 'LT Tutor ' + pad(t, 2), status: USER_STATUS.ACTIVE, rate_vnd: 0, created_at: now, note: 'thử tải' }); out.tutors++; }
      tutorIds.push(tu.user_id);
    }
    for (var s = 1; s <= nStudents; s++) {
      var se = 'lt' + pad(s, 4) + '@' + LOADTEST_DOMAIN_, su = have[se];
      if (!su) { su = users.insert({ user_id: nextId_('USERS_STUDENT'), role: 'STUDENT', email: se, name: 'LT Student ' + pad(s, 4), status: USER_STATUS.ACTIVE, created_at: now, note: 'thử tải' }); out.students++; }
      var hasPkg = sps.find(function (p) { return p.student_id === su.user_id && p.status === PKG_STATUS.ACTIVE; });
      if (!hasPkg) sps.insert({ sp_id: nextId_('STUDENT_PACKAGES'), student_id: su.user_id, package_code: def.code, status: PKG_STATUS.ACTIVE, start_date: today,
        end_date: addDays_(today, Number(def.days || 30)), start_source: 'LOADTEST', sessions_total: def.sessions || '', suspended_days: 0, purchased_at: now });
    }
    var slots = slotList_(), open = {};
    av.all().forEach(function (a) { open[a.tutor_id + '|' + dateKey_(a.date) + '|' + a.slot] = true; });
    for (var d = 1; d <= days; d++) {
      var date = addDays_(today, d);
      tutorIds.forEach(function (tid) {
        slots.forEach(function (sl) {
          if (open[tid + '|' + dateKey_(date) + '|' + sl]) return;
          av.insert({ avail_id: nextId_('AVAILABILITY'), tutor_id: tid, date: date, slot: sl, status: AVAIL_STATUS.OPEN, created_at: now }); out.slots++;
        });
      });
    }
    logActivity_(adminActor_(), 'LOADTEST_SEED', 'SYSTEM', '', JSON.stringify(out));
    return out;
  }, 30000);
}

/** Bật cổng thử tải trong `hours` giờ với khoá mới. Trả { secret, until, url }. */
function loadTestEnable_(hours) {
  if (isProduction_()) throw new Error('Không bật thử tải trên PRODUCTION.');
  var secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''), until = realNowMs_() + Math.min(6, Math.max(0.25, Number(hours) || 2)) * 3600000;
  var p = props_(); p.setProperty('LOADTEST_SECRET', secret); p.setProperty('LOADTEST_UNTIL', String(until));
  try { withLock_(function () { logActivity_(adminActor_(), 'LOADTEST_ON', 'SYSTEM', '', new Date(until).toISOString()); }); } catch (e) { }
  return { secret: secret, until: new Date(until), url: String(cfg_('WEBAPP_URL') || '') };
}
function loadTestDisable_() { var p = props_(); p.deleteProperty('LOADTEST_SECRET'); p.deleteProperty('LOADTEST_UNTIL'); }

/**
 * Kiểm kết quả sau lượt thử tải (chỉ đọc): số booking của học viên giả, trùng mã lần bấm, hai học viên cùng tutor cùng giờ,
 * học viên quá 1 buổi mỗi ngày, hàng đợi Calendar, số đo giờ gần nhất.
 */
function loadTestCheck_() {
  clearDbCache_();
  var lt = {}; table_('USERS').all().forEach(function (u) { if (isTestAddress_(u.email)) lt[u.user_id] = u; });
  var bks = table_('BOOKINGS').filter(function (b) { return lt[b.student_id]; });
  var live = bks.filter(function (b) { return isHolding_(b.status); });
  var rid = {}, dupRid = 0, slot = {}, dupSlot = 0, day = {}, overDay = 0, perDay = Number(cfg_('MAX_BOOKINGS_PER_DAY')) || 1;
  bks.forEach(function (b) { if (b.request_id) { var k = b.student_id + '|' + b.request_id + '|' + dateKey_(b.date) + '|' + b.slot; if (rid[k]) dupRid++; rid[k] = true; } });
  live.forEach(function (b) {
    var k = b.tutor_id + '|' + dateKey_(b.date) + '|' + b.slot; if (slot[k]) dupSlot++; slot[k] = true;
    if (!isConsuming_(b.status)) return;
    var d = b.student_id + '|' + dateKey_(b.date); day[d] = (day[d] || 0) + 1; if (day[d] === perDay + 1) overDay++;
  });
  var q = calendarQueueStatus_();
  return { students: Object.keys(lt).length, bookings: bks.length, live: live.length, cancelled: bks.length - live.length,
    duplicateRequest: dupRid, doubleBookedSlot: dupSlot, overPerDay: overDay, calendarPending: q.pending, calendarFailed: q.failed,
    metrics: metricsNow_().filter(function (r) { return /^api|_lock_|_client_/.test(r.fn); }) };
}

function menuLoadTestSeed(e) { requireOperator_(e);
  if (isProduction_()) { alert_('Chỉ dùng trên STAGING.'); return null; }
  if (!isOwnerUser_()) { alert_('Chỉ chủ file.'); return null; }
  var r = loadTestSeed_(100, 10, 14);
  alert_('Dữ liệu thử tải: thêm ' + r.students + ' học viên, ' + r.tutors + ' tutor, ' + r.slots + ' slot (14 ngày tới).\nEmail @loadtest.invalid không gửi thật.\n\nTiếp: menu "Thử tải: bật 2 giờ".');
  return r;
}
function menuLoadTestEnable(e) { requireOperator_(e);
  if (isProduction_()) { alert_('Chỉ dùng trên STAGING.'); return null; }
  if (!isOwnerUser_()) { alert_('Chỉ chủ file.'); return null; }
  var r = loadTestEnable_(2);
  alert_('Đã mở cổng thử tải tới ' + fmtDateTime_(r.until) + ' (giờ thật).\n\nKHOÁ (chép vào lệnh chạy, không gửi qua chat):\n' + r.secret + '\n\nLINK: ' + (r.url || 'chưa có WEBAPP_URL trong CONFIG') +
    '\n\nLưu ý: phải "Triển khai > Quản lý > Phiên bản mới" sau khi dán code 5G thì link /exec mới có doPost.');
  return r;
}
function menuLoadTestOff(e) { requireOperator_(e); loadTestDisable_(); logMenu_(e, 'LOADTEST_OFF', 'SYSTEM', '', ''); alert_('Đã đóng cổng thử tải.'); }
function menuLoadTestCheck(e) { requireOperator_(e);
  var r = loadTestCheck_();
  var bad = r.duplicateRequest + r.doubleBookedSlot + r.overPerDay;
  alert_('Kết quả thử tải\n\n' + r.students + ' học viên giả, ' + r.bookings + ' booking (' + r.live + ' còn, ' + r.cancelled + ' huỷ)\n' +
    'Trùng mã lần bấm: ' + r.duplicateRequest + '\nHai người cùng tutor cùng giờ: ' + r.doubleBookedSlot + '\nQuá số buổi mỗi ngày: ' + r.overPerDay + '\n' +
    'Calendar chờ tạo: ' + r.calendarPending + ', lỗi: ' + r.calendarFailed + '\n\n' + (bad ? 'CÓ LỖI DỮ LIỆU: gửi ảnh này cho Alex.' : 'Dữ liệu đúng luật.') + '\n\nSố đo giờ này:\n' +
    r.metrics.slice(0, 12).map(function (m) { return m.fn + ': ' + m.count + ' lượt, p95 ' + m.p95_ms + ' ms, bận ' + m.busy + ', lỗi ' + m.errors; }).join('\n'));
  return r;
}
