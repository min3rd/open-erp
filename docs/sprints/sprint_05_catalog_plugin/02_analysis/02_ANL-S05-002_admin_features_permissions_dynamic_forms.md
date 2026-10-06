# [ANL-S05-002] Phân tích chức năng quản trị, phân quyền theo loại, API form động & danh mục cố định

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S05-002 / Phân tích / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S05-001](../01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) (R5–R8) |
| Đọc trước / đọc tiếp | [ANL-S05-001](01_ANL-S05-001_catalog_data_model_problems.md) / [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) |

## 1. Mục đích

Chốt **phạm vi chức năng** của plugin (R5–R8): quản trị CRUD, mô hình phân quyền hai tầng, hợp đồng API cho form động, danh mục cố định cho doanh nghiệp và cơ chế "luôn bật, cài cho mọi tenant".

## 2. R5 — CRUD & phân quyền theo **từng loại danh mục**

Yêu cầu "quản trị phân quyền chức năng, dữ liệu cho từng loại danh mục" ⇒ phân quyền **hai tầng**, không chỉ một:

| Tầng | Câu hỏi trả lời | Cơ chế đề xuất |
| :--- | :--- | :--- |
| **Chức năng (module)** | Người này có được dùng module danh mục không? | Quyền hệ thống: `catalog:type:manage`, `catalog:item:read`, `catalog:item:manage`, `catalog:item:inline-create` (đúng chuẩn `resource:action` hiện có) |
| **Dữ liệu theo loại** | Với loại **Chức danh** thì vai trò nào được xem/sửa? | Bảng `catalog_type_grants (type_id, role_id, can_read, can_write)` — gán theo vai trò trong tenant |

Quy tắc hiệu lực: **cần cả hai** — có quyền module **và** có grant trên loại đó (trừ platform admin với loại hệ thống). Điều này cho phép ví dụ: nhân sự được sửa *Chức danh* nhưng chỉ được **xem** *Ngành*.

Bổ sung cần khách chốt: có cần tái dùng `role_data_policies` (ALL/TENANT/BRANCH/DEPARTMENT/OWN_ONLY) cho danh mục không? Danh mục thường ở cấp tenant ⇒ đề xuất **không** dùng data-scope cho v1, chỉ grant theo loại (đơn giản, đủ dùng).

## 3. R6 — API cho **form động** (lazy load)

Form động cần 4 nhóm API (chi tiết contract ở `06_designs/api/`):

| Nhóm | Mục đích | Đặc điểm bắt buộc |
| :--- | :--- | :--- |
| **Schema loại danh mục** | Form renderer biết trường nào, nhãn i18n nào, có cho nhập tự do không, có phụ thuộc cha không | Trả `name_key`, `allow_free_text`, `parent_type_code?`, `attributes_schema` |
| **Options (lazy)** | Autocomplete/select tải dần | Phân trang `page/size`, tìm theo `q` (code/name), lọc `parent_id` (phụ thuộc), `as_of`, gộp **tenant + hệ thống** |
| **Resolve theo id** | Hiển thị lại form đã lưu (chỉ có id) | Nhận mảng id → trả item; không lộ dữ liệu tenant khác |
| **Inline create** | Người dùng nhập tự do rồi lưu thành mục mới | Quyền riêng `catalog:item:inline-create`; chống trùng theo `code`/`name`; có thể chỉ trả về giá trị text nếu khách chọn "không tạo mục" |

**Giá trị của một trường form** (để hỗ trợ "autocomplete **hoặc** nhập tự do"):

```
{ "catalog_item_id": "<uuid|null>", "text": "<chuỗi tự do|null>" }
```

- Chọn từ danh mục ⇒ có `catalog_item_id`, `text` = tên tại thời điểm chọn (giữ để hiển thị khi bản ghi danh mục đổi tên).
- Nhập tự do ⇒ chỉ có `text`.
- Bắt buộc ít nhất một trong hai (ràng buộc ở tầng validate form).

**Hiệu năng**: options phải **không** trả toàn bộ danh mục (tỉnh/huyện/xã ~11k dòng); mặc định `size=20`, tối đa 100; cache phía client theo khóa `(type, parent, q, as_of)`; debounce 250ms.

## 4. R7 — Danh mục cố định cho doanh nghiệp

| Danh mục | Loại | Nguồn dữ liệu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Chức danh** | Tenant, versioned | Seed sẵn vài giá trị phổ biến | Autocomplete + nhập tự do |
| **Phòng ban** | **Cầu nối** sang module tổ chức | Bảng `departments` hiện có | ⚠️ Xem phân tích dưới |
| Loại hợp đồng, Ca làm việc, Trình độ học vấn | Tenant | Seed sẵn | Đề xuất thêm cho đủ dùng (khách chốt) |

### 4.1. Xung đột cần chốt: "Phòng ban" đã tồn tại ở Core IAM

Module tổ chức (Sprint 01/02) đã có `branches`/`departments` (cây phòng ban thật, có trưởng phòng, gắn chi nhánh). Nếu plugin tạo **danh mục Phòng ban riêng** thì có **hai nguồn sự thật** → sai dữ liệu.

| Phương án | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| **A. Cầu nối (khuyến nghị)** | Loại danh mục `DEPARTMENT` là loại **system-backed**: options đọc từ `departments`, không có bảng riêng; cho phép nhập tự do khi phòng ban chưa có trong cây | Một nguồn sự thật; form vẫn autocomplete; đúng tinh thần R7 |
| B. Danh mục riêng | Plugin seed danh mục phòng ban độc lập | Trùng lặp, lệch dữ liệu — không nên |
| C. Chuyển hẳn cây phòng ban sang plugin | Bỏ `departments` khỏi Core | Phá vỡ Sprint 01/02, ngoài phạm vi Sprint 05 |

⇒ Đề xuất **A**, cần khách xác nhận (Q2 trong `04_confirmation/`).

## 5. R8 — Plugin "luôn bật", cài cho mọi tenant

Hạ tầng plugin đã có sẵn từ Sprint 03, nên **không cần cơ chế mới**, chỉ cần khai báo đúng:

| Cơ chế có sẵn | Dùng cho Sprint 05 |
| :--- | :--- |
| `plugin_catalog.is_core` | Đánh dấu plugin core (hiển thị riêng ở portal) |
| `plugin_catalog.default_install` + `locked` | Tenant mới tự nhận plugin; không gỡ được |
| `PluginProvisioningService.provisionDefaults(tenantId)` | Hook gọi khi tenant đăng ký — đã tồn tại, không phải viết lại |
| `tenant_plugins` | Bản ghi cài đặt theo tenant (trạng thái ACTIVE) |
| Migration backfill (như `V3.0.2__backfill_allowed_plugins.sql`) | Cấp quyền + cài cho **tenant đã tồn tại** |

Yêu cầu bổ sung cho plugin (theo ràng buộc dự án):

1. **Entity Registry**: đăng ký `CatalogType`, `CatalogItem`, `CatalogItemEdge` để plugin khác tham chiếu an toàn.
2. **Ma trận Desktop/Mobile**: quản trị CRUD = **Desktop**; tra cứu/autocomplete trong form = **cả hai**; khai báo trong manifest plugin.
3. **Gỡ cài đặt**: bị chặn với plugin `locked`/`is_core` (kiểm tra lại trong `PluginLifecycleService` khi triển khai).
4. **UI slot**: màn quản trị trong Settings (Desktop) + component trường danh mục dùng chung cho form (Web + Mobile).

## 6. Phạm vi đề xuất (để chuyển thành AC)

| Trong phạm vi | Ngoài phạm vi (v1) |
| :--- | :--- |
| Loại danh mục + bản ghi + cạnh đa cha, version + hiệu lực | Quy trình duyệt (approval) thay đổi danh mục |
| CRUD + phân quyền 2 tầng (module + theo loại) | Import/Export Excel/CSV (có thể làm sau nếu khách cần) |
| API schema/options/resolve/inline-create cho form động | Đồng bộ danh mục với hệ thống ngoài (địa giới hành chính từ API nhà nước) |
| Component trường danh mục dùng chung (autocomplete + nhập tự do) | Bitemporal đầy đủ / kiểm toán lịch sử thay đổi từng trường |
| Seed danh mục hệ thống (tỉnh/huyện/xã mẫu, ngành, chuyên ngành) + tenant (chức danh, …) | Đa ngôn ngữ cho **tên danh mục** (khách chốt E9) |
| Plugin core: luôn bật, cài mọi tenant (mới + backfill) | Di trú cây phòng ban từ Core sang plugin |

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp phân tích R5–R8 | BA Agent; chưa review |
