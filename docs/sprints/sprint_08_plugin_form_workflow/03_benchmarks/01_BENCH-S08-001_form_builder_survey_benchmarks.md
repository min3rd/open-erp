# [BENCH-S08-001] Đối chuẩn: Form builder / survey / thu thập dữ liệu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S08-001 / Đối chuẩn / Sprint 08 (plugin form builder) |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [ANL-S08-001](../02_analysis/01_ANL-S08-001_form_builder_plugin.md), [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md); nghiên cứu web trực tiếp tài liệu chính thức của 10 sản phẩm (URL ở từng mục) |
| Đọc trước / đọc tiếp | [BENCH-S07-001](../../sprint_07_plugin_employee/03_benchmarks/01_BENCH-S07-001_employee_profile_and_self_service.md) (pattern duyệt đề xuất) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 04 CONF (chưa soạn) |

## 1. Mục đích và phương pháp

Sprint 08 cần quyết định các bài toán chính của plugin form builder:

1. **Mô hình form**: form → sections/questions → responses lưu JSON hay bảng quan hệ?
2. **Liên kết entity**: form ghi vào bảng riêng hay ghi thẳng vào entity của plugin khác (qua Entity Registry)?
3. **Form public**: người ngoài tenant điền thế nào (link, đăng nhập, anonymous, single-use)?
4. **Phân quyền response**: ai được xem/trích xuất response của tenant nào?
5. **Logic**: skip logic, validation, quiz/scoring sâu đến đâu là đủ?
6. **Tích hợp**: webhook, trigger workflow/approval, lưu vào entity nào?

Tài liệu đối chuẩn 10 sản phẩm, chọn lọc theo mức phổ biến toàn cầu (Google/Microsoft/Typeform/JotForm), mã nguồn mở có thể tham khảo trực tiếp (Formbricks/LimeSurvey/NocoBase/Frappe) và bối cảnh ERP (Odoo Survey, MISA AMIS, Base.vn). Quy ước nhãn:

- **Đã kiểm chứng**: đọc trực tiếp tài liệu chính thức (docs/help/API) hoặc mã nguồn của sản phẩm trong phiên soạn tài liệu này.
- **Đã kiểm chứng một phần**: có nguồn chính thức nhưng chỉ xác nhận một phần hành vi, phần còn lại suy từ nguồn thứ cấp.
- **Suy luận**: suy đoán từ kinh nghiệm/tài liệu thứ cấp, cần kiểm chứng thêm khi triển khai.

Giới hạn: đối chuẩn định tính từ tài liệu công khai, không đo hiệu năng/không chạy thử sản phẩm; tính năng SaaS thay đổi theo gói/phiên bản (một số URL có thể đổi). Mục tiêu là rút bài học kiến trúc, không sao chép toàn bộ sản phẩm.

## 2. Bảng tóm tắt nhanh

| Sản phẩm | Mô hình form | Logic mạnh nhất | Form public | Entity/workflow | Trạng thái nguồn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Google Forms | JSON (Form → items) | Skip logic theo option→section; quiz grading | Published + granular responder access | Drive/Sheets/API watches | Đã kiểm chứng |
| Microsoft Forms | Form UI + Excel workbook | Branching chỉ tiến tới trước | Link / giới hạn org | Excel, Power Automate | Đã kiểm chứng một phần |
| Typeform | JSON (fields + ref, logic, variables) | Logic Jump + tính toán + multi-branch | Link công khai + hidden fields | Webhook + 300+ integration | Đã kiểm chứng |
| JotForm | Form → fields (JSON qua API) | Conditions + Workflows (approval canvas) | Link, require login | Webhook, API, payment, e-sign | Đã kiểm chứng một phần |
| Formbricks | JSON schema (Zod): survey → blocks/elements | Logic theo operator từng loại câu hỏi + cyclic check | Link/app survey, single-use + PIN, anonymize | Webhook, REST, SDK, SpiceDB RBAC | Đã kiểm chứng |
| LimeSurvey | Quan hệ: surveys→groups→questions→answers | ExpressionScript (relevance, tính toán) | Token/participants, anonymous | API, plugin, flat response table | Đã kiểm chứng |
| Odoo Survey | survey → sections + questions (ORM) | Conditional display + scoring/certification | Access mode + require login + attempts | Contacts, eLearning, mail, live session | Đã kiểm chứng |
| Frappe Web Form | Web Form → DocType + web_form_fields | Client script (logic yếu) | Public/login/anonymous/key link | **Submission = document DocType** | Đã kiểm chứng |
| NocoBase | Form block ↔ collection | Workflow trigger khi submit form | Cần cấu hình (app nội bộ) | Form = UI nhập collection; trigger workflow | Đã kiểm chứng một phần |
| MISA AMIS / Base.vn | Nhóm đề xuất → custom form | Approval flow nhiều cấp, song song | Nội bộ DN | Kết nối hệ sinh thái, mẫu in | Đã kiểm chứng một phần |

## 3. Đối chuẩn chi tiết theo sản phẩm

### 3.1. Google Forms

**Trạng thái nguồn: Đã kiểm chứng** (Forms API reference, Help Center).

- **Mô hình hóa form**: JSON object `Form`: `{formId, info{title, description}, settings{quizSettings.isQuiz, emailCollectionType}, items[], revisionId, responderUri, linkedSheetId, publishSettings{isPublished, isAcceptingResponses}}`. Form là một file Drive (xoá/quyền truy cập quản qua Drive API). `items[]` là danh sách tuần tự, mỗi item là một trong: `questionItem`, `questionGroupItem` (grid/ma trận), `pageBreakItem` (**section = page break**, title/description hiển thị đầu trang mới), `textItem`, `imageItem`, `videoItem`. Cập nhật qua `batchUpdate` với `revisionId` (optimistic concurrency) — mô hình "document JSON + write control", không phải bảng quan hệ.
- **Loại câu hỏi**: `choiceQuestion` (RADIO/CHECKBOX/DROP_DOWN; option có `value`, `image`, `isOther`), `textQuestion` (short/paragraph), `scaleQuestion` (low/high + nhãn), `dateQuestion` (includeTime/includeYear), `timeQuestion`, `fileUploadQuestion` (folderId Drive, types, maxFiles, maxFileSize — API không cho tạo loại này), `ratingQuestion` (icon STAR/HEART/THUMB_UP + mức), `rowQuestion` (dòng của grid).
- **Logic điều kiện**: skip logic đặt **trên từng option** của RADIO/DROP_DOWN: `goToSectionId` / `goToAction` (NEXT_SECTION, RESTART_FORM, SUBMIT_FORM) — không có điều kiện AND/OR nhiều trường, không áp dụng cho CHECKBOX và grid. Validation theo câu hỏi: response validation trên short/paragraph (number, text, length, regex) với thông báo lỗi tuỳ chỉnh. Quiz mode (`isQuiz`): `Grading{pointValue, correctAnswers[], whenRight/whenWrong/generalFeedback}` cho chấm tự động; option `shuffle`.
- **Phân quyền/chia sẻ**: tách rõ **collaborator** (editor, chia sẻ kiểu Drive) và **responder**. Responder phải qua `publishSettings` (publish/unpublish, accept responses). Từ 2026 Google nâng cấp toàn bộ form sang "granular controls": giới hạn responder theo user/group/target audience cụ thể. Email responder: DO_NOT_COLLECT / VERIFIED (lấy từ account Google đang đăng nhập) / RESPONDER_INPUT. "Limit to 1 response" buộc đăng nhập Google; "Allow response editing"; "View results summary" cho responder; link responder có thể đặt **ngày hết hạn**; pre-fill link; embed HTML.
- **Xử lý responses**: tab Responses (Summary tổng hợp biểu đồ / Individual theo người); **Link to Sheets** (`linkedSheetId`) sync gần realtime; **Download responses (.csv)**; email notification khi có response; response receipts; stop collecting + close date + response limit; giới hạn kỹ thuật 500k responses / 1GB per form (từ 9/2026).
- **Tích hợp**: Drive (file), Sheets, Apps Script/Add-ons, Forms REST API với **watches** (push notification khi có response thay đổi) và đọc quiz grades; file upload lưu vào thư mục Drive của form.
- **Điểm mạnh**: chuẩn de-facto, cộng tác thiết kế form realtime nhiều editor, Sheets trực tiếp, quiz grading tốt, phân quyền responder chi tiết mới.
- **Điểm yếu**: skip logic rát mỏng (option→section, không điều kiện phức hợp), không có approval workflow/payment native, file upload ép dùng Google account, API không phủ hết UI (publish, tạo câu hỏi upload), không lưu dữ liệu có cấu trúc vào entity nào ngoài Sheet.
- Nguồn: https://developers.google.com/workspace/forms/api/reference/rest/v1/forms · https://support.google.com/docs/answer/139706 (responses) · https://support.google.com/docs/answer/2839588 (publish & share) · https://support.google.com/docs/answer/2917111 (collaborators) · https://workspaceupdates.googleblog.com/2026/01/granular-controls-google-forms-responses.html

### 3.2. Microsoft Forms

**Trạng thái nguồn: Đã kiểm chứng một phần** (trang hỗ trợ chính thức cho branching/loại câu hỏi; mô hình lưu trữ suy từ tài liệu + bài viết thực hành).

- **Mô hình hóa form**: form/quiz/poll tuyến tính theo trang, có **sections**; không công khai schema JSON như Google. Điểm đặc trưng: **response đồng bộ vào một workbook Excel** (form tạo từ OneDrive/Excel live-sync; form của Microsoft 365 Group lưu workbook trong thư viện tài liệu SharePoint của group) — data "lives in a file", phân quyền kế thừa quyền file/ SharePoint.
- **Loại câu hỏi**: Choice, Text, Rating, Date là 4 loại chính; "More question types": **Ranking, Likert, File upload, Net Promoter Score**, Section. Quiz mode: gán điểm từng câu, chấm tự động cho choice/text, feedback.
- **Logic điều kiện**: **Branching** cho survey/quiz: chọn "More settings for question → Add branching", mỗi câu (hoặc section) ánh xạ từng lựa chọn tới câu hỏi/section/end-of-form. **Chỉ được branch tới câu hỏi phía sau (consecutive forward)**, không branch ngược — Microsoft tuyên bố thẳng đây là để tránh phá trải nghiệm. Có Reset branching. Không có điều kiện nhiều trường (AND/OR), không có tính toán biến.
- **Phân quyền/chia sẻ**: link công khai; giới hạn theo tổ chức (chỉ người có tài khoản Office 365); record name/anonymous; one response per person; **group form** thuộc Microsoft 365 Group → toàn bộ thành viên group có quyền (dùng chung quyền qua group, không phân quyền từng response); share form để cộng tác soạn; share as template.
- **Xử lý responses**: tab Results (biểu đồ tổng hợp, xem từng người, in), **Open in Excel** (workbook live), tải CSV; notification qua **Power Automate** ("When a new response is submitted" → "Get response details" → tuỳ ý ghi Sheet/Teams/mail); đóng form, message.
- **Tích hợp**: Power Automate, Excel, Teams (poll trong meeting), SharePoint; không có webhook công khai thân thiện như Typeform; Microsoft Graph API cho Forms hạn chế (đọc qua IT admin) — chi tiết API đánh dấu **Suy luận**.
- **Điểm mạnh**: "free" theo licence M365, Excel/Power Automate làm được nhiều việc, group-based sharing hợp doanh nghiệp, dễ dùng.
- **Điểm yếu**: branching một chiều rất cơ bản, logic yếu, branding hạn chế (thân thiện hơn trong Dynamics 365 Customer Voice trả phí), không có approval/payment native, phụ thuộc hệ sinh thái MS.
- Nguồn: https://support.microsoft.com/en-us/forms/use-branching-logic-in-microsoft-forms · https://support.microsoft.com/en-us/forms/create-a-form-with-microsoft-forms · https://learn.microsoft.com/en-us/answers/questions/5397087/using-forms-can-i-feed-answers-to-different-excel

### 3.3. Typeform

**Trạng thái nguồn: Đã kiểm chứng** (Typeform Developers — Logic Jumps, Responses/Webhooks API; Help Center branching).

- **Mô hình hóa form**: JSON form gồm: **welcome screen → fields (câu hỏi) → thank-you screens**; mỗi field có **`ref` do người phát triển đặt, ổn định** (`^[a-zA-Z0-9_-]+$`) — logic, tính toán và API đều tham chiếu ref thay vì vị trí. Kèm: **hidden fields** (biến từ URL, dùng để trích dữ liệu hệ thống ngoài), **variables** (tính điểm/giá), logic array, multi-language, themes. UX đặc trưng: **một câu hỏi một màn hình**, tiến dần như hội thoại.
- **Loại câu hỏi**: text fields (short text, long text, dropdown, email, website), numeric (number, rating, opinion scale), choice (multiple choice single/multi, picture choice, yes/no, legal), date, file upload, payment, contact info, ranking, matrix, statement... (bộ cơ sở xác minh qua tài liệu Logic Jumps; phần payment/ranking từ Help Center — một phần kiểm chứng).
- **Logic điều kiện**: **Logic Jumps**: `{type: field|hidden, ref, actions[{action: jump|add|subtract|multiply|divide, details.to{field|thankyou}, condition{op, vars}}]}`. Operator theo từng loại trường: text (equal, contains, begins_with...), numeric (lower_than, greater_equal_than...), choice (is/is_not), date (on, earlier_than, later_than), file (answered), hidden field; **AND/OR lồng nhau**. Quy tắc: **nhiều điều kiện trong một logic — điều kiện đầu thoả được dùng, đặt điều kiện chặt nhất lên trước**; không nhảy ngược về câu hỏi chưa đi qua; multi-branching (mỗi nhánh phải có jump ở đầu). Ngoài jump còn có **calculation** (cộng/trừ/nhân/chia vào variable — làm bảng giá, điểm). Help Center còn có: logic để ẩn câu hỏi/ẩn lựa chọn, price/score calculation.
- **Phân quyền/chia sẻ**: link công khai (`typeform.com/to/{formId}`), embed, QR; hidden fields qua URL param (`?email=x&ref=y`) để gắn danh tính từ hệ thống gọi (CRM gửi link theo contact); respondent không cần tài khoản; workspace/API key quản form.
- **Xử lý responses**: **Responses API** (retrieve với advanced filter, delete, RTBF), JSON response schema đầy đủ, tải file đã upload qua API, CSV export từ UI; **webhooks per form** (event response khi submit); summary/report trong UI.
- **Tích hợp**: webhooks + API + 300+ app (Zapier/Make/HubSpot...); hidden fields là "chìa khoá" nối form với entity hệ thống khác (dùng để prefill + đối soát).
- **Điểm mạnh**: UX một-câu-hỏi-một-màn-hình tốt nhất ngành; logic engine sâu (jump + calculate + hide); `ref` ổn định là chuẩn mực cho dữ liệu tích hợp.
- **Điểm yếu**: thương mại, giới hạn response theo gói; không khái niệm "response thuộc entity nào" — phải tự ghép bằng hidden fields; không có approval workflow native.
- Nguồn: https://www.typeform.com/developers/create/logic-jumps/ · https://www.typeform.com/developers/ · https://help.typeform.com/hc/en-us/sections/37272776924180-Branching-logic

### 3.4. JotForm

**Trạng thái nguồn: Đã kiểm chứng một phần** (Jotform Workflows Help Guide + API docs đọc trực tiếp; chi tiết builder/thư viện template từ tài liệu sản phẩm — một phần kiểm chứng).

- **Mô hình hóa form**: form → các element/field (API `GET /form/{id}` trả JSON form kèm mảng questions: type, text, order...); **hệ sinh thái lớn quanh form**: 10k+ form templates, **Jotform Tables** (bảng dữ liệu submission kiểu spreadsheet/kanban), Reports, **Jotform Workflows** (canvas tự động hoá sau submit), Jotform Sign, Jotform Inbox.
- **Loại câu hỏi**: bộ field rất lớn (100+): text/email/phone/address/date/time, dropdown, radio, checkbox, matrix, rating, scale, slider, file upload, **e-signature**, appointment, product list, payment fields... (danh sách mở qua widget).
- **Logic điều kiện**: **Conditions** trong builder (show/hide field, require, tính toán); trong **Workflows** có hẳn các phần tử **If/Else Condition** (2 nhánh) và **Conditional Branch** (nhiều nhánh), **Split/Merge Branches** (song song), **Pause/Delay**.
- **Phân quyền/chia sẻ**: link công khai, embed; **require login** toggle (kể cả cho approver/assignee trong workflow — tắt đi thì assignee hoàn thành task không cần đăng nhập); form giao theo nhiệm vụ (assign to respondent); mobile app.
- **Xử lý responses**: Tables (bảng + kanban, filter, Flow Status column theo workflow), CSV/PDF export, reports; email alert khi submit; **Test Run** để chạy thử workflow từng bước; Flow Report element xuất báo cáo trình duyệt duyệt.
- **Tích hợp**: **Workflows là điểm mạnh nhất**: sau submit chạy canvas gồm: Approval element (approve/deny + **tự định nghĩa outcome**, multi-step, parallel, **Group Approval** với completion rules), Team Approval, **Request Payment / Payment element** (thanh toán giữa flow), **Sign Document** (e-sign), **PDF** (sinh văn bản từ submission), Email/Reminder/Scheduled email, Task, Form (form kế tiếp giao cho người khác điền), Webhook, integrations (Google Drive, calendar, WhatsApp...). Trigger đầu flow: form submit, **schedule, email, webhook, integration**. API v1 (đọc chủ yếu) + webhook `POST /form/{id}/webhooks`, giới hạn rate theo gói.
- **Điểm mạnh**: approval workflow dựng sẵn dạng canvas rất gần nhu cầu nghiệp vụ DN; payment + e-sign liền mạch; thư viện template; Tables để vận hành.
- **Điểm yếu**: proprietary; free tier giới hạn submission; dữ liệu không gắn entity ERP (phải qua API/webhook tự ghép); builder dày đặc dễ rối; logic trong form (condition) và trong workflow tách hai nơi.
- Nguồn: https://www.jotform.com/help/guide-jotform-workflows/ · https://api.jotform.com/docs/ · https://www.jotform.com/products/workflows/features/payment-forms/

### 3.5. Formbricks (open source)

**Trạng thái nguồn: Đã kiểm chứng** (docs chính thức + đọc trực tiếp schema TypeScript `packages/types/surveys/types.ts` trên GitHub).

- **Kiến trúc & self-host**: v6 chạy **8 dịch vụ dài hạn**: app, Formbricks Hub (API + worker), Cube (analytics), PostgreSQL, Redis/Valkey, SpiceDB + SpiceDB operator; storage phải nói chuyện **S3 API**; cài Docker/Helm (K8s 3 node khuyến nghị); **AGPL core + EE license** cho một số tính năng (AI, một phần advanced). Queue theo job: mỗi response sinh nhiều job (`responseCreated`, `responseUpdated` mỗi lần save tiến độ, `responseFinished`). Contact model: **mỗi attribute là một dòng** (50k contacts × 10 attributes = 500k rows) — lưu ý khi sizing.
- **Mô hình hóa form**: `Survey` (JSON validated bằng Zod): `{type: link|app, status: draft|inProgress|paused|completed, welcomeCard, **questions (flat, legacy) hoặc blocks (nhóm elements) — chỉ chọn một mô hình**, endings (endScreen hoặc redirectToUrl), hiddenFields, variables (number/text), embeddedFields, languages, styling, surveyClosedMessage, singleUse, recaptcha, segment (targeting cho app survey), displayOption, autoClose/displayLimit/recontactDays, publishOn/closeOn, isCaptureIpEnabled, isAnonymizeResponsesEnabled, followUps (gửi email tự động theo ending), slug, custom CSS}`. Response lưu riêng, có status tiến độ (partial → finished).
- **Loại câu hỏi (enum 17 loại)**: openText (inputType text/email/url/number/phone, longAnswer, charLimit min/max), multipleChoiceSingle/Multi (+other), NPS, rating (scale number/smiley/star, range 3–10), consent, pictureSelection, **CTA** (nút bấm/hành động), **cal** (đặt lịch Cal.com), date, matrix (rows/columns, shuffle), **address** (định dạng: mỗi sub-field bật/tắt + required riêng), **contactInfo**, ranking, **CSAT**, **CES**, fileUpload (allowMultipleFiles, maxSizeInMB, allowedFileExtensions).
- **Logic điều kiện**: logic gắn vào element: `{conditions (ConditionGroup), actions[]}`. Operator **validate theo đúng loại câu hỏi** (ví dụ multi-choice có `includesAllOf/includesOneOf`, NPS/rating so sánh số, CTA `isClicked`, consent `isAccepted`, cal `isBooked`, matrix `isPartiallySubmitted/isCompletelySubmitted`...); actions: **calculate** (số/chữ), **requireAnswer** (bắt buộc động), **jumpToBlock/jumpToQuestion** + `logicFallback`; **chỉ được tham chiếu câu hỏi phía trước**, có **validator phát hiện cyclic logic**; hidden field có operator riêng (`isSet`...).
- **Phân quyền/chia sẻ**: link survey công khai (slug), **survey-level visibility**: `workspace` (mọi người trong workspace) hoặc `restricted` (owner + org owners/managers) — chú thích mã nguồn gọi đây là "who may read a survey"; phân quyền nền tảng bằng **SpiceDB**; multi-language; **singleUse** (link một lần, có thể mã hoá + PIN 4 số), email verification, reCAPTCHA, tắt thu IP, **anonymize responses ngay lúc ingest**.
- **Xử lý responses**: response table per survey + summary; Dashboards & Charts (Cube) cho phân tích liên survey; **export CSV/XLSX**; **webhooks + REST API**; liên hệ/contact + attributes để gán response về người dùng app.
- **Tích hợp**: SDK (web/app survey nhúng trong sản phẩm, trigger theo **action class** + segment/targeting + recontact/quota), link/email survey, webhook, API, Workflow (Act) platform với trigger/filter/action, Qualtrics import.
- **Điểm mạnh**: mã nguồn mở kiểm tra được tới schema; RBAC tổ chức; privacy-first (anonymize, single-use, EU); targeting in-app đặc sắc; mô hình logic chặt (validate operator theo type, chống vòng lặp).
- **Điểm yếu**: stack tự host nặng (8 services, 4GB là sàn), AGPL ràng buộc, survey/feedback thuần — **không có khái niệm response ghi vào entity nghiệp vụ**, không có approval workflow.
- Nguồn: https://formbricks.com/docs/self-hosting/overview · https://formbricks.com/docs/surveys/overview · https://formbricks.com/docs/platform/introduction · https://github.com/formbricks/formbricks (packages/types/surveys/types.ts)

### 3.6. LimeSurvey (open source)

**Trạng thái nguồn: Đã kiểm chứng** (LimeSurvey Manual: Database documentation, Question types).

- **Mô hình hóa form**: **bảng quan hệ thuần**: `surveys` → `groups` (nhóm câu hỏi = trang) → `questions` (+ `question_attributes` lưu loại & cấu hình) → `answers`/`answer_l10ns` (đáp án định sẵn, đa ngôn ngữ), `labelsets`/`labels` (thang đo dùng chung), `defaultvalues`, `conditions`, `quotas`, `assessments`, `permissions`/`permissiontemplates`, `participants` (token) + `participant_attribute...`, nhiều bảng `*_l10ns` đa ngôn ngữ. **Response lưu vào bảng phẳng riêng cho từng survey** (vd `lime_survey_XXXX`), mỗi câu hỏi chiếm một cột — tài liệu xác nhận "answer is stored in a separate column in the result table".
- **Loại câu hỏi**: phong phú nhất trong các sản phẩm mở (28 nhóm, 120 trang tài liệu): Array (5/10 điểm, Yes/No/Uncertain, Increase/Same/Decrease, Array tự do, Array by column, **dual scale**, Array Numbers, Array Texts), mask questions (date, **file upload**, gender, language switch, numerical, multiple numerical, ranking, advanced ranking, text display, yes/no, **equation**), multiple choice (thường, with comments, image select, bootstrap buttons), single choice (list radio, list dropdown, list with comment, image select, 5-point), text (short/long/huge free text, multiple short text).
- **Logic điều kiện**: **ExpressionScript** — mỗi câu có **relevance equation** (biểu thức hiện/ẩn, hỗ trợ AND/OR, tính toán, piping, gán giá trị qua câu loại `equation`), validation bằng regex, mandatory, quota giới hạn số response, assessments (điểm), bảng `conditions` là cơ chế cũ đơn giản hơn.
- **Phân quyền/chia sẻ**: permission templates + users/user groups (quyền tới mức từng survey); **tokens/participants**: khảo sát đóng (chỉ người có token), registration public, **anonymous toggle** (tách token khỏi response), survey groups để tổ chức; đa ngôn ngữ first-class.
- **Xử lý responses**: bảng response phẳng per survey (dễ truy vấn SQL, nhưng **đổi cấu trúc câu hỏi phải migrate bảng**), statistics module, biểu đồ, export CSV/XLSX/SPSS/R, timings, email notification cho admin (có cả bảng `failed_emails`).
- **Tích hợp**: REST API (RemoteControl), hệ thống **plugin**, import/export cấu trúc (.lss/.lsq), webhook qua plugin, embedding.
- **Điểm mạnh**: engine khảo sát mạnh nhất mức mở (ExpressionScript, quota, token, đa ngôn ngữ, đánh giá); mô hình dữ liệu minh bạch.
- **Điểm yếu**: UX cũ; **một cột/câu hỏi** làm thêm/sửa câu hỏi của survey có response phải alter table (bài học ngược cho open-erp); nặng cho nhu cầu "form đơn giản"; không có approval.
- Nguồn: https://www.limesurvey.org/manual/Database_documentation · https://www.limesurvey.org/manual/manual/Question_types · https://www.limesurvey.org/manual/limesurvey/LimeSurvey-5.x-database-schema.html

### 3.7. Odoo Survey (Odoo 18)

**Trạng thái nguồn: Đã kiểm chứng** (3 trang docs chính thức: Surveys, Create surveys, Create questions).

- **Mô hình hóa form**: module `survey` của Odoo — `survey` record (form) có 4 **preset loại**: Survey / Live Session / Assessment / Custom; bên trong là **Questions tab** chứa **sections + questions** (drag-and-drop, question là record riêng, quản tập trung cả ở menu Questions & Answers); cấu hình survey nằm ở 4 tab: Questions / Options / Description / End Message.
- **Loại câu hỏi**: Multiple choice (chỉ 1 đáp án / nhiều đáp án), Single Line Text Box (có chế độ "Input must be an email", "Save as user nickname"), Multiple Lines Text Box, **Numerical Value**, Date, **Datetime**, **Matrix** (rows × columns). Không có loại upload file, không có rating riêng (dùng numerical/matrix). Option cho từng câu: **comments field** ("If other, please specify", comment có thể là đáp án), ảnh cho đáp án.
- **Logic điều kiện**: **Conditional Display qua Triggering Answers** (câu chỉ hiện nếu đáp án được chọn ở câu trước — không có điều kiện số học/phức hợp; **không dùng được khi bật random**), Mandatory Answer + Error Message, **Validate Entry min/max** cho numeric/date, **Randomized per Section** (bốc X câu mỗi section), Pagination (1 trang/câu, 1 trang/section, tất cả 1 trang), Allow Roaming (cho quay lại), **Survey Time Limit**.
- **Phân quyền/chia sẻ**: **Access Mode**: *Anyone with the link* hoặc *Invited people only*; **Require Login**; **Limit Attempts** (giới hạn số lần); Responsible user; share bằng link hoặc email invite (template "Survey: Invite" chỉnh được); Live Session có Session Code riêng; đóng/mở survey, bản test view.
- **Xử lý responses**: **See results** (phân tích trực quan từng câu, avg score), dashboard KPI (số câu, thời gian trung bình, số đăng ký, số hoàn thành, %passed/%certified), scoring: **No scoring / Scoring with answers after each page / at the end / without answers**, **Required Score (%)**, đáp án có điểm **âm được**; participant gắn về contact (nhập email), input text có thể "save as user email/nickname".
- **Tích hợp**: phần của ERP: **Contacts**, **eLearning** (survey gắn course, certification), Mail templates, Activities, website embed; **Is a Certification**: sinh chứng chỉ (template), email gửi chứng chỉ, **badge** trên trang contact; **Live Session**: trình chiếu câu hỏi realtime, thời gian trả lời từng câu, thưởng điểm trả lời nhanh.
- **Điểm mạnh**: bản ERP duy nhất trong danh sách: survey gắn contact/course, certification end-to-end, live session độc đáo, đa ngôn ngữ sẵn.
- **Điểm yếu**: logic rời (chỉ triggering answers), ít loại câu hỏi hơn LimeSurvey/Typeform, không upload file, không webhook ra ngoài, không phải form builder tổng quát.
- Nguồn: https://www.odoo.com/documentation/18.0/applications/marketing/surveys.html · https://www.odoo.com/documentation/18.0/applications/marketing/surveys/create.html · https://www.odoo.com/documentation/18.0/applications/marketing/surveys/questions.html · https://www.odoo.com/documentation/18.0/applications/marketing/surveys/scoring.html

### 3.8. Frappe / ERPNext Web Form

**Trạng thái nguồn: Đã kiểm chứng** (docs.frappe.io Web Form + đọc trực tiếp `frappe/website/doctype/web_form/web_form.json` trên GitHub).

- **Mô hình hóa form**: **Web Form là một DocType** (một record cấu hình, có route URL riêng). Bắt buộc có **`doc_type`** (Link tới DocType đích) — **mỗi submission sinh ra một document của DocType đó**. Trường của form nằm trong bảng con **`web_form_fields`** (Web Form Field: fieldname/fieldtype/label/reqd/options...), có nút **"Get Fields"** lấy nguyên bộ trường từ DocType; có **form builder** trực quan. `is_standard` xuất form ra file `.py/.js` trong app (đi theo source control). Định nghĩa **condition_json** (filter hiển thị record) và `dynamic_filters_json`.
- **Loại câu hỏi**: **tận dụng fieldtype của DocType** (Data, Text, Select, Date, Datetime, Int/Float/Currency, Link, Attach/Attach Image, Table, Check, Rating...): validation bắt buộc/định dạng được **server-side enforce bởi DocType**, không phải chỉ validate ở client — đây là điểm khác biệt lớn nhất so với form builder thuần.
- **Logic điều kiện**: yếu về branching (không có skip logic native); bù lại: depends_on của DocField, **client script** (JS per form), server script, và mọi rule của DocType (mandatory, validation, link query). Condition JSON dùng để lọc dữ liệu hiển thị.
- **Phân quyền/chia sẻ**: 3 chế độ truy cập rõ ràng: **public (công khai)**, **login required**, **key required** (chỉ dùng được với key từ **Web Form Request** — link riêng từng người nhận); **anonymous responses** (không ghi người submit); **apply_document_permissions** (submission tiếp tục chịu permission của DocType); cho phép **allow_edit / allow_multiple / allow_delete** sau submit; allow_print + Print Format; allow_comments; show_attachments; **allowed_embedding_domains** (whitelist embed).
- **Xử lý responses**: submission = document → hiện trong **desk list/report/workflow** như mọi document khác; respondent đăng nhập có thể xem **danh sách submissions của mình** (show_list + list_columns); success message/URL; `allow_incomplete` cho lưu nháp khi thiếu trường bắt buộc.
- **Tích hợp**: vì là document nên **tự động ăn theo mọi cơ chế của Frappe**: webhooks (doc_events), server script, notifications/email, Print Format, RazorPay/Google Drive integration, portal pages; form này chính là "form → entity" bằng thiết kế.
- **Điểm mạnh**: pattern lý tưởng cho ERP: không tạo hệ lưu trữ song song, response là entity thật, phân quyền/workflow/print/report dùng lại toàn bộ; public/anonymous/key link có sẵn.
- **Điểm yếu**: logic branching gần như không có (phải code client script), form một trang, tuỳ biến giao diện/UX hạn chế, khó làm khảo sát kiểu Typeform.
- Nguồn: https://docs.frappe.io/framework/user/en/web-form · https://github.com/frappe/frappe (frappe/website/doctype/web_form/web_form.json)

### 3.9. NocoBase (form plugin)

**Trạng thái nguồn: Đã kiểm chứng một phần** (docs chính thức về Workflow Triggers + Form Block đọc trực tiếp; chi tiết plugin approval/multi-app từ docs tổng quan).

- **Mô hình hóa form**: NocoBase tách **data model (collection = bảng + field)** khỏi **UI (page → block)**. **Form block** là block gắn một collection: **Add form** (tạo record) / **Edit form** (sửa record); field render theo schema collection, kể cả **association fields** (belongsTo/hasOne) — chọn record liên quan và **hiển thị thêm trường của record liên quan (read-only)**; hỗ trợ **Sub-form/Sub-table** (con của record), **field template** (tái sử dụng cấu hình nhóm trường), **linkage rules** (block/field linkage, event flow, JS tuỳ biến). Không có khái niệm "responses" riêng — form thuần là giao diện nhập liệu của collection.
- **Loại câu hỏi**: theo field component của collection (input, number, select, date, upload/file manager, sub-table, cascade select, picker, JS field tuỳ biến...).
- **Logic điều kiện**: **linkage rules** (điều kiện điều khiển hiển thị/bật/tắt/gán giá trị trường), **field validation rules**, và chủ yếu đẩy logic nặng sang **workflow**: trigger **"Submit" của Form block có thể bind workflow — data người dùng submit được inject vào context làm biến cho các node**.
- **Phân quyền/chia sẻ**: RBAC (role → collection/action/field-level), authentication plugin; **multi-app** (instance vật lý riêng biệt, dùng cho multi-tenant) hoặc multi-workspace; form chủ yếu phục vụ app nội bộ (kéo form ra public cần cấu hình thêm) — đánh dấu phần public **Suy luận**.
- **Xử lý responses**: dữ liệu nằm trong collection của nó → bảng/table block, filter, export (Import/Export Pro), record history; không có trang "summary khảo sát" riêng.
- **Tích hợp**: **Workflow engine là trung tâm**: triggers: **Collection Event** (create/update/delete trên collection + điều kiện), Schedule, **Before/After Action** (action interceptor — bắn khi user thao tác nút), **Custom Action**, **Approval** (plugin approval riêng), **Webhook**; nodes: Create/Update/Query/Delete Data, SQL, Condition, Loop, Parallel, **Manual Processing (kèm form block cho người xử lý)**, Approval, HTTP Request, JS, Notification/Email... — gần như một BPMN engine gắn với collection.
- **Điểm mạnh**: triết lý đúng nhất với ERP plugin: **form ↔ collection ↔ workflow**; association field; field-level permission; mở rộng bằng plugin.
- **Điểm yếu**: không có khái niệm survey public/anonymous sẵn; UX quản trị thiên về app builder, khó làm khảo sát bên ngoài; nhiều khái niệm (block/field/template/rule) cần training.
- Nguồn: https://docs.nocobase.com/workflow/triggers/ · https://docs.nocobase.com/workflow/triggers/collection · https://nocode.docs.nocobase.com/interface-builder/blocks/data-blocks/form

### 3.10. MISA AMIS (AMIS Quy trình) & Base.vn (Base Request)

**Trạng thái nguồn: Đã kiểm chứng một phần** (trang sản phẩm/tài liệu marketing chính thức của MISA và Base; không có tài liệu kỹ thuật chi tiết).

- **Mô hình hóa form**: không phải "form builder khảo sát" mà là **e-form cho đề xuất nội bộ**: Base Request tổ chức theo **nhóm đề xuất → custom form cho từng loại đề xuất** (form chứa dữ liệu có cấu trúc: mua sắm — mua gì/giá bao nhiêu/ở đâu; nghỉ phép — ngày nào/lý do/ai thay...). MISA AMIS Quy trình: **số hoá biểu mẫu + quy trình**, thiết kế quy trình kéo–thả, **thiết lập biểu mẫu theo luồng phê duyệt theo vai trò/cấp duyệt**, AI soạn thảo biểu mẫu, thư viện **500+ mẫu quy trình chuẩn**.
- **Logic điều kiện**: luồng phê duyệt là trung tâm: Base Request hỗ trợ **duyệt lần lượt / duyệt đồng thời / chỉ cần một người duyệt**; MISA: nhiều bước, nhiều cấp, **xử lý song song**, AI cảnh báo điểm nghẽn.
- **Phân quyền/chia sẻ**: nội bộ doanh nghiệp theo cấu trúc đơn vị/phòng ban; quyền **tạo đề xuất** được phân theo nhóm — "đề xuất nào nhân viên được tạo thì mới hiện nút tạo"; duyệt trên **mobile**.
- **Xử lý responses** (= đề xuất): trạng thái rõ ràng (đang chờ/đã duyệt/từ chối), theo dõi "đề xuất của tôi", **mẫu in tuỳ chỉnh**: upload file `.docx` với placeholder, **hệ thống tự điền dữ liệu custom form vào mẫu sau khi duyệt** để văn bản hoá (Base); MISA: lưu vết lịch sử xử lý + **phiên bản quy trình**, dashboard tiến độ realtime, thống kê theo phòng ban, ký số trong quy trình.
- **Tích hợp**: cả hai gắn vào **hệ sinh thái module** của chính hãng (MISA: kế toán, nhân sự, văn thư, ký số...; Base: CRM, HRM, phân quyền, thông báo); dữ liệu đề xuất sau duyệt chuyển tiếp sang module nghiệp vụ.
- **Điểm mạnh / điểm yếu**: mạnh về approval + văn bản hoá + mobile, đúng "văn hoá duyệt" DN Việt; yếu về logic khảo sát, đa dạng loại câu hỏi, khảo sát public bên ngoài — không phải mục tiêu của chúng.
- Nguồn: https://amis.misa.vn/amis-quy-trinh/ · https://resources.base.vn/productivity/phuong-phap-quan-tri-cua-base-request-mot-he-thong-phe-duyet-de-xuat-giup-gi-cho-doanh-nghiep/ · https://resources.base.vn/productivity/gioi-thieu-base-request-phan-mem-quan-ly-de-xuat-dang-bieu-mau-dien-tu-e-form-649/

## 4. Bài học cho plugin form builder của Open-ERP

Bối cảnh áp dụng: backend **Quarkus Java + PostgreSQL** multi-tenant, frontend **Angular 22 + Ionic 8**, plugin độc lập (catalog, organization, employee...), đã có: RBAC + data scope theo tenant/organization/branch, approval flow (employee plugin), notification service, file storage có **signed URL + quét ClamAV**, Entity Registry cho plugin đăng ký entity. Form cần: (a) liên kết entity plugin khác qua Entity Registry, (b) public cho người ngoài tenant, (c) response phân quyền theo tenant.

### 4.1. Hai chế độ form: "survey tự do" và "form gắn entity" — thiết kế chung một lõi

- *Bằng chứng*: Frappe (submission = document của DocType) và NocoBase (form block = UI nhập của collection) là hai cực "gắn entity"; Google/Typeform/Formbricks là cực "survey tự do, response riêng". Không sản phẩm nào làm tốt cả hai nếu chỉ chọn một mô hình.
- *Khuyến nghị*: một lõi form (sections + questions + logic) với **field mapping tuỳ chọn**: câu hỏi có thể map tới trường của entity đã đăng ký trong Entity Registry. Có mapping → ghi vào entity (qua API/repository plugin kia, hưởng validation của entity đó); không mapping → lưu response JSON riêng. Tránh hai codebase hai mô hình.

### 4.2. Lưu response dạng "header + JSON answers", tuyệt đối không tạo cột phẳng per survey

- *Bằng chứng*: LimeSurvey tạo bảng phẳng `lime_survey_XXXX` mỗi câu một cột — thêm/sửa câu hỏi phải migrate bảng, đau khi đã có dữ liệu. Google/Formbricks/JotForm đều dùng JSON/response records.
- *Khuyến nghị*: `form_responses (id, tenant_id, form_id, form_version, submitted_at, submitted_by_user_id, responder_email, status, ...)` + answers trong **JSONB** (hoặc bảng con `form_response_answers`) — truy vấn theo tenant + form, flatten chỉ lúc export/report. Lưu **form_version** ở từng response vì form sẽ thay đổi sau khi có dữ liệu.

### 4.3. Question ID ổn định (`ref`) là hợp đồng tích hợp

- *Bằng chứng*: Typeform bắt buộc `ref` ổn định do dev đặt; Formbricks dùng id + validator chặt (không khoảng trắng, có quy tắc đặt tên), logic và webhook đều tham chiếu id.
- *Khuyến nghị*: mỗi question có `ref` do người tạo đặt (hoặc sinh tự động, không đổi), dùng cho: logic, export CSV (tên cột), webhook payload, mapping entity. Đổi ref chỉ cho phép khi form chưa có response.

### 4.4. Logic engine: điều kiện tham chiếu tới phía trước, validate chu trình, operator bó theo loại câu hỏi

- *Bằng chứng*: Typeform (jump per option + operator per field type, "first matching condition wins", không nhảy về câu chưa đi); Formbricks (schema validate operator hợp lệ theo type + **cyclic logic detection** + logicFallback); Microsoft (chỉ branch tiến tới trước, vì lý do UX); Odoo (triggering answers, tắt khi random).
- *Khuyến nghị*: v1 chọn mô hình Formbricks: điều kiện per question với **operator riêng theo loại câu hỏi**, chỉ tham chiếu câu hỏi phía trước, server-side validate (kể cả vòng lặp), mỗi option của choice được phép nhảy tới section/câu/end-form. Không cần expression DSL full (LimeSurvey ExpressionScript) trong v1 — để sau nếu có nhu cầu tính điểm phức hợp.

### 4.5. Section là item đặc biệt của form, không nên tách bảng phức tạp

- *Bằng chứng*: Google coi section = `pageBreakItem` trong items; Odoo dùng section trộn lẫn questions trong 1 tab; Typeform/Formbricks dùng "block/screen" chứa elements; LimeSurvey tách hẳn bảng `groups` (kèm bảng `group_l10ns`).
- *Khuyến nghị*: giữ cấu trúc form như **một document JSON có thứ tự** (items array) + section là item có title/description/page-break; API ghi form qua batch update có `revisionId` (học Google) để chống ghi đè lost-update khi hai admin cùng sửa.

### 4.6. Public form cho người ngoài tenant: tách "responder" khỏi "user" từ đầu

- *Bằng chứng*: Google (collaborator ≠ responder; email collection VERIFIED/RESPONDER_INPUT/DO_NOT_COLLECT; link có hạn dùng); Frappe (public / login / **key_required qua Web Form Request** / **anonymous**); Odoo (Access Mode: anyone-with-link vs invited; Require Login; Limit Attempts); Formbricks (**singleUse + mã hoá + PIN**, email verification, reCAPTCHA, anonymize ngay lúc ingest); LimeSurvey (token + anonymous toggle).
- *Khuyến nghị*: response có `responder_email` (nhập tay) **tách khỏi** `submitted_by_user_id` (nullable — chỉ có khi người điền là member tenant). 3 chế độ truy cập: anonymous / phải đăng nhập / **single-use link** (sinh token một lần dùng, revoke được — đủ thay PIN cho v1). Public form phải chạy ở route công khai không cần cookie phiên tenant; chống lạm dụng: rate limit + reCAPTCHA tuỳ chọn; tuỳ chọn ẩn danh hoá (không lưu IP) ngay lúc ghi.

### 4.7. Phân quyền response theo tenant: survey-level + record-level, tái sử dụng data scope hiện có

- *Bằng chứng*: Formbricks `visibility: workspace | restricted (owner + org managers)`; Frappe `apply_document_permissions`; Google (2026) granular responder access; LimeSurvey permission templates tới từng survey.
- *Khuyến nghị*: hai lớp: (1) quyền **quản form** (plugin RBAC: form.manage / form.view_responses / response.export) và (2) quyền **response là record** — đi qua data scope tenant/organization/branch như employee plugin đã làm (response có thể gắn organization/branch để lọc). Response của người ngoài tenant KHÔNG tự động tạo tài khoản/tenant member nào cả.

### 4.8. File upload: dùng lại storage platform (signed URL + virus scan), đặt giới hạn theo câu hỏi

- *Bằng chứng*: Google (file upload lưu thư mục Drive riêng của form; có types/maxFiles/maxFileSize); Formbricks (allowedFileExtensions, maxSizeInMB, storage S3-compatible); Frappe (max_attachment_size); open-erp employee đã có signed URL download + ClamAV scan.
- *Khuyến nghị*: câu hỏi type `file` giữ {allowedExtensions, maxFiles, maxSizeMB}; upload qua storage service của platform (không lưu blob trong DB), quét virus bắt buộc, link trả về cho public responder là **signed URL ngắn hạn**; xoá response không tự xoá file → cần job dọn (Google cũng ghi chú "deleting responses does not delete attached files").

### 4.9. Quiz/scoring là chế độ của form, không phải loại form khác; certification để sau

- *Bằng chứng*: Google `isQuiz` + `Grading` per question (đáp án đúng, điểm, feedback khi đúng/sai, shuffle); Odoo 4 preset + scoring + Required Score % + certificate/badge.
- *Khuyến nghị*: thêm flag `is_quiz` + grading JSON per question (điểm, correct answers, feedback) và tổng điểm khi submit; chứng chỉ/email chứng chỉ chỉ làm khi có business case (e-learning) — không dựng trước.

### 4.10. Tích hợp 3 lớp: event outbox → webhook → trigger approval flow + entity mapping

- *Bằng chứng*: Typeform/JotForm (webhook per form); Google (API watches — push); NocoBase (submit button bind workflow, data vào context); Frappe (document → webhooks/automation); Formbricks (webhook + response pipeline job).
- *Khuyến nghị*: khi response submit → phát event `form.response.submitted` qua **outbox** (pattern platform đã có): (a) **webhook** ra ngoài (URL + secret, retry), (b) **trigger approval flow có sẵn** (không tự dựng engine duyệt trong plugin form), (c) **ghi vào entity** qua Entity Registry mapping. Đăng ký webhook theo form, payload dùng question `ref`.

### 4.11. Approval sau submit là kỳ vọng mặc định ở thị trường VN — gắn vào flow có sẵn, kèm mẫu in

- *Bằng chứng*: Jotform Workflows (approval element, multi-step/parallel/group, mobile duyệt); Base.vn (duyệt lần lượt/đồng thời, **mẫu in .docx tự điền sau duyệt**); MISA AMIS (quy trình kéo–thả, ký số mobile, lưu vết phiên bản).
- *Khuyến nghị*: sau submit, đề xuất dạng form phải vào được quy trình duyệt nhiều cấp của platform (mới/lần lượt/đồng thời), duyệt trên mobile (Ionic đã có), và **có print template** sinh văn bản từ response (placeholder theo question ref) — tính năng nhỏ, giá trị cảm nhận lớn với khách VN.

### 4.12. Response UX tối thiểu phải có từ ngày đầu: bảng + summary + CSV + notification

- *Bằng chứng*: Google (Summary/Individual + CSV + Sheets + email notification + close date/response limit); Odoo (dashboard KPI + See results); Formbricks (response table + dashboards + CSV/XLSX); LimeSurvey (statistics + export đa định dạng).
- *Khuyến nghị*: v1 gồm: (1) bảng response filter theo tenant/form/khoảng thời gian, (2) summary per question (count với choice, avg với rating/number), (3) **export CSV** (cột theo ref), (4) **email/notification cho chủ form khi có response** (tuỳ bật), (5) mở/đóng thu response + thông báo đóng. Đừng trì hoãn 5 thứ này — mọi benchmark đều coi là tính năng nền, người dùng đo form builder bằng nó.

## 5. Khoảng trống cần kiểm chứng thêm (khi triển khai)

- API Microsoft Forms qua Microsoft Graph (đọc response, tạo form) — hiện đánh dấu Suy luận, cần thử thực tế nếu cần tích hợp M365.
- Hành vi public form của NocoBase (share link ra ngoài, anonymous submit) — docs chưa xác nhận, cần chạy thử instance.
- Chi tiết gói/licence Formbricks EE (feature nào khoá) nếu cân nhắc làm chuẩn tham chiếu mã nguồn.
- Giới hạn kích thước/lượng response thực tế của từng sản phẩm khi so sánh SLA (Google công bố 500k/1GB từ 9/2026; các sản phẩm khác chưa công bố tương đương).
