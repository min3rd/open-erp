# [CONF-S11-001] Scope, Acceptance Criteria & Câu hỏi — Sprint 11: Plugin KPI

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S11-001 / Xác nhận / Sprint 11 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt scope & AC qua hội thoại tương tác (nội dung 0.2 giữ nguyên) |
| Owner / reviewer | BA Agent / Chủ dự án (người duyệt) |
| Đầu vào | [RAW-S11-001](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) 0.1, [ANL-S11-001](../02_analysis/01_ANL-S11-001_kpi_plugin.md) 0.1, [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 05 SOL mở sau khi APPROVED |

## 1. Mục tiêu Sprint 11 (đề xuất)

Bàn giao **1 plugin nghiệp vụ chạy được trên tenant thật** theo yêu cầu trực tiếp của chủ dự án:

**Plugin `kpi`** (đề xuất tên) — quản lý & xử lý KPI:

1. **Quản trị chỉ tiêu**: KpiDefinition 2 loại (định lượng target/actual + định tính rating), thư viện mẫu theo nhóm chức danh (seed phổ biến), gán theo chu kỳ với trọng số Σ=100%.
2. **Chu kỳ đánh giá**: tự do (tháng/quý/năm) tự kích hoạt; vòng đời duyệt đầu kỳ → cập nhật actual → chấm → duyệt kết quả → khóa → publish.
3. **Chấm điểm**: weighted engine thuần (achievement × weight, cap, hướng thấp-tốt); self + manager scoring tỷ trọng cấu hình; xếp loại theo ngưỡng.
4. **Kết nối hệ thống**: publish `kpi.result.published` cho payroll tiêu thụ (kênh KPI Sprint 10 AC-K01); nhận số liệu tự động từ attendance khi S09 release; nhận xét/chấm qua form builder nếu duyệt.
5. **Giám sát**: dashboard self/manager/HR, cảnh báo chậm/nhắc chấm, xuất Excel; Mobile: xem + cập nhật + chấm + duyệt.

Không làm (đề xuất): 360 feedback, skills tracking, appraisal tổng hợp đa nguồn, OKR cây mục tiêu, calibration/forced curve, AI gợi ý KPI, benchmark thị trường.

Phạm vi chi tiết đề xuất tại [ANL-S11-001 §3](../02_analysis/01_ANL-S11-001_kpi_plugin.md).

## 2. Phạm vi đã chốt qua 16 câu hỏi tương tác

Nguồn: hội thoại tương tác giữa chủ dự án và Agent điều phối, **2026-11-02** (4 vòng, 16/16 câu trả lời đầy đủ). Kết quả:

| # | Câu hỏi | Câu trả lời của chủ dự án |
| :--- | :--- | :--- |
| Q1 | Loại chỉ tiêu & thang điểm | **Cả 2 loại (định lượng + định tính) + thang tùy chọn per tenant** (100 điểm / 5 mức / 10 điểm) |
| Q2 | Thư viện KPI | **Seed theo nhóm chức danh phổ biến** (sales, HC-NS, kỹ thuật, sản xuất, kế toán…) + tenant tự tạo |
| Q3 | Phân cấp gán | **Cascade 3 tầng**: công ty → đơn vị → cá nhân (kế thừa trọng số) |
| Q4 | Trọng số & chấm 2 chiều | **Σ=100% bắt buộc + self 30% / manager 70%** (tỷ trọng cấu hình per chu kỳ) |
| Q5 | Nguồn actual | **Self + manager nhập hộ + đường tự động sẵn sàng** (event subscription, kích hoạt khi S09 release) |
| Q6 | Nhật ký actual | **Append-log đầy đủ** (giá trị, thời điểm, người nhập, minh chứng) |
| Q7 | Chu kỳ đánh giá | **Tự do cấu hình + tự kích hoạt** qua job; nhiều chu kỳ song song |
| Q8 | Duyệt đầu kỳ & kết quả | **Workflow engine Sprint 08** nhiều cấp (fallback 1 cấp nội bộ giữ schema) |
| Q9 | Công thức điểm | **Chuẩn weighted + cap**: Σ(achievement × weight) × 100, cap mặc định 120%, hỗ trợ "càng thấp càng tốt" |
| Q10 | Xếp loại cuối kỳ | **Theo ngưỡng cấu hình** (VD ≥90 A…); forced curve backlog |
| Q11 | Gắn lương thưởng | **Chỉ publish kết quả** (`kpi.result.published`) — payroll tiêu thụ qua kênh Sprint 10 AC-K01 |
| Q12 | Nhận xét & minh chứng | **Text/link + file đính kèm** qua storage signed URL (employee storage S07) |
| Q13 | Dashboard & cảnh báo | **Dashboard + cảnh báo/nhắc + heatmap đơn vị + top/bottom ranking** |
| Q14 | Quyền xem điểm | **Self + manager theo scope + HR**; công khai toàn công ty tắt mặc định |
| Q15 | Mobile | **Full self-service**: xem + cập nhật + chấm + duyệt |
| Q16 | Câu hỏi định tính | **Dùng form builder Sprint 08** (bộ câu hỏi gắn chu kỳ/chức danh) |

### 2.1. Phạm vi In-Scope

**Quản trị chỉ tiêu:** KpiDefinition 2 loại (định lượng: đơn vị, target, hướng tốt hơn, ngưỡng chia 0; định tính: thang rating theo cấu hình tenant — 100/5-mức/10); thư viện mẫu theo nhóm chức danh seed phổ biến, tái sử dụng giữa kỳ; gán **cascade 3 tầng** (công ty → đơn vị → cá nhân) với trọng số Σ=100% từng tầng.

**Chu kỳ & vòng đời:** chu kỳ tự do tự kích hoạt (job multi-tenant idempotent), nhiều chu kỳ song song; vòng đời: gán/duyệt đầu kỳ (workflow engine Sprint 08, fallback 1 cấp) → cập nhật actual append-log (self + manager nhập hộ; minh chứng text/link/**file signed URL**) → chấm (self + manager theo tỷ trọng; định tính qua form builder) → duyệt kết quả (engine) → khóa → publish.

**Chấm điểm:** weighted engine thuần — Σ(achievement × weight) × thang, cap cấu hình (mặc định 120%), hướng "càng thấp càng tốt"; test từng case; xếp loại theo ngưỡng cấu hình; **publish `kpi.result.published`** qua outbox sau khóa (payroll tiêu thụ — kênh Sprint 10 AC-K01); kênh nhận số liệu tự động qua event subscription sẵn sàng (kích hoạt khi S09 release).

**Giám sát:** dashboard self (tiến độ, điểm dự kiến); manager heatmap team + top/bottom; HR tổng hợp đơn vị/chu kỳ + xuất Excel; cảnh báo chậm + nhắc cập nhật/nhắc chấm qua notification.

**Mobile:** full self-service (xem, cập nhật actual, chấm, duyệt).

### 2.2. Phạm vi Out-of-Scope (backlog)

360 feedback/skills tracking; appraisal tổng hợp đa nguồn; OKR cây mục tiêu lồng nhau; forced distribution/calibration; AI gợi ý KPI (1Office 1AI); benchmark thị trường; quy tắc thưởng theo KPI trong plugin (nằm ở payroll); công khai điểm toàn công ty mặc định; plugin KPI/doanh số nguồn (chỉ mở kênh nhận).

## 3. Luồng nghiệp vụ chính

1. **Thiết lập**: HR dựng thư viện KPI theo nhóm chức danh (hoặc dùng seed) → cấu hình chu kỳ tự kích hoạt → gán cascade công ty → đơn vị → cá nhân với trọng số → duyệt đầu kỳ qua engine.
2. **Vận hành kỳ**: hệ mở kỳ theo lịch → nhân viên cập nhật actual + minh chứng (append-log) → manager nhập hộ/rà → hệ cảnh báo chậm, nhắc cập nhật.
3. **Chấm & duyệt**: cuối kỳ → self-assessment + bộ câu hỏi định tính (form builder) → manager chấm → hệ tính điểm weighted + xếp loại → duyệt kết quả qua engine → khóa.
4. **Publish & phân tích**: kết quả khóa → event `kpi.result.published` (payroll tiêu thụ khi cài) → dashboard/heatmap/ranking cập nhật → HR xuất Excel tổng hợp.

## 4. Acceptance Criteria

Ma trận: **D** = Desktop (web ≥ 1280px), **M** = Mobile Ionic (390×844). Truy vết: AC-D (định nghĩa/thư viện) ↔ US-D; AC-C (chu kỳ/vòng đời) ↔ US-C; AC-SC (chấm điểm) ↔ US-SC; AC-M (giám sát) ↔ US-M; AC-I (tích hợp/mobile) ↔ ANL §2.6. Tổng 26 AC.

| AC | Nội dung | D | M |
| :--- | :--- | :-: | :-: |
| AC-D01 | KpiDefinition 2 loại (định lượng: đơn vị/target/hướng/ngưỡng; định tính: thang rating); **thang điểm tùy chọn per tenant** (100 điểm / 5 mức / 10 điểm) | D | — |
| AC-D02 | Thư viện mẫu theo nhóm chức danh: seed phổ biến (sales, HC-NS, kỹ thuật, sản xuất, kế toán), tenant tạo/hiệu chỉnh; tái sử dụng giữa kỳ | D | — |
| AC-D03 | Gán cascade 3 tầng (công ty → đơn vị → cá nhân); trọng số Σ=100% từng tầng; validate trước khi mở chấm | D | — |
| AC-D04 | Validate chỉ tiêu: target ≠ 0 (chia 0 xử lý theo cấu hình), hướng (cao-tốt/thấp-tốt), ngưỡng hợp lệ | — | — |
| AC-C01 | Chu kỳ tự do (tháng/quý/năm) **tự kích hoạt** qua job multi-tenant idempotent; nhiều chu kỳ song song | — | — |
| AC-C02 | Duyệt KPI đầu kỳ qua workflow engine Sprint 08 (seed 1 cấp manager/HR, tenant thêm cấp); fallback 1 cấp nội bộ giữ schema khi engine chưa release | D | M |
| AC-C03 | Cập nhật actual **append-log** (giá trị, thời điểm, người nhập, minh chứng text/link); manager nhập hộ + rà; giá trị hiện hành = bản mới nhất | D | M |
| AC-C04 | Kênh nhận số liệu tự động: event subscription khai báo sẵn (attendance khi S09 release); trước đó đánh dấu "chờ dữ liệu nguồn" | — | — |
| AC-SC01 | Self-assessment + manager assessment; **tỷ trọng cấu hình per chu kỳ** (mặc định 30/70); thiếu self → cấu hình xử lý (chỉ manager) | D | M |
| AC-SC02 | Định tính chấm qua **form builder Sprint 08** (bộ câu hỏi gắn chu kỳ/nhóm chức danh); kết quả rating quy về thang tổng | D | M |
| AC-SC03 | Weighted engine thuần: Σ(achievement × weight) × thang; **cap cấu hình (mặc định 120%)**; hỗ trợ "càng thấp càng tốt" (achievement = target/actual); test từng case | — | — |
| AC-SC04 | Xếp loại theo ngưỡng cấu hình (VD ≥90 A, ≥75 B…); grade hiển thị trên kết quả | D | M |
| AC-SC05 | Duyệt kết quả cuối kỳ qua workflow engine; **khóa kỳ bất biến**; mở khóa chỉ HR/Admin có audit | D | M |
| AC-SC06 | **Publish `kpi.result.published`** qua outbox sau khóa (employee, chu kỳ, điểm, grade); payroll tiêu thụ khi cài — kênh CONF-S10-001 AC-K01 | — | — |
| AC-M01 | Dashboard self: tiến độ từng KPI (actual vs target), điểm dự kiến, trạng thái kỳ | D | M |
| AC-M02 | Dashboard manager: **heatmap tiến độ team + top/bottom ranking**; drill-down từng nhân viên | D | — |
| AC-M03 | Báo cáo HR tổng hợp theo đơn vị/chu kỳ (điểm trung bình, phân bố xếp loại) + xuất Excel | D | — |
| AC-M04 | Cảnh báo KPI chậm tiến độ + nhắc cập nhật actual định kỳ + nhắc chấm khi đến hạn qua notification plugin | D | M |
| AC-I01 | Mobile full self-service: xem KPI, cập nhật actual, self-assessment/chấm, duyệt (manager/HR) | — | M |
| AC-I02 | Visibility: self + manager theo data scope + HR; **công khai toàn công ty tắt mặc định** (tenant bật được); mọi chấm/duyệt/mở khóa có audit | — | — |
| AC-I03 | File minh chứng qua storage signed URL (employee storage Sprint 07); giới hạn loại/dung lượng | D | M |
| AC-I04 | Tenant isolation mọi bảng/job; test isolation hạng mục nghiệm thu | — | — |
| AC-I05 | Nhân viên vào/việc giữa kỳ: KPI tính phần kỳ làm việc; achievement quy theo ngày hiệu lực | — | — |
| AC-I06 | KPI phòng ban trong cascade: điểm đơn vị tính từ team (trung bình cấu hình) hiển thị ở tầng đơn vị | D | — |
| AC-I07 | Manager thay đổi giữa kỳ: chấm mới theo manager hiện tại; bản chấm cũ giữ lịch sử | — | — |
| AC-I08 | Thông báo 4 nhóm: mở kỳ, nhắc cập nhật/nhắc chấm, chờ duyệt, kết quả đã duyệt | D | M |

Backend test: JUnit 5 + RestAssured trên PostgreSQL/Redis thật (No H2); frontend không viết unit test; QA browser Desktop + Mobile emulation 390×844, 0 console error.

## 5. Rủi ro cần chủ dự án lưu ý (đã chọn ở Q3/Q5/Q8/Q12/Q16)

1. **Q8 + Q16 — phụ thuộc kép Sprint 08**: cả duyệt (workflow engine) lẫn câu hỏi định tính (form builder) đều dùng plugin đang Design In Review — rủi ro lớn nhất; Architect đánh giá ở bước 05, fallback duyệt 1 cấp + câu hỏi tự định nghĩa giữ schema.
2. **Q5 — nguồn tự động**: attendance (S09) chưa release; v1 chỉ Manual + cấu trúc event sẵn; kỳ vọng tự động chờ S09 (giống CONF-S10 Q16).
3. **Q3 — cascade 3 tầng**: kế thừa trọng số giữa tầng phức tạp; Architect thiết kế mô hình gán tầng rõ ràng (kế thừa/copy) tránh double-count điểm.
4. **Q1 — thang tùy chọn per tenant**: công thức phải trung tính thang (chuẩn hóa về thang 100 nội bộ); test đủ 3 thang seed.
5. **Q12 — file minh chứng**: phụ thuộc storage employee (S07 signed URL); giới hạn loại/dung lượng như documents.
6. **Tổng thể**: 16/16 câu chọn phạm vi rộng (cascade + form builder + file + heatmap) — sprint lớn; nếu muốn gọn có thể lùi cascade về cá nhân (Q3) hoặc câu hỏi định tính về tự định nghĩa (Q16) trước khi duyệt.

## 6. Confirmation Gate

| Mục | Trạng thái |
| :--- | :--- |
| 16/16 câu hỏi scope đã trả lời | ✅ (hội thoại tương tác 2026-11-02) |
| Duyệt scope & AC (bảng §1, §2.1, §4) | ✅ **APPROVED 1.0** — chủ dự án chọn "Duyệt toàn bộ scope" qua hội thoại tương tác 2026-11-02 (đã nêu rõ rủi ro §5: Q8/Q16 phụ thuộc Sprint 08, Q5 chờ Sprint 09, Q3 cascade) |
| Chuyển sang bước 05 (SOL) | ✅ Đã mở — Architect nghiên cứu giải pháp, không tự thay đổi scope/AC |

> Lịch sử: 0.1 (2026-11-02) — soạn CONF nháp với 16 câu hỏi chốt scope + đề xuất mục tiêu; **0.2 (2026-11-02)** — ghi nhận 16/16 câu trả lời tương tác; bổ sung In-Scope/Out-of-Scope, 4 luồng nghiệp vụ, 26 AC + ma trận D/M, 6 rủi ro; **1.0 (2026-11-02) — APPROVED bởi chủ dự án qua hội thoại tương tác, nội dung 0.2 giữ nguyên**. Đổi scope/AC sau này phải xác nhận phần thay đổi và tăng phiên bản.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: mục tiêu đề xuất + 16 câu hỏi 4 nhóm + 4 rủi ro; chờ trả lời tương tác |
| 0.2 | 2026-11-02 | Ghi nhận 16/16 câu trả lời; soạn scope §2, luồng §3, AC §4 (26 AC), rủi ro §5; chờ duyệt |
| 1.0 | 2026-11-02 | **APPROVED** — chủ dự án duyệt toàn bộ scope (16/16 câu + 26 AC) qua hội thoại tương tác |
