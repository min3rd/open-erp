# US-SA-015: AI phát hiện hành vi đăng nhập bất thường

**ID:** US-SA-015  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — AI Security  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** hệ thống AI tự động phát hiện và cảnh báo khi có hành vi đăng nhập bất thường,  
> **Để** bảo vệ doanh nghiệp khỏi các nguy cơ bảo mật mà không cần theo dõi thủ công.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Hệ thống AI phát hiện và tạo cảnh báo khi: đăng nhập từ quốc gia/vị trí địa lý chưa từng sử dụng, đăng nhập vào giờ bất thường (ví dụ: 2–5 giờ sáng), đăng nhập từ nhiều IP khác nhau trong thời gian ngắn, đăng nhập thất bại nhiều lần liên tiếp
- [ ] Cảnh báo hiển thị trong dashboard của Tenant Admin với: mức độ rủi ro (thấp/trung/cao), người dùng liên quan, chi tiết sự kiện, thời gian
- [ ] Tenant Admin có thể xem chi tiết từng cảnh báo và đánh dấu là "đã xử lý" hoặc "false positive"
- [ ] Khi phát hiện rủi ro cao, hệ thống gửi email thông báo cho Tenant Admin ngay lập tức
- [ ] AI không tự khóa tài khoản — chỉ cảnh báo; Tenant Admin quyết định hành động
- [ ] Cảnh báo có thể cấu hình ngưỡng theo nhu cầu của tenant

---

## Độ ưu tiên: **Trung bình (Should Have)**

## Ước tính: **8 story points**
