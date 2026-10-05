# [REV-S03-004] Review và chuẩn hóa SDLC workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / phạm vi | REV-S03-004 / Process & Documentation Review / Workflow toàn dự án, theo dõi tại Sprint 03 |
| Trạng thái / phiên bản / cập nhật | Reviewed / 1.1 / 2026-10-05 |
| Owner / reviewer | Codex điều phối / Anscombe: review rules cũ; Singer: review rules mới/tình huống; Codex: kiểm tra tích hợp tài liệu |
| Input | User yêu cầu chuẩn hóa phối hợp AI, đánh số và docs cho dev; rules/skill/templates và Sprint-Pack hiện có |
| Đọc trước / đọc tiếp | [TASK-349](../07_items/TASK-349_standardize_sdlc_and_developer_documentation.md) / [Developer Reading Guide](../../../08_developer_guides/00_READING_GUIDE.md) |
| Baseline | Working tree ngày 2026-10-04, kiểm tra tiếp 2026-10-05; diff tài liệu của TASK-349. Có code/config/FEAT-23 được phiên khác cập nhật đồng thời, ngoài phạm vi review này |

## 1. Kết luận và giới hạn

Workflow 9 bước có nền tảng đúng nhưng thiếu hợp đồng phối hợp, namespace và nguồn trạng thái đủ rõ để nhiều agent làm đồng thời. Phiên này chuẩn hóa quy tắc, templates và lộ trình đọc; giữ guardrails kỹ thuật cùng IDs/paths/sign-off lịch sử. Review này không xác nhận sản phẩm đạt QA, không đóng Sprint 03 và không ký thay khách hàng.

## 2. Findings và xử lý

| # | Mức độ quy trình | Finding và nguồn | Xử lý trong TASK-349 |
| :--- | :--- | :--- | :--- |
| 1 | Medium | Core yêu cầu file mỗi item nhưng reading guides Sprint 02/03 cho TASK inline | Mỗi việc quản lý có file; FEAT link task con; inline lịch sử phải tách nếu tiếp tục phân công |
| 2 | Medium | Chỉ phân vai trò, thiếu ownership/write scope/dependency/baseline/nhận handoff | Thêm agent_collaboration; một writer/file; một điều phối index/IDs; handoff có Accepted/Returned |
| 3 | Medium | RAW/ANL/SOL/QA IDs lặp giữa sprint; dải TASK 2xx có số kết thúc khác nhau | Tách thứ tự/ID/version; namespace TYPE-SXX-NNN; giữ item IDs toàn dự án, reserve trước giao; aliases legacy có sprint |
| 4 | Medium | Resolved/In Review/Done lẫn nhau; summaries không đồng nhất gate | Bộ trạng thái item chuẩn; fixed chưa QA không tự Done; gate riêng và nguồn chính; index phân biệt lịch sử |
| 5 | Medium | Review template điền sẵn 0 item/PASS; task template yêu cầu Unit Test cho mọi việc | Draft/Pending/Not Run; check theo Backend/Frontend/Docs; không frontend unit test hoặc H2 |
| 6 | Medium | Approval/chat và QA không bắt buộc version/baseline/nguồn | Metadata và gate record có người/ngày/nguồn/version; test có môi trường/lệnh/actual-expected/evidence |
| 7 | Medium | Skill dài lặp policies và có ví dụ transaction/read-replica gây hiểu sai | Skill gọn dẫn rules chính; technical examples lấy guides/source; không giả định annotation tự route replica |
| 8 | Medium | Dev thiếu điểm bắt đầu; guides cũ có package/shared/inline template khác guardrails | Thêm developer reading guide/walkthrough, sửa coding/shared contribution examples theo checkout |
| 9 | Low | Index chủ yếu theo bước/thư mục, thiếu thứ tự file và alias xuyên sprint | Bổ sung bảng đọc file 01.01–09.xx tại cả 3 sprint; docs README dẫn theo người đọc |
| 10 | Medium | Câu tenant_id tuyệt đối mâu thuẫn auth/onboarding toàn cục trong source | [TASK-351](../07_items/TASK-351_clarify_tenant_scope_in_documentation.md): đồng bộ phạm vi tenant/auth/platform và tests, Singer xác nhận resolved docs |
| 11 | Medium | Hướng dẫn path-state áp dụng mọi app nhưng helper hiện chỉ có Web | [TASK-352](../07_items/TASK-352_clarify_mobile_list_route_rollout.md): Web hiện trạng, Mobile rollout theo thiết kế/item, Singer xác nhận resolved docs |

Các finding thuộc một công việc chuẩn hóa tài liệu đã được user yêu cầu, gom theo dõi tại TASK-349; không phải lỗi sản phẩm hoặc thay đổi scope feature.

## 3. Tài liệu bàn giao

- [Core SDLC](../../../../.agents/rules/core_sdlc.md), [phối hợp agent](../../../../.agents/rules/agent_collaboration.md), [chuẩn tài liệu](../../../../.agents/rules/documentation_standards.md), [skill](../../../../.agents/skills/sdlc-workflow/SKILL.md) và role rules.
- [Reading guide template](../../../system/templates/READING_GUIDE_TEMPLATE.md), [document](../../../system/templates/DOCUMENT_TEMPLATE.md), [handoff](../../../system/templates/HANDOFF_TEMPLATE.md), [traceability](../../../system/templates/TRACEABILITY_TEMPLATE.md), templates item/plan/review/plugin.
- [Developer Reading Guide](../../../08_developer_guides/00_READING_GUIDE.md), [walkthrough](../../../08_developer_guides/01_project_walkthrough.md), [coding](../../../08_developer_guides/coding_standards.md), [shared UI](../../../08_developer_guides/shared_ui_contribution_guide.md), docs README và index Sprint 01–03.

## 4. Kiểm chứng

| Kiểm tra | Kết quả | Phạm vi/giới hạn |
| :--- | :--- | :--- |
| Review độc lập rules cũ | Hoàn tất, 7 finding chính | Anscombe, chỉ đọc docs; findings tổng hợp ở mục 2 |
| Forward-test 4 tình huống với rules mới | Pass ở mức document review | Singer không thấy blocker Critical/High; hai Medium đã sửa/re-review Accepted |
| Node check-docs | Pass; số liệu tại evidence bên dưới | Local links/anchors, IDs metadata chuẩn trong phạm vi và file item toàn repo; không kiểm chứng approval/QA hoặc inline IDs |
| Skill quick_validate.py | Pass: Skill is valid! | Python -X utf8, frontmatter/naming của skill |
| git diff --check trong write scope | Pass | Không lỗi whitespace trong tracked diff của tài liệu/quy trình được sửa |
| Negative checks của checker | Pass | Anchor tiếng Việt hợp lệ exit 0; anchor/link thiếu và metadata ID trùng exit 1, đủ 3 lỗi; temp fixtures đã dọn |
| Backend/build/browser | N/A | Không sửa sản phẩm trong TASK-349; không tái chạy QA sản phẩm |

Chạy validator: `node .agents/skills/sdlc-workflow/scripts/check-docs.mjs`. Có thể truyền file/thư mục khác để kiểm link phạm vi đó. Metadata/baseline và nhận định nghiệp vụ vẫn cần reviewer; script không thay review.

Bằng chứng lần kiểm cuối: [TASK-349_document_validation_2026-10-05.txt](../08_testing/evidence/TASK-349_document_validation_2026-10-05.txt). Đã sửa ba link relative cũ trong work_log khi mở rộng phạm vi kiểm tra; không sửa nội dung lịch sử của log.

| Tình huống review độc lập | Hành vi theo rules mới |
| :--- | :--- |
| Hai agent API/shared UI | Điều phối cấp ID/write scope không chồng; Architect chốt contract; handoff baseline, QA bản tích hợp |
| Bug Sprint 01 đã đóng trong scope cũ | Item sprint hiện hành link CONF/DES cũ; không mở lại toàn bộ gate hoặc Sprint 01 |
| Resolved + build Pass, thiếu Mobile QA | Mobile Not Run/Blocked, chưa Done/QA sign-off; cần browser evidence đúng baseline |
| Docs-only review | Document/source review, backend/browser N/A có lý do; không yêu cầu product approval/infra |

## 5. Hồ sơ lịch sử cần đối soát khi nhận việc

Tên cũ được giữ; không có migration tên hàng loạt. Những TASK inline còn mở cần file trước giao tiếp; trạng thái Resolved chỉ chuẩn hóa từng item sau đối chiếu QA. Sprint 02 còn chữ ký khách hàng trống trong review dù summaries ghi đóng. Sprint 03 có các artifact đang được cập nhật song song; đối chiếu file item/QA/closure nguồn thay vì lấy số item/test tổng hợp làm chứng cứ. Các mục này là giới hạn hồ sơ, không được tự sửa thành nghiệm thu Pass trong review workflow.

Theo dõi riêng tại [TASK-353](../07_items/TASK-353_reconcile_legacy_sprint_records.md) Medium/To Do; chuẩn hóa workflow TASK-349 đã hoàn tất, việc đối soát/QA/sign-off sản phẩm vẫn theo owners và bằng chứng riêng.
