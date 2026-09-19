# [BUG-82] Job `ImpersonationTimeoutJob` Crash Mỗi Tick — "Cannot start a JTA transaction from the IO thread"; Phiên Quá Hạn Không Được Đóng Tự Động

- **Mã Lỗi**: BUG-82
- **Phân Loại**: Bug / Defect (Lifecycle / Background job — hồi quy một phần BUG-78)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Re-test Sprint 02, 2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> `BUG-78` đã sửa đúng ở **đường lock** (`lockTenant()` gọi `closeExpiredSessions` trước khi kiểm tra) — QA xác nhận lock tenant thành công sau khi phiên hết hạn. Tuy nhiên **job sweeper định kỳ** (`ImpersonationTimeoutJob`) **thất bại ở MỌI tick** với lỗi:
>
> ```
> ERROR [ImpersonationTimeoutJob] (vert.x-eventloop-thread-0) Impersonation timeout job failed:
> Cannot start a JTA transaction from the IO thread.
> ```
>
> Hệ quả: nếu không có thao tác lock/exit nào xảy ra, các phiên impersonation quá hạn **vẫn mãi ở trạng thái `STARTED`** trong DB và không sinh audit `IMPERSONATION_TIMEOUT` — trái yêu cầu BUG-78/TC-BE-19 ("job định kỳ chuyển phiên quá TTL sang TIMEOUT").

### Bằng chứng runtime (2026-09-19)

1. Tạo phiên `TCK-QA-R78-SWEEP` (log id `02e720b2-34b4-4998-9986-393f2026b2f3`) rồi backdate `started_at` lùi 2 giờ; **không** gọi lock/exit.
2. Backend log (job chạy mỗi 300s theo `openerp.platform.impersonation.interval-seconds=300`):
   ```
   2026-09-19 10:57:16,456 ERROR [ImpersonationTimeoutJob] (vert.x-eventloop-thread-0) Impersonation timeout job failed: Cannot start a JTA transaction from the IO thread.
   2026-09-19 11:02:16,458 ERROR [ImpersonationTimeoutJob] (vert.x-eventloop-thread-0) Impersonation timeout job failed: Cannot start a JTA transaction from the IO thread.
   2026-09-19 11:07:16,447 ERROR [ImpersonationTimeoutJob] (vert.x-eventloop-thread-0) Impersonation timeout job failed: Cannot start a JTA transaction from the IO thread.
   ```
3. Sau > 10 phút (2 tick), DB vẫn:
   ```
   select id, status, ended_at from platform_impersonation_logs where id='02e720b2-...';
   → 02e720b2-... | STARTED | (null)
   ```
4. Ngược lại, đường lock hoạt động: sau khi backdate phiên khác và gọi `POST /lock`, log chuyển `TIMEOUT|ended_at != null`, audit `IMPERSONATION_TIMEOUT` tăng (nguồn: request thread — không phải job).

### Bằng chứng (file:line)

- `src/backend/.../modules/platform/service/ImpersonationTimeoutJob.java:39-45` — `vertx.setPeriodic(intervalSeconds * 1000L, id -> { QuarkusTransaction.requiringNew().run(this::runTimeoutSweep); })`. Callback của `setPeriodic` chạy trên **Vert.x event loop (IO thread)**; `QuarkusTransaction.requiringNew()` từ IO thread ném `Cannot start a JTA transaction from the IO thread`.
- `src/backend/.../resources/application.properties:99-100,106` — job bật ở dev/prod (`jobs-enabled=true`), tắt trong `%test` → **unit test hiện có không phủ được lỗi này** (test gọi service trực tiếp trên test thread, không qua scheduler).

### Các bước tái hiện (Reproduction Steps)

1. Chạy backend dev (`mvn quarkus:dev`), đảm bảo `openerp.platform.impersonation.jobs-enabled=true`.
2. Đăng nhập SUPER_ADMIN → impersonate một tenant (hoặc tạo qua API), lấy log id.
3. `update platform_impersonation_logs set started_at = now() - interval '2 hours' where id='<logId>';` — không gọi exit/lock.
4. Chờ ≥ 1 chu kỳ job (300s) → grep log backend: thấy `ERROR ... Cannot start a JTA transaction from the IO thread` mỗi 300s.
5. `select status from platform_impersonation_logs where id='<logId>'` → vẫn `STARTED`, `ended_at` null.

## 2. Tác Động

- Cơ chế dọn phiên treo tự động (một nửa của BUG-78) **không hoạt động**; DB/audit tích tụ phiên `STARTED` không bao giờ kết thúc.
- Không đạt TC-BE-19 (log TIMEOUT do job) và mục tiêu "job định kỳ" của BUG-78; audit `IMPERSONATION_TIMEOUT` chỉ sinh khi tình cờ có lock.
- Rủi ro tái diễn tình huống khó chẩn đoán: bảng log sai lệch trạng thái, báo cáo phiên đại diện không chính xác.

## 3. Kết Quả Kỳ Vọng

- Job sweeper chạy thành công định kỳ: chuyển phiên `STARTED` quá TTL 1800s → `TIMEOUT` + `ended_at` + audit `IMPERSONATION_TIMEOUT` (actor SYSTEM).
- Cách sửa gợi ý: thay `vertx.setPeriodic` + `QuarkusTransaction` trực tiếp bằng một trong các hướng an toàn thread:
  - dùng Quarkus Scheduler (`@Scheduled(every = "...")` trên method `@Transactional`), hoặc
  - chạy `vertx.executeBlocking(() -> { QuarkusTransaction.requiringNew().run(...); })`, hoặc
  - `vertx.setPeriodic` + inject `ManagedExecutor`/`@Blocking` worker để mở transaction ngoài event loop.
- Bổ sung test phủ scheduler (ví dụ test gọi `runTimeoutSweep` trên worker thread hoặc integration test bật job với interval ngắn).

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer sửa thread model của `ImpersonationTimeoutJob`.
- [ ] QA tái hiện: backdate phiên, chờ 1 chu kỳ job → log `Impersonation timeout: N overdue session(s) moved to TIMEOUT`, DB `TIMEOUT` + `ended_at`, **không còn dòng ERROR**.
- [ ] QA đóng lại BUG-78 (hiện đang mở lại một phần) sau khi job PASS.
- [ ] Cập nhật `08_testing/test_report.md`.

## Ghi Chú QA (2026-09-19)

- QA-R-78: phần **lock không bị chặn** PASS (200 `PLATFORM_TENANT_LOCK_SUCCESS`; log TIMEOUT nhờ đường lock). Phần **kiểm tra log job sweeper** FAIL → QA-R-78 xếp **FAIL (một phần)** cho tới khi BUG-82 được xử lý.
- Không sửa mã nguồn trong quá trình QA; phiên `02e720b2-...` được giữ nguyên `STARTED` làm bằng chứng (dữ liệu test giữ lại theo yêu cầu).

## Ghi Chú Hoàn Thành (2026-09-19)

- **Nguyên nhân**: callback `vertx.setPeriodic(...)` chạy trên Vert.x event loop (IO thread); `QuarkusTransaction.requiringNew()` gọi trực tiếp trong callback → `Cannot start a JTA transaction from the IO thread` mỗi tick, phiên quá hạn mãi ở `STARTED`.
- **Cách sửa (chuẩn Quarkus, không thêm dependency)**: mở transaction bên trong worker callback `vertx.executeBlocking(...)`; bắt + log exception tại worker để job không bao giờ chết/throw trên event loop. Đồng bộ cho cả 3 job cùng pattern:
  - `src/backend/.../platform/service/ImpersonationTimeoutJob.java` — timer gọi `sweepNow()`; `sweepNow()` chạy `QuarkusTransaction.requiringNew().call(this::runTimeoutSweep)` trên worker, lỗi log + trả 0.
  - `src/backend/.../platform/service/TenantLifecycleJob.java` — timer gọi `runOnce()` cùng pattern (giữ `runLifecycle` cho test gọi trực tiếp).
  - `src/backend/.../platform/service/AuditMaintenanceJob.java` — `runPartitionMaintenance()` / `runRetentionMaintenance()` cùng pattern; gỡ helper `inTx`/`safeRun` cũ.
- **Test deterministic (không chờ timer)**:
  - `ImpersonationTimeoutJobTest` (mới, 2 test): backdate phiên `STARTED` quá TTL 1800s → `runTimeoutSweep()` trực tiếp → `TIMEOUT` + `ended_at` + audit `IMPERSONATION_TIMEOUT` (actor SYSTEM); gọi lần 2 trả 0, audit không nhân đôi (idempotent); test thứ hai mô phỏng đúng tick của timer: `vertx.runOnContext` + `sweepNow()` → chạy qua worker, không exception, phiên vẫn đóng.
  - `TenantLifecycleJobTest.testRunOnceOnWorkerDoesNotCrash` (mới) + `AuditMaintenanceJobTest` (mới) — smoke 1 lượt qua worker cho 2 job còn lại, assert không crash.
- **Kiểm chứng**: full `mvn test` **193/193 PASS, BUILD SUCCESS** (PostgreSQL + Redis thật, không H2); log không còn dòng `Cannot start a JTA transaction from the IO thread` / `... job failed`.

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-R2-82: PASS → Done

- Dev backend chạy thật, chờ tick đầu tiên sau khởi động: `14:31:53` job chạy trên **`vert.x-worker-thread-1`** (không phải event loop), đóng 3 phiên quá hạn sang TIMEOUT, audit SYSTEM.
- Grep log toàn phiên backend (`backend.log`): **0** dòng `Cannot start a JTA transaction from the IO thread`, **0** dòng `Impersonation timeout job failed` — lỗi cũ mỗi 300s đã hết.
- Phiên backdate mới tạo trong phiên QA (`TCK-QA-R2-SWEEP-2`) được job tự đóng, chứng minh cơ chế dọn định kỳ hoạt động, không cần lock/exit.
- Ảnh: `screenshots/web/QA-R2-78_a_audit_impersonation_timeout_rows.png`; trích log: `QA-R2-82_backend_log_evidence.txt`. Kết luận: **Done**.
