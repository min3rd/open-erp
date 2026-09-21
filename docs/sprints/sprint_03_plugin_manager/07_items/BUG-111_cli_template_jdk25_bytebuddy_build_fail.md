# BUG-111: Plugin do CLI sinh không build được trên JDK 25 (ByteBuddy/Hibernate)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-111 |
| **Mức độ** | High |
| **Trạng thái** | Resolved (2026-09-21) |
| **Liên quan** | FEAT-22 TASK-323/327, `tools/open-erp-cli/src/lib/templates.js` |

## Mô tả

`open-erp package` trên project sinh bởi CLI thất bại khi máy dev dùng JDK 25:

```
Build step HibernateOrmProcessor#pregenProxies threw an exception:
Java 25 (69) is not supported by the current version of Byte Buddy ... set net.bytebuddy.experimental
```

Repo backend chính đã xử lý bằng `JAVA_TOOL_OPTIONS`/pom, nhưng template plugin thiếu.

## Sửa

- Template sinh thêm `.mvn/jvm.config` chứa `-Dnet.bytebuddy.experimental=true`.
- Verify: build lại project QA sinh bởi CLI → `mvn package` PASS (uber-jar 43.7MB).

## Tiêu chí kiểm tra

- [x] `open-erp package` build backend thành công trên JDK 25.
