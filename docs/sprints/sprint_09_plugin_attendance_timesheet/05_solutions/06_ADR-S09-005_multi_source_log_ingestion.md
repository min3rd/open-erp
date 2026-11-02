# [ADR-S09-005] Ingestion log đa nguồn: một lõi append-only, kiosk PIN, CSV import, API push qua Core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S09-005 / Quyết định kiến trúc / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt qua hội thoại tương tác (nội dung 0.1 giữ nguyên) |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q1/Q2/Q4/Q13 (APPROVED, rủi ro §5.5), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) §3.2/§3.8, khảo sát pattern auth Core (`JwtTokenService`, signed passthrough, `PluginPublicRateLimiter`) |
| Đọc trước / đọc tiếp | [SOL-S09-001](01_SOL-S09-001_attendance_architecture.md) / bước 06 DES-DB/API |

## 1. Vấn đề

CONF Q1 chốt đủ 4 nguồn chấm (web, mobile GPS, kiosk, máy vân tay qua middleware) + chấm hộ (Q4). Bài toán: chuẩn hóa 5 đường vào (web/mobile/kiosk/CSV/API push) về một lõi log chống trùng, chống gian lận (Q2 — GPS + geofence cảnh báo), và mở endpoint cho hệ ngoài (Q13) mà không phá mô hình auth hiện có.

## 2. Quyết định

### 2.1. Một lõi log append-only

`plg_attendance_logs`: `employee_id`, `work_date` (từ ca hiệu lực), `event_type` (`IN`/`OUT`), `occurred_at`, `source` enum (`WEB`, `MOBILE`, `KIOSK`, `IMPORT`, `PUSH`, `MANUAL`), `device_id` (nullable), `meta` JSONB (GPS lat/lng + trong/ngoài bán kính chi nhánh, IP, user-agent, người nhập hộ + lý do), `deleted_by/deleted_reason` (xóa chỉ HR — BR-A01/A07). Idempotency tự nhiên: `(source, device_id, occurred_at, employee_id)` unique cho nguồn máy; nguồn tương tác (web/mobile) cho phép chấm lại sau khi đóng ca.

- **Web/Mobile** (US-A01/A02): endpoint auth bearer chuẩn; mobile bắt buộc gửi GPS; geofence: so bán kính với tọa độ nơi làm việc của chi nhánh theo assignment (ADR-S09-001) → **cảnh báo ghi cờ vào meta, không chặn** (Q2).
- **Kiosk** (US-A03): `plg_attendance_devices` (loại KIOSK, gắn `branch_id`, mã thiết bị, PIN hash) — màn kiosk web không đăng nhập: nhập mã NV + PIN → cấp short-lived token giới hạn quyền chấm; PIN bcrypt; chặn brute force (lock tạm theo thiết bị).
- **Chấm hộ** (Q4): HR theo data scope + manager team — source `MANUAL`, `meta.entered_by` + lý do bắt buộc, audit.
- **Import CSV** (Q13a): template chuẩn BioTime/ZKTeco (mã NV, thời gian, thiết bị); parse → validate → ghi idempotent; báo cáo dòng trùng/lỗi trong kết quả import; import gắn `import_batch_id`.
- **API push** (Q13b): middleware BioTime push HTTP — đi qua **Core endpoint mới** `POST /api/v1/attendance-ingest/{tenantCode}` (public route có secret, pattern webhook ADR-S08-002/003): secret theo thiết bị (rotate, hash lưu), rate limit per device, anti-replay (`timestamp` lệch ≤ 5 phút + `nonce` unique), payload ký HMAC; Core chỉ xác thực/limit rồi forward plugin attendance qua runtime gateway — **Core không biết nghiệp vụ log** (giữ Core minimal).

### 2.2. Chuẩn hóa nguồn về work_date

Mọi log gắn `work_date` theo ca hiệu lực (ADR-S09-001: ca đêm gán ngày bắt đầu); log đến khi chưa resolve được ca → `work_date` theo ngày occurring, record chờ HR (E06).

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Plugin tự mở public endpoint nhận push ngoài gateway | Phá mô hình auth/limit tập trung; Core đã có pattern route public + rate limit + secret (Sprint 08) |
| Ghi đè log khi sửa (update) | BR-A01/A07: log append-only — sửa = xóa + nhập mới có audit, giữ nguyên vẹn bằng chứng |
| Nhận diện khuôn mặt/selfie ở v1 | CONF out-of-scope (Q2 chọn geofence cảnh báo); schema `meta` đủ rộng cho sau |
| Mỗi nguồn một bảng riêng | Gây khó tính công hợp nhất; chuẩn ngành (Frappe Employee Checkin, Odoo attendance) dùng 1 bảng log có nguồn |

## 4. Hệ quả và kiểm chứng

- (+) Tính công chỉ đọc một bảng log; chống trùng bằng unique key nguồn máy; endpoint ngoài qua Core giữ mô hình auth; kiosk không cần tài khoản tenant.
- (−) Core thêm 1 route public + logic secret/nonce (test riêng); kiosk thêm bảng thiết bị; GPS bắt buộc trên mobile.
- Kiểm chứng: integration test 5 nguồn về 1 log; push replay/nonce sai/sai secret → 401/409; import trùng → báo cáo; kiosk brute force → lock; geofence ngoài bán kính → meta cảnh báo + record vẫn tính; AC truy vết: AC-A01…A07, AC-M01 (chấm mobile).
