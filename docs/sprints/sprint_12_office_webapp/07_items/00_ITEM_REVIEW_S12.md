# [00_ITEM_REVIEW_S12] Bảng duyệt Task Sprint 12 — Đọc 1 trang trước khi duyệt

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ITEM-REVIEW-S12-001 / Bảng duyệt item / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.3 / 2026-11-15 — phủ sóng đầy đủ client (scope 1.2) |
| Owner | BA/Architect (tổng hợp) — người duyệt: chủ dự án |
| Đầu vào | [AUDIT-S12-001](../03_benchmarks/04_AUDIT-S12-001_m365_web_command_coverage.md) 0.1, [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) 0.3, [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.2 |
| Đọc tiếp | Từng Task trong thư mục `07_items/` |

## 1. Đã dùng thử gì trên Microsoft 365 Web

| Ứng dụng | Đã thao tác thật | Chỉ đọc Ribbon |
| :--- | :--- | :--- |
| Word | Gõ text + tiếng Việt, chèn bảng 2×2 (tab contextual `Table`), comment card, Find pane, Version History, menu File + Export | Home, Insert, Layout, References, Review, View |
| Excel | Conditional Formatting, Freeze Panes, Data Validation dialog, Chart gallery, Ribbon Layout | Home, Insert, Page Layout, Formulas, Data, Review, View, Automate, Draw |
| PowerPoint | Chọn shape (8 handle + rotate), Slide Sorter, Slide Show, theme sáng/tối | Home, Insert, Design, Transitions, Animations, Slide Show, Review, View |
| Shell | App launcher, Workspace app card, menu File 13 mục, title bar save icon, Ribbon Display Options | — |

## 2. Quyết định đã chốt

| # | Chủ đề | Chốt |
| :--- | :--- | :--- |
| R1 | Token Shell | Đo thật `48/31-36/76/136/32/24` |
| R2 | Menu File | 9 mục + `Share nội bộ ERP` (ACL user/role) |
| R3 | Word Comment | Có |
| R4 | Excel hàm | **Toàn bộ catalogue hàm Excel Web** (không giới hạn 60) |
| R5 | Excel nâng cao | CF 5 nhóm + Manage, DV 3 tab, Pivot/Table/Slicer/full chart |
| R6 | PowerPoint | 6 transition (Morph) + 4 animation + pane |
| R7 | PDF | Xem + search + annotation + rotate/thumbnail + tải |
| R8 | Mobile | Chỉ xem |
| R9 | Phủ sóng | **Toàn bộ 78 nhóm chức năng client** phải có FR/AC; không `OUT` client |
| R10 | Loại trừ | Chỉ 13 nhóm `SERVICE` (AI/speech/Teams/cloud/Store/co-authoring) |

## 3. Bảng Task

| Task | Nội dung | FR | AC | Phụ thuộc | Mốc |
| :--- | :--- | ---: | ---: | :--- | :--- |
| [TASK-471](TASK-471_office_backend_scaffold_schema_api.md) | Backend plugin, schema, API, ACL share | 44 | 15 | CONF/DES | M0 |
| [TASK-472](TASK-472_pure_ts_zero_third_party_binary_core.md) | Lõi ZIP/XML/OLE2/PDF/CSV + Worker + part coverage | 44 | 16 | ADR-001 | M1 |
| [TASK-473](TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) | Shell, Ribbon, File 9 mục, Share, command search, panel | 52 | 16 | 471, 472 | M2 |
| [TASK-474](TASK-474_word_fixed_page_ooxml_editor.md) | Word đầy đủ client: page, comment, track changes, field, equation, ink | 52 | 25 | 472, 473 | M3 |
| [TASK-475](TASK-475_excel_canvas_grid_web_worker_calc.md) | Excel đầy đủ client: canvas, toàn bộ hàm, Pivot/Chart/CF/DV | 62 | 25 | 472, 473 | M4 |
| [TASK-476](TASK-476_powerpoint_stage_svg_overlay_slideshow.md) | PPT đầy đủ client: stage, SmartArt/Chart/media, effects, presenter | 56 | 26 | 472, 473 | M5 |
| [TASK-477](TASK-477_pdf_client_viewer_and_mobile_ionic_viewer.md) | PDF viewer + annotation + Mobile | 23 | 13 | 472, 473 | M6 |
| [TASK-478](TASK-478_dual_mode_qa_screenshots_and_user_guides.md) | QA dual-mode + audit coverage + 3 bộ tài liệu | 16 | 12 | 474–477 | M6 |

Tổng: **349 FR** và **148 AC**; đối chiếu **78/78 nhóm client** tại `AUDIT-S12-001`.

## 4. Chỉ những phần này bị loại trừ (13 nhóm `SERVICE`)

| App | Nhóm loại trừ | Lý do |
| :--- | :--- | :--- |
| Word | Dictate, Editor AI/Translate/Add-ins | Speech/AI/Store |
| Excel | Get Data/Power Query/Power BI, Stocks/Geography/Analyze Data/Data from Picture, Insert Python, Office Scripts, Add-ins, Show Changes | Connector/cloud/AI/co-authoring |
| PowerPoint | Dictate/Designer/Add-ins, M365 Stock Images, Visualize/Design Suggestions, Teams/Subtitles/Rehearse, Show Changes/Review Presentation | AI/Teams/speech/co-authoring |
| Shell | Catch up activity feed | Dịch vụ OneDrive |
| Chung | Co-authoring, macro/VBA, file mã hóa | Ngoài khả năng client hoặc out-of-scope |

Ngoài danh sách này, **không còn chức năng client nào bị cắt**.

## 5. Việc phải làm trước khi code (Design 1.2)

| # | Việc | Owner |
| :--- | :--- | :--- |
| P1 | `DES-DB`: bảng `plg_office_document_permissions` | Architect |
| P2 | `DES-API`: 3 endpoint permissions + `OFFICE_DOCUMENT_SHARED` | Architect |
| P3 | `DES-UI`: token đo thật + Share Drawer + command search + panel host | Architect |
| P4 | `ADR-S12-001`: comments/footnotes/header-footer/equation/ink parts | Architect |
| P5 | `ADR-S12-001`: Pivot/Table/Slicer/chart/SmartArt/media part coverage | Architect |
| P6 | `ADR-S12-002`: transition/animation/Morph + Presenter View | Architect |
| P7 | `DES-UI`: Track Changes markup, comment panel, accessibility/immersive | Architect |
| P8 | `DES-API/DB`: version history/delete/favorites/move mapping ERP (nếu làm) | Architect |
| P9 | Cập nhật `SOL-S12-001` §risk: khối lượng client tăng mạnh, đề xuất chia sub-sprint | Architect |

## 6. Điều kiện chuyển sang lập trình

- [ ] P1–P9 hoàn tất, Design 1.2 được duyệt.
- [ ] 8 Task đổi trạng thái `Approved`.
- [ ] Fixture + hash baseline cho 12 file (gồm pivot/chart/smartart/media/annotation).
- [ ] Audit 78/78 nhóm client có FR/AC, 0 nhóm thiếu.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Tổng hợp 8 Task 0.2, 7 câu hỏi duyệt | BA/Architect |
| 0.2 | 2026-11-15 | Áp 8 câu trả lời: 280 FR / 111 AC | Chủ dự án |
| 0.3 | 2026-11-15 | Phủ sóng đầy đủ client: 349 FR / 148 AC; chỉ loại trừ 13 nhóm service; thêm P1–P9 | Chủ dự án; AUDIT-S12-001 |
| 0.4 | 2026-11-20 | Bổ sung [TASK-523](TASK-523_word_365_web_ui_and_interactions.md) — chuẩn hóa giao diện & tương tác Word Web đạt tương đương Office 365 Web (Single-Line `45px`/Classic `104px`, Light/Dark + Switch Background, File dropdown `268px` + xuất ODT/PDF+comments, Nav Find/Replace `280px`, Floating Comment Cards, popovers, 0 hồi quy 546 trang); giữ nguyên trạng thái `Draft` chờ QA/Chủ dự án nghiệm thu | Developer Agent; TASK-523, TR-S12-003 1.87 |
