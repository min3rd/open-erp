# SCR-HR-002 — Requisition Form

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-002                                                                  |
| Route           | /hr/recruitment/requisitions/new hoặc /hr/recruitment/requisitions/:id/edit |
| Luồng liên quan | FLOW-HR-S03-REC-001                                                         |
| Mục tiêu        | Tạo hoặc chỉnh sửa requisition với dữ liệu hợp lệ trước khi gửi duyệt       |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header chứa trạng thái requisition và action bar.
- Vùng B: form chính (job title, department, position, số lượng, deadline, mô tả).
- Vùng C: panel phải hiển thị checklist validate và gợi ý quality nội dung.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid    | Vị trí thành phần chính | Khoảng cách chính            |
| ---------- | ------- | ----------------------- | ---------------------------- |
| >=1024px   | 12 cột  | B:8 cột, C:4 cột sticky | Gap 20px, field gap 14px     |
| <1024px    | 4/8 cột | C xuống dưới form       | Padding 16px, field gap 12px |

## 3. Đặc tả component

| Component             | Vị trí | Variant/State                        | Dữ liệu đầu vào             | Ràng buộc hiển thị                    |
| --------------------- | ------ | ------------------------------------ | --------------------------- | ------------------------------------- |
| requisition-main-form | Vùng B | pristine, dirty, invalid, submitting | formModel                   | Validate realtime các trường bắt buộc |
| positions-selector    | Vùng B | default, loading                     | departmentId -> positions[] | Chỉ hiện position active              |
| deadline-picker       | Vùng B | default, error                       | deadline                    | Chặn chọn ngày <= hôm nay             |
| validation-checklist  | Vùng C | pass, fail, warning                  | validationState             | Cập nhật theo từng field              |
| action-bar            | Vùng A | save-draft, submit-approval, cancel  | permissions, formState      | Submit chỉ bật khi form hợp lệ        |

## 4. Hành động và phản hồi UI

| Trigger              | Xử lý                               | Phản hồi UI                                                 |
| -------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Nhấn Lưu nháp        | Gọi API lưu trạng thái draft        | Toast thành công, giữ lại form                              |
| Nhấn Gửi duyệt       | Validate toàn bộ và gửi API         | Disable action, spinner, chuyển trạng thái PENDING_APPROVAL |
| Đổi phòng ban        | Reload danh sách position tương ứng | Reset position cũ nếu không còn hợp lệ                      |
| Nhập mô tả công việc | Chạy kiểm tra độ đầy đủ nội dung    | Checklist quality cập nhật realtime                         |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Panel checklist đổi trạng thái bằng fade 120ms.
- Scroll-to-first-error khi submit fail.
- CTA submit đổi sang loading giữ nguyên kích thước.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: form hợp lệ, submit thành công, requisition vào PENDING_APPROVAL.
- Validation error: `numberOfPositions < 1`, `deadline <= currentDate`, thiếu department/position.
- Locked: requisition đã được duyệt, chuyển read-only khi mở lại.
- Permission: người không có quyền tạo/chỉnh sửa chỉ xem được thông tin.
- No-data: chưa có position active trong department đã chọn.
- Offline: lưu local draft và đánh dấu pending sync.

## 7. Dữ liệu hiển thị và quy tắc format

- Trường chính: jobTitle, departmentId, positionId, numberOfPositions, salaryRange, deadline, description, requirements.
- Salary range hiển thị dạng min-max VND.
- Deadline dùng format dd/MM/yyyy.
- Lý do reject trước đó (nếu có) hiển thị block riêng read-only.
