# TASK-SPRINT-01-SEED_DATA-007: Tạo Docker entrypoint cho first-run seed

**Task ID:** TASK-SPRINT-01-SEED_DATA-007  
**Sprint:** 01  
**Cluster:** seed-data  
**Loại:** DevOps  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** TASK-SPRINT-01-SEED_DATA-006

## Mục tiêu
Xây dựng `docker-entrypoint.sh` để container có thể chờ MongoDB và thực thi seed lần đầu theo biến môi trường điều khiển.

## Phạm vi file ảnh hưởng
- `open-erp-backend/scripts/docker-entrypoint.sh` (tạo mới)

## Checklist thực hiện
- [ ] Tạo script entrypoint với chế độ dừng khi có lỗi (`set -e`).
- [ ] Bổ sung logic wait MongoDB theo timeout cấu hình.
- [ ] Chạy first-run seed khi `RUN_SEEDS=true`.
- [ ] Không log giá trị nhạy cảm như mật khẩu super admin.
- [ ] Kết thúc bằng `exec` lệnh start ứng dụng.

## Tiêu chí hoàn thành
- [ ] Khi bật `RUN_SEEDS=true`, container seed rồi khởi động app.
- [ ] Khi tắt `RUN_SEEDS`, container chỉ khởi động app.
- [ ] Timeout DB được xử lý đúng và thoát với mã lỗi phù hợp.
