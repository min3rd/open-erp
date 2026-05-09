# SCR-SA-001 — Dashboard tổng quan

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-SA-001 |
| Route | /dashboard |
| Luồng liên quan | Điều hướng sau đăng nhập |
| Mục tiêu | Cung cấp cái nhìn tổng quan KPI và hoạt động gần đây |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: header trang với bộ lọc thời gian và phạm vi dữ liệu.
- Vùng B: dải KPI cards.
- Vùng C: timeline hoạt động gần đây.
- Vùng D: danh sách việc cần xử lý và cảnh báo hệ thống.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1200px | 12 cột | KPI 4 cột, C và D chia 7/5 | Container 1200px, gutter 24px, section gap 24px |
| 768px-1199px | 8 cột | KPI 2x2, C và D xếp dọc | Gutter 16px, section gap 20px |
| <768px | 4 cột | KPI dạng carousel/card stack | Padding 16px, section gap 16px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| period-filter | Vùng A | day/week/month/custom | selectedRange | Chỉ hiển thị phạm vi phù hợp role |
| kpi-card | Vùng B | normal, warning, critical | title, value, trend | Màu theo ngưỡng cảnh báo; có tooltip giải thích |
| activity-timeline | Vùng C | loaded, empty, loading | activities[] | Tối đa 10 bản ghi mặc định, có nút xem thêm |
| task-panel | Vùng D | default, empty | tasks[] | Sắp xếp theo mức ưu tiên và hạn xử lý |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Đổi bộ lọc thời gian | Gọi API dashboard theo range mới | Hiển thị skeleton và cập nhật dữ liệu mới |
| Nhấn vào KPI card | Điều hướng trang chi tiết liên quan | Highlight card đã chọn trước khi chuyển trang |
| Nhấn Xem thêm timeline | Tải thêm bản ghi | Append dữ liệu, giữ vị trí cuộn |
| API dashboard lỗi | Fallback theo widget | Widget lỗi hiển thị retry độc lập |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- KPI cards xuất hiện theo stagger 50ms.
- Trend tăng/giảm dùng micro-animation nhẹ ở icon mũi tên.
- Khi đổi filter, widget cross-fade 150ms để tránh giật.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: dữ liệu dashboard tải đầy đủ theo quyền user.
- Validation error: khoảng thời gian lọc không hợp lệ.
- Expired: session hết hạn -> chuyển về đăng nhập.
- Permission: widget ngoài quyền truy cập bị ẩn hoặc disabled.
- No-data: tenant mới chưa có số liệu -> hiển thị empty state có hướng dẫn.
- Offline: hiển thị dữ liệu cache gần nhất + cờ stale data.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: kpiMetrics, recentActivities, pendingTasks, selectedRange.
- Số liệu tài chính định dạng theo locale + currency tenant.
- Múi giờ hiển thị thống nhất theo tenant timezone.
