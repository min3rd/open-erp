# Phân Tích Đối Thủ & Benchmark Nghiệp Vụ — Plugin Thu Chi & Kế Toán (`plugins/accounting`) (Sprint 17)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | BENCH-S17-001 |
| Sprint | Sprint 17 (`sprint_17_plugin_accounting`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.2 |
| Tài liệu liên quan | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S17-001](../01_raw_notes/01_RAW-S17-001_accounting_finance_requirements.md) · [ANL-S17-001](../02_analysis/01_ANL-S17-001_accounting_finance_workflows.md) |

---

## 1. Mục Tiêu Đối Sánh (Benchmarking Scope)

Tài liệu nghiên cứu & đối sánh **12 hệ thống Quản lý Thu Chi, Ngân quỹ, Kế toán & Lập Hồ sơ BCTC / Công bố Thông tin IPO** tiêu biểu (7 sản phẩm Quốc tế + 5 sản phẩm phổ biến tại Việt Nam) trên thực tế vận hành của **5 loại hình công ty** (*Thương mại, Sản xuất, Dịch vụ/Dự án, SME Thu-Chi Tinh gọn, Doanh nghiệp Đại chúng / Đã IPO & Niêm yết*):
1. Mô hình kiến trúc: Tách rời Thu - Chi đơn giản (`Cashbook`) hay Sổ cái Kép (`Double-Entry General Ledger`), hay hỗ trợ linh hoạt cả hai?
2. Cơ chế tự động hạch toán từ Mua hàng (`P2P`), Bán hàng (`O2C`), Kho (`COGS / Valuation`) và Tiền lương (`Payroll`).
3. Quy trình kiểm soát nội bộ: Phân tách *Người đề nghị -> Người duyệt -> Kế toán -> Thủ quỹ thực xuất quỹ* và bất biến sổ cái (`Audit Trail / Storno Reversal`).
4. Trải nghiệm Tạm ứng & Hoàn ứng nhân viên (`Employee Advance & Expense Claim`), Đối soát Sao kê Ngân hàng (`Bank Reconciliation Split-View`), Bù trừ công nợ `AR-AP`.
5. Bản địa hóa Kế toán Việt Nam: Chuẩn **Thông tư `200/2014/TT-BTC` & `133/2016/TT-BTC`**, Sổ Thuế GTGT, Bộ chứng từ `01-TT / 02-TT / 03-TT / 04-TT`, `VietQR`.
6. **Lập Hồ sơ Báo cáo Tài chính Đầy đủ & Tuân thủ Sau IPO**: `B01-DN`, `B02-DN (EPS VAS 30)`, `B03-DN (Trực tiếp & Gián tiếp)`, **Thuyết minh BCTC `B09-DN` (30+ biểu)**, **Bút toán Điều chỉnh Kiểm toán (`AJE/RJE`)**, **Hợp nhất BCTC (`TT202`)**, **Giao dịch Bên liên quan (`RPT VAS 26`)**, **Báo cáo Bộ phận (`VAS 28`)**, **Giải trình Chênh lệch LNST (`TT96/2020`)** & **Chuyển đổi `VAS <-> IFRS`**.

---

## 2. Hồ Sơ Chi Tiết 12 Đối Thủ

### A. Nhóm Hệ Thống Quốc Tế (Enterprise GL, Consolidation, Disclosure & Cloud Accounting)

#### 2.1. SAP S/4HANA Finance (`FI/CO` — Universal Journal `ACDOCA`)
- **Điểm mạnh cốt lõi (`Single Source of Truth`)**: Thay vì tách rời Sổ Kế toán Tài chính (`FI`) và Sổ Kế toán Quản trị (`CO`), SAP hợp nhất toàn bộ vào bảng **`ACDOCA` (Universal Journal)**: mỗi dòng bút toán vừa mang Tài khoản GL (`Account`), vừa mang đồng thời các chiều phân tích `Company Code`, `Profit Center`, `Cost Center`, `Project / WBS`, `Partner`.
- **Account Determination Tự động**: Khi thủ kho xuất hàng hay bộ phận mua ghi hóa đơn, nghiệp vụ không cần chọn tài khoản kế toán; động cơ **Account Determination** tự tra bảng ánh xạ *(Loại giao dịch + Nhóm vật tư/dịch vụ + Nhóm thuế)* để định khoản tự động.
- **Clearing & Park/Post Workflow**: Tách trạng thái **`Parked Document`** (chứng từ kế toán đã nhập nháp chờ duyệt/đủ chữ ký, chưa lên Sổ cái chính thức) và **`Posted Document`** (đã khóa Sổ cái — chỉ sửa bằng **Reversal/Storno**).
- **Hạn chế đối với SME**: Quá cồng kềnh, người vận hành không thể làm Thu - Chi nhanh kiểu Cashbook nếu chưa cấu hình hàng trăm bảng tài khoản.
- **Bài học cho `plugins/accounting`**: Áp dụng **Single Financial Ledger + Multi-Dimensional Tags (`branch, department, project, partner, cashflow_item`)**, cơ chế **Auto-Posting Rules** và tách bạch **`DRAFT / APPROVED / EXECUTED-POSTED`** + chỉ sửa bằng **Reversal/Storno**.

#### 2.2. Oracle NetSuite Financials
- **Thế mạnh Công ty Dịch vụ / Đa chi nhánh & Kiểm soát Đóng sổ**: Cung cấp **Amortization Schedules** (tự động phân bổ chi phí trả trước theo từng tháng) và **Period-End Closing Checklist** từng bước rõ ràng trước khi khóa tháng, tránh kế toán quên chạy khấu hao hay đánh giá tỷ giá ngoại tệ.
- **SuiteApprovals & SoD**: Cảnh báo và chặn ngay các vi phạm Bất kiêm nhiệm (`Segregation of Duties`) giữa người tạo hóa đơn nhà cung cấp và người duyệt lệnh chi thanh toán.
- **Bài học cho `plugins/accounting`**: Xây dựng **Period Closing Checklist** tự động rà soát chứng từ treo, sao kê chưa khớp, khấu hao chưa chạy trước khi cho phép `HARD_LOCK` kỳ.

#### 2.3. Odoo Accounting (v17/v18)
- **Giao diện Đối soát Ngân hàng Tốt Nhất (`Bank Reconciliation Split-View`)**: Màn hình chia đôi cho phép nhìn dòng sao kê bên trái và danh sách hóa đơn/phiếu thu/bút toán gợi ý bên phải, khớp hàng trăm giao dịch mỗi ngày chỉ bằng 1 click hoặc quy tắc auto-match (`Reconciliation Models` cho phí ngân hàng, lãi tiền gửi, chênh lệch làm tròn).
- **Analytic Accounting & Bill Matching**: Dễ dàng tách 1 hóa đơn chi phí (ví dụ tiền thuê văn phòng/điện) chia tỷ lệ `%` sang nhiều Phòng ban hoặc nhiều Dự án ngay trên lưới chi tiết.
- **Hạn chế tại Việt Nam**: Mẫu báo cáo và Cây tài khoản mặc định theo chuẩn IFRS/Châu Âu, chưa có sẵn chuẩn tách *Kế toán lập Phiếu Chi vs Thủ quỹ xuất tiền mặt* hay biểu mẫu `01-TT/02-TT` và Thuế GTGT theo Thông tư 200/133 nếu không cài thêm gói bản địa hóa VN.
- **Bài học cho `plugins/accounting`**: Sao chép xuất sắc trải nghiệm **Split-View Bank Reconciliation** + **Auto-Match Rules** và khả năng **chia tỷ lệ Analytic Dimensions (`Cost Center / Project`) trên từng dòng chứng từ**.

#### 2.4. ERPNext Accounting
- **Kiến trúc Mã nguồn mở Sạch & Chặt chẽ**: Mọi chứng từ tài chính khi `Submit` đều sinh bản ghi bất biến trong `GL Entry` và `Payment Ledger Entry` (quản lý công nợ `AR/AP`). Khi cần sửa bắt buộc `Cancel` sẽ sinh **Bút toán Đảo đối ứng** giữ nguyên dấu vết gốc.
- **Employee Advance & Expense Claim tách bạch Payroll**: Rất thực tế — nhân viên ứng tiền công tác tạo `Employee Advance`, quyết toán tạo `Expense Claim` gắn nhiều dòng chi phí + ảnh hóa đơn; phần chi thiếu/thừa tự tạo bút toán hoàn quỹ hoặc liên kết cấn trừ lương.
- **Payment Entry & Reconciliation Tool**: Hỗ trợ thanh toán gộp `One-to-Many` (1 lệnh chuyển khoản trả cho 5 hóa đơn cùng lúc, hoặc trả trước tiền cọc rồi đối trừ sau).
- **Bài học cho `plugins/accounting`**: Mô hình hóa rõ **`Employee Advance` + `Expense Claim`**, **Bút toán Đảo (`Cancel -> Reverse GL`)** và **`Payment Reconciliation`** gộp nhiều hóa đơn.

#### 2.5. Xero / QuickBooks Online
- **Thế mạnh Trải nghiệm SME / Chủ doanh nghiệp không chuyên Kế toán**: Người dùng phổ thông chỉ thấy **Tiền vào (`Spend/Receive Money`)**, **Khoản mục Thu/Chi**, **Số dư Ngân hàng**, **Tiền đang chờ thu/chờ trả** và **Báo cáo Dòng tiền trực quan**. Toàn bộ định khoản Nợ/Có chạy âm thầm phía sau mà không làm rối mắt chủ công ty.
- **Cashbook-First + Bank Feeds**: Cực kỳ dễ bắt đầu chỉ trong 15 phút thiết lập.
- **Bài học cho `plugins/accounting`**: Thiết kế **Dual-Mode (`Simple Cashbook Mode` vs `Full VAS Double-Entry Mode`)** để doanh nghiệp nhỏ vận hành nhanh như Xero/KiotViet, trong khi kế toán trưởng bật chế độ Sổ cái vẫn có đầy đủ Nợ/Có chuẩn Thông tư 200/133.

---

### B. Nhóm Hệ Thống Việt Nam (VAS TT200/TT133, Thủ Quỹ & Ngân Quỹ Doanh Nghiệp Việt)

#### 2.6. MISA AMIS Kế toán / MISA SME.NET
- **Chuẩn mực Bản địa hóa Việt Nam số 1**:
  - Hỗ trợ song song **Thông tư `200/2014/TT-BTC`** và **Thông tư `133/2016/TT-BTC`**, bộ chứng từ chuẩn Bộ Tài chính (`01-TT` Phiếu Thu, `02-TT` Phiếu Chi, `03-TT` Đề nghị tạm ứng, `04-TT` Thanh toán tạm ứng, `05-TT` Đề nghị thanh toán), Sổ sách (`S07-DN`, `S03a-DN`, `S03b-DN`) và BCTC (`B01/B02/B03-DN`).
  - **Quy trình Tách Bạch Kế toán Tiền mặt & Thủ quỹ**: Kế toán lập Phiếu Thu/Chi ở trạng thái `Chưa ghi sổ quỹ`, Thủ quỹ đăng nhập phân hệ Thủ quỹ kiểm tiền thật rồi bấm `Ghi sổ Quỹ` mới cập nhật số dư thực tại két! Điều này giải quyết chính xác bài toán thất thoát tiền mặt ở các công ty Việt Nam.
  - **Cảnh báo Hóa đơn & MST**: Nhập hóa đơn mua vào tự kiểm tra trùng số hóa đơn/ký hiệu của cùng NCC, tổng hợp thẳng sang Bảng kê Thuế GTGT.
- **Hạn chế**: Quá nhiều màn hình/popup rườm rà; thiếu luồng Đề nghị chi đa cấp hiện đại (`Workflow DOA`) gắn liền ngân sách & chứng từ mua/bán trên một nền tảng Unified ERP nhẹ nhàng cho người không phải kế toán.
- **Bài học cho `plugins/accounting`**: Áp dụng **2 bước tách bạch `Kế toán lập phiếu` vs `Thủ quỹ ghi sổ quỹ thực tế`**, bộ Tài khoản & Báo cáo chuẩn **TT200 / TT133**, kiểm tra **trùng hóa đơn GTGT đầu vào**, và sinh mã **`VietQR`** trực tiếp.

#### 2.7. Fast Accounting / Fast Business Online
- **Thế mạnh Kế toán Quản trị & Sản xuất**: Cực mạnh ở việc hạch toán **đa chiều phân tích (Khoản mục phí, Vụ việc, Công trình/Dự án, Bộ phận, Sản phẩm)** và **tập hợp chi phí `621/622/627 -> 154 -> 155` tính giá thành sản xuất** theo lệnh sản xuất / kỳ.
- **Hỗ trợ Bù trừ Công nợ (`AR-AP Offset`) & Đánh giá Chênh lệch tỷ giá cuối kỳ (`TK 413`)**: Đáp ứng bài bản doanh nghiệp sản xuất xuất nhập khẩu và xây lắp.
- **Bài học cho `plugins/accounting`**: Đảm bảo mỗi dòng bút toán/thu-chi đều gắn được chiều **`Cost Center + Project/Contract + Expense Item`**, có luồng **Tập hợp chi phí `621/622/627 -> 154 -> 155`** và **Bù trừ công nợ 2 chiều**.

#### 2.8. Bravo ERP (Phân hệ Kế toán Tài chính)
- **Thế mạnh Kiểm soát Tùy biến & Hợp đồng**: Rất mạnh ở cấu hình quy tắc định khoản linh hoạt theo từng loại chứng từ và kiểm soát chi tiết theo từng **Hợp đồng / Đơn hàng / Đợt thanh toán**, lưu vết sửa đổi chứng từ chặt chẽ.
- **Bài học cho `plugins/accounting`**: Cấu hình **Ma trận Quy tắc Định khoản (`Account Determination Matrix`)** dạng bảng rõ ràng (không hardcode trong code Java), kết nối chặt tới `Contract / Order` ở S14 & S15.

#### 2.9. 1Office Finance (Phân hệ Thu Chi, Đề Nghị & Ngân Sách)
- **Thế mạnh Phê duyệt Nội bộ & Tạm ứng/Hoàn ứng**: Người dùng văn phòng/dự án quen dùng vì quy trình *Đề nghị Thanh toán → Đề nghị Tạm ứng → Duyệt đa cấp qua app Mobile → Giải ngân → Hoàn ứng* cực kỳ trực quan, gắn với định mức ngân sách phòng ban.
- **Hạn chế**: Yếu ở phần Sổ cái Kế toán Kép chuẩn Thuế (thường doanh nghiệp vẫn phải xuất Excel sang MISA/Fast để làm BCTC).
- **Bài học cho `plugins/accounting`**: Kết hợp sự tiện lợi của luồng **Đề nghị Thu/Chi - Tạm ứng - Hoàn ứng phê duyệt trên Mobile** như 1Office với **Sổ cái Kép chuẩn Thông tư 200/133** ở phía sau để *không phải nhập liệu 2 lần sang phần mềm kế toán khác*.

#### 2.10. KiotViet / Sapo Sổ Quỹ
- **Thế mạnh Tốc độ cho Thương mại & Cửa hàng**: Tự động tạo Phiếu Thu khi đơn bán hàng thu tiền, tạo Phiếu Chi khi thanh toán phiếu nhập hàng NCC, lọc cực nhanh theo Phương thức thanh toán (Tiền mặt / Chuyển khoản / Quẹt thẻ / COD) và theo Chi nhánh.
- **Bài học cho `plugins/accounting`**: Giữ màn hình **Sổ Quỹ Thu - Chi (`Cashbook Data View`)** tốc độ cao, lọc đa tiêu chí, tính sẵn **Quỹ đầu kỳ + Tổng Thu - Tổng Chi = Tồn cuối kỳ** ngay trên thanh Summary Header.

### C. Nhóm Nền Tảng Hợp Nhất BCTC, Thuyết Minh Kiểm Toán & Disclosure IPO

#### 2.11. SAP S/4HANA Group Reporting (`Consolidation & Inter-company Matching`)
- **Thế mạnh Hợp nhất & Đối chiếu Nội bộ Liên Công ty**: Sử dụng ngay bảng `ACDOCA` kết hợp `ACDOCU` (Consolidation Journal) để tự động ghép cặp **Công nợ & Doanh thu/Giá vốn Nội bộ (`ICMR`)** giữa Công ty Mẹ và các Công ty Con, tự sinh bút toán Loại trừ Nội bộ và tách `NCI`.
- **Parallel Accounting (Multi-GAAP / VAS & IFRS)**: Cho phép dùng chung một bộ chứng từ gốc nhưng duy trì **Extension Ledger** riêng cho các bút toán điều chỉnh chuẩn `IFRS` (như `IFRS 16` Thuê tài sản) mà không làm biến đổi Sổ chính thức nộp thuế địa phương.
- **Bài học cho `plugins/accounting`**: Thiết kế **Lớp Bút toán Loại trừ Hợp nhất (`TT202`)** và **Sổ Điều chỉnh Song hành `IFRS Adjustment Layer`** nằm tách biệt phía trên Sổ cái `VAS`, dễ dàng xuất song song hai bộ BCTC `VAS` & `IFRS`.

#### 2.12. Workiva / Caseware Financial Reporting (`SEC / IPO Disclosure & Notes Automation`)
- **Thế mạnh Tự động hóa Bản Thuyết minh (`B09`) & Kiểm soát Phiên bản Kiểm toán**: Ở các công ty đã IPO, phần khó nhất không phải là lên Bảng CĐKT mà là **soạn Bản Thuyết minh 60–100 trang + Công văn giải trình biến động số liệu + đối chiếu với Kiểm toán Big4** sao cho mọi con số trong văn bản word khớp 100% với Bảng số liệu (`Single-Source Data Linking`).
- **Audit Adjustment Tracking (`AJE / RJE`)**: Lưu thành từng vòng kiểm toán (*Pre-Audit Tự lập -> Kiểm toán đề xuất AJE #1, #2 -> Post-Audit Đã kiểm toán*), có bảng so sánh tự động mức độ chênh lệch trước và sau kiểm toán.
- **Bài học cho `plugins/accounting`**: Dùng dữ liệu cấu trúc từ `plugins/accounting` tự động điền **30+ biểu mẫu Thuyết minh `B09-DN`** và **Công văn Giải trình `TT96/2020`** sang **`plugins/document-template` (S16)**, quản lý trạng thái **`SELF_PREPARED -> UNDER_AUDIT_REVIEW (AJE/RJE) -> AUDITED_PUBLISHED`**.

---

## 3. Ma Trận Đối Sánh Tổng Hợp (12 Đối Thủ × 14 Tiêu Chí)

| Tiêu chí | SAP FI/Group | NetSuite OneWorld | Odoo | ERPNext | Xero/QBO | Workiva / Caseware | MISA AMIS | Fast | Bravo | 1Office / KiotViet | **Open-ERP `accounting`** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1. Dual-Mode (Thu-Chi tinh gọn + GL Kép) | Không | Không | Không | Không | Tốt (ngầm) | Không | Khá | Không | Không | Chỉ Sổ Quỹ | **Full Dual-Mode** |
| 2. Chuẩn Thông tư `200` & `133` VN | Add-on | Add-on | Add-on | Cơ bản | Không | Không | Xuất sắc | Xuất sắc | Xuất sắc | Không | **Có sẵn TT200 & TT133** |
| 3. Tách Kế toán lập phiếu vs Thủ quỹ thực xuất | Có | Hạn chế | Không | Không | Không | Không | Xuất sắc | Có | Có | Khá | **3 Bước chặt (`Request -> Voucher -> Treasury Execute`)** |
| 4. Đối soát Ngân hàng Split-View & `VietQR` | Khá | Tốt | Xuất sắc | Tốt | Xuất sắc | Không | Khá | Cơ bản | Cơ bản | `VietQR` tốt | **Split-View + Auto-Match + `VietQR`** |
| 5. Tạm ứng `141` & Hoàn ứng `Expense Claim` | Tốt | Tốt | Khá | Xuất sắc | Khá | Không | Khá | Khá | Khá | Tốt (1Office) | **Full Advance + `GRID` Claim + Payroll Offset** |
| 6. Auto-Posting từ Kho/Bán/Mua/Lương | Xuất sắc | Xuất sắc | Tốt | Xuất sắc | Hạn chế | Không | Tốt | Tốt | Xuất sắc | Không | **Event-driven + Account Matrix** |
| 7. Bù trừ `AR-AP` & Sổ `TSCĐ/242` | Xuất sắc | Xuất sắc | Tốt | Tốt | Cơ bản | Không | Xuất sắc | Xuất sắc | Tốt | Không | **Có + Chạy khấu hao lô** |
| 8. Hồ sơ BCTC Đầy đủ (`B03` Gián tiếp + `B09` 30+ biểu + `AJE`) | Xuất sắc | Xuất sắc | Khá | Cơ bản | Không | Xuất sắc | Xuất sắc | Khá | Khá | Không | **Full Package + `B03` Gián tiếp + `B09` + `AJE/RJE`** |
| 9. Hợp nhất `TT202` + `RPT VAS 26` + `Segment VAS 28` + `EPS` | Xuất sắc | Xuất sắc | Add-on | Hợp nhất cơ bản | Không | Rất mạnh | Khá (`AMIS Hợp nhất`) | Tốt | Tốt | Không | **Tích hợp sẵn cho DN Niêm yết / Mẹ-Con** |
| 10. Hồ sơ IPO (`CBTT TT96 >=10%/5%`, Vốn IPO, `VAS-IFRS`) | Khá (`Multi-GAAP`) | Tốt | Không | Không | Không | Xuất sắc | Hạn chế | Không | Không | Không | **Tự động giải trình `TT96` + Vốn IPO + `IFRS Layer`** |
| 11. `DOA / SoD` & Lưu vết 4 tầng + Storno | Xuất sắc | Xuất sắc | Tốt | Xuất sắc | Trung bình | Xuất sắc | Khá | Khá | Tốt | Tốt | **`plugins/workflow` SoD + Storno + 4-Layer Audit** |
| 12. Form Builder tùy biến theo Chi nhánh | Hạn chế | Custom Form | Studio | Custom Field | Không | Không | Hạn chế | Hạn chế | Khá | Tốt | **`plugins/form` 3-Tier Override** |
| 13. Thiết kế Mẫu In / `VietQR` / Đóng quyển BCTC & Email | Adobe Forms | Advanced PDF | QWeb | Jinja/Print | Templates | Xuất sắc | Cố định/Sửa ít | Cố định | Khá | Cơ bản | **`plugins/document-template` (Sprint 16)** |
| 14. UI Mật độ cao & Dual-Mode Mobile | Cổ điển | Cổ điển | Khá | Tốt | Web tốt | Web | Khá | Cổ điển | Cổ điển | Tốt | **`@shared/*` Sticky Table + Context Menu + Ionic** |

---

## 4. 14 Bài Học Kiến Trúc Cốt Lõi Rút Ra (`L01`–`L14`)

1. **`L01` — Kiến trúc 2 Chế độ (`Dual-Mode Treasury + Double-Entry GL`)**: Bắt buộc hỗ trợ DN nhỏ dùng **Khoản mục Thu-Chi (`Simple Cashbook`)** không cần nhập Nợ/Có, nhưng kiến trúc dữ liệu phía dưới vẫn sẵn sàng nâng cấp bật **`TT133 / TT200`** và chạy định khoản hồi tố mà không đập đi làm lại.
2. **`L02` — Tách biệt "Chứng từ Đã Duyệt" với "Đã Thực Thu / Thực Chi Ghi Sổ Quỹ"**: Tồn quỹ thực tế chỉ biến động khi Thủ quỹ xác nhận đã thu/chi tiền mặt hoặc Ngân hàng xác nhận đã chuyển/khớp sao kê; các khoản đã duyệt chờ chi được tính vào **`Committed Outflow`** để cảnh báo **Khả dụng Chi tiêu (`Available Liquidity`)**.
3. **`L03` — Bất biến Sổ Quỹ & Sổ Cái (`Append-Only + Storno Reversal`)**: Học SAP FI & ERPNext — tuyệt đối cấm sửa/xóa bản ghi đã `POSTED`. Mọi điều chỉnh sai sót thực hiện qua **Chứng từ/Bút toán Đảo (`Reversal`)** liên kết 1-1 với chứng từ gốc.
4. **`L04` — Ma trận Định khoản Tự động Cấu hình được (`Account Determination Matrix`)**: Học SAP & Bravo — tách logic định khoản ra bảng cấu hình theo *(Loại sự kiện + Khoản mục Thu/Chi / Nhóm hàng + Phương thức thanh toán + Chế độ TT133/TT200)* thay vì hardcode Nợ/Có trong Java.
5. **`L05` — Chiều Phân tích Quản trị Đa chiều Độc lập (`Multi-Dimensional Analytics`)**: Học SAP `ACDOCA` & Fast — gắn `branch_id`, `department_id`, `project_id`, `partner_id`, `cashflow_item_id` vào từng dòng thu/chi/bút toán để ra P&L theo Chi nhánh/Dự án/Phòng ban mà không làm phình Cây Tài khoản.
6. **`L06` — Split-View Đối soát Sao kê Ngân hàng & `VietQR`**: Học Odoo & Xero — tối ưu tốc độ đối soát hàng ngày bằng màn hình chia đôi (Sao kê vs Gợi ý khớp chứng từ + Quy tắc tự động hạch toán Phí/Lãi ngân hàng) và tự sinh mã `VietQR` động có nhúng mã chứng từ vào nội dung chuyển khoản.
7. **`L07` — Khép kín Vòng đời Tạm ứng `141` & Hoàn ứng `Expense Claim`**: Học ERPNext & 1Office — kiểm soát trần dư nợ tạm ứng chưa hoàn theo nhân viên, dùng `GRID` Form Builder kê chi tiết hóa đơn khi hoàn ứng, và tự xử lý chênh lệch thiếu (chi thêm) hoặc thừa (nộp quỹ / khấu trừ lương qua `payroll`).
8. **`L08` — Đối trừ Hóa đơn Linh hoạt (`Bill-by-Bill`) & Bù trừ 2 Chiều (`AR-AP Offset`)**: Học ERPNext & MISA — cho phép 1 Phiếu Thu/Chi trả cho nhiều hóa đơn, hỗ trợ Tiền ứng trước (`Prepayment`), Chiết khấu thanh toán sớm và Biên bản bù trừ `Nợ 331 / Có 131`.
9. **`L09` — Checklist Đóng Kỳ 8 Bước & Khóa Kỳ 2 Tầng (`Soft / Hard Lock`)**: Học NetSuite & MISA — rà soát chứng từ nháp, sao kê chưa khớp, khấu hao TSCĐ/phân bổ `242`, trích lập dự phòng `229/352`, thuế TNDN hoãn lại `243/347`, đối chiếu chênh lệch Sổ phụ - Sổ cái, tự động kết chuyển `911 -> 421` và bộ biên bản kiểm kê/xác nhận trước khi khóa kỳ.
10. **`L10` — Bất kiêm nhiệm Tài chính (`DOA / SoD`) & Lưu vết 4 Tầng**: Tích hợp `plugins/workflow` (S08) bắt buộc `Người đề nghị != Người duyệt != Thủ quỹ thực xuất`, áp dụng `Maker-Checker` khi đổi COA, đổi quy tắc định khoản hoặc mở khóa kỳ kế toán.
11. **`L11` — Tùy biến Biểu mẫu qua `plugins/form` (Sprint 08)**: Khóa chặt `System Locked Core Fields` (Số tiền, Quỹ, Nợ/Có, Đối tác, Ngày hạch toán, Cờ `RPT` & Nội bộ), chỉ cho Tenant/Chi nhánh mở rộng trường quản trị phụ trợ vào `custom_fields_data` (`JSONB`).
12. **`L12` — Ủy thác In Ấn, Đóng Quyển Hồ Sơ BCTC, `VietQR` & Công Văn `TT96` Cho `plugins/document-template` (Sprint 16)**: Tái sử dụng 100% hạ tầng Sprint 16 để in `01-TT`, `02-TT`, `03-TT`, `04-TT`, `Ủy nhiệm chi`, `Sổ Quỹ S07-DN`, `Sổ Cái S03b-DN`, **trọn bộ Hồ sơ BCTC đóng quyển (`B01/B02/B03/B09-DN`, song ngữ Việt - Anh `VAS/IFRS`)**, **Công văn Giải trình Chênh lệch Lợi nhuận `TT96`**, kèm `Watermark` trạng thái, `QR Verify` và gửi Mail-Merge Biên bản đối chiếu công nợ.
13. **`L13` — Đóng Gói Hồ Sơ BCTC Phục Vụ Kiểm Toán (`B03` Gián Tiếp, `B09` Tự Động & Lớp `AJE/RJE`)**: Học Workiva & MISA — tách vòng đời `SELF_PREPARED -> UNDER_AUDIT_REVIEW -> AUDITED_PUBLISHED`, lưu riêng bút toán điều chỉnh/phân loại lại của Kiểm toán viên (`AJE/RJE`) để tự xuất Bảng đối chiếu Trước vs. Sau kiểm toán, đồng thời sinh tự động `B03-DN` Gián tiếp và `30+` biểu Thuyết minh `B09-DN` thay vì gõ tay trên Word/Excel.
14. **`L14` — Kiến Trúc Tuân Thủ Doanh Nghiệp Đại Chúng / Đã IPO & Song Hành `VAS <-> IFRS`**: Học SAP Group Reporting & Workiva — gắn chiều **Segment (`VAS 28`)**, cờ **Bên liên quan (`RPT — VAS 26`)**, cờ **Nội bộ Tập đoàn (`TT202`)** và **Nguồn vốn IPO (`Prospectus`)** ngay từ lúc hạch toán chứng từ gốc; đồng thời cung cấp lớp **`IFRS Adjustment Layer`** song song và cơ chế cảnh báo tự động ngưỡng **chênh lệch LNST `>= 10% YoY` / `>= 5% Sau kiểm toán`** theo **Thông tư `96/2020/TT-BTC`**.
