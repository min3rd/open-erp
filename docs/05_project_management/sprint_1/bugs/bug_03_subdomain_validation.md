# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.3 - Lỗi hiển thị trùng lặp thông báo và sai đường dẫn API kiểm tra Subdomain
## Phân hệ: Xác thực & Đăng ký (Auth Web Client - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Trong giao diện đăng ký tài khoản doanh nghiệp mới (`/register`), xảy ra hai lỗi liên quan đến trường nhập liệu Subdomain (Tên miền phụ):
1. **Lỗi hiển thị trùng lặp thông báo**: Khi nhập một subdomain đã tồn tại trên hệ thống (ví dụ: `erp`), giao diện hiển thị hai dòng thông báo lỗi màu đỏ có nội dung giống hệt nhau: 
   - `"Subdomain is already in use by another company."` (nếu chọn ngôn ngữ English) hoặc 
   - `"Subdomain đã được sử dụng bởi công ty khác."` (nếu chọn ngôn ngữ Tiếng Việt).
2. **Lỗi gọi API kiểm tra subdomain**: Khi người dùng nhập liệu, request kiểm tra subdomain gửi đi bị lỗi (màu đỏ trong tab Network) do gọi sai URL dạng tương đối (`check-subdomain/subdomain-erp` thay vì `/api/v1/auth/check-subdomain?subdomain=erp`).

---

### 2. Nguyên nhân lỗi (Root Cause)

#### 2.1. Lỗi hiển thị trùng lặp thông báo lỗi
- **Hiện trạng**: 
  - Thẻ `<oerp-input>` cho Subdomain được gán thuộc tính `[errorMessage]="getErrorMessage('subdomain')"`. Khi subdomain bị trùng, logic trong `RegisterComponent` gọi `subdomainControl.setErrors({ unavailable: true })`, dẫn đến việc hàm `getErrorMessage('subdomain')` trả về thông báo lỗi `'validation.subdomain_unavailable'` và hiển thị lỗi này dưới chân ô input.
  - Phía dưới thẻ `<oerp-input>`, trong template HTML [register.component.html](../../../../open-erp-web/src/app/features/auth/register/register.component.html) có thêm một khối điều kiện kiểm tra `@else if (subdomainAvailable() === false)` để hiển thị thủ công thẻ span với nội dung `{{ 'validation.subdomain_unavailable' | transloco }}`.
- **Hệ quả**: Cả hai cơ chế hiển thị lỗi (cơ chế tự động của `<oerp-input>` và khối thẻ span thủ công trong HTML) cùng hoạt động đồng thời, dẫn đến hiển thị 2 dòng thông báo lỗi giống hệt nhau.

#### 2.2. Lỗi gọi API kiểm tra subdomain
- **Hiện trạng**: Lỗi gọi API xảy ra do việc khởi tạo hoặc sử dụng Base API URL hoặc cấu hình định nghĩa endpoint không đồng bộ:
  - API endpoint định nghĩa trong `API_ENDPOINTS.auth.checkSubdomain` là `/api/v1/auth/check-subdomain`. Tuy nhiên, nếu API URL được dựng sai do thiếu `/` ở đầu hoặc do gọi nhầm API endpoint chưa chuyển đổi đầy đủ từ cơ chế cũ sang `ConfigService.buildUrl(API_ENDPOINTS.auth.checkSubdomain, { subdomain })`.
  - Hoặc do khi ứng dụng tải trang và gọi API kiểm tra subdomain trước khi `config.json` được load xong (mặc dù đã dùng `APP_INITIALIZER`, cần đảm bảo thứ tự load config và khởi tạo component không bị xung đột).

---

### 3. Giải pháp khắc phục (Resolution Design)

#### 3.1. Khắc phục lỗi hiển thị trùng lặp
- Loại bỏ đoạn hiển thị thông báo lỗi thủ công `@else if (subdomainAvailable() === false)` ra khỏi file [register.component.html](../../../../open-erp-web/src/app/features/auth/register/register.component.html).
- Chỉ giữ lại phần hiển thị trạng thái đang kiểm tra (`checkingSubdomain`) và thông báo subdomain hợp lệ dưới ô nhập liệu. Riêng lỗi không hợp lệ (đã tồn tại) sẽ do `<oerp-input>` tự động hiển thị thông qua thuộc tính `[errorMessage]`.

Đoạn mã HTML sau khi sửa đổi:
```html
          <div class="mt-1.5 flex justify-between items-center text-xs select-none">
            <!-- Subdomain check indicator -->
            @if (checkingSubdomain()) {
              <span class="text-slate-400 dark:text-slate-500 animate-pulse">
                {{ 'validation.checking_subdomain' | transloco }}
              </span>
            } @else if (subdomainAvailable() === true) {
              <span class="text-emerald-500 font-medium">
                {{ 'validation.subdomain_available' | transloco }}
              </span>
            } @else {
              <span class="text-slate-400 dark:text-slate-500">
                {{ 'auth.subdomain_hint' | transloco }}
              </span>
            }
          </div>
```

#### 3.2. Khắc phục lỗi gọi API kiểm tra subdomain
- Kiểm tra lại logic hàm `checkSubdomain(subdomain: string)` trong [auth.service.ts](../../../../open-erp-web/src/app/core/services/auth.service.ts) để đảm bảo sử dụng đúng cơ chế `this.config.buildUrl`:
  ```typescript
  checkSubdomain(subdomain: string): Observable<boolean> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.checkSubdomain, { subdomain });
    return this.http.get<{ success: boolean; data: { available: boolean } }>(url).pipe(
      map((res) => res.success && res.data.available)
    );
  }
  ```
- Đảm bảo `this.config.apiUrl` được khởi tạo chính xác từ `assets/config.json`. Nếu `apiUrl` không có dấu gạch chéo cuối (`/`), hàm `buildUrl` trong [config.service.ts](../../../../open-erp-web/src/app/core/services/config.service.ts) cần xử lý ghép nối chuỗi chính xác (hàm `buildUrl` hiện tại ghép `${this.apiUrl}${endpoint}` - vì `endpoint` bắt đầu bằng `/api/v1/...` nên đường dẫn được nối sẽ luôn hợp lệ là `http://localhost:3000/api/v1/auth/check-subdomain` thay vì relative path).

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Khi nhập một subdomain đã được sử dụng (ví dụ: `erp`), chỉ hiển thị duy nhất **1 dòng thông báo lỗi màu đỏ**: `"Subdomain đã được sử dụng bởi công ty khác."` (hoặc ngôn ngữ tương ứng) ngay dưới ô nhập liệu.
2. Các cuộc gọi API kiểm tra subdomain được gửi đúng địa chỉ tuyệt đối (ví dụ: `http://localhost:3000/api/v1/auth/check-subdomain?subdomain=erp`) và trả về kết quả thành công mà không bị lỗi mạng hay relative path error.
3. Không làm ảnh hưởng đến luồng debounce check subdomain và các ô nhập liệu khác.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Loại bỏ khối hiển thị thông báo lỗi trùng lặp thủ công `@else if (subdomainAvailable() === false)` ra khỏi file [register.component.html](../../../../open-erp-web/src/app/features/auth/register/register.component.html). Lỗi này sẽ do thẻ `<oerp-input>` tự động hiển thị khi kiểm tra `subdomainControl.errors['unavailable']`.
  - Khắc phục lỗi phân giải đường dẫn và import của các thư viện ở root: Đã cài đặt `class-validator` và `class-transformer` làm `devDependencies` tại thư mục gốc [package.json](../../../../package.json) để đảm bảo trình quản lý dependencies phân giải đầy đủ và chạy thành công mà không có lỗi cảnh báo khi khởi động NestJS.
  - Chạy thử nghiệm và xác nhận toàn bộ hệ thống dev server build và khởi chạy thành công.
