# [BUG-41] Fresh Clone Không Chạy Được Backend Do Thiếu Bootstrap Khóa JWT

- **Mã Lỗi**: BUG-41
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Fresh clone không thể khởi chạy backend: cặp khóa `publicKey.pem` / `privateKey.pem` bị `.gitignore` loại trừ nhưng không có script hay tài liệu nào hướng dẫn sinh khóa, khiến Quarkus fail ngay khi nạp cấu hình JWT.

- **Môi trường**: Local (fresh clone)
- **Tính Năng / Module Bị Ảnh Hưởng**: Core IAM — Khởi động backend Quarkus & ký/xác thực JWT (mọi FEAT).
- **File Liên Quan**:
  - `src/backend/src/main/resources/application.properties:25-26` — `mp.jwt.verify.publickey.location=publicKey.pem`, `smallrye.jwt.sign.key.location=privateKey.pem`.
  - `src/backend/.gitignore:19` — `*.pem` bị loại trừ, không bao giờ được commit.
  - Trước khi sửa: không tồn tại script sinh khóa, không có mục hướng dẫn bootstrap trong tài liệu triển khai.
- **Tài Liệu Đối Chiếu**: AGENTS.md — mục "Quản Lý Phiên Bản & Bảo Vệ Mã Nguồn (.gitignore)" (loại trừ `*.pem`) và yêu cầu fresh clone chạy được local.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Clone repo sạch (không có `privateKey.pem` / `publicKey.pem`).
2. Chạy `make infra` để khởi động PostgreSQL + Redis.
3. Chạy `make backend` (hoặc `scripts\dev\run_backend.bat`).
4. Quan sát log khởi động Quarkus.

## 3. Kết Quả Thực Tế (Actual Result)
- Backend fail khi nạp khóa JWT do thiếu file `publicKey.pem` / `privateKey.pem`.
- Không có hướng dẫn nào cho dev mới biết phải sinh khóa; fresh clone bị chặn hoàn toàn.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Có script sinh khóa RSA dev đúng định dạng SmallRye JWT (private PKCS#8, public SPKI), bỏ qua nếu khóa đã tồn tại, hỗ trợ `--force` và `--out`.
- Script tự động được gọi khi khởi chạy backend mà thiếu khóa.
- Tài liệu local setup mô tả rõ bước bootstrap khóa cho fresh clone.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
```
[error]: Failed to read sign key from privateKey.pem (NoSuchFileException)
[error]: Failed to read public key from publicKey.pem (NoSuchFileException)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (thêm `scripts/dev/generate_jwt_keys.js`: RSA 2048, PKCS#8 + SPKI, skip nếu tồn tại, hỗ trợ `--force`, `--out`; `run_backend.bat`/`run_backend.sh` tự gọi khi thiếu khóa; tài liệu `docs/07_deployment_guides/local_setup_guide.md` mục 3.5).
- [x] QA đã re-test và xác nhận không còn lỗi (chạy `node scripts\dev\generate_jwt_keys.js --out <temp>` sinh đúng cặp PEM với header `-----BEGIN PRIVATE KEY-----` / `-----BEGIN PUBLIC KEY-----`; chạy lại không có `--force` thì skip).
- [x] Không gây lỗi phát sinh (Regression test pass; backend khởi động bình thường sau khi khóa được sinh tự động).
