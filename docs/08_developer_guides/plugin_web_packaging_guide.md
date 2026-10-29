# Hợp Đồng Đóng Gói Web Plugin (Render Modes)

> Phạm vi: cách plugin cung cấp giao diện để Core nhúng qua `plugin-host` (Sprint 03, cập nhật Sprint 06: WC/MF, slot/contribution, bỏ iframe).
> Liên quan: [DES-03-UI mục 5](../sprints/sprint_03_plugin_manager/06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md), [CLI guide](create_new_plugin_guide.md).

## 1. Hai Chế Độ Render

| `render_mode` | Cách Core tải | Cô lập | Khi nào dùng |
| :--- | :--- | :--- | :--- |
| `MODULE_FEDERATION` | Nạp `remoteEntry.js`, gọi container `init/get('./mount')` | JS sandbox theo container | Screen/contribution phức tạp |
| `WEB_COMPONENT` | Nạp script module định nghĩa custom element | Light hoặc Shadow DOM do plugin chọn | Widget, screen đầy đủ dùng Angular Elements |

> Iframe đã bị xoá khỏi Core từ Sprint 06; manifest khai báo `IFRAME` bị từ chối khi publish và bị bỏ qua nếu còn trong phiên bản cũ.

## 2. Quy Ước Đường Dẫn Entry

Entry khai báo trong `ui_manifest` của phiên bản plugin (xem `PLUGIN_MANAGER_API_SPEC.md` mục 5.1):

```json
{
  "screens": [
    { "route": "/apps/sales", "title_key": "PLUGIN_SALES_MENU", "render_mode": "MODULE_FEDERATION", "permission": "sales:order:read" }
  ],
  "contributions": [
    { "slot": "core.dashboard.widgets", "title_key": "PLUGIN_SALES_WIDGET", "render_mode": "WEB_COMPONENT",
      "entry": "/plugins-runtime/sales/remote/revenue-widget.js", "contract_version": "1.0", "order": 10 }
  ]
}
```

- Core chuyển `/plugins-runtime/<plugin_key>/<path>` → gateway `/api/v1/plugins/runtime/<plugin_key>/<path>` (same-origin, kèm ngữ cảnh `X-Tenant-Id`, `X-User-Id`).
- Screen không khai báo `entry` dùng quy ước:
  - MF: `/plugins-runtime/<key>/remoteEntry.js`
  - WC: `/plugins-runtime/<key>/main.js`
- Container plugin phục vụ asset tại các path trên (static resources) và phải expose `GET /q/health/ready`.

## 3. Module Federation Contract

`remoteEntry.js` expose một remote container tên `<plugin_key>` (chuẩn hóa `[^a-zA-Z0-9_]` → `_`) với module `./mount`:

```js
// pseudo-code phía plugin (esbuild/webpack/rspack)
export function mount(targetElement) { /* render app vào target */ }
export function unmount() { /* dọn dẹp nếu cần */ }
```

- Core gọi `container.init({})` → `container.get('./mount')` → `factory().mount(element)`; `unmount()` khi route rời.
- **Shared scope pin**: plugin chịu trách nhiệm khai báo shared library; Core không cấp runtime Angular. Khuyến nghị bundle độc lập (không share Angular) cho Sprint 03.

## 4. Web Component Contract

- Script `main.js` là ES module định nghĩa custom element khai báo trong `tag_name`.
- Core gán property trước khi mount: `pluginKey`, `context`, `route`; context gồm theme/language/tenant/user/permissions/apiBaseUrl.
- Plugin phát event trên chính element: `op:route-change`, `op:navigate`, `op:notify`, `op:resize`.
- Core nạp script một lần cho mỗi URL (cache theo phiên), gỡ element khi unmount.
- Catalog dùng light DOM để dùng chung Tailwind token; widget nhỏ có thể dùng Shadow DOM.

```js
class RevenueWidget extends HTMLElement {
  set context(value) { /* theme, language, permissions */ }
  connectedCallback() { this.innerHTML = '<div class="widget">…</div>'; }
}
customElements.define('op-sales-revenue', RevenueWidget);
```

## 5. Contract Version & Slot Host

- Contribution khai báo `contract_version`; slot do plugin làm host phải khớp `contract_version` với `host.installed_version` + `contract_version` **đang cài thực tế** (nguồn sự thật là `ui_manifest` của phiên bản host).
- Không khớp → Core **không render** và ghi cảnh báo; màn hình host không bị ảnh hưởng.
- Slot hợp lệ lấy từ `plugin_ui_slots` (Core slots seed sẵn, plugin slots đăng ký qua manifest khi publish).

## 6. Checklist Trước Khi Đóng Gói

1. `npx @open-erp/cli validate --core-url <url> --token <jwt>` — manifest/SemVer/permission/UI slot + entity registry.
2. `npx @open-erp/cli package` — sinh `dist/release-manifest.json` + checksum SHA-256.
3. Build web assets vào đúng path (`main.js` hoặc `remoteEntry.js`) trong bundle.
4. Kiểm tra `render_mode` + `entry` + `tag_name` trong `ui_manifest` khớp asset thực tế.
5. Chạy `open-erp dev` để thử với docker-compose plugin runtime trước khi publish (`DRAFT` → `PUBLISHED`).
