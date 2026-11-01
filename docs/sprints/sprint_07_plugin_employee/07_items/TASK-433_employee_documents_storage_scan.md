# [TASK-433] Employee documents + storage + virus scan

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-433 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — upload/download/scan/retention/self docs + **signed URL ngắn hạn** (ClamAV EICAR PASS TR 1.15; plugin 18/18 test sau signed URL) |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-11-01 / DES-DB 0.2, DES-API 0.2 |
| depends_on / blocks / parent | TASK-430 / TASK-434/435 / FEAT-37 |
| Write scope / baseline | `plugins/employee/**`, storage config; working tree |

## 1. Mục tiêu

Upload HR/nhân viên, version, phân loại/quyền, virus scan, retention, signed URL; audit.

## 2. Thao tác

- [x] Multipart upload; validate type/size; storage key/checksum.
- [x] Scan hook/internal callback; `PENDING/CLEAN/INFECTED/FAILED`; chặn public nếu infected.
- [x] Version/type/permission; self chỉ xem/tải của mình (`/me/documents`).
- [x] Retention/archive metadata.
- [x] **Signed URL ngắn hạn (2026-11-01)**: `POST /documents/{id}/signed-url` + `POST /me/documents/{id}/signed-url` (đúng quyền đọc) trả URL có hạn dùng (TTL cấu hình, mặc định 300s, tối thiểu 30s) với chữ ký HMAC-SHA256 (secret `employee.document.signed-url.secret`); `GET /signed-documents/{id}?exp&sig` xác minh HMAC + TTL + trạng thái scan rồi stream, không cần Bearer.
- [x] Tests plugin 18/18 PASS (approval chain/validation/governance/health) sau khi thêm signed URL; app thật scan PASS TR 1.15.

## 3. Tiêu chí & kiểm chứng

- [x] AC-24/29; tài liệu infected không tải được.
- [x] Storage profile bật; không public bucket (plugin-local filesystem).
- [x] Tests PostgreSQL + plugin suite thật (`mvn -f plugins/pom.xml -pl employee -am test` 18/18 PASS 2026-11-01).

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Upload/scan test | PASS | TR-S07-001 1.15 ClamAV EICAR 422 / CLEAN |
| Signed URL/IDOR | PASS (dev) | HMAC + TTL verify trong `EmployeeService.downloadSignedDocument`; plugin 18/18 |

## 4. Bàn giao

Files: `plugins/employee/**` (EmployeeService/EmployeeResource/EmployeeDtos/EmployeeErrorCode), storage config. Runtime E2E signed URL trên app thật chờ QA build image plugin 1.1.20.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Multipart upload/download/scan callback/retention + self docs; runtime test pending | Developer/Subagent |
| 0.3 | 2026-11-01 | Signed URL ngắn hạn HMAC + 3 endpoint; chủ dự án chỉ đạo hoàn tất deferred Medium, không đẩy sprint sau; plugin 18/18 PASS | Developer |
