# [BUG-86] Rollback image chưa có hợp đồng phục hồi dữ liệu sau migration

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md](../05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md), dòng 115 tại thời điểm review.

Plugin mới tự migrate trước health; khi health fail, giải pháp chỉ rollback image cũ. Nếu migration đã đổi/xóa cột mà v1 cần, khởi động lại v1 không khôi phục schema. ANL-02 có file down cho rollback và SOL-02 có pg_dump vận hành, nhưng chưa có bước backup, gọi down/restore, điều kiện tương thích hoặc xử lý rollback thất bại trong luồng upgrade.

## Kết quả mong muốn / hướng sửa

Đặc tả upgrade/rollback gồm chính sách migration tương thích ngược hoặc backup/restore được kiểm chứng, khóa ghi, mốc phục hồi và trạng thái khi phục hồi lỗi; không đánh dấu ACTIVE chỉ vì đổi lại image.

## Tiêu chí kiểm tra sau sửa

Kịch bản v2 migrate thành công rồi health fail, migration lỗi một phần và rollback lỗi: xác định trạng thái ledger, khả năng chạy v1 và toàn vẹn dữ liệu trước khi phục vụ lại.

## Ghi Chú Xử Lý (2026-09-20)

- Bổ sung `plugin_versions.migration_policy = COMPATIBLE | BREAKING`; `BREAKING` bắt buộc snapshot schema trước nâng cấp.
- Quy trình: **quiesce → pg_dump schema → MinIO** → deploy bản mới → health; rollback khôi phục snapshot khi BREAKING.
- Thêm trạng thái **`ROLLBACK_FAILED`**: không đánh dấu ACTIVE dù image cũ đã deploy; thông báo khẩn + giữ snapshot; chỉ ACTIVE sau health OK.
- Mã lỗi: `PLUGIN_SNAPSHOT_FAILED`, `PLUGIN_RESTORE_SNAPSHOT_FAILED`, `PLUGIN_ROLLBACK_NOT_ALLOWED`; audit `TENANT_PLUGIN_ROLLED_BACK`.
- Tài liệu: [SOL-02 mục 4.4](../05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md), [DES-03-API mục 4.4](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), DES-03-DB mục 2.2/3.

