# [BUG-43] Thiếu Key i18n Cho Các Mã Lỗi `BAD_REQUEST` / `METHOD_NOT_ALLOWED` / `UNSUPPORTED_MEDIA_TYPE`

- **Mã Lỗi**: BUG-43
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Backend có thể trả các mã lỗi `BAD_REQUEST`, `METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE` từ tầng exception mapper, nhưng từ điển i18n của Frontend không có các key tương ứng nên UI hiển thị raw code thay vì thông báo đa ngôn ngữ.

- **Môi trường**: Local
- **Tính Năng / Module Bị Ảnh Hưởng**: Toàn bộ API Core IAM — hiển thị lỗi phía Web/Mobile.
- **File Liên Quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/api/ErrorCode.java:55,59,60` — khai báo `BAD_REQUEST`, `METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE`.
  - `src/backend/src/main/java/com/vn9melody/openerp/core/api/WebApplicationExceptionMapper.java:24-26` — map 405 → `METHOD_NOT_ALLOWED`, 415 → `UNSUPPORTED_MEDIA_TYPE`, 4xx còn lại → `BAD_REQUEST`.
  - `src/frontend/web/public/i18n/vi.json` và `src/frontend/web/public/i18n/en.json` — không tồn tại 3 key trên (findstr 0 kết quả).
- **Tài Liệu Đối Chiếu**: AGENTS.md — "Chuẩn Mực API Contract Đa Ngôn Ngữ (Code-Based i18n API Contract)": FE tự quản lý từ điển theo `code`; mọi code phải có bản dịch.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Gọi API sai method, ví dụ `GET /api/v1/auth/login` (endpoint chỉ nhận `POST`).
2. Quan sát response: `code = "METHOD_NOT_ALLOWED"`.
3. Trên UI, thực hiện thao tác sinh ra lỗi 4xx (ví dụ gửi request sai content-type).
4. Kiểm tra thông báo hiển thị cho người dùng.

## 3. Kết Quả Thực Tế (Actual Result)
- Frontend không tìm thấy key dịch `BAD_REQUEST` / `METHOD_NOT_ALLOWED` / `UNSUPPORTED_MEDIA_TYPE` trong `vi.json` / `en.json`.
- UI hiển thị chuỗi `METHOD_NOT_ALLOWED` (raw code) hoặc fallback message tiếng Anh, vi phạm quy tắc zero-hardcode/i18n.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung 3 key `BAD_REQUEST`, `METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE` vào cả `vi.json` và `en.json` (Web; kiểm tra đồng bộ Mobile).
- Mọi response code từ `ErrorCode.java` đều có bản dịch tương ứng ở cả 2 ngôn ngữ.
- Không hiển thị raw code trên UI trong bất kỳ luồng lỗi nào.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
```
Response body: { "success": false, "code": "METHOD_NOT_ALLOWED", ... }
FE lookup: i18n["METHOD_NOT_ALLOWED"] -> undefined (raw code displayed)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: Đã thêm BAD_REQUEST/METHOD_NOT_ALLOWED/UNSUPPORTED_MEDIA_TYPE (vi/en), parity đủ.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
