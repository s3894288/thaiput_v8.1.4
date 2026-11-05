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
