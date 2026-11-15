# TASK-476: Trình chiếu PowerPoint Stage 16:9 `<canvas>` + `<svg>` Selection Overlay & Fullscreen Slideshow

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-476` |
| **Thuộc Feature** | [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Loại** | Frontend Domain Editor (PowerPoint `.pptx`/`.ppt`) |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

---

## 1. Phạm vi Công việc

1. Xây dựng `presentationml` codec (`ppt/presentation.xml`, `ppt/slides/slide*.xml`, `ppt/slideLayouts/*`, `ppt/media/*`) trên `OoxmlZipContainer` + `XmlModelBridge`, quy đổi đơn vị EMU sang pixel 16:9 chuẩn (`1280×720` hoặc `960×540` canvas logic).
2. Xây dựng bố cục Split-Screen chuẩn PowerPoint Web:
   - Cột trái: Danh sách Thumbnail slide render thu nhỏ, hỗ trợ thêm slide mới, nhân bản, xóa và đổi thứ tự slide.
   - Sân khấu trung tâm: `<canvas>` vẽ nền, hình khối (`rect`, `ellipse`, `roundRect`), ảnh và văn bản; kết hợp lớp `<svg>` phủ bên trên cung cấp khung chọn + 8 tay nắm thay đổi kích thước (`move/resize handles`) và hộp sửa text trực tiếp (inline textarea khi double-click).
3. Chế độ **Fullscreen Slideshow**: Hỗ trợ trình chiếu toàn màn hình bằng Fullscreen API, chuyển slide bằng phím mũi tên/Space/Click, thoát bằng `Esc`.
4. Xuất `.pptx`, xuất slide hiện tại sang ảnh JPEG (`canvas.toBlob('image/jpeg')`) và Print-to-PDF.

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- Mở file `.pptx` mẫu nhiều slide; chọn phần tử trên slide, kéo thả di chuyển/resize, sửa text và thêm slide mới; xuất lại `.pptx` mở được bằng PowerPoint/LibreOffice.
- Chế độ Fullscreen Slideshow hoạt động mượt với điều khiển bàn phím.
