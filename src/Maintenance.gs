/**
 * Maintenance.gs · Chế độ bảo trì (chunk 5G)
 *
 * CONFIG MAINTENANCE_MODE:
 *   OFF      = bình thường (mặc định).
 *   READONLY = học viên, tutor vẫn đăng nhập và XEM lịch; đặt, huỷ, lưu slot, xác nhận kết quả, sửa hồ sơ, gia hạn,
 *              đăng ký mới tạm dừng (máy chủ trả MAINT_READONLY, không ghi gì). Dùng khi sửa lỗi nhỏ đang chạy thật.
 *   CLOSED   = cổng học viên và tutor hiện trang bảo trì; mọi API học viên, tutor và form đăng ký trả MAINT_CLOSED.
 *              Dùng khi phải sửa dữ liệu lớn (chuyển dữ liệu, sửa tay nhiều dòng BOOKINGS).
 * Admin (apiAdmin*, menu Sheets, trigger) không bao giờ bị chặn: admin luôn vào được để sửa.
 * Đăng nhập (xin link, bấm link) vẫn chạy ở mọi chế độ để admin vào được; học viên vào thì thấy trang bảo trì.
 * MAINTENANCE_UNTIL: chữ tự do, ví dụ "21:00 hôm nay", hiện trong câu báo. Đọc qua cfg_ (bộ đệm 60 giây): bật, tắt có
 * hiệu lực trong tối đa 1 phút (menu bật tắt xoá bộ đệm nên có hiệu lực ngay).
 * Job (Calendar, email nhắc, sao lưu) vẫn chạy trong lúc bảo trì.
 */

var MAINT_WRITE_APIS_ = { apiStudentBook: 1, apiStudentCancel: 1, apiStudentUpdateProfile: 1, apiStudentRenew: 1,
  apiTutorSetAvailability: 1, apiTutorSubmitResult: 1, apiTutorSubmitResults: 1, apiSubmitRegistration: 1,
  apiSetLanguage: 1 };   // chunk 5H: bảo trì thì trang vẫn đổi ngôn ngữ tại chỗ, chỉ không lưu vào Sheets

/** Chunk 5I: API cả admin dùng: bảo trì kiểm bên trong hàm, sau khi biết vai trò (admin không bao giờ bị chặn). */
var MAINT_ROLE_APIS_ = { apiSetLanguage: 1 };
/** API ghi có mã lần bấm (idem_): bảo trì chặn bên trong idem_, sau bước trả lại kết quả cũ (Api.gs). */
var MAINT_IDEM_APIS_ = { apiStudentBook: 1, apiStudentCancel: 1, apiTutorSetAvailability: 1, apiTutorSubmitResult: 1, apiTutorSubmitResults: 1 };

function maintMode_() {
  var m = String(cfg_('MAINTENANCE_MODE') || 'OFF').trim().toUpperCase();
  return m === 'READONLY' || m === 'CLOSED' ? m : 'OFF';
}
function maintInfo_() {
  try {
    var mv = String(cfg_('MOVED_TO_URL') || '').trim();   // 5L: hệ thống đã chuyển: trang báo kèm link mới (chỉ https)
    return { mode: maintMode_(), until: String(cfg_('MAINTENANCE_UNTIL') || '').trim().substring(0, 60), movedTo: /^https:\/\/[^\s"'<>]+$/i.test(mv) ? mv : '' };
  } catch (e) { return { mode: 'OFF', until: '', movedTo: '' }; }
}

/** Trả { ok:false, reason, vars } nếu API name bị chặn bởi chế độ bảo trì, null nếu được chạy. Không đọc Sheets ngoài CONFIG (có đệm). */
function maintBlock_(name) {
  var info = maintInfo_();
  if (info.mode === 'OFF' || /^apiAdmin/.test(name)) return null;
  var vars = { until: info.until ? ' (' + info.until + ')' : '' };
  if (info.mode === 'CLOSED' && (/^api(Student|Tutor)/.test(name) || name === 'apiSubmitRegistration')) return { ok: false, reason: REASONS.MAINT_CLOSED, vars: vars };
  if (MAINT_WRITE_APIS_[name]) return { ok: false, reason: REASONS.MAINT_READONLY, vars: vars };
  return null;
}

function setMaintMode_(mode, actor) {
  withLock_(function () {
    var t = table_('CONFIG'), r = t.byId('MAINTENANCE_MODE');
    if (r) t.update(r, { value: mode }); else t.insert({ key: 'MAINTENANCE_MODE', value: mode, note: '' });
    logActivity_(actor || adminActor_(), 'MAINTENANCE_' + mode, 'CONFIG', 'MAINTENANCE_MODE', '');
  });
  clearConfigCache_();
  return mode;
}
function menuMaintReadonly(e) { requireOperator_(e); setMaintMode_('READONLY'); alert_('Đã bật bảo trì CHỈ XEM: học viên, tutor xem được lịch, không đặt, huỷ, lưu được. Admin dùng bình thường.\n\nGhi giờ dự kiến xong ở CONFIG MAINTENANCE_UNTIL (tuỳ chọn). Xong việc: menu Bảo trì: tắt.'); }
function menuMaintClosed(e) { requireOperator_(e); setMaintMode_('CLOSED'); alert_('Đã ĐÓNG cổng học viên và tutor (trang bảo trì). Admin dùng bình thường.\n\nXong việc: menu Bảo trì: tắt.'); }
function menuMaintOff(e) { requireOperator_(e); setMaintMode_('OFF'); alert_('Đã tắt bảo trì. Hệ thống chạy bình thường.'); }
