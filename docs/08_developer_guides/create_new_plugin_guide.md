# Hướng Dẫn Xây Dựng Một Plugin Mới (Plugin Development Guide)

Tài liệu này hướng dẫn chi tiết quy trình từ A-Z để phát triển một Plugin nghiệp vụ mới độc lập trong hệ sinh thái `open-erp`.

---

## 1. Cấu Trúc Thư Mục Một Plugin Mẫu
Mỗi Plugin nằm trong thư mục `plugins/<plugin-id>/` hoặc một sub-project riêng:
```
plugins/open-erp-sales/
├── plugin.json                 # Manifest khai báo thông tin, platform, entity, permissions
├── pom.xml                     # Maven project cho Quarkus backend service
├── src/
│   ├── main/java/com/openerp/sales/
│   └── main/resources/
│       └── application.properties
├── migrations/                 # Script CSDL theo từng Tenant
│   ├── 0001_initial_schema.up.sql
│   └── 0001_initial_schema.down.sql
└── web/                        # Giao diện Angular micro-frontend (nếu có)
```

---

## 2. Các Bước Thực Hiện Chi Tiết

### Bước 1: Khởi Tạo File Manifest `plugin.json`
Định nghĩa thông tin Plugin, phiên bản SemVer, phân định tính năng Desktop vs Mobile và các Entity công bố:
```json
{
  "id": "open-erp-sales",
  "name": "Quản Lý Bán Hàng",
  "version": "1.0.0",
  "platforms": {
    "desktop": { "supported": true, "features": ["order_list", "create_order", "export_report"] },
    "mobile": { "supported": true, "features": ["order_list", "quick_approval"] }
  },
  "entities": [
    {
      "name": "SaleOrder",
      "storage": "postgres",
      "table": "sales_orders",
      "public_fields": ["id", "code", "total_amount", "status"]
    }
  ]
}
```

### Bước 2: Viết Script Migration Dữ Liệu
Tạo file `migrations/0001_initial_schema.up.sql`:
```sql
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    total_amount NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kích hoạt Row-Level Security
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_orders
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

### Bước 3: Đăng Ký Entity Vào Entity Registry
Trong mã nguồn Java Quarkus:
```java
@Entity
@Table(name = "sales_orders")
@RegisterEntity(name = "SaleOrder", storage = StorageType.POSTGRESQL)
public class SaleOrder extends PanacheEntityBase {
    @Id
    @GeneratedValue
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    public String code;
    public BigDecimal totalAmount;
    public String status;
}
```

### Bước 4: Viết REST API & Kafka Event
- Expose các endpoint bắt đầu bằng prefix `/api/v1/sales`.
- Bắn Kafka message khi đơn hàng được tạo để các Plugin khác (như Kho/Kế toán) lắng nghe:
```java
@Inject
@Channel("sales-events")
Emitter<OrderCreatedEvent> orderCreatedEmitter;

public void createOrder(OrderDTO dto) {
    // Lưu DB
    // Phát sự kiện Kafka
    orderCreatedEmitter.send(new OrderCreatedEvent(order.id, order.tenantId));
}
```
