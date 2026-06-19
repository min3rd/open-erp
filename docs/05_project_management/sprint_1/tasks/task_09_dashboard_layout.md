# Tài liệu kỹ thuật chi tiết: TSK-1.9 - Bố cục Dashboard sau đăng nhập

## Phân hệ: Giao diện nền tảng & Điều hướng (Dashboard UI - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)

Thiết kế và xây dựng hệ thống bố cục (Layout) tổng thể cho ứng dụng Web Client và Mobile App sau khi người dùng xác thực thành công. Hệ thống điều hướng phải linh hoạt, hỗ trợ chuyển đổi mượt mà giữa các màn hình, cho phép tùy chọn nhiều chế độ hiển thị (bố cục dọc/ngang, menu đầy đủ/nhỏ gọn) và tự động lọc, phân nhóm danh mục menu dựa trên phân hệ (Modules) và ma trận quyền hạn (RBAC) của người dùng hiện tại.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc Đa Bố cục (Multi-layout Structure)

Giao diện sau đăng nhập hỗ trợ 2 dạng bố cục chính có cấu trúc Responsive linh hoạt:

```text
DẠNG DỌC (Vertical Layout)               DẠNG NGANG (Horizontal Layout)
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│ Sidebar  │ Header (Breadcrumbs, User) │ │ Header (Modules, User settings)       │
│          ├────────────────────────────┤ ├───────────────────────────────────────┤
│ Logo &   │                            │ │ Sub-nav (Child menus)                 │
│ Module   │                            │ ├───────────────────────────────────────┤
│ Menu     │ Main Content Area          │ │                                       │
│          │                            │ │ Main Content Area                     │
│ (Icon /  │                            │ │                                       │
│  Text)   │                            │ │                                       │
└──────────┴────────────────────────────┘ └───────────────────────────────────────┘
```

- **Sidebar đứng (Vertical Side Navigation):**
  - Bố cục mặc định cho màn hình Desktop.
  - Chế độ **Full Menu**: Sidebar mở rộng (rộng 260px) hiển thị đầy đủ icon, tên chuyên mục, các nhóm phân hệ kèm dropdown mở rộng/thu gọn.
  - Chế độ **Compact (Icon-only) Menu**: Sidebar thu nhỏ (rộng 72px) chỉ hiển thị icon của các chuyên mục lớn. Hover vào icon sẽ hiển thị tooltip chứa tên menu phụ tương ứng.
- **Header ngang (Horizontal Top Navigation):**
  - Các phân hệ chính (Modules) hiển thị dạng tab/nút trên Header.
  - Khi nhấp vào một phân hệ, các menu phụ chi tiết sẽ render ở thanh Sub-navigation ngang phía dưới.
  - Tối ưu diện tích hiển thị dọc cho các ứng dụng có bảng dữ liệu lớn (như Kế toán, Báo cáo).

#### 2.2 Phân nhóm & Render Menu động theo Quyền (Dynamic Menu Render & RBAC)

- **Cơ chế phân nhóm (Grouping)**:
  - Menu được chia cấp rõ rệt theo phân hệ chức năng: `Hệ thống`, `Nhân sự & Tổ chức`, `Bán hàng (CRM)`, `Mua hàng & Kho`, `Tài chính - Kế toán`.
- **Cơ chế lọc quyền (RBAC Filter)**:
  - Luồng dữ liệu menu được quản lý thông qua cấu trúc JSON menu tập trung do Backend hoặc config phía Client trả về.
  - Mỗi mục menu liên kết với một danh sách các quyền yêu cầu (`requiredPermissions`, ví dụ: `['DEPT_VIEW', 'DEPT_CREATE']`).
  - Hệ thống sử dụng một directive kiểm tra quyền hoặc Guard điều hướng để ẩn/hiển thị mục menu tương ứng. Nếu người dùng không có bất kỳ quyền nào trong nhóm yêu cầu, menu đó sẽ không được render vào DOM.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)

- **Nhiệm vụ 1: Cung cấp API Menu động**
  - Triển khai endpoint `GET /api/v1/auth/menu` trả về danh sách menu được lọc sẵn theo quyền hạn của tài khoản đang đăng nhập.
  - Cấu trúc dữ liệu JSON mẫu trả về:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "org-structure",
          "title": "menu.org_structure",
          "icon": "git-merge",
          "path": "/dashboard/org-structure",
          "module": "organization",
          "children": []
        }
      ]
    }
    ```

#### 3.2 Web Frontend Engineer (FE Web)

- **Nhiệm vụ 1: Phát triển Core Shell (Bố cục Khung)**
  - Tạo component `LayoutComponent` làm khung bao quanh (Shell) cho các màn hình Dashboard.
  - Triển khai cơ chế lưu cài đặt tùy chọn bố cục (`vertical` hoặc `horizontal`, `compact` hoặc `full`) vào LocalStorage để duy trì trạng thái khi tải lại trang.
- **Nhiệm vụ 2: Render Sidebar & Sub-nav động**
  - Xây dựng component `SidebarComponent` hỗ trợ chuyển đổi trạng thái Collapse mượt mà bằng CSS transitions.
  - Sử dụng Transloco để dịch động các tiêu đề menu (`menu.org_structure` -> "Sơ đồ tổ chức").
  - Đảm bảo responsive: Tự động ẩn Sidebar trên thiết bị Mobile và thay bằng nút Drawer mở rộng góc trái.

#### 3.3 Mobile Frontend Engineer (FE Mobile)

- **Nhiệm vụ 1: Cấu trúc Tabs & Side Menu (Drawer)**
  - Thiết kế cấu trúc điều hướng Mobile sử dụng kết hợp Bottom Tabs (cho các tính năng xem nhanh hàng ngày) và Side Drawer Menu (cho toàn bộ sơ đồ chức năng).
  - Tích hợp hiệu ứng chuyển cảnh mượt mà giữa các tab dựa trên Capacitor/Ionic Navigation Controller.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

- **Bước 1 (Chạy Client Web)**: Khởi chạy dev server của web client để kiểm thử giao diện điều hướng:
  ```bash
  npm run start --workspace=open-erp-web
  ```
- **Bước 2 (Gỡ lỗi Cấu hình)**: Thay đổi thủ công thuộc tính `theme_layout` hoặc `sidebar_compact` trong LocalStorage của trình duyệt (F12 Application -> Local Storage) để kiểm tra tính năng tải trạng thái động trước khi viết nút chuyển đổi trên giao diện.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)

- **Kết quả bàn giao:**
  - Bố cục khung Dashboard hoạt động ổn định trên cả Web và Mobile, hỗ trợ co giãn responsive cho mọi độ phân giải.
  - Chuyển đổi mượt mà giữa chế độ dọc/ngang, đầy đủ/thu gọn mà không làm reload ứng dụng.
  - Các mục menu được render động dựa trên danh sách quyền truy cập thực tế của tài khoản.
  - Toàn bộ source code được review và tích hợp vào nhánh `develop`.
