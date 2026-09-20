# BUG-101: Marketplace tenant không khóa hành động khi `catalog_status = BLOCKED` (acceptance BUG-93)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-101 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | BUG-93, TASK-316, DES-03-UI mục 4.1 |

## Mô tả

DES-03-UI mục 4.1 (nhóm "Có thể cài") yêu cầu: plugin/catalog bị khóa hiển thị badge **"Đã khóa"** + **khóa toàn bộ hành động cài/nâng cấp/bật**. Thực tế:

- `plugin-management-list` (tenant marketplace) **không truyền `catalogBlocked`** vào `plugin-card` → thiếu badge "Đã khóa".
- Các nút Cài đặt / Nâng cấp / Bật **vẫn bấm được**; người dùng chỉ nhận lỗi 403 từ API sau khi bấm (UX kém, vi phạm acceptance BUG-93).

Backend đã chặn đúng (403 `PLUGIN_BLOCKED_BY_PLATFORM`) — đây là lỗi UI/acceptance.

## Hướng sửa (đã thực hiện)

- `plugin-management-list.component.ts`: thêm `isBlocked(item)` (`catalog_status === 'BLOCKED'`).
- Template: `[catalogBlocked]` cho `plugin-card` ở cả 3 nhóm; các nút `install/upgrade/enable/disable/uninstall` thêm `[disabled]="isBusy(item) || isBlocked(item)"`.
- Giữ nút "Chi tiết" hoạt động để người dùng xem lý do khóa.

## Tiêu chí kiểm tra sau sửa

- [ ] Plugin BLOCKED: badge "Đã khóa" hiển thị; mọi nút hành động bị disable; chỉ còn xem chi tiết.
- [ ] Plugin không khóa: hành động hoạt động bình thường (regression).
- [ ] QA thủ công case T9 trong [QA-01 test plan](../08_testing/QA-01_sprint_03_test_plan.md) xác nhận.
