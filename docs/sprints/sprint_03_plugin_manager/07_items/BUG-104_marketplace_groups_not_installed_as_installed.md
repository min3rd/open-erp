# BUG-104: Marketplace xếp plugin `NOT_INSTALLED` vào nhóm "Đã cài" và hiện nút "Gỡ"

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-104 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent — chạy kiểm thử trình duyệt thật (1280px) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-318, TASK-316, DES-03-UI mục 4.1 |

## Mô tả

`plugin-management-list` tính `isInstalled(item)` là `!!status && status !== UNINSTALLED`. Trạng thái `NOT_INSTALLED` (đã cấp entitlement, chưa cài) là truthy → bị xếp vào nhóm **"Đã cài"** và hiện nút **"Gỡ"** thay vì nhóm "Có thể cài" + nút "Cài đặt".

Bằng chứng: ảnh `evidence/screenshots/web_02_tenant_marketplace.png` — `sales` và `inventory` (CHƯA CÀI) nằm dưới tiêu đề "ĐÃ CÀI (2)" kèm nút "Gỡ".

## Hướng sửa (đã thực hiện)

- `isInstalled()` trả true chỉ với: `ACTIVE`, `INACTIVE`, `INSTALLING`, `UPGRADING`, `INSTALL_FAILED`, `ROLLBACK_FAILED`.
- `NOT_INSTALLED`/`UNINSTALLED` → nhóm "Có thể cài" + nút "Cài đặt".

## Tiêu chí kiểm tra sau sửa

- [ ] Plugin chưa cài nằm nhóm "Có thể cài", nút "Cài đặt".
- [ ] Plugin `UNINSTALLED` sau khi gỡ cũng về nhóm "Có thể cài".
