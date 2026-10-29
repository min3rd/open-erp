# [TASK-385] Màn quản trị danh mục (Web): 3 cột, drawer chi tiết, quan hệ, quyền theo loại

> **Trạng thái lịch sử:** task baseline của kiến trúc in-process (TR-S05-001 đã withdrawn). Đã được thay thế bởi TASK-394…406 (plugin độc lập). Không dùng làm bằng chứng QA/DoD.

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-385 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `f6b5131` + sửa `050a3bc`; QA TC-01…09, 18** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-381 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `web/src/app/features/settings/catalog/**` |

## 1. Mục tiêu

Màn quản trị đúng DES-UI: split 3 cột, không modal, mật độ cao, tải theo vùng.

## 2. Các thao tác

- [ ] Cột loại (badge TREE/DAG/system/free-text) + drawer Quyền theo loại (ma trận)
- [ ] Cột bản ghi: 3 chế độ xem (Danh sách/Cây/Đa cha), lọc + phân trang + context menu chuột phải
- [ ] Drawer chi tiết: thông tin + thuộc tính động + quan hệ (cha/con) + lịch sử phiên bản
- [ ] Skeleton + Thử lại theo từng vùng; i18n đầy đủ

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-09, AC-17**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: màn 3 cột `features/settings/catalog/` (loại | bản ghi | chi tiết) + 5 drawer (loại, bản ghi, quan hệ dùng `catalog-picker`, quyền theo vai trò, import/export) — **không modal**; route `/settings/catalog/:filter/:sort/:pageSize/:page/:id/:mode` (guard `catalog:item:read`); service `core/services/catalog-admin.service.ts`; **+190 khoá i18n × 13 locale** (gồm `PERM_CATALOG_*`); `npm run web:build` **0 lỗi/0 cảnh báo**, `i18n:check:strict` PASS, `mobile:build` PASS. Trạng thái: **code xong, build PASS — chờ commit + QA browser (TASK-389)**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
