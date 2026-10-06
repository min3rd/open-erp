# [TASK-389] QA browser: Desktop 1440 + Mobile 390 (picker, DAG, version, quyền)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-389 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-385, TASK-386, TASK-387 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `docs/sprints/sprint_05_catalog_plugin/08_testing/**` + evidence |

## 1. Mục tiêu

Chạy TP-S05-001, ghi TR-S05-001 với số liệu và ảnh; 0 console error, overflow 0 ở 390px.

## 2. Các thao tác

- [ ] Desktop: tạo mục, thêm 2 cha, nhảy cấp, kiểm tra chu trình bị chặn, sửa ⇒ phiên bản mới, as-of
- [ ] Quyền: vai trò thiếu grant ⇒ chỉ đọc + lỗi đúng mã
- [ ] Mobile 390: picker + tra cứu, touch target ≥40px, không tràn ngang
- [ ] Backfill: tenant cũ có plugin + danh mục cố định sau migration

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **Toàn bộ AC (bằng chứng)**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
