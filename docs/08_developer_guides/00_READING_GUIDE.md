| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | DEV-READ-001 |
| Trạng thái | Reviewed |
| Phiên bản | 1.0 |
| Cập nhật | 2026-10-05 |
| Owner | Codex — Developer documentation |
| Reviewer | Codex kiểm tra tích hợp; Singer review độc lập theo phạm vi TASK-349; không phải phê duyệt của khách hàng |
| Phạm vi | Lộ trình đọc xuyên Sprint cho dev mới; không xác nhận QA hoặc đóng Sprint |
| Đầu vào | [Docs index](../README.md), [chuẩn tài liệu](../../.agents/rules/documentation_standards.md), source/config/scripts được dẫn trong [DEV-OVERVIEW-001 v1.0](01_project_walkthrough.md) |
| Đọc trước | [Docs index](../README.md) — chọn lộ trình theo vai trò |
| Đọc tiếp | [DEV-OVERVIEW-001 v1.0](01_project_walkthrough.md) — hiểu repo và request thật |

# Bắt đầu đọc dự án dành cho lập trình viên

Đây là điểm bắt đầu trong bộ hướng dẫn phát triển. Đọc lộ trình dev mới trước, sau đó mới tra lịch sử Sprint hoặc tài liệu chuyên sâu theo công việc. Tên các guide legacy được giữ nguyên để các liên kết hiện có tiếp tục dùng được.

`Reviewed` là trạng thái của tài liệu này; không phải xác nhận ứng dụng đã vượt qua QA hoặc Sprint đã được nghiệm thu. Nội dung mô tả checkout tại ngày cập nhật bằng cách đọc tài liệu, source và cấu hình; không chạy build, test hay hạ tầng trong lần biên soạn này.

## 1. Lộ trình dev mới: đọc theo thứ tự này

| Thứ tự | Tài liệu | Đọc để hiểu / kết quả cần đạt |
| :--- | :--- | :--- |
| 1 | [Bản đồ tài liệu dự án](../README.md) | Biết tài liệu toàn cục, Sprint-Pack và ba nhóm user/deployment/developer guides nằm ở đâu. |
| 2 | [Project walkthrough](01_project_walkthrough.md) | Hiểu Core, plugin, tenant; tìm được source; lần theo một request thật; biết cách build/run/test và nhận item. |
| 3 | [Quy tắc dự án](../../AGENTS.md), [Master Index SDLC](../../.agents/rules/sdlc_process.md), [Core SDLC](../../.agents/rules/core_sdlc.md) | Hiểu cổng xác nhận, thứ tự 00–09 và điều kiện đóng Sprint. |
| 4 | [System Blueprint](../system/architecture/SYSTEM_BLUEPRINT.md), [Entity Registry](../system/entity_registry/README.md) | Nắm kiến trúc mục tiêu, ranh giới Core/plugin và yêu cầu đăng ký entity. Đối chiếu phần hiện trạng trong walkthrough trước khi coi sơ đồ là implementation. |
| 5 | [Quy tắc Developer](../../.agents/rules/agent_developer.md), [API/i18n](../../.agents/rules/api_standards.md), [UI/UX](../../.agents/rules/ui_ux_standards.md), [Coding standards](coding_standards.md), [Chuẩn tài liệu](../../.agents/rules/documentation_standards.md) | Nắm chuẩn bắt buộc cho Java/Angular, DTO, tenant, i18n, shared UI, kiểm thử và tài liệu. Đọc cách đối chiếu nguồn ở mục 2. |
| 6 | [Local setup](../07_deployment_guides/local_setup_guide.md), [Scripts root](../../package.json), [Node runner](../../scripts/run.mjs) | Chuẩn bị môi trường và hiểu tác dụng thật của từng lệnh; không cần bật toàn bộ dịch vụ để đọc dự án. |
| 7 | [Hướng dẫn dùng Core IAM](../06_user_guides/sprint_01_core_iam_user_guide.md), [Hướng dẫn Super Admin/RBAC](../06_user_guides/sprint_02_superadmin_rbac_user_guide.md) | Nhận diện màn hình và hành vi người dùng bằng ảnh trước khi sửa source. |
| 8 | `00_READING_GUIDE.md` của Sprint chứa item được giao, chọn từ mục 4 | Theo các link 01 → 04 → 05 → 06 → 07; kiểm tra phạm vi đã xác nhận và thiết kế rồi mới implement. |
| 9 | [Quy trình nhận item và bàn giao](01_project_walkthrough.md#6-nhận-item-implement-và-bàn-giao-tài-liệu), [Quy tắc QA](../../.agents/rules/agent_qa.md), [Playbook SDLC](../../.agents/skills/sdlc-workflow/SKILL.md) | Biết điều gì cần ghi trong item, bằng chứng kiểm thử nào phải có và ai duyệt hoàn tất. |

Sau lộ trình này, dev nên tự chỉ ra được màn hình cần sửa, endpoint liên quan, service/model/migration, tenant context và item đang quản lý thay đổi.

## 2. Phân biệt quy tắc, thiết kế và implementation

- **Quy tắc** trong `AGENTS.md` và `.agents/rules/` mô tả điều bắt buộc khi làm việc. **Thiết kế** trong Blueprint/Sprint `06_designs/` mô tả phương án đã chọn. **Source/config/scripts** cho biết checkout đang thực thi gì. **Báo cáo QA** chỉ chứng minh phạm vi và thời điểm được ghi trong báo cáo.
- [coding_standards.md](coding_standards.md) dùng package `com.vn9melody.openerp`, cấu trúc module thật và `jakarta.transaction.Transactional`; truy vấn phải thể hiện tenant context. Backend hiện cấu hình datasource primary; read-replica cần thiết kế và triển khai routing riêng, không tự phát sinh từ annotation giao dịch.
- [shared_ui_contribution_guide.md](shared_ui_contribution_guide.md) dẫn exports `shared/index.ts`, mappings `@shared`/`@shared/*` và ví dụ `.ts`/`.html` tách riêng dùng component, i18n, design enums thực. Dùng các mẫu này để đóng góp tại `src/frontend/shared/` rồi mới tích hợp Web/Mobile.
- [create_new_plugin_guide.md](create_new_plugin_guide.md) có lệnh npm/npx cho CLI. CLI trong checkout có `private: true`; dùng runner local theo walkthrough, không suy ra gói đã được phát hành công khai lên npm.

Nếu source khác thiết kế hoặc guide, ghi khác biệt vào item và thống nhất cập nhật thiết kế trước khi đổi contract/schema; không xem khác biệt là ngoại lệ được tự động chấp thuận.

## 3. Chọn nhánh tài liệu theo việc được giao

| Công việc | Đọc tiếp theo thứ tự |
| :--- | :--- |
| Backend Core / RBAC / tổ chức | [Developer rules](../../.agents/rules/agent_developer.md) → thiết kế DB/API trong Sprint của item → [Core IAM Registry](../system/entity_registry/CORE_IAM_REGISTRY.md) / [Superadmin RBAC Registry](../system/entity_registry/SUPERADMIN_RBAC_REGISTRY.md) → source và test được dẫn trong walkthrough. |
| Shared UI / Web / Mobile | [UI/UX rules](../../.agents/rules/ui_ux_standards.md) → [Shared UI guide](shared_ui_contribution_guide.md) → [shared/index.ts](../../src/frontend/shared/index.ts) → UI spec của Sprint → [QA dual-mode](../../.agents/rules/agent_qa.md). |
| Plugin mới / Plugin Manager | [Plugin development guide](create_new_plugin_guide.md) → [CLI README local](../../tools/open-erp-cli/README.md) → [Sprint 03 reading guide](../sprints/sprint_03_plugin_manager/00_READING_GUIDE.md) → [Web packaging](plugin_web_packaging_guide.md) → [Plugin infrastructure](../07_deployment_guides/plugin_manager_infrastructure_guide.md). |
| Build / triển khai | [Local setup](../07_deployment_guides/local_setup_guide.md) → [Docker deployment](../07_deployment_guides/docker_deployment_guide.md) → [K8s production](../07_deployment_guides/k8s_production_guide.md) → [deployments](../../deployments/). Lệnh build không đồng nghĩa với triển khai hay nghiệm thu. |

## 4. Tra lịch sử ba Sprint sau khi hiểu dự án

Trạng thái dưới đây là trạng thái **được tài liệu hiện có ghi nhận**, không phải kết quả kiểm thử mới của lần biên soạn này. Đọc cả index, item và report; bảng tổng quan có thể chậm hơn các cập nhật chi tiết.

| Sprint | Phạm vi / trạng thái quản lý | Đọc tuần tự | Nguồn kiểm tra QA và nghiệm thu |
| :--- | :--- | :--- | :--- |
| 01 — Core IAM | Đăng ký, xác thực, tài khoản, tenant onboarding; biên bản ghi đã đóng 2026-09-18. | [Index 01](../sprints/sprint_01_core_iam/00_READING_GUIDE.md) | [QA report](../sprints/sprint_01_core_iam/08_testing/test_reports/test_report_sprint_01.md), [re-test](../sprints/sprint_01_core_iam/09_review/QA_RETEST_SPRINT_01.md), [sprint review](../sprints/sprint_01_core_iam/09_review/sprint_review.md). |
| 02 — Super Admin / RBAC | Quản trị nền tảng, tổ chức, quyền chức năng và data scopes; biên bản ghi đã đóng 2026-09-19, có TASK-293 Medium Deferred. | [Index 02](../sprints/sprint_02_superadmin_rbac/00_READING_GUIDE.md) | [QA report](../sprints/sprint_02_superadmin_rbac/08_testing/test_report.md), [sprint review](../sprints/sprint_02_superadmin_rbac/09_review/sprint_review.md). |
| 03 — Plugin Manager | Đã qua confirmation; có implementation và QA, chưa có quyết định closure được ký; vẫn chưa đóng/chờ ký duyệt. | [Index 03](../sprints/sprint_03_plugin_manager/00_READING_GUIDE.md) | [QA report](../sprints/sprint_03_plugin_manager/08_testing/QA-01_sprint_03_test_report.md), [REV-02 review tài liệu](../sprints/sprint_03_plugin_manager/09_review/REV-02_document_rereview_2026-09-20.md), [REV-03 bằng chứng seed PostgreSQL](../sprints/sprint_03_plugin_manager/09_review/REV-03_postgresql_seed_evidence.md), [items](../sprints/sprint_03_plugin_manager/07_items/). |

Sprint 03: QA report có kết quả PASS cho regression/browser đã chạy, nhưng còn review, sub-task cần hạ tầng và sign-off. Các mốc test trong report/index khác nhau không phải một lần chạy duy nhất. `In Review`, `Resolved` hoặc build PASS không tự thay thế `Done` đã được QA/reviewer xác nhận. Xem diễn giải và giới hạn bằng chứng trong [walkthrough](01_project_walkthrough.md#7-trạng-thái-sprint-và-giới-hạn-bằng-chứng-qa).

## 5. Checklist trước khi nhận việc đầu tiên

- [ ] Đọc walkthrough; tìm được request, model, migration và test thật.
- [ ] Biết item thuộc Sprint nào, ai phụ trách, severity và trạng thái hiện tại.
- [ ] Có confirmation phù hợp và thiết kế DB/API/UI đủ cho phạm vi sửa.
- [ ] Phân biệt chuẩn bắt buộc với ví dụ legacy và chức năng mới chỉ nằm trong thiết kế.
- [ ] Biết backend test dùng PostgreSQL `openerp_test` và Redis `/1`; frontend kiểm thử browser hai chế độ.
- [ ] Biết nơi cập nhật item, QA evidence, user guide có ảnh và deployment/developer guide khi thay đổi cần tài liệu.

Quay lại [docs/README.md](../README.md) để tìm nhóm tài liệu khác; dùng [task board](../project_management/task_board.md) để tra tiến độ tổng quan, rồi đối chiếu file item trước khi bắt tay vào sửa.
