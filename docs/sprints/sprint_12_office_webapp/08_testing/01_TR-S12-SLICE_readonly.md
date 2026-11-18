# TR-S12-SLICE — Báo cáo kiểm thử vertical slice Office WebApp (Read-only)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S12-SLICE / Test report / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 6.13 / 2026-11-18 |
| Baseline | `00a1539e` + working tree ngày 2026-11-16 |
| Owner | Developer Agent |
| Phạm vi | Vertical slice: OOXML client đọc/sửa/lưu + **Word ribbon 11 tab/45 nhóm/173 lệnh + tab Bảng theo ngữ cảnh + sửa chữ trong ô + gộp/tách ô (`w:gridSpan`/`w:vMerge`), chỉ còn Macros disabled** + **kiểm chứng tài liệu thầu thực 1.2MB** + Excel 410 hàm/CF-DV/Table-Slicer/format-edit-ops/names-protection-comments + PPT slide-ops/comments/SmartArt/media + PDF annotation/search + mobile QA/ERP docId |

## 1. Kết quả đã chạy

| Hạng mục | Lệnh / cách chạy | Kết quả |
| :--- | :--- | :--- |
| Smoke test lõi | `npm run office:test` | **385 passed, 0 failed** + manifest 0 lỗi (gồm round-trip tài liệu thầu thực 1.2MB, phân trang deterministic, style/metrics, PAGE field, mail merge NEXT theo run, index, nested table đệ quy, wpg group, reflow, pPrChange, spellcheck/grammar Editor rules + uncountable/comparative, TOC auto page sync, InkML part + differential trace + DrawingML ink anchor) |
| Build backend plugin | `npm run office:server:build` | **BUILD SUCCESS**, `plugin-office-webapp-1.0.0.jar` |
| Backend unit test | `npm run office:server:test` | **14 tests, 0 failures** khi bật MinIO (13 khi MinIO tắt) — 11 unit + PostgreSQL + MinIO + E2E gateway |
| Formula catalogue | Smoke test | **410 hàm**: 252 cũ + 158 mới (CEILING/FLOOR.MATH, GAMMA/ERF, distribution NORM/BINOM/POISSON/BETA/T/F/CHISQ/GAMMA + legacy aliases, AVERAGEA/STDEVA/COVARIANCE/STEYX/PERCENTRANK, complex IM*, CONVERT, CUMIPMT/CUMPRINC/XNPV/MIRR/VDB/DURATION, SUBTOTAL/AGGREGATE, ADDRESS/COLUMN(S)/ROW(S), WORKDAY/NETWORKDAYS.INTL, LEFTB/FINDB); sửa tokenizer tên hàm chứa số |
| Dependency recalculation | Smoke + UI | Chain `A1→B1→C1→D1` cập nhật đúng; sửa `B2` UI đổi `D2=-74.999.750`, `B4=150.000.250` |
| Pivot engine | Smoke + UI | Row/column field, SUM/COUNT/AVERAGE/MIN/MAX, row/column/grand totals |
| Chart engine | Smoke + UI | Model + layout cột/thanh/đường/tròn, trục, legend; SVG 4 loại |
| Conditional formatting | Smoke + UI | Parse `cellIs`, `containsText`, `colorScale`, `dataBar`, `top10`; **UI tạo rule** (range/type/operator/value/color) ghi `conditionalFormatting`; canvas tô nền/thanh dữ liệu ngay; file tải từ UI parse lại rule `greaterThan 120` |
| Data validation | Smoke + UI | Parse list/whole/decimal/date/time/textLength/custom; **UI tạo rule** (range/type/formula1/formula2/message) ghi `dataValidations` với count; nhập sai bị chặn banner `VALIDATION_WHOLE`; file tải từ UI parse lại rule |
| Excel Table/Slicer | Smoke + UI + round-trip | Tạo table từ range (columns từ header); lưu **native `xl/tables/table1.xml`** + `tableParts` trong sheet XML + sheet rels + content-type override; vẫn giữ analysis cho slicer; file tải từ UI parse lại table `Sales` (A1:D3) + slicer `Tháng=01/2026`, lọc còn 1 dòng |
| Excel cell format | Smoke + UI + round-trip | Parse/ghi `xl/styles.xml`: font/bold/italic/underline/double/strike, size, color, fill, border, align, number format; ô có `s` trỏ cellXf mới; file tải từ UI `B4` styleIndex 5, display `120,000,000` |
| Excel sort/find/filter | Smoke + UI + round-trip | Sort asc/desc theo cột (ghi lại thứ tự ô + `sheetData`), find theo value/formula/ref, filter ẩn dòng trên canvas; file tải từ UI thứ tự `Tổng/02/01`, find “Doanh thu” 1 kết quả |
| Excel freeze panes | Smoke + UI + round-trip | Ghi `<pane xSplit/ySplit topLeftCell state="frozen">`; file tải từ UI freeze `B2`, parse lại row1/col1 |
| Excel insert/delete | Smoke + UI + round-trip | Chèn/xóa ô phải/xuống/trái/lên + dòng/cột, rebuild `sheetData`; file tải từ UI giữ cấu trúc sau thao tác |
| Excel AutoSum | Smoke + UI + round-trip | Quét số liền kề trên/trái, tạo `=SUM(B2:B4)` + cached value; file tải từ UI B5 `540000000` |
| Excel clear | Smoke + UI | Xóa nội dung (giữ style), xóa định dạng (giữ value), xóa tất cả (bỏ ô) |
| Excel merge/wrap/indent/orientation | Smoke + UI + round-trip | Gộp `A6:C6` + center, `wrapText`, indent, vertical 3 mức, rotation 45° trong `w:alignment`; file tải từ UI giữ style |
| Excel custom sort/reapply | Smoke + UI | Khóa chính + khóa phụ, asc/desc, nút Áp dụng lại; file tải từ UI thứ tự 01/02/Tổng |
| Excel cell styles/accounting | Smoke + UI + round-trip | Preset Normal/Good/Bad/Neutral/Total, accounting `#,##0 "₫"`, %, comma, decimal ±; file tải từ UI B2 Good + `120,000,000 ₫` |
| Excel CF manage | Smoke + UI | Liệt kê rule theo range/type, xóa từng rule, Clear All; file tải từ UI giữ rule `B2:B4 cellIs > 10` |
| Excel name manager | Smoke + UI + round-trip | `definedNames` trong workbook.xml, thêm/xóa `Scores = Data!$B$2:$B$4`; file tải từ UI parse lại đúng |
| Excel protection | Smoke + UI + round-trip | `sheetProtection` + `workbookProtection lockStructure`; file tải từ UI cả hai bật |
| Excel comments | Smoke + UI + round-trip | `comments1.xml` + VML + rel + content-type + `legacyDrawing`; file tải từ UI A2 “Ghi chú A2” |
| Dual-mode QA | Desktop 1496×894 + harness 390×844/844×390 | 4 định dạng desktop `overflowX ≤ 0`, 0 lỗi; mobile portrait `scrollWidth 390`, overflow 0, 0 nút < 40px; landscape 829 ≤ 844; 9 ảnh + `task-475-qa.json` |
| Word comments | Smoke + UI + round-trip | Parse comment gốc, tạo/reply/resolve/xóa thread, anchor `commentRangeStart/End`, lưu `comments.xml` + `commentsExtended.xml`; file tải từ UI parse lại còn 2 comment + parent + resolved |
| Word track changes | Smoke + UI + round-trip | Parse `w:ins`/`w:del`/`w:rPrChange`; accept/reject từng cái + tất cả; reject `rPrChange` khôi phục formatting gốc; sửa text khi bật tracking tạo cặp ins/del; file tải từ UI parse lại còn 2 revision |
| Word online video | Smoke + UI + round-trip | Parse `wp15:webVideoPr href`/`embeddedUrl` (fallback `a:videoFile`); render link “Video trực tuyến” cả chế độ thường và All Markup; lưu/mở lại giữ URL |
| PPT transitions | Smoke + UI + round-trip | 11 loại (none/fade/push/wipe/split/reveal/cut/zoom/cover/pull/morph), duration ms, apply slide/all; lưu `p:transition` + `p14:dur`, file tải từ UI parse lại `push 700ms` cả 2 slide |
| PPT animations | Smoke + UI + round-trip | Entrance appear/fade/fly-in/zoom/wipe, trigger click/after, delay/duration; lưu `p:timing`, parse lại đúng shape/effect; chạy CSS animation trong slideshow |
| PPT SmartArt/media/chart | Smoke | Đọc `p:graphicFrame` DiagramML text, `a:videoFile`/`a:audioFile` rel + media path, chart title; giữ `packageEntries` để phát media |
| PPT SmartArt edit | Smoke + UI + round-trip | Panel click shape SmartArt: sửa từng node text, áp dụng cập nhật `a:t` + stage; lưu `ppt/diagrams/data1.xml`; file tải từ UI parse lại nodes `Ý tưởng đột phá` / `Triển khai Q4` |
| PPT media playback | UI + browser + round-trip | Video/audio nhúng đọc bytes từ package → blob URL, render `<video>/<audio>` controls cả stage và slideshow; file mẫu ffmpeg 2s mp4 + 1s wav, `readyState 4`, duration 2/1; lưu lại giữ đủ 3002B video + 88278B audio |
| Word columns/section | Smoke + UI + round-trip | Parse/ghi `w:cols` num/space, `w:pgSz` A4/Letter + orient, `w:pgMar`; chèn paragraph-level `w:sectPr` clone; file tải từ UI có 2 section, 2 cột, landscape, lề 720 |
| Word accessibility | Smoke + UI + round-trip | Scan heading skip/empty, ảnh `pic:cNvPr` thiếu `descr`, bảng thiếu `w:tblHeader`; panel gán alt + đánh dấu header; file tải từ UI còn `descr="Ảnh minh họa bố cục trang"` + 1 `tblHeader`, issues còn heading |
| PDF thumbnails | UI + browser | Sidebar ảnh thu nhỏ từng trang (iframe `#page=n`, lazy, pointer-events none), click đổi trang; sample 2 trang hiển thị đúng nội dung Page 1/Page 2, thumb active theo trang |
| PDF text search | Smoke + UI + browser | Trích text từ content stream (uncompressed + `FlateDecode`), search case-insensitive, danh sách hit + `mark` trên trang, Ctrl+F, next/prev cuộn trang, “0 kết quả”; sample “Page” → 2 hit, next → trang 2 + highlight |
| PostgreSQL integration | `OfficeDocumentServicePostgresTest` | Schema tạm + migrations thật, `JdbcPluginDataClient` gọi `OfficeDocumentService`: create/list/get/update, upload v2 + checksum, download v2/v3, version list, conflict 409, share READ/WRITE, ACL, cross-tenant 404, revoke, soft delete; **1 test PASS** |
| MinIO integration | `OfficeBlobStoreMinioTest` | Health 200, bucket `tenant-files`, SigV4 PUT/GET v1/v2, key `<tenant>/office/<doc>/vN_report.docx`, checksum + bytes khớp, DELETE cleanup; **1 test PASS**; sửa bug `Host` header bị java.net.http chặn |
| E2E multipart qua gateway | `OfficeDocumentResourceGatewayTest` | `@QuarkusTest` + profile trỏ `plugin.data.gateway-url` tới server gRPC in-process (contract `PluginDataService`, backend PostgreSQL thật, schema tạm): POST tạo document → PUT multipart (22B, expected_version 1) → GET bytes + `X-Document-Version: 2`; kiểm tra bảng version (v2, size, checksum, storage key); **1 test PASS** |
| Word image | Smoke + UI + round-trip | Parse `w:drawing` → `a:blip r:embed` + `wp:extent` + `wp:docPr descr`, media từ package; render `<img>` đúng 240×120, alt “Logo ERP”; lưu/mở lại giữ `word/media/image1.png` 426B |
| Word All-Markup editing | Smoke + UI + round-trip | All view contenteditable; sửa text → `setAcceptedText` bỏ `w:ins`/`w:del`, giữ drawing; file tải từ UI không còn revision, text mới, ảnh + media còn nguyên; nút Thay đổi về (0) |
| Word undo/redo | Smoke + UI | Snapshot XML + entries (max 50); sửa text → Hoàn tác trả “Báo cáo Sprint 12”, Làm lại trả “Báo cáo Sprint 12 (sửa)”; Ctrl+Z/Y khi không focus contenteditable |
| Word find/replace | Smoke + UI | `findWordMatches` matchCase/wholeWord; panel đếm “1 kết quả”, highlight đoạn, thay “WebApp”→“Web App” rồi Undo phục hồi; thay tất cả qua `replaceWordText` + round-trip |
| Word insert table | Smoke + UI + round-trip | Panel 2 dòng × 3 cột, `w:tbl` + `w:tblGrid` + borders; DOM có 2 bảng; file tải từ UI parse lại bảng cuối 2×3, 3 `w:gridCol` |
| Word insert image | Smoke + UI + round-trip | Nhận PNG từ file input, `createImageBitmap` lấy 64×32, ghi `word/media/image1.png` + rel + content-type; render đúng 64×32; file tải từ UI giữ ảnh 183B |
| Word paragraph format | Smoke + UI + round-trip | Align 4 kiểu (`w:jc`), thụt lề ±720 twips (`w:ind`), giãn dòng 1.0/1.15/1.5/2.0 (`w:spacing`); file tải từ UI parse lại center/720/1.5 đúng |
| Word list + numbering | Smoke + UI + round-trip | Bullet/number tạo `word/numbering.xml` (abstractNum 9001/9002), `w:numPr`, rel + content-type; render marker CSS; parse lại `listType` bullet/number |
| Word style gallery | Smoke + UI | Normal/Title/Subtitle/Heading 1–6/Quote; Normal reset `pStyle/jc/ind/spacing/numPr`; file tải từ UI giữ `Heading2` + `headingLevel 2` |
| Word page break | Smoke + UI + round-trip | Chèn `w:p/w:r/w:br w:type="page"` trước sectPr; block `pageBreak` hiển thị marker không editable; file tải từ UI có 1 `w:br type=page` |
| Word page border/color | Smoke + UI + round-trip | `w:pgBorders` (double, sz 12, color FF0000, offset page) + `w:background FFF2CC`; CSS border đỏ 2px, nền vàng; file tải từ UI parse lại |
| Word line numbering | Smoke + UI + round-trip | `w:lnNumType countBy=1 restart=newPage`, bật/tắt off; round-trip |
| Word reading/immersive | UI + browser | Chế độ đọc ẩn ribbon + thanh thoát, contenteditable=false; Immersive page 680px, font 18/line-height 1.9 |
| Word ruler/dark | UI + browser | Ruler 816px với 9 vạch; dark page `#1f2937` + text sáng; file nền trang vẫn giữ màu đã chọn |
| Word navigation pane | Smoke + UI | Panel 280px liệt kê heading (`tocEntries`), bấm nhảy tới đoạn + mở Find; browser thấy `H1 Báo cáo Sprint 12` |
| Word hyperlink | Smoke + UI + round-trip | Panel text+URL → `w:hyperlink r:id` + rel `TargetMode=External`; link sống sót sau chèn symbol/sửa đoạn; file tải từ UI có 1 `w:hyperlink` + rel openai.com |
| Word symbol picker | Smoke + UI | 28 ký tự (© ® ™ § ± × ÷ ≤ ≥ α β π Ω ← → …); chèn cuối đoạn đang chọn, không phá hyperlink |
| Word insert online video | Smoke + UI + round-trip | Panel URL → `w:drawing/wp15:webVideoPr`; render “Video trực tuyến”; file tải từ UI giữ `href`/`embeddedUrl` |
| Word spellcheck | Smoke + UI | Từ điển ~110 lỗi phổ biến + từ lặp + 5 rule ngữ pháp; text “the the recieve adress” → 4 issue, Sửa hết → “The receive address”, file tải từ UI giữ text đã sửa |
| Word grammar rules | Smoke + UI | Phát hiện 2 space, space trước dấu, thiếu space sau dấu câu, `!!`, chữ thường đầu câu; 6/6 issue đúng loại `grammar` |
| Word ribbon Office 365 | Smoke + UI + browser | **11 tab** (Trang chủ/Chèn/**Bảng**/Vẽ/Thiết kế/Bố cục/Tham chiếu/Thư tín/Xem lại/Xem/Trợ giúp), **45 nhóm**, **173 lệnh**, **12 dropdown** (phông/cỡ/màu/tô sáng/kiểu/giãn dòng/lề/hướng/khổ/cột/số dòng/zoom); smoke kiểm tra cấu trúc + phủ nhóm |
| Word table editing | Smoke + UI + browser | **Tab Bảng theo ngữ cảnh** (17 lệnh, icon Fluent): chèn/xóa hàng cột, xóa bảng, `w:tblHeader`, chia đều cột, `w:vAlign` ô, `w:jc` bảng, **Gộp ô / Tách ô**. **Chữ trong ô vào model + `w:t`** (trước đây mất khi rời trang); `Enter` tách đoạn trong ô; mảnh bảng chia trang mang `rowMap` (xóa hàng 235 ở trang 150+ xóa đúng hàng gốc). Hàng bị cắt qua trang read-only. Tài liệu thầu 546 trang/839 hàng, 0 lỗi console; ảnh `word-table-tab.png`; 8 ca smoke mới (385 tổng) |
| Word merged cells | Smoke + UI + browser | Đọc `w:gridSpan`/`w:vMerge` thành `WordCellSpan`, vẽ `colspan`/`rowspan` (ô continue ẩn; trang bắt đầu giữa vùng gộp vẫn vẽ ô continue); chọn vùng ô bằng kéo chuột hoặc Shift+click có nền xanh; **Gộp ô** ghi `w:gridSpan` + `w:vMerge restart/continue` và dồn chữ vào ô đầu, **Tách ô** mở panel hàng × cột (mặc định 1×1) và xóa hai thuộc tính gộp; chèn/xóa cột tính theo cột lưới. Đo dòng theo `data-cell` (trước đó ẩn ô continue làm lệch chữ của hàng sau). Tài liệu thầu vẫn 546 trang, 4 ô `rowspan=2`, 2 ô `colspan=6`, 0 lỗi console; ảnh `word-merged-cells.png`; 9 ca smoke mới (394 tổng) |
| Word ribbon controls | UI + browser | Bold theo vùng chọn “Office” → `w:700`, nút active; Insert > Chèn bảng mở panel; Review > Thống kê từ hiện 1 trang/52 từ/191 ký tự/4 đoạn; Help > Phím tắt 5 mục |
| Word ribbon modes | UI + browser | Chế độ Editing/Suggesting/Viewing áp tracking/reading; ribbon Classic → Single-line → Tabs-only → Classic; URL `?tab=` đổi theo tab |
| Word layout commands | UI + round-trip | Lề Hẹp + Hướng Ngang áp ngay vào sectPr; file tải từ UI `orientation=landscape`, `pgSz 16838×11906`, `pgMar 720` |
| Word status bar | UI + browser | “52 từ · Trang 1 / 1 · − 100% + A”; bấm số từ mở Word Count, +/− đổi zoom, A bật chế độ đọc |
| Word cover page | Smoke + UI + round-trip | Chèn Title/Subtitle/ngày + ngắt trang vào đầu document.xml; file tải từ UI có `pStyle Title`, 1 page break |
| Word text box | Smoke + UI + round-trip | `wps:wsp` + `wps:txbx`/`w:txbxContent`, render hộp viền xanh; file tải từ UI giữ text 320×120 |
| Word watermark | Smoke + UI + round-trip | VML `v:textpath` trong `word/header1.xml`, overlay chéo trên trang; file tải từ UI đọc lại `CONFIDENTIAL` |
| Word caption | Smoke + UI + round-trip | Paragraph `Caption` + `w:fldSimple SEQ` tự đánh số; file tải từ UI có “Hình 1: Sơ đồ kiến trúc” và 1 field SEQ |
| Word new window | UI + browser | `window.open` mở cửa sổ mới; khi popup bị chặn hiện toast hướng dẫn (automation bị chặn) |
| Word ribbon icons | UI + ảnh chụp | Nút lớn có SVG icon riêng (không thư viện), nút compact Home icon-only; ảnh headless Edge `word-ribbon-compare.png` đặt cạnh Word 365 web |
| Word Mailings tab | Smoke + UI + round-trip | Tab `Thư tín` 5 nhóm/14 lệnh hoạt động: trộn thư client-side từ CSV/XLSX, chọn/tìm người nhận, chèn `MERGEFIELD`, Address Block, Greeting Line, Rules NEXT/IF, preview, Finish & Merge (page break mỗi bản ghi), lưới nhãn, phong bì |
| Word Shapes/Icons | Smoke + UI + round-trip | Shapes: `wps:wsp` rect/roundRect/ellipse/line + `a:prstGeom`; Icons: SVG nhúng `word/media/image1.svg` 178B, render 32×32 |
| Word Chart | Smoke + UI + round-trip | Panel loại cột/đường/tròn + dữ liệu `nhãn:giá trị`; vẽ canvas 480×300, nhúng PNG 10.9KB vào DOCX |
| Word Themes/Style Sets | Smoke + UI + round-trip | Theme đổi `a:accent1` + font trong `theme1.xml` (Berlin #C00000/Arial), Style Set cập nhật Heading 1–3 + `w:docVar`; CSS áp accent/font/kiểu |
| Word Sort/Shading/¶ | Smoke + UI + round-trip | Sort đoạn theo alphabet ghi lại body; `w:shd fill FFF2CC` + render nền; nút ¶ bật marker cuối đoạn |
| Word Table of Figures | Smoke + UI + round-trip | “Danh mục hình” + entry “Hình 1: … ..... 1” ghi paragraph thật; lấy từ caption hiện có |
| Word Thesaurus | Smoke + UI | Từ điển đồng nghĩa cục bộ: “báo cáo” → tường trình/bản báo cáo/tài liệu tổng hợp |
| Word Restrict Editing | Smoke + UI + round-trip | `word/settings.xml` + `w:documentProtection enforcement=1`; banner vàng, contenteditable=false; tắt khôi phục |
| Word disabled states | Smoke + UI | **Chỉ còn Macros** disabled kèm tooltip “VBA không chạy trong trình duyệt” (Word for the web cũng không chạy macros); Mailings, Index và Arrange đã hoạt động |
| Word tài liệu thầu thực | Parse + UI + round-trip + browser | File 1.2MB/30 part/5 ảnh/14 bảng/50 hyperlink/1 sdt: render 530 đoạn + 998 hàng bảng + logo header, 82.025 từ, 0 exception; sửa TOC + lưu giữ đủ 30 part, 5 media, 14 bảng, 50 hyperlink, text khớp |
| Word run formatting | Smoke + UI + round-trip | Chọn text “WebApp” → bold/italic/underline/strike, font Arial, size 16, color đỏ, highlight vàng ghi `w:rPr`; file tải từ UI parse lại đúng run |
| Word style No Spacing + preview | Smoke + UI + round-trip | Thêm `NoSpacing` (`w:pStyle`), reset indent/spacing; preview `Aa` đổi theo style; file tải từ UI giữ 1 `NoSpacing` |
| Word clipboard + painter | UI + browser | Copy/Cut/Paste qua Clipboard API (fallback Ctrl+C/V), Format Painter sao chép định dạng đoạn/run rồi áp vào đoạn đích; browser xác nhận target bold/16pt/red/yellow |
| Mobile 390×844 | Harness iframe same-origin + browser | World/Excel/PPT/PDF: `scrollWidth=390=innerWidth`, `overflowX=0`, **0 nút < 40×40**; ảnh 4 định dạng |
| Mobile 844×390 | Harness landscape | Cả 4 định dạng `scrollWidth 829 ≤ 844`, `overflowX=-15` (scrollbar), 0 nút < 40×40 |
| Mobile swipe | UI code + DOM | PPT vuốt ngang đổi slide; Excel vuốt ngang đổi sheet; nút trang/sheet/slide ≥ 40px |
| Ionic viewer route | Build + dev server + harness | `/office/viewer` lazy page import `@plugins/office-webapp/office/*` (không copy parser), mở 4 định dạng local, zoom/nav, 390×844 `overflowX=0`, touch target ≥40px; `npm run mobile:build` OK (lazy chunk 33.67 kB) |
| Word header/footer | Smoke + UI + round-trip | Tạo `header1.xml`/`footer1.xml`, rels + content-types, `w:headerReference`/`w:footerReference`, text, field PAGE, `w:pgNumType` (upperRoman/start 3), `w:titlePg`; file tải từ UI parse lại đủ cấu hình |
| Word header/footer existing | Smoke | File có `header1.xml` sẵn: parse đúng text, save lại không mất part/không nhân đôi reference |
| Word footnote/endnote | Smoke + UI + round-trip | Tạo `footnotes.xml`/`endnotes.xml` + rels/content-types; chèn reference vào paragraph; panel thêm/xóa/nhảy tới; format lowerRoman, restart continuous/eachSect/eachPage; file tải từ UI parse lại footnote ref đoạn 1 + endnote ref đoạn 2 |
| Word note gốc | Smoke | File có `footnotes.xml` sẵn: parse text/ref đúng, save lại giữ part |
| Word citations | Smoke + UI + round-trip | `customXml/item1.xml` (`b:Sources`), thêm/xóa source, CITATION field, APA `(Author, Year)`, bibliography APA cuối tài liệu; file tải từ UI parse lại source + field |
| Word TOC/bookmark/cross-ref | Smoke + UI + round-trip | Bookmark start/end, REF field, TOC từ Heading 1–3 (entry + page), panel thêm bookmark/chèn mục lục; file tải từ UI còn `CITATION`/`REF`/TOC paragraphs |
| Word sources gốc | Smoke | File có `customXml/item1.xml` sẵn: parse `b:Source`, save lại giữ part |
| Word equation | Smoke + UI + round-trip | OMML `m:oMath` cho phân số/căn/chỉ số trên/dưới/linear; panel chèn/xóa; file tải từ UI parse lại 5 loại phương trình, delete còn 4 |
| Word ink | Smoke + UI + round-trip | `customXml/ink.xml`, stroke màu/độ dày/points, bookmark anchor `_InkStrokes`, overlay SVG trên trang; file tải từ UI còn stroke 4 điểm, clear → 0 |
| Mobile ERP docId | Dev server + mock API + browser | `/office/viewer?docId=&version=` gọi metadata + content, parse bằng core, hiện badge `Nguồn ERP · v2`; doc1 DOCX 895B và doc2 XLSX mở đúng, 404 → `OFFICE_ERP_NOT_FOUND`; tải về **SHA-256 trùng bytes gốc** |
| Word markup view | Smoke + UI + browser | All: insertion xanh gạch chân + deletion đỏ gạch ngang từ XML; Simple: text accepted + bar vàng; No: accepted text không dấu; parse paragraph gồm `w:ins`, loại `w:del`; accept/reject cập nhật view ngay |
| Markup accept/reject | Smoke | `A` + ins `B` + del `C` → all `[A,B,C]`, simple/none `AB`; accept insert + reject delete → C normal; save/reopen giữ revision |
| Excel pivot drag-drop | UI + browser + round-trip | Field chips kéo vào zone Hàng/Cột/Giá trị, source range, aggregate SUM; config lưu `customXml/analysis.xml`; mở lại file tải từ UI tự khôi phục A1:D3 + Tháng/Doanh thu/Lợi nhuận |
| Excel chart editing | UI + browser + round-trip | Sửa title/categories/series (nhiều series)/legend/axis title; config +2 series, legend off, axis VND lưu vào analysis part; mở lại panel khôi phục đủ input + SVG |
| Excel analysis part | Smoke | Parse/save `customXml/analysis.xml`; pivot rebuild `100/150`, chart values `100,150`, legend 0, axis VND |
| Mobile production serve | Ghi chú | Bundle production build OK; serve tĩnh bằng HTTP đơn giản gặp lỗi bootstrap `NG0203` có sẵn trên **mọi route** (kể cả `/login`), nên QA route dùng `ng serve` dev server |
| PDF annotation | Smoke + UI + round-trip | Highlight (drag), ink (pointer path), note (click + text), eraser, color, clear page; lưu JSON nhúng trong PDF (`%OPENERP-ANNOTATIONS`), localStorage; file tải từ UI parse lại 2 annotation, mở lại UI hiện 2 shape + note |
| PDF page controls | UI | Prev/next/nhập trang, zoom 50–200%, rotate 90°, page theo MediaBox aspect; toolbar ẩn trong iframe |
| UI ERP flow (mock API) | Mở từ ERP → sửa → Lưu lên ERP | Danh sách hiển thị, version `v1 → v2`, trạng thái `Đã lưu` |
| UI Share ACL (mock API) | Chia sẻ → thêm UUID → danh sách quyền → thu hồi | Drawer hiển thị READ/USER, không lỗi console |
| UI PPT slideshow | Mở PPTX → Trình chiếu → phím/‹ ›/Thoát | Overlay fullscreen, fade, điều hướng slide |
| Manifest check | `node scripts/check-office-manifest.mjs` | 3 entity, 11 query, 3 migration, 1 screen, **0 errors** |
| Build plugin UI | `npm run office:ui:build` | **Thành công**, `main.js` 358.00 kB, `styles.css` 121.25 kB |
| i18n parity | `npm run i18n:check` | web 12/12 ngôn ngữ 100%, mobile 12/12 100% |
| Console UI | DevTools qua browser | 0 `console.error` ở 4 luồng mở Word/Excel/PPT/PDF |
| Mở file local | Kéo-thả file mẫu | 0 request upload nội dung file |
| Sửa + lưu Word | Sửa heading → Lưu → tải file → parse lại | Text mới, heading giữ, 5 block |
| Sửa + lưu Excel | Nhập `=SUM(B2:B3)` → Lưu → tải file → parse lại | `A1=270000000`, formula còn, 2 sheet còn |
| Sửa + lưu PPT | Sửa title → Lưu → tải file → parse lại | `Slide đã sửa`, 2 slide còn |

## 2. Chức năng đã có trong slice

| Nhóm | Đã làm |
| :--- | :--- |
| Binary core | CRC-32; ZIP đọc/ghi Store + Deflate; UTF-8 flag; chặn Zip Slip; chặn XML DOCTYPE/ENTITY; phát hiện ZIP/OLE2/PDF/CSV |
| Word | Parse/sửa text, heading, run, bảng; **comment thread**, **Track Changes**, **markup All/Simple/No + edit trong All**, **undo/redo**, **find/replace + navigation pane 280px**, **hyperlink/symbol/online video**, **spellcheck cục bộ**, **chèn bảng/ảnh**, **định dạng run/font/paragraph/list/style/page break**, **clipboard + format painter**, **page border/color**, **line numbering**, **reading/immersive/dark/ruler**, **header/footer**, **footnote/endnote**, **citation/TOC/bookmark**, **OMML equation**, **ink layer**, **columns/page/section**, **accessibility**, **render ảnh nhúng** |
| Excel | Parse workbook nhiều sheet, shared strings, inline string, number, formula, merge; CSV; canvas grid; **sửa ô/công thức + lưu `.xlsx`/`.csv`**; **engine 410 hàm** + dependency DAG recalc; **Pivot drag-drop**; **Chart editing**; **CF create/manage/clear**; **DV UI**; **Table native tableParts + Slicer**; **cell format styles.xml + presets/accounting**; **sort/find/filter/freeze**; **insert/delete/autoSum/clear/merge/wrap/indent**; **defined names + protection + comments/notes**; analysis config lưu `customXml/analysis.xml` |
| PowerPoint | Parse slide size, thứ tự slide, shape text/vị trí/kích thước/font; thumbnail + stage; **sửa text shape + lưu `.pptx`**; **transition 11 loại + animation 5 hiệu ứng**; **sửa SmartArt node + lưu diagram part**; **video/audio playback từ package**; slideshow overlay + transition/animation |
| PDF | Đọc `%PDF`, trang, MediaBox, phát hiện file mã hóa; **annotation layer** highlight/ink/note/eraser + color + clear, lưu nhúng JSON + localStorage; page nav/zoom/rotate; **thumbnail sidebar**; **text layer + search Ctrl+F** (uncompressed/Flate) với highlight + next/prev |
| Shell | Title 48px, Tab 31px, Ribbon 76px, Status 24px; Workspace; File menu; Open/Export/Print; zoom 50–200%; Info drawer; i18n vi/en; **mobile responsive ≤640px hoặc landscape ≤1000×500**: ẩn ribbon, tab 40px, touch target ≥40px, safe-area, swipe PPT/Excel; **Ionic `/office/viewer` local + ERP `docId/version`** |
| Backend | `plugin.json` (3 entity, 11 query, 3 migration), API metadata + **binary content** (`PUT/GET /documents/{id}/content`), version table + list, **Share ACL** (`GET/POST/DELETE /{id}/permissions`), blob store local/MinIO, checksum SHA-256, 25MB guard, magic bytes, `expected_version` conflict; **integration test PostgreSQL thật (migrations + service CRUD) & MinIO thật (SigV4 put/get)** |
| An toàn | Không upload local; mã lỗi `OFFICE_INVALID_MAGIC_BYTES`, `OFFICE_ZIP_UNSAFE_PATH`, `OFFICE_XML_UNSAFE`, `OFFICE_ENCRYPTED_FILE_UNSUPPORTED`, `OFFICE_VERSION_CONFLICT` |

## 3. Chưa làm (đối chiếu 349 FR)

| Nhóm | Còn thiếu |
| :--- | :--- |
| Editing nâng cao | Giữ multi-run formatting khi sửa (hiện gộp về run đầu), Undo/Redo, IndexedDB draft, export Markdown/PDF/JPEG từ model |
| Word | Spellcheck/grammar rule-based **227 mục từ điển EN + 27 mục VI + grammar Editor rules** (subject-verb, is/are theo số ít/số nhiều, mạo từ a/an theo âm, giới từ, uncountable/comparative, classifier tiếng Việt, dấu câu, abbreviation guard, **language guard tránh false positive chéo ngôn ngữ**), **gap được chấp nhận** so với Microsoft Editor (không có cloud language model/full Vietnamese lexicon); **ink canvas stroke layer + pressure, lưu `word/ink/ink1.xml` đúng W3C InkML** (`inkml:ink`, context/inkSource/traceFormat X/Y/F, brushProperty, traceGroup page-N, trace brushRef); anchor đúng chuẩn DrawingML **`mc:AlternateContent/mc:Choice` + `w:drawing/wp:anchor` + `a:graphicData uri=wordprocessingInk` + `w14:contentPart`** (content type `application/inkml+xml`, rel customXml Internal) — **desktop Word mở được file đã lưu, ComputeStatistics 546 trang/81.368 từ và render nét mực đỏ trên trang bìa**; vị trí/tỉ lệ nét trong Word đã calibrate đúng vùng vẽ (sai lệch ~1–2% do độ dày brush); style definitions đầy đủ; **pPrChange/rPrChange accept/reject + model sync**; **nested table render đệ quy nhiều cấp**; **TOC tự cập nhật số trang sau khi phân trang settle (không cần Update TOC)**; **square/tight/through reflow, behind/front stacking z0/z3, topAndBottom flow, y độc lập anchor**; **exclusion plan + line-level split cho cả đoạn có ảnh/textbox**; **topAndBottom đặt đúng y kể cả giữa hai đoạn, flow sau điều chỉnh**; **nhóm floating dùng `wpg:wgp` chuẩn**; **Mail merge NEXT theo run trong cùng block**; **phân trang deterministic 546 trang từ style metrics thật** (docDefaults 12pt, Normal 14pt Times/justify/after 8pt/line 1.079×1.054, TableGrid 10pt, `w:tblGrid`, `w:pgMar`); Word live 546 trang (khớp tổng số trang nhờ calibrate theo docProps Pages; bố cục từng trang chưa khớp — mean Dice 0,558, 72/546 trang ≥0,8 tại task-514) |
| Excel | CF icon sets/top10 UI, accounting presets nâng cao, protection password, comment edit history, chart nâng cao (trục phụ, data labels), fill view filter vào file, formula refs không cập nhật khi insert/delete, một số hàm tài chính/thống kê chuyên sâu chưa đủ tham số |
| PowerPoint | SmartArt layout/style editing (chỉ text node), SmartArt diagram layout engine, media trim/volume/Cameo, theme/master editing, Presenter View đầy đủ, comments/ink, chart render (hiện chỉ placeholder) |
| Shell | Route-driven state cho toàn bộ tab/filter/drawer desktop, command search nâng cao, mobile search |
| PDF | Render ảnh/vector gốc của PDF (hiện text layer + iframe fallback cho scan), annotation đúng toạ độ tuyệt đối trên mọi zoom, form/ký số |
| Backend | Enforcement ROLE cần role-id context; test API multipart qua core gateway thật (integration hiện dùng JDBC client thay gRPC) |

## 4. Bằng chứng

| File | Nội dung |
| :--- | :--- |
| [office-workspace.jpeg](evidence/office-workspace.jpeg) | Workspace + app cards |
| [word-readonly.jpeg](evidence/word-readonly.jpeg) | DOCX render: heading, bảng, tiếng Việt |
| [word-edited-unsaved.jpeg](evidence/word-edited-unsaved.jpeg) | Sửa heading, trạng thái “Chưa lưu” |
| [excel-formula.jpeg](evidence/excel-formula.jpeg) | `=SUM(B2:B3)` → 270000000, nút Lưu bật |
| [ppt-edited-saved.jpeg](evidence/ppt-edited-saved.jpeg) | Shape text đã sửa, trạng thái “Đã lưu” |
| [saved/sample-edited.docx](evidence/saved/sample-edited.docx) | File Word tải từ UI, parse lại thấy text mới |
| [saved/sample-edited.xlsx](evidence/saved/sample-edited.xlsx) | File Excel tải từ UI, còn formula + 2 sheet |
| [saved/sample-edited.pptx](evidence/saved/sample-edited.pptx) | File PPT tải từ UI, còn 2 slide + text mới |
| [erp-open-list.jpeg](evidence/erp-open-list.jpeg) | Drawer “Tài liệu trên ERP” hiển thị file |
| [erp-save-v2.jpeg](evidence/erp-save-v2.jpeg) | Lưu lên ERP, version `v1 → v2`, trạng thái “Đã lưu” |
| [share-acl.jpeg](evidence/share-acl.jpeg) | Drawer Share ACL: quyền USER/READ, thêm và thu hồi |
| [ppt-slideshow.jpeg](evidence/ppt-slideshow.jpeg) | Slideshow overlay, điều hướng 1/2, nút Thoát |
| [excel-chart.jpeg](evidence/excel-chart.jpeg) | Chart cột từ dữ liệu sheet, legend, trục, panel 4 loại |
| [excel-recalc-pivot.jpeg](evidence/excel-recalc-pivot.jpeg) | Sửa `B2=250` → `D2` và tổng tự tính lại; Pivot `Tổng · Doanh thu/Chi phí/Lợi nhuận` |
| [excel-conditional-validation.jpeg](evidence/excel-conditional-validation.jpeg) | CF tô đỏ `A2=150`; DV chặn `A3=200` với banner `VALIDATION_WHOLE` |
| [word-comment-thread.jpeg](evidence/word-comment-thread.jpeg) | Panel Bình luận 344px, comment mới + anchor đoạn được chọn |
| [word-comment-resolved.jpeg](evidence/word-comment-resolved.jpeg) | Thread có reply, trạng thái Resolve |
| [word-track-changes.jpeg](evidence/word-track-changes.jpeg) | Panel Thay đổi: 1 chèn + 1 xóa, nút Accept/Reject từng cái và tất cả |
| [saved/sample-commented.docx](evidence/saved/sample-commented.docx) | File tải từ UI: parse lại còn comment + reply + resolved + anchor |
| [saved/sample-tracked.docx](evidence/saved/sample-tracked.docx) | File tải từ UI có revision ins/del, paragraphs còn đúng |
| [ppt-effects-panel.jpeg](evidence/ppt-effects-panel.jpeg) | Panel Hiệu ứng: push 700ms áp dụng tất cả, animation Mờ dần cho shape 2 |
| [ppt-transition-slideshow.jpeg](evidence/ppt-transition-slideshow.jpeg) | Slideshow chạy transition push + fade animation |
| [saved/sample-effects.pptx](evidence/saved/sample-effects.pptx) | File tải từ UI: parse lại thấy `push 700ms` ở 2 slide + animation fade shape 2 |
| [mobile-word-390x844.jpeg](evidence/mobile-word-390x844.jpeg) | Word 390×844, overflowX 0, tab/nút ≥ 40px |
| [mobile-excel-390x844.jpeg](evidence/mobile-excel-390x844.jpeg) | Excel 390×844, overflowX 0 |
| [mobile-ppt-390x844.jpeg](evidence/mobile-ppt-390x844.jpeg) | PPT 390×844, thumbnail ngang, overflowX 0 |
| [mobile-pdf-390x844.jpeg](evidence/mobile-pdf-390x844.jpeg) | PDF 390×844, viewer fit width |
| [mobile-excel-844x390.jpeg](evidence/mobile-excel-844x390.jpeg) | Landscape 844×390, overflowX -15, 0 touch target nhỏ |
| [task-477-measure.json](evidence/task-477-measure.json) | Số đo `scrollWidth/innerWidth`, `overflowX`, danh sách small targets cho 8 tổ hợp |
| [pdf-annotations.jpeg](evidence/pdf-annotations.jpeg) | PDF toolbar annotation, highlight + note marker trên trang 1 |
| [pdf-annotations-reopened.jpeg](evidence/pdf-annotations-reopened.jpeg) | Mở lại file đã lưu: 2 annotation + note “Kiểm tra bảng Q4” còn nguyên |
| [saved/sample-annotated.pdf](evidence/saved/sample-annotated.pdf) | PDF tải từ UI có JSON annotation nhúng trước `%%EOF`, vẫn đọc được |
| [ionic-office-word-390x844.jpeg](evidence/ionic-office-word-390x844.jpeg) | Ionic `/office/viewer` mở DOCX, top bar 44px, nút +/↓ 40px |
| [ionic-office-excel-390x844.jpeg](evidence/ionic-office-excel-390x844.jpeg) | Ionic mở XLSX dạng bảng read-only, sheet 1/2, không tràn |
| [ionic-office-ppt-390x844.jpeg](evidence/ionic-office-ppt-390x844.jpeg) | Ionic mở PPTX stage 16:9, slide 1/2 |
| [ionic-office-pdf-390x844.jpeg](evidence/ionic-office-pdf-390x844.jpeg) | Ionic mở PDF 2 trang, viewer fit width |
| [task-477-ionic-viewer.json](evidence/task-477-ionic-viewer.json) | Số đo overflow/touch target + ghi chú lazy chunk, import core không copy parser |
| [word-header-footer.jpeg](evidence/word-header-footer.jpeg) | Panel Header/Footer, band đầu/chân trang + số trang 1, format I/II/III start 3 |
| [saved/sample-header-footer.docx](evidence/saved/sample-header-footer.docx) | File tải từ UI: parse lại header/footer text, field PAGE, upperRoman start 3, titlePg |
| [word-notes.jpeg](evidence/word-notes.jpeg) | Panel Chú thích: footnote + endnote, reference¹ trên đoạn, band chú thích cuối trang |
| [saved/sample-notes.docx](evidence/saved/sample-notes.docx) | File tải từ UI: parse lại footnote (đoạn 1) + endnote (đoạn 2), format lowerRoman |
| [word-citations.jpeg](evidence/word-citations.jpeg) | Panel Trích dẫn: source + citation `(Nguyen, 2024)` + bibliography APA |
| [word-toc-bookmark.jpeg](evidence/word-toc-bookmark.jpeg) | Panel Mục lục: bookmark BaoCao, REF hiển thị text, TOC entry “Báo cáo Sprint 12 1” |
| [saved/sample-citations-toc.docx](evidence/saved/sample-citations-toc.docx) | File tải từ UI: parse lại source, bookmark, `CITATION`/`REF`, bibliography + TOC |
| [word-equation-ink.jpeg](evidence/word-equation-ink.jpeg) | Panel Công thức/Mực: equation `1/2` trong đoạn + nét mực đỏ vẽ trên trang |
| [saved/sample-equation-ink.docx](evidence/saved/sample-equation-ink.docx) | File tải từ UI: parse lại OMML fraction “1/2” + ink stroke 4 điểm `#dc2626` |
| [mobile-erp-docid.jpeg](evidence/mobile-erp-docid.jpeg) | Ionic `/office/viewer?docId=doc1&version=2`, badge “Nguồn ERP · v2”, DOCX render 390×844 |
| [task-477-erp-docid.json](evidence/task-477-erp-docid.json) | Kết quả docx/xlsx/404, overflow 0, small targets 0, SHA-256 tải về trùng gốc |
| [saved/sample-erp-download.docx](evidence/saved/sample-erp-download.docx) | File tải từ chế độ ERP, byte-identical với sample gốc (895B) |
| [word-markup-view.jpeg](evidence/word-markup-view.jpeg) | All Markup: insertion xanh gạch chân + deletion đỏ gạch ngang, panel Thay đổi với All/Simple/No |
| [excel-pivot-dragdrop.jpeg](evidence/excel-pivot-dragdrop.jpeg) | Pivot panel: source A1:D3, chips Tháng/Doanh thu/Chi phí/Lợi nhuận, zone Hàng/Cột/Giá trị |
| [excel-chart-editing.jpeg](evidence/excel-chart-editing.jpeg) | Chart editing: title, categories, 2 series, legend off, axis VND, SVG cột 2 series |
| [saved/sample-analysis.xlsx](evidence/saved/sample-analysis.xlsx) | File tải từ UI: parse lại pivot config + chart config từ `customXml/analysis.xml` |
| [excel-cf-rule.jpeg](evidence/excel-cf-rule.jpeg) | Panel Định dạng điều kiện: range B2:B3, cellIs > 120, canvas tô hồng 2 ô |
| [excel-dv-rule.jpeg](evidence/excel-dv-rule.jpeg) | Panel Kiểm tra dữ liệu C2:C3 whole 1–100; nhập 200 bị chặn, banner `VALIDATION_WHOLE` |
| [excel-table-slicer.jpeg](evidence/excel-table-slicer.jpeg) | Panel Bảng & Slicer: table Sales A1:D3, chip 01/2026, preview lọc còn 1 dòng |
| [saved/sample-table-slicer.xlsx](evidence/saved/sample-table-slicer.xlsx) | File tải từ UI: parse lại CF/DV trong sheet XML + table/slicer trong `customXml/analysis.xml`; lọc đúng 1 dòng |
| [ppt-media-playback.jpeg](evidence/ppt-media-playback.jpeg) | Video mp4 2s phát được trong stage + audio wav 1s controls, SmartArt “Ý tưởng · Triển khai” |
| [ppt-smartart-edit.jpeg](evidence/ppt-smartart-edit.jpeg) | Panel Sửa SmartArt 2 node, stage cập nhật “Ý tưởng đột phá · Triển khai Q4” |
| [saved/sample-smartart-edited.pptx](evidence/saved/sample-smartart-edited.pptx) | File tải từ UI: diagram part đổi text, media 3002B video + 88278B audio còn nguyên |
| [word-columns-section.jpeg](evidence/word-columns-section.jpeg) | Panel Cột & Trang: 2 section, 2 cột/720, A4 ngang, lề hẹp |
| [word-accessibility.jpeg](evidence/word-accessibility.jpeg) | Panel Trợ năng: sau fix còn 2 lỗi heading, Alt 0, Table 0 |
| [saved/sample-layout.docx](evidence/saved/sample-layout.docx) | File tải từ UI: 2 `w:sectPr` (2 cột, landscape, lề 720), `descr` ảnh, 1 `w:tblHeader` |
| [pdf-thumbnails.jpeg](evidence/pdf-thumbnails.jpeg) | PDF 2 trang: sidebar thumbnail thật, trang 2 active |
| [pdf-search.jpeg](evidence/pdf-search.jpeg) | Ctrl+F “Page”: 2/2 hit, trang 2, `<mark>` vàng trên text layer |
| [task-471-integration.txt](evidence/task-471-integration.txt) | Log PostgreSQL + MinIO integration: môi trường, phạm vi test, kết quả 13/13, bug Host header đã sửa |
| [word-image-markup.jpeg](evidence/word-image-markup.jpeg) | Ảnh PNG 240×120 render trong đoạn, All Markup hiện A xanh + B gạch chân + C gạch ngang + ảnh |
| [word-all-markup-edit.jpeg](evidence/word-all-markup-edit.jpeg) | Sửa trực tiếp trong All Markup: text mới, ảnh giữ nguyên, nút Thay đổi (0) |
| [saved/sample-review-image.docx](evidence/saved/sample-review-image.docx) | File tải từ UI: không còn `w:ins`/`w:del`, text mới, ảnh 240×120 + media 426B |
| [saved/sample-native-table.xlsx](evidence/saved/sample-native-table.xlsx) | File tải từ UI: `xl/tables/table1.xml` (Sales A1:D3), `tableParts`, sheet rel, content-type |
| [desktop-word-1280.jpeg](evidence/desktop-word-1280.jpeg) | Desktop Word 1496×894, overflow -15 |
| [desktop-excel-1280.jpeg](evidence/desktop-excel-1280.jpeg) | Desktop Excel, overflow 0 |
| [desktop-ppt-1280.jpeg](evidence/desktop-ppt-1280.jpeg) | Desktop PPT, overflow 0 |
| [desktop-pdf-1280.jpeg](evidence/desktop-pdf-1280.jpeg) | Desktop PDF với thumbnail sidebar, overflow -15 |
| [qa-mobile-word-390x844.jpeg](evidence/qa-mobile-word-390x844.jpeg) | Mobile Word 390×844, overflow 0 |
| [qa-mobile-excel-390x844.jpeg](evidence/qa-mobile-excel-390x844.jpeg) | Mobile Excel 390×844, overflow 0 |
| [qa-mobile-ppt-390x844.jpeg](evidence/qa-mobile-ppt-390x844.jpeg) | Mobile PPT 390×844, overflow 0 |
| [qa-mobile-pdf-390x844.jpeg](evidence/qa-mobile-pdf-390x844.jpeg) | Mobile PDF 390×844, thumbnail ẩn, overflow 0 |
| [qa-mobile-excel-844x390.jpeg](evidence/qa-mobile-excel-844x390.jpeg) | Landscape 844×390, overflow -15 |
| [task-475-qa.json](evidence/task-475-qa.json) | Số đo dual-mode, 410 hàm, native table part |
| [task-477-e2e-gateway.txt](evidence/task-477-e2e-gateway.txt) | Log E2E multipart → gRPC contract → PostgreSQL: flow, config, kết quả 1 test PASS & suite 13/14 |
| [task-479-word-editing.json](evidence/task-479-word-editing.json) | Số đo undo/redo, find “WebApp” 1 kết quả, thay + undo, bảng 2×3, ảnh 64×32, file tải 2029B |
| [saved/sample-word-edits.docx](evidence/saved/sample-word-edits.docx) | File tải từ UI: 2 bảng (bảng cuối 2×3), `word/media/image1.png` 183B, rels + content-type png |
| [task-480-word-format.json](evidence/task-480-word-format.json) | Số đo format: Heading2, center, bullet marker, 48px indent, 1.5 line, page break |
| [saved/sample-word-format.docx](evidence/saved/sample-word-format.docx) | File tải từ UI: `w:pStyle Heading2`, `w:jc center`, `w:ind 720`, `w:spacing 360`, `w:numId 9001`, numbering part 726B, 1 page break |
| [task-481-word-runs.json](evidence/task-481-word-runs.json) | Số đo run format “WebApp”, Arial/underline, NoSpacing preview, painter target bold/red/yellow |
| [saved/sample-word-runs.docx](evidence/saved/sample-word-runs.docx) | File tải từ UI: 3 run đoạn 1 (WebApp bold/16pt/red/yellow), Arial+underline đoạn 2, NoSpacing đoạn 0, painter áp đoạn 4 |
| [task-482-excel-format.json](evidence/task-482-excel-format.json) | Số đo format B2 → B4 sau sort, freeze B2, sort desc, find 1 kết quả, filter 01/2026 |
| [saved/sample-excel-format.xlsx](evidence/saved/sample-excel-format.xlsx) | File tải từ UI: styles.xml font/fill/border/xf, ô B4 display `120,000,000`, pane frozen B2, thứ tự Tổng/02/01 |
| [task-483-excel-edit.json](evidence/task-483-excel-edit.json) | AutoSum B5 = 540M, wrap/indent/valign A2, merge A6:C6, custom sort 01/02/Tổng |
| [saved/sample-excel-edit.xlsx](evidence/saved/sample-excel-edit.xlsx) | File tải từ UI: B5 `=SUM(B2:B4)` 540M, merge A6:C6, A2 wrap/indent1/middle, styles xfs 3 |
| [task-484-excel-advanced.json](evidence/task-484-excel-advanced.json) | CF rule, name Scores, sheet/workbook protection, comment A2, B2 accounting `120,000,000 ₫` |
| [saved/sample-excel-advanced.xlsx](evidence/saved/sample-excel-advanced.xlsx) | File tải từ UI: `definedNames` Scores, sheetProtection + workbookProtection, comments1.xml 379B + VML 997B, CF B2:B4, B2 Good + accounting |
| [task-485-word-page.json](evidence/task-485-word-page.json) | Border double 1.5pt đỏ, nền FFF2CC, line newPage, ruler/reading/immersive/dark bật |
| [saved/sample-word-page.docx](evidence/saved/sample-word-page.docx) | File tải từ UI: `w:pgBorders` double sz12 FF0000, `w:background FFF2CC`, `w:lnNumType newPage` |
| [task-486-word-nav-link.json](evidence/task-486-word-nav-link.json) | Nav 280px 1 heading, link OpenAI© → openai.com, video browser-demo, spell 3→2 issue |
| [saved/sample-word-nav-link.docx](evidence/saved/sample-word-nav-link.docx) | File tải từ UI: 1 `w:hyperlink` + rel openai.com, `wp15:webVideoPr` href, text “receive” |
| [task-487-word-spellcheck.json](evidence/task-487-word-spellcheck.json) | 5 issue (1 lặp, 2 chính tả, 2 ngữ pháp) → sửa hết “The receive address”, 0 issue còn lại |
| [saved/sample-word-spellcheck.docx](evidence/saved/sample-word-spellcheck.docx) | File tải từ UI: đoạn 3 = “The receive address”, `.docx` hết space thừa |
| [task-488-word-ribbon.json](evidence/task-488-word-ribbon.json) | 9 tab, 30 nhóm, 96 lệnh, 12 dropdown, bold 700, Word Count 52/191/4, layout 720/landscape, mobile overflow ≤ 0 |
| [saved/sample-word-layout.docx](evidence/saved/sample-word-layout.docx) | File tải từ UI sau lệnh Layout: `pgSz 16838×11906`, `pgMar 720`, orientation landscape |
| [task-489-word-office-commands.json](evidence/task-489-word-office-commands.json) | Cover Title + page break, `wps:txbx` 320×120, caption SEQ, watermark header |
| [saved/sample-word-office.docx](evidence/saved/sample-word-office.docx) | File tải từ UI: Title/cover, text box, “Hình 1: Sơ đồ kiến trúc”, `v:textpath CONFIDENTIAL` |
| [word-ribbon-compare.png](evidence/word-ribbon-compare.png) | Ảnh so sánh: Word 365 web Home (simplified) ↔ plugin Home (Single-line) + tab Insert đủ 8 nhóm icon |
| [task-490-word-parity2.json](evidence/task-490-word-parity2.json) | 10 tab/41 nhóm/134 lệnh, 22 disabled, shapes/icons/chart/theme/style set/figures/thesaurus/protection |
| [saved/sample-word-parity.docx](evidence/saved/sample-word-parity.docx) | File tải từ UI: shape roundRect, SVG 178B + chart PNG 10.9KB, theme #C00000/Arial, styleSet modern, shading FFF2CC, Danh mục hình |
| [task-491-word-real-doc.json](evidence/task-491-word-real-doc.json) | Tài liệu thầu thực 1.2MB: 30 part, 5 ảnh, 14 bảng (1 nested), 50 hyperlink, sdt TOC, logo header; sửa + lưu giữ nguyên cấu trúc |
| [task-492-word-pagination.json](evidence/task-492-word-pagination.json) | Phân trang thật: 144 trang, mỗi trang 1056/scroll 1054, 528 đoạn đo DOM, bảng 839 hàng chia trang, header logo + footer số trang động 1/2/3, smoke 323 |
| [task-493-word-ribbon-full.json](evidence/task-493-word-ribbon-full.json) | Ribbon đủ 10 tab/41 nhóm/158 lệnh, chỉ Macros disabled; Mailings (mail merge CSV/XLSX), Index (XE + page number), Arrange (wp:anchor, wrap, rotate, z-order, selection pane, group customXml); smoke 340 |
| [task-494-word-nested-table.json](evidence/task-494-word-nested-table.json) | Nested table render lồng thật (giữ `w:tbl` trong ô; word count/pagination/mail merge/render đệ quy); sửa hồi quy TOC hyperlink; real doc 132 bảng DOM/999 hàng/145 trang; smoke 340 |
| [task-495-word-wpg-group.json](evidence/task-495-word-wpg-group.json) | Group floating object bằng `wpg:wgp` chuẩn (không còn customXml); ungroup tách lại `wp:anchor`; runtime QA group 2→1 group/2 child→ungroup 2; smoke 342 |
| [task-496-word-reflow-nested.json](evidence/task-496-word-reflow-nested.json) | Wrap square/tight/through reflow thật (text trái = mép phải float 609px, overlay 0); nested table đệ quy 3 cấp (3 bảng/2 nested/Level3); smoke 343 |
| [task-497-word-stacking.json](evidence/task-497-word-stacking.json) | Behind z0/front z3 overlay đúng semantics; topAndBottom flow (block bottom 469 → paragraph 499); wrap y=100 đạt top 197 (lệch 1px); smoke 343 |
| [task-498-word-absolute-y.json](evidence/task-498-word-absolute-y.json) | Y độc lập anchor: wrap y=50 ở top 147 khi anchor 194 (aboveAnchor true); topAndBottom y=30 ở top 127, anchor 275, after 237; stacking z0/z3 giữ nguyên; smoke 343 |
| [task-499-word-exclusion-next.json](evidence/task-499-word-exclusion-next.json) | Exclusion plan: topAndBottom/multi wrap theo y, 2 wrap float top 197/397, above-anchor block 121/anchor 361; NEXT gate `NEXT_RECORD_UNSUPPORTED`; smoke 344 |
| [task-500-word-line-split.json](evidence/task-500-word-line-split.json) | Line-level split: topAndBottom y cắt paragraph → inline block trong P, 9 dòng trên + 9 dòng dưới, blockCount 0; smoke 344 |
| [task-501-word-next-midrecord.json](evidence/task-501-word-next-midrecord.json) | NEXT mid-record: pass dùng record pointer, NEXT chuyển record trong cùng template; output A An/B Bình → page break → A Cường; 1 page break; smoke 344 |
| [task-502-word-rich-split-next.json](evidence/task-502-word-rich-split-next.json) | Line split cho đoạn có textbox (inline 1, block 0, textbox giữ nguyên, text khớp) + NEXT theo run trong cùng paragraph (`A An B Bình`, 1 block, 0 page break, round-trip); smoke 347 |
| [task-503-word-exact-y.json](evidence/task-503-word-exact-y.json) | TopAndBottom đặt đúng y: boundary y=93 → top 190 (lệch 1px border), paragraph giao top 270 = float bottom; above y=30 → 127; stacking y=300 → 397; smoke 347 |
| [task-504-word-pprchange.json](evidence/task-504-word-pprchange.json) | pPrChange: parse thành format revision, reject khôi phục align center/indent 720 + model sync, accept giữ left, round-trip; UI reject đổi align left→center và xoá card; smoke 351 |
| [task-505-word-deterministic-pagination.json](evidence/task-505-word-deterministic-pagination.json) | Phân trang deterministic: hội tụ 2 snapshot, `w:tblGrid` + fixed layout; 2 lần load đều 269 trang/254 table fragment, settle ~4.0–4.2s; Word app.xml 546 trang; smoke 351 |
| [task-506-word-style-metrics.json](evidence/task-506-word-style-metrics.json) | Style metrics: docDefaults 12pt, Normal 14pt/justify/after 8pt/line 1.241, Heading1 16pt, TableGrid 10pt/line 1.15/after 0, pgMar 96/66.2/96/60; 2 lần load đều 621 trang/598 fragment, deterministic; smoke 355 |
| [task-507-word-spellcheck-editor.json](evidence/task-507-word-spellcheck-editor.json) | Spellcheck mở rộng: 227 EN + 27 VI + 9 grammar rule + alternatives; UI 9 issue, fix khong→không, alternative khổng; real doc 96 issue/40ms, 0 false positive `coordinate`; smoke 358 |
| [task-508-word-toc-auto-refresh.json](evidence/task-508-word-toc-auto-refresh.json) | TOC tự cập nhật số trang sau settle: deep entry cached 9 → 8 khớp heading page 8, entry A 5→5; không bấm Update TOC; smoke 360 |
| [task-509-word-native-ink.json](evidence/task-509-word-native-ink.json) | Ink canvas + pressure: 13 điểm pressure 0.35→0.83, `word/ink/ink1.xml` 1061B + rel/content-type, save 1.158.939B, reload canvas 976 alpha px; smoke 361 |
| [task-510-word-inkml-part.json](evidence/task-510-word-inkml-part.json) | InkML chuẩn: part 1646B, 1 context, X/Y/F max 32767/32767/1000, brush `#dc2626`, traceGroup `page-0`, 1 trace/13 tuple (`1700 2750 350`), rel customXml + `application/inkml+xml`, `w:contentPart` trong `w:r`, 0 `w14:contentPart`; reload 973 alpha px; smoke 363; desktop Word blocked (không có Word) |
| [task-511-word-grammar-editor.json](evidence/task-511-word-grammar-editor.json) | Grammar Editor: subject-verb/is-are/articles/prepositions/classifier VI; guard tiếng Việt + Unicode repeat; UI 5 issue fix Sửa → 0, text đúng cả EN/VI; real doc 114 → 2 issue (0 false positive); smoke 367 |
| [task-512-word-ink-word-open.json](evidence/task-512-word-ink-word-open.json) | Ink anchor DrawingML `w14:contentPart`; Word hết “unreadable content”, mở file UI-saved, **546 trang/81.368 từ**; calibrate scale/offset (X 1.132/+0.003, Y 1.238/+0.2216) → nét nằm đúng vùng vẽ (~1–2%); smoke 368 |
| [task-513-word-grammar-ui-pagination.json](evidence/task-513-word-grammar-ui-pagination.json) | Grammar mở rộng uncountable/comparative/preposition/classifier; **UI QA 9 issue → 0**, text đúng 4 đoạn; pagination 546 trang/2 lần load deterministic (khớp **tổng số trang** Word, bố cục từng trang chưa khớp); spellcheck+macros là gap được chấp nhận; smoke 368 |
| [task-515-word-ribbon-fluent-ui.json](evidence/task-515-word-ribbon-fluent-ui.json) | Đối chiếu Word for the web thật: ribbon single-row 48px không group label, styles nút chữ, 119 Fluent UI icons (đã xoá map icon tự vẽ legacy); mỗi page một contenteditable; bỏ hệ số `×1,054` + xử lý `w:contextualSpacing` + mốc `w:lastRenderedPageBreak` (trang ≥75%) + `rowFlowScale` 1,417: **trang 8–19 mean 0,992 (12/12 ≥0,8, 9 trang trùng Word)**, `exactPrefix60` 23; map **458 trang Word → dòng bảng**: bảng bắt đầu sớm 1 trang (trang 26), lệch tới −57 dòng ở trang 400; tại 546 trang mọi cấu hình đều 0,579–0,582/body 0,565–0,567, còn 542 trang đạt 0,609/body 0,599 ⇒ khác biệt là chính sách lấp trang; đã sửa `w:trHeight` atLeast; thử move-whole-row → 685 trang bị loại; smoke 370 |
| [task-514-word-page-layout-parity.json](evidence/task-514-word-page-layout-parity.json) | Per-cell table flow port từ ONLYOFFICE + per-section geometry: kernel thuần + 13 bảng thật, 0 mất dòng, deterministic; mặc định 546 trang **không dùng target**, mean Dice 0,558, 72/546 trang ≥0,8 (trước: 0,435/11); trang 544-545 landscape 1056×816, trang 546 portrait 816×1056; W-A21 vẫn một phần |
| [task-516-word-table-break-parity.json](evidence/task-516-word-table-break-parity.json) | **Ngắt dòng trong ô bảng**: `pre-wrap` cho `<p>` trong bảng → 733 `w:br`/579 ô thành dòng thật (bullet list không còn dính); `rowFlowScale` 1,4125 giữ **546 trang**; đo Word COM 839 hàng cho thấy hàng gọn 1 trang khớp DOM 0,95, chênh lệch còn lại do hàng vắt trang + header lặp; bật `w:tblHeader` làm Dice 0,58→0,52 nên revert; mean **0,582/98** trang ≥0,8; smoke 370 |
| [task-517-word-table-cell-visuals.json](evidence/task-517-word-table-cell-visuals.json) | **Ô bảng theo `w:tcPr` như Office 365**: đọc `w:shd` (6 ô header `D9D9D9`), `w:vAlign` (2633 ô center), `w:tcBorders` từng cạnh (5034 ô, `nil` = không kẻ, sz=4 → 1px) và `w:tcMar`/`tblCellMar`; render vào `td`, giữ style khi hàng bị cắt qua trang; viền mặc định đổi #9ca3af → #000; **546 trang**, smoke **371**; margin mặc định 108 twip vẫn vẽ 6px (7,2px → 558 trang) |
| [task-518-word-repeat-header.json](evidence/task-518-word-repeat-header.json) | **Header `w:tblHeader` lặp theo Office 365**: ưu tiên bản Word thay baseline 546 trang; sửa header không vẽ sau ngắt trang, gộp row fragment thành một bảng/trang, giữ slice từng ô để không mất đuôi hàng cắt; `rowFlowScale` 1,23 giữ **546 trang**; trang 71 vừa trang, body Dice 0,571/94 trang ≥0,8; smoke **374** |
| [excel-readonly.jpeg](evidence/excel-readonly.jpeg) | XLSX 2 sheet + formula bar + canvas |
| [ppt-readonly.jpeg](evidence/ppt-readonly.jpeg) | PPTX thumbnail + stage |
| [pdf-readonly.jpeg](evidence/pdf-readonly.jpeg) | PDF viewer 2 trang |

## 5. Cách tái lập

```bash
npm run office:test
npm run office:ui:build
# serve plugins/office-webapp/src/main/resources/META-INF/resources
# copy samples vào <dist>/samples, mở http://localhost:4312
```

## 6. Kết luận

Slice chứng minh được hướng kỹ thuật: **OOXML parse + sửa text + lưu lại 100% client, không backend, không thư viện ngoài**. **Word đạt 20/21 nhóm client** (W-A21 một phần do bố cục từng trang chưa khớp Word — task-514): ribbon **10 tab/41 nhóm/158 lệnh**, chỉ còn **Macros disabled** (Word for the web cũng không chạy VBA); **Mailings mail merge CSV/XLSX** (NEXT mid-record), **Index XE + số trang thật**, **Arrange floating `wp:anchor`** (position/wrap/align/rotate/z-order/selection pane/**group `wpg:wgp`**), **square/tight/through reflow, behind/front stacking, topAndBottom flow, y độc lập anchor, exclusion plan nhiều float, line-level split cho cả đoạn có ảnh/textbox, topAndBottom đặt đúng y giữa hai đoạn**, **format revision `pPrChange` accept/reject với model sync**; **phân trang thật** 546 trang deterministic với header logo + số trang động; **TOC tự cập nhật số trang** sau settle; **nested table render đệ quy nhiều cấp**; **kiểm chứng tài liệu thầu 1.2MB**: 30 part, 5 ảnh, 14 bảng XML (1 lồng), 50 hyperlink nội bộ, TOC trong `w:sdt`, 82k từ; sửa + lưu giữ nguyên package và text. Hạn chế còn lại: spellcheck/grammar là rule-based (đã mở rộng subject-verb, is/are, a/an, giới từ, uncountable/comparative, classifier VI; **gap được chấp nhận** so với Microsoft Editor); ink **InkML + DrawingML `w14:contentPart`, Word mở 546 trang và nét nằm đúng vùng vẽ sau calibrate**; web renderer 546 trang (khớp tổng số trang; per-page Dice 0,558, 72/546 trang ≥0,8 — task-514); Macros disabled (chấp nhận, Word web cũng vậy). Tổng thể 78 nhóm: **36 đủ / 20 một phần / 22 chưa** tại [TR-S12-002](02_TR-S12-002_coverage_reconcile.md). 349 FR / 148 AC vẫn mở ở các ứng dụng còn lại.
