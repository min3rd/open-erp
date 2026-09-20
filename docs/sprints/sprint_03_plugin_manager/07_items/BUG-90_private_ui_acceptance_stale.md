# [BUG-90] AC-23.5 vẫn bắt private plugin dùng iframe trái quyết định Gate

- **Loại**: Documentation / Design defect
- **Severity**: Medium
- **Trạng thái**: Done
- **Ngày phát hiện**: 2026-09-20
- **Người xử lý**: BA Agent
- **Phạm vi**: Review tài liệu Sprint 03; chưa xác nhận lỗi runtime.

## Xác nhận review lần 2 (2026-09-20)

AC-23.5 đã cho phép cả Official/private WC/MF, iframe dự phòng; UI và truy vết đã đồng bộ quyết định Gate.

**Done chỉ áp dụng lỗi tài liệu**, qua đối chiếu tĩnh tại HEAD `20b1dd4`; không xác nhận implementation, migration hay runtime đã kiểm thử. Xem [REV-02](../09_review/REV-02_document_rereview_2026-09-20.md).

## Bằng chứng & cách tái hiện khi đọc thiết kế

Nguồn: [04_confirmation/CONF-01_sprint_03_scope.md](../04_confirmation/CONF-01_sprint_03_scope.md), dòng 139 tại thời điểm review.

Then của AC-23.5 bắt plugin riêng chưa kiểm duyệt render iframe; câu 9 và phụ lục 8 đã cho phép private plugin nhúng WC/MF, đồng thời UI/SOL dùng quyết định mới. QA theo AC hiện tại có thể đánh fail triển khai đúng quyết định khách hàng.

## Kết quả mong muốn / hướng sửa

Cập nhật AC-23.5 theo quyết định đã ký: kiểm chứng private plugin dùng WC/MF và iframe như chế độ dự phòng; đồng bộ truy vết UI/test plan. Không cần xin lại quyết định đã có.

## Tiêu chí kiểm tra sau sửa

AC có case private WC/MF thành công theo quyền và case iframe dự phòng; không còn quy tắc bắt buộc iframe chỉ vì private/chưa kiểm duyệt.

## Ghi Chú Xử Lý (2026-09-20)

- Viết lại **AC-23.5**: plugin riêng **được phép** `render_mode = WEB_COMPONENT/MODULE_FEDERATION` như plugin Official; `IFRAME` chỉ là chế độ dự phòng khi plugin không hỗ trợ WC/MF.
- Đồng bộ UI ([DES-03-UI mục 4.3](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md)) và truy vết AC tại DES-03-UI mục 11; không cần xin lại quyết định (đã có tại CONF-01 câu 9 + Phụ lục 8).
- Tài liệu: [CONF-01 AC-23.5 + Phụ lục 9 #7](../04_confirmation/CONF-01_sprint_03_scope.md).
