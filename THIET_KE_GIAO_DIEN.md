# Thiết kế giao diện thaiput (bản 5O, 05/11/2026, thay bản 19/10)

## Nguyên tắc rút từ ảnh thương hiệu

Nền trắng, nét đen theo ảnh thương hiệu (nhân vật line-art đen trên nền trắng, điểm vàng). Màu chính là ĐEN TRẮNG: nút chính và mục đang chọn là viên thuốc đen chữ trắng. Vàng thương hiệu (vàng chùa Thái trong logo) chỉ dùng cho dấu nhận diện: ô chữ Thái của logo, viên chữ Thái trang chủ, thẻ gói học. Màu phụ là xanh lá, tím, vàng, xanh dương dạng phấn cho trạng thái. Khối bo góc, ĐỔ BÓNG THAY VIỀN (bóng mềm tách khối khỏi nền trắng). Tiêu đề lớn, đậm, chữ khít; chữ phụ nhỏ, xám. Bộ lọc là các viên thuốc rời. Danh sách là các dòng trắng bo tròn trên khay xám. Nhiều khoảng trống.

## Màu

| Tên | Mã | Dùng cho |
|---|---|---|
| Nền | `#ffffff` | Nền trang |
| Bề mặt | `#ffffff` | Khối, thẻ, ô nhập (tách khỏi nền bằng bóng) |
| Bề mặt 2 | `#f6f6f3` | Khay danh sách, ô giờ, khối phụ, alert thường |
| Chữ | `#141414` | Chữ chính, nút chính, mục đang chọn |
| Chữ phụ | `#63635d` | Ghi chú, giờ, nhãn nhỏ |
| Vàng thương hiệu | `#ffc933` (chữ `#141414`, chữ vàng đậm `#6e5300`) | Ô logo, viên chữ Thái trang chủ |
| Vàng bơ | `#ffefb8` | Thẻ gói học, gói đang chọn, lưu ý, giờ chờ duyệt |
| Bạc hà | `#d9f0d2` | Ô số liệu trang chủ, giờ đã đặt |
| Oải hương | `#e6e0fa` (chữ `#4c3fb0`, số đếm `#5b4ed6`) | Ô ngày giờ của buổi học, số đếm |
| Hồng phấn | `#fbe2de` (chữ `#b3261e`) | Khẩn, lỗi, giờ bị khoá |
| Xanh dương phấn | `#dcecfa` | Buổi được bù, thông tin |
| Zalo | `#0068ff` | Chỉ nút Zalo |

Chỉ có giao diện sáng: máy đặt chế độ tối vẫn hiện đúng các màu trên.

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

- **Nút:** viên thuốc cao 46px. Nút chính tô đen, chữ trắng. Nút phụ nền trắng, viền mảnh. Nút huỷ chữ đỏ.
- **Nhãn trạng thái:** viên thuốc màu phấn, chữ đậm cùng tông.
- **Đổ bóng:** bóng mềm cho mọi khối trên nền trắng (thay viền); bóng lớn cho thứ nổi: hộp thoại, thanh tab trên điện thoại, thanh hành động, thông báo nhỏ.
- **Thanh tab:** trên điện thoại là thanh nổi bo tròn ở đáy; trên máy tính là khối trắng bên trái. Mục đang chọn tô đen.
- **Form:** ô nhập sai có viền đỏ đúng ô (`input.invalid`).

## Biểu tượng

Nét mảnh 1,75, đầu nét tròn, khung 20px, cùng màu chữ. Trang quản trị có thêm 4 biểu tượng tab: chuông, người, mũ tốt nghiệp, trang ghi.

## Điểm nhận diện

Ô logo vàng thương hiệu chữ Thái đen; thẻ gói học màu vàng bơ có chữ Thái พูด (nói) chìm phía sau.
