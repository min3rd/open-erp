# Hợp Đồng Đóng Gói Web Plugin (Render Modes)

> Phạm vi: cách plugin cung cấp giao diện để Core nhúng qua `plugin-host` (Sprint 03).
> Liên quan: [DES-03-UI mục 5](../sprints/sprint_03_plugin_manager/06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md), [CLI guide](create_new_plugin_guide.md).

## 1. Ba Chế Độ Render

| `render_mode` | Cách Core tải | Cô lập | Khi nào dùng |
| :--- | :--- | :--- | :--- |
| `MODULE_FEDERATION` | Nạp `remoteEntry.js`, gọi container `init/get('./mount')` | JS sandbox theo container | Mặc định cho screen/contribution phức tạp |
| `WEB_COMPONENT` | Nạp script module định nghĩa custom element | **Shadow DOM** | Widget nhỏ, cô lập CSS tốt |
| `IFRAME` | Nhúng iframe qua runtime gateway + token ngắn hạn | Cách ly hoàn toàn | Dự phòng, plugin không đóng gói được MF/WC |

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
  - MF: `/plugins-runtime/<key>/remote/entry.js`
  - WC: `/plugins-runtime/<key>/entry.js`
  - iframe: `/api/v1/plugins/runtime/<key>/`
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

- Script `entry.js` là ES module định nghĩa custom element tên `plugin-<plugin_key>` (hoặc khai báo `element` trong contribution).
- Custom element tự tạo Shadow DOM; nhận attribute `plugin-key`.
- Core chỉ nạp script một lần cho mỗi URL (cache theo phiên), gỡ element khi unmount.

```js
class RevenueWidget extends HTMLElement {
  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = '<div class="widget">…</div>';
  }
}
customElements.define('plugin-sales', RevenueWidget);
```

## 5. Iframe Contract

- Core tạo `iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` trỏ tới gateway kèm `?plugin_token=<JWT 5 phút>` (type `PLUGIN_RUNTIME`, scope tenant×plugin).
- Plugin xác thực token qua claim hoặc gọi lại gateway (token không dùng được cho API Core).
- Bridge `postMessage` từ Core (`source: 'open-erp-core'`):
  - `{ type: 'theme', value: 'light' | 'dark' | 'system' }`
  - `{ type: 'lang', value: 'vi' | 'en' }`
- Plugin gửi ngược `{ source: 'open-erp-plugin', type: 'resize', height: <px> }` để Core chỉnh chiều cao.
- **Không cần nới CSP `frame-src`** vì iframe same-origin qua gateway.

## 6. Contract Version & Slot Host

- Contribution khai báo `contract_version`; slot do plugin làm host phải khớp `contract_version` với `host.installed_version` + `contract_version` **đang cài thực tế** (nguồn sự thật là `ui_manifest` của phiên bản host).
- Không khớp → Core **không render** và ghi cảnh báo; màn hình host không bị ảnh hưởng.
- Slot hợp lệ lấy từ `plugin_ui_slots` (Core slots seed sẵn, plugin slots đăng ký qua manifest khi publish).

## 7. Checklist Trước Khi Đóng Gói

1. `npx @open-erp/cli validate` — manifest/SemVer/permission/UI slot hợp lệ.
2. `npx @open-erp/cli package` — sinh `dist/release-manifest.json` + checksum SHA-256.
3. Build web assets vào đúng path (`remote/entry.js` hoặc `entry.js`) trong bundle.
4. Kiểm tra `render_mode` + `entry` trong `ui_manifest` khớp với asset thực tế.
5. Chạy `open-erp dev` để thử với docker-compose plugin runtime trước khi publish (`DRAFT` → `PUBLISHED`).
