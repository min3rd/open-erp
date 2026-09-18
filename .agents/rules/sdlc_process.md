# Quy Trình SDLC Chuẩn Mực & Bản Đồ Quy Tắc Multi-Agent (Master Index)

Dự án này áp dụng mô hình **Multi-Agent hướng tài liệu (Docs-driven SDLC)** với 9 bước chuẩn mực đóng gói theo từng Sprint.

Hệ thống quy tắc đã được phân rã thành các file chuyên biệt theo từng vai trò Agent và lĩnh vực kỹ thuật trong `.agents/rules/`:

## 1. Bản Đồ Quy Tắc Chuyên Biệt (Modular Rules Map)

| File Quy Tắc | Phạm Vi Áp Dụng | Nội Dung Trọng Tâm |
| :--- | :--- | :--- |
| [core_sdlc.md](core_sdlc.md) | **Toàn bộ Agent** | 3 nguyên tắc bất di bất dịch, mô hình Sprint-Pack (00-09), file-based item tracking, điều kiện đóng Sprint (DoD Gate). |
| [agent_ba.md](agent_ba.md) | **BA Agent** | Ghi chép yêu cầu thô (01), Phân tích User Story (02), Benchmarks Odoo/ERPNext (03), Chốt Confirmation Gate (04). |
| [agent_architect.md](agent_architect.md) | **Solution Architect** | Nghiên cứu giải pháp (05), Thiết kế chi tiết DB/API/UI (06), Core minimal invariant, Tenant data isolation, Plugin architecture. |
| [agent_developer.md](agent_developer.md) | **Developer Agent** | Lập trình Quarkus Java & Angular 22 / Ionic 8 (07), No H2 policy, Config-driven URL, Type-safe Enums, Zero .spec.ts frontend. |
| [agent_qa.md](agent_qa.md) | **QA/QC Agent** | Lập Test Plan (08), Test Backend trên PostgreSQL/Redis thật, Kiểm thử thủ công trên trình duyệt (Browser Manual Testing), Bug report. |
| [agent_pm.md](agent_pm.md) | **PM Agent** | Khởi tạo Sprint (00), Quản lý Task Board, Kiểm tra DoD Gate, Nghiệm thu đóng Sprint (09). |
| [ui_ux_standards.md](ui_ux_standards.md) | **Architect & Dev** | Mật độ thông tin cao (High density), góc sắc nét vuông vắn (Sharp), triết lý Anti-Modal (Drawer xếp tầng, Split-screen). |
| [api_standards.md](api_standards.md) | **Architect, Dev, QA** | Code-driven i18n (`code` UPPER_SNAKE_CASE), Khung phản hồi chuẩn, Chuẩn hóa `ResponseKey` enum. |

---

## 2. Quy Trình 9 Bước Tuần Tự Trong Sprint-Pack
Mỗi Sprint được đóng gói trọn gói trong `docs/sprints/sprint_XX_<tên_sprint>/`:
- **00. Bản đồ đọc & Xác nhận** (`00_READING_GUIDE.md`) - Cổng giao tiếp bắt đầu duy nhất cho Khách hàng & Reviewer
- **01. Nhận yêu cầu truyền miệng** (`01_raw_notes/`) - Phụ trách: BA Agent
- **02. Phân tích yêu cầu** (`02_analysis/`) - Phụ trách: BA Agent
- **03. Tham khảo phần mềm tương tự** (`03_benchmarks/`) - Phụ trách: BA Agent
- **04. Xác nhận với khách hàng** (`04_confirmation/`) - Phụ trách: BA Agent & Khách hàng ký duyệt (Confirmation Gate)
- **05. Nghiên cứu giải pháp** (`05_solutions/`) - Phụ trách: Solution Architect
- **06. Thiết kế giải pháp chi tiết** (`06_designs/`) - Phụ trách: Solution Architect (DB, API, UI)
- **07. Phân rã nhiệm vụ & Lập trình** (`07_items/` & `src/`) - Phụ trách: Developer Agent
- **08. Kiểm thử** (`08_testing/`) - Phụ trách: QA/QC Agent
- **09. Nghiệm thu & Đóng Sprint** (`09_review/`) - Phụ trách: PM Agent

---

## 3. Danh Mục Các Điều Nghiêm Cấm Tuyệt Đối (Immutable Prohibitions)
1. Nhảy cóc trực tiếp sang bước Lập trình khi chưa có xác nhận từ khách hàng và tài liệu thiết kế chi tiết trong thư mục `docs/`.
2. Đóng Sprint hoặc bàn giao release khi vẫn còn tồn đọng task/bug ở mức `Critical` hoặc `High`.
3. Đưa mã nguồn nghiệp vụ chuyên biệt vào tầng Core hoặc viết câu truy vấn thiếu ngữ cảnh `tenant_id`.
4. Cài đặt/Nâng cấp/Gỡ bỏ Plugin làm phá vỡ cấu trúc CSDL hoặc làm mất dữ liệu của Tenant mà không qua Migration/Backup an toàn.
5. Viết UI component ad-hoc rải rác bên ngoài thư viện giao diện dùng chung hoặc tự ý cài đặt thư viện UI bên thứ 3.
6. Khai báo Entity CSDL trong Plugin mà không đăng ký vào Entity Registry chung của hệ thống.
7. Bàn giao tính năng hoặc đóng Sprint mà thiếu tài liệu hướng dẫn sử dụng (kèm hình ảnh minh họa) hoặc thiếu tài liệu triển khai liên quan.
8. Tự ý khởi chạy toàn bộ các dịch vụ phụ trợ nặng (Kafka, MongoDB, Read-Replica, MinIO) làm cạn kiệt tài nguyên máy dev khi chỉ thực hiện các tác vụ phát triển cơ bản.
9. Viết unit test cho Frontend (Angular/Ionic) làm lãng phí thời gian hoặc tự ý thêm thư viện kiểm thử frontend.
10. Lạm dụng pop-up Modal để hiển thị chi tiết hoặc biểu mẫu nhập liệu khi có thể sử dụng Drawer trượt, chia màn hình (Split-View) hoặc Router con.
11. Thiết kế hoặc trả về API response chứa message văn bản cứng đại diện cho kết quả nghiệp vụ mà không có mã định danh `code` chuẩn hóa cho Frontend đa ngôn ngữ.
12. Lưu trữ tài liệu Sprint rải rác ngoài thư mục Sprint-Pack (`docs/sprints/sprint_XX/`) hoặc thiếu file điều hướng `00_READING_GUIDE.md` dẫn đến việc người đọc không biết thứ tự tuần tự và bỏ sót bước xác nhận của khách hàng.
13. Sử dụng CSDL H2 hoặc các in-memory mock DB để kiểm thử backend thay vì kết nối trực tiếp PostgreSQL và Redis thật của môi trường dev.
14. Viết inline template HTML trong file component `.ts` của Frontend hoặc hardcode văn bản tĩnh mà không qua hệ thống đa ngôn ngữ i18n.
15. Sử dụng chuỗi tự do (string literal) cho các thuộc tính style, option, status, role thay vì khai báo và sử dụng Enum chuẩn hóa.
16. Đặt mã nguồn UI component dùng chung vào bên trong riêng thư mục Web hoặc Mobile làm mất khả năng tái sử dụng giữa hai nền tảng.
17. Hardcode URL frontend hoặc đường dẫn liên kết trong mã nguồn Backend thay vì nạp qua cấu hình Quarkus `@ConfigProperty`.
18. Tạo enum style/variant riêng biệt phân mảnh cho từng component thay vì dùng chung bộ Design Token Enums (`ColorVariant`, `SizeVariant`).
19. Viết trực tiếp mã markup lặp lại cho các thành phần giao diện dùng chung thay vì đóng gói component dùng chung.
20. Hardcode các chuỗi string literals cho response data keys thay vì sử dụng Java/TypeScript enum `ResponseKey`.
21. Viết service backend trả về Map<String, Object> tự do cho dữ liệu nghiệp vụ thay vì định nghĩa class DTO cố định.
