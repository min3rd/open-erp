# [TASK-283] Bảng & Entity `core_sample_records` + Đăng Ký Entity Registry

- **Mã Công Việc**: TASK-283
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-17](FEAT-17_core_reference_entity.md), giải quyết [BUG-52](BUG-52_missing_reference_entity_for_data_scope.md).
- Mục tiêu: tạo thực thể tham chiếu Core đủ cột để engine phân quyền dữ liệu hoạt động.
- Tài liệu thiết kế: [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §4/§7; `docs/system/entity_registry/README.md`.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Migration tạo bảng `core_sample_records`: `id`, `tenant_id`, `branch_id`, `department_id`, `created_by`, `assignee_id`, `title`, `amount`, `status`, timestamps.
- [ ] Tạo composite indexes phục vụ scope: `(tenant_id, branch_id)`, `(tenant_id, department_id)`, `(tenant_id, created_by)`.
- [ ] Tạo JPA entity + repository (`findAccessible()` gắn engine), gắn `@RegisterEntity`.
- [ ] Đảm bảo mọi query đều bắt buộc `tenant_id` (tenant isolation).
- [ ] Test: migrate sạch trên `openerp_test`; registry có bản ghi entity mới.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bảng + entity + index sẵn sàng; registry cập nhật.
- [ ] Không có query nào thiếu `tenant_id` (rà soát + test).
- [ ] `mvn test` pass 100% trên PostgreSQL thật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm tra schema/index và registry.
- [ ] Không phát sinh regression.
