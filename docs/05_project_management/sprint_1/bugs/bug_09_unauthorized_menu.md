# Tài liệu báo cáo lỗi: BUG-1.9 - Lỗi UNAUTHORIZED khi gọi API /auth/menu sau khi reload trang
## Phân hệ: Xác thực & Phân quyền (Auth - Dynamic Menu - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)

Khi người dùng đã đăng nhập thành công và **tải lại trang (reload/refresh)**, sau đó hệ thống cố gắng gọi API để lấy danh sách menu động thì nhận về lỗi xác thực:

**Endpoint:** `GET http://localhost:3000/api/v1/auth/menu`

**Response lỗi:**
```json
{
    "success": false,
    "error": {
        "code": "UNAUTHORIZED",
        "messageKey": "auth.unauthorized"
    }
}
```

Kết quả là giao diện không render được sidebar/menu điều hướng mặc dù người dùng đã đăng nhập trước đó.

---

### 2. Nguyên nhân lỗi (Root Cause)

**Vấn đề cốt lõi: `accessToken` Signal chỉ tồn tại trong bộ nhớ (in-memory), không được duy trì qua các lần tải lại trang.**

Trong [auth.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts) của `open-erp-shared`:

```typescript
// Signal chỉ là trạng thái runtime — bị reset về null mỗi khi trang tải lại
accessToken = signal<string | null>(null);
```

Sau khi người dùng đăng nhập:
1. `accessToken` Signal được set với giá trị JWT hợp lệ.
2. Trình duyệt **tải lại trang (F5 hoặc hard refresh)** → toàn bộ Angular application khởi động lại.
3. `accessToken` Signal reset về `null` (giá trị khởi tạo mặc định).
4. `authInterceptor` kiểm tra `authService.accessToken()` → nhận được `null`.
5. Header `Authorization: Bearer <token>` **không được gắn** vào request.
6. Backend nhận request không có token → `JwtAuthGuard` từ chối → trả về `401 UNAUTHORIZED`.

**Chuỗi lỗi liên quan:**
- `LayoutComponent.fetchMenu()` gọi `GET /api/v1/auth/menu` ngay khi component khởi tạo.
- Nếu `accessToken` bị mất do reload, request này luôn thất bại.
- Do không có cơ chế khôi phục session (restore session) sau reload, người dùng buộc phải đăng nhập lại.

---

### 3. Giải pháp khắc phục (Resolution Design)

#### 3.1 Lưu `accessToken` vào `localStorage` (Phương án chính)

Cập nhật `AuthService` trong `open-erp-shared` để lưu/khôi phục token từ `localStorage`:

**Trong [auth.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts):**

```typescript
// Khôi phục token từ localStorage khi service khởi tạo
accessToken = signal<string | null>(localStorage.getItem('accessToken'));

// Sau khi login thành công → lưu vào localStorage
tap((res) => {
  if (res.success && res.data?.accessToken) {
    this.accessToken.set(res.data.accessToken);
    localStorage.setItem('accessToken', res.data.accessToken);  // <-- Thêm dòng này
  }
})

// Sau khi refresh thành công → cập nhật localStorage
tap({
  next: (res) => {
    if (res.success && res.data?.accessToken) {
      this.accessToken.set(res.data.accessToken);
      localStorage.setItem('accessToken', res.data.accessToken);  // <-- Thêm dòng này
    } else {
      this.accessToken.set(null);
      localStorage.removeItem('accessToken');  // <-- Xóa khi hết hạn
    }
  },
  error: () => {
    this.accessToken.set(null);
    localStorage.removeItem('accessToken');  // <-- Xóa khi lỗi
  }
})

// Khi logout → xóa khỏi localStorage
tap(() => {
  this.accessToken.set(null);
  this.permissions.set([]);
  localStorage.removeItem('accessToken');  // <-- Dọn dẹp khi đăng xuất
})
```

#### 3.2 Khôi phục Permissions sau khi reload

Sau khi khôi phục `accessToken` từ `localStorage`, cần gọi lại `fetchProfileAndPermissions()` để nạp lại danh sách quyền:

**Trong [app.config.ts](../../../../open-erp-web/src/app/app.config.ts) của `open-erp-web`:**

```typescript
// Thêm APP_INITIALIZER để restore session khi app khởi động
export function restoreSession(authService: AuthService) {
  return () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authService.accessToken.set(token);
      return authService.fetchProfileAndPermissions().pipe(
        catchError(() => {
          // Token hết hạn → thử refresh
          return authService.refreshToken();
        })
      ).toPromise();
    }
    return Promise.resolve();
  };
}
```

> [!NOTE]
> Phương án lưu `accessToken` vào `localStorage` có rủi ro bảo mật XSS. Tuy nhiên trong bối cảnh môi trường dev nội bộ và khi chưa triển khai BullMQ/OAuth, đây là giải pháp đơn giản nhất. Về lâu dài nên chuyển sang lưu Access Token trong memory + Refresh Token trong HTTP-Only Cookie.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. Đăng nhập thành công → tải lại trang (F5) → sidebar/menu vẫn hiển thị đúng.
2. `GET /api/v1/auth/menu` trả về dữ liệu hợp lệ sau khi reload (không còn lỗi `UNAUTHORIZED`).
3. Danh sách quyền (`permissions` signal) được khôi phục đúng sau khi reload trang.
4. Khi Access Token hết hạn, hệ thống tự động gọi Refresh Token để lấy token mới.
5. Khi đăng xuất, `accessToken` trong `localStorage` bị xóa ngay lập tức.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)

- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed) — 2026-06-19
- **Ưu tiên**: 🔴 **Cao** — Ảnh hưởng trực tiếp đến trải nghiệm người dùng sau mỗi lần tải lại trang.
- **Thay đổi thực hiện:**

| File | Thay đổi |
|------|----------|
| [`open-erp-shared/.../auth.service.ts`](../../../../open-erp-shared/projects/shared-ui/src/lib/services/auth.service.ts) | Khởi tạo `accessToken` Signal từ `localStorage.getItem('accessToken')`. Lưu token sau login/refresh. Xóa token khi logout. |
| [`open-erp-web/src/app/app.config.ts`](../../../../open-erp-web/src/app/app.config.ts) | Thêm `restoreSession` APP_INITIALIZER — gọi `fetchProfileAndPermissions()` khi app khởi động nếu tìm thấy token trong localStorage. Tự động thử refresh nếu token hết hạn. |
| [`open-erp-mobile/src/main.ts`](../../../../open-erp-mobile/src/main.ts) | Tương tự, thêm `restoreSession` APP_INITIALIZER. |
