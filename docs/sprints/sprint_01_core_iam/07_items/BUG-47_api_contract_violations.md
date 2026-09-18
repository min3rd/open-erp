# [BUG-47] Vi Phạm Quy Chuẩn API Contract (4 Khuôn Mẫu Bắt Buộc)

- **Mã Lỗi**: BUG-47
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (audit theo yêu cầu khách hàng)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Audit API Sprint 01 đối chiếu `.agents/rules/api_standards.md` và DES-02 phát hiện 4 vi phạm:

1. **Lỗi Bean Validation trả format mặc định của Quarkus** (Khuôn mẫu 4 sai hoàn toàn):
   `POST /api/v1/auth/register/personal` với body không hợp lệ trả:
   ```json
   {"title":"Constraint Violation","status":400,"violations":[{"field":"registerPersonal.req.fullName","message":"must not be blank"}, ...]}
   ```
   Thiếu `success/code/params/errors/timestamp`, field name là đường dẫn Java (`registerPersonal.req.fullName`) thay vì `full_name`, message thô không có `code` i18n.
2. **`GET /api/v1/account/sessions` trả mảng trần** `data: [...]` → vi phạm Khuôn mẫu 3 (phải bọc `data: { "items": [...] }`).
3. **Thao tác không có dữ liệu trả về bị thiếu `data`**: `POST /auth/logout`, `POST /account/change-password` trả envelope không có key `data` (do `@JsonInclude(NON_NULL)`); quy tắc yêu cầu `data: null`.
4. **`errors[]` luôn rỗng** và kiểu `List<Map<String,String>>` không đủ để chứa `params` object theo quy tắc (`{field, code, params}`); lỗi validation không được ánh xạ vào `errors`.

- **Môi trường**: Local (backend 8088)
- **Tài Liệu Đối Chiếu**: `.agents/rules/api_standards.md` mục 2.1/2.3/2.4, mục 3/4; `06_designs/api/CORE_IAM_API_SPEC.md`.

## 2. Các Bước Tái Hiện
1. `curl -X POST /api/v1/auth/register/personal` body `{"email":"not-an-email","password":"123"}` → 400 format sai.
2. Đăng nhập, gọi `GET /api/v1/account/sessions` → `data` là mảng.
3. Gọi `POST /api/v1/auth/logout` → envelope thiếu `data`.
4. Gửi payload sai định dạng JSON → `VALIDATION_FAILED` nhưng `errors: []`.

## 3. Kết Quả Thực Tế
- Sai 4 khuôn mẫu/chuẩn hóa; frontend không thể hiển thị lỗi theo trường bằng i18n.

## 4. Kết Quả Kỳ Vọng
- Validation error: `{success:false, code:"VALIDATION_FAILED", params:{}, errors:[{field:"full_name", code:"VALIDATION_REQUIRED", params:{}}, {field:"email", code:"VALIDATION_EMAIL"}, {field:"password", code:"VALIDATION_SIZE", params:{min:8,max:64}}], timestamp}`.
- Sessions: `data: { "items": [ ... ] }`.
- Thao tác không có data: envelope có `"data": null`.
- Malformed JSON: `errors:[{field:null, code:"VALIDATION_MALFORMED_JSON", params:{}}]`.
- Không hardcode message tiếng Việt; `message` tiếng Anh kỹ thuật.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
HTTP/1.1 400 Bad Request
validation-exception: true
{"title":"Constraint Violation","status":400,"violations":[{"field":"registerPersonal.req.fullName","message":"must not be blank"}]}

GET /account/sessions -> "data":[ {...} ]   (phải là {"items":[...]})
POST /auth/logout -> {"success":true,"code":"AUTH_LOGOUT_SUCCESS","message":"...","params":{}}  (thiếu "data": null)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (mapper validation + envelope + sessions items + data null + errors typed).
- [x] QA đã re-test bằng curl + `mvn test` + build FE Web/Mobile.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Đã sửa toàn bộ - ValidationExceptionMapper trả khuôn mẫu 4 với errors[{field,code,params}] (field snake_case), malformed JSON → VALIDATION_MALFORMED_JSON, sessions bọc data.items, envelope luôn có data (null khi không có dữ liệu), ApiFieldError typed; backend 34/34 test PASS; Web/Mobile build PASS; curl verify đủ 4 khuôn mẫu.
