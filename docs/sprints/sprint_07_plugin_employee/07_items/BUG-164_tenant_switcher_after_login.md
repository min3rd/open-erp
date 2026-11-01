# [BUG-164] Tenant switcher không hiện sau login / chọn sai tenant

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-164 / Bug UI / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-438](TASK-438_plugin_context_user_menu_switcher.md), AC-33/34/35 |

## 1. Mô tả

Sau khi user thuộc 2 tenant đăng nhập/chọn tenant, user menu không hiển thị `TenantSwitcherComponent`. Khi mở được (sau reload), trigger hiển thị `—` thay vì tenant hiện tại; chọn tenant gửi `undefined`.

Nguyên nhân:
1. `AuthService.setSession()` không gọi `refreshTenants()`, nên danh sách tenant vẫn rỗng sau login (constructor chỉ chạy lúc app khởi động).
2. `refreshTenants()` gán thẳng item API (`tenant_id`/`tenant_name`) vào `TenantSwitcherItem` (`id`/`name`), sai shape.

## 2. Cách sửa

- Gọi `refreshTenants()` cuối `setSession()`.
- Map API item sang `{ id, name, slug, role, is_default }`.

## 3. Kiểm chứng

- Browser app thật: login → chọn tenant → user menu hiện switcher đúng tên.
- Switch sang tenant 2 → `localStorage.openerp_user.tenant_id` đổi đúng; switch lại tenant 1 PASS.
- 0 console error. Ảnh: `08_testing/evidence/s07_qa_real/desktop_tenant_switcher.png`.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA app thật phát hiện switcher thiếu/sai shape | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Fix refresh + mapping; retest 2 chiều PASS | Developer/QA |
