# [BUG-84] Backfill entitlement chạy trước seed catalog

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: Done
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Xác nhận review lần 2 (2026-09-20)

DES-03-DB mục 4 đã seed/upsert placeholder trước JOIN, đối soát theo tenant/key và quy định fail-fast. Đóng lỗi mất entitlement do thứ tự seed; lỗi seed UI Slot mới theo dõi riêng BUG-92.

**Done chỉ áp dụng lỗi tài liệu**, qua đối chiếu tĩnh tại HEAD `20b1dd4`; không xác nhận implementation, migration hay runtime đã kiểm thử. Xem [REV-02](../09_review/REV-02_document_rereview_2026-09-20.md).

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), dòng 255 tại thời điểm review.

V3.0.0 chỉ tạo bảng và seed slot; V3.0.1 backfill bằng INNER JOIN plugin_catalog; catalog lại được seed ở V3.0.2 (tùy chọn). Với tenant Sprint 02 có allowed_plugins=['core','sales'] và catalog mới rỗng, dòng sales bị bỏ qua. Khi nguồn sự thật chuyển sang tenant_plugins, quyền đã cấp không còn trong nguồn mới; nếu đối soát là blocking thì migration bị chặn.

## Kết quả mong muốn / hướng sửa

Seed/import toàn bộ catalog cấu hình Sprint 02 trước backfill; quy định xử lý key không nhận diện và đối soát theo từng tenant/key, không chỉ tổng count.

## Tiêu chí kiểm tra sau sửa

Fixture catalog mới rỗng, tenant có core + sales + key cấu hình riêng: sau migration giữ đủ entitlement ngoài Core; chạy lại không trùng; key không ánh xạ được phải báo lỗi rõ ràng.

## Ghi Chú Xử Lý (2026-09-20)

- Đổi thứ tự migration: `V3.0.0` (schema) → **`V3.0.1` (seed/placeholder catalog cho mọi key trong `allowed_plugins` + official plugins)** → `V3.0.2` (backfill).
- Backfill **tự đủ**: bước 1 upsert placeholder catalog cho mọi key thiếu; bước 2 mới tạo `tenant_plugins` — không thể mất entitlement do JOIN.
- Đối soát **theo từng tenant/key** 2 chiều (thiếu + thừa), fail-fast; key lạ được bảo toàn và ghi `RAISE NOTICE` để bổ sung i18n/metadata sau.
- Tài liệu: [DES-03-DB mục 4](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md).
