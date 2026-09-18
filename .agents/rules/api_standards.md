# Quy Chuẩn Thiết Kế API Contract & Đa Ngôn Ngữ Code-Driven

## 1. Triết Lý Code-Driven i18n
- **Cấm hardcode message văn bản địa phương trong API response**:
  Backend không bao giờ trả về thông điệp tiếng Việt tĩnh để làm nguồn hiển thị duy nhất cho người dùng.
- **Mã hóa kết quả bằng thuộc tính `code` chuẩn hóa**:
  Mọi response bắt buộc có trường `code` viết theo định dạng hằng số `UPPER_SNAKE_CASE` (ví dụ: `AUTH_LOGIN_SUCCESS`, `AUTH_EMAIL_ALREADY_EXISTS`).
- **Nội suy tham số linh hoạt (`params`)**:
  Backend trả về các tham số động qua object `params` (ví dụ: `{"field": "email", "retry_after": 900}`).
- **Frontend làm chủ hiển thị**:
  Frontend tự tra cứu từ điển `i18n/{lang}.json` theo `code` và nội suy `params`.

## 2. Chuẩn Khung Phản Hồi (Standard Response Envelope)
- **Thành Công (HTTP 2xx)**:
  ```json
  {
    "success": true,
    "code": "AUTH_REGISTER_SUCCESS",
    "message": "User registered successfully",
    "data": { ... }
  }
  ```
- **Thất Bại (HTTP 4xx / 5xx)**:
  ```json
  {
    "success": false,
    "code": "AUTH_EMAIL_ALREADY_EXISTS",
    "message": "Email is already taken",
    "params": { "field": "email" },
    "errors": [ ... ],
    "timestamp": "2026-09-17T15:30:00Z"
  }
  ```

## 3. Chuẩn Hóa ResponseKey Enum (Zero-Hardcode Payload Keys)
- **Bắt buộc sử dụng Enum `ResponseKey`**:
  Mọi key trong `data` map của Backend hoặc DTO payload của Frontend bắt buộc phải dùng enum `ResponseKey` (ví dụ: `ResponseKey.TENANT_ID.getKey()`, `ResponseKey.USER_ID.getKey()`).
- Tuyệt đối nghiêm cấm gõ chuỗi tự do (string literal) cho các thuộc tính payload trả về.

## 4. Định Kiểu Mạnh Payload Phản Hồi (Strict Response DTO Pattern)
- **Cấm trả về Map<String, Object> cho dữ liệu nghiệp vụ**: Mọi phương thức trong service backend và payload trả về của API Resource bắt buộc phải định nghĩa class Response DTO cụ thể với các thuộc tính rõ ràng.
- **Ánh xạ thuộc tính bằng Jackson `@JsonProperty`**: Sử dụng `@JsonProperty("key_name")` theo chuẩn snake_case đồng bộ với `ResponseKey` để đảm bảo API contract không bị thay đổi và tương thích tuyệt đối với Frontend.
