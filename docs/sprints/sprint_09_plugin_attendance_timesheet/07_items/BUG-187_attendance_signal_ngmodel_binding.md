# [BUG-187] Form attendance dùng `[(ngModel)]` trên signal → không nhập được lý do/ngày

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-187 / Bug / Sprint 09 (phát hiện khi test UI thật) |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Local dev + tenant `review50c` |
| depends_on / blocks / parent | BUG-186 / test luồng đơn từ / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | `attendance-screen.component.html` |

## 1. Hiện tượng

Drawer **Tạo đơn mới** nhập ngày/lý do nhưng nút **Gửi đơn** vẫn disabled; không có request POST nào được gửi. Tương tự với ô ghi chú chấm công, ô ý kiến duyệt và lý do khóa bảng công.

## 2. Nguyên nhân

Các trường là Angular signal (`requestReason = signal('')`) nhưng template dùng two-way binding `[(ngModel)]="requestReason"`. `ngModel` ghi vào thuộc tính object signal, không gọi `.set()`, nên giá trị signal luôn rỗng.

## 3. Sửa đổi

Đổi toàn bộ sang một chiều + setter:

```html
[ngModel]="requestReason()"
(ngModelChange)="requestReason.set($event)"
```

Áp dụng cho: `selectedRequestTypeCode`, `requestFromDate`, `requestToDate`, `requestReason`, `punchNote`, `approvalComment` (2 chỗ), `lockReason`.

## 4. Kiểm chứng

- `rg "\[\(ngModel\)\]" attendance-screen.component.html` chỉ còn `policy.sla_hours` (plain object property).
- Sau rebuild, cần test lại tạo đơn và duyệt đơn trên UI.
