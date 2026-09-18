# [TASK-284] API `/api/v1/core/sample-records` & Wiring Data Permission Engine

- **Mã Công Việc**: TASK-284
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-17](FEAT-17_core_reference_entity.md) — cần API thật để engine chứng minh 7 scopes × 6 operations.
- Mục tiêu: list phân trang + CRUD + export với enforcement tự động.
- Tài liệu thiết kế: [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §2/§4; [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) (khuôn mẫu response).

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] `GET /api/v1/core/sample-records` — list phân trang (khuôn mẫu 2) qua engine lọc theo `read_scope`.
- [ ] `POST/PUT/DELETE /api/v1/core/sample-records` — mutate qua `engine.canMutate()` với `create/update/delete_scope`.
- [ ] `POST /api/v1/core/sample-records/export` — chặn `NONE` với `IAM_PERMISSION_DENIED_EXPORT`, ngược lại xuất theo `export_scope`.
- [ ] Endpoint share theo `share_scope` (nếu engine yêu cầu) + ghi audit.
- [ ] Dùng `ResponseKey`/envelope chuẩn; áp `@RequirePermission("core:sample-record:*")` sau [TASK-267](TASK-267_functional_permission_enforcement.md).
- [ ] Integration test trên PostgreSQL & Redis thật.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 100% thao tác đi qua engine, không viết WHERE thủ công cho scope.
- [ ] Response đúng 4 khuôn mẫu; mã lỗi chuẩn hóa.
- [ ] `mvn test` pass 100%.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm thử hành vi từng scope trên API.
- [ ] Không phát sinh regression.
