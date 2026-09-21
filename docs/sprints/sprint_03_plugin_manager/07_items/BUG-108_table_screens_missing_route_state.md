# BUG-108: Màn hình dạng bảng chưa dùng Route để lưu vết thao tác (filter/sort/page/selection/drawer)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-108 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent + Khách hàng — kiểm thử trình duyệt |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-315/316/317, DES-03-UI, chuẩn Anti-Modal + route-driven ERP |

## Mô tả

Các màn quản lý dạng bảng của Plugin Manager giữ toàn bộ trạng thái trong component signal: từ khóa, filter, trang, dòng đang chọn, drawer đang mở. Hệ quả:

1. **Refresh (F5) mất ngữ cảnh**: đang xem Drawer chi tiết plugin `sales` → reload về danh sách trống; mất filter/trang.
2. **Không deep-link được**: không thể gửi link "plugin sales, tab phiên bản" cho đồng nghiệp.
3. **Nút Back của trình duyệt không đóng drawer**/không quay lại trang trước của danh sách.
4. Không tuân chuẩn ERP yêu cầu route lưu vết: `/:filter/:sort/:pageSize/:page/:id/:detail|:edit|...`.

Phạm vi: `/platform/plugins`, `/settings/plugins`, `/platform/plugin-credentials`, `/settings/plugin-credentials`, `/platform/tenant-private-plugins`.

## Hướng sửa (đã thực hiện)

Chuẩn hóa state lên **query params của route** (Angular Router), hai chiều:

| Màn | Query params |
| :--- | :--- |
| `/platform/plugins` | `page`, `size`, `keyword`, `status`, `plugin`, `drawer=detail\|versions\|edit\|block\|bulk\|support`, `tenant` (hỗ trợ), `scope`, `version` |
| `/settings/plugins` | `keyword`, `plugin`, `drawer=detail\|upgrade\|uninstall\|manage\|notifications` |
| `/platform/plugin-credentials`, `/settings/plugin-credentials` | `id`, `drawer=create\|edit\|delete\|test` |
| `/platform/tenant-private-plugins` | `plugin`, `drawer=block` |

- Mở/đóng Drawer và chọn dòng ⇒ `router.navigate` cập nhật query (merge, `replaceUrl` khi chỉ đổi selection để không phình history).
- `queryParamMap` subscription khôi phục state ⇒ F5/deep-link/Back đều đúng ngữ cảnh.
- Dữ liệu bảng (page/keyword/status) cũng đọc từ query ⇒ link chia sẻ tái hiện đúng màn hình.

## Tiêu chí kiểm tra sau sửa

- [x] Mở Drawer chi tiết plugin → URL có `?plugin=<key>&drawer=detail`; F5 giữ nguyên Drawer (browser `web_18/web_19`).
- [x] Đổi trang/filter → URL đổi; Back quay lại trang trước của danh sách (query-param merge).
- [x] Deep-link `?plugin=sales&drawer=versions` (platform) mở đúng tầng phiên bản (`web_22`).
- [x] Copy URL sang tab mới → tái hiện đúng trạng thái (`qa_route_result.json` 8/8 PASS).
- [x] **Mở rộng Sprint 01/02 (khách hàng yêu cầu)**: 7 màn bảng đã chuyển đổi qua helper `RouteListStateService` — xem [TASK-348](TASK-348_route_state_rollout_sprint01_02.md); verified browser `web_31→34` + `qa_verify_result.json` 12/12 PASS.
