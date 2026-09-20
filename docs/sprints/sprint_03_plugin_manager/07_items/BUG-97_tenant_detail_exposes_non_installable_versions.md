# BUG-97: Tenant detail (T2) lộ phiên bản DRAFT/BLOCKED và entitlement_plans

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-97 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | DES-03-API T2, TASK-303, TASK-316 |

## Mô tả

`GET /api/v1/tenant/plugins/{key}` (T2) gọi `PluginAdminService.getDetail()` dùng chung với P2 → trả **toàn bộ phiên bản** (DRAFT/BLOCKED) và `entitlement_plans` (thông tin nội bộ nền tảng). DES mô tả T2 là "chi tiết: **phiên bản khả dụng**, quyền, nền tảng, phụ thuộc".

Hệ quả: tenant thấy phiên bản chưa công bố/bị khóa trong Drawer chi tiết; lộ cấu hình gói entitlement.

## Hướng sửa (đã thực hiện)

- `PluginLifecycleService.tenantDetail()` lọc `versions` chỉ giữ `PUBLISHED`/`DEPRECATED` và đặt `entitlementPlans = null`.
- Test `PluginLifecycleApiTest.testTenantDetail` bổ sung case: đăng ký thêm DRAFT `1.1.0` → T2 chỉ trả `1.0.0` (PUBLISHED).

## Tiêu chí kiểm tra sau sửa

- [x] T2 không trả phiên bản DRAFT/BLOCKED.
- [x] T2 không trả `entitlement_plans`.
- [x] P2 (platform) giữ nguyên hành vi đầy đủ.
