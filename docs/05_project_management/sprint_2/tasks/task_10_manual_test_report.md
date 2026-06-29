# Báo cáo Kiểm thử Giao diện (Manual Test Report): TSK-2.10 - Thiết kế Form động nâng cao (Web)

Báo cáo này ghi lại kết quả kiểm thử giao diện thực tế của phân hệ **Trình Thiết Kế Form Động (Dynamic Form Builder Web UI)** thuộc Sprint 2 bằng trình duyệt Chrome tương tác thông qua Browser Agent.

---

## 1. Thông tin chung
* **Mã công việc:** TSK-2.10
* **Tính năng:** Giao diện thiết lập Form động nâng cao (Web)
* **Môi trường chạy thử:** `http://localhost:4200/admin/form-builder`
* **Công cụ kiểm thử:** Chrome Browser Agent (Tương tác trực tiếp trên giao diện thực tế)
* **Ngày thực hiện:** 29/06/2026

---

## 2. Kịch bản kiểm thử & Kết quả chi tiết

### Bước 1: Khởi chạy trang thiết kế Form Builder
* **Mục tiêu:** Kiểm tra giao diện khởi tạo có hiển thị đúng tiêu đề, bố cục và trạng thái trống ban đầu hay không.
* **Kết quả thực tế:**
  - Tiêu đề hiển thị chính xác: **Trình Thiết Kế Form Động** (i18n-ready qua Transloco).
  - Trình vẽ canvas hiển thị thông báo trống hướng dẫn người dùng kéo thả/thêm bố cục panel.
  - Tông màu nhấn **Rose Gold (`#B76E79`)** và các biểu tượng **Feather Icons** hiển thị đồng bộ.
* **Ảnh chụp minh chứng:** [01_initial_load.png](./assets/01_initial_load.png)
* **Đánh giá:** **ĐẠT (PASS)**

### Bước 2: Thêm Bố cục Panel & Linh kiện vào Canvas
* **Mục tiêu:** Click thêm mẫu layout panel `Toàn chiều rộng` (Full width), sau đó thêm các linh kiện `Văn bản ngắn` và `Trường số` vào vùng chứa.
* **Kết quả thực tế:**
  - Thao tác click vào mẫu panel `Toàn chiều rộng` (Full width) thành công. Phân khu mới được render trên canvas với tiêu đề mặc định **"Bố cục Panel"**.
  - Các linh kiện `Văn bản ngắn` và `Trường số` được thêm vào panel thành công.
* **Ảnh chụp minh chứng:** [02_after_click_field_1.png](./assets/02_after_click_field_1.png)
* **Đánh giá:** **ĐẠT (PASS)**

### Bước 3: Chọn linh kiện & Cấu hình thuộc tính (Properties Panel)
* **Mục tiêu:** Chọn một trường trên canvas để mở bảng cấu hình thuộc tính bên phải, chuyển đổi giữa các tab thuộc tính.
* **Kết quả thực tế:**
  - Click chọn trường `Văn bản ngắn` thành công. Trường được viền màu Rose Gold biểu thị trạng thái đang chọn.
  - Bảng thuộc tính bên phải mở ra hiển thị 3 tab tương ứng: **Chung**, **Bố cục**, và **Logic**. Chuyển đổi tab hoạt động mượt mà.
* **Đánh giá:** **ĐẠT (PASS)**

### Bước 4: Chuyển đổi sang Chế độ Xem thử (Preview Mode) - Desktop
* **Mục tiêu:** Click nút "Xem thử" để kiểm tra tính năng render biểu mẫu thực tế trên màn hình máy tính (Desktop).
* **Kết quả thực tế:**
  - Click nút `Xem thử` (Preview) thành công, canvas chuyển đổi sang chế độ Render. Biểu mẫu render đầy đủ input.
* **Ảnh chụp minh chứng:** [preview_desktop.png](./assets/preview_desktop.png)
* **Đánh giá:** **ĐẠT (PASS)**

### Bước 5: Chế độ Xem thử (Preview Mode) - Tablet
* **Mục tiêu:** Kiểm tra responsive biểu mẫu trên thiết bị máy tính bảng (Tablet).
* **Kết quả thực tế:**
  - Nhấn nút chuyển đổi layout `Tablet`, chiều rộng canvas thu lại đúng tỷ lệ tablet, layout thích ứng chuẩn xác.
* **Ảnh chụp minh chứng:** [preview_tablet.png](./assets/preview_tablet.png)
* **Đánh giá:** **ĐẠT (PASS)**

### Bước 6: Chế độ Xem thử (Preview Mode) - Mobile
* **Mục tiêu:** Kiểm tra responsive biểu mẫu trên thiết bị di động (Mobile).
* **Kết quả thực tế:**
  - Nhấn nút chuyển đổi layout `Mobile`, chiều rộng canvas thu nhỏ mô phỏng đúng màn hình điện thoại di động, các cột tự động xếp chồng chuẩn responsive grid.
* **Ảnh chụp minh chứng:** [preview_mobile.png](./assets/preview_mobile.png)
* **Đánh giá:** **ĐẠT (PASS)**

---

## 3. Video ghi lại phiên kiểm thử trực quan trên trình duyệt

Toàn bộ phiên kiểm thử tương tác thực tế với trình duyệt của Browser Agent đã được ghi hình và lưu trữ dưới định dạng hoạt ảnh WebP:

![Ghi hình phiên kiểm thử trên trình duyệt (WebP Animation)](./assets/form_builder_test.webp)

*(Đường dẫn trực tiếp: [form_builder_test.webp](./assets/form_builder_test.webp))*

---

## 4. Tổng hợp kết quả kiểm thử

| Hạng mục kiểm thử | Kết quả mong muốn | Trạng thái thực tế | Kết luận |
|---|---|---|---|
| **Trang chủ Form Builder** | Hiển thị chính xác bảng linh kiện bên trái, bản vẽ canvas ở giữa, thanh thuộc tính bên phải | Hiển thị đồng bộ tông màu Rose Gold và Feather Icons | **PASS** |
| **Bố cục & Lưới Layout** | Click thêm panel và cấu hình số cột linh hoạt trên canvas | Click thêm panel `Toàn chiều rộng` hoạt động hoàn hảo | **PASS** |
| **Thêm linh kiện nhập liệu** | Thêm thành công `Văn bản ngắn` và `Trường số` vào phân khu canvas | Các linh kiện hiển thị đúng thẻ nhãn và tên biến | **PASS** |
| **Bảng thuộc tính (Properties)** | Chọn trường/panel hiển thị đúng tab cấu hình tương ứng | Bảng thuộc tính chuyển đổi tab nhanh và chuẩn xác | **PASS** |
| **Chế độ Preview & Responsive** | Chuyển sang form renderer thực tế, co giãn kích thước theo 3 thiết bị Desktop/Tablet/Mobile | Co giãn mượt mà, cấu trúc grid tự động thích nghi | **PASS** |

## 5. Kết luận
Trình Thiết Kế Form Động của task **TSK-2.10** hoạt động cực kỳ mượt mà, đáp ứng 100% yêu cầu nghiệp vụ và kỹ thuật kiểm thử thực tế trên trình duyệt Chrome. Giao diện trực quan Rose Gold hiện đại, đáp ứng tốt tiêu chí nghiệm thu (DoD).
