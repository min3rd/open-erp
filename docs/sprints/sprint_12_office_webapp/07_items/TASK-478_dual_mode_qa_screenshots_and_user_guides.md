# TASK-478: Kiểm thử Trình duyệt Hai Chế độ (Desktop & Mobile), Ảnh Minh chứng & Tài liệu Hướng dẫn Sprint 12

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-478` |
| **Thuộc Feature** | [FEAT-51](./FEAT-51_pdf_viewer_mobile_ionic_viewer_e2e_docs.md) |
| **Loại** | QA Verification & Documentation |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [TASK-474](./TASK-474_word_fixed_page_ooxml_editor.md), [TASK-475](./TASK-475_excel_canvas_grid_web_worker_calc.md), [TASK-476](./TASK-476_powerpoint_stage_svg_overlay_slideshow.md), [TASK-477](./TASK-477_pdf_client_viewer_and_mobile_ionic_viewer.md) |
| **Owner** | Developer Agent / QA Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

---

## 1. Phạm vi Công việc

1. Chạy kịch bản kiểm thử trình duyệt hai chế độ với backend PostgreSQL + Redis thật (`npm run infra`):
   - **Desktop (`>= 1280px`)**: Mở/soạn/xuất Word (`.docx`, `.md`), Excel (`.xlsx`, `.csv` + công thức Worker), PowerPoint (`.pptx` + Fullscreen Slideshow), PDF viewer, chuyển Single Line / Classic Ribbon, File Dropdown, Local Save & ERP Cloud Storage Drawer, Theme Sáng/Tối, i18n `vi`/`en`.
   - **Mobile Ionic (`390×844px`)**: Kiểm tra màn hình xem tài liệu tối giản, kiểm tra `scrollWidth <= clientWidth` (overflow = 0), touch target >= 40px, safe-area padding.
2. Lưu ảnh chụp màn hình minh chứng vào thư mục tài liệu nghiệm thu Sprint 12 và đảm bảo **0 `console.error`**.
3. Cập nhật tài liệu hướng dẫn người dùng `docs/06_user_guides/` (kèm screenshots/flow) và hướng dẫn phát triển/cài đặt plugin `docs/08_developer_guides/`, chuẩn bị hồ sơ bàn giao cho Bước 08 (`08_testing/`) và Bước 09 (`09_review/`).

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- 100% ảnh minh chứng Desktop & Mobile đầy đủ, rõ nét, phản ánh dữ liệu thực tế và 0 lỗi Console.
- `node .agents/skills/sdlc-workflow/scripts/check-docs.mjs docs/sprints/sprint_12_office_webapp` đạt 0 lỗi.
