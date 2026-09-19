# [TASK-285] Seed Fixtures Kiểm Thử Cho Data Permission Engine

- **Mã Công Việc**: TASK-285
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-17](FEAT-17_core_reference_entity.md); hiện test plan chưa có dữ liệu mẫu chạy được trên entity thật ([BUG-63](BUG-63_test_plan_gaps.md)).
- Mục tiêu: bộ fixture chuẩn hóa cho `core_sample_records` phục vụ test cross-scope.
- Tài liệu thiết kế: [TEST-02](../08_testing/test_plan.md) §2.1 (ma trận fixtures bắt buộc).

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Seed 2 tenant (Alpha/Beta), 2 chi nhánh (HN/HCM), cây phòng ban (KD → B2B/RETAIL) và 7 user theo test plan §2.1.
- [ ] Gán role/data policy đủ 7 scopes; thiết lập quan hệ quản lý trực tiếp (User 2 quản lý User 3/4).
- [ ] Tạo `core_sample_records` cho từng user/phòng ban/chi nhánh/tenant với `created_by`, `assignee_id` hợp lệ.
- [ ] Cô lập fixture khỏi dữ liệu dev: chạy trên `openerp_test`, idempotent, dọn dẹp sau test.
- [ ] Tài liệu fixture ngắn trong `08_testing/` (khi QA cập nhật test plan).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Fixture tái sử dụng được cho toàn bộ test suite; không phụ thuộc H2.
- [ ] Seed idempotent trên `openerp_test`, không ảnh hưởng DB dev.
- [ ] `mvn test` pass 100%.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA xác nhận dữ liệu fixture đủ cho các ca cross-scope.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Bộ fixture dùng chung `S2EngineFixtures`/`S2IamFixtures` + `TestDbCleanup` (FK-safe) tạo 2 tenant, chi nhánh, cây phòng ban, user/role/data policy đủ 7 scope và sample records.
- Seed idempotent, chỉ chạy trên `openerp_test`; không dùng H2/mock DB.
- Là nền tảng dữ liệu cho toàn bộ test cross-scope của Wave 2 (full suite 157/157 PASS).
