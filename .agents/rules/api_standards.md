# Quy Chuẩn Thiết Kế API Contract & Đa Ngôn Ngữ Code-Driven

Tài liệu này quy định **chuẩn mực bất biến bắt buộc** cho toàn bộ API trong dự án Open-ERP, áp dụng cho cả tài liệu thiết kế (`06_designs/api/`), mã nguồn Backend Quarkus Java và mã nguồn Frontend Angular/Ionic.

---

## 1. Triết Lý Code-Driven i18n
- **Cấm hardcode message văn bản địa phương trong API response**:
  Backend không bao giờ trả về thông điệp tiếng Việt tĩnh để làm nguồn hiển thị duy nhất cho người dùng.
- **Mã hóa kết quả bằng thuộc tính `code` chuẩn hóa**:
  Mọi response bắt buộc có trường `code` viết theo định dạng hằng số `UPPER_SNAKE_CASE` (ví dụ: `AUTH_LOGIN_SUCCESS`, `AUTH_EMAIL_ALREADY_EXISTS`, `ORGANIZATION_BRANCH_CREATED_SUCCESS`).
- **Nội suy tham số linh hoạt (`params`)**:
  Backend trả về các tham số động qua object `params` (ví dụ: `{"field": "email", "retry_after": 900}`).
- **Frontend làm chủ hiển thị**:
  Frontend tự tra cứu từ điển `i18n/{lang}.json` theo `code` và nội suy `params`. Thuộc tính `message` của response chỉ mang tính chất mô tả kỹ thuật / server log bằng tiếng Anh.

---

## 2. Bốn Khuôn Mẫu Phản Hồi Chuẩn Bắt Buộc (The 4 Standard Response Archetypes)

Mọi API trong toàn bộ hệ thống bắt buộc phải thuộc về đúng 1 trong 4 khuôn mẫu sau, **tuyệt đối không được sáng tác thêm bất kỳ biến thể hay cấu trúc ad-hoc nào**:

### 2.1. Khuôn Mẫu 1: Dữ Liệu Đơn Lẻ (Single Resource Response)
Áp dụng cho: Lấy chi tiết 1 bản ghi, Tạo mới 1 bản ghi, Cập nhật 1 bản ghi, Thao tác trạng thái.
```json
{
  "success": true,
  "code": "AUTH_LOGIN_SUCCESS",
  "message": "Authenticated successfully.",
  "params": {},
  "data": {
    "user_id": "b2c9a101-0000-4000-a000-000000000001",
    "status": "ACTIVE"
  }
}
```
*Quy chuẩn*:
- `success`: Bắt buộc `true` đối với HTTP 2xx.
- `code`: Mã kết quả `UPPER_SNAKE_CASE`.
- `message`: Chuỗi tiếng Anh mô tả ngắn (kỹ thuật/log).
- `params`: Object chứa tham số động (nếu không có thì trả về `{}`).
- `data`: Object cụ thể của bản ghi/kết quả. Khi thao tác không có dữ liệu trả về (ví dụ logout, đổi mật khẩu), `data: null`.

### 2.2. Khuôn Mẫu 2: Danh Sách Phân Trang (Standard Paginated List Response)
Áp dụng cho: **100% API truy vấn danh sách có phân trang** (tìm kiếm, bảng dữ liệu, lịch sử, audit log).
```json
{
  "success": true,
  "code": "PLATFORM_TENANT_LIST_SUCCESS",
  "message": "Tenant list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "tenant_id": "e5b30000-0000-4000-a000-000000000001",
        "slug": "acme-corp",
        "name": "Tập Đoàn Acme"
      }
    ],
    "page": 0,
    "size": 20,
    "total_items": 142,
    "total_pages": 8
  }
}
```
*Ràng buộc danh tính các trường phân trang*:
- **`items`**: Mảng chứa các bản ghi trang hiện tại. **Nghiêm cấm** dùng `content`, `data`, `records`, `list`.
- **`page`**: Chỉ số trang hiện tại (bắt đầu từ 0 - 0-indexed integer).
- **`size`**: Kích thước số lượng bản ghi trên một trang (integer).
- **`total_items`**: Tổng số lượng bản ghi toàn bộ (integer). **Nghiêm cấm** dùng `total_elements`, `totalCount`, `total`.
- **`total_pages`**: Tổng số trang (integer).

### 2.3. Khuôn Mẫu 3: Danh Sách Không Phân Trang (Standard Non-Paginated List Response)
Áp dụng cho: Các danh mục cấu hình hoặc danh sách nhỏ nạp toàn bộ (danh mục quyền, danh mục chi nhánh của tenant, danh sách vai trò).
```json
{
  "success": true,
  "code": "IAM_PERMISSION_LIST_SUCCESS",
  "message": "Permissions retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      {
        "code": "core:user:create",
        "domain": "core"
      }
    ]
  }
}
```
*Ràng buộc*:
- Dữ liệu danh sách luôn luôn được bọc trong object có thuộc tính **`items: [...]`**. Không trả về mảng trần `data: [...]` để giữ tính nhất quán về kiểu dữ liệu object của `data` và dễ mở rộng metadata khi cần.

### 2.4. Khuôn Mẫu 4: Phản Hồi Lỗi Chuẩn Hóa (Standard Error Response)
Áp dụng cho: **100% phản hồi lỗi (HTTP 4xx và HTTP 5xx)**.
```json
{
  "success": false,
  "code": "ORGANIZATION_REPORTING_CYCLE_DETECTED",
  "message": "A circular reporting loop was detected in the management hierarchy.",
  "params": {
    "employee_id": "user-a-uuid",
    "proposed_manager_id": "user-c-uuid"
  },
  "errors": [
    {
      "field": "direct_manager_user_id",
      "code": "VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN",
      "params": {
        "cycle_with": "user-c-uuid"
      }
    }
  ],
  "timestamp": "2026-09-18T10:30:00Z"
}
```
*Ràng buộc chi tiết lỗi*:
- `success`: Bắt buộc `false`.
- `code`: Mã lỗi tổng quát `UPPER_SNAKE_CASE`.
- `params`: Tham số nội suy tổng quát.
- `errors`: Mảng chứa các chi tiết lỗi thành phần. Mỗi phần tử bắt buộc gồm:
  - `field`: Tên trường bị lỗi (hoặc `null` nếu là lỗi nghiệp vụ chung).
  - `code`: Mã lỗi chi tiết `UPPER_SNAKE_CASE` (ví dụ: `VALIDATION_REQUIRED`, `VALIDATION_MIN_LENGTH`).
  - `params`: Tham số nội suy cho trường lỗi đó (ví dụ: `{"min": 8}`).
- **TUYỆT ĐỐI CẤM** nhét message văn bản tiếng Việt hardcode vào trong mảng `errors` hay bất kỳ đâu trong API envelope.
- `timestamp`: Chuỗi thời gian chuẩn ISO 8601 UTC.

---

## 3. Chuẩn Hóa ResponseKey Enum (Zero-Hardcode Payload Keys)
- **Bắt buộc sử dụng Enum `ResponseKey`**:
  Mọi key trong `data` map của Backend hoặc DTO payload của Frontend bắt buộc phải dùng enum `ResponseKey` (ví dụ: `ResponseKey.TENANT_ID.getKey()`, `ResponseKey.USER_ID.getKey()`).
- Tuyệt đối nghiêm cấm gõ chuỗi tự do (string literal) cho các thuộc tính payload trả về.

---

## 4. Định Kiểu Mạnh Payload Phản Hồi (Strict Response DTO Pattern)
- **Cấm trả về Map<String, Object> cho dữ liệu nghiệp vụ**: Mọi phương thức trong service backend và payload trả về của API Resource bắt buộc phải định nghĩa class Response DTO cụ thể với các thuộc tính rõ ràng.
- **Ánh xạ thuộc tính bằng Jackson `@JsonProperty`**: Sử dụng `@JsonProperty("key_name")` theo chuẩn snake_case đồng bộ với `ResponseKey` để đảm bảo API contract không bị thay đổi và tương thích tuyệt đối với Frontend.
