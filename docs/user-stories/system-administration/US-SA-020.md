# US-SA-020: Đăng nhập bằng OAuth2 (Google / Microsoft)

**ID:** US-SA-020  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Authentication  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** người dùng,  
> **Tôi muốn** đăng nhập bằng tài khoản Google hoặc Microsoft của công ty,  
> **Để** không cần nhớ thêm mật khẩu và đăng nhập nhanh hơn.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Trang đăng nhập hiển thị nút "Đăng nhập với Google" và "Đăng nhập với Microsoft"
- [ ] Sau khi xác thực thành công qua OAuth2, hệ thống kiểm tra email có trong tenant hay không
- [ ] Nếu email tồn tại trong tenant → đăng nhập thành công, cấp JWT token bình thường
- [ ] Nếu email không tồn tại → hiển thị thông báo rõ ràng, không tự động tạo tài khoản
- [ ] Tenant Admin có thể bật/tắt tính năng OAuth2 cho tenant của mình
- [ ] Người dùng đăng nhập OAuth2 không cần đặt mật khẩu trong hệ thống
- [ ] Đăng nhập OAuth2 được ghi audit log như đăng nhập thông thường

---

## Độ ưu tiên: **Trung bình (Should Have)**  
## Ước tính: **5 story points**
