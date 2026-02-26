```instructions
# Open ERP – Copilot Instructions

## Architecture Overview

Monorepo with three projects sharing one workspace:

| Project | Stack | Port(s) |
|---------|-------|---------|
| `open-erp-backend/` | NestJS 11 monorepo, Mongoose 11, RabbitMQ, MongoDB | 3001-3009 |
| `open-erp-web/` | Angular 21, PrimeNG 21, Tailwind CSS 4, Transloco, Vitest | 4200 |
| `open-erp-mobile/` | Angular 20, Ionic 8, Capacitor 8 | 8100 |

### Backend Microservices

All services share **one MongoDB database** (`open_erp`) and communicate via **RabbitMQ**. Shared code lives in `open-erp-backend/libs/shared/` imported as `@shared/*`.

| Service | Port | Key Responsibility |
|---------|------|--------------------|
| auth | 3001 | JWT login/register, 2FA, email verification |
| user | 3002 | User CRUD, roles, org membership (RMQ consumer: `user_queue`) |
| notification | 3003 | Email/SMS dispatch (RMQ consumer: `notification_queue`) |
| config-service | 3004 | Global config, navigation menus |
| organization | 3005 | Multi-org hierarchy, invitations |
| inventory | 3006 | Products, stock, warehouses |
| common-service | 3007 | Master data (provinces, districts, wards) — uses **Fastify** |
| file-service | 3008 | File uploads via MinIO, OnlyOffice integration |
| chat | 3009 | Real-time chat via WebSocket |

### Infrastructure (docker-compose.dev.yml)

MongoDB `:27017`, RabbitMQ `:5672`/`:15672`, MinIO `:9000`/`:9001`, OnlyOffice `:8080`.
Start with: `cd open-erp-backend && npm run docker:dev:up`

### Inter-Service Communication

RabbitMQ patterns are centralized in `libs/shared/constants/message.constants.ts`:
- **RPC** (`@MessagePattern` / `ClientProxy.send()`): Auth→User for user lookup on login
- **Events** (`@EventPattern` / `ClientProxy.emit()`): User→Notification for email dispatch
- Three named clients: `RABBITMQ_USER_CLIENT`, `RABBITMQ_NOTIFICATION_CLIENT`, `RABBITMQ_AUTH_CLIENT`
- Services split controllers: `*.controller.ts` (HTTP), `*-rpc.controller.ts`, `*-event.controller.ts`

### Frontend → Backend Integration

No API proxy—frontend calls microservices directly via `http://localhost:PORT/v1/...`.
Base URLs defined in `open-erp-web/src/core/constant.ts`. All responses use a standardized envelope; unwrap with `unwrap()` from `core/api/http-wrapper.ts`.

## Critical Conventions

### Backend

- **API envelope**: Every endpoint returns `{ success, message, error, data, meta }` via helpers from `@shared/response` (`ok()`, `created()`, `paginated()`, etc.)
- **Auth chain**: `@UseGuards(JwtAuthGuard, PermissionsGuard)` — `@Public()` to bypass, `@Permissions('resource.action')` for RBAC
- **URI versioning**: All endpoints prefixed `/v1/` via `VersioningType.URI`
- **Schemas**: Mongoose decorators in `libs/shared/schemas/`, explicit `collection` name, `timestamps: true`, `versionKey: false`, soft deletes via `deletedAt`
- **DTOs**: class-validator + `@ApiProperty()` Swagger decorators on every field
- **Error codes**: Use constants from `@shared/errors/error-codes`
- **Logging**: Winston via `WINSTON_MODULE_NEST_PROVIDER`
- **Start a service**: `npm run start:<service>:dev` (e.g., `npm run start:auth:dev`)
- **Seeds**: `npm run db:seed:all` or individual `npm run db:seed:<name>`
- **Tests**: `npm test` (Jest), `npm run test:e2e`

### Frontend (Web)

- **Angular 21 standalone only**: No NgModules — components use `imports: [...]` directly. Do NOT set `standalone: true` (default in v20+)
- **File naming**: `kebab-case.ts` / `.html` — no `.component` suffix. Class names are PascalCase nouns without "Component" (e.g., `Warehouse`)
- **DI**: Always `inject()` function, never constructor injection
- **Change detection**: Always `ChangeDetectionStrategy.OnPush`
- **Signals**: Use `signal()` for local state, `computed()` for derived state
- **i18n**: Transloco — all user-facing text via `{{ 'key' | transloco }}` or `TranslocoService.translate()`. Keys in `public/i18n/en.json` and `es.json`
- **PrimeNG templates**: Use `#templateName` syntax (e.g., `<ng-template #header>`), never `pTemplate="..."`
- **Styling**: Tailwind utility classes only — no inline styles, no `ngClass`/`ngStyle`
- **Control flow**: Native `@if`, `@for`, `@switch` — never `*ngIf`/`*ngFor`
- **API calls**: `HttpClient` + `unwrap()` from `core/api`, versioned URLs `${API_URI_*}/v1/...`
- **Routing**: Lazy-loaded via `loadChildren`, data pre-fetched via route resolvers
- **Testing**: Vitest 4 with jsdom — run `ng test`
- **Formatting**: Prettier (100 char width, single quotes, Angular HTML parser)

### Mobile

- Early-stage Ionic/Capacitor app (`open-erp-mobile/`). Tabs-based scaffold using Angular 20 + Ionic 8.

## Key File Reference

| Purpose | Path |
|---------|------|
| Backend shared schemas | `open-erp-backend/libs/shared/schemas/` |
| RPC/Event constants | `open-erp-backend/libs/shared/constants/message.constants.ts` |
| RBAC permissions enum | `open-erp-backend/libs/shared/types/permission.enum.ts` |
| API response helpers | `open-erp-backend/libs/shared/response/` |
| Auth guards & decorators | `open-erp-backend/libs/shared/authz/` |
| Frontend API base URLs | `open-erp-web/src/core/constant.ts` |
| API envelope unwrap | `open-erp-web/src/core/api/http-wrapper.ts` |
| Frontend route tree | `open-erp-web/src/app/app.routes.ts` → `private.routes.ts` → `modules.routes.ts` |
| Frontend services | `open-erp-web/src/core/services/` |
| Frontend i18n files | `open-erp-web/public/i18n/` |
| Seed scripts | `open-erp-backend/scripts/seeds/` |
```
