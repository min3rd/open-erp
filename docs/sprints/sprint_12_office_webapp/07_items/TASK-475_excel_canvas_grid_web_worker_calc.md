# TASK-475: Excel Web Đầy đủ Client — Tiled Canvas, Toàn bộ Catalogue Hàm, Pivot/Chart/CF/DV

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-475` |
| **Thuộc Feature** | [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Loại** | Frontend Domain Editor (Excel `.xlsx`, `.xls` read-only, `.csv`) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. Mở `.xlsx`/`.csv`, hiển thị lưới canvas cuộn mượt, sửa ô, formula bar, **toàn bộ catalogue hàm**, nhiều sheet.
2. Định dạng ô/merge/freeze/sort/filter hoạt động; xuất `.xlsx` mở lại bằng Excel/LibreOffice giữ công thức.
3. 10.000 ô cuộn không giật; recalc chỉ ô phụ thuộc qua Worker.
4. Phủ đủ 29 nhóm `X-A*` client: toàn bộ catalogue hàm, Pivot/Table/Slicer, full chart, protection, name manager, ink, sheet views.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `.../core/excel/excel-model.ts` | `Workbook`, `Sheet`, `Cell`, `CellStyle`, `Dimension`, `MergeRange` |
| `.../core/excel/xlsx-codec.ts` | workbook/sharedStrings/styles/worksheets/rels |
| `.../core/excel/csv-import.ts` | CSV → sheet |
| `.../core/excel/formula/tokenizer.ts`, `parser.ts`, `evaluator.ts`, `functions/*.ts` | Engine công thức |
| `.../core/excel/formula/dependency-graph.ts` | DAG, dirty cells, circular detect |
| `.../core/workers/office-calc.worker.ts` | Recalc ngoài main thread |
| `.../core/excel/excel-export.ts` | Xuất `.xlsx`/`.csv` |
| `.../core/excel/pivot/pivot-engine.ts` | Pivot cache, aggregation, grouping |
| `.../core/excel/chart/chart-model.ts` | Chart types/series/elements + XML |
| `.../core/excel/table/table-model.ts` | Structured table, form, checkbox |
| `.../core/excel/name-manager.ts` | Defined names |
| `.../core/excel/protection.ts` | Sheet/workbook protection |
| `.../core/excel/comments.ts` | Notes + threaded comments |
| `.../core/excel/ink.ts` | Ink strokes |
| `.../core/excel/number-format.ts` | Built-in + custom format codes |
| `.../ui/excel/excel-pivot-panel.component.*` | Field pane Pivot |
| `.../ui/excel/excel-chart-panel.component.*` | Chart editor |
| `.../ui/excel/excel-protection-dialog.component.*` | Protect sheet/workbook |
| `.../ui/excel/excel-grid.component.*` | Canvas tiles + scroll + selection |
| `.../ui/excel/excel-formula-bar.component.*` | Name Box + fx + expand |
| `.../ui/excel/excel-cell-editor.component.*` | Overlay `[contenteditable]` |
| `.../ui/excel/excel-sheet-tabs.component.*` | Tab sheet + context menu |
| `.../ui/excel/excel-filter-menu.component.*` | Filter theo giá trị |
| `.../ui/excel/excel-sort-dialog.component.*` | Sort 1–3 khóa |

## 2. Hình học lưới (bắt buộc)

| Vùng | Kích thước | Ghi chú |
| :--- | :--- | :--- |
| Column header canvas | rộng `max(1920, viewport)` × cao `30px` | Vẽ A..Z, AA.. |
| Row header canvas | rộng `43px` × cao `max(560, viewport)` | Chia 2 tile dọc |
| Grid canvas | rộng `max(1920, viewport)` × cao `560px`/tile | 2 tile dọc, lặp khi cuộn |
| Row height mặc định | `20px` | Cho phép resize |
| Col width mặc định | `120px` | Cho phép resize |
| DPR | `window.devicePixelRatio` | Canvas backing store = CSS × DPR |

Quy tắc: chỉ vẽ vùng nhìn + 1 tile đệm; **cấm** vẽ toàn bộ sheet.

## 3. Yêu cầu chức năng

### 3.1 Đọc & model

| Mã | Yêu cầu |
| :--- | :--- |
| 475-F01 | Parse `xl/workbook.xml`, `sharedStrings.xml`, `styles.xml`, `worksheets/sheetN.xml`, rels; hỗ trợ ẩn/hiện sheet, thứ tự sheet, tên sheet Unicode. |
| 475-F02 | Ô: giá trị chuỗi/số/bool/ngày (serial date + `numFmt`), formula `<f>` + cached `<v>`; giữ cả công thức và giá trị cache. |
| 475-F03 | Style: font, size, bold/italic/underline, màu chữ/nền, border 4 cạnh, align, number format, wrap; map style index. |
| 475-F04 | Thuộc tính sheet: merge cells, column widths, row heights, freeze panes, auto filter, hidden rows/cols (chỉ đọc). |
| 475-F05 | `.csv` → sheet 1, tự nhận delimiter + BOM; `.xls` (OLE2) chỉ đọc giá trị/text, cảnh báo `OFFICE_LEGACY_EXPORT_AS_OOXML`. |
| 475-F06 | File lỗi/không hỗ trợ → `OFFICE_XLSX_PARSE_FAILED` kèm sheet/part; không mở nửa vời. |

### 3.2 Lưới & điều hướng

| Mã | Yêu cầu |
| :--- | :--- |
| 475-F07 | Cuộn ngang/dọc mượt; header cột/hàng cố định; scrollbar đồng bộ vị trí ô active. |
| 475-F08 | Selection: click, Shift+click, kéo vùng, Ctrl+A; hiển thị địa chỉ vùng ở Name Box (`A1:C5`). |
| 475-F09 | Bàn phím: mũi tên, Tab/Shift+Tab, Enter/Shift+Enter, PageUp/PageDown, Ctrl+Home/End, F2 sửa ô, Esc hủy, Delete xóa nội dung. |
| 475-F10 | Ô đang sửa: overlay `[contenteditable]` đặt đúng rect, font/align khớp ô; Enter commit + xuống, Tab commit + sang phải, Esc hủy. |
| 475-F11 | Formula Bar: Name Box nhập địa chỉ → nhảy ô/vùng; ô fx hiển thị công thức thô; nút `×` hủy, `✓` commit, `fx` mở danh sách hàm; nút expand mở rộng 3 dòng. |
| 475-F12 | Copy/Paste nội bộ (TSV qua clipboard): giữ giá trị + công thức tương đối; paste từ Excel giữ dòng/cột. |
| 475-F13 | Kéo resize cột/hàng trên header; double-click viền = auto-fit theo nội dung dài nhất (giới hạn 400px). |
| 475-F14 | Đóng băng: `Freeze at selection`, `Top Row`, `First Column`; vẽ đường phân cách; bỏ freeze. |
| 475-F15 | Ẩn/hiện `Headings`, `Gridlines`, `Formula Bar` từ `View`, lưu `?gridlines=0`… |

### 3.3 Công thức

| Mã | Yêu cầu |
| :--- | :--- |
| 475-F16 | Tokenizer: số, chuỗi `"..."`, bool, tham chiếu `A1`, `$A$1`, vùng `A1:B5`, sheet `Sheet2!A1`, toán tử `+ - * / ^ % & = <> < <= > >=`, ngoặc, dấu `,`/`;`. |
| 475-F17 | Parser recursive descent → AST; lỗi cú pháp → `#ERROR!` + tooltip vị trí. |
| 475-F18 | Evaluator: lazy IF/IFS/AND/OR, ép kiểu số/chuỗi/bool, lỗi Excel (`#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?`, `#N/A`, `#NUM!`). |
| 475-F19 | Tham chiếu tương đối/absolute đúng khi copy/di chuyển; tham chiếu sheet khác; vùng co giãn khi chèn/xóa dòng-cột (`#REF!` nếu mất). |
| 475-F20 | Dependency graph: mỗi ô là node; recalc chỉ dirty cells; phát hiện circular → `#CIRCULAR!` + highlight chuỗi. |
| 475-F21 | Worker protocol: `EXCEL_INIT_WORKBOOK`, `EXCEL_SET_CELL`, `EXCEL_SET_RANGE`, `EXCEL_INSERT_ROWS/COLS`, `EXCEL_DELETE_ROWS/COLS` → `EXCEL_CALC_DONE { dirtyCells, errors }`. |
| 475-F22 | Recalc 10.000 ô < 300ms; gõ công thức hiển thị kết quả < 100ms cho vùng 1.000 ô. |
| 475-F23 | Hàm: **toàn bộ hàm mà Excel Web hỗ trợ** (Financial, Logical, Text, Date & Time, Lookup & Reference, Math & Trig, Statistical, Engineering, Information, Database, Web), sinh catalogue `excel-function-catalogue.json` từ danh mục Microsoft; **không giới hạn 60**; kèm nút AutoSum + dialog Insert Function theo nhóm. |
| 475-F24 | Mỗi hàm trong catalogue có ≥2 ca test (đúng + edge); coverage `implemented == catalogue` = 100%; hàm ngoài catalogue → `#NAME?` + tooltip, không crash. |
| 475-F25 | Bảng test `2×N` ca lưu tại `08_testing/evidence/task-475-functions.csv`, cột `function,input,expected,actual,PASS/FAIL`; 100% PASS mới đạt AC. |

### 3.4 Định dạng & thao tác bảng

| Mã | Yêu cầu |
| :--- | :--- |
| 475-F26 | Number format: General, Number (0–6 thập phân), Currency (VND/USD), Percent, Date (`dd/MM/yyyy`, `yyyy-MM-dd`), Text; hiển thị đúng, giá trị gốc không đổi. |
| 475-F27 | Format ô: bold/italic/underline/**double underline/strikethrough**, font, size, màu chữ/nền, 6 kiểu border, 6 align, wrap text, merge & center, unmerge, **Cell Styles gallery**, **Format Cells dialog**, **Clear contents/formats/comments**. |
| 475-F28 | Chèn/xóa dòng-cột: cập nhật công thức, merge, filter, freeze; Undo phục hồi đúng. |
| 475-F29 | Sort: 1–3 khóa, asc/desc, có/không header; giữ định dạng đi kèm ô; không sort ngoài vùng chọn. |
| 475-F30 | Filter: bật/tắt trên header, lọc theo danh sách giá trị + search, hiển thị số dòng ẩn; xóa filter khôi phục. |
| 475-F31 | Freeze + filter + merge cùng lúc không vẽ sai; test tổ hợp. |
| 475-F32 | Conditional Formatting đầy đủ 5 nhóm: `Highlight Cell Rules` (greater/less/between/equal/text contains/date occurring), `Top/Bottom Rules` (top 10, bottom 10, above/below average), `Data Bars`, `Color Scales`, `Icon Sets`; mỗi rule chọn vùng + format (fill/font/border) + `Stop if true`. |
| 475-F33 | `New Rule` cho phép tạo rule từ hộp thoại; `Clear Rules` (vùng chọn / toàn sheet); `Manage Rules` liệt kê theo thứ tự ưu tiên, sửa/xóa/đổi thứ tự; render đúng trên canvas và lưu `conditionalFormatting`. |
| 475-F34 | Data Validation đủ 3 tab: `Settings` (Allow any/whole/decimal/list/date/time/text length/custom; operator between/not between/equal/not equal/greater/less; min/max; source list dạng `a,b,c` hoặc range; Ignore blank; in-cell dropdown), `Input Message` (title/message, show when selected), `Error Alert` (style Stop/Warning/Information, title/message). |
| 475-F35 | Áp Data Validation cho vùng chọn, `Clear All`; nhập sai hiện alert/tooltip theo style; dropdown list hoạt động; lưu `dataValidation`; paste dữ liệu sai chỉ cảnh báo, không chặn cứng. |
| 475-F36 | Remove Duplicates trên vùng chọn, giữ dòng đầu; thông báo số dòng đã xóa. |
| 475-F37 | Sheet tabs: thêm, đổi tên (double-click), xóa (context menu, confirm), nhân bản, đổi thứ tự bằng kéo; không cho xóa sheet cuối. |

### 3.5 Lưu & xuất

| Mã | Yêu cầu |
| :--- | :--- |
| 475-F38 | Xuất `.xlsx`: workbook/sheets/sharedStrings/styles/merges/widths/freeze/filter/formulas/CF/DV; giữ part không sửa. |
| 475-F39 | Xuất `.csv`: sheet hiện tại, UTF-8 BOM, quote đúng RFC 4180. |
| 475-F40 | In/PDF: `@media print` vẽ vùng dữ liệu có nội dung, chia trang theo khổ; ẩn gridline nếu tắt. |
| 475-F41 | File gốc `.xls`: read-only, `Ctrl+S` xuất `.xlsx` + cảnh báo. |
| 475-F42 | Formula + CF + DV lưu vào `xlsx` phải mở được bằng Excel; nếu có cache, cập nhật cache sau recalc. |

### 3.6 Đầy đủ chức năng client còn lại (theo AUDIT-S12-001)

| Mã | Yêu cầu |
| :--- | :--- |
| 475-F43 | PivotTable: field pane kéo-thả Rows/Columns/Values/Filters, aggregation Sum/Count/Average/Min/Max, group date/number, refresh, pivot cache, persist `pivotTable*.xml`. |
| 475-F44 | Structured Table + Forms + Checkbox: tạo table (header, style, total row), structured reference trong công thức, form nhập liệu, checkbox cell; persist. |
| 475-F45 | Slicer: kết nối table/pivot, multi-select, style, clear filter, persist `slicer*.xml`. |
| 475-F46 | Chart đầy đủ: Column/Line/Scatter/Pie/Bar/Statistical/Combo/Other + subtype; title/legend/axes/data labels/gridlines; đổi range/series; persist chart XML. |
| 475-F47 | Notes + Comments: note legacy, comment thread (reply/resolve/delete), show/hide, prev/next; persist `comments*.xml`. |
| 475-F48 | Group/Ungroup + Subtotal: outline level, collapse/expand, subtotal theo nhóm; persist `outlinePr`. |
| 475-F49 | Split Text to Columns + Flash Fill: delimiter/fixed width có preview, flash fill theo pattern; Undo. |
| 475-F50 | Protection: protect/unprotect sheet + workbook, password, chọn quyền cho phép (format/sort/filter/insert), pause protection; enforce client-side. |
| 475-F51 | Sheet Views + New Window + Focus Cell + Immersive Reader + Zoom + Full Screen + Navigation: lưu view, mở cửa sổ mới, highlight hàng/cột, chế độ đọc, zoom 50–200%, toàn màn hình, bảng điều hướng ô. |
| 475-F52 | Ink/Draw: pen, highlighter, eraser, action pen, màu/độ dày; persist nét vẽ. |
| 475-F53 | Hyperlinks: chèn/sửa/xóa link ô, internal sheet/cell, external URL, mailto, display text. |
| 475-F54 | Name Manager: defined names theo workbook/sheet, create/edit/delete, dùng trong công thức, hiển thị lỗi trùng tên. |
| 475-F55 | Pictures/Shapes/Text Box: chèn ảnh, shape cơ bản, text box; resize/move/alt text; persist drawing. |
| 475-F56 | Number format đầy đủ: built-in + custom format code (số, %, tiền tệ, kế toán, ngày/giờ, fraction, scientific, text); parse/format client. |
| 475-F57 | Page Layout: margins/orientation/paper size, print area, page breaks, print titles, header/footer in print, sheet RTL; persist `pageSetup`. |
| 475-F58 | Refresh/Reapply/Workbook Links (local): tính lại công thức, reapply filter/sort, liệt kê link ngoài; connector ngoài thuộc `SERVICE`. |
| 475-F59 | Review: Spelling (local), Accessibility, Performance, Workbook Statistics; panel kết quả + nhảy tới ô. |
| 475-F60 | Find & Select: Find/Replace, Go To, Go To Special (constants/formulas/comments/conditional formats), chọn vùng có dữ liệu. |
| 475-F61 | Calculation Options Auto/Manual, Calculate Workbook/Sheet, Show Formulas; recalc đúng khi manual. |
| 475-F62 | Paste Special (values/formulas/formats/transpose), Fill Down/Right/Series; giữ công thức tương đối. |

## 4. Acceptance checklist

- [ ] AC-475-01 Mở `formula-3sheet.xlsx`: 3 sheet, công thức đúng giá trị cache; sửa input → output đổi.
- [ ] AC-475-02 Catalogue hàm: `implemented == catalogue` 100%, mỗi hàm ≥2 ca, toàn bộ PASS.
- [ ] AC-475-03 `=SUM(B2:B3)`, `=IF(A1>0,"Có","Không")`, `=VLOOKUP(...)` tính đúng; circular → `#CIRCULAR!`.
- [ ] AC-475-04 Gõ ô 10.000 dòng, cuộn 10 giây: không task > 50ms, FPS trung bình ≥ 50.
- [ ] AC-475-05 Merge A1:C1 + freeze top row + filter cột B cùng lúc: hiển thị đúng, không lệch.
- [ ] AC-475-06 Sort 3 khóa + filter → đúng thứ tự, định dạng giữ nguyên; Undo phục hồi.
- [ ] AC-475-07 Number format VND/Percent/Date hiển thị đúng; đổi format không đổi giá trị.
- [ ] AC-475-08 Xuất `.xlsx` → mở bằng LibreOffice: công thức còn, giá trị đúng, merge/freeze giữ.
- [ ] AC-475-09 Xuất `.csv` có BOM, mở Excel không lỗi font tiếng Việt.
- [ ] AC-475-10 `.xls` mở read-only, cảnh báo chuyển đổi, lưu thành `.xlsx`.
- [ ] AC-475-11 Name Box nhập `C10` → nhảy đúng; nhập `A1:C5` → chọn vùng, Name Box hiển thị `A1:C5`.
- [ ] AC-475-12 F2 sửa ô, Enter commit xuống, Esc hủy; overlay khớp rect ô ở zoom 100/150%.
- [ ] AC-475-13 0 `console.error`; 0 request khi mở file local.
- [ ] AC-475-14 CF: tạo đủ 5 nhóm rule, render đúng, `Manage Rules` sửa/xóa/đổi ưu tiên, `Clear Rules`, lưu `.xlsx` mở Excel còn rule.
- [ ] AC-475-15 DV: đủ 3 tab, dropdown list hoạt động, nhập sai hiện đúng style Stop/Warning/Information, `Clear All`, lưu `.xlsx` mở Excel còn validation.
- [ ] AC-475-16 PivotTable: tạo pivot từ range, kéo 4 vùng, đổi aggregation, refresh, lưu mở Excel còn pivot.
- [ ] AC-475-17 Table/Forms/Checkbox: table có total row + structured reference, form nhập, checkbox cell.
- [ ] AC-475-18 Slicer + chart đủ 8 nhóm: slicer lọc table/pivot, chart đổi range/series/elements, lưu mở lại.
- [ ] AC-475-19 Notes/Comments: tạo/reply/resolve/xóa, show/hide, lưu mở Excel còn comment.
- [ ] AC-475-20 Group/Ungroup/Subtotal + Split Text to Columns + Flash Fill hoạt động, Undo đúng.
- [ ] AC-475-21 Protection + Name Manager: protect/unprotect, defined name dùng trong công thức, lưu mở lại.
- [ ] AC-475-22 Sheet Views/New Window/Focus Cell/Immersive/Ink: bật/tắt, lưu view, nét vẽ còn sau khi lưu.
- [ ] AC-475-23 Number format custom + Page Layout + Refresh/Reapply/Workbook Links + Review panel hoạt động.
- [ ] AC-475-24 Find & Select + Go To Special + Calculate Options/Show Formulas + Paste Special/Fill hoạt động.
- [ ] AC-475-25 AutoSum + Insert Function dialog + Cell Styles + Format Cells dialog + Clear hoạt động.

## 5. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/evidence/task-475-functions.csv` | 2×N ca hàm (N = catalogue): tên, input, expected, actual, PASS/FAIL |
| `08_testing/evidence/task-475-perf.json` | Kết quả trace 10.000 ô |
| `08_testing/evidence/task-475-grid.png` | Lưới + formula bar + sheet tabs |
| `08_testing/evidence/task-475-before.xlsx` / `after.xlsx` | File gốc/sau sửa |
| `08_testing/evidence/task-475-csv.csv` | File CSV xuất (mở bằng Excel) |

## 6. Ngoài phạm vi (chỉ dịch vụ/không khả thi client)

- Power Query/Get Data connector, Power BI, Stocks/Currencies/Geography, Analyze Data, Data from Picture (OCR service), Insert Python, Office Scripts (Automate), Add-ins.
- Show Changes/co-authoring (dịch vụ), collaborative editing.
- Macro/VBA.
- Dữ liệu liên kết tới dịch vụ ngoài (Workbook Links local vẫn làm ở F58).

## 7. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| Canvas mờ trên màn HiDPI | Scale backing store theo DPR, test 100/125/150% |
| Recalc toàn bộ gây lag | DAG + dirty cells; đo bằng trace, đặt ngưỡng F-22 |
| Công thức tham chiếu chéo sheet phức tạp | Giới hạn 3 cấp phụ thuộc, test chéo sheet |
| Merge + freeze vẽ sai | Vẽ theo thứ tự: nền → merge → gridline → selection → freeze overlay |
| Date serial lệch múi giờ | Dùng UTC serial 1899-12-30, không dùng `Date` local |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer |
| 0.2 | 2026-11-15 | Đặc tả 40 FR, danh sách 60 hàm P0/P1, hình học tile, 13 AC | Architect; BENCH-S12-002/003 |
| 0.3 | 2026-11-15 | Chốt 60 hàm bắt buộc (120 ca), CF đầy đủ 5 nhóm + Manage/Clear, DV đầy đủ 3 tab; `F32–F42`, `AC-14–AC-15` | Chủ dự án; 8 câu hỏi tương tác |
| 0.4 | 2026-11-15 | Phủ sóng đầy đủ client: toàn bộ catalogue hàm, Pivot/Table/Form/Checkbox/Slicer, full chart, comments/notes, group/subtotal, split/flash, protection, name manager, sheet views/focus/immersive, ink, hyperlink, picture/shape/textbox, full number format, page layout, refresh/links, review (`F43–F59`, `AC-16–AC-23`) | Chủ dự án; AUDIT-S12-001 |
