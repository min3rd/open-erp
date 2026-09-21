# BUG-115: Toàn bộ `PlatformPluginGovernanceResource` không được đăng ký runtime (404 toàn bộ nhóm P12–P23)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-115 |
| **Mức độ** | **Critical** |
| **Phát hiện bởi** | QA/QC Agent — E2E CLI bundle channel |
| **Ngày** | 2026-09-21 |
| **Trạng thái** | To Do (cần điều tra registration/clean build) |
| **Liên quan** | TASK-306/307/308/315, `PlatformPluginGovernanceResource`, UI Cấp/Thu entitlement + Bulk apply + hỗ trợ tenant |

## Mô tả

**Không chỉ P12** — kiểm tra sâu cho thấy **toàn bộ resource class** `PlatformPluginGovernanceResource` (base `/api/v1/platform`) **không xuất hiện trong runtime**:

- `PUT /api/v1/platform/tenants/{id}/plugins/{key}/entitlement` → **404** (P12)
- `POST /api/v1/platform/plugins/{key}/bulk-apply/preview` → **404** (P10)
- `/q/openapi` **không chứa** `entitlement`, `bulk-apply`, `tenant-private-plugins`, `tenants/{tenantId}/plugins`.

Trong khi các resource cùng module hoạt động bình thường: `PlatformPluginAdminResource` (`/platform/plugins` P1–P8), `TenantPluginResource`, `PluginRuntimeGatewayResource`… và class đã được biên dịch (`target/classes/.../PlatformPluginGovernanceResource.class` tồn tại).

Hệ quả: Portal mất chức năng Cấp/Thu entitlement (TASK-315), Bulk apply (P10/P11), hỗ trợ tenant (P19–P23), governance tenant-private (P14/P15) — UI hiển thị trang nhưng bảng rỗng/không thao tác được; test tự động không phát hiện vì **không có test HTTP-level** cho nhóm này.

## Đã thử

- Rename class/file (nghi artifact đăng ký) → vẫn 404 (đã revert).
- Grep log dev mode: không có cảnh báo `Ambiguous/conflict/RESTEASY003`.

## Giả thuyết & bước tiếp theo

1. **Dev-mode stale build**: chạy `mvn clean` + khởi động backend sạch, kiểm tra lại `/q/openapi` và 404 — nếu hết thì do hot-reload.
2. Kiểm tra CDI: resource có dependency nào unsatisfied âm thầm (ví dụ `PluginBulkApplyService`/`PluginEntitlementService`) hoặc bị `quarkus.arc.exclude-types`.
3. So sánh annotation với `PlatformPluginAdminResource` (khác biệt duy nhất: path con trùng tiền tố `/plugins/{pluginKey}/...` với resource khác — kiểm tra xung đột route ở RESTEasy Reactive).
4. Bổ sung **RestAssured test** cho P10–P15, P19–P23 để khóa hồi quy.

## Bằng chứng

- `08_testing/evidence/TASK-344_cli_bundle_channel_e2e.txt` (STEP5 entitlement 404).
- Probe: `BULK_PREVIEW=404`, OpenAPI không có `bulk-apply`/`entitlement`/`tenant-private-plugins`.
