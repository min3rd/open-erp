# Tài liệu hướng dẫn tái cấu trúc: REF-1.2 - Chuẩn hóa sử dụng Transloco Pipe trong Template
## Phân hệ: Web Client (`open-erp-web`) - Sprint 1

---

### 1. Mục tiêu (Goal)
Nhằm đơn giản hóa cú pháp, nâng cao hiệu năng Change Detection của Angular và đảm bảo hỗ trợ kiểm tra kiểu dữ liệu nghiêm ngặt (Strict Template Type Checking), dự án thống nhất chuyển đổi cách thức biên dịch đa ngôn ngữ trên giao diện:
* **Quy chuẩn mới**: Sử dụng Transloco Pipe `{{ 'key' | transloco }}` trực tiếp cho từng nhãn/chuỗi hiển thị.
* **Hạn chế**: Không sử dụng cấu trúc directive `*transloco="let t"` để bao bọc các khối HTML lớn như hiện tại.

---

### 2. Lý do kỹ thuật (Rationale)

* **Tối ưu hóa Change Detection**: Transloco Pipe được thiết kế dưới dạng **Pure Pipe** trong Angular. Nó chỉ thực hiện biên dịch lại khi ngôn ngữ hệ thống thay đổi hoặc tham số đầu vào thay đổi. Ngược lại, directive `*transloco` tạo ra một template scope mới và kích hoạt change detection thường xuyên hơn trên toàn bộ thẻ con.
* **Cú pháp phẳng (Flat HTML Syntax)**: Loại bỏ các thẻ div hoặc container bọc ngoài chỉ để khai báo `*transloco="let t"`. Giao diện HTML sẽ gọn gàng, phẳng và dễ đọc hơn.
* **Strict Template Type Checking**: Sử dụng pipe giúp Angular Compiler dễ dàng kiểm tra kiểu và phát hiện lỗi biên dịch thiếu key dịch hơn so với việc truy xuất qua biến động `t('key')`.

---

### 3. Hướng dẫn chuyển đổi (Migration Guide)

#### 3.1 Nhãn tĩnh đơn giản:
* **Trước**:
  ```html
  <div *transloco="let t">
    <h2>{{ t('auth.register_title') }}</h2>
  </div>
  ```
* **Sau**:
  * Import `TranslocoPipe` hoặc `TranslocoModule` vào component.
  ```html
  <div>
    <h2>{{ 'auth.register_title' | transloco }}</h2>
  </div>
  ```

#### 3.2 Nhãn động có tham số (Parameters):
* **Trước**:
  ```html
  <span *transloco="let t">{{ t('auth.welcome_message', { name: userName }) }}</span>
  ```
* **Sau**:
  ```html
  <span>{{ 'auth.welcome_message' | transloco: { name: userName } }}</span>
  ```

#### 3.3 Sử dụng làm thuộc tính đầu vào (Input Property Binding):
* **Trước**:
  ```html
  <div *transloco="let t">
    <oerp-input [label]="t('auth.company_name')"></oerp-input>
  </div>
  ```
* **Sau**:
  ```html
  <oerp-input [label]="'auth.company_name' | transloco"></oerp-input>
  ```

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. **Rà soát mã nguồn**: Không còn xuất hiện cú pháp `*transloco="let t"` trong bất kỳ file `.html` nào của Web Client.
2. **Tính đúng đắn**: Màn hình đăng ký (`/register`) và các màn hình khác hiển thị chính xác các nhãn đa ngôn ngữ ở cả 4 ngôn ngữ (vi, en, zh, ja).
3. **Biên dịch**: Dự án build thành công mà không gặp bất kỳ lỗi biên dịch nào liên quan đến Transloco.

---

### 5. Kết quả thực hiện (Implementation Status)
- **Trạng thái**: [x] Đã hoàn thành (Completed)
- **Kết quả**:
  - Đã loại bỏ hoàn toàn directive `*transloco="let t"` tại tệp tin [register.component.html](../../../../open-erp-web/src/app/features/auth/register/register.component.html).
  - Cập nhật toàn bộ các nhãn trong template sang dùng toán tử pipe `| transloco` (ví dụ: `{{ 'auth.register_title' | transloco }}`).
  - Kiểm thử build thành công ứng dụng Web Client mà không phát sinh lỗi biên dịch, các nhãn hiển thị đa ngôn ngữ hoạt động chính xác.

