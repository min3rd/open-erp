# [TASK-272] Scheduled Job Chuyển Tenant TRIAL → EXPIRED (BR-SA-05)

- **Mã Công Việc**: TASK-272
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-55](BUG-55_tenant_state_machine_schema_mismatch.md) — chưa có job auto-EXPIRED theo BR-SA-05.
- Mục tiêu: tự động chuyển tenant hết hạn dùng thử sang `EXPIRED`, gửi email, chặn thêm mới dữ liệu.
- Tài liệu thiết kế: [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) §2.1 + BR-SA-05; [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.1.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Scheduled job (Quarkus scheduler) quét tenant `TRIAL` có `trial_ends_at < NOW()`, cập nhật trạng thái `EXPIRED` (đồng bộ cột `status` với `is_locked` theo thiết kế chốt).
- [ ] Gửi email thông báo hết hạn cho chủ tenant (dùng URL cấu hình `@ConfigProperty`, không hardcode).
- [ ] Chặn thao tác thêm mới dữ liệu với tenant `EXPIRED` (interceptor tương tự `TENANT_SUSPENDED`).
- [ ] Ghi audit log hệ thống cho lần chuyển trạng thái.
- [ ] Viết test: tenant trước hạn không đổi, quá hạn chuyển đúng, chạy job lặp không sai trạng thái (idempotent).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Job chạy đúng chu kỳ, chuyển trạng thái + email + chặn dữ liệu đúng BR-SA-05.
- [ ] Có test integration trên PostgreSQL thật.
- [ ] `mvn test` pass 100%.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA mô phỏng tenant hết hạn và xác nhận hành vi.
- [ ] Không phát sinh regression.
