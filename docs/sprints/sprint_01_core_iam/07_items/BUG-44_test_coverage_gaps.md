# [BUG-44] Khoảng Trống Test Coverage Backend Sau Re-test

- **Mã Lỗi**: BUG-44
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Sau re-test (22/22 test PASS), vẫn còn các nhánh nghiệp vụ quan trọng chưa được automated test bao phủ, đối chiếu ma trận kịch bản tại `08_testing/test_plan.md` chưa có test tương ứng.

- **Môi trường**: Local (PostgreSQL + Redis thật, không H2)
- **Tính Năng / Module Bị Ảnh Hưởng**: Core IAM — Multi-tenant, 2FA, password, brute-force.
- **File Liên Quan**:
  - `src/backend/src/test/java/.../AuthServiceTest.java`, `AuthResourceApiTest.java`, `TwoFactorServiceTest.java`, `AccountServiceTest.java`, `AccountTenantIsolationApiTest.java` — các nhánh dưới đây chưa có test.
  - `docs/sprints/sprint_01_core_iam/08_testing/test_plan.md` — ma trận TC đối chiếu.
- **Các khoảng trống cụ thể**:
  1. **Select-tenant / multi-tenant**: chưa có test cho luồng `POST /api/v1/auth/select-tenant` (chọn workspace sau đăng nhập nhiều tenant).
  2. **Backup code single-use**: chưa test xác nhận một backup code chỉ dùng được 1 lần (dùng lại lần 2 phải bị từ chối).
  3. **Disable 2FA sai code**: chưa test trường hợp nhập sai mật khẩu hoặc sai OTP khi tắt 2FA (phải trả `ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE`).
  4. **Change-password revoke other sessions**: chưa test đổi mật khẩu phải thu hồi toàn bộ session khác (giữ session hiện tại).
  5. **Hết hạn lock brute-force**: chưa test sau khi hết thời gian khóa 15 phút, tài khoản được mở khóa và đăng nhập lại được (chỉ mới test bị khóa).
- **Tài Liệu Đối Chiếu**: AGENTS.md — "Chính Sách Kiểm Thử Thực Dụng": bắt buộc Unit Test cho logic nghiệp vụ, phân quyền Tenant; chạy trên PostgreSQL/Redis thật.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Liệt kê các test class hiện có trong `src/backend/src/test`.
2. Đối chiếu với ma trận TC trong `test_plan.md` và các AC của FEAT-01 → FEAT-06.
3. Xác nhận 5 nhánh nghiệp vụ nêu trên không có test nào tham chiếu.

## 3. Kết Quả Thực Tế (Actual Result)
- 5 nhánh nghiệp vụ quan trọng chưa được automated test bao phủ; hồi quy ở các nhánh này chỉ phát hiện được bằng manual test.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung test cho đủ 5 nhánh trên, chạy trực tiếp trên PostgreSQL + Redis thật (không H2, không mock DB).
- Cập nhật `test_plan.md` ghi nhận các TC mới; tổng số test tăng tương ứng và `mvn test` vẫn BUILD SUCCESS.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
```
mvn test -> Tests run: 22, Failures: 0, Errors: 0
Grep "select-tenant|single-use|revokeOther|unlock" in src/backend/src/test -> no matching tests
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: Bổ sung 8 test (multi-tenant select, backup code single-use, disable sai code, change-password revoke session, brute-force lock expiry, check-slug, 401 envelope); tổng 30/30 PASS.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
