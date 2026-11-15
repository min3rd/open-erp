# [00] Sprint 12 — Plugin Office WebApp (Xem & Sửa File Office Trên Trình Duyệt)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S12-001 / 0.2 / 2026-11-15 |
| Trạng thái tài liệu / sprint | 🚧 **ĐANG THỰC HIỆN** — **Scope APPROVED 1.0** (9/9 câu + 8 AC); bước 05–06 (SOL/DES) mở cho Architect |
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

## 2. Lộ trình đọc

Khách hàng / Reviewer đọc tuần tự **01 → 04** để nắm yêu cầu gốc, phân tích nghiệp vụ, đối chuẩn các giải pháp Office trên trình duyệt và trả lời các câu hỏi chốt phạm vi tại `CONF-S12-001`. Developer và Architect sẽ đọc tiếp từ bước 05 sau khi `CONF-S12-001` được duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S12-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) | Nguyên văn yêu cầu, R1–R4, diễn giải BA, ghi nhận thử nghiệm `agent-browser` với Edge, câu hỏi mở | BA |
| 02.01 | ANL-S12-001 | [Phân tích plugin Office WebApp](02_analysis/01_ANL-S12-001_office_webapp_plugin.md) | 16 User Stories (Word/Excel/PowerPoint/File Workspace), đề xuất In/Out-of-Scope, Business Rules `BR-O01…O09`, edge cases | BA |
| 03.01 | BENCH-S12-001 | [Đối chuẩn Office WebApp & Client-side Engines](03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) | Đối chuẩn trực tiếp Microsoft 365 Web + Reverse-engineering Chrome DevTools (Zero-Third-Party in-house architecture) | BA |
| 04.01 | CONF-S12-001 | [Scope, AC & Câu hỏi chốt phạm vi](04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) | ✅ **APPROVED 1.0** — 9/9 câu; In/Out scope; 8 AC + ma trận D/M; rủi ro `.doc`/`.xls`/`.ppt`/`.pdf` tự viết | BA + Khách hàng |
| 05.01 | SOL-S12-001 | Chưa tạo | Phương án kỹ thuật (lựa chọn JS/WASM engine, license, bundle size, lazy-load) | Architect |
| 06.01–06.04 | DES-ARCH/DB/API/UI-S12-001 | Chưa tạo | Thiết kế kiến trúc plugin, lưu trữ (Zero-DB hoặc metadata), UI Shell kiểu Ribbon thu gọn | Architect |
| 07.01+ | FEAT/TASK | Chưa cấp | Không cấp số trước khi CONF duyệt scope | Developer |
| 08.01+ | TP/TR-S12-001 | Chưa tạo | Test plan / Test report Dual-Mode Browser | QA |
| 09.01 | REV-S12-001 | Chưa tạo | Đánh giá DoD & đóng Sprint | PM |

> Bảng đọc là snapshot hiện tại. Không tạo link giả cho artifact chưa tồn tại.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval (`CONF-S12-001`) | ✅ **APPROVED 1.0** | Chủ dự án | CONF-S12-001 1.0, 2026-11-15 |
| Design ready (`SOL/ADR/DES`) | ⏳ Pending | Architect / reviewer | Chưa có |
| QA sign-off | ⏳ Pending | QA | Chưa có |
| PM đánh giá DoD | ⏳ Pending | PM | Chưa có |
| Customer acceptance | ⏳ Pending | Khách hàng | Chưa có |
| Closure | ⏳ Pending | PM sau nghiệm thu | Chưa có |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S12-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used — 0.2 |
| RAW-S12-001 | [01_RAW-S12-001_office_webapp_requirements.md](01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) | BA | Used — Draft 0.2 |
| ANL-S12-001 | [01_ANL-S12-001_office_webapp_plugin.md](02_analysis/01_ANL-S12-001_office_webapp_plugin.md) | BA | Used — Draft 0.2 |
| BENCH-S12-001 | [01_BENCH-S12-001_office_webapp_benchmarks.md](03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) | BA | Used — Draft 0.4 |
| CONF-S12-001 | [01_CONF-S12-001_sprint_12_scope_and_ac.md](04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) | BA + Khách hàng | Used — **APPROVED 1.0** |
| SOL/ADR/DES-S12-001+ | *(chưa cấp)* | Architect | Đã mở bước 05–06 sau CONF APPROVED |
| FEAT/TASK/BUG | *(chưa cấp)* | Developer / QA | Chờ Design ready |

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Khởi tạo Sprint-Pack 12: tạo `00_READING_GUIDE.md`, `RAW-S12-001`, `ANL-S12-001`, `BENCH-S12-001` và dự thảo `CONF-S12-001` (với 10 câu hỏi chốt scope) để chủ dự án review | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-15 |
| 0.2 | 2026-11-15 | **Scope & AC APPROVED 1.0** — cập nhật kết quả reverse-engineering Microsoft 365 Web, chốt nguyên tắc tự xây dựng từ đầu (Zero-Third-Party), ghi nhận 9/9 câu trả lời `Q1`–`Q9` và phê duyệt của chủ dự án; mở bước 05–06 cho Architect | BA Agent; hội thoại trực tiếp chủ dự án 2026-11-15 |
