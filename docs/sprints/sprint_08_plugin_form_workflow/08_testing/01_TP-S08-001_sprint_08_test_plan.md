# [TP-S08-001] Test Plan Sprint 08 — Plugin Form builder & Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TP-S08-001 / Test Plan / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | QA Agent / Chưa review |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) 1.0 (30 AC), [DES-ARCH-S08-001](../06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) §6–7, [DES-UI-S08-001](../06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) §7 |
| Đọc trước / đọc tiếp | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) / [TR-S08-001](02_TR-S08-001_sprint_08_test_report.md) |

## 1. Phạm vi kiểm thử

| Nhóm | Nội dung | Phương pháp |
| :--- | :--- | :--- |
| TC-N | Engine thuần: form document validator, workflow expression/condition, definition graph | Unit test (không DB) |
| TC-I | Backend tích hợp: REST + DB PostgreSQL thật (Core 278, plugin suites) | `mvn test` (No H2) |
| TC-E | E2E tenant thật: cài workflow + form + upgrade employee trên tenant QA; luồng form → event → instance → duyệt 2 bước → profile cập nhật; đề xuất cũ import | App thật Docker, theo ADR-S08-004 §2.4 |
| TC-B | Browser hai chế độ: Desktop ≥1280px + Mobile emulation 390×844 (guardrails QA); 0 console error | Browser manual + screenshot minh chứng |
| TC-S | Bảo mật public: anonymous token rỗng quyền, TTL, rate limit 429, cross-tenant | REST negative test |

## 2. Điều kiện chạy

- `npm run infra` (PostgreSQL Primary + Redis) — đã chạy 2026-11-02.
- Backend Core: `mvn -f src/backend/pom.xml test`.
- Plugin: `mvn -f plugins/pom.xml -pl <plugin> -am test`.
- WC: `npm run form:ui:build` / `npm run workflow:ui:build`.
- E2E tenant thật: backend + web dev compose + deploy plugin theo runbook Sprint 07.

## 3. Ma trận AC → nhóm test

| AC | Nhóm | AC | Nhóm |
| :--- | :--- | :--- | :--- |
| AC-F01–F03 | TC-N (validator 7/7) + TC-B | AC-W01–W04 | TC-N (6/6 + graph) + TC-I/E |
| AC-F04 | TC-E (proxy + registry) | AC-W05–W07 | TC-E (identity/self-approval) |
| AC-F05–F08 | TC-S + TC-B | AC-W08–W09 | TC-E + TC-B (inbox, overdue) |
| AC-F09–F14 | TC-I + TC-B | AC-W10–W12 | TC-I + TC-B (timeline, report) |
| AC-F15 | TC-B (i18n 2 ngôn ngữ) | AC-W13 | TC-E cutover + regression |
| — | — | AC-W14, W15 | TC-I isolation + TC-B mobile |
