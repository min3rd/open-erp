# [BUG-71] Lỗ Hổng Thiết Kế Quản Lý Đa Chi Nhánh (BRANCH Scope Chỉ Bám Membership Đơn Lẻ)

- **Mã Lỗi**: BUG-71
- **Phân Loại**: Bug / Defect (Thiết kế)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Thiết kế RBAC Sprint 02 mâu thuẫn giữa các tài liệu và thiếu mô hình "Quản lý nhiều chi nhánh", khiến Giám đốc vùng không thể quản lý dữ liệu ngoài membership của mình.

- **Môi trường**: Tài liệu Sprint 02 (ANL-02 / SOL-02 / DES-02-* / TEST-02).
- **Bằng chứng (file:line)**:
  - `../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md:118` — BRANCH scope lọc `branch_id = :userBranchId` (một chi nhánh duy nhất).
  - `../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md:110` — compiler lại dùng `branch_id IN (:userBranchIds)` (nhiều chi nhánh) → mâu thuẫn nguồn scope.
  - Thiếu bảng phân công "quản lý chi nhánh" tách khỏi membership (quản lý cấp cao phụ trách nhiều chi nhánh mà không cần membership giả).
  - Không có ràng buộc `membership.branch_id` khớp `departments.branch_id` khi department có branch.
  - `departments.manager_user_id` không tham gia tính scope (trưởng bộ phận không được hưởng quyền theo bộ phận mình quản lý).
  - Không có khái niệm `primary_branch` theo user để làm chi nhánh mặc định khi tạo bản ghi (CREATE).
- **Tài Liệu Đối Chiếu**: ANL-02; SOL-02; DES-02-DB; DES-02-API; DES-02-UI; TEST-02.

## 2. Tác Động
- Quản lý cấp cao (Giám đốc vùng) bị bó hẹp dữ liệu trong 1 chi nhánh hoặc phải tạo membership giả sai cơ cấu tổ chức.
- Nguy cơ rò rỉ dữ liệu chéo chi nhánh nếu ràng buộc giữa membership và department không được enforce.
- Hành vi CREATE không xác định khi người dùng không truyền `branch_id`.

## 3. Kết Quả Kỳ Vọng
- BRANCH scope = union(`member_branch_ids`, `managed_branch_ids`) qua bảng `user_branch_assignments`; mỗi user tối đa 1 `primary_branch` dùng làm chi nhánh mặc định khi CREATE.
- `departments.manager_user_id` auto-sync membership (một nguồn scope thống nhất, BR-RBAC-11).
- Ràng buộc `membership.branch_id = departments.branch_id` khi department có branch; department xuyên chi nhánh cho phép `branch_id NULL`.
- Đồng bộ ANL-02 / SOL-02 / DES-02-DB / DES-02-API / DES-02-UI / TEST-02.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] Đã chốt thiết kế và cập nhật đồng bộ ANL-02, SOL-02, DES-DB, DES-API, DES-UI, test_plan.
- [x] Phần mã nguồn triển khai theo dõi qua TASK-287 → TASK-290.
- **Ghi chú QA (2026-09-18)**: Thiết kế đã được chốt và cập nhật vào toàn bộ tài liệu Sprint 02; các vi phạm sẽ được xử lý khi lập trình (TASK-287 → TASK-290). BUG-71 đóng ở mức tài liệu.
