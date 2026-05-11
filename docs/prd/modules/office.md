# PRD — Phân hệ Office

# Điều hành và Cộng tác Nội bộ

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 09, Sprint 10  
**Trạng thái:** Đang soạn thảo

---

## 1. Mục tiêu phân hệ

Phân hệ **Office** là trung tâm điều hành và cộng tác nội bộ của doanh nghiệp, bao gồm:

- **Quản lý công việc:** Giao việc, theo dõi tiến độ, deadline, SLA
- **Quản lý văn bản:** Văn bản đến/đi, lưu trữ tài liệu, phê duyệt, chữ ký số
- **Soạn thảo cộng tác:** Tích hợp ONLYOFFICE để chỉnh sửa DOCX/XLSX/PPTX trực tiếp
- **Họp trực tuyến:** Tích hợp Jitsi Meet cho video conference nội bộ
- **Chat nội bộ:** Nhắn tin cá nhân, nhóm, theo dự án
- **Thông báo:** Real-time notification, email, mobile push

---

## 2. Tính năng chính theo MoSCoW

### Must Have

| Tính năng                  | Mô tả                                            |
| -------------------------- | ------------------------------------------------ |
| Giao và theo dõi công việc | Tạo task, gán người, deadline, trạng thái        |
| Workflow phê duyệt         | Quy trình phê duyệt đa cấp cho công việc/văn bản |
| Quản lý văn bản đến/đi     | Số hóa văn bản, theo dõi luồng xử lý             |
| Lưu trữ tài liệu           | File manager, thư mục, phân quyền xem/sửa        |
| Thông báo in-app           | Real-time notification trong ứng dụng            |
| Email notification         | Thông báo qua email cho các sự kiện quan trọng   |

### Should Have

| Tính năng                | Mô tả                                                    |
| ------------------------ | -------------------------------------------------------- |
| Tích hợp ONLYOFFICE      | Soạn thảo DOCX/XLSX/PPTX trực tiếp, co-editing real-time |
| Version control tài liệu | Lịch sử chỉnh sửa, khôi phục phiên bản cũ                |
| Quản lý lịch họp         | Lịch họp, mời người tham gia, nhắc nhở                   |
| Tích hợp Jitsi Meet      | Họp video trực tiếp trong hệ thống                       |
| Chat nhóm cơ bản         | Chat theo kênh/phòng ban, chia sẻ file                   |
| Tracking SLA             | Theo dõi thời gian xử lý, cảnh báo quá hạn               |
| AI tóm tắt văn bản       | Tóm tắt nội dung tài liệu dài                            |
| AI nhắc việc thông minh  | Nhắc deadline dựa trên hành vi và lịch sử                |

### Could Have

| Tính năng                | Mô tả                                    |
| ------------------------ | ---------------------------------------- |
| OCR tài liệu scan        | Nhận dạng chữ từ file scan/ảnh           |
| Chữ ký số                | Ký số tài liệu theo chuẩn Việt Nam       |
| Biên bản họp tự động     | AI tự ghi biên bản từ cuộc họp Jitsi     |
| Speech-to-text           | Chuyển giọng nói thành văn bản trong họp |
| Mobile push notification | Thông báo đẩy trên app mobile            |
| Tìm kiếm toàn văn        | Full-text search trong tài liệu          |

### Won't Have (v1.0)

- Quản lý dự án phức tạp kiểu Jira (Gantt chart, dependency graph)
- Marketplace tích hợp ứng dụng bên thứ ba
- Email client tích hợp

---

## 3. User Flows chính

### 3.1 Flow: Giao và xử lý công việc

```
Manager tạo công việc
    → Nhập tiêu đề, mô tả, deadline, priority
        → Gán cho nhân viên (cá nhân/nhóm)
            → Nhân viên nhận thông báo
                → Nhân viên cập nhật tiến độ / trạng thái
                    → Manager theo dõi real-time trên dashboard
                        → Khi quá SLA → AI tự động escalate
                            → Công việc hoàn thành → Manager review → Đóng task
```

### 3.2 Flow: Xử lý văn bản đến

```
Văn bản đến được nhập vào hệ thống
    → Phân loại, số hóa (scan → OCR)
        → Gán số đến, chọn phòng ban xử lý
            → Giao xử lý cho nhân viên phụ trách
                → Nhân viên soạn văn bản phúc đáp (trên ONLYOFFICE)
                    → Trình ký qua workflow phê duyệt
                        → Ký số → Ban hành
                            → Lưu vào kho tài liệu
```

### 3.3 Flow: Họp trực tuyến Jitsi

```
Người tổ chức tạo lịch họp
    → Nhập tiêu đề, thời gian, mời người tham gia
        → Hệ thống gửi email/notification cho người được mời
            → Đến giờ họp → Click "Vào họp" → Mở Jitsi Meet
                → Sau khi họp xong:
                    → AI tóm tắt nội dung họp
                        → Trích xuất action items
                            → Tạo task tự động từ action items
                                → Gửi biên bản họp cho tất cả người tham dự
```

---

## 4. Business Rules quan trọng

- **BR-OF-001:** Mỗi văn bản đến phải có số đến và người xử lý trước khi đóng
- **BR-OF-002:** Tài liệu sau khi được ban hành (ký số) không được phép chỉnh sửa nội dung
- **BR-OF-003:** Workflow phê duyệt phải đủ số cấp phê duyệt theo cấu hình của từng loại văn bản
- **BR-OF-004:** SLA được tính từ thời điểm giao việc đến khi hoàn thành; giờ làm việc được tính theo lịch của tenant
- **BR-OF-005:** File tải lên phải kiểm tra virus scan và giới hạn dung lượng theo quota tenant
- **BR-OF-006:** Cuộc họp được record chỉ khi tất cả người tham gia đồng ý
- **BR-OF-007:** Notification ưu tiên cao (deadline hôm nay) luôn gửi qua cả in-app và email

---

## 5. Tích hợp với phân hệ khác

| Phân hệ              | Loại tích hợp | Mô tả                                                   |
| -------------------- | ------------- | ------------------------------------------------------- |
| **System Admin**     | Phụ thuộc     | Dùng user, phòng ban, phân quyền                        |
| **HR**               | Read          | Lấy danh sách nhân viên, lịch làm việc                  |
| **Sale & Logistics** | Bidirectional | Tạo task từ đơn hàng; workflow xử lý hợp đồng bán hàng  |
| **Accounting**       | Read          | Văn bản kế toán, phê duyệt chi phí                      |
| **AI Agent**         | Bidirectional | AI tóm tắt tài liệu, ghi biên bản họp, tạo task tự động |
| **Dashboard**        | Read          | KPI công việc, SLA, tiến độ phòng ban                   |
| **ONLYOFFICE**       | External      | Document editing và co-editing                          |
| **Jitsi Meet**       | External      | Video conferencing                                      |
