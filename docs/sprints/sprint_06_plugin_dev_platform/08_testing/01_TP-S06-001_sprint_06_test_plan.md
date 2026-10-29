# [TP-S06-001] Sprint 06 test plan

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TP-S06-001 / Test Plan / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Executed — Q19/Q20 + post-closure PASS, QA sign-off; Sprint CLOSED** / 1.6 / 2026-10-29 |
| Owner / reviewer | QA/QC / Architect + PM |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, [00_READING_GUIDE](../00_READING_GUIDE.md) |
| Đọc tiếp | [TR-S06-001](02_TR-S06-001_sprint_06_test_report.md) |

## 1. Phạm vi

- Template 2.0 zero-DB + CLI create/entity/field/relation/CRUD/validate/upgrade/package.
- Slot runtime: header, settings tab, plugin-hosted slot, catalog WC, notification plugin.
- Bỏ iframe: enum, loader, screen host branch, template/CLI, catalog manifest.
- Browser desktop 1440×900 và Ionic 390×844; i18n vi/en; 0 console error; overflow 0; touch target ≥40px.

## 2. Môi trường

| Thành phần | Giá trị |
| :--- | :--- |
| Backend | Quarkus dev container `openerp-backend-dev`, PostgreSQL 16 + Redis thật |
| Web | `http://localhost:4200`, tenant `e2e-tenant@example.com` |
| Mobile | Ionic `http://localhost:8100`, cùng tenant, viewport 390×844 |
| Plugins | catalog 1.0.9 ACTIVE; in-app-notification 1.0.7 ACTIVE |
| Tenant | `aafea2fa-953d-410a-a9d7-6489106f5c8d` (e2e), `cd2729d8-aec0-423c-b2b0-2649a97d822f` (minhvv), system `00000000-0000-0000-0000-000000000001` |

## 3. Ma trận kiểm thử & kết quả

| ID | Kịch bản | Nền tảng | Cách kiểm chứng | Kết quả 2026-10-29 |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | CLI create zero-DB + validate | Node | `npm run cli:test` | PASS 11/11 |
| TC-02 | CLI entity/field/relation/CRUD + package | Node/Java | CLI test + generated install | PASS; AC-05 browser PASS |
| TC-03 | Validate offline + `--core-url` | Node | Mock HTTP 200/404 | PASS |
| TC-04 | Upgrade check/apply + backup | Node | `upgrade --check/--apply` | PASS; catalog up to date |
| TC-05 | Backend lifecycle/data gateway/plugin slot | Java/PostgreSQL | Maven targeted tests | PASS 32/32 (13+18+1) |
| TC-06 | Header notification + settings tab | Web desktop | Browser DOM + console | PASS |
| TC-07 | Catalog WC + route reload | Web desktop | Browser DOM + console | PASS |
| TC-08 | No IFRAME in code/manifest | Repo/DB | `grep`, UI manifest API | PASS |
| TC-09 | Mobile header + catalog 390×844 | Mobile Ionic | DOM/overflow/touch targets | PASS |
| TC-10 | i18n vi/en | Web/Mobile | Rendered labels, `check-i18n-parity.mjs` | PASS |
| TC-11 | AC-11 error boundary | Web desktop | Manifest interception (contract 9.0 + entry 404) | PASS |
| TC-12 | AC-05 generated CRUD | Web desktop | Install plugin → list/drawer/create | PASS |
| TC-13 | Old notification removal | Web/Mobile | DOM count `app-notification-bell/banner` = 0 | PASS |
| TC-14 | Platform defaults + tenant override | Web/API | Platform PUT defaults → tenant GET defaults → inherit/override | PASS |
| TC-15 | Bell opens drawer; view all navigates | Web 1440×900 + Mobile 390×844 | Click bell → drawer, route unchanged; Escape closes; “Xem tất cả” → full list; drawer full-height, overflow 0 | PASS |
| TC-16 | Plugin screen host has no Core header | Web 1440×900 | `/settings/apps/in-app-notification`: no “Về danh sách plugin”/pluginKey; plugin content fills; 0 console error | PASS |

## 4. Tiêu chí dừng

- 0 Critical/High mở; AC trace PASS rõ ràng.
- Không còn `IFRAME` trong code/manifest runtime.
- QA sign-off do QA/QC cấp trước PM DoD.

## 5. Kết quả execution

- **PASS gate:** 0 Critical/High; 7 bug Resolved (BUG-154…160).
- **Backend:** 32/32; **CLI:** 11/11; **Web/Mobile build:** PASS; **i18n parity:** 13/13 locale 100%.
- **Browser:** desktop 1440×900 + mobile 390×844 PASS, 0 console error, overflow 0, touch ≥40px.
- **Post-closure:** TASK-425 bỏ header host khỏi plugin screen; web build + browser PASS, 0 console error.
- **Ảnh:** [`evidence/sprint_06_retest/`](evidence/sprint_06_retest/); báo cáo [TR-S06-001](02_TR-S06-001_sprint_06_test_report.md).
- **Fixture AC-05:** `qa-crud` đã gỡ sau test; không còn plugin test trong catalog.
- **Final re-check:** desktop 8/8 + mobile 3/3 PASS; backend 32/32, CLI 11/11; 0 console error; ảnh `evidence/sprint_06_final/`.
- **Q19:** old bell/banner removed; plugin 1.0.5; platform defaults + tenant override PASS; AC-20/21 PASS.
- **Q20:** bell drawer 19/19 PASS; “Xem tất cả” mới điều hướng; plugin 1.0.7; bảng `tenant_notifications` đã bỏ.
