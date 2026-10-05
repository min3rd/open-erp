# [DES-API-S04-001] Thiết Kế API — Tenant UI Preferences & Ngôn Ngữ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S04-001 / Thiết kế API / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [CONF-S04-001](../../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft), [SOL-S04-001](../../05_solutions/01_SOL-S04-001_ui_platform_architecture.md) |
| Đọc trước / đọc tiếp | [DES-UI-S04-001](../../06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md) / [FEAT-24](../../07_items/FEAT-24_theme_system_and_design_tokens.md) |

## 1. Phạm Vi & Truy Vết

| AC | Phần API |
| :--- | :--- |
| AC-01, AC-17 | `GET/PUT /api/v1/tenant/ui-preferences` (theme theo tenant) |
| AC-14, AC-15, AC-16 | `language` trong hồ sơ người dùng + danh mục locale |

## 2. Quyết Định Lưu Trữ

| Dữ liệu | Phạm vi | Nơi lưu | Lý do |
| :--- | :--- | :--- | :--- |
| **Theme** | **Theo tenant** (Q2) | Cột mới `tenants.ui_theme VARCHAR(32)` (mặc định `industrial`) | Đổi đơn giản, đọc nhanh, đi cùng tenant context |
| **Mode (Light/Dark/System)** | Theo người dùng | `localStorage` (`openerp_theme` hiện có) | Giữ thói quen sáng/tối; không cần server |
| **Ngôn ngữ** | Theo người dùng | `user_profiles.language` (**đã có**) | Tái dùng; không tạo store mới |

> Migration đề xuất: `V4.0.0__tenant_ui_theme.sql` thêm cột `ui_theme` với default `industrial` (giá trị hợp lệ kiểm ở tầng service/registry, không dùng CHECK cứng để không chặn thêm theme mới).

## 3. Contract — Tenant UI Preferences

### 3.1. `GET /api/v1/tenant/ui-preferences`
- Auth: người dùng đã đăng nhập (mọi vai trò trong tenant) — cần để áp theme sau đăng nhập.
- Tenant: lấy từ ngữ cảnh đã xác thực; **không** nhận tenant từ client.
- Response (Single Resource):

```json
{
  "success": true,
  "code": "TENANT_UI_PREFERENCES_FETCH_SUCCESS",
  "message": "Tenant UI preferences fetched.",
  "params": null,
  "data": { "theme": "industrial", "available_themes": ["industrial", "slate-blue", "emerald"] }
}
```

### 3.2. `PUT /api/v1/tenant/ui-preferences`
- Auth: permission **`core:tenant:settings:manage`** (mới; mặc định cấp cho `TENANT_OWNER`, `TENANT_ADMIN`).
- Body: `{ "theme": "slate-blue" }`.
- Validate: `theme` phải nằm trong registry; sai ⇒ 400 `TENANT_UI_PREFERENCES_INVALID_THEME`.
- Response: `TENANT_UI_PREFERENCES_UPDATE_SUCCESS` + `data: { theme }`.
- Side effect: ghi audit `TENANT_UI_THEME_UPDATED` (PlatformAction TENANT scope), không cần invalidate cache IAM.

> Platform admin: có thể set qua API quản trị tenant (tùy chọn, cùng cột `ui_theme`). Chưa bắt buộc Sprint 04.

## 4. Contract — Ngôn Ngữ

- Tái dùng `PUT /api/v1/account/profile` với `language` (đã có). **Bổ sung**: validate `language ∈ LangCode` đã duyệt; sai ⇒ 400 `ACCOUNT_LANGUAGE_UNSUPPORTED`.
- `GET /api/v1/account/profile` trả `data.language` (đã có) ⇒ frontend nạp dictionary tương ứng.
- (Tùy chọn) `GET /api/v1/i18n/locales` (public) trả danh mục locale để switcher dùng nguồn backend; nếu không, registry ở frontend là nguồn.

### 4.1. Danh mục locale đã duyệt
`vi, en, zh-CN, ja, ko, es, fr, de, pt-BR, ru, ar, th, id` (nguồn: [CONF-S04-001](../../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) §3). `ar` là **RTL**.

### 4.2. Từ điển
- Tĩnh tại `public/i18n/<code>.json`; nạp **lazy**; fallback `locale → en → key`.
- Có script kiểm **parity** giữa các locale (baseline hiện tại: web 884, mobile 475 key).
- Ngưỡng phát hành: **100% key** so với `en` (Q5). Script parity báo thiếu/thừa; locale chưa đủ 100% **không** được phát hành.

## 5. Chuẩn Hoá Bắt Buộc (api_standards)

- Mọi response dùng 1 trong 4 khuôn mẫu; `code` UPPER_SNAKE; **không** text tiếng Việt trong payload.
- Key payload dùng enum `ResponseKey`: thêm `THEME("theme")`, `AVAILABLE_THEMES("available_themes")`, `LANGUAGE("language")`.
- DTO định kiểu mạnh: `TenantUiPreferencesResponse`, `TenantUiPreferencesUpdateRequest`; **không** trả `Map<String,Object>`.
- Mã code mới: `TENANT_UI_PREFERENCES_FETCH_SUCCESS`, `TENANT_UI_PREFERENCES_UPDATE_SUCCESS`, `TENANT_UI_PREFERENCES_INVALID_THEME`, `ACCOUNT_LANGUAGE_UNSUPPORTED`.

## 6. Ánh Xạ Frontend (không thuộc API nhưng ràng buộc)

| Bước | Hành vi |
| :--- | :--- |
| Trước đăng nhập | Dùng theme cache localStorage (tránh FOUC) hoặc `industrial`. |
| Sau đăng nhập | Gọi `GET /tenant/ui-preferences` + đọc `language` hồ sơ ⇒ áp theme/mode/locale. |
| Đổi theme (có quyền) | `PUT` rồi áp ngay; người dùng khác nhận ở lần tải sau. |
| Đổi ngôn ngữ | `PUT /account/profile` (`language`) + nạp dictionary + `localStorage`. |

## 7. Lỗi & Trường Hợp Biên

| Tình huống | HTTP | code |
| :--- | :--- | :--- |
| Theme không có trong registry | 400 | `TENANT_UI_PREFERENCES_INVALID_THEME` |
| Không có quyền đổi theme | 403 | `IAM_PERMISSION_DENIED` (hiện có) |
| Ngôn ngữ không hỗ trợ | 400 | `ACCOUNT_LANGUAGE_UNSUPPORTED` |
| Tenant bị khoá | 403 | (guard hiện có) |

## 8. Chưa Kiểm Chứng

Chưa có migration/endpoint/mã thật. Tên permission `core:tenant:settings:manage`, việc Platform admin đổi theme, và endpoint `/i18n/locales` là **đề xuất** — chốt khi triển khai (bước 07) và review kiến trúc.
