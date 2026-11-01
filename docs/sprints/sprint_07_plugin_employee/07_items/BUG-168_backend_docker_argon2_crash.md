# [BUG-168] Backend Docker crash SIGSEGV trong Argon2 JNA trên Alpine

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-168 / Bug môi trường / Sprint 07 |
| Mức độ / trạng thái | **Critical** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | `src/backend/Dockerfile`, `PasswordHashService` |

## 1. Mô tả

Backend container start được nhưng crash `SIGSEGV` ở `jna*.tmp` khi xử lý request đăng ký/đăng nhập (Argon2id). Stack: `Argon2id.callLibraryHash` → `jna Native.invokeInt`. Base image `eclipse-temurin:21-jre-alpine` (musl) không tương thích native lib Argon2 của JNA trong môi trường này.

## 2. Cách sửa

- Đổi runtime base sang `eclipse-temurin:21-jre` (glibc).
- Copy Docker CLI static từ `docker:27-cli` thay `apk add docker-cli`.
- Dùng `groupadd/useradd` Debian.

## 3. Kiểm chứng

- Rebuild image, backend start ổn định, đăng ký/login/tenant switch không crash.
- Browser + API E2E thật PASS; 0 crash log.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA dựng backend Docker phát hiện crash Argon2 | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Đổi base glibc; retest register/login/E2E PASS | Developer/QA |
