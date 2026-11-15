# Tài Liệu Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu — Sprint 15 (`plugins/purchasing`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | CONF-S15-001 |
| Sprint | Sprint 15 (`sprint_15_plugin_purchasing`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | ⏳ PENDING — Chờ Khách hàng review luồng nghiệp vụ & chốt `Q1`–`Q13` + `AC-01`..`AC-23` |
| Phiên bản | 0.4 |
| Tài liệu đầu vào | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S15-001](../01_raw_notes/01_RAW-S15-001_purchasing_supply_requirements.md) · [BENCH-S15-001](../03_benchmarks/01_BENCH-S15-001_purchasing_supply_benchmarks.md) · [ANL-S15-001](../02_analysis/01_ANL-S15-001_purchasing_supply_workflows.md) |

> [!IMPORTANT]
> Đây là cổng **Confirmation Gate (Bước 04)**. Bước 05 (`SOL-S15-*`), Bước 06 (`DES-S15-*`) và việc lập trình **chỉ được phép khởi động** sau khi Khách hàng phản hồi xác nhận 13 quyết định nghiệp vụ (`Q1`–`Q13`) và chốt bộ tiêu chí `AC-01`–`AC-23`.

---

## 1. Bảng Câu Hỏi Chốt Quyết Định Nghiệp Vụ Mua Hàng & Cung Ứng (`Q1`–`Q13`)

| Mã | Chủ đề cần quyết định | Các phương án lựa chọn | Đề xuất của BA | Phản hồi Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **`Q1`** | **Phạm vi Hình thái Doanh nghiệp (Sản xuất vs Thương mại vs Dịch vụ)** | **(A)** Hỗ trợ đồng thời cả Hàng hóa qua Kho (`STOCKABLE` liên thông `inventory` + `QC`) VÀ Dịch vụ/Chi phí trực tiếp (`SERVICE_OR_EXPENSE` nghiệm thu qua `SES`).<br>**(B)** Chỉ làm mua hàng hóa nhập Kho (`STOCKABLE`), bỏ phần Dịch vụ `SES`. | **Phương án A** (Đáp ứng trọn vẹn thực tế cả công ty Sản xuất, Thương mại và Dịch vụ/Mua sắm nội bộ). | ⏳ Chờ chốt |
| **`Q2`** | **Quy trình `PR -> RFQ -> PO`: Bắt buộc hay Đường tắt Linh hoạt?** | **(A)** Cho phép cấu hình ngưỡng giá trị theo Tenant: Đơn hàng nhỏ hoặc đã có Hợp đồng khung/Bảng giá `AVL` có thể tạo thẳng `PO` (hoặc `PR -> PO`); đơn vượt ngưỡng (VD `>= 20 triệu`) **bắt buộc qua `RFQ` >= 2–3 NCC & Ma trận So sánh**.<br>**(B)** Mọi đơn mua đều phải đi đủ `PR -> RFQ -> PO`. | **Phương án A** (Thực tế DN Việt vừa kiểm soát chặt đơn lớn vừa không làm nghẽn mua lặt vặt khẩn cấp). | ⏳ Chờ chốt |
| **`Q3`** | **Kiểm soát NCC Đạt chuẩn (`AVL`) & Chặn NCC Xấu (`Blacklist`)** | **(A)** Cho phép bật cờ `strict_avl_required` (chỉ mua NVL/SKU từ NCC đã duyệt trong `AVL` — đặc biệt cho Sản xuất), hỗ trợ `MOQ / Lead-time` & chặn `BLACKLISTED`.<br>**(B)** Mua tự do từ bất kỳ NCC nào. | **Phương án A** (Tắt mặc định cho thương mại nhanh, bật cho sản xuất/hàng đặc thù). | ⏳ Chờ chốt |
| **`Q4`** | **Kiểm soát Ngân sách Phòng ban (`Department Budget Check`)** | **(A)** Hỗ trợ thiết lập Ngân sách theo Phòng ban / `Cost Center` & kỳ tài chính; khi vượt ngân sách có cấu hình `Warn + Duyệt ngoại lệ` hoặc `Strict Block`.<br>**(B)** Không kiểm tra ngân sách khi lập `PR/PO`, đẩy sang Sprint Tài chính/Kế toán. | **Phương án A** (Tự chọn bật/tắt theo từng Tenant để phục vụ DN Dịch vụ & Tập đoàn). | ⏳ Chờ chốt |
| **`Q5`** | **Hợp đồng Khung (`Blanket Order`) & Đơn gọi hàng (`Release PO`)** | Bao gồm quản lý Hợp đồng Nguyên tắc chốt giá + sản lượng/ngân sách trần theo kỳ để tạo nhanh `Release PO`? | **Có**, cực kỳ thiết yếu cho cả nhà máy mua NVL và DN dịch vụ/vận chuyển thuê ngoài. | ⏳ Chờ chốt |
| **`Q6`** | **Phân bổ Chi phí Mua hàng (`Landed Cost`) sang `plugins/inventory`** | Cho phép nhập chi phí vận chuyển/hải quan/bốc xếp phân bổ vào các phiếu nhập `GR` (theo Giá trị / SL / Trọng lượng) để cộng vào giá vốn kho? | **Có**, đáp ứng thực tế DN Thương mại nhập khẩu và Sản xuất mua NVL đường dài. | ⏳ Chờ chốt |
| **`Q7`** | **Mức độ chặt chẽ của `3-Way Matching` & `Tolerance`** | **(A)** Mặc định áp dụng **3-Way Match (`PO <-> GR/SES <-> Vendor Bill`)** kèm ngưỡng sai số `Tolerance % / Amount`, cho phép cấu hình `2-Way Match` cho dịch vụ nhỏ.<br>**(B)** Chỉ cần `2-Way Match` (`PO <-> Hóa đơn`). | **Phương án A** (Chuẩn mực kiểm soát nội bộ chống gian lận/thanh toán trùng cho hàng chưa nhận). | ⏳ Chờ chốt |
| **`Q8`** | **Chấm điểm Tự động `Supplier Scorecard`** | Tính điểm tự động `OTD %`, `QC Pass %`, `Match Compliance %` từ chứng từ thực tế (cấm sửa tay điểm định lượng) để xếp hạng `ACTIVE / WATCH`? | **Có**, giúp bộ phận thu mua đánh giá NCC khách quan. | ⏳ Chờ chốt |
| **`Q9`** | **Liên thông Trả hàng NCC & Giảm trừ Công nợ (`Debit Note`)** | Khi trả hàng lỗi cho NCC, gửi lệnh `SUPPLIER_RETURN` sang `plugins/inventory` và chỉ sinh `Debit Note` trừ công nợ phải trả sau khi Kho xác nhận đã xuất trả? | **Có**, đảm bảo khớp 100% giữa hàng xuất trả thực tế tại Kho và công nợ NCC. | ⏳ Chờ chốt |
| **`Q10`** | **Phạm vi Mobile Ionic Cho Sprint 15** | Mobile Ionic tập trung tối giản vào 3 tác vụ hiện trường/quản lý: Tạo nhanh `PR`, Duyệt `PR/PO` (hiển thị ngân sách còn lại & lý do chọn thầu), và Nghiệm thu Dịch vụ `SES` kèm chụp ảnh (`>= 40px`)? | **Có**, các tác vụ nặng như Ma trận so sánh nhiều NCC và 3-Way Match dùng Web Desktop. | ⏳ Chờ chốt |
| **`Q11`** | **Ma Trận Phê Duyệt (`DOA / SoD`) & Lưu Vết 4 Tầng Bất Biến** | Áp dụng bắt buộc cơ chế **Bất kiêm nhiệm (`SoD`)** qua `plugins/workflow` (chặn tự duyệt `PR/PO`, `Buyer != Người nghiệm thu SES`, `Maker-Checker` 2 mắt khi đổi STK ngân hàng NCC/mở `Blacklist`/duyệt `Variance Override`) kết hợp lưu vết 4 tầng (`Approval Timeline`, `Field Before/After Diff`, `Document Lineage`, `Append-only Ledger`) + Drawer `Audit & Lineage`? | **Có**, bắt buộc để chống gian lận nội bộ, đổi STK trước chuyển tiền và đáp ứng kiểm toán tài chính. | ⏳ Chờ chốt |
| **`Q12`** | **Tùy Biến Biểu Mẫu Nhập Liệu Qua `plugins/form` Theo Tenant & Chi Nhánh** | Toàn bộ form nhập liệu Mua hàng (`Supplier KYC`, `PR`, `RFQ`, `PO/Blanket`, `SES`, `Vendor Bill`, `Return`) dựng qua **`plugins/form` (Sprint 08 — 32 loại trường, `GRID` công thức RPN, `SIGNATURE`)** với cơ chế kế thừa 3 tầng (`System Default -> Tenant -> Branch`), khóa `System Locked Core Fields` và lưu `custom_fields_data` (`JSONB`) + `form_version`? | **Có**, tái sử dụng trọn vẹn plugin `form` mặc định luôn bật, đảm bảo tùy biến theo ngành/chi nhánh mà không phá vỡ sổ cái và `3-Way Match`. | ⏳ Chờ chốt |
| **`Q13`** | **Tận Dụng `plugins/document-template` (Sprint 16 — Ưu Tiên Trước) Cho In Ký & Gửi Email NCC** | Ủy quyền toàn bộ việc thiết kế & kết xuất `PR`, **`RFQ` Bulk Mail-Merge mời thầu nhiều NCC**, `PO / Release PO / Change Order`, `Blanket Order (.docx/.pdf)`, **Biên bản Nghiệm thu `SES`** (kèm `GRID`, ảnh, chữ ký `SIGNATURE`), `Debit Note`, `Watermark` và `QR Verify` sang **`plugins/document-template` (Sprint 16)**? | **Có**, không tự viết PDF/mail engine riêng; tận dụng trực tiếp hạ tầng Sprint 16 được làm trước. | ⏳ Chờ chốt |

---

## 2. Phạm Vi Đề Xuất (Proposed Scope — `plugins/purchasing`)

### 2.1. Trong Phạm Vi Sprint 15 (In-Scope)
1. **Master Nhà Cung Cấp, `AVL` & Ngân Sách**:
   - `Supplier 360` (MST chống trùng, tài khoản ngân hàng, liên hệ, `ACTIVE / PROBATION / WATCH / BLACKLISTED`).
   - `AVL` (NCC đạt chuẩn theo SKU, `MOQ`, `Lead-time`), Bảng giá bậc số lượng (`Tiered Pricing`), `Supplier Scorecard` tự động (`OTD`, `QC Pass`, `Match Compliance`).
   - Thiết lập & kiểm tra `Department Budget` theo tháng/quý/năm (với `Committed` vs `Actual`).
2. **Đề Nghị Mua (`PR`), Hỏi Giá (`RFQ`) & So Sánh Báo Giá**:
   - Tạo `PR` từ phòng ban, từ cảnh báo dưới `Min` của Kho (`inventory`), hoặc từ đơn hàng bán (`crm`), hỗ trợ Gộp `PR` (`Consolidation`).
   - `RFQ` nhiều NCC, nhập báo giá quy đổi `Base UoM`, **Ma trận So sánh Báo giá (`Bid Comparison Split-View`)** hỗ trợ *Split Award* và giải trình ngoại lệ khi không chọn giá thấp nhất.
3. **Đơn Hàng Mua (`PO`), Hợp Đồng Khung (`Blanket`) & Nghiệm Thu (`GR/SES/Landed Cost`)**:
   - `Standard PO`, `Blanket Order` & `Release PO` (khóa trần số lượng/giá trị), `PO Change Order` lưu lịch sử sửa đổi.
   - Tách luồng `STOCKABLE` (đồng bộ `Incoming` & `PURCHASE_IN` + QC với `plugins/inventory`) và `SERVICE_OR_EXPENSE` (Nghiệm thu `Service Entry Sheet — SES` nhiều đợt).
   - Phiếu phân bổ Chi phí mua hàng (`Landed Cost`) đẩy điều chỉnh giá vốn sang `plugins/inventory`.
4. **Hóa Đơn Đầu Vào, `3-Way Matching`, Công Nợ Phải Trả (`AP`) & Trả Hàng NCC**:
   - Nhập `Vendor Bill` (chống trùng số hóa đơn/MST), động cơ **`3-Way Matching`** + `Tolerance Limits` -> khóa `BLOCKED_MISMATCH` nếu vượt sai số hoặc duyệt `Variance Override`.
   - `Supplier Payment`, `Supplier Payable Ledger` bất biến, Báo cáo **Tuổi nợ Phải trả (`AP Aging`)**, Báo cáo Chi tiêu (`Spend Analytics`), và Trả lại hàng mua (`SUPPLIER_RETURN` -> `Debit Note`).
   - Toàn bộ bảng dữ liệu dùng `@shared/*` Table cố định Header/Footer, chỉ cuộn Content, ẩn/hiện & đổi thứ tự cột, lọc/sắp xếp đồng bộ URL Query Params và **Context Menu chuột phải** (fallback `>= 40px` Mobile).
5. **Kiểm Soát Phê Duyệt (`DOA / SoD`) & Lưu Vết Kiểm Toán 4 Tầng**:
   - Áp dụng ma trận `DOA` qua `plugins/workflow` + kiểm soát `SoD` (cấm tự duyệt, `Buyer != SES Acceptor`, `Maker-Checker` khi đổi Tài khoản ngân hàng NCC / gỡ `Blacklist` / `Variance Override`).
   - Lưu vết 4 tầng bất biến (`Approval History`, `Before/After Field Diff`, `Document Lineage Graph`, `Append-only Ledger`) và hiển thị trực quan qua Stacked Drawer `Audit & Lineage` (`?drawer=audit`).
6. **Tùy Biến Biểu Mẫu Nhập Liệu Động Theo Tenant & Chi Nhánh (`plugins/form` — Sprint 08)**:
   - Kết xuất toàn bộ form hồ sơ/chứng từ Mua hàng qua `plugins/form` (`32` loại trường, `GRID` công thức RPN, `SIGNATURE`, `Skip Logic`), cơ chế kế thừa 3 tầng (`System -> Tenant -> Branch`), bảo vệ `System Locked Core Fields`, lưu `custom_fields_data` (`JSONB`) + `form_version`, đồng bộ làm biến rẽ nhánh `workflow` & cột lọc Sticky Table.
7. **Kết Xuất Chứng Từ Mua Hàng, In Ký & Gửi Email Hàng Loạt Cho NCC (`plugins/document-template` — Sprint 16)**:
   - Tích hợp `PluginDataServiceGrpc` / Kafka & Stacked Drawer `?drawer=doc-output` của `plugins/document-template` (Sprint 16) cho `PR`, **`RFQ` Bulk Mail-Merge mời thầu đa NCC**, `PO / Blanket / Change Order` (`.docx/.pdf`), **Biên bản Nghiệm thu `SES`** (kèm `GRID`, ảnh & chữ ký `SIGNATURE`), `Debit Note`, đóng `Watermark`, `QR Verify` và lưu log SHA-256.

### 2.2. Ngoài Phạm Vi Sprint 15 (Out-of-Scope — Dời sang Sprint / Plugin khác)
- **Kế hoạch Hoạch định Nguyên vật liệu sản xuất chuyên sâu (`MRP / BOM Explosion / Lệnh sản xuất`)** — Thuộc phân hệ Sản xuất (`manufacturing`); Sprint 15 tiếp nhận `PR` NVL được tạo ra hoặc nhập tay từ bộ phận sản xuất.
- **Cổng Đấu Thầu Điện Tử Công Khai Cho NCC Tự Đăng Nhập (`External Supplier Portal`)** — Hiện tại Buyer nhập lại báo giá từ PDF/Email NCC gửi về; Portal cho NCC tự login tách riêng nếu triển khai sau.
- **Tự động Hạch toán Sổ cái Kế toán Tài chính (`GL Journal Nợ/Có 152/156/331`)** & **Kết nối Ngân hàng Chi Tự Động (`Bank Host-to-Host`)**.

---

## 3. Bộ 23 Tiêu Chí Nghiệm Thu (`AC-01` – `AC-23`)

| Mã AC | Nhóm | Mô tả tiêu chí nghiệm thu cụ thể & đo lường được |
| :--- | :--- | :--- |
| **`AC-01`** | Multi-Tenant & Data Scope | Cô lập dữ liệu triệt để theo `tenant_id` từ JWT; Nhân viên phòng ban chỉ thấy `PR/SES` thuộc phạm vi phòng ban/chi nhánh (`organization`); 0 lỗi rò rỉ dữ liệu giữa các tenant/đơn vị. |
| **`AC-02`** | Độc lập & Entity Registry | Không chứa bảng/logic tồn kho nội bộ; 100% Entity mới đăng ký tại [docs/system/entity_registry/README.md](../../../system/entity_registry/README.md) và giao tiếp `inventory`, `crm`, `organization`, `catalog`, `employee`, `workflow` qua gRPC/Kafka (cấm gọi REST chéo, cấm `size = 100`). |
| **`AC-03`** | Supplier 360, AVL & Pricelist | Quản lý được NCC (chống trùng MST), bảng giá theo bậc số lượng, `MOQ`, `Lead-time`, và cờ `AVL`; chặn phát hành `RFQ/PO` cho NCC `BLACKLISTED` và chặn ngoài `AVL` khi bật `strict_avl_required`. |
| **`AC-04`** | Ngân sách & Concurrency | Khi `Remaining Budget` chỉ đủ cho 1 đề xuất và gửi **>= 5 request duyệt `PR/PO` đồng thời** trên PostgreSQL thật, chỉ đúng **1 request thông qua** (cập nhật đúng `Committed Amount`), các request sau bị chặn/chuyển duyệt vượt ngân sách. |
| **`AC-05`** | PR & Gộp Yêu Cầu | Tạo được `PR` từ 3 nguồn (Phòng ban, Cảnh báo dưới `Min` từ Kho `inventory`, Đơn bán `crm`); hỗ trợ gom nhiều `PR` cùng SKU vào 1 `RFQ/PO` và giữ truy vết về `PR` gốc. |
| **`AC-06`** | RFQ & Ma trận So sánh | Nhập chào giá từ >= 2 NCC cho cùng 1 `RFQ`, quy đổi chuẩn về `Base UoM` trên **Ma trận So sánh Split-View**; hỗ trợ tách chọn nhiều NCC (`Split Award`) và bắt buộc lý do giải trình khi không chọn giá rẻ nhất. |
| **`AC-07`** | Blanket Order & Trần Hợp đồng | Ký được Hợp đồng khung có giới hạn `max_qty/max_amount`; tạo nhiều `Release PO` trừ dần hạn mức an toàn dưới concurrency lock, chặn phát hành nếu vượt trần hợp đồng. |
| **`AC-08`** | PO Tách Luồng Kho vs Dịch vụ | `PO` xác nhận có dòng `STOCKABLE` gọi gRPC/Event đồng bộ chính xác `Incoming Qty` sang `plugins/inventory`; dòng `SERVICE` không chạm Kho mà mở luồng nghiệm thu `SES`. |
| **`AC-09`** | PO Change Order | Cho phép chỉnh sửa `PO` có lưu lịch sử revision; chặn giảm số lượng nhỏ hơn số đã nhận kho/đã xuất hóa đơn; kích hoạt duyệt lại `workflow` khi giá trị tăng vượt ngưỡng cấu hình. |
| **`AC-10`** | Đồng bộ `GR + QC` từ Kho | Nhận Kafka Event `INBOUND_POSTED` từ `plugins/inventory` cập nhật chính xác `received_qty`, `accepted_qty`, `qc_failed_qty` và trạng thái `PARTIALLY_RECEIVED / FULLY_RECEIVED` trên `PO`. |
| **`AC-11`** | Nghiệm thu Dịch vụ (`SES`) | Tạo được một hoặc nhiều đợt `SES` theo %/khối lượng hoàn thành cho `PO` Dịch vụ, đính kèm biên bản và duyệt qua `plugins/workflow` để ghi nhận sản lượng hợp lệ. |
| **`AC-12`** | Phân bổ `Landed Cost` | Nhập chi phí vận chuyển/hải quan phân bổ cho >= 1 phiếu nhập `GR` theo `BY_VALUE / BY_QUANTITY / BY_WEIGHT`, gửi điều chỉnh giá vốn chính xác sang `plugins/inventory`. |
| **`AC-13`** | Chống trùng Hóa đơn & `3-Way Match` | Chặn trùng `(supplier_id, invoice_series, invoice_number)`; chạy đúng `3-Way Match` đối chiếu `PO <-> GR/SES <-> Bill`; tự động chuyển `BLOCKED_MISMATCH` khi lệch giá/lượng vượt `Tolerance`, mở lại khi duyệt `Variance Override`. |
| **`AC-14`** | AP Ledger, Thanh toán & Tuổi nợ | Ghi nhận `Vendor Bill` đạt chuẩn & `Supplier Payment` lên `Supplier Payable Ledger` bất biến; Báo cáo Tuổi nợ phải trả phân loại đúng 5 rổ (`Trong hạn`, `1-30`, `31-60`, `61-90`, `>90 ngày`). |
| **`AC-15`** | Trả hàng NCC & `Debit Note` | Tạo `Purchase Return` (chặn trả vượt SL đã nhận) -> gửi lệnh `SUPPLIER_RETURN` sang `inventory` -> tự sinh `Debit Note` trừ công nợ NCC chỉ sau khi nhận event Kho đã xuất trả xong. |
| **`AC-16`** | `Supplier Scorecard` & Alerts | Tự động tính `OTD %`, `QC Pass %`, `Match Compliance %` từ giao dịch thật (không cho sửa điểm định lượng thủ công); bắn thông báo `in-app-notification` khi `PO` trễ giao hoặc `Blanket Order` sắp cạn trần. |
| **`AC-17`** | API Contract & Code Quality | 100% API Backend tuân thủ 4 khuôn mẫu `api_standards.md`, trả `code` `UPPER_SNAKE_CASE`, dùng DTO `record` và `ResponseKey` (cấm `Map<String, Object>`), tính tiền tệ/quy đổi bằng `BigDecimal`. |
| **`AC-18`** | Data View, Sticky Table & Context Menu | Tất cả màn hình danh sách (`Suppliers`, `AVL`, `PR`, `RFQ`, `PO`, `Blanket`, `SES`, `Bills`, `AP Aging`, `Returns`) dùng Table `@shared/*` cố định Header/Footer (chỉ cuộn Content), lọc, sắp xếp, ẩn/hiện & đổi thứ tự cột, đổi số hàng/trang, đồng bộ URL và **Context Menu chuột phải** (fallback `>= 40px` trên Mobile). |
| **`AC-19`** | Anti-Modal, Route-State, i18n & Zero-Emoji | Dùng Split-View (`Bid Matrix`, `3-Way Match`), Nested Routes (`Supplier 360`) và Stacked Drawers (`?drawer=...`) thay Modal popup; 100% i18n `vi.json`/`en.json`, **0 emoji Unicode**, **0 file `.spec.ts`**. |
| **`AC-20`** | Kiểm thử Thực dụng & Dual-Mode QA | Backend vượt qua JUnit 5 + RestAssured trên **PostgreSQL & Redis thật** (gồm concurrency Budget/Blanket Order & sync gRPC/Kafka với `inventory`); QA chạy Dual-Mode Browser Testing (`>= 1280px` & Ionic `390x844 px`, `overflow = 0`, `touch >= 40px`, **0 `console.error`**) kèm screenshot nghiệm thu. |
| **`AC-21`** | Phê duyệt `SoD` & Lưu vết 4 Tầng | Hệ thống chặn thao tác tự duyệt hoặc kiêm nhiệm (`Buyer` tự nghiệm thu `SES`, tự duyệt `Maker-Checker` đổi STK ngân hàng NCC) với `403 SOD_VIOLATION`; mọi bản ghi `Approval History`, `Field Before/After Diff`, `Document Lineage` bất biến dưới DB (cấm `UPDATE/DELETE`) và xem được trong Drawer `Audit & Lineage`. |
| **`AC-22`** | Tích hợp Dynamic Form Builder (`plugins/form`) | Phân giải biểu mẫu 3 tầng (`Branch Override -> Tenant Override -> System Default`) hoạt động đúng trên các form `Supplier/PR/RFQ/PO/SES/Bill`; `System Locked Core Fields` không thể bị xóa/đổi kiểu; chứng từ cũ mở đúng `form_version` đã lưu trong `JSONB`; trường động chạy được trong điều kiện rẽ nhánh `plugins/workflow` và cột lọc Sticky Table. |
| **`AC-23`** | Kết xuất Chứng từ Mua hàng, `RFQ` Bulk Mail & `SES` (`plugins/document-template`) | Toàn bộ `PR`, `RFQ`, `PO / Blanket / Change Order`, **Biên bản Nghiệm thu `SES`** (kèm `GRID`, ảnh `IMAGE_UPLOAD`, chữ ký `SIGNATURE` từ `plugins/form`) và `Debit Note` kết xuất thống nhất qua `plugins/document-template` (Sprint 16); `Bulk Mail-Merge` `RFQ` gửi tách biệt từng NCC không lộ danh sách đối thủ; chứng từ chưa duyệt `DOA` gắn `Watermark`; bản in chính thức có `QR Verify`. |

---

## 4. Ma Trận Giao Diện & Kiểm Chứng Dual-Mode (Desktop vs. Mobile)

| Màn hình / Luồng chính | Desktop Web (`>= 1280px`) | Mobile Ionic (`390x844 px`) | Trạng thái đồng bộ URL (`Route-Driven`) |
| :--- | :---: | :---: | :--- |
| `Supplier 360`, `AVL`, Bảng giá & `Scorecard` | Đầy đủ (Nested Route + Sticky Table) | Tra cứu nhanh liên hệ & điểm Scorecard NCC | `/purchasing/suppliers/:id/overview|avl|orders|debt` |
| Đề nghị Mua (`PR`) & Budget Check | Đầy đủ (Gộp PR + Kiểm ngân sách) | Tạo `PR` phát sinh nhanh & Duyệt `PR` (`>= 40px`) | `?tab=pr&dept=...&status=...&drawer=pr&id=...` |
| `RFQ` & Ma trận So sánh (`Bid Comparison`) | Đầy đủ (Split-View đa NCC + Split Award) | Xem tóm tắt phương án chọn & Duyệt chọn thầu | `?rfqId=...&mode=compare` |
| `PO` & Hợp đồng Khung (`Blanket Order`) | Đầy đủ (`Standard`, `Release`, `Change Order`) | Duyệt `PO` & Xem tiến độ nhận hàng | `?type=STANDARD|BLANKET&status=...&drawer=po&id=...` |
| Nghiệm thu Dịch vụ (`SES`) & `Landed Cost` | Đầy đủ (SES + Phân bổ chi phí GR) | Tạo `SES` & Chụp ảnh nghiệm thu thực địa | `?poId=...&drawer=ses` |
| `Vendor Bill`, `3-Way Match`, `AP` & Trả NCC | Đầy đủ (3-Column Split-View + Export) | Không thao tác kế toán 3-Way Match trên Mobile | `?matchStatus=BLOCKED_MISMATCH&aging=...` |
| Phê duyệt (`DOA/SoD`) & Drawer `Audit & Lineage` | Đầy đủ (Timeline + Diff + Cây Lineage) | Duyệt qua `Workflow` & Xem Timeline duyệt gần nhất | `?drawer=audit&auditTab=approval|diff|lineage` |
| Tùy biến Biểu mẫu Động (`plugins/form` Tenant/Chi nhánh) | Thiết kế & Publish Form Studio + Render Form động | Điền Form động đã Publish khi tạo `PR` / `SES` (`>= 40px`) | `?entity=...&branchId=...&formVersion=...` |
| Mẫu in `PR/PO/Blanket`, `RFQ` Bulk Mail & `SES` (`plugins/document-template` S16) | Template Studio + Preview PDF/DOCX + Bulk Mail `RFQ` + Email `PO/Debit Note` | Xem/Tải PDF `PO` hoặc Biên bản `SES` & Chia sẻ nhanh (`>= 40px`) | `?drawer=doc-output&templateId=...&format=...` |
