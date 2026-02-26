# Frontend (Web) Copilot Instructions

See root `../.github/copilot-instructions.md` for architecture overview and cross-project conventions.

## Angular Conventions

- **Standalone only**: No NgModules. Do NOT set `standalone: true` (default in Angular 20+)
- **File naming**: `kebab-case.ts` / `.html`  no `.component` suffix. Classes: PascalCase nouns without "Component" (e.g., `Warehouse`, `Login`)
- **DI**: Always `inject()` function, never constructor injection
- **Change detection**: Always `ChangeDetectionStrategy.OnPush`
- **State**: `signal()` for local state, `computed()` for derived, `update()`/`set()` to modify (never `mutate`)
- **Control flow**: Native `@if`, `@for`, `@switch`  never `*ngIf`/`*ngFor`
- **Inputs/outputs**: Use `input()` and `output()` functions, not decorators
- **Host bindings**: Use `host` object in `@Component`, not `@HostBinding`/`@HostListener`

## i18n (Transloco)

All user-facing text goes through Transloco  never hardcode strings:
- Templates: `{{ 'key.path' | transloco }}`
- TypeScript: `TranslocoService.translate('key')`
- Translation files: `public/i18n/en.json`, `public/i18n/es.json`

## PrimeNG

- Template syntax: `<ng-template #header>`, `<ng-template #body>`  never `pTemplate="..."`
- Table pagination: Always use built-in `[paginator]="true"` with `[lazy]="true"` for server-side  never custom pagination components
- Theme: Aura preset with dark mode via `.dark` class selector

## Styling

- **Tailwind CSS 4** utility classes only  no inline `style=""`, no `ngClass`/`ngStyle`
- Use `class` bindings for conditional classes
- Tailwind v4 CSS-based config in `styles.css` (no `tailwind.config.js`)

## API Integration

No proxy  services call backends directly at `http://localhost:PORT/v1/...`:
```typescript
import { API_URI_INVENTORY } from 'core/constant';
import { unwrap, isApiResponse } from 'core/api/http-wrapper';

this.http.get<ApiPaginatedResponse<Item>>(`${API_URI_INVENTORY}/v1/warehouses`, { params })
  .pipe(map(res => isApiResponse(res) ? unwrap(res) : res));
```

Base URLs in `src/core/constant.ts`. Auth interceptor attaches Bearer token automatically.

## Routing

- Three-tier lazy loading: `app.routes`  `private.routes`  `modules.routes`  feature routes
- Data pre-loaded via route resolvers (root resolver loads nav, profile, chat, languages)
- Layout selected per route via `data: { layout: 'vertical' | 'empty' }` on the `Layout` component
- Every feature exports `const routes: Routes = [...]`

## Data Operation Screens

- Toolbar at top (`{component}-toolbar`) with title + actions
- Scrollable content area below (`{component}-content`)
- Toolbar stays fixed; only content scrolls

## DOM IDs

All interactive elements need unique IDs: `{component}-{field}`, `{component}-{field}-error`, `{component}-{action}-button`. Must pass AXE/WCAG AA checks.

## Testing

- Vitest 4 with jsdom: `ng test`
- Co-located `.spec.ts` files
- Use `TranslocoTestingModule` from `core/testing/` for i18n in tests
- Import from `vitest`: `describe`, `it`, `expect`, `beforeEach`

## Formatting

Prettier: 100 char width, single quotes, Angular HTML parser.
