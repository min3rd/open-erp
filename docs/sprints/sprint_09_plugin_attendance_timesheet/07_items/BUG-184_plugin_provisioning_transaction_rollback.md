# [BUG-184] Đăng ký doanh nghiệp rollback do default plugin provisioning thất bại

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-184 / Bug / Sprint 09 (phát hiện khi DB test) |
| Severity / trạng thái | **High / Fixed** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-14 / DB test trên PostgreSQL 16 + Redis, database sạch `openerp_test` |
| depends_on / blocks / parent | — / — / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | `src/backend/src/main/java/com/vn9melody/openerp/modules/plugin/service/PluginProvisioningService.java` |

## 1. Hiện tượng

Trên database sạch, 5 test đăng ký/tenant đều fail:

- `AuthResourceApiTest.testCheckSlugEndpoint` — slug vừa đăng ký vẫn báo AVAILABLE.
- `AuthResourceApiTest.testDuplicateRegistrationFieldErrors` — mong 409, nhận 201.
- `PermissionsClaimApiTest.testAccessTokenCarriesPermissions` — mong 200, nhận 401.
- `AuthServiceTest.testBusinessRegistration` — không throw lỗi trùng.
- `QuotaCallSiteMockTest.testRegisterBusinessInvokesQuotaCheck` — `ARJUNA016053: Could not commit transaction`.

## 2. Nguyên nhân

`AuthService.registerBusiness` chạy trong transaction. `PluginProvisioningService.provisionDefaults` gọi `PluginLifecycleService.install` (`@Transactional REQUIRED`). Khi một default plugin (org-structure/employee) không có migration bundle/version, exception bị catch ở provisioning nhưng transaction con đã đánh dấu **rollback-only**, khiến transaction đăng ký tenant rollback toàn bộ.

## 3. Sửa đổi

Chạy từng lần cài default plugin trong transaction riêng:

```java
QuarkusTransaction.requiringNew()
    .run(() -> lifecycleService.install(tenantId, catalog.pluginKey, null, null));
```

Default plugin lỗi không còn đầu độc transaction đăng ký tenant; lỗi vẫn được log warning.

## 4. Kiểm chứng

- 5 test trên: **28/28 PASS** trên `openerp_test` sạch.
- Full backend DB suite: **260 test, 0 failures, 0 errors, 1 skipped**.
- Ghi nhận cảnh báo còn lại: `employee` chưa có `plugin_versions` Published và org-structure thiếu migration bundle trong test profile — không chặn đăng ký tenant nhưng cần bổ sung cho provisioning đầy đủ.
