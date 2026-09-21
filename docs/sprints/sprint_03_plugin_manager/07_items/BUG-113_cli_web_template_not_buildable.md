# BUG-113: `open-erp package --with-web` lỗi vì project web sinh ra thiếu Angular workspace

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-113 |
| **Mức độ** | Medium |
| **Trạng thái** | To Do (Sprint 04) |
| **Liên quan** | FEAT-22 TASK-323/326/327 |

## Mô tả

`package --with-web` chạy `ng build` trong `web/` và thất bại:

```
Error: This command is not available when running the Angular CLI outside a workspace.
```

Thư mục `web/` do template sinh có `package.json`, `src/`, `public/` nhưng **không có `angular.json`/workspace config** (hoặc chưa `npm install`) → không build được.

## Hướng sửa đề xuất

- Bổ sung `angular.json` + tsconfig tối thiểu cho template web, hoặc chuyển web template sang Vite/esbuild build script riêng; cập nhật README + CI workflow tương ứng.
- Thêm smoke test CLI: tạo project `--with-web` → `package --with-web` phải PASS (mở rộng `tools/open-erp-cli/test`).
