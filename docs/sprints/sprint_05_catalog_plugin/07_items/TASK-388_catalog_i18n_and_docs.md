# [TASK-388] i18n 13 locale + User Guide + Developer Guide cho plugin danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-388 / Task / Sprint 05 |
| Severity / trạng thái | Medium / **Done (dev) — i18n 100% (web 1152, mobile 543) + UG-S05-001 (10 ảnh); còn 3 ảnh QA** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-385, TASK-386 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `web/public/i18n/*.json`, `mobile/public/i18n/*.json`, `docs/06_user_guides/`, `docs/08_developer_guides/` |

## 1. Mục tiêu

Không hardcode nhãn; tài liệu sử dụng và hướng dẫn mở rộng loại danh mục.

## 2. Các thao tác

- [ ] Thêm key mới cho **cả 13 locale** (web) và tập con (mobile); `npm run i18n:check:strict` PASS
- [ ] User Guide Sprint 05 kèm ảnh (quản trị loại/bản ghi/quan hệ/quyền; picker trong form)
- [ ] Developer Guide: thêm loại danh mục mới, dùng `catalog-picker`, quy tắc version/as-of

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-10, AC-12 (phần nhãn)**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
