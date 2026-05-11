# SCR-HR-010 — Employee Profile Detail/Edit

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                               |
| --------------- | --------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-010                                                            |
| Route           | /hr/employees/:id                                                     |
| Luồng liên quan | FLOW-HR-S03-EMP-001                                                   |
| Mục tiêu        | Hiển thị và chỉnh sửa hồ sơ nhân viên với phân quyền dữ liệu chi tiết |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: header profile (mã NV, tên, trạng thái, action lưu).
- Vùng B: tabs Thông tin cá nhân, Công việc, Liên hệ, Tài liệu.
- Vùng C: panel cảnh báo validation và nhật ký thay đổi gần nhất.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính | Khoảng cách chính |
| ---------- | ------ | ----------------------- | ----------------- |
| >=1280px   | 12 cột | B:8 cột, C:4 cột sticky | Gap 20px          |
| <1280px    | 4 cột  | C xuống dưới tabs       | Padding 16px      |

## 3. Đặc tả component

| Component              | Vị trí | Variant/State               | Dữ liệu đầu vào                     | Ràng buộc hiển thị            |
| ---------------------- | ------ | --------------------------- | ----------------------------------- | ----------------------------- |
| employee-profile-form  | Vùng B | readonly, editable, invalid | employeeDetail                      | Mỗi tab validate riêng        |
| sensitive-field-mask   | Vùng B | masked, revealed            | nationalId, bankAccount             | Chỉ hiện reveal khi đủ quyền  |
| org-assignment-section | Vùng B | editable, disabled          | departmentId, positionId, managerId | Position phụ thuộc department |
| change-log-mini        | Vùng C | list, empty                 | recentChanges[]                     | Chỉ đọc                       |
| save-profile-button    | Vùng A | enabled, loading, disabled  | dirty + valid                       | Disable khi không thay đổi    |

## 4. Hành động và phản hồi UI

| Trigger                       | Xử lý                                  | Phản hồi UI                           |
| ----------------------------- | -------------------------------------- | ------------------------------------- |
| Sửa thông tin profile         | Validate cục bộ + server               | Lỗi hiển thị theo từng trường         |
| Nhấn Lưu                      | Gọi API cập nhật hồ sơ                 | Toast thành công + cập nhật timestamp |
| Trùng employeeCode/nationalId | API trả 409                            | Focus vào trường lỗi, hiển thị reason |
| Đổi department                | Reload positions và manager candidates | Reset giá trị không còn hợp lệ        |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Tab chuyển nội dung bằng cross-fade 120ms.
- Trường lỗi có rung nhẹ 120ms.
- Save success hiển thị trạng thái Saved trong 2 giây.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: chỉnh sửa profile và lưu thành công.
- Validation error: nationalId sai định dạng, tuổi < 16, trùng employeeCode.
- Locked: hồ sơ đang chỉnh sửa ở phiên khác.
- Permission: role employee chỉ xem hoặc sửa trường được cấp quyền.
- No-data: chưa có ảnh/avatar hoặc tài liệu.
- Offline: cho phép lưu nháp cục bộ, chưa submit server.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: fullName, dateOfBirth, gender, nationalId, email, phone, address, employeeCode, departmentId, positionId, managerId, startDate.
- NationalId mặc định mask dạng **\*\*\*\***1234.
- Số điện thoại format theo chuẩn VN.
