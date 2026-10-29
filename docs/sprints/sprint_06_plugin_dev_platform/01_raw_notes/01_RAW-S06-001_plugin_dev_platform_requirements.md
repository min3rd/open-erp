# [RAW-S06-001] Yêu cầu gốc Sprint 06 — Nền tảng phát triển plugin & Core render UI extension

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S06-001 / Yêu cầu gốc / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-29 |
| Owner / reviewer | BA Agent / Chủ dự án |
| Đầu vào | Chỉ đạo trực tiếp của chủ dự án trong phiên làm việc 2026-10-29 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [ANL-S06-001](../02_analysis/01_ANL-S06-001_template_and_cli_interactive.md), [ANL-S06-002](../02_analysis/02_ANL-S06-002_core_rendered_ui_slots.md), [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) |

## 1. Nguyên văn yêu cầu

> “sprint 6 gồm các công việc sau: cập nhật template để phù hợp với kiến trúc plugin vừa đổi ở sprint 5; cli cung cấp interact để develop thực hiện tạo 1 plugin, tạo entity, tạo các field, validate, quan hệ giữa các entity trong core, plugin khác, tạo các màn crud cho entity; hoàn thiện cơ chế render, hiện tại plugin danh mục mới thêm 1 menu riêng và dùng iframe, tuy nhiên mình muốn thế này. Ví dụ sẽ làm 1 plugin là in app notification, plugin này sẽ đăng ký thêm 1 component lên header của layout, đăng ký thêm 1 tab cấu hình trong mục cấu hình hệ thống. Nhưng mà plugin chỉ đăng ký vị trí, có mẫu component để render vào vị trí đó, còn core mới là tác nhân thực hiện render lên layout, lên màn hình cấu hình hệ thống. Hãy viết tài liệu và tạo thành interact câu hỏi để mình trả lời”

## 2. Bóc tách yêu cầu

| ID | Yêu cầu | Diễn giải | Ưu tiên dự kiến |
| :--- | :--- | :--- | :--- |
| **R1** | Cập nhật template theo kiến trúc plugin Sprint 05 | Template CLI phải sinh plugin **zero-DB** đúng ADR-S05-001/002 và TASK-402: không Panache/JDBC/Flyway/datasource/`TENANT_ID`; dùng `plugin-sdk`, `migrations/` + checksum, `plugin.json.entities/queries/ui_manifest`, web plugin có Tailwind entry riêng. | High |
| **R2** | CLI cung cấp interact | Developer chạy CLI dạng hỏi–đáp để: tạo plugin; tạo entity; tạo field; khai báo validate; khai báo quan hệ entity với Core/plugin khác; sinh màn CRUD cho entity. | High |
| **R3** | Hoàn thiện cơ chế render | Plugin **chỉ đăng ký vị trí (slot)** và cung cấp component mẫu. Core đọc manifest, kiểm tra điều kiện và **render component vào layout** (ví dụ header) hoặc **tab trong màn cấu hình hệ thống**. | High |
| **R4** | Ví dụ tham chiếu in-app notification | Plugin `in-app-notification` là ví dụ: đăng ký 1 component ở header + 1 tab cấu hình. Dùng để chứng minh cơ chế, không nhất thiết thay thế notification hiện có của Core. | Medium |

## 3. Hiện trạng liên quan (ghi nhận nhanh)

| Chủ đề | Hiện trạng | Nguồn |
| :--- | :--- | :--- |
| Template CLI | Vẫn sinh Panache + JDBC + Flyway + datasource + `TENANT_ID`; entity có `tenant_id`; chưa có CRUD/validator/relation | `tools/open-erp-cli/src/lib/templates.js`, `tools/open-erp-cli/src/commands/generate.js`; [TASK-407](../../sprint_05_catalog_plugin/07_items/TASK-407_cli_scaffold_zero_db.md) |
| CLI interact | `create` chỉ hỏi id/name/description; `generate` chạy bằng flag, không có wizard chung | `tools/open-erp-cli/src/commands/create.js`, `generate.js` |
| Manifest UI | Backend đã trả `screens` + `slots` + `contributions`; frontend chỉ dùng `screens` | `PluginUiManifestService.java`, `plugin-host.model.ts` |
| Slot frontend | Chưa có `PluginSlotComponent`/`ContributionOutlet`; chưa render contribution | `src/frontend/shared/plugin-host/` |
| Catalog | Screen riêng + iframe toàn màn hình | `plugins/catalog/plugin.json`, `plugin-screen-host.component.ts` |
| Màn cấu hình hệ thống | Chưa có trang tab cấu hình; settings hiện là menu + router-outlet | `settings-layout.component.ts` |

## 4. Phạm vi dự kiến (chưa chốt)

**Trong phạm vi đề xuất**

1. Template plugin thế hệ mới (zero-DB) + cập nhật tài liệu tạo plugin.
2. CLI interactive: wizard tạo plugin, entity, field/validator, quan hệ, CRUD; giữ chế độ `--non-interactive` cho CI.
3. Core slot runtime: slot registry do Core sở hữu; contribution do plugin khai báo; `PluginSlotComponent` render header + tab cấu hình; error boundary + permission + lifecycle.
4. Plugin mẫu chứng minh cơ chế (in-app notification hoặc plugin demo tương đương).
5. Cập nhật developer guides, user guide, test/QA browser desktop + mobile.

**Ngoài phạm vi đề xuất (chờ chốt)**

- Migrate toàn bộ `catalog` khỏi iframe sang WC/MF trong Sprint 06.
- Cho phép plugin tự khai báo slot mới (plugin làm host) — có thể để sprint sau.
- Marketplace/registry nâng cao, K8s staging, upgrade/rollback 2 version.
- Viết lại notification hiện có của Core thành plugin.

## 5. Giả định và ràng buộc

| # | Giả định/ràng buộc | Ảnh hưởng nếu sai |
| :--- | :--- | :--- |
| A1 | Plugin vẫn là package/container độc lập, UI bundle riêng; Core không import source plugin. | Phải đổi kiến trúc render và build. |
| A2 | Core sở hữu danh sách slot cố định; plugin chỉ chọn slot có sẵn. | Nếu plugin cần slot riêng, phải thêm cơ chế plugin-host slot. |
| A3 | Contribution chạy trong origin Core (Web Component/Module Federation) là chấp nhận được với error boundary + CSP. | Nếu không, phải dùng iframe sandbox cho slot (khó về kích thước/UX). |
| A4 | CRUD chuẩn có thể sinh từ metadata entity/field; màn đặc biệt vẫn được viết tay. | Nếu không, CLI phải sinh mã Angular/Java nhiều hơn. |
| A5 | Quan hệ entity xuyên plugin là **soft reference** qua Entity Registry, không FK xuyên schema. | Nếu cần FK, phải thay đổi mô hình schema/gateway. |
| A6 | Sprint 06 không phá vỡ plugin `catalog` đang chạy. | Phải có migration/rollback và QA hồi quy. |

## 6. Câu hỏi mở

Toàn bộ 16 câu hỏi và đề xuất nằm tại [CONF-S06-001 §3](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md). Tám câu chặn thiết kế:

| # | Câu hỏi | Vì sao chặn |
| :--- | :--- | :--- |
| Q1 | Có gói cả 3 luồng trong Sprint 06 không? | Quyết định số sprint và thứ tự ưu tiên. |
| Q2 | Giữ iframe cho màn hình plugin hay chuyển sang WC/MF? | Quyết định phạm vi render và QA. |
| Q3/Q4 | Slot do ai sở hữu; slot nào có trong v1? | Quyết định contract và vị trí render. |
| Q5 | “Màn cấu hình hệ thống” là trang mới hay trang hiện có? | Quyết định route/UI và AC. |
| Q7/Q8 | CRUD sinh mã hay render từ metadata; backend CRUD dùng chung hay sinh riêng? | Quyết định khối lượng code và độ linh hoạt. |
| Q9 | Quan hệ entity Core/plugin khác: soft ref hay FK? | Quyết định manifest, DB, validation. |
| Q10/Q11 | CLI wizard chạy thế nào; có migrate plugin cũ không? | Quyết định UX và phạm vi template. |
| Q12/Q13 | Plugin mẫu nào; có migrate catalog không? | Quyết định demo/QA và rủi ro hồi quy. |

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Ghi nguyên văn yêu cầu; bóc tách R1–R4; ghi hiện trạng, phạm vi/giả định nháp và câu hỏi mở | BA Agent; chỉ đạo trực tiếp chủ dự án |
