# BUG-116: Install bundle 500 — build image chạy trong transaction saga gây rollback

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-116 |
| **Mức độ** | High |
| **Trạng thái** | To Do |
| **Liên quan** | TASK-334, `PluginLifecycleService.install`, `PluginImageBuilder` |

## Mô tả

Cài plugin từ bundle (uber-jar 37.6MB) trả **500**:

```
Unhandled exception: io.quarkus.arc.ArcUndeclaredThrowableException: Error invoking subclass method
Caused by: jakarta.transaction.RollbackException: ARJUNA016102: The transaction is not active!
```

Nguyên nhân: `resolveBundleImage` gọi `PluginImageBuilder.build()` (chạy `docker build`, có thể pull base image `eclipse-temurin:21-jre` lần đầu) **bên trong transaction JTA** của saga `install()` → vượt transaction timeout (mặc định 120s) → transaction bị rollback giữa chừng → 500 và ledger không nhất quán.

## Hướng sửa đề xuất

- Chuyển image build ra **ngoài transaction**: build ở bước register/publish phiên bản (cache `image_ref` sẵn trong `distribution`) hoặc tách phase non-transactional trước khi mở transaction saga.
- Tối thiểu: nâng `quarkus.transaction-manager.default-transaction-timeout` và bọc build trong `QuarkusTransaction.suspendingExistingTransaction` để không giữ DB connection trong lúc build.
- Bổ sung test: install bundle với image builder `docker` (hoặc mock builder chậm) phải không làm hỏng transaction.

## Bằng chứng

`08_testing/evidence/TASK-344_cli_bundle_channel_e2e.txt` (STEP6) + log backend `qa-backend3.log` (10:44:46).
