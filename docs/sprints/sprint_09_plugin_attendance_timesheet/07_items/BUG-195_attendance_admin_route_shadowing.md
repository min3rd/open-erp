# [BUG-195] Endpoint `/admin/*` khai báo trong resource `@Path("/")` trả 404

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-195 / Bug / Sprint 09 |
| Severity / trạng thái | **Critical / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-194 / quản lý nghỉ phép, loại đơn, audit / [TASK-466](TASK-466_attendance_api.md) |
| Write scope | `resource/LeaveAdminResource`, `RequestTypeAdminResource`, `AttendanceAuditResource`, `MyLeaveResource` |

## 1. Hiện tượng

Toàn bộ endpoint admin của phép, loại đơn và audit trả `500 INTERNAL_ERROR` với log plugin:

```
jakarta.ws.rs.NotFoundException: Unable to find matching target resource method
```

Các endpoint cùng class nhưng không có tiền tố `/admin` (ví dụ `GET /my-leave-balances`) vẫn 200.

## 2. Nguyên nhân

RESTEasy Reactive định tuyến theo **class-level path**. Khi đã có resource `@Path("/admin")` (`AttendanceAdminResource`, `ShiftAdminResource`, `TimesheetAdminResource`), request `/admin/...` vào nhánh `/admin` và **không fallback** sang class `@Path("/")` dù class đó khai báo method `/admin/...`. Vì vậy các method `/admin/leave-types`, `/admin/request-types`, `/admin/audit` trong class gốc không bao giờ khớp.

## 3. Sửa đổi

- `LeaveAdminResource`: class `@Path("/admin")`, bỏ tiền tố `/admin` trong `@Path` của method (URL công khai không đổi).
- `RequestTypeAdminResource`: class `@Path("/admin")`, method `/request-types`; UI gọi `GET /admin/request-types`.
- `AttendanceAuditResource`: class `@Path("/admin")`, method `/audit`.
- Tách `GET /my-leave-balances` sang `MyLeaveResource` (`@Path("/")`) để giữ URL self-service.

## 4. Kiểm chứng

- `GET/POST /admin/leave-types`, `GET/POST /admin/request-types`, `GET /admin/audit` trả 200.
- `GET /my-leave-balances` vẫn 200.
- Không còn `NotFoundException` trong log plugin.
