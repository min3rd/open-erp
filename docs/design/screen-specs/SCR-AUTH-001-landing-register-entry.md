# SCR-AUTH-001 — Landing / Register Entry

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-001 |
| Route | / |
| Luồng liên quan | Đăng ký doanh nghiệp tự phục vụ |
| Mục tiêu | Giới thiệu sản phẩm và điều hướng vào đăng ký |

## 2. Layout và cấu trúc

- Header sticky: logo, menu, Đăng nhập, Dùng thử.
- Hero 2 cột: thông điệp giá trị + mockup sản phẩm.
- Dải tính năng, dải module, pricing, CTA cuối trang, footer.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| top-nav | Header | Public | Sticky khi cuộn |
| btn-primary | Hero/CTA | default | Điều hướng sang /register |
| btn-secondary | Hero | default | Điều hướng xem demo |
| feature-card | Dải tính năng | 4 cột desktop | Thu gọn 1 cột trên mobile |

## 4. Trạng thái màn hình

- Default: tải đầy đủ toàn bộ section.
- Loading skeleton: với logo khách hàng và pricing khi dữ liệu động.
- Error nhẹ: fallback nội dung tĩnh nếu API marketing lỗi.

## 5. Dữ liệu hiển thị

- Tiêu đề/đoạn mô tả lấy từ CMS hoặc cấu hình landing.
- Các CTA dùng key i18n của Transloco.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1200px | Hero 2 cột, pricing 3 cột |
| 768px-1199px | Hero 2 cột co giãn, feature 2 cột |
| <768px | Hero 1 cột, pricing kéo ngang |
