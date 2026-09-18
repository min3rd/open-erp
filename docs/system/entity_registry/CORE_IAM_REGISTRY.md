# [REG-01] Sổ Đăng Ký Entity Core IAM

- **Plugin ID**: `core-iam`
- **Storage**: `postgres`
- **Cơ chế đăng ký**: `@RegisterEntity` + `EntityRegistryService` (quét Jandex index khi khởi động), migration `V1.0.2__entity_registry.sql`.
- **Tài liệu nền tảng**: [README.md](README.md), `docs/system/architecture/SYSTEM_BLUEPRINT.md` mục 5.1.

---

## 1. Danh Sách Entity Đã Đăng Ký

| Entity | Bảng | Public Fields | Quan Hệ Chính |
| :--- | :--- | :--- | :--- |
| `User` | `users` | `id`, `email`, `status`, `email_verified_at`, `created_at` | 1-1 `UserCredential`, 1-1 `UserTwoFactor`, 1-1 `UserProfile`; 1-N `PasswordResetToken`; N-N `Tenant` qua `UserTenant` |
| `Tenant` | `tenants` | `id`, `slug`, `name`, `type`, `status` | N-N `User` qua `UserTenant` |
| `UserTenant` | `user_tenants` | `user_id`, `tenant_id`, `role`, `is_default`, `joined_at` | N-1 `User`; N-1 `Tenant` |
| `UserCredential` | `user_credentials` | `user_id`, `failed_login_count`, `locked_until`, `password_updated_at` | 1-1 `User` |
| `UserTwoFactor` | `user_two_factor` | `user_id`, `is_enabled`, `enabled_at` | 1-1 `User` |
| `UserProfile` | `user_profiles` | `user_id`, `full_name`, `phone`, `avatar_url`, `language`, `timezone` | 1-1 `User` |
| `PasswordResetToken` | `password_reset_tokens` | `id`, `user_id`, `expires_at`, `used_at`, `created_at` | N-1 `User` |

---

## 2. Ghi Chú An Toàn Tham Chiếu

- Plugin khác **chỉ được tham chiếu** các trường nằm trong cột `Public Fields`; các trường nhạy cảm (`password_hash`, `secret_key_enc`, `temp_secret_key`, `backup_codes_hash`, `token_hash`) không được xuất ra ngoài.
- Quan hệ liệt kê tại cột "Quan Hệ Chính" tương ứng `relations` trong annotation; dùng để kiểm tra ràng buộc khi plugin ngoài muốn join dữ liệu.
- Mọi entity IAM mới phát sinh trong tương lai bắt buộc bổ sung `@RegisterEntity` và cập nhật bảng trên trước khi được sử dụng.
