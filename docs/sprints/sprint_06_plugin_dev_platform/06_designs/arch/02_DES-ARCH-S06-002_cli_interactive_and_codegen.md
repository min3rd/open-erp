# [DES-ARCH-S06-002] Thiết kế CLI tương tác & codegen

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-ARCH-S06-002 / Thiết kế / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — 2026-10-29** / 1.0 / 2026-10-29 |
| Owner / reviewer | Solution Architect / Developer |
| Đầu vào | [SOL-S06-001](../../05_solutions/01_SOL-S06-001_template_and_cli_architecture.md), [ANL-S06-001](../../02_analysis/01_ANL-S06-001_template_and_cli_interactive.md), [CONF-S06-001](../../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0 |
| Đọc trước / đọc tiếp | [DES-ARCH-S06-001](01_DES-ARCH-S06-001_plugin_platform_architecture.md) / [DES-API-S06-001](../api/01_DES-API-S06-001_manifest_and_ui_manifest.md) |

## 1. Mục đích

Đặc tả luồng hỏi–đáp, mô hình draft, file sinh ra, quy tắc idempotency và kiểm thử cho CLI `@open-erp/cli` thế hệ 2.0.

> **Giới hạn phạm vi:** template 2.0 dành cho plugin nằm trong monorepo `plugins/<id>` (như `plugins/catalog`) để dùng `@shared` qua path mapping. Plugin repo độc lập ngoài monorepo cần package UI SDK được publish (follow-up); CLI cảnh báo nếu `--target` ra ngoài repo.

## 2. Nguyên tắc triển khai

1. **Zero dependency**: chỉ dùng `node:fs`, `node:path`, `node:readline/promises`, `node:child_process`.
2. **Prompt tách khỏi generator**: prompt trả draft; generator là hàm thuần `(draft, templateContext) => files`.
3. **Manifest ghi sau cùng**: nếu sinh file lỗi, không cập nhật manifest.
4. **Idempotent**: không ghi đè file đã tồn tại nếu không có `--force`.
5. **Không sinh `.spec.ts`**; backend sinh test tối thiểu.
6. **Mọi text UI dùng i18n key**; generator thêm key vào `vi.json`/`en.json`.

## 3. Cấu trúc module

```text
tools/open-erp-cli/src/
├── interactive/
│   ├── prompt.js          # askText/askConfirm/askSelect/askMulti/askLoop
│   ├── wizard.js          # menu + điều phối
│   ├── plugin-wizard.js
│   ├── entity-wizard.js
│   ├── field-wizard.js
│   ├── relation-wizard.js
│   └── crud-wizard.js
├── lib/
│   ├── draft.js           # PluginDraft/EntityDraft/FieldDraft/RelationDraft/CrudDraft
│   ├── generator/
│   │   ├── plugin.js      # template 2.0
│   │   ├── entity.js      # model/dto/service/resource/query/migration
│   │   ├── crud.js        # Angular list/form/service/route/i18n
│   │   └── manifest.js    # merge an toàn
│   ├── template-v2/       # file template (không phải code generator)
│   └── validate/          # schema/field/relation/slot/migration
└── commands/
    ├── create.js
    ├── generate.js
    ├── validate.js
    ├── upgrade.js
    └── misc.js
```

## 4. Prompt model

### 4.1. Kiểu câu hỏi

| Hàm | Dùng cho | Quy tắc |
| :--- | :--- | :--- |
| `askText` | id/name/description/pattern | Trim; validate ngay; cho phép Enter nhận default |
| `askConfirm` | có/không | Default rõ `[Y/n]` hoặc `[y/N]` |
| `askSelect` | packaging/storage/type/cardinality/on_delete | Mũi tên hoặc số; default được đánh dấu |
| `askMulti` | platforms/columns/filters | Space để chọn; Enter xác nhận |
| `askLoop` | fields/relations/CRUD columns | Hỏi “thêm tiếp?”; cho phép kết thúc |
| `askReview` | xác nhận trước ghi | Hiển thị summary + file list |

### 4.2. Hành vi chung

- `Ctrl+C` thoát không ghi file; in “Không có thay đổi”.
- `--non-interactive` + thiếu flag bắt buộc ⇒ lỗi rõ, exit code 2.
- `--yes` bỏ qua xác nhận review (dùng CI).
- `--dry-run` in file list, không hỏi review.
- Không hỏi lại giá trị suy ra được (table, package, permission, migration version).

## 5. Draft model

```ts
interface PluginDraft {
  id: string; name: string; description: string;
  packaging: 'image' | 'bundle';
  platforms: Array<'desktop' | 'mobile'>;
  withWeb: boolean;
  storageScope: 'TENANT' | 'CORE';
  entities: EntityDraft[];
}

interface EntityDraft {
  name: string; table: string; storageScope: 'TENANT' | 'CORE';
  fields: FieldDraft[];
  relations: RelationDraft[];
  crud?: CrudDraft;
}

interface FieldDraft {
  name: string;
  type: 'string' | 'text' | 'int' | 'decimal' | 'bool' | 'date' | 'datetime' | 'enum' | 'json' | 'uuid';
  required: boolean; unique: boolean;
  default?: string;
  maxLength?: number; min?: number; max?: number;
  pattern?: string;
  enumValues?: string[];
  labelKey?: string;
}

interface RelationDraft {
  name: string; ownerEntity: string;
  type: 'MANY_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  target: string;              // self.ProductCategory | core.user | plugin:catalog.CatalogItem
  storage: 'FK' | 'SOFT_REF';
  targetDisplayField?: string;
  required: boolean;
  onDelete: 'RESTRICT' | 'SET_NULL' | 'NO_ACTION';
}

interface CrudDraft {
  entity: string; route: string;
  columns: string[]; filters: string[];
  formFields: string[];
  layout: 'drawer' | 'split';
}
```

Draft được serialize trong test để chạy generator không cần TTY.

## 6. Lệnh & flag

| Lệnh | Flag chính | Hành vi |
| :--- | :--- | :--- |
| `open-erp-cli` | — | Menu wizard |
| `create` | `--id --name --description --packaging --platforms --with-web --storage-scope --non-interactive --dry-run --force` | Tạo plugin + entity đầu tiên (nếu chọn); mặc định `plugins/<id>` khi chạy trong monorepo |
| `generate entity` | `--name --table --storage-scope --fields --interactive` | Sinh entity + migration + permission + DTO/service/resource |
| `generate field` | `--entity --name --type --required --unique --default --enum-values --validator` | Sinh/cập nhật field + migration + UI metadata |
| `generate relation` | `--entity --name --target --type --storage --display-field --required --on-delete` | Sinh FK/soft ref + manifest |
| `generate crud` | `--entity --route --columns --filters --form-fields --layout` | Sinh Angular list/form/service/route/i18n |
| `validate` | `--core-url --json` | Offline + registry/slot nếu có URL |
| `upgrade` | `--check --apply --yes` | So sánh/migrate template 2.0 |
| `dev` | `--core-url --run` | Compose dev, không `TENANT_ID` cố định |
| `package` | `--with-web --dry-run` | Build/checksum |

## 7. File sinh ra

### 7.1. Plugin mới

| File | Nội dung |
| :--- | :--- |
| `plugin.json` | Manifest 2.0 |
| `pom.xml` | Quarkus REST + `plugin-sdk`; không JDBC/Hibernate/Flyway |
| `src/main/resources/application.properties` | Gateway/Redis/TLS; không datasource |
| `src/main/java/.../Sample...` | Nếu có entity đầu tiên |
| `migrations/V1.0.0__initial_schema.sql` | DDL schema tenant (manifest file = basename) |
| `web/` | Angular 22, `plugin-main.ts`, `styles.css`, i18n |
| `deploy/`, `ci/`, `README.md` | Theo template 2.0 |

### 7.2. Entity

| File | Nội dung |
| :--- | :--- |
| `model/<Entity>.java` | POJO field + enum + getter/setter hoặc public field theo coding standard |
| `dto/<Entity>Dto.java` | Request/response DTO |
| `service/<Entity>Service.java` | CRUD qua `PluginDataClient`; validate; transaction boundary |
| `resource/<Entity>Resource.java` | `@Path`, 4 khuôn mẫu response, permission |
| `query/<Entity>Queries.java` | Descriptor LIST/GET/INSERT/UPDATE/DELETE |
| `migrations/V<x.y.z>__create_<entity>.sql` | Bảng + FK cùng plugin + index; không `tenant_id` |
| `src/test/java/.../<Entity>ResourceTest.java` | List/create trên PostgreSQL/Redis thật |
| `plugin.json` | `entities[]`, `relations[]`, `queries[]`, `permissions[]` |

### 7.3. CRUD Angular

| File | Nội dung |
| :--- | :--- |
| `web/src/app/features/<entity>/<entity>-list.component.ts/.html` | DataTable, filter, pagination, drawer trigger |
| `web/src/app/features/<entity>/<entity>-form-drawer.component.ts/.html` | Form tạo/sửa, validation, i18n |
| `web/src/app/features/<entity>/<entity>.service.ts` | HttpClient gọi API plugin |
| `web/src/app/features/<entity>/<entity>.routes.ts` | Route list + create/edit |
| `web/public/i18n/{vi,en}.json` | Key nhãn/cột/lỗi |
| `plugin.json.ui_manifest.screens/crud` | Route + metadata |

**Quy ước UI:** dùng component shared (`DataTable`, `Drawer`, `SharpInput`, `SharpSelect`, `Badge`, `Pagination`); template `.html` tách file; không modal; `text-xs`/`p-1`/`rounded-sm`; i18n 100%.

## 8. Quan hệ & migration

| Loại | Migration | Java | UI |
| :--- | :--- | :--- | :--- |
| FK cùng plugin | `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (target_id) REFERENCES ...` | `UUID targetId` | Picker/select entity cùng plugin |
| Soft ref Core | Cột `target_id UUID`, `target_text VARCHAR(255)` + index | `UUID targetId; String targetText` | Picker gọi API Core hoặc nhập text |
| Soft ref plugin khác | Như trên | Như trên | Picker gọi gateway/plugin API; fallback text |

- `on_delete` FK: `RESTRICT`/`SET NULL`/`NO ACTION`.
- Soft ref: service kiểm tra tồn tại khi ghi; lưu snapshot text.
- CLI validate target syntax; `--core-url` kiểm tra entity tồn tại + public fields.

## 9. Validate

### 9.1. Offline

- Manifest schema, id/version/permission pattern.
- Entity trùng tên/bảng; field trùng; type/validator hợp lệ; enum có values.
- Relation `self.*` phải trỏ entity cùng plugin; `core.*`/`plugin:*.*` phải có `storage=SOFT_REF`.
- Migration file tồn tại + SHA-256 khớp.
- Screen route trùng; contribution slot syntax; render mode WC/MF.
- CRUD entity/columns/form fields tồn tại.

### 9.2. `--core-url`

- Gọi `GET /api/v1/plugins/entity-registry?entity=core.user` (hoặc endpoint tương đương) để kiểm tra target.
- Gọi `GET /api/v1/plugins/ui-slots?slot=core.layout.header.actions` để kiểm tra slot + contract.
- Kết quả in bảng `PASS/FAIL/WARN`; exit code 1 nếu FAIL.

## 10. Upgrade template

```text
open-erp-cli upgrade --check
  → so sánh file template 2.0 với plugin hiện tại
  → báo MISSING/OUTDATED/CUSTOMIZED
open-erp-cli upgrade --apply --yes
  → backup file sắp ghi vào .open-erp/upgrade-<timestamp>/
  → ghi file template, giữ file CUSTOMIZED
  → cập nhật template_version
  → chạy validate
```

- `catalog` migrate theo [ADR-S06-002](../../05_solutions/03_ADR-S06-002_iframe_removal_catalog_migration.md), không dùng upgrade mù.
- Không tự động migrate DB; chỉ file cấu trúc.

## 11. Test

| Test | Nội dung |
| :--- | :--- |
| Unit prompt | Inject answers array; kiểm tra default/validation/cancel |
| Generator snapshot | Draft → file map; so snapshot |
| Manifest merge | Thêm entity/field/relation không phá dữ liệu cũ |
| Validate | Bảng case pass/fail |
| CLI e2e | `create → generate entity → generate crud → validate` trong temp dir |
| Build smoke | `mvn -q -DskipTests package` + web build (CI, Docker) |

## 12. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Đặc tả prompt/draft/lệnh/file sinh/validate/upgrade/test | Architect; SOL-S06-001 |
| 1.0 | 2026-10-29 | Chủ dự án duyệt design ready (Q17 + design review); Đặc tả prompt/draft/lệnh/file sinh/validate/upgrade/test | Architect; SOL-S06-001 |
