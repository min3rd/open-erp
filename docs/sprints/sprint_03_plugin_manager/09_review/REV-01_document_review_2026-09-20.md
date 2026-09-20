# [REV-01] Review tài liệu Sprint 03 trước lập trình

- **Ngày**: 2026-09-20
- **Loại**: Review tính nhất quán yêu cầu → xác nhận → giải pháp → thiết kế; không phải nghiệm thu hoặc đóng Sprint.
- **Kết luận**: Chưa nên coi bộ thiết kế hiện tại là sẵn sàng triển khai đầy đủ. Có **6 High, 2 Medium** cần xử lý; không thay đổi quyết định khách hàng đã ký.

## Phát hiện

| Item | Mức độ | Vấn đề |
| :--- | :--- | :--- |
| [BUG-84](../07_items/BUG-84_backfill_before_catalog_seed.md) | High | Backfill entitlement chạy trước seed catalog |
| [BUG-85](../07_items/BUG-85_plugin_identity_scope_conflict.md) | High | Catalog cho phép trùng key nhưng ledger và API chỉ định danh bằng key |
| [BUG-86](../07_items/BUG-86_upgrade_rollback_data_contract.md) | High | Rollback image chưa có hợp đồng phục hồi dữ liệu sau migration |
| [BUG-87](../07_items/BUG-87_tenant_custom_registration_incomplete.md) | High | Luồng custom plugin thiếu upload và chuyển phiên bản sang trạng thái cài được |
| [BUG-88](../07_items/BUG-88_ui_slot_version_and_owner_scope.md) | High | UI Slot Registry chưa phân biệt chủ sở hữu và phiên bản host |
| [BUG-89](../07_items/BUG-89_platform_lifecycle_api_missing.md) | High | Các hành động hỗ trợ tenant trên Portal chưa có API tương ứng |
| [BUG-90](../07_items/BUG-90_private_ui_acceptance_stale.md) | Medium | AC-23.5 vẫn bắt private plugin dùng iframe trái quyết định Gate |
| [BUG-91](../07_items/BUG-91_default_install_acceptance_stale.md) | Medium | AC cài mặc định thiếu nhánh plugin tùy chọn đã được chốt |

Các item chứa nguồn, tình huống gây lỗi, tác động, hướng sửa và tiêu chí kiểm tra. Ưu tiên xử lý migration, định danh plugin và rollback trước; sau đó hoàn thiện contract lifecycle và UI Slot Registry. Hai lỗi AC cần đồng bộ theo chính quyết định Gate hiện có.

## Phạm vi và giới hạn

Đối chiếu Reading Guide, Sprint Plan, RAW/ANL, Confirmation, SOL và ba thiết kế DB/API/UI với quy tắc dự án; kiểm tra bổ sung nền tảng catalog/allowed_plugins Sprint 02 trong mã nguồn. Benchmark được xem về truy vết nội bộ; chưa xác minh lại các tuyên bố thị trường hoặc liên kết bên ngoài. Đây là review tĩnh: chưa chạy migration, backend, container hay browser và không kết luận có lỗi runtime đã tái hiện.

Bước 7–9 chưa thực hiện được Reading Guide ghi rõ; thiếu test report, screenshots và user guide hoàn tất ở thời điểm thiết kế không tự động bị coi là lỗi nghiệm thu. Cần hoàn thành các bằng chứng này khi triển khai/QA. Các nhãn trạng thái cũ (Draft/chờ Gate/chờ Bước 6) còn rải rác; đây là ghi chú biên tập, không thay thế các phát hiện chức năng ở trên.

## Thay đổi trong phiên review

Chỉ thêm báo cáo và 8 file BUG ở trạng thái To Do, kèm liên kết báo cáo trong Reading Guide. Chưa sửa nội dung yêu cầu/thiết kế, chưa lập trình và chưa đóng Sprint.

## Cập Nhật Xử Lý (2026-09-20) — Bởi Đội Dự Án

- **8/8 phát hiện đã được xử lý trong tài liệu thiết kế** (commit `b33da71`); các item [BUG-84](../07_items/BUG-84_backfill_before_catalog_seed.md) → [BUG-91](../07_items/BUG-91_default_install_acceptance_stale.md) chuyển trạng thái `In Review` kèm "Ghi Chú Xử Lý" trong từng file.
- Tóm tắt xử lý:
  - **BUG-84**: thứ tự migration Schema → Seed/placeholder catalog → Backfill; backfill tự đủ + đối soát theo từng tenant/key (fail-fast); key lạ được bảo toàn.
  - **BUG-85**: `plugin_key` **duy nhất toàn cục** cho mọi visibility + trigger `trg_tenant_plugin_scope` + ràng buộc service theo tenant sở hữu.
  - **BUG-86**: `migration_policy (COMPATIBLE/BREAKING)`, quiesce + snapshot schema trước nâng cấp, khôi phục snapshot khi rollback, trạng thái **`ROLLBACK_FAILED`** (không ACTIVE nếu phục hồi lỗi).
  - **BUG-87**: bổ sung endpoint tenant T14–T18 (upload/thêm phiên bản/publish/deprecate/xóa) + ràng buộc sở hữu `artifact_ref`.
  - **BUG-88**: UI Slot Registry theo `(owner_plugin_key, slot_code, contract_version)` + `declared_in_version`; manifest phiên bản host là nguồn sự thật.
  - **BUG-89**: API P19–P23 thao tác lifecycle theo tenant với audit actor thật (không impersonation).
  - **BUG-90/BUG-91**: viết lại AC-23.5 và AC-21.5 theo quyết định Gate.
- Bổ sung **Phụ lục 9 trong CONF-01** và mục **"Nhật Ký Rà Soát Thiết Kế"** trong Reading Guide; dọn các nhãn trạng thái cũ (Draft/chờ Gate) trong ANL/Sprint Plan.
- **Đề nghị Reviewer/QA xác nhận đóng từng item**; khi 0 item Critical/High còn `To Do`/chưa xử lý → chuyển sang Bước 7 (Lập trình).

