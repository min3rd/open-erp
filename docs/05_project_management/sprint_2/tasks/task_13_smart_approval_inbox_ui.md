# Tài liệu kỹ thuật chi tiết: TSK-2.13 - Hộp thư phê duyệt thông minh (Web)
## Phân hệ: Giao diện Người dùng (User Web UI - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng giao diện "Hộp thư phê duyệt thông minh" (Smart Approval Inbox) hợp nhất trên Web. Đây là trung tâm điều phối tất cả công việc phê duyệt của nhân viên và quản lý, cho phép xem nhanh thông tin đơn, hiển thị động các trường dữ liệu tùy chỉnh, xem trực quan tài liệu OnlyOffice, kiểm tra timeline nhật ký chống giả mạo, thực hiện ký số phê duyệt và nhận diện cảnh báo trễ hạn (deadline).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc màn hình Hộp thư phê duyệt thông minh
Màn hình được thiết kế phân chia thành 3 khu vực chính:
1. **Khu vực trái (List Panel):** Danh sách các đơn đang chờ phê duyệt, đã duyệt, và đơn tự gửi. Tích hợp thanh tìm kiếm, bộ lọc theo loại quy trình, bộ lọc theo độ khẩn cấp, và nhãn đếm ngược thời gian (Deadline Countdown) màu đỏ nếu sắp trễ hạn.
2. **Khu vực trung tâm (Detail Panel):**
   - Tiêu đề đơn, người gửi, ngày gửi.
   - **Form động renderer:** Hiển thị toàn bộ dữ liệu người gửi đã nhập dưới dạng Read-only.
   - **Tài liệu đính kèm:** Nhúng bộ xem trực tuyến OnlyOffice Viewer (hoặc PDF Viewer) hiển thị văn bản tự động sinh ra tương ứng.
3. **Khu vực phải (Timeline & Action Panel):**
   - **Timeline lịch sử duyệt:** Hiển thị từng bước xử lý kèm dấu thời gian, ý kiến duyệt và huy hiệu xác thực toàn vẹn (Tamper-proof Log Badge).
   - **Bảng nút hành động (Actions):** Phê duyệt (Approve - Kích hoạt popup mật khẩu ký số), Từ chối (Reject), Xin ý kiến chuyên gia (Consult).

```text
┌─────────────────┬──────────────────────────────────────┬────────────────────────┐
│ HỘP THƯ CHỜ     │ CHI TIẾT ĐƠN ĐỀ XUẤT MUA SẮM         │ TIMELINE LỊCH SỬ DUYỆT │
├─────────────────┼──────────────────────────────────────┼────────────────────────┤
│ Đơn Mua Laptop  │ Lý do: Phục vụ code dự án            │ [x] Khởi tạo đơn       │
│ [Hạn: 2 giờ]    │ Số tiền: 25.000.000 VNĐ              │     (Nguyễn Văn A)     │
│                 │                                      │                        │
│ Đơn Xin Nghỉ    ├──────────────────────────────────────┤ [ ] Đang chờ duyệt     │
│ [Đã quá hạn]    │ [ TÀI LIỆU KÈM THEO: FILE PDF ]      │     (Trưởng phòng B)   │
│                 │                                      │                        │
│                 │                                      ├────────────────────────┤
│                 │                                      │ HÀNH ĐỘNG:             │
│                 │                                      │ [ Phê duyệt & Ký số ]  │
│                 │                                      │ [ Xin ý kiến ] [Hủy]   │
└─────────────────┴──────────────────────────────────────┴────────────────────────┘
```

#### 2.2 Quy chuẩn thiết kế UI/UX
- Màu sắc chủ đạo: **Rose Gold (`#B76E79`)** áp dụng cho thanh trạng thái, các badge chỉ số và nút phê duyệt chính.
- Tự động nhận diện theme hệ thống (Light/Dark mode) và thay đổi màu nền phù hợp (Dark Mode sử dụng màu xám tối và vàng đồng kết hợp Rose Gold tạo cảm giác cao cấp).
- Cập nhật thời gian thực (Realtime Update): Sử dụng socket listener từ TSK-2.7 để tự động thêm/bớt đơn trong danh sách chờ duyệt mà không cần tải lại trang (reload).

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (hỗ trợ tối ưu hóa truy vấn APIs tổng hợp thông tin chi tiết một lượt duyệt bao gồm cả form, logs, file và cert).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Phát triển Layout Hộp thư 3 cột**
  - Sử dụng CSS Grid / Flexbox xây dựng cấu trúc giao diện responsive cho các loại màn hình máy tính và máy tính bảng.
  - Tích hợp Angular WebSocket service lắng nghe sự kiện đẩy đơn mới để cập nhật danh sách chờ tức thì.
* **Nhiệm vụ 2: Tích hợp các Component con**
  - Nhúng các component đã phát triển ở các task trước: Dynamic Form Renderer, OnlyOffice Viewer, Signature Badge, Timeline Log.
  - Xây dựng Modal popup ký duyệt tích hợp passphrase nhập liệu an toàn.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi trực tiếp (được tách riêng cho di động ở TSK-2.14).*

#### 3.4 UI/UX Designer
* Cung cấp thiết kế UI/UX tinh tế cho Hộp thư phê duyệt thông minh trên Figma, tối ưu hóa bố cục hiển thị tài liệu để người duyệt không phải cuộn trang quá nhiều.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm tra việc hiển thị đầy đủ thông tin đơn ở các loại quy trình khác nhau (mua sắm, xin nghỉ phép, tạm ứng tiền).
  - Kiểm tra việc chuyển đơn tự động khi nhấn Duyệt hoặc Từ chối.
  - Kiểm tra đồng bộ dữ liệu khi nhận tin nhắn Socket gửi từ hệ thống.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1:** Khởi chạy Angular Web Client.
* **Bước 2 (Gỡ lỗi Client):** Sử dụng các công cụ Chrome DevTools để kiểm soát và đo lường thời gian render các component phức tạp (nhất là frame nhúng OnlyOffice).

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hộp thư phê duyệt thông minh hiển thị đầy đủ, chính xác dữ liệu của đơn từ và tài liệu đi kèm.
* Nhận và cập nhật đơn thời gian thực thông qua WebSocket hoạt động tin cậy.
* Tích hợp thành công cơ chế nhập mật khẩu ký số nội bộ trực tiếp trên giao diện duyệt.
* Tương thích đầy đủ giao diện Rose Gold, Light/Dark Mode và đa ngôn ngữ.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
