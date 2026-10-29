# [00] Sprint 06 — Nền tảng phát triển plugin & UI extension do Core render

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S06-001 / 2.0 / 2026-10-29 |
| Trạng thái tài liệu / sprint | **CLOSED — APPROVED (2026-10-29)** |
| Owner / reviewer | PM Agent / Chủ dự án + BA + Architect |
| Đầu vào / đọc trước | [RAW-S06-001](01_raw_notes/01_RAW-S06-001_plugin_dev_platform_requirements.md) — yêu cầu trực tiếp của chủ dự án / [Sprint 05](../sprint_05_catalog_plugin/00_READING_GUIDE.md) (đã đóng) |
| Đọc tiếp | [REV-S06-001](09_review/01_REV-S06-001_sprint_06_dod_review.md) — biên bản nghiệm thu & đóng Sprint; [ANL-S06-001](02_analysis/01_ANL-S06-001_template_and_cli_interactive.md), [CONF-S06-001](04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) |

> **✅ 2026-10-29 — SPRINT 06 CLOSED / APPROVED:** [REV-S06-001](09_review/01_REV-S06-001_sprint_06_dod_review.md) ghi PM DoD PASS + khách hàng nghiệm thu, **0 Critical/High**, **22/22 AC PASS**. `in-app-notification` **1.0.7** là nguồn thông báo duy nhất (bell drawer, “Xem tất cả” mới sang trang); bell/banner Core và bảng `tenant_notifications` đã bỏ. Catalog **1.0.9** Web Component, template 2.0 + CLI 11/11, backend 32/32, web/mobile build PASS, 0 console error. [TR-S06-001](08_testing/02_TR-S06-001_sprint_06_test_report.md) 1.6; ảnh `08_testing/evidence/sprint_06_drawer/`. Post-closure: [TASK-425](07_items/TASK-425_remove_plugin_screen_host_header.md) bỏ header host plugin.

## 1. Đọc để hiểu gì?

Sprint 06 biến hạ tầng plugin của Sprint 03–05 thành **nền tảng phát triển plugin dùng được hằng ngày**, gồm ba luồng:

1. **Template đúng kiến trúc hiện tại** — plugin zero-DB: không Panache/Flyway/datasource/`TENANT_ID`; dùng `plugin-sdk`, `migrations/` + checksum, `plugin.json` khai báo `entities`/`queries`/`ui_manifest`; web plugin có Tailwind entry riêng.
2. **CLI tương tác** — developer chạy một mạch: tạo plugin → tạo entity → khai báo field + validator → khai báo quan hệ tới entity Core/plugin khác → sinh màn CRUD → validate.
3. **Core render UI extension** — plugin **chỉ đăng ký vị trí (slot) + component mẫu**; Core là bên đọc manifest, kiểm tra quyền/trạng thái và **render component vào layout** (header, tab cấu hình hệ thống…). **Bỏ iframe hoàn toàn**; plugin UI dùng Web Component/Module Federation. Core và plugin đều có thể khai báo slot, nhưng renderer là shared component của Core.

Điểm thay đổi tư duy quan trọng: **plugin sở hữu component; Core sở hữu khung render**. Đây là khác biệt với mô hình hiện tại của `catalog` — plugin tự đăng ký một screen và Core mount iframe toàn màn hình.

## 2. Lộ trình đọc

Khách hàng đọc 01, 04, 09; developer đọc 01–02, 04 rồi 05–09.

| Thứ tự | ID/alias | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S06-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S06-001_plugin_dev_platform_requirements.md) | Nguyên văn yêu cầu + bóc tách R1–R4, phạm vi dự kiến, câu hỏi mở | BA |
| 02.01 | ANL-S06-001 | [Template & CLI tương tác](02_analysis/01_ANL-S06-001_template_and_cli_interactive.md) | Hiện trạng template/CLI, khoảng trống G1–G10, luồng interact đề xuất, cách sinh entity/field/relation/CRUD | BA |
| 02.02 | ANL-S06-002 | [Core render UI slot](02_analysis/02_ANL-S06-002_core_rendered_ui_slots.md) | Hiện trạng manifest/slot, mô hình slot–contribution–outlet, contract component, header & tab cấu hình | BA + Architect |
| 03.01 | BENCH-S06-001 | [Đối chuẩn extension](03_benchmarks/01_BENCH-S06-001_plugin_extension_patterns.md) | Backstage/Grafana/VS Code/Odoo/ERPNext; bài học slot–contribution | BA |
| 04.01 | CONF-S06-001 | [Scope, câu hỏi & quyết định](04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) | ✅ **APPROVED 1.2** — scope/AC + Q1…Q16 gốc + Q17…Q20 | BA + Khách hàng |
| 05.01 | SOL-S06-001 | [Template 2.0 & CLI](05_solutions/01_SOL-S06-001_template_and_cli_architecture.md) | 17 quyết định template zero-DB, CLI, codegen, relation, validate, upgrade | Architect |
| 05.02 | ADR-S06-001 | [Core render slot](05_solutions/02_ADR-S06-001_core_rendered_ui_slots.md) | Slot–contribution, Core + plugin slots, WC/MF, context, error boundary | Architect |
| 05.03 | ADR-S06-002 | [Bỏ iframe & migrate catalog](05_solutions/03_ADR-S06-002_iframe_removal_catalog_migration.md) | Catalog → WC, phase/rollback, xoá IFRAME | Architect |
| 06.01 | DES-ARCH-S06-001 | [Kiến trúc tổng thể](06_designs/arch/01_DES-ARCH-S06-001_plugin_platform_architecture.md) | Thành phần, ranh giới, luồng, build, versioning, test | Architect |
| 06.02 | DES-ARCH-S06-002 | [CLI & codegen](06_designs/arch/02_DES-ARCH-S06-002_cli_interactive_and_codegen.md) | Prompt/draft/lệnh/file sinh/validate/upgrade/test | Architect |
| 06.03 | DES-API-S06-001 | [Manifest 2.0 & UI Manifest API](06_designs/api/01_DES-API-S06-001_manifest_and_ui_manifest.md) | Schema manifest, field/relation/slot/contribution, response, lỗi | Architect |
| 06.04 | DES-DB-S06-001 | [Slot registry & notification DB](06_designs/db/01_DES-DB-S06-001_slots_and_notification.md) | Seed slot v1, bảng notification/preferences, rollback | Architect |
| 06.05 | DES-UI-S06-001 | [Header slot & settings tabs](06_designs/ui/01_DES-UI-S06-001_slots_layout_and_settings.md) | `PluginSlotComponent`, topbar, `/settings/system`, notification UI, mobile | Architect |
| 06.06 | DES-UI-S06-002 | [Catalog WC migration](06_designs/ui/02_DES-UI-S06-002_catalog_web_component_migration.md) | WC entry, shell inputs/outputs, route-state, build, CSS, QA | Architect |
| 07.01 | FEAT-33 | [Template 2.0 & CLI](07_items/FEAT-33_plugin_template_and_cli.md) | Task 408–413; blocked by design review | Developer |
| 07.02 | FEAT-34 | [Core render UI & bỏ iframe](07_items/FEAT-34_core_rendered_ui_and_iframe_removal.md) | Task 414–417, 420–423; Critical path | Developer |
| 07.03 | FEAT-35 | [In-app notification](07_items/FEAT-35_in_app_notification_plugin.md) | Task 418–419 | Developer |
| 08.01 | TP/TR-S06-001 | [Test plan](08_testing/01_TP-S06-001_sprint_06_test_plan.md) / [Test report](08_testing/02_TR-S06-001_sprint_06_test_report.md) | Test plan/report; browser desktop + mobile | QA |
| 09.01 | REV-S06-001 | [Nghiệm thu & đóng Sprint](09_review/01_REV-S06-001_sprint_06_dod_review.md) | PM DoD, trace 22 AC, backlog, quyết định CLOSED 2026-10-29 | PM |

> Bảng đọc là snapshot. Khi thêm artifact phải cập nhật index này trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S06-001) | ✅ **APPROVED 1.2** — 16 câu gốc + Q17…Q20 | Chủ dự án | CONF-S06-001 1.2, 2026-10-29 |
| Design ready (SOL/ADR/DES) | ✅ **APPROVED 2026-10-29** — 3 SOL/ADR + 6 DES | Architect + Chủ dự án | Q17 + design review |
| Implementation | ✅ **Done (QA)** — template/CLI/slot/catalog WC/notification/iframe removal | Developer + QA | 2026-10-29 |
| QA sign-off | ✅ **PASSED** — 0 Critical/High; 22/22 AC PASS; backend 32/32, CLI 11/11 | QA | TR-S06-001 1.5, 2026-10-29 |
| PM DoD / Customer acceptance | ✅ **PASS + APPROVED 2026-10-29** | PM + Chủ dự án | REV-S06-001 1.0 |
| Sprint closure | ✅ **CLOSED 2026-10-29** | PM | REV-S06-001 1.0 |

### 3.1. Tiến độ task (chốt 2026-10-29)

| Task | Trạng thái | Bằng chứng |
| :--- | :--- | :--- |
| TASK-414 Manifest/API DTO | **Done (QA)** | DTO/ResponseKey/API + validate manifest 2.0 + entity/ui-slot endpoints; tests PASS |
| TASK-415 Slot registry seed | **Done (QA)** | `V6.0.0__plugin_ui_slots_v1.sql`; targeted test PASS |
| TASK-416 Shared slot runtime | **Done (QA)** | slot/outlet/WC-MF loader/context/error+timeout; notification fixture; web build PASS |
| TASK-417 Header/settings/dashboard | **Done (QA)** | Topbar slot, `/settings/system`, TabStrip, dashboard/settings sections; browser 0 console error |
| TASK-408/409 Template backend/web | **Done (QA)** | Zero-DB POM/POJO/gateway; web WC `main.js`; smoke `mvn package` + `ng build` PASS |
| TASK-410 CLI wizard | **Done (QA)** | Menu create/entity/field/relation/CRUD/contribution/validate; CLI tests 11/11 |
| TASK-411 generate entity/field/relation | **Done (QA)** | Zero-DB entity/field/relation + migration checksum + Java field |
| TASK-413 validate/upgrade | **Done (QA)** | Offline + `--core-url` PASS/FAIL/WARN; upgrade check/apply backup; CLI tests 11/11 |
| TASK-412 CRUD codegen | **Done (QA)** | Angular list/drawer + Java DTO/service/resource; generated plugin `mvn package` + DTO test PASS |
| TASK-418 Notification backend | **Done (QA)** | Plugin zero-DB, migration, queries, API, platform defaults/tenant settings, bell drawer; 1.0.7 ACTIVE |
| TASK-419 Notification web | **Done (QA)** | Header bell drawer + settings tab + list; thay bell Core (Q19/Q20); desktop + mobile PASS; BUG-154 fixed |
| TASK-420/421 Catalog WC + xoá IFRAME | **Done (QA)** | catalog 1.0.9 ACTIVE e2e/minhvv/system; IFRAME removed; desktop + mobile PASS; BUG-155/156/157/158 fixed |
| TASK-422 Docs | **Done (docs)** | Developer/deployment/CLI guides + user guide UG-S06-001 1.4 với 13 ảnh desktop/mobile |
| TASK-423 QA | **Done (QA)** | TP/TR-S06-001 1.5; 22/22 AC PASS; 7 bug Resolved; QA sign-off 2026-10-29 |
| TASK-424 In-app notification Q19/Q20 | **Done (QA)** | plugin 1.0.7; bell drawer; bỏ bell/banner Core + `tenant_notifications`; platform defaults + tenant override |
| TASK-425 Plugin screen host header | **Done (QA)** | Bỏ header Core + link “Về danh sách plugin” khỏi mọi plugin screen; web build + browser PASS |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S06-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | PM | Used |
| RAW-S06-001 | [01_raw_notes/](01_raw_notes/) | BA | Used |
| ANL-S06-001…002 | [02_analysis/](02_analysis/) | BA | Used |
| BENCH-S06-001 | [03_benchmarks/](03_benchmarks/) | BA | Used |
| CONF-S06-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used (APPROVED 1.2) |
| SOL-S06-001 | [05_solutions/01_SOL-S06-001](05_solutions/01_SOL-S06-001_template_and_cli_architecture.md) | Architect | Used — Approved |
| ADR-S06-001…002 | [05_solutions/](05_solutions/) | Architect | Used — Approved |
| DES-ARCH-S06-001…002 | [06_designs/arch/](06_designs/arch/) | Architect | Used — Approved |
| DES-API-S06-001 | [06_designs/api/](06_designs/api/) | Architect | Used — Approved |
| DES-DB-S06-001 | [06_designs/db/](06_designs/db/) | Architect | Used — Approved |
| DES-UI-S06-001…002 | [06_designs/ui/](06_designs/ui/) | Architect | Used — Approved |
| FEAT-33…35 | [07_items/](07_items/) | Developer | Used — Done (QA) |
| TASK-408…425 | [07_items/](07_items/) | Developer/QA | Used — Done (QA): 408–425 |
| BUG-154…160 | `07_items/` | QA/Developer | Used — 7 bug Resolved (154/155/160 High; 156/158/159 Medium; 157 Low) |
| TP/TR-S06-* | [08_testing/](08_testing/) | QA | Used — TP/TR 1.5 |
| REV-S06-001 | [09_review/01_REV-S06-001](09_review/01_REV-S06-001_sprint_06_dod_review.md) | PM | Used — CLOSED 2026-10-29 |

> Không dùng số task/bug dự kiến trước khi scope được duyệt; tránh cấp số cho item chưa tồn tại.

## 5. Việc chuyển tiếp từ Sprint 05

| Việc | Nguồn | Sprint 06 xử lý |
| :--- | :--- | :--- |
| CLI scaffold còn Panache/Flyway/datasource/`TENANT_ID` | [TASK-407](../sprint_05_catalog_plugin/07_items/TASK-407_cli_scaffold_zero_db.md) (Medium) | **Đã xử lý** — template 2.0 zero-DB (TASK-408/409) |
| Chưa E2E upgrade/rollback 2 version shared runtime | [REV-S05-001 §6](../sprint_05_catalog_plugin/09_review/01_REV-S05-001_sprint_05_dod_review.md) | Không chặn S06; test trước release |
| AC-18/19/22 chưa smoke lại UI sau iframe | REV-S05-001 §6 | QA smoke khi chạm catalog; không mở rộng scope S06 |
| System catalog còn static `catalog-system-dev` | REV-S05-001 §6 | Ngoài scope S06 |
| Catalog đang dùng screen iframe | Sprint 05 | **S06 migrate catalog sang MF/WC** và bỏ iframe (Q2 C + Q13 C) |

## 6. Quyết định đã chốt (20/20)

Chi tiết tại [CONF-S06-001 §3](04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md); Q17–Q20 đã chốt.

| # | Quyết định | Chốt |
| :--- | :--- | :--- |
| Q1 | Phạm vi | Cả 3 luồng trong S06 |
| Q2 | Iframe | **Bỏ iframe hoàn toàn** (WC/MF) |
| Q3 | Slot | **Core + plugin** đều khai báo |
| Q4 | Slot v1 | Header, settings tabs, dashboard, settings sections |
| Q5 | Cấu hình hệ thống | Trang mới `/settings/system` |
| Q6 | Render mode | Web Component + Module Federation |
| Q7 | CRUD UI | **Sinh mã Angular** từng entity |
| Q8 | CRUD backend | **Sinh Java service/resource** từng entity |
| Q9 | Quan hệ | **FK cùng plugin + soft ref xuyên plugin** |
| Q10 | CLI UX | Bare wizard + `--interactive` |
| Q11 | Plugin cũ | **Migrate toàn bộ** (catalog) |
| Q12 | Plugin mẫu | **`in-app-notification` thật** |
| Q13 | Catalog | **Migrate sang MF/WC trong S06** |
| Q14 | Mobile | Header mobile; settings tab desktop trước |
| Q15 | Tenant admin | Không ẩn/đổi thứ tự |
| Q16 | Validate | Offline + `--core-url` tùy chọn |
| Q17 | Chốt scope | **APPROVED toàn bộ** |
| Q18 | Notification vs Core | Đứng cạnh bell Core (bị Q19 thay thế) |
| Q19 | Notification platform/tenant | **Platform defaults + tenant override; bỏ notification Core cũ** |
| Q20 | Hành vi bell | **Mở drawer; “Xem tất cả” mới sang trang** |

## 7. Tài liệu ngoài Sprint-Pack đã cập nhật (2026-10-29)

| Tài liệu | Vị trí | Nội dung đã cập nhật |
| :--- | :--- | :--- |
| Hướng dẫn tạo plugin | [create_new_plugin_guide.md](../../08_developer_guides/create_new_plugin_guide.md) | Template 2.0 zero-DB; wizard CLI; entity/field/relation/CRUD/upgrade |
| Hợp đồng đóng gói web | [plugin_web_packaging_guide.md](../../08_developer_guides/plugin_web_packaging_guide.md) | WC/MF, contribution entry, slot contract, context bridge; bỏ iframe |
| Shared UI | [shared_ui_contribution_guide.md](../../08_developer_guides/shared_ui_contribution_guide.md) | `PluginSlotComponent`/`ContributionOutlet`/TabStrip |
| CLI | [tools/open-erp-cli/README.md](../../../tools/open-erp-cli/README.md) | Wizard, generate CRUD/relation, validate, upgrade, package/publish |
| Triển khai | [local_setup_guide.md](../../07_deployment_guides/local_setup_guide.md), [plugin_manager_infrastructure_guide.md](../../07_deployment_guides/plugin_manager_infrastructure_guide.md) | WC runtime, registry allowlist, plugin 1.0.7/catalog 1.0.9 |
| Dev reading/walkthrough | [00_READING_GUIDE.md](../../08_developer_guides/00_READING_GUIDE.md), [01_project_walkthrough.md](../../08_developer_guides/01_project_walkthrough.md) | Trạng thái Sprint 01–06, CLI/template hiện hành |
| Hướng dẫn sử dụng | [UG-S06-001](../../06_user_guides/sprint_06_plugin_ui_extension_user_guide.md) | 1.4 + 13 ảnh; bell drawer, platform defaults, tenant override |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Khởi tạo Sprint-Pack 06: RAW, 2 ANL, CONF nháp với 16 câu hỏi; gate Pending | BA Agent; yêu cầu trực tiếp chủ dự án |
| 0.2 | 2026-10-29 | Ghi nhận 16/16 câu trả lời; cập nhật quyết định (bỏ iframe, plugin slots, migrate catalog, notification thật, sinh mã); gate chờ Q17 | BA Agent; hội thoại chủ dự án |
| 0.3 | 2026-10-29 | **Scope APPROVED 1.0** (Q17), Q18 notification đứng cạnh bell Core; gate design/implementation vẫn Pending | BA Agent; chỉ đạo trực tiếp chủ dự án |
| 0.4 | 2026-10-29 | Soạn BENCH-S06-001 + SOL/ADR-S06 + 6 DES; design draft for review; chưa cấp task/code | Architect; CONF-S06-001 1.0 |
| 0.5 | 2026-10-29 | Cấp FEAT-33…35 + TASK-408…423 (Planned, blocked by design review); cập nhật reading guide/task board | PM/Architect; design draft |
| 0.6 | 2026-10-29 | Design APPROVED; bắt đầu code P1 — backend DTO/slot migration, shared slot runtime, header/settings; TASK-415 Done (dev), 414/416/417 In Progress | Architect/Developer; chỉ đạo chủ dự án |
| 0.7 | 2026-10-29 | Template 2.0 backend/web Done (dev): POM zero-DB, POJO/gateway, WC `main.js`, header contribution; smoke build PASS; TASK-408/409 Done, 411 In Progress | Developer; TASK-408/409 |
| 0.8 | 2026-10-29 | CLI wizard menu (create/entity/contribution/validate) + `--interactive`; TASK-410 In Progress; CLI tests 6/6 PASS | Developer; TASK-410 |
| 0.9 | 2026-10-29 | Plugin `in-app-notification` backend Done (dev) + web header bell/settings tab/list chạy; install/upgrade 1.0.2 ACTIVE; browser 0 console error | Developer; TASK-418/419 |
| 1.0 | 2026-10-29 | Hoàn tất các task In Progress: CLI field/relation wizard, manifest validation + lookup endpoints, slot error/timeout, notification drawer; 10 task Done (dev); còn 412/413/420–423 Planned | Developer; TASK-410/411/414/416/417/419 |
| 1.1 | 2026-10-29 | CRUD/validate/upgrade CLI Done; catalog 1.0.9 WC + xoá IFRAME Done; QA TP/TR created; còn 422 ảnh + 423 QA sign-off | Developer/QA; CLI tests 11/11; browser PASS |
| 1.2 | 2026-10-29 | QA re-test desktop PASS + ảnh; mobile FAIL BUG-154/155/156/157; catalog metadata BUG-158; QA sign-off BLOCKED | QA; TR-S06-001 1.1 |
| 1.3 | 2026-10-29 | Fix 7 bug (BUG-154…160); AC-05/11/16 PASS; backend 32/32, CLI 11/11, desktop/mobile PASS; QA sign-off | QA/Developer; TR-S06-001 1.2 |
| 1.4 | 2026-10-29 | Final QA re-check 11/11 PASS (desktop 8 + mobile 3); backend 32/32, CLI 11/11; ảnh `evidence/sprint_06_final/` | QA; TR-S06-001 1.3 |
| 1.5 | 2026-10-29 | Q19: in-app-notification 1.0.5, bỏ bell/banner Core, platform defaults + tenant override; 21/21 AC PASS | Chủ dự án; CONF 1.1 |
| 1.6 | 2026-10-29 | Q20: bell mở drawer, “Xem tất cả” mới sang trang; plugin 1.0.7; bỏ bảng `tenant_notifications`; 22/22 AC PASS | Chủ dự án; CONF 1.2 |
| 2.0 | 2026-10-29 | **Sprint 06 CLOSED — APPROVED**: REV-S06-001 PM DoD + khách hàng nghiệm thu; 22/22 AC, 0 Critical/High; rà developer/deployment/CLI docs | Chủ dự án; REV-S06-001 1.0 |
| 2.1 | 2026-10-29 | Post-closure TASK-425: bỏ header host khỏi mọi plugin screen; web build + browser 0 console error | Chủ dự án; TASK-425 |
