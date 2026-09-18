# [TASK-291] AuditLogService Same-Transaction, Hash Chain SHA-256 & Job Xác Minh Chuỗi

- **Mã Công Việc**: TASK-291
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-72](BUG-72_audit_log_storage_design_gap.md); thuộc [FEAT-12](FEAT-12_superadmin_system_health_and_audit.md).
- Mục tiêu: hiện thực write path audit **cùng transaction** (fail-closed) và **hash chain SHA-256** tamper-evident.
- Tài liệu thiết kế: [SOL-01](../05_solutions/SOL-01_superadmin_architecture_and_security.md) §3.2–3.3; [DES-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.4.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Migration mở rộng `platform_audit_logs`: `event_id`, `scope`, `tenant_id`, `actor_type`, `actor_email_snapshot`, `resource_type`, `resource_id`, `result`, `correlation_id`, `prev_hash`, `entry_hash` (DES-DB §2.4).
- [ ] `AuditLogService.record()`: propagation `REQUIRED`, chỉ INSERT; lấy `pg_advisory_xact_lock` + tính `entry_hash = SHA-256(canonical(...))` theo thứ tự `(created_at, id)`.
- [ ] Fail-closed cho hành động nhạy cảm: lỗi audit → rollback toàn bộ nghiệp vụ (không catch nuốt lỗi).
- [ ] Job `AuditChainVerifier` định kỳ: phát hiện đứt chuỗi/hash lệch, cảnh báo `CRITICAL` + metric, không tự sửa dữ liệu.
- [ ] Enum `AuditAction`, `AuditScope`, `AuditResult`, `ActorType` đồng bộ Java ↔ TypeScript `@shared/enums`; payload dùng `ResponseKey`.
- [ ] Test trên PostgreSQL & Redis thật (không H2) theo TC-BE-24, TC-BE-25, TC-BE-27.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Mọi hành động trong coverage matrix (SOL-01 §3.6) sinh bản ghi audit đầy đủ hash.
- [ ] Job xác minh phát hiện đúng bản ghi bị sửa trực tiếp bằng SQL superuser.
- [ ] Lỗi audit làm rollback nghiệp vụ (test fail-closed pass).
- [ ] TC-BE-24, TC-BE-25, TC-BE-27 pass.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự chạy test.
- [ ] QA review và tự chạy lại bộ test.
- [ ] Không phát sinh regression.
