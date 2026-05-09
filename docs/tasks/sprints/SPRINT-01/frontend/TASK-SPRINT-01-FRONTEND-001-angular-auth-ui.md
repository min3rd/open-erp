# TASK-SPRINT-01-FRONTEND-001: Angular Web — Auth UI (Login, OAuth, MFA, Reset Password)

## Thông tin

| Thuộc tính       | Giá trị                                                              |
|------------------|----------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-01-FRONTEND-001                                          |
| Sprint           | Sprint 01                                                            |
| Cluster          | frontend                                                             |
| Loại             | Frontend                                                             |
| Người phụ trách  | Frontend                                                             |
| Story Points     | 8                                                                    |
| Trạng thái       | ⬜ TODO                                                              |
| Phụ thuộc        | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-AUTH-002, TASK-SPRINT-01-AUTH-003 |

## Mô tả

Xây dựng toàn bộ giao diện xác thực cho **Angular 21 Web App**. Bao gồm: màn hình đăng nhập (email/password + OAuth buttons), màn hình đăng ký doanh nghiệp (4 bước MST → OTP → Onboarding), màn hình quên/đặt lại mật khẩu, luồng thiết lập và xác thực MFA. Tích hợp `HttpInterceptor` để tự động gắn JWT và auto-refresh token.

## Phạm vi kỹ thuật

### Frontend Web (Angular 21 — `open-erp-web`)

**Cấu trúc module Auth:**
```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts              ← JWT management, login/logout
│   │   ├── auth.guard.ts                ← Route guard (protected routes)
│   │   ├── token-storage.service.ts     ← Secure localStorage wrapper
│   │   └── interceptors/
│   │       └── auth.interceptor.ts      ← Auto attach JWT + auto refresh
│   └── services/
│       └── api.service.ts               ← Base HTTP service
└── features/
    └── auth/
        ├── auth.routes.ts
        ├── login/
        │   ├── login.component.ts
        │   ├── login.component.html
        │   └── login.component.scss
        ├── register/
        │   ├── register.component.ts           ← Step container + stepper
        │   ├── register.component.html
        │   ├── register.component.scss
        │   ├── tax-verify/
        │   │   ├── tax-verify.component.ts     ← Step 1+2: MST + email
        │   │   ├── tax-verify.component.html
        │   │   └── tax-verify.component.scss
        │   ├── otp-verify/
        │   │   ├── otp-verify.component.ts     ← Step 3: Nhập OTP
        │   │   ├── otp-verify.component.html
        │   │   └── otp-verify.component.scss
        │   └── onboarding-wizard/
        │       ├── onboarding-wizard.component.ts  ← Step 4: Wizard 5 bước
        │       ├── onboarding-wizard.component.html
        │       └── onboarding-wizard.component.scss
        ├── forgot-password/
        │   ├── forgot-password.component.ts
        │   ├── forgot-password.component.html
        │   └── forgot-password.component.scss
        ├── reset-password/
        │   ├── reset-password.component.ts
        │   ├── reset-password.component.html
        │   └── reset-password.component.scss
        ├── mfa-setup/
        │   ├── mfa-setup.component.ts
        │   ├── mfa-setup.component.html
        │   └── mfa-setup.component.scss
        └── mfa-verify/
            ├── mfa-verify.component.ts
            ├── mfa-verify.component.html
            └── mfa-verify.component.scss
```

**Routes Auth:**
```typescript
// auth.routes.ts
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NotAuthGuard],   // Redirect nếu đã đăng nhập
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [NotAuthGuard],   // Redirect nếu đã đăng nhập
  },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'mfa/setup', component: MfaSetupComponent, canActivate: [AuthGuard] },
  { path: 'mfa/verify', component: MfaVerifyComponent },
  { path: 'oauth-callback', component: OauthCallbackComponent },
];
```

**RegisterComponent — Luồng đăng ký doanh nghiệp 4 bước (trang `/register`):**

*Bước 1 — `TaxVerifyComponent` (nhập thông tin ban đầu):*
- Form reactive: Mã số thuế (MST) + Email + Mật khẩu + Xác nhận mật khẩu
- Validators: MST đúng định dạng (10 hoặc 13 chữ số), email, minLength(8) cho mật khẩu
- Submit → gọi `POST /api/v1/register` + `POST /api/v1/register/verify-tax-code`
- Loading state khi đang tra cứu MST
- Xử lý lỗi: MST tồn tại (409), MST không hợp lệ (400), email không khớp (422)

*Bước 2 — Hiển thị thông tin DN từ MST lookup, xác nhận:*
- Hiển thị card: Tên DN, địa chỉ, trạng thái hoạt động — lấy từ kết quả `verify-tax-code`
- Xác nhận "Dữ liệu đúng" → tiếp tục (gọi OTP)
- Nút "Quảy lại" → về Bước 1

*Bước 3 — `OtpVerifyComponent` (nhập OTP email):*
- Hiển thị "Mã OTP đã được gửi đến [email]"
- Input 6 số OTP (auto-focus, auto-submit khi nhập đủ 6 chữ số)
- Countdown 60 giây trước khi gửi lại (tối đa 3 lần)
- Xử lý lỗi: OTP sai, hết hạn, vượt số lần gửi lại

*Bước 4 — `OnboardingWizardComponent` (5 bước cấu hình):*
- **4a.** Xác nhận và bổ sung thông tin DN (tạo sẵn từ MST, cho phép sửa)
- **4b.** Chọn đơn vị tiền tệ, múi giờ, ngôn ngữ
- **4c.** Tạo cơ cấu phòng ban ban đầu (multi-input danh sách phòng ban)
- **4d.** Mời nhân viên (import Excel hoặc thêm thủ công, có thể bỏ qua)
- **4e.** Chọn các phân hệ cần kích hoạt (checkbox list các module)
- Nút "Hoàn tất" → gọi `POST /api/v1/register/complete-onboarding` → redirect dashboard
- Thanh tiến trình (stepper) hiển thị bước hiện tại

**LoginComponent — tính năng:**
- Form reactive: email + password với validators (`required`, `email`, `minLength(8)`)
- Hiển thị lỗi validation realtime (touched + dirty state)
- Show/hide password toggle
- "Ghi nhớ đăng nhập" checkbox (persist refresh token)
- Nút "Đăng nhập bằng Google" → redirect OAuth
- Nút "Đăng nhập bằng Microsoft" → redirect OAuth
- Loading state (spinner) khi đang gọi API
- Xử lý lỗi API: sai mật khẩu, tài khoản bị khoá, cần MFA
- Redirect đến MFA verify nếu `mfaRequired: true`
- Redirect đến dashboard sau khi đăng nhập thành công

**AuthInterceptor — Auto JWT + Refresh:**
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Gắn Authorization header
    const token = this.tokenStorage.getAccessToken();
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    
    // 2. Xử lý 401 → auto refresh token
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/refresh-token')) {
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              const newToken = this.tokenStorage.getAccessToken();
              const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(retryReq);
            }),
            catchError(() => {
              this.authService.logout();
              return throwError(() => error);
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
```

**MfaSetupComponent:**
- Hiển thị QR code image (base64 từ API)
- Hiển thị secret text (để nhập tay vào authenticator)
- Input 6 số TOTP code
- Sau khi verify thành công → hiển thị 10 backup codes trong modal
- Warning: "Lưu backup codes ngay bây giờ, không thể xem lại"
- Copy all button cho backup codes

**ForgotPasswordComponent:**
- Input email
- Gửi request → hiển thị "Kiểm tra email của bạn"
- Countdown 60 giây trước khi cho gửi lại

**ResetPasswordComponent:**
- Đọc token từ URL query param
- Input mật khẩu mới + confirm
- Validation: min 8 chars, có chữ hoa, chữ thường, số, ký tự đặc biệt
- Submit → redirect về login với toast "Đặt lại mật khẩu thành công"

**TokenStorage Service:**
```typescript
// Lưu token an toàn trong localStorage (với prefix + tenant)
// Không lưu trong sessionStorage (mất khi đóng tab)
// TODO Sprint 02: encrypt với Web Crypto API
class TokenStorageService {
  setTokens(accessToken: string, refreshToken: string): void
  getAccessToken(): string | null
  getRefreshToken(): string | null
  clear(): void
}
```

**UI Framework:** Angular Material (hoặc PrimeNG — chọn 1 nhất quán với toàn dự án)

**Design Requirements:**
- Responsive: mobile-first
- Theme: Light mode mặc định (dark mode Sprint sau)
- Logo và màu sắc tenant (lấy từ tenant settings API)
- Loading skeleton khi chờ dữ liệu

## API Endpoints sử dụng

| API                                         | Gọi khi                               |
|---------------------------------------------|------------------------------------------|
| `POST /api/v1/register`                     | Form nhập MST + email (Bước 1)         |
| `POST /api/v1/register/verify-tax-code`     | Sau khi nhập MST (Bước 1 → 2)           |
| `POST /api/v1/register/verify-otp`          | Nhập OTP (Bước 3)                      |
| `POST /api/v1/register/complete-onboarding` | Hoàn tất Onboarding Wizard (Bước 4)    |
| `POST /api/v1/auth/login`                   | Form đăng nhập                          |
| `POST /api/v1/auth/refresh-token`           | Interceptor auto refresh                 |
| `POST /api/v1/auth/logout`                  | Nút đăng xuất                            |
| `POST /api/v1/auth/forgot-password`         | Form quên mật khẩu                      |
| `POST /api/v1/auth/reset-password`          | Form đặt lại mật khẩu                   |
| `POST /api/v1/auth/mfa/setup`               | MFA setup page                           |
| `POST /api/v1/auth/mfa/verify`              | Confirm MFA setup                        |
| `POST /api/v1/auth/mfa/challenge`           | MFA login verify                         |
| `GET /api/v1/auth/oauth/google`             | Google OAuth button                      |
| `GET /api/v1/auth/oauth/microsoft`          | Microsoft OAuth button                   |

## Acceptance Criteria

- [ ] Trang `/register`: hiển thị stepper 4 bước, trạng thái tiến trình rõ ràng
- [ ] Bước 1: validate MST (10/13 số), email, mật khẩu — hiển thị lỗi realtime
- [ ] Bước 2: hiển thị đúng thông tin DN từ kết quả tra cứu MST
- [ ] MST không hợp lệ/email không khớp → hiển thị thông báo lỗi tiếng Việt
- [ ] Bước 3: OTP tự submit khi nhập đủ 6 chữ số, countdown gửi lại 60s
- [ ] Gửi lại OTP quá 3 lần → khóa nút và hiển thị thông báo
- [ ] Bước 4: OnboardingWizard 5 bước, có thể bỏ qua bước mời nhân viên
- [ ] Hoàn tất Onboarding → redirect dashboard
- [ ] Đăng nhập thành công → redirect dashboard
- [ ] Đăng nhập thất bại → hiển thị thông báo lỗi phù hợp
- [ ] Google OAuth button → redirect đúng sang consent screen
- [ ] OAuth callback → lưu token, redirect dashboard
- [ ] `mfaRequired: true` → redirect màn hình MFA verify
- [ ] MFA verify đúng code → đăng nhập thành công
- [ ] Forgot password → email được gửi, hiển thị thông báo
- [ ] Reset password → đặt lại thành công, redirect login
- [ ] MFA setup: QR code hiển thị đúng, backup codes hiển thị sau verify
- [ ] AuthInterceptor: 401 → auto refresh → retry request
- [ ] AuthInterceptor: refresh thất bại → logout, redirect login
- [ ] AuthGuard: route protected → redirect login nếu chưa đăng nhập
- [ ] Giao diện Auth hỗ trợ đầy đủ Light Mode và Dark Mode theo Design System tokens
- [ ] Dark mode được kích hoạt theo `prefers-color-scheme` và có thể chuyển thủ công bằng toggle theme
- [ ] Preference giao diện được lưu bằng key `openErp.colorMode` trong localStorage
- [ ] Khi khởi động app, mode đã lưu được áp dụng trước lần render đầu tiên để tránh flash/sai màu ban đầu
- [ ] Toggle theme dùng lại component dùng chung (ví dụ `erp-theme-toggle` hoặc tương đương trong shared UI)
- [ ] Unit test (Jasmine/Jest) coverage ≥ 80%
- [ ] Có test (unit/integration hoặc e2e) xác nhận luồng hiển thị và chuyển đổi ở cả Light Mode và Dark Mode
- [ ] Responsive trên mobile (375px) và desktop (1280px+)

## Ghi chú kỹ thuật

- Angular 21 với Standalone Components — không dùng NgModule.
- Dùng `@angular/forms` `ReactiveFormsModule` cho tất cả forms.
- Signal-based state management (`signal`, `computed`, `effect`) thay vì RxJS BehaviorSubject.
- RegisterComponent dùng Angular CDK Stepper hoặc Angular Material Stepper để quản lý 4 bước.
- Tránh lưu sensitive data (token) trong sessionStorage (mất khi đóng tab).
- Tenant branding: gọi `/api/v1/tenants/me/settings` trước khi render login để lấy logo và màu sắc.
- Dùng Angular CDK `PortalModule` cho modal hiển thị backup codes.
- Error messages phải bằng tiếng Việt, user-friendly (không hiển thị technical errors).
