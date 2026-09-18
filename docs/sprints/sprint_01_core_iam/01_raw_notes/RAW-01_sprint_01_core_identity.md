# [RAW-01] Ghi Chú Yêu Cầu Thô: Sprint 01 - Core Identity & Access Management

- **Ngày tiếp nhận**: 2026-09-17
- **Người cung cấp**: Khách hàng (User)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Trao đổi trực tiếp / Chat yêu cầu

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

Khách hàng yêu cầu triển khai Sprint đầu tiên của hệ thống gồm các chức năng cốt lõi sau:
> - Đăng ký tài khoản cá nhân
> - Đăng ký tài khoản quản trị doanh nghiệp
> - Đăng nhập
> - Quên mật khẩu
> - Xác thực 2FA
> - Quản lý tài khoản

---

## 2. Bối Cảnh Hệ Thống & Ràng Buộc Kèm Theo
1. **Kiến trúc Core SaaS Multi-Tenant**:
   - Hệ thống phục vụ nhiều khách thuê (Tenants).
   - Tách biệt rõ giữa tài khoản cá nhân và không gian doanh nghiệp (Tenant).
   - Một người dùng có thể tham gia nhiều Doanh nghiệp khác nhau.
2. **Quy chuẩn UI/UX**:
   - Giao diện nhỏ gọn, hiện đại, font chữ nhỏ (`text-xs`/`text-sm`), vuông vắn, ít margin.
   - Hạn chế tối đa Modal, ưu tiên Drawer xếp chồng và Split-Screen.
3. **Phân định nền tảng**:
   - Hỗ trợ đầy đủ trên Web Desktop (Angular 22 + Tailwind 4) và Mobile App (Ionic 8 + Angular).
