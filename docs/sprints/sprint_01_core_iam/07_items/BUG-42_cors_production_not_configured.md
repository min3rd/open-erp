# [BUG-42] CORS Chưa Cấu Hình Cho Môi Trường Production

- **Mã Lỗi**: BUG-42
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Cấu hình CORS chỉ cho phép các origin dev localhost (`4200`, `8100`, `8101`) và không có override `%prod`, nên khi triển khai production frontend tại `https://openerp.9ms.io.vn` sẽ bị trình duyệt chặn preflight.

- **Môi trường**: Local (phát hiện) — ảnh hưởng Staging/Production.
- **Tính Năng / Module Bị Ảnh Hưởng**: Toàn bộ API Core IAM (Web/Mobile gọi BE).
- **File Liên Quan**:
  - `src/backend/src/main/resources/application.properties:48-52` — `quarkus.http.cors.origins=http://localhost:4200,http://localhost:8100,http://localhost:8101` (không có dòng `%prod.` hay `%staging.` override).
  - `openerp.frontend.url` đã có `%prod`/`%staging` (dòng 53-55) nhưng CORS thì chưa.
- **Tài Liệu Đối Chiếu**: AGENTS.md — "Cấm Hardcode URL & Cấu Hình Động Backend (Config-Driven URL Invariant)"; tên miền chính thức `openerp.9ms.io.vn`.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi chạy backend với profile production (hoặc giả lập bằng cấu hình hiện tại).
2. Gửi preflight `OPTIONS /api/v1/auth/login` kèm header `Origin: https://openerp.9ms.io.vn`.
3. Quan sát mã phản hồi và log CORS của Quarkus.

## 3. Kết Quả Thực Tế (Actual Result)
- Preflight trả `403 CORS Rejected - Invalid origin` (origin production không nằm trong danh sách allowlist chỉ có localhost).
- Frontend production không thể gọi API, mọi luồng đăng nhập/đăng ký hỏng trên trình duyệt.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung cấu hình CORS theo môi trường: `%prod.quarkus.http.cors.origins=https://openerp.9ms.io.vn` và `%staging.quarkus.http.cors.origins=https://staging.openerp.9ms.io.vn` (giữ localhost cho `%dev`).
- Preflight từ origin production trả 200 kèm `Access-Control-Allow-Origin` tương ứng.
- Không dùng `*` cho môi trường production khi có `Authorization`/credentials.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
```
OPTIONS /api/v1/auth/login
Origin: https://openerp.9ms.io.vn
-> HTTP 403 (CORS Rejected - Invalid origin)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: Thêm %prod/%staging CORS origins với env override OPENERP_CORS_ORIGINS; dev giữ localhost.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
