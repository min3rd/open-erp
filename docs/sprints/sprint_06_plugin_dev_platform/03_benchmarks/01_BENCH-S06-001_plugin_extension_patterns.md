# [BENCH-S06-001] Đối chuẩn mô hình extension UI & CLI plugin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S06-001 / Đối chuẩn / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-29 |
| Owner / reviewer | BA Agent / Architect |
| Đầu vào | [RAW-S06-001](../01_raw_notes/01_RAW-S06-001_plugin_dev_platform_requirements.md), [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [SOL-S06-001](../05_solutions/01_SOL-S06-001_template_and_cli_architecture.md), [ADR-S06-001](../05_solutions/02_ADR-S06-001_core_rendered_ui_slots.md) |

## 1. Mục đích

Đối chiếu cách các nền tảng lớn tổ chức **UI extension** và **CLI scaffold** để kiểm chứng mô hình đã chọn: Core sở hữu khung render, plugin đăng ký contribution, không iframe cho widget nhỏ, CLI hỏi–đáp sinh mã.

## 2. Bảng đối chuẩn

| Nền tảng | Slot/extension | Plugin đăng ký gì | Core render thế nào | Bài học |
| :--- | :--- | :--- | :--- | :--- |
| **Backstage** | `Page`, `EntityCard`, `SettingsLayout`, `NavItem` | Component + route + permission | Core app compose theo extension point; plugin package riêng | Slot có contract rõ; plugin không tự sửa layout Core |
| **Grafana** | `AppPlugin.addComponent`, extension points | React component + meta | Grafana render trong page/panel đã định | Widget nhúng dùng chung khung; full page vẫn là route riêng |
| **VS Code** | View container, command, menu contribution | Declarative `package.json` + activation | Workbench render theo contribution point | Manifest khai báo vị trí; host quyết định render; version/activation |
| **Odoo** | Menu/action/view XML | XML view + Python model | Web client render view theo action | Khai báo metadata mạnh, nhưng UI ít cô lập |
| **ERPNext** | Desk page/report + hooks | JSON/JS + Python hooks | Desk render theo route | Dễ mở rộng nhưng coupling cao, khó version contract |
| **WordPress** | `add_action`/`add_filter` + admin menu | PHP callback | Core gọi hook | Linh hoạt nhưng không an toàn/không typed; không phù hợp ERP multi-tenant |

## 3. Kết luận đối chuẩn

1. **Manifest khai báo vị trí (declarative contribution)** là mô hình phổ biến và phù hợp yêu cầu “plugin chỉ đăng ký vị trí”.
2. **Core phải sở hữu slot registry + renderer**; plugin chỉ cung cấp component và metadata. Điều này cho phép kiểm tra quyền, lifecycle, contract, error boundary tại một nơi.
3. **Full-screen plugin** vẫn nên là một screen/route do Core host; widget nhỏ dùng slot. Không dùng iframe cho widget vì kích thước, focus, theme, i18n và accessibility.
4. **Contract version + manifest validation** là bắt buộc để tránh plugin cũ làm hỏng Core.
5. **CLI tương tác** nên hỏi theo luồng nghiệp vụ (plugin → entity → field → relation → CRUD), không bắt developer nhớ hàng chục flag; vẫn giữ flag cho CI.
6. **Codegen** phù hợp khi developer cần sửa màn hình; metadata-driven phù hợp khi muốn ít code. Sprint 06 chọn codegen theo Q7/Q8, nên template phải cực kỳ ổn định và có smoke test.

## 4. Áp dụng vào Sprint 06

| Bài học | Quyết định Sprint 06 |
| :--- | :--- |
| Slot do host sở hữu | Core sở hữu 4 slot chuẩn; plugin được khai báo slot namespaced (Q3 B) |
| Manifest declarative | `plugin.json.ui_manifest.{screens,slots,contributions,crud}` |
| Core renderer | `PluginSlotComponent` trong `@shared/plugin-host` |
| Không iframe cho widget | Chỉ WC/MF; bỏ iframe toàn bộ (Q2 C) |
| Contract version | `contract_version` + skip/log khi lệch |
| CLI theo luồng | Bare wizard + `--interactive` (Q10 A) |
| Codegen có kiểm soát | Sinh Angular/Java + `--dry-run` + test build (Q7/Q8 B) |

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Đối chuẩn 6 nền tảng; rút bài học cho slot/CLI Sprint 06 | BA Agent; RAW/CONF-S06 |
