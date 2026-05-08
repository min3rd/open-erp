# Kế hoạch dự án: Chuẩn hóa Seed Data

## Tổng quan
- **Mục tiêu:** Chuẩn hóa toàn bộ cơ chế tạo seed data khi khởi tạo hệ thống lần đầu tiên
- **Phạm vi:** Backend (open-erp-backend)
- **Ngày bắt đầu:** 08/05/2026
- **Yêu cầu người dùng:** Toàn bộ — Refactor + phân loại + first-run auto-init + tài liệu đầy đủ

## Hiện trạng vấn đề

| # | Vấn đề | Mức độ |
|---|---|---|
| 1 | `connectToDatabase()` (~60 dòng) bị copy-paste trong 8+ file seed | 🔴 Cao |
| 2 | Hai file `seed-utils` xung đột: `seeds/seed-utils.ts` vs `seeds/utils/seed-utils.ts` | 🔴 Cao |
| 3 | Không có cơ chế first-run auto-init (Docker entrypoint / NestJS bootstrap) | 🔴 Cao |
| 4 | Không phân loại essential vs sample seeds | 🟡 Trung bình |
| 5 | `parseArgs` không nhất quán — một số file tự định nghĩa riêng | 🟡 Trung bình |
| 6 | Không có tài liệu seed order và dependency | 🟡 Trung bình |

## Quyết định từ người dùng
- **Phạm vi:** Toàn bộ (Refactor + phân loại + first-run auto-init + tài liệu)
- **Essential seeds:** Tất cả seed hiện tại đều essential (provinces, wards, roles, organizations, users, warehouse-types, warehouses, relations, navigation, product-types, product-categories, wms, inventory-stock)

## Các giai đoạn

| Giai đoạn | Agent | Trạng thái | Đầu ra |
|---|---|---|---|
| 1. Thiết kế kiến trúc & task breakdown | Technical Leader | ⬜ Chưa bắt đầu | `docs/tasks/TASK-INDEX.md`, kiến trúc seed chuẩn |
| 1. Thiết kế kiến trúc & task breakdown | Technical Leader | 🟢 DONE | `docs/tasks/TASK-INDEX.md`, `SEED_STANDARDIZATION_DESIGN.md` |
| 2. Triển khai refactor & standardization | Senior Backend | 🟡 REVIEW | Source code (8 tasks) |
| 3. Tài liệu hướng dẫn | Senior Backend | 🟡 REVIEW | `open-erp-backend/docs/SEED_GUIDE.md` |

## Cổng kiểm soát chất lượng
- **Giai đoạn 1 → 2:** TASK-INDEX.md có đủ task với thiết kế rõ ràng
- **Hoàn thành:** Tất cả file seed sử dụng shared utilities, first-run init hoạt động, tài liệu đầy đủ

## Kết quả triển khai (08/05/2026)

### File mới tạo
- `scripts/seeds/utils/seed-state.ts` — SeedStateTracker với MongoDB `seed_metadata` collection
- `scripts/seeds/first-run-init.ts` — Entry point cho Docker/CI initialization
- `scripts/docker-init.sh` — Docker entrypoint shell script
- `open-erp-backend/docs/SEED_GUIDE.md` — Hướng dẫn đầy đủ cho developer

### File đã cập nhật
- `scripts/seeds/utils/seed-utils.ts` — Thêm `connectToDatabase()`, re-export `SeedStateTracker`
- `scripts/seeds/seed-all.ts` — Tích hợp SeedStateTracker, thêm `--force`/`--status` flags
- 13 file seed riêng lẻ — Xóa inline `connectToDatabase()`, import từ `./utils/seed-utils`
- `Dockerfile` — Thêm `ENTRYPOINT ["/docker-init.sh"]`
- `docker-compose.yml` — Thêm env vars SEED_ON_INIT, SEED_FORCE, SEED_SUPERADMIN_PASSWORD
- `docker-compose.dev.yml` — Thêm service `db-seed` với SEED_ON_INIT=true
- `package.json` — Thêm scripts: `db:seed:status`, `db:seed:force`, `db:init`

### File đã xóa
- `scripts/seeds/seed-utils.ts` (root level) — Đã thay thế bởi `utils/seed-utils.ts`

### Việc còn lại (out of scope lần này)
- TASK-SPRINT-01-SEED_DATA-005: Full upsert idempotency trong từng file seed riêng lẻ
- TASK-SPRINT-01-SEED_DATA-009: Unit tests cho seed-utils và seed-state
