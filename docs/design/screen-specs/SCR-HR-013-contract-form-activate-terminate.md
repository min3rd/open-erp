# SCR-HR-013 — Contract Form / Activate / Terminate

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-013                                                                      |
| Route           | /hr/contracts/new hoặc /hr/contracts/:id                                        |
| Luồng liên quan | FLOW-HR-S03-CON-001                                                             |
| Mục tiêu        | Tạo mới hợp đồng, kích hoạt hợp đồng đã ký và thực hiện thanh lý đúng lifecycle |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header trạng thái hợp đồng + hành động lifecycle.
- Vùng B: form thông tin hợp đồng.
- Vùng C: lịch sử trạng thái và cảnh báo rule bất biến.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính      | Khoảng cách chính |
| ---------- | ------ | ---------------------------- | ----------------- |
| >=1024px   | 12 cột | B:8 cột, C:4 cột             | Gap 16px          |
| <1024px    | 4 cột  | C thành accordion cuối trang | Gap 12px          |

## 3. Đặc tả component

| Component               | Vị trí  | Variant/State                      | Dữ liệu đầu vào      | Ràng buộc hiển thị            |
| ----------------------- | ------- | ---------------------------------- | -------------------- | ----------------------------- |
| contract-form           | Vùng B  | editable, readonly, invalid        | contractPayload      | ACTIVE thì khóa trường chính  |
| lifecycle-action-bar    | Vùng A  | draft, active, expired, terminated | status + permissions | Chỉ cho transition hợp lệ     |
| allowances-repeater     | Vùng B  | add/remove                         | allowances[]         | Amount phải >=0               |
| status-history-timeline | Vùng C  | list                               | history[]            | Immutable                     |
| termination-modal       | Overlay | hidden, visible                    | terminationReason    | reason bắt buộc khi terminate |

## 4. Hành động và phản hồi UI

| Trigger                   | Xử lý                                       | Phản hồi UI                  |
| ------------------------- | ------------------------------------------- | ---------------------------- |
| Nhấn Lưu DRAFT            | Gọi API create/update                       | Toast thành công             |
| Nhấn Kích hoạt            | Validate signedByCompany + signedByEmployee | Chuyển trạng thái ACTIVE     |
| Nhấn Thanh lý             | Mở modal lý do -> gọi API terminate         | Chuyển trạng thái TERMINATED |
| Chỉnh sửa contract ACTIVE | Chặn thao tác                               | Hiển thị cảnh báo bất biến   |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Status timeline thêm event mới bằng fade-in.
- Modal terminate mở bằng zoom nhẹ.
- Sau activate thành công hiển thị check animation.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: tạo DRAFT -> activate thành ACTIVE -> theo dõi lifecycle.
- Validation error: endDate < startDate, thiếu dữ liệu ký.
- Expired: hợp đồng quá hạn hiển thị EXPIRED tự động.
- Locked: contract ACTIVE không cho sửa core fields.
- Permission: terminate yêu cầu quyền HR Manager.
- No-data: mở contract id không tồn tại.
- Offline: khóa thao tác transition, chỉ cho xem.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: contractNumber, employeeId, contractType, startDate, endDate, basicSalary, allowances[], status, signedDate.
- Số tiền format VND.
- Lịch sử trạng thái hiển thị theo thứ tự thời gian tăng dần.
