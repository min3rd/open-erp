# [ANL-S07-004] Switch tenant đang làm việc trên header

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S07-004 / Phân tích / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-30 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Yêu cầu trực tiếp 2026-10-30 (“plugin employee cần thêm tính năng switch tenant đang làm việc cho tài khoản ở header”), hiện trạng auth/header |
| Đọc trước / đọc tiếp | [ANL-S07-002](02_ANL-S07-002_admin_management_and_self_service.md) / [CONF-S07-001](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) |

## 1. Mục đích

Phân tích tính năng **chuyển tenant đang làm việc ngay trên header** cho tài khoản thuộc nhiều tenant. Tài liệu trả lời:

1. Hiện đăng nhập/chọn tenant hoạt động thế nào, thiếu gì.
2. Switch tenant tác động gì tới JWT, quyền, session, cache, plugin runtime.
3. Nên đặt ở Core/shared hay plugin employee.
4. UX/API/edge case và câu hỏi cần chốt.

> Đây là tính năng **xuyên phiên đăng nhập**, không chỉ là một màn hình hồ sơ. Nếu chỉ đổi tên tenant trên header mà không đổi token/quyền/cache sẽ rò rỉ dữ liệu chéo tenant.

## 2. Hiện trạng

| Thành phần | Hiện tại | Khoảng trống |
| :--- | :--- | :--- |
| Đăng nhập | `POST /api/v1/auth/login`; nếu user thuộc nhiều tenant trả pre-auth token + danh sách tenant | Chỉ chọn tenant **trước khi** vào app |
| Chọn tenant | `POST /api/v1/auth/select-tenant` với `pre_auth_token` + `tenant_id`; cấp access/refresh token, xóa pre-auth session | Không dùng được sau khi đã đăng nhập |
| Access token | Chứa `tenant_id`, role, permissions, session id | Token cũ vẫn còn hiệu lực nếu không thu hồi |
| Refresh token | Gắn tenant/session | Chưa có luồng switch sau login |
| Session | `SessionManager` tạo session; logout thu hồi | Chưa có “switch” thu hồi session cũ |
| Header | `TopbarComponent` hiển thị `tenantName` + role; `UserMenu` có account/theme/language/logout | Không có tenant switcher |
| Plugin runtime | Token/asset cache key theo JWT (Sprint 06); UI manifest theo tenant | Cần xóa/refresh khi switch |
| Mobile | Có `select-tenant` sau login; header/drawer riêng | Chưa có switch sau login |

**Kết luận:** hệ thống có “chọn tenant khi đăng nhập”, **chưa có “switch tenant khi đang làm việc”**. Cần endpoint + UX + cơ chế invalidate.

## 3. Vị trí triển khai

| Phương án | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| **A. Core/shared** | Endpoint `auth/switch-tenant`; `TenantSwitcherComponent` trong `src/frontend/shared/components/`; gắn vào `TopbarComponent` dùng chung Web/Mobile | Sạch nhất về kiến trúc; không chọn vì Q47 = B |
| **B. Employee plugin header contribution** | Employee plugin đăng ký slot `core.layout.header.actions` và render switcher; dùng shared component + auth endpoint Core | **Đã chốt Q47 = B**; employee always-on nên luôn có mặt; rủi ro nếu plugin lỗi/ẩn |
| **C. Cả hai** | Core switcher + employee shortcut | Dư thừa; chỉ nên có một nguồn |

**Đã chốt Q47 = B:** switcher là **header contribution của plugin employee**, nhưng dùng **shared `TenantSwitcherComponent`** và **auth endpoint của Core**. Vì employee always-on, switcher luôn có mặt; nếu sau này có plugin khác cần, có thể chuyển sang Core/shared mà không đổi API. Rủi ro: nếu employee plugin ẩn/lỗi, switcher mất; cần fallback hoặc chuyển lên Core ở giai đoạn sau.

## 4. Cơ chế switch

### 4.1. Phương án API

| Phương án | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| **A. Endpoint mới `POST /api/v1/auth/switch-tenant`** | Dùng access token hiện tại + `tenant_id`; kiểm tra membership; cấp access/refresh/session mới; thu hồi session cũ; trả `LoginResult` | **Khuyến nghị** — UX tốt, không cần nhập lại mật khẩu |
| **B. Quay lại `select-tenant`** | Yêu cầu pre-auth token mới (đăng nhập lại) | An toàn nhưng phiền; mất ngữ cảnh |
| **C. Client-only** | Chỉ đổi header/tenant_id ở FE | **Loại** — token/quyền vẫn tenant cũ, rò rỉ dữ liệu |

### 4.2. Luồng đề xuất

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Web/Mobile
    participant API as Auth API
    participant S as Session/Permission
    participant P as Plugin runtime
    U->>FE: Chọn tenant B ở header
    FE->>FE: Guard unsaved changes
    FE->>API: POST /auth/switch-tenant {tenant_id}
    API->>API: Validate access token + membership B
    API->>S: Revoke session A; create session B
    API->>API: Resolve permissions B; issue access/refresh B
    API-->>FE: LoginResult B
    FE->>FE: Replace tokens/user; clear tenant caches
    FE->>P: Reload plugin manifest/session
    FE->>FE: Navigate home B; reload data
```

### 4.3. Yêu cầu bảo mật

1. **Validate membership từ DB**, không tin `tenant_id` client; user phải thuộc tenant B.
2. **Revoke session cũ** (access/refresh) khi switch; không để token tenant A tiếp tục dùng.
3. **Cấp token mới** với `tenant_id`, role, permissions của B; không tái sử dụng token A.
4. **Clear cache/tenant state**: data cache, plugin session, UI manifest, permission menu, notification badge, form drafts (theo Q51).
5. **Audit** sự kiện switch (user, from/to tenant, IP/device, thời điểm).
6. **Rate limit** và chặn switch liên tục; không log token.
7. **Tenant suspended/locked**: chặn switch, trả mã lỗi rõ.
8. **Multi-tab**: tab cũ có token A có thể còn gọi API đến khi hết hạn; cần chính sách (Q49).
9. **Platform admin/impersonation**: không dùng switcher này để vượt quyền platform; scope riêng.

## 5. UX đề xuất

- **Header**: tên tenant hiện tại + chevron; click mở dropdown/drawer.
- **Danh sách**: tenant user thuộc, role, trạng thái; tenant hiện tại highlight; search nếu > 8; sắp xếp theo lần dùng gần nhất/tên.
- **Hành vi**: chọn tenant → loading → replace session → điều hướng trang chủ tenant mới (hoặc giữ route tương đương nếu tồn tại); thông báo thành công.
- **Unsaved changes**: chặn/confirm trước khi switch (Q51).
- **Mobile**: cùng component trong topbar/drawer; touch ≥40px; không tràn ngang.
- **Empty/error**: user chỉ có 1 tenant → ẩn switcher; không có quyền/tenant bị khóa → disable + lý do.
- **i18n**: toàn bộ chuỗi qua key; tên tenant là dữ liệu.
- **Accessibility**: keyboard, aria-expanded, focus trap trong dropdown/drawer.

## 6. Ảnh hưởng tới plugin employee

1. Sau switch, self-service phải reload hồ sơ theo tenant mới; nếu user không có employee ở tenant B → trạng thái “Chưa có hồ sơ nhân viên”.
2. Plugin runtime/UI manifest có thể khác tenant (plugin bật/tắt theo tenant) → phải reload.
3. Notification/approval badge phải reset theo tenant.
4. Route đang mở trong plugin employee có thể không tồn tại ở tenant B → fallback trang chủ.
5. Không giữ form draft của tenant A khi sang B (trừ khi Q51 chọn auto-save theo tenant).

## 7. Edge case

| # | Tình huống | Hướng xử lý |
| :--- | :--- | :--- |
| T1 | User chỉ thuộc 1 tenant | Ẩn switcher; vẫn hiển thị tên tenant |
| T2 | Tenant bị suspended/locked | Disable + lý do; không cấp token |
| T3 | User bị gỡ khỏi tenant B | Từ chối `AUTH_TENANT_ACCESS_DENIED`; refresh danh sách |
| T4 | Switch khi đang mở form/drawer có thay đổi | Guard confirm; không mất dữ liệu im lặng |
| T5 | Tab cũ vẫn mở sau switch | Token cũ bị revoke; tab cũ nhận 401 và yêu cầu đăng nhập lại |
| T6 | Switch liên tục | Rate limit; debounce; audit |
| T7 | Token hết hạn giữa lúc switch | Refresh trước/redirect login; không switch nửa vời |
| T8 | Plugin B chưa cài | Vẫn switch được; UI tenant B không có plugin đó |
| T9 | User có employee ở A, không có ở B | Hiển thị trạng thái thiếu hồ sơ; không lỗi |
| T10 | Mobile mất mạng | Giữ tenant cũ; báo lỗi; retry |
| T11 | Platform admin đang impersonate | Không cho switch tenant làm vượt quyền; kết thúc impersonation trước |
| T12 | Tenant B có theme/ngôn ngữ khác | Reload theme/i18n theo tenant B |

## 8. Câu hỏi cần chốt

| # | Câu hỏi | Chốt |
| :--- | :--- | :--- |
| Q47 | Đặt switcher ở Core/shared hay plugin employee? | **B — Header contribution của plugin employee**, dùng shared component + Core auth endpoint |
| Q48 | Cơ chế switch? | **A — Endpoint mới `auth/switch-tenant`** |
| Q49 | Chính sách session khi switch? | **A — Thu hồi session cũ; một tenant active/device** |
| Q50 | UX danh sách tenant? | **A — Dropdown + search + tenant gần nhất** |
| Q51 | Unsaved changes? | **A — Guard + confirm** |
| Q52 | Invalidate gì sau switch? | **A — Clear toàn bộ tenant state + reload** |

Chi tiết tại [CONF-S07-001 §4.9](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md).

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Phân tích hiện trạng auth/header, vị trí Core/shared, API switch, UX, edge case, Q47–Q52 | BA Agent; yêu cầu trực tiếp chủ dự án |
| 0.2 | 2026-10-30 | Ghi nhận Q47–Q52: UI trong employee header contribution, endpoint Core, revoke session, dropdown+search, guard, clear state | BA Agent; hội thoại interactive |
