# Entity Registry (Sổ Đăng Ký Thực Thể CSDL)

Tài liệu này mô tả cơ chế **Entity Registry** của nền tảng Open-ERP theo quy định tại `docs/system/architecture/SYSTEM_BLUEPRINT.md` mục 5.1.

---

## 1. Mục Đích

- Mọi entity CSDL của module/plugin (Core hoặc Plugin nghiệp vụ) **bắt buộc** phải đăng ký vào sổ đăng ký chung trước khi được plugin khác tham chiếu.
- Metadata đăng ký (tên entity, bảng vật lý, các trường public, quan hệ xuất ra ngoài) được lưu tập trung tại bảng PostgreSQL `sys_entity_registry`.
- Ngăn chặn truy cập chéo không kiểm soát vào cấu trúc dữ liệu nội bộ của module khác; chỉ các trường nằm trong `publicFields` mới được phép tham chiếu từ bên ngoài.

---

## 2. Cách Dùng Annotation `@RegisterEntity`

```java
@Entity
@Table(name = "users")
@RegisterEntity(
    entityName = "User",
    table = "users",
    publicFields = {"id", "email", "status", "email_verified_at", "created_at"},
    relations = {"users"}
)
public class User extends PanacheEntityBase { ... }
```

Các thuộc tính của `@RegisterEntity`:

| Thuộc Tính | Bắt Buộc | Mặc Định | Ý Nghĩa |
| :--- | :---: | :--- | :--- |
| `entityName` | Có | - | Tên định danh duy nhất của entity trong phạm vi plugin. |
| `table` | Có | - | Tên bảng vật lý (`users`, `tenants`, ...). |
| `pluginId` | Không | `core-iam` | Mã plugin sở hữu entity. |
| `storage` | Không | `postgres` | Loại lưu trữ (`postgres`, `mongodb`, ...). |
| `publicFields` | Không | `{}` | Danh sách trường được phép tham chiếu từ plugin khác. |
| `relations` | Không | `{}` | Danh sách entity/bảng có quan hệ xuất ra ngoài. |

`EntityRegistryService` quét Jandex index ngay khi ứng dụng khởi động (`StartupEvent`) và `UPSERT` metadata vào `sys_entity_registry` theo khóa duy nhất `(plugin_id, entity_name)` — nhờ đó chạy lại ứng dụng không sinh bản ghi trùng.

---

## 3. Bảng `sys_entity_registry`

Khởi tạo bởi migration `V1.0.2__entity_registry.sql`:

| Cột | Kiểu | Ý Nghĩa |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Khóa chính, sinh tự động. |
| `plugin_id` | VARCHAR(100) | Mã plugin sở hữu (ví dụ `core-iam`). |
| `entity_name` | VARCHAR(100) | Tên entity. |
| `storage_type` | VARCHAR(20) | Loại lưu trữ (`postgres`, `mongodb`). |
| `table_or_collection` | VARCHAR(100) | Bảng/collection vật lý. |
| `schema_definition` | JSONB | Metadata trường public (`{"fields": [...]}`). |
| `exported_relations` | JSONB | Danh sách quan hệ xuất ra ngoài. |
| `registered_at` | TIMESTAMPTZ | Thời điểm đăng ký. |
| - | UNIQUE | Ràng buộc `(plugin_id, entity_name)`. |

---

## 4. Danh Mục Đăng Ký

- Core IAM (plugin `core-iam`): [CORE_IAM_REGISTRY.md](CORE_IAM_REGISTRY.md) — 7 entity.
