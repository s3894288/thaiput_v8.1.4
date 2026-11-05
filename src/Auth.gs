/**
 * Auth.gs · Đăng nhập bằng link email và phiên làm việc (v8, câu 32, plan mục 4.8)
 *
 * Không có mật khẩu. Người dùng nhập email, nhận link (hạn theo vai trò: STUDENT_, TUTOR_, ADMIN_LINK_MINUTES, chunk 5J):
 * tutor và admin dùng 1 lần (chunk 5D). Bấm link thì được phiên theo vai trò (SESSION_DAYS, TUTOR_SESSION_DAYS, ADMIN_SESSION_DAYS).
 * Admin còn đăng nhập được bằng tài khoản Google (googleLoginExchange_). Trình duyệt chỉ giữ token phiên; server chỉ lưu mã băm SHA 256,
 * nên dù ai đọc được tab AUTH cũng không dùng được token.
 * Mọi hàm API phải gọi requireRole_ trước khi làm gì khác (CLAUDE.md luật 6).
 */

/**
 * Chặn gọi hàm vận hành từ trang web. Với web app "Anyone", google.script.run gọi được MỌI hàm không có dấu _ ở cuối,
 * kể cả menu, job, cài đặt. Các hàm đó phải gọi requireOperator_(e) đầu tiên:
 *   được chạy khi là trigger của chính project này (e.triggerUid khớp), hoặc người chạy là chủ script hay admin
 *   (bấm menu trong Sheets, chạy trong trình soạn thảo). Người lạ trên web: Session.getActiveUser() rỗng nên bị chặn.
 */
function requireOperator_(e) {
  if (isProjectTriggerEvent_(e) || isOperator_()) return;
  throw new Error('Không có quyền chạy hàm này.');
}
/**
 * Cài đặt, tạo trigger, chuyển PRODUCTION: chỉ chủ file Sheets. Trigger thuộc về người tạo, nên nếu một admin khác
 * bấm "Tạo lại trigger" sẽ có 2 bộ trigger chạy song song (gửi email trùng, xử lý dropdown 2 lần).
 */
function requireOwner_(e) {
  requireOperator_(e);
  var who = '', owner = '';
  try { who = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); } catch (x) { }
  try { var ss = SpreadsheetApp.getActive(); owner = String(DriveApp.getFileById(ss.getId()).getOwner().getEmail() || '').trim().toLowerCase(); } catch (x) { }
  // Không xác định được chủ file (ví dụ file nằm trong Bộ nhớ dùng chung): từ chối, không mở cửa cho mọi admin.
  if (!owner) throw new Error('Không xác định được chủ file Sheets. File DB phải nằm trong Drive của tài khoản chạy hệ thống (không đặt trong Bộ nhớ dùng chung).');
  if (who !== owner) throw new Error('Chỉ chủ file (' + owner + ') được chạy cài đặt và tạo trigger, để không có 2 bộ trigger chạy song song.');
}
function isProjectTriggerEvent_(e) {
  if (!e || typeof e !== 'object' || !e.triggerUid) return false;
  var id = String(e.triggerUid);
  try { return ScriptApp.getProjectTriggers().some(function (t) { return String(t.getUniqueId()) === id; }); } catch (x) { return false; }
}
function isOperator_() {
  var who = '';
  try { who = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); } catch (x) { }
  if (!who) return false;
  var owner = '';
  try { owner = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase(); } catch (x) { }
  if (who === owner) return true;
  try {
    if (cfgList_('ADMIN_EMAIL').map(function (x) { return x.toLowerCase(); }).indexOf(who) !== -1) return true;
    return table_('USERS').all().some(function (u) { return u.role === 'ADMIN' && u.status !== USER_STATUS.DISABLED && String(u.email).trim().toLowerCase() === who; });
  } catch (x) { return false; }
}

function sha256Hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
}
function randomToken_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }

/** Tạo link đăng nhập 1 lần cho user. Gọi bên trong withLock_ (dùng chung với approveRegistration_). */
function createLoginLinkInLock_(user) {
  var raw = randomToken_(), now = getNow_();
  // Chunk 5J: hạn link theo vai trò (học viên, tutor 15 phút; admin 24 giờ), tính lúc tạo.
  table_('AUTH').insert({ token_hash: sha256Hex_(raw), user_id: user.user_id, kind: 'LINK', expires_at: new Date(now.getTime() + linkMinutesFor_(user) * 60000), created_at: now });
  return portalUrl_('auth') + '&t=' + raw;
}

/** Dùng làm loginUrlFn cho approveRegistration_ (email chào mừng có link đăng nhập thật). */
function loginUrlFor_(user) { return createLoginLinkInLock_(user); }

/**
 * Người dùng xin link đăng nhập. Luôn trả cùng một câu cho email có và không có trong hệ thống,
 * để người ngoài không dò được danh sách học viên (A06).
 * Chunk 5J (anh chốt 01/11): mỗi email xin tối đa 1 lần trong LOGIN_LINK_COOLDOWN_MINUTES phút, mọi vai trò. Đếm trong bộ đệm
 * (không ghi Sheets, không lấy khoá: luật 37). Xin lại trong thời gian chờ: báo giờ đã gửi và giờ xin lại được, giống nhau cho mọi email.
 * Admin gửi hộ bằng menu "Gửi link đăng nhập" không đi qua hàm này nên không bị giới hạn.
 */
function requestLoginLink_(email) {
  var e = str_(email).trim().toLowerCase();
  if (!isEmail_(e)) return { ok: false, reason: REASONS.INVALID_INPUT };
  var cache = CacheService.getScriptCache(), key = 'login_cd_' + sha256Hex_(e).substring(0, 32);
  var now = getNow_(), cd = Math.min(360, Math.max(1, Number(cfg_('LOGIN_LINK_COOLDOWN_MINUTES')) || 60)) /* trần 360 phút = hạn tối đa của bộ đệm */, prev = Number(cache.get(key) || 0);
  if (prev && now.getTime() - prev < cd * 60000) {
    var hm = function (ms) { var d = new Date(ms); return pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()); };
    return { ok: false, reason: REASONS.LINK_COOLDOWN, vars: { sent: hm(prev), next: hm(prev + cd * 60000) } };
  }
  // Soát 5J M1: chỉ đóng dấu thời gian chờ khi lượt xin đã xong (khoá bận, gửi thư lỗi: không đóng dấu, xin lại được ngay).
  var stamp = function () { cache.put(key, String(now.getTime()), Math.min(21600, cd * 60)); };
  // Email không có trong hệ thống: trả cùng một câu, không lấy khoá (luật 37).
  var pre = userByEmail_(e);
  if (!pre) { stamp(); return { ok: true, reason: REASONS.OK }; }
  var sent = withLock_(function () {
    var u = userByEmail_(e);
    var roleOk = u && (u.role === 'STUDENT' || u.role === 'TUTOR' || (u.role === 'ADMIN' && cfg_('ADMIN_LINK_LOGIN')));
    if (roleOk && u.status !== USER_STATUS.DISABLED) {
      var url = createLoginLinkInLock_(u);
      var okMail = mailLoginLink_(u, url) !== false;
      logActivity_(e, 'LOGIN_LINK_SENT', 'USER', u.user_id, okMail ? '' : { mail: 'FAILED' });
      return okMail;
    }
    return true;
  });
  if (sent) stamp();
  return { ok: true, reason: REASONS.OK };
}

/** Tutor và admin: link dùng 1 lần, phiên dài theo vai trò, email báo đăng nhập mới (chunk 5D). */
function isStaff_(u) { return !!u && (u.role === 'TUTOR' || u.role === 'ADMIN'); }
function sessionDaysFor_(u) {
  if (u.role === 'TUTOR') return cfg_('TUTOR_SESSION_DAYS');
  if (u.role === 'ADMIN') return cfg_('ADMIN_SESSION_DAYS');
  return cfg_('SESSION_DAYS');
}
/** Chunk 5J: hạn và số lần bấm của link theo vai trò (0 = không giới hạn số lần). */
function linkRolePrefix_(u) { return u && u.role === 'ADMIN' ? 'ADMIN' : u && u.role === 'TUTOR' ? 'TUTOR' : 'STUDENT'; }
function linkMinutesFor_(u) { return Math.max(1, Number(cfg_(linkRolePrefix_(u) + '_LINK_MINUTES')) || 15); }
function linkMaxUsesFor_(u) { return Number(cfg_(linkRolePrefix_(u) + '_LINK_MAX_USES')) || 0; }

/** Tên thiết bị đọc được từ chuỗi trình duyệt gửi lên, ví dụ "Chrome · Windows". Không lưu nguyên chuỗi. */
function deviceLabel_(ua) {
  var s = String(ua || '');
  // Chỉ tên riêng (Chrome, iOS...), không chữ tiếng Việt hay tiếng Anh, vì nhãn được lưu vào AUTH và hiện cho cả học viên lẫn tutor.
  if (!s) return 'Web';
  var os = /iPhone|iPad|iPod/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Windows/.test(s) ? 'Windows' : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : '';
  var br = /Edg\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera' : /CriOS|Chrome\//.test(s) ? 'Chrome' : /FxiOS|Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : 'Web';
  if (/Zalo/i.test(s)) br = 'Zalo';
  return os ? br + ' · ' + os : br;
}

/** Tạo một phiên cho user. Gọi trong withLock_. via: LINK hoặc GOOGLE. Trả token phiên (chỉ trả một lần, server giữ mã băm). */
function createSessionInLock_(u, device, via) {
  var now = getNow_(), session = randomToken_();
  table_('AUTH').insert({ token_hash: sha256Hex_(session), user_id: u.user_id, kind: 'SESSION', expires_at: new Date(now.getTime() + sessionDaysFor_(u) * 86400000),
    created_at: now, device: deviceLabel_(device) + (via === 'GOOGLE' ? ' · Google' : '') });
  table_('USERS').update(u, { last_login_at: now });
  logActivity_(u.email, 'LOGIN', 'USER', u.user_id, { via: via || 'LINK', device: deviceLabel_(device), session: sha256Hex_(session).substring(0, 12) });
  return session;
}

/** Đổi link lấy token phiên. Trả { ok, sessionToken, role, name } hoặc { ok: false, reason }. device: chuỗi trình duyệt. */
/** Link có trong AUTH không (chỉ đọc, không khoá). Dùng làm bước kiểm rẻ trước khi lấy khoá hay ghi bộ đệm (luật 37). */
function loginLinkKnown_(raw) {
  raw = str_(raw);
  if (!/^[a-f0-9]{32,128}$/i.test(raw)) return false;
  var hh = sha256Hex_(raw);
  return !!table_('AUTH').find(function (a) { return a.token_hash === hh && a.kind === 'LINK'; });
}
function exchangeLoginToken_(raw, device) {
  raw = str_(raw); device = str_(device);
  // Mã sai dạng hoặc không có trong AUTH: trả lỗi ngay, không lấy khoá (luật 37). Có thì kiểm lại trong khoá.
  if (!loginLinkKnown_(raw)) return { ok: false, reason: REASONS.LINK_INVALID };
  var out = withLock_(function () {
    var t = table_('AUTH'), now = getNow_(), h = sha256Hex_(raw);
    var link = t.find(function (a) { return a.token_hash === h && a.kind === 'LINK'; });
    if (!link) return { ok: false, reason: REASONS.LINK_INVALID };
    var u = userById_(link.user_id);
    // Số lần bấm theo vai trò (STUDENT_, TUTOR_, ADMIN_LINK_MAX_USES; 0 = không giới hạn trong hạn link). Chunk 5J.
    var maxUses = u ? linkMaxUsesFor_(u) : 1, used = Number(link.use_count) || (link.used_at ? 1 : 0);
    if (!(now < new Date(link.expires_at))) return { ok: false, reason: REASONS.LINK_EXPIRED };
    if (maxUses > 0 && used >= maxUses) return { ok: false, reason: REASONS.LINK_USED };
    if (!u || u.status === USER_STATUS.DISABLED) return { ok: false, reason: REASONS.FORBIDDEN };
    if (u.role === 'ADMIN' && !cfg_('ADMIN_LINK_LOGIN')) return { ok: false, reason: REASONS.FORBIDDEN };
    t.update(link, { used_at: link.used_at || now, use_count: used + 1 });
    var session = createSessionInLock_(u, device, 'LINK');
    return { ok: true, sessionToken: session, role: u.role, name: u.name, lang: userLang_(u), _user: u };
  });
  // Email gửi sau khi kết quả đã lưu cho lần gửi lại cùng mã (soát R2 T1): mạng rớt rồi gửi lại thì nhận đúng phiên, không LINK_USED.
  if (out.ok && isStaff_(out._user)) { var nu = out._user; afterResponse_(function () { mailNewLogin_(nu, device, 'LINK'); }); }
  delete out._user;
  return out;
}

/** Email "Có đăng nhập mới" (STAFF_NEW_LOGIN_EMAIL, vai trò trong NEW_LOGIN_EMAIL_ROLES, mặc định chỉ ADMIN từ 16/10). Không bao giờ làm hỏng đăng nhập. */
function mailNewLogin_(u, device, via) {
  try {
    if (!cfg_('STAFF_NEW_LOGIN_EMAIL')) return false;
    if (cfgList_('NEW_LOGIN_EMAIL_ROLES').map(function (r) { return r.toUpperCase(); }).indexOf(u.role) === -1) return false;
    return sendTpl_('STAFF_NEW_LOGIN', u.email, { name: u.name, device: deviceLabel_(device), time: fmtDateTime_(getNow_()),
      via: via === 'GOOGLE' ? 'Google' : contentText_('a.via_link'), via_en: via === 'GOOGLE' ? 'Google' : contentText_('a.via_link', null, 'en'), portal_url: portalUrl_(u.role === 'ADMIN' ? 'admin' : 'tutor') },
      { enFirst: u.role === 'TUTOR', kind: 'STAFF_NEW_LOGIN' });
  } catch (e) { Logger.log('mailNewLogin_ lỗi: ' + e.message); return false; }
}

/**
 * Xác thực phiên và vai trò. Trả dòng USERS của người đang đăng nhập.
 * Sai thì ném lỗi có mã 'AUTH:SESSION_INVALID' hoặc 'AUTH:FORBIDDEN' để Api.gs trả mã cho trang web.
 */
/** Chỉ nhận chuỗi từ trình duyệt (google.script.run cho gửi cả object lạ, String() trên object lạ có thể ném lỗi). */
function str_(x) { return typeof x === 'string' ? x : (typeof x === 'number' && isFinite(x) ? String(x) : ''); }

function requireRole_(token, role) {
  token = str_(token);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('AUTH:' + REASONS.SESSION_INVALID);
  var h = sha256Hex_(token), now = getNow_();
  var s = sessionLookup_(h);
  if (!s || !(now.getTime() < s.exp)) throw new Error('AUTH:' + REASONS.SESSION_INVALID);
  var u = userById_(s.uid);
  if (!u || u.status === USER_STATUS.DISABLED) throw new Error('AUTH:' + REASONS.SESSION_INVALID);
  if (role && u.role !== role) {
    logActivity_(u.email, 'FORBIDDEN_ROLE', 'USER', u.user_id, JSON.stringify({ need: role }));
    throw new Error('AUTH:' + REASONS.FORBIDDEN);
  }
  u._sid = h.substring(0, 12);   // mã ngắn của phiên, ghi vào nhật ký để biết thao tác đến từ thiết bị nào
  u._sessionHash = h;
  return u;
}

/**
 * Tìm phiên theo mã băm. Bộ nhớ đệm SESSION_CACHE_SECONDS giây để không đọc cả tab AUTH mỗi lần gọi (chunk 5D).
 * Thoát, thoát mọi thiết bị, xoá dữ liệu test đều xoá khoá đệm tương ứng nên phiên bị huỷ hết hiệu lực ngay.
 */
function sessionCacheKey_(h) { return 'sess_' + String(h).substring(0, 48); }
function revokeCacheKey_(uid) { return 'rev_' + String(uid); }
/** Thời gian đệm, tối đa 6 giờ (giới hạn của CacheService; giá trị lớn hơn bị Google từ chối). */
function sessionCacheSeconds_() { return Math.max(1, Math.min(21600, Number(cfg_('SESSION_CACHE_SECONDS')) || 1)); }
/**
 * Bản đệm ghi kèm ct (thời điểm TRƯỚC khi đọc AUTH). Thoát hoặc thoát mọi thiết bị ghi mốc rev_<user>.
 * Bản đệm có ct không mới hơn mốc đó bị bỏ, đọc lại AUTH. Nhờ vậy một lần gọi đọc AUTH ngay trước khi thoát
 * (đang chạy song song) không thể giữ phiên cũ sống thêm trong bộ đệm.
 */
function sessionLookup_(h) {
  var cache = null, t0 = Date.now();
  try {
    cache = CacheService.getScriptCache();
    var hit = cache.get(sessionCacheKey_(h));
    if (hit) {
      var o = JSON.parse(hit), rev = Number(cache.get(revokeCacheKey_(o.uid)) || 0);
      if (!rev || o.ct > rev) return o;
    }
  } catch (e) { cache = null; }
  var row = table_('AUTH').find(function (a) { return a.token_hash === h && a.kind === 'SESSION'; });
  if (!row) return null;
  var out = { uid: row.user_id, exp: new Date(row.expires_at).getTime(), ct: t0 };
  try { if (cache && out.exp > getNow_().getTime()) cache.put(sessionCacheKey_(h), JSON.stringify(out), sessionCacheSeconds_()); } catch (e) { }
  return out;
}
/** Gọi SAU khi đã ghi xuống Sheets (ra khỏi withLock_), để lần đọc lại chắc chắn thấy dữ liệu mới. */
function forgetSessions_(hashes, userIds) {
  try {
    var c = CacheService.getScriptCache(), now = String(Date.now());
    (hashes || []).forEach(function (h) { c.remove(sessionCacheKey_(h)); });
    (userIds || []).forEach(function (u) { c.put(revokeCacheKey_(u), now, 21600); });
  } catch (e) { }
}

function logout_(token) {
  token = str_(token);
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: true };
  var h = sha256Hex_(token);
  if (!table_('AUTH').find(function (a) { return a.token_hash === h && a.kind === 'SESSION'; })) return { ok: true };   // không lấy khoá cho mã lạ
  var uid = withLock_(function () {
    var t = table_('AUTH');
    var s = t.find(function (a) { return a.token_hash === h && a.kind === 'SESSION'; });
    if (s) t.update(s, { expires_at: getNow_() });
    // Chunk 5I: nhật ký ghi mọi hoạt động, kể cả thoát.
    if (s) { var who = userById_(s.user_id); logActivity_(who ? who.email : s.user_id, 'LOGOUT', 'USER', s.user_id, String(s.device || '').substring(0, 120)); }
    return s ? s.user_id : null;
  });
  forgetSessions_([h], uid ? [uid] : []);
  return { ok: true };
}

/** Các phiên còn hạn của user (thiết bị đang đăng nhập). currentHash: phiên đang gọi. */
function listSessions_(userId, currentHash) {
  var now = getNow_();
  return table_('AUTH').filter(function (a) { return a.kind === 'SESSION' && a.user_id === userId && now < new Date(a.expires_at); })
    .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })
    .map(function (a) { return { id: String(a.token_hash).substring(0, 12), device: a.device || 'Web', created: fmtDateTime_(new Date(a.created_at)), expires: fmtDate_(new Date(a.expires_at)), current: a.token_hash === currentHash }; });
}

/** Thoát mọi thiết bị của user, kể cả thiết bị đang dùng. Chunk 5J: huỷ cả link đăng nhập còn hạn (thư bị chuyển tiếp không mở được phiên mới). */
function logoutAll_(u, actor) {
  var hashes = withLock_(function () {
    var t = table_('AUTH'), now = getNow_(), list = [], links = 0;
    t.filter(function (a) { return (a.kind === 'SESSION' || a.kind === 'LINK') && a.user_id === u.user_id && now < new Date(a.expires_at); }).forEach(function (a) {
      t.update(a, { expires_at: now });
      if (a.kind === 'SESSION') list.push(a.token_hash); else links++;
    });
    logActivity_(actor || u.email, 'LOGOUT_ALL', 'USER', u.user_id, JSON.stringify({ sessions: list.length, links: links }));
    return list;
  });
  forgetSessions_(hashes, [u.user_id]);
  return { ok: true, count: hashes.length };
}

/**
 * Tài khoản đang DISABLED: huỷ hẳn mọi phiên còn hạn (job mỗi giờ). Nếu không, mở lại tài khoản sẽ làm phiên cũ
 * (ví dụ trên điện thoại bị mất) sống lại. Gọi trong withLock_; trả danh sách { hashes, users } để xoá bộ đệm sau khi ghi.
 */
function revokeDisabledSessionsInLock_(now) {
  var off = {}, out = { hashes: [], users: [] };
  table_('USERS').all().forEach(function (u) { if (u.status === USER_STATUS.DISABLED) off[u.user_id] = true; });
  if (!Object.keys(off).length) return out;
  var t = table_('AUTH');
  // Chunk 5J: huỷ cả link còn hạn của tài khoản bị khoá.
  t.filter(function (a) { return (a.kind === 'SESSION' || a.kind === 'LINK') && off[a.user_id] && now < new Date(a.expires_at); }).forEach(function (a) {
    t.update(a, { expires_at: now });
    if (a.kind !== 'SESSION') return;
    out.hashes.push(a.token_hash);
    if (out.users.indexOf(a.user_id) === -1) out.users.push(a.user_id);
  });
  if (out.users.length) logActivity_('SYSTEM', 'SESSIONS_REVOKED_DISABLED', 'USER', out.users.join(','), String(out.hashes.length));
  return out;
}

/** Dọn tab AUTH: bỏ link và phiên đã hết hạn quá AUTH_PURGE_AFTER_DAYS ngày. Gọi từ job mỗi giờ, 1 lần mỗi ngày. */
function purgeAuthInLock_(now) {
  var limit = now.getTime() - cfg_('AUTH_PURGE_AFTER_DAYS') * 86400000;
  return purgeRows_('AUTH', function (a) { var e = new Date(a.expires_at).getTime(); return !(e < limit); });
}

// ── Đăng nhập bằng tài khoản Google (chunk 5D, thử nghiệm) ──
//
// Dự án phụ "thaiput Google login" chạy với quyền NGƯỜI TRUY CẬP, nên Google cho biết email đang đăng nhập.
// Nó ký (email | thời điểm) bằng khoá bí mật chung (HMAC SHA 256) rồi chuyển người dùng sang trang chính.
// Trang chính kiểm chữ ký, hạn 2 phút, chỉ dùng 1 lần, vai trò nằm trong GOOGLE_LOGIN_ROLES.
// Khoá bí mật nằm trong Script Properties của cả hai dự án, không nằm trong Sheets.

var GOOGLE_LOGIN_MAX_AGE_MS_ = 120000;
function googleLoginSignature_(secret, email, ts) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(email).toLowerCase() + '|' + ts, secret)).replace(/=+$/, '');
}
/** So sánh không phụ thuộc vị trí ký tự sai đầu tiên (không lộ thông tin qua thời gian chạy). */
function sameString_(a, b) {
  a = String(a); b = String(b);
  var diff = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
/**
 * Người lạ gửi chữ ký sai: KHÔNG ghi Sheets, KHÔNG lấy khoá (tránh làm đầy nhật ký và chặn người dùng thật).
 * Chỉ đếm trong bộ đệm theo cửa sổ 10 phút để theo dõi (googleLoginBadCount_(false) đọc số hiện tại).
 * Không chặn chữ ký đúng dù số lần sai cao: chữ ký HMAC không giả được, chặn chỉ giúp kẻ phá khoá được admin.
 */
function googleLoginBadCount_(add) {
  try {
    var c = CacheService.getScriptCache(), key = 'gl_bad_' + Math.floor(Date.now() / 600000), n = Number(c.get(key) || 0);
    if (add) c.put(key, String(n + 1), 900);
    return n + (add ? 1 : 0);
  } catch (e) { return 0; }
}
/** Chữ ký đã dùng: lưu trong Script Properties (bộ đệm có thể bị Google xoá sớm), giữ 5 phút. Gọi trong withLock_. */
function googleLoginMarkUsed_(sig) {
  var p = props_(), now = Date.now(), list = {};
  try { list = JSON.parse(p.getProperty('GL_USED') || '{}'); } catch (e) { list = {}; }
  Object.keys(list).forEach(function (k) { if (now - list[k] > 300000) delete list[k]; });
  var key = String(sig).substring(0, 43);
  if (list[key]) return false;
  list[key] = now;
  p.setProperty('GL_USED', JSON.stringify(list));
  return true;
}
function googleLoginExchange_(email, ts, sig, device) {
  var secret = props_().getProperty('GOOGLE_LOGIN_SECRET');
  email = str_(email); ts = str_(ts); sig = str_(sig); device = str_(device);
  var e = email.trim().toLowerCase(), t = Number(ts);
  // Kiểm chữ ký trước: chữ ký đúng không bao giờ bị chặn (người lạ không làm khoá được đăng nhập Google của admin).
  // Chữ ký sai chỉ đếm trong bộ đệm; quá ngưỡng thì từ chối sớm, không tính HMAC.
  var bad = function () { googleLoginBadCount_(true); return { ok: false, reason: REASONS.GLOGIN_INVALID }; };
  if (!secret || !isEmail_(e) || !/^\d{10,16}$/.test(ts) || !/^[A-Za-z0-9_-]{20,100}$/.test(sig)) return bad();
  if (!sameString_(googleLoginSignature_(secret, e, ts), sig)) return bad();
  if (Math.abs(realNowMs_() - t) > GOOGLE_LOGIN_MAX_AGE_MS_) return { ok: false, reason: REASONS.GLOGIN_EXPIRED };
  var out = withLock_(function () {
    if (!googleLoginMarkUsed_(sig)) return { ok: false, reason: REASONS.GLOGIN_USED };
    var u = userByEmail_(e), roles = cfgList_('GOOGLE_LOGIN_ROLES').map(function (r) { return r.toUpperCase(); });
    if (!u || u.status !== USER_STATUS.ACTIVE || roles.indexOf(u.role) === -1) {
      logActivity_(e, 'GOOGLE_LOGIN_DENIED', 'USER', u ? u.user_id : '', JSON.stringify(u ? { role: u.role, status: u.status } : { account: 'NONE' }));
      return { ok: false, reason: REASONS.GLOGIN_DENIED, vars: { email: e } };
    }
    return { ok: true, sessionToken: createSessionInLock_(u, device, 'GOOGLE'), role: u.role, name: u.name, lang: userLang_(u), _user: u };
  });
  if (out.ok) { var gu = out._user; afterResponse_(function () { mailNewLogin_(gu, device, 'GOOGLE'); }); }
  delete out._user;
  return out;
}

/**
 * Câu mô tả hạn dùng link (sửa được trong CONTENT: a.link_note_*), theo vai trò của người nhận (chunk 5J).
 * Biến {m}: số phút; {t}: thời hạn đọc được ("15 phút", "24 giờ"); {n}: số lần (khi có giới hạn).
 */
function linkUseText_(en, user) {
  var u = user && typeof user === 'object' ? user : { role: user === true ? 'TUTOR' : 'STUDENT' };
  var n = linkMaxUsesFor_(u), m = linkMinutesFor_(u), lang = en ? 'en' : 'vi';
  var t = m >= 60 && m % 60 === 0 ? contentText_('a.dur_hours', { h: m / 60 }, lang) : contentText_('a.dur_minutes', { m: m }, lang);
  return contentText_('a.link_note_' + (n ? 'n' : 'multi'), { n: n, m: m, t: t }, lang);
}
function mailLoginLink_(user, url) {
  return sendTpl_('LOGIN_LINK', user.email, { name: user.name, login_url: url, link_note: linkUseText_(false, user), link_note_en: linkUseText_(true, user) },
    { enFirst: isTutorUser_(user), kind: 'LOGIN_LINK' });
}
