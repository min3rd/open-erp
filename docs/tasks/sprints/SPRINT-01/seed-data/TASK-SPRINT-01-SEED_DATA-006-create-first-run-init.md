# TASK-SPRINT-01-SEED_DATA-006: Tạo first-run-init

**Task ID:** TASK-SPRINT-01-SEED_DATA-006  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** Backend  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-002, TASK-SPRINT-01-SEED_DATA-003

## Mục tiêu
Tạo entry point `first-run-init.ts` để khởi tạo dữ liệu lần đầu theo cơ chế an toàn khi chạy lại (skip if exists).

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/seeds/first-run-init.ts` (tạo mới)
- `open-erp-backend/package.json` (thêm script chạy)

## Checklist thực hiện
- [ ] Tạo `first-run-init.ts` gọi toàn bộ seed theo luồng first-run.
- [ ] Luôn truyền cờ `skipIfExists: true`.
- [ ] Bổ sung script `db:seed:first-run` trong `package.json` backend.
- [ ] Chuẩn hóa logging tổng kết số lượng seed chạy, bỏ qua, lỗi.
- [ ] Đảm bảo exit code phù hợp cho tích hợp container.

## Tiêu chí hoàn thành
- [ ] Lần chạy đầu tiên seed thành công.
- [ ] Lần chạy kế tiếp bỏ qua các seed đã có.
- [ ] Kịch bản MongoDB chưa sẵn sàng trả lỗi rõ ràng và exit code đúng.
