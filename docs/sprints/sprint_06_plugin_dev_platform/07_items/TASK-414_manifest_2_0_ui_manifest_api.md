# [TASK-414] Manifest 2.0 + UI Manifest API

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-414 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — DTO/API + validate manifest 2.0 + endpoints CLI; tests PASS / 0.3 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Mở rộng manifest/DTO/API UI Manifest với screen/contribution/slot mới; giữ 4 khuôn mẫu response.

## 2. Việc phải làm

- [x] Thêm `id`, `tagName`, `exposedModule`, `platforms`, `readOnly`, `contractVersion` vào DTO/ResponseKey.
- [x] Validate manifest 2.0: field/relation/slot/render mode; từ chối IFRAME.
- [x] API `/ui-manifest` trả slots/contributions đầy đủ; lọc ACTIVE/quyền/platform.
- [x] Thêm endpoint entity-registry/ui-slots cho CLI `--core-url`.
- [x] Test backend cho manifest/API/contract (targeted PASS).

## 3. Tiêu chí nghiệm thu

- API trả đủ field mới; response đúng 4 khuôn mẫu.
- Manifest IFRAME bị từ chối với mã lỗi rõ.
- Test slot/contribution/permission/lifecycle PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: Design review PASS
- Write scope: `src/backend/src/main/java/com/vn9melody/openerp/modules/plugin/**`, `src/backend/src/main/resources/**`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
