# Tài liệu đặc tả yêu cầu người dùng (User Requirement Specification - URS)

## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Tổng quan yêu cầu người dùng

Tài liệu này chi tiết hóa các nhu cầu, quy trình nghiệp vụ, danh sách màn hình, trường dữ liệu chính, quy tắc xử lý và câu chuyện người dùng (User Stories) của tất cả 16 phân hệ trong hệ thống.

---

### 2. Chi tiết yêu cầu & Đặc tả nghiệp vụ các phân hệ

#### 2.1 Phân hệ Quản trị doanh nghiệp (Tenant Settings & Org Structure)

- **Mục tiêu:** Cho phép mỗi doanh nghiệp tự thiết lập cơ cấu tổ chức, mời nhân sự, phân quyền và cấu hình hệ thống.
- **Luồng nghiệp vụ cốt lõi:**
  1. Đăng ký doanh nghiệp -> Khởi tạo tenant subdomain (ví dụ: `open-erp.9ms.io.vn`).
  2. Tạo chi nhánh -> Thiết lập sơ đồ phòng ban phân cấp -> Định nghĩa các chức vụ & cấp bậc.
  3. Mời nhân sự qua email -> Gửi link kích hoạt -> Nhân viên đăng nhập & điền profile.
  4. Gán vai trò (Roles) và quyền (Permissions) tương ứng cho nhân sự.
- **Danh sách màn hình cần có:**
  - _Màn hình Đăng ký/Đăng nhập Tenant:_ Đăng ký tài khoản doanh nghiệp.
  - _Màn hình Cấu hình thông tin doanh nghiệp:_ Logo, tên công ty, số điện thoại, MST, địa chỉ.
  - _Màn hình Quản lý chi nhánh:_ Danh sách, Thêm mới, Sửa chi nhánh.
  - _Màn hình Quản lý sơ đồ tổ chức & Phòng ban:_ Giao diện dạng sơ đồ cây phân cấp.
  - _Màn hình Quản lý người dùng:_ Danh sách nhân viên, nút mời qua email, thay đổi trạng thái (Kích hoạt, Tạm khóa, Ngừng hoạt động).
  - _Màn hình Quản lý nhóm quyền (Role Builder):_ Bảng phân quyền thao tác (Xem, Thêm, Sửa, Xóa, Xuất) trên từng module.
  - _Màn hình Cấu hình tham số:_ Thiết lập số chứng từ tự động, cấu hình thông báo.
  - _Màn hình Nhật ký hoạt động (Audit log):_ Xem log thay đổi hệ thống của người dùng.
- **Trường dữ liệu chính:**
  - _Tenant:_ `id` (UUID), `name`, `subdomain`, `tax_code`, `status`, `address`.
  - _User:_ `id` (UUID), `email`, `password_hash`, `status` (Active, Suspended, Invited), `created_at`.
  - _Department:_ `id` (UUID), `name`, `parent_id` (chỉ ra phòng ban cấp trên), `manager_id`.
- **Quy tắc xử lý (Business Rules):**
  - Tên subdomain không được trùng lặp hệ thống, không được đổi sau khi đã kích hoạt.
  - Không được xóa phòng ban khi vẫn còn người dùng hoạt động thuộc phòng ban đó.
  - Số chứng từ tự động phải tăng liên tục và không được trùng lặp.
- **User Stories & Acceptance Criteria:**
  - **[US-ADM-001] Đăng ký doanh nghiệp và kích hoạt Workspace:**
    - _Định dạng:_ Là một Chủ doanh nghiệp mới, tôi muốn đăng ký tài khoản trực tuyến để khởi tạo workspace quản trị riêng.
    - _Acceptance Criteria:_
      - **Kịch bản 1:** Subdomain hợp lệ và chưa tồn tại -> Tạo tenant thành công, gửi link kích hoạt đến email.
      - **Kịch bản 2:** Subdomain đã trùng hoặc chứa ký tự đặc biệt -> Báo lỗi và không lưu dữ liệu.
  - **[US-ADM-002] Mời nhân viên qua email:**
    - _Định dạng:_ Là một Tenant Admin, tôi muốn mời nhân sự mới tham gia hệ thống qua email để tự động cấp tài khoản cho họ.
    - _Acceptance Criteria:_
      - Gửi email kèm link kích hoạt có token hết hạn sau 24 giờ. Bản ghi người dùng ở trạng thái "Chờ kích hoạt". Khi người dùng nhấp link và nhập mật khẩu -> Chuyển sang "Hoạt động".

---

#### 2.2 Phân hệ Sales / CRM

- **Mục tiêu:** Quản lý toàn bộ phễu bán hàng từ Lead, Khách hàng, Cơ hội, Báo giá đến Hợp đồng và Doanh số.
- **Quy trình nghiệp vụ cốt lõi:**
  - _Quy trình từ Lead đến Khách hàng:_
    ```
    [ Lead Mới ] ──► [ Đánh giá/Tương tác ] ──► [ Xác nhận Nhu cầu ] ──► [ Chuyển đổi thành Khách hàng ]
    ```
  - _Quy trình từ Cơ hội đến Đơn hàng / Hợp đồng:_
    ```
    [ Cơ hội ] ──► [ Giai đoạn Pipeline ] ──► [ Tạo Báo giá ] ──► [ Duyệt ] ──► [ Tạo Hợp đồng / PO ] ──► [ Won ]
    ```
- **Các vai trò liên quan:** Sales Executive (Nhân viên kinh doanh), Sales Manager (Quản lý kinh doanh), Accountant (Kế toán), Customer (Khách hàng).
- **Danh sách màn hình cần có:**
  - _Màn hình danh sách Leads:_ Quản lý thông tin liên hệ, nguồn lead, người gán phụ trách.
  - _Màn hình Kanban cơ hội (Pipeline):_ Quản lý cơ hội qua các giai đoạn (Lead mới, Đang liên hệ, Đang tư vấn, Đã gửi báo giá, Đang đàm phán, Chốt thành công, Thất bại).
  - _Màn hình tạo Báo giá:_ Form thêm sản phẩm, tính toán chiết khấu, thuế VAT, in PDF.
  - _Màn hình Quản lý Hợp đồng:_ Số hợp đồng, giá trị, thời hạn, tệp scan đính kèm.
- **Trường dữ liệu chính:**
  - _Lead:_ `id`, `name`, `company`, `phone`, `email`, `lead_source` (Website, Ads, Zalo...), `status`.
  - _Opportunity:_ `id`, `name`, `expected_revenue`, `probability`, `stage_id`, `lost_reason` (bắt buộc nhập khi chuyển trạng thái "Thất bại").
  - _Quote:_ `id`, `opportunity_id`, `total_amount`, `discount_rate`, `tax_rate`, `status` (Draft, Approved, Rejected).
- **Quy tắc xử lý (Business Rules):**
  - Mỗi khách hàng/lead chỉ thuộc quyền quản lý của duy nhất 1 sales tại 1 thời điểm (Owner).
  - Báo giá có chiết khấu $\ge 15\%$ phải qua Trưởng phòng Sales phê duyệt mới được gửi cho khách hàng.
- **Báo cáo cần có:**
  - Báo cáo tỷ lệ chuyển đổi qua các bước của Pipeline.
  - Báo cáo doanh số bán hàng của từng nhân sự kinh doanh.
  - Báo cáo lý do thất bại của các cơ hội bán hàng.
- **Liên kết dữ liệu:**
  - _Kế toán:_ Khi Hợp đồng ký kết (Won), thông tin doanh thu dự kiến và thông tin thanh toán được đẩy sang Kế toán để tự động tạo công nợ phải thu.
  - _Chăm sóc khách hàng:_ Lịch sử Ticket hỗ trợ được liên kết trực tiếp vào lịch sử tương tác trên màn hình chi tiết Khách hàng.
- **User Stories & Acceptance Criteria:**
  - **[US-CRM-001] Chuyển đổi Lead thành Cơ hội:**
    - _Định dạng:_ Là một Nhân viên kinh doanh, tôi muốn chuyển đổi lead có nhu cầu thực tế thành một Cơ hội bán hàng để theo dõi trên Pipeline.
    - _Acceptance Criteria:_ Hệ thống tự động tạo bản ghi Khách hàng (doanh nghiệp/cá nhân) và bản ghi Cơ hội tương ứng, đồng thời lưu lịch sử ghi chép từ Lead sang.

---

#### 2.3 Phân hệ Marketing

- **Mục tiêu:** Quản lý chiến dịch, nguồn lead, form thu lead tự động và ngân sách marketing.
- **Chức năng chính:**
  - Quản lý chiến dịch marketing, ngân sách dự kiến và chi phí thực tế.
  - Thiết lập Form thu lead (HTML Webform nhúng) ghi nhận lead tự động qua API/Webhook.
  - Phân bổ lead tự động xoay vòng cho Sales.
- **Nguồn lead mẫu:** Website, Facebook Ads, Google Ads, Zalo, TikTok, Sự kiện, Referral, Nhập thủ công.
- **Quy tắc xử lý:**
  - Tự động phát hiện trùng lặp lead dựa trên số điện thoại hoặc email. Nếu trùng, chuyển về người đang phụ trách cũ thay vì tạo mới.

---

#### 2.4 Phân hệ Chăm sóc khách hàng (Customer Service)

- **Mục tiêu:** Quản lý yêu cầu hỗ trợ, khiếu nại, bảo hành sản phẩm.
- **Chức năng chính:**
  - Tiếp nhận và tạo Ticket hỗ trợ.
  - Gán ticket, thiết lập mức độ ưu tiên (Low, Medium, High, Urgent), cấu hình thời gian xử lý cam kết (SLA).
  - Khách hàng gửi đánh giá hài lòng (1-5 sao).
- **Trạng thái Ticket mẫu:** Mới tạo, Đang xử lý, Chờ phản hồi khách hàng, Đã xử lý, Đóng, Quá hạn.

---

#### 2.5 Phân hệ Kế toán / Tài chính nội bộ

- **Mục tiêu:** Quản lý thu chi, quỹ tiền mặt/ngân hàng, công nợ và đề nghị thanh toán nội bộ.
- **Chức năng chính:**
  - Lập Phiếu thu, Phiếu chi gắn liền với mã khoản thu/khoản chi.
  - Quản lý số dư các tài khoản ngân hàng và két tiền mặt.
  - Quản lý công nợ khách hàng (phải thu) và công nợ nhà cung cấp (phải trả).
  - Quy trình tạm ứng, hoàn ứng và đề nghị thanh toán nội bộ liên kết phê duyệt.
  - **Tương thích Hóa đơn điện tử & Thuế Việt Nam:** Hỗ trợ phát hành hóa đơn GTGT bán ra, quản lý hóa đơn đầu vào, kiểm tra XML/PDF hóa đơn và chốt kỳ kê khai thuế. Chi tiết xem tại tài liệu chuyên biệt: [vietnam_accounting_spec.md](../03_functional/vietnam_accounting_spec.md).
- **Báo cáo:** Sổ quỹ tiền mặt, Báo cáo lưu chuyển tiền tệ nội bộ, Báo cáo doanh thu - chi phí - lợi nhuận nội bộ, Bảng kê thuế GTGT đầu vào/đầu ra.

---

#### 2.6 Phân hệ Nhân sự / HRM

- **Chức năng chính:**
  - Quản lý hồ sơ nhân viên, hợp đồng lao động, lịch sử công tác.
  - Cấu hình ca làm việc, chấm công trực tuyến, đăng ký và duyệt nghỉ phép.
  - Quản lý làm thêm giờ (OT).
  - Tự động tính bảng lương hàng tháng dựa trên bảng công, phụ cấp, thưởng/phạt và xuất phiếu lương (payslip).
  - Quản lý đánh giá hiệu suất (KPI/OKR) định kỳ.

---

#### 2.7 Phân hệ Tuyển dụng

- **Chức năng chính:**
  - Lập và phê duyệt nhu cầu tuyển dụng, quản lý tin tuyển dụng.
  - Quản lý ứng viên, import CV, lên lịch phỏng vấn và gửi mail mời tự động.
  - Chuyển đổi ứng viên trúng tuyển sang nhân sự chính thức (tự động điền hồ sơ nháp trong HRM).

---

#### 2.8 Phân hệ Công việc (Task Management)

- **Chức năng chính:**
  - Tạo công việc cá nhân hoặc giao việc phòng ban/dự án.
  - Đặt deadline, mức độ ưu tiên, người thực hiện, người theo dõi, checklist công việc con.
  - Tương tác qua bình luận, đính kèm tệp tin.
  - Xem công việc dạng Kanban Board, Danh sách và Lịch biểu.
- **Trạng thái công việc mẫu:** Chưa bắt đầu, Đang thực hiện, Chờ phản hồi, Chờ duyệt, Hoàn thành, Quá hạn, Hủy.

---

#### 2.9 Phân hệ Dự án (Project Management)

- **Chức năng chính:**
  - Khởi tạo dự án, phân quyền thành viên dự án.
  - Quản lý giai đoạn dự án (Phases) và các mốc quan trọng (Milestones).
  - Theo dõi ngân sách dự án, cảnh báo rủi ro trễ hạn.

---

#### 2.10 Phân hệ Điều hành và Quản lý văn bản (Document & DMS)

- **Chức năng chính:**
  - Số hóa văn bản đi, văn bản đến, công văn nội bộ.
  - Tự động cấp số văn bản theo tiền tố/hậu tố cấu hình.
  - Quy trình trình ký văn bản, ký số/ký điện tử.
  - Lưu trữ tệp tài liệu phân quyền chi tiết (Xem/Sửa/Tải/Xóa) theo thư mục.

---

#### 2.11 Phân hệ Quy trình phê duyệt (Workflow Engine — Sprint 2)

- **Mục tiêu:** Cung cấp Workflow Engine linh hoạt hỗ trợ cấu hình động, rẽ nhánh, luồng song song (Fork/Join), đồng thuận đa dạng, nhật ký chống giả mạo (hash-chain) và tích hợp Form động / OnlyOffice / Ký số nội bộ.
- **Luồng nghiệp vụ cốt lõi:**
  1. Admin thiết kế quy trình trên Workflow Designer (Canvas) → Lưu cấu hình qua API.
  2. Nhân viên gửi đơn qua Self-service Portal (Form động) → Khởi tạo `workflow_instance`.
  3. Người duyệt xử lý trên Smart Approval Inbox → Approve/Reject/Consult/Ký số.
  4. Hệ thống ghi `workflow_logs` hash-chain, gửi thông báo đa kênh, nhắc deadline.
- **Danh sách màn hình cần có:**
  - _Workflow Designer (Web Admin):_ Canvas vẽ node Start/Step/Decision/Fork/Join/End, cấu hình consensus, assignee, form binding.
  - _Smart Approval Inbox (Web):_ Danh sách đơn cần duyệt, chi tiết form động, OnlyOffice preview, timeline log, nút ký số.
  - _Self-service Portal (Web/Mobile):_ Chọn loại đơn, điền form động, theo dõi trạng thái.
- **Quy tắc nghiệp vụ (Business Rules):**
  - Consensus `ALL`: mọi approver phải APPROVE; một REJECT dừng luồng.
  - Consensus `ANY`: một APPROVE đủ chuyển bước.
  - Consensus `PERCENTAGE`: đạt ngưỡng % approver APPROVE mới chuyển bước.
  - Fork/Join: Join chờ đủ nhánh theo `joinRules` trước khi tiếp tục.
  - `workflow_logs` dùng SHA-256 hash-chain; sửa log phải bị phát hiện qua API verify.
  - Deadline bước duyệt: quá hạn gửi email + in-app reminder qua BullMQ.
- **User Stories & Acceptance Criteria:**
  - **[US-WF-001] Cấu hình quy trình rẽ nhánh:**
    - _Định dạng:_ Là Tenant Admin, tôi muốn tạo quy trình có Fork/Join và điều kiện rẽ nhánh để xử lý đơn phức tạp.
    - _AC:_ POST workflow với FORK/JOIN thành công; consensus ALL/ANY/PERCENTAGE hoạt động đúng runtime.
  - **[US-WF-002] Thiết kế quy trình trên Canvas (Workflow Designer):**
    - _AC:_ Kéo thả node, nối edge, auto-layout; lưu/load workflow qua API; Rose Gold + Dark/Light + i18n.
  - **[US-WF-003] Hộp thư phê duyệt thông minh:**
    - _AC:_ Hiển thị form động, timeline log verify PASS, OnlyOffice embed, deadline badge, Approve/Reject/Consult.
  - **[US-WF-004] Khởi chạy và xử lý instance:**
    - _AC:_ POST instance khởi tạo approvers đúng; executeAction APPROVE/REJECT/CONSULT chuyển bước đúng logic.
- **Đối tượng phê duyệt:** Nghỉ phép, Tạm ứng, Thanh toán, Mua hàng, Báo giá, Hợp đồng, Văn bản, Tuyển dụng, Làm thêm giờ, Công tác.

#### 2.11.1 Phân hệ Biểu mẫu động (Dynamic Form Builder — Sprint 2)

- **Mục tiêu:** Cho phép Admin tự thiết kế form không cần code, versioning schema, validate runtime, hỗ trợ GRID/table và layout responsive.
- **Danh sách màn hình:**
  - _Form Builder (Web Admin `/admin/form-builder`):_ Palette trái, canvas giữa, properties phải; Preview Desktop/Tablet/Mobile.
- **Quy tắc nghiệp vụ:**
  - Mỗi `formKey` có versioning; chỉ một bản `isLatest=true`.
  - Restore version cũ tạo version mới, không ghi đè lịch sử.
  - Validate POST theo schema: required, regex, min/max, GRID row rules.
- **User Stories & AC:**
  - **[US-FORM-001] Thiết kế Form động:**
    - _AC:_ Thêm panel/field, cấu hình thuộc tính 3 tab; Preview render đúng; lưu POST `/dynamic-forms` thành công.
  - **[US-FORM-002] Quản lý phiên bản form:**
    - _AC:_ GET versions theo key; restore tạo version mới; validate data trả lỗi field-level khi sai.

#### 2.11.2 Phân hệ Mẫu văn bản & OnlyOffice (Document Template — Sprint 2)

- **Mục tiêu:** Upload template DOCX/PDF, map placeholder từ form data, biên tập online qua OnlyOffice, sinh file khi duyệt.
- **Danh sách màn hình:**
  - _Template Designer (Web Admin):_ Iframe OnlyOffice + panel mapping placeholder/transformations.
- **User Stories & AC:**
  - **[US-DOC-001] Thiết kế mẫu văn bản:**
    - _AC:_ Upload template; cấu hình mapping; OnlyOffice config/callback hoạt động; generate PDF/DOCX từ form data.

#### 2.11.3 Phân hệ Chứng thư số nội bộ (Internal CA — Sprint 2)

- **Mục tiêu:** CA nội bộ cấp X.509 cho user/phòng ban; ký và verify payload đơn từ.
- **Danh sách màn hình:**
  - _Cert Manager (Web):_ Danh sách cert, yêu cầu cấp mới, ký thử, trạng thái verify.
- **User Stories & AC:**
  - **[US-CA-001] Quản lý chứng thư & ký số:**
    - _AC:_ POST issue cert; GET my certs; sign-instance + verify PASS; UI hiển thị hạn cert và trạng thái chữ ký.

---

#### 2.12 Phân hệ Mua hàng (Procurement)

- **Chức năng chính:**
  - Tạo đề nghị mua hàng từ các phòng ban.
  - Gửi yêu cầu báo giá (RFQ) đến nhiều nhà cung cấp, lập bảng so sánh giá.
  - Tạo đơn mua hàng (PO), theo dõi nhận hàng và chuyển kế toán lập phiếu chi thanh toán.

---

#### 2.13 Phân hệ Kho / Vật tư (Inventory)

- **Chức năng chính:**
  - Quản lý danh mục vật tư, đơn vị tính quy đổi, nhiều kho hàng.
  - Thực hiện Nhập kho (từ PO), Xuất kho (sử dụng nội bộ hoặc bán hàng), chuyển kho.
  - Cảnh báo tự động khi số lượng tồn kho giảm xuống dưới mức tối thiểu.

---

#### 2.14 Phân hệ Tài sản (Asset Management)

- **Chức năng chính:**
  - Quản lý danh mục thiết bị, công cụ dụng cụ của công ty.
  - Thực hiện bàn giao, thu hồi tài sản, theo dõi lịch sử người sử dụng.
  - Lập lịch bảo trì, sửa chữa thiết bị, tính toán khấu hao nội bộ.

---

#### 2.15 Phân hệ Tiện ích nội bộ (Employee Self-Service — Sprint 2 mở rộng)

- **Chức năng chính:**
  - Cổng portal tự phục vụ: gửi đơn qua Form động gắn Workflow (nghỉ phép, tạm ứng, thanh toán).
  - Phê duyệt nhanh một chạm trên Mobile (Approve/Reject) kèm xác thực sinh trắc học/PIN ký số.
  - Đặt phòng họp (chặn đặt trùng giờ), đăng ký xe công tác.
  - Tra cứu quy định nội bộ, biểu mẫu công ty, xem phiếu lương cá nhân.
- **Danh sách màn hình (Sprint 2):**
  - _Self-service Mobile (Ionic):_ Danh sách loại đơn, form renderer, inbox duyệt nhanh, chi tiết đơn + timeline.
- **User Stories & AC:**
  - **[US-ESS-001] Gửi đơn & duyệt nhanh trên Mobile:**
    - _AC:_ Chọn loại đơn → render form động → submit tạo instance; approver swipe Approve/Reject; đồng bộ theme Rose Gold + Dark/Light + Transloco.

---

#### 2.16 Phân hệ Báo cáo, Phân tích và Dashboard

- **Chức năng chính:**
  - Cung cấp các Dashboard trực quan cho CEO (sức khỏe tài chính, KPI), Sales (doanh số, pipeline), HR (biến động nhân sự, công phép).
  - Bộ lọc báo cáo đa chiều: Thời gian, Phòng ban, Nhân viên, Chi nhánh, Dự án, Khách hàng, Sản phẩm.
  - Xuất dữ liệu báo cáo ra Excel, PDF chất lượng cao.
