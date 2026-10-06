# [TASK-380] Quan hệ đa cha (DAG): thêm/gỡ cạnh, chống chu trình, hiệu lực quan hệ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-380 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-377 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogEdgeService.java`, `resource/CatalogEdgeResource.java` |

## 1. Mục tiêu

Cho phép một mục có nhiều cha (kể cả khác `relation_type`), nhảy cấp, và từ chối chu trình.

## 2. Các thao tác

- [ ] POST edge: validate loại quan hệ thuộc `allowed_relations` của type, self-reference, chu trình (T4.2)
- [ ] DELETE edge: đóng hiệu lực; kiểm tra `min_parents` (không để mồ côi)
- [ ] API `GET /items/{id}/parents`, `/descendants`
- [ ] Test: Lập trình viên ⊂ CNTT + KHDL; công việc ⊂ ngành + phân bổ; chu trình bị từ chối

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-03, AC-04, AC-05**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
