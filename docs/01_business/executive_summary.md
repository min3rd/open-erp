# Báo cáo tóm tắt dự án (Executive Summary)

## Hệ thống quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Bối cảnh dự án (Context)

Trong kỷ nguyên chuyển đổi số, các doanh nghiệp vừa và nhỏ (SMEs) tại Việt Nam và khu vực đang đối mặt với làn sóng cạnh tranh khốc liệt. Để tối ưu hóa nguồn lực và tăng tốc độ ra quyết định, việc số hóa quy trình vận hành là yêu cầu bắt buộc. Tuy nhiên, phần lớn doanh nghiệp hiện nay đang vận hành một cách rời rạc thông qua các công cụ truyền thống hoặc nhiều phần mềm đơn lẻ không đồng bộ.

Dự án này được thiết lập nhằm xây dựng một giải pháp **All-in-one Business Management SaaS** - một nền tảng quản trị doanh nghiệp tổng thể, vận hành trên mô hình điện toán đám mây đa khách thuê (Multi-tenant SaaS). Nền tảng cho phép doanh nghiệp đăng ký tài khoản, thiết lập cơ cấu tổ chức tức thì, mời nhân viên tham gia và sử dụng các phân hệ nghiệp vụ tích hợp để quản lý toàn diện các hoạt động vận hành hằng ngày trên cùng một hệ thống.

---

### 2. Vấn đề của doanh nghiệp hiện tại (Problem Statement)

- **Dữ liệu phân mảnh (Siloed Data):** Thông tin khách hàng nằm ở CRM/Excel của Sales, dữ liệu tài chính nằm ở bộ phận kế toán, tiến độ dự án nằm ở Zalo/Viber, và hồ sơ nhân sự nằm ở file cứng. Thiếu sự kết nối thời gian thực dẫn đến báo cáo chậm trễ và sai lệch.
- **Chi phí tích hợp cao:** Doanh nghiệp phải mua nhiều phần mềm từ các nhà cung cấp khác nhau (CRM, HRM, Công việc, Kho, Kế toán). Chi phí mua bản quyền và chi phí tích hợp API giữa các hệ thống này rất lớn và phức tạp.
- **Quy trình thủ công & Giấy tờ:** Đề xuất phê duyệt (nghỉ phép, thanh toán, mua sắm) phải ký tay hoặc duyệt qua email/tin nhắn không chính thức, dẫn đến thất lạc, chậm trễ trong luồng vận hành.
- **Phụ thuộc vào cá nhân:** Thiếu quy trình chuẩn hóa khiến công việc bị trì trệ khi có nhân sự nghỉ việc đột xuất hoặc thay đổi vai trò.
- **Khó khăn trong việc quản trị của lãnh đạo:** CEO/Ban giám đốc không có một màn hình dashboard tổng quan (Single Source of Truth) để đánh giá sức khỏe doanh nghiệp theo thời gian thực.

---

### 3. Giải pháp đề xuất (Proposed Solution)

Xây dựng một nền tảng **All-in-one Enterprise SaaS** cung cấp một hệ sinh thái các phân hệ nghiệp vụ tích hợp chặt chẽ:

- **Hệ thống lõi Multi-tenant:** Đăng ký và thiết lập không gian làm việc (workspace) riêng cho doanh nghiệp trong vài phút với tên miền con dạng `open-erp.9ms.io.vn`.
- **Cơ cấu tổ chức linh hoạt:** Quản lý đa chi nhánh, phòng ban, chức vụ, cấp bậc và phân quyền chi tiết (RBAC).
- **Các phân hệ nghiệp vụ đồng bộ:**
  - **Nhóm Khách hàng & Thị trường:** Sales/CRM, Marketing, Chăm sóc khách hàng (Customer Service).
  - **Nhóm Vận hành nội bộ:** Công việc (Task), Dự án (Project), Điều hành & Văn bản (Document), Quy trình phê duyệt (Approval Workflow).
  - **Nhóm Quản trị nguồn nhân lực:** Nhân sự (HRM), Tuyển dụng (Recruitment), Tiện ích nhân viên (Employee Self-Service).
  - **Nhóm Tài chính & Chuỗi cung ứng:** Kế toán nội bộ, Mua hàng (Procurement), Kho & Vật tư, Tài sản (Asset).
  - **Nhóm Ra quyết định:** Báo cáo, Phân tích dữ liệu & Dashboard điều hành.

---

### 4. Giá trị mang lại (Value Proposition)

- **Đối với Chủ doanh nghiệp (CEO):** Ra quyết định dựa trên dữ liệu thực tế (Data-driven decision) nhờ hệ thống dashboard trực quan cập nhật thời gian thực về dòng tiền, doanh số, hiệu suất nhân sự và tiến độ dự án.
- **Đối với Quản lý cấp trung:** Giao việc rõ ràng, đo lường KPI chính xác, phê duyệt nhanh chóng ngay trên ứng dụng di động/web, giảm thiểu rủi ro chậm tiến độ.
- **Đối với Nhân viên:** Tự phục vụ (Self-service) từ việc xin nghỉ phép, tạm ứng, đề xuất mua sắm đến cập nhật tiến độ công việc một cách tự động, tiết kiệm thời gian hành chính.
- **Đối với SaaS Platform Provider:** Mô hình kinh doanh bền vững thông qua phí đăng ký định kỳ (Subscription) linh hoạt theo số người dùng (users) và dung lượng lưu trữ (storage).

---

### 5. Đối tượng sử dụng chính (Target Personas)

Hệ thống được thiết kế hướng tới 8 nhóm đối tượng người dùng chính được phân tích chi tiết trong các tài liệu nghiệp vụ tiếp theo:

1. **Chủ doanh nghiệp / CEO / Ban lãnh đạo:** Cần dashboard tổng quan và ra quyết định.
2. **Quản trị viên doanh nghiệp (Tenant Admin):** Cấu hình hệ thống, phòng ban, phân quyền và quy trình.
3. **Nhân viên kinh doanh (Sales):** Quản lý lead, khách hàng, tạo báo giá và hợp đồng.
4. **Nhân viên kế toán / tài chính nội bộ:** Quản lý thu chi, công nợ, quỹ tiền, phê duyệt thanh toán.
5. **Nhân sự / HR:** Quản lý hồ sơ, chấm công, nghỉ phép, tính lương, tuyển dụng.
6. **Quản lý phòng ban (Managers):** Giao việc, duyệt đề xuất, theo dõi KPI nhóm.
7. **Nhân viên thông thường (Employees):** Thực hiện công việc, gửi đề xuất tự phục vụ.
8. **Super Admin của nền tảng SaaS:** Quản lý tenants, gói cước dịch vụ và giám sát hệ thống.

---

### 6. Phạm vi sản phẩm & Lộ trình phát triển (Product Scope & Roadmap)

Hệ thống được chia làm hai giai đoạn phát triển lớn nhằm tối ưu hóa thời gian đưa sản phẩm ra thị trường (Time-to-Market):

#### 6.1 Giai đoạn MVP (Minimum Viable Product - Sprint 1 đến 6)

Tập trung xây dựng khung kiến trúc SaaS lõi và các tính năng vận hành tối thiểu:

- **Hạ tầng Multi-tenant:** Authentication, Authorization (RBAC), Tenant provisioning, Core Settings.
- **Tiện ích cốt lõi:** Quản trị doanh nghiệp (phòng ban, chức vụ, nhân viên), Workspace.
- **Quy trình phê duyệt & Tiện ích nội bộ:** Đơn xin nghỉ phép, Tạm ứng, Thanh toán cơ bản.
- **Quản lý công việc & Dự án:** Kanban board, Checklist, Gán việc, Milestone.
- **Sales/CRM cơ bản:** Quản lý lead, Khách hàng, Cơ hội, Pipeline bán hàng.
- **HRM cơ bản:** Hồ sơ nhân sự, Hợp đồng lao động, Chấm công đơn giản.
- **Báo cáo cơ bản:** Dashboard tổng quan, báo cáo doanh số và tiến độ công việc.

#### 6.2 Giai đoạn mở rộng nâng cao (Post-MVP - Sprint 7 đến 12)

Hoàn thiện toàn bộ hệ sinh thái quản trị doanh nghiệp tổng thể:

- **Tài chính - Kế toán nội bộ:** Thu chi, Sổ quỹ, Công nợ nhà cung cấp/khách hàng, Liên kết đề xuất thanh toán.
- **Mua hàng & Kho:** Đề nghị mua sắm, Đơn mua hàng (PO), Quản lý nhà cung cấp, Nhập/Xuất kho, Kiểm kê tồn kho.
- **Quản lý tài sản:** Danh mục tài sản, Bàn giao, Thu hồi, Bảo trì, Sửa chữa, Khấu hao nội bộ.
- **Quản lý văn bản:** Văn thư đi/đến, Số hóa tài liệu, Lưu trữ phân quyền, Trình ký nội bộ.
- **Chăm sóc khách hàng:** Ticket hỗ trợ, Thiết lập SLA, Đánh giá dịch vụ.
- **Marketing:** Quản lý chiến dịch, Đo lường nguồn lead, Form thu thập dữ liệu tự động, Phân bổ lead.
- **Hệ thống báo cáo nâng cao:** Dashboard CEO chuyên sâu, dự báo dòng tiền, phân tích ROI chiến dịch, Cảnh báo chỉ số bất thường.
