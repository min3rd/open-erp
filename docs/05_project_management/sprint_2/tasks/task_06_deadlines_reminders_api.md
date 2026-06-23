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
  - Cấu hình gán giá trị `deadline_at` (TIMESTAMPTZ) trực tiếp vào bảng phân công tác vụ thực tế `workflow_approvers` khi bắt đầu mỗi bước duyệt.
  - Tích hợp BullMQ để quét các tác vụ `workflow_approvers` có trạng thái `PENDING` và đã quá hạn (`now() > deadline_at`) nhằm kích hoạt thông báo nhắc nhở tự động.
* **Nhiệm vụ 2: Viết APIs báo cáo & thống kê KPIs**
  - Viết các truy vấn SQL/TypeORM thống kê hiệu năng duyệt đơn dựa trên bảng `workflow_approvers` (sử dụng các cột `assigned_at`, `action_at`, `deadline_at`, `user_id`, `department_id`).
  - Do dữ liệu đã được chuẩn hóa vào các cột, việc lập chỉ mục (Indexes) trên `user_id`, `department_id`, và `status` sẽ tối ưu hóa tốc độ truy xuất báo cáo thống kê theo cá nhân, phòng ban hoặc doanh nghiệp.

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
* **Trạng thái:** Hoàn thành 100% các yêu cầu nghiệp vụ và kỹ thuật.
* **Kết quả bàn giao chi tiết:**
  - **Database & Entities Integration:**
    - Sử dụng cột `deadlineAt` có sẵn trên thực thể `WorkflowApprover` để thiết lập thời hạn xử lý cho từng bước duyệt.
    - Cập nhật phương thức `activateStepInTransaction` của [WorkflowInstanceService](../../../../open-erp-services/src/core/workflow/workflow-instance.service.ts) để tự động tính toán `deadlineAt` từ cấu hình `durationHours` hoặc `durationDays` trong `step.config`.
  - **BullMQ Delayed & Cron Job Scheduler:**
    - Đăng ký Queue và Provider mới cho `'workflow-deadline-queue'` trong [WorkflowModule](../../../../open-erp-services/src/core/workflow/workflow.module.ts).
    - Tạo worker [WorkflowDeadlineConsumer](../../../../open-erp-services/src/core/workflow/workflow-deadline.consumer.ts) kế thừa `WorkerHost` để lắng nghe xử lý các Jobs:
      - `'check-step-deadline'` (Delayed Job): Tự động trigger gửi email đốc thúc và giả lập in-app notification sau khoảng thời gian trì hoãn nếu task vẫn còn ở trạng thái `PENDING` hoặc `CONSULTING`.
      - `'scan-overdue-approvals'` (Repeatable/Cron Job): Được tự động đăng ký lúc khởi động (chạy định kỳ mỗi 1 giờ) để quét và gửi cảnh báo trễ hạn cho toàn bộ các tasks đã quá hạn.
  - **KPIs & Performance Analytics API:**
    - Phát triển logic truy vấn và tính toán KPIs in-memory trong [WorkflowService](../../../../open-erp-services/src/core/workflow/workflow.service.ts) qua hàm `getPerformanceAnalytics(tenantId, query)`, giúp đảm bảo tính tương thích cơ sở dữ liệu trên cả SQLite (Jest) và PostgreSQL (Production).
    - Phân tích dữ liệu theo khoảng thời gian `startDate`, `endDate`:
      - `overallStats`: `totalInstances`, `averageCompletionTimeHours` (hiệu số hoàn thành và khởi tạo), `delayedPercentage`.
      - `userPerformance`: `assignedTasks`, `averageProcessTimeHours` (hiệu số xử lý thực tế), `delayedTasksCount`.
    - Expose REST API endpoint `GET /api/v1/workflows/analytics/performance` trong [WorkflowController](../../../../open-erp-services/src/features/workflow/workflow.controller.ts) (phân quyền và lấy tenantId từ JWT token).
  - **Kiểm thử tự động (Unit Tests):**
    - Viết spec [workflow-deadline.consumer.spec.ts](../../../../open-erp-services/src/core/workflow/workflow-deadline.consumer.spec.ts) bao phủ 100% các kịch bản của delayed job, cron job scanner và module initialization.
    - Bổ sung unit tests kiểm tra logic phân tích KPI trong [workflow.service.spec.ts](../../../../open-erp-services/src/core/workflow/workflow.service.spec.ts) và route trong [workflow.controller.spec.ts](../../../../open-erp-services/src/features/workflow/workflow.controller.spec.ts).
    - Toàn bộ 158 tests của dự án đều chạy PASS 100%.

