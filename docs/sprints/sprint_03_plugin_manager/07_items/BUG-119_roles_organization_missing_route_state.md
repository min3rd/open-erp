# [BUG-119] `/settings/roles` và `/settings/organization` không lưu vết thao tác vào route

| Trường | Giá trị |
| :--- | :--- |
| **Mã** | BUG-119 (tiếp nối BUG-108 / TASK-348) |
| **Mức độ** | Medium |
| **Phát hiện bởi** | Chủ dự án (báo cáo trực tiếp) |
| **Ngày** | 2026-10-05 |
| **Trạng thái** | Implemented (chờ QA/Reviewer xác nhận) |
| **Liên quan** | BUG-108, TASK-348, `PathListStateService` |

## Triệu chứng

12/12 màn bảng đã lưu state vào URL, nhưng 2 màn cấu hình không lưu:
lựa chọn vai trò / tab, và chế độ xem + phòng ban đang chọn ở Cơ cấu tổ chức
không phản ánh lên route → không deep-link được, F5 mất ngữ cảnh.

## Phạm vi

| Màn | State cục bộ hiện tại | Cần lưu vào route |
| :--- | :--- | :--- |
| `/settings/roles` (RoleMatrixComponent) | `selectedRole` (signal), tab permissions/data-scopes | `id` = roleId, `mode` = tab |
| `/settings/organization` (OrganizationComponent) | `viewMode` (list/graph, localStorage), `selectedId` (phòng ban) | `mode` = view, `id` = departmentId |

## Hướng sửa

Bọc 2 route bằng helper `listState(...)` (đã có) và dùng `PathListStateService`
như các màn bảng khác: `bind(path, apply)` + `set(patch)` khi người dùng chọn.

## Kiểm chứng (dự kiến)

- Chọn vai trò/tab → URL đổi; F5 giữ nguyên lựa chọn; deep-link mở đúng.
- Đổi chế độ xem / chọn phòng ban → URL đổi; F5 giữ nguyên.
- Không phát sinh console error; overflow = 0 (dual-mode).
