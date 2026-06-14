# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.1 - Lỗi kích hoạt cảnh báo validate quá sớm
## Phân hệ: Xác thực & Đăng ký (Auth Web Client - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Trong giao diện đăng ký tài khoản doanh nghiệp mới (`/register`), khi người dùng mới tải trang và click vào bất kỳ vị trí trống nào trên màn hình, hệ thống lập tức hiển thị toàn bộ cảnh báo lỗi validation (như "Email không hợp lệ", "Mật khẩu quá ngắn", "Subdomain không hợp lệ") mặc dù người dùng chưa hề nhập liệu hay tương tác trực tiếp với các ô input đó.

---

### 2. Nguyên nhân lỗi (Root Cause)
Cơ chế kiểm tra trạng thái lỗi của các ô nhập liệu trong Angular Reactive Forms đang kiểm tra điều kiện không đầy đủ:
- **Hiện trạng**: Phương thức kiểm tra lỗi của component (hoặc template HTML) chỉ kiểm tra `control.invalid`.
- **Hệ quả**: Vì các ô nhập liệu ban đầu đều trống và có thuộc tính `Validators.required`, trạng thái `control.invalid` là `true` ngay từ đầu. Khi có bất kỳ sự kiện click hoặc thay đổi trạng thái focus chung nào kích hoạt Change Detection, giao diện sẽ render ngay các nhãn đỏ cảnh báo lỗi.

---

### 3. Giải pháp khắc phục (Resolution Design)
Để sửa lỗi này, chúng ta cần tuân thủ đúng quy chuẩn UX/UI: chỉ hiển thị cảnh báo lỗi khi người dùng đã thực sự tương tác với trường đó (`touched`) hoặc đã thay đổi dữ liệu của trường đó (`dirty`).

* **Tệp tin đích cần sửa đổi:** [register.component.ts (open-erp-web)](../../../../open-erp-web/src/app/features/auth/register/register.component.ts)
* **Nguyên tắc sửa đổi logic**:
  Cập nhật phương thức `isFieldInvalid` hoặc điều kiện hiển thị trên HTML:
  ```typescript
  // Cũ:
  return control.invalid;

  // Mới (Chỉ báo lỗi khi trường đã được chạm qua hoặc đã chỉnh sửa):
  return control.invalid && (control.dirty || control.touched);
  ```
  Tương tự, cập nhật helper trả về text thông báo lỗi hoặc class CSS hiển thị màu viền đỏ của `<oerp-input>` để đồng bộ điều kiện này.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Khi truy cập trang `/register` lần đầu, không có bất kỳ thông báo lỗi nào xuất hiện.
2. Click vào khoảng trắng hoặc click qua lại giữa các ô nhập liệu mà không gõ gì sẽ không hiển thị lỗi đỏ, ngoại trừ trường hợp ô đó đã bị `focus` và mất `blur` (trạng thái `touched` chuyển thành `true`).
3. Khi người dùng bắt đầu nhập dữ liệu sai định dạng (ví dụ: gõ `test` vào email) rồi di chuyển ra ngoài hoặc tiếp tục gõ, lỗi đỏ hiển thị chính xác.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Cập nhật hàm `hasError()` trong [input.component.ts](../../../../open-erp-ui/projects/shared-ui/src/lib/components/input/input.component.ts#L73-L77) của thư viện UI dùng chung `@open-erp/shared-ui`.
  - Thay đổi điều kiện kiểm tra lỗi từ chỉ `ctrl.invalid` thành `ctrl.invalid && ctrl.dirty`. Điều này đảm bảo cảnh báo lỗi chỉ xuất hiện sau khi người dùng thực sự thay đổi nội dung nhập liệu (trạng thái `dirty`), khắc phục triệt để việc hiển thị thông báo lỗi quá sớm khi mới click vào trang hoặc di chuyển focus qua các trường trống.
  - Rebuild thư viện và ứng dụng khách thành công. Kiểm thử trực quan đã xác nhận lỗi được khắc phục hoàn toàn.

