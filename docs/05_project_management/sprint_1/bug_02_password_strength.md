# Tài liệu thiết kế & Mô tả công việc: BUG-1.2 - Thiếu hiển thị mức độ an toàn mật khẩu
## Phân hệ: Xác thực & Đăng ký (Auth Web Client - Sprint 1)

---

### 1. Mô tả yêu cầu (Requirement / Issue Description)
Trong form đăng ký doanh nghiệp mới (`/register`), khi người dùng điền mật khẩu, giao diện hiện tại chỉ hiển thị một ô nhập liệu password thông thường và báo lỗi validation nếu mật khẩu dưới 6 ký tự. 

Hệ thống thiếu một thành phần chỉ báo trực quan giúp đo lường và hiển thị **mức độ an toàn/độ mạnh của mật khẩu** (Password Strength Meter) theo thời gian thực để hướng dẫn người dùng đặt mật khẩu an toàn hơn.

---

### 2. Nguyên tắc đánh giá độ mạnh mật khẩu (Strength Rules)
Mức độ an toàn mật khẩu sẽ được chia làm 3 cấp độ chính dựa trên các điều kiện sau:

1. **Yếu (Weak - Đỏ)**:
   - Chiều dài mật khẩu nhỏ hơn 8 ký tự.
   - Hoặc mật khẩu chỉ chứa một loại ký tự (chỉ chữ hoặc chỉ số).
2. **Trung bình (Medium - Vàng/Cam)**:
   - Chiều dài mật khẩu từ 8 ký tự trở lên.
   - Chứa kết hợp ít nhất hai nhóm: chữ thường, chữ hoa, chữ số.
3. **Mạnh (Strong - Xanh lá)**:
   - Chiều dài mật khẩu từ 8 ký tự trở lên.
   - Chứa kết hợp đầy đủ bốn nhóm: chữ thường, chữ hoa, chữ số, và ký tự đặc biệt (ví dụ: `!@#$%^&*`).

---

### 3. Giải pháp thiết kế UI/UX & Tích hợp (UI/UX Design & Integration)

* **Vị trí hiển thị**: Bên dưới trường nhập liệu Password của [RegisterComponent](../../../open-erp-web/src/app/features/auth/register/register.component.ts) và phía trên thông báo validation thông thường.
* **Thành phần giao diện**:
  - Gồm 1 thanh trạng thái chia thành 3 đoạn màu (hoặc 1 thanh màu biến đổi độ rộng: 33%, 66%, 100%).
  - Một dòng text đi kèm để mô tả cấp độ bằng ngôn ngữ tương ứng (`auth.password_weak`, `auth.password_medium`, `auth.password_strong`) lấy từ Transloco.
* **Thay đổi kỹ thuật**:
  - Sử dụng một Signal trong component để tính toán độ mạnh mật khẩu bất cứ khi nào giá trị ô password thay đổi.
  - Sử dụng `@if` control flow để hiển thị chỉ báo khi ô password đã có dữ liệu nhập vào.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Khi ô mật khẩu trống, không hiển thị thanh đo độ mạnh mật khẩu.
2. Khi người dùng nhập ký tự đầu tiên, thanh đo hiển thị mức độ **Yếu** kèm thanh màu đỏ và văn bản tiếng tương ứng (ví dụ tiếng Việt là "Yếu", tiếng Anh là "Weak").
3. Khi mật khẩu đạt đủ điều kiện trung bình, thanh đo chuyển sang màu vàng/cam và hiển thị mức độ **Trung bình**.
4. Khi mật khẩu đạt đủ tiêu chuẩn mạnh, thanh đo chuyển sang màu xanh lá và hiển thị mức độ **Mạnh**.
5. Giao diện thanh đo hiển thị responsive và đồng bộ hoàn hảo với cả hai chế độ **Light/Dark Mode**.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Tích hợp Signal `passwordValue` và computed Signal `passwordStrength` vào [register.component.ts](../../../open-erp-web/src/app/features/auth/register/register.component.ts#L220-L245) để đánh giá độ mạnh của mật khẩu theo thời gian thực (được kích hoạt bởi `valueChanges` của password control thông qua `takeUntilDestroyed`).
  - Thiết kế thanh đo (gauge) trực quan bằng Tailwind CSS gồm 3 đoạn màu hiển thị mức độ yếu (đỏ), trung bình (amber/cam), và mạnh (emerald/xanh lá).
  - Sử dụng Transloco dynamic translation để hiển thị nhãn của thanh đo tương ứng với 4 ngôn ngữ được hệ thống hỗ trợ: Tiếng Việt, Tiếng Anh, Tiếng Trung, Tiếng Nhật (cấu hình trong các tệp tin `vi.json`, `en.json`, `zh.json`, `ja.json`).
  - Kiểm thử trực quan đã xác nhận hoạt động mượt mà, phản hồi lập tức khi gõ mật khẩu và đồng bộ giao diện Dark/Light mode chuẩn chỉ.

