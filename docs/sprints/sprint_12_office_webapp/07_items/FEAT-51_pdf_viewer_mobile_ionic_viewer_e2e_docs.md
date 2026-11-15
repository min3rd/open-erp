# FEAT-51: Trình xem PDF Thuần TypeScript, Phiên bản Mobile Ionic Tối giản, Kiểm thử Hai Chế độ & Tài liệu Hướng dẫn

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `FEAT-51` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Feature (PDF Viewer, Mobile Read-Only, QA & Docs) |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [FEAT-49](./FEAT-49_office_shell_file_storage_drafts_i18n.md), [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Owner** | Developer Agent / QA Agent |
| **Tài liệu nguồn** | [00_READING_GUIDE.md](../00_READING_GUIDE.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md) |

---

## 1. Mục tiêu Nghiệp vụ & Kỹ thuật

Hoàn thiện trải nghiệm đa nền tảng Desktop + Mobile, kiểm thử hai chế độ trình duyệt theo tiêu chuẩn Open-ERP và hoàn thiện bộ tài liệu hướng dẫn người dùng/nhà phát triển:

1. **Client-Side PDF Viewer (`Q1`)**: Hiển thị văn bản, hình ảnh, phân trang PDF và thanh điều hướng trang/thu phóng bằng trình đọc đối tượng PDF thuần TypeScript + Canvas (không dùng PDF.js hay thư viện ngoài).
2. **Mobile Ionic Read-Only Viewer (`390×844px`)**: Giao diện đọc tài liệu gọn nhẹ trên Mobile Ionic (ẩn Ribbon soạn thảo nặng, cung cấp thanh chuyển trang/sheet/slide, xem metadata, tải về hoặc mở chỉnh sửa trên Desktop), đảm bảo 0 tràn ngang (`overflow = 0`), touch target >= 40px.
3. **Kiểm thử Hai Chế độ & Tài liệu Sprint 12**: Chụp ảnh minh chứng Desktop (>= 1280px) và Mobile (`390×844px`) với 0 `console.error`, cập nhật `docs/06_user_guides/` và `docs/08_developer_guides/`.

---

## 2. Danh sách Task Con

| Task ID | Tên Task | Trạng thái | Phụ thuộc | File chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-477` | Trình xem PDF Thuần TypeScript/Canvas & Giao diện Mobile Ionic Read-Only (`390×844`) | `Open` | `TASK-472`, `TASK-473` | [TASK-477](./TASK-477_pdf_client_viewer_and_mobile_ionic_viewer.md) |
| `TASK-478` | Kiểm thử Trình duyệt Hai Chế độ (Desktop/Mobile), Ảnh minh chứng & Cập nhật Tài liệu Hướng dẫn | `Open` | `TASK-474`, `TASK-475`, `TASK-476`, `TASK-477` | [TASK-478](./TASK-478_dual_mode_qa_screenshots_and_user_guides.md) |

---

## 3. Tiêu chí Nghiệm thu Cấp Feature

- PDF Viewer mở và điều hướng được file `.pdf` tiêu chuẩn ngay trên trình duyệt mà không gọi backend hay dùng thư viện bên thứ 3.
- Giao diện Mobile `390×844px` không tràn ngang, 0 `console.error`, đáp ứng touch target >= 40px.
- Bộ minh chứng test Desktop + Mobile và tài liệu hướng dẫn đầy đủ cho bước nghiệm thu (Step 08/09).
