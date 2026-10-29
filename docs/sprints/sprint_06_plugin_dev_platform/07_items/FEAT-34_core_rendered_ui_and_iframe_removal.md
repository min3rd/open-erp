# [FEAT-34] Core render UI extension & bỏ iframe

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-34 / Feature / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — TASK-414…423 Done; 22/22 AC PASS; 7 bug Resolved / 1.1 / 2026-10-29 |
| Owner / reviewer | PM + Architect / Chủ dự án |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, [00_READING_GUIDE](../00_READING_GUIDE.md) |
| Đọc trước / đọc tiếp | Các task con bên dưới |


## 1. Mục tiêu

Core sở hữu slot + renderer; plugin đăng ký contribution; bỏ iframe; migrate catalog sang Web Component.

## 2. Task con

- [TASK-414](TASK-414_manifest_2_0_ui_manifest_api.md) — Manifest 2.0 + UI Manifest API
- [TASK-415](TASK-415_slot_registry_seed_plugin_hosted_slot_sync.md) — Slot registry seed + plugin-hosted slot sync
- [TASK-416](TASK-416_shared_pluginslotcomponent_outlet_loaders.md) — Shared PluginSlotComponent + outlet + loaders
- [TASK-417](TASK-417_header_slot_settings_system_tabs.md) — Header slot + /settings/system tabs
- [TASK-420](TASK-420_catalog_web_component_migration.md) — Catalog Web Component migration
- [TASK-421](TASK-421_remove_iframe_enum_loader_regression.md) — Xoá IFRAME enum/loader + regression
- [TASK-422](TASK-422_update_developer_user_deployment_docs.md) — Cập nhật developer/user/deployment docs
- [TASK-423](TASK-423_qa_test_plan_report_sprint_06.md) — QA test plan/report Sprint 06

## 3. Tiêu chí nghiệm thu

- 4 slot Core render được contribution WC/MF; plugin-hosted slot sync/contract đúng.
- Header + `/settings/system` tab hoạt động; tắt plugin ẩn contribution.
- Catalog chạy WC; IFRAME bị xoá khỏi code/template.
- QA desktop/mobile PASS; docs cập nhật.

## 4. Phụ thuộc & ghi chú

- Phụ thuộc: CONF-S06-001 1.0; ADR-S06-001/002, DES-API/DB/UI-S06
- Task 414–417, 420–423; TASK-420/421 là Critical path.
- Design đã duyệt; task là kế hoạch triển khai, trạng thái Done phải có bằng chứng.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 0.4 | 2026-10-29 | QA desktop PASS; mobile FAIL BUG-154/155/156/157; catalog metadata BUG-158; QA sign-off blocked | QA; TR-S06-001 1.1 |
| 1.0 | 2026-10-29 | Fix toàn bộ bug + AC-05/11/16; 19/19 AC PASS; Done (QA) | QA/Developer; TR-S06-001 1.2 |
| 1.1 | 2026-10-29 | Q19/Q20 + final QA: 22/22 AC PASS; notification drawer, old table/API removed; Sprint CLOSED | QA/PM; TR-S06-001 1.5, REV-S06-001 |
