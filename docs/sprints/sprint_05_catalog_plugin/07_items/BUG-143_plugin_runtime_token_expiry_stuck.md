# [BUG-143] Plugin runtime token hết hạn làm iframe kẹt, không tự logout

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-143 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-402](TASK-402_plugin_data_gateway_grpc.md), [BUG-139](BUG-139_plugin_host_route_state_missing.md), `PluginHostService`, `PluginIframeLoaderComponent`, `PluginScreenHostComponent`, `plugin-main.ts` |

## 1. Mô tả

Sau khi mở catalog trong iframe khoảng 5 phút, mọi thao tác trả `401 PLUGIN_RUNTIME_TOKEN_INVALID`. Iframe hiển thị lỗi nhưng người dùng vẫn ở lại trang plugin, không có token mới và cũng không được đưa về màn hình đăng nhập — phải tự reload cả trang.

## 2. Nguyên nhân

- Plugin runtime token có TTL 5 phút (`openerp.plugin.gateway.session-token-minutes`), nhưng `PluginHostService.session()` cache vô hạn theo `plugin_key` nên không bao giờ xin token mới.
- Iframe chỉ tạo URL (kèm `plugin_token`) một lần trong `ngAfterViewInit`; không có cơ chế reload khi token hết hạn.
- Plugin web không bắt `401 PLUGIN_RUNTIME_TOKEN_INVALID`; lỗi chỉ hiện trong UI của plugin.
- `PluginScreenHostComponent.onFailed()` chỉ bật cờ "unavailable", không kết thúc phiên core.

## 3. Hướng sửa

- `PluginHostService.session(pluginKey, force)`: lưu `expiresAt` từ `expires_in_seconds`, tự xin lại khi còn < 30 giây; `force` bỏ cache.
- Plugin web (`plugin-main.ts`): interceptor bắt `401` + `code = PLUGIN_RUNTIME_TOKEN_INVALID`, post `{source:'open-erp-plugin', type:'session-expired'}` một lần cho host.
- `PluginIframeLoaderComponent`: nhận `session-expired`, xin token mới (`force`), dựng lại `src` với token mới + cache-buster, giữ route hiện tại của plugin; nếu refresh thất bại (hoặc token mới vẫn bị từ chối trong 5 giây) phát `failed('PLUGIN_RUNTIME_TOKEN_INVALID')`.
- `PluginScreenHostComponent.onFailed(code)`: với `PLUGIN_RUNTIME_TOKEN_INVALID` gọi `AuthService.clearSession()` → về `/login`.

## 4. Kiểm chứng

- Đặt cookie `plugin_token=expired-token`, chọn loại `COMMUNE`: request đầu trả 401, host xin token mới, iframe reload đúng `#/COMMUNE/-/20/1/-/list`, 20 dòng dữ liệu, cookie là JWT mới, vẫn đăng nhập.
- Xoá token core + cookie hết hạn rồi thao tác: phiên kết thúc, chuyển `/login` (không kẹt iframe).
- Build web + catalog-plugin PASS; plugin test PASS.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug; thêm expiry cache, interceptor `session-expired`, reload iframe, logout fallback; browser verify PASS | Chủ dự án báo lỗi |
