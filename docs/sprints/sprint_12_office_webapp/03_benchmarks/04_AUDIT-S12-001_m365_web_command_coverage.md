# [AUDIT-S12-001] Đối chiếu Đầy đủ Chức năng Office 365 Web → Task Sprint 12

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | AUDIT-S12-001 / Kiểm toán phủ sóng chức năng / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-15 |
| Owner / reviewer | BA + Architect / Chủ dự án |
| Đầu vào | [BENCH-S12-003](03_BENCH-S12-003_m365_feature_matrix.md), [feature-probe-notes](evidence/feature-probe-notes.md) (nhãn Ribbon đọc trực tiếp), [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.2 |
| Đọc tiếp | [00_ITEM_REVIEW_S12](../07_items/00_ITEM_REVIEW_S12.md) |

## 1. Quy tắc phân loại (theo yêu cầu chủ dự án 2026-11-15)

| Mã | Nghĩa | Xử lý |
| :--- | :--- | :--- |
| `CLIENT` | Xử lý được 100% trong trình duyệt với dữ liệu trong file | **Bắt buộc có trong Task, không được `OUT`** |
| `ERP` | Cần backend Open-ERP (lưu file, phiên bản, chia sẻ nội bộ) | Làm theo DES-API/DB, không sao chép Microsoft |
| `SERVICE` | Phụ thuộc dịch vụ Microsoft/cloud/AI/Teams/Store | Loại trừ theo yêu cầu "trừ phần dữ liệu xử lý với backend" |
| `N/A` | Không phải chức năng soạn thảo (Help, Feedback, What's New) | Không tính vào phạm vi |

Nguyên tắc: một nhãn Ribbon chỉ được `SERVICE`/`N/A` khi nó thực sự cần dịch vụ ngoài; mọi nhãn còn lại phải có FR và AC.

## 2. Word Web

| Mã | Nhóm lệnh (đủ nhãn quan sát) | Loại | Task/FR |
| :--- | :--- | :--- | :--- |
| W-A01 | Home: Undo, Redo, Paste, Cut, Copy, Format Painter | CLIENT | 474-F52 |
| W-A02 | Home: Font Name/Size, Grow/Shrink, Bold, Italic, Underline, Highlight, Font Color, Clear Formatting | CLIENT | 474-F09, F52 |
| W-A03 | Home: Bullets, Numbering, Checklist, Indent ±, Alignment, Borders, Paragraph Shading, Line Spacing, Paragraph Options | CLIENT | 474-F10, F48 |
| W-A04 | Home: Styles (Normal, No Spacing, Heading 1–3, gallery) | CLIENT | 474-F11, F48 |
| W-A05 | Home: Find (Navigation pane 280px) | CLIENT | 474-F17 |
| W-A06 | Home: Dictate, Editor, Add-ins | SERVICE | Loại trừ |
| W-A07 | Insert: Page Break, Table (10×8 picker) | CLIENT | 474-F13, F15 |
| W-A08 | Insert: Picture, Drawing | CLIENT | 474-F14, F46 |
| W-A09 | Insert: Link, Bookmarks, Table of Contents | CLIENT | 474-F41 |
| W-A10 | Insert: Header & Footer, Page Numbers | CLIENT | 474-F38 |
| W-A11 | Insert: Equation, Symbol, Emoji | CLIENT | 474-F44, F45 |
| W-A12 | Insert: Online Video | CLIENT | 474-F47 |
| W-A13 | Insert: New Comment + Review comment commands | CLIENT | 474-F30–F36, F51 |
| W-A14 | Layout: Margins, Orientation, Size | CLIENT | 474-F03, F43 |
| W-A15 | Layout: Columns, Breaks, Line Numbers | CLIENT | 474-F42 |
| W-A16 | Layout: Page Borders, Page Color | CLIENT | 474-F43 |
| W-A17 | References: Table of Contents, Footnote, Endnote, Citations | CLIENT | 474-F39, F40, F41 |
| W-A18 | Review: Spelling & Grammar, Word Count, Check Accessibility, Mark All as Read | CLIENT (spellcheck local; grammar service bỏ) | 474-F18, F49, F51 |
| W-A19 | Review: Translate | SERVICE | Loại trừ |
| W-A20 | Review: Markup view, Track Changes, Accept, Reject, Previous/Next | CLIENT | 474-F37 |
| W-A21 | View: Separate Pages, Reading View, Immersive Reader | CLIENT | 474-F20, F50 |
| W-A22 | View: Zoom, Ruler, Navigation Pane, Header/Footer, Footnotes, Endnotes | CLIENT | 474-F06, F19, F20 |
| W-A23 | View: Dark Mode, Switch Background | CLIENT | 474-F50 |
| W-A24 | Help: Contact Support, Feedback, Shortcuts, What's New | N/A | Không tính |

## 3. Excel Web

| Mã | Nhóm lệnh | Loại | Task/FR |
| :--- | :--- | :--- | :--- |
| X-A01 | Home: Undo/Redo, Paste/Cut/Copy/Format Painter | CLIENT | 475-F01, F02, F59 |
| X-A02 | Home: Font/Size/Grow/Shrink, B/I/U, Double Underline, Strikethrough | CLIENT | 475-F27, F59 |
| X-A03 | Home: Borders, Fill Color, Font Color, 6 Align, Indent, Orientation, Wrap, Merge & Center | CLIENT | 475-F27 |
| X-A04 | Home: Number Format, Accounting, %, Comma, Decimal ±, Cell Styles, Format as Table | CLIENT | 475-F26, F44, F56 |
| X-A05 | Home: Conditional Formatting (Highlight/Top-Bottom/Data Bars/Color Scales/Icon Sets/New/Clear/Manage) | CLIENT | 475-F32, F33 |
| X-A06 | Home: Insert/Delete/Format cells, AutoSum, Clear, Sort & Filter, Find & Select | CLIENT | 475-F28, F29, F30, F36, F59 |
| X-A07 | Insert: PivotTable | CLIENT | 475-F43 |
| X-A08 | Insert: Table, Forms, Checkbox | CLIENT | 475-F44 |
| X-A09 | Insert: Pictures, Shapes, Text Box | CLIENT | 475-F55 |
| X-A10 | Insert: Recommended Charts + Column/Line/Scatter/Pie/Bar/Statistical/Combo/Other | CLIENT | 475-F46 |
| X-A11 | Insert: Slicer | CLIENT | 475-F45 |
| X-A12 | Insert: Link, Comment, New Comment | CLIENT | 475-F47, F53 |
| X-A13 | Page Layout: Page Setup, Print Area, Breaks, Sheet Right-to-Left | CLIENT | 475-F57 |
| X-A14 | Formulas: Insert Function, AutoSum, 6 nhóm hàm, More Functions | CLIENT | 475-F23 |
| X-A15 | Formulas: Name Manager, Show Formulas, Calculation Options, Calculate Workbook/Sheet | CLIENT | 475-F54, F61 |
| X-A16 | Formulas: Insert Python | SERVICE | Loại trừ |
| X-A17 | Data: Get Data, From Table/Range, Refresh, Refresh All, Queries & Connections, Workbook Links | CLIENT (local) + SERVICE (external connector) | 475-F58; connector ngoài loại trừ |
| X-A18 | Data: Data from Picture, Power BI, Stocks/Currencies/Geography, Analyze Data | SERVICE | Loại trừ |
| X-A19 | Data: Sort Asc/Desc/Custom, Filter, Clear, Reapply | CLIENT | 475-F29, F30 |
| X-A20 | Data: Split Text to Columns, Flash Fill, Remove Duplicates | CLIENT | 475-F36, F49 |
| X-A21 | Data: Data Validation (3 tab), Group/Ungroup | CLIENT | 475-F34, F35, F48 |
| X-A22 | Review: New/Show/Prev/Next/Delete Comment, Notes | CLIENT | 475-F47 |
| X-A23 | Review: Show Changes | SERVICE (co-authoring) | Loại trừ |
| X-A24 | Review: Version History | ERP | 471 + 473 drawer |
| X-A25 | Review: Spelling, Accessibility, Performance, Workbook Statistics | CLIENT | 475-F59 |
| X-A26 | Review: Manage/Pause Protection | CLIENT | 475-F50 |
| X-A27 | View: Save/New Sheet View, Options, Exit View | CLIENT | 475-F51 |
| X-A28 | View: Zoom, New Window, Freeze Panes, Full Screen | CLIENT | 475-F14, F51 |
| X-A29 | View: Navigation, Headings, Gridlines, Formula Bar, Focus Cell | CLIENT | 475-F15, F51 |
| X-A30 | View: Data Type Icons | SERVICE | Loại trừ |
| X-A31 | View: Immersive Reader | CLIENT | 475-F51 |
| X-A32 | Automate: New Script, View Scripts, Automation Templates… | SERVICE | Loại trừ |
| X-A33 | Draw: Select, Draw with Touch, Eraser, Pen, Highlighter, Action Pen | CLIENT | 475-F52 |
| X-A34 | Toàn bộ hàm mà Excel Web hỗ trợ (mọi nhóm) | CLIENT | 475-F23–F25 (catalogue + test toàn bộ) |
| X-A35 | Workbook Links/Refresh dữ liệu local (không connector) | CLIENT | 475-F58 |

## 4. PowerPoint Web

| Mã | Nhóm lệnh | Loại | Task/FR |
| :--- | :--- | :--- | :--- |
| P-A01 | Home: Undo, Clipboard, Format Painter, Delete | CLIENT | 476-F01, F54 |
| P-A02 | Home: New Slide, Slide Layout, Hide Slide | CLIENT | 476-F09, F21 |
| P-A03 | Home: Font/Size, B/I/U, Highlight, Color, Lists, Align, Indent, Spacing | CLIENT | 476-F03 |
| P-A04 | Home: Shapes, Shape Fill/Outline/Styles, Arrange | CLIENT | 476-F20, F19 |
| P-A05 | Home: Find | CLIENT | 476-F53 |
| P-A06 | Home: Dictate, Designer, Add-ins | SERVICE | Loại trừ |
| P-A07 | Insert: Text Box, Table, Pictures | CLIENT | 476-F54 |
| P-A08 | Insert: Shapes, Icons, SmartArt, Chart | CLIENT | 476-F20, F39, F40, F41 |
| P-A09 | Insert: Video, Audio | CLIENT | 476-F42 |
| P-A10 | Insert: Cameo | CLIENT | 476-F43 |
| P-A11 | Insert: M365 Stock Images | SERVICE | Loại trừ |
| P-A12 | Insert: Link, Comment, Footer, Symbol | CLIENT | 476-F49, F46, F54 |
| P-A13 | Design: Themes, Variants, Slide Layout, Slide Size, Background | CLIENT | 476-F44, F45, F21 |
| P-A14 | Design: Visualize Slide, Design Suggestions | SERVICE | Loại trừ |
| P-A15 | Transitions: None, Morph, Cut, Fade, Push, Wipe, Duration, Apply All, Preview | CLIENT | 476-F22, F33 |
| P-A16 | Animations: None, Appear, Fade, Fly In, Options, Pane, Move Earlier/Later | CLIENT | 476-F34, F35 |
| P-A17 | Slide Show: From Beginning, From Current, Presenter View, Custom | CLIENT | 476-F23, F47, F48 |
| P-A18 | Slide Show: Present in Teams, Subtitles, Rehearse with Coach | SERVICE | Loại trừ |
| P-A19 | Review: Proofing, Accessibility, Mark All as Read | CLIENT | 476-F50, F49 |
| P-A20 | Review: Show Changes, Review Presentation | SERVICE | Loại trừ |
| P-A21 | Review: New/Delete/Prev/Next/Show Comments | CLIENT | 476-F49 |
| P-A22 | View: Notes, Ruler, Slide Sorter, Normal, Immersive Reader, Zoom, Fit | CLIENT | 476-F27, F51, F56 |
| P-A23 | Draw: Select, Touch, Lasso, Eraser, Pen, Highlighter, Ruler | CLIENT | 476-F52 |
| P-A24 | Slide Master/Layout (Design) | CLIENT | 476-F45 |

## 5. PDF Viewer (Office/OneDrive Web)

| Mã | Nhóm lệnh | Loại | Task/FR |
| :--- | :--- | :--- | :--- |
| D-A01 | Page nav, zoom, rotate, thumbnails, search, print, download | CLIENT | 477-F01–F09, F20, F21 |
| D-A02 | Annotate: highlight, ink, text note, erase | CLIENT | 477-F22 |
| D-A03 | Form/signature | N/A (không có trong viewer web) | Không tính |
| D-A04 | Mobile view, rotate, page/sheet/slide nav | CLIENT | 477-F10–F19, F23 |

## 6. Shell & dữ liệu ERP

| Mã | Nhóm lệnh | Loại | Task/FR |
| :--- | :--- | :--- | :--- |
| S-A01 | Title Bar, Tabs, Ribbon single/classic, Formula Bar, Status Bar | CLIENT | 473-F06–F35 |
| S-A02a | Menu File: New, Open, Save, Save As, Export, Print, Rename, Info | CLIENT | 473-F18–F26 |
| S-A02b | Menu File: Share nội bộ, Version History, Delete | ERP | 473-F43–F48, TASK-471 |
| S-A03 | Command search `Alt+Q` | CLIENT | 473-F49 |
| S-A04 | Comments/Accessibility panel host | CLIENT | 473-F50, F52 |
| S-A05 | Full screen | CLIENT | 473-F51 |
| S-A06 | Catch up (activity feed) | SERVICE | Loại trừ |
| S-A07 | Ribbon Display Options (Classic/Single, Always show/Show tabs only) | CLIENT | 473-F12, F13 |

## 7. Tổng hợp phủ sóng

| App | Nhóm `CLIENT` | Nhóm `SERVICE` loại trừ | Nhóm `ERP` | Nhóm `N/A` |
| :--- | ---: | ---: | ---: | ---: |
| Word | 21 | 2 | 0 | 1 |
| Excel | 29 | 5 | 1 | 0 |
| PowerPoint | 19 | 5 | 0 | 0 |
| PDF | 3 | 0 | 0 | 1 |
| Shell | 6 | 1 | 1 | 0 |
| **Tổng** | **78 nhóm** | **13 nhóm** | **2 nhóm** | **2 nhóm** |

Kết luận: **không còn nhóm chức năng client nào bị `OUT`**. Các nhóm `SERVICE` được liệt kê công khai để chủ dự án thấy rõ phần loại trừ đúng yêu cầu.
Số liệu máy đọc: [coverage-summary.json](evidence/coverage-summary.json).
Kiểm tra tự động ngày 2026-11-15: **78 hàng `CLIENT` → 78 hàng có mã `47x-Fxx`; 0 hàng thiếu** (13 `SERVICE`, 2 `ERP`, 2 `N/A`); **133 tham chiếu FR được phân giải, 0 FR không tồn tại**.

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Lập bảng đối chiếu 78 nhóm client + 13 nhóm service + 2 ERP; gắn mã Task/FR | BA/Architect; yêu cầu phủ sóng đầy đủ |
