/**
 * Metrics.gs · Số đo tốc độ (chunk 5F)
 *
 * Mục đích: thay chữ "ước tính" bằng số đo thật trên Google, và biết sớm khi hệ thống chậm hoặc bị từ chối lượt.
 *   metricAdd_(fn, ms, flags): mỗi lượt gọi API, mỗi lần chờ khoá, giữ khoá cộng vào bộ đệm theo giờ (CacheService).
 *     Không ghi Sheets, không lấy khoá, nên không làm chậm người dùng. Bộ đệm có thể mất (Google xoá sớm): số đo là gần đúng.
 *   flushMetricsInLock_(now): job mỗi giờ chép giờ trước sang tab METRICS (đếm, p50, p95, lớn nhất, lỗi, bận).
 *   Trình duyệt báo lượt thất bại sau khi đã tự thử lại qua apiClientReport (Api.gs); lượt bị Google từ chối không bao giờ
 *   tới máy chủ, nên chỉ trình duyệt biết.
 */

var METRIC_SAMPLES_ = 120;

function metricHourKey_(d) { return 'm_' + dateKey_(d) + '_' + pad2_(d.getHours()); }

function metricAdd_(fn, ms, flags) {
  var c = CacheService.getScriptCache(), key = metricHourKey_(new Date(realNowMs_()));
  var raw = c.get(key), m = raw ? JSON.parse(raw) : {};
  var e = m[fn] || (m[fn] = { n: 0, err: 0, busy: 0, max: 0, s: [] });
  e.n++;
  if (flags && flags.error) e.err++;
  if (flags && flags.busy) e.busy++;
  if (flags && flags.count) e.n += flags.count - 1;
  ms = Math.max(0, Math.round(ms || 0));
  if (ms > e.max) e.max = ms;
  if (e.s.length < METRIC_SAMPLES_) e.s.push(ms); else e.s[Math.floor(Math.random() * METRIC_SAMPLES_)] = ms;
  c.put(key, JSON.stringify(m), 21600);
}

function percentile_(arr, p) {
  if (!arr.length) return 0;
  var a = arr.slice().sort(function (x, y) { return x - y; });
  return a[Math.min(a.length - 1, Math.max(0, Math.ceil(p / 100 * a.length) - 1))];
}

/** Gom số đo của một giờ thành dòng cho tab METRICS. */
function metricRows_(hourDate) {
  var raw = null;
  try { raw = CacheService.getScriptCache().get(metricHourKey_(hourDate)); } catch (e) { }
  if (!raw) return [];
  var m = JSON.parse(raw), t = new Date(hourDate.getFullYear(), hourDate.getMonth(), hourDate.getDate(), hourDate.getHours());
  return Object.keys(m).sort().map(function (fn) {
    var e = m[fn];
    return { time: t, fn: fn, count: e.n, p50_ms: percentile_(e.s, 50), p95_ms: percentile_(e.s, 95), max_ms: e.max, errors: e.err, busy: e.busy, note: '' };
  });
}

/**
 * Job mỗi giờ: chép số đo của các giờ đã qua sang tab METRICS (bù tối đa 6 giờ nếu job bỏ lượt). Mốc giờ đã chép lưu ở
 * Script Property MET_LAST (một khoá, không phình). Số đo theo đồng hồ thật (CLAUDE.md luật 1, ngoại lệ), không theo giờ giả lập.
 * Thiếu tab METRICS (chưa chạy menu 1) thì bỏ qua. Phải gọi trong withLock_.
 */
function flushMetricsInLock_() {
  try { if (!dbSpreadsheet_().getSheetByName('METRICS')) return 0; } catch (e) { return 0; }
  var props = props_(), nowMs = realNowMs_(), hour = 3600000;
  var cur = Math.floor(nowMs / hour) * hour, last = Number(props.getProperty('MET_LAST') || 0), rows = [];
  for (var h = Math.max(last + hour, cur - 6 * hour); h < cur; h += hour) rows = rows.concat(metricRows_(new Date(h)));
  // Ghi thêm mà không đọc cả tab (soát R2 T7: tab lớn dần, đọc trong khoá mỗi giờ là chậm dần).
  var n = appendRowsRaw_('METRICS', rows);
  props.setProperty('MET_LAST', String(cur - hour));
  return n;
}

/** Số đo của giờ hiện tại (cho menu Đo tốc độ và trang health). */
function metricsNow_() { return metricRows_(new Date(realNowMs_())); }

/**
 * Menu "Đo tốc độ" (chunk 5F): đo từng phần việc với dữ liệu thật của file đang dùng, mỗi phần một lần, không đệm.
 * Chỉ đọc (trừ một lần lấy và nhả khoá trống, và một dòng nhật ký SPEED_TEST). Chạy trên STAGING sau khi nạp dữ liệu,
 * và trên PRODUCTION vào giờ vắng (không ảnh hưởng người dùng nhưng chiếm 1 lượt chạy vài chục giây).
 * Trả [{ label, ms, note }].
 */
function speedTest_() {
  var rows = [];
  var time = function (label, fn) {
    var t0 = Date.now(), note = '';
    try { note = fn() || ''; } catch (e) { note = 'LỖI: ' + String((e && e.message) || e).substring(0, 120); }
    rows.push({ label: label, ms: Date.now() - t0, note: String(note) });
  };
  clearDbCache_();
  time('Mở file DB', function () { SS_CACHE_ = null; dbSpreadsheet_(); });
  time('Đọc CONFIG (không đệm)', function () { dropConfigCache_(); CFG_CACHE_ = null; cfg_('SCHOOL_NAME'); });
  time('Đọc CONFIG (có đệm)', function () { CFG_CACHE_ = null; cfg_('SCHOOL_NAME'); });
  ['USERS', 'BOOKINGS', 'AVAILABILITY', 'STUDENT_PACKAGES', 'AUTH', 'NOTIFICATIONS', 'ACTIVITY_LOG', 'MAIL_LOG'].forEach(function (n) {
    time('Đọc tab ' + n, function () { delete DB_CACHE_[n]; return table_(n).rows.length + ' dòng'; });
  });
  var users = table_('USERS').all();
  var student = users.filter(function (u) { return u.role === 'STUDENT' && u.status === USER_STATUS.ACTIVE; })[0];
  var tutor = users.filter(function (u) { return u.role === 'TUTOR' && u.status === USER_STATUS.ACTIVE; })[0];
  if (student) {
    time('Cổng học viên: dữ liệu trang chủ', function () { clearDbCache_(); var d = studentHomeData_(student, {}); return d.upcoming.length + ' buổi sắp tới'; });
    time('Slot 14 ngày (không đệm)', function () { clearDbCache_(); bumpSlotsVersion_(); return availableSlotsFor_(student.user_id, dateKey_(getNow_()), 14).length + ' ngày có slot'; });
    time('Slot 14 ngày (có đệm)', function () { clearDbCache_(); return availableSlotsFor_(student.user_id, dateKey_(getNow_()), 14).length + ' ngày có slot'; });
  } else rows.push({ label: 'Cổng học viên', ms: 0, note: 'chưa có học viên ACTIVE để đo' });
  if (tutor) time('Cổng tutor: lịch dạy', function () { clearDbCache_(); var sc = tutorScheduleFor_(tutor.user_id); return sc.upcoming.length + ' buổi sắp tới'; });
  time('Lấy khoá rồi nhả (không ghi)', function () { withLock_(function () { }); });
  time('Calendar: đọc lịch học', function () { Calendar.Events.list(lessonCalendarId_(), { maxResults: 1 }); });
  time('Hàng đợi Calendar: tình trạng', function () { clearDbCache_(); var q = calendarQueueStatus_(); return q.pending + ' chờ tạo, ' + q.failed + ' lỗi'; });
  time('Hạn mức email còn lại hôm nay', function () { return mailBudget_() + ' người nhận (' + mailTransport_() + ')'; });
  try { withLock_(function () { logActivity_('SYSTEM', 'SPEED_TEST', 'SYSTEM', APP.VERSION, rows.map(function (r) { return r.label + '=' + r.ms; }).join('; ').substring(0, 1500)); }); } catch (e) { }
  return rows;
}

function menuSpeedTest(e) { requireOperator_(e);
  var rows = speedTest_(), cur = metricsNow_().filter(function (r) { return r.fn.charAt(0) !== '_' || /_lock_|_client_/.test(r.fn); });
  var lines = rows.map(function (r) { return r.ms + ' ms  ' + r.label + (r.note ? '  (' + r.note + ')' : ''); });
  if (cur.length) lines.push('', 'Số đo giờ này (lượt, p95, lớn nhất):', '');
  cur.slice(0, 15).forEach(function (r) { lines.push(r.fn + ': ' + r.count + ' lượt, p95 ' + r.p95_ms + ' ms, max ' + r.max_ms + ' ms' + (r.busy ? ', bận ' + r.busy : '') + (r.errors ? ', lỗi ' + r.errors : '')); });
  alert_('Đo tốc độ (' + APP.VERSION + ')\n\n' + lines.join('\n') + '\n\nGhi lại vào ACTIVITY_LOG (SPEED_TEST). Số đo theo giờ: tab METRICS.');
  return rows;
}
