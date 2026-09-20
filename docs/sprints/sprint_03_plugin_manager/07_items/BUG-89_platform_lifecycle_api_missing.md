# [BUG-89] Các hành động hỗ trợ tenant trên Portal chưa có API tương ứng

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md), dòng 73 tại thời điểm review.

Drawer tenant đang cài có Cài/Gỡ/Nâng cấp/Rollback (RAW-01 còn yêu cầu bật/tắt), nhưng nhóm Platform chỉ có bulk-apply, entitlement và block. Các API lifecycle T3–T7 dùng JWT tenant + quyền tenant; không có contract platform thao tác một tenant, và rollback không có endpoint ở cả hai nhóm. Không có thiết kế dẫn chiếu impersonation để thay thế.

## Kết quả mong muốn / hướng sửa

Đặc tả API/luồng ủy quyền cho Super Admin thao tác lifecycle tenant cụ thể, giữ tenant isolation và audit actor thực; bổ sung rollback hoặc dẫn chiếu rõ luồng hỗ trợ hiện có nếu lựa chọn dùng nó.

## Tiêu chí kiểm tra sau sửa

Super Admin thao tác tenant A từ Drawer và audit đúng actor/tenant; tenant B không đổi; SUPPORT_ENGINEER không được ghi; từng nút có endpoint và kết quả lỗi/thành công xác định.

## Ghi Chú Xử Lý (2026-09-20)

- Bổ sung **P19–P23**: install / uninstall / enable-disable / upgrade / rollback theo tenant; **P22/P23** hỗ trợ `snapshot`/`restore_snapshot`; toàn bộ yêu cầu `reason` và trả `operation_id`.
- Ủy quyền: actor **platform admin thật** (audit `platform_audit_logs` + `target_tenant_id`), **không dùng impersonation**; `SUPPORT_ENGINEER` chỉ xem (403 khi ghi); tenant isolation giữ nguyên.
- UI Drawer "Tenant đang cài" map trực tiếp từng nút → P19–P23.
- Tài liệu: [DES-03-API mục 3](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), [DES-03-UI mục 3.2](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md).

