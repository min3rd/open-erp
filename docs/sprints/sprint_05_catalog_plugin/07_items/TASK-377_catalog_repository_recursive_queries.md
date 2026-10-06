# [TASK-377] Repository + truy vấn đệ quy (tổ tiên/con cháu/kiểm tra chu trình)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-377 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-375 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/repository/*` |

## 1. Mục tiêu

Cung cấp truy vấn nền cho DAG: con cháu theo độ sâu, tổ tiên, phát hiện chu trình, options phân trang gộp tenant + hệ thống.

## 2. Các thao tác

- [ ] Recursive CTE con cháu (as-of, giới hạn depth) — DES-DB T4.1
- [ ] CTE tổ tiên + `wouldCycle(parent, child)` — DES-DB T4.2
- [ ] Query options `DISTINCT ON (code)` tenant thắng — DES-DB T4.3
- [ ] Test repository trên PostgreSQL thật với dữ liệu mẫu ≥1k mục

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-01, AC-02, AC-03, AC-10**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) và thiết kế đã review. Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
