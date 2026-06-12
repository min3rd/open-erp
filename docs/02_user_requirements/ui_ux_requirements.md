# Yêu cầu về UI/UX (UI/UX Requirements)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Bố cục tổng thể (Global Application Layout)
Hệ thống được thiết kế theo bố cục Web Application tiêu chuẩn, tối ưu hóa không gian hiển thị và giảm thiểu số lần click chuột của người dùng.

```
+-------------------------------------------------------------------------+
| [Logo] [Search]                   (Global Search)      [Notif] [Avatar] |
+-----------------------------------+-------------------------------------+
|                                   |                                     |
|  [Sidebar Navigation]             |  [Main Workspace Panel]             |
|                                   |                                     |
|  - Dashboard                      |  +-------------------------------+  |
|  - Sales / CRM                    |  | Page Header                   |  |
|  - Công việc                      |  | [Action Buttons]              |  |
|  - Quy trình duyệt                |  +-------------------------------+  |
|  - Kế toán                        |  |                               |  |
|  - HRM                            |  | [Main Content Area]           |  |
|  - Cấu hình                       |  | (Table, Kanban, Form)         |  |
|                                   |  |                               |  |
|                                   |  +-------------------------------+  |
|                                   |                                     |
+-----------------------------------+-------------------------------------+
```

* **Thanh điều hướng bên (Sidebar Navigation):**
  - Có thể thu nhỏ (collapse) thành dạng chỉ hiển thị icon để mở rộng không gian làm việc.
  - Tải động (Dynamic Sidebar) dựa trên các phân hệ được phân quyền cho người dùng đang đăng nhập.
  - Hỗ trợ các phím tắt (Keyboard shortcuts) để chuyển nhanh giữa các phân hệ (e.g. `Ctrl + Shift + 1` cho Dashboard, `Ctrl + Shift + 2` cho CRM...).
* **Thanh tiêu đề trên (Top Header):**
  - Chứa ô tìm kiếm toàn cầu (Global Search).
  - Trung tâm thông báo (Notification Center) với số đếm badge màu đỏ hiển thị thông báo chưa đọc.
  - Menu cá nhân (User Profile dropdown) để chuyển cấu hình, đổi mật khẩu hoặc đăng xuất.

---

### 2. Các mẫu giao diện tiêu chuẩn (Standard UI/UX Patterns)

#### 2.1 Màn hình Danh sách & Bảng dữ liệu (Table/List View)
* **Tính năng bắt buộc:**
  - *Cuộn vô hạn (Infinite Scroll) hoặc Phân trang (Pagination):* Cho phép người dùng cấu hình số bản ghi trên mỗi trang (10, 20, 50, 100).
  - *Sắp xếp (Sorting):* Bấm vào tiêu đề cột để sắp xếp tăng/giảm dần.
  - *Bộ lọc nâng cao (Advanced Filters):* Cho phép lưu cấu hình bộ lọc làm "Bộ lọc của tôi" (My Filters) để sử dụng lại cho lần sau.
  - *Tác vụ hàng loạt (Bulk Actions):* Chọn nhiều dòng bằng checkbox để xóa, thay đổi người phụ trách, hoặc xuất Excel.
  - *Tùy chỉnh cột (Column Customizer):* Cho phép ẩn/hiển thị và kéo thả thay đổi vị trí các cột hiển thị trong bảng.

#### 2.2 Giao diện Kanban Board
* **Áp dụng cho:** Phân hệ Công việc, Dự án, Sales CRM (Pipeline bán hàng).
* **Tính năng:**
  - Kéo thả (Drag & Drop) mượt mà để thay đổi trạng thái của bản ghi (ví dụ chuyển lead từ "Mới" sang "Đang liên hệ").
  - Mỗi thẻ (Card) hiển thị các thông tin cốt lõi: Tiêu đề, Người phụ trách (Avatar), Hạn hoàn thành (Deadline), Nhãn (Labels/Tags), Chỉ số phụ (checklist count, comment count).
  - Cảnh báo màu sắc trên thẻ: Viền đỏ cho công việc quá hạn, viền vàng cho công việc sắp đến hạn trong vòng 24 giờ.

#### 2.3 Giao diện Lịch biểu (Calendar View)
* **Áp dụng cho:** Lịch công tác, Lịch họp, Lịch phỏng vấn tuyển dụng, Lịch công việc cá nhân.
* **Tính năng:**
  - Hỗ trợ xem theo Ngày (Day), Tuần (Week), Tháng (Month).
  - Bấm trực tiếp vào ô ngày để tạo nhanh sự kiện/công việc.
  - Kéo thả sự kiện để thay đổi ngày thực hiện.

#### 2.4 Form nhập liệu (Form Layouts)
* **Quy tắc thiết kế:**
  - *Tránh form quá dài:* Sử dụng Accordion hoặc Tabs để phân nhóm thông tin (e.g., Thông tin chung, Thông tin liên lạc, Thông tin tài chính).
  - *Xử lý lỗi thời gian thực (Inline Validation):* Cảnh báo lỗi ngay khi người dùng rời chuột khỏi trường thông tin nhập sai (blur event), thay vì đợi đến khi bấm "Lưu".
  - *Tự động lưu (Autosave Draft):* Tự động lưu nháp đối với các văn bản, đề xuất hoặc mô tả công việc dài để tránh mất dữ liệu khi gặp sự cố mạng.

---

### 3. Trải nghiệm Phê duyệt & Tự phục vụ (Approval & ESS Experience)
* **Modal phê duyệt nhanh (Quick Approval Modal):**
  - Khi người duyệt bấm vào nút "Duyệt" hoặc "Từ chối" trên danh sách yêu cầu, một modal popup nhỏ hiển thị yêu cầu nhập lý do/bình luận (bắt buộc khi Từ chối hoặc Yêu cầu bổ sung thông tin).
* **Trang chi tiết phê duyệt (Approval Detail Page):**
  - Hiển thị rõ sơ đồ quy trình phê duyệt (Workflow Visualizer) để nhân viên biết hồ sơ của mình đang nằm ở cấp nào và ai đang xử lý.
  - Cung cấp tính năng đính kèm file (PDF, hình ảnh chứng từ) trực quan với trình xem trước (Previewer) trực tiếp trên trình duyệt mà không cần tải file về máy.

---

### 4. Tìm kiếm toàn cầu (Global Search)
* **Trải nghiệm CMD + K (Command Menu):**
  - Bấm tổ hợp phím `Ctrl + K` (hoặc `Cmd + K` trên macOS) để mở hộp thoại tìm kiếm nhanh.
  - Hỗ trợ tìm kiếm mờ (fuzzy search) trên toàn bộ dữ liệu hệ thống: Khách hàng, Tên công việc, Tên nhân viên, Số chứng từ.
  - Phân loại kết quả tìm kiếm rõ ràng và cho phép sử dụng phím mũi tên để di chuyển nhanh và nhấn `Enter` để truy cập.
