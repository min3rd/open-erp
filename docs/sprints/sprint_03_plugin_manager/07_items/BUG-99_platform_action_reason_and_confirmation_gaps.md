# BUG-99: Hardcode lý do thao tác platform + chưa đối chiếu số tenant bị ảnh hưởng + S2 target_version sai nguồn

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-99 |
| **Mức độ** | Low |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (2026-10-04 — chờ QA/Reviewer xác nhận) |
| **Liên quan** | DES-03-API P6/P26/S2, TASK-315, TASK-312 |

## Fix (2026-10-04)

1. **Reason do người dùng nhập**: `platform-plugin-list` thêm Drawer `version-action` (route mode
   `version-action?action=&version=`) với ô `reason` bắt buộc cho PUBLISH/DEPRECATE/BLOCK/UNBLOCK version
   và UNBLOCK_CATALOG; bỏ hardcode `'platform portal'`.
2. **Đối chiếu `confirmations.affected_tenants`**: `PluginAdminService.blockCatalog` so khớp số ledger
   ACTIVE thực tế khi `force_uninstall=true`; lệch → `PLUGIN_BLOCK_CONFIRMATION_REQUIRED`.
3. **S2 `target_version`**: `PluginOperationResource` trả `ledger.targetVersion` khi thao tác đang chạy
   (INSTALLING/UPGRADING), fallback `installedVersion`.

Coverage: `PlatformPluginGovernanceApiTest` thêm case mismatch (400) + khớp (200) PASS; Web build PASS.
Bằng chứng: `08_testing/evidence/BUG-109_116_fix_verification_2026-10-04.txt`.

## Mô tả (3 điểm nhỏ)

1. **Reason hardcode**: UI platform gọi P6 (`PUBLISH/DEPRECATE/BLOCK`) và P26 (unblock version) với lý do cố định `"platform portal"`; DES yêu cầu `{action, reason}` do người dùng nhập để audit có ý nghĩa.
2. **Chưa đối chiếu `confirmations.affected_tenants`**: server chỉ kiểm tra `confirm_text == plugin_key` (BUG-93), chưa so khớp số tenant bị ảnh hưởng client gửi với số thực tế.
3. **S2 `target_version` sai nguồn**: `PluginOperationResource.status` gán `status.targetVersion = ledger.installedVersion` thay vì phiên bản đích của thao tác đang chạy.

## Workaround

Không ảnh hưởng chức năng (reason vẫn được ghi audit; confirm_text đã là cổng xác nhận chính; UI không dùng `target_version` để ra quyết định).

## Hướng xử lý đề xuất (Sprint 04)

1. Thêm ô nhập `reason` (bắt buộc) trong Drawer hành động version / mở khóa.
2. Server: khi scope `CATALOG` và `force_uninstall=true`, so khớp `affected_tenants` với số ledger đang hoạt động, lệch → `PLUGIN_BLOCK_CONFIRMATION_REQUIRED`.
3. S2: trả `target_version` từ `plugin_operation_logs.detail.target_version` hoặc `tenant_plugins.target_version` khi operation đang chạy.
