/**
 * fixtures.js · Dữ liệu mẫu cho 40 kịch bản (khớp mục "Dữ liệu mẫu" trong docs/03_KICH_BAN_TEST_40.md)
 *
 * Tuần A: thứ Hai 12/10/2026 đến Chủ nhật 18/10/2026. Tuần B: 19/10 đến 25/10.
 * Giờ giả lập mặc định: thứ Hai 12/10/2026 10:00.
 */
'use strict';
const { load } = require('./load');

const D = (dd, mm, yyyy) => new Date(yyyy || 2026, mm - 1, dd);
const DB_ID = 'DB_STAGING_TEST';

const TUTORS = [
  { user_id: 'T001', name: 'Vân', email: 'van@tutor.test', phone: '+84901000001', color_id: '1' },
  { user_id: 'T002', name: 'Ánh', email: 'anh@tutor.test', phone: '+84901000002', color_id: '2' },
  { user_id: 'T003', name: 'Lan', email: 'lan@tutor.test', phone: '+84901000003', color_id: '3' },
  { user_id: 'T004', name: 'Minh', email: 'minh@tutor.test', phone: '+84901000004', color_id: '4' }
];
const STUDENTS = [
  { user_id: 'S001', name: 'Học viên 1', email: 's001@student.test', phone: '+84912000001', level: 'A1' },
  { user_id: 'S002', name: 'Học viên 2', email: 's002@student.test', phone: '+84912000002', level: 'A2' },
  { user_id: 'S003', name: 'Học viên 3', email: 's003@student.test', phone: '+84912000003', level: 'B1' },
  { user_id: 'S004', name: 'Học viên 4', email: 's004@student.test', phone: '+84912000004', level: 'B1' },
  { user_id: 'S005', name: 'Học viên 5', email: 's005@student.test', phone: '+84912000005', level: 'A2' },
  { user_id: 'S006', name: 'Học viên 6', email: 's006@student.test', phone: '+84912000006', level: 'A1' },
  { user_id: 'S007', name: 'Học viên 7', email: 's007@student.test', phone: '+84912000007', level: 'B2' },
  { user_id: 'S008', name: 'Học viên 8', email: 's008@student.test', phone: '+84912000008', level: 'B2' }
];
const PACKAGES = [
  { code: 'TRIAL', name: 'Trial 2 buổi', type: 'DAYS', days: 7, sessions: 2, price_vnd: 150000, active: true },
  { code: 'PASS_2W', name: 'Gói 2 tuần', type: 'DAYS', days: 14, sessions: '', price_vnd: 990000, active: true },
  { code: 'PASS_1M', name: 'Gói 1 tháng', type: 'DAYS', days: 30, sessions: '', price_vnd: 1790000, active: true },
  { code: 'PACK_12', name: 'Gói 12 buổi', type: 'SESSIONS', days: '', sessions: 12, price_vnd: 0, active: false }   // 5L (BL49): thay LEGACY
];
const STUDENT_PACKAGES = [
  { sp_id: 'SP00001', student_id: 'S001', package_code: 'TRIAL', status: 'INACTIVE', sessions_total: 2, purchased_at: D(10, 10) },
  { sp_id: 'SP00002', student_id: 'S002', package_code: 'PASS_2W', status: 'INACTIVE', purchased_at: D(10, 10) },
  { sp_id: 'SP00003', student_id: 'S003', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED', purchased_at: D(1, 10) },
  { sp_id: 'SP00004', student_id: 'S004', package_code: 'PACK_12', status: 'ACTIVE', sessions_total: 1, purchased_at: D(1, 8) },
  { sp_id: 'SP00005', student_id: 'S005', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(1, 10), end_date: D(30, 10), start_source: 'FIXED', purchased_at: D(28, 9) },
  { sp_id: 'SP00006', student_id: 'S006', package_code: 'PASS_2W', status: 'EXPIRED', start_date: D(20, 9), end_date: D(3, 10), start_source: 'FIXED', purchased_at: D(18, 9) },
  { sp_id: 'SP00007', student_id: 'S007', package_code: 'PASS_2W', status: 'ACTIVE', start_date: D(12, 10), end_date: D(25, 10), start_source: 'FIXED', purchased_at: D(9, 10) },
  { sp_id: 'SP00008', student_id: 'S008', package_code: 'PASS_1M', status: 'ACTIVE', start_date: D(5, 10), end_date: D(3, 11), start_source: 'FIXED', purchased_at: D(2, 10) }
];

function config(api) {
  return {
    ADMIN_EMAIL: 'admin@thaiput.vn', ADMIN_PHONE: '+84909999999', ADMIN_ZALO_URL: 'https://zalo.me/0909999999',
    MAIL_FROM_NAME: 'thaiput', SCHOOL_SITE_URL: 'https://www.thaiput.vn', WEBAPP_URL: 'https://www.thaiput.vn/app',
    LESSON_CALENDAR_ID: 'lessons_staging@group.calendar.google.com',
    BANK_NAME: 'Vietcombank', BANK_ACCOUNT: '0123456789', BANK_HOLDER: 'THAIPUT',
    UPLOADS_FOLDER_ID: 'FOLDER_UPLOADS', BACKUP_FOLDER_ID: 'FOLDER_BACKUP', EXPORT_FOLDER_ID: 'FOLDER_EXPORT',
    // 40 kịch bản kiểm cơ chế tạo, sửa, gỡ sự kiện Calendar ngay khi đặt (file 03 viết trước quyết định gom 23h ngày 15/10).
    // Chế độ mặc định NIGHTLY và QUEUE có test riêng (I61 trở đi).
    CALENDAR_MODE: 'INLINE'
  };
}

/** Ghi một dòng thẳng vào trạng thái giả lập, đúng như dữ liệu đã nằm trong Sheets (ô chữ có định dạng '@'). */
function putRows(env, api, tableName, objs) {
  const ss = env.state.spreadsheets[DB_ID];
  const schema = api.SCHEMA[tableName];
  const sh = ss.sheets[tableName];
  objs.forEach(o => {
    const r = sh.values.length + 1;
    const line = schema.cols.map(c => (o[c] === undefined || o[c] === null ? '' : o[c]));
    (schema.text || []).forEach(c => { sh.formats[r + ':' + (schema.cols.indexOf(c) + 1)] = '@'; });
    sh.values.push(line);
  });
}

/**
 * Môi trường đầy đủ cho một kịch bản.
 * opts.now: 'YYYY-MM-DD HH:mm' (mặc định '2026-10-12 10:00')
 * opts.noAvailability: true để bắt đầu với lịch rảnh trống (E31)
 */
function scenarioEnv(opts) {
  opts = opts || {};
  const { api, env } = load({ props: { ENV: 'STAGING', DB_ID_STAGING: DB_ID, MIG_5M: '1' } });
  env.createSpreadsheet(DB_ID, 'THAIPUT_DB_STAGING');
  const ss = env.state.spreadsheets[DB_ID];
  Object.keys(api.SCHEMA).forEach(t => { ss.sheets[t] = { values: [api.SCHEMA[t].cols.slice()], formats: {}, maxCols: Math.max(26, api.SCHEMA[t].cols.length) }; });

  const cfg = config(api);
  putRows(env, api, 'CONFIG', Object.keys(cfg).map(k => ({ key: k, value: cfg[k] })));
  putRows(env, api, 'PACKAGES', PACKAGES);
  putRows(env, api, 'USERS', [{ user_id: 'A01', role: 'ADMIN', email: 'admin.karn@gmail.com', name: 'Karn', status: 'ACTIVE', created_at: D(1, 9) }]
    .concat(TUTORS.map(t => Object.assign({ role: 'TUTOR', status: 'ACTIVE', created_at: D(1, 9) }, t)))
    .concat(STUDENTS.map(s => Object.assign({ role: 'STUDENT', status: 'ACTIVE', created_at: D(1, 9) }, s))));
  putRows(env, api, 'STUDENT_PACKAGES', STUDENT_PACKAGES);

  if (!opts.noAvailability) {
    const rows = []; let n = 0;
    for (let i = 0; i < 7; i++) {
      const day = D(12 + i, 10);
      TUTORS.forEach(t => {
        const slots = ['19:00', '20:00', '21:00'].concat(t.user_id === 'T001' || t.user_id === 'T002' ? ['08:00', '23:30'] : []);
        slots.forEach(s => rows.push({ avail_id: 'AV' + String(++n).padStart(6, '0'), tutor_id: t.user_id, date: day, slot: s, status: 'OPEN', created_at: D(10, 10) }));
      });
    }
    putRows(env, api, 'AVAILABILITY', rows);
  }

  // Thư mục Drive và lịch Calendar mà Setup sẽ tạo trên hệ thống thật
  ['FOLDER_UPLOADS', 'FOLDER_BACKUP', 'FOLDER_EXPORT'].forEach(id => { env.state.drive.folders[id] = { id, name: id }; });
  env.state.drive.files[DB_ID] = { id: DB_ID, name: 'THAIPUT_DB_STAGING', parent: null, created: new Date(0) };
  env.state.calendars[cfg.LESSON_CALENDAR_ID] = { id: cfg.LESSON_CALENDAR_ID, summary: 'Thaiput · Lịch học (STAGING)', timeZone: 'Asia/Ho_Chi_Minh' };

  api.setSimNow_(opts.now || '2026-10-12 10:00');
  return { api, env, D, putRows: (t, objs) => putRows(env, api, t, objs) };
}

module.exports = { scenarioEnv, D, DB_ID, TUTORS, STUDENTS, PACKAGES, STUDENT_PACKAGES };
