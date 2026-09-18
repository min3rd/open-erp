# [TASK-269] Enforce Hạn Mức Tenant (`max_users`, `max_storage_mb`)

- **Mã Công Việc**: TASK-269
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-53](BUG-53_quota_not_enforced.md) — quota mới chỉ được cấu hình, chưa bị chặn khi vượt.
- Mục tiêu: chặn tạo/thêm user vượt `max_users`; có hook kiểm tra `max_storage_mb` cho tầng upload.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.1; [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) §2.1; [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §3.2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Viết service đếm user đang hoạt động và so ngưỡng trước khi tạo/thêm thành viên tenant.
- [ ] Trả lỗi `409` code `PLATFORM_TENANT_QUOTA_EXCEEDED` với `params {limit, current}` (khuôn mẫu 4).
- [ ] Định nghĩa hook/service kiểm tra `max_storage_mb` trước khi ghi file (có thể là interface chờ Storage Service, ghi chú rõ nếu defer).
- [ ] Bổ sung audit log khi thao tác bị chặn bởi quota.
- [ ] Viết integration test trên PostgreSQL thật cho các ngưỡng biên (đủ quota/vượt 1).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Tạo user thứ `max_users + 1` bị chặn đúng mã lỗi/params.
- [ ] Hook storage được wiring và có test giả lập vượt ngưỡng.
- [ ] `mvn test` pass 100%; tài liệu API cập nhật mã lỗi mới.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA re-test biên quota trên tenant thật.
- [ ] Không phát sinh regression.
