# [MÃ_TÍNH_NĂNG] Danh Sách Kịch Bản Kiểm Thử (Test Cases)

- **Tính năng**: [Tên tính năng]
- **Phụ trách**: QA/QC Agent

---

## Bảng Ma Trận Kịch Bản Kiểm Thử

| ID | Module / Chức Năng | Mô Tả Kịch Bản (Scenario) | Điều Kiện Đầu Vào (Pre-conditions) | Các Bước Thực Hiện (Test Steps) | Kết Quả Mong Đợi (Expected Result) | Mức Độ (Priority) | Trạng Thái (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Tạo mới | Tạo bản ghi thành công với dữ liệu hợp lệ | Người dùng có quyền manager | 1. Nhập đủ trường bắt buộc<br>2. Bấm Lưu | Bản ghi được tạo, hiển thị thông báo thành công | Critical | Pass |
| **TC-02** | Tạo mới | Báo lỗi khi để trống trường bắt buộc | Người dùng ở form tạo mới | 1. Để trống tên<br>2. Bấm Lưu | Hiển thị lỗi validation màu đỏ, không gửi request | Major | Pass |
| **TC-03** | Tạo mới | Báo lỗi khi trùng mã định danh (code) | Đã tồn tại mã `RES-001` | 1. Nhập mã `RES-001`<br>2. Bấm Lưu | Báo lỗi 409 Conflict: Mã đã tồn tại | High | Pass |
| **TC-04** | Phân quyền | Chặn người dùng không có quyền truy cập | Người dùng vai trò guest/viewer | 1. Truy cập URL tạo mới | Chuyển hướng 403 Forbidden | Critical | Pass |
