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

> **Cập nhật 2026-09-21 theo gợi ý khách hàng**: thay query-param bằng **chuẩn path-segment** `/:filter/:sort/:pageSize/:page/:id/:mode` (canonical `all/-/20/1/-/list`), khai báo qua helper `listState()` trong `app.routes.ts`; helper dùng chung `PathListStateService` (`core/utils/path-list-state.ts`). Từ khóa giữ ở `q`; tham số phụ (`scope/version/tenant`) ở query. Chuẩn được ghi tại [coding_standards.md mục 2.4](../../../../08_developer_guides/coding_standards.md).

Phạm vi áp dụng: 5 màn Plugin Manager + 7 màn bảng Sprint 01/02 (xem [TASK-348](TASK-348_route_state_rollout_sprint01_02.md)).

| Màn | Path segments | Mode (Drawer) |
| :--- | :--- | :--- |
| `/platform/plugins` | `filter=status`, `sort`, `pageSize`, `page`, `id=plugin_key` | `list\|detail\|versions\|edit\|register\|block\|bulk\|support` |
| `/settings/plugins` | `filter`, `sort`, `pageSize`, `page`, `id=plugin_key` | `list\|detail\|upgrade\|uninstall\|manage\|register\|notifications` |
| `/platform/plugin-credentials`, `/settings/plugin-credentials` | `pageSize`, `page`, `id` | `list\|create\|edit\|delete` |
| `/platform/tenant-private-plugins` | `id=plugin_key` | `list\|block` (chỉ SUPER_ADMIN) |

- URL canonical đầy đủ `all/-/20/1/-/list`; URL ngắn tự redirect tiến dần về canonical.
- `PathListStateService` khôi phục state ⇒ F5/deep-link/Back đúng ngữ cảnh; `q` giữ từ khóa, query phụ giữ `scope/version/tenant`.

## Tiêu chí kiểm tra sau sửa

- [x] Mở Drawer chi tiết plugin → URL có `?plugin=<key>&drawer=detail`; F5 giữ nguyên Drawer (browser `web_18/web_19`).
- [x] Đổi trang/filter → URL đổi; Back quay lại trang trước của danh sách (query-param merge).
- [x] Deep-link `?plugin=sales&drawer=versions` (platform) mở đúng tầng phiên bản (`web_22`).
- [x] Copy URL sang tab mới → tái hiện đúng trạng thái (`qa_route_result.json` 8/8 PASS).
- [x] **Mở rộng Sprint 01/02 (khách hàng yêu cầu)**: 7 màn bảng đã chuyển đổi qua helper `RouteListStateService` — xem [TASK-348](TASK-348_route_state_rollout_sprint01_02.md); verified browser `web_31→34` + `qa_verify_result.json` 12/12 PASS.
- [x] **Chuẩn path-segment (khách hàng chốt 2026-09-21)**: 12 màn chuyển sang `/:filter/:sort/:pageSize/:page/:id/:mode`; verified browser **9/9 PASS, 0 console error** (`web_40→46`, `qa_path_result.json`): canonical redirect, filter BLOCKED, page 2, tenants ACTIVE, support bị normalize khỏi mode `block`, deep-link detail/manage/create.
