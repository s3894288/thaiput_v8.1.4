/**
 * THAIPUT v8.1.7 · Code.gs (bản gộp để dán tay vào trình soạn thảo Apps Script)
 * Gộp từ 38 file trong src/: Config.gs, Schema.gs, Time.gs, Admin.gs, AdminApi.gs, AdminOps.gs, Api.gs, Archive.gs, Assign.gs, Auth.gs, Availability.gs, Backup.gs, Booking.gs, CalendarQueue.gs, CalendarSync.gs, Compensation.gs, Content.gs, Db.gs, EmailTemplates.gs, Jobs.gs, LoadTest.gs, Log.gs, MailTransport.gs, Maintenance.gs, Marketing.gs, Metrics.gs, Notifications.gs, Notify.gs, Packages.gs, Phone.gs, Registration.gs, Release.gs, Report.gs, Reset.gs, Sessions.gs, Setup.gs, SystemMove.gs, TutorLock.gs
 * Không sửa file này: sửa src/ rồi chạy node test/build_dist.js. Hướng dẫn cập nhật: HUONG_DAN_PHAT_HANH.md.
 * Gửi email cố định từ 8.1.4 (MailTransport.gs, GmailApp): KHÔNG cần file MailFix, KHÔNG tìm và thay. Có file MailFix.gs cũ thì xoá.
 */
// ── Config.gs ──
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
  // Chunk 5N: buổi ở trạng thái Chờ đổi tutor (PENDING_REASSIGN) quá số giờ này thì job mỗi giờ báo admin (REASSIGN_STUCK).
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

// ── Schema.gs ──
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

// ── Time.gs ──
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

// ── Admin.gs ──
/**
 * Admin.gs · Admin làm việc trên Google Sheets (v8, plan mục 4.7)
 *
 * Hai cách thao tác:
 *   1. Dropdown ngay trên dòng dữ liệu (trigger onEditInstallable bắt thay đổi):
 *        REGISTRATIONS.admin_action   Duyệt | Từ chối          (ghi lý do từ chối ở cột note trước)
 *        AVAILABILITY.admin_decision  Duyệt | Từ chối
 *        BOOKINGS.admin_action        Huỷ bởi admin | Đổi tutor | Vắng tutor | 3 lựa chọn lỗi buổi kỹ thuật (chunk 5M)
 *                                     | Đã xử lý (giữ nguyên) (chunk 5N: chỉ ghi admin_done_at, hết tô màu)
 *                                     (Đổi tutor: ghi mã tutor muốn chọn vào admin_note, để trống thì hệ thống tự chọn)
 *        STUDENT_PACKAGES             ô hệ thống bị trả lại; end_date, comp_days_admin chỉ PKG_EDITORS sửa (chunk 5M)
 *   2. Menu "thaiput" trên thanh công cụ.
 * Mọi thao tác gọi lớp dịch vụ (AdminOps.gs, Registration.gs, Availability.gs); file này chỉ là phần nối.
 */

var BOOKING_ADMIN_ACTIONS = ['Huỷ bởi admin', 'Đổi tutor', 'Vắng tutor', 'Không tính lương buổi kỹ thuật', 'Tính lương buổi kỹ thuật', 'Lỗi khách quan: tính lương và bù',
  'Hoàn thành (admin chọn)', 'Vắng học viên (admin chọn)', 'Vấn đề kỹ thuật (admin chọn)', 'Đã xử lý (giữ nguyên)'];
/** Chunk 5N: lựa chọn chỉ đánh dấu admin đã xem (ghi admin_done_at), không đổi dữ liệu buổi. */
var ADMIN_MARK_DONE_ACTION_ = 'Đã xử lý (giữ nguyên)';
/**
 * Soát 5Q: đăng ký đã xử lý mà admin chọn lại (ô đã bị Sheets ghi giá trị mới): trả ô về kết quả thật (có gói từ đăng ký này
 * = Duyệt, không có = Từ chối) và báo rõ là không đổi gì.
 */
function regAlreadyDone_(id) {
  return withLock_(function () {
    var t = table_('REGISTRATIONS'), reg = t.byId(id);
    if (!reg) return { ok: false, message: 'Không thấy đăng ký ' + id };
    var approved = table_('STUDENT_PACKAGES').all().some(function (sp) { return String(sp.reg_id) === String(id); });
    var real = approved ? ADMIN_DECISION.APPROVE : ADMIN_DECISION.REJECT;
    if (reg.admin_action !== real) t.update(reg, { admin_action: real });
    return { ok: false, already: true, message: 'Đăng ký ' + id + ' đã ' + (approved ? 'duyệt' : 'từ chối') + ' trước đó, KHÔNG đổi được. Ô đã trả về "' + real + '".' };
  });
}
/** Chunk 5J: admin chọn kết quả thay tutor (buổi đã bắt đầu còn chờ, hoặc đã Không hoàn thành). */
var ADMIN_RESULT_ACTIONS_ = { 'Hoàn thành (admin chọn)': 'COMPLETED', 'Vắng học viên (admin chọn)': 'STUDENT_ABSENT', 'Vấn đề kỹ thuật (admin chọn)': 'TECH_ISSUE' };
/** Chunk 5M: lựa chọn ở admin_action cho buổi Vấn đề kỹ thuật → tech_fault. */
var TECH_FAULT_ACTIONS_ = { 'Không tính lương buổi kỹ thuật': 'TUTOR', 'Tính lương buổi kỹ thuật': 'STUDENT', 'Lỗi khách quan: tính lương và bù': 'OBJECTIVE' };
/** Chọn lại "Vắng tutor" trong số phút này để xác nhận ghi đè buổi đã có kết quả. */
var TUTOR_ABSENT_CONFIRM_MIN_ = 10;

/**
 * Menu thaiput (5K: gom nhóm, tiếng Việt). 3 mục đầu dùng nhiều nhất giữ ở trên; mỗi nhóm một menu con. Mục chỉ cho
 * STAGING (Test) không hiện trên PRODUCTION. Thêm mục mới: đặt vào đúng nhóm, test I126 kiểm mọi hàm trong menu có thật.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var m = ui.createMenu('thaiput')
    .addItem('1. Cài đặt lần đầu / cập nhật cấu trúc', 'menuSetup')
    .addItem('2. Kiểm tra hệ thống', 'menuTestSystem')
    .addItem('3. Tạo lại trigger tự động', 'menuCreateTriggers')
    .addItem('Xem link trang web', 'menuShowLinks')
    .addSeparator()
    .addSubMenu(ui.createMenu('Người dùng')
      .addItem('Tạm khoá học viên (dòng đang chọn ở USERS)', 'menuSuspend')
      .addItem('Mở khoá học viên (dòng đang chọn ở USERS)', 'menuUnsuspend')
      .addItem('Gửi link đăng nhập (các dòng đang chọn ở USERS)', 'menuResendLogin')
      .addItem('Thêm tutor', 'menuAddTutor')
      .addItem('Thêm admin', 'menuAddAdmin')
      .addSeparator()
      .addItem('Khoá tutor (dòng đang chọn ở USERS, xem trước, hỏi lại 2 lần)', 'menuLockTutor')
      .addItem('Mở khoá tutor (dòng đang chọn ở USERS)', 'menuUnlockTutor'))
    .addSubMenu(ui.createMenu('Gói học')
      .addItem('Thêm gói', 'menuAddPackage'))
    .addSubMenu(ui.createMenu('Báo cáo')
      .addItem('Làm mới báo cáo tháng này', 'menuReportThisMonth')
      .addItem('Báo cáo tháng trước', 'menuReportLastMonth'))
    .addSubMenu(ui.createMenu('Email')
      .addItem('Cập nhật nội dung web và email (sau khi sửa CONTENT, EMAIL_TEMPLATES)', 'menuRefreshContent')
      .addItem('Gửi thử một mẫu email cho tôi', 'menuPreviewEmail')
      .addItem('Kiểm tra gửi email (thư có mã, hướng dẫn tìm thư bị mất)', 'menuMailTest')
      .addSeparator()
      .addItem('Email marketing: gửi thử một chiến dịch cho tôi', 'menuMarketingTest')
      .addItem('Email marketing: gửi chiến dịch (hỏi lại kèm số người nhận)', 'menuMarketingSend'))
    .addSubMenu(ui.createMenu('Cập nhật phiên bản')
      .addItem('Bảo trì: chỉ xem (học viên, tutor không đặt, huỷ được)', 'menuMaintReadonly')
      .addItem('Bảo trì: đóng cổng học viên và tutor', 'menuMaintClosed')
      .addItem('Bảo trì: tắt (chạy bình thường)', 'menuMaintOff')
      .addSeparator()
      .addItem('Phát hành: sao lưu ngay (thư mục Releases, không tự xoá)', 'menuReleaseBackup')
      .addItem('Các bước chuyển dữ liệu theo phiên bản (chỉ đọc)', 'menuMigrationStatus')
      .addItem('Bù buổi 8.1.0: xem trước gói sẽ đổi ngày (chỉ đọc)', 'menuCompDryRun'))
    .addSubMenu(ui.createMenu('Chuyển hệ thống')
      .addItem('Bước 1 (hệ thống CŨ): Chuẩn bị chuyển (đóng cổng, gỡ sự kiện, xoá trigger, ghi META)', 'menuMovePrepare')
      .addItem('Bước 2 (hệ thống MỚI): Chạy thử chép dữ liệu (chỉ đọc)', 'menuMoveDryRun')
      .addItem('Bước 3 (hệ thống MỚI): Chép dữ liệu thật (chạy lại được)', 'menuMoveImport')
      .addItem('Bước 4 (hệ thống MỚI): tạo lại sự kiện các buổi sắp tới', 'menuRecreateEvents')
      .addSeparator()
      .addItem('Chỉ gỡ sự kiện các buổi sắp tới (hệ thống cũ, đổi tài khoản lịch)', 'menuDetachEvents'))
    .addSubMenu(ui.createMenu('Lưu trữ')
      .addItem('Lưu trữ: xem tình trạng', 'menuArchiveStatus')
      .addItem('Lưu trữ: mở file (link từng năm)', 'menuArchiveFiles')
      .addItem('Lưu trữ: chạy ngay (chủ file)', 'menuArchiveNow'))
    .addSubMenu(ui.createMenu('Công cụ kỹ thuật')
      .addItem('Sao lưu ngay (thư mục Backup)', 'nightlyBackup')
      .addItem('Calendar: tạo sự kiện đang chờ ngay', 'menuCalendarRunNow')
      .addItem('Đo tốc độ (chỉ đọc)', 'menuSpeedTest')
      .addItem('Đăng nhập Google: tạo khoá bí mật (chủ file)', 'menuGoogleLoginSecret')
      .addItem('Tắt hết trigger tự động (STAGING khi PRODUCTION chạy chính thức)', 'menuStopTriggers')
      .addItem('Xoá dữ liệu test (2 bước xác nhận)', 'menuResetTestData'));
  if (!isProduction_()) {
    m.addSeparator().addSubMenu(ui.createMenu('Test (chỉ STAGING)')
      .addItem('Bật giả lập thời gian', 'menuSimNow')
      .addItem('Tắt giả lập thời gian', 'menuClearSimNow')
      .addItem('Chạy reminderJob', 'reminderJob')
      .addItem('Chạy hourlyJob', 'hourlyJob')
      .addItem('Chạy calendarJob (như trigger 5 phút)', 'calendarJob')
      .addItem('Chạy dailyJob', 'dailyJob')
      .addSeparator()
      .addItem('Thử tải: tạo dữ liệu giả (100 học viên, 10 tutor)', 'menuLoadTestSeed')
      .addItem('Thử tải: bật 2 giờ (hiện khoá)', 'menuLoadTestEnable')
      .addItem('Thử tải: tắt', 'menuLoadTestOff')
      .addItem('Thử tải: kiểm kết quả', 'menuLoadTestCheck'));
  }
  m.addToUi();
}

function adminActor_(e) {
  var email = '';
  try { email = (e && e.user && e.user.getEmail && e.user.getEmail()) || ''; } catch (x) { }
  if (!email) { try { email = Session.getActiveUser().getEmail(); } catch (x2) { } }
  // Gmail thường đôi khi không trả email người sửa cho trigger: ghi ADMIN để vẫn biết thao tác từ Sheets.
  return email || 'ADMIN';
}

/** Trigger onEdit cài đặt (installable). Chỉ xử lý 3 cột dropdown; mọi ô khác bỏ qua. */
function onEditInstallable(e) { requireOperator_(e);
  if (!e || !e.range) return;
  // Chunk 5M: giờ admin sửa ô (trước khi chờ khoá). "Huỷ bởi admin" xét mốc 15:00 hôm trước theo giờ này.
  var editedAt = getNow_();
  var sh = e.range.getSheet(), name = sh.getName();
  // Chunk 5F: admin sửa tay thì bộ đệm dùng chung hết hiệu lực ngay (CONFIG 60 giây, danh sách slot 60 giây).
  if (name === 'CONFIG') { dropConfigCache_(); bumpSlotsVersion_(); }
  if (name === 'BOOKINGS' || name === 'AVAILABILITY' || name === 'USERS') bumpSlotsVersion_();
  // Chunk 5I: nhật ký ghi mọi sửa tay trong Sheets (tab, ô, giá trị cũ và mới). Lỗi ghi nhật ký không chặn việc xử lý bên dưới.
  try { logSheetEdit_(e, sh, name); } catch (x) { Logger.log('Không ghi được nhật ký sửa tay: ' + x.message); }
  if (name === 'STUDENT_PACKAGES') {
    var pr = null;
    try { pr = handlePackageEdit_(e, sh, adminActor_(e)); } catch (pe) { mailAdminError_('Sửa tay STUDENT_PACKAGES', (pe && pe.stack) || String(pe)); }
    if (pr && pr.message) { try { SpreadsheetApp.getActive().toast(pr.message, 'thaiput', 10); } catch (x) { } }
    return pr;
  }
  if (['REGISTRATIONS', 'AVAILABILITY', 'BOOKINGS', 'USERS'].indexOf(name) === -1) return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  var header = sh.getRange(1, e.range.getColumn()).getValue();
  var value = String(e.value === undefined ? e.range.getValue() : e.value).trim();
  var idCol = SCHEMA[name].cols.indexOf(SCHEMA[name].id) + 1;
  var id = String(sh.getRange(e.range.getRow(), idCol).getValue());
  var res = handleAdminEdit_(name, String(header), id, value, adminActor_(e), { at: editedAt });
  if (res && res.message) { try { SpreadsheetApp.getActive().toast(res.message, 'thaiput', 8); } catch (x) { } }
  return res;
}

/*
 * Chunk 5I: sửa tay trong Sheets (gõ, chọn dropdown, dán, xoá ô) ghi một dòng SHEET_EDIT vào ACTIVITY_LOG. Không ghi các tab
 * nhật ký (ACTIVITY_LOG, MAIL_LOG, METRICS) để không tự sinh dòng vô tận; tab AUTH chỉ ghi ô nào bị sửa, không ghi giá trị (mã phiên).
 * Tab không thuộc hệ thống (REPORT_MONTH, tab admin tự tạo) bỏ qua.
 */
var SHEET_EDIT_SKIP_ = ['ACTIVITY_LOG', 'MAIL_LOG', 'METRICS'];
var SHEET_EDIT_HIDE_VALUES_ = ['AUTH'];
function colLetter_(n) { var out = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out; return out; }
function a1Of_(row, col, nr, nc) { var a = colLetter_(col) + row; return nr > 1 || nc > 1 ? a + ':' + colLetter_(col + nc - 1) + (row + nr - 1) : a; }
/**
 * Hàm thuần: chi tiết của một lần sửa tay (chữ trung tính, không theo một thứ tiếng). Giá trị dài cắt còn 200 ký tự.
 * oldV undefined: Google không gửi giá trị cũ (ô cũ trống, hoặc dán đè): ghi "?" thay vì giả là trống (soát 5I A11).
 * values (sửa nhiều ô, tối đa 20 ô): giá trị mới từng ô.
 */
function sheetEditDetail_(name, a1, header, oldV, newV, cells, values) {
  var cut = function (v) { v = v === undefined || v === null ? '' : String(v); return v.length > 200 ? v.substring(0, 200) + '…' : v; };
  var hide = SHEET_EDIT_HIDE_VALUES_.indexOf(name) !== -1;
  if (cells > 1) return a1 + ' ×' + cells + (values && !hide ? ': ' + values.map(function (x) { return x[0] + '="' + cut(x[1]) + '"'; }).join(', ').substring(0, 1500) : '');
  if (hide) return a1 + (header ? ' (' + header + ')' : '') + ': •••';
  return a1 + (header ? ' (' + header + ')' : '') + ': ' + (oldV === undefined ? '?' : '"' + cut(oldV) + '"') + ' → "' + cut(newV) + '"';
}
function logSheetEdit_(e, sh, name) {
  if (!SCHEMA[name] || SHEET_EDIT_SKIP_.indexOf(name) !== -1) return;
  var r = e.range, row = r.getRow(), col = r.getColumn(), nr = r.getNumRows(), nc = r.getNumColumns();
  var header = nc === 1 ? String(sh.getRange(1, col).getValue() || '') : '', id = '';
  var key = SCHEMA[name].id, ki = key ? SCHEMA[name].cols.indexOf(key) : -1;
  if (nr === 1 && row > 1 && ki !== -1) { try { var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), kc = hdr.indexOf(key) + 1; if (kc > 0) id = String(sh.getRange(row, kc).getValue() || ''); } catch (x) { } }
  var oldV = e.oldValue, newV = e.value === undefined && nr === 1 && nc === 1 ? r.getValue() : e.value, values = null;
  if (nr * nc > 1 && nr * nc <= 20) {
    try { var vv = r.getValues(); values = []; vv.forEach(function (line, i) { line.forEach(function (v, j) { values.push([a1Of_(row + i, col + j, 1, 1), v instanceof Date ? fmtDateTime_(v) : v]); }); }); } catch (x) { values = null; }
  }
  logMenu_(e, 'SHEET_EDIT', name, name === 'AUTH' ? '' : id, sheetEditDetail_(name, a1Of_(row, col, nr, nc), header, oldV, newV, nr * nc, values));
}

/**
 * Chunk 5I (soát A2): trigger đổi cấu trúc (onChange): xoá hoặc chèn dòng, cột, thêm, xoá, đổi tên tab. Ghi SHEET_CHANGE với
 * loại thay đổi và tab đang mở. Sửa giá trị ô (EDIT) đã có onEditInstallable; đổi định dạng (FORMAT) không ghi.
 */
var SHEET_CHANGE_LOG_ = ['INSERT_ROW', 'REMOVE_ROW', 'INSERT_COLUMN', 'REMOVE_COLUMN', 'INSERT_GRID', 'REMOVE_GRID', 'OTHER'];
var SHEET_SNAP_KEY_ = 'SHEET_SNAP';
/** Danh sách tab hiện có { sheetId: tên }. */
function sheetSnapshot_(ss) { var o = {}; ss.getSheets().forEach(function (s) { o[String(s.getSheetId())] = s.getName(); }); return o; }
function saveSheetSnapshot_(ss) { try { props_().setProperty(SHEET_SNAP_KEY_, JSON.stringify(sheetSnapshot_(ss || SpreadsheetApp.getActive()))); } catch (x) { } }
/**
 * Hàm thuần: so hai danh sách tab. Trả { added: [tên], removed: [tên], renamed: [[cũ, mới]] }. Một tab mất và một tab mới
 * trong cùng lần đổi kiểu OTHER là đổi tên (Google không gửi tên cũ).
 */
function sheetDiff_(oldSnap, nowSnap, type) {
  var added = [], removed = [], renamed = [];
  Object.keys(nowSnap).forEach(function (id) { if (!(id in oldSnap)) added.push(nowSnap[id]); else if (oldSnap[id] !== nowSnap[id]) renamed.push([oldSnap[id], nowSnap[id]]); });
  Object.keys(oldSnap).forEach(function (id) { if (!(id in nowSnap)) removed.push(oldSnap[id]); });
  if (type === 'OTHER' && added.length === 1 && removed.length === 1) { renamed.push([removed[0], added[0]]); added = []; removed = []; }
  return { added: added, removed: removed, renamed: renamed };
}
function onChangeInstallable(e) {
  // Soát vòng 2 N7: Google gọi trigger này cả khi sửa ô (EDIT) và đổi định dạng (FORMAT): bỏ ngay, không gọi dịch vụ nào.
  if (e && e.changeType && SHEET_CHANGE_LOG_.indexOf(String(e.changeType)) === -1) return null;
  requireOperator_(e);
  if (!e || SHEET_CHANGE_LOG_.indexOf(String(e.changeType)) === -1) return null;
  var type = String(e.changeType), ss = e.source || SpreadsheetApp.getActive(), name = '', rng = '', detail = type, touched = [];
  if (type === 'INSERT_GRID' || type === 'REMOVE_GRID' || type === 'OTHER') {
    // Soát vòng 2 N3: tab vừa xoá không còn để hỏi tên; so với danh sách tab đã lưu để biết đúng tab bị thêm, xoá, đổi tên.
    var old = null; try { old = JSON.parse(props_().getProperty(SHEET_SNAP_KEY_) || 'null'); } catch (x) { }
    var now = {}; try { now = sheetSnapshot_(ss); } catch (x) { }
    if (old) {
      var d = sheetDiff_(old, now, type);
      if (type === 'OTHER' && !d.added.length && !d.removed.length && !d.renamed.length) return null;   // OTHER không đổi tab: bỏ
      touched = d.removed.concat(d.renamed.map(function (r) { return r[0]; }));
      name = d.removed.concat(d.added, d.renamed.map(function (r) { return r[1]; })).join(',');
      detail = JSON.stringify({ type: type, added: d.added, removed: d.removed, renamed: d.renamed });
    }
    saveSheetSnapshot_(ss);
  } else {
    try { var sh = ss.getActiveSheet(); name = sh.getName(); var ar = sh.getActiveRange(); if (ar) rng = a1Of_(ar.getRow(), ar.getColumn(), ar.getNumRows(), ar.getNumColumns()); } catch (x) { }
    detail = type + (rng ? ' ' + rng : '');
  }
  logMenu_(e, 'SHEET_CHANGE', name, '', detail);
  var sys = touched.filter(function (n) { return SCHEMA[n]; });
  if (sys.length) {
    try { notify_('SHEET_REMOVED', { actor: adminActor_(e), entity: 'SHEET', entity_id: sys.join(','),
      message: 'Tab ' + sys.join(', ') + ' vừa bị xoá hoặc đổi tên trong Sheets. Hệ thống cần đúng tên tab này: khôi phục ngay (Tệp → Nhật ký phiên bản, hoặc đổi lại tên).',
      message_en: 'Tab ' + sys.join(', ') + ' was just deleted or renamed in Sheets. The system needs this exact tab name: restore it now (File → Version history, or rename it back).' }); } catch (x) { }
  }
  if (/BOOKINGS|AVAILABILITY|USERS/.test(name + ',' + touched.join(','))) bumpSlotsVersion_();
  return true;
}

/** Phần xử lý tách riêng khỏi trigger để test được. Trả { ok, message }. */
function handleAdminEdit_(sheetName, header, id, value, actor, opts) {
  opts = opts || {};
  try {
    if (sheetName === 'REGISTRATIONS' && header === 'admin_action') {
      if (value === ADMIN_DECISION.APPROVE) { var a = approveRegistration_(id, actor); return a.already ? regAlreadyDone_(id) : { ok: a.ok, message: 'Đã duyệt ' + id + ', đã gửi email chào mừng.' }; }
      if (value === ADMIN_DECISION.REJECT) {
        clearDbCache_(); var reg = table_('REGISTRATIONS').byId(id);
        var r = rejectRegistration_(id, actor, reg ? reg.note : ''); return r.already ? regAlreadyDone_(id) : { ok: r.ok, message: 'Đã từ chối ' + id + '.' };
      }
      return null;
    }
    if (sheetName === 'AVAILABILITY' && header === 'admin_decision') {
      if (!value || value === TUTOR_CANCEL_DECISION.PENDING) return null;
      var d = decideTutorCancel_(id, value, actor);
      var txt = { REASSIGNED: 'Đã duyệt, đã đổi sang tutor khác.', CANCELLED_TUTOR: 'Đã duyệt, buổi đã huỷ và báo học viên (không trừ buổi).', SLOT_CANCELLED: 'Đã duyệt huỷ slot.', REJECTED: 'Đã từ chối, tutor vẫn dạy.' };
      return { ok: d.ok, message: d.ok ? txt[d.outcome] : 'Không xử lý được: ' + (REASON_TEXT_VI[d.reason] || d.reason) };
    }
    // Khoá tài khoản (status DISABLED) trong tab USERS: thoát mọi thiết bị ngay, không chờ job mỗi giờ.
    if (sheetName === 'USERS' && header === 'status') {
      if (value !== USER_STATUS.DISABLED) return null;
      clearDbCache_(); var uu = userById_(id);
      if (!uu) return null;
      var lo = logoutAll_(uu, actor);
      return { ok: true, message: 'Đã khoá ' + id + ' và thoát ' + lo.count + ' thiết bị.' };
    }
    if (sheetName === 'BOOKINGS' && header === 'admin_action') {
      if (BOOKING_ADMIN_ACTIONS.indexOf(value) === -1) return null;
      // Nhận việc trong khoá: xoá ô admin_action trước. Trigger chạy lần 2 cho cùng một lần chọn (ví dụ có 2 bộ trigger)
      // thấy ô đã trống thì bỏ qua, không đổi tutor hay huỷ 2 lần.
      var b = withLock_(function () {
        var fresh = table_('BOOKINGS').byId(id);
        if (!fresh || fresh.admin_action !== value) return fresh ? 'DONE' : null;
        table_('BOOKINGS').update(fresh, { admin_action: '' });
        return { admin_note: fresh.admin_note };
      }), out;
      if (b === 'DONE') return null;
      if (!b) return { ok: false, message: 'Không thấy booking ' + id };
      var note = '';
      if (value === 'Huỷ bởi admin') {
        out = adminCancelBooking_(id, actor, b.admin_note || 'Admin huỷ', opts.at);
        if (out.ok && out.late) note = ' (sau ' + cfg_('CANCEL_CUTOFF_HOUR') + ':00 hôm trước: Huỷ muộn, trừ lượt, không bù)';
      } else if (value === 'Đổi tutor') {
        // Soát 5Q: admin_note thường còn chữ cũ ("Đã: ...", "Lỗi: ..."): chỉ lấy đúng một mã tutor, không có thì tự chọn.
        var tm = String(b.admin_note || '').toUpperCase().match(/\bT\d{3,}\b/);
        out = adminReassignBooking_(id, actor, tm ? tm[0] : null);
      }
      else if (value === 'Vắng tutor') {
        // Ghi đè buổi đã có kết quả: tutor mất lương buổi đó, nên phải chọn lại lần hai trong TUTOR_ABSENT_CONFIRM_MIN_ phút.
        var ck = 'TA_CONFIRM_' + id, pv = Number(props_().getProperty(ck) || 0), confirmed = !!pv && getNow_().getTime() - pv <= TUTOR_ABSENT_CONFIRM_MIN_ * 60000;
        out = adminMarkTutorAbsent_(id, actor, { confirm: confirmed });
        if (out.reason === 'NEED_CONFIRM') {
          props_().setProperty(ck, String(getNow_().getTime()));
          withLock_(function () {
            var f2 = table_('BOOKINGS').byId(id);
            table_('BOOKINGS').update(f2, { admin_action: '', admin_note: 'Chờ xác nhận: buổi đang ' + (BOOKING_STATUS_VI[out.status] || out.status) + ', ghi Vắng tutor thì tutor mất lương buổi này. Chọn lại "Vắng tutor" trong ' + TUTOR_ABSENT_CONFIRM_MIN_ + ' phút để xác nhận. · ' + fmtDateTime_(getNow_()) + ' · ' + actor });
          });
          return { ok: false, message: 'Buổi đã có kết quả (' + (BOOKING_STATUS_VI[out.status] || out.status) + '). Chọn lại "Vắng tutor" trong ' + TUTOR_ABSENT_CONFIRM_MIN_ + ' phút để xác nhận.' };
        }
        if (out.ok) props_().deleteProperty(ck);
      } else if (value === ADMIN_MARK_DONE_ACTION_) {
        out = adminMarkDone_(id, actor);
        if (out.block === 'OPEN') note = ' (buổi đang ' + (BOOKING_STATUS_VI[out.status] || out.status) + ': chưa có gì để giữ nguyên, chọn việc cần làm như Đổi tutor hoặc Huỷ bởi admin)';
        if (out.block === 'TECH') note = ' (buổi kỹ thuật chưa chọn lỗi: chọn 1 trong 3 lựa chọn lỗi kỹ thuật)';
      } else if (ADMIN_RESULT_ACTIONS_[value]) out = adminSetResult_(id, actor, ADMIN_RESULT_ACTIONS_[value]);
      else out = adminSetTechFault_(id, actor, TECH_FAULT_ACTIONS_[value]);
      withLock_(function () {
        var fresh = table_('BOOKINGS').byId(id), patch = { admin_action: '', admin_note: (out.ok ? 'Đã: ' : 'Lỗi: ') + value + note + (out.ok ? '' : ' (' + (REASON_TEXT_VI[out.reason] || out.reason) + ')') + ' · ' + fmtDateTime_(getNow_()) + ' · ' + actor };
        // Chunk 5N: chạy thành công thì ghi admin_done_at (tô màu "chưa xử lý" so mốc này với result_at). Thiếu cột (chưa chạy menu 1): bỏ qua.
        if (out.ok && 'admin_done_at' in table_('BOOKINGS').colIndex) patch.admin_done_at = getNow_();
        table_('BOOKINGS').update(fresh, patch);
      });
      return { ok: out.ok, message: (out.ok ? 'Đã xử lý: ' : 'Không xử lý được: ') + value + note };
    }
    return null;
  } catch (err) {
    mailAdminError_('Thao tác admin ' + sheetName + ' ' + id, (err && err.stack) || String(err));
    return { ok: false, message: 'Lỗi: ' + err.message };
  }
}

// ── Menu ──

/** Mã user của mọi dòng đang chọn ở tab USERS (chọn nhiều vùng bằng Ctrl hoặc Cmd, hoặc kéo nhiều dòng). */
function selectedUserIds_() {
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== 'USERS') throw new Error('Hãy chọn các dòng trong tab USERS.');
  var col = SCHEMA.USERS.cols.indexOf('user_id') + 1, ids = [];
  sh.getActiveRangeList().getRanges().forEach(function (rg) {
    for (var r = rg.getRow(); r < rg.getRow() + rg.getNumRows(); r++) {
      if (r < 2) continue;
      var id = String(sh.getRange(r, col).getValue() || '').trim();
      if (id && ids.indexOf(id) === -1) ids.push(id);
    }
  });
  if (!ids.length) throw new Error('Chưa chọn dòng nào có mã user.');
  return ids;
}

function selectedUserRow_() {
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== 'USERS') throw new Error('Hãy chọn một dòng trong tab USERS.');
  var row = sh.getActiveRange().getRow();
  if (row < 2) throw new Error('Hãy chọn dòng dữ liệu, không chọn dòng tiêu đề.');
  return String(sh.getRange(row, SCHEMA.USERS.cols.indexOf('user_id') + 1).getValue());
}
function alert_(msg) { try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); } }

function menuSuspend(e) { requireOperator_(e); var id = selectedUserRow_(); var r = suspendStudent_(id, adminActor_()); alert_(r.ok ? 'Đã tạm khoá ' + id : 'Không khoá được: ' + r.reason); }
function menuUnsuspend(e) { requireOperator_(e); var id = selectedUserRow_(); var r = unsuspendStudent_(id, adminActor_()); alert_(r.ok ? 'Đã mở khoá ' + id + ', hạn gói đã cộng bù.' : 'Không mở khoá được: ' + r.reason); }
function menuResendLogin(e) { requireOperator_(e);
  var ids = selectedUserIds_();
  var r = sendLoginLinks_(ids, adminActor_());
  alert_('Đã gửi link đăng nhập cho ' + r.sent.length + ' người' + (r.sent.length ? ': ' + r.sent.join(', ') : '') +
    (r.skipped.length ? '\nBỏ qua ' + r.skipped.length + ': ' + r.skipped.join(', ') : '') +
    '\nMỗi người là 1 email (tính vào hạn mức email mỗi ngày).');
}

/** Gửi link đăng nhập cho nhiều tài khoản một lần. Bỏ qua mã không có, tài khoản DISABLED, admin (admin dùng đăng nhập riêng). */
function sendLoginLinks_(ids, actor) {
  var sent = [], skipped = [];
  withLock_(function () {
    ids.forEach(function (id) {
      var u = userById_(id);
      if (!u || u.status === USER_STATUS.DISABLED || (u.role !== 'STUDENT' && u.role !== 'TUTOR')) { skipped.push(id); return; }
      mailLoginLink_(u, createLoginLinkInLock_(u));
      logActivity_(actor, 'LOGIN_LINK_RESENT', 'USER', id, '');
      sent.push(id);
    });
  });
  return { sent: sent, skipped: skipped };
}
function menuAddTutor(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('Tên tutor').getResponseText(), email = ui.prompt('Email tutor').getResponseText(), phone = ui.prompt('Số điện thoại tutor').getResponseText();
  var r = addTutor_({ name: name, email: email, phone: phone }, adminActor_());
  alert_(r.ok ? 'Đã thêm tutor ' + r.userId + '. Gửi link đăng nhập bằng menu "Gửi lại link đăng nhập".' : 'Không thêm được: ' + (REASON_TEXT_VI[r.reason] || r.reason));
}

/** Thêm tutor (tách riêng để test). */
function menuAddAdmin(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('Tên admin').getResponseText(), email = ui.prompt('Email admin (Gmail cá nhân hoặc email Workspace)').getResponseText();
  var r = addAdmin_({ name: name, email: email }, adminActor_());
  alert_(r.ok ? 'Đã thêm admin ' + r.userId + '. Tài khoản này có quyền admin nhưng không nhận email; email hệ thống chỉ gửi tới CONFIG ADMIN_EMAIL. Nhớ chia sẻ file Sheets này cho email đó với quyền Người chỉnh sửa. Admin dự phòng: đặt status DISABLED cho tới khi cần.' : 'Không thêm được: ' + (REASON_TEXT_VI[r.reason] || r.reason));
}
/** Thêm tài khoản admin (USERS role ADMIN): có quyền admin, KHÔNG nhận email (email chỉ tới CONFIG ADMIN_EMAIL). Admin dự phòng để DISABLED. */
function addAdmin_(o, actor) {
  if (!o || !String(o.name || '').trim() || !isEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    if (userByEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
    var u = table_('USERS').insert({ user_id: nextId_('USERS_ADMIN'), role: 'ADMIN', email: String(o.email).trim().toLowerCase(), name: String(o.name).trim(), status: USER_STATUS.ACTIVE, created_at: getNow_() });
    logActivity_(actor, 'ADMIN_ADDED', 'USER', u.user_id, u.email);
    return { ok: true, userId: u.user_id };
  });
}

function addTutor_(o, actor) {
  if (!o || !String(o.name || '').trim() || !isEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
  var ph = normalizePhone_(o.phone, false);
  if (!ph.ok) return { ok: false, reason: REASONS.INVALID_PHONE };
  return withLock_(function () {
    if (userByEmail_(o.email)) return { ok: false, reason: REASONS.INVALID_INPUT };
    var u = table_('USERS').insert({ user_id: nextId_('USERS_TUTOR'), role: 'TUTOR', email: String(o.email).trim().toLowerCase(), name: String(o.name).trim(),
      phone: ph.phone, contact_link: contactFormula_(ph.phone), status: USER_STATUS.ACTIVE, rate_vnd: Number(o.rate_vnd || 0), color_id: String((table_('USERS').filter(function (x) { return x.role === 'TUTOR'; }).length % 11) + 1), created_at: getNow_() });
    logActivity_(actor, 'TUTOR_ADDED', 'USER', u.user_id, u.email);
    return { ok: true, userId: u.user_id };
  });
}

function menuReportThisMonth(e) { requireOperator_(e); refreshReportMonth_(); logMenu_(e, 'REPORT_REFRESHED', 'REPORT_MONTH', dateKey_(getNow_()).substring(0, 7), ''); alert_('Đã làm mới tab REPORT_MONTH.'); }
function menuReportLastMonth(e) { requireOperator_(e); var n = getNow_(); var d = new Date(n.getFullYear(), n.getMonth() - 1, 1); refreshReportMonth_(d.getFullYear(), d.getMonth() + 1); logMenu_(e, 'REPORT_REFRESHED', 'REPORT_MONTH', d.getFullYear() + '-' + pad2_(d.getMonth() + 1), ''); alert_('Đã ghi báo cáo tháng ' + (d.getMonth() + 1) + ' vào tab REPORT_MONTH.'); }
/**
 * 5K (BL03 phương án a): 4 link rút gọn trên tên miền (URL Redirect ở Namecheap). Đổi hệ thống hay tài khoản chỉ cần đổi
 * đích ở Namecheap; học viên, tutor giữ link cũ. Menu hiện link rút gọn đang ghi trong CONFIG và đích cần đặt ở Namecheap.
 */
var SHORT_LINKS_ = [['SHORT_URL_HOME', 'Trang đăng ký', 'home'], ['SHORT_URL_LOGIN', 'Đăng nhập (học viên, tutor, admin)', 'login'],
  ['SHORT_URL_STUDENT', 'Cổng học viên', 'student'], ['SHORT_URL_TUTOR', 'Cổng tutor', 'tutor']];
function shortLinksInfo_() {
  var url = cfg_('WEBAPP_URL'); if (!url) { try { url = ScriptApp.getService().getUrl(); } catch (x) { } }
  return { webapp: url || '', links: SHORT_LINKS_.map(function (x) {
    return { key: x[0], label: x[1], short: String(cfg_(x[0]) || '').trim(), target: url ? url + (url.indexOf('?') === -1 ? '?' : '&') + 'page=' + x[2] : '' };
  }) };
}
function menuShowLinks(e) { requireOperator_(e);
  var info = shortLinksInfo_(), lines = ['Link web app (/exec): ' + (info.webapp || '(chưa triển khai, chưa ghi WEBAPP_URL)'), ''];
  info.links.forEach(function (l) {
    lines.push(l.label + ':', '  Link rút gọn: ' + (l.short || '(chưa có, ghi vào CONFIG ' + l.key + ')'), '  Đích đặt ở Namecheap (URL Redirect): ' + (l.target || '(chưa có link web app)'), '');
  });
  lines.push('Đổi hệ thống hoặc tài khoản: chỉ sửa đích ở Namecheap, link rút gọn giữ nguyên.');
  alert_(lines.join('\n'));
  return info;
}
/** 5L: menu "Thêm gói": hỏi lần lượt từng ô, kiểm hợp lệ, thêm một dòng PACKAGES. Bấm Huỷ ở bước nào cũng dừng. */
function menuAddPackage(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), ask = function (title, hint) { var r = ui.prompt(title, hint || '', ui.ButtonSet.OK_CANCEL); if (r.getSelectedButton() !== ui.Button.OK) throw new Error('CANCEL'); return String(r.getResponseText() || '').trim(); };
  var o = {};
  try {
    o.code = ask('Mã gói', 'Chữ in hoa, số, dấu _; ví dụ PASS_3M. Không đổi được sau khi đã bán.').toUpperCase();
    o.name = ask('Tên tiếng Việt', 'Ví dụ: Gói 3 tháng');
    o.name_en = ask('Tên tiếng Anh', 'Ví dụ: 3 month pass (để trống thì trang tiếng Anh hiện tên tiếng Việt)');
    o.type = ask('Kiểu gói', 'DAYS = theo ngày (không giới hạn buổi, tối đa 1 buổi mỗi ngày); SESSIONS = theo số buổi').toUpperCase() || 'DAYS';
    o.days = ask('Số ngày', o.type === 'SESSIONS' ? 'Gói theo buổi: để trống (không giới hạn ngày)' : 'Ví dụ 90');
    o.sessions = ask('Số buổi tối đa', o.type === 'SESSIONS' ? 'Ví dụ 12' : 'Để trống = không giới hạn (Trial thì ghi số buổi)');
    o.price_vnd = ask('Giá (VND)', 'Số, không dấu chấm. 0 = chỉ đăng ký qua Zalo, không chọn được trên web').replace(/[.,\s]/g, '');
    o.active = !/^(n|no|không|khong|false|0)$/i.test(ask('Đang bán?', 'Có hoặc Không (mặc định Có)'));
  } catch (x) { if (String(x.message) === 'CANCEL') { alert_('Đã huỷ, chưa thêm gói nào.'); return null; } throw x; }
  var r = addPackage_(o, adminActor_(e));
  alert_(r.ok ? 'Đã thêm gói ' + r.code + '. Chạy menu 2 để kiểm lại; trang đăng ký hiện gói đang bán sau tối đa vài phút (hoặc chạy menu Email > Cập nhật nội dung web và email).' : 'Chưa thêm được:\n' + r.errors.join('\n'));
  return r;
}

function menuDetachEvents(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Gỡ sự kiện Calendar của mọi buổi sắp tới?', 'Học viên và tutor sẽ nhận thư huỷ của Google Calendar (buổi học vẫn giữ). Chỉ làm khi chuyển sang tài khoản mới, ngay trước Bước B.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  var r = detachFutureEvents_(adminActor_()); alert_('Đã gỡ ' + r.removed + ' sự kiện. Sang hệ thống mới chạy Bước B.');
}
function menuRecreateEvents(e) { requireOperator_(e);
  var r = recreateFutureEvents_(adminActor_());
  alert_('Đã tạo ' + r.created + ' sự kiện mới.' + (r.failed.length ? '\nLỗi ' + r.failed.length + ':\n' + r.failed.slice(0, 10).join('\n') : ''));
}

function menuRefreshContent(e) { requireOperator_(e);
  var r = refreshContent_();
  logMenu_(e, 'CONTENT_REFRESHED', 'CONTENT', '', JSON.stringify({ warnings: r.warnings.length }));
  alert_('Đã cập nhật. Tải lại trang web để thấy chữ mới; email gửi từ bây giờ dùng mẫu mới.' + (r.warnings.length ? '\n\nCần xem lại:\n' + r.warnings.slice(0, 20).join('\n') : '\nKhông thấy lỗi.'));
}
/** Xoá bộ nhớ đệm và kiểm tra: key lạ hoặc mất {bien} trong CONTENT, biến không có trong danh sách của mẫu email, chiến dịch marketing lỗi. */
function refreshContent_() {
  clearDbCache_(); clearContentCache_();
  var warnings = [];
  var defs = contentDefaults_();
  var vars = function (x) { return (String(x || '').match(/\{\w+\}/g) || []).sort().join(' '); };
  var m = contentMap_();
  table_('CONTENT').all().forEach(function (r) {
    if (!r.key) return;
    var d = defs[r.key];
    if (!d) { warnings.push('CONTENT: key "' + r.key + '" không được trang web dùng'); return; }
    // Chunk 5H: chữ đã sửa làm mất hoặc thêm {bien} (ví dụ xoá {n}): trang sẽ hiện thiếu số hoặc hiện nguyên {bien}.
    LANGS_.forEach(function (l, i) {
      var cur = m[r.key] ? m[r.key][i] : '';
      if (cur !== '' && cur !== d[l] && vars(cur) !== vars(d[l])) warnings.push('CONTENT ' + r.key + ' (' + l + '): chữ gốc có ' + (vars(d[l]) || 'không có biến') + ', bản đã sửa có ' + (vars(cur) || 'không có biến'));
    });
  });
  // Danh sách cách nhau dấu |: phải đủ số mục, hai thứ tiếng cùng số mục.
  [['a.dow', 7], ['a.dow_short', 7], ['t.legend', 5], ['h.levels', 0]].forEach(function (x) {
    var n = m[x[0]].map(function (s) { return String(s).split('|').length; });
    if ((x[1] && (n[0] !== x[1] || n[1] !== x[1])) || n[0] !== n[1]) warnings.push('CONTENT ' + x[0] + ': cần ' + (x[1] ? 'đúng ' + x[1] + ' mục' : 'cùng số mục ở vi và en') + ' cách nhau dấu | (đang có vi ' + n[0] + ', en ' + n[1] + ')');
  });
  // Email marketing đang chờ gửi: báo lỗi chữ trước khi admin bấm gửi.
  try {
    table_('MARKETING_EMAILS').all().forEach(function (r) {
      var st = String(r.status || '').trim().toUpperCase();
      if (st !== 'READY' && st !== 'SENDING') return;
      marketingCheck_(r, false).errors.forEach(function (x) { warnings.push('MARKETING_EMAILS ' + r.campaign_id + ': ' + x); });
    });
  } catch (e) { }
  table_('EMAIL_TEMPLATES').all().forEach(function (r) {
    var t = emailTemplate_(r.key);
    if (!t) return;
    var allowed = String(t.variables || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; });
    ['subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en'].forEach(function (c) {
      String(t[c] || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (m, k) {
        var name = /^button:/.test(k) ? k.substring(7).split('|')[0].trim() : k;
        if (allowed.length && allowed.indexOf(name) === -1) warnings.push('EMAIL_TEMPLATES ' + r.key + ' (' + c + '): biến {{' + name + '}} không có trong cột variables, sẽ để trống');
        return m;
      });
    });
    // Mẫu đã sửa làm mất nút hoặc biến có trong mẫu gốc (ví dụ bỏ mất nút đăng nhập): nhắc admin.
    var d = DEFAULT_EMAIL_TEMPLATES_[r.key];
    if (d) [['body_vi', 3], ['body_en', 6]].forEach(function (x) {
      if (String(t[x[0]]) === String(d[x[1]])) return;
      (String(d[x[1]]).match(/\{\{\s*button:[^|}]+/g) || []).forEach(function (b) {
        var name = b.replace(/^\{\{\s*button:/, '').trim();
        if (String(t[x[0]]).indexOf(name) === -1 && t[x[0]] !== '') warnings.push('EMAIL_TEMPLATES ' + r.key + ' (' + x[0] + '): mẫu gốc có nút {{button:' + name + '|...}} nhưng bản đã sửa không còn, người nhận sẽ không có nút này');
      });
    });
  });
  return { warnings: warnings };
}
function menuPreviewEmail(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), keys = table_('EMAIL_TEMPLATES').all().map(function (r) { return r.key; });
  var res = ui.prompt('Gửi thử mẫu email', 'Nhập key của mẫu (ví dụ WELCOME). Có: ' + keys.join(', '), ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var to = ''; try { to = Session.getActiveUser().getEmail(); } catch (x) { }
  var r = previewEmail_(res.getResponseText().trim().toUpperCase(), to || adminEmails_()[0]);
  logMenu_(e, 'MAIL_PREVIEW', 'EMAIL_TEMPLATES', r.key || res.getResponseText().trim().toUpperCase(), JSON.stringify(r.ok ? { to: r.to } : { error: r.error }));
  alert_(r.ok ? 'Đã gửi mẫu ' + r.key + ' tới ' + r.to + ' với dữ liệu minh hoạ.' : 'Không gửi được: ' + r.error);
}
/** Gửi một mẫu với dữ liệu minh hoạ (dùng để admin kiểm tra chữ vừa sửa). */
function previewEmail_(key, to) {
  clearContentCache_(); clearDbCache_();
  if (!emailTemplate_(key)) return { ok: false, error: 'không có mẫu ' + key };
  var t = emailTemplate_(key);
  if (!t.active) return { ok: false, error: 'mẫu ' + key + ' đang tắt (active FALSE)' };
  var ok = sendTpl_(key, to, sampleTplVars_(key), { kind: 'PREVIEW_' + key, enFirst: t.audience === 'TUTOR' });
  return ok ? { ok: true, key: key, to: to } : { ok: false, error: 'gửi email không thành công' };
}

function menuSimNow(e) { requireOperator_(e);
  var s = SpreadsheetApp.getUi().prompt('Giờ giả lập (YYYY-MM-DD HH:mm)').getResponseText();
  setSimNow_(s); logMenu_(e, 'SIM_NOW', 'SYSTEM', '', fmtDateTime_(getNow_())); alert_('Đã bật giả lập: ' + fmtDateTime_(getNow_()) + '. Nhớ tắt sau khi test.');
}
function menuClearSimNow(e) { requireOperator_(e); clearSimNow_(); logMenu_(e, 'SIM_NOW', 'SYSTEM', '', 'OFF'); alert_('Đã tắt giả lập thời gian.'); }
function menuSetup(e) { requireOperator_(e); var r = setupFirstRun(e); alert_(r.lines.join('\n')); }
function menuTestSystem(e) { requireOperator_(e); var r = testSystem(); alert_((r.errors.length ? 'CÓ ' + r.errors.length + ' LỖI\n' : 'KHÔNG CÓ LỖI\n') + r.lines.join('\n')); }
function menuCreateTriggers(e) { requireOwner_(e); var n = createTriggers_(); logMenu_(e, 'TRIGGERS_CREATED', 'SYSTEM', '', String(n)); alert_('Đã tạo ' + n + ' trigger.'); }

/** Tạo khoá bí mật cho đăng nhập Google (chunk 5D). Chỉ chủ file. Hiện một lần để dán vào dự án phụ. */
function menuGoogleLoginSecret(e) { requireOwner_(e);
  var ui = SpreadsheetApp.getUi(), had = !!props_().getProperty('GOOGLE_LOGIN_SECRET');
  if (had && ui.alert('Đã có khoá', 'Tạo khoá mới sẽ làm khoá cũ hết hiệu lực; phải dán lại vào dự án phụ. Tiếp tục?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var secret = createGoogleLoginSecret_();
  ui.alert('Khoá bí mật đăng nhập Google', 'Dán 2 dòng sau vào Script Properties của dự án phụ "thaiput Google login":\n\nGOOGLE_LOGIN_SECRET = ' + secret +
    '\nMAIN_URL = ' + (cfg_('WEBAPP_URL') || '(điền link web app chính)') + '\n\nKhông gửi khoá này qua email hay Zalo.', ui.ButtonSet.OK);
}
function createGoogleLoginSecret_() {
  var secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  props_().setProperty('GOOGLE_LOGIN_SECRET', secret);
  logActivity_(adminActor_(), 'GOOGLE_LOGIN_SECRET_CREATED', 'CONFIG', '', '');
  return secret;
}

// ── AdminApi.gs ──
/**
 * AdminApi.gs · Giao diện admin trên web (chunk 5E; song ngữ, nhật ký, ô số liệu bấm được từ chunk 5I)
 *
 * Mọi hàm bắt đầu bằng requireRole_(token, 'ADMIN') (CLAUDE.md luật 6).
 * Chunk 5I: chữ của trang admin nằm trong tab CONTENT (key ad.*, cả tiếng Việt và tiếng Anh), gửi kèm apiAdminHome, không gửi
 * cho trang của học viên, tutor. Máy chủ gửi mã (trạng thái buổi, mã sự kiện, mã hành động) và cặp câu { vi, en }; trình duyệt
 * dựng nhãn theo ngôn ngữ admin chọn bằng nút VI | EN.
 *
 *   apiAdminHome           số việc cần xử lý + thông báo chưa đọc mới nhất + chữ của trang admin
 *   apiAdminNotifications  lọc thông báo (chưa đọc, mức, theo tutor hoặc học viên)
 *   apiAdminMarkRead       đánh dấu đã đọc (tick cột read của NOTIFICATIONS)
 *   apiAdminLessons        danh sách buổi hôm nay hoặc buổi chờ tutor xác nhận (ô số liệu trên đầu trang)
 *   apiAdminPeople         danh sách tutor và học viên kèm số liệu nhanh
 *   apiAdminPerson         chi tiết một tutor hoặc học viên
 *   apiAdminBooking        chi tiết một buổi học
 *   apiAdminSlots          slot còn trống để đặt thay (bỏ qua hạn đặt), kèm tutor rảnh
 *   apiAdminBook           đặt thay học viên
 *   apiAdminCancel         huỷ buổi (không giới hạn hạn huỷ)
 *   apiAdminLog            nhật ký ACTIVITY_LOG (dòng xem trước, LOG_KEEP_DAYS ngày gần nhất)
 *   apiAdminLogEntry       một dòng nhật ký đầy đủ
 */

var ADMIN_LIST_LIMIT_ = 150;

/** Câu báo lỗi cho admin, cả hai thứ tiếng (key ad.r.MÃ trong CONTENT; không có thì dùng câu của học viên). */
function adminReasonPair_(code, vars) {
  var m = contentMap_();
  if (m['ad.r.' + code]) return { vi: contentText_('ad.r.' + code, vars, 'vi'), en: contentText_('ad.r.' + code, vars, 'en') };
  return reasonPair_(code, vars);
}
function adminReasonText_(code) { return adminReasonPair_(code).vi; }
/** Kết quả lỗi kèm câu hai thứ tiếng (trình duyệt chọn theo ngôn ngữ đang dùng). */
function adminFail_(reason, key, vars) {
  var p = { vi: contentText_(key, vars, 'vi'), en: contentText_(key, vars, 'en') };
  return { ok: false, reason: reason, message: p.vi, msg: p };
}
/** Chữ của trang admin (key ad.*) cho trình duyệt: key → [vi, en]. */
function adminContent_() {
  var m = contentMap_(), out = {};
  Object.keys(m).forEach(function (k) { if (k.indexOf('ad.') === 0) out[k] = m[k]; });
  return out;
}

function adminNotifView_(n) {
  return { id: n.notif_id, time: n.time instanceof Date ? fmtDateTime_(n.time) : String(n.time || ''), level: n.level, event: n.event, channel: n.channel,
    actor: n.actor, studentId: n.student_id, tutorId: n.tutor_id, entity: n.entity, entityId: String(n.entity_id || ''), message: n.message,
    messageEn: String(n.message_en || ''), link: n.link, read: n.read === true || String(n.read).toUpperCase() === 'TRUE' };
}
function isRead_(n) { return n.read === true || String(n.read).toUpperCase() === 'TRUE'; }

/** Thông báo mới nhất trước. q: { unread, level, personId, limit }. personId khớp cột student_id hoặc tutor_id (có thể nhiều mã cách dấu phẩy). */
function adminNotifications_(q) {
  q = q || {};
  var limit = Math.min(Number(q.limit) || 50, ADMIN_LIST_LIMIT_), pid = String(q.personId || '');
  var rows = table_('NOTIFICATIONS').filter(function (n) {
    if (q.unread && isRead_(n)) return false;
    if (q.level && n.level !== q.level) return false;
    if (pid && String(n.student_id).split(',').indexOf(pid) === -1 && String(n.tutor_id).split(',').indexOf(pid) === -1) return false;
    return true;
  });
  rows.sort(function (a, b) { return new Date(b.time) - new Date(a.time) || (a.notif_id < b.notif_id ? 1 : -1); });
  return { total: rows.length, items: rows.slice(0, limit).map(adminNotifView_) };
}

/** Buổi "hôm nay" và "chờ tutor xác nhận": cùng luật cho ô số liệu và danh sách (không lệch nhau). */
function adminLessonsToday_(bks, now) { var today = toMidnight_(now); return bks.filter(function (b) { return sameDate_(b.date, today) && (b.status === BOOKING_STATUS.CONFIRMED || isConsuming_(b.status)); }); }
/** Buổi chờ kết quả: đã bắt đầu mà chưa có kết quả, cộng buổi Không hoàn thành trong 60 ngày gần nhất (soát 5J: để admin thấy và sửa trên web). */
var ADMIN_NOT_COMPLETED_DAYS_ = 60;
function adminLessonsWaiting_(bks, now) {
  var from = addDays_(toMidnight_(now), -ADMIN_NOT_COMPLETED_DAYS_);
  return bks.filter(function (b) {
    if (!(b.date instanceof Date)) return false;
    if (b.status === BOOKING_STATUS.CONFIRMED) return slotStart_(b.date, b.slot) <= now;
    return b.status === BOOKING_STATUS.NOT_COMPLETED && b.date >= from;
  });
}

/** Bộ lọc thông báo ban đầu của trang admin: chưa đọc, mọi mức (apiAdminHome gửi sẵn để trang không phải gọi lần hai). */
var ADMIN_FEED_FIRST_ = { unread: true, level: '', limit: 100 };

function apiAdminHome(token) {
  return apiWrap_('apiAdminHome', function () {
    var u = requireRole_(token, 'ADMIN'), now = getNow_();
    var notif = table_('NOTIFICATIONS').all(), unread = { CRITICAL: 0, WARNING: 0, INFO: 0 };
    notif.forEach(function (n) { if (!isRead_(n) && unread[n.level] !== undefined) unread[n.level]++; });
    var bks = table_('BOOKINGS').all(), today = toMidnight_(now);
    var counts = {
      // Chưa xử lý xong (kể cả dòng đã chọn "Duyệt" nhưng xử lý lỗi, chưa có processed_at): đúng những dòng cần admin nhìn.
      pendingRegistrations: table_('REGISTRATIONS').filter(function (r) { return !r.processed_at; }).length,
      pendingTutorCancels: table_('AVAILABILITY').filter(function (a) { return a.status === AVAIL_STATUS.CANCEL_PENDING; }).length,
      lessonsToday: adminLessonsToday_(bks, now).length,
      waitingResult: adminLessonsWaiting_(bks, now).length,
      techIssues: bks.filter(function (b) { return b.status === BOOKING_STATUS.TECH_ISSUE && b.date >= addDays_(today, -30); }).length
    };
    return { ok: true, data: { me: { name: u.name, email: u.email, lang: userLang_(u) }, now: fmtDateTime_(now), today: dateKey_(now), unread: unread, counts: counts,
      sheetUrl: rowLink_('NOTIFICATIONS'), links: { registrations: rowLink_('REGISTRATIONS'), availability: rowLink_('AVAILABILITY'), bookings: rowLink_('BOOKINGS') },
      feed: adminNotifications_(ADMIN_FEED_FIRST_), feedQuery: ADMIN_FEED_FIRST_, content: adminContent_(), logDays: activityKeepDays_() } };
  });
}

function apiAdminNotifications(token, q) {
  return apiWrap_('apiAdminNotifications', function () {
    requireRole_(token, 'ADMIN');
    return { ok: true, data: adminNotifications_(q || {}) };
  });
}

/** ids: mảng mã thông báo, hoặc 'ALL' (mọi thông báo chưa đọc). */
function apiAdminMarkRead(token, ids) {
  return apiWrap_('apiAdminMarkRead', function () {
    var u = requireRole_(token, 'ADMIN');
    return withLock_(function () {
      var t = table_('NOTIFICATIONS'), n = 0, all = ids === 'ALL', set = {};
      if (!all) (Array.isArray(ids) ? ids : []).slice(0, 500).forEach(function (x) { set[String(x)] = true; });
      var targets = t.all().filter(function (r) { return !isRead_(r) && (all || set[r.notif_id]); });
      n = targets.length;
      if (n > 20) setColumnForRows_(t, 'read', targets, true);   // nhiều dòng: ghi một lần cả cột, không giữ khoá lâu
      else targets.forEach(function (r) { t.update(r, { read: true }); });
      // 5K (BL02): mở một thông báo là xem, không ghi nhật ký; chỉ ghi khi bấm "Đã đọc hết" (thao tác của admin).
      if (all) logActivity_(u.email, 'NOTIF_READ', 'NOTIFICATIONS', 'ALL', String(n));
      return { ok: true, data: { count: n } };
    });
  });
}

/** Danh sách buổi cho ô số liệu: kind 'today' (hôm nay, theo giờ) hoặc 'waiting' (đã diễn ra, tutor chưa xác nhận, mới nhất trước). */
function apiAdminLessons(token, kind) {
  return apiWrap_('apiAdminLessons', function () {
    requireRole_(token, 'ADMIN');
    var now = getNow_(), bks = table_('BOOKINGS').all(), byId = usersById_(), k = kind === 'waiting' ? 'waiting' : 'today';
    var list = k === 'today' ? adminLessonsToday_(bks, now).sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); })
      : adminLessonsWaiting_(bks, now).sort(function (a, b) { return slotStart_(b.date, b.slot) - slotStart_(a.date, a.slot); });
    return { ok: true, data: { kind: k, total: list.length, items: list.slice(0, ADMIN_LIST_LIMIT_).map(function (b) { return adminBookingView_(b, byId); }), sheetLink: rowLink_('BOOKINGS'), hours: Number(cfg_('RESULT_NOTICE_AFTER_HOURS')) || 0, expireHours: Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) || 0 } };
  });
}

/** Danh sách tutor và học viên kèm số liệu nhanh cho tuần hiện tại. */
function apiAdminPeople(token) {
  return apiWrap_('apiAdminPeople', function () {
    requireRole_(token, 'ADMIN');
    var now = getNow_(), mon = mondayOf_(now), sun = addDays_(mon, 6), nextMon = addDays_(mon, 7), nextSun = addDays_(mon, 13);
    var bks = table_('BOOKINGS').all(), avail = table_('AVAILABILITY').all(), defs = pkgDefs_(), sps = table_('STUDENT_PACKAGES').all();
    var unreadBy = {};
    table_('NOTIFICATIONS').all().forEach(function (n) {
      if (isRead_(n)) return;
      String(n.student_id).split(',').concat(String(n.tutor_id).split(',')).forEach(function (id) { if (id) unreadBy[id] = (unreadBy[id] || 0) + 1; });
    });
    var tutors = [], students = [];
    table_('USERS').all().forEach(function (u) {
      if (u.role === 'TUTOR') {
        var mine = bks.filter(function (b) { return b.tutor_id === u.user_id; });
        tutors.push({ id: u.user_id, name: u.name, email: u.email, status: u.status,
          weekLessons: mine.filter(function (b) { return b.date >= mon && b.date <= sun && isConsuming_(b.status); }).length,
          toConfirm: mine.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) <= now; }).length,
          openNextWeek: avail.filter(function (a) { return a.tutor_id === u.user_id && a.status === AVAIL_STATUS.OPEN && a.date >= nextMon && a.date <= nextSun; }).length,
          unread: unreadBy[u.user_id] || 0 });
      } else if (u.role === 'STUDENT') {
        var bk = bks.filter(function (b) { return b.student_id === u.user_id; });
        var pk = sps.filter(function (sp) { return sp.student_id === u.user_id; })
          .sort(function (a, b) { var o = { ACTIVE: 0, INACTIVE: 1, QUEUED: 2, EXPIRED: 3 }, ka = a.status in o ? o[a.status] : 9, kb = b.status in o ? o[b.status] : 9; return ka - kb; /* ACTIVE = 0: không dùng ||, vì 0 bị coi là sai */ })[0];
        var sum = pk ? pkgSummary_(pk, defs[pk.package_code] || { code: pk.package_code, type: 'DAYS' }, bk) : null;
        students.push({ id: u.user_id, name: u.name, email: u.email, status: u.status,
          pkg: sum ? { name: sum.name, nameEn: sum.nameEn, status: sum.status, end: sum.end, left: sum.sessionsLeft } : null,
          upcoming: bk.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) > now; }).length,
          weekBooked: bk.filter(function (b) { return b.date >= mon && b.date <= sun && isConsuming_(b.status); }).length,
          unread: unreadBy[u.user_id] || 0 });
      }
    });
    return { ok: true, data: { tutors: tutors, students: students } };
  });
}

/** Một buổi cho trang admin: mã trạng thái (nhãn dựng ở trình duyệt theo ngôn ngữ), ngày dạng yyyy-mm-dd. */
function adminBookingView_(b, usersById) {
  var s = usersById[b.student_id] || {}, t = usersById[b.tutor_id] || {}, now = getNow_();
  // Chunk 5J: quá hạn chọn kết quả thì trang quản trị tô đỏ (overdue) và ghi giờ sẽ thành Không hoàn thành.
  var dli = b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) <= now ? resultDeadlineInfo_(b, now) : null;
  return { id: b.booking_id, date: dateKey_(b.date), slot: b.slot, status: b.status, awaiting: bookingAwaiting_(b, now),
    overdue: !!(dli && dli.overdue), expireAt: dli ? fmtDateTime_(dli.expireAt) : '',
    student: { id: b.student_id, name: s.name || b.student_id }, tutor: { id: b.tutor_id, name: t.name || b.tutor_id },
    meetLink: b.meet_link || '', past: slotStart_(b.date, b.slot) <= now,
    // Buổi đã bắt đầu không huỷ trên web (huỷ sẽ gửi thư huỷ và mất lương tutor); xử lý ở cột admin_action của BOOKINGS.
    canCancel: (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) && slotStart_(b.date, b.slot) > now, resultBy: b.result_by || '', cancelReason: b.cancel_reason || '',
    cancelReasonKey: CANCEL_REASON_KEYS_[String(b.cancel_reason || '').trim()] || '' };
}
/** Lý do huỷ do hệ thống tự ghi (tiếng Việt cố định trong BOOKINGS): trang quản trị hiện theo ngôn ngữ (key ad.reason.*), soát 5I B4. */
var CANCEL_REASON_KEYS_ = { 'Học viên huỷ': 'STUDENT', 'Tutor huỷ, admin chọn không dạy thay': 'TUTOR_NO_SUB', 'Tutor huỷ, không có tutor thay': 'TUTOR_NO_COVER', 'Tutor nghỉ, không có tutor thay': 'TUTOR_LOCKED', 'Admin huỷ': 'ADMIN' };
function usersById_() { var m = {}; table_('USERS').all().forEach(function (u) { m[u.user_id] = u; }); return m; }

function apiAdminPerson(token, id) {
  return apiWrap_('apiAdminPerson', function () {
    requireRole_(token, 'ADMIN');
    var u = userById_(String(id || ''));
    if (!u || (u.role !== 'TUTOR' && u.role !== 'STUDENT')) return { ok: false, reason: REASONS.NOT_FOUND };
    var now = getNow_(), byId = usersById_(), key = u.role === 'TUTOR' ? 'tutor_id' : 'student_id';
    var bks = table_('BOOKINGS').filter(function (b) { return b[key] === u.user_id; })
      .sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); });
    var upcoming = bks.filter(function (b) { return (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) && slotStart_(b.date, b.slot) > now; });
    var past = bks.filter(function (b) { return upcoming.indexOf(b) === -1; }).reverse().slice(0, 30);
    var out = { id: u.user_id, role: u.role, name: u.name, email: u.email, phone: phoneDisplay_(u.phone), status: u.status, level: u.level || '', note: u.note || '', lang: userLang_(u),
      sheetLink: rowLink_('USERS', u._row), upcoming: upcoming.map(function (b) { return adminBookingView_(b, byId); }),
      history: past.map(function (b) { return adminBookingView_(b, byId); }), notifications: adminNotifications_({ personId: u.user_id, limit: 30 }).items,
      sessions: listSessions_(u.user_id, '') };
    if (u.role === 'TUTOR') out.stats = tutorMonthStats_(u.user_id).months;
    else {
      var defs = pkgDefs_(), all = studentBookings_(u.user_id);
      out.packages = studentPackages_(u.user_id).map(function (sp) { return pkgSummary_(sp, defs[sp.package_code] || { code: sp.package_code, type: 'DAYS' }, all); });
    }
    return { ok: true, data: out };
  });
}

function apiAdminBooking(token, bookingId) {
  return apiWrap_('apiAdminBooking', function () {
    requireRole_(token, 'ADMIN');
    var b = table_('BOOKINGS').byId(String(bookingId || ''));
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    var v = adminBookingView_(b, usersById_());
    v.sheetLink = rowLink_('BOOKINGS', b._row);
    v.log = table_('ACTIVITY_LOG').filter(function (l) { return String(l.entity_id).split(',').indexOf(b.booking_id) !== -1; })
      .slice(-20).reverse().map(function (l) { return adminLogView_(l, false); });
    return { ok: true, data: v };
  });
}

/**
 * Slot admin đặt thay được cho học viên: từ bây giờ tới BOOKING_HORIZON_DAYS, slot chưa bắt đầu, có tutor mở và rảnh.
 * Bỏ qua hạn đặt; ngày học viên đã có buổi thì đánh dấu (vẫn bị chặn khi đặt vì 1 buổi/ngày).
 */
function adminSlotsFor_(studentId, fromKey, days) {
  var now = getNow_(), start = parseDateKey_(fromKey) || toMidnight_(now), n = Math.min(Number(days) || 14, 28);
  var horizon = addDays_(toMidnight_(now), cfg_('BOOKING_HORIZON_DAYS')), end = addDays_(start, n);
  // Chỉ giữ dòng trong khoảng ngày cần xem (12 tháng dữ liệu: quét cả bảng cho từng slot mất nhiều giây).
  var win = slotWindowData_(start, end);
  var tutors = activeTutors_(), avail = win.avail, bks = win.bookings, byId = usersById_(), out = [];
  for (var i = 0; i < n; i++) {
    var d = addDays_(start, i);
    if (d > horizon) break;
    var mine = win.bookings.some(function (b) { return b.student_id === studentId && bookingDeducts_(b) && sameDate_(b.date, d); });
    var slots = [];
    slotList_().forEach(function (slot) {
      if (!(now < slotStart_(d, slot))) return;
      var cands = buildTutorCandidates_(d, slot, tutors, avail, bks, []);
      if (cands.length) slots.push({ slot: slot, tutors: cands.map(function (c) { return { id: c.tutor_id, name: (byId[c.tutor_id] || {}).name || c.tutor_id, load: c.load }; }), auto: pickTutor_(cands) });
    });
    if (slots.length) out.push({ date: dateKey_(d), alreadyBooked: mine, slots: slots });
  }
  return out;
}

function apiAdminSlots(token, studentId, fromKey, days) {
  return apiWrap_('apiAdminSlots', function () {
    requireRole_(token, 'ADMIN');
    var s = userById_(String(studentId || ''));
    if (!s || s.role !== 'STUDENT') return { ok: false, reason: REASONS.NOT_FOUND };
    // Học viên không có gói còn dùng được hoặc đang khoá: báo ngay, không để admin chọn slot rồi mới bị từ chối.
    var defs = pkgDefs_(), usable = studentPackages_(s.user_id).some(function (sp) { return sp.status !== PKG_STATUS.EXPIRED && defs[sp.package_code]; });
    var blocker = studentAccountReason_(s) || (usable ? '' : REASONS.NO_PACKAGE);
    return { ok: true, data: adminSlotsFor_(s.user_id, fromKey, days), blocker: blocker || '', blockerMsg: blocker ? adminReasonPair_(blocker) : null };
  });
}

/** Đặt thay học viên. requests: [{ date, slot, tutorId? }]. Email xác nhận gửi học viên và tutor như khi học viên tự đặt. */
function apiAdminBook(token, studentId, requests, rid) {
  return apiWrap_('apiAdminBook', function () {
    var u = requireRole_(token, 'ADMIN');
    var s = userById_(String(studentId || ''));
    if (!s || s.role !== 'STUDENT') return { ok: false, reason: REASONS.NOT_FOUND };
    return idem_(u.user_id + '|adminbook', rid, function () {
      var res = bookSessionsFor_(s.user_id, Array.isArray(requests) ? requests : [], u.email, { override: true, requestId: rid });
      res.forEach(function (r) { if (!r.ok) { r.msg = adminReasonPair_(r.reason); r.message = r.msg.vi; } });
      return { ok: true, data: res };
    });
  });
}

function apiAdminCancel(token, bookingId, reason, rid) {
  return apiWrap_('apiAdminCancel', function () {
    var u = requireRole_(token, 'ADMIN');
    return idem_(u.user_id + '|admincancel', rid, function () { return adminCancelRun_(u, bookingId, reason); });
  });
}
function adminCancelRun_(u, bookingId, reason) {
    // Chunk 5M: mốc 15:00 hôm trước xét theo lúc admin bấm (trước khi chờ khoá), giống dropdown trong Sheets.
    var at = getNow_();
    // Vòng 2 N1: chữ mặc định trong ô lý do (tiếng Việt hoặc tiếng Anh, kể cả bản admin sửa trong CONTENT) là "không ghi lý do":
    // lưu mã cố định 'Admin huỷ' để trang hiện theo ngôn ngữ (ad.reason.ADMIN), thông báo tiếng Anh dùng câu tiếng Anh.
    var raw = String(reason || '').trim().substring(0, 200), low = raw.toLowerCase();
    var defs = ['Admin huỷ', 'Cancelled by admin', contentText_('ad.cancel_reason_default', null, 'vi'), contentText_('ad.cancel_reason_default', null, 'en')].map(function (x) { return String(x || '').trim().toLowerCase(); });
    var isDefault = !raw || defs.indexOf(low) !== -1, why = isDefault ? 'Admin huỷ' : raw;
    var cur = table_('BOOKINGS').byId(String(bookingId || ''));
    if (cur && /^CANCELLED/.test(cur.status)) {
      var f = adminFail_(REASONS.INVALID_INPUT, 'ad.cancel_already', { id: cur.booking_id, status: contentText_('ad.st.' + cur.status, null, 'vi') });
      f.msg.en = contentText_('ad.cancel_already', { id: cur.booking_id, status: contentText_('ad.st.' + cur.status, null, 'en') }, 'en');
      return f;
    }
    if (cur && !(slotStart_(cur.date, cur.slot) > getNow_())) return adminFail_(REASONS.INVALID_INPUT, 'ad.cancel_started');
    var r = adminCancelBooking_(String(bookingId || ''), u.email, why, at);
    if (r.ok) {
      // Huỷ đã xong: lỗi khi ghi thông báo (hệ thống bận) không được làm trang báo "chưa huỷ".
      try {
        var b = table_('BOOKINGS').byId(String(bookingId));
        notify_('ADMIN_CANCELLED', { actor: u.email, student_id: b ? b.student_id : '', tutor_id: b ? b.tutor_id : '', entity: 'BOOKING', entity_id: String(bookingId),
          link: b ? rowLink_('BOOKINGS', b._row) : '', message: u.name + ' huỷ buổi ' + bookingId + (b ? ' (' + fmtDayVi_(b.date) + ' ' + b.slot + ')' : '') + ': ' + why,
          message_en: u.name + ' cancelled lesson ' + bookingId + (b ? ' (' + fmtDayEn_(b.date) + ' ' + b.slot + ')' : '') + ': ' + (isDefault ? contentText_('ad.cancel_reason_default', null, 'en') : why) });
      } catch (e) { Logger.log('ADMIN_CANCELLED notify lỗi: ' + e.message); }
    }
    return r;
}

/** Thoát mọi thiết bị của một tutor hoặc học viên (mất điện thoại, nghỉ việc). Không dùng cho tài khoản admin. */
function apiAdminLogoutUser(token, id) {
  return apiWrap_('apiAdminLogoutUser', function () {
    var a = requireRole_(token, 'ADMIN'), u = userById_(String(id || ''));
    if (!u || (u.role !== 'TUTOR' && u.role !== 'STUDENT')) return { ok: false, reason: REASONS.NOT_FOUND };
    var r = logoutAll_(u, a.email);
    return { ok: true, data: { count: r.count } };
  });
}

// ── Nhật ký (chunk 5I): dòng xem trước, bấm mở đọc đủ ──

var LOG_PREVIEW_CHARS_ = 160;
function logTime_(l) { var t = l.time instanceof Date ? l.time : new Date(l.time); return isNaN(t.getTime()) ? null : t; }
/** Một dòng nhật ký cho trang admin. full: gửi đủ chi tiết (mở đọc), không thì cắt còn LOG_PREVIEW_CHARS_. */
function adminLogView_(l, full) {
  var t = logTime_(l), d = String(l.detail || '');
  return { row: l._row, ts: t ? t.getTime() : 0, time: t ? fmtDateTime_(t) : String(l.time || ''), actor: String(l.actor || ''), action: String(l.action || ''),
    entity: String(l.entity || ''), entityId: String(l.entity_id || ''), detail: full ? d.substring(0, 20000) : d.substring(0, LOG_PREVIEW_CHARS_), more: !full && d.length > LOG_PREVIEW_CHARS_,
    h: logHash_(l) };
}
/** Mã băm ngắn của chữ ký (trình duyệt gửi lại khi mở một dòng, để không mở nhầm dòng cùng giờ, cùng hành động). */
function logHash_(l) { var s = logSig_(l), h = 5381; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
/** Ai làm: hệ thống (SYSTEM, job, trống) hay người (có email; ADMIN là admin sửa trong Sheets khi Google không cho biết email). */
/** Chữ ký nội dung của một dòng nhật ký (phân biệt các dòng cùng một giây khi phân trang). */
function logSig_(l) { return [l.action, l.actor, l.entity, l.entity_id, String(l.detail || '')].join('|'); }
function logIsSystem_(l) { var a = String(l.actor || '').trim(); return !a || a === 'SYSTEM'; }

/**
 * Nhật ký mới nhất trước, chỉ LOG_KEEP_DAYS ngày gần nhất. Thứ tự cố định theo nội dung: thời gian giảm dần, cùng
 * thời gian thì theo chữ ký nội dung, dòng giống hệt nhau thì theo hàng.
 * q: { text, acts (mã hành động có nhãn khớp chữ tìm, trình duyệt gửi), sys (chữ tìm khớp nhãn "Hệ thống"), who ('people' | 'system' | ''),
 *      cursor (con trỏ "Xem thêm" lấy từ lần trước: { ts, sig, n }), limit }.
 * Soát 5I A9, vòng 2 N2: con trỏ là vị trí trong thứ tự trên (mốc giờ, chữ ký, số bản giống hệt đã thấy), không theo số hàng và
 * không giới hạn số dòng cùng một mốc giờ (STAGING giả lập giờ: mọi dòng cùng mốc), nên dời hàng, sắp xếp tab, lưu trữ giữa hai
 * lần bấm không làm trùng, sót hay lặp.
 */
function adminLogQuery_(q) {
  q = q || {};
  var text = String(q.text || '').trim().toLowerCase(), limit = Math.min(Number(q.limit) || 100, 300);
  var acts = {}; (Array.isArray(q.acts) ? q.acts : []).slice(0, 200).forEach(function (a) { acts[String(a)] = true; });
  var cur = q.cursor && typeof q.cursor === 'object' ? { ts: Number(q.cursor.ts) || 0, sig: String(q.cursor.sig || ''), n: Math.max(0, Number(q.cursor.n) || 0) } : null;
  var who = q.who === 'people' || q.who === 'system' ? q.who : '', since = addDays_(toMidnight_(getNow_()), -activityKeepDays_()).getTime();
  var list = [];
  table_('ACTIVITY_LOG').all().forEach(function (l) {
    var t = logTime_(l), ts = t ? t.getTime() : 0;
    if (t && ts < since) return;   // cũ hơn khoảng giữ: đang chờ job đêm chuyển sang file lưu trữ
    if (who && (who === 'system') !== logIsSystem_(l)) return;
    if (text && !acts[String(l.action)] && !(q.sys && logIsSystem_(l)) && !(q.admin && String(l.actor) === 'ADMIN') && [l.actor, l.action, l.entity, l.entity_id, l.detail].join(' ').toLowerCase().indexOf(text) === -1) return;
    list.push({ l: l, ts: ts, sig: logSig_(l) });
  });
  list.sort(function (a, b) { return b.ts - a.ts || (a.sig < b.sig ? -1 : a.sig > b.sig ? 1 : b.l._row - a.l._row); });
  var rest = list;
  if (cur && cur.ts) {
    var skip = cur.n;
    rest = list.filter(function (x) {
      if (x.ts !== cur.ts) return x.ts < cur.ts;
      if (x.sig !== cur.sig) return x.sig > cur.sig;
      if (skip > 0) { skip--; return false; }
      return true;
    });
  }
  var page = rest.slice(0, limit), items = page.map(function (x) { return adminLogView_(x.l, false); }), next = null;
  if (rest.length > limit && page.length) {
    var last = page[page.length - 1], n = page.filter(function (x) { return x.ts === last.ts && x.sig === last.sig; }).length;
    if (cur && cur.ts === last.ts && cur.sig === last.sig) n += cur.n;
    next = { ts: last.ts, sig: last.sig, n: n };
  }
  return { items: items, total: list.length, next: next, days: activityKeepDays_() };
}

function apiAdminLog(token, q) {
  return apiWrap_('apiAdminLog', function () {
    requireRole_(token, 'ADMIN');
    return { ok: true, data: adminLogQuery_(q) };
  });
}

/**
 * Một dòng nhật ký đầy đủ. row + ts + action + h: hàng, mốc giờ, hành động, mã băm nội dung đã thấy ở danh sách; tab bị sắp xếp
 * lại thì tìm theo mốc giờ, hành động và mã băm (soát vòng 2 N2: không mở nhầm dòng cùng giờ, cùng hành động).
 */
function apiAdminLogEntry(token, row, ts, action, h) {
  return apiWrap_('apiAdminLogEntry', function () {
    requireRole_(token, 'ADMIN');
    var rows = table_('ACTIVITY_LOG').all(), want = Number(ts) || 0, act = String(action || '');
    var hh = h ? String(h) : '';
    var match = function (l) { var t = logTime_(l); return (t ? t.getTime() : 0) === want && String(l.action) === act && (!hh || logHash_(l) === hh); };
    var l = rows.filter(function (x) { return x._row === Number(row); })[0];
    if (!l || !match(l)) l = rows.filter(match)[0];
    if (!l) return { ok: false, reason: REASONS.NOT_FOUND };
    var v = adminLogView_(l, true);
    v.link = rowLink_('ACTIVITY_LOG', l._row);
    return { ok: true, data: v };
  });
}

// ── AdminOps.gs ──
/**
 * AdminOps.gs · Thao tác của admin (v8, brief mục 13, câu 7, 25, 28)
 *
 * Đây là lớp dịch vụ. Menu và dropdown trên Sheets (Admin.gs, chunk 3) chỉ gọi các hàm ở đây.
 * actor luôn là email admin để ACTIVITY_LOG ghi đúng người làm.
 */

/** Tạm khoá học viên (câu 7): chặn đặt lịch, ghi mốc để cộng bù ngày khi mở khoá. */
function suspendStudent_(studentId, actor) {
  return withLock_(function () {
    var u = userById_(studentId);
    if (!u || u.role !== 'STUDENT') return { ok: false, reason: REASONS.NOT_FOUND };
    if (u.status === USER_STATUS.SUSPENDED) return { ok: true, already: true };
    var today = toMidnight_(getNow_()), defs = pkgDefs_();
    table_('USERS').update(u, { status: USER_STATUS.SUSPENDED });
    studentPackages_(studentId).forEach(function (sp) {
      var d = defs[sp.package_code];
      if (d && d.type !== 'SESSIONS' && sp.status !== PKG_STATUS.EXPIRED) table_('STUDENT_PACKAGES').update(sp, { suspend_started_at: today });
    });
    logActivity_(actor, 'STUDENT_SUSPENDED', 'USER', studentId, '');
    return { ok: true };
  });
}

/** Mở khoá: cộng số ngày bị khoá vào hạn gói (câu 7, B14). */
function unsuspendStudent_(studentId, actor) {
  return withLock_(function () {
    var u = userById_(studentId);
    if (!u || u.status !== USER_STATUS.SUSPENDED) return { ok: false, reason: REASONS.INVALID_INPUT };
    var today = toMidnight_(getNow_()), defs = pkgDefs_(), t = table_('STUDENT_PACKAGES');
    studentPackages_(studentId).forEach(function (sp) {
      var d = defs[sp.package_code];
      if (!d || !sp.suspend_started_at) return;
      var patch = pkgUnsuspendPatch_(sp, d, toMidnight_(new Date(sp.suspend_started_at)), today) || {};
      patch.suspend_started_at = '';
      t.update(sp, patch);
    });
    table_('USERS').update(u, { status: USER_STATUS.ACTIVE });
    // Chunk 5M: tính lại ngay (gói chuyển trạng thái trong lúc khoá, khoá ngày bắt đầu); chạy lại không cộng thêm.
    recomputeStudentPackages_(studentId, actor);
    logActivity_(actor, 'STUDENT_UNSUSPENDED', 'USER', studentId, '');
    return { ok: true };
  });
}

/**
 * Admin huỷ một booking (Q5, BL46, chunk 5M). Một lựa chọn, hệ thống xét thời điểm admin chọn (at, mặc định bây giờ):
 *   trước CANCEL_CUTOFF_HOUR hôm trước buổi học: CANCELLED_ADMIN (lỗi phía trường, học viên được bù);
 *   từ mốc đó trở đi: CANCELLED_LATE (học viên xin huỷ muộn: trừ lượt như câu 12, không cộng ngày).
 * at là giờ của sự kiện sửa ô (onEdit) hoặc lúc gọi API, không phải lúc lấy được khoá: chọn 14:59:50 thì tính là trước hạn.
 */
function adminCancelBooking_(bookingId, actor, reason, at) {
  var when = at instanceof Date ? at : getNow_();
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.status !== BOOKING_STATUS.CONFIRMED && b.status !== BOOKING_STATUS.PENDING_REASSIGN) return { ok: false, reason: REASONS.INVALID_INPUT };
    var late = !(when < cancelDeadline_(b.date)), st = late ? BOOKING_STATUS.CANCELLED_LATE : BOOKING_STATUS.CANCELLED_ADMIN;
    cancelBookingInternal_(b, st, actor, reason || 'Admin huỷ', 'ADMIN');
    return { ok: true, status: st, late: late };
  });
}

/** Admin đổi tutor. tutorId trống: hệ thống tự chọn theo luật; có tutorId: dùng đúng người đó nếu rảnh. Chặn sau giờ bắt đầu (5M). */
function adminReassignBooking_(bookingId, actor, tutorId) {
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b || b.status !== BOOKING_STATUS.CONFIRMED) return { ok: false, reason: b ? REASONS.INVALID_INPUT : REASONS.NOT_FOUND };
    if (!(getNow_() < slotStart_(b.date, b.slot))) return { ok: false, reason: REASONS.SLOT_STARTED };
    return reassignBookingInLock_(b, [b.tutor_id], actor, 'ADMIN', tutorId || null);
  });
}

/** Trạng thái đã có kết quả mà "Vắng tutor" ghi đè được (sau khi admin xác nhận lần hai: tutor mất lương buổi đó). */
var TUTOR_ABSENT_OVERWRITE_ = ['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE'];
/**
 * Đánh dấu Vắng tutor (câu 28): không trừ buổi học viên, không tính lương, học viên được bù (5M).
 * Chỉ sau giờ bắt đầu buổi. Buổi đã có kết quả (Hoàn thành, Vắng học viên, Kỹ thuật) phải có opts.confirm, không thì trả NEED_CONFIRM.
 */
function adminMarkTutorAbsent_(bookingId, actor, opts) {
  opts = opts || {};
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (/^CANCELLED/.test(b.status) || b.status === BOOKING_STATUS.TUTOR_ABSENT) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (getNow_() < slotStart_(b.date, b.slot)) return { ok: false, reason: REASONS.TOO_EARLY };
    if (TUTOR_ABSENT_OVERWRITE_.indexOf(String(b.status)) !== -1 && !opts.confirm) return { ok: false, reason: 'NEED_CONFIRM', status: b.status };
    var prev = b.status;
    table_('BOOKINGS').update(b, { status: BOOKING_STATUS.TUTOR_ABSENT, result_at: getNow_(), result_by: actor });
    recomputeStudentPackages_(b.student_id, actor);
    logActivity_(actor, 'TUTOR_ABSENT', 'BOOKING', bookingId, prev === BOOKING_STATUS.CONFIRMED ? '' : { from: prev });
    return { ok: true };
  });
}

/**
 * Admin chọn lỗi của buổi Vấn đề kỹ thuật (câu 25, 27; chunk 5M). Nguồn duy nhất cho lương, trừ lượt Trial, bù ngày:
 *   TUTOR: không lương, không trừ, bù; STUDENT: có lương, trừ lượt Trial, không bù; OBJECTIVE: có lương, không trừ, bù.
 * Đổi qua lại bao nhiêu lần cũng đúng: tính lại gói ngay (rút hoặc cộng ngày bù).
 */
function adminSetTechFault_(bookingId, actor, fault) {
  if (!TECH_FAULT[fault]) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b || b.status !== BOOKING_STATUS.TECH_ISSUE) return { ok: false, reason: REASONS.INVALID_INPUT };
    table_('BOOKINGS').update(b, { tech_fault: fault, tech_decided_at: getNow_(), payroll_override: fault !== TECH_FAULT.TUTOR });
    recomputeStudentPackages_(b.student_id, actor);
    logActivity_(actor, 'TECH_FAULT', 'BOOKING', bookingId, fault);
    return { ok: true };
  });
}

/**
 * Chunk 5N: "Đã xử lý (giữ nguyên)" ở cột admin_action của BOOKINGS. Không đổi trạng thái, lương hay gói: chỉ ghi admin_done_at
 * (dòng hết tô vàng Vắng học viên, hết đỏ Không hoàn thành). Không cho chọn khi màu chỉ hết bằng việc thật:
 *   CONFIRMED, PENDING_REASSIGN (buổi chưa có kết quả hoặc chưa có tutor), TECH_ISSUE chưa chọn lỗi (chọn 1 trong 3 lựa chọn lỗi).
 * Trả { ok } hoặc { ok: false, reason, block: 'OPEN' | 'TECH' } để phần nối (Admin.gs) báo đúng việc cần làm.
 */
function adminMarkDone_(bookingId, actor) {
  return withLock_(function () {
    var t = table_('BOOKINGS'), b = t.byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) return { ok: false, reason: REASONS.INVALID_INPUT, block: 'OPEN', status: b.status };
    if (b.status === BOOKING_STATUS.TECH_ISSUE && !b.tech_decided_at) return { ok: false, reason: REASONS.INVALID_INPUT, block: 'TECH', status: b.status };
    logActivity_(actor, 'ADMIN_MARK_DONE', 'BOOKING', bookingId, { status: b.status });
    return { ok: true };
  });
}

/** Bản cũ (giữ tên cho code và test cũ): "Tính lương buổi kỹ thuật" = lỗi học viên; tắt = lỗi tutor. */
function adminPayrollOverride_(bookingId, actor, on) {
  return adminSetTechFault_(bookingId, actor, on !== false ? TECH_FAULT.STUDENT : TECH_FAULT.TUTOR);
}

// ── Api.gs ──
/**
 * Api.gs · Cửa vào của trang web (v8, plan mục 6)
 *
 * doGet phục vụ giao diện (ui/*.html, chunk 4). Trang web gọi các hàm api* qua google.script.run.
 * Quy tắc:
 *   1. Hàm cần đăng nhập luôn gọi requireRole_ đầu tiên; id học viên, tutor lấy từ phiên, không nhận từ trình duyệt.
 *   2. Mọi hàm trả object { ok, reason, message, data } thay vì ném lỗi, để trang web luôn hiện được câu dễ hiểu.
 *   3. Lỗi bất ngờ: email admin kèm chi tiết, trang web chỉ thấy câu chung (không lộ thông tin hệ thống).
 */

function doGet(e) {
  var params = (e && e.parameter) || {};
  // Kiểm tra từ bên ngoài (chunk 5F): dịch vụ giám sát (UptimeRobot...) gọi ?page=health mỗi vài phút. Không đọc Sheets,
  // không lấy khoá: chỉ chứng minh web app còn chạy và bộ đệm còn dùng được.
  if (String(params.page || '') === 'health') return healthResponse_();
  var t = htmlTemplate_('ui/Index');
  t.bootJson = bootJson_(params);
  return t.evaluate()
    .setTitle(cfg_('SCHOOL_NAME') + ' · Đặt lịch luyện nói 1:1 · 1:1 speaking lessons')   // chunk 5I: tiêu đề thẻ trình duyệt đủ hai thứ tiếng
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Dữ liệu khởi động cho trình duyệt, in vào trang bằng <?!= ?>.
 * Chỉ nhận page là chữ thường và token là chữ số hex, nên tham số URL lạ không chèn được mã vào trang.
 * Dùng JSON thay cho <?= ?> trong thẻ script vì Apps Script tự thêm dấu nháy khi in chuỗi trong ngữ cảnh JavaScript.
 */
function bootJson_(params) {
  var page = String(params.page || 'home'), tok = String(params.t || '');
  var boot = { page: /^[a-z]{1,20}$/.test(page) ? page : 'home', linkToken: /^[a-f0-9]{32,128}$/i.test(tok) ? tok : '', version: APP.VERSION };
  // Đăng nhập Google (chunk 5D): dự án phụ chuyển sang ?page=gauth&ge=email&gts=thời điểm&gs=chữ ký. Chỉ nhận đúng dạng.
  if (boot.page === 'gauth') {
    var ge = String(params.ge || '').toLowerCase(), gts = String(params.gts || ''), gs = String(params.gs || '');
    boot.glogin = /^[^\s@<>"']{1,80}@[^\s@<>"']{1,80}$/.test(ge) && /^\d{10,16}$/.test(gts) && /^[A-Za-z0-9_-]{20,100}$/.test(gs) ? { e: ge, ts: gts, sig: gs } : null;
  }
  try { boot.googleLoginUrl = cfg_('GOOGLE_LOGIN_URL'); } catch (e) { boot.googleLoginUrl = ''; }
  // Chữ trên web lấy từ tab CONTENT (chunk 5C) và link Zalo cho nút nổi ở góc màn hình.
  // Chunk 5I: chữ của trang admin (ad.*) không gửi cho mọi trang; trang admin nhận qua apiAdminHome.
  try { var cm = contentMap_(); boot.content = {}; Object.keys(cm).forEach(function (k) { if (k.indexOf('ad.') !== 0) boot.content[k] = cm[k]; }); } catch (e) { boot.content = {}; }
  try { boot.zalo = cfg_('ADMIN_ZALO_URL'); } catch (e) { boot.zalo = ''; }
  boot.maint = maintInfo_();   // chunk 5G: thanh báo bảo trì
  return JSON.stringify(boot).replace(/</g, '\\u003c');
}

/**
 * File HTML có thể tên "ui/Index" (đẩy bằng clasp) hoặc "Index" (dán tay trong trình soạn thảo, bản dist/).
 * Thử tên có thư mục trước, không có thì dùng tên ngắn.
 */
function htmlTemplate_(name) {
  try { return HtmlService.createTemplateFromFile(name); } catch (e) { return HtmlService.createTemplateFromFile(name.replace(/^ui\//, '')); }
}
/** Nhúng một file HTML con vào trang (dùng trong ui/Index.html). */
function include_(name) {
  try { return HtmlService.createHtmlOutputFromFile(name).getContent(); } catch (e) { }
  var short = name.replace(/^ui\//, '');
  try { return HtmlService.createHtmlOutputFromFile(short).getContent(); }
  catch (e2) {
    throw new Error('Thiếu file HTML "' + short + '" trong bản đã triển khai. Cách sửa: dùng bản Index.html gộp sẵn trong dist/ ' +
      '(không cần file ' + short + '), hoặc tạo file HTML tên đúng "' + short + '"; sau đó Triển khai > Quản lý các lần triển khai > Phiên bản mới.');
  }
}

/**
 * Trang health cho dịch vụ giám sát bên ngoài. Không chạm Sheets, không lấy khoá (luật 37).
 * "OK": web app chạy và các job định kỳ còn chạy. "STALE": một job đã ngừng quá lâu (trigger bị gỡ, hết hạn mức,
 * lỗi lặp lại): dịch vụ giám sát kiểm chữ "OK" nên sẽ báo động. Chưa có mốc nào (vừa cài đặt) thì coi là OK.
 * Không lộ phiên bản, tên job hay lượng khách ra ngoài (soát R2 L7).
 */
// nightlyBackup, dailyJob chạy 1 lần mỗi ngày: quá 26 giờ không chạy là có vấn đề (soát R2 T22).
var HEALTH_MAX_AGE_MIN_ = { hourlyJob: 150, reminderJob: 45, calendarJob: 30, nightlyBackup: 26 * 60, dailyJob: 26 * 60 };
function healthStatus_() {
  var p = null; try { p = props_().getProperties(); } catch (e) { return 'OK'; }
  var now = realNowMs_(), stale = Object.keys(HEALTH_MAX_AGE_MIN_).filter(function (k) {
    // Sao lưu: theo mốc đã có file (BACKUP_OK_AT), không theo nhịp tim (bỏ lượt vì bận vẫn ghi nhịp).
    var t = Number(p[k === 'nightlyBackup' ? 'BACKUP_OK_AT' : 'HB_' + k] || 0); return t > 0 && now - t > HEALTH_MAX_AGE_MIN_[k] * 60000;
  });
  return stale.length ? 'STALE' : 'OK';
}
function healthResponse_() {
  try { CacheService.getScriptCache().get('health'); } catch (e) { }
  return ContentService.createTextOutput(healthStatus_()).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Bọc mọi hàm API: chuẩn hoá kết quả và lỗi.
 * Chunk 5F: đo thời gian mỗi lượt (Metrics.gs); trong lượt gọi, các dòng nhật ký và MAIL_LOG phát sinh ngoài khoá được gom
 * và ghi một lần ở cuối (flushDeferred_) thay vì mỗi dòng một lần lấy khoá.
 */
var CURRENT_API_ = '';   // tên API đang chạy (để idem_ áp chế độ bảo trì SAU bước trả lại kết quả cũ)
function apiWrap_(name, fn) {
  // Ngôn ngữ câu báo lỗi: cổng tutor tiếng Anh; trang đăng nhập chưa biết là ai nên hiện cả hai; còn lại tiếng Việt.
  var lang = /^apiTutor/.test(name) ? 'en' : /^api(RequestLogin|ExchangeToken|GoogleExchange)$/.test(name) ? 'both' : 'vi';
  var t0 = Date.now(), flags = {}, out, prevApi = CURRENT_API_;
  if (!prevApi) forgetEnvMemo_();   // mỗi lượt gọi từ trình duyệt là một lần chạy mới (chunk 5I: ENV, DB_ID nhớ trong lần chạy)
  DEFER_ACTIVE_++; CURRENT_API_ = name;
  try {
    out = apiRun_(name, fn, lang, flags);
  } finally {
    CURRENT_API_ = prevApi;
    runAfterResponse_();
    DEFER_ACTIVE_--;
    if (!DEFER_ACTIVE_) { try { flushDeferred_(); } catch (e) { } }
    try { metricAdd_(name, Date.now() - t0, flags); } catch (e) { }
  }
  return out;
}
function apiRun_(name, fn, lang, flags) {
  try {
    // Chunk 5G: chế độ bảo trì chặn trước khi làm gì (không ghi, không lấy khoá). Admin không bao giờ bị chặn.
    // API có mã lần bấm (idem_) được chặn bên trong idem_, SAU bước trả lại kết quả cũ: lượt đặt đã ghi mà mất phản hồi,
    // gửi lại đúng lúc bật bảo trì vẫn nhận đúng kết quả "đã đặt" (soát R2 T4).
    var mb = MAINT_IDEM_APIS_[name] || MAINT_ROLE_APIS_[name] ? null : maintBlock_(name);
    var out = mb || fn();
    // Báo trạng thái bảo trì cho trang (thanh báo tự bật, tự tắt khi admin đổi trong lúc trang đang mở; soát R1 L4, R2 T11).
    if (out && typeof out === 'object' && 'ok' in out && !/^apiAdmin/.test(name)) { var mm = maintInfo_(); if (mm.mode !== 'OFF') out.maint = mm; }
    if (out && typeof out === 'object' && 'ok' in out) {
      if (!out.ok && out.reason === REASONS.BUSY) flags.busy = true;
      // Chunk 5H: câu báo lỗi cả hai thứ tiếng (out.msg); trình duyệt hiện theo ngôn ngữ người dùng chọn.
      // out.message giữ ngôn ngữ mặc định của API (trang quản trị, công cụ cũ đọc message).
      if (!out.ok && out.reason && !out.message) {
        out.msg = reasonsPair_(out.reasons && out.reasons.length ? out.reasons : [out.msgCode || out.reason], out.vars);
        out.message = lang === 'en' ? out.msg.en : lang === 'both' ? (out.msg.vi === out.msg.en ? out.msg.vi : out.msg.vi + ' / ' + out.msg.en) : out.msg.vi;
      }
      delete out.vars; delete out.msgCode;
      return out;
    }
    return { ok: true, data: out };
  } catch (e) {
    var msg = String((e && e.message) || e);
    if (msg === BUSY_MESSAGE_) { flags.busy = true; return { ok: false, reason: REASONS.BUSY, message: safeReason_(REASONS.BUSY, lang), msg: safePair_(REASONS.BUSY) }; }
    if (msg.indexOf('AUTH:') === 0) {
      var code = msg.substring(5);
      return { ok: false, reason: code, message: safeReason_(code, lang), msg: safePair_(code) };
    }
    flags.error = true;
    mailAdminError_('API ' + name, (e && e.stack) || msg);
    return { ok: false, reason: REASONS.SERVER_ERROR, message: safeReason_(REASONS.SERVER_ERROR, lang), msg: safePair_(REASONS.SERVER_ERROR) };
  }
}

/**
 * Việc chạy sau khi kết quả của lượt gọi đã có (và đã lưu cho chống gửi trùng), ví dụ email "Có đăng nhập mới".
 * Ngoài lượt gọi API (menu, test gọi thẳng) thì chạy ngay. Lỗi không đổi kết quả.
 */
var AFTER_RESPONSE_ = [];
function afterResponse_(fn) { if (DEFER_ACTIVE_ > 0) AFTER_RESPONSE_.push(fn); else { try { fn(); } catch (e) { afterLockError_(e); } } }
function runAfterResponse_() {
  var list = AFTER_RESPONSE_; AFTER_RESPONSE_ = [];
  list.forEach(function (fn) { try { fn(); } catch (e) { afterLockError_(e); } });
}

/**
 * Chống gửi trùng (chunk 5F). Trình duyệt sinh một mã cho mỗi lần bấm (đặt, huỷ, lưu slot, xác nhận kết quả, đổi link
 * đăng nhập) và gửi lại đúng mã đó khi tự thử lại. Kết quả lần đầu lưu 6 giờ trong bộ đệm theo (phạm vi, mã): lần gửi lại
 * nhận đúng kết quả cũ, không làm lại. Lần gửi lại đến khi lần đầu còn đang chạy thì nhận "bận" và tự thử lại sau.
 * Phạm vi có mã người dùng (hoặc băm của link) nên không ai lấy được kết quả của người khác bằng cách đoán mã.
 */
function idem_(scope, rid, fn, opts) {
  rid = validRequestId_(rid);
  var gate = function () { return CURRENT_API_ && MAINT_IDEM_APIS_[CURRENT_API_] ? maintBlock_(CURRENT_API_) : null; };
  if (!rid) return gate() || fn();
  // opts.okOnly (endpoint công khai: đổi link, đăng nhập Google): chỉ lưu kết quả thành công, và chỉ đặt cờ "đang chạy" khi
  // opts.gate() xác nhận đầu vào có thật (link có trong AUTH), để link hay chữ ký rác không ghi được gì vào bộ đệm
  // (soát R1 L9, luật 37) mà lần gửi lại của người thật vẫn nhận IN_PROGRESS thay vì "link đã dùng" (soát R2 T1).
  opts = opts || {};
  var mark = !opts.okOnly || (opts.gate && opts.gate());
  var c = null, key = 'idem_' + sha256Hex_(scope + '|' + rid).substring(0, 40);
  try { c = CacheService.getScriptCache(); } catch (e) { return gate() || fn(); }   // soát R3 N4: bộ đệm hỏng vẫn qua cổng bảo trì
  var hit = null;
  try { hit = c.get(key); } catch (e) { }
  // Lượt đầu còn đang chạy: báo IN_PROGRESS (không phải "bận") để trình duyệt hỏi lại cùng mã tới khi có kết quả (soát R1 T4).
  if (hit === 'RUNNING') return { ok: false, reason: REASONS.IN_PROGRESS };
  if (hit) { try { var o = JSON.parse(hit); o.replay = true; return o; } catch (e) { } }
  var mb = gate(); if (mb) return mb;   // bảo trì: chặn lượt mới, không lưu làm kết quả cũ
  if (mark) { try { c.put(key, 'RUNNING', 120); } catch (e) { } }
  var out;
  try { out = fn(); } catch (e) { if (mark) { try { c.remove(key); } catch (x) { } } throw e; }
  try {
    if (out && out.ok === false && out.reason === REASONS.BUSY) { if (mark) c.remove(key); }
    else if (!opts.okOnly || (out && out.ok)) c.put(key, JSON.stringify(out), 21600);
    else if (mark) c.remove(key);
  } catch (e) { }
  return out;
}

/**
 * Trình duyệt báo lượt gọi thất bại sau khi đã tự thử lại, và số lần phải thử lại (chunk 5F). Lượt bị Google từ chối
 * không tới được máy chủ nên chỉ trình duyệt biết. Hàm công khai: chỉ cộng bộ đệm số đo, không ghi Sheets, không lấy khoá.
 */
function apiClientReport(kind, n) {
  var k = str_(kind);
  if (['fail', 'retry', 'slow'].indexOf(k) === -1) return { ok: false };
  var count = Math.max(1, Math.min(50, Math.floor(Number(n) || 1)));
  // Chống người ngoài làm bẩn số đo (soát R2 L7): mỗi giờ tối đa 2.000 lượt báo, đếm ở khoá riêng.
  try {
    var c = CacheService.getScriptCache(), key = 'clientrep_' + metricHourKey_(new Date(realNowMs_())), used = Number(c.get(key) || 0);
    if (used >= 2000) return { ok: true };
    c.put(key, String(used + count), 3700);
    metricAdd_('_client_' + k, 0, { count: count, error: k === 'fail' });
  } catch (e) { }
  return { ok: true };
}

/** Câu báo lỗi khi đang xử lý lỗi: nếu đọc tab CONTENT cũng hỏng thì dùng câu gốc trong code. */
function safeReason_(code, lang) {
  try { return reasonText_(code, lang); } catch (e) { return REASON_TEXT_VI[code] || code; }
}
function safePair_(code) {
  try { return reasonPair_(code); } catch (e) { return { vi: REASON_TEXT_VI[code] || code, en: REASON_TEXT_EN_[code] || code }; }
}
/** Nhiều mã lỗi (form đăng ký có thể sai nhiều ô): nối câu của từng mã, mỗi thứ tiếng riêng. */
function reasonsPair_(codes, vars) {
  var ps = codes.map(function (c) { return reasonPair_(c, vars); });
  return { vi: ps.map(function (p) { return p.vi; }).join(' '), en: ps.map(function (p) { return p.en; }).join(' ') };
}

function contactInfo_() {
  // Chỉ Zalo và website (chunk 5A: bỏ nút gọi điện trên web và email; số admin chỉ còn trong Sheets).
  return { zalo: cfg_('ADMIN_ZALO_URL'), site: cfg_('SCHOOL_SITE_URL') };
}

// ── Công khai (không cần đăng nhập) ──

function apiPublicInfo() {
  return apiWrap_('apiPublicInfo', function () {
    var defs = pkgDefs_();
    return {
      ok: true,
      data: {
        school: cfg_('SCHOOL_NAME'),
        packages: (function () { var bad = brokenPackageCodes_(); return Object.keys(defs).map(function (k) { return defs[k]; }).filter(function (p) { return p.active && !bad[p.code]; }); })()   // 5L: gói trùng mã, sai dòng: ẩn
          .map(function (p) { return { code: p.code, name: p.name, nameEn: p.name_en || p.name, type: p.type, days: p.days, sessions: p.sessions, price: p.price_vnd }; }),
        bank: { name: cfg_('BANK_NAME'), account: cfg_('BANK_ACCOUNT'), holder: cfg_('BANK_HOLDER') },
        contact: contactInfo_(),
        policyUrl: cfg_('POLICY_URL'),
        cutoffHour: cfg_('BOOKING_CUTOFF_HOUR'), bookingLeadHours: bookingLeadHours_()
      }
    };
  });
}

function apiSubmitRegistration(form) {
  return apiWrap_('apiSubmitRegistration', function () {
    // Ô ẩn "website": người thật không thấy nên để trống, máy spam thường điền vào.
    if (form && form.website) return { ok: false, reason: REASONS.INVALID_INPUT };
    form = form && typeof form === 'object' ? form : {};
    // Kiểm hạn mức trước (chỉ đọc), kiểm dữ liệu không cần khoá; chỉ đăng ký hợp lệ mới tính vào hạn mức mỗi giờ
    // (20 form rác không làm khoá form của người thật).
    if (!registrationRateOk_(false)) return { ok: false, reason: REASONS.RATE_LIMITED, msgCode: 'REG_RATE_LIMITED' };
    var pre = validateRegistration_(form, pkgDefs_());
    if (!pre.ok) return { ok: false, reason: pre.reasons[0], reasons: pre.reasons };
    var r = submitRegistration_(form);
    if (r.ok) registrationRateOk_(true);
    if (!r.ok) return { ok: false, reason: r.reasons[0], reasons: r.reasons };
    return { ok: true, data: { regId: r.regId, transferCode: r.transferCode } };
  });
}

/** Đếm số đăng ký công khai trong giờ hiện tại (CacheService). Quá REG_MAX_PER_HOUR thì tạm chặn. */
function registrationRateOk_(add) {
  try {
    var c = CacheService.getScriptCache(), key = 'reg:' + Utilities.formatDate(getNow_(), APP.TIMEZONE, 'yyyyMMddHH');
    var n = Number(c.get(key) || 0);
    if (add) { c.put(key, String(n + 1), 3700); return true; }
    if (n >= cfg_('REG_MAX_PER_HOUR')) return false;
  } catch (e) { }
  return true;
}

function apiRequestLogin(email) { return apiWrap_('apiRequestLogin', function () { return requestLoginLink_(email); }); }

function apiExchangeToken(linkToken, device, rid) {
  return apiWrap_('apiExchangeToken', function () {
    // Link dùng 1 lần (tutor, admin): mạng rớt sau khi máy chủ đã nhận link thì lần thử lại cùng mã nhận lại đúng phiên đó.
    return idem_('x|' + sha256Hex_(str_(linkToken)), rid, function () {
      var r = exchangeLoginToken_(linkToken, str_(device).substring(0, 400));
      if (!r.ok) return r;
      // lang: ngôn ngữ đã chọn (trống = chưa chọn: trang hỏi một lần, chunk 5H).
      return { ok: true, data: { sessionToken: r.sessionToken, role: r.role, name: r.name, lang: r.lang || '' } };
    }, { okOnly: true, gate: function () { return loginLinkKnown_(linkToken); } });
  });
}

function apiLogout(token) { return apiWrap_('apiLogout', function () { return logout_(token); }); }

/** Đăng nhập bằng tài khoản Google: đổi chữ ký của dự án phụ lấy phiên (chunk 5D). */
function apiGoogleExchange(email, ts, sig, device, rid) {
  return apiWrap_('apiGoogleExchange', function () {
    return idem_('g|' + sha256Hex_(str_(sig)), rid, function () {
      var r = googleLoginExchange_(email, ts, sig, str_(device).substring(0, 400));
      if (!r.ok) return r;
      return { ok: true, data: { sessionToken: r.sessionToken, role: r.role, name: r.name, lang: r.lang || '' } };
    }, { okOnly: true });
  });
}

/**
 * Người dùng chọn ngôn ngữ (nút VI | EN hoặc hộp hỏi lần đầu, chunk 5H). Ghi USERS.lang để mọi thiết bị và email
 * sau này dùng đúng ngôn ngữ. Chọn lại cùng ngôn ngữ thì không ghi (không lấy khoá).
 */
function apiSetLanguage(token, lang) {
  return apiWrap_('apiSetLanguage', function () {
    var u = requireRole_(token, null), l = str_(lang).toLowerCase();
    // Chunk 5I: admin cũng lưu ngôn ngữ; bảo trì không bao giờ chặn admin (luật 47), nên kiểm bảo trì sau khi biết vai trò.
    if (u.role !== 'ADMIN') { var mb = maintBlock_('apiSetLanguage'); if (mb) return mb; }
    if (LANGS_.indexOf(l) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (userLang_(u) === l) return { ok: true, data: { lang: l } };
    withLock_(function () {
      var fresh = userById_(u.user_id);
      if (fresh) table_('USERS').update(fresh, { lang: l });
      // 5K (anh chốt 01/11): không ghi nhật ký đổi ngôn ngữ (dòng LANG_SET cũ vẫn hiện tên, key ad.act.LANG_SET giữ lại).
    });
    USER_LANG_MEMO_ = null;
    return { ok: true, data: { lang: l } };
  });
}

// 16/10: bỏ apiMySessions và apiLogoutAll (danh sách thiết bị, Thoát mọi thiết bị) khỏi cổng học viên và tutor.
// Admin vẫn thoát mọi phiên của một người trong trang quản trị (apiAdminLogoutUser).

// ── Học viên ──

function bookingViewForStudent_(b, now) {
  var t = userById_(b.tutor_id) || {};
  return {
    bookingId: b.booking_id, date: dateKey_(b.date), slot: b.slot, slotLabel: slotLabel_(b.slot),
    status: b.status, awaiting: bookingAwaiting_(b, now),   // trình duyệt dựng nhãn trạng thái theo ngôn ngữ (chunk 5H)
    // Buổi đã diễn ra nhưng tutor chưa xác nhận: không hiện "Xác nhận" trong Lịch sử để học viên khỏi hiểu nhầm.
    tutorName: t.name || '', meetLink: b.meet_link, inviteWhen: calendarInviteWhen_(b, now),
    canCancel: b.status === BOOKING_STATUS.CONFIRMED && now < cancelDeadline_(b.date),
    cancelDeadline: fmtDateTime_(cancelDeadline_(b.date))
  };
}

function apiStudentHome(token, opts) {
  return apiWrap_('apiStudentHome', function () {
    return { ok: true, data: studentHomeData_(requireRole_(token, 'STUDENT'), opts) };
  });
}
/** Dữ liệu cổng học viên (tách riêng để menu Đo tốc độ đo được đúng phần việc này). */
function studentHomeData_(u, opts) {
  {
    var now = getNow_(), defs = pkgDefs_(), bks = studentBookings_(u.user_id);
    var upcoming = [], history = [];
    bks.slice().sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); }).forEach(function (b) {
      var v = bookingViewForStudent_(b, now);
      if (b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now) upcoming.push(v); else history.unshift(v);
    });
    var sps = studentPackages_(u.user_id), slots = opts && opts.slots ? availableSlotsFor_(u.user_id, dateKey_(now), 14) : null;
    return {
        profile: { name: u.name, email: u.email, phone: u.phone, phoneDisplay: phoneDisplay_(u.phone), level: u.level, status: u.status, needsPhone: false, lang: userLang_(u) },
        packages: sps.map(function (sp) { return pkgSummary_(sp, defs[sp.package_code] || { code: sp.package_code, type: 'DAYS' }, bks); }),
        weekBanner: studentWeekBanner_(u, sps, now, slots),
        upcoming: upcoming, history: history.slice(0, 50), contact: contactInfo_(), now: fmtDateTime_(now),
        rules: { bookingLeadHours: bookingLeadHours_(), cutoffHour: cfg_('BOOKING_CUTOFF_HOUR'), cancelHour: cfg_('CANCEL_CUTOFF_HOUR') },
        // Chunk 5F: mở cổng kèm luôn slot 14 ngày (1 lượt gọi thay vì 2; BOOKINGS đã đọc ở trên nên không đọc lại).
        slots: slots
    };
  }
}

/**
 * Chunk 5J (anh chốt 01/11, thay email Chủ nhật): thông báo "đã có giờ học tuần sau" trên trang học viên.
 * Hiện từ STUDENT_WEEK_BANNER_FROM (mặc định 00:00 thứ Bảy) tới 00:00 thứ Hai, khi tuần sau có ít nhất một giờ còn đặt được,
 * chỉ cho học viên ACTIVE có gói chưa kích hoạt, nối đuôi, hoặc còn hạn trong tuần sau. Dùng lại lưới slot đã đệm (không đọc thêm
 * Sheets khi trang đã lấy slot 14 ngày). Trả { week: 'yyyy-MM-dd', monday: 'dd/MM', cutoff } hoặc null.
 */
function studentWeekBanner_(u, sps, now, slots) {
  if (u.status !== USER_STATUS.ACTIVE) return null;
  var mon = nextWeekMonday_(now), from = dowHourBefore_(tutorSchedule_().banner, mon);
  // Soát 5J L1: hết hiện lúc hạn đặt buổi thứ Hai (15:00 Chủ nhật), câu thông báo nói về hạn này.
  if (now < from || !(now < bookingDeadline_(mon))) return null;
  var mk = dateKey_(mon), sk = dateKey_(addDays_(mon, 6)), list = slots || slotGrid_(mon, 7);
  // Soát 5J L2: chỉ mời khi học viên đặt được thật: ngày còn giờ trống, chưa có buổi ngày đó, gói phủ ngày đó và còn lượt.
  var defs = pkgDefs_(), bks = studentBookings_(u.user_id), mine = {}, maxDay = Number(cfg_('MAX_BOOKINGS_PER_DAY')) || 1;
  bks.forEach(function (b) { if (bookingDeducts_(b) && b.date instanceof Date) { var k = dateKey_(b.date); mine[k] = (mine[k] || 0) + 1; } });
  var has = list.some(function (g) {
    if (!(g.date >= mk && g.date <= sk) || !g.slots || !g.slots.length || (mine[g.date] || 0) >= maxDay) return false;
    var d = parseDateKey_(g.date);
    return !!d && resolvePackageForDate_(sps, defs, bks, d, {}).ok;
  });
  return has ? { week: mk, monday: pad2_(mon.getDate()) + '/' + pad2_(mon.getMonth() + 1), cutoff: cfg_('BOOKING_CUTOFF_HOUR') + ':00' } : null;
}

function apiStudentSlots(token, fromKey, days) {
  return apiWrap_('apiStudentSlots', function () {
    var u = requireRole_(token, 'STUDENT');
    return { ok: true, data: availableSlotsFor_(u.user_id, fromKey || dateKey_(getNow_()), Math.min(Number(days) || 14, 21)) };
  });
}

function apiStudentBook(token, requests, rid) {
  return apiWrap_('apiStudentBook', function () {
    var u = requireRole_(token, 'STUDENT');
    return idem_(u.user_id + '|book', rid, function () {
      var res = bookSessionsFor_(u.user_id, requests, u.email, { requestId: rid });
      res.forEach(function (r) { if (!r.ok) { r.msg = reasonPair_(r.reason); r.message = r.msg.vi; } });
      return { ok: true, data: res };
    });
  });
}

function apiStudentCancel(token, bookingId, rid) {
  return apiWrap_('apiStudentCancel', function () {
    var u = requireRole_(token, 'STUDENT');
    return idem_(u.user_id + '|cancel', rid, function () { return cancelBookingFor_(u.user_id, String(bookingId || ''), u.email); });
  });
}

/** Học viên tự sửa tên hiển thị, số điện thoại, level (brief mục D). */
function apiStudentUpdateProfile(token, patch) {
  return apiWrap_('apiStudentUpdateProfile', function () {
    var u = requireRole_(token, 'STUDENT');
    var p = patch || {}, out = {};
    if (p.name !== undefined) { var n = String(p.name).trim(); if (!n || n.length > 80) return { ok: false, reason: REASONS.INVALID_INPUT }; out.name = n; }
    if (p.level !== undefined) out.level = String(p.level).trim().substring(0, 20);
    if (p.phone !== undefined) {   // soát 5K L4: để trống là xoá số và link Zalo
      var ph = normalizePhone_(p.phone, false);
      if (!ph.ok) return { ok: false, reason: REASONS.INVALID_PHONE };
      out.phone = ph.phone; out.contact_link = contactFormula_(ph.phone);
    }
    return withLock_(function () {
      var fresh = userById_(u.user_id);
      table_('USERS').update(fresh, out);
      logActivity_(u.email, 'PROFILE_UPDATED', 'USER', u.user_id, Object.keys(out).join(','));
      return { ok: true };
    });
  });
}

/** Gia hạn: dùng lại form đăng ký, email lấy từ phiên để không ai gia hạn hộ email khác. */
function apiStudentRenew(token, form) {
  return apiWrap_('apiStudentRenew', function () {
    var u = requireRole_(token, 'STUDENT');
    var f = Object.assign({}, form || {}, { email: u.email, name: u.name, phone: (form && form.phone) || u.phone, consent: true });
    var r = submitRegistration_(f);
    if (!r.ok) return { ok: false, reason: r.reasons[0], reasons: r.reasons };
    return { ok: true, data: { regId: r.regId, transferCode: r.transferCode } };
  });
}

// ── Tutor ──

function apiTutorHome(token) {
  return apiWrap_('apiTutorHome', function () {
    var u = requireRole_(token, 'TUTOR');
    return { ok: true, data: { profile: { name: u.name, email: u.email, lang: userLang_(u) }, schedule: tutorScheduleFor_(u.user_id), contact: contactInfo_(), now: fmtDateTime_(getNow_()),
      // Chunk 5J: số giờ báo đỏ và số giờ thành Không hoàn thành (chữ trên tab Cần xác nhận).
      rules: { notice: Number(cfg_('RESULT_NOTICE_AFTER_HOURS')), expire: Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) } } };
  });
}

function apiTutorAvailability(token, fromKey, days) {
  return apiWrap_('apiTutorAvailability', function () {
    var u = requireRole_(token, 'TUTOR');
    var start = parseDateKey_(fromKey) || mondayOf_(getNow_()), n = Math.min(Number(days) || 14, 21);
    var weeks = [];
    for (var w = 0; w < Math.ceil(n / 7); w++) { var mon = addDays_(mondayOf_(start), w * 7); weeks.push({ monday: dateKey_(mon), deadline: fmtDateTime_(tutorWeekDeadline_(mon)), deadlinePassed: !(getNow_() < tutorWeekDeadline_(mon)) }); }
    return { ok: true, data: { slots: slotList_(), items: availabilityFor_(u.user_id, dateKey_(mondayOf_(start)), n), weeks: weeks, now: fmtDateTime_(getNow_()) } };
  });
}

function apiTutorSetAvailability(token, changes, rid) {
  return apiWrap_('apiTutorSetAvailability', function () {
    var u = requireRole_(token, 'TUTOR');
    return idem_(u.user_id + '|avail', rid, function () { return { ok: true, data: setAvailabilityFor_(u.user_id, changes, u.email) }; });
  });
}

function apiTutorSubmitResult(token, bookingId, result, rid) {
  return apiWrap_('apiTutorSubmitResult', function () {
    var u = requireRole_(token, 'TUTOR');
    return idem_(u.user_id + '|result', rid, function () { return submitSessionResultFor_(u.user_id, String(bookingId || ''), String(result || ''), u.email, { session: u._sid }); });
  });
}

/**
 * Tutor xác nhận nhiều buổi một lần (chunk 5F, xác nhận 2 bước: chọn kết quả từng buổi, xem lại, rồi mới Lưu).
 * items: [{ bookingId, result }], tối đa 30. Một lần lấy khoá cho cả lô. Trả kết quả từng buổi.
 */
function apiTutorSubmitResults(token, items, rid) {
  return apiWrap_('apiTutorSubmitResults', function () {
    var u = requireRole_(token, 'TUTOR');
    if (!Array.isArray(items) || !items.length || items.length > 30) return { ok: false, reason: REASONS.INVALID_INPUT };
    return idem_(u.user_id + '|results', rid, function () {
      var out = withLock_(function () {
        return items.map(function (it) {
          var id = str_(it && it.bookingId), res = str_(it && it.result);
          var r = submitSessionResultFor_(u.user_id, id, res, u.email, { session: u._sid });
          var p = r.ok ? null : reasonPair_(r.reason);
          return { bookingId: id, result: res, ok: r.ok, reason: r.reason, message: p ? p.en : '', msg: p };
        });
      });
      return { ok: true, data: { items: out, saved: out.filter(function (x) { return x.ok; }).length } };
    });
  });
}

/** Số buổi của chính tutor tháng này và tháng trước, cùng luật với báo cáo lương (chunk 5D). */
function apiTutorStats(token) {
  return apiWrap_('apiTutorStats', function () {
    var u = requireRole_(token, 'TUTOR');
    return { ok: true, data: tutorMonthStats_(u.user_id) };
  });
}

// ── Archive.gs ──
/**
 * Archive.gs · Lưu trữ (chunk 5G; 5K: nhật ký 60 ngày, nhiều lô mỗi lượt, METRICS)
 *
 * Vì sao: đặt lịch đọc cả tab BOOKINGS và AVAILABILITY trong khoá. Tab lớn dần thì mỗi lần đặt chậm dần (1 năm khoảng
 * 24.000 dòng BOOKINGS). Lưu trữ chuyển dòng CŨ và ĐÃ XONG sang file lưu trữ riêng, để file DB luôn nhỏ.
 *
 * Không mất dữ liệu (CLAUDE.md luật 10, 46):
 *   1. Dòng được CHÉP sang file "THAIPUT · Lưu trữ · <môi trường> · <năm>" (một file mỗi năm, theo ngày của dòng; file tạo
 *      trước 5K tên THAIPUT_ARCHIVE_<môi trường>_<năm> được đổi tên khi mở lại), tab DOC_TRUOC giải thích, tab cùng tên,
 *      cùng cột, thêm 2 cột _archived_at và _batch (mã lô).
 *   2. Đọc lại file lưu trữ, đếm đủ số dòng của lô. Thiếu là dừng, không bỏ dòng nào khỏi DB.
 *   3. Chỉ sau đó mới bỏ các dòng đó khỏi DB (purgeRows_, giữ công thức).
 *   Chạy hỏng giữa bước 1 và 3: mã lô còn ghi ở Script Property ARCH_OPEN; lần sau đọc lô đó trong file lưu trữ, bỏ khỏi
 *   DB đúng các dòng đã chép (so nguyên dòng), không chép lần hai.
 *   File lưu trữ không bao giờ bị code xoá hay sửa. Thư mục lưu trữ nằm cạnh Backup (ARCHIVE_FOLDER_ID).
 *
 * Dòng nào được chuyển (cutoff = ngày 1 của tháng, lùi ARCHIVE_KEEP_MONTHS tháng, tối thiểu 3):
 *   BOOKINGS: ngày học trước cutoff, trạng thái đã xong (không CONFIRMED, PENDING_REASSIGN), admin_action trống,
 *     và gói của buổi đã EXPIRED với ngày hết hạn trước cutoff (hoặc buổi không có gói). Gói còn chạy giữ nguyên mọi buổi,
 *     vì số buổi còn lại tính từ BOOKINGS.
 *   AVAILABILITY: ngày trước cutoff, không còn chờ admin duyệt.
 *   ACTIVITY_LOG, METRICS: cũ hơn LOG_KEEP_DAYS ngày (mặc định 60, tối thiểu 30; chunk 5K), tính theo ngày nên mỗi đêm có việc.
 *   MAIL_LOG: cũ hơn LOG_KEEP_DAYS ngày, trừ dòng email marketing (kind MKT:, sổ chống gửi trùng, luôn giữ).
 *   NOTIFICATIONS: cũ hơn LOG_KEEP_DAYS ngày, đã đọc hoặc mức INFO (thông báo Khẩn, Cần xử lý chưa đọc thì giữ).
 *   Không bao giờ chuyển: USERS, STUDENT_PACKAGES, PAYMENTS, REGISTRATIONS, CONFIG và các tab cấu hình.
 *
 * Chạy: hourlyJob, mỗi ngày từ ARCHIVE_HOUR (mặc định 3 giờ sáng). Mỗi lô tối đa ARCHIVE_MAX_ROWS dòng mỗi tab; một lượt chạy
 * nhiều lô tới khi hết (5K). Hết thời gian của lượt thì chưa đánh dấu xong, lượt sau (giờ sau) làm tiếp. Menu "Lưu trữ: xem
 * tình trạng", "Lưu trữ: chạy ngay" (chủ file), "Lưu trữ: mở file".
 */

var ARCHIVE_TABS_ = ['BOOKINGS', 'AVAILABILITY', 'ACTIVITY_LOG', 'MAIL_LOG', 'NOTIFICATIONS', 'METRICS'];
var ARCHIVE_DATE_COL_ = { BOOKINGS: 'date', AVAILABILITY: 'date', ACTIVITY_LOG: 'time', MAIL_LOG: 'time', NOTIFICATIONS: 'time', METRICS: 'time' };
var ARCHIVE_EXTRA_COLS_ = ['_archived_at', '_batch'];

function archiveKeepMonths_() { return Math.max(3, Math.floor(Number(cfg_('ARCHIVE_KEEP_MONTHS')) || 6)); }
function archiveTabExists_(tab) { try { return !!dbSpreadsheet_().getSheetByName(tab); } catch (e) { return false; } }
/**
 * Soát 5K L2: đổi tên mọi file lưu trữ tạo trước 5K (kể cả năm cũ không còn mở lại) và thêm DOC_TRUOC. Menu 1 gọi. Lỗi thì bỏ qua.
 */
function archiveRenameOldFiles_() {
  var all = props_().getProperties(), n = 0, pre = 'ARCH_FILE_' + getEnv_() + '_';
  Object.keys(all).filter(function (k) { return k.indexOf(pre) === 0; }).forEach(function (k) {
    try {
      var ss = SpreadsheetApp.openById(all[k]), year = k.substring(pre.length);
      if (!/^THAIPUT_ARCHIVE_/.test(ss.getName())) return;
      DriveApp.getFileById(all[k]).setName(archiveFileName_(year)); archiveReadme_(ss, year); n++;
    } catch (e) { Logger.log('Đổi tên file lưu trữ ' + k + ' lỗi: ' + e.message); }
  });
  return n;
}
/** Ngày 1 của tháng hiện tại lùi n tháng (nửa đêm). */
function monthStartBack_(now, n) { return new Date(now.getFullYear(), now.getMonth() - n, 1); }
/** Chunk 5K: một mốc cho mọi tab nhật ký, thông báo, METRICS (LOG_KEEP_DAYS, tối thiểu 30). */
function logKeepDays_() { return Math.max(30, Math.floor(Number(cfg_('LOG_KEEP_DAYS')) || 60)); }
function activityKeepDays_() { return logKeepDays_(); }
/** Mốc nửa đêm của hôm nay lùi LOG_KEEP_DAYS ngày, mỗi đêm chuyển phần vừa quá hạn. */
function archiveCutoffs_(now) {
  var logCut = addDays_(toMidnight_(now), -logKeepDays_());
  return { main: monthStartBack_(now, archiveKeepMonths_()), log: logCut, activity: logCut };
}

/**
 * Hàm thuần: dòng nào của tab được chuyển. rows: dòng của DbTable; ctx: { cut: {main, log, activity}, sps: {sp_id: dòng gói} }.
 * Trả mảng dòng (theo thứ tự trong tab).
 */
function archiveEligible_(tab, rows, ctx) {
  var col = ARCHIVE_DATE_COL_[tab], cut = (tab === 'BOOKINGS' || tab === 'AVAILABILITY') ? ctx.cut.main : tab === 'ACTIVITY_LOG' && ctx.cut.activity ? ctx.cut.activity : ctx.cut.log;
  var old = function (r) { var d = r[col]; d = d instanceof Date ? d : (d ? new Date(d) : null); return !!d && !isNaN(d.getTime()) && d < cut; };
  return rows.filter(function (r) {
    if (!old(r)) return false;
    if (tab === 'BOOKINGS') {
      if (r.status === BOOKING_STATUS.CONFIRMED || r.status === BOOKING_STATUS.PENDING_REASSIGN || !r.status) return false;
      if (String(r.admin_action || '').trim()) return false;
      if (r.sp_id) {
        var sp = ctx.sps[String(r.sp_id)];
        if (sp) {
          if (sp.status !== PKG_STATUS.EXPIRED) return false;
          if (!(sp.end_date instanceof Date) || !(sp.end_date < cut)) return false;
        }
      }
      return true;
    }
    if (tab === 'AVAILABILITY') return r.status !== AVAIL_STATUS.CANCEL_PENDING;
    if (tab === 'NOTIFICATIONS') return r.read === true || String(r.read).toUpperCase() === 'TRUE' || r.level === NOTIFY_LEVEL.INFO;
    // 5K: dòng email marketing là sổ chống gửi trùng của chiến dịch (Marketing.gs): không chuyển.
    if (tab === 'MAIL_LOG') return String(r.kind || '').indexOf('MKT:') !== 0;
    return true;
  });
}

/** Thư mục lưu trữ: ARCHIVE_FOLDER_ID, trống thì tạo "Archive" và ghi lại vào CONFIG. Phải gọi trong withLock_. */
function archiveFolder_() {
  var id = String(cfg_('ARCHIVE_FOLDER_ID') || '').trim();
  if (id) {
    var fo = DriveApp.getFolderById(id);
    // Thư mục trong thùng rác vẫn mở được nhưng Google xoá hẳn sau 30 ngày (soát R1 M3): dừng, không chép thêm vào đó.
    if (fo.isTrashed()) throw new Error('Thư mục lưu trữ (ARCHIVE_FOLDER_ID) đang ở thùng rác: khôi phục từ thùng rác Drive rồi chạy lại.');
    return fo;
  }
  var f = DriveApp.createFolder('THAIPUT_V8_' + getEnv_() + '_Archive');
  var t = table_('CONFIG'), r = t.byId('ARCHIVE_FOLDER_ID');
  if (r) t.update(r, { value: f.getId() }); else t.insert({ key: 'ARCHIVE_FOLDER_ID', value: f.getId(), note: 'Thư mục file lưu trữ (tự tạo)' });
  flushDb_(); clearConfigCache_();
  logActivity_('SYSTEM', 'ARCHIVE_FOLDER_CREATED', 'CONFIG', f.getId(), '');
  return f;
}

/** Tên file lưu trữ (5K): dễ tìm trong Drive. */
function archiveFileName_(year) { return 'THAIPUT · Lưu trữ · ' + getEnv_() + ' · ' + year; }
var ARCHIVE_README_TAB_ = 'DOC_TRUOC';
/** Tab DOC_TRUOC: giải thích file cho người mở (5K). Có rồi thì thôi. */
function archiveReadme_(ss, year) {
  if (ss.getSheetByName(ARCHIVE_README_TAB_)) return;
  var sh, blank = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (blank && blank.getLastRow() === 0) { blank.setName(ARCHIVE_README_TAB_); sh = blank; } else sh = ss.insertSheet(ARCHIVE_README_TAB_);
  var lines = [
    ['File lưu trữ thaiput ' + getEnv_() + ' năm ' + year],
    ['Chứa dòng cũ đã xong được chuyển khỏi file dữ liệu chính để hệ thống luôn nhanh. Không mất dòng nào.'],
    ['Mỗi tab cùng tên và cùng cột với tab trong file chính, thêm 2 cột: _archived_at (lúc chuyển) và _batch (mã lô).'],
    ['Nhật ký, email, thông báo, số đo: dòng cũ hơn LOG_KEEP_DAYS ngày (mặc định 60). Buổi học, giờ rảnh: dòng cũ hơn ARCHIVE_KEEP_MONTHS tháng của gói đã hết hạn.'],
    ['KHÔNG sửa, KHÔNG xoá, KHÔNG đổi tên tab. Hệ thống đọc lại file này để kiểm từng lô.'],
    ['Hướng dẫn: HUONG_DAN_VAN_HANH.md, Phần B12 (Lưu trữ dữ liệu cũ).']
  ];
  sh.getRange(1, 1, lines.length, 1).setValues(lines);
}
/** File lưu trữ của một năm (mở hoặc tạo). Mã file lưu ở Script Property ARCH_FILE_<môi trường>_<năm>. */
function archiveFile_(year) {
  var key = 'ARCH_FILE_' + getEnv_() + '_' + year, props = props_(), id = props.getProperty(key);
  if (id) {
    var trashed = false; try { trashed = DriveApp.getFileById(id).isTrashed(); } catch (e) { }
    if (trashed) throw new Error('File lưu trữ năm ' + year + ' (' + id + ') đang ở thùng rác: khôi phục từ thùng rác Drive rồi chạy lại. Chưa bỏ dòng nào khỏi DB.');
    var old;
    try { old = SpreadsheetApp.openById(id); } catch (e) { throw new Error('Không mở được file lưu trữ năm ' + year + ' (' + id + '). Không xoá hay chuyển file này. Kiểm tra quyền, hoặc xoá Script Property ' + key + ' nếu chắc chắn file đã mất.'); }
    // 5K: file tạo trước 5K mang tên cũ: đổi tên, thêm tab DOC_TRUOC (không đụng dữ liệu). Lỗi thì bỏ qua.
    try { if (/^THAIPUT_ARCHIVE_/.test(old.getName())) { DriveApp.getFileById(id).setName(archiveFileName_(year)); archiveReadme_(old, year); } } catch (e) { Logger.log('Đổi tên file lưu trữ lỗi: ' + e.message); }
    return old;
  }
  var folder = archiveFolder_(), ss = SpreadsheetApp.create(archiveFileName_(year));
  try { ss.setSpreadsheetTimeZone(APP.TIMEZONE); } catch (e) { }
  try { archiveReadme_(ss, year); } catch (e) { Logger.log('Tab DOC_TRUOC lỗi: ' + e.message); }
  var f = DriveApp.getFileById(ss.getId());
  try { if (f.moveTo) f.moveTo(folder); } catch (e) { Logger.log('Chuyển file lưu trữ vào thư mục lỗi: ' + e.message); }
  try { f.setDescription('Lưu trữ thaiput ' + getEnv_() + ' năm ' + year + '. Không sửa, không xoá. Xem HUONG_DAN_VAN_HANH.md Phần B12 và tab DOC_TRUOC.'); } catch (e) { }
  props.setProperty(key, ss.getId());
  logActivity_('SYSTEM', 'ARCHIVE_FILE_CREATED', 'ARCHIVE', ss.getId(), String(year));
  return ss;
}

/** Tab trong file lưu trữ: có thì kiểm tiêu đề khớp, chưa có thì tạo với tiêu đề của DB + 2 cột lưu trữ. */
function archiveSheet_(ss, tab, header) {
  var want = header.concat(ARCHIVE_EXTRA_COLS_), sh = ss.getSheetByName(tab);
  if (!sh) {
    sh = ss.insertSheet(tab);
    if (sh.getMaxColumns() < want.length) sh.insertColumnsAfter(sh.getMaxColumns(), want.length - sh.getMaxColumns());
    sh.getRange(1, 1, 1, want.length).setValues([want]);
    try { sh.setFrozenRows(1); } catch (e) { }
    return sh;
  }
  var have = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(function (h) { return String(h).trim(); });
  // Tab DB có thêm cột mới (bản cập nhật sau): thêm cột vào trước 2 cột lưu trữ thì lệch, nên thêm vào cuối và ghi theo tên.
  var add = want.filter(function (h) { return have.indexOf(h) === -1; });
  if (add.length) {
    if (sh.getMaxColumns() < have.length + add.length) sh.insertColumnsAfter(sh.getMaxColumns(), have.length + add.length - sh.getMaxColumns());
    sh.getRange(1, have.length + 1, 1, add.length).setValues([add]);
  }
  return sh;
}

/** Mốc tháng đã lưu trữ cho báo cáo (REPORT_MONTH ghi "CHÚ Ý ... không đủ"). */
function archiveSetCutoff_(tab, cut) {
  var cutKey = tab === 'BOOKINGS' ? 'ARCH_CUTOFF_MAIN' : tab === 'MAIL_LOG' ? 'ARCH_CUTOFF_MAIL' : '', props = props_();
  if (cutKey) props.setProperty(cutKey, String(Math.max(Number(props.getProperty(cutKey) || 0), (tab === 'BOOKINGS' ? cut.main : cut.log).getTime())));
}

/** Chữ ký của một dòng theo các cột SCHEMA (giá trị đã chuẩn hoá như Db.gs đọc). Ngày giờ so tới giây. */
function archiveObjSig_(tab, obj) {
  return JSON.stringify(SCHEMA[tab].cols.map(function (c) {
    var v = obj[c];
    return v instanceof Date ? 'D' + Math.round(v.getTime() / 1000) : v === null || v === undefined ? '' : typeof v === 'string' ? v : String(v);
  }));
}
/** Dòng của file lưu trữ thành object như Db.gs đọc (để so chữ ký với dòng trong DB). */
function archiveRowObj_(tab, header, line) {
  var o = {}, sc = SCHEMA[tab];
  sc.cols.forEach(function (c) { var j = header.indexOf(c); o[c] = j === -1 ? '' : normalizeCell_(sc, c, line[j]); });
  return o;
}

/**
 * Bỏ khỏi DB các dòng có chữ ký nằm trong sigs (đếm từng bản), theo nội dung đọc mới lúc bỏ (purgeRows_). Dòng admin vừa
 * sửa tay (khác chữ ký) ở lại DB và được chép ở lô sau. Nâng mốc mã, sửa link "mở đúng dòng" của thông báo. Trả số dòng bỏ.
 */
function archivePurgeBySig_(tab, sigs) {
  var removedObjs = [], rowMap = {};
  var n = purgeRows_(tab, function (r) { var k = archiveObjSig_(tab, r); if (sigs[k] > 0) { sigs[k]--; return false; } return true; }, { removed: removedObjs, rowMap: rowMap });
  if (n) { bumpIdFloor_(tab, removedObjs); shiftRowLinksInLock_(tab, rowMap); }
  return n;
}

/**
 * Chuyển một lô của một tab. Phải gọi trong withLock_. Trả { tab, archived, year, batch } (archived 0 = không có gì).
 * Thứ tự: đánh dấu lô mở, chép, đọc lại đếm, bỏ khỏi DB theo chữ ký, đóng lô.
 */
function archiveTabInLock_(tab, now, cut, maxRows, force) {
  flushDb_(); delete DB_CACHE_[tab];
  var props = props_(), openKey = 'ARCH_OPEN_' + tab, open = props.getProperty(openKey);

  // Lô hỏng lần trước: đọc lô đó trong file lưu trữ, bỏ khỏi DB đúng các dòng thấy thật trong file, rồi mới làm lô mới.
  if (open) {
    var o = JSON.parse(open), ass = SpreadsheetApp.openById(o.file), ash = ass.getSheetByName(tab), sigs = {};
    if (ash && ash.getLastRow() > 1) {
      var ah = ash.getRange(1, 1, 1, ash.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
      var bi = ah.indexOf('_batch'), av = ash.getRange(2, 1, ash.getLastRow() - 1, ash.getLastColumn()).getValues();
      // Đếm từng chữ ký (hai dòng nhật ký giống hệt nhau thì bỏ đúng số bản đã chép, không hơn).
      av.forEach(function (r) { if (String(r[bi]) === o.batch) { var k = archiveObjSig_(tab, archiveRowObj_(tab, ah, r)); sigs[k] = (sigs[k] || 0) + 1; } });
    }
    var redo = Object.keys(sigs).length ? archivePurgeBySig_(tab, sigs) : 0;
    logActivity_('SYSTEM', 'ARCHIVE_RECOVER', 'ARCHIVE', tab, JSON.stringify({ batch: o.batch, removed: redo }));
    // Soát R3 L1: lô có dòng trong file lưu trữ thì tháng đó đã chuyển (dù dòng trong DB đã được purgeRecover_ dọn trước).
    if (Object.keys(sigs).length) archiveSetCutoff_(tab, cut);
    props.deleteProperty(openKey);
    return { tab: tab, archived: redo, recovered: true, batch: o.batch };
  }

  var t = table_(tab), sh = t.sheet, spMap = {};
  if (tab === 'BOOKINGS') table_('STUDENT_PACKAGES').all().forEach(function (sp) { spMap[String(sp.sp_id)] = sp; });
  var lastCol = sh.getLastColumn(), last = sh.getLastRow();
  if (last < 2) return { tab: tab, archived: 0 };
  var header = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var raw = sh.getRange(2, 1, last - 1, lastCol).getValues();

  var elig = archiveEligible_(tab, t.all(), { cut: cut, sps: spMap });
  if (!elig.length) return { tab: tab, archived: 0 };
  // 5K (anh chốt 01/11): bỏ mốc chờ 7 ngày của ACTIVITY_LOG; mọi tab nhật ký chuyển ngay phần vừa quá LOG_KEEP_DAYS.
  // Một năm mỗi lô (năm cũ nhất trước), tối đa maxRows dòng.
  var col = ARCHIVE_DATE_COL_[tab], yearOf = function (r) { return new Date(r[col]).getFullYear(); };
  var year = elig.reduce(function (m, r) { return Math.min(m, yearOf(r)); }, 9999);
  var pick = elig.filter(function (r) { return yearOf(r) === year; }).slice(0, maxRows);
  // Mã lô có giây và chữ ngẫu nhiên: hai lượt trong cùng phút không trùng mã (soát R1 L2).
  var batch = tab.substring(0, 3) + Utilities.formatDate(now, APP.TIMEZONE, 'yyyyMMddHHmmss') + '_' + pick.length + '_' + Utilities.getUuid().substring(0, 6);
  var ss = archiveFile_(year), ash2 = archiveSheet_(ss, tab, header);
  var ah2 = ash2.getRange(1, 1, 1, ash2.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  var textCols = (SCHEMA[tab].text || []).concat(['_batch']);
  var rowsOut = pick.map(function (r) {
    var line = raw[r._row - 2];
    return ah2.map(function (h) {
      if (h === '_archived_at') return now;
      if (h === '_batch') return batch;
      var j = header.indexOf(h); if (j === -1) return '';
      var v = line[j];
      return textCols.indexOf(h) === -1 ? safeCellText_(v) : v;
    });
  });
  var first = Math.max(2, ash2.getLastRow() + 1), need = first + rowsOut.length - 1;
  if (ash2.getMaxRows() < need) ash2.insertRowsAfter(ash2.getMaxRows(), need - ash2.getMaxRows() + 100);
  textCols.forEach(function (c) { var i = ah2.indexOf(c); if (i !== -1) ash2.getRange(first, i + 1, rowsOut.length, 1).setNumberFormat('@'); });
  props.setProperty(openKey, JSON.stringify({ file: ss.getId(), batch: batch, n: rowsOut.length, at: now.getTime() }));
  ash2.getRange(first, 1, rowsOut.length, ah2.length).setValues(rowsOut);
  SpreadsheetApp.flush();
  // Đọc lại: đủ số dòng của lô thì mới bỏ khỏi DB.
  var bi2 = ah2.indexOf('_batch'), back = ash2.getRange(first, bi2 + 1, rowsOut.length, 1).getValues();
  var okCount = back.filter(function (x) { return String(x[0]) === batch; }).length;
  if (okCount !== rowsOut.length) {
    // Giữ lô mở: lượt sau đọc lại file lưu trữ, chỉ bỏ khỏi DB các dòng thấy thật trong file; dòng thiếu ở lại DB và được
    // chép ở lô sau. Không mất, không trùng.
    notify_('ARCHIVE_FAILED', { entity: 'ARCHIVE', entity_id: tab, message: 'Lưu trữ ' + tab + ' lô ' + batch + ': đọc lại chỉ thấy ' + okCount + '/' + rowsOut.length + ' dòng. Chưa bỏ dòng nào khỏi DB; lượt sau tự đối chiếu lại. File: ' + ss.getUrl() , message_en: 'Archive ' + tab + ' batch ' + batch + ': read back only ' + okCount + '/' + rowsOut.length + ' rows. No row was removed from the DB; the next run checks again. File: ' + ss.getUrl() });
    throw new Error('Lưu trữ ' + tab + ': đọc lại thiếu dòng (' + okCount + '/' + rowsOut.length + ')');
  }
  var sigs2 = {}; pick.forEach(function (r) { var k = archiveObjSig_(tab, r); sigs2[k] = (sigs2[k] || 0) + 1; });
  var removed = archivePurgeBySig_(tab, sigs2);
  props.deleteProperty(openKey);
  logActivity_('SYSTEM', 'ARCHIVED', 'ARCHIVE', tab, JSON.stringify({ batch: batch, year: year, rows: removed, copied: pick.length, file: ss.getId() }));
  archiveSetCutoff_(tab, cut);
  return { tab: tab, archived: removed, copied: pick.length, year: year, batch: batch, url: ss.getUrl(), more: elig.length > pick.length };
}

/**
 * Link "mở đúng dòng" trong NOTIFICATIONS ghi theo số hàng (rowLink_). Sau khi bỏ dòng ở tab, hàng phía dưới dời lên:
 * sửa link của các thông báo còn trong DB theo bảng hàng cũ → hàng mới của purgeRows_ (tính cả hàng trống bị gọn, soát
 * R3 N6); dòng được trỏ tới đã chuyển đi thì link về đầu tab (soát R2 T3). Email đã gửi trước đó vẫn mang link cũ.
 * Phải gọi trong withLock_.
 */
function shiftRowLinksInLock_(tab, rowMap) {
  var gid = ''; try { gid = String(dbSpreadsheet_().getSheetByName(tab).getSheetId()); } catch (e) { return 0; }
  var nt; try { nt = table_('NOTIFICATIONS'); } catch (e) { return 0; }
  var changed = 0, re = new RegExp('#gid=' + gid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '&range=A(\\d+)$');
  nt.all().forEach(function (n) {
    var m = String(n.link || '').match(re); if (!m) return;
    var row = Number(m[1]), to = rowMap[row], link;
    if (to === row) return;
    link = to ? String(n.link).replace(/&range=A\d+$/, '&range=A' + to) : String(n.link).replace(/&range=A\d+$/, '');
    nt.update(n, { link: link }); changed++;
  });
  return changed;
}

/**
 * Mã tự sinh (BK000124...) lấy số lớn nhất trong tab. Dòng cũ đã chuyển đi thì số lớn nhất có thể giảm, mã mới trùng mã
 * đã lưu trữ. Ghi số lớn nhất đã chuyển vào Script Property ID_FLOOR_<tab>; nextId_ (Db.gs) không bao giờ cấp số nhỏ hơn.
 */
function bumpIdFloor_(tab, rows) {
  var fmt = ID_FORMAT[tab], key = SCHEMA[tab].id;
  if (!fmt || !key) return;
  var re = new RegExp('^' + fmt[0] + '(\\d+)$'), max = 0;
  rows.forEach(function (r) { var m = String(r[key]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  var props = props_(), cur = Number(props.getProperty('ID_FLOOR_' + tab) || 0);
  if (max > cur) props.setProperty('ID_FLOOR_' + tab, String(max));
  ID_FLOOR_MEMO_ = {};
}

/** Thời điểm lượt chạy (execution) này bắt đầu: Apps Script nạp lại biến toàn cục mỗi lượt chạy. */
var EXEC_T0_ = Date.now();
var ARCHIVE_TIME_BUDGET_MS_ = 210000;   // không bắt đầu tab mới sau 3,5 phút (giới hạn 6 phút mỗi lượt chạy)

/**
 * Một lượt lưu trữ cho mọi tab. Mỗi lô một khoá riêng (giữ khoá ngắn). 5K: mỗi tab chạy nhiều lô tới khi hết dòng đủ điều kiện
 * hoặc hết thời gian của lượt; còn dòng thì kết quả tab có more = true (archiveIfDue_ không đánh dấu xong, giờ sau làm tiếp).
 * Trả danh sách kết quả, mỗi tab một dòng (archived cộng dồn các lô).
 */
var ARCHIVE_MAX_BATCHES_ = 50;
function runArchive_(opts) {
  opts = opts || {};
  var now = getNow_(), cut = archiveCutoffs_(now), maxRows = Math.max(100, Number(cfg_('ARCHIVE_MAX_ROWS')) || 3000), out = [];
  ARCHIVE_TABS_.forEach(function (tab) {
    var sum = { tab: tab, archived: 0, batches: 0 };
    if (!archiveTabExists_(tab)) { sum.absent = true; out.push(sum); return; }   // soát 5K L1: tab chưa có (chưa chạy menu 1): bỏ qua
    for (var i = 0; i < ARCHIVE_MAX_BATCHES_; i++) {
      if (Date.now() - EXEC_T0_ > ARCHIVE_TIME_BUDGET_MS_) { sum.skipped = 'TIME'; sum.more = true; break; }
      var r;
      try { r = withLock_(function () { return archiveTabInLock_(tab, now, cut, maxRows, !!opts.force); }, 30000); }
      catch (e) {
        sum.error = String((e && e.message) || e);
        if (sum.error !== BUSY_MESSAGE_) mailAdminError_('Lưu trữ ' + tab + ' lỗi', (e && e.stack) || String(e));
        break;
      }
      sum.archived += r.archived || 0; sum.batches++;
      if (r.year) sum.year = r.year;
      if (r.recovered) { sum.recovered = true; continue; }   // xong lô dở: làm tiếp lô mới
      sum.more = !!r.more;
      if (!r.archived || !r.more) break;
    }
    if (i >= ARCHIVE_MAX_BATCHES_) sum.more = true;
    out.push(sum);
  });
  if (out.some(function (r) { return r.archived; })) { try { archiveMonthlyCopy_(now); } catch (e) { mailAdminError_('Sao file lưu trữ lỗi', (e && e.stack) || String(e)); } }
  return out;
}

/**
 * Mỗi tháng có lưu trữ: sao một bản mỗi file lưu trữ đã có vào thư mục Releases (không tự xoá), để file lưu trữ lỡ bị xoá
 * vẫn còn bản (soát R1 M3). 1 lần mỗi tháng (Script Property ARCH_COPY_<yyyyMM>).
 */
function archiveMonthlyCopy_(now) {
  var props = props_(), key = 'ARCH_COPY_' + Utilities.formatDate(now, APP.TIMEZONE, 'yyyyMM');
  if (props.getProperty(key)) return 0;
  var n = 0, all = props.getProperties(), folder = releasesFolder_();
  Object.keys(all).filter(function (k) { return k.indexOf('ARCH_FILE_' + getEnv_() + '_') === 0; }).forEach(function (k) {
    DriveApp.getFileById(all[k]).makeCopy(archiveFileName_(k.split('_').pop()) + ' · bản sao ' + Utilities.formatDate(now, APP.TIMEZONE, 'yyyyMMdd'), folder); n++;
  });
  props.setProperty(key, '1');
  return n;
}

/**
 * Gọi từ hourlyJob: 1 lần mỗi ngày từ ARCHIVE_HOUR. Không chạy khi:
 *   ARCHIVE_ENABLED FALSE; đang bảo trì (admin có thể đang sửa tay, soát R1 M2); bản sao DB đêm nay chưa xong
 *   (nightlyBackup chưa ghi nhịp trong 26 giờ: không chuyển dòng khi chưa có bản sao mới).
 */
function archiveIfDue_(now) {
  if (!cfg_('ARCHIVE_ENABLED')) return null;
  var hour = Number(cfg_('ARCHIVE_HOUR')), key = 'DONE_ARCHIVE_' + dateKey_(now), props = props_();
  if (hour < 0 || now.getHours() < hour || props.getProperty(key)) return null;
  if (maintMode_() !== 'OFF') return { skipped: 'MAINTENANCE' };
  // Bản sao DB của ĐÊM NAY (giờ thật, job 02:00) phải XONG (có file) trước khi chuyển dòng đi. Không dùng nhịp tim:
  // job bỏ lượt vì bận vẫn ghi nhịp mà chưa có file (soát R3 N3).
  var hb = Number(props.getProperty('BACKUP_OK_AT') || 0), rn = new Date(realNowMs_());
  if (!hb || hb < new Date(rn.getFullYear(), rn.getMonth(), rn.getDate()).getTime()) return { skipped: 'NO_BACKUP' };
  var res = runArchive_();
  if (!res.some(function (r) { return r.error || r.skipped || r.more; })) props.setProperty(key, '1');
  return res;
}

/** Tình trạng: số dòng mỗi tab, số dòng sẽ được chuyển ở lượt tới, file lưu trữ đã có. Chỉ đọc. */
function archiveStatus_() {
  var now = getNow_(), cut = archiveCutoffs_(now), spMap = {}, props = props_();
  table_('STUDENT_PACKAGES').all().forEach(function (sp) { spMap[String(sp.sp_id)] = sp; });
  var tabs = ARCHIVE_TABS_.filter(archiveTabExists_).map(function (tab) {
    var rows = table_(tab).all();
    return { tab: tab, rows: rows.length, eligible: archiveEligible_(tab, rows, { cut: cut, sps: spMap }).length, open: !!props.getProperty('ARCH_OPEN_' + tab) };
  });
  var files = Object.keys(props.getProperties()).filter(function (k) { return k.indexOf('ARCH_FILE_' + getEnv_() + '_') === 0; }).sort()
    .map(function (k) { return { year: k.split('_').pop(), id: props.getProperty(k) }; });
  return { enabled: !!cfg_('ARCHIVE_ENABLED'), cutMain: cut.main, cutLog: cut.log, cutActivity: cut.activity, tabs: tabs, files: files };
}

function menuArchiveStatus(e) { requireOperator_(e);
  var s = archiveStatus_();
  var lines = ['Bật: ' + (s.enabled ? 'có' : 'KHÔNG (ARCHIVE_ENABLED)'), 'Chuyển dòng trước ' + fmtDate_(s.cutMain) + ' (BOOKINGS, AVAILABILITY), trước ' + fmtDate_(s.cutLog) + ' (nhật ký, email, thông báo, METRICS: giữ ' + logKeepDays_() + ' ngày)', ''];
  s.tabs.forEach(function (x) { lines.push(x.tab + ': ' + x.rows + ' dòng, ' + x.eligible + ' sẽ chuyển' + (x.open ? ' (CÓ LÔ DỞ, lượt sau tự hoàn tất)' : '')); });
  lines.push('', s.files.length ? 'File lưu trữ: ' + s.files.map(function (f) { return f.year + ' https://docs.google.com/spreadsheets/d/' + f.id; }).join('\n') : 'Chưa có file lưu trữ.');
  alert_('Lưu trữ (' + APP.VERSION + ')\n\n' + lines.join('\n'));
  return s;
}

function menuArchiveNow(e) { requireOperator_(e);
  if (!isOwnerUser_()) { alert_('Chỉ chủ file chạy được lưu trữ thủ công.'); return null; }
  if (maintMode_() !== 'OFF') { alert_('Đang bảo trì: tắt bảo trì (và không sửa tay tab nào) rồi chạy lại.'); return null; }
  var res = runArchive_({ force: true });
  alert_('Lưu trữ xong:\n\n' + res.map(function (r) { return r.tab + ': ' + (r.error ? 'LỖI ' + r.error : r.archived + ' dòng' + (r.year ? ' sang file năm ' + r.year : '') + (r.recovered ? ' (có hoàn tất lô dở)' : '') + (r.more ? ', CÒN DÒNG (hết thời gian): bấm lại hoặc chờ giờ sau' : '')); }).join('\n'));
  return res;
}

/** 5K: menu "Lưu trữ: mở file": link từng file lưu trữ (chép link mở trong trình duyệt). */
function menuArchiveFiles(e) { requireOperator_(e);
  var s = archiveStatus_();
  alert_(s.files.length ? 'File lưu trữ (' + getEnv_() + '):\n\n' + s.files.map(function (f) { return archiveFileName_(f.year) + '\nhttps://docs.google.com/spreadsheets/d/' + f.id; }).join('\n\n') : 'Chưa có file lưu trữ nào (lưu trữ chưa chuyển dòng nào).');
  return s.files;
}

// ── Assign.gs ──
/**
 * Assign.gs · Gán tutor, viết thành hàm thuần (v8, câu 18)
 *
 * Luật (đổi ở chunk 5A theo yêu cầu anh Chris, thay cho chọn ngẫu nhiên): trong các tutor còn trống ở (ngày, slot),
 * lấy nhóm có ít buổi nhất trong tuần chứa ngày đó (thứ Hai đến Chủ nhật), rồi xoay vòng: chọn người lâu nhất
 * chưa được giao buổi mới (thời điểm tạo booking gần nhất của tutor đó cũ nhất; chưa từng được giao thì ưu tiên trước).
 * Hoà nhau nữa thì theo mã tutor. Kết quả cố định, không phụ thuộc may rủi.
 */

/**
 * Danh sách tutor ứng viên kèm số buổi trong tuần.
 * tutors:        dòng USERS role TUTOR
 * availability:  dòng AVAILABILITY
 * bookings:      dòng BOOKINGS (mọi học viên)
 * excludeIds:    tutor không được chọn (ví dụ tutor vừa được duyệt huỷ slot)
 */
function buildTutorCandidates_(date, slot, tutors, availability, bookings, excludeIds) {
  var ex = excludeIds || [];
  var mon = mondayOf_(date), sun = addDays_(mon, 6);
  var open = {};
  availability.forEach(function (a) {
    if (a.status === AVAIL_STATUS.OPEN && a.date && sameDate_(a.date, date) && a.slot === slot) open[a.tutor_id] = true;
  });
  var busy = {}, load = {}, last = {};
  bookings.forEach(function (b) {
    if (b.created_at) { var tc = new Date(b.created_at).getTime(); if (!isNaN(tc) && (!(b.tutor_id in last) || tc > last[b.tutor_id])) last[b.tutor_id] = tc; }
    if (!b.date || !isHolding_(b.status)) return;
    if (sameDate_(b.date, date) && b.slot === slot) busy[b.tutor_id] = true;
    if (isConsuming_(b.status) && b.date >= mon && b.date <= sun) load[b.tutor_id] = (load[b.tutor_id] || 0) + 1;
  });
  return tutors
    .filter(function (t) {
      return t.role === 'TUTOR' && t.status === USER_STATUS.ACTIVE && open[t.user_id] && !busy[t.user_id] && ex.indexOf(t.user_id) === -1;
    })
    .map(function (t) { return { tutor_id: t.user_id, load: load[t.user_id] || 0, last: t.user_id in last ? last[t.user_id] : -1 }; });
}

/** Chọn một tutor: nhóm ít buổi nhất tuần, trong nhóm xoay vòng theo lần được giao gần nhất. Trả tutor_id hoặc null. */
function pickTutor_(candidates) {
  if (!candidates.length) return null;
  var min = Math.min.apply(null, candidates.map(function (c) { return c.load; }));
  var group = candidates.filter(function (c) { return c.load === min; });
  group.sort(function (a, b) {
    var la = a.last === undefined ? -1 : a.last, lb = b.last === undefined ? -1 : b.last;
    return la !== lb ? la - lb : (a.tutor_id < b.tutor_id ? -1 : a.tutor_id > b.tutor_id ? 1 : 0);
  });
  return group[0].tutor_id;
}

// ── Auth.gs ──
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

// ── Availability.gs ──
/**
 * Availability.gs · Lịch rảnh của tutor và quy trình xin huỷ (v8, plan mục 4.5, câu 21, 22, brief mục 9)
 */

/** Booking đang giữ slot (tutor, ngày, slot), hoặc null. */
function bookingAtSlot_(tutorId, date, slot) {
  return table_('BOOKINGS').find(function (b) {
    return b.tutor_id === tutorId && sameDate_(b.date, date) && b.slot === slot &&
      (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN);
  });
}
function availRow_(tutorId, date, slot) {
  return table_('AVAILABILITY').find(function (a) { return a.tutor_id === tutorId && sameDate_(a.date, date) && a.slot === slot; });
}

/**
 * Tutor bật hoặc tắt slot.
 * changes: [{ date: 'yyyy-MM-dd', slot: 'HH:mm', open: true | false }]
 * Trả từng dòng { date, slot, ok, state, reason } với state: OPEN, CANCELLED, CANCEL_PENDING, UNCHANGED.
 */
function setAvailabilityFor_(tutorId, changes, actor) {
  if (!Array.isArray(changes) || !changes.length) throw new Error('Không có thay đổi lịch rảnh.');
  if (changes.length > 7 * 32 * 2) throw new Error('Quá nhiều thay đổi trong một lần gửi.');
  return withLock_(function () {
    var tutor = userById_(tutorId);
    if (!tutor || tutor.role !== 'TUTOR' || tutor.status !== USER_STATUS.ACTIVE) throw new Error('Tài khoản tutor không hợp lệ: ' + tutorId);
    var now = getNow_(), today = toMidnight_(now), t = table_('AVAILABILITY'), out = [], pendingMails = [];
    changes.forEach(function (c) {
      var date = parseDateKey_(c.date), slot = String(c.slot || '');
      var res = { date: c.date, slot: slot, ok: false };
      if (!date || !isValidSlot_(slot)) { res.reason = REASONS.INVALID_INPUT; out.push(res); return; }
      if (slotStart_(date, slot) <= now || date < today) { res.reason = REASONS.DEADLINE; out.push(res); return; }
      if (date > addDays_(today, cfg_('BOOKING_HORIZON_DAYS'))) { res.reason = REASONS.TOO_FAR; out.push(res); return; }
      var row = availRow_(tutorId, date, slot);
      if (row && row.status === AVAIL_STATUS.BLOCKED) { res.reason = REASONS.SLOT_BLOCKED; out.push(res); return; }
      if (c.open) {
        // Thêm slot: luôn được, kể cả sau hạn (câu 22). Tutor bật lại slot đang chờ huỷ = rút yêu cầu.
        if (row && row.status === AVAIL_STATUS.OPEN) { res.ok = true; res.state = 'UNCHANGED'; out.push(res); return; }
        if (row) t.update(row, { status: AVAIL_STATUS.OPEN, admin_decision: '', cancel_requested_at: '' });
        else row = t.insert({ avail_id: nextId_('AVAILABILITY'), tutor_id: tutorId, date: date, slot: slot, status: AVAIL_STATUS.OPEN, created_at: now });
        logActivity_(actor, 'AVAIL_OPEN', 'AVAILABILITY', row.avail_id, c.date + ' ' + slot);
        res.ok = true; res.state = AVAIL_STATUS.OPEN; out.push(res); return;
      }
      if (!row || row.status !== AVAIL_STATUS.OPEN) { res.ok = true; res.state = 'UNCHANGED'; out.push(res); return; }
      var booking = bookingAtSlot_(tutorId, date, slot);
      var afterDeadline = !(now < tutorWeekDeadline_(date));
      if (!booking && !afterDeadline) {
        t.update(row, { status: AVAIL_STATUS.CANCELLED });
        logActivity_(actor, 'AVAIL_CLOSE', 'AVAILABILITY', row.avail_id, c.date + ' ' + slot);
        res.ok = true; res.state = AVAIL_STATUS.CANCELLED; out.push(res); return;
      }
      // Sau hạn hoặc đã có học viên: chờ admin duyệt (brief mục 9 trường hợp B).
      t.update(row, { status: AVAIL_STATUS.CANCEL_PENDING, cancel_requested_at: now, admin_decision: ADMIN_DECISION.PENDING });
      logActivity_(actor, 'AVAIL_CANCEL_REQUEST', 'AVAILABILITY', row.avail_id, { date: c.date, slot: slot, booking: booking ? booking.booking_id : '' });
      pendingMails.push({ row: row, booking: booking });
      res.ok = true; res.state = AVAIL_STATUS.CANCEL_PENDING; out.push(res);
    });
    pendingMails.forEach(function (p) {
      var stu = p.booking ? userById_(p.booking.student_id) : null;
      notify_('TUTOR_CANCEL_REQUEST', { actor: actor, tutor_id: tutorId, student_id: p.booking ? p.booking.student_id : '', entity: 'AVAILABILITY', entity_id: p.row.avail_id, link: rowLink_('AVAILABILITY', p.row._row),
        message: tutor.name + ' xin huỷ ' + fmtDayVi_(p.row.date) + ' ' + p.row.slot + (stu ? ' (đã có học viên ' + stu.name + ')' : ' (chưa có học viên)'),
        message_en: tutor.name + ' asks to cancel ' + fmtDayEn_(p.row.date) + ' ' + p.row.slot + (stu ? ' (student booked: ' + stu.name + ')' : ' (no student yet)') },
        function () { return mailAdminTutorCancelRequest_(tutor, p.row, p.booking, stu); });
    });
    return out;
  });
}

/**
 * Admin quyết định yêu cầu huỷ của tutor (dropdown ở tab AVAILABILITY, nối ở chunk 3).
 * decision: ADMIN_DECISION.APPROVE hoặc REJECT. Trả { ok, outcome } với outcome: REASSIGNED, CANCELLED_TUTOR, SLOT_CANCELLED, REJECTED.
 */
function decideTutorCancel_(availId, decision, actor) {
  return withLock_(function () { return decideTutorCancelInLock_(availId, decision, actor); });
}

/**
 * Admin quyết định yêu cầu huỷ slot của tutor (chunk 5B: 4 lựa chọn, cột outcome ghi kết quả).
 *   'Duyệt, tự chọn tutor thay' (hoặc 'Duyệt' cũ): khoá slot, hệ thống chọn tutor thay; không ai trống thì huỷ buổi.
 *   'Duyệt, chỉ định tutor thay': lấy mã tutor ở cột admin_note; tutor đó không trống thì giữ nguyên "Chờ duyệt" và báo lý do.
 *   'Duyệt, huỷ buổi': khoá slot, huỷ buổi (học viên không bị trừ buổi), báo học viên.
 *   'Từ chối': slot mở lại, tutor vẫn dạy.
 * Slot chưa có học viên thì mọi kiểu "Duyệt" đều là huỷ slot.
 */
function decideTutorCancelInLock_(availId, decision, actor) {
  var t = table_('AVAILABILITY'), row = t.byId(availId);
  if (!row) return { ok: false, reason: REASONS.NOT_FOUND };
  if (row.status !== AVAIL_STATUS.CANCEL_PENDING) return { ok: false, reason: REASONS.INVALID_INPUT };
  var D = TUTOR_CANCEL_DECISION;
  if (decision === ADMIN_DECISION.APPROVE) decision = D.AUTO;
  if ([D.AUTO, D.ASSIGN, D.CANCEL, D.REJECT].indexOf(decision) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  var now = getNow_(), tutor = userById_(row.tutor_id), booking = bookingAtSlot_(row.tutor_id, row.date, row.slot);
  var done = function (status, outcome) {
    t.update(row, { status: status, admin_decision: decision, decided_at: now, decided_by: actor, outcome: outcome + ' · ' + fmtDateTime_(now) });
  };

  if (decision === D.REJECT) {
    done(AVAIL_STATUS.OPEN, 'Từ chối, tutor vẫn dạy');
    logActivity_(actor, 'AVAIL_CANCEL_REJECTED', 'AVAILABILITY', availId, '');
    afterLock_(function () { mailTutorDecision_(tutor, row, false); });
    return { ok: true, outcome: 'REJECTED' };
  }
  if (!booking) {
    done(AVAIL_STATUS.CANCELLED, 'Đã huỷ slot (chưa có học viên)');
    logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, '');
    afterLock_(function () { mailTutorDecision_(tutor, row, true); });
    return { ok: true, outcome: 'SLOT_CANCELLED' };
  }
  if (decision === D.ASSIGN) {
    var want = String(row.admin_note || '').trim().toUpperCase().match(/T\d+/);
    if (!want) { t.update(row, { admin_decision: D.PENDING, outcome: 'Chưa chỉ định: ghi mã tutor (ví dụ T002) ở cột admin_note rồi chọn lại' }); return { ok: false, reason: REASONS.INVALID_INPUT }; }
    var r = reassignBookingInLock_(booking, [row.tutor_id], actor, 'TUTOR', want[0]);
    if (!r.ok) { t.update(row, { admin_decision: D.PENDING, outcome: 'Không chỉ định được ' + want[0] + ': tutor này không mở hoặc đã bận giờ đó · ' + fmtDateTime_(now) }); return r; }
    done(AVAIL_STATUS.BLOCKED, 'Đã đổi sang ' + want[0] + ' (admin chỉ định)');
    logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, 'BLOCKED, giao ' + want[0]);
    return r;
  }
  // Slot đang có học viên mà duyệt huỷ: tutor bận giờ đó, khoá hẳn (BLOCKED), không ai đặt hay tự mở lại được.
  if (decision === D.CANCEL) {
    done(AVAIL_STATUS.BLOCKED, 'Đã huỷ buổi ' + booking.booking_id + ', học viên không bị trừ buổi');
    logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, JSON.stringify({ status: 'BLOCKED', booking: 'CANCELLED' }));
    cancelBookingInternal_(booking, BOOKING_STATUS.CANCELLED_TUTOR, actor, 'Tutor huỷ, admin chọn không dạy thay', 'TUTOR');
    afterLock_(function () { mailTutorDecision_(tutor, row, true); });
    return { ok: true, outcome: 'CANCELLED_TUTOR' };
  }
  done(AVAIL_STATUS.BLOCKED, 'Đang tìm tutor thay');
  logActivity_(actor, 'AVAIL_CANCEL_APPROVED', 'AVAILABILITY', availId, 'BLOCKED');
  var out = reassignBookingInLock_(booking, [row.tutor_id], actor, 'TUTOR', null);
  t.update(row, { outcome: (out.outcome === 'REASSIGNED' ? 'Đã đổi sang ' + out.tutorId + ' (tự chọn)' : 'Không có tutor trống: đã huỷ buổi, học viên không bị trừ buổi') + ' · ' + fmtDateTime_(now) });
  return out;
}

/**
 * Gán lại tutor cho một booking (dùng khi duyệt huỷ của tutor, và khi admin đổi tutor ở chunk 3).
 * forcedTutorId: admin chỉ định tutor cụ thể (bỏ qua luật chọn ngẫu nhiên nhưng vẫn kiểm tra tutor đó rảnh).
 * Không có ai thay: huỷ booking với trạng thái CANCELLED_TUTOR, hoàn buổi nếu là Trial hoặc gói cũ (câu 19).
 */
function reassignBookingInLock_(booking, excludeIds, actor, cause, forcedTutorId) {
  var tb = table_('BOOKINGS'), oldTutor = userById_(booking.tutor_id), student = userById_(booking.student_id);
  tb.update(booking, { status: BOOKING_STATUS.PENDING_REASSIGN });
  var cands = buildTutorCandidates_(booking.date, booking.slot, activeTutors_(), table_('AVAILABILITY').all(),
    tb.all().filter(function (b) { return b.booking_id !== booking.booking_id; }), excludeIds);
  var newId = forcedTutorId ? (cands.some(function (c) { return c.tutor_id === forcedTutorId; }) ? forcedTutorId : null) : pickTutor_(cands);
  if (!newId) {
    if (forcedTutorId) { tb.update(booking, { status: BOOKING_STATUS.CONFIRMED }); return { ok: false, reason: REASONS.NO_TUTOR }; }
    // 5L (soát): khoá tutor: lý do riêng, không gửi thư huỷ cho tutor bị khoá.
    if (cause === 'LOCK') cancelBookingInternal_(booking, BOOKING_STATUS.CANCELLED_TUTOR, actor, 'Tutor nghỉ, không có tutor thay', 'TUTOR_LOCK');
    else cancelBookingInternal_(booking, BOOKING_STATUS.CANCELLED_TUTOR, actor, 'Tutor huỷ, không có tutor thay', 'TUTOR');
    if (cause === 'TUTOR') afterLock_(function () { mailTutorDecision_(oldTutor, { date: booking.date, slot: booking.slot }, true); });
    return { ok: true, outcome: 'CANCELLED_TUTOR' };
  }
  var newTutor = userById_(newId);
  // Chunk 5F (soát R1 T1): trong khoá chỉ ghi tutor mới. Vá sự kiện Calendar (khách mời, tiêu đề) và gửi email sau khi nhả khoá;
  // vá lỗi thì hàng đợi vá lại (cal_state RESYNC). Phòng Meet AUTO giữ nguyên link; TUTOR_ROOM dùng phòng của tutor mới.
  var link = cfg_('MEET_MODE') === 'TUTOR_ROOM' ? (newTutor.meet_room || '') : booking.meet_link;
  tb.update(booking, { tutor_id: newId, status: BOOKING_STATUS.CONFIRMED, meet_link: link });
  calendarOnReassign_(booking);
  logActivity_(actor, 'REASSIGNED', 'BOOKING', booking.booking_id, { from: oldTutor.user_id, to: newId });
  afterLock_(function () { mailReassigned_(booking, student, oldTutor, newTutor, { skipOld: cause === 'LOCK' }); });   // 5L: khoá tutor thì không thư cho tutor bị khoá
  notify_('REASSIGNED', { actor: actor, student_id: booking.student_id, tutor_id: newId, entity: 'BOOKING', entity_id: booking.booking_id, link: rowLink_('BOOKINGS', booking._row),
    message: 'Buổi ' + fmtDayVi_(booking.date) + ' ' + booking.slot + ' của ' + student.name + ': ' + oldTutor.name + ' sang ' + newTutor.name,
    message_en: 'Lesson ' + fmtDayEn_(booking.date) + ' ' + booking.slot + ' of ' + student.name + ': ' + oldTutor.name + ' to ' + newTutor.name });
  return { ok: true, outcome: 'REASSIGNED', tutorId: newId };
}

/** Lịch rảnh của chính tutor trong khoảng ngày (cho cổng tutor). */
function availabilityFor_(tutorId, fromKey, days) {
  var start = parseDateKey_(fromKey), end = addDays_(start, (days || 14) - 1), out = [];
  table_('AVAILABILITY').filter(function (a) { return a.tutor_id === tutorId && a.date >= start && a.date <= end && a.status !== AVAIL_STATUS.CANCELLED; })
    .forEach(function (a) {
      var b = bookingAtSlot_(tutorId, a.date, a.slot);
      out.push({ date: dateKey_(a.date), slot: a.slot, status: a.status, booked: !!b });
    });
  return out;
}

// ── Backup.gs ──
/**
 * Backup.gs · Sao lưu (v8, plan mục 7, checklist B27, B28)
 *
 * Ba lớp: lịch sử phiên bản của Sheets (Google tự giữ), bản sao file DB mỗi đêm (giữ BACKUP_KEEP bản),
 * CSV mỗi tuần vào thư mục Export (chia sẻ cho tài khoản dự phòng).
 */

function nightlyBackup(e) { requireOperator_(e);
  return runJob_('nightlyBackup', function () {
    var name = backupDbCopy_('BACKUP');
    // Mốc "đã có bản sao" (giờ thật): lưu trữ hằng tháng và trang health dựa vào mốc này, không dựa vào nhịp tim (chunk 5G).
    props_().setProperty('BACKUP_OK_AT', String(realNowMs_()));
    var removed = pruneFolder_(DriveApp.getFolderById(cfg_('BACKUP_FOLDER_ID')), cfg_('BACKUP_KEEP'));
    logMenu_(e, 'BACKUP_DONE', 'DRIVE', name, JSON.stringify({ removedOld: removed || 0 }));
    return { name: name, removed: removed };
  });
}

/** Sao một bản file DB vào thư mục sao lưu. Trả tên file. Ném lỗi nếu không sao được (người gọi quyết định có dừng không). */
function backupDbCopy_(label) {
  var folder = DriveApp.getFolderById(cfg_('BACKUP_FOLDER_ID'));
  var name = 'THAIPUT_DB_' + getEnv_() + '_' + label + '_' + Utilities.formatDate(getNow_(), APP.TIMEZONE, 'yyyyMMdd_HHmm');
  DriveApp.getFileById(getDbId_()).makeCopy(name, folder);
  return name;
}

/** Giữ lại `keep` file mới nhất trong thư mục, chuyển phần còn lại vào thùng rác (khôi phục được 30 ngày). */
function pruneFolder_(folder, keep) {
  var files = [], it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  var removed = 0;
  for (var i = keep; i < files.length; i++) { files[i].setTrashed(true); removed++; }
  return removed;
}

function csvCell_(v) {
  if (v instanceof Date) v = Utilities.formatDate(v, APP.TIMEZONE, 'yyyy-MM-dd HH:mm');
  var s = String(v === null || v === undefined ? '' : v);
  // Soát 5K L5: chữ người dùng gõ bắt đầu bằng = @ (hoặc + - kèm chữ) thành công thức khi mở CSV bằng Excel, Sheets: thêm dấu nháy.
  if (/^[=@]/.test(s) || /^[+-].*[^\d\s().+-]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Thứ Hai 03:00: xuất mỗi tab ra một file CSV (bỏ tab AUTH vì chứa mã phiên). Giữ 8 tuần. */
function weeklyExport(e) { requireOperator_(e);
  return runJob_('weeklyExport', function () {
    var folder = DriveApp.getFolderById(cfg_('EXPORT_FOLDER_ID'));
    var stamp = Utilities.formatDate(getNow_(), APP.TIMEZONE, 'yyyyMMdd'), n = 0;
    Object.keys(SCHEMA).filter(function (t) { return t !== 'AUTH'; }).forEach(function (t) {
      var sh = dbSpreadsheet_().getSheetByName(t);
      if (!sh) return;
      var csv = sh.getDataRange().getValues().map(function (r) { return r.map(csvCell_).join(','); }).join('\n');
      folder.createFile(Utilities.newBlob(csv, 'text/csv', stamp + '_' + t + '.csv'));
      n++;
    });
    pruneFolder_(folder, 8 * n);
    return n;
  });
}

// ── Booking.gs ──
/**
 * Booking.gs · Đặt và huỷ buổi học (v8, plan mục 4.2, 4.4)
 *
 * Hàm có hậu tố For_ nhận student_id ĐÃ XÁC THỰC từ phiên (Api.gs, chunk 3).
 * Không bao giờ nhận student_id từ trình duyệt (CLAUDE.md luật 6).
 */

// ── Truy vấn dùng chung cho các dịch vụ ──

function pkgDefs_() {
  var out = {};
  table_('PACKAGES').all().forEach(function (p) {
    out[p.code] = { code: p.code, name: p.name, name_en: String(p.name_en || '').trim() || p.name, type: String(p.type || 'DAYS').toUpperCase(), days: Number(p.days || 0), sessions: Number(p.sessions || 0), price_vnd: Number(p.price_vnd || 0), active: coerceCfg_(p.active, true) };
  });
  return out;
}
function userById_(id) { return table_('USERS').byId(id); }
function userByEmail_(email) {
  var e = String(email || '').trim().toLowerCase();
  return table_('USERS').find(function (u) { return String(u.email).trim().toLowerCase() === e; });
}
function studentPackages_(sid) { return table_('STUDENT_PACKAGES').filter(function (s) { return s.student_id === sid; }); }
function studentBookings_(sid) { return table_('BOOKINGS').filter(function (b) { return b.student_id === sid; }); }
function activeTutors_() { return table_('USERS').filter(function (u) { return u.role === 'TUTOR'; }); }

/**
 * Sau mỗi thay đổi buổi: tính lại ngày bắt đầu, hạn, ngày bù của các gói theo ngày (chunk 1 quyết định 2; chunk 5M).
 * Đã chạy menu 1 của 8.1.0 (đủ cột mới): luật khoá ngày bắt đầu và bù ngày (Compensation.gs). Chưa: luật cũ 8.0.10.
 * Trả danh sách thay đổi (chỉ khi dùng luật mới).
 */
function recomputeStudentPackages_(sid, actor, opts) {
  if (pkgCompReady_()) return recomputeCompFor_(sid, actor, opts);
  var defs = pkgDefs_(), bks = studentBookings_(sid), t = table_('STUDENT_PACKAGES');
  studentPackages_(sid).forEach(function (sp) {
    var def = defs[sp.package_code];
    if (!def) return;
    var patch = pkgRecomputeAfterChange_(sp, def, bks);
    if (patch) {
      t.update(sp, patch);
      logActivity_(actor, 'PACKAGE_RECOMPUTED', 'STUDENT_PACKAGE', sp.sp_id, { status: patch.status, start: patch.start_date ? dateKey_(patch.start_date) : '', end: patch.end_date ? dateKey_(patch.end_date) : '' });
    }
  });
  return [];
}

/** Kiểm tra trạng thái tài khoản học viên trước khi đặt. */
function studentAccountReason_(user) {
  if (!user || user.role !== 'STUDENT') return REASONS.FORBIDDEN;
  if (user.status === USER_STATUS.SUSPENDED) return REASONS.SUSPENDED;
  if (user.status !== USER_STATUS.ACTIVE) return REASONS.NOT_ACTIVE;
  return null;
}

// ── Đặt ──

/**
 * Đặt một hoặc nhiều buổi trong một lần gửi.
 * requests: [{ date: 'yyyy-MM-dd', slot: 'HH:mm' }]
 * Trả: [{ date, slot, ok, reason, tutorName, meetLink, bookingId }]
 */
function bookSessionsFor_(studentId, requests, actor, opts) {
  // opts.override (admin đặt thay, chunk 5E): bỏ qua hạn đặt và BOOKING_ENABLED, chỉ cần slot chưa bắt đầu;
  // vẫn giữ 1 buổi/ngày, hạn gói, slot BLOCKED và trùng giờ. Mỗi yêu cầu có thể chỉ định tutorId.
  // opts.requestId (chunk 5F): mã chống gửi trùng do trình duyệt sinh. Gửi lại cùng mã (mạng chập chờn, tự thử lại)
  // thì trả lại đúng các buổi đã đặt lần trước, không đặt thêm.
  opts = opts || {};
  var override = !!opts.override, rid = validRequestId_(opts.requestId);
  if (!Array.isArray(requests) || !requests.length) throw new Error('Không có buổi nào để đặt.');
  if (requests.length > 14) throw new Error('Mỗi lần đặt tối đa 14 buổi.');
  // Chịu tải (chunk 5B, 5F): trong khoá chỉ kiểm tra luật và ghi dòng (BOOKINGS, nhật ký, thông báo): một lần lấy khoá.
  // Calendar (chỉ buổi gấp) và email làm sau khi nhả khoá (afterLock_); mã sự kiện ghi trong một khoá ngắn cuối (deferWrite_).
  // Lỗi ở pha sau khoá không bao giờ biến kết quả đã ghi thành "thất bại".
  var phase = withLock_(function () {
    var tb = table_('BOOKINGS');
    if (rid) {
      var prev = tb.filter(function (b) { return b.request_id === rid && b.student_id === studentId; });
      if (prev.length) return { replay: prev.map(function (b) { var tu = userById_(b.tutor_id) || {}; return { date: dateKey_(b.date), slot: b.slot, ok: true, reason: REASONS.OK, bookingId: b.booking_id, tutorName: tu.name || '', meetLink: b.meet_link || '', replay: true }; }) };
    }
    var student = userById_(studentId);
    var accountReason = studentAccountReason_(student);
    if (!cfg_('BOOKING_ENABLED') && !override) accountReason = REASONS.DISABLED;
    var reqs = requests.map(function (r) { return { date: String((r && r.date) || ''), slot: String((r && r.slot) || ''), tutorId: override && r && r.tutorId ? String(r.tutorId) : '' }; })
      .sort(function (a, b) { return (a.date + a.slot) < (b.date + b.slot) ? -1 : 1; });
    if (accountReason) return reqs.map(function (r) { return { date: r.date, slot: r.slot, ok: false, reason: accountReason }; }); // mảng: không có pha sau khoá

    var now = getNow_(), defs = pkgDefs_(), sps = studentPackages_(studentId);
    var tutors = activeTutors_(), usersById = {};
    table_('USERS').all().forEach(function (u) { usersById[u.user_id] = u; });
    var avail = table_('AVAILABILITY').all();
    // Buổi vừa chấp nhận trong cùng lần gửi đã nằm trong bảng (insert cập nhật cache), nên đếm 1 buổi/ngày
    // và số buổi của gói tự tính cả chúng; không cần cộng thêm.
    var results = [], byTutor = {}, accepted = [];
    var maxPerDay = cfg_('MAX_BOOKINGS_PER_DAY');
    // Một lần gửi chọn nhiều slot hơn mức cho phép trong cùng một ngày: từ chối cả ngày đó (C21),
    // vì không biết học viên muốn giữ slot nào. Trang web cũng chặn từ trước.
    var perDayInRequest = {};
    reqs.forEach(function (r) { perDayInRequest[r.date] = (perDayInRequest[r.date] || 0) + 1; });

    reqs.forEach(function (r) {
      var res = { date: r.date, slot: r.slot, ok: false };
      var date = parseDateKey_(r.date);
      if (!date) { res.reason = REASONS.INVALID_INPUT; results.push(res); return; }
      if (!override && !(now < bookingDeadline_(date)) && bookingLeadHours_() < 0) { res.reason = REASONS.DEADLINE; results.push(res); return; }
      if (date > addDays_(toMidnight_(now), cfg_('BOOKING_HORIZON_DAYS'))) { res.reason = REASONS.TOO_FAR; results.push(res); return; }
      if (!isValidSlot_(r.slot)) { res.reason = REASONS.INVALID_SLOT; results.push(res); return; }
      if (override ? !(now < slotStart_(date, r.slot)) : !(now < bookingDeadlineFor_(date, r.slot))) { res.reason = REASONS.DEADLINE; results.push(res); return; }
      if (perDayInRequest[r.date] > maxPerDay) { res.reason = REASONS.ONE_PER_DAY; results.push(res); return; }

      var mine = tb.filter(function (b) { return b.student_id === studentId && bookingDeducts_(b) && sameDate_(b.date, date); }).length;
      if (mine >= maxPerDay) { res.reason = REASONS.ONE_PER_DAY; results.push(res); return; }

      var pk = resolvePackageForDate_(sps, defs, studentBookings_(studentId), date, {});
      if (!pk.ok) { res.reason = pk.reason; results.push(res); return; }

      var cands = buildTutorCandidates_(date, r.slot, tutors, avail, tb.all(), []);
      var tutorId = r.tutorId ? (cands.some(function (c) { return c.tutor_id === r.tutorId; }) ? r.tutorId : null) : pickTutor_(cands);
      if (!tutorId) { res.reason = REASONS.NO_TUTOR; results.push(res); return; }
      var tutor = usersById[tutorId];

      var booking = tb.insert({
        booking_id: nextId_('BOOKINGS'), student_id: studentId, tutor_id: tutorId, sp_id: pk.sp.sp_id,
        // created_at cắt về giây (soát R2 L8): mã sự kiện cố định băm theo giây, bản trong bộ nhớ và bản đọc lại phải giống nhau.
        date: date, slot: r.slot, status: BOOKING_STATUS.CONFIRMED, created_at: new Date(Math.floor(now.getTime() / 1000) * 1000), payroll_override: false, request_id: rid || '', tech_fault: ''
      });
      logActivity_(actor, 'BOOKED', 'BOOKING', booking.booking_id, { student: studentId, tutor: tutorId, date: r.date, slot: r.slot });

      res.ok = true; res.reason = REASONS.OK; res.bookingId = booking.booking_id; res.tutorName = tutor.name; res.meetLink = '';
      res._booking = booking; res._tutor = tutor;
      (byTutor[tutorId] = byTutor[tutorId] || []).push({ booking: booking, student: student });
      accepted.push(res);
      results.push(res);
    });
    if (!accepted.length) return { results: results };

    recomputeStudentPackages_(studentId, actor);
    // Một thông báo cho cả lần đặt (không mỗi buổi một dòng), ghi ngay trong khoá này (không lấy khoá thêm).
    notify_('BOOKED', { actor: actor, student_id: studentId, tutor_id: accepted.map(function (r) { return r._booking.tutor_id; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(','),
      entity: 'BOOKING', entity_id: accepted.map(function (r) { return r.bookingId; }).join(','),
      message: (override ? 'Admin ' + actor + ' đặt thay ' + student.name + ' ' : student.name + ' đặt ') + accepted.length + ' buổi: ' + accepted.map(function (r) { return fmtDayVi_(parseDateKey_(r.date)) + ' ' + r.slot + ' (' + r.tutorName + ')'; }).join(', '),
      message_en: (override ? 'Admin ' + actor + ' booked for ' + student.name + ' ' : student.name + ' booked ') + accepted.length + ' lesson(s): ' + accepted.map(function (r) { return fmtDayEn_(parseDateKey_(r.date)) + ' ' + r.slot + ' (' + r.tutorName + ')'; }).join(', ') });
    // Calendar: buổi gấp tạo ngay sau khi nhả khoá; buổi khác chờ hàng đợi (CalendarQueue.gs).
    var urgent = calendarOnBooked_(accepted.map(function (r) { return r._booking; }), now);
    afterLock_(function () {
      var outs = calendarCreateEvents_(urgent.map(function (b) { return { b: b, student: student, tutor: usersById[b.tutor_id] }; }));
      outs.forEach(function (o) {
        if (!o.ev) return;
        accepted.forEach(function (r) { if (r.bookingId === o.id) { r.meetLink = o.ev.meetLink; r._booking.meet_link = o.ev.meetLink; } });
      });
      if (outs.length) deferWrite_(function () { calendarApplyOutcomes_(outs); if (outs.some(function (o) { return o.err; })) calendarHint_(getNow_().getTime()); });
    });
    // Email gộp cho học viên và cho từng tutor (có link Meet nếu sự kiện vừa tạo; không thì ghi link sẽ đến cùng lời mời lịch).
    afterLock_(function () { mailBookingSummary_(student, results); });
    afterLock_(function () { Object.keys(byTutor).forEach(function (tid) { try { mailTutorNewLessons_(usersById[tid], byTutor[tid]); } catch (e) { afterLockError_(e); } }); });
    return { results: results };
  });
  var clean = function (list) { return list.map(function (r) { var o = {}; Object.keys(r).forEach(function (k) { if (k.charAt(0) !== '_') o[k] = r[k]; }); return o; }); };
  if (Array.isArray(phase)) return phase; // lỗi tài khoản: đã là mảng kết quả
  if (phase.replay) return phase.replay;
  return clean(phase.results);
}

/** Mã chống gửi trùng hợp lệ: 8 đến 64 ký tự chữ, số, gạch dưới. Sai dạng thì bỏ qua (chạy như không có mã). */
function validRequestId_(rid) { rid = typeof rid === 'string' ? rid : ''; return /^[A-Za-z0-9_]{8,64}$/.test(rid) ? rid : ''; }

// ── Huỷ ──

/** Huỷ của học viên: chỉ booking của chính mình, trước 15:00 hôm trước (câu 12). */
function cancelBookingFor_(studentId, bookingId, actor) {
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.student_id !== studentId) {
      logActivity_(actor, 'FORBIDDEN_CANCEL_ATTEMPT', 'BOOKING', bookingId, { by: studentId, owner: b.student_id });
      return { ok: false, reason: REASONS.FORBIDDEN };
    }
    if (b.status !== BOOKING_STATUS.CONFIRMED) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (!(getNow_() < cancelDeadline_(b.date))) return { ok: false, reason: REASONS.CANCEL_DEADLINE };
    cancelBookingInternal_(b, BOOKING_STATUS.CANCELLED_STUDENT, actor, 'Học viên huỷ', 'STUDENT');
    var stu = userById_(studentId), tut = userById_(b.tutor_id);
    notify_('STUDENT_CANCELLED', { actor: actor, student_id: studentId, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: bookingId, link: rowLink_('BOOKINGS', b._row),
      message: (stu ? stu.name : studentId) + ' huỷ buổi ' + fmtDayVi_(b.date) + ' ' + b.slot + ' với ' + (tut ? tut.name : b.tutor_id),
      message_en: (stu ? stu.name : studentId) + ' cancelled ' + fmtDayEn_(b.date) + ' ' + b.slot + ' with ' + (tut ? tut.name : b.tutor_id) });
    return { ok: true, reason: REASONS.OK };
  });
}

/**
 * Huỷ dùng chung (học viên, admin, tutor không có người thay). Phải gọi bên trong withLock_.
 * Đổi trạng thái, huỷ sự kiện Calendar, tính lại gói, gửi email, ghi log.
 */
function cancelBookingInternal_(b, newStatus, actor, reason, byWhom) {
  var tb = table_('BOOKINGS');
  // Chunk 5F: Calendar và email ra khỏi khoá (soát kiến trúc F3). Gỡ sự kiện (nếu đã có) ngay sau khi nhả khoá, rồi mới gửi
  // email huỷ. Gỡ lỗi thì hàng đợi Calendar thử lại (cal_state CANCEL_PENDING).
  var calPatch = calendarOnCancel_(b);
  tb.update(b, Object.assign({ status: newStatus, cancelled_at: getNow_(), cancel_reason: reason || '' }, calPatch));
  recomputeStudentPackages_(b.student_id, actor);
  var student = userById_(b.student_id), tutor = userById_(b.tutor_id);
  afterLock_(function () { mailCancelled_(b, student, tutor, byWhom); });
  logActivity_(actor, 'CANCELLED', 'BOOKING', b.booking_id, { status: newStatus, reason: reason || '' });
}

// ── Dữ liệu cho cổng học viên (Api.gs dùng ở chunk 3) ──

/** Các slot còn đặt được trong khoảng ngày, cho trang Đặt lịch. Không lộ tên tutor (brief flow 2 bước 5). */
/**
 * Dữ liệu cho việc liệt kê slot trong [start, end): AVAILABILITY trong khoảng, BOOKINGS từ thứ Hai của tuần đầu
 * (số buổi trong tuần của tutor) tới end, cộng buổi tạo gần nhất của mỗi tutor (xoay vòng). Kết quả ứng viên giống hệt
 * khi đưa cả bảng vào buildTutorCandidates_, nhưng nhanh hơn nhiều khi bảng lớn.
 */
function slotWindowData_(start, end) {
  var from = mondayOf_(start), lastByTutor = {};
  var avail = table_('AVAILABILITY').filter(function (a) { return a.date && a.date >= start && a.date < end; });
  var all = table_('BOOKINGS').all(), bookings = [];
  all.forEach(function (b) {
    if (b.created_at) { var tc = new Date(b.created_at).getTime(); if (!isNaN(tc) && (!lastByTutor[b.tutor_id] || tc > new Date(lastByTutor[b.tutor_id].created_at).getTime())) lastByTutor[b.tutor_id] = b; }
    if (b.date && b.date >= from && b.date < addDays_(end, 7)) bookings.push(b);
  });
  Object.keys(lastByTutor).forEach(function (k) { if (bookings.indexOf(lastByTutor[k]) === -1) bookings.push(lastByTutor[k]); });
  return { avail: avail, bookings: bookings };
}

/**
 * Lưới slot còn trống, dùng chung cho mọi học viên (chunk 5F): [{ date, label, slots }]. Đệm trong CacheService
 * SLOT_CACHE_SECONDS giây theo "phiên bản slot" (tăng mỗi khi BOOKINGS hoặc AVAILABILITY đổi) và theo phút (hạn đặt).
 * Đệm cũ chỉ làm học viên thấy một slot vừa hết; đặt lịch luôn kiểm lại trong khoá và báo "hết tutor".
 */
function slotGrid_(start, days) {
  var now = getNow_(), sec = Number(cfg_('SLOT_CACHE_SECONDS')) || 0, cache = null, key = '';
  if (sec > 0) {
    try {
      cache = CacheService.getScriptCache();
      key = 'slots_' + slotsVersion_() + '_' + dateKey_(start) + '_' + days + '_' + Math.floor(now.getTime() / 60000);
      var hit = cache.get(key);
      if (hit) return JSON.parse(hit);
    } catch (e) { cache = null; }
  }
  var win = slotWindowData_(start, addDays_(start, days)), tutors = activeTutors_(), out = [];
  for (var i = 0; i < days; i++) {
    var d = addDays_(start, i);
    if (!(now < bookingDeadline_(d)) && bookingLeadHours_() < 0) continue;
    var slots = slotList_().filter(function (s) { return now < bookingDeadlineFor_(d, s) && buildTutorCandidates_(d, s, tutors, win.avail, win.bookings, []).length > 0; });
    if (slots.length) out.push({ date: dateKey_(d), label: fmtDayVi_(d), slots: slots });
  }
  if (cache) { try { cache.put(key, JSON.stringify(out), Math.min(sec, 21600)); } catch (e) { } }
  return out;
}
function slotsVersion_() { try { return CacheService.getScriptCache().get('slots_v') || '0'; } catch (e) { return '0'; } }
/** Đổi phiên bản slot: mọi bản đệm cũ hết hiệu lực. Db.gs gọi khi ghi BOOKINGS hoặc AVAILABILITY; onEdit gọi khi admin sửa tay. */
function bumpSlotsVersion_() { try { CacheService.getScriptCache().put('slots_v', String(Date.now()) + Math.floor(Math.random() * 1000), 21600); } catch (e) { } }

function availableSlotsFor_(studentId, fromKey, days) {
  var now = getNow_(), start = parseDateKey_(fromKey) || toMidnight_(now);
  days = days || 14;
  var grid = slotGrid_(start, days), mineByDay = {}, end = addDays_(start, days);
  studentBookings_(studentId).forEach(function (b) { if (bookingDeducts_(b) && b.date >= start && b.date < end) mineByDay[dateKey_(b.date)] = true; });
  return grid.map(function (g) { return { date: g.date, label: g.label, slots: g.slots, alreadyBooked: !!mineByDay[g.date] }; });
}

// ── CalendarQueue.gs ──
/**
 * CalendarQueue.gs · Hàng đợi sự kiện Calendar (chunk 5F)
 *
 * Vì sao: tạo một sự kiện Calendar có Meet tốn 1 đến 3 giây gọi Google. Làm việc đó ngay trong lượt bấm "Đặt" làm lượt chạy
 * dài, chiếm 1 trong 30 lượt chạy cùng lúc của tài khoản lâu hơn. Từ 5F: đặt lịch chỉ ghi booking (cal_state PENDING) và gửi
 * email xác nhận ngay; sự kiện Calendar do job calendarJob (mỗi 5 phút) tạo theo CALENDAR_MODE:
 *   NIGHTLY (quyết định 15/10, từ 16/10 là phương án dự phòng): gom từ CALENDAR_NIGHTLY_HOUR (23) tới hết ngày.
 *   QUEUE (mặc định từ 16/10): trong vài phút, trừ giờ yên tĩnh.
 *   INLINE: tạo ngay khi đặt (cách cũ).
 * Đường gấp ở mọi chế độ: buổi bắt đầu trong CALENDAR_MIN_LEAD_HOURS giờ tính từ lần xử lý thường kế tiếp thì tạo ngay khi đặt
 * (ví dụ admin đặt thay buổi tối nay lúc 16:00). Huỷ: gỡ sự kiện ngay sau khi nhả khoá; lỗi thì hàng đợi gỡ lại.
 *
 * cal_state: PENDING (chờ tạo) · CREATED · RESYNC (đổi tutor, chờ vá khách mời) · FAILED (thử quá CALENDAR_MAX_ATTEMPTS lần, đã báo admin) · CANCEL_PENDING (chờ gỡ) ·
 *            CANCELLED (đã gỡ) · SKIPPED (huỷ trước khi tạo, hoặc buổi đã qua mà chưa tạo) · DETACHED (chuyển tài khoản).
 * Dòng cũ (trước 5F) để trống: có event_id coi là CREATED, buổi CONFIRMED chưa có event_id coi là PENDING (tự lành).
 * Chống tạo trùng: mã sự kiện cố định theo booking (lessonEventId_), cộng giữ chỗ 10 phút trong bộ đệm cho mỗi việc đang làm.
 */

var CAL_STATE = { PENDING: 'PENDING', CREATED: 'CREATED', RESYNC: 'RESYNC', FAILED: 'FAILED', CANCEL_PENDING: 'CANCEL_PENDING', CANCELLED: 'CANCELLED', SKIPPED: 'SKIPPED', DETACHED: 'DETACHED' };
var CAL_BACKOFF_MIN_ = [5, 15, 60, 120];
var CAL_BUDGET_MS_ = 240000;          // mỗi lần chạy tối đa 4 phút (Google dừng ở 6 phút)
var CAL_HINT_KEY_ = 'cal_due_at';     // bộ đệm: thời điểm sớm nhất có việc, để job thoát ngay khi chưa tới hạn (không mở Sheets)

function isCancelledStatus_(s) { return String(s || '').indexOf('CANCELLED') === 0; }

function calState_(b) {
  var s = String(b.cal_state || '').trim().toUpperCase();
  if (s) return s;
  if (b.event_id) return isCancelledStatus_(b.status) ? CAL_STATE.CANCELLED : CAL_STATE.CREATED;
  return b.status === BOOKING_STATUS.CONFIRMED ? CAL_STATE.PENDING : '';
}

function calendarMode_() {
  var m = String(cfg_('CALENDAR_MODE') || '').trim().toUpperCase();
  return ['INLINE', 'QUEUE', 'NIGHTLY'].indexOf(m) === -1 ? 'QUEUE' : m;   // gõ sai: về mặc định QUEUE (16/10)
}
function inQuietHours_(now) {
  var f = Number(cfg_('CALENDAR_QUIET_FROM')), t = Number(cfg_('CALENDAR_QUIET_TO')), h = now.getHours();
  if (f < 0 || t < 0 || f === t) return false;
  return f > t ? (h >= f || h < t) : (h >= f && h < t);
}
/** Cửa sổ xử lý thường đang mở không. */
function calendarWindowOpen_(now) {
  var mode = calendarMode_();
  if (mode === 'INLINE') return true;
  if (mode === 'QUEUE') return !inQuietHours_(now);
  var h = Number(cfg_('CALENDAR_NIGHTLY_HOUR'));
  return h >= 0 && now.getHours() >= h;
}
/** Thời điểm (ms) cửa sổ xử lý thường mở lần tới. */
function calendarNextWindow_(now) {
  if (calendarWindowOpen_(now)) return now.getTime();
  var day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (calendarMode_() === 'QUEUE') {
    var to = Number(cfg_('CALENDAR_QUIET_TO')), end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), to);
    if (end <= now) end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, to);   // addDays_ trả nửa đêm, không dùng ở đây
    return end.getTime();
  }
  var h = Number(cfg_('CALENDAR_NIGHTLY_HOUR'));
  if (h < 0) return now.getTime() + 86400000 * 365; // tắt gom: chỉ còn đường gấp
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h).getTime();
}
/** Mốc phải có sự kiện: giờ học trừ CALENDAR_MIN_LEAD_HOURS. */
function calendarNeedBy_(b) { return slotStart_(b.date, b.slot).getTime() - Number(cfg_('CALENDAR_MIN_LEAD_HOURS')) * 3600000; }
/** Lúc đặt: chờ cửa sổ thường thì quá muộn (trừ 15 phút phòng job chạy trễ) nên tạo ngay. */
function calendarUrgent_(b, now) {
  if (calendarMode_() === 'INLINE') return true;
  return calendarNextWindow_(now) > calendarNeedBy_(b) - 15 * 60000;
}
/** Thời điểm sớm nhất job nên tạo sự kiện cho booking này. */
function calendarDueAt_(b, now) {
  var due = Math.min(calendarNextWindow_(now), calendarNeedBy_(b) - 10 * 60000);
  var next = b.cal_next_at ? new Date(b.cal_next_at).getTime() : 0;
  return Math.max(due, isNaN(next) ? 0 : next);
}
/**
 * Khi nào thư mời (link Meet) dự kiến tới, cho email xác nhận và cổng học viên, tutor (soát R2 L3). Chuỗi "HH:mm dd/MM",
 * rỗng khi đã có sự kiện hoặc không còn chờ. Thời điểm là ước lượng: job chạy mỗi 5 phút, có thể trễ vài phút.
 */
function calendarInviteWhen_(b, now) {
  if (b.event_id || b.meet_link || calState_(b) !== CAL_STATE.PENDING || b.status !== BOOKING_STATUS.CONFIRMED) return '';
  var d = new Date(Math.max(now.getTime(), calendarDueAt_(b, now)) + 5 * 60000);
  return pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()) + ' ' + pad2_(d.getDate()) + '/' + pad2_(d.getMonth() + 1);
}

/** Ghi gợi ý "có việc lúc" cho job. Gọi trong khoá (mọi nơi ghi gợi ý đều giữ khoá nên không ghi đè lẫn nhau). */
function calendarHint_(ms) {
  try {
    var c = CacheService.getScriptCache(), cur = c.get(CAL_HINT_KEY_);
    if (cur === null || ms < Number(cur)) c.put(CAL_HINT_KEY_, String(Math.floor(ms)), 21600);
    // Số lần ghi gợi ý: job so trước và sau khi chạy để biết có việc mới phát sinh trong lúc nó đang gọi Google.
    c.put('cal_hint_seq', String(Number(c.get('cal_hint_seq') || 0) + 1), 21600);
  } catch (e) { }
}
/** Chờ trước lần thử lại. NIGHTLY: ngắn (5, 10, 15, 20 phút) để lỗi được thử lại và báo trong cùng đêm (soát R2 T5). */
function calendarBackoffMs_(attempts) {
  var list = calendarMode_() === 'NIGHTLY' ? [5, 10, 15, 20] : CAL_BACKOFF_MIN_;
  return list[Math.min(list.length - 1, Math.max(0, attempts - 1))] * 60000;
}

/**
 * Ghi kết quả gọi Calendar vào BOOKINGS. Phải gọi trong withLock_.
 * outs: [{ id, kind: 'create'|'remove'|'resync'|'skip', ev?: { eventId, meetLink }, err?: Error, gone?: bool,
 *          tutorId?: tutor đã mời, premarked?: đã tăng cal_attempts trước khi gọi Google }]
 */
function calendarApplyOutcomes_(outs) {
  var t = table_('BOOKINGS'), now = getNow_(), max = Number(cfg_('CALENDAR_MAX_ATTEMPTS')) || 5, failed = [];
  outs.forEach(function (o) {
    var b = t.byId(o.id);
    if (!b) return;
    var attempts = Number(b.cal_attempts || 0);
    var fail = function (err) {
      // Việc tạo đã đánh dấu trước (premarked) thì lần thử này đã được đếm, không đếm lại.
      if (!o.premarked) attempts++;
      var patch = { cal_attempts: attempts };
      if (attempts >= max) { patch.cal_state = CAL_STATE.FAILED; patch.cal_next_at = ''; failed.push({ b: b, err: err, kind: o.kind }); }
      else patch.cal_next_at = new Date(now.getTime() + calendarBackoffMs_(attempts));
      t.update(b, patch);
      logActivity_('SYSTEM', o.kind === 'remove' ? 'CALENDAR_REMOVE_FAILED' : o.kind === 'resync' ? 'CALENDAR_PATCH_FAILED' : 'CALENDAR_CREATE_FAILED', 'BOOKING', b.booking_id, JSON.stringify({ attempt: attempts, error: String((err && err.message) || err).substring(0, 500) }));
    };
    if (o.kind === 'skip') { t.update(b, { cal_state: CAL_STATE.SKIPPED, cal_next_at: '' }); return; }
    if (o.kind === 'create') {
      if (!o.ev) return fail(o.err);
      if (o.fixedId && o.fixedId !== lessonEventId_(b)) {
        // Booking cùng mã nhưng là buổi khác (dữ liệu test vừa xoá, mã đánh lại; soát R2 L1): gỡ sự kiện vừa tạo, không gắn.
        var other = { booking_id: b.booking_id, event_id: o.ev.eventId, created_at: b.created_at };
        afterLock_(function () { try { removeLessonEvent_(other); } catch (x) { } });
        return;
      }
      if (b.event_id && b.event_id !== o.ev.eventId) {
        // Đã có sự kiện khác (lần chạy song song): gỡ sự kiện thừa vừa tạo, không gửi thư.
        afterLock_(function () { try { Calendar.Events.remove(lessonCalendarId_(), o.ev.eventId, { sendUpdates: 'none' }); } catch (x) { } });
        return;
      }
      if (String(b.cal_state).toUpperCase() === CAL_STATE.DETACHED) {
        // Đang chuyển tài khoản (soát R1 L2): sự kiện vừa tạo trên lịch cũ phải gỡ, giữ DETACHED cho bước B tạo trên lịch mới.
        var gone = { booking_id: b.booking_id, event_id: o.ev.eventId, created_at: b.created_at };
        afterLock_(function () { try { removeLessonEvent_(gone); } catch (x) { } });
        return;
      }
      if (isCancelledStatus_(b.status)) {
        // Buổi bị huỷ trong lúc đang tạo sự kiện: không gắn sự kiện vào buổi đã huỷ; gỡ ngay sau khi nhả khoá.
        // Gỡ lỗi thì mới ghi mã sự kiện (CANCEL_PENDING) để hàng đợi gỡ lại.
        t.update(b, { cal_state: CAL_STATE.CANCEL_PENDING });
        calendarRemoveAfterLock_(b, o.ev.eventId);
        return;
      }
      // Đã đổi tutor trong lúc tạo (soát R1 C1): sự kiện đang mời tutor cũ. Gắn sự kiện rồi đồng bộ lại khách mời ngay.
      var stale = o.tutorId && o.tutorId !== b.tutor_id;
      t.update(b, { event_id: o.ev.eventId, meet_link: o.ev.meetLink || b.meet_link || '', cal_state: stale ? CAL_STATE.RESYNC : CAL_STATE.CREATED, cal_attempts: 0, cal_next_at: '' });
      if (stale) calendarResyncAfterLock_(b);
      return;
    }
    if (o.kind === 'resync') {
      if (o.err) return fail(o.err);
      if (o.tutorId && o.tutorId !== b.tutor_id) { calendarResyncAfterLock_(b); return; }   // lại đổi tutor trong lúc vá
      var patch = { cal_state: isCancelledStatus_(b.status) ? CAL_STATE.CANCEL_PENDING : CAL_STATE.CREATED, cal_attempts: 0, cal_next_at: '' };
      if (o.ev && o.ev.meetLink !== undefined) patch.meet_link = o.ev.meetLink || b.meet_link || '';
      t.update(b, patch);
      if (isCancelledStatus_(b.status)) calendarRemoveAfterLock_(b);
      return;
    }
    if (o.kind === 'remove') {
      if (o.err) return fail(o.err);
      t.update(b, { cal_state: CAL_STATE.CANCELLED, cal_next_at: '' });
    }
  });
  failed.forEach(function (f) {
    var b = f.b;
    notify_('CALENDAR_FAILED', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
      message: (f.kind === 'remove' ? 'Không gỡ được sự kiện Calendar của ' : f.kind === 'resync' ? 'Không cập nhật được tutor trên sự kiện Calendar của ' : 'Không tạo được sự kiện Calendar cho ') + b.booking_id + ' (' + dateKey_(b.date) + ' ' + b.slot + ') sau ' +
        max + ' lần: ' + String((f.err && f.err.message) || f.err) + (f.kind === 'remove' ? '. Xoá tay sự kiện trên lịch học.' : '. Booking vẫn giữ; gửi link Meet tay cho học viên, tutor, hoặc ghi lại cal_state = PENDING (chưa có sự kiện) hoặc RESYNC (đã có) để thử lại.'),
      message_en: (f.kind === 'remove' ? 'Could not remove the Calendar event of ' : f.kind === 'resync' ? 'Could not update the tutor on the Calendar event of ' : 'Could not create the Calendar event for ') + b.booking_id + ' (' + dateKey_(b.date) + ' ' + b.slot + ') after ' +
        max + ' tries: ' + String((f.err && f.err.message) || f.err) + (f.kind === 'remove' ? '. Delete the event on the lesson calendar by hand.' : '. The booking is kept; send the Meet link by hand, or set cal_state to PENDING (no event yet) or RESYNC (event exists) to retry.') });
  });
}

/**
 * Gỡ sự kiện sau khi nhả khoá (huỷ booking). Kết quả ghi trong lần ghi gom cuối. Gọi trong khoá.
 * eventId: sự kiện vừa tạo nhưng chưa gắn vào booking (huỷ trong lúc tạo); gỡ lỗi thì ghi mã này để hàng đợi gỡ lại.
 */
function calendarRemoveAfterLock_(b, eventId) {
  var copy = { booking_id: b.booking_id, event_id: eventId || b.event_id, created_at: b.created_at };
  afterLock_(function () {
    var out = { id: copy.booking_id, kind: 'remove' };
    try { out.gone = removeLessonEvent_(copy) === 'gone'; } catch (e) { out.err = e; }
    deferWrite_(function () {
      if (out.err && eventId) { var t = table_('BOOKINGS'), f = t.byId(copy.booking_id); if (f && !f.event_id) t.update(f, { event_id: eventId }); }
      calendarApplyOutcomes_([out]);
      if (out.err) calendarHint_(getNow_().getTime() + calendarBackoffMs_(1));
    });
  });
}

/**
 * Đổi khách mời và tiêu đề sự kiện theo tutor hiện tại, sau khi nhả khoá (đổi tutor, hoặc job vừa tạo với tutor cũ).
 * Đọc lại booking lúc chạy (không dùng bản trong khoá) để luôn vá theo tutor mới nhất. Gọi trong khoá.
 */
function calendarResyncAfterLock_(b) {
  var id = b.booking_id;
  afterLock_(function () {
    var out = calendarResyncNow_(id);
    if (out) deferWrite_(function () { calendarApplyOutcomes_([out]); if (out.err) calendarHint_(getNow_().getTime() + calendarBackoffMs_(1)); });
  });
}
/** Vá sự kiện của một booking theo dữ liệu hiện tại (ngoài khoá). Trả outcome 'resync' hoặc null nếu không có gì để vá. */
function calendarResyncNow_(bookingId) {
  clearDbCache_();
  var b = table_('BOOKINGS').byId(bookingId);
  if (!b || !b.event_id) return null;
  var out = { id: bookingId, kind: 'resync', tutorId: b.tutor_id };
  try { out.ev = reassignLessonEvent_(b, userById_(b.student_id) || {}, userById_(b.tutor_id) || {}); } catch (e) { out.err = e; }
  return out;
}

/**
 * Huỷ booking: quyết định việc với sự kiện Calendar. Gọi trong khoá, trước khi đổi trạng thái. Trả patch cal_state cho booking.
 * Có sự kiện (hoặc có thể đã tạo: cal_attempts > 0, job hay đường gấp đang làm) thì gỡ sau khi nhả khoá; chưa từng tạo thì bỏ qua.
 */
function calendarOnCancel_(b) {
  var st = calState_(b);
  if (st === CAL_STATE.CREATED || st === CAL_STATE.RESYNC || ((st === CAL_STATE.PENDING || st === CAL_STATE.FAILED) && (b.event_id || Number(b.cal_attempts || 0) > 0))) {
    calendarRemoveAfterLock_(b);
    return { cal_state: CAL_STATE.CANCEL_PENDING, cal_next_at: '' };
  }
  if (st === CAL_STATE.PENDING || st === CAL_STATE.FAILED) return { cal_state: CAL_STATE.SKIPPED, cal_next_at: '' };
  return {};
}

/**
 * Đổi tutor (Availability.gs reassignBookingInLock_). Gọi trong khoá SAU khi đã ghi tutor_id mới.
 * Đã có sự kiện: vá khách mời sau khi nhả khoá (RESYNC). Chưa có: hàng đợi sẽ tạo với tutor mới, không làm gì.
 */
function calendarOnReassign_(b) {
  var st = calState_(b);
  if (b.event_id && (st === CAL_STATE.CREATED || st === CAL_STATE.RESYNC || st === CAL_STATE.FAILED)) {
    table_('BOOKINGS').update(b, { cal_state: CAL_STATE.RESYNC, cal_attempts: 0, cal_next_at: '' });
    calendarResyncAfterLock_(b);
  }
}

/**
 * Đặt lịch: các booking vừa ghi (trong khoá A). Buổi gấp: đánh dấu đang tạo, tạo ngay sau khi nhả khoá. Buổi khác: chờ job.
 * Trả danh sách booking sẽ tạo ngay (để email xác nhận có link Meet).
 */
function calendarOnBooked_(bookings, now) {
  var t = table_('BOOKINGS'), urgent = [];
  bookings.forEach(function (b) {
    if (calendarUrgent_(b, now)) {
      // cal_attempts 1: huỷ ngay sau đó vẫn biết phải thử gỡ; cal_next_at: job không làm trùng trong 10 phút.
      t.update(b, { cal_state: CAL_STATE.PENDING, cal_attempts: 1, cal_next_at: new Date(now.getTime() + 600000) });
      urgent.push(b);
    } else {
      t.update(b, { cal_state: CAL_STATE.PENDING });
      calendarHint_(calendarDueAt_(b, now));
    }
  });
  return urgent;
}

/** Tạo sự kiện cho danh sách việc (ngoài khoá, việc đã đánh dấu trước). Trả outs cho calendarApplyOutcomes_. */
function calendarCreateEvents_(items, t0) {
  var outs = [];
  items.forEach(function (it) {
    var o = { id: it.b.booking_id, kind: 'create', tutorId: it.b.tutor_id, premarked: true, fixedId: lessonEventId_(it.b) };
    if (t0 && realNowMs_() - t0 > CAL_BUDGET_MS_) return;
    try { o.ev = createLessonEvent_(it.b, it.student, it.tutor); } catch (e) { o.err = e; }
    outs.push(o);
  });
  return outs;
}

/** Job mỗi 5 phút. */
function calendarJob(e) { requireOperator_(e);
  try { var out = runCalendarQueue_({}); heartbeat_('calendarJob'); return out; }
  catch (err) {
    if (String((err && err.message) || err) === BUSY_MESSAGE_) { heartbeat_('calendarJob'); return { busy: true }; }
    mailAdminError_('Job calendarJob lỗi', (err && err.stack) || String(err));
    throw err;
  }
}

/**
 * Chạy hàng đợi. opts.force: bỏ qua giờ gom và gợi ý (menu "Calendar: tạo sự kiện đang chờ ngay").
 * Trả { created, removed, resynced, skipped, failed, left } hoặc { idle } hoặc { paused }.
 */
function runCalendarQueue_(opts) {
  opts = opts || {};
  var t0 = realNowMs_(), now = getNow_(), cache = CacheService.getScriptCache();
  // Đang xoá dữ liệu test (Reset.gs): tạm dừng để không gắn kết quả trễ vào booking mới cùng mã.
  var paused = Number(props_().getProperty('CAL_PAUSED_UNTIL') || 0);
  if (paused && realNowMs_() < paused) return { paused: true };
  var hint0 = null, seq0 = null;
  try { hint0 = cache.get(CAL_HINT_KEY_); seq0 = cache.get('cal_hint_seq'); } catch (e) { }
  if (!opts.force && hint0 !== null && now.getTime() < Number(hint0)) return { idle: true };
  // Đọc ngoài khoá (không ghi gì ở bước này).
  clearDbCache_();
  var users = {}; table_('USERS').all().forEach(function (u) { users[u.user_id] = u; });
  var jobs = [], skips = [], nextDue = Infinity;
  table_('BOOKINGS').all().forEach(function (b) {
    var st = calState_(b), next = b.cal_next_at ? new Date(b.cal_next_at).getTime() : 0, due;
    if (st === CAL_STATE.PENDING) {
      if (b.status !== BOOKING_STATUS.CONFIRMED) {
        if (isCancelledStatus_(b.status)) { if (b.event_id || Number(b.cal_attempts || 0) > 0) jobs.push({ b: b, kind: 'remove', at: 0 }); else skips.push(b); }
        return; // PENDING_REASSIGN: chờ admin quyết định tutor
      }
      if (slotEnd_(b.date, b.slot) <= now) { skips.push(b); return; }
      due = calendarDueAt_(b, now);
      if (opts.force || now.getTime() >= due) jobs.push({ b: b, kind: 'create', at: slotStart_(b.date, b.slot).getTime() });
      else nextDue = Math.min(nextDue, due);
    } else if (st === CAL_STATE.CANCEL_PENDING) {
      if (opts.force || now.getTime() >= next) jobs.push({ b: b, kind: 'remove', at: 0 }); else nextDue = Math.min(nextDue, next);
    } else if (st === CAL_STATE.RESYNC) {
      if (opts.force || now.getTime() >= next) jobs.push({ b: b, kind: 'resync', at: 1 }); else nextDue = Math.min(nextDue, next);
    }
  });
  // Giữ chỗ 10 phút trong bộ đệm: hai lần chạy chồng nhau (menu và trigger) không làm cùng một việc.
  var leaseKeys = jobs.map(function (j) { return 'cal_lease_' + j.b.booking_id; }), leased = {};
  try { leased = cache.getAll(leaseKeys) || {}; } catch (e) { leased = {}; }
  // Việc đang giữ chỗ (lần chạy khác đang làm, hoặc lần trước dừng giữa chừng): xét lại sau 10 phút, không bỏ quên (soát R2 T4).
  jobs = jobs.filter(function (j) { if (leased['cal_lease_' + j.b.booking_id]) { nextDue = Math.min(nextDue, now.getTime() + 600000); return false; } return true; })
    .sort(function (a, b) { return a.at - b.at; });
  var max = Number(cfg_('CALENDAR_BATCH_MAX')) || 40, take = jobs.slice(0, max), left = jobs.length - take.length;
  if (take.length) { var put = {}; take.forEach(function (j) { put['cal_lease_' + j.b.booking_id] = '1'; }); try { cache.putAll(put, 600); } catch (e) { } }
  try { return runCalendarTake_(take, skips, left, nextDue, now, t0, users, cache, hint0, seq0); }
  finally { try { cache.removeAll(take.map(function (j) { return 'cal_lease_' + j.b.booking_id; })); } catch (e) { } }
}

/** Phần làm việc của runCalendarQueue_ (tách ra để luôn gỡ giữ chỗ dù khoá bận hay lỗi giữa chừng). */
function runCalendarTake_(take, skips, left, nextDue, now, t0, users, cache, hint0, seq0) {
  // Đánh dấu "đang tạo" trong một khoá ngắn TRƯỚC khi gọi Google (soát R1 T3): học viên huỷ đúng lúc đó thì luồng huỷ biết
  // phải thử gỡ theo mã cố định, kể cả khi lượt ghi cuối của job hỏng.
  var creates = take.filter(function (j) { return j.kind === 'create'; });
  if (creates.length) {
    withLock_(function () {
      var tb = table_('BOOKINGS'), lease = new Date(now.getTime() + 600000);
      creates.forEach(function (j) {
        var f = tb.byId(j.b.booking_id);
        if (!f || calState_(f) !== CAL_STATE.PENDING || f.status !== BOOKING_STATUS.CONFIRMED || f.event_id) { j.drop = true; return; }
        tb.update(f, { cal_attempts: Number(f.cal_attempts || 0) + 1, cal_next_at: lease });
        j.b = f;   // tutor, học viên mới nhất
      });
    });
  }

  var outs = skips.map(function (b) { return { id: b.booking_id, kind: 'skip' }; }), resynced = 0;
  take.forEach(function (j) {
    if (j.drop) return;
    if (realNowMs_() - t0 > CAL_BUDGET_MS_) { left++; return; }
    var o = { id: j.b.booking_id, kind: j.kind, tutorId: j.b.tutor_id, premarked: j.kind === 'create', fixedId: j.kind === 'create' ? lessonEventId_(j.b) : '' };
    try {
      if (j.kind === 'create') o.ev = createLessonEvent_(j.b, users[j.b.student_id] || {}, users[j.b.tutor_id] || {});
      else if (j.kind === 'resync') { o.ev = reassignLessonEvent_(j.b, users[j.b.student_id] || {}, users[j.b.tutor_id] || {}); resynced++; }
      else o.gone = removeLessonEvent_(j.b) === 'gone';
    } catch (e) { o.err = e; }
    outs.push(o);
  });
  var res = { created: 0, removed: 0, resynced: 0, skipped: skips.length, failed: 0, left: left };
  outs.forEach(function (o) { if (o.err) res.failed++; else if (o.kind === 'create') res.created++; else if (o.kind === 'remove') res.removed++; else if (o.kind === 'resync') res.resynced++; });
  withLock_(function () {
    if (outs.length) calendarApplyOutcomes_(outs);
    // Gợi ý cho lần chạy sau: còn việc thì chạy ngay lần tới; không thì ngủ tới việc sớm nhất (tối đa 6 giờ, rồi kiểm lại toàn bộ).
    var hintAt = left > 0 || res.failed ? now.getTime() : (nextDue === Infinity ? now.getTime() + 6 * 3600000 : nextDue);
    // Có người ghi gợi ý mới trong lúc job chạy (đặt lịch, huỷ lỗi): giữ giá trị nhỏ hơn, không xoá (soát R1 T2).
    try { var cur = cache.get(CAL_HINT_KEY_); if (cur !== null && cache.get('cal_hint_seq') !== seq0) hintAt = Math.min(hintAt, Number(cur)); } catch (e) { }
    try { cache.put(CAL_HINT_KEY_, String(Math.floor(hintAt)), 21600); } catch (e) { }
    if (outs.length) logActivity_('SYSTEM', 'CALENDAR_QUEUE', 'BOOKINGS', '', res);
    if (outs.length) calendarNightTally_(now, res);
    // Cả lô lỗi ngay lần đầu (dịch vụ Calendar chưa bật, sai LESSON_CALENDAR_ID, hết hạn mức): báo ngay, 1 lần mỗi ngày (soát R2 T5).
    if (res.failed >= 3 && !res.created && !res.resynced) {
      var flag = 'CAL_BATCH_FAIL_' + dateKey_(now);
      if (!props_().getProperty(flag)) {
        props_().setProperty(flag, '1');
        notify_('CALENDAR_BATCH_FAILED', { entity: 'BOOKINGS', link: rowLink_('BOOKINGS'),
          message: 'Hàng đợi Calendar: ' + res.failed + ' việc lỗi, không việc nào thành công trong lần chạy ' + fmtDateTime_(now) + '. Lỗi đầu: ' +
            String((outs.filter(function (o) { return o.err; })[0] || {}).err) + '. Kiểm tra dịch vụ Calendar, LESSON_CALENDAR_ID, hạn mức; hệ thống tự thử lại.',
          message_en: 'Calendar queue: ' + res.failed + ' jobs failed, none succeeded in the run at ' + fmtDateTime_(now) + '. First error: ' +
            String((outs.filter(function (o) { return o.err; })[0] || {}).err) + '. Check the Calendar service, LESSON_CALENDAR_ID and quota; the system retries automatically.' });
      }
    }
  });
  return res;
}

/**
 * Cộng dồn kết quả các lượt trong một đêm (NIGHTLY) vào Script Property CAL_NIGHT_<ngày>. hourlyJob sau 00:00 gửi tổng kết
 * đêm qua (calendarNightSummaryInLock_) rồi xoá khoá. Gọi trong khoá.
 */
function calendarNightTally_(now, res) {
  if (calendarMode_() !== 'NIGHTLY') return;
  var key = 'CAL_NIGHT_' + dateKey_(now), p = props_(), cur = {};
  try { cur = JSON.parse(p.getProperty(key) || '{}'); } catch (e) { cur = {}; }
  ['created', 'removed', 'resynced', 'failed', 'skipped'].forEach(function (k) { cur[k] = (cur[k] || 0) + (res[k] || 0); });
  p.setProperty(key, JSON.stringify(cur));
}
/** Tổng kết lô đêm qua: CALENDAR_NIGHTLY (LOG) khi ổn, CALENDAR_NIGHTLY_PROBLEM (EMAIL) khi còn lỗi hoặc còn buổi sắp tới chưa có sự kiện. */
function calendarNightSummaryInLock_(now) {
  var p = props_(), all = p.getProperties(), sent = 0;
  Object.keys(all).forEach(function (k) { if (/^CAL_BATCH_FAIL_/.test(k) && k !== 'CAL_BATCH_FAIL_' + dateKey_(now)) p.deleteProperty(k); });
  Object.keys(all).filter(function (k) { return /^CAL_NIGHT_/.test(k) && k !== 'CAL_NIGHT_' + dateKey_(now); }).forEach(function (k) {
    var tally = {}; try { tally = JSON.parse(all[k]); } catch (e) { }
    var q = calendarQueueStatus_(), problem = q.failed > 0 || q.pendingSoon > 0;
    notify_(problem ? 'CALENDAR_NIGHTLY_PROBLEM' : 'CALENDAR_NIGHTLY', { entity: 'BOOKINGS', link: rowLink_('BOOKINGS'),
      message: 'Lô Calendar đêm ' + k.substring(10) + ': tạo ' + (tally.created || 0) + ' sự kiện, gỡ ' + (tally.removed || 0) + ', cập nhật tutor ' + (tally.resynced || 0) +
        ', lỗi (đã thử lại) ' + (tally.failed || 0) + '. Hiện còn ' + q.pendingSoon + ' buổi trong 24 giờ tới chưa có sự kiện, ' + q.failed + ' buổi cần xử lý tay.' +
        (problem ? ' Bấm menu "Calendar: tạo sự kiện đang chờ ngay" hoặc gửi link Meet tay.' : ''),
      message_en: 'Calendar batch of the night of ' + k.substring(10) + ': created ' + (tally.created || 0) + ' events, removed ' + (tally.removed || 0) + ', tutor updated ' + (tally.resynced || 0) +
        ', failed (retried) ' + (tally.failed || 0) + '. Now ' + q.pendingSoon + ' lesson(s) in the next 24 hours have no event, ' + q.failed + ' need manual handling.' +
        (problem ? ' Use the menu "Calendar: tạo sự kiện đang chờ ngay" or send the Meet link by hand.' : '') });
    p.deleteProperty(k); sent++;
  });
  return sent;
}

/** Tình trạng hàng đợi (menu, trang admin, đo tốc độ). Chỉ đọc. */
function calendarQueueStatus_() {
  var now = getNow_(), out = { mode: calendarMode_(), windowOpen: calendarWindowOpen_(now), pending: 0, pendingSoon: 0, failed: 0, cancelPending: 0 };
  table_('BOOKINGS').all().forEach(function (b) {
    var st = calState_(b);
    if (st === CAL_STATE.PENDING && b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now) {
      out.pending++;
      if (slotStart_(b.date, b.slot).getTime() - now.getTime() < 24 * 3600000) out.pendingSoon++;
    } else if (st === CAL_STATE.FAILED && b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now) out.failed++;
    else if (st === CAL_STATE.CANCEL_PENDING) out.cancelPending++;
  });
  return out;
}

/** Menu: chạy hàng đợi ngay, bỏ qua giờ gom (dùng khi thử trên STAGING hoặc khi cần lời mời ngay). */
function menuCalendarRunNow(e) { requireOperator_(e);
  var r = runCalendarQueue_({ force: true }), s = calendarQueueStatus_();
  alert_('Hàng đợi Calendar đã chạy.\n\nĐã tạo: ' + r.created + '\nĐã gỡ: ' + r.removed + '\nBỏ qua (đã huỷ trước khi tạo, hoặc buổi đã qua): ' + r.skipped +
    '\nLỗi (sẽ thử lại): ' + r.failed + '\nCòn lại cho lần sau: ' + r.left + '\n\nChế độ: ' + s.mode + (s.windowOpen ? ' (đang trong giờ xử lý)' : '') +
    '\nCòn chờ tạo: ' + s.pending + ' (trong 24 giờ tới: ' + s.pendingSoon + ')\nĐã báo lỗi, cần xử lý tay: ' + s.failed);
  return r;
}

// ── CalendarSync.gs ──
/**
 * CalendarSync.gs · Liên kết Google Calendar và Meet (v8, plan mục 4.11, câu 41)
 *
 * Mỗi booking CONFIRMED = một sự kiện trên lịch chung LESSON_CALENDAR_ID, khách mời là học viên và tutor.
 * Quyền riêng tư (câu 35): ẩn danh sách khách mời để tutor không thấy email học viên và ngược lại;
 * tiêu đề và mô tả không có email hay số điện thoại.
 * Chạy được trên cả Gmail thường và Workspace. MEET_MODE = TUTOR_ROOM thì dùng phòng cố định của tutor.
 */

function lessonCalendarId_() {
  var id = cfg_('LESSON_CALENDAR_ID');
  if (!id) throw new Error('Chưa có LESSON_CALENDAR_ID trong CONFIG. Chạy menu thaiput > Cài đặt lần đầu.');
  return id;
}

function isoLocal_(d) {
  return dateKey_(d) + 'T' + pad2_(d.getHours()) + ':' + pad2_(d.getMinutes()) + ':00+07:00';
}

function lessonEventResource_(booking, student, tutor) {
  var start = slotStart_(booking.date, booking.slot), end = slotEnd_(booking.date, booking.slot);
  var desc = [
    'Buổi luyện nói 1:1 thaiput (25 phút).',
    'Huỷ buổi: trước 15:00 hôm trước, trong cổng học viên: ' + portalUrl_('student'),
    cfg_('ADMIN_ZALO_URL') ? 'Cần hỗ trợ: ' + cfg_('ADMIN_ZALO_URL') : ''
  ].filter(function (x) { return x; }).join('\n');
  var res = {
    summary: cfg_('SCHOOL_NAME') + ' · ' + student.name + ' × ' + tutor.name,
    description: desc,
    start: { dateTime: isoLocal_(start), timeZone: APP.TIMEZONE },
    end: { dateTime: isoLocal_(end), timeZone: APP.TIMEZONE },
    attendees: realGuests_([{ email: student.email }, { email: tutor.email }]),
    guestsCanSeeOtherGuests: false,
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] }
  };
  if (tutor.color_id) res.colorId = String(tutor.color_id);
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM') {
    res.location = tutor.meet_room || '';
  } else {
    res.conferenceData = { createRequest: { requestId: 'thaiput-' + booking.booking_id + '-' + Utilities.getUuid().substring(0, 8), conferenceSolutionKey: { type: 'hangoutsMeet' } } };
  }
  return res;
}

function meetLinkOf_(ev, tutor) {
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM') return tutor.meet_room || '';
  if (ev.hangoutLink) return ev.hangoutLink;
  var eps = (ev.conferenceData && ev.conferenceData.entryPoints) || [];
  for (var i = 0; i < eps.length; i++) if (eps[i].entryPointType === 'video') return eps[i].uri;
  return '';
}

/** Tạo sự kiện. Trả { eventId, meetLink }. */
var MEET_RETRY_USED_ = false;
/** Khách admin cho sự kiện buổi học (ADMIN_JOIN_MEET), bỏ trùng với học viên và tutor. */
function adminGuests_(student, tutor) {
  if (!cfg_('ADMIN_JOIN_MEET')) return [];
  if (isTestAddress_(student.email)) return [];   // thử tải: không làm đầy lịch của admin (soát R2 T18)
  // Tài khoản chạy hệ thống (admin@ khi chỉ có 1 tài khoản Workspace) là chủ sự kiện, đã vào được phòng: không thêm lại.
  var owner = ''; try { owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase(); } catch (e) { }
  var skip = [String(student.email).toLowerCase(), String(tutor.email).toLowerCase(), owner], out = [];
  // ADMIN_EMAIL cộng các tài khoản role ADMIN đang hoạt động (ví dụ co-founder thứ hai dùng Gmail riêng).
  // Thêm làm khách với sendUpdates none nên không ai nhận thư mời; email hệ thống vẫn chỉ tới ADMIN_EMAIL (luật 29).
  adminEmails_().concat(table_('USERS').filter(function (u) { return u.role === 'ADMIN' && u.status === USER_STATUS.ACTIVE; })
    .map(function (u) { return String(u.email || '').trim().toLowerCase(); }))
    .forEach(function (e) { if (e && skip.indexOf(e) === -1 && out.indexOf(e) === -1) out.push(e); });
  return out.map(function (e) { return { email: e, optional: true, responseStatus: 'accepted' }; });
}

/**
 * Mã sự kiện cố định cho mỗi booking (chunk 5F). Tạo lại sau một lần chạy bị dừng giữa chừng thì Google báo "đã tồn tại"
 * thay vì sinh sự kiện thứ hai, và huỷ booking chưa kịp ghi mã sự kiện vẫn gỡ được đúng sự kiện. Chữ 0 đến 9, a đến v
 * (yêu cầu của Calendar API). Có thời điểm tạo booking trong chuỗi băm để mã không trùng sự kiện cũ sau khi xoá dữ liệu test.
 */
function lessonEventId_(b) {
  // Theo giây (soát R1 L7): Sheets có thể làm tròn mili giây khi lưu, bản trong bộ nhớ và bản đọc lại phải ra cùng một mã.
  var created = b.created_at instanceof Date ? Math.floor(b.created_at.getTime() / 1000) : String(b.created_at || '');
  var db = ''; try { db = getDbId_(); } catch (e) { }
  return 'tp' + sha256Hex_(db + '|' + b.booking_id + '|' + created).substring(0, 30);
}
function isGoneError_(e) { return /not found|404|410|deleted|Không thấy/i.test(String((e && e.message) || e)); }
function isDuplicateError_(e) { return /already exists|duplicate|409|đã tồn tại/i.test(String((e && e.message) || e)); }

function createLessonEvent_(booking, student, tutor) {
  // Ghi các dòng đang gom (dòng BOOKINGS vừa tạo) trước khi gửi thư mời: nếu lần chạy bị Google dừng đột ngột,
  // không có thư mời nào trỏ tới buổi học không tồn tại trong Sheets.
  flushDb_();
  var calId = lessonCalendarId_(), res = lessonEventResource_(booking, student, tutor), fixedId = lessonEventId_(booking), ev = null;
  res.id = fixedId;
  try { ev = Calendar.Events.insert(res, calId, { conferenceDataVersion: 1, sendUpdates: 'all' }); }
  catch (e) {
    if (!isDuplicateError_(e)) throw e;
    // Lần trước đã tạo nhưng chưa kịp ghi mã vào Sheets: dùng lại sự kiện đó, không tạo thêm, không gửi thư mời lần hai.
    try { ev = Calendar.Events.get(calId, fixedId); } catch (g) { ev = null; }
    if (!ev || ev.status === 'cancelled') { delete res.id; ev = Calendar.Events.insert(res, calId, { conferenceDataVersion: 1, sendUpdates: 'all' }); }
    else {
      // Sự kiện cũ có thể mời tutor trước khi đổi (soát R1 C1): khách mời lệch thì vá theo học viên, tutor hiện tại.
      var emails = (ev.attendees || []).map(function (a) { return String(a.email).toLowerCase(); });
      if (emails.indexOf(String(tutor.email).toLowerCase()) === -1 || emails.indexOf(String(student.email).toLowerCase()) === -1) {
        var fixed = reassignLessonEvent_({ booking_id: booking.booking_id, event_id: ev.id, meet_link: '' }, student, tutor);
        try { ev = Calendar.Events.get(calId, ev.id); } catch (g2) { }
        if (fixed && fixed.meetLink && !meetLinkOf_(ev, tutor)) ev.hangoutLink = fixed.meetLink;
      }
    }
  }
  var link = meetLinkOf_(ev, tutor);
  // Admin luôn vào được phòng Meet (chunk 5B): thêm ADMIN_EMAIL làm khách, không gửi thư mời (sendUpdates none).
  var have = (ev.attendees || []).map(function (a) { return String(a.email).toLowerCase(); });
  var admins = adminGuests_(student, tutor).filter(function (a) { return have.indexOf(String(a.email).toLowerCase()) === -1; });
  if (admins.length) {
    try { ev = Calendar.Events.patch({ attendees: (ev.attendees || [{ email: student.email }, { email: tutor.email }]).concat(admins) }, calId, ev.id, { sendUpdates: 'none' }) || ev; }
    catch (e) { logActivity_('SYSTEM', 'CALENDAR_ADMIN_GUEST_FAILED', 'BOOKING', booking.booking_id, e.message); }
  }
  // Google đôi khi tạo phòng Meet chậm (trạng thái pending): đợi 1 giây đọc lại, tối đa 1 lần mỗi lần chạy để không giữ khoá lâu.
  // Còn thiếu thì reminderJob tự điền trước khi gửi email nhắc (fillMeetLink_).
  if (!link && cfg_('MEET_MODE') !== 'TUTOR_ROOM' && !MEET_RETRY_USED_) {
    MEET_RETRY_USED_ = true;
    Utilities.sleep(1000);
    try { ev = Calendar.Events.get(calId, ev.id); link = meetLinkOf_(ev, tutor); } catch (e) { }
  }
  return { eventId: ev.id, meetLink: link };
}

/**
 * Gỡ sự kiện của một booking (khách mời nhận thư huỷ). Dùng event_id, chưa có thì mã cố định. Trả 'removed' hoặc 'gone'
 * (không có hoặc đã gỡ: coi như xong). Lỗi thật thì ném để hàng đợi thử lại. Không gọi trong khoá (chậm).
 */
function removeLessonEvent_(b) {
  var calId = lessonCalendarId_(), id = b.event_id || lessonEventId_(b);
  // Gỡ khách admin trước (không gửi thư), để thư huỷ chỉ tới học viên và tutor.
  stripAdminGuests_(calId, id);
  try { Calendar.Events.remove(calId, id, { sendUpdates: 'all' }); return 'removed'; }
  catch (e) { if (isGoneError_(e)) return 'gone'; throw e; }
}

/** Đổi tutor: thay khách mời và tiêu đề, giữ nguyên giờ và link Meet (chế độ AUTO). */
function reassignLessonEvent_(booking, student, newTutor) {
  if (!booking.event_id) return { meetLink: booking.meet_link };
  var calId = lessonCalendarId_(), admins = adminGuests_(student, newTutor);
  // Khách admin nhận cả thư "đã cập nhật" nếu còn trong danh sách khi gửi thư cho học viên và tutor:
  // gỡ admin không gửi thư, đổi tutor có gửi thư, rồi thêm lại admin không gửi thư (luật 29: admin chỉ nhận email hệ thống).
  stripAdminGuests_(calId, booking.event_id);
  var patch = { summary: cfg_('SCHOOL_NAME') + ' · ' + student.name + ' × ' + newTutor.name, attendees: realGuests_([{ email: student.email }, { email: newTutor.email }]) };
  if (newTutor.color_id) patch.colorId = String(newTutor.color_id);
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM') patch.location = newTutor.meet_room || '';
  Calendar.Events.patch(patch, calId, booking.event_id, { sendUpdates: 'all' });
  if (admins.length) {
    try { Calendar.Events.patch({ attendees: patch.attendees.concat(admins) }, calId, booking.event_id, { sendUpdates: 'none' }); }
    catch (e) { logActivity_('SYSTEM', 'CALENDAR_ADMIN_GUEST_FAILED', 'BOOKING', booking.booking_id, e.message); }
  }
  return { meetLink: cfg_('MEET_MODE') === 'TUTOR_ROOM' ? (newTutor.meet_room || '') : booking.meet_link };
}

/**
 * Gỡ khách admin khỏi sự kiện, không gửi thư. Không phụ thuộc cài đặt hiện tại: gỡ mọi email admin từng có
 * (ADMIN_EMAIL, USERS role ADMIN ở mọi trạng thái, tài khoản chạy hệ thống), để tắt ADMIN_JOIN_MEET hay khoá một admin
 * sau khi buổi đã tạo vẫn không làm admin nhận thư huỷ. Lỗi thì bỏ qua (tệ nhất admin nhận thêm 1 thư Calendar).
 */
function allAdminEmails_() {
  var out = adminEmails_().slice();
  try { table_('USERS').filter(function (u) { return u.role === 'ADMIN'; }).forEach(function (u) { var e = String(u.email || '').trim().toLowerCase(); if (e) out.push(e); }); } catch (e) { }
  try { out.push(String(Session.getEffectiveUser().getEmail() || '').toLowerCase()); } catch (e) { }
  return out.filter(function (e) { return e; });
}
function stripAdminGuests_(calId, eventId) {
  try {
    var skip = allAdminEmails_();
    var ev = Calendar.Events.get(calId, eventId), cur = (ev && ev.attendees) || [];
    var keep = cur.filter(function (a) { return skip.indexOf(String(a.email).toLowerCase()) === -1; });
    if (keep.length !== cur.length) Calendar.Events.patch({ attendees: keep.map(function (a) { return { email: a.email }; }) }, calId, eventId, { sendUpdates: 'none' });
  } catch (e) { }
}

/** Huỷ sự kiện ngay (dùng khi chuyển tài khoản). Lỗi Calendar không chặn việc đang làm; ghi log và báo admin. */
function cancelLessonEvent_(booking) {
  if (!booking.event_id) return false;
  try { return removeLessonEvent_(booking) === 'removed'; }
  catch (e) {
    logActivity_('SYSTEM', 'CALENDAR_REMOVE_FAILED', 'BOOKING', booking.booking_id, e.message);
    mailAdminError_('Không xoá được sự kiện Calendar ' + booking.booking_id, e.message + '\nXoá tay sự kiện trên lịch "Thaiput · Lịch học".');
    return false;
  }
}

/**
 * Buổi có sự kiện nhưng chưa có link Meet (Google tạo chậm): đọc lại sự kiện để lấy link.
 * Gọi được cả trong khoá (ghi ngay) và sau khoá (chunk 5F: gom vào lần ghi cuối).
 */
function fillMeetLink_(b) {
  if (b.meet_link || !b.event_id || cfg_('MEET_MODE') === 'TUTOR_ROOM') return b.meet_link;
  try {
    var link = meetLinkOf_(Calendar.Events.get(lessonCalendarId_(), b.event_id), {});
    if (link) {
      b.meet_link = link;
      var id = b.booking_id;
      var write = function () { var t = table_('BOOKINGS'), f = t.byId(id); if (f && !f.meet_link) t.update(f, { meet_link: link }); };
      if (DB_LOCK_DEPTH_) write(); else deferWrite_(write);
    }
    return link;
  } catch (e) { return ''; }
}

// ── Chuyển sang tài khoản khác (Gmail thường sang Workspace), chunk 5 ──
// Lịch học thuộc tài khoản đang chạy script. Khi đổi tài khoản, các buổi sắp tới phải có sự kiện trên lịch mới.
// Bước A chạy ở hệ thống cũ: gỡ sự kiện (học viên, tutor nhận thư huỷ của Calendar), buổi học vẫn giữ nguyên.
// Bước B chạy ở hệ thống mới: tạo lại sự kiện và link Meet mới, học viên, tutor nhận thư mời mới.

function futureConfirmedBookings_() {
  var now = getNow_();
  return table_('BOOKINGS').filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && slotEnd_(b.date, b.slot) > now; });
}

function detachFutureEvents_(actor) {
  return withLock_(function () {
    var n = 0;
    futureConfirmedBookings_().forEach(function (b) {
      if (!b.event_id) {
        // Có thể đã tạo theo mã cố định mà chưa kịp ghi mã (soát R1 L2): thử gỡ, không có thì thôi.
        if (Number(b.cal_attempts || 0) > 0) { try { if (removeLessonEvent_(b) === 'removed') n++; } catch (e) { } }
        table_('BOOKINGS').update(b, { cal_state: CAL_STATE.DETACHED }); return;
      }
      if (cancelLessonEvent_(b)) n++;
      // DETACHED: hàng đợi Calendar của hệ thống cũ không tạo lại sự kiện cho buổi này (chunk 5F).
      table_('BOOKINGS').update(b, { event_id: '', meet_link: '', cal_state: CAL_STATE.DETACHED });
    });
    logActivity_(actor, 'EVENTS_DETACHED', 'BOOKINGS', '', JSON.stringify({ events: n }));
    return { removed: n };
  });
}

function recreateFutureEvents_(actor) {
  return withLock_(function () {
    var n = 0, failed = [];
    futureConfirmedBookings_().forEach(function (b) {
      if (b.event_id) return; // đã có sự kiện trên lịch hiện tại
      try {
        var ev = createLessonEvent_(b, userById_(b.student_id), userById_(b.tutor_id));
        table_('BOOKINGS').update(b, { event_id: ev.eventId, meet_link: ev.meetLink, cal_state: CAL_STATE.CREATED, cal_attempts: 0 });
        n++;
      } catch (e) { failed.push(b.booking_id + ': ' + e.message); }
    });
    logActivity_(actor, 'EVENTS_RECREATED', 'BOOKINGS', '', JSON.stringify({ events: n }));
    return { created: n, failed: failed };
  });
}

// ── Compensation.gs ──
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

// ── Content.gs ──
/**
 * Content.gs · Nội dung chỉnh được trên Sheets (chunk 5C, song ngữ từ chunk 5H)
 *
 * Hai tab, admin sửa trực tiếp, không cần sửa code hay triển khai lại:
 *   CONTENT          mọi chữ trên trang web, mỗi dòng một chữ, có cả tiếng Việt (cột vi) và tiếng Anh (cột en).
 *                    Người dùng chọn ngôn ngữ bằng nút VI | EN; trang hiện cột tương ứng.
 *                    Cột page, position, shown_when cho biết chữ nằm ở trang nào, chỗ nào, hiện khi nào (code tự ghi,
 *                    không cần sửa). default_vi, default_en là chữ gốc để đối chiếu hoặc chép lại.
 *                    Ô vi hoặc en để trống = dùng chữ gốc; ghi dấu - = ẩn chữ đó.
 *   EMAIL_TEMPLATES  mọi email hệ thống gửi đi, song ngữ. Ô trống = dùng mẫu gốc.
 * Sửa xong: menu thaiput > "Cập nhật nội dung web và email" (xoá bộ nhớ đệm, kiểm tra lỗi), rồi tải lại trang web.
 * Không bấm menu thì nội dung mới vẫn có hiệu lực sau tối đa CONTENT_CACHE_SECONDS giây.
 *
 * Cú pháp trong ô email:
 *   {{ten_bien}}                chèn giá trị (danh sách biến của từng mẫu ở cột variables)
 *   {{button:ten_bien|Chữ nút}}  nút bấm tới link trong biến đó
 *   **chữ đậm**                  in đậm
 *   dòng trống                   sang đoạn mới
 *   ô để trống                   dùng mẫu gốc; ô chỉ ghi dấu - là cố ý để trống (ví dụ bỏ nửa tiếng Anh)
 * Email marketing (khuyến mãi, chăm sóc): tab riêng MARKETING_EMAILS (Marketing.gs), không thêm vào EMAIL_TEMPLATES.
 */

var CONTENT_CACHE_KEY_ = 'content_map_v2';
var CONTENT_CACHE_SECONDS_ = 300;
var TEMPLATE_CACHE_ = null;
var LANGS_ = ['vi', 'en'];

/** Tên trang hiện ở cột page của tab CONTENT, theo tiền tố của key. */
var CONTENT_PAGES_ = {
  a: 'Chung (mọi trang)', h: 'Trang chủ', l: 'Trang đăng nhập', s: 'Cổng học viên', st: 'Cổng học viên: nhãn trạng thái buổi',
  t: 'Cổng tutor', r: 'Câu báo lỗi (mọi trang)', ad: 'Trang quản trị', comp: 'Email học viên: lý do được bù ngày (chunk 5M)',
  // Chunk 5I: nhóm con của trang quản trị
  'ad.kpi': 'Trang quản trị: ô số liệu', 'ad.lv': 'Trang quản trị: mức thông báo', 'ad.ev': 'Trang quản trị: tên sự kiện thông báo',
  'ad.act': 'Trang quản trị: tên hành động trong nhật ký', 'ad.st': 'Trang quản trị: nhãn trạng thái buổi', 'ad.pkg': 'Trang quản trị: trạng thái gói',
  'ad.us': 'Trang quản trị: trạng thái tài khoản', 'ad.r': 'Trang quản trị: câu báo lỗi khi đặt thay', 'ad.role': 'Trang quản trị: vai trò', 'ad.lang': 'Trang quản trị: ngôn ngữ của người dùng'
};
function contentPage_(key) { var seg = String(key).split('.'); return CONTENT_PAGES_[seg[0] + '.' + seg[1]] || CONTENT_PAGES_[seg[0]] || ''; }

// ── Chữ trên trang web: key → [tiếng Việt, tiếng Anh, vị trí trên trang, xuất hiện khi] ──
// {bien} trong chữ được thay lúc hiện (ví dụ {n} là một con số). Giữ nguyên {bien} khi sửa chữ.
var DEFAULT_CONTENT_ = {
  // ── Chung ──
  'a.lang_title': ['Chọn ngôn ngữ', 'Choose your language', 'Tiêu đề hộp chọn ngôn ngữ (hiện cả hai thứ tiếng cạnh nhau)', 'Lần đầu đăng nhập bằng link email, khi tài khoản chưa chọn ngôn ngữ'],
  'a.lang_note': ['Đổi lại bất cứ lúc nào bằng nút VI | EN ở góc trên màn hình.', 'You can switch anytime with the VI | EN button at the top of the screen.', 'Dòng nhỏ dưới tiêu đề hộp chọn ngôn ngữ', 'Cùng lúc với hộp chọn ngôn ngữ'],
  'a.lang_vi': ['Tiếng Việt', 'Tiếng Việt', 'Nút chọn tiếng Việt trong hộp chọn ngôn ngữ', 'Cùng lúc với hộp chọn ngôn ngữ'],
  'a.lang_en': ['English', 'English', 'Nút chọn tiếng Anh trong hộp chọn ngôn ngữ', 'Cùng lúc với hộp chọn ngôn ngữ'],
  'a.lang_aria': ['Ngôn ngữ đang dùng: Tiếng Việt. Bấm để chuyển sang English', 'Current language: English. Tap to switch to Tiếng Việt', 'Chữ hiện khi rê chuột và đọc cho trình đọc màn hình ở nút VI | EN', 'Mọi trang có nút VI | EN'],
  'a.lang_wait': ['Đang gửi, đổi ngôn ngữ sau khi xong nhé.', 'Sending now. Switch language when it is done.', 'Thông báo nhỏ', 'Bấm VI | EN trong lúc đang đặt, huỷ, lưu hoặc gửi form'],
  'a.dow': ['Chủ nhật|Thứ 2|Thứ 3|Thứ 4|Thứ 5|Thứ 6|Thứ 7', 'Sun|Mon|Tue|Wed|Thu|Fri|Sat', 'Tên thứ trong nhãn ngày (ví dụ "Thứ 4 14/10"). Đúng 7 tên, bắt đầu từ Chủ nhật, cách nhau dấu |', 'Danh sách ngày đặt lịch, lịch học, lịch dạy'],
  'a.dow_short': ['CN|T2|T3|T4|T5|T6|T7', 'Sun|Mon|Tue|Wed|Thu|Fri|Sat', 'Tên thứ ngắn trên lưới giờ rảnh của tutor. Đúng 7 tên, bắt đầu từ Chủ nhật', 'Tab Giờ rảnh của cổng tutor'],
  'a.network_error': ['Không kết nối được. Kiểm tra mạng rồi thử lại.', 'Cannot connect. Check your network and try again.', 'Hộp báo đỏ hoặc thông báo nhỏ', 'Mất mạng hoặc Google không phản hồi'],
  'a.no_response': ['Không có phản hồi từ máy chủ.', 'No response from the server.', 'Hộp báo đỏ', 'Google trả về rỗng (rất hiếm)'],
  'a.retrying': ['Đang đông người, hệ thống đang tự thử lại...', 'Busy right now, retrying automatically...', 'Dải vàng ở cuối màn hình', 'Trang tự thử lại khi Google từ chối lượt gọi lúc đông người'],
  'a.maint_readonly': ['Đang bảo trì{until}: bạn vẫn xem được lịch, đặt và huỷ tạm dừng.', 'Maintenance{until}: you can view your schedule, changes are paused.', 'Dải báo ở đầu mọi trang. {until}: giờ ghi ở CONFIG MAINTENANCE_UNTIL', 'CONFIG MAINTENANCE_MODE = READONLY'],
  'a.maint_closed': ['Đang bảo trì{until}. Vui lòng quay lại sau.', 'Under maintenance{until}. Please come back later.', 'Dải báo ở đầu mọi trang', 'CONFIG MAINTENANCE_MODE = CLOSED'],
  'a.maint_title': ['Đang bảo trì', 'Under maintenance', 'Tiêu đề lớn của trang báo bảo trì', 'Cổng học viên hoặc tutor đóng vì MAINTENANCE_MODE = CLOSED'],
  'a.write_unknown': ['Mạng chập chờn: chưa chắc thao tác đã lưu. Trang đang tải lại để hiện đúng tình trạng.', 'Connection problem: not sure it was saved. Reloading to show the real status.', 'Thông báo nhỏ', 'Mất mạng khi đang đặt, huỷ, lưu, kể cả sau khi tự thử lại'],
  'a.write_maybe': ['Mạng chập chờn: chưa chắc đã gửi được. Kiểm tra email hoặc nhắn Zalo admin trước khi gửi lại.', 'Connection problem: not sure it was sent. Please check your email or message admin before sending again.', 'Hộp báo đỏ', 'Mất mạng khi gửi đăng ký hoặc hồ sơ (trang không tự tải lại)'],
  'a.session_expired': ['Phiên đăng nhập đã hết hạn.', 'Your session has expired.', 'Thông báo nhỏ, rồi chuyển về trang đăng nhập', 'Phiên đăng nhập hết hạn hoặc bị admin cho thoát'],
  'a.retry': ['Thử lại', 'Try again', 'Nút dưới câu báo lỗi khi trang không tải được', 'Mở trang bị lỗi mạng hoặc máy chủ'],
  'a.close': ['Đóng', 'Close', 'Nút đóng hộp thoại', 'Mọi hộp thoại chỉ có một nút'],
  'a.link_note_multi': ['Link dùng được nhiều lần, hết hạn sau {t}.', 'This link works several times and expires in {t}.', 'Trong email link đăng nhập. {t}: thời hạn (ví dụ 15 phút, 24 giờ); {m}: số phút', 'Link không giới hạn số lần bấm (mặc định từ 5J, mọi vai trò)'],
  'a.link_note_n': ['Link dùng được {n} lần, hết hạn sau {t}.', 'This link works {n} time(s) and expires in {t}.', 'Trong email link đăng nhập. {n}: số lần, {t}: thời hạn, {m}: số phút', 'CONFIG *_LINK_MAX_USES lớn hơn 0'],
  'a.dur_minutes': ['{m} phút', '{m} minutes', 'Thời hạn link trong câu {t} của a.link_note_*', 'Hạn link dưới 60 phút, hoặc không tròn giờ'],
  'a.dur_hours': ['{h} giờ', '{h} hours', 'Thời hạn link trong câu {t} của a.link_note_*', 'Hạn link tròn giờ (ví dụ admin 24 giờ)'],
  'a.via_link': ['link email', 'email link', 'Trong email "Có đăng nhập mới": cách đã đăng nhập', 'Admin đăng nhập bằng link email'],
  'a.zalo': ['Nhắn Zalo admin', 'Message admin on Zalo', 'Nút liên hệ ở mục Cần hỗ trợ của trang chủ, cổng học viên, cổng tutor', 'CONFIG có ADMIN_ZALO_URL'],
  'a.zalo_fab': ['Zalo', 'Zalo', 'Nút tròn nổi ở góc dưới bên phải', 'CONFIG có ADMIN_ZALO_URL (không hiện ở trang quản trị)'],
  'a.website': ['Website', 'Website', 'Nút liên hệ cạnh nút Zalo', 'CONFIG có SCHOOL_SITE_URL'],
  'a.home_aria': ['Về trang chủ thaiput', 'Go to thaiput home page', 'Đọc cho trình đọc màn hình khi chạm logo', 'Mọi trang'],
  'a.sending': ['Đang gửi...', 'Sending...', 'Chữ trên nút gửi trong lúc chờ', 'Sau khi bấm Gửi đăng ký, Gửi link, Gửi yêu cầu gia hạn'],
  'a.err_email': ['Email chưa đúng.', 'Email is not valid.', 'Hộp báo đỏ dưới form', 'Ô email sai dạng'],
  'a.err_phone': ['Số điện thoại tối đa 40 ký tự.', 'Phone number: up to 40 characters.', 'Hộp báo đỏ dưới form', 'Ô số điện thoại sai dạng'],
  'a.err_file': ['Vui lòng tải ảnh chụp chuyển khoản.', 'Please upload the payment screenshot.', 'Hộp báo đỏ dưới form', 'Gửi đăng ký mà chưa chọn ảnh'],
  'a.err_send': ['Chưa gửi được.', 'Could not send.', 'Hộp báo đỏ hoặc thông báo nhỏ', 'Gửi form không thành công, không có lý do cụ thể'],
  'a.file_none': ['Chưa chọn file', 'No file chosen', 'Hộp báo đỏ dưới form', 'Gửi mà chưa chọn ảnh'],
  'a.file_big': ['File quá lớn (tối đa 12MB).', 'File is too large (max 12MB).', 'Hộp báo đỏ dưới form', 'Ảnh chuyển khoản trên 12MB'],
  'a.file_read': ['Không đọc được file.', 'Cannot read the file.', 'Hộp báo đỏ dưới form', 'Ảnh hỏng hoặc trình duyệt chặn'],
  'a.price_contact': ['Liên hệ', 'Contact us', 'Chỗ giá tiền của gói', 'Gói có giá 0 trong tab PACKAGES'],
  'a.moved': ['thaiput đã chuyển sang trang mới, vui lòng dùng link:', 'thaiput has moved to a new page, please use this link:', 'Thanh báo đầu trang và trang báo bảo trì của hệ thống cũ', 'CONFIG MOVED_TO_URL có link (sau menu Chuyển hệ thống, Bước 1, 5L)'],
  'a.pkg_contact_note': ['Đăng ký gói này qua Zalo admin.', 'Arrange this package with admin on Zalo.', 'Dòng dưới gói có giá 0 (không chọn được trên web)', 'Gói có giá 0 trong tab PACKAGES (5K, BL06)'],
  'a.pkg_contact_btn': ['Nhắn Zalo admin', 'Message admin on Zalo', 'Nút ở gói có giá 0', 'Gói có giá 0 và CONFIG ADMIN_ZALO_URL có link'],
  'a.pkg_none': ['Hiện chưa có gói đăng ký trên web. Nhắn Zalo admin để được tư vấn.', 'No package can be booked on the website right now. Message admin on Zalo.', 'Thay danh sách gói khi không còn gói có giá', 'Mọi gói đang bán đều có giá 0'],
  'a.file_label': ['Tải ảnh chụp chuyển khoản', 'Upload payment screenshot', 'Nút chọn ảnh trong form đăng ký và form gia hạn', 'Luôn hiện trong form'],
  'a.file_chosen': ['Đã chọn: {name}', 'Selected: {name}', 'Dòng dưới nút chọn ảnh. {name}: tên file', 'Sau khi chọn ảnh'],
  // ── Trang chủ ──
  'h.btn_portal': ['Vào lịch của tôi', 'My schedule', 'Nút góc trên bên phải trang chủ', 'Người xem đang đăng nhập'],
  'h.btn_login': ['Đăng nhập', 'Log in', 'Nút góc trên bên phải trang chủ', 'Người xem chưa đăng nhập'],
  'h.pkg_trial': ['{n} buổi trong {d} ngày', '{n} lessons within {d} days', 'Dòng mô tả dưới tên gói Trial. {n}: số buổi, {d}: số ngày', 'Danh sách gói ở form đăng ký'],
  'h.pkg_days': ['Không giới hạn số buổi trong {d} ngày, tối đa 1 buổi/ngày', 'Unlimited lessons for {d} days, up to 1 per day', 'Dòng mô tả dưới tên gói theo ngày. {d}: số ngày', 'Danh sách gói ở form đăng ký'],
  'h.pkg_sessions': ['{n} buổi', '{n} lessons', 'Dòng mô tả dưới tên gói theo buổi', 'Danh sách gói ở form đăng ký'],
  'h.bank_title': ['Chuyển khoản', 'Bank transfer', 'Tiêu đề khung thông tin chuyển khoản', 'CONFIG có thông tin ngân hàng'],
  'h.bank_note': ['Nội dung chuyển khoản: email đăng ký và tên gói. Sau khi gửi form, bạn nhận mã nội dung riêng qua email để đối chiếu.', 'Transfer note: your email and the package name. After sending the form, you get your own reference code by email.', 'Dòng dưới thông tin ngân hàng', 'Cùng khung chuyển khoản'],
  'h.hero_th': ['ฝึกพูดภาษาไทย', 'ฝึกพูดภาษาไทย', 'Chữ Thái nhỏ phía trên tiêu đề lớn', 'Luôn hiện'],
  'h.hero_title': ['Luyện nói tiếng Thái 1:1 với người bản xứ', '1:1 Thai speaking practice with native tutors', 'Tiêu đề lớn đầu trang chủ', 'Luôn hiện'],
  'h.hero_sub': ['Chọn giờ rảnh, hệ thống tự xếp tutor và gửi link Google Meet vào email của bạn.', 'Pick a time, the system assigns a tutor and sends the Google Meet link to your email.', 'Dòng giới thiệu dưới tiêu đề lớn', 'Luôn hiện'],
  'h.fact1_big': ['25′', '25′', 'Số lớn ở ô thông tin thứ nhất', 'Luôn hiện'],
  'h.fact1': ['mỗi buổi, slot 30 phút', 'per lesson, 30 minute slot', 'Chữ nhỏ dưới số lớn ở ô thứ nhất', 'Luôn hiện'],
  'h.fact2_big': ['08–24h', '08–24h', 'Số lớn ở ô thông tin thứ hai', 'Luôn hiện'],
  'h.fact2': ['mỗi ngày', 'every day', 'Chữ nhỏ ở ô thứ hai', 'Luôn hiện'],
  'h.fact3_deadline': ['hạn đặt và huỷ cho ngày mai', 'deadline to book or cancel for tomorrow', 'Chữ nhỏ ở ô thứ ba', 'Đang dùng luật 15:00 hôm trước'],
  'h.fact3_lead': ['đặt trước giờ học', 'book ahead of the lesson', 'Chữ nhỏ ở ô thứ ba', 'Bật BOOKING_LEAD_HOURS hoặc BOOK_UNTIL_START'],
  'h.fact3_lead_zero': ['Sát giờ', 'Last minute', 'Số lớn ở ô thứ ba', 'Đặt được tới trước giờ học'],
  'h.form_title': ['Đăng ký gói học', 'Register for a package', 'Tiêu đề form đăng ký', 'Luôn hiện'],
  'h.pkg_aria': ['Chọn gói', 'Choose a package', 'Đọc cho trình đọc màn hình ở danh sách gói', 'Luôn hiện'],
  'h.f_name': ['Họ và tên', 'Full name', 'Nhãn ô nhập trong form đăng ký', 'Luôn hiện'],
  'h.f_email': ['Email', 'Email', 'Nhãn ô nhập', 'Luôn hiện'],
  'h.f_email_hint': ['Dùng email bạn sẽ vào Google Meet để không phải chờ duyệt.', 'Use the email you will join Google Meet with, so you are let in straight away.', 'Dòng gợi ý dưới ô email', 'Luôn hiện'],
  'h.f_phone': ['Số điện thoại hoặc liên hệ (Zalo, WhatsApp, Line), không bắt buộc', 'Phone or contact (Zalo, WhatsApp, Line), optional', 'Nhãn ô nhập', 'Luôn hiện'],
  'h.f_phone_ph': ['Ví dụ 0912 345 678, +66 81 234 5678', 'For example 0912 345 678, +66 81 234 5678', 'Chữ mờ trong ô số điện thoại', 'Ô còn trống'],
  'h.f_phone_hint': ['Ghi theo cách bạn quen dùng, không cần định dạng. Số Việt Nam sẽ có link Zalo cho admin.', 'Write it any way you like, no format needed. A Vietnam number gets a Zalo link for admin.', 'Dòng gợi ý dưới ô số điện thoại', 'Luôn hiện'],
  'h.f_phone_bad': ['Tối đa 40 ký tự.', 'Up to 40 characters.', 'Dòng đỏ dưới ô số điện thoại', 'Rời ô khi số sai dạng'],
  'h.f_level': ['Trình độ hiện tại', 'Current level', 'Nhãn ô chọn', 'Luôn hiện'],
  'h.levels': ['Mới bắt đầu|Sơ cấp|Trung cấp|Khá', 'Beginner|Elementary|Intermediate|Advanced', 'Các lựa chọn trình độ, cách nhau dấu |. Hai thứ tiếng phải cùng số lựa chọn, cùng thứ tự (Sheets luôn lưu bản tiếng Việt)', 'Form đăng ký, tab Tài khoản của học viên'],
  'h.f_consent': ['Tôi đồng ý để thaiput lưu họ tên, email, số điện thoại và ảnh chuyển khoản để quản lý lịch học', 'I agree that thaiput stores my name, email, phone and payment screenshot to manage my lessons', 'Ô tick cuối form', 'Luôn hiện'],
  'h.f_policy': ['chính sách', 'policy', 'Chữ link tới trang chính sách', 'CONFIG có POLICY_URL'],
  'h.f_submit': ['Gửi đăng ký', 'Send registration', 'Nút cuối form', 'Luôn hiện'],
  'h.help': ['Cần hỗ trợ?', 'Need help?', 'Tiêu đề mục liên hệ cuối trang', 'CONFIG có Zalo hoặc website'],
  'h.err_name': ['Nhập họ và tên.', 'Enter your full name.', 'Hộp báo đỏ dưới form', 'Gửi khi ô tên trống'],
  'h.err_consent': ['Vui lòng đồng ý chính sách xử lý dữ liệu cá nhân.', 'Please accept the data policy.', 'Hộp báo đỏ dưới form', 'Gửi khi chưa tick ô đồng ý'],
  'h.done_title': ['Đã nhận đăng ký', 'Registration received', 'Tiêu đề khung xanh sau khi gửi', 'Gửi đăng ký thành công'],
  'h.done_code': ['Mã nội dung chuyển khoản của bạn:', 'Your transfer reference:', 'Dòng trước mã chuyển khoản', 'Gửi đăng ký thành công'],
  'h.done_note': ['Admin sẽ xác nhận trong giờ làm việc và gửi link đăng nhập qua email {email}. Nhớ kiểm tra cả mục Spam.', 'Admin will confirm during working hours and send your login link to {email}. Please also check Spam.', 'Dòng cuối khung xanh. {email}: email đã nhập', 'Gửi đăng ký thành công'],
  // ── Đăng nhập ──
  'l.btn_home': ['Trang chủ', 'Home', 'Nút góc trên bên phải trang đăng nhập', 'Luôn hiện'],
  'l.title': ['Đăng nhập', 'Log in', 'Tiêu đề lớn', 'Luôn hiện'],
  'l.intro': ['Nhập email đã đăng ký. Bạn sẽ nhận link đăng nhập, không cần mật khẩu.', 'Enter your registered email. You will get a login link, no password needed.', 'Dòng dưới tiêu đề. Có thể dùng thẻ <br>', 'Luôn hiện'],
  'l.submit': ['Gửi link đăng nhập', 'Send login link', 'Nút dưới ô email', 'Luôn hiện'],
  'l.storage_warn': ['Trình duyệt đang chặn lưu đăng nhập trong trang nhúng, bạn có thể phải đăng nhập lại mỗi lần mở. Mở trang toàn màn hình để giữ đăng nhập.', 'Your browser blocks saving the login inside this embedded page, so you may need to log in each time. Open the page full screen to stay logged in.', 'Hộp vàng dưới form', 'Trình duyệt chặn bộ nhớ (thường gặp khi nhúng trong Google Sites)'],
  'l.sent': ['Nếu email có trong hệ thống, link đăng nhập đã được gửi. Kiểm tra hộp thư (cả mục Spam). Hạn dùng ghi trong thư. Mỗi email xin link 1 lần mỗi giờ.', 'If the email is registered, a login link has been sent. Check your inbox (and Spam). The time limit is in the email. Each email can request a link once per hour.', 'Hộp xanh sau khi bấm gửi', 'Bấm Gửi link đăng nhập (không cho biết email có hay không)'],
  'l.signing': ['Đang đăng nhập...', 'Signing in...', 'Chữ giữa màn hình', 'Vừa mở link đăng nhập trong email'],
  'l.fail': ['Không đăng nhập được', 'Sign in failed', 'Tiêu đề lớn', 'Link đăng nhập sai, đã dùng, hết hạn'],
  'l.again': ['Yêu cầu gửi lại liên kết đăng nhập mới', 'Request a new login link', 'Nút dưới hộp báo lỗi', 'Đăng nhập bằng link không thành công'],
  'l.google': ['Admin: đăng nhập bằng tài khoản Google', 'Admin: sign in with Google', 'Nút dưới form email', 'CONFIG có GOOGLE_LOGIN_URL'],
  'l.google_note': ['Mở ở thẻ mới; đăng nhập xong, trang quản trị mở ở thẻ đó. Dùng đúng tài khoản Google đã đăng ký với thaiput. Trình duyệt có nhiều tài khoản Google thì mở cửa sổ ẩn danh.', 'Opens in a new tab; after signing in, the admin page opens there. Use the Google account registered with thaiput. If your browser has several Google accounts, use a private window.', 'Dòng nhỏ dưới nút Google', 'Cùng nút Google'],
  'l.google_wait': ['Đang đăng nhập bằng Google...', 'Signing in with Google...', 'Chữ giữa màn hình', 'Vừa quay về từ trang đăng nhập Google'],
  'l.google_bad': ['Link đăng nhập Google không hợp lệ. Mở lại nút đăng nhập Google.', 'The Google sign in link is not valid. Open the Google sign in button again.', 'Hộp báo đỏ', 'Link quay về từ Google sai dạng'],
  // ── Cổng học viên ──
  's.pill_active': ['Đang dùng', 'Active', 'Nhãn tròn trên thẻ gói học', 'Gói đang chạy'], 's.pill_inactive': ['Chưa kích hoạt', 'Not started', 'Nhãn tròn trên thẻ gói học', 'Gói chưa học buổi nào'],
  's.pill_queued': ['Nối tiếp', 'Queued', 'Nhãn tròn trên thẻ gói học', 'Gói mua thêm, chờ gói hiện tại hết'], 's.pill_expired': ['Hết hạn', 'Expired', 'Nhãn tròn trên thẻ gói học', 'Gói đã hết hạn'],
  's.pass_label': ['Gói học', 'Package', 'Chữ nhỏ đầu thẻ gói học', 'Có gói'],
  's.pass_from': ['Từ', 'From', 'Nhãn ngày bắt đầu trên thẻ gói học', 'Gói đã bắt đầu'], 's.pass_to': ['Đến', 'To', 'Nhãn ngày kết thúc trên thẻ gói học', 'Gói đã bắt đầu'],
  's.pass_inactive': ['Gói bắt đầu tính từ ngày bạn học buổi đầu tiên.', 'Your package starts counting from your first lesson.', 'Dòng trên thẻ gói học', 'Gói chưa học buổi nào'],
  's.pass_left': ['Còn {left}/{total} buổi', '{left}/{total} lessons left', 'Dòng trên thẻ gói học', 'Gói tính theo số buổi (Trial, gói buổi)'],
  's.pass_daily': ['Tối đa 1 buổi/ngày', 'Up to 1 lesson per day', 'Dòng trên thẻ gói học', 'Gói theo ngày'],
  's.no_package': ['Bạn chưa có gói học. Đăng ký gói ở tab Tài khoản.', 'You have no package yet. Register one in the Account tab.', 'Hộp vàng đầu cổng', 'Tài khoản chưa có gói'],
  's.range': ['{from} đến {to}', '{from} to {to}', 'Khoảng ngày trên thẻ gói', 'Có gói'],
  's.logout': ['Thoát', 'Log out', 'Nút góc trên bên phải', 'Luôn hiện'],
  's.needs_phone': ['Vui lòng bổ sung số điện thoại ở tab Tài khoản để admin liên hệ khi cần.', 'Please add your phone number in the Account tab so admin can reach you.', 'Hộp vàng đầu cổng', 'Hồ sơ chưa có số điện thoại'],
  's.me_phone_ph': ['Ví dụ 0912 345 678, +66 81 234 5678', 'For example 0912 345 678, +66 81 234 5678', 'Chữ mờ trong ô số điện thoại ở tab Tài khoản', 'Ô còn trống'],
  's.suspended': ['Tài khoản đang tạm khoá: bạn xem được lịch nhưng chưa đặt được buổi mới. Nhắn Zalo admin để được hỗ trợ.', 'Your account is suspended: you can view your schedule but cannot book new lessons. Message admin on Zalo for help.', 'Hộp vàng đầu cổng', 'USERS.status = SUSPENDED'],
  's.btn_book': ['Đặt lịch', 'Book', 'Nút trên thẻ gói học', 'Có gói dùng được'],
  's.nav_aria': ['Điều hướng', 'Navigation', 'Đọc cho trình đọc màn hình ở thanh tab', 'Luôn có'],
  's.tab_book': ['Đặt lịch', 'Book', 'Tab thứ nhất (thanh dưới trên điện thoại, cột trái trên máy tính)', 'Luôn hiện'],
  's.tab_lessons': ['Lịch của tôi', 'My lessons', 'Tab thứ hai', 'Luôn hiện'], 's.tab_account': ['Tài khoản', 'Account', 'Tab thứ ba', 'Luôn hiện'],
  's.book_title': ['Chọn buổi học', 'Choose your lessons', 'Tiêu đề tab Đặt lịch', 'Mở tab Đặt lịch'],
  's.book_per_day': ['Mỗi ngày 1 buổi', '1 lesson per day', 'Nhãn nhỏ cạnh tiêu đề', 'Gói theo ngày'],
  's.book_empty': ['Hiện chưa có slot nào còn đặt được. Tutor mở lịch tuần sau vào cuối tuần này; quay lại sau nhé.', 'No open slots right now. Tutors open next week at the end of this week; please check back later.', 'Hộp báo trong tab Đặt lịch', 'Không còn slot nào đặt được'],
  's.day_booked': ['Đã có buổi', 'Booked', 'Nhãn bên phải mỗi ngày', 'Ngày đó đã có buổi (gói 1 buổi mỗi ngày)'],
  's.day_free': ['{n} giờ trống', '{n} open', 'Nhãn bên phải mỗi ngày. {n}: số giờ còn trống', 'Ngày còn slot'],
  's.rule_until_start': ['Đặt được tới <b>trước giờ học</b>. Huỷ phải trước <b>{cancel}</b> hôm trước, sau giờ đó (kể cả buổi đặt sát giờ) buổi học vẫn được tính.', 'You can book until <b>the lesson starts</b>. Cancel before <b>{cancel}</b> the day before; after that (including last minute bookings) the lesson is counted.', 'Khung luật dưới tiêu đề tab Đặt lịch', 'CONFIG BOOK_UNTIL_START = TRUE'],
  's.rule_lead': ['Đặt trước giờ học ít nhất <b>{hours} tiếng</b>. Huỷ phải trước <b>{cancel}</b> hôm trước, sau giờ đó (kể cả buổi đặt sát giờ) buổi học vẫn được tính.', 'Book at least <b>{hours} hour(s)</b> before the lesson. Cancel before <b>{cancel}</b> the day before; after that the lesson is counted.', 'Khung luật dưới tiêu đề tab Đặt lịch', 'CONFIG BOOKING_LEAD_HOURS lớn hơn 0'],
  's.rule_day_before': ['Đặt cho ngày mai trước <b>{cutoff}</b> hôm nay. Huỷ cũng phải trước {cancel} hôm trước, sau giờ đó buổi học vẫn được tính.', 'Book tomorrow\'s lessons before <b>{cutoff}</b> today. Cancel before {cancel} the day before; after that the lesson is counted.', 'Khung luật dưới tiêu đề tab Đặt lịch', 'Luật mặc định 15:00 hôm trước'],
  's.bar_selected': ['{n} buổi đã chọn', '{n} selected', 'Thanh dưới cùng tab Đặt lịch', 'Đã chọn ít nhất 1 giờ'],
  's.bar_book': ['Đặt {n} buổi', 'Book {n}', 'Nút trên thanh dưới cùng', 'Đã chọn ít nhất 1 giờ'],
  's.booking': ['Đang đặt...', 'Booking...', 'Chữ trên nút trong lúc chờ', 'Sau khi bấm Đặt'],
  's.err_book': ['Chưa đặt được.', 'Could not book.', 'Thông báo nhỏ', 'Đặt không thành công, không có lý do cụ thể'],
  's.res_ok': ['Đã đặt', 'Booked', 'Nhãn xanh trong hộp kết quả', 'Buổi đặt thành công'], 's.res_bad': ['Chưa đặt được', 'Not booked', 'Nhãn đỏ trong hộp kết quả', 'Buổi đặt không thành công'],
  's.tutor_prefix': ['Tutor', 'Tutor', 'Chữ trước tên tutor', 'Hộp kết quả, Lịch của tôi'],
  's.res_title_ok': ['Đã đặt {n} buổi', '{n} lesson(s) booked', 'Tiêu đề hộp kết quả', 'Có ít nhất 1 buổi thành công'],
  's.res_title_none': ['Chưa đặt được buổi nào', 'No lessons booked', 'Tiêu đề hộp kết quả', 'Không buổi nào thành công'],
  's.res_meet_note': ['Email xác nhận đã gửi. Link Google Meet có trong thư mời Google Calendar và ở mục Lịch của tôi, trước giờ học.', 'A confirmation email has been sent. The Google Meet link comes with the Google Calendar invitation and appears in My lessons before the lesson.', 'Dòng cuối hộp kết quả', 'Có ít nhất 1 buổi thành công'],
  's.meet_pending': ['Link Meet sẽ có trong thư mời Google Calendar trước giờ học.', 'The Meet link comes with the Google Calendar invitation before the lesson.', 'Dòng nhỏ ở mỗi buổi sắp tới', 'Buổi chưa có sự kiện Calendar (hàng đợi)'],
  's.meet_pending_at': ['Link Meet có trong thư mời Google Calendar, gửi khoảng {when}.', 'The Meet link comes with the Google Calendar invitation, around {when}.', 'Dòng nhỏ ở mỗi buổi sắp tới. {when}: giờ ngày dự kiến', 'Như trên, khi biết giờ dự kiến'],
  's.res_go_lessons': ['Xem lịch của tôi', 'See my lessons', 'Nút trong hộp kết quả', 'Sau khi đặt'], 's.res_more': ['Đặt thêm', 'Book more', 'Nút trong hộp kết quả', 'Sau khi đặt'],
  's.join': ['Vào phòng', 'Join', 'Nút xanh ở buổi sắp tới', 'Buổi đã có link Meet'], 's.cancel': ['Huỷ buổi', 'Cancel', 'Nút ở buổi sắp tới', 'Còn trong hạn huỷ'], 's.cancelling': ['Đang huỷ...', 'Cancelling...', 'Chữ trên nút trong lúc chờ', 'Sau khi bấm Huỷ'],
  's.cancel_passed': ['Hạn huỷ đã qua ({deadline})', 'Cancellation deadline passed ({deadline})', 'Dòng nhỏ thay nút Huỷ', 'Quá hạn huỷ'],
  's.upcoming': ['Sắp tới', 'Upcoming', 'Tiêu đề mục trong tab Lịch của tôi', 'Luôn hiện'],
  's.upcoming_empty': ['Chưa có buổi nào sắp tới. Chọn giờ ở tab Đặt lịch.', 'No upcoming lessons. Pick a time in the Book tab.', 'Dòng thay danh sách', 'Không có buổi sắp tới'],
  's.history': ['Lịch sử', 'History', 'Tiêu đề mục', 'Luôn hiện'], 's.history_empty': ['Chưa có buổi nào.', 'No lessons yet.', 'Dòng thay danh sách', 'Chưa có buổi nào đã qua'],
  's.tutor_issue': ['Tutor vắng hoặc có vấn đề?', 'Tutor absent or a problem?', 'Tiêu đề mục liên hệ cuối tab Lịch của tôi', 'Luôn hiện'],
  's.cancel_q': ['Huỷ buổi {date} lúc {slot}?', 'Cancel the lesson on {date} at {slot}?', 'Tiêu đề hộp hỏi lại', 'Bấm Huỷ buổi'],
  's.cancel_note': ['Huỷ trước 15:00 hôm trước thì buổi không bị tính. Sự kiện trên Google Calendar cũng được huỷ.', 'Cancelling before 15:00 the day before does not count the lesson. The Google Calendar event is also cancelled.', 'Dòng trong hộp hỏi lại', 'Bấm Huỷ buổi'],
  's.cancel_yes': ['Huỷ buổi này', 'Cancel this lesson', 'Nút đỏ trong hộp hỏi lại', 'Bấm Huỷ buổi'], 's.cancel_no': ['Giữ lại', 'Keep it', 'Nút trong hộp hỏi lại', 'Bấm Huỷ buổi'],
  's.cancel_done': ['Đã huỷ buổi {date} {slot}', 'Cancelled {date} {slot}', 'Thông báo nhỏ', 'Huỷ thành công'],
  's.err_cancel': ['Chưa huỷ được.', 'Could not cancel.', 'Thông báo nhỏ', 'Huỷ không thành công'],
  's.me_title': ['Thông tin của tôi', 'My details', 'Tiêu đề form hồ sơ ở tab Tài khoản', 'Luôn hiện'],
  's.me_name': ['Tên hiển thị', 'Display name', 'Nhãn ô nhập', 'Luôn hiện'], 's.me_phone': ['Số điện thoại (Zalo)', 'Phone (Zalo)', 'Nhãn ô nhập', 'Luôn hiện'], 's.me_level': ['Trình độ', 'Level', 'Nhãn ô chọn', 'Luôn hiện'],
  's.me_save': ['Lưu thay đổi', 'Save changes', 'Nút cuối form hồ sơ', 'Luôn hiện'], 's.me_saved': ['Đã lưu thông tin', 'Saved', 'Thông báo nhỏ', 'Lưu hồ sơ thành công'], 's.err_save': ['Chưa lưu được.', 'Could not save.', 'Thông báo nhỏ', 'Lưu hồ sơ không thành công'],
  's.renew_title': ['Gia hạn hoặc mua thêm gói', 'Renew or buy another package', 'Tiêu đề form gia hạn', 'Luôn hiện ở tab Tài khoản'],
  's.renew_submit': ['Gửi yêu cầu gia hạn', 'Send renewal request', 'Nút cuối form gia hạn', 'Luôn hiện'],
  's.renew_note': ['Gói mới tự nối tiếp ngay sau gói hiện tại, không mất ngày nào.', 'The new package starts right after your current one, no days lost.', 'Dòng dưới tiêu đề form gia hạn', 'Luôn hiện'],
  's.renew_pick': ['Chọn gói muốn gia hạn.', 'Choose a package to renew.', 'Thông báo nhỏ', 'Gửi khi chưa chọn gói'],
  's.renew_done_title': ['Đã gửi yêu cầu gia hạn', 'Renewal request sent', 'Tiêu đề hộp sau khi gửi', 'Gửi gia hạn thành công'],
  's.renew_done_code': ['Mã nội dung chuyển khoản:', 'Transfer reference:', 'Dòng trước mã chuyển khoản', 'Gửi gia hạn thành công'],
  's.renew_done_note': ['Admin xác nhận xong, gói mới hiện ở đầu trang.', 'Once admin confirms, the new package shows at the top.', 'Dòng cuối hộp', 'Gửi gia hạn thành công'],
  's.contact_title': ['Liên hệ admin', 'Contact admin', 'Tiêu đề mục liên hệ ở tab Tài khoản', 'Luôn hiện'],
  's.logout_full': ['Đăng xuất', 'Log out', 'Nút cuối tab Tài khoản', 'Luôn hiện'],
  // ── Nhãn trạng thái buổi học (cổng học viên) ──
  'st.awaiting': ['Chờ tutor xác nhận', 'Waiting for tutor', 'Nhãn tròn ở mỗi buổi trong Lịch của tôi', 'Buổi đã diễn ra, tutor chưa chọn kết quả'],
  'st.CONFIRMED': ['Xác nhận', 'Confirmed', 'Nhãn tròn ở mỗi buổi', 'Buổi sắp tới đã đặt'], 'st.PENDING_REASSIGN': ['Chờ xác nhận', 'Pending', 'Nhãn tròn ở mỗi buổi', 'Tutor xin huỷ, admin đang xếp người thay'],
  'st.COMPLETED': ['Hoàn thành', 'Completed', 'Nhãn tròn ở mỗi buổi', 'Buổi đã học'],
  'st.STUDENT_ABSENT': ['Vắng học viên', 'Student absent', 'Nhãn tròn ở mỗi buổi', 'Tutor báo học viên vắng'], 'st.TECH_ISSUE': ['Vấn đề kỹ thuật', 'Technical issue', 'Nhãn tròn ở mỗi buổi', 'Tutor báo lỗi kỹ thuật'],
  'st.TUTOR_ABSENT': ['Vắng tutor', 'Tutor absent', 'Nhãn tròn ở mỗi buổi', 'Admin ghi tutor vắng'],
  'st.CANCELLED_STUDENT': ['Huỷ bởi học viên', 'Cancelled by you', 'Nhãn tròn ở mỗi buổi', 'Học viên huỷ'], 'st.CANCELLED_TUTOR': ['Huỷ bởi tutor', 'Cancelled by tutor', 'Nhãn tròn ở mỗi buổi', 'Tutor huỷ được duyệt'],
  'st.CANCELLED_ADMIN': ['Huỷ bởi admin', 'Cancelled by admin', 'Nhãn tròn ở mỗi buổi', 'Admin huỷ'],
  'st.NOT_COMPLETED': ['Trường đang kiểm tra', 'Under review', 'Nhãn tròn ở mỗi buổi (trang học viên)', 'Buổi Không hoàn thành: tutor không chọn kết quả sau RESULT_EXPIRE_AFTER_HOURS giờ. Học viên thấy nhãn trung tính, buổi vẫn tính là đã dùng tới khi trường làm rõ'],
  's.week_banner_title': ['Đã có giờ học tuần sau', 'Next week is open for booking', 'Chữ đậm ở hộp xanh đầu trang học viên', 'Từ STUDENT_WEEK_BANNER_FROM tới 00:00 thứ Hai, khi tuần sau đã có giờ còn đặt được'],
  's.week_banner': ['Tuần bắt đầu thứ Hai {monday} đã có giờ trống. Buổi thứ Hai phải đặt trước {cutoff} Chủ nhật.', 'The week starting Monday {monday} has open slots. Monday lessons must be booked before {cutoff} on Sunday.', 'Dòng dưới tiêu đề hộp xanh. {monday}: ngày, {cutoff}: giờ hạn đặt', 'Cùng hộp xanh'],
  's.week_banner_btn': ['Đặt lịch tuần sau', 'Book next week', 'Nút trong hộp xanh', 'Cùng hộp xanh'],
  's.week_banner_seen': ['Đã xem', 'Got it', 'Nút ẩn hộp xanh trên thiết bị này', 'Cùng hộp xanh'],
  'st.CANCELLED_LATE': ['Huỷ muộn (tính là đã học)', 'Cancelled late (counted)', 'Nhãn tròn ở mỗi buổi', 'Admin huỷ từ 15:00 hôm trước theo yêu cầu học viên'],
  // Chunk 5M: bù buổi trên thẻ gói của học viên
  's.comp_note': ['Đã cộng {days} ngày bù. Hạn mới: {end}', '{days} make up days added. New end date: {end}', 'Dòng nhỏ dưới hạn gói trên thẻ gói', 'Gói có ngày bù (buổi lỗi phía trường, hoặc admin cộng)'],
  's.start_pending': ['Gói bắt đầu tính từ buổi học hoàn chỉnh đầu tiên', 'The package starts on your first completed lesson', 'Dòng nhỏ dưới ngày bắt đầu trên thẻ gói', 'Gói theo ngày chưa có buổi hoàn chỉnh đầu tiên (ngày bắt đầu còn tạm tính)'],
  // Lý do trong email COMP_EXTENDED (biến reason). Không nêu tên tutor.
  'comp.reason.TUTOR_ABSENT': ['tutor vắng', 'the tutor was absent', 'Biến {{reason}} trong email COMP_EXTENDED', 'Buổi được bù vì Vắng tutor'],
  'comp.reason.CANCELLED_TUTOR': ['tutor bận, không có người thay', 'the tutor was unavailable and no substitute was found', 'Biến {{reason}} trong email COMP_EXTENDED', 'Buổi được bù vì tutor huỷ, không có người thay'],
  'comp.reason.CANCELLED_ADMIN': ['trường huỷ buổi', 'the school cancelled the lesson', 'Biến {{reason}} trong email COMP_EXTENDED', 'Buổi được bù vì admin huỷ trước 15:00 hôm trước'],
  'comp.reason.TECH_TUTOR': ['sự cố kỹ thuật phía trường', 'a technical issue on our side', 'Biến {{reason}} trong email COMP_EXTENDED', 'Buổi kỹ thuật, lỗi tutor'],
  'comp.reason.TECH_OBJECTIVE': ['sự cố kỹ thuật ngoài ý muốn', 'an unexpected technical issue', 'Biến {{reason}} trong email COMP_EXTENDED', 'Buổi kỹ thuật, lỗi khách quan'],
  // ── Cổng tutor ──
  't.logout': ['Thoát', 'Log out', 'Nút góc trên bên phải', 'Luôn hiện'], 't.save': ['Lưu', 'Save', 'Nút lưu giờ rảnh', 'Có thay đổi chưa lưu'], 't.saving': ['Đang lưu...', 'Saving...', 'Chữ trên nút trong lúc chờ', 'Sau khi bấm Lưu'],
  't.nav_aria': ['Điều hướng', 'Navigation', 'Đọc cho trình đọc màn hình ở thanh tab', 'Luôn có'],
  't.tab_schedule': ['Lịch dạy', 'Schedule', 'Tab thứ nhất', 'Luôn hiện'], 't.tab_avail': ['Giờ rảnh', 'Availability', 'Tab thứ hai', 'Luôn hiện'], 't.tab_confirm': ['Cần xác nhận', 'To confirm', 'Tab thứ ba', 'Luôn hiện'],
  't.upcoming': ['Buổi dạy sắp tới', 'Upcoming lessons', 'Tiêu đề tab Lịch dạy', 'Luôn hiện'],
  't.open_meet': ['Mở Meet', 'Open Meet', 'Nút xanh ở mỗi buổi', 'Buổi đã có link Meet'],
  't.upcoming_empty': ['Chưa có buổi dạy sắp tới. Mở thêm giờ ở tab Giờ rảnh.', 'No upcoming lessons yet. Open more slots in Availability.', 'Dòng thay danh sách', 'Không có buổi sắp tới'],
  't.help': ['Cần hỗ trợ?', 'Need help?', 'Tiêu đề mục liên hệ', 'Luôn hiện'],
  't.avail_title': ['Giờ rảnh', 'Availability', 'Tiêu đề tab Giờ rảnh', 'Luôn hiện'],
  't.this_week': ['Tuần này', 'This week', 'Nút chọn tuần', 'Luôn hiện'], 't.next_week': ['Tuần sau', 'Next week', 'Nút chọn tuần', 'Luôn hiện'],
  't.deadline': ['Hạn chốt lịch tuần {week}: <b class="mono">{deadline}</b>', 'Deadline for the week of {week}: <b class="mono">{deadline}</b>', 'Dòng dưới nút chọn tuần', 'Luôn hiện'],
  't.deadline_passed': ['. Vẫn <b>thêm</b> được giờ; bỏ giờ lúc này cần admin duyệt.', '. You can still <b>add</b> slots; removing a slot now needs admin approval.', 'Nối sau dòng hạn chốt', 'Đã qua hạn chốt'],
  't.deadline_open': ['. Thêm hoặc bỏ giờ tự do trước hạn chốt.', '. Add or remove slots freely before the deadline.', 'Nối sau dòng hạn chốt', 'Chưa tới hạn chốt'],
  't.legend': ['Rảnh|Có học viên|Chờ duyệt|Đã khoá|Nghỉ', 'Open|Booked|Pending|Blocked|Off', 'Chú thích màu dưới lưới, đúng 5 chữ cách nhau dấu |', 'Luôn hiện'],
  't.copy_day': ['Chép ngày này sang các ngày còn lại trong tuần', 'Copy this day to the rest of the week', 'Nút dưới mỗi ngày', 'Luôn hiện'],
  't.copied': ['Đã chép. Xem lại rồi bấm Lưu.', 'Copied. Review, then tap Save.', 'Thông báo nhỏ', 'Sau khi chép ngày'],
  't.blocked': ['Yêu cầu huỷ đã được duyệt: giờ này bị khoá. Nhắn Zalo admin để mở lại.', 'Cancellation approved: this slot is locked. Message admin on Zalo to reopen.', 'Thông báo nhỏ', 'Chạm vào giờ đã khoá'],
  't.cancel_q': ['Xin huỷ giờ {slot}?', 'Request to cancel {slot}?', 'Tiêu đề hộp hỏi lại', 'Bỏ giờ đã có học viên'],
  't.cancel_note': ['Giờ này đã có học viên. Admin phải duyệt; nếu duyệt, tutor khác sẽ dạy thay. Trong lúc chờ, hãy chuẩn bị dạy như bình thường.', 'A student is booked in this slot. Admin must approve; if approved, another tutor takes the lesson. Until then, please plan to teach it.', 'Dòng trong hộp hỏi lại', 'Bỏ giờ đã có học viên'],
  't.cancel_yes': ['Gửi yêu cầu huỷ', 'Request cancellation', 'Nút đỏ trong hộp hỏi lại', 'Bỏ giờ đã có học viên'], 't.cancel_no': ['Giữ giờ này', 'Keep slot', 'Nút trong hộp hỏi lại', 'Bỏ giờ đã có học viên'],
  't.count_open': ['{n} giờ rảnh', '{n} open', 'Nhãn mỗi ngày', 'Ngày có giờ rảnh'], 't.count_off': ['nghỉ', 'off', 'Nhãn mỗi ngày', 'Ngày không mở giờ nào'],
  't.changes': ['{n} thay đổi', '{n} change(s)', 'Thanh dưới cùng tab Giờ rảnh', 'Có thay đổi chưa lưu'],
  't.err_save': ['Chưa lưu được.', 'Could not save.', 'Thông báo nhỏ', 'Lưu không thành công'],
  't.saved': ['Đã lưu', 'Saved', 'Thông báo nhỏ', 'Lưu thành công'],
  't.saved_open': ['Đã mở {n} giờ', '{n} slot(s) opened', 'Dòng trong hộp kết quả', 'Sau khi lưu'], 't.saved_removed': ['Đã bỏ {n} giờ', '{n} slot(s) removed', 'Dòng trong hộp kết quả', 'Sau khi lưu'],
  't.saved_pending': ['{n} yêu cầu bỏ giờ đã gửi admin duyệt', '{n} removal(s) sent to admin for approval', 'Dòng trong hộp kết quả', 'Sau khi lưu, có giờ đã có học viên'],
  't.saved_bad': ['{n} thay đổi không được nhận (giờ đã qua, quá 4 tuần, hoặc giờ bị khoá)', '{n} change(s) not allowed (time already passed, more than 4 weeks ahead, or slot locked)', 'Dòng trong hộp kết quả', 'Sau khi lưu, có thay đổi bị từ chối'],
  't.confirm_title': ['Xác nhận buổi đã dạy', 'Confirm finished lessons', 'Tiêu đề tab Cần xác nhận', 'Luôn hiện'],
  't.confirm_note': ['Chọn kết quả cho từng buổi, kiểm tra rồi bấm Lưu. Quá {notice} giờ sau giờ học chưa chọn thì buổi bị báo đỏ cho admin; quá {expire} giờ thì thành Không hoàn thành và không tính lương.', 'Choose a result for each lesson, check, then tap Save. If no result {notice} hours after the lesson, admin is alerted in red; after {expire} hours the lesson becomes Not completed and is not paid.', 'Dòng dưới tiêu đề. {notice}, {expire}: CONFIG RESULT_NOTICE_AFTER_HOURS, RESULT_EXPIRE_AFTER_HOURS', 'Luôn hiện'],
  't.overdue': ['Quá hạn chọn kết quả. Chọn ngay, nếu không lúc {at} buổi sẽ thành Không hoàn thành và không tính lương.', 'Result overdue. Choose now, or at {at} this lesson becomes Not completed and is not paid.', 'Hộp đỏ dưới buổi trong tab Cần xác nhận', 'Quá RESULT_NOTICE_AFTER_HOURS giờ sau giờ học chưa chọn kết quả'],
  't.overdue_top': ['Bạn có {n} buổi quá hạn chọn kết quả.', 'You have {n} lesson(s) with an overdue result.', 'Hộp đỏ đầu tab Lịch dạy', 'Có buổi quá hạn chọn kết quả'],
  't.overdue_go': ['Chọn kết quả', 'Choose results', 'Nút trong hộp đỏ đầu tab Lịch dạy', 'Cùng hộp đỏ'],
  't.st_not_completed': ['Không hoàn thành (không lương)', 'Not completed (unpaid)', 'Dòng trong bảng số', 'Luôn hiện'],
  't.save_results': ['Lưu {n} kết quả', 'Save {n} result(s)', 'Nút trên thanh dưới cùng', 'Đã chọn ít nhất 1 kết quả'],
  't.review_title': ['Kiểm tra trước khi lưu', 'Check before saving', 'Tiêu đề hộp kiểm tra', 'Bấm Lưu kết quả'],
  't.review_note': ['Kết quả dùng để tính lương. Lưu xong chỉ admin sửa được.', 'Results are used for payroll. After saving, only admin can change them.', 'Dòng trong hộp kiểm tra', 'Bấm Lưu kết quả'],
  't.btn_save_confirm': ['Lưu', 'Save', 'Nút trong hộp kiểm tra', 'Bấm Lưu kết quả'], 't.btn_back': ['Quay lại', 'Back', 'Nút trong hộp kiểm tra', 'Bấm Lưu kết quả'],
  't.saved_results': ['Đã lưu {n} kết quả.', 'Saved {n} result(s).', 'Hộp kết quả', 'Lưu thành công'],
  't.saved_some_bad': ['{n} chưa lưu được:', '{n} not saved:', 'Hộp kết quả', 'Có buổi không lưu được'],
  't.chosen': ['Đã chọn {n}', '{n} chosen', 'Thanh dưới cùng', 'Đã chọn kết quả'],
  't.meet_pending': ['Link Meet có trong thư mời Google Calendar.', 'Meet link comes with the Google Calendar invite.', 'Dòng nhỏ ở mỗi buổi', 'Buổi chưa có sự kiện Calendar'],
  't.meet_pending_at': ['Link Meet có trong thư mời Google Calendar, khoảng {when}.', 'Meet link comes with the Google Calendar invite, around {when}.', 'Dòng nhỏ ở mỗi buổi', 'Như trên, khi biết giờ dự kiến'],
  't.res_completed': ['Hoàn thành', 'Completed', 'Nút chọn kết quả', 'Tab Cần xác nhận'], 't.res_absent': ['Học viên vắng', 'Student absent', 'Nút chọn kết quả', 'Tab Cần xác nhận'], 't.res_tech': ['Lỗi kỹ thuật', 'Technical issue', 'Nút chọn kết quả', 'Tab Cần xác nhận'],
  't.confirm_empty': ['Hiện không có buổi nào cần xác nhận.', 'Nothing to confirm right now.', 'Dòng thay danh sách', 'Không có buổi chờ xác nhận'],
  't.res_saved': ['Đã lưu: {label}', 'Saved: {label}', 'Dòng nhỏ ở buổi đã lưu', 'Sau khi lưu'],
  't.tab_account': ['Tài khoản', 'Account', 'Tab thứ tư', 'Luôn hiện'],
  't.stats_title': ['Số buổi của tôi', 'My lessons', 'Tiêu đề tab Tài khoản', 'Luôn hiện'],
  't.stats_note': ['Đếm theo cùng luật tính lương. Buổi chưa xác nhận tự tính Hoàn thành sau 24 giờ.', 'Counted with the same rules as payroll. Lessons you have not confirmed are counted as Completed after 24 hours.', 'Dòng dưới bảng số', 'Luôn hiện'],
  't.st_completed': ['Hoàn thành', 'Completed', 'Dòng trong bảng số', 'Luôn hiện'], 't.st_absent': ['Học viên vắng', 'Student absent', 'Dòng trong bảng số', 'Luôn hiện'], 't.st_tech_paid': ['Lỗi kỹ thuật (có trả)', 'Technical issue (paid)', 'Dòng trong bảng số', 'Luôn hiện'],
  't.st_tech_unpaid': ['Lỗi kỹ thuật (không trả)', 'Technical issue (not paid)', 'Dòng trong bảng số', 'Luôn hiện'], 't.st_tutor_absent': ['Tutor vắng', 'Tutor absent', 'Dòng trong bảng số', 'Luôn hiện'], 't.st_payable': ['Buổi được trả', 'Paid lessons', 'Dòng tổng trong bảng số', 'Luôn hiện'],
  't.st_waiting': ['Chờ bạn xác nhận', 'Waiting for your result', 'Dòng trong bảng số', 'Luôn hiện'],
  // ── Trang quản trị (chunk 5I: song ngữ). Gửi kèm apiAdminHome, không gửi cho trang học viên, tutor ──
  'ad.logout': ['Thoát', 'Log out', 'Nút góc trên bên phải trang quản trị', 'Luôn hiện'],
  'ad.nav_aria': ['Điều hướng admin', 'Admin navigation', 'Đọc cho trình đọc màn hình ở thanh tab', 'Luôn có'],
  'ad.tab_feed': ['Thông báo', 'Notifications', 'Tab thứ nhất (kèm số Khẩn và Cần xử lý chưa đọc)', 'Luôn hiện'],
  'ad.tab_tutors': ['Tutor', 'Tutors', 'Tab thứ hai, và tiêu đề danh sách tutor', 'Luôn hiện'],
  'ad.tab_students': ['Học viên', 'Students', 'Tab thứ ba, và tiêu đề danh sách học viên', 'Luôn hiện'],
  'ad.tab_log': ['Nhật ký', 'Activity log', 'Tab thứ tư, và tiêu đề nhật ký trong chi tiết buổi học', 'Luôn hiện'],
  'ad.kpi.critical': ['Khẩn chưa đọc', 'Urgent unread', 'Ô số liệu thứ 1 trên đầu trang (bấm: lọc thông báo Khẩn chưa đọc)', 'Luôn hiện'],
  'ad.kpi.warning': ['Cần xử lý', 'Action needed', 'Ô số liệu thứ 2 (bấm: lọc thông báo Cần xử lý chưa đọc)', 'Luôn hiện'],
  'ad.kpi.regs': ['Đăng ký chờ duyệt', 'Sign ups to approve', 'Ô số liệu thứ 3 (bấm: mở tab REGISTRATIONS)', 'Luôn hiện'],
  'ad.kpi.tutor_cancels': ['Tutor xin huỷ', 'Tutor cancel requests', 'Ô số liệu thứ 4 (bấm: mở tab AVAILABILITY)', 'Luôn hiện'],
  'ad.kpi.today': ['Buổi hôm nay', 'Lessons today', 'Ô số liệu thứ 5 (bấm: danh sách buổi hôm nay)', 'Luôn hiện'],
  'ad.kpi.waiting': ['Chờ tutor xác nhận', 'Waiting for tutor', 'Ô số liệu thứ 6 (bấm: danh sách buổi đã qua mà tutor chưa chọn kết quả)', 'Luôn hiện'],
  'ad.no_sheet_link': ['Chưa có link tới tab này. Mở file Sheets và tìm tab tương ứng.', 'No link to this tab yet. Open the Sheets file and find the tab.', 'Thông báo nhỏ', 'Bấm ô số liệu khi máy chủ không tạo được link Sheets (rất hiếm)'],
  'ad.feed_title': ['Thông báo', 'Notifications', 'Tiêu đề tab Thông báo', 'Luôn hiện'],
  'ad.open_notif_tab': ['Tab NOTIFICATIONS', 'NOTIFICATIONS tab', 'Nút nhỏ cạnh tiêu đề tab Thông báo', 'Luôn hiện'],
  'ad.f_unread': ['Chưa đọc', 'Unread', 'Nút lọc thứ nhất (kèm số)', 'Luôn hiện'],
  'ad.f_all': ['Tất cả', 'All', 'Nút lọc thứ hai', 'Luôn hiện'],
  'ad.f_all_levels': ['Mọi mức', 'All levels', 'Nút lọc mức thứ nhất', 'Luôn hiện'],
  'ad.lv.CRITICAL': ['Khẩn', 'Urgent', 'Nút lọc mức, nhãn mức trong chi tiết thông báo', 'Luôn hiện'],
  'ad.lv.WARNING': ['Cần xử lý', 'Action needed', 'Nút lọc mức, nhãn mức', 'Luôn hiện'],
  'ad.lv.INFO': ['Thông tin', 'Info', 'Nút lọc mức, nhãn mức', 'Luôn hiện'],
  'ad.read_all': ['Đã đọc hết', 'Mark all read', 'Nút bên phải thanh lọc, và nút xác nhận trong hộp hỏi', 'Luôn hiện'],
  'ad.read_all_q': ['Đánh dấu {n} thông báo chưa đọc là đã đọc?', 'Mark {n} unread notification(s) as read?', 'Tiêu đề hộp hỏi. {n}: số thông báo', 'Bấm Đã đọc hết'],
  'ad.read_all_note': ['Gồm cả {c} thông báo khẩn, {w} cần xử lý, ở mọi bộ lọc.', 'Includes {c} urgent and {w} action needed, across all filters.', 'Dòng nhỏ trong hộp hỏi', 'Bấm Đã đọc hết'],
  'ad.read_n': ['Đã đánh dấu {n} thông báo', 'Marked {n} notification(s)', 'Thông báo nhỏ', 'Sau khi Đã đọc hết'],
  'ad.cancel': ['Huỷ', 'Cancel', 'Nút thoát của hộp hỏi', 'Mọi hộp hỏi xác nhận'],
  'ad.close': ['Đóng', 'Close', 'Nút đóng hộp chi tiết', 'Mọi hộp chi tiết'],
  'ad.shown_of': ['Hiện {n}/{total}. Xem đủ trong Sheets.', 'Showing {n} of {total}. See all in Sheets.', 'Dòng nhỏ cuối danh sách', 'Danh sách dài hơn số dòng hiện'],
  'ad.no_notifs': ['Không có thông báo.', 'No notifications.', 'Ô trống của danh sách thông báo', 'Bộ lọc không có dòng nào'],
  'ad.no_unread_notifs': ['Không có thông báo chưa đọc.', 'No unread notifications.', 'Ô trống của danh sách thông báo', 'Lọc Chưa đọc mà đã đọc hết'],
  'ad.today': ['Hôm nay', 'Today', 'Tiêu đề nhóm ngày trong thông báo và nhật ký', 'Có dòng của hôm nay'],
  'ad.yesterday': ['Hôm qua', 'Yesterday', 'Tiêu đề nhóm ngày', 'Có dòng của hôm qua'],
  'ad.day_unknown': ['Không rõ ngày', 'Unknown date', 'Tiêu đề nhóm ngày', 'Dòng có ô thời gian hỏng'],
  'ad.notif_title': ['Chi tiết thông báo', 'Notification details', 'Tiêu đề hộp chi tiết thông báo', 'Bấm một thông báo'],
  'ad.open_row': ['Mở đúng dòng trong Sheets', 'Open the row in Sheets', 'Nút trong hộp chi tiết thông báo, chi tiết nhật ký', 'Có link tới dòng'],
  'ad.view_booking': ['Xem buổi học {id}', 'View lesson {id}', 'Nút trong hộp chi tiết thông báo, nhật ký', 'Thông báo hoặc dòng nhật ký về đúng một buổi'],
  'ad.view_student_id': ['Xem học viên {id}', 'View student {id}', 'Nút trong hộp chi tiết thông báo', 'Thông báo có mã học viên'],
  'ad.view_tutor_id': ['Xem tutor {id}', 'View tutor {id}', 'Nút trong hộp chi tiết thông báo', 'Thông báo có mã tutor'],
  'ad.view_person': ['Xem {id}', 'View {id}', 'Nút trong hộp chi tiết nhật ký', 'Dòng nhật ký về một tutor hoặc học viên'],
  'ad.view_student': ['Xem học viên', 'View student', 'Nút trong hộp chi tiết buổi học', 'Bấm Chi tiết một buổi'],
  'ad.view_tutor': ['Xem tutor', 'View tutor', 'Nút trong hộp chi tiết buổi học', 'Bấm Chi tiết một buổi'],
  'ad.system': ['Hệ thống', 'System', 'Tên người làm khi việc do hệ thống tự chạy', 'Nhật ký, chi tiết buổi học'],
  'ad.admin_sheets': ['Admin (sửa trong Sheets)', 'Admin (edited in Sheets)', 'Tên người làm khi Google không cho biết email người sửa Sheets', 'Nhật ký'],
  'ad.back': ['Quay lại', 'Back', 'Nút đầu trang con', 'Trang một người, danh sách buổi'],
  'ad.lessons_today': ['Buổi hôm nay ({n})', 'Lessons today ({n})', 'Tiêu đề danh sách buổi hôm nay. {n}: số buổi', 'Bấm ô Buổi hôm nay'],
  'ad.lessons_waiting': ['Chờ tutor xác nhận ({n})', 'Waiting for tutor ({n})', 'Tiêu đề danh sách buổi chờ xác nhận', 'Bấm ô Chờ tutor xác nhận'],
  'ad.waiting_note': ['Buổi đã diễn ra mà tutor chưa chọn kết quả. Quá {hours} giờ: tô đỏ, nhắc tutor. Quá {expire} giờ: thành Không hoàn thành, không tính lương (sửa được ở cột admin_action: Hoàn thành, Vắng học viên, Vắng tutor).', 'Lessons that took place but the tutor has not chosen a result. After {hours} hours: red, remind the tutor. After {expire} hours: Not completed, unpaid (fix in the admin_action column: Completed, Student absent, Tutor absent).', 'Dòng chú thích dưới tiêu đề. {hours}, {expire}: CONFIG RESULT_NOTICE_AFTER_HOURS, RESULT_EXPIRE_AFTER_HOURS', 'Danh sách Chờ tutor xác nhận'],
  'ad.reason.STUDENT': ['Học viên huỷ', 'Cancelled by the student', 'Lý do huỷ trong hộp chi tiết buổi (hệ thống tự ghi)', 'Học viên tự huỷ buổi'],
  'ad.reason.TUTOR_NO_SUB': ['Tutor huỷ, admin chọn không dạy thay', 'Tutor cancelled, admin chose no substitute', 'Lý do huỷ trong hộp chi tiết buổi', 'Admin duyệt tutor huỷ và chọn huỷ buổi'],
  'ad.reason.TUTOR_LOCKED': ['Tutor nghỉ (bị khoá), không có tutor thay', 'Tutor left (locked), no substitute available', 'Lý do huỷ trong hộp chi tiết buổi', 'Admin khoá tutor mà buổi không còn ai dạy thay (5L)'],
  'ad.reason.TUTOR_NO_COVER': ['Tutor huỷ, không có tutor thay', 'Tutor cancelled, no substitute available', 'Lý do huỷ trong hộp chi tiết buổi', 'Admin duyệt tutor huỷ mà không còn ai dạy thay'],
  'ad.reason.ADMIN': ['Admin huỷ', 'Cancelled by admin', 'Lý do huỷ trong hộp chi tiết buổi', 'Admin huỷ mà để trống lý do'],
  'ad.maint.OFF': ['tắt', 'off', 'Trong tên hành động bảo trì của nhật ký', 'Hành động MAINTENANCE_OFF'], 'ad.maint.READONLY': ['chỉ xem', 'read only', 'Trong tên hành động bảo trì', 'Hành động MAINTENANCE_READONLY'],
  'ad.maint.CLOSED': ['đóng cổng', 'closed', 'Trong tên hành động bảo trì', 'Hành động MAINTENANCE_CLOSED'],
  'ad.reload': ['Tải lại', 'Reload', 'Nút trên danh sách thông báo và nhật ký', 'Lấy thông báo, dòng nhật ký mới nhất và số trên ô'],
  'ad.log_new': ['Có dòng mới hơn. Tải lại', 'Newer rows available. Reload', 'Nút cuối nhật ký', 'Có hoạt động mới sau khi mở nhật ký'],
  'ad.aria_read': ['Lọc theo đã đọc', 'Filter by read state', 'Đọc cho trình đọc màn hình ở nhóm nút Chưa đọc, Tất cả', 'Luôn có'],
  'ad.aria_level': ['Lọc theo mức', 'Filter by level', 'Đọc cho trình đọc màn hình ở nhóm nút mức', 'Luôn có'],
  'ad.aria_who': ['Lọc theo người làm', 'Filter by who', 'Đọc cho trình đọc màn hình ở nhóm nút nhật ký', 'Luôn có'],
  'ad.open_bookings_tab': ['Tab BOOKINGS', 'BOOKINGS tab', 'Nút nhỏ cạnh tiêu đề danh sách buổi', 'Danh sách buổi'],
  'ad.none': ['Không có.', 'None.', 'Ô trống của một mục', 'Mục không có dòng nào'],
  'ad.nobody': ['Không có ai.', 'Nobody here.', 'Ô trống của danh sách tutor, học viên', 'Danh sách trống hoặc tìm không thấy'],
  'ad.search_people': ['Tìm tên, email, mã', 'Search name, email, ID', 'Ô tìm ở tab Học viên', 'Luôn hiện'],
  'ad.new_n': ['{n} mới', '{n} new', 'Nhãn vàng cạnh tên tutor, học viên', 'Người đó có thông báo chưa đọc'],
  'ad.tutor_line': ['{id} · {status} · tuần này {week} buổi · chờ xác nhận {confirm} · mở tuần sau {open} slot', '{id} · {status} · this week {week} lesson(s) · to confirm {confirm} · next week {open} slot(s) open', 'Dòng nhỏ dưới tên tutor', 'Tab Tutor'],
  'ad.student_line': ['{id} · {email} · {pkg} · sắp tới {up} · tuần này {week}', '{id} · {email} · {pkg} · upcoming {up} · this week {week}', 'Dòng nhỏ dưới tên học viên. {pkg}: gói đang dùng', 'Tab Học viên'],
  'ad.no_pkg': ['chưa có gói', 'no package', 'Trong dòng học viên và mục Gói học', 'Học viên chưa có gói'],
  'ad.ends': ['hết {d}', 'ends {d}', 'Trong dòng gói của học viên', 'Gói đã có ngày hết hạn'],
  'ad.left_n': ['còn {n} buổi', '{n} lesson(s) left', 'Trong dòng gói của học viên', 'Gói tính theo số buổi'],
  'ad.pkg.ACTIVE': ['Đang dùng', 'Active', 'Trạng thái gói', 'Gói đang chạy'], 'ad.pkg.INACTIVE': ['Chưa bắt đầu', 'Not started', 'Trạng thái gói', 'Gói chưa học buổi nào'],
  'ad.pkg.QUEUED': ['Chờ gói trước hết', 'Queued', 'Trạng thái gói', 'Mua thêm khi gói cũ còn hạn'], 'ad.pkg.EXPIRED': ['Hết hạn', 'Expired', 'Trạng thái gói', 'Gói đã hết hạn'],
  'ad.us.ACTIVE': ['Đang hoạt động', 'Active', 'Trạng thái tài khoản', 'USERS.status ACTIVE'], 'ad.us.SUSPENDED': ['Tạm khoá', 'Suspended', 'Trạng thái tài khoản', 'USERS.status SUSPENDED'],
  'ad.us.DISABLED': ['Đã khoá', 'Disabled', 'Trạng thái tài khoản', 'USERS.status DISABLED'],
  'ad.role.TUTOR': ['Tutor', 'Tutor', 'Nhãn vai trò ở trang một người', 'Trang một tutor'], 'ad.role.STUDENT': ['Học viên', 'Student', 'Nhãn vai trò ở trang một người', 'Trang một học viên'],
  'ad.lang_x': ['Ngôn ngữ: {l}', 'Language: {l}', 'Dòng nhỏ ở trang một người', 'Trang một tutor, học viên'],
  'ad.lang.vi': ['Tiếng Việt', 'Vietnamese', 'Trong dòng Ngôn ngữ', 'USERS.lang vi'], 'ad.lang.en': ['Tiếng Anh', 'English', 'Trong dòng Ngôn ngữ', 'USERS.lang en'],
  'ad.lang.none': ['chưa chọn (trang sẽ hỏi lần đăng nhập tới)', 'not chosen yet (asked at next login)', 'Trong dòng Ngôn ngữ', 'USERS.lang trống'],
  'ad.open_users_row': ['Mở dòng USERS', 'Open USERS row', 'Nút ở trang một người', 'Luôn hiện'],
  'ad.book_for': ['Đặt thay', 'Book for student', 'Nút ở trang một học viên', 'Trang một học viên'],
  'ad.stats_title': ['Số buổi theo tháng', 'Lessons by month', 'Tiêu đề mục ở trang một tutor', 'Trang một tutor'],
  'ad.stats_line': ['Hoàn thành {done} · Vắng HV {sa} · Kỹ thuật (tính) {tp} · Kỹ thuật (không) {tu} · Vắng tutor {ta} · chờ xác nhận {confirm}', 'Completed {done} · Student absent {sa} · Tech (paid) {tp} · Tech (unpaid) {tu} · Tutor absent {ta} · to confirm {confirm}', 'Mỗi tháng một dòng ở trang một tutor', 'Trang một tutor'],
  'ad.payable': ['Tính lương {n}', 'Payable {n}', 'Cuối dòng số buổi theo tháng', 'Trang một tutor'],
  'ad.packages_title': ['Gói học', 'Packages', 'Tiêu đề mục ở trang một học viên', 'Trang một học viên'],
  'ad.range': ['{from} đến {to}', '{from} to {to}', 'Khoảng ngày của gói', 'Gói đã có ngày bắt đầu'],
  'ad.left_of': ['còn {n}/{total}', '{n}/{total} left', 'Số buổi còn của gói', 'Gói tính theo số buổi'],
  'ad.upcoming_title': ['Sắp tới', 'Upcoming', 'Tiêu đề mục ở trang một người', 'Luôn hiện'],
  'ad.no_upcoming': ['Không có buổi sắp tới.', 'No upcoming lessons.', 'Ô trống mục Sắp tới', 'Không có buổi sắp tới'],
  'ad.history_title': ['Lịch sử (30 buổi gần nhất)', 'History (last 30 lessons)', 'Tiêu đề mục ở trang một người', 'Luôn hiện'],
  'ad.related_notifs': ['Thông báo liên quan', 'Related notifications', 'Tiêu đề mục ở trang một người', 'Luôn hiện'],
  'ad.devices_title': ['Thiết bị đang đăng nhập', 'Signed in devices', 'Tiêu đề mục ở trang một người', 'Luôn hiện'],
  'ad.kick_btn': ['Thoát mọi thiết bị của {name}', 'Sign {name} out everywhere', 'Nút đỏ ở mục thiết bị', 'Người đó còn phiên đăng nhập'],
  'ad.kick_note': ['Dùng khi mất điện thoại, nghỉ việc, hoặc thấy đăng nhập lạ. Khoá hẳn tài khoản: đặt status DISABLED trong USERS (job mỗi giờ huỷ phiên còn sót).', 'Use when a phone is lost, someone leaves, or a sign in looks strange. To block the account for good, set status DISABLED in USERS (the hourly job ends leftover sessions).', 'Dòng nhỏ dưới nút đỏ', 'Người đó còn phiên đăng nhập'],
  'ad.kick_q': ['Thoát mọi thiết bị của {name}?', 'Sign {name} out everywhere?', 'Tiêu đề hộp hỏi', 'Bấm nút đỏ'],
  'ad.kick_q_note': ['Người này phải xin link đăng nhập mới.', 'This person must request a new login link.', 'Dòng nhỏ trong hộp hỏi', 'Bấm nút đỏ'],
  'ad.kick_yes': ['Thoát hết', 'Sign out all', 'Nút xác nhận trong hộp hỏi', 'Bấm nút đỏ'],
  'ad.kicked_n': ['Đã thoát {n} thiết bị', 'Signed out {n} device(s)', 'Thông báo nhỏ', 'Sau khi thoát mọi thiết bị'],
  'ad.st.awaiting': ['Chờ tutor xác nhận', 'Waiting for tutor', 'Nhãn tròn ở mỗi buổi (trang admin)', 'Buổi đã diễn ra, tutor chưa chọn kết quả'],
  'ad.st.CONFIRMED': ['Xác nhận', 'Confirmed', 'Nhãn tròn ở mỗi buổi', 'Buổi đã đặt'], 'ad.st.PENDING_REASSIGN': ['Chờ đổi tutor', 'Pending reassignment', 'Nhãn tròn ở mỗi buổi', 'Tutor xin huỷ, chờ admin xếp người thay'],
  'ad.st.COMPLETED': ['Hoàn thành', 'Completed', 'Nhãn tròn ở mỗi buổi', 'Buổi đã học'], 'ad.st.STUDENT_ABSENT': ['Vắng học viên', 'Student absent', 'Nhãn tròn ở mỗi buổi', 'Tutor báo học viên vắng'],
  'ad.st.TECH_ISSUE': ['Vấn đề kỹ thuật', 'Technical issue', 'Nhãn tròn ở mỗi buổi', 'Tutor báo lỗi kỹ thuật'], 'ad.st.TUTOR_ABSENT': ['Vắng tutor', 'Tutor absent', 'Nhãn tròn ở mỗi buổi', 'Admin ghi tutor vắng'],
  'ad.st.CANCELLED_STUDENT': ['Huỷ bởi học viên', 'Cancelled by student', 'Nhãn tròn ở mỗi buổi', 'Học viên huỷ'], 'ad.st.CANCELLED_TUTOR': ['Huỷ bởi tutor', 'Cancelled by tutor', 'Nhãn tròn ở mỗi buổi', 'Tutor huỷ được duyệt'],
  'ad.st.CANCELLED_ADMIN': ['Huỷ bởi admin', 'Cancelled by admin', 'Nhãn tròn ở mỗi buổi', 'Admin huỷ'],
  'ad.st.NOT_COMPLETED': ['Không hoàn thành', 'Not completed', 'Nhãn tròn ở mỗi buổi', 'Tutor không chọn kết quả quá RESULT_EXPIRE_AFTER_HOURS giờ: không lương'],
  'ad.st.overdue': ['Quá hạn xác nhận', 'Result overdue', 'Nhãn đỏ ở buổi trong danh sách Chờ tutor xác nhận', 'Quá RESULT_NOTICE_AFTER_HOURS giờ sau giờ học'],
  'ad.st.CANCELLED_LATE': ['Huỷ muộn', 'Cancelled late', 'Nhãn tròn ở mỗi buổi', 'Admin huỷ từ 15:00 hôm trước: trừ lượt, không bù'],
  'ad.details_btn': ['Chi tiết {id}', 'Details {id}', 'Nút nhỏ ở mỗi buổi', 'Mọi danh sách buổi'],
  'ad.cancel_btn': ['Huỷ', 'Cancel', 'Nút đỏ nhỏ ở mỗi buổi sắp tới', 'Buổi chưa bắt đầu'],
  'ad.cancel_this': ['Huỷ buổi này', 'Cancel this lesson', 'Nút đỏ trong hộp chi tiết buổi', 'Buổi chưa bắt đầu'],
  'ad.cancel_q': ['Huỷ buổi {id}?', 'Cancel lesson {id}?', 'Tiêu đề hộp hỏi huỷ', 'Bấm Huỷ'],
  'ad.cancel_note': ['Không giới hạn hạn huỷ. Học viên và tutor nhận email, sự kiện Calendar bị huỷ, học viên không bị trừ buổi.', 'No cancel deadline. Student and tutor get an email, the Calendar event is cancelled, the student keeps the lesson credit.', 'Dòng nhỏ trong hộp hỏi huỷ', 'Bấm Huỷ'],
  'ad.cancel_reason_label': ['Lý do (ghi vào Sheets và email gửi học viên, tutor)', 'Reason (saved in Sheets and sent in the email to student and tutor)', 'Nhãn ô lý do trong hộp hỏi huỷ', 'Bấm Huỷ'],
  'ad.cancel_reason_default': ['Admin huỷ', 'Cancelled by admin', 'Chữ có sẵn trong ô lý do', 'Bấm Huỷ'],
  'ad.cancel_yes': ['Huỷ buổi này', 'Cancel this lesson', 'Nút đỏ xác nhận trong hộp hỏi', 'Bấm Huỷ'],
  'ad.keep': ['Giữ lại', 'Keep it', 'Nút giữ buổi trong hộp hỏi', 'Bấm Huỷ'],
  'ad.cancelling_btn': ['Đang huỷ...', 'Cancelling...', 'Chữ trên nút trong lúc huỷ', 'Đang huỷ'],
  'ad.cancelling': ['Đang huỷ {id}...', 'Cancelling {id}...', 'Thông báo nhỏ', 'Đang huỷ'],
  'ad.cancelled': ['Đã huỷ {id}', 'Cancelled {id}', 'Thông báo nhỏ', 'Huỷ xong'],
  'ad.cancel_fail': ['Chưa huỷ được.', 'Could not cancel.', 'Thông báo nhỏ', 'Huỷ lỗi mà máy chủ không gửi câu báo'],
  'ad.cancel_already': ['Buổi {id} đã được huỷ trước đó ({status}).', 'Lesson {id} was already cancelled ({status}).', 'Thông báo nhỏ. {status}: trạng thái huỷ', 'Huỷ một buổi đã huỷ (hai admin cùng bấm)'],
  'ad.cancel_started': ['Buổi đã bắt đầu: xử lý ở cột admin_action của tab BOOKINGS (Vắng tutor, Hoàn thành...).', 'The lesson has started: handle it in the admin_action column of the BOOKINGS tab.', 'Thông báo nhỏ', 'Huỷ một buổi đã bắt đầu'],
  'ad.cancel_reason_x': ['Lý do huỷ: {r}', 'Cancel reason: {r}', 'Dòng nhỏ trong hộp chi tiết buổi', 'Buổi đã huỷ'],
  'ad.student': ['Học viên', 'Student', 'Trong hộp chi tiết buổi', 'Bấm Chi tiết'], 'ad.tutor': ['Tutor', 'Tutor', 'Trong hộp chi tiết buổi', 'Bấm Chi tiết'],
  'ad.join_meet': ['Vào phòng Meet', 'Join Meet', 'Nút trong hộp chi tiết buổi', 'Buổi có link Meet và chưa huỷ'],
  'ad.open_bookings_row': ['Mở dòng BOOKINGS', 'Open BOOKINGS row', 'Nút trong hộp chi tiết buổi', 'Luôn hiện'],
  'ad.bookfor_title': ['Đặt thay {name}', 'Book for {name}', 'Tiêu đề trang đặt thay', 'Bấm Đặt thay'],
  'ad.bookfor_blocked': ['Đặt thay sẽ không thành công cho tới khi xử lý xong.', 'Booking will fail until this is fixed.', 'Sau câu báo vàng ở trang đặt thay', 'Học viên chưa có gói dùng được hoặc đang khoá'],
  'ad.bookfor_note': ['Bỏ qua hạn đặt. Vẫn giữ: 1 buổi mỗi ngày, hạn và số buổi của gói, slot đã khoá, trùng giờ của tutor. Học viên và tutor nhận email như khi tự đặt.', 'Skips the booking deadline. Still enforced: 1 lesson per day, package dates and lesson count, blocked slots, tutor clashes. Student and tutor get the usual emails.', 'Chú thích đầu trang đặt thay', 'Trang đặt thay'],
  'ad.has_lesson': ['Đã có buổi', 'Has a lesson', 'Nhãn xanh ở ngày', 'Học viên đã có buổi ngày đó'],
  'ad.free_n': ['{n} giờ trống', '{n} free slot(s)', 'Chữ nhỏ ở mỗi ngày', 'Trang đặt thay'],
  'ad.no_free_slots': ['Không còn slot trống nào có tutor mở.', 'No free slot with an open tutor.', 'Ô trống của trang đặt thay', 'Không có slot nào'],
  'ad.chosen': ['Đã chọn', 'Selected', 'Tiêu đề khung giờ đã chọn', 'Đã chọn ít nhất một giờ'],
  'ad.auto_pick': ['Tự chọn theo luật ({name})', 'Pick by the rules ({name})', 'Lựa chọn đầu trong ô chọn tutor', 'Đã chọn một giờ'],
  'ad.tutor_load': ['{name} · tuần này {n} buổi', '{name} · {n} lesson(s) this week', 'Mỗi tutor trong ô chọn tutor', 'Đã chọn một giờ'],
  'ad.book_n': ['Đặt {n} buổi', 'Book {n} lesson(s)', 'Nút đặt', 'Đã chọn ít nhất một giờ'],
  'ad.booking_now': ['Đang đặt...', 'Booking...', 'Chữ trên nút trong lúc đặt', 'Đang đặt'],
  'ad.booked_n': ['Đã đặt {n} buổi', 'Booked {n} lesson(s)', 'Tiêu đề hộp kết quả', 'Đặt xong, có buổi thành công'],
  'ad.booked_none': ['Chưa đặt được buổi nào', 'No lesson booked', 'Tiêu đề hộp kết quả', 'Mọi buổi đều bị từ chối'],
  'ad.log_title': ['Nhật ký', 'Activity log', 'Tiêu đề tab Nhật ký', 'Luôn hiện'],
  'ad.log_note': ['Mọi hoạt động của hệ thống, học viên, tutor, admin trong {days} ngày gần nhất. Dòng cũ hơn không hiện ở đây và được tự chuyển sang file lưu trữ (không mất). Bấm một dòng để đọc đủ.', 'Every action by the system, students, tutors and admins in the last {days} days. Older rows are hidden here and moved to the archive file automatically (never lost). Tap a row to read it in full.', 'Dòng chú thích dưới tiêu đề Nhật ký. {days}: CONFIG LOG_KEEP_DAYS', 'Luôn hiện'],
  'ad.who_all': ['Tất cả', 'All', 'Nút lọc nhật ký thứ nhất', 'Luôn hiện'],
  'ad.who_people': ['Người dùng', 'People', 'Nút lọc nhật ký: việc do người làm (có email)', 'Luôn hiện'],
  'ad.who_system': ['Hệ thống', 'System', 'Nút lọc nhật ký: việc hệ thống tự chạy', 'Luôn hiện'],
  'ad.log_search': ['Tìm email, mã buổi, hành động', 'Search email, lesson ID, action', 'Ô tìm trong tab Nhật ký', 'Luôn hiện'],
  'ad.log_count': ['{n} dòng mới nhất / tổng {total}', 'Latest {n} of {total}', 'Dòng nhỏ cuối nhật ký', 'Có dòng nhật ký'],
  'ad.load_more': ['Xem thêm', 'Load more', 'Nút cuối nhật ký', 'Còn dòng cũ hơn'],
  'ad.loading': ['Đang tải...', 'Loading...', 'Chữ trên nút Xem thêm', 'Đang tải thêm'],
  'ad.no_rows': ['Không có dòng nào.', 'No rows.', 'Ô trống của nhật ký', 'Tìm không thấy'],
  'ad.log_entry_title': ['Chi tiết nhật ký', 'Log entry', 'Tiêu đề hộp chi tiết nhật ký', 'Bấm một dòng nhật ký'],
  'ad.k_time': ['Thời gian', 'Time', 'Nhãn trong hộp chi tiết nhật ký', 'Bấm một dòng nhật ký'],
  'ad.k_actor': ['Người làm', 'By', 'Nhãn trong hộp chi tiết nhật ký', 'Bấm một dòng nhật ký'],
  'ad.k_action': ['Mã hành động', 'Action code', 'Nhãn trong hộp chi tiết nhật ký', 'Bấm một dòng nhật ký'],
  'ad.k_entity': ['Đối tượng', 'Object', 'Nhãn trong hộp chi tiết nhật ký (tab và mã)', 'Dòng có đối tượng'],
  'ad.no_detail': ['Không có chi tiết.', 'No details.', 'Trong hộp chi tiết nhật ký', 'Dòng không có chi tiết'],
  // Câu báo lỗi cho admin (nói về học viên, không nói "bạn")
  'ad.r.NO_PACKAGE': ['Học viên chưa có gói học còn dùng được.', 'The student has no usable package.', 'Câu báo khi đặt thay', 'Học viên chưa có gói'],
  'ad.r.EXPIRED': ['Gói của học viên đã hết hạn.', 'The student\'s package has expired.', 'Câu báo khi đặt thay', 'Gói hết hạn'],
  'ad.r.OUT_OF_RANGE': ['Ngày này nằm ngoài thời hạn gói của học viên.', 'This date is outside the student\'s package dates.', 'Câu báo khi đặt thay', 'Ngày ngoài hạn gói'],
  'ad.r.NO_SESSIONS': ['Học viên đã dùng hết số buổi của gói.', 'The student has used all lessons of the package.', 'Câu báo khi đặt thay', 'Hết buổi'],
  'ad.r.ONE_PER_DAY': ['Học viên đã có buổi trong ngày này (mỗi ngày 1 buổi).', 'The student already has a lesson that day (1 per day).', 'Câu báo khi đặt thay', 'Đã có buổi ngày đó'],
  'ad.r.SUSPENDED': ['Học viên đang bị tạm khoá: mở khoá ở menu trước.', 'The student is suspended: unsuspend in the menu first.', 'Câu báo khi đặt thay', 'Học viên tạm khoá'],
  'ad.r.NOT_ACTIVE': ['Tài khoản học viên chưa kích hoạt.', 'The student account is not active.', 'Câu báo khi đặt thay', 'Tài khoản chưa kích hoạt'],
  'ad.r.NO_TUTOR': ['Không còn tutor mở và rảnh ở giờ này (hoặc tutor đã chọn bận, slot bị khoá).', 'No open, free tutor at this time (or the chosen tutor is busy, the slot is blocked).', 'Câu báo khi đặt thay', 'Không còn tutor'],
  'ad.r.DEADLINE': ['Giờ học đã bắt đầu hoặc đã qua.', 'The lesson time has started or passed.', 'Câu báo khi đặt thay', 'Giờ đã qua'],
  'ad.r.TOO_FAR': ['Ngày quá xa (vượt BOOKING_HORIZON_DAYS).', 'The date is too far ahead (beyond BOOKING_HORIZON_DAYS).', 'Câu báo khi đặt thay', 'Ngày quá xa'],
  // Tên sự kiện thông báo (dòng nhỏ dưới mỗi thông báo). Mã gốc vẫn ở tab NOTIFY_RULES.
  'ad.ev.SYSTEM_ERROR': ['Lỗi hệ thống', 'System error', 'Dòng nhỏ dưới thông báo', 'Sự kiện SYSTEM_ERROR'],
  'ad.ev.CALENDAR_FAILED': ['Lỗi sự kiện Calendar', 'Calendar event failed', 'Dòng nhỏ dưới thông báo', 'Sự kiện CALENDAR_FAILED'],
  'ad.ev.DATA_INVARIANT': ['Dữ liệu sai luật', 'Data rule broken', 'Dòng nhỏ dưới thông báo', 'Sự kiện DATA_INVARIANT'],
  'ad.ev.CALENDAR_LATE': ['Buổi sắp học chưa có Calendar', 'Upcoming lesson without Calendar event', 'Dòng nhỏ dưới thông báo', 'Sự kiện CALENDAR_LATE'],
  'ad.ev.CALENDAR_BATCH_FAILED': ['Cả lô Calendar lỗi', 'Whole Calendar batch failed', 'Dòng nhỏ dưới thông báo', 'Sự kiện CALENDAR_BATCH_FAILED'],
  'ad.ev.SHEET_REMOVED': ['Tab hệ thống bị xoá hoặc đổi tên', 'System tab removed or renamed', 'Dòng nhỏ dưới thông báo', 'Sự kiện SHEET_REMOVED'],
  'ad.ev.PURGE_CHECK': ['Cần kiểm dòng trùng', 'Check duplicate rows', 'Dòng nhỏ dưới thông báo', 'Sự kiện PURGE_CHECK'],
  'ad.ev.ARCHIVE_FAILED': ['Lưu trữ dừng', 'Archive stopped', 'Dòng nhỏ dưới thông báo', 'Sự kiện ARCHIVE_FAILED'],
  'ad.ev.CALENDAR_NIGHTLY': ['Tổng kết Calendar đêm qua', 'Last night\'s Calendar summary', 'Dòng nhỏ dưới thông báo', 'Sự kiện CALENDAR_NIGHTLY'],
  'ad.ev.CALENDAR_NIGHTLY_PROBLEM': ['Calendar đêm qua còn lỗi', 'Last night\'s Calendar had problems', 'Dòng nhỏ dưới thông báo', 'Sự kiện CALENDAR_NIGHTLY_PROBLEM'],
  'ad.ev.NEW_REGISTRATION': ['Đăng ký mới', 'New registration', 'Dòng nhỏ dưới thông báo', 'Sự kiện NEW_REGISTRATION'],
  'ad.ev.TUTOR_CANCEL_REQUEST': ['Tutor xin huỷ', 'Tutor cancel request', 'Dòng nhỏ dưới thông báo', 'Sự kiện TUTOR_CANCEL_REQUEST'],
  'ad.ev.STUDENT_CANCELLED': ['Học viên huỷ', 'Student cancelled', 'Dòng nhỏ dưới thông báo', 'Sự kiện STUDENT_CANCELLED'],
  'ad.ev.RESULT_TECH_ISSUE': ['Báo lỗi kỹ thuật', 'Technical issue reported', 'Dòng nhỏ dưới thông báo', 'Sự kiện RESULT_TECH_ISSUE'],
  'ad.ev.RESULT_STUDENT_ABSENT': ['Học viên vắng', 'Student absent', 'Dòng nhỏ dưới thông báo', 'Sự kiện RESULT_STUDENT_ABSENT'],
  'ad.ev.TUTOR_NO_AVAILABILITY': ['Tutor chưa mở lịch', 'Tutor has no availability', 'Dòng nhỏ dưới thông báo', 'Sự kiện TUTOR_NO_AVAILABILITY'],
  'ad.ev.RESULT_COMPLETED': ['Buổi hoàn thành', 'Lesson completed', 'Dòng nhỏ dưới thông báo', 'Sự kiện RESULT_COMPLETED'],
  'ad.ev.AUTO_COMPLETED': ['Tự chuyển Hoàn thành', 'Auto completed', 'Dòng nhỏ dưới thông báo', 'Sự kiện AUTO_COMPLETED'],
  'ad.ev.REASSIGNED': ['Đổi tutor', 'Tutor changed', 'Dòng nhỏ dưới thông báo', 'Sự kiện REASSIGNED'],
  'ad.ev.TUTOR_CANCEL_AUTO_REJECTED': ['Tự từ chối yêu cầu huỷ', 'Cancel request auto rejected', 'Dòng nhỏ dưới thông báo', 'Sự kiện TUTOR_CANCEL_AUTO_REJECTED'],
  'ad.ev.BOOKED': ['Đặt buổi', 'Lesson booked', 'Dòng nhỏ dưới thông báo', 'Sự kiện BOOKED'],
  'ad.ev.ADMIN_CANCELLED': ['Admin huỷ buổi', 'Admin cancelled', 'Dòng nhỏ dưới thông báo', 'Sự kiện ADMIN_CANCELLED'],
  'ad.ev.MAIL_FAILED': ['Email gửi lỗi', 'Email failed', 'Dòng nhỏ dưới thông báo', 'Sự kiện MAIL_FAILED'],
  'ad.ev.COMP_EXTENDED': ['Cộng ngày bù', 'Make up days added', 'Dòng nhỏ dưới thông báo', 'Sự kiện COMP_EXTENDED'],
  'ad.ev.COMP_ON_EXPIRED': ['Bù cho gói đã hết hạn', 'Make up on expired package', 'Dòng nhỏ dưới thông báo', 'Sự kiện COMP_ON_EXPIRED'],
  'ad.ev.COMP_RETRACT_BLOCKED': ['Chưa rút được ngày bù', 'Make up days not removed', 'Dòng nhỏ dưới thông báo', 'Sự kiện COMP_RETRACT_BLOCKED'],
  'ad.ev.TRIAL_LEFT_UNUSED': ['Trial còn lượt mà hết ngày', 'Trial lessons left, no days left', 'Dòng nhỏ dưới thông báo', 'Sự kiện TRIAL_LEFT_UNUSED'],
  'ad.ev.COMP_QUEUE_CONFLICT': ['Gói nối đuôi lệch buổi', 'Queued package conflict', 'Dòng nhỏ dưới thông báo', 'Sự kiện COMP_QUEUE_CONFLICT'],
  'ad.ev.PACKAGE_EDIT_DENIED': ['Sửa ô gói bị trả lại', 'Package edit reverted', 'Dòng nhỏ dưới thông báo', 'Sự kiện PACKAGE_EDIT_DENIED'],
  'ad.ev.PACKAGE_HEALED': ['Tự sửa ngày gói', 'Package dates restored', 'Dòng nhỏ dưới thông báo', 'Sự kiện PACKAGE_HEALED'],
  'ad.ev.PACKAGE_ROW_MISSING': ['Mất dòng gói', 'Package row missing', 'Dòng nhỏ dưới thông báo', 'Sự kiện PACKAGE_ROW_MISSING'],
  'ad.ev.PACKAGE_PASTE_UNSAFE': ['Dán đè ô gói không tự lành', 'Package paste needs restore', 'Dòng nhỏ dưới thông báo', 'Sự kiện PACKAGE_PASTE_UNSAFE'],
  'ad.ev.BOOKING_OUT_OF_RANGE': ['Buổi nằm ngoài hạn gói', 'Lesson outside package dates', 'Dòng nhỏ dưới thông báo', 'Sự kiện BOOKING_OUT_OF_RANGE'],
  'ad.ev.TRIAL_OVER_LIMIT': ['Trial quá số lượt', 'Trial over limit', 'Dòng nhỏ dưới thông báo', 'Sự kiện TRIAL_OVER_LIMIT'],
  'ad.ev.RESULT_OVERDUE': ['Tutor quá hạn chọn kết quả', 'Tutor result overdue', 'Dòng nhỏ dưới thông báo', 'Sự kiện RESULT_OVERDUE'],
  'ad.ev.REASSIGN_STUCK': ['Buổi kẹt chờ đổi tutor', 'Lesson stuck waiting for a tutor', 'Dòng nhỏ dưới thông báo', 'Sự kiện REASSIGN_STUCK'],
  'ad.ev.RESULT_NOT_COMPLETED': ['Buổi Không hoàn thành', 'Lesson not completed', 'Dòng nhỏ dưới thông báo', 'Sự kiện RESULT_NOT_COMPLETED'],
  'ad.ev.TECH_MIGRATED': ['Chuyển buổi kỹ thuật cũ', 'Old technical lessons moved', 'Dòng nhỏ dưới thông báo', 'Sự kiện TECH_MIGRATED'],
  // Tên hành động trong nhật ký (chữ đậm ở mỗi dòng). Mã gốc là cột action của ACTIVITY_LOG.
  'ad.act.LOGIN': ['Đăng nhập', 'Signed in', 'Chữ đậm ở dòng nhật ký', 'Hành động LOGIN'],
  'ad.act.LOGOUT': ['Thoát', 'Signed out', 'Chữ đậm ở dòng nhật ký', 'Hành động LOGOUT'],
  'ad.act.LOGOUT_ALL': ['Thoát mọi thiết bị', 'Signed out everywhere', 'Chữ đậm ở dòng nhật ký', 'Hành động LOGOUT_ALL'],
  'ad.act.LOGIN_LINK_SENT': ['Gửi link đăng nhập', 'Login link sent', 'Chữ đậm ở dòng nhật ký', 'Hành động LOGIN_LINK_SENT'],
  'ad.act.LOGIN_LINK_RESENT': ['Admin gửi lại link đăng nhập', 'Admin resent login link', 'Chữ đậm ở dòng nhật ký', 'Hành động LOGIN_LINK_RESENT'],
  'ad.act.GOOGLE_LOGIN_DENIED': ['Đăng nhập Google bị từ chối', 'Google sign in denied', 'Chữ đậm ở dòng nhật ký', 'Hành động GOOGLE_LOGIN_DENIED'],
  'ad.act.GOOGLE_LOGIN_SECRET_CREATED': ['Tạo khoá đăng nhập Google', 'Google login key created', 'Chữ đậm ở dòng nhật ký', 'Hành động GOOGLE_LOGIN_SECRET_CREATED'],
  'ad.act.SESSIONS_REVOKED_DISABLED': ['Huỷ phiên của tài khoản bị khoá', 'Sessions of disabled accounts ended', 'Chữ đậm ở dòng nhật ký', 'Hành động SESSIONS_REVOKED_DISABLED'],
  'ad.act.FORBIDDEN_ROLE': ['Vào trang không đúng quyền', 'Wrong role access', 'Chữ đậm ở dòng nhật ký', 'Hành động FORBIDDEN_ROLE'],
  'ad.act.FORBIDDEN_RESULT_ATTEMPT': ['Báo kết quả buổi không phải của mình', 'Result for someone else\'s lesson', 'Chữ đậm ở dòng nhật ký', 'Hành động FORBIDDEN_RESULT_ATTEMPT'],
  'ad.act.FORBIDDEN_CANCEL_ATTEMPT': ['Huỷ buổi không phải của mình', 'Cancel of someone else\'s lesson', 'Chữ đậm ở dòng nhật ký', 'Hành động FORBIDDEN_CANCEL_ATTEMPT'],
  'ad.act.LANG_SET': ['Đổi ngôn ngữ', 'Language changed', 'Chữ đậm ở dòng nhật ký', 'Hành động LANG_SET'],
  'ad.act.PROFILE_UPDATED': ['Sửa hồ sơ', 'Profile updated', 'Chữ đậm ở dòng nhật ký', 'Hành động PROFILE_UPDATED'],
  'ad.act.BOOKED': ['Đặt buổi', 'Booked', 'Chữ đậm ở dòng nhật ký', 'Hành động BOOKED'],
  'ad.act.CANCELLED': ['Huỷ buổi', 'Cancelled', 'Chữ đậm ở dòng nhật ký', 'Hành động CANCELLED'],
  'ad.act.REASSIGNED': ['Đổi tutor', 'Tutor changed', 'Chữ đậm ở dòng nhật ký', 'Hành động REASSIGNED'],
  'ad.act.TUTOR_ABSENT': ['Ghi tutor vắng', 'Tutor marked absent', 'Chữ đậm ở dòng nhật ký', 'Hành động TUTOR_ABSENT'],
  'ad.act.PAYROLL_OVERRIDE': ['Tính lương buổi kỹ thuật', 'Payroll override', 'Chữ đậm ở dòng nhật ký', 'Hành động PAYROLL_OVERRIDE'],
  'ad.act.SESSION_RESULT': ['Tutor báo kết quả buổi', 'Lesson result', 'Chữ đậm ở dòng nhật ký', 'Hành động SESSION_RESULT'],
  'ad.act.AUTO_COMPLETED': ['Tự chuyển Hoàn thành', 'Auto completed', 'Chữ đậm ở dòng nhật ký', 'Hành động AUTO_COMPLETED'],
  'ad.act.AVAIL_OPEN': ['Tutor mở giờ', 'Slots opened', 'Chữ đậm ở dòng nhật ký', 'Hành động AVAIL_OPEN'],
  'ad.act.AVAIL_CLOSE': ['Tutor đóng giờ', 'Slots closed', 'Chữ đậm ở dòng nhật ký', 'Hành động AVAIL_CLOSE'],
  'ad.act.AVAIL_CANCEL_REQUEST': ['Tutor xin huỷ giờ', 'Slot cancel request', 'Chữ đậm ở dòng nhật ký', 'Hành động AVAIL_CANCEL_REQUEST'],
  'ad.act.AVAIL_CANCEL_APPROVED': ['Duyệt tutor huỷ giờ', 'Slot cancel approved', 'Chữ đậm ở dòng nhật ký', 'Hành động AVAIL_CANCEL_APPROVED'],
  'ad.act.AVAIL_CANCEL_REJECTED': ['Từ chối tutor huỷ giờ', 'Slot cancel rejected', 'Chữ đậm ở dòng nhật ký', 'Hành động AVAIL_CANCEL_REJECTED'],
  'ad.act.REG_CREATED': ['Gửi đăng ký', 'Registration sent', 'Chữ đậm ở dòng nhật ký', 'Hành động REG_CREATED'],
  'ad.act.REG_APPROVED': ['Duyệt đăng ký', 'Registration approved', 'Chữ đậm ở dòng nhật ký', 'Hành động REG_APPROVED'],
  'ad.act.REG_REJECTED': ['Từ chối đăng ký', 'Registration rejected', 'Chữ đậm ở dòng nhật ký', 'Hành động REG_REJECTED'],
  'ad.act.USER_CREATED': ['Tạo tài khoản học viên', 'Student account created', 'Chữ đậm ở dòng nhật ký', 'Hành động USER_CREATED'],
  'ad.act.TUTOR_ADDED': ['Thêm tutor', 'Tutor added', 'Chữ đậm ở dòng nhật ký', 'Hành động TUTOR_ADDED'],
  'ad.act.ADMIN_ADDED': ['Thêm admin', 'Admin added', 'Chữ đậm ở dòng nhật ký', 'Hành động ADMIN_ADDED'],
  'ad.act.STUDENT_SUSPENDED': ['Tạm khoá học viên', 'Student suspended', 'Chữ đậm ở dòng nhật ký', 'Hành động STUDENT_SUSPENDED'],
  'ad.act.STUDENT_UNSUSPENDED': ['Mở khoá học viên', 'Student unsuspended', 'Chữ đậm ở dòng nhật ký', 'Hành động STUDENT_UNSUSPENDED'],
  'ad.act.PACKAGE_RECOMPUTED': ['Tính lại hạn gói', 'Package dates recomputed', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_RECOMPUTED'],
  'ad.act.PACKAGE_START_LOCKED': ['Khoá ngày bắt đầu gói', 'Package start locked', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_START_LOCKED'],
  'ad.act.PACKAGE_EDIT_DENIED': ['Trả lại ô gói bị sửa', 'Package edit reverted', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_EDIT_DENIED'],
  'ad.act.PACKAGE_ADMIN_EDIT': ['Admin sửa hạn hoặc ngày bù', 'Admin edited end date or make up days', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_ADMIN_EDIT'],
  'ad.act.PACKAGE_MIGRATED': ['Chuyển gói sang luật 8.1.0', 'Package moved to 8.1.0 rules', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_MIGRATED'],
  'ad.act.COMP_EXTENDED': ['Cộng ngày bù', 'Make up days added', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_EXTENDED'],
  'ad.act.COMP_NO_DAYS': ['Bù lượt, không cộng ngày', 'Lesson returned, no days', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_NO_DAYS (Trial đã dùng lần cộng ngày)'],
  'ad.act.COMP_RETRACTED': ['Rút ngày bù', 'Make up days removed', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_RETRACTED'],
  'ad.act.COMP_ON_EXPIRED': ['Bù cho gói đã hết hạn', 'Make up on expired package', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_ON_EXPIRED'],
  'ad.act.COMP_RETRACT_BLOCKED': ['Chưa rút được ngày bù', 'Make up days not removed', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_RETRACT_BLOCKED'],
  'ad.act.BOOKING_MOVED_PKG': ['Chuyển buổi sang gói trước', 'Lesson moved to earlier package', 'Chữ đậm ở dòng nhật ký', 'Hành động BOOKING_MOVED_PKG'],
  'ad.act.TECH_FAULT': ['Chọn lỗi buổi kỹ thuật', 'Technical fault chosen', 'Chữ đậm ở dòng nhật ký', 'Hành động TECH_FAULT'],
  'ad.act.COMP_TO_NEXT': ['Bù ngày vào gói sau', 'Make up days moved to next package', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_TO_NEXT'],
  'ad.act.BOOKING_OUT_OF_RANGE': ['Buổi nằm ngoài hạn gói', 'Lesson outside package dates', 'Chữ đậm ở dòng nhật ký', 'Hành động BOOKING_OUT_OF_RANGE'],
  'ad.act.RESULT_OVERDUE': ['Báo tutor quá hạn chọn kết quả', 'Result overdue alert', 'Chữ đậm ở dòng nhật ký', 'Hành động RESULT_OVERDUE'],
  'ad.act.REASSIGN_STUCK': ['Báo buổi kẹt chờ đổi tutor', 'Stuck reassignment alert', 'Chữ đậm ở dòng nhật ký', 'Hành động REASSIGN_STUCK'],
  'ad.act.ADMIN_MARK_DONE': ['Admin đánh dấu đã xử lý', 'Admin marked as handled', 'Chữ đậm ở dòng nhật ký', 'Hành động ADMIN_MARK_DONE (cột admin_action: Đã xử lý (giữ nguyên))'],
  'ad.act.RESULT_NOT_COMPLETED': ['Buổi thành Không hoàn thành', 'Lesson became Not completed', 'Chữ đậm ở dòng nhật ký', 'Hành động RESULT_NOT_COMPLETED'],
  'ad.act.ADMIN_RESULT': ['Admin chọn kết quả buổi', 'Admin set lesson result', 'Chữ đậm ở dòng nhật ký', 'Hành động ADMIN_RESULT'],
  'ad.act.COMP_DRY_RUN': ['Xem trước luật bù buổi', 'Make up rules preview', 'Chữ đậm ở dòng nhật ký', 'Hành động COMP_DRY_RUN'],
  'ad.act.TUTOR_DISABLED': ['Khoá tutor', 'Tutor locked', 'Chữ đậm ở dòng nhật ký', 'Hành động TUTOR_DISABLED (menu Khoá tutor, 5L)'],
  'ad.act.TUTOR_ENABLED': ['Mở khoá tutor', 'Tutor unlocked', 'Chữ đậm ở dòng nhật ký', 'Hành động TUTOR_ENABLED (5L)'],
  'ad.act.SYSTEM_MOVE_PREPARED': ['Chuẩn bị chuyển hệ thống', 'System move prepared', 'Chữ đậm ở dòng nhật ký', 'Hành động SYSTEM_MOVE_PREPARED (5L)'],
  'ad.act.SYSTEM_IMPORTED': ['Chép dữ liệu từ hệ thống cũ', 'Imported from old system', 'Chữ đậm ở dòng nhật ký', 'Hành động SYSTEM_IMPORTED (5L)'],
  'ad.act.TRIGGERS_STOPPED': ['Tắt hết trigger', 'Triggers stopped', 'Chữ đậm ở dòng nhật ký', 'Hành động TRIGGERS_STOPPED (5L)'],
  'ad.act.PACKAGE_ADDED': ['Thêm gói', 'Package added', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_ADDED (menu Thêm gói, 5L)'],
  'ad.act.PACKAGE_REMOVED': ['Xoá dòng gói', 'Package row removed', 'Chữ đậm ở dòng nhật ký', 'Hành động PACKAGE_REMOVED (5L: bỏ gói LEGACY)'],
  'ad.act.PACKAGE_': ['Gói chuyển sang {x}', 'Package became {x}', 'Chữ đậm ở dòng nhật ký. {x}: trạng thái gói mới', 'Hành động PACKAGE_ACTIVE, PACKAGE_EXPIRED...'],
  'ad.act.NOTIF_READ': ['Đánh dấu thông báo đã đọc', 'Notifications marked read', 'Chữ đậm ở dòng nhật ký', 'Hành động NOTIF_READ'],
  'ad.act.MAIL_FAILED': ['Email gửi lỗi', 'Email failed', 'Chữ đậm ở dòng nhật ký', 'Hành động MAIL_FAILED'],
  'ad.act.MAIL_FALLBACK': ['GmailApp thiếu quyền, gửi bằng MailApp', 'GmailApp lacked permission, sent with MailApp', 'Chữ đậm ở dòng nhật ký', 'Hành động MAIL_FALLBACK (5Q)'],
  'ad.act.MAIL_SKIPPED_LOW_QUOTA': ['Bỏ email vì gần hết hạn mức', 'Email skipped, low quota', 'Chữ đậm ở dòng nhật ký', 'Hành động MAIL_SKIPPED_LOW_QUOTA'],
  'ad.act.MAIL_TEMPLATE_OFF': ['Mẫu email đang tắt', 'Email template off', 'Chữ đậm ở dòng nhật ký', 'Hành động MAIL_TEMPLATE_OFF'],
  'ad.act.MAIL_TEST': ['Gửi email kiểm tra', 'Test email sent', 'Chữ đậm ở dòng nhật ký', 'Hành động MAIL_TEST (menu Kiểm tra gửi email)'],
  'ad.act.MAIL_PREVIEW': ['Gửi thử mẫu email', 'Email template preview', 'Chữ đậm ở dòng nhật ký', 'Hành động MAIL_PREVIEW'],
  'ad.act.MARKETING_SENT': ['Gửi email marketing', 'Marketing email sent', 'Chữ đậm ở dòng nhật ký', 'Hành động MARKETING_SENT'],
  'ad.act.MARKETING_TEST': ['Gửi thử email marketing', 'Marketing test sent', 'Chữ đậm ở dòng nhật ký', 'Hành động MARKETING_TEST'],
  'ad.act.CALENDAR_QUEUE': ['Hàng đợi Calendar chạy', 'Calendar queue ran', 'Chữ đậm ở dòng nhật ký', 'Hành động CALENDAR_QUEUE'],
  'ad.act.CALENDAR_CREATE_FAILED': ['Tạo sự kiện Calendar lỗi', 'Calendar create failed', 'Chữ đậm ở dòng nhật ký', 'Hành động CALENDAR_CREATE_FAILED'],
  'ad.act.CALENDAR_PATCH_FAILED': ['Sửa sự kiện Calendar lỗi', 'Calendar update failed', 'Chữ đậm ở dòng nhật ký', 'Hành động CALENDAR_PATCH_FAILED'],
  'ad.act.CALENDAR_REMOVE_FAILED': ['Gỡ sự kiện Calendar lỗi', 'Calendar remove failed', 'Chữ đậm ở dòng nhật ký', 'Hành động CALENDAR_REMOVE_FAILED'],
  'ad.act.CALENDAR_ADMIN_GUEST_FAILED': ['Thêm admin vào Meet lỗi', 'Adding admin to Meet failed', 'Chữ đậm ở dòng nhật ký', 'Hành động CALENDAR_ADMIN_GUEST_FAILED'],
  'ad.act.EVENTS_DETACHED': ['Gỡ sự kiện (chuyển tài khoản)', 'Events detached (account move)', 'Chữ đậm ở dòng nhật ký', 'Hành động EVENTS_DETACHED'],
  'ad.act.EVENTS_RECREATED': ['Tạo lại sự kiện (chuyển tài khoản)', 'Events recreated (account move)', 'Chữ đậm ở dòng nhật ký', 'Hành động EVENTS_RECREATED'],
  'ad.act.SHEET_CHANGE': ['Đổi cấu trúc trong Sheets', 'Sheet structure changed', 'Chữ đậm ở dòng nhật ký', 'Hành động SHEET_CHANGE (xoá, chèn dòng, cột; thêm, xoá, đổi tên tab)'],
  'ad.act.ENV_PRODUCTION': ['Chuyển sang PRODUCTION', 'Switched to PRODUCTION', 'Chữ đậm ở dòng nhật ký', 'Hành động ENV_PRODUCTION (hàm switchToProduction)'],
  'ad.act.SIM_NOW': ['Giả lập thời gian', 'Simulated time', 'Chữ đậm ở dòng nhật ký', 'Hành động SIM_NOW (chỉ STAGING; chi tiết là giờ giả hoặc OFF)'],
  'ad.act.LOADTEST_OFF': ['Thử tải: tắt cổng', 'Load test gate off', 'Chữ đậm ở dòng nhật ký', 'Hành động LOADTEST_OFF (chỉ STAGING)'],
  'ad.act.SHEET_EDIT': ['Sửa tay trong Sheets', 'Edited in Sheets', 'Chữ đậm ở dòng nhật ký', 'Hành động SHEET_EDIT (admin gõ, chọn, dán trong file Sheets)'],
  'ad.act.SETUP_RUN': ['Chạy menu 1 (cài đặt, cập nhật)', 'Setup menu run', 'Chữ đậm ở dòng nhật ký', 'Hành động SETUP_RUN'],
  'ad.act.TRIGGERS_CREATED': ['Tạo lại trigger', 'Triggers recreated', 'Chữ đậm ở dòng nhật ký', 'Hành động TRIGGERS_CREATED'],
  'ad.act.CONTENT_REFRESHED': ['Cập nhật chữ web và email', 'Web and email text refreshed', 'Chữ đậm ở dòng nhật ký', 'Hành động CONTENT_REFRESHED'],
  'ad.act.REPORT_REFRESHED': ['Làm mới báo cáo tháng', 'Monthly report refreshed', 'Chữ đậm ở dòng nhật ký', 'Hành động REPORT_REFRESHED'],
  'ad.act.BACKUP_DONE': ['Sao lưu file DB', 'DB backup done', 'Chữ đậm ở dòng nhật ký', 'Hành động BACKUP_DONE'],
  'ad.act.RELEASE': ['Cập nhật phiên bản code', 'Code version updated', 'Chữ đậm ở dòng nhật ký', 'Hành động RELEASE'],
  'ad.act.RELEASE_BACKUP': ['Sao lưu trước khi cập nhật', 'Backup before update', 'Chữ đậm ở dòng nhật ký', 'Hành động RELEASE_BACKUP'],
  'ad.act.MAINTENANCE_': ['Bảo trì: {x}', 'Maintenance: {x}', 'Chữ đậm ở dòng nhật ký. {x}: OFF, READONLY, CLOSED', 'Hành động MAINTENANCE_...'],
  'ad.act.ARCHIVED': ['Lưu trữ dòng cũ', 'Old rows archived', 'Chữ đậm ở dòng nhật ký', 'Hành động ARCHIVED'],
  'ad.act.ARCHIVE_RECOVER': ['Hoàn tất lô lưu trữ dở', 'Archive batch recovered', 'Chữ đậm ở dòng nhật ký', 'Hành động ARCHIVE_RECOVER'],
  'ad.act.ARCHIVE_FILE_CREATED': ['Tạo file lưu trữ năm', 'Archive file created', 'Chữ đậm ở dòng nhật ký', 'Hành động ARCHIVE_FILE_CREATED'],
  'ad.act.ARCHIVE_FOLDER_CREATED': ['Tạo thư mục lưu trữ', 'Archive folder created', 'Chữ đậm ở dòng nhật ký', 'Hành động ARCHIVE_FOLDER_CREATED'],
  'ad.act.PURGE_RECOVERED': ['Dọn lần bỏ dòng dở', 'Row removal recovered', 'Chữ đậm ở dòng nhật ký', 'Hành động PURGE_RECOVERED'],
  'ad.act.DATA_RESET_STARTED': ['Bắt đầu xoá dữ liệu test', 'Test data reset started', 'Chữ đậm ở dòng nhật ký', 'Hành động DATA_RESET_STARTED'],
  'ad.act.DATA_RESET': ['Xoá dữ liệu test', 'Test data reset', 'Chữ đậm ở dòng nhật ký', 'Hành động DATA_RESET'],
  'ad.act.MIGRATED_FROM_V6': ['Chuyển dữ liệu từ v6', 'Migrated from v6', 'Chữ đậm ở dòng nhật ký', 'Hành động MIGRATED_FROM_V6'],
  'ad.act.SPEED_TEST': ['Đo tốc độ', 'Speed test', 'Chữ đậm ở dòng nhật ký', 'Hành động SPEED_TEST'],
  'ad.act.JOB_SLOW': ['Job chạy chậm', 'Slow job', 'Chữ đậm ở dòng nhật ký', 'Hành động JOB_SLOW (job chạy quá 20 giây)'],
  'ad.act.LOADTEST_SEED': ['Thử tải: tạo dữ liệu giả', 'Load test data created', 'Chữ đậm ở dòng nhật ký', 'Hành động LOADTEST_SEED (chỉ STAGING)'],
  'ad.act.LOADTEST_ON': ['Thử tải: bật cổng', 'Load test gate on', 'Chữ đậm ở dòng nhật ký', 'Hành động LOADTEST_ON (chỉ STAGING)'],
};

// ── Câu báo lỗi từ máy chủ: r.MÃ, cột vi và en. Tiếng Việt lấy từ REASON_TEXT_VI (Config.gs) trừ khi có REASON_VI_OVERRIDE_. ──
var REASON_TEXT_EN_ = {
  DISABLED: 'Booking is paused right now. Please message admin on Zalo.',
  NOT_ACTIVE: 'Your account is not active yet.',
  SUSPENDED: 'Your account is suspended. Please contact admin.',
  DEADLINE: 'The deadline for this time has passed.',
  INVALID_SLOT: 'This time slot is not valid.',
  ONE_PER_DAY: 'Only 1 lesson per day can be booked.',
  NO_PACKAGE: 'No active package.',
  EXPIRED: 'The package has expired.',
  OUT_OF_RANGE: 'This date is outside the package period.',
  NO_SESSIONS: 'No lessons left in the package.',
  NO_TUTOR: 'No tutor is available for this slot.',
  CANCEL_DEADLINE: 'The cancellation deadline has passed.',
  FORBIDDEN: 'You do not have permission for this action.',
  NOT_FOUND: 'Not found.',
  INVALID_PHONE: 'Phone number is not valid.',
  TRIAL_USED: 'Trial can be used once per email.',
  PACKAGE_CONTACT: 'This package is arranged with admin on Zalo, not on the website.',
  PACKAGE_BROKEN: 'This package is being updated and cannot be booked right now. Message admin on Zalo or pick another package.',
  MISSING_SCREENSHOT: 'Please upload the payment screenshot.',
  MISSING_CONSENT: 'Please accept the data policy.',
  INVALID_INPUT: 'Some information is not valid. Please check again.',
  TOO_EARLY: 'This lesson has not started yet.',
  RATE_LIMITED: 'Too many requests. Please try again in {minutes} minutes.',
  REG_RATE_LIMITED: 'Too many registrations right now. Please try again in a few minutes.',
  SLOT_BLOCKED: 'This slot is locked after an approved cancellation. Only admin can reopen it.',
  BUSY: 'The system is busy. Please try again in a few seconds.',
  IN_PROGRESS: 'Your previous action is still being processed. Please wait a few seconds.',
  TOO_FAR: 'You can only plan a few weeks ahead.',
  LINK_INVALID: 'This login link is not valid. Please request a new login link.',
  LINK_USED: 'This login link has been used. Please request a new login link.',
  LINK_EXPIRED: 'This login link has expired. Please request a new login link.',
  SESSION_INVALID: 'Your session has expired. Please log in again.',
  SERVER_ERROR: 'Something went wrong and admin has been notified. Please try again in a few minutes or message admin on Zalo.',
  MAINT_READONLY: 'The system is under maintenance{until}. You can still view your schedule; changes are paused.',
  MAINT_CLOSED: 'The system is under maintenance{until}. Please come back later or message admin on Zalo.',
  GLOGIN_INVALID: 'Google sign in could not be verified. Open the Google sign in button again.',
  GLOGIN_EXPIRED: 'Google sign in took too long (over 2 minutes). Open the Google sign in button again.',
  GLOGIN_USED: 'This Google sign in was already used. Open the Google sign in button again.',
  GLOGIN_DENIED: 'Google account {email} has no access. Use the account registered with thaiput, or sign in with an email link.',
  SLOT_STARTED: 'The lesson has already started, the tutor can no longer be changed. Use "Tutor absent" if the tutor did not teach.',
  LINK_COOLDOWN: 'If the email is registered, a link was sent at {sent}. Check your Spam folder too. You can request a new link after {next}.'
};
var REASON_VI_OVERRIDE_ = {
  GLOGIN_INVALID: 'Không xác minh được đăng nhập Google. Bấm lại nút đăng nhập Google.',
  GLOGIN_EXPIRED: 'Đăng nhập Google quá 2 phút. Bấm lại nút đăng nhập Google.',
  GLOGIN_USED: 'Lần đăng nhập Google này đã được dùng. Bấm lại nút đăng nhập Google.',
  GLOGIN_DENIED: 'Tài khoản Google {email} chưa được cấp quyền. Dùng đúng tài khoản đã đăng ký với thaiput, hoặc đăng nhập bằng link email.',
  RATE_LIMITED: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau {minutes} phút.',
  REG_RATE_LIMITED: 'Hệ thống đang nhận quá nhiều đăng ký. Vui lòng thử lại sau ít phút hoặc nhắn Zalo admin.'
};
/** Câu báo lỗi xuất hiện khi nào (cột shown_when của dòng r.MÃ). */
var REASON_WHEN_ = {
  DISABLED: 'CONFIG BOOKING_ENABLED = FALSE, có người bấm Đặt', NOT_ACTIVE: 'Tài khoản chưa ACTIVE đăng nhập hoặc đặt', SUSPENDED: 'Tài khoản SUSPENDED bấm Đặt',
  DEADLINE: 'Đặt giờ đã quá hạn đặt', INVALID_SLOT: 'Giờ không có trong danh sách slot', ONE_PER_DAY: 'Gói theo ngày, đặt buổi thứ hai trong cùng ngày',
  NO_PACKAGE: 'Đặt khi chưa có gói', EXPIRED: 'Đặt khi gói đã hết hạn', OUT_OF_RANGE: 'Đặt ngày nằm ngoài thời hạn gói', NO_SESSIONS: 'Gói theo buổi đã dùng hết',
  NO_TUTOR: 'Không còn tutor rảnh giờ đó (người khác vừa đặt mất)', CANCEL_DEADLINE: 'Huỷ sau hạn huỷ', FORBIDDEN: 'Thao tác không đúng quyền (hiếm)', NOT_FOUND: 'Buổi, gói hoặc người không còn',
  INVALID_PHONE: 'Số điện thoại sai dạng', TRIAL_USED: 'Email đã dùng Trial đăng ký Trial lần nữa', PACKAGE_CONTACT: 'Gửi đăng ký gói có giá 0 (gói chỉ đăng ký qua Zalo, 5K)', PACKAGE_BROKEN: 'Gửi đăng ký gói có mã trùng hoặc dòng gói sai trong PACKAGES (5L)', MISSING_SCREENSHOT: 'Gửi đăng ký thiếu ảnh', MISSING_CONSENT: 'Gửi đăng ký chưa tick đồng ý',
  INVALID_INPUT: 'Dữ liệu gửi lên sai dạng', TOO_EARLY: 'Tutor xác nhận buổi chưa diễn ra', RATE_LIMITED: 'Yêu cầu link đăng nhập quá nhiều lần. {minutes}: số phút chờ',
  REG_RATE_LIMITED: 'Quá nhiều đăng ký trong thời gian ngắn', SLOT_BLOCKED: 'Tutor chạm giờ đã bị khoá sau khi duyệt huỷ', BUSY: 'Hệ thống bận quá 30 giây (đông người)',
  IN_PROGRESS: 'Thao tác trước cùng nút còn đang chạy', TOO_FAR: 'Mở giờ hoặc đặt quá xa (quá số tuần cho phép)', LINK_INVALID: 'Mở link đăng nhập sai', LINK_USED: 'Mở lại link đăng nhập dùng 1 lần',
  LINK_EXPIRED: 'Mở link đăng nhập quá 15 phút', SESSION_INVALID: 'Phiên đăng nhập hết hạn hoặc bị cho thoát', SERVER_ERROR: 'Lỗi bất ngờ trong code (admin nhận email lỗi)',
  MAINT_READONLY: 'Bảo trì chỉ xem, có người bấm đặt, huỷ, lưu', MAINT_CLOSED: 'Bảo trì đóng cổng', GLOGIN_INVALID: 'Đăng nhập Google: chữ ký sai', GLOGIN_EXPIRED: 'Đăng nhập Google quá 2 phút',
  GLOGIN_USED: 'Đăng nhập Google dùng lại lần hai', GLOGIN_DENIED: 'Tài khoản Google không phải admin. {email}: tài khoản đã dùng',
  SLOT_STARTED: 'Admin đổi tutor cho buổi đã qua giờ bắt đầu',
  LINK_COOLDOWN: 'Xin link lần hai trong LOGIN_LINK_COOLDOWN_MINUTES phút (email có hay không có tài khoản đều thấy câu này). {sent}, {next}: giờ'
};

/**
 * Toàn bộ chữ mặc định: key → { vi, en, page, position, shown_when }. Chữ giao diện cộng câu báo lỗi máy chủ
 * (tính lúc gọi, không phụ thuộc thứ tự nạp file).
 */
function contentDefaults_() {
  var out = {};
  Object.keys(DEFAULT_CONTENT_).forEach(function (k) {
    var d = DEFAULT_CONTENT_[k];
    out[k] = { vi: d[0], en: d[1], page: contentPage_(k), position: d[2] || '', shown_when: d[3] || '' };
  });
  Object.keys(REASON_TEXT_EN_).forEach(function (code) {
    out['r.' + code] = { vi: REASON_VI_OVERRIDE_[code] || REASON_TEXT_VI[code] || REASON_TEXT_EN_[code], en: REASON_TEXT_EN_[code], page: CONTENT_PAGES_.r,
      position: 'Hộp báo đỏ hoặc thông báo nhỏ (mã ' + code + ')', shown_when: REASON_WHEN_[code] || '' };
  });
  return out;
}
function normLang_(lang) { return lang === 'en' ? 'en' : 'vi'; }

/** Câu báo lỗi theo mã. lang: 'vi', 'en', 'both' (cả hai, cách nhau " / "). */
function reasonText_(code, lang, vars) {
  if (!code) return '';
  var p = reasonPair_(code, vars);
  return lang === 'en' ? p.en : lang === 'both' ? (p.vi === p.en ? p.vi : p.vi + ' / ' + p.en) : p.vi;
}
/** Câu báo lỗi cả hai thứ tiếng { vi, en }, để trình duyệt hiện theo ngôn ngữ người dùng chọn (chunk 5H). */
function reasonPair_(code, vars) {
  var m = contentMap_(), e = m['r.' + code], sub = function (s) { return String(s || '').replace(/\{(\w+)\}/g, function (x, k) { return vars && vars[k] !== undefined ? String(vars[k]) : x; }); };
  return { vi: sub(e ? e[0] : (REASON_TEXT_VI[code] || code)), en: sub(e ? e[1] : (REASON_TEXT_EN_[code] || code)) };
}

/**
 * Bản đồ chữ trên web đang dùng: key → [vi, en]. CONTENT ghi đè mặc định. Có bộ nhớ đệm để không đọc Sheets mỗi lần mở trang.
 * Ô trống: dùng chữ gốc; ô "-": cố ý để trống. Cột en trống mà chữ gốc tiếng Anh cũng trống: dùng tiếng Việt.
 */
var CONTENT_MEMO_ = null;   // trong một lần chạy chỉ đọc bộ đệm một lần (một trang có thể cần hàng trăm nhãn)
function contentMap_() {
  if (CONTENT_MEMO_) return CONTENT_MEMO_;
  CONTENT_MEMO_ = contentMapLoad_();
  return CONTENT_MEMO_;
}
function contentMapLoad_() {
  var cache = null;
  // Hai khoá bộ đệm (một cho mỗi thứ tiếng): mỗi giá trị bộ đệm Google tối đa 100KB.
  try {
    cache = CacheService.getScriptCache();
    var hit = cache.getAll([CONTENT_CACHE_KEY_ + '_vi', CONTENT_CACHE_KEY_ + '_en']);
    if (hit && hit[CONTENT_CACHE_KEY_ + '_vi'] && hit[CONTENT_CACHE_KEY_ + '_en']) {
      var vi = JSON.parse(hit[CONTENT_CACHE_KEY_ + '_vi']), en = JSON.parse(hit[CONTENT_CACHE_KEY_ + '_en']), m = {};
      Object.keys(vi).forEach(function (k) { m[k] = [vi[k], en[k] !== undefined ? en[k] : vi[k]]; });
      return m;
    }
  } catch (e) { cache = null; }
  var out = {}, defs = contentDefaults_();
  Object.keys(defs).forEach(function (k) { out[k] = [defs[k].vi, defs[k].en || defs[k].vi]; });
  var cell = function (v) { return v === undefined || v === null ? '' : String(v); };
  try {
    table_('CONTENT').all().forEach(function (r) {
      var k = String(r.key || '').trim(); if (!k) return;
      var cur = out[k] || ['', ''];
      var vi = cell(r.vi), en = cell(r.en);
      if (vi !== '') cur[0] = vi.trim() === '-' ? '' : vi;
      if (en !== '') cur[1] = en.trim() === '-' ? '' : en;
      else if (!out[k]) cur[1] = cur[0];   // key admin tự thêm, chỉ có tiếng Việt
      out[k] = cur;
    });
  } catch (e) { }
  try {
    if (cache) {
      var pv = {}, pe = {};
      Object.keys(out).forEach(function (k) { pv[k] = out[k][0]; pe[k] = out[k][1]; });
      var put = {}; put[CONTENT_CACHE_KEY_ + '_vi'] = JSON.stringify(pv); put[CONTENT_CACHE_KEY_ + '_en'] = JSON.stringify(pe);
      cache.putAll(put, CONTENT_CACHE_SECONDS_);
    }
  } catch (e) { }
  return out;
}
function clearContentCache_() {
  TEMPLATE_CACHE_ = null; CONTENT_MEMO_ = null; USER_LANG_MEMO_ = null;
  try { CacheService.getScriptCache().removeAll([CONTENT_CACHE_KEY_ + '_vi', CONTENT_CACHE_KEY_ + '_en']); } catch (e) { }
}
/** Một chữ của web ở server (ví dụ câu trong email), có thay {bien}. lang mặc định tiếng Việt. */
function contentText_(key, vars, lang) {
  var m = contentMap_(), i = normLang_(lang) === 'en' ? 1 : 0, e = m[key], d = contentDefaults_()[key];
  var s = e ? String(e[i]) : String(d ? d[normLang_(lang)] : key);   // '' (ô ghi -) là cố ý để trống
  return s.replace(/\{(\w+)\}/g, function (x, k) { return vars && vars[k] !== undefined ? String(vars[k]) : x; });
}

/** Nhãn trạng thái một buổi cho học viên và admin. Buổi đã diễn ra mà tutor chưa xác nhận: "Chờ tutor xác nhận". */
function bookingAwaiting_(b, now) { return b.status === BOOKING_STATUS.CONFIRMED && !(now < slotEnd_(b.date, b.slot)); }
function bookingStatusText_(b, now, lang) {
  if (bookingAwaiting_(b, now)) return contentText_('st.awaiting', null, lang);
  var m = contentMap_(), e = m['st.' + b.status];
  return e ? e[normLang_(lang) === 'en' ? 1 : 0] : (BOOKING_STATUS_VI[b.status] || b.status);
}

// ── Chuyển tab CONTENT bản cũ (cột value, default_value; trước 8.0.9) sang bản song ngữ ──
var CONTENT_OLD_KEY_MAP_ = { 'a.zalo_vi': ['a.zalo', 'vi'], 'a.zalo_en': ['a.zalo', 'en'] };
/**
 * Bước 1 (gọi trước khi tạo tab theo SCHEMA): tab CONTENT còn cột value thì đổi tên thành CONTENT_CU_808 (ẩn, không xoá).
 * Bước 1 của menu Cài đặt sau đó tạo tab CONTENT mới đúng cột. Tên tab cũ được ghi vào Script Properties TRƯỚC khi đổi tên
 * (MIG_CONTENT_809), để bước chép chạy lại được nếu lượt menu 1 bị cắt giữa chừng (soát 5H S1). Trả tên tab cũ hoặc null.
 */
var CONTENT_MIG_PROP_ = 'MIG_CONTENT_809';
/** Khoá theo từng file dữ liệu (một dự án có thể từng chạy STAGING rồi chuyển PRODUCTION, soát 5H B2). */
function contentMigKey_(ss) { return CONTENT_MIG_PROP_ + '_' + ss.getId(); }
function contentHeader_(sh) { return sh && sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); }) : []; }
function contentDetachOld_(ss) {
  var sh = ss.getSheetByName('CONTENT');
  if (!sh) return null;
  var header = contentHeader_(sh);
  if (header.indexOf('value') === -1 || header.indexOf('vi') !== -1) return null;
  var name = 'CONTENT_CU_808', i = 2;
  while (ss.getSheetByName(name)) name = 'CONTENT_CU_808_' + (i++);
  props_().setProperty(contentMigKey_(ss), 'PENDING:' + name);
  sh.setName(name);
  try { sh.hideSheet(); } catch (e) { }
  clearDbCache_();
  return name;
}
/** Dòng của tab cũ (đọc thẳng từ tab, mỗi lần chạy). */
function contentOldRows_(sh) {
  var header = contentHeader_(sh), rows = [], n = sh.getLastRow();
  if (n > 1 && header.length) sh.getRange(2, 1, n - 1, header.length).getValues().forEach(function (line) {
    var o = {}; header.forEach(function (h, i) { o[h] = line[i]; }); if (String(o.key || '').trim()) rows.push(o);
  });
  return rows;
}
/**
 * Bước 2: còn việc chép dở (MIG_CONTENT_809 = PENDING:<tên tab>) thì chép, xong mới đánh dấu DONE. Lượt trước bị cắt sau khi
 * đổi tên tab thì lượt này vẫn chép. Trả { moved, keys, skipped, sheet } hoặc null nếu không có việc.
 */
function contentCarryPending_(ss) {
  var v = String(props_().getProperty(contentMigKey_(ss)) || '');
  if (v.indexOf('PENDING:') !== 0) return null;
  var name = v.substring(8), sh = ss.getSheetByName(name);
  if (!sh) { props_().setProperty(contentMigKey_(ss), 'DONE'); return { moved: 0, keys: [], skipped: [], sheet: name, missing: true }; }
  var rows = contentOldRows_(sh);
  var r = withLock_(function () { return contentCarryOld_({ rows: rows }); });
  props_().setProperty(contentMigKey_(ss), 'DONE');
  r.sheet = name;
  return r;
}
/**
 * Bước 2 (sau khi seedContent_ tạo đủ dòng mặc định): chép chữ admin đã sửa ở tab cũ sang cột vi hoặc en tương ứng.
 * Chữ đã sửa = value khác default_value. Key cũ: t.* là tiếng Anh; a.x_en vào cột en của a.x; re.MÃ vào cột en của r.MÃ.
 */
function contentCarryOld_(old) {
  var t = table_('CONTENT'), moved = 0, skipped = [], keys = [], kept = [];
  old.rows.forEach(function (o) {
    var key = String(o.key).trim(), v = o.value === undefined || o.value === null ? '' : String(o.value), dv = o.default_value === undefined || o.default_value === null ? '' : String(o.default_value);
    if (v === '' || v === dv) return;
    var target = key, lang = 'vi', mm;
    if (CONTENT_OLD_KEY_MAP_[key]) { target = CONTENT_OLD_KEY_MAP_[key][0]; lang = CONTENT_OLD_KEY_MAP_[key][1]; }
    else if ((mm = key.match(/^(a\..+)_en$/))) { target = mm[1]; lang = 'en'; }
    else if ((mm = key.match(/^re\.(.+)$/))) { target = 'r.' + mm[1]; lang = 'en'; }
    else if (/^t\./.test(key)) lang = 'en';
    var row = t.byId(target);
    if (!row) { skipped.push(key); return; }
    // Ô đích đã khác chữ gốc (admin đã sửa ngay trong tab mới, ví dụ sau một lượt menu 1 bị ngắt): giữ, không đè (soát 5H B3).
    var curV = String(row[lang] === undefined || row[lang] === null ? '' : row[lang]), defV = String(row['default_' + lang] || '');
    if (curV !== '' && curV !== defV) { kept.push(target + ' (' + lang + ')'); return; }
    // Ghi chú để admin xem lại: chữ có thể là chữ gốc cũ của bản trước chứ không phải chữ admin tự sửa (soát 5H S6).
    var patch = {}; patch[lang] = v; patch.note = String(row.note || '') ? row.note : 'Chép từ bản 8.0.8 (' + lang + '), xem lại';
    t.update(row, patch); moved++; keys.push(target + ' (' + lang + ')');
  });
  return { moved: moved, skipped: skipped, keys: keys, kept: kept };
}

// ── Ngôn ngữ của từng người dùng (chunk 5H): cột USERS.lang, 'vi' hoặc 'en'; trống = chưa chọn ──
var USER_LANG_MEMO_ = null;
function userLang_(u) { var l = String((u && u.lang) || '').trim().toLowerCase(); return LANGS_.indexOf(l) !== -1 ? l : ''; }
/** Ngôn ngữ đã chọn của người có email này ('' nếu chưa chọn hoặc không phải người dùng, ví dụ email admin trong CONFIG). */
function userLangByEmail_(email) {
  if (!USER_LANG_MEMO_) {
    USER_LANG_MEMO_ = {};
    try { table_('USERS').all().forEach(function (u) { var l = userLang_(u); if (l) USER_LANG_MEMO_[String(u.email || '').trim().toLowerCase()] = l; }); } catch (e) { }
  }
  return USER_LANG_MEMO_[String(email || '').trim().toLowerCase()] || '';
}

// ── Db.gs ──
/**
 * Db.gs · Đọc ghi Google Sheets theo tên cột (v8)
 *
 * Dùng:
 *   var t = table_('BOOKINGS');
 *   t.all()                    mọi dòng dạng object, kèm _row (số hàng trong Sheets)
 *   t.filter(fn), t.find(fn), t.byId('BK000001')
 *   t.insert({ ... })          ghi dòng mới cuối tab, trả object vừa ghi
 *   t.update(rowObj, { status: 'CONFIRMED' })   chỉ ghi các ô thay đổi
 *   nextId_('BOOKINGS')        khoá tự sinh tiếp theo
 *
 * Cache trong một lần chạy: mỗi tab chỉ đọc Sheets 1 lần, insert và update cập nhật luôn cache.
 * Mọi thao tác ghi quan trọng phải nằm trong withLock_() (Booking.gs và các file dịch vụ).
 *
 * Ghi dòng mới (chunk 5, sau lượt soát độc lập):
 *   Trong khoá: dòng mới gom lại, ghi một lần khi ra khỏi khoá (một setValues cho mỗi tab) để tutor lưu 200 slot
 *   không giữ khoá cả phút. Tab tự thêm hàng khi sắp đầy (tab mới của Google chỉ có 1.000 hàng).
 *   Ngoài khoá (ghi log khi kiểm tra phiên, ghi MAIL_LOG sau lỗi): tự lấy khoá ngắn rồi ghi, để hai lần chạy cùng lúc
 *   không ghi đè dòng của nhau.
 *   Chữ do người dùng nhập bắt đầu bằng = + - @ không bao giờ thành công thức (chống chèn công thức vào Sheets).
 */

var DB_CACHE_ = {};
var SS_CACHE_ = null;
var DB_LOCK_DEPTH_ = 0;
var DB_GROW_ROWS_ = 500;
var BUSY_MESSAGE_ = 'Hệ thống đang bận, vui lòng thử lại sau ít giây.';

/*
 * Chunk 5I: dùng lại file đã mở ngoài khoá (trước đây mở lại cả lúc vào lẫn lúc ra khoá: một lượt đặt lịch mở file 4 lần, mỗi
 * lần vài trăm mili giây). Vào khoá ngoài cùng vẫn mở lại (withLock_). Đổi DB (cài đặt, PRODUCTION) thì mở lại.
 */
var SS_CACHE_ID_ = '';
function dbSpreadsheet_() {
  var id = getDbId_();
  if (!SS_CACHE_ || SS_CACHE_ID_ !== id) { SS_CACHE_ = SpreadsheetApp.openById(id); SS_CACHE_ID_ = id; }
  return SS_CACHE_;
}
function clearDbCache_() { flushDb_(); DB_CACHE_ = {}; SS_CACHE_ = null; forgetEnvMemo_(); }

/** Ghi mọi dòng mới đang gom của các tab xuống Sheets. */
function flushDb_() {
  Object.keys(DB_CACHE_).forEach(function (k) { DB_CACHE_[k].flush_(); });
  if (DB_LOCK_DEPTH_) flushLogAppend_();   // dòng nhật ký gom (logAppend_) chỉ có trong khoá
}

/** Tab chưa đủ hàng thì thêm hàng (getRange vượt số hàng của tab sẽ báo lỗi trên Google thật), kèm dropdown cho hàng mới. */
function ensureRows_(sheet, tableName, lastNeeded) {
  var max = sheet.getMaxRows();
  if (lastNeeded <= max) return;
  var add = Math.max(DB_GROW_ROWS_, lastNeeded - max);
  sheet.insertRowsAfter(max, add);
  applyDropdowns_(sheet, tableName, max + 1, add);
  // Chunk 5N: luật tô màu có vùng cố định (hàng 2 tới hết tab lúc đặt): đặt lại để phủ cả hàng vừa thêm. Lỗi tô màu không được
  // làm hỏng lượt ghi dữ liệu (luật 39): chỉ ghi log.
  if (HIGHLIGHT_TABLES_.indexOf(tableName) !== -1) {
    try { applyHighlightsFor_(sheet.getParent(), tableName); } catch (e) { Logger.log('Tô màu lại ' + tableName + ' lỗi: ' + e.message); }
  }
}

/** Chữ bắt đầu bằng = + - @ ở cột không phải dạng chữ: thêm dấu nháy đơn để Sheets lưu nguyên văn, không chạy công thức. */
function safeCellText_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }

function table_(name) {
  if (DB_CACHE_[name]) return DB_CACHE_[name];
  var schema = SCHEMA[name];
  if (!schema) throw new Error('Tab không có trong SCHEMA: ' + name);
  var sh = dbSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Thiếu tab ' + name + ' trong file DB. Chạy menu thaiput > Cài đặt lần đầu.');
  var values = sh.getDataRange().getValues();
  var header = (values[0] || []).map(function (h) { return String(h).trim(); });
  var colIndex = {};
  var missing = [];
  schema.cols.forEach(function (c) {
    var i = header.indexOf(c);
    if (i === -1) {
      // Cột mới thêm ở bản cập nhật mà admin chưa chạy menu 1: cột "optional" đọc là trống, ghi thì bỏ qua (không làm sập đăng nhập).
      if (schema.optional && schema.optional.indexOf(c) !== -1) { missing.push(c); return; }
      throw new Error('Tab ' + name + ' thiếu cột "' + c + '". Chạy menu thaiput > 1. Cài đặt lần đầu / cập nhật cấu trúc.');
    }
    colIndex[c] = i;
  });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var line = values[r];
    var empty = true;
    // FALSE của ô tick (checkbox) chưa dùng không tính là dữ liệu.
    for (var k = 0; k < line.length; k++) { if (line[k] !== '' && line[k] !== null && line[k] !== false) { empty = false; break; } }
    if (empty) continue;
    var obj = { _row: r + 1 };
    schema.cols.forEach(function (c) { obj[c] = c in colIndex ? normalizeCell_(schema, c, line[colIndex[c]]) : ''; });
    rows.push(obj);
  }
  var t = new DbTable_(name, schema, sh, colIndex, rows, sh.getLastRow());
  DB_CACHE_[name] = t;
  // Dòng nhật ký đang chờ ghi thêm (logAppend_) mà trong cùng khoá lại cần đọc cả tab: chuyển vào bảng để đọc thấy ngay.
  if (LOG_APPEND_[name] && LOG_APPEND_[name].length) { var q = LOG_APPEND_[name]; LOG_APPEND_[name] = []; q.forEach(function (o) { t.insert(o); }); }
  return t;
}

/*
 * Chunk 5I (đo số lượt gọi Google): ghi một dòng ACTIVITY_LOG hay MAIL_LOG trước đây phải đọc CẢ tab (DbTable) trong khoá.
 * Hai tab này chỉ ghi thêm và lớn nhanh nhất (60 ngày nhật ký có thể vài chục nghìn dòng), nên mỗi lượt đặt, huỷ, đăng nhập
 * chậm dần theo thời gian. logAppend_ gom dòng trong khoá và ghi thêm ở cuối tab một lần (appendRowsRaw_: chỉ đọc hàng tiêu đề
 * và số hàng cuối). Ngoài khoá thì lấy một khoá ngắn như trước. Tab đã được đọc trong khoá này thì ghi qua bảng như cũ.
 */
var LOG_APPEND_ = {};
var LOG_APPEND_TABS_ = ['ACTIVITY_LOG', 'MAIL_LOG'];
function logAppend_(name, obj) {
  if (!DB_LOCK_DEPTH_) { withLock_(function () { logAppend_(name, obj); }); return; }
  if (DB_CACHE_[name]) { DB_CACHE_[name].insert(obj); return; }
  (LOG_APPEND_[name] || (LOG_APPEND_[name] = [])).push(obj);
}
function flushLogAppend_() {
  LOG_APPEND_TABS_.forEach(function (n) {
    var q = LOG_APPEND_[n];
    if (!q || !q.length) return;
    LOG_APPEND_[n] = [];
    appendRowsRaw_(n, q);
  });
}

function normalizeCell_(schema, col, v) {
  if (schema.dates && schema.dates.indexOf(col) !== -1) return asDate_(v);
  if (schema.text && schema.text.indexOf(col) !== -1) {
    if (col === 'slot') return asSlot_(v);
    return v === null || v === undefined ? '' : String(v);
  }
  return v;
}

function DbTable_(name, schema, sheet, colIndex, rows, lastRow) {
  this.name = name; this.schema = schema; this.sheet = sheet; this.colIndex = colIndex;
  this.rows = rows; this.lastRow = lastRow;
  this.pending = []; this.pendingByRow = {};
  var w = 0; Object.keys(colIndex).forEach(function (c) { w = Math.max(w, colIndex[c] + 1); });
  this.width = w;
}
DbTable_.prototype.isText_ = function (c) { return !!(this.schema.text && this.schema.text.indexOf(c) !== -1); };
DbTable_.prototype.isFormula_ = function (c) { return !!(this.schema.formulas && this.schema.formulas.indexOf(c) !== -1); };
DbTable_.prototype.all = function () { return this.rows.slice(); };
DbTable_.prototype.filter = function (fn) { return this.rows.filter(fn); };
DbTable_.prototype.find = function (fn) { for (var i = 0; i < this.rows.length; i++) if (fn(this.rows[i])) return this.rows[i]; return null; };
DbTable_.prototype.byId = function (id) {
  var key = this.schema.id;
  if (!key) throw new Error('Tab ' + this.name + ' không có cột khoá.');
  return this.find(function (r) { return String(r[key]) === String(id); });
};

/** Chuẩn bị giá trị ghi xuống ô: ngày ở cột ngày luôn là nửa đêm (luật CLAUDE.md số 2). */
DbTable_.prototype.cellValue_ = function (col, v) {
  if (v === undefined || v === null) return '';
  if (this.schema.dates && this.schema.dates.indexOf(col) !== -1 && v instanceof Date) return toMidnight_(v);
  return v;
};
/** Giá trị thật ghi xuống ô. Cột chữ có định dạng '@' nên Sheets không chạy công thức; cột công thức (contact_link) do code tự tạo. */
DbTable_.prototype.writeValue_ = function (col, v) {
  return !this.isText_(col) && !this.isFormula_(col) ? safeCellText_(v) : v;
};

DbTable_.prototype.insert = function (obj) {
  var self = this;
  var line = []; for (var i = 0; i < this.width; i++) line.push('');
  var stored = {};
  this.schema.cols.forEach(function (c) {
    var v = self.cellValue_(c, obj[c]);
    if (c in self.colIndex) line[self.colIndex[c]] = self.writeValue_(c, v);
    stored[c] = c in self.colIndex ? v : '';
  });
  // Ngoài khoá (log khi kiểm tra phiên, MAIL_LOG sau lỗi): lấy khoá ngắn để không ghi đè dòng của lần chạy khác.
  if (!DB_LOCK_DEPTH_) { var name = this.name; return withLock_(function () { return table_(name).insert(obj); }); }
  var row = this.lastRow + 1;
  var entry = { row: row, line: line, stored: stored };
  this.pending.push(entry); this.pendingByRow[row] = entry;
  this.lastRow = row;
  stored._row = row;
  this.schema.cols.forEach(function (c) { stored[c] = normalizeCell_(self.schema, c, stored[c]); });
  this.rows.push(stored);
  return stored;
};

/** Ghi các dòng đang gom: một lần thêm hàng nếu cần, một lần đặt định dạng chữ mỗi cột, một setValues. */
DbTable_.prototype.flush_ = function () {
  if (!this.pending.length) return;
  var self = this, list = this.pending, first = list[0].row, n = list.length;
  this.pending = []; this.pendingByRow = {};
  // Chống ghi đè (chunk 5F): ai đó gõ tay thêm dòng ở cuối tab trong lúc lượt này giữ khoá thì hàng định ghi không còn trống.
  // Dời cả lô xuống sau dòng cuối thật, sửa lại _row của các dòng vừa thêm.
  var realLast = this.sheet.getLastRow();
  if (realLast >= first) {
    var shift = realLast + 1 - first;
    list.forEach(function (e) { e.row += shift; if (e.stored) e.stored._row = e.row; });
    first += shift; this.lastRow = Math.max(this.lastRow + shift, first + n - 1);
  }
  ensureRows_(this.sheet, this.name, first + n - 1);
  (this.schema.text || []).forEach(function (c) { if (c in self.colIndex) self.sheet.getRange(first, self.colIndex[c] + 1, n, 1).setNumberFormat('@'); });
  // Ô tick chỉ đặt cho hàng có dữ liệu (đặt cả cột thì Sheets có thể ghi FALSE vào hàng trống, làm tab trông như đầy).
  (this.schema.checkbox || []).forEach(function (c) { if (c in self.colIndex) self.sheet.getRange(first, self.colIndex[c] + 1, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build()); });
  this.sheet.getRange(first, 1, n, this.width).setValues(list.map(function (e) { return e.line; }));
  if (this.name === 'CONFIG') { dropConfigCache_(); markSlotsDirty_(); }
  if (this.name === 'BOOKINGS' || this.name === 'AVAILABILITY') markSlotsDirty_();
  this._ids = null;   // vừa thêm dòng: lần kiểm sau đọc lại cột khoá
};

/**
 * Chống ghi nhầm dòng (chunk 5F, soát kiến trúc F8): admin sắp xếp (sort) tab hoặc xoá dòng tay đúng lúc một lượt ghi đang chạy
 * thì số hàng đọc lúc vào khoá không còn đúng. Trước mỗi lần ghi theo hàng, so khoá của dòng với cột khoá thật trên Sheets.
 * Cột khoá đọc MỘT lần cho cả lô (getValues) và dùng lại tối đa VERIFY_FRESH_MS_ (soát R1 L4: đọc từng ô xen kẽ với ghi làm
 * mất việc gom ghi của Google). Lệch thì ghi vào hàng thật theo khoá. Không thấy khoá thì dừng (thà báo lỗi còn hơn ghi nhầm).
 */
var VERIFY_FRESH_MS_ = 1500;
DbTable_.prototype.verifyRow_ = function (rowObj) {
  var key = this.schema.id;
  if (!key || !(key in this.colIndex)) return;
  var want = String(rowObj[key]), now = Date.now();
  if (!this._ids || now - this._idsAt > VERIFY_FRESH_MS_) {
    var col = this.colIndex[key] + 1, last = this.sheet.getLastRow();
    var vals = last >= 2 ? this.sheet.getRange(2, col, last - 1, 1).getValues() : [];
    this._ids = {}; this._idRows = {};
    for (var i = 0; i < vals.length; i++) { var id = String(vals[i][0]); this._ids[i + 2] = id; if (!(id in this._idRows)) this._idRows[id] = i + 2; }
    this._idsAt = now;
  }
  if (this._ids[rowObj._row] === want) return;
  var found = this._idRows[want];
  if (!found) throw new Error('Tab ' + this.name + ': không thấy dòng ' + want + ' (có thể vừa bị xoá tay). Không ghi gì thêm.');
  try { Logger.log('Tab ' + this.name + ': dòng ' + want + ' đã dời từ hàng ' + rowObj._row + ' sang ' + found + ' (có người sắp xếp tab).'); } catch (e) { }
  rowObj._row = found;
};

DbTable_.prototype.update = function (rowObj, patch) {
  var self = this;
  if (!rowObj || !rowObj._row) throw new Error('update cần dòng đã đọc từ ' + this.name);
  var pend = this.pendingByRow[rowObj._row];
  Object.keys(patch).forEach(function (c) {
    if (!(c in self.colIndex)) {
      if (self.schema.optional && self.schema.optional.indexOf(c) !== -1) return;
      throw new Error('Tab ' + self.name + ' không có cột ' + c);
    }
    var v = self.cellValue_(c, patch[c]);
    if (pend) pend.line[self.colIndex[c]] = self.writeValue_(c, v); // dòng chưa ghi xuống Sheets: sửa trong lô
    else {
      self.verifyRow_(rowObj);
      var range = self.sheet.getRange(rowObj._row, self.colIndex[c] + 1);
      if (self.isText_(c)) range.setNumberFormat('@');
      range.setValue(self.writeValue_(c, v));
    }
    rowObj[c] = normalizeCell_(self.schema, c, v);
  });
  if (this.name === 'CONFIG') { dropConfigCache_(); markSlotsDirty_(); }
  // Danh sách slot đệm (Booking.gs slotGrid_) hết hiệu lực khi lịch thay đổi; cột sổ sách Calendar, nhắc thì không ảnh hưởng slot.
  if ((this.name === 'BOOKINGS' || this.name === 'AVAILABILITY') && Object.keys(patch).some(function (c) { return SLOT_NEUTRAL_COLS_.indexOf(c) === -1; })) markSlotsDirty_();
  return rowObj;
};
var SLOT_NEUTRAL_COLS_ = ['event_id', 'meet_link', 'cal_state', 'cal_attempts', 'cal_next_at', 'reminder_sent_at', 'day_reminder_at', 'admin_action', 'admin_note', 'result_at', 'result_by', 'tech_fault', 'tech_decided_at', 'comp_days', 'comp_gap', 'result_notice_at', 'admin_done_at'];

/**
 * Bỏ các dòng mà keepFn trả false (keepFn nhận object của dòng, đọc MỚI từ Sheets ngay lúc bỏ). Phải gọi trong withLock_.
 * Chunk 5G (soát R1 H1, M1; R2 T1, T2; R3 N1, N2, N6, N7):
 *   1. Quyết định giữ hay bỏ theo NỘI DUNG đọc lại trong lúc bỏ, không theo số hàng của lần đọc trước: admin sắp xếp tab
 *      hay gõ thêm dòng tay đúng lúc đó cũng không làm bỏ nhầm dòng.
 *   2. Ghi các dòng giữ lại lên đầu tab TRƯỚC, rồi mới xoá phần đuôi thừa: bị cắt giữa hai bước thì tab chỉ thừa đuôi
 *      (trùng), không bao giờ trống. Trước khi ghi, mốc PURGE_OPEN_<tab> lưu số dòng giữ, hàng cuối cũ và DẤU VÂN TAY
 *      (băm nội dung gốc, phần giữ, phần đuôi). purgeRecover_ chỉ xoá đuôi khi nội dung khớp đúng dấu vân tay.
 *   3. Ô tick ở đuôi: gỡ ô tick rồi mới xoá, để hàng thật sự trống (tab không dài ra mãi).
 * Trả số dòng đã bỏ. opts.removed (mảng): nhận các object đã bỏ. opts.rowMap (object): hàng cũ → hàng mới của dòng giữ lại.
 */
function purgeRows_(name, keepFn, opts) {
  if (!DB_LOCK_DEPTH_) throw new Error('purgeRows_ phải chạy trong withLock_');
  flushDb_();
  purgeRecover_(name);
  var t = table_(name), sh = t.sheet, last = sh.getLastRow();
  if (last < 2) return 0;
  var width = sh.getLastColumn();
  var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  var rng = sh.getRange(2, 1, last - 1, width), raw = rng.getValues(), fx = rng.getFormulas();
  var schema = t.schema, colIdx = {}, plainCol = {}, knownCol = {};
  schema.cols.forEach(function (c) { colIdx[c] = header.indexOf(c); if (colIdx[c] !== -1) knownCol[colIdx[c]] = true; });
  schema.cols.forEach(function (c) { if (colIdx[c] !== -1 && (schema.text || []).indexOf(c) === -1 && (schema.formulas || []).indexOf(c) === -1) plainCol[colIdx[c]] = true; });
  var keepRows = [], keepVals = [], removed = 0, rowMap = {};
  for (var i = 0; i < raw.length; i++) {
    var line = raw[i], empty = true;
    for (var q = 0; q < line.length; q++) { if (line[q] !== '' && line[q] !== null && line[q] !== false) { empty = false; break; } }
    if (empty) continue;   // hàng trống giữa tab: bỏ luôn (gọn tab), không tính là dòng bị bỏ
    var obj = { _row: i + 2 };
    schema.cols.forEach(function (c) { obj[c] = colIdx[c] === -1 ? '' : normalizeCell_(schema, c, line[colIdx[c]]); });
    // getValues trả kết quả hiển thị của công thức (ví dụ HYPERLINK cột contact_link): ghi lại công thức gốc, không ghi chữ.
    var out = line.slice();
    for (var j = 0; j < out.length; j++) {
      if (fx[i] && fx[i][j]) out[j] = fx[i][j];
      // Soát 5I A1: Google trả chữ "=1+1" đã thêm dấu nháy KHÔNG kèm dấu nháy; ghi lại nguyên sẽ thành công thức (phá luật 26).
      // Vòng 2 N4: cột admin tự thêm (ngoài SCHEMA) cũng vậy.
      else if (plainCol[j] || !knownCol[j]) out[j] = safeCellText_(line[j]);
    }
    if (keepFn(obj)) { rowMap[i + 2] = keepRows.length + 2; keepRows.push(out); keepVals.push(line); }
    else { removed++; if (opts && opts.removed) opts.removed.push(obj); }
  }
  if (!removed) return 0;   // không bỏ dòng nào (hàng trống giữa tab để nguyên)
  if (name === 'BOOKINGS' || name === 'AVAILABILITY') markSlotsDirty_();
  if (opts && opts.rowMap) Object.keys(rowMap).forEach(function (k) { opts.rowMap[k] = rowMap[k]; });
  var props = props_(), key = 'PURGE_OPEN_' + name, k = keepRows.length;
  props.setProperty(key, JSON.stringify({ keep: k, last: last, width: width,
    all: purgeHash_(raw), kept: purgeHash_(keepVals), tail: purgeHash_(raw.slice(k)) }));
  if (k) sh.getRange(2, 1, k, width).setValues(keepRows);
  if (last > k + 1) purgeClearTail_(sh, schema, header, k + 2, last - k - 1, width);
  props.deleteProperty(key);
  // Nạp lại ngay vào chính đối tượng bảng đang được giữ, để lần insert hoặc update sau trong cùng khoá dùng đúng số hàng mới.
  // Soát 5I A10: dòng đang chờ ghi của chính tab này (ví dụ PURGE_RECOVERED của ACTIVITY_LOG vừa ghi ở trên) phải giữ lại,
  // ghi tiếp sau phần giữ lại, không bỏ.
  var carry = t.pending.map(function (e) { var o = {}; schema.cols.forEach(function (c) { o[c] = e.stored[c]; }); return o; });
  delete DB_CACHE_[name];
  var fresh = table_(name);
  t.rows = fresh.rows; t.lastRow = fresh.lastRow; t.pending = []; t.pendingByRow = {}; t._ids = null;
  DB_CACHE_[name] = t;
  carry.forEach(function (o) { t.insert(o); });
  return removed;
}

/** Băm nội dung các hàng (giá trị hiển thị; ngày giờ tới giây) làm dấu vân tay cho purgeRecover_. */
function purgeHash_(rows) {
  return sha256Hex_(JSON.stringify(rows.map(function (r) { return r.map(function (v) { return v instanceof Date ? 'D' + Math.round(v.getTime() / 1000) : v; }); })));
}
/** Xoá đuôi: gỡ ô tick ở các cột checkbox trước (ô tick bị xoá vẫn còn FALSE), rồi xoá nội dung. */
function purgeClearTail_(sh, schema, header, fromRow, n, width) {
  (schema.checkbox || []).forEach(function (c) { var ci = header.indexOf(c); if (ci !== -1) sh.getRange(fromRow, ci + 1, n, 1).setDataValidation(null); });
  sh.getRange(fromRow, 1, n, width).clearContent();
}

/**
 * Lần purgeRows_ trước bị cắt (mốc PURGE_OPEN_<tab> còn). Đọc lại tab, so dấu vân tay:
 *   phần giữ đã ghi xong, đuôi còn nguyên như lúc hỏng → xoá đúng đuôi (hàng keep+2 tới hàng cuối cũ);
 *   tab còn nguyên như trước khi ghi (lệnh ghi không chạy) → chỉ bỏ mốc;
 *   khác cả hai (admin đã sắp xếp, sửa tay sau khi hỏng) → KHÔNG xoá gì, báo Khẩn để admin kiểm dòng trùng.
 * Dòng thêm sau khi hỏng nằm sau hàng cuối cũ nên không bao giờ bị đụng. Phải gọi trong withLock_. Trả số hàng đã dọn.
 */
function purgeRecover_(name) {
  var props = props_(), key = 'PURGE_OPEN_' + name, rawMark = props.getProperty(key);
  if (!rawMark) return 0;
  var o = JSON.parse(rawMark), sh = dbSpreadsheet_().getSheetByName(name), n = o.last - o.keep - 1, outcome = 'none', cleared = 0;
  if (sh && o.last >= 2) {
    var width = o.width || sh.getLastColumn(), cur = sh.getRange(2, 1, o.last - 1, width).getValues();
    if (purgeHash_(cur) === o.all) outcome = 'not_written';
    else if (purgeHash_(cur.slice(0, o.keep)) === o.kept && purgeHash_(cur.slice(o.keep)) === o.tail) {
      if (n > 0) { var header = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); }); purgeClearTail_(sh, SCHEMA[name], header, o.keep + 2, n, width); cleared = n; }
      outcome = 'cleared';
    } else outcome = 'changed';
  }
  props.deleteProperty(key);
  delete DB_CACHE_[name];
  if (outcome === 'changed') {
    try { notify_('PURGE_CHECK', { entity: 'SHEET', entity_id: name, link: rowLink_(name),
      message: 'Tab ' + name + ': lần bỏ dòng (lưu trữ hoặc dọn) bị cắt giữa chừng và tab đã bị sửa tay sau đó, hệ thống không tự dọn. Kiểm dòng trùng ở cuối tab (từ hàng ' + (o.keep + 2) + ' tới ' + o.last + ') và xoá tay bản trùng.', message_en: 'Tab ' + name + ': a row removal (archive or cleanup) was cut midway and the tab was edited by hand afterwards, so the system will not clean up. Check duplicate rows at the end of the tab (rows ' + (o.keep + 2) + ' to ' + o.last + ') and delete the duplicates by hand.' }); } catch (e) { }
  }
  try { logActivity_('SYSTEM', 'PURGE_RECOVERED', 'SHEET', name, JSON.stringify({ outcome: outcome, cleared: cleared })); } catch (e) { }
  if (cleared && (name === 'BOOKINGS' || name === 'AVAILABILITY')) markSlotsDirty_();
  return cleared;
}

/**
 * Ghi cùng một giá trị vào cột col cho nhiều dòng bằng một lần setValues (thay vì mỗi dòng một lần ghi).
 * Phải gọi trong withLock_. Dòng không nằm trong rows giữ nguyên giá trị đang có.
 */
function setColumnForRows_(t, col, rows, value) {
  if (!DB_LOCK_DEPTH_) throw new Error('setColumnForRows_ phải chạy trong withLock_');
  flushDb_();
  var c = t.colIndex[col] + 1, last = t.sheet.getLastRow();
  if (last < 2 || !rows.length) return 0;
  var rng = t.sheet.getRange(2, c, last - 1, 1), vals = rng.getValues(), want = {};
  rows.forEach(function (r) { want[r._row] = true; });
  for (var i = 0; i < vals.length; i++) if (want[i + 2]) vals[i][0] = value;
  rng.setValues(vals);
  rows.forEach(function (r) { r[col] = value; });
  return rows.length;
}

/**
 * Thêm dòng vào cuối một tab KHÔNG đọc cả tab (chunk 5F, soát R2 T7): chỉ đọc hàng tiêu đề. Dùng cho tab chỉ ghi thêm,
 * không tra cứu trong code (METRICS). Phải gọi trong withLock_. Trả số dòng đã ghi.
 */
function appendRowsRaw_(name, objs) {
  if (!DB_LOCK_DEPTH_) throw new Error('appendRowsRaw_ phải chạy trong withLock_');
  if (!objs.length) return 0;
  var sh = dbSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Thiếu tab ' + name);
  var all = sh.getLastColumn(), header = sh.getRange(1, 1, 1, all).getValues()[0].map(function (h) { return String(h).trim(); });
  // Soát 5I A15: chỉ ghi tới cột cuối thuộc SCHEMA (như DbTable), không ghi ô trống đè cột admin tự thêm (ARRAYFORMULA).
  var width = 0; SCHEMA[name].cols.forEach(function (c) { width = Math.max(width, header.indexOf(c) + 1); });
  if (!width) throw new Error('Tab ' + name + ' thiếu cột. Chạy menu 1.');
  header = header.slice(0, width);
  var first = sh.getLastRow() + 1;
  ensureRows_(sh, name, first + objs.length - 1);
  var text = SCHEMA[name].text || [];
  // Cột chữ liền nhau đặt định dạng một lần (ACTIVITY_LOG: 1 lệnh cho 5 cột), không mỗi cột một lệnh.
  var tcols = header.map(function (h, i) { return text.indexOf(h) !== -1 ? i + 1 : 0; }).filter(Boolean);
  for (var a = 0; a < tcols.length;) { var b = a; while (b + 1 < tcols.length && tcols[b + 1] === tcols[b] + 1) b++; sh.getRange(first, tcols[a], objs.length, tcols[b] - tcols[a] + 1).setNumberFormat('@'); a = b + 1; }
  sh.getRange(first, 1, objs.length, width).setValues(objs.map(function (o) { return header.map(function (h) { var v = o[h]; return v === undefined || v === null ? '' : (text.indexOf(h) === -1 ? safeCellText_(v) : v); }); }));
  return objs.length;
}

var ID_FLOOR_MEMO_ = {};
function idFloor_(tableName) {
  if (!(tableName in ID_FLOOR_MEMO_)) { var v = 0; try { v = Number(props_().getProperty('ID_FLOOR_' + tableName) || 0); } catch (e) { } ID_FLOOR_MEMO_[tableName] = v; }
  return ID_FLOOR_MEMO_[tableName];
}

/** Khoá tiếp theo, ví dụ BK000124. Phải gọi trong withLock_ để hai người không lấy trùng. */
function nextId_(kind) {
  var fmt = ID_FORMAT[kind];
  if (!fmt) throw new Error('Không có định dạng khoá cho ' + kind);
  var tableName = kind.indexOf('USERS') === 0 ? 'USERS' : kind;
  var t = table_(tableName), key = t.schema.id, prefix = fmt[0], width = fmt[1], max = 0;
  var re = new RegExp('^' + prefix + '(\\d+)$');
  t.rows.forEach(function (r) { var m = String(r[key]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  max = Math.max(max, idFloor_(tableName));   // chunk 5G: không cấp lại số của dòng đã chuyển sang file lưu trữ
  var n = String(max + 1);
  while (n.length < width) n = '0' + n;
  return prefix + n;
}

/**
 * Chạy fn trong khoá toàn script (luật CLAUDE.md số 5). Luôn đọc lại dữ liệu mới sau khi lấy khoá.
 * Gọi lồng (đã giữ khoá) thì chạy luôn. Ra khỏi khoá: ghi các dòng đang gom, xoá cache để lần đọc sau không dùng số hàng cũ.
 *
 * Chunk 5F (giảm thời gian giữ khoá, soát kiến trúc F1 đến F3):
 *   afterLock_(fn): việc chậm (Calendar, email) đăng ký trong khoá, chạy NGAY SAU khi nhả khoá ngoài cùng, trước khi withLock_ trả về.
 *   deferWrite_(fn): ghi nhỏ phát sinh sau khi nhả khoá (mã sự kiện, MAIL_LOG, nhật ký) gom lại, ghi trong MỘT khoá ngắn cuối cùng.
 *   Lỗi trong hai loại việc này không làm hỏng kết quả đã ghi (booking đã ghi thì không bao giờ báo "hệ thống bận").
 */
/**
 * Phiên bản danh sách slot đệm (Booking.gs slotGrid_) tăng SAU khi dữ liệu đã tới Sheets (soát R1 L5): trong khoá chỉ đánh dấu,
 * withLock_ tăng phiên bản sau SpreadsheetApp.flush. Ngoài khoá tăng ngay.
 */
var SLOTS_DIRTY_ = false;
function markSlotsDirty_() { if (DB_LOCK_DEPTH_) SLOTS_DIRTY_ = true; else bumpSlotsVersion_(); }

var AFTER_LOCK_ = [];
var DEFER_WRITES_ = [];
var AFTER_LOCK_RUNNING_ = false;
var DEFER_ACTIVE_ = 0;

function afterLock_(fn) {
  if (DB_LOCK_DEPTH_) { AFTER_LOCK_.push(fn); return; }
  try { fn(); } catch (e) { afterLockError_(e); }
}
function deferWrite_(fn) {
  if (DB_LOCK_DEPTH_) return fn();
  DEFER_WRITES_.push(fn);
}
/** true khi đang ở pha sau khoá hoặc trong một lượt gọi API: ghi nhỏ ngoài khoá được gom thay vì lấy khoá riêng. */
function deferActive_() { return AFTER_LOCK_RUNNING_ || DEFER_ACTIVE_ > 0; }
function afterLockError_(e) {
  try { Logger.log('Việc sau khoá lỗi: ' + ((e && e.stack) || e)); } catch (x) { }
  try { metricAdd_('_after_lock_error', 0, { error: true }); } catch (x2) { }
}

/** Chạy các việc sau khoá, rồi ghi các thay đổi đã gom trong một khoá ngắn. Không ném lỗi. */
function runAfterLock_() {
  if (AFTER_LOCK_RUNNING_) return;
  AFTER_LOCK_RUNNING_ = true;
  try {
    for (var guard = 0; AFTER_LOCK_.length && guard < 5; guard++) {
      var list = AFTER_LOCK_; AFTER_LOCK_ = [];
      list.forEach(function (fn) { try { fn(); } catch (e) { afterLockError_(e); } });
    }
  } finally { AFTER_LOCK_RUNNING_ = false; }
  flushDeferred_();
}

/** Ghi mọi thay đổi đã gom (deferWrite_) trong một khoá. Khoá bận quá 10 giây thì bỏ, ghi vào số đo (hàng đợi tự làm lại). */
function flushDeferred_() {
  if (!DEFER_WRITES_.length || DB_LOCK_DEPTH_) return;
  var list = DEFER_WRITES_; DEFER_WRITES_ = [];
  try {
    withLock_(function () { list.forEach(function (fn) { try { fn(); } catch (e) { afterLockError_(e); } }); }, 10000);
  } catch (e) {
    try { Logger.log('Không ghi được ' + list.length + ' thay đổi sau khoá: ' + e.message); } catch (x) { }
    try { metricAdd_('_deferred_dropped', 0, { error: true }); } catch (x2) { }
  }
}

function withLock_(fn, waitMs) {
  if (DB_LOCK_DEPTH_) return fn();
  var lock = LockService.getScriptLock(), t0 = Date.now();
  if (!lock.tryLock(waitMs || 30000)) { try { metricAdd_('_lock_busy', Date.now() - t0, { busy: true }); } catch (x) { } throw new Error(BUSY_MESSAGE_); }
  var t1 = Date.now();
  DB_LOCK_DEPTH_ = 1;
  var out;
  try {
    // Soát 5I A5: mở lại file mỗi lần vào khoá ngoài cùng. Google không ghi rõ đối tượng Spreadsheet đã mở có giữ bộ đệm đọc
    // giữa hai khoá hay không; dữ liệu quyết định ghi (slot, gói) luôn đọc bằng đối tượng mở trong khoá. Ngoài khoá thì dùng lại.
    DB_CACHE_ = {}; SS_CACHE_ = null;
    out = fn();
    flushDb_();
    SpreadsheetApp.flush();
  } finally {
    try { flushDb_(); } catch (fe) { Logger.log('Ghi dòng còn lại khi thoát khoá lỗi: ' + fe.message); } finally {
      if (SLOTS_DIRTY_) { SLOTS_DIRTY_ = false; try { SpreadsheetApp.flush(); } catch (x) { } bumpSlotsVersion_(); }
      DB_LOCK_DEPTH_ = 0;
      DB_CACHE_ = {};
      lock.releaseLock();
      try { metricAdd_('_lock_wait', t1 - t0, {}); metricAdd_('_lock_hold', Date.now() - t1, {}); } catch (x) { }
    }
    // Ngoài khoá: Calendar, email đã đăng ký trong khoá, rồi ghi gom. Chạy cả khi fn ném lỗi, vì dòng đã ghi (flushDb_ ở trên).
    if (AFTER_LOCK_.length || DEFER_WRITES_.length) runAfterLock_();
  }
  return out;
}

// ── EmailTemplates.gs ──
/**
 * EmailTemplates.gs · Mẫu email song ngữ chỉnh trên tab EMAIL_TEMPLATES (chunk 5C)
 *
 * Mỗi email: nửa trên tiếng Việt, nửa dưới tiếng Anh, cùng khung emailWrap_ (thiết kế 5O đen trắng, gạch vàng thương hiệu).
 * Tiêu đề: tiếng Việt trước rồi tiếng Anh; email cho tutor để tiếng Anh trước (dễ đọc trong hộp thư của tutor).
 * Ô trống trong tab = dùng mẫu gốc dưới đây. Ô chỉ có dấu - = cố ý để trống (ví dụ bỏ tiêu đề tiếng Anh).
 * Cột active = FALSE thì không gửi mẫu đó.
 * Cú pháp: xem đầu file Content.gs.
 */

// key: [audience, subject_vi, title_vi, body_vi, subject_en, title_en, body_en, variables]
var DEFAULT_EMAIL_TEMPLATES_ = {
  LOGIN_LINK: ['ALL', 'Link đăng nhập thaiput', 'Đăng nhập thaiput',
    'Chào {{name}},\n\n{{button:login_url|Đăng nhập}}\n\n{{link_note}} Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    'Your thaiput login link', 'Log in to thaiput',
    'Hi {{name}},\n\n{{button:login_url|Log in}}\n\n{{link_note}} If you did not request it, ignore this email.',
    'name, login_url, link_note'],
  REG_RECEIVED: ['STUDENT', 'Đã nhận đăng ký {{package}}', 'Đã nhận đăng ký của bạn',
    'Chào {{name}},\n\nthaiput đã nhận đăng ký gói **{{package}}** cùng ảnh chuyển khoản. Admin sẽ xác nhận trong giờ làm việc và gửi link đăng nhập qua email này.\n\nNội dung chuyển khoản của bạn: **{{transfer_code}}**',
    'Registration received: {{package}}', 'We received your registration',
    'Hi {{name}},\n\nthaiput received your registration for **{{package}}** with the payment screenshot. Admin will confirm during working hours and send your login link to this email.\n\nYour transfer reference: **{{transfer_code}}**',
    'name, package, transfer_code'],
  WELCOME: ['STUDENT', 'Chào mừng bạn đến với thaiput', 'Tài khoản của bạn đã sẵn sàng',
    'Chào {{name}},\n\nGói **{{package}}** đã được kích hoạt. Gói bắt đầu tính từ ngày bạn học buổi đầu tiên.\n\nLưu ý: {{rule}}\n\n{{button:login_url|Đăng nhập và đặt lịch}}\n\n{{link_note}} Hết hạn thì mở trang web và yêu cầu gửi lại liên kết đăng nhập mới bằng email này.',
    'Welcome to thaiput', 'Your account is ready',
    'Hi {{name}},\n\nYour **{{package}}** package is active. It starts counting from your first lesson.\n\nNote: {{rule}}\n\n{{button:login_url|Log in and book}}\n\n{{link_note}} When it expires, open the website and request a new login link with this email.',
    'name, package, rule, login_url, link_note'],
  REG_REJECTED: ['STUDENT', 'Đăng ký chưa được xác nhận', 'Đăng ký chưa được xác nhận',
    'Chào {{name}},\n\nAdmin chưa xác nhận được khoản chuyển của bạn{{note}}.\n\nVui lòng nhắn Zalo admin để được hỗ trợ.',
    'Registration not confirmed', 'Registration not confirmed',
    'Hi {{name}},\n\nAdmin could not confirm your payment{{note}}.\n\nPlease message admin on Zalo for help.',
    'name, note'],
  BOOKING_CONFIRM: ['STUDENT', 'Xác nhận {{count}} buổi học', 'Đặt lịch thành công',
    'Chào {{name}},\n\nCác buổi đã được xác nhận:\n\n{{lessons_html}}\n\nBạn cũng nhận được thư mời Google Calendar cho từng buổi. Vào phòng đúng giờ bằng chính email này.\n\n{{failed_html}}\n\n{{cancel_rule}}\n\n{{button:portal_url|Xem lịch của tôi}}',
    '{{count}} lesson(s) confirmed', 'Booking confirmed',
    'Hi {{name}},\n\nConfirmed lessons:\n\n{{lessons_html}}\n\nYou also get a Google Calendar invitation for each lesson. Join on time with this email.\n\n{{failed_html}}\n\n{{cancel_rule}}\n\n{{button:portal_url|My lessons}}',
    'name, count, lessons_html, failed_html, cancel_rule, portal_url'],
  BOOKING_NONE: ['STUDENT', 'Chưa đặt được buổi học', 'Chưa đặt được buổi học',
    'Chào {{name}},\n\n{{failed_html}}\n\n{{button:portal_url|Chọn giờ khác}}',
    'Booking not completed', 'Booking not completed',
    'Hi {{name}},\n\n{{failed_html}}\n\n{{button:portal_url|Choose another time}}',
    'name, failed_html, portal_url'],
  TUTOR_NEW: ['TUTOR', 'Buổi học mới được giao', 'Buổi học mới của bạn',
    'Chào {{name}},\n\n{{lessons_html}}\n\n{{button:portal_url|Xem lịch dạy}}',
    'New lesson{{s}} assigned', 'New lessons assigned to you',
    'Hi {{name}},\n\n{{lessons_html}}\n\n{{button:portal_url|Open my schedule}}',
    'name, count, s, lessons_html, portal_url'],
  CANCEL_STUDENT: ['STUDENT', 'Huỷ buổi {{date}} {{slot}}', 'Buổi học đã huỷ',
    'Chào {{name}},\n\n{{lesson_html}}\n\nLý do: {{reason}}.\n\n{{rebook_html}}',
    'Lesson cancelled · {{date}} {{slot}}', 'Lesson cancelled',
    'Hi {{name}},\n\n{{lesson_html}}\n\nReason: {{reason}}.\n\n{{rebook_html}}',
    'name, date, slot, lesson_html, reason, rebook_html'],
  CANCEL_TUTOR: ['TUTOR', 'Buổi học đã huỷ · {{date}} {{slot}}', 'Buổi học đã huỷ',
    'Chào {{name}},\n\n{{lesson_html}}\n\nBuổi này đã huỷ. Slot vẫn mở cho học viên khác.',
    'Lesson cancelled · {{date}} {{slot}}', 'Lesson cancelled',
    'Hi {{name}},\n\n{{lesson_html}}\n\nThis lesson has been cancelled. The slot stays open for other students.',
    'name, date, slot, lesson_html'],
  REASSIGN_STUDENT: ['STUDENT', 'Đổi tutor buổi {{date}} {{slot}}', 'Buổi học được đổi tutor',
    'Chào {{name}},\n\n{{lesson_html}}\n\nGiờ học và link phòng giữ nguyên.',
    'Tutor changed · {{date}} {{slot}}', 'Your lesson has a new tutor',
    'Hi {{name}},\n\n{{lesson_html}}\n\nThe time and the meeting link stay the same.',
    'name, date, slot, lesson_html, new_tutor'],
  REASSIGN_OLD: ['TUTOR', 'Đã duyệt huỷ · {{date}} {{slot}}', 'Yêu cầu huỷ đã được duyệt',
    'Chào {{name}},\n\n{{lesson_html}}\n\nTutor khác sẽ dạy buổi này.',
    'Cancellation approved · {{date}} {{slot}}', 'Your cancellation was approved',
    'Hi {{name}},\n\n{{lesson_html}}\n\nAnother tutor will teach this lesson.',
    'name, date, slot, lesson_html'],
  TUTOR_DECISION_APPROVED: ['TUTOR', 'Đã duyệt · {{date}} {{slot}}', 'Yêu cầu huỷ đã được duyệt',
    'Chào {{name}},\n\nYêu cầu huỷ **{{lesson}}** đã được **duyệt**.',
    'Approved · {{date}} {{slot}}', 'Cancellation approved',
    'Hi {{name}},\n\nYour request to cancel **{{lesson}}** was **approved**.',
    'name, date, slot, lesson'],
  TUTOR_DECISION_REJECTED: ['TUTOR', 'Không duyệt · {{date}} {{slot}}', 'Bạn vẫn dạy slot này',
    'Chào {{name}},\n\nYêu cầu huỷ **{{lesson}}** **không được duyệt**. Vui lòng dạy buổi này như lịch.',
    'Not approved · {{date}} {{slot}}', 'You still teach this slot',
    'Hi {{name}},\n\nYour request to cancel **{{lesson}}** was **not approved**. Please teach this lesson as scheduled.',
    'name, date, slot, lesson'],
  REMINDER_STUDENT: ['STUDENT', 'Nhắc: buổi học lúc {{slot}} hôm nay', 'Buổi học bắt đầu sau khoảng 1 giờ',
    'Chào {{name}},\n\n{{lesson_html}}\n\n{{button:meet_url|Vào phòng học}}\n\nVào bằng chính email đã đăng ký để không phải chờ duyệt.',
    'Reminder: lesson at {{slot}} today', 'Your lesson starts in about 1 hour',
    'Hi {{name}},\n\n{{lesson_html}}\n\n{{button:meet_url|Join the lesson}}\n\nJoin with the email you registered so you do not have to wait for approval.',
    'name, slot, lesson_html, meet_url'],
  REMINDER_TUTOR: ['TUTOR', 'Nhắc: buổi dạy lúc {{slot}}', 'Buổi dạy bắt đầu sau khoảng 1 giờ',
    'Chào {{name}},\n\n{{lesson_html}}',
    'Reminder: lesson at {{slot}}', 'Your lesson starts in about 1 hour',
    'Hi {{name}},\n\n{{lesson_html}}',
    'name, slot, lesson_html'],
  MORNING_STUDENT: ['STUDENT', 'Hôm nay bạn có {{count}} buổi học', 'Buổi học hôm nay',
    'Chào {{name}},\n\n{{lessons_html}}',
    'You have {{count}} lesson{{s}} today', 'Your lessons today',
    'Hi {{name}},\n\n{{lessons_html}}',
    'name, count, s, lessons_html'],
  MORNING_TUTOR: ['TUTOR', 'Hôm nay: {{count}} buổi dạy', 'Lịch dạy hôm nay',
    'Chào {{name}},\n\n{{lessons_html}}',
    'Today: {{count}} lesson{{s}}', 'Your lessons today',
    'Hi {{name}},\n\n{{lessons_html}}',
    'name, count, s, lessons_html'],
  EXPIRY_SOON: ['STUDENT', 'Gói học sắp hết hạn {{end_date}}', 'Gói học sắp hết hạn',
    'Chào {{name}},\n\nGói **{{package}}** của bạn hết hạn ngày **{{end_date}}**.\n\n{{button:renew_url|Gia hạn gói học}}',
    'Your package ends on {{end_date}}', 'Your package is ending soon',
    'Hi {{name}},\n\nYour **{{package}}** package ends on **{{end_date}}**.\n\n{{button:renew_url|Renew my package}}',
    'name, package, end_date, renew_url'],
  // Chunk 5M: bù ngày khi buổi không diễn ra vì lỗi phía trường; hạn gói đổi (admin sửa, rút bù).
  COMP_EXTENDED: ['STUDENT', 'Gói học được cộng {{days}} ngày', 'Gói học được cộng thêm ngày',
    'Chào {{name}},\n\nBuổi học **{{lesson_date}} {{lesson_slot}}** không diễn ra vì {{reason}}. Gói **{{package}}** được cộng **{{days}} ngày**, hạn mới: **{{end_date}}**.\n\n{{button:portal_url|Đặt buổi tiếp theo}}',
    '{{days}} extra days added to your package', 'Extra days added to your package',
    'Hi {{name}},\n\nYour lesson on **{{lesson_date}} {{lesson_slot}}** did not take place because {{reason}}. Your **{{package}}** now has **{{days}} extra days**, new end date: **{{end_date}}**.\n\n{{button:portal_url|Book your next lesson}}',
    'name, lesson_date, lesson_slot, reason, package, days, end_date, portal_url'],
  PACKAGE_DATES_CHANGED: ['STUDENT', 'Hạn gói {{package}} đã điều chỉnh', 'Hạn gói học đã điều chỉnh',
    'Chào {{name}},\n\nHạn gói **{{package}}** đã được điều chỉnh: **{{old_end}}** thành **{{end_date}}**.\n\n{{button:portal_url|Xem gói học}}',
    'Your {{package}} end date changed', 'Your package end date changed',
    'Hi {{name}},\n\nThe end date of your **{{package}}** changed from **{{old_end}}** to **{{end_date}}**.\n\n{{button:portal_url|View my package}}',
    'name, package, old_end, end_date, portal_url'],
  TUTOR_REMIND: ['TUTOR', 'Vui lòng mở lịch tuần {{week}}', 'Mở lịch rảnh tuần sau',
    'Chào {{name}},\n\nBạn chưa mở slot nào cho tuần bắt đầu **{{week}}**. Hạn mở lịch: **{{deadline}}**. Sau hạn vẫn thêm giờ được; bớt giờ thì phải chờ admin duyệt.\n\n{{button:portal_url|Mở lịch rảnh}}',
    'Please submit your availability for the week of {{week}}', 'Submit next week\'s availability',
    'Hi {{name}},\n\nYou have not opened any slot for the week starting **{{week}}**. Deadline: **{{deadline}}**. After the deadline you can still add slots; removing a slot needs admin approval.\n\n{{button:portal_url|Open availability}}',
    'name, week, deadline, portal_url'],
  STAFF_NEW_LOGIN: ['ALL', 'Có đăng nhập mới vào tài khoản thaiput của bạn', 'Có đăng nhập mới',
    'Chào {{name}},\n\nTài khoản của bạn vừa đăng nhập lúc **{{time}}** trên **{{device}}** (bằng {{via}}).\n\nNếu đó là bạn hoặc người cùng quản trị, không cần làm gì. Nếu không phải: hộp thư admin có thể đã bị lộ. Đổi mật khẩu tài khoản Google ngay, kiểm tra xác minh 2 bước, rồi trong Sheets đặt status DISABLED cho dòng admin này ở tab USERS (mọi phiên bị thoát ngay), xong đặt lại ACTIVE.\n\n{{button:portal_url|Mở trang}}',
    'New sign in to your thaiput account', 'New sign in',
    'Hi {{name}},\n\nYour account just signed in at **{{time}}** on **{{device}}** (via {{via}}).\n\nIf this was you (or your co-admin), no action is needed. If not: change your Google account password now and check 2-step verification; tutors: message admin on Zalo right away so admin can sign your account out everywhere.\n\n{{button:portal_url|Open portal}}',
    'name, time, device, via, portal_url'],
  ADMIN_NEW_REG: ['ADMIN', '[Đăng ký mới] {{name}} · {{package}}', 'Có đăng ký mới cần duyệt',
    'Loại: {{kind}}\nHọ tên: **{{name}}**\nEmail: {{email}}\nĐiện thoại: {{phone}}\nGói: {{package}} · {{price}}\nMã chuyển khoản: {{transfer_code}}\nẢnh chuyển khoản: {{screenshot_url}}\n\nDuyệt tại tab REGISTRATIONS: chọn "Duyệt" ở cột admin_action.\n\n{{button:sheet_link|Mở đúng dòng trong Sheets}}',
    '[New registration] {{name}} · {{package}}', 'New registration to approve',
    'Type: {{kind}}\nName: **{{name}}**\nEmail: {{email}}\nPhone: {{phone}}\nPackage: {{package}} · {{price}}\nTransfer reference: {{transfer_code}}\nPayment screenshot: {{screenshot_url}}\n\nApprove in the REGISTRATIONS tab: choose "Duyệt" in the admin_action column.\n\n{{button:sheet_link|Open the row in Sheets}}',
    'kind, name, email, phone, package, price, transfer_code, screenshot_url, sheet_link'],
  ADMIN_TUTOR_CANCEL: ['ADMIN', '[Duyệt] {{tutor}} xin huỷ {{lesson}}', 'Tutor xin huỷ slot',
    'Tutor **{{tutor}}** xin huỷ slot **{{lesson}}**.\n\n{{booked_note}}\n\nDuyệt tại tab AVAILABILITY, cột admin_decision. Lựa chọn: {{options}}. Phải quyết định trước giờ học {{hours}} giờ, quá hạn hệ thống tự từ chối.\n\n{{button:sheet_link|Mở đúng dòng trong Sheets}}',
    '[Approve] {{tutor}} asks to cancel {{lesson}}', 'Tutor asks to cancel a slot',
    'Tutor **{{tutor}}** asks to cancel **{{lesson}}**.\n\n{{booked_note}}\n\nDecide in the AVAILABILITY tab, admin_decision column, at least {{hours}} hours before the lesson; otherwise the system rejects it automatically.\n\n{{button:sheet_link|Open the row in Sheets}}',
    'tutor, lesson, booked_note, options, hours, sheet_link'],
  ADMIN_NOTICE: ['ADMIN', '[{{tag}}] {{message}}', '{{tag}}',
    '{{message}}\n\n{{button:sheet_link|Mở trong Sheets}}\n\nSự kiện {{event}} · {{time}}',
    '[{{tag}}] {{message}}', '{{tag}}',
    '{{message}}\n\n{{button:sheet_link|Open in Sheets}}\n\nEvent {{event}} · {{time}}',
    'tag, message, event, time, sheet_link'],
  ADMIN_DIGEST: ['ADMIN', '[Tổng hợp {{date}}] {{count}} thông báo', 'Tổng hợp trong ngày',
    '{{summary_html}}\n\n{{table_html}}\n\n{{button:sheet_link|Mở tab NOTIFICATIONS}}',
    '[Daily summary {{date}}] {{count}} notifications', 'Daily summary',
    '{{count}} notifications today. Full list above and in the NOTIFICATIONS tab.',
    'date, count, summary_html, table_html, sheet_link'],
  // Chunk 5I: menu "Kiểm tra gửi email": thư nhỏ có mã để tìm trong hộp thư và trong Email Log Search của admin.google.com.
  MAIL_TEST: ['ALL', 'Kiểm tra gửi email thaiput {{code}}', 'Email kiểm tra',
    'Đây là email kiểm tra admin gửi từ menu thaiput lúc **{{time}}**.\n\nMã kiểm tra: **{{code}}**. Thấy email này nghĩa là đường gửi từ {{sender}} tới hộp thư này đang hoạt động. Không cần trả lời.',
    'thaiput email test {{code}}', 'Test email',
    'This is a test email sent by admin from the thaiput menu at **{{time}}**.\n\nTest code: **{{code}}**. If you can read this, mail from {{sender}} reaches this inbox. No reply needed.',
    'code, time, sender'],
  ADMIN_ERROR: ['ADMIN', '[Lỗi hệ thống] {{subject}}', 'Lỗi cần kiểm tra',
    '{{detail_html}}', '[System error] {{subject}}', 'Error to check',
    'Technical details are above. Copy them to Claude to fix.', 'subject, detail_html']
};
// Chunk 5H: chân của mọi email marketing (tab MARKETING_EMAILS). Không gửi riêng; tắt (active FALSE) hoặc để trống thì dùng chữ gốc (luôn có câu từ chối nhận).
DEFAULT_EMAIL_TEMPLATES_.MARKETING_FOOTER = ['MARKETING', 'Chân email marketing', '',
  'Bạn nhận email này vì đã đăng ký học tại thaiput. Không muốn nhận email giới thiệu, ưu đãi nữa? Nhắn Zalo admin, thaiput sẽ ngừng gửi.',
  'Marketing email footer', '',
  'You get this email because you signed up with thaiput. Do not want offers and news anymore? Message admin on Zalo and we will stop.',
  ''];
/*
 * Chunk 5I: mẫu gốc đã đổi mà tab EMAIL_TEMPLATES còn đúng chữ gốc cũ (admin chưa sửa): menu 1 thay bằng chữ gốc mới.
 * Ô admin đã sửa (khác chữ gốc cũ) giữ nguyên. key → { cột: chữ gốc cũ }.
 */
var TEMPLATE_UPGRADES_ = {
  ADMIN_NOTICE: { subject_en: '[{{tag}}] {{event}}', body_en: 'Event {{event}} at {{time}}. Details are in Vietnamese above and in the NOTIFICATIONS tab.' },
  // Chunk 5J: nhắc thứ Sáu nên không còn "hôm nay".
  TUTOR_REMIND: { body_vi: 'Chào {{name}},\n\nBạn chưa mở slot nào cho tuần bắt đầu **{{week}}**. Hạn: **hôm nay {{deadline}}**.\n\n{{button:portal_url|Mở lịch rảnh}}',
    body_en: 'Hi {{name}},\n\nYou have not opened any slot for the week starting **{{week}}**. Deadline: **today {{deadline}}**.\n\n{{button:portal_url|Open availability}}' }
};
var TEMPLATE_COLS_ = ['audience', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'variables'];

/** Mẫu đang dùng: dòng trong EMAIL_TEMPLATES ghi đè từng ô của mẫu gốc (ô trống thì dùng gốc). */
function emailTemplate_(key) {
  if (!TEMPLATE_CACHE_) {
    TEMPLATE_CACHE_ = {};
    try { table_('EMAIL_TEMPLATES').all().forEach(function (r) { TEMPLATE_CACHE_[String(r.key).trim()] = r; }); } catch (e) { }
  }
  var d = DEFAULT_EMAIL_TEMPLATES_[key], row = TEMPLATE_CACHE_[key] || {}, t = { key: key, active: true };
  if (!d && !TEMPLATE_CACHE_[key]) return null;
  TEMPLATE_COLS_.forEach(function (c, i) {
    var v = row[c] === undefined || row[c] === null ? '' : String(row[c]);
    // Soát 5J: ô còn đúng chữ gốc cũ (TEMPLATE_UPGRADES_) thì dùng chữ gốc mới ngay, không chờ menu 1 (luật 38).
    if (v !== '' && d && TEMPLATE_UPGRADES_[key] && TEMPLATE_UPGRADES_[key][c] === v) v = '';
    t[c] = v.trim() === '-' ? '' : (v !== '' ? v : (d ? d[i] : ''));   // ô trống = mẫu gốc; dấu - = cố ý để trống
  });
  if (row.active !== undefined && row.active !== '' && (row.active === false || String(row.active).toUpperCase() === 'FALSE')) t.active = false;
  return t;
}

/** Thay {{bien}} trong một dòng chữ thường (tiêu đề): không thoát HTML, biến _html bị bỏ. */
function renderPlain_(text, vars, lang) {
  return String(text || '').replace(/\{\{\s*([\w:|. ]+?)\s*\}\}/g, function (m, k) {
    if (/^button:/.test(k) || /_html$/.test(k)) return '';
    var v = tplVar_(vars, k, lang);
    return v === undefined ? '' : String(v);
  });
}
function tplVar_(vars, k, lang) {
  if (vars[k + '_' + lang] !== undefined) return vars[k + '_' + lang];
  return vars[k];
}
/** Chữ thường thành HTML an toàn: thoát ký tự, **đậm**. */
function inlineHtml_(s) { return esc_(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }

/**
 * Thân email: đoạn cách nhau dòng trống, dòng trong đoạn nối bằng <br>.
 * {{bien}} chữ thường được thoát; {{bien_html}} là khối HTML code dựng sẵn (danh sách buổi học); {{button:bien|Chữ}} là nút.
 * Đoạn rỗng sau khi thay biến (ví dụ không có buổi lỗi) bị bỏ.
 */
function renderBody_(text, vars, lang) {
  return String(text || '').split(/\n\s*\n/).map(function (para) {
    var blocks = [], html = '';
    var parts = para.split(/(\{\{[^}]+\}\})/);
    parts.forEach(function (p) {
      var m = p.match(/^\{\{\s*(.+?)\s*\}\}$/);
      if (!m) { html += inlineHtml_(p).replace(/\n/g, '<br>'); return; }
      var k = m[1];
      if (/^button:/.test(k)) {
        var bm = k.substring(7).split('|'), url = tplVar_(vars, bm[0].trim(), lang);
        if (url) blocks.push(btn_(String(url), (bm[1] || 'Mở').trim()));
        return;
      }
      var v = tplVar_(vars, k, lang);
      if (v === undefined || v === null) return;
      if (/_html$/.test(k)) { if (String(v)) blocks.push(String(v)); return; }
      html += esc_(String(v));
    });
    var out = (html.replace(/<br>/g, '').trim() ? '<p style="margin:0 0 12px">' + html + '</p>' : '') + blocks.join('');
    return out;
  }).join('');
}

/** Khung email song ngữ (khung 5O trong emailWrap_). Mặc định tiếng Việt trên, tiếng Anh dưới; enFirst (email cho tutor) thì đảo lại. */
function emailWrapBi_(titleVi, htmlVi, titleEn, htmlEn, enFirst) {
  var first = enFirst && htmlEn ? [titleEn, htmlEn, titleVi, htmlVi, 'Tiếng Việt'] : [titleVi, htmlVi, titleEn, htmlEn, 'English'];
  var second = first[3] ? '<div style="margin-top:22px;padding-top:18px;border-top:1px dashed #d6d6d1">' +
    '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#63635d;margin-bottom:8px">' + first[4] + '</div>' +
    '<h2 style="margin:0 0 14px;font-size:19px;color:#141414">' + esc_(first[2]) + '</h2>' + first[3] + '</div>' : '';
  return emailWrap_(first[0], first[1] + second, 'bi');
}

/**
 * Gửi email theo mẫu. opts: { enFirst (tiếng Anh trước khi người nhận chưa chọn ngôn ngữ, cho tutor), kind, priority }.
 * Trả false nếu mẫu bị tắt (active FALSE), không có mẫu, hoặc gửi không được.
 */
function sendTpl_(key, to, vars, opts) {
  opts = opts || {};
  var t = emailTemplate_(key);
  if (!t) throw new Error('Không có mẫu email ' + key);
  if (!t.active) { logActivity_('SYSTEM', 'MAIL_TEMPLATE_OFF', 'MAIL', key, to); return false; }
  vars = vars || {};
  // Chunk 5H: người nhận đã chọn ngôn ngữ (USERS.lang) thì thứ tiếng đó ở trên; chưa chọn thì theo mặc định của nơi gọi
  // (tutor tiếng Anh trước, còn lại tiếng Việt trước). Email vẫn luôn có cả hai thứ tiếng.
  var pref = userLangByEmail_(to), enFirst = pref ? pref === 'en' : !!opts.enFirst;
  var sVi = renderPlain_(t.subject_vi, vars, 'vi').trim(), sEn = renderPlain_(t.subject_en, vars, 'en').trim();
  var subject = sVi && sEn ? (enFirst ? sEn + ' | ' + sVi : sVi + ' | ' + sEn) : (sVi || sEn);
  var html = emailWrapBi_(renderPlain_(t.title_vi, vars, 'vi'), renderBody_(t.body_vi, vars, 'vi'),
    renderPlain_(t.title_en, vars, 'en'), t.body_en ? renderBody_(t.body_en, vars, 'en') : '', enFirst);
  return sendMail_(to, subject, html, opts.kind || key, opts.priority || 'high');
}

/** Dữ liệu mẫu để gửi thử (menu "Gửi thử một mẫu email cho tôi"): mọi biến có giá trị minh hoạ. */
function sampleTplVars_(key) {
  var lesson = '<ul style="padding-left:18px"><li style="margin:6px 0"><b>Thứ 4 14/10</b> · 19:00 - 19:30 · Tutor Vân · <a href="https://meet.google.com/">Google Meet</a></li></ul>';
  var url = portalUrl_('student');
  return {
    name: 'Minh Anh', package: 'Gói 1 tháng', package_en: '1 month pass', transfer_code: 'TP R00012 1M', login_url: url, link_note: linkUseText_(false), link_note_en: linkUseText_(true),
    rule: 'đặt buổi cho ngày mai trước 15:00 hôm nay; huỷ cũng phải trước 15:00 hôm trước.', rule_en: 'book tomorrow\'s lessons before 15:00 today; cancel before 15:00 the day before.',
    note: '', count: 2, s: 's', lessons_html: lesson, lesson_html: lesson, failed_html: '', cancel_rule: 'Huỷ buổi trước 15:00 hôm trước trong mục "Lịch của tôi".',
    cancel_rule_en: 'Cancel before 15:00 the day before in "My lessons".', portal_url: url, renew_url: url, meet_url: 'https://meet.google.com/', date: '14/10', slot: '19:00',
    lesson: 'Thứ 4 14/10 19:00', reason: 'bạn đã huỷ', reason_en: 'you cancelled', rebook_html: '', new_tutor: 'Ánh', end_date: '03/11/2026', week: '19/10/2026', deadline: '22:00 Thứ 7 17/10', deadline_en: '22:00 Sat 17/10',
    kind: 'Đăng ký mới', email: 'minhanh@example.com', phone: '0912 345 678', price: '1.790.000đ', screenshot_url: url, sheet_link: url,
    tutor: 'Vân', booked_note: 'Slot đã có học viên: Minh Anh.', booked_note_en: 'A student is booked: Minh Anh.', options: 'Duyệt, tự chọn tutor thay; Duyệt, chỉ định tutor thay; Duyệt, huỷ buổi; Từ chối', hours: 3,
    device: 'Chrome · Windows', via: 'link email', via_en: 'email link',
    tag: 'Cần xử lý', tag_en: 'Action needed', message: 'Ví dụ thông báo', message_en: 'Sample notification', code: 'MT0000', sender: 'admin@example.com', event: 'STUDENT_CANCELLED', time: fmtDateTime_(getNow_()),
    lesson_date: 'Thứ 2 20/10', lesson_slot: '19:00', days: 3, old_end: '20/10/2026',
    summary_html: '<ul><li>RESULT_COMPLETED: <b>5</b></li></ul>', table_html: '', subject: 'Ví dụ lỗi', detail_html: '<pre>Ví dụ chi tiết lỗi</pre>'
  };
}

// ── Jobs.gs ──
/**
 * Jobs.gs · Job định kỳ (v8, plan mục 4.10)
 *
 * Mỗi job chạy trong withLock_ và tự bắt lỗi: lỗi thì gửi email admin rồi ném lại để trang Executions ghi Failed
 * (CLAUDE.md luật 8: không nuốt lỗi im lặng). Trigger được tạo ở Setup.gs (chunk 3).
 * Thời lượng mỗi lần chạy được ghi ACTIVITY_LOG khi quá 20 giây, để theo dõi hạn mức 90 phút/ngày của Gmail thường.
 */

/**
 * Nhịp tim (chunk 5G): job chạy xong (kể cả bỏ lượt vì bận) ghi giờ thật vào Script Property HB_<tên>. Trang
 * ?page=health đọc các mốc này (không đọc Sheets) và trả STALE khi job dừng chạy, để dịch vụ giám sát bên ngoài báo
 * admin cả khi chính Apps Script không gửi được email. Lỗi ghi không làm hỏng job.
 */
function heartbeat_(name) { try { props_().setProperty('HB_' + name, String(realNowMs_())); } catch (e) { } }

function runJob_(name, fn) {
  var t0 = Date.now();
  try {
    var out = withLock_(fn);
    heartbeat_(name);
    var ms = Date.now() - t0;
    if (ms > 20000) { try { withLock_(function () { logActivity_('SYSTEM', 'JOB_SLOW', 'JOB', name, ms + ' ms'); }); } catch (e) { } }
    return out;
  } catch (e) {
    // Khoá đang bận (ví dụ tutor lưu nhiều slot): bỏ lượt này, lượt sau chạy tiếp; không email admin.
    if (String((e && e.message) || e) === BUSY_MESSAGE_) { heartbeat_(name); Logger.log('Job ' + name + ' bỏ lượt vì hệ thống bận'); return null; }
    mailAdminError_('Job ' + name + ' lỗi', (e && e.stack) || String(e));
    throw e;
  }
}

/**
 * Chạy fn một lần mỗi ngày, khi giờ hiện tại >= hour. Đánh dấu trong Script Properties (khoá theo ngày) để
 * hourlyJob chạy lại trong cùng ngày không làm lại. Trả kết quả fn, hoặc null nếu chưa tới giờ hoặc đã làm.
 */
function onceAfterHour_(name, hour, now, fn) {
  if (Number(hour) < 0 || now.getHours() < Number(hour)) return null;   // giờ âm (ví dụ -1) = tắt việc này
  var key = 'DONE_' + name + '_' + dateKey_(now), props = props_();
  if (props.getProperty(key)) return null;
  var out = fn();
  props.setProperty(key, '1');
  return out;
}

/** Xoá khoá DONE_<việc>_<ngày> cũ hơn 7 ngày (khoá theo ngày tăng mãi nếu không dọn). Trả số khoá đã xoá. */
function cleanDoneProps_(now) {
  var p = props_(), all = p.getProperties(), limit = dateKey_(addDays_(toMidnight_(now), -7)), n = 0;
  Object.keys(all).forEach(function (k) { var m = k.match(/^DONE_.+_(\d{4}-\d{2}-\d{2})$/); if (m && m[1] < limit) { p.deleteProperty(k); n++; } });
  // Chunk 5M: dấu chống báo lặp (giá trị là mốc ms) giữ 60 ngày; dấu chờ xác nhận Vắng tutor giữ 1 ngày.
  var cut60 = now.getTime() - 60 * 86400000, cut1 = now.getTime() - 86400000;
  Object.keys(all).forEach(function (k) {
    var ms = Number(all[k]);
    if (/^(COMPBLK|TRIALLEFT|TRIALOVER|PKGOUT|PKGMISS)_/.test(k) && ms && ms < cut60) { p.deleteProperty(k); n++; }
    else if (/^TA_CONFIRM_/.test(k) && ms && ms < cut1) { p.deleteProperty(k); n++; }
  });
  return n;
}

/**
 * Nhắc buổi học buổi sáng (từ MORNING_REMINDER_HOUR): mỗi học viên và mỗi tutor 1 email liệt kê buổi hôm nay chưa bắt đầu.
 * Cột day_reminder_at đánh dấu từng buổi, nên chạy lại không gửi trùng. Ưu tiên low (tự bỏ khi gần hết hạn mức email).
 */
function morningRemindersInLock_(now) {
  var h = now.getHours(), from = Number(cfg_('MORNING_REMINDER_HOUR'));
  if (from < 0 || h < from || h >= from + 4) return 0;   // -1 = tắt nhắc buổi sáng
  var t = table_('BOOKINGS'), today = toMidnight_(now);
  var list = t.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && !b.day_reminder_at && sameDate_(b.date, today) && slotStart_(b.date, b.slot) > now; });
  if (!list.length) return 0;
  var byStudent = {}, byTutor = {};
  list.sort(function (a, b) { return a.slot < b.slot ? -1 : 1; }).forEach(function (b) {
    (byStudent[b.student_id] = byStudent[b.student_id] || []).push(b);
    (byTutor[b.tutor_id] = byTutor[b.tutor_id] || []).push(b);
  });
  var sent = 0;
  Object.keys(byStudent).forEach(function (sid) { if (mailMorningReminder_(userById_(sid), byStudent[sid], false)) sent++; });
  Object.keys(byTutor).forEach(function (tid) { if (mailMorningReminder_(userById_(tid), byTutor[tid], true)) sent++; });
  list.forEach(function (b) { t.update(b, { day_reminder_at: now }); });
  return sent;
}

/** Thứ Hai của tuần sau, tính từ now. */
function nextWeekMonday_(now) { return addDays_(mondayOf_(toMidnight_(now)), 7); }
/** Tutor ACTIVE chưa mở giờ nào (OPEN) trong tuần bắt đầu thứ Hai mon. */
function tutorsWithoutSlots_(mon) {
  var sun = addDays_(mon, 6), avail = table_('AVAILABILITY').all();
  return activeTutors_().filter(function (t) {
    return t.status === USER_STATUS.ACTIVE && !avail.some(function (a) { return a.tutor_id === t.user_id && a.status === AVAIL_STATUS.OPEN && a.date >= mon && a.date <= sun; });
  });
}

/**
 * Chunk 5J (câu 21 đổi 01/11): sau hạn TUTOR_DEADLINE_AT, báo admin danh sách tutor chưa mở giờ nào cho tuần sau. 1 lần mỗi tuần,
 * làm bù nếu lượt chạy đúng giờ bị lỡ (mốc theo tuần, không theo giờ).
 */
function tutorNoAvailabilityInLock_(now) {
  var mon = nextWeekMonday_(now), dl = tutorWeekDeadline_(mon);
  if (now < dl) return null;
  var key = 'DONE_NOAVAILW_' + dateKey_(mon), p = props_();
  if (p.getProperty(key)) return null;
  // Ngày nâng cấp từ 8.1.0: job Chủ nhật cũ đã báo cho tuần này (mốc DONE_NOAVAIL_<Chủ nhật>) thì không báo lại.
  if (p.getProperty('DONE_NOAVAIL_' + dateKey_(addDays_(mon, -1)))) { p.setProperty(key, '1'); return null; }
  var missing = tutorsWithoutSlots_(mon);
  p.setProperty(key, '1');
  if (!missing.length) return 0;
  notify_('TUTOR_NO_AVAILABILITY', { entity: 'USER', entity_id: missing.map(function (t) { return t.user_id; }).join(','), link: rowLink_('AVAILABILITY'),
    message: missing.length + ' tutor chưa mở lịch tuần ' + fmtDate_(mon) + ' sau hạn ' + fmtDowTimeVi_(dl) + ': ' + missing.map(function (t) { return t.name + ' (' + t.user_id + ')'; }).join(', '),
    message_en: missing.length + ' tutor(s) have not opened the week of ' + fmtDate_(mon) + ' after the ' + fmtDowTimeEn_(dl) + ' deadline: ' + missing.map(function (t) { return t.name + ' (' + t.user_id + ')'; }).join(', ') });
  return missing.length;
}

/**
 * Chunk 5J: nhắc tutor chưa mở giờ cho tuần sau theo TUTOR_REMIND_AT (thay 2 trigger sundayRemind cũ). Trong khoá chỉ chọn tutor
 * và ghi mốc theo tuần (DONE_TREMIND<i>_<thứ Hai>, giá trị là danh sách còn phải gửi). Gửi sau khi nhả khoá, tối đa 60 giây;
 * còn lại gửi ở lượt sau, tới hạn mở lịch. Lỡ nhiều mốc (job chậm) thì chỉ gửi theo mốc mới nhất, không gửi trùng.
 */
var TUTOR_REMIND_BUDGET_MS_ = 60000, TUTOR_REMIND_STALE_MS_ = 600000, TUTOR_REMIND_MAX_TRIES_ = 3;
function tutorRemindInLock_(now) {
  var sch = tutorSchedule_(), mon = nextWeekMonday_(now), dl = dowHourBefore_(sch.deadline, mon), p = props_();
  if (!(now < dl) || !sch.remind.length) return 0;
  var last = -1;
  sch.remind.forEach(function (r, i) { if (!(now < dowHourBefore_(r, mon))) last = i; });
  if (last < 0) return 0;
  var key = 'DONE_TREMIND' + last + '_' + dateKey_(mon), st = p.getProperty(key), pending, nowMs = Date.now();
  var still = {}; tutorsWithoutSlots_(mon).forEach(function (t) { still[t.user_id] = t; });
  if (st === null || st === undefined) pending = Object.keys(still);
  else {
    var v; try { v = JSON.parse(st); } catch (e) { v = []; }
    // Soát 5J (kỹ thuật): lượt khác đang gửi (dấu sending dưới 10 phút) thì bỏ qua, chống gửi trùng khi hai hourlyJob chồng nhau.
    // Dấu cũ hơn 10 phút (lượt trước bị Google dừng giữa chừng) thì gửi lại phần còn trong danh sách.
    if (v && !Array.isArray(v) && v.sending) { if (nowMs - Number(v.sending) < TUTOR_REMIND_STALE_MS_) return 0; pending = v.list || []; }
    else pending = Array.isArray(v) ? v : [];
  }
  pending = pending.filter(function (id) { return still[id]; });   // tutor đã mở giờ trong lúc chờ: thôi nhắc
  if (!pending.length) { p.setProperty(key, '[]'); return 0; }
  p.setProperty(key, JSON.stringify({ sending: nowMs, list: pending }));
  var list = pending.map(function (id) { return still[id]; }), tryKey = 'DONE_TREMTRY' + last + '_' + dateKey_(mon);
  afterLock_(function () {
    var t0 = Date.now(), left = [], tpl = emailTemplate_('TUTOR_REMIND'), tries = {};
    try { tries = JSON.parse(props_().getProperty(tryKey) || '{}') || {}; } catch (e) { tries = {}; }
    if (tpl && !tpl.active) { try { props_().setProperty(key, '[]'); } catch (e) { } return; }   // admin tắt mẫu: thôi nhắc, không thử lại mỗi giờ
    list.forEach(function (t) {
      if (Date.now() - t0 > TUTOR_REMIND_BUDGET_MS_) { left.push(t.user_id); return; }
      var ok = false;
      try { ok = mailTutorRemindAvailability_(t, mon, dl) !== false; } catch (e) { afterLockError_(e); }
      // Gửi lỗi (hết hạn mức, địa chỉ hỏng): thử lại ở lượt sau, tối đa TUTOR_REMIND_MAX_TRIES_ lần mỗi mốc.
      if (!ok) { tries[t.user_id] = (tries[t.user_id] || 0) + 1; if (tries[t.user_id] < TUTOR_REMIND_MAX_TRIES_) left.push(t.user_id); }
    });
    try { props_().setProperty(key, JSON.stringify(left)); if (Object.keys(tries).length) props_().setProperty(tryKey, JSON.stringify(tries)); } catch (e) { }
  });
  return list.length;
}

/**
 * Mỗi 15 phút: email nhắc buổi học trước REMINDER_BEFORE_MINUTES phút, mỗi buổi 1 lần (câu 41, B16).
 * Chunk 5F (soát kiến trúc F4): trong khoá chỉ chọn buổi và đánh dấu đã nhắc; đọc link Meet và gửi email sau khi nhả khoá.
 * Gửi hỏng cả hai email thì bỏ đánh dấu để lần sau gửi lại.
 */
function reminderJob(e) { requireOperator_(e);
  return runJob_('reminderJob', function () {
    var now = getNow_(), target = cfg_('REMINDER_BEFORE_MINUTES'), win = cfg_('REMINDER_WINDOW_MINUTES'), t = table_('BOOKINGS'), due = [];
    t.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && !b.reminder_sent_at; }).forEach(function (b) {
      var mins = (slotStart_(b.date, b.slot).getTime() - now.getTime()) / 60000;
      if (mins > target - win && mins <= target + win) {
        due.push({ b: b, s: userById_(b.student_id), t: userById_(b.tutor_id) });
        t.update(b, { reminder_sent_at: now });
      }
    });
    if (due.length) afterLock_(function () {
      var failed = [];
      due.forEach(function (d) {
        fillMeetLink_(d.b);
        var a = false, c = false;
        try { a = mailLessonReminder_(d.b, d.s, false, d.t); } catch (x) { afterLockError_(x); }
        try { c = mailLessonReminder_(d.b, d.t, true, d.s); } catch (x2) { afterLockError_(x2); }
        if (!a && !c) failed.push(d.b.booking_id);
      });
      if (failed.length) deferWrite_(function () {
        var tb = table_('BOOKINGS');
        failed.forEach(function (id) { var f = tb.byId(id); if (f) tb.update(f, { reminder_sent_at: '' }); });
      });
    });
    return due.length;
  });
}

/**
 * Đối soát mỗi giờ (chunk 5F): tìm dữ liệu sai luật mà code không bao giờ được tạo ra (sửa tay trên Sheets, lỗi chưa biết)
 * và buổi sắp diễn ra mà chưa có sự kiện Calendar. Báo admin, mỗi vấn đề 1 lần mỗi ngày. Không tự sửa dữ liệu.
 * Phải gọi trong withLock_. Trả số vấn đề mới báo.
 */
function reconcileInLock_(now) {
  var today = toMidnight_(now), found = 0;
  // Mỗi vấn đề 1 lần mỗi ngày: tra chính tab NOTIFICATIONS (soát R1 C2: bộ đệm sống tối đa 6 giờ, không dùng cho "mỗi ngày").
  var sent = {};
  table_('NOTIFICATIONS').filter(function (n) { return (n.event === 'DATA_INVARIANT' || n.event === 'CALENDAR_LATE') && n.time && toMidnight_(new Date(n.time)).getTime() === today.getTime(); })
    .forEach(function (n) { sent[n.event + '|' + n.entity_id] = true; });
  var once = function (event, entityId) { return !sent[event + '|' + entityId]; };
  var bks = table_('BOOKINGS').filter(function (b) { return b.date && b.date >= today; });
  var bySlot = {}, byDay = {}, maxPerDay = cfg_('MAX_BOOKINGS_PER_DAY');
  bks.forEach(function (b) {
    if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) {
      var k = b.tutor_id + '|' + dateKey_(b.date) + '|' + b.slot; (bySlot[k] = bySlot[k] || []).push(b.booking_id);
    }
    if (bookingDeducts_(b)) { var d = b.student_id + '|' + dateKey_(b.date); (byDay[d] = byDay[d] || []).push(b.booking_id); }
  });
  Object.keys(bySlot).forEach(function (k) {
    if (bySlot[k].length > 1 && once('DATA_INVARIANT', bySlot[k].join(','))) {
      found++;
      notify_('DATA_INVARIANT', { entity: 'BOOKING', entity_id: bySlot[k].join(','), link: rowLink_('BOOKINGS'),
        message: 'Một tutor có ' + bySlot[k].length + ' học viên cùng giờ (' + k.replace(/\|/g, ' ') + '): ' + bySlot[k].join(', ') + '. Đổi tutor hoặc huỷ bớt một buổi.',
        message_en: 'One tutor has ' + bySlot[k].length + ' students at the same time (' + k.replace(/\|/g, ' ') + '): ' + bySlot[k].join(', ') + '. Reassign or cancel one lesson.' });
    }
  });
  Object.keys(byDay).forEach(function (k) {
    if (byDay[k].length > maxPerDay && once('DATA_INVARIANT', byDay[k].join(','))) {
      found++;
      notify_('DATA_INVARIANT', { entity: 'BOOKING', entity_id: byDay[k].join(','), link: rowLink_('BOOKINGS'),
        message: 'Học viên ' + k.split('|')[0] + ' có ' + byDay[k].length + ' buổi ngày ' + k.split('|')[1] + ' (tối đa ' + maxPerDay + '): ' + byDay[k].join(', '),
        message_en: 'Student ' + k.split('|')[0] + ' has ' + byDay[k].length + ' lessons on ' + k.split('|')[1] + ' (max ' + maxPerDay + '): ' + byDay[k].join(', ') });
    }
  });
  if (cfg_('MEET_MODE') !== 'TUTOR_ROOM') {
    // Buổi sắp diễn ra chưa có sự kiện. Bỏ qua buổi admin đã dán link Meet tay. Gộp MỘT email cho cả lượt (soát R2 T6),
    // câu chữ theo trạng thái: đang chờ hàng đợi (tự thử lại) hay FAILED (cần gửi link tay).
    var lead = Number(cfg_('CALENDAR_MIN_LEAD_HOURS')) * 3600000, late = [];
    bks.forEach(function (b) {
      if (b.status !== BOOKING_STATUS.CONFIRMED || b.event_id || b.meet_link) return;
      var left = slotStart_(b.date, b.slot).getTime() - now.getTime();
      if (left > 0 && left <= lead && once('CALENDAR_LATE', b.booking_id)) late.push(b);
    });
    if (late.length) {
      calendarHint_(now.getTime());   // nhắc hàng đợi chạy ngay lần tới
      found += late.length;
      var line = function (b) { return b.booking_id + ' (' + fmtDayVi_(b.date) + ' ' + b.slot + (calState_(b) === CAL_STATE.FAILED ? ', đã lỗi: gửi link Meet tay' : ', hệ thống đang thử lại') + ')'; };
      var lineEn = function (b) { return b.booking_id + ' (' + fmtDayEn_(b.date) + ' ' + b.slot + (calState_(b) === CAL_STATE.FAILED ? ', failed: send the Meet link by hand' : ', the system is retrying') + ')'; };
      late.forEach(function (b) {
        notify_('CALENDAR_LATE', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
          message: 'Chưa có sự kiện Calendar: ' + line(b), message_en: 'No Calendar event yet: ' + lineEn(b) }, late.length > 1 && b !== late[0] ? function () { return false; } : (late.length > 1 ? function () {
            return mailAdminNotice_('WARNING', 'CALENDAR_LATE', { message: late.length + ' buổi sắp diễn ra chưa có sự kiện Calendar: ' + late.map(line).join('; ') +
              '. Nếu 30 phút nữa vẫn chưa có: bấm menu "Calendar: tạo sự kiện đang chờ ngay" hoặc gửi link Meet tay.',
              message_en: late.length + ' upcoming lessons have no Calendar event: ' + late.map(lineEn).join('; ') + '. If still missing in 30 minutes: use the menu "Calendar: tạo sự kiện đang chờ ngay" or send the Meet link by hand.', link: rowLink_('BOOKINGS') });
          } : undefined));
      });
    }
  }
  return found;
}

/**
 * Chunk 5N: buổi kẹt ở Chờ đổi tutor (PENDING_REASSIGN). Bình thường trạng thái này chỉ có trong một khoá (đổi tutor xong thì về
 * CONFIRMED hoặc huỷ); còn lại sau khoá là do lượt đổi tutor lỗi giữa chừng hoặc sửa tay, và buổi không có tutor dạy.
 * BOOKINGS không có cột "lúc vào trạng thái này", nên job ghi lần đầu thấy (Script Property STUCK_<mã>, mốc ms) và báo REASSIGN_STUCK
 * đúng một lần khi đã thấy đủ REASSIGN_STUCK_HOURS giờ. Dấu đã báo (SENT) chỉ ghi sau khi khoá ghi xong dòng thông báo.
 * Buổi ra khỏi trạng thái (đổi tutor, huỷ) thì xoá dấu: kẹt lại lần sau được báo lại. Trả số buổi vừa báo.
 */
function reassignStuckInLock_(now) {
  var hours = Number(cfg_('REASSIGN_STUCK_HOURS'));
  if (!(hours >= 0)) hours = DEFAULTS_.REASSIGN_STUCK_HOURS;
  var p = props_(), all = p.getProperties(), seen = {}, stuck = [];
  table_('BOOKINGS').filter(function (b) { return b.status === BOOKING_STATUS.PENDING_REASSIGN; }).forEach(function (b) {
    var k = 'STUCK_' + b.booking_id, v = all[k];
    seen[k] = true;
    if (v === 'SENT') return;
    var since = Number(v);
    if (!v || isNaN(since)) { since = now.getTime(); p.setProperty(k, String(since)); }
    if (now.getTime() - since >= hours * 3600000) stuck.push(b);
  });
  Object.keys(all).forEach(function (k) { if (/^STUCK_/.test(k) && !seen[k]) p.deleteProperty(k); });
  if (!stuck.length) return 0;
  var names = {}; table_('USERS').all().forEach(function (u) { names[u.user_id] = u.name; });
  stuck.forEach(function (b) {
    var who = (names[b.student_id] || b.student_id) + ', ' + (names[b.tutor_id] || b.tutor_id);
    logActivity_('SYSTEM', 'REASSIGN_STUCK', 'BOOKING', b.booking_id, { tutor: b.tutor_id, hours: hours });
    notify_('REASSIGN_STUCK', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
      message: 'Buổi ' + b.booking_id + ' (' + fmtDayVi_(b.date) + ' ' + b.slot + ', ' + who + ') kẹt ở Chờ đổi tutor quá ' + hours + ' giờ: chưa có tutor dạy. Chọn Đổi tutor hoặc Huỷ bởi admin ở cột admin_action.',
      message_en: 'Lesson ' + b.booking_id + ' (' + fmtDayEn_(b.date) + ' ' + b.slot + ', ' + who + ') has been stuck waiting for a new tutor for over ' + hours + ' hour(s): no tutor will teach it. Pick Đổi tutor (reassign) or Huỷ bởi admin (cancel) in the admin_action column.' });
    afterLock_(function () { props_().setProperty('STUCK_' + b.booking_id, 'SENT'); });
  });
  return stuck.length;
}

/** Mỗi giờ: tự từ chối yêu cầu huỷ quá hạn duyệt (câu 20), tự hoàn thành buổi quá 24 giờ (câu 29). */
function hourlyJob(e) { requireOperator_(e);
  var logQueued = [];
  var res = runJob_('hourlyJob', function () {
    // Chunk 5G (soát R3 N5): dọn lần bỏ dòng dở TRƯỚC mọi bước khác, để đối soát không thấy dòng trùng ở đuôi.
    try { var pp = props_().getProperties(); Object.keys(pp).forEach(function (k) { var tn = k.replace(/^PURGE_OPEN_/, ''); if (k !== tn && SCHEMA[tn]) purgeRecover_(tn); }); } catch (pe) { Logger.log('Dọn lần bỏ dòng dở lỗi: ' + pe.message); }
    logQueued = drainLogQueue_(true);   // chunk 5I: nhật ký từng gặp khoá bận; xoá hàng chờ sau khi ra khỏi khoá
    // Làm đầu tiên: bước sau có lỗi thì phiên của tài khoản DISABLED vẫn bị huỷ.
    var revoked = revokeDisabledSessionsInLock_(getNow_());
    var now = getNow_(), limitMs = cfg_('TUTOR_CANCEL_DECIDE_BEFORE_HOURS') * 3600000, rejected = 0;
    table_('AVAILABILITY').filter(function (a) { return a.status === AVAIL_STATUS.CANCEL_PENDING; }).forEach(function (a) {
      if (slotStart_(a.date, a.slot).getTime() - now.getTime() <= limitMs) {
        decideTutorCancelInLock_(a.avail_id, ADMIN_DECISION.REJECT, 'SYSTEM');
        notify_('TUTOR_CANCEL_AUTO_REJECTED', { tutor_id: a.tutor_id, entity: 'AVAILABILITY', entity_id: a.avail_id, link: rowLink_('AVAILABILITY', a._row),
          message: 'Tự từ chối yêu cầu huỷ của ' + a.tutor_id + ' (' + fmtDayVi_(a.date) + ' ' + a.slot + ') vì quá hạn duyệt',
          message_en: 'Auto rejected the cancel request of ' + a.tutor_id + ' (' + fmtDayEn_(a.date) + ' ' + a.slot + ') because the decision deadline passed' });
        rejected++;
      }
    });
    // Bảo trì: tutor không xác nhận được kết quả, nên tạm dừng tự Hoàn thành (soát R1 L3); hết bảo trì thì chạy tiếp.
    // Chunk 5J (câu 29 đổi 01/11): không tự Hoàn thành. Báo đỏ khi quá hạn xác nhận; quá hạn tiếp thì Không hoàn thành.
    // Bảo trì: tutor không xác nhận được, nên tạm dừng bước chuyển Không hoàn thành (vẫn báo).
    var completed = resultOverdueInLock_(now, maintMode_() === 'OFF');
    // Chunk 5N: buổi kẹt Chờ đổi tutor quá REASSIGN_STUCK_HOURS giờ: báo admin một lần.
    var stuck = 0; try { stuck = reassignStuckInLock_(now); } catch (se) { Logger.log('Báo buổi kẹt lỗi: ' + se.message); }
    // Chunk 5M: tính lại gói còn chạy (khoá ngày bắt đầu khi buổi kỹ thuật quá TECH_DECIDE_HOURS, tự lành ô bị sửa ngoài hệ thống).
    var heal = null; try { heal = pkgHealAllInLock_(now); } catch (he) { Logger.log('Tính lại gói lỗi: ' + he.message); mailAdminError_('Tính lại gói (hourlyJob)', (he && he.stack) || String(he)); }
    // Việc theo giờ trong ngày (chunk 5B), mỗi việc tối đa 1 lần mỗi ngày hoặc mỗi tuần:
    var morning = morningRemindersInLock_(now);
    var noAvail = tutorNoAvailabilityInLock_(now);
    var tutorRemind = 0; try { tutorRemind = tutorRemindInLock_(now); } catch (te) { Logger.log('Nhắc tutor lỗi: ' + te.message); }
    var digest = onceAfterHour_('DIGEST', cfg_('DIGEST_HOUR'), now, function () { return sendDailyDigestInLock_(now); });
    // Dọn tab AUTH 1 lần mỗi ngày từ 03:00 (chunk 5D).
    var authPurged = onceAfterHour_('AUTHPURGE', 3, now, function () { return purgeAuthInLock_(now); });
    // Chunk 5F: tổng kết lô Calendar đêm qua (sau 00:00), đối soát dữ liệu, chép số đo, dọn METRICS cũ.
    var night = 0; try { night = calendarNightSummaryInLock_(now); } catch (ne) { Logger.log('Tổng kết Calendar lỗi: ' + ne.message); }
    // 5K: METRICS không xoá 90 ngày nữa, chuyển sang file lưu trữ cùng nhật ký (Archive.gs, LOG_KEEP_DAYS).
    var issues = 0; try { issues = reconcileInLock_(now); } catch (re) { Logger.log('Đối soát lỗi: ' + re.message); }
    var metrics = 0; try { metrics = flushMetricsInLock_(); } catch (me) { Logger.log('Ghi số đo lỗi: ' + me.message); }
    // Chunk 5G: dọn khoá DONE_ cũ hơn 7 ngày (soát R1 L8, R2 T23); dọn lần bỏ dòng dở (purgeRows_ bị cắt).
    onceAfterHour_('PROPCLEAN', 3, now, function () { return cleanDoneProps_(now); });

    return { rejected: rejected, completed: completed, stuck: stuck, packages: heal, morning: morning, noAvailability: noAvail, tutorRemind: tutorRemind, digest: digest, authPurged: authPurged, revoked: revoked, issues: issues, metrics: metrics, calendarNight: night };
  });
  if (res) forgetLogQueue_(logQueued);   // dữ liệu đã ghi khi ra khỏi khoá: mới xoá hàng chờ nhật ký
  if (res && res.revoked) { forgetSessions_(res.revoked.hashes, res.revoked.users); res.revoked = res.revoked.hashes.length; }
  // Chunk 5G: lưu trữ hằng tháng, 1 lần mỗi ngày từ ARCHIVE_HOUR, mỗi tab một khoá ngắn riêng (ngoài khoá của hourlyJob).
  if (res) { try { res.archive = archiveIfDue_(getNow_()); } catch (ae) { mailAdminError_('Lưu trữ lỗi', (ae && ae.stack) || String(ae)); } }
  return res;
}

/** 06:00 hằng ngày: chuyển trạng thái gói, email sắp hết hạn (câu 3, 6, 41). */
function dailyJob(e) { requireOperator_(e);
  return runJob_('dailyJob', function () {
    var today = toMidnight_(getNow_()), defs = pkgDefs_(), t = table_('STUDENT_PACKAGES'), bks = table_('BOOKINGS').all();
    var autoDays = cfg_('INACTIVE_AUTO_ACTIVATE_DAYS'), notice = cfg_('EXPIRY_NOTICE_DAYS'), changed = 0, mailed = 0;
    // Chunk 5M: học viên đang tạm khoá thì gói không đổi trạng thái (không hết hạn khi đang khoá).
    var suspended = {}; table_('USERS').all().forEach(function (u) { if (u.status === USER_STATUS.SUSPENDED) suspended[u.user_id] = true; });
    t.all().forEach(function (sp) {
      var def = defs[sp.package_code];
      if (!def) return;
      var patch = pkgDailyTransition_(sp, def, bks.filter(function (b) { return b.student_id === sp.student_id; }), today, autoDays, { suspended: !!suspended[sp.student_id] });
      if (patch) { t.update(sp, patch); changed++; logActivity_('SYSTEM', 'PACKAGE_' + patch.status, 'STUDENT_PACKAGE', sp.sp_id, ''); }
      if (sp.status === PKG_STATUS.ACTIVE && def.type !== 'SESSIONS' && sp.end_date && !sp.expiry_notice_at && diffDays_(today, sp.end_date) === notice) {
        var hasNext = t.filter(function (o) { return o.student_id === sp.student_id && o.status === PKG_STATUS.QUEUED; }).length > 0;
        if (!hasNext && mailExpirySoon_(userById_(sp.student_id), sp, def)) { t.update(sp, { expiry_notice_at: getNow_() }); mailed++; }
      }
    });
    return { changed: changed, mailed: mailed };
  });
}

/**
 * Bỏ từ 5J: nhắc tutor chạy trong hourlyJob (tutorRemindInLock_). Giữ hàm rỗng để trigger Chủ nhật của bản cũ (chưa chạy lại menu 3)
 * không báo lỗi "không tìm thấy hàm"; menu 3 xoá trigger này vì tên vẫn nằm trong TRIGGER_HANDLERS_.
 */
function sundayRemind(e) { requireOperator_(e); return 0; }

// ── LoadTest.gs ──
/**
 * LoadTest.gs · Thử tải trên STAGING trước khi chạy thật (chunk 5G, quyết định Q5 ngày 16/10)
 *
 * Mục đích: đo trên Google thật (không phải ước tính) khi nhiều học viên cùng đặt: bao nhiêu lượt bị từ chối, bận,
 * chậm bao lâu, có mất hay trùng booking không. Chỉ chạy trên STAGING (tài khoản admintest@).
 *
 * Cách hoạt động:
 *   1. Menu "Thử tải: tạo dữ liệu giả": N học viên lt0001@loadtest.invalid... có gói 1 tháng đang chạy, M tutor
 *      ltt01@loadtest.invalid... mở slot 14 ngày tới. Tên miền .invalid không bao giờ có thật: email tới đây không gửi
 *      (sendMail_ bỏ qua nhưng vẫn ghi MAIL_LOG), Calendar không mời các địa chỉ này (realGuests_).
 *   2. Menu "Thử tải: bật 2 giờ": sinh khoá bí mật mới (Script Property LOADTEST_SECRET), mở cổng doPost tới
 *      LOADTEST_UNTIL. Hết giờ tự đóng. PRODUCTION không bao giờ mở (switchToProduction xoá khoá).
 *   3. Máy tính của anh chạy loadtest/run.js (Node) hoặc loadtest/browser.js (Playwright, trình duyệt thật): mỗi người
 *      ảo gửi POST tới link /exec: { secret, as: email học viên giả, fn, args }. Máy chủ gọi ĐÚNG hàm API thật
 *      (apiStudentHome, apiStudentBook...) nên đi qua khoá, bộ đệm, chống trùng, hàng đợi Calendar như người thật.
 *   4. Menu "Thử tải: kiểm kết quả": đối soát (trùng giờ, trùng mã lần bấm, quá 1 buổi mỗi ngày), số đo tab METRICS.
 *   5. Xong: menu "Xoá dữ liệu test" (bước 2 xác nhận) để dọn sạch.
 * Cổng doPost (luật 24, 37): khi tắt hoặc sai khoá thì trả ngay, không đọc ghi Sheets, không lấy khoá. Chỉ gọi được các hàm
 * trong LOADTEST_FNS_ và chỉ thay mặt tài khoản @loadtest.invalid.
 */

var LOADTEST_DOMAIN_ = 'loadtest.invalid';
function isTestAddress_(email) { return /@loadtest\.invalid$/i.test(String(email || '').trim()); }
/** Bỏ khách mời giả (thử tải) khỏi danh sách khách Calendar. */
function realGuests_(list) { return list.filter(function (a) { return a && a.email && !isTestAddress_(a.email); }); }

function loadTestOn_() {
  if (isProduction_()) return false;
  var p = props_(), s = p.getProperty('LOADTEST_SECRET'), until = Number(p.getProperty('LOADTEST_UNTIL') || 0);
  return !!s && s.length >= 32 && realNowMs_() < until;
}

function safeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length || !a.length) return false;
  var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Phiên của một học viên, tutor giả: tạo 1 lần, giữ trong bộ đệm 6 giờ. Chỉ nhận tài khoản @loadtest.invalid đang ACTIVE. */
function loadTestSession_(email) {
  email = String(email || '').trim().toLowerCase();
  if (!isTestAddress_(email)) throw new Error('AUTH:FORBIDDEN');
  var c = CacheService.getScriptCache(), key = 'lt_sess_' + sha256Hex_(email).substring(0, 32), tok = c.get(key);
  if (tok) return tok;
  var u = userByEmail_(email);
  if (!u || u.status !== USER_STATUS.ACTIVE) throw new Error('AUTH:FORBIDDEN');
  tok = withLock_(function () { return createSessionInLock_(u, 'loadtest', 'LINK'); });
  c.put(key, tok, 21600);
  return tok;
}

var LOADTEST_FNS_ = ['info', 'warm', 'home', 'slots', 'book', 'cancel', 'tutorHome', 'tutorAvail', 'tutorSet', 'link'];
function loadTestCall_(fn, tok, args) {
  switch (fn) {
    case 'info': return apiPublicInfo();
    case 'warm': return { ok: true };   // chỉ tạo sẵn phiên (run.js làm trước khi bấm giờ, soát R2 T19)
    case 'home': return apiStudentHome(tok, args[0] || {});
    case 'slots': return apiStudentSlots(tok, args[0], args[1]);
    case 'book': return apiStudentBook(tok, args[0], args[1]);
    case 'cancel': return apiStudentCancel(tok, args[0], args[1]);
    case 'tutorHome': return apiTutorHome(tok);
    case 'tutorAvail': return apiTutorAvailability(tok, args[0], args[1]);
    case 'tutorSet': return apiTutorSetAvailability(tok, args[0], args[1]);
  }
  return { ok: false, reason: REASONS.INVALID_INPUT };
}

/** Xử lý một POST thử tải. Trả object (doPost đổi thành JSON). */
function loadTestHandle_(e) {
  if (!loadTestOn_()) return { ok: false, reason: 'LOADTEST_OFF' };
  var body = null;
  try { body = JSON.parse(String((e && e.postData && e.postData.contents) || '')); } catch (x) { return { ok: false, reason: REASONS.INVALID_INPUT }; }
  if (!body || !safeEqual_(body.secret, props_().getProperty('LOADTEST_SECRET'))) return { ok: false, reason: REASONS.FORBIDDEN };
  var fn = String(body.fn || ''), args = Array.isArray(body.args) ? body.args : [];
  if (LOADTEST_FNS_.indexOf(fn) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  var t0 = Date.now(), out;
  try {
    if (fn === 'link') {
      // Link đăng nhập thật cho trình duyệt (loadtest/browser.js): đi đúng đường google.script.run của trang web.
      var em = String(body.as || '').trim().toLowerCase();
      if (!isTestAddress_(em)) return { ok: false, reason: REASONS.FORBIDDEN };
      var u = userByEmail_(em);
      if (!u || u.status !== USER_STATUS.ACTIVE) return { ok: false, reason: REASONS.NOT_FOUND };
      out = { ok: true, data: { url: withLock_(function () { return createLoginLinkInLock_(u); }) } };
    } else {
      out = loadTestCall_(fn, fn === 'info' ? '' : loadTestSession_(body.as), args);
      // Phiên giả trong bộ đệm đã bị huỷ (ví dụ Xoá dữ liệu test): bỏ bản đệm, tạo phiên mới, thử lại 1 lần (soát R1 L5).
      if (out && out.reason === REASONS.SESSION_INVALID && fn !== 'info') {
        try { CacheService.getScriptCache().remove('lt_sess_' + sha256Hex_(String(body.as || '').trim().toLowerCase()).substring(0, 32)); } catch (x) { }
        out = loadTestCall_(fn, loadTestSession_(body.as), args);
      }
    }
  } catch (err) {
    var m = String((err && err.message) || err);
    out = m === BUSY_MESSAGE_ ? { ok: false, reason: REASONS.BUSY } : m.indexOf('AUTH:') === 0 ? { ok: false, reason: m.substring(5) } : { ok: false, reason: REASONS.SERVER_ERROR, message: m.substring(0, 200) };
  }
  out = out || {};
  out.server_ms = Date.now() - t0;
  return out;
}

/** Cửa POST của web app: chỉ dùng cho thử tải trên STAGING. */
function doPost(e) {
  var out; forgetEnvMemo_();
  try { out = loadTestHandle_(e); } catch (err) { out = { ok: false, reason: REASONS.SERVER_ERROR }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Tạo dữ liệu giả (STAGING, chủ file). Chạy lại thì chỉ thêm phần còn thiếu. Trả { students, tutors, slots }. */
function loadTestSeed_(nStudents, nTutors, days) {
  if (isProduction_()) throw new Error('Không tạo dữ liệu thử tải trên PRODUCTION.');
  nStudents = Math.min(2000, Math.max(1, Math.floor(nStudents || 100)));
  nTutors = Math.min(60, Math.max(1, Math.floor(nTutors || 10)));
  days = Math.min(21, Math.max(1, Math.floor(days || 14)));
  var pad = function (n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; };
  return withLock_(function () {
    var users = table_('USERS'), sps = table_('STUDENT_PACKAGES'), av = table_('AVAILABILITY'), defs = pkgDefs_();
    var now = getNow_(), today = toMidnight_(now), def = defs.PASS_1M || defs[Object.keys(defs).filter(function (k) { return defs[k].type === 'DAYS'; })[0]];
    if (!def) throw new Error('Cần gói loại DAYS (ví dụ PASS_1M) trong tab PACKAGES.');
    var have = {}; users.all().forEach(function (u) { have[String(u.email).toLowerCase()] = u; });
    var out = { students: 0, tutors: 0, slots: 0 }, tutorIds = [];
    for (var t = 1; t <= nTutors; t++) {
      var te = 'ltt' + pad(t, 2) + '@' + LOADTEST_DOMAIN_, tu = have[te];
      if (!tu) { tu = users.insert({ user_id: nextId_('USERS_TUTOR'), role: 'TUTOR', email: te, name: 'LT Tutor ' + pad(t, 2), status: USER_STATUS.ACTIVE, rate_vnd: 0, created_at: now, note: 'thử tải' }); out.tutors++; }
      tutorIds.push(tu.user_id);
    }
    for (var s = 1; s <= nStudents; s++) {
      var se = 'lt' + pad(s, 4) + '@' + LOADTEST_DOMAIN_, su = have[se];
      if (!su) { su = users.insert({ user_id: nextId_('USERS_STUDENT'), role: 'STUDENT', email: se, name: 'LT Student ' + pad(s, 4), status: USER_STATUS.ACTIVE, created_at: now, note: 'thử tải' }); out.students++; }
      var hasPkg = sps.find(function (p) { return p.student_id === su.user_id && p.status === PKG_STATUS.ACTIVE; });
      if (!hasPkg) sps.insert({ sp_id: nextId_('STUDENT_PACKAGES'), student_id: su.user_id, package_code: def.code, status: PKG_STATUS.ACTIVE, start_date: today,
        end_date: addDays_(today, Number(def.days || 30)), start_source: 'LOADTEST', sessions_total: def.sessions || '', suspended_days: 0, purchased_at: now });
    }
    var slots = slotList_(), open = {};
    av.all().forEach(function (a) { open[a.tutor_id + '|' + dateKey_(a.date) + '|' + a.slot] = true; });
    for (var d = 1; d <= days; d++) {
      var date = addDays_(today, d);
      tutorIds.forEach(function (tid) {
        slots.forEach(function (sl) {
          if (open[tid + '|' + dateKey_(date) + '|' + sl]) return;
          av.insert({ avail_id: nextId_('AVAILABILITY'), tutor_id: tid, date: date, slot: sl, status: AVAIL_STATUS.OPEN, created_at: now }); out.slots++;
        });
      });
    }
    logActivity_(adminActor_(), 'LOADTEST_SEED', 'SYSTEM', '', JSON.stringify(out));
    return out;
  }, 30000);
}

/** Bật cổng thử tải trong `hours` giờ với khoá mới. Trả { secret, until, url }. */
function loadTestEnable_(hours) {
  if (isProduction_()) throw new Error('Không bật thử tải trên PRODUCTION.');
  var secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''), until = realNowMs_() + Math.min(6, Math.max(0.25, Number(hours) || 2)) * 3600000;
  var p = props_(); p.setProperty('LOADTEST_SECRET', secret); p.setProperty('LOADTEST_UNTIL', String(until));
  try { withLock_(function () { logActivity_(adminActor_(), 'LOADTEST_ON', 'SYSTEM', '', new Date(until).toISOString()); }); } catch (e) { }
  return { secret: secret, until: new Date(until), url: String(cfg_('WEBAPP_URL') || '') };
}
function loadTestDisable_() { var p = props_(); p.deleteProperty('LOADTEST_SECRET'); p.deleteProperty('LOADTEST_UNTIL'); }

/**
 * Kiểm kết quả sau lượt thử tải (chỉ đọc): số booking của học viên giả, trùng mã lần bấm, hai học viên cùng tutor cùng giờ,
 * học viên quá 1 buổi mỗi ngày, hàng đợi Calendar, số đo giờ gần nhất.
 */
function loadTestCheck_() {
  clearDbCache_();
  var lt = {}; table_('USERS').all().forEach(function (u) { if (isTestAddress_(u.email)) lt[u.user_id] = u; });
  var bks = table_('BOOKINGS').filter(function (b) { return lt[b.student_id]; });
  var live = bks.filter(function (b) { return isHolding_(b.status); });
  var rid = {}, dupRid = 0, slot = {}, dupSlot = 0, day = {}, overDay = 0, perDay = Number(cfg_('MAX_BOOKINGS_PER_DAY')) || 1;
  bks.forEach(function (b) { if (b.request_id) { var k = b.student_id + '|' + b.request_id + '|' + dateKey_(b.date) + '|' + b.slot; if (rid[k]) dupRid++; rid[k] = true; } });
  live.forEach(function (b) {
    var k = b.tutor_id + '|' + dateKey_(b.date) + '|' + b.slot; if (slot[k]) dupSlot++; slot[k] = true;
    if (!isConsuming_(b.status)) return;
    var d = b.student_id + '|' + dateKey_(b.date); day[d] = (day[d] || 0) + 1; if (day[d] === perDay + 1) overDay++;
  });
  var q = calendarQueueStatus_();
  return { students: Object.keys(lt).length, bookings: bks.length, live: live.length, cancelled: bks.length - live.length,
    duplicateRequest: dupRid, doubleBookedSlot: dupSlot, overPerDay: overDay, calendarPending: q.pending, calendarFailed: q.failed,
    metrics: metricsNow_().filter(function (r) { return /^api|_lock_|_client_/.test(r.fn); }) };
}

function menuLoadTestSeed(e) { requireOperator_(e);
  if (isProduction_()) { alert_('Chỉ dùng trên STAGING.'); return null; }
  if (!isOwnerUser_()) { alert_('Chỉ chủ file.'); return null; }
  var r = loadTestSeed_(100, 10, 14);
  alert_('Dữ liệu thử tải: thêm ' + r.students + ' học viên, ' + r.tutors + ' tutor, ' + r.slots + ' slot (14 ngày tới).\nEmail @loadtest.invalid không gửi thật.\n\nTiếp: menu "Thử tải: bật 2 giờ".');
  return r;
}
function menuLoadTestEnable(e) { requireOperator_(e);
  if (isProduction_()) { alert_('Chỉ dùng trên STAGING.'); return null; }
  if (!isOwnerUser_()) { alert_('Chỉ chủ file.'); return null; }
  var r = loadTestEnable_(2);
  alert_('Đã mở cổng thử tải tới ' + fmtDateTime_(r.until) + ' (giờ thật).\n\nKHOÁ (chép vào lệnh chạy, không gửi qua chat):\n' + r.secret + '\n\nLINK: ' + (r.url || 'chưa có WEBAPP_URL trong CONFIG') +
    '\n\nLưu ý: phải "Triển khai > Quản lý > Phiên bản mới" sau khi dán code 5G thì link /exec mới có doPost.');
  return r;
}
function menuLoadTestOff(e) { requireOperator_(e); loadTestDisable_(); logMenu_(e, 'LOADTEST_OFF', 'SYSTEM', '', ''); alert_('Đã đóng cổng thử tải.'); }
function menuLoadTestCheck(e) { requireOperator_(e);
  var r = loadTestCheck_();
  var bad = r.duplicateRequest + r.doubleBookedSlot + r.overPerDay;
  alert_('Kết quả thử tải\n\n' + r.students + ' học viên giả, ' + r.bookings + ' booking (' + r.live + ' còn, ' + r.cancelled + ' huỷ)\n' +
    'Trùng mã lần bấm: ' + r.duplicateRequest + '\nHai người cùng tutor cùng giờ: ' + r.doubleBookedSlot + '\nQuá số buổi mỗi ngày: ' + r.overPerDay + '\n' +
    'Calendar chờ tạo: ' + r.calendarPending + ', lỗi: ' + r.calendarFailed + '\n\n' + (bad ? 'CÓ LỖI DỮ LIỆU: gửi ảnh này cho Alex.' : 'Dữ liệu đúng luật.') + '\n\nSố đo giờ này:\n' +
    r.metrics.slice(0, 12).map(function (m) { return m.fn + ': ' + m.count + ' lượt, p95 ' + m.p95_ms + ' ms, bận ' + m.busy + ', lỗi ' + m.errors; }).join('\n'));
  return r;
}

// ── Log.gs ──
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

// ── MailTransport.gs ──
/**
 * MailTransport.gs · Đường gửi email cố định (chunk 5Q, thay MailFix)
 *
 * Chỗ DUY NHẤT trong code được gọi dịch vụ gửi thư và đọc hạn mức email (test U49 quét src/, gọi ở file khác là đỏ).
 * Mọi email vẫn đi qua sendMail_ (Notify.gs) và sendTpl_ (luật 19, 32).
 *
 * CONFIG MAIL_TRANSPORT:
 *   GMAILAPP (mặc định) = GmailApp.sendEmail, đúng cách MailFix đã chạy từ 22/10: thư có bản HTML kèm bản chữ thuần,
 *                         tên hiển thị MAIL_FROM_NAME, trả lời về ADMIN_EMAIL. Không bị trả về hàng loạt như MailApp.
 *   MAILAPP             = MailApp.sendEmail (cách cũ, dự phòng; thư từng bị trả về trên tên miền của trường).
 *   Gõ sai hoặc trống: dùng GMAILAPP.
 * Quyền: GmailApp dùng quyền gmail.send (đã có trong appsscript.json từ 5J). Google báo thiếu quyền khi gửi bằng GmailApp
 * thì thư đó tự gửi lại bằng MailApp (ghi MAIL_FALLBACK, báo admin), để email quan trọng không mất.
 * Hạn mức: Google tính chung mọi thư Apps Script gửi trong ngày; đọc bằng MailApp.getRemainingDailyQuota (GmailApp
 * không có hàm đọc hạn mức). Đọc lỗi thì trả -1 (không rõ).
 */

var MAIL_TRANSPORTS_ = ['GMAILAPP', 'MAILAPP'];
var MAIL_FALLBACK_NOTIFIED_ = false;
/** Đường gửi của thư gần nhất trong lượt chạy này (menu Kiểm tra gửi email hiện đường thật đã dùng, kể cả khi tự gửi lại). */
var LAST_MAIL_TRANSPORT_ = '';

function mailTransport_() {
  var m = ''; try { m = String(cfg_('MAIL_TRANSPORT') || '').trim().toUpperCase(); } catch (e) { }
  return MAIL_TRANSPORTS_.indexOf(m) === -1 ? 'GMAILAPP' : m;
}

/** Hạn mức email còn lại hôm nay (số người nhận). -1 = không đọc được. */
function mailBudget_() {
  try { var n = Number(MailApp.getRemainingDailyQuota()); return isNaN(n) ? -1 : n; } catch (e) { return -1; }
}

/** Bản chữ thuần từ HTML (thư có cả 2 bản ít bị coi là thư rác hơn). Chép từ MailFix. */
function mailPlainText_(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n\n')
    .replace(/<\/(td|th)>/gi, ' ')
    .replace(/<a\s[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d{1,6});/g, function (m, n) { var c = Number(n); return c > 0 && c < 65536 ? String.fromCharCode(c) : m; })
    .replace(/&amp;/g, '&')
    .split('\n').map(function (l) { return l.replace(/[ \t]+$/, ''); }).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isMailPermissionError_(e) {
  return /permission|authori[sz]|scope|quyền|không có quyền|not allowed to/i.test(String((e && e.message) || e));
}

/**
 * Gửi một thư. msg = { to, subject, htmlBody, name, replyTo, cc, bcc }. Ném lỗi khi Google từ chối (sendMail_ bắt và ghi MAIL_FAILED).
 * Trả tên đường đã gửi ('GMAILAPP' hoặc 'MAILAPP').
 */
function mailDeliver_(msg) {
  var to = String(msg.to || '').trim();
  if (!to) throw new Error('Thiếu người nhận email');
  var subject = String(msg.subject || '').replace(/[\r\n]+/g, ' ');
  var opts = {};
  ['htmlBody', 'name', 'replyTo', 'cc', 'bcc'].forEach(function (k) {
    if (msg[k] !== undefined && msg[k] !== null && String(msg[k]) !== '') opts[k] = msg[k];
  });
  var body = msg.body || (msg.htmlBody ? mailPlainText_(msg.htmlBody) : '');
  if (mailTransport_() === 'MAILAPP') {
    MailApp.sendEmail(Object.assign({ to: to, subject: subject, body: body }, opts));
    return (LAST_MAIL_TRANSPORT_ = 'MAILAPP');
  }
  try {
    GmailApp.sendEmail(to, subject, body, opts);
    return (LAST_MAIL_TRANSPORT_ = 'GMAILAPP');
  } catch (e) {
    if (!isMailPermissionError_(e)) throw e;
    // Thiếu quyền GmailApp (appsscript.json bị dán thiếu dòng gmail.send): gửi lại bằng MailApp để email quan trọng không mất.
    var gErr = String((e && e.message) || e);
    try { MailApp.sendEmail(Object.assign({ to: to, subject: subject, body: body }, opts)); }
    catch (e2) { throw new Error('GmailApp: ' + gErr + ' | MailApp: ' + String((e2 && e2.message) || e2)); }
    mailFallbackNotice_(to, gErr);
    return (LAST_MAIL_TRANSPORT_ = 'MAILAPP');
  }
}

/** Báo admin GmailApp thiếu quyền: tối đa 1 lần mỗi giờ (mỗi lượt chạy là một lần chạy mới, cờ trong bộ nhớ không đủ). */
function mailFallbackNotice_(to, err) {
  // Đặt dấu TRƯỚC khi báo: notify_ có thể gửi thư, thư đó lại tự gửi lại và gọi hàm này; dấu đã có nên dừng.
  try { var c = CacheService.getScriptCache(); if (c.get('mail_fb_notice')) return; c.put('mail_fb_notice', '1', 3600); }
  catch (x) { if (MAIL_FALLBACK_NOTIFIED_) return; MAIL_FALLBACK_NOTIFIED_ = true; }
  try { logActivity_('SYSTEM', 'MAIL_FALLBACK', 'MAIL', '', { to: to, error: String(err).substring(0, 300) }); } catch (x) { }
  try {
    // Không báo qua email (đường gửi đang hỏng; email đi bằng MailApp dễ bị trả về): chỉ ghi NOTIFICATIONS, như sendMail_.
    var r = notifyRule_('MAIL_FAILED'); if (r.channel === NOTIFY_CHANNEL.EMAIL) return;
    notify_('MAIL_FAILED', {
      message: 'GmailApp thiếu quyền, thư vừa gửi lại bằng MailApp (dễ bị trả về). Mở appsscript.json, kiểm dòng gmail.send, chạy menu Email → Kiểm tra gửi email để cấp quyền lại. Lỗi: ' + err,
      message_en: 'GmailApp lacks permission, the email was resent with MailApp (may bounce). Check the gmail.send line in appsscript.json, run the mail test menu to re-authorize. Error: ' + err
    });
  } catch (x) { }
}

// ── Maintenance.gs ──
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

// ── Marketing.gs ──
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
    return h ? '<div style="margin-top:18px;font-size:12px;color:#63635d">' + h + '</div>' : '';
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

// ── Metrics.gs ──
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

// ── Notifications.gs ──
/**
 * Notifications.gs · Thông báo cho admin theo mức độ (chunk 5B)
 *
 * Mọi sự kiện cần admin biết đều ghi 1 dòng vào tab NOTIFICATIONS (lưu lại để tra cứu, tô màu theo mức).
 * Kênh của từng sự kiện do admin chỉnh ở tab NOTIFY_RULES:
 *   EMAIL   gửi email ngay tới ADMIN_EMAIL (việc cần xử lý: huỷ, lỗi, chờ duyệt)
 *   DIGEST  gom vào 1 email tổng hợp lúc DIGEST_HOUR (việc bình thường: buổi hoàn thành, đổi tutor)
 *   LOG     chỉ ghi vào tab, không email
 * Email admin chỉ gửi tới ADMIN_EMAIL (một địa chỉ, hoặc nhóm admin@ trên Workspace), để không nhân hạn mức email.
 */

var DEFAULT_NOTIFY_RULES_ = {
  SYSTEM_ERROR: ['CRITICAL', 'EMAIL', 'Lỗi hệ thống (tối đa 1 email mỗi giờ cho cùng một lỗi)'],
  CALENDAR_FAILED: ['CRITICAL', 'EMAIL', 'Không tạo hoặc sửa được sự kiện Calendar, cần gửi link Meet tay'],
  // Chunk 5F: job đối soát mỗi giờ.
  DATA_INVARIANT: ['CRITICAL', 'EMAIL', 'Dữ liệu sai luật: hai học viên cùng một tutor cùng giờ, hoặc học viên quá số buổi mỗi ngày'],
  CALENDAR_LATE: ['WARNING', 'EMAIL', 'Buổi sắp diễn ra mà chưa có sự kiện Calendar (link Meet), gộp một email mỗi lần đối soát'],
  CALENDAR_BATCH_FAILED: ['CRITICAL', 'EMAIL', 'Cả lô tạo sự kiện Calendar lỗi ngay lần đầu (dịch vụ, lịch, hạn mức)'],
  // Chunk 5G
  SHEET_REMOVED: ['CRITICAL', 'EMAIL', 'Tab dữ liệu của hệ thống bị xoá hoặc đổi tên trong Sheets: hệ thống sẽ lỗi tới khi khôi phục'],
  PURGE_CHECK: ['CRITICAL', 'EMAIL', 'Lần bỏ dòng (lưu trữ, dọn) bị cắt và tab bị sửa tay sau đó: cần admin kiểm dòng trùng ở cuối tab'],
  ARCHIVE_FAILED: ['CRITICAL', 'EMAIL', 'Lưu trữ hằng tháng: đọc lại file lưu trữ thiếu dòng, đã dừng (không bỏ dòng nào khỏi DB)'],
  CALENDAR_NIGHTLY: ['INFO', 'LOG', 'Tổng kết lô Calendar đêm qua, không có vấn đề'],
  CALENDAR_NIGHTLY_PROBLEM: ['WARNING', 'EMAIL', 'Tổng kết lô Calendar đêm qua còn lỗi hoặc còn buổi sắp tới chưa có sự kiện'],
  NEW_REGISTRATION: ['WARNING', 'EMAIL', 'Có đăng ký hoặc gia hạn mới chờ duyệt'],
  TUTOR_CANCEL_REQUEST: ['WARNING', 'EMAIL', 'Tutor xin huỷ slot, cần duyệt trước giờ học'],
  STUDENT_CANCELLED: ['WARNING', 'EMAIL', 'Học viên huỷ buổi'],
  RESULT_TECH_ISSUE: ['WARNING', 'EMAIL', 'Tutor báo buổi học gặp vấn đề kỹ thuật (không trừ buổi, xem có tính lương không)'],
  RESULT_STUDENT_ABSENT: ['WARNING', 'DIGEST', 'Tutor báo học viên vắng (vẫn trừ buổi)'],
  TUTOR_NO_AVAILABILITY: ['WARNING', 'EMAIL', 'Quá hạn mở lịch (TUTOR_DEADLINE_AT) mà tutor chưa mở giờ nào cho tuần sau'],
  RESULT_COMPLETED: ['INFO', 'DIGEST', 'Tutor xác nhận buổi hoàn thành'],
  AUTO_COMPLETED: ['INFO', 'DIGEST', 'Bản cũ tới 8.1.0: buổi tự chuyển Hoàn thành. Từ 8.1.1 không còn (xem RESULT_OVERDUE, RESULT_NOT_COMPLETED)'],
  REASSIGNED: ['INFO', 'DIGEST', 'Buổi được đổi sang tutor khác'],
  TUTOR_CANCEL_AUTO_REJECTED: ['INFO', 'DIGEST', 'Yêu cầu huỷ của tutor tự bị từ chối vì admin chưa duyệt kịp'],
  BOOKED: ['INFO', 'LOG', 'Học viên đặt buổi'],
  ADMIN_CANCELLED: ['INFO', 'LOG', 'Admin huỷ buổi trên giao diện admin'],
  MAIL_FAILED: ['WARNING', 'DIGEST', 'Email gửi không thành công (hết hạn mức hoặc địa chỉ hỏng)'],
  // Chunk 5M: bù buổi, khoá gói
  COMP_EXTENDED: ['INFO', 'DIGEST', 'Gói học được cộng ngày bù (buổi lỗi phía trường), học viên đã nhận email'],
  COMP_ON_EXPIRED: ['WARNING', 'EMAIL', 'Buổi được bù thuộc gói đã hết hạn quá lâu hoặc gói sau đã chạy: hệ thống không tự cộng, admin cộng tay ở comp_days_admin'],
  COMP_RETRACT_BLOCKED: ['WARNING', 'EMAIL', 'Không rút ngày bù được vì học viên đã đặt buổi trong những ngày đó: huỷ các buổi ấy, hoặc giữ ngày bằng cách cộng vào comp_days_admin'],
  TRIAL_LEFT_UNUSED: ['WARNING', 'EMAIL', 'Học viên Trial còn lượt mà không còn ngày đặt được (đã dùng hết lần cộng 3 ngày): admin cộng tay nếu muốn'],
  COMP_QUEUE_CONFLICT: ['WARNING', 'EMAIL', 'Gói nối đuôi dời ngày nhưng có buổi không chuyển sang gói trước được (gói trước hết lượt)'],
  PACKAGE_EDIT_DENIED: ['WARNING', 'DIGEST', 'Có người sửa ô hệ thống của STUDENT_PACKAGES: đã trả lại giá trị cũ'],
  PACKAGE_HEALED: ['WARNING', 'EMAIL', 'Đối soát mỗi giờ thấy ngày gói lệch luật (dán đè, sắp xếp, sửa qua API): đã ghi lại giá trị đúng'],
  PACKAGE_ROW_MISSING: ['CRITICAL', 'EMAIL', 'Buổi học trỏ tới gói không còn trong STUDENT_PACKAGES (dòng gói bị xoá): khôi phục từ bản sao lưu đêm'],
  PACKAGE_PASTE_UNSAFE: ['CRITICAL', 'EMAIL', 'Ô hệ thống của STUDENT_PACKAGES bị dán đè mà không tự lành được (mã gói, học viên, ngày mua...): khôi phục từ bản sao lưu đêm'],
  BOOKING_OUT_OF_RANGE: ['WARNING', 'EMAIL', 'Ngày bắt đầu khoá sớm hơn làm buổi đã đặt nằm ngoài hạn gói: huỷ buổi hoặc cộng ngày ở comp_days_admin'],
  TRIAL_OVER_LIMIT: ['WARNING', 'EMAIL', 'Trial dùng quá số lượt sau khi đổi lỗi buổi kỹ thuật sang học viên: admin quyết định, hệ thống không tự huỷ'],
  // Chunk 5J (câu 29 đổi 01/11): báo đỏ trên trang quản trị, không email (đổi kênh ở tab NOTIFY_RULES nếu muốn).
  RESULT_OVERDUE: ['CRITICAL', 'LOG', 'Tutor quá RESULT_NOTICE_AFTER_HOURS giờ chưa chọn kết quả buổi: nhắc tutor trước khi buổi thành Không hoàn thành'],
  RESULT_NOT_COMPLETED: ['WARNING', 'DIGEST', 'Buổi thành Không hoàn thành vì tutor không chọn kết quả (không tính lương)'],
  // Chunk 5N: buổi kẹt Chờ đổi tutor (PENDING_REASSIGN) quá REASSIGN_STUCK_HOURS giờ: chưa có tutor dạy, admin phải đổi tutor hoặc huỷ.
  REASSIGN_STUCK: ['CRITICAL', 'EMAIL', 'Buổi kẹt ở Chờ đổi tutor quá REASSIGN_STUCK_HOURS giờ: chọn Đổi tutor hoặc Huỷ bởi admin ở cột admin_action'],
  TECH_MIGRATED: ['WARNING', 'EMAIL', 'Bản 8.1.0 chuyển buổi kỹ thuật cũ "Tính lương" sang Lỗi khách quan: admin xem lại từng buổi và chọn đúng lỗi']
};

var NOTIFY_RULES_CACHE_ = null;

/** Luật của một sự kiện: { level, channel }. Tab NOTIFY_RULES ghi đè mặc định; giá trị sai thì dùng mặc định. */
function notifyRule_(event) {
  if (!NOTIFY_RULES_CACHE_) {
    NOTIFY_RULES_CACHE_ = {};
    try { table_('NOTIFY_RULES').all().forEach(function (r) { NOTIFY_RULES_CACHE_[String(r.event).trim()] = r; }); } catch (e) { }
  }
  var d = DEFAULT_NOTIFY_RULES_[event] || ['INFO', 'LOG', ''], r = NOTIFY_RULES_CACHE_[event] || {};
  var level = String(r.level || '').trim().toUpperCase(), channel = String(r.channel || '').trim().toUpperCase();
  return { level: NOTIFY_LEVEL[level] ? level : d[0], channel: NOTIFY_CHANNEL[channel] ? channel : d[1] };
}

/** Link mở thẳng đúng tab và đúng dòng trong file Sheets (cho email admin và cột link của NOTIFICATIONS). */
function rowLink_(tableName, row) {
  try {
    var ss = dbSpreadsheet_(), sh = ss.getSheetByName(tableName);
    return ss.getUrl() + '#gid=' + sh.getSheetId() + (row ? '&range=A' + row : '');
  } catch (e) { return ''; }
}

/**
 * Ghi một thông báo và gửi theo kênh. info: { actor, student_id, tutor_id, entity, entity_id, message, link }.
 * emailFn (không bắt buộc): hàm gửi email riêng cho sự kiện này (ví dụ email duyệt đăng ký có chi tiết);
 * không có thì gửi email chung. Trả dòng NOTIFICATIONS đã ghi.
 */
function notify_(event, info, emailFn) {
  info = info || {};
  var rule = notifyRule_(event), now = getNow_(), holder = { row: null };
  var write = function () {
    holder.row = table_('NOTIFICATIONS').insert({
      notif_id: nextId_('NOTIFICATIONS'), time: now, level: rule.level, event: event, channel: rule.channel,
      actor: info.actor || 'SYSTEM', student_id: info.student_id || '', tutor_id: info.tutor_id || '',
      entity: info.entity || '', entity_id: info.entity_id || '', message: String(info.message || '').substring(0, 500), message_en: String(info.message_en || '').substring(0, 500),
      link: info.link || '', read: false
    });
    return holder.row;
  };
  var markEmailed = function () {
    if (!holder.row) return;
    var t = table_('NOTIFICATIONS'), r = t.byId(holder.row.notif_id);
    if (r) t.update(r, { emailed_at: getNow_() });
  };
  var sendEmail = function () {
    var sent = false;
    try { sent = emailFn ? emailFn() !== false : mailAdminNotice_(rule.level, event, info); } catch (e) { Logger.log('notify email lỗi: ' + e.message); }
    return sent;
  };
  // Tab NOTIFICATIONS chưa có (dán code mới nhưng chưa chạy menu 1): vẫn gửi email theo kênh, không làm hỏng việc đang làm.
  var safeWrite = function () { try { write(); } catch (e) { if (String(e.message) === BUSY_MESSAGE_) throw e; Logger.log('notify_ không ghi được NOTIFICATIONS: ' + e.message); } };
  var isEmail = rule.channel === NOTIFY_CHANNEL.EMAIL;
  if (DB_LOCK_DEPTH_) {
    // Trong khoá (chunk 5F): ghi dòng ngay, email gửi sau khi nhả khoá để không giữ khoá lúc chờ Gmail.
    safeWrite();
    if (isEmail) afterLock_(function () { if (sendEmail()) deferWrite_(markEmailed); });
  } else if (deferActive_()) {
    // Sau khi đã ghi xong việc chính (pha sau khoá): gom vào lần ghi cuối, không lấy khoá riêng.
    deferWrite_(safeWrite);
    if (isEmail && sendEmail()) deferWrite_(markEmailed);
  } else {
    try { withLock_(safeWrite); } catch (e) { if (String(e.message) === BUSY_MESSAGE_) throw e; }
    if (isEmail && sendEmail() && holder.row) withLock_(markEmailed);
  }
  return holder.row;
}

/** Email chung cho admin: mức, nội dung, nút mở đúng dòng trong Sheets (mẫu ADMIN_NOTICE). */
function mailAdminNotice_(level, event, info) {
  var tag = { CRITICAL: ['Khẩn', 'Urgent'], WARNING: ['Cần xử lý', 'Action needed'], INFO: ['Thông tin', 'Info'] }[level] || [level, level];
  return sendTpl_('ADMIN_NOTICE', adminEmails_().join(','), { tag: tag[0], tag_en: tag[1], message: String(info.message || event).substring(0, 300),
    message_en: String(info.message_en || info.message || event).substring(0, 300),
    event: event, time: fmtDateTime_(getNow_()), sheet_link: info.link || '' }, { kind: 'ADMIN_' + event });
}

/**
 * Email tổng hợp cuối ngày: mọi thông báo kênh DIGEST chưa tổng hợp. Gọi từ hourlyJob, 1 lần mỗi ngày từ DIGEST_HOUR.
 * Không có gì thì không gửi. Trả số dòng đã tổng hợp.
 */
function sendDailyDigestInLock_(now) {
  var t = table_('NOTIFICATIONS');
  var rows = t.filter(function (n) { return n.channel === NOTIFY_CHANNEL.DIGEST && !n.digest_at; });
  if (!rows.length) return 0;
  var order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  rows.sort(function (a, b) { return (order[a.level] - order[b.level]) || (new Date(a.time) - new Date(b.time)); });
  var count = {};
  rows.forEach(function (n) { count[n.event] = (count[n.event] || 0) + 1; });
  var summary = Object.keys(count).map(function (k) { return '<li>' + esc_(k) + ': <b>' + count[k] + '</b></li>'; }).join('');
  var list = rows.slice(0, 200).map(function (n) {
    return '<tr><td style="padding:4px 8px;white-space:nowrap">' + esc_(fmtDateTime_(new Date(n.time))) + '</td><td style="padding:4px 8px">' + esc_(n.level) + '</td><td style="padding:4px 8px">' + esc_(n.message) + (n.message_en ? '<br><span style="color:#63635d">' + esc_(n.message_en) + '</span>' : '') + '</td></tr>';   // chunk 5I: kèm câu tiếng Anh
  }).join('');
  var ok = sendTpl_('ADMIN_DIGEST', adminEmails_().join(','), { date: fmtDate_(now), count: rows.length, summary_html: '<ul>' + summary + '</ul>',
    table_html: '<table style="border-collapse:collapse;font-size:13px">' + list + '</table>' + (rows.length > 200 ? '<p>Còn ' + (rows.length - 200) + ' dòng, xem tab NOTIFICATIONS.</p>' : ''),
    sheet_link: rowLink_('NOTIFICATIONS') }, { kind: 'ADMIN_DIGEST' });
  if (ok) rows.forEach(function (n) { t.update(n, { digest_at: now }); });
  return ok ? rows.length : 0;
}

// ── Notify.gs ──
/**
 * Notify.gs · Email (v8, plan mục 4.9)
 *
 * Mọi email đi qua sendMail_():
 *   gửi qua mailDeliver_ (MailTransport.gs, mặc định GmailApp như MailFix cũ), tên hiển thị MAIL_FROM_NAME,
 *   trả lời về ADMIN_EMAIL (CLAUDE.md luật 19); MAIL_LOG ghi đường gửi (cột transport, chunk 5Q)
 *   ghi MAIL_LOG để đếm số email mỗi ngày
 *   ưu tiên: 'high' luôn gửi; 'low' (nhắc buổi, sắp hết hạn) bị tạm bỏ khi hạn mức còn lại thấp,
 *   để Gmail thường (khoảng 100 người nhận/ngày) vẫn đủ cho email quan trọng
 * Tiếng Việt cho học viên và admin, tiếng Anh cho tutor (câu 37).
 */

var MAIL_FAIL_NOTIFYING_ = false;
function sendMail_(to, subject, html, kind, priority, opts) {
  if (!to) throw new Error('Thiếu người nhận email: ' + kind);
  if (priority === 'low') {
    var remaining = mailBudget_();
    if (remaining >= 0 && remaining <= cfg_('MAIL_LOW_QUOTA_RESERVE')) {
      logActivity_('SYSTEM', 'MAIL_SKIPPED_LOW_QUOTA', 'MAIL', '', { to: to, kind: kind, remaining: remaining });
      return false;
    }
  }
  // Email gửi sau khi dữ liệu đã ghi (đặt lịch, huỷ...). Gửi lỗi (hết hạn mức, địa chỉ hỏng) thì ghi log và báo false,
  // không ném lỗi, để trang web không báo "có lỗi" cho một thao tác đã thành công.
  var transport = '';
  try {
    // Chunk 5G: địa chỉ thử tải (@loadtest.invalid, tên miền không bao giờ có thật) không gửi thật, nhưng vẫn ghi MAIL_LOG
    // như email thật để lượt thử tải đo đúng phần ghi Sheets.
    if (!isTestAddress_(to)) transport = mailDeliver_({ to: to, subject: subject, htmlBody: html, name: cfg_('MAIL_FROM_NAME'), replyTo: cfgList_('ADMIN_EMAIL')[0] || '' });
  } catch (e) {
    logActivity_('SYSTEM', 'MAIL_FAILED', 'MAIL', '', { to: to, kind: kind, error: String((e && e.message) || e) });
    if (!MAIL_FAIL_NOTIFYING_) {
      MAIL_FAIL_NOTIFYING_ = true;
      try { var r = notifyRule_('MAIL_FAILED'); if (r.channel !== NOTIFY_CHANNEL.EMAIL) notify_('MAIL_FAILED', { message: 'Không gửi được email ' + kind + ' tới ' + to + ': ' + String((e && e.message) || e), message_en: 'Could not send email ' + kind + ' to ' + to + ': ' + String((e && e.message) || e) }); } catch (x) { }
      MAIL_FAIL_NOTIFYING_ = false;
    }
    return false;
  }
  var logRow = { time: getNow_(), to: to, subject: subject, kind: kind, transport: transport };
  // Chunk 5H: email marketing tự ghi MAIL_LOG theo lô, có chống trùng (Marketing.gs).
  if (opts && opts.collect) { opts.collect.push(logRow); return true; }
  // Chunk 5F: trong khoá ghi luôn; sau khoá (pha gửi email của một lượt đặt, huỷ) gom vào lần ghi cuối, không lấy khoá riêng mỗi email.
  if (!DB_LOCK_DEPTH_ && deferActive_()) deferWrite_(function () { logAppend_('MAIL_LOG', logRow); });
  else logAppend_('MAIL_LOG', logRow);
  return true;
}

/**
 * Địa chỉ nhận email hệ thống cho admin: chỉ CONFIG ADMIN_EMAIL (chunk 5B, theo quyết định 13/10 của anh Chris).
 * Nên để 1 địa chỉ, hoặc nhóm admin@ trên Workspace (1 địa chỉ, Google tự chia cho thành viên).
 * Tài khoản role ADMIN trong USERS (admin dự phòng, nhân viên) có quyền thao tác nhưng KHÔNG nhận email.
 * Mỗi địa chỉ tính 1 vào hạn mức người nhận mỗi ngày của tài khoản chạy script.
 */
function adminEmails_() {
  var out = [];
  cfgList_('ADMIN_EMAIL').forEach(function (e) { e = String(e || '').trim().toLowerCase(); if (e && out.indexOf(e) === -1) out.push(e); });
  return out;
}

function esc_(s) {
  return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function portalUrl_(page) { var u = cfg_('WEBAPP_URL') || cfg_('SCHOOL_SITE_URL'); return u + (page ? (u.indexOf('?') === -1 ? '?' : '&') + 'page=' + page : ''); }

/** Khung email dùng chung, có chân trang liên hệ Zalo và điện thoại admin (câu 42). */
function emailWrap_(title, inner, lang) {
  var en = lang === 'en';
  var zalo = cfg_('ADMIN_ZALO_URL');
  var contact = [];
  if (zalo) contact.push('<a href="' + esc_(zalo) + '" style="color:#0068ff;text-decoration:none;font-weight:600">' + (lang === 'bi' ? 'Nhắn Zalo admin · Message admin on Zalo' : en ? 'Message admin on Zalo' : 'Nhắn Zalo admin') + '</a>');
  // Thiết kế 5O (05/11): đen trắng, gạch vàng thương hiệu #ffc933 dưới đầu trang; ứng dụng thư không hỗ trợ CSS thì vẫn là bản phẳng đọc được.
  return '<div style="background:#f6f6f3;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#141414">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ececea">' +
    '<div style="background:#141414;color:#fff;padding:18px 22px;font-size:18px;font-weight:700;letter-spacing:.3px;border-bottom:3px solid #ffc933">' + esc_(cfg_('SCHOOL_NAME')) + '</div>' +
    '<div style="padding:22px">' +
    '<h2 style="margin:0 0 14px;font-size:19px;color:#141414">' + esc_(title) + '</h2>' + inner + '</div>' +
    '<div style="padding:14px 22px;background:#f6f6f3;font-size:13px;color:#63635d;border-top:1px solid #ececea">' +
    (contact.length ? contact.join(' &nbsp;·&nbsp; ') + '<br>' : '') +
    '<a href="' + esc_(cfg_('SCHOOL_SITE_URL')) + '" style="color:#63635d">' + esc_(cfg_('SCHOOL_SITE_URL')) + '</a></div></div></div>';
}
function btn_(href, label) {
  return '<p style="margin:18px 0"><a href="' + esc_(href) + '" style="background:#141414;color:#fff;padding:11px 20px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block">' + esc_(label) + '</a></p>';
}
function lessonLineVi_(b, extra) {
  return '<li style="margin:6px 0"><b>' + esc_(fmtDayVi_(b.date)) + '</b> · ' + esc_(slotLabel_(b.slot)) + (extra ? ' · ' + extra : '') + '</li>';
}
function lessonLineEn_(b, extra) {
  return '<li style="margin:6px 0"><b>' + esc_(fmtDayEn_(b.date)) + '</b> · ' + esc_(slotLabel_(b.slot)) + (extra ? ' · ' + extra : '') + '</li>';
}
/** Link Meet trong email. Chưa có (sự kiện Calendar đang chờ hàng đợi, chunk 5F): nói rõ link đến cùng lời mời lịch. */
function meetA_(link, lang, when) {
  if (link) return '<a href="' + esc_(link) + '">Google Meet</a>';
  if (when) return lang === 'en' ? 'Meet link comes with the Google Calendar invite (around ' + esc_(when) + ')' : 'link Meet đến cùng lời mời Google Calendar (khoảng ' + esc_(when) + ')';
  return lang === 'en' ? 'Meet link comes with the Google Calendar invite' : 'link Meet đến cùng lời mời Google Calendar';
}
function inviteWhenSafe_(b) { try { return calendarInviteWhen_(b, getNow_()); } catch (e) { return ''; } }

// ── Dựng sẵn khối HTML cho mẫu email (danh sách buổi học) ──

function lessonsHtml_(items, lang) {
  return '<ul style="padding-left:18px;margin:0 0 12px">' + items.map(function (it) { return (lang === 'en' ? lessonLineEn_ : lessonLineVi_)(it.booking, it[lang] || ''); }).join('') + '</ul>';
}
function isTutorUser_(u) { return u && u.role === 'TUTOR'; }
function bookingRuleText_(lang) {
  var lead = bookingLeadHours_(), k = cfg_('CANCEL_CUTOFF_HOUR') + ':00';
  if (lang === 'en') return lead < 0 ? 'book tomorrow\'s lessons before ' + cfg_('BOOKING_CUTOFF_HOUR') + ':00 today; cancel before ' + k + ' the day before.' : 'book at least ' + lead + ' hour(s) before the lesson; cancel before ' + k + ' the day before.';
  return lead < 0 ? 'đặt buổi cho ngày mai trước ' + cfg_('BOOKING_CUTOFF_HOUR') + ':00 hôm nay; huỷ cũng phải trước ' + k + ' hôm trước.' : 'đặt trước giờ học ít nhất ' + lead + ' tiếng; huỷ phải trước ' + k + ' hôm trước.';
}

// ── Đăng ký ──

function mailRegistrationReceived_(reg, def) {
  return sendTpl_('REG_RECEIVED', reg.email, { name: reg.name, package: def.name || reg.package_code, package_en: def.name_en || def.name || reg.package_code, transfer_code: reg.transfer_code }, { kind: 'REG_RECEIVED' });
}
function mailAdminNewRegistration_(reg, def) {
  return sendTpl_('ADMIN_NEW_REG', adminEmails_().join(','), {
    kind: reg.kind === 'RENEW' ? 'Gia hạn' : 'Đăng ký mới', kind_en: reg.kind === 'RENEW' ? 'Renewal' : 'New student',
    name: reg.name, email: reg.email, phone: reg.phone ? phoneDisplay_(reg.phone) : '', package: def.name || reg.package_code, package_en: def.name_en || def.name || reg.package_code,
    price: Number(def.price_vnd || 0).toLocaleString('vi-VN') + 'đ', transfer_code: reg.transfer_code, screenshot_url: reg.screenshot_url,
    sheet_link: rowLink_('REGISTRATIONS', reg._row)
  }, { kind: 'ADMIN_NEW_REG' });
}
function mailWelcome_(user, def, loginUrl) {
  return sendTpl_('WELCOME', user.email, { name: user.name, package: def.name || def.code, package_en: def.name_en || def.name || def.code, rule: bookingRuleText_('vi'), rule_en: bookingRuleText_('en'),
    login_url: loginUrl || portalUrl_('login'), link_note: linkUseText_(false, user), link_note_en: linkUseText_(true, user) }, { kind: 'WELCOME' });
}
function mailRegistrationRejected_(reg, note) {
  return sendTpl_('REG_REJECTED', reg.email, { name: reg.name, note: note ? ': ' + note : '' }, { kind: 'REG_REJECTED' });
}

// ── Đặt và huỷ ──

function mailBookingSummary_(student, results) {
  var ok = results.filter(function (r) { return r.ok; }), bad = results.filter(function (r) { return !r.ok; });
  var failed = function (lang) {
    if (!bad.length) return '';
    return '<p style="margin:0 0 6px">' + (lang === 'en' ? 'Not booked:' : 'Các buổi chưa đặt được:') + '</p><ul style="padding-left:18px;margin:0 0 12px">' +
      bad.map(function (r) { return '<li>' + esc_(r.date) + ' ' + esc_(r.slot) + ': ' + esc_(reasonText_(r.reason, lang === 'en' ? 'en' : 'vi')) + '</li>'; }).join('') + '</ul>';
  };
  var items = ok.map(function (r) { var w = r.meetLink ? '' : inviteWhenSafe_(r._booking); return { booking: r._booking, vi: 'Tutor ' + esc_(r.tutorName) + ' · ' + meetA_(r.meetLink, 'vi', w), en: 'Tutor ' + esc_(r.tutorName) + ' · ' + meetA_(r.meetLink, 'en', w) }; });
  var vars = { name: student.name, count: ok.length, lessons_html_vi: lessonsHtml_(items, 'vi'), lessons_html_en: lessonsHtml_(items, 'en'),
    failed_html_vi: failed('vi'), failed_html_en: failed('en'), portal_url: portalUrl_('student'),
    cancel_rule: 'Huỷ buổi trước ' + cfg_('CANCEL_CUTOFF_HOUR') + ':00 hôm trước trong mục "Lịch của tôi".', cancel_rule_en: 'Cancel before ' + cfg_('CANCEL_CUTOFF_HOUR') + ':00 the day before in "My lessons".' };
  vars.lessons_html = vars.lessons_html_vi; vars.failed_html = vars.failed_html_vi;
  return sendTpl_(ok.length ? 'BOOKING_CONFIRM' : 'BOOKING_NONE', student.email, vars, { kind: 'BOOKING_CONFIRM' });
}
function mailTutorNewLessons_(tutor, items) {
  var list = items.map(function (it) {
    var who = esc_(it.student.name) + (it.student.level ? ' (' + esc_(it.student.level) + ')' : '') + ' · ';
    var w = it.booking.meet_link ? '' : inviteWhenSafe_(it.booking);
    return { booking: it.booking, vi: 'Học viên: ' + who + meetA_(it.booking.meet_link, 'vi', w), en: 'Student: ' + who + meetA_(it.booking.meet_link, 'en', w) };
  });
  return sendTpl_('TUTOR_NEW', tutor.email, { name: tutor.name, count: items.length, s: items.length > 1 ? 's' : '',
    lessons_html_vi: lessonsHtml_(list, 'vi'), lessons_html_en: lessonsHtml_(list, 'en'), portal_url: portalUrl_('tutor') }, { enFirst: true, kind: 'TUTOR_NEW' });
}
function mailCancelled_(booking, student, tutor, byWhom) {
  var reason = { STUDENT: ['bạn đã huỷ', 'you cancelled'], ADMIN: ['admin đã huỷ', 'admin cancelled it'], TUTOR: ['tutor không thể dạy và không có tutor thay', 'the tutor cannot teach and no other tutor is free'], TUTOR_LOCK: ['tutor không thể dạy và không có tutor thay', 'the tutor cannot teach and no other tutor is free'] }[byWhom] || ['đã huỷ', 'cancelled'];
  // Chunk 5M: admin huỷ từ CANCEL_CUTOFF_HOUR hôm trước (học viên xin huỷ muộn): buổi vẫn được tính (câu 12, BL46).
  if (booking.status === BOOKING_STATUS.CANCELLED_LATE) { var hh = cfg_('CANCEL_CUTOFF_HOUR') + ':00'; reason = ['admin đã huỷ theo yêu cầu huỷ muộn (từ ' + hh + ' hôm trước), buổi vẫn được tính là đã học', 'admin cancelled it on a late request (from ' + hh + ' the day before), so the lesson is still counted']; }
  var one = [{ booking: booking }];
  var rebook = byWhom === 'TUTOR' || byWhom === 'TUTOR_LOCK';
  sendTpl_('CANCEL_STUDENT', student.email, { name: student.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot,
    lesson_html_vi: lessonsHtml_(one, 'vi'), lesson_html_en: lessonsHtml_(one, 'en'), reason: reason[0], reason_en: reason[1],
    rebook_html_vi: rebook ? '<p>Buổi này không bị trừ. Bạn có thể đặt lại khung giờ khác.</p>' + btn_(portalUrl_('student'), 'Đặt lại') : '',
    rebook_html_en: rebook ? '<p>This lesson is not counted. You can book another time.</p>' + btn_(portalUrl_('student'), 'Book again') : '' }, { kind: 'CANCEL_STUDENT' });
  if (tutor && byWhom !== 'TUTOR_LOCK') {   // 5L: tutor bị khoá không nhận thư huỷ
    var withStudent = [{ booking: booking, vi: 'Học viên: ' + esc_(student.name), en: 'Student: ' + esc_(student.name) }];
    sendTpl_('CANCEL_TUTOR', tutor.email, { name: tutor.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot,
      lesson_html_vi: lessonsHtml_(withStudent, 'vi'), lesson_html_en: lessonsHtml_(withStudent, 'en') }, { enFirst: true, kind: 'CANCEL_TUTOR' });
  }
}
function mailReassigned_(booking, student, oldTutor, newTutor, opts) {
  var item = [{ booking: booking, vi: 'Tutor mới: <b>' + esc_(newTutor.name) + '</b> · ' + meetA_(booking.meet_link, 'vi'), en: 'New tutor: <b>' + esc_(newTutor.name) + '</b> · ' + meetA_(booking.meet_link, 'en') }];
  sendTpl_('REASSIGN_STUDENT', student.email, { name: student.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot, new_tutor: newTutor.name,
    lesson_html_vi: lessonsHtml_(item, 'vi'), lesson_html_en: lessonsHtml_(item, 'en') }, { kind: 'REASSIGN_STUDENT' });
  var plain = [{ booking: booking }];
  if (!(opts && opts.skipOld)) sendTpl_('REASSIGN_OLD', oldTutor.email, { name: oldTutor.name, date: fmtDayVi_(booking.date), date_en: fmtDayEn_(booking.date), slot: booking.slot,
    lesson_html_vi: lessonsHtml_(plain, 'vi'), lesson_html_en: lessonsHtml_(plain, 'en') }, { enFirst: true, kind: 'REASSIGN_OLD' });
  mailTutorNewLessons_(newTutor, [{ booking: booking, student: student }]);
}
function mailAdminTutorCancelRequest_(tutor, avail, booking, student) {
  var D = TUTOR_CANCEL_DECISION;
  return sendTpl_('ADMIN_TUTOR_CANCEL', adminEmails_().join(','), {
    tutor: tutor.name, lesson: fmtDayVi_(avail.date) + ' ' + slotLabel_(avail.slot), lesson_en: fmtDayEn_(avail.date) + ' ' + slotLabel_(avail.slot),
    // Chunk 5J: hạn theo TUTOR_DEADLINE_AT (không còn viết cứng "Chủ nhật").
    booked_note: booking ? 'Slot đã có học viên: ' + (student ? student.name : booking.student_id) + '.' : 'Slot chưa có học viên (xin huỷ sau hạn ' + fmtDowTimeVi_(tutorWeekDeadline_(avail.date)) + ').',
    booked_note_en: booking ? 'A student is booked: ' + (student ? student.name : booking.student_id) + '.' : 'No student booked yet (request after the ' + fmtDowTimeEn_(tutorWeekDeadline_(avail.date)) + ' deadline).',
    options: '"' + D.AUTO + '", "' + D.ASSIGN + '" (ghi mã tutor ở cột admin_note trước), "' + D.CANCEL + '", "' + D.REJECT + '"',
    hours: cfg_('TUTOR_CANCEL_DECIDE_BEFORE_HOURS'), sheet_link: rowLink_('AVAILABILITY', avail._row)
  }, { kind: 'ADMIN_TUTOR_CANCEL' });
}
function mailTutorDecision_(tutor, avail, approved) {
  return sendTpl_(approved ? 'TUTOR_DECISION_APPROVED' : 'TUTOR_DECISION_REJECTED', tutor.email, { name: tutor.name, date: fmtDayVi_(avail.date), date_en: fmtDayEn_(avail.date),
    slot: avail.slot, lesson: fmtDayVi_(avail.date) + ' ' + slotLabel_(avail.slot), lesson_en: fmtDayEn_(avail.date) + ' ' + slotLabel_(avail.slot) }, { enFirst: true, kind: 'TUTOR_DECISION' });
}

// ── Nhắc, hết hạn ──

function mailLessonReminder_(booking, person, isTutor, other) {
  if (isTutor) {
    var it = [{ booking: booking, vi: 'Học viên: ' + esc_(other.name) + ' · ' + meetA_(booking.meet_link, 'vi'), en: 'Student: ' + esc_(other.name) + ' · ' + meetA_(booking.meet_link, 'en') }];
    return sendTpl_('REMINDER_TUTOR', person.email, { name: person.name, slot: booking.slot, lesson_html_vi: lessonsHtml_(it, 'vi'), lesson_html_en: lessonsHtml_(it, 'en') },
      { enFirst: true, kind: 'REMINDER_TUTOR', priority: 'low' });
  }
  var st = [{ booking: booking, vi: 'Tutor ' + esc_(other.name), en: 'Tutor ' + esc_(other.name) }];
  return sendTpl_('REMINDER_STUDENT', person.email, { name: person.name, slot: booking.slot, lesson_html_vi: lessonsHtml_(st, 'vi'), lesson_html_en: lessonsHtml_(st, 'en'),
    meet_url: booking.meet_link || portalUrl_('student') }, { kind: 'REMINDER_STUDENT', priority: 'low' });
}
/** Email nhắc buổi sáng: các buổi hôm nay của một người. */
function mailMorningReminder_(person, bookings, isTutor) {
  if (!person || !person.email) return false;
  var items = bookings.map(function (b) {
    var other = isTutor ? userById_(b.student_id) : userById_(b.tutor_id), nm = esc_(other ? other.name : ''), m = b.meet_link ? ' · ' + meetA_(b.meet_link) : '';
    return { booking: b, vi: (isTutor ? 'Học viên: ' : 'Tutor: ') + nm + m, en: (isTutor ? 'Student: ' : 'Tutor: ') + nm + m };
  });
  return sendTpl_(isTutor ? 'MORNING_TUTOR' : 'MORNING_STUDENT', person.email, { name: person.name, count: bookings.length, s: bookings.length > 1 ? 's' : '',
    lessons_html_vi: lessonsHtml_(items, 'vi'), lessons_html_en: lessonsHtml_(items, 'en') }, { enFirst: isTutor, kind: isTutor ? 'MORNING_TUTOR' : 'MORNING_STUDENT', priority: 'low' });
}

function mailExpirySoon_(student, sp, def) {
  return sendTpl_('EXPIRY_SOON', student.email, { name: student.name, package: def.name || def.code, package_en: def.name_en || def.name || def.code, end_date: fmtDate_(sp.end_date), renew_url: portalUrl_('renew') },
    { kind: 'EXPIRY_SOON', priority: 'low' });
}
function mailTutorRemindAvailability_(tutor, weekStart, deadline) {
  var dl = deadline || tutorWeekDeadline_(weekStart);
  return sendTpl_('TUTOR_REMIND', tutor.email, { name: tutor.name, week: fmtDate_(weekStart), deadline: fmtDowTimeVi_(dl), deadline_en: fmtDowTimeEn_(dl), portal_url: portalUrl_('tutor') },
    { enFirst: true, kind: 'TUTOR_REMIND' });
}
function mailAdminError_(subject, detail) {
  // Ghi thông báo CRITICAL (tab NOTIFICATIONS) rồi email theo luật SYSTEM_ERROR; cùng một lỗi chỉ email 1 lần mỗi giờ.
  var send = function () {
    var cache = null, key = 'adminerr:' + String(subject).substring(0, 200);
    try { cache = CacheService.getScriptCache(); if (cache.get(key)) { Logger.log('Bỏ qua email lỗi lặp lại: ' + subject); return false; } } catch (x) { cache = null; }
    var sent = sendTpl_('ADMIN_ERROR', adminEmails_().join(','), { subject: subject, detail_html: '<pre style="white-space:pre-wrap">' + esc_(detail) + '</pre>' }, { kind: 'ADMIN_ERROR' });
    if (sent && cache) cache.put(key, '1', 3600); // chỉ đánh dấu khi đã gửi được, gửi hỏng thì lần sau thử lại
    return sent;
  };
  // Cùng một lỗi trong 1 giờ: không ghi thêm dòng, không lấy khoá (một người cố tình gửi dữ liệu lạ không làm đầy NOTIFICATIONS).
  try { if (CacheService.getScriptCache().get('adminerr:' + String(subject).substring(0, 200))) { Logger.log('Bỏ qua lỗi lặp lại: ' + subject); return; } } catch (x) { }
  try { notify_('SYSTEM_ERROR', { message: subject + ': ' + String(detail).split('\n')[0], message_en: 'System error · ' + subject + ': ' + String(detail).split('\n')[0] }, send); }
  catch (e) { try { send(); } catch (x) { } } // tab NOTIFICATIONS chưa có hoặc hệ thống bận: vẫn email
}

// ── Chunk 5I: kiểm tra đường gửi email và hạn mức ──

/** Tài khoản đang gửi email (chủ script, người triển khai web app). */
function mailSender_() { try { return String(Session.getEffectiveUser().getEmail() || ''); } catch (e) { return ''; } }
/**
 * Số người nhận đã gửi thật trong 24 giờ qua theo MAIL_LOG (soát 5I A4: Google tính hạn mức theo 24 giờ trượt, không theo 0 giờ;
 * bỏ địa chỉ thử tải vì không gửi thật). Chỉ là ước tính: thư do dự án khác của cùng tài khoản gửi không có ở đây.
 */
function mailSentToday_() {
  // Vòng 2 N6: MAIL_LOG ghi theo giờ giả lập; đang giả lập giờ (STAGING) thì không ước tính được.
  if (Math.abs(getNow_().getTime() - realNowMs_()) > 300000) return null;
  var from = realNowMs_() - 24 * 3600000, n = 0;
  table_('MAIL_LOG').all().forEach(function (m) {
    var t = m.time instanceof Date ? m.time : new Date(m.time);
    if (isNaN(t.getTime()) || t.getTime() < from) return;
    n += String(m.to || '').split(',').filter(function (x) { return x.trim() && !isTestAddress_(x.trim()); }).length;
  });
  return n;
}
/**
 * Hàm thuần: giải thích hạn mức email. remaining = mailBudget_() (MailTransport.gs); sent = đã gửi hôm nay; sender = tài khoản gửi.
 * Google ghi cho Apps Script: Gmail thường 100 người nhận mỗi ngày, Workspace 1.500, nhưng tài khoản Workspace dùng thử có giới hạn
 * thêm và chỉ tự tăng khi tổ chức đã trả tổng cộng 100 USD và đã qua 60 ngày kể từ lúc đó.
 */
function mailQuotaInfo_(remaining, sent, sender) {
  var unknown = sent === null || sent === undefined;
  remaining = Number(remaining) || 0; sent = Number(sent) || 0;
  var limit = remaining + sent, gmail = /@(gmail|googlemail)\.com$/i.test(String(sender || '')), lines = [], warnings = [];
  if (unknown && !gmail) {
    lines.push('Email còn gửi được hôm nay: ' + remaining + ' người nhận (tài khoản gửi ' + (sender || 'không rõ') + '). Đang giả lập giờ (SIM_NOW) nên không ước tính được hạn mức ngày; tắt giả lập để xem chẩn đoán.');
    return { limit: 0, kind: 'UNKNOWN', lines: lines, warnings: warnings };
  }
  var kind = gmail ? 'GMAIL' : limit <= 150 ? 'WORKSPACE_LIMITED' : 'WORKSPACE';
  lines.push('Email còn gửi được hôm nay: ' + remaining + ' người nhận (24 giờ qua đã gửi khoảng ' + sent + ', hạn mức ước tính ' + limit + ' mỗi ngày, tài khoản gửi ' + (sender || 'không rõ') + ')');
  if (kind === 'WORKSPACE_LIMITED') warnings.push('Hạn mức email ước tính khoảng ' + limit + ' người nhận mỗi ngày dù là Workspace: nhiều khả năng tài khoản đang ở mức dùng thử của Google (Apps Script ghi 1.500 cho Workspace, tài khoản dùng thử bị giới hạn thêm). Kiểm ở admin.google.com, mục Thanh toán. Sau khi chuyển từ dùng thử sang trả phí, hạn mức tự tăng khi tổ chức đã trả tổng cộng 100 USD và qua 60 ngày (trang Gmail của Google ghi có thể tới 75 ngày). Code không đổi được con số này.');
  if (kind === 'GMAIL') warnings.push('Tài khoản gửi là Gmail thường: hạn mức cố định 100 người nhận mỗi ngày.');
  var mres = 0, lres = 0; try { mres = Number(cfg_('MARKETING_QUOTA_RESERVE')) || 0; lres = Number(cfg_('MAIL_LOW_QUOTA_RESERVE')) || 0; } catch (e) { }
  if (limit && mres >= limit) warnings.push('Email marketing sẽ không gửi được: MARKETING_QUOTA_RESERVE (' + mres + ') không nhỏ hơn hạn mức ngày (' + limit + ').');
  if (limit && lres * 4 >= limit) warnings.push('MAIL_LOW_QUOTA_RESERVE (' + lres + ') chiếm phần lớn hạn mức ' + limit + ': email nhắc buổi sẽ bị bỏ sớm.');
  return { limit: limit, kind: kind, lines: lines, warnings: warnings };
}
/** Gửi một email kiểm tra có mã. Trả { ok, to, code, sender, before, after, time }. */
function mailTest_(to, e) {
  // e: sự kiện menu (lấy email người bấm) hoặc chuỗi email người làm (test).
  var ev = typeof e === 'string' ? { user: { getEmail: function () { return e; } } } : e;
  var sender = mailSender_(), before = -1, after = -1, now = new Date(realNowMs_());   // giờ thật: tìm trong nhật ký giao thư của Google theo giờ này
  to = String(to || '').trim() || sender;
  if (!isEmail_(to)) return { ok: false, error: 'địa chỉ không hợp lệ: ' + to };
  var code = 'MT' + Utilities.formatDate(now, APP.TIMEZONE, 'ddHHmmss');
  // Vòng 2 N5: mẫu tắt thì nói đúng nguyên nhân, không báo "Google từ chối".
  var tpl = emailTemplate_('MAIL_TEST'); if (!tpl || !tpl.active) return { ok: false, error: 'mẫu email MAIL_TEST đang tắt (tab EMAIL_TEMPLATES, cột active). Bật lại rồi thử lại.' };
  before = mailBudget_(); LAST_MAIL_TRANSPORT_ = '';
  var ok = sendTpl_('MAIL_TEST', to, { code: code, time: fmtDateTime_(now), sender: sender }, { kind: 'MAIL_TEST' });
  after = mailBudget_();
  // Thư đã gửi: ghi nhật ký qua logMenu_ (khoá bận thì vào hàng chờ), không để lỗi khoá làm menu báo sai rồi bị bấm gửi lại.
  logMenu_(ev, 'MAIL_TEST', 'MAIL', to, JSON.stringify({ code: code, ok: !!ok, quota: before + ' → ' + after }));
  return { ok: ok, to: to, code: code, sender: sender, before: before, after: after, time: fmtDateTime_(now), transport: LAST_MAIL_TRANSPORT_ || mailTransport_() };
}
function menuMailTest(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), sender = mailSender_();
  var res = ui.prompt('Kiểm tra gửi email', 'Nhập địa chỉ nhận thử, nên là Gmail cá nhân hoặc email của tutor, học viên đang không nhận được thư.\nĐể trống: gửi tới ' + sender, ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var r = mailTest_(res.getResponseText(), e);
  if (!r.ok && r.error) { alert_('Không gửi: ' + r.error); return; }
  alert_((r.ok ? 'Google đã NHẬN thư' : 'Google TỪ CHỐI thư (xem ACTIVITY_LOG, MAIL_FAILED)') + ' · mã ' + r.code + '\n' +
    'Từ ' + r.sender + ' tới ' + r.to + ' lúc ' + r.time + ', đường gửi ' + r.transport + (r.transport !== mailTransport_() ? ' (GmailApp thiếu quyền, đã tự gửi lại bằng MailApp: kiểm appsscript.json)' : '') + '. Hạn mức còn: ' + r.before + ' → ' + r.after + '.\n\n' +
    'Hạn mức bị trừ chỉ có nghĩa là Google đã nhận thư để gửi, KHÔNG có nghĩa là thư đã vào hộp thư người nhận.\n\n' +
    '1. Mở hộp thư ' + r.to + ', tìm mã ' + r.code + ' ở cả Thư rác (Spam), Quảng cáo, Tất cả thư.\n' +
    '2. Hộp thư ' + r.sender + ' có thư "Mail Delivery Subsystem" thì mở ra đọc lý do bị trả lại (thường là địa chỉ sai, hoặc thiếu SPF, DKIM: lỗi 5.7.26).\n' +
    '3. admin.google.com → Menu → Báo cáo (Reporting) → Tìm kiếm nhật ký email (Email log search), link thẳng admin.google.com/ac/emaillogsearch. Người gửi ' + r.sender + ', người nhận ' + r.to + ', hôm nay. Google trả kết quả tìm sau 1 phút tới 1 giờ. Đọc trạng thái: Delivered (đã giao, tìm trong Thư rác), Marked spam, Bounced (bị trả lại, bấm xem lý do), Dropped, In progress.\n' +
    '4. Xác thực tên miền: DKIM của Workspace phải tự bật (admin.google.com → Ứng dụng → Google Workspace → Gmail → Xác thực email, bấm Bắt đầu xác thực). Thư đã tới thì mở ba chấm → Hiển thị bản gốc: SPF, DKIM, DMARC phải PASS. Công cụ toolbox.googleapps.com/apps/checkmx kiểm MX, SPF và DKIM (nhập google ở ô DKIM selector).');
}

// ── Packages.gs ──
/**
 * Packages.gs · Luật gói học, viết thành hàm thuần (v8, câu 1 đến 8 và 45)
 *
 * Không đọc Sheets ở đây. Mọi hàm nhận dữ liệu và trả kết quả, để test bằng Node.
 *
 * Dạng dữ liệu:
 *   def (một dòng PACKAGES):      { code, type: 'DAYS' | 'SESSIONS', days, sessions }
 *   sp  (một dòng STUDENT_PACKAGES): { sp_id, package_code, status, start_date, end_date, start_source,
 *                                      sessions_total, suspended_days, purchased_at }
 *   bk  (một dòng BOOKINGS):      { sp_id, date, status }
 *
 * Hai kiểu ngày bắt đầu (start_source):
 *   BOOKING  ngày bắt đầu = ngày học của buổi sớm nhất đang trừ buổi (câu 1). Huỷ buổi đó thì tính lại (câu 1, B11, B12).
 *   FIXED    ngày bắt đầu cố định: gói nối tiếp (câu 6), gói tự kích hoạt sau 30 ngày (câu 3), gói đã chạy từ trước.
 */

/** Số ngày hiệu lực thực tế = số ngày gói + số ngày được cộng bù do tạm khoá (câu 7). */
function pkgSpanDays_(sp, def) { return Number(def.days || 0) + Number(sp.suspended_days || 0); }

/** Số buổi tối đa: Trial và gói cũ có giới hạn; gói 2 tuần, 1 tháng không giới hạn (câu 8). 0 nghĩa là không giới hạn. */
function pkgSessionLimit_(sp, def) {
  var n = Number(sp.sessions_total || 0);
  if (n > 0) return n;
  return def.type === 'SESSIONS' ? Number(def.sessions || 0) : 0;
}

/** Buổi trừ lượt của gói: đang giữ chỗ, đã học, học viên vắng, huỷ muộn, kỹ thuật lỗi học viên (chunk 5M). */
function spConsumingBookings_(sp, bookings) {
  return bookings.filter(function (b) { return String(b.sp_id) === String(sp.sp_id) && bookingDeducts_(b); });
}

/**
 * Khoảng hiệu lực của gói, có tính thêm các ngày dự định đặt (extraDates).
 * Trả: { unbounded: true } cho gói tính buổi; { open: true } cho gói chưa có buổi nào; hoặc { start, end }.
 */
function pkgWindow_(sp, def, bookings, extraDates) {
  if (def.type === 'SESSIONS') return { unbounded: true };
  // FIXED (nối đuôi, tự kích hoạt) và LOCKED (đã khoá ở buổi làm mốc, chunk 5M): ngày bắt đầu cố định, hạn theo ô end_date.
  if ((sp.start_source === 'FIXED' || sp.start_source === 'LOCKED') && sp.start_date) {
    return { start: sp.start_date, end: sp.end_date || addDays_(sp.start_date, pkgSpanDays_(sp, def) - 1) };
  }
  var dates = spConsumingBookings_(sp, bookings).map(function (b) { return b.date; }).concat(extraDates || []);
  if (!dates.length) return { open: true };
  var start = dates.reduce(function (a, b) { return b < a ? b : a; });
  // Chunk 5M (soát 01/11 C): ngày bù admin cộng tay cũng nằm trong hạn khi ngày bắt đầu còn tạm tính.
  return { start: start, end: addDays_(start, pkgSpanDays_(sp, def) + intOr0_(sp.comp_days_admin) - 1), dates: dates };
}

/**
 * Gói này có nhận thêm buổi vào ngày `date` không.
 * pendingDates: các ngày đã được chấp nhận cho gói này trong cùng lần gửi (đặt nhiều ngày một lần).
 */
function pkgCheckDate_(sp, def, bookings, date, pendingDates) {
  if (sp.status === PKG_STATUS.EXPIRED) return { ok: false, reason: REASONS.EXPIRED };
  var pend = pendingDates || [];
  if (def.type !== 'SESSIONS') {
    var w = pkgWindow_(sp, def, bookings, pend.concat([date]));
    if (!w.open) {
      if (w.dates) {
        // Ngày bắt đầu tính theo buổi sớm nhất: mọi buổi phải nằm trong (số ngày gói) kể từ buổi sớm nhất.
        var maxD = w.dates.reduce(function (a, b) { return b > a ? b : a; });
        if (maxD > w.end) return { ok: false, reason: REASONS.OUT_OF_RANGE };
      } else if (date < w.start || date > w.end) {
        return { ok: false, reason: REASONS.OUT_OF_RANGE };
      }
    }
  }
  var limit = pkgSessionLimit_(sp, def);
  if (limit > 0) {
    var used = spConsumingBookings_(sp, bookings).length + pend.length;
    if (used >= limit) return { ok: false, reason: REASONS.NO_SESSIONS };
  }
  return { ok: true };
}

/**
 * Chọn gói dùng cho ngày `date` trong các gói của một học viên.
 * pendingBySp: { sp_id: [Date, ...] } các ngày vừa chấp nhận trong cùng lần gửi.
 * Trả { ok: true, sp } hoặc { ok: false, reason } với thứ tự ưu tiên lý do:
 *   NO_SESSIONS > OUT_OF_RANGE > EXPIRED > NO_PACKAGE
 */
function resolvePackageForDate_(sps, defsByCode, bookings, date, pendingBySp) {
  var pend = pendingBySp || {};
  var ordered = sps.slice().sort(function (a, b) {
    var ka = a.start_date || a.purchased_at || new Date(8640000000000000);
    var kb = b.start_date || b.purchased_at || new Date(8640000000000000);
    return ka - kb;
  });
  var reasons = [];
  for (var i = 0; i < ordered.length; i++) {
    var sp = ordered[i], def = defsByCode[sp.package_code];
    if (!def) continue;
    var r = pkgCheckDate_(sp, def, bookings, date, pend[sp.sp_id] || []);
    if (r.ok) return { ok: true, sp: sp };
    reasons.push(r.reason);
  }
  var order = [REASONS.NO_SESSIONS, REASONS.OUT_OF_RANGE, REASONS.EXPIRED];
  for (var j = 0; j < order.length; j++) if (reasons.indexOf(order[j]) !== -1) return { ok: false, reason: order[j] };
  return { ok: false, reason: REASONS.NO_PACKAGE };
}

/**
 * Sau khi đặt hoặc huỷ buổi: tính lại trạng thái và ngày của gói kiểu BOOKING.
 * Trả patch để ghi xuống STUDENT_PACKAGES, hoặc null nếu không đổi.
 */
function pkgRecomputeAfterChange_(sp, def, bookings) {
  if (def.type === 'SESSIONS' || sp.start_source === 'FIXED' || sp.start_source === 'LOCKED' || sp.status === PKG_STATUS.EXPIRED) return null;
  var w = pkgWindow_(sp, def, bookings, []);
  var patch;
  if (w.open) patch = { status: PKG_STATUS.INACTIVE, start_date: '', end_date: '', start_source: '' };
  else patch = { status: PKG_STATUS.ACTIVE, start_date: w.start, end_date: w.end, start_source: 'BOOKING' };
  var same = String(sp.status) === String(patch.status) &&
    sameOrBothEmpty_(sp.start_date, patch.start_date) && sameOrBothEmpty_(sp.end_date, patch.end_date);
  return same ? null : patch;
}
function sameOrBothEmpty_(a, b) {
  if (!a && !b) return true;
  return a instanceof Date && b instanceof Date && sameDate_(a, b);
}

/**
 * Chuyển trạng thái hằng ngày (dailyJob):
 *   INACTIVE quá N ngày từ ngày mua, chưa có buổi nào: tự ACTIVE từ hôm nay (câu 3)
 *   QUEUED đến ngày bắt đầu: ACTIVE (câu 6)
 *   Gói theo ngày đã qua ngày kết thúc: EXPIRED
 */
function pkgDailyTransition_(sp, def, bookings, today, autoActivateDays, opts) {
  if (def.type === 'SESSIONS') return null;
  // Chunk 5M: học viên đang tạm khoá thì gói không đổi trạng thái (không hết hạn khi đang khoá; mở khoá cộng đủ ngày).
  if (opts && opts.suspended) return null;
  var t = toMidnight_(today);
  if (sp.status === PKG_STATUS.INACTIVE) {
    var hasBooking = spConsumingBookings_(sp, bookings).length > 0;
    // Chunk 5M: đếm N ngày từ ngày muộn hơn giữa ngày mua và ngày của buổi lỗi phía trường gần nhất của gói này.
    var base = sp.purchased_at ? toMidnight_(new Date(sp.purchased_at)) : null;
    bookings.forEach(function (b) { if (String(b.sp_id) === String(sp.sp_id) && b.date && bookingCompensable_(b) && (!base || b.date > base)) base = toMidnight_(b.date); });
    if (!hasBooking && base && diffDays_(base, t) >= autoActivateDays) {
      var span = pkgSpanDays_(sp, def) + intOr0_(sp.comp_days_admin);
      return { status: PKG_STATUS.ACTIVE, start_date: t, end_date: addDays_(t, span - 1), start_source: 'FIXED', start_date_locked: t };
    }
    return null;
  }
  if (sp.status === PKG_STATUS.QUEUED && sp.start_date && t >= sp.start_date) {
    if (sp.end_date && t > sp.end_date) return { status: PKG_STATUS.EXPIRED };
    return { status: PKG_STATUS.ACTIVE };
  }
  if (sp.status === PKG_STATUS.ACTIVE && sp.end_date && t > sp.end_date) return { status: PKG_STATUS.EXPIRED };
  return null;
}

/**
 * Gói mới được duyệt khi học viên đã có gói: nối tiếp sau gói đang chạy (câu 6).
 * Trả { status, start_date, end_date, start_source } cho gói mới.
 */
function pkgPlanNewPurchase_(existingSps, defsByCode, newDef, today) {
  if (newDef.type === 'SESSIONS') return { status: PKG_STATUS.ACTIVE, start_date: '', end_date: '', start_source: '' };
  var t = toMidnight_(today), lastEnd = null;
  existingSps.forEach(function (sp) {
    var d = defsByCode[sp.package_code];
    if (!d || d.type === 'SESSIONS' || sp.status === PKG_STATUS.EXPIRED) return;
    if ((sp.status === PKG_STATUS.ACTIVE || sp.status === PKG_STATUS.QUEUED) && sp.end_date && sp.end_date >= t) {
      if (!lastEnd || sp.end_date > lastEnd) lastEnd = sp.end_date;
    }
  });
  if (lastEnd) {
    var start = addDays_(lastEnd, 1);
    return { status: PKG_STATUS.QUEUED, start_date: start, end_date: addDays_(start, Number(newDef.days) - 1), start_source: 'FIXED', start_date_locked: start };
  }
  return { status: PKG_STATUS.INACTIVE, start_date: '', end_date: '', start_source: '' };
}

/** Mở khoá sau tạm khoá: cộng số ngày bị khoá vào hạn các gói theo ngày còn hiệu lực (câu 7). */
function pkgUnsuspendPatch_(sp, def, suspendedFrom, unsuspendOn) {
  if (def.type === 'SESSIONS' || sp.status === PKG_STATUS.EXPIRED) return null;
  var days = Math.max(0, diffDays_(suspendedFrom, unsuspendOn));
  if (!days) return null;
  // Chunk 5M (soát 01/11 B): gói QUEUED chưa chạy ngày nào nên chỉ DỜI cả khoảng (start, start_date_locked, end), không cộng
  // suspended_days (cộng nữa thì công thức hạn tính hai lần, và ngày đã khoá cũ kéo gói về chồng lên gói trước).
  if (sp.status === PKG_STATUS.QUEUED && sp.start_date) {
    var q = { start_date: addDays_(sp.start_date, days), start_date_locked: addDays_(sp.start_date, days) };
    if (sp.end_date) q.end_date = addDays_(sp.end_date, days);
    return q;
  }
  var patch = { suspended_days: Number(sp.suspended_days || 0) + days };
  if (sp.end_date) patch.end_date = addDays_(sp.end_date, days);
  return patch;
}

/** Thông tin gói để hiển thị trên cổng học viên. */
function pkgSummary_(sp, def, bookings) {
  var limit = pkgSessionLimit_(sp, def);
  var used = spConsumingBookings_(sp, bookings).length;
  var src = String(sp.start_source || ''), comp = intOr0_(sp.comp_days) + intOr0_(sp.comp_days_admin);
  return {
    sp_id: sp.sp_id, code: sp.package_code, name: def.name || sp.package_code, nameEn: def.name_en || def.name || sp.package_code, status: sp.status,
    start: sp.start_date ? dateKey_(sp.start_date) : '', end: sp.end_date ? dateKey_(sp.end_date) : '',
    sessionLimit: limit, sessionsUsed: used, sessionsLeft: limit > 0 ? Math.max(0, limit - used) : null,
    // Chunk 5M: ngày bắt đầu còn tạm tính (chưa có buổi hoàn chỉnh đầu tiên) và tổng ngày bù đã cộng.
    startPending: def.type !== 'SESSIONS' && src === 'BOOKING', compDays: comp > 0 ? comp : 0
  };
}

// ══ Chunk 5M: khoá ngày bắt đầu, bù ngày (plan/TU_VAN_BU_BUOI.md, BL40, BL42, BL46, BL47, BL48) ══

function intOr0_(v) { var n = Number(v); return v === '' || v === null || v === undefined || isNaN(n) ? 0 : Math.round(n); }
function hasCompValue_(v) { return v !== '' && v !== null && v !== undefined && !isNaN(Number(v)); }

/** Lỗi của buổi kỹ thuật. Dòng cũ chưa có tech_fault: payroll_override TRUE là lỗi khách quan (có lương, không trừ), còn lại lỗi tutor. */
function techFault_(b) {
  var f = String(b.tech_fault || '').trim().toUpperCase();
  if (TECH_FAULT[f]) return f;
  return (b.payroll_override === true || String(b.payroll_override).toUpperCase() === 'TRUE') ? TECH_FAULT.OBJECTIVE : TECH_FAULT.TUTOR;
}
/** Buổi trừ lượt và giữ ngày bắt đầu tạm tính: CONSUMING_STATUSES, huỷ muộn, kỹ thuật lỗi học viên. */
function bookingDeducts_(b) {
  if (isConsuming_(b.status) || b.status === BOOKING_STATUS.CANCELLED_LATE) return true;
  return b.status === BOOKING_STATUS.TECH_ISSUE && techFault_(b) === TECH_FAULT.STUDENT;
}
/** Buổi làm mốc khoá ngày bắt đầu: học xong, học viên vắng, huỷ muộn, kỹ thuật lỗi học viên.
 *  Không hoàn thành (5J) KHÔNG làm mốc và chưa là kết quả cuối: vẫn trừ lượt, giữ ngày tạm tính, nhưng chờ admin làm rõ mới khoá
 *  (soát 5J H1: khoá theo buổi chưa chắc đã diễn ra thì admin sửa sau sẽ làm học viên mất ngày). */
function bookingAnchors_(b) {
  var s = String(b.status);
  return s === 'COMPLETED' || s === 'STUDENT_ABSENT' || s === 'CANCELLED_LATE' || (s === 'TECH_ISSUE' && techFault_(b) === TECH_FAULT.STUDENT);
}
/** Buổi lỗi phía trường: không trừ lượt, được bù ngày khi ngày bắt đầu đã khoá. */
function bookingCompensable_(b) {
  if (COMP_STATUSES_.indexOf(String(b.status)) !== -1) return true;
  return b.status === BOOKING_STATUS.TECH_ISSUE && techFault_(b) !== TECH_FAULT.STUDENT;
}
/** Buổi đã có kết quả cuối. Kỹ thuật mà admin chưa chọn lỗi: cuối khi đã quá techHours giờ (giữ mặc định lỗi tutor). */
function bookingFinal_(b, now, techHours) {
  if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN || b.status === BOOKING_STATUS.NOT_COMPLETED) return false;
  if (b.status === BOOKING_STATUS.TECH_ISSUE && !b.tech_decided_at) {
    var from = b.result_at ? new Date(b.result_at) : null;
    if (!from || isNaN(from.getTime())) from = slotEnd_(b.date, b.slot);
    return now.getTime() - from.getTime() >= Number(techHours) * 3600000;
  }
  return true;
}
function bySlotStart_(a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); }

/**
 * Buổi làm mốc để khoá ngày bắt đầu: buổi làm mốc sớm nhất, và mọi buổi sớm hơn của gói đã có kết quả cuối.
 * Chưa đủ điều kiện thì trả null (chờ, ví dụ buổi 14/10 23:30 chưa xác nhận mà buổi 15/10 đã Hoàn thành).
 */
function pkgLockAnchor_(sp, bookings, now, techHours) {
  var mine = bookings.filter(function (b) { return String(b.sp_id) === String(sp.sp_id) && b.date instanceof Date; });
  var anchors = mine.filter(bookingAnchors_).sort(bySlotStart_);
  if (!anchors.length) return null;
  var a = anchors[0], at = slotStart_(a.date, a.slot).getTime();
  var waiting = mine.some(function (b) { return b !== a && slotStart_(b.date, b.slot).getTime() < at && !bookingFinal_(b, now, techHours); });
  return waiting ? null : a;
}

/**
 * Ngày đặt được đầu tiên F tính từ lúc now (BL48: kịp hạn đặt, không bảo đảm có giờ trống).
 * Luật 15:00 hôm trước: trước 15:00 là ngày mai, từ 15:00 là ngày kia. BOOKING_LEAD_HOURS > 0: ngày đầu còn giờ học cuối sau mốc đặt trước.
 */
function firstBookableDay_(now) {
  var t = toMidnight_(now), lead = bookingLeadHours_(), last = cfg_('SLOT_LAST');
  for (var i = 0; i < 4; i++) {
    var d = addDays_(t, i);
    if (lead < 0 ? now < bookingDeadline_(d) : now < bookingDeadlineFor_(d, last)) return d;
  }
  return addDays_(t, 2);
}

/** Bối cảnh tính gói, đọc CONFIG một lần. */
function compCtx_(now) {
  return { now: now, today: toMidnight_(now), F: firstBookableDay_(now), techHours: Number(cfg_('TECH_DECIDE_HOURS')),
    per: Number(cfg_('COMP_DAYS_PER_SESSION')), trialPer: Number(cfg_('COMP_DAYS_TRIAL')), trialMax: Number(cfg_('COMP_TRIAL_MAX_DAYS')),
    reopenDays: Number(cfg_('COMP_REOPEN_DAYS')) };
}

/**
 * Hàm thuần: tính lại một gói theo ngày (chunk 5M). Không ghi gì; trả việc cần ghi.
 *   sp, def:   dòng STUDENT_PACKAGES và PACKAGES
 *   bookings:  BOOKINGS của học viên (lọc theo sp_id bên trong)
 *   ctx:       compCtx_ cộng thêm:
 *     next:        { end, dates } của gói QUEUED nối đuôi ngay sau gói này (để chặn rút bù đẩy buổi của gói sau ra ngoài hạn)
 *     nextStarted: gói nối đuôi đã bắt đầu chạy (không tự mở lại gói này)
 * Trả { patch (null nếu không đổi), bookings: [{ b, patch }], events: [{ type, b, days, blockers }], end, start, locked }
 *
 * Luật:
 *   1. Ngày bắt đầu tạm tính = buổi trừ lượt sớm nhất (như cũ). Khoá ở buổi làm mốc (pkgLockAnchor_); FIXED (nối đuôi, tự kích hoạt)
 *      coi như đã khoá. Khoá rồi không bao giờ đổi; lấy lại từ start_date_locked (tự lành khi ô start_date bị sửa).
 *   2. Sau khi khoá: mỗi buổi lỗi phía trường có ngày học từ ngày bắt đầu trở đi được ghi comp_days MỘT lần
 *      (Trial: COMP_DAYS_TRIAL tới trần COMP_TRIAL_MAX_DAYS; gói khác COMP_DAYS_PER_SESSION), cộng phần để còn kịp đặt:
 *      hạn mới = max(hạn, F − 1) + số ngày. Buổi hết được bù (đổi lỗi kỹ thuật sang học viên) thì rút, trừ khi học viên đã đặt
 *      buổi trong phần ngày sắp bị rút (báo admin).
 *   3. Hạn = ngày bắt đầu + số ngày gói + suspended_days + comp_days + comp_days_admin − 1.
 *   4. Gói EXPIRED: buổi bù trong hạn gói, hết hạn chưa quá COMP_REOPEN_DAYS, gói sau chưa chạy: tự cộng và mở lại. Ngoài ra ghi 0 ngày,
 *      báo admin cộng tay (COMP_ON_EXPIRED).
 */
function pkgPlan_(sp, def, bookings, ctx) {
  var out = { patch: null, bookings: [], events: [], end: null, start: null, locked: false };
  if (def.type === 'SESSIONS') return out;
  var now = ctx.now, today = ctx.today, mine = bookings.filter(function (b) { return String(b.sp_id) === String(sp.sp_id) && b.date instanceof Date; });
  var src = String(sp.start_source || ''), want = {}, locked = src === 'LOCKED' || src === 'FIXED', start = null;
  var expired = sp.status === PKG_STATUS.EXPIRED;
  if (locked) start = sp.start_date_locked instanceof Date ? sp.start_date_locked : (sp.start_date instanceof Date ? sp.start_date : null);
  if (locked && !start) locked = false;   // dữ liệu hỏng (không còn ngày nào): tính như tạm
  if (!locked) {
    if (expired) return out;   // gói kiểu cũ đã hết hạn: không đụng
    var a = pkgLockAnchor_(sp, mine, now, ctx.techHours);
    if (a) { locked = true; start = toMidnight_(a.date); want.start_source = 'LOCKED'; want.start_date_locked = start; want.start_locked_at = now; want.start_booking_id = a.booking_id; }
  } else {
    want.start_source = src;
    if (!(sp.start_date_locked instanceof Date) || !sameDate_(sp.start_date_locked, start)) want.start_date_locked = start;
  }
  if (!locked) {
    var dates = mine.filter(bookingDeducts_).map(function (b) { return b.date; });
    if (!dates.length) {
      want = { status: PKG_STATUS.INACTIVE, start_date: '', end_date: '', start_source: '' };
      out.patch = pkgDiff_(sp, want);
      return out;
    }
    start = dates.reduce(function (x, y) { return y < x ? y : x; });
    want.start_source = 'BOOKING';
  }
  out.start = start; out.locked = locked;
  var limit = pkgSessionLimit_(sp, def), trial = limit > 0, susp = intOr0_(sp.suspended_days), compAdmin = intOr0_(sp.comp_days_admin);
  var resum = 0, baseUsed = 0;
  mine.forEach(function (b) { if (hasCompValue_(b.comp_days)) { resum += intOr0_(b.comp_days); baseUsed += intOr0_(b.comp_days) - intOr0_(b.comp_gap); } });
  // Gói đã hết hạn: buổi cũ có thể đã chuyển sang file lưu trữ, nên giữ tổng đã ghi và chỉ cộng trừ phần đổi lần này.
  var compSum = expired && hasCompValue_(sp.comp_days) ? intOr0_(sp.comp_days) : resum;
  var endOf = function () { return addDays_(start, Number(def.days || 0) + susp + compSum + compAdmin - 1); };
  // ctx.prevEnd: hạn trước lần admin sửa tay (ô end_date đã mang giá trị mới khi tính lại).
  var oldEnd = ctx.prevEnd instanceof Date ? ctx.prevEnd : (sp.end_date instanceof Date ? sp.end_date : null);
  if (locked) {
    var sorted = mine.slice().sort(bySlotStart_);
    // Rút trước (buổi hết được bù), rồi mới cộng (buổi mới được bù), theo thứ tự ngày học.
    sorted.forEach(function (b) {
      if (!hasCompValue_(b.comp_days) || (bookingCompensable_(b) && b.date >= start)) return;
      var d = intOr0_(b.comp_days);
      if (d > 0) {
        var newEnd = addDays_(endOf(), -d);
        var blockers = mine.filter(function (o) { return o !== b && bookingDeducts_(o) && o.date > newEnd; }).map(function (o) { return o.booking_id; });
        if (ctx.next) (ctx.next.dates || []).forEach(function (x) { if (x.date > addDays_(ctx.next.end, -d)) blockers.push(x.booking_id); });
        if (blockers.length) { out.events.push({ type: 'COMP_RETRACT_BLOCKED', b: b, days: d, blockers: blockers }); return; }
        compSum -= d; baseUsed -= d - intOr0_(b.comp_gap);
        out.events.push({ type: 'COMP_RETRACTED', b: b, days: d });
      }
      out.bookings.push({ b: b, patch: { comp_days: '', comp_gap: '' } });
    });
    sorted.forEach(function (b) {
      if (hasCompValue_(b.comp_days) || !bookingCompensable_(b) || !(b.date >= start)) return;
      var base = trial ? Math.max(0, Math.min(ctx.trialPer, ctx.trialMax - baseUsed)) : ctx.per, cur = endOf();
      if (expired && (diffDays_(cur, today) > ctx.reopenDays || ctx.nextStarted || b.date > cur)) {
        out.bookings.push({ b: b, patch: { comp_days: 0, comp_gap: 0 } });
        // Soát 01/11 F: gói nối đuôi đã chạy (gia hạn bình thường) mà buổi bù trong hạn, chưa quá COMP_REOPEN_DAYS: ngày bù chuyển
        // sang gói sau (comp_days_admin của gói sau), để kết quả không phụ thuộc admin bấm trước hay sau 06:00.
        var toNext = ctx.nextStarted && base > 0 && !(diffDays_(cur, today) > ctx.reopenDays) && !(b.date > cur);
        out.events.push({ type: toNext ? 'COMP_TO_NEXT' : 'COMP_ON_EXPIRED', b: b, days: base });
        return;
      }
      var gap = 0, total = 0;
      if (base > 0) { var fm1 = addDays_(ctx.F, -1); gap = fm1 > cur ? diffDays_(cur, fm1) : 0; total = base + gap; }
      compSum += total; baseUsed += base;
      out.bookings.push({ b: b, patch: { comp_days: total, comp_gap: gap } });
      out.events.push({ type: total > 0 ? 'COMP_EXTENDED' : 'COMP_NO_DAYS', b: b, days: total });
    });
  }
  var end = endOf(), status = sp.status;
  // Trạng thái suy từ ngày (soát 01/11 G: ô status bị dán đè thì tự lành). dailyJob vẫn là nơi chuyển ACTIVE sang EXPIRED, QUEUED sang ACTIVE.
  // Soát vòng 2 (5): gói nối đuôi (FIXED) chưa tới ngày bắt đầu luôn là QUEUED, xét trước mọi luật khác (dán đè INACTIVE, EXPIRED).
  if (locked && src === 'FIXED' && start > today) status = PKG_STATUS.QUEUED;
  else if (!locked || status === PKG_STATUS.INACTIVE) status = PKG_STATUS.ACTIVE;
  else if (expired && end >= today) status = PKG_STATUS.ACTIVE;   // mở lại (bù, admin sửa hạn), hoặc EXPIRED bị dán đè lên gói còn hạn
  else if (!PKG_STATUS[status]) status = end < today && !ctx.suspended ? PKG_STATUS.EXPIRED : (src === 'FIXED' && start > today ? PKG_STATUS.QUEUED : PKG_STATUS.ACTIVE);
  else if (status === PKG_STATUS.ACTIVE && src === 'FIXED' && start > today) status = PKG_STATUS.QUEUED;
  want.status = status; want.start_date = start; want.end_date = end; want.comp_days = compSum;
  if (oldEnd && !sameDate_(oldEnd, end) && sp.expiry_notice_at) want.expiry_notice_at = '';
  out.end = end;
  // Soát 01/11 D: ngày bắt đầu khoá sớm hơn (đổi lỗi kỹ thuật sang học viên trước khi khoá) làm buổi đã đặt rơi ra ngoài hạn: báo admin.
  var outside = mine.filter(function (b) { return (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) && (b.date > end || b.date < start); });
  if (outside.length) out.events.push({ type: 'BOOKING_OUT_OF_RANGE', b: null, days: 0, blockers: outside.map(function (b) { return b.booking_id; }) });
  // Soát 01/11 E (plan mục 2.5): Trial vượt số lượt sau khi đổi lỗi kỹ thuật sang học viên: báo admin, không tự huỷ buổi nào.
  if (trial && spConsumingBookings_(sp, mine).length > limit) out.events.push({ type: 'TRIAL_OVER_LIMIT', b: null, days: spConsumingBookings_(sp, mine).length - limit });
  if (trial && out.events.some(function (e) { return e.type === 'COMP_NO_DAYS'; })) {
    var left = limit - spConsumingBookings_(sp, mine).length;
    if (left > 0 && end < ctx.F) out.events.push({ type: 'TRIAL_LEFT_UNUSED', b: null, days: left });
  }
  out.patch = pkgDiff_(sp, want);
  return out;
}
/** Chỉ các ô thật sự đổi. Ô ngày so theo ngày; số so theo giá trị; trống và 0 của comp_days coi như nhau. */
function pkgDiff_(sp, want) {
  var p = {}, n = 0;
  Object.keys(want).forEach(function (k) {
    var a = sp[k], b = want[k], same;
    if (k === 'start_locked_at') same = false;   // chỉ có trong want khi vừa khoá
    else if (a instanceof Date || b instanceof Date) same = a instanceof Date && b instanceof Date ? sameDate_(a, b) : !a && !b;
    else if (k === 'comp_days') same = intOr0_(a) === intOr0_(b);
    else same = String(a === null || a === undefined ? '' : a) === String(b === null || b === undefined ? '' : b);
    if (!same) { p[k] = b; n++; }
  });
  return n ? p : null;
}

/**
 * Gói QUEUED nối đuôi: gói trước đổi hạn từ oldEnd sang newEnd thì dời ngày bắt đầu (Q7). Trả bản sao gói đã dời, hoặc null.
 * Chỉ dời gói có start_date đúng bằng oldEnd + 1 (nối liền); gói đã chạy (ACTIVE) không dời.
 */
function pkgShiftQueued_(sp, oldEnd, newEnd) {
  if (sp.status !== PKG_STATUS.QUEUED || !(sp.start_date instanceof Date) || !oldEnd || !newEnd) return null;
  if (!sameDate_(addDays_(oldEnd, 1), sp.start_date)) return null;
  var d = diffDays_(oldEnd, newEnd);
  if (!d) return null;
  var copy = Object.assign({}, sp), s = addDays_(sp.start_date, d);
  copy.start_date = s; copy.start_date_locked = s;
  return copy;
}

// ── Chunk 5L: kiểm tab PACKAGES, admin thêm gói ──
var PKG_TYPES_ = ['DAYS', 'SESSIONS'];
var PKG_CODE_RE_ = /^[A-Z0-9_]{2,20}$/;

/** Lỗi của một dòng gói (hàm thuần). Trả mảng câu lỗi, rỗng là hợp lệ. */
function packageRowErrors_(p) {
  var e = [], code = String(p.code || '').trim(), type = String(p.type || 'DAYS').trim().toUpperCase();
  var num = function (v) { return v === '' || v === null || v === undefined ? NaN : Number(v); };
  if (String(p.code || '') !== code) e.push('mã "' + p.code + '" có khoảng trắng thừa ở đầu hoặc cuối');
  if (!PKG_CODE_RE_.test(code)) e.push('mã "' + code + '" phải là 2 đến 20 ký tự A đến Z, 0 đến 9 hoặc _ (chữ in hoa, không dấu, không khoảng trắng)');
  if (!String(p.name || '').trim()) e.push('thiếu tên tiếng Việt (cột name)');
  if (PKG_TYPES_.indexOf(type) === -1) e.push('kiểu "' + p.type + '" phải là DAYS (theo ngày) hoặc SESSIONS (theo buổi)');
  if (type === 'DAYS' && !(Math.floor(num(p.days)) === num(p.days) && num(p.days) > 0)) e.push('gói theo ngày cần số ngày (cột days) là số nguyên lớn hơn 0');
  if (type === 'SESSIONS' && !(Math.floor(num(p.sessions)) === num(p.sessions) && num(p.sessions) > 0)) e.push('gói theo buổi cần số buổi (cột sessions) là số nguyên lớn hơn 0');
  if (p.sessions !== '' && p.sessions !== null && p.sessions !== undefined && !(num(p.sessions) >= 0)) e.push('số buổi (cột sessions) phải là số');
  if (!(num(p.price_vnd === '' ? 0 : p.price_vnd) >= 0)) e.push('giá (cột price_vnd) phải là số từ 0 trở lên');
  return e;
}

/**
 * Kiểm cả tab PACKAGES (hàm thuần, menu 2). Mã trùng: phần đặt lịch dùng dòng CUỐI (pkgDefs_), menu 1 dùng dòng ĐẦU, nên
 * báo đỏ kèm dòng đang có hiệu lực. Trả { errors, warnings, duplicates: { code: [số hàng] } }.
 */
function packageIssues_(rows) {
  var errors = [], warnings = [], seen = {};
  rows.forEach(function (p) {
    var code = String(p.code || '').trim();
    (seen[code] = seen[code] || []).push(p._row);
    packageRowErrors_(p).forEach(function (m) { errors.push('PACKAGES dòng ' + p._row + ' (' + (code || 'trống') + '): ' + m); });
    var type = String(p.type || 'DAYS').trim().toUpperCase();
    if (code === 'TRIAL' && type === 'DAYS' && !(Number(p.sessions) > 0)) warnings.push('Gói TRIAL không có số buổi (cột sessions): học viên Trial đặt không giới hạn buổi trong hạn gói');
    if (coerceCfg_(p.active, true) && !String(p.name_en || '').trim()) warnings.push('Gói ' + code + ' chưa có tên tiếng Anh (cột name_en): trang tiếng Anh hiện tên tiếng Việt');
  });
  var dup = {};
  Object.keys(seen).forEach(function (c) {
    if (seen[c].length < 2) return;
    dup[c] = seen[c];
    errors.push('Mã gói ' + c + ' trùng ở các dòng ' + seen[c].join(', ') + ': đặt lịch dùng dòng ' + seen[c][seen[c].length - 1] + ', menu 1 dùng dòng ' + seen[c][0] + '. Xoá dòng thừa; trong lúc trùng, trang đăng ký không nhận gói này');
  });
  return { errors: errors, warnings: warnings, duplicates: dup };
}

/** Mã gói đang trùng hoặc dòng gói sai (không cho đăng ký). */
function brokenPackageCodes_() {
  var rows = table_('PACKAGES').all(), out = {}, seen = {};
  rows.forEach(function (p) { var c = String(p.code || '').trim(); seen[c] = (seen[c] || 0) + 1; if (packageRowErrors_(p).length) { out[c] = true; out[String(p.code)] = true; } });
  // Soát 5L L9: mã có khoảng trắng thừa: chặn cả mã gõ thừa lẫn mã sạch tới khi admin sửa.
  rows.forEach(function (p) { if (seen[String(p.code || '').trim()] > 1) out[String(p.code)] = true; });
  Object.keys(seen).forEach(function (c) { if (seen[c] > 1) out[c] = true; });
  return out;
}

/** Admin thêm gói (menu "Thêm gói"). o: { code, name, name_en, type, days, sessions, price_vnd, active }. */
function addPackage_(o, actor) {
  var row = { code: String(o.code || '').trim().toUpperCase(), name: String(o.name || '').trim().substring(0, 80), name_en: String(o.name_en || '').trim().substring(0, 80),
    type: String(o.type || 'DAYS').trim().toUpperCase(), days: o.days === '' || o.days === undefined ? '' : Number(o.days),
    sessions: o.sessions === '' || o.sessions === undefined ? '' : Number(o.sessions), price_vnd: Number(o.price_vnd || 0), active: o.active !== false };
  if (row.type === 'SESSIONS' && row.days === '') row.days = '';
  var errs = packageRowErrors_(row);
  if (errs.length) return { ok: false, reason: REASONS.INVALID_INPUT, errors: errs };
  return withLock_(function () {
    var t = table_('PACKAGES');
    if (t.all().some(function (p) { return String(p.code).trim() === row.code; })) return { ok: false, reason: REASONS.INVALID_INPUT, errors: ['mã ' + row.code + ' đã có trong PACKAGES'] };
    t.insert(row);
    logActivity_(actor, 'PACKAGE_ADDED', 'PACKAGES', row.code, row);
    return { ok: true, code: row.code };
  });
}

// ── Phone.gs ──
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

// ── Registration.gs ──
/**
 * Registration.gs · Đăng ký, gia hạn, duyệt (v8, câu 5, 33, 39, 40, 50)
 *
 * Luồng: học viên gửi form kèm ảnh chuyển khoản → REGISTRATIONS "Chờ duyệt" → admin chọn "Duyệt"
 * → hệ thống tạo tài khoản (nếu chưa có), gói, khoản thu, gửi email chào mừng kèm link đăng nhập.
 * Thanh toán hoàn toàn bên ngoài; hệ thống chỉ lưu ảnh và số tiền theo bảng giá.
 */

var PKG_SHORT_ = { TRIAL: 'TR', PASS_2W: '2W', PASS_1M: '1M' };
var MAX_UPLOAD_BYTES_ = 6 * 1024 * 1024;

function isEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); }

function hasUsedTrial_(email) {
  var u = userByEmail_(email);
  if (u && studentPackages_(u.user_id).some(function (sp) { return sp.package_code === 'TRIAL'; })) return true;
  var e = String(email).toLowerCase();
  // Đăng ký Trial đang chờ duyệt hoặc đã duyệt cũng tính là đã dùng, tránh gửi 2 form Trial liền nhau.
  return table_('REGISTRATIONS').filter(function (r) {
    return String(r.email).toLowerCase() === e && r.package_code === 'TRIAL' && r.admin_action !== ADMIN_DECISION.REJECT;
  }).length > 0;
}

/**
 * Kiểm tra form, không ghi gì. Dùng chung cho trang web (báo lỗi sớm) và server.
 * form: { email, name, phone, level_self, package_code, consent, screenshot: { name, mimeType, base64 } }
 */
function validateRegistration_(form, defs) {
  var errors = [];
  if (!form || !isEmail_(form.email)) errors.push(REASONS.INVALID_INPUT);
  if (!form || !String(form.name || '').trim() || String(form.name).length > 80) errors.push(REASONS.INVALID_INPUT);
  if (form && (String(form.email || '').length > 120 || String(form.level_self || '').length > 30)) errors.push(REASONS.INVALID_INPUT);
  var ph = normalizePhone_(form && form.phone, false);
  if (!ph.ok) errors.push(REASONS.INVALID_PHONE);
  var def = form && defs[form.package_code];
  if (!def || !def.active) errors.push(REASONS.INVALID_INPUT);
  // 5K (BL06): gói giá 0 chỉ đăng ký qua Zalo admin (trang web không cho chọn); chặn cả khi gửi thẳng lên máy chủ.
  else if (!(Number(def.price_vnd) > 0)) errors.push(REASONS.PACKAGE_CONTACT);
  // 5L: mã gói đang trùng hoặc dòng gói sai: không nhận đăng ký tới khi admin sửa (menu 2 báo đỏ).
  if (def && def.active && brokenPackageCodes_()[form.package_code]) errors.push(REASONS.PACKAGE_BROKEN);
  var shot = form && form.screenshot;
  if (!shot || !shot.base64) errors.push(REASONS.MISSING_SCREENSHOT);
  else if (!/^(image\/(png|jpe?g|webp|heic|heif)|application\/pdf)$/i.test(String(shot.mimeType || ''))) errors.push(REASONS.INVALID_INPUT);
  else if (String(shot.base64).length * 0.75 > MAX_UPLOAD_BYTES_) errors.push(REASONS.INVALID_INPUT);
  if (!form || form.consent !== true) errors.push(REASONS.MISSING_CONSENT);
  if (!errors.length && form.package_code === 'TRIAL' && cfg_('TRIAL_ONCE_PER_EMAIL') && hasUsedTrial_(form.email)) errors.push(REASONS.TRIAL_USED);
  var uniq = errors.filter(function (x, i) { return errors.indexOf(x) === i; });
  return { ok: !uniq.length, reasons: uniq, phone: ph.ok ? ph.phone : '' };
}

/** Gửi form đăng ký hoặc gia hạn. Trả { ok, reasons, regId, transferCode }. */
function submitRegistration_(form) {
  return withLock_(function () {
    var defs = pkgDefs_();
    var v = validateRegistration_(form, defs);
    if (!v.ok) return { ok: false, reasons: v.reasons };
    var email = String(form.email).trim().toLowerCase(), now = getNow_(), def = defs[form.package_code];
    var user = userByEmail_(email);
    var regId = nextId_('REGISTRATIONS');
    var code = 'TP ' + (user ? user.user_id : regId) + ' ' + (PKG_SHORT_[def.code] || def.code);

    var bytes = Utilities.base64Decode(String(form.screenshot.base64).replace(/^data:[^,]+,/, ''));
    var ext = (String(form.screenshot.name || '').match(/\.[A-Za-z0-9]{2,5}$/) || [''])[0];
    var blob = Utilities.newBlob(bytes, form.screenshot.mimeType, regId + '_' + email.replace(/[^a-z0-9]/g, '_') + ext);
    var file = DriveApp.getFolderById(cfg_('UPLOADS_FOLDER_ID')).createFile(blob);

    var reg = table_('REGISTRATIONS').insert({
      reg_id: regId, created_at: now, email: email, name: String(form.name).trim(), phone: v.phone,
      level_self: String(form.level_self || '').trim(), package_code: def.code, transfer_code: code,
      screenshot_url: file.getUrl(), consent: true, kind: user ? 'RENEW' : 'NEW', admin_action: ADMIN_DECISION.PENDING
    });
    logActivity_(email, 'REG_CREATED', 'REGISTRATION', regId, { package: def.code, kind: reg.kind });
    notify_('NEW_REGISTRATION', { actor: email, entity: 'REGISTRATION', entity_id: regId, link: rowLink_('REGISTRATIONS', reg._row),
      message: (reg.kind === 'RENEW' ? 'Gia hạn' : 'Đăng ký mới') + ': ' + reg.name + ' · ' + def.name + ' · ' + code,
      message_en: (reg.kind === 'RENEW' ? 'Renewal' : 'New registration') + ': ' + reg.name + ' · ' + (def.name_en || def.name) + ' · ' + code }, function () { return mailAdminNewRegistration_(reg, def); });
    mailRegistrationReceived_(reg, def);
    return { ok: true, reasons: [], regId: regId, transferCode: code };
  });
}

/**
 * Admin duyệt (chọn "Duyệt" ở tab REGISTRATIONS; nối dropdown ở chunk 3).
 * Chạy lại nhiều lần không tạo trùng (kiểm tra processed_at).
 * loginUrlFn: hàm tạo link đăng nhập một lần cho user (Auth.gs, chunk 3); không có thì dẫn tới trang đăng nhập.
 */
function newDefDays_(def) { return def && def.type !== 'SESSIONS'; }
/** Ngày bắt đầu tạm khoá đang chạy của học viên (từ gói khác), hoặc hôm nay. */
function suspendStartOf_(sid, now) {
  var d = null;
  studentPackages_(sid).forEach(function (sp) { if (sp.suspend_started_at && (!d || new Date(sp.suspend_started_at) < d)) d = toMidnight_(new Date(sp.suspend_started_at)); });
  return d || toMidnight_(now);
}

function approveRegistration_(regId, actor, loginUrlFn) {
  return withLock_(function () {
    var reg = table_('REGISTRATIONS').byId(regId);
    if (!reg) return { ok: false, reason: REASONS.NOT_FOUND };
    if (reg.processed_at) return { ok: true, already: true };
    var defs = pkgDefs_(), def = defs[reg.package_code], now = getNow_();
    if (!def) throw new Error('Gói không tồn tại: ' + reg.package_code);
    var users = table_('USERS'), user = userByEmail_(reg.email);
    if (!user) {
      user = users.insert({
        user_id: nextId_('USERS_STUDENT'), role: 'STUDENT', email: reg.email, name: reg.name, phone: reg.phone,
        contact_link: contactFormula_(reg.phone), level: reg.level_self, status: USER_STATUS.ACTIVE, created_at: now
      });
      logActivity_(actor, 'USER_CREATED', 'USER', user.user_id, reg.email);
    } else if (reg.phone && reg.phone !== user.phone) {
      users.update(user, { phone: reg.phone, contact_link: contactFormula_(reg.phone) });
    }
    var plan = pkgPlanNewPurchase_(studentPackages_(user.user_id), defs, def, now);
    var sp = table_('STUDENT_PACKAGES').insert({
      sp_id: nextId_('STUDENT_PACKAGES'), student_id: user.user_id, package_code: def.code, status: plan.status,
      start_date: plan.start_date, end_date: plan.end_date, start_source: plan.start_source,
      sessions_total: def.sessions || '', suspended_days: 0, purchased_at: now, reg_id: regId, start_date_locked: plan.start_date_locked || '',
      // Soát vòng 2 (3): học viên đang tạm khoá mua gói mới: gói mới cũng tính từ lúc khoá, mở khoá thì dời cùng gói trước (không chồng).
      suspend_started_at: user.status === USER_STATUS.SUSPENDED && newDefDays_(def) ? (plan.status === PKG_STATUS.QUEUED ? suspendStartOf_(user.user_id, now) : toMidnight_(now)) : ''
    });
    table_('PAYMENTS').insert({
      payment_id: nextId_('PAYMENTS'), date: now, student_id: user.user_id, package_code: def.code,
      amount_vnd: def.price_vnd, screenshot_url: reg.screenshot_url, reg_id: regId, recorded_by: actor
    });
    table_('REGISTRATIONS').update(reg, { admin_action: ADMIN_DECISION.APPROVE, processed_at: now, processed_by: actor });
    logActivity_(actor, 'REG_APPROVED', 'REGISTRATION', regId, { user: user.user_id, sp: sp.sp_id, status: plan.status });
    // Mặc định dùng link đăng nhập thật (Auth.gs); test có thể truyền hàm khác.
    var url = typeof loginUrlFn === 'function' ? loginUrlFn(user) : createLoginLinkInLock_(user);
    mailWelcome_(user, def, url);
    return { ok: true, userId: user.user_id, spId: sp.sp_id };
  });
}

function rejectRegistration_(regId, actor, note) {
  return withLock_(function () {
    var reg = table_('REGISTRATIONS').byId(regId);
    if (!reg) return { ok: false, reason: REASONS.NOT_FOUND };
    if (reg.processed_at) return { ok: true, already: true };
    table_('REGISTRATIONS').update(reg, { admin_action: ADMIN_DECISION.REJECT, processed_at: getNow_(), processed_by: actor, note: note || '' });
    logActivity_(actor, 'REG_REJECTED', 'REGISTRATION', regId, note || '');
    mailRegistrationRejected_(reg, note);
    return { ok: true };
  });
}

/** Công thức trong Sheets để admin bấm mở Zalo của học viên (câu 42). */
function contactFormula_(phone) {
  return isVnPhone_(phone) ? '=HYPERLINK("' + zaloLink_(phone) + '","Zalo ' + phoneDisplay_(phone) + '")' : '';
}

// ── Release.gs ──
/**
 * Release.gs · Phát hành và quay lui khi đang chạy thật (chunk 5G)
 *
 * Cập nhật code khi đang chạy thật không làm mất dữ liệu nếu đi đúng thứ tự (CHUNK5G_GIAI_THICH.md mục Phát hành):
 *   1. Sửa và thử trên STAGING trước. 2. Trên PRODUCTION: dán code, lưu, chạy menu 1 (tự sao lưu DB trước khi đổi cấu trúc,
 *   bản sao nằm ở thư mục Releases, KHÔNG BAO GIỜ tự xoá). 3. Triển khai > Quản lý > Phiên bản mới (mô tả ghi số phiên bản).
 *   Quay lui code: Triển khai > Quản lý > chọn lại phiên bản cũ (dữ liệu giữ nguyên; trigger chạy code đã lưu nên dán lại
 *   code cũ rồi lưu). Quay lui dữ liệu: mở bản sao trong Releases (hoặc Lịch sử phiên bản của Sheets).
 * Mỗi lần phiên bản đổi, menu 1 ghi RELEASE vào ACTIVITY_LOG (từ, đến, người chạy).
 */

/** Thư mục Releases (Script Property RELEASES_FOLDER_ID, tự tạo). Bản sao trong đây không bị pruneFolder_ dọn. */
function releasesFolder_() {
  var props = props_(), id = props.getProperty('RELEASES_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var f = DriveApp.createFolder('THAIPUT_V8_' + getEnv_() + '_Releases');
  props.setProperty('RELEASES_FOLDER_ID', f.getId());
  return f;
}

/** Sao một bản DB vào Releases. Trả tên file. */
function releaseCopy_(ss, label) {
  var name = 'THAIPUT_DB_' + getEnv_() + '_' + label + '_' + Utilities.formatDate(getNow_(), APP.TIMEZONE, 'yyyyMMdd_HHmm');
  DriveApp.getFileById(ss.getId()).makeCopy(name, releasesFolder_());
  return name;
}

/**
 * Đầu menu 1: phiên bản code khác lần chạy trước (hoặc lần đầu có tính năng này trên file đã có dữ liệu) thì sao lưu DB
 * trước khi đổi cấu trúc. Lỗi sao lưu không chặn cài đặt nhưng hiện cảnh báo to. Trả dòng báo, hoặc null.
 */
function releaseSnapshot_(ss) {
  var last = props_().getProperty('APP_VERSION_LAST');
  if (last === APP.VERSION || !ss.getSheetByName('CONFIG')) return null;
  try { var line = 'Sao lưu trước cập nhật (' + (last || 'bản cũ') + ' sang ' + APP.VERSION + '): ' + releaseCopy_(ss, 'TRUOC_' + APP.VERSION) + ', thư mục Releases (không tự xoá)'; RELEASE_SNAPSHOT_FAILED_ = false; return line; }
  catch (e) { RELEASE_SNAPSHOT_FAILED_ = true; return 'CẢNH BÁO: chưa sao lưu được trước cập nhật (' + e.message + '). Chạy menu "Phát hành: sao lưu ngay" trước khi dùng tiếp; lần chạy menu 1 sau sẽ thử sao lưu lại.'; }
}
var RELEASE_SNAPSHOT_FAILED_ = false;

/** Cuối menu 1: ghi nhận phiên bản. */
function releaseRecord_() {
  var props = props_(), last = props.getProperty('APP_VERSION_LAST');
  if (last === APP.VERSION) return null;
  // Sao lưu trước cập nhật hỏng: chưa ghi nhận phiên bản, để lần chạy menu 1 sau thử sao lưu lại (soát R1 L6).
  if (RELEASE_SNAPSHOT_FAILED_) return null;
  props.setProperty('APP_VERSION_LAST', APP.VERSION);
  var who = ''; try { who = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail(); } catch (e) { }
  try { withLock_(function () { logActivity_(who || 'SYSTEM', 'RELEASE', 'SYSTEM', APP.VERSION, JSON.stringify({ from: last || '' })); }); } catch (e) { }
  return 'Ghi nhận phiên bản ' + APP.VERSION + (last ? ' (trước đó ' + last + ')' : '');
}

function menuReleaseBackup(e) { requireOperator_(e);
  var name = releaseCopy_(dbSpreadsheet_(), 'THU_CONG');
  withLock_(function () { logActivity_(adminActor_(), 'RELEASE_BACKUP', 'SYSTEM', APP.VERSION, name); });
  alert_('Đã sao lưu: ' + name + '\nThư mục: THAIPUT_V8_' + getEnv_() + '_Releases (không tự xoá).');
  return name;
}

// ── Report.gs ──
/**
 * Report.gs · Báo cáo tháng cho admin (v8, câu 25, 46, brief mục 7)
 *
 * Tab REPORT_MONTH là bảng kết quả do script ghi (admin chỉ xem), nên ghi thẳng giá trị thay vì công thức:
 * số liệu khớp đúng luật trong code, không lệch khi admin chèn cột ở tab khác.
 * Ba phần: buổi dạy và lương theo tutor, doanh thu theo gói, số email mỗi ngày.
 */

/** Luật tính lương cho một buổi, dùng chung cho báo cáo tháng và trang tutor (tutorMonthStats_). t: bộ đếm của tutor. */
function countPayroll_(t, b, payStatuses) {
  if (!t) return;
  if (b.status === 'COMPLETED' || b.status === 'STUDENT_ABSENT' || b.status === 'TUTOR_ABSENT') t[b.status]++;
  // Chunk 5M: lương buổi kỹ thuật theo tech_fault: lỗi học viên, lỗi khách quan có lương; lỗi tutor (mặc định) không.
  if (b.status === 'TECH_ISSUE') { if (techFault_(b) !== TECH_FAULT.TUTOR) t.TECH_PAID++; else t.TECH_UNPAID++; }
  if (b.status === 'CANCELLED_LATE' && t.CANCELLED_LATE !== undefined) t.CANCELLED_LATE++;
  if (b.status === 'NOT_COMPLETED' && t.NOT_COMPLETED !== undefined) t.NOT_COMPLETED++;
  if (payStatuses.indexOf(b.status) !== -1) t.payable++;
}

function computeMonthReport_(year, month) {
  var from = new Date(year, month - 1, 1), to = new Date(year, month, 0);
  var inMonth = function (d) { return d && d >= from && d <= to; };
  var payStatuses = cfgList_('PAYROLL_STATUSES');
  var tutors = {};
  table_('USERS').filter(function (u) { return u.role === 'TUTOR'; }).forEach(function (u) {
    tutors[u.user_id] = { id: u.user_id, name: u.name, rate: Number(u.rate_vnd || 0), COMPLETED: 0, STUDENT_ABSENT: 0, TECH_PAID: 0, TECH_UNPAID: 0, TUTOR_ABSENT: 0, CANCELLED_LATE: 0, NOT_COMPLETED: 0, WAITING: 0, payable: 0 };
  });
  // Soát 5J L3: buổi đã bắt đầu mà tutor chưa chọn kết quả (tới 48 giờ) chưa vào lương: đếm riêng để admin không chốt lương sớm.
  var nowR = getNow_();
  table_('BOOKINGS').filter(function (b) { return inMonth(b.date); }).forEach(function (b) {
    countPayroll_(tutors[b.tutor_id], b, payStatuses);
    if (b.status === BOOKING_STATUS.CONFIRMED && tutors[b.tutor_id] && slotStart_(b.date, b.slot) <= nowR) tutors[b.tutor_id].WAITING++;
  });
  Object.keys(tutors).forEach(function (k) { tutors[k].payable += tutors[k].TECH_PAID; tutors[k].amount = tutors[k].payable * tutors[k].rate; });
  var revenue = {}, revenueTotal = 0, payCount = 0;
  table_('PAYMENTS').filter(function (p) { return p.date instanceof Date && toMidnight_(p.date) >= from && toMidnight_(p.date) <= to; }).forEach(function (p) {
    var r = revenue[p.package_code] = revenue[p.package_code] || { count: 0, total: 0 };
    r.count++; r.total += Number(p.amount_vnd || 0); revenueTotal += Number(p.amount_vnd || 0); payCount++;
  });
  var mails = {};
  table_('MAIL_LOG').filter(function (m) { return m.time instanceof Date && toMidnight_(m.time) >= from && toMidnight_(m.time) <= to; })
    .forEach(function (m) { var k = dateKey_(m.time); mails[k] = (mails[k] || 0) + 1; });
  // Chunk 5G: tháng có buổi đã chuyển sang file lưu trữ thì số buổi trong DB không đủ: đánh dấu để báo cáo ghi rõ.
  var cutMain = 0, cutMail = 0; try { cutMain = Number(props_().getProperty('ARCH_CUTOFF_MAIN') || 0); cutMail = Number(props_().getProperty('ARCH_CUTOFF_MAIL') || 0); } catch (e) { }
  return { year: year, month: month, tutors: tutors, revenue: revenue, revenueTotal: revenueTotal, paymentCount: payCount, mailsByDay: mails,
    archived: !!cutMain && from.getTime() < cutMain, mailArchived: !!cutMail && from.getTime() < cutMail };
}

/** Ghi báo cáo tháng vào tab REPORT_MONTH. Mặc định tháng hiện tại. */
function refreshReportMonth_(year, month) {
  var now = getNow_();
  year = year || now.getFullYear(); month = month || now.getMonth() + 1;
  var rep = computeMonthReport_(year, month), W = 12, rows = [];
  var line = function (arr) { var a = arr.slice(); while (a.length < W) a.push(''); rows.push(a); };
  line(['BÁO CÁO THÁNG ' + pad2_(month) + '/' + year, 'Cập nhật', fmtDateTime_(now)]);
  line(rep.archived ? ['CHÚ Ý: buổi của tháng này đã chuyển (một phần) sang file lưu trữ "' + archiveFileName_(year) + '". Số dưới đây KHÔNG đủ; xem file lưu trữ.'] : []);
  line(['Tutor', 'Hoàn thành', 'Vắng học viên', 'Kỹ thuật (tính lương)', 'Kỹ thuật (không tính)', 'Vắng tutor', 'Buổi tính lương', 'Đơn giá (VND)', 'Thành tiền (VND)', 'Huỷ muộn', 'Không hoàn thành', 'Chờ tutor chọn kết quả']);
  var sum = { payable: 0, amount: 0 };
  Object.keys(rep.tutors).sort().forEach(function (k) {
    var t = rep.tutors[k];
    line([t.name + ' (' + t.id + ')', t.COMPLETED, t.STUDENT_ABSENT, t.TECH_PAID, t.TECH_UNPAID, t.TUTOR_ABSENT, t.payable, t.rate, t.amount, t.CANCELLED_LATE, t.NOT_COMPLETED, t.WAITING]);
    sum.payable += t.payable; sum.amount += t.amount;
  });
  line(['TỔNG', '', '', '', '', '', sum.payable, '', sum.amount]);
  line([]);
  line(['Doanh thu theo gói', 'Số khoản', 'Tổng tiền (VND)']);
  Object.keys(rep.revenue).sort().forEach(function (k) { line([k, rep.revenue[k].count, rep.revenue[k].total]); });
  line(['TỔNG', rep.paymentCount, rep.revenueTotal]);
  line([]);
  line(['Email theo ngày', 'Số email'].concat(rep.mailArchived ? ['CHÚ Ý: MAIL_LOG tháng này đã chuyển (một phần) sang file lưu trữ, số dưới đây không đủ'] : []));
  Object.keys(rep.mailsByDay).sort().forEach(function (k) { line([k, rep.mailsByDay[k]]); });

  var ss = dbSpreadsheet_(), sh = ss.getSheetByName('REPORT_MONTH') || ss.insertSheet('REPORT_MONTH');
  sh.clear();
  sh.getRange(1, 1, rows.length, W).setValues(rows);
  return rep;
}

// ── Reset.gs ──
/**
 * Reset.gs · Xoá dữ liệu test trước khi chạy thật (chunk 5E, theo yêu cầu anh Chris 15/10)
 *
 * Chỉ admin (chủ file, ADMIN_EMAIL, hoặc USERS role ADMIN đang hoạt động) chạy được, qua menu, 2 bước xác nhận:
 *   bước 1 chọn mức xoá (1 hoặc 2), bước 2 gõ đúng câu xác nhận có tên môi trường.
 * Chặn cứng khi CONFIG ALLOW_DATA_RESET khác TRUE (cài đặt STAGING tự ghi TRUE, switchToProduction tự ghi FALSE).
 * Trên PRODUCTION còn phải là chủ file.
 * Luôn sao lưu file DB trước; sao lưu hỏng thì không xoá gì.
 *
 * Giữ nguyên: CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES (cài đặt), tài khoản admin.
 * Mức 1: xoá học viên và mọi dữ liệu phát sinh, GIỮ tài khoản tutor.
 * Mức 2: xoá cả tài khoản tutor (chỉ còn admin).
 * Đây là ngoại lệ duy nhất của CLAUDE.md luật 10 (không xoá dòng BOOKINGS, PAYMENTS, ACTIVITY_LOG).
 */

var RESET_DATA_TABS_ = ['BOOKINGS', 'AVAILABILITY', 'STUDENT_PACKAGES', 'REGISTRATIONS', 'PAYMENTS', 'AUTH', 'ACTIVITY_LOG', 'MAIL_LOG', 'NOTIFICATIONS'];
var RESET_MODES_ = { '1': 'KEEP_TUTORS', '2': 'ADMINS_ONLY' };

/** Câu xác nhận có cả môi trường và mức xoá, để bước 2 nhắc lại đúng điều sắp xảy ra. */
function resetPhrase_(mode) { return 'XOA DU LIEU ' + getEnv_() + ' MUC ' + (mode === 'ADMINS_ONLY' ? '2' : '1'); }

/** Số dòng sẽ bị xoá ở mỗi tab, để admin đọc trước khi xác nhận. */
function resetPreview_(mode) {
  var out = {};
  RESET_DATA_TABS_.forEach(function (t) { out[t] = table_(t).all().length; });
  out.USERS = table_('USERS').filter(function (u) { return u.role === 'STUDENT' || (mode === 'ADMINS_ONLY' && u.role === 'TUTOR'); }).length;
  return out;
}

/**
 * Xoá dữ liệu test. mode: KEEP_TUTORS hoặc ADMINS_ONLY. phrase phải đúng resetPhrase_() (bước xác nhận thứ 2).
 * Trả { ok, backup, removed, eventsRemoved } hoặc { ok: false, error }.
 */
function resetTestData_(mode, phrase, actor) {
  if (!cfg_('ALLOW_DATA_RESET')) return { ok: false, error: 'CONFIG ALLOW_DATA_RESET đang tắt. Hệ thống đang chạy thật thì không được xoá.' };
  if (isProduction_() && !isOwnerUser_()) return { ok: false, error: 'Môi trường PRODUCTION: chỉ chủ file được xoá dữ liệu.' };
  if (mode !== 'KEEP_TUTORS' && mode !== 'ADMINS_ONLY') return { ok: false, error: 'Mức xoá không hợp lệ.' };
  if (String(phrase || '').trim() !== resetPhrase_(mode)) return { ok: false, error: 'Câu xác nhận không đúng. Không xoá gì.' };
  var backup;
  try { backup = backupDbCopy_('TRUOC_KHI_XOA'); } catch (e) { return { ok: false, error: 'Không sao lưu được (' + e.message + '). Không xoá gì. Kiểm tra CONFIG BACKUP_FOLDER_ID.' }; }

  var now = getNow_(), removed = {}, eventIds = [], sessions = [], users = [], events = 0, eventErrors = 0;
  // Tạm dừng hàng đợi Calendar 10 phút (soát R1 L8): kết quả trễ của job đang chạy không gắn nhầm vào booking mới cùng mã.
  try { props_().setProperty('CAL_PAUSED_UNTIL', String(realNowMs_() + 600000)); } catch (e) { }
  try { withLock_(function () {
    // 1. Ghi nhớ sự kiện Calendar còn trên lịch (xử lý sau khi nhả khoá): buổi chưa diễn ra có sự kiện, buổi chờ gỡ,
    // và buổi đang hoặc đã được thử tạo theo mã cố định (cal_attempts > 0) mà chưa ghi mã.
    table_('BOOKINGS').filter(function (b) {
      var st = calState_(b), future = slotStart_(b.date, b.slot) > now;
      if (st === CAL_STATE.CANCEL_PENDING) return true;
      if (!future) return false;
      if (b.event_id) return b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN;
      return Number(b.cal_attempts || 0) > 0;
    }).forEach(function (b) { eventIds.push(b.event_id || lessonEventId_(b)); });
    table_('AUTH').filter(function (a) { return a.kind === 'SESSION'; }).forEach(function (a) { sessions.push(a.token_hash); if (users.indexOf(a.user_id) === -1) users.push(a.user_id); });
    // 2. Xoá dòng (nhanh, chỉ thao tác Sheets). Nhật ký ghi ngay trong khoá để luôn còn dấu vết dù bước sau lỗi.
    // Xoá nhật ký trước rồi ghi ngay dòng "bắt đầu xoá": bước sau có lỗi giữa chừng vẫn còn dấu vết trong nhật ký mới.
    removed.ACTIVITY_LOG = purgeRows_('ACTIVITY_LOG', function () { return false; });
    logActivity_(actor, 'DATA_RESET_STARTED', 'DB', mode, { backup: backup });
    flushDb_();
    RESET_DATA_TABS_.filter(function (t) { return t !== 'ACTIVITY_LOG'; }).forEach(function (t) { removed[t] = purgeRows_(t, function () { return false; }); });
    removed.USERS = purgeRows_('USERS', function (u) { return u.role === 'ADMIN' || (mode === 'KEEP_TUTORS' && u.role === 'TUTOR'); });
    try { var rep = dbSpreadsheet_().getSheetByName('REPORT_MONTH'); if (rep) rep.clear(); } catch (e) { }
    logActivity_(actor, 'DATA_RESET', 'DB', mode, { backup: backup, removed: removed, eventsPending: eventIds.length });
  }); } finally {
    // 3. Dù bước xoá lỗi giữa chừng: phiên cũ vẫn hết hiệu lực ngay (kể cả bộ nhớ đệm).
    forgetSessions_(sessions, users);
  }
  // 4. Ngoài khoá: gỡ sự kiện Calendar không gửi thư (dữ liệu test).
  eventIds.forEach(function (id) {
    try { Calendar.Events.remove(lessonCalendarId_(), id, { sendUpdates: 'none' }); events++; } catch (e) { eventErrors++; }
  });
  // 5. Chunk 5M: bản lưu ngày bù tay (PKGADM_), dấu chống báo lặp: xoá cùng dữ liệu, mã gói cấp lại không nhận nhầm.
  // Cờ "đã chạy hôm nay" của job (tổng hợp, dọn AUTH...) để job chạy lại bình thường với dữ liệu mới; mở lại hàng đợi Calendar.
  try { var p = props_(), all = p.getProperties(); Object.keys(all).forEach(function (k) { if (/^DONE_/.test(k) || /^ARCH_OPEN_/.test(k) || k === 'CAL_PAUSED_UNTIL' || /^(PKGADM|COMPNEXT|COMPBLK|TRIALLEFT|TRIALOVER|PKGOUT|PKGMISS|TA_CONFIRM)_/.test(k)) p.deleteProperty(k); }); } catch (e) { }
  try { CacheService.getScriptCache().remove(CAL_HINT_KEY_); } catch (e) { }
  return { ok: true, backup: backup, removed: removed, eventsRemoved: events, eventErrors: eventErrors };
}

/** Menu: Xoá dữ liệu test. Bước 1 chọn mức, bước 2 gõ câu xác nhận. */
/** Người đang chạy có phải chủ file Sheets (tài khoản chạy hệ thống). */
function isOwnerUser_() {
  try { requireOwner_(); return true; } catch (e) { return false; }
}

function menuResetTestData(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (!cfg_('ALLOW_DATA_RESET')) { alert_('Đang chặn: CONFIG ALLOW_DATA_RESET khác TRUE. Hệ thống chạy thật thì không xoá dữ liệu.'); return; }
  var p1 = resetPreview_('KEEP_TUTORS'), tutors = table_('USERS').filter(function (u) { return u.role === 'TUTOR'; }).length;
  var lines = RESET_DATA_TABS_.map(function (t) { return '  ' + t + ': ' + p1[t] + ' dòng'; }).join('\n');
  var r1 = ui.prompt('Xoá dữ liệu test · Bước 1/2 (' + getEnv_() + ')',
    'Sẽ xoá:\n' + lines + '\n  Học viên trong USERS: ' + p1.USERS + '\n\n' +
    'Giữ nguyên: CONFIG, PACKAGES, NOTIFY_RULES, CONTENT, EMAIL_TEMPLATES, tài khoản admin.\n' +
    'Có sao lưu file trước khi xoá. Sự kiện Calendar của buổi chưa diễn ra bị gỡ, không gửi thư.\n\n' +
    'Nhập 1: giữ ' + tutors + ' tài khoản tutor.\nNhập 2: xoá cả tutor (chỉ còn admin).', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var mode = RESET_MODES_[String(r1.getResponseText()).trim()];
  if (!mode) { alert_('Chỉ nhập 1 hoặc 2. Không xoá gì.'); return; }
  var what = mode === 'ADMINS_ONLY' ? 'MỨC 2: xoá mọi học viên VÀ ' + tutors + ' tài khoản tutor. Chỉ còn admin.' : 'MỨC 1: xoá mọi học viên, giữ ' + tutors + ' tài khoản tutor.';
  var r2 = ui.prompt('Xoá dữ liệu test · Bước 2/2', what + '\nTutor phải mở lại lịch. Mọi người, kể cả admin, phải đăng nhập lại trên web.\n' +
    'KHÔNG HOÀN TÁC TRÊN SHEETS (chỉ khôi phục bằng bản sao lưu).\n\nGõ chính xác:  ' + resetPhrase_(mode), ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var res = resetTestData_(mode, r2.getResponseText(), adminActor_());
  if (!res.ok) { alert_(res.error); return; }
  alert_('Đã xoá. Bản sao lưu: ' + res.backup + '\nSự kiện Calendar đã gỡ: ' + res.eventsRemoved + (res.eventErrors ? ' (lỗi ' + res.eventErrors + ', gỡ tay trên lịch)' : '') +
    '\n\nẢnh chuyển khoản trong Drive không bị xoá. Giờ giả lập (nếu đang bật) giữ nguyên.');
}

// ── Sessions.gs ──
/**
 * Sessions.gs · Kết quả sau buổi học (v8, plan mục 4.6, câu 26, 27, 29)
 */

var SESSION_RESULTS = ['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE'];

/** Tutor chọn kết quả cho buổi của mình, sau giờ bắt đầu. */
function submitSessionResultFor_(tutorId, bookingId, result, actor, opts) {
  if (SESSION_RESULTS.indexOf(result) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.tutor_id !== tutorId) {
      logActivity_(actor, 'FORBIDDEN_RESULT_ATTEMPT', 'BOOKING', bookingId, { by: tutorId });
      return { ok: false, reason: REASONS.FORBIDDEN };
    }
    if (b.status !== BOOKING_STATUS.CONFIRMED) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (getNow_() < slotStart_(b.date, b.slot)) return { ok: false, reason: REASONS.TOO_EARLY };
    var patch = { status: result, result_at: getNow_(), result_by: actor };
    // Chunk 5M: buổi kỹ thuật mặc định lỗi tutor (không trừ lượt, được bù) tới khi admin chọn lỗi khác.
    if (result === 'TECH_ISSUE') { patch.tech_fault = TECH_FAULT.TUTOR; patch.tech_decided_at = ''; }
    table_('BOOKINGS').update(b, patch);
    // Chunk 5M: mọi kết quả đều tính lại gói (Hoàn thành, Vắng học viên khoá ngày bắt đầu; kỹ thuật được bù).
    recomputeStudentPackages_(b.student_id, actor);
    // Ghi mã phiên (thiết bị) đã bấm: bằng chứng khi có tranh chấp (chunk 5D).
    logActivity_(actor, 'SESSION_RESULT', 'BOOKING', bookingId, opts && opts.session ? { result: result, session: opts.session } : result);
    var stu = userById_(b.student_id), tut = userById_(tutorId);
    notify_('RESULT_' + result, { actor: actor, student_id: b.student_id, tutor_id: tutorId, entity: 'BOOKING', entity_id: bookingId, link: rowLink_('BOOKINGS', b._row),
      message: (tut ? tut.name : tutorId) + ' xác nhận ' + (BOOKING_STATUS_VI[result] || result) + ': ' + (stu ? stu.name : b.student_id) + ' · ' + fmtDayVi_(b.date) + ' ' + b.slot,
      message_en: (tut ? tut.name : tutorId) + ' confirmed ' + (BOOKING_STATUS_EN_[result] || result) + ': ' + (stu ? stu.name : b.student_id) + ' · ' + fmtDayEn_(b.date) + ' ' + b.slot });
    return { ok: true, reason: REASONS.OK };
  });
}

/**
 * Job mỗi giờ (câu 29, đổi 01/11 chunk 5J). Phải gọi trong withLock_. Không còn tự Hoàn thành.
 *   1. Buổi CONFIRMED quá RESULT_NOTICE_AFTER_HOURS giờ sau giờ kết thúc: ghi result_notice_at, báo đỏ (RESULT_OVERDUE, mức Khẩn)
 *      trên trang quản trị; trang tutor tô đỏ buổi đó.
 *   2. Quá RESULT_EXPIRE_AFTER_HOURS giờ sau giờ kết thúc VÀ đã báo được RESULT_EXPIRE_AFTER_NOTICE_HOURS giờ: NOT_COMPLETED
 *      (không tính lương), báo admin (RESULT_NOT_COMPLETED), tính lại gói. allowExpire false (bảo trì): chỉ báo, không chuyển.
 * Trả số buổi chuyển NOT_COMPLETED.
 */
function resultOverdueInLock_(now, allowExpire) {
  var t = table_('BOOKINGS'), hasCol = 'result_notice_at' in t.colIndex, H = 3600000;
  var notice = Number(cfg_('RESULT_NOTICE_AFTER_HOURS')) * H, expire = Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) * H, after = Number(cfg_('RESULT_EXPIRE_AFTER_NOTICE_HOURS')) * H;
  var noticed = [], done = [];
  t.filter(function (b) { return b.status === BOOKING_STATUS.CONFIRMED && b.date instanceof Date; }).forEach(function (b) {
    var late = now.getTime() - slotEnd_(b.date, b.slot).getTime();
    if (late < notice) return;
    var at = b.result_notice_at ? new Date(b.result_notice_at) : null;
    if (at && isNaN(at.getTime())) at = null;
    if (!at) {
      // Chưa chạy menu 1 (thiếu cột): coi như đã báo đúng lúc quá hạn xác nhận, để vẫn chuyển sau đủ giờ.
      if (!hasCol) at = new Date(slotEnd_(b.date, b.slot).getTime() + notice);
      else { t.update(b, { result_notice_at: now }); at = now; noticed.push(b); }
    }
    // Soát 5J M2: đang bảo trì (tutor không chọn được kết quả) thì dời mốc báo đỏ theo giờ hiện tại: mở lại xong tutor còn đủ
    // RESULT_EXPIRE_AFTER_NOTICE_HOURS giờ. Thiếu cột (chưa chạy menu 1) thì không dời được.
    if (!allowExpire && hasCol && at.getTime() < now.getTime()) { t.update(b, { result_notice_at: now }); at = now; }
    if (allowExpire && late >= expire && now.getTime() - at.getTime() >= after) {
      t.update(b, { status: BOOKING_STATUS.NOT_COMPLETED, result_at: now, result_by: 'SYSTEM' });
      logActivity_('SYSTEM', 'RESULT_NOT_COMPLETED', 'BOOKING', b.booking_id, { tutor: b.tutor_id });
      done.push(b);
    }
  });
  var names = {}; table_('USERS').all().forEach(function (u) { names[u.user_id] = u.name; });
  noticed.forEach(function (b) {
    var exp = new Date(Math.max(slotEnd_(b.date, b.slot).getTime() + expire, now.getTime() + after));
    logActivity_('SYSTEM', 'RESULT_OVERDUE', 'BOOKING', b.booking_id, { tutor: b.tutor_id, expire: fmtDateTime_(exp) });
    notify_('RESULT_OVERDUE', { student_id: b.student_id, tutor_id: b.tutor_id, entity: 'BOOKING', entity_id: b.booking_id, link: rowLink_('BOOKINGS', b._row),
      message: (names[b.tutor_id] || b.tutor_id) + ' chưa chọn kết quả buổi ' + fmtDayVi_(b.date) + ' ' + b.slot + ' (' + (names[b.student_id] || b.student_id) + '). Nhắc tutor; tới ' + fmtDateTime_(exp) + ' chưa chọn thì buổi thành Không hoàn thành, không tính lương.',
      message_en: (names[b.tutor_id] || b.tutor_id) + ' has not chosen the result of ' + fmtDayEn_(b.date) + ' ' + b.slot + ' (' + (names[b.student_id] || b.student_id) + '). Remind the tutor; by ' + fmtDateTime_(exp) + ' it becomes Not completed, unpaid.' });
  });
  if (done.length) notify_('RESULT_NOT_COMPLETED', { entity: 'BOOKING', entity_id: done.map(function (b) { return b.booking_id; }).join(','), link: rowLink_('BOOKINGS'),
    message: done.length + ' buổi thành Không hoàn thành (tutor không chọn kết quả, không tính lương): ' + done.map(function (b) { return b.booking_id + ' (' + (names[b.tutor_id] || b.tutor_id) + ')'; }).join(', ') + '. Buổi không diễn ra thì chọn Vắng tutor; đã học thì chọn Hoàn thành.',
    message_en: done.length + ' lesson(s) became Not completed (no result from the tutor, unpaid): ' + done.map(function (b) { return b.booking_id + ' (' + (names[b.tutor_id] || b.tutor_id) + ')'; }).join(', ') + '. If it did not happen pick Tutor absent; if it happened pick Completed.' });
  var sids = {}; done.forEach(function (b) { sids[b.student_id] = true; });
  Object.keys(sids).forEach(function (sid) { recomputeStudentPackages_(sid, 'SYSTEM'); });
  return done.length;
}

/** Hạn xác nhận của một buổi chưa có kết quả: { overdue, expireAt } để trang tutor, admin hiện (chunk 5J). */
function resultDeadlineInfo_(b, now) {
  var H = 3600000, end = slotEnd_(b.date, b.slot).getTime(), notice = Number(cfg_('RESULT_NOTICE_AFTER_HOURS')) * H;
  var at = b.result_notice_at ? new Date(b.result_notice_at).getTime() : end + notice;
  if (isNaN(at)) at = end + notice;
  var exp = Math.max(end + Number(cfg_('RESULT_EXPIRE_AFTER_HOURS')) * H, at + Number(cfg_('RESULT_EXPIRE_AFTER_NOTICE_HOURS')) * H);
  return { overdue: now.getTime() - end >= notice, expireAt: new Date(exp) };
}

/**
 * Admin chọn kết quả thay tutor (chunk 5J): buổi đã bắt đầu còn CONFIRMED, hoặc đã thành NOT_COMPLETED.
 * result: COMPLETED hoặc STUDENT_ABSENT. Tính lương theo kết quả admin chọn.
 */
function adminSetResult_(bookingId, actor, result) {
  // Soát 5J: thêm Vấn đề kỹ thuật; sau đó admin chọn lỗi (tutor, học viên, khách quan) ở cùng cột như buổi kỹ thuật tutor báo.
  if (['COMPLETED', 'STUDENT_ABSENT', 'TECH_ISSUE'].indexOf(result) === -1) return { ok: false, reason: REASONS.INVALID_INPUT };
  return withLock_(function () {
    var b = table_('BOOKINGS').byId(bookingId);
    if (!b) return { ok: false, reason: REASONS.NOT_FOUND };
    if (b.status !== BOOKING_STATUS.CONFIRMED && b.status !== BOOKING_STATUS.NOT_COMPLETED) return { ok: false, reason: REASONS.INVALID_INPUT };
    if (getNow_() < slotStart_(b.date, b.slot)) return { ok: false, reason: REASONS.TOO_EARLY };
    var prev = b.status;
    var patch = { status: result, result_at: getNow_(), result_by: actor };
    if (result === 'TECH_ISSUE' && 'tech_fault' in table_('BOOKINGS').colIndex) { patch.tech_fault = ''; patch.tech_decided_at = ''; }
    table_('BOOKINGS').update(b, patch);
    recomputeStudentPackages_(b.student_id, actor);
    logActivity_(actor, 'ADMIN_RESULT', 'BOOKING', bookingId, { result: result, from: prev });
    return { ok: true };
  });
}

/** Lịch dạy của chính tutor: sắp tới và chờ xác nhận. Chỉ tên, level, ghi chú học viên (câu 35). */
function tutorScheduleFor_(tutorId) {
  var now = getNow_(), out = { upcoming: [], toConfirm: [] };
  table_('BOOKINGS').filter(function (b) { return b.tutor_id === tutorId && b.status === BOOKING_STATUS.CONFIRMED; })
    .sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); })
    .forEach(function (b) {
      var s = userById_(b.student_id) || {};
      // Chunk 5J: quá hạn xác nhận thì tô đỏ, kèm giờ sẽ thành Không hoàn thành (chuỗi, không gửi Date ra trình duyệt).
      var dlInfo = slotStart_(b.date, b.slot) <= now ? resultDeadlineInfo_(b, now) : null;
      var item = { bookingId: b.booking_id, date: dateKey_(b.date), label: fmtDayEn_(b.date), slot: b.slot, meetLink: b.meet_link, inviteWhen: calendarInviteWhen_(b, now),
        overdue: !!(dlInfo && dlInfo.overdue), expireAt: dlInfo ? fmtDateTime_(dlInfo.expireAt) : '',
        student: { name: s.name || '', level: s.level || '', note: s.note || '' } };
      if (slotStart_(b.date, b.slot) <= now) out.toConfirm.push(item); else out.upcoming.push(item);
    });
  return out;
}

/**
 * Số buổi của một tutor theo tháng (tháng này và tháng trước), dùng đúng luật của báo cáo lương computeMonthReport_.
 * toConfirm: buổi đã diễn ra trong tháng mà tutor chưa xác nhận (quá RESULT_EXPIRE_AFTER_HOURS giờ thì thành Không hoàn thành, 5J).
 */
function tutorMonthStats_(tutorId) {
  var now = getNow_(), out = [];
  [0, 1].forEach(function (back) {
    var d = new Date(now.getFullYear(), now.getMonth() - back, 1), y = d.getFullYear(), m = d.getMonth() + 1;
    // Cùng luật với báo cáo lương (countPayroll_), nhưng chỉ đọc BOOKINGS của tutor này (không đọc PAYMENTS, MAIL_LOG).
    var from = new Date(y, m - 1, 1), to = new Date(y, m, 0), pay = cfgList_('PAYROLL_STATUSES');
    var t = { COMPLETED: 0, STUDENT_ABSENT: 0, TECH_PAID: 0, TECH_UNPAID: 0, TUTOR_ABSENT: 0, NOT_COMPLETED: 0, payable: 0 }, waiting = 0;
    table_('BOOKINGS').filter(function (b) { return b.tutor_id === tutorId && b.date >= from && b.date <= to; }).forEach(function (b) {
      countPayroll_(t, b, pay);
      if (b.status === BOOKING_STATUS.CONFIRMED && slotStart_(b.date, b.slot) <= now) waiting++;
    });
    t.payable += t.TECH_PAID;
    out.push({ month: pad2_(m) + '/' + y, completed: t.COMPLETED, studentAbsent: t.STUDENT_ABSENT, techPaid: t.TECH_PAID, techUnpaid: t.TECH_UNPAID,
      tutorAbsent: t.TUTOR_ABSENT, notCompleted: t.NOT_COMPLETED, payable: t.payable, toConfirm: waiting });
  });
  return { months: out };
}

// ── Setup.gs ──
/**
 * Setup.gs · Cài đặt lần đầu, trigger, kiểm tra hệ thống (v8)
 *
 * Mỗi môi trường (STAGING, PRODUCTION) = một file Google Sheets + một Apps Script gắn vào file đó.
 * Chạy menu thaiput > 1. Cài đặt lần đầu trong file Sheets. Chạy lại bao nhiêu lần cũng an toàn:
 * chỉ tạo phần còn thiếu, không xoá dữ liệu.
 * Chạy được trên Gmail thường; khi chuyển sang Workspace chỉ cần sửa vài ô trong CONFIG.
 */

// Gói mặc định: [code, tên tiếng Việt, loại, số ngày, số buổi, giá, đang bán, tên tiếng Anh]. Giá để 0: admin điền giá thật.
function defaultPackages_() { return [
  ['TRIAL', 'Trial 2 buổi', 'DAYS', DEFAULTS_.PKG_TRIAL_DAYS, DEFAULTS_.TRIAL_SESSIONS, 0, true, 'Trial, 2 lessons'],
  ['PASS_2W', 'Gói 2 tuần', 'DAYS', DEFAULTS_.PKG_2W_DAYS, '', 0, true, '2 week pass'],
  ['PASS_1M', 'Gói 1 tháng', 'DAYS', DEFAULTS_.PKG_1M_DAYS, '', 0, true, '1 month pass']]; }   // 5L: bỏ hẳn LEGACY (gói chuyển từ v6)

var TRIGGER_HANDLERS_ = ['reminderJob', 'hourlyJob', 'dailyJob', 'sundayRemind', 'nightlyBackup', 'weeklyExport', 'onEditInstallable', 'calendarJob', 'onChangeInstallable'];
// Số trigger hệ thống tạo: 8 từ chunk 5J (bỏ 2 trigger sundayRemind Chủ nhật; nhắc tutor chạy trong hourlyJob). Tên sundayRemind vẫn
// nằm trong TRIGGER_HANDLERS_ để menu 3 xoá trigger cũ.
var TRIGGER_COUNT_ = 8;

function setupFirstRun(e) { requireOwner_(e); var r = setupCore_(SpreadsheetApp.getActive()); logMenu_(e, 'SETUP_RUN', 'SYSTEM', APP.VERSION, JSON.stringify({ version: APP.VERSION, steps: r.lines.length })); return r; }

/** Biến file Sheets đang mở thành PRODUCTION. Chạy một lần từ trình soạn Apps Script của bản thật. */
function switchToProduction(e) { requireOwner_(e);
  props_().setProperty('ENV', 'PRODUCTION');
  props_().setProperty('DB_ID_PRODUCTION', SpreadsheetApp.getActive().getId());
  forgetEnvMemo_();
  props_().deleteProperty('SIM_NOW');
  loadTestDisable_();   // chunk 5G: PRODUCTION không bao giờ mở cổng thử tải
  clearNowCache_();
  var r = setupFirstRun();
  // Chạy thật: khoá menu "Xoá dữ liệu test" (muốn mở lại phải tự sửa CONFIG, và chỉ chủ file chạy được).
  withLock_(function () { var t = table_('CONFIG'), row = t.byId('ALLOW_DATA_RESET'); if (row) t.update(row, { value: 'FALSE' }); else t.insert({ key: 'ALLOW_DATA_RESET', value: 'FALSE', note: '' }); });
  clearConfigCache_();
  r.lines.push('Đã khoá menu Xoá dữ liệu test (ALLOW_DATA_RESET = FALSE)');
  logMenu_(e, 'ENV_PRODUCTION', 'SYSTEM', SpreadsheetApp.getActive().getId(), APP.VERSION);
  return r;
}

var MIG_SHORT_ = { hashes: [], users: [] };
function setupCore_(ss) {
  var lines = [], env = getEnv_();
  props_().setProperty('ENV', env);
  props_().setProperty('DB_ID_' + env, ss.getId());
  forgetEnvMemo_(); clearDbCache_(); clearConfigCache_();
  try { ss.setSpreadsheetTimeZone(APP.TIMEZONE); } catch (e) { }
  lines.push('Môi trường: ' + env + ' · file ' + ss.getName());
  // Chunk 5G: phiên bản code đổi thì sao lưu DB vào Releases TRƯỚC khi đổi cấu trúc (không tự xoá).
  var relLine = releaseSnapshot_(ss); if (relLine) lines.push(relLine);
  // Chunk 5H: tab CONTENT bản cũ (một cột value) đổi tên thành CONTENT_CU_808 và ẩn đi; bước 1 tạo tab song ngữ mới,
  // sau bước gieo chữ thì chép lại chữ admin đã sửa. Không xoá tab cũ.
  var oldContent = contentDetachOld_(ss);
  if (oldContent) lines.push('Tab CONTENT bản cũ đổi tên thành ' + oldContent + ' (ẩn, giữ nguyên để đối chiếu)');

  // 1. Tab và cột
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name), cols = SCHEMA[name].cols;
    if (!sh) { sh = ss.insertSheet(name); lines.push('Tạo tab ' + name); }
    var header = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    var missing = cols.filter(function (c) { return header.indexOf(c) === -1; });
    if (missing.length) {
      // Ghi sau cột tiêu đề cuối cùng có chữ (không đếm số ô có chữ: có ô tiêu đề trống ở giữa sẽ ghi đè cột thật).
      var lastNonEmpty = 0; header.forEach(function (h, i) { if (String(h).trim() !== '') lastNonEmpty = i + 1; });
      var start = lastNonEmpty + 1, need = start + missing.length - 1;
      // Chunk 5M: tab mới của Google chỉ có 26 cột (A đến Z); BOOKINGS từ 8.1.0 có 27 cột. Thêm cột trước khi ghi tiêu đề.
      if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
      sh.getRange(1, start, 1, missing.length).setValues([missing]);
      if (header.length) lines.push('Thêm cột vào ' + name + ': ' + missing.join(', '));
    }
    try { sh.setFrozenRows(1); } catch (e) { }
    var full = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    // Tab mới của Google có 1.000 hàng; định dạng chữ cho mọi hàng hiện có, hàng thêm sau do Db.gs tự định dạng.
    var rows = sh.getMaxRows() - 1;
    (SCHEMA[name].text || []).forEach(function (c) { sh.getRange(2, full.indexOf(c) + 1, rows, 1).setNumberFormat('@'); });
  });
  if (!ss.getSheetByName('REPORT_MONTH')) ss.insertSheet('REPORT_MONTH');

  // 2. Dropdown cho admin
  Object.keys(dropdownSpec_()).forEach(function (n) { var sh = ss.getSheetByName(n); applyDropdowns_(sh, n, 2, sh.getMaxRows() - 1); });

  // 3. CONFIG: thêm khoá còn thiếu với giá trị mặc định
  clearDbCache_();
  var cfgT = table_('CONFIG'), have = {};
  cfgT.all().forEach(function (r) { have[r.key] = r; });
  var me = ''; try { me = Session.getEffectiveUser().getEmail(); } catch (e) { }
  var added = 0;
  // Chunk 5J: khoá đổi tên. Khoá cũ admin đã chỉnh (khác mặc định cũ): chép sang khoá mới TRƯỚC bước thêm mặc định; ghi chú khoá cũ.
  Object.keys(CFG_RENAMED_).forEach(function (k) {
    var r = CFG_RENAMED_[k], old = have[r[0]];
    if (old && !String(old.note || '').trim()) cfgT.update(old, { note: 'Không dùng từ ' + (r[2] || '8.1.1') + ', thay bằng ' + Object.keys(CFG_RENAMED_).filter(function (x) { return CFG_RENAMED_[x][0] === r[0]; }).join(', ') });
    if (have[k] || !old) return;
    var v = coerceCfg_(old.value, r[1]);
    if (v === r[1]) return;
    have[k] = cfgT.insert({ key: k, value: v, note: 'Chép từ ' + r[0] + ' (bản ' + (r[2] || '8.1.1') + ')' }); added++;
  });
  ['TUTOR_DEADLINE_HOUR', 'TUTOR_REMIND_HOURS', 'LOGIN_LINK_MAX_PER_WINDOW', 'LOGIN_LINK_WINDOW_MINUTES'].forEach(function (k) {
    if (have[k] && !String(have[k].note || '').trim()) cfgT.update(have[k], { note: 'Không dùng từ 8.1.1 (xem TUTOR_REMIND_AT, TUTOR_DEADLINE_AT, LOGIN_LINK_COOLDOWN_MINUTES)' });
  });
  if (have.ARCHIVE_LOG_KEEP_MONTHS && !String(have.ARCHIVE_LOG_KEEP_MONTHS.note || '').trim()) cfgT.update(have.ARCHIVE_LOG_KEEP_MONTHS, { note: 'Không dùng từ 8.1.2 (xem LOG_KEEP_DAYS)' });
  Object.keys(DEFAULTS_).forEach(function (k) {
    if (have[k]) return;
    var v = DEFAULTS_[k];
    if (k === 'ADMIN_EMAIL' && me) v = me;
    if (k === 'ALLOW_DATA_RESET') v = env !== 'PRODUCTION';   // STAGING: được xoá dữ liệu test; PRODUCTION: không
    cfgT.insert({ key: k, value: v, note: '' }); added++;
  });
  if (added) lines.push('Thêm ' + added + ' khoá cấu hình vào CONFIG');
  // 15/10: bỏ email nhắc 8:00 sáng (quyết định anh Chris). Chỉ đổi 1 lần, và chỉ khi ô còn giá trị mặc định cũ 8.
  if (have.MORNING_REMINDER_HOUR && String(have.MORNING_REMINDER_HOUR.value).trim() === '8' && !props_().getProperty('MIG_MORNING_OFF')) {
    cfgT.update(have.MORNING_REMINDER_HOUR, { value: '-1' }); lines.push('Tắt email nhắc 8:00 (MORNING_REMINDER_HOUR = -1)');
  }
  props_().setProperty('MIG_MORNING_OFF', '1');
  // 16/10 (quyết định anh Chris): Calendar QUEUE thay NIGHTLY, phiên tutor 30 ngày thay 90. Chỉ đổi 1 lần, và chỉ khi ô
  // còn đúng giá trị mặc định cũ (admin đã tự chọn giá trị khác thì giữ). Mẫu email STAFF_NEW_LOGIN cũ chỉ tới nút
  // "Thoát mọi thiết bị" đã bỏ: đổi sang câu mới nếu admin chưa sửa.
  if (!props_().getProperty('MIG_1610')) {
    [['CALENDAR_MODE', 'NIGHTLY', 'QUEUE'], ['TUTOR_SESSION_DAYS', '90', '30']].forEach(function (x) {
      var r = have[x[0]];
      if (r && String(r.value).trim().toUpperCase() === x[1]) { cfgT.update(r, { value: x[2] }); lines.push('Đổi ' + x[0] + ' từ ' + x[1] + ' sang ' + x[2] + ' (quyết định 16/10)'); }
    });
    // Phiên tutor đã cấp với hạn 90 ngày: rút về 30 ngày tính từ lúc đăng nhập (soát R1 L7, R2 T16).
    clearConfigCache_();
    var short = 0, td = Number(cfg_('TUTOR_SESSION_DAYS')) || 30, tutorIds = {};
    table_('USERS').all().forEach(function (u) { if (u.role === 'TUTOR') tutorIds[u.user_id] = true; });
    withLock_(function () {
      var at = table_('AUTH'), shortHashes = [], shortUsers = [];
      at.filter(function (a) { return a.kind === 'SESSION' && tutorIds[a.user_id]; }).forEach(function (a) {
        var cap = new Date(new Date(a.created_at).getTime() + td * 86400000);
        if (!isNaN(cap.getTime()) && new Date(a.expires_at) > cap) { at.update(a, { expires_at: cap }); short++; shortHashes.push(a.token_hash); if (shortUsers.indexOf(a.user_id) === -1) shortUsers.push(a.user_id); }
      });
      MIG_SHORT_ = { hashes: shortHashes, users: shortUsers };
      // Chữ web đã bỏ (danh sách thiết bị ở cổng học viên, tutor): xoá dòng cũ ở tab CONTENT để menu Làm mới chữ không cảnh báo (soát R2 T15).
      var gone = ['s.devices_title', 's.device_current', 's.device_since', 's.logout_all', 's.logout_all_q', 's.logout_all_yes', 's.logout_all_no', 's.logout_all_done',
        't.devices_title', 't.device_current', 't.device_since', 't.devices_note', 't.logout_all', 't.logout_all_q', 't.logout_all_yes', 't.logout_all_no', 't.logout_all_done'];
      var nGone = purgeRows_('CONTENT', function (r) { return gone.indexOf(String(r.key)) === -1; });
      if (nGone) lines.push('Xoá ' + nGone + ' dòng chữ web đã bỏ (thiết bị đăng nhập) ở tab CONTENT');
    });
    if (short) { forgetSessions_(MIG_SHORT_.hashes, MIG_SHORT_.users); lines.push('Rút ' + short + ' phiên tutor về hạn ' + td + ' ngày'); }
    var et0 = table_('EMAIL_TEMPLATES'), nl = et0.byId('STAFF_NEW_LOGIN'), d0 = DEFAULT_EMAIL_TEMPLATES_.STAFF_NEW_LOGIN;
    if (nl && /Thoát mọi thiết bị/.test(String(nl.body_vi)) && /Log out of all devices/.test(String(nl.body_en)) &&
        String(nl.body_vi).indexOf('vào mục Tài khoản, bấm **Thoát mọi thiết bị**, rồi nhắn Zalo admin.') !== -1) {
      et0.update(nl, { body_vi: d0[3], body_en: d0[6] }); lines.push('Cập nhật mẫu email STAFF_NEW_LOGIN (bỏ nút Thoát mọi thiết bị)');
    }
    props_().setProperty('MIG_1610', '1');
  }

  // 3b. Luật thông báo cho admin (chunk 5B): thêm sự kiện còn thiếu, không ghi đè dòng admin đã sửa
  var nr = table_('NOTIFY_RULES'), nAdded = 0;
  Object.keys(DEFAULT_NOTIFY_RULES_).forEach(function (ev) {
    if (nr.byId(ev)) return;
    var d = DEFAULT_NOTIFY_RULES_[ev];
    nr.insert({ event: ev, level: d[0], channel: d[1], note: d[2] }); nAdded++;
  });
  if (nAdded) lines.push('Thêm ' + nAdded + ' luật thông báo vào NOTIFY_RULES');
  var cs = seedContent_();
  if (cs.content || cs.templates) lines.push('Thêm ' + cs.content + ' dòng chữ web vào CONTENT, ' + cs.templates + ' mẫu email vào EMAIL_TEMPLATES');
  var carried = contentCarryPending_(ss);
  if (carried) {
    clearContentCache_();
    if (carried.missing) lines.push('CẢNH BÁO: không thấy tab ' + carried.sheet + ' để chép chữ đã sửa; chữ web dùng chữ gốc');
    else lines.push('Chép ' + carried.moved + ' chữ admin đã sửa từ tab ' + carried.sheet + ' sang CONTENT song ngữ (cột note ghi "Chép từ bản 8.0.8", nên xem lại)' +
      (carried.keys.length ? ': ' + carried.keys.slice(0, 15).join(', ') + (carried.keys.length > 15 ? '...' : '') : '') +
      (carried.skipped.length ? '; bỏ qua key không còn dùng: ' + carried.skipped.slice(0, 10).join(', ') : '') +
      (carried.kept && carried.kept.length ? '; giữ chữ đã sửa ở tab mới: ' + carried.kept.slice(0, 10).join(', ') : ''));
  }
  if (cs.upgraded) lines.push('Cập nhật ' + cs.upgraded + ' ô chữ web, mẫu email còn chữ gốc cũ sang chữ gốc mới (ô admin đã sửa giữ nguyên)');
  if (cs.marketing) lines.push('Thêm dòng ví dụ VI_DU vào MARKETING_EMAILS (status DRAFT, không tự gửi)');
  applyHighlights_(ss);

  // 4. Gói mặc định (giá để 0: admin điền giá thật trong tab PACKAGES)
  var pk = table_('PACKAGES');
  defaultPackages_().forEach(function (p) {
    var cur = pk.byId(p[0]);
    if (!cur) { pk.insert({ code: p[0], name: p[1], name_en: p[7], type: p[2], days: p[3], sessions: p[4], price_vnd: p[5], active: p[6] }); lines.push('Thêm gói ' + p[0]); return; }
    // Chunk 5I: cột name_en mới. Gói mặc định chưa đổi tên tiếng Việt thì điền sẵn tên tiếng Anh; gói đã đổi tên thì để admin tự điền.
    if ('name_en' in pk.colIndex && !String(cur.name_en || '').trim() && String(cur.name) === p[1]) { pk.update(cur, { name_en: p[7] }); lines.push('Điền tên tiếng Anh cho gói ' + p[0]); }
  });
  // 4a. Chunk 5L: bỏ hẳn gói LEGACY (chuyển từ v6). Chỉ xoá dòng khi không còn gói học viên nào mang mã này.
  removeLegacyPackage_(lines);
  // 4b. Chunk 5M (bản 8.1.0): chuyển buổi kỹ thuật cũ, ghi ngày bắt đầu cố định, tính lại gói theo luật bù buổi. Một lần (MIG_5M).
  migrate5M_().forEach(function (l) { lines.push(l); });
  // 4b2. Soát 5K: đổi tên file lưu trữ kiểu cũ.
  try { var rn = archiveRenameOldFiles_(); if (rn) lines.push('Đổi tên ' + rn + ' file lưu trữ sang tên mới (THAIPUT · Lưu trữ · ...)'); } catch (re2) { }
  // 4c. Chunk 5L: ghi tab META (phiên bản, mốc mã tự sinh) mỗi lần chạy menu 1, để chuyển hệ thống đọc được.
  try { withLock_(function () { writeMetaInLock_(); }); } catch (me) { lines.push('LƯU Ý: chưa ghi được tab META (' + me.message + ')'); }
  protectPackageCols_(ss, lines);

  // 5. Thư mục Drive và lịch Calendar
  clearConfigCache_();
  var setCfg = function (k, v) { var r = table_('CONFIG').byId(k); if (r) table_('CONFIG').update(r, { value: v }); else table_('CONFIG').insert({ key: k, value: v }); clearConfigCache_(); };
  if (!cfg_('UPLOADS_FOLDER_ID') || !cfg_('BACKUP_FOLDER_ID') || !cfg_('EXPORT_FOLDER_ID')) {
    var root = DriveApp.createFolder('THAIPUT_V8_' + env);
    setCfg('UPLOADS_FOLDER_ID', root.createFolder('Uploads').getId());
    setCfg('BACKUP_FOLDER_ID', root.createFolder('Backup').getId());
    setCfg('EXPORT_FOLDER_ID', root.createFolder('Export').getId());
    lines.push('Tạo thư mục Drive THAIPUT_V8_' + env + ' (Uploads, Backup, Export)');
  }
  if (!cfg_('LESSON_CALENDAR_ID')) {
    var cal = Calendar.Calendars.insert({ summary: 'Thaiput · Lịch học' + (env === 'PRODUCTION' ? '' : ' (' + env + ')'), timeZone: APP.TIMEZONE });
    setCfg('LESSON_CALENDAR_ID', cal.id);
    lines.push('Tạo lịch Calendar ' + cal.summary);
  }
  // Chỉ nhận link /exec (bản đã deploy). Chạy từ trình soạn thảo, Google có thể trả link /dev chỉ người sửa code mở được.
  try { var url = ScriptApp.getService().getUrl(); if (url && /\/exec$/.test(url) && !cfg_('WEBAPP_URL')) { setCfg('WEBAPP_URL', url); lines.push('Ghi WEBAPP_URL'); } } catch (e) { }

  // 6. Trigger
  lines.push('Trigger: ' + createTriggers_(ss) + ' cái');
  SpreadsheetApp.flush();
  var recLine = releaseRecord_(); if (recLine) lines.push(recLine);
  lines.push('Xong. Chạy tiếp menu 2. Kiểm tra hệ thống.');
  return { ok: true, lines: lines };
}

/**
 * Tô màu việc cần admin chú ý (chunk 5B, đổi 5N). Chạy lại an toàn: thay toàn bộ luật tô màu của các tab này.
 * Luật đầu tiên khớp thắng (Sheets), nên thứ tự trong danh sách là thứ tự ưu tiên. Màu và cách làm hết màu: PROGRESS.md mục 5N.
 *   NOTIFICATIONS: đỏ = CRITICAL chưa đọc, vàng = WARNING chưa đọc, xanh = đã tick ô read. Cột read là ô tick.
 *   REGISTRATIONS: vàng = Chờ duyệt.  AVAILABILITY: đỏ = tutor xin huỷ chờ duyệt, xám = BLOCKED.
 *   BOOKINGS (5N): đỏ = tutor quá hạn chọn kết quả, Không hoàn thành chưa xử lý; cam đậm = Chờ đổi tutor (luôn hiện);
 *     hồng = Vấn đề kỹ thuật chưa chọn lỗi; vàng = Vắng học viên chưa xử lý (BL13); xanh dương nhạt = buổi được bù; xám = Huỷ muộn.
 *     "Chưa xử lý" = admin_done_at trống hoặc cũ hơn result_at (kết quả đổi sau lần admin xử lý trước thì hiện lại).
 *   STUDENT_PACKAGES (5N): đỏ = còn thông báo COMP_ON_EXPIRED chưa đọc (chờ admin cộng tay comp_days_admin); xám = hết hạn;
 *     vàng = còn EXPIRY_NOTICE_DAYS ngày; tím = admin đã cộng tay; xanh dương = có ngày bù.
 * Vùng tô màu phủ từ hàng 2 tới hết tab; tab tự thêm hàng (Db.gs ensureRows_) thì gọi lại applyHighlightsFor_ cho tab đó.
 */
var HL_ = { RED: '#ea9999', ORANGE: '#f6b26b', PINK: '#f9d2e4', YELLOW: '#fff3cd', LIGHT_BLUE: '#cfe2f3', BLUE: '#9fc5e8',
  PURPLE: '#d9d2e9', GREEN: '#d1e7dd', GREY: '#e9ecef', SOFT_RED: '#f8d7da' };
var HIGHLIGHT_TABLES_ = ['NOTIFICATIONS', 'REGISTRATIONS', 'AVAILABILITY', 'BOOKINGS', 'STUDENT_PACKAGES'];

/** Chữ cột (A, B, ..., AA) của một cột theo tên ở hàng tiêu đề; null nếu tab không có cột đó. */
function hlColLetter_(sh, col) {
  if (!sh || sh.getLastColumn() < 1) return null;
  var i = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String).indexOf(col), out = '';
  if (i === -1) return null;
  for (var n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out;   // 27 = AA
  return out;
}

/** Luật tô màu của một tab: danh sách [công thức, màu]. {cột} là ô cùng hàng; [[TAB.cột]] là cả cột ở tab khác (qua INDIRECT). */
function highlightSpecs_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var has = function (c) { return !!hlColLetter_(sh, c); };
  if (name === 'NOTIFICATIONS') return [['={read}=TRUE', HL_.GREEN], ['=AND({level}="CRITICAL",{read}<>TRUE)', HL_.SOFT_RED], ['=AND({level}="WARNING",{read}<>TRUE)', HL_.YELLOW]];
  if (name === 'REGISTRATIONS') return [['={admin_action}="' + ADMIN_DECISION.PENDING + '"', HL_.YELLOW]];
  if (name === 'AVAILABILITY') return [['={status}="CANCEL_PENDING"', HL_.SOFT_RED], ['={status}="BLOCKED"', HL_.GREY]];
  if (name === 'BOOKINGS') {
    // Thiếu cột (chưa chạy menu 1 sau khi dán code): dùng luật cũ, không viết công thức trỏ vào cột không có.
    var open = has('admin_done_at') ? 'OR({admin_done_at}="",{admin_done_at}<{result_at})' : 'TRUE';
    var red = [];
    if (has('result_notice_at')) red.push('AND({status}="CONFIRMED",{result_notice_at}<>"")');
    red.push('AND({status}="NOT_COMPLETED",' + open + ')');
    return [
      ['=OR(' + red.join(',') + ')', HL_.RED],
      ['={status}="PENDING_REASSIGN"', HL_.ORANGE],
      [has('tech_decided_at') ? '=AND({status}="TECH_ISSUE",{tech_decided_at}="")' : '={status}="TECH_ISSUE"', HL_.PINK],
      ['=AND({status}="STUDENT_ABSENT",' + open + ')', HL_.YELLOW],
      has('comp_days') ? ['=N({comp_days})>0', HL_.LIGHT_BLUE] : null,
      ['={status}="CANCELLED_LATE"', HL_.GREY]
    ].filter(Boolean);
  }
  if (name === 'STUDENT_PACKAGES') {
    var nt = ss.getSheetByName('NOTIFICATIONS'), canNotif = nt && hlColLetter_(nt, 'entity_id') && hlColLetter_(nt, 'event') && hlColLetter_(nt, 'read');
    return [
      canNotif ? ['=COUNTIFS([[NOTIFICATIONS.entity_id]],{sp_id},[[NOTIFICATIONS.event]],"COMP_ON_EXPIRED",[[NOTIFICATIONS.read]],"<>TRUE")>0', HL_.RED] : null,
      ['={status}="' + PKG_STATUS.EXPIRED + '"', HL_.GREY],
      ['=AND({status}="' + PKG_STATUS.ACTIVE + '",{end_date}<>"",{end_date}>=TODAY(),{end_date}-TODAY()<=' + Number(cfg_('EXPIRY_NOTICE_DAYS')) + ')', HL_.YELLOW],
      has('comp_days_admin') ? ['=N({comp_days_admin})<>0', HL_.PURPLE] : null,
      has('comp_days') ? ['=N({comp_days})>0', HL_.BLUE] : null
    ].filter(Boolean);
  }
  return [];
}

/** Đặt lại luật tô màu một tab, vùng từ hàng 2 tới hết tab. */
function applyHighlightsFor_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh || sh.getMaxRows() < 2) return 0;
  var range = sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getLastColumn());
  var rules = highlightSpecs_(ss, name).map(function (sp) {
    var f = sp[0].replace(/\[\[(\w+)\.(\w+)\]\]/g, function (m, tab, c) { var l = hlColLetter_(ss.getSheetByName(tab), c); return 'INDIRECT("' + tab + '!$' + l + '$2:$' + l + '")'; })
      .replace(/\{(\w+)\}/g, function (m, c) { return '$' + hlColLetter_(sh, c) + '2'; });
    return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f).setBackground(sp[1]).setRanges([range]).build();
  });
  sh.setConditionalFormatRules(rules);
  return rules.length;
}

function applyHighlights_(ss) {
  HIGHLIGHT_TABLES_.forEach(function (name) { applyHighlightsFor_(ss, name); });
  // Ô tick cột read: chỉ đặt cho hàng có dữ liệu (Db.gs tự đặt cho hàng mới). Bản 5B từng đặt cả cột: gỡ, và xoá FALSE ở hàng trống.
  var nt = ss.getSheetByName('NOTIFICATIONS');
  if (nt) {
    var hdr = nt.getRange(1, 1, 1, nt.getLastColumn()).getValues()[0].map(String), ci = hdr.indexOf('read') + 1, ii = hdr.indexOf('notif_id') + 1;
    if (ci > 0 && nt.getMaxRows() > 1) {
      nt.getRange(2, ci, nt.getMaxRows() - 1, 1).setDataValidation(null);
      var last = nt.getLastRow();
      if (last >= 2) {
        var ids = nt.getRange(2, ii, last - 1, 1).getValues(), reads = nt.getRange(2, ci, last - 1, 1).getValues(), dataRows = 0;
        for (var r = 0; r < ids.length; r++) { if (String(ids[r][0]) === '') { if (reads[r][0] === false) nt.getRange(r + 2, ci).clearContent(); } else dataRows = r + 1; }
        if (dataRows) nt.getRange(2, ci, dataRows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      }
    }
  }
}

/**
 * Đưa chữ web và mẫu email gốc vào 2 tab (chunk 5C, song ngữ 5H). Dòng CONTENT đã có: giữ nguyên chữ admin đã sửa (vi, en, note),
 * chỉ ghi lại các cột code quản lý. Dòng chưa có: thêm với chữ gốc, admin thấy và sửa trực tiếp.
 */
function seedContent_() {
  return withLock_(function () {
  var ct = table_('CONTENT'), et = table_('EMAIL_TEMPLATES'), nc = 0, ne = 0, nm = 0, nu = 0;
  var defs = contentDefaults_();
  // Chunk 5H: dòng chưa có thì thêm với chữ gốc ở cả cột vi và en (admin sửa thẳng trong ô). Dòng đã có: chỉ ghi lại các
  // cột code quản lý (page, position, shown_when, default_vi, default_en), không đụng chữ admin đã sửa.
  Object.keys(defs).forEach(function (k) {
    var d = defs[k], r = ct.byId(k), meta = { page: d.page, position: d.position, shown_when: d.shown_when, default_vi: d.vi, default_en: d.en };
    if (!r) { ct.insert(Object.assign({ key: k, vi: d.vi, en: d.en, note: '' }, meta)); nc++; return; }
    var patch = {}; Object.keys(meta).forEach(function (c) { if (String(r[c] === undefined || r[c] === null ? '' : r[c]) !== meta[c]) patch[c] = meta[c]; });
    // Chunk 5J: chữ gốc đổi mà ô vi hoặc en còn đúng chữ gốc cũ (admin chưa sửa): thay bằng chữ gốc mới. Ô admin đã sửa giữ nguyên.
    [['vi', 'default_vi'], ['en', 'default_en']].forEach(function (x) { var cur = String(r[x[0]] || ''), old = String(r[x[1]] || ''); if (old && cur === old && old !== meta[x[1]]) { patch[x[0]] = meta[x[1]]; nu++; } });
    if (Object.keys(patch).length) ct.update(r, patch);
  });
  Object.keys(DEFAULT_EMAIL_TEMPLATES_).forEach(function (k) {
    var cur = et.byId(k);
    if (cur && TEMPLATE_UPGRADES_[k]) {
      var up = {}, olds = TEMPLATE_UPGRADES_[k], dd = DEFAULT_EMAIL_TEMPLATES_[k];
      Object.keys(olds).forEach(function (c) { if (String(cur[c]) === olds[c]) up[c] = dd[TEMPLATE_COLS_.indexOf(c)]; });
      if (Object.keys(up).length) { et.update(cur, up); nu++; }
    }
    if (cur) return;
    var d = DEFAULT_EMAIL_TEMPLATES_[k];
    et.insert({ key: k, audience: d[0], active: true, subject_vi: d[1], title_vi: d[2], body_vi: d[3], subject_en: d[4], title_en: d[5], body_en: d[6], variables: d[7], note: '' });
    ne++;
  });
  // Email marketing: một dòng ví dụ khi tab còn trống, để admin thấy cách viết (DRAFT: menu gửi từ chối).
  var mt = table_('MARKETING_EMAILS');
  if (!mt.all().length) { mt.insert(MARKETING_EXAMPLE_); nm++; }
  clearContentCache_();
  return { content: nc, templates: ne, marketing: nm, upgraded: nu };
  });
}

/**
 * Chunk 5M, lớp 1: bảo vệ kiểu cảnh báo cho cột hệ thống của STUDENT_PACKAGES (Google hỏi lại trước khi sửa). Không chặn cứng được
 * chủ file; lớp 2 (onEdit trả lại) và lớp 3 (hourlyJob tự lành) lo phần còn lại. Chạy lại an toàn: gỡ bảo vệ cũ của hệ thống trước.
 */
var PKG_PROTECT_DESC_ = 'thaiput: ô hệ thống, không sửa tay';
function protectPackageCols_(ss, lines) {
  try {
    var sh = ss.getSheetByName('STUDENT_PACKAGES');
    if (!sh || !sh.protect) return;
    sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { if (p.getDescription() === PKG_PROTECT_DESC_) p.remove(); });
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), n = 0;
    PKG_SYSTEM_COLS_.forEach(function (c) {
      var i = hdr.indexOf(c) + 1;
      if (!i) return;
      // Vùng mở cả cột (ví dụ E2:E) để hàng thêm sau cũng được bảo vệ (soát kỹ thuật L9).
      var L = colLetter_(i);
      sh.getRange(L + '2:' + L).protect().setDescription(PKG_PROTECT_DESC_).setWarningOnly(true); n++;
    });
    if (n && lines) lines.push('Bảo vệ kiểu cảnh báo ' + n + ' cột hệ thống của STUDENT_PACKAGES');
  } catch (e) { if (lines) lines.push('LƯU Ý: không đặt được bảo vệ cột STUDENT_PACKAGES (' + e.message + '); onEdit vẫn trả lại giá trị'); }
}

/** Cột có dropdown cho admin chọn (REGISTRATIONS.admin_action, AVAILABILITY.admin_decision, BOOKINGS.admin_action). */
function dropdownSpec_() {
  var d = [ADMIN_DECISION.PENDING, ADMIN_DECISION.APPROVE, ADMIN_DECISION.REJECT], T = TUTOR_CANCEL_DECISION;
  return { REGISTRATIONS: { admin_action: d }, AVAILABILITY: { admin_decision: [T.PENDING, T.AUTO, T.ASSIGN, T.CANCEL, T.REJECT] }   /* 5K: bỏ 'Duyệt' khỏi danh sách; ô cũ ghi 'Duyệt' vẫn hiểu như tự chọn tutor thay */,
    BOOKINGS: { admin_action: BOOKING_ADMIN_ACTIONS }, EMAIL_TEMPLATES: { audience: ['STUDENT', 'TUTOR', 'ADMIN', 'ALL', 'MARKETING'] },
    MARKETING_EMAILS: { status: MARKETING_STATUSES_, audience: Object.keys(MARKETING_AUDIENCES_) }, USERS: { lang: LANGS_ }, NOTIFY_RULES: { level: ['CRITICAL', 'WARNING', 'INFO'], channel: ['EMAIL', 'DIGEST', 'LOG'] } };
}

/** Đặt dropdown cho n hàng bắt đầu từ fromRow. Db.gs gọi lại khi tự thêm hàng để hàng mới vẫn có dropdown. */
function applyDropdowns_(sh, tableName, fromRow, n) {
  var spec = dropdownSpec_()[tableName];
  if (!spec || n <= 0) return;
  var full = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  Object.keys(spec).forEach(function (col) {
    var i = full.indexOf(col);
    if (i === -1) return;
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(spec[col], true).setAllowInvalid(false).build();
    sh.getRange(fromRow, i + 1, n, 1).setDataValidation(rule);
  });
}

/** Xoá trigger cũ của hệ thống rồi tạo lại đúng TRIGGER_COUNT_ cái (chạy lại an toàn, không tạo trùng). */
function createTriggers_(ss) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('reminderJob').timeBased().everyMinutes(15).create();
  // Hàng đợi Calendar (chunk 5F). Không có việc thì thoát ngay, không mở Sheets (xem CalendarQueue.gs).
  ScriptApp.newTrigger('calendarJob').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('hourlyJob').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(6).inTimezone(APP.TIMEZONE).create();
  ScriptApp.newTrigger('nightlyBackup').timeBased().everyDays(1).atHour(2).inTimezone(APP.TIMEZONE).create();
  ScriptApp.newTrigger('weeklyExport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(3).inTimezone(APP.TIMEZONE).create();
  ScriptApp.newTrigger('onEditInstallable').forSpreadsheet(ss || SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('onChangeInstallable').forSpreadsheet(ss || SpreadsheetApp.getActive()).onChange().create();
  saveSheetSnapshot_(ss);   // danh sách tab để trigger onChange biết đúng tab bị xoá, đổi tên (soát 5I vòng 2 N3)
  return ScriptApp.getProjectTriggers().filter(function (t) { return TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1; }).length;
}

/** Kiểm tra toàn bộ cấu hình. Trả { errors, warnings, lines }. */
function testSystem(e) { requireOperator_(e);
  var errors = [], warnings = [], lines = [];
  var ok = function (m) { lines.push('ĐẠT  ' + m); };
  var err = function (m) { errors.push(m); lines.push('LỖI  ' + m); };
  var warn = function (m) { warnings.push(m); lines.push('LƯU Ý  ' + m); };
  clearDbCache_(); clearConfigCache_(); clearNowCache_();
  var ss;
  try { ss = dbSpreadsheet_(); ok('Mở được file DB (' + getEnv_() + ')'); } catch (e) { err(e.message); return { errors: errors, warnings: warnings, lines: lines }; }
  Object.keys(SCHEMA).forEach(function (t) { try { table_(t); } catch (e) { err(e.message); } });
  if (!errors.length) ok('Đủ ' + Object.keys(SCHEMA).length + ' tab và cột');
  if (Session.getScriptTimeZone() !== APP.TIMEZONE) err('Múi giờ Apps Script là ' + Session.getScriptTimeZone() + ', phải là ' + APP.TIMEZONE + ' (Project Settings)'); else ok('Múi giờ Apps Script đúng');
  try { if (ss.getSpreadsheetTimeZone() !== APP.TIMEZONE) err('Múi giờ file Sheets sai: File > Settings > Time zone'); else ok('Múi giờ file Sheets đúng'); } catch (e) { }
  // Chunk 5J: lịch tutor dạng THỨ GIỜ hợp lệ; đăng nhập Google cho admin là đường chính.
  var sch = tutorSchedule_();
  if (sch.errors.length) sch.errors.forEach(function (x) { err(x + ' (đang dùng mặc định)'); });
  else ok('Lịch tutor: nhắc ' + cfgList_('TUTOR_REMIND_AT').join(', ') + ', hạn mở lịch ' + cfg_('TUTOR_DEADLINE_AT') + ', thông báo học viên từ ' + cfg_('STUDENT_WEEK_BANNER_FROM'));
  var glUrl = String(cfg_('GOOGLE_LOGIN_URL') || ''), glKey = !!props_().getProperty('GOOGLE_LOGIN_SECRET');
  if (!glUrl || !glKey) warn('Đăng nhập Google cho admin chưa cài xong (' + (!glUrl ? 'GOOGLE_LOGIN_URL trống' : '') + (!glUrl && !glKey ? ', ' : '') + (!glKey ? 'chưa tạo khoá bí mật: menu Đăng nhập Google' : '') + '). Admin đang đăng nhập bằng link email ' + linkMinutesFor_({ role: 'ADMIN' }) + ' phút');
  else ok('Đăng nhập Google cho admin đã cài' + (cfg_('ADMIN_LINK_LOGIN') ? ' (link email dự phòng đang bật: ADMIN_LINK_LOGIN)' : ''));
  // 5K (BL06): gói đang bán có giá 0 không chọn được trên web (chỉ nút Zalo). Không còn gói có giá thì không ai đăng ký được.
  try {
    var dfs = pkgDefs_(), sale = Object.keys(dfs).filter(function (k) { return dfs[k].active; });
    var free = sale.filter(function (k) { return !(dfs[k].price_vnd > 0); });
    if (sale.length && free.length === sale.length) warn('QUAN TRỌNG: mọi gói đang bán đều có giá 0 trong PACKAGES, trang đăng ký không có gói nào chọn được (chỉ nút Zalo). Điền price_vnd cho gói bán trên web');
    else if (free.length) warn('Gói đang bán có giá 0 (chỉ đăng ký qua Zalo, không chọn được trên web): ' + free.join(', '));
    if (free.length && !String(cfg_('ADMIN_ZALO_URL') || '').trim()) warn('Có gói giá 0 nhưng ADMIN_ZALO_URL trống: gói đó không có nút Zalo');
  } catch (pe) { }
  var calId = cfg_('LESSON_CALENDAR_ID');
  if (!calId) err('Thiếu LESSON_CALENDAR_ID: chạy lại Cài đặt lần đầu');
  else { try { var tz = Calendar.Calendars.get(calId).timeZone; if (tz !== APP.TIMEZONE) err('Múi giờ lịch Calendar là ' + tz); else ok('Lịch Calendar đúng múi giờ'); } catch (e) { err('Không mở được lịch Calendar: ' + e.message + ' (bật dịch vụ Calendar trong Services)'); } }
  ['UPLOADS_FOLDER_ID', 'BACKUP_FOLDER_ID', 'EXPORT_FOLDER_ID'].forEach(function (k) {
    try { DriveApp.getFolderById(cfg_(k)); } catch (e) { err('Thư mục ' + k + ' không mở được'); }
  });
  var trig = ScriptApp.getProjectTriggers().filter(function (t) { return TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1; }).length;
  if (trig !== TRIGGER_COUNT_) err('Có ' + trig + '/' + TRIGGER_COUNT_ + ' trigger: chạy menu 3. Tạo lại trigger'); else ok('Đủ ' + TRIGGER_COUNT_ + ' trigger');
  if (!cfg_('ADMIN_EMAIL')) err('Thiếu ADMIN_EMAIL trong CONFIG');
  var nSlots = 0; try { nSlots = slotList_().length; } catch (e) { }
  if (!nSlots) err('Khung giờ SLOT_START, SLOT_LAST trong CONFIG không đọc được: sửa lại dạng 08:00 và 23:30 (ô định dạng văn bản)'); else ok('Có ' + nSlots + ' slot mỗi ngày (' + cfg_('SLOT_START') + ' đến ' + cfg_('SLOT_LAST') + ')');
  if (!cfg_('ADMIN_ZALO_URL') || !cfg_('ADMIN_PHONE')) warn('Chưa điền ADMIN_ZALO_URL hoặc ADMIN_PHONE: nút liên hệ admin sẽ ẩn');
  var wurl = String(cfg_('WEBAPP_URL') || '');
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(wurl)) err('WEBAPP_URL chưa đúng (đang là "' + wurl + '"): Deploy > Manage deployments, chép link kết thúc bằng /exec vào CONFIG. Link đăng nhập trong email dùng link này, không dùng link Google Sites.');
  else ok('WEBAPP_URL là link /exec');
  // Link hiện trên trang web: chỉ https mới hiện (trang tự ẩn link khác để chống chèn mã), nên báo trước cho admin.
  ['ADMIN_ZALO_URL', 'SCHOOL_SITE_URL', 'POLICY_URL', 'GOOGLE_LOGIN_URL'].forEach(function (k) { var v = String(cfg_(k) || ''); if (v && !/^https:\/\/[^\s"'<>]+$/i.test(v)) warn(k + ' không bắt đầu bằng https:// nên trang web sẽ ẩn link này: ' + v); });
  if (!cfg_('BANK_ACCOUNT')) warn('Chưa điền thông tin ngân hàng (BANK_NAME, BANK_ACCOUNT, BANK_HOLDER)');
  // 5L: kiểm mọi dòng PACKAGES (mã trùng, kiểu, số ngày, số buổi, giá).
  try { var pi = packageIssues_(table_('PACKAGES').all()); pi.errors.forEach(err); pi.warnings.forEach(warn); if (!pi.errors.length) ok('PACKAGES: ' + table_('PACKAGES').all().length + ' dòng hợp lệ'); } catch (pe2) { err('Kiểm PACKAGES lỗi: ' + pe2.message); }
  if (!activeTutors_().length) warn('Chưa có tutor: dùng menu Thêm tutor');
  if (cfg_('MEET_MODE') === 'TUTOR_ROOM' && activeTutors_().some(function (t) { return t.status === USER_STATUS.ACTIVE && !t.meet_room; })) err('MEET_MODE = TUTOR_ROOM nhưng có tutor chưa có meet_room');
  try { if (props_().getProperty('SIM_NOW')) warn('Đang bật giả lập thời gian: ' + fmtDateTime_(getNow_())); } catch (e) { }
  // Chunk 5G
  try { var mm = maintMode_(); if (mm !== 'OFF') warn('Đang BẢO TRÌ (' + mm + '): học viên, tutor ' + (mm === 'CLOSED' ? 'không vào được cổng' : 'chỉ xem được') + '. Tắt: menu Bảo trì: tắt'); } catch (e) { }
  try {
    if (props_().getProperty('LOADTEST_SECRET')) { if (isProduction_()) err('PRODUCTION có khoá thử tải: chạy switchToProduction lại hoặc xoá Script Property LOADTEST_SECRET'); else if (loadTestOn_()) warn('Cổng thử tải đang mở (tự đóng lúc ' + fmtDateTime_(new Date(Number(props_().getProperty('LOADTEST_UNTIL')))) + ')'); }
  } catch (e) { }
  try { var opn = ARCHIVE_TABS_.filter(function (t) { return props_().getProperty('ARCH_OPEN_' + t); }); if (opn.length) warn('Lưu trữ có lô dở ở ' + opn.join(', ') + ': lượt lưu trữ sau tự hoàn tất (hoặc menu Lưu trữ: chạy ngay)'); } catch (e) { }
  if (cfg_('ARCHIVE_FOLDER_ID')) { try { if (DriveApp.getFolderById(cfg_('ARCHIVE_FOLDER_ID')).isTrashed()) err('Thư mục lưu trữ (ARCHIVE_FOLDER_ID) đang ở thùng rác: khôi phục ngay (Google xoá hẳn sau 30 ngày)'); } catch (e) { err('Thư mục ARCHIVE_FOLDER_ID không mở được: lưu trữ sẽ dừng'); } }
  try { var apr = props_().getProperties(); Object.keys(apr).forEach(function (k) {
    if (k.indexOf('ARCH_FILE_' + getEnv_() + '_') === 0) { try { if (DriveApp.getFileById(apr[k]).isTrashed()) err('File lưu trữ năm ' + k.split('_').pop() + ' đang ở thùng rác: khôi phục ngay'); } catch (fe) { err('Không mở được file lưu trữ năm ' + k.split('_').pop()); } }
    if (k.indexOf('PURGE_OPEN_') === 0) warn('Tab ' + k.substring(11) + ' có lần bỏ dòng dở: job mỗi giờ tự dọn (hoặc chạy hourlyJob)');
  }); } catch (e) { }
  try { var bk = table_('BOOKINGS').all().length; if (bk > 15000) warn('BOOKINGS có ' + bk + ' dòng: kiểm ARCHIVE_ENABLED, ARCHIVE_KEEP_MONTHS (đặt lịch chậm dần khi tab lớn)'); } catch (e) { }
  // Chunk 5I: hạn mức email kèm giải thích (Workspace dùng thử chỉ khoảng 100, không phải 1.500).
  // Chunk 5Q: đường gửi email và tài khoản gửi. Trigger gửi thư dưới tài khoản đã chạy menu 3, trang web dưới tài khoản đã Triển khai.
  try {
    var mb = mailBudget_(), snd = mailSender_(), adm = (cfgList_('ADMIN_EMAIL')[0] || '').toLowerCase();
    lines.push('Đường gửi email: ' + mailTransport_() + (String(cfg_('MAIL_TRANSPORT') || '').trim() && String(cfg_('MAIL_TRANSPORT')).trim().toUpperCase() !== mailTransport_() ? ' (ô MAIL_TRANSPORT gõ sai, đang dùng mặc định)' : ''));
    if (mailTransport_() === 'MAILAPP') warn('MAIL_TRANSPORT = MAILAPP: thư từng bị trả về trên tên miền của trường. Chỉ dùng khi GMAILAPP hỏng; sửa xong đổi lại GMAILAPP.');
    if (snd && adm && snd.toLowerCase() !== adm) warn('Menu đang chạy bằng ' + snd + ', khác ADMIN_EMAIL (' + adm + '). Trigger gửi thư từ tài khoản đã chạy menu 3, trang web từ tài khoản đã Triển khai: hai việc này phải làm bằng cùng một tài khoản chủ hệ thống. Cố ý để ADMIN_EMAIL là hộp thư khác thì bỏ qua dòng này.');
    // 5Q: file MailFix.gs cũ còn trong dự án thì testMailFix là hàm công khai không kiểm quyền (trang web mở cho mọi người, luật 24).
    if (typeof testMailFix === 'function' || typeof sendEmailFix_ === 'function') err('Dự án Apps Script còn file MailFix.gs cũ: xoá file đó ngay (từ 8.1.4 gửi email cố định, không cần MailFix, không tìm và thay).');
    if (mb < 0) warn('Không đọc được hạn mức email (Google chưa cấp quyền gửi thư): chạy menu Email → Kiểm tra gửi email để cấp quyền.');
    else { var qi = mailQuotaInfo_(mb, mailSentToday_(), snd); qi.lines.forEach(function (l) { lines.push(l); }); qi.warnings.forEach(warn); }
  } catch (e) { }
  return { errors: errors, warnings: warnings, lines: lines };
}
function pkgDefsList_() { var d = pkgDefs_(); return Object.keys(d).map(function (k) { return d[k]; }); }

/** Chunk 5L: xoá dòng PACKAGES mã LEGACY khi không còn STUDENT_PACKAGES nào dùng (anh xác nhận không có). Ghi PACKAGE_REMOVED. */
function removeLegacyPackage_(lines) { return withLock_(function () {
  var pk = table_('PACKAGES');
  if (!pk.all().some(function (p) { return String(p.code).trim() === 'LEGACY'; })) return 0;
  var used = table_('STUDENT_PACKAGES').all().filter(function (sp) { return String(sp.package_code).trim() === 'LEGACY'; }).length;
  if (used) { lines.push('CHÚ Ý: còn ' + used + ' gói học viên mang mã LEGACY nên chưa xoá dòng gói LEGACY'); return 0; }
  var n = purgeRows_('PACKAGES', function (p) { return String(p.code).trim() !== 'LEGACY'; });
  if (n) { logActivity_(adminActor_(), 'PACKAGE_REMOVED', 'PACKAGES', 'LEGACY', ''); lines.push('Xoá dòng gói LEGACY (không còn học viên dùng)'); }
  return n;
}); }

// ── SystemMove.gs ──
/**
 * SystemMove.gs · Chuyển sang hệ thống mới, đổi tài khoản admin@ (chunk 5L, plan/TRA_LOI_01_11.md mục 6)
 *
 * Giới hạn của Google: dự án Apps Script mới có link web app mới (dùng link rút gọn SHORT_URL_* để học viên không phải đổi
 * link); Script Properties của dự án cũ không đọc được từ dự án mới; trigger gắn với người tạo; sự kiện Calendar nằm trên lịch
 * của tài khoản cũ. Vì vậy chuyển theo 4 bước, hệ thống mới CHỈ ĐỌC file cũ:
 *
 *   Bước 1 (hệ thống CŨ) "Chuẩn bị chuyển": đóng cổng (bảo trì CLOSED, trang báo link mới), gỡ sự kiện Calendar các buổi sắp
 *     tới (bước A cũ), xoá trigger (job cũ không gửi thư trùng), ghi tab META (phiên bản, mốc mã tự sinh, giờ chuẩn bị).
 *   Bước 2 (hệ thống MỚI, đã chạy menu 1) "Chạy thử": đọc file cũ, đếm từng tab sẽ chép, mã gói còn thiếu; không ghi gì.
 *   Bước 3 (hệ thống MỚI) "Chép thật": chép theo mã (chạy lại không nhân đôi), ghép cột theo TÊN, ghi qua lớp ghi chuẩn (định
 *     dạng chữ, công thức link Zalo), mỗi tab một khoá, có mốc chạy tiếp khi gần hết 6 phút; nâng mốc mã tự sinh theo META;
 *     đếm lại; ghi SYSTEM_IMPORTED. Không chép AUTH (mọi người đăng nhập lại), nhật ký, thông báo (đã nằm trong file lưu trữ).
 *   Bước 4 (hệ thống MỚI) "Tạo lại sự kiện các buổi sắp tới" (bước B cũ), menu 3 (trigger), rồi đổi đích link rút gọn.
 *
 * Menu 1 cũng ghi META mỗi lần chạy, để file nào cũng có số phiên bản và mốc mã mới nhất.
 */

/** Tab và cách chép. insert: dòng mới theo mã, mã đã có thì bỏ qua; upsert: có thì ghi đè bằng bản cũ; cells: chỉ chép các cột
 *  admin sửa (dòng hệ thống mới tự có sau menu 1); config: chép giá trị, bỏ khoá hạ tầng; ledger: chỉ dòng email marketing. */
var MOVE_TABS_ = [
  { tab: 'PACKAGES', mode: 'upsert' },
  { tab: 'USERS', mode: 'insert' },
  { tab: 'STUDENT_PACKAGES', mode: 'insert' },
  { tab: 'REGISTRATIONS', mode: 'insert' },
  { tab: 'PAYMENTS', mode: 'insert' },
  { tab: 'BOOKINGS', mode: 'insert' },
  { tab: 'AVAILABILITY', mode: 'insert', fromToday: true },
  { tab: 'MARKETING_EMAILS', mode: 'upsert' },
  { tab: 'MAIL_LOG', mode: 'ledger' },
  { tab: 'NOTIFICATIONS', mode: 'notice' },   // soát 5L L8: thông báo Khẩn, Cần xử lý chưa đọc (cấp mã mới, bỏ link dòng cũ)
  { tab: 'CONTENT', mode: 'cells', cols: ['vi', 'en', 'note'] },
  { tab: 'EMAIL_TEMPLATES', mode: 'cells', cols: ['active', 'subject_vi', 'title_vi', 'body_vi', 'subject_en', 'title_en', 'body_en', 'note'] },
  { tab: 'NOTIFY_RULES', mode: 'cells', cols: ['level', 'channel', 'note'] },
  { tab: 'CONFIG', mode: 'config' }
];
/** Khoá CONFIG của riêng từng hệ thống: không chép (thư mục, lịch, link, bảo trì, email admin của tài khoản mới). */
var MOVE_CONFIG_SKIP_ = ['LESSON_CALENDAR_ID', 'UPLOADS_FOLDER_ID', 'BACKUP_FOLDER_ID', 'EXPORT_FOLDER_ID', 'ARCHIVE_FOLDER_ID', 'WEBAPP_URL',
  'GOOGLE_LOGIN_URL', 'MAINTENANCE_MODE', 'MAINTENANCE_UNTIL', 'MOVED_TO_URL', 'ALLOW_DATA_RESET', 'ADMIN_EMAIL'];
/** Soát 5L H1: cột nhận dạng của từng tab. Mã đã có ở hệ thống mới mà các cột này khác: hai dòng khác nhau trùng mã, dừng. */
var MOVE_KEY_FIELDS_ = { USERS: ['email', 'role'], STUDENT_PACKAGES: ['student_id', 'package_code'], REGISTRATIONS: ['email', 'package_code'],
  PAYMENTS: ['student_id', 'package_code', 'amount_vnd'], BOOKINGS: ['student_id', 'date', 'slot'], AVAILABILITY: ['tutor_id', 'date', 'slot'] };
var MOVE_TIME_BUDGET_MS_ = 270000;   // không bắt đầu tab mới sau 4,5 phút (giới hạn 6 phút mỗi lượt chạy)

/** Bảng mã tự sinh theo tab (để ghi META và nâng mốc ở hệ thống mới). */
// Soát 5L L6: không ghi mốc cho USERS (S, T, A dùng chung một tab; USERS không bao giờ bị lưu trữ, chép đủ nên số lớn nhất tự đúng).
function idFloorTabs_() { return Object.keys(ID_FORMAT).filter(function (k) { return k.indexOf('USERS') !== 0; }); }
function maxIdInTab_(tab) {
  var t = table_(tab), key = t.schema.id, max = 0;
  Object.keys(ID_FORMAT).forEach(function (k) {
    if ((k.indexOf('USERS') === 0 ? 'USERS' : k) !== tab) return;
    var re = new RegExp('^' + ID_FORMAT[k][0] + '(\\d+)$');
    t.rows.forEach(function (r) { var m = String(r[key]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  });
  return Math.max(max, idFloor_(tab));
}

/** Ghi tab META (gọi trong withLock_). extra: { khoá: giá trị } ghi thêm. */
function writeMetaInLock_(extra) {
  var t = table_('META'), set = function (k, v, note) { var r = t.byId(k); if (r) t.update(r, { value: String(v) }); else t.insert({ key: k, value: String(v), note: note || '' }); };
  set('APP_VERSION', APP.VERSION, 'Phiên bản code lần chạy menu 1 gần nhất');
  set('ENV', getEnv_(), 'Môi trường');
  set('META_AT', fmtDateTime_(getNow_()), 'Lần ghi META gần nhất');
  idFloorTabs_().forEach(function (tab) { set('ID_FLOOR_' + tab, maxIdInTab_(tab), 'Số lớn nhất đã cấp cho mã tự sinh của ' + tab + ' (kể cả dòng đã lưu trữ)'); });
  migrationStatus_().forEach(function (m) { if (m.done) set(m.id, 'DONE', m.label); });
  Object.keys(extra || {}).forEach(function (k) { set(k, extra[k], ''); });
}

/** So phiên bản dạng 8.1.3: trả âm, 0, dương. */
function cmpVersion_(a, b) {
  var x = String(a || '0').split('.'), y = String(b || '0').split('.');
  for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (Number(x[i]) || 0) - (Number(y[i]) || 0); if (d) return d; }
  return 0;
}

/**
 * Chunk 5L mục 6: các bước chuyển dữ liệu theo phiên bản. Mỗi bước chạy đúng MỘT lần ở menu 1 (đánh dấu ở Script Properties,
 * chép sang META để hệ thống mới biết). Menu 1 luôn sao lưu vào Releases trước (Release.gs). Menu "Cập nhật phiên bản: các
 * bước chuyển dữ liệu" chỉ đọc: bước nào đã chạy, bước nào sẽ chạy ở lần menu 1 tới; bước 5M có menu xem trước riêng.
 */
var MIGRATION_STEPS_ = [
  { id: 'MIG_MORNING_OFF', label: 'Tắt email nhắc buổi sáng (bản 8.0.x)' },
  { id: 'MIG_1610', label: 'Calendar QUEUE, phiên tutor 30 ngày (16/10)' },
  { id: 'MIG_5M', label: 'Luật bù buổi 8.1.0: chuyển buổi kỹ thuật cũ, tính lại gói (xem trước: menu Bù buổi 8.1.0)' }
];
function migrationStatus_() {
  var props = props_();
  return MIGRATION_STEPS_.map(function (m) { return { id: m.id, label: m.label, done: !!props.getProperty(m.id) }; });
}
function menuMigrationStatus(e) { requireOperator_(e);
  var st = migrationStatus_();
  alert_('Các bước chuyển dữ liệu theo phiên bản (' + APP.VERSION + '), chỉ đọc:\n\n' + st.map(function (m) { return (m.done ? 'ĐÃ CHẠY   ' : 'SẼ CHẠY ở lần menu 1 tới   ') + m.label; }).join('\n') +
    '\n\nMỗi bước chạy đúng một lần. Menu 1 sao lưu file vào thư mục Releases trước khi chạy.');
  return st;
}

// ── Bước 1: hệ thống cũ ──
function prepareMoveOld_(opts, actor) {
  opts = opts || {};
  var url = String(opts.newUrl || '').trim();
  if (url && !/^https:\/\/[^\s"'<>]+$/i.test(url)) return { ok: false, reason: REASONS.INVALID_INPUT, error: 'Link mới phải bắt đầu bằng https://' };
  withLock_(function () {
    var t = table_('CONFIG'), set = function (k, v) { var r = t.byId(k); if (r) t.update(r, { value: v }); else t.insert({ key: k, value: v, note: '' }); };
    set('MAINTENANCE_MODE', 'CLOSED');
    set('MOVED_TO_URL', url);
    logActivity_(actor, 'MAINTENANCE_CLOSED', 'CONFIG', 'MAINTENANCE_MODE', '');
  });
  clearConfigCache_();
  var det = detachFutureEvents_(actor);
  var removed = deleteSystemTriggers_();
  withLock_(function () {
    // Soát 5L L7: mốc việc theo tuần (nhắc tutor, báo chưa mở lịch) đi theo dữ liệu, để hệ thống mới không gửi lại.
    var ex = { PREPARED_AT: fmtDateTime_(getNow_()), PREPARED_BY: actor, NEW_URL: url }, pp = props_().getProperties();
    Object.keys(pp).forEach(function (k) { if (/^DONE_(TREMIND|TREMTRY|NOAVAILW|NOAVAIL)/.test(k)) ex['PROP_' + k] = pp[k]; });
    writeMetaInLock_(ex);
    logActivity_(actor, 'SYSTEM_MOVE_PREPARED', 'SYSTEM', APP.VERSION, { events: det.removed, triggers: removed, url: url });
  });
  return { ok: true, events: det.removed, triggers: removed, url: url };
}

/** Xoá trigger hệ thống của dự án này (bước 1, và menu "Tắt hết trigger" cho STAGING khi PRODUCTION chạy chính thức). */
function deleteSystemTriggers_() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) { if (TRIGGER_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1) { ScriptApp.deleteTrigger(t); n++; } });
  return n;
}

// ── Bước 2, 3: hệ thống mới ──
/** Đọc một tab của file cũ thành mảng object theo tên cột (chuẩn hoá như Db.gs đọc). Tab không có: null. */
function readOldTab_(ss, tab) {
  var sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() < 2) return sh ? [] : null;
  var vals = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues(), head = vals[0].map(function (h) { return String(h).trim(); }), sc = SCHEMA[tab];
  return vals.slice(1).filter(function (line) { return line.some(function (v) { return v !== '' && v !== null; }); }).map(function (line) {
    var o = {};
    sc.cols.forEach(function (c) { var j = head.indexOf(c); if (j !== -1) o[c] = normalizeCell_(sc, c, line[j]); });
    // Soát 5L M3: ô CONFIG Sheets đã đổi thành giờ (08:00 thành ngày giờ): sửa như cfg_ trước khi chép.
    if (tab === 'CONFIG' && head.indexOf('value') !== -1 && DEFAULTS_.hasOwnProperty(String(o.key).trim())) {
      var cv = coerceCfg_(line[head.indexOf('value')], DEFAULTS_[String(o.key).trim()]);
      o.value = cv === true ? 'TRUE' : cv === false ? 'FALSE' : String(cv);
    }
    return o;
  });
}

/** Mở file cũ và kiểm: đọc được, có META, đã "Chuẩn bị chuyển", phiên bản không mới hơn bản này. */
function openOldSystem_(oldId, requirePrepared) {
  var id = String(oldId || '').trim().replace(/^.*\/d\/([^/]+).*$/, '$1');
  if (!id) return { ok: false, error: 'Chưa nhập mã file DB cũ' };
  if (id === dbSpreadsheet_().getId()) return { ok: false, error: 'Đây là file DB của chính hệ thống này, không phải hệ thống cũ' };
  var ss; try { ss = SpreadsheetApp.openById(id); } catch (e) { return { ok: false, error: 'Không mở được file cũ (' + id + '): tài khoản này chưa có quyền xem file đó, hoặc mã sai' }; }
  var meta = {}; (readOldTab_(ss, 'META') || []).forEach(function (r) { meta[r.key] = r.value; });
  if (!meta.APP_VERSION) return { ok: false, error: 'File cũ chưa có tab META: trên hệ thống cũ, dán bản 8.1.3 trở lên, chạy menu 1, rồi chạy "Chuẩn bị chuyển"' };
  if (cmpVersion_(meta.APP_VERSION, APP.VERSION) > 0) return { ok: false, error: 'Hệ thống cũ chạy bản ' + meta.APP_VERSION + ', mới hơn bản này (' + APP.VERSION + '): dán bản mới nhất vào hệ thống mới trước' };
  if (requirePrepared && !meta.PREPARED_AT) return { ok: false, error: 'Hệ thống cũ chưa chạy "Chuẩn bị chuyển" (bước 1): job cũ vẫn chạy, sự kiện Calendar chưa gỡ' };
  return { ok: true, ss: ss, id: id, meta: meta };
}

/** Kế hoạch chép một tab (hàm thuần trên dữ liệu đã đọc). Trả { tab, total, insert, update, skip, conflicts, rows } . */
function movePlanTab_(spec, oldRows, newTable, today) {
  var out = { tab: spec.tab, total: 0, insert: 0, update: 0, skip: 0, conflicts: [], rows: [] }, sc = SCHEMA[spec.tab], key = sc.id;
  if (!oldRows) { out.missing = true; return out; }
  var rows = oldRows;
  if (spec.fromToday) rows = rows.filter(function (r) { return r.date instanceof Date && r.date >= today; });
  if (spec.mode === 'ledger') rows = rows.filter(function (r) { return String(r.kind || '').indexOf('MKT:') === 0; });
  if (spec.tab === 'CONFIG') rows = rows.filter(function (r) { return MOVE_CONFIG_SKIP_.indexOf(String(r.key).trim()) === -1 && DEFAULTS_.hasOwnProperty(String(r.key).trim()); });
  out.total = rows.length;
  var have = {}, emails = {};
  newTable.all().forEach(function (r) { if (key) have[String(r[key])] = r; if (spec.tab === 'USERS') emails[String(r.email).toLowerCase()] = r.user_id; });
  var sig = {}; if (spec.mode === 'ledger') newTable.all().forEach(function (r) { sig[[r.time instanceof Date ? r.time.getTime() : r.time, r.to, r.kind].join('|')] = true; });
  var nsig = {}; if (spec.mode === 'notice') newTable.all().forEach(function (r) { nsig[[r.event, r.time instanceof Date ? r.time.getTime() : r.time, r.entity_id].join('|')] = true; });
  var keyOf = function (r) { return (MOVE_KEY_FIELDS_[spec.tab] || []).map(function (c) { var v = r[c]; return v instanceof Date ? 'D' + toMidnight_(v).getTime() : String(v === undefined || v === null ? '' : v).trim().toLowerCase(); }).join('|'); };
  var planned = {};
  rows.forEach(function (r) {
    if (spec.mode === 'ledger') { var k = [r.time instanceof Date ? r.time.getTime() : r.time, r.to, r.kind].join('|'); if (sig[k]) { out.skip++; return; } sig[k] = true; out.insert++; out.rows.push({ op: 'insert', row: r }); return; }
    if (spec.mode === 'notice') {
      if (r.read === true || String(r.read).toUpperCase() === 'TRUE' || r.level === NOTIFY_LEVEL.INFO) return;
      var nk = [r.event, r.time instanceof Date ? r.time.getTime() : r.time, r.entity_id].join('|');
      if (nsig[nk]) { out.skip++; return; } nsig[nk] = true;
      out.insert++; out.rows.push({ op: 'notice', row: r }); return;
    }
    var id = String(r[key] || '').trim();
    if (!id) { out.skip++; return; }
    // Soát 5L L10: mã trùng ngay trong file cũ: chỉ chép dòng đầu, báo.
    if (planned[id]) { out.skip++; out.dupInOld = (out.dupInOld || []).concat([id]); return; }
    planned[id] = true;
    var cur = have[id];
    if (spec.tab === 'USERS' && !cur && emails[String(r.email).toLowerCase()]) { out.conflicts.push(id + ' (email ' + r.email + ' đã có ở ' + emails[String(r.email).toLowerCase()] + ')'); out.skip++; return; }
    if (spec.mode === 'insert') {
      if (cur && MOVE_KEY_FIELDS_[spec.tab] && keyOf(cur) !== keyOf(r)) { out.conflicts.push(id + ' (hệ thống mới đã có ' + id + ' là dòng khác)'); out.skip++; return; }
      if (cur) out.skip++; else { out.insert++; out.rows.push({ op: 'insert', row: r }); }
      return;
    }
    if (spec.mode === 'upsert') { if (cur) { out.update++; out.rows.push({ op: 'update', row: r }); } else { out.insert++; out.rows.push({ op: 'insert', row: r }); } return; }
    if (spec.mode === 'cells') {
      if (!cur) { out.skip++; return; }   // khoá cũ không còn trong bản này: bỏ
      var patch = {}; spec.cols.forEach(function (c) { if (c in r && String(r[c]) !== String(cur[c] === undefined ? '' : cur[c])) patch[c] = r[c]; });
      if (Object.keys(patch).length) { out.update++; out.rows.push({ op: 'patch', id: id, patch: patch }); } else out.skip++;
      return;
    }
    if (spec.mode === 'config') {
      if (cur && String(cur.value) === String(r.value)) { out.skip++; return; }
      out[cur ? 'update' : 'insert']++; out.rows.push({ op: cur ? 'patch' : 'insert', id: id, patch: { value: r.value }, row: { key: id, value: r.value, note: r.note || '' } });
    }
  });
  return out;
}

/** Mã gói học viên dùng mà file cũ và file mới đều không có dòng PACKAGES (tự tạo dòng "không bán"). */
function moveMissingPackages_(oldSps, oldPk, newPk) {
  var have = {}; (oldPk || []).concat(newPk).forEach(function (p) { have[String(p.code).trim()] = true; });
  var miss = {};
  (oldSps || []).forEach(function (sp) { var c = String(sp.package_code || '').trim(); if (c && !have[c]) miss[c] = miss[c] || { code: c, sessions: Number(sp.sessions_total || 0) }; });
  return Object.keys(miss).map(function (k) { return miss[k]; });
}

/**
 * Chạy thử (opts.dryRun) hoặc chép thật. Chép thật: mỗi tab một khoá; tab xong ghi mốc IMPORT_DONE_<mã file cũ>_<tab>
 * (Script Property) để lượt sau bỏ qua; gần hết giờ thì dừng, trả more = true (chạy lại menu để làm tiếp). Không bao giờ ghi file cũ.
 */
function moveImport_(oldId, opts, actor) {
  opts = opts || {};
  var o = openOldSystem_(oldId, !opts.dryRun);
  if (!o.ok) return o;
  var t0 = Date.now(), today = toMidnight_(getNow_()), props = props_(), report = [], more = false;
  var oldData = {}; MOVE_TABS_.forEach(function (s) { oldData[s.tab] = readOldTab_(o.ss, s.tab); });
  var missing = moveMissingPackages_(oldData.STUDENT_PACKAGES, oldData.PACKAGES, table_('PACKAGES').all());
  // Soát 5L H1, M2: trùng email hoặc trùng mã khác dòng (hệ thống mới đã tự sinh dòng trước khi chép): chép tiếp sẽ làm buổi, gói
  // trỏ sai người. Chạy thật dừng TRƯỚC khi ghi bất cứ gì; admin sửa ở hệ thống mới rồi chạy lại.
  if (!opts.dryRun) {
    var conf = [];
    MOVE_TABS_.forEach(function (sp) { if (sp.mode === 'insert' && !props.getProperty('IMPORT_DONE_' + o.id + '_' + sp.tab)) movePlanTab_(sp, oldData[sp.tab], table_(sp.tab), today).conflicts.forEach(function (x) { conf.push(sp.tab + ' ' + x); }); });
    if (conf.length) return { ok: false, error: 'Hệ thống mới đã có dòng trùng với hệ thống cũ, chưa chép gì: ' + conf.slice(0, 10).join('; ') + (conf.length > 10 ? ' ...' : '') + '. Xoá hoặc sửa các dòng đó ở hệ thống mới (thường là dòng tạo thử sau menu 1), rồi chạy lại' };
    // Nâng mốc mã tự sinh TRƯỚC khi ghi: dòng hệ thống mới sinh trong lúc chép không lấy trùng số của hệ thống cũ.
    idFloorTabs_().forEach(function (tab) { var v = Number(o.meta['ID_FLOOR_' + tab] || 0), k = 'ID_FLOOR_' + tab; if (v > Number(props.getProperty(k) || 0)) props.setProperty(k, String(v)); });
    ID_FLOOR_MEMO_ = {};
  }
  MOVE_TABS_.forEach(function (spec) {
    var doneKey = 'IMPORT_DONE_' + o.id + '_' + spec.tab;
    if (!opts.dryRun && props.getProperty(doneKey)) { report.push({ tab: spec.tab, done: true }); return; }
    if (!opts.dryRun && Date.now() - t0 > MOVE_TIME_BUDGET_MS_) { more = true; report.push({ tab: spec.tab, skipped: 'TIME' }); return; }
    if (opts.dryRun) { var p = movePlanTab_(spec, oldData[spec.tab], table_(spec.tab), today); delete p.rows; report.push(p); return; }
    var res = withLock_(function () {
      var t = table_(spec.tab), plan = movePlanTab_(spec, oldData[spec.tab], t, today);
      if (spec.tab === 'PACKAGES') missing.forEach(function (m) {
        if (t.byId(m.code)) return;
        t.insert({ code: m.code, name: m.code + ' (tự tạo khi chuyển hệ thống)', name_en: m.code, type: m.sessions ? 'SESSIONS' : 'DAYS', days: m.sessions ? '' : 30, sessions: m.sessions || '', price_vnd: 0, active: false, note: 'Tự tạo ' + fmtDateTime_(getNow_()) + ': hệ thống cũ không có định nghĩa gói này. Kiểm lại kiểu, số ngày, số buổi' });
      });
      plan.rows.forEach(function (x) {
        // USERS: ô contact_link ở file cũ đọc ra chữ hiển thị (không phải công thức): dựng lại công thức link Zalo.
        if (spec.tab === 'USERS' && x.row) x.row.contact_link = contactFormula_(x.row.phone);
        if (x.op === 'insert') t.insert(x.row);
        else if (x.op === 'update') { var cur = t.byId(String(x.row[SCHEMA[spec.tab].id])); var pt = {}; SCHEMA[spec.tab].cols.forEach(function (c) { if (c in x.row) pt[c] = x.row[c]; }); t.update(cur, pt); }
        else if (x.op === 'patch') t.update(t.byId(x.id), x.patch);
        else if (x.op === 'notice') { var nr = {}; SCHEMA.NOTIFICATIONS.cols.forEach(function (c) { if (c in x.row) nr[c] = x.row[c]; }); nr.notif_id = nextId_('NOTIFICATIONS'); nr.link = ''; t.insert(nr); }
      });
      delete plan.rows;
      return plan;
    });
    props.setProperty(doneKey, '1');
    report.push(res);
  });
  if (opts.dryRun) return { ok: true, dryRun: true, oldVersion: o.meta.APP_VERSION, prepared: !!o.meta.PREPARED_AT, tabs: report, missingPackages: missing };
  clearDbCache_(); clearConfigCache_();
  var rerun = [];
  if (!more) {
    // Soát 5L L7: mốc việc theo tuần của hệ thống cũ.
    Object.keys(o.meta).forEach(function (k) { if (k.indexOf('PROP_DONE_') === 0 && !props.getProperty(k.substring(5))) props.setProperty(k.substring(5), String(o.meta[k])); });
    // Soát 5L M4: bước chuyển dữ liệu hệ thống cũ CHƯA chạy thì bỏ dấu ở hệ thống mới, để lần menu 1 tới chạy trên dữ liệu vừa chép.
    MIGRATION_STEPS_.forEach(function (m) { if (o.meta[m.id] !== 'DONE' && props.getProperty(m.id)) { props.deleteProperty(m.id); rerun.push(m.label); } });
    // Soát 5L M2: chép xong thì xoá mốc chạy tiếp, chạy lại Bước 3 sẽ đối chiếu lại toàn bộ (chép theo mã nên không nhân đôi).
    Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf('IMPORT_DONE_' + o.id + '_') === 0) props.deleteProperty(k); });
  }
  var check = more ? null : moveRecount_(o.ss, today);
  withLock_(function () { logActivity_(actor, 'SYSTEM_IMPORTED', 'SYSTEM', o.id, { more: more, tabs: report.map(function (r) { return r.tab + ':' + (r.done ? 'done' : (r.insert || 0) + '+' + (r.update || 0)); }).join(','), mismatch: check ? check.length : null }); });
  return { ok: true, more: more, tabs: report, missingPackages: missing, mismatches: check || [], rerunSteps: rerun };
}

/** Đếm lại sau khi chép: mỗi mã của tab chép theo mã ở file cũ phải có ở file mới. Trả danh sách lệch. */
function moveRecount_(oldSs, today) {
  var bad = [];
  MOVE_TABS_.filter(function (s) { return s.mode === 'insert' || s.mode === 'upsert'; }).forEach(function (spec) {
    var rows = readOldTab_(oldSs, spec.tab) || [], key = SCHEMA[spec.tab].id, have = {};
    if (spec.fromToday) rows = rows.filter(function (r) { return r.date instanceof Date && r.date >= today; });
    table_(spec.tab).all().forEach(function (r) { have[String(r[key])] = true; });
    var miss = rows.filter(function (r) { return String(r[key] || '').trim() && !have[String(r[key])]; }).map(function (r) { return r[key]; });
    if (miss.length) bad.push(spec.tab + ': thiếu ' + miss.length + ' (' + miss.slice(0, 5).join(', ') + ')');
  });
  return bad;
}

// ── Menu ──
function menuMovePrepare(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Bước 1: Chuẩn bị chuyển (chạy trên hệ thống CŨ)', 'Đóng cổng học viên và tutor, gỡ sự kiện Calendar các buổi sắp tới (học viên, tutor nhận thư huỷ của Google Calendar, buổi học vẫn giữ), xoá trigger tự động, ghi tab META.\n\nChỉ làm khi hệ thống mới đã dán code và chạy menu 1. Tiếp tục?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var url = ui.prompt('Link mới (tuỳ chọn)', 'Link trang web của hệ thống mới (https://...), hiện cho người mở link cũ. Để trống nếu chưa có.', ui.ButtonSet.OK_CANCEL);
  if (url.getSelectedButton() !== ui.Button.OK) return null;
  if (ui.alert('Xác nhận lần 2', 'Hệ thống này sẽ ngừng phục vụ học viên, tutor. Chắc chắn?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var r = prepareMoveOld_({ newUrl: url.getResponseText() }, adminActor_(e));
  alert_(r.ok ? 'Đã chuẩn bị: cổng đóng, gỡ ' + r.events + ' sự kiện, xoá ' + r.triggers + ' trigger, ghi META.\n\nMã file DB này (nhập ở hệ thống mới): ' + dbSpreadsheet_().getId() + '\n\nSang hệ thống mới: menu Chuyển hệ thống, Bước 2 rồi Bước 3.' : 'Chưa chuẩn bị được: ' + (r.error || r.reason));
  return r;
}
function moveIdPrompt_() {
  var ui = SpreadsheetApp.getUi(), r = ui.prompt('Mã file DB của hệ thống cũ', 'Dán link file Sheets DB cũ hoặc đoạn mã giữa /d/ và /edit (hệ thống cũ báo mã này ở Bước 1).', ui.ButtonSet.OK_CANCEL);
  return r.getSelectedButton() === ui.Button.OK ? r.getResponseText() : null;
}
function moveReportText_(r) {
  var lines = r.tabs.map(function (x) { return x.tab + ': ' + (x.done ? 'đã chép ở lượt trước' : x.skipped ? 'ĐỂ LƯỢT SAU (hết giờ)' : x.missing ? 'file cũ không có tab này' : x.total + ' dòng, thêm ' + x.insert + ', cập nhật ' + x.update + ', bỏ qua ' + x.skip + (x.conflicts && x.conflicts.length ? ', TRÙNG (phải sửa trước Bước 3): ' + x.conflicts.join('; ') : '') + (x.dupInOld ? ', mã trùng trong file cũ (chép dòng đầu): ' + x.dupInOld.join(', ') : '')); });
  if (r.missingPackages && r.missingPackages.length) lines.push('', 'Mã gói thiếu (tự tạo dòng "không bán", kiểm lại sau): ' + r.missingPackages.map(function (m) { return m.code; }).join(', '));
  return lines.join('\n');
}
function menuMoveDryRun(e) { requireOperator_(e);
  var id = moveIdPrompt_(); if (id === null) return null;
  var r = moveImport_(id, { dryRun: true }, adminActor_(e));
  alert_(r.ok ? 'CHẠY THỬ (chưa ghi gì). Hệ thống cũ bản ' + r.oldVersion + (r.prepared ? '' : ', CHƯA chạy Chuẩn bị chuyển') + '\n\n' + moveReportText_(r) : 'Không chạy được: ' + r.error);
  return r;
}
function menuMoveImport(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi(), id = moveIdPrompt_(); if (id === null) return null;
  if (ui.alert('Bước 3: Chép dữ liệu thật', 'Chép dữ liệu từ hệ thống cũ vào file này (file cũ chỉ đọc). Chạy lại không nhân đôi. Tiếp tục?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var r = moveImport_(id, {}, adminActor_(e));
  alert_(r.ok ? (r.more ? 'CHƯA XONG (hết thời gian một lượt): chạy lại Bước 3 để chép tiếp.\n\n' : 'Đã chép xong.' + (r.mismatches.length ? ' ĐẾM LẠI LỆCH:\n' + r.mismatches.join('\n') : ' Đếm lại khớp.') + '\n\nTiếp theo: chạy menu 1' + (r.rerunSteps.length ? ' (sẽ chạy lại: ' + r.rerunSteps.join('; ') + ')' : '') + ', Bước 4 (tạo lại sự kiện), menu 3 (trigger), đổi đích link rút gọn.\n\n') + moveReportText_(r) : 'Không chạy được: ' + r.error);
  return r;
}
function menuStopTriggers(e) { requireOperator_(e);
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Tắt hết trigger tự động của hệ thống này?', 'Dùng cho STAGING khi PRODUCTION đã chạy chính thức (tránh thư nhắc trùng, chiếm hạn mức). Hệ thống này không còn tự gửi nhắc, tự sao lưu, tự tạo sự kiện. Bật lại: menu 3.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var n = deleteSystemTriggers_();
  withLock_(function () { logActivity_(adminActor_(e), 'TRIGGERS_STOPPED', 'SYSTEM', getEnv_(), String(n)); });
  alert_('Đã xoá ' + n + ' trigger. Menu 2 sẽ báo thiếu trigger (đúng ý). Bật lại: menu 3.');
  return n;
}

// ── TutorLock.gs ──
/**
 * TutorLock.gs · Khoá, mở khoá tutor (chunk 5L, BL04 phương án a)
 *
 * Khoá tutor (menu Người dùng, dòng đang chọn ở USERS), làm trong MỘT khoá:
 *   1. Mọi buổi sắp tới (chưa bắt đầu) của tutor: tự đổi sang tutor khác đang mở giờ đó (như "Duyệt, tự chọn tutor thay");
 *      không còn ai thì huỷ buổi kiểu CANCELLED_TUTOR, học viên không bị trừ buổi và được bù theo luật 5M.
 *   2. Giờ rảnh từ hôm nay trở đi (OPEN, CANCEL_PENDING) chuyển CANCELLED, ghi outcome.
 *   3. USERS.status = DISABLED. Sau khoá: thoát mọi phiên và link còn hạn (logoutAll_).
 * Buổi đã bắt đầu hoặc đã qua giữ nguyên. Tài khoản DISABLED không đăng nhập được, nên buổi đã qua chưa có kết quả thì
 * admin chọn kết quả ở cột admin_action của BOOKINGS.
 * Trước khi chạy: menu hiện bản xem trước (buổi nào đổi được, buổi nào phải huỷ) và hỏi lại 2 lần.
 * Mở khoá: status ACTIVE; giờ rảnh đã huỷ không tự mở lại (tutor mở lại trên trang).
 */

/** Buổi sắp tới của tutor (chưa bắt đầu, còn giữ chỗ). */
function tutorFutureBookings_(tutorId, now) {
  return table_('BOOKINGS').filter(function (b) {
    return b.tutor_id === tutorId && (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_REASSIGN) &&
      b.date instanceof Date && now < slotStart_(b.date, b.slot);
  }).sort(function (a, b) { return slotStart_(a.date, a.slot) - slotStart_(b.date, b.slot); });
}

/** Xem trước (chỉ đọc): { tutor, bookings: [{ id, date, slot, student, candidates }], slots }. */
function tutorLockPlan_(tutorId) {
  var u = userById_(tutorId), now = getNow_();
  if (!u || u.role !== 'TUTOR') return { ok: false, reason: REASONS.NOT_FOUND };
  var today = toMidnight_(now), tutors = activeTutors_(), avail = table_('AVAILABILITY').all(), all = table_('BOOKINGS').all();
  var list = tutorFutureBookings_(tutorId, now).map(function (b) {
    var cands = buildTutorCandidates_(b.date, b.slot, tutors, avail, all.filter(function (x) { return x.booking_id !== b.booking_id; }), [tutorId]);
    var s = userById_(b.student_id) || {};
    return { id: b.booking_id, date: dateKey_(b.date), label: fmtDayVi_(b.date) + ' ' + b.slot, student: s.name || b.student_id, candidates: cands.length };
  });
  var slots = avail.filter(function (a) { return a.tutor_id === tutorId && a.date instanceof Date && a.date >= today && (a.status === AVAIL_STATUS.OPEN || a.status === AVAIL_STATUS.CANCEL_PENDING); }).length;
  return { ok: true, tutor: { id: u.user_id, name: u.name, status: u.status }, bookings: list, slots: slots };
}

function lockTutor_(tutorId, actor) {
  var res = withLock_(function () {
    var u = userById_(tutorId), now = getNow_();
    if (!u || u.role !== 'TUTOR') return { ok: false, reason: REASONS.NOT_FOUND };
    if (u.status === USER_STATUS.DISABLED) return { ok: false, reason: REASONS.INVALID_INPUT, already: true };
    var out = { ok: true, reassigned: [], cancelled: [], slots: 0 };
    // Khoá trước: tutor bị khoá không bao giờ được chọn lại làm tutor thay (activeTutors_ chỉ lọc vai trò).
    table_('USERS').update(u, { status: USER_STATUS.DISABLED });
    tutorFutureBookings_(tutorId, now).forEach(function (b) {
      var r = reassignBookingInLock_(b, [tutorId], actor, 'LOCK', null);
      if (r.outcome === 'REASSIGNED') out.reassigned.push(b.booking_id + ' → ' + r.tutorId); else out.cancelled.push(b.booking_id);
    });
    var today = toMidnight_(now), av = table_('AVAILABILITY');
    av.filter(function (a) { return a.tutor_id === tutorId && a.date instanceof Date && a.date >= today && (a.status === AVAIL_STATUS.OPEN || a.status === AVAIL_STATUS.CANCEL_PENDING); })
      .forEach(function (a) { av.update(a, { status: AVAIL_STATUS.CANCELLED, outcome: 'Tutor bị khoá · ' + fmtDateTime_(now) }); out.slots++; });
    bumpSlotsVersion_();
    logActivity_(actor, 'TUTOR_DISABLED', 'USER', tutorId, { reassigned: out.reassigned.length, cancelled: out.cancelled.length, slots: out.slots });
    return out;
  });
  if (res.ok) { var u2 = userById_(tutorId); if (u2) logoutAll_(u2, actor); }
  return res;
}

function unlockTutor_(tutorId, actor) {
  return withLock_(function () {
    var u = userById_(tutorId);
    if (!u || u.role !== 'TUTOR') return { ok: false, reason: REASONS.NOT_FOUND };
    if (u.status === USER_STATUS.ACTIVE) return { ok: false, reason: REASONS.INVALID_INPUT, already: true };
    table_('USERS').update(u, { status: USER_STATUS.ACTIVE });
    logActivity_(actor, 'TUTOR_ENABLED', 'USER', tutorId, '');
    return { ok: true };
  });
}

function menuLockTutor(e) { requireOperator_(e);
  var id = selectedUserRow_(), p = tutorLockPlan_(id), ui = SpreadsheetApp.getUi();
  if (!p.ok) { alert_('Dòng đang chọn không phải tutor (' + id + ').'); return null; }
  if (p.tutor.status === USER_STATUS.DISABLED) { alert_(p.tutor.name + ' (' + id + ') đã bị khoá.'); return null; }
  var lines = p.bookings.map(function (b) { return b.label + ' · ' + b.student + ': ' + (b.candidates ? 'đổi sang tutor khác (' + b.candidates + ' người rảnh)' : 'KHÔNG ai rảnh, sẽ huỷ, học viên được bù'); });
  var text = 'Khoá ' + p.tutor.name + ' (' + id + '):\n\n' + (lines.length ? p.bookings.length + ' buổi sắp tới:\n' + lines.slice(0, 30).join('\n') + (lines.length > 30 ? '\n...' : '') : 'Không có buổi sắp tới.') +
    '\n\n' + p.slots + ' giờ rảnh từ hôm nay sẽ bị huỷ. Tutor bị thoát khỏi mọi thiết bị, không đăng nhập được nữa.\n\nTiếp tục?';
  if (ui.alert('Khoá tutor: xem trước', text, ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  if (ui.alert('Xác nhận lần 2', 'Chắc chắn khoá ' + p.tutor.name + '? Học viên của các buổi trên sẽ nhận email đổi tutor hoặc huỷ buổi.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return null;
  var r = lockTutor_(id, adminActor_(e));
  alert_(r.ok ? 'Đã khoá ' + p.tutor.name + '.\nĐổi tutor: ' + r.reassigned.length + (r.reassigned.length ? ' (' + r.reassigned.join(', ') + ')' : '') + '\nHuỷ và bù: ' + r.cancelled.length + (r.cancelled.length ? ' (' + r.cancelled.join(', ') + ')' : '') + '\nGiờ rảnh huỷ: ' + r.slots : 'Không khoá được: ' + r.reason);
  return r;
}

function menuUnlockTutor(e) { requireOperator_(e);
  var id = selectedUserRow_(), u = userById_(id);
  if (!u || u.role !== 'TUTOR') { alert_('Dòng đang chọn không phải tutor (' + id + ').'); return null; }
  var r = unlockTutor_(id, adminActor_(e));
  alert_(r.ok ? 'Đã mở khoá ' + u.name + '. Giờ rảnh đã huỷ không tự mở lại: tutor mở lại trên trang tutor, rồi gửi link đăng nhập (menu Người dùng).' : (r.already ? u.name + ' đang hoạt động.' : 'Không mở khoá được: ' + r.reason));
  return r;
}

