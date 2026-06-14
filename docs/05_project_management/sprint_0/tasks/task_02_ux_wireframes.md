# Tài liệu đặc tả công việc: TSK-0.2 - Sitemap & Wireframes giao diện
## Phân hệ: UI/UX Design - Sprint 0

---

### 1. Mục tiêu công việc (Objective)
Thiết kế sơ đồ trang (Sitemap) hiển thị trực quan cấu trúc của ứng dụng Web quản lý và Mobile app. Phác thảo các màn hình khung dây (Wireframes) cốt lõi của các phân hệ MVP để lấy ý kiến phản hồi từ người dùng thực tế và PO trước khi tiến hành code giao diện.

---

### 2. Thiết kế Hướng thẩm mỹ & Trải nghiệm (Design Aesthetics & UX Guidelines)

#### 2.1 Quy chuẩn Thẩm mỹ Premium (Rich Aesthetics) & Light/Dark Mode
* **Chế độ hiển thị song song (Light & Dark Mode):**
  - Giao diện bắt buộc hỗ trợ cấu hình chuyển đổi giữa Light Mode (nền sáng ngọc trai sang trọng, dịu mắt) và Dark Mode (nền tối Slate/Charcoal sẫm màu để tiết kiệm pin và giảm mỏi mắt khi làm việc ban đêm).
* **Bảng màu chủ đạo Hồng Vàng (Rose Gold Premium Palette):**
  - Tránh các màu cơ bản thô (như đỏ nguyên bản, xanh lá nguyên bản).
  - Sử dụng hệ màu HSL/RGB tinh tế mang tông màu Hồng Vàng (Rose Gold) làm chủ đạo:
    - *Màu nhấn chính (Primary Accent):* Tông màu Hồng Vàng quý phái (`#B76E79` - Rose Gold hoặc phối hợp giữa `#C5A059` - Gold và `#E5C1CD` - Soft Rose).
    - *Màu nền chính (Background):*
      - *Dark Mode:* Màu Slate sẫm `#0F172A` kết hợp với `#1E293B` và các panel dùng hiệu ứng kính mờ (Glassmorphism).
      - *Light Mode:* Màu trắng ngọc trai ngà `#F8FAFC` kết hợp với `#F1F5F9` tạo cảm giác sạch sẽ, cao cấp.
    - *Màu chữ & Bổ trợ (Secondary):* Màu Slate bạc tinh tế (`#64748B` cho text bổ trợ, `#0F172A` cho text chính trong Light mode, `#F8FAFC` cho text chính trong Dark mode).
* **Typography:**
  - Sử dụng font chữ hiện đại, chuyên nghiệp từ Google Fonts: **Inter** hoặc **Outfit**. Tránh sử dụng font hệ thống mặc định của trình duyệt để đảm bảo tính premium.
* **Mật độ thông tin cao (High Density Mode):**
  - Giao diện tối giản nhưng nén thông tin thông minh: Khoảng cách giữa các phần tử nhỏ gọn, tận dụng lưới hiển thị (Grid), menu collapsible, và bố cục chia cột (split-panel) để người dùng xem được tối đa thông số vận hành mà không cần cuộn trang.
* **Micro-animations & Hovers:**
  - Hiệu ứng hover mượt mà với chuyển động trượt 150ms cho các nút bấm và menu item.
  - Hiệu ứng chuyển trạng thái thẻ Kanban trơn tru (CSS transitions).

#### 2.2 Sơ đồ trang tổng thể (Sitemap Summary)
```
[ open-erp.9ms.io.vn (SaaS Portal) ]
   ├── Trang giới thiệu sản phẩm
   ├── Đăng ký Tenant mới
   └── Đăng nhập hệ thống

[ tenant.open-erp.9ms.io.vn (ERP Workspace) ]
   ├── Dashboard điều hành (Tổng quan doanh nghiệp)
   ├── Phân hệ Tổ chức (Chi nhánh, Phòng ban, Nhân sự)
   ├── Phân hệ Công việc (Kanban, Lịch biểu, Checklist)
   ├── Phân hệ CRM / Sales (Lead, Khách hàng, Cơ hội, Pipeline)
   ├── Hộp thư phê duyệt (Đơn từ nghỉ phép, thanh toán)
   └── Cấu hình hệ thống (Nhóm quyền, Seq chứng từ)
```

---

### 3. Công việc chi tiết của UI/UX Designer
* **Nhiệm vụ 1: Thiết kế Sitemap**
  - Sử dụng công cụ Figma/Miro vẽ sơ đồ cấu hình phân cấp các trang và menu chức năng.
* **Nhiệm vụ 2: Thiết kế Wireframes**
  - Vẽ wireframe chi tiết cho 5 màn hình MVP cốt lõi:
    1. Trang đăng ký doanh nghiệp (SaaS Register).
    2. Bố cục tổng thể (Global App Shell) bao gồm Sidebar co giãn, Topbar tìm kiếm nhanh.
    3. Màn hình sơ đồ cây phòng ban và chi tiết phòng ban (Split-pane view).
    4. Màn hình Kanban công việc & Thẻ công việc chi tiết.
    5. Bảng Pipeline bán hàng cơ hội CRM.
  - Phác thảo giao diện đáp ứng (Responsive mockups) tương ứng cho 3 thiết bị: Desktop (1920px), Tablet (768px), và Mobile (375px).

---

### 4. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Sơ đồ trang và Phác thảo giao diện chi tiết: [sitemap_and_wireframes.md](../../../02_user_requirements/sitemap_and_wireframes.md).
  - Link Figma chứa bản vẽ Wireframes của 5 màn hình cốt lõi đã được phê duyệt.
  - Bộ Design System định nghĩa đầy đủ Component Tokens (màu sắc, font chữ, button states, input states, border radius) được cấu hình tại [task_04_repository_setup.md](./task_04_repository_setup.md).
