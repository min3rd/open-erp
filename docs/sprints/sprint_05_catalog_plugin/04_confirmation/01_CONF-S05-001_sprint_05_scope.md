# [CONF-S05-001] Biên Bản Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu Sprint 05

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S05-001 / Scope & AC / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Pending — chờ chủ dự án xác nhận** / 0.1 / 2026-10-06 |
| Owner / reviewer | BA Agent / **Khách hàng (Product Owner)** |
| Đầu vào | [RAW-S05-001](../01_raw_notes/01_RAW-S05-001_catalog_plugin_requirements.md), [ANL-S05-001](../02_analysis/01_ANL-S05-001_catalog_data_model_problems.md), [ANL-S05-002](../02_analysis/02_ANL-S05-002_admin_features_permissions_dynamic_forms.md), [BENCH-S05-001](../03_benchmarks/01_BENCH-S05-001_catalog_patterns_in_erp.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [SOL-S05-001](../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) |

> **Gate**: tài liệu này **chưa được duyệt**. Giá trị dưới đây là **đề xuất của BA**; khách hàng xác nhận hoặc chỉnh ở mục 5. Không viết mã Sprint 05 trước khi gate này đóng.

## 1. Phạm Vi Đề Xuất

Xây **plugin core đầu tiên**: `catalog` (Danh mục & quản trị danh mục) — hạ tầng danh mục dùng chung cho mọi plugin khác, luôn bật cho mọi tenant.

**Trong phạm vi**

1. Mô hình dữ liệu danh mục: loại danh mục, bản ghi danh mục, **quan hệ cha–con đa cha (DAG)**, **version + hiệu lực theo thời gian**.
2. CRUD danh mục + **phân quyền hai tầng** (quyền module + quyền theo từng loại danh mục).
3. **API cho form động**: schema loại, options lazy (phân trang/tìm kiếm/lọc theo cha/as-of), resolve theo id, tạo nhanh khi nhập tự do.
4. **Component trường danh mục dùng chung** (autocomplete **hoặc** nhập tự do) cho Web + Mobile.
5. **Danh mục cố định cho doanh nghiệp**: Chức danh, Phòng ban (cầu nối), và một số loại phổ biến khác.
6. **Plugin core luôn bật**: cài tự động cho tenant mới, backfill cho tenant hiện có, không gỡ được.
7. Màn quản trị danh mục (Desktop): danh sách cây/đa cha, form sửa, quản trị quan hệ, quản trị quyền theo loại.

**Ngoài phạm vi (v1)**: quy trình duyệt thay đổi; import/export Excel/CSV; đồng bộ địa giới hành chính từ API bên ngoài; bitemporal đầy đủ; đa ngôn ngữ cho **tên** danh mục; di trú cây phòng ban khỏi Core.

## 2. Tiêu Chí Nghiệm Thu Đề Xuất (Given/When/Then)

| AC | Nội dung | Nguồn |
| :--- | :--- | :--- |
| **AC-01** | **Given** loại danh mục có phân cấp, **When** tạo cạnh `tỉnh→huyện` và `huyện→xã`, **Then** truy vấn con cháu của tỉnh trả đúng huyện và xã (2 cấp). | R1 |
| **AC-02** | **Given** tỉnh A và xã X, **When** tạo **trực tiếp** cạnh `tỉnh A → xã X` (không qua huyện), **Then** cạnh được lưu và xã X là con cháu cấp 1 của tỉnh A, **không** sinh cạnh `tỉnh→huyện→xã` ngầm. | R2 |
| **AC-03** | **Given** danh mục "Lập trình viên", **When** gán nó làm con của **cả** "Công nghệ thông tin" **và** "Khoa học dữ liệu", **Then** cả hai quan hệ cùng tồn tại, truy vấn theo **từng** cha đều trả về nó, và API trả về danh sách cha (nhiều hơn 1). | R3 |
| **AC-04** | **Given** "Công việc" là con của "Ngành" (CLASSIFICATION) và của "Phân bổ" (ALLOCATION), **When** truy vấn theo loại quan hệ, **Then** phân biệt được hai quan hệ; xoá một quan hệ không ảnh hưởng quan hệ còn lại. | R3 |
| **AC-05** | **Given** cạnh `A→B` đã có, **When** tạo cạnh `B→A` (hoặc chu trình dài hơn), **Then** hệ thống **từ chối** với mã lỗi `CATALOG_EDGE_CYCLE`, dữ liệu không đổi. | ANL E1 |
| **AC-06** | **Given** một danh mục đã có phiên bản hiệu lực, **When** sửa nó, **Then** tạo **phiên bản mới** với `valid_from` mới, bản cũ được đóng `valid_to`, và `GET ...?as_of=<thời điểm cũ>` trả về **đúng nội dung cũ**. | R4 |
| **AC-07** | **Given** hai phiên bản cùng `(tenant, loại, mã)`, **When** lưu khoảng hiệu lực **chồng lấn**, **Then** CSDL **từ chối** (ràng buộc EXCLUDE) và API trả lỗi có mã riêng. | R4 |
| **AC-08** | **Given** quan hệ cha–con, **When** đặt `valid_to` cho cạnh, **Then** sau thời điểm đó quan hệ không còn hiệu lực (truy vấn mặc định không thấy) nhưng vẫn tra được bằng `as_of`. | R4 |
| **AC-09** | **Given** người dùng có quyền module `catalog:item:manage` **nhưng không** có grant trên loại "Ngành", **When** mở màn danh mục, **Then** loại đó **chỉ đọc** (hoặc ẩn) và API từ chối ghi với mã `CATALOG_TYPE_FORBIDDEN`; có grant ⇒ ghi được. | R5 |
| **AC-10** | **Given** form động có trường tham chiếu loại danh mục, **When** người dùng gõ tìm, **Then** API options trả **phân trang** (mặc định 20, tối đa 100), lọc theo `q`, theo `parent_id` và gộp **tenant + hệ thống** (tenant thắng theo `code`). | R6 |
| **AC-11** | **Given** form đã lưu chỉ có `catalog_item_id`, **When** mở lại form, **Then** trường hiển thị đúng tên qua API resolve **theo lô** (không N+1). | R6 |
| **AC-12** | **Given** trường cho phép nhập tự do, **When** người dùng nhập giá trị không có trong danh mục, **Then** lưu được `{text}` (không có `catalog_item_id`); nếu có quyền `catalog:item:inline-create` thì có thể lưu thành mục mới và nhận `catalog_item_id`. | R7 |
| **AC-13** | **Given** tenant mới đăng ký, **When** hoàn tất đăng ký, **Then** plugin `catalog` ở trạng thái **đã cài/ACTIVE** và danh mục cố định (Chức danh, Phòng ban…) sẵn dùng; **và** với tenant **đã tồn tại**, migration backfill cũng cài plugin + seed danh mục. | R8 |
| **AC-14** | **Given** plugin `catalog` là core/locked, **When** tenant admin thử gỡ cài đặt, **Then** hệ thống **chặn** và trả mã lỗi rõ ràng. | R8 |
| **AC-15** | **Given** hai tenant khác nhau, **When** mỗi tenant tạo danh mục cùng mã, **Then** dữ liệu **không rò rỉ chéo**; danh mục hệ thống hiển thị cho cả hai. | Ràng buộc dự án |
| **AC-16** | **Given** plugin `catalog` được cài, **When** kiểm tra Entity Registry, **Then** `CatalogType`, `CatalogItem`, `CatalogItemEdge` đã đăng ký; manifest khai báo ma trận **Desktop/Mobile** (CRUD = Desktop, tra cứu = cả hai). | Ràng buộc dự án |
| **AC-17** | **Given** màn quản trị danh mục, **When** xem một mục đa cha, **Then** hiển thị **danh sách cha** và breadcrumb theo đường đang chọn (không giả định 1 cha); **không** dùng modal (Drawer/Router). | R5 |

## 3. Câu Hỏi Cần Chốt

| # | Câu hỏi | Đề xuất của BA | Trả lời |
| :--- | :--- | :--- | :--- |
| Q1 | Danh mục **hệ thống** (tỉnh/huyện/xã, ngành, chuyên ngành) do ai quản trị? | Platform admin; tenant chỉ đọc | ⏳ |
| Q2 | Tenant có được **ghi đè/ẩn** danh mục hệ thống (theo `code`) không? | Có — tạo bản ghi tenant cùng `code` để ghi đè/ẩn; đơn giản và đủ dùng | ⏳ |
| Q3 | "Phòng ban": cầu nối sang cây tổ chức, danh mục riêng, hay di trú? | **Cầu nối** (một nguồn sự thật), cho nhập tự do khi chưa có trong cây | ⏳ |
| Q4 | Nhập tự do: chỉ lưu text, hay tự tạo mục? | Lưu text mặc định; tạo mục khi có quyền `inline-create` và người dùng bấm "Lưu vào danh mục" | ⏳ |
| Q5 | Version: hiển thị lịch sử (as-of) trên UI hay chỉ API? | API đầy đủ; UI v1 chỉ hiện "phiên bản hiện tại" + nút xem lịch sử (read-only) | ⏳ |
| Q6 | Giữ bao nhiêu phiên bản? | Không giới hạn (đóng hiệu lực, không xoá) | ⏳ |
| Q7 | Có cần **import/export** danh mục (CSV/Excel)? | Chưa làm ở v1; tách task riêng nếu cần | ⏳ |
| Q8 | Có cần **quy trình duyệt** khi sửa danh mục hệ thống? | Chưa làm ở v1 (chỉ phân quyền) | ⏳ |
| Q9 | Tên danh mục có cần **đa ngôn ngữ** không? | v1: một tên + `name_en` tuỳ chọn; đa ngôn ngữ đầy đủ ở sprint sau | ⏳ |
| Q10 | Danh mục cố định nào cần seed sẵn ngoài Chức danh/Phòng ban? | Đề xuất: Loại hợp đồng, Ca làm việc, Trình độ học vấn | ⏳ |
| Q11 | Ai được tạo **loại danh mục mới** trong tenant? | Tenant owner/admin (`catalog:type:manage`); loại hệ thống chỉ platform | ⏳ |
| Q12 | Xoá danh mục: đóng hiệu lực hay xoá hẳn? | Đóng hiệu lực (`valid_to`); không xoá cứng để không phá tham chiếu | ⏳ |
| Q13 | Cha–con **khác loại** (JOB ⊂ INDUSTRY): có bắt buộc cùng loại không, và có giới hạn danh sách loại cha được phép? | Cho khác loại; giới hạn bằng `allowed_parent_types` khai báo theo loại con | ⏳ |
| Q14 | Nhãn danh mục **hệ thống**: sửa được theo tenant hay cố định theo i18n? Bản nâng cấp sau có ghi đè nhãn tenant đã sửa? | Seed theo i18n; tenant được đổi nhãn cục bộ (bản ghi tenant cùng `code`); nâng cấp **không** ghi đè nhãn tenant | ⏳ |
| Q15 | Super Admin có được **ẩn** plugin khỏi UI (dù không gỡ)? Khi bản mới thêm mục seed thì backfill **mọi** tenant hay chỉ tenant mới? | Không ẩn được (chỉ hiển thị trạng thái core); backfill mọi tenant khi migration | ⏳ |
| Q16 | Phân quyền **dữ liệu theo item** (chi nhánh/phòng ban) có cần ở v1? | Không — v1 chỉ phân quyền theo **loại** danh mục; data-scope để sprint sau nếu phát sinh | ⏳ |

## 4. Rủi Ro & Giảm Thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| DAG + version làm truy vấn phức tạp, dễ sai | High | Recursive CTE có test riêng cho chu trình/nhảy cấp/đa cha; closure table là phương án dự phòng |
| Trùng lặp nguồn sự thật "Phòng ban" | High | Chốt Q3 trước khi code; phương án cầu nối |
| Danh mục lớn làm autocomplete chậm | Medium | Phân trang + index tìm kiếm; đo trước khi tối ưu |
| Ràng buộc EXCLUDE cần `btree_gist` | Medium | Kiểm tra extension trong migration; fallback kiểm tra ở service (ghi rõ) |
| Phạm vi phình (import/export, approval, đa ngôn ngữ tên) | Medium | Đã liệt kê ngoài phạm vi v1; khách chốt Q7/Q8/Q9 |

## 5. Chữ Ký Xác Nhận (Customer Scope Approval)

> **Trạng thái: PENDING.** Chưa có xác nhận của khách hàng cho scope/AC đề xuất ở mục 1–2. Ghi nhận trung thực: yêu cầu gốc đã có (RAW-S05-001) nhưng **AC và các câu trả lời Q1–Q12 chưa được chốt**.

| Vai trò | Xác nhận | Nguồn/ngày |
| :--- | :--- | :--- |
| Khách hàng (Product Owner) | ⏳ Chưa xác nhận | — |
| BA Agent (soạn thảo) | Đã soạn đề xuất | 2026-10-06 |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Đề xuất scope + 17 AC + 12 câu hỏi | BA Agent; chờ khách |
