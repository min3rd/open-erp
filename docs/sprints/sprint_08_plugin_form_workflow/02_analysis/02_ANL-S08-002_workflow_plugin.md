# [ANL-S08-002] Phân tích yêu cầu: Plugin Workflow (tạo & xử lý công việc theo luồng)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S08-002 / Phân tích / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) (R2), [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) |
| Đọc trước / đọc tiếp | [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 04 CONF (chưa soạn) |

## 1. Vấn đề và phạm vi tài liệu

Plugin workflow trả lời câu hỏi: **tenant có thể tự định nghĩa luồng xử lý công việc (các bước, ai làm, điều kiện đi tiếp) — hệ thống tự chạy luồng, đưa việc đến đúng người đúng lúc, và mọi bước được ghi vết không?**

Tài liệu này phân tích R2 từ [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md); đối chiếu đối thủ chi tiết tại [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) (Odoo, Frappe, Camunda, Temporal, n8n, NocoBase, Flowable, Base.vn/MISA/1Office).

## 2. User Stories đề xuất

| US | Nội dung | Đối chuẩn tham chiếu |
| :--- | :--- | :--- |
| US-W01 | **Là Tenant Admin, tôi thiết kế workflow bằng builder trực quan** (thêm bước tuần tự, đặt tên, mô tả) để số hoá quy trình của công ty | MISA kéo-thả, NocoBase |
| US-W02 | **Là người thiết kế, tôi thêm bước phê duyệt** với người duyệt theo: user cụ thể / RBAC role / **quản lý trực tiếp của người tạo** / vị trí-chức danh, và chọn chế độ: 1 người duyệt là qua / đủ tất cả / tỉ lệ vote | NocoBase Approval (anyone/countersign/vote), MISA |
| US-W03 | **Là người thiết kế, tôi thêm điều kiện rẽ nhánh** theo dữ liệu (field – phép toán – giá trị, VÀ/HOẶC) để luồng tự chọn tuyến | Base.vn cây điều kiện, Frappe condition |
| US-W04 | **Là người thiết kế, tôi thêm bước tự động** (gọi API/webhook ra ngoài, cập nhật dữ liệu) xen giữa các bước con người | n8n, NocoBase HTTP node |
| US-W05 | **Là người thiết kế, tôi đặt hạn xử lý từng bước** (khoảng thời gian hoặc lấy từ trường dữ liệu), kèm nhắc trước hạn và escalation sau hạn | MISA (hạn + nhắc + báo cáo quá hạn), Flowable timer boundary |
| US-W06 | **Là Tenant Admin, tôi phát hành workflow phiên bản mới** mà không làm hỏng instance đang chạy theo phiên bản cũ | Flowable/Camunda versioning, NocoBase Version Management |
| US-W07 | **Là hệ thống/plugin khác, tôi trigger instance khi entity thay đổi** (created/updated/status_changed qua Entity Registry/event) — ví dụ response form mới → chạy luồng duyệt đề xuất | NocoBase Collection Event, Base Process sự kiện chuẩn |
| US-W08 | **Là người dùng, tôi xem "Việc của tôi"** (task inbox): việc chờ tôi xử lý, quá hạn, theo luồng; mở được bối cảnh (entity/form gây ra việc) ngay trong màn xử lý | NocoBase To-do, Camunda Tasklist, Flowable TaskService |
| US-W09 | **Là người xử lý, tôi Đồng ý / Từ chối (bắt buộc lý do) / Trả về bước chỉ định / Reassign** đúng quyền của mình, kèm comment | MISA (Trả về/Chuyển tiếp), NocoBase (Return/Reassign) |
| US-W10 | **Là người tạo đề xuất, tôi theo dõi tiến trình luồng của mình** (bước nào xong, đang chờ ai, bị trả về vì sao) | Base.vn trạng thái minh bạch |
| US-W11 | **Là Tenant Admin, tôi xem báo cáo luồng**: số instance theo trạng thái, việc quá hạn, thời gian duyệt trung bình | MISA dashboard |
| US-W12 | **Là Tenant Admin, tôi cấu hình người liên quan (CC)** nhận thông báo khi luồng chạy tới/bỏ qua bước | MISA người liên quan |
| US-W13 | **Là hệ thống, tôi ghi event log mọi thao tác** (duyệt, trả về, reassign, timer, auto-action) append-only đủ để vẽ lại luồng đã đi và audit | Temporal/n8n/Flowable history |

## 3. Ranh giới scope đề xuất (chờ CONF duyệt)

**In-Scope đề xuất (v1):** definition (JSON, version, Draft/Published/Archived); instance pin version; node: start/approval/task (xử lý có form)/condition/parallel đơn giản/auto-action (webhook + cập nhật entity)/CC; assignment 5 kiểu (USER/ROLE/MANAGER_OF/FIELD_REF/QUERY); hành động Đồng ý/Từ chối/Trả về/Reassign; due date + reminder + escalation + báo cáo quá hạn; task inbox Web + Mobile; event log append-only; trigger qua Entity Registry event + trigger thủ công + API nội bộ.

**Out-of-Scope đề xuất (làm sau):** BPMN editor vẽ đồ thị tự do; sub-workflow/call activity; timer phức tạp kiểu BPMN (boundary interrupting/non-interrupting đầy đủ — v1 làm deadline/reminder theo node); message correlation; chữ ký số; integration marketplace; dry-run/test luồng trong UI.

**Out-of-Scope tuyệt đối:** luồng chạy thiếu tenant context; định nghĩa luồng sửa tay trong DB; người tạo tự duyệt đề xuất của chính mình (trừ khi được cấp quyền riêng có audit).

## 4. Quy tắc nghiệp vụ đề xuất

| BR | Quy tắc | Nguồn bài học |
| :--- | :--- | :--- |
| BR-W01 | Definition và instance tách bạch; instance pin `definition_version`; sửa luồng = version mới, không đổi hành vi instance đang chạy | BENCH §3.1 |
| BR-W02 | Chỉ bản PUBLISHED mới được khởi tạo instance; nháp không chạy | MISA phát hành |
| BR-W03 | Node là enum chuẩn (APPROVAL, TASK, CONDITION, PARALLEL, AUTO_WEBHOOK, AUTO_ENTITY_UPDATE, CC, START, END); thêm loại node sau không phá schema | NocoBase node-as-plugin |
| BR-W04 | Assignment resolve lúc node kích hoạt; candidate pool cho phép claim; reassign/return có scope + audit | Flowable expression, NocoBase, BENCH §3.5 |
| BR-W05 | Từ chối bắt buộc lý do; Trả về chỉ về bước đã đi qua; đã duyệt không thu hồi (nếu cần thu hồi → hành động riêng có ghi vết) | Base.vn, sprint 07 request model |
| BR-W06 | Quá hạn vẫn xử lý được nhưng ghi dấu `overdue` vào task/instance để báo cáo — không khoá việc | MISA quá hạn, BENCH §3.6 |
| BR-W07 | Timer/scheduler phải idempotent và chạy trong tenant context đã xác thực; reminder là timer non-interrupting, timeout-escalation là tuỳ chọn riêng | BENCH §3.6, §3.8 |
| BR-W08 | Điều kiện rẽ nhánh là expression DSL nhỏ (so sánh, AND/OR, hàm tiện ích) trên context chuẩn (entity snapshot, initiator, vars); UI dựng dạng chọn field–phép toán–giá trị; log kết quả đánh giá | Base.vn, BENCH §3.9 |
| BR-W09 | Mọi thay đổi trạng thái instance/task ghi event append-only (actor, thời điểm, trước/sau, comment); thao tác hệ thống actor=SYSTEM | BENCH §3.7 |
| BR-W10 | Trigger đăng ký theo (plugin, entity, event) từ Entity Registry; payload = snapshot + actor + tenant; event phải idempotent (chống trigger nhân bản) | BENCH §3.2, §3.10 |
| BR-W11 | Task duy nhất đổ về một inbox chung; task của node phải mở được bối cảnh gốc (form response, entity) mà không cần rời màn (Drawer/Split-view) | BENCH §3.4; anti-modal guardrails |
| BR-W12 | Chặn self-approval mặc định (initiator không duyệt chính mình) trừ khi cấu hình bật và có audit | BENCH §3.5, thực tiễn duyệt |

## 5. Quan hệ với luồng duyệt có sẵn của employee plugin (Sprint 07)

Sprint 07 đã dựng **approval config riêng** trong plugin employee (đề xuất cập nhật hồ sơ, luồng 2 bước, sơ đồ node). Khi plugin workflow ra đời, cần quyết định kiến trúc:

- **Phương án A** — employee giữ luồng riêng: hai hệ duyệt song song, người dùng học 2 nơi, không khuyến khích.
- **Phương án B** — workflow plugin trở thành **engine dùng chung**; employee plugin sau này đăng ký luồng duyệt của mình trên engine (migration hoãn sprint sau, giữ vận hành hiện tại).
- **Phương án C** — migrate ngay trong Sprint 08: giá trị nhất quán cao nhưng rủi ro lớn (employee đang chạy production, 254/254 test).

Đề xuất BA: **Phương án B** — Sprint 08 không đụng employee; CONF cần khách chốt.

## 6. Edge case chính

1. Approver vắng mặt dài ngày → reassign/delegation có audit; không tự đổi quyền RBAC.
2. Luồng đang chờ duyệt thì entity gốc bị xoá/sửa → policy: khoá xoá khi có instance active, hoặc lưu snapshot và cảnh báo.
3. Hai instance cùng trigger từ 1 event (retry) → idempotency key.
4. Manager-of trỏ tới người đã nghỉ → resolve fail → policy fallback (đi lên cây quản lý / quản lý tenant / đánh dấu chờ).
5. Parallel branch một nhánh fail → policy tổng thể (đợi cả hai / hủy sớm) phải cấu hình được.
6. Đổi role/posối các assignment giữa lúc instance chờ → re-resolve lúc duyệt.
7. Nhiều luồng cùng đăng ký 1 entity event → mọi luồng chạy độc lập, không ràng buộc thứ tự.

## 7. Câu hỏi cần khách xác nhận

1. V1 có cần **bước song song** không, hay tuần tự + điều kiện là đủ? (US-W03, §3)
2. Phương án A/B/C ở §5 — employee luồng duyệt giữ riêng hay quy về engine chung?
3. Auto-action v1 gồm những gì: webhook ra ngoài, cập nhật entity, cả hai?
4. SLA/escalation (US-W05) bắt buộc v1? Escalation đi tới đâu (nhắc lại / chuyển quản lý)?
5. Chế độ duyệt nào cần: 1 người / tất cả / tỉ lệ vote? (US-W02)
6. Webhook/API ngoài khởi tạo luồng có cần v1 không? (RAW Q9)
7. Mobile Ionic: xử lý việc (duyệt/trả về) là đủ, hay cần cả thiết kế luồng?
8. Chữ ký số: xác nhận để sau Sprint 08? (RAW Q12)
9. Báo cáo luồng (US-W11) cần mức nào ở v1?

> Danh sách này dẫn sang [00_READING_GUIDE](../00_READING_GUIDE.md) bước 04 — CONF-S08-001 (chưa soạn) sẽ xin duyệt chính thức.
