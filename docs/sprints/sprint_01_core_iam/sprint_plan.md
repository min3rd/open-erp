# Kế Hoạch Sprint 01: Core Identity, Access & Account Management

- **Thời Gian**: 2026-09-18 đến 2026-10-02 (2 tuần)
- **Mục Tiêu Sprint (Sprint Goal)**: Xây dựng nền tảng định danh, xác thực và quản lý tài khoản người dùng cốt lõi (Core IAM) cho hệ thống SaaS Multi-tenant Open-ERP, đảm bảo an toàn bảo mật, cô lập dữ liệu theo Tenant và trải nghiệm người dùng hiện đại, nhỏ gọn, không dùng modal.
- **Phụ Trách Điều Phối**: PM Agent

---

## 1. Danh Sách Hạng Mục Cam Kết Trong Sprint (Sprint Backlog)

Mọi tính năng được quản lý bằng từng file riêng biệt trong thư mục `07_items/` để theo dõi tiến độ và kiểm soát chất lượng:

| Mã Tính Năng | Tiêu Đề Tính Năng | Phân Loại | Mức Độ Ưu Tiên | Phụ Trách | Trạng Thái | File Chi Tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | Đăng ký tài khoản cá nhân | Feature | High | BA / Dev | In Progress | [FEAT-01.md](07_items/FEAT-01_personal_registration.md) |
| **FEAT-02** | Đăng ký tài khoản quản trị doanh nghiệp (Tạo Tenant) | Feature | Critical | BA / Dev | In Progress | [FEAT-02.md](07_items/FEAT-02_business_registration.md) |
| **FEAT-03** | Đăng nhập & Xác định ngữ cảnh Tenant (Multi-tenant Login) | Feature | Critical | BA / Dev | In Progress | [FEAT-03.md](07_items/FEAT-03_authentication_login.md) |
| **FEAT-04** | Quên mật khẩu & Khôi phục tài khoản qua Email | Feature | High | BA / Dev | In Progress | [FEAT-04.md](07_items/FEAT-04_forgot_password.md) |
| **FEAT-05** | Xác thực 2 yếu tố (2FA - TOTP RFC 6238) | Feature | High | BA / Dev | In Progress | [FEAT-05.md](07_items/FEAT-05_two_factor_auth.md) |
| **FEAT-06** | Quản lý tài khoản (Profile, 2FA Management, Sessions qua Drawer Anti-Modal) | Feature | Medium | BA / Dev | In Progress | [FEAT-06.md](07_items/FEAT-06_account_management.md) |

---

## 2. Tiêu Chí Nghiệm Thu Đóng Sprint (Definition of Done - DoD)
Sprint 01 **CHỈ ĐƯỢC PHÉP ĐÓNG** khi thỏa mãn 100% các điều kiện sau:
- [ ] **100% item mức `Critical` và `High` phải đạt trạng thái `Done`** (không còn bất kỳ task/bug nào > Medium chưa giải quyết).
- [ ] Backend Quarkus Java có đầy đủ Unit Test (JUnit 5 + RestAssured) bao phủ logic xác thực, phân quyền và cô lập Tenant.
- [ ] Frontend Angular 22 & Ionic 8 hoàn thành kiểm thử thủ công trực tiếp trên Trình duyệt (Browser Manual Testing), không có lỗi console.
- [ ] Giao diện tuân thủ quy chuẩn UI/UX ERP: font chữ nhỏ (`text-xs`/`text-sm`), viền vuông sắc nét (`rounded-none`), không sử dụng Modal pop-up (dùng Drawer xếp chồng & Split-View).
- [ ] Có tài liệu hướng dẫn sử dụng kèm hình ảnh trực quan tại `docs/06_user_guides/`.
- [ ] Cập nhật biên bản nghiệm thu `sprint_review.md` tại thư mục này.
