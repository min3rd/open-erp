# Đặc tả Sitemap & Wireframes giao diện cốt lõi (MVP)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

Tài liệu này đặc tả sơ đồ trang (Sitemap) chi tiết và phác thảo cấu trúc giao diện (Wireframes) cho 5 màn hình cốt lõi của MVP. Thiết kế tuân thủ định hướng tối giản, mật độ thông tin cao (High Density Mode), hỗ trợ Dark & Light Mode, và sử dụng tông màu Rose Gold chủ đạo.

---

### 1. Sơ đồ trang chi tiết (Sitemap Structure)

```mermaid
graph TD
    %% Định nghĩa các trang công cộng
    Public[Portal Công cộng open-erp.9ms.io.vn] --> Landing[Trang giới thiệu Landing Page]
    Public --> Register[Đăng ký Workspace mới / TSK-1.1]
    Public --> LoginSaaS[Đăng nhập Portal quản trị SaaS]
    
    %% Định nghĩa các trang trong Tenant Workspace
    Tenant[Workspace Doanh nghiệp tenant.open-erp.9ms.io.vn] --> Login[Trang đăng nhập Workspace / TSK-1.2]
    Tenant --> AppShell[Bố cục chính Global App Shell]
    
    %% Phân hệ con trong App Shell
    AppShell --> Dashboard[Dashboard điều hành tổng quan]
    
    AppShell --> Org[Phân hệ Tổ chức & Nhân sự]
    Org --> OrgChart[Sơ đồ phòng ban phân cấp / TSK-1.3]
    Org --> UserList[Danh sách nhân sự & Mời qua Email / TSK-1.4]
    Org --> Permissions[Quản lý Nhóm quyền & RBAC / TSK-1.5]
    
    AppShell --> Workspace[Phân hệ Công việc & Dự án]
    Workspace --> Kanban[Bảng Kanban công việc]
    Workspace --> TaskList[Danh sách công việc & Lịch biểu]
    
    AppShell --> CRM[Phân hệ Sales / CRM]
    CRM --> CRMLeads[Danh sách Lead kinh doanh]
    CRM --> CRMPipeline[Kanban cơ hội bán hàng & Báo giá]
    
    AppShell --> Approvals[Phân hệ Phê duyệt yêu cầu]
    Approvals --> AppList[Hộp thư phê duyệt: Nghỉ phép, Thanh toán]
```

---

### 2. Phác thảo cấu trúc giao diện (Wireframe Layouts)

#### 2.1 Bố cục chính của ứng dụng (Global App Shell - Responsive Grid)
Áp dụng cơ chế Sidebar co giãn (Collapsible Sidebar), thanh Topbar tìm kiếm nhanh, bảng màu chủ đạo Rose Gold và nút chuyển đổi chế độ Light/Dark Mode nhanh ở góc trên bên phải.

```text
+-----------------------------------------------------------------------------------------+
| [RG-Logo]  [Tìm kiếm nhanh hệ thống... / Ctrl+K]               [Light/Dark] [Avatar v]  | -> Topbar (Màu Rose Gold nhẹ, 60px)
+----------+------------------------------------------------------------------------------+
| (Collap) | [Breadcrumb: Dự án / Công việc]                       [Nút Hành Động]        |
| - Dash   +------------------------------------------------------------------------------+
| - Tổ chức|                                                                              |
|   - Sơ đồ|                                                                              |
|   - User |                                                                              |
|   - Quyền|                                                                              |
| - Việc   |                                                                              |
| - CRM    |                           VÙNG CHỨA NỘI DUNG CHÍNH                           |
| - Duyệt  |                            (MAIN CONTENT WINDOW)                             |
|          |                                                                              |
|          |                                                                              |
|          |                                                                              |
|          |                                                                              |
|          |                                                                              |
+----------+------------------------------------------------------------------------------+
  ^
  Sidebar (Có thể thu nhỏ chỉ hiển thị Icon để tăng diện tích hiển thị nội dung chính)
```

#### 2.2 Màn hình Đăng ký Workspace Doanh nghiệp (SaaS Register)
Trang đăng ký được thiết kế tối giản, tập trung vào form đăng ký và tích hợp kiểm tra subdomain realtime.

```text
+-----------------------------------------------------------------------------------------+
|                                  [ Logo Open-ERP ]                                      |
|                                                                                         |
|                      ĐĂNG KÝ WORKSPACE DOANH NGHIỆP CỦA BẠN                             |
|             Trải nghiệm giải pháp quản trị doanh nghiệp All-in-one miễn phí             |
|                                                                                         |
|      +---------------------------------------------------------------------------+      |
|      |  Tên Doanh nghiệp:  [ Công ty Cổ phần công nghệ GoTech                 ]  |      |
|      |  Email liên hệ:     [ owner@gotech.com                                 ]  |      |
|      |  Subdomain riêng:   [ gotech             ] .open-erp.9ms.io.vn            |      |
|      |                     (v) Subdomain hợp lệ và có thể đăng ký!               |      |
|      |  Số điện thoại:     [ 0901234567         ]                                |      |
|      |  Mật khẩu quản trị: [ **********         ] (Độ bảo mật: Mạnh)             |      |
|      |                                                                           |      |
|      |  [ ] Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của SaaS.    |      |
|      |                                                                           |      |
|      |                     [  Đăng Ký Khởi Tạo Workspace  ]                      |      | -> Nút nhấn màu Hồng Vàng (Rose Gold)
|      +---------------------------------------------------------------------------+      |
|                                                                                         |
|                      Đã có tài khoản? [ Đăng nhập tại đây ]                             |
+-----------------------------------------------------------------------------------------+
```

#### 2.3 Màn hình Sơ đồ tổ chức & Phòng ban (Department Tree - Split-Pane Layout)
Thiết kế theo mô hình High Density Mode, chia màn hình làm 2 phần (bên trái là cấu trúc cây thư mục kéo thả, bên phải là chi tiết thông tin phòng ban được chọn).

```text
+---------------------------------+-------------------------------------------------------+
| SƠ ĐỒ PHÒNG BAN (SIDE PANEL)    | CHI TIẾT PHÒNG BAN ĐƯỢC CHỌN: PHÒNG KINH DOANH        |
+---------------------------------+-------------------------------------------------------+
|  [+ Thêm Phòng Ban Mới]         | Tên Phòng: Phòng Kinh Doanh (Sales Department)        |
|                                 | Quản lý: [Avatar] Nguyễn Văn A (Trưởng phòng)         |
|  v (GoTech Corp)                | Cấp trên: Ban Giám Đốc                                |
|    ├── Ban Giám Đốc             | Chi nhánh: Trụ sở chính Hà Nội                        |
|    v Phòng Kinh Doanh           +-------------------------------------------------------+
|      ├── Nhóm Bán Hàng Hà Nội   | DANH SÁCH NHÂN VIÊN TRONG PHÒNG (12 thành viên)       |
|      └── Nhóm Bán Hàng TP.HCM   |                                                       |
|    ├── Phòng Kỹ Thuật           | [ ] Họ và Tên     | Chức vụ          | Email          |
|    ├── Phòng Kế Toán            | [x] Nguyễn Văn A  | Trưởng phòng     | a.nv@gotech.com|
|    └── Phòng Hành Chính         | [ ] Trần Thị B    | Sales Executive  | b.tt@gotech.com|
|                                 | [ ] Phạm Văn C    | Sales Executive  | c.pv@gotech.com|
| [Kéo thả để thay đổi cấp bậc]  |                                                       |
|                                 | [ Mời Nhân Viên Mới ]        [ Chuyển Phòng Ban... ]  |
+---------------------------------+-------------------------------------------------------+
```

#### 2.4 Bảng Kanban Công việc & Nhiệm vụ (Task Kanban Board)
Hỗ trợ kéo thả các thẻ công việc qua lại giữa các cột trạng thái. Hiển thị thông tin cô đọng tối đa trên thẻ bao gồm: Tên task, Độ ưu tiên (màu sắc), Người thực hiện (avatar), Hạn chót (Deadline), và Task con hoàn thành.

```text
+-----------------------------------------------------------------------------------------+
| [ Bộ Lọc: Tất cả ]   [ Thành viên: Tất cả v ]   [ Hạn chót: Tuần này v ]   [+ Tạo Task] |
+----------------------+----------------------+----------------------+--------------------+
| CHỜ THỰC HIỆN (3)    | ĐANG LÀM (2)         | CHỜ PHÊ DUYỆT (1)    | HOÀN THÀNH (14)    |
+----------------------+----------------------+----------------------+--------------------+
| +------------------+ | +------------------+ | +------------------+ | +----------------+ |
| | [P0] Thiết kế DB | | | [P1] Init code   | | | [P0] Vẽ sitemap  | | | TSK-0.1 Specs  | |
| | RLS isolation    | | | Angular app      | | | wireframes       | | | [v] 2/2 Tasks  | |
| | [v] 0/4 Tasks    | | | Hạn: 15/06 [!]   | | | [v] 3/3 Tasks    | | |                | |
| | [Avatar] [Avatar]| | | [Avatar]         | | | [Avatar]         | | | [Avatar]       | |
| +------------------+ | +------------------+ | +------------------+ | +----------------+ |
| | [P2] Soạn thảo   | | | [P2] Setup ESLint| |                      | |                  | |
| | tài liệu API     | | | Prettier hooks   | |                      | |                  | |
| | Hạn: 20/06       | | | [Avatar]         | |                      | |                  | |
| | [Avatar]         | | +------------------+ | |                      | |                  | |
| +------------------+ |                      |                      | |                  | |
+----------------------+----------------------+----------------------+--------------------+
```

#### 2.5 Bảng Pipeline Bán hàng Cơ hội CRM (CRM Pipeline Board)
Tương tự như Kanban công việc nhưng hiển thị thông tin về tiền tệ, cơ hội giao dịch, xác suất thắng và liên kết trực tiếp sang module tạo báo giá.

```text
+-----------------------------------------------------------------------------------------+
| [ Lọc: Nhóm Sales Hà Nội ]                          Tổng doanh số dự kiến: 1.250.000 USD|
+----------------------+----------------------+----------------------+--------------------+
| LEAD MỚI (5)         | TIẾP CẬN (3)         | GỬI BÁO GIÁ (2)      | THÀNH CÔNG (W)     |
| Trị giá: 120k USD    | Trị giá: 250k USD    | Trị giá: 400k USD    | Trị giá: 480k USD  |
+----------------------+----------------------+----------------------+--------------------+
| +------------------+ | +------------------+ | +------------------+ | +----------------+ |
| | GoTech - CRM ERP | | | VNG Cloud - ERP  | | | Viettel - CRM    | | | FPT - Cloud    | |
| | 50.000 USD       | | | 150.000 USD      | | | 200.000 USD      | | | 480.000 USD    | |
| | Tỷ lệ: 10%         | | | Tỷ lệ: 30%         | | | Tỷ lệ: 70%         | | | Tỷ lệ: 100%    | |
| | Owner: Nguyễn A  | | | Owner: Trần B      | | | Báo giá: #Q-1002 | | | Báo giá: #Q-998| |
| +------------------+ | +------------------+ | +------------------+ | +----------------+ |
|                      |                      | | [ Tạo Báo Giá... ] | |                  | |
|                      |                      | +------------------+ |                  | |
+----------------------+----------------------+----------------------+--------------------+
```

---

### 3. Quy chuẩn Hiển thị Đa chế độ (Light/Dark Mode Rules)
* **Quy chuẩn màu sắc Dark Mode:**
  - Nền toàn cục (Background): `#0F172A` (Slate 900)
  - Nền các Card, Table, Form: `#1E293B` (Slate 800)
  - Màu chữ chính (Primary Text): `#F8FAFC` (Slate 50)
  - Đường viền chia cắt (Borders): `#334155` (Slate 700)
* **Quy chuẩn màu sắc Light Mode:**
  - Nền toàn cục (Background): `#F8FAFC` (Slate 50)
  - Nền các Card, Table, Form: `#FFFFFF` (Trắng tinh khiết)
  - Màu chữ chính (Primary Text): `#0F172A` (Slate 900)
  - Đường viền chia cắt (Borders): `#E2E8F0` (Slate 200)
* **Tương phản của màu Rose Gold (`#B76E79`):** Đảm bảo độ tương phản AAA trên cả hai nền màu Slate 900 và trắng ngọc trai ngà để người dùng không gặp khó khăn khi đọc chữ trên nút bấm.

---

### 4. Liên kết tài liệu kỹ thuật liên quan
* Đặc tả công việc giao diện (TSK-0.2): [task_02_ux_wireframes.md](./task_02_ux_wireframes.md)
* Quy chuẩn thiết kế màu sắc và font chữ: [task_04_repository_setup.md](./task_04_repository_setup.md)
* Đặc tả yêu cầu người dùng (URS): [urs.md](./urs.md)
