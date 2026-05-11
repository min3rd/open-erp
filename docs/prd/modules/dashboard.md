# PRD — Phân hệ Dashboard

# Dashboard Điều hành Tổng thể

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 14  
**Trạng thái:** Đang soạn thảo

---

## 1. Mục tiêu phân hệ

Phân hệ **Dashboard** cung cấp góc nhìn tổng thể và real-time về toàn bộ hoạt động của doanh nghiệp:

- **Dashboard điều hành:** Tổng hợp KPI từ tất cả phân hệ theo vai trò người xem
- **Cảnh báo real-time:** Thông báo ngay khi có sự kiện quan trọng vượt ngưỡng
- **Phân tích xu hướng:** So sánh, biểu đồ, drill-down từ tổng quan đến chi tiết
- **Cá nhân hóa:** Mỗi người dùng tự cấu hình dashboard theo nhu cầu

---

## 2. Tính năng chính theo MoSCoW

### Must Have

| Tính năng                 | Mô tả                                                           |
| ------------------------- | --------------------------------------------------------------- |
| Dashboard Executive       | Tổng quan KPI: doanh thu, nhân sự, công việc, tài chính         |
| Dashboard theo phân hệ    | Dashboard riêng cho từng phân hệ (Sale, HR, Office, Accounting) |
| Biểu đồ real-time         | Dữ liệu cập nhật không cần refresh trang                        |
| Cảnh báo KPI              | Cảnh báo khi KPI vượt/dưới ngưỡng cấu hình                      |
| Lọc theo khoảng thời gian | So sánh theo ngày/tuần/tháng/quý/năm                            |

### Should Have

| Tính năng           | Mô tả                                              |
| ------------------- | -------------------------------------------------- |
| Dashboard tùy chỉnh | Kéo thả widget, chọn chỉ số muốn hiển thị          |
| Drill-down          | Click vào KPI để xem dữ liệu chi tiết              |
| Xuất báo cáo        | Export dashboard thành PDF, Excel                  |
| AI Insights         | AI tự động phân tích và sinh nhận xét về xu hướng  |
| Dashboard Mobile    | Tương thích mobile, hiển thị tốt trên màn hình nhỏ |
| So sánh kỳ          | So sánh KPI kỳ này với kỳ trước                    |

### Could Have

| Tính năng               | Mô tả                                               |
| ----------------------- | --------------------------------------------------- |
| Dashboard nhúng (Embed) | Nhúng dashboard vào báo cáo ngoài hệ thống          |
| Scheduled reports       | Tự động gửi báo cáo qua email theo lịch             |
| Phân tích cohort        | Phân tích khách hàng, nhân viên theo nhóm thời gian |
| AI dự báo               | AI dự báo KPI cho kỳ tiếp theo                      |

### Won't Have (v1.0)

- BI tool phức tạp (không thay thế Power BI / Tableau)
- Tạo báo cáo tùy chỉnh hoàn toàn bằng SQL

---

## 3. Dashboard theo vai trò

### CEO / Executive

- Doanh thu tháng hiện tại vs tháng trước
- Số nhân viên, biến động nhân sự
- Top sản phẩm bán chạy
- Công nợ phải thu / phải trả
- Tình trạng công việc trọng điểm
- AI insights nổi bật

### Trưởng phòng Sale

- Doanh số đội nhóm theo ngày/tuần/tháng
- Số đơn hàng theo trạng thái
- KPI cá nhân từng nhân viên sale
- Tỷ lệ chuyển đổi lead → đơn hàng
- Tồn kho sản phẩm chủ lực

### Trưởng phòng HR

- Số nhân viên, mới vào, nghỉ việc trong tháng
- Tỷ lệ chấm công đúng giờ
- Đơn nghỉ phép chờ duyệt
- Hợp đồng sắp hết hạn
- Vị trí đang tuyển dụng

### Kế toán trưởng

- Dòng tiền vào/ra tuần hiện tại
- Công nợ phải thu quá hạn
- Số hóa đơn phát hành, chờ xử lý
- Chi phí theo danh mục
- Tình trạng kê khai thuế

---

## 4. Business Rules quan trọng

- **BR-DB-001:** Dashboard chỉ hiển thị dữ liệu thuộc phạm vi phân quyền của người dùng
- **BR-DB-002:** Dữ liệu real-time được cập nhật tối đa mỗi 30 giây (cấu hình được)
- **BR-DB-003:** Widget có thể ẩn đi nhưng không thể hiển thị dữ liệu ngoài quyền truy cập
- **BR-DB-004:** Dữ liệu dashboard phải nhất quán với dữ liệu gốc trong từng phân hệ

---

## 5. Tích hợp với phân hệ khác

| Phân hệ            | Loại tích hợp | Mô tả                                                  |
| ------------------ | ------------- | ------------------------------------------------------ |
| **Tất cả phân hệ** | Read only     | Dashboard chỉ đọc dữ liệu, không ghi                   |
| **AI Agent**       | Bidirectional | AI cung cấp insights và nhận xét tự động cho dashboard |
| **WebSocket**      | Real-time     | Nhận cập nhật real-time từ các phân hệ                 |
