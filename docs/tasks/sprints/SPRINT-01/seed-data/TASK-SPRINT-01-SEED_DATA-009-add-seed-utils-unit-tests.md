# TASK-SPRINT-01-SEED_DATA-009: Viết unit test cho seed utils và seed state

**Task ID:** TASK-SPRINT-01-SEED_DATA-009  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Testing  
**Trạng thái:** 🔵 IN PROGRESS  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-001

## Mục tiêu
Bổ sung unit test cho các hàm tiện ích seed quan trọng để đảm bảo độ ổn định khi refactor và mở rộng.

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/seeds/__tests__/seed-utils.test.ts` (tạo mới hoặc cập nhật)
- `open-erp-backend/scripts/seeds/__tests__/seed-state.test.ts` (tạo mới)

## Checklist thực hiện
- [x] Viết test cho `parseArgs` với các cờ thường dùng.
- [x] Viết test cho `createBatches` với các tập dữ liệu khác nhau.
- [x] Viết test cho `generateStrongPassword` theo tiêu chí bảo mật cơ bản.
- [x] Viết test cho `SeedStateTracker.hasRun` và `markComplete`.
- [ ] Tích hợp môi trường MongoDB in-memory cho test state tracker.

## Tiêu chí hoàn thành
- [ ] Coverage tối thiểu 80% cho nhóm tiện ích seed.
- [ ] Test seeds pass ổn định trong pipeline.
- [x] Không phụ thuộc vào MongoDB ngoài khi chạy unit test.

## Kết quả Unit Test (2026-05-08)

**Lần chạy 1:**
- Lệnh: `npm test -- scripts/seeds/__tests__`
- Kết quả: ❌ FAIL
- Nguyên nhân chính:
	- `seed-utils.spec.ts` fail 1 case do giả định sai về behavior `parseArgs` khi thiếu value.
	- `seed-integration.spec.ts` timeout do `mongodb-memory-server` tải binary lớn và không kịp trong môi trường hiện tại.

**Lần chạy 2 (sau fix test):**
- Lệnh: `npm test -- scripts/seeds/__tests__/seed-utils.spec.ts scripts/seeds/__tests__/seed-state.spec.ts`
- Kết quả: ✅ PASS
- Chi tiết: 2 suites passed, 39 tests passed.

**Lần chạy 3 (coverage):**
- Lệnh: `npm test -- --coverage scripts/seeds/__tests__/seed-utils.spec.ts scripts/seeds/__tests__/seed-state.spec.ts --collectCoverageFrom="scripts/seeds/utils/seed-utils.ts" --collectCoverageFrom="scripts/seeds/utils/seed-state.ts"`
- Kết quả: ✅ PASS

| File | Stmts | Branch | Funcs | Lines |
|---|---:|---:|---:|---:|
| seed-utils.ts | 67.14% | 52.83% | 57.14% | 65.92% |
| seed-state.ts | 40.00% | 66.66% | 60.00% | 40.00% |
| Tổng | 62.35% | 54.83% | 57.89% | 61.21% |

### Files đã tạo/sửa
- `open-erp-backend/scripts/seeds/__tests__/seed-utils.spec.ts` — bổ sung test cases cho `parseArgs`, `createBatches`, `generateStrongPassword`.
- `open-erp-backend/scripts/seeds/__tests__/seed-state.spec.ts` — tạo mới test `SeedStateTracker.hasRun`/`markComplete` (mock model, không phụ thuộc MongoDB ngoài).

### Ghi chú
- Chưa đạt tiêu chí coverage >= 80% cho toàn nhóm tiện ích do còn nhiều nhánh chưa test (`connectToDatabase`, `printStatus`, `saveReport`, ...).
- Full command `npm test -- scripts/seeds/__tests__` hiện vẫn bị ảnh hưởng bởi integration test timeout trong môi trường cục bộ.

## Kết quả kiểm thử manual (QA) - 2026-05-08

### 3) Unit test verification (manual xác nhận)

**Lần chạy manual A:**
- Lệnh: `npm test -- scripts/seeds/__tests__/seed-utils.spec.ts scripts/seeds/__tests__/seed-state.spec.ts`
- Kết quả: ✅ PASS
- Tổng quan: 2 suites passed, 39 tests passed, 0 failed.

**Lần chạy manual B (kèm coverage):**
- Lệnh: `npm test -- --coverage scripts/seeds/__tests__/seed-utils.spec.ts scripts/seeds/__tests__/seed-state.spec.ts --collectCoverageFrom="scripts/seeds/utils/seed-utils.ts" --collectCoverageFrom="scripts/seeds/utils/seed-state.ts"`
- Kết quả: ✅ PASS

| File | Stmts | Branch | Funcs | Lines |
|---|---:|---:|---:|---:|
| seed-utils.ts | 67.14% | 52.83% | 57.14% | 65.92% |
| seed-state.ts | 40.00% | 66.66% | 60.00% | 40.00% |
| Tổng | 62.35% | 54.83% | 57.89% | 61.21% |

### Điều chỉnh tiêu chí theo thực tế
- [ ] Coverage tối thiểu 80% cho nhóm tiện ích seed. *(Hiện tại 62.35%, chưa đạt)*
- [ ] Test seeds pass ổn định trong pipeline. *(Chưa xác nhận đủ do full suite `scripts/seeds/__tests__` còn có khả năng timeout integration trong local)*
- [x] Không phụ thuộc vào MongoDB ngoài khi chạy unit test. *(Hai suite unit chính chạy pass với mock)*

### Đánh giá QA cho TASK-009
- Đề xuất trạng thái: `IN PROGRESS`
- Lý do:
	- Unit test mục tiêu đã chạy pass ổn định (2/2 suites).
	- Tiêu chí coverage >= 80% chưa đạt nên chưa đủ điều kiện chuyển `DONE`.
