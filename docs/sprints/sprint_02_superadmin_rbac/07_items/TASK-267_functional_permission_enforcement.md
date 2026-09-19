# [TASK-267] Enforce Quyền Chức Năng Bằng Annotation & Request Filter

- **Mã Công Việc**: TASK-267
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-51](BUG-51_missing_functional_permission_enforcement.md) — hệ thống mới chỉ lưu cấu hình permission mà không enforce khi gọi API core.
- Mục tiêu: mọi endpoint core phải kiểm tra quyền `domain:resource:action` dựa trên `UserSecurityContext.functional_permissions`.
- Tài liệu thiết kế: [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §3; [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §4.1; [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) §2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Khai báo annotation `@RequirePermission("domain:resource:action")` (RUNTIME, dùng cho METHOD/TYPE).
- [ ] Hiện thực `PermissionEnforcementFilter implements ContainerRequestFilter`: đọc annotation, so khớp `functional_permissions`, ném 403 code `IAM_PERMISSION_DENIED_FUNCTIONAL` (khuôn mẫu 4).
- [ ] Áp dụng annotation cho toàn bộ endpoint core IAM/Organization/Role/Permission thay vì kiểm tra thủ công.
- [ ] Xử lý ngoại lệ: token platform/impersonation có quy tắc rõ ràng (ghi log, không bypass ngầm).
- [ ] Viết integration test JUnit 5 + RestAssured trên PostgreSQL & Redis thật (cấm H2).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Endpoint thiếu quyền trả `403 IAM_PERMISSION_DENIED_FUNCTIONAL`, đủ quyền hoạt động bình thường.
- [ ] Không có endpoint core nào bỏ sót annotation (có test liệt kê).
- [ ] `mvn test` pass 100%; không lỗi lint/build.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA re-test bằng token thiếu/đủ quyền trên môi trường thật.
- [ ] Không phát sinh regression.

## Ghi Chú Tiến Độ (2026-09-18)
- Wave 2 hoàn tất annotation `@RequirePermission` + `PermissionEnforcementFilter` (403 `IAM_PERMISSION_DENIED_FUNCTIONAL`, audit DENIED, platform token bypass có log) + catalog quyền seed `TASK-268`.
- **Giữ `In Progress`**: chưa retrofit annotation cho API legacy Sprint 01 và API org/iam mới (hiện default-allow); **retrofit enforcement toàn bộ endpoint chuyển Wave 3**.
- Test hiện có: `PermissionFilterTest` trên PostgreSQL & Redis thật.

## Ghi Chú Hoàn Thành (2026-09-18)
- Wave 3 retrofit hoàn tất: toàn bộ endpoint IAM/Organization (và API legacy Sprint 01) đã gắn `@RequirePermission` tương ứng; giữ default-allow có chủ đích duy nhất cho self-profile (`GET/PUT /account/profile`).
- `PermissionRetrofitApiTest` kiểm chứng không còn endpoint core nào bỏ sót annotation; `AuditWiringTest` xác nhận audit DENIED/allowed được ghi; `PermissionFilterTest` chạy PostgreSQL + Redis thật.
- Full `mvn test` **178/178 PASS**; không phát sinh regression.
