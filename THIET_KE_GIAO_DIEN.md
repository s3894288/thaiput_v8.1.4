# Thiết kế giao diện thaiput (19/10/2026)

## Nguyên tắc rút từ ảnh tham chiếu

Nền xám nhạt, nội dung đặt trong các khối trắng bo tròn lớn, gần như không viền, không đổ bóng. Màu phấn (xanh bạc hà, vàng bơ, oải hương, hồng phấn) dùng cho thẻ nổi bật và nhãn trạng thái. Nút chính và mục đang chọn là viên thuốc tô màu đậm. Tiêu đề lớn, đậm, chữ khít; chữ phụ nhỏ, xám. Biểu tượng nét mảnh. Bộ lọc là các viên thuốc rời. Danh sách là các dòng trắng bo tròn trên khay xám. Nhiều khoảng trống.

## Màu

| Tên | Mã | Dùng cho |
|---|---|---|
| Nền | `#eceee9` | Nền trang |
| Bề mặt | `#ffffff` | Khối, thẻ, ô nhập |
| Bề mặt 2 | `#f3f5f1` | Khay danh sách, ô giờ, khối phụ |
| Chữ | `#131a15` | Chữ chính |
| Chữ phụ | `#5f6861` | Ghi chú, giờ, nhãn nhỏ |
| Xanh rừng | `#1d3b29` | Nút chính, mục đang chọn, giờ đã chọn |
| Bạc hà | `#c3efb9` | Thẻ gói học, gói đang chọn, ô số liệu |
| Vàng bơ | `#fcefc0` | Lưu ý, "cần xử lý", giờ chờ duyệt |
| Oải hương | `#e0d9ff` (chữ `#4a3fb0`, số đếm `#5b4ed6`) | Ô ngày giờ của buổi học, số đếm, chờ tutor xác nhận |
| Hồng phấn | `#fbe1de` (chữ `#b3261e`) | Khẩn, lỗi, giờ bị khoá |
| Vàng chùa | `#b7862b` (chữ trên nền trắng `#8a6418`) | Chữ Thái trên logo và trang chủ |
| Zalo | `#0068ff` | Chỉ nút Zalo |

Chỉ có giao diện sáng (từ 20/10): máy đặt chế độ tối vẫn hiện đúng các màu trên.

## Chữ

Một phông: **Be Vietnam Pro** (thiết kế cho dấu tiếng Việt), số dùng chữ số đều cột. Chữ Thái: Noto Sans Thai Looped (đầu tròn, nhận ra ngay là chữ Thái). Bỏ phông đơn cách IBM Plex Mono.

| Cỡ | Điện thoại | Máy tính |
|---|---|---|
| Tiêu đề trang chủ | 34px, 700 | 44px |
| Tiêu đề trang (h1) | 30px, 700 | 37px |
| Tiêu đề mục (h2) | 21px, 700 | 23px |
| Chữ thường | 15px, 400 | 15.5px |
| Chữ phụ | 12 đến 13px | như cũ |

## Khoảng cách và bo góc

Khoảng cách theo bước 4: 4, 8, 12, 16, 20, 24, 32. Lề hai bên 16px trên điện thoại, 32px trên máy tính.

Bo góc: khối lớn 24px, thẻ 18px, ô nhập và lưu ý 14px, ô giờ 12px, nút và nhãn tròn hẳn (viên thuốc).

## Thành phần

- **Nút:** viên thuốc cao 46px. Nút chính tô xanh rừng. Nút phụ nền trắng, viền mảnh. Nút huỷ chữ đỏ.
- **Nhãn trạng thái:** viên thuốc màu phấn, chữ đậm cùng tông.
- **Đổ bóng:** chỉ cho thứ nổi trên trang: hộp thoại, thanh tab trên điện thoại, thanh hành động, thông báo nhỏ.
- **Thanh tab:** trên điện thoại là thanh nổi bo tròn ở đáy; trên máy tính là khối trắng bên trái. Mục đang chọn tô xanh rừng.

## Biểu tượng

Nét mảnh 1,75, đầu nét tròn, khung 20px, cùng màu chữ. Trang quản trị có thêm 4 biểu tượng tab: chuông, người, mũ tốt nghiệp, trang ghi.

## Điểm nhận diện

Thẻ gói học màu bạc hà có chữ Thái พูด (nói) chìm phía sau.
