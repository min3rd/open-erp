# [TASK-369] Lưu sở thích giao diện theo người dùng (tenant chỉ là mặc định)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-369 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / chỉ đạo chủ dự án: "lưu theo cả người dùng, tenant chỉ là giao diện mặc định cho tenant thôi" |
| depends_on / blocks / parent | TASK-357, TASK-373 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | backend `modules/iam` + migration `V3.2.0`; frontend `shared/theme/*`, `ui-preferences.service.ts` (web + mobile), `app.config.ts` (web + mobile) |

## 1. Mục tiêu và scope

Trước task này: theme là cấp **tenant** (`tenants.ui_theme`), còn shape/layout/mode chỉ nằm ở localStorage trình duyệt. Chủ dự án yêu cầu mọi lựa chọn giao diện **lưu theo người dùng**; giá trị tenant chỉ còn là **mặc định** cho những ai chưa chọn.

- [x] Migration `V3.2.0__user_ui_preferences.sql`: `users.ui_theme`, `ui_shape`, `ui_layout`, `ui_mode` (nullable = theo mặc định).
- [x] `GET/PUT /api/v1/account/ui-preferences` — **mọi người dùng đã đăng nhập**, không cần quyền đặc biệt (đúng mẫu self-service `/api/v1/account/*`).
- [x] Trả kèm `tenant_theme` (từ `tenants.ui_theme`) + 4 danh mục giá trị hợp lệ.
- [x] PUT là ghi đè toàn bộ; `null` = xoá lựa chọn (quay về mặc định); giá trị lạ → 400 `USER_UI_PREFERENCES_INVALID_VALUE`.
- [x] Audit `USER_UI_PREFERENCES_UPDATED` (scope TENANT), 3 mã `ErrorCode` mới.
- [x] Frontend: token `UI_PREFERENCES_API` (thay `TENANT_THEME_API`), `ThemeService` gộp `theme = lựa chọn người dùng ?? mặc định tenant`, mọi thay đổi đều PUT lên tài khoản; vẫn cache localStorage để vẽ ngay (FOUC).
- [x] Switcher: select màu là **của người dùng**; chủ tenant có thêm dòng "MẶC ĐỊNH TENANT: <theme> [Đặt]" để nâng theme đang dùng thành mặc định tenant.

**Ngoài scope**: lưu ngôn ngữ theo tài khoản (vẫn theo trình duyệt) — nếu cần thì thêm 1 cột `ui_language` vào cùng endpoint.

## 2. Tiêu chí và kiểm chứng

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `mvn test -Dtest=UserUiPreferencesApiTest` (PostgreSQL thật) | **PASS 7/7** | defaults · persist · clear · invalid · cùng tenant tách biệt · khác tenant tách biệt · tenant default |
| `mvn test -Dtest=TenantUiPreferencesApiTest` | **PASS 4/4** | không phá API tenant cũ |
| `npm run build` web + mobile | **PASS** | 0 error |
| QA trình duyệt: lưu theo người dùng | **PASS** | đặt theme = emerald ⇒ `openerp_theme_user=emerald`; **xoá sạch cache localStorage rồi reload vẫn về emerald** (giá trị đến từ API) |
| QA trình duyệt: mặc định tenant | **PASS** | nút "Đặt" chỉ hiện với chủ tenant (quyền `core:tenant:settings-manage`); chọn AUTO ⇒ quay về theme mặc định tenant |

Ảnh: `%TEMP%/opencode/icons-layouts/panel-appearance.png`, `after-reload.png`.

## 3. Bàn giao và lịch sử

Commit `f2f83a3` (backend) + `7aa7213` (frontend wiring). Ghi chú: endpoint cũ `/api/v1/tenant/ui-preferences` giữ nguyên cho mặc định tenant; người dùng thường không còn gọi PUT endpoint đó.
