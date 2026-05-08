# TASK-SPRINT-01-SHARED_SERVICES-001: Sửa lỗi parse cấu hình MINIO_USE_SSL

**Task ID:** TASK-SPRINT-01-SHARED_SERVICES-001  
**Sprint:** 01  
**Cluster:** shared-services  
**Loại:** Backend  
**Trạng thái:** 🟡 REVIEW  
**Người phụ trách:** —  
**Phụ thuộc:** —

## Mục tiêu
Khắc phục lỗi khởi động NestJS do `MINIO_USE_SSL` từ biến môi trường đang được đọc thành chuỗi thay vì boolean, gây `InvalidArgumentError` khi khởi tạo MinIO client.

## Phạm vi file ảnh hưởng dự kiến
- `open-erp-backend/libs/shared/services/minio/minio.service.ts`
- `open-erp-backend/libs/shared/services/minio/minio.service.spec.ts`
- `open-erp-backend/.env.example` (nếu cần làm rõ quy ước cấu hình)

## Checklist thực hiện
- [x] Chuẩn hóa parse `MINIO_USE_SSL` thành boolean an toàn (`true`/`false`).
- [x] Đảm bảo tương thích cả khi env có dấu nháy hoặc khác kiểu (`"false"`, `false`, `0`, `1`).
- [x] Bổ sung/điều chỉnh unit test cho luồng khởi tạo MinIO config.
- [x] Kiểm tra lại quá trình boot service không còn throw `InvalidArgumentError`.

## Tiêu chí hoàn thành
- [x] Ứng dụng khởi động thành công khi `MINIO_USE_SSL="false"`.
- [x] Không phát sinh regression cho các chức năng upload/download/presigned URL.
- [x] Cập nhật index task đa cấp theo đúng chuẩn.

## Câu hỏi / Thắc mắc
- [ ] Có yêu cầu chuẩn hóa toàn bộ env boolean khác trong backend ở cùng đợt này không?

## Kết quả thực hiện (điền khi làm)
- Ngày bắt đầu: 2026-05-08
- Ngày hoàn thành: 2026-05-08
- Branch/Commit:
- Files đã tạo/sửa:
  - `open-erp-backend/libs/shared/services/minio/minio.service.ts` - Bổ sung parser boolean an toàn cho `MINIO_USE_SSL` trước khi khởi tạo MinIO client.
  - `open-erp-backend/libs/shared/services/minio/minio.service.spec.ts` - Bổ sung test parse `MINIO_USE_SSL` với các giá trị string/boolean phổ biến.
  - `docs/tasks/TASK-INDEX.md` - Cập nhật trạng thái task sang `🟡 REVIEW`.
  - `docs/tasks/sprints/SPRINT-01/TASK-INDEX.md` - Cập nhật trạng thái task sang `🟡 REVIEW`.
  - `docs/tasks/clusters/shared-services/TASK-INDEX.md` - Cập nhật trạng thái task sang `🟡 REVIEW`.
  - `docs/tasks/sprints/SPRINT-01/shared-services/TASK-SPRINT-01-SHARED_SERVICES-001-fix-minio-usessl-config-parsing.md` - Cập nhật kết quả triển khai và evidence kiểm thử.
- Ghi chú review:
  - Root cause: `ConfigService.get<boolean>('MINIO_USE_SSL')` không đảm bảo ép kiểu runtime; env string như `"false"` vẫn là string và bị MinIO reject.
  - Fix: parse tường minh bằng hàm `parseBooleanConfig`, hỗ trợ `true/false`, `1/0`, `yes/no`, `on/off` (không phân biệt hoa thường, có trim khoảng trắng), fallback về default.

#### Kết quả Unit Test

**Lần chạy:** 2026-05-08 11:36 (ICT)  
**Lệnh:** `npm test -- libs/shared/services/minio/minio.service.spec.ts --runInBand`  
**Kết quả:** ✅ PASS

| Test suite | Tests | Passed | Failed |
|---|---:|---:|---:|
| MinioService | 38 | 38 | 0 |

**Evidence:**
```text
PASS  libs/shared/services/minio/minio.service.spec.ts
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
```

#### Kết quả verify bootstrap

**Lệnh:** `MINIO_USE_SSL='false'; npm run start:common`  
**Kết quả:** ✅ Service boot thành công, không còn lỗi `InvalidArgumentError: Invalid useSSL flag type`.

**Evidence:**
```text
[NestApplication] info: Nest application successfully started
Common Service is running on: http://localhost:3007
```

#### Definition of Done
- [x] Unit test bổ sung cho luồng parse config MinIO.
- [x] Verify bootstrap với `MINIO_USE_SSL="false"` không còn lỗi useSSL type.
- [x] Cập nhật task index đa cấp.
- [ ] Code review được approve.
