# [BUG-133] 32 key `PERM_*` thiếu trong từ điển ⇒ ma trận quyền lộ key thô (vi phạm AC-14)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-133 / Bug / Sprint 04 |
| Severity / trạng thái | High / **Resolved** (2026-10-05) — chờ QA xác nhận |
| Owner/agent / reviewer | Developer (agent) / QA người |
| Nguồn | QA tự động TC-15 (đếm key thô `PERM_*` trong DOM) |
| depends_on / blocks / parent | TASK-368, TASK-370 / — / [FEAT-29](FEAT-29_multilanguage_i18n_expansion.md) |

## 1. Hiện tượng
Ma trận quyền (`role-matrix`) hiển thị mô tả quyền bằng `permission.description_key | translate`. Backend seed 32 `description_key` dạng `PERM_CORE_*`/`PERM_E2E_*` nhưng **chưa từng có key nào trong từ điển**, nên pipe rơi về chính key ⇒ người dùng thấy `PERM_CORE_ORGANIZATION_MANAGE` (vi phạm AC-14 "không lộ key thô"). Parity check không bắt được vì key thiếu ở **mọi** locale, kể cả `en`.

## 2. Cách sửa
Sinh 32 key × 13 locale web theo cấu trúc `PERM_<PLUGIN>_<RESOURCE>_<ACTION>`: một bảng **động từ** (mẫu câu theo ngôn ngữ, có thứ tự từ phù hợp ja/ko/zh/ru) + bảng **danh từ** (audit log, branch, department, membership, organization, permission, plugin, plugin credential, role, sample record, tenant settings, user, sample item). Mobile không hiển thị quyền nên không cần.

## 3. Kiểm chứng
| Kiểm tra | Kết quả |
| :--- | :--- |
| `npm run i18n:check:strict` | **PASS** 13/13 locale 100% (web **944** key) |
| TC-15: đếm `PERM_*` thô trong DOM khi ở `en` | **0** |
| Ma trận quyền hiển thị mô tả | "View organization" / "Xem cơ cấu tổ chức" … |

Commit `5c2e0ca`. Script sinh key: `%TEMP%/opencode/add-perm-keys.mjs` (giữ lại để bổ sung khi plugin mới thêm `description_key`).
