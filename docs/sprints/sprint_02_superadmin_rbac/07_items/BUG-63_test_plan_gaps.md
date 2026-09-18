# [BUG-63] Kế Hoạch Kiểm Thử Thiếu Ca & Dùng Sai Thực Thể Không Tồn Tại

- **Mã Lỗi**: BUG-63
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Test plan thiếu nhiều nhóm ca kiểm thử trọng yếu và dùng thực thể "đơn hàng"/`customers` không thuộc Core Sprint 02; không nêu DB test riêng `openerp_test` cũng như migration Flyway V2.

- **Môi trường**: Backend Quarkus + PostgreSQL/Redis (Local)
- **Bằng chứng (file:line)**:
  - `../08_testing/test_plan.md:49-53` — TC-BE-07→11 dùng "đơn hàng" và `POST /api/v1/customers/export` không tồn tại.
  - `../08_testing/test_plan.md:41-55` — thiếu TC: audit anti-tamper (UPDATE/DELETE log), quota vượt hạn mức, tenant EXPIRED, break-glass, functional permission deny, department tree cycle, membership removal.
  - `../08_testing/test_plan.md` — không nêu database `openerp_test` (BUG-38 Sprint 1) và migration Flyway V2 cần chạy.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:113-123` — trigger chống sửa audit log chưa có ca test tương ứng.
- **Tài Liệu Đối Chiếu**: CONF-01 mục 4 (DoD test); `AGENTS.md` (Cấm H2, DB `openerp_test`).

## 2. Tác Động
- QA không đủ bằng chứng chứng minh DoD "0 bug Critical/High"; các cơ chế bảo mật quan trọng không được kiểm chứng.

## 3. Kết Quả Kỳ Vọng
- Bổ sung đầy đủ ca test theo tính năng (audit, quota, EXPIRED, break-glass, functional deny, cycle, membership).
- Ghi rõ chạy trên `openerp_test` + Flyway V2; thực thể test dùng `core_sample_records` (FEAT-17).

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] Test plan được cập nhật đầy đủ ca + môi trường DB test.
- [x] Test suite chạy 100% pass trên PostgreSQL/Redis thật.
- [x] QA xác nhận bằng chứng kiểm thử được lưu.

- **Ghi chú QA (2026-09-18)**: test_plan đã bổ sung `openerp_test` + Flyway V2 + TC-BE-13→20; hoàn tất.
