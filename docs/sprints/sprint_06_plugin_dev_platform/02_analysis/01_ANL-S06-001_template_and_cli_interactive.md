# [ANL-S06-001] Phân tích template plugin & CLI tương tác

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S06-001 / Phân tích / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-29 |
| Owner / reviewer | BA Agent / Architect + Developer |
| Đầu vào | [RAW-S06-001](../01_raw_notes/01_RAW-S06-001_plugin_dev_platform_requirements.md), [ADR-S05-001](../../sprint_05_catalog_plugin/05_solutions/02_ADR-S05-001_catalog_independent_plugin.md), [ADR-S05-002](../../sprint_05_catalog_plugin/05_solutions/03_ADR-S05-002_thin_plugin_backend.md), [TASK-402](../../sprint_05_catalog_plugin/07_items/TASK-402_plugin_data_gateway_grpc.md), [TASK-407](../../sprint_05_catalog_plugin/07_items/TASK-407_cli_scaffold_zero_db.md) |
| Đọc trước / đọc tiếp | [RAW-S06-001](../01_raw_notes/01_RAW-S06-001_plugin_dev_platform_requirements.md) / [ANL-S06-002](02_ANL-S06-002_core_rendered_ui_slots.md), [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) |

## 1. Mục đích

Trả lời hai câu hỏi trước khi thiết kế:

1. Template CLI đang lệch kiến trúc plugin Sprint 05 ở những điểm nào, cần sửa gì để plugin sinh ra chạy được ngay?
2. Luồng CLI tương tác nên hỏi gì, sinh ra file gì, và phần nào nên dùng renderer dùng chung thay vì sinh mã?

Tài liệu **không** chốt thay khách hàng; các điểm cần quyết định được đánh dấu `Qn` và chuyển sang [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md).

> **Cập nhật 2026-10-29 — 16/16 câu đã trả lời:** chọn **sinh mã Angular** cho CRUD (Q7 B), **sinh Java service/resource từng entity** (Q8 B), **FK cùng plugin + soft ref xuyên plugin** (Q9 B), **bare wizard + `--interactive`** (Q10 A), **migrate toàn bộ plugin cũ** (Q11 B), **offline + `--core-url`** (Q16 A). Các mục dưới đây đã cập nhật theo lựa chọn; gate vẫn chờ Q17.

## 2. Hiện trạng template & CLI

### 2.1. Template backend còn kiến trúc cũ

| Vị trí | Hiện tại | Đúng kiến trúc Sprint 05 phải là |
| :--- | :--- | :--- |
| `pom.xml` | `quarkus-hibernate-orm-panache`, `quarkus-jdbc-postgresql`, `quarkus-flyway` | Quarkus REST + `plugin-sdk`; không JDBC/Hibernate/Flyway |
| `application.properties` | datasource URL/user/password, Hibernate schema, Flyway | Chỉ gateway URL/TLS/Redis; core cấp datasource env (nếu còn) |
| Entity mẫu | `@Entity`, Panache, `tenant_id` | POJO nghiệp vụ; schema tenant do core quản trị |
| Repository | `SampleItemRepository` Panache | Không repository DB; dùng `PluginDataClient` + query descriptor |
| Resource | Đọc `System.getenv("TENANT_ID")`, trả `Map` | Tenant context từ token/gateway; DTO + 4 khuôn mẫu response |
| Migration | `src/main/resources/db/plugin-migration`, có `tenant_id` | `migrations/` + `plugin.json.migrations` + SHA-256; không `tenant_id` |
| Web | Screen đơn giản, i18n riêng, chưa có contribution entry | Angular 22 standalone, Tailwind entry riêng, screen + contribution bundle |

**Kết luận:** plugin sinh bởi CLI hiện tại **không chạy đúng** trên shared runtime zero-DB. Đây là nội dung TASK-407 (Medium) và là R1 của Sprint 06.

### 2.2. CLI hiện có

| Lệnh | Hiện tại | Thiếu |
| :--- | :--- | :--- |
| `create` | Hỏi id/name/description nếu TTY; flag cho phần còn lại | Chưa có menu/wizard; chưa hỏi entity đầu tiên, platform, storage scope, UI slots |
| `generate entity` | `--name`, `--fields code:string,name:string`; sinh entity/migration/permission | Field type ít; không validator; không relation; không CRUD; template Panache/`tenant_id` |
| `generate menu` | Thêm `ui_manifest.screens` | Chưa kiểm tra route/host; chưa sinh route thật |
| `generate ui-contribution` | Thêm `ui_manifest.contributions` | Chưa sinh component stub; chưa kiểm tra slot tồn tại/contract |
| `validate` | Manifest schema cơ bản | Chưa kiểm tra field/validator/relation/CRUD/slot contract/checksum |
| `dev` | Sinh compose | Còn biến `TENANT_ID`/`PLUGIN_SERVICE_TOKEN` (TASK-407) |

### 2.3. Khoảng trống cần xử lý

| # | Khoảng trống | Ảnh hưởng | Đề xuất |
| :--- | :--- | :--- | :--- |
| G1 | Template lệch zero-DB | Plugin mới không chạy | Viết lại template bundle `2.0.0` |
| G2 | Không có wizard tổng | Developer phải nhớ nhiều lệnh/flag | Bare `open-erp-cli` mở menu; mọi lệnh hỗ trợ `--interactive` |
| G3 | Field type/validator nghèo | CRUD sinh ra thiếu kiểm tra | Khai báo field có `type`, `required`, `unique`, `default`, `min/max`, `pattern`, `enum` |
| G4 | Không có quan hệ entity | Không mô tả được Core/plugin khác | `relations[]` + Entity Registry; soft reference |
| G5 | Không có CRUD generator | Developer viết lặp list/form | Renderer metadata dùng chung hoặc sinh mã (Q7/Q8) |
| G6 | Validate không kiểm tra slot/relation | Lỗi chỉ phát hiện khi chạy | Validate offline + `--core-url` tùy chọn |
| G7 | Không có chế độ cập nhật plugin đã có | Chạy lại dễ ghi đè | Đọc manifest/migration hiện có, chèn idempotent |
| G8 | Chưa có mẫu contribution | Developer không biết viết component | `generate ui-contribution` sinh stub WC/MF + entry + i18n |
| G9 | Tài liệu còn mô hình CORE_IN_PROCESS | Developer làm sai | Cập nhật `create_new_plugin_guide.md` |
| G10 | Không có test template end-to-end | Template lỗi mà không biết | Smoke test `create → generate → validate → build` trong CI |

## 3. Đề xuất kiến trúc CLI tương tác

### 3.1. Nguyên tắc

1. **Zero-dependency**: dùng `node:readline/promises` sẵn có, không thêm `inquirer`/`prompts`. CLI hiện đã zero-dependency; giữ nguyên.
2. **Một nguồn sự thật**: mọi câu trả lời ghi vào `plugin.json` và file sinh ra; không lưu state riêng.
3. **Idempotent**: chạy lại `generate` trên plugin đã có phải đọc manifest/migration hiện tại, không ghi đè nếu không có `--force`.
4. **Tách phần hỏi và phần sinh mã**: `prompt` trả về một `EntityDraft`/`PluginDraft`; generator thuần nhận draft và sinh file. Dễ test, dễ thêm chế độ `--answers`.
5. **Không hỏi thứ có thể suy ra**: table name, package, permission code, migration version tự sinh từ id/entity; chỉ hỏi khi có nhiều lựa chọn thật.

### 3.2. Luồng wizard đề xuất

```text
$ npx @open-erp/cli
? Bạn muốn làm gì?
  1) Tạo plugin mới
  2) Thêm entity vào plugin hiện tại
  3) Thêm field/validator
  4) Thêm quan hệ entity
  5) Sinh màn CRUD
  6) Validate plugin
  7) Chạy dev
  8) Đóng gói
```

**Nhánh 1 — Tạo plugin**

```text
? Plugin ID (kebab-case): in-app-notification
? Tên hiển thị: In-app Notification
? Mô tả ngắn: Thông báo trong ứng dụng
? Nền tảng: [x] Desktop  [ ] Mobile
? Có web UI? (Y/n)
? Kiểu đóng gói: Image registry / JAR bundle
? Storage scope mặc định: TENANT / CORE
? Tạo entity đầu tiên ngay? (Y/n)
```

**Nhánh 2 — Thêm entity**

```text
? Tên entity (PascalCase): Notification
? Bảng (mặc định plg_in_app_notification_notifications): <enter>
? Storage scope: TENANT / CORE
? Thêm field? (Y/n)
  ? Tên field: title
  ? Kiểu: string / text / int / decimal / bool / date / datetime / enum / json / uuid / reference
  ? Bắt buộc? (Y/n)
  ? Unique? (y/N)
  ? Validator: none / min / max / pattern / email / enum
? Thêm quan hệ? (Y/n)
  ? Tên quan hệ: recipient
  ? Đích: Core / plugin khác
    - Core: user, tenant, role...
    - Plugin khác: catalog.CatalogItem...
  ? Cardinality: many-to-one / one-to-many / many-to-many
  ? Field hiển thị: full_name / name / code
  ? Bắt buộc? (Y/n)
? Sinh màn CRUD? (Y/n)
  ? Cột danh sách: code, title, status, created_at
  ? Bộ lọc: status, created_at
  ? Quyền: <plugin>:notification:read / create / update / delete
```

**Nhánh 3 — Sinh CRUD**

```text
? Entity: Notification
? Kiểu màn hình: danh sách + drawer tạo/sửa / split-view
? Cột danh sách: [chọn]
? Trường form: [chọn]
? Có import/export? (y/N)
? Có xoá mềm? (Y/n)
```

### 3.3. Artifact sinh ra

| Artifact | Nội dung | Ghi chú |
| :--- | :--- | :--- |
| `plugin.json` | id, version, platforms, permissions, entities, relations, queries, migrations, ui_manifest | Nguồn sự thật duy nhất |
| `src/main/java/.../model/<Entity>.java` | POJO + field + enum | Không annotation JPA |
| `src/main/java/.../dto/<Entity>Dto.java` | Request/response DTO | 4 khuôn mẫu response |
| `src/main/java/.../service/<Entity>Service.java` | Nghiệp vụ + `PluginDataClient` | Nếu chọn sinh service |
| `src/main/java/.../resource/<Entity>Resource.java` | REST endpoint hoặc stub 501 | Nếu chọn sinh resource |
| `src/main/java/.../query/<Entity>Queries.java` | Query descriptor builder | Nếu dùng descriptor |
| `migrations/V<x.y.z>__create_<entity>.sql` | DDL schema tenant | Không `tenant_id`; idempotent |
| `web/src/app/features/<entity>/...` | List/form/drawer hoặc descriptor CRUD | Tùy Q7 |
| `web/public/i18n/{vi,en}.json` | Key nhãn/field/lỗi | Bắt buộc i18n |
| `plugin.json.ui_manifest` | Screen + contribution + CRUD descriptor | Nếu có UI |

### 3.4. Mô hình field & validator đề xuất

| Loại | Java | SQL | Validator mặc định |
| :--- | :--- | :--- | :--- |
| `string` | `String` | `VARCHAR(n)` | `required`, `minLength`, `maxLength`, `pattern` |
| `text` | `String` | `TEXT` | `required`, `maxLength` |
| `int` | `Integer`/`Long` | `INTEGER`/`BIGINT` | `min`, `max` |
| `decimal` | `BigDecimal` | `NUMERIC(18,4)` | `min`, `max`, `scale` |
| `bool` | `Boolean` | `BOOLEAN` | — |
| `date` | `LocalDate` | `DATE` | `min`, `max` |
| `datetime` | `Instant` | `TIMESTAMPTZ` | `min`, `max` |
| `enum` | `Java enum` | `VARCHAR` + check | `values` bắt buộc |
| `json` | `JsonNode`/`Map` | `JSONB` | `schema` tùy chọn |
| `uuid` | `UUID` | `UUID` | — |
| `reference` | `UUID` + display text | `UUID` (soft ref) | `target`, `required` |

**Quy tắc:** validator khai báo trong `plugin.json` để Core/CLI/UI cùng đọc; không chỉ nằm trong code. Backend vẫn phải validate lại (trust boundary).

### 3.5. Quan hệ entity (Q9 đã chốt: FK cùng plugin + soft ref xuyên plugin)

```json
{
  "relations": [
    {
      "name": "category",
      "type": "MANY_TO_ONE",
      "target": "self.ProductCategory",
      "storage": "FK",
      "on_delete": "RESTRICT"
    },
    {
      "name": "recipient",
      "type": "MANY_TO_ONE",
      "target": "core.user",
      "storage": "SOFT_REF",
      "target_display_field": "full_name",
      "required": true,
      "on_delete": "RESTRICT"
    },
    {
      "name": "catalog_item",
      "type": "MANY_TO_ONE",
      "target": "plugin:catalog.CatalogItem",
      "storage": "SOFT_REF",
      "target_display_field": "name",
      "required": false,
      "on_delete": "SET_NULL"
    }
  ]
}
```

| Loại target | Cách lưu | Ràng buộc |
| :--- | :--- | :--- |
| Entity cùng plugin | `target_id` + FK trong schema plugin | FK DB thật; `on_delete` do migration quyết định |
| Entity Core | `target_id` + `target_text` (snapshot) | Không FK; validate qua Entity Registry/API khi ghi |
| Entity plugin khác | `target_id` + `target_text` (snapshot) | Không FK; validate qua Entity Registry/API khi ghi |

- CLI sinh migration có FK cho quan hệ cùng plugin; sinh cột `*_id` + `*_text` cho soft ref.
- Core/plugin đích đăng ký entity + public fields trong Entity Registry; CLI validate target tồn tại (`--core-url`).
- Soft ref kiểm tra tồn tại khi ghi; `target_text` giữ hiển thị ổn định khi target đổi tên.
- `on_delete` của soft ref là hành vi nghiệp vụ (RESTRICT/SET_NULL/NO_ACTION), không phải FK DB.

### 3.6. CRUD: sinh mã Angular + Java (Q7/Q8 đã chốt)

**Quyết định:** sinh mã cho từng entity, không dùng renderer metadata.

| Tầng | File sinh ra | Nội dung |
| :--- | :--- | :--- |
| Backend | `<Entity>Dto.java`, `<Entity>Service.java`, `<Entity>Resource.java`, query descriptor | CRUD qua `PluginDataClient`; 4 khuôn mẫu response; permission theo entity |
| Web | `<entity>-list.component.{ts,html}`, `<entity>-form-drawer.component.{ts,html}`, `<entity>.service.ts`, route, i18n | List + drawer tạo/sửa; filter/sort/pagination theo `DataTable` dùng chung; không modal |
| Manifest | `entities[]`, `permissions[]`, `queries[]`, `ui_manifest.screens[]`/`crud[]` | `crud[]` giữ metadata cột/filter để validate và tái sinh |

**Quy ước sinh mã:**

- Idempotent: nếu file tồn tại, dừng và yêu cầu `--force`; không merge tự động vào file người dùng đã sửa.
- `--dry-run` in danh sách file; `--force` ghi đè có xác nhận.
- Sinh kèm test backend tối thiểu (list/create) trên PostgreSQL/Redis thật; frontend không sinh `.spec.ts`.
- Mọi chuỗi hiển thị dùng i18n key; field label suy từ tên field + dictionary.
- CRUD desktop là bắt buộc; mobile CRUD không bắt buộc trong S06 (Q14).

> Khối lượng code và QA tăng so với renderer metadata; bù lại màn hình có thể tuỳ biến trực tiếp.

### 3.7. Validate (Q16 đã chốt: offline + `--core-url` tùy chọn)

| Lớp | Kiểm tra | Nguồn |
| :--- | :--- | :--- |
| Manifest | schema, id, version, permission pattern, entity trùng, render_mode | Offline (bundled JSON schema) |
| Field | type hợp lệ, enum có values, default đúng kiểu, validator khớp type | Offline |
| Relation | target syntax `core.*`/`plugin:*.*`, cardinality hợp lệ, target_display_field | Offline + `--core-url` |
| Slot | slot_code tồn tại, render_mode nằm trong `allowed_render_modes`, contract_version khớp | `--core-url` hoặc snapshot registry |
| Migration | file tồn tại, SHA-256 khớp manifest, thứ tự version | Offline |
| UI | screen route không trùng, contribution entry tồn tại trong bundle | Offline + build |

**Đã chốt:** mặc định validate offline (không cần Core chạy); thêm `--core-url` để kiểm tra Entity Registry/UI Slot Registry khi developer có Core dev. Không bắt buộc mạng cho CI.

### 3.8. Template bundle & nâng cấp (Q11 đã chốt: migrate toàn bộ plugin cũ)

- Ghi `template_version: 2.0.0` vào `plugin.json`.
- `create` mới dùng template 2.0.0.
- **Migrate toàn bộ plugin cũ** (hiện có `catalog`) sang template 2.0 trong Sprint 06: cập nhật cấu trúc web, contribution entry, bỏ iframe, đồng bộ `plugin.json`/migration checksum.
- Cung cấp `open-erp-cli upgrade --check` để so sánh template và `--apply` có xác nhận; không tự động ghi đè file người dùng đã sửa.
- `catalog` đã zero-DB nhưng **phải chuyển UI iframe sang MF/WC** theo Q2/Q13.

## 4. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Template mới vẫn lệch runtime | High | Smoke test `create → validate → mvn package → dev` trong CI; so sánh với `plugins/catalog` |
| CLI sinh mã phá manifest | High | Generator idempotent + `--dry-run` + backup/`--force`; test Node cho từng nhánh |
| Sinh mã Angular/Java nhiều file, dễ lệch template | High | Template test CI; generator idempotent; `--dry-run`; review mẫu; test build từng nhánh |
| Quan hệ soft ref không đảm bảo toàn vẹn | Medium | Validate khi ghi + hiển thị snapshot; FK cho quan hệ cùng plugin |
| Wizard quá dài gây mệt | Medium | Default thông minh, chỉ hỏi phần thiếu; cho phép `--non-interactive` |
| Plugin cũ bị ảnh hưởng | High | Migrate có kế hoạch/rollback; version hóa template; QA hồi quy catalog |

## 5. Câu hỏi đã chốt tại CONF

| # | Câu hỏi | Đề xuất | **Chốt** |
| :--- | :--- | :--- | :--- |
| Q1 | Gói cả 3 luồng trong Sprint 06? | Có | **Có** |
| Q6 | Wizard chạy thế nào? | Bare command + `--interactive` | **A — bare wizard + `--interactive`** |
| Q7 | CRUD renderer metadata / sinh mã / hybrid? | Hybrid C | **B — sinh mã Angular** |
| Q8 | Backend CRUD dùng chung hay sinh riêng? | Dùng chung + descriptor | **B — sinh Java service/resource từng entity** |
| Q9 | Quan hệ entity: soft ref hay FK? | Soft ref + Entity Registry | **B — FK cùng plugin + soft ref xuyên plugin** |
| Q10 | Field type/validator v1 gồm những gì? | Bảng §3.4 | **Bảng §3.4** |
| Q11 | Có migrate plugin cũ/catalog không? | Không bắt buộc | **B — migrate toàn bộ** |
| Q12 | Validate offline hay cần Core URL? | Offline + `--core-url` | **A — offline + `--core-url`** |
| Q16 | Có test CLI/template trong CI không? | Có | **Có** |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Phân tích hiện trạng template/CLI; đề xuất wizard, field/validator, relation, CRUD, validate; nêu rủi ro | BA Agent; RAW-S06-001 |
| 0.2 | 2026-10-29 | Cập nhật theo 16 câu trả lời: sinh mã Angular/Java, FK cùng plugin + soft ref, migrate toàn bộ plugin, validate offline + `--core-url` | BA Agent; CONF-S06-001 0.2 |
