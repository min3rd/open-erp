# TASK-SPRINT-01-SEED_DATA-001: Hợp nhất seed-utils

**Task ID:** TASK-SPRINT-01-SEED_DATA-001  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Backend  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** —

## Mục tiêu
Hợp nhất tiện ích seed về một điểm import duy nhất, di chuyển `connectToDatabase()` vào `scripts/seeds/utils/seed-utils.ts` và loại bỏ file seed-utils ở root scripts.

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/seeds/seed-utils.ts` (xóa sau khi di chuyển logic)
- `open-erp-backend/scripts/seeds/utils/seed-utils.ts` (bổ sung `connectToDatabase` và export)

## Checklist thực hiện
- [x] Di chuyển toàn bộ logic `connectToDatabase()` vào `utils/seed-utils.ts`.
- [x] Export `connectToDatabase` từ `utils/seed-utils.ts`.
- [ ] Đảm bảo `tsconfig-paths/register` và `dotenv` vẫn hoạt động đúng.
- [x] Xóa file `scripts/seeds/seed-utils.ts` ở root level.
- [x] Kiểm tra không còn import nào trỏ về file root-level cũ.
- [x] Sửa re-export type/value trong `utils/seed-utils.ts` theo chuẩn `isolatedModules` (TS1205).

## Tiêu chí hoàn thành
- [x] Chỉ còn một nguồn tiện ích seed trong `utils/seed-utils.ts`.
- [ ] Lệnh dry-run seed chạy được sau khi hợp nhất.
- [x] Không phát sinh lỗi TypeScript do thay đổi import.

## Kết quả triển khai bổ sung (2026-05-08)

### Thay đổi thực hiện
- Cập nhật export tại `open-erp-backend/scripts/seeds/utils/seed-utils.ts`:
	- `export { SeedStateTracker } from './seed-state';`
	- `export type { SeedMetadata } from './seed-state';`

### Kết quả xác nhận
- Lệnh: `npm run db:seed:status`
- Kết quả chính:
	- Không còn lỗi compile TypeScript `TS1205`.
	- Script chạy đến bước kết nối MongoDB và dừng do môi trường local chưa có MongoDB (`ECONNREFUSED localhost:27017`).

### Ghi chú
- Việc fail hiện tại thuộc hạ tầng runtime DB, không phải lỗi compile/re-export.

## Kết quả kiểm thử manual (QA) - 2026-05-08

### 1) Compile/CLI smoke
- Lệnh: `npm run db:seed:status`
- Kết quả: ✅ PASS tiêu chí compile (không còn lỗi TS1205).
- Runtime: ⚠️ FAIL do môi trường DB (`ECONNREFUSED localhost:27017`), không phải lỗi parser/compile.

### 2) Seed CLI behavior
- Lệnh: `npm run db:seed:all -- --status`
	- Parser nhận đúng cờ `--status` (`DEBUG: expandedArgs: [ '--status' ]`).
	- Không phát sinh lỗi TypeScript.
	- Dừng ở bước connect MongoDB do local DB chưa sẵn sàng.
- Lệnh: `npm run db:seed:all -- --force --status`
	- Parser nhận đúng tổ hợp cờ (`DEBUG: expandedArgs: [ '--force', '--status' ]`).
	- Không phát sinh lỗi TypeScript.
	- Dừng ở bước connect MongoDB do local DB chưa sẵn sàng.

### Đánh giá QA cho TASK-001
- Đề xuất trạng thái: `REVIEW`
- Lý do:
	- Đã đạt các tiêu chí kỹ thuật hợp nhất tiện ích và hết lỗi TS1205.
	- Chưa thể xác nhận end-to-end seed runtime do phụ thuộc hạ tầng MongoDB local.
