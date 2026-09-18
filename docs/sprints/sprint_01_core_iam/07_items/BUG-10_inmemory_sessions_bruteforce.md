# [BUG-10] Session Và Chống Brute-Force Lưu In-Memory, Thiếu Redis Client

- **Mã Lỗi**: BUG-10
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- `src/backend/src/main/java/com/vn9melody/openerp/core/security/SessionManager.java:44` dùng `private final Map<UUID, Map<String, SessionInfo>> userSessions = new ConcurrentHashMap<>();` → toàn bộ phiên đăng nhập chỉ nằm trong bộ nhớ RAM của một instance.
- `src/backend/src/main/java/com/vn9melody/openerp/core/security/BruteForceService.java:19` dùng `private final Map<String, AttemptTracker> attemptsMap = new ConcurrentHashMap<>();` → trạng thái khóa chống brute-force cũng chỉ nằm in-memory.
- `src/backend/pom.xml` **không khai báo dependency `quarkus-redis-client`**, tức chưa có tầng lưu trữ phân tán nào được tích hợp.
- **Tài liệu đối chiếu**:
  - DES-01 (`../06_designs/database/CORE_IAM_DATABASE_SCHEMA.md`) mục 4: quy định session lưu trên **Redis** có TTL.
  - SOL-01 (`../05_solutions/SOL-01_core_identity_architecture.md`) mục 1 & 2.4: chỉ định Redis cho cache phân tán, session, lock.
  - CONF-01 (`../04_confirmation/CONF-01_sprint_01_scope.md`): phạm vi đã xác nhận.
- **Hậu quả**: Restart backend mất toàn bộ phiên (mọi user bị đăng xuất); hệ thống không hoạt động đúng khi scale nhiều instance (phiên tạo ở instance A không thấy ở instance B); revoke session/blacklist token không có hiệu lực toàn cụm; trạng thái khóa brute-force không nhất quán giữa các instance.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Session Management & Security (FEAT-03, FEAT-06)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi động backend local (`make backend`) và đăng nhập để nhận `session_id`.
2. Gọi `GET /api/v1/account/sessions` → thấy phiên vừa tạo.
3. Restart backend (Ctrl+C và chạy lại).
4. Gọi lại `GET /api/v1/account/sessions` với cùng token.
5. (Tùy chọn) Chạy 2 instance backend cùng trỏ PostgreSQL/Redis, đăng nhập ở instance A rồi gọi API qua instance B.

## 3. Kết Quả Thực Tế (Actual Result)
- Sau khi restart, danh sách phiên trống hoàn toàn; thao tác revoke session trước đó không còn ý nghĩa.
- Với nhiều instance, instance B không nhận diện được phiên/token đã tạo ở instance A → lỗi `UNAUTHORIZED` hoặc hành vi không nhất quán.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo DES-01 mục 4 và SOL-01 mục 1 & 2.4, session phải lưu trên Redis (có TTL), tồn tại qua restart và dùng chung giữa các instance; trạng thái brute-force/blacklist cũng phải phân tán trên Redis để revoke/lock có hiệu lực toàn cụm.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
