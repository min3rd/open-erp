# [FEAT-37] Plugin Employee: hồ sơ, self-service, duyệt, tài liệu & privacy

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-37 / Feature / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — app thật E2E 12/12, 0 Critical/High; signed URL hoàn tất 2026-11-01, không còn Medium deferred của FEAT / 0.6 / 2026-11-01 |
| Owner / reviewer | Developer + Architect / QA |
| Đầu vào | [CONF-S07-001 1.0](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md), [SOL-S07-001](../05_solutions/01_SOL-S07-001_employee_organization_architecture.md), [DES-ARCH](../06_designs/arch/01_DES-ARCH-S07-001_components_and_flows.md), [DES-DB](../06_designs/db/01_DES-DB-S07-001_employee_organization_schema.md), [DES-API](../06_designs/api/01_DES-API-S07-001_employee_organization_auth_api.md), [DES-UI](../06_designs/ui/01_DES-UI-S07-001_employee_organization_ui.md) |
| Đọc trước / đọc tiếp | Task con bên dưới |

## 1. Mục tiêu

Xây plugin `employee` always-on: hồ sơ nhân sự, đa phân công effective-dated, hợp đồng, self-service allowlist, duyệt nhiều cấp, tài liệu, org chart/danh bạ, self-onboarding, campaign, privacy.

**In-scope:** AC-01…AC-29, AC-37; desktop + mobile self-service.
**Out-scope:** payroll/attendance/leave/recruitment; e-sign; bank/dependents; custom fields.

## 2. AC & truy vết

| AC | Nội dung | Design | Test |
| :--- | :--- | :--- | :--- |
| AC-01…04 | Employee identity, accountless, code, link user | DES-DB/API | PASS — app E2E |
| AC-05/21 | Đa phân công, primary, manager | DES-DB/API | PASS |
| AC-06/07/09 | Self isolation, allowlist, no self-approval | DES-API | PASS |
| AC-08/26 | Duyệt nhiều cấp, cấu hình | DES-API/UI | PASS |
| AC-10/27 | Sensitive mask/audit | DES-DB/API/UI | PASS — mask PASS app thật; audit ghi qua outbox `DOCUMENT_SCAN`/`NOTIFICATION` + DSAR export/erase PASS (TR 1.14) |
| AC-11/22 | Status/date/effective-dated | DES-DB | PASS |
| AC-12/37 | Offboarding guard, auto access removal | DES-API | PASS — last admin 409 thật |
| AC-23/24 | Org chart matrix, documents | DES-DB/API/UI | PASS — documents + signed URL ngắn hạn (TASK-433 0.3) |
| AC-25/26 | Field/approval config | DES-DB/API | PASS |
| AC-27/28 | Onboarding/campaign | DES-API/UI | PASS |
| AC-29 | Privacy consent/DSAR/breach/retention | DES-DB/API | PASS — consent + DSAR export/erase app thật (TR 1.14) |
| AC-19 | Mobile self-service | DES-UI | PASS — Ionic 390×844 7/7 |

## 3. Task con

| ID/link | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| [TASK-430](TASK-430_employee_plugin_scaffold_schema.md) | Developer | FEAT-36/428 | `plugins/employee/**` | **Done (dev)** — schema/build/test |
| [TASK-431](TASK-431_employee_admin_api_assignment_contract.md) | Developer | 430 | `plugins/employee/**` | **Done (QA)** — admin API + last-admin/owner/platform guard |
| [TASK-432](TASK-432_employee_self_service_approval_config.md) | Developer | 431 | `plugins/employee/**` | **Done (QA)** — self/withdraw/approval chain |
| [TASK-433](TASK-433_employee_documents_storage_scan.md) | Developer | 430 | `plugins/employee/**`, storage config | **Done (QA)** — upload/download/scan/self docs |
| [TASK-434](TASK-434_employee_orgchart_directory_import_onboarding_privacy.md) | Developer | 431/433 | `plugins/employee/**` | **Done (QA)** — directory/org-chart/import-export/onboarding/campaign/privacy |
| [TASK-435](TASK-435_employee_web_ui_admin_self_config.md) | Developer | 431/432/433/434 | `plugins/employee/web/**`, `src/frontend/shared/**` | **Done (QA)** — app thật 12/12 |
| [TASK-436](TASK-436_employee_mobile_self_service.md) | Developer | 435/438 | `src/frontend/mobile/**`, plugin web | **Done (QA)** — Ionic 390×844 7/7 |

## 4. Bàn giao

- Baseline: design 0.2; plugin org/projection sẵn sàng.
- Output: API/UI/docs/i18n; test backend PostgreSQL/Redis thật; browser desktop/mobile.
- Chưa chạy test; QA sau implementation.
- Blocker: TASK-430 phụ thuộc FEAT-36 projection; TASK-436 phụ thuộc switcher TASK-438.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo FEAT/TASK từ design approved; chưa code | Architect/PM; CONF 1.0 |
| 0.2 | 2026-10-30 | Schema/admin/self/docs + WC list/me | Developer |
| 0.3 | 2026-10-30 | Full backend + WC admin/self/approval/config/docs + tests/build PASS; QA pending | Developer/Subagent |
| 0.4 | 2026-10-30 | Last-owner guard, org chart/import-export, HR tools UI; QA harness 12/12 PASS | Developer/QA |
| 0.5 | 2026-10-30 | App thật E2E 12/12, last-admin 409, tenant switch PASS; QA PASS implementation | QA; TR-S07-001 1.2 |
| 0.6 | 2026-11-01 | Signed URL hoàn tất (TASK-433 0.3, plugin 18/18); các AC Partial chuyển PASS theo bằng chứng TR 1.13/1.14 | Developer; TR-S07-001 1.17 |
