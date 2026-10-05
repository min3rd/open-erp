# [BUG-93] Thiếu trạng thái khóa catalog và chốt chặn publish sau khóa

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: Done (đóng 2026-10-05 theo xác nhận của chủ dự án — hồ sơ [QA-02](../08_testing/QA-02_sprint_03_requal_2026-10-05.md))
- **Ngày phát hiện**: 2026-09-20 (review lần 2)
- **Người xử lý**: Solution Architect Agent

## Bằng chứng và tác động

Nguồn: [06_designs/api/PLUGIN_MANAGER_API_SPEC.md](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), dòng 129 tại HEAD 20b1dd4.

ANL-01 mục 4.6 yêu cầu khóa plugin và chỉ Super Admin được mở lại. DDL chỉ lưu BLOCKED ở plugin_versions; plugin_catalog không có trạng thái khóa (locked mang nghĩa plugin mặc định không được gỡ). T15 cho tenant thêm version và T17 cho PUBLISH phiên bản đã xác minh, nhưng không có precondition catalog không bị khóa hoặc cấm chuyển BLOCKED → PUBLISHED. Sau P15 khóa plugin riêng, tenant vẫn có luồng đăng ký v2 DRAFT → PUBLISHED → cài theo contract hiện tại; việc khóa các version đang tồn tại không chặn được version mới.

## Hướng xử lý

Thiết kế trạng thái khóa cấp catalog độc lập locked/default_install, ghi actor/reason/time và chỉ platform được unblock. Ràng buộc T8/T15/T17 cùng install/upgrade/enable, job đang chạy và gateway theo khóa hiệu lực; chốt bảng chuyển trạng thái phiên bản để tenant không thể publish lại BLOCKED.

## Tiêu chí kiểm tra sau sửa

Super Admin khóa private plugin A: tenant không publish lại version bị khóa, không phát hành/cài version mới để vượt khóa; job cài đang chạy không chuyển ACTIVE sau khóa; chỉ unblock hợp lệ của platform mới khôi phục quyền.

Đây là khoảng trống thiết kế và rủi ro triển khai theo contract, chưa phải bypass đã tái hiện trên ứng dụng.

## Ghi Chú Xử Lý (2026-09-20)

- Thêm trạng thái khóa **cấp catalog**: `plugin_catalog.catalog_status = ACTIVE | BLOCKED` (+ `blocked_reason/at/by`), **độc lập** với `locked` (mặc định không gỡ) và `release_status` của phiên bản.
- `P7` mở rộng `scope: VERSION | CATALOG`; thêm **`P25` unblock** (chỉ SUPER_ADMIN). Trigger `trg_plugin_version_publish_guard` chặn publish khi catalog `BLOCKED` (defense-in-depth).
- Chốt bảng chuyển trạng thái version: `BLOCKED → PUBLISHED` **chỉ Platform**; tenant không thể publish lại version bị khóa.
- Ràng buộc T3/T6/T15/T17 và **job đang chạy ở bước ACTIVATE** phải kiểm tra lại catalog/version → nếu bị khóa giữa chừng thì bù trừ (undeploy), không ACTIVE.
- UI: badge "Đã khóa" + ẩn/khóa hành động + nút Mở khóa (P25).
- Tài liệu: DES-03-DB mục 2.1/2.2/5, DES-03-API mục 3, DES-03-UI mục 3.1/3.2/4.1, ANL-01 BR-PLG-09, SOL-01 mục 4.3.

