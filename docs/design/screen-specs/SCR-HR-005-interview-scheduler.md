# SCR-HR-005 — Interview Scheduler

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-005 |
| Route | /hr/recruitment/interviews/schedule |
| Luồng liên quan | FLOW-HR-S03-REC-001 |
| Mục tiêu | Tạo lịch phỏng vấn hợp lệ, không trùng lịch interviewer và đảm bảo lead time tối thiểu |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: thông tin ứng viên và requisition.
- Vùng B: form lịch phỏng vấn (type, thời gian, interviewer, địa điểm/link).
- Vùng C: mini calendar và conflict panel.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | B:8 cột, C:4 cột | Gap 16px |
| <1024px | 4 cột | C xuống dưới, calendar dạng tab | Padding 16px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| interview-form | Vùng B | pristine, invalid, submitting | candidateId, requisitionId | scheduledAt >= now + 24h |
| interviewer-multi-select | Vùng B | loading, selected | interviewers[] | Không cho chọn interviewer inactive |
| conflict-check-panel | Vùng C | clear, conflict | schedulePreview | Cập nhật realtime sau mỗi thay đổi |
| interview-type-selector | Vùng B | PHONE, ONLINE, IN_PERSON | interviewType | ONLINE bắt buộc meeting link |
| submit-schedule-button | Footer | enabled, loading, disabled | formValidity | Disable khi có conflict |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Chọn thời gian phỏng vấn | Kiểm tra lead time và conflict | Hiển thị trạng thái conflict ngay trên panel |
| Nhấn Tạo lịch | Gọi API tạo interview | Toast thành công, điều hướng SCR-HR-006 |
| Chọn interview type ONLINE | Bật bắt buộc trường meeting link | Hiển thị dấu bắt buộc và validate |
| Xung đột lịch interviewer | Chặn submit | Hiển thị lỗi nghiệp vụ rõ ràng |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Mini calendar highlight slot đã chọn bằng transition 120ms.
- Conflict panel đổi màu ngay khi trạng thái thay đổi.
- Khi tạo lịch thành công, hiển thị check animation ngắn.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: lịch hợp lệ, không conflict, tạo thành công.
- Validation error: lịch < 24h, thiếu interviewer, thiếu meeting link (ONLINE).
- Locked: slot vừa được đặt bởi phiên khác trong lúc submit.
- Permission: chỉ HR Staff/HR Manager mới tạo lịch.
- No-data: không có interviewer khả dụng ở khung giờ chọn.
- Offline: không thể tạo lịch, lưu tạm draft cục bộ.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: candidateId, interviewType, scheduledAt, interviewers[], locationOrMeetingLink.
- Thời gian hiển thị theo múi giờ tenant, format dd/MM/yyyy HH:mm.
- Tên interviewer hiển thị fullName + department.
