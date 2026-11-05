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
