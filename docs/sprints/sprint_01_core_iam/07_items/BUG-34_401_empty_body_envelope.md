# [BUG-34] Phản Hồi 401 Từ Tầng Security Không Có Envelope `code`

- **Mã Lỗi**: BUG-34
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Khi request không có/invalid Bearer token, `@Authenticated` chặn ở tầng HTTP Security và trả `401` với **body rỗng**, không có envelope `{success:false, code:"UNAUTHORIZED"}` như các lỗi ứng dụng khác.

- **Môi trường**: Local (phát hiện khi viết API test QA)
- **Tính Năng Bị Ảnh Hưởng**: API contract thống nhất (DES-02 mục 1).
- **File Liên Quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AccountResource.java:29` (`@Authenticated`).
  - Thiếu `ExceptionMapper` cho `io.quarkus.security.AuthenticationFailedException` / `io.quarkus.security.UnauthorizedException`.
- **Tài Liệu Đối Chiếu**: DES-02 mục 1.2 (khung thất bại có `code`, `message`, `timestamp`); AGENTS (code-based i18n contract).

## 2. Các Bước Tái Hiện
1. Gọi `GET /api/v1/account/profile` không kèm header `Authorization`.
2. Quan sát body phản hồi.

## 3. Kết Quả Thực Tế
- HTTP 401, body rỗng (không parse được `code`), buộc frontend phải hardcode xử lý riêng.

## 4. Kết Quả Kỳ Vọng
- Trả HTTP 401 kèm envelope `{"success":false,"code":"UNAUTHORIZED","message":"...","timestamp":"..."}` thông qua ExceptionMapper cho lỗi xác thực; 403 tương tự với `FORBIDDEN`.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
GET /api/v1/account/profile (không Authorization) → 401, body: <empty>
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: AccountResource bỏ @Authenticated, verify token qua AccessTokenVerifier (JWTParser) → mọi 401 trả envelope code=UNAUTHORIZED; curl + test PASS.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
