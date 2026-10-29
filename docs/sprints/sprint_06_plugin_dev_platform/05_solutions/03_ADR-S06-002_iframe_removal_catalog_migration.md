# [ADR-S06-002] Bỏ iframe & migrate catalog sang Web Component

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S06-002 / Architecture Decision Record / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Accepted (dev)** / 0.1 / 2026-10-29 |
| Owner / reviewer | Solution Architect / Chủ dự án + Developer + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0 (Q2 C, Q13 C, Q11 B), [ADR-S06-001](02_ADR-S06-001_core_rendered_ui_slots.md) |
| Đọc trước / đọc tiếp | [ADR-S06-001](02_ADR-S06-001_core_rendered_ui_slots.md) / [DES-UI-S06-002](../06_designs/ui/02_DES-UI-S06-002_catalog_web_component_migration.md) |

## 1. Bối cảnh

Catalog hiện là screen iframe:

- `plugins/catalog/plugin.json`: 3 screen `render_mode: IFRAME` (desktop, mobile read-only, platform system).
- Core `PluginScreenHostComponent` mount iframe, đồng bộ route qua `postMessage`, mint runtime token ngắn hạn.
- UI catalog build bởi project `catalog-plugin` trong `src/frontend/web/angular.json`, output `META-INF/resources`, plugin container serve.

Sprint 06 chốt **bỏ iframe hoàn toàn** (Q2 C) và **migrate catalog sang MF/WC trong S06** (Q13 C). Chỉ có `catalog` là plugin cũ (Q11 B).

## 2. Quyết định

| # | Quyết định | Lý do |
| :--- | :--- | :--- |
| **M1** | Catalog chuyển sang **Web Component** (`op-catalog-app`) thay vì MF | WC đơn giản hơn cho full app; không cần MF build plugin; vẫn đúng Q6 (WC + MF được hỗ trợ) |
| **M2** | Giữ route nội bộ của catalog (`/:filter/:sort/:pageSize/:page/:id/:mode`) và hash routing | Không đổi UX/bookmark; chỉ đổi cơ chế host |
| **M3** | Core truyền `route`, `scope` (`tenant|system`), `readonly`, `theme`, `language` qua property; plugin phát `op:route-change`, `op:resize`, `op:notify` | Thay `postMessage` iframe |
| **M4** | Bỏ **iframe cookie/route bridge**; vẫn dùng plugin runtime token ngắn hạn để tải entry/static asset (script tag không gửi được JWT header); API calls dùng JWT Core qua interceptor | Cùng origin Core; giảm token bridge nhưng không phá cơ chế tải asset |
| **M5** | Build WC với `@angular/elements`; output **không hash** (`main.js`) trong `META-INF/resources` để manifest có entry ổn định | Entry cố định; cache-buster do gateway/version |
| **M6** | `PluginRenderMode.IFRAME` bị **deprecated** trong giai đoạn migrate, **xoá** sau khi catalog PASS; manifest publish với `IFRAME` bị từ chối | Không phá runtime trong lúc chuyển |
| **M7** | Xoá `PluginIframeLoaderComponent`, nhánh iframe trong `PluginScreenHostComponent`, test/QA liên quan sau migrate | Đúng Q2 C |
| **M8** | Mobile dùng cùng WC với `readonly=true`; giữ touch target ≥40px, overflow 0 | Q14 A |
| **M9** | Platform system catalog dùng WC + `scope=system` + platform token; route `/platform/apps/catalog` | Giữ AC-22 |
| **M10** | Rollback: giữ image/tag catalog cũ + feature flag `plugin.host.render-mode.iframe=true` tạm thời; chỉ xoá sau QA PASS | Giảm rủi ro High |
| **M11** | Gateway set cookie `plugin_token` (HttpOnly, SameSite, path `/api/v1/plugins/runtime/<key>`) khi serve entry có query; WC chunk/static request dùng cookie | Trình duyệt không gửi JWT header cho `<script>`/module import; cookie tránh 401 asset |

## 3. Kiến trúc sau migrate

```text
Core PluginScreenHostComponent
  └── PluginWebComponentLoaderComponent
        ├── load /plugins-runtime/catalog/main.js (module)
        ├── customElements.define('op-catalog-app')
        ├── set properties: route, scope, readonly, theme, language
        └── listen: op:route-change, op:resize, op:notify

Catalog Web Component (op-catalog-app)
  ├── Angular root + provideRouter(hash)
  ├── CatalogPluginShellComponent (router-outlet + context menu)
  ├── route property setter -> router.navigateByUrl
  └── router NavigationEnd -> dispatch op:route-change
```

### 3.1. Thay đổi code dự kiến

| File | Thay đổi |
| :--- | :--- |
| `plugins/catalog/web/src/plugin-main.ts` | `createApplication` + `createCustomElement(CatalogPluginShellComponent, {injector})` + `customElements.define('op-catalog-app', el)`; bỏ `bootstrapApplication` |
| `catalog-plugin-shell.component.ts` | Bỏ `postMessage`; thêm inputs `route/scope/readonly/theme/language`; dispatch `op:*` events; bỏ height bridge |
| `plugins/catalog/web/src/styles.css` | Giữ Tailwind entry; thêm scope CSS nếu cần (`op-catalog-app` prefix) |
| `plugins/catalog/plugin.json` | `render_mode: WEB_COMPONENT`, `entry: /plugins-runtime/catalog/main.js`, `tag_name: op-catalog-app`; bỏ IFRAME |
| `src/frontend/shared/plugin-host/plugin-host.model.ts` | Thêm `tag_name`, `exposed_module`, `platforms`, `read_only` |
| `src/frontend/web/.../plugin-screen-host.component.*` | Bỏ iframe branch/state; truyền context; listen `op:route-change` |
| `src/frontend/shared/plugin-host/iframe-loader/**` | Xoá sau migrate |
| `src/frontend/shared/plugin-host/index.ts` | Bỏ export iframe loader |
| `src/backend/.../PluginRenderMode.java` | Bỏ `IFRAME`; parse invalid trả lỗi/skip |
| `src/backend/.../plugin.json` (catalog) | Cập nhật 3 screen; validate publish |

## 4. Kế hoạch migrate (phase)

| Phase | Nội dung | Output/kiểm chứng |
| :--- | :--- | :--- |
| **M1** | Build WC catalog song song iframe; giữ manifest IFRAME; test mount WC trên branch | WC mount được, route/theme/i18n đúng |
| **M2** | Đổi manifest catalog sang WC; Core host dùng WC; giữ iframe loader (feature flag) | Catalog desktop/mobile/platform PASS; API gateway 200 |
| **M3** | QA regression catalog: list/drawer/context menu/route-state/token refresh/mobile 390×844 | 0 console error, overflow 0, ảnh evidence |
| **M4** | Xoá iframe loader/enum/nhánh code; cập nhật template/CLI; build lại | `grep -r IFRAME` = 0 (trừ docs lịch sử); build PASS |
| **M5** | Cập nhật user/dev docs + release notes | Guide có ảnh; không còn hướng dẫn iframe |

## 5. Ảnh hưởng & rủi ro

| Ảnh hưởng | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| CSS catalog (Tailwind global) ảnh hưởng Core và ngược lại | High | Scope CSS bằng `op-catalog-app` + plugin-owned Tailwind entry; QA visual desktop/mobile |
| Route-state/bookmark thay đổi | High | Giữ hash route; test reload/bookmark; mirror URL Core |
| Token/session: bỏ iframe cookie | Medium | WC dùng JWT Core; gateway vẫn kiểm tra tenant/quyền; test 401 |
| Platform system scope | High | Truyền `scope=system` + platform token; test `/platform/apps/catalog` |
| Mobile touch/layout | Medium | `readonly` property + CSS touch ≥40px; test 390×844 |
| Build WC làm tăng bundle | Medium | Budget 900kB; lazy route; đo bundle |
| Rollback phức tạp | High | Feature flag + image cũ; không xoá iframe code trước QA PASS |

## 6. Tiêu chí nghiệm thu

- Catalog chạy WC trên `/settings/apps/catalog` desktop + mobile; không còn iframe.
- Route-state `/settings/apps/catalog/DISTRICT/-/20/1/-/list` reload/bookmark đúng.
- Platform `/platform/apps/catalog` chạy WC với system scope.
- `PluginRenderMode.IFRAME` và `iframe-loader` bị xoá; `grep` không còn trong code.
- QA: 0 `console.error`, mobile overflow 0, touch target ≥40px, i18n 13 locale (hoặc tối thiểu vi/en nếu scope cho phép).
- API catalog qua gateway vẫn 200; không đổi contract.
- Template/CLI không còn sinh iframe.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Chốt bỏ iframe, migrate catalog sang WC, phase/rollback/tiêu chí | Architect; CONF-S06-001 1.0 |
| 1.0 | 2026-10-29 | Chủ dự án duyệt design ready (Q17 + design review); Chốt bỏ iframe, migrate catalog sang WC, phase/rollback/tiêu chí | Architect; CONF-S06-001 1.0 |
