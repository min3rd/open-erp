# [BENCH-S08-002] Đối chuẩn: Workflow engine cho plugin xử lý công việc theo luồng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S08-002 / Đối chuẩn / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md); nghiên cứu web tài liệu chính thức của 10 nhóm sản phẩm (danh sách nguồn tại từng mục và §4) |
| Đọc trước / đọc tiếp | [BENCH-S07-001](../../sprint_07_plugin_employee/03_benchmarks/01_BENCH-S07-001_employee_profile_and_self_service.md) (mẫu đối chuẩn) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 04 CONF (chưa soạn) |

## 1. Mục đích và phương pháp

Sprint 08 cần quyết định cách xây **plugin workflow engine** cho Open-ERP (ERP multi-tenant SaaS, backend Quarkus Java, frontend Angular 22 + Ionic 8, kiến trúc plugin độc lập): mô hình định nghĩa luồng, node nào là đủ, gán người xử lý ra sao, SLA/nhắc việc/escalation, trigger từ entity của plugin khác qua Entity Registry/event system, task inbox, audit log, và **dùng BPMN engine Java (Flowable/Camunda) hay tự viết state machine**.

Tài liệu đối chuẩn 10 nhóm sản phẩm qua tài liệu chính thức (web_search + web_fetch, phiên bản mới nhất tại thời điểm soạn). Quy ước nhãn nguồn:

- **Đã kiểm chứng**: đọc trực tiếp trang docs chính thức trong phiên soạn tài liệu này.
- **Đã kiểm chứng một phần**: có nguồn chính thức nhưng chỉ xác nhận một phần hành vi (ví dụ chỉ trang marketing/snippet tìm kiếm).
- **Suy luận**: suy đoán từ kinh nghiệm/tài liệu thứ cấp, cần kiểm chứng thêm khi triển khai.

Giới hạn: đối chuẩn định tính từ tài liệu công khai, không cài thử sản phẩm, không đo hiệu năng; tính năng thương mại có thể đổi theo phiên bản/gói.

## 2. Đối chuẩn theo sản phẩm

### 2.1. Odoo 17/18 — Activities + Approval requests + server actions/automation rules

- **Mô hình định nghĩa**: Odoo **không có một workflow engine duy nhất** mà là 3 lớp cộng hưởng: (1) **state field + view/button** trên từng model (mỗi module tự viết luồng của mình); (2) **Automation rules** (base_automation) — rule "trigger → action" cấu hình qua Studio; (3) **Server actions** (`ir.actions.server`) — hành động tái sử dụng (chạy code Python, tạo/sửa record, gửi email/webhook…). Approval là model riêng `approval.request` (app Approvals), mỗi request thuộc 1 "approval type". Lưu dạng record DB, không phải file JSON/XML.
- **Loại node/bước**: không có node đồ thị. "Bước" = state trên record + **mail.activity** (việc phải làm: type, tiêu đề, mô tả, ngày hẹn) + approval step. Automation rule có thể chạy nhiều action nối tiếp theo thứ tự.
- **Gán người xử lý**: Approvals app: mỗi request chọn approver cụ thể (cá nhân); docs PLM cho gán approver theo **Role/position** tại từng stage. Automation rule "Create Activity" có **Specific User** hoặc **Dynamic User (based on record)** — lấy user từ field của record (mô hình "manager-of" phổ biến). (Đã kiểm chứng / một phần)
- **Định kỳ/timeout/escalation**: activity có **ngày hẹn (deadline)**, hiện ở systray theo mức độ trễ (hôm nay/quá hạn); Automation rule có trigger **Timing Conditions** (based on date field + delay âm/dương, after creation, after last update) để tự nhắc/tự xử lý khi quá hạn; scheduler chạy ~4 giờ/lần nên độ mịn thời gian thấp. Không có escalation chain có sẵn — tự dựng bằng rule + activity.
- **Trigger**: **Values Updated** (đổi field/tag/user), **Email Events**, **Timing Conditions**, **Custom** (on save, on deletion, on UI change), **External** (**On webhook** — URL + secret có rotate, payload vào context, Log Calls để audit); chạy tay qua menu Action. (Đã kiểm chứng)
- **Theo dõi instance**: chatter (`mail.thread`) là audit trail: mọi message/note + **field tracking** (mọi thay đổi field được log kèm giá trị cũ/mới); activities hiển thị trên form; automation rule có Logs (payload webhook). Không có biểu đồ luồng đã đi.
- **Tích hợp**: Send Webhook Notification (POST), Execute Code, Create Record (bất kỳ model), email/SMS templates, XML-RPC/JSON-RPC API, webhooks vào.
- **Mạnh/Yếu**: ✓ pattern "mixin" rất đáng học — mọi model thêm workflow chỉ bằng kế thừa `mail.thread` + `mail.activity.mixin`; tracking field tự động thành audit; automation rule là cầu nối plugin→plugin rẻ nhất. ✗ approval chain nhiều cấp phải tự code (cộng đồng viết `to_approvals`: approval type có sequence, minimum count, deadline — chứng tỏ nhu cầu); không có task inbox tập trung ngoài activity systray; không vẽ được luồng.
- **Nguồn**: [Actions](https://www.odoo.com/documentation/17.0/developer/reference/backend/actions.html), [Automation rules](https://www.odoo.com/documentation/17.0/applications/studio/automated_actions.html), [Mixins (mail.thread, mail.activity)](https://www.odoo.com/documentation/17.0/developer/reference/backend/mixins.html) — *Đã kiểm chứng*; [Approvals app](https://www.odoo.com/app/approvals), [to_approvals (Viindoo)](https://viindoo.com/apps/modules/17.0/to_approvals) — *Đã kiểm chứng một phần*.

### 2.2. Frappe/ERPNext Workflow — document workflow (mô hình gần nhất với ERP)

- **Mô hình định nghĩa**: **state machine gắn trên DocType** (document). Workflow = danh sách **States** (mỗi state có Doc Status 0=Saved/1=Submitted/2=Cancelled, chọn Update Field + Update Value) + danh sách **Transition Rules**. Workflow ghi đè lên Save/Submit mặc định của document. Lưu dạng record DB (Workflow, Workflow State, Workflow Action Master).
- **Loại node/bước**: state (Draft/Pending Approval L1/…/Approved/Rejected — state có thể **optional**) + transition (action Approve/Reject/Cancel/Submit). Version 16 thêm **Workflow Transition Tasks**: mỗi transition có thể chạy **app-defined actions** (đăng ký qua hook `workflow_methods`), **Server Scripts** (script type "Workflow Task"), hoặc **Webhooks**; task chạy **synchronous** (fail → rollback transition) hoặc **asynchronous** (chạy nền sau khi transition xong).
- **Gán người xử lý**: qua **Allowed Role trên từng transition** — role của user quyết định được bấm action nào; kết hợp **conditions** trên transition (vd `doc.grand_total > 100000` phải qua Regional Manager) để chọn tuyến duyệt. Email alert gửi cho user có role của bước kế tiếp. Phân bổ người cụ thể hơn dùng **Assignment Rule** riêng (tài liệu tham chiếu).
- **Định kỳ/timeout/escalation**: **không có** SLA/reminder/escalation có sẵn trong workflow core (chỉ email alert khi đến lượt). Cần tự thêm bằng scheduled script/assignment notification. (Đã kiểm chứng một phần)
- **Trigger**: workflow "trigger" bởi chính vòng đời document (Save/Submit/nút action); nhiệm vụ/kịch bản khác trigger qua hooks, webhook có Doc Event `workflow_transition`; các DocType khác gắn qua webhooks/server scripts.
- **Theo dõi instance**: trạng thái workflow hiện **ngay trên document** (field Workflow State, có màu), nút action hiển thị theo role + condition; lịch sử là bản log của document (version history, comment/email log); "Workflow Actions" liệt kê việc đang chờ theo user. Không có task inbox riêng cho workflow — nút bấm trên document + notifications.
- **Tích hợp**: webhook theo sự kiện document/transition, server script gọi API, REST API chuẩn của Frappe.
- **Mạnh/Yếu**: ✓ mô hình cực kỳ phù hợp ERP: **luồng duyệt nhiều cấp trên đúng tài liệu nghiệp vụ**, role + điều kiện dữ liệu chọn tuyến, doc status gắn với nghĩa kế toán (draft/submitted/cancelled), cấu hình thuần khai báo. ✗ không có SLA/timer, không có parallel branch/split-join (tuần tự), assignment theo role chứ không "claim" từng người, khó vẽ lại luồng đã đi.
- **Nguồn**: [Workflows](https://docs.frappe.io/erpnext/user/manual/en/workflows), [Easy steps to setup Workflow](https://docs.frappe.io/erpnext/easy-steps-to-setup-workflow), [Workflow Transition Tasks](https://docs.frappe.io/erpnext/workflow-transition-tasks) — *Đã kiểm chứng*; [Assignment Rule](https://docs.frappe.io/erpnext/assignment-rule) — *Đã kiểm chứng một phần*.

### 2.3. Camunda 8 (Zeebe) — BPMN engine phân tán

- **Mô hình định nghĩa**: **BPMN 2.0 XML** deploy lên cluster Zeebe; process definition có version; chạy instance bằng API. Kiến trúc: **Clients** (gửi lệnh: deploy, start instance, publish message, activate/complete job) → **Gateway** (stateless) → **Brokers** (engine phân tán, partition + replicate, **không chứa business logic**) → **Exporters** (stream sự kiện ra Elasticsearch… để history/audit/báo cáo).
- **Loại node/bước**: **User task** (người, có form), **Service task** (job worker — code ngoài engine), **Gateway** XOR/AND/inclusive/event-based (rẽ nhánh/fork-join), **Timer event** (start/intermediate/boundary), message/signal/error event, sub-process, call activity.
- **Gán người xử lý**: trên user task khai báo `assignee` (claim tự động), `candidateUsers`, `candidateGroups` — **đều được phép là biểu thức FEEL** (`= book.author`, `= reviewer_roles`) đánh giá lúc task kích hoạt → dynamic assignment; binding form theo `latest`/`deployment`/`versionTag`; **user task listeners** cho lifecycle (assigning/completing/…) để can thiệp.
- **Định kỳ/timeout/escalation**: user task có **dueDate** và **followUpDate** (biểu thức, vd `= now() + duration("PT15S")`), **priority 0–100**; timer boundary **interrupting** (hủy việc, rẽ nhánh timeout) và **non-interrupting** (nhắc việc, cycle `R3/PT1H` cho reminder); escalation = mô hình hóa bằng boundary + service task. Lưu ý: timer **không đảm bảo nổ đúng giờ** (chỉ không bao giờ sớm hơn).
- **Trigger**: start instance qua API/REST/gRPC; **timer start event** (định kỳ), **message start event** (publish message correlat theo business key), signal; job worker nhận việc từ engine (poll job, complete/fail + retries → **incident**).
- **Theo dõi instance**: **Tasklist** cho người dùng (assigned to me, claim, form); **Operate** + exporter (Elasticsearch) xem instance đang chạy/đã xong, incidents, vẽ lại trạng thái BPMN đã đi; history phục vụ audit/BI qua exporter stream.
- **Tích hợp**: REST API + gRPC + Java/Go clients chính thức; webhook connector, message correlation; event stream (exporter) đưa ra ngoài.
- **Mạnh/Yếu**: ✓ engine "event-sourcing" thật sự, scale ngang, tách bạch engine–worker, BPMN tiêu chuẩn, dành cho process phức tạp dài hạn. ✗ quá nặng cho ERP: cần cluster + Elasticsearch, người dùng phải học BPMN, SLA cơ bản phải tự mô hình hóa bằng timer, chi phí vận hành cao.
- **Nguồn**: [Zeebe Architecture](https://docs.camunda.io/docs/8.7/components/zeebe/technical-concepts/architecture/), [User tasks](https://docs.camunda.io/docs/components/modeler/bpmn/user-tasks/), [Timer events](https://docs.camunda.io/docs/components/modeler/bpmn/timer-events/) — *Đã kiểm chứng*; Operate/Tasklist chi tiết — *Đã kiểm chứng một phần*.

### 2.4. Temporal — durable execution, workflow-as-code

- **Mô hình định nghĩa**: **workflow là code** (Go/Java/TS/Python): Workflow Definition = hàm; Workflow Type = tên; Workflow Execution = instance chạy (có thể chạy nhiều năm). Engine ghi **Event History** (mọi command/event: started timer, scheduled activity, signal…) và **replay** lại code từ đầu để tái tạo trạng thái khi crash — code phải deterministic (time/random/network gọi qua API replay-safe của Temporal; mọi side-effect phải nằm trong **Activity**).
- **Loại node/bước**: không có node đồ thị — code gọi: **Activity** (side-effect, có retry policy), **Timer**, **Signal/Query** (giao tiếp hai chiều), child workflow, side-effect. Saga/compensation viết bằng code (design pattern chính thức).
- **Gán người xử lý**: **không có khái niệm user task/assignee** — human-in-the-loop phải tự dựng (signal khi người dùng thao tác, hoặc cắm engine khác phía trước). Đây là điểm khác biệt cốt lõi với ERP workflow.
- **Định kỳ/timeout/escalation**: timer chắc chắn bền vững qua restart; activity có timeout + **retry policy**; cron/schedule có sẵn. Nhưng reminder/escalation cho người cũng phải tự code.
- **Trigger**: client SDK/API gọi start workflow; schedule/cron; signal từ hệ khác.
- **Theo dõi instance**: Web UI hiển thị event history từng execution (audit tuyệt đối); có thể truy vấn theo Workflow ID.
- **Tích hợp**: SDK đa ngôn ngữ (có **Java client**), signal/query API, không có webhook native.
- **Mạnh/Yếu**: ✓ đúng bài toán "durable execution" cho service/transaction phân tán, retry tự động, Java SDK. ✗ **không phải công cụ cho approval/task inbox**: thiếu user task, assignment, form, deadline của con người; barrier vào cao (phải viết code deterministic);运维 thêm cluster. Dùng khi nào: orchestration backend (vd chốt đơn đa bước, tích hợp đối tác); không dùng làm luồng duyệt ERP.
- **Nguồn**: [Temporal Workflows](https://docs.temporal.io/workflows) — *Đã kiểm chứng*; [Saga pattern](https://docs.temporal.io/design-patterns/saga-pattern) — *Đã kiểm chứng một phần*.

### 2.5. n8n — workflow automation (nodes + triggers)

- **Mô hình định nghĩa**: workflow = **đồ thị các node** (JSON export/import được); mỗi node có parameters + credentials; cạnh nối đường chạy dữ liệu (mỗi item đi qua từng node). Có node **Execute Sub-workflow** (workflow gọi workflow).
- **Loại node/bước**: 400+ app nodes; core nodes: **Manual Trigger, Schedule Trigger, Webhook, Error Trigger**, If/Switch/Filter/Merge/Loop Over Items/Wait, Code, HTTP Request, Set/Edit Fields, **Execution Data**…
- **Gán người xử lý**: **không có** khái niệm approver/assignee (không phải BPM). Human-in-the-loop thường làm bằng webhook chờ phản hồi hoặc node Form/Chat.
- **Định kỳ/timeout/escalation**: Schedule Trigger (cron), node **Wait**, Error Trigger (workflow bắt lỗi → cảnh báo), retry thủ công từ execution log.
- **Trigger**: **Webhook** là trung tâm — test URL vs production URL, method GET/POST/…, path có biến, auth (Basic/Header/JWT/**OAuth2 user của n8n**), respond ngay/khi xong/tuỳ chỉnh, **Only Run If** expression, IP allowlist, max payload 16MB; Schedule; email IMAP; RSS; app-specific triggers.
- **Theo dõi instance**: **Executions tab** per workflow + global; mỗi execution lưu **đầy đủ dữ liệu in/out từng node**, xem lại từng bước, debug (copy data vào editor), **retry** execution (với data cũ hoặc workflow đã sửa) — mô hình execution log rất tốt để tham khảo.
- **Tích hợp**: HTTP Request đến mọi API, webhook ra/vào, credentials management, error workflow.
- **Mạnh/Yếu**: ✓ trực quan, execution log từng node + retry là chuẩn mực; trigger đa dạng; JSON mở. ✗ không có state/instance lâu dài (mỗi lần chạy là một execution, không "đang chờ ai duyệt"), không role/permission nghiệp vụ, không SLA.
- **Nguồn**: [Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) — *Đã kiểm chứng*; [Built-in core nodes](https://docs.n8n.io/integrations/builtin/core-nodes) (danh sách đọc từ docs), Executions/Debug — *Đã kiểm chứng một phần*.

### 2.6. Zapier / Make (Integromat) — trigger-action SaaS

- **Zapier**: Zap = **1 trigger + N actions** (multi-step). Bước hỗ trợ: Search step, **Filter** (chặn Zap nếu điều kiện sai), Formatter, **Delay**, **Paths** (rẽ nhánh theo điều kiện, mỗi path một bộ rules), Webhooks, Code. Trigger từ 9000+ app. **Zap History** lưu toàn bộ dữ liệu vào/ra từng step, cho replay/rerun. Billing theo task. (*Đã kiểm chứng*: [Quick start](https://help.zapier.com/hc/en-us/articles/22234847450893-Zap-workflows-quick-start-guide), [Paths](https://help.zapier.com/hc/en-us/articles/8496288555917-Add-branching-logic-to-Zap-workflows-with-Paths))
- **Make**: Scenario = chuỗi **module**; **Router** tách nhiều route, mỗi route có **Filter** (toán tử so sánh), route chạy **tuần tự** không song song, có **fallback route**; bindings/transform dữ liệu giữa module; lịch sử chạy scenario chi tiết từng module. (*Đã kiểm chứng*: [Router](https://help.make.com/router), [Filter](https://help.make.com/step-4-add-a-filter))
- **Điểm rút ra cho ERP**: model "trigger → filter → hành động" là lớp **automation** (không phải duyệt việc); giá trị nằm ở: điều kiện kiểu khai báo (VÀ/HOẶC), đường dữ liệu in/out rõ ràng từng bước, replay từ log, sub-workflow. Không dùng làm approval.
- **Mạnh/Yếu**: ✓ dễ dùng, tích hợp SaaS phong phú, log đầy đủ. ✗ không có task inbox/approver/role; mọi nhánh phải "phẳng" (dễ explode); chạy tuần tự, xử lý song song/gateway thật không có (Make) hoặc rất sơ sài (Zapier paths).

### 2.7. NocoBase workflow plugin — gần nhất với kiến trúc plugin ERP của Open-ERP

- **Mô hình định nghĩa**: workflow = **1 trigger + các node** dựng bằng UI kéo thả, lưu JSON; có **Version Management** (sửa luồng không ảnh hưởng instance đang chạy) và **Execution History** riêng cho từng workflow; **plugin hoá**: trigger type và node type đều là **plugin mở rộng** qua API phát triển riêng.
- **Trigger** (mỗi loại là một plugin): **Collection Event** (CRUD trên collection — tương đương Entity Registry của Open-ERP), **Pre-action Event**, **Post-action Event**, **Custom Action Event** (sự kiện tuỳ biến do plugin định nghĩa), **Schedule**, **Webhook**, **Approval** (trigger chuyên cho quy trình duyệt). (Đã kiểm chứng)
- **Loại node**: Flow control (Condition, Multi-condition Branch, Loop, Parallel Branch, Subflow, Delay, End, Variables, JSON Variable Mapping), Calculation (Calculation, Date, JSON query), Data operations (Create/Update/Query/Delete/SQL/Transaction), Manual processing (**Manual**, **Approval**, **CC**), Extended (HTTP Request, JavaScript, Notification, Send Email, Response…).
- **Gán người xử lý**: node **Manual** — assignee là **1 user** (chọn tĩnh hoặc **lấy từ biến/bằng khóa chính-ngoại của user trong context**); node **Approval** (bản Professional) — approver là **tập user**: chọn tĩnh, biến (mảng user sẽ merge), hoặc **động theo query user collection**; **Agreement mode**: Anyone (1 người duyệt là qua) / **Countersign** (đủ mới qua) / **Vote** (tỉ lệ); **Processing order**: Parallel hoặc Sequential; hành động phụ: **Return** (chọn bước được trả về), **Reassign** (chuyển người), **Add signer** (thêm duyệt trước/sau), kèm **Assignment Scope** giới hạn người được chỉ định lại.
- **Định kỳ/timeout/escalation**: node **Delay** (chờ), Schedule trigger; **không thấy SLA/reminder/escalation cấu hình sẵn trên node duyệt** (nhắc qua Notification/Send Email node). (Suy luận từ cấu trúc docs)
- **Theo dõi instance**: **Execution History** lưu từng execution + trạng thái node; **To-do block / To-do Center** là task inbox ("Workflow To-do" block, "My Approvals" card tùy biến được); node result lưu **approval records** mảng (userId, status, comment, updatedAt) dùng làm biến cho node sau; snapshot dữ liệu duyệt được lưu và cập nhật khi approver sửa.
- **Tích hợp**: HTTP Request node, Webhook trigger, Response node (trả kết quả về caller), event của collection (plugin khác nghe), extension API cho plugin thêm trigger/node.
- **Mạnh/Yếu**: ✓ **kiến trúc tham chiếu tốt nhất cho Open-ERP**: trigger là plugin, node là plugin, definition/instance tách bạch + version, to-do inbox, approval node có countersign/vote/return/reassign/add signer, biến context chảy qua node. ✗ SLA/escalation còn mỏng; không vẽ lại luồng đã đi trên diagram; manual node v1 chỉ 1 assignee.
- **Nguồn**: [Workflow Overview](https://docs.nocobase.com/workflow/), [Manual node](https://docs.nocobase.com/workflow/nodes/manual), [Approval node](https://docs.nocobase.com/workflow/nodes/approval), [Approval trigger](https://nocode.docs.nocobase.com/workflow/triggers/approval) — *Đã kiểm chứng*.

### 2.8. Appsmith / Budibase — low-code platform

- **Appsmith Workflows**: workflow là **code-first** (viết JS) + node-based; dùng cho business-critical processes và human-in-the-loop (**HITL mới "Coming Soon"**); trigger: **Webhook**, sự kiện từ Appsmith app (datasource), **Cron**; hàm `appsmith.workflows.response()` trả HTTP về caller. Chạy trên self-host cần bản trả phí. (*Đã kiểm chứng một phần*: [Overview](https://docs.appsmith.com/workflows), [Triggers](https://docs.appsmith.com/workflows/reference/workflow-triggers))
- **Budibase Automations**: automation = **Trigger + các step** (Row Created/Updated, Webhook, Cron…), bước **Condition** (bindings `{{ trigger.row.X }}`), Query Rows, Notification (Discord/Slack/email), webhook ra; **bindings** handlebars truy dữ liệu của trigger và của từng step (`steps.2.rows.0`); automation dừng khi condition fail. Không có approval/assignee; log chạy automation trong app. (*Đã kiểm chứng một phần*: [Bindings in automations](https://docs.budibase.com/docs/data-in-automations))
- **Bài học**: low-code platform đều đặt automation **bám vào entity của chính platform** (row/table event) — đúng hướng Entity Registry; nhưng lớp "con người xử lý" là mảnh khảnh nhất của cả hai (Appsmith còn đang xây HITL), chứng tỏ **task inbox + approval là khoảng trống khó, cần thiết kế bài bản từ đầu**.

### 2.9. Flowable / Activiti — BPMN 2.0 engine Java nhúng được (quan trọng cho backend Quarkus)

- **Mô hình định nghĩa**: **BPMN 2.0 XML** (chuẩn OMG) + extension namespace `flowable:`; deploy thành **ProcessDefinition có version** (bản mới deploy → instance mới dùng bản mới, instance cũ chạy tiếp bản cũ; message/timer subscription của bản cũ được gỡ); engine **nhúng được vào ứng dụng Java** (Flowable là "embeddable process engine" — engine không tự nhận message, app phải nhận rồi correlate qua API), có Spring Boot starter; API services: Repository/Runtime/Task/History/IdentityService.
- **Loại node/bước**: đầy đủ BPMN: **User Task**, Script Task, Service Task (Java class/delegateExpression), Receive Task; **Gateway**: Exclusive (XOR), **Parallel (AND fork/join)**, Inclusive, Event-based; **Event**: timer (start/intermediate/**boundary** interrupting & non-interrupting), message, signal, error, **compensation**, terminate; sub-process, call activity, event sub-process; conditional/default sequence flow (UEL expressions trên biến process).
- **Gán người xử lý**: user task có `assignee` (một người — task chỉ hiện trong personal task list), `candidateUsers`/`candidateGroups` (pool → **claim**), cả hai có thể là **expression** — vd `flowable:assignee="${ldapService.findManagerForEmployee(emp)}"` (mô hình **manager-of** chính thức trong docs); **custom assignment qua TaskListener event="create"** gọi bean Spring; custom identity link types (owner, business administrator…); engine **không kiểm chứng user tồn tại** — chủ ý để nhúng với hệ identity sẵn có (rất hợp Open-ERP IAM).
- **Định kỳ/timeout/escalation**: **Due date** trên task (expression, chấp nhận ISO-8601 duration → `PT30M` = 30 phút kể từ lúc tạo), query theo due date; **Timer boundary event**: interrupting (timeout → hủy task, đi nhánh khác) và **non-interrupting** (reminder/escalation email mà task vẫn giữ nguyên — chính là pattern SLA ERP cần); timeCycle có **endDate** và dùng để "gửi nhiều reminder cho overdue user task"; lịch business calendar cấu hình được; timer chỉ chạy khi bật async executor.
- **Trigger**: start qua API (`startProcessInstanceByKey/ByMessage`), **timer start event** (định kỳ/cron), **message start** (correlate), **signal start** (broadcast); từ event của hệ ngoài: app nhận event → correlate qua API.
- **Theo dõi instance**: **TaskService query** (task của tôi/candidate — chính là task inbox), **History service** (instance/activity/task history phục vụ audit), **Job executor** với retry job (failed job, exception stack), diagram hiển thị tiến trình bằng BPMN diagram + runtime data (vẽ lại luồng đã đi là pattern chuẩn của engine BPMN).
- **Tích hợp**: chạy **cùng transaction với DB ứng dụng** khi nhúng (quan trọng: approve + update document trong 1 transaction), listener (execution/task listener) gọi bean Spring, message/signal qua API, REST API đóng gói riêng nếu cần.
- **Mạnh/Yếu**: ✓ Java thuần, nhúng vào Quarkus/Spring được, BPMN đầy đủ, expression/assignment động, timer boundary là pattern SLA/escalation hoàn chỉnh, history/audit có sẵn, community lớn, nguồn gốc Activiti (tiến hoá thành Activiti 8/Flowable thương mại). ✗ BPMN XML + editor là investment lớn (đào tạo, modeling); multi-tenant cần tự bảo đảm (schema/tenant id trong mọi bảng); version 7 thương mại vs OSS có phân cách tính năng.
- **Nguồn**: [BPMN 2.0 Constructs (Flowable OSS docs)](https://www.flowable.com/open-source/docs/bpmn/ch07b-BPMN-Constructs/) — *Đã kiểm chứng* (timer, boundary, gateway, user task assignment, dynamic assignment, due date); [Flowable OSS docs index](https://www.flowable.com/open-source/docs/) — *Đã kiểm chứng một phần*.

### 2.10. ERP Việt Nam: Base.vn, MISA AMIS, 1Office

- **Base.vn (Base Process / Base Request)**: mô hình **"app + sự kiện + kéo thả nối service"**. Mỗi service có **đầu ra sự kiện chuẩn**: Request: `requestCreated`, `requestApproved`, `requestRejected`; Wework (công việc): `taskCreated`, `taskDone`, `taskStatusUpdate`, `subtaskCreated`…; Workflow (nhiệm vụ): `jobCreated`, `jobDone`, `jobFailed`, `jobForwarded`; giai đoạn: `jobNext`, `jobBack`, `jobIn`, `jobReassign`. Nối service A → B bằng **input key trùng key trường dữ liệu** (hoặc **Transformer** map key `custom_*`), kèm **cây điều kiện VÀ/HOẶC** (10 phép so sánh) để quyết định có truyền hay không. Base Request: đề xuất theo **biểu mẫu theo nghiệp vụ (e-form)** + **luồng duyệt rõ ràng + trạng thái minh bạch**. → Cực kỳ gần với mong muốn "workflow trigger từ entity của plugin khác qua event". (*Đã kiểm chứng*: [Base Process](https://help.base.vn/support/solutions/articles/63000275582-base-process-thi%E1%BA%BFt-l%E1%BA%ADp-quy-tr%C3%ACnh-chi-ti%E1%BA%BFt), [Base Request](https://base.vn/app/request); luồng duyệt nhiều cấp chi tiết — *một phần*)
- **MISA AMIS Quy trình**: quy trình = **thư viện mẫu hoặc tự thiết kế**: khai báo tên/phiên bản (lịch sử phiên bản, khôi phục được)/nhóm/**phân quyền ai được chạy**; các **bước tuần tự** với: **biểu mẫu nhập liệu** kéo thả (mặc định "ghi nhớ lần gần nhất", hiển thị trường bước trước), **người thực hiện**: Người dùng tự chọn / Nhóm trong ứng dụng / **Người thực hiện bước trước** / **Quản lý trực tiếp (theo hệ thống nhân sự)** / Vị công việc–Chức danh; **thời hạn xử lý** (khoảng thời gian hoặc **lấy từ trường thời gian trên biểu mẫu**) + **nhắc nhở trước hạn**, quá hạn **vẫn xử lý được nhưng ghi nhận quá hạn** vào báo cáo; **bước song song** (độc lập luồng), **bước phê duyệt**; **người liên quan** (CC) nhận thông báo; thiết lập nâng cao: **Luồng quy trình** (kết quả Đồng ý/Từ chối hoặc Chuyển tiếp/Trả về từng bước + điều kiện rẽ nhánh), bảo mật trường, điều kiện trường, email, mẫu in, **chạy định kỳ**, **kết nối ứng dụng khác**, **quy trình liên kết** (khởi chạy quy trình khác khi xong), **Open API** (trao đổi dữ liệu, tự khởi tạo lượt chạy); **Phát hành** mới hiệu lực, nháp không chạy. AMIS **Công việc**: phê duyệt **nhiều cấp tối đa 5**, thứ tự cấp, có hạn riêng từng cấp, bị từ chối ở cấp nào thì dừng (không đẩy tiếp), quá hạn thì cả cấp phải duyệt xong mới sang cấp sau; tự động gửi phê duyệt khi công việc chuyển sang cột (event trigger). (*Đã kiểm chứng*: [Tạo mới quy trình](https://helpamis.misa.vn/amis-quy-trinh/kb/tao-moi-quy-trinh/), [Phê duyệt nhiều cấp](https://helpamis.misa.vn/amis-cong-viec/kb/ap-dung-phe-duyet-nhieu-cap/))
- **1Office**: quy trình **đa luồng, rẽ nhánh theo điều kiện**, **quy trình xét duyệt đồng thời**; **giao việc theo vị trí/phòng ban**; **cấu hình biểu mẫu ngay trên quy trình**; **liên kết đối tượng** (Khách hàng, báo giá, hợp đồng, phiếu thu chi) vào bước; **tích hợp chữ ký số** trong luồng; quy định người thực hiện + người theo dõi/giám sát; dashboard/báo cáo tiến độ theo quy trình. (*Đã kiểm chứng một phần* — trang sản phẩm: [1Office Quy trình](https://1office.vn/quanlyquytrinh))
- **Mạnh/Yếu (nhóm VN)**: ✓ khớp kỳ vọng người dùng Việt: **"đề xuất" là trung tâm** (e-form theo nghiệp vụ → luồng duyệt nhiều cấp theo thứ tự → đồng ý/từ chối/**trả về**), **quản lý trực tiếp** là assignment mặc định, hạn xử lý + nhắc trước hạn + **báo cáo quá hạn**, CC người liên quan, mẫu in, phiên bản quy trình có khôi phục, chữ ký số. ✗ docs không công bố mô hình kỹ thuật (không thấy khai báo engine/state machine); song song giới hạn; tích hợp chủ yếu trong hệ sinh thái.

### 2.11. Bảng tổng hợp nhanh

| Sản phẩm | Mô hình | Node chính | Assignment | SLA/escalation | Trigger | Instance tracking | Nguồn |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Odoo 17/18 | state field + automation rule + approval request | activity, approval step, action chain | user / dynamic user from record | deadline + timing rule (thô) | field change, email, timing, custom, **webhook** | chatter + field tracking, rule logs | Kiểm chứng |
| Frappe/ERPNext | **state machine trên DocType** | state, transition (+ transition task v16) | role per transition + condition | không (email alert) | vòng đời document, hook, webhook | workflow state trên document, action list | Kiểm chứng |
| Camunda 8 | **BPMN XML trên Zeebe** | user/service task, gateway, timer, message | assignee/candidate (biểu thức FEEL) | due/follow-up date, priority, timer boundary | API, message, timer, signal | Tasklist + Operate + exporter | Kiểm chứng |
| Temporal | **code (durable execution)** | activity, timer, signal | không có | activity retry, timer | API, schedule, signal | event history UI | Kiểm chứng |
| n8n | đồ thị node (JSON) | webhook/schedule trigger, if/switch, http | không có | wait, error trigger, retry log | webhook (auth+respond), schedule, app | execution log từng node | Kiểm chứng |
| Zapier/Make | trigger → filter → actions | filter, paths/router, delay | không có | delay | app triggers, webhook | zap/scenario history | Kiểm chứng |
| NocoBase | trigger + node plugin (JSON) | manual, **approval**, condition, parallel, http | **user/variable/query động; countersign/vote/return/reassign/add-signer** | delay (SLA mỏng) | **collection event, pre/post-action, custom action, schedule, webhook, approval** | execution history + **to-do inbox** + approval records | Kiểm chứng |
| Appsmith/Budibase | code/automation step | condition, query, notification | không có (HITL đang xây) | cron | webhook, row event, cron | automation log | Một phần |
| Flowable/Activiti | **BPMN XML nhúng Java** | user task, gateway, timer/message/error event | assignee/candidate + **expression manager-of** + task listener | **due date + timer boundary interrupting/non-interrupting (reminder/escalation)** | API, timer, message, signal | task query + **history service** + runtime diagram | Kiểm chứng |
| Base.vn/MISA/1Office | e-form + luồng duyệt nhiều cấp | bước duyệt, bước song song, CC | **quản lý trực tiếp, nhóm, vị trí, bước trước, tự chọn** | **hạn + nhắc trước hạn + báo cáo quá hạn** | tạo đề xuất, event của app khác, định kỳ, Open API | trạng thái lượt chạy + lịch sử phiên bản | Kiểm chứng (1Office một phần) |

## 3. Bài học cho Open-ERP (plugin workflow engine)

### 3.1. Tách bạch "định nghĩa luồng" và "instance chạy", kèm versioning definition

- *Các hệ thống*: Flowable/Camunda deploy definition có version — instance cũ tiếp tục chạy đúng bản nó khởi tạo, message/timer subscription của bản cũ được gỡ; NocoBase có Version Management + Execution History riêng; MISA có Lịch sử phiên bản + Phát hành (nháp không chạy); Camunda form binding chọn `deployment`/`latest`.
- *Khuyến nghị*: bảng `workflow_definition` (JSON schema, `version`, `status`: DRAFT/PUBLISHED/ARCHIVED) tách `workflow_instance` (pin `definition_version`); sửa luồng → version mới; instance đang chạy không đổi hành vi giữa chừng; cho phép "luồng mới cho việc mới" là cấu hình.

### 3.2. Workflow phải trigger được từ entity của plugin khác qua Entity Registry/event system

- *Các hệ thống*: NocoBase Collection Event/Pre-action/Post-action/Custom Action trigger là đúng mô hình này; Base Process mở đầu ra sự kiện chuẩn (`requestCreated/Approved/Rejected`, `jobCreated/jobDone/jobForwarded/jobReassign`) cho mọi app nối vào; Odoo automation rule đăng ký trên model bất kỳ; Frappe hook `workflow_methods` cho plugin góp action vào transition.
- *Khuyến nghị*: plugin workflow **đăng ký trigger theo (plugin, entity, event)** từ Entity Registry (created/updated/deleted/status_changed + custom action event); hợp đồng event ổn định (payload = snapshot entity + actor + tenant); trigger là plugin loại riêng để sau thêm schedule/webhook mà không sửa core. Đây là yêu cầu số 1 của Sprint 08.

### 3.3. Chọn mô hình "state machine + task" cho v1, thiết kế schema để sau này nâng cấp BPMN — nhưng học semantics từ Flowable

- *Các hệ thống*: Frappe chứng minh **state machine trên document + role + condition** phủ được phần lớn bài toán ERP (đề xuất, phê duyệt nhiều cấp); Camunda/Temporal quá nặng cho SaaS multi-tenant nhỏ; Flowable cho thấy phần "đắt giá" cần mượn: **boundary timer interrupting/non-interrupting, parallel fork/join, event listener, history tables, versioned definition, expression-based assignment**.
- *Khuyến nghị*: **tự viết state machine đơn giản (JSON definition) trong plugin** — phù hợp Quarkus (không thêm cluster, cùng transaction DB), nhưng chuột học semantics của Flowable/BPMN để đặt tên mô hình đúng (node type, transition, condition, listener) và giữ đường nâng cấp: nếu sau này cần BPMN thật, nhúng **Flowable engine (OSS, embeddable Java)** cho các plugin/process phức tạp thay vì tự dựng hết; Camunda 8 chỉ cân nhắc khi có bài toán phân tán lớn. Không nhúng engine BPMN cho v1 nếu chưa có nhu cầu fork/join phức tạp trong tenant thật.

### 3.4. Task inbox là thành phần bắt buộc, không phải phụ kiện

- *Các hệ thống*: NocoBase To-do block/To-do Center + "My Approvals" card; Camunda Tasklist ("assigned to me", claim); Odoo activity systray; Flowable TaskService query; ERPNext "Workflow Actions".
- *Khuyến nghị*: plugin cần **entity Task chung** (`workflow_task`: instance, node, assignee/candidates, due date, status) + màn **"Việc của tôi"** (Angular/Ionic): lọc theo role/quá hạn, claim nếu là candidate, xử lý đúng form của node; nhiệm vụ của mọi workflow (duyệt, xử lý, xác nhận) đều đổ về một inbox thay vì mỗi plugin một nơi.

### 3.5. Assignment phải đa tầng: tĩnh → vai trò → động theo dữ liệu → can thiệp tay

- *Các hệ thống*: Flowable `assignee`/`candidateGroups` là expression (`findManagerForEmployee(emp)` = manager-of); Odoo "Dynamic User (based on record)"; MISA có sẵn **Quản lý trực tiếp / Người thực hiện bước trước / Nhóm / Vị trí công việc**; NocoBase Approval cho **tập approver từ biến hoặc query user collection**, countersign/vote, **Return/Reassign/Add signer** kèm Assignment Scope; Camunda cho claim từ candidate.
- *Khuyến nghị*: assignment spec (JSON) gồm: `USER` (chọn), `ROLE` (RBAC role Open-ERP), `FIELD_REF` (user manager trên record — hết sức phổ biến ở VN), `ORG_UNIT`, `QUERY` (resolve động lúc node kích hoạt); hành vi: **claim** cho candidate pool; **delegation/reassign** có kiểm soát (scope + audit); **self-approval bị chặn** (người tạo không duyệt chính đề xuất của mình).

### 3.6. SLA = due date + reminder (non-interrupting) + timeout (interrupting) + báo cáo quá hạn

- *Các hệ thống*: Camunda dueDate/followUpDate + priority; Flowable timer boundary non-interrupting cho reminder, interrupting cho timeout/escalation; MISA **thời hạn xử lý + nhắc trước hạn + quá hạn vẫn xử lý được nhưng ghi nhận vào báo cáo quá hạn**; Odoo activity deadline + timing rule.
- *Khuyến nghị*: node task có `due_date` (tĩnh hoặc expression) và `escalation_policy` (reminder trước hạn, escalation tới quản lý/sang nhóm khác sau hạn); timer chạy bằng **scheduler Quarkus (Quartz) multi-tenant aware** — mỗi timer job phải mang tenant context; **quá hạn không khoá việc** (người vẫn duyệt được) nhưng ghi dấu `overdue` vào task + instance để báo cáo — đúng kỳ vọng MISA/VN.

### 3.7. Audit log theo sự kiện, đủ để "vẽ lại luồng đã đi"

- *Các hệ thống*: n8n lưu dữ liệu in/out từng node + debug + retry; Temporal event history là nguồn sự thật và replay được; Flowable History service; Camunda exporter→Operate vẽ lại trạng thái BPMN; Odoo field tracking trên chatter.
- *Khuyến nghị*: `workflow_event` append-only (instance, node, transition, actor, thời điểm, dữ liệu trước/sau, kết quả duyệt + comment) — một bảng phục vụ cả audit, cả **timeline UI vẽ lại luồng đã đi** trên sơ đồ; mọi thao tác hệ thống (auto-escalation, reassign, timer fire) cũng là event có actor=SYSTEM; bổ sung field-level tracking kiểu Odoo khi entity thuộc plugin khác thay đổi dưới tay workflow.

### 3.8. Định kỳ và auto-run phải là "timer/schedule instance", không phải logic rải rác

- *Các hệ thống*: MISA "chạy định kỳ" tự khởi tạo lượt chạy theo chu kỳ; Flowable timer start event + timeCycle; n8n Schedule Trigger; NocoBase Schedule trigger; Odoo timing conditions.
- *Khuyến nghị*: schedule là **một loại trigger** tạo instance mới theo cron cho tenant; với reminder dùng timer một-lần/cycle gắn vào task; mọi timer phải idempotent (khoá tenant+definition+key) vì scheduler có thể lặp.

### 3.9. Điều kiện rẽ nhánh dùng expression an toàn trên dữ liệu entity, có biến context chuẩn

- *Các hệ thống*: Frappe condition Python trên `doc.grand_total` (kèm whitelist hàm cho phép); Flowable UEL `${order.price > 100}`; Base Process cây điều kiện VÀ/HOẶC với 10 phép so sánh; Make filter; Camunda FEEL.
- *Khuyến nghị*: v1 không cho chạy code tự do — dùng **expression DSL nhỏ** (so sánh, logic, hàm tiện ích) đánh giá trên context chuẩn: `entity` (snapshot), `initiator`, `tenant`, `previous_node_result`, `vars`; UI dựng điều kiện kiểu Base Process (chọn field – phép toán – giá trị) thay vì bắt gõ expression; ghi log kết quả đánh giá điều kiện vào audit.

### 3.10. Tích hợp hai chiều: nhận webhook/event để start, phát webhook/HTTP để bắn ra ngoài

- *Các hệ thống*: Odoo automation "On webhook" (URL + secret + rotate + **Log Calls** payload) và "Send Webhook Notification"; n8n webhook có test/prod URL + auth + respond modes; NocoBase Webhook trigger + HTTP Request node + Response node; MISA Open API tự khởi tạo lượt chạy.
- *Khuyến nghị*: plugin đăng ký **webhook endpoint có secret + rotate + log payload** để hệ ngoài khởi tạo instance; mỗi node HTTP Request/service node cho phép gọi API hệ khác (kèm timeout/retry); phát **webhook ra ngoài khi instance thay đổi trạng thái** cho hệ thống bên (đúng pattern event bus nội bộ của Open-ERP: prefer event nội bộ, webhook cho bên thứ ba).

### 3.11. Multi-tenant xuyên suốt mọi bảng và job của engine

- *Các hệ thống*: không sản phẩm nào public docs về multi-tenant engine một cách trực tiếp (SaaS dùng per-DB); Flowable chủ ý **không kiểm chứng user** để nhúng với hệ identity sẵn có — bài học là engine phải mỏng về identity/tenant và phụ thuộc lớp IAM của host. (Suy luận tổng hợp)
- *Khuyến nghị*: mọi bảng (`definition`, `instance`, `task`, `timer`, `event`, `variable`) mang `tenant_id` + Row-Level check giống entity thường; job scheduler chạy lại trong tenant context; các số liệu báo cáo (task quá hạn, hiệu suất duyệt) luôn bị chặn theo tenant; test isolation là hạng mục nghiệm thu bắt buộc của Sprint 08.

### 3.12. Khớp kỳ vọng thị trường Việt Nam: "đề xuất – e-form – duyệt nhiều cấp – trả về – chữ ký"

- *Các hệ thống*: Base Request (e-form theo nghiệp vụ, luồng duyệt, trạng thái minh bạch); MISA (biểu mẫu kéo thả, **Quản lý trực tiếp**, hạn + nhắc, **Trả về/Chuyển tiếp** từng bước, người liên quan, mẫu in, phiên bản khôi phục được, **bước song song**, tối đa 5 cấp duyệt, **quá hạn vẫn duyệt được nhưng vào báo cáo**); 1Office (rẽ nhánh điều kiện, duyệt đồng thời, biểu mẫu trên quy trình, **chữ ký số**, liên kết đối tượng); NocoBase Approval (Return đến bước chỉ định, countersign/vote).
- *Khuyến nghị*: v1 phải có: khởi tạo từ **form/entity của plugin khác**; luồng **tuần tự nhiều cấp + rẽ nhánh điều kiện + song song cơ bản**; hành động **Đồng ý / Từ chối (dừng toàn bộ) / Trả về (chọn bước)**; comment bắt buộc khi từ chối; **người liên quan (CC)** nhận thông báo; báo cáo **tình hình quá hạn**; mẫu in/Phiếu đề xuất; chữ ký số để giai đoạn sau nhưng giữ chỗ trong mô hình hành động của node.

## 4. Nguồn (đã đọc trong phiên soạn)

- Odoo 17: [Actions](https://www.odoo.com/documentation/17.0/developer/reference/backend/actions.html) · [Automation rules](https://www.odoo.com/documentation/17.0/applications/studio/automated_actions.html) · [Mixins: mail.thread, mail.activity](https://www.odoo.com/documentation/17.0/developer/reference/backend/mixins.html) · [Approvals app](https://www.odoo.com/app/approvals) · [to_approvals (Viindoo)](https://viindoo.com/apps/modules/17.0/to_approvals)
- Frappe/ERPNext: [Workflows](https://docs.frappe.io/erpnext/user/manual/en/workflows) · [Easy steps to setup Workflow](https://docs.frappe.io/erpnext/easy-steps-to-setup-workflow) · [Workflow Transition Tasks](https://docs.frappe.io/erpnext/workflow-transition-tasks)
- Camunda 8: [Zeebe Architecture](https://docs.camunda.io/docs/8.7/components/zeebe/technical-concepts/architecture/) · [User tasks](https://docs.camunda.io/docs/components/modeler/bpmn/user-tasks/) · [Timer events](https://docs.camunda.io/docs/components/modeler/bpmn/timer-events/)
- Temporal: [Workflows](https://docs.temporal.io/workflows) · [Saga pattern](https://docs.temporal.io/design-patterns/saga-pattern)
- n8n: [Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) · [Core nodes index](https://docs.n8n.io/integrations/builtin/core-nodes)
- Zapier: [Quick start](https://help.zapier.com/hc/en-us/articles/22234847450893-Zap-workflows-quick-start-guide) · [Paths](https://help.zapier.com/hc/en-us/articles/8496288555917-Add-branching-logic-to-Zap-workflows-with-Paths) · Make: [Router](https://help.make.com/router) · [Filter](https://help.make.com/step-4-add-a-filter)
- NocoBase: [Workflow Overview](https://docs.nocobase.com/workflow/) · [Manual node](https://docs.nocobase.com/workflow/nodes/manual) · [Approval node](https://docs.nocobase.com/workflow/nodes/approval) · [Approval trigger](https://nocode.docs.nocobase.com/workflow/triggers/approval)
- Appsmith: [Workflows overview](https://docs.appsmith.com/workflows) · [Workflow triggers](https://docs.appsmith.com/workflows/reference/workflow-triggers) · Budibase: [Bindings in automations](https://docs.budibase.com/docs/data-in-automations)
- Flowable: [BPMN 2.0 Constructs](https://www.flowable.com/open-source/docs/bpmn/ch07b-BPMN-Constructs/) · [OSS docs index](https://www.flowable.com/open-source/docs/)
- Base.vn: [Base Process](https://help.base.vn/support/solutions/articles/63000275582-base-process-thi%E1%BA%BFt-l%E1%BA%ADp-quy-tr%C3%ACnh-chi-ti%E1%BA%BFt) · [Base Request](https://base.vn/app/request) · MISA AMIS: [Tạo mới quy trình](https://helpamis.misa.vn/amis-quy-trinh/kb/tao-moi-quy-trinh/) · [Phê duyệt nhiều cấp](https://helpamis.misa.vn/amis-cong-viec/kb/ap-dung-phe-duyet-nhieu-cap/) · 1Office: [Quản lý quy trình](https://1office.vn/quanlyquytrinh)
