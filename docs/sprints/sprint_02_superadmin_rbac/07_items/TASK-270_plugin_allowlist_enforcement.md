# [TASK-270] Enforce Danh Sách Plugin Được Phép (`allowed_plugins`)

- **Mã Công Việc**: TASK-270
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục phần plugin trong [BUG-53](BUG-53_quota_not_enforced.md) — tenant có thể cài/bật plugin ngoài `allowed_plugins`.
- Mục tiêu: kiểm tra allowlist khi cài/bật plugin, trả lỗi chuẩn hóa.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.1; [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) §2.1 (`allowed_plugins`).

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Tạo service kiểm tra `plugin_code` thuộc `allowed_plugins` của tenant.
- [ ] Chặn thao tác cài/bật plugin ngoài danh sách với `403` code `PLATFORM_PLUGIN_NOT_ALLOWED`.
- [ ] Phối hợp Plugin Manager: nếu Plugin Manager chưa tồn tại trong Sprint 02, tạo điểm móc (interface/call-site) + ghi chú implementation note defer rõ ràng.
- [ ] Ghi audit log khi thao tác bị chặn.
- [ ] Viết unit test cho logic allowlist (PostgreSQL thật cho phần đọc quota).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Plugin ngoài allowlist bị chặn đúng mã lỗi.
- [ ] Có điểm móc rõ ràng cho Plugin Manager tương lai (hoặc implementation note nếu defer).
- [ ] `mvn test` pass 100%; API spec cập nhật mã lỗi.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA xác nhận hành vi chặn đúng đặc tả.
- [ ] Không phát sinh regression.
