# TASK-SPRINT-01-SEED_DATA-004: Refactor seed files dùng connectToDatabase từ utils

**Task ID:** TASK-SPRINT-01-SEED_DATA-004  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Backend  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-001

## Mục tiêu
Chuẩn hóa cách kết nối DB trong các seed script để mọi file cùng dùng `connectToDatabase` từ `utils/seed-utils.ts`.

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/seeds/seed-provinces.ts`
- `open-erp-backend/scripts/seeds/seed-wards.ts`
- `open-erp-backend/scripts/seeds/seed-organizations.ts`
- `open-erp-backend/scripts/seeds/seed-warehouse-types.ts`
- `open-erp-backend/scripts/seeds/seed-warehouses.ts`

## Checklist thực hiện
- [ ] Xóa import `connect` và các cấu hình DB inline không còn cần thiết.
- [ ] Import `connectToDatabase` từ `./utils/seed-utils`.
- [ ] Đảm bảo vị trí gọi `await connectToDatabase()` hợp lý trong luồng seed.
- [ ] Giữ quy trình đóng kết nối (`connection.close()`) khi kết thúc.
- [ ] Kiểm tra không còn file seed nào dùng cách connect cũ trong danh sách phạm vi.

## Tiêu chí hoàn thành
- [ ] Luồng kết nối DB của các file seed trong phạm vi đã thống nhất.
- [ ] Các lệnh dry-run tương ứng chạy thành công.
- [ ] Không phát sinh lỗi TypeScript sau khi refactor import.
