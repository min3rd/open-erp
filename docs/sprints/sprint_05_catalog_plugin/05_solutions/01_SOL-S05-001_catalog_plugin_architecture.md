# [SOL-S05-001] Kiến trúc plugin core "Danh mục & quản trị danh mục"

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S05-001 / Giải pháp kiến trúc / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) (Pending), [ANL-S05-001](../02_analysis/01_ANL-S05-001_catalog_data_model_problems.md), [ANL-S05-002](../02_analysis/02_ANL-S05-002_admin_features_permissions_dynamic_forms.md), [BENCH-S05-001](../03_benchmarks/01_BENCH-S05-001_catalog_patterns_in_erp.md) |
| Đọc trước / đọc tiếp | CONF-S05-001 / [DES-DB-S05-001](../06_designs/db/01_DES-DB-S05-001_catalog_schema.md), [DES-API-S05-001](../06_designs/api/01_DES-API-S05-001_catalog_api.md), [DES-UI-S05-001](../06_designs/ui/01_DES-UI-S05-001_catalog_admin_ui.md) |

## 1. Mục đích

Chốt các quyết định kiến trúc cho plugin `catalog` trước khi viết thiết kế chi tiết (DB/API/UI) và phân rã task. Mọi quyết định dưới đây có nhãn: **Đã triển khai** (hạ tầng có sẵn), **Đề xuất** (chờ review), **Cần khách chốt**.

## 2. Quyết định kiến trúc

| # | Quyết định | Lý do | Trạng thái |
| :--- | :--- | :--- | :--- |
| **D1** | Plugin `catalog` là **core plugin chạy in-process** trong backend monolith (module `modules/catalog`), không đóng gói JAR/container riêng | Core plugin đi kèm nền tảng như plugin `core` hiện tại; cơ chế đóng gói/MF của Sprint 03 dành cho plugin bên thứ ba. Module vẫn tách package/entity/API để có thể tách ra sau này | Đề xuất |
| **D2** | Quan hệ cha–con lưu bằng **bảng cạnh tường minh** `catalog_item_edges(parent, child, relation_type, valid_from, valid_to)`; `catalog_items` **không** có `parent_id` | Hỗ trợ đa cha (R3) + nhảy cấp (R2); quan hệ có thuộc tính riêng (loại, thứ tự, hiệu lực) | Đề xuất (ANL-S05-001 §2–3) |
| **D3** | `relation_type` là enum: `HIERARCHY`, `CLASSIFICATION`, `ALLOCATION`, `CUSTOM`; **cha có thể khác loại** với con (JOB ⊂ INDUSTRY), giới hạn bằng `allowed_parent_types` của loại con | Phân biệt "công việc ⊂ ngành" và "công việc ⊂ phân bổ" (AC-04); cho phép quan hệ liên loại theo yêu cầu | Đề xuất (bổ sung sau BENCH-S05-001) |
| **D4** | **Chống chu trình** bằng truy vấn đệ quy khi thêm cạnh; lỗi `CATALOG_EDGE_CYCLE` | DAG cấm chu trình (AC-05) | Đề xuất |
| **D5** | **Version + hiệu lực**: mỗi bản ghi danh mục có `version_group_id`, `version`, `valid_from`, `valid_to`; sửa = tạo phiên bản mới + đóng bản cũ. Không dùng bitemporal đầy đủ | Đủ R4, rẻ hơn bitemporal | Đề xuất (ANL §4) |
| **D6** | Ràng buộc **EXCLUDE USING gist** (`tstzrange`) cho `(tenant, type, code)` và cho cạnh trùng | Chặn chồng lấn ở tầng CSDL thay vì code (AC-07) | Đề xuất (cần `btree_gist`) |
| **D7** | **Xoá = đóng hiệu lực** (`valid_to = now()`), không xoá cứng | Không phá tham chiếu nghiệp vụ; giữ lịch sử (AC-08) | Đề xuất |
| **D8** | Truy vấn cây v1 dùng **recursive CTE** + index `(parent_item_id)`, `(child_item_id)`; **closure table** là phương án dự phòng khi có số đo | YAGNI: không thêm bảng bảo trì khi chưa đo | Đề xuất (ANL §3) |
| **D9** | **Hai tầng phân quyền**: quyền module (`catalog:type:manage`, `catalog:item:read/manage`, `catalog:item:inline-create`) + grant theo loại (`catalog_type_grants`) | Đúng yêu cầu R5; không dùng data-scope cho v1 | Đề xuất |
| **D10** | Danh mục **hệ thống** (`tenant_id IS NULL`) vs **tenant**; hợp nhất options theo `code`, **tenant thắng** (kể cả ẩn cục bộ) | Một nguồn seed chung + cho phép ghi đè/ẩn cục bộ | **Đã chốt (khách Q1/Q2)** |
| **D11** | "Phòng ban" là **danh mục riêng của plugin** (khách chốt Q3 2026-10-06); seed **một chiều** từ `departments` khi cài/backfill; cây tổ chức vẫn là nguồn cấu trúc | Theo yêu cầu R7 (cho nhập tự do); giảm thiểu lệch dữ liệu bằng seed một chiều + ghi rõ vai trò từng nguồn | **Đã chốt (khách)** |
| **D12** | Trường danh mục trong form lưu `{catalog_item_id, text}`; `text` luôn giữ để hiển thị ổn định | Hỗ trợ autocomplete **hoặc** nhập tự do (R7, AC-12) | Đề xuất |
| **D13** | API form động gồm 4 nhóm: **schema / options (lazy, phân trang) / resolve theo lô / inline-create**; options gộp tenant + hệ thống | Đúng R6; tránh N+1 và tải cả danh mục | Đề xuất |
| **D14** | Plugin **always-on**: khai báo definition core trong `PluginCatalogService` + seed `plugin_catalog (is_core, default_install, locked)` + **backfill** tenant cũ + dùng hook `PluginProvisioningService.provisionDefaults` cho tenant mới | Tận dụng hạ tầng Sprint 03, không viết cơ chế mới | Đã triển khai (hook) + Đề xuất (seed/backfill) |
| **D15** | Đăng ký **Entity Registry** cho `CatalogType`, `CatalogItem`, `CatalogItemEdge`; manifest khai báo **ma trận Desktop/Mobile** (CRUD = Desktop, tra cứu = cả hai) | Ràng buộc dự án (AC-16) | Đề xuất |
| **D16** | UI: màn quản trị trong Settings (Desktop, Drawer/Router — **không modal**); trường danh mục là **component dùng chung** `@shared` cho Web + Mobile | Quy chuẩn UI/UX + tái sử dụng (AC-17) | Đề xuất |
| **D17** | **Import/Export CSV + `.xlsx`** nằm trong Sprint 5 (khách chốt Q7, N3): import theo `code` (tạo/cập nhật + tạo quan hệ qua `parent_code`), export theo loại kèm cha/con + hiệu lực; validate toàn tệp trước khi ghi, giới hạn 20.000 dòng (cấu hình được) | Yêu cầu mới của khách; giữ an toàn dữ liệu bằng validate + báo cáo lỗi | **Đã chốt (khách)** |
| **D18** | **Tenant ghi đè/ẩn danh mục hệ thống** theo `code` (khách chốt Q1/Q2): bản ghi tenant thắng khi hợp nhất; ẩn = bản ghi tenant `status = INACTIVE` cùng `code` | Đáp ứng yêu cầu; UI đánh dấu "ghi đè" để không nhầm | **Đã chốt (khách)** |
| **D19** | Import `.xlsx` đọc bằng **Apache POI (`poi-ooxml`)** ở backend — **ngoại lệ thư viện có kiểm soát** (chuẩn Java, không thay thế được bằng stdlib; chỉ dùng ở luồng import) | Khách chốt N3 = "CSV + .xlsx ngay", N7 = Apache POI | **Đã chốt (khách)** |
| **D20** | Seed **dữ liệu địa giới thật 2 cấp tỉnh→xã** từ tệp CSV commit trong repo (`db/seed/provinces-communes.csv`), sinh **một lần** ở dev-time từ `provinces.open-api.vn` (nguồn/ngày ghi ở header), **không** gọi API ngoài lúc chạy; cạnh trực tiếp tỉnh→xã | Khách chốt N2 + N6 | **Đã chốt (khách)** |
| **D21** | **Màn quản trị danh mục hệ thống** trong cổng Platform (super admin), dùng lại UI quản trị với cờ "hệ thống" | Khách chốt N5 | **Đã chốt (khách)** |

## 3. Thành phần

```
Backend (modules/catalog)
├── model/        CatalogType, CatalogItem, CatalogItemEdge, CatalogTypeGrant
├── repository/   truy vấn + recursive CTE (tổ tiên/con cháu, kiểm tra chu trình)
├── service/      CatalogTypeService, CatalogItemService (version/effective),
│                 CatalogEdgeService (DAG + cycle), CatalogLookupService (options/resolve),
│                 CatalogGrantService, CatalogSeedService (danh mục cố định)
├── resource/     CatalogAdminResource (CRUD, quyền), CatalogLookupResource (form động),
│                 CatalogTypeResource (loại + grant)
└── api/          CatalogErrorCode, CatalogResponseKey (enum dùng chung)

Frontend
├── shared/components/catalog-picker/   trường autocomplete + nhập tự do (Web + Mobile)
├── shared/models/catalog.model.ts      CatalogItemRef {catalog_item_id, text}, CatalogTypeSchema
└── web/features/settings/catalog/      danh sách (cây/đa cha), form sửa, quan hệ, quyền theo loại

DB (migration V4.0.0)
└── catalog_types, catalog_items, catalog_item_edges, catalog_type_grants, seed loại + danh mục cố định
```

## 4. Luồng chính

**L1 — Options cho form động (lazy)**
`form renderer` → `GET /catalog/types/{code}/options?q=&parent_id=&as_of=&page=&size=` → service lọc `(tenant_id = current OR tenant_id IS NULL)` + hiệu lực `as_of` → hợp nhất theo `code` (tenant thắng) → phân trang → trả `items[]` + `total_items`. Client cache theo khóa `(type, parent, q, as_of)`.

**L2 — Thêm quan hệ đa cha (có kiểm tra chu trình)**
`POST /catalog/edges {parent, child, relation_type}` → kiểm tra child không là tổ tiên của parent (recursive CTE) → chèn cạnh với `valid_from` → trả `code = CATALOG_EDGE_CREATED_SUCCESS`; nếu chu trình → `400 CATALOG_EDGE_CYCLE`.

**L3 — Sửa danh mục (tạo phiên bản)**
`PUT /catalog/items/{id}` → đóng `valid_to` của bản ghi hiện tại → tạo bản ghi mới cùng `version_group_id`, `version + 1`, `valid_from = now()` → ghi audit → trả về phiên bản mới. `GET /catalog/items/{id}/versions` trả lịch sử.

**L4 — Tenant đăng ký mới**
`AuthService.register…` → `PluginProvisioningService.provisionDefaults(tenantId)` (hook có sẵn) → cài `catalog` (locked) → `CatalogSeedService` seed danh mục cố định cho tenant → tenant dùng ngay.

## 5. Phi chức năng

| Yêu cầu | Cách đáp ứng |
| :--- | :--- |
| Cách ly tenant | Mọi truy vấn lọc `tenant_id` từ context đã xác thực; danh mục hệ thống chỉ đọc; test riêng cho rò rỉ chéo (AC-15) |
| Hiệu năng options | Phân trang mặc định 20/tối đa 100; index `(type_id, tenant_id, code)`, index trigram cho `name`; debounce phía client |
| Audit | Dùng `AuditTrail` cho mọi mutation (tạo/sửa/gỡ cạnh, đổi quyền loại) |
| Kiểm thử | JUnit + RestAssured trên PostgreSQL thật: DAG (đa cha, nhảy cấp, chu trình), version/as-of, chồng lấn, phân quyền 2 tầng, cách ly tenant |
| Không H2 | Ràng buộc EXCLUDE + recursive CTE chỉ có trên PostgreSQL — càng đúng với chính sách "no H2" |

## 6. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| DAG + version sai logic (chu trình, mồ côi, chồng lấn) | High | Test case riêng cho từng AC-01…AC-08; ràng buộc ở CSDL thay vì chỉ code |
| `btree_gist` không có trên môi trường | Medium | Migration tạo extension (`CREATE EXTENSION IF NOT EXISTS btree_gist`); nếu bị chặn, fallback kiểm tra ở service + ghi rõ |
| Hiệu năng cây lớn | Medium | Đo bằng chính dữ liệu địa giới (3.321 mục + 3.321 cạnh tỉnh→xã) trước khi cân nhắc closure table |
| Trùng nguồn "Phòng ban" | High | Chốt Q3 trước khi code (D11) |
| Phạm vi phình | Medium | Danh sách ngoài phạm vi v1 đã chốt ở CONF §1 |

## 7. Việc bước 6 phải đặc tả

1. DDL đầy đủ: cột, kiểu, index, ràng buộc EXCLUDE, `btree_gist`, seed loại + danh mục cố định.
2. Danh sách endpoint đầy đủ (request/response/error code) theo 4 khuôn mẫu phản hồi.
3. UI: bố cục màn quản trị (cây/đa cha, drawer sửa, quản trị quan hệ, quyền theo loại) + component `catalog-picker` cho form.
4. Contract `CatalogItemRef` dùng chung Web/Mobile + quy tắc i18n (nhãn loại, thông báo lỗi theo `code`).

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp 16 quyết định kiến trúc | Architect; chưa review |
