/**
 * Phone.gs · Số điện thoại và link liên hệ (v8, câu 33 và 42; 5K: lưu nguyên văn)
 *
 * Từ 5K số điện thoại lưu nguyên văn (dạng chữ, định dạng ô '@'). Số Việt Nam đọc được thì hiện dạng 0912 345 678 và có link Zalo.
 */

/**
 * Chuẩn hoá số điện thoại người dùng nhập.
 * Nhận: '0912 345 678', '0912.345.678', '+84 912 345 678', '84912345678', '912345678', '(+84) 912-345-678'.
 * Trả: { ok: true, phone: '+84912345678' } hoặc { ok: false, reason: 'INVALID_PHONE' }.
 */
function normalizePhoneVN_(input) {
  var s = String(input === null || input === undefined ? '' : input).trim();
  if (!s) return { ok: false, reason: REASONS.INVALID_PHONE };
  var hasPlus = s.charAt(0) === '+' || /^\(\s*\+/.test(s);
  var digits = s.replace(/\D/g, '');
  var national;
  if (hasPlus) {
    if (digits.indexOf('84') !== 0) return { ok: false, reason: REASONS.INVALID_PHONE }; // số nước ngoài
    national = digits.substring(2);
  } else if (digits.indexOf('84') === 0 && digits.length === 11) {
    national = digits.substring(2);
  } else if (digits.charAt(0) === '0' && digits.length === 10) {
    national = digits.substring(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return { ok: false, reason: REASONS.INVALID_PHONE };
  }
  if (national.charAt(0) === '0') national = national.substring(1); // '+84 0912...' người dùng hay gõ thừa số 0
  if (!/^[35789]\d{8}$/.test(national)) return { ok: false, reason: REASONS.INVALID_PHONE };
  return { ok: true, phone: '+84' + national };
}

/**
 * Số điện thoại không bắt buộc, không cần định dạng (5K, anh chốt 01/11): học viên ở nhiều nước, dùng Zalo, WhatsApp, Line.
 * Số di động Việt Nam đọc được lưu dạng +84 (như trước); mọi thứ khác lưu nguyên văn người dùng gõ (bỏ khoảng trắng thừa, ký
 * tự điều khiển; tối đa PHONE_MAX_LEN_ ký tự), dạng chữ. Không còn từ chối số nào. Trả { ok, phone }; ok luôn true trừ khi required mà trống.
 */
var PHONE_MAX_LEN_ = 40;
function normalizePhone_(input, required) {
  var s = String(input === null || input === undefined ? '' : input).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().substring(0, PHONE_MAX_LEN_).trim();
  if (!s) return required ? { ok: false, reason: REASONS.INVALID_PHONE } : { ok: true, phone: '' };
  // Soát 5K M1: chỉ chuẩn hoá khi cả chuỗi là ký tự số điện thoại; "Line: lan_0987654321" giữ nguyên văn, không thành +84.
  if (!/^[\s\d().+-]+$/.test(s)) return { ok: true, phone: s };
  var vn = normalizePhoneVN_(s);
  if (vn.ok) return vn;   // số di động Việt Nam đọc được: lưu một dạng +84 (link Zalo, tìm kiếm)
  var plus = s.charAt(0) === '+' || /^\(\s*\+/.test(s), d = s.replace(/\D/g, '');
  if (plus && d.indexOf('84') !== 0 && /^[1-9]\d{7,14}$/.test(d)) return { ok: true, phone: '+' + d };   // số nước ngoài có mã nước: gọn như trước
  return { ok: true, phone: s };   // còn lại: nguyên văn
}
function isVnPhone_(phone) { var x = String(phone || ''); return /^[\s\d().+-]+$/.test(x) && normalizePhoneVN_(x).ok; }
/** Số Việt Nam dạng chuẩn +84 nếu đọc được, không thì trả nguyên văn (5K). */
function vnPhoneOrRaw_(phone) { var v = normalizePhoneVN_(phone); return v.ok ? v.phone : String(phone || ''); }

/** '+84912345678' thành '0912345678' (dạng quen thuộc, dùng cho link Zalo và hiển thị). */
function phoneLocal_(phone) {
  var s = vnPhoneOrRaw_(phone);
  return s.indexOf('+84') === 0 ? '0' + s.substring(3) : s;
}
function phoneDisplay_(phone) {
  if (!isVnPhone_(phone)) return String(phone || '');   // 5K: số nước ngoài, ghi chú tự do: hiện nguyên văn
  var l = phoneLocal_(phone);
  return l.length === 10 ? l.substring(0, 4) + ' ' + l.substring(4, 7) + ' ' + l.substring(7) : l;
}
function zaloLink_(phone) { return isVnPhone_(phone) ? 'https://zalo.me/' + phoneLocal_(phone) : ''; }
function telLink_(phone) { return phone ? 'tel:' + phone : ''; }
