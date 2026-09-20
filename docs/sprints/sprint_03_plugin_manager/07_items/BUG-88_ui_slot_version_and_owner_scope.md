# [BUG-88] UI Slot Registry chưa phân biệt chủ sở hữu và phiên bản host

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: In Review
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: Solution Architect Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), dòng 165 tại thời điểm review.

plugin_ui_slots chỉ có UNIQUE(slot_code), owner_plugin_key và một contract_version, không có catalog/version/tenant scope. Khi tenant A ghim host v1 (slot contract 1) và B dùng v2 (contract 2), registry không biểu diễn đồng thời hai định nghĩa. Plugin riêng ở hai tenant có cùng key/slot cũng xung đột. S1 được mô tả lấy registry kết hợp manifest nhưng chưa quy định nguồn ưu tiên hoặc cách resolve theo phiên bản host.

## Kết quả mong muốn / hướng sửa

Phân biệt Core slots với slot của plugin theo catalog + phiên bản; resolve bằng installed_version và owner tenant. Nếu manifest phiên bản là nguồn chính, định nghĩa rõ registry chỉ là index và không ghi đè contract của phiên bản khác.

## Tiêu chí kiểm tra sau sửa

Hai tenant ghim hai phiên bản host với contract khác nhau và hai private plugin trùng slot_code: UI Manifest trả đúng slot/constraints mỗi tenant; upgrade/uninstall một tenant không sửa slot tenant khác.

## Ghi Chú Xử Lý (2026-09-20)

- `plugin_ui_slots` bổ sung `declared_in_version`, `status`; unique Core theo `slot_code`, **plugin theo `(owner_plugin_key, slot_code, contract_version)`**; index theo owner.
- Chốt **`plugin_versions.ui_manifest` của phiên bản host đang cài là nguồn sự thật**; registry chỉ là chỉ mục tra cứu/validate, upsert không ghi đè phiên bản khác.
- Khác `constraints` ⇒ bắt buộc tăng `contract_version` (lỗi `PLUGIN_UI_SLOT_CONTRACT_MISMATCH`); resolve runtime theo `installed_version` + owner tenant; không khớp → không render.
- UI Manifest (S1) trả `host { type, plugin_key, installed_version, contract_version }` cho từng slot.
- (Lưu ý: cùng `slot_code` giữa hai plugin riêng không còn xung đột vì `plugin_key` đã duy nhất toàn cục theo BUG-85.)
- Tài liệu: [DES-03-DB mục 2.5](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [DES-03-API mục 5.1](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), [DES-03-UI mục 5.2](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md).

