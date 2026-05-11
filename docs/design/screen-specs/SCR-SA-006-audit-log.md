# SCR-SA-006 — Audit Log

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                   |
| --------------- | ----------------------------------------- |
| Mã màn hình     | SCR-SA-006                                |
| Route           | /settings/audit-log                       |
| Luồng liên quan | Kiểm toán hệ thống                        |
| Mục tiêu        | Theo dõi và truy vết thao tác trên tenant |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: filter bar đa tiêu chí.
- Vùng B: bảng audit logs.
- Vùng C: drawer chi tiết before/after.
- Vùng D: công cụ export CSV (nếu có quyền).

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid    | Vị trí thành phần chính             | Khoảng cách chính                |
| ---------- | ------- | ----------------------------------- | -------------------------------- |
| >=1024px   | 12 cột  | Table full width, drawer mở từ phải | Row height 44px, filter gap 12px |
| <1024px    | 8/4 cột | Card list + màn chi tiết riêng      | Padding 16px, card gap 12px      |

## 3. Đặc tả component

| Component        | Vị trí | Variant/State              | Dữ liệu đầu vào                    | Ràng buộc hiển thị                     |
| ---------------- | ------ | -------------------------- | ---------------------------------- | -------------------------------------- |
| audit-filter-bar | Vùng A | compact, expanded          | dateRange, actor, action, resource | Lọc server-side, validate phạm vi ngày |
| audit-table      | Vùng B | loading, loaded, no-result | logs[]                             | Cột nhạy cảm áp dụng mask policy       |
| detail-drawer    | Vùng C | closed, open               | selectedLog                        | Chỉ mở khi user có quyền xem chi tiết  |
| export-button    | Vùng D | enabled, disabled, loading | exportPermission                   | Ẩn khi không có quyền export           |

## 4. Hành động và phản hồi UI

| Trigger                      | Xử lý                           | Phản hồi UI                                 |
| ---------------------------- | ------------------------------- | ------------------------------------------- |
| Áp dụng bộ lọc               | Gọi API audit-log               | Cập nhật bảng và reset trang                |
| Nhấn xem chi tiết log        | Mở drawer + gọi API detail      | Hiển thị JSON diff trước/sau                |
| Nhấn Export CSV              | Gọi API export job              | Hiển thị tiến trình và trạng thái tải xuống |
| API trả 403 dữ liệu nhạy cảm | Chặn hiển thị trường restricted | Banner cảnh báo không đủ quyền              |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Drawer mở/đóng mượt 180ms.
- Hàng bảng hover highlight nhẹ để tăng khả năng quét.
- JSON diff collapse/expand có animation chiều cao ngắn.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: lọc và tra cứu log chính xác.
- Validation error: khoảng ngày lọc không hợp lệ.
- Expired: phiên hết hạn khi truy vấn.
- Permission: không đủ quyền xem chi tiết/export.
- No-data: không có log khớp điều kiện lọc.
- Offline: truy vấn thất bại do mất mạng, cho retry.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: timestamp, actor, action, resource, ipAddress, userAgent, diff.
- Trường nhạy cảm phải mask theo policy.
- Mọi thông báo lỗi hiển thị qua messageKey + metadata.
