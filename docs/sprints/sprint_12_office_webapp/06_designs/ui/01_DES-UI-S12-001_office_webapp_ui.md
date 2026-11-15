# [DES-UI-S12-001] Thiết kế Giao diện UI/UX: Plugin `office-webapp` (Web + Mobile Ionic)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S12-001 / Thiết kế UI/UX / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-15** — chủ dự án duyệt thiết kế qua hội thoại trực tiếp |
| Owner / reviewer | Solution Architect / Self-reviewed |
| Đầu vào | [BENCH-S12-001](../../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) §2 & §5, [ADR-S12-002](../../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [ui_ux_standards](../../../../../.agents/rules/ui_ux_standards.md), [CONF-S12-001](../../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0 |
| Đọc trước / đọc tiếp | [DES-API-S12-001](../api/01_DES-API-S12-001_office_storage_api.md) / Bước 07 phân rã FEAT/TASK |

## 1. Tuân thủ Quy chuẩn UI/UX Open-ERP & Tham chiếu M365 Web

1. **Thẩm mỹ Vuông vắn & Mật độ cao**: Dùng token chung `@shared/enums` (`ColorVariant`, `SizeVariant`, `ShapeVariant` — không tạo enum style riêng). Đường viền sắc nét (`rounded-none` / `rounded-sm`, `border-neutral-200 dark:border-neutral-800`), font nhỏ `text-xs`/`text-sm`, tối đa hóa diện tích vùng làm việc tài liệu giống đúng thiết kế Microsoft 365 Web.
2. **Anti-Modal & Tách template `.html`**: Tuyệt đối 100% component tách riêng `.html`; không dùng modal popup — dùng **Compact Dropdown** cho menu `File` (y hệt Office 365 Web đã quan sát) và **Drawer trượt cạnh phải** (`?drawer=...`) cho Find & Replace, ERP Storage Picker, Document Info, Khôi phục nháp.
3. **Zero-Emoji & 100% i18n**: Toàn bộ nhãn nút Ribbon, tooltip (`title`), menu `File`, thông số Status Bar dùng `TranslatePipe` (`office.*`), tuyệt đối không nhúng ký tự emoji vào nhãn — dùng SVG icon độc lập.
4. **Route-Driven State (Deep Linking)**: Mọi trạng thái chính phản ánh vào Query Params trên URL để F5 không mất ngữ cảnh:
   `/apps/office?app=word|excel|ppt|pdf&mode=edit|view&source=local|erp&docId=<uuid>&tab=home|insert|layout|formulas|data|slideshow|view&ribbon=single|classic&zoom=100&sheet=Sheet1&slide=1&drawer=find|info|erp-picker`

## 2. Cấu trúc Bố cục Shell kiểu Office 365 Web (Desktop >= 1280px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [App Icon] [Tên file inline editable*] [Saved / Unsaved] | [Alt+Q Search] | [Mở Local] [Mở ERP] │ 36px
├────────────────────────────────────────────────────────────────────────────┤
│ File v | Home | Insert | Layout / Formulas / Slide Show | View  ... [Mode] [Single/Classic v]  │ 28px
├────────────────────────────────────────────────────────────────────────────┤
│ [Single Line Ribbon: 40px mặc định Word/PPT] hoặc [Classic Ribbon: 90px mặc định Excel]        │ 40/90px
├────────────────────────────────────────────────────────────────────────────┤
│  (Nếu Excel) [Name Box A1 v] | [x] [v] [fx] | [Formula Input Box ...........................]  │ 28px
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   VÙNG LÀM VIỆC CHÍNH (Word div.Page / Excel Tiled Canvas / PPT Split)     │ Flex-1
│   (Kéo-thả file trực tiếp vào màn hình trống hoặc đang mở để mở ngay)       │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ [Page 1 of 1 | 0 words] hoặc [Sheet1 +] hoặc [Slide 1 of 5]   [- 100% + Fit] [Present/Full]   │ 26px
└────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết các thành phần Shell
1. **`OfficeTitleBarComponent`**: Chiều cao `36px`. Bấm vào tên file để đổi tên inline (`Enter` để xác nhận); badge trạng thái vuông vắn hiển thị `office.status.SAVED`, `office.status.UNSAVED`, `office.status.SAVING_LOCAL`, `office.status.SYNCING_ERP`.
2. **`OfficeFileMenuDropdownComponent`**: Nhấn `File` mở panel dropdown gọn bên trái (không che toàn màn hình):
   - `Tạo mới` → submenu (`Word trống`, `Excel trống`, `PowerPoint trống`).
   - `Mở từ máy tính` (`Ctrl+O`) / `Mở từ ERP Storage` (mở Drawer `?drawer=erp-picker`).
   - `Lưu` (`Ctrl+S` — lưu đè qua File System Access API nếu local hoặc cập nhật phiên bản lên ERP nếu `source=erp`).
   - `Lưu lên ERP Storage` (lưu bản đang mở lên đám mây tenant) / `Tải bản sao` (tải file gốc `.docx`/`.xlsx`/`.pptx`).
   - `Xuất (Export)` → submenu theo app (**Word:** PDF/Print, Markdown `.md`; **Excel:** PDF/Print, `.csv` UTF-8; **PPT:** PDF/Print, Ảnh `.jpg` từng slide).
   - `Thông tin & Lịch sử phiên bản` (mở Drawer `?drawer=info`).
3. **`OfficeRibbonComponent`**:
   - **Word & PowerPoint** mặc định `SINGLE_LINE` (~40px): 1 hàng nút icon chuẩn SVG + tooltip i18n, các nhóm ít dùng gom vào menu tràn `...`.
   - **Excel** mặc định `CLASSIC` (~90px): 2 hàng có nhãn nhóm (`office.ribbon.group.CLIPBOARD`, `FONT`, `ALIGNMENT`, `NUMBER`, `CELLS`, `EDITING`).
   - Nút góc phải cho phép chuyển đổi tức thời `SINGLE_LINE` ↔ `CLASSIC` (lưu vào `?ribbon=`).
   - Các tab chính theo từng app:
     - **Word**: `Home` (Undo/Redo, Font/Size, B/I/U/S, Color/Highlight, Align, List, Find/Replace), `Insert` (Table, Image, Horizontal Rule, Page Break), `Layout` (Margins, Page Size, Orientation), `View` (Ruler toggle, Separate Pages, Zoom).
     - **Excel**: `Home` (Undo/Redo, Font, Fill/Text Color, Borders, Align/Wrap, Merge, Number Format `#,##0` / `%` / Date, Insert/Delete Row-Col), `Formulas` (Insert `fx`, nhóm hàm AutoSum/Logical/Lookup/Text/Date), `Data` (Sort A-Z/Z-A, Filter toggle), `View` (Freeze Panes, Gridlines toggle, Zoom).
     - **PowerPoint**: `Home` (New Slide, Delete/Duplicate Slide, Text Box, Shape Rect/Circle/Arrow/Line, Font/Color, Align), `Slide Show` (Present from Start `F5`, Present from Current), `View` (Toggle Thumbnail Panel `Ctrl+\`, Toggle Notes, Zoom).

## 3. Thiết kế 4 Bề mặt Chuyên biệt & Drawer

| Thành phần | Thiết kế chi tiết |
| :--- | :--- |
| **`WordPageCanvasComponent`** | Nền backdrop trung tính; danh sách `div.op-word-page` (`816×1056px`, `contain: size layout`) căn giữa; thanh thước `<canvas>` ngang/dọc bật tắt từ `View > Ruler`; vùng soạn thảo hỗ trợ gõ IME tiếng Việt, chèn bảng chỉnh dòng/cột, chèn ảnh `dataURL` nhúng vào `word/media/`. |
| **`ExcelTiledGridComponent` + `ExcelFormulaBarComponent`** | 3 vùng `<canvas>` (`colHeader`, `rowHeader`, `sheetTiles` 560px/tile), `devicePixelRatio` scaling; kéo đổi độ rộng cột/chiều cao hàng trực tiếp trên mép header; `SheetTabsBar` dưới đáy (`+` thêm sheet, double-click đổi tên sheet, context menu xóa/nhân bản sheet); `ExcelCellEditorOverlay` `[contenteditable]` đặt đúng bounding rect của ô đang sửa. |
| **`PptSplitWorkspaceComponent` + `PptSlideShowOverlayComponent`** | Split-Screen: `ThumbnailPane` bên trái (rộng `180px`, có splitter kéo resize hoặc thu gọn) hiển thị canvas thu nhỏ từng slide + kéo thả sắp xếp; `SlideStage` 16:9 giữa có `<canvas>` nền/shape + `<svg>` selection layer với 8 handles resize/move; `NotesBar` thu gọn ở đáy; chế độ Slideshow mở Web Fullscreen API với thanh điều hướng nổi mờ ở góc dưới. |
| **`PdfClientViewerComponent`** | Trên Desktop: thanh công cụ gọn (Chế độ Render Native / Canvas, Trang `X / Y`, Zoom, Tải xuống) + khung hiển thị PDF; trên Mobile: Canvas từng trang trích xuất từ `ClientPdfReader` hỗ trợ vuốt/chọn trang & zoom mượt. |
| **Drawers (`?drawer=...`)** | - `find`: Tìm & Thay thế cho Word/Excel (Match case, Replace, Replace All).<br>- `erp-picker`: Danh sách file trên ERP Cloud Storage (`office:document:read`), tìm kiếm, lọc `doc_type`, phân trang, xóa mềm.<br>- `info`: Dung lượng, loại engine (`In-house OOXML` / `Legacy OLE2`), trạng thái nháp IndexedDB, danh sách phiên bản ERP. |

## 4. Giao diện Mobile Ionic (390×844px — `CONF Q9`)

- Theo quyết định `Q9`, Mobile Ionic chạy ở **chế độ Viewer tối giản** (`mode=view`), ẩn toàn bộ Ribbon chỉnh sửa phức tạp để dành 90% chiều cao cho tài liệu:
  - **Top Bar gọn (`44px`)**: Nút Mở file (Chọn file thiết bị / ERP Storage) + Tên file rút gọn (`truncate`) + Nút Tải xuống.
  - **Vùng xem Responsive (`overflow-x: hidden`, `overflow: 0`)**:
    - Word / PDF: tự co trang vừa chiều rộng `390px` (`Fit Width`) kèm cử chỉ/nút `+`/`-` zoom.
    - Excel: Tiled Canvas Grid hỗ trợ vuốt chạm mượt 2 chiều + thanh Sheet Tabs chạm kích thước >= 40px ở đáy.
    - PowerPoint: Ẩn `ThumbnailPane` trái thành thanh chuyển slide gọn ở đáy (`< Trang X / Y >`) + nút toàn màn hình ngang.

## 5. Bộ Key i18n chuẩn (`vi.json`, `en.json`)

- Tiền tố thống nhất: `office.title.*`, `office.status.*`, `office.menu.*`, `office.ribbon.tab.*`, `office.ribbon.group.*`, `office.ribbon.action.*`, `office.word.*`, `office.excel.*`, `office.ppt.*`, `office.pdf.*`, `office.drawer.*`, `office.draft.*`, `office.error.<ERROR_CODE>`.
- Mọi enum trạng thái hiển thị qua pipe: `{{ ('office.status.' + docStatus) | translate }}` và `{{ ('office.doc_type.' + docType) | translate }}`.

## 6. Kiểm chứng QA Browser (Dual-Mode)

1. **Desktop (>= 1280px)**: Kiểm tra từng app (Word/Excel/PPT/PDF) mở file thật -> sửa -> Ctrl+S / Export; kiểm tra Dark/Light theme, Single Line ↔ Classic Ribbon, Drawer `erp-picker`/`find`, `0` request upload khi mở/sửa local (`AC-02`), `0 console.error`.
2. **Mobile Emulation (`390×844px`)**: Kiểm tra xem Word/Excel/PPT/PDF, chuyển sheet/slide, tải file; xác nhận `document.documentElement.scrollWidth <= window.innerWidth` (`overflow = 0`), touch target `>= 40px`, `0 console.error`.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Thiết kế chi tiết UI/UX Desktop Web & Mobile Ionic cho `office-webapp` | Solution Architect |
