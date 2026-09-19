# [BENCH-01] Nghiên Cứu Đối Chuẩn Thị Trường: Quản Lý Danh Mục & Vòng Đời Plugin Theo Tenant

- **Mã Tài Liệu**: BENCH-01
- **Phụ Trách**: BA Agent
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Ngày Hoàn Thành**: 2026-09-19
- **Hệ Thống Khảo Sát**: Odoo Apps, ERPNext/Frappe, WordPress (Multisite), Salesforce AppExchange, Atlassian Marketplace
- **Tài Liệu Liên Quan**: [ANL-01](../02_analysis/ANL-01_plugin_manager_lifecycle.md)

---

## 1. Mục Đích Khảo Sát

Khảo sát cách các nền tảng ERP/SaaS hàng đầu quản lý **danh mục plugin (module/app), phiên bản, vòng đời cài–nâng cấp–gỡ, phân phối theo từng tenant và cô lập dữ liệu** — nhằm kiểm chứng các quyết định của Sprint 03 (một bảng entitlement + cài đặt; container-per-tenant; schema/DB riêng; giữ dữ liệu khi gỡ; đa phiên bản; plugin riêng của tenant) và học hỏi best practices.

---

## 2. Bảng So Sánh Tổng Hợp

| Tiêu Chí | Odoo Apps | ERPNext / Frappe | WordPress Multisite | Salesforce AppExchange | Open-ERP Sprint 03 (Đề Xuất) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mô hình tenant & dữ liệu** | **Database-per-tenant** (Odoo.sh); multi-company trong 1 DB dùng Record Rules | **Site-per-tenant**: mỗi site 1 database + app riêng (`site_config.json`) | Network chung, bảng `wp_<id>_*` per-site; user dùng chung | **Org-per-tenant** (mỗi khách 1 org, dữ liệu tách tuyệt đối) | `DEDICATED_SCHEMA` mặc định / `DEDICATED_DATABASE` cho Enterprise; Core giữ `SHARED_SCHEMA_RLS` (Sprint 03) |
| **Cài đặt theo tenant** | Cài module theo DB (`ir_module_module`), bật/tắt theo company | `bench --site <site> install-app <app>` | Network Activate / Site Activate | Cài managed package theo org, ghim phiên bản | Ledger `tenant_plugins` (entitlement + trạng thái), cài qua Marketplace; **mỗi tenant 1 container** |
| **Manifest plugin** | `__manifest__.py`: `depends`, `version` (17.0.x.y.z), `data` | `hooks.py`, `patches.txt`, module DocType | Header comment trong file plugin + readme.txt | `sfdx-project.json` + package version | `plugin.json` (id, SemVer, compatibility, dependencies, platforms, permissions, entities, UI, distribution) |
| **Phụ thuộc** | Khai báo `depends`, Odoo tự cài kèm dependency | `required_apps` trong hooks | Không có (plugin tự kiểm tra) | Package dependency/namespace | Chặn cài nếu thiếu phụ thuộc; chặn gỡ nếu có dependents + lộ trình gỡ |
| **Nâng cấp** | `Apps → Update`; thư mục `migrations/<version>/` với script `pre`/`post`/`end` | `bench migrate` chạy `patches.txt` theo site | Auto-update từ wordpress.org (mặc định) | Admin chọn nâng cấp; publisher có **push upgrade** | Tùy chọn theo tenant; plugin tự migrate trong schema riêng; rollback container bản cũ nếu lỗi |
| **Gỡ plugin & dữ liệu** | **Xóa bảng/dữ liệu module** khi uninstall (rủi ro mất dữ liệu) | Gỡ app khỏi site, dữ liệu tùy app | Thường **bỏ lại dữ liệu mồ côi** (options/tables) | Uninstall xóa components; **khuyến nghị export dữ liệu trước** | **Soft Uninstall: giữ nguyên 100% dữ liệu**; schema riêng nên không ảnh hưởng tenant khác; purge ngoài Sprint 03 |
| **Đa phiên bản song song** | Không (1 DB dùng 1 phiên bản module) | Không (site dùng 1 phiên bản app) | Có thể (từng site chạy phiên bản plugin khác nhau) | Org ghim phiên bản package khác nhau | **Có** — tenant A v1, tenant B v2 (container-per-tenant) |
| **Entitlement / thương mại** | Apps Store trả phí, license theo DB | Marketplace (một số app trả phí) | Free chủ yếu | **License per user/org**, trial, private offer | `allowed_plugins` theo gói/tenant (1 bảng), không trial (Q7) |
| **Kiểm duyệt bên thứ ba** | Tương đối mở, không kiểm duyệt sâu | Mở (git-based) | Mở, **nhiều lỗ hổng supply-chain** | **Security review bắt buộc** để lên AppExchange | Super Admin kiểm duyệt plugin công khai; **Tenant Admin tự đăng ký plugin riêng** (`TENANT_PRIVATE`) có giám sát + khóa |
| **Audit** | Log cài/gỡ module | Log migrate theo site | Hạn chế | Audit trail/Event Monitoring mạnh | Audit bất biến mọi thao tác vòng đời + deploy |

---

## 3. Phân Tích Chuyên Sâu

### 3.1. Odoo (Apps & Odoo.sh) — Chuẩn mực Database-per-Tenant cho ERP SaaS

- **Kiến trúc**: Mỗi tenant (Odoo.sh) có **database PostgreSQL riêng**; danh sách module cài đặt lưu ở bảng `ir_module_module` trong chính DB đó. Đây là minh chứng rõ nhất cho yêu cầu "dữ liệu riêng của tenant ở schema/DB khác nhau" của khách hàng.
- **Manifest & phụ thuộc**: `__manifest__.py` khai báo `depends` (danh sách module cha) và `version` theo series (ví dụ `17.0.1.2.0`). Odoo tự động cài module phụ thuộc trước.
- **Migration**: Module có thư mục `migrations/<version>/` với các script `pre-`, `post-`, `end-migrate.py` chạy khi nâng cấp — mô hình tham chiếu cho migration theo phiên bản của plugin.
- **Điểm yếu cần tránh**:
  - **Uninstall xóa bảng dữ liệu module** → mất dữ liệu khách hàng; nhiều doanh nghiệp phải backup thủ công trước khi gỡ.
  - Không hỗ trợ nhiều phiên bản module song song trong cùng 1 DB.
- **Bài học cho Open-ERP**: kế thừa DB-per-tenant + manifest phụ thuộc + migration theo phiên bản; nhưng **cải tiến soft uninstall giữ dữ liệu** (Q2) và **đa phiên bản song song** (Q9).

### 3.2. ERPNext / Frappe — Site-per-Tenant & CLI `bench new-app`

- **Kiến trúc**: Mỗi site = 1 database + cấu hình riêng (`site_config.json`), danh sách app riêng (`apps.txt`). Một `bench` phục vụ nhiều site theo hostname — tương đương mô hình `DEDICATED_SCHEMA/DATABASE` + Tenant Datasource Router của Open-ERP.
- **Cài/gỡ theo tenant**: `bench --site <site> install-app <app>` / `uninstall-app`; migrate bằng `bench migrate` chạy `patches.txt` theo từng site.
- **Scaffolding CLI**: `bench new-app <app_name>` sinh khung app chuẩn (hooks.py, module, patches) — tiền lệ trực tiếp cho FEAT-22.
- **Bài học**: mỗi site giữ phiên bản app riêng về lý thuyết nhưng Frappe không tối ưu đa phiên bản; Open-ERP làm tốt hơn nhờ **container-per-tenant + image tag riêng**.

### 3.3. WordPress Multisite — Cảnh Báo Về Supply Chain & Dữ Liệu Mồ Côi

- **Cài đặt**: Network Activate (toàn mạng) hoặc Site Activate (từng site); dữ liệu plugin thường nằm ở bảng `wp_<id>_options`/bảng riêng per-site; user dùng chung toàn network.
- **Sức mạnh**: Catalog khổng lồ, auto-update, cộng đồng lớn; hook/filter tạo hệ sinh thái extension phong phú (menu admin, dashboard widget, metabox = tiền lệ UI Slot).
- **Rủi ro nổi tiếng**:
  - Plugin bên thứ ba gây **lỗ hổng bảo mật/supply-chain** thường xuyên (không ký số mặc định, kiểm duyệt lỏng).
  - Uninstall thường **bỏ lại dữ liệu mồ côi** trong DB làm phình hệ thống; hoặc plugin xóa dữ liệu không cảnh báo.
- **Bài học cho Open-ERP**: cần quản trị chặt (checksum, allowlist registry, Super Admin/tenant-private governance, khóa khẩn cấp, audit) và **quy tắc dữ liệu mồ côi không được làm hỏng Core** (BR-PLG-08); schema riêng giúp xử lý dữ liệu mồ côi sạch sẽ hơn WordPress.

### 3.4. Salesforce AppExchange — Managed Package & Vòng Đời Có Kiểm Duyệt

- **Cài đặt theo org**: mỗi khách thuê là 1 org; managed package cài theo org, **ghim phiên bản**, publisher có thể **push upgrade** theo lịch — tiền lệ cho nâng cấp tùy chọn/đa phiên bản.
- **Kiểm duyệt**: bắt buộc **security review** trước khi lên AppExchange → tiền lệ cho Super Admin duyệt plugin công khai của Open-ERP.
- **Gỡ/gia hạn**: uninstall cần gỡ phụ thuộc trước; nhiều ràng buộc dữ liệu (khuyến nghị export trước) → tiền lệ cho **lộ trình gỡ theo thứ tự phụ thuộc** (BR-PLG-05) và **giữ dữ liệu mặc định** (Open-ERP làm tốt hơn).
- **License**: per-user/per-org, trial, private offer → tham chiếu cho entitlement theo gói.

### 3.5. Atlassian Marketplace (Jira/Confluence)

- **Per-instance install**: app cài theo từng site (Cloud) hoặc instance (Data Center); **license theo số user**; hỗ trợ **private listing** (app nội bộ không công khai) — rất gần với mô hình **plugin riêng của tenant** (`TENANT_PRIVATE`).
- **Forge (Cloud)**: app chạy trên hạ tầng Atlassian (không phải container của khách) — tiền lệ cho mô hình runtime do nền tảng quản lý; Open-ERP chọn container-per-tenant thay vì FaaS nhưng giữ tinh thần "nền tảng quản lý vòng đời".
- **Bài học**: tách **catalog công khai** và **private app**; license/entitlement theo gói; app version tương thích nền tảng.

---

## 4. Bài Học Đúc Rút

1. **Database/Schema-per-tenant là chuẩn mực cho ERP SaaS** (Odoo, Frappe): giải quyết triệt để rủi ro migration chéo tenant mà khách hàng nêu; đổi lại cần quản lý connection pool, backup và provisioning tự động.
2. **Manifest + phụ thuộc + migration theo phiên bản** đã được kiểm chứng (Odoo `__manifest__.py`, `migrations/<version>`) — cơ sở để chốt schema `plugin.json` của Open-ERP.
3. **Gỡ plugin là điểm yếu phổ biến**: Odoo xóa dữ liệu, WordPress bỏ dữ liệu mồ côi → Open-ERP chọn **soft uninstall giữ dữ liệu + schema riêng**, vượt trội cả hai.
4. **Đa phiên bản song song theo tenant** gần như không nền tảng ERP nào làm tốt (do 1 DB dùng chung 1 phiên bản) — lợi thế cạnh tranh của kiến trúc container-per-tenant.
5. **Kiểm duyệt bên thứ ba** (Salesforce security review) và **private listing** (Atlassian) là hai pattern cần có; Open-ERP kết hợp: Super Admin duyệt plugin công khai + Tenant Admin tự đăng ký plugin riêng có giám sát/khóa.
6. **CLI scaffolding** là chuẩn mực của hệ sinh thái (Frappe `bench new-app`; Grafana/Backstage/npm — chi tiết BENCH-02) → FEAT-22 đi đúng hướng.

---

## 5. Quyết Định Áp Dụng Cho Open-ERP Sprint 03

| # | Bài Học | Áp Dụng Vào Sprint 03 | Truy Vết |
| :---: | :--- | :--- | :--- |
| 1 | DB/schema-per-tenant (Odoo/Frappe) | `DEDICATED_SCHEMA` mặc định + `DEDICATED_DATABASE` cho Enterprise; Tenant Datasource Router; DB role least privilege | ANL-01 mục 4.7; BR-PLG-26→30 |
| 2 | Manifest + dependency graph (Odoo) | `plugin.json` với compatibility/dependencies; chặn cài thiếu phụ thuộc; chặn gỡ có dependents + lộ trình gỡ | ANL-01 mục 3.1, 3.3; BR-PLG-04, 05 |
| 3 | Migration theo phiên bản (Odoo) | Plugin tự migrate theo phiên bản, idempotent, có `down` cho rollback nâng cấp | ANL-01 BR-PLG-06, 17 |
| 4 | Rủi ro mất dữ liệu khi uninstall (Odoo/WordPress) | Soft uninstall giữ dữ liệu; purge ngoài Sprint 03; dữ liệu mồ côi không ảnh hưởng Core | ANL-01 mục 4.5; BR-PLG-07, 08 |
| 5 | Version pinning per org (Salesforce/Atlassian) | Mỗi tenant ghim phiên bản; nâng cấp tùy chọn; rollback bản liền trước | ANL-01 BR-PLG-14; ANL-03 mục 7 |
| 6 | Security review + private listing (Salesforce/Atlassian) | Super Admin kiểm duyệt plugin công khai; plugin riêng của tenant (`TENANT_PRIVATE`) có `allow_custom_plugins` + giám sát + khóa | ANL-01 mục 2.3; BR-PLG-22→25 |
| 7 | License/entitlement theo gói (Salesforce/Atlassian) | `allowed_plugins` + `plan_tier` trong ledger một bảng | ANL-01 mục 2.2; BR-PLG-03 |
| 8 | CLI scaffolding (Frappe) | Lệnh `create`/`generate`/`package` cho plugin (chi tiết BENCH-02) | ANL-02; FEAT-22 |
