# [TASK-376] Khai báo plugin core: definition, Entity Registry, ma trận nền tảng, UI slot

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-376 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-375 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/platform/service/PluginCatalogService.java`, `modules/catalog/model/*`, manifest plugin |

## 1. Mục tiêu

Plugin `catalog` được nhận diện là core (luôn bật, không gỡ), entity đăng ký vào Registry và khai báo phạm vi Desktop/Mobile.

## 2. Các thao tác

- [ ] Thêm definition core `catalog` (name/description key i18n) bên cạnh `core`
- [ ] `@RegisterEntity` cho `CatalogType`, `CatalogItem`, `CatalogItemEdge`
- [ ] Khai báo ma trận Desktop/Mobile (CRUD = Desktop, tra cứu + picker = cả hai) trong manifest/plugin spec
- [ ] Kiểm tra `PluginLifecycleService` chặn uninstall với `locked`/`is_core`

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-14, AC-16**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
