# [ADR-S07-003] Tenant switcher trên header: UI employee, auth Core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S07-003 / Architecture Decision Record / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.0 / 2026-10-30 |
| Owner / reviewer | Architect Agent / Chủ dự án + BA |
| Đầu vào | [CONF-S07-001 1.0](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) (Q47–Q52), [ANL-S07-004](../02_analysis/04_ANL-S07-004_tenant_switcher_header.md) |
| Đọc trước / đọc tiếp | SOL-S07-001 / [DES-API-S07-001](../06_designs/api/01_DES-API-S07-001_employee_organization_auth_api.md), [DES-UI-S07-001](../06_designs/ui/01_DES-UI-S07-001_employee_organization_ui.md) |

## 1. Bối cảnh

Hiện chỉ có chọn tenant **trước khi vào app**:

- `POST /api/v1/auth/login` trả pre-auth token + danh sách tenant.
- `POST /api/v1/auth/select-tenant` cấp access/refresh token, xóa pre-auth session.
- Header chỉ hiển thị `tenantName` + role; chưa có switch sau login.

Yêu cầu R9: switch tenant ngay trên header. Q47 chọn UI trong **employee header contribution**; Q48 endpoint mới; Q49 thu hồi session cũ; Q52 clear toàn bộ tenant state. Vì đây là tính năng auth toàn cục, cần tách **UI** (employee contribution) khỏi **auth/session** (Core).

## 2. Quyết định

### 2.1. Phân lớp

| Lớp | Trách nhiệm | Vị trí |
| :--- | :--- | :--- |
| **UI** | Hiển thị tenant hiện tại, item “Chuyển tenant” trong user menu, dropdown/search, guard unsaved, gọi callback | Employee header contribution; shared `TenantSwitcherComponent`; slot `core.layout.user-menu.items` |
| **Host bridge** | Cung cấp tenant list + callback `switchTenant`; replace session; clear cache; reload | Core Web/Mobile shell |
| **Auth** | Validate membership, revoke session cũ, cấp token mới, audit | Core `AuthResource`/`AuthService` |
| **Data** | Reload employee/profile/quyền/plugin manifest theo tenant mới | Host + plugin |

### 2.2. PluginContext mở rộng

```ts
export interface PluginTenantSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_default: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
}

export interface PluginContext {
  // ...existing
  tenants: PluginTenantSummary[];
  switchTenant?: (tenantId: string) => Promise<void>;
}
```

- Host fetch tenant list khi session khởi tạo/refresh; truyền vào context.
- Employee WC **không** tự gọi auth API, không giữ token; chỉ gọi callback.
- Nếu `switchTenant` không có → ẩn switcher (fallback an toàn).

### 2.2.1. Vị trí UI

Theo U5, switcher nằm **trong user menu** (account menu), không phải nút riêng trên header:

- Core `UserMenuComponent` mở slot `core.layout.user-menu.items`.
- Employee contribution render `TenantSwitcherMenuItem` trong slot này.
- Nếu slot không khả dụng (host cũ), fallback render compact trong `core.layout.header.actions`.
- Slot contract giống slot hiện tại: `slot_code`, `context`, `permission`, `platforms`; Core vẫn là bên render.

### 2.3. Auth endpoint

`POST /api/v1/auth/switch-tenant`

Request:
```json
{ "tenant_id": "uuid" }
```

Response Single Resource:
```json
{
  "success": true,
  "code": "AUTH_TENANT_SWITCH_SUCCESS",
  "message": "Tenant switched successfully.",
  "params": {},
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "session_id": "...",
    "expires_in": 900,
    "user": {
      "user_id": "uuid",
      "email": "a@b.c",
      "full_name": "Nguyễn Văn A",
      "tenant_id": "uuid",
      "tenant_name": "Acme",
      "tenant_slug": "acme",
      "role": "MEMBER"
    }
  }
}
```

- Auth: Bearer access token hiện tại.
- Validate: user thuộc tenant; tenant ACTIVE (không suspended/locked).
- Revoke session cũ (access/refresh) sau khi tạo session mới; ghi audit `AUTH_TENANT_SWITCHED`.
- Rate limit theo user/IP; idempotency key tùy chọn.
- Error codes: `AUTH_TENANT_ACCESS_DENIED`, `AUTH_TENANT_SUSPENDED`, `AUTH_TENANT_SWITCH_RATE_LIMITED`, `AUTH_SESSION_INVALID`.

`GET /api/v1/auth/me/tenants` — Non-Paginated List `{ items: PluginTenantSummary[] }`; dùng cho host refresh.

### 2.4. Host flow

```mermaid
sequenceDiagram
    actor U as User
    participant W as Employee header WC
    participant H as Core Shell
    participant A as Auth API
    participant C as Cache/Plugin
    U->>W: Chọn tenant B
    W->>W: Guard unsaved changes
    W->>H: switchTenant(B)
    H->>A: POST /auth/switch-tenant
    A->>A: validate membership B; revoke A; issue B
    A-->>H: LoginResult B
    H->>H: replace session/user
    H->>C: clear tenant cache/plugin session/manifest
    H->>H: navigate home B; reload
    H-->>W: context B
```

### 2.5. Invalidate

| Thành phần | Hành vi |
| :--- | :--- |
| Access/refresh token | Replace; old revoked |
| Data cache | Clear toàn bộ key tenant cũ |
| Plugin runtime session | Clear; reload manifest/assets theo tenant mới |
| UI manifest/menu | Re-fetch theo tenant/permissions mới |
| Employee self-service | Reload `/me`; nếu không có hồ sơ → empty state |
| Notification badge | Reset theo tenant |
| Route | Giữ route tương đương nếu tồn tại; fallback home |
| Unsaved form | Guard confirm trước khi switch; không auto-discard |

## 3. Phương án đã cân nhắc

| Phương án | Ưu | Nhược | Kết luận |
| :--- | :--- | :--- | :--- |
| A. Core TopBar | Sạch, dùng mọi plugin | Không đúng Q47 | Không chọn |
| **B. Employee header contribution + host callback** | Đúng Q47; auth vẫn Core; không lộ token | Cần mở rộng PluginContext; phụ thuộc employee plugin | **Chọn** |
| C. Plugin tự gọi auth API | Ít host change | Plugin giữ token/session; rủi ro bảo mật | Loại |
| D. Client-only đổi tenant_id | Đơn giản | Token/quyền cũ; rò rỉ dữ liệu | Loại |

## 4. Hệ quả

### 4.1. Tích cực

- UI đúng lựa chọn; auth/session vẫn Core.
- Không lộ JWT vào plugin.
- Clear cache/plugin rõ ràng; chống rò rỉ chéo tenant.
- Có thể chuyển UI lên Core sau mà không đổi API.

### 4.2. Tiêu cực / chi phí

- Mở rộng `PluginContext` (shared contract) + host Web/Mobile.
- Employee plugin phải always-on để switcher luôn có mặt.
- Multi-tab: tab cũ nhận 401 sau revoke; cần UX.
- Test session/token/cache phức tạp.

## 5. Traceability

| AC | Cách đáp ứng |
| :--- | :--- |
| AC-33 | Endpoint validate membership, revoke session, cấp token mới |
| AC-34 | Clear cache/tenant state/plugin/manifest; employee reload |
| AC-35 | Header desktop/mobile, guard, a11y, single-tenant hide |
| AC-19 | Mobile switcher/shared component; 390×844 |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Chốt UI employee header + host callback + auth Core; contract PluginContext | Architect; CONF-S07-001 1.0 |
| 0.2 | 2026-10-30 | U5: switcher nằm trong user menu (`core.layout.user-menu.items`), fallback header action | Architect; UI interactive 2026-10-30 |
| 1.0 | 2026-10-30 | Approved cùng Design review | Chủ dự án; design review 2026-10-30 |
