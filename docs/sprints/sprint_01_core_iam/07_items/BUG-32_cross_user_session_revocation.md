# [BUG-32] Hủy Phiên Đăng Nhập Chéo Người Dùng (Thiếu Kiểm Tra Sở Hữu)

- **Mã Lỗi**: BUG-32
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> `SessionManager.revokeSession(userId, sessionId)` không kiểm tra session có thuộc `userId` trước khi xóa. Người dùng A có thể hủy phiên đăng nhập của người dùng B nếu biết `sessionId` của B.

- **Môi trường**: Local (phát hiện khi viết API test QA)
- **Tính Năng Bị Ảnh Hưởng**: Quản lý phiên đăng nhập (FEAT-06), cô lập dữ liệu người dùng.
- **File Liên Quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/security/SessionManager.java:85-97` — xóa key mà không đối chiếu `SessionInfo.userId`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AccountService.java:104-109` — chỉ kiểm tra kết quả trả về.
- **Tài Liệu Đối Chiếu**: AGENTS.md (cô lập dữ liệu), DES-02 mục 3.1 (`DELETE /account/sessions/{sessionId}` chỉ được thao tác trên phiên của chính mình).

## 2. Các Bước Tái Hiện
1. Tạo 2 tài khoản A và B (2 tenant riêng), đăng nhập lấy `session_id` của mỗi người.
2. Dùng access token của A gọi `DELETE /api/v1/account/sessions/{session_id_của_B}`.
3. Quan sát mã phản hồi.

## 3. Kết Quả Thực Tế
- API trả `200 ACCOUNT_SESSION_REVOKED_SUCCESS` và phiên của B bị xóa (test `TC-14b` từng fail: `Expected status code <404> but was <200>`).

## 4. Kết Quả Kỳ Vọng
- `SessionManager.revokeSession` phải đối chiếu `session.getUserId()` với `userId`; nếu không khớp trả `false` và API trả `404 ACCOUNT_SESSION_NOT_FOUND`, phiên của B không bị ảnh hưởng.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
Expected status code <404> but was <200> (AccountTenantIsolationApiTest - TC-14b)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
