# [RAW-01] Ghi Chú Yêu Cầu Thô: Quản Lý Toàn Bộ Hệ Thống Bằng Super Admin

- **Ngày tiếp nhận**: 2026-09-18
- **Người cung cấp**: Khách hàng (Product Owner / Founder)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Yêu cầu trực tiếp từ khách hàng

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

> "Cần có cơ chế Super Admin để quản lý toàn bộ hệ thống Open-ERP. Là chủ nền tảng SaaS, tôi phải có quyền lực cao nhất để:
> 1. Xem danh sách tất cả các doanh nghiệp (Tenants) đang dùng hệ thống, biết họ dùng gói gì, bao nhiêu user, bao nhiêu dung lượng.
> 2. Có thể khóa tạm thời hoặc mở khóa một doanh nghiệp nếu họ chưa trả phí hoặc vi phạm điều khoản.
> 3. Xem danh sách tất cả người dùng trong toàn hệ thống, có thể khóa khẩn cấp tài khoản hoặc hỗ trợ đặt lại bảo mật khi người dùng bị mất quyền truy cập.
> 4. Đặc biệt, khi khách hàng báo lỗi khó, kỹ thuật viên cấp cao hoặc Super Admin có thể đăng nhập vào không gian của khách hàng đó (Login-as / Impersonate) để kiểm tra đúng những gì khách hàng đang thấy, nhưng phải cực kỳ an toàn, có ghi log lại ai vào lúc nào, tại sao vào, và trên giao diện phải báo rõ là đang vào bằng quyền hỗ trợ đại diện để tránh hiểu lầm.
> 5. Cần một nơi để tôi xem tình trạng hệ thống có khỏe không (database, redis, kafka) và xem nhật ký các hành động nhạy cảm."

---

## 2. Bối Cảnh & Các Ràng Buộc Kèm Theo

1. **Phân biệt rạch ròi giữa Platform Admin và Tenant Admin**:
   - `Super Admin` là người vận hành nền tảng (Platform Operator), không can thiệp vào các giao dịch hàng ngày của doanh nghiệp trừ khi có yêu cầu hỗ trợ.
   - Dữ liệu của các Tenant vẫn phải được cô lập tuyệt đối; Super Admin chỉ nhìn thấy dữ liệu Tenant khi chủ động kích hoạt phiên Impersonation hợp lệ.
2. **Tuân thủ quy chuẩn kiểm toán (Compliance & Audit)**:
   - Mọi hành động nhạy cảm của Super Admin (Khóa tenant, Đổi quota, Impersonate, Reset mật khẩu) bắt buộc ghi vào bảng Audit Log riêng, không thể bị xóa hay chỉnh sửa bởi bất kỳ ai.
3. **Quy chuẩn giao diện**:
   - Giao diện quản trị Super Admin phải có nhận diện khác biệt (ví dụ: Thanh Topbar hoặc huy hiệu màu đỏ/tím đậm) để phân biệt rõ với giao diện làm việc thông thường của Tenant.
   - Thiết kế Anti-Modal: Mọi tác vụ cấu hình quota, xem chi tiết tenant đều hiển thị qua Drawer trượt từ cạnh phải.
