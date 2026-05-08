# TASK-SPRINT-01-SEED_DATA-002: Tạo SeedStateTracker (seed_metadata)

**Task ID:** TASK-SPRINT-01-SEED_DATA-002  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Backend  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-001

## Mục tiêu
Xây dựng cơ chế theo dõi trạng thái seed bằng collection `seed_metadata`, cung cấp `SeedStateTracker` để kiểm tra đã chạy và đánh dấu hoàn tất theo version.

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/seeds/utils/seed-state.ts` (tạo mới)
- `open-erp-backend/scripts/seeds/utils/seed-utils.ts` (re-export)

## Checklist thực hiện
- [ ] Tạo `seed-state.ts` và định nghĩa class `SeedStateTracker`.
- [ ] Cài đặt các hàm `hasRun`, `markComplete`, `reset`, `listCompleted`.
- [ ] Thiết kế schema collection `seed_metadata` với index unique theo `(name, version)`.
- [ ] Re-export `SeedStateTracker` qua `utils/seed-utils.ts`.
- [ ] Chuẩn hóa biến version seed ban đầu là `1.0.0`.

## Tiêu chí hoàn thành
- [ ] Có thể kiểm tra trạng thái seed theo tên và version.
- [ ] Có thể ghi nhận metadata khi seed hoàn tất.
- [ ] Collection và index được tạo tự động khi chưa tồn tại.

## Kết quả test bổ sung (fix runtime MongoNotConnectedError)

### Unit test
- **Thời gian:** 2026-05-08
- **Lệnh:** `npm test -- scripts/seeds/__tests__/seed-utils.spec.ts scripts/seeds/__tests__/seed-state.spec.ts`
- **Kết quả:** ✅ PASS (2 suites, 39 tests passed, 0 failed)
- **Liên quan task 002:** `seed-state.spec.ts` pass toàn bộ các case `hasRun` và `markComplete`.

### Manual test (tích hợp với orchestrator)
- **Lệnh:** `npm run db:seed:force -- --skip-wards --skip-roles --skip-organizations --skip-users --skip-warehouse-types --skip-warehouses --skip-relations --skip-navigation --skip-product-types --skip-product-categories --skip-wms`
- **Kết quả:** ✅ PASS
- **Evidence chính:** Sau khi seed provinces đóng connection, orchestrator reconnect trước khi gọi `SeedStateTracker.markComplete`; không phát sinh `MongoNotConnectedError`.

## Đề xuất trạng thái
- **Đề xuất:** 🟡 REVIEW
- **Lý do:** Chức năng tracker và luồng tích hợp với seed-all đang hoạt động ổn định theo test; chờ review cuối cùng.
