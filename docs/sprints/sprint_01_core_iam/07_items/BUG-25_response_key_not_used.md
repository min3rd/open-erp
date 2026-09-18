# [BUG-25] Không Sử Dụng Enum ResponseKey — Hardcode String Literal Trong Payload

- **Mã Lỗi**: BUG-25
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Enum `ResponseKey` đã được khai báo nhưng không được sử dụng: các service vẫn dùng chuỗi literal cho key payload, vi phạm quy tắc "Zero-Hardcode Payload Keys"; enum cũng thiếu các key đang dùng thực tế.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Core IAM — Payload phản hồi API (Auth/Account).
- **File liên quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/enums/ResponseKey.java` — không có các key `FIELD`, `SLUG`, `LOCKED_SECONDS`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java:47-48` — `params.put("field", "email")`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java:127-128` — `params.put("slug", slug)`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java:134-135` — `params.put("field", "email")`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java:189-190` — `params.put("locked_seconds", remaining)`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AccountService.java:10` — import `ResponseKey` nhưng không sử dụng, chưa chuẩn hóa key payload theo enum.
- **Tài liệu đối chiếu**:
  - AGENTS.md — mục "Chuẩn Hóa ResponseKey Enum (Zero-Hardcode Payload Keys)".
  - DES-02 mục 1.2 và các mục 2.1, 2.3, 2.4 (`docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md`) quy định `params` chứa `field`, `slug`, `locked_seconds`.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đọc `ResponseKey.java` để liệt kê các key hiện có.
2. Gọi API trùng email: `POST /api/v1/auth/register/personal` (email đã tồn tại) và `POST /api/v1/auth/register/business` (slug/email đã tồn tại).
3. Đăng nhập sai mật khẩu quá 5 lần để nhận lỗi `AUTH_ACCOUNT_LOCKED`.
4. Kiểm tra trường `params` trong response lỗi và đối chiếu nguồn sinh key trong `AuthService.java`.

## 3. Kết Quả Thực Tế (Actual Result)
- `params` được sinh từ string literal (`"field"`, `"slug"`, `"locked_seconds"`) thay vì `ResponseKey.X.getKey()`.
- `ResponseKey.java` thiếu hẳn 3 hằng số tương ứng, dễ sai lệch key khi refactor và không đảm bảo hợp đồng API tập trung.
- `AccountService.java` import `ResponseKey` nhưng không dùng, tiếp tục hardcode giá trị.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung `FIELD`, `SLUG`, `LOCKED_SECONDS` vào `ResponseKey.java`.
- Thay toàn bộ string literal bằng `ResponseKey.FIELD.getKey()`, `ResponseKey.SLUG.getKey()`, `ResponseKey.LOCKED_SECONDS.getKey()` tại `AuthService.java` và các service liên quan (kể cả `AccountService.java`).
- Không còn chuỗi tự do cho key payload trong toàn bộ tầng backend.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: ResponseKey bổ sung FIELD/SLUG/LOCKED_SECONDS/RETRY_AFTER/AVAILABLE và được dùng thay toàn bộ literal trong AuthService/TwoFactorService.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
