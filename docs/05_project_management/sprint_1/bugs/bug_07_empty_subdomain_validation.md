# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.7 - Lỗi validation subdomain khi để trống trường nhập liệu
## Phân hệ: Xác thực & Đăng ký (Backend API Service - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Khi gửi yêu cầu đăng ký tài khoản doanh nghiệp mới (`/register`), nếu trường subdomain trên giao diện frontend để trống và gửi dữ liệu lên backend dưới dạng chuỗi rỗng (`subdomain: ""`), hệ thống trả về lỗi validation:
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_FAILED",
        "messageKey": "errors.validation_failed",
        "details": [
            {
                "field": "subdomain",
                "messageKey": "validation.subdomain_invalid"
            }
        ]
    }
}
```
Mặc dù trường này được thiết kế là tùy chọn (Optional), khi để trống hệ thống sẽ tự sinh subdomain dựa trên tên doanh nghiệp.

---

### 2. Nguyên nhân lỗi (Root Cause)
- **Hiện trạng**: Trong [register.dto.ts](../../../../open-erp-services/src/features/auth/dto/register.dto.ts), trường `subdomain` được trang bị decorator `@IsOptional()` và `@Matches(/^[a-z0-9]+$/)`:
  ```typescript
  @IsOptional()
  @Matches(/^[a-z0-9]+$/, { message: 'validation.subdomain_invalid' })
  subdomain?: string;
  ```
- **Cơ chế hoạt động**: Decorator `@IsOptional()` của thư viện `class-validator` chỉ bỏ qua các giá trị `undefined` hoặc `null`. Nếu giá trị truyền lên là chuỗi rỗng `""`, `class-validator` vẫn coi đây là một giá trị cần kiểm tra, kích hoạt `@Matches` và báo lỗi định dạng do chuỗi rỗng không khớp biểu thức chính quy `/^[a-z0-9]+$/`.

---

### 3. Giải pháp khắc phục (Resolution Design)
Sử dụng thêm decorator `@ValidateIf` để điều kiện hóa việc thực thi validator `@Matches`.

* **Tệp tin đích cần sửa đổi:** [register.dto.ts (open-erp-services)](../../../../open-erp-services/src/features/auth/dto/register.dto.ts)
* **Nguyên tắc sửa đổi logic**:
  Bổ sung `@ValidateIf((o) => o.subdomain !== '')` để chỉ chạy validator `@Matches` khi giá trị `subdomain` khác chuỗi rỗng:
  ```typescript
  import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

  // Trong class RegisterDto:
  @IsOptional()
  @ValidateIf((o) => o.subdomain !== '')
  @Matches(/^[a-z0-9]+$/, { message: 'validation.subdomain_invalid' })
  subdomain?: string;
  ```

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Khi gửi yêu cầu đăng ký với `subdomain: ""` hoặc `subdomain: null` hoặc không truyền `subdomain`, API không báo lỗi validation trên trường `subdomain` và tự động sinh subdomain thành công.
2. Khi gửi subdomain không hợp lệ (ví dụ: `Sub-Domain!` hoặc `test domain`), hệ thống vẫn báo lỗi `validation.subdomain_invalid` chính xác.
3. Bộ kiểm thử unit test và build dự án chạy thành công.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Cập nhật [register.dto.ts](../../../../open-erp-services/src/features/auth/dto/register.dto.ts), thêm decorator `@ValidateIf` cho trường `subdomain`.
  - Viết và chạy unit test để đảm bảo validation hoạt động chính xác trong cả 3 trường hợp: có subdomain hợp lệ, subdomain trống, subdomain không hợp lệ.
