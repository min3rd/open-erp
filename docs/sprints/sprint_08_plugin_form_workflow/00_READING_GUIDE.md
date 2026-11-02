# [00] Sprint 08 — Plugin Form builder & Workflow (Biểu mẫu và Luồng công việc)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S08-001 / 1.0 / 2026-11-02 |
| Trạng thái tài liệu / sprint | 🚧 **ĐANG THỰC HIỆN** — Implementation Done (Dev); **QA: TC-E 22/22 + TC-S 5/5 + TC-B PASS trên runtime thật; 7 bug đã sửa; 2 bug UI LOW mở**; TR 1.0 **chờ chủ dự án review** |
| Owner / reviewer | BA Agent / Chủ dự án (duyệt scope tại CONF) |
| Đầu vào / đọc trước | [RAW-S08-001](01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) — yêu cầu trực tiếp chủ dự án 2026-11-02 / [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) (đã đóng), [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) |
| Đọc tiếp | [ANL-S08-001](02_analysis/01_ANL-S08-001_form_builder_plugin.md) → [ANL-S08-002](02_analysis/02_ANL-S08-002_workflow_plugin.md) → [BENCH-S08-001](03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) → [BENCH-S08-002](03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) → [CONF-S08-001](04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) |

## 1. Đọc để hiểu gì?

Sprint 08 xây **hai plugin nghiệp vụ độc lập** theo yêu cầu trực tiếp của chủ dự án:

1. **Plugin Form builder** (`form` — đề xuất) — tenant tự thiết kế biểu mẫu kiểu Google Forms: sections, nhiều loại câu hỏi, skip logic, phát hành link (nội bộ/công khai), thu và quản lý response, xuất dữ liệu, upload file.
2. **Plugin Workflow** (`workflow` — đề xuất) — tenant tự tạo luồng xử lý công việc: các bước phê duyệt/xử lý, điều kiện rẽ nhánh, người xử lý theo vai trò/quản lý trực tiếp, hạn xử lý-nhắc việc, task inbox "Việc của tôi", ghi vết toàn bộ luồng.

Hai plugin gắn chặt với nhau: **response của form là một nguồn kích hoạt tự nhiên của workflow** (đề xuất → duyệt nhiều cấp) — đúng mô hình Base.vn/MISA/JotForm mà [BENCH-S08-001](03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) và [BENCH-S08-002](03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) chỉ ra.

Sprint này **không** làm: chữ ký số (giữ chỗ trong mô hình hành động node), payment trong form, BPMN editor đồ thị tự do, single-use/login-required fill mode, mẫu in phiếu đề xuất (backlog). **Đã chốt tại CONF §2**: migration luồng duyệt employee sang workflow engine **làm ngay trong sprint** (phương án C — rủi ro cao nhất, điều kiện kiểm soát tại CONF §5).

### 1.1. Kiến thức nền cần có

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Nền tảng plugin | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) — zero-DB, soft ref, Entity Registry, WC/MF, event/outbox | Cả 2 plugin là plugin độc lập; trigger workflow phải đăng ký theo entity của plugin khác |
| Phân quyền & data scope | [Sprint 02](../sprint_02_superadmin_rbac/00_READING_GUIDE.md) | Response/quyền xử lý việc phải đi qua RBAC + data scope tenant/org/branch |
| Luồng duyệt hiện có | Sprint 07 — approval config, đề xuất cập nhật hồ sơ, sơ đồ node | Câu hỏi kiến trúc: luồng employee giữ riêng hay quy về engine chung (ANL-S08-002 §5) |
| Storage & signed URL | Sprint 07 — signed URL HMAC, ClamAV | Upload file trong form bắt buộc đi qua platform storage |
| Thông báo | Sprint 06/07 — notification plugin | Nhắc việc, thông báo response mới, CC người liên quan |

### 1.2. Kết quả nghiên cứu đối thủ (tóm tắt điều hướng)

- **[BENCH-S08-001 — Form builder]** 10 sản phẩm (Google, Microsoft, Typeform, JotForm, Formbricks, LimeSurvey, Odoo Survey, Frappe Web Form, NocoBase, MISA/Base). Bài học cốt lõi: một lõi form hai chế độ (survey tự do + form gắn entity qua Entity Registry); response lưu **JSONB + form_version** (bài học ngược LimeSurvey); question `ref` ổn định là hợp đồng tích hợp; logic kiểu Formbricks (operator theo loại câu hỏi, chống vòng lặp); responder tách user với single-use link; tích hợp outbox → webhook → workflow.
- **[BENCH-S08-002 — Workflow]** 10 nhóm sản phẩm (Odoo, Frappe, Camunda 8, Temporal, n8n, Zapier/Make, NocoBase, Appsmith/Budibase, Flowable, Base.vn/MISA/1Office). Bài học cốt lõi: tách definition/instance + versioning; trigger qua entity event là yêu cầu số 1; **state machine tự viết cho v1**, học semantics của Flowable, nhúng Flowable OSS chỉ khi cần BPMN thật; task inbox bắt buộc; assignment đa tầng (user/role/manager-of/query) + chặn self-approval; SLA = hạn + nhắc + quá hạn vẫn duyệt được (chuẩn kỳ vọng VN); event log append-only vẽ lại luồng đã đi; multi-tenant xuyên suốt.

## 2. Lộ trình đọc

Khách hàng đọc **01 → 03** (hiểu yêu cầu + đối chuẩn) rồi chờ CONF; developer đọc thêm 04–09 sau khi scope duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S08-001 | [Yêu cầu gốc 2 plugin](01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) | Nguyên văn yêu cầu, R1–R3, diễn giải BA, ràng buộc, 12 câu hỏi mở | BA |
| 02.01 | ANL-S08-001 | [Phân tích plugin form builder](02_analysis/01_ANL-S08-001_form_builder_plugin.md) | 14 US, scope in/out đề xuất, BR-F01…F10, edge case, câu hỏi CONF | BA |
| 02.02 | ANL-S08-002 | [Phân tích plugin workflow](02_analysis/02_ANL-S08-002_workflow_plugin.md) | 13 US, scope in/out đề xuất, BR-W01…W12, phương án quan hệ employee, edge case, câu hỏi CONF | BA |
| 03.01 | BENCH-S08-001 | [Đối chuẩn form builder](03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) | 10 sản phẩm, 12 bài học, khoảng trống cần kiểm chứng thêm | BA |
| 03.02 | BENCH-S08-002 | [Đối chuẩn workflow engine](03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) | 10 nhóm sản phẩm, bảng tổng hợp, 12 bài học, nguồn đã đọc | BA |
| 04.01 | CONF-S08-001 | [Scope, AC & câu trả lời](04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) | ✅ **APPROVED 1.0** — 16/16 câu; 15 AC-F + 15 AC-W + ma trận D/M; rủi ro Q2/Q3/Q4/Q12 | BA + Khách hàng |
| 05.01 | SOL-S08-001 | [Giải pháp tổng thể](05_solutions/01_SOL-S08-001_form_workflow_architecture.md) | 2 plugin + 3 mảnh nền tảng mới; ranh giới; luồng chính; rủi ro | Architect |
| 05.02 | ADR-S08-001 | [Engine state machine](05_solutions/02_ADR-S08-001_workflow_engine_state_machine.md) | Tự viết engine (không BPMN); node/condition/parallel/SLA; Quarkus Scheduler | Architect |
| 05.03 | ADR-S08-002 | [Event Hub & Entity Write Proxy](05_solutions/03_ADR-S08-002_event_hub_entity_write_proxy.md) | Event fan-out qua Core manifest-driven; proxy ghi entity; webhook in/out | Architect |
| 05.04 | ADR-S08-003 | [Form public anonymous](05_solutions/04_ADR-S08-003_public_form_access.md) | Route /public + anonymous session + rate limit + captcha | Architect |
| 05.05 | ADR-S08-004 | [Migration employee (C)](05_solutions/05_ADR-S08-004_employee_migration_cutover.md) | UI giữ nguyên, runtime chuyển engine; import config; cutover/rollback | Architect |
| 06.01 | DES-ARCH-S08-001 | [Kiến trúc thành phần & luồng](06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) | Module mới, sequence, phân quyền, SDK bổ sung, multi-tenant, chiến lược test | Architect |
| 06.02 | DES-DB-S08-001 | [Schema DB](06_designs/db/01_DES-DB-S08-001_form_workflow_schema.md) | 5 bảng form, 6 bảng workflow, 3 bảng Core, migration employee | Architect |
| 06.03 | DES-API-S08-001 | [API contract](06_designs/api/01_DES-API-S08-001_form_workflow_api.md) | API quản trị/public/internal; 4 mẫu response; error codes | Architect |
| 06.04 | DES-UI-S08-001 | [UI/UX](06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) | Route map, builder, fill public, inbox, reports; ma trận D/M | Architect |
| 07.01 | FEAT-39 | [Plugin form core](07_items/FEAT-39_plugin_form_core.md) | Backend + WC build PASS; integration test gắn TR | Developer |
| 07.02 | FEAT-40 | [Plugin workflow core](07_items/FEAT-40_plugin_workflow_core.md) | Engine + services + internal API + WC build PASS | Developer |
| 07.03 | FEAT-41 | [Nền tảng Event Hub & Public](07_items/FEAT-41_platform_event_hub_public.md) | Core Event Hub/Entity Write Proxy/Public Session/SDK — Done (Dev) | Developer |
| 07.04 | FEAT-42 | [Migration employee](07_items/FEAT-42_employee_migration_workflow.md) | Runtime chuyển engine — backend xong, cutover QA còn lại | Developer |
| 08.01 | TP-S08-001 | [Test plan](08_testing/01_TP-S08-001_sprint_08_test_plan.md) | Ma trận AC → TC-N/I/E/B/S | QA |
| 08.02 | TR-S08-001 | [Test report](08_testing/02_TR-S08-001_sprint_08_test_report.md) | 309/309 PASS (N+I); **E2E/browser/security chưa chạy — chưa sign-off** | QA |
| 09.01 | REV-S08-001 | *(chưa soạn — chờ QA sign-off)* | PM DoD + nghiệm thu | PM |

> Bảng đọc là snapshot. Không tạo link giả cho artifact chưa tồn tại; khi tạo file phải cập nhật index trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S08-001) | ✅ **APPROVED 1.0** — 16/16 câu trả lời; chủ dự án duyệt qua hội thoại tương tác (đã nhắc rõ rủi ro Q3) | Chủ dự án | CONF-S08-001 1.0, 2026-11-02 |
| Design ready (SOL/ADR/DES) | ✅ **APPROVED 1.0** — duyệt sau khi bổ sung version semantics (DES 0.2) | Architect + Chủ dự án | Design review 2026-11-02 |
| Implementation | ✅ **Done (QA-ready)** — 322 test PASS (13 unit + 278 core + 31 plugin + 22 E2E runtime) | Developer + QA | TR-S08-001 1.0, 2026-11-02 |
| QA sign-off | 📝 **Reviewed-ready** — TC-E/S/B PASS; 2 bug UI LOW mở (BUG-177/178); chờ chủ dự án review TR | QA + Chủ dự án | TR-S08-001 1.0, 2026-11-02 |
| PM DoD / Customer acceptance | ⏳ Pending | Chủ dự án | — |
| Sprint closure | ⏳ Pending | PM | — |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S08-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used — 0.1 |
| RAW-S08-001 | [01_raw_notes/](01_raw_notes/) | BA | Used — Draft 0.2 (16/16 câu đã trả lời) |
| ANL-S08-001, ANL-S08-002 | [02_analysis/](02_analysis/) | BA | Used — Draft 0.1 |
| BENCH-S08-001, BENCH-S08-002 | [03_benchmarks/](03_benchmarks/) | BA | Used — Draft 0.1 |
| CONF-S08-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used — **APPROVED 1.0** (16/16 câu trả lời + duyệt scope) |
| SOL-S08-001 | [05_solutions/](05_solutions/) | Architect | Used — **APPROVED 1.0** |
| ADR-S08-001…004 | [05_solutions/](05_solutions/) | Architect | Used — **APPROVED 1.0** |
| DES-ARCH/DB/API/UI-S08-001 | [06_designs/](06_designs/) | Architect | Used — **APPROVED 1.0** (DES 0.2) |
| 07.01 | FEAT-39 | [Plugin form core](07_items/FEAT-39_plugin_form_core.md) | Builder/fill/response/mapping/quiz/file — AC-F01…F15 | Developer |
| 07.02 | FEAT-40 | [Plugin workflow core](07_items/FEAT-40_plugin_workflow_core.md) | Engine/definition/instance/task/SLA/webhook — AC-W01…W12, W14, W15 | Developer |
| 07.03 | FEAT-41 | [Nền tảng Event Hub & Public](07_items/FEAT-41_platform_event_hub_public.md) | Core Event Hub/Entity Write Proxy/Public Session/SDK — AC-F04, F14, W04, W12, W14 | Developer |
| 07.04 | FEAT-42 | [Migration employee](07_items/FEAT-42_employee_migration_workflow.md) | Runtime duyệt sang engine — AC-W13 | Developer |
| FEAT-39 | [07_items/FEAT-39_plugin_form_core.md](07_items/FEAT-39_plugin_form_core.md) | Developer | Used — To Do (plugin form: builder/fill/response/mapping/quiz/file) |
| FEAT-40 | [07_items/FEAT-40_plugin_workflow_core.md](07_items/FEAT-40_plugin_workflow_core.md) | Developer | Used — To Do (plugin workflow: engine/definition/instance/task/SLA/webhook) |
| FEAT-41 | [07_items/FEAT-41_platform_event_hub_public.md](07_items/FEAT-41_platform_event_hub_public.md) | Developer | Used — To Do (Core: Event Hub, Entity Write Proxy, Public Session, SDK storage-support) |
| FEAT-42 | [07_items/FEAT-42_employee_migration_workflow.md](07_items/FEAT-42_employee_migration_workflow.md) | Developer | Used — To Do (employee migrate runtime sang workflow engine — phương án C) |

## 5. Liên hệ với các Sprint trước

| Nguồn | Tài sản hiện có | Sprint 08 dùng thế nào |
| :--- | :--- | :--- |
| Sprint 01–02 | `users`, `user_tenants`, RBAC, data scope, `branches`, `departments`, `direct_manager_user_id` | Assignment "quản lý trực tiếp" đọc từ tổ chức; quyền xử lý việc theo role/scope; không tạo user mới trong plugin |
| Sprint 05 | Catalog (`catalog_item_id`) | Form câu hỏi tham chiếu danh mục khi cần (nếu khách duyệt) |
| Sprint 06 | Plugin scaffold, `plugin.json`, Entity Registry, soft ref, WC/MF slots, notification, event/outbox | Cả 2 plugin đóng gói theo platform; trigger workflow đăng ký theo entity đã đăng ký; response form phát event |
| Sprint 07 | Storage signed URL + ClamAV; approval config employee; mobile plugin host | Upload file form; câu hỏi A/B/C về thống nhất luồng duyệt; xử lý việc trên Mobile |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo Sprint-Pack 08: RAW (R1–R3 + 12 câu hỏi mở), ANL-S08-001 (form builder), ANL-S08-002 (workflow), BENCH-S08-001 (10 sản phẩm form), BENCH-S08-002 (10 nhóm sản phẩm workflow); gate Pending; CONF reserved | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-02 |
| 0.2 | 2026-11-02 | Chủ dự án trả lời **16/16 câu** qua hội thoại tương tác (4 vòng); soạn CONF-S08-001 0.1 (scope + 30 AC + ma trận D/M + rủi ro Q2/Q3/Q4/Q12); RAW nâng 0.2 ghi nhận; gate vẫn Pending — chờ duyệt scope & AC | BA Agent; hội thoại tương tác chủ dự án |
| 0.3 | 2026-11-02 | **Scope & AC APPROVED 1.0** — chủ dự án chọn "Duyệt scope" sau khi được nhắc rủi ro Q3; CONF nâng 1.0; bước 05 (SOL) mở cho Architect | BA Agent; hội thoại tương tác chủ dự án |
| 0.4 | 2026-11-02 | Architect khảo sát codebase (nền tảng plugin + employee approval) và soạn **SOL-S08-001 + ADR-S08-001…004 + DES-ARCH/DB/API/UI-S08-001** (Draft 0.1); key findings: chưa có event hub/scheduler — thêm Plugin Event Hub + Entity Write Proxy + Public Session + Quarkus Scheduler; Design **In Review** | Architect; khảo sát repo 2026-11-02 |
| 0.5 | 2026-11-02 | Theo phản hồi chủ dự án về **an toàn dữ liệu theo version form**: bổ sung DES-ARCH §6 (7 quy tắc version semantics — snapshot bất biến, pin draft/response, ref+type bất biến sau publish, mapping/logic theo version), làm rõ DES-DB, DES-API (detail kèm snapshot, CSV/summary đa version), DES-UI; 4 DES nâng **0.2**; Design tiếp tục **In Review** | Architect; phản hồi chủ dự án 2026-11-02 |
| 0.6 | 2026-11-02 | **Design APPROVED 1.0**; cấp **FEAT-39…42** (form / workflow / platform event hub & public / employee migration); bước 07 mở — Developer bắt đầu scaffold + schema + bootstrap trước, item TASK chi tiết cấp khi phân rã | Architect/PM; design review 2026-11-02 |
| 0.7 | 2026-11-02 | **Scaffold 2 plugin PASS**: `plugins/form` + `plugins/workflow` vào `plugins/pom.xml`; manifest 2.0 (entities/queries/permissions/migrations checksum sha256); migration V1.0.0 5+6 bảng; FormDocumentValidator (forward-only logic 2-pass, ref/type immutable) 7/7 + ExpressionEvaluator 6/6 + definition graph validator PASS; `mvn -pl form,workflow -am test` xanh; FEAT-39/40 → In Progress | Developer; working tree |
| 0.8 | 2026-11-02 | **Implementation milestone (backend + WC)**: FEAT-41 Done(Dev) — Core Event Hub (V7.0.8, relay Vert.x), Entity Write Proxy, Public Session + trang public, InternalTenantAdmins, SDK PluginEventPublisher; FEAT-39 backend + WC `op-form-app`/`op-form-fill` build PASS; FEAT-40 engine + services + internal API + WC build PASS; FEAT-42 employee 1.2.0 runtime chuyển engine (V1.2.0, client, event receiver, mirror sync) 18/18 PASS; i18n merge 13 locale; angular.json +2 project; `npm run infra` + full backend test trong TR | Developer; working tree |
| 0.9 | 2026-11-02 | **Test run**: Core **278/278 PASS** (PostgreSQL thật) + employee 18/18 + form 7/7 + workflow 6/6 = **309/309**; soạn TP-S08-001 + TR-S08-001 0.1 — **chưa sign-off** (cutover E2E, browser 2 chế độ, security public còn lại); gate Implementation = Done (Dev) | QA/Developer; npm run infra + mvn test |
| 1.0 | 2026-11-02 | **QA runtime E2E hoàn tất (22/22 + security 5/5 + browser PASS)**: deploy thật 3 plugin (JAR_BUNDLE → runtime deployer), tenant QA sạch mỗi lượt; **7 bug phát hiện & sửa** (relay/publish transaction, jsonb binding, snake_case contract, Map.of NPE, stale-vote approval, bootstrap contract/route/core-url); TR-S08-001 **1.0** chờ review; 2 bug UI LOW mở (BUG-177 i18n public page, BUG-178 contrast); evidence: `evidence/s08_qa_real/` (4 ảnh + e2e_results.json) | QA Agent; scripts/qa/sprint08-e2e.mjs |
