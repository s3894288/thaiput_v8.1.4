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
