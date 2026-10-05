# [00] Sprint 04 — Trải nghiệm giao diện: Theme, Animation, Icon, Context Menu, Loading/Skeleton & Đa ngôn ngữ

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S04-001 / 0.1 / 2026-10-05 |
| Trạng thái tài liệu / sprint | Draft / Discovery (bước 1–6 đang soạn) |
| Owner / reviewer | PM Agent / Chưa review |
| Đầu vào | [RAW-S04-001](01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) — yêu cầu trực tiếp của chủ dự án |
| Đọc trước / đọc tiếp | [Developer Reading Guide](../../08_developer_guides/00_READING_GUIDE.md), [Sprint 03](../sprint_03_plugin_manager/00_READING_GUIDE.md) / [RAW-S04-001](01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) |

## 1. Đọc để hiểu gì?

Sprint 04 nâng **trải nghiệm giao diện** của toàn hệ thống (Web + Mobile), không thêm nghiệp vụ mới:

1. **Theme đa giao diện** (màu sắc, layout, thiết kế component) — mỗi theme có **đủ 2 mode Light/Dark**, vẫn giữ mật độ thông tin cao.
2. **Animation** cho component (thay cho ẩn/hiện tức thời).
3. **Icon Feather** dùng thống nhất cho các chức năng dễ hiểu/độc lập.
4. **Context menu** ở danh sách (trải nghiệm như desktop).
5. **Thanh loading + skeleton** theo từng vùng, mỗi vùng **load độc lập**.
6. **Đa ngôn ngữ** mở rộng ngoài tiếng Việt/Anh.

Đây là **Sprint-Pack bước 00–07**: scope/AC **chưa** được khách hàng xác nhận, thiết kế và item đang ở dạng **Draft**. Không có mã nguồn nào của Sprint 04 được viết trước Confirmation Gate.

## 2. Lộ trình đọc

Khách hàng đọc **01 → 04** rồi **08–09** (khi có). Developer đọc **04 (CONF) → 05 (SOL) → 06 (DES) → 07 (item) → 08/09**.

| Thứ tự | ID/alias | File | Nội dung được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 00.01 | READ-S04-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | Bản đồ đọc, gate, danh mục ID | PM |
| 00.02 | PLAN-S04 | [sprint_plan.md](sprint_plan.md) | Mục tiêu, scope In/Out, DoD, mốc | PM |
| 01.01 | RAW-S04-001 | [RAW-S04-001](01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) | 6 yêu cầu gốc R1–R6 + ràng buộc kế thừa | BA |
| 02.01 | ANL-S04-001 | [Theme & design tokens](02_analysis/01_ANL-S04-001_theme_system_and_design_tokens.md) | Vì sao theme hiện bị khoá; token hoá; theme × mode | BA |
| 02.02 | ANL-S04-002 | [Motion & animation](02_analysis/02_ANL-S04-002_motion_and_animation_system.md) | Danh mục chuyển động, ngân sách hiệu năng, reduced-motion | BA |
| 02.03 | ANL-S04-003 | [Icon Feather](02_analysis/03_ANL-S04-003_icon_system_feather.md) | Icon hiện tại, quy tắc dùng icon, component icon chung | BA |
| 02.04 | ANL-S04-004 | [Context menu danh sách](02_analysis/04_ANL-S04-004_list_context_menu.md) | Phân loại hành động, bàn phím/a11y, Mobile parity | BA |
| 02.05 | ANL-S04-005 | [Loading bar & skeleton](02_analysis/05_ANL-S04-005_loading_bar_and_skeletons.md) | Mô hình vùng load độc lập, skeleton theo component | BA |
| 02.06 | ANL-S04-006 | [Mở rộng đa ngôn ngữ](02_analysis/06_ANL-S04-006_i18n_language_expansion.md) | Language registry, RTL, lazy dictionary, parity | BA |
| 03.01 | BENCH-S04-001 | [Đối chuẩn design system & UX](03_benchmarks/01_BENCH-S04-001_design_system_motion_icons_ux_i18n.md) | Sản phẩm lớn giải 6 vấn đề này thế nào | BA |
| 04.01 | CONF-S04-001 | [Scope & AC Sprint 04](04_confirmation/01_CONF-S04-001_sprint_04_scope.md) | **CONFIRMATION GATE** — scope, AC Given/When/Then, câu hỏi chốt | BA + Khách hàng |
| 05.01 | SOL-S04-001 | [Kiến trúc UI platform](05_solutions/01_SOL-S04-001_ui_platform_architecture.md) | Cách ghép 6 mảng, tác động thư viện chung | Architect |
| 06.01 | DES-UI-S04-001 | [Theme tokens & layout](06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md) | Token, theme registry, ràng buộc mật độ | Architect |
| 06.02 | DES-UI-S04-002 | [Motion, icon, context menu, skeleton](06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) | Đặc tả component dùng chung | Architect |
| 06.03 | DES-API-S04-001 | [Theme preferences & i18n](06_designs/api/01_DES-API-S04-001_theme_preferences_and_i18n.md) | API lưu sở thích theme/ngôn ngữ, contract | Architect |
| 07.01 | FEAT-24 | [Theme system & design tokens](07_items/FEAT-24_theme_system_and_design_tokens.md) | Feature + task con | Developer |
| 07.02 | FEAT-25 | [Motion & animation](07_items/FEAT-25_motion_and_animation_system.md) | Feature + task con | Developer |
| 07.03 | FEAT-26 | [Feather icon system](07_items/FEAT-26_feather_icon_system.md) | Feature + task con | Developer |
| 07.04 | FEAT-27 | [Context menu danh sách](07_items/FEAT-27_list_context_menu.md) | Feature + task con | Developer |
| 07.05 | FEAT-28 | [Loading bar & skeleton](07_items/FEAT-28_loading_bar_and_skeletons.md) | Feature + task con | Developer |
| 07.06 | FEAT-29 | [Đa ngôn ngữ mở rộng](07_items/FEAT-29_multilanguage_i18n_expansion.md) | Feature + task con | Developer |
| 08.01 | TP-S04-001 | Chưa tạo | Test plan theo AC | QA |
| 08.02 | TR-S04-001 | Chưa tạo | Test report có baseline/evidence | QA |
| 09.01 | REV-S04-001 | Chưa tạo | DoD/backlog/closure | PM |

> Bảng đọc là snapshot danh mục. Khi thêm artifact phải cập nhật index này trước khi giao việc.

> **Quy ước mã**: mã SOL/DES mang phạm vi cục bộ trong từng Sprint-Pack (`DES-UI-S04-001` khác `DES-03-*`).

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval (CONF-S04-001) | **Pending** | Khách hàng | Chưa có |
| Design ready (SOL/DES) | Pending | Architect/Reviewer | Chưa có |
| QA sign-off | Pending | QA | Chưa có |
| PM đánh giá DoD | Pending | PM | Chưa có |
| Customer acceptance | Pending | Khách hàng | Chưa có |
| Closure | Pending | PM sau nghiệm thu | Chưa có |

## 4. Danh mục ID và cấp số

| TYPE/ID | File hoặc reservation | Owner | Tình trạng |
| :--- | :--- | :--- | :--- |
| READ-S04-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | PM | Used |
| PLAN-S04 | [sprint_plan.md](sprint_plan.md) | PM | Used |
| RAW-S04-001 | [RAW-S04-001](01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) | BA | Used |
| ANL-S04-001…006 | [02_analysis/](02_analysis/) | BA | Used |
| BENCH-S04-001 | [03_benchmarks/](03_benchmarks/) | BA | Used |
| CONF-S04-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used |
| SOL-S04-001 | [05_solutions/](05_solutions/) | Architect | Used |
| DES-UI-S04-001…002 | [06_designs/ui_ux/](06_designs/ui_ux/) | Architect | Used |
| DES-API-S04-001 | [06_designs/api/](06_designs/api/) | Architect | Used |
| FEAT-24…29 | [07_items/](07_items/) | Developer | Used |
| TASK-355… | Chưa tạo | Developer | **Reserved** (cấp khi tách task ở bước 07) |
| ADR-S04-* | Chưa tạo | Architect | Chưa dùng |
| TP-S04-001 / TR-S04-001 | Chưa tạo | QA | Chưa dùng |
| REV-S04-001 | Chưa tạo | PM | Chưa dùng |

## 5. Việc chuyển tiếp từ Sprint 03

| Việc | Nguồn | Sprint 04 xử lý |
| :--- | :--- | :--- |
| Route-state phần phụ (sessions + danh sách Mobile) | TASK-348 (Sprint 03) | Tách file item khi tiếp nhận; liên quan trực tiếp tới context menu/loading |
| BUG-83 (touch target shared topbar) | Sprint 02/03 | Chỉnh trong đợt làm TopBar/icon của FEAT-26 |
| Smoke K8s staging + registry token-auth | Sprint 03 (follow-up) | Ngoài phạm vi Sprint 04, theo dõi ở review Sprint 03 |

> Trạng thái sản phẩm lấy ở artifact gốc trong `07_items/` và review, không lấy từ bảng này khi chưa có bằng chứng.
