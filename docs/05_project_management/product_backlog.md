# Danh sách Product Backlog & Câu chuyện người dùng (Product Backlog & User Stories)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Bảng Product Backlog mẫu (Đại diện các Epic chính)

| ID | Epic | Feature | User Story | Priority | Business Value | Complexity (SP) | Dependencies | Suggested Sprint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-001** | Hệ thống lõi | Đăng ký Tenant | Đăng ký doanh nghiệp và kích hoạt Workspace. | P0 | High | 5 | None | Sprint 1 |
| **US-002** | Hệ thống lõi | Authentication | Đăng nhập tài khoản bằng email & mật khẩu. | P0 | High | 3 | US-001 | Sprint 1 |
| **US-003** | Quy trình duyệt | Cấu hình luồng | Thiết lập quy trình phê duyệt động. | P0 | High | 8 | US-002 | Sprint 2 |
| **US-004** | Công việc | Giao việc | Tạo mới và giao công việc cho nhân sự. | P0 | High | 5 | US-002 | Sprint 3 |
| **US-005** | Công việc | Kanban board | Theo dõi trạng thái công việc dạng Kanban. | P0 | Medium | 5 | US-004 | Sprint 3 |
| **US-006** | CRM / Sales | Quản lý Lead | Tiếp nhận và cập nhật trạng thái Lead. | P0 | High | 5 | US-002 | Sprint 4 |
| **US-007** | CRM / Sales | Báo giá | Tạo và xuất file PDF báo giá khách hàng. | P0 | Medium | 8 | US-006 | Sprint 4 |
| **US-008** | HRM | Chấm công | Đăng ký check-in/out hằng ngày trên hệ thống. | P0 | High | 5 | US-002 | Sprint 5 |
| **US-009** | Kế toán nội bộ| Phiếu chi tiền | Lập phiếu chi tiền mặt từ đề xuất thanh toán. | P1 | High | 5 | US-003 | Sprint 7 |
| **US-010** | Mua hàng | Tạo PO | Lập đơn mua hàng (PO) gửi nhà cung cấp. | P1 | Medium | 8 | US-009 | Sprint 8 |
| **US-011** | Kho vật tư | Nhập kho | Lập phiếu nhập kho dựa trên PO đã duyệt. | P1 | Medium | 5 | US-010 | Sprint 9 |
| **US-012** | Văn bản | Trình ký | Trình ký văn bản đi nội bộ. | P1 | High | 8 | US-003 | Sprint 10 |

---

### 2. Chi tiết đặc tả các Câu chuyện người dùng (User Stories Detail)

#### [US-001] Đăng ký doanh nghiệp & Kích hoạt Tenant
* **Đặc tả:**
  Là một Chủ doanh nghiệp mới,  
  Tôi muốn đăng ký tài khoản doanh nghiệp trực tuyến và khởi tạo workspace riêng của tôi,  
  Để tôi có thể bắt đầu cấu hình cơ cấu tổ chức và mời nhân viên làm việc.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Hệ thống kiểm tra tính hợp lệ của Subdomain (chỉ chữ và số, không khoảng trắng, không trùng lặp).
  - Sau khi đăng ký thành công, hệ thống tự động chạy script seed dữ liệu mẫu (các vai trò mặc định, phòng ban nháp).
  - Gửi email kích hoạt tài khoản kèm token có hiệu lực trong 24 giờ.

#### [US-003] Thiết lập quy trình phê duyệt động (Approval Workflow Configuration)
* **Đặc tả:**
  Là một Quản trị viên doanh nghiệp (Tenant Admin),  
  Tôi muốn cấu hình các bước phê duyệt và người phê duyệt tương ứng cho từng loại chứng từ,  
  Để các đề xuất của nhân viên tự động chuyển đúng cấp có thẩm quyền phê duyệt.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Cho phép cấu hình tối đa 5 cấp phê duyệt.
  - Mỗi cấp duyệt hỗ trợ chọn duyệt theo Vai trò (e.g. Trưởng phòng) hoặc chọn trực tiếp một User cụ thể.
  - Cho phép chọn chế độ duyệt: Duyệt tuần tự (lần lượt từng người) hoặc Duyệt song song (chỉ cần một trong các người duyệt đồng ý).

#### [US-004] Tạo và giao công việc (Task Assignment)
* **Đặc tả:**
  Là một Quản lý phòng ban,  
  Tôi muốn tạo công việc mới, gán cho nhân viên và thiết lập deadline rõ ràng,  
  Để nhân viên biết nhiệm vụ cần làm và tôi có thể theo dõi tiến độ thực hiện.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Cho phép đính kèm tệp tin tài liệu dưới 10MB vào công việc.
  - Trường "Hạn hoàn thành" (Due date) bắt buộc phải lớn hơn thời gian hiện tại.
  - Hệ thống tự động tạo một hoạt động lịch sử: `[Người giao] đã tạo công việc và gán cho [Người nhận]`.

#### [US-008] Chấm công trực tuyến (Self-Service Timekeeping)
* **Đặc tả:**
  Là một Nhân viên văn phòng,  
  Tôi muốn thực hiện check-in và check-out trực tiếp trên trình duyệt hoặc điện thoại di động,  
  Để ghi nhận ngày công làm việc của tôi chính xác trong hệ thống.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Ghi nhận thời gian check-in/out thực tế theo múi giờ máy chủ và so sánh với ca làm việc được cấu hình để xác định đi trễ/về sớm.
  - Hỗ trợ lưu trữ thông tin địa chỉ IP mạng nội bộ của văn phòng để xác thực nhân viên chấm công tại đúng công ty (IP Whitelisting).

#### [US-009] Ghi nhận phiếu chi tiền tự động
* **Đặc tả:**
  Là một Nhân viên kế toán nội bộ,  
  Tôi muốn hệ thống tự động tạo một bản ghi Phiếu chi nháp ngay khi có Đề xuất thanh toán được duyệt hoàn thành,  
  Để tôi đối soát chứng từ và thực hiện chi tiền nhanh chóng mà không cần nhập lại thông tin.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Phiếu chi nháp tự động kế thừa các thông tin: Người nhận tiền, Số tiền chi, Nội dung thanh toán và Mã đề xuất tham chiếu.
  - Kế toán có quyền sửa lại tài khoản nguồn (Tiền mặt/Ngân hàng) trước khi bấm "Xác nhận đã chi".
