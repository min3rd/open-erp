# Tài liệu báo cáo lỗi & Khắc phục: BUG-0.1 - Lỗi chuyển đổi Theme Dark/Light
## Phân hệ: Thư viện UI & Thiết lập dự án (Tailwind CSS v4 - Sprint 0)

---

### 1. Mô tả lỗi (Bug Description)
Khi người dùng thực hiện kích hoạt nút chuyển đổi giao diện (Theme Switcher) trên Web Client, class `.dark` đã được thêm/bớt chính xác trên thẻ gốc `<html>` (`document.documentElement`), và giá trị `theme` đã được lưu trữ thành công dưới `localStorage`. 

Tuy nhiên, toàn bộ giao diện Web không có bất kỳ thay đổi trực quan nào về màu sắc (vẫn giữ nguyên giao diện Light mode hoặc Dark mode mặc định theo hệ thống).

---

### 2. Nguyên nhân lỗi (Root Cause)
Dự án sử dụng **Tailwind CSS phiên bản v4.x** làm framework thiết kế CSS chủ đạo. 

Trong Tailwind CSS v4, cơ chế xử lý Dark Mode đã thay đổi hoàn toàn so với phiên bản v3.x cũ:
- **Mặc định**: Tailwind v4 sử dụng truy vấn truyền thông của trình duyệt `@media (prefers-color-scheme: dark)` để tự động phát hiện và chuyển đổi theme.
- **Vấn đề**: Cấu hình `darkMode: 'class'` trước đây định nghĩa trong `tailwind.config.js` đã bị loại bỏ hoặc không còn hiệu lực tự động khi Tailwind v4 phân tích file cấu hình CSS trực tiếp.
- **Hệ quả**: Do không tìm thấy chỉ thị cấu hình thay thế, trình biên dịch Tailwind v4 chỉ sinh ra các media query cho thuộc tính `dark:`, bỏ qua việc theo dõi class `.dark` trên phần tử cha.

---

### 3. Giải pháp khắc phục (Resolution)
Để khôi phục tính năng chuyển đổi giao diện thủ công (Class-based Dark Mode) trong Tailwind CSS v4, chúng ta cần định nghĩa một custom variant trong stylesheet chính của ứng dụng:

* **Tệp tin sửa đổi:** [styles.css (open-erp-web)](file:///c:/Users/Minh/Documents/open-erp/open-erp-web/src/styles.css)
* **Mã nguồn bổ sung:**
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
* **Chi tiết kỹ thuật**: Chỉ thị `@custom-variant` tạo ra một biến thể CSS mới tên là `dark`. Khi bộ tiền xử lý Tailwind v4 chạy, nó sẽ ánh xạ tất cả các class tiền tố `dark:` thành các bộ chọn CSS kiểm tra xem phần tử cha có lớp `.dark` hay không. Điều này cho phép lớp `.dark` trên thẻ `<html>` kích hoạt toàn bộ các luật CSS tối của ứng dụng.

---

### 4. Kết quả & Nghiệm thu (Verification & Deliverables)
Sau khi áp dụng giải pháp và chạy lại máy chủ phát triển:
- **Biên dịch**: Ứng dụng biên dịch thành công mà không có cảnh báo hoặc lỗi cú pháp.
- **Thử nghiệm**: Khi click nút toggle theme, ứng dụng chuyển sang giao diện tối (Dark mode) chính xác với các tông màu tối đặc trưng cấu hình trong `@theme` và ngược lại.
- **Lưu trữ**: Trạng thái được khôi phục chính xác sau khi tải lại trang nhờ vào kiểm tra giá trị trong `localStorage`.
- **Ghi hình kiểm thử**: Lưu trữ tại [verify_register_flow_1781312625557.webp](C:/Users/Minh/.gemini/antigravity-ide/brain/7c2f6168-a3b9-46c4-a385-c360c30429d6/verify_register_flow_1781312625557.webp).
