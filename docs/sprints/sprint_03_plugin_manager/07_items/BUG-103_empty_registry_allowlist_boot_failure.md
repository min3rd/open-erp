# BUG-103: Backend không khởi động được với cấu hình mặc định `openerp.plugin.registry-allowed-hosts=` (rỗng)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-103 |
| **Mức độ** | **Critical** |
| **Phát hiện bởi** | QA/QC Agent — phát hiện khi khởi động backend thật để QA trình duyệt |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-333, `PluginArtifactVerifier`, `application.properties` |

## Mô tả

`application.properties` khai báo `openerp.plugin.registry-allowed-hosts=` (rỗng) và `PluginArtifactVerifier` inject bằng `@ConfigProperty String allowedHosts`. SmallRye coi giá trị rỗng là `null` đối với converter `String` → **quá trình boot thất bại**:

```
ConfigurationException: Failed to load config value of type class java.lang.String for:
openerp.plugin.registry-allowed-hosts
SRCFG00040: ... defined as the empty String ("") which the following Converter considered to be null
```

Hệ quả: **toàn bộ backend không chạy được** ở dev/staging với cấu hình mặc định; 211 test backend vẫn xanh vì `%test` override bằng giá trị không rỗng.

## Cách tái hiện

`make backend` (hoặc `mvn quarkus:dev`) với `application.properties` mặc định → app fail startup, `/q/health/ready` trả 500.

## Hướng sửa (đã thực hiện)

- `PluginArtifactVerifier` inject `Optional<String> allowedHosts` (hợp lệ khi property rỗng/thiếu).
- Bỏ dòng `openerp.plugin.registry-allowed-hosts=` khỏi `application.properties`, thay bằng comment mô tả "để trống = cho phép registry công khai" (giữ `%test` override).

## Tiêu chí kiểm tra sau sửa

- [ ] Backend boot thành công với cấu hình mặc định; `/q/health/ready` = 200.
- [ ] TASK-333 test allowlist vẫn PASS (test override non-empty).
- [ ] QA trình duyệt chạy được (backend đã lên).
