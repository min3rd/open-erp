# SCR-SA-008 — Notification Preferences

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-008 |
| Route | /settings/notifications |
| Luồng liên quan | Cài đặt thông báo |
| Mục tiêu | Cấu hình kênh và loại thông báo cho người dùng/tenant |

## 2. Layout và cấu trúc

- Khối kênh thông báo tổng quát: In-app, Email, Push.
- Ma trận loại thông báo theo từng kênh.
- Chọn tần suất email tóm tắt.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| channel-toggle-group | Trên cùng | switch list | Bật/tắt kênh chính |
| preference-matrix | Nội dung | compact table | Tick theo loại thông báo |
| frequency-radio | Cuối trang | radio group | Chọn lịch gửi digest |
| save-button | Footer | primary | Lưu policy thông báo |

## 4. Trạng thái màn hình

- Không có quyền cấu hình push.
- Save thành công/thất bại.
- Mất kết nối: giữ local draft.

## 5. Dữ liệu hiển thị

- notificationTypes, channelAvailability, digestFrequency.
- Ràng buộc phụ thuộc subscription plan.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1024px | Matrix dạng bảng |
| <1024px | Accordion theo từng loại thông báo |
