# [TASK-377] Repository + truy vấn đệ quy (tổ tiên/con cháu/kiểm tra chu trình)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-377 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `fde4f03`; QA: TR-S05-001** |
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
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: 4 repository với recursive CTE (descendants/ancestors), `wouldCreateCycle` (guard độ sâu 1000) và truy vấn options gộp hệ thống + tenant (`DISTINCT ON (code)` tenant thắng, `as_of`, `q`, phân trang + count) — `CatalogRepositoryPostgresTest` PASS trên PostgreSQL thật. Trạng thái: **code xong, test PASS — chờ commit**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
