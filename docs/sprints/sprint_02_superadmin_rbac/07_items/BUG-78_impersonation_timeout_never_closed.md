# [BUG-78] Phiên Impersonation Hết Hạn Không Bao Giờ Đóng — Chặn Khóa Tenant Vĩnh Viễn (409 PLATFORM_TENANT_IMPERSONATION_ACTIVE)

- **Mã Lỗi**: BUG-78
- **Phân Loại**: Bug / Defect (Lifecycle + Data Integrity)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Browser Dual-Mode Testing Sprint 02)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(đóng lại 2026-09-19 sau khi BUG-82 sửa xong job sweeper)*
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Khi một phiên đại diện (impersonation) kết thúc **không bình thường** (đóng trình duyệt, token hết TTL 1800s, mất kết nối — frontend xóa token cục bộ nhưng không gọi `POST /platform/impersonate/exit`), bản ghi `platform_impersonation_logs` **mãi mãi giữ `status = 'STARTED'`**. Không có job/cơ chế nào chuyển các phiên quá hạn sang `TIMEOUT`/`ENDED` (mặc dù enum `ImpersonationStatus.TIMEOUT` và `PlatformAction.IMPERSONATION_TIMEOUT` đã được khai báo nhưng **không nơi nào sử dụng**).

> Hệ quả: `PlatformTenantService.lockTenant()` kiểm tra `hasActiveImpersonation()` dựa trên **DB log STARTED** và trả **409 `PLATFORM_TENANT_IMPERSONATION_ACTIVE` vĩnh viễn** — Super Admin **không thể khóa tenant khẩn cấp** nữa. Đặc biệt nghiêm trọng khi Redis marker đã hết TTL: token đại diện không còn dùng được và **không thể gọi `exit`** (exit yêu cầu marker Redis còn sống) → không có đường thoát.

- **Môi trường**: Backend Quarkus dev 8088, PostgreSQL `openerp_dev`, Redis thật. Tenant test `qa-test-corp-02` (`20cced6a-...`).

### Bằng chứng (file:line + runtime)

- `src/backend/.../platform/service/PlatformTenantService.java:250-253` — `hasActiveImpersonation()` đếm log `status = STARTED` trong DB (không kiểm tra TTL/Redis).
- `src/backend/.../platform/service/PlatformTenantService.java:176-179` — `lockTenant()` chặn bằng 409 `PLATFORM_TENANT_IMPERSONATION_ACTIVE`.
- `src/backend/.../core/enums/ImpersonationStatus.java:3-6` — có `TIMEOUT` nhưng **không có mã nào set** (grep toàn repo: chỉ `PlatformAction.IMPERSONATION_TIMEOUT` được khai báo, không dùng).
- `src/backend/.../platform/service/ImpersonationService.java:180-184` — `exit()` yêu cầu Redis marker còn tồn tại; marker TTL 1800s đã hết → exit trả 401, log không bao giờ được đóng.

### Bằng chứng runtime

1. QA-W-04 tạo phiên impersonation lúc 02:21 và 02:22 UTC; sau đó trình duyệt bị điều hướng do BUG-75 và không gọi exit (đúng theo luồng frontend hiện tại).
2. Redis sau đó: `keys "impersonation:*"` → **rỗng** (marker đã hết TTL).
3. DB vẫn còn:
   ```
   id=728ca35f-... | tenant=20cced6a-... | status=STARTED
   id=f80c8e37-... | tenant=20cced6a-... | status=STARTED
   ```
4. Gọi khóa tenant:
   ```
   POST /api/v1/platform/tenants/20cced6a-.../lock
   → 409 { "code": "PLATFORM_TENANT_IMPERSONATION_ACTIVE",
           "message": "An impersonation session is currently active for this tenant" }
   ```
5. UI Mobile `/platform/emergency` hiển thị lỗi 409 tương ứng và nút "Mở khóa" không xuất hiện (tenant không hề bị khóa).
   - Ảnh: `../08_testing/screenshots/mobile/QA-M-05_c_tenant_locked.png` (trạng thái lock thất bại).

### Các bước tái hiện (Reproduction Steps)

1. Super Admin bắt đầu impersonation một tenant (Web `/platform/tenants` → "Truy cập đại diện").
2. Đóng trình duyệt/xóa localStorage hoặc để token hết hạn mà **không bấm "Kết Thúc Phiên"**; chờ quá 1800s (hoặc xóa Redis key `impersonation:session:{id}`).
3. Kiểm tra DB: log vẫn `STARTED`; Redis không còn marker.
4. Gọi `POST /platform/tenants/{id}/lock` với SUPER_ADMIN → **409 PLATFORM_TENANT_IMPERSONATION_ACTIVE**; lặp lại vẫn 409 vĩnh viễn.

## 2. Tác Động

- Mất khả năng **khóa khẩn cấp tenant** (tính năng an toàn cốt lõi của Sprint 02) sau bất kỳ phiên đại diện kết thúc bất thường.
- Dữ liệu audit sai lệch: log phiên đại diện không bao giờ kết thúc, không có bản ghi `IMPERSONATION_TIMEOUT` như thiết kế (TC-BE-19).
- Không có endpoint/job nào để đóng thủ công → buộc can thiệp SQL trực tiếp vào `platform_impersonation_logs`.

## 3. Kết Quả Kỳ Vọng

- Thêm job định kỳ (hoặc kiểm tra khi truy vấn) chuyển các phiên `STARTED` quá TTL 1800s sang `TIMEOUT` (set `ended_at`) + ghi audit `PlatformAction.IMPERSONATION_TIMEOUT` (TC-BE-19).
- `hasActiveImpersonation()` chỉ tính phiên còn hiệu lực thực sự (kết hợp Redis marker hoặc `started_at + TTL > now`).
- Bổ sung test backend: tạo phiên, giả lập hết hạn → lock tenant thành công; log chuyển `TIMEOUT`.
- (Tùy chọn) Endpoint/CLI đóng phiên đại diện treo cho Super Admin.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer bổ sung timeout job + điều kiện hiệu lực trong `hasActiveImpersonation()`.
- [ ] QA re-test: sau khi phiên hết hạn, khóa tenant trả 200 và log chuyển TIMEOUT.
- [ ] Cập nhật `08_testing/test_report.md` (QA-M-05) sau khi sửa.

## Ghi Chú QA (2026-09-19)

- Phát hiện gián tiếp khi QA-M-05: lock tenant qua màn hình khẩn cấp mobile bị 409 do 2 phiên impersonation treo từ QA-W-04 (bản thân QA-W-04 cũng không thể exit do BUG-75).
- Đây là lỗi **độc lập với BUG-75**: kể cả khi BUG-75 được sửa, phiên đóng bất thường vẫn cần job timeout để không chặn lock.
- QA đã dọn dẹp dữ liệu test (chuyển 2 log treo sang `TIMEOUT`) để tiếp tục kiểm thử; không sửa mã nguồn.

## Ghi Chú Hoàn Thành (2026-09-19)

- **Cơ chế hiệu lực thực sự (không dựa DB log đơn thuần)**: một log `STARTED` chỉ được coi là "active" khi `started_at + TTL 1800s > now`.
  - `src/backend/.../modules/platform/service/PlatformTenantService.java:263-268` — `hasActiveImpersonation()` lọc theo TTL; `:183` — `lockTenant()` gọi `closeExpiredSessions(now, tenantId)` trước khi kiểm tra → không bao giờ 409 vĩnh viễn.
- **Job cleanup idempotent + audit SYSTEM** (dùng `ImpersonationStatus.TIMEOUT` và `PlatformAction.IMPERSONATION_TIMEOUT` đã khai báo nhưng chưa dùng):
  - `src/backend/.../modules/platform/service/ImpersonationService.java:238-300` — `closeExpiredSessions(now[, tenantId])` chuyển STARTED quá hạn → TIMEOUT, stamp `ended_at`, ghi audit `actor_type = SYSTEM`; thu hồi session/marker Redis nếu còn sống (best effort).
  - `src/backend/.../modules/platform/service/ImpersonationTimeoutJob.java:36-50` — scheduler chạy mỗi 300s; `src/backend/.../resources/application.properties:99,106` — `openerp.platform.impersonation.jobs-enabled` / `interval-seconds`, tắt trong `%test`.
- **Test**: `PlatformTenantApiTest.testExpiredImpersonationDoesNotBlockLock` — tạo phiên `STARTED` quá TTL → `POST /lock` trả **200**, log thành `TIMEOUT` + `ended_at`, audit `IMPERSONATION_TIMEOUT` = 1; sweep lần 2 trả 0 (idempotent). Test cũ `testLockBlockedDuringImpersonation` (phiên còn hạn) vẫn 409.
- Kiểm chứng: full `mvn test` **187/187 PASS** (PostgreSQL + Redis thật, không H2).

## Ghi Chú QA Re-test (2026-09-19) — QA-R-78: FAIL (một phần)

- **PASS đường lock** (mục tiêu chính của BUG-78):
  - Phiên còn hiệu lực → lock trả 409 `PLATFORM_TENANT_IMPERSONATION_ACTIVE` (guard giữ nguyên).
  - Phiên backdate quá TTL → `POST /lock` trả **200 `PLATFORM_TENANT_LOCK_SUCCESS`**; log chuyển **`TIMEOUT`** + `ended_at != null`; audit `IMPERSONATION_TIMEOUT` được ghi; unlock khôi phục `ACTIVE`.
- **FAIL job sweeper định kỳ**: `ImpersonationTimeoutJob` crash mỗi tick 300s — `ERROR ... Cannot start a JTA transaction from the IO thread`; phiên `02e720b2-...` (ticket `TCK-QA-R78-SWEEP`) vẫn `STARTED` sau >10 phút. Đã tách **BUG-82** (High).
- **Kết luận**: QA **mở lại một phần** BUG-78 (chuyển `Done → In Progress`) cho tới khi BUG-82 được xử lý và job PASS thực sự.

## Ghi Chú Đóng Lại (2026-09-19)

- **Đủ cả 2 mục tiêu BUG-78**:
  - *Đường lock* (đã PASS trước đó): phiên quá TTL không chặn khóa tenant — giữ nguyên test `PlatformTenantApiTest.testExpiredImpersonationDoesNotBlockLock` (lock 200, log `TIMEOUT`, audit `IMPERSONATION_TIMEOUT`, sweep lần 2 idempotent).
  - *Job định kỳ* (phần còn thiếu): đã sửa trong **BUG-82** — `ImpersonationTimeoutJob` mở JTA transaction trên worker thread (`vertx.executeBlocking`) thay vì IO thread, nên sweeper tự dọn phiên `STARTED` quá TTL mà không cần thao tác lock/exit. Chi tiết kỹ thuật: `BUG-82_impersonation_timeout_job_io_thread_crash.md`.
- **Test bổ sung xác nhận job dọn phiên**: `ImpersonationTimeoutJobTest` — backdate phiên `STARTED` → `runTimeoutSweep()` → `TIMEOUT` + `ended_at` + audit SYSTEM; gọi lần 2 idempotent; mô phỏng tick từ event loop không crash.
- **Kiểm chứng**: full `mvn test` **193/193 PASS, BUILD SUCCESS** (PostgreSQL + Redis thật).
- BUG-78 chuyển **Done** (chờ QA re-test QA-R-78 xác nhận trên môi trường dev).

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-R2-78/82: PASS → Done

- **Job sweeper thật trên dev**: backend `jobs-enabled=true`, interval 300s; tick đầu tiên `14:31:53` log `ImpersonationService (vert.x-worker-thread-1) Impersonation timeout: 3 overdue session(s) moved to TIMEOUT`.
- Phiên mới `TCK-QA-R2-SWEEP-2` backdate quá TTL không gọi lock/exit → job tự đóng `TIMEOUT` + `ended_at` + audit `IMPERSONATION_TIMEOUT` (actor `SYSTEM`, count=1); phiên bằng chứng cũ `02e720b2-...` (BUG-82) cũng chuyển `TIMEOUT|ended_at=07:31:53Z`.
- **Không còn lỗi thread**: 0 dòng `Cannot start a JTA transaction from the IO thread`, 0 dòng `Impersonation timeout job failed`.
- **Đường lock giữ nguyên**: phiên còn hạn → lock 409 `PLATFORM_TENANT_IMPERSONATION_ACTIVE`; exit 200 `ENDED`; phiên quá hạn → lock **200 `PLATFORM_TENANT_LOCK_SUCCESS`**, log TIMEOUT + audit; unlock khôi phục `ACTIVE`; không còn STARTED tồn đọng.
- Ảnh: `screenshots/web/QA-R2-78_a_audit_impersonation_timeout_rows.png`; log trích: `QA-R2-82_backend_log_evidence.txt`. Kết luận: **Done**.
