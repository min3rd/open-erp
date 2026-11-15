# TASK-474: Trình soạn thảo Word Fixed `div.Page` (`816×1056px`) & Xuất `.docx`/`.md`/Print-PDF

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-474` |
| **Thuộc Feature** | [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Loại** | Frontend Domain Editor (Word `.docx`/`.doc`) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

---

## 1. Phạm vi Công việc

1. Xây dựng bộ giải mã & mã hóa `wordprocessingml` (`word/document.xml`, `word/styles.xml`, `word/_rels/document.xml.rels`, `word/media/*`) trên `OoxmlZipContainer` + `XmlModelBridge`:
   - Đọc/ghi đoạn văn (`w:p`), run định dạng (`w:rPr`: đậm, nghiêng, gạch chân, màu chữ, cỡ chữ `w:sz`, font `w:rFonts`), heading, căn lề (`w:jc`), danh sách bullet/number, bảng biểu (`w:tbl`, `w:tr`, `w:tc`) và hình ảnh nhúng (`w:drawing`).
   - Hỗ trợ đọc `.doc` ở chế độ xem (trích xuất stream qua `LegacyOle2Reader`, cảnh báo chuyển sang `.docx` nếu muốn lưu định dạng đầy đủ).
2. Xây dựng UI Word Editor sử dụng cấu trúc trang cố định mô phỏng Microsoft Word Web (`div.Page` kích thước A4/Letter chuẩn `816×1056px`, CSS `contain: size layout`), thanh thước (Ruler) tùy chọn, thanh Find & Replace inline không che văn bản, Undo/Redo stack (`Ctrl+Z`/`Ctrl+Y`).
3. Hỗ trợ xuất `.docx`, xuất Markdown (`.md`) và CSS `@media print` sạch sẽ để in/xuất PDF qua trình duyệt.

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- Mở file `.docx` mẫu chứa chữ đậm/nghiêng, bảng và ảnh; chỉnh sửa và xuất lại `.docx` giữ nguyên định dạng hợp lệ.
- Trang `div.Page` căn giữa, đúng tỷ lệ và không tràn lề khi zoom `50%`–`200%`.
