# [BENCH-S12-003] Ma trận Chức năng Microsoft 365 Web & Quyết định Phủ sóng Sprint 12

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S12-003 / Đối chuẩn chức năng / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.3 / 2026-11-15 — phủ sóng đầy đủ theo [AUDIT-S12-001](04_AUDIT-S12-001_m365_web_command_coverage.md) |
| Owner / reviewer | BA Agent / Chủ dự án |
| Đầu vào | [BENCH-S12-002](02_BENCH-S12-002_m365_live_ui_verification.md), [feature-probe-notes](evidence/feature-probe-notes.md), [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.2 |
| Đọc trước / đọc tiếp | [AUDIT-S12-001](04_AUDIT-S12-001_m365_web_command_coverage.md) / [00_ITEM_REVIEW_S12](../07_items/00_ITEM_REVIEW_S12.md) |

## 1. Quy tắc quyết định (yêu cầu chủ dự án 2026-11-15)

| Mã | Nghĩa | Hệ quả |
| :--- | :--- | :--- |
| `IMPL` | Chức năng xử lý được 100% ở client | **Bắt buộc có FR + AC; không được cắt** |
| `ERP` | Cần backend Open-ERP (file, version, share nội bộ) | Làm theo DES-API/DB, không sao chép Microsoft |
| `SERVICE` | Phụ thuộc dịch vụ Microsoft/AI/Teams/Store/co-authoring | Loại trừ đúng yêu cầu "trừ phần dữ liệu xử lý với backend" |
| `N/A` | Help/Feedback/What's New | Không tính phạm vi |

Không còn `SIMPLE`/`OUT` cho chức năng client. Danh sách nhãn Ribbon đầy đủ và ánh xạ FR nằm tại [AUDIT-S12-001](04_AUDIT-S12-001_m365_web_command_coverage.md).

## 2. Shell & dữ liệu ERP

| Mã audit | Nhóm | Quyết định | Task/FR |
| :--- | :--- | :--- | :--- |
| S-A01, S-A03, S-A04, S-A05, S-A07 | Title/Tabs/Ribbon/Status/Workspace, command search `Alt+Q`, panel Comments/Accessibility, full screen, Ribbon layout | `IMPL` | 473-F06–F35, F49–F52 |
| S-A02 | Menu `File` 13 mục | `IMPL` 9 mục có hành vi; `ERP` cho Share/Version/Delete/Favorites/Move | 473-F18–F26, F43–F48 |
| S-A06 | Catch up (activity feed) | `SERVICE` | Loại trừ |

## 3. Word Web

| Mã audit | Nhóm | Quyết định | Task/FR |
| :--- | :--- | :--- | :--- |
| W-A01–W-A05 | Clipboard, font, đoạn, danh sách, styles, Find | `IMPL` | 474-F09–F11, F17, F48, F52 |
| W-A07–W-A13 | Page break, table, picture, drawing, link, bookmark, TOC, header/footer, page number, equation, symbol, emoji, online video, comment | `IMPL` | 474-F13–F15, F30–F47 |
| W-A14–W-A16 | Margins, orientation, size, columns, breaks, line numbers, page borders, page color | `IMPL` | 474-F03, F42, F43 |
| W-A17 | TOC, footnote, endnote, citations | `IMPL` | 474-F39–F41 |
| W-A18 | Spelling (local), Word Count, Accessibility, Mark All as Read | `IMPL` | 474-F18, F49, F51 |
| W-A20 | Markup view, Track Changes, Accept/Reject, Previous/Next | `IMPL` | 474-F37 |
| W-A21–W-A23 | Reading View, Immersive Reader, ruler, nav pane, zoom, dark mode, switch background | `IMPL` | 474-F06, F19, F20, F50 |
| W-A06, W-A19 | Dictate, Editor AI, Add-ins, Translate | `SERVICE` | Loại trừ |
| W-A24 | Help/Feedback/Shortcuts | `N/A` | Không tính |

## 4. Excel Web

| Mã audit | Nhóm | Quyết định | Task/FR |
| :--- | :--- | :--- | :--- |
| X-A01–X-A06 | Clipboard, font, align, number, styles, CF, cells, AutoSum, sort/filter, find | `IMPL` | 475-F02, F26–F36, F56, F59 |
| X-A07–X-A12 | PivotTable, Table/Forms/Checkbox, Pictures/Shapes/Text Box, full charts, Slicer, Link/Comment | `IMPL` | 475-F43–F47, F53, F55 |
| X-A13 | Page setup, print area, breaks, sheet RTL | `IMPL` | 475-F57 |
| X-A14, X-A15 | Insert Function, toàn bộ hàm, Name Manager, Show Formulas, Calculation | `IMPL` | 475-F23–F25, F54, F14 |
| X-A17, X-A19–X-A21 | Table/Range, Refresh/Workbook Links local, sort, filter, split, flash fill, remove dup, validation, group | `IMPL` | 475-F29, F30, F34–F36, F48, F49, F58 |
| X-A22, X-A24–X-A26 | Comments/Notes, Version History (ERP), spelling/accessibility/performance/statistics, protection | `IMPL` + `ERP` | 475-F47, F50, F59; 473 drawer |
| X-A27–X-A29, X-A31 | Sheet views, new window, freeze, full screen, headings, gridlines, formula bar, focus cell, immersive | `IMPL` | 475-F14, F15, F51 |
| X-A33 | Ink/Draw | `IMPL` | 475-F52 |
| X-A16, X-A18, X-A23, X-A32 | Insert Python, Get Data/Power BI/Stocks/Geography/Analyze Data, Show Changes, Office Scripts | `SERVICE` | Loại trừ |
| X-A30 | Data Type Icons | `SERVICE` | Loại trừ |

## 5. PowerPoint Web

| Mã audit | Nhóm | Quyết định | Task/FR |
| :--- | :--- | :--- | :--- |
| P-A01–P-A05 | Clipboard, slide, font, shapes, arrange, find | `IMPL` | 476-F01–F04, F19, F20, F53, F54 |
| P-A07–P-A10 | Text box, table, picture, shapes, icons, SmartArt, chart, video, audio, cameo | `IMPL` | 476-F20, F39–F43, F54 |
| P-A12 | Link, comment, footer, symbol | `IMPL` | 476-F46, F49 |
| P-A13 | Themes, variants, layout, size, background | `IMPL` | 476-F44, F45 |
| P-A15, P-A16 | 6 transition (Morph) + 4 animation + pane | `IMPL` | 476-F22, F33–F35 |
| P-A17 | From Beginning/Current, Presenter View, Custom show | `IMPL` | 476-F23, F47, F48 |
| P-A19, P-A21 | Proofing, accessibility, comments | `IMPL` | 476-F49, F50 |
| P-A22, P-A23 | Notes, ruler, sorter, normal, immersive, zoom, ink | `IMPL` | 476-F27, F51, F52 |
| P-A06, P-A11, P-A14, P-A18, P-A20 | Dictate, Designer, Add-ins, Stock Images, Visualize/Design Suggestions, Teams/Subtitles/Rehearse, Show Changes | `SERVICE` | Loại trừ |

## 6. PDF Viewer

| Mã audit | Nhóm | Quyết định | Task/FR |
| :--- | :--- | :--- | :--- |
| D-A01 | Page nav, zoom, rotate, thumbnails, search, print, download | `IMPL` | 477-F01–F09, F20, F21 |
| D-A02 | Highlight, ink, text note, erase | `IMPL` | 477-F22 |
| D-A04 | Mobile view/rotate/nav | `IMPL` | 477-F10–F19, F23 |
| D-A03 | Form/signature | `N/A` | Viewer web không có |

## 7. Tổng hợp phủ sóng

| App | Nhóm `IMPL` | Nhóm `SERVICE` (loại trừ) | Nhóm `ERP` | Nhóm `N/A` |
| :--- | ---: | ---: | ---: | ---: |
| Shell | 6 | 1 | 1 | 0 |
| Word | 21 | 2 | 0 | 1 |
| Excel | 29 | 5 | 1 | 0 |
| PowerPoint | 19 | 5 | 0 | 0 |
| PDF | 3 | 0 | 0 | 1 |
| **Tổng** | **78** | **13** | **2** | **2** |

Đối chiếu: 78 nhóm client → 100% có FR trong `TASK-473..477`; 13 nhóm service và 2 nhóm N/A được liệt kê công khai, không có nhóm client nào bị bỏ.

## 8. Bằng chứng

- [04_AUDIT-S12-001](04_AUDIT-S12-001_m365_web_command_coverage.md) — bảng ánh xạ từng nhãn Ribbon → Task/FR.
- [coverage-summary.json](evidence/coverage-summary.json) — 78 client / 13 service / 2 ERP / 2 N/A; 349 FR / 148 AC.
- [feature-probe-notes.md](evidence/feature-probe-notes.md) — nhãn lệnh đọc trực tiếp trong phiên đăng nhập.
- 8 ảnh chụp + `shell-metrics.json` trong [evidence/](evidence/).

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Ma trận 108 mục, quyết định IMPL/SIMPLE/ERP/OUT | BA Agent |
| 0.2 | 2026-11-15 | Áp 8 quyết định review | Chủ dự án |
| 0.3 | 2026-11-15 | **Bỏ `SIMPLE`/`OUT` cho client**: mọi nhóm client → `IMPL`; chỉ còn `SERVICE`/`ERP`/`N/A`; đối chiếu 78 nhóm client | Chủ dự án; yêu cầu phủ sóng đầy đủ |
