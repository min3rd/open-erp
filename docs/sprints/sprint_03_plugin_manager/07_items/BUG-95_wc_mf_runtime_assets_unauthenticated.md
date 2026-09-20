# BUG-95: Runtime asset WC/MF tải qua gateway không kèm token → 401 Unauthorized

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-95 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-340, TASK-341, `PluginRuntimeGatewayResource`, `plugin-host` loaders |

## Mô tả

`WebComponentLoader` và `ModuleFederationLoader` nạp entry bằng thẻ `<script type="module" src="...">`/`<script src>`. Trình duyệt **không gửi header `Authorization`** cho các request tài nguyên này. Gateway runtime (`/api/v1/plugins/runtime/{pluginKey}/**`) gọi `SecurityContextService.getCurrentContext()` khi không có `plugin_token` → ném `401 UNAUTHORIZED`.

Hệ quả: mọi screen/contribution `render_mode = WEB_COMPONENT` hoặc `MODULE_FEDERATION` đều **không tải được asset** (chỉ iframe hoạt động vì đã kèm `plugin_token`). Đây là chế độ mặc định theo DES-03-UI mục 5.1.

## Cách tái hiện

1. Cài plugin có screen `MODULE_FEDERATION` đang ACTIVE.
2. Mở `/apps/<pluginKey>` → DevTools Network: request `/api/v1/plugins/runtime/<key>/remote/entry.js` trả 401; Console có lỗi tải module.

## Nguyên nhân

Loader chỉ truyền URL trực tiếp, không đính kèm token ngắn hạn như `PluginIframeLoaderComponent`.

## Hướng sửa (đã thực hiện)

- Bổ sung helper `runtimeUrlWithToken(entry, pluginKey)` trong `PluginHostService`: lấy session token (`POST /plugins/session-token`, cache theo plugin) và thêm query `plugin_token`.
- `PluginWebComponentLoaderComponent` + `PluginModuleFederationLoaderComponent` gọi helper trước khi inject script.
- Gateway đã chấp nhận `plugin_token` cho mọi method (đã có từ TASK-340, test `PluginLifecycleApiTest.testRuntimeGatewayGuards`).

## Tiêu chí kiểm tra sau sửa

- [ ] WC/MF screen tải asset thành công khi ledger ACTIVE (Network không còn 401).
- [ ] Token hết hạn/khác plugin vẫn bị chặn `PLUGIN_RUNTIME_TOKEN_INVALID`.
- [ ] Không rò token sang plugin khác (token scope tenant×plugin).

## Ghi Chú Xử Lý (2026-09-20)

- Thêm `PluginHostService.runtimeUrlWithToken` (async, cache session theo `plugin_key`) và cập nhật 2 loader (WC/MF) dùng URL kèm token; iframe giữ nguyên cơ chế cũ.
- Cache script dedupe theo URL có token — token đổi theo thời gian nên cần khóa cache theo entry gốc để tránh nạp lại script nhiều lần khi token refresh: dùng entry gốc làm khóa `loadedScripts`, URL kèm token chỉ để tải.
