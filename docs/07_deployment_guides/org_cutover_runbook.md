# Organization cutover runbook (Sprint 07)

Áp dụng cho `TASK-428` / `TASK-429`: chuyển dữ liệu tổ chức từ bảng Core cũ sang plugin `org-structure`, dựng lại projection và (tuỳ chọn) bỏ bảng cũ.

> `drop-legacy` là bước triển khai, **không** phải migration tự động. Chỉ chạy sau khi toàn bộ endpoint/màn hình Core cũ đã ngừng sử dụng và QA đã xác nhận.

## 1. Điều kiện

- PostgreSQL/Redis đang chạy (`npm run infra`).
- Plugin `org-structure` đã cài cho tenant (schema `tenant_<8-ký-tự>_org_structure`).
- Core đã chạy migration `V7.0.0__scope_projection.sql`.
- Tenant đang ở chế độ bảo trì (không phát sinh ghi vào bảng tổ chức cũ).

## 2. Kiểm tra trạng thái

```bash
node scripts/ops/org-cutover.mjs status --tenant <tenant-uuid>
```

Lệnh in số dòng legacy/plugin và số user trong `core_user_scope`. Nếu schema plugin chưa tồn tại, cài plugin trước.

## 3. Sao lưu

```bash
node scripts/ops/org-cutover.mjs backup --tenant <tenant-uuid> --out backups/org-cutover-<ngày>
```

Bản dump gồm 4 bảng legacy, 4 bảng plugin và 3 bảng projection. Giữ thư mục này đến khi QA ký nghiệm thu.

## 4. Copy + rebuild projection

```bash
node scripts/ops/org-cutover.mjs copy --tenant <tenant-uuid>
```

Lệnh chạy trong một transaction, khoá `ACCESS EXCLUSIVE` 4 bảng legacy, copy giữ nguyên UUID, dựng lại `core_user_scope`, `core_user_manager_edge`, `core_department_closure`, rồi tự chạy `verify`. Transaction rollback toàn bộ nếu bất kỳ bước nào lỗi.

Mapping:

| Legacy | Plugin |
| :--- | :--- |
| `branches` | `plg_organization_branches` |
| `departments` | `plg_organization_departments` |
| `user_department_memberships` | `plg_organization_memberships` |
| `user_branch_assignments` | `plg_organization_branch_access` |

## 5. Xác minh

```bash
node scripts/ops/org-cutover.mjs verify --tenant <tenant-uuid>
```

Điều kiện PASS: số dòng legacy = plugin, không thiếu UUID, số user có membership ACTIVE = số dòng `core_user_scope`, closure không rỗng khi còn phòng ban.

## 6. Bỏ bảng cũ (tuỳ chọn, sau QA)

```bash
node scripts/ops/org-cutover.mjs drop-legacy --tenant <tenant-uuid> --confirm DROP-LEGACY
```

**Chỉ chạy khi** Core không còn đọc/ghi 4 bảng legacy. Script luôn chạy `verify` trước khi drop.

## 7. Rollback

- Trước khi drop: dừng ứng dụng, `DROP`/`TRUNCATE` các bảng plugin vừa copy nếu cần, rồi restore dump legacy bằng `psql` (dump có `--clean --if-exists`).
- Sau khi drop: restore dump legacy, sau đó chạy lại `copy`.
- Projection luôn dựng lại được từ plugin tables; không cần backup riêng nếu plugin tables còn nguyên.

## 8. Việc còn lại trước khi drop

- Chuyển các màn hình `/settings/organization`, `/settings/members`, `/settings/branch-assignments` sang plugin screen `/settings/apps/org-structure`.
- Chuyển provisioning tenant mới, quota đếm member và các job đọc `user_department_memberships` sang plugin/projection.
- Chạy QA desktop + mobile và lưu evidence vào sprint 07.
