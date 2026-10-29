# [BUG-156] Mobile catalog hiển thị raw i18n key (`COMMON_ACTIONS`, `COMMON_TOTAL_ITEMS`, …)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-156 / Bug i18n / Sprint 06 |
| Mức độ / trạng thái | **Medium** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-19](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-420](TASK-420_catalog_web_component_migration.md), `plugins/catalog/web`, `src/frontend/mobile/public/i18n` |

## 1. Mô tả

Trên mobile catalog (`/settings/catalog`), một số nhãn hiển thị nguyên key thay vì bản dịch:

- Header bảng: `COMMON_ACTIONS` (desktop: “THAO TÁC”).
- Footer phân trang: `COMMON_TOTAL_ITEMS`, `COMMON_PREV`, `COMMON_PAGE_OF`, `COMMON_NEXT_PAGE`.

Nguyên nhân: plugin catalog dùng các key dùng chung của host; dictionary mobile (`920 keys`) không có các key này, trong khi web có (`COMMON_ACTIONS` tại `src/frontend/web/public/i18n/vi.json:247`). `npm run i18n:check` chỉ so parity trong từng app nên không phát hiện key thiếu ở biên plugin ↔ host.

## 2. Các bước tái hiện

1. Đăng nhập Ionic 390×844, mở `/settings/catalog`.
2. Chọn loại **Xã/Phường**.
3. Quan sát header bảng và footer phân trang.

**Mong muốn:** “Thao tác”, “Tổng … bản ghi”, “Trước”, “Trang … / …”, “Sau”.
**Thực tế:** raw key `COMMON_*`.

## 3. Bằng chứng

- [Ảnh mobile catalog](../08_testing/evidence/sprint_06/13_mobile_catalog_readonly_390.png)
- [Số đo DOM](../08_testing/evidence/sprint_06/mobile-catalog-measure.json): `document.querySelector('op-catalog-app').innerText` chứa `COMMON_ACTIONS`, `COMMON_TOTAL_ITEMS`, `COMMON_PREV`, `COMMON_PAGE_OF`, `COMMON_NEXT_PAGE`.

## 4. Hướng sửa đề xuất

- Bổ sung các key `COMMON_*` đang dùng vào dictionary mobile (vi/en + các ngôn ngữ còn lại) hoặc để plugin tự fallback sang dictionary riêng.
- Mở rộng `i18n:check` kiểm tra các key shared mà plugin WC sử dụng trên cả host web/mobile.

## 5. Cách sửa & kiểm chứng

- Bổ sung `COMMON_ACTIONS`, `COMMON_TOTAL_ITEMS`, `COMMON_PREV`, `COMMON_PAGE_OF`, `COMMON_NEXT_PAGE` cho 13 locale mobile; parity 100%.
- **Kiểm chứng:** mobile catalog không còn `COMMON_*`; ảnh `evidence/sprint_06_retest/14_mobile_catalog_fixed.png`.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA browser 390×844 | TR-S06-001 / TASK-423 |
| 0.2 | 2026-10-29 | Bổ sung i18n mobile; QA re-test PASS | Developer/QA |
