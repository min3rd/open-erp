# [BENCH-S05-001] Nghiên Cứu Đối Chuẩn: Danh Mục Phân Cấp, Đa Cha, Hiệu Lực & API Options Cho Form Động

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / phạm vi | BENCH-S05-001 / Đối chuẩn / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S05-001](../01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / 02_ANL-S05-001 (02_analysis) |

## 1. Mục đích

Sprint 05 xây plugin lõi "Danh mục & quản trị danh mục" với bốn bài toán khó: (1) phân cấp đơn cha (tỉnh → huyện → xã), **nhảy cấp** (tỉnh → xã) và **đa cha/DAG** (Lập trình viên ∈ Công nghệ thông tin và Khoa học dữ liệu); (2) **phiên bản + hiệu lực thời gian** cho mục và quan hệ; (3) **API options** cho form động (lazy-load, lọc theo cha, autocomplete cho phép nhập tự do); (4) **plugin luôn bật**, cài cho mọi tenant khi đăng ký, kèm seed danh mục hệ thống (chức danh, phòng ban).

Tài liệu đối chuẩn cách các hệ thống lớn giải bốn bài toán trên để người đọc quyết định:
- **Mô hình dữ liệu**: cột `parent_id` (adjacency) / nested set / bảng cạnh (edge) cho DAG; mức độ denormalize (materialized path, closure table).
- **Độ sâu temporal**: chỉ hiệu lực (valid time) + audit, hay bitemporal đầy đủ; ràng buộc chống chồng lấn trên PostgreSQL 16 của dự án.
- **Contract API options** và ngữ nghĩa "free text có/không".
- **Cơ chế always-on**: khóa gỡ ở tầng nào, seed/backfill thế nào khi plugin nâng cấp.

Quy ước đánh dấu: **Đã kiểm chứng** = đọc trực tiếp mã nguồn/tài liệu sản phẩm trong phiên này; **Suy luận** = suy đoán từ tài liệu thứ cấp/kinh nghiệm, cần kiểm chứng thêm. Không nêu URL; chi tiết phiên bản sản phẩm có thể thay đổi theo thời gian.

Giới hạn: đối chuẩn định tính từ tài liệu công khai, không đo hiệu năng thực tế; các sản phẩm thương mại (SAP, Workday, NetSuite, Salesforce) không thể kiểm chứng ở mức schema nên nhiều chi tiết phải đánh dấu **Suy luận**.

## 2. Bảng đối chuẩn

Bảng đối chiếu 11 sản phẩm theo 6 tiêu chí; cột "Ghi chú" nêu bài học cần học hoặc cần tránh cho Sprint 5.

| Sản phẩm | Mô hình phân cấp | Đa cha? | Version/effective? | API options cho form | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Odoo (`product.category`, `hr.department`) | Adjacency `parent_id` (Many2one) + `_parent_store` materialized path (`parent_path`), `complete_name` tính sẵn (**Đã kiểm chứng** — mã nguồn 17.0) | Không — 1 cha (**Đã kiểm chứng**) | Không; có `active` (archive) + `_check_recursion` chặn vòng khi ghi (**Đã kiểm chứng**) | `name_search`/`_name_search` lazy + `name_create` tạo nhanh từ chuỗi gõ mới (**Đã kiểm chứng** — odoo/models.py; widget Many2one dùng chúng là **Suy luận**) | Gần nhất với "autocomplete cho phép nhập tự do"; chặn xóa category mặc định |
| ERPNext / Frappe (Item Group, Territory, Warehouse) | Nested Set `lft`/`rgt` (`update_nsm`, `rebuild_tree`) (**Đã kiểm chứng** — frappe/utils/nestedset.py) | Không — 1 parent field (**Đã kiểm chứng**) | Không; `validate_loop` chặn thêm node vào descendant, chặn xóa node còn con (**Đã kiểm chứng**) | Link field + search; lọc theo cha bằng query tùy biến (**Suy luận**) | Đọc subtree nhanh nhưng đổi cha phải shift toàn bộ `lft`/`rgt`; không hợp danh mục sửa thường xuyên, không DAG |
| Drupal taxonomy | Term + field `parent` đa trị → cây hoặc DAG (**Đã kiểm chứng** — drupal.org) | **Có** (từ D8) (**Đã kiểm chứng**) | Có revision cho term; không effective date (**Suy luận**) | Entity reference autocomplete qua Views/REST (**Suy luận**) | Đa cha là mặc định nhưng UI quản trị mặc định yếu, phải thêm module; item nằm nhiều nhánh gây khó đếm/tìm |
| ServiceNow CMDB | CI class + bảng cạnh `cmdb_rel_ci` (parent → type → child) (**Đã kiểm chứng** — tài liệu ServiceNow) | **Có** — một CI có nhiều quan hệ cha/con (**Đã kiểm chứng**) | Audit/history của nền tảng; không effective dating native (**Suy luận**) | Reference field + reference qualifier lọc động (**Suy luận**) | Tách node khỏi cạnh có type (Contains/HostedOn/DependsOn) — bài học cho DAG có ngữ nghĩa |
| WordPress categories | Adjacency 1 cột `wp_term_taxonomy.parent` (bigint) (**Đã kiểm chứng** — schema WP) | Không (**Đã kiểm chứng**) | Không; kiểm tra vòng khi đổi cha (**Suy luận**) | REST `/wp/v2/categories` hỗ trợ `parent` + `search` (**Suy luận**) | Mô hình tối giản nhất; không đa cha, không temporal |
| SAP (HCM OM + ERP) | Node HRP1000 (org unit/position/job) + quan hệ HRP1001 n:m (**Đã kiểm chứng** — tài liệu HCM) | Ở tầng quan hệ: có; cấu trúc org thực tế thường đơn cha theo từng mốc thời gian (**Suy luận**) | **Có** — infotype/quan hệ time-dependent BEGDA/ENDDA, truy vấn theo key date (**Đã kiểm chứng**) | F4/value help có filter theo ngày (**Suy luận**) | Chuẩn mực "cạnh có hiệu lực": tách node/edge, mọi truy vấn kèm tham số ngày |
| NetSuite | Custom record "Record is Parent"/"Sub-Item Of", cây cùng record type; customer/subsidiary hierarchy (**Đã kiểm chứng** — docs Oracle) | Không — 1 parent/record (**Đã kiểm chứng**) | Không effective dating cho quan hệ; cây subsidiary bị khóa sửa (cửa sổ tối đa 30 ngày) (**Đã kiểm chứng** — nguồn thứ cấp) | Saved search `Sub-Item Of`; không có options endpoint chuẩn (**Đã kiểm chứng** — blog kỹ thuật) | Change control bằng khóa thời gian — đối chiếu với lựa chọn audit + hiệu lực của Open-ERP |
| Workday | Business object effective-dated; hierarchy org/position (**Suy luận** phần cấu trúc) | Không rõ — **Suy luận** | **Có** — mọi thay đổi có effective date + entry moment, transaction log, "View All As Of" (**Đã kiểm chứng** — doc.workday.com) | API/RaaS trả theo as-of (**Suy luận**) | Hai mốc thời gian giải thích "extract drift"; bài học: lưu ngày nhập liệu bên cạnh ngày hiệu lực |
| Salesforce | Không có cây danh mục native; picklist/global value set (**Suy luận**) | n/a | Field history tracking, không effective dating (**Suy luận**) | Dependent picklist: controlling field + `validFor` (Metadata API) (**Đã kiểm chứng** — developer.salesforce.com); UI API object-info (**Suy luận**) | Lọc options theo cha là pattern chuẩn; picklist không cho free text → Open-ERP phải tự định nghĩa fallback (**Suy luận**) |
| Retool (low-code) | Cascader cho chọn phân cấp (**Đã kiểm chứng** — hướng dẫn) | n/a | n/a | Options "mapped" từ query, shape `{value,label,caption,disabled,...}`; dropdown phụ thuộc = query thứ 2 lọc theo giá trị dropdown 1 (**Đã kiểm chứng** — docs.retool.com) | Contract options tối giản, đáng sao chép |
| OpenProject | Work package parent-child (1 cha) + subproject; filter "Descendants of" (**Đã kiểm chứng** — openproject.org) | Không (**Đã kiểm chứng**) | Không effective dating cho quan hệ (**Suy luận**) | Filter parent/descendants trong bảng (**Đã kiểm chứng**) | Quan hệ "related/blocked/follows" tách khỏi hierarchy — cùng tinh thần ServiceNow |

## 3. Bài học cho Open-ERP

1. **Chọn mô hình node + cạnh, không nested set**
   - *Vấn đề*: Sprint 5 cần đồng thời cây đơn cha, nhảy cấp và DAG đa cha trên cùng hệ danh mục.
   - *Các hệ thống*: Odoo/WordPress/NetSuite/OpenProject chỉ có `parent_id` đơn; Frappe nested set cũng đơn cha và đắt khi ghi; Drupal/ServiceNow/SAP dùng quan hệ nhiều-nhiều (Đã kiểm chứng).
   - *Khuyến nghị*: một bảng `catalog_item` + một bảng cạnh `catalog_item_parent` (tenant_id, item_id, parent_id, sort_order, period); cây đơn cha là ràng buộc theo `catalog_type`; "nhảy cấp" chỉ là node có cha ở độ sâu bất kỳ — **không lưu `level` cứng**, tính bằng recursive CTE; loại nested set khỏi phương án.

2. **Chống chu trình tại write path**
   - *Vấn đề*: DAG dễ sinh vòng (A→B→A) khi gán/sửa cha.
   - *Các hệ thống*: Odoo `_check_recursion`; Frappe `validate_loop` ném `NestedSetRecursionError`; WordPress/SAP kiểm tra khi đổi cha (Đã kiểm chứng một phần).
   - *Khuyến nghị*: service chặn nếu `parent_id` thuộc tập descendant của item (một recursive CTE), trả `code` lỗi chuẩn cho FE; cân nhắc trigger DB hoặc closure table nếu cần chặn tuyệt đối; không tin UI.

3. **Hiệu lực cho cả node lẫn edge**
   - *Vấn đề*: mục danh mục và quan hệ cha-con đều cần cửa sổ hiệu lực/phiên bản.
   - *Các hệ thống*: SAP infotype/quan hệ BEGDA-ENDDA; Workday effective date + transaction log; NetSuite không có (Đã kiểm chứng).
   - *Khuyến nghị*: dùng `daterange`/`tstzrange` trên cả node và edge; PostgreSQL 16 của dự án dùng `EXCLUDE USING gist (tenant_id WITH =, item_id WITH =, period WITH &&)` + `btree_gist`; PostgreSQL 18 có `UNIQUE (... WITHOUT OVERLAPS)`/`PERIOD` FK nhưng không phụ thuộc vào nó (Đã kiểm chứng — docs PostgreSQL; infra đang ghim `postgres:16-alpine`).

4. **Valid time + audit, chưa bitemporal**
   - *Vấn đề*: có cần tái dựng trạng thái theo cả thời điểm nhập liệu (retroactive change) không?
   - *Các hệ thống*: Workday giữ cả effective date và entry moment; SAP tự động delimit bản ghi cũ theo key date (Đã kiểm chứng).
   - *Khuyến nghị*: Sprint 5 chỉ valid-time + audit log (`recorded_at`, actor) + cột `version`; truy vấn "as of" = `period @> :date`; full bitemporal để giai đoạn sau — đưa vào câu hỏi Q3.

5. **API options chuẩn hóa, lazy, lọc theo cha**
   - *Vấn đề*: form động cần lazy-load options tenant/system và lọc theo giá trị cha.
   - *Các hệ thống*: Retool options mapped từ query; Salesforce dependent picklist; Odoo `name_search` lazy; ServiceNow reference qualifier (Đã kiểm chứng một phần).
   - *Khuyến nghị*: `GET /catalog/options` trả Paginated List chuẩn (`items[{value,label,disabled,has_children}]`), tham số `type_code`, `parent_id`, `q`, phân trang; validate lại server-side khi submit.

6. **Free text có kiểm soát**
   - *Vấn đề*: autocomplete cho phép người dùng gõ giá trị mới ngoài danh mục.
   - *Các hệ thống*: Odoo `name_create` tạo bản ghi ngay khi gõ tên mới; Salesforce picklist không cho free text (Đã kiểm chứng/Suy luận).
   - *Khuyến nghị*: cờ `allow_free_text` theo `catalog_type`; nếu bật → tạo item với `is_system=false` và kiểm tra quyền tạo; nếu tắt → validate phải khớp options; lỗi trả `code` + `params` để FE dịch i18n.

7. **Seed danh mục hệ thống idempotent**
   - *Vấn đề*: chức danh/phòng ban cố định cho mọi tenant; bản plugin mới có thể thêm mục.
   - *Các hệ thống*: Odoo `auto_install` + data XML `noupdate`; WordPress activation hook theo site; NetSuite cấu hình tay (Đã kiểm chứng một phần).
   - *Khuyến nghị*: seed theo `system_code` ổn định, upsert idempotent khi provisioning tenant và khi nâng phiên bản (backfill mọi tenant hiện hữu); `is_system=true` chặn xóa/đổi mã nhưng cho đổi nhãn; audit mỗi lần seed/backfill.

8. **Always-on nhưng vẫn là plugin chuẩn**
   - *Vấn đề*: plugin luôn bật, cài cho mọi tenant, không được gỡ.
   - *Các hệ thống*: WordPress mu-plugins (không tắt được từ admin, chỉ xóa file); Odoo `base` kernel `auto_install` + cơ chế chặn gỡ `uninstallable`; ERPNext cài app lõi mặc định khi tạo site (**Suy luận**) (Đã kiểm chứng một phần).
   - *Khuyến nghị*: đánh dấu `always_on` trong manifest/registry; Plugin Manager chặn uninstall/disable ở tầng service (không chỉ ẩn UI); entitlement không thể tắt; vẫn dùng manifest/Entity Registry/migration như plugin thường; tenant mới tự cài + seed.

9. **Quyền hai tầng: functional theo type, data theo item**
   - *Vấn đề*: CRUD + per-catalogue-type functional/data permissions.
   - *Các hệ thống*: ERP SaaS tách "được dùng danh mục" và "được sửa dữ liệu"; ServiceNow/Salesforce dùng role + filter (Suy luận).
   - *Khuyến nghị*: permission trên `catalog_type` + scope theo item (nhánh/phòng ban); mọi truy vấn kèm `tenant_id` + scope đã xác thực; chi tiết chốt ở ANL-S05-001 và Q7.

10. **Change control: audit + hiệu lực thay vì khóa cứng**
    - *Vấn đề*: đổi/xóa cấu trúc danh mục đang được tham chiếu bởi dữ liệu nghiệp vụ.
    - *Các hệ thống*: NetSuite khóa sửa subsidiary hierarchy; Frappe chặn xóa node có con; Odoo chặn xóa category mặc định (Đã kiểm chứng).
    - *Khuyến nghị*: archive/soft-delete + effective dating; chặn xóa cứng khi còn tham chiếu với `code` lỗi rõ ràng; hiển thị lịch sử node/edge cho người dùng có quyền.

11. **UI cho item đa cha: đường dẫn theo ngữ cảnh, đếm một lần**
    - *Vấn đề*: một item nằm nhiều nhánh thì breadcrumb/tree/count hiển thị thế nào.
    - *Các hệ thống*: Drupal đa cha gây khó tìm/đếm nếu không có module hỗ trợ; ServiceNow dùng nhiều góc nhìn quan hệ thay vì một cây duy nhất (Đã kiểm chứng một phần).
    - *Khuyến nghị*: breadcrumb theo đường đang duyệt (không hiển thị mọi cha cùng lúc); count/aggregate tính theo tập id duy nhất; cảnh báo khi gán thêm cha có thể gây trùng lặp thống kê.

12. **Đọc nhanh chỉ thêm khi có bằng chứng hiệu năng**
    - *Vấn đề*: recursive CTE đủ nhanh hay cần denormalize (materialized path/closure table) ngay từ đầu?
    - *Các hệ thống*: Odoo thêm `_parent_store`/`parent_path` để đọc `child_of` nhanh; Frappe chọn nested set cho subtree read — cả hai trả giá ở write path (Đã kiểm chứng).
    - *Khuyến nghị*: Sprint 5 bắt đầu bằng adjacency + recursive CTE (index `(tenant_id, parent_id)`); chỉ thêm materialized path/closure khi có số đo thực tế; ghi rõ điều kiện nâng cấp trong ANL-S05-001.

## 4. Điểm cần khách xác nhận

1. **Q1 — Đa cha khác loại**: ví dụ "Danh mục công việc" là con của cả "Ngành" và "Phân bổ" — cha có bắt buộc cùng `catalog_type` không? Cây đơn cha và DAG dùng chung một loại danh mục hay tách loại riêng?
2. **Q2 — Nhảy cấp**: tỉnh → xã có ràng buộc nghiệp vụ nào (xã phải thuộc tỉnh qua đường khác) không, và UI hiển thị độ sâu thế nào khi item nằm nhiều nhánh?
3. **Q3 — Temporal**: chỉ cần hiệu lực hiện tại + audit, hay cần xem/xuất trạng thái "as of" quá khứ? Có cần số phiên bản hiển thị trên UI (kiểu SAP/Workday giữ 2 mốc thời gian)?
4. **Q4 — Free text**: loại danh mục nào cho phép gõ giá trị mới? Ai được tạo (mọi user hay quản trị danh mục)? Có cần duyệt trước khi giá trị mới được dùng chung không?
5. **Q5 — Nhãn danh mục hệ thống**: tên seed (chức danh, phòng ban) là dữ liệu tenant sửa được hay lấy từ i18n? Khi tenant sửa nhãn, bản nâng cấp sau có ghi đè không?
6. **Q6 — Always-on**: Super Admin có được phép tắt/ẩn plugin này khỏi UI không (dù không gỡ)? Khi bản mới thêm mục seed, backfill toàn bộ tenant hay chỉ tenant mới?
7. **Q7 — Quyền dữ liệu theo item**: có cần giới hạn theo chi nhánh/phòng ban (data scope) không, hay chỉ phân quyền theo `catalog_type` (functional)?
8. **Q8 — Xóa mục đang tham chiếu**: chặn hẳn như Frappe hay archive mềm như Odoo `active`? Ai được xóa cứng?

Các câu hỏi trên sẽ được tổng hợp vào CONF-S05-001; mọi khuyến nghị chỉ có hiệu lực sau Confirmation Gate.

## 5. Lịch sử

| Phiên bản | Ngày | Người thực hiện | Nội dung thay đổi |
| :---: | :---: | :--- | :--- |
| 0.1 | 2026-10-06 | BA Agent | Bản nháp đầu tiên: đối chuẩn 11 sản phẩm cho 4 bài toán của Sprint 05; đề xuất node + edge, valid-time + audit, API options chuẩn hóa, plugin always-on |
