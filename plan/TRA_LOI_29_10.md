# Trả lời các câu hỏi ngày 29/10/2026

*Trả lời dựa trên code bản 8.0.10 và tài liệu chính thức của Google (xem ngày 29/10/2026).*

## 1. Gửi bằng Gmail (GmailApp) thì hạn mức của admin@ có đổi không?

**Không tăng.** Gmail giúp thư **tới được nơi nhận** (hết bị trả về), nhưng không mở thêm hạn mức gửi.

| Nguồn | Hạn mức | Ghi chú |
|---|---|---|
| Apps Script, "Email recipients per day" | Workspace: 1.500 người nhận mỗi ngày | Có thêm giới hạn cho tài khoản dùng thử. Mức đầy đủ chỉ mở sau khi đã trả ít nhất 100 USD và qua 60 ngày. Trang này lấy MailApp làm ví dụ, **không ghi rõ** GmailApp có tính chung không |
| Gmail của Workspace | 2.000 thư mỗi ngày cho mỗi người dùng; dùng thử: 500 thư mỗi ngày, 500 người nhận bên ngoài mỗi ngày | Trang Gmail ghi hạn mức có thể khác khi gửi bằng Apps Script |

**Hệ quả thực tế:**
* Khi admin@ còn là tài khoản dùng thử thì giới hạn thấp nhất vẫn áp dụng.
* GmailApp có trừ vào bộ đếm hạn mức của Apps Script hay không thì chưa ai kiểm. Bản 5J sẽ đo trên bản thử bằng menu Kiểm tra gửi email: so hạn mức trước và sau một lần gửi. Chưa đo thì không khẳng định.
* Mọi thư hệ thống gửi bằng GmailApp đều nằm trong mục Đã gửi của admin@. Cần một bộ lọc Gmail tự gắn nhãn và lưu trữ các thư này (hướng dẫn sẽ có ở 5J).
* **Về quyền:** tài liệu Google ghi GmailApp cần quyền đầy đủ `https://mail.google.com/` (đọc và xoá được hộp thư), không phải `gmail.send`. Lần thử ngày 22/10 với `gmail.send` đã gửi được. Nếu bản mới báo thiếu quyền thì chọn theo BL10:
  * (a) thêm quyền đầy đủ;
  * (b) đổi sang Gmail API nâng cao, chỉ cần `gmail.send`.

**Nếu cần gửi nhiều hơn hạn mức trên:** dùng dịch vụ gửi ngoài (BL31, giai đoạn sau). Ví dụ Resend: gói Free 3.000 thư mỗi tháng, tối đa 100 thư mỗi ngày; gói Pro 20 USD được 50.000 thư mỗi tháng.

## 2. AVAILABILITY có 5 lựa chọn: "Duyệt" khác gì các lựa chọn duyệt khác?

**Không khác.** Trong code (`decideTutorCancelInLock_`, Availability.gs), "Duyệt" được đổi thẳng thành "Duyệt, tự chọn tutor thay". Lựa chọn này còn sót lại từ trước 5B, khi chưa có 3 kiểu duyệt.

Kế hoạch 5K bỏ "Duyệt" khỏi danh sách ở AVAILABILITY. Ô cũ đã ghi "Duyệt" vẫn được hiểu như trước. Tab REGISTRATIONS vẫn giữ "Duyệt", vì ở đó nó nghĩa là duyệt đăng ký.

Bốn lựa chọn còn lại:

| Lựa chọn | Kết quả |
|---|---|
| Duyệt, tự chọn tutor thay | Khoá slot, hệ thống chọn tutor khác đang trống. Không còn ai trống thì huỷ buổi, học viên không bị trừ buổi, nhận email mời đặt lại |
| Duyệt, chỉ định tutor thay | Ghi mã tutor (ví dụ T002) ở cột `admin_note` trước khi chọn. Tutor đó bận thì giữ "Chờ duyệt" và ghi lý do ở cột `outcome` |
| Duyệt, huỷ buổi | Khoá slot, huỷ buổi, học viên không bị trừ buổi |
| Từ chối | Slot mở lại, tutor vẫn phải dạy |

Không quyết trước giờ học ít nhất 3 giờ (`TUTOR_CANCEL_DECIDE_BEFORE_HOURS`) thì yêu cầu tự bị từ chối.

## 3. "Không ghi lượt xem trang vào nhật ký"

Code hiện **không có** hành động nào ghi lượt xem trang. Những dòng giống "xem trang" có thể là:

* **LOGIN:** mỗi lần bấm link đăng nhập hoặc đăng nhập Google tạo một phiên mới. Nên giữ, vì cần cho bảo mật.
* **NOTIF_READ:** admin bấm đọc thông báo. Có thể bỏ.
* **SHEET_CHANGE kiểu OTHER:** Google gửi khi có thay đổi cấu trúc file.

Anh chụp một dòng đang thấy (BL02) thì sửa đúng loại đó ở 5K.

## Nguồn

* [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas?hl=en)
* [Gmail sending limits in Google Workspace](https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace)
* [GmailApp reference](https://developers.google.com/apps-script/reference/gmail/gmail-app)
* [Resend pricing](https://www.resend.com/pricing.md)
