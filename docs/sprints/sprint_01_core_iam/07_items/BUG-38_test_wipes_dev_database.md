# [BUG-38] Test Suite Dùng Chung DB Dev Và Xóa Sạch Dữ Liệu `openerp_dev`

- **Mã Lỗi**: BUG-38
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: Khách hàng (login 401) + QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> `src/test/resources/application.properties` trỏ vào `jdbc:postgresql://localhost:5432/openerp_dev` (trùng DB dev). Các test `@QuarkusTest` gọi `deleteAll()`/truncate trước mỗi test nên **xóa toàn bộ dữ liệu người dùng thật trên môi trường dev** sau mỗi lần chạy `mvn test`.

- **Môi trường**: Local
- **Tính Năng Bị Ảnh Hưởng**: Toàn bộ tài khoản đăng ký trên local dev; login trả 401 `AUTH_INVALID_CREDENTIALS` vì tài khoản không còn tồn tại.
- **File Liên Quan**:
  - `src/backend/src/test/resources/application.properties` (datasource trỏ `openerp_dev`).
  - `src/backend/src/test/java/.../service/*Test.java` (`@BeforeEach` `deleteAll()`).
- **Bằng chứng**: `select count(*) from users` sau khi chạy `mvn test` chỉ còn 1 row do test cuối để lại (`twofactor.test@example.com`); tài khoản QA/khách hàng đã biến mất.
- **Đối Chiếu**: AGENTS.md (No H2 - dùng PostgreSQL thật) nhưng phải **cách ly dữ liệu test khỏi dev**; đây là lỗi nghiêm trọng phá dữ liệu môi trường dev.

## 2. Các Bước Tái Hiện
1. Đăng ký một tài khoản qua Web/API trên `openerp_dev` (login OK).
2. Chạy `mvn test` trong `src/backend`.
3. Đăng nhập lại tài khoản vừa tạo → 401; kiểm tra DB thấy user đã bị xóa.

## 3. Kết Quả Thực Tế
- `openerp_dev` bị truncate mỗi lần chạy test; mất toàn bộ người dùng/tenant/session liên quan.

## 4. Kết Quả Kỳ Vọng
- Test dùng **database riêng `openerp_test`** (PostgreSQL thật, không H2), Redis test DB index `/1` như hiện tại; `openerp_dev` không bị ảnh hưởng.
- `scripts/dev/start_infra.bat|sh` tự tạo `openerp_test` nếu chưa có; `docker/postgres/init/01-create-test-database.sql` đảm bảo cho volume mới.
- `mvn test` 22/22 PASS và dữ liệu dev giữ nguyên.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
email                       | status | verified | hash_prefix  | created_at
twofactor.test@example.com  | ACTIVE | t        | $argon2id$v= | 2026-09-18 06:59:08
(1 row)   <-- toàn bộ tài khoản khác đã bị test xóa
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (datasource test → `openerp_test` + `scripts/dev/start_infra.*` tự tạo DB + `docker/postgres/init/01-create-test-database.sql` cho volume mới).
- [x] QA đã re-test: chạy `mvn test` (22/22 PASS) xong `openerp_dev` vẫn còn tài khoản marker `qa.smoke.1789715366@example.com`; login lại **AUTH_LOGIN_SUCCESS**; `openerp_test` chứa dữ liệu test riêng.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: dữ liệu dev đã bị xóa trước khi fix (không khôi phục được) — người dùng cần đăng ký lại tài khoản local; từ nay test không còn ảnh hưởng DB dev.
