# US-SA-018: Cấu hình chính sách mật khẩu cho Tenant

**ID:** US-SA-018  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Security Policy  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** cấu hình chính sách mật khẩu cho toàn bộ doanh nghiệp,  
> **Để** đảm bảo tất cả tài khoản đáp ứng yêu cầu bảo mật phù hợp với chính sách nội bộ.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin cấu hình được: độ dài tối thiểu mật khẩu, yêu cầu chữ hoa/thường/số/ký tự đặc biệt, số lần không được dùng lại mật khẩu cũ, thời gian hết hạn mật khẩu (30/60/90/180 ngày, hoặc không hết hạn)
- [ ] Cấu hình được số lần đăng nhập sai tối đa trước khi khóa tài khoản và thời gian tự mở khóa
- [ ] Khi mật khẩu sắp hết hạn (7 ngày trước), người dùng nhận cảnh báo khi đăng nhập
- [ ] Chính sách áp dụng cho tất cả người dùng trong tenant kể từ khi lưu
- [ ] Người dùng có mật khẩu không đáp ứng chính sách mới bị yêu cầu đổi mật khẩu lần đăng nhập tiếp theo

---

## Độ ưu tiên: **Trung bình (Should Have)**  
## Ước tính: **3 story points**
