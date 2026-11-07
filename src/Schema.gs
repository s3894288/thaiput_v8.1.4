/**
 * Schema.gs · Cấu trúc các tab trong file DB (v8)
 *
 * cols:  thứ tự cột, hàng 1 của tab là đúng các tên này
 * id:    cột khoá
 * text:  cột phải lưu dạng chữ (số điện thoại, slot giờ, mã chuyển khoản),
 *        nếu không Sheets sẽ tự đổi '+84...' thành số và '19:00' thành giờ
 * dates: cột ngày nửa đêm (không có giờ)
 * formulas: cột code tự ghi công thức (HYPERLINK). Mọi cột khác: chữ bắt đầu bằng = + - @ được ghi nguyên văn.
 * optional: cột thêm ở bản cập nhật; thiếu thì đọc là trống, ghi bỏ qua (tới khi chạy menu 1). checkbox: ô tick đặt theo từng hàng có dữ liệu.
 * Cột chứa chữ người dùng nhập (tên, email, ghi chú) để dạng chữ: Sheets không chạy công thức trong ô dạng chữ.
 */
var SCHEMA = {
  CONFIG: { cols: ['key', 'value', 'note'], id: 'key', text: ['key', 'value'] },
  // Chunk 5I: name_en = tên gói tiếng Anh (trống thì dùng name). optional: code chạy được trước khi admin chạy menu 1.
  PACKAGES: { cols: ['code', 'name', 'name_en', 'type', 'days', 'sessions', 'price_vnd', 'active', 'note'], id: 'code', text: ['name', 'name_en'], optional: ['name_en'] },
  USERS: {
    cols: ['user_id', 'role', 'email', 'name', 'phone', 'contact_link', 'level', 'status', 'note', 'color_id', 'meet_room', 'rate_vnd', 'created_at', 'last_login_at',
      'lang', 'marketing_opt_out'],
    // Chunk 5H: lang = ngôn ngữ người dùng chọn (vi, en; trống = chưa chọn, hỏi khi đăng nhập bằng link);
    // marketing_opt_out = TRUE thì không nhận email marketing. optional: code chạy được trước khi admin chạy menu 1.
    id: 'user_id', text: ['phone', 'email', 'name', 'level', 'note', 'meet_room', 'lang'], formulas: ['contact_link'], optional: ['lang', 'marketing_opt_out']
  },
  REGISTRATIONS: {
    cols: ['reg_id', 'created_at', 'email', 'name', 'phone', 'level_self', 'package_code', 'transfer_code', 'screenshot_url',
      'consent', 'kind', 'admin_action', 'processed_at', 'processed_by', 'note'],
    id: 'reg_id', text: ['phone', 'transfer_code', 'email', 'name', 'level_self', 'note']
  },
  STUDENT_PACKAGES: {
    cols: ['sp_id', 'student_id', 'package_code', 'status', 'start_date', 'end_date', 'start_source', 'sessions_total',
      'suspended_days', 'suspend_started_at', 'purchased_at', 'reg_id', 'expiry_notice_at',
      'start_date_locked', 'start_locked_at', 'start_booking_id', 'comp_days', 'comp_days_admin'],
    // Chunk 5M: ngày bắt đầu đã khoá (start_date_locked, lúc khoá, buổi làm mốc), tổng ngày bù từ BOOKINGS (comp_days, hệ thống ghi)
    // và ngày bù admin tự thêm (comp_days_admin, admin sửa được). optional: code chạy được trước khi admin chạy menu 1.
    id: 'sp_id', dates: ['start_date', 'end_date', 'start_date_locked'], text: ['start_booking_id'],
    optional: ['start_date_locked', 'start_locked_at', 'start_booking_id', 'comp_days', 'comp_days_admin']
  },
  PAYMENTS: { cols: ['payment_id', 'date', 'student_id', 'package_code', 'amount_vnd', 'screenshot_url', 'reg_id', 'recorded_by'], id: 'payment_id' },
  AVAILABILITY: {
    cols: ['avail_id', 'tutor_id', 'date', 'slot', 'status', 'created_at', 'cancel_requested_at', 'admin_decision', 'decided_at', 'decided_by', 'admin_note', 'outcome'],
    id: 'avail_id', text: ['slot', 'admin_note', 'outcome'], dates: ['date']
  },
  BOOKINGS: {
    cols: ['booking_id', 'student_id', 'tutor_id', 'sp_id', 'date', 'slot', 'status', 'meet_link', 'event_id', 'reminder_sent_at',
      'created_at', 'cancelled_at', 'cancel_reason', 'result_at', 'result_by', 'payroll_override', 'admin_action', 'admin_note', 'day_reminder_at',
      'cal_state', 'cal_attempts', 'cal_next_at', 'request_id', 'tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap', 'result_notice_at', 'admin_done_at'],
    // Chunk 5F: hàng đợi Calendar (cal_state, cal_attempts, cal_next_at) và mã chống gửi trùng (request_id). optional: code chạy được
    // trước khi admin chạy menu 1.
    // Chunk 5M: lỗi buổi kỹ thuật (tech_fault TUTOR, STUDENT, OBJECTIVE; tech_decided_at = lúc admin chọn), số ngày buổi này được bù
    // (comp_days, ghi 1 lần; trống = chưa xét) và phần trong đó để học viên còn kịp đặt (comp_gap).
    id: 'booking_id', text: ['slot', 'cancel_reason', 'admin_note', 'cal_state', 'request_id', 'tech_fault'], dates: ['date'],
    // Chunk 5J: result_notice_at = lúc báo đỏ "tutor quá hạn xác nhận kết quả".
    // Chunk 5N: admin_done_at = lúc một lựa chọn admin_action chạy thành công (kể cả "Đã xử lý (giữ nguyên)"); hết tô màu khi mới hơn result_at.
    optional: ['cal_state', 'cal_attempts', 'cal_next_at', 'request_id', 'tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap', 'result_notice_at', 'admin_done_at']
  },
  // Vòng 2 soát 5I: mã hành động, đối tượng, mã đối tượng là chữ (luật 22): "2026-10" không bị Sheets đổi thành ngày.
  ACTIVITY_LOG: { cols: ['time', 'actor', 'action', 'entity', 'entity_id', 'detail'], text: ['actor', 'action', 'entity', 'entity_id', 'detail'] },
  AUTH: { cols: ['token_hash', 'user_id', 'kind', 'expires_at', 'used_at', 'created_at', 'use_count', 'device'], id: 'token_hash', text: ['device'], optional: ['device'] },
  MAIL_LOG: { cols: ['time', 'to', 'subject', 'kind', 'transport'], text: ['to', 'subject', 'kind', 'transport'], optional: ['transport'] },
  // Thông báo cho admin (chunk 5B). Mọi sự kiện đều có 1 dòng; mức và kênh theo tab NOTIFY_RULES.
  // Số đo tốc độ theo giờ (chunk 5F): job mỗi giờ chép từ bộ đệm vào đây. Thiếu tab thì bỏ qua (chưa chạy menu 1).
  METRICS: { cols: ['time', 'fn', 'count', 'p50_ms', 'p95_ms', 'max_ms', 'errors', 'busy', 'note'], text: ['fn', 'note'] },
  NOTIFICATIONS: {
    // Chunk 5I: message_en = nội dung tiếng Anh (trang quản trị theo ngôn ngữ admin chọn). Dòng cũ trống thì hiện tiếng Việt.
    cols: ['notif_id', 'time', 'level', 'event', 'channel', 'actor', 'student_id', 'tutor_id', 'entity', 'entity_id', 'message', 'message_en', 'link', 'emailed_at', 'digest_at', 'read'],
    id: 'notif_id', text: ['actor', 'message', 'message_en', 'link'], checkbox: ['read'], optional: ['message_en']
  },
  // Admin tự chỉnh: sự kiện nào gửi email ngay (EMAIL), gom vào email tổng hợp cuối ngày (DIGEST), hay chỉ ghi lại (LOG).
  // Chunk 5L: số phiên bản, mốc mã tự sinh, giờ chuẩn bị chuyển (Script Properties dự án khác không đọc được). Code ghi, không sửa tay.
  META: { cols: ['key', 'value', 'note'], id: 'key', text: ['key', 'value', 'note'] },
  NOTIFY_RULES: { cols: ['event', 'level', 'channel', 'note'], id: 'event', text: ['event', 'level', 'channel', 'note'] },
  // Chữ trên trang web (chunk 5C, song ngữ từ 5H). Admin sửa cột vi, en (và note tuỳ ý). page, position, shown_when:
  // chữ nằm ở đâu, hiện khi nào; default_vi, default_en: chữ gốc. Năm cột này code ghi lại mỗi lần chạy menu 1.
  CONTENT: { cols: ['key', 'page', 'position', 'shown_when', 'vi', 'en', 'default_vi', 'default_en', 'note'], id: 'key',
    text: ['key', 'page', 'position', 'shown_when', 'vi', 'en', 'default_vi', 'default_en', 'note'] },
  // Mẫu email song ngữ (chunk 5C). Ô trống = dùng mẫu gốc; active FALSE = không gửi mẫu đó.
  EMAIL_TEMPLATES: {
    cols: ['key', 'audience', 'active', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'variables', 'note'],
    id: 'key', text: ['key', 'audience', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'variables', 'note']
  },
  // Email marketing (chunk 5H): mỗi dòng một chiến dịch. Admin viết chữ, chọn nhóm nhận, đổi status READY rồi gửi bằng menu.
  // sent_count, last_sent_at, last_result do code ghi.
  MARKETING_EMAILS: {
    cols: ['campaign_id', 'status', 'audience', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'sent_count', 'last_sent_at', 'last_result', 'note'],
    id: 'campaign_id', text: ['campaign_id', 'status', 'audience', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'last_result', 'note']
  }
};

/** Mã tiền tố và độ dài số cho từng loại khoá tự sinh. */
var ID_FORMAT = {
  USERS_STUDENT: ['S', 4], USERS_TUTOR: ['T', 3], USERS_ADMIN: ['A', 2],
  REGISTRATIONS: ['R', 5], STUDENT_PACKAGES: ['SP', 5], PAYMENTS: ['PM', 5],
  AVAILABILITY: ['AV', 6], BOOKINGS: ['BK', 6], NOTIFICATIONS: ['N', 7]
};

// ── Trạng thái ──

var BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED', PENDING_REASSIGN: 'PENDING_REASSIGN', COMPLETED: 'COMPLETED', STUDENT_ABSENT: 'STUDENT_ABSENT',
  TECH_ISSUE: 'TECH_ISSUE', TUTOR_ABSENT: 'TUTOR_ABSENT',
  CANCELLED_STUDENT: 'CANCELLED_STUDENT', CANCELLED_TUTOR: 'CANCELLED_TUTOR', CANCELLED_ADMIN: 'CANCELLED_ADMIN',
  // Chunk 5M: admin huỷ từ CANCEL_CUTOFF_HOUR hôm trước (học viên xin huỷ muộn): trừ lượt như câu 12, không bù ngày (BL46).
  CANCELLED_LATE: 'CANCELLED_LATE',
  // Chunk 5J (câu 29 đổi 01/11): tutor không chọn kết quả tới RESULT_EXPIRE_AFTER_HOURS: không tính lương; học viên vẫn tính là đã học
  // (trừ lượt, khoá ngày bắt đầu) tới khi admin sửa (Vắng tutor nếu buổi không diễn ra).
  NOT_COMPLETED: 'NOT_COMPLETED'
};
// Chunk 5I: nhãn tiếng Anh cho câu thông báo admin (song ngữ). Chữ trên web lấy từ tab CONTENT (ad.st.*), không từ đây.
var BOOKING_STATUS_EN_ = {
  CONFIRMED: 'Confirmed', PENDING_REASSIGN: 'Pending reassignment', COMPLETED: 'Completed', STUDENT_ABSENT: 'Student absent', TECH_ISSUE: 'Technical issue',
  TUTOR_ABSENT: 'Tutor absent', CANCELLED_STUDENT: 'Cancelled by student', CANCELLED_TUTOR: 'Cancelled by tutor', CANCELLED_ADMIN: 'Cancelled by admin',
  CANCELLED_LATE: 'Cancelled late', NOT_COMPLETED: 'Not completed'
};
var BOOKING_STATUS_VI = {
  CONFIRMED: 'Xác nhận', PENDING_REASSIGN: 'Chờ xác nhận', COMPLETED: 'Hoàn thành', STUDENT_ABSENT: 'Vắng học viên',
  TECH_ISSUE: 'Vấn đề kỹ thuật', TUTOR_ABSENT: 'Vắng tutor',
  CANCELLED_STUDENT: 'Huỷ bởi học viên', CANCELLED_TUTOR: 'Huỷ bởi tutor', CANCELLED_ADMIN: 'Huỷ bởi admin',
  CANCELLED_LATE: 'Huỷ muộn', NOT_COMPLETED: 'Không hoàn thành'
};
/** Trạng thái vừa trừ buổi (Trial, gói cũ) vừa chặn ngày đó (1 buổi/ngày). Xem bảng trạng thái ở plan mục 3. */
var CONSUMING_STATUSES = ['CONFIRMED', 'PENDING_REASSIGN', 'COMPLETED', 'STUDENT_ABSENT', 'NOT_COMPLETED'];
/** Trạng thái còn giữ chỗ của tutor ở slot đó (chưa dạy hoặc đang chờ gán lại). */
var HOLDING_STATUSES = ['CONFIRMED', 'PENDING_REASSIGN', 'COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE', 'TUTOR_ABSENT', 'NOT_COMPLETED'];

var PKG_STATUS = { INACTIVE: 'INACTIVE', ACTIVE: 'ACTIVE', QUEUED: 'QUEUED', EXPIRED: 'EXPIRED' };
var USER_STATUS = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', DISABLED: 'DISABLED' };
// BLOCKED: admin đã duyệt cho tutor huỷ một slot đang có học viên. Tutor bận giờ đó: không ai đặt được, tutor không tự mở lại.
var AVAIL_STATUS = { OPEN: 'OPEN', CANCEL_PENDING: 'CANCEL_PENDING', CANCELLED: 'CANCELLED', BLOCKED: 'BLOCKED' };
var ADMIN_DECISION = { PENDING: 'Chờ duyệt', APPROVE: 'Duyệt', REJECT: 'Từ chối' };
/**
 * Lựa chọn khi tutor xin huỷ slot (chunk 5B). 'Duyệt' cũ vẫn nhận, nghĩa như "tự chọn tutor thay".
 * Chỉ định tutor: ghi mã tutor (ví dụ T002) ở cột admin_note của dòng AVAILABILITY trước khi chọn.
 */
var TUTOR_CANCEL_DECISION = {
  PENDING: 'Chờ duyệt', AUTO: 'Duyệt, tự chọn tutor thay', ASSIGN: 'Duyệt, chỉ định tutor thay',
  CANCEL: 'Duyệt, huỷ buổi', REJECT: 'Từ chối'
};
var NOTIFY_LEVEL = { CRITICAL: 'CRITICAL', WARNING: 'WARNING', INFO: 'INFO' };
var NOTIFY_CHANNEL = { EMAIL: 'EMAIL', DIGEST: 'DIGEST', LOG: 'LOG' };

/** Chunk 5M: lỗi của buổi Vấn đề kỹ thuật. Nguồn duy nhất cho lương, trừ lượt và bù ngày. */
var TECH_FAULT = { TUTOR: 'TUTOR', STUDENT: 'STUDENT', OBJECTIVE: 'OBJECTIVE' };
/** Trạng thái buổi lỗi phía trường: không trừ lượt; cộng ngày bù khi ngày bắt đầu đã khoá (TECH_ISSUE xét thêm tech_fault). */
var COMP_STATUSES_ = ['TUTOR_ABSENT', 'CANCELLED_TUTOR', 'CANCELLED_ADMIN'];

function isConsuming_(status) { return CONSUMING_STATUSES.indexOf(String(status)) !== -1; }
function isHolding_(status) { return HOLDING_STATUSES.indexOf(String(status)) !== -1; }
