# TASK-346: Job phục hồi thao tác plugin (idempotent recovery) + phát hiện chu trình dependency

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | TASK-346 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) — phát hiện tồn dư so với DES/SOL |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Done (2026-10-05 — code + test 4/4 PASS) |
| **Liên quan** | TASK-312 (job recovery), TASK-305 (cycle detection), SOL-01 mục 4 |

## Kết quả triển khai (2026-10-05)

Rút khỏi danh sách hoãn; làm luôn trong Sprint 03.

### 1. Phát hiện chu trình dependency (TASK-305 phần còn lại)
- `PluginDependencyResolver.assertNoCycles(tenantId, pluginKey, dependencies)` — dựng đồ thị từ
  các plugin `ACTIVE` của tenant + danh sách dependency của plugin đang cài/nâng cấp, DFS phát
  hiện đường quay lại chính nó (A→B→A).
- Gọi trong `PluginLifecycleService.install` và `.upgrade` (sau `validateDependencies`).
- Mã lỗi mới `PLUGIN_DEPENDENCY_CYCLE` (HTTP 409), trả `plugin_key` + `removal_plan` trong `params`.

### 2. Job phục hồi thao tác plugin (TASK-312 phần còn lại)
- `PluginOperationRecoveryService.recoverStale(staleMinutes, now)`: quét `tenant_plugins` ở trạng thái
  trung gian (`INSTALLING`/`UPGRADING`/`UNINSTALLING`) cũ hơn ngưỡng; nếu container không còn sống
  (`deployer.health`) → đưa về `INSTALL_FAILED`, `last_error_code=PLUGIN_OPERATION_RECOVERY_ABANDONED`,
  giải phóng lock, ghi audit (`TENANT_PLUGIN_OPERATION_RECOVERED`) và tạo thông báo tenant.
- `PluginOperationRecoveryJob`: scheduler Vert.x periodic (worker thread, mirror `ImpersonationTimeoutJob`),
  cấu hình `openerp.plugin.recovery.{jobs-enabled,interval-seconds,stale-minutes}`, tắt ở `%test`.
- `PluginOperationLockService.forceRelease(tenantId, pluginKey)` — xoá lock không an toàn token cho
  trường hợp tiến trình chết; `release` thường vẫn giữ nguyên ngữ nghĩa an toàn.
- Nhánh `UNINSTALLING` cũng được phục hồi về `INSTALL_FAILED` (không giữ trạng thái treo).

### 3. Kiểm chứng
`PluginOperationRecoveryTest` (PostgreSQL thật): **4/4 PASS, BUILD SUCCESS** —
chu trình bị từ chối, chuỗi hợp lệ được nhận, saga cũ được phục hồi, saga mới được giữ nguyên.

### 4. Việc ghi nhận cho Sprint sau (không chặn)
- Trạng thái phục hồi hiện dùng `INSTALL_FAILED` cho cả upgrade treo; có thể tách `UPGRADE_ABANDONED`
  nếu cần phân biệt trong báo cáo vận hành.
- Nên bổ sung test "tiến trình còn sống" (noop deployer healthy) để chắc chắn không phục hồi nhầm.

## Mô tả tồn dư

1. **TASK-312 (phần job recovery)**: S2 + ghi vết `plugin_operation_logs` đã có; nhưng **chưa có job phục hồi** cho trường hợp tiến trình backend chết giữa saga (ledger kẹt `INSTALLING/UPGRADING/UNINSTALLING`, Redis lock còn TTL). Hiện chỉ có bù trừ đồng bộ trong cùng request.
2. **TASK-305 (phần cycle detection)**: `PluginDependencyResolver` có `validateDependencies` + `assertNoDependents` nhưng **chưa phát hiện chu trình** A→B→A (DES/SOL yêu cầu).

## Ảnh hưởng

- Recovery: tenant bị kẹt trạng thái cần can thiệp thủ công (xoá lock/ledger) nếu backend crash đúng thời điểm; tần suất thấp.
- Cycle: plugin tự tham chiếu vòng có thể cài được nếu manifest khai báo vòng (không phổ biến, do người đăng ký kiểm soát).

## Đề xuất (Sprint 04)

1. Scheduled job (mỗi 5 phút): quét ledger ở trạng thái trung gian quá `N` phút → chạy lại health check; nếu container không tồn tại → đưa về `INSTALL_FAILED` + giải phóng lock + audit + thông báo.
2. Bổ sung `assertNoCycles(pluginKey, dependencies)` duyệt DFS theo ledger ACTIVE của tenant; lỗi `PLUGIN_DEPENDENCY_MISSING` (hoặc mã mới `PLUGIN_DEPENDENCY_CYCLE`).

## Lý do từng hoãn (đã huỷ — đã làm trong Sprint 03)

Trước đây ghi nhận là cải thiện độ bền vững (Medium) cần thiết kế thêm mã lỗi + job scheduler nên
gom Sprint 04. Ngày 2026-10-05 chủ dự án yêu cầu làm luôn; đã triển khai và kiểm chứng (xem mục trên).
