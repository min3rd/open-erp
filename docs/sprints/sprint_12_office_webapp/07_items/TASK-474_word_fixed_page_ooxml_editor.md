# TASK-474: Word Editor Đầy đủ Client — Page, Track Changes, Field, Equation, Ink & Xuất `.docx`/`.md`

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-474` |
| **Thuộc Feature** | [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Loại** | Frontend Domain Editor (Word `.docx`, `.doc` read-only) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. Mở `.docx` thật, hiển thị đúng trang 816×1056, sửa text/định dạng/bảng/ảnh, lưu lại mở được bằng Word.
2. Paginator tách trang theo nội dung; zoom 50–200% không tràn lề; IME tiếng Việt gõ đúng.
3. Find/Replace, Undo/Redo, Word Count, Ruler, Navigation Pane, Reading View hoạt động.
4. Phủ đủ 20 nhóm `W-A*` client (trừ A06/A19 service): Track Changes, header/footer, footnote/endnote/citation, TOC/bookmark, equation, ink, online video, accessibility, immersive.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `.../core/word/word-model.ts` | `WordDocument`, `WordSection`, `WordBlock`, `WordParagraph`, `WordRun`, `WordTable`, `WordImage` |
| `.../core/word/word-xml-codec.ts` | Đọc/ghi `word/document.xml`, `styles.xml`, `numbering.xml`, rels, media |
| `.../core/word/word-paginator.ts` | Đo dòng, tách trang, page break |
| `.../core/word/word-measure.ts` | `CanvasRenderingContext2D.measureText` cache theo font/size |
| `.../core/word/word-command-stack.ts` | Undo/Redo |
| `.../core/word/word-search.ts` | Find/Replace |
| `.../core/word/word-markdown-export.ts` | Xuất `.md` |
| `.../core/word/word-docx-export.ts` | Đóng gói `.docx` |
| `.../core/word/word-comments.ts` | Đọc/ghi `comments.xml`, anchor, thread, resolve |
| `.../core/word/word-track-changes.ts` | Revision marks, accept/reject, markup view |
| `.../core/word/word-fields.ts` | TOC, bookmark, cross-reference, page number field |
| `.../core/word/word-notes.ts` | Footnote/endnote/citation/bibliography + parts |
| `.../core/word/word-equation.ts` | OMML parse/serialize/edit |
| `.../core/word/word-ink.ts` | Ink strokes, drawing anchors |
| `.../core/word/word-video.ts` | Online video embed + poster |
| `.../core/word/word-accessibility.ts` | Accessibility rules + spellcheck local |
| `.../core/word/word-symbols.ts` | Symbol/emoji content catalogue |
| `.../ui/word/word-comment-panel.component.*` | Panel comment phải 344px |
| `.../ui/word/word-header-footer.component.*` | Vùng sửa header/footer |
| `.../ui/word/word-track-panel.component.*` | Markup/Track Changes panel |
| `.../ui/word/word-accessibility-panel.component.*` | Panel accessibility + spellcheck |
| `.../ui/word/word-editor.component.*` | Khung editor, zoom, ruler |
| `.../ui/word/word-page.component.*` | `div.op-word-page` + editing surface |
| `.../ui/word/word-table-toolbar.component.*` | Tab contextual `Table` |
| `.../ui/word/word-nav-pane.component.*` | Headings/Find/Replace |

## 2. Mô hình dữ liệu (bắt buộc)

| Thực thể | Trường chính | Ghi chú |
| :--- | :--- | :--- |
| `WordDocument` | `sections[]`, `styles`, `media[]`, `preservedParts` | `preservedParts` giữ mọi part không sửa |
| `WordSection` | `pageSize {w,h}`, `margins {top,right,bottom,left}`, `orientation`, `blocks[]` | Đơn vị Twip nội bộ, quy đổi px khi render |
| `WordParagraph` | `id`, `runs[]`, `styleId`, `alignment`, `indent`, `spacing`, `list?`, `pageBreakBefore` | `id` ổn định để undo/redo |
| `WordRun` | `text`, `bold`, `italic`, `underline`, `strike`, `color`, `highlight`, `font`, `sizePt` | Map 1-1 `w:rPr` |
| `WordTable` | `rows[]`, `cols[]`, `cells[{rowSpan,colSpan,blocks[]}]`, `widths[]` | Hỗ trợ merge đơn giản |
| `WordImage` | `relId`, `mime`, `bytes`, `widthPx`, `heightPx`, `alt` | Inline only |
| `WordComment` | `id`, `author`, `initials`, `date`, `text`, `resolved`, `parentId?`, `anchor{blockId,start,end}` | Map `w:comment` |

## 3. Yêu cầu chức năng

### 3.1 Đọc & render

| Mã | Yêu cầu |
| :--- | :--- |
| 474-F01 | Parse `word/document.xml` theo namespace `w`, giữ thứ tự block; bỏ qua phần tử không hỗ trợ nhưng ghi `ParseWarning` và **giữ nguyên XML gốc** để lưu lại. |
| 474-F02 | Đọc style từ `styles.xml`: `Normal`, `No Spacing`, `Heading 1–3`, `Title`; style thiếu → fallback Normal + warning. |
| 474-F03 | Render trang: content-box `816×1056px` (Letter 8.5×11" @96dpi), viền ngoài 1px; margin mặc định 1" (96px) trừ khi document khai báo khác. |
| 474-F04 | Paginator: đo chiều cao từng dòng bằng `measureText`, cộng spacing; đầy trang → tạo trang mới; `w:br type="page"` và `pageBreakBefore` luôn sang trang. |
| 474-F05 | Nền vùng làm việc `bg-neutral-100 dark:bg-neutral-900`; trang trắng có shadow nhẹ; zoom 50–200% + `Fit` theo bề rộng khung. |
| 474-F06 | Ruler ngang hiển thị margin + tab stops cơ bản; bật/tắt từ `View > Ruler`, lưu `?ruler=1`. |

### 3.2 Soạn thảo

| Mã | Yêu cầu |
| :--- | :--- |
| 474-F07 | Mỗi trang là một `[contenteditable=true]`; caret ở cuối trang → `Enter` tạo block đầu trang sau; `Backspace` ở đầu trang → gộp với trang trước. |
| 474-F08 | Gõ tiếng Việt qua IME: xử lý `compositionstart/update/end`, không nhân đôi dấu; test Telex và VNI. |
| 474-F09 | Định dạng run: bold/italic/underline/strike/color/highlight/font/size; áp dụng cho selection hoặc toàn run tại caret. |
| 474-F10 | Định dạng đoạn: 4 căn lề, tăng/giảm indent, line spacing 1.0/1.15/1.5/2.0; áp dụng cho mọi đoạn trong selection. |
| 474-F11 | Style: chọn Heading 1–3 đổi styleId + hiển thị đúng; `Normal` reset định dạng đoạn. |
| 474-F12 | Danh sách: bullet `•` và number `1.`; Tab/Shift+Tab tăng giảm cấp; Enter trong list tạo mục mới, Enter 2 lần thoát list. |
| 474-F13 | Bảng: chèn NxM, gõ trong ô, Tab sang ô kế, thêm/xóa dòng-cột, merge/unmerge ô chọn, độ rộng cột kéo được. |
| 474-F14 | Ảnh: chèn từ file local, nhúng `word/media/imageN.ext`, hiển thị inline đúng tỉ lệ, kéo góc resize giữ tỉ lệ; alt text mặc định là tên file. |
| 474-F15 | Page Break, ngắt trang thủ công; không cho xóa page break bằng Backspace thường (phải chọn block). |
| 474-F16 | Undo/Redo: stack ≥ 50, gộp thao tác gõ trong 500ms thành 1 bước; `Ctrl+Z/Ctrl+Y`. |
| 474-F17 | Find/Replace: plain text, tùy chọn `Match case`, `Whole word`; highlight tất cả kết quả; Replace/Replace All cập nhật đúng và có thể Undo. |
| 474-F18 | Word Count: đếm từ theo khoảng trắng + Unicode, đếm ký tự (có/không space), đếm trang; cập nhật status bar sau 300ms debounce. |
| 474-F19 | Navigation Pane: tab Headings liệt kê Heading 1–3, click cuộn tới; tab Find/Replace như C06. |
| 474-F20 | Reading View: ẩn ruler/nav, chỉ đọc, zoom fit width; thoát bằng Esc hoặc nút `View > Reading View`. |
| 474-F21 | Selection/caret không được nhảy khi paginator reflow; lưu `{blockId, offset}` trước reflow và khôi phục sau. |

### 3.3 Lưu & xuất

| Mã | Yêu cầu |
| :--- | :--- |
| 474-F22 | Xuất `.docx`: cập nhật `word/document.xml`, `styles.xml`, `numbering.xml`, `document.xml.rels`, `[Content_Types].xml`; giữ nguyên part không sửa. |
| 474-F23 | Ảnh mới thêm phải có entry `word/media/*`, quan hệ `r:embed`, content type đúng; ảnh xóa phải dọn rel + part (nếu không còn tham chiếu). |
| 474-F24 | File gốc `.doc` (OLE2): chỉ mở read-only, trích text + cảnh báo `OFFICE_LEGACY_EXPORT_AS_OOXML`; `Ctrl+S` xuất `.docx`. |
| 474-F25 | Xuất Markdown: Heading → `#`, bold → `**`, italic → `*`, list → `-`/`1.`, bảng → GFM table, ảnh → tham chiếu file kèm; không mất tiếng Việt. |
| 474-F26 | In/PDF: `@media print` chỉ in vùng trang, mỗi `.op-word-page` là 1 trang, ẩn toolbar/status/ruler; lề in khớp margin tài liệu. |
| 474-F27 | Sau khi lưu local thành công: `DocumentSaveState = SAVED`, xóa draft tương ứng; lỗi quyền ghi → `OFFICE_SAVE_PERMISSION_DENIED` + giữ dirty. |
| 474-F28 | Nếu file gốc có macro (`.docm`), từ chối mở với `OFFICE_MACRO_FILE_UNSUPPORTED` (không thực thi). |

### 3.4 Comment (AC-11)

| Mã | Yêu cầu |
| :--- | :--- |
| 474-F29 | Đọc `word/comments.xml` + `commentsExtended.xml` (nếu có) và anchor `w:commentRangeStart`, `w:commentRangeEnd`, `w:commentReference`; comment resolved hiển thị mờ + nhãn `Đã giải quyết`. |
| 474-F30 | Chọn text (trong 1 đoạn hoặc nhiều đoạn liền kề) → `New Comment` mở thẻ soạn ở panel phải; selection rỗng → nút disabled + tooltip. |
| 474-F31 | Thẻ comment: avatar, tên tác giả, thời gian tương đối, nội dung, `Reply`, `Resolve`/`Unresolve`, `Delete`; reply tạo thread cùng anchor; xóa comment cha xóa cả thread sau xác nhận. |
| 474-F32 | Panel phải rộng **344px**, mở/đóng bằng nút `Comments`, không phải modal; `Prev/Next` cuộn tới anchor và highlight vùng text. |
| 474-F33 | Tác giả lấy từ user ERP hiện tại (tên + initial); thời gian lưu ISO 8601; không hardcode "Vũ Văn Minh". |
| 474-F34 | Lưu vào `word/comments.xml` + anchor trong `document.xml`; giữ comment gốc có sẵn trong file, không làm mất khi round-trip. |
| 474-F35 | Comment trên file `.doc` read-only: chỉ hiển thị nếu trích xuất được, không cho tạo mới. |
| 474-F36 | Xóa comment phải dọn anchor + reference tương ứng; Undo phục hồi cả 3 phần. |

### 3.5 Đầy đủ chức năng client còn lại (theo AUDIT-S12-001)

| Mã | Yêu cầu |
| :--- | :--- |
| 474-F37 | Track Changes: bật/tắt ghi nhận; ghi insert/delete/format change kèm tác giả + thời gian; markup view `All`/`Simple`/`No Markup`; Accept/Reject từng thay đổi hoặc tất cả; Previous/Next; Undo; persist `w:ins`, `w:del`, `w:rPrChange`, `w:pPrChange`. |
| 474-F38 | Header/Footer + Page Numbers: vào chế độ sửa header/footer, khác trang đầu, đánh số trang (vị trí/định dạng/start at), nhiều section; persist `header*.xml`, `footer*.xml`, `sectPr`. |
| 474-F39 | Footnote/Endnote: chèn/xóa/điều hướng, đánh số liên tục hoặc restart theo section, separator, panel hiển thị; persist `footnotes.xml`, `endnotes.xml`. |
| 474-F40 | Citations/Bibliography: Source Manager (thêm/sửa/xóa nguồn), chèn citation, tạo bibliography, style APA/MLA/Chicago; persist bibliography part. |
| 474-F41 | TOC + Bookmarks + Cross-reference: chèn TOC theo cấp heading, Update page numbers/entire table, bookmark đặt/xóa, cross-ref tới heading/bookmark/figure/table, hyperlink nội bộ. |
| 474-F42 | Columns + Section Breaks + Line Numbers: 1–3 cột + khoảng cách, break Continuous/Next Page/Even/Odd, line numbering continuous/restart/page; persist `sectPr`. |
| 474-F43 | Page Borders + Page Color: kiểu/độ dày/màu viền, áp dụng toàn tài liệu hoặc section, page color; persist. |
| 474-F44 | Equation (OMML): chèn/sửa công thức, cấu trúc fraction/script/radical/integral/matrix/delimiter, nhập linear hoặc Unicode; persist `m:oMath`. |
| 474-F45 | Symbol + Emoji content: bảng symbol theo font/block, recent, chèn Unicode; emoji chỉ là **nội dung tài liệu**, nút mở dùng icon SVG (không emoji trong UI). |
| 474-F46 | Drawing/Ink: pen/highlighter/eraser, màu/độ dày, nét neo theo paragraph, chọn/xóa nét; persist dạng DrawingML (fallback ảnh). |
| 474-F47 | Online Video: chèn URL YouTube/SharePoint, hiển thị poster + phát khi click, fallback link khi offline; persist hyperlink + ảnh preview. |
| 474-F48 | Checklist + paragraph borders/shading + full style gallery: checklist toggle, viền/nền đoạn, style Title/Subtitle/Quote/Intense/Heading 1–6. |
| 474-F49 | Spellcheck local + Accessibility: từ điển cục bộ, ignore/add, gạch chân; panel kiểm tra heading order, alt text, table header, empty link, contrast; nhảy tới lỗi. |
| 474-F50 | Immersive Reader + Dark Mode/Switch Background: chế độ đọc (column width, text spacing), dark mode, page background color; Read Aloud (speech) loại trừ. |
| 474-F51 | Comment filter/mark all read: lọc theo tác giả/resolved, mark all as read, show/hide resolved; không ảnh hưởng nội dung. |
| 474-F52 | Clipboard/Format Painter/Clear Formatting: copy/cut/paste text + HTML + Paste Special, painter 1 lần hoặc khóa, clear formatting run/paragraph. |

## 4. Mã lỗi & i18n

| Mã | Khi nào | Key i18n |
| :--- | :--- | :--- |
| `OFFICE_DOCX_PARSE_FAILED` | XML/document.xml hỏng | `office.error.OFFICE_DOCX_PARSE_FAILED` |
| `OFFICE_DOC_UNSUPPORTED_FEATURE` | `.doc` có thành phần không đọc được | `office.error.OFFICE_DOC_UNSUPPORTED_FEATURE` |
| `OFFICE_LEGACY_EXPORT_AS_OOXML` | Lưu `.doc` | `office.error.OFFICE_LEGACY_EXPORT_AS_OOXML` |
| `OFFICE_MACRO_FILE_UNSUPPORTED` | `.docm` | `office.error.OFFICE_MACRO_FILE_UNSUPPORTED` |
| `OFFICE_SAVE_PERMISSION_DENIED` | FS Access từ chối | `office.error.OFFICE_SAVE_PERMISSION_DENIED` |
| `OFFICE_IMAGE_TOO_LARGE` | Ảnh > 10MB | `office.error.OFFICE_IMAGE_TOO_LARGE` |

## 5. Acceptance checklist

- [ ] AC-474-01 Mở `table-image.docx`: đúng 2 trang, bảng và ảnh hiển thị đúng vị trí, không tràn lề.
- [ ] AC-474-02 Sửa text + bold + đổi font/size → lưu → mở bằng Word: định dạng giữ nguyên.
- [ ] AC-474-03 Chèn bảng 3×3, thêm dòng, merge 2 ô → lưu → mở lại: cấu trúc đúng.
- [ ] AC-474-04 Chèn ảnh PNG 800×600 → hiển thị đúng tỉ lệ → lưu → mở lại ảnh còn.
- [ ] AC-474-05 Gõ “Tiếng Việt: ă â ê ô ơ ư đ” bằng Telex và VNI: không nhân đôi dấu, không mất ký tự.
- [ ] AC-474-06 Trang đúng `818×1058` ngoài viền, content `816×1056`; zoom 50/100/200 không tràn.
- [ ] AC-474-07 Find “tài liệu” → 3 kết quả highlight; Replace All → 3 thay; Undo phục hồi.
- [ ] AC-474-08 Undo/Redo 50 bước liên tiếp không mất nội dung; Ctrl+Z sau Replace All hoạt động.
- [ ] AC-474-09 Lưu `.docx` rồi mở lại bằng LibreOffice: 0 lỗi định dạng; part không sửa giữ nguyên hash.
- [ ] AC-474-10 Xuất `.md`: heading/bold/list/bảng đúng cú pháp, tiếng Việt nguyên vẹn.
- [ ] AC-474-11 In preview: mỗi trang đúng 1 trang giấy, không có toolbar.
- [ ] AC-474-12 `.doc` mở read-only, có banner cảnh báo, `Ctrl+S` tải `.docx`.
- [ ] AC-474-13 0 `console.error` trong toàn bộ luồng mở → sửa → lưu.
- [ ] AC-474-14 Chọn 1 đoạn → New Comment → thẻ hiện ở panel 344px, lưu, F5 mở lại còn comment + anchor đúng.
- [ ] AC-474-15 Reply trong thread, Resolve đổi trạng thái, Delete xóa cả thread; Undo phục hồi.
- [ ] AC-474-16 Lưu `.docx` mở bằng Word: comment + reply + resolved hiển thị đúng, không mất comment gốc của file.
- [ ] AC-474-17 Prev/Next cuộn tới đúng anchor và highlight vùng text tương ứng.
- [ ] AC-474-18 Track Changes: bật, sửa text + format, markup All/Simple/No, Accept/Reject từng cái và tất cả; lưu `.docx` mở Word còn revision.
- [ ] AC-474-19 Header/Footer + Page Numbers: sửa header/footer, khác trang đầu, số trang; lưu mở lại đúng.
- [ ] AC-474-20 Footnote/Endnote + Citation: chèn 3 footnote, 2 citation, bibliography APA; lưu mở Word còn.
- [ ] AC-474-21 TOC từ Heading 1–3 + Update page numbers + bookmark + cross-reference hoạt động.
- [ ] AC-474-22 Columns 2 cột + Section Break Next Page + Line Numbers + Page Border/Color; lưu mở lại đúng.
- [ ] AC-474-23 Equation phân số/căn/chỉ số + symbol + emoji content; lưu mở Word còn OMML.
- [ ] AC-474-24 Ink 3 nét + Online Video URL; lưu mở lại còn nét/video poster.
- [ ] AC-474-25 Checklist + style gallery + spellcheck local + Accessibility panel + Immersive Reader + Dark Mode hoạt động.

## 6. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/evidence/task-474-before.docx` / `after.docx` | File gốc và file sau khi sửa |
| `08_testing/evidence/task-474-page.png` | Trang 816×1056 + ruler |
| `08_testing/evidence/task-474-table.png` | Bảng + tab contextual |
| `08_testing/evidence/task-474-ime.md` | Biên bản gõ Telex/VNI từng ký tự |
| `08_testing/evidence/task-474-word-count.md` | Số từ/trang trước–sau |

## 7. Ngoài phạm vi (chỉ dịch vụ/không khả thi client)

- Dictate, Editor AI (grammar/style), Translate, Add-ins, Read Aloud (speech service).
- Macro/VBA, mail merge với nguồn dữ liệu ngoài, protected document, co-authoring.
- Help/Feedback/What's New.
- Handwriting recognition (ink → text) và 3D/embed ngoài luồng video URL.

## 8. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| Paginator lệch font giữa máy | Đo bằng `measureText` với font thật; test 3 font (Calibri, Arial, Times New Roman) |
| Caret nhảy khi reflow | Lưu/khôi phục `{blockId, offset}`; debounce reflow 50ms |
| IME làm hỏng run | Không tách run trong lúc composition; commit sau `compositionend` |
| Ảnh lớn làm chậm | Giới hạn 10MB, resize > 2000px cạnh dài trước khi nhúng |
| Serializer làm mất phần không hỗ trợ | `preservedParts` + test hash part không sửa |

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer |
| 0.2 | 2026-11-15 | Đặc tả 28 FR, mô hình dữ liệu, 13 AC, i18n và phạm vi loại trừ | Architect; BENCH-S12-002/003 |
| 0.3 | 2026-11-15 | Thêm Comment (`F29–F36`, `AC-14–AC-17`) theo quyết định R3; Track Changes vẫn ngoài phạm vi | Chủ dự án; 8 câu hỏi tương tác |
| 0.4 | 2026-11-15 | Phủ sóng đầy đủ client: Track Changes, header/footer, footnote/endnote, citation, TOC/bookmark/cross-ref, columns/breaks/line numbers, page border/color, equation, symbol/emoji content, ink, online video, checklist, spellcheck/accessibility, immersive/dark (`F37–F52`, `AC-18–AC-25`) | Chủ dự án; AUDIT-S12-001 |
