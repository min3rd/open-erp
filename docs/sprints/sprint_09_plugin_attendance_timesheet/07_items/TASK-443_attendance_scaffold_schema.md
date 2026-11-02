# [TASK-443] Scaffold plugin attendance + schema V1 + manifest

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-443 / Task / Sprint 09 |
| Severity / trạng thái | High / **Done (dev)** — scaffold + schema + manifest; build PASS, chờ QA integration khi có API |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md) 1.0 |
| depends_on / blocks / parent | — / TASK-444 / [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) |
| Write scope / baseline | `plugins/attendance/**`, `plugins/pom.xml` |

## 1. Mục tiêu

Scaffold Maven module `plugin-attendance` theo template 2.0 (pattern `plugin-form`): pom, plugin.json (entities theo DES-DB phần V1, permissions, event subscriptions/publications, ui manifest khung), migration `V1.0.0__attendance_schema.sql` (12 bảng ca/log/record/ot/hanging/devices/settings/employee_refs/outbox), đăng ký module vào `plugins/pom.xml`.

## 2. Thao tác

- [x] pom.xml + register module
- [x] `migrations/V1.0.0__attendance_schema.sql` 12 bảng + index + CHECK
- [x] `plugin.json` schema 2.0: entities, queries khung, permissions, event sub/pub, platforms D/M
- [x] Build PASS

## 3. Tiêu chí & kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `mvn -pl attendance test` (trong plugins) | **Pass** | BUILD SUCCESS 2026-11-02 15:32 — compile 5 source + 40/40 test |
| Manifest entities ↔ migration khớp | Pass | 12 entities = 12 bảng V1.0.0 (review bằng chứng tại handoff QA) |

## 4. Bàn giao

- Files: `plugins/attendance/**`, `plugins/pom.xml`.
- Chưa chạy: cài đặt plugin lên tenant (sau khi có API — TASK-445/447).

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Scaffold + schema + manifest; build PASS | Developer; working tree |
