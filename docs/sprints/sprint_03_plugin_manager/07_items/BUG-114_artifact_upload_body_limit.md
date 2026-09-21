# BUG-114: Upload artifact >10MB thất bại dù giới hạn nghiệp vụ 512MB (HTTP body limit)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-114 |
| **Mức độ** | High |
| **Trạng thái** | Resolved (2026-09-21) |
| **Liên quan** | TASK-332, `application.properties` |

## Mô tả

`POST /platform/plugins/artifacts/upload` với bundle 37.6MB trả về lỗi (upload rỗng `ref=`) trong khi `openerp.plugin.max-artifact-size-mb=512`. Nguyên nhân: Quarkus HTTP body limit mặc định (~10MB) chặn trước khi vào service.

## Sửa

- Thêm `quarkus.http.limits.max-body-size=600M` (bao trùm giới hạn 512MB nghiệp vụ) vào `application.properties`.
- Verify: upload lại bundle 37.6MB → OK (`ref=local://6351448d-.../bundle.zip`, size=37634115).
