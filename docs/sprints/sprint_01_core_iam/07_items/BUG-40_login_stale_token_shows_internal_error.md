# [BUG-40] Login Với Token Cũ Trả 401 Body Rỗng Và FE Hiển Thị "Internal Server Error"

- **Mã Lỗi**: BUG-40
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: Khách hàng
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Khi trình duyệt còn access token cũ/không hợp lệ trong localStorage (tài khoản đã bị xóa hoặc token hết hạn), FE đính kèm `Authorization: Bearer <token cũ>` vào cả request `POST /api/v1/auth/login`. Tầng HTTP Security của Quarkus xác thực proactive thất bại và trả **401 với body rỗng** trước khi request tới endpoint đăng nhập. FE nhận 401 không có `code` nên fallback thành `INTERNAL_SERVER_ERROR` → hiển thị "Internal Server Error" thay vì "Email hoặc mật khẩu không chính xác".

- **Môi trường**: Local (Web)
- **Tính Năng Bị Ảnh Hưởng**: Đăng nhập (FEAT-03) và toàn bộ thông báo lỗi API ở FE.
- **File Liên Quan**:
  - `src/backend/src/main/resources/application.properties` (proactive auth mặc định `true`).
  - `src/frontend/web/src/app/core/interceptors/auth.interceptor.ts` (gắn token vào mọi request).
  - `src/frontend/web/src/app/core/services/api.service.ts` (fallback `INTERNAL_SERVER_ERROR`).
- **Bằng Chứng**:
```
# Không token
HTTP/1.1 401 Unauthorized
{"success":false,"code":"AUTH_INVALID_CREDENTIALS",...}

# Kèm Authorization token cũ/không hợp lệ
HTTP/1.1 401 Unauthorized
www-authenticate: Bearer
content-length: 0        <-- body rỗng, FE fallback INTERNAL_SERVER_ERROR
```

## 2. Các Bước Tái Hiện
1. Đăng nhập một tài khoản, sau đó xóa tài khoản khỏi DB (hoặc để token hết hạn) nhưng giữ localStorage.
2. Mở `/login`, nhập sai/đúng thông tin và bấm Đăng nhập.
3. Quan sát thông báo lỗi hiển thị "Internal Server Error"/"Lỗi hệ thống".

## 3. Kết Quả Thực Tế
- Request login bị chặn ở tầng security với body rỗng; UI hiển thị sai mã lỗi.

## 4. Kết Quả Kỳ Vọng
- `quarkus.http.auth.proactive=false` để endpoint public không xác thực token cũ; endpoint bảo vệ vẫn enforce qua `@Authenticated`.
- FE không gửi Authorization/X-Session-Id tới các endpoint public (`login/register/verify-email/forgot/reset/refresh/resend/2fa-verify/select-tenant`).
- FE map lỗi theo HTTP status khi body rỗng (401 → `UNAUTHORIZED`, 403 → `FORBIDDEN`, 0 → `NETWORK_ERROR`...), không dùng `INTERNAL_SERVER_ERROR` cho 4xx.
- Login với tài khoản bị xóa hiển thị đúng "Email hoặc mật khẩu không chính xác".

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
www-authenticate: Bearer
content-length: 0
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (BE `quarkus.http.auth.proactive=false`; FE interceptor skip token cho public endpoints + `ApiService` map lỗi theo HTTP status, bổ sung i18n `NETWORK_ERROR/NOT_FOUND/CONFLICT/TOO_MANY_REQUESTS`).
- [x] QA đã re-test: `curl` login kèm token cũ trả đúng `AUTH_INVALID_CREDENTIALS`; puppeteer 3/3 PASS — sai mật khẩu hiển thị "Email hoặc mật khẩu không chính xác.", không còn "Internal Server Error"; đăng nhập đúng với token cũ sót lại vẫn vào `/dashboard`; `mvn test` 22/22 PASS.
- [x] Không gây lỗi phát sinh (Regression test pass; Web build production PASS).
- **Ghi chú QA (2026-09-18)**: 401 body rỗng của tầng security (BUG-34) vẫn còn nhưng FE đã map đúng `UNAUTHORIZED`; BUG-34 tiếp tục deferred Sprint 02.
