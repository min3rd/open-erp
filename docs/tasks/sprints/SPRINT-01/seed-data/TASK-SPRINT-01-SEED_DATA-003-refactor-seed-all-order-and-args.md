# TASK-SPRINT-01-SEED_DATA-003: Refactor seed-all (parseArgs và thứ tự seed)

**Task ID:** TASK-SPRINT-01-SEED_DATA-003  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Backend  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-001

## Mục tiêu
Loại bỏ `parseArgs` local trong `seed-all.ts`, dùng shared util và chuẩn hóa thứ tự thực thi seed theo dependency graph.

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/seeds/seed-all.ts`

## Checklist thực hiện
- [ ] Xóa hàm `parseArgs` local khỏi `seed-all.ts`.
- [ ] Import `parseArgs` từ `./utils/seed-utils`.
- [ ] Dọn log debug không cần thiết trong phần parse argument cũ.
- [ ] Cập nhật thứ tự gọi seed theo dependency graph đã thống nhất.
- [ ] Bổ sung bước gọi `seed-inventory-stock` nếu còn thiếu.
- [x] Xử lý STEP 12 WMS theo hướng warning/non-fatal khi thiếu prerequisite products, không làm fail toàn bộ seed-all.

## Tiêu chí hoàn thành
- [ ] Chạy dry-run seed-all thành công.
- [ ] Không còn trùng lặp logic parse args trong `seed-all.ts`.
- [ ] Thứ tự seed khớp thiết kế chuẩn hóa.

## Kết quả test bổ sung (fix runtime MongoNotConnectedError)

### Unit test
- **Thời gian:** 2026-05-08
- **Lệnh:** `npm test -- scripts/seeds/__tests__/seed-utils.spec.ts scripts/seeds/__tests__/seed-state.spec.ts`
- **Kết quả:** ✅ PASS (2 suites, 39 tests passed, 0 failed)

### Manual test (tái hiện rút gọn đúng điểm lỗi)
- **Mục tiêu:** xác nhận không còn lỗi sau bước Provinces khi orchestrator gọi `SeedStateTracker.markComplete`.
- **Lệnh:** `npm run db:seed:force -- --skip-wards --skip-roles --skip-organizations --skip-users --skip-warehouse-types --skip-warehouses --skip-relations --skip-navigation --skip-product-types --skip-product-categories --skip-wms`
- **Kết quả:** ✅ PASS
- **Evidence chính:**
	- Sau `PROVINCES SEEDING COMPLETE` có log `Database connection closed` từ seed con.
	- Orchestrator tự reconnect thành công (`Connecting to MongoDB...` và `✓ Connected to MongoDB`).
	- `✓ Provinces seeding completed successfully`.
	- Summary cuối: `Success: 1`, `Failed: 0`.
	- Không xuất hiện `MongoNotConnectedError: Client must be connected before running operations`.

## Đề xuất trạng thái
- **Đề xuất:** 🟡 REVIEW
- **Lý do:** Đã fix runtime bug trong orchestrator, giữ backward compatibility cho seed standalone, và có bằng chứng unit/manual pass; còn cần reviewer xác nhận theo quy trình.

## Kết quả triển khai bổ sung (WMS non-fatal)

**Thời gian:** 2026-05-08  
**File sửa chính:** `open-erp-backend/scripts/seeds/seed-all.ts`

### Nội dung thay đổi chính
- Bổ sung metadata kết quả step (`nonFatal`, `skipped`, `note`) trong summary model của seed-all.
- Ở STEP 12 (WMS): nếu gặp lỗi prerequisite `No products found. Please seed products first.` thì đánh dấu `WARNING (SKIPPED)` thay vì `FAILED`.
- Lỗi WMS khác prerequisite vẫn giữ hành vi fatal (throw khi không phải dry-run).
- `failCount` chỉ đếm lỗi fatal (`!success && !nonFatal`), đồng thời hiển thị thêm `Warnings` trong summary.

### Kiểm chứng thực tế
- **Lệnh:** `npm run db:seed:force`
- **Kết quả:** ✅ PASS
- **Evidence chính:**
	- `STEP 12: Seeding WMS Demo Data`
	- `⚠ WMS demo data skipped (non-fatal): missing prerequisite products`
	- `⚠ WMS Demo Data: WARNING (SKIPPED)`
	- `Error: No products found. Please seed products first.`
	- `Success: 11`
	- `Warnings: 1`
	- `Failed: 0`
	- `✓ All seeding operations completed successfully!`
	- `EXIT_CODE=0`
