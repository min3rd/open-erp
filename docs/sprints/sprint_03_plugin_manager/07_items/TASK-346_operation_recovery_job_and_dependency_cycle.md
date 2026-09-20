# TASK-346: Job phục hồi thao tác plugin (idempotent recovery) + phát hiện chu trình dependency

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | TASK-346 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) — phát hiện tồn dư so với DES/SOL |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Deferred → Sprint 04 |
| **Liên quan** | TASK-312 (job recovery), TASK-305 (cycle detection), SOL-01 mục 4 |

## Mô tả tồn dư

1. **TASK-312 (phần job recovery)**: S2 + ghi vết `plugin_operation_logs` đã có; nhưng **chưa có job phục hồi** cho trường hợp tiến trình backend chết giữa saga (ledger kẹt `INSTALLING/UPGRADING/UNINSTALLING`, Redis lock còn TTL). Hiện chỉ có bù trừ đồng bộ trong cùng request.
2. **TASK-305 (phần cycle detection)**: `PluginDependencyResolver` có `validateDependencies` + `assertNoDependents` nhưng **chưa phát hiện chu trình** A→B→A (DES/SOL yêu cầu).

## Ảnh hưởng

- Recovery: tenant bị kẹt trạng thái cần can thiệp thủ công (xoá lock/ledger) nếu backend crash đúng thời điểm; tần suất thấp.
- Cycle: plugin tự tham chiếu vòng có thể cài được nếu manifest khai báo vòng (không phổ biến, do người đăng ký kiểm soát).

## Đề xuất (Sprint 04)

1. Scheduled job (mỗi 5 phút): quét ledger ở trạng thái trung gian quá `N` phút → chạy lại health check; nếu container không tồn tại → đưa về `INSTALL_FAILED` + giải phóng lock + audit + thông báo.
2. Bổ sung `assertNoCycles(pluginKey, dependencies)` duyệt DFS theo ledger ACTIVE của tenant; lỗi `PLUGIN_DEPENDENCY_MISSING` (hoặc mã mới `PLUGIN_DEPENDENCY_CYCLE`).

## Lý do hoãn

Cả hai đều là cải thiện độ bền vững (Medium), không chặn luồng chuẩn; cần thiết kế thêm mã lỗi + job scheduler nên gom Sprint 04.
