# [BUG-27] Hardcode JWT Issuer Và Dùng Chung Khóa Dev Cho Mọi Môi Trường

- **Mã Lỗi**: BUG-27
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> `JwtTokenService` hardcode issuer trùng lặp với cấu hình Quarkus; cặp khóa ký JWT nằm chung trong `src/main/resources` dùng cho mọi môi trường, không có override `%prod`/`%staging`, gây rủi ro dùng khóa dev ở production.

- **Môi trường**: Local (ảnh hưởng Staging/Production).
- **Tính năng / Module bị ảnh hưởng**: Core IAM — Ký/Xác thực JWT (FEAT-03).
- **File liên quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/security/JwtTokenService.java:12` — `private static final String ISSUER = "https://openerp.9ms.io.vn/auth";`.
  - `src/backend/src/main/resources/application.properties:20` — `mp.jwt.verify.issuer=https://openerp.9ms.io.vn/auth`.
  - `src/backend/src/main/resources/application.properties:23` — `smallrye.jwt.new-token.issuer=https://openerp.9ms.io.vn/auth` (trùng lặp nguồn cấu hình).
  - `src/backend/src/main/resources/privateKey.pem` và `src/backend/src/main/resources/publicKey.pem` — dùng chung cho mọi môi trường; cấu hình `smallrye.jwt.sign.key.location=privateKey.pem` / `mp.jwt.verify.publickey.location=publicKey.pem` (application.properties:21-22) không có override `%prod`/`%staging`.
- **Tài liệu đối chiếu**:
  - AGENTS.md — mục "Cấm Hardcode URL & Cấu Hình Động Backend (Config-Driven URL Invariant)" và mục "Quản Lý Phiên Bản & Bảo Vệ Mã Nguồn (.gitignore)" (loại trừ `*.pem`, keystore).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đọc `JwtTokenService.java:12` và so sánh với `application.properties:20,23`.
2. Kiểm tra `src/backend/src/main/resources/` — tồn tại `privateKey.pem`, `publicKey.pem`.
3. Thay đổi giá trị issuer trong `application.properties` rồi phát hành token, giải mã để kiểm tra claim `iss`.
4. Triển khai lên Staging/Production mà không thay thế file khóa.

## 3. Kết Quả Thực Tế (Actual Result)
- Issuer trong token luôn là giá trị hardcode tại `JwtTokenService.java:12`, bỏ qua cấu hình Quarkus; đổi cấu hình không có tác dụng.
- Cặp khóa dev `privateKey.pem`/`publicKey.pem` được dùng cho mọi môi trường — nếu lộ khóa dev có thể giả mạo token trên production/staging.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Loại bỏ hardcode: nạp issuer qua `@ConfigProperty` (`smallrye.jwt.new-token.issuer` / `mp.jwt.verify.issuer`) hoặc để SmallRye JWT tự lấy từ cấu hình.
- Tách khóa theo môi trường: bổ sung cấu hình `%prod`, `%staging` trỏ tới khóa riêng (secret mount/PEM ngoài repo); không commit khóa thật vào `src/main/resources`.
- Đảm bảo issuer phát hành và issuer xác thực luôn nhất quán theo cấu hình từng môi trường.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
