# [TASK-393] Seed dữ liệu địa giới thật 2 cấp tỉnh→xã (N2, N6)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-393 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress — code xong, test PASS (2026-10-06); chờ commit** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 1.0 (Approved 2026-10-06), DES-DB/API/UI |
| depends_on / blocks / parent | TASK-375, TASK-377 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `src/backend/src/main/resources/db/seed/provinces-communes.csv`, seed script/service, `scripts/gen-admin-units.mjs` (dev-time, một lần) |

## 1. Mục tiêu

Có sẵn **34 tỉnh/thành** và **3.321 xã/phường** là con **trực tiếp** của tỉnh (không qua huyện, đúng cấu trúc sau sáp nhập 2025) để form địa chỉ dùng ngay.

## 2. Các thao tác

- [ ] Sinh CSV một lần ở dev-time (nguồn + ngày + số dòng ghi ở header tệp; chốt nguồn tại N6) — runtime KHÔNG gọi API ngoài
- [ ] Seed item hệ thống cho `PROVINCE` + `COMMUNE` và cạnh trực tiếp `tỉnh→xã`; idempotent theo `code`
- [ ] Không seed huyện; loại `DISTRICT` vẫn sẵn cho tenant dùng sau
- [ ] Kiểm chứng: **34** tỉnh, **3.321** xã/phường (khớp header tệp); lọc `parent_id=<tỉnh>` trả đúng xã thuộc tỉnh; `node scripts/check-admin-units.mjs` PASS

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-21, AC-01, AC-02**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: tệp `provinces-communes.csv` sinh một lần (**34 tỉnh / 3.321 xã-phường**) + script `npm run data:admin-units` / `data:admin-units:check` (PASS) — đã commit `a11b8fc`; seeder `CatalogAdminUnitSeeder` (đọc CSV, idempotent, không lỗi khi thiếu tệp) + test PASS; kiểm chứng DB: 34/3.321/3.321 cạnh sau nhiều lần chạy. Trạng thái: **code xong, test PASS — chờ commit phần seeder**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
