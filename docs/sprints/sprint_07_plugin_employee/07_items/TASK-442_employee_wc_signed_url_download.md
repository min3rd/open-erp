# [TASK-442] WC tải tài liệu qua signed URL (thay blob + JWT)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-442 / Task / Sprint 07 |
| Severity / trạng thái | Medium / **Done (QA)** — WC desktop tải tài liệu qua signed URL PASS (HR + self), 0 console error |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [REV-S07-001 1.1](../09_review/01_REV-S07-001_sprint_07_dod_review.md) mục 4; chỉ đạo chủ dự án 2026-11-02 |
| depends_on / blocks / parent | TASK-433 / — / [FEAT-37](FEAT-37_employee_plugin_core.md) |
| Write scope / baseline | `plugins/employee/web/**`, `plugins/employee/plugin.json`, `plugins/employee/src/main/resources/META-INF/resources/**`; working tree |

## 1. Mục tiêu

Hạng mục deferred của Sprint 07 (REV-S07-001 mục 4): WC hiện tải tài liệu bằng blob + JWT
(`GET /documents/{id}/download` với Bearer). Chuyển sang **signed URL ngắn hạn** đã có ở TASK-433 0.3:
WC gọi `POST /documents/{id}/signed-url` (hoặc nhánh `/me/...` cho self-service), nhận
`{ document_id, url, expires_at }` và mở link `GET /signed-documents/{id}?exp&sig&tenant_id`
không cần Bearer — giảm tải giữa trên API có auth, bỏ JWT khỏi stream tải file.

## 2. Thao tác

- [x] Thêm type `SignedUrlResponse` vào `employee.model.ts`.
- [x] Service: `documentSignedUrl`/`myDocumentSignedUrl` gọi endpoint signed-url; `resolveSignedUrl`
      prefix origin runtime cho URL tương đối (absolute URL giữ nguyên); xóa 2 hàm tải blob.
- [x] Component: `downloadDocument`/`downloadMyDocument` lấy signed URL rồi trigger download bằng
      anchor (`download` attribute, `rel="noopener"`); lỗi hiển thị qua `actionError` như cũ.
- [x] Build bundle `ng build employee-plugin` PASS → `META-INF/resources` (main.js 452 kB); bump plugin 1.1.23.
- [x] Runtime browser: package/publish/upgrade plugin 1.1.23 tenant QA mới (9 bước lifecycle ACTIVE),
      desktop ≥1280px tải tài liệu HR + self-service qua signed URL; 0 console error.

## 3. Tiêu chí & kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Bundle build | **Pass** | `ng build employee-plugin` complete 2026-11-02 |
| Signed URL API (nền tảng) | **Pass** | TASK-433 0.3; TR-S07-001 mục 2.6 E2E 9/9 |
| Plugin 1.1.23 package/publish/upgrade | **Pass** | `PLUGIN_INSTALL_SUCCESS status=ACTIVE` 9 bước (PRE_FLIGHT…ACTIVATE) tenant QA `s7-signed-mvv02` |
| Runtime WC download (HR) | **Pass** | Browser: `POST /documents/{id}/signed-url` 200 → `GET /signed-documents/{id}?exp&sig&tenant_id` (Document) 200 mở PDF viewer, không Bearer |
| Runtime WC download (self) | **Pass** | Browser: `POST /me/documents/{id}/signed-url` 200 → signed download 200 |
| Console | **0 error** | Chỉ vite debug + Angular dev mode log |
| Ảnh minh chứng | — | [wc_self_signed_url_download.png](../08_testing/evidence/s07_qa_signed_url/wc_self_signed_url_download.png), [wc_hr_documents_before_download.png](../08_testing/evidence/s07_qa_signed_url/wc_hr_documents_before_download.png) |

Lưu ý: CSV export nhân viên và DSAR export JSON vẫn đi qua API có auth (không thuộc phạm vi deferred).
Ghi chú môi trường: chuyển tab giữa các màn plugin trong web dev Vite đôi khi remount iframe lỗi —
không liên quan thay đổi này (chỉ đổi handler download); full reload hoạt động chuẩn, đã có ở các lần QA trước.

## 4. Bàn giao

- Files: `plugins/employee/web/src/app/employee.{model,service,screen.component}.ts`, bundle rebuild,
  `plugin.json` 1.1.23, DES-API 1.1 mục 4.4, plugin README (bỏ ghi chú stale "no signed-URL provider").
- Chưa chạy: không còn. Handoff QA đã hoàn tất trên app thật (Docker dev, backend 8088 + web 4200).

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo item theo chỉ đạo chủ dự án; implement WC + build PASS | Developer; working tree |
| 1.0 | 2026-11-02 | Runtime QA PASS cả 2 nhánh HR/self, 0 console error; Done (QA) | QA; app thật + network log |
