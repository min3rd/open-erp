# [BUG-86] Rollback image chưa có hợp đồng phục hồi dữ liệu sau migration

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Review lần 2 (2026-09-20): chưa đạt, trả về To Do

Thiết kế đã thêm snapshot/quiesce/ROLLBACK_FAILED, nhưng [DES-03-API mục 4.4](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md) dòng 178–180 vẫn nhận `snapshot?: boolean` và chỉ snapshot khi true. Với target BREAKING và client truyền false, API không quy định từ chối/ép snapshot; điều này trái SOL-02 mục 4.4 yêu cầu snapshot bắt buộc. Cần quy định server không cho bỏ snapshot với BREAKING; snapshot lỗi phải dừng trước migration và phục hồi trạng thái phục vụ cũ.

P23 còn nhận target_version/restore_snapshot cho rollback thủ công nhưng chưa phân biệt rollback ngay trong upgrade thất bại với rollback sau khi phiên bản mới đã phục vụ ghi. Restore snapshot trước upgrade sau khi đã có giao dịch mới sẽ bỏ mất phần dữ liệu phát sinh. Cần giới hạn rollback vào mốc an toàn hoặc đặc tả bảo toàn dữ liệu mới; xác định snapshot theo operation/from-version/tenant/plugin, kiểm tra snapshot còn tồn tại (retention 30 ngày), và từ chối trước khi dừng dịch vụ khi không thể phục hồi an toàn.

**Kiểm tra bổ sung bắt buộc**: BREAKING + snapshot=false; snapshot lỗi; rollback sau khi v2 đã ghi dữ liệu; snapshot hết hạn/sai version; restore lỗi. Đây là review contract tĩnh, chưa chạy runtime.

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

## Xử Lý Bổ Sung (Review Lần 2 — 2026-09-20)

- **Snapshot bắt buộc với BREAKING**: API **từ chối `snapshot=false`** khi phiên bản đích `migration_policy = BREAKING` → lỗi `PLUGIN_SNAPSHOT_REQUIRED` (không còn tùy chọn tắt).
- **Bảo toàn dữ liệu phát sinh sau nâng cấp**: trước khi restore snapshot pre-upgrade, bắt buộc tạo **preservation snapshot** dữ liệu hiện tại (post-upgrade) → MinIO; dữ liệu mới không bị xóa âm thầm, admin nhận báo cáo cả 2 snapshot; nếu tạo preservation snapshot thất bại → **hủy rollback**.
- Bổ sung `plugin_versions.rollback_strategy = SNAPSHOT_RESTORE | DOWN_MIGRATION`: nếu plugin hỗ trợ `DOWN_MIGRATION` thì không cần restore snapshot (plugin tự chuyển đổi ngược, phải chứng minh tương thích dữ liệu).
- Tài liệu cập nhật: DES-03-DB (cột `rollback_strategy`, quy tắc 10), DES-03-API 4.4, SOL-02 4.4.
