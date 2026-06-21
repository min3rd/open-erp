# Tài liệu kỹ thuật chi tiết: TSK-2.6 - API Thiết lập Deadline & Tác vụ Đốc thúc tự động
## Phân hệ: Lịch trình & Thống kê hiệu suất (Scheduler & Analytics - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng tính năng quản lý thời hạn xử lý (Deadline) cho từng bước phê duyệt. Sử dụng hàng đợi BullMQ Scheduler để quét và tự động nhắc nhở (email, thông báo in-app) cho người duyệt khi sắp đến hạn hoặc quá hạn. Đồng thời thu thập dữ liệu thời gian thực hiện để xuất báo cáo thống kê hiệu quả xử lý công việc của từng cá nhân/phòng ban.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu hình Deadline & Công cụ quét BullMQ Scheduler
* **Định nghĩa Deadline:** Khi cấu hình bước duyệt, người dùng có thể định nghĩa:
  - `durationHours` (ví dụ: `24` -> hết hạn sau 24 giờ kể từ khi bước đó được kích hoạt).
  - Hoặc `durationDays` (ví dụ: `3` ngày).
* **BullMQ Scheduler (Tác vụ nền):**
  - Khi một bước duyệt được kích hoạt, hệ thống sẽ thêm một Job trì hoãn (Delayed Job) vào hàng đợi BullMQ với thời gian delay tương ứng với deadline.
  - Hệ thống cũng chạy một Cron Job định kỳ (ví dụ: mỗi 1 giờ) quét các đơn từ có trạng thái `PENDING` và đã quá hạn (`now() > deadline_at`).
  - **Hành động đốc thúc:** Tự động tạo bản ghi thông báo (in-app) và gửi email đốc thúc với tiêu đề: *"Khẩn: [Tên đơn] cần phê duyệt gấp trước ngày [Hạn chót]"*.

```text
[Bước duyệt kích hoạt] ──► [Lưu DB: deadline_at] ──► [Đăng ký Job BullMQ trì hoãn]
                                                            │
                                                            ▼
[BullMQ Trigger hoặc Cron quét] ──► [Kiểm tra nếu vẫn PENDING] ──► [Gửi email đốc thúc]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`GET /api/v1/workflows/analytics/performance`** (Authorized: Admin/HR)
  - **Tham số query:** `?startDate=2026-06-01T00:00:00Z&endDate=2026-06-20T23:59:59Z`
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "overallStats": {
          "totalInstances": 120,
          "averageCompletionTimeHours": 14.5,
          "delayedPercentage": 8.3
        },
        "userPerformance": [
          {
            "userId": "usr-manager-1",
            "userName": "Nguyễn Văn Trưởng Phòng",
            "assignedTasks": 35,
            "averageProcessTimeHours": 4.2,
            "delayedTasksCount": 1
          },
          {
            "userId": "usr-director-1",
            "userName": "Trần Văn Giám Đốc",
            "assignedTasks": 12,
            "averageProcessTimeHours": 36.8,
            "delayedTasksCount": 4
          }
        ]
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai Quản lý Deadline trong Luồng công việc**
  - Thêm thuộc tính `deadline_at` (TIMESTAMPTZ) vào bảng `workflow_instances` (hoặc bảng trung gian lưu lượt duyệt hiện tại).
  - Tích hợp BullMQ để lên lịch kiểm tra và kích hoạt thông báo bất đồng bộ.
* **Nhiệm vụ 2: Viết APIs báo cáo & thống kê KPIs**
  - Viết truy vấn SQL/TypeORM tính toán khoảng chênh lệch thời gian giữa lúc bước bắt đầu và lúc kết thúc (`workflow_logs`).
  - Tổng hợp dữ liệu theo người dùng để xuất các chỉ số hiệu suất duyệt đơn.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Giao diện Báo cáo hiệu năng duyệt đơn (Analytics)**
  - Xây dựng trang Dashboard trực quan hiển thị biểu đồ thời gian duyệt trung bình, biểu đồ tròn phân tích tỷ lệ trễ hạn bằng Chart.js hoặc thư viện tương đương.
  - Hiển thị nhãn đếm ngược thời gian (Countdown) hoặc cảnh báo màu đỏ trực tiếp trên danh sách đơn cần duyệt.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Cảnh báo Deadline trên App di động**
  - Hiển thị badge màu đỏ báo hiệu đơn đã quá hạn xử lý và gửi Push Notification định kỳ nhắc nhở người dùng.

#### 3.4 UI/UX Designer
* Thiết kế bảng biểu đồ thống kê hiệu năng (Workflow Analytics Dashboard) và các hiệu ứng trực quan cảnh báo trễ hạn trên Hộp thư phê duyệt.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm tra BullMQ: Tạo đơn có deadline 5 giây -> Đợi 6 giây -> Đảm bảo job được trigger và gửi thông báo nhắc nhở thành công.
  - Kiểm tra các truy vấn báo cáo tính toán đúng thời gian trung bình.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Hạ tầng):** Đảm bảo Redis đang chạy để phục vụ BullMQ.
* **Bước 2 (Gỡ lỗi Scheduler):** Sử dụng Bull Board hoặc log CLI theo dõi tiến trình chạy và xử lý Jobs của worker:
  ```bash
  npm run start:dev
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Cơ chế BullMQ quét và xử lý cảnh báo trễ hạn hoạt động ổn định.
* API Analytics trả dữ liệu thống kê chính xác và có thời gian phản hồi dưới 200ms.
* Unit test cho Scheduler & Worker đạt tỷ lệ bao phủ > 80%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
