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

---

### 5. Giao diện tối giản và Hiển thị mật độ cao (Minimalist & High-Density UI)

Hệ thống hướng tới giao diện sạch sẽ, tập trung vào hiệu suất làm việc bằng cách hiển thị tối đa thông tin hữu ích trên một màn hình mà không cần phải chuyển trang:

* **Thiết kế mật độ cao (High Information Density):**
  - **Chế độ hiển thị thu gọn (Compact Mode):** Khoảng cách padding/margin được thu nhỏ, cỡ chữ tối ưu (12-14px) tương tự các phần mềm chuyên nghiệp như Excel, Jira để hiển thị nhiều dòng dữ liệu hơn trên màn hình danh sách.
  - **Bố cục đa ngăn (Multi-pane Layouts):** Sử dụng cấu trúc chia đôi (Split-screen) hoặc chia ba ngăn trên màn hình lớn. 
    * *Ví dụ màn hình CRM:* Ngăn trái hiển thị danh sách Khách hàng, Ngăn giữa hiển thị Chi tiết & Lịch sử tương tác, Ngăn phải hiển thị các Cơ hội/Báo giá liên quan. Người dùng có thể thao tác tức thì mà không bị mất ngữ cảnh (context switching).
  - **Khung thông tin collapsible:** Các khu vực lọc dữ liệu, sidebar điều hướng phụ có thể thu nhỏ/ẩn đi bằng một click để dành tối đa diện tích cho khu vực nội dung chính.

* **Khả năng thích ứng đa màn hình (Responsive Grid Breakpoints):**
  Hệ thống tự động điều chỉnh bố cục giao diện dựa trên chiều rộng màn hình (sử dụng hệ thống Grid/Flexbox của Tailwind):
  - **Màn hình cực lớn (Ultra-wide $\ge 1440px$):** Hiển thị đầy đủ sidebar chính, sidebar phụ và bố cục 3 cột (Multi-pane).
  - **Màn hình Desktop/Laptop ($1024px \le Width < 1440px$):** Tự động thu gọn sidebar phụ thành các tab, hiển thị bố cục 2 cột.
  - **Màn hình Tablet ($768px \le Width < 1024px$):** Sidebar điều hướng chính tự động thu gọn thành dạng biểu tượng (icon-only bar), chuyển các bảng dữ liệu sang dạng cuộn ngang (horizontal scroll) hoặc hiển thị thẻ thu gọn.
  - **Màn hình Mobile ($Width < 768px$):** Sidebar ẩn hoàn toàn và kích hoạt qua nút Hamburger menu. Các biểu đồ dashboard chuyển sang dạng xếp chồng một cột (Single-column block layout), bảng dữ liệu dạng lưới chuyển sang dạng danh sách thẻ (Card list) tối ưu cho thao tác vuốt chạm.

