# SCR-HR-003 — Requisition Approval Detail

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                            |
| --------------- | ------------------------------------------------------------------ |
| Mã màn hình     | SCR-HR-003                                                         |
| Route           | /hr/recruitment/requisitions/:id/approval                          |
| Luồng liên quan | FLOW-HR-S03-REC-001                                                |
| Mục tiêu        | Hỗ trợ HR Manager duyệt hoặc từ chối requisition với lý do rõ ràng |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: thông tin tổng quan requisition và SLA.
- Vùng B: nội dung requisition chi tiết.
- Vùng C: action panel approve/reject và ghi chú phê duyệt.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính     | Khoảng cách chính |
| ---------- | ------ | --------------------------- | ----------------- |
| >=1024px   | 12 cột | B:8 cột, C:4 cột sticky     | Gap 16px          |
| <1024px    | 4 cột  | C chuyển thành bottom sheet | Padding 16px      |

## 3. Đặc tả component

| Component                | Vị trí | Variant/State              | Dữ liệu đầu vào    | Ràng buộc hiển thị           |
| ------------------------ | ------ | -------------------------- | ------------------ | ---------------------------- |
| requisition-summary-card | Vùng A | default, warning-sla       | requisitionSummary | Cảnh báo nếu gần SLA quá hạn |
| requisition-content-view | Vùng B | readonly                   | requisitionDetail  | Không cho sửa ở màn duyệt    |
| approve-button           | Vùng C | enabled, loading, disabled | permissionApprove  | Chỉ HR Manager thấy          |
| reject-button            | Vùng C | enabled, loading           | permissionReject   | Bắt buộc reason khi reject   |
| reject-reason-input      | Vùng C | hidden, visible, error     | reason             | Min 10 ký tự khi từ chối     |

## 4. Hành động và phản hồi UI

| Trigger                 | Xử lý                             | Phản hồi UI                                   |
| ----------------------- | --------------------------------- | --------------------------------------------- |
| Nhấn Duyệt              | Gọi API approve                   | Chuyển trạng thái APPROVED + toast thành công |
| Nhấn Từ chối            | Mở ô nhập lý do -> gọi API reject | Chuyển trạng thái REJECTED và ghi lý do       |
| Không nhập lý do reject | Validate cục bộ                   | Highlight trường reason + thông báo lỗi       |
| Nhấn Quay lại workspace | Điều hướng về SCR-HR-001          | Giữ bộ lọc hiện tại                           |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Status badge đổi màu theo trạng thái trong 100ms.
- Panel reason slide-down khi chọn từ chối.
- Hiệu ứng success check khi duyệt thành công.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: HR Manager duyệt requisition thành công.
- Validation error: reason từ chối quá ngắn.
- Locked: requisition đã được người khác xử lý trước đó.
- Permission: người dùng không phải HR Manager không thấy action panel.
- No-data: requisition không tồn tại hoặc không thuộc tenant.
- Offline: khóa approve/reject, chỉ cho xem read-only.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: requisitionCode, requestedBy, department, position, positionsCount, deadline, status, approvalHistory.
- SLA hiển thị dạng còn lại X giờ/phút.
- Approval history sắp xếp mới nhất trước.
