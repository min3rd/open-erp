# TASK-SPRINT-01-SEED_DATA-008: Cập nhật Dockerfile và docker-compose cho seed

**Task ID:** TASK-SPRINT-01-SEED_DATA-008  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** DevOps  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-007

## Mục tiêu
Đồng bộ cấu hình image/container để hỗ trợ first-run seed thông qua entrypoint và biến môi trường.

## Phạm vi file ảnh hưởng
- `open-erp-backend/Dockerfile`
- `open-erp-backend/docker-compose.yml`
- `open-erp-backend/docker-compose.dev.yml` (nếu cần)

## Checklist thực hiện
- [ ] Cập nhật Dockerfile để copy scripts seed cần thiết.
- [ ] Thiết lập entrypoint trỏ tới `docker-entrypoint.sh`.
- [ ] Bổ sung biến môi trường `RUN_SEEDS` trong compose.
- [ ] Kiểm tra phụ thuộc runtime cho lệnh seed trong môi trường container.
- [ ] Đảm bảo không hardcode thông tin nhạy cảm trong cấu hình.
- [x] Sửa cấu trúc `docker-compose.dev.yml` để service `db-seed` nằm đúng cấp dưới root `services` (không lồng trong `onlyoffice`).

## Tiêu chí hoàn thành
- [ ] Build image thành công với cấu hình mới.
- [ ] Compose chạy được ở cả chế độ có và không có auto-seed.
- [ ] Không tạo endpoint public để trigger seed trong production.

## Kết quả kiểm thử bổ sung (fix lỗi compose schema)

### Manual verification
- File kiểm tra: `open-erp-backend/docker-compose.dev.yml`
- Thay đổi đã áp dụng: đưa `db-seed` ra cùng cấp với `mongodb`, `rabbitmq`, `minio`, `onlyoffice` trong root `services`.
- Kết quả: không còn lỗi schema `services.onlyoffice additional properties 'db-seed' not allowed`.

### Technical verification
- Lệnh: `docker compose -f docker-compose.dev.yml config`
	- Kết quả: PASS, parse/resolve compose thành công, service `db-seed` được nhận diện ở root `services`.
- Lệnh: `docker compose -f docker-compose.dev.yml up -d`
	- Kết quả: chạy được và khởi tạo stack; image `open-erp-backend-db-seed` build thành công, các service được tạo/start.
	- Ghi chú: tiến trình `up -d` chờ thêm theo health check của `mongodb`, vì vậy chưa trả prompt ngay trong lần chạy timeout; kiểm tra `docker compose ... ps` cho thấy container đã được bring up.

## Kết quả bổ sung (fix healthcheck MongoDB cho mongo:4)

### Thay đổi cấu hình
- File: `open-erp-backend/docker-compose.dev.yml`
- Service: `mongodb`
- Điều chỉnh: thay healthcheck từ `mongosh --eval ...` sang `mongo --eval ...` có xác thực bằng biến môi trường `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD` để tương thích image `mongo:4`.

### Verify sau khi sửa (2026-05-08)
- `docker compose -f docker-compose.dev.yml config`
	- PASS, compose resolve thành công; healthcheck `mongodb` hiển thị lệnh `CMD-SHELL` dùng `mongo`.
- `docker compose -f docker-compose.dev.yml up -d --force-recreate mongodb`
	- PASS, container `erp-mongodb` recreate thành công.
- `docker compose -f docker-compose.dev.yml up -d`
	- PASS, `erp-mongodb` đạt trạng thái `Healthy`; các service phụ thuộc khởi động bình thường.
- `docker compose -f docker-compose.dev.yml ps`
	- PASS, `erp-mongodb` trạng thái `Up ... (healthy)`; không còn lỗi `dependency failed to start: container erp-mongodb is unhealthy`.
