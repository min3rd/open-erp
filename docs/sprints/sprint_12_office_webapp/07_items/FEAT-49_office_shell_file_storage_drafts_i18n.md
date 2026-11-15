# FEAT-49: Khung Giao diện Office WebApp (Shell), Ribbon Cấu hình Động, File Dropdown, Lưu trữ Cục bộ/ERP & Nháp Ngoại tuyến

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `FEAT-49` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Feature (Frontend Shell & Storage Integration) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [FEAT-48](./FEAT-48_office_storage_and_pure_ts_binary_core.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [00_READING_GUIDE.md](../00_READING_GUIDE.md), [SOL-S12-001](../05_solutions/01_SOL-S12-001_office_webapp_architecture.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [DES-API-S12-001](../06_designs/api/01_DES-API-S12-001_office_storage_api.md) |

---

## 1. Mục tiêu Nghiệp vụ & Kỹ thuật

Xây dựng khung ứng dụng Angular >= 22 + Tailwind CSS v4 (đóng gói thành Web Component `/apps/office`) bám sát kiến trúc giao diện Microsoft 365 Web đã reverse-engineer kết hợp quy chuẩn ERP mật độ cao & Anti-Modal:

1. **Ribbon Chuyển đổi Động (`Q5`)**: Hỗ trợ chế độ `Single Line Ribbon` (~40px, mặc định cho Word/PPT) và `Classic Ribbon` (~90px, mặc định cho Excel) thông qua `Ribbon Display Options`.
2. **Compact `File` Dropdown (`Anti-Modal`)**: Mở danh sách thao tác Mở file cục bộ, Tạo mới Word/Excel/PPT, Mở từ ERP Storage (mở Drawer trượt phải thay vì Modal), Lưu cục bộ (`File System Access API` / Download fallback), Lưu lên ERP (có ETag version conflict), Xuất PDF/Markdown/CSV/JPEG.
3. **Nháp Ngoại tuyến IndexedDB (`Q7`)**: Tự động lưu nháp định kỳ vào `open_erp_office_drafts` và khôi phục khi reload trang.
4. **Route-Driven State & 100% i18n**: Phản ánh đầy đủ `?mode=word|excel|ppt|pdf&docId=&tab=&drawer=` vào URL; template tách riêng `.html`; 100% i18n (`vi.json`, `en.json`), Zero-Emoji labels.

---

## 2. Danh sách Task Con

| Task ID | Tên Task | Trạng thái | Phụ thuộc | File chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-473` | Xây dựng Office Shell Web Component, Ribbon động (Single/Classic), File Dropdown, Storage Bridge (Local/ERP/IndexedDB) & i18n | `Open` | `TASK-471`, `TASK-472` | [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |

---

## 3. Tiêu chí Nghiệm thu Cấp Feature

- Mở/Lưu trực tiếp file từ máy tính người dùng (`.docx`/`.xlsx`/`.pptx`/`.csv`/`.pdf`) mà **0 byte** gửi lên backend khi làm việc chế độ Local.
- Tải/Lưu/Quản lý phiên bản tài liệu trên ERP Cloud Storage thông qua Drawer trượt cạnh phải và API `/api/v1/office/documents`.
- Deep-link URL giữ nguyên trạng thái làm việc khi F5 hoặc dùng Back/Forward.
