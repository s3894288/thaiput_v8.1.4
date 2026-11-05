/**
 * Time.gs · Thời gian, ngày, slot, các hạn chót (v8)
 *
 * Kế thừa từ v6: getNow_() có thể giả lập bằng Script Property SIM_NOW.
 * Mới ở v8: SIM_NOW bị bỏ qua khi ENV = PRODUCTION, để không ai lỡ để giả lập chạy trên hệ thống thật.
 *
 * Quy ước:
 *   Ngày lưu Sheets: nửa đêm  new Date(y, m, d)
 *   Khoá ngày dạng chữ: 'yyyy-MM-dd' (dùng trong API giữa trình duyệt và server)
 *   Slot: chuỗi 'HH:mm' là giờ bắt đầu, mỗi slot dài SLOT_MINUTES phút (buổi học 25 phút + 5 phút chuẩn bị)
 */

var NOW_CACHE_;

/** Đồng hồ hệ thống. Mọi chỗ cần "bây giờ" phải gọi hàm này. */
function getNow_() {
  if (NOW_CACHE_ === undefined) {
    NOW_CACHE_ = null;
    try {
      if (!isProduction_()) {
        var p = props_().getProperty('SIM_NOW');
        var d = p ? new Date(p) : null;
        if (d && !isNaN(d.getTime())) NOW_CACHE_ = d;
      }
    } catch (e) { NOW_CACHE_ = null; }
  }
  return NOW_CACHE_ ? new Date(NOW_CACHE_.getTime()) : new Date();
}
function clearNowCache_() { NOW_CACHE_ = undefined; forgetEnvMemo_(); }
/**
 * Đồng hồ thật, bỏ qua giờ giả lập. CHỈ dùng cho kiểm tra bảo mật (chữ ký đăng nhập Google còn hạn 2 phút),
 * vì dự án phụ ký bằng giờ thật của Google. Mọi luật nghiệp vụ vẫn dùng getNow_ (CLAUDE.md luật 1).
 */
function realNowMs_() { return Date.now(); }

/** Bật giả lập thời gian. Chuỗi 'YYYY-MM-DD HH:mm' hoặc 'YYYY-MM-DD HH:mm:ss'. Không dùng được ở PRODUCTION. */
function setSimNow_(str) {
  if (isProduction_()) throw new Error('Không bật giả lập thời gian trên PRODUCTION.');
  var m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) throw new Error('Sai định dạng giờ giả lập: ' + str);
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 12), Number(m[5] || 0), Number(m[6] || 0));
  props_().setProperty('SIM_NOW', d.toISOString());
  clearNowCache_();
  return d;
}
function clearSimNow_() { props_().deleteProperty('SIM_NOW'); clearNowCache_(); }

// ── Ngày ──

function toMidnight_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function makeNoon_(y, m, d) { return new Date(y, m, d, 12, 0, 0); }
function addDays_(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function sameDate_(a, b) {
  return a instanceof Date && b instanceof Date &&
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** Số ngày từ a đến b (theo lịch, bỏ giờ). Việt Nam không đổi giờ mùa hè nên làm tròn là đủ an toàn. */
function diffDays_(a, b) { return Math.round((toMidnight_(b).getTime() - toMidnight_(a).getTime()) / 86400000); }

function pad2_(n) { return (n < 10 ? '0' : '') + n; }
function dateKey_(d) { return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate()); }
function parseDateKey_(s) {
  var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1) return null; // ngày không tồn tại, ví dụ 31/02
  return d;
}
/** Chuẩn hoá giá trị ô ngày đọc từ Sheets (Date hoặc chuỗi) về Date nửa đêm, hoặc null. */
function asDate_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : toMidnight_(v);
  if (typeof v === 'string' && v) return parseDateKey_(v.substring(0, 10));
  return null;
}

/** Thứ Hai (nửa đêm) của tuần chứa ngày d. */
function mondayOf_(d) { var back = (d.getDay() + 6) % 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back); }

function fmtDate_(d) { return Utilities.formatDate(d, APP.TIMEZONE, 'dd/MM/yyyy'); }
function fmtDateTime_(d) { return Utilities.formatDate(d, APP.TIMEZONE, 'dd/MM/yyyy HH:mm'); }
var DOW_VI_ = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
var DOW_EN_ = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function fmtDayVi_(d) { return DOW_VI_[d.getDay()] + ' ' + pad2_(d.getDate()) + '/' + pad2_(d.getMonth() + 1); }
function fmtDayEn_(d) { return DOW_EN_[d.getDay()] + ' ' + pad2_(d.getDate()) + '/' + pad2_(d.getMonth() + 1); }

// ── Slot ──

function hmToMin_(hm) { var p = String(hm).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function minToHm_(min) { return pad2_(Math.floor(min / 60)) + ':' + pad2_(min % 60); }

/** Danh sách slot trong ngày theo cấu hình, mặc định 08:00 đến 23:30, bước 30 phút (32 slot). */
function slotList_() {
  var out = [], step = cfg_('SLOT_MINUTES');
  for (var m = hmToMin_(cfg_('SLOT_START')); m <= hmToMin_(cfg_('SLOT_LAST')); m += step) out.push(minToHm_(m));
  return out;
}
function isValidSlot_(slot) { return /^\d{2}:\d{2}$/.test(String(slot)) && slotList_().indexOf(String(slot)) !== -1; }

/** Chuẩn hoá giá trị ô slot đọc từ Sheets: Sheets có thể tự đổi '19:00' thành giờ (Date 1899). */
function asSlot_(v) {
  if (v instanceof Date) return pad2_(v.getHours()) + ':' + pad2_(v.getMinutes());
  return String(v || '').trim();
}

function slotStart_(date, slot) { var m = hmToMin_(slot); return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(m / 60), m % 60, 0); }
function slotEnd_(date, slot) { return new Date(slotStart_(date, slot).getTime() + cfg_('SLOT_MINUTES') * 60000); }
/** Nhãn hiển thị '19:00 - 19:30'. */
function slotLabel_(slot) { return slot + ' - ' + minToHm_((hmToMin_(slot) + cfg_('SLOT_MINUTES')) % 1440); }

// ── Hạn chót ──

/** Hạn đặt buổi của ngày D: 15:00 ngày D trừ 1 (câu 10). Đặt được khi now < hạn. */
function bookingDeadline_(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, cfg_('BOOKING_CUTOFF_HOUR'), 0, 0); }
/** Hạn đặt của đúng slot: chế độ BOOKING_LEAD_HOURS > 0 thì là giờ học trừ N tiếng, không thì như bookingDeadline_. */
function bookingDeadlineFor_(date, slot) {
  var lead = bookingLeadHours_();
  if (lead >= 0) return new Date(slotStart_(date, slot).getTime() - lead * 3600000);
  return bookingDeadline_(date);
}
/**
 * Số giờ phải đặt trước giờ học. -1 = luật file 01 (trước 15:00 hôm trước).
 * BOOK_UNTIL_START = TRUE (chỉ để test) trả 0: đặt được tới sát giờ bắt đầu.
 */
function bookingLeadHours_() {
  if (cfg_('BOOK_UNTIL_START')) return 0;
  var lead = Number(cfg_('BOOKING_LEAD_HOURS')) || 0;
  return lead > 0 ? lead : -1;
}
/** Hạn huỷ buổi của ngày D: 15:00 ngày D trừ 1 (câu 12). */
function cancelDeadline_(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, cfg_('CANCEL_CUTOFF_HOUR'), 0, 0); }
// ── Mốc "THỨ GIỜ" của tuần trước (chunk 5J, câu 21 đổi 01/11) ──
// Ví dụ 'FRI 15' với tuần bắt đầu thứ Hai W: 15:00 thứ Sáu trước W (W − 3 ngày). Nhận MON..SUN và T2..T7, CN.
var DOW_CODES_ = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6, T2: 0, T3: 1, T4: 2, T5: 3, T6: 4, T7: 5, CN: 6 };
/** Hàm thuần: 'SAT 22' → { off: 5, hour: 22 } (off = số ngày tính từ thứ Hai), sai dạng → null. */
function parseDowHour_(s) {
  var m = String(s || '').trim().toUpperCase().match(/^([A-Z0-9]{2,3})\s+(\d{1,2})(?::00)?$/);
  if (!m || !(m[1] in DOW_CODES_)) return null;
  var h = Number(m[2]);
  return h >= 0 && h <= 23 ? { off: DOW_CODES_[m[1]], hour: h } : null;
}
/** Thời điểm của mốc p trong tuần TRƯỚC tuần bắt đầu thứ Hai mon. */
function dowHourBefore_(p, mon) { return new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() - 7 + p.off, p.hour, 0, 0); }
/**
 * Lịch tutor đã kiểm hợp lệ: { remind: [p...], deadline: p, banner: p, errors: [...] }. Sai thì dùng mặc định và ghi lỗi (menu 2 báo đỏ).
 * Luật: mỗi mốc nhắc trước hạn; hạn trước hạn đặt buổi thứ Hai (BOOKING_CUTOFF_HOUR Chủ nhật); thông báo học viên trước thứ Hai.
 */
function tutorSchedule_() {
  var errs = [], def = function (k) { return parseDowHour_(DEFAULTS_[k]); };
  var dl = parseDowHour_(cfg_('TUTOR_DEADLINE_AT'));
  var cut = { off: 6, hour: Number(cfg_('BOOKING_CUTOFF_HOUR')) };
  var key = function (p) { return p.off * 24 + p.hour; };
  if (!dl) { errs.push('TUTOR_DEADLINE_AT "' + cfg_('TUTOR_DEADLINE_AT') + '" sai dạng (ví dụ SAT 22)'); dl = def('TUTOR_DEADLINE_AT'); }
  else if (!(key(dl) < key(cut))) { errs.push('TUTOR_DEADLINE_AT phải trước ' + cut.hour + ':00 Chủ nhật (hạn đặt buổi thứ Hai)'); dl = def('TUTOR_DEADLINE_AT'); }
  var rem = [];
  String(cfg_('TUTOR_REMIND_AT')).split(',').forEach(function (x) {
    if (!String(x).trim()) return;
    var p = parseDowHour_(x);
    if (!p) errs.push('TUTOR_REMIND_AT "' + String(x).trim() + '" sai dạng (ví dụ FRI 15)');
    else if (!(key(p) < key(dl))) errs.push('TUTOR_REMIND_AT "' + String(x).trim() + '" phải trước hạn TUTOR_DEADLINE_AT');
    else rem.push(p);
  });
  var bn = parseDowHour_(cfg_('STUDENT_WEEK_BANNER_FROM'));
  if (!bn) { errs.push('STUDENT_WEEK_BANNER_FROM "' + cfg_('STUDENT_WEEK_BANNER_FROM') + '" sai dạng (ví dụ SAT 00)'); bn = def('STUDENT_WEEK_BANNER_FROM'); }
  return { remind: rem, deadline: dl, banner: bn, errors: errs };
}
/** Hạn tutor mở lịch cho tuần chứa ngày D (câu 21, đổi 01/11: mặc định 22:00 thứ Bảy trước tuần đó). */
function tutorWeekDeadline_(date) { return dowHourBefore_(tutorSchedule_().deadline, mondayOf_(date)); }
/** Nhãn mốc giờ hiển thị: "22:00 Thứ 7 17/10" và "22:00 Sat 17/10". */
function fmtDowTimeVi_(d) { return pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()) + ' ' + fmtDayVi_(d); }
function fmtDowTimeEn_(d) { return pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()) + ' ' + fmtDayEn_(d); }
