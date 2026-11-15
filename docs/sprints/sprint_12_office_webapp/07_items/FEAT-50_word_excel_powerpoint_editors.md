# FEAT-50: Bộ Soạn thảo & Trình chiếu Word, Excel, PowerPoint Thuần TypeScript + Hybrid Canvas/DOM/SVG

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `FEAT-50` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Feature (Rich Domain Editors) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [FEAT-48](./FEAT-48_office_storage_and_pure_ts_binary_core.md), [FEAT-49](./FEAT-49_office_shell_file_storage_drafts_i18n.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [00_READING_GUIDE.md](../00_READING_GUIDE.md), [ADR-S12-001](../05_solutions/02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

---

## 1. Mục tiêu Nghiệp vụ & Kỹ thuật

Triển khai 3 module trình soạn thảo/trình chiếu cốt lõi trên trình duyệt, không sử dụng thư viện bên thứ 3:

1. **Word Editor (`Q2`)**: Khung trang cố định `div.Page` (`816×1056px`, `contain: size layout`), soạn thảo đoạn văn (đậm/nghiêng/gạch chân/màu/cỡ chữ/căn lề), danh sách, bảng biểu, chèn ảnh, Find & Replace, Undo/Redo stack, xuất `.docx` chuẩn OOXML, `.md` và Print-to-PDF.
2. **Excel Spreadsheet (`Q3`)**: Lưới `<canvas>` ảo hóa theo vùng nhìn (Tiled Virtual Grid) kết hợp `Web Worker` tính toán công thức (**toàn bộ catalogue hàm Excel Web**, danh sách tại `TASK-475`), Formula Bar, định dạng ô/viền/trộn ô (`Merge`), **Conditional Formatting + Data Validation + Pivot/Table/Slicer đầy đủ**, lọc/sắp xếp/cố định dòng cột (`Freeze Panes`), xuất `.xlsx`/`.csv`/Print-to-PDF.
3. **PowerPoint Presentation (`Q4`)**: Giao diện chia màn hình cột Thumbnail slide bên trái + Sân khấu 16:9 `<canvas>` + lớp `<svg>` vẽ khung chọn/thay đổi kích thước (`move/resize handles`), thêm/xóa/sắp xếp slide, sửa hộp văn bản & hình khối cơ bản, trình chiếu toàn màn hình (`Fullscreen Slideshow`), xuất `.pptx`/JPEG/Print-PDF.

---

## 2. Danh sách Task Con

| Task ID | Tên Task | Trạng thái | Phụ thuộc | File chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-474` | Trình soạn thảo Word Fixed `div.Page` & Xuất `.docx`/`.md`/Print-PDF | `Open` | `TASK-472`, `TASK-473` | [TASK-474](./TASK-474_word_fixed_page_ooxml_editor.md) |
| `TASK-475` | Bảng tính Excel `<canvas>` Ảo hóa + Web Worker Formula Engine & Xuất `.xlsx`/`.csv` | `Open` | `TASK-472`, `TASK-473` | [TASK-475](./TASK-475_excel_canvas_grid_web_worker_calc.md) |
| `TASK-476` | Trình chiếu PowerPoint Stage 16:9 `<canvas>` + `<svg>` Overlay & Fullscreen Slideshow | `Open` | `TASK-472`, `TASK-473` | [TASK-476](./TASK-476_powerpoint_stage_svg_overlay_slideshow.md) |

---

## 3. Tiêu chí Nghiệm thu Cấp Feature

- Đọc/hiển thị được tài liệu `.docx`, `.doc` (read-only notice hoặc chuyển đổi phần trích text), `.xlsx`, `.xls`, `.csv`, `.pptx`, `.ppt`.
- Sửa nội dung và xuất ngược thành công file `.docx`/`.xlsx`/`.pptx` hợp lệ mở được bằng Microsoft Office / LibreOffice.
- Bảng tính Excel >= 5.000 dòng cuộn mượt không giật khung hình chính nhờ virtual `<canvas>` + `Web Worker`.
