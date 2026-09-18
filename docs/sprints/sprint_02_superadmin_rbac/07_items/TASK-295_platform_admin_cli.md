# [TASK-295] Platform Admin CLI (Offline Command Mode + Remote Script)

- **Mã Công Việc**: TASK-295
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-73](BUG-73_superadmin_lifecycle_cli_missing.md); hiện thực [FEAT-18](FEAT-18_superadmin_account_lifecycle_and_cli.md) AC6.
- Mục tiêu: cung cấp 2 chế độ CLI quản trị nền tảng — Offline CLI trên server (khẩn cấp, không phụ thuộc HTTP API) và Remote CLI gọi Platform API.
- Tài liệu thiết kế: [SOL-01 §1.2.6](../05_solutions/SOL-01_superadmin_architecture_and_security.md); [DES-API §3.12](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md).

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] **Offline CLI** (Quarkus command mode/picocli):
  - `java -jar quarkus-run.jar admin-cli <command>` hoặc `mvn quarkus:dev -Dquarkus.args="admin-cli ..."`.
  - Yêu cầu biến môi trường `OPENERP_ADMIN_BOOTSTRAP_SECRET` (đối chiếu constant-time) + truy cập trực tiếp DB/Redis.
  - Subcommands: `bootstrap`, `list`, `grant`, `revoke`, `disable`, `enable`, `reset-password`, `disable-2fa`, `revoke-sessions`, `verify-audit-chain`.
  - **Không nhận mật khẩu qua CLI arg** (tránh lộ process list/shell history) — chỉ prompt ẩn hoặc biến môi trường.
  - Dùng khi mất toàn bộ SUPER_ADMIN active, sự cố hạ tầng API, hoặc cần verify audit chain.
- [ ] **Remote CLI**: `scripts/platform/platform-admin-cli.bat` (Windows) + `scripts/platform/platform-admin-cli.sh` (Linux/macOS):
  - Gọi Platform API qua HTTPS bằng tài khoản admin + mã TOTP (hoặc service token ngắn hạn), kèm IP allowlist.
  - Không bypass guard nghiệp vụ (self-disable/last-admin áp dụng nguyên vẹn).
- [ ] Audit mọi thao tác CLI: `actor_type = 'CLI'`, `correlation_id`, `ip_address` (offline ghi `local-console`), fail-closed.
- [ ] Cập nhật `docs/07_deployment_guides/`: cấu hình secret, quy trình khẩn cấp, ví dụ lệnh, cảnh báo bảo mật.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Offline CLI chạy được trên môi trường dev (`make infra`) và idempotent với `bootstrap`.
- [ ] Remote CLI hoạt động qua HTTPS, không lưu token/mật khẩu trong file script.
- [ ] Không lộ secret/mật khẩu trong log, arg hoặc thông báo lỗi.
- [ ] Tài liệu deployment cập nhật đầy đủ (local/staging/production).

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử cả 2 chế độ.
- [ ] QA xác minh audit `actor_type = CLI` và không nhận mật khẩu qua arg (TC-BE-32).
- [ ] Không phát sinh regression.
