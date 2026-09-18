# [BUG-28] Model ApiResponse Frontend Lệch Envelope Backend

- **Mã Lỗi**: BUG-28
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Model `ApiResponse` phía Frontend khai báo thiếu/thừa trường so với envelope thực tế của Backend; Frontend không kiểm tra `success` và không map lỗi `VALIDATION_FAILED` về từng input.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Toàn bộ API Core IAM — tầng xử lý response/error (FEAT-01 → FEAT-06).
- **File liên quan**:
  - `src/frontend/shared/models/api.model.ts:1-12` — `ApiResponse` chỉ có `code`, `data`, `meta` (thừa — Backend không trả `meta`), thiếu `success`, `message`, `params`; `ApiErrorResponse` thiếu `success` và `errors[]`.
  - `src/backend/src/main/java/com/vn9melody/openerp/core/api/ApiResponse.java:8-13` — envelope thật trả `success`, `code`, `message`, `params`, `data`.
  - Các service/component phía Frontend xử lý response nhưng không kiểm tra `success`.
  - Lỗi `VALIDATION_FAILED` trả về dạng `errors[]` gồm `field` + `code` nhưng Frontend không map về từng ô nhập liệu.
- **Tài liệu đối chiếu**: DES-02 mục 1 (`docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md`) — khung `ApiResponse<T>` (1.1) và `ApiErrorResponse` (1.2).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Gọi một API thành công (ví dụ `GET /api/v1/account/profile`) và ghi lại payload trả về.
2. Gọi API lỗi validation (ví dụ đăng ký với mật khẩu yếu) để nhận `VALIDATION_FAILED` kèm `errors[]`.
3. Đối chiếu payload với khai báo `ApiResponse`/`ApiErrorResponse` trong `api.model.ts`.
4. Kiểm tra logic xử lý response/error trong service và component.

## 3. Kết Quả Thực Tế (Actual Result)
- Kiểu dữ liệu FE không phản ánh đúng envelope: `success`, `message`, `params` bị thiếu; `meta` luôn `undefined` khi truy cập.
- Frontend không kiểm tra `success`, chỉ dựa vào HTTP status nên dễ bỏ sót lỗi nghiệp vụ trả kèm HTTP 200.
- Lỗi validation hiển thị chung chung, không gắn thông báo về đúng trường nhập liệu theo `errors[].field`.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Cập nhật `src/frontend/shared/models/api.model.ts` khớp DES-02 mục 1: `ApiResponse<T>` gồm `success`, `code`, `message`, `params`, `data`; `ApiErrorResponse` gồm `success`, `code`, `message`, `params`, `errors[]` (bỏ `meta`).
- Frontend kiểm tra `success` trước khi xử lý `data`.
- Map `errors[]` (field + code) về từng input để hiển thị lỗi i18n đúng vị trí.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: ApiResponse FE chuẩn hóa {success,code,message?,params?,data,errors?} (bỏ meta), service kiểm tra success; Web build PASS.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
