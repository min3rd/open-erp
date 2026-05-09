# SCR-AUTH-006 — Onboarding Wizard

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-AUTH-006 |
| Route | /onboarding |
| Luồng liên quan | FLOW-AUTH-REGISTER-DN-001 |
| Mục tiêu | Thiết lập tenant lần đầu sau khi activation thành công |

## 2. Layout và cấu trúc

- Sub-stepper 5 bước: Gói dịch vụ, Phòng ban, Người dùng đầu tiên, Logo & thương hiệu, Hoàn tất.
- Khu vực nội dung từng bước ở giữa màn hình.
- Footer cố định với nút Lưu & Tiếp theo / Bỏ qua (cho bước 3-5).

## 3. Danh sách component

| Component | Vị trí | Variant | Hành vi |
|---|---|---|---|
| tab-stepper | Header nội dung | horizontal | Theo dõi tiến độ từng bước |
| service-plan-card | Bước 1 | selectable | Chọn gói phù hợp |
| dynamic-list-input | Bước 2-3 | repeater | Thêm/xóa phòng ban hoặc email mời |
| file-upload | Bước 4 | image | Upload logo PNG/SVG <= 2MB |

## 4. Trạng thái màn hình

- Default: bắt đầu bước 1.
- Partial saved: hiển thị trạng thái đã lưu tạm.
- Completed: điều hướng vào dashboard.

## 5. Dữ liệu hiển thị

- Dữ liệu từ tenant vừa tạo: tên DN, mã tenant, gói trial.
- Bước nào có thể skip phải ghi metadata tiến độ để khôi phục.

## 6. Responsive

| Breakpoint | Thay đổi layout |
|---|---|
| >=1200px | Stepper ngang đầy đủ |
| <1200px | Stepper cuộn ngang |
| <768px | Bố cục 1 cột, action full width |
