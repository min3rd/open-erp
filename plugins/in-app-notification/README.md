# In-app Notification plugin

Plugin mẫu Sprint 06: header bell + tab cấu hình trong `/settings/system` + màn hình danh sách.

- Zero-DB: đọc/ghi qua `PluginDataClient` và query descriptor.
- UI: Web Component `op-in-app-notification-app`, `op-in-app-notification-bell`, `op-in-app-notification-settings`.
- Core render contribution vào slot; plugin chỉ đăng ký vị trí + component.

## Build

```bash
npm --prefix src/frontend/web run build -- --project notification-plugin
mvn -q -f plugins/pom.xml -pl in-app-notification -am package -DskipTests
docker build -f plugins/in-app-notification/deploy/Dockerfile -t open-erp/in-app-notification:1.0.0 .
```
