# [00] Sprint 05 — Plugin core đầu tiên: Danh mục & quản trị danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S05-001 / 0.1 / 2026-10-06 |
| Trạng thái tài liệu / sprint | Draft / Discovery (bước 1–6 đã soạn, **chờ xác nhận scope**) |
| Owner / reviewer | PM Agent / Chưa review |
| Đầu vào / đọc trước / đọc tiếp | [RAW-S05-001](01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) — chỉ đạo trực tiếp của chủ dự án / [Sprint 04](../sprint_04_ui_ux_experience/00_READING_GUIDE.md) (đã đóng) / [RAW-S05-001](01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) |

## 1. Đọc để hiểu gì?

Sprint 05 tạo **plugin core đầu tiên** của hệ thống — hạ tầng **danh mục dùng chung** cho mọi plugin nghiệp vụ về sau:

1. **Cấu trúc dữ liệu danh mục**: phân cấp nhiều cấp (tỉnh → huyện → xã), **nhảy cấp** (tỉnh → xã), **đa cha/DAG** (Lập trình viên ⊂ CNTT **và** ⊂ Khoa học dữ liệu; Công việc ⊂ Ngành **và** ⊂ Phân bổ).
2. **Version + hiệu lực theo thời gian** cho cả bản ghi và quan hệ cha–con.
3. **Quản trị danh mục**: CRUD, phân quyền **hai tầng** (quyền module + quyền theo từng loại danh mục).
4. **API cho form động**: schema loại, options lazy (tenant + hệ thống), resolve theo lô, tạo nhanh khi nhập tự do.
5. **Danh mục cố định cho doanh nghiệp**: Chức danh, Phòng ban (cầu nối cây tổ chức)… autocomplete **hoặc** nhập tự do.
6. **Plugin luôn bật**: cài tự động cho tenant mới và backfill tenant hiện có; không gỡ được.

Người mới đọc trước: [Developer Reading Guide](../../08_developer_guides/00_READING_GUIDE.md) → [Project walkthrough](../../08_developer_guides/01_project_walkthrough.md) → [shared UI guide](../../08_developer_guides/shared_ui_contribution_guide.md).

## 2. Lộ trình đọc

Khách hàng đọc 01–04 và 08–09. Developer đọc CONF, SOL, DES, item, QA/review.

| Thứ tự | ID/alias | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S05-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md) | Nguyên văn yêu cầu + bóc tách R1–R8 | BA |
| 02.01 | ANL-S05-001 | [Bài toán dữ liệu](02_analysis/01_ANL-S05-001_catalog_data_model_problems.md) | Cây/DAG, nhảy cấp, version, hiệu lực, trường hợp biên | BA |
| 02.02 | ANL-S05-002 | [Chức năng, phân quyền, form động](02_analysis/02_ANL-S05-002_admin_features_permissions_dynamic_forms.md) | CRUD, quyền 2 tầng, API form, danh mục cố định, always-on | BA |
| 03.01 | BENCH-S05-001 | [Đối chuẩn danh mục ERP](03_benchmarks/01_BENCH-S05-001_catalog_patterns_in_erp.md) | Odoo/ERPNext/Drupal/ServiceNow… làm thế nào; bài học | BA |
| 04.01 | CONF-S05-001 | [Scope & AC Sprint 05](04_confirmation/01_CONF-S05-001_sprint_05_scope.md) | ✅ **CONFIRMATION GATE APPROVED 2026-10-06** — **22 AC**, 25/25 câu đã trả lời | BA + Khách hàng |
| 05.01 | SOL-S05-001 | [Kiến trúc plugin](05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) | 16 quyết định kiến trúc + luồng + rủi ro | Architect |
| 06.01 | DES-DB-S05-001 | [Thiết kế CSDL](06_designs/db/01_DES-DB-S05-001_catalog_schema.md) | DDL 4 bảng, EXCLUDE, index, seed/backfill, truy vấn mẫu | Architect |
| 06.02 | DES-API-S05-001 | [Thiết kế API](06_designs/api/01_DES-API-S05-001_catalog_api.md) | 3 nhóm API + contract + mã lỗi | Architect |
| 06.03 | DES-UI-S05-001 | [Thiết kế UI](06_designs/ui/01_DES-UI-S05-001_catalog_admin_ui.md) | Màn 3 cột + component picker + ma trận Desktop/Mobile | Architect |
| 07.01 | FEAT-30 | [Plugin core Danh mục](07_items/FEAT-30_catalog_core_plugin.md) | Feature + **19 task con** | Developer |
| 07.02 | TASK-375…393 | [07_items/](07_items/) | Scope code từng task (đang `Blocked — chờ gate scope`) | Developer |
| 08.01 | TP-S05-001 | [Test plan Sprint 05](08_testing/01_TP-S05-001_sprint_05_test_plan.md) | **25 TC** theo AC + ma trận lấy mẫu | QA |
| 08.02 | TR-S05-001 | Chưa tạo | Kết quả có baseline/evidence | QA |
| 09.01 | REV-S05-001 | Chưa tạo | DoD/backlog/closure | PM |

> Bảng đọc là snapshot danh mục. Khi thêm artifact phải cập nhật index này trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval (CONF-S05-001) | ✅ **APPROVED 2026-10-06** — 22 AC + 19 task được duyệt | Khách hàng (chủ dự án) | CONF 1.0; chỉ đạo trực tiếp "ok chốt scope và lập trình đi nhé" |
| Design ready (SOL/DES) | Draft | Architect/Reviewer | SOL/DES 0.1, chưa review kỹ thuật |
| QA sign-off | Pending | QA | Chưa có |
| PM đánh giá DoD | Pending | PM | Chưa có |
| Customer acceptance | Pending | Khách hàng | Chưa có |
| Closure | Pending | PM sau nghiệm thu | Chưa có |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S05-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | PM | Used |
| RAW-S05-001 | [01_raw_notes/](01_raw_notes/) | BA | Used |
| ANL-S05-001…002 | [02_analysis/](02_analysis/) | BA | Used |
| BENCH-S05-001 | [03_benchmarks/](03_benchmarks/) | BA | Used |
| CONF-S05-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used (Pending) |
| SOL-S05-001 | [05_solutions/](05_solutions/) | Architect | Used |
| DES-DB/API/UI-S05-001 | [06_designs/](06_designs/) | Architect | Used |
| FEAT-30 | [07_items/FEAT-30](07_items/FEAT-30_catalog_core_plugin.md) | Developer | Used (Planned) |
| TASK-375…389 | [07_items/](07_items/) | Developer | Used (Blocked — chờ scope) |
| TASK-390…391 | [07_items/](07_items/) | Developer | Used (Blocked — chờ scope; import/export + ghi đè hệ thống) |
| TASK-392…393 | [07_items/](07_items/) | Developer | Used (Blocked — chờ scope; màn hệ thống + seed địa giới) |
| TP-S05-001 | [08_testing/](08_testing/) | QA | Used (Draft) |
| TR-S05-001 | Chưa tạo | QA | Reserved |
| REV-S05-001 | Chưa tạo | PM | Reserved |
| ADR-S05-* | Chưa tạo | Architect | Reserved |

## 5. Việc chuyển tiếp từ Sprint 04

| Việc | Nguồn | Sprint 05 xử lý |
| :--- | :--- | :--- |
| 1 touch target 27px tại web 390px | [REV-S04-001 §4](../sprint_04_ui_ux_experience/09_review/01_REV-S04-001_sprint_04_review.md) | Sửa khi màn danh mục/UI được chạm tới (TASK-385) |
| Skeleton khi mạng chậm — kiểm tay | REV-S04-001 §4 | Áp dụng lại mẫu vùng-tải độc lập cho màn danh mục (TASK-385) |
| Review kỹ thuật độc lập SOL/DES + smoke K8s staging | Sprint 03/04 follow-up | Ngoài phạm vi Sprint 05 (theo dõi ở review) |

> Trạng thái sản phẩm lấy ở artifact gốc trong `07_items/` và review, không lấy từ bảng này khi chưa có bằng chứng.

## 6. Điểm còn phân vân / cần kiểm chứng (2026-10-06)

| # | Điểm | Loại | Đề xuất / trạng thái |
| :--- | :--- | :--- | :--- |
| 1 | **Duyệt scope** (Q18 = "chưa duyệt" ×3) | Cổng — **chặn code** | Cần một câu xác nhận; có thể duyệt **toàn bộ** hoặc **theo giai đoạn** (lõi TASK-375…389 trước) |
| 2 | **Design ready gate**: SOL/DES chưa review kỹ thuật, đặc biệt **D1** (plugin core chạy in-process thay vì đóng gói JAR như Sprint 03) | Nội bộ | Cần 1 lượt review trước khi code; nếu muốn đóng gói riêng thì D1 phải đổi |
| 3 | ~~**Giấy phép dữ liệu địa giới** (`provinces.open-api.vn`)~~ | Kỹ thuật/pháp lý | ✅ **Đã xử lý 2026-10-06**: tệp `provinces-communes.csv` sinh một lần (34 tỉnh / 3.321 xã-phường, dữ liệu sau sáp nhập 2025), header ghi **nguồn + ngày + số dòng**; runtime không gọi mạng; cập nhật bằng `node scripts/gen-admin-units.mjs` + kiểm tra `node scripts/check-admin-units.mjs` |
| 4 | **Extension PostgreSQL** `btree_gist`, `pg_trgm` có sẵn trên dev/staging/prod? | Kỹ thuật | Migration `CREATE EXTENSION IF NOT EXISTS`; nếu môi trường chặn ⇒ fallback kiểm tra ở service (ghi rõ trong migration) |
| 5 | **Mobile**: cần màn **tra cứu danh mục** read-only hay chỉ cần `catalog-picker` trong form? | Scope nhỏ | TASK-387 đang gồm màn browse; cắt được để giảm phạm vi nếu bạn muốn |
| 6 | **`name_en`**: chỉ hiển thị ở form quản trị (không tự đổi theo ngôn ngữ UI)? | Scope nhỏ | Mặc định như vậy; đa ngôn ngữ tên danh mục để sprint sau (Q9) |

**Ba điểm Architect đã tự chốt theo hướng an toàn hơn (ghi để review biết)**:

1. `allowed_parent_types` **NULL = chỉ cùng loại** (trước đó ghi "mọi loại" — nay đổi để tránh cấu trúc sai).
2. **Grant mặc định** cho `TENANT_OWNER`/`TENANT_ADMIN` trên mọi loại tenant (tránh "cài xong không ai sửa được").
3. **Tenant import trùng `code` với mục hệ thống ⇒ tạo bản ghi ghi đè của tenant** (nhất quán Q1/Q2), không sửa bản hệ thống.
