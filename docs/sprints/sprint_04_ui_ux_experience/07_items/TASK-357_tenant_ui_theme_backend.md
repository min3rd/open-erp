# [TASK-357] Backend: sở thích theme theo tenant (migration + API)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-357 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Review** (code + test 4/4 PASS, chờ QA/Reviewer) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | — / TASK-356 / [FEAT-24](../07_items/FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | backend `modules/iam` (Tenant, resource/service/DTO), migration `V3.1.0__tenant_ui_theme.sql`, test mới / working tree @ `8a7b1a8` |

## 1. Mục tiêu và scope

Lưu theme theo **tenant** và cấp API đọc/ghi để frontend áp theme (AC-01/AC-17, DES-API-S04-001).

- In-scope: cột `tenants.ui_theme`; `GET/PUT /api/v1/tenant/ui-preferences`; mã code/`ResponseKey`/DTO; permission `core:tenant:settings-manage`; test API trên PostgreSQL thật.
- Out-of-scope: giao diện đổi theme (TASK-356); đồng bộ mode (mode giữ theo người dùng, localStorage).

## 2. Các thao tác

- [x] Migration `V3.1.0__tenant_ui_theme.sql`: thêm `ui_theme VARCHAR(32)` default `industrial`.
- [x] `Tenant.uiTheme` + DTO `TenantUiPreferencesResponse` / `TenantUiPreferencesUpdateRequest`.
- [x] Service đọc/ghi + validate theme thuộc registry; resource `GET/PUT /api/v1/tenant/ui-preferences`.
- [x] `ResponseKey.THEME` / `AVAILABLE_THEMES`; `ErrorCode` cho success/invalid.
- [x] Permission `core:tenant:settings-manage` cấp cho TENANT_OWNER/TENANT_ADMIN; seed quyền.
- [x] Test `TenantUiPreferencesApiTest` (fetch/update/validate/tenant isolation) trên PostgreSQL thật.

## 3. Tiêu chí và kiểm chứng theo loại thay đổi

- [x] Đáp ứng DES-API-S04-001 §3; 4 khuôn mẫu response; không text cứng.
- [x] Backend: test trên PostgreSQL/Redis thật (không H2).
- [ ] Frontend: N/A (thuộc TASK-356).
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `mvn test -Dtest=TenantUiPreferencesApiTest` (PostgreSQL thật) | **4/4 PASS, BUILD SUCCESS** | `TenantUiPreferencesApiTest` 2026-10-05 |
| Tenant isolation (tenant khác không đọc/ghi được) | PASS | `testTenantIsolation` |
| Validate theme lạ → 400 | PASS | `testRejectsUnknownTheme` |

## 4. Bàn giao và lịch sử

Files: `V3.1.0__tenant_ui_theme.sql`, `Tenant.uiTheme`, `ErrorCode`, `ResponseKey` (`THEME`/`AVAILABLE_THEMES`), `PlatformAction.TENANT_UI_THEME_UPDATED`, `TenantUiPreferencesUpdateRequest`, `TenantUiPreferencesResponse`, `TenantUiPreferencesService`, `TenantUiPreferencesResource`, `TenantUiPreferencesApiTest`.

Kiểm tra đã chạy: test backend 4/4 trên PostgreSQL thật. Chưa: frontend tiêu thụ (TASK-356), QA browser. Rủi ro: quyền `core:tenant:settings-manage` phải seed (đã seed trong migration). Người nhận: QA backend + TASK-356. Bước tiếp: TASK-356 áp theme phía frontend.
