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
