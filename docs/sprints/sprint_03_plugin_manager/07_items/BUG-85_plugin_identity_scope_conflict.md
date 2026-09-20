# [BUG-85] Catalog cho phép trùng key nhưng ledger và API chỉ định danh bằng key

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), dòng 57 tại thời điểm review.

Hai unique index cho phép PLATFORM sales và TENANT_PRIVATE sales của cùng tenant tồn tại đồng thời. Ledger lại UNIQUE(tenant_id, plugin_key), còn route tenant và dependency dùng key. Cấp quyền/cài cả hai bị xung đột; tài liệu không quy định từ chối trùng hay cách chọn đúng catalog, nên có nguy cơ thao tác nhầm plugin.

## Kết quả mong muốn / hướng sửa

Chốt định danh thống nhất: catalog_id/namespace xuyên suốt ledger, API, dependency, runtime; hoặc cấm rõ key riêng trùng key platform bằng validation/ràng buộc phù hợp. Bổ sung kiểm tra owner tenant.

## Tiêu chí kiểm tra sau sửa

Có platform sales và private sales của tenant A/B: đăng ký/cấp quyền/cài/gỡ phải có kết quả duy nhất theo chính sách; không chọn nhầm catalog hay tenant.

## Ghi Chú Xử Lý (2026-09-20)

- Chốt chính sách: **`plugin_key` duy nhất TOÀN CỤC cho mọi visibility** (kể cả TENANT_PRIVATE) — bỏ 2 partial unique index; gợi ý đặt tên plugin riêng theo tenant-slug (`acme-hrm`).
- Bổ sung **trigger `trg_tenant_plugin_scope`** + ràng buộc service: tenant chỉ được cài plugin PLATFORM hoặc plugin riêng **của chính tenant**; lỗi `PLUGIN_ARTIFACT_NOT_OWNED`/`PLUGIN_NOT_ENTITLED`.
- Cập nhật quy ước API: mọi path/ledger/dependency/UI Slot dùng `plugin_key` toàn cục — không mơ hồ.
- Tài liệu: [DES-03-DB mục 2.1/2.3](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [DES-03-API mục 1](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), ANL-01 BR-PLG-22.

