# [BUG-33] GlobalExceptionMapper Biến Lỗi 4xx Thành 500

- **Mã Lỗi**: BUG-33
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> `GlobalExceptionMapper implements ExceptionMapper<Throwable>` bắt mọi exception chưa được map, kể cả `WebApplicationException` của JAX-RS, và luôn trả `500 INTERNAL_SERVER_ERROR` thay vì giữ nguyên mã 4xx.

- **Môi trường**: Local (phát hiện khi viết API test QA)
- **Tính Năng Bị Ảnh Hưởng**: Toàn bộ API contract (mã lỗi 4xx chuẩn hóa).
- **File Liên Quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/api/GlobalExceptionMapper.java:9-27`.
  - Ví dụ: request sai/thiếu `Content-Type` sinh `jakarta.ws.rs.NotSupportedException` (đáng lẽ 415) nhưng bị map thành 500; JSON malformed (đáng lẽ 400) cũng thành 500.
- **Tài Liệu Đối Chiếu**: DES-02 mục 1 (response envelope theo mã lỗi chuẩn); `core_sdlc`/AGENTS (API contract code-based).

## 2. Các Bước Tái Hiện
1. Gọi `POST /api/v1/auth/logout` không kèm `Content-Type: application/json`.
2. Hoặc gửi body JSON sai định dạng tới một endpoint bất kỳ.

## 3. Kết Quả Thực Tế
- Trả `500` với `code=INTERNAL_SERVER_ERROR`; log ghi `Unhandled exception caught by GlobalExceptionMapper: jakarta.ws.rs.NotSupportedException...`.

## 4. Kết Quả Kỳ Vọng
- Thêm mapper riêng cho `WebApplicationException` giữ nguyên HTTP status (400/401/403/404/405/415...) và trả envelope `code` tương ứng (`VALIDATION_FAILED`, `UNAUTHORIZED`, `NOT_FOUND`, `UNSUPPORTED_MEDIA_TYPE`...); mapper `Throwable` chỉ còn dùng cho lỗi 500 thực sự.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
Unhandled exception caught by GlobalExceptionMapper
jakarta.ws.rs.NotSupportedException: HTTP 415 Unsupported Media Type
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
