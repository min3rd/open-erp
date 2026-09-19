# [BUG-51] Thiếu Cơ Chế Enforce Quyền Chức Năng `domain:resource:action` (Chỉ Mới Có Cấu Hình)

- **Mã Lỗi**: BUG-51
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Sprint 02 chỉ dừng ở việc lưu cấu hình role/permission (DB + UI + API CRUD), hoàn toàn không có annotation/interceptor enforce khi gọi endpoint nghiệp vụ; danh mục quyền core để seed cũng chưa được định nghĩa.

- **Môi trường**: Backend Quarkus (Local)
- **Bằng chứng (file:line)**:
  - `FEAT-14_functional_rbac_matrix.md:28-32` — sub-tasks TASK-241..245 chỉ gồm tạo bảng/CRUD/UI, không có hạng mục enforce.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:453-629` (§5) — chỉ đặc tả CRUD role/permission/data-policy, không mô tả kiểm tra quyền khi thực thi endpoint.
  - `../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md:117-128` — chỉ enforce theo Data Scope, không nhắc Functional Permission.
  - `FEAT-14_functional_rbac_matrix.md:28` — TASK-241 "nạp dữ liệu mẫu danh mục quyền chuẩn" nhưng chưa có danh sách quyền core nào được chốt.
- **Tài Liệu Đối Chiếu**: ANL-02 §2; SOL-02 §3 (`functional_permissions` trong UserSecurityContext).

## 2. Tác Động
- Người dùng không có quyền vẫn gọi được API core (user/role/branch/department); hệ thống RBAC mất giá trị thực thi.

## 3. Kết Quả Kỳ Vọng
- Có annotation `@RequirePermission("domain:resource:action")` + `PermissionEnforcementFilter` (Quarkus `ContainerRequestFilter`) trả `403` mã `IAM_PERMISSION_DENIED_FUNCTIONAL`.
- Có catalog quyền core chuẩn để seed (TASK-268) và áp dụng cho toàn bộ endpoint core.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã hiện thực annotation + filter (TASK-267).
- [ ] Catalog quyền core được seed idempotent (TASK-268).
- [ ] QA re-test: thiếu quyền → 403 `IAM_PERMISSION_DENIED_FUNCTIONAL`; đủ quyền → pass, có test PostgreSQL thật.

- **Ghi chú QA (2026-09-18)**: Đặc tả đã bổ sung (SOL-02 §6b `@RequirePermission` + catalog TASK-268); phần mã theo TASK-267/TASK-268, chờ thực thi.

## Ghi Chú Hoàn Thành (2026-09-18)
- Wave 3 retrofit `@RequirePermission` hoàn tất cho toàn bộ API IAM/Organization (và API core legacy Sprint 01) — không còn endpoint core nào default-allow, ngoại lệ duy nhất là `GET/PUT /account/profile` (self-profile, default-allow có chủ đích — xem TASK-267).
- Kiểm chứng: `PermissionRetrofitApiTest` (liệt kê endpoint bắt buộc annotation, không bỏ sót) + `PermissionFilterTest` (403 `IAM_PERMISSION_DENIED_FUNCTIONAL`, audit DENIED) + `AuditWiringTest`; full `mvn test` **178/178 PASS** (PostgreSQL + Redis thật, không H2).
- TASK-267 và TASK-268 đều `Done`; mã lỗi giữ nguyên theo DES-02-API §6.3.
