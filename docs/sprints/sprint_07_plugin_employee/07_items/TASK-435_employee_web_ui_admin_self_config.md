# [TASK-435] Employee Web UI: admin, self-service, config, switcher UI

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-435 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — full WC + tools verified app thật 12/12, UI thân thiện 1.0.6 |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / DES-UI 0.2 |
| depends_on / blocks / parent | TASK-431/432/433/434 / TASK-436 / FEAT-37 |
| Write scope / baseline | `plugins/employee/web/**`, `src/frontend/shared/**`; working tree |

## 1. Mục tiêu

Web UI: list + full-page tabs, drawer nhiều bước, self-service tabs, approval split-view, config, org chart matrix, document card grid, user-menu switcher.

## 2. Thao tác

- [x] Route `/settings/apps/employee`; list/search; detail; create/edit drawer.
- [x] Self-service sections; pending/withdraw; sensitive mask từ API; document card grid + upload/download.
- [x] Approval drawer/split; config approval steps; field config/campaign/onboarding/privacy tools; import/export; org chart.
- [ ] Shared components `OrgChartMatrixComponent`, `ChangeRequestDiffComponent`, `DocumentCardGridComponent` (inline hiện tại).
- [x] i18n 13 locale; high density/sharp; no modal; browser app thật chạy 2026-10-30.
- [x] Thiết kế lại thân thiện: header + KPI, tab icon/count, filter trạng thái/loại, empty state có hành động, HR tools sub-nav mô tả, nhãn field tiếng Việt, tự seed 15 field config, copy link mời.

## 3. Tiêu chí & kiểm chứng

- [x] AC-01…29/35 phần lõi; UI không hardcode; keyboard/a11y dùng shared drawer.
- [x] 0 compile error; build PASS; i18n strict.
- [x] Browser QA desktop + mobile + tenant minhvv.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `ng build employee-plugin` | **Pass** | 488.23 kB initial (1.0.6) |
| `npm run web:build` | **Pass** | 562.82 kB initial |
| i18n strict | **Pass** | web 1366 keys, 13 locale |
| Browser desktop 1440×900 (harness+mock API) | **Pass** 9/9 | [evidence](../08_testing/evidence/s07_qa/desktop_hr_tools.png); 0 console error |
| Browser app thật | **Pass** 12/12 | [desktop_employee_list.png](../08_testing/evidence/s07_qa_real/desktop_employee_list.png), [desktop_hr_tools.png](../08_testing/evidence/s07_qa_real/desktop_hr_tools.png), [desktop_hr_onboarding.png](../08_testing/evidence/s07_qa_real/desktop_hr_onboarding.png) |
| Tenant minhvv | **Pass** 4/4 | [minhvv_employee.png](../08_testing/evidence/s07_qa_real/minhvv_employee.png), [minhvv_hr_tools.png](../08_testing/evidence/s07_qa_real/minhvv_hr_tools.png) |

## 4. Bàn giao

Files: plugin web/shared. Blocker: API tasks. Chuyển TASK-436/QA.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Admin list/detail/create/edit, self change request, approval/config, document upload/download; build PASS | Developer |
| 0.3 | 2026-10-30 | HR tools tabs (field/onboarding/campaign/privacy), import/export, org chart; retest 12/12 PASS | Developer/QA |
| 0.4 | 2026-10-30 | UI thân thiện (KPI/filter/section/empty state), nhãn field đa ngôn ngữ, tự seed field config; employee 1.0.6; desktop + minhvv 0 console error | Developer/QA |
| 0.5 | 2026-10-31 | Sub-tab phân công/hợp đồng + form; role read-only; employee 1.0.8; 4 role PASS; 0 console error | Developer/QA; TR-S07-001 1.6 |
