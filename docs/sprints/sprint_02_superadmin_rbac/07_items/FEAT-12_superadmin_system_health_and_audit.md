# [FEAT-12] Giám Sát Sức Khỏe Hạ Tầng & Nhật Ký Kiểm Toán Toàn Nền Tảng

- **Mã Tính Năng**: FEAT-12
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Platform Super Admin, tôi muốn xem tình trạng hoạt động của toàn bộ hạ tầng (PostgreSQL Primary/Replica, Redis, Kafka) và xem nhật ký kiểm toán (Audit Trail) để kịp thời phát hiện sự cố hiệu năng và truy vết các hành vi quản trị nhạy cảm.
- **Tài liệu phân tích**: [ANL-01_superadmin_platform_management.md](../02_analysis/ANL-01_superadmin_platform_management.md)
- **Tài liệu giải pháp**: [SOL-01_superadmin_architecture_and_security.md](../05_solutions/SOL-01_superadmin_architecture_and_security.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Giám sát trạng thái CSDL**: Given Super Admin mở màn hình `/platform/health`, When hệ thống truy vấn trạng thái, Then hiển thị rõ tình trạng PostgreSQL Primary (UP), số kết nối đang dùng, tình trạng bản sao Replica và độ trễ Replication Lag tính bằng mili-giây.
- [ ] **Kịch bản 2: Giám sát Redis & Kafka**: Given hệ thống đang vận hành, When Super Admin kiểm tra, Then hiển thị trạng thái kết nối Redis, dung lượng RAM sử dụng, số lượng client kết nối và trạng thái Broker Kafka.
- [ ] **Kịch bản 3: Truy vết nhật ký bất biến**: Given các thao tác nhạy cảm (khóa tenant, đổi quota, impersonation) diễn ra, When Super Admin mở màn hình `/platform/audit-logs`, Then hiển thị danh sách nhật ký có thời gian, IP, tài khoản thực hiện, và chi tiết JSON trước/sau khi đổi.
- [ ] **Kịch bản 4: Chống sửa đổi nhật ký (Anti-Tamper)**: Given bảng `platform_audit_logs`, When cố gắng thực hiện lệnh `UPDATE` hoặc `DELETE` trực tiếp trong SQL, Then Trigger CSDL chặn đứng và báo lỗi `CANNOT MODIFY OR DELETE AUDIT TRAIL LOG RECORD`.
- [ ] **Kịch bản 5: Cấu trúc lưu trữ audit & toàn vẹn chuỗi**: Given các hành động nhạy cảm diễn ra, When kiểm tra, Then mỗi bản ghi có event_id/scope/result/correlation_id/prev_hash/entry_hash; chuỗi hash liên tục và job verify xác nhận VERIFIED; bảng partition theo tháng.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-221**: Tạo bảng `platform_audit_logs` kèm Trigger chống sửa/xóa trong PostgreSQL.
- [ ] **TASK-222**: Tích hợp SmallRye Health trong Quarkus kiểm tra liveness & readiness của PostgreSQL, Redis và Kafka.
- [ ] **TASK-223**: Hiện thực API `GET /api/v1/platform/health` và `GET /api/v1/platform/audit-logs`.
- [ ] **TASK-224**: Xây dựng UI Dashboard sức khỏe hạ tầng với biểu đồ mini và thẻ trạng thái xanh/vàng/đỏ trên Angular Web.
- [ ] **TASK-225**: Xây dựng màn hình xem nhật ký kiểm toán có drawer hiển thị diff JSON chi tiết.
- [ ] (xem thêm item: BUG-64, BUG-63, BUG-72, TASK-277, TASK-291, TASK-292, TASK-293).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn thành mã nguồn theo thiết kế.
- [ ] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [ ] Không gây lỗi phát sinh (Regression test pass).
