# PRD — Phân hệ HR
# Quản lý Nhân sự

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 03, Sprint 04  
**Trạng thái:** Đang soạn thảo  

---

## 1. Mục tiêu phân hệ

Phân hệ **HR** số hóa toàn bộ vòng đời nhân sự trong doanh nghiệp:

- **Tuyển dụng:** Từ đăng tuyển → tiếp nhận CV → phỏng vấn → onboarding
- **Quản lý nhân sự:** Hồ sơ nhân viên, hợp đồng, quá trình công tác
- **Chấm công:** Ca làm việc, check-in/out, tăng ca, nghỉ phép
- **Đánh giá hiệu suất:** KPI cá nhân, đánh giá định kỳ, lộ trình phát triển

---

## 2. Tính năng chính theo MoSCoW

### Must Have

| Tính năng | Mô tả |
|---|---|
| Hồ sơ nhân viên | Thông tin cá nhân, liên hệ, hình ảnh, tài liệu đính kèm |
| Quản lý hợp đồng | Tạo/ký hợp đồng, theo dõi hết hạn, gia hạn |
| Cơ cấu tổ chức | Phòng ban, chức danh, cấp bậc, quản lý trực tiếp |
| Quản lý ca làm việc | Định nghĩa ca, phân ca cho nhân viên |
| Chấm công | Check-in/out, tổng hợp giờ công theo kỳ |
| Quản lý nghỉ phép | Loại phép, số ngày phép, quy trình duyệt |
| Quản lý tăng ca | Đăng ký tăng ca, phê duyệt, tính hệ số |

### Should Have

| Tính năng | Mô tả |
|---|---|
| Tuyển dụng cơ bản | Vị trí tuyển dụng, nhận CV, lịch phỏng vấn |
| Đánh giá KPI | Đặt mục tiêu, đánh giá theo kỳ |
| Quản lý khen thưởng / kỷ luật | Ghi nhận thành tích, xử lý vi phạm |
| Quản lý tài sản nhân viên | Thiết bị, công cụ giao cho nhân viên |
| AI phát hiện rủi ro nghỉ việc | Cảnh báo nhân viên có nguy cơ nghỉ việc |
| AI cân đối lịch làm việc | Gợi ý phân công ca tối ưu |
| Báo cáo nhân sự | Báo cáo biến động, chấm công, nghỉ phép |

### Could Have

| Tính năng | Mô tả |
|---|---|
| Onboarding workflow | Checklist hội nhập cho nhân viên mới |
| Quản lý đào tạo | Lịch đào tạo, ghi nhận kết quả |
| AI sàng lọc CV | Tự động đánh giá CV ứng viên |
| Lộ trình nghề nghiệp | Cài đặt career path, gợi ý phát triển |
| Tích hợp chấm công sinh trắc học | Kết nối máy chấm công vân tay/nhận diện khuôn mặt |

### Won't Have (v1.0)

- Tính lương (Payroll) tự động
- Quản lý phúc lợi (Benefits) phức tạp
- Tích hợp bảo hiểm xã hội trực tuyến

---

## 3. User Flows chính

### 3.1 Flow: Tuyển dụng

```
Trưởng phòng tạo Nhu cầu tuyển dụng
    → HR duyệt → Đăng tin tuyển dụng
        → Ứng viên nộp CV (qua email/link)
            → HR nhập CV vào hệ thống
                → AI sàng lọc & chấm điểm phù hợp
                    → HR mời phỏng vấn → Gửi email tự động
                        → Ghi nhận kết quả phỏng vấn
                            → Gửi offer → Ứng viên xác nhận
                                → Tạo hồ sơ nhân viên mới
                                    → Onboarding checklist
```

### 3.2 Flow: Nghỉ phép

```
Nhân viên tạo đơn nghỉ phép
    → Chọn loại phép, ngày, lý do
        → Hệ thống kiểm tra số ngày phép còn lại
            → Gửi thông báo cho quản lý trực tiếp
                → Quản lý duyệt / từ chối
                    → Nhân viên nhận thông báo kết quả
                        → Cập nhật lịch làm việc tự động
                            → Trừ ngày phép khỏi số dư
```

### 3.3 Flow: Chấm công và Tổng hợp

```
Nhân viên check-in (app/web/thiết bị)
    → Hệ thống ghi nhận giờ vào
        → Nhân viên check-out
            → Tính giờ công thực tế
                → Cuối kỳ: Tổng hợp công theo ca, tăng ca, phép
                    → Quản lý duyệt bảng công
                        → Xuất báo cáo chấm công kỳ
```

---

## 4. Business Rules quan trọng

- **BR-HR-001:** Mỗi nhân viên chỉ thuộc một phòng ban chính, nhưng có thể tham gia nhiều dự án/nhóm
- **BR-HR-002:** Hợp đồng hết hạn trong 30 ngày → cảnh báo tự động cho HR và quản lý
- **BR-HR-003:** Số ngày phép được tính theo năm dương lịch, không chuyển sang năm sau (có thể cấu hình)
- **BR-HR-004:** Nghỉ phép vượt số dư cần phê duyệt đặc biệt từ cấp cao hơn
- **BR-HR-005:** Tăng ca phải được đăng ký và phê duyệt trước khi thực hiện (có thể cấu hình)
- **BR-HR-006:** Nhân viên nghỉ việc → tài khoản đăng nhập bị vô hiệu hóa tự động sau ngày cuối làm việc
- **BR-HR-007:** Lịch sử nhân sự (hợp đồng, khen thưởng, kỷ luật) là bất biến sau khi ký/phê duyệt

---

## 5. Tích hợp với phân hệ khác

| Phân hệ | Loại tích hợp | Mô tả |
|---|---|---|
| **System Admin** | Bidirectional | Nhân viên được tạo → tự động tạo user account; phân quyền theo chức danh |
| **Office** | Read | Office lấy danh sách nhân viên để gán công việc, invite họp |
| **Sale & Logistics** | Read | Lấy danh sách nhân viên sale/kho để gán KPI, phân công |
| **Accounting** | Read | Dữ liệu chấm công/tăng ca phục vụ tính lương (khi có payroll) |
| **AI Agent** | Bidirectional | AI phân tích dữ liệu nhân sự để đề xuất; HR dùng AI để sàng lọc CV |
| **Dashboard** | Read | Dashboard tổng hợp KPI nhân sự, biến động nhân sự |

---

## 6. Phạm vi Sprint 03 (HR Core)

### 6.1 In-scope Sprint 03

- Tuyển dụng cơ bản: requisition, candidate pipeline, interview, offer và onboarding init ở mức tối thiểu
- Hồ sơ nhân viên: tạo/cập nhật/tra cứu hồ sơ, dữ liệu nhạy cảm được kiểm soát theo quyền
- Hợp đồng lao động: lifecycle cơ bản (`DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`), cảnh báo hết hạn 30/7 ngày
- Cơ cấu/chức danh HR cơ bản: đồng bộ phòng ban, chức danh, quản lý trực tiếp phục vụ HR Core
- Web UI cho tuyển dụng, hồ sơ nhân viên, hợp đồng và cơ cấu HR
- Mobile self-service tối thiểu cho nhân viên: profile cơ bản, contract summary, onboarding summary
- Test plan tích hợp sprint để nghiệm thu luồng end-to-end

### 6.2 Out-of-scope Sprint 03

- Chấm công, ca làm việc, nghỉ phép, tăng ca
- Đánh giá KPI nhân sự và báo cáo nhân sự nâng cao
- AI sàng lọc CV, AI dự đoán nghỉ việc, AI tối ưu lịch làm việc
- Payroll tự động, benefits phức tạp, tích hợp bảo hiểm xã hội
- Onboarding workflow đầy đủ nhiều bước (Sprint 03 chỉ khởi tạo onboarding init)

### 6.3 Điều kiện hoàn thành Sprint 03 (Definition of Done ở mức PO)

- Có đủ bộ user story HR Sprint 03 và truy vết 1-1 với task breakdown kỹ thuật
- Luồng tuyển dụng cơ bản chạy thông suốt từ requisition đến offer/onboarding init
- Luồng hồ sơ nhân viên, hợp đồng và cơ cấu/chức danh HR vận hành được trên web
- Luồng self-service mobile tối thiểu hoạt động với phân quyền đúng phạm vi nhân viên
- Có test plan Sprint 03 bao phủ chức năng P0/P1 và ma trận quyền chính
