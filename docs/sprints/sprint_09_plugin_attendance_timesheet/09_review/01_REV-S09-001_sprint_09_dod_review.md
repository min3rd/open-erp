# [REV-S09-001] Nghiệm thu & Đóng Sprint 09 — Plugin Chấm công, Bảng công & Đơn từ (`attendance`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S09-001 / Sprint review & DoD / Sprint 09 |
| Trạng thái / phiên bản / ngày | **SẴN SÀNG ĐÓNG (READY TO CLOSE)** / 1.0 / 2026-11-11 |
| Owner / reviewer | PM Agent / Chủ dự án (Product Owner) + Architect + QA |
| Phạm vi | 23 AC của [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) 1.0; FEAT-43…47; Plugin `attendance` trọn gói |
| Baseline | `plugin-attendance-1.0.0.jar`, UI bundle `main.js` (410KB) + `styles.css` (95KB) |
| Evidence | [TR-S09-001](../08_testing/02_TR-S09-001_sprint_09_test_report.md) 1.0, [UG-S09-001](../../../06_user_guides/sprint_09_attendance_timesheet_user_guide.md); backend suite 116/116 PASS; i18n 100.0% strict parity 13 ngôn ngữ; 29 ảnh chụp màn hình Browser Desktop/Mobile |

---

## 1. Tóm tắt điều hành

Sprint 09 bàn giao trọn gói **Plugin Chấm công, Bảng công & Đơn từ (`attendance`)**, đáp ứng toàn diện 100% các tiêu chí nghiệp vụ và kiến trúc:
1. **Chấm công đa nguồn (Multi-Source Ingestion & Pure Engines)**:
   - Web check-in & Mobile GPS check-in (tính khoảng cách Haversine, cảnh báo không chặn theo ADR-S09-001).
   - Chế độ Kiosk độc lập (xác thực mã PIN băm muối SHA-256, tự động dọn màn hình sau 3.5s).
   - Ingestion máy chấm công thô & CSV parser.
   - Deduplication log trong cửa sổ 30s.
   - Bộ máy tính toán thuần túy (`AttendanceCalculator`, `ShiftResolver`): Ca kíp linh hoạt, ca đêm qua ngày, grace in/out, break time, đánh dấu `needs_review`.
2. **Bảng công kỳ 4 bước & Báo cáo (`timesheets`)**:
   - Vòng đời 4 bước: `S1_LOGS` -> `S2_SCHEDULE` -> `S3_CALCULATE` -> `S4_ADJUST` -> `DONE`.
   - Cơ chế bảo vệ chống mất điều chỉnh thủ công (`ATTENDANCE_TIMESHEET_OVERRIDE_LOSS`).
   - Gửi yêu cầu nhân viên xác nhận công, hỗ trợ khiếu nại.
   - Khóa kỳ công kèm lý do audit và phát sự kiện `attendance.timesheet.locked`.
   - Xuất dữ liệu bảng lương CSV/Excel theo template whitelist.
   - Hệ thống báo cáo: Chuyên cần, báo cáo theo nhóm, top đi muộn, làm thêm giờ.
3. **Đơn từ & Tích hợp Quy trình (Requests & Fallback)**:
   - Seed 6 loại đơn chuẩn (`LEAVE`, `OVERTIME`, `ATTENDANCE_FIX`, `LATE_EARLY`, `BUSINESS_TRIP`, `SHIFT_SWAP`) và đơn tùy chỉnh (`X_*`).
   - Kiểm tra ngày lùi không quá `window_days`, chặn nộp vào kỳ công đã khóa.
   - Cơ chế `INTERNAL_FALLBACK` duyệt nội bộ 1 cấp khi workflow engine chưa sẵn sàng.
   - Lắng nghe sự kiện `workflow.instance.completed` và `MappingExecutor` idempotent áp dụng kết quả vào công nhật và phép.
4. **Sổ cái Nghỉ phép (Leave Ledger & Expiry Job)**:
   - Sổ cái append-only (`GRANT`, `USAGE`, `USAGE_REVERSAL`, `ADJUSTMENT`, `EXPIRY`).
   - Tính số dư thực tế và đồng bộ snapshot cache.
   - Job tự động quét và thu hồi phép hết hạn.
   - API cấp phép và điều chỉnh phép kèm lý do bắt buộc.
5. **Giao diện WebComponent & Ứng dụng Di động Ionic 8**:
   - Web Desktop: High density, Sharp square, Anti-Modal với Drawer xếp tầng và Split-view duyệt đơn.
   - Mobile Ionic: 5 tab (Chấm công, Lịch của tôi, Đơn của tôi, Duyệt đơn, Xác nhận công), touch target ≥ 44px, safe-area, 0 horizontal overflow.
   - 100.0% đa ngôn ngữ trên toàn bộ 13 locale files (`en`, `vi`, `ar`, `de`, `es`, `fr`, `id`, `ja`, `ko`, `pt-BR`, `ru`, `th`, `zh-CN`).
   - Zero native `fetch()` (Rule 23) - 100% sử dụng `HttpClient` và `ApiService`.
   - Zero lỗi console (`console.error = 0`).

---

## 2. Traceability Ma trận Tính năng (FEAT Matrix)

| Feature | Nội dung bàn giao | Trạng thái | Minh chứng |
| :--- | :--- | :---: | :--- |
| **FEAT-43** | Core shifts, multi-source ingestion, pure engines, calc job, REST APIs | ✅ Done | 88/88 test PASS; `AttendanceCalculatorTest`, `ShiftResolverTest`, `GeofenceCalculatorTest`, `CsvLogParserTest` |
| **FEAT-44** | Timesheets 4 bước, confirmations, lock/unlock, payroll export, reports | ✅ Done | 100/100 test PASS; `TimesheetServiceTest`, `ExportTemplateServiceTest`, `AttendanceReportServiceTest` |
| **FEAT-45** | Requests seed 6 types, fallback approval, MappingExecutor, inbox split-view | ✅ Done | 116/116 test PASS; `RequestServiceTest`, `RequestMappingExecutorTest`, `RequestTypeServiceTest` |
| **FEAT-46** | Leave module: LeaveTypes, append-only ledger, derive balance, expiry job | ✅ Done | 116/116 test PASS; `LeaveLedgerServiceTest`, `LeaveAdminResourceTest` |
| **FEAT-47** | UI WebComponent + Mobile Ionic 5-tab + Dual-mode browser testing | ✅ Done | Build clean (0 lỗi), 29 ảnh minh chứng (21 Desktop + 8 Mobile), 0 console.error, 0 overflow, 100% i18n |
| **DoD Gate** | Trạng thái | Đạt | Toàn bộ 29 kịch bản màn hình chức năng đạt chuẩn |

---

## 3. DoD Gate Checklist (Điều kiện Đóng Sprint)

| Tiêu chuẩn DoD | Yêu cầu | Kết quả thực tế | Đánh giá |
| :--- | :--- | :---: | :---: |
| **Bug Critical / High tồn đọng** | 0 item | **0** | ✅ **PASS** |
| **Bug Medium tồn đọng** | 0 item ảnh hưởng | **0** | ✅ **PASS** |
| **Backend Tests (No H2, Real DB)** | 100% PASS | **116 / 116 PASS** | ✅ **PASS** |
| **Frontend WebComponent Build** | Build clean | **SUCCESS** (`main.js` + `styles.css`) | ✅ **PASS** |
| **Frontend Web App Build** | Build clean | **SUCCESS** (`npm run web:build`) | ✅ **PASS** |
| **Frontend Mobile Ionic Build** | Build clean | **SUCCESS** (`npm run mobile:build`) | ✅ **PASS** |
| **Đa ngôn ngữ (i18n Strict Parity)** | 100% across 13 locales | **100.0% strict parity** | ✅ **PASS** |
| **Rule 23 (Zero native fetch)** | 0 fetch() calls | **0** native fetch | ✅ **PASS** |
| **Rule 10 (Anti-Modal ERP UI)** | 100% Drawers / Split-view | **100% Drawers / Split-view** | ✅ **PASS** |
| **Dual-Mode Browser QA Testing** | Desktop + Mobile 390x844 | **0 console.error, 0 overflow** | ✅ **PASS** |
| **Tài liệu Hướng dẫn sử dụng** | Kèm hình ảnh trực quan | Đã có [UG-S09-001](../../../06_user_guides/sprint_09_attendance_timesheet_user_guide.md) (29 ảnh) | ✅ **PASS** |
| **QA Test Report** | Nghiệm thu đầy đủ | Đã có [TR-S09-001](../08_testing/02_TR-S09-001_sprint_09_test_report.md) | ✅ **PASS** |

---

## 4. Kết luận & Đề xuất

Sprint 09 đã hoàn thành xuất sắc toàn bộ khối lượng công việc theo thiết kế được duyệt. Hệ thống sẵn sàng để Chủ dự án kiểm tra và ký duyệt đóng Sprint 09.

