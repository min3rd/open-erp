# [BUG-87] Luồng custom plugin thiếu upload và chuyển phiên bản sang trạng thái cài được

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

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

