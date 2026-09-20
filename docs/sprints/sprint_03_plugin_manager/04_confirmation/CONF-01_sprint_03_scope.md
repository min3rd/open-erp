# [CONF-01] Biên Bản Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu: Sprint 03

- **Mã Biên Bản**: CONF-01
- **Ngày Soạn**: 2026-09-19
- **Ngày Xác Nhận**: 2026-09-19 (khách hàng xác nhận qua phiên review)
- **Đại Diện Khách Hàng**: Người dùng (Product Owner / Customer)
- **Đại Diện Đội Ngũ Dự Án**: BA Agent, Solution Architect, PM Agent
- **Tài Liệu Nguồn**: [RAW-01→03](../01_raw_notes/), [ANL-01](../02_analysis/ANL-01_plugin_manager_lifecycle.md) (v1.4), [ANL-02](../02_analysis/ANL-02_plugin_scaffold_cli.md) (v1.3), [ANL-03](../02_analysis/ANL-03_plugin_distribution_and_installation.md) (v1.4), [BENCH-01/02](../03_benchmarks/)
- **Trạng Thái**: [x] **ĐÃ XÁC NHẬN & PHÊ DUYỆT (2026-09-19) — Confirmation Gate ĐÓNG**; đội dự án đủ điều kiện chuyển sang Bước 5-6 (Nghiên cứu giải pháp & Thiết kế chi tiết), sau đó Bước 7 (Lập trình).

> **Bối cảnh**: Trong phiên review ngày 2026-09-19, khách hàng đã trả lời **25 câu hỏi mở** và chốt **19 quyết định lớn** (xem bảng tổng hợp tại [00_READING_GUIDE.md](../00_READING_GUIDE.md)). Biên bản này tổng hợp phạm vi cam kết, tiêu chí nghiệm thu và **10 câu hỏi chốt cuối** cần khách hàng xác nhận trước khi mở khóa thiết kế kỹ thuật.

---

## 1. Phạm Vi Thực Hiện Được Đề Xuất (In-Scope)

### 1.1. FEAT-21 — Plugin Manager: Danh mục & Vòng đời Plugin (Hệ thống & Tenant)

1. **Danh mục plugin tùy chọn (Plugin Catalog)** trong CSDL: đăng ký plugin + phiên bản (SemVer), trạng thái `DRAFT/PUBLISHED/DEPRECATED/BLOCKED`, metadata đầy đủ (tương thích Core, phụ thuộc, nền tảng Web/Mobile, quyền hạn, entity, nguồn phân phối, cờ `default_install`, phạm vi `visibility`).
2. **Tách biệt Core modules**: `core`, `iam`, `organization`, `platform` quản lý riêng, không nằm trong cơ chế plugin.
3. **Một bảng duy nhất `tenant_plugins`**: gộp quyền được cài (entitlement — di trú từ `allowed_plugins`) + trạng thái vòng đời + phiên bản ghim + thông tin deploy.
4. **Vòng đời cài đặt theo tenant**: Cài (`INSTALLING → ACTIVE`), Tắt/Bật (`INACTIVE ⇄ ACTIVE`), Nâng cấp (tùy chọn, rollback bản cũ nếu lỗi), Gỡ (**Soft Uninstall — giữ nguyên 100% dữ liệu**), trạng thái lỗi `INSTALL_FAILED`.
5. **Container-per-tenant**: mỗi plugin chạy container riêng cho từng tenant; plugin **tự chạy migration** trong không gian dữ liệu riêng khi khởi động; Core giám sát health/status.
6. **Cô lập dữ liệu tenant**: `DEDICATED_SCHEMA` (mặc định) hoặc `DEDICATED_DATABASE` (Enterprise); DB role least privilege; cấm cross-schema; backup/restore theo tenant. Dữ liệu **Core** giữ `SHARED_SCHEMA_RLS` trong Sprint 03 (theo đề xuất BA).
7. **Đa phiên bản song song**: tenant A dùng v1, tenant B dùng v2; hợp đồng API plugin được version hóa.
8. **Cài mặc định cấp hệ thống** (`default_install`) cho tenant mới + thao tác áp dụng hàng loạt có xem trước.
9. **Plugin riêng của Tenant (`TENANT_PRIVATE`)**: Tenant Admin tự đăng ký/cài custom plugin cho tenant mình khi `allow_custom_plugins` bật; Super Admin giám sát + khóa khẩn cấp; artifact vẫn qua xác minh đầy đủ; tài nguyên tính quota tenant.
10. **Khóa plugin khẩn cấp**: chặn cài mới + **cưỡng chế gỡ toàn bộ tenant** + **thông báo tenant bị ảnh hưởng**; dữ liệu giữ nguyên.
11. **Chợ plugin (Marketplace)** cho Tenant Admin (chỉ hiển thị plugin được cấp phép); Mobile read-only; Portal Super Admin quản lý catalog + governance plugin riêng + credentials.
12. **Audit bất biến** mọi thao tác vòng đời + deploy/undeploy; **phụ thuộc**: chặn cài thiếu phụ thuộc, chặn gỡ có dependents kèm **lộ trình thứ tự gỡ**.

### 1.2. FEAT-22 — Plugin Scaffolding CLI (Node.js / npm)

1. **CLI Node.js phát hành npm/npx** package **`@open-erp/cli`** (CLI chung hệ sinh thái — chốt Gate 2026-09-19): `create`, `generate entity`, `generate menu`, `generate ui-contribution`, `validate`, `package`, `link`, `inspect`, `dev` (và `publish` nếu kịp).
2. **`create`**: sinh repo plugin độc lập (git init) đầy đủ manifest `plugin.json`, backend Quarkus Java 21, migration idempotent, Web Angular 22 (+ Mobile tùy chọn), `deploy/` Dockerfile + K8s, `ci/`, README; hỗ trợ `--packaging image|bundle`, `--db postgres|mongodb`, interactive + non-interactive, `--dry-run`/`--force`.
3. **`generate`**: sinh entity (+ migration + repository/service/resource/DTO + `@RegisterEntity` + quyền + i18n); đăng ký menu/màn hình riêng; UI Contribution với `--render-mode web-component|module-federation|iframe`.
4. **`package`**: build JAR + Web, tạo **container image** hoặc **bundle zip**, sinh **checksum SHA-256** + manifest phát hành; ký số để giai đoạn sau.
5. **`link`**: liên kết repo plugin vào repo chính qua **git submodule** tại `plugins/<plugin-id>/`.
6. **Template versioning** gắn phiên bản Core; cập nhật `docs/08_developer_guides/create_new_plugin_guide.md` theo CLI mới.
7. **Lệnh `dev`** (đã chốt vào Sprint 03): chạy plugin local + hot reload + kết nối Core dev (xem Mục 5, câu 10).

### 1.3. FEAT-23 — Phân Phối & Cài Đặt Plugin Đa Kênh

1. **3 kênh đăng ký artifact**: Docker Hub, Image Registry (link + **credentials đa phạm vi platform/tenant**), File **JAR backend + bản build Web** (upload).
2. **Mọi nguồn quy về container image**: bundle JAR + Web được **tự build thành image** rồi deploy; **không** nạp classloader vào Core, **không** cần restart Core.
3. **Xác minh bắt buộc**: manifest schema, **checksum SHA-256**, tương thích Core, phụ thuộc, trùng lặp phiên bản; ký số giai đoạn sau.
4. **Lưu trữ artifact bằng MinIO**; giới hạn dung lượng; allowlist registry (chống SSRF); credentials mã hóa, không trả về UI/log.
5. **Deployer tự động**: `container-per-tenant`; hỗ trợ **Kubernetes API** (staging/production) và **Docker Engine API** (local dev); nhãn chuẩn `tenant_id/plugin_key/version`; resource limits; health check; undeploy khi gỡ (giữ dữ liệu).
6. **Tenant Datasource Router**: cấp datasource riêng theo tenant (schema/database + DB role least privilege) trước khi deploy container.
7. **Hiển thị Web 2 chế độ**: màn hình riêng (menu/route động) + **UI Contribution nhúng vào màn hình có sẵn của Core/plugin khác** bằng **Web Components + Module Federation** (chốt 2026-09-19) — **áp dụng cho cả plugin Official và plugin riêng của tenant**; **iframe sandbox** là chế độ dự phòng khi plugin không hỗ trợ WC/MF hoặc cần cô lập tối đa.
8. **UI Slot Registry**: quản lý tập trung danh sách slot (Core + plugin), validate contribution, hiển thị trong Portal Super Admin.
9. **Nâng cấp/rollback**: nâng cấp tùy chọn theo tenant; rollback container về bản liền trước khi lỗi; gỡ artifact khỏi catalog chỉ khi không còn tenant dùng.
10. **UI Anti-Modal**: Drawer đăng ký 3 kênh, timeline phiên bản, credentials, marketplace; Portal Super Admin governance plugin riêng.

---

## 2. Phạm Vi Chưa Thực Hiện Trong Sprint Này (Out-of-Scope)

1. **Dùng thử plugin (trial)** — khách hàng đã chốt không làm.
2. **Purge/xóa vĩnh viễn dữ liệu plugin** — Sprint 03 chỉ soft uninstall; purge để giai đoạn sau.
3. **Ký số artifact bắt buộc + quét mã độc chuyên sâu (SBOM/CVE)** — giai đoạn sau; Sprint 03 dùng checksum SHA-256.
4. **Marketplace công khai cho bên thứ ba tự đăng bán plugin** (billing/revenue share) và **chia sẻ plugin riêng giữa các tenant**.
5. **Auto-upgrade không cần xác nhận**; **autoscaling container theo tải** (có thể cân nhắc giữa sprint nếu ưu tiên).
6. **Tách dữ liệu Core sang schema riêng theo tenant** — giữ `SHARED_SCHEMA_RLS` trong Sprint 03.
7. ~~Module Federation cho plugin chưa kiểm duyệt~~ — **đã chốt cho phép** tại Gate 2026-09-19 (xem Mục 8).

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria dạng Given-When-Then)

### 3.1. FEAT-21 — Plugin Manager & Vòng đời

- **AC-21.1 — Cài plugin cho tenant (container + migrate riêng)**:
  - **Given**: Tenant A được cấp phép plugin `sales` (bản 1.3.0 `PUBLISHED`, tương thích Core), chưa cài.
  - **When**: Tenant Admin bấm "Cài đặt" trong Marketplace.
  - **Then**: Hệ thống tạo container riêng cho Tenant A (nhãn `tenant_id/plugin_key/version`), plugin tự chạy migration trong schema riêng, health OK → ledger `ACTIVE`; menu Sales xuất hiện theo RBAC; audit `TENANT_PLUGIN_INSTALLED`.
- **AC-21.2 — Gỡ plugin giữ dữ liệu & cài lại**:
  - **Given**: Plugin Sales đang `ACTIVE` với dữ liệu của Tenant A.
  - **When**: Tenant Admin bấm "Gỡ" (xác nhận giữ dữ liệu).
  - **Then**: Container undeploy, menu/API ẩn (403 `PLUGIN_DISABLED_FOR_TENANT`); **dữ liệu vẫn nguyên trong schema Tenant A**; khi cài lại, dữ liệu cũ vẫn truy cập được (migration idempotent).
- **AC-21.3 — Đa phiên bản song song**:
  - **Given**: Tenant A ghim `sales v1.2.0`; Tenant B ghim `sales v1.3.0`.
  - **When**: Tenant A nâng cấp lên v1.4.0.
  - **Then**: Container của Tenant A đổi image v1.4.0; Tenant B **không bị ảnh hưởng** (vẫn v1.3.0); audit ghi nhận riêng từng tenant.
- **AC-21.4 — Khóa plugin khẩn cấp (cưỡng chế gỡ + thông báo)**:
  - **Given**: Plugin `sales` phiên bản 1.4.0 bị phát hiện lỗ hổng bảo mật; 5 tenant đang cài.
  - **When**: Super Admin bấm "Khóa khẩn cấp" + nhập lý do + xác nhận cưỡng chế gỡ.
  - **Then**: Chặn mọi cài mới/nâng cấp; 5 tenant bị cưỡng chế gỡ (container undeploy, **dữ liệu giữ nguyên**); **thông báo tới Tenant Admin bị ảnh hưởng**; audit `PLUGIN_BLOCKED` + `TENANT_PLUGIN_FORCE_UNINSTALLED`.
- **AC-21.5 — Cài mặc định cấp hệ thống**:
  - **Given**: Plugin `accounting` được đánh dấu `default_install`.
  - **When**: Tenant mới đăng ký.
  - **Then**: Tenant mới tự động có plugin `accounting` ở trạng thái ACTIVE (container deployed) theo quota, không cần thao tác.
- **AC-21.6 — Plugin riêng của Tenant (`TENANT_PRIVATE`)**:
  - **Given**: Tenant A được bật `allow_custom_plugins`; Tenant B không được bật.
  - **When**: Tenant Admin A đăng ký custom plugin từ registry riêng và cài.
  - **Then**: Plugin thuộc sở hữu riêng Tenant A, cài thành công; **Tenant B không thấy/không cài được**; Super Admin thấy trong danh sách governance và có thể khóa.
- **AC-21.7 — Chặn gỡ khi có phụ thuộc (kèm lộ trình)**:
  - **Given**: Plugin `sales` phụ thuộc plugin `inventory`; cả hai đang ACTIVE.
  - **When**: Tenant Admin cố gỡ `inventory`.
  - **Then**: Chặn `PLUGIN_HAS_DEPENDENTS` + trả về **lộ trình thứ tự gỡ** (gỡ `sales` trước, sau đó `inventory`).

### 3.2. FEAT-22 — Plugin Scaffolding CLI

- **AC-22.1 — Tạo dự án plugin chạy được ngay**:
  - **Given**: Developer chạy `npx @open-erp/cli create --id open-erp-hrm --packaging image --db postgres`.
  - **When**: Lệnh hoàn tất.
  - **Then**: Repo đầy đủ (manifest, backend Quarkus, migration, Web, deploy, CI, README), git init; build PASS; test backend mẫu PASS trên PostgreSQL/Redis thật; không tạo file `.spec.ts`.
- **AC-22.2 — Sinh entity/menu/UI contribution**:
  - **Given**: Developer chạy `generate entity`, `generate menu`, `generate ui-contribution --slot core.dashboard.widgets --render-mode web-component`.
  - **When**: Các lệnh hoàn tất.
  - **Then**: Entity + migration + API đúng 4 khuôn mẫu + quyền + i18n; menu route; contribution khai báo `render_mode`; chạy lại không phá file đã chỉnh sửa.
- **AC-22.3 — Đóng gói có checksum**:
  - **Given**: Developer chạy `package`.
  - **When**: Hoàn tất.
  - **Then**: Sinh image/bundle + `SHA-256` cho mọi artifact + Dockerfile/K8s; artifact upload bị Core từ chối nếu checksum sai (liên kết AC-23.2).
- **AC-22.4 — Liên kết repo qua submodule**:
  - **Given**: Repo plugin đã tạo riêng.
  - **When**: Chạy `link`.
  - **Then**: Repo chính có submodule `plugins/<plugin-id>/`; không copy mã nguồn plugin trực tiếp.

### 3.3. FEAT-23 — Phân Phối & Cài Đặt

- **AC-23.1 — Đăng ký từ 3 kênh**:
  - **Given**: Super Admin có image Docker Hub, link registry riêng và gói bundle JAR + Web.
  - **When**: Đăng ký lần lượt 3 nguồn.
  - **Then**: Mỗi nguồn tạo catalog entry `DRAFT` với metadata đúng; Công bố → `PUBLISHED`; tenant cài được như nhau.
- **AC-23.2 — Checksum sai bị từ chối**:
  - **Given**: Gói bundle bị sửa đổi sau khi tính checksum.
  - **When**: Upload/đăng ký.
  - **Then**: Từ chối `PLUGIN_ARTIFACT_CHECKSUM_MISMATCH`; không ghi catalog; audit ghi nhận.
- **AC-23.3 — JAR upload → build image → deploy (không restart Core)**:
  - **Given**: Gói bundle hợp lệ.
  - **When**: Cài cho tenant.
  - **Then**: Core build image từ bundle, deploy container; Core **không restart**; plugin `ACTIVE` sau health check.
- **AC-23.4 — Cô lập dữ liệu tenant (không ảnh hưởng chéo)**:
  - **Given**: Tenant A và Tenant B cùng cài một custom plugin có migration.
  - **When**: Cả hai chạy migration đồng thời.
  - **Then**: Mỗi migration chỉ tác động schema/database của tenant tương ứng; dữ liệu Tenant B nguyên vẹn; DB role của Tenant A **không có quyền** ghi schema Tenant B.
- **AC-23.5 — UI Contribution nhúng (WC/MF) + iframe sandbox**:
  - **Given**: Plugin Official có widget contribution `core.dashboard.widgets` (`render_mode = MODULE_FEDERATION`/`WEB_COMPONENT`); plugin riêng của tenant chưa kiểm duyệt.
  - **When**: Người dùng mở Dashboard Core.
  - **Then**: Widget plugin Official hiển thị nhúng trực tiếp đúng vị trí slot theo quyền, 0 console error; plugin riêng chưa kiểm duyệt render trong **iframe sandbox**; contribution bị ẩn nếu người dùng thiếu quyền.
- **AC-23.6 — Deployer tự động + health + dọn dẹp**:
  - **Given**: Deployer cấu hình backend Docker local (dev) hoặc K8s (staging).
  - **When**: Cài/gỡ plugin.
  - **Then**: Container được tạo/xóa tự động đúng nhãn; container không healthy → `INSTALL_FAILED` (khi cài) hoặc rollback (khi nâng cấp); tài nguyên nằm trong resource limits.
- **AC-23.7 — Credentials đa phạm vi**:
  - **Given**: Platform có 2 credential; Tenant A có credential registry riêng.
  - **When**: Cài plugin từ registry của tenant.
  - **Then**: Hệ thống dùng đúng credential theo phạm vi; secret không bao giờ trả về UI/log; audit ghi nhận lượt sử dụng.

---

## 4. Tiêu Chuẩn Kỹ Thuật Bắt Buộc (DoD Gate)

1. **Backend**: 100% logic nghiệp vụ có Unit/Integration Test (JUnit 5 + RestAssured) chạy trên **PostgreSQL + Redis thật** (CẤM H2), bao gồm: vòng đời plugin, entitlement 1 bảng, deploy/undeploy, cô lập tenant (2 tenant cài migration đồng thời), xác minh artifact, đa phiên bản, phân quyền.
2. **Frontend**: **Không viết unit test frontend**; QA Dual-mode browser (Web Desktop ≥1280px + Mobile Emulation 390x844px), **0 console error**, overflow = 0, touch target ≥ 40px.
3. **CLI**: build dự án sinh ra phải PASS ngay trên Windows; `package` sinh checksum đúng.
4. **UI/UX Anti-Modal**: Drawer trượt xếp tầng + Split-Screen; 100% i18n; mật độ cao (`text-xs`/`text-sm`); theme sáng/tối.
5. **Tài liệu**: UG-03 kèm ảnh minh chứng; cập nhật `docs/08_developer_guides/create_new_plugin_guide.md` (CLI mới), `docs/07_deployment_guides/` (MinIO, Deployer, credentials), Entity Registry docs.
6. **DoD Gate đóng Sprint**: 0 item `Critical`/`High` chưa hoàn tất.

---

## 5. Câu Hỏi Chốt Cuối Cần Khách Hàng Xác Nhận (Blocking)

> Khách hàng vui lòng đánh dấu quyết định vào cột cuối. Nếu không có ý kiến khác, BA đề xuất áp dụng phương án đề xuất.

| # | Câu Hỏi | Đề Xuất Của BA | Khách Hàng Chốt (2026-09-19) |
| :---: | :--- | :--- | :--- |
| 1 | Backend deploy Sprint 03 dùng K8s API (staging/prod) + Docker API (local dev)? Ai cấp quyền cluster? | Đúng như đề xuất; Architect thiết kế ServiceAccount tối thiểu quyền tại Bước 5 | **[x] Đồng ý** |
| 2 | Image build từ bundle chạy bằng Docker daemon (local) / Kaniko (K8s)? Push registry nội bộ nào? | Docker local + Kaniko trên K8s; registry nội bộ cấu hình `DOCKER_REGISTRY` | **[x] Đồng ý** |
| 3 | Resource limits mặc định mỗi container plugin (CPU/RAM) + cách override? | Theo plugin (default) + override theo plan/tenant; cấu hình tập trung | **[x] Đồng ý** |
| 4 | Giới hạn số phiên bản runtime đồng thời của một plugin? | Có giới hạn cấu hình (tránh bùng nổ container) | **[x] Đồng ý** |
| 5 | MinIO trở thành dịch vụ bắt buộc khi test tính năng phân phối plugin (local cần `make infra-storage`)? | Chấp nhận — profile on-demand, tài liệu hóa rõ | **[x] Đồng ý — MinIO là công cụ lưu trữ CHÍNH của toàn hệ thống** |
| 6 | Kênh thông báo khi plugin bị khóa khẩn cấp? | **In-app + banner bắt buộc**; email tùy chọn qua SMTP sẵn có | **[x] Đồng ý** |
| 7 | Tenant mới nhận plugin `default_install` ở trạng thái ACTIVE (bật sẵn) hay NOT_INSTALLED (chờ bật)? Plugin mặc định có cho tenant tắt/gỡ? | **ACTIVE** cho plugin bắt buộc (cờ `locked` = không tắt/gỡ); **NOT_INSTALLED** cho plugin tùy chọn | **[x] Đồng ý** |
| 8 | Plugin riêng của tenant: tự động cài khi bật `allow_custom_plugins` hay cần Super Admin duyệt trước? Registry host riêng của tenant có phải qua allowlist nền tảng? | **Tự động** khi bật + giới hạn + audit + khóa khẩn cấp; **Super Admin duyệt host registry** | **[x] Đồng ý** |
| 9 | Plugin riêng của tenant có được nhúng trực tiếp bằng WC/MF vào màn hình Core? | **Không** — mặc định **iframe sandbox**; WC/MF chỉ cho plugin Official/tin cậy | **[x] Khác: ĐƯỢC PHÉP** — plugin riêng của tenant cũng được nhúng trực tiếp WC/MF |
| 10 | Có đưa lệnh **`dev`** (chạy plugin local + hot reload + kết nối Core dev) vào Sprint 03 không? | **Có ở mức tối thiểu** (docker compose + proxy Core dev) | **[x] Đồng ý (Có)** |

> **Ghi chú**: Câu 5 và Câu 9 có điều chỉnh so với đề xuất BA — đã cập nhật đồng bộ vào ANL-01/ANL-02/ANL-03 (v1.4/v1.3/v1.4), Sprint Plan và Reading Guide (xem Mục 8).

---

## 6. Chữ Ký Phê Duyệt Của Khách Hàng (Customer Sign-Off)

> [!IMPORTANT]
> Khách hàng vui lòng kiểm tra kỹ phạm vi, tiêu chí nghiệm thu và trả lời **10 câu hỏi chốt cuối** (Mục 5). Bằng việc phê duyệt biên bản này, hai bên thống nhất phạm vi Sprint 03; đội dự án được phép chuyển sang **Bước 5 — Nghiên cứu giải pháp kỹ thuật**.

- **Đại diện Khách Hàng**: Người dùng (Customer / Product Owner) — Ngày ký: **2026-09-19** ✅ ĐÃ KÝ
- **Đại diện Kỹ Thuật (Solution Architect)**: Đã ký
- **Đại diện Quản Lý (PM Agent)**: Đã ký

---

## 7. Phụ Lục: Các Quyết Định Đã Chốt Trong Phiên Review 2026-09-19

| Nhóm | Nội Dung Chốt |
| :--- | :--- |
| Dữ liệu & Vòng đời | Một bảng duy nhất (entitlement + cài đặt); gỡ giữ dữ liệu; dữ liệu plugin ở schema/DB riêng theo tenant; dữ liệu Core giữ shared + RLS trong Sprint 03 |
| Khóa & Mặc định | Khóa = cưỡng chế gỡ toàn bộ tenant + thông báo; plugin mặc định hệ thống áp dụng cho tenant mới |
| Core & Marketplace | Core modules tách riêng; Marketplace chỉ hiển thị plugin được cấp phép; không có trial |
| Runtime & Phân phối | Mỗi tenant một container + tự động deploy; JAR upload → build image; MinIO; checksum (ký số giai đoạn sau); credentials đa phạm vi platform/tenant |
| Phiên bản & Phụ thuộc | Đa phiên bản song song theo tenant; plugin tự migrate; chặn gỡ có dependents + lộ trình |
| CLI & UI | CLI Node/npm, repo riêng + submodule, command sinh entity/menu; UI 2 chế độ với Web Components + Module Federation, iframe sandbox dự phòng |
| Tenant custom | Tenant Admin được đăng ký/cài custom plugin cho tenant mình (`TENANT_PRIVATE`), nền tảng giám sát + khóa |

---

## 8. Phụ Lục Xác Nhận Sau Gate (2026-09-19)

1. **MinIO là công cụ lưu trữ chính của toàn hệ thống** (không chỉ artifact plugin) — cập nhật ANL-03 mục 5, Sprint Plan guardrails, tài liệu deployment.
2. **Plugin riêng của tenant ĐƯỢC PHÉP nhúng trực tiếp bằng Web Components/Module Federation** (khác đề xuất BA về mặc định iframe sandbox) — cập nhật ANL-01 BR-PLG-31, ANL-03 mục 4.4/6, Sprint Plan guardrail & rủi ro; các biện pháp an toàn kỹ thuật chung (CSP, error boundary, Shadow DOM, shared-lib version pin, RBAC, audit) vẫn bắt buộc.
3. **Lệnh `dev` được đưa vào Sprint 03** (FEAT-22) — cập nhật ANL-02 mục 3/5.5/9/10, Sprint Plan DoD.
4. **Bổ sung muộn (2026-09-19)**: package CLI chung đặt tên **`@open-erp/cli`** (thay tên làm việc `@openerp/plugin-cli`) — cập nhật ANL-02, SOL-03, BENCH-02 và CONF-01 Mục 1.2.
