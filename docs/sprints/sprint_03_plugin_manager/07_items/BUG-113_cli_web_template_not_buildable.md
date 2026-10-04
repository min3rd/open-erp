# BUG-113: `open-erp package --with-web` lỗi vì project web sinh ra thiếu Angular workspace

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-113 |
| **Mức độ** | Medium |
| **Trạng thái** | Resolved (2026-10-04 — chờ QA/Reviewer xác nhận) |
| **Liên quan** | FEAT-22 TASK-323/326/327 |

## Fix (2026-10-04)

- Template `web/` bổ sung workspace Angular tối thiểu: `angular.json`, `tsconfig.json`,
  `tsconfig.app.json`, `.postcssrc.json`, `src/index.html`, `src/styles.css`,
  `src/app/translate.pipe.ts` (i18n pipe nội bộ) và import pipe trong component.
- `package --with-web` tự chạy `npm install` khi thiếu `node_modules`; copy `web/dist/browser/**` →
  `dist/web/**` và `static/**` trong bundle.
- E2E: `ng build` PASS (Application bundle generation complete). Smoke test CLI kiểm tra đủ file
  workspace + builder `@angular/build:application`.

Bằng chứng: `08_testing/evidence/BUG-109_116_fix_verification_2026-10-04.txt`.

## Mô tả

`package --with-web` chạy `ng build` trong `web/` và thất bại:

```
Error: This command is not available when running the Angular CLI outside a workspace.
```

Thư mục `web/` do template sinh có `package.json`, `src/`, `public/` nhưng **không có `angular.json`/workspace config** (hoặc chưa `npm install`) → không build được.

## Hướng sửa đề xuất

- Bổ sung `angular.json` + tsconfig tối thiểu cho template web, hoặc chuyển web template sang Vite/esbuild build script riêng; cập nhật README + CI workflow tương ứng.
- Thêm smoke test CLI: tạo project `--with-web` → `package --with-web` phải PASS (mở rộng `tools/open-erp-cli/test`).
