# SCR-HR-014 — Org/Position Mapping

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-014                                                                                |
| Route           | /hr/org-mapping                                                                           |
| Luồng liên quan | FLOW-HR-S03-ORG-001                                                                       |
| Mục tiêu        | Gán mapping phòng ban, chức danh, quản lý trực tiếp cho nhân viên theo cây tổ chức hợp lệ |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: cây tổ chức.
- Vùng B: danh sách nhân viên theo node đang chọn.
- Vùng C: form mapping department/position/manager.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính    | Khoảng cách chính |
| ---------- | ------ | -------------------------- | ----------------- |
| >=1280px   | 12 cột | A:3 cột, B:4 cột, C:5 cột  | Gap 16px          |
| <1280px    | 4 cột  | A dạng drawer, B/C stacked | Gap 12px          |

## 3. Đặc tả component

| Component            | Vị trí | Variant/State             | Dữ liệu đầu vào               | Ràng buộc hiển thị                  |
| -------------------- | ------ | ------------------------- | ----------------------------- | ----------------------------------- |
| org-tree             | Vùng A | loading, loaded, empty    | departmentsTree               | Node inactive disable action gán    |
| employee-node-list   | Vùng B | list, empty               | employeesByNode[]             | Chỉ nhân viên thuộc node được chọn  |
| mapping-form         | Vùng C | editable, invalid, saving | deptId, positionId, managerId | managerId cùng tenant và hợp lệ cây |
| manager-suggestion   | Vùng C | list, empty               | managerCandidates[]           | Loại bỏ self và vòng lặp            |
| impact-preview-panel | Vùng C | info                      | permissionImpact              | Hiển thị thay đổi phạm vi quản lý   |

## 4. Hành động và phản hồi UI

| Trigger               | Xử lý                        | Phản hồi UI                        |
| --------------------- | ---------------------------- | ---------------------------------- |
| Chọn node cây tổ chức | Tải danh sách nhân viên node | Danh sách cập nhật realtime        |
| Chọn manager mới      | Validate rule cây            | Cảnh báo nếu tạo vòng lặp          |
| Nhấn Lưu mapping      | Gọi API cập nhật org mapping | Toast thành công + refresh profile |
| Node inactive         | Chặn gán mới                 | Hiển thị tooltip giải thích        |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Node tree expand/collapse 120ms.
- Danh sách nhân viên chuyển node bằng fade.
- Impact preview nhấn mạnh thay đổi bằng highlight 1 lần.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: chọn node active, gán manager hợp lệ, lưu thành công.
- Validation error: manager khác tenant hoặc vòng lặp quản lý.
- Locked: node đang được chỉnh sửa bởi admin khác.
- Permission: người dùng chỉ quản lý được phạm vi node được cấp quyền.
- No-data: node chưa có nhân viên.
- Offline: không cho lưu mapping, vẫn xem được cấu trúc cache.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: departmentId, positionId, managerId, employeeId, nodeStatus.
- Tên node hiển thị theo path đầy đủ (Company / Khối / Phòng).
- Lịch sử thay đổi mapping lưu theo timestamp.
