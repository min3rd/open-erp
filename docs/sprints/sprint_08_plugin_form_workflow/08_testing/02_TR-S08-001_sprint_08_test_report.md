# [TR-S08-001] Test Report Sprint 08 — Plugin Form builder & Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S08-001 / Báo cáo kiểm thử / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Reviewed-ready / 1.2 / 2026-11-03 — **chờ chủ dự án review**; toàn bộ màn hình đã test qua browser (§6b); BUG-177/178/180 đã sửa + verify; BUG-179/182 ghi nhận |
| Owner / reviewer | QA Agent / Chủ dự án (người review) |
| Đầu vào | [TP-S08-001](01_TP-S08-001_sprint_08_test_plan.md), baseline working tree 2026-11-02 (commit `afcfdd92` + QA fix loop) |
| Đọc trước / đọc tiếp | [TP-S08-001](01_TP-S08-001_sprint_08_test_plan.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) |

## 1. Môi trường và thời điểm

- Thời điểm chạy: 2026-11-02 (13:00–19:40 +07), nhiều lượt E2E trên stack `npm run dev` Docker.
- Backend: `openerp-backend-dev` :8088 (Quarkus 3.15.1, PostgreSQL `openerp_dev` + Redis thật).
- Plugins runtime: **workflow 1.0.10**, **form 1.0.6**, **employee 1.2.2** — cài vào tenant QA qua flow JAR_BUNDLE (artifact upload → version → publish → entitlement → install → runtime deployer tự build image + `docker run`), container `openerp-plugin-<key>-<ver>` ACTIVE.
- Browser: Chrome headless qua agent-browser (desktop + viewport 390×844).
- Công cụ E2E: `scripts/qa/sprint08-e2e.mjs` (reproducible, tenant sạch mỗi lần chạy, evidence JSON tại `evidence/s08_qa_real/e2e_results.json`).

## 2. Kết quả tổng hợp

| Nhóm | Bộ test | Kết quả |
| :--- | :--- | :--- |
| TC-N Engine thuần | form validator 7/7 + workflow evaluator 6/6 | **13/13 PASS** |
| TC-I Core | `mvn -f src/backend/pom.xml test` (65 class, PostgreSQL thật) | **278/278 PASS** |
| TC-I Plugins | employee 18 + form 7 + workflow 6 | **31/31 PASS** |
| TC-E E2E runtime | `scripts/qa/sprint08-e2e.mjs` — 22 assertion | **22/22 PASS** (chi tiết §4) |
| TC-S Security negative | 5 assertion trong E2E | **5/5 PASS** (chi tiết §5) |
| TC-B Browser | Public fill: desktop + mobile 390×844; console/errors | **PASS** với 2 bug LOW (§6) |

**Tổng: 322 PASS / 0 FAIL** trên PostgreSQL + Redis thật (No H2), kèm 2 bug UI mức LOW mở (BUG-177/178, §6).

## 3. Bugs phát hiện và ĐÃ SỬA trong phiên QA (7 bug)

| # | Bug | Mức | Fix |
| :--- | :--- | :--- | :--- |
| 1 | `PluginEventRelayJob` chạy Panache ngoài transaction → relay chết im lặng | High | Wrap `QuarkusTransaction.requiringNew()` theo pattern `AuditMaintenanceJob` (BUG-82) |
| 2 | `InternalPluginEventResource.publish` persist thiếu `@Transactional` → mọi publish 500 (`Unsupported Types value: 2000` — entity field `Object` không map được jsonb) | High | `@Transactional` + `PluginEvent.payload` đổi `String` + `@JdbcTypeCode(SqlTypes.JSON)` |
| 3 | jsonb descriptor params thiếu `"type":"jsonb"` → gateway bind varchar → Postgres type error trên mọi insert/update có JSON | High | Đánh dấu 17 params qua `scripts/qa/fix-sprint08-jsonb-params.mjs`; services truyền JSON string (`writeJson`) |
| 4 | Response/Request records thiếu `@JsonProperty` snake_case → body bind null (`TENANT_SLUG_REQUIRED`, `definition_key is required`...) | High | Gắn `@JsonProperty`/`@JsonNaming` toàn bộ records mới (core + 3 plugin) |
| 5 | `Map.of(...)` NPE khi giá trị null (description/due_at/vote_ratio/task_id/actor null) tại engine + form services | Medium | Chuyển `java.util.HashMap` các điểm có null |
| 6 | `approvalComplete` đánh giá snapshot task cũ (votes rỗng) → duyệt xong instance không chuyển bước | High | Reload task sau `addVote` trước khi đánh giá |
| 7 | Bootstrap contract sai: core gọi `{container}/internal/tenant/bootstrap` (root) trong khi plugin đăng ký dưới `/api/v1/<key>/...`; route `/api/v1/employee/internal` che khuất endpoint cũ (405); `WorkflowApprovalClient` trỏ port 8088 (host) thay vì `backend-dev:8080` (in-network); hub deliver sai path receiver (`/api/v1/internal/events` ≠ convention `/api/v1/{plugin}/internal-events`) | High | Tách root bootstrap resource cho 3 plugin; đổi route employee sang `/internal-events`; chuẩn hóa receiver path + config `${OPENERP_CORE_URL:http://backend-dev:8080}` |

## 4. TC-E — E2E runtime chi tiết (22/22 PASS, lần chạy cuối tenant `qa-s08-mvza…`/id `6587f521`)

| TC | Assertion | Kết quả |
| :--- | :--- | :--- |
| E-workflow / E-form / E-employee | Cài 3 plugin qua runtime deployer, container ACTIVE | ✅×3 |
| TC-E0 | Bootstrap seed `employee-profile-change` PUBLISHED | ✅ |
| TC-E2.1 | Tạo form qua runtime gateway | ✅ |
| TC-E2.2 | Publish form | ✅ |
| TC-E2.3/2.4 | Định nghĩa luồng `form-intake-approval` published + trigger `form.response.submitted` đăng ký | ✅×2 |
| TC-E2.5 | Anonymous public session phát hành (token rỗng quyền, TTL 15') | ✅ |
| TC-E2.6 | View public trả đúng document published | ✅ |
| TC-E2.7 | Submit ẩn danh nhận response + `entity_write=SKIPPED` (không mapping) | ✅ |
| TC-E2.8 | **form response → Event Hub → trigger → workflow instance mở** | ✅ instance RUNNING |
| TC-E2.9 | Task approval gán đúng USER cấu hình | ✅ |
| TC-E2.10 | Action APPROVE áp dụng (engine chặn tự duyệt + enforce assignee) | ✅ |
| TC-E2.11 | Instance COMPLETED `APPROVED` sau duyệt | ✅ |
| TC-E1.1 | Employee self change request mở qua engine (không còn luồng nội bộ riêng) | ✅ |
| TC-E1.2 | Change request gắn `workflow_instance_id` trong tenant schema | ✅ |

Event log đối chiếu DB: `plugin_events` → `plugin_event_deliveries` DELIVERED → `plg_workflow_instances` RUNNING → COMPLETED `APPROVED`; `plg_workflow_events` append-only đầy đủ (INSTANCE_STARTED → TASK_ASSIGNED → TASK_ACTION → INSTANCE_COMPLETED).

## 5. TC-S — Security negative (5/5 PASS)

| TC | Assertion | Kết quả |
| :--- | :--- | :--- |
| TC-S1 | Trùng `idempotency_key` trả cùng response, không nhân bản | ✅ |
| TC-S2 | Engine từ chối approver ngoài assignee (`WORKFLOW_TASK_NOT_ASSIGNEE` — **bảo vệ mới, employee cũ không có**) | ✅ |
| TC-S3 | Public session tenant lạ → 404 `PUBLIC_TENANT_NOT_FOUND` | ✅ |
| TC-S4 | Anonymous token gọi API quản trị → 401/403 (rỗng quyền) | ✅ |
| TC-S5 | Burst public-session → 429 `PUBLIC_RATE_LIMITED` | ✅ |

## 6. TC-B — Browser hai chế độ (evidence `evidence/s08_qa_real/`)

| Màn | Kết quả | Evidence |
| :--- | :--- | :--- |
| Public fill desktop (1264px viewport) | Render đúng sau fix: card trắng viền xám, heading/label màu đậm #1c1917, nút Submit dịch đúng theo locale browser | `browser_public_fill_desktop_bugfix.png` |
| Submit → màn cảm ơn + mã tham chiếu (i18n "Thank you for your response!" / "Reference:") | ✅ response id hiển thị | `browser_public_submit_done_bugfix.png` |
| Mobile 390×844 | Card vừa khít 390px, **không tràn ngang**, label/contrast đạt AA trên nền sáng | `browser_public_fill_mobile_bugfix.png` |
| Console errors | 0 lỗi console trên public page | `agent-browser console/errors` rỗng |

**BUG-177 (i18n public page) — ĐÃ SỬA & verify:** WC public không có host i18n bootstrap → nút hiển thị key. Fix: `I18nService.setDictionary()` (shared) + `op-form-fill` tự fetch dictionary qua `/api/v1/plugins/runtime/form/i18n/{lang}.json?plugin_token=` theo locale browser (vi/en), đăng ký vào shared service trước khi render.

**BUG-178 (contrast) — ĐÃ SỬA & verify:** Public HTML có `color-scheme: light dark` + thiếu text color → headless/dark UA render chữ trắng trên nền xám. Fix: ép `color-scheme: light` + `color: #1c1917` toàn trang; `styles.css` của plugin bỏ var-fallback, dùng màu tắt đậm; public page nạp `styles.css` qua runtime gateway (trước đây styles.css không được load ở trang public).

## 6b. TC-B mở rộng — Ma trận màn hình đã test (browser walkthrough đăng nhập thật)

Môi trường: Chrome qua agent-browser, host `localhost:4200`, tenant `qa-s08-mvzantur` (TENANT_ADMIN), plugins: form 1.0.8 + workflow 1.0.13 + employee 1.2.2. Stack `npm run dev` — một lần chết trước đó do backend OOM (Exit 137) sau áp lực container, đã restart sạch.

| # | Màn hình | Đã test | Kết quả | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Login + workspace | Đăng nhập bằng form UI (email/mật khẩu), chuyển hướng đúng workspace | ✅ | `browser_01_login_workspace.png` |
| 2 | `/apps/form` — tab Biểu mẫu | Bảng form: slug/tiêu đề/trạng thái/version; nút Mở, Tạo biểu mẫu | ✅ | `browser_02_form_tab_forms.png` |
| 3 | `/apps/form` — tab Thiết kế (builder) | Mở form PUBLISHED: slug + **title + document JSON đầy đủ** (sau fix BUG-181); nút Lưu/Phát hành/Đóng thu | ✅ | `browser_03_form_tab_builder_fixed.png` |
| 4 | `/apps/form` — tab Câu trả lời | Bảng responses: 4 lượt (browser submit + E2E), answers JSON, entity_write, version | ✅ | `browser_04_form_tab_responses.png` |
| 5 | `/apps/form` — tab Tổng hợp | Summary per-question | ✅ | `browser_05_form_tab_summary.png` |
| 6 | `/apps/workflow` — tab Việc của tôi | Inbox: 2 task triage PENDING từ instance EVENT; mở drawer duyệt | ✅ | `browser_06_workflow_inbox.png` |
| 7 | Drawer xử lý task | Textbox Ý kiến + nút Đồng ý/Từ chối/Nhận việc/Đóng | ✅ | `browser_07_workflow_approve_drawer.png` |
| 8 | **Duyệt task qua UI** | Điền ý kiến + Đồng ý → task COMPLETED → instance COMPLETED APPROVED | ✅ | `browser_09_workflow_approve_ui_success.png` |
| 9 | `/apps/workflow` — tab Lượt chạy | 4 instance: 2 COMPLETED APPROVED + 2 RUNNING; trigger EVENT/API hiển thị | ✅ | `browser_10_workflow_run_timeline.png` |
| 10 | Public fill desktop | Điền + submit + màn cảm ơn i18n | ✅ | `browser_public_*_bugfix.png` |
| 11 | Public fill mobile 390×844 | Không tràn ngang, contrast AA | ✅ | `browser_public_fill_mobile_bugfix.png` |

Console: 0 lỗi console trên toàn bộ màn hình (chỉ vite debug noise của ng serve).

### Bugs phát hiện trong walkthrough (đã sửa hoặc ghi nhận)

| # | Bug | Mức | Trạng thái |
| :--- | :--- | :--- | :--- |
| BUG-181 | **Mở form từ danh sách nạp builder rỗng** (list payload không có document + DTO `title` ≠ model `title_text`) — admin bấm Lưu sẽ **xóa sổ document PUBLISHED** | HIGH | **Đã sửa**: `openBuilder` fetch full definition qua GET trước khi render; DTO đổi `titleText` (snake `title_text`); verify: builder nạp đủ items |
| BUG-180 | Workflow WC đọc `context.userId` (host không có field này) → nút Đồng ý/Từ chối silently no-op | MEDIUM | **Đã sửa**: đọc `context.user.id`; verify: duyệt qua UI hoàn tất instance COMPLETED APPROVED |
| BUG-179 | Core JWT hết hạn 15 phút giữa phiên → mọi API 401 `UNAUTHORIZED` mà không redirect về login (host-wide, ảnh hưởng mọi plugin) | MEDIUM | Ghi nhận — workaround: đăng nhập lại; đề xuất shared ApiService thêm 401-redirect-to-login (host-wide, sprint sau) |
| BUG-182 | Sidebar host hiển thị key `PLUGIN_FORM_MENU`/`PLUGIN_WORKFLOW_MENU` thay vì bản dịch — web-dev container copy i18n lúc build, file merge sau đó không propagate vào container | LOW | Ghi nhận — chỉ env dev (rebuild web-dev image sẽ hết); production build chứa đủ keys |

### Plugins đã nâng cấp trong walkthrough

- form **1.0.8** (BUG-181 fix) — upgrade qua `POST /tenant/plugins/form/upgrade {target_version}` → container mới ACTIVE
- workflow **1.0.13** (BUG-180 fix) — upgrade tương tự → ACTIVE
- employee 1.2.2 giữ nguyên

## 7. Chưa chạy / giới hạn

1. **Khởi tạo instance song song (fork/join)** và **VOTE_RATIO/countersign** có unit test (engine thuần) nhưng chưa có E2E riêng — đề xuất bổ sung khi có nghiệp vụ thật dùng đến.
2. **Reminder trước hạn** đã có `due_at` + `overdue_at` + SLA scan Core-driven; kịch bản "nhắc trước hạn" cần chờ thời gian thực để quan sát (không thể rút ngắn trong E2E).
3. Web app Angular host (:4200) với đăng nhập admin qua UI — WC đã build và mount được qua gateway (session-token flow), việc duyệt qua UI tương đương API đã test; đề xuất QA thực hiện 1 lượt click-through trước nghiệm thu.

## 8. Kết luận

**QA PASS**: toàn bộ nhóm test xanh — 13 unit + 278 core + 31 plugin + 22 E2E runtime + 5 security + browser walkthrough 11 màn hình (đăng nhập thật, cả desktop lẫn mobile). Chuỗi giá trị Sprint 08 chạy được end-to-end trên runtime thật: **form public → event hub → workflow engine → duyệt qua UI → instance COMPLETED APPROVED**, và **employee change-request chạy trên engine dùng chung**.

**Tổng cộng 11 bug phát hiện trong QA**: 9 đã sửa + verify (BUG-177/178/180/181 + 5 bug nền tảng ở §3), 2 ghi nhận không chặn (BUG-179 MEDIUM host-wide — đề xuất sprint sau; BUG-182 LOW dev-env). **Không còn item chặn QA sign-off** — chờ chủ dự án review báo cáo này.
