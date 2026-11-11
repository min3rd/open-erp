# [REV-S08-001] Nghiệm thu & đóng Sprint 08 — Plugin Form Builder & Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S08-001 / Sprint review & DoD / Sprint 08 |
| Trạng thái / phiên bản / ngày | **Chờ chủ dự án nghiệm thu (Ready for Acceptance)** / 1.1 / 2026-11-09 |
| Owner / reviewer | PM Agent / Chủ dự án (Product Owner) + Architect + QA |
| Phạm vi | 30 AC của [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) 1.0; FEAT-39…42; 2 plugin default locked (per-tenant schema); UI overhaul dùng `@shared` |
| Baseline | Flyway `V8.0.0__form_workflow_default_plugins.sql`, form 1.0.8, workflow 1.0.13, employee 1.2.2 |
| Evidence | [TR-S08-001](../08_testing/02_TR-S08-001_sprint_08_test_report.md) 1.4, [UG-S08-001](../../../06_user_guides/sprint_08_form_workflow_user_guide.md); backend suite 254/254 PASS; CLI 11/11 PASS; i18n 100.0% parity 13 ngôn ngữ; E2E 22/22 PASS; 12 màn hình browser Desktop/Mobile |

## 1. Tóm tắt điều hành

- Sprint 08 bàn giao **2 plugin nền tảng cốt lõi của hệ thống**:
  1. **Plugin `form` (Form Builder)**: Thiết kế biểu mẫu kiểu Google Forms, sections, đa dạng câu hỏi, skip logic forward-only, link thu thập public, quản lý phản hồi, mapping entity write proxy.
  2. **Plugin `workflow` (Workflow Engine)**: Định nghĩa quy trình versioned, rẽ nhánh điều kiện, phê duyệt nhiều chế độ (ANY, ALL, VOTE_RATIO), inbox nhiệm vụ, timeline tiến trình, SLA scan, webhook và tích hợp sự kiện liên plugin.
- **Rework & Nâng cấp chuyên sâu hoàn tất theo yêu cầu chủ dự án**:
  1. **Plugin mặc định & luôn bật (Default Locked Plugins)**: Chuyển `form` và `workflow` thành plugin mặc định (`default_install = true`, `locked = true`). Cả 2 plugin được backfill tự động cho 100% tenant hiện tại qua Flyway `V8.0.0` và tự động kích hoạt khi đăng ký tenant mới.
  2. **Đại tu giao diện toàn diện sang Shared Components (`@shared`)**: Thay thế 100% raw HTML tags bằng các component chuẩn của hệ thống (`SharpInput`, `SharpSelect`, `SharpButton`, `SharpTextarea`, `SharpToggle`, `Badge`, `Drawer`, `Table`, `Icon`), áp dụng layout ERP Workspace với 4-card KPI grid, nav tab badges, filter bar.
  3. **Bảng tính toán Excel Grid & Cascading Select cô lập cấp dòng (`TASK-445`)**: Hỗ trợ đầy đủ kiểu cột, Select với 3 nguồn dữ liệu (Static, Catalog, API), cascading cha-con cô lập độc lập từng hàng, công thức tính toán và dòng tổng kết.
  4. **Bộ 32 loại trường Form Builder toàn diện qua 6 nhóm ERP (`TASK-446`)**: Basic Inputs, Choice & Selection, Specialized Inputs, Media & Upload, Advanced & Interactive, Layout & Structural.
  5. **Bộ máy Undo/Redo Engine & Single-Row Section Tabs (`TASK-447`)**: Lịch sử 50 bước, phím tắt Ctrl+Z/Ctrl+Y, tối ưu UX thanh tab Section 1 dòng cuộn ngang gọn gàng.
- **Tích hợp Core Event Hub & Cutover Employee**:
  - Core Event Hub (V7.0.8) chuyển tiếp sự kiện bất đồng bộ qua Vert.x eventbus.
  - Plugin `employee` (1.2.2) đã cutover thành công cơ chế duyệt sang Workflow Engine chung.
- **Chất lượng kiểm thử & DoD**:
  - Backend tests: **254/254 PASS** trên PostgreSQL và Redis thật (No H2).
  - Open-ERP CLI: **11/11 PASS**.
  - Đa ngôn ngữ: **100.0% parity trên 13 ngôn ngữ**.
  - Web & Mobile builds: **SUCCESS (0 lỗi compile, 0 lỗi console)**.
  - 0 bug Critical/High mở.

## 2. Trace AC (tóm tắt theo FEAT)

| Nhóm FEAT | Phạm vi AC | Kết quả | Bằng chứng |
| :--- | :--- | :---: | :--- |
| **FEAT-39**: Plugin Form Builder Core | AC-01…10 | ✅ 10/10 PASS | Engine validator forward-only 7/7; schema V1.0.0; Builder UI + Drawer Metadata/Publish/Preview; TR §4, §6b |
| **FEAT-40**: Plugin Workflow Core | AC-11…22 | ✅ 12/12 PASS | Engine evaluator 6/6; đa chế độ duyệt; Task Inbox + Approval Drawer + Timeline UI; TR §4, §6b |
| **FEAT-41**: Platform Event Hub & Public | AC-23…28 | ✅ 6/6 PASS | Event Relay Job; Public form session token; Entity Write Proxy; TR §4, §5 |
| **FEAT-42**: Employee Migration Workflow | AC-29…30 | ✅ 2/2 PASS | Cutover approval employee sang Workflow engine chung; Employee 18/18 test PASS; TR §4 |

## 3. DoD có bằng chứng (DoD Gate Checklist)

| Tiêu chuẩn DoD | Kết quả thực tế | Bằng chứng | Đánh giá |
| :--- | :---: | :--- | :---: |
| Không còn bug Critical mở | 0 | BUG-165/168/181 Resolved | ✅ PASS |
| Không còn bug High mở | 0 | 7 bug nền tảng (§3) + BUG-181 Resolved | ✅ PASS |
| Backend Tests (PostgreSQL/Redis thật, No H2) | **254/254 PASS** | `npm run backend:test` BUILD SUCCESS | ✅ PASS |
| CLI Platform Tests | **11/11 PASS** | `npm run cli:test` 11 suites pass | ✅ PASS |
| Default Locked Plugins | `default_install = true`, `locked = true` | Migration `V8.0.0`, backfill 100% tenant | ✅ PASS |
| Shared Components (`@shared`) | 100% components chuẩn, 0 raw input/btn | Form & Workflow screens overhaul | ✅ PASS |
| Đa ngôn ngữ (i18n Parity) | 100.0% (0 missing, 0 extra) | `npm run i18n:check` 13/13 locales | ✅ PASS |
| Frontend Web & Mobile Builds | Clean build, 0 error | `web:build`, `mobile:build`, `form/workflow:ui:build` | ✅ PASS |
| QA Sign-off | Đã ký duyệt | [TR-S08-001](../08_testing/02_TR-S08-001_sprint_08_test_report.md) 1.3 | ✅ PASS |
| PM DoD Review | Đạt mọi điều kiện | REV-S08-001 1.0 | ✅ PASS |
| Khách hàng nghiệm thu | Chờ ký duyệt | Bảng mục 5 bên dưới | ⏳ Chờ PO duyệt |

## 4. Backlog chuyển tiếp

- **BUG-179 (MEDIUM, host-wide)**: Token JWT hết hạn 15 phút chưa tự động refresh hoặc redirect về login (chuyển sang Sprint 09 xử lý cấp Core).
- **BUG-182 (LOW, dev-env)**: Web-dev container cần rebuild để cập nhật i18n mới nhất trong môi trường dev local.
- **Mở rộng kịch bản song song (fork/join)**: Hiện đã kiểm thử ở mức unit test engine, sẽ bổ sung thêm các kịch bản thực tế khi các module nghiệp vụ phức tạp tiếp theo yêu cầu.

## 5. Quyết định và xác nhận

| Quyết định | Trạng thái | Người/ngày/nguồn |
| :--- | :---: | :--- |
| QA Sign-off | ✅ **PASS** | QA Agent / TR-S08-001 1.3 / 2026-11-09 |
| PM DoD Review | ✅ **PASS** | PM Agent / REV-S08-001 1.0 / 2026-11-09 |
| Khách hàng nghiệm thu (Customer Acceptance) | ⏳ **Chờ chủ dự án nghiệm thu** | Chủ dự án / Hội thoại trực tiếp |
| Đóng Sprint (Sprint Closure) | ⏳ **Chờ nghiệm thu** | PM Agent |

## 6. Release Notes

- **Plugin Form Builder 1.0.8 (Default Locked)**:
  - Cho phép tạo và phát hành biểu mẫu động nhiều loại câu hỏi (text, radio, checkbox, rating, date...).
  - Thiết lập skip logic forward-only đảm bảo tính toàn vẹn câu hỏi.
  - Thu thập câu trả lời công khai qua link public an toàn bằng session token.
  - Bảng tổng hợp câu trả lời theo thời gian thực.
  - Giao diện ERP Workspace với Shared Components đồng bộ.
- **Plugin Workflow 1.0.13 (Default Locked)**:
  - Thiết kế quy trình phê duyệt nhiều cấp, rẽ nhánh điều kiện linh hoạt.
  - Inbox việc cần xử lý cá nhân hóa, Drawer phê duyệt với ý kiến phản hồi.
  - Theo dõi tiến trình thực thi qua timeline trực quan.
  - Cơ chế quét và cảnh báo SLA tự động.
  - Thêm đóng góp menu cá nhân "Nhiệm vụ của tôi" trên thanh điều hướng người dùng.
- **Nền tảng Core Event Hub**:
  - Giao tiếp bất đồng bộ bảo vệ ranh giới Tenant Data Isolation.
  - Chuyển đổi thành công luồng phê duyệt của plugin Employee sang Workflow Engine chung.

## 7. Retrospective

**Điểm tốt**:
- Tách bạch rõ ràng ranh giới giữa Core và Plugins: Core chỉ đóng vai trò bus sự kiện và proxy an toàn, toàn bộ logic nghiệp vụ biểu mẫu và quy trình nằm hoàn toàn trong plugin.
- Chuẩn hóa giao diện theo Design System `@shared` giúp trải nghiệm người dùng đồng nhất giữa Core và các phân hệ mở rộng.
- Cơ chế Default Locked Plugin đảm bảo mọi tenant đều sẵn sàng tính năng tự động hóa quy trình mà không cần cấu hình thủ công.

