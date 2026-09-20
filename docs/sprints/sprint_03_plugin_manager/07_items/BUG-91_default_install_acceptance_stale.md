# [BUG-91] AC cài mặc định thiếu nhánh plugin tùy chọn đã được chốt

- **Loại**: Documentation / Design defect
- **Severity**: Medium
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: BA Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [04_confirmation/CONF-01_sprint_03_scope.md](../04_confirmation/CONF-01_sprint_03_scope.md), dòng 89 tại thời điểm review.

AC-21.5 chỉ Given default_install rồi yêu cầu ACTIVE cho tenant mới. Câu 7 Gate lại chốt plugin bắt buộc locked mới ACTIVE, plugin tùy chọn NOT_INSTALLED. Thiếu điều kiện locked làm Dev/QA có hai kết quả khác nhau cho default_install=true, locked=false.

## Kết quả mong muốn / hướng sửa

Tách AC theo default_install/locked, phản ánh vào provisioning/bulk apply; đặc tả cách cấu hình locked vì P3 hiện chỉ liệt kê default_install.

## Tiêu chí kiểm tra sau sửa

Plugin mặc định bắt buộc được deploy ACTIVE và chặn tắt/gỡ; plugin mặc định tùy chọn chỉ nhận entitlement NOT_INSTALLED theo Gate; hành vi quota/deploy lỗi được mô tả.

## Ghi Chú Xử Lý (2026-09-20)

- Viết lại **AC-21.5**: `default_install=true, locked=true` → tự động **ACTIVE** và không thể tắt/gỡ; `default_install=true, locked=false` → chỉ tạo **NOT_INSTALLED** chờ Tenant Admin bật.
- Bổ sung `locked` vào **P3** và thêm **P24** (`PATCH /platform/plugins/{key}` để chỉnh `default_install`/`locked`/metadata); hành vi provisioning/bulk apply bám theo `locked`.
- UI: Tầng 1 Drawer Catalog có chỉnh metadata P24 kèm xác nhận + audit.
- Tài liệu: [CONF-01 AC-21.5 + Phụ lục 9 #8](../04_confirmation/CONF-01_sprint_03_scope.md), [DES-03-API mục 3](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), [DES-03-UI mục 3.2](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md).

