# [BENCH-S11-001] Đối chuẩn: KPI/OKR — Quản lý & xử lý KPI

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S11-001 / Đối chuẩn / Sprint 11 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S11-001](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) 0.1 (R3) |
| Đọc trước / đọc tiếp | [RAW-S11-001](../01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) / [ANL-S11-001](../02_analysis/01_ANL-S11-001_kpi_plugin.md), [CONF-S11-001](../04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Trả lời câu hỏi R3 của chủ dự án: **các hệ thống quản lý KPI/OKR xử lý quản trị chỉ tiêu và vận hành chu kỳ đánh giá như thế nào**. Phạm vi 3 nhóm: (a) performance management HR quốc tế (appraisal + goals); (b) OKR/KPI chuyên sâu (weighted scoring, cascade, check-in); (c) thị trường Việt Nam (thư viện KPI theo chức danh, duyệt nhiều cấp, gắn lương thưởng, đồng bộ nguồn số liệu).

## 2. Danh sách sản phẩm đối chuẩn

| # | Sản phẩm | Phân khúc | Nguồn |
| :--- | :--- | :--- | :--- |
| 1 | Odoo Appraisals | HR appraisal trong ERP | [Odoo Appraisals features](https://www.odoo.com/app/appraisals-features) |
| 2 | Frappe HR (Appraisal) | HRM mã nguồn mở | [Frappe HR](https://frappe.io/hr) |
| 3 | Lattice Goals/OKRs | Performance management SaaS | [Lattice OKRs](https://lattice.com/platform/goals/okrs) |
| 4 | 15Five | Performance management SaaS | [Tability comparison](https://www.tability.io/compare/vs/15five-vs-lattice) |
| 5 | Profit.co | OKR/KPI chuyên sâu | [KPI tracking](https://www.profit.co/cluster/kpi/), [Weights](https://www.profit.co/blog/okr-university/key-result-weights/) |
| 6 | Quantive (Gtmhub)/Tability | OKR platform | [Tability comparison](https://www.tability.io/compare/vs/15five-vs-lattice) |
| 7 | BambooHR Performance | HRM SaaS | [So sánh HRM 2026](https://sheet.com.vn/blog/so-sanh-base-1office-hrmv9-phan-mem-nhan-su) |
| 8 | MISA AMIS Đánh giá | HRM Việt Nam | [AMIS Đánh giá](https://amis.misa.vn/amis-danh-gia/), [Phần mềm KPI](https://amis.misa.vn/72596/phan-mem-kpi/) |
| 9 | 1Office Đánh giá KPI (1HRM) | HRM Việt Nam | [Đánh giá KPI](https://1office.vn/danh-gia-kpi), [18+ phần mềm KPI](https://1office.vn/phan-mem-danh-gia-kpi) |
| 10 | Base.vn OKRs | HRM Việt Nam | [So sánh Base/1Office](https://erpchuan.vn/misa-vs-base/), [sheet.com.vn](https://sheet.com.vn/blog/so-sanh-base-1office-hrmv9-phan-mem-nhan-su) |

## 3. Phân tích theo chủ đề

### 3.1. Mô hình chỉ tiêu: KPI định lượng vs OKR vs định tính

- **KPI định lượng** (Profit.co, 1Office): chỉ tiêu có `target`/`actual` + đơn vị + **hướng tốt hơn** (cao hơn/thấp hơn — VD: doanh số càng cao càng tốt, tỷ lệ lỗi càng thấp càng tốt) + ngưỡng (threshold đạt/không đạt).
- **OKR** (Lattice, Profit.co, Quantive): Objective định tính + Key Results định lượng, chu kỳ ngắn, check-in tuần; khác KPI ở bản chất "mục tiêu đổi mới" vs "chỉ số vận hành".
- **Định tính** (Odoo Appraisal, Lattice Reviews): câu hỏi đánh giá theo template, thang rating, nhận xét — cho những gì không đo được bằng số.
- **Bài học**: một lõi chỉ tiêu hỗ trợ cả 2 loại (định lượng có target/actual + định tính có rating) là cần thiết; đừng ép mọi thứ thành số.

### 3.2. Thư viện mẫu & chuẩn hóa theo chức danh

- **1Office** (điểm nổi bật VN): "thư viện mẫu đánh giá KPI theo từng nhóm chức danh hoặc phòng ban", **tái sử dụng qua nhiều kỳ**; "cấu hình linh hoạt chỉ tiêu, trọng số và phương pháp đánh giá"; **"hỗ trợ viết công thức tính điểm cho từng kịch bản"**.
- **Odoo**: "custom templates by department" cho appraisal questions.
- **Profit.co**: "300+ pre-built metrics" trong thư viện KPI.
- **Bài học**: thư viện KPI theo chức danh/nhóm vị trí + tái sử dụng giữa các kỳ là tính năng lõi của thị trường VN; seed thư viện mẫu giúp tenant mới dùng được ngay.

### 3.3. Chu kỳ đánh giá & vòng đời

| Bước | 1Office VN | Odoo/Profit.co |
| :--- | :--- | :--- |
| 1. Khởi tạo kỳ | Kỳ theo tháng/quý/năm hoặc chu kỳ riêng; **tự động kích hoạt kỳ** | Appraisal cycle theo lịch; goal period |
| 2. Gán chỉ tiêu | KPI theo vị trí/phòng ban từ thư viện | Goals gán cho employee, deadline |
| 3. Duyệt đầu kỳ | **Quy trình phê duyệt KPI nhiều cấp theo cơ cấu tổ chức** | Manager approve goals |
| 4. Theo dõi | Cập nhật tiến độ realtime, theo ngày/tuần/giai đoạn | Check-in, progress tracking |
| 5. Chấm cuối kỳ | Chấm điểm theo công thức + trọng số | Rating + achievement |
| 6. Duyệt & khóa | Kết quả luân chuyển, rà soát, phê duyệt trực tuyến | Appraisal done → locked |
| 7. Sau kỳ | Báo cáo tổng hợp cá nhân/đội/phòng | Skills evaluation report, activities |

### 3.4. Tính điểm: trọng số + achievement + công thức

- **Profit.co**: **weighted key results** — "weight phản ánh tầm quan trọng tương đối, tổng weight = 1"; điểm = Σ(achievement × weight); achievement = actual/target (hoặc nghịch theo hướng).
- **1Office**: "công thức tính điểm cho từng kịch bản" — công thức tùy chỉnh theo chỉ tiêu/phòng ban/kịch bản đánh giá.
- **Lattice/Odoo**: rating scale (thường 1–5) cho mục định tính; tổng hợp có thể kèm trọng số khu vực.
- **Bài học**: công thức mặc định = `Σ(min(achievement%, cap) × weight)` với cap trần (VD 120–150%) chống "làm một chỉ tiêu bù tất cả"; kèm mục định tính chấm rating riêng; **công thức là engine thuần test được**; hỗ trợ hướng "càng thấp càng tốt" (achievement = target/actual).

### 3.5. Nguồn số liệu (actual) & tích hợp

- **1Office**: "tự động lấy dữ liệu KPI — đồng bộ từ 1Office và hệ thống ngoài như CRM, ERP, Google Sheets"; kết quả KPI **"tự động liên kết với tính lương, thưởng và phụ cấp"**.
- **Profit.co**: kết nối metrics từ hệ thống (Salesforce, Jira…).
- **open-erp**: attendance (S09) là nguồn tự động tự nhiên (tỷ lệ chuyên cần, số OT…); payroll (S10) đã thiết kế **kênh KPI mở** chờ plugin này cung cấp dữ liệu (CONF-S10-001 AC-K01) — kết nối 2 chiều trọn chuỗi.

### 3.6. Appraisal tổng hợp & feedback

- **Odoo Appraisals**: template câu hỏi, **360 feedback** (quản lý + đồng nghiệp + phụ thuộc) qua Survey, two-way feedback, skills tracking, private notes, meeting tích hợp lịch.
- **Lattice/15Five**: review cycles + 1-on-1 + continuous feedback + recognition; gắn goals vào review.
- **Bài học**: KPI thuần (v1) và appraisal tổng hợp (v2+) là 2 tầng; v1 chỉ cần self + manager scoring + nhận xét; 360/skills để backlog.

### 3.7. Xếp loại & gắn lương thưởng

- Thị trường VN: kết quả KPI kỳ → **thưởng/phụ cấp tính theo mức** (1Office "chi trả công bằng dựa trên dữ liệu"); xếp loại theo ngưỡng điểm.
- Distribution/forced curve (ép phân bổ A/B/C) là chủ đề gây tranh cãi — một số enterprise dùng (Workday/Lattice calibrations), SMB thường bỏ.
- **Bài học**: xếp loại theo ngưỡng cấu hình được; để HR bật/tắt; plugin chỉ xuất kết quả, quy tắc thưởng nằm ở payroll (kênh input).

## 4. Bảng tổng hợp tính năng

| Tính năng | Odoo | Lattice | 15Five | Profit.co | AMIS | 1Office | Base |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| KPI định lượng target/actual | ✅ goals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Định tính/rating | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Thư viện mẫu theo chức danh | ✅ dept | ⭕ | ⭕ | ✅ 300+ | ✅ | ✅ | ✅ |
| Trọng số (weights) | — | ✅ | ✅ | ✅ | ✅ | ✅ | ⭕ |
| Achievement % + cap | — | ✅ | ✅ | ✅ | ✅ | ✅ công thức | ⭕ |
| Cascade DN → đơn vị → cá nhân | ⭕ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chu kỳ tự do + tự kích hoạt | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Duyệt đầu kỳ nhiều cấp | ⭕ | ⭕ | ⭕ | ⭕ | ✅ | ✅ | ✅ |
| Self + manager scoring | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 360 feedback | ✅ | ✅ | ✅ | ✅ | ⭕ | ⭕ | ⭕ |
| Nguồn actual tự động | — | ⭕ | ⭕ | ✅ | ✅ | ✅ | ⭕ |
| Gắn lương thưởng | ⭕ | ✅ | ✅ | ⭕ | ✅ | ✅ | ✅ |
| Xếp loại theo ngưỡng | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard tiến độ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

(✅ có — ⭕ cơ bản/qua cấu hình — — không có; tổng hợp từ nguồn mục 2.)

## 5. Bài học áp dụng vào open-erp

| # | Bài học | Nguồn | Áp dụng đề xuất |
| :--- | :--- | :--- | :--- |
| L01 | Một lõi chỉ tiêu 2 loại: định lượng (target/actual/hướng/ngưỡng) + định tính (rating) | Profit.co/Odoo | `KpiDefinition` có `type` (QUANTITATIVE/QUALITATIVE) |
| L02 | Thư viện mẫu theo nhóm chức danh, tái sử dụng giữa kỳ; seed giúp tenant dùng ngay | 1Office/Profit.co | `KpiLibrary` + seed nhóm chức danh phổ biến |
| L03 | Trọng số: Σ weight = 1 (hoặc 100%); điểm = Σ(achievement × weight) | Profit.co | Weighted score engine thuần |
| L04 | Achievement có cap trần chống lệch (VD 120%) + hỗ trợ "càng thấp càng tốt" | Profit.co/1Office | Công thức cấu hình hướng + cap |
| L05 | Chu kỳ tự do (tháng/quý/năm) tự kích hoạt; nhiều chu kỳ song song theo nhóm | 1Office | `KpiCycle` scheduler multi-tenant idempotent |
| L06 | Duyệt đầu kỳ (gán KPI) và duyệt kết quả cuối kỳ — 2 điểm duyệt; thị trường VN dùng nhiều cấp | 1Office/MISA | Workflow engine hoặc cơ chế 1 cấp — câu hỏi CONF |
| L07 | Actual: nhân viên check-in kèm minh chứng; manager nhập hộ; nguồn tự động qua event/plugin khác | 1Office/Profit.co | `KpiActual` + nguồn MANUAL/AUTO; attendance khi S09 release |
| L08 | Kết quả kỳ chốt phát event cho payroll (kênh KPI S10 đã mở) — trọn chuỗi lương thưởng theo hiệu suất | 1Office, Sprint 10 | Outbox event `kpi.result.published` |
| L09 | Appraisal tổng hợp (360, skills, meeting) là tầng 2 — KPI thuần trước | Odoo | Backlog 360/skills |
| L10 | Xếp loại theo ngưỡng cấu hình; HR bật/tắt distribution | Lattice/Workday | `KpiGrade` theo ngưỡng; distribution backlog |
| L11 | Quyền xem điểm: self luôn thấy; manager theo scope; công khai toàn công ty là cấu hình | Lattice/Odoo | Cấu hình visibility per tenant |
| L12 | Định tính có thể dùng form builder (S08) làm bộ câu hỏi — tránh tự viết survey | Odoo (Survey integration) | Câu hỏi CONF Q16 |

## 6. Khoảng trống cần kiểm chứng thêm

1. Thang điểm phổ biến thị trường VN (100 điểm vs 5 mức) — hỏi chủ dự án (CONF Q1).
2. Mức cascade (chỉ cá nhân, hay phòng ban + công ty) — hỏi chủ dự án (CONF Q3).
3. Quy tắc thưởng theo KPI (công thức thưởng từ điểm) — thuộc payroll hay kpi (CONF Q10).
4. Chuẩn báo cáo BHXH/hiệu suất không liên quan — N/A.

## 7. Nguồn đã đọc

- Odoo Appraisals features (odoo.com/app/appraisals-features) — đọc 2026-11-02.
- Lattice Goals/OKRs (lattice.com) — đọc 2026-11-02.
- Profit.co KPI tracking + Key Result Weights (profit.co) — đọc 2026-11-02.
- Tability: 15Five vs Lattice 2026 (tability.io) — đọc 2026-11-02.
- MISA AMIS Đánh giá + Phần mềm KPI (amis.misa.vn) — đọc 2026-11-02.
- 1Office Đánh giá KPI + 18+ phần mềm KPI (1office.vn) — đọc 2026-11-02.
- So sánh Base.vn vs 1Office vs HRMv9 2026 (sheet.com.vn) — đọc 2026-11-02.
- ERP Chuan: MISA vs Base (erpchuan.vn) — đọc 2026-11-02.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: 10 sản phẩm, 7 chủ đề, 12 bài học, 4 khoảng trống |
