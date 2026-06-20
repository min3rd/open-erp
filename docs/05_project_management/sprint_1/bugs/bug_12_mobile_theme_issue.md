# Tài liệu báo cáo lỗi: BUG-1.12 - Giao diện Mobile hiển thị màu sắc lẫn lộn giữa Light và Dark Mode
## Phân hệ: Giao diện di động (FE Mobile - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)

Trên ứng dụng di động (`open-erp-mobile`), giao diện hiển thị không đồng nhất về màu sắc khi bật/tắt chế độ Dark Mode:
* Các thành phần của Ionic (Toolbar, Input, Buttons, Lists) vẫn tự động áp dụng chế độ tối/sáng theo thiết lập của hệ điều hành (OS), mặc dù người dùng đã bấm nút chuyển chế độ thủ công trên thanh Toolbar.
* Hệ quả: Giao diện bị lẫn lộn giữa nền tối/chữ tối hoặc nền sáng/chữ sáng, gây mất thẩm mỹ và khó sử dụng.

---

### 2. Nguyên nhân lỗi (Root Cause)

* Trong tệp cấu hình phong cách toàn cục [global.scss](../../../../open-erp-mobile/src/global.scss), tệp CSS màu tối của Ionic được import dựa trên thiết lập hệ thống:
  `@import '@ionic/angular/css/palettes/dark.system.css';`
  Khi sử dụng `dark.system.css`, Ionic sẽ tự động áp dụng bảng màu tối dựa trên truy vấn `@media (prefers-color-scheme: dark)` của trình duyệt/hệ điều hành, bất kể các lớp CSS của ứng dụng.
* Trong khi đó, các trang của ứng dụng di động chỉ thêm/bớt lớp `.dark` trên thẻ `html`:
  `document.documentElement.classList.add('dark');`
  Điều này khiến Tailwind CSS áp dụng chế độ tối (vì được cấu hình nhận diện theo lớp `.dark`), nhưng các component của Ionic thì vẫn hoạt động theo cấu hình hệ thống.
* Ngoài ra, để Ionic nhận diện lớp CSS tối thủ công, nó cần tệp cấu hình `dark.class.css` và lớp `.ion-palette-dark` được thêm vào phần tử gốc.

---

### 3. Giải pháp khắc phục (Resolution Design)

1. Đổi dòng import trong [global.scss](../../../../open-erp-mobile/src/global.scss) từ `dark.system.css` sang `dark.class.css`.
2. Cập nhật cơ chế toggle Dark Mode trong các trang di động:
   * [login.page.ts](../../../../open-erp-mobile/src/app/auth/login/login.page.ts)
   * [register.page.ts](../../../../open-erp-mobile/src/app/auth/register/register.page.ts)
   * [register-user.page.ts](../../../../open-erp-mobile/src/app/auth/register-user/register-user.page.ts)
   Đảm bảo khi bật Dark Mode sẽ thêm cả hai lớp `dark` và `ion-palette-dark`, và khi tắt sẽ xóa cả hai.
3. Bổ sung hàm load theme trên init trong [app.component.ts](../../../../open-erp-mobile/src/app/app.component.ts) để áp dụng lớp theme chính xác ngay khi khởi động ứng dụng dựa trên cấu hình lưu trong `localStorage`.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. Khi bật/tắt chế độ Dark Mode thủ công trên Mobile, toàn bộ giao diện (bao gồm các component của Ionic và Tailwind CSS) đồng loạt thay đổi màu sắc tương ứng.
2. Không còn hiện tượng chữ tối trên nền tối hoặc chữ sáng trên nền sáng.
3. Khi tải lại trang hoặc khởi động lại ứng dụng, giao diện hiển thị đúng chế độ màu đã lưu gần nhất trong `localStorage`.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)

- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Ưu tiên**: 🟡 **Trung bình**
- **Thay đổi thực hiện:**

| File | Thay đổi |
|------|----------|
| [`open-erp-mobile/src/global.scss`](../../../../open-erp-mobile/src/global.scss) | Đổi `@import '@ionic/angular/css/palettes/dark.system.css';` thành `@import '@ionic/angular/css/palettes/dark.class.css';`. |
| [`open-erp-mobile/.../app.component.ts`](../../../../open-erp-mobile/src/app/app.component.ts) | Thêm `ngOnInit` để thiết lập lớp `dark` và `ion-palette-dark` dựa trên cấu hình lưu trong `localStorage` khi khởi chạy app. |
| [`open-erp-mobile/.../login.page.ts`](../../../../open-erp-mobile/src/app/auth/login/login.page.ts) | Đồng bộ cả hai lớp `dark` và `ion-palette-dark` khi init và khi bấm nút chuyển chế độ tối. |
| [`open-erp-mobile/.../register.page.ts`](../../../../open-erp-mobile/src/app/auth/register/register.page.ts) | Tương tự, đồng bộ cả hai lớp khi init và khi toggle. |
| [`open-erp-mobile/.../register-user.page.ts`](../../../../open-erp-mobile/src/app/auth/register-user/register-user.page.ts) | Tương tự, đồng bộ cả hai lớp khi init và khi toggle. |
