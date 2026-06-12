# Kế hoạch phát triển sản phẩm 12 Sprint (Agile 12-Sprint Development Plan)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Phân bổ nguồn lực & Mô hình phát triển
Kế hoạch này dựa trên giả định đội ngũ phát triển gồm 8 nhân sự chính vận hành theo khung quy trình **Scrum (sprint 2 tuần)**:
* **Product Owner (PO):** 1 nhân sự - Định hướng tính năng, quản lý backlog.
* **Business Analyst (BA):** 1 nhân sự - Chi tiết hóa đặc tả, viết User Stories và nghiệm thu chức năng.
* **UI/UX Designer:** 1 nhân sự - Thiết kế wireframe, UI component, prototype.
* **Backend Developer (BE):** 2 nhân sự - Xây dựng cơ sở dữ liệu, API, NestJS Microservices trong repository `open-erp-services`.
* **Frontend Web Developer (FE Web):** 1 nhân sự - Phát triển ứng dụng Web bằng Angular & Tailwind CSS trong repository `open-erp-web`.
* **Frontend Mobile Developer (FE Mobile):** 1 nhân sự - Phát triển ứng dụng Mobile bằng Ionic trong repository `open-erp-mobile`.
* **QA/Tester:** 1 nhân sự - Viết testcase, kiểm thử tự động (API/E2E), kiểm thử thủ công trên cả Web và Mobile.
* **DevOps / Cloud Engineer:** 1 nhân sự - Quản lý hạ tầng cloud, CI/CD pipeline cho 3 repository độc lập, monitoring, bảo mật.

---

### 2. Chi tiết kế hoạch các Sprint

#### Sprint 0 — Khởi động dự án, thiết kế kiến trúc và chuẩn bị hạ tầng
* **Mục tiêu:** Thống nhất phạm vi MVP, thiết kế sơ đồ dữ liệu cấp cao, chuẩn bị hạ tầng CI/CD và setup cấu trúc mã nguồn cho 3 dự án `open-erp-services`, `open-erp-web`, `open-erp-mobile`.
* **Nghiệp vụ chính:**
  - *PO/BA:* Thống nhất SRS & danh sách tính năng MVP, viết User Stories cho Sprint 1, 2.
  - *UI/UX:* Thiết kế Design System ban đầu (Bảng màu, Font chữ, Button, Form, Layout cơ bản tương thích cả Web và Mobile).
  - *Backend (NestJS):* Thiết kế Database Schema tổng thể. Cấu hình kiến trúc NestJS Microservices trong repo `open-erp-services` (sử dụng Yarn Workspaces/Lerna hoặc NestJS Monorepo structure). Setup Auth service boilerplate.
  - *Frontend Web (Angular):* Cấu hình Angular và tích hợp Tailwind CSS trong repo `open-erp-web`. Thiết lập cấu hình Routing và Core Module.
  - *Frontend Mobile (Ionic):* Cấu hình dự án Ionic (sử dụng Angular làm framework nền tảng) trong repo `open-erp-mobile`.
  - *DevOps:* Cấu hình AWS/Google Cloud VPC, Kubernetes Cluster ban đầu. Thiết lập 3 pipeline CI/CD độc lập trên GitHub Actions tương ứng với 3 repository để tự động build và deploy.
* **Kết quả bàn giao (Deliverables):**
  - Tài liệu Kiến trúc hệ thống & Database Schema được duyệt.
  - Cấu trúc 3 repository được khởi tạo thành công và kết nối pipeline CI/CD lên môi trường Development/Staging.
* **Rủi ro:** Thiết lập môi trường CI/CD chậm tiến độ do quản lý cùng lúc 3 pipeline độc lập.
* **Phụ thuộc:** Không.

---

#### Sprint 1 — Xác thực (Auth), Quản lý Tenant và Cơ cấu tổ chức cơ bản
* **Mục tiêu:** Hoàn thành quy trình đăng ký doanh nghiệp (tạo Tenant), đăng nhập, tạo phòng ban và cấu hình tài khoản ban đầu.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế chi tiết giao diện Trang đăng ký SaaS, Đăng nhập, Trang thiết lập phòng ban & sơ đồ tổ chức.
  - *Backend:* Xây dựng API đăng ký Tenant (Tenant Provisioning Engine), API Login/Logout JWT, API quản lý phòng ban và chức vụ.
  - *Frontend:* Code giao diện Đăng ký, Đăng nhập. Tích hợp API tạo Tenant, phân quyền hiển thị sidebar. Code màn hình Quản lý sơ đồ tổ chức.
  - *QA:* Viết bộ testcase kiểm thử chức năng Đăng ký/Đăng nhập, kiểm thử bảo mật lỗ hổng SQL Injection/XSS đầu vào.
  - *DevOps:* Triển khai cơ chế định tuyến tên miền con (Dynamic Subdomain routing) trên API Gateway.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Đăng ký tài khoản doanh nghiệp thành công, tự động chuyển hướng đến subdomain của tenant (e.g. `alpha.open-erp.com`).
  - Tạo mới, sửa, xóa phòng ban/chức vụ hoạt động đúng logic nghiệp vụ.

---

#### Sprint 2 — Thiết lập quy trình phê duyệt & Tiện ích nhân viên cơ bản
* **Mục tiêu:** Xây dựng cấu hình quy trình phê duyệt động và cho phép nhân viên gửi đơn xin nghỉ phép, tạm ứng, thanh toán.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế Form đăng ký nghỉ phép, đề xuất thanh toán, màn hình cấu hình quy trình duyệt (Workflow builder) dạng danh sách các bước.
  - *Backend:* Xây dựng Database schema cho Workflow Engine. Viết API tạo quy trình duyệt, API gửi yêu cầu duyệt, API xử lý duyệt (Approve/Reject).
  - *Frontend:* Code màn hình thiết lập quy trình duyệt, màn hình gửi yêu cầu tự phục vụ, tích hợp API hiển thị log lịch sử duyệt.
  - *QA:* Kiểm thử tự động luồng chạy phê duyệt đa cấp (Ví dụ: kiểm thử đơn được chuyển đúng người duyệt tiếp theo).
* **Kết quả bàn giao:**
  - Module Workflow Engine hoạt động ổn định. Nhân viên gửi đơn và người duyệt nhận được thông báo in-app.

---

#### Sprint 3 — Quản lý công việc (Tasks) & Dự án cơ bản
* **Mục tiêu:** Cho phép người dùng giao việc, theo dõi tiến độ công việc qua Kanban board và tạo dự án liên kết.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế màn hình Danh sách công việc, Kanban board, Modal chi tiết công việc (bao gồm checklist, comment, file đính kèm).
  - *Backend:* Viết API quản lý dự án (CRUD), API Công việc (gán việc, cập nhật trạng thái, thêm comment). Thiết lập tác vụ quét định kỳ (Cronjob) để cảnh báo công việc quá hạn.
  - *Frontend:* Phát triển Kanban board với thư viện kéo thả mượt mà (e.g. react-beautiful-dnd). Code giao diện chi tiết công việc. Tích hợp WebSocket nhận thông báo comment mới.
  - *QA:* Kiểm thử hiệu năng kéo thả thẻ Kanban với số lượng lớn thẻ (Stress test 1000 cards).
* **Kết quả bàn giao:**
  - Module Công việc hoạt động đầy đủ trên giao diện Kanban và Danh sách.

---

#### Sprint 4 — CRM / Sales cơ bản
* **Mục tiêu:** Số hóa hoạt động quản lý khách hàng tiềm năng (Leads), đường ống cơ hội bán hàng (Sales Pipeline) và tạo báo giá.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế giao diện Quản lý Lead, Pipeline cơ hội bán hàng dạng cột kéo thả, mẫu in Báo giá.
  - *Backend:* Xây dựng API quản lý Lead, API chuyển lead thành cơ hội, API tạo và xuất file PDF Báo giá.
  - *Frontend:* Code giao diện Pipeline bán hàng, màn hình tạo báo giá động cho phép chọn sản phẩm dịch vụ từ danh mục.
  - *QA:* Kiểm thử luồng logic chuyển đổi dữ liệu từ Lead sang Cơ hội bán hàng đảm bảo không mất thông tin lịch sử chăm sóc.

---

#### Sprint 5 — HRM & Chấm công cơ bản
* **Mục tiêu:** Quản lý thông tin hồ sơ nhân sự, hợp đồng lao động và hỗ trợ chấm công thủ công trên giao diện.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế hồ sơ nhân sự dạng tab, màn hình bảng chấm công hàng tháng.
  - *Backend:* API quản lý hồ sơ nhân viên, API ký và lưu trữ hợp đồng lao động, API chấm công (Check-in/Check-out).
  - *Frontend:* Code màn hình Hồ sơ nhân viên, màn hình bảng công đối soát của bộ phận nhân sự.
  - *QA:* Kiểm thử tính toán số giờ làm việc thực tế dựa trên thời gian check-in/out thực tế của nhân viên.

---

#### Sprint 6 — Báo cáo MVP & Phát hành bản thử nghiệm (Beta Release)
* **Mục tiêu:** Xây dựng dashboard tổng quan, hoàn thiện tính năng xuất báo cáo Excel cơ bản, kiểm thử tích hợp toàn bộ hệ thống và phát hành phiên bản Beta.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế Dashboard tổng quan của CEO và các trưởng bộ phận với biểu đồ trực quan.
  - *Backend:* Viết API tổng hợp số liệu báo cáo, API xuất dữ liệu báo cáo ra Excel/CSV.
  - *Frontend:* Tích hợp thư viện biểu đồ (Chart.js / Recharts) để hiển thị số liệu doanh số, tiến độ công việc, tỷ lệ nghỉ phép.
  - *QA:* Thực hiện chiến dịch Bug Bash toàn diện (E2E testing), kiểm tra tải hệ thống (Load testing).
  - *DevOps:* Triển khai môi trường UAT/Beta. Thiết lập các bản ghi DNS cấu hình subdomain.
* **Mục tiêu cuối Sprint 6:** MVP chạy ổn định. Bắt đầu mở đăng ký thử nghiệm rộng rãi cho một số doanh nghiệp đối tác (Closed Beta).

---

#### Sprint 7 — Phân hệ Kế toán / Tài chính nội bộ cơ bản
* **Mục tiêu:** Hoàn thiện việc quản lý quỹ tiền mặt/ngân hàng, ghi nhận phiếu thu/chi nội bộ và kiểm soát công nợ khách hàng cơ bản.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế màn hình danh sách Sổ quỹ (Tiền mặt, Ngân hàng), biểu mẫu Lập phiếu thu/Phiếu chi, và bảng đối soát Công nợ.
  - *Backend:* Xây dựng Database schema cho phân hệ tài chính. Thiết lập API quản lý Sổ quỹ, API Lập phiếu thu/chi. Tích hợp cơ chế tự động tạo Phiếu chi nháp từ Đề nghị thanh toán đã được duyệt.
  - *Frontend:* Code màn hình Sổ quỹ tiền mặt và ngân hàng. Phát triển form lập phiếu thu/chi với các trường định dạng số tiền tệ tự động. Tích hợp API đối soát công nợ.
  - *QA:* Kiểm thử tự động luồng tạo phiếu chi tự động từ Đề nghị thanh toán (integration testing), kiểm tra số dư quỹ không bị âm.
  - *DevOps:* Cấu hình sao lưu định kỳ (incremental backup) cho dữ liệu tài chính (mỗi 2 tiếng).
* **Kết quả bàn giao:**
  - Module Kế toán nội bộ hoạt động đầy đủ trên môi trường staging.
* **Rủi ro:** Trễ hạn do công thức đối soát công nợ phức tạp.
* **Phụ thuộc:** Hoàn thành module Quy trình phê duyệt (Sprint 2).

---

#### Sprint 8 — Phân hệ Mua hàng (Procurement) & Nhà cung cấp
* **Mục tiêu:** Số hóa quy trình mua sắm từ đề nghị mua hàng, thu thập báo giá nhà cung cấp, so sánh giá đến lập đơn PO.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế Form Đề nghị mua hàng, giao diện Bảng so sánh báo giá nhà cung cấp, mẫu in Đơn mua hàng (PO).
  - *Backend:* Thiết lập cơ sở dữ liệu Nhà cung cấp, Đơn mua hàng. Xây dựng API quản lý đề xuất mua sắm, API so sánh giá, và xuất file PDF đơn PO.
  - *Frontend:* Code giao diện tạo Đề nghị mua hàng. Xây dựng màn hình so sánh giá của nhiều nhà cung cấp. Tích hợp API xuất đơn PO gửi qua email.
  - *QA:* Viết bộ testcase kiểm thử quy trình duyệt đề xuất mua hàng đến khi chuyển trạng thái PO.
  - *DevOps:* Cấu hình dịch vụ gửi Email tự động gửi PDF đơn PO cho Nhà cung cấp thông qua Amazon SES.
* **Kết quả bàn giao:**
  - Quy trình luồng mua sắm hoàn thành trên môi trường staging.
* **Phụ thuộc:** Module Kế toán nội bộ (Sprint 7) để kết nối công nợ nhà cung cấp.

---

#### Sprint 9 — Phân hệ Kho / Vật tư & Tài sản cố định
* **Mục tiêu:** Quản lý nhập/xuất/tồn kho vật tư và vòng đời tài sản cố định của công ty (Bàn giao, thu hồi, bảo trì).
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế thẻ Kho, Form Nhập/Xuất kho, màn hình danh sách tài sản và Form Bàn giao tài sản.
  - *Backend:* Xây dựng API Nhập/Xuất kho liên kết với PO đã hoàn thành. Viết API Thẻ kho, API quản lý vòng đời tài sản (Ghi tăng, Bàn giao, Bảo trì, Khấu hao nội bộ).
  - *Frontend:* Code giao diện Thẻ kho hiển thị lịch sử Nhập/Xuất. Code màn hình bàn giao tài sản cho nhân sự trong HRM.
  - *QA:* Kiểm thử tính toán tự động số lượng tồn kho và cảnh báo tồn tối thiểu khi xuất kho vượt mức.
  - *DevOps:* Tối ưu hóa lưu trữ ảnh chụp chứng từ bàn giao tài sản lên S3.
* **Kết quả bàn giao:**
  - Module Kho và Tài sản hoạt động ổn định và liên kết với HRM, Procurement.

---

#### Sprint 10 — Phân hệ Điều hành và Quản lý văn bản (DMS)
* **Mục tiêu:** Số hóa việc quản lý công văn đi/đến, cấp số văn bản tự động, và luân chuyển tài liệu nội bộ trình ký.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế Tủ tài liệu số (Folder tree), biểu mẫu Đăng ký văn bản đi/đến, giao diện luồng trình ký.
  - *Backend:* API lưu trữ tài liệu phân quyền thư mục. Xây dựng công cụ cấp số văn bản tự động dựa trên cấu hình. Tích hợp API trình ký và phê duyệt văn bản nhiều cấp.
  - *Frontend:* Phát triển cây thư mục tài liệu mượt mà. Code giao diện ký điện tử nháp và xem trước file PDF trực tiếp.
  - *QA:* Kiểm thử phân quyền chi tiết (Xem, Sửa, Tải, Xóa) trên từng thư mục tài liệu đảm bảo tính cô lập dữ liệu.
  - *DevOps:* Cấu hình mã hóa dữ liệu lưu trữ (Encryption-at-Rest) cho thư mục tài liệu trên S3.
* **Kết quả bàn giao:**
  - Module Quản lý văn bản và tài liệu điện tử chạy tốt trên môi trường staging.

---

#### Sprint 11 — Phân hệ Chăm sóc khách hàng & Ticket hỗ trợ
* **Mục tiêu:** Tiếp nhận yêu cầu hỗ trợ, theo dõi xử lý ticket theo SLA liên kết với thông tin khách hàng trên CRM.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế màn hình Gửi Ticket cho khách hàng, màn hình Quản trị Ticket cho bộ phận CS/Support, biểu đồ đo lường SLA.
  - *Backend:* Viết API tiếp nhận ticket, API gán ticket tự động, API đo lường SLA thời gian phản hồi/hoàn thành.
  - *Frontend:* Code màn hình quản lý ticket hỗ trợ, tích hợp cảnh báo quá hạn SLA bằng màu sắc.
  - *QA:* Kiểm thử tự động đổi trạng thái ticket sang "Quá hạn" và kích hoạt cảnh báo lên trưởng bộ phận khi vi phạm SLA.
* **Kết quả bàn giao:**
  - Phân hệ Chăm sóc khách hàng tích hợp không vết với cơ sở dữ liệu CRM.

---

#### Sprint 12 — Phân hệ Marketing & Báo cáo nâng cao (Production Release)
* **Mục tiêu:** Quản lý chiến dịch marketing, tích hợp Form thu lead tự động, thiết lập báo cáo CEO nâng cao và chính thức phát hành phiên bản Production thương mại hóa.
* **Phân bổ công việc:**
  - *UI/UX:* Thiết kế Form Builder cơ bản cho Marketing thu lead, giao diện Dashboard CEO chuyên sâu.
  - *Backend:* API quản lý chiến dịch marketing. Xây dựng webhook nhận lead tự động từ Website/Zalo. API báo cáo phân tích ROI chiến dịch, cảnh báo bất thường dòng tiền.
  - *Frontend:* Code giao diện lấy mã nhúng Form thu lead. Phát triển Dashboard CEO hiển thị biểu đồ phân tích đa chiều.
  - *QA:* Kiểm thử tích hợp toàn bộ hệ thống (End-to-End Testing), kiểm tra rò rỉ dữ liệu chéo (Multi-tenant security pen-testing).
  - *DevOps:* Thiết lập hạ tầng môi trường Production. Cấu hình DNS, SSL/TLS, CDN bảo vệ DDOS. Chạy thử nghiệm tải lớn (Stress testing).
* **Kết quả bàn giao:**
  - Hệ thống All-in-one Business Management SaaS hoàn chỉnh chạy trên môi trường Production.
* **Rủi ro:** Việc tích hợp webhook bên thứ ba phát sinh lỗi định dạng dữ liệu đầu vào.

