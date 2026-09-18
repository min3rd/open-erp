# Quy Trình Cốt Lõi & Ràng Buộc Agile Sprint (Core SDLC Rules)

## 1. Nguyên Tắc Cốt Lõi Bất Di Bất Dịch (Immutable Guardrails)
- **Cấm Nhảy Cóc (Strict Sequence - No Skipping)**:
  Tuyệt đối không được chuyển sang bước lập trình (Coding) khi chưa hoàn tất phân tích yêu cầu, chưa có xác nhận từ khách hàng, và chưa có tài liệu thiết kế chi tiết (Architecture, DB, API, UI/UX).
- **Giao Tiếp Hướng Tài Liệu (Docs-driven Handover)**:
  Các Agent chỉ giao tiếp và chuyển giao công việc thông qua hệ thống tài liệu chuẩn trong thư mục `docs/`. Mỗi Agent bắt buộc phải đọc tài liệu đầu vào (Input Artifacts) từ Agent trước và xuất ra tài liệu hoàn chỉnh (Output Artifacts) cho Agent sau.
- **Khách Hàng Là Trọng Tâm (Customer Alignment)**:
  Mọi yêu cầu nhận qua truyền miệng (lời nói, tin nhắn vắn tắt) phải được chuyển hóa thành văn bản rõ ràng, phân tích tính khả thi và được khách hàng xác nhận nghiệm thu phạm vi (Scope & Acceptance Criteria) trước khi nghiên cứu và thiết kế giải pháp.

---

## 2. Mô Hình Sprint-Pack Tuần Tự (00 - 09)
Toàn bộ tài liệu của một Sprint được đóng gói trọn gói trong thư mục `docs/sprints/sprint_XX_<tên_sprint>/` theo thứ tự tuần tự từ 00 đến 09:

| Bước | Tên Bước | Vai Trò Phụ Trách | Đầu Vào (Input) | Thư Mục / File Đầu Ra |
| :--- | :--- | :--- | :--- | :--- |
| **00**| **Bản đồ đọc & Xác nhận** | **BA / PM Agent** | Kế hoạch & mục tiêu Sprint | `00_READING_GUIDE.md` *(Cổng bắt đầu duy nhất)* |
| **01**| **Nhận yêu cầu truyền miệng** | **BA Agent** | Lời nói, chat, ghi chú sơ bộ | `01_raw_notes/RAW-XX_...md` |
| **02**| **Phân tích yêu cầu** | **BA Agent** | Ghi chú thô bước 1 | `02_analysis/ANL-XX_...md` |
| **03**| **Tham khảo phần mềm tương tự** | **BA Agent** | Nghiệp vụ cần giải quyết | `03_benchmarks/BENCH-XX_...md` |
| **04**| **Xác nhận với khách hàng** | **BA Agent** | Phân tích & Benchmarks | `04_confirmation/CONF-XX_...md` *(Confirmation Gate)* |
| **05**| **Nghiên cứu giải pháp** | **Solution Architect** | Yêu cầu đã khách hàng duyệt | `05_solutions/SOL-XX_...md` |
| **06**| **Thiết kế giải pháp chi tiết** | **Solution Architect** | Nghiên cứu giải pháp bước 5 | `06_designs/` (`database/`, `api/`, `ui_ux/`) |
| **07**| **Phân rã nhiệm vụ & Code** | **Developer Agent** | Thiết kế chi tiết bước 6 | `07_items/` (`FEAT-`, `TASK-`, `BUG-`) & `src/` |
| **08**| **Kiểm thử chất lượng** | **QA/QC Agent** | Tiêu chí nghiệm thu & Code | `08_testing/` (`test_plan.md`, `test_reports/`) |
| **09**| **Nghiệm thu & Đóng Sprint** | **PM Agent** | Báo cáo QA & Kiểm tra DoD | `09_review/` (`sprint_review.md`) |

---

## 3. Ràng Buộc Agile Sprint & Điều Kiện Đóng Sprint (DoD Gate)
- **Quản lý dạng file (File-based Item Tracking)**:
  Mọi công việc, tính năng, lỗi phát sinh bắt buộc phải tạo file độc lập trong `docs/sprints/sprint_XX_<tên_sprint>/07_items/`:
  - `FEAT-xxx_<tên>.md`
  - `TASK-xxx_<tên>.md`
  - `BUG-xxx_<tên>.md`
  - `REFACTOR-xxx_<tên>.md`
- **Tiêu chuẩn file điều hướng `00_READING_GUIDE.md`**:
  Mỗi Sprint bắt buộc có file `00_READING_GUIDE.md` tại gốc thư mục Sprint. File này chia 3 chặng đọc rõ ràng và là cổng giao tiếp duy nhất giữa Agent và Khách hàng/Reviewer.
- **Điều kiện đóng Sprint (Sprint Closure DoD Gate)**:
  1. **100% item mức `Critical` và `High` phải được xử lý xong (`Done`)** và được QA kiểm thử đạt chuẩn.
  2. Tuyệt đối KHÔNG ĐƯỢC ĐÓNG SPRINT khi còn tồn đọng bất kỳ lỗi hoặc task nào lớn hơn mức `Medium`.
  3. Phải lập biên bản nghiệm thu tại `09_review/sprint_review.md`.
