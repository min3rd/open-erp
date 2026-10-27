# [CONF-S05-001] Biên Bản Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu Sprint 05

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S05-001 / Scope & AC / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Approved — chủ dự án chốt scope 2026-10-06** / 1.0 / 2026-10-06 |
| Owner / reviewer | BA Agent / **Khách hàng (Product Owner)** |
| Đầu vào | [RAW-S05-001](../01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md), [ANL-S05-001](../02_analysis/01_ANL-S05-001_catalog_data_model_problems.md), [ANL-S05-002](../02_analysis/02_ANL-S05-002_admin_features_permissions_dynamic_forms.md), [BENCH-S05-001](../03_benchmarks/01_BENCH-S05-001_catalog_patterns_in_erp.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [SOL-S05-001](../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) |

> **Gate: APPROVED (2026-10-06)** — chủ dự án chốt scope/AC bằng chỉ đạo trực tiếp trong phiên làm việc ("ok chốt scope và lập trình đi nhé") sau khi trả lời đầy đủ **25 câu hỏi** (18 gốc + N1–N7). Không tạo chữ ký tay giả; §5 ghi loại xác nhận thực tế. **Sprint 05 được phép lập trình.**

## 1. Phạm Vi Đề Xuất (đã cập nhật theo câu trả lời)

Xây **plugin core đầu tiên**: `catalog` (Danh mục & quản trị danh mục) — hạ tầng danh mục dùng chung cho mọi plugin khác, luôn bật cho mọi tenant.

**Trong phạm vi**

1. Mô hình dữ liệu danh mục: loại danh mục, bản ghi, **quan hệ cha–con đa cha (DAG)**, **version + hiệu lực theo thời gian**; cha–con **khác loại** có allowlist.
2. CRUD danh mục + **phân quyền hai tầng** (quyền module + quyền theo từng loại).
3. **API cho form động**: schema loại, options lazy, resolve theo lô, tạo nhanh khi nhập tự do.
4. **Component trường danh mục dùng chung** (autocomplete **hoặc** nhập tự do) cho Web + Mobile.
5. **Danh mục cố định cho doanh nghiệp** (mục 1.1) — gồm **Phòng ban là danh mục riêng của plugin** (không cầu nối cây tổ chức).
6. **Import/Export danh mục (CSV)** — **trong phạm vi Sprint 5** (theo trả lời Q7).
7. **Tenant được ghi đè/ẩn danh mục hệ thống** theo `code` (bản ghi tenant thắng).
8. **Plugin core luôn bật**: tự cài cho tenant mới, backfill tenant hiện có, không gỡ được.
9. Màn quản trị danh mục (Desktop) + màn tra cứu (Mobile).

**Ngoài phạm vi (v1)**: quy trình duyệt thay đổi danh mục (Q8); đồng bộ địa giới hành chính từ API bên ngoài; bitemporal đầy đủ; đa ngôn ngữ **tên** danh mục (chỉ `name` + `name_en`, Q9); phân quyền dữ liệu theo chi nhánh/phòng ban (Q17).

### 1.1. Danh mục cố định seed cho tenant (Q10 + N1: **chốt 5 mục**)

| # | Danh mục | Loại quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- |
| 1 | **Chức danh** | phẳng (DAG, cho nhập tự do) | Yêu cầu gốc; autocomplete hoặc nhập tự do |
| 2 | **Phòng ban** | phẳng | **Danh mục riêng độc lập** (Q3); seed một chiều từ cây tổ chức khi cài/backfill |
| 3 | Loại hợp đồng | phẳng | Q10 |
| 4 | Ca làm việc | phẳng | Q10 |
| 5 | Trình độ học vấn | phẳng | Q10 |

> **N1 (2026-10-06)**: chủ dự án chốt **chỉ 5 mục** — 8 mục gợi ý thêm (Hình thức làm việc, Cấp bậc/Chức vụ, Loại nghỉ phép, Dân tộc/Quốc tịch, Loại/Nguồn khách hàng, Phương thức/Điều khoản thanh toán, Nhóm sản phẩm/Đơn vị tính, Mức ưu tiên) **không seed**; tenant tự tạo loại + mục khi cần.

### 1.2. Dữ liệu địa giới hành chính (N2: **seed thật 2 cấp tỉnh→xã**)

- Seed trong migration/seed script từ tệp CSV commit trong repo (`src/backend/src/main/resources/db/seed/provinces-communes.csv`), **không** gọi API bên ngoài lúc chạy.
- Mỗi xã là **con trực tiếp của tỉnh** (cạnh `tỉnh→xã`, đúng kịch bản nhảy cấp R2); loại `DISTRICT` vẫn có sẵn nhưng **không seed** dữ liệu huyện ở v1.
- Nguồn dữ liệu chốt tại **N6** (đang mở); tệp ghi rõ nguồn + ngày + số dòng ở header.

## 2. Tiêu Chí Nghiệm Thu (Given/When/Then)

| AC | Nội dung | Nguồn |
| :--- | :--- | :--- |
| **AC-01** | Tạo `tỉnh→huyện`, `huyện→xã`; truy vấn con cháu tỉnh trả đúng 2 cấp | R1 |
| **AC-02** | Tạo **trực tiếp** `tỉnh→xã`; xã là con cấp 1; **không** sinh cạnh bắc cầu ngầm | R2 |
| **AC-03** | "Lập trình viên" là con của **cả** CNTT **và** KHDL; API trả danh sách cha > 1 | R3 |
| **AC-04** | "Công việc" ⊂ Ngành (CLASSIFICATION) và ⊂ Phân bổ (ALLOCATION); xoá một quan hệ không ảnh hưởng quan hệ kia | R3 |
| **AC-05** | Tạo cạnh gây chu trình ⇒ **từ chối** `CATALOG_EDGE_CYCLE`, dữ liệu không đổi | ANL E1 |
| **AC-06** | Sửa danh mục ⇒ tạo **phiên bản mới**; `as_of` mốc cũ trả nội dung cũ | R4 |
| **AC-07** | Hai phiên bản cùng `(tenant, loại, mã)` chồng hiệu lực ⇒ CSDL từ chối, API trả mã riêng | R4 |
| **AC-08** | Đặt `valid_to` cho cạnh ⇒ mặc định không thấy, `as_of` quá khứ vẫn thấy | R4 |
| **AC-09** | Có quyền module nhưng **thiếu grant** trên loại ⇒ chỉ đọc + `CATALOG_TYPE_FORBIDDEN` khi ghi; có grant ⇒ ghi được | R5 |
| **AC-10** | Options phân trang (20/tối đa 100), lọc `q`/`parent_id`/`as_of`, gộp **tenant + hệ thống** | R6 |
| **AC-11** | Form đã lưu chỉ có `catalog_item_id` ⇒ resolve **theo lô** khi mở lại (không N+1) | R6 |
| **AC-12** | Nhập tự do ⇒ lưu `{text}`; có quyền `inline-create` ⇒ lưu được thành mục mới | R7 |
| **AC-13** | Tenant mới: plugin catalog là **default_install nhưng không locked**, xuất hiện trong **quản lý plugin** để tenant bật; khi bật seed **5 danh mục cố định** (§1.1). Tenant cũ: migration **backfill** dữ liệu (idempotent, không ghi đè bản ghi tenant đã sửa), trạng thái ledger hiện có được giữ | R8, N1 |
| **AC-14** | Plugin **locked** (nếu có): thao tác gỡ bị **chặn** với mã lỗi rõ ràng. Catalog là default **unlocked**: tenant được bật/tắt/gỡ; dữ liệu schema giữ lại sau gỡ | R8 |
| **AC-15** | Hai tenant cùng mã: **không rò rỉ chéo**; danh mục hệ thống hiển thị cho cả hai | Ràng buộc dự án |
| **AC-16** | Entity Registry có 3 entity; manifest khai báo ma trận **Desktop/Mobile** | Ràng buộc dự án |
| **AC-17** | Màn quản trị: chế độ **Đa cha**, danh sách cha, breadcrumb theo đường đang chọn; **không modal** | R5 |
| **AC-18** | **Import CSV/`.xlsx`**: tệp đúng mẫu (có cột `parent_code` tuỳ chọn để nhập cây) ⇒ tạo/cập nhật bản ghi theo `code` + tạo quan hệ cha–con, trả báo cáo `created/updated/skipped/errors[]` theo dòng; tệp sai mẫu ⇒ từ chối trước khi ghi | Q7, N3 |
| **AC-19** | **Export CSV**: xuất theo loại (kèm cha/con, hiệu lực, trạng thái); tệp tải về mở đúng bằng Excel (UTF-8 BOM), đủ 13 danh mục seed khi chọn "tất cả" | Q7 |
| **AC-20** | **Ghi đè/ẩn danh mục hệ thống**: tenant tạo bản ghi cùng `code` ⇒ form hiển thị bản tenant; đánh dấu ẩn ⇒ mục hệ thống không xuất hiện trong options của tenant đó, tenant khác không đổi | Q1, Q2 |
| **AC-21** | **Dữ liệu địa giới 2 cấp**: sau seed, options của loại `PROVINCE` có **34** tỉnh/thành và của `COMMUNE` có **3.321** xã/phường là **con trực tiếp của tỉnh** (cạnh tỉnh→xã, không có huyện, đúng cấu trúc sau sáp nhập 2025); tra cứu theo `parent_id` (tỉnh) trả đúng xã thuộc tỉnh đó | N2 |
| **AC-22** | **Cổng Platform**: super admin có màn quản trị danh mục **hệ thống** (danh sách loại hệ thống + bản ghi + quan hệ + import/export), dùng lại UI quản trị với cờ "hệ thống"; tenant không thấy màn này | N5 |

## 3. Câu Hỏi Đã Chốt (18/18 — trả lời 2026-10-06)

| # | Câu hỏi | Trả lời của chủ dự án | Ghi chú BA |
| :--- | :--- | :--- | :--- |
| Q1 | Danh mục hệ thống do ai quản trị? | **Platform admin + tenant ghi đè** | Kèm Q2 ⇒ có bản ghi tenant thắng theo `code` |
| Q2 | Tenant ghi đè/ẩn danh mục hệ thống? | **Có, ghi đè và ẩn cục bộ** | Thêm **AC-20** |
| Q3 | "Phòng ban" là gì? | **Danh mục riêng độc lập** | ⚠️ Lệch đề xuất cầu nối — ghi rủi ro ở §4; seed từ cây tổ chức khi cài để tránh rỗng |
| Q4 | Nhập tự do | **Lưu text + nút "Lưu vào danh mục"** | Theo đề xuất |
| Q5 | Version/as-of trên UI | **API đầy đủ, UI xem lịch sử read-only** | Theo đề xuất |
| Q6 | Số phiên bản | **Không giới hạn** | Theo đề xuất |
| Q7 | Import/Export | **Có — làm ngay trong Sprint 5** | ⚠️ Tăng phạm vi: thêm **AC-18/AC-19** + 2 task |
| Q8 | Quy trình duyệt | **Chưa làm ở v1, chỉ phân quyền** | Theo đề xuất |
| Q9 | Đa ngôn ngữ tên danh mục | **1 tên + `name_en` tuỳ chọn** | Theo đề xuất |
| Q10 | Danh mục seed | **Loại hợp đồng + Ca làm việc + Trình độ học vấn** + "gợi ý thêm" | BA đề xuất thêm 8 mục ở §1.1 (6–13) |
| Q11 | Ai tạo loại danh mục | **Tenant owner/admin** | Theo đề xuất |
| Q12 | Xoá danh mục | **Đóng hiệu lực (`valid_to`)** | Theo đề xuất |
| Q13 | Cha–con khác loại | **Có, giới hạn bằng allowlist** | Đã bổ sung `allowed_parent_types` vào DES-DB |
| Q14 | Nhãn hệ thống & nâng cấp | **Tenant sửa cục bộ, nâng cấp không ghi đè** | Theo đề xuất |
| Q15 | Ẩn plugin core | **Không — chỉ hiện trạng thái core** | Theo đề xuất |
| Q16 | Backfill mục seed | **Backfill mọi tenant khi migration** | Theo đề xuất |
| Q17 | Data scope theo item | **Không — chỉ phân quyền theo loại** | Theo đề xuất |
| Q18 | Duyệt scope + AC | **ĐÃ DUYỆT toàn bộ (2026-10-06)** — "ok chốt scope và lập trình đi nhé" | **Gate APPROVED**; 19 task TASK-375…393 mở khoá |

### 3.1. Câu hỏi phát sinh (đã trả lời 2026-10-06)

| # | Câu hỏi | Trả lời của chủ dự án (2026-10-06) | Hệ quả đã cập nhật |
| :--- | :--- | :--- | :--- |
| **N1** | Danh sách danh mục seed | **Chỉ giữ 5 mục đã chốt** | Bỏ 8 mục gợi ý (Hình thức làm việc, Cấp bậc, Loại nghỉ phép, Dân tộc/Quốc tịch, Loại/Nguồn KH, Thanh toán, Nhóm SP/ĐVT, Mức ưu tiên) — §1.1 rút còn 5 |
| **N2** | Dữ liệu địa giới thật | **Seed thật 2 cấp tỉnh→xã** (bỏ huyện) | Thêm **TASK-393**: sinh + seed dữ liệu (cạnh trực tiếp tỉnh→xã) từ tệp CSV commit trong repo; **cần chốt nguồn dữ liệu (N6)** |
| **N3** | Định dạng import | **CSV + `.xlsx` ngay** | Import nhận cả hai; **cần chốt thư viện đọc Excel (N7)** |
| **N4** | Đồng bộ Phòng ban | **Seed một chiều, không đồng bộ lại** | Giữ thiết kế hiện tại (ANL-S05-002 §4.1) |
| **N5** | Quản trị danh mục hệ thống | **Có màn trong cổng Platform** | Thêm **TASK-392**: màn quản trị danh mục hệ thống (dùng lại UI với cờ "hệ thống") |

### 3.2. Câu hỏi chốt tiếp (đã trả lời 2026-10-06)

| # | Câu hỏi | Đề xuất của BA | Trả lời |
| :--- | :--- | :--- | :--- |
| **N6** | **Nguồn dữ liệu địa giới** cho TASK-393 | **Em fetch một lần từ nguồn mở** (`provinces.open-api.vn`, api/v2) ở dev-time → sinh `src/backend/src/main/resources/db/seed/provinces-communes.csv` (**34 tỉnh + 3.321 xã/phường**, cạnh trực tiếp tỉnh→xã, dữ liệu sau sáp nhập 2025); header tệp ghi nguồn/ngày/số dòng; **runtime không gọi mạng** | **Đã chốt (khách 2026-10-06) — đã sinh tệp 2026-10-06** |
| **N7** | **Thư viện đọc `.xlsx`** | **Apache POI** (`poi-ooxml`) ở backend, chỉ dùng cho luồng import — ghi nhận **ngoại lệ thư viện có kiểm soát** (SOL D19) | **Đã chốt (khách 2026-10-06)** |

**Quyết định kỹ thuật nội bộ (Architect tự chốt, không cần khách)**:

1. Bỏ `source`/`source_ref` khỏi `catalog_types` — phương án cầu nối không còn dùng (Q3), giữ lại là YAGNI.
2. Giới hạn import: mặc định **20.000 dòng** (đủ cho dữ liệu địa giới 3.321 xã/phường) và **cấu hình được**; vượt ⇒ `CATALOG_IMPORT_TOO_LARGE`.
3. `catalog_types` **không** versioned ở v1 (chỉ bản ghi danh mục có version); ghi nhận để mở rộng sau nếu cần.
4. Dữ liệu địa giới seed **trong migration/seed script**, không gọi API bên ngoài lúc chạy (runtime độc lập).

## 4. Rủi Ro & Giảm Thiểu (cập nhật)| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| DAG + version sai logic | High | Test riêng cho AC-01…AC-08; ràng buộc ở CSDL |
| **Phòng ban thành 2 nguồn sự thật** (Q3 chọn danh mục riêng) | High | Seed **một chiều** từ `departments` khi cài/backfill; ghi rõ danh mục chỉ phục vụ tra cứu form (cho nhập tự do), cây tổ chức vẫn là nguồn cấu trúc; thêm cảnh báo trong màn quản trị + cân nhắc lệnh đồng bộ lại (task riêng nếu cần) |
| **Import/Export vào phạm vi** (Q7) | Medium | Giới hạn kích thước tệp + validate trước khi ghi; báo cáo lỗi theo dòng; task riêng TASK-390 |
| Ghi đè danh mục hệ thống gây khó tra cứu (Q1/Q2) | Medium | Quy tắc hợp nhất `DISTINCT ON (code)` tenant thắng; UI hiển thị nhãn "ghi đè" trên bản ghi tenant |
| `btree_gist`/`pg_trgm` bị chặn | Medium | Migration tạo extension; fallback kiểm tra ở service (ghi rõ) |
| Phạm vi phình | Medium | Ngoài phạm vi đã chốt ở §1 (approval, đồng bộ ngoài, bitemporal, data-scope) |

## 5. Chữ Ký Xác Nhận (Customer Scope Approval)

> **Trạng thái: APPROVED (2026-10-06).** Chủ dự án đã trả lời đủ 25 câu hỏi (mục 3, §3.1, §3.2) và **chốt scope/AC bằng chỉ đạo trực tiếp** trong phiên làm việc. Không có chữ ký tay giả.

| Vai trò | Xác nhận | Nguồn/ngày |
| :--- | :--- | :--- |
| Khách hàng (Product Owner) | ✅ **ĐÃ CHỐT SCOPE** — 22 AC + 19 task | Chỉ đạo trực tiếp 2026-10-06 ("ok chốt scope và lập trình đi nhé") |
| BA Agent (soạn thảo) | Đã cập nhật theo câu trả lời | 2026-10-06 |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Đề xuất scope + 17 AC + 16 câu hỏi | BA Agent; chờ khách |
| 0.2 | 2026-10-06 | Ghi nhận 18 câu trả lời; thêm AC-18/19/20 (import/export, ghi đè hệ thống); mở rộng seed §1.1; cập nhật rủi ro; gate vẫn Pending | BA Agent; nguồn: hội thoại chủ dự án |
| 0.3 | 2026-10-06 | Chốt N1–N5 (seed 5 mục, seed địa giới 2 cấp, CSV+`.xlsx`, seed một chiều, màn hệ thống Platform); thêm AC-21/AC-22; mở N6 (nguồn dữ liệu) + N7 (thư viện `.xlsx`); gate vẫn Pending | BA Agent; nguồn: hội thoại chủ dự án |
| 0.4 | 2026-10-06 | Chốt N6 (fetch một lần từ `provinces.open-api.vn`) và N7 (Apache POI); **hết câu hỏi**; gate vẫn Pending | BA Agent; nguồn: hội thoại chủ dự án |
| 0.5 | 2026-10-27 | **Đổi AC-13/AC-14**: catalog là **default_install, unlocked**; tenant bật/tắt/gỡ trong quản lý plugin; dữ liệu giữ lại | Chủ dự án chỉ đạo trực tiếp |
| **1.0** | 2026-10-06 | **Gate APPROVED** — chủ dự án chốt scope/AC + 22 AC và cho phép lập trình; 19 task mở khoá | BA Agent; nguồn: chỉ đạo trực tiếp chủ dự án |
