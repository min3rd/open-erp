# TASK-348: Rollout Route-State cho toàn bộ màn hình dạng bảng (Sprint 01/02)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | TASK-348 |
| **Mức độ** | High (đã xử lý phần chính) — phần còn lại Medium |
| **Phát hiện bởi** | Khách hàng + QA/QC Agent |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | In Review (7/7 màn chính Done; còn danh sách phụ → Sprint 04) |
| **Liên quan** | BUG-108, `core/utils/route-list-state.service.ts` |

## Bối cảnh

BUG-108 (route-state cho màn Plugin Manager) được khách hàng mở rộng: **các màn dạng bảng của Sprint 01/02 cũng chưa lưu state vào Route**.

> **Cập nhật 2026-09-21**: Khách hàng chốt chuẩn **path-segment** thay cho query-param: `/:filter/:sort/:pageSize/:page/:id/:mode` (canonical `all/-/20/1/-/list`), helper `PathListStateService` (`core/utils/path-list-state.ts`) + `listState()` trong `app.routes.ts`. Chuẩn ghi tại [coding_standards.md 2.4](../../../../08_developer_guides/coding_standards.md). **12 màn đã chuyển đổi** (5 Plugin Manager + 7 Sprint 01/02); helper cũ `route-list-state.service.ts` đã xoá.

## Đã hoàn thành (verified browser 9/9 PASS, 0 console error)

| Màn | Base path | Filter segment | Mode |
| :--- | :--- | :--- | :--- |
| `/platform/tenants` | `/platform/tenants` | `all\|TenantStatus` | `list\|quota\|impersonate\|lock\|unlock` |
| `/platform/users` | `/platform/users` | `all\|UserStatus` | `list\|lock\|unlock\|breakglass` |
| `/platform/audit-logs` | `/platform/audit-logs` | `all\|PLATFORM\|TENANT` | `list\|detail` |
| `/platform/admins` | `/platform/admins` | `all` | `list\|grant\|disable\|revoke\|disable2fa\|resetpassword` |
| `/platform/plugins` | `/platform/plugins` | `all\|ACTIVE\|BLOCKED` | `list\|versions\|edit\|register\|block\|bulk\|support` |
| `/platform/plugin-credentials` | `/platform/plugin-credentials` | `all` | `list\|create\|edit\|delete` |
| `/platform/tenant-private-plugins` | `/platform/tenant-private-plugins` | `all` | `list\|block` (chỉ SUPER_ADMIN) |
| `/settings/plugins` | `/settings/plugins` | `all` | `list\|detail\|upgrade\|uninstall\|manage\|register\|notifications` |
| `/settings/plugin-credentials` | `/settings/plugin-credentials` | `all` | `list\|create\|delete` |
| `/settings/sample-records` | `/settings/sample-records` | `all` | `list\|create\|edit\|delete` |
| `/settings/members` | `/settings/members` | `all` | `list\|create\|edit\|assign\|delete` |
| `/settings/branch-assignments` | `/settings/branch-assignments` | `all` | `list\|assign\|delete` |

Bằng chứng: `web_40_path_filter.png` (BLOCKED), `web_41_path_page2.png`, `web_42_path_tenants.png` (ACTIVE), `web_43_support_block_guard.png`, `web_44_marketplace_detail_path.png`, `web_45_marketplace_manage_path.png`, `web_46_sample_records_path.png`, `qa_path_result.json` (9/9 PASS).

## Còn lại (Sprint 04)

- `/account/sessions` (tenant) — danh sách phiên đăng nhập.
- Mobile Ionic: các danh sách `roles`, `organization`, `sample-records`, `emergency` — áp dụng cùng contract query params.
- Cân nhắc sort (`sort=field,dir`) khi bảng có sắp xếp cột.
