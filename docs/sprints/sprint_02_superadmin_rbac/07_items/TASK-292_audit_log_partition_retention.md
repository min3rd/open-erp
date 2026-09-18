# [TASK-292] Partition Theo Tháng, BRIN Index & Retention 24 Tháng Cho Audit Log

- **Mã Công Việc**: TASK-292
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-72](BUG-72_audit_log_storage_design_gap.md); thuộc [FEAT-12](FEAT-12_superadmin_system_health_and_audit.md).
- Mục tiêu: partition declarative RANGE theo tháng + default partition, BRIN index, retention policy 24 tháng hot.
- Tài liệu thiết kế: [SOL-01](../05_solutions/SOL-01_superadmin_architecture_and_security.md) §3.4, §3.7; [DES-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.4.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Chuyển `platform_audit_logs` sang `PARTITION BY RANGE (created_at)`, PK `(id, created_at)`, tạo partition tháng hiện tại + kế tiếp + `platform_audit_logs_default`.
- [ ] Tạo index BRIN `created_at`; B-tree `(scope, tenant_id, created_at DESC)`, `(actor_user_id, created_at DESC)`, `(action, created_at DESC)`; GIN `details jsonb_path_ops`.
- [ ] Job `AuditPartitionMaintainer`: tạo trước 3 tháng, idempotent, chạy định kỳ.
- [ ] Retention 24 tháng hot: đánh dấu bản ghi quá hạn thuộc diện archive (bàn giao TASK-293); không DELETE cứng.
- [ ] Hiện thực TC-BE-26 (routing partition + partition tương lai) trên PostgreSQL thật.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bản ghi mới nằm đúng partition tháng hiện tại, không rơi vào default partition.
- [ ] Partition tương lai 3 tháng luôn tồn tại sau mỗi lần chạy job.
- [ ] Truy vấn danh sách audit dùng được index (EXPLAIN không full scan toàn bảng).
- [ ] TC-BE-26 pass.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự chạy test.
- [ ] QA review và tự chạy lại bộ test.
- [ ] Không phát sinh regression.
