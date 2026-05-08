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

## Tiêu chí hoàn thành
- [ ] Chạy dry-run seed-all thành công.
- [ ] Không còn trùng lặp logic parse args trong `seed-all.ts`.
- [ ] Thứ tự seed khớp thiết kế chuẩn hóa.
