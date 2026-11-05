/**
 * Api.gs · Cửa vào của trang web (v8, plan mục 6)
 *
 * doGet phục vụ giao diện (ui/*.html, chunk 4). Trang web gọi các hàm api* qua google.script.run.
 * Quy tắc:
 *   1. Hàm cần đăng nhập luôn gọi requireRole_ đầu tiên; id học viên, tutor lấy từ phiên, không nhận từ trình duyệt.
 *   2. Mọi hàm trả object { ok, reason, message, data } thay vì ném lỗi, để trang web luôn hiện được câu dễ hiểu.
 *   3. Lỗi bất ngờ: email admin kèm chi tiết, trang web chỉ thấy câu chung (không lộ thông tin hệ thống).
 */

function doGet(e) {
  var params = (e && e.parameter) || {};
  // Kiểm tra từ bên ngoài (chunk 5F): dịch vụ giám sát (UptimeRobot...) gọi ?page=health mỗi vài phút. Không đọc Sheets,
  // không lấy khoá: chỉ chứng minh web app còn chạy và bộ đệm còn dùng được.
  if (String(params.page || '') === 'health') return healthResponse_();
  var t = htmlTemplate_('ui/Index');
  t.bootJson = bootJson_(params);
  return t.evaluate()
    .setTitle(cfg_('SCHOOL_NAME') + ' · Đặt lịch luyện nói 1:1 · 1:1 speaking lessons')   // chunk 5I: tiêu đề thẻ trình duyệt đủ hai thứ tiếng
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Dữ liệu khởi động cho trình duyệt, in vào trang bằng <?!= ?>.
 * Chỉ nhận page là chữ thường và token là chữ số hex, nên tham số URL lạ không chèn được mã vào trang.
 * Dùng JSON thay cho <?= ?> trong thẻ script vì Apps Script tự thêm dấu nháy khi in chuỗi trong ngữ cảnh JavaScript.
 */
function bootJson_(params) {
  var page = String(params.page || 'home'), tok = String(params.t || '');
  var boot = { page: /^[a-z]{1,20}$/.test(page) ? page : 'home', linkToken: /^[a-f0-9]{32,128}$/i.test(tok) ? tok : '', version: APP.VERSION };
  // Đăng nhập Google (chunk 5D): dự án phụ chuyển sang ?page=gauth&ge=email&gts=thời điểm&gs=chữ ký. Chỉ nhận đúng dạng.
  if (boot.page === 'gauth') {
    var ge = String(params.ge || '').toLowerCase(), gts = String(params.gts || ''), gs = String(params.gs || '');
    boot.glogin = /^[^\s@<>"']{1,80}@[^\s@<>"']{1,80}$/.test(ge) && /^\d{10,16}$/.test(gts) && /^[A-Za-z0-9_-]{20,100}$/.test(gs) ? { e: ge, ts: gts, sig: gs } : null;
  }
  try { boot.googleLoginUrl = cfg_('GOOGLE_LOGIN_URL'); } catch (e) { boot.googleLoginUrl = ''; }
  // Chữ trên web lấy từ tab CONTENT (chunk 5C) và link Zalo cho nút nổi ở góc màn hình.
  // Chunk 5I: chữ của trang admin (ad.*) không gửi cho mọi trang; trang admin nhận qua apiAdminHome.
  try { var cm = contentMap_(); boot.content = {}; Object.keys(cm).forEach(function (k) { if (k.indexOf('ad.') !== 0) boot.content[k] = cm[k]; }); } catch (e) { boot.content = {}; }
  try { boot.zalo = cfg_('ADMIN_ZALO_URL'); } catch (e) { boot.zalo = ''; }
  boot.maint = maintInfo_();   // chunk 5G: thanh báo bảo trì
  return JSON.stringify(boot).replace(/</g, '\\u003c');
}

/**
 * File HTML có thể tên "ui/Index" (đẩy bằng clasp) hoặc "Index" (dán tay trong trình soạn thảo, bản dist/).
 * Thử tên có thư mục trước, không có thì dùng tên ngắn.
 */
function htmlTemplate_(name) {
  try { return HtmlService.createTemplateFromFile(name); } catch (e) { return HtmlService.createTemplateFromFile(name.replace(/^ui\//, '')); }
}
/** Nhúng một file HTML con vào trang (dùng trong ui/Index.html). */
function include_(name) {
  try { return HtmlService.createHtmlOutputFromFile(name).getContent(); } catch (e) { }
  var short = name.replace(/^ui\//, '');
  try { return HtmlService.createHtmlOutputFromFile(short).getContent(); }
  catch (e2) {
    throw new Error('Thiếu file HTML "' + short + '" trong bản đã triển khai. Cách sửa: dùng bản Index.html gộp sẵn trong dist/ ' +
      '(không cần file ' + short + '), hoặc tạo file HTML tên đúng "' + short + '"; sau đó Triển khai > Quản lý các lần triển khai > Phiên bản mới.');
  }
}

/**
 * Trang health cho dịch vụ giám sát bên ngoài. Không chạm Sheets, không lấy khoá (luật 37).
 * "OK": web app chạy và các job định kỳ còn chạy. "STALE": một job đã ngừng quá lâu (trigger bị gỡ, hết hạn mức,
 * lỗi lặp lại): dịch vụ giám sát kiểm chữ "OK" nên sẽ báo động. Chưa có mốc nào (vừa cài đặt) thì coi là OK.
 * Không lộ phiên bản, tên job hay lượng khách ra ngoài (soát R2 L7).
 */
// nightlyBackup, dailyJob chạy 1 lần mỗi ngày: quá 26 giờ không chạy là có vấn đề (soát R2 T22).
var HEALTH_MAX_AGE_MIN_ = { hourlyJob: 150, reminderJob: 45, calendarJob: 30, nightlyBackup: 26 * 60, dailyJob: 26 * 60 };
function healthStatus_() {
  var p = null; try { p = props_().getProperties(); } catch (e) { return 'OK'; }
  var now = realNowMs_(), stale = Object.keys(HEALTH_MAX_AGE_MIN_).filter(function (k) {
    // Sao lưu: theo mốc đã có file (BACKUP_OK_AT), không theo nhịp tim (bỏ lượt vì bận vẫn ghi nhịp).
    var t = Number(p[k === 'nightlyBackup' ? 'BACKUP_OK_AT' : 'HB_' + k] || 0); return t > 0 && now - t > HEALTH_MAX_AGE_MIN_[k] * 60000;
  });
  return stale.length ? 'STALE' : 'OK';
}
function healthResponse_() {
  try { CacheService.getScriptCache().get('health'); } catch (e) { }
  return ContentService.createTextOutput(healthStatus_()).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Bọc mọi hàm API: chuẩn hoá kết quả và lỗi.
 * Chunk 5F: đo thời gian mỗi lượt (Metrics.gs); trong lượt gọi, các dòng nhật ký và MAIL_LOG phát sinh ngoài khoá được gom
 * và ghi một lần ở cuối (flushDeferred_) thay vì mỗi dòng một lần lấy khoá.
 */
var CURRENT_API_ = '';   // tên API đang chạy (để idem_ áp chế độ bảo trì SAU bước trả lại kết quả cũ)
function apiWrap_(name, fn) {
  // Ngôn ngữ câu báo lỗi: cổng tutor tiếng Anh; trang đăng nhập chưa biết là ai nên hiện cả hai; còn lại tiếng Việt.
  var lang = /^apiTutor/.test(name) ? 'en' : /^api(RequestLogin|ExchangeToken|GoogleExchange)$/.test(name) ? 'both' : 'vi';
  var t0 = Date.now(), flags = {}, out, prevApi = CURRENT_API_;
  if (!prevApi) forgetEnvMemo_();   // mỗi lượt gọi từ trình duyệt là một lần chạy mới (chunk 5I: ENV, DB_ID nhớ trong lần chạy)
  DEFER_ACTIVE_++; CURRENT_API_ = name;
  try {
    out = apiRun_(name, fn, lang, flags);
  } finally {
    CURRENT_API_ = prevApi;
    runAfterResponse_();
    DEFER_ACTIVE_--;
    if (!DEFER_ACTIVE_) { try { flushDeferred_(); } catch (e) { } }
    try { metricAdd_(name, Date.now() - t0, flags); } catch (e) { }
  }
  return out;
}
function apiRun_(name, fn, lang, flags) {
  try {
    // Chunk 5G: chế độ bảo trì chặn trước khi làm gì (không ghi, không lấy khoá). Admin không bao giờ bị chặn.
    // API có mã lần bấm (idem_) được chặn bên trong idem_, SAU bước trả lại kết quả cũ: lượt đặt đã ghi mà mất phản hồi,
    // gửi lại đúng lúc bật bảo trì vẫn nhận đúng kết quả "đã đặt" (soát R2 T4).
    var mb = MAINT_IDEM_APIS_[name] || MAINT_ROLE_APIS_[name] ? null : maintBlock_(name);
    var out = mb || fn();
    // Báo trạng thái bảo trì cho trang (thanh báo tự bật, tự tắt khi admin đổi trong lúc trang đang mở; soát R1 L4, R2 T11).
    if (out && typeof out === 'object' && 'ok' in out && !/^apiAdmin/.test(name)) { var mm = maintInfo_(); if (mm.mode !== 'OFF') out.maint = mm; }
    if (out && typeof out === 'object' && 'ok' in out) {
      if (!out.ok && out.reason === REASONS.BUSY) flags.busy = true;
      // Chunk 5H: câu báo lỗi cả hai thứ tiếng (out.msg); trình duyệt hiện theo ngôn ngữ người dùng chọn.
      // out.message giữ ngôn ngữ mặc định của API (trang quản trị, công cụ cũ đọc message).
      if (!out.ok && out.reason && !out.message) {
        out.msg = reasonsPair_(out.reasons && out.reasons.length ? out.reasons : [out.msgCode || out.reason], out.vars);
        out.message = lang === 'en' ? out.msg.en : lang === 'both' ? (out.msg.vi === out.msg.en ? out.msg.vi : out.msg.vi + ' / ' + out.msg.en) : out.msg.vi;
      }
      delete out.vars; delete out.msgCode;
      return out;
    }
    return { ok: true, data: out };
  } catch (e) {
    var msg = String((e && e.message) || e);
    if (msg === BUSY_MESSAGE_) { flags.busy = true; return { ok: false, reason: REASONS.BUSY, message: safeReason_(REASONS.BUSY, lang), msg: safePair_(REASONS.BUSY) }; }
    if (msg.indexOf('AUTH:') === 0) {
      var code = msg.substring(5);
      return { ok: false, reason: code, message: safeReason_(code, lang), msg: safePair_(code) };
    }
    flags.error = true;
    mailAdminError_('API ' + name, (e && e.stack) || msg);
    return { ok: false, reason: REASONS.SERVER_ERROR, message: safeReason_(REASONS.SERVER_ERROR, lang), msg: safePair_(REASONS.SERVER_ERROR) };
  }
}

/**
 * Việc chạy sau khi kết quả của lượt gọi đã có (và đã lưu cho chống gửi trùng), ví dụ email "Có đăng nhập mới".
 * Ngoài lượt gọi API (menu, test gọi thẳng) thì chạy ngay. Lỗi không đổi kết quả.
 */
var AFTER_RESPONSE_ = [];
function afterResponse_(fn) { if (DEFER_ACTIVE_ > 0) AFTER_RESPONSE_.push(fn); else { try { fn(); } catch (e) { afterLockError_(e); } } }
function runAfterResponse_() {
  var list = AFTER_RESPONSE_; AFTER_RESPONSE_ = [];
  list.forEach(function (fn) { try { fn(); } catch (e) { afterLockError_(e); } });
}

/**
 * Chống gửi trùng (chunk 5F). Trình duyệt sinh một mã cho mỗi lần bấm (đặt, huỷ, lưu slot, xác nhận kết quả, đổi link
 * đăng nhập) và gửi lại đúng mã đó khi tự thử lại. Kết quả lần đầu lưu 6 giờ trong bộ đệm theo (phạm vi, mã): lần gửi lại
 * nhận đúng kết quả cũ, không làm lại. Lần gửi lại đến khi lần đầu còn đang chạy thì nhận "bận" và tự thử lại sau.
 * Phạm vi có mã người dùng (hoặc băm của link) nên không ai lấy được kết quả của người khác bằng cách đoán mã.
 */
function idem_(scope, rid, fn, opts) {
  rid = validRequestId_(rid);
  var gate = function () { return CURRENT_API_ && MAINT_IDEM_APIS_[CURRENT_API_] ? maintBlock_(CURRENT_API_) : null; };
  if (!rid) return gate() || fn();
  // opts.okOnly (endpoint công khai: đổi link, đăng nhập Google): chỉ lưu kết quả thành công, và chỉ đặt cờ "đang chạy" khi
  // opts.gate() xác nhận đầu vào có thật (link có trong AUTH), để link hay chữ ký rác không ghi được gì vào bộ đệm
  // (soát R1 L9, luật 37) mà lần gửi lại của người thật vẫn nhận IN_PROGRESS thay vì "link đã dùng" (soát R2 T1).
  opts = opts || {};
  var mark = !opts.okOnly || (opts.gate && opts.gate());
  var c = null, key = 'idem_' + sha256Hex_(scope + '|' + rid).substring(0, 40);
  try { c = CacheService.getScriptCache(); } catch (e) { return gate() || fn(); }   // soát R3 N4: bộ đệm hỏng vẫn qua cổng bảo trì
  var hit = null;
  try { hit = c.get(key); } catch (e) { }
  // Lượt đầu còn đang chạy: báo IN_PROGRESS (không phải "bận") để trình duyệt hỏi lại cùng mã tới khi có kết quả (soát R1 T4).
  if (hit === 'RUNNING') return { ok: false, reason: REASONS.IN_PROGRESS };
  if (hit) { try { var o = JSON.parse(hit); o.replay = true; return o; } catch (e) { } }
  var mb = gate(); if (mb) return mb;   // bảo trì: chặn lượt mới, không lưu làm kết quả cũ
  if (mark) { try { c.put(key, 'RUNNING', 120); } catch (e) { } }
  var out;
  try { out = fn(); } catch (e) { if (mark) { try { c.remove(key); } catch (x) { } } throw e; }
  try {
    if (out && out.ok === false && out.reason === REASONS.BUSY) { if (mark) c.remove(key); }
    else if (!opts.okOnly || (out && out.ok)) c.put(key, JSON.stringify(out), 21600);
    else if (mark) c.remove(key);
  } catch (e) { }
  return out;
}

/**
 * Trình duyệt báo lượt gọi thất bại sau khi đã tự thử lại, và số lần phải thử lại (chunk 5F). Lượt bị Google từ chối
 * không tới được máy chủ nên chỉ trình duyệt biết. Hàm công khai: chỉ cộng bộ đệm số đo, không ghi Sheets, không lấy khoá.
 */
function apiClientReport(kind, n) {
  var k = str_(kind);
  if (['fail', 'retry', 'slow'].indexOf(k) === -1) return { ok: false };
  var count = Math.max(1, Math.min(50, Math.floor(Number(n) || 1)));
  // Chống người ngoài làm bẩn số đo (soát R2 L7): mỗi giờ tối đa 2.000 lượt báo, đếm ở khoá riêng.
  try {
    var c = CacheService.getScriptCache(), key = 'clientrep_' + metricHourKey_(new Date(realNowMs_())), used = Number(c.get(key) || 0);
    if (used >= 2000) return { ok: true };
    c.put(key, String(used + count), 3700);
    metricAdd_('_client_' + k, 0, { count: count, error: k === 'fail' });
  } catch (e) { }
  return { ok: true };
}

/** Câu báo lỗi khi đang xử lý lỗi: nếu đọc tab CONTENT cũng hỏng thì dùng câu gốc trong code. */
function safeReason_(code, lang) {
  try { return reasonText_(code, lang); } catch (e) { return REASON_TEXT_VI[code] || code; }
}
function safePair_(code) {
  try { return reasonPair_(code); } catch (e) { return { vi: REASON_TEXT_VI[code] || code, en: REASON_TEXT_EN_[code] || code }; }
}
/** Nhiều mã lỗi (form đăng ký có thể sai nhiều ô): nối câu của từng mã, mỗi thứ tiếng riêng. */
function reasonsPair_(codes, vars) {
  var ps = codes.map(function (c) { return reasonPair_(c, vars); });
  return { vi: ps.map(function (p) { return p.vi; }).join(' '), en: ps.map(function (p) { return p.en; }).join(' ') };
}

function contactInfo_() {
  // Chỉ Zalo và website (chunk 5A: bỏ nút gọi điện trên web và email; số admin chỉ còn trong Sheets).
  return { zalo: cfg_('ADMIN_ZALO_URL'), site: cfg_('SCHOOL_SITE_URL') };
}

// ── Công khai (không cần đăng nhập) ──

function apiPublicInfo() {
  return apiWrap_('apiPublicInfo', function () {
    var defs = pkgDefs_();
    return {
      ok: true,
      data: {
        school: cfg_('SCHOOL_NAME'),
        packages: (function () { var bad = brokenPackageCodes_(); return Object.keys(defs).map(function (k) { return defs[k]; }).filter(function (p) { return p.active && !bad[p.code]; }); })()   // 5L: gói trùng mã, sai dòng: ẩn
          .map(function (p) { return { code: p.code, name: p.name, nameEn: p.name_en || p.name, type: p.type, days: p.days, sessions: p.sessions, price: p.price_vnd }; }),
        bank: { name: cfg_('BANK_NAME'), account: cfg_('BANK_ACCOUNT'), holder: cfg_('BANK_HOLDER') },
        contact: contactInfo_(),
        policyUrl: cfg_('POLICY_URL'),
        cutoffHour: cfg_('BOOKING_CUTOFF_HOUR'), bookingLeadHours: bookingLeadHours_()
      }
    };
  });
}

function apiSubmitRegistration(form) {
  return apiWrap_('apiSubmitRegistration', function () {
    // Ô ẩn "website": người thật không thấy nên để trống, máy spam thường điền vào.
    if (form && form.website) return { ok: false, reason: REASONS.INVALID_INPUT };
    form = form && typeof form === 'object' ? form : {};
    // Kiểm hạn mức trước (chỉ đọc), kiểm dữ liệu không cần khoá; chỉ đăng ký hợp lệ mới tính vào hạn mức mỗi giờ
    // (20 form rác không làm khoá form của người thật).
    if (!registrationRateOk_(false)) return { ok: false, reason: REASONS.RATE_LIMITED, msgCode: 'REG_RATE_LIMITED' };
    var pre = validateRegistration_(form, pkgDefs_());
    if (!pre.ok) return { ok: false, reason: pre.reasons[0], reasons: pre.reasons };
    var r = submitRegistration_(form);
    if (r.ok) registrationRateOk_(true);
    if (!r.ok) return { ok: false, reason: r.reasons[0], reasons: r.reasons };
    return { ok: true, data: { regId: r.regId, transferCode: r.transferCode } };
  });
}

/** Đếm số đăng ký công khai trong giờ hiện tại (CacheService). Quá REG_MAX_PER_HOUR thì tạm chặn. */
function registrationRateOk_(add) {
  try {
    var c = CacheService.getScriptCache(), key = 'reg:' + Utilities.formatDate(getNow_(), APP.TIMEZONE, 'yyyyMMddHH');
    var n = Number(c.get(key) || 0);
    if (add) { c.put(key, String(n + 1), 3700); return true; }
    if (n >= cfg_('REG_MAX_PER_HOUR')) return false;
  } catch (e) { }
  return true;
}

function apiRequestLogin(email) { return apiWrap_('apiRequestLogin', function () { return requestLoginLink_(email); }); }

function apiExchangeToken(linkToken, device, rid) {
  return apiWrap_('apiExchangeToken', function () {
    // Link dùng 1 lần (tutor, admin): mạng rớt sau khi máy chủ đã nhận link thì lần thử lại cùng mã nhận lại đúng phiên đó.
    return idem_('x|' + sha256Hex_(str_(linkToken)), rid, function () {
      var r = exchangeLoginToken_(linkToken, str_(device).substring(0, 400));
      if (!r.ok) return r;
      // lang: ngôn ngữ đã chọn (trống = chưa chọn: trang hỏi một lần, chunk 5H).
      return { ok: true, data: { sessionToken: r.sessionToken, role: r.role, name: r.name, lang: r.lang || '' } };
    }, { okOnly: true, gate: function () { return loginLinkKnown_(linkToken); } });
  });
}

function apiLogout(token) { return apiWrap_('apiLogout', function () { return logout_(token); }); }

/** Đăng nhập bằng tài khoản Google: đổi chữ ký của dự án phụ lấy phiên (chunk 5D). */
function apiGoogleExchange(email, ts, sig, device, rid) {
  return apiWrap_('apiGoogleExchange', function () {
    return idem_('g|' + sha256Hex_(str_(sig)), rid, function () {
      var r = googleLoginExchange_(email, ts, sig, str_(device).substring(0, 400));
      if (!r.ok) return r;
      return { ok: true, data: { sessionToken: r.sessionToken, role: r.role, name: r.name, lang: r.lang || '' } };
    }, { okOnly: true });
  });
}

/**
 * Người dùng chọn ngôn ngữ (nút VI | EN hoặc hộp hỏi lần đầu, chunk 5H). Ghi USERS.lang để mọi thiết bị và email
 * sau này dùng đúng ngôn ngữ. Chọn lại cùng ngôn ngữ thì không ghi (không lấy khoá).
 */
function apiSetLanguage(token, lang) {
  return apiWrap_('apiSetLanguage', function () {
    var u = requireRole_(token, null), l = str_(lang).toLowerCase();
    // Chunk 5I: admin cũng lưu ngôn ngữ; bảo trì không bao giờ chặn admin (luật 47), nên kiểm bảo trì sau khi biết vai trò.
    if (u.role !== 'ADMIN') { var mb = maintBlock_('apiSetLanguage'); if (mb) return mb; }
    if (LANGS_.indexOf(l) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (userLang_(u) === l) return { ok: true, data: { lang: l } };
    withLock_(function () {
      var fresh = userById_(u.user_id);
      if (fresh) table_('USERS').update(fresh, { lang: l });
      // 5K (anh chốt 01/11): không ghi nhật ký đổi ngôn ngữ (dòng LANG_SET cũ vẫn hiện tên, key ad.act.LANG_SET giữ lại).
    });
    USER_LANG_MEMO_ = null;
    return { ok: true, data: { lang: l } };
  });
}

// 16/10: bỏ apiMySessions và apiLogoutAll (danh sách thiết bị, Thoát mọi thiết bị) khỏi cổng học viên và tutor.
// Admin vẫn thoát mọi phiên của một người trong trang quản trị (apiAdminLogoutUser).

// ── Học viên ──

function bookingViewForStudent_(b, now) {
  var t = userById_(b.tutor_id) || {};
  return {
    bookingId: b.booking_id, date: dateKey_(b.date), slot: b.slot, slotLabel: slotLabel_(b.slot),
    status: b.status, awaiting: bookingAwaiting_(b, now),   // trình duyệt dựng nhãn trạng thái theo ngôn ngữ (chunk 5H)
    // Buổi đã diễn ra nhưng tutor chưa xác nhận: không hiện "Xác nhận" trong Lịch sử để học viên khỏi hiểu nhầm.
    tutorName: t.name || '', meetLink: b.meet_link, inviteWhen: calendarInviteWhen_(b, now),
    canCancel: b.status === BOOKING_STATUS.CONFIRMED && now < cancelDeadline_(b.date),
    cancelDeadline: fmtDateTime_(cancelDeadline_(b.date))
  };
}

function apiStudentHome(token, opts) {
  return apiWrap_('apiStudentHome', function () {
    return { ok: true, data: studentHomeData_(requireRole_(token, 'STUDENT'), opts) };
  });
}
/** Dữ liệu cổng học viên (tách riêng để menu Đo tốc độ đo được đúng phần việc này). */
function studentHomeData_(u, opts) {
  {
    var now = getNow_(), defs = pkgDefs_(), bks = studentBookings_(u.user_id);
    var upcoming = [], history = [];
    bks.slice().sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); }).forEach(function (b) {
      var v = bookingViewForStudent_(b, now);
      if (b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now) upcoming.push(v); else history.unshift(v);
    });
    var sps = studentPackages_(u.user_id), slots = opts && opts.slots ? availableSlotsFor_(u.user_id, dateKey_(now), 14) : null;
    return {
        profile: { name: u.name, email: u.email, phone: u.phone, phoneDisplay: phoneDisplay_(u.phone), level: u.level, status: u.status, needsPhone: false, lang: userLang_(u) },
        packages: sps.map(function (sp) { return pkgSummary_(sp, defs[sp.package_code] || { code: sp.package_code, type: 'DAYS' }, bks); }),
        weekBanner: studentWeekBanner_(u, sps, now, slots),
        upcoming: upcoming, history: history.slice(0, 50), contact: contactInfo_(), now: fmtDateTime_(now),
        rules: { bookingLeadHours: bookingLeadHours_(), cutoffHour: cfg_('BOOKING_CUTOFF_HOUR'), cancelHour: cfg_('CANCEL_CUTOFF_HOUR') },
        // Chunk 5F: mở cổng kèm luôn slot 14 ngày (1 lượt gọi thay vì 2; BOOKINGS đã đọc ở trên nên không đọc lại).
        slots: slots
    };
  }
}

/**
 * Chunk 5J (anh chốt 01/11, thay email Chủ nhật): thông báo "đã có giờ học tuần sau" trên trang học viên.
 * Hiện từ STUDENT_WEEK_BANNER_FROM (mặc định 00:00 thứ Bảy) tới 00:00 thứ Hai, khi tuần sau có ít nhất một giờ còn đặt được,
 * chỉ cho học viên ACTIVE có gói chưa kích hoạt, nối đuôi, hoặc còn hạn trong tuần sau. Dùng lại lưới slot đã đệm (không đọc thêm
 * Sheets khi trang đã lấy slot 14 ngày). Trả { week: 'yyyy-MM-dd', monday: 'dd/MM', cutoff } hoặc null.
 */
function studentWeekBanner_(u, sps, now, slots) {
  if (u.status !== USER_STATUS.ACTIVE) return null;
  var mon = nextWeekMonday_(now), from = dowHourBefore_(tutorSchedule_().banner, mon);
  // Soát 5J L1: hết hiện lúc hạn đặt buổi thứ Hai (15:00 Chủ nhật), câu thông báo nói về hạn này.
  if (now < from || !(now < bookingDeadline_(mon))) return null;
  var mk = dateKey_(mon), sk = dateKey_(addDays_(mon, 6)), list = slots || slotGrid_(mon, 7);
  // Soát 5J L2: chỉ mời khi học viên đặt được thật: ngày còn giờ trống, chưa có buổi ngày đó, gói phủ ngày đó và còn lượt.
  var defs = pkgDefs_(), bks = studentBookings_(u.user_id), mine = {}, maxDay = Number(cfg_('MAX_BOOKINGS_PER_DAY')) || 1;
  bks.forEach(function (b) { if (bookingDeducts_(b) && b.date instanceof Date) { var k = dateKey_(b.date); mine[k] = (mine[k] || 0) + 1; } });
  var has = list.some(function (g) {
    if (!(g.date >= mk && g.date <= sk) || !g.slots || !g.slots.length || (mine[g.date] || 0) >= maxDay) return false;
    var d = parseDateKey_(g.date);
    return !!d && resolvePackageForDate_(sps, defs, bks, d, {}).ok;
  });
  return has ? { week: mk, monday: pad2_(mon.getDate()) + '/' + pad2_(mon.getMonth() + 1), cutoff: cfg_('BOOKING_CUTOFF_HOUR') + ':00' } : null;
}

function apiStudentSlots(token, fromKey, days) {
  return apiWrap_('apiStudentSlots', function () {
    var u = requireRole_(token, 'STUDENT');
    return { ok: true, data: availableSlotsFor_(u.user_id, fromKey || dateKey_(getNow_()), Math.min(Number(days) || 14, 21)) };
  });
}

function apiStudentBook(token, requests, rid) {
  return apiWrap_('apiStudentBook', function () {
    var u = requireRole_(token, 'STUDENT');
    return idem_(u.user_id + '|book', rid, function () {
      var res = bookSessionsFor_(u.user_id, requests, u.email, { requestId: rid });
      res.forEach(function (r) { if (!r.ok) { r.msg = reasonPair_(r.reason); r.message = r.msg.vi; } });
      return { ok: true, data: res };
    });
  });
}

function apiStudentCancel(token, bookingId, rid) {
  return apiWrap_('apiStudentCancel', function () {
    var u = requireRole_(token, 'STUDENT');
    return idem_(u.user_id + '|cancel', rid, function () { return cancelBookingFor_(u.user_id, String(bookingId || ''), u.email); });
  });
}

/** Học viên tự sửa tên hiển thị, số điện thoại, level (brief mục D). */
function apiStudentUpdateProfile(token, patch) {
  return apiWrap_('apiStudentUpdateProfile', function () {
    var u = requireRole_(token, 'STUDENT');
    var p = patch || {}, out = {};
    if (p.name !== undefined) { var n = String(p.name).trim(); if (!n || n.length > 80) return { ok: false, reason: REASONS.INVALID_INPUT }; out.name = n; }
    if (p.level !== undefined) out.level = String(p.level).trim().substring(0, 20);
    if (p.phone !== undefined) {   // soát 5K L4: để trống là xoá số và link Zalo
      var ph = normalizePhone_(p.phone, false);
      if (!ph.ok) return { ok: false, reason: REASONS.INVALID_PHONE };
      out.phone = ph.phone; out.contact_link = contactFormula_(ph.phone);
    }
    return withLock_(function () {
      var fresh = userById_(u.user_id);
      table_('USERS').update(fresh, out);
      logActivity_(u.email, 'PROFILE_UPDATED', 'USER', u.user_id, Object.keys(out).join(','));
      return { ok: true };
    });
  });
}

/** Gia hạn: dùng lại form đăng ký, email lấy từ phiên để không ai gia hạn hộ email khác. */
function apiStudentRenew(token, form) {
  return apiWrap_('apiStudentRenew', function () {
    var u = requireRole_(token, 'STUDENT');
    var f = Object.assign({}, form || {}, { email: u.email, name: u.name, phone: (form && form.phone) || u.phone, consent: true });
    var r = submitRegistration_(f);
    if (!r.ok) return { ok: false, reason: r.reasons[0], reasons: r.reasons };
    return { ok: true, data: { regId: r.regId, transferCode: r.transferCode } };
  });
}

// ── Tutor ──

function apiTutorHome(token) {
  return apiWrap_('apiTutorHome', function () {
    var u = requireRole_(token, 'TUTOR');
    return { ok: true, data: { profile: { name: u.name, email: u.email, lang: userLang_(u) }, schedule: tutorScheduleFor_(u.user_id), contact: contactInfo_(), now: fmtDateTime_(getNow_()),
      // Chunk 5J: số giờ báo đỏ và số giờ thành Không hoàn thành (chữ trên tab Cần xác nhận).
      rules: { notice: Number(cfg_('RESULT_NOTICE_AFTER_HOURS')), expire: Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) } } };
  });
}

function apiTutorAvailability(token, fromKey, days) {
  return apiWrap_('apiTutorAvailability', function () {
    var u = requireRole_(token, 'TUTOR');
    var start = parseDateKey_(fromKey) || mondayOf_(getNow_()), n = Math.min(Number(days) || 14, 21);
    var weeks = [];
    for (var w = 0; w < Math.ceil(n / 7); w++) { var mon = addDays_(mondayOf_(start), w * 7); weeks.push({ monday: dateKey_(mon), deadline: fmtDateTime_(tutorWeekDeadline_(mon)), deadlinePassed: !(getNow_() < tutorWeekDeadline_(mon)) }); }
    return { ok: true, data: { slots: slotList_(), items: availabilityFor_(u.user_id, dateKey_(mondayOf_(start)), n), weeks: weeks, now: fmtDateTime_(getNow_()) } };
  });
}

function apiTutorSetAvailability(token, changes, rid) {
  return apiWrap_('apiTutorSetAvailability', function () {
    var u = requireRole_(token, 'TUTOR');
    return idem_(u.user_id + '|avail', rid, function () { return { ok: true, data: setAvailabilityFor_(u.user_id, changes, u.email) }; });
  });
}

function apiTutorSubmitResult(token, bookingId, result, rid) {
  return apiWrap_('apiTutorSubmitResult', function () {
    var u = requireRole_(token, 'TUTOR');
    return idem_(u.user_id + '|result', rid, function () { return submitSessionResultFor_(u.user_id, String(bookingId || ''), String(result || ''), u.email, { session: u._sid }); });
  });
}

/**
 * Tutor xác nhận nhiều buổi một lần (chunk 5F, xác nhận 2 bước: chọn kết quả từng buổi, xem lại, rồi mới Lưu).
 * items: [{ bookingId, result }], tối đa 30. Một lần lấy khoá cho cả lô. Trả kết quả từng buổi.
 */
function apiTutorSubmitResults(token, items, rid) {
  return apiWrap_('apiTutorSubmitResults', function () {
    var u = requireRole_(token, 'TUTOR');
    if (!Array.isArray(items) || !items.length || items.length > 30) return { ok: false, reason: REASONS.INVALID_INPUT };
    return idem_(u.user_id + '|results', rid, function () {
      var out = withLock_(function () {
        return items.map(function (it) {
          var id = str_(it && it.bookingId), res = str_(it && it.result);
          var r = submitSessionResultFor_(u.user_id, id, res, u.email, { session: u._sid });
          var p = r.ok ? null : reasonPair_(r.reason);
          return { bookingId: id, result: res, ok: r.ok, reason: r.reason, message: p ? p.en : '', msg: p };
        });
      });
      return { ok: true, data: { items: out, saved: out.filter(function (x) { return x.ok; }).length } };
    });
  });
}

/** Số buổi của chính tutor tháng này và tháng trước, cùng luật với báo cáo lương (chunk 5D). */
function apiTutorStats(token) {
  return apiWrap_('apiTutorStats', function () {
    var u = requireRole_(token, 'TUTOR');
    return { ok: true, data: tutorMonthStats_(u.user_id) };
  });
}
