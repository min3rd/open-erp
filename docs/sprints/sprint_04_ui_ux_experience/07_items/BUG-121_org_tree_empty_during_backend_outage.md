# [BUG-121] Cây cơ cấu tổ chức trống / thêm chi nhánh–phòng ban không lưu khi backend dev sập

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-121 / Bug / Sprint 04 (sự cố môi trường dev) |
| Severity / trạng thái | Medium / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / báo cáo trực tiếp của chủ dự án |
| depends_on / blocks | Không / Không |
| Write scope | `modules/iam/service/AccountService.java` (import) — đã sửa |

## 1. Triệu chứng (người dùng báo)

Trang `/settings/organization` (tenant `minhvv`) hiển thị vùng **"Cây sơ đồ phòng ban"** = *"Không có dữ liệu"*; thêm chi nhánh/phòng ban không thấy xuất hiện.

## 2. Nguyên nhân gốc

**Không phải lỗi tính năng tổ chức.** Backend dev đã **sập do lỗi biên dịch** từ một chỉnh sửa đang làm dở của agent (Sprint 04, validate ngôn ngữ):

```
AccountService.java:92: error: cannot find symbol
    profile.language = LanguageCode.fromCode(req.language)
  symbol: variable LanguageCode
```

Thiếu `import ...core.enums.LanguageCode;` ⇒ Quarkus dev hot-reload thất bại ⇒ **mọi API trả 500** (kể cả `POST /auth/login`, `GET /organization/departments/tree`, `POST /organization/departments`). Vì vậy cây trống và thao tác tạo không lưu.

## 3. Bằng chứng

| Kiểm tra | Kết quả |
| :--- | :--- |
| `GET /q/health` lúc sự cố | 500 (trang lỗi "Error restarting Quarkus", stacktrace chỉ đúng dòng `AccountService.java:92`) |
| Sau khi thêm import | `health=200` |
| DB tenant `minhvv` | `departments = 0`, `branches = 1` (chi nhánh `HN` tạo được khi backend còn sống) |
| Quyền | `TENANT_ADMIN` **có** `core:department:manage` ⇒ không phải 403 |
| Repro trình duyệt (headless Chrome, tenant sạch) | Tạo phòng ban ⇒ **cây cập nhật ngay** (list: mã xuất hiện; graph: pixel canvas đổi); `POST /departments` 201 → `GET /departments/tree` 200 |
| Log backend sau khi hồi | Không còn `DEPARTMENT`/409/403 lỗi |

## 4. Cách xử lý

Thêm `import com.vn9melody.openerp.core.enums.LanguageCode;` vào `AccountService`. Backend hồi; luồng tạo + hiển thị phòng ban được verify lại.

## 5. Bài học / phòng ngừa

- **Không để backend dev ở trạng thái biên dịch lỗi** giữa các bước: chạy `mvn -o compile` sau mỗi cụm sửa Java trước khi trả lại phiên.
- Khi thêm enum/class mới, kiểm tra import ngay (lỗi này lẽ ra bị bắt ở bước compile).

## 6. Follow-up (đã xử lý 2026-10-05)

1. **Chi nhánh không nằm trong sơ đồ phòng ban** → đã xử lý ở [BUG-122](BUG-122_org_chart_missing_tenant_root_and_branches.md) (cây hiện tenant gốc → chi nhánh → phòng ban).
2. **Luồng xoá qua UI** → **đã xác minh và sửa**: xoá là *soft delete* (status → `INACTIVE`) và bảng vẫn hiển thị dòng đã xoá nên trông như thất bại. Nay danh sách chi nhánh và cây phòng ban **lọc bỏ bản ghi `INACTIVE`**; đo lại: bấm Xóa → xác nhận → request `DELETE /api/v1/organization/branches/{id}` (200) → dòng **biến mất** khỏi bảng.
3. **Nút "+ Thêm phòng ban" khi thiếu quyền**: `PLUGIN_PERMISSION_CHECKER` trả `false` khi claim có mặt và thiếu quyền ⇒ nút ẩn; chỉ khi JWT **không có** claim `permissions` mới hiện (fallback đã ghi ở Sprint 02). Không đổi.
