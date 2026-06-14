# Tài liệu kỹ thuật chi tiết: TSK-0.1 - Làm rõ phạm vi MVP & User Journeys
## Phân hệ: Quản trị dự án - Giai đoạn Khảo sát (Sprint 0)

---

### 1. Mục tiêu công việc (Objective)
Thống nhất giới hạn phạm vi sản phẩm khả dụng tối thiểu (MVP Scope), định nghĩa rõ ràng những tính năng sẽ làm (Goals) và những tính năng chưa làm (Non-goals) ở giai đoạn đầu. Phân tích chi tiết 8 nhóm đối tượng người dùng (Personas) và luồng hành trình người dùng cốt lõi để đảm bảo sự đồng bộ hiểu biết giữa PO, BA, UI/UX và đội ngũ lập trình.

---

### 2. Mô tả nghiệp vụ chi tiết

#### 2.1 Giới hạn phạm vi MVP (MVP Boundary)
* **Những phần phát triển trong MVP:**
  - Hạ tầng Multi-tenant (Logical Isolation qua PostgreSQL RLS).
  - Đăng ký doanh nghiệp và kích hoạt tenant subdomain (`open-erp.9ms.io.vn`).
  - Đăng nhập/Đăng xuất/Quên mật khẩu, cơ cấu tổ chức (chi nhánh, phòng ban, chức vụ).
  - Phân quyền cơ bản (RBAC) và sidebar menu hiển thị động.
  - Quản lý công việc và dự án cơ bản dạng Kanban Board, danh sách, lịch.
  - CRM bán hàng cơ bản (Leads, Khách hàng, Cơ hội, Pipeline bán hàng, tạo báo giá).
  - HRM nhân sự cơ bản (Hồ sơ nhân viên, hợp đồng lao động, chấm công thủ công).
  - Quy trình phê duyệt cơ bản nhiều cấp (Nghỉ phép, Tạm ứng, Đề nghị thanh toán).
  - Dashboard tổng quan MVP và báo cáo tiến độ/doanh số cơ bản.
* **Những phần HOÀN TOÀN CHƯA LÀM trong MVP (Post-MVP/Phase 2):**
  - Kế toán nội bộ và Hóa đơn điện tử Việt Nam (dời sang Sprint 7).
  - Mua hàng, nhà cung cấp, và kho vật tư (dời sang Sprint 8, 9).
  - Quản lý tài sản cố định và điều hành văn bản đi/đến (dời sang Sprint 9, 10).
  - Chăm sóc khách hàng và ticket hỗ trợ (dời sang Sprint 11).
  - Marketing chiến dịch nâng cao (dời sang Sprint 12).

#### 2.2 Đặc tả Hành trình người dùng chính (Core User Journey)
Hành trình đăng ký sử dụng và giao việc ban đầu của Chủ doanh nghiệp (Tenant Owner):
1. **Bước 1 (Trang chủ SaaS):** Truy cập `open-erp.9ms.io.vn`, điền thông tin đăng ký doanh nghiệp và subdomain mong muốn (e.g. `alpha`).
2. **Bước 2 (Xác thực):** Kiểm tra email, nhấp vào link kích hoạt tài khoản.
3. **Bước 3 (Thiết lập ban đầu):** Đăng nhập tại `alpha.open-erp.9ms.io.vn`, điền logo, địa chỉ MST doanh nghiệp.
4. **Bước 4 (Sơ đồ tổ chức):** Truy cập module Tổ chức, tạo 2 chi nhánh (Hà Nội, TP.HCM), tạo phòng ban "Kinh doanh" và gán "Trưởng phòng Kinh doanh".
5. **Bước 5 (Mời nhân sự):** Nhập email của nhân viên mới, gán vào phòng ban Kinh doanh với vai trò "Sales Executive".
6. **Bước 6 (Vận hành):** Nhân viên mới đăng nhập qua email kích hoạt, nhận công việc đầu tiên được giao trên Kanban board.

---

### 3. Công việc chi tiết của từng thành viên
* **Product Owner (PO):** 
  - Chủ trì cuộc họp thống nhất phạm vi MVP với các bên liên quan.
  - Chốt danh sách tính năng (Backlog items) độ ưu tiên P0.
* **Business Analyst (BA):**
  - Viết tài liệu SRS và URS chi tiết cho các phân hệ MVP.
  - Thiết kế sơ đồ luồng nghiệp vụ (Workflows) cho đăng ký tenant và phân quyền.
  - Soạn thảo danh sách User Stories kèm Acceptance Criteria chi tiết cho Sprint 1.

---

### 4. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Tài liệu bàn giao:**
  - Tài liệu Đặc tả yêu cầu người dùng (URS) và PRD được PO duyệt.
  - Sơ đồ hành trình người dùng (User Journey Map) được lưu trữ tại [user_journey_map.md](../../../02_user_requirements/user_journey_map.md).
  - Danh sách User Stories cho 3 sprint tiếp theo được cập nhật đầy đủ trong [product_backlog.md](../../product_backlog.md).
