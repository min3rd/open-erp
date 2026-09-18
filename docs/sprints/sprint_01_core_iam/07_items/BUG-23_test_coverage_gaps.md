# [BUG-23] Lỗ Hổng Bao Phủ Kiểm Thử Backend: Thiếu RestAssured và Nhiều Kịch Bản Trọng Yếu

- **Mã Lỗi**: BUG-23
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Bộ kiểm thử backend chỉ gồm 3 file test service-level (10 test PASS), chưa sử dụng RestAssured dù đã khai báo dependency và DoD yêu cầu, đồng thời thiếu nhiều kịch bản quan trọng và mã TC không khớp kế hoạch kiểm thử.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Chất lượng backend toàn Sprint 01 (IAM), điều kiện đóng Sprint (DoD)
- **Tệp liên quan**:
  - 3 file test service-level, tổng 10 `@Test`: `src/backend/src/test/java/com/vn9melody/openerp/modules/iam/service/AuthServiceTest.java`, `TwoFactorServiceTest.java`, `AccountServiceTest.java`.
  - `src/backend/pom.xml:102-106`: đã khai báo `io.rest-assured:rest-assured` nhưng chưa có test API-level nào sử dụng.
  - `docs/sprints/sprint_01_core_iam/sprint_plan.md` dòng 27 (DoD): "Backend Quarkus Java có đầy đủ Unit Test (JUnit 5 + RestAssured)..."; `04_confirmation/CONF-01_sprint_01_scope.md` dòng 45; `08_testing/test_plan.md` dòng 14-15.
  - Lệch mã TC: test dùng `TC-06` (`TwoFactorServiceTest.java:61`), `TC-07` (`TwoFactorServiceTest.java:85`), `TC-08..TC-10` (`AccountServiceTest.java:59,81,99`) không khớp `08_testing/test_plan.md` (`TC-06..TC-12`); các TC-11 (Refresh & Logout Token) và TC-12 (Personal Workspace) chưa được ánh xạ đúng.
- **Tài liệu đối chiếu**: [08_testing/test_plan.md](../08_testing/test_plan.md); [sprint_plan.md](../sprint_plan.md); [CONF-01](../04_confirmation/CONF-01_sprint_01_scope.md); AGENTS.md - "Chính Sách Kiểm Thử Thực Dụng" (JUnit 5 + RestAssured, chạy trên PostgreSQL/Redis thật, cấm H2).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Liệt kê toàn bộ file test backend: chỉ có 3 file service-level.
2. Chạy `mvn test` (backend) và ghi nhận 10 test PASS.
3. Tìm kiếm `RestAssured` trong `src/backend/src/test` → không có kết quả, dù dependency tồn tại ở `pom.xml:102-106`.
4. Đối chiếu danh sách kịch bản test_plan (TC-01 → TC-12) với các test hiện có và mã TC ghi trong `@DisplayName`.

## 3. Kết Quả Thực Tế (Actual Result)
- Không có test API-level/RestAssured; các test chỉ gọi trực tiếp tầng service.
- Không có test cho: cô lập dữ liệu đa Tenant (Tenant Data Isolation - TASK-108/FEAT-02 AC3), refresh/logout token (TC-11), khóa xác thực 2FA sau 3 lần nhập sai (TC-10), response envelope ở tầng API.
- Mã TC trong test lệch với `08_testing/test_plan.md`, gây khó đối chiếu bằng chứng PASS và che khuất các kịch bản chưa được kiểm thử (TC-11, TC-12).

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung Integration Test RestAssured gọi thật API trên PostgreSQL + Redis thật (không dùng H2), phủ tối thiểu: cô lập dữ liệu đa Tenant, refresh/logout token (blacklist), khóa 2FA sau 3 lần sai (`AUTH_2FA_ATTEMPTS_EXCEEDED`), và cấu trúc response envelope (`code`/`message`/`data`).
- Đồng bộ mã TC trong `@DisplayName` với ma trận TC-01 → TC-12 của `08_testing/test_plan.md`; bổ sung test cho các TC chưa có bằng chứng.
- Đáp ứng đầy đủ DoD "JUnit 5 + RestAssured" trước khi đóng Sprint.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
