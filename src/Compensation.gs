/**
 * Compensation.gs · Bù buổi, khoá ngày bắt đầu, bảo vệ tab STUDENT_PACKAGES (chunk 5M, bản 8.1.0)
 *
 * Luật đã chốt: plan/TU_VAN_BU_BUOI.md. Hàm thuần nằm ở Packages.gs (pkgPlan_, pkgShiftQueued_, firstBookableDay_);
 * file này đọc, ghi, gửi email, báo admin.
 *
 * Thứ tự an toàn khi cập nhật (luật 38): code mới chạy được trước menu 1. Khi chưa có cột mới (pkgCompReady_ false),
 * tính gói đúng như bản 8.0.10. Menu 1 thêm cột rồi chạy chuyển đổi một lần (migrate5M_).
 */

/** Đủ cột mới ở BOOKINGS và STUDENT_PACKAGES chưa (đã chạy menu 1 của bản 8.1.0). */
var MIG5M_RUNNING_ = false;
function pkgCompReady_() {
  // Soát 5Q (nâng 8.0.10 lên thẳng 8.1.4): đủ cột mới mà bước chuyển 8.1.0 (MIG_5M) chưa chạy thì vẫn dùng luật cũ, để job
  // mỗi giờ chạy giữa lúc menu 1 thêm cột và lúc chuyển dữ liệu không tính lại gói trên dữ liệu chưa chuyển (mất hạn sửa tay).
  try { if (!MIG5M_RUNNING_ && !props_().getProperty('MIG_5M')) return false; } catch (e) { return false; }
  try {
    var b = table_('BOOKINGS').colIndex, s = table_('STUDENT_PACKAGES').colIndex;
    return ['tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap'].every(function (c) { return c in b; }) &&
      ['start_date_locked', 'start_locked_at', 'start_booking_id', 'comp_days', 'comp_days_admin'].every(function (c) { return c in s; });
  } catch (e) { return false; }
}

function spSortKey_(sp) { var d = sp.start_date || sp.purchased_at; d = d ? new Date(d) : null; return d && !isNaN(d.getTime()) ? d.getTime() : 8640000000000000; }

/**
 * Tính lại mọi gói theo ngày của một học viên (chunk 5M). Gọi trong withLock_.
 * opts.dryRun: chỉ trả danh sách thay đổi, không ghi, không gửi.
 * opts.force:  sp_id được tính lại dù đã hết hạn lâu (admin vừa sửa hạn của gói đó).
 * opts.adminEdit: sp_id admin vừa sửa end_date hoặc comp_days_admin: báo học viên khi hạn đổi.
 * Trả [{ sp_id, student_id, before: { status, start, end }, after: {...}, events: [mã] }]
 */
function recomputeCompFor_(sid, actor, opts) {
  opts = opts || {};
  // opts.byStudent (soát kỹ thuật M1): BOOKINGS đã gom theo học viên một lần, để hourlyJob không quét cả tab cho từng học viên.
  var defs = pkgDefs_(), bks = opts.byStudent ? (opts.byStudent[sid] || []) : studentBookings_(sid), t = table_('STUDENT_PACKAGES'), tb = table_('BOOKINGS');
  var now = getNow_(), ctx0 = compCtx_(now), changes = [];
  ctx0.suspended = (userById_(sid) || {}).status === USER_STATUS.SUSPENDED;
  var sps = studentPackages_(sid).filter(function (sp) { var d = defs[sp.package_code]; return d && d.type !== 'SESSIONS'; })
    .sort(function (a, b) { return spSortKey_(a) - spSortKey_(b); });
  var moved = [];   // gói đã đổi hạn trong lượt này: { sp, oldEnd, newEnd }
  sps.forEach(function (sp0) {
    var def = defs[sp0.package_code], sp = sp0, from = null;
    moved.forEach(function (m) { var c = pkgShiftQueued_(sp0, m.oldEnd, m.newEnd); if (c) { sp = c; from = m; } });
    // Gói hết hạn lâu: chỉ xét khi admin sửa tay, hoặc có buổi vừa thành buổi bù (để báo admin COMP_ON_EXPIRED).
    if (sp0.status === PKG_STATUS.EXPIRED && sp0.end_date instanceof Date && diffDays_(sp0.end_date, ctx0.today) > ctx0.reopenDays && opts.force !== sp0.sp_id &&
      !bks.some(function (b) { return String(b.sp_id) === String(sp0.sp_id) && (bookingCompensable_(b) ? !hasCompValue_(b.comp_days) : hasCompValue_(b.comp_days)); })) return;
    // Q7: gói trước được cộng ngày thì buổi đã đặt của gói này rơi vào khoảng mới chuyển sang gói trước (nếu gói trước còn lượt).
    if (from && from.newEnd > from.oldEnd) {
      var pdef = defs[from.sp.package_code], plimit = pkgSessionLimit_(from.sp, pdef), pused = spConsumingBookings_(from.sp, bks).length;
      bks.filter(function (b) { return String(b.sp_id) === String(sp0.sp_id) && b.date instanceof Date && b.date <= from.newEnd; }).sort(bySlotStart_).forEach(function (b) {
        if (bookingDeducts_(b) && plimit > 0 && pused >= plimit) {
          if (!opts.dryRun) notify_('COMP_QUEUE_CONFLICT', { actor: actor, student_id: sid, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
            message: 'Gói ' + sp0.sp_id + ' dời ngày theo gói ' + from.sp.sp_id + ' nhưng buổi ' + b.booking_id + ' (' + fmtDayVi_(b.date) + ' ' + b.slot + ') không chuyển được vì gói trước hết lượt: xem lại tay',
            message_en: 'Package ' + sp0.sp_id + ' moved after ' + from.sp.sp_id + ' but lesson ' + b.booking_id + ' (' + fmtDayEn_(b.date) + ' ' + b.slot + ') could not move because the earlier package has no lessons left: check by hand' });
          return;
        }
        if (bookingDeducts_(b)) pused++;
        if (!opts.dryRun) { tb.update(b, { sp_id: from.sp.sp_id }); logActivity_(actor, 'BOOKING_MOVED_PKG', 'BOOKING', b.booking_id, { from: sp0.sp_id, to: from.sp.sp_id }); }
        else b = Object.assign({}, b);
        b.sp_id = from.sp.sp_id;
      });
    }
    // Soát 01/11 A: admin vừa sửa end_date thì ô đã mang hạn MỚI; hạn cũ (để tìm gói nối đuôi và dời nó) lấy từ opts.oldEnd.
    var editEnd = opts.adminEdit === sp0.sp_id && opts.oldEnd instanceof Date ? opts.oldEnd : null;
    var curEnd = editEnd || (sp.end_date instanceof Date ? sp.end_date : null), succ = null;
    if (curEnd) sps.forEach(function (o) { if (o !== sp0 && o.start_date instanceof Date && sameDate_(addDays_(curEnd, 1), o.start_date)) succ = o; });
    var ctx = Object.assign({}, ctx0, {
      next: succ && succ.status === PKG_STATUS.QUEUED ? { end: succ.end_date, dates: bks.filter(function (b) { return String(b.sp_id) === String(succ.sp_id) && b.date instanceof Date && bookingDeducts_(b); }) } : null,
      nextStarted: !!succ && succ.status !== PKG_STATUS.QUEUED,
      prevEnd: opts.adminEdit === sp0.sp_id && opts.oldEnd ? opts.oldEnd : null
    });
    var plan = pkgPlan_(sp, def, bks, ctx), patch = plan.patch;
    if (sp !== sp0) patch = Object.assign({ start_date: sp.start_date, start_date_locked: sp.start_date_locked }, patch || {});
    var before = { status: sp0.status, start: sp0.start_date instanceof Date ? dateKey_(sp0.start_date) : '', end: sp0.end_date instanceof Date ? dateKey_(sp0.end_date) : '' };
    var oldEnd = editEnd || (sp0.end_date instanceof Date ? sp0.end_date : null);
    var newEnd = patch && 'end_date' in patch ? (patch.end_date instanceof Date ? patch.end_date : null) : (sp0.end_date instanceof Date ? sp0.end_date : null);
    if (patch || plan.bookings.length || plan.events.length) {
      var after = { status: patch && patch.status ? patch.status : sp0.status, start: patch && 'start_date' in patch ? (patch.start_date instanceof Date ? dateKey_(patch.start_date) : '') : before.start, end: newEnd ? dateKey_(newEnd) : '' };
      changes.push({ sp_id: sp0.sp_id, student_id: sid, before: before, after: after, events: plan.events.map(function (e) { return e.type + (e.b ? ':' + e.b.booking_id : ''); }) });
    }
    if (oldEnd && newEnd && !sameDate_(oldEnd, newEnd)) moved.push({ sp: sp0, oldEnd: oldEnd, newEnd: newEnd });
    if (opts.dryRun) return;
    // Soát vòng 2 (1): buổi đã chuyển ngày bù sang gói sau (COMPNEXT_<buổi> = <gói sau>:<số ngày>) nay hết được bù: rút ở gói sau,
    // trừ khi học viên đã đặt vào những ngày đó (giữ, báo admin). Chuyển rồi thì không chuyển lần nữa khi đổi qua lại.
    plan.bookings.forEach(function (x) {
      if (x.patch.comp_days !== '') return;
      var key = 'COMPNEXT_' + x.b.booking_id, rec = props_().getProperty(key);
      if (!rec) return;
      var parts = rec.split(':'), tgt = t.byId(parts[0]), d = Number(parts[1]) || 0;
      if (!tgt || !d) { props_().deleteProperty(key); return; }
      var tEnd = tgt.end_date instanceof Date ? addDays_(tgt.end_date, -d) : null;
      var block = tEnd ? bks.filter(function (o) { return String(o.sp_id) === String(tgt.sp_id) && o.date instanceof Date && bookingDeducts_(o) && o.date > tEnd; }).map(function (o) { return o.booking_id; }) : [];
      if (block.length) {
        x.patch = { comp_days: 0, comp_gap: 0 };
        plan.events.push({ type: 'COMP_RETRACT_BLOCKED', b: x.b, days: d, blockers: block });
        return;
      }
      var adm = intOr0_(tgt.comp_days_admin) - d, oldT = tgt.end_date;
      t.update(tgt, { comp_days_admin: adm || '' }); pkgAdmShadowSet_(tgt.sp_id, adm); props_().deleteProperty(key);
      logActivity_(actor, 'COMP_RETRACTED', 'BOOKING', x.b.booking_id, { sp: tgt.sp_id, days: d, via: 'COMP_TO_NEXT' });
      var stu0 = userById_(sid) || {}, nm = defsName_(tgt.package_code);
      if (stu0.email && !opts.silent && oldT instanceof Date) { var vv = { name: stu0.name || '', package: nm[0], package_en: nm[1], old_end: fmtDate_(oldT), end_date: fmtDate_(addDays_(oldT, -d)), portal_url: portalUrl_('student') };
        afterLock_(function () { sendTpl_('PACKAGE_DATES_CHANGED', stu0.email, vv, { kind: 'PACKAGE_DATES_CHANGED' }); }); }
    });
    plan.bookings.forEach(function (x) { tb.update(x.b, x.patch); });
    // Soát 01/11 F: ngày bù chuyển sang gói nối đuôi đã chạy (ghi vào comp_days_admin của gói sau; gói sau tính lại ngay sau trong vòng này).
    plan.events.forEach(function (ev) {
      if (ev.type !== 'COMP_TO_NEXT' || !succ) return;
      var nk = 'COMPNEXT_' + ev.b.booking_id;
      if (props_().getProperty(nk)) { ev.type = 'COMP_NO_DAYS'; return; }   // đã chuyển trước đó (đổi lỗi qua lại): không cộng lần hai
      var adm = intOr0_(succ.comp_days_admin) + ev.days;
      t.update(succ, { comp_days_admin: adm }); pkgAdmShadowSet_(succ.sp_id, adm); props_().setProperty(nk, succ.sp_id + ':' + ev.days);
      ev.next = succ; ev.nextEnd = succ.end_date instanceof Date ? addDays_(succ.end_date, ev.days) : null;
      logActivity_(actor, 'COMP_TO_NEXT', 'BOOKING', ev.b.booking_id, { from: sp0.sp_id, to: succ.sp_id, days: ev.days });
    });
    if (patch) {
      t.update(sp0, patch);
      logActivity_(actor, 'PACKAGE_RECOMPUTED', 'STUDENT_PACKAGE', sp0.sp_id, { status: sp0.status, start: sp0.start_date instanceof Date ? dateKey_(sp0.start_date) : '', end: sp0.end_date instanceof Date ? dateKey_(sp0.end_date) : '',
        comp: intOr0_(sp0.comp_days), comp_admin: intOr0_(sp0.comp_days_admin), source: sp0.start_source });
      if (patch.start_locked_at) logActivity_(actor, 'PACKAGE_START_LOCKED', 'STUDENT_PACKAGE', sp0.sp_id, { start: dateKey_(patch.start_date_locked), booking: patch.start_booking_id });
    }
    compEvents_(plan, sp0, def, actor, oldEnd, opts);
  });
  return changes;
}

function defsName_(code) { var d = pkgDefs_()[code] || {}; return [d.name || code, d.name_en || d.name || code]; }

/** Bản lưu comp_days_admin (Script Properties PKGADM_<sp_id>): giá trị đúng cuối cùng do admin sửa một ô hoặc hệ thống ghi. Dán đè thì lấy lại từ đây. */
function pkgAdmShadow_(spId, all) { var v = all ? all['PKGADM_' + spId] : props_().getProperty('PKGADM_' + spId); return v === null || v === undefined || v === '' ? 0 : Number(v) || 0; }
function pkgAdmShadowSet_(spId, n) { try { if (intOr0_(n)) props_().setProperty('PKGADM_' + spId, String(intOr0_(n))); else props_().deleteProperty('PKGADM_' + spId); } catch (e) { } }

/** Lý do bù để ghi trong email học viên (key CONTENT comp.reason.*). Không nêu tên tutor. */
function compReasonCode_(b) {
  if (b.status === BOOKING_STATUS.TECH_ISSUE) return techFault_(b) === TECH_FAULT.OBJECTIVE ? 'TECH_OBJECTIVE' : 'TECH_TUTOR';
  return String(b.status);
}

/** Ghi nhật ký, báo admin, email học viên cho các sự kiện của một lần tính gói. */
function compEvents_(plan, sp, def, actor, oldEnd, opts) {
  var stu = userById_(sp.student_id) || {}, name = stu.name || sp.student_id, end = sp.end_date instanceof Date ? sp.end_date : null;
  var pkgVi = def.name || def.code, pkgEn = def.name_en || def.name || def.code, link = rowLink_('STUDENT_PACKAGES', sp._row), extended = false, retracted = false;
  var mail = function (key, vars) {
    if (!stu.email || sp.status === PKG_STATUS.INACTIVE || opts.silent) return;
    var v = Object.assign({ name: stu.name || '', package: pkgVi, package_en: pkgEn, end_date: end ? fmtDate_(end) : '', portal_url: portalUrl_('student') }, vars);
    afterLock_(function () { sendTpl_(key, stu.email, v, { kind: key }); });
  };
  var once = function (k) { try { var p = props_(); if (p.getProperty(k)) return false; p.setProperty(k, String(getNow_().getTime())); return true; } catch (e) { return true; } };
  plan.events.forEach(function (ev) {
    var b = ev.b, whenVi = b ? fmtDayVi_(b.date) + ' ' + b.slot : '', whenEn = b ? fmtDayEn_(b.date) + ' ' + b.slot : '';
    if (ev.type === 'COMP_EXTENDED') {
      extended = true;
      logActivity_(actor, 'COMP_EXTENDED', 'BOOKING', b.booking_id, { sp: sp.sp_id, days: ev.days, end: end ? dateKey_(end) : '' });
      notify_('COMP_EXTENDED', { actor: actor, student_id: sp.student_id, tutor_id: b.tutor_id, entity: 'STUDENT_PACKAGE', entity_id: sp.sp_id, link: link,
        message: 'Gói ' + sp.sp_id + ' của ' + name + ' được cộng ' + ev.days + ' ngày (buổi ' + whenVi + ', ' + (BOOKING_STATUS_VI[b.status] || b.status) + '), hạn mới ' + (end ? fmtDate_(end) : ''),
        message_en: 'Package ' + sp.sp_id + ' of ' + name + ' got ' + ev.days + ' extra day(s) (lesson ' + whenEn + ', ' + (BOOKING_STATUS_EN_[b.status] || b.status) + '), new end ' + (end ? fmtDate_(end) : '') });
      var rc = compReasonCode_(b);
      mail('COMP_EXTENDED', { lesson_date: fmtDayVi_(b.date), lesson_date_en: fmtDayEn_(b.date), lesson_slot: b.slot, days: ev.days,
        reason: contentText_('comp.reason.' + rc, null, 'vi'), reason_en: contentText_('comp.reason.' + rc, null, 'en') });
    } else if (ev.type === 'COMP_NO_DAYS') {
      logActivity_(actor, 'COMP_NO_DAYS', 'BOOKING', b.booking_id, { sp: sp.sp_id });
    } else if (ev.type === 'COMP_RETRACTED') {
      retracted = true;
      logActivity_(actor, 'COMP_RETRACTED', 'BOOKING', b.booking_id, { sp: sp.sp_id, days: ev.days, end: end ? dateKey_(end) : '' });
    } else if (ev.type === 'COMP_ON_EXPIRED') {
      logActivity_(actor, 'COMP_ON_EXPIRED', 'BOOKING', b.booking_id, { sp: sp.sp_id, days: ev.days });
      notify_('COMP_ON_EXPIRED', { actor: actor, student_id: sp.student_id, entity: 'STUDENT_PACKAGE', entity_id: sp.sp_id, link: link,
        message: 'Buổi ' + whenVi + ' của ' + name + ' được bù (' + ev.days + ' ngày) nhưng gói ' + sp.sp_id + ' đã hết hạn quá ' + cfg_('COMP_REOPEN_DAYS') + ' ngày hoặc gói sau đã chạy: hệ thống không tự cộng. Cộng tay ở cột comp_days_admin nếu cần.',
        message_en: 'Lesson ' + whenEn + ' of ' + name + ' is compensated (' + ev.days + ' day(s)) but package ' + sp.sp_id + ' expired over ' + cfg_('COMP_REOPEN_DAYS') + ' days ago or the next package already started: not added automatically. Add by hand in comp_days_admin if needed.' });
    } else if (ev.type === 'COMP_RETRACT_BLOCKED') {
      if (!once('COMPBLK_' + b.booking_id + '_' + ev.days)) return;
      logActivity_(actor, 'COMP_RETRACT_BLOCKED', 'BOOKING', b.booking_id, { sp: sp.sp_id, days: ev.days, blockers: ev.blockers });
      notify_('COMP_RETRACT_BLOCKED', { actor: actor, student_id: sp.student_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
        message: 'Buổi ' + b.booking_id + ' (' + whenVi + ') không còn được bù nhưng chưa rút ' + ev.days + ' ngày của gói ' + sp.sp_id + ': ' + name + ' đã đặt buổi ' + ev.blockers.join(', ') + ' trong những ngày đó. Huỷ các buổi ấy, hoặc giữ ngày bằng cách cộng ' + ev.days + ' vào comp_days_admin.',
        message_en: 'Lesson ' + b.booking_id + ' (' + whenEn + ') is no longer compensated but the ' + ev.days + ' day(s) of package ' + sp.sp_id + ' were kept: ' + name + ' already booked ' + ev.blockers.join(', ') + ' in those days. Cancel them, or keep the days by adding ' + ev.days + ' to comp_days_admin.' });
    } else if (ev.type === 'COMP_TO_NEXT' && ev.next) {
      var nd = defsName_(ev.next.package_code);
      notify_('COMP_EXTENDED', { actor: actor, student_id: sp.student_id, tutor_id: b.tutor_id, entity: 'STUDENT_PACKAGE', entity_id: ev.next.sp_id, link: rowLink_('STUDENT_PACKAGES', ev.next._row),
        message: 'Buổi ' + whenVi + ' (gói ' + sp.sp_id + ' đã hết hạn) được bù ' + ev.days + ' ngày vào gói sau ' + ev.next.sp_id + ' của ' + name + (ev.nextEnd ? ', hạn mới ' + fmtDate_(ev.nextEnd) : ''),
        message_en: 'Lesson ' + whenEn + ' (package ' + sp.sp_id + ' expired) compensated with ' + ev.days + ' day(s) on the next package ' + ev.next.sp_id + ' of ' + name + (ev.nextEnd ? ', new end ' + fmtDate_(ev.nextEnd) : '') });
      var rc2 = compReasonCode_(b);
      if (stu.email && !opts.silent) { var v2 = { name: stu.name || '', package: nd[0], package_en: nd[1], end_date: ev.nextEnd ? fmtDate_(ev.nextEnd) : '', portal_url: portalUrl_('student'),
        lesson_date: fmtDayVi_(b.date), lesson_date_en: fmtDayEn_(b.date), lesson_slot: b.slot, days: ev.days, reason: contentText_('comp.reason.' + rc2, null, 'vi'), reason_en: contentText_('comp.reason.' + rc2, null, 'en') };
        afterLock_(function () { sendTpl_('COMP_EXTENDED', stu.email, v2, { kind: 'COMP_EXTENDED' }); }); }
    } else if (ev.type === 'BOOKING_OUT_OF_RANGE') {
      if (!once('PKGOUT_' + sp.sp_id + '_' + ev.blockers.join(',') + '_' + (end ? dateKey_(end) : ''))) return;
      logActivity_(actor, 'BOOKING_OUT_OF_RANGE', 'STUDENT_PACKAGE', sp.sp_id, { bookings: ev.blockers, end: end ? dateKey_(end) : '' });
      notify_('BOOKING_OUT_OF_RANGE', { actor: actor, student_id: sp.student_id, entity: 'STUDENT_PACKAGE', entity_id: sp.sp_id, link: link,
        message: 'Gói ' + sp.sp_id + ' của ' + name + ' nay chạy ' + (plan.start ? fmtDate_(plan.start) : '') + ' đến ' + (end ? fmtDate_(end) : '') + ' nhưng buổi ' + ev.blockers.join(', ') + ' đã đặt nằm ngoài khoảng này. Huỷ buổi đó, hoặc cộng ngày ở comp_days_admin.',
        message_en: 'Package ' + sp.sp_id + ' of ' + name + ' now runs ' + (plan.start ? fmtDate_(plan.start) : '') + ' to ' + (end ? fmtDate_(end) : '') + ' but booked lesson(s) ' + ev.blockers.join(', ') + ' fall outside. Cancel them, or add days in comp_days_admin.' });
    } else if (ev.type === 'TRIAL_OVER_LIMIT') {
      if (!once('TRIALOVER_' + sp.sp_id)) return;
      notify_('TRIAL_OVER_LIMIT', { actor: actor, student_id: sp.student_id, entity: 'STUDENT_PACKAGE', entity_id: sp.sp_id, link: link,
        message: name + ' dùng quá số lượt Trial (gói ' + sp.sp_id + ', thừa ' + ev.days + ') sau khi đổi lỗi buổi kỹ thuật. Hệ thống không tự huỷ buổi nào: admin quyết định.',
        message_en: name + ' is over the Trial lesson limit (package ' + sp.sp_id + ', ' + ev.days + ' extra) after a technical fault change. No lesson was cancelled automatically: admin decides.' });
    } else if (ev.type === 'TRIAL_LEFT_UNUSED') {
      if (!once('TRIALLEFT_' + sp.sp_id + '_' + (end ? dateKey_(end) : ''))) return;
      notify_('TRIAL_LEFT_UNUSED', { actor: actor, student_id: sp.student_id, entity: 'STUDENT_PACKAGE', entity_id: sp.sp_id, link: link,
        message: name + ' còn ' + ev.days + ' lượt Trial (gói ' + sp.sp_id + ') mà hạn ' + (end ? fmtDate_(end) : '') + ' không còn ngày đặt được (đã dùng hết lần cộng ngày). Cộng tay ở comp_days_admin nếu muốn.',
        message_en: name + ' has ' + ev.days + ' Trial lesson(s) left (package ' + sp.sp_id + ') but the end date ' + (end ? fmtDate_(end) : '') + ' leaves no bookable day (the one time extension is used). Add days in comp_days_admin if wanted.' });
    }
  });
  var changedEnd = oldEnd && end && !sameDate_(oldEnd, end);
  if (changedEnd && !extended && (retracted || opts.adminEdit === sp.sp_id)) mail('PACKAGE_DATES_CHANGED', { old_end: fmtDate_(oldEnd) });
}

/**
 * Giá trị cũ Google gửi trong onEdit là chữ; ô ngày gửi số ngày kiểu Sheets (ví dụ "46300.5" = ngày 46300 tính từ 30/12/1899, 12:00).
 * Đổi lại thành Date theo giờ của file để ghi trả đúng kiểu.
 */
var PKG_DATE_COLS_ = ['start_date', 'end_date', 'start_date_locked', 'start_locked_at', 'purchased_at', 'suspend_started_at', 'expiry_notice_at'];
function sheetOldValue_(header, old) {
  if (PKG_DATE_COLS_.indexOf(header) === -1 || old === '' || isNaN(Number(old))) return old;
  var n = Number(old), days = Math.floor(n), ms = Math.round((n - days) * 86400000);
  return new Date(1899, 11, 30 + days, 0, 0, 0, ms);
}

// ── Bảo vệ tab STUDENT_PACKAGES (3 lớp: cảnh báo của Google, onEdit trả lại, hourlyJob tự lành) ──

/** Cột chỉ hệ thống ghi. Sửa tay thì bị trả lại, hiện "Không thể chỉnh sửa". */
var PKG_SYSTEM_COLS_ = ['sp_id', 'student_id', 'package_code', 'status', 'start_date', 'start_date_locked', 'start_locked_at', 'start_booking_id', 'start_source',
  'comp_days', 'purchased_at', 'suspended_days', 'suspend_started_at', 'sessions_total'];
/** Cột hệ thống mà tính lại tự lành được (dán đè thì hourlyJob ghi lại đúng). Cột hệ thống khác bị dán đè: báo admin khôi phục từ bản sao lưu. */
var PKG_HEALABLE_COLS_ = ['start_date', 'end_date', 'status', 'comp_days', 'start_source', 'comp_days_admin'];
/** Cột admin (PKG_EDITORS) sửa được: hạn và ngày bù tay. Hạn đổi thì phần chênh vào comp_days_admin. */
var PKG_ADMIN_COLS_ = ['end_date', 'comp_days_admin'];

function pkgEditors_() {
  var list = cfgList_('PKG_EDITORS');
  if (!list.length) list = cfgList_('ADMIN_EMAIL');
  return list.map(function (x) { return String(x).trim().toLowerCase(); }).filter(String);
}

/**
 * Hàm thuần: xét một lần sửa tay một ô của STUDENT_PACKAGES.
 * Trả { action: 'IGNORE' | 'REVERT' | 'APPLY', reason, patch }.
 *   header, actor: cột và email người sửa; value: giá trị mới (Date, số, chữ); sp: dòng gói (giá trị trong bảng đã là giá trị MỚI ở ô vừa sửa)
 *   oldVal: giá trị cũ của ô; def: PACKAGES; editors: danh sách email được sửa
 */
function pkgEditDecision_(header, actor, value, oldVal, sp, def, editors) {
  if (PKG_SYSTEM_COLS_.indexOf(header) !== -1) return { action: 'REVERT', reason: 'SYSTEM_COL' };
  if (PKG_ADMIN_COLS_.indexOf(header) === -1) return { action: 'IGNORE' };
  if (editors.indexOf(String(actor || '').toLowerCase()) === -1) return { action: 'REVERT', reason: 'NOT_EDITOR' };
  if (!def || def.type === 'SESSIONS' || !(sp.start_date instanceof Date)) return { action: 'REVERT', reason: 'NO_START' };
  var days = Number(def.days || 0), susp = intOr0_(sp.suspended_days), comp = intOr0_(sp.comp_days);
  if (header === 'end_date') {
    if (!(value instanceof Date) || isNaN(value.getTime())) return { action: 'REVERT', reason: 'NOT_DATE' };
    var nv = toMidnight_(value);
    if (nv < sp.start_date) return { action: 'REVERT', reason: 'BEFORE_START' };
    // Phần chênh so với công thức vào comp_days_admin: hạn = start + days + suspended + comp + comp_admin − 1.
    var adm = diffDays_(sp.start_date, nv) + 1 - days - susp - comp;
    return { action: 'APPLY', patch: { comp_days_admin: adm } };
  }
  var s = String(value === null || value === undefined ? '' : value).trim(), n = s === '' ? 0 : Number(s);
  if (isNaN(n) || Math.round(n) !== n) return { action: 'REVERT', reason: 'NOT_INT' };
  if (addDays_(sp.start_date, days + susp + comp + n - 1) < sp.start_date) return { action: 'REVERT', reason: 'BEFORE_START' };
  return { action: 'APPLY', patch: { comp_days_admin: n } };
}

var PKG_EDIT_REASON_VI_ = { SYSTEM_COL: 'Không thể chỉnh sửa: ô này do hệ thống ghi.', NOT_EDITOR: 'Không thể chỉnh sửa: email của bạn không có trong PKG_EDITORS.',
  NO_START: 'Không thể chỉnh sửa: gói chưa có ngày bắt đầu.', NOT_DATE: 'Không thể chỉnh sửa: hạn phải là ngày (dd/MM/yyyy).',
  BEFORE_START: 'Không thể chỉnh sửa: hạn không được trước ngày bắt đầu.', NOT_INT: 'Không thể chỉnh sửa: comp_days_admin phải là số nguyên (âm được).',
  MULTI: 'Không thể chỉnh sửa nhiều ô một lần trong STUDENT_PACKAGES: hệ thống đã tính lại gói.' };

/**
 * onEdit cho STUDENT_PACKAGES (gọi từ onEditInstallable). e: sự kiện sửa; trả { ok, message } để hiện toast.
 * Một ô: cột hệ thống thì trả lại giá trị cũ; cột admin thì kiểm rồi ghi comp_days_admin, tính lại gói.
 * Nhiều ô (dán, kéo): không trả lại từng ô được (Google không gửi giá trị cũ), tính lại gói của các dòng đó ngay (tự lành).
 */
function handlePackageEdit_(e, sh, actor) {
  var r = e.range, row = r.getRow();
  if (row < 2) return null;
  var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  var spCol = hdr.indexOf('sp_id') + 1;
  if (!spCol) return null;
  var multi = r.getNumRows() !== 1 || r.getNumColumns() !== 1;
  if (multi) {
    var ids = sh.getRange(row, spCol, r.getNumRows(), 1).getValues().map(function (x) { return String(x[0]); }).filter(String);
    clearDbCache_();
    var sids = {};
    var cols = hdr.slice(r.getColumn() - 1, r.getColumn() - 1 + r.getNumColumns()), a1 = a1Of_(row, r.getColumn(), r.getNumRows(), r.getNumColumns());
    var unsafe = cols.filter(function (c) { return PKG_SYSTEM_COLS_.indexOf(c) !== -1 && PKG_HEALABLE_COLS_.indexOf(c) === -1; });
    withLock_(function () {
      var t = table_('STUDENT_PACKAGES'), all = props_().getProperties();
      ids.forEach(function (id) {
        var sp = t.byId(id); if (!sp) return;
        sids[sp.student_id] = true;
        // Sửa nhiều ô không bao giờ hợp lệ: comp_days_admin lấy lại từ bản lưu.
        var keep = pkgAdmShadow_(id, all);
        if (intOr0_(sp.comp_days_admin) !== keep) t.update(sp, { comp_days_admin: keep || '' });
      });
      Object.keys(sids).forEach(function (sid) { recomputeStudentPackages_(sid, actor); });
      logActivity_(actor, 'PACKAGE_EDIT_DENIED', 'STUDENT_PACKAGE', ids.join(','), { range: a1, reason: 'MULTI', cols: cols });
      notify_(unsafe.length ? 'PACKAGE_PASTE_UNSAFE' : 'PACKAGE_EDIT_DENIED', { actor: actor, entity: 'STUDENT_PACKAGE', entity_id: ids.join(','), link: rowLink_('STUDENT_PACKAGES', row),
        message: actor + ' sửa nhiều ô ' + a1 + ' của STUDENT_PACKAGES (' + cols.join(', ') + '). Đã tính lại ngày, trạng thái và ngày bù tay.' + (unsafe.length ? ' Cột ' + unsafe.join(', ') + ' KHÔNG tự lành được: mở bản sao lưu đêm (thư mục Backup) và chép lại giá trị đúng.' : ''),
        message_en: actor + ' edited several cells ' + a1 + ' of STUDENT_PACKAGES (' + cols.join(', ') + '). Dates, status and manual days were recomputed.' + (unsafe.length ? ' Columns ' + unsafe.join(', ') + ' can NOT be restored automatically: open last night\'s backup (Backup folder) and copy the right values back.' : '') });
    });
    return { ok: false, message: PKG_EDIT_REASON_VI_.MULTI };
  }
  var header = String(hdr[r.getColumn() - 1] || ''), id = String(sh.getRange(row, spCol).getValue() || '');
  if (PKG_SYSTEM_COLS_.indexOf(header) === -1 && PKG_ADMIN_COLS_.indexOf(header) === -1) return null;
  var revert = function (reason) {
    clearDbCache_();
    var pasted = e.oldValue === undefined;
    withLock_(function () {
      // Google không gửi giá trị cũ khi dán đè (hoặc ô cũ trống): không xoá ô (soát kỹ thuật H3). Cột tự lành được thì tính lại ghi đúng;
      // cột khác báo admin khôi phục từ bản sao lưu. Ghi trả trong khoá (luật 5); chỉ ô vừa bị sửa, nên ghi thẳng ô đó.
      if (!pasted) { try { r.setValue(sheetOldValue_(header, e.oldValue)); } catch (x) { } }
      // Soát vòng 2 (4): gõ vào ô trống (Google gửi value, không gửi oldValue): ô cũ trống, xoá lại được.
      else if (e.value !== undefined) { try { r.clearContent(); } catch (x) { } pasted = false; }
      else if (header === 'comp_days_admin') { try { var keep = pkgAdmShadow_(id); r.setValue(keep || ''); } catch (x) { } }
      clearDbCache_();
      if (pasted && PKG_HEALABLE_COLS_.indexOf(header) === -1) notify_('PACKAGE_PASTE_UNSAFE', { actor: actor, entity: 'STUDENT_PACKAGE', entity_id: id, link: rowLink_('STUDENT_PACKAGES', row),
        message: actor + ' dán đè ô ' + header + ' của gói ' + id + ' (Google không gửi giá trị cũ). Mở bản sao lưu đêm (thư mục Backup) và chép lại giá trị đúng.',
        message_en: actor + ' pasted over ' + header + ' of package ' + id + ' (Google did not send the old value). Open last night\'s backup (Backup folder) and copy the right value back.' });
      logActivity_(actor, 'PACKAGE_EDIT_DENIED', 'STUDENT_PACKAGE', id, { col: header, reason: reason });
      notify_('PACKAGE_EDIT_DENIED', { actor: actor, entity: 'STUDENT_PACKAGE', entity_id: id, link: rowLink_('STUDENT_PACKAGES', row),
        message: actor + ' sửa ô ' + header + ' của gói ' + id + ': đã trả lại (' + reason + ')', message_en: actor + ' edited ' + header + ' of package ' + id + ': reverted (' + reason + ')' });
      var sp = table_('STUDENT_PACKAGES').byId(id);
      if (sp) recomputeStudentPackages_(sp.student_id, 'SYSTEM', { force: id });
    });
    return { ok: false, message: PKG_EDIT_REASON_VI_[reason] || 'Không thể chỉnh sửa.' };
  };
  if (PKG_SYSTEM_COLS_.indexOf(header) !== -1) return revert('SYSTEM_COL');
  clearDbCache_();
  var value = r.getValue();
  var res = withLock_(function () {
    if (!pkgCompReady_()) return { action: 'REVERT', reason: 'NO_START' };
    var sp = table_('STUDENT_PACKAGES').byId(id);
    if (!sp) return { action: 'IGNORE' };
    var d = pkgEditDecision_(header, actor, value, e.oldValue, sp, pkgDefs_()[sp.package_code], pkgEditors_());
    if (d.action !== 'APPLY') return d;
    // Hạn cũ theo công thức với comp_days_admin cũ (ô vừa sửa đã mang giá trị mới khi trigger chạy).
    // Hạn cũ dùng bản lưu comp_days_admin (soát kỹ thuật L2: dán đè thì Google không gửi giá trị cũ).
    var def0 = pkgDefs_()[sp.package_code], oldAdm = header === 'comp_days_admin' ? pkgAdmShadow_(id) : intOr0_(sp.comp_days_admin);
    var prevEnd = addDays_(sp.start_date, Number(def0.days || 0) + intOr0_(sp.suspended_days) + intOr0_(sp.comp_days) + oldAdm - 1);
    table_('STUDENT_PACKAGES').update(sp, d.patch); pkgAdmShadowSet_(id, d.patch.comp_days_admin);
    logActivity_(actor, 'PACKAGE_ADMIN_EDIT', 'STUDENT_PACKAGE', id, { col: header, comp_days_admin: d.patch.comp_days_admin, old_end: dateKey_(prevEnd) });
    recomputeStudentPackages_(sp.student_id, actor, { force: id, adminEdit: id, oldEnd: prevEnd });
    return { action: 'APPLY', end: sp.end_date };
  });
  if (res.action === 'IGNORE') return null;
  if (res.action === 'REVERT') return revert(res.reason);
  return { ok: true, message: 'Đã lưu. Hạn mới: ' + (res.end instanceof Date ? fmtDate_(res.end) : '') + ' (phần chênh ghi ở comp_days_admin).' };
}

/**
 * hourlyJob (trong khoá): tính lại các gói còn chạy hoặc vừa hết hạn (khoá ngày bắt đầu khi buổi kỹ thuật quá TECH_DECIDE_HOURS,
 * tự lành ô bị dán đè, sắp xếp). Báo admin khi tự lành đổi ngày, và khi buổi trỏ tới gói không còn (dòng gói bị xoá).
 */
function pkgHealAllInLock_(now) {
  if (!pkgCompReady_()) return { healed: 0, missing: 0 };
  var today = toMidnight_(now), reopen = Number(cfg_('COMP_REOPEN_DAYS')), sids = {}, spIds = {}, healed = [];
  var tsp = table_('STUDENT_PACKAGES'), allp = props_().getProperties(), admFixed = [];
  tsp.all().forEach(function (sp) {
    spIds[String(sp.sp_id)] = true;
    // comp_days_admin bị dán đè (khác bản lưu): ghi lại giá trị đúng trước khi tính hạn.
    var keep = pkgAdmShadow_(sp.sp_id, allp);
    if (intOr0_(sp.comp_days_admin) !== keep) { tsp.update(sp, { comp_days_admin: keep || '' }); admFixed.push(sp.sp_id + ' comp_days_admin→' + keep); sids[sp.student_id] = true; }
    if (sp.status === PKG_STATUS.EXPIRED && (!(sp.end_date instanceof Date) || diffDays_(sp.end_date, today) > reopen)) return;
    sids[sp.student_id] = true;
  });
  var byStudent = {}; table_('BOOKINGS').all().forEach(function (b) { (byStudent[b.student_id] = byStudent[b.student_id] || []).push(b); });
  Object.keys(sids).forEach(function (sid) {
    var before = {};
    // Soát vòng 2 (6): chỉ coi là tự lành khi TRƯỚC lúc tính, ô start_date đã lệch ngày đã khoá (không phải gói nối đuôi dời theo luật).
    studentPackages_(sid).forEach(function (sp) { before[sp.sp_id] = (sp.start_source === 'LOCKED' || sp.start_source === 'FIXED') && sp.start_date_locked instanceof Date && !(sp.start_date instanceof Date && sameDate_(sp.start_date, sp.start_date_locked)); });
    var ch = recomputeStudentPackages_(sid, 'SYSTEM', { byStudent: byStudent }) || [];
    // Tự lành: ô start_date lệch với ngày đã khoá (không phải do khoá mới hay bù mới) thì báo admin.
    ch.forEach(function (c) { if (before[c.sp_id] && c.before.start !== c.after.start) healed.push(c.sp_id + ' ' + (c.before.start || '(trống)') + '→' + c.after.start); });
  });
  healed = admFixed.concat(healed);
  if (healed.length) notify_('PACKAGE_HEALED', { entity: 'STUDENT_PACKAGE', entity_id: healed.map(function (h) { return h.split(' ')[0]; }).join(','), link: rowLink_('STUDENT_PACKAGES'),
    message: 'Đã ghi lại ngày bắt đầu đúng cho ' + healed.length + ' gói (ô bị sửa ngoài hệ thống): ' + healed.join(', '),
    message_en: 'Restored the locked start date of ' + healed.length + ' package(s) edited outside the system: ' + healed.join(', ') });
  var missing = {};
  table_('BOOKINGS').all().forEach(function (b) { var id = String(b.sp_id || ''); if (id && !spIds[id] && (!/^CANCELLED/.test(b.status) || b.status === BOOKING_STATUS.CANCELLED_LATE)) (missing[id] = missing[id] || []).push(b.booking_id); });
  var lost = Object.keys(missing);
  if (lost.length) {
    var key = 'PKGMISS_' + lost.sort().join(','), p = props_();
    if (!p.getProperty(key)) {
      p.setProperty(key, String(now.getTime()));
      notify_('PACKAGE_ROW_MISSING', { entity: 'STUDENT_PACKAGE', entity_id: lost.join(','), link: rowLink_('STUDENT_PACKAGES'),
        message: 'KHẨN: ' + lost.length + ' gói không còn trong STUDENT_PACKAGES mà vẫn có buổi trỏ tới: ' + lost.map(function (k) { return k + ' (' + missing[k].slice(0, 5).join(', ') + ')'; }).join('; ') + '. Mở bản sao lưu đêm (thư mục Backup), chép lại dòng gói.',
        message_en: 'URGENT: ' + lost.length + ' package(s) missing from STUDENT_PACKAGES while lessons still point to them: ' + lost.map(function (k) { return k + ' (' + missing[k].slice(0, 5).join(', ') + ')'; }).join('; ') + '. Open last night\'s backup (Backup folder) and copy the package row back.' });
    }
  }
  return { healed: healed.length, missing: lost.length };
}

// ── Chuyển đổi một lần khi lên 8.1.0 (menu 1) và xem trước ──

/**
 * Menu 1 (sau khi đã thêm cột): chạy một lần.
 *   1. Buổi kỹ thuật cũ: payroll_override TRUE thành OBJECTIVE (có lương, không trừ lượt, được bù), còn lại TUTOR. Báo admin danh sách
 *      buổi TRUE để xem lại từng buổi (có thể đổi sang "Tính lương buổi kỹ thuật" = lỗi học viên).
 *   2. Gói FIXED: ghi start_date_locked; hạn đang khác công thức (sửa tay từ trước) thì ghi phần chênh vào comp_days_admin để hạn giữ nguyên.
 *   3. Tính lại mọi học viên có gói theo ngày (khoá ngày bắt đầu, bù ngày), ghi nhật ký từng gói đổi.
 */
function migrate5M_() {
  var lines = [];
  clearDbCache_();
  if (props_().getProperty('MIG_5M')) return lines;
  MIG5M_RUNNING_ = true;
  try { if (!pkgCompReady_()) return lines; } finally { MIG5M_RUNNING_ = false; }
  MIG5M_RUNNING_ = true;
  try { withLock_(function () {
    var tb = table_('BOOKINGS'), now = getNow_(), toReview = [];
    tb.filter(function (b) { return b.status === BOOKING_STATUS.TECH_ISSUE && !String(b.tech_fault || '').trim(); }).forEach(function (b) {
      var paid = b.payroll_override === true || String(b.payroll_override).toUpperCase() === 'TRUE';
      tb.update(b, paid ? { tech_fault: TECH_FAULT.OBJECTIVE, tech_decided_at: now } : { tech_fault: TECH_FAULT.TUTOR });
      if (paid) toReview.push(b.booking_id);
    });
    if (toReview.length) {
      lines.push('Chuyển ' + toReview.length + ' buổi kỹ thuật "Tính lương" sang Lỗi khách quan (xem thông báo TECH_MIGRATED)');
      notify_('TECH_MIGRATED', { actor: 'SYSTEM', entity: 'BOOKING', entity_id: toReview.join(','), link: rowLink_('BOOKINGS'),
        message: 'Bản 8.1.0: ' + toReview.length + ' buổi kỹ thuật đã chọn "Tính lương" được ghi Lỗi khách quan (có lương, không trừ lượt, được bù ngày): ' + toReview.join(', ') + '. Buổi nào thật ra lỗi học viên: chọn "Tính lương buổi kỹ thuật" ở cột admin_action.',
        message_en: 'Version 8.1.0: ' + toReview.length + ' technical lesson(s) marked "Paid" are now Objective fault (paid, not deducted, compensated): ' + toReview.join(', ') + '. If a lesson was really the student\'s fault, pick "Tính lương buổi kỹ thuật" in admin_action.' });
    }
    var defs = pkgDefs_(), t = table_('STUDENT_PACKAGES'), nFixed = 0, sids = {};
    t.all().forEach(function (sp) {
      var def = defs[sp.package_code];
      if (!def || def.type === 'SESSIONS') return;
      sids[sp.student_id] = true;
      if (sp.start_source !== 'FIXED' || !(sp.start_date instanceof Date)) return;
      var patch = {};
      if (!(sp.start_date_locked instanceof Date)) patch.start_date_locked = sp.start_date;
      if (sp.end_date instanceof Date) {
        var formula = addDays_(sp.start_date, Number(def.days || 0) + intOr0_(sp.suspended_days) + intOr0_(sp.comp_days) + intOr0_(sp.comp_days_admin) - 1);
        var gap = diffDays_(formula, sp.end_date);
        if (gap) patch.comp_days_admin = intOr0_(sp.comp_days_admin) + gap;
      }
      if ('comp_days_admin' in patch) pkgAdmShadowSet_(sp.sp_id, patch.comp_days_admin);
      if (Object.keys(patch).length) { t.update(sp, patch); nFixed++; logActivity_('SYSTEM', 'PACKAGE_MIGRATED', 'STUDENT_PACKAGE', sp.sp_id, { start_locked: dateKey_(sp.start_date), comp_admin: intOr0_(sp.comp_days_admin) }); }
    });
    if (nFixed) lines.push('Ghi ngày bắt đầu cố định cho ' + nFixed + ' gói nối đuôi hoặc tự kích hoạt');
    // Buổi lỗi phía trường của gói đã hết hạn lâu (trước bản này): ghi 0 ngày, không báo (không có gì để làm nữa).
    var today = toMidnight_(now), reopen = Number(cfg_('COMP_REOPEN_DAYS')), oldPk = {}, nQuiet = 0;
    t.all().forEach(function (sp) { if (sp.status === PKG_STATUS.EXPIRED && (!(sp.end_date instanceof Date) || diffDays_(sp.end_date, today) > reopen)) oldPk[String(sp.sp_id)] = true; });
    tb.all().forEach(function (b) { if (oldPk[String(b.sp_id)] && bookingCompensable_(b) && !hasCompValue_(b.comp_days)) { tb.update(b, { comp_days: 0, comp_gap: 0 }); nQuiet++; } });
    if (nQuiet) lines.push('Ghi 0 ngày bù cho ' + nQuiet + ' buổi cũ thuộc gói đã hết hạn quá ' + reopen + ' ngày (không tự cộng)');
    var changed = 0;
    // Soát kỹ thuật M2: không email học viên lúc chuyển đổi (buổi cũ); chỉ ghi nhật ký và thông báo admin.
    var byStudent = {}; tb.all().forEach(function (b) { (byStudent[b.student_id] = byStudent[b.student_id] || []).push(b); });
    Object.keys(sids).forEach(function (sid) { changed += (recomputeStudentPackages_(sid, 'SYSTEM', { byStudent: byStudent, silent: true }) || []).filter(function (c) { return c.before.end !== c.after.end || c.before.start !== c.after.start || c.before.status !== c.after.status; }).length; });
    lines.push('Tính lại gói theo luật bù buổi 8.1.0: ' + changed + ' gói đổi ngày hoặc trạng thái (xem ACTIVITY_LOG PACKAGE_RECOMPUTED)');
  }); } finally { MIG5M_RUNNING_ = false; }
  props_().setProperty('MIG_5M', '1');
  return lines;
}

/** Xem trước (chỉ đọc): mọi gói sẽ đổi ngày hoặc trạng thái khi áp luật 8.1.0. Chạy trước menu 1. */
function compDryRun_() {
  clearDbCache_();
  var out = [], sids = {}, defs = pkgDefs_();
  table_('STUDENT_PACKAGES').all().forEach(function (sp) { var d = defs[sp.package_code]; if (d && d.type !== 'SESSIONS') sids[sp.student_id] = true; });
  var ready = pkgCompReady_();
  Object.keys(sids).forEach(function (sid) {
    // Chưa chạy menu 1: buổi kỹ thuật cũ đọc theo payroll_override (techFault_), gói FIXED giữ hạn nhờ phần chênh tính như menu 1 sẽ ghi.
    var sps = studentPackages_(sid), saved = [];
    if (!ready) sps.forEach(function (sp) {
      var def = defs[sp.package_code];
      if (!def || sp.start_source !== 'FIXED' || !(sp.start_date instanceof Date) || !(sp.end_date instanceof Date)) return;
      saved.push([sp, sp.comp_days_admin, sp.start_date_locked]);
      sp.start_date_locked = sp.start_date;
      sp.comp_days_admin = diffDays_(addDays_(sp.start_date, Number(def.days || 0) + intOr0_(sp.suspended_days) - 1), sp.end_date);
    });
    try {
      (recomputeCompFor_(sid, 'DRYRUN', { dryRun: true }) || []).forEach(function (c) { if (c.before.end !== c.after.end || c.before.start !== c.after.start || c.before.status !== c.after.status) out.push(c); });
    } finally { saved.forEach(function (x) { x[0].comp_days_admin = x[1]; x[0].start_date_locked = x[2]; }); }
  });
  return out;
}
function menuCompDryRun(e) { requireOperator_(e);
  var list = compDryRun_(), ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (x) { }
  var text = list.length ? list.map(function (c) { return c.sp_id + ' (' + c.student_id + '): ' + c.before.status + ' ' + c.before.start + ' → ' + c.before.end + '  thành  ' + c.after.status + ' ' + c.after.start + ' → ' + c.after.end + (c.events.length ? '  [' + c.events.join(', ') + ']' : ''); }).join('\n')
    : 'Không gói nào đổi ngày hay trạng thái.';
  logMenu_(e, 'COMP_DRY_RUN', 'SYSTEM', '', JSON.stringify({ count: list.length }));
  if (ui) ui.alert('Bù buổi 8.1.0: xem trước (' + list.length + ' gói)', text.substring(0, 9000), ui.ButtonSet.OK);
  return list;
}
