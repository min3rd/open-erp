# [TASK-393] Seed dữ liệu địa giới thật 2 cấp tỉnh→xã (N2, N6)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-393 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 0.3 (N1–N5 đã trả lời; N6/N7 đang mở), DES-DB/API/UI |
| depends_on / blocks / parent | TASK-375, TASK-377 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `src/backend/src/main/resources/db/seed/provinces-communes.csv`, seed script/service, `scripts/gen-admin-units.mjs` (dev-time, một lần) |

## 1. Mục tiêu

Có sẵn 63 tỉnh và các xã là con **trực tiếp** của tỉnh (không qua huyện) để form địa chỉ dùng ngay.

## 2. Các thao tác

- [ ] Sinh CSV một lần ở dev-time (nguồn + ngày + số dòng ghi ở header tệp; chốt nguồn tại N6) — runtime KHÔNG gọi API ngoài
- [ ] Seed item hệ thống cho `PROVINCE` + `COMMUNE` và cạnh trực tiếp `tỉnh→xã`; idempotent theo `code`
- [ ] Không seed huyện; loại `DISTRICT` vẫn sẵn cho tenant dùng sau
- [ ] Kiểm chứng: 63 tỉnh; lọc `parent_id=<tỉnh>` trả đúng xã thuộc tỉnh; tổng số xã khớp header tệp

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-21, AC-01, AC-02**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md). Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
