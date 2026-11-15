# TASK-476: PowerPoint Web Đầy đủ Client — Stage, SmartArt/Media, Transition/Animation/Morph, Presenter

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-476` |
| **Thuộc Feature** | [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Loại** | Frontend Domain Editor (PowerPoint `.pptx`, `.ppt` read-only) |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. Mở `.pptx` nhiều slide: thumbnail trái 256px, stage 16:9, notes đáy, sửa text/shape, thêm/xóa/đổi thứ tự slide.
2. Selection overlay SVG có 8 handle 10px + tay nắm xoay; kéo/resize/rotate chính xác ở zoom 50–150%.
3. Slideshow fullscreen bằng bàn phím; xuất `.pptx` mở lại bằng PowerPoint/LibreOffice.
4. Phủ đủ 20 nhóm `P-A*` client: SmartArt/Icons/Chart/media/Cameo, theme/master, effects, Presenter View, comments, ink.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `.../core/ppt/ppt-model.ts` | `Presentation`, `Slide`, `Shape`, `TextBody`, `Notes`, `Emu` |
| `.../core/ppt/pptx-codec.ts` | presentation.xml, slides, layouts, masters (đọc), rels, media |
| `.../core/ppt/ppt-geometry.ts` | EMU → px, fit stage, rotate |
| `.../core/ppt/ppt-export.ts` | `.pptx`, PDF, JPEG |
| `.../ui/ppt/ppt-editor.component.*` | Split layout 3 pane |
| `.../ui/ppt/ppt-thumbnail-pane.component.*` | Danh sách slide 256px + resize handle |
| `.../ui/ppt/ppt-stage.component.*` | Canvas render + SVG overlay |
| `.../ui/ppt/ppt-selection-overlay.component.*` | 8 handle + rotate |
| `.../ui/ppt/ppt-notes-bar.component.*` | Notes đáy |
| `.../ui/ppt/ppt-slideshow.component.*` | Fullscreen presentation |
| `.../ui/ppt/ppt-sorter.component.*` | Slide Sorter view |
| `.../core/ppt/smartart.ts` | Diagram data/layout/style/render |
| `.../core/ppt/chart.ts` | Chart XML + embedded workbook |
| `.../core/ppt/media.ts` | Video/audio/cameo media rels |
| `.../core/ppt/master.ts` | Slide master/layout/theme |
| `.../core/ppt/comments.ts` | Comment parts |
| `.../core/ppt/ink.ts` | Ink strokes |
| `.../ui/ppt/ppt-chart-panel.component.*` | Chart editor |
| `.../ui/ppt/ppt-master-view.component.*` | Master/layout editor |
| `.../ui/ppt/ppt-presenter-view.component.*` | Presenter window |
| `.../ui/ppt/ppt-comment-panel.component.*` | Comments panel |

## 2. Bố cục & hình học (bắt buộc)

| Vùng | Giá trị | Ghi chú |
| :--- | :--- | :--- |
| Thumbnail pane | `256px` + handle `10px` | Kéo ±80px, thu gọn còn 0 |
| Stage | tỉ lệ `16:9`, fit khung còn lại | Đo M365: `1240×743` @1496 viewport |
| Slide size | 16:9 `12192000×6858000 EMU`; 4:3 `9144000×6858000 EMU` | `ppt-geometry` quy đổi |
| Notes bar | cao `96px` khi mở, `32px` khi thu gọn | Toggle `?notes=1` |
| Handle | `10×10px`, 8 hướng + 1 rotate | Theo BENCH-002 |

## 3. Yêu cầu chức năng

### 3.1 Đọc & model

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F01 | Parse `ppt/presentation.xml` (slide size, thứ tự slide), `slides/slideN.xml`, `slideLayouts`, `slideMasters` (chỉ đọc), rels, media. |
| 476-F02 | Shape: `sp` (text/rect), `pic`, `cxnSp` (line/arrow), `grpSp` (đọc, không sửa nhóm ở v1); giữ `id`, `name`, `z-order`. |
| 476-F03 | Text body: paragraph/run, `sz`, `b/i/u`, màu, align, bullet; font thiếu → fallback `Arial` + warning. |
| 476-F04 | Notes: đọc/ghi `notesSlideN.xml` + rel; hiển thị text thuần, không rich text. |
| 476-F05 | `.ppt` (OLE2) read-only: trích text từng slide nếu đọc được, cảnh báo chuyển `.pptx`; không render shape phức tạp. |
| 476-F06 | File lỗi → `OFFICE_PPTX_PARSE_FAILED`; slide hỏng → hiển thị slide trống + warning, không crash cả file. |

### 3.2 Thumbnail pane

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F07 | Render thumbnail từ model (canvas thu nhỏ), cập nhật sau 300ms khi slide đổi. |
| 476-F08 | Đánh số slide; slide đang chọn có viền `ColorVariant.PRIMARY` 2px; hover hiện index. |
| 476-F09 | Thêm slide (chọn layout), nhân bản, xóa (không cho xóa slide cuối), ẩn/hiện slide. |
| 476-F10 | Kéo-thả đổi thứ tự; drop indicator rõ; Undo phục hồi. |
| 476-F11 | Kéo handle phải để resize pane; double-click handle thu gọn/mở; lưu `?pane=0` hoặc `?pane=256`. |

### 3.3 Stage & selection

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F12 | Vẽ nền slide, shape theo z-order, ảnh, text; scale theo stage rect; text wrap đúng width shape. |
| 476-F13 | Click chọn shape; Shift+click multi-select; click nền bỏ chọn; marquee chọn vùng. |
| 476-F14 | Overlay SVG `pointer-events-none` chứa khung + 8 handle 10px + rotate handle; chỉ handle nhận pointer. |
| 476-F15 | Kéo trong shape = move; kéo handle = resize (Shift giữ tỉ lệ); kéo rotate = xoay 15° snap khi Shift. |
| 476-F16 | Toạ độ chuẩn hóa về stage: `toStagePoint(clientX, clientY)` duy nhất; resize ở zoom 50/100/150% không lệch. |
| 476-F17 | Double-click text shape → `[contenteditable]` inline đúng vị trí; Esc thoát, click ngoài commit. |
| 476-F18 | Bàn phím: mũi tên move 1px (Shift 10px), Delete xóa shape, Ctrl+D nhân bản, Ctrl+Z/Y. |
| 476-F19 | Căn hàng: trái/giữa/phải/trên/giữa/dưới; phân bố ngang/dọc; đưa lên/xuống lớp (front/back/forward/backward). |
| 476-F20 | Insert shape: rectangle, ellipse, line, arrow; fill/outline chọn 16 màu; text box. |

### 3.4 Slide, transition, slideshow

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F21 | Layout gallery 9 mẫu phổ biến (Title, Title+Content, Two Content, Blank, …) áp dụng cho slide mới; đổi layout giữ nội dung khớp placeholder; **Hide Slide** ẩn/hiện khi trình chiếu. |
| 476-F22 | Transition `None/Cut/Fade/Push/Wipe/Morph` + duration (0.1–5s) + advance on click/after time + `Apply to All` + `Preview`; lưu `<p:transition>` trong slide XML. |
| 476-F23 | Slideshow: `requestFullscreen` trên stage, ẩn UI, đen nền; Space/→/click = next, ← = prev, Esc = thoát, F5 = từ đầu, Shift+F5 = từ slide hiện tại. |
| 476-F24 | Slideshow hiển thị đúng tỉ lệ, letterbox; progress `Slide X / Y` góc dưới; chuột tự ẩn sau 2s. |
| 476-F25 | Custom slideshow (SIMPLE): chọn slide bắt đầu–kết thúc, chạy đúng dải, không sửa file. |
| 476-F26 | Slide Sorter: lưới thumbnail toàn bộ, chọn/kéo đổi thứ tự, double-click về Normal; zoom fit. |
| 476-F27 | Notes: hiển thị + sửa text thuần, lưu vào notesSlide; toggle từ status bar. |

### 3.5 Transition, Animation & Morph (AC-12)

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F33 | Morph: so khớp shape giữa slide trước/sau theo `name` (fallback theo thứ tự + loại shape); nội suy `x/y/w/h`, rotation, opacity, màu fill trong duration; text morph = cross-fade; không khớp → Fade. |
| 476-F34 | Animation: `Appear`, `Fade`, `Fly In`; options hướng cho Fly In (left/right/top/bottom); duration 0.1–5s; delay 0–5s; start `On Click`/`With Previous`/`After Previous`. |
| 476-F35 | Animation Pane: liệt kê animation theo thứ tự, chọn shape, xóa, `Move Earlier`/`Move Later`, preview từng hiệu ứng; lưu `<p:timing>`. |
| 476-F36 | Slideshow chạy tuần tự: transition slide → animation theo thứ tự → chờ click; click khi còn animation thì chạy animation kế, hết mới sang slide. |
| 476-F37 | Preview trong editor phát transition + animation của slide hiện tại mà không vào fullscreen; Esc dừng preview. |
| 476-F38 | Đọc hiệu ứng có sẵn trong `.pptx`: hỗ trợ 6 transition + 3 animation; loại khác giữ nguyên XML, không phát, ghi `OFFICE_EFFECT_PARTIAL`. |

### 3.6 Lưu & xuất

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F28 | Xuất `.pptx`: cập nhật slides/rels/notes/transition; giữ master/layout/theme gốc; Media thêm/xóa đúng. |
| 476-F29 | Xuất PDF: mỗi slide 1 trang đúng tỉ lệ, không toolbar. |
| 476-F30 | Xuất JPEG slide hiện tại: `toBlob('image/jpeg', 0.92)`, kích thước ≥ 1280×720. |
| 476-F31 | `.ppt` read-only, `Ctrl+S` xuất `.pptx` + cảnh báo `OFFICE_LEGACY_EXPORT_AS_OOXML`. |
| 476-F32 | File có macro `.pptm` → từ chối `OFFICE_MACRO_FILE_UNSUPPORTED`. |

### 3.7 Đầy đủ chức năng client còn lại (theo AUDIT-S12-001)

| Mã | Yêu cầu |
| :--- | :--- |
| 476-F39 | SmartArt: gallery List/Process/Cycle/Hierarchy/Relationship, text pane, thêm/xóa node, đổi layout/màu/style, render + edit; persist `diagrams/*`. |
| 476-F40 | Icons: thư viện SVG nội bộ theo nhóm, chèn, đổi màu/kích thước, alt text; persist dạng SVG/ảnh. |
| 476-F41 | Chart: chèn từ table/range, chọn loại chart, sửa data, title/legend/labels; persist chart XML + embedded workbook. |
| 476-F42 | Video/Audio: nhúng file local, poster, phát trong slideshow có play/pause/seek/volume; persist media rels. |
| 476-F43 | Cameo: preview camera, ghi hình, chèn vào slide dạng media, dừng/xóa; fallback thông báo khi không có camera. |
| 476-F44 | Themes/Variants/Background: bộ theme màu built-in, variants color/font/effect, background solid/gradient/image, áp dụng all/selected. |
| 476-F45 | Slide Master/Layout: xem master, sửa placeholder/text, tạo layout mới, áp layout cho slide; persist master/layout XML. |
| 476-F46 | Header/Footer/Date/Slide number/Symbol: áp all/selected, ẩn ở title slide, định dạng ngày/số, chèn symbol. |
| 476-F47 | Presenter View: cửa sổ thứ hai hiển thị slide hiện tại/kế tiếp, notes, timer, điều khiển; fallback single-screen. |
| 476-F48 | Custom Slideshow: chọn slide/dải, đặt tên, lưu danh sách, chạy lại; persist `custShowLst`. |
| 476-F49 | Comments: thread, reply, resolve, delete, show/hide, prev/next; persist comment parts. |
| 476-F50 | Proofing + Accessibility: spellcheck local, panel kiểm tra alt text/reading order/title, nhảy tới slide lỗi. |
| 476-F51 | Immersive Reader: chế độ đọc slide/notes, tăng spacing/column. |
| 476-F52 | Ink/Draw: pen, highlighter, eraser, lasso, ruler; màu/độ dày; persist nét vẽ. |
| 476-F53 | Find: tìm text trong toàn bộ slide, danh sách kết quả, next/prev, highlight. |
| 476-F54 | Text Box/Table/Picture/Link: chèn text box, bảng NxM, ảnh local, hyperlink trên text/shape; sửa nội dung/format; persist. |
| 476-F55 | Group/Ungroup shape + Selection Pane: nhóm/bỏ nhóm, đặt tên shape, ẩn/hiện, đổi thứ tự lớp. |
| 476-F56 | Zoom/Fit to Window: zoom stage 50–200%, Fit, giữ tâm viewport; đồng bộ status bar. |

## 4. Mã lỗi & i18n

| Mã | Key |
| :--- | :--- |
| `OFFICE_PPTX_PARSE_FAILED` | `office.error.OFFICE_PPTX_PARSE_FAILED` |
| `OFFICE_SLIDE_RENDER_PARTIAL` | `office.error.OFFICE_SLIDE_RENDER_PARTIAL` |
| `OFFICE_MACRO_FILE_UNSUPPORTED` | `office.error.OFFICE_MACRO_FILE_UNSUPPORTED` |
| `OFFICE_LEGACY_EXPORT_AS_OOXML` | `office.error.OFFICE_LEGACY_EXPORT_AS_OOXML` |
| `OFFICE_FULLSCREEN_DENIED` | `office.error.OFFICE_FULLSCREEN_DENIED` |
| `OFFICE_EFFECT_PARTIAL` | `office.error.OFFICE_EFFECT_PARTIAL` |

## 5. Acceptance checklist

- [ ] AC-476-01 Mở `shapes-3slide.pptx`: thumbnail 256px, stage 16:9, đúng 3 slide, shape đúng z-order.
- [ ] AC-476-02 Chọn shape → 8 handle 10px + rotate; kéo move/resize/rotate; số đo trước/sau khớp 1px.
- [ ] AC-476-03 Resize ở zoom 50/100/150%: shape không lệch quá 1px so với con trỏ.
- [ ] AC-476-04 Double-click text → sửa → Esc → text đổi; Undo phục hồi.
- [ ] AC-476-05 Thêm slide layout Title+Content, nhân bản, xóa, kéo đổi thứ tự; lưu → mở lại đúng thứ tự.
- [ ] AC-476-06 Transition đủ 6 loại; Fade + duration 1s + Apply to All → Preview chạy; lưu `.pptx` mở PowerPoint còn transition.
- [ ] AC-476-07 Slideshow: F5, Space/←/→, Esc thoát; fullscreen đúng; không kẹt chuột.
- [ ] AC-476-08 Notes sửa → lưu → mở lại còn.
- [ ] AC-476-09 Xuất `.pptx` mở LibreOffice: text/shape/ảnh/notes giữ; xuất PDF đúng số trang.
- [ ] AC-476-10 Xuất JPEG ≥ 1280×720, không méo tỉ lệ.
- [ ] AC-476-11 `.ppt` read-only + cảnh báo; `Ctrl+S` tải `.pptx`.
- [ ] AC-476-12 Slide Sorter kéo đổi thứ tự, double-click về Normal.
- [ ] AC-476-13 0 `console.error`; 0 request khi mở file local.
- [ ] AC-476-14 Morph: 2 slide có shape cùng `name` → vị trí/kích thước/màu nội suy đúng duration; không khớp → fade, không crash.
- [ ] AC-476-15 Animation: thêm Appear/Fade/Fly In; đổi hướng, duration, delay, start; đổi thứ tự trong Animation Pane; preview đúng.
- [ ] AC-476-16 Slideshow: transition + animation chạy đúng thứ tự; click chạy animation kế trước khi sang slide; Esc thoát.
- [ ] AC-476-17 Lưu `.pptx` mở PowerPoint: transition + animation còn; hiệu ứng lạ giữ nguyên XML và không phát.
- [ ] AC-476-18 SmartArt + Icons + Chart: chèn/sửa, đổi layout/màu, lưu mở PowerPoint còn.
- [ ] AC-476-19 Video/Audio/Cameo: nhúng file, phát trong slideshow; Cameo ghi từ camera hoặc fallback đúng.
- [ ] AC-476-20 Theme/Variant/Background + Slide Master/Layout: áp dụng, sửa master, lưu mở lại đúng.
- [ ] AC-476-21 Header/Footer/Date/Slide number: áp all/selected, ẩn title slide, lưu còn.
- [ ] AC-476-22 Presenter View + Custom Show: cửa sổ notes/timer; chạy named show đúng danh sách.
- [ ] AC-476-23 Comments + Proofing + Accessibility + Immersive Reader hoạt động, lưu mở lại còn comment.
- [ ] AC-476-24 Ink + Find + Group/Ungroup: nét vẽ còn sau lưu; find đúng slide; group di chuyển cùng nhau.
- [ ] AC-476-25 Text Box/Table/Picture: chèn/sửa, lưu mở lại đúng.
- [ ] AC-476-26 Hide Slide + Zoom/Fit: slide ẩn không chạy trong slideshow; zoom 50/100/200 giữ tâm, status đúng.

## 6. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/evidence/task-476-stage.png` | Stage + thumbnail + notes |
| `08_testing/evidence/task-476-selection.png` | 8 handle + rotate |
| `08_testing/evidence/task-476-slideshow.png` | Fullscreen slideshow |
| `08_testing/evidence/task-476-before.pptx` / `after.pptx` | File gốc/sau sửa |
| `08_testing/evidence/task-476-geometry.json` | Toạ độ shape trước/sau ở 3 mức zoom |

## 7. Ngoài phạm vi (chỉ dịch vụ/không khả thi client)

- Dictate, Designer, Add-ins, M365 Stock Images.
- Visualize Slide, Design Suggestions (AI).
- Present in Teams, Subtitles, Rehearse with Coach.
- Show Changes, Review Presentation (co-authoring/service).
- 3D models, macro/VBA, import theme từ nguồn ngoài Microsoft (built-in themes vẫn làm).

## 8. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| Toạ độ lệch do zoom/DPR | Một hàm `toStagePoint`, test 3 mức zoom + DPR 1/1.25/1.5 |
| Text overflow khỏi shape | Đo `measureText`, wrap theo width, clip + warning nếu quá cao |
| Fullscreen bị chặn | Bắt lỗi `OFFICE_FULLSCREEN_DENIED`, fallback overlay trong tab |
| Slide master thiếu font | Fallback Arial, ghi warning, không đổi layout gốc |
| `.pptx` có group/3D lạ | Đọc group ở mức hiển thị, không sửa; cảnh báo `OFFICE_SLIDE_RENDER_PARTIAL` |

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer |
| 0.2 | 2026-11-15 | Đặc tả 32 FR, hình học stage/overlay, 13 AC, phạm vi loại trừ | Architect; BENCH-S12-002/003 |
| 0.3 | 2026-11-15 | Thêm đủ transition (gồm Morph) + animation + Animation Pane + preview (`F33–F38`, `AC-14–AC-17`) theo quyết định R6 | Chủ dự án; 8 câu hỏi tương tác |
| 0.4 | 2026-11-15 | Phủ sóng đầy đủ client: SmartArt, Icons, Chart, Video/Audio, Cameo, theme/master/layout, header/footer, Presenter View, custom show, comments, proofing/accessibility, immersive, ink, find, text/table/picture, group (`F39–F55`, `AC-18–AC-25`) | Chủ dự án; AUDIT-S12-001 |
