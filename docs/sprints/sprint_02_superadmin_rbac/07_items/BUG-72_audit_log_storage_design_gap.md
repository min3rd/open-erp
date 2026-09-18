# [BUG-72] Lỗ Hổng Thiết Kế Cấu Trúc Lưu Trữ Audit Log (Thiếu Hash Chain, Partition, Retention & Coverage)

- **Mã Lỗi**: BUG-72
- **Phân Loại**: Bug / Defect (Thiết kế)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Thiết kế audit Sprint 02 chỉ dừng ở mức "bảng + trigger chống sửa" mà thiếu toàn bộ kiến trúc lưu trữ dài hạn: hash chain, partition, retention/archive, coverage matrix, tenant-scope audit và write-path/failure policy.

- **Môi trường**: Tài liệu Sprint 02 (SOL-01 / DES-02-DB / DES-02-API / DES-02-UI / TEST-02).
- **Bằng chứng (file:line)**:
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:107` — §2.4 chỉ có 8 cột + 4 index + trigger; thiếu `event_id`, `scope`, `tenant_id`, `actor_type`, `actor_email_snapshot`, `resource_type`, `resource_id`, `result`, `correlation_id`, `prev_hash`, `entry_hash`.
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md:115` — §3 chưa mô tả kiến trúc lưu trữ, phân tầng hot/cold, partition theo tháng, retention 24 tháng hay chính sách fail-closed.
  - Không có coverage matrix liệt kê hành động bắt buộc ghi log (RBAC/Cơ cấu tổ chức hiện không được audit).
  - Không có thiết kế audit dùng chung cho `scope = 'TENANT'` (màn hình Tenant Admin deferred).
- **Tài Liệu Đối Chiếu**: SOL-01; DES-02-DB §2.4; DES-02-API §3.7; DES-02-UI; TEST-02; SYSTEM_BLUEPRINT §5.2.

## 2. Tác Động
- Audit trail không phát hiện được sửa đổi tinh vi (kẻ tấn công có quyền superuser phá trigger) do thiếu hash chain.
- Không có partition → hiệu năng suy giảm, không thể archive/detach theo tháng khi dữ liệu tăng.
- Thao tác RBAC/Cơ cấu tổ chức (đổi quyền, gán vai trò, đổi phòng ban) không được ghi log → mất dấu vết leo thang đặc quyền.
- Không có retention/legal hold → vi phạm yêu cầu lưu trữ bằng chứng pháp lý.

## 3. Kết Quả Kỳ Vọng
- Bảng `platform_audit_logs` mở rộng dùng chung `scope` PLATFORM/TENANT, append-only, hash chain SHA-256, partition theo tháng, retention 24 tháng + cold archive MongoDB/S3 ở sprint sau.
- Bất biến 4 lớp: REVOKE, trigger, hash chain + job verify, archive WORM.
- Write path fail-closed cùng transaction cho hành động nhạy cảm; coverage matrix 29 action.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] Đã bổ sung thiết kế đầy đủ vào SOL-01 §3, DES-DB §2.4, DES-API §3.7, DES-UI §4.6, test_plan TC-BE-24→27, FEAT-12 AC5, CONF-01 Phụ lục mục 8.
- [x] Phần mã nguồn triển khai theo dõi qua TASK-291 → TASK-293.
- **Ghi chú QA (2026-09-18)**: Thiết kế đã chốt và cập nhật đồng bộ tài liệu Sprint 02; BUG-72 đóng ở mức tài liệu, mã nguồn thực thi theo TASK-291 → TASK-293.
