# BUG-106: T1 Marketplace ẩn hoàn toàn plugin bị khóa thay vì hiển thị badge "Đã khóa"

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-106 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent — đối chiếu dữ liệu browser với DES-03-UI mục 4.1 |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | BUG-93, BUG-101, TASK-316, DES-03-UI 4.1 |

## Mô tả

`PluginLifecycleService.listMarketplace` bỏ qua (`continue`) mọi catalog `catalog_status = BLOCKED`. Trong khi DES-03-UI mục 4.1 yêu cầu: plugin bị khóa **vẫn hiển thị** với badge "Đã khóa" + khóa toàn bộ hành động để tenant biết lý do plugin biến mất/không dùng được.

Hệ quả: khi nền tảng khóa khẩn cấp (không cưỡng chế gỡ), tenant không thấy gì → mất minh bạch; banner cảnh báo (dựa trên `catalog_status = BLOCKED`) không bao giờ kích hoạt.

## Hướng sửa (đã thực hiện)

- Bỏ điều kiện skip `catalogStatus == BLOCKED` trong vòng lặp ledger (chỉ skip khi catalog không tồn tại); item trả về kèm `catalog_status = BLOCKED`.
- Frontend đã có sẵn badge + disable hành động (BUG-101) và banner đỏ khi có item BLOCKED.
- Test `testEmergencyBlockForcesUninstallAndNotifies`: bổ sung assert T1 vẫn chứa plugin bị khóa với `catalog_status = BLOCKED`.

## Tiêu chí kiểm tra sau sửa

- [ ] Tenant đang cài plugin bị khóa (không force) → thấy badge "Đã khóa", mọi hành động bị disable, banner đỏ hiển thị.
- [ ] Plugin BLOCKED không xuất hiện trong danh sách chọn phiên bản nâng cấp.
