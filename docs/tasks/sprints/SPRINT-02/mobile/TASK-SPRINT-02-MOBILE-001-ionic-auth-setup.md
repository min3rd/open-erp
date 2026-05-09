# TASK-SPRINT-02-MOBILE-001: Ionic Angular — Thiết lập dự án mobile và màn hình Auth

## Thông tin

| Thuộc tính       | Giá trị                       |
|------------------|-------------------------------|
| Task ID          | TASK-SPRINT-02-MOBILE-001     |
| Sprint           | Sprint 02                     |
| Cluster          | mobile                        |
| Loại             | Mobile                        |
| Người phụ trách  | Frontend                      |
| Story Points     | 8                             |
| Trạng thái       | ⬜ TODO                       |
| Phụ thuộc        | TASK-SPRINT-01-AUTH-001       |

## Mô tả

Thiết lập cấu trúc dự án Ionic Angular Mobile App (`open-erp-mobile`), triển khai các màn hình xác thực (đăng nhập, quên mật khẩu, MFA), cấu hình lưu trữ JWT an toàn với Capacitor Preferences, tích hợp xác thực sinh trắc học (vân tay/Face ID), và thiết lập nhận push notifications từ Firebase.

## Phạm vi kỹ thuật

### Mobile (Ionic Angular — `open-erp-mobile`)

**Cấu trúc dự án:**
```
src/app/
├── app.routes.ts              ← Lazy loading routes
├── app.config.ts              ← Ionic config, providers
├── core/
│   ├── services/
│   │   ├── auth.service.ts           ← Auth state + API
│   │   ├── token-storage.service.ts  ← Capacitor Preferences
│   │   ├── api.service.ts            ← HTTP client (CapacitorHttp)
│   │   ├── biometric.service.ts      ← Biometric Auth
│   │   └── push-notification.service.ts ← Firebase FCM
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── guest.guard.ts
│   └── interceptors/
│       └── auth.interceptor.ts
├── features/
│   └── auth/
│       ├── auth.routes.ts
│       ├── login/
│       │   ├── login.page.ts
│       │   ├── login.page.html
│       │   └── login.page.scss
│       ├── forgot-password/
│       │   ├── forgot-password.page.ts
│       │   └── forgot-password.page.html
│       ├── mfa-verify/
│       │   ├── mfa-verify.page.ts
│       │   └── mfa-verify.page.html
│       └── oauth-callback/
│           └── oauth-callback.page.ts
└── shared/
    ├── components/
    └── directives/
```

**TokenStorageService — Capacitor Preferences:**
```typescript
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly PREFIX = 'erp_';

  async setAccessToken(token: string): Promise<void> {
    await Preferences.set({ key: `${PREFIX}access_token`, value: token });
  }

  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: `${PREFIX}access_token` });
    return value;
  }

  async setRefreshToken(token: string): Promise<void> {
    await Preferences.set({ key: `${PREFIX}refresh_token`, value: token });
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: `${PREFIX}access_token` });
    await Preferences.remove({ key: `${PREFIX}refresh_token` });
    await Preferences.remove({ key: `${PREFIX}user` });
  }
}
// Lưu ý: Capacitor Preferences dùng UserDefaults (iOS) / SharedPreferences (Android)
// KHÔNG dùng localStorage/sessionStorage cho tokens
```

**ApiService — CapacitorHttp:**
```typescript
import { CapacitorHttp } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;
  
  async get<T>(path: string, params?: object): Promise<T> {
    const token = await this.tokenStorage.getAccessToken();
    const response = await CapacitorHttp.get({
      url: `${this.baseUrl}${path}`,
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return this.handleResponse<T>(response);
  }
  
  async post<T>(path: string, data: unknown): Promise<T> {
    const token = await this.tokenStorage.getAccessToken();
    const response = await CapacitorHttp.post({
      url: `${this.baseUrl}${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data,
    });
    return this.handleResponse<T>(response);
  }
  
  private handleResponse<T>(response: HttpResponse): T {
    if (response.status === 401) {
      // Trigger token refresh flow
    }
    if (response.status >= 400) {
      throw new Error(response.data?.message);
    }
    return response.data;
  }
}
// Dùng CapacitorHttp thay vì Angular HttpClient để tránh CORS issues trên native
```

**LoginPage:**
- Form: Email, Mật khẩu
- Nút "Đăng nhập"
- Nút "Quên mật khẩu"
- Nút "Đăng nhập bằng Google" / "Đăng nhập bằng Microsoft"
- Sau đăng nhập thành công:
  - Nếu MFA enabled → navigate `/auth/mfa-verify`
  - Nếu không → navigate `/tabs/home`
- Hiển thị biometric login nếu đã từng đăng nhập (có stored credentials)

**BiometricService:**
```typescript
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  async isAvailable(): Promise<boolean> {
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  }
  
  async authenticate(): Promise<boolean> {
    try {
      await BiometricAuth.authenticate({
        reason: 'Xác nhận danh tính để đăng nhập',
        cancelTitle: 'Huỷ',
        allowDeviceCredential: true,
      });
      return true;
    } catch {
      return false;
    }
  }
}
// Luồng: User bật biometric → lưu refresh token an toàn
// Lần sau: nhận dạng sinh trắc → dùng stored refresh token để lấy access token
```

**MfaVerifyPage:**
- OTP input 6 digits (custom component hoặc `ion-input type="number"`)
- Auto-submit khi nhập đủ 6 ký tự
- Countdown timer cho mã OTP
- Nút "Dùng mã dự phòng"
- Hiển thị thông báo lỗi rõ ràng (sai mã, hết hạn)

**ForgotPasswordPage:**
- Nhập email → gửi → màn hình "Kiểm tra email của bạn"
- Back navigation

**PushNotificationService:**
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  async initialize(): Promise<void> {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') return;
    
    await PushNotifications.register();
    
    PushNotifications.addListener('registration', async (token) => {
      // Gửi token lên server
      await this.api.post('/notifications/device-tokens', {
        token: token.value,
        platform: Capacitor.getPlatform(),
      });
    });
    
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // App đang mở: hiển thị toast
    });
    
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      // User tap notification: navigate đến đúng màn hình
      this.router.navigate([action.notification.data.link]);
    });
  }
}
```

**capacitor.config.ts:**
```typescript
const config: CapacitorConfig = {
  appId: 'com.openErp.app',
  appName: 'Open ERP',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1976d2',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};
```

**Native Build Configuration:**

| Platform | Yêu cầu                                                        |
|----------|----------------------------------------------------------------|
| Android  | Android Studio, SDK 33+, google-services.json                  |
| iOS      | Xcode 15+, macOS, Apple Developer Account, GoogleService-Info.plist |

## API Endpoints sử dụng

| API                                             | Màn hình sử dụng       |
|-------------------------------------------------|------------------------|
| `POST /api/v1/auth/login`                       | LoginPage              |
| `POST /api/v1/auth/refresh-token`               | ApiService (auto)      |
| `POST /api/v1/auth/logout`                      | ProfilePage            |
| `POST /api/v1/auth/forgot-password`             | ForgotPasswordPage     |
| `POST /api/v1/auth/mfa/challenge`               | MfaVerifyPage          |
| `GET /api/v1/oauth/google`                      | LoginPage              |
| `POST /api/v1/notifications/device-tokens`      | PushNotificationService|

## Acceptance Criteria

- [ ] Login form: validate email format và required fields
- [ ] Đăng nhập thành công → navigate home
- [ ] Đăng nhập sai → hiển thị thông báo lỗi cụ thể
- [ ] MFA enabled → navigate MFA verify page sau login
- [ ] MFA: 6-digit OTP auto-submit
- [ ] Quên mật khẩu → email gửi thành công
- [ ] Biometric: bật → lần sau xác thực bằng vân tay/Face ID thành công
- [ ] Push notification: nhận permission → đăng ký FCM token
- [ ] Push notification tap → navigate đúng màn hình
- [ ] Token storage: tokens lưu trong Capacitor Preferences (không phải localStorage)
- [ ] CapacitorHttp được dùng (không phải Angular HttpClient trực tiếp)
- [ ] Giao diện Auth Mobile hỗ trợ đầy đủ Light Mode và Dark Mode theo Design System tokens
- [ ] Dark mode tự áp dụng theo `prefers-color-scheme` và cho phép người dùng chuyển thủ công bằng toggle theme
- [ ] Preference giao diện được lưu bằng key `openErp.colorMode` trong Capacitor Preferences
- [ ] Khi khởi động app, mode đã lưu được áp dụng trước lần render đầu tiên để tránh flash/sai màu ban đầu
- [ ] Toggle theme dùng lại component dùng chung (ví dụ `erp-theme-toggle` hoặc tương đương trong shared UI)
- [ ] Unit test coverage ≥ 80%
- [ ] Có test (unit/integration hoặc e2e) xác nhận hiển thị và chuyển đổi đúng ở cả Light Mode và Dark Mode
- [ ] Build thành công trên Android (APK)

## Ghi chú kỹ thuật

- `@capacitor/preferences` thay thế hoàn toàn `localStorage` cho sensitive data.
- `CapacitorHttp` (built-in Capacitor) bypass CORS trên native — không cần thêm proxy.
- Biometric plugin: `@aparajita/capacitor-biometric-auth` (community plugin, maintained well).
- OAuth2 trên mobile: dùng `@capacitor/browser` để mở OAuth URL → deep link callback.
- Deep link scheme: `com.openErp.app://oauth-callback` — cấu hình trong `capacitor.config.ts` và native build.
- Tách `environment.ts` (dev) và `environment.prod.ts` với đúng API URL.
- Ionic Lifecycle hooks (`ionViewWillEnter`) thay cho Angular `ngOnInit` khi cần fresh data.
