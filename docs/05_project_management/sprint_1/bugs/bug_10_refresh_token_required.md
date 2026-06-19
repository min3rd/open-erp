# Tài liệu báo cáo lỗi: BUG-1.10 - Lỗi REFRESH_TOKEN_REQUIRED khi gọi API /auth/refresh
## Phân hệ: Xác thực & Quản lý phiên (Auth - Session Management - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)

Khi gọi API refresh token để gia hạn phiên đăng nhập, endpoint trả về lỗi thiếu refresh token mặc dù login thành công trước đó:

**Endpoint:** `POST http://localhost:3000/api/v1/auth/refresh`

**Response lỗi:**
```json
{
    "success": false,
    "error": {
        "code": "REFRESH_TOKEN_REQUIRED",
        "messageKey": "auth.refresh_token_required"
    }
}
```

Hệ quả: Khi Access Token hết hạn, interceptor cố tự động refresh nhưng thất bại → người dùng bị đăng xuất đột ngột dù phiên làm việc chưa thực sự hết hạn.

---

### 2. Nguyên nhân lỗi (Root Cause)

**Vấn đề cốt lõi: Thiếu cấu hình `withCredentials: true` — Cookie HTTP-Only không được gửi kèm trong request Angular `HttpClient`.**

#### 2.1 Luồng hoạt động thiết kế

1. Sau khi đăng nhập thành công, backend set `refreshToken` vào **HTTP-Only Cookie** với `sameSite: 'strict'`:
   ```typescript
   // auth.controller.ts
   res.cookie('refreshToken', result.data.refreshToken, {
     httpOnly: true,   // Cookie không thể đọc bằng JavaScript
     secure: false,
     sameSite: 'strict',
     maxAge: 7 * 24 * 60 * 60 * 1000,
     path: '/',
   });
   ```

2. Khi cần refresh, client gọi `POST /auth/refresh` và **cookie phải được tự động đính kèm**.

3. Backend đọc cookie từ header `Cookie`:
   ```typescript
   // auth.controller.ts
   const cookiesHeader = req.headers.cookie || '';  // Cần cookie header!
   const refreshToken = cookies['refreshToken'] || req.headers['x-refresh-token'] || req.body?.refreshToken;
   ```

#### 2.2 Nguyên nhân thực tế

Angular `HttpClient` **mặc định KHÔNG gửi cookie** (kể cả HTTP-Only Cookie) trong các cross-origin hoặc same-origin request, trừ khi được cấu hình rõ ràng `withCredentials: true`.

**Trong [auth.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts) của `open-erp-shared`:**

```typescript
// HIỆN TẠI — Gọi không kèm credentials, cookie không được gửi!
refreshToken(): Observable<LoginResponse> {
  const url = this.config.buildUrl(API_ENDPOINTS.auth.refresh);
  return this.http.post<LoginResponse>(url, {});  // ❌ Không có withCredentials
}
```

**Trong [auth.interceptor.ts](../../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts) của `open-erp-web`:**

```typescript
// HIỆN TẠI — Interceptor clone request nhưng không thêm withCredentials
const authReq = req.clone({ url, headers });  // ❌ Thiếu withCredentials: true
```

Do đó, khi frontend gọi `POST /auth/refresh`, request **không mang theo Cookie** → Backend nhận `req.headers.cookie` là chuỗi rỗng `''` → `refreshToken` là `undefined` → ném lỗi `REFRESH_TOKEN_REQUIRED`.

#### 2.3 Vấn đề phụ: `sameSite: 'strict'` trong môi trường dev

Frontend (`localhost:4200`) và Backend (`localhost:3000`) **là 2 origins khác nhau** (port khác nhau). Với cấu hình `sameSite: 'strict'`, trình duyệt sẽ **từ chối gửi cookie** trong cross-site request ngay cả khi `withCredentials: true`. Cần đổi sang `sameSite: 'lax'` hoặc `'none'` (kèm `secure: true`).

---

### 3. Giải pháp khắc phục (Resolution Design)

#### 3.1 Bổ sung `withCredentials` cho tất cả request (Khuyến nghị)

**Cách 1 - Bật toàn cục trong `app.config.ts`:**

```typescript
// open-erp-web/src/app/app.config.ts
import { withXsrfConfiguration, withFetch } from '@angular/common/http';

provideHttpClient(
  withInterceptors([authInterceptor]),
  withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })
)
```

**Cách 2 - Thêm `withCredentials` trong interceptor (Cách tốt hơn):**

```typescript
// open-erp-web/src/app/core/interceptors/auth.interceptor.ts
const authReq = req.clone({
  url,
  headers,
  withCredentials: true,  // ✅ Cho phép gửi Cookie
});
```

**Cách 3 - Chỉ thêm `withCredentials` cho request refresh:**

```typescript
// open-erp-shared/src/lib/services/auth.service.ts
refreshToken(): Observable<LoginResponse> {
  const url = this.config.buildUrl(API_ENDPOINTS.auth.refresh);
  return this.http.post<LoginResponse>(url, {}, { withCredentials: true });  // ✅
}
```

#### 3.2 Sửa `sameSite` cookie trong Backend

```typescript
// open-erp-services/src/features/auth/auth.controller.ts
res.cookie('refreshToken', result.data.refreshToken, {
  httpOnly: true,
  secure: false,       // false khi dev (không dùng HTTPS)
  sameSite: 'lax',    // ✅ Đổi từ 'strict' → 'lax' cho cross-port dev
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});
```

#### 3.3 Đảm bảo CORS cho phép credentials

Kiểm tra cấu hình CORS trong `main.ts` hoặc `app.module.ts` của backend:

```typescript
// open-erp-services/src/main.ts
app.enableCors({
  origin: ['http://localhost:4200', 'http://localhost:8100'], // Web & Mobile
  credentials: true,  // ✅ Bắt buộc để gửi Cookie qua CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-subdomain'],
});
```

#### 3.4 Phương án dự phòng: Gửi Refresh Token qua Body

Nếu không muốn phụ thuộc Cookie, có thể gửi Refresh Token qua request body. Backend đã hỗ trợ sẵn:

```typescript
// auth.controller.ts — đã hỗ trợ
const refreshToken = cookies['refreshToken'] || req.headers['x-refresh-token'] || req.body?.refreshToken;
```

Client cần lưu `refreshToken` và gửi trong body (lưu ý rủi ro bảo mật cao hơn):

```typescript
// open-erp-shared/src/lib/services/auth.service.ts
refreshToken(): Observable<LoginResponse> {
  const token = localStorage.getItem('refreshToken'); // ⚠️ Kém bảo mật hơn
  return this.http.post<LoginResponse>(url, { refreshToken: token });
}
```

> [!IMPORTANT]
> **Thứ tự ưu tiên giải pháp:**
> 1. ✅ **Cách 2** (withCredentials trong interceptor) + sửa `sameSite: 'lax'` + bật CORS credentials — đây là cách chuẩn nhất.
> 2. ⚠️ **Phương án dự phòng** (gửi qua body) — áp dụng tạm thời nếu CORS chưa cấu hình được.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. Sau khi đăng nhập thành công, trình duyệt lưu Cookie `refreshToken` (có thể kiểm tra qua DevTools → Application → Cookies → `localhost:3000`).
2. Gọi `POST /auth/refresh` thành công, nhận về access token mới.
3. Khi Access Token hết hạn (hoặc mô phỏng bằng cách xóa token), hệ thống tự động refresh và tiếp tục request gốc mà không yêu cầu đăng nhập lại.
4. Khi đăng xuất, Cookie `refreshToken` bị xóa khỏi trình duyệt.
5. Unit tests và build hệ thống hoàn tất thành công.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)

- **Trạng thái (Status)**: [ ] Cần sửa (Todo)
- **Ưu tiên**: 🔴 **Cao** — Ảnh hưởng đến toàn bộ cơ chế gia hạn phiên (session refresh). Khi Access Token hết hạn mà không refresh được, người dùng bị đăng xuất đột ngột.
- **File cần sửa:**
  - [`open-erp-services/src/main.ts`](../../../../open-erp-services/src/main.ts) — Bật `credentials: true` trong CORS
  - [`open-erp-services/src/features/auth/auth.controller.ts`](../../../../open-erp-services/src/features/auth/auth.controller.ts) — Đổi `sameSite: 'lax'`
  - [`open-erp-web/src/app/core/interceptors/auth.interceptor.ts`](../../../../open-erp-web/src/app/core/interceptors/auth.interceptor.ts) — Thêm `withCredentials: true`
  - [`open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts`](../../../../open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts) — Thêm `withCredentials` cho `refreshToken()`

> [!NOTE]
> BUG-1.9 (UNAUTHORIZED menu) và BUG-1.10 (REFRESH_TOKEN_REQUIRED) có liên quan mật thiết. Sau khi sửa BUG-1.10 (refresh hoạt động), cơ chế tự động refresh trong interceptor sẽ phục hồi được session sau reload — giảm thiểu ảnh hưởng của BUG-1.9.
