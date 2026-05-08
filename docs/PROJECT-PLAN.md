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

---

# Kế hoạch dự án: Chuẩn hóa kiến trúc Backend ERP SaaS Multi-tenant

## Tổng quan
- **Mục tiêu:** Gom 11 microservice thành 6 domain service lớn theo nghiệp vụ ERP, giảm trùng lặp và tăng khả năng mở rộng SaaS đa tenant.
- **Đối tượng:** Doanh nghiệp sử dụng hệ thống quản trị tổng thể (kho, sale, HR, công việc nội bộ, tài liệu/phê duyệt, kế toán).
- **Nền tảng:** Backend microservices (NestJS) cho Web/Mobile clients.
- **Ngày bắt đầu:** 08/05/2026.

## Các giai đoạn

| Giai đoạn | Agent thực hiện | Trạng thái | Đầu ra |
|---|---|---|---|
| 1. Phân tích yêu cầu sản phẩm | Product Owner | 🟢 Hoàn tất phạm vi | Domain scope và ưu tiên phase |
| 2. Đặc tả hệ thống | Business Analyst | 🟢 Hoàn tất mức định hướng | Yêu cầu SaaS multi-tenant + boundary domain |
| 3. Thiết kế kiến trúc và task kỹ thuật | Technical Leader | 🟢 Hoàn tất | docs/tasks/ARCHITECTURE.md, docs/tasks/TASK-INDEX.md |
| 4. Triển khai Phase 1 (Platform Catalog + WMS + tenant isolation) | Senior Backend + Senior DevOps | ⬜ Chưa bắt đầu | SPRINT-02 domain-migration tasks |
| 5. Triển khai Phase 2 (Work/Document + HR) | Senior Backend + Senior QA | ⬜ Chưa bắt đầu | SPRINT-03 domain-migration tasks |
| 6. Triển khai Phase 3 (Sales + Accounting + cutover legacy) | Senior Backend + Senior DevOps + Senior QA | ⬜ Chưa bắt đầu | SPRINT-04 domain-migration tasks |

## Cổng kiểm soát chất lượng (Quality Gates)

- **Giai đoạn 3 -> 4:** Co tai lieu architecture va he thong TASK-INDEX da day du sprint/cluster/task file rieng.
- **Phase 1 DONE:** WMS va Platform Master Catalog hoat dong tenant-safe, khong con ownership chong cheo voi service cu.
- **Phase 2 DONE:** Work/Document va HR tach rieng, event contract test pass tren CI.
- **Phase 3 DONE:** Sales + Accounting cutover xong, legacy 11 service duoc decommission co rollback runbook.
- **Hoan thanh:** QA xac nhan regression multi-tenant khong ro ri du lieu tenant, khong con bug Critical/Major.

## Danh sach domain dich

1. Platform
2. WMS
3. Sales
4. HR
5. Work/Document
6. Accounting

## Tai lieu dieu phoi chinh

- docs/tasks/ARCHITECTURE.md
- docs/tasks/TASK-INDEX.md
- docs/tasks/sprints/SPRINT-02/TASK-INDEX.md
- docs/tasks/sprints/SPRINT-03/TASK-INDEX.md
- docs/tasks/sprints/SPRINT-04/TASK-INDEX.md
- docs/tasks/clusters/domain-migration/TASK-INDEX.md
