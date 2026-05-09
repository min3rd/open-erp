# SCR-HR-012 — Contract List & Expiry Alerts

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-012 |
| Route | /hr/contracts |
| Luồng liên quan | FLOW-HR-S03-CON-001 |
| Mục tiêu | Theo dõi danh sách hợp đồng và cảnh báo hết hạn 30/7 ngày |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: header + KPI cards (sắp hết hạn 30 ngày, 7 ngày, đã hết hạn).
- Vùng B: filter trạng thái, phòng ban, thời hạn.
- Vùng C: bảng danh sách hợp đồng.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | KPI hàng trên, table full width | Gap 16px |
| <1024px | 4 cột | KPI thành carousel, list card | Gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| contract-kpi-cards | Vùng A | normal, warning, critical | expiringMetrics | Màu theo mức cảnh báo |
| contract-filter-bar | Vùng B | default | status, dept, daysToExpire | Lọc server-side |
| contract-table | Vùng C | loading, loaded, empty | contracts[] | Cột lương ẩn theo quyền |
| expiry-badge | Vùng C | >30, <=30, <=7, expired | endDate | Tính theo ngày hiện tại tenant |
| create-contract-button | Vùng A | enabled, disabled | permissionCreate | Chỉ HR role thấy |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Chọn filter sắp hết hạn | Gọi API contracts/expiring | Bảng cập nhật theo khoảng ngày |
| Nhấn dòng hợp đồng | Mở SCR-HR-013 | Điều hướng chi tiết hợp đồng |
| Nhấn Tạo hợp đồng | Mở form tạo mới | Prefill employee nếu đi từ profile |
| Nhấn badge cảnh báo | Áp bộ lọc nhanh | Highlight hàng tương ứng |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- KPI card count-up nhẹ khi dữ liệu tải xong.
- Hàng bảng cảnh báo <=7 ngày nháy nền nhẹ 1 lần.
- Badge expiry đổi màu theo mốc thời gian.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: xem danh sách, lọc cảnh báo và mở chi tiết.
- Validation error: filter ngày không hợp lệ.
- Expired: hợp đồng quá hạn hiển thị trạng thái EXPIRED.
- Permission: role không được xem lương chỉ thấy cột ẩn.
- No-data: chưa có hợp đồng trong tenant.
- Offline: hiển thị snapshot lần đồng bộ gần nhất.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: contractNumber, employeeName, contractType, startDate, endDate, status, basicSalary.
- Date format dd/MM/yyyy.
- basicSalary format VND.
