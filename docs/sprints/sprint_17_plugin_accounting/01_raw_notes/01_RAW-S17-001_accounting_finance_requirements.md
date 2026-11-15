# Ghi Chú Yêu Cầu Thô (Raw Notes) — Sprint 17: Plugin Thu Chi & Kế Toán Doanh Nghiệp (`plugins/accounting`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | RAW-S17-001 |
| Sprint | Sprint 17 (`sprint_17_plugin_accounting`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.2 |
| Ngày tạo | 2026-11-15 |

---

## 1. Yêu Cầu Tổng Quan Từ Khách Hàng

> "sprint 17 là về plugin thu chi, kế toán trong công ty. hãy tìm hiểu các loại hình công ty khác nhau và phân tích các luồng làm việc thực tế để mình xem nghiệp vụ"
>
> *(Bổ sung từ Khách hàng)*: "còn thiếu các nghiệp vụ về làm hồ sơ báo cáo tài chính,... với các hồ sơ cho các doanh nghiệp đã ipo nữa"

Trong hệ sinh thái Open-ERP, các phân hệ vận hành ở các Sprint trước đã giải quyết dòng chảy hàng hóa và nghĩa vụ nghiệp vụ ở lớp tác nghiệp:
- `plugins/payroll` (Sprint 10): Tính bảng lương, BHXH, thuế TNCN nhưng cần nơi thực hiện chi trả lương qua ngân hàng và hạch toán chi phí lương.
- `plugins/inventory` (Sprint 13): Theo dõi xuất/nhập/tồn kho và giá vốn tồn kho (`AVCO/FIFO`), nhưng đặt Sổ cái Tài khoản Nợ/Có Giá vốn (`TK 632/152/156`) sang phân hệ Kế toán.
- `plugins/crm` (Sprint 14): Quản lý Đơn bán, Giao hàng và Sổ phụ Phải thu vận hành, đặt Sổ cái `131/511/3331` và đối soát tiền về thực tế sang phân hệ Kế toán.
- `plugins/purchasing` (Sprint 15): Quản lý Đề nghị mua, `3-Way Match` Hóa đơn mua và Sổ phụ Phải trả, đặt Phiếu Chi, Ủy nhiệm chi, đối soát ngân hàng, Sổ cái `331/1331/642` sang phân hệ Kế toán.

Mục tiêu Sprint 17 là xây dựng **`plugins/accounting`** đóng vai trò **Trung tâm Thu - Chi Ngân quỹ (`Treasury`), Kiểm soát Công nợ (`AR/AP Control`) & Sổ cái Kế toán (`General Ledger`)**, phục vụ đồng thời cả **nhu cầu quản trị dòng tiền tinh gọn của Ban Giám đốc / SME** lẫn **chuẩn mực kế toán tài chính Việt Nam (`TT200/2014/TT-BTC` và `TT133/2016/TT-BTC`)**.

---

## 2. Phân Tích Thực Tế Theo 5 Loại Hình Doanh Nghiệp Tại Việt Nam

Một doanh nghiệp thương mại bán lẻ/phân phối vận hành dòng tiền hoàn toàn khác một nhà máy sản xuất, một công ty dịch vụ/dự án, một doanh nghiệp SME tinh gọn, hay một **Công ty Cổ phần Đại chúng đã IPO / Niêm yết (`HOSE / HNX / UPCoM`)**. Nếu ép doanh nghiệp nhỏ dùng màn hình "Nhập bút toán Nợ/Có" sẽ gây quá tải; ngược lại nếu chỉ làm "Sổ thu chi đơn giản" và thiếu lớp **Hồ sơ BCTC (`B01/B02/B03 Gián tiếp/B09 Thuyết minh`) + Hồ sơ Tuân thủ sau IPO (`TT96/2020`, `TT202/2014`, `VAS 26/28/30`, `IFRS`)** thì doanh nghiệp quy mô lớn và đã niêm yết vẫn phải làm thủ công trên hàng chục file Excel rời rạc.

### 2.1. Bảng Đối Sánh Toàn Diện 5 Loại Hình Công Ty

| Trục nghiệp vụ | 1. Thương Mại & Phân Phối (`Trading`) | 2. Sản Xuất (`Manufacturing`) | 3. Dịch Vụ, Dự Án & Xây Lắp | 4. SME Thu - Chi Tinh Gọn (`Cashbook`) | 5. Doanh Nghiệp Đại Chúng / Đã IPO & Niêm Yết (`HOSE/HNX/UPCoM`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Đặc trưng Thu (`Cash In`)** | Tần suất rất cao: Tiền mặt, `VietQR`, COD, cổng thanh toán, công nợ theo đơn hàng (`AR`). | Thu tiền cọc hợp đồng OEM/ODM, thanh toán từng đợt theo lô hàng (`L/C`, chuyển khoản `TT`). | Thu theo giai đoạn nghiệm thu (`Milestone`) hợp đồng/dự án, giữ lại bảo hành 5%. | Thu bán hàng/dịch vụ lẻ vào Quỹ theo Khoản mục Thu. | Ngoài thu SXKD còn có **Thu phát hành cổ phiếu IPO / tăng vốn / ESOP**, thu cổ tức từ công ty con/liên kết, hoàn ứng vốn trái phiếu. |
| **Đặc trưng Chi (`Cash Out`)** | Chi trả NCC theo lô (`Payment Run`), logistics, chiết khấu đại lý, hoàn `RMA`. | Chi NVL chính/phụ (`Landed Cost`), **lương công nhân ca/sản lượng**, điện nước, bảo trì `MRO`. | **Tạm ứng & Hoàn ứng nhân viên (`141`)**, thuê nhà thầu phụ (`SES`), hoa hồng dự án. | Chi vận hành văn phòng, mua sắm nhỏ, lương nhân viên, trả NCC. | Chi **cổ tức tiền mặt cho cổ đông**, mua cổ phiếu quỹ (`419`), **thù lao HĐQT/BKS**, chi giải ngân **đúng hạng mục Bản cáo bạch IPO**. |
| **Hạch toán Giá vốn, Dự phòng & Thuế** | Giá vốn (`TK 632`) lấy từ giá xuất kho `AVCO/FIFO` (`inventory` S13). | Tập hợp `621 + 622 + 627 -> 154 -> 155 -> 632`; khấu hao máy móc nhà xưởng (`214`, `242`). | Tập hợp chi phí theo `Project / Cost Center`; phân bổ trả trước (`242`) & trích trước (`335`). | Phân loại theo **Khoản mục Chi** để ra Lãi/Lỗ dòng tiền tức thì. | Bắt buộc trích lập **Dự phòng (`2291/2293/2294/352`)** hàng quý, tính **Thuế TNDN Hoãn lại (`243/347`)**, ghi nhận chi phí phát hành cổ phiếu (`4112`) & giao dịch chuẩn **IFRS** song hành. |
| **Quản lý Công nợ, Vốn & Bên liên quan** | Tuổi nợ `AR/AP Aging`, hạn mức tín dụng, **bù trừ `AR-AP Offset`**, hóa đơn VAT dày đặc. | Công nợ ngoại tệ `USD/EUR/RMB` (`413/515/635`), theo dõi tiền bảo hành công trình/máy móc. | `Unbilled Revenue` vs `3387`; theo dõi găm tạm ứng `141` của nhân viên dự án. | Danh sách Phải thu/Phải trả kèm ngày đáo hạn cơ bản. | Kiểm soát **Giao dịch Bên liên quan (`RPT` — `VAS 26`)** gắn **Nghị quyết HĐQT/ĐHĐCĐ**, tách công nợ/doanh thu **Nội bộ Mẹ-Con** để loại trừ hợp nhất (`TT202`), tính **`Basic/Diluted EPS` (`VAS 30`)**. |
| **Chế độ Kế toán & Hồ sơ BCTC** | Thông tư `133` hoặc `200`. | Phổ biến nhất **Thông tư `200`** (`621/622/627`) hoặc `TT133` (`154`). | Thông tư `133` hoặc `200` gắn chiều `Project / Cost Center`. | **`CASHBOOK_ONLY`**; lớn lên nâng cấp 1 chạm sang `TT133 / TT200`. | Bắt buộc **TT200 + Hợp nhất TT202 + CBTT TT96/2020**: Đủ bộ **B01/B02/B03 Gián tiếp/B09 Thuyết minh 30+ biểu**, **Báo cáo Bộ phận (`VAS 28`)**, BCTC Quý/Bán niên Soát xét/Năm Kiểm toán (`AJE/RJE`), song ngữ `VAS/IFRS`. |
| **Rủi ro & Điểm nghẽn Kiểm soát** | Sale/Thủ quỹ giữ tiền mặt chậm nộp quỹ; chi trùng hóa đơn; đối soát sao kê tay. | Lệch sổ kho thủ kho vs kế toán; phân bổ sai chi phí chung `627`; quên chạy khấu hao. | Nhân viên găm tạm ứng `141`; doanh thu/chi phí lệch kỳ; chi vượt ngân sách dự án. | Lẫn lộn tiền trong ngân hàng với tiền đã duyệt sắp chi; chứng từ thiếu ký duyệt. | **1. Trễ hạn CBTT (20/30/45/60/90 ngày) bị UBCKNN xử phạt.**<br>**2. Quên lập Công văn giải trình khi LNST lệch `>= 10% YoY`, `Lãi <-> Lỗ` hoặc lệch `>= 5%` sau kiểm toán.**<br>**3. Thiếu Nghị quyết HĐQT cho giao dịch Bên liên quan hoặc sai khác `B09` với Kiểm toán Big4.** |

---

### 2.2. Bài Học Trọng Tâm Từ Thực Tế 5 Loại Hình Công Ty
1. **Không được đánh đồng "Ngày lập phiếu" với "Ngày thực thu/thực chi"**: Thực tế Kế toán lập Phiếu Chi / Ủy nhiệm chi và trình Sếp ký trước (`APPROVED`), có thể 1–3 ngày sau Thủ quỹ mới xuất tiền mặt hoặc Ngân hàng mới cắt tiền (`EXECUTED / POSTED_TO_CASHBOOK`). Nếu cộng trừ tồn quỹ ngay lúc lập phiếu sẽ làm lệch hoàn toàn Quỹ tiền mặt thực tế khi Thủ quỹ kiểm quỹ cuối ngày!
2. **Kiến trúc 2 Tầng (`Dual-Mode`) giải quyết bài toán quy mô doanh nghiệp**:
   - Doanh nghiệp nhỏ / startup / đội vận hành không cần biết Tài khoản `6422`, `3311`, `1311` là gì; họ chỉ chọn Khoản mục `"Chi phí Marketing"`, `"Thu tiền bán hàng"`, `"Trả tiền nhà cung cấp"` -> hệ thống chạy mượt mà Sổ Quỹ, Công nợ và Báo cáo Lãi/Lỗ.
   - Khi doanh nghiệp có Kế toán trưởng hoặc bật chế độ **Chuẩn Thông tư `133` / `200`**, động cơ **Auto-Posting Rules** tự động dịch mỗi Khoản mục Thu/Chi & mỗi sự kiện từ `Kho / Bán hàng / Mua hàng / Lương` thành Bút toán Kép Nợ/Có cân bằng tuyệt đối.
3. **Chiều Phân tích Quản trị (`Analytic Dimensions`) độc lập với Hệ thống Tài khoản (`COA`)**: Thay vì mở hàng trăm tài khoản con kiểu `642.PB1.DA1`, mọi bút toán Thu/Chi và Sổ cái gắn đồng thời các thẻ chiều chuẩn: `branch_id` (Chi nhánh), `department_id` (Phòng ban / Cost Center), `project_id` (Dự án / Hợp đồng), `partner_id` (Khách hàng/NCC/Nhân viên), `cashflow_category_id` (Khoản mục dòng tiền). Nhờ đó **1 dữ liệu gốc phục vụ đồng thời Báo cáo Thuế (TT200/133) và P&L Quản trị theo Dự án/Chi nhánh**.

---

## 3. 13 Trụ Cột Nghiệp Vụ Cốt Lõi Của `plugins/accounting`

### Trụ cột 1: Cấu Hình Chế Độ Kế Toán, Hệ Thống Tài Khoản (`COA`), Sổ Quỹ & Kỳ Kế Toán
- Hỗ trợ 3 cấu hình khởi tạo theo từng Tenant (có thể chuyển đổi nâng cấp một chiều từ Tinh gọn lên Chuẩn kế toán):
  - **`CASHBOOK_ONLY` (Sổ Quỹ & Công nợ Tinh gọn)**: Ẩn giao diện Nợ/Có đối với nhân viên vận hành, tập trung vào **Quỹ/Ngân hàng + Khoản mục Thu/Chi + Công nợ**.
  - **`VAS_TT133` (Thông tư `133/2016/TT-BTC`)**: Nạp sẵn Cây Tài khoản chuẩn Doanh nghiệp Nhỏ và Vừa (nhóm TK `111, 112, 131, 133, 141, 152, 154, 155, 156, 211, 214, 242, 331, 333, 334, 338, 411, 421, 511, 632, 642, 911`).
  - **`VAS_TT200` (Thông tư `200/2014/TT-BTC`)**: Nạp sẵn Cây Tài khoản đầy đủ (`621, 622, 623, 627, 641, 642, 515, 635, 711, 811, 335, 3387, 413...`).
- Quản lý đa **Quỹ Tiền mặt (`Cash Fund` theo Chi nhánh/Tiền tệ)** và đa **Tài khoản Ngân hàng (`Bank Account` gắn Mã BIN ngân hàng NAPAS để sinh `VietQR` động, số dư ban đầu, tài khoản GL ánh xạ `1111/1112/1121/1122`)**.
- Quản lý **Năm Tài chính & Kỳ Kế toán (`Fiscal Year & Monthly Periods`)** hỗ trợ 2 cấp khóa kỳ: `OPEN` → `SOFT_LOCKED` (cảnh báo hoặc chỉ Kế toán trưởng được hạch toán điều chỉnh) → `HARD_LOCKED` (bất biến 100%, muốn mở phải qua `Maker-Checker` duyệt & ghi Audit Log).

### Trụ cột 2: Luồng Thu - Chi Ngân Quỹ & Tách Bạch Vai Trò Kế Toán vs. Thủ Quỹ
- Chu trình chuẩn kiểm soát nội bộ gồm 3 chứng từ tách biệt nhưng liên kết liền mạch:
  1. **Đề nghị Thu / Đề nghị Chi / Đề nghị Thanh toán (`Payment / Receipt Request`)**: Bất kỳ nhân viên/phòng ban nào tạo kèm chứng từ đính kèm (`PO`, `Vendor Bill`, `Hợp đồng`, ảnh hóa đơn), trình duyệt theo hạn mức `DOA`.
  2. **Lập Chứng từ Kế toán (`Phiếu Thu / Phiếu Chi / Ủy nhiệm chi / Báo Có - Báo Nợ Ngân hàng`)**: Kế toán viên tạo từ Đề nghị đã duyệt (hoặc tự động sinh khi gạch nợ), kiểm tra hợp lệ hóa đơn/hạn mức tồn quỹ và chuyển duyệt ký.
  3. **Thực Thu / Thực Chi Ghi Sổ Quỹ (`Cashier / Treasury Execution`)**:
     - Với Tiền mặt: Thủ quỹ nhận lệnh, đếm/chi tiền thực tế và bấm xác nhận **`Đã Thu / Đã Chi (EXECUTED)`** → hệ thống mới ghi nhận vào **Số dư Quỹ thực tế tại thời điểm thực chi** và in/đóng dấu `ĐÃ CHI TIỀN`.
     - Với Ngân hàng: Xuất file bảng kê thanh toán hàng loạt (`Batch Bank Transfer Export` theo chuẩn Excel từng ngân hàng VN) hoặc sinh **`VietQR`** để Sếp/Kế toán chuyển khoản; xác nhận `Đã chuyển tiền (EXECUTED)` khi ngân hàng cắt tiền (hoặc tự khớp với Sao kê Ngân hàng).
- Hỗ trợ nghiệp vụ **Chuyển tiền Nội bộ (`Internal Cash/Bank Transfer`)**: Nộp tiền mặt tại quỹ vào Ngân hàng, Rút tiền Ngân hàng nhập Quỹ tiền mặt, hoặc Chuyển tiền giữa các tài khoản ngân hàng (chặn ghi trùng doanh thu/chi phí — hạch toán qua TK trung gian tiền đang chuyển `113` hoặc `111 <-> 112`).

### Trụ cột 3: Quản Lý Tạm Ứng (`TK 141`) & Quyết Toán Hoàn Ứng / Chi Phí Nội Bộ (`Expense Claim`)
- Chuyên trị bài toán của công ty Dịch vụ, Dự án, Xây lắp và đội Kinh doanh/Mua hàng đi công tác:
  - Nhân viên lập **Đề nghị Tạm ứng (`Employee Advance Request`)** gắn với `Dự án / Phòng ban / Chuyến công tác` và `Ngày cam kết hoàn ứng`. Hệ thống kiểm tra tổng **Dư nợ Tạm ứng chưa hoàn của nhân viên đó** (tự động cảnh báo hoặc chặn nếu đang quá hạn hoàn ứng cũ).
  - Sau khi được duyệt → sinh **Phiếu Chi Tạm ứng / Ủy nhiệm chi** → Thủ quỹ giải ngân → cộng vào **Sổ Theo dõi Tạm ứng Nhân viên (`TK 141`)**.
  - Khi kết thúc công việc, nhân viên nộp **Bảng kê Quyết toán Hoàn ứng (`Expense Claim` dùng `GRID` Form Builder)** kèm ảnh chụp hóa đơn/vé/chứng từ cho từng dòng chi phí (tách thuế GTGT đầu vào nếu có hóa đơn đỏ).
  - Tự động tính **Chênh lệch Quyết toán (`Advance Amount - Approved Expense Amount`)**:
    - Nếu **Chi vượt Tạm ứng**: Tự động sinh **Đề nghị Chi Bổ sung** trả thêm cho nhân viên.
    - Nếu **Chi ít hơn Tạm ứng (Thừa tiền)**: Sinh **Phiếu Thu Hoàn Tạm ứng** (nhân viên nộp trả quỹ) HOẶC gửi lệnh **Khấu trừ vào Kỳ lương gần nhất** sang `plugins/payroll` (theo chính sách Tenant).

### Trụ cột 4: Đối Soát Sao Kê Ngân Hàng (`Bank Reconciliation`), `VietQR` & Đa Tiền Tệ (`Multi-Currency FX`)
- **Import Sao kê Ngân hàng (`CSV / Excel MT940 / OFX` + `VietQR Instant Webhook` nếu bật)**: Tự động nạp từng dòng biến động số dư (Ngày, Số tiền +/- , Nội dung chuyển khoản, Mã giao dịch ngân hàng), chống nạp trùng bằng `bank_tx_ref_hash`.
- **Giao diện Chia Đôi Màn Hình (`Bank Reconciliation Split-View`)**: Bên trái là các dòng Sao kê ngân hàng chưa khớp; bên phải là hệ thống gợi ý chứng từ Open-ERP khớp 1-1 hoặc 1-nhiều (`Match Score`) theo **Số tiền + Nội dung chứa Mã Phiếu Thu/Hóa đơn/Đơn hàng + Khoảng ngày**.
- Hỗ trợ xử lý ngay trên màn hình đối soát các giao dịch chỉ có trên sao kê: **Phí chuyển khoản/quản lý tài khoản (`TK 6425/635`)**, **Lãi tiền gửi cuối tháng (`TK 515`)**, hoặc **Khách chuyển nhầm/thiếu lẻ vài đồng (Gạch nợ kèm Chênh lệch xử lý vào Thu nhập khác `711` / Chi phí khác `811`)**.
- **Đa tiền tệ (`VND`, `USD`, `EUR`, `JPY`, ...)**: Lưu đồng thời `Nguyên tệ (Transaction Currency)` và `Tiền hạch toán quy đổi (Base Currency VND)`, tự động tính **Lãi/Lỗ chênh lệch tỷ giá đã thực hiện (`Realized FX Gain/Loss` TK `515/635`)** khi thu/chi khác tỷ giá lúc ghi nhận công nợ, và hỗ trợ **Đánh giá lại khoản mục tiền tệ cuối kỳ (`Period-End FX Revaluation` TK `413`)**.

### Trụ cột 5: Quản Lý Công Nợ Tổng Hợp (`AR/AP Control`), Đối Trừ Hóa Đơn & Bù Trừ 2 Chiều
- Kết nối đồng bộ 2 chiều với Sổ phụ bán hàng (`crm` S14) và Sổ phụ mua hàng (`purchasing` S15):
  - Khi `crm` phát hành Hóa đơn/Đơn bán ghi nợ → sinh công nợ Phải thu (`TK 131`) trên `plugins/accounting`.
  - Khi `purchasing` hoàn tất `3-Way Match` `Vendor Bill` → sinh công nợ Phải trả (`TK 331`) trên `plugins/accounting`.
- **Gạch nợ Linh hoạt (`Bill-by-Bill Allocation`)**: Một Phiếu Thu/Báo Có có thể phân bổ gạch trừ cho 1 hóa đơn, nhiều hóa đơn (thanh toán 1 lần cho nhiều đơn cuối tháng), hoặc **Tiền khách hàng ứng trước (`Unallocated / Prepayment`)** để trừ dần cho các hóa đơn xuất sau (`FIFO` hoặc chọn tay). Hỗ trợ **Chiết khấu thanh toán sớm (`Early Payment Discount` TK `515/635`)**.
- **Bù trừ Công nợ 2 Chiều (`AR-AP Offset / Contra Entry`)**: Với đối tác **vừa là Khách hàng vừa là Nhà cung cấp** (hoặc chi nhánh/đối tác đổi hàng), cho phép lập **Biên bản Bù trừ Công nợ (`Nợ 331 / Có 131`)** đối trừ trực tiếp số dư 2 bên mà không cần chuyển tiền vòng vo.
- **Lập Đợt Thanh Toán Công Nợ (`AP Payment Run / Payment Batch`)**: Lọc tất cả Hóa đơn mua sắp đến hạn trong 7/14 ngày tới theo độ ưu tiên, đối chiếu **Số tiền Khả dụng (`Available Liquidity`)**, chọn danh sách chi, trình duyệt 1 lần và xuất Ủy nhiệm chi hàng loạt.
- **Báo cáo Tuổi nợ (`AR / AP Aging`) & Nhắc nợ tự động**: Phân nhóm `Trong hạn`, `Quá hạn 1-30`, `31-60`, `61-90`, `> 90 ngày` kèm gửi Biên bản Đối chiếu Công nợ định kỳ.

### Trụ cột 6: Động Cơ Định Khoản Tự Động Liên Plugin (`Auto-Posting Bridge`) & Hạch Toán Tổng Hợp (`GL`)
- Khi Tenant vận hành ở chế độ Kế toán Kép (`TT133 / TT200`), mọi sự kiện tài chính từ các plugin khác được dịch tự động qua **Bảng Quy Tắc Định Khoản (`Account Determination Matrix`)**:
  - Từ `plugins/crm` (S14): Xuất bán ghi nhận doanh thu (`Nợ 131 / Có 511, 3331`), Hàng bán bị trả lại (`Nợ 5213, 3331 / Có 131`).
  - Từ `plugins/inventory` (S13): Nhập mua qua kho (`Nợ 152, 156 / Có 331 hoặc 151`), Phân bổ `Landed Cost` vào kho, **Xuất bán ghi nhận Giá vốn (`Nợ 632 / Có 156, 155`)**, Xuất NVL cho sản xuất (`Nợ 621 hoặc 154 / Có 152`), Kiểm kê thừa/thiếu (`1381/3381/632/711`).
  - Từ `plugins/purchasing` (S15): Hóa đơn mua dịch vụ `SES` (`Nợ 641, 642, 627, 242, 1331 / Có 331`), `Debit Note` trả hàng (`Nợ 331 / Có 152, 156, 1331`).
  - Từ `plugins/payroll` (S10): Khi Bảng lương khóa (`payroll.run.locked`) → tự sinh bút toán tổng hợp tiền lương (`Nợ 622, 627, 641, 642 / Có 334`), trích BHXH/BHYT/BHTN/KPCĐ phần DN và phần NLĐ (`622, 627, 641, 642, 334 / Có 338`), khấu trừ Thuế TNCN (`Nợ 334 / Có 3335`), cấn trừ tạm ứng `141` (`Nợ 334 / Có 141`) → và đề xuất **Đợt Ủy nhiệm chi trả lương Net (`Nợ 334 / Có 112`)**.
- **Bút toán Tổng hợp (`Manual Journal Voucher` - Chứng từ nghiệp vụ khác)**: Cho phép Kế toán lập bút toán điều chỉnh, trích trước chi phí (`Nợ 642, 627 / Có 335`), ghi nhận doanh thu nhận trước phân bổ dần (`3387 -> 511`), bắt buộc tổng `Nợ == Tổng Có` (`Zero Balance Check`).
- **Tập hợp Giá thành Sản xuất / Dự án cơ bản cuối kỳ**: Cho phép tổng hợp chi phí `621/622/627` theo **Kỳ tính giá thành / Lệnh sản xuất / Dự án (`Cost Object`)** từ các phiếu chi/xuất kho/bảng lương để thực hiện kết chuyển sang `154 -> 155` (hoặc `154 -> 632` cho dự án dịch vụ).

### Trụ cột 7: Quản Lý Tài Sản Cố Định (`TSCĐ`), Công Cụ Dụng Cụ (`CCDC`) & Chi Phí Trả Trước (`TK 242`)
- **Sổ Tài sản Cố định (`TK 211 / 213 / 214`) & Sổ CCDC / Chi phí Trả trước (`TK 242`)**:
  - Khởi tạo thẻ TSCĐ/CCDC trực tiếp từ `Vendor Bill` (`purchasing` S15) hoặc nhập mới đầu kỳ: Nguyên giá, Ngày ghi tăng, Số tháng khấu hao/phân bổ, Giá trị còn lại, Phòng ban/Phân xưởng sử dụng (`Cost Center`) và Tài khoản chi phí đích (`6274`, `6414`, `6424`).
  - Hỗ trợ nghiệp vụ **Ghi tăng**, **Điều chuyển bộ phận sử dụng** (tự đổi tài khoản chi phí khấu hao từ kỳ sau), **Đánh giá lại / Nâng cấp nguyên giá**, **Thanh lý / Ghi giảm TSCĐ** (`Nợ 214, 811 / Có 211`).
  - **Chạy Khấu hao & Phân bổ Hàng tháng theo Lô (`Monthly Depreciation & Amortization Run`)**: Tự động tính phần khấu hao của từng tài sản chưa hết hạn, tạo 1 Bút toán Tổng hợp phân bổ chi tiết theo từng phòng ban/phân xưởng, chống chạy trùng 2 lần trong cùng 1 tháng.

### Trụ cột 8: Sổ Thuế GTGT Đầu Vào / Đầu Ra (`VAT Register`) & Kiểm Soát Hóa Đơn
- Ghi nhận thông tin Hóa đơn điện tử hợp lệ trên từng dòng chứng từ mua/bán/chi phí: `Ký hiệu mẫu`, `Số hóa đơn`, `Ngày hóa đơn`, `Mã số thuế đối tác`, `Thuế suất (0%, 5%, 8%, 10%, KCT)`, `Tiền hàng chưa thuế`, `Tiền thuế GTGT`.
- Tự động tổng hợp **Bảng kê Hóa đơn Chứng từ Hàng hóa Dịch vụ Mua vào (`TK 1331/1332`)** và **Bán ra (`TK 3331`)** theo kỳ tháng/quý, phát hiện cảnh báo trùng số hóa đơn + MST NCC trong hệ thống, và thực hiện **Bút toán Khấu trừ Thuế GTGT cuối kỳ (`Nợ 3331 / Có 1331`)**.

### Trụ cột 9: Đóng Kỳ, Trích Lập Dự Phòng (`229/352`), Thuế Hoãn Lại (`243/347`) & Hồ Sơ Báo Cáo Tài Chính Đầy Đủ (`Audit Dossier`)
- **Checklist Đóng Sổ Cuối Kỳ (`Period-End Closing Cockpit`)**: Trước khi khóa kỳ tháng/quý/năm, hệ thống rà soát tự động 8 kiểm tra bắt buộc:
  1. Còn Phiếu Thu/Chi/Chứng từ nháp chưa duyệt trong kỳ không?
  2. Còn dòng Sao kê Ngân hàng trong kỳ chưa đối soát xong không?
  3. Đã chạy Khấu hao TSCĐ (`214`) & Phân bổ CCDC/Chi phí trả trước (`242`) cho kỳ này chưa?
  4. Còn chênh lệch giữa Sổ Quỹ/Sổ phụ Ngân hàng với Sổ cái TK `111/112` hay Sổ phụ `131/331` với Sổ cái `131/331` không?
  5. Đã trích lập / hoàn nhập **Dự phòng cuối kỳ** (`TK 2291` Giảm giá chứng khoán, `2292` Tổn thất đầu tư vào đơn vị khác, `2293` Dự phòng phải thu khó đòi theo tuổi nợ, `2294` Giảm giá hàng tồn kho từ `inventory`, `352` Dự phòng bảo hành/phải trả) chưa?
  6. Đã chạy Bút toán Khấu trừ Thuế GTGT (`3331 vs 1331`), Đánh giá chênh lệch tỷ giá cuối kỳ (`413`) và **Thuế TNDN Hiện hành (`8211 / 3334`) + Thuế TNDN Hoãn lại (`243 / 347 / 8212`)** chưa?
  7. Đã chạy **Kết chuyển Xác định Kết quả Kinh doanh Tự động (`511, 515, 711 -> 911`; `632, 635, 641, 642, 811, 821 -> 911`; `911 -> 4212`)** chưa?
  8. Đã đính kèm bộ **Hồ sơ Kiểm kê & Xác nhận Cuối kỳ** (`Biên bản kiểm kê quỹ 08a-TT`, `Thư xác nhận số dư ngân hàng`, `Biên bản kiểm kê kho/TSCĐ`, `Biên bản đối chiếu công nợ`) chưa?
- **Quản Lý Hồ Sơ Báo Cáo Tài Chính Đầy Đủ (`Full Financial Reporting Package`)**:
  - Đóng gói thành **Hồ sơ BCTC theo Kỳ (`Tháng / Quý / Bán niên Soát xét / Năm Kiểm toán`)** với vòng đời trạng thái: `SELF_PREPARED (Tự lập)` -> `UNDER_AUDIT_REVIEW (Đang kiểm toán/soát xét)` -> `AUDITED_PUBLISHED (Đã kiểm toán & Phát hành)`.
  - Đầy đủ **4 Thành phần BCTC Chính thức + Phụ lục**:
    1. **Bảng Cân đối Kế toán (`B01-DN` Năm, `B01a-DN` & `B01b-DN` Giữa niên độ)**: Tự động tái phân loại Ngắn hạn (`<= 12 tháng`) vs Dài hạn (`> 12 tháng`) theo ngày đáo hạn còn lại của Khoản vay, Phải thu, Phải trả, Chi phí trả trước.
    2. **Báo cáo Kết quả Hoạt động Kinh doanh (`B02-DN`)**: So sánh đa kỳ (Kỳ này vs Cùng kỳ năm trước + Lũy kế đầu năm), tích hợp tính **`Basic EPS` và `Diluted EPS` (`VAS 30`)**.
    3. **Báo cáo Lưu chuyển Tiền tệ (`B03-DN`)**: Hỗ trợ đồng thời **Phương pháp Trực tiếp (`Direct`)** VÀ **Phương pháp Gián tiếp (`Indirect Method`)** (đi từ `Lợi nhuận trước thuế +/- Khấu hao, Dự phòng, Lãi/lỗ tỷ giá chưa thực hiện, Lãi/lỗ thanh lý TSCĐ/đầu tư, Chi phí lãi vay +/- Biến động Phải thu, Tồn kho, Phải trả, Trả trước, Thuế TNDN/Lãi vay đã nộp`).
    4. **Bản Thuyết minh Báo cáo Tài chính (`B09-DN` — 30+ Biểu tự động)**: Tự động đổ số liệu Tiền & Tương đương tiền, Đầu tư tài chính, Phải thu & Dự phòng `2293`, Hàng tồn kho & Dự phòng `2294`, **Bảng ma trận Tăng/Giảm TSCĐ hữu hình/vô hình & XDCB dở dang (`241`)**, **Chi tiết Khoản vay/Trái phiếu theo ngân hàng & kỳ hạn (`341/343`)**, Nghĩa vụ Thuế NSNN, **Bảng Đối chiếu Biến động Vốn Chủ Sở Hữu**, Chi phí SXKD theo yếu tố (`621/622/627/641/642` -> Yếu tố chi phí), Thuế TNDN hiện hành & hoãn lại (`243/347`).
  - **Tiếp Đoàn Kiểm Toán Độc Lập (`Audit Adjustment & Reclassification — AJE / RJE`)**: Lưu riêng lớp bút toán điều chỉnh/phân loại lại do Kiểm toán viên đề xuất sau khi đã khóa kỳ tự lập, xuất tự động **Bảng Đối chiếu BCTC Trước Kiểm toán vs. Sau Kiểm toán** giải trình từng chỉ tiêu thay đổi.

### Trụ cột 10: Nghiệp Vụ & Hồ Sơ Cho Doanh Nghiệp Đại Chúng / Đã IPO / Niêm Yết (`HOSE / HNX / UPCoM`)
- **Quản Lý Vốn Cổ Phần, Cổ Phiếu Quỹ, ESOP, Cổ Tức & `EPS` (`VAS 30`)**:
  - Sổ theo dõi biến động Vốn điều lệ (`TK 4111`), Thặng dư vốn cổ phần (`4112` — trừ chi phí phát hành IPO trực tiếp), Cổ phiếu quỹ (`419`), Lợi nhuận sau thuế chưa phân phối (`421`) và Các quỹ (`414`, `353`).
  - Tính tự động **Số lượng Cổ phiếu Phổ thông Lưu hành Bình quân Gia quyền theo ngày (`Weighted Average Outstanding Shares`)** và pha loãng do **ESOP / Trái phiếu chuyển đổi / Chứng quyền** để ra **`Basic EPS` & `Diluted EPS`**.
  - Theo dõi chi trả **Cổ tức bằng Tiền mặt (`421 -> 3388 -> 112`)** và **Cổ tức bằng Cổ phiếu / Phát hành thưởng (`421 / 4112 -> 4111`)**.
- **Kiểm Soát & Thuyết Minh Giao Dịch Bên Liên Quan (`Related Party Transactions — RPT` theo `VAS 26 / IAS 24`)**:
  - **Danh bạ Bên Liên Quan**: Đánh dấu và liên kết HĐQT, Ban Tổng Giám đốc, Ban Kiểm soát, Kế toán trưởng, Cổ đông lớn (`>= 5%`), Công ty Mẹ/Con/Liên kết và doanh nghiệp/người có liên quan.
  - Gắn cờ cảnh báo & bắt buộc đính kèm **Số/Ngày Nghị quyết HĐQT hoặc ĐHĐCĐ** đối với các giao dịch `RPT` vượt ngưỡng quy định Luật Doanh nghiệp & Luật Chứng khoán.
  - Tự động tổng hợp lên Phụ lục `B09-DN`: **Chi tiết Giao dịch & Số dư Phải thu/Phải trả/Vay với từng Bên liên quan** và **Bảng Thù lao, Tiền lương, Thưởng chi tiết từng thành viên HĐQT, Ban TGĐ, Ban Kiểm soát**.
- **Báo Cáo Bộ Phận (`Segment Reporting` — `VAS 28 / IFRS 8`)**:
  - Tổng hợp Doanh thu thuần, Giá vốn, Lợi nhuận bộ phận, Tài sản bộ phận và Nợ phải trả bộ phận theo **Lĩnh vực kinh doanh (`Business Segment`)** và **Khu vực địa lý (`Geographic Segment`)**.
- **Hợp Nhất Báo Cáo Tài Chính Tập Đoàn (`Consolidated FS` — `Thông tư 202/2014/TT-BTC`)**:
  - Quản lý cấu trúc Sở hữu Mẹ - Con - Liên kết (`% Tỷ lệ sở hữu & Quyền biểu quyết`, `Lợi ích Cổ đông Không Kiểm soát — NCI`).
  - Tự động gắn nhãn Giao dịch Nội bộ (`Inter-company Flag`) khi phát sinh mua bán, vay mượn, chia cổ tức giữa các đơn vị thành viên cùng hệ thống.
  - Workspace **Hợp nhất BCTC**: Tự động tổng hợp CĐPS các công ty thành viên, lập **Bút toán Loại trừ Nội bộ (`Inter-company Elimination`: Doanh thu - Giá vốn nội bộ, Phải thu - Phải trả nội bộ, Lãi/lỗ chưa thực hiện trong Hàng tồn kho/TSCĐ nội bộ, Cổ tức nội bộ, Khoản đầu tư vào công ty con)** để xuất song song **BCTC Riêng (`Separate FS`)** và **BCTC Hợp nhất (`Consolidated FS`)**.
- **Hồ Sơ Công Bố Thông Tin Định Kỳ (`Thông tư 96/2020/TT-BTC`) & Theo Dõi Vốn IPO**:
  - **Lịch Công bố Thông tin (`CBTT Calendar`)**: Tự động nhắc hạn lập & nộp cho UBCKNN / Sở GDCK (Quý: `20/30 ngày`; Bán niên Soát xét: `45/60 ngày`; Năm Kiểm toán: `90 ngày`).
  - **Tự Động Kích Hoạt Công Văn Giải Trình Chênh Lệch Lợi Nhuận**: Khi chạy `B02-DN`, hệ thống tự kiểm tra 3 điều kiện bắt buộc theo Thông tư `96/2020/TT-BTC`: *(1)* `LNST` kỳ này biến động `>= 10%` so với cùng kỳ năm trước; *(2)* `LNST` bị Lỗ hoặc chuyển từ `Lãi <-> Lỗ`; *(3)* `LNST` sau kiểm toán/soát xét chênh lệch `>= 5%` so với BCTC tự lập trước đó. Nếu chạm ngưỡng, tự động mở trình tạo **Công văn Giải trình Chênh lệch Lợi nhuận** (bóc tách sẵn bảng chênh lệch doanh thu, giá vốn, chi phí tài chính, chi phí QLDN/bán hàng) để xuất qua `plugins/document-template`.
  - **Báo cáo Tiến độ Sử dụng Vốn Thu Được Từ Đợt Chào Bán / IPO (`IPO Proceeds Tracking`)**: Theo dõi tách biệt tài khoản tiền vốn IPO, đối chiếu số thực chi lũy kế theo từng **Hạng mục sử dụng vốn trong Bản cáo bạch (`Prospectus Allocation`)** phục vụ kiểm toán báo cáo sử dụng vốn định kỳ 6 tháng.
  - **Lớp Điều Chỉnh Chuyển Đổi Song Hành `VAS <-> IFRS`**: Cung cấp sổ phụ **`IFRS Adjustment Layer`** (ghi nhận chênh lệch `IFRS 16` Thuê hoạt động, `IFRS 15` Doanh thu, `IFRS 9` Tổn thất tín dụng dự kiến `ECL`) để xuất thêm bộ BCTC/Bảng chuyển đổi **`VAS -> IFRS Reconciliation`** song ngữ Việt - Anh mà không làm sai lệch Sổ kế toán `VAS` nộp cơ quan Thuế.

### Trụ cột 11: Ma Trận Phê Duyệt (`DOA / SoD`) & Lưu Vết Kiểm Toán 4 Tầng Bất Biến
- Toàn bộ phê duyệt tài chính đi qua **`plugins/workflow` (Sprint 08)** với quy tắc **Bất kiêm nhiệm (`Segregation of Duties — SoD`)** nghiêm ngặt:
  - Người lập Đề nghị Chi / Đề nghị Tạm ứng **KHÔNG** được tự phê duyệt (`Requester != Approver`).
  - Kế toán lập Phiếu Chi / Ủy nhiệm chi **KHÔNG** được kiêm Thủ quỹ thực xuất tiền (`Accountant Preparer != Cashier Executor`) đối với giao dịch vượt ngưỡng `4-Eyes`.
  - **Maker-Checker (2 mắt kiểm tra)** bắt buộc khi: thay đổi Hệ thống Tài khoản (`COA`), thay đổi **Quy tắc Định khoản Tự động (`Auto-Posting Matrix`)**, mở khóa kỳ kế toán đã `HARD_LOCKED`, duyệt **Bút toán Đảo (`Reversal`)** hoặc **Bút toán Tổng hợp tay (`Manual Journal`)**, hoặc chi ngoại lệ khi tồn quỹ cảnh báo/vượt ngân sách phòng ban.
- **Lưu vết Kiểm toán 4 Tầng (`4-Layer Immutable Audit Trail`)**:
  1. `Approval History`: Ai trình, ai kiểm tra, ai duyệt, ai thực chi, timestamp, IP, thiết bị, ghi chú từ chối.
  2. `Before/After Field Diff`: Lưu diff JSON mọi thay đổi ở trạng thái `DRAFT` (nhất là sửa Số tiền, Số tài khoản thụ hưởng, Tài khoản Nợ/Có, Chi nhánh, Dự án).
  3. `Financial Lineage Graph`: Chuỗi truy xuất nguồn gốc khép kín hai chiều: `Đề nghị mua (S15) / Hợp đồng (S14) / Bảng lương (S10) <-> Hóa đơn <-> Đề nghị Chi <-> Phiếu Chi / Ủy nhiệm chi <-> Dòng Sao kê Ngân hàng <-> Bút toán Sổ cái GL <-> Dòng BCTC`.
  4. `Append-only Cashbook & General Ledger`: **TUYỆT ĐỐI CẤM `UPDATE` hoặc `DELETE`** bất kỳ dòng Sổ Quỹ hay Sổ cái nào đã `POSTED`. Mọi sai sót phát hiện sau khi đã ghi sổ bắt buộc phải xử lý bằng **Chứng từ/Bút toán Đảo âm (`Reversal / Storno`)** ghi rõ chứng từ gốc bị đảo và lý do, tạo vết kiểm toán sạch 100%.

- Mở rộng quy tắc phê duyệt cho **Hồ sơ BCTC & Doanh nghiệp Đại chúng**: Hồ sơ BCTC công bố (tự lập & sau kiểm toán) bắt buộc quy trình duyệt 3 chữ ký điện tử (`Người lập biểu -> Kế toán trưởng -> Tổng Giám đốc/Chủ tịch HĐQT`) và Giao dịch Bên liên quan (`RPT`) vượt ngưỡng bắt buộc đính kèm `Nghị quyết HĐQT/ĐHĐCĐ` đã duyệt trước khi giải ngân.

### Trụ cột 12: Tùy Biến Biểu Mẫu Động (`plugins/form` Sprint 08) Cho Chứng Từ Tài Chính & Phụ Lục
- Kế thừa 3 tầng (`System Default -> Tenant Override -> Branch Override`), khóa `System Locked Core Fields` (Số tiền, Tiền tệ, Tài khoản Nợ/Có, Quỹ/Ngân hàng, Đối tác, Ngày hạch toán, Cờ Giao dịch Bên liên quan `RPT` / Nội bộ `Inter-company`) và lưu trường mở rộng ngành nghề vào `custom_fields_data` (`JSONB`) kèm `form_version`.
- Đặc biệt dùng field **`GRID`** có công thức RPN cho *Bảng kê chi tiết hoàn ứng (`Expense Claim`)*, *Bảng kê chứng từ kèm theo*, *Phụ lục giải ngân Vốn IPO*; dùng **`SIGNATURE` / `IMAGE_UPLOAD` / `FILE_UPLOAD`** cho chữ ký người nhận tiền, hóa đơn/vé gốc chụp từ hiện trường và Nghị quyết HĐQT đính kèm.

### Trụ cột 13: Thiết Kế & Kết Xuất Chứng Từ, Hồ Sơ BCTC, Công Văn IPO & Email (`plugins/document-template` Sprint 16)
- **Không tự viết PDF/Word/Excel engine riêng trong `accounting`**. Ủy thác toàn bộ cho `plugins/document-template` qua Drawer `?drawer=doc-output`:
    - In **Phiếu Thu (`Mẫu 01-TT`)**, **Phiếu Chi (`Mẫu 02-TT`)**, **Giấy đề nghị tạm ứng (`Mẫu 03-TT`)**, **Bảng thanh toán tạm ứng (`Mẫu 04-TT`)**, **Giấy đề nghị thanh toán (`Mẫu 05-TT`)**, **Ủy nhiệm chi** chuẩn form ngân hàng.
    - Nhúng **`VietQR` (chuẩn NAPAS 247)** tự động với Số tài khoản + Số tiền + Nội dung thanh toán mã chứng từ lên Phiếu đề nghị thu tiền / Biên bản đối chiếu công nợ gửi Khách hàng, hoặc lên Đề nghị thanh toán để Kế toán quét thanh toán nhanh.
    - Đóng **`Watermark`** động theo trạng thái (`BẢN NHÁP` khi chưa duyệt, `ĐÃ CHI TIỀN` khi Thủ quỹ đã xuất quỹ, `BẢN SAO LẦN N` khi in lại, `ĐÃ ĐẢO / HỦY` khi đã Storno) và **`QR Verify`** cho chữ ký phê duyệt điện tử khi in ra ký giấy.
    - Xuất đồng loạt **Biên bản Đối chiếu Công nợ (`AR/AP Confirmation Letter`)** và gửi **Batch Email (`Mail-Merge`)** tự động cho danh sách Khách hàng/NCC cuối tháng; kết xuất đồng bộ trọn bộ **Hồ sơ Báo cáo Tài chính Đóng quyển (`PDF/DOCX/XLSX` gồm `B01-DN`, `B02-DN`, `B03-DN Trực tiếp & Gián tiếp`, `Thuyết minh B09-DN`, `BCTC Hợp nhất TT202`, `Bảng chuyển đổi VAS-IFRS`)**, **Công văn Giải trình Chênh lệch Lợi nhuận (`TT96/2020`)** và **Báo cáo Tiến độ Sử dụng Vốn IPO**.

---

## 4. Ràng Buộc Kiến Trúc & Kỹ Thuật (`AGENTS.md`)

1. **Cô lập đa Tenant & Chi nhánh**: Mọi bảng Sổ Quỹ, Công nợ, Sổ Cái, TSCĐ bắt buộc có `tenant_id` lấy từ JWT context đã xác thực; Data Scope theo `branch_id` / `cash_fund_id` tuân thủ RBAC Core.
2. **Độ chính xác Số học Tài chính**: Mọi trường tiền tệ/tỷ giá bắt buộc dùng `NUMERIC(19, 4)` (tiền) và `NUMERIC(19, 8)` (tỷ giá) trong PostgreSQL và `BigDecimal` trong Quarkus Java; cấm dùng `float`/`double`.
3. **Sổ cái Hợp nhất & Cân bằng Tuyệt đối**: Mọi Journal Entry trước khi `POST` bắt buộc thỏa mãn `SUM(debit_base) == SUM(credit_base)` và kỳ kế toán tương ứng phải ở trạng thái cho phép ghi nhận.
4. **Ranh giới Sạch & Chống Gọi Thẳng REST Giữa Các Plugin**: Kết nối với `inventory` (S13), `crm` (S14), `purchasing` (S15), `payroll` (S10), `form/workflow` (S08) và `document-template` (S16) chỉ qua `PluginDataServiceGrpc` & `Kafka Event Hub (Transactional Outbox Pattern)` — hỗ trợ `Idempotency Key` (`source_plugin + source_doc_id + event_version`) để chống hạch toán trùng 2 lần khi Kafka retry.
5. **Entity Registry**: Toàn bộ entity tài chính (`Account`, `CashFund`, `BankAccount`, `PaymentRequest`, `CashVoucher`, `EmployeeAdvance`, `ExpenseClaim`, `JournalEntry`, `BankStatementLine`, `FixedAsset`, `FiscalPeriod`...) bắt buộc đăng ký tại `docs/system/entity_registry/`.
6. **UI/UX & Kiểm thử Chuẩn ERP**:
   - Dùng 100% `@shared/*` UI: **Sticky Scroll Table** (cố định Header & Footer, chỉ cuộn vùng dữ liệu, ẩn/hiện/kéo thả thứ tự cột, đổi số dòng/trang, đồng bộ filter/sort/page lên URL), **Context Menu chuột phải** đầy đủ chức năng (+ Mobile fallback `>= 40px`), **Split-Screen** cho *Đối soát Ngân hàng* & *Hạch toán Kép*, **Stacked Drawers** (`?drawer=audit`, `?drawer=doc-output`), Zero-Emoji, 100% i18n (`vi.json/en.json`).
   - Backend JUnit 5 + RestAssured chạy trực tiếp trên **PostgreSQL + Redis thật** (tuyệt đối cấm H2); Frontend **0 `.spec.ts`**, QA test **Dual-Mode Browser** Desktop (`>= 1280px`) & Mobile (`390x844px`, `0 console.error`, `overflow = 0`).
