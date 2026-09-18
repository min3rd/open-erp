# [TASK-293] Cold Archive Audit Log > 24 Tháng Sang MongoDB/S3 (WORM) & Legal Hold

- **Mã Công Việc**: TASK-293
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred
- **Ghi Chú**: Đặc tả sẵn sàng; **có thể chuyển sang sprint sau** nếu Docker Compose profile `mongo`/`storage` chưa được bật.

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-72](BUG-72_audit_log_storage_design_gap.md); đối chiếu SYSTEM_BLUEPRINT §5.2 (MongoDB cho Audit Logs) — MongoDB đảm nhiệm vai trò **tầng lạnh (cold archive)**.
- Mục tiêu: đặc tả + hiện thực archive bản ghi > 24 tháng sang MongoDB collection `audit_logs_archive` (và/hoặc S3 Object Lock WORM), bảo toàn hash chain.
- Tài liệu thiết kế: [SOL-01](../05_solutions/SOL-01_superadmin_architecture_and_security.md) §3.1, §3.7; [DES-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.4.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Job `AuditArchiveJob`: chọn partition/bản ghi > 24 tháng, xuất kèm manifest (prev_hash/entry_hash, range thời gian, checksum).
- [ ] Ghi vào MongoDB `audit_logs_archive` (hoặc S3 Object Lock WORM) thành công rồi mới `DETACH`/purge khỏi hot storage.
- [ ] Legal hold: bản ghi/tenant đang bị giữ pháp lý không được archive-purge; lưu cờ hold + audit chính thao tác archive.
- [ ] Tra cứu hợp nhất hot + cold theo `event_id`/`correlation_id` (đặc tả API, bật dần).
- [ ] Test archive/restore toàn vẹn hash chain trên môi trường có profile `mongo`/`storage`.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bản ghi > 24 tháng được archive nguyên vẹn, verify hash chain sau restore.
- [ ] Không xóa cứng dữ liệu trong thời gian lưu trữ; legal hold được tôn trọng.
- [ ] Job chạy lại idempotent, không nhân bản bản ghi archive.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự chạy test.
- [ ] QA review và tự chạy lại bộ test.
- [ ] Không phát sinh regression.
