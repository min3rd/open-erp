# [TASK-354] Upload ảnh đại diện (thay cho nhập URL)

| Trường | Giá trị |
| :--- | :--- |
| **Mã** | TASK-354 |
| **Loại** | Feature |
| **Mức độ** | Medium |
| **Phát hiện bởi** | Chủ dự án (báo cáo trực tiếp) |
| **Ngày** | 2026-10-05 |
| **Trạng thái** | Done (QA-03 verified 2026-10-05) |
| **Liên quan** | FEAT-10 (account/profile), `UserProfile.avatarUrl`, AGENTS.md (storage), `ObjectStorage` |

## Vấn đề

Form Hồ sơ cá nhân dùng ô **"URL ảnh đại diện"** (nhập chuỗi URL thủ công) — UX kém,
người dùng thường không có URL sẵn.

## Kết quả kỳ vọng

- Chọn ảnh từ máy (file picker) + xem trước (preview) + tải lên.
- Backend: endpoint upload multipart, kiểm tra loại ảnh (image/*) + kích thước,
  lưu trữ, và trả URL ảnh để hiển thị; endpoint phục vụ ảnh.
- Giữ tương thích: `user_profiles.avatar_url` vẫn là nguồn hiển thị.

## Ghi chú thiết kế

- Ảnh đại diện thuộc **Core (IAM)**, không phụ thuộc module plugin.
- **Kiến trúc lưu trữ (theo chỉ đạo chủ dự án)**: tách thành
  - `core.storage.ObjectStorage` — **primitive chung bucket-aware** (`put(bucket, key, ...)`,
    `get(bucket, key)`), impl `LocalObjectStorage` (dev) / `MinioObjectStorage` (MinIO qua
    `openerp.storage.provider`).
  - **Consumer tách riêng**: plugin artifact dùng `PluginArtifactStorage` (bucket
    `plugin-artifacts`, key `plugins/<uuid>/<name>`); file tenant dùng `TenantFileStorage`
    (bucket `tenant-files`, key `<tenantId>/<category>/<uuid>/<name>`).
  - Avatar đi qua `TenantFileStorage` → **cách ly theo tenant** trong bucket `tenant-files`.
- Endpoint upload công khai khi phục vụ ảnh (thẻ `<img>` không gửi được header Authorization);
  ref chứa UUID ngẫu nhiên nên khó đoán.
- Validate ở trust boundary: đuôi file (PNG/JPEG/WEBP/GIF) + dung lượng (`avatar-max-bytes`).
  *Ghi chú*: chưa kiểm magic bytes; thêm nếu nhận upload từ nguồn không tin cậy.

## Kiểm chứng

- `POST /api/v1/account/avatar` → `200 ACCOUNT_AVATAR_UPLOAD_SUCCESS`; ref
  `tenant-files/<tenantId>/avatars/…`; `GET` ảnh `200 image/png`.
- File không phải ảnh → `400 ACCOUNT_AVATAR_INVALID_TYPE`.
- `avatar_url` lưu vào `user_profiles`; form hiển thị preview.
- `mvn test` (plugin artifact + account) **22/22 PASS** trên PostgreSQL thật.
