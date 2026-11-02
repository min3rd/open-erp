# [ANL-S11-001] Phân tích: Plugin KPI — Quản lý & xử lý KPI

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S11-001 / Phân tích / Sprint 11 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S11-001](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) 0.1, [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [RAW-S11-001](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md), [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) / [CONF-S11-001](../04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Phân tích R1–R3 của [RAW-S11-001](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) thành user stories, quy tắc nghiệp vụ và ranh giới scope đề xuất theo bài học [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md). Plugin `kpi` (đề xuất tên) — plugin HR thứ tư: **quản trị thư viện chỉ tiêu → gán theo chu kỳ → cập nhật số liệu → chấm điểm có trọng số → duyệt → publish cho payroll (kênh KPI đã mở ở Sprint 10)**.

Phân vai: **HR** (thư viện, chu kỳ, cấu hình), **Manager** (duyệt/chấm team theo scope), **Employee** (xem KPI, cập nhật actual, self-assessment).

## 2. User Stories

### 2.1. Quản trị chỉ tiêu & thư viện

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-D01 | As an **HR**, I want **định nghĩa KPI (định lượng: đơn vị, target, hướng tốt hơn, ngưỡng; định tính: thang rating)** so that **đo được cả chỉ số và phẩm chất** | BENCH L01 |
| US-D02 | As an **HR**, I want **thư viện KPI mẫu theo nhóm chức danh và tái sử dụng giữa các kỳ** so that **chuẩn hóa và dùng nhanh kỳ sau** | L02 |
| US-D03 | As an **HR**, I want **seed thư viện mẫu phổ biến khi bật plugin** so that **tenant dùng được ngay** | Q2 |
| US-D04 | As an **HR**, I want **gán KPI cho nhân viên/phòng ban theo chu kỳ với trọng số (Σ=100%)** so that **mỗi người có bộ chỉ tiêu đúng vai trò** | L03 |

### 2.2. Chu kỳ & vòng đời

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-C01 | As an **HR**, I want **tạo chu kỳ đánh giá (tháng/quý/năm, tự do) tự kích hoạt theo lịch** so that **vận hành không thao tác tay** | L05 |
| US-C02 | As a **Manager/HR**, I want **duyệt bộ KPI đầu kỳ của nhân viên** so that **chỉ tiêu được thống nhất trước khi chạy** | L06 |
| US-C03 | As an **Employee**, I want **cập nhật actual + minh chứng định kỳ (check-in)** so that **tiến độ minh bạch** | L07 |
| US-C04 | As a **Manager**, I want **nhập hộ actual và phê duyệt/điều chỉnh actual của team** so that **số liệu chính xác** | L07 |
| US-C05 | As a **System**, I want **nhận số liệu tự động từ plugin khác (attendance khi S09 release) qua event/API** so that **chỉ tiêu đo từ hệ thống không nhập tay** | L07 |

### 2.3. Chấm điểm & kết quả

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-SC01 | As an **Employee**, I want **tự đánh giá (self-assessment) kèm nhận xét cuối kỳ** so that **trình bày góc nhìn của mình** | L06 |
| US-SC02 | As a **Manager**, I want **chấm điểm manager assessment cho team** so that **đánh giá có căn cứ hai chiều** | L06 |
| US-SC03 | As a **System**, I want **tính điểm weighted: Σ(achievement × weight) với cap + hướng "càng thấp càng tốt"** so that **điểm tổng nhất quán công bằng** | L03/L04 |
| US-SC04 | As an **HR**, I want **xếp loại (A/B/C/D…) theo ngưỡng điểm cấu hình** so that **quyết định thưởng/tăng lương có căn cứ** | L10 |
| US-SC05 | As a **Manager/HR**, I want **duyệt kết quả cuối kỳ và khóa** so that **kết quả sau khóa bất biến** | L06 |
| US-SC06 | As a **System**, I want **publish kết quả kỳ qua outbox cho payroll tiêu thụ** so that **trọn chuỗi lương thưởng theo hiệu suất** | L08, Sprint 10 |

### 2.4. Giám sát & phân tích

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-M01 | As an **Employee**, I want **dashboard KPI của tôi (tiến độ từng chỉ tiêu, điểm dự kiến)** so that **tự điều chỉnh công việc** | L12 |
| US-M02 | As a **Manager**, I want **dashboard team (heatmap tiến độ, top/bottom)** so that **can thiệp kịp thời** | L12 |
| US-M03 | As an **HR**, I want **báo cáo tổng hợp theo đơn vị/chu kỳ + xuất Excel** so that **quản trị hiệu suất toàn tenant** | |
| US-M04 | As a **System**, I want **cảnh báo KPI chậm tiến độ + nhắc cập nhật actual + nhắc chấm khi đến hạn** so that **kỳ không bỏ sót** | Q13 |

## 3. Ranh giới scope đề xuất (chờ CONF duyệt)

### 3.1. In-Scope đề xuất

- KpiDefinition 2 loại (định lượng: đơn vị/target/hướng/ngưỡng; định tính: thang rating); thư viện mẫu theo nhóm chức danh + seed phổ biến; tái sử dụng giữa kỳ.
- Gán KPI cá nhân/phòng ban theo chu kỳ, trọng số Σ=100%; chu kỳ tự do tự kích hoạt (job multi-tenant idempotent); nhiều chu kỳ song song.
- Vòng đời: tạo/duyệt đầu kỳ → cập nhật actual (self/manager nhập hộ/minh chứng) → chấm (self + manager, tỷ trọng cấu hình) → duyệt kết quả → khóa → publish event `kpi.result.published` (payroll tiêu thụ — kênh KPI Sprint 10 AC-K01).
- Weighted score engine thuần: achievement × weight, cap cấu hình, hướng thấp-tốt; xếp loại theo ngưỡng cấu hình.
- Dashboard self/manager/HR + xuất Excel; cảnh báo chậm/nhắc chấm.
- Mobile: xem KPI + cập nhật actual + chấm + duyệt.

### 3.2. Out-of-Scope đề xuất (backlog)

360 feedback & skills tracking; appraisal tổng hợp đa nguồn (Odoo style); OKR tạo mục tiêu định tính + key results lồng nhau; calibration/forced distribution; KPI liên kết dự án/công việc chi tiết; AI gợi ý KPI (1Office 1AI); benchmark thị trường; cây OKR đồ thị; bảng điểm công khai toàn công ty (visibility scope mở rộng).

## 4. Quy tắc nghiệp vụ đề xuất (BR)

| ID | Quy tắc | Nguồn |
| :--- | :--- | :--- |
| BR-K01 | KPI định lượng: `achievement = actual/target` (hướng cao-tốt) hoặc `target/actual` (thấp-tốt); chia 0 → xử lý theo cấu hình (không đạt/tự do) | Profit.co |
| BR-K02 | Achievement bị chặn ở cap (mặc định 120%, cấu hình) trước khi nhân weight | L04 |
| BR-K03 | Trọng số gán KPI cá nhân Σ = 100% (±0.01 sai số làm tròn); gán thiếu → không mở kỳ chấm | L03 |
| BR-K04 | Điểm kỳ = Σ(achievement × weight) × 100 (thang 100) hoặc theo thang cấu hình; mục định tính quy đổi theo thang rating riêng | L03/L01 |
| BR-K05 | Điểm tổng = self × w_self + manager × w_manager (tỷ trọng cấu hình, mặc định 30/70) | Q4/Q6 |
| BR-K06 | Actual cập nhật append-log (lịch sử giá trị + thời điểm + người nhập + minh chứng); giá trị hiện hành = bản mới nhất | L07 |
| BR-K07 | Kết quả khóa → bất biến; mở khóa chỉ HR/Admin có audit; event publish chỉ sau khóa | L06 |
| BR-K08 | Chỉ tiêu nguồn tự động (attendance) chỉ nhận khi plugin nguồn phát event; trước đó đánh dấu chờ dữ liệu | Q5, Sprint 09 |
| BR-P09 | KPI cá nhân kế thừa trạng thái nhân viên: nghỉ việc giữa kỳ → chỉ tính phần kỳ làm việc | Sprint 07 |
| BR-K10 | Multi-tenant: mọi bảng/job mang tenant_id đã xác thực; quyền xem theo cấu hình visibility (self/manager/HR) | L11 |
| BR-K11 | Chu kỳ tự kích hoạt: job tạo kỳ mới theo lịch (lặp tháng/quý/năm) từ template chu kỳ; idempotent theo (tenant, chu kỳ, kỳ hiệu lực) | L05 |
| BR-K12 | Thông báo qua notification plugin: mở kỳ, nhắc cập nhật, nhắc chấm, kết quả đã duyệt | Q13 |

## 5. Edge cases cần thiết kế (bước 05–06)

| # | Tình huống | Đề xuất xử lý |
| :--- | :--- | :--- |
| E01 | Nhân viên vào/việc giữa kỳ | KPI tính phần kỳ làm việc; achievement quy theo số ngày hiệu lực |
| E02 | Trọng số không đủ 100% khi khởi tạo kỳ | Chặn mở chấm; cảnh báo trước khi duyệt đầu kỳ |
| E03 | Target = 0 hoặc actual = 0 | BR-K01: cấu hình xử lý chia 0 (không đạt hoặc achievement max); documentation rõ |
| E04 | Actual vượt target nhiều lần trong kỳ (append log) | Giá trị hiện hành = bản cuối; achievement tính theo bản cuối kỳ |
| E05 | KPI phòng ban khi phòng đổi tổ chức giữa kỳ | KPI gán theo snapshot tổ chức tại thời điểm gán; không tự trôi |
| E06 | Manager thay đổi giữa kỳ | Chấm mới theo manager hiện tại; bản chấm cũ giữ lịch sử |
| E07 | Chu kỳ trùng nhau (tháng nằm trong quý) | Nhiều chu kỳ song song độc lập; tenant cấu hình tránh trùng loại |
| E08 | Không chấm self trước hạn | Manager vẫn chấm được; tự đánh giá để trống → điểm chỉ từ manager (cấu hình) |
| E09 | KPI nguồn tự động thiếu dữ liệu cuối kỳ | Đánh dấu "thiếu dữ liệu"; HR quyết định tính/tạm excluding có audit |
| E10 | Publish kết quả khi payroll chưa cài | Event vẫn phát; payroll tiêu thụ khi cài; kết quả lưu trữ truy vết được |

## 6. Câu hỏi chuyển sang CONF

16 câu hỏi tại [RAW-S11-001 §6](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) chuẩn hóa thành 16 câu tương tác tại [CONF-S11-001](../04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md), 4 nhóm: (A) mô hình chỉ tiêu — Q1–Q4, (B) cập nhật số liệu — Q5–Q8, (C) chấm điểm & kết quả — Q9–Q12, (D) giám sát & tích hợp — Q13–Q16.

Rủi ro kiến trúc cần chủ dự án lưu ý:
- **Q8 (duyệt)**: workflow engine Sprint 08 đang In Review — như Sprint 09/10, cần phương án fallback.
- **Q5 (nguồn actual tự động)**: attendance (S09) chưa release — v1 chỉ Manual + cấu trúc nhận event sẵn.
- **Q16 (form builder)**: dùng form builder cho câu hỏi định tính là phụ thuộc Sprint 08 thứ hai.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: 18 US, scope đề xuất, 12 BR, 10 edge case, ánh xạ 16 câu hỏi CONF |
