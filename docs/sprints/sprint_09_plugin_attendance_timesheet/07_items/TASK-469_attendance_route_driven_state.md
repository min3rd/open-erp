# [TASK-469] Đồng bộ trạng thái màn Chấm công lên URL (route-driven state)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-469 / Task / Sprint 09 |
| Trạng thái | **Done source — QA xác nhận deep-link trên UI** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / AGENTS rule #31 |
| depends_on / blocks / parent | TASK-460 / deep-linking nghiệm thu / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `attendance-screen.component.ts`, plugin runtime host |

## 1. Yêu cầu

Tab, phân trang, drawer đang mở, bản ghi master-detail và bước stepper phải phản ánh vào URL để F5/Back/Forward không mất trạng thái (AGENTS rule #31).

## 2. Cơ chế

Plugin runtime host đã có sẵn hợp đồng hai chiều:

- Host → plugin: thuộc tính `route` trên custom element (sub-route + query).
- Plugin → host: sự kiện `op:route-change` với `{ path }`; host gọi `router.navigateByUrl(..., { replaceUrl: true })`.

## 3. Triển khai

- `@Input() set route(value)` (alias của `initialRoute`) đọc `tab`, `mtab`, `drawer`, `id`, `page`, `size`.
- `buildRoute()` sinh sub-route theo tab (`/`, `/requests`, `/admin/timesheets`, …) + query; một `effect` phát `op:route-change` khi trạng thái đổi.
- `applyDrawer` mở/đóng 11 drawer theo `drawer` param.
- `pagingSignals(tab)` ánh xạ page/size của bảng chính theo tab.
- `pendingRouteId` khôi phục bản ghi đang chọn sau khi danh sách tải xong (đơn duyệt, kỳ công).
- Tab kiosk giữ `isStandaloneKioskMode` khi deep-link.

## 4. Kiểm chứng

- Mở drawer Phân ca hàng loạt → URL có `?tab=admin-shifts&drawer=bulk-assign`; F5 mở lại đúng drawer.
- Chọn đơn trong Duyệt đơn → URL có `id`; F5 chọn lại đúng đơn.
- Đổi trang bảng công → `page`/`size` vào URL; Back trở lại trang trước.
