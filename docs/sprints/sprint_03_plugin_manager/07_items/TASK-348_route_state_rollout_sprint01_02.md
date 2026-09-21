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

BUG-108 (route-state cho màn Plugin Manager) được khách hàng mở rộng: **các màn dạng bảng của Sprint 01/02 cũng chưa lưu state vào Route**. Đã tạo helper dùng chung `RouteListStateService` (bind/set/listKey) và chuyển đổi các màn chính.

## Đã hoàn thành (verified browser)

| Màn | Query params | Drawer |
| :--- | :--- | :--- |
| `/platform/tenants` | `page,size,keyword,status,id` | `quota, impersonate, lock, unlock` |
| `/platform/users` | `page,size,keyword,status,id` | `lock, unlock, breakglass` |
| `/platform/audit-logs` | `page,size,keyword,scope,result,action,from,to,id` | `detail` |
| `/platform/admins` | `id` | `grant, disable, revoke, disable2fa, resetpassword` |
| `/settings/sample-records` | `page,size,id` | `create, edit, delete` |
| `/settings/members` | `id` | `create, edit, assign, delete` |
| `/settings/branch-assignments` | `id` | `assign, delete` |

Bằng chứng: `08_testing/evidence/screenshots/web_31_tenants_route_state.png` (input `qa` + select `ACTIVE` khôi phục từ URL), `web_32_sample_records_drawer.png`, `web_33_members_drawer.png`, `web_34_audit_logs_scope.png`, `qa_verify_result.json` (12/12 PASS, 0 console error).

## Còn lại (Sprint 04)

- `/account/sessions` (tenant) — danh sách phiên đăng nhập.
- Mobile Ionic: các danh sách `roles`, `organization`, `sample-records`, `emergency` — áp dụng cùng contract query params.
- Cân nhắc sort (`sort=field,dir`) khi bảng có sắp xếp cột.
