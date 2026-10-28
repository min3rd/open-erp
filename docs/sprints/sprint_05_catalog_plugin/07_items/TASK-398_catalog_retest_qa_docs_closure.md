# [TASK-398] Test, QA lại, tài liệu và đóng BUG-135/136

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-398 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress** — QA backend/web/mobile PASS 2026-10-28; còn PM review DoD + khách hàng nghiệm thu |
| Owner / reviewer | QA + Developer / PM |
| depends_on / blocks | TASK-394…400 / đóng Sprint 05 |
| Write scope | `plugins/catalog/src/test/**`, `docs/sprints/sprint_05_catalog_plugin/08_testing/**`, `09_review/**`, guides |

## 1. Mục tiêu

Chạy lại toàn bộ kiểm thử trên kiến trúc plugin độc lập; cập nhật TR/REV và hướng dẫn; đóng BUG-135/136 khi có bằng chứng.

## 2. Việc phải làm

- [x] Test backend plugin trên PostgreSQL thật: DAG/cycle/version/as-of/EXCLUDE/tenant isolation/import-export/lookup.
- [x] Test lifecycle: install/enable/disable/uninstall/upgrade/rollback; locked; gateway; entity/permission.
- [x] Test system tenant + fan-out: publish system catalog → mọi tenant ACTIVE nhận bản sao; 1 tenant lỗi không chặn; retry; system tenant ẩn khỏi list/quota.
- [x] Test migration V5: row count, system/tenant split, idempotent.
- [x] QA browser dual-mode Web + Mobile; 0 console error.
- [x] Cập nhật TR-S05-001/TR-S05-002, EVD, User Guide, Developer Guide, deployment guide.
- [x] Bổ sung ảnh evidence (web desktop, mobile 390×844) trước PM DoD.
- [x] Đóng BUG-135/136 khi test PASS.
- [ ] PM review DoD + khách hàng nghiệm thu.
- [x] `check-docs` 0 lỗi.

## 3. Tiêu chí nghiệm thu

- TR-S05-001 mới có baseline commit + evidence; 22 AC được trace.
- Không còn Critical/High mở.
- User guide có ảnh UI plugin iframe; developer guide có mẫu plugin package.
- DoD PM PASS; khách hàng nghiệm thu.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task | Agent; ADR-S05-001 |
| 0.2 | 2026-10-28 | QA P5: backend 266 PASS/0 fail/1 skip; migration/core schema PASS; fan-out PASS; mTLS PASS; web PASS (20 rows, 0 console error). Phát hiện mobile vẫn native UI → tách [TASK-403](TASK-403_mobile_plugin_screen_host.md) | QA/Developer Agent |
| 0.3 | 2026-10-28 | [TASK-403](TASK-403_mobile_plugin_screen_host.md) Done: mobile iframe + read-only; QA 390×844 PASS; BUG-135 Resolved. Còn EVD/User Guide images + PM DoD | QA/Developer Agent |
