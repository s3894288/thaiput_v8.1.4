/**
 * Config.gs · Cấu hình tập trung (v8)
 *
 * Hai lớp cấu hình:
 *   1. Script Properties (do Setup ghi, admin không cần đụng):
 *        ENV               STAGING | PRODUCTION
 *        DB_ID_STAGING     id file THAIPUT_DB_STAGING
 *        DB_ID_PRODUCTION  id file THAIPUT_DB
 *        SIM_NOW           giờ giả lập (chỉ có tác dụng khi ENV khác PRODUCTION)
 *   2. Tab CONFIG trong file DB (admin sửa được, không cần sửa code). Đọc bằng cfg_(key).
 *      Khoá nào không có trong tab thì dùng giá trị mặc định ở DEFAULTS_ dưới đây.
 *
 * Mọi khoá nghiệp vụ tương ứng một câu trong docs/01_QUYET_DINH_50_CAU.md (đã chốt).
 */

var APP = {
  VERSION: '8.1.7',
  NAME: 'thaiput',
  TIMEZONE: 'Asia/Ho_Chi_Minh'
};

var DEFAULTS_ = {
  // Gói học (câu 1 đến 8)
  PKG_TRIAL_DAYS: 7,
  PKG_2W_DAYS: 14,
  PKG_1M_DAYS: 30,
  TRIAL_SESSIONS: 2,
  INACTIVE_AUTO_ACTIVATE_DAYS: 30,
  MAX_BOOKINGS_PER_DAY: 1,
  // Bù buổi (chunk 5M, plan/TU_VAN_BU_BUOI.md). Ngày cộng thêm cho mỗi buổi lỗi phía trường sau khi ngày bắt đầu đã khoá.
  COMP_DAYS_PER_SESSION: 1,
  // Gói có giới hạn số buổi (Trial): số ngày cộng cho lần bù, và trần tổng (không tính phần thêm để học viên còn kịp đặt).
  COMP_DAYS_TRIAL: 3,
  COMP_TRIAL_MAX_DAYS: 3,
  // Gói đã hết hạn chưa quá số ngày này mà có buổi trong hạn được bù: tự cộng ngày và mở lại gói (BL47).
  COMP_REOPEN_DAYS: 7,
  // Buổi Vấn đề kỹ thuật mà admin chưa chọn lỗi: sau số giờ này coi như lỗi tutor (đã có kết quả cuối, dùng để khoá ngày bắt đầu).
  TECH_DECIDE_HOURS: 48,
  // Email được sửa end_date và comp_days_admin trong tab STUDENT_PACKAGES, cách nhau dấu phẩy. Trống = ADMIN_EMAIL.
  // Gmail thường đôi khi không cho biết email người sửa (ghi là ADMIN): khi đó thêm chữ ADMIN vào ô này.
  PKG_EDITORS: '',
  TRIAL_ONCE_PER_EMAIL: true,

  // Đặt và huỷ (câu 10, 12)
  BOOKING_CUTOFF_HOUR: 15,
  // 0 = luật file 01: đặt trước 15:00 hôm trước. Số > 0 = cho đặt cả trong ngày, miễn là trước giờ học ít nhất chừng ấy tiếng
  // (ví dụ 3: 20:47 đặt được slot 23:30 hôm nay). Hạn huỷ vẫn theo CANCEL_CUTOFF_HOUR.
  BOOKING_LEAD_HOURS: 0,
  // CHỈ ĐỂ TEST: TRUE = đặt được bất cứ lúc nào, miễn là trước giờ bắt đầu buổi học (bỏ qua 2 luật trên).
  // Admin tự thêm dòng này vào tab CONFIG khi cần thử nhanh, xoá dòng hoặc để FALSE khi chạy thật.
  BOOK_UNTIL_START: false,
  CANCEL_CUTOFF_HOUR: 15,
  BOOKING_ENABLED: true,
  // Đặt xa nhất bao nhiêu ngày tới (học viên) và mở lịch xa nhất bao nhiêu ngày (tutor). Trang web hiện 14 ngày.
  BOOKING_HORIZON_DAYS: 28,
  // Chống spam form đăng ký công khai: tối đa bao nhiêu đăng ký mỗi giờ trên toàn hệ thống.
  REG_MAX_PER_HOUR: 20,

  // Khung giờ (brief mục 2)
  SLOT_START: '08:00',
  SLOT_LAST: '23:30',
  SLOT_MINUTES: 30,

  // Tutor (câu 18 đến 25)
  ASSIGN_STRATEGY: 'ROUND_ROBIN_LEAST_LOADED',
  TUTOR_CANCEL_DECIDE_BEFORE_HOURS: 3,
  // Chunk 5J (câu 21 đổi 01/11): mốc dạng "THỨ GIỜ" (MON TUE WED THU FRI SAT SUN, giờ 0 đến 23), áp cho tuần sau.
  // Nhắc tutor chưa mở giờ nào (nhiều mốc cách dấu phẩy), hạn mở lịch (sau hạn bớt giờ phải xin duyệt), lúc bắt đầu hiện thông báo
  // "đã có giờ tuần sau" trên trang học viên. Hạn phải trước hạn đặt buổi thứ Hai (BOOKING_CUTOFF_HOUR Chủ nhật); sai thì dùng mặc định.
  TUTOR_REMIND_AT: 'FRI 15',
  TUTOR_DEADLINE_AT: 'SAT 22',
  STUDENT_WEEK_BANNER_FROM: 'SAT 00',
  PAYROLL_STATUSES: 'COMPLETED,STUDENT_ABSENT',

  // Sau buổi (câu 29, đổi 01/11): quá RESULT_NOTICE_AFTER_HOURS giờ sau giờ kết thúc mà tutor chưa chọn kết quả thì báo đỏ trên
  // trang tutor và trang quản trị; quá RESULT_EXPIRE_AFTER_HOURS giờ, và đã báo đủ RESULT_EXPIRE_AFTER_NOTICE_HOURS giờ, thì buổi
  // thành "Không hoàn thành" (NOT_COMPLETED): không tính lương. Không còn tự Hoàn thành.
  RESULT_NOTICE_AFTER_HOURS: 24,
  RESULT_EXPIRE_AFTER_HOURS: 48,
  RESULT_EXPIRE_AFTER_NOTICE_HOURS: 24,
  // Chunk 5N: buổi ở trạng thái Chờ đổi tutor (PENDING_REASSIGN) quá số giờ này thì job mỗi giờ báo admin (REASSIGN_STUCK). -1 = tắt.
  REASSIGN_STUCK_HOURS: 1,

  // Đăng nhập (câu 32, đổi 01/11 chunk 5J): theo vai trò. MAX_USES 0 = bấm không giới hạn trong hạn link.
  STUDENT_LINK_MINUTES: 15,
  STUDENT_LINK_MAX_USES: 0,
  TUTOR_LINK_MINUTES: 15,
  TUTOR_LINK_MAX_USES: 0,
  ADMIN_LINK_MINUTES: 1440,
  ADMIN_LINK_MAX_USES: 0,
  // Mỗi email xin link tối đa 1 lần trong số phút này (mọi vai trò; admin gửi hộ bằng menu không bị giới hạn).
  LOGIN_LINK_COOLDOWN_MINUTES: 60,
  SESSION_DAYS: 30,
  // Phiên của tutor sống bao nhiêu ngày sau khi bấm link (học viên dùng SESSION_DAYS). 16/10: về 30 như trước chunk 5D.
  TUTOR_SESSION_DAYS: 30,
  ADMIN_SESSION_DAYS: 30,
  // TRUE: admin xin link đăng nhập bằng email được. Tắt (FALSE) khi đăng nhập Google cho admin đã chạy ổn.
  ADMIN_LINK_LOGIN: true,
  // TRUE: mỗi lần đăng nhập, gửi email "Có đăng nhập mới" cho chính người đó, chỉ với vai trò trong NEW_LOGIN_EMAIL_ROLES.
  STAFF_NEW_LOGIN_EMAIL: true,
  // Vai trò nhận email "Có đăng nhập mới", cách nhau dấu phẩy. 16/10: chỉ ADMIN (tutor bỏ phần thiết bị). Bật lại cho tutor: ADMIN,TUTOR.
  NEW_LOGIN_EMAIL_ROLES: 'ADMIN',
  // Bộ nhớ đệm phiên (giây): không đọc cả tab AUTH mỗi lần trang gọi máy chủ.
  SESSION_CACHE_SECONDS: 120,
  // Dọn tab AUTH hằng ngày: xoá link và phiên đã hết hạn quá số ngày này.
  AUTH_PURGE_AFTER_DAYS: 7,
  // Đăng nhập bằng tài khoản Google (dự án phụ "thaiput Google login"). Trống = không hiện nút.
  GOOGLE_LOGIN_URL: '',
  // Vai trò được đăng nhập bằng Google, cách nhau dấu phẩy: ADMIN hoặc ADMIN,TUTOR.
  GOOGLE_LOGIN_ROLES: 'ADMIN',
  // Menu "Xoá dữ liệu test": chỉ chạy khi ô này TRUE. Cài đặt trên STAGING tự ghi TRUE; switchToProduction tự ghi FALSE.
  ALLOW_DATA_RESET: false,

  // Thông báo (câu 41)
  REMINDER_BEFORE_MINUTES: 60,
  REMINDER_WINDOW_MINUTES: 15,
  EXPIRY_NOTICE_DAYS: 3,
  MAIL_FROM_NAME: 'thaiput',
  // Chunk 5Q: đường gửi email. GMAILAPP (mặc định, như MailFix cũ) hoặc MAILAPP (dự phòng, dễ bị trả về). Xem MailTransport.gs.
  MAIL_TRANSPORT: 'GMAILAPP',
  ADMIN_EMAIL: 'admin@thaiput.vn',
  // Workspace (mặc định từ 15/10): 1.500 người nhận mỗi ngày cho tài khoản chạy hệ thống. Khi hạn mức còn lại
  // nhỏ hơn hoặc bằng số này, email ưu tiên thấp (nhắc buổi, sắp hết hạn) bị tạm bỏ.
  MAIL_LOW_QUOTA_RESERVE: 15,
  MARKETING_QUOTA_RESERVE: 100,   // chunk 5H: email marketing dừng khi hạn mức email còn lại trong ngày chỉ còn chừng này (giữ cho email hệ thống)
  // Nhắc buổi học buổi sáng, mỗi người 1 email liệt kê buổi trong ngày. -1 = tắt (mặc định từ 15/10 theo quyết định anh Chris).
  // Muốn bật lại: ghi giờ, ví dụ 8 (job chạy mỗi giờ, nên thực tế từ 8:00 đến 8:59).
  MORNING_REMINDER_HOUR: -1,
  // Email tổng hợp cuối ngày cho admin (các sự kiện kênh DIGEST trong NOTIFY_RULES). Ghi -1 để tắt.
  DIGEST_HOUR: 21,
  // TRUE: thêm email admin (ADMIN_EMAIL) làm khách của mọi buổi học, không gửi thư mời, để admin vào được mọi phòng Meet.
  ADMIN_JOIN_MEET: true,

  // Hàng đợi Calendar (chunk 5F). Đặt lịch luôn ghi booking và gửi email xác nhận ngay; sự kiện Calendar (link Meet, lời mời) tạo theo chế độ:
  //   QUEUE   = tạo trong vài phút sau khi đặt (job 5 phút), trừ giờ yên tĩnh CALENDAR_QUIET_FROM đến CALENDAR_QUIET_TO
  //             (mặc định từ 16/10, anh Chris chọn Q2 a);
  //   NIGHTLY = gom tạo một lần mỗi ngày từ CALENDAR_NIGHTLY_HOUR (quyết định 15/10, giữ làm phương án dự phòng);
  //   INLINE  = tạo ngay trong lúc học viên bấm Đặt (cách cũ, chậm nhất khi đông người).
  // Mọi chế độ: buổi bắt đầu trong CALENDAR_MIN_LEAD_HOURS giờ tới (tính cả lần chạy kế tiếp) được tạo ngay, không chờ.
  CALENDAR_MODE: 'QUEUE',
  CALENDAR_NIGHTLY_HOUR: 23,
  CALENDAR_QUIET_FROM: 22,
  CALENDAR_QUIET_TO: 7,
  CALENDAR_MIN_LEAD_HOURS: 3,
  // Mỗi lần job chạy tạo tối đa chừng này sự kiện (trải lời mời ra, không vượt 6 phút mỗi lần chạy).
  CALENDAR_BATCH_MAX: 40,
  // Lỗi quá chừng này lần thì dừng thử lại và báo admin (mức Khẩn).
  CALENDAR_MAX_ATTEMPTS: 5,
  // Danh sách slot trống dùng chung cho mọi học viên trong chừng này giây (0 = tắt). Đặt lịch luôn kiểm lại trong khoá.
  SLOT_CACHE_SECONDS: 60,

  // Phòng Meet: AUTO = mỗi buổi một link tự tạo (lịch của booking@ là chủ phòng);
  // TUTOR_ROOM = dùng phòng Meet cố định của từng tutor (cột meet_room trong USERS), tutor tự duyệt người vào.
  // Dùng TUTOR_ROOM khi chạy bằng Gmail thường mà học viên bị bắt chờ duyệt.
  MEET_MODE: 'AUTO',

  // Liên hệ (câu 42)
  ADMIN_PHONE: '',
  ADMIN_ZALO_URL: '',

  // Thương hiệu, tên miền (câu 38)
  SCHOOL_NAME: 'thaiput',
  SCHOOL_DOMAIN: 'thaiput.vn',
  SCHOOL_SITE_URL: 'https://www.thaiput.vn',
  WEBAPP_URL: '',
  POLICY_URL: '',

  // Thanh toán ngoài (câu 39, 40)
  BANK_NAME: '',
  BANK_ACCOUNT: '',
  BANK_HOLDER: '',

  // Hạ tầng (Setup ghi)
  LESSON_CALENDAR_ID: '',
  UPLOADS_FOLDER_ID: '',
  BACKUP_FOLDER_ID: '',
  EXPORT_FOLDER_ID: '',
  BACKUP_KEEP: 30,

  // Lưu trữ hằng tháng (chunk 5G, Archive.gs): chuyển dòng cũ đã xong sang file lưu trữ theo năm, file DB luôn nhỏ.
  // Không xoá: chép, đọc lại đếm đủ, rồi mới bỏ khỏi DB. FALSE = tắt.
  ARCHIVE_ENABLED: true,
  // BOOKINGS, AVAILABILITY: giữ trong DB chừng này tháng gần nhất (tính từ ngày 1, tối thiểu 3). Gói còn chạy giữ mọi buổi.
  ARCHIVE_KEEP_MONTHS: 6,
  // Chunk 5K (anh chốt 01/11): ACTIVITY_LOG, MAIL_LOG, NOTIFICATIONS, METRICS giữ trong file DB chừng này ngày (mặc định 60,
  // tối thiểu 30), cũ hơn thì chuyển sang file lưu trữ (không mất). Thay ACTIVITY_LOG_KEEP_DAYS và ARCHIVE_LOG_KEEP_MONTHS.
  // Không chuyển: thông báo Khẩn, Cần xử lý chưa đọc; MAIL_LOG của email marketing (sổ chống gửi trùng, kind MKT:).
  LOG_KEEP_DAYS: 60,
  // Chạy 1 lần mỗi ngày từ giờ này (job mỗi giờ). -1 = chỉ chạy bằng menu.
  ARCHIVE_HOUR: 3,
  // Mỗi lô tối đa chừng này dòng mỗi tab; một lượt chạy nhiều lô tới khi hết (5K), hết giờ thì lượt sau (giờ sau) làm tiếp.
  ARCHIVE_MAX_ROWS: 3000,
  // Thư mục chứa file lưu trữ. Trống = tự tạo lần chạy đầu và ghi vào đây.
  ARCHIVE_FOLDER_ID: '',

  // Chunk 5K (BL03): link rút gọn trên tên miền (URL Redirect ở Namecheap), ví dụ https://dangky.thaiput.vn. Chỉ để menu
  // "Xem link trang web" hiện và đối chiếu; email vẫn dùng WEBAPP_URL. Trống = chưa có.
  SHORT_URL_HOME: '',
  SHORT_URL_LOGIN: '',
  SHORT_URL_STUDENT: '',
  SHORT_URL_TUTOR: '',

  // Bảo trì (chunk 5G, Maintenance.gs): OFF, READONLY (học viên, tutor chỉ xem), CLOSED (cổng học viên, tutor tạm đóng).
  // Admin luôn dùng được. Bật tắt nhanh bằng menu thaiput > Bảo trì.
  MAINTENANCE_MODE: 'OFF',
  // Chunk 5L: hệ thống đã chuyển (menu Chuyển hệ thống, Bước 1 ghi): link trang web mới, hiện trên trang báo của hệ thống cũ.
  MOVED_TO_URL: '',
  // Chữ tự do hiện trong câu báo bảo trì, ví dụ "đến 21:00 hôm nay". Trống = không ghi giờ.
  MAINTENANCE_UNTIL: ''
};

/** Mã lý do từ chối dùng chung giữa server, trang web và test. */
var REASONS = {
  OK: 'OK',
  DISABLED: 'DISABLED',
  NOT_ACTIVE: 'NOT_ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEADLINE: 'DEADLINE',
  INVALID_SLOT: 'INVALID_SLOT',
  ONE_PER_DAY: 'ONE_PER_DAY',
  NO_PACKAGE: 'NO_PACKAGE',
  EXPIRED: 'EXPIRED',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  NO_SESSIONS: 'NO_SESSIONS',
  NO_TUTOR: 'NO_TUTOR',
  CANCEL_DEADLINE: 'CANCEL_DEADLINE',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_PHONE: 'INVALID_PHONE',
  TRIAL_USED: 'TRIAL_USED',
  PACKAGE_CONTACT: 'PACKAGE_CONTACT',
  PACKAGE_BROKEN: 'PACKAGE_BROKEN',
  MISSING_SCREENSHOT: 'MISSING_SCREENSHOT',
  MISSING_CONSENT: 'MISSING_CONSENT',
  INVALID_INPUT: 'INVALID_INPUT',
  TOO_EARLY: 'TOO_EARLY',
  RATE_LIMITED: 'RATE_LIMITED',
  SLOT_BLOCKED: 'SLOT_BLOCKED',
  BUSY: 'BUSY',
  IN_PROGRESS: 'IN_PROGRESS',
  TOO_FAR: 'TOO_FAR',
  LINK_INVALID: 'LINK_INVALID',
  LINK_USED: 'LINK_USED',
  LINK_EXPIRED: 'LINK_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  SERVER_ERROR: 'SERVER_ERROR',
  GLOGIN_INVALID: 'GLOGIN_INVALID',
  GLOGIN_EXPIRED: 'GLOGIN_EXPIRED',
  GLOGIN_USED: 'GLOGIN_USED',
  GLOGIN_DENIED: 'GLOGIN_DENIED',
  MAINT_READONLY: 'MAINT_READONLY',
  MAINT_CLOSED: 'MAINT_CLOSED',
  SLOT_STARTED: 'SLOT_STARTED',
  LINK_COOLDOWN: 'LINK_COOLDOWN'
};

/** Câu hiển thị cho học viên (tiếng Việt). Trang tutor có bản tiếng Anh riêng trong UI. */
var REASON_TEXT_VI = {
  DISABLED: 'Hệ thống đang tạm dừng nhận đặt lịch. Vui lòng nhắn Zalo admin.',
  NOT_ACTIVE: 'Tài khoản chưa được kích hoạt.',
  SUSPENDED: 'Tài khoản đang tạm khoá. Vui lòng liên hệ admin.',
  DEADLINE: 'Đã quá hạn đặt cho giờ này.',
  INVALID_SLOT: 'Khung giờ không hợp lệ.',
  ONE_PER_DAY: 'Mỗi ngày chỉ được đặt 1 buổi.',
  NO_PACKAGE: 'Bạn chưa có gói học. Vui lòng đăng ký gói.',
  EXPIRED: 'Gói học đã hết hạn. Vui lòng gia hạn.',
  OUT_OF_RANGE: 'Ngày này nằm ngoài thời hạn gói học của bạn.',
  NO_SESSIONS: 'Bạn đã dùng hết số buổi của gói.',
  NO_TUTOR: 'Slot này hiện không còn Tutor. Vui lòng chọn khung giờ khác.',
  CANCEL_DEADLINE: 'Đã quá hạn huỷ (trước 15:00 hôm trước).',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  INVALID_PHONE: 'Số điện thoại chưa đúng (tối đa 40 ký tự).',
  TRIAL_USED: 'Mỗi email chỉ dùng Trial 1 lần.',
  PACKAGE_CONTACT: 'Gói này đăng ký qua Zalo admin, không đăng ký trên web.',
  PACKAGE_BROKEN: 'Gói này đang được cập nhật, tạm chưa đăng ký được. Nhắn Zalo admin hoặc chọn gói khác.',
  MISSING_SCREENSHOT: 'Vui lòng tải ảnh chụp chuyển khoản.',
  MISSING_CONSENT: 'Vui lòng đồng ý chính sách xử lý dữ liệu cá nhân.',
  INVALID_INPUT: 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.',
  TOO_EARLY: 'Buổi học chưa bắt đầu.',
  RATE_LIMITED: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 5 phút.',
  SLOT_BLOCKED: 'Slot này đã được duyệt huỷ (tutor bận), chỉ admin mở lại được.',
  BUSY: 'Hệ thống đang bận, vui lòng thử lại sau ít giây.',
  IN_PROGRESS: 'Thao tác trước của bạn đang được xử lý. Vui lòng chờ ít giây.',
  TOO_FAR: 'Chỉ đặt được trong vài tuần tới. Vui lòng chọn ngày gần hơn.',
  LINK_INVALID: 'Link đăng nhập không hợp lệ. Vui lòng yêu cầu gửi lại liên kết đăng nhập mới.',
  LINK_USED: 'Link này đã được dùng. Vui lòng yêu cầu gửi lại liên kết đăng nhập mới.',
  LINK_EXPIRED: 'Link đã hết hạn. Vui lòng yêu cầu gửi lại liên kết đăng nhập mới.',
  SESSION_INVALID: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  SERVER_ERROR: 'Có lỗi xảy ra, admin đã được báo. Vui lòng thử lại sau ít phút hoặc nhắn Zalo admin.',
  MAINT_READONLY: 'Hệ thống đang bảo trì{until}. Bạn vẫn xem được lịch; đặt, huỷ và lưu thay đổi tạm dừng.',
  MAINT_CLOSED: 'Hệ thống đang bảo trì{until}. Vui lòng quay lại sau hoặc nhắn Zalo admin.',
  SLOT_STARTED: 'Buổi học đã bắt đầu, không đổi tutor được nữa. Dùng "Vắng tutor" nếu tutor không dạy.',
  LINK_COOLDOWN: 'Nếu email có trong hệ thống, link đã được gửi lúc {sent}. Kiểm cả mục Spam. Xin link mới được sau {next}.'
};

// ── Script Properties ──

function props_() { return PropertiesService.getScriptProperties(); }
/*
 * Chunk 5I (đo số lượt gọi Google): một lượt đặt lịch đọc Script Properties ENV và DB_ID 18 lần. Hai giá trị này chỉ đổi khi
 * cài đặt hoặc chuyển PRODUCTION, nên nhớ trong một lần chạy. Mỗi lần chạy của Apps Script bắt đầu với bộ nhớ trống;
 * clearDbCache_ và các hàm ghi ENV, DB_ID gọi forgetEnvMemo_.
 */
var ENV_MEMO_ = null, DBID_MEMO_ = {};
function forgetEnvMemo_() { ENV_MEMO_ = null; DBID_MEMO_ = {}; }
function getEnv_() { if (ENV_MEMO_ === null) ENV_MEMO_ = props_().getProperty('ENV') || 'STAGING'; return ENV_MEMO_; }
function isProduction_() { return getEnv_() === 'PRODUCTION'; }
function getDbId_() {
  var env = getEnv_(), id = DBID_MEMO_[env];
  if (id) return id;
  id = props_().getProperty('DB_ID_' + env);
  if (!id) throw new Error('Chưa cấu hình DB_ID_' + env + ' trong Script Properties. Chạy menu thaiput > Cài đặt lần đầu.');
  DBID_MEMO_[env] = id;
  return id;
}

// ── Tab CONFIG ──

var CFG_CACHE_ = null;

/** Đọc một khoá cấu hình. Ưu tiên tab CONFIG, sau đó DEFAULTS_. Ép kiểu theo kiểu của giá trị mặc định. */
/**
 * Chunk 5J: khoá cấu hình đã đổi tên. Khoá mới chưa có trong tab CONFIG (đã dán code, chưa chạy menu 1) mà khoá cũ có giá trị
 * KHÁC mặc định cũ (admin đã tự chỉnh) thì dùng giá trị cũ. Giá trị cũ bằng mặc định cũ thì dùng mặc định mới (quyết định 01/11).
 * Menu 1 chép theo đúng luật này rồi mới thêm khoá mặc định (cfgCarryRenamed_).
 */
var CFG_RENAMED_ = {
  STUDENT_LINK_MINUTES: ['LOGIN_LINK_MINUTES', 15], TUTOR_LINK_MINUTES: ['LOGIN_LINK_MINUTES', 15],
  STUDENT_LINK_MAX_USES: ['LOGIN_LINK_MAX_USES', 0], TUTOR_LINK_MAX_USES: ['STAFF_LOGIN_LINK_MAX_USES', 1], ADMIN_LINK_MAX_USES: ['STAFF_LOGIN_LINK_MAX_USES', 1],
  RESULT_NOTICE_AFTER_HOURS: ['AUTO_COMPLETE_AFTER_HOURS', 24],
  // Chunk 5K: phần tử thứ 3 = bản bắt đầu đổi tên (ghi chú ô cũ ở menu 1).
  LOG_KEEP_DAYS: ['ACTIVITY_LOG_KEEP_DAYS', 60, '8.1.2']
};
function cfgRenamedValue_(key) {
  var r = CFG_RENAMED_[key];
  if (!r || !Object.prototype.hasOwnProperty.call(CFG_CACHE_, r[0])) return undefined;
  var v = coerceCfg_(CFG_CACHE_[r[0]], r[1]);
  return v === r[1] ? undefined : v;
}
function cfg_(key) {
  if (CFG_CACHE_ === null) CFG_CACHE_ = loadConfigTab_();
  if (!Object.prototype.hasOwnProperty.call(CFG_CACHE_, key) && CFG_RENAMED_[key]) { var rv = cfgRenamedValue_(key); if (rv !== undefined) return rv; }
  var hasDefault = Object.prototype.hasOwnProperty.call(DEFAULTS_, key);
  if (!hasDefault && !Object.prototype.hasOwnProperty.call(CFG_CACHE_, key)) {
    throw new Error('Khoá cấu hình không tồn tại: ' + key);
  }
  var raw = Object.prototype.hasOwnProperty.call(CFG_CACHE_, key) ? CFG_CACHE_[key] : DEFAULTS_[key];
  return coerceCfg_(raw, hasDefault ? DEFAULTS_[key] : raw);
}

function coerceCfg_(raw, def) {
  if (raw === '' || raw === null || raw === undefined) return def;
  // Ô CONFIG không ở định dạng chữ: Sheets tự đổi '08:00' thành giờ (Date). Đổi ngược về 'HH:mm'.
  if (raw instanceof Date && typeof def === 'string') {
    return (raw.getHours() < 10 ? '0' : '') + raw.getHours() + ':' + (raw.getMinutes() < 10 ? '0' : '') + raw.getMinutes();
  }
  if (typeof def === 'number') { var n = Number(raw); return isNaN(n) ? def : n; }
  if (typeof def === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    var s = String(raw).trim().toUpperCase();
    return s === 'TRUE' || s === '1' || s === 'YES' || s === 'CÓ';
  }
  return String(raw).trim();
}

/** Danh sách từ chuỗi "a,b,c". */
function cfgList_(key) {
  return String(cfg_(key)).split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; });
}

/**
 * Đọc tab CONFIG. Chunk 5F: kết quả đệm trong CacheService CFG_CACHE_SECONDS_ giây để mỗi lượt gọi của trang web không
 * phải mở tab CONFIG (một lần đọc Sheets ít hơn mỗi lượt). Admin sửa tab CONFIG: onEdit xoá đệm ngay; code ghi CONFIG
 * (Db.gs) cũng xoá đệm. Ô bị Sheets đổi thành giờ (Date) được giữ nguyên kiểu khi đi qua bộ đệm.
 */
var CFG_CACHE_SECONDS_ = 60;
function cfgCacheKey_() { return 'cfg_tab_v1'; }
/*
 * Phiên bản CONFIG (soát R1 L6): mỗi lần CONFIG đổi (onEdit, code ghi CONFIG) tăng 'cfg_ver'. Bản đệm ghi kèm phiên bản đọc
 * TRƯỚC khi mở tab; chỉ dùng bản đệm khi phiên bản còn khớp. Một lượt đọc tab cũ rồi ghi đệm sau khi admin vừa sửa sẽ bị bỏ.
 */
function cfgVersion_(cache) { try { return cache.get('cfg_ver') || '0'; } catch (e) { return '0'; } }
function loadConfigTab_() {
  var out = {}, cache = null, ver = '0';
  try {
    cache = CacheService.getScriptCache();
    ver = cfgVersion_(cache);
    var hit = cache.get(cfgCacheKey_());
    if (hit) {
      var packed = JSON.parse(hit);
      if (packed.__v === ver) {
        delete packed.__v;
        Object.keys(packed).forEach(function (k) { var v = packed[k]; out[k] = v && typeof v === 'object' && 'd' in v ? new Date(v.d) : v; });
        return out;
      }
    }
  } catch (e) { cache = null; }
  var read = false;
  try {
    var sh = dbSpreadsheet_().getSheetByName('CONFIG');   // chunk 5I: dùng chung file đã mở (không mở lần hai)
    if (!sh) return out;
    var values = sh.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var k = String(values[i][0] || '').trim();
      if (k) out[k] = values[i][1];
    }
    read = true;
  } catch (e) {
    // Chưa cài đặt DB: dùng mặc định. Lỗi thật sẽ lộ ra ở getDbId_() khi đọc dữ liệu.
  }
  if (read && cache) {
    try {
      var pack = { __v: ver };
      Object.keys(out).forEach(function (k) { var v = out[k]; pack[k] = v instanceof Date ? { d: v.getTime() } : v; });
      cache.put(cfgCacheKey_(), JSON.stringify(pack), CFG_CACHE_SECONDS_);
    } catch (e2) { }
  }
  return out;
}

/** Bỏ bộ đệm CONFIG dùng chung (CacheService); lần đọc sau mở lại tab. Không đụng bộ nhớ của lần chạy hiện tại. */
function dropConfigCache_() { try { var c = CacheService.getScriptCache(); c.put('cfg_ver', String(Date.now()) + Math.floor(Math.random() * 1000), 21600); c.remove(cfgCacheKey_()); } catch (e) { } }

/** Quên CONFIG đã đọc trong lần chạy này (lần đọc sau lấy từ bộ đệm dùng chung nếu còn). */
function clearConfigMemory_() { CFG_CACHE_ = null; NOTIFY_RULES_CACHE_ = null; }
/** Xoá cache trong một lần chạy và bộ đệm dùng chung (gọi khi admin vừa sửa tab CONFIG hoặc trong test). */
function clearConfigCache_() { CFG_CACHE_ = null; NOTIFY_RULES_CACHE_ = null; dropConfigCache_(); try { bumpSlotsVersion_(); } catch (e) { } }
