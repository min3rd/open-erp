# [BUG-189] Phân trang attendance lệch offset — trang 1 trả rỗng dù còn dữ liệu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-189 / Bug / Sprint 09 (phát hiện khi test UI thật) |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-188 / duyệt đơn, log, bảng công / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | 5 service/resource attendance |

## 1. Hiện tượng

`GET /requests/inbox?page=1` trả `total_items: 8` nhưng `items: []`. Áp dụng cho cả log, ca, bảng công, nghỉ phép.

## 2. Nguyên nhân

Data gateway dùng page 0-based (`offset = page * size`), nhưng các service attendance truyền page 1-based. Với page=1, offset=size → bỏ toàn bộ trang đầu.

## 3. Sửa đổi

Chuẩn hóa mọi call sang 0-based:

```java
params.put("page", page > 0 ? page - 1 : 0);
```

Áp dụng tại `AttendanceAdminResource`, `ShiftAdminResource`, `RequestService`, `TimesheetService`, `LeaveLedgerService`.

## 4. Kiểm chứng

- Cần rebuild plugin và test lại `requests/inbox?page=1` trả 8 items.
