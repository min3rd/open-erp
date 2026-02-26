# Backend Copilot Instructions

See root `../.github/copilot-instructions.md` for architecture overview and cross-project conventions.

## API Response Envelope

**Every endpoint** returns `{ success, message, error, data, meta }` using helpers from `@shared/response`:

```typescript
import { ok, created, updated, deleted, fetched, paginated } from '@shared/response';

return fetched(user);                                          // GET single
return created(user, 'User created');                          // POST
return updated(user, 'User updated');                          // PATCH
return deleted('User deleted');                                // DELETE
return paginated(items, page, limit, total, { query, sort });  // GET list
```

Errors: throw `HttpException` with `error()` or `validationError()` from `@shared/response` and codes from `@shared/errors/error-codes`.

## Controller Patterns

- HTTP endpoints in `*.controller.ts`, RPC in `*-rpc.controller.ts`, events in `*-event.controller.ts`
- Guard chain: `@UseGuards(JwtAuthGuard, PermissionsGuard)`  use `@Public()` to bypass, `@Permissions('resource.action')` for RBAC
- DTOs: `class-validator` decorators + `@ApiProperty()` on every field
- URI versioning: all routes prefixed `/v1/`

## Schemas (Mongoose)

Located in `libs/shared/schemas/`. Required conventions:
- `@Schema({ collection: 'plural_name', timestamps: true, versionKey: false })`
- Soft deletes via `deletedAt?: Date` + pre-find middleware to exclude deleted docs
- Sub-schemas: `@Schema({ _id: false })`
- Type: `export type XDocument = HydratedDocument<X>`

## Inter-Service Communication

All message patterns in `libs/shared/constants/message.constants.ts`:
```typescript
// RPC (request-response)
this.userClient.send(RPC_METHODS.USER.FIND_USER_BY_EMAIL, { email });
// Events (fire-and-forget)
this.notificationClient.emit(EVENT_NAMES.USER.CREATED, payload);
```

Three RabbitMQ client tokens: `RABBITMQ_USER_CLIENT`, `RABBITMQ_NOTIFICATION_CLIENT`, `RABBITMQ_AUTH_CLIENT`.

## Service Startup

```bash
cd open-erp-backend
npm run docker:dev:up          # start MongoDB, RabbitMQ, MinIO, OnlyOffice
npm run start:auth:dev         # start individual service in watch mode
npm run db:seed:all            # seed all reference data
```

## RBAC

- Roles have `scope: 'global' | 'organization'` and `permissions[]` array
- `SUPER_ADMIN` bypasses all permission checks
- Permission format: `resource.action` (e.g., `user.create`, `product.manage`)
- Permissions enum: `libs/shared/types/permission.enum.ts`

## Testing

- Jest: `npm test` / `npm run test:e2e`
- Every endpoint should have a contract test validating the response envelope schema
- Use `@shared/response/schemas/api-response.schema.json` with Ajv for validation

## Key Conventions

- Common Service uses **Fastify** (`NestFastifyApplication`); all others use Express
- All services connect to the same MongoDB database (`open_erp`)
- Winston logger: inject `WINSTON_MODULE_NEST_PROVIDER`, never use `console.log`
- Swagger: enabled conditionally via `ENABLE_SWAGGER=true` env var
- Correlation IDs: propagated via `x-correlation-id` header
