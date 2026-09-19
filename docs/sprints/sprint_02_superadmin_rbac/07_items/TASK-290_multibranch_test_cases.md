# [TASK-290] Fixtures & Test Cases Multi-Branch Manager (Union Scope, Primary Branch, Cache)

- **Mã Công Việc**: TASK-290
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent (phối hợp QA/QC Agent)
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-15](FEAT-15_multi_scope_data_access_control.md); bằng chứng khắc phục [BUG-71](BUG-71_multibranch_manager_design_gap.md).
- Mục tiêu: bổ sung fixtures và ca kiểm thử cho mô hình Quản lý đa chi nhánh.
- Tài liệu thiết kế: [TEST-02](../08_testing/test_plan.md) §2.1, §2.2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Fixture **User 8**: Giám đốc vùng, role `REGIONAL_MANAGER`, `read_scope = BRANCH`, `managed_branch_ids = [BR-HN, BR-HCM]`, `primary_branch = BR-HN` (không thuộc BR-DN).
- [ ] Fixture **User 9**: Nhân viên BR-DN, dùng làm đối chứng ngoài phạm vi quản lý.
- [ ] Hiện thực `TC-BE-21` (union scope BRANCH), `TC-BE-22` (CREATE mặc định primary + chặn branch ngoài effective), `TC-BE-23` (cache invalidation khi xóa phân công).
- [ ] Chạy trên `openerp_test` + migration V2.x với PostgreSQL & Redis thật (không H2).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] TC-BE-21 → 23 pass 100%, không rò rỉ dữ liệu BR-DN cho User 8.
- [ ] Cache invalidation có hiệu lực ngay ở request kế tiếp.
- [ ] Kết quả ghi lại làm bằng chứng nghiệm thu DoD "0 rò rỉ dữ liệu".

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất fixtures + tests và tự chạy.
- [ ] QA review và tự chạy lại bộ test.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Fixture User 8 (REGIONAL_MANAGER, managed `[BR-HN, BR-HCM]`) + User 9 (BR-DN đối chứng) cùng ca TC-BE-21→23 trong `BranchAssignmentApiTest`.
- Xác nhận union scope BRANCH, CREATE mặc định primary + chặn branch ngoài effective, cache invalidation tức thì; không rò rỉ dữ liệu BR-DN.
- Chạy trên `openerp_test` + Flyway V2 với PostgreSQL & Redis thật (không H2).
