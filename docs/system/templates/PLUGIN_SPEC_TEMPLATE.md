# Đặc Tả Kỹ Thuật Plugin: [Tên Plugin]

- **Mã Plugin (ID)**: `open-erp-<module-name>`
- **Phiên bản thiết kế**: `v1.0.0`
- **Backend**: Quarkus (Java / Kotlin)
- **Frontend**: Angular >= 22 (Web) / Ionic + Angular (Mobile)
- **Phụ trách thiết kế**: Solution Architect Agent
- **Tài liệu căn cứ**: [Biên bản xác nhận yêu cầu](../../sprints/sprint_XX_<tên>/04_confirmation/)

---

## 1. Phân Định Chức Năng Nền Tảng (Desktop vs. Mobile)

### 1.1. Chức Năng Hỗ Trợ Trên Web Desktop (Angular >= 22 + Tailwind 4)
> Đầy đủ chức năng quản trị, báo cáo, nhập liệu nâng cao và đối soát.

- [x] Tính năng Desktop 1: [Mô tả chi tiết]
- [x] Tính năng Desktop 2: [Mô tả chi tiết]

### 1.2. Chức Năng Hỗ Trợ Trên Mobile App (Ionic + Angular)
> Tối giản, tập trung thao tác nhanh, hiện trường, phê duyệt.

- [x] Tính năng Mobile 1: [Mô tả chi tiết]
- [ ] Các tính năng không đưa lên mobile: [Lý do không đưa]

---

## 2. Đặc Tả Thành Phần Giao Diện & Thư Viện Dùng Chung (Shared UI Library)
> **Quy tắc Component-First**: Nếu cần component mới, phải liệt kê để xây dựng trong `shared-ui-lib` trước.

- **Các component có sẵn tái sử dụng**:
  - `shared-button`, `shared-data-table`, `shared-modal`...
- **Các component mới cần thêm vào `shared-ui-lib`**:
  - [ ] `shared-<new-component-name>`: [Mô tả input/output, style Tailwind 4]

---

## 3. Đặc Tả Manifest (`plugin.json`)
```json
{
  "id": "open-erp-<module-name>",
  "name": "Tên Plugin Hiển Thị",
  "version": "1.0.0",
  "description": "Mô tả ngắn gọn về plugin",
  "author": "Open-ERP Team",
  "core_version_compatibility": ">=1.0.0",
  "dependencies": {},
  "platforms": {
    "desktop": {
      "supported": true,
      "routes": { "api_prefix": "/api/v1/<module>", "ui_entry": "/apps/<module>" },
      "features": ["<feature_desktop_1>", "<feature_desktop_2>"]
    },
    "mobile": {
      "supported": true,
      "routes": { "api_prefix": "/api/v1/<module>/mobile", "ui_entry": "/mobile/<module>" },
      "features": ["<feature_mobile_1>"]
    }
  },
  "entities": [
    {
      "name": "<EntityName>",
      "storage": "postgres",
      "table": "<table_name>",
      "public_fields": ["id", "code", "name", "status", "created_at"],
      "relations": []
    }
  ],
  "kafka_events": {
    "publishes": ["erp.<module>.<event-created>"],
    "subscribes": []
  },
  "permissions": [
    { "code": "<module>:view", "name": "Xem dữ liệu <module>" },
    { "code": "<module>:manage", "name": "Quản lý dữ liệu <module>" }
  ]
}
```

---

## 4. Thiết Kế Cơ Sở Dữ Liệu & Khai Báo Thực Thể (Entity Registry)

### 4.1. Danh Sách Thực Thể & Phân Bổ CSDL
| Thực Thể (Entity) | CSDL (Storage) | Bảng / Collection | Mục Đích Lưu Trữ | RLS Tenant |
| :--- | :--- | :--- | :--- | :--- |
| `<EntityName>` | PostgreSQL | `<module>_entities` | Dữ liệu giao dịch có cấu trúc | Có (`tenant_id`) |
| `<EntityLog>` | MongoDB | `<module>_logs` | Audit trail / lịch sử thao tác | Có (`tenant_id`) |

### 4.2. Khai Báo Đăng Ký Thực Thể (Entity Registry Metadata)
- **Tên thực thể**: `<EntityName>`
- **Plugin sở hữu**: `open-erp-<module-name>`
- **Khóa chính**: `id` (UUID)
- **Các trường công khai cho Plugin khác tham chiếu**: `code`, `name`, `status`
- **Điểm neo quan hệ (Extension Points)**: Cho phép Plugin khác liên kết qua `ref_id`.

### 4.3. Kịch Bản Migration Dữ Liệu
- **File UP**: `migrations/0001_initial_<module>.up.sql`
- **File DOWN**: `migrations/0001_initial_<module>.down.sql`

---

## 5. Truyền Thông Sự Kiện Apache Kafka & Caching Redis

### 5.1. Kafka Topics
| Tên Topic | Hướng | Dữ Liệu Đính Kèm (Payload) | Khi Nào Phát Sinh? |
| :--- | :--- | :--- | :--- |
| `erp.<module>.<event-name>` | Publish | `{ "tenant_id": "...", "entity_id": "..." }` | Khi tạo mới bản ghi |

### 5.2. Redis Caching
- **Key Pattern**: `tenant:{tenant_id}:<module>:{id}`
- **TTL**: 3600s
- **Chiến lược xóa cache (Invalidation)**: Xóa khi có thao tác Update/Delete.

---

## 6. Đặc Tả API Endpoints (Quarkus REST)
- Base URL: `/api/v1/<module>`

| Method | Endpoint | Hỗ Trợ | Quyền Hạn | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/<module>/items` | Desktop & Mobile | `<module>:view` | Danh sách bản ghi |
| `POST` | `/api/v1/<module>/items` | Desktop Only | `<module>:manage` | Tạo mới bản ghi |

---

## 7. Kế Hoạch Sao Lưu Khi Gỡ Bỏ (Safe Uninstall)
- Bảng cần snapshot backup: `<module>_entities` (Postgres) và `<module>_logs` (Mongo).
- Định dạng xuất: JSON nén vào lưu trữ đám mây của Tenant trước khi dọn dẹp schema.
