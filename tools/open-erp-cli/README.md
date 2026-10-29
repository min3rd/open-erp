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
| *(không lệnh)* / `wizard` | Mở wizard tương tác: tạo plugin, entity, field, relation, CRUD, UI contribution, validate |
| `create` | Sinh plugin zero-DB (template 2.0: manifest, backend Quarkus + plugin-sdk, migrations, Web WC, deploy, CI) |
| `generate entity` | Sinh POJO + migration + query descriptor + quyền + checksum |
| `generate field` | Thêm field + migration + Java property |
| `generate relation` | FK cùng plugin hoặc soft-ref Core/plugin khác |
| `generate crud` | Sinh Angular list/drawer + Java DTO/service/resource + queries + screen |
| `generate menu` | Đăng ký màn hình riêng (route + menu + i18n) |
| `generate ui-contribution` | Đăng ký UI Contribution vào slot (`web-component` / `module-federation`) |
| `validate` | Offline manifest/field/relation/slot/checksum; `--core-url` kiểm tra registry/slot |
| `upgrade` | `--check`/`--apply` template 2.0, backup `.open-erp/upgrade-*`, giữ file customized |
| `package` | Build backend (uber-jar) + Web + `dist/bundle.zip` (layout ImageBuilder) + checksum SHA-256 + release manifest |
| `publish` | Upload bundle (`--source bundle`) hoặc image (`--source image`) lên registry nội bộ, in payload đăng ký version |
| `link` | Thêm repo plugin làm git submodule |
| `inspect` | In tóm tắt manifest + kết quả validate |
| `dev` | Sinh `docker-compose.dev.yml` chạy plugin local |

## Ví dụ

```bash
# Wizard tương tác
npx @open-erp/cli

# Hoặc chạy bằng flag (CI)
npx @open-erp/cli create --id open-erp-hrm --name "HRM" --target plugins/open-erp-hrm --non-interactive
cd plugins/open-erp-hrm
npx @open-erp/cli generate entity --name Employee --fields "code:string:required+unique,title:string"
npx @open-erp/cli generate relation --entity Employee --name department --target core.department --storage SOFT_REF
npx @open-erp/cli generate crud --entity Employee
npx @open-erp/cli generate ui-contribution --slot core.dashboard.widgets --render-mode web-component
npx @open-erp/cli validate --core-url http://localhost:8088 --token "$OPENERP_TOKEN"
npx @open-erp/cli upgrade --check
npx @open-erp/cli package --with-web
npx @open-erp/cli publish --registry http://localhost:8088 --credential OPENERP_TOKEN
npx @open-erp/cli dev --core-url http://localhost:8088
```

> Plugin **zero-DB**: không khai báo datasource/Flyway/Panache/`tenant_id`; DB đi qua `PluginDataClient` + query descriptor. Template mặc định dùng Web Component; iframe không còn được sinh.

## Kiểm thử

```bash
npm test   # node --test (smoke test create → generate → validate)
```
