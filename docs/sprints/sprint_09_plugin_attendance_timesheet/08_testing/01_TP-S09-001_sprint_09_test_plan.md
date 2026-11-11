# [TP-S09-001] Test Plan Sprint 09 — Plugin Chấm công, Bảng công & Đơn từ (`attendance`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TP-S09-001 / Test Plan / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.0 / 2026-11-11 |
| Owner / reviewer | QA Agent / Solution Architect |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) 1.0, [DES-ARCH-S09-001](../06_designs/arch/01_DES-ARCH-S09-001_components_and_flows.md), [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md), [DES-UI-S09-001](../06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) |
| Đọc trước / đọc tiếp | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) / [TR-S09-001](02_TR-S09-001_sprint_09_test_report.md) |

## 1. Phạm vi kiểm thử

| Nhóm | Nội dung | Phương pháp |
| :--- | :--- | :--- |
| **TC-ENG** | Động cơ thuần túy (Pure Engines): `AttendanceCalculator`, `ShiftResolver`, `GeofenceCalculator`, `CsvLogParser` | Unit test (JUnit 5, 49 tests) |
| **TC-SRV** | Nghiệp vụ dịch vụ: `AttendanceLogService`, `AttendanceCalculationService`, `LeaveLedgerService`, `RequestService`, `TimesheetService`, `KioskSecurityService`, `ExportTemplateService` | Service tests (48 tests) |
| **TC-API** | REST API & Security: Xác thực, phân quyền Tenant, Envelope 4 khuôn mẫu chuẩn, mã lỗi `UPPER_SNAKE_CASE` | Integration tests (RestAssured, 19 tests) |
| **TC-UI** | Dual-Mode Browser Testing (Web Desktop >= 1280px & Mobile Ionic 390x844 px), 0 console error, 0 overflow | `agent-browser` + Screenshot evidence |
| **TC-I18N** | Đa ngôn ngữ 100% strict parity trên cả 13 ngôn ngữ cho Web và Mobile | `npm run i18n:check:strict` |

## 2. Ma trận Tiêu chí Nghiệm thu (AC Matrix)

| Tiêu chí | Mô tả | Nhóm Test | Trạng thái |
| :--- | :--- | :--- | :--- |
| **AC-A01** | Check-in Web/Mobile GPS với công thức Haversine, cảnh báo không chặn | TC-ENG, TC-UI | PASS |
| **AC-A02** | Chấm công Kiosk với PIN hash muối SHA-256, auto reset 3.5s | TC-SRV, TC-UI | PASS |
| **AC-A03** | Ingestion máy chấm công và import CSV | TC-ENG, TC-SRV | PASS |
| **AC-A04** | Deduplication log (30s window) | TC-SRV | PASS |
| **AC-S01** | Ca kíp linh hoạt, ca đêm qua ngày (overnight shifts) | TC-ENG | PASS |
| **AC-S02** | Grace in/out, break time khấu trừ chính xác | TC-ENG | PASS |
| **AC-S03** | Đánh dấu `needs_review` khi thiếu log, trễ bất thường | TC-ENG, TC-UI | PASS |
| **AC-S04** | Phân ca tuần và ngày nghỉ lễ | TC-ENG, TC-SRV | PASS |
| **AC-T01** | Vòng đời bảng công 4 bước (`S1` -> `S2` -> `S3` -> `S4` -> `DONE`) | TC-SRV, TC-UI | PASS |
| **AC-T02** | Chống mất điều chỉnh thủ công (409 Conflict hoặc cảnh báo quay lại) | TC-SRV, TC-UI | PASS |
| **AC-T03** | Xác nhận bảng công nhân viên & Khóa kỳ với lý do audit | TC-SRV, TC-UI | PASS |
| **AC-T04** | Xuất bảng lương CSV/Excel theo mẫu template whitelist | TC-SRV | PASS |
| **AC-T05** | Báo cáo tỷ lệ chuyên cần, top đi muộn, làm thêm giờ | TC-SRV, TC-UI | PASS |
| **AC-R01** | Seed 6 loại đơn chuẩn (`LEAVE`, `OVERTIME`, `ATTENDANCE_FIX`, ...) | TC-SRV | PASS |
| **AC-R02** | Giới hạn ngày lùi (`window_days`) và chặn nộp vào kỳ đã khóa | TC-SRV | PASS |
| **AC-R03** | Ánh xạ idempotent kết quả duyệt đơn vào hệ thống chấm công | TC-SRV | PASS |
| **AC-R04** | Cơ chế fallback duyệt nội bộ (`INTERNAL_FALLBACK`) | TC-SRV, TC-UI | PASS |
| **AC-L01** | Sổ cái nghỉ phép Append-only (`plg_attendance_leave_ledger`) | TC-SRV | PASS |
| **AC-L02** | Khấu trừ phép khi duyệt đơn LEAVE & hoàn trả khi hủy đơn | TC-SRV | PASS |
| **AC-L03** | Job tự động quét và thu hồi phép hết hạn | TC-SRV | PASS |
| **AC-L04** | Cấp phép và điều chỉnh phép kèm lý do bắt buộc | TC-SRV | PASS |
| **AC-L05** | Thống kê số dư phép cá nhân và toàn doanh nghiệp | TC-SRV, TC-UI | PASS |
| **AC-M01** | Giao diện Mobile Ionic 5 tab (390x844 px), touch >= 40px, overflow = 0 | TC-UI | PASS |

