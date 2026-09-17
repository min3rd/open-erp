# Quy Trình Phát Triển Phần Mềm Chuẩn Mực & Ràng Buộc Phối Hợp Multi-Agent

## 1. Nguyên Tắc Cốt Lõi Bất Di Bất Dịch (Immutable Guardrails)

- **Cấm Nhảy Cóc (Strict Sequence - No Skipping)**:
  Tuyệt đối không được chuyển sang bước lập trình (Coding) khi chưa hoàn tất phân tích yêu cầu, chưa có xác nhận từ khách hàng, và chưa có tài liệu thiết kế chi tiết (Architecture, DB, API, UI/UX).
- **Giao Tiếp Hướng Tài Liệu (Docs-driven Handover)**:
  Các Agent chỉ giao tiếp và chuyển giao công việc thông qua hệ thống tài liệu chuẩn trong thư mục `docs/`. Mỗi Agent bắt buộc phải đọc tài liệu đầu vào (Input Artifacts) từ Agent trước và xuất ra tài liệu hoàn chỉnh (Output Artifacts) cho Agent sau.
- **Khách Hàng Là Trọng Tâm (Customer Alignment)**:
  Mọi yêu cầu nhận qua truyền miệng (lời nói, tin nhắn vắn tắt) phải được chuyển hóa thành văn bản rõ ràng, phân tích tính khả thi và được khách hàng xác nhận nghiệm thu phạm vi (Scope & Acceptance Criteria) trước khi nghiên cứu và thiết kế giải pháp.

---

## 2. Quy Trình 9 Bước Chuẩn Hóa & Vai Trò Phụ Trách

| Bước | Tên Bước | Vai Trò Phụ Trách | Đầu Vào (Input) | Thư Mục Tài Liệu Đầu Ra (Output) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Nhận yêu cầu truyền miệng** | **BA Agent** | Lời nói, chat, ghi chú sơ bộ của khách hàng | `docs/01_requirements/raw_notes/` |
| **2** | **Phân tích yêu cầu** | **BA Agent** | Ghi chú thô bước 1 | `docs/01_requirements/analysis/` |
| **3** | **Tham khảo phần mềm tương tự** | **BA Agent** | Nghiệp vụ cần giải quyết | `docs/01_requirements/benchmarks/` |
| **4** | **Xác nhận với khách hàng** | **BA Agent** | Tài liệu phân tích & so sánh | `docs/01_requirements/confirmations/` |
| **5** | **Nghiên cứu giải pháp** | **Solution Architect** | Yêu cầu đã khách hàng duyệt | `docs/02_solutions/` |
| **6** | **Thiết kế giải pháp chi tiết** | **Solution Architect** | Nghiên cứu giải pháp bước 5 | `docs/03_designs/` (Arch, DB, API, UI) |
| **7** | **Lập trình** | **Developer Agent** | Thiết kế chi tiết bước 6 | `src/` (Mã nguồn dự án) |
| **8** | **Kiểm thử** | **QA/QC Agent** | Tiêu chí nghiệm thu & Thiết kế | `docs/04_testing/`, `tests/` |
| **9** | **Cập nhật công việc** | **PM Agent** | Kết quả thực thi các bước | `docs/05_project_management/` |

---

## 3. Quy Tắc Hoạt Động Cho Từng Agent

### 3.1. BA Agent (Business Analyst)
- Thu thập đầy đủ bối cảnh khi nhận yêu cầu bằng lời/chat. Đặt câu hỏi làm rõ các điểm mơ hồ (ambiguities).
- Khảo sát các hệ thống ERP hàng đầu (Odoo, ERPNext, SAP Business One, Salesforce...) xem họ giải quyết bài toán đó như thế nào.
- Soạn tài liệu xác nhận tóm tắt: Mục tiêu, Phạm vi trong/ngoài (In-scope / Out-of-scope), Luồng nghiệp vụ chính, và Tiêu chí nghiệm thu (Acceptance Criteria).
- **Điều kiện hoàn thành**: Phải có sự đồng thuận/xác nhận rõ ràng từ khách hàng.

### 3.2. Solution Architect Agent (SA / Tech Lead)
- Nghiên cứu công nghệ, thư viện, mô hình dữ liệu tối ưu nhất cho bài toán.
- Thiết kế chi tiết đến từng trường dữ liệu (DB schema/ERD), từng endpoint (Request/Response API Spec), luồng dữ liệu (Data Flow / Sequence Diagram) và cấu trúc component UI.
- Không để tồn tại các giả định ngầm (implicit assumptions) chưa được làm rõ trong tài liệu thiết kế.
- **Điều kiện hoàn thành**: Tài liệu thiết kế trong `docs/03_designs/` hoàn chỉnh để Developer chỉ cần đọc là code được ngay mà không cần đoán.

### 3.3. Developer Agent (Dev)
- Tuân thủ 100% tài liệu thiết kế trong `docs/03_designs/`.
- Nếu phát hiện vấn đề kỹ thuật phát sinh hoặc cần thay đổi CSDL/API, KHÔNG tự ý thay đổi mã nguồn mà phải chuyển ngược lại cho Solution Architect cập nhật tài liệu thiết kế trước.
- Viết code có cấu trúc rõ ràng, kèm comment và self-documenting.

### 3.4. QA/QC Agent (Tester)
- Xây dựng Test Plan và Test Cases dựa trên Acceptance Criteria từ bước BA và API/UI Spec từ bước Architect.
- Thực hiện kiểm thử toàn diện: Unit Test, Integration Test, Functional Test, Edge Cases.
- Nếu phát hiện lỗi (Bug), ghi nhận bug report cụ thể và chuyển lại cho Developer Agent xử lý.

### 3.5. PM Agent (Project Manager)
- Sau mỗi công đoạn hoặc mỗi tính năng hoàn thành, cập nhật ngay `docs/05_project_management/task_board.md`, `work_log.md` và `changelog.md`.
- Đảm bảo tính minh bạch, ghi rõ ai làm gì, trạng thái ra sao, liên kết đến tài liệu liên quan.

---

## 4. Quy Tắc Agile Sprints, Quản Lý Dạng File & Điều Kiện Đóng Sprint

### 4.1. Chu Kỳ Phát Triển Theo Sprint
- Dự án được phân rã thành các chu kỳ Sprint nhỏ (từ 1 đến 2 tuần hoặc theo từng cụm tính năng hoàn chỉnh).
- Mỗi Sprint phải có file kế hoạch `sprint_plan.md` xác định rõ mục tiêu Sprint (Sprint Goal), danh sách items cam kết thực hiện và thời hạn.

### 4.2. Quản Lý Mọi Yêu Cầu, Lỗi & Công Việc Dưới Dạng File (File-based Item Tracking)
- Trong quá trình phát triển ở bất kỳ bước nào (BA, Design, Coding, QA), các Agent **bắt buộc phải chủ động tạo file riêng** cho mọi công việc phát sinh, lưu tại `docs/05_project_management/sprints/sprint_XX/items/`:
  - **Task kỹ thuật**: `TASK-xxx_<tên>.md`
  - **Bug / Lỗi**: `BUG-xxx_<tên>.md`
  - **Feature bổ sung**: `FEAT-xxx_<tên>.md`
  - **Refactor / Tối ưu mã nguồn**: `REFACTOR-xxx_<tên>.md`
- **Quy tắc bắt buộc đối với mỗi file Item**:
  - Phải có mã định danh duy nhất (ID).
  - Phải xác định rõ mức độ ưu tiên: `Critical`, `High`, `Medium`, hoặc `Low`.
  - Phải gán người phụ trách (Assignee) và tài liệu thiết kế/nghiệp vụ liên quan.
  - Phải quản lý trạng thái vòng đời: `To Do` $\rightarrow$ `In Progress` $\rightarrow$ `In Review / Testing` $\rightarrow$ `Done`.

### 4.3. Ràng Buộc Nghiêm Ngặt Khi Đóng Sprint (Sprint Closure DoD Gate)
> **ĐIỀU KIỆN ĐÓNG SPRINT BẮT BUỘC**:
> Một Sprint **CHỈ ĐƯỢC PHÉP ĐÓNG** khi:
> 1. **KHÔNG CÒN BẤT KỲ task, bug, feature, refactor nào ở mức độ ưu tiên LỚN HƠN MEDIUM (`Critical`, `High`) chưa hoàn thành**. 100% item ở mức `Critical` và `High` phải ở trạng thái `Done` và được QA kiểm thử đạt chuẩn.
> 2. Các item ở mức `Medium` hoặc `Low` nếu chưa kịp hoàn thành trong Sprint hiện tại thì phải được ghi nhận rõ ràng lý do và chuyển giao (rollover) sang backlog của Sprint tiếp theo.
> 3. Phải lập biên bản tổng kết Sprint tại `docs/05_project_management/sprints/sprint_XX/sprint_review.md` xác nhận hoàn thành trước khi bắt đầu Sprint mới.

