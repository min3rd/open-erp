# [ADR-S12-002] Quyết định kiến trúc: Tái hiện bề mặt Hybrid Canvas + DOM của Microsoft 365 Web

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S12-002 / Quyết định kiến trúc / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-15** — chủ dự án duyệt thiết kế qua hội thoại trực tiếp |
| Owner / reviewer | Solution Architect / Self-reviewed |
| Đầu vào | [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) §5 (Reverse Engineering M365 Web), [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0 |
| Đọc trước / đọc tiếp | [ADR-S12-001](02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md) / [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

## 1. Bối cảnh và vấn đề

Qua reverse-engineering trực tiếp Microsoft 365 Web bằng Chrome DevTools ([BENCH-S12-001 §5](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md)), cả Word Web, Excel Web và PowerPoint Web đều không dùng `.wasm` mà đạt hiệu năng cao và cảm giác đồng nhất nhờ kiến trúc bề mặt Hybrid (kết hợp `<canvas>`, CSS Layout cô lập, `<svg>` overlay và `[contenteditable]` DOM overlay).

Cần chốt kiến trúc rendering cụ thể cho từng ứng dụng trong `office-webapp` để vừa đạt độ giống Microsoft 365 Web cao nhất, vừa đảm bảo mượt mà khi tự xây dựng trên Angular >= 22.

## 2. Quyết định kiến trúc cho 3 bề mặt

### 2.1. Word Web → Fixed `div.Page` (`contain: size layout`) + Hybrid Paragraph Renderer
- **Học trực tiếp từ `word-edit.officeapps.live.com`**:
  - Vùng giấy sử dụng container `div.op-word-pages-container` căn giữa trên nền trung tính (`#f3f2f1` Light / `#171717` Dark).
  - Mỗi trang là một `div.op-word-page` kích thước chuẩn A4/Letter (`816×1056px` tại 96 DPI, phóng đại bằng CSS `transform: scale(zoom)` hoặc layout scale) với thuộc tính CSS `contain: size layout` để cô lập việc tính toán trình duyệt theo từng trang.
  - Phần lề (`div.op-word-section`, mặc định `96px` = 1 inch) chứa các block đoạn văn, danh sách, bảng và ảnh.
  - **Cơ chế nhập liệu & phân trang**: Trong v1 in-house, thay vì rasterize chữ thủ công lên 1000 `<canvas>` riêng lẻ (rất phức tạp khi xử lý IME tiếng Việt Telex/VNI), dùng **DOM Semantic Block có kiểm soát chiều cao (`contenteditable` chuẩn hóa qua AST model)** nằm trong khung trang cố định `div.Page`, kết hợp **Thước ngang/dọc vẽ bằng `<canvas>`** (`816×20px` và `20×1056px`) đúng kích thước đã quan sát từ Word Web. Khi chiều cao nội dung tràn quá `1056 - 2*96 = 864px`, thuật toán phân trang (`WordPaginator`) tự đẩy block thừa sang `div.Page` tiếp theo.
  - **Lý do kỹ thuật**: Hỗ trợ gõ tiếng Việt IME (Unikey/EVKey/macOS Telex) mượt mà 100%, bôi đen/copy chuẩn trình duyệt nhưng vẫn giữ đúng hình khối phân trang của Word Web.

### 2.2. Excel Web → Tiled `<canvas>` Virtual Grid + Web Worker + Single `[contenteditable]` Overlay
- **Học trực tiếp từ `excel.officeapps.live.com`**:
  - Không bao giờ render 100.000 thẻ `<td>` vào DOM.
  - Chia vùng bảng tính thành **các `<canvas>` riêng biệt**:
    1. `ColumnHeaderCanvas` (`width × 28px`): vẽ chữ cái cột `A, B, C...` và thanh kéo độ rộng cột.
    2. `RowHeaderCanvas` (`44px × height`): vẽ số dòng `1, 2, 3...` và thanh kéo chiều cao dòng.
    3. `GridTilesContainer`: vẽ lưới ô theo các tile ảo hóa (chiều cao tối đa `560px`/tile, hỗ trợ `devicePixelRatio` sắc nét trên màn hình Retina/4K), vẽ màu nền, chữ căn lề, viền ô, vùng `mergeCells`, khung viền xanh lá cho ô đang chọn (`activeCell`) và vùng chọn (`selectionRange`), đường kẻ cố định (`freezePanes`).
  - **Sửa ô & Formula Bar**: Chỉ tồn tại **duy nhất 1 phần tử `<div contenteditable="true">` nổi** đặt đúng tọa độ ô đang double-click / gõ phím, đồng bộ hai chiều tức thời với Formula Bar (`Name Box` + `fx` input).
  - **Tính toán bất đồng bộ**: Toàn bộ parse công thức, xây đồ thị phụ thuộc (`DAG`) và tính lại giá trị khi sửa ô chạy trong `office-calc.worker.ts` (Web Worker), gửi lại chỉ các ô thay đổi về Main Thread để vẽ lại đúng tile `<canvas>` bị ảnh hưởng.

### 2.3. PowerPoint Web → Split-Screen + 16:9 `<canvas>` Stage + `<svg>` Selection Overlay
- **Học trực tiếp từ `powerpoint.officeapps.live.com`**:
  - **Split-Screen**: Bên trái là `ThumbnailPane` (danh sách canvas thu nhỏ 16:9 có số thứ tự, kéo thả đổi thứ tự slide, thu gọn bằng `Ctrl+\`); giữa là `SlideStage` tỷ lệ 16:9 (`960×540` logic scale theo viewport); dưới đáy là `NotesBar` thu gọn được.
  - **Hai lớp chồng khít trên Stage**:
    - Lớp dưới (`<canvas>` 2D): vẽ nền slide, shape (chữ nhật, tròn, mũi tên, đường thẳng), ảnh và nội dung văn bản không đang được chọn.
    - Lớp trên (`<svg class="pointer-events-none">` với `<g class="selectionsvgggroup">` tương tác): vẽ khung nét đứt và 8 điểm neo (handles) quanh shape/textbox đang được chọn để kéo di chuyển hoặc resize mượt mà 60fps.
    - Khi double-click vào textbox: bật 1 `[contenteditable="true"]` định vị đúng bounding box để gõ chữ trực tiếp (hỗ trợ IME tiếng Việt).
  - **Slideshow**: Dùng Web Fullscreen API (`requestFullscreen()`) render Stage phóng đại toàn màn hình + điều hướng bằng phím mũi tên / click / `Esc`.

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Chốt kiến trúc Hybrid rendering cho Word, Excel, PowerPoint dựa trên reverse-engineering M365 Web | Solution Architect |
