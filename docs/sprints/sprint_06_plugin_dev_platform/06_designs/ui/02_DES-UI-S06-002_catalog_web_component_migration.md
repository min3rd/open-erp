# [DES-UI-S06-002] Thiết kế migrate catalog iframe → Web Component

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S06-002 / Thiết kế UI / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — 2026-10-29** / 1.0 / 2026-10-29 |
| Owner / reviewer | Solution Architect / Developer + QA |
| Đầu vào | [ADR-S06-002](../../05_solutions/03_ADR-S06-002_iframe_removal_catalog_migration.md), [DES-UI-S06-001](01_DES-UI-S06-001_slots_layout_and_settings.md) |
| Đọc trước / đọc tiếp | [DES-UI-S06-001](01_DES-UI-S06-001_slots_layout_and_settings.md) / [DES-ARCH-S06-001](../arch/01_DES-ARCH-S06-001_plugin_platform_architecture.md) |

## 1. Mục đích

Đặc tả chi tiết UI/host/build cho việc chuyển catalog từ iframe sang Web Component, giữ nguyên màn hình, route-state, mobile read-only và platform system.

## 2. Hiện trạng

- `plugins/catalog/plugin.json`: 3 screen `IFRAME` (desktop, mobile, platform).
- `PluginScreenHostComponent`:
  - iframe: `iframeEntry()`, `initialRoute`, `onIframeRoute`, `frameOffsetPx`, ẩn header host.
  - route sync qua `postMessage` (`route`, `navigate`, `resize`).
- `plugins/catalog/web/src/plugin-main.ts`: `bootstrapApplication`, hash router, query `scope`/`readonly`.
- `catalog-plugin-shell.component`: `postMessage` route/height, nhận `navigate`.
- Build: project `catalog-plugin` trong `src/frontend/web/angular.json`, output `META-INF/resources`.

## 3. Thiết kế Web Component

### 3.1. Entry

`plugins/catalog/web/src/plugin-main.ts`:

```ts
const app = createApplication({
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter([...], withHashLocation()),
    provideHttpClient(withInterceptors([authHeaderInterceptor])),
    { provide: API_BASE_URL, useValue: '' },
    { provide: CATALOG_READ_ONLY, useValue: false },
    { provide: PLUGIN_PERMISSION_CHECKER, useValue: pluginPermissionChecker },
  ],
});

const element = createCustomElement(CatalogPluginShellComponent, { injector: app.injector });
customElements.define('op-catalog-app', element);
```

- Không `bootstrapApplication`; Core mount element.
- `scope`/`readonly` chuyển từ query string sang property (`scope`, `readonly`); plugin shell cung cấp qua service/token.
- Bỏ `sessionExpiredInterceptor`/`postMessage` (WC dùng JWT Core; 401 xử lý qua interceptor chung).
- `authHeaderInterceptor` dùng chung; API base `''` (same origin gateway path).
- Entry/static asset vẫn tải qua gateway với `plugin_token` ngắn hạn (script tag không gửi JWT header); API calls dùng JWT Core.

### 3.2. Shell inputs/outputs

`CatalogPluginShellComponent`:

| Input | Kiểu | Hành vi |
| :--- | :--- | :--- |
| `route` | string | Setter: `router.navigateByUrl(route)` nếu khác |
| `scope` | `tenant`/`system` | Cung cấp `CATALOG_SCOPE`/data `catalogScope` |
| `readonly` | boolean | Thêm class `catalog-readonly`; ẩn action ghi |
| `theme` | string | Set `data-theme`/class dark |
| `language` | string | Gọi `I18nService`/set document lang |

| Output/Event | Payload | Khi nào |
| :--- | :--- | :--- |
| `op:route-change` | `{ path }` | `NavigationEnd` |
| `op:resize` | `{ height }` | Sau render/resize (nếu cần) |
| `op:notify` | `{ level, code, params }` | Lỗi/thành công |
| `op:navigate` | `{ path }` | Catalog muốn Core điều hướng (ví dụ marketplace) |

- Dispatch qua host element (`ElementRef.nativeElement.dispatchEvent(new CustomEvent(..., {bubbles:true, composed:true}))`).
- Không dùng `window.parent.postMessage`.

### 3.3. Core screen host

`PluginScreenHostComponent`:

- Bỏ `iframeLoader`, `initialRoute`, `iframeEntry`, `onIframeRoute`, `frameOffsetPx`.
- `render_mode` chỉ còn WC/MF.
- WC branch:
  - `[entry]="screen.entry || defaultEntry()"`, `[tagName]="screen.tag_name || 'plugin-'+key`, `[context]="screenContext()"`.
  - Entry URL đi qua `runtimeUrlWithToken` (plugin_token ngắn hạn) như loader hiện tại; API calls dùng JWT Core.
  - Gateway set cookie `plugin_token` path-scoped khi serve entry để chunk/static request không 401; cookie HttpOnly/SameSite, TTL ngắn.
  - Listen `routeChange` → cập nhật URL core `/settings/apps/<key><path>` (replaceUrl).
  - Khi URL core đổi → set `route` property trên element (qua loader input hoặc method `navigate`).
  - `readOnly`/`scope` từ screen (platform route).
- Header host: giữ ẩn header nếu plugin screen tự có header; hoặc hiện header mỏng. Catalog có layout riêng; giữ ẩn header để tránh lặp (BUG-151).
- Height: `h-[calc(100vh-4.5rem)]` như hiện tại; WC `display:block; height:100%`.

### 3.4. Route-state

- URL core: `/settings/apps/catalog/<filter>/<sort>/<pageSize>/<page>/<id>/<mode>`.
- WC router dùng hash (`withHashLocation`) nên path nội bộ không đổi.
- Core truyền `route` ban đầu = phần sau `/settings/apps/catalog`; plugin navigate.
- Plugin phát `op:route-change`; core `router.navigateByUrl(..., {replaceUrl:true})`.
- Reload/bookmark: core parse URL, mount WC, set `route`; plugin navigate đúng.
- Không còn `initialRoute`/`navigate` postMessage.

### 3.5. Build

| Mục | Hiện tại | Sau migrate |
| :--- | :--- | :--- |
| Angular project | `catalog-plugin` application, `plugin-main.ts` bootstrap | `catalog-plugin` application, `plugin-main.ts` custom element |
| Output | `META-INF/resources/index.html` + hashed assets | `META-INF/resources/main.js` (+ chunks/assets) |
| Hashing | `outputHashing: all` | `outputHashing: none` (entry ổn định) |
| Package | `@angular/platform-browser` | thêm `@angular/elements` |
| Entry manifest | `IFRAME` + index.html | `WEB_COMPONENT` + `/plugins-runtime/catalog/main.js` |

- Nếu `outputHashing: none` làm cache khó: gateway thêm `?v=<pluginVersion>`/`no-store` cho HTML; JS có thể cache theo version container.
- `styles.css`: giữ plugin-owned Tailwind entry; thêm scope `op-catalog-app` nếu cần.
- Dockerfile: vẫn build UI trong image; copy `main.js` + assets.

## 4. CSS isolation

- Catalog WC dùng **light DOM** (không Shadow DOM) vì:
  - Tailwind global utilities + design tokens cần áp dụng.
  - Angular child components inject style vào document; Shadow DOM sẽ phức tạp.
- Giảm rủi ro:
  - Plugin-owned Tailwind entry (`plugins/catalog/web/src/styles.css`) không scan Core.
  - Scope selector `op-catalog-app` cho style đặc thù; tránh selector toàn cục (`body`, `*`).
  - Core reset trong container `app-plugin-slot`/screen host.
  - QA visual desktop/mobile/theme.
- Nếu cần cô lập mạnh hơn: chuyển dần widget nhỏ sang Shadow DOM; full-screen catalog giữ light DOM.

## 5. Mobile

- Screen mobile: `render_mode: WEB_COMPONENT`, `read_only: true`, `platforms: ["mobile"]`.
- Core truyền `readonly=true`, `scope=tenant`; plugin ẩn nút ghi/menu.
- Touch target ≥40px; bảng cuộn ngang trong container (không tràn body); overflow 0.
- Route-state giữ nguyên; test 390×844.

## 6. Platform system

- Screen `/platform/apps/catalog` `render_mode: WEB_COMPONENT`, `permission: catalog:system:manage`.
- Core platform host truyền `scope=system`, platform token; plugin gọi gateway platform route.
- Không hiển thị cho tenant; test riêng.

## 7. Trình tự triển khai

| Bước | Việc | Kiểm chứng |
| :--- | :--- | :--- |
| 1 | Thêm `@angular/elements`; đổi `plugin-main.ts`; build `main.js` | `customElements.get('op-catalog-app')` |
| 2 | Shell inputs/outputs; bỏ postMessage | Mount thử trong Core dev |
| 3 | Core WC loader nhận `tagName/context`; screen host bỏ iframe branch | Route/theme/i18n đúng |
| 4 | Đổi manifest catalog sang WC; giữ iframe loader feature flag | Catalog 3 screen PASS |
| 5 | QA regression desktop/mobile/platform | 0 console error, overflow 0 |
| 6 | Xoá iframe loader/enum/import; cập nhật template/CLI | `grep IFRAME` = 0 |
| 7 | Docs/release notes | Guide không còn iframe |

## 8. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| CSS collision Core ↔ catalog | High | Light DOM scoped, plugin Tailwind entry, QA visual |
| Route-state hỏng | High | Test reload/bookmark; event `op:route-change`; replaceUrl |
| Auth 401 khác iframe | Medium | Dùng `authHeaderInterceptor`; test token hết hạn |
| Bundle size/tải chậm | Medium | Đo bundle; lazy route; cache version |
| Platform scope lỗi | High | Property `scope=system`; test platform token |
| Rollback | High | Feature flag + image cũ; xoá iframe sau QA PASS |

## 9. QA checklist

- [ ] `/settings/apps/catalog` WC render; menu từ manifest.
- [ ] `/settings/apps/catalog/DISTRICT/-/20/1/-/list` reload/bookmark đúng.
- [ ] Tắt/bật plugin: screen/menu biến mất/xuất hiện.
- [ ] Mobile 390×844: read-only, overflow 0, touch ≥40px, 0 console error.
- [ ] Platform `/platform/apps/catalog`: system scope, permission.
- [ ] Theme sáng/tối, vi/en.
- [ ] `grep -r "IFRAME"` trong code = 0; iframe loader đã xoá.
- [ ] Catalog API qua gateway 200; không đổi contract.

## 10. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Thiết kế WC entry, shell inputs/outputs, host route-state, build, CSS, mobile, QA | Architect; ADR-S06-002 |
| 1.0 | 2026-10-29 | Chủ dự án duyệt design ready (Q17 + design review); Thiết kế WC entry, shell inputs/outputs, host route-state, build, CSS, mobile, QA | Architect; ADR-S06-002 |
