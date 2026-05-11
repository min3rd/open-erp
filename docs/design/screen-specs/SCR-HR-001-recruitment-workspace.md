# SCR-HR-001 — Recruitment Workspace

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Mã màn hình     | SCR-HR-001                                                                                       |
| Route           | /hr/recruitment/workspace                                                                        |
| Luồng liên quan | FLOW-HR-S03-REC-001                                                                              |
| Mục tiêu        | Quản lý tập trung requisition, candidate pipeline, interview và offer ở một workspace thống nhất |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: page header, breadcrumb, bộ lọc nhanh theo phòng ban/trạng thái/thời gian.
- Vùng B: panel trái danh sách requisition.
- Vùng C: panel giữa candidate pipeline theo stage.
- Vùng D: panel phải candidate detail drawer (CV, timeline, action).

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính                     | Khoảng cách chính           |
| ---------- | ------ | ------------------------------------------- | --------------------------- |
| >=1280px   | 12 cột | B:3 cột, C:6 cột, D:3 cột                   | Gap 16px, card padding 16px |
| 768-1279px | 12 cột | B và C dạng stacked, D mở dạng side sheet   | Gap 12px                    |
| <768px     | 4 cột  | Chuyển sang tab Requisition/Pipeline/Detail | Padding 12px, list gap 8px  |

## 3. Đặc tả component

| Component               | Vị trí | Variant/State                   | Dữ liệu đầu vào                          | Ràng buộc hiển thị                    |
| ----------------------- | ------ | ------------------------------- | ---------------------------------------- | ------------------------------------- |
| recruitment-filter-bar  | Vùng A | default, loading                | departmentId, status, dateRange, keyword | Debounce search 300ms                 |
| requisition-list        | Vùng B | loading, loaded, empty          | requisitions[]                           | Chỉ hiển thị tenant hiện tại          |
| candidate-kanban        | Vùng C | loading, drag-enabled, readonly | candidatesByStage                        | Drag chỉ cho transition hợp lệ        |
| candidate-detail-drawer | Vùng D | closed, open, loading           | candidateId                              | Mở khi chọn candidate                 |
| global-alert-strip      | Top    | info, warning, error            | alerts[]                                 | Ưu tiên cảnh báo SLA và offer expired |

## 4. Hành động và phản hồi UI

| Trigger                          | Xử lý                                         | Phản hồi UI                                                                      |
| -------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Chọn requisition                 | Tải candidate theo requisition                | Loading skeleton pipeline, sau đó render cột stage                               |
| Kéo thả candidate sang stage mới | Validate transition và gọi API cập nhật stage | Thành công: animate chuyển cột; thất bại: trả candidate về vị trí cũ + toast lỗi |
| Nhấn Lên lịch phỏng vấn          | Mở SCR-HR-005                                 | Side sheet scheduler mở với dữ liệu candidate đã chọn                            |
| Nhấn Gửi offer                   | Điều hướng SCR-HR-007                         | Prefill thông tin candidate và requisition                                       |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Cột pipeline reveal theo thứ tự trái -> phải trong 200ms.
- Khi đổi stage hợp lệ, card candidate di chuyển mượt 180ms.
- Drawer mở bằng slide-in 160ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: lọc requisition, chuyển stage, mở lịch phỏng vấn và gửi offer thành công.
- Validation error: stage transition không hợp lệ theo ma trận nghiệp vụ.
- Expired: candidate offer hết hạn hiển thị badge EXPIRED và khóa action accept.
- Locked: candidate đang bị người dùng khác chỉnh sửa hiển thị cảnh báo conflict.
- Permission: HR Staff không có quyền duyệt requisition không thấy action duyệt.
- No-data: requisition chưa có candidate hiển thị empty state có CTA thêm ứng viên.
- Offline: hiển thị banner offline, khóa thao tác ghi.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: requisitionCode, jobTitle, department, candidateName, stage, aiScore, interviewAt, offerStatus.
- Date/time hiển thị theo timezone tenant và format dd/MM/yyyy HH:mm.
- Salary preview dùng format tiền tệ VND có phân tách hàng nghìn.
- Toàn bộ lỗi map qua messageKey + metadata.
