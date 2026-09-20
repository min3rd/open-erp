# Kế Hoạch Tổng Thể Sprint 03: Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin

- **Mã Sprint**: SPRINT-03
- **Tên Sprint**: Plugin Manager (Hệ thống & Tenant), Plugin Scaffolding CLI & Cơ Chế Phân Phối/Cài Đặt Plugin Đa Kênh
- **Thời Gian Dự Kiến**: 2026-10-20 đến 2026-11-02 (10 ngày làm việc)
- **Người Quản Lý**: PM Agent
- **Đội Ngũ Tham Gia**: BA Agent, Solution Architect Agent, Developer Agent, QA/QC Agent
- **Phiên Bản**: Draft v1.1 — đã tích hợp toàn bộ quyết định của khách hàng tại phiên review Bước 1-2 ngày 2026-09-19
- **Trạng Thái**: [x] **ĐÃ PHÊ DUYỆT — Confirmation Gate ĐÓNG (2026-09-19)**; sẵn sàng thực hiện Bước 5-6 (Nghiên cứu giải pháp & Thiết kế chi tiết), sau đó Bước 7 (Lập trình).

---

## 1. Mục Tiêu Chiến Lược Của Sprint (Sprint Goal)

Biến cơ chế plugin tĩnh (danh mục cấu hình + allowlist) của Sprint 02 thành **Plugin Manager thực thụ** theo `SYSTEM_BLUEPRINT.md` mục 2.1.5, gồm 3 trụ cột:

1. **Quản lý plugin hệ thống & tenant (FEAT-21)**: Danh mục plugin + phiên bản trong DB; **một bảng duy nhất** cho entitlement + trạng thái cài đặt; vòng đời cài/gỡ/bật/tắt/nâng cấp theo từng Tenant (gỡ plugin **giữ nguyên dữ liệu**); **cài mặc định cấp hệ thống** cho tenant mới; **đa phiên bản song song** giữa các tenant; khóa plugin khẩn cấp kèm **cưỡng chế gỡ + thông báo tenant**; Marketplace cho Tenant Admin; menu/route/quyền kích hoạt theo trạng thái plugin.
2. **CLI tạo dự án plugin mới (FEAT-22)**: CLI **Node.js phát hành npm/npx**; `create` (repo riêng + git submodule), `generate entity`, `generate menu`, `generate ui-contribution` (render mode WC/MF/iframe), `validate`, `package` (checksum SHA-256), `link`; **đề xuất bổ sung `dev`** (chạy plugin local + hot reload — chờ khách chốt); hỗ trợ PostgreSQL/MongoDB, sinh Dockerfile/K8s; khung sinh ra là **vertical slice mẫu** (màn hình quản trị + quyền + menu + i18n + test).
3. **Cơ chế phân phối & cài đặt plugin đa kênh (FEAT-23)**: Đưa plugin vào hệ thống qua Docker Hub, Image Registry (link + **credentials đa phạm vi platform/tenant**) hoặc tệp JAR backend + bản build Web (**tự build image**); kiểm tra manifest/checksum/tương thích/phụ thuộc; lưu trữ **MinIO**; **mỗi tenant một container và tự động deploy (K8s API + Docker API)**; Web plugin hiển thị **hai chế độ: màn hình riêng hoặc nhúng vào màn hình có sẵn của Core/plugin khác (UI Slot/UI Contribution)** với kỹ thuật **Web Components + Module Federation** (chốt 2026-09-19), **iframe sandbox** là chế độ dự phòng.

---

## 2. Phân Bổ Hạng Mục Công Việc (Scope Breakdown)

| Mã Hạng Mục | Tên Tính Năng | Mô Tả Tóm Tắt | Trọng Số | Người Phụ Trách |
| :--- | :--- | :--- | :---: | :--- |
| **FEAT-21** | Plugin Manager — Danh mục & Vòng đời Plugin | Catalog + phiên bản (SemVer, tương thích, phụ thuộc, nền tảng, quyền, entity, `default_install`, `visibility`); một bảng `tenant_plugins` (entitlement + lifecycle + version ghim + deploy); cài/gỡ/bật/tắt/nâng cấp; soft uninstall giữ dữ liệu; đa phiên bản; **plugin riêng của tenant (`TENANT_PRIVATE` + `allow_custom_plugins`)**; **cô lập dữ liệu plugin theo schema/database riêng từng tenant**; block + force uninstall + notify; Marketplace Web + Mobile read-only; audit | Critical | Dev Backend, Web & Mobile |
| **FEAT-22** | Plugin Scaffolding CLI (Node/npm) | CLI npm/npx: `create`, `generate entity`, `generate menu`, `generate ui-contribution`, `validate`, `package`, `link`, `inspect`; **`dev` (đã chốt — hot reload + kết nối Core dev)**; template vertical slice; repo riêng + submodule; Dockerfile/K8s; tài liệu dev guide | High | Dev Tooling (Node) & Backend |
| **FEAT-23** | Phân phối & Cài đặt Plugin đa kênh | 3 kênh artifact → container image (gồm **đăng ký plugin riêng của tenant — `TENANT_PRIVATE`**); **Deployer tự động container-per-tenant** (K8s + Docker); **Tenant Datasource Router (schema/database riêng tenant)**; **MinIO (lưu trữ chính toàn hệ thống)**; credentials đa phạm vi (mã hóa); **2 chế độ hiển thị Web — WC/MF cho nhúng trực tiếp (cả plugin riêng) + iframe sandbox dự phòng**; image build từ bundle; UI Drawer đăng ký | Critical | Dev Backend, DevOps & Web |

> **Quy ước sub-task**: `TASK-301..350` là sub-task inline trong từng file FEAT; `TASK-351+` là task phát sinh có file riêng. BUG tiếp nối từ `BUG-84`. Không nhảy cóc mã giữa các sprint (Sprint 01: 101–149; Sprint 02: 201–298).

---

## 3. Quyết Định Kiến Trúc Đã Chốt (Từ Phiên Review 2026-09-19)

1. **Một bảng duy nhất** `tenant_plugins` chứa entitlement + trạng thái cài đặt + phiên bản ghim + thông tin deploy; backfill từ `tenants.allowed_plugins`; API `/quotas` tương thích ngược.
2. **Core modules tách riêng** (`core`, `iam`, `organization`, `platform`) — không nằm trong cơ chế plugin.
3. **Container-per-tenant + tự động deploy** — 1 container / 1 plugin / 1 tenant; Deployer hỗ trợ K8s API (staging/prod) và Docker API (local dev).
4. **JAR upload → build image → deploy** — không nạp classloader vào Core, không cần restart Core.
5. **Plugin tự chạy migration** khi container khởi động; Core chỉ theo dõi health/status.
6. **Soft uninstall là chính sách gỡ duy nhất** — giữ nguyên dữ liệu; dữ liệu mồ côi không được làm hỏng Core (cấm FK từ Core → plugin, namespace dữ liệu riêng, Entity Registry inactive, vẫn tính quota).
7. **Block plugin** = cấm cài mới + cưỡng chế gỡ toàn bộ tenant + thông báo tenant bị ảnh hưởng; dữ liệu giữ nguyên.
8. **Cài mặc định cấp hệ thống** cho tenant mới + thao tác áp dụng hàng loạt có preview.
9. **Đa phiên bản song song** theo tenant; chọn phiên bản khi cài; nâng cấp tùy chọn; rollback về bản liền trước.
10. **MinIO** là kho artifact bắt buộc cho FEAT-23.
11. **Credentials đa phạm vi** (platform + tenant), mã hóa, nhiều credential.
12. **CLI Node/npm**; repo plugin độc lập liên kết qua **git submodule**; sinh **vertical slice mẫu**; hỗ trợ PostgreSQL/MongoDB; sinh Dockerfile/K8s; `package` kèm checksum SHA-256.
13. **Chữ ký số** để giai đoạn sau; Sprint 03 dùng checksum.
14. **Không có cơ chế dùng thử plugin (trial)**.
15. **Web plugin** hiển thị hai chế độ: màn hình riêng HOẶC nhúng vào màn hình có sẵn của **Core hoặc plugin khác** (UI Slot/UI Contribution) — kỹ thuật **Web Components + Module Federation** cho nhúng trực tiếp (quyết định khách hàng 2026-09-19); **iframe sandbox** là chế độ dự phòng.
16. **Plugin riêng của Tenant (làm rõ 2026-09-19)**: **Tenant Admin được đăng ký/cài custom plugin cho tenant mình** (`visibility = TENANT_PRIVATE`) khi `allow_custom_plugins` được bật; artifact vẫn qua xác minh đầy đủ; Super Admin giám sát + khóa khẩn cấp; tài nguyên tính quota tenant.
17. **Cô lập dữ liệu Tenant (làm rõ 2026-09-19)**: plugin data nằm ở **schema/database riêng từng tenant** (`DEDICATED_SCHEMA` mặc định, `DEDICATED_DATABASE` cho Enterprise); DB role least privilege; plugin tự migrate trong phạm vi tenant; cấm cross-schema — migration của tenant này không ảnh hưởng tenant khác. **Dữ liệu Core giữ `SHARED_SCHEMA_RLS` trong Sprint 03** (theo đề xuất BA); tách Core để giai đoạn sau nếu có yêu cầu.
18. **MinIO là công cụ lưu trữ CHÍNH của toàn hệ thống** (chốt Gate 2026-09-19) — không chỉ artifact plugin.
19. **Lệnh `dev` thuộc Sprint 03** (chốt Gate) — CLI plugin có vòng lặp phát triển local + hot reload + kết nối Core dev.
20. **Plugin riêng của tenant được phép nhúng trực tiếp WC/MF** (chốt Gate — khác đề xuất BA); iframe sandbox là chế độ dự phòng; bắt buộc biện pháp an toàn kỹ thuật chung.

---

## 4. Ràng Buộc Kỹ Thuật & Kiến Trúc (Guardrails)

1. **Kế thừa Sprint 02, không phá vỡ hợp đồng**:
   - `GET /api/v1/platform/plugins` và `PLATFORM_PLUGIN_NOT_ALLOWED` được mở rộng có kiểm soát; giữ 4 khuôn mẫu response.
   - `TenantPluginAllowlistService` nâng cấp đọc từ bảng mới (chỉ ACTIVE); catalog cấu hình Sprint 02 chuyển thành seed/đồng bộ.
2. **Cô lập dữ liệu Tenant**: mọi bảng plugin có `tenant_id`; **container-per-tenant chỉ truy cập dữ liệu tenant tương ứng**; test chống rò rỉ chéo bắt buộc.
3. **An toàn vòng đời**: ledger + khóa Redis chống thao tác đồng thời; soft uninstall; cấm phá hủy dữ liệu; migration idempotent do plugin thực thi.
4. **An toàn chuỗi cung ứng artifact**: chỉ `SUPER_ADMIN` đăng ký nguồn; allowlist registry + HTTPS (chống SSRF); checksum SHA-256 bắt buộc; credentials mã hóa đa phạm vi; artifact mới ở `DRAFT` đến khi Công bố; MinIO.
5. **Entity Registry bắt buộc**: entity chưa đăng ký → chặn công bố phiên bản.
6. **Chuẩn API/i18n**: 100% response có `code` UPPER_SNAKE_CASE; `ResponseKey` enum; không message tiếng Việt cứng trong payload.
7. **Quy chuẩn UI Industrial Sharp & Anti-Modal**: density cao, Drawer trượt xếp tầng, Split-Screen; 100% i18n; tái sử dụng/nâng cấp component trong `src/frontend/shared`.
8. **Chính sách kiểm thử thực dụng**: Backend JUnit 5 + RestAssured trên PostgreSQL/Redis thật (CẤM H2); Frontend không unit test, QA Dual-mode browser (Web ≥1280px + Mobile Emulation 390x844px, overflow = 0, touch target ≥ 40px, 0 console error).
9. **Local dev tối giản tài nguyên**: thao tác cơ bản chỉ cần PostgreSQL + Redis; **MinIO (`make infra-storage`) — công cụ lưu trữ chính toàn hệ thống (chốt Gate)** và Docker cho Deployer local; tài liệu `docs/07_deployment_guides/` và `docs/08_developer_guides/` phải cập nhật đồng bộ.
10. **Hạ tầng deploy**: Deployer dùng ServiceAccount/RBAC tối thiểu quyền; resource limits mỗi container; nhãn chuẩn để truy vết/dọn dẹp.
11. **Plugin riêng của Tenant**: `TENANT_PRIVATE` chỉ hiển thị cho tenant sở hữu; Super Admin bật `allow_custom_plugins` + duyệt registry host; giới hạn số lượng + resource limits; audit + quyền khóa khẩn cấp.
12. **Cô lập dữ liệu theo Tenant**: mọi dữ liệu plugin nằm trong schema/database riêng của tenant; DB role cấp cho container giới hạn quyền (least privilege); Tenant Datasource Router + connection pool theo tenant; backup/restore theo tenant.
13. **Nhúng UI trực tiếp (WC/MF)**: contribution khai báo `render_mode`; **WC/MF áp dụng cho cả plugin Official và plugin riêng của tenant** (chốt Gate); dùng Web Components (Shadow DOM) / Module Federation (shared-lib version pin + contract version); **iframe sandbox** là chế độ dự phòng; bắt buộc CSP, error boundary, RBAC, audit.

---

## 5. Quản Trị Rủi Ro & Giải Pháp Giảm Thiểu (Risk Management)

| Rủi Ro Nhận Diện | Mức Độ | Giải Pháp Giảm Thiểu |
| :--- | :---: | :--- |
| **Nạp mã lạ (container/JAR) gây mất an toàn hệ thống** | Critical | Chỉ Super Admin đăng ký; checksum bắt buộc; artifact mới ở DRAFT; allowlist registry; audit đầy đủ. |
| **Rò rỉ dữ liệu chéo qua container-per-tenant** | Critical | Container chỉ nhận ngữ cảnh + credentials tenant tương ứng; schema/namespace riêng; test cross-tenant 2+ tenant. |
| **Tự động deploy thất bại giữa chừng gây trạng thái nửa vời** | Critical | Deploy nguyên tử (tạo → health → activate); fail → undeploy + ledger INSTALL_FAILED; rollback khi nâng cấp; lock Redis. |
| **Dữ liệu plugin đã gỡ làm hỏng Core** | Critical | Cấm FK Core → plugin; namespace riêng; Entity Registry inactive; Core không phụ thuộc bảng plugin; không purge. |
| **Bùng nổ container theo tenant (chi phí/tài nguyên)** | High | Resource limits + quota; giới hạn cấu hình số phiên bản runtime; giám sát container theo tenant; dọn dẹp khi gỡ. |
| **Image build từ bundle cần hạ tầng build (Docker/Kaniko)** | High | Local: Docker daemon; K8s: Kaniko/BuildKit; chốt tại Bước 5; có phương án build ngoài (CI plugin) nếu hạ tầng thiếu. |
| **Xung đột đa phiên bản (contract API plugin ↔ Core)** | High | Version hóa contract; route/header phiên bản; test ma trận phiên bản tối thiểu 2 major. |
| **SSRF/credentials rò rỉ khi pull registry** | High | Allowlist host + HTTPS; mã hóa secret; không trả UI/log; audit mọi lần dùng. |
| **Template CLI lỗi thời so với Core** | Medium | Template versioning; validate + build smoke test; CI kiểm tra template khi Core đổi hợp đồng. |
| **MinIO/Docker trở thành phụ thuộc mới cho dev local** | Medium | Bật on-demand qua profile; tài liệu hóa rõ; test tự động có thể skip khi thiếu hạ tầng (đánh dấu). |
| **Plugin riêng của tenant gây hại/lạm dụng tài nguyên** | High | Cô lập container theo tenant; giới hạn số lượng + resource limits; allowlist registry do Super Admin duyệt; `allow_custom_plugins` bật theo tenant/gói; audit + quyền khóa khẩn cấp. |
| **Migration của custom plugin ảnh hưởng chéo tenant (dùng chung schema/DB)** | Critical | Schema/database riêng theo tenant + DB role least privilege + cấm cross-schema; test 2 tenant cài custom plugin có migration cùng lúc. |
| **Bùng nổ schema/DB & connection pool khi nhiều tenant** | High | Pool lazy/pool nhỏ theo tenant; giám sát số lượng schema/DB; provision tự động; dọn dẹp khi purge (giai đoạn sau). |
| **JS plugin chạy trong origin Core (WC/MF) gây rủi ro bảo mật** | Critical | WC/MF áp dụng cho mọi plugin gồm plugin riêng (chốt Gate) ⇒ bắt buộc `render_mode` per contribution; CSP + error boundary + Shadow DOM + shared-lib version pin; allowlist registry + checksum + audit + quyền khóa khẩn cấp; iframe sandbox là chế độ dự phòng khi cần cô lập tối đa. |
| **Xung đột shared library / phiên bản Angular giữa Core và MF remote** | High | Contract versioning; shared-lib chỉ expose đúng version đã cam kết; test ma trận Core ↔ plugin khi nâng cấp; cảnh báo sớm khi validate/đăng ký phiên bản. |

---

## 6. Tiêu Chuẩn Đóng Sprint (Definition of Done - DoD Gate)

Sprint 03 **CHỈ ĐƯỢC PHÉP ĐÓNG** khi thỏa mãn 100% các điều kiện sau:

- [ ] 100% item mức `Critical` và `High` đạt trạng thái `Done` (không còn task/bug > Medium chưa giải quyết).
- [ ] Backend Quarkus Java có Unit/Integration Test (JUnit 5 + RestAssured) bao phủ: vòng đời plugin, entitlement 1 bảng, deploy/undeploy, phân quyền, cô lập Tenant, xác minh artifact, đa phiên bản — chạy trên PostgreSQL/Redis thật (không H2).
- [ ] Nghiệm thu vòng đời đầy đủ: **Cài → Nâng cấp → Tắt/Bật → Gỡ (giữ dữ liệu) → Cài lại (dùng lại dữ liệu)** trên môi trường thật.
- [ ] **Deployer tự động** hoạt động tối thiểu trên Docker local (dev) và K8s (staging): tạo container theo tenant, health check, dọn dẹp khi gỡ.
- [ ] Nghiệm thu 3 kênh phân phối: Docker Hub, Image Registry link, File JAR + Web bundle (build image + checksum mismatch bị từ chối).
- [ ] **Đa phiên bản**: 2 tenant dùng 2 phiên bản khác nhau của cùng plugin chạy đồng thời.
- [ ] **Khóa plugin**: cưỡng chế gỡ toàn bộ tenant + thông báo đến tenant; dữ liệu giữ nguyên.
- [ ] **Plugin riêng của Tenant**: Tenant Admin đăng ký + cài custom plugin cho tenant mình; tenant khác không thấy/cài được; Super Admin giám sát + khóa được; artifact sai checksum bị từ chối.
- [ ] **Cô lập dữ liệu tenant**: 2 tenant cài custom plugin có migration đồng thời; tenant A không thấy/ảnh hưởng dữ liệu tenant B; DB role của plugin không thể ghi ngoài schema/database của tenant mình.
- [ ] CLI (Node/npm) sinh dự án plugin build PASS ngay; `generate entity`/`generate menu`/`generate ui-contribution` hoạt động; `package` sinh image/bundle + checksum; **`dev` chạy plugin local + hot reload + kết nối Core dev**.
- [ ] **Hai chế độ hiển thị Web**: plugin có màn hình riêng VÀ đóng góp tối thiểu 1 UI Contribution nhúng trực tiếp bằng **Web Components hoặc Module Federation** vào slot của Core (hoặc plugin khác) hoạt động đúng theo quyền — **bao gồm 1 plugin riêng của tenant**; iframe sandbox vẫn hoạt động như chế độ dự phòng; 0 console error.
- [ ] Frontend kiểm thử thủ công Dual-mode: Web Desktop ≥1280px + Mobile Emulation 390x844px; 0 console error; overflow 0; touch target ≥ 40px.
- [ ] Tài liệu: UG-03 kèm ảnh minh chứng; cập nhật `docs/08_developer_guides/create_new_plugin_guide.md` (CLI mới), `docs/07_deployment_guides/` (MinIO, Deployer, credentials); cập nhật Entity Registry docs.
- [ ] Biên bản nghiệm thu `09_review/sprint_review.md` được lập và khách hàng ký duyệt.

---

## 7. Điều Kiện Tiên Quyết Trước Khi Bắt Đầu (Prerequisites)

1. [x] Hoàn thành **Bước 3 (Benchmarks)** ngày 2026-09-19 — [BENCH-01](03_benchmarks/BENCH-01_plugin_manager_catalog_and_tenant_lifecycle.md) (Odoo, Frappe, WordPress, Salesforce, Atlassian), [BENCH-02](03_benchmarks/BENCH-02_plugin_distribution_cli_ui_and_isolation.md) (Helm/OCI, Docker Hub, Grafana, Shopify, Backstage, VS Code, Supabase/Neon, JupyterHub, CLI hệ thống & CLI phát triển plugin).
2. [x] Khách hàng phê duyệt **Confirmation Gate (Bước 4)** tại [CONF-01](04_confirmation/CONF-01_sprint_03_scope.md) ngày 2026-09-19 — **10/10 câu hỏi chốt cuối đã trả lời** (MinIO = lưu trữ chính toàn hệ thống; plugin riêng được nhúng WC/MF; lệnh `dev` vào Sprint 03).
3. Chốt phạm vi các hạng mục chuyển tiếp từ Sprint 02 (TASK-293, invite user, storage quota, Remote CLI) — có/không đưa vào Sprint 03.
