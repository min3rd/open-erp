# TASK-477: Trình xem PDF Thuần TypeScript/Canvas & Giao diện Mobile Ionic Read-Only (`390×844`)

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-477` |
| **Thuộc Feature** | [FEAT-51](./FEAT-51_pdf_viewer_mobile_ionic_viewer_e2e_docs.md) |
| **Loại** | Frontend Viewer & Mobile Ionic (`@ionic/angular`) |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

---

## 1. Phạm vi Công việc

1. **Client-Side PDF Viewer (`Q1`)**: Kết nối `ClientPdfReader` với `<canvas>` viewer theo từng trang, hỗ trợ zoom (`50%`–`200%`), chuyển trang (`Prev`/`Next`/nhập số trang), hiển thị văn bản có thể copy/tìm kiếm cơ bản trên lớp text overlay trong suốt, hoàn toàn chạy phía client không gọi third-party library.
2. **Mobile Ionic Read-Only Viewer (`390×844px`)**:
   - Đóng gói component/route xem tài liệu tối giản cho `src/frontend/mobile/` (Ionic 8 + Angular), tái sử dụng core model & parser từ plugin `office-webapp` / `@shared/*`.
   - Giao diện đọc gọn cho `.docx`, `.xlsx`/`.csv`, `.pptx`, `.pdf`: thanh điều hướng chuyển sheet/slide/trang, nút tải xuống cục bộ, safe-area padding, kích thước nút chạm >= 40px, ẩn hoàn toàn các thanh Ribbon soạn thảo Desktop, bảo đảm `overflow-x: 0`.

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- Mở được tài liệu `.pdf` thực tế ngay trên client với 0 dependency ngoài.
- Mở trên giả lập viewport `390×844px` với cả tài liệu Word, Excel, PowerPoint, PDF: không tràn ngang (`scrollWidth <= clientWidth`), nút bấm >= 40px, 0 `console.error`.
