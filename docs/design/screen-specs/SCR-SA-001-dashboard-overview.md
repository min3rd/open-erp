# SCR-SA-001 — Dashboard tổng quan

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-001 |
| Route | /dashboard |
| Luồng liên quan | App shell sau đăng nhập |
| Mục tiêu | Cung cấp cái nhìn tổng quan KPI và hoạt động gần đây |

## 2. Layout và cấu trúc

- App shell: sidebar trái, header trên, content giữa.
- Hàng KPI 4 widget.
- Hàng dưới: timeline hoạt động + danh sách việc cần làm.

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| app-sidebar | Trái | expanded/collapsed | Điều hướng module |
| kpi-widget | Header content | card | Hiển thị số và trend |
| timeline-list | Cột trái hàng 2 | scroll | 10 hoạt động gần nhất |
| task-list | Cột phải hàng 2 | priority badges | Việc cần xử lý |

## 4. Trạng thái màn hình

- Default có dữ liệu.
- Empty state cho tenant mới.
- Loading skeleton theo từng widget.

## 5. Dữ liệu hiển thị

- KPI theo phạm vi tenant.
- Timeline và task lấy từ nhiều module, đồng bộ timezone tenant.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1200px | KPI 4 cột, panel 2 cột |
| 768px-1199px | KPI 2x2, panel 1 cột |
| <768px | Dùng tab mobile, card stack |
