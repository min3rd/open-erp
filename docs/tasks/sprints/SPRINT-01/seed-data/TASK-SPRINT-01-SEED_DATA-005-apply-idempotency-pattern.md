# TASK-SPRINT-01-SEED_DATA-005: Áp dụng idempotency pattern cho toàn bộ seed

**Task ID:** TASK-SPRINT-01-SEED_DATA-005  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Backend  
**Trạng thái:** ⬜ TODO  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-002, TASK-SPRINT-01-SEED_DATA-004

## Mục tiêu
Áp dụng chuẩn idempotent cho toàn bộ seed script: kiểm tra trạng thái đã chạy, dùng upsert và ghi nhận metadata hoàn tất.

## Phạm vi file ảnh hưởng
- Toàn bộ seed scripts trong `open-erp-backend/scripts/seeds/` (13 file nghiệp vụ)
- `open-erp-backend/scripts/seeds/utils/seed-state.ts`

## Checklist thực hiện
- [ ] Thêm `SEED_VERSION` nhất quán trong từng seed script.
- [ ] Thêm kiểm tra `SeedStateTracker.hasRun()` cho luồng `skipIfExists`.
- [ ] Chuẩn hóa ghi dữ liệu theo upsert thay cho insert thuần.
- [ ] Gọi `markComplete()` sau mỗi seed chạy thành công.
- [ ] Kiểm thử chạy lặp 2 lần để xác nhận idempotent behavior.

## Tiêu chí hoàn thành
- [ ] Chạy seed lặp không tạo bản ghi trùng.
- [ ] Collection metadata phản ánh đúng các seed đã hoàn tất.
- [ ] Luồng seed an toàn khi thực thi lặp trong môi trường vận hành.
