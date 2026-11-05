/**
 * Log.gs · Nhật ký hoạt động (v8, brief mục 13)
 *
 * Mọi thay đổi trạng thái quan trọng ghi một dòng vào ACTIVITY_LOG (luật CLAUDE.md số 11).
 * actor: email người làm, hoặc 'SYSTEM' cho job tự động.
 */
function logActivity_(actor, action, entity, entityId, detail) {
  var row = {
    time: getNow_(),
    actor: actor || 'SYSTEM',
    action: action,
    entity: entity || '',
    entity_id: entityId || '',
    detail: typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : '')
  };
  // Ngoài khoá, ở pha sau khoá hoặc trong lượt gọi API (chunk 5F): gom vào lần ghi cuối thay vì lấy khoá riêng cho một dòng.
  if (!DB_LOCK_DEPTH_ && deferActive_()) { deferWrite_(function () { logAppend_('ACTIVITY_LOG', row); }); return; }
  logAppend_('ACTIVITY_LOG', row);   // chunk 5I: ghi thêm cuối tab, không đọc cả tab (Db.gs)
}

/**
 * Chunk 5I: ghi nhật ký cho thao tác menu, trigger sửa tay, job (lấy khoá ngắn nếu chưa ở trong khoá).
 * Người làm: sự kiện có người (sửa ô, đổi cấu trúc, menu) thì email người đó; job chạy theo giờ thì SYSTEM (soát 5I A8).
 * Khoá bận quá 10 giây: dòng vào hàng chờ bền (Script Properties, mỗi dòng một khoá), lượt ghi kế tiếp hoặc job mỗi giờ
 * ghi bù. Khoá hàng chờ chỉ xoá SAU khi lượt ghi đã ra khỏi khoá thành công; lỗi khác khoá bận (Google từ chối ghi) không
 * đưa lại vào hàng chờ để không ghi trùng (soát 5I A3, vòng 2 N1).
 */
function logMenu_(e, action, entity, entityId, detail) {
  var actor = e && (e.range || e.source || e.user) ? adminActor_(e) : (isProjectTriggerEvent_(e) ? 'SYSTEM' : adminActor_(e));
  var row = { time: getNow_(), actor: actor, action: action, entity: entity || '', entity_id: entityId || '', detail: typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : '') };
  var keys = [];
  try { withLock_(function () { keys = drainLogQueue_(false); logAppend_('ACTIVITY_LOG', row); }, 10000); }
  catch (x) {
    if (String((x && x.message) || x) === BUSY_MESSAGE_) queueLogFallback_(row);
    Logger.log('Nhật ký ' + action + ' chưa ghi được: ' + ((x && x.message) || x));
    return false;
  }
  forgetLogQueue_(keys);
  return true;
}
var LOG_Q_PREFIX_ = 'LOGQ_', LOG_Q_FLAG_ = 'logq_flag_v2', LOG_Q_MAX_ = 150, LOG_Q_DETAIL_MAX_ = 1500;
/** Đưa một dòng nhật ký vào hàng chờ bền. Tối đa LOG_Q_MAX_ dòng (Script Properties tổng 500KB, mỗi giá trị 9KB). */
function queueLogFallback_(row) {
  try {
    var p = props_(), n = Object.keys(p.getProperties()).filter(function (k) { return k.indexOf(LOG_Q_PREFIX_) === 0; }).length;
    if (n >= LOG_Q_MAX_) { Logger.log('Hàng chờ nhật ký đầy (' + n + '), bỏ dòng ' + row.action); return false; }
    p.setProperty(LOG_Q_PREFIX_ + row.time.getTime() + '_' + Utilities.getUuid().substring(0, 8),
      JSON.stringify({ a: row.actor, x: row.action, e: row.entity, i: row.entity_id, d: String(row.detail || '').substring(0, LOG_Q_DETAIL_MAX_) }));
    try { CacheService.getScriptCache().put(LOG_Q_FLAG_, '1', 21600); } catch (x) { }
    return true;
  } catch (x) { Logger.log('Không đưa được nhật ký vào hàng chờ: ' + x.message); return false; }
}
/**
 * Đưa các dòng đang chờ vào lượt ghi hiện tại. Phải gọi trong withLock_. Trả danh sách khoá đã đưa vào; người gọi xoá bằng
 * forgetLogQueue_ sau khi withLock_ trả về (dữ liệu đã ghi). force: bỏ qua cờ CacheService (job mỗi giờ luôn quét).
 */
function drainLogQueue_(force) {
  if (!force) { var f = null; try { f = CacheService.getScriptCache().get(LOG_Q_FLAG_); } catch (x) { } if (!f) return []; }
  var all = {}; try { all = props_().getProperties(); } catch (x) { return []; }
  var keys = Object.keys(all).filter(function (k) { return k.indexOf(LOG_Q_PREFIX_) === 0; })
    .sort(function (a, b) { return Number(a.split('_')[1]) - Number(b.split('_')[1]) || (a < b ? -1 : 1); });
  var done = [];
  keys.forEach(function (k) {
    var o = null; try { o = JSON.parse(all[k]); } catch (x) { }
    if (o) logAppend_('ACTIVITY_LOG', { time: new Date(Number(k.split('_')[1])), actor: o.a, action: o.x, entity: o.e, entity_id: o.i, detail: o.d });
    done.push(k);
  });
  return done;
}
function forgetLogQueue_(keys) {
  if (!keys || !keys.length) return;
  var p = props_();
  keys.forEach(function (k) { try { p.deleteProperty(k); } catch (x) { } });
  try { CacheService.getScriptCache().remove(LOG_Q_FLAG_); } catch (x) { }
}
/** Ghi bù ngay (job mỗi giờ, test): lấy khoá, ghi, rồi mới xoá khoá hàng chờ. */
function drainLogQueueNow_() { var keys = withLock_(function () { return drainLogQueue_(true); }); forgetLogQueue_(keys); return keys.length; }
