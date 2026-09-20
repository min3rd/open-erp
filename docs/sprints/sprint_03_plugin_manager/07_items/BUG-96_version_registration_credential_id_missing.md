# BUG-96: `credential_id` không được nhận/lưu khi đăng ký phiên bản (P5/T15)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-96 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | DES-03-API mục 3.1 (P5/T15), TASK-331, TASK-336, TASK-315/317 |

## Mô tả

DES-03-API mục 3.1 quy định body P5/T15 có `credential_id` (`uuid|null`) để đăng ký phiên bản từ Docker Hub/Registry riêng có xác thực. Implementation **không có field này** trong `PluginRequests.RegisterVersion`, không lưu vào `plugin_versions.distribution`, và UI không có bước chọn credential như DES-03-UI mục 3.3 (Bước 2).

Hệ quả: 3 kênh đăng ký chưa dùng được credential đã quản lý (TASK-336) → registry riêng cần xác thực không thể hoàn tất luồng; TASK-331 (pull manifest/token auth) vẫn dở dang.

## Cách tái hiện

1. Tạo credential platform (`/platform/plugin-credentials`).
2. Đăng ký phiên bản `IMAGE_REGISTRY` — không có chỗ nhập/chọn credential; request body không có `credential_id`.

## Hướng sửa (đã thực hiện)

- `PluginRequests.RegisterVersion`/`TenantRegister` thêm `credential_id`; `PluginResponseKey.Json.CREDENTIAL_ID`.
- `PluginAdminService`:
  - `validateCredentialReference(credentialId, tenantId)`: 400 khi sai UUID, 404 khi không tồn tại, 403 khi tenant dùng credential của tenant khác (platform được dùng credential PLATFORM).
  - Lưu `credential_id` vào `distribution` JSON của phiên bản.
- UI: 2 Drawer đăng ký (platform `/platform/plugins`, tenant `/settings/plugins`) thêm select credential (ẩn với kênh JAR_BUNDLE).
- Test `PluginArtifactVerifierTest.testCredentialReferenceValidation` PASS (hợp lệ/404/400).

## Tồn dư (theo dõi tại TASK-331)

- Credential hiện **được lưu và tham chiếu** nhưng chưa được dùng để pull manifest/digest từ registry (token auth OCI) — vẫn nằm trong TASK-331 (In Progress) và ghi rõ tại Sprint Review.
