# [BUG-160] Generated CRUD plugin không chạy end-to-end (bundle thiếu migration, web 500, tenant_id, API 401)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-160 / Bug tích hợp / Sprint 06 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-05](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-412](TASK-412_cli_generate_crud_angular_java.md), `tools/open-erp-cli`, `PluginImageBuilder`, `PluginQueryCompiler` |

## 1. Mô tả

Trong lúc QA AC-05, plugin sinh bằng `create → generate entity → generate crud → package` cài được nhưng không chạy màn CRUD. Chuỗi lỗi:

1. `bundle.zip` không chứa file migration → `PLUGIN_DATA_MIGRATION_FILE_MISSING`.
2. Bundle image đặt web ở `/app/static` nhưng runtime không phục vụ → `GET /main.js` trả 500.
3. Data gateway từ chối entity tenant-scope không có cột `tenant_id` → `PLUGIN_DATA_QUERY_INVALID`.
4. Plugin web gọi API tương đối về Core origin thiếu plugin cookie/token → 401.
5. Core host chọn screen đầu tiên theo `plugin_key`, không phân biệt route con `/apps/<key>/<screen>`.

## 2. Cách sửa

- CLI `package`: đưa toàn bộ `migrations/*` vào root `bundle.zip`, thêm regression test.
- `PluginImageBuilder`: stage JDK repack `static/**` vào `META-INF/resources` của app.jar; SDK thêm `PluginUiResource` fallback đọc resource.
- `PluginQueryCompiler`: cho phép entity tenant-scope không có `tenant_id` khi schema đã là ranh giới cô lập; chỉ thêm predicate khi cột tồn tại.
- `PluginWebComponentLoader`: dùng `API_BASE_URL` cho manifest/session/entry và gắn `plugin_token` đúng; plugin nhận `apiBaseUrl` + `authHeaderInterceptor`.
- `PluginScreenHostComponent`: match route Core `/settings/apps/...` với manifest `/apps/...`, ưu tiên exact rồi prefix dài nhất.
- CLI generator CRUD: service/component nhận `apiBaseUrl`; template `plugin-main.ts` gắn auth interceptor.

## 3. Kiểm chứng

- Plugin `qa-crud` 1.0.6: install ACTIVE, `GET main.js` 200, `GET invoices` 200.
- Browser desktop: list rỗng → mở drawer → lưu `QA-INV-001` → dòng xuất hiện; 0 console error.
- Ảnh: `08_testing/evidence/sprint_06_retest/08_qa_crud_invoice_fixed.png`.
- Backend: `PluginDataGatewayTest` 18/18 PASS; CLI 11/11 PASS.
- Fixture đã gỡ sau test (uninstall + revoke + delete catalog).

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA AC-05 end-to-end | TR-S06-001 1.2 |
| 0.2 | 2026-10-29 | Fixed toàn bộ chuỗi; QA re-test PASS | Developer/QA |
