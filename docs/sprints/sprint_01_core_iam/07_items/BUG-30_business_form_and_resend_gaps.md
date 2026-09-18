# [BUG-30] Thiếu Form Doanh Nghiệp 2 Bước, Live Subdomain Check Và Nút Gửi Lại OTP

- **Mã Lỗi**: BUG-30
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Màn đăng ký doanh nghiệp chưa triển khai form 2 bước và live subdomain check theo thiết kế; màn xác thực OTP cá nhân thiếu nút "Gửi lại mã" dù đã có key i18n.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Đăng ký doanh nghiệp (FEAT-02) và xác thực OTP đăng ký cá nhân (FEAT-01).
- **File liên quan**:
  - (a) `src/frontend/web/src/app/features/auth/register-business/register-business.component.html:18-107` — toàn bộ Admin/Company gộp trong một form duy nhất; trong khi `TASK-109` yêu cầu 2 bước (Step 1: Admin Info, Step 2: Company Info).
  - (b) `src/frontend/web/src/app/features/auth/register-business/register-business.component.html:33-39` — ô subdomain chỉ có `hint` tĩnh `slug (openerp.9ms.io.vn)`, chưa có kiểm tra trực tiếp (live availability) và chưa có preview URL `https://[slug].openerp.vn`.
  - (c) `src/frontend/web/src/app/features/auth/register-personal/register-personal.component.html:61-88` — màn xác thực OTP chỉ có nút Quay lại, thiếu nút "Gửi lại mã"; key `AUTH_RESEND_OTP` đã tồn tại trong i18n (`src/frontend/web/public/i18n/vi.json:58`, `en.json:58`).
- **Tài liệu đối chiếu**:
  - `docs/sprints/sprint_01_core_iam/07_items/FEAT-02_business_registration.md:30` — TASK-109 (form 2 bước).
  - FEAT-02 Kịch bản 2 (dòng 21) — subdomain trùng phải báo lỗi ngay trên trường Subdomain và gợi ý tên khả dụng.
  - DES-03 mục 2.2 (`docs/sprints/sprint_01_core_iam/06_designs/ui_ux/CORE_IAM_UI_SPEC.md:48`) — live availability check + preview URL `https://[slug].openerp.vn`.
  - DES-02 mục 2.10 (`docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md`) — API `POST /api/v1/auth/resend-verification`.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Mở `/register/business` — quan sát form: cả thông tin doanh nghiệp và quản trị viên nằm chung một bước.
2. Nhập subdomain đã tồn tại — không có phản hồi trực tiếp/preview URL khi đang gõ.
3. Mở `/register/personal`, đăng ký thành công và đến màn xác thực OTP — không tìm thấy nút "Gửi lại mã".

## 3. Kết Quả Thực Tế (Actual Result)
- (a) Form đăng ký doanh nghiệp là 1 bước, không đúng TASK-109.
- (b) Không có live availability check khi nhập subdomain; không hiển thị preview `https://[slug].openerp.vn` (chỉ có hint tĩnh `openerp.9ms.io.vn`); trùng subdomain chỉ báo khi submit.
- (c) Màn OTP cá nhân thiếu nút "Gửi lại mã", người dùng không thể yêu cầu gửi lại khi không nhận được mail.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- (a) Tách form đăng ký doanh nghiệp thành 2 bước: Step 1 Admin Info, Step 2 Company Info theo TASK-109.
- (b) Bổ sung kiểm tra trực tiếp tính khả dụng của subdomain (live check) và hiển thị preview URL `https://[slug].openerp.vn`, gợi ý tên khả dụng khi trùng theo FEAT-02 AC2/DES-03 mục 2.2.
- (c) Bổ sung nút "Gửi lại mã" tại màn xác thực OTP cá nhân, gọi API `POST /api/v1/auth/resend-verification` và hiển thị bằng key i18n `AUTH_RESEND_OTP` (kèm giới hạn thời gian chờ nếu có).

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
