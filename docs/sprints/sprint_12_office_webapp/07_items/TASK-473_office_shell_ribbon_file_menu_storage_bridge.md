# TASK-473: Xây dựng Office Shell Web Component, Ribbon Cấu hình Động, File Dropdown, Storage Bridge & i18n

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-473` |
| **Thuộc Feature** | [FEAT-49](./FEAT-49_office_shell_file_storage_drafts_i18n.md) |
| **Loại** | Frontend Shell & Integration (Angular >= 22 + Tailwind v4) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [TASK-471](./TASK-471_office_backend_scaffold_schema_api.md), [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [DES-API-S12-001](../06_designs/api/01_DES-API-S12-001_office_storage_api.md) |

---

## 1. Phạm vi Công việc

1. Đóng gói plugin Angular Web Component tại `plugins/office-webapp/web/src/plugin-main.ts` theo chuẩn `createCustomElement` của Open-ERP (`op-office-webapp`).
2. Xây dựng Shell tối giản mật độ cao theo phong cách M365 Web (`DES-UI-S12-001`):
   - Top App Chrome (`~44px`) với biểu tượng ngữ nghĩa (không emoji), tên file inline editable, chỉ báo trạng thái lưu (`Local`, `Draft`, `Synced`, `Offline`).
   - Ribbon Bar hỗ trợ chuyển đổi trực tiếp giữa `Single Line Ribbon` (~40px) và `Classic Ribbon` (~90px) qua nút `Ribbon Display Options` (`Home`, `Insert`, `Layout`, `Review`, `View`).
   - Nút `File` mở **Compact Dropdown** (Anti-Modal) cho: Mở file máy tính, Tạo Word/Excel/PPT mới, Mở từ ERP Storage (trượt Drawer cạnh phải thay thế Modal), Lưu cục bộ (`File System Access API` `showSaveFilePicker` hoặc fallback Blob download), Lưu lên ERP (có `expected_version`), Xuất PDF/Markdown/CSV/JPEG.
3. Xây dựng `OfficeStorageBridgeService` kết nối Angular `HttpClient` (cấm `fetch()` thuần) tới `/api/v1/office/documents` + `IndexedDbDraftStore` (`open_erp_office_drafts`).
4. Ánh xạ 100% trạng thái vào Query Params URL (`?mode=&docId=&tab=&drawer=`) và từ điển đa ngôn ngữ `vi.json` / `en.json` hoàn chỉnh.

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- Build bundle Web Component thành công không lỗi TypeScript/Angular compiler.
- Toàn bộ template `.html` tách riêng khỏi `.ts`; 0 emoji trong nhãn text; 100% hiển thị dùng key i18n.
- Thao tác Local open/edit/save không phát sinh HTTP call tới backend storage.
