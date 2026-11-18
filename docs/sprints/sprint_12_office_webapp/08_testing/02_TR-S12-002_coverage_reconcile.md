# TR-S12-002 — Đối chiếu phủ sóng 349 FR / 148 AC

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S12-002 / Đối chiếu phủ sóng / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 4.6 / 2026-11-17 |
| Baseline | `00a1539e` + working tree ngày 2026-11-16 |
| Owner | Developer Agent (đối chiếu) — QA/PM xác nhận |
| Phạm vi | 78 nhóm `CLIENT` tại [AUDIT-S12-001](../03_benchmarks/04_AUDIT-S12-001_m365_web_command_coverage.md); 349 FR / 148 AC tại [00_ITEM_REVIEW_S12](../07_items/00_ITEM_REVIEW_S12.md) |
| Bằng chứng chính | [TR-S12-SLICE](01_TR-S12-SLICE_readonly.md), smoke 209 ca, backend 13/14 test, `evidence/task-475-qa.json`, `evidence/task-477-e2e-gateway.txt` |

## 1. Cách đối chiếu

- Mỗi nhóm `CLIENT` trong audit được đánh **ĐỦ** khi toàn bộ lệnh quan sát của nhóm đã có implementation + ít nhất một bằng chứng chạy (smoke/browser/backend).
- **MỘT PHẦN** khi đường chính hoạt động nhưng còn lệnh con trong nhóm chưa có UI/part.
- **CHƯA** khi chưa có implementation hoặc chưa có bằng chứng chạy.
- Không đánh dấu AC nào là `Done`: theo quy trình, QA phải chạy checklist thủ công và ghi ảnh/JSON; build/smoke PASS không thay QA Done.

## 2. Tổng hợp theo ứng dụng

| Ứng dụng | Nhóm client | ĐỦ | Một phần | Chưa |
| :--- | ---: | ---: | ---: | ---: |
| Word | 21 | 20 | 1 | 0 |
| Excel | 29 | 8 | 8 | 13 |
| PowerPoint | 19 | 4 | 9 | 6 |
| PDF | 3 | 3 | 0 | 0 |
| Shell | 6 | 1 | 2 | 3 |
| **Tổng** | **78** | **36** | **20** | **22** |

## 3. Word — 21 nhóm

### 3.1. Giao diện ribbon đối chiếu Office 365 web

| Hạng mục | Word 365 web | Plugin hiện tại |
| :--- | :--- | :--- |
| Tab | Home, Insert, Draw, Design, Layout, References, Mailings, Review, View, Help | Đủ **10 tab**, đúng thứ tự, File menu riêng |
| Nhóm lệnh | ~41 nhóm có nhãn dưới nhóm (Clipboard, Font, Paragraph, Styles, Editing, Pages, Tables, …) | **41 nhóm**, nhãn i18n, phân cách dọc |
| Lệnh | ~158 lệnh ribbon | **158 lệnh**: chỉ **Macros disabled** (Word for the web không chạy VBA); Mailings mail merge CSV/XLSX, Index, Arrange floating `wp:anchor` đã hoạt động |
| Dropdown | Font, size, style, color, highlight, spacing, shading, margins, orientation, size, columns, line numbers, zoom | 13 dropdown đúng vị trí |
| Chế độ | Editing / Suggesting / Viewing | Có, áp tracking/reading tương ứng |
| Ribbon display | Classic / Single-line / Tabs only | Cycle 3 trạng thái |
| Status bar | Page x / y, word count, zoom, view | “52 từ · Trang 1 / 1 · − 100% + A”, bấm số từ mở Word Count |
| URL | Không đổi theo tab | `?tab=home|insert|…` (replaceState + popstate) |

Ánh xạ nhóm audit → tab: W-A01–A05 Home; W-A07–A13 Insert; W-A08 (drawing) Draw; W-A16 Design; W-A14/A15 Layout; W-A09/A17 References; Mailings riêng; W-A13/A18/A20 Review; W-A21–A23 View; trợ giúp/phím tắt Help. Bổ sung: Cover Page + Text Box + Shapes/Icons/Chart (Insert), Themes/Style Sets + Watermark (Design), Sort/Shading/¶ (Home), Arrange (Layout), Table of Figures/Index (References), Thesaurus/Restrict Editing (Review), Macros (View). **Mailings (mail merge CSV/XLSX), Index (XE + số trang thật), Arrange (`wp:anchor`)** đã hoạt động; chỉ **Macros disabled** vì trình duyệt không chạy VBA (giống Word for the web).

**Kiểm chứng tài liệu thực (2026-11-16)**: file thầu 1.2MB, 30 part, 5 ảnh, 14 bảng XML (1 lồng), 50 hyperlink, TOC trong `w:sdt`, 5 section, 82k từ. Sau sửa + lưu: đủ 30 part, 5 media, 14 bảng, 50 hyperlink, text khớp. Phát hiện và sửa: parse `w:sdt` body/inline, hyperlink nội bộ `w:anchor`, **nested table render đệ quy nhiều cấp**, logo header. **Phân trang thật**: 546 trang deterministic (portrait 816×1056, landscape 1056×816), per-cell table flow theo kernel ONLYOFFICE + per-section size/margins, 528 đoạn đo DOM, bảng 839 hàng chia trang, header logo + số trang động lặp mỗi trang → W-A21 một phần; Word live 546 trang, bố cục từng trang chưa khớp hoàn toàn (mean Dice 0,558, 72/546 trang ≥0,8 — task-514). **TOC tự cập nhật số trang sau phân trang** (deep entry cached 9 → 8 khớp heading page 8, không bấm Update TOC). **Ribbon đủ 10 tab/41 nhóm/158 lệnh, chỉ Macros disabled**: Mailings mail merge NEXT theo run, Index XE + số trang, Arrange floating `wp:anchor` + group `wpg:wgp`, **square/tight/through reflow + behind/front z-order + topAndBottom đúng y + y độc lập anchor + exclusion plan + line-level split cho đoạn có ảnh/textbox + pPrChange accept/reject** hoạt động. Bằng chứng: [task-488](evidence/task-488-word-ribbon.json), [task-489](evidence/task-489-word-office-commands.json), [task-490](evidence/task-490-word-parity2.json), [task-491](evidence/task-491-word-real-doc.json), [task-492](evidence/task-492-word-pagination.json), [task-493](evidence/task-493-word-ribbon-full.json), [task-494](evidence/task-494-word-nested-table.json), [task-495](evidence/task-495-word-wpg-group.json), [task-496](evidence/task-496-word-reflow-nested.json), [task-497](evidence/task-497-word-stacking.json), [task-498](evidence/task-498-word-absolute-y.json), [task-499](evidence/task-499-word-exclusion-next.json), [task-500](evidence/task-500-word-line-split.json), [task-501](evidence/task-501-word-next-midrecord.json), [task-502](evidence/task-502-word-rich-split-next.json), [task-503](evidence/task-503-word-exact-y.json), [task-504](evidence/task-504-word-pprchange.json), [task-508](evidence/task-508-word-toc-auto-refresh.json), [task-509](evidence/task-509-word-native-ink.json), [task-510](evidence/task-510-word-inkml-part.json), ảnh [word-ribbon-compare.png](evidence/word-ribbon-compare.png).

| Mã | Nhóm | Trạng thái | Bằng chứng / thiếu |
| :--- | :--- | :--- | :--- |
| W-A01 | Undo/Redo, clipboard, Format Painter | Đủ | Undo/Redo stack 50 bước + Ctrl+Z/Y; Copy/Cut/Paste Clipboard API (fallback native); Format Painter lưu/áp định dạng run + đoạn; Clear formatting |
| W-A02 | Font name/size, B/I/U, highlight, color | Đủ | Chọn font/size, A±, bold/italic/underline/strike, color picker, highlight 6 màu, clear formatting; chọn text theo offset, ghi `w:rPr`, round-trip |
| W-A03 | Bullets, numbering, indent, align, spacing | Đủ | Panel định dạng: 4 căn lề (`w:jc`), thụt lề ±720 (`w:ind`), 1.0/1.15/1.5/2.0 (`w:spacing`), bullet/number qua `numbering.xml` + `w:numPr`; round-trip |
| W-A04 | Styles gallery | Đủ | Normal/No Spacing/Title/Subtitle/Heading 1–6/Quote (`w:pStyle`), preview `Aa`, Normal reset pPr; round-trip |
| W-A05 | Find/Replace | Đủ | Panel tìm/thay, matchCase/wholeWord, highlight đoạn, prev/next, thay 1/tất cả; Navigation pane 280px liệt kê heading + nhảy tới đoạn |
| W-A07 | Page Break, Table picker | Đủ | Chèn bảng 2×3 + `w:tblGrid` + borders; page break `w:br type=page` trước sectPr; cả hai round-trip |
| W-A08 | Picture, Drawing | Đủ | Chèn ảnh PNG (media + rel + content-type, render đúng tỉ lệ, round-trip) + ink layer |
| W-A09 | Link, Bookmarks, TOC | Đủ | Panel chèn hyperlink (text + URL) ghi `w:hyperlink` + rel `TargetMode=External`; bookmark + TOC + cross-ref; link sống sót sau chèn symbol/sửa text và save |
| W-A10 | Header/Footer, Page Numbers | Đủ | Smoke + UI + round-trip; `header1.xml`/`footer1.xml`, `w:pgNumType`, `titlePg` |
| W-A11 | Equation, Symbol | Đủ | OMML chèn/sửa/lưu; symbol picker 28 ký tự chèn vào cuối đoạn, link trong đoạn giữ nguyên |
| W-A12 | Online Video | Đủ | Panel nhập URL chèn `wp15:webVideoPr href/embeddedUrl`; parse/render link cả chế độ thường và All Markup; save/mở lại giữ URL |
| W-A13 | Comments | Đủ | Thread tạo/reply/resolve/xóa; `comments.xml` + `commentsExtended.xml` |
| W-A14 | Margins, Orientation, Size | Đủ | `w:pgSz`/`w:pgMar`, A4/Letter, portrait/landscape; round-trip |
| W-A15 | Columns, Breaks, Line Numbers | Đủ | `w:cols`, section/page break, `w:lnNumType` continuous/newPage/newSection + off; round-trip |
| W-A16 | Page Borders, Page Color | Đủ | `w:pgBorders` style/size/color/offset, `w:background` page color; CSS render; round-trip |
| W-A17 | TOC, Footnote, Endnote, Citations | Đủ | `footnotes.xml`/`endnotes.xml`, source APA, TOC/bookmark |
| W-A18 | Spelling, Word Count, Accessibility | Đủ | Word count + a11y panel + spellcheck cục bộ: ~110 lỗi phổ biến, từ lặp, ngữ pháp (2 space, space trước dấu, `!!`, chữ thường đầu câu); Sửa/Bỏ qua, sửa xong lưu vào text |
| W-A20 | Markup, Track Changes, Accept/Reject | Đủ | `w:ins`/`w:del`/`w:rPrChange`, All/Simple/No, accept/reject, editing trong All |
| W-A21 | Separate Pages, Reading View, Immersive | Một phần | **Phân trang thật deterministic** theo per-cell table flow (ONLYOFFICE kernel) + style metrics: tài liệu thầu 1.2MB → 546 trang tự nhiên (không docProps target), portrait 816×1056 và landscape 1056×816 (trang 544-545), bảng 839 hàng chia qua trang và cắt trong hàng, header logo + **số trang động** lặp mỗi trang; **ngắt dòng `w:br` trong ô bảng render đúng** (733 break trong 579 ô, trước đây gộp thành 1 dòng); Reading view ẩn ribbon, read-only; Immersive 680px/18px/1.9; fixed page + zoom. **Header `w:tblHeader` lặp theo Office 365** từ task-518: ưu tiên bản Word thay baseline 546 trang, một bảng/trang, đuôi hàng cắt qua trang giữ nguyên; vẫn **546 trang**; body Dice 0,571/94 trang ≥0,8 (số cũ 0,584/98 có nhân bản hàng nối trang). **Ô gộp `w:gridSpan`/`w:vMerge` vẽ `colspan`/`rowspan`** từ task-521, đo dòng theo `data-cell`; **Chưa khớp bố cục từng trang**: hàng bảng vắt qua trang vẫn bắt đầu lệch vài dòng so với Word |
| W-A22 | Zoom, Ruler, Nav, Header/Footer, Notes | Đủ | Zoom + ruler 816px + panel header/notes + navigation pane 280px (heading list, nhảy đoạn, mở Find) |
| W-A23 | Dark Mode, Switch Background | Đủ | Dark page `#1f2937` + text sáng; page background color riêng (`w:background`) |

## 4. Excel — 29 nhóm client

| Mã | Nhóm | Trạng thái | Bằng chứng / thiếu |
| :--- | :--- | :--- | :--- |
| X-A01 | Undo/Redo, clipboard, painter | Một phần | Sửa ô/công thức; undo native của input; chưa nút/painter |
| X-A02 | Font/size, B/I/U, double underline, strike | Đủ | Font/size + A±, bold/italic/underline/double underline/strike, color; ghi `styles.xml` font + `s` attr, round-trip |
| X-A03 | Borders, fill, align, merge | Đủ | Border/fill/font color, 3 ngang + 3 dọc, indent, wrap, rotation 45°, merge & center/unmerge; round-trip |
| X-A04 | Number format, styles, format as table | Đủ | Accounting `#,##0 "₫"`, %, comma, decimal ±, number format select, 5 preset cell styles, native table |
| X-A05 | Conditional formatting | Một phần | 5 loại parse + UI cellIs/text/dataBar/colorScale + list/xóa từng rule/clear all; chưa icon sets/top10 UI |
| X-A06 | Insert/delete/format cells, AutoSum, clear, sort/filter, find | Đủ | Chèn/xóa ô + dòng/cột, AutoSum `=SUM(...)`, clear contents/formats/all, sort/filter/find; round-trip |
| X-A07 | PivotTable | Một phần | Config + render + drag-drop; chưa native pivot cache/part |
| X-A08 | Table, Forms, Checkbox | Một phần | Native `xl/tables/table1.xml` + `tableParts`; chưa forms/checkbox |
| X-A09 | Pictures, Shapes, Text Box | Chưa | Chưa có |
| X-A10 | Charts | Một phần | Column/bar/line/pie + editor series/legend/axis; chưa đủ 8 nhóm (scatter/combo/statistical) |
| X-A11 | Slicer | Một phần | Slicer 1 cột/1 value field + lọc rows; chưa nhiều cột |
| X-A12 | Link, Comment | Chưa | Chưa có |
| X-A13 | Page setup, print area, breaks, RTL | Chưa | Chưa có |
| X-A14 | Insert function, AutoSum, function groups | Một phần | 410 hàm + dependency recalc; chưa Insert Function dialog |
| X-A15 | Name Manager, Show Formulas, Calculation | Đủ | Defined names thêm/xóa/round-trip, Show Formulas, Calculate sheet/workbook, Manual calculation |
| X-A17 | Get Data local, refresh, links | Chưa | Chưa có |
| X-A19 | Sort/filter/reapply | Đủ | Asc/desc, custom 2 khóa (chính + phụ), filter value + clear, reapply; sort ghi lại `sheetData` |
| X-A20 | Split text, Flash Fill, Remove Duplicates | Chưa | Chưa có |
| X-A21 | Data Validation, Group/Ungroup | Một phần | Data validation tạo rule + chặn nhập; chưa group/ungroup |
| X-A22 | Review comments/notes | Đủ | Note theo ô: lưu `comments1.xml` + VML + rel/content-type/legacyDrawing, prev/next, xóa; round-trip |
| X-A25 | Spelling, Accessibility, Workbook Statistics | Chưa | Chưa có |
| X-A26 | Protection | Đủ | Bật/tắt sheetProtection + workbookProtection lockStructure, round-trip |
| X-A27 | Sheet Views, Options | Chưa | Chưa có |
| X-A28 | Zoom, Freeze, Fullscreen | Một phần | Zoom + freeze pane (ghi `pane` XML); chưa new window/fullscreen |
| X-A29 | Navigation, headings, gridlines, formula bar | Một phần | Formula bar + gridlines; chưa heading/navigation toggle |
| X-A31 | Immersive Reader | Chưa | Chưa có |
| X-A33 | Draw (pen/highlighter/eraser) | Chưa | Chưa có |
| X-A34 | Toàn bộ catalogue hàm Excel Web | Một phần | 410 hàm; còn ~90 hàm chuyên sâu/đầy đủ tham số |
| X-A35 | Workbook Links local | Chưa | Chưa có |

## 5. PowerPoint — 19 nhóm

| Mã | Nhóm | Trạng thái | Bằng chứng / thiếu |
| :--- | :--- | :--- | :--- |
| P-A01 | Undo, clipboard, painter, delete | Một phần | Sửa text shape; chưa undo/painter/delete |
| P-A02 | New slide, layout, hide slide | Đủ | Thêm/nhân bản/xóa/di chuyển/ẩn slide, sldIdLst + rels + part mới; round-trip |
| P-A03 | Font/size, B/I/U, lists, align, spacing | Một phần | Parse/render font; chưa toolbar |
| P-A04 | Shapes, fill/outline/styles, arrange | Một phần | Render shape + sửa text; chưa fill/outline/arrange |
| P-A05 | Find | Chưa | Chưa có |
| P-A07 | Text box, table, pictures | Một phần | Parse/render table/picture; chưa chèn |
| P-A08 | Shapes, icons, SmartArt, chart | Một phần | SmartArt node edit + chart parse; chưa insert/icons/layout/style |
| P-A09 | Video, Audio | Một phần | Phát mp4/wav từ package; chưa nhúng file |
| P-A10 | Cameo | Chưa | Chưa có |
| P-A12 | Link, comment, footer, symbol | Chưa | Chưa có |
| P-A13 | Themes, variants, layout, size, background | Một phần | Parse slide size; chưa theme/background |
| P-A15 | Transitions + duration + apply all | Đủ | 11 loại + `p14:dur`; round-trip `push 700ms` |
| P-A16 | Animations + options + pane | Đủ | 5 hiệu ứng + trigger/delay/duration; `p:timing` round-trip |
| P-A17 | Slide Show, Presenter View, Custom | Một phần | Fullscreen slideshow + phím; chưa presenter/custom show |
| P-A19 | Proofing, accessibility, mark read | Chưa | Chưa có |
| P-A21 | Comments | Đủ | Panel thêm/xóa/prev/next; `comments/commentN.xml` + `commentAuthors.xml` + rel + content-type; round-trip |
| P-A22 | Notes, ruler, sorter, normal, immersive, zoom | Một phần | Thumbnail + zoom; chưa notes/ruler/sorter |
| P-A23 | Draw (lasso, pen, highlighter) | Chưa | Chưa có |
| P-A24 | Slide Master/Layout | Chưa | Chưa có |

## 6. PDF — 3 nhóm

| Mã | Nhóm | Trạng thái | Bằng chứng |
| :--- | :--- | :--- | :--- |
| D-A01 | Page nav, zoom, rotate, thumbnails, search, print, download | Đủ | 2 trang + thumbnail active + Ctrl+F 2/2 hit + rotate/zoom; print/download |
| D-A02 | Annotate highlight/ink/note/erase | Đủ | Embedded JSON + localStorage; round-trip file |
| D-A04 | Mobile view, rotate, page nav | Đủ | 390×844 overflow 0, touch ≥ 40px, swipe |

## 7. Shell — 6 nhóm

| Mã | Nhóm | Trạng thái | Bằng chứng / thiếu |
| :--- | :--- | :--- | :--- |
| S-A01 | Title, tabs, ribbon, formula bar, status | Một phần | Token 48/31-36/76/32/24 + formula bar Excel; chưa Classic Ribbon 136 |
| S-A02a | File: New/Open/Save/Save As/Export/Print/Rename/Info | Một phần | 9 mục File + Open/Save ERP/Share; thiếu Save As/Rename |
| S-A03 | Command search `Alt+Q` | Chưa | Chưa có |
| S-A04 | Comments/Accessibility panel host | Đủ | Word comments + accessibility panels; drawer route |
| S-A05 | Fullscreen | Chưa | Chỉ fullscreen trong slideshow PPT |
| S-A07 | Ribbon Display Options | Chưa | Chưa có Single/Classic/Show tabs only |

## 8. Kết luận và thứ tự còn lại

- **Word đạt 20/21 nhóm client** (W-A21 một phần: tổng số trang khớp nhưng bố cục từng trang chưa khớp — task-514), gồm **phân trang thật deterministic** 546 trang cho tài liệu thầu 1.2MB với header/footer số trang động lặp mỗi trang. Tổng toàn bộ **36/78 nhóm đủ**, **20/78 một phần**, **22/78 chưa**. **349 FR / 148 AC vẫn mở** ở các ứng dụng còn lại; không AC nào được đánh dấu Done trong báo cáo này.
- Nhóm đã đủ (Word): undo/painter, font, paragraph/list, style gallery, find + navigation pane, table/page break, picture/ink, link/bookmark/TOC, header/footer, symbol, online video, comments, page setup, columns/line numbers, page border/color, references, spelling/word count/accessibility, track changes, reading/immersive, zoom/ruler/nav/notes, dark.
- Ưu tiên tiếp theo (theo mức ảnh hưởng):
  1. Word (chất lượng sâu, không còn nhóm thiếu): TOC page-number engine, ink native render, ảnh floating/textbox, `pPrChange`, style definitions đầy đủ, từ điển lớn hơn.
  2. PPT theme/master/layout/notes/sorter (P-A13/A22/A24).
  3. Excel CF icon sets/top10 UI, formula refs update khi insert/delete.
  4. Shell: command search + Classic Ribbon + fullscreen (S-A01, A03, A05, A07).
  5. Hoàn thiện 90 hàm Excel chuyên sâu + slicer nhiều cột.
- QA vẫn phải chạy checklist 148 AC và cập nhật `08_testing` trước khi PM DoD gate.

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-11-16 | Đối chiếu 78 nhóm client sau block Word video/rPrChange + E2E gateway; 11 đủ / 38 một phần / 29 chưa | Developer Agent; AUDIT-S12-001, smoke 209, backend 13/14 |
| 1.1 | 2026-11-16 | Sau block Word undo/redo + find/replace + chèn bảng/ảnh: 12 đủ / 41 một phần / 25 chưa; sửa lại số đếm Word | Developer Agent; smoke 219, `task-479-word-editing.json` |
| 1.2 | 2026-11-16 | Sau block Word paragraph/list/style/page break: 14 đủ / 39 một phần / 25 chưa | Developer Agent; smoke 227, `task-480-word-format.json` |
| 1.3 | 2026-11-16 | Sau block Word font/run + clipboard/painter + No Spacing: 17 đủ / 36 một phần / 25 chưa | Developer Agent; smoke 236, `task-481-word-runs.json` |
| 1.4 | 2026-11-16 | Sau block Excel cell format + sort/find/filter + freeze: 18 đủ / 35 một phần / 25 chưa; X-A02 đủ | Developer Agent; smoke 248, `task-482-excel-format.json` |
| 1.5 | 2026-11-16 | Sau block Excel insert/delete/AutoSum/clear/merge/wrap/indent/custom sort: 21 đủ / 32 một phần / 25 chưa; X-A03/A06/A19 đủ | Developer Agent; smoke 262, `task-483-excel-edit.json` |
| 1.6 | 2026-11-16 | Sau block Excel cell styles/accounting/CF manage/names/protection/comments: 25 đủ / 28 một phần / 25 chưa; X-A04/A15/A22/A26 đủ | Developer Agent; smoke 274, `task-484-excel-advanced.json` |
| 1.7 | 2026-11-16 | Sau block Word page border/color/line numbers/reading/immersive/dark + PPT slide ops/comments: 31 đủ / 25 một phần / 22 chưa | Developer Agent; smoke 284, `task-485-word-page.json` |
| 1.8 | 2026-11-16 | Word hoàn tất **20/21 nhóm đủ (95%)**: nav 280px, hyperlink UI, symbol picker, chèn online video, spellcheck cục bộ; tổng 36 đủ / 20 một phần / 22 chưa | Developer Agent; smoke 289, `task-486-word-nav-link.json` |
| 1.9 | 2026-11-16 | **Word 21/21 nhóm đủ (100%)**: mở rộng spellcheck lên ~110 lỗi + 5 rule ngữ pháp; tổng 37 đủ / 19 một phần / 22 chưa | Developer Agent; smoke 291, `task-487-word-spellcheck.json` |
| 2.0 | 2026-11-16 | **Ribbon Word dựng lại theo Office 365 web**: 9 tab, 30 nhóm có nhãn, 96 lệnh, 12 dropdown, mode Editing/Suggesting/Viewing, ribbon 3 chế độ, status bar, URL `?tab=`; smoke 297 | Developer Agent; `task-488-word-ribbon.json` |
| 2.1 | 2026-11-16 | **Bổ sung lệnh Office còn thiếu + icon**: Cover Page, Text Box (`wps:wsp`), Watermark (VML header), Caption (`SEQ`), New Window; 101 lệnh, nút lớn có icon SVG, ảnh so sánh Word 365; smoke 305 | Developer Agent; `task-489-word-office-commands.json` |
| 2.2 | 2026-11-16 | **Đủ 10 tab/41 nhóm/134 lệnh**: Mailings, Shapes/Icons/Chart, Themes/Style Sets, Sort/Shading/¶, Table of Figures, Thesaurus, Restrict Editing; 22 lệnh chưa hỗ trợ hiển thị disabled + lý do; smoke 315 | Developer Agent; `task-490-word-parity2.json` |
| 2.3 | 2026-11-16 | **Kiểm chứng tài liệu thầu thực 1.2MB**: sửa `w:sdt`, hyperlink `w:anchor`, nested table, logo header; round-trip giữ 30 part/5 media/14 bảng/50 link; W-A21 hạ Một phần do chưa phân trang thật → Word 20/21, tổng 36/20/22; smoke 319 | Developer Agent; `task-491-word-real-doc.json` |
| 2.4 | 2026-11-16 | **Phân trang thật**: 144 trang cho tài liệu thầu 1.2MB, 528 đoạn đo DOM, bảng 839 hàng chia trang, header logo + số trang động lặp mỗi trang; W-A21 trở lại Đủ → Word 21/21, tổng 37/19/22; smoke 323 | Developer Agent; `task-492-word-pagination.json` |
| 2.5 | 2026-11-16 | **Ribbon đủ 10 tab/41 nhóm/158 lệnh, chỉ Macros disabled**: Mailings mail merge CSV/XLSX, Index XE + số trang, Arrange floating `wp:anchor` (position/wrap/align/rotate/z-order/selection pane/group) hoạt động; smoke 340 | Developer Agent; `task-493-word-ribbon-full.json` |
| 2.6 | 2026-11-16 | **Bổ sung nhóm lệnh còn thiếu so với Office 365 web**: Insert TOC, Layout Page Background, Review Show/Filter Comments + Accept/Reject Previous/Next, View Separate Pages/Switch Background/Zoom 100%; TOC dùng số trang thật (`removeToc` + `insertToc` page map); gated wrap/nested/group hints; smoke 340 | Developer Agent; `task-493-word-ribbon-full.json` |
| 2.7 | 2026-11-16 | **Nested table render lồng thật**: giữ `w:tbl` trong ô (WordNestedTable), word count/pagination/mail merge/render đệ quy; sửa hồi quy TOC hyperlink; real doc 132 bảng DOM/999 hàng/145 trang; smoke 340 | Developer Agent; `task-494-word-nested-table.json` |
| 2.8 | 2026-11-16 | **Group floating object bằng `wpg:wgp` chuẩn**: parser/render `wpg:wgp`, group 2 anchor thành 1 group + 2 child, ungroup tách lại anchor; bỏ customXml/arrange.xml; runtime QA group/ungroup 2→1→2; smoke 342 | Developer Agent; `task-495-word-wpg-group.json` |
| 2.9 | 2026-11-16 | **Text reflow + nested table đệ quy**: wrap square/tight/through render CSS float in-flow, text bắt đầu tại mép float (609px), overlay 0; tableTemplate đệ quy render 3 cấp; smoke 343 | Developer Agent; `task-496-word-reflow-nested.json` |
| 3.0 | 2026-11-16 | **Stacking + absolute y**: behind z0/front z3 overlay, topAndBottom flow block (bottom 469 → paragraph 499), wrap y=100 đạt top 197; smoke 343 | Developer Agent; `task-497-word-stacking.json` |
| 3.1 | 2026-11-16 | **Y độc lập anchor**: wrap render page-start margin-top=y (y=50 → top 147, anchor 194); topAndBottom y=30 → top 127, anchor 275; smoke 343 | Developer Agent; `task-498-word-absolute-y.json` |
| 3.2 | 2026-11-16 | **Exclusion plan + NEXT gate**: topAndBottom/multi wrap theo y (2 float top 197/397; above-anchor block 121/anchor 361); NEXT gated `NEXT_RECORD_UNSUPPORTED`; smoke 344 | Developer Agent; `task-499-word-exclusion-next.json` |
| 3.3 | 2026-11-16 | **Line-level split**: topAndBottom y cắt paragraph → inline block trong P, 9 dòng trên + 9 dòng dưới; đoạn text thường; smoke 344 | Developer Agent; `task-500-word-line-split.json` |
| 3.4 | 2026-11-16 | **NEXT mid-record**: pass record pointer, NEXT chuyển record trong template; output A An/B Bình → page break → A Cường; 1 page break; smoke 344 | Developer Agent; `task-501-word-next-midrecord.json` |
| 3.5 | 2026-11-16 | **Line split đoạn có textbox + NEXT theo run**: `data-run-index` cho mọi run, split theo runIndex/offset giữ textbox đúng chỗ; NEXT cursor chuyển record ngay trong paragraph (`A An B Bình`, 1 block, 0 page break); smoke 347 | Developer Agent; `task-502-word-rich-split-next.json` |
| 3.6 | 2026-11-16 | **TopAndBottom đúng y**: bỏ clamp anchor/midpoint, chèn float trước item chứa y và dùng spacer height thay margin để không collapse; boundary y=93 → top 190 (1px border), paragraph sau top 270 = float bottom; smoke 347 | Developer Agent; `task-503-word-exact-y.json` |
| 3.7 | 2026-11-16 | **pPrChange accept/reject**: restore pPr + `syncParagraphModel` (align/indent/style/shading), `hasRevision` nhận format revision, markup block bind text-align; smoke 351 | Developer Agent; `task-504-word-pprchange.json` |
| 3.8 | 2026-11-16 | **Phân trang deterministic**: hội tụ 2 snapshot + tách signature theo block + `w:tblGrid`/fixed layout; 2 lần load đều 269 trang, settle ~4.0–4.2s; Word app.xml 546 trang; smoke 351 | Developer Agent; `task-505-word-deterministic-pagination.json` |
| 3.9 | 2026-11-16 | **Style/font metrics**: parse docDefaults + paragraph/table styles + pgMar; Normal 14pt/after 8pt/line 1.241, TableGrid 10pt; 2 lần load đều **621 trang/598 fragment** deterministic; smoke 355 | Developer Agent; `task-506-word-style-metrics.json` |
| 4.0 | 2026-11-16 | **Spellcheck/grammar mở rộng**: 227 EN + 27 VI + grammar rule dấu câu/ngoặc/abbreviation guard, alternatives trong panel; UI fix khong→không; real doc 96 issue/40ms, 0 false positive; smoke 358 | Developer Agent; `task-507-word-spellcheck-editor.json` |
| 4.1 | 2026-11-16 | **TOC tự cập nhật số trang** sau pagination settle: sync in-place giữ style/hyperlink, suffix match bỏ tiền tố A/1.1; QA deep entry 9→8 khớp heading page 8; smoke 360 | Developer Agent; `task-508-word-toc-auto-refresh.json` |
| 4.2 | 2026-11-16 | **Ink canvas + OOXML part**: canvas 2D thay SVG, pressure 0.35→0.83, lưu `word/ink/ink1.xml` + rel/content-type + `w14:contentPart`; draw/save/reload QA 974→976 alpha px; smoke 361 | Developer Agent; `task-509-word-native-ink.json` |
| 4.3 | 2026-11-16 | **InkML chuẩn**: `inkml:ink` + context/traceFormat X,Y,F + brushProperty + `traceGroup page-N` + trace `brushRef` tuple X Y F; content type `application/inkml+xml`, rel `customXml` Internal, anchor `w:contentPart` trong `w:r`; parser đọc tuple nén `'`/`"`; desktop Word chưa verify (máy không có Word); smoke 363 | Developer Agent; `task-510-word-inkml-part.json` |
| 4.4 | 2026-11-16 | **Ink anchor DrawingML**: plain `w:contentPart` làm Word báo unreadable; chuyển sang `mc:AlternateContent/mc:Choice` + `w:drawing/wp:anchor` + `a:graphicData wordprocessingInk` + `w14:contentPart`, anchor trong cover table; Word mở file UI-saved 1.159.651B, **546 trang/81.368 từ**, PDF page 1 có nét đỏ; vị trí nét còn lệch; smoke 367 | Developer Agent; `task-512-word-ink-word-open.json` |
| 4.5 | 2026-11-17 | **Ink calibrate + grammar UI + pagination**: inverse X 1.132/+0.003, Y 1.238/+0.2216, `oerp:calibrated`; UI wave đúng vùng vẽ; grammar uncountable/comparative/preposition/classifier, **UI QA 9→0**; pagination **546 trang khớp tổng số trang Word 546**; smoke 368; spellcheck/macros gap được chấp nhận | Developer Agent; `task-513-word-grammar-ui-pagination.json` |
| 4.7 | 2026-11-17 | **Per-cell table flow + section geometry**: module thuần `flowRow/paginateTableRows` với `CellPageState`/`clipTop-clipBottom`; test 13 bảng thật 0 mất dòng, deterministic; tích hợp mặc định, paragraph metric 0,95 + table line scale 1,348 + keepNext lookahead → **546 trang tự nhiên không dùng docProps target**, mean Dice **0,558**, **72/546 trang ≥0,8** (trước 0,435/11); per-section size/margins: **trang 544-545 landscape 1056×816, trang 546 portrait 816×1056** đúng Word; W-A21 vẫn một phần | Developer Agent; `task-514-word-page-layout-parity.json` |
| 4.8 | 2026-11-17 | **Ngắt dòng trong ô bảng + đo lại độ cao hàng Word**: thêm `white-space: pre-wrap` cho `<p>` trong `.op-word-table` nên **733 `w:br` trong 579 ô** thành dòng thật (trước gộp thành 1 dòng, bullet list dính nhau); rowFlowScale 1,417→1,4125 giữ **546 trang**; đo Word COM 839 hàng (page/Y) cho thấy hàng nằm gọn 1 trang khớp DOM **0,95**, còn chênh lệch trước đây do hàng vắt trang + header lặp; mean Dice **0,582**, **98/546** trang ≥0,8; bật lại `w:tblHeader` (build 630) làm Dice giảm 0,58→0,52 nên revert; smoke 370 | Developer Agent; `task-516-word-table-break-parity.json` |
| 4.10 | 2026-11-18 | **Header `w:tblHeader` lặp theo Office 365**: chốt ưu tiên bản Word thay baseline 546 trang; sửa lỗi header chỉ được cấp chỗ nhưng không vẽ sau ngắt trang, gộp row fragment thành **một bảng/trang**, giữ slice từng ô để hàng cắt qua trang không mất đuôi; `rowFlowScale` 1,4125→**1,23** vẫn **546 trang**; trang 71 vừa trang, header xám lặp, đuôi hàng nằm đầu trang; body Dice **0,571/94** trang ≥0,8 (số cũ 0,584/98 có nhân bản hàng nối trang); smoke **374** | Developer Agent; `task-518-word-repeat-header.json` |
| 4.9 | 2026-11-17 | **Ô bảng vẽ theo `w:tcPr` đúng Office 365**: đọc `w:shd` (6 ô header `D9D9D9`), `w:vAlign` (2633 ô center), `w:tcBorders` từng cạnh (5034 ô; `nil` = không kẻ; `w:sz`/8 pt → px), `w:tcMar`/`tblCellMar` (twip → px); render vào `td` và giữ style khi hàng cắt qua trang; viền mặc định #9ca3af → #000. Trang 72 giống bản Word: header xám, nhãn giữa ô, kẻ mảnh đen; vẫn **546 trang**, smoke **371**; margin mặc định 108 twip vẫn vẽ 6px vì 7,2px làm 558 trang; header lặp vẫn tắt (unk_38237fd3a8a5b520) | Developer Agent; `task-517-word-table-cell-visuals.json` |
