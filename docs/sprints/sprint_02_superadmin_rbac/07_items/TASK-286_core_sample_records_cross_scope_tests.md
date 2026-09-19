# [TASK-286] Bộ Test Cross-Scope & Cross-Tenant Cho 7 Scopes × 6 Operations

- **Mã Công Việc**: TASK-286
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-17](FEAT-17_core_reference_entity.md); bộ test là bằng chứng DoD "0 rò rỉ dữ liệu" ([CONF-01](../04_confirmation/CONF-01_sprint_02_scope.md) mục 4).
- Mục tiêu: test suite chứng minh engine thực thi đúng mọi scope/thao tác trên `core_sample_records`.
- Tài liệu thiết kế: [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §4; [TEST-02](../08_testing/test_plan.md) §2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Test `READ` cho 7 scopes: ALL, BRANCH, DEPARTMENT_AND_CHILDREN, DEPARTMENT, OWN_AND_SUBORDINATES, OWN_ONLY, NONE (chú ý `assignee_id`).
- [ ] Test `CREATE/UPDATE/DELETE/EXPORT/SHARE` theo scope tương ứng, kể cả ca bị từ chối (`403` đúng code).
- [ ] Test cross-tenant: user Tenant Beta truy cập ID của Tenant Alpha → 404/403, không rò rỉ.
- [ ] Test cache invalidation: đổi role/department → request sau dùng quyền mới (Redis thật).
- [ ] Chạy trên `openerp_test` + Flyway V2, không dùng H2; ghi rõ cách chạy `mvn test`.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bộ test bao phủ đủ 7 scopes × 6 operations + cross-tenant.
- [ ] 100% pass trên PostgreSQL & Redis thật.
- [ ] Không có ca test giả/bỏ qua; log rõ ràng khi fail.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA review bộ test và tự chạy lại.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- `DataScopeEngineTest` + `SampleRecordApiTest` bao phủ 7 scope × 6 thao tác (READ/CREATE/UPDATE/DELETE/EXPORT/SHARE), kể cả ca từ chối 403 đúng mã và cross-tenant không rò rỉ.
- Cache invalidation kiểm chứng qua `PermissionInvalidationServiceTest` (Redis thật); subordinates qua CTE `direct_manager_user_id` + subtree trưởng phòng.
- Full `mvn test` **157/157 PASS** trên PostgreSQL + Redis thật; không có ca bị bỏ qua.
