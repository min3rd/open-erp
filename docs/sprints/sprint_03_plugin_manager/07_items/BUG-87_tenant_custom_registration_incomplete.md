# [BUG-87] Luồng custom plugin thiếu upload và chuyển phiên bản sang trạng thái cài được

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: Done
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Xác nhận review lần 2 (2026-09-20)

DES-03-API T14–T18 và mục 4.3 đã bổ sung upload, version, publish, ownership và luồng DRAFT → PUBLISHED. Đóng thiếu luồng đăng ký; ràng buộc khóa khẩn cấp của luồng mới theo dõi riêng BUG-93.

**Done chỉ áp dụng lỗi tài liệu**, qua đối chiếu tĩnh tại HEAD `20b1dd4`; không xác nhận implementation, migration hay runtime đã kiểm thử. Xem [REV-02](../09_review/REV-02_document_rereview_2026-09-20.md).

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [06_designs/api/PLUGIN_MANAGER_API_SPEC.md](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), dòng 150 tại thời điểm review.

T8 nhận body như P5; nguồn JAR_BUNDLE cần artifact_ref từ P4, nhưng P4 chỉ dành SUPER_ADMIN. P5 tạo DRAFT và chỉ P6 thuộc Platform có PUBLISH; không có luồng tenant upload, tự publish sau xác minh hay bổ sung phiên bản riêng được đặc tả. Tenant Admin vì vậy không thể đi hết luồng 3 nguồn rồi tự cài/nâng cấp như Gate đã chốt.

## Kết quả mong muốn / hướng sửa

Bổ sung contract upload theo tenant và ràng buộc sở hữu artifact_ref; mô tả rõ đăng ký/phiên bản mới/xác minh/chuyển trạng thái cài được của private plugin, quyền và lỗi. Có thể gộp trong T8 nhưng phải xác định request và state transition.

## Tiêu chí kiểm tra sau sửa

Tenant A tự đăng ký và cài từ cả 3 nguồn, thêm bản v2 rồi nâng cấp; không cần tài khoản platform; tenant B không dùng được artifact/credential của A.

## Ghi Chú Xử Lý (2026-09-20)

- Bổ sung endpoint tenant: **T14** upload artifact, **T15** đăng ký thêm phiên bản, **T16** danh sách phiên bản, **T17** PUBLISH/DEPRECATE, **T18** xóa phiên bản chưa dùng.
- Ràng buộc sở hữu: `artifact_ref` gắn `owner_tenant_id`; từ chối `PLUGIN_ARTIFACT_NOT_OWNED` khi dùng artifact/credential của tenant khác.
- Luồng trạng thái rõ: upload → xác minh (checksum/manifest/compatibility) → `DRAFT` → `PUBLISHED` (T17, chỉ khi đã xác minh — `PLUGIN_VERSION_NOT_VERIFIED`) → cài/nâng cấp cho chính tenant; tenant không được `BLOCK` (chỉ nền tảng).
- UI: Drawer plugin riêng có quản lý phiên bản; tài liệu: [DES-03-API mục 4.3](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), [DES-03-UI mục 4.3](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md), ANL-03 mục 3.6.

## Xác nhận triển khai (2026-09-20)

Đã code đủ backend luồng plugin riêng theo DES-03-API mục 4.3, kiểm thử trên PostgreSQL thật:

- `POST /api/v1/tenant/plugins/register` (T8): tạo catalog `TENANT_PRIVATE` + version `DRAFT`, kiểm tra `allow_custom_plugins` + `core:plugin:register-custom`, ràng buộc sở hữu `artifact_ref`.
- `DELETE /api/v1/tenant/plugins/{key}/catalog` (T9): chỉ khi plugin `UNINSTALLED`/`NOT_INSTALLED`; xóa ledger + versions + catalog.
- `POST|GET /{key}/versions` (T15/T16), `PATCH /{key}/versions/{version}` (T17 — chỉ PUBLISH/DEPRECATE, BLOCK bị từ chối 400), `DELETE /{key}/versions/{version}` (T18 — `PLUGIN_VERSION_IN_USE` khi đang ghim).
- `install()` tự tạo ledger cho plugin `TENANT_PRIVATE` thuộc chính tenant (không cần P12), tenant khác vẫn `PLUGIN_NOT_ENTITLED`.
- Audit mới: `PLUGIN_TENANT_REGISTERED`, `PLUGIN_TENANT_VERSION_ADDED|PUBLISHED|DEPRECATED|REMOVED`, `PLUGIN_TENANT_CATALOG_DELETED`.
- Test `testTenantCustomPluginFlow` PASS (register → publish → install ACTIVE → chặn xóa version đang dùng → uninstall → xóa version → xóa catalog).

Tiêu chí kiểm tra "tenant B không dùng được artifact của A" đã có test `PluginCredentialAndUploadTest.testUploadOwnership`; UI Drawer plugin riêng thuộc TASK-317.

