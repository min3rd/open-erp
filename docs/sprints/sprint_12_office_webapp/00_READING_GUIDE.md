# [00] Sprint 12 — Plugin Office WebApp (Xem & Sửa File Office Trên Trình Duyệt)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S12-001 / 0.6 / 2026-11-15 |
| Trạng thái tài liệu / sprint | 📋 **ĐÃ PHÂN RÃ BƯỚC 07** — **Design APPROVED 1.0**; đã cấp `FEAT-48`..`FEAT-51` & `TASK-471`..`TASK-478` (`Open`), chờ review để chuyển lập trình |
| Owner / reviewer | BA Agent / Chưa review (chờ Chủ dự án) |
| Đầu vào / đọc trước | Yêu cầu trực tiếp chủ dự án 2026-11-15 ([RAW-S12-001](01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md)) / [Developer Reading Guide](../../08_developer_guides/00_READING_GUIDE.md), [Sprint 06 — Plugin Dev Platform](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) |
| Đọc tiếp | [RAW-S12-001](01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) → [ANL-S12-001](02_analysis/01_ANL-S12-001_office_webapp_plugin.md) → [BENCH-S12-001](03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) → [CONF-S12-001](04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) |

## 1. Đọc để hiểu gì?

Sprint 12 xây dựng **plugin `office-webapp`** (tên đề xuất) cho phép người dùng **xem và chỉnh sửa các tệp định dạng Microsoft Office** (`.docx`, `.xlsx`, `.pptx`) trực tiếp trên trình duyệt theo trải nghiệm tương tự **Microsoft 365 for the Web (Office 365)**.

Điểm khác biệt cốt lõi theo định hướng của chủ dự án: **ưu tiên xử lý hoàn toàn ở phía Client (Client-side / Browser-first, không cần hoặc hạn chế tối đa sự can thiệp của Backend)** — người dùng có thể mở tệp trực tiếp từ máy cá nhân (kéo-thả / chọn file / File System Access API), xem, chỉnh sửa và xuất lại tệp Office ngay trên trình duyệt mà không phải upload dữ liệu nhạy cảm lên máy chủ để render/convert.

### 1.1. Kiến thức nền & liên hệ Sprint trước

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Plugin Platform & UI Extension | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) | Cơ chế đóng gói plugin Web Component / Module Federation, slot mở rộng và tích hợp menu |
| UI/UX ERP & Shared Library | [Sprint 04](../sprint_04_ui_ux_experience/00_READING_GUIDE.md), [UI/UX Standards](../../../.agents/rules/ui_ux_standards.md) | Chuẩn mật độ cao, vuông vắn, anti-modal, route-driven state, i18n 100% |
| Tài liệu hướng dẫn Dev | [Developer Reading Guide](../../08_developer_guides/00_READING_GUIDE.md) | Quy trình tạo plugin mới, Angular >= 22 + Tailwind 4 + Ionic 8 |
| Hạ tầng Kết xuất Tài liệu (S16) | [Sprint 16 — Document Template](../sprint_16_plugin_document_template/00_READING_GUIDE.md) | `office-webapp` cung cấp Trình soạn thảo `.docx/.xlsx` & PDF Viewer nhúng (kèm Extension Slot chèn `{{merge_tag}}`) để `Template Studio` của Sprint 16 chỉnh sửa mẫu in trực tiếp trên trình duyệt |

## 2. Lộ trình đọc

Khách hàng / Reviewer đọc tuần tự **01 → 04** để nắm yêu cầu gốc, phân tích nghiệp vụ, đối chuẩn các giải pháp Office trên trình duyệt và trả lời các câu hỏi chốt phạm vi tại `CONF-S12-001`. Developer và Architect sẽ đọc tiếp từ bước 05 sau khi `CONF-S12-001` được duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S12-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) | Nguyên văn yêu cầu, R1–R4, diễn giải BA, ghi nhận thử nghiệm `agent-browser` với Edge, câu hỏi mở | BA |
| 02.01 | ANL-S12-001 | [Phân tích plugin Office WebApp](02_analysis/01_ANL-S12-001_office_webapp_plugin.md) | 16 User Stories (Word/Excel/PowerPoint/File Workspace), đề xuất In/Out-of-Scope, Business Rules `BR-O01…O09`, edge cases | BA |
| 03.01 | BENCH-S12-001 | [Đối chuẩn Office WebApp & Client-side Engines](03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) | Đối chuẩn trực tiếp Microsoft 365 Web + Reverse-engineering Chrome DevTools (Zero-Third-Party in-house architecture) | BA |
| 04.01 | CONF-S12-001 | [Scope, AC & Câu hỏi chốt phạm vi](04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) | ✅ **APPROVED 1.0** — 9/9 câu; In/Out scope; 8 AC + ma trận D/M; rủi ro `.doc`/`.xls`/`.ppt`/`.pdf` tự viết | BA + Khách hàng |
| 05.01 | SOL-S12-001 | [Giải pháp tổng thể](05_solutions/01_SOL-S12-001_office_webapp_architecture.md) | Kiến trúc Client-First Zero-Third-Party + tùy chọn ERP Cloud Storage (MinIO) | Architect |
| 05.02 | ADR-S12-001 | [ADR: Bộ giải mã tự xây](05_solutions/02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md) | OOXML ZIP+XML (`CompressionStream`/`DOMParser`), OLE2 CFBF, PDF Dual-Mode | Architect |
| 05.03 | ADR-S12-002 | [ADR: Tái hiện bề mặt M365 Web](05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md) | Word `div.Page`, Excel Tiled `<canvas>` + Worker, PPT 16:9 Stage + `<svg>` overlay | Architect |
| 06.01 | DES-ARCH-S12-001 | [Thiết kế Kiến trúc & Luồng](06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md) | Cấu trúc repo, `plugin.json` v2.0, Sequence Diagrams, Web Worker protocol | Architect |
| 06.02 | DES-DB-S12-001 | [Thiết kế DB & IndexedDB](06_designs/db/01_DES-DB-S12-001_office_storage_schema.md) | Schema `tenant_<id8>_office` (`plg_office_documents`, `versions`) + IndexedDB nháp | Architect |
| 06.03 | DES-API-S12-001 | [Thiết kế API Contract](06_designs/api/01_DES-API-S12-001_office_storage_api.md) | API lưu/tải ERP Cloud Storage theo 4 khuôn mẫu chuẩn, Enums & i18n codes | Architect |
| 06.04 | DES-UI-S12-001 | [Thiết kế UI/UX Web & Mobile](06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) | Office Shell, Single/Classic Ribbon, Compact File Dropdown, 4 engines & Mobile Viewer | Architect |
| 07.01 | `FEAT-48` | [Nền tảng Plugin Office WebApp — Backend Lưu trữ ERP & Lõi Nhị phân Thuần TS](./07_items/FEAT-48_office_storage_and_pure_ts_binary_core.md) | 📋 `Open` (`TASK-471`, `TASK-472`) | Developer |
| 07.02 | `FEAT-49` | [Khung Giao diện Office Shell, Ribbon Cấu hình Động, File Dropdown, Storage Bridge & i18n](./07_items/FEAT-49_office_shell_file_storage_drafts_i18n.md) | 📋 `Open` (`TASK-473`) | Developer |
| 07.03 | `FEAT-50` | [Bộ Soạn thảo & Trình chiếu Word, Excel, PowerPoint Thuần TS + Hybrid Canvas/DOM/SVG](./07_items/FEAT-50_word_excel_powerpoint_editors.md) | 📋 `Open` (`TASK-474`..`TASK-476`) | Developer |
| 07.04 | `FEAT-51` | [Trình xem PDF Thuần TS, Mobile Ionic Read-Only, Kiểm thử Hai Chế độ & Tài liệu](./07_items/FEAT-51_pdf_viewer_mobile_ionic_viewer_e2e_docs.md) | 📋 `Open` (`TASK-477`, `TASK-478`) | Developer / QA |
| 08.01+ | TP/TR-S12-001 | Chưa tạo | Test plan / Test report Dual-Mode Browser | QA |
| 09.01 | REV-S12-001 | Chưa tạo | Đánh giá DoD & đóng Sprint | PM |

> Bảng đọc là snapshot hiện tại. Không tạo link giả cho artifact chưa tồn tại.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval (`CONF-S12-001`) | ✅ **APPROVED 1.0** | Chủ dự án | CONF-S12-001 1.0, 2026-11-15 |
| Design ready (`SOL/ADR/DES`) | ✅ **APPROVED 1.0** | Chủ dự án | SOL/ADR/DES 1.0, 2026-11-15 |
| Implementation (`FEAT-48`..`FEAT-51`) | ⏳ Pending (awaiting item review / `opencode`) | Developer | Phân rã Bước 07 (`FEAT-48`..`FEAT-51`, `TASK-471`..`TASK-478`) từ Design 1.0 |
| QA sign-off | ⏳ Pending | QA | Chưa có |
| PM đánh giá DoD | ⏳ Pending | PM | Chưa có |
| Customer acceptance | ⏳ Pending | Khách hàng | Chưa có |
| Closure | ⏳ Pending | PM sau nghiệm thu | Chưa có |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S12-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA / Architect | Used — 0.6 |
| RAW-S12-001 | [01_RAW-S12-001_office_webapp_requirements.md](01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) | BA | Used — Draft 0.2 |
| ANL-S12-001 | [01_ANL-S12-001_office_webapp_plugin.md](02_analysis/01_ANL-S12-001_office_webapp_plugin.md) | BA | Used — Draft 0.2 |
| BENCH-S12-001 | [01_BENCH-S12-001_office_webapp_benchmarks.md](03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) | BA | Used — Draft 0.4 |
| CONF-S12-001 | [01_CONF-S12-001_sprint_12_scope_and_ac.md](04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) | BA + Khách hàng | Used — **APPROVED 1.0** |
| SOL-S12-001 | [01_SOL-S12-001_office_webapp_architecture.md](05_solutions/01_SOL-S12-001_office_webapp_architecture.md) | Architect | Used — **APPROVED 1.0** |
| ADR-S12-001 | [02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md](05_solutions/02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md) | Architect | Used — **APPROVED 1.0** |
| ADR-S12-002 | [03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md](05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md) | Architect | Used — **APPROVED 1.0** |
| DES-ARCH-S12-001 | [01_DES-ARCH-S12-001_components_and_flows.md](06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md) | Architect | Used — **APPROVED 1.0** |
| DES-DB-S12-001 | [01_DES-DB-S12-001_office_storage_schema.md](06_designs/db/01_DES-DB-S12-001_office_storage_schema.md) | Architect | Used — **APPROVED 1.0** |
| DES-API-S12-001 | [01_DES-API-S12-001_office_storage_api.md](06_designs/api/01_DES-API-S12-001_office_storage_api.md) | Architect | Used — **APPROVED 1.0** |
| DES-UI-S12-001 | [01_DES-UI-S12-001_office_webapp_ui.md](06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) | Architect | Used — **APPROVED 1.0** |
| Feature | `FEAT-48`..`FEAT-51` | Developer | 4 Feature thuộc Sprint 12 ([`07_items/`](./07_items/FEAT-48_office_storage_and_pure_ts_binary_core.md)) |
| Task | `TASK-471`..`TASK-478` | Developer / QA | 8 Task phân rã chi tiết trong `07_items/` (`Open`, chờ review) |
| Bug / Refactor | *(chưa phát sinh)* | Developer / QA | Cấp tiếp theo phát hiện thực tế trong Bước 07–08 |

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Khởi tạo Sprint-Pack 12: tạo `00_READING_GUIDE.md`, `RAW-S12-001`, `ANL-S12-001`, `BENCH-S12-001` và dự thảo `CONF-S12-001` (với 10 câu hỏi chốt scope) để chủ dự án review | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-15 |
| 0.2 | 2026-11-15 | **Scope & AC APPROVED 1.0** — cập nhật kết quả reverse-engineering Microsoft 365 Web, chốt nguyên tắc tự xây dựng từ đầu (Zero-Third-Party), ghi nhận 9/9 câu trả lời `Q1`–`Q9` và phê duyệt của chủ dự án; mở bước 05–06 cho Architect | BA Agent; hội thoại trực tiếp chủ dự án 2026-11-15 |
| 0.3 | 2026-11-15 | Hoàn thành bước 05–06 (`SOL-S12-001`, `ADR-S12-001`, `ADR-S12-002`, `DES-ARCH-S12-001`, `DES-DB-S12-001`, `DES-API-S12-001`, `DES-UI-S12-001`), Self-reviewed — chờ Design review trước khi phân rã `FEAT/TASK` | Solution Architect |
| 0.4 | 2026-11-15 | **Design APPROVED 1.0** — chủ dự án duyệt thiết kế (`SOL/ADR/DES`), mở bước 07 (`FEAT/TASK`) cho Developer | Architect/PM; hội thoại trực tiếp chủ dự án 2026-11-15 |
| 0.5 | 2026-11-15 | Mở Bước 07: cấp `FEAT-48`..`FEAT-51` và `TASK-471`..`TASK-478` trong `07_items/` ở trạng thái `Open` chờ chủ dự án review trước khi `opencode` lập trình | Developer |
| 0.6 | 2026-11-15 | Ghi nhận cầu nối tích hợp với **Sprint 16 (`plugins/document-template` — ưu tiên triển khai trước)**: `office-webapp` đóng vai trò trình soạn thảo `.docx/.xlsx` & PDF Previewer nhúng (Extension Slot chèn `{{merge_tag}}`) phục vụ `Template Studio` | BA Agent; cập nhật theo Sprint 16 |
