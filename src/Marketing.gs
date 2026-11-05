/**
 * Marketing.gs · Email marketing gửi theo chiến dịch (chunk 5H)
 *
 * Tab MARKETING_EMAILS, mỗi dòng một chiến dịch:
 *   campaign_id   mã ngắn, viết liền, ví dụ TET2027 (chữ, số, dấu gạch dưới)
 *   status        DRAFT (đang viết, menu gửi thật từ chối) · READY (cho phép gửi) · SENDING (đã gửi một phần, chạy lại để gửi tiếp)
 *                 · SENT (đã gửi xong; muốn gửi thêm cho người mới vào sau thì đổi lại READY)
 *   audience      nhóm nhận, xem MARKETING_AUDIENCES_
 *   subject_vi, title_vi, body_vi, subject_en, title_en, body_en: chữ email, cùng cú pháp với EMAIL_TEMPLATES
 *                 ({{name}}, **đậm**, {{button:portal_url|Chữ nút}}). Bỏ trống cả 3 ô một thứ tiếng = email chỉ một thứ tiếng.
 *   sent_count, last_sent_at, last_result: code ghi sau mỗi lần gửi.
 * Menu thaiput > Email marketing: "Gửi thử cho tôi" (mọi status) và "Gửi chiến dịch" (READY, SENDING; hỏi lại kèm số người).
 *
 * An toàn:
 *   chống gửi trùng: mỗi email gửi ghi MAIL_LOG kind MKT:<mã>; chạy lại chỉ gửi người chưa nhận. Dòng MKT: không bao giờ bị
 *   lưu trữ (5K), nên chiến dịch dài bao lâu cũng không gửi lại người đã nhận;
 *   hạn mức: dừng khi hạn mức email còn lại trong ngày chỉ còn MARKETING_QUOTA_RESERVE (giữ cho email hệ thống); hôm sau chạy lại;
 *   thời gian: dừng sau 4,5 phút một lượt (giới hạn 6 phút của Google); chạy lại để gửi tiếp;
 *   từ chối nhận: USERS.marketing_opt_out = TRUE thì không gửi; chân email luôn có câu hướng dẫn (mẫu MARKETING_FOOTER);
 *   địa chỉ thử tải @loadtest.invalid và tài khoản không ACTIVE không bao giờ nhận.
 */

var MARKETING_STATUSES_ = ['DRAFT', 'READY', 'SENDING', 'SENT'];
var MARKETING_AUDIENCES_ = {
  ALL_STUDENTS: 'Mọi học viên đang hoạt động (ACTIVE)',
  ACTIVE_STUDENTS: 'Học viên còn gói (đang dùng, chưa kích hoạt, nối tiếp)',
  EXPIRED_STUDENTS: 'Học viên đã hết mọi gói',
  TUTORS: 'Mọi tutor đang hoạt động',
  ALL: 'Mọi học viên và tutor đang hoạt động'
};
var MARKETING_VARS_ = ['name', 'portal_url', 'renew_url', 'home_url', 'zalo_url', 'site_url'];
var MARKETING_TIME_LIMIT_MS_ = 270000;   // 4,5 phút
var MARKETING_CHUNK_ = 10;               // ghi MAIL_LOG sau mỗi 10 email (mất kết nối thì tối đa 10 người có thể nhận lại)
var MARKETING_EXAMPLE_ = {
  campaign_id: 'VI_DU', status: 'DRAFT', audience: 'ACTIVE_STUDENTS',
  subject_vi: 'Ưu đãi gia hạn cho {{name}}', title_vi: 'Gia hạn sớm, nhận thêm 3 ngày',
  body_vi: 'Chào {{name}},\n\nGia hạn trước ngày 30 tháng này để nhận thêm **3 ngày** học.\n\n{{button:renew_url|Gia hạn ngay}}',
  subject_en: 'Renewal offer for {{name}}', title_en: 'Renew early, get 3 extra days',
  body_en: 'Hi {{name}},\n\nRenew before the 30th of this month to get **3 extra days**.\n\n{{button:renew_url|Renew now}}',
  sent_count: '', last_sent_at: '', last_result: '', note: 'Dòng ví dụ. Sửa chữ, đổi status thành READY rồi dùng menu Email marketing để gửi.'
};

function marketingRow_(id) {
  var key = String(id || '').trim().toUpperCase();
  return table_('MARKETING_EMAILS').find(function (r) { return String(r.campaign_id || '').trim().toUpperCase() === key; });
}
function marketingOptOut_(u) { var v = u.marketing_opt_out; return v === true || /^(true|x|yes|y|1|có)$/i.test(String(v === undefined || v === null ? '' : v).trim()); }

/** Người nhận của một nhóm: đúng vai trò, ACTIVE, có email thật, chưa từ chối nhận. */
function marketingRecipients_(audience) {
  var users = table_('USERS').all(), live = {};
  if (audience === 'ACTIVE_STUDENTS' || audience === 'EXPIRED_STUDENTS') {
    table_('STUDENT_PACKAGES').all().forEach(function (sp) {
      var st = String(sp.status), cur = live[sp.student_id] || { live: false, any: false };
      cur.any = true; if (st === PKG_STATUS.ACTIVE || st === PKG_STATUS.INACTIVE || st === PKG_STATUS.QUEUED) cur.live = true;
      live[sp.student_id] = cur;
    });
  }
  var seen = {};
  return users.filter(function (u) {
    var email = String(u.email || '').trim().toLowerCase();
    if (!email || seen[email] || u.status !== USER_STATUS.ACTIVE || isTestAddress_(email) || marketingOptOut_(u)) return false;
    var ok = false;
    if (audience === 'ALL_STUDENTS') ok = u.role === 'STUDENT';
    else if (audience === 'ACTIVE_STUDENTS') ok = u.role === 'STUDENT' && !!(live[u.user_id] && live[u.user_id].live);
    else if (audience === 'EXPIRED_STUDENTS') ok = u.role === 'STUDENT' && !!(live[u.user_id] && live[u.user_id].any && !live[u.user_id].live);
    else if (audience === 'TUTORS') ok = u.role === 'TUTOR';
    else if (audience === 'ALL') ok = u.role === 'STUDENT' || u.role === 'TUTOR';
    if (ok) seen[email] = true;
    return ok;
  });
}

/** Kiểm chiến dịch trước khi gửi. forTest: gửi thử được ở mọi status. Trả { ok, errors[], warnings[] }. */
function marketingCheck_(row, forTest) {
  var errors = [], warnings = [];
  if (!row) return { ok: false, errors: ['không có chiến dịch này trong tab MARKETING_EMAILS'], warnings: [] };
  var id = String(row.campaign_id || '').trim(), st = String(row.status || '').trim().toUpperCase(), aud = String(row.audience || '').trim().toUpperCase();
  if (!/^[A-Za-z0-9_]{2,30}$/.test(id)) errors.push('campaign_id chỉ gồm chữ không dấu, số, dấu gạch dưới (2 đến 30 ký tự)');
  if (!forTest && st !== 'READY' && st !== 'SENDING') errors.push(st === 'SENT' ? 'chiến dịch đã gửi xong (SENT). Muốn gửi cho người mới vào sau: đổi status thành READY (người đã nhận không nhận lại)' : 'status đang là ' + (st || 'trống') + '; đổi thành READY để gửi');
  if (!MARKETING_AUDIENCES_[aud]) errors.push('audience không hợp lệ: chọn một trong ' + Object.keys(MARKETING_AUDIENCES_).join(', '));
  var has = function (c) { var v = String(row[c] === undefined || row[c] === null ? '' : row[c]).trim(); return v !== '' && v !== '-'; };
  var vi = has('subject_vi') || has('body_vi'), en = has('subject_en') || has('body_en');
  if (!vi && !en) errors.push('chưa có chữ: điền subject và body ít nhất một thứ tiếng');
  [['vi', vi], ['en', en]].forEach(function (x) {
    if (!x[1]) return;
    if (!has('subject_' + x[0])) errors.push('thiếu subject_' + x[0]);
    if (!has('body_' + x[0])) errors.push('thiếu body_' + x[0]);
  });
  if (vi !== en) warnings.push('email chỉ có ' + (vi ? 'tiếng Việt' : 'tiếng Anh'));
  var ft = emailTemplate_('MARKETING_FOOTER'), fd = DEFAULT_EMAIL_TEMPLATES_.MARKETING_FOOTER;
  if (ft && ft.active && (String(ft.body_vi) !== fd[3] || String(ft.body_en) !== fd[6])) warnings.push('chân email (mẫu MARKETING_FOOTER) đã sửa: kiểm trong email thử là vẫn có câu hướng dẫn ngừng nhận');
  ['subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en'].forEach(function (c) {
    String(row[c] || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (m, k) {
      var btn = /^button:/.test(k), name = btn ? k.substring(7).split('|')[0].trim() : k;
      if (MARKETING_VARS_.indexOf(name) === -1) errors.push(c + ': biến {{' + name + '}} không có. Dùng được: ' + MARKETING_VARS_.join(', '));
      else if (btn && !/_url$/.test(name)) errors.push(c + ': nút {{button:' + name + '|...}} phải dùng biến link (tên đuôi _url)');
      return m;
    });
  });
  return { ok: !errors.length, errors: errors, warnings: warnings };
}

function marketingCell_(row, c) { var v = String(row[c] === undefined || row[c] === null ? '' : row[c]); return v.trim() === '-' ? '' : v; }
/** Dựng tiêu đề và thân email cho một người. Ngôn ngữ người đó đã chọn ở trên; chưa chọn: tutor tiếng Anh trước. */
function marketingRender_(row, u, testTag) {
  var role = u && u.role, page = role === 'TUTOR' ? 'tutor' : 'student';
  var vars = { name: (u && u.name) || '', portal_url: portalUrl_(page), renew_url: portalUrl_(role === 'TUTOR' ? 'tutor' : 'renew'), home_url: portalUrl_(''),
    zalo_url: cfg_('ADMIN_ZALO_URL'), site_url: cfg_('SCHOOL_SITE_URL') };
  var pref = userLang_(u), enFirst = pref ? pref === 'en' : role === 'TUTOR';
  var sVi = renderPlain_(marketingCell_(row, 'subject_vi'), vars, 'vi').trim(), sEn = renderPlain_(marketingCell_(row, 'subject_en'), vars, 'en').trim();
  var subject = sVi && sEn ? (enFirst ? sEn + ' | ' + sVi : sVi + ' | ' + sEn) : (sVi || sEn);
  // Chân từ chối nhận luôn có (luật 51): mẫu bị tắt hoặc để trống thì dùng chữ gốc.
  var foot = emailTemplate_('MARKETING_FOOTER'), fd = DEFAULT_EMAIL_TEMPLATES_.MARKETING_FOOTER, footHtml = function (lang) {
    var txt = foot && foot.active && String(foot['body_' + lang] || '').trim() ? foot['body_' + lang] : fd[lang === 'en' ? 6 : 3];
    var h = renderBody_(txt, vars, lang);
    if (!h.replace(/<[^>]*>/g, '').trim()) h = renderBody_(fd[lang === 'en' ? 6 : 3], vars, lang);   // chữ admin sửa ra rỗng: dùng chữ gốc (soát 5H B6)
    return h ? '<div style="margin-top:18px;font-size:12px;color:#6b7280">' + h + '</div>' : '';
  };
  var bVi = marketingCell_(row, 'body_vi'), bEn = marketingCell_(row, 'body_en');
  var htmlVi = bVi ? renderBody_(bVi, vars, 'vi') + footHtml('vi') : '', htmlEn = bEn ? renderBody_(bEn, vars, 'en') + footHtml('en') : '';
  var tVi = renderPlain_(marketingCell_(row, 'title_vi'), vars, 'vi'), tEn = renderPlain_(marketingCell_(row, 'title_en'), vars, 'en');
  // Một thứ tiếng: đưa thứ tiếng đó lên phần chính của khung.
  var html = htmlVi ? emailWrapBi_(tVi, htmlVi, tEn, htmlEn, enFirst && !!htmlEn) : emailWrapBi_(tEn, htmlEn, '', '', false);
  return { subject: (testTag ? testTag + ' ' : '') + subject, html: html };
}

/** Địa chỉ đã nhận chiến dịch này (MAIL_LOG kind MKT:<mã>). */
function marketingSentSet_(id) {
  var kind = 'MKT:' + String(id).trim().toUpperCase(), out = {};
  table_('MAIL_LOG').all().forEach(function (m) { if (String(m.kind) === kind) out[String(m.to || '').trim().toLowerCase()] = true; });
  return out;
}

/** Số liệu trước khi gửi (hộp hỏi lại của menu). */
function marketingPlan_(id) {
  clearDbCache_();
  var row = marketingRow_(id), chk = marketingCheck_(row, false);
  if (!chk.ok) return { ok: false, errors: chk.errors };
  var rec = marketingRecipients_(String(row.audience).trim().toUpperCase()), sent = marketingSentSet_(row.campaign_id);
  var todo = rec.filter(function (u) { return !sent[String(u.email).trim().toLowerCase()]; });
  var quota = Math.max(0, mailBudget_());
  var reserve = Number(cfg_('MARKETING_QUOTA_RESERVE')) || 0;
  return { ok: true, id: String(row.campaign_id).trim().toUpperCase(), audience: String(row.audience).trim().toUpperCase(), total: rec.length,
    already: rec.length - todo.length, todo: todo.length, quota: quota, reserve: reserve, canSend: Math.max(0, Math.min(todo.length, quota - reserve)), warnings: chk.warnings };
}

/**
 * Gửi chiến dịch: chỉ người chưa nhận, dừng khi gần hết hạn mức, gần hết thời gian hoặc admin đổi status (dừng tay),
 * ghi kết quả vào dòng chiến dịch. startedMs: lúc lượt chạy bắt đầu (menu truyền vào, vì thời gian đọc hộp thoại cũng tính
 * vào 6 phút của Google). Trả { ok, sent, failed, remaining, stopped ('', 'QUOTA', 'TIME', 'LOG', 'HUY') }.
 * Mỗi mã chỉ một lượt gửi cùng lúc (dấu MKT_RUN_<mã> trong Script Properties, soát 5H S2).
 */
var MARKETING_RUN_TTL_MS_ = 420000;   // dấu "đang gửi" cũ hơn 7 phút là của lượt đã bị Google cắt: bỏ qua
function marketingRunKey_(id) { return 'MKT_RUN_' + String(id).trim().toUpperCase(); }
function marketingSend_(id, actor, startedMs) {
  var t0 = Number(startedMs) || realNowMs_();
  var plan = marketingPlan_(id);
  if (!plan.ok) return { ok: false, errors: plan.errors };
  var key = marketingRunKey_(plan.id), mine = String(realNowMs_()) + ':' + Math.random().toString(36).slice(2, 8);
  var busy = withLock_(function () {
    var cur = String(props_().getProperty(key) || ''), at = Number(cur.split(':')[0]) || 0;
    if (cur && realNowMs_() - at < MARKETING_RUN_TTL_MS_) return fmtDateTime_(new Date(at));
    props_().setProperty(key, mine); return '';
  });
  if (busy) return { ok: false, errors: ['đang có một lượt khác gửi chiến dịch ' + plan.id + ' (bắt đầu lúc ' + busy + '). Chờ lượt đó xong rồi chạy lại; người đã nhận không nhận lại.'] };
  var nSent = 0, nFail = 0, stopped = '', todo = [], plain = '', keepMark = false;
  try {
    var sent = marketingSentSet_(plan.id), kind = 'MKT:' + plan.id, i = 0;
    todo = marketingRecipients_(plan.audience).filter(function (u) { return !sent[String(u.email).trim().toLowerCase()]; });
    var budget = plan.quota - plan.reserve;
    while (i < todo.length && !stopped) {
      // Trước mỗi lô: admin đổi status (ví dụ về DRAFT để dừng) thì dừng; đọc lại hạn mức (email hệ thống gửi song song cũng tốn).
      clearDbCache_();
      var fresh = marketingRow_(plan.id), st = fresh ? String(fresh.status || '').trim().toUpperCase() : '';
      if (st !== 'READY' && st !== 'SENDING') { stopped = 'HUY'; plain = st; break; }
      var mb = mailBudget_(); if (mb >= 0) budget = Math.min(budget, mb - plan.reserve);
      var chunk = todo.slice(i, i + MARKETING_CHUNK_), logRows = [];
      try {
        for (var j = 0; j < chunk.length; j++) {
          if (budget <= 0) { stopped = 'QUOTA'; break; }
          if (realNowMs_() - t0 > MARKETING_TIME_LIMIT_MS_) { stopped = 'TIME'; break; }
          // Chữ đọc lại mỗi lô: admin sửa lỗi chính tả khi còn READY thì phần còn lại dùng chữ mới (soát 5H B5).
          var m = marketingRender_(fresh, chunk[j], '');
          if (sendMail_(chunk[j].email, m.subject, m.html, kind, 'high', { collect: logRows })) nSent++; else nFail++;
          budget--; i++;
        }
      } finally {
        // Ghi MAIL_LOG của lô vừa gửi, kể cả khi có lỗi bất ngờ giữa lô (soát 5H S3). Không ghi được: giữ dấu "đang gửi"
        // (tự hết hạn sau 7 phút) để không lượt nào gửi lại cho những người này khi nhật ký còn thiếu (soát 5H B4).
        if (!marketingLogRows_(logRows)) { stopped = 'LOG'; keepMark = true; }
      }
    }
  } finally {
    if (!keepMark) { try { withLock_(function () { if (String(props_().getProperty(key) || '') === mine) props_().deleteProperty(key); }); } catch (e) { } }
  }
  clearDbCache_();
  var total = Object.keys(marketingSentSet_(plan.id)).length, remaining = Math.max(0, todo.length - nSent);
  var result = fmtDateTime_(getNow_()) + ': gửi ' + nSent + (nFail ? ', lỗi ' + nFail : '') + (remaining ? ', còn ' + remaining + ' người' : ', xong') +
    (stopped === 'QUOTA' ? ' (dừng vì gần hết hạn mức email hôm nay; chạy lại ngày mai)' : stopped === 'TIME' ? ' (dừng vì gần hết 6 phút; chạy lại menu để gửi tiếp)' :
      stopped === 'LOG' ? ' (dừng vì không ghi được nhật ký gửi; chạy lại sau ít phút)' : stopped === 'HUY' ? ' (dừng vì status đổi thành ' + (plain || 'trống') + ')' : '');
  withLock_(function () {
    var fresh = marketingRow_(plan.id);
    if (fresh) {
      var cur = String(fresh.status || '').trim().toUpperCase(), patch = { sent_count: total, last_sent_at: getNow_(), last_result: result };
      if (cur === 'READY' || cur === 'SENDING') patch.status = remaining ? 'SENDING' : 'SENT';   // admin đã đổi status khác: giữ nguyên
      table_('MARKETING_EMAILS').update(fresh, patch);
    }
    logActivity_(actor || 'SYSTEM', 'MARKETING_SENT', 'MARKETING_EMAILS', plan.id, { sent: nSent, failed: nFail, remaining: remaining, stopped: stopped });
  });
  return { ok: true, sent: nSent, failed: nFail, remaining: remaining, stopped: stopped, total: total, result: result };
}
/**
 * Ghi MAIL_LOG cho các email vừa gửi. Chống trùng theo nội dung: lần thử thứ hai trở đi đọc lại MAIL_LOG và chỉ thêm địa chỉ
 * chưa có dòng cùng kind, nên lỗi nào cũng thử lại được mà không ghi đôi (soát 5H S5, B1). Trả true khi đã ghi đủ.
 */
function marketingLogRows_(rows) {
  if (!rows || !rows.length) return true;
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt) clearDbCache_();
      withLock_(function () {
        var t = table_('MAIL_LOG'), have = {};
        if (attempt) t.all().forEach(function (m) { have[String(m.kind) + '|' + String(m.to || '').trim().toLowerCase()] = true; });
        rows.forEach(function (r) { var k = r.kind + '|' + String(r.to).trim().toLowerCase(); if (!have[k]) { t.insert(r); have[k] = true; } });
      }, 15000);
      return true;
    } catch (e) { try { Utilities.sleep(1500); } catch (x) { } }
  }
  return false;
}

/** Gửi thử một chiến dịch cho một địa chỉ (mọi status). Tiêu đề có [THỬ] / [TEST]. Không tính là đã gửi. */
function marketingTest_(id, to) {
  clearDbCache_(); clearContentCache_();
  var row = marketingRow_(id), chk = marketingCheck_(row, true);
  if (!chk.ok) return { ok: false, errors: chk.errors };
  var me = userByEmail_(to) || { name: 'Minh Anh', role: 'STUDENT', email: to };
  var m = marketingRender_(row, me, '[THỬ · TEST]');
  var ok = sendMail_(to, m.subject, m.html, 'MKT_TEST:' + String(row.campaign_id).trim().toUpperCase(), 'high');
  return ok ? { ok: true, to: to, warnings: chk.warnings } : { ok: false, errors: ['gửi email không thành công'] };
}

// ── Menu ──
function marketingAskId_(title) {
  var ui = SpreadsheetApp.getUi(), list = table_('MARKETING_EMAILS').all().map(function (r) { return r.campaign_id + ' (' + (r.status || 'trống') + ')'; });
  var res = ui.prompt(title, 'Nhập mã chiến dịch (cột campaign_id). Đang có: ' + (list.join(', ') || 'chưa có dòng nào'), ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return '';
  return res.getResponseText().trim();
}
function menuMarketingTest(e) { requireOperator_(e);
  var id = marketingAskId_('Email marketing: gửi thử cho tôi'); if (!id) return;
  var to = ''; try { to = Session.getActiveUser().getEmail(); } catch (x) { }
  var r = marketingTest_(id, to || adminEmails_()[0]);
  logMenu_(e, 'MARKETING_TEST', 'MARKETING_EMAILS', id, JSON.stringify(r.ok ? { to: r.to } : { errors: r.errors }));
  alert_(r.ok ? 'Đã gửi thử tới ' + r.to + '. Mở hộp thư kiểm tra chữ, nút, cả hai thứ tiếng.' + (r.warnings.length ? '\nLưu ý: ' + r.warnings.join('; ') : '') : 'Chưa gửi được:\n' + r.errors.join('\n'));
}
function menuMarketingSend(e) { requireOperator_(e);
  var started = realNowMs_();
  var id = marketingAskId_('Email marketing: gửi chiến dịch'); if (!id) return;
  var p = marketingPlan_(id);
  if (!p.ok) return alert_('Chưa gửi được:\n' + p.errors.join('\n'));
  if (!p.todo) return alert_('Chiến dịch ' + p.id + ': mọi người trong nhóm ' + p.audience + ' (' + p.total + ' người) đã nhận. Không có gì để gửi.');
  var ui = SpreadsheetApp.getUi();
  var msg = 'Nhóm ' + p.audience + ': ' + p.total + ' người, đã nhận trước ' + p.already + ', còn ' + p.todo + '.\n' +
    'Hạn mức email còn lại hôm nay: ' + p.quota + ', giữ lại ' + p.reserve + ' cho email hệ thống.\nLượt này gửi tối đa ' + p.canSend + ' email.' +
    (p.warnings.length ? '\nLưu ý: ' + p.warnings.join('; ') : '') + '\n\nGửi thật? (Lượt gửi chạy tối đa khoảng 4 phút; chờ hộp thoại kết quả, không bấm menu lần nữa.)';
  if (!p.canSend) return alert_('Hạn mức email hôm nay không đủ (còn ' + p.quota + ', giữ lại ' + p.reserve + '). Chạy lại ngày mai.');
  if (ui.alert('Gửi chiến dịch ' + p.id, msg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var r = marketingSend_(p.id, adminActor_(e), started);
  alert_(r.ok ? 'Chiến dịch ' + p.id + ': ' + r.result : 'Chưa gửi được:\n' + r.errors.join('\n'));
}
