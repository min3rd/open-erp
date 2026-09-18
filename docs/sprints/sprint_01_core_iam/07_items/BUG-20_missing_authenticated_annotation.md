# [BUG-20] Backend Thiếu Annotation Phân Quyền @Authenticated/@RolesAllowed và Cấu Hình Security

- **Mã Lỗi**: BUG-20
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Backend Quarkus không khai báo bất kỳ annotation phân quyền (`@Authenticated`, `@RolesAllowed`, `@PermitAll`) hay cấu hình `quarkus.http.auth.permission.*`. Các endpoint `/api/v1/account` chỉ được bảo vệ bằng kiểm tra thủ công `jwt.getSubject()`, thiếu defense-in-depth và dễ hở quyền nếu cấu hình/mã nguồn thay đổi.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Toàn bộ nhóm API tài khoản (`/api/v1/account`), phân quyền chức năng, FEAT-06
- **Tệp liên quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AccountResource.java:152-161`: chỉ kiểm tra thủ công `jwt == null || jwt.getSubject() == null` trong `getAuthenticatedUserId()`.
  - Toàn bộ `src/backend`: không tìm thấy `@Authenticated`, `@RolesAllowed`, `@PermitAll` hoặc `quarkus.http.auth.permission.*` (đã grep xác nhận).
- **Tài liệu đối chiếu**: AGENTS.md - "Ranh giới Core: Phân quyền chức năng, Phân quyền dữ liệu"; [DES-02 - CORE_IAM_API_SPEC.md](../06_designs/api/CORE_IAM_API_SPEC.md) mục 3 (yêu cầu `Authorization: Bearer <access_token>` cho nhóm `/api/v1/account`).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Mở `AccountResource.java`, kiểm tra các annotation trên class/method.
2. Chạy lệnh tìm kiếm `@Authenticated|@RolesAllowed|@PermitAll|quarkus.http.auth.permission` trong `src/backend` → không có kết quả.
3. Kiểm tra `application.properties` của backend, xác nhận không có cấu hình permission cho `/api/v1/account/*`.
4. Gọi một endpoint account khi không có token hoặc token thiếu claim để thấy việc bảo vệ hoàn toàn phụ thuộc code thủ công.

## 3. Kết Quả Thực Tế (Actual Result)
- Không có cơ chế phân quyền khai báo (declarative) ở tầng framework; mọi endpoint phụ thuộc 100% vào lời gọi thủ công `getAuthenticatedUserId()`.
- Nếu một endpoint mới quên gọi helper này, hoặc cấu hình security bị nới lỏng, API có thể bị truy cập trái phép; các API không có `@RolesAllowed` nên không chặn được user thiếu quyền.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung `@Authenticated` (hoặc `@RolesAllowed`) cho các resource yêu cầu đăng nhập, `@PermitAll` cho endpoint công khai (login/register/forgot-password...).
- Cấu hình `quarkus.http.auth.permission.*` bảo vệ `/api/v1/account/*` bằng Bearer token theo DES-02 mục 3.
- Giữ kiểm tra thủ công như lớp bổ sung (defense-in-depth), đảm bảo endpoint trả 401 nhất quán khi thiếu/sai token.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
