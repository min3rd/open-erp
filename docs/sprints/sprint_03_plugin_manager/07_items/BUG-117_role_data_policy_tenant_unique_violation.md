# [BUG-117] Data policy không lưu được → mọi thao tác dữ liệu báo không có quyền

| Trường | Giá trị |
| :--- | :--- |
| **Mã** | BUG-117 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | Chủ dự án (báo cáo trực tiếp) + QA Agent điều tra |
| **Ngày** | 2026-10-05 |
| **Trạng thái** | Resolved (chờ Reviewer/QA xác nhận) |
| **Loại** | Database schema / Multi-tenant defect |

## Triệu chứng

Người dùng đã cấp **đầy đủ quyền chức năng** `core:sample-record:*` cho vai trò qua giao diện,
nhưng mọi thao tác dữ liệu (tạo/sửa/xoá/export) đều báo **không có quyền**.
JWT claim có đủ 6 quyền; `GET` list trả 200 nhưng rỗng; `POST` trả
`403 IAM_PERMISSION_DENIED_DATA_SCOPE`.

## Nguyên nhân gốc

`role_data_policies` là bảng **theo tenant** (`tenant_id NOT NULL`), nhưng ràng buộc duy nhất lại là
`UNIQUE(role_id, resource)` — **thiếu `tenant_id`**. Vai trò hệ thống (`roles.tenant_id IS NULL`) dùng
chung một `role_id` cho **mọi tenant**, nên:

1. Tenant **đầu tiên** lưu policy cho một global role → INSERT thành công (1 row).
2. Mọi tenant **khác** PUT cùng role+resource → `findPolicy(tenantB, …)` không thấy row (khác tenant)
   → INSERT → vi phạm `uq_role_resource_policy` → **500 Internal Server Error**.
3. Policy không được lưu → `DataScopeResolver` trả `NONE` (deny by default) → mọi thao tác bị chặn.

Bằng chứng: log backend `duplicate key value violates unique constraint "uq_role_resource_policy"`,
stack `IamDataPolicyService.updatePolicies` → `upsertPolicy`; DB có 1 row duy nhất thuộc tenant khác
(`tenant_id=cd2729d8…`, role global `TENANT_ADMIN`).

## Cách sửa

Migration `V3.0.4__fix_role_data_policy_tenant_unique.sql`: thay ràng buộc thành
`UNIQUE(tenant_id, role_id, resource)` (khớp đúng tính per-tenant của bảng).

## Kiểm chứng (developer-run, PostgreSQL thật)

| Bước | Trước | Sau |
| :--- | :--- | :--- |
| `PUT /iam/roles/{TENANT_ADMIN}/data-policies` (ALL) | 500 | **200**, `updated_count=1` |
| `GET /iam/me/data-scopes` | all `NONE` | all `ALL` |
| `POST /api/v1/core/sample-records` | 403 `IAM_PERMISSION_DENIED_DATA_SCOPE` | **201** `CORE_SAMPLE_RECORD_CREATED` |
| `GET /api/v1/core/sample-records` | `total_items=0` | `total_items=1` |

## Việc còn lại (đã xử lý — rủi ro dữ liệu cũ)

- **Rủi ro nghiêm trọng (chủ dự án nêu)**: tenant/tài khoản cũ không có `role_data_policies`
  → engine deny-by-default (`NONE`) → mọi thao tác `IAM_PERMISSION_DENIED_DATA_SCOPE`; và mỗi lần
  nâng cấp schema/quyền có thể lại làm hỏng dữ liệu cũ.
- **Đã xử lý**: `RoleDataPolicyProvisioningService` + `RoleDataPolicyBackfillJob`
  - Chạy **idempotent lúc khởi động** cho mọi tenant hiện hữu; và khi **tạo tenant mới**.
  - Seed scope `ALL` cho `TENANT_OWNER` (BR-RBAC-01) và `TENANT_ADMIN`.
  - **Heal** policy "deny toàn bộ" (cả 6 scope `NONE`) — dấu hiệu default hỏng — mà **không**
    ghi đè cấu hình admin đặt có chủ đích.
  - Không chặn khởi động nếu lỗi (chỉ log).
- **Kiểm chứng**: restart backend → log `Role data-policy defaults ensured for 3 tenant(s)`;
  `role_data_policies` từ 3 → 7 row; `TENANT_ADMIN` của tenant cũ `minhvv` chuyển `NONE` → `ALL`.
- **Chuẩn hoá phòng ngừa**: mọi thay đổi schema/quyền phải kèm backfill idempotent + chạy thử
  migration trên DB có dữ liệu cũ (không chỉ DB sạch).

## Việc còn lại (đề xuất)

- Thêm test hồi quy: 2 tenant cùng lưu policy cho một global role phải thành công độc lập.
- Thêm test "dữ liệu bẩn": tenant cũ không có policy → sau backfill thao tác được.
- **UX**: khi vai trò có quyền chức năng nhưng data scope `NONE`, UI nên cảnh báo rõ thay vì để
  người dùng tưởng đã cấu hình xong (tab "Data Scopes" tách rời tab quyền chức năng).
