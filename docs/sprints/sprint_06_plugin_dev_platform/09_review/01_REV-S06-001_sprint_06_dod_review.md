# [REV-S06-001] Nghiệm thu & đóng Sprint 06 — Nền tảng phát triển plugin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S06-001 / Sprint review & DoD / Sprint 06 |
| Trạng thái / phiên bản / ngày | **CLOSED — APPROVED** / 1.1 / 2026-10-29 |
| Owner / reviewer | PM / Chủ dự án (Product Owner) + Architect + QA |
| Phạm vi | 22 AC của [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.2; FEAT-33…35, TASK-408…424 |
| Baseline | `986a271b` + working tree ngày 2026-10-29 (docs/plugin 1.0.7/catalog 1.0.9) |
| Evidence | [TR-S06-001](../08_testing/02_TR-S06-001_sprint_06_test_report.md) 1.6; [TP-S06-001](../08_testing/01_TP-S06-001_sprint_06_test_plan.md) 1.6; `08_testing/evidence/sprint_06_q19/`, `sprint_06_drawer/`, `sprint_06_final/`, `sprint_06_post_closure/` |

## 1. Tóm tắt điều hành

- **Sprint 06 CLOSED 2026-10-29** theo chỉ đạo trực tiếp của chủ dự án (“đóng sprint 6 tại đây”), sau PM DoD PASS.
- Ba luồng đã hoàn tất: **template 2.0 zero-DB**, **CLI tương tác/generate/validate/upgrade**, **Core render UI extension** (slot/contribution, WC/MF, bỏ iframe).
- Danh mục `catalog` đã là plugin Web Component **1.0.9**; `in-app-notification` **1.0.7** là nguồn thông báo duy nhất (bell drawer, platform defaults + tenant override).
- **0 bug Critical/High mở**. 7 bug BUG-154…160 đã Resolved (QA).
- **22/22 AC PASS**; backend **32/32** targeted tests; CLI **11/11**; web/mobile build PASS; i18n 13/13; desktop 1440×900 + mobile 390×844 **0 console error**, overflow 0, touch ≥40px.
- Bảng `tenant_notifications` cũ đã bị drop bằng `V6.2.0`; API notification Core cũ đã bỏ.

## 2. Trace 22 AC

| AC | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| AC-01 | ✅ PASS | Template backend zero-DB; `mvn package` PASS (TR §2; TASK-408) |
| AC-02 | ✅ PASS | CLI `create` sinh entity/manifest/migration/POJO/permission; CLI tests 11/11 |
| AC-03 | ✅ PASS | `generate field` đồng bộ manifest/entity/migration; CLI tests 11/11 |
| AC-04 | ✅ PASS | `generate relation` FK + soft-ref; `validate` từ chối target sai; CLI tests 11/11 |
| AC-05 | ✅ PASS | Browser list → drawer → tạo `QA-INV-001`; generated Java/Angular build PASS |
| AC-06 | ✅ PASS | `validate` offline + `--core-url`; 11/11 CLI tests |
| AC-07 | ✅ PASS | Header contribution render từ manifest; 0 import source plugin |
| AC-08 | ✅ PASS | Tab `core.settings.system.tabs`; `?tab=notification-settings` giữ sau reload |
| AC-09 | ✅ PASS | Tắt plugin → bell/tab mất; bật lại → xuất hiện; browser PASS |
| AC-10 | ✅ PASS | User thiếu quyền không thấy contribution; API 403 đúng contract |
| AC-11 | ✅ PASS | Contract mismatch + entry 404 bị skip + log; layout vẫn hoạt động |
| AC-12 | ✅ PASS | Desktop + mobile 390×844: 0 console error, overflow 0; i18n 13 locale |
| AC-13 | ✅ PASS | [UG-S06-001](../../../06_user_guides/sprint_06_plugin_ui_extension_user_guide.md) 1.4 + 13 ảnh; developer/deployment/CLI docs đồng bộ |
| AC-14 | ✅ PASS | Catalog WC 1.0.9 chạy desktop/mobile; regression browser PASS |
| AC-15 | ✅ PASS | `PluginRenderMode.IFRAME` + loader/branch bị xoá; catalog dùng WC |
| AC-16 | ✅ PASS | Plugin-hosted slot + `PluginSlotComponent`; test lifecycle PASS |
| AC-17 | ✅ PASS | Notification 1.0.7: header bell, tab cấu hình, screen list/drawer; bật/tắt theo lifecycle |
| AC-18 | ✅ PASS | Catalog migrate template 2.0; build + test PASS; API contract giữ nguyên |
| AC-19 | ✅ PASS | Mobile header contribution; overflow 0; touch ≥40px |
| AC-20 | ✅ PASS | `app-notification-bell`/`app-notification-banner` = 0; API `tenant/notifications` bỏ; bảng drop |
| AC-21 | ✅ PASS | Platform defaults API/UI; tenant inherit/override độc lập, lưu bền |
| AC-22 | ✅ PASS | Bell mở drawer, route không đổi; “Xem tất cả” mới sang trang; drawer 19/19 check PASS |

## 3. DoD có bằng chứng

| Điều kiện | Kết quả thực tế | Bằng chứng/baseline | Đánh giá |
| :--- | :--- | :--- | :--- |
| Critical chưa Done | 0 | TASK-420/421 Done; BUG-154/155/160 Resolved | ✅ PASS |
| High chưa Done (kể cả task con) | 0 | TASK-408…424 Done (QA/docs); FEAT-33…35 Done | ✅ PASS |
| Backend tests PostgreSQL/Redis thật | 32/32 PASS | lifecycle 13 + gateway 18 + manifest 1; [`backend-test.log`](../08_testing/evidence/sprint_06_drawer/backend-test.log) | ✅ PASS |
| Browser Web Desktop / Mobile Ionic | Desktop 1440×900 + mobile 390×844 PASS | [TR-S06-001](../08_testing/02_TR-S06-001_sprint_06_test_report.md) 1.6; [`drawer-results.json`](../08_testing/evidence/sprint_06_drawer/drawer-results.json) 19/19; 0 console error/overflow 0 | ✅ PASS |
| AC coverage, guides có ảnh, docs/link | 22/22 AC; UG 1.4 + 13 ảnh | TR/TP 1.5; link check PASS; `/platform/notification-settings` + bell drawer có ảnh | ✅ PASS |
| Medium/Low chuyển tiếp có owner/đích | 0 item mở | TASK-422 Medium Done (docs); không có deferral | ✅ PASS |
| PM DoD | PASS 2026-10-29 | Mục 5 | ✅ PASS |
| Khách hàng nghiệm thu | APPROVED 2026-10-29 | Chỉ đạo trực tiếp của chủ dự án | ✅ PASS |
| Sprint closure | CLOSED 2026-10-29 | Mục 5 | ✅ PASS |

## 4. Backlog chuyển tiếp

Không có task/bug Medium/Low mở trong Sprint 06. Các ghi chú kỹ thuật không phải item:

- Sự kiện force-uninstall/recovery của Plugin Manager hiện chỉ ghi audit; nếu cần đẩy sang `in-app-notification` thì tạo task tích hợp Core → plugin runtime ở sprint sau.
- Registry local dev dùng `OPENERP_PLUGIN_REGISTRY_ALLOWED_HOSTS=openerp-registry.local` và `OPENERP_PLUGIN_OCI_RESOLVE_DIGEST=false`; không dùng cấu hình này cho staging/production.

### 4.1. Post-closure — 2026-10-29

- [TASK-425](../07_items/TASK-425_remove_plugin_screen_host_header.md) (Low): bỏ header Core “tên screen + pluginKey + Về danh sách plugin” khỏi mọi màn hình plugin; web build + browser PASS, 0 console error. Sprint vẫn **CLOSED**; không có Critical/High.

## 5. Quyết định và xác nhận

| Quyết định | Trạng thái | Người/ngày/nguồn |
| :--- | :--- | :--- |
| QA sign-off | ✅ **PASS** — 0 Critical/High; 22/22 AC | QA / TR-S06-001 1.5 / 2026-10-29 |
| PM DoD | ✅ **PASS 2026-10-29** | PM / REV-S06-001 1.0 |
| Customer acceptance | ✅ **APPROVED 2026-10-29** — “đóng sprint 6 tại đây” | Chủ dự án / chỉ đạo trực tiếp |
| Sprint closure | ✅ **CLOSED 2026-10-29** | PM / sau PM DoD + nghiệm thu |
| Post-closure fix | ✅ **TASK-425 Done (QA)** — bỏ header host plugin | Developer/QA / 2026-10-29 |

## 6. Release notes

- **Template 2.0 zero-DB**: plugin `pom.xml`, POJO + `PluginDataClient`, migrations + checksum, Web Component entry, deploy/CI mẫu.
- **CLI**: wizard/`--interactive`, `generate entity|field|relation|crud|menu|ui-contribution`, `validate` offline/`--core-url`, `upgrade --check/--apply`, `package`, `publish`, `dev`; smoke 11/11.
- **Slot runtime**: `PluginSlotComponent`, contribution outlet, WC/MF loader, context bridge, permission/platform/contract filtering, error boundary/timeout; plugin-hosted slots.
- **Catalog**: migrate iframe → Web Component 1.0.9; desktop + mobile read-only WC.
- **Notification**: `in-app-notification` 1.0.7; bell drawer + “Xem tất cả”; platform defaults `/platform/notification-settings`; tenant inherit/override; bỏ bell/banner Core và bảng `tenant_notifications`.
- **Docs**: user guide 1.4 (13 ảnh), developer/deployment/CLI docs cập nhật; bỏ hướng dẫn iframe/CORE_IN_PROCESS.

## 7. Retrospective

**Điểm tốt**
- QA dual-mode phát hiện sớm lỗi mobile (BUG-154…157) và CRUD bundle (BUG-160); sửa trước sign-off.
- Slot runtime + plugin thật (`in-app-notification`) chứng minh contract end-to-end, không chỉ mock.
- Manifest/CLI validate chặn lỗi checksum/slot/relation trước khi publish.

**Vấn đề**
- Drawer mobile bị Ionic `contain: content` kẹp trong toolbar; phát hiện khi QA AC-22 và đã sửa bằng portal ra `body`.
- Tài liệu walkthrough/reading guide cũ còn trạng thái Sprint 03/04; đã rà và cập nhật khi đóng sprint.

**Hành động**
- Giữ checklist QA dual-mode + kiểm tra full-height overlay cho mọi drawer phát sinh từ header.
- Khi thêm sự kiện vận hành plugin mới, ghi audit trước; tích hợp notification qua task riêng.

## 8. Nguồn đọc tiếp

- [00_READING_GUIDE](../00_READING_GUIDE.md)
- [TR-S06-001](../08_testing/02_TR-S06-001_sprint_06_test_report.md)
- [UG-S06-001](../../../06_user_guides/sprint_06_plugin_ui_extension_user_guide.md)
- [Create plugin guide](../../../08_developer_guides/create_new_plugin_guide.md)
- [CLI README](../../../../tools/open-erp-cli/README.md)

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-29 | Đóng Sprint 06: 22/22 AC, 0 Critical/High, PM DoD + khách hàng nghiệm thu | Chủ dự án; TR-S06-001 1.5 |
| 1.1 | 2026-10-29 | Post-closure TASK-425: bỏ header host khỏi plugin screen; giữ trạng thái CLOSED | Chủ dự án; TASK-425 |
