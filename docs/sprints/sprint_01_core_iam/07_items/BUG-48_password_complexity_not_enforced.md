# [BUG-48] Chưa Enforce Độ Phức Tạp Mật Khẩu (Hoa + Thường + Số + Ký Tự Đặc Biệt)

- **Mã Lỗi**: BUG-48
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (audit API contract)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01 (hậu kiểm sau đóng Sprint)
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> ANL-01 và DES-02 quy định mật khẩu phải **≥ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt**; DES-02 có mã lỗi `VALIDATION_PASSWORD_TOO_WEAK`. Nhưng backend chỉ validate `@Size(min=8,max=64)`, không kiểm tra độ phức tạp → mật khẩu yếu như `password123` vẫn được chấp nhận.

- **Môi trường**: Local (backend 8088)
- **File Liên Quan**: `modules/iam/dto/PersonalRegisterRequest.java`, `BusinessRegisterRequest.java` (AdminInfo), `ResetPasswordRequest.java`.
- **Đối Chiếu**: ANL-01 mục 3.1, DES-02 mục 2.1/2.7 + bảng i18n `VALIDATION_PASSWORD_TOO_WEAK`.

## 2. Các Bước Tái Hiện
1. `POST /api/v1/auth/register/personal` với `password: "password123"`.
2. Quan sát: đăng ký thành công (không có lỗi độ phức tạp).

## 3. Kết Quả Thực Tế
- Chỉ lỗi khi mật khẩu ngoài khoảng 8-64 ký tự; không enforce hoa/thường/số/đặc biệt.

## 4. Kết Quả Kỳ Vọng
- Thêm `@Pattern` cho mật khẩu đăng ký cá nhân, đăng ký doanh nghiệp (admin) và đặt lại mật khẩu: ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt (`[^A-Za-z0-9]`).
- Lỗi trả về khuôn mẫu 4: `errors: [{field:"password", code:"VALIDATION_PASSWORD_TOO_WEAK", params:{}}]`.
- i18n key `VALIDATION_PASSWORD_TOO_WEAK` đủ vi/en ở Web + Mobile.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
POST /auth/register/personal {password:"password123"} -> 201 (mong đợi 400 VALIDATION_PASSWORD_TOO_WEAK)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test (curl + `mvn test`) và xác nhận.
- [x] Không gây lỗi phát sinh.
- **Ghi chú QA (2026-09-18)**: Đã thêm @Pattern (hoa+thường+số+đặc biệt) cho đăng ký cá nhân/doanh nghiệp và đặt lại mật khẩu; ValidationExceptionMapper trả code VALIDATION_PASSWORD_TOO_WEAK; i18n đủ Web/Mobile; backend 36/36 test PASS; curl verify weak password 400 đúng khuôn mẫu 4, mật khẩu mạnh vẫn 201.
