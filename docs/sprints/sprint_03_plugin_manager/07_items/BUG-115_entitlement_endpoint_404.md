# BUG-115: P12 `PUT /platform/tenants/{id}/plugins/{key}/entitlement` trả 404

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-115 |
| **Mức độ** | High |
| **Trạng thái** | To Do |
| **Liên quan** | TASK-306, `PlatformPluginGovernanceResource`, UI Cấp/Thu entitlement (TASK-315) |

## Mô tả

Route được khai báo trong `PlatformPluginGovernanceResource`:

```java
@PUT
@Path("/tenants/{tenantId}/plugins/{pluginKey}/entitlement")
public Response grantEntitlement(...)
```

Nhưng gọi thực tế trả **404 `NOT_FOUND`** (cả PUT và GET probe), kể cả với SUPER_ADMIN token hợp lệ:

```
PUT /api/v1/platform/tenants/aeea9eed-.../plugins/open-erp-qa-plugin/entitlement -> HTTP 404
```

Nghi vấn: xung đột routing với resource khác trên `/api/v1/platform/tenants/**`, hoặc class-level path/annotation không được đăng ký như mong đợi. Hệ quả: nút "Cấp/Thu entitlement" trên Portal (TASK-315) và luồng QA không dùng được API này.

## Cần làm

- Kiểm tra đăng ký route runtime (OpenAPI `/q/openapi` hoặc log Quarkus `Routes`), xác định resource nào chiếm path.
- Bổ sung test RestAssured cho P12/P13 (hiện chưa có test HTTP-level).
- Bằng chứng: `08_testing/evidence/TASK-344_cli_bundle_channel_e2e.txt` (STEP5).
