# @open-erp/cli

CLI chung của hệ sinh thái Open-ERP (nhóm lệnh plugin là nhóm đầu tiên).

## Cài đặt

```bash
npm i -g @open-erp/cli
# hoặc dùng trực tiếp
npx @open-erp/cli help
```

## Lệnh

| Lệnh | Mô tả |
| :--- | :--- |
| `create` | Sinh repo plugin mới (manifest, backend Quarkus, migration, Web, deploy, CI) |
| `generate entity` | Sinh entity + migration + quyền + cập nhật manifest |
| `generate menu` | Đăng ký màn hình riêng (route + menu + i18n) |
| `generate ui-contribution` | Đăng ký UI Contribution vào slot (`web-component` / `module-federation` / `iframe`) |
| `validate` | Kiểm tra `plugin.json` theo chuẩn nền tảng |
| `package` | Build backend (uber-jar) + Web + `dist/bundle.zip` (layout ImageBuilder) + checksum SHA-256 + release manifest |
| `link` | Thêm repo plugin làm git submodule |
| `inspect` | In tóm tắt manifest + kết quả validate |
| `dev` | Sinh `docker-compose.dev.yml` chạy plugin local |

## Ví dụ

```bash
npx @open-erp/cli create --id open-erp-hrm --name "HRM" --packaging image --non-interactive
cd open-erp-hrm
npx @open-erp/cli generate entity --name Employee --fields "code:string,title:string"
npx @open-erp/cli generate ui-contribution --slot core.dashboard.widgets --render-mode web-component
npx @open-erp/cli validate
npx @open-erp/cli package --with-web
npx @open-erp/cli dev --core-url http://localhost:8088
```

## Kiểm thử

```bash
npm test   # node --test (smoke test create → generate → validate)
```
