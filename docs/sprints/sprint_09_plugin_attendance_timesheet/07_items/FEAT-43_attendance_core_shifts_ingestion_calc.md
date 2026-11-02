# [FEAT-43] Plugin attendance — scaffold, ca/lịch, log ingestion, engine tính công

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-43 / Feature / Sprint 09 |
| Trạng thái / Severity | In Progress / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md) 1.0, [DES-ARCH-S09-001](../06_designs/arch/01_DES-ARCH-S09-001_components_and_flows.md) 1.0, [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) 1.0 |
| depends_on / blocks | — / [FEAT-44](FEAT-44_attendance_timesheets.md) (bảng công cần records), [FEAT-45](FEAT-45_attendance_request_forms.md) (mapping cần records/ot_windows) |
| Write scope | `plugins/attendance/**`, `plugins/pom.xml` (thêm module), Core `AttendanceIngestResource` |

## 1. Scope

Scaffold Maven module `plugin-attendance` + schema migration V1 (bảng ca/log/record/thiết bị/settings/projection/outbox theo [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md)) + engine thuần (ShiftResolver, AttendanceCalculator) + ingestion 5 nguồn (web/mobile GPS/kiosk PIN/import CSV/API push qua Core — [ADR-S09-005](../05_solutions/06_ADR-S09-005_multi_source_log_ingestion.md)) + CalcJob idempotent (check-in treo, override skip, OT windows) + API chấm công self/admin ([DES-API §2–5](../06_designs/api/01_DES-API-S09-001_attendance_api.md)).

AC truy vết: AC-A01…A07, AC-S01…S04, AC-C01…C03, AC-M01 (phần chấm mobile).

## 2. Task con

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| [TASK-443](TASK-443_attendance_scaffold_schema.md) | Scaffold module + plugin.json + migration V1 + registry | Done (dev) |
| [TASK-444](TASK-444_attendance_engines_pure.md) | Engine thuần ShiftResolver + AttendanceCalculator + unit test | Done (dev) |
| TASK-445 *(chưa tạo file)* | Ingestion 5 nguồn + kiosk + import + push Core | Reserved |
| TASK-446 *(chưa tạo file)* | CalcJob + hanging check + override + ot_windows | Reserved |
| TASK-447 *(chưa tạo file)* | API self check-in + admin logs/records | Reserved |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo theo DES APPROVED; cấp TASK-443…447 |
