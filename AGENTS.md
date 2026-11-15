# Project Guidelines & Agent Instructions

Dự án áp dụng mô hình **Multi-Agent hướng tài liệu (Docs-driven SDLC 9 bước)**. Mọi Agent bắt buộc tuân thủ:
- Master Index: [.agents/rules/sdlc_process.md](.agents/rules/sdlc_process.md) | Tài liệu dự án: [docs/README.md](docs/README.md) | Skill: [.agents/skills/sdlc-workflow/SKILL.md](.agents/skills/sdlc-workflow/SKILL.md)
- Bộ quy tắc chuyên biệt: [core_sdlc](.agents/rules/core_sdlc.md) · [agent_collaboration](.agents/rules/agent_collaboration.md) · [documentation_standards](.agents/rules/documentation_standards.md) · [agent_ba](.agents/rules/agent_ba.md) · [agent_architect](.agents/rules/agent_architect.md) · [agent_developer](.agents/rules/agent_developer.md) · [agent_qa](.agents/rules/agent_qa.md) · [agent_pm](.agents/rules/agent_pm.md) · [ui_ux_standards](.agents/rules/ui_ux_standards.md) · [api_standards](.agents/rules/api_standards.md)

## Điều Phối & Tài Liệu Cho Người Đọc
- Điều phối viên cấp ID & cập nhật index; mỗi file chỉ 1 writer tại một thời điểm; giao việc ghi rõ input/version, owner, write scope, dependency, output, kiểm chứng.
- Mỗi item có file riêng trong `07_items/` (`FEAT/TASK/BUG/REFACTOR-<n>`); `FEAT` dẫn link task con; task inline lịch sử không tự tính là Done.
- Tách thứ tự đọc, ID và version: tài liệu sprint mới dùng `<NN>_<TYPE>-S<XX>-<NNN>_<slug>.md`; giữ tên/ID lịch sử và dùng alias tại reading guide.
- Chỉnh docs theo yêu cầu làm ngay, không tự tạo approval sản phẩm; sửa scope đã duyệt dùng gate cũ, đổi scope/AC phải xác nhận phần đổi. Resolved/build PASS không thay QA Done; gate phải ghi nguồn/baseline/người quyết định.
- Dev mới bắt đầu từ [Developer Reading Guide](docs/08_developer_guides/00_READING_GUIDE.md) rồi đọc index sprint mục tiêu.

## Quy Trình 9 Bước & Sprint-Pack (`docs/sprints/sprint_XX_<tên>/`)
Toàn bộ bước 00–09 đóng gói trong thư mục Sprint (cấm xé lẻ ra ngoài), bắt buộc có `00_READING_GUIDE.md` và bảng Confirmation Checklist:
`00_READING_GUIDE.md` → `01_raw_notes/` (BA) → `02_analysis/` (BA) → `03_benchmarks/` (BA) → `04_confirmation/` (BA & Khách hàng Gate) → `05_solutions/` (Architect) → `06_designs/` (Architect: DB/API/UI) → `07_items/` & `src/` (Developer) → `08_testing/` (QA/QC) → `09_review/` (PM DoD Gate).
- **File-based Tracking**: Mọi task, bug, feature, refactor phải tách file riêng trong `07_items/`.
- **Sprint DoD Gate**: Chỉ đóng Sprint khi **0 item** có mức độ `Critical` hoặc `High` còn tồn đọng.

## Ràng Buộc Kiến Trúc & Kỹ Thuật Nền Tảng
- **Định danh & Domain**: Package Backend `com.vn9melody.openerp`; Domain `openerp.9ms.io.vn`.
- **Multi-tenant SaaS**: Cô lập dữ liệu `tenant_id` triệt để; mọi query, mutation, cache, message lấy tenant context đã xác thực (không tin tenant ID client gửi). Auth/onboarding và quản trị platform có scope/phân quyền/audit riêng, không bỏ lọc tenant.
- **Tech Stack**:
  - Backend: **Quarkus** (Java, `com.vn9melody.openerp`).
  - Frontend Web: **Angular >= 22** + **Tailwind CSS v4**; Mobile: **Ionic 8 + Angular** (tối giản chức năng).
  - CSDL & Infra: **PostgreSQL** (Shared DB RLS hoặc Database-per-Tenant, Master-Slave/Read-Replicas), **MongoDB** (Replica-Set), **Redis** (cache/session/lock), **Apache Kafka**.
- **Shared UI (`src/frontend/shared/`, `@shared/*`)**: Shared components, enums, models dùng chung cho Web (`src/frontend/web`) & Mobile (`src/frontend/mobile`). Component mới thêm vào shared trước; hạn chế tối đa thư viện thứ 3.
- **Ranh giới Core vs. Plugins**: Core chỉ giữ Auth, Tài khoản, Phân quyền chức năng/dữ liệu và Quản lý Plugin. Nghiệp vụ khác phải tách Plugin độc lập, khai báo rõ tính năng Desktop vs. Mobile và đăng ký mọi entity vào Entity Registry.
- **Local Dev Tối Giản**: Mặc định chạy PostgreSQL Primary + Redis qua `docker-compose.yml` (`npm run infra`); dịch vụ nặng (`kafka`, `mongo`, `storage`, `mail`, `full`) bật qua Docker Compose Profiles và giới hạn RAM (`resources.limits.memory`). Scripts tập trung tại `package.json` (`scripts/run.mjs`) & `Makefile` (`infra`, `backend`, `web`, `mobile`, `dev`).
- **Kiểm Thử Thực Dụng & Cấm H2**:
  - Backend viết JUnit 5 + RestAssured chạy trực tiếp trên **PostgreSQL và Redis thật** với dữ liệu seeded/migrated (cấm H2/in-memory mock DB cho luồng chính).
  - Frontend **TUYỆT ĐỐI KHÔNG viết `.spec.ts`**; QA thực hiện **Dual-Mode Browser Testing**: Web Desktop (`>= 1280px`) & Mobile Ionic Device Emulation (`390x844 px`, `overflow = 0`, touch target `>= 40px`, safe-area padding), **0 `console.error`**, lưu screenshot nghiệm thu.
- **Quy Chuẩn UI/UX ERP**:
  - **High Density & Sharp**: Font `text-xs` (12px) / `text-sm` (13px), spacing `p-1`, `p-2`, `gap-1`, `space-y-1.5`. Theme mặc định dùng `rounded-none`/`rounded-sm`, viền `border-neutral-200 dark:border-neutral-800`; theme khác dùng `ShapeVariant` nhưng cấm bo tròn lớn (`rounded-xl`, `rounded-full`).
  - **Anti-Modal & Route-Driven State**: Cấm lạm dụng Modal; thay bằng Nested Routes, Drawer (hỗ trợ stacked drawers) và Split-Screen. Mọi tab, phân trang, filter/search, drawer (`?drawer=...`), stepper, master-detail phải đồng bộ 2 chiều lên URL (Query Params / Child Routes), cấm giữ thuần `signal()` cục bộ.
  - **Màn Hình Dữ Liệu & Table Tối Ưu (`Data View & Sticky Scroll Table Invariant`)**: Mọi màn hình dữ liệu phải hỗ trợ **bộ lọc, sắp xếp, tùy chỉnh số lượng cột (ẩn/hiện), số lượng hàng/trang và thứ tự hiển thị cột** (đồng bộ filter/sort/page lên URL). Table dùng chung (`@shared/*`, không cài thư viện ngoài) bắt buộc **cố định Header & Footer, chỉ cuộn phần content dữ liệu bên trong**; hỗ trợ đổi thứ tự cột, lọc, sắp xếp và **bắt buộc tích hợp Context Menu chuột phải** đầy đủ chức năng (tuân thủ i18n 100%, Zero-Emoji, có fallback Mobile `>= 40px`).
  - **Tối Ưu Diện Tích & Tooltip**: Cấm banner/subtitle mô tả dài dòng; dùng Icon ngữ nghĩa (`info`, `help-circle`, `settings`, `filter`...) kèm Tooltip (`title`/directive).
- **Component, i18n & Tokens**:
  - 100% component Angular tách file `.html` riêng (cấm inline template).
  - **Zero-Emoji**: Cấm chèn emoji (`⚠️`, `✓`, `✕`, `🔒`, `📍`, `⏱️`, `➕`...) trong nhãn, nút, tiêu đề, badge; icon phải là SVG/icon component độc lập.
  - **100% i18n**: Mọi nhãn, placeholder, tooltip, `aria-label`, trạng thái enum và chuỗi nội suy động (`params`) phải qua `TranslateDirective`/`TranslatePipe` từ `vi.json`/`en.json`.
  - Dùng chung Design Token Enums `@shared/enums`: `ColorVariant`, `SizeVariant`, `ShapeVariant`. Cụm UI dùng >= 2 nơi (`LanguageSwitcher`, `TopBar`, `NavBar`...) đóng gói tại `src/frontend/shared/components/`.
- **Backend & API Contract**:
  - Config-driven URL qua `@ConfigProperty(name = "openerp.frontend.url", defaultValue = "https://openerp.9ms.io.vn")` (cấm hardcode URL frontend).
  - Enum Java đồng bộ 1-1 Enum TypeScript. Dùng `ResponseKey` cho mọi key map (cấm string literal). Service trả về DTO `record`/class định kiểu mạnh (cấm `Map<String, Object>`).
  - Mọi API trả `code` `UPPER_SNAKE_CASE` và đúng 4 khuôn mẫu tại [.agents/rules/api_standards.md](.agents/rules/api_standards.md): (1) Single `{ success: true, code, message, params, data }`; (2) Paginated `{ items, page, size, total_items, total_pages }`; (3) List `{ items }`; (4) Error `{ success: false, code, message, params, errors: [{ field, code, params }], timestamp }` (cấm hardcode tiếng Việt vào `errors`).
- **Git, Deploy & Bộ Ba Tài Liệu**:
  - Root, `src/backend`, `src/frontend/web`, `src/frontend/mobile` có `.gitignore` riêng (`target/`, `dist/`, `.angular/`, `node_modules/`, `.env`, `*.pem`).
  - Multi-stage Dockerfile + Kubernetes Base/Overlays trong `deployments/k8s/`.
  - Đủ 3 bộ docs: `docs/06_user_guides/` (kèm screenshots/flows), `docs/07_deployment_guides/`, `docs/08_developer_guides/`.

> **NGHIÊM CẤM**:
> 1. Nhảy cóc sang lập trình khi chưa có xác nhận `CONF` và thiết kế `DES` trong `docs/`.
> 2. Đóng Sprint/release khi còn task/bug mức `Critical` hoặc `High`.
> 3. Đưa nghiệp vụ chuyên biệt vào Core hoặc truy vấn dữ liệu Tenant thiếu `tenant_id` đã xác thực.
> 4. Cài/nâng cấp/gỡ Plugin phá vỡ CSDL hoặc mất dữ liệu Tenant không qua Migration/Backup.
> 5. Viết UI component ad-hoc ngoài `@shared/*` hoặc tự cài thư viện UI bên thứ 3.
> 6. Khai báo Entity Plugin mà không đăng ký Entity Registry.
> 7. Bàn giao/đóng Sprint thiếu User Guide (kèm ảnh) hoặc Deployment Guide.
> 8. Tự bật toàn bộ dịch vụ nặng (Kafka, MongoDB, Read-Replica, MinIO) khi chỉ phát triển cơ bản.
> 9. Viết unit test Frontend (`.spec.ts`) hoặc tự thêm thư viện test frontend.
> 10. Lạm dụng Modal popup thay cho Drawer trượt, Split-View hoặc Nested Router.
> 11. Trả API response thiếu `code` `UPPER_SNAKE_CASE` chuẩn hóa cho i18n Frontend.
> 12. Lưu docs Sprint ngoài `docs/sprints/sprint_XX/` hoặc thiếu `00_READING_GUIDE.md`.
> 13. Dùng H2 / in-memory mock DB thay vì PostgreSQL & Redis thật khi test backend.
> 14. Viết inline HTML trong `.ts` hoặc hardcode text tĩnh không qua i18n.
> 15. Dùng chuỗi tự do thay vì Enum chuẩn cho style, option, status, role.
> 16. Đặt UI dùng chung vào riêng thư mục Web hoặc Mobile.
> 17. Hardcode URL frontend trong Backend thay vì `@ConfigProperty`.
> 18. Tạo enum variant phân mảnh cho từng component thay vì `ColorVariant`/`SizeVariant`/`ShapeVariant`.
> 19. Copy-paste markup lặp lại (`TopBar`, `LanguageSwitcher`...) thay vì đóng gói component dùng chung.
> 20. Hardcode string literals cho key payload thay vì `ResponseKey`.
> 21. Service backend trả `Map<String, Object>` tự do thay vì Response DTO định kiểu mạnh.
> 22. Trả API sai 4 khuôn mẫu chuẩn trong [.agents/rules/api_standards.md](.agents/rules/api_standards.md) (`content`/`total_elements` thay `items`/`total_items`, nhét tiếng Việt vào `errors`).
> 23. Dùng native `fetch()` trong Angular thay `HttpClient`/`ApiService` của `@shared`.
> 24. Frontend/Backend Plugin gọi thẳng REST API Plugin khác (phải qua `PluginDataServiceGrpc`, Kafka hoặc Core Internal Proxy).
> 25. Fix cứng `size = 100` hoặc chỉ đọc trang 1 khi nạp dữ liệu liên plugin (phải dùng `pageThrough` duyệt hết).
> 26. Gán `bg-surface`/`bg-*` hoặc `border-t` vào `<div drawer-footer>` gây 2 lớp nền/viền lồng nhau.
> 27. Tự ý chạy `git commit` khi chưa có chỉ thị rõ ràng từ người dùng.
> 28. Chèn emoji Unicode (`⚠️`, `✓`, `✕`, `🔒`, `📍`, `⏱️`, `➕`...) vào nhãn, nút, tiêu đề hoặc template.
> 29. Hardcode giá trị hiển thị (enum status, badge, tooltip, aria-label, chuỗi nội suy động) không qua i18n.
> 30. Đặt subtitle/banner mô tả dài, RACI matrix hoặc nhãn phụ chiếm màn hình thay vì Tooltip + cột dữ liệu ngắn.
> 31. Lưu tab, filter, phân trang, drawer, stepper thuần trong state nội bộ khiến mất trạng thái khi F5 hoặc Back/Forward.
> 32. Chỉ viết Unit Test với dữ liệu giả lập (mocked repos, in-memory stubs) thay vì test trên PostgreSQL và Redis thật có dữ liệu seeded/migrated.
> 33. Xây dựng màn hình dữ liệu hoặc bảng (table) thiếu bộ lọc/sắp xếp, không cho người dùng tùy chỉnh số cột/số hàng/thứ tự cột, để table cuộn trôi mất Header/Footer thay vì chỉ scroll vùng nội dung bên trong, hoặc thiếu Context Menu chuột phải đầy đủ chức năng.
