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
