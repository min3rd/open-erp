# [BUG-122] Sơ đồ cơ cấu tổ chức thiếu tenant gốc và chi nhánh

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-122 / Bug (thiếu sót thiết kế/hiển thị) / Sprint 04 |
| Severity / trạng thái | High / **In Review** (đã sửa, chờ QA browser) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / báo cáo trực tiếp của chủ dự án |
| depends_on / blocks | Không / Không |
| Write scope | `features/settings/organization/*`, `shared/...` (canvas type), i18n web |

## 1. Triệu chứng

Trang `/settings/organization`: cây/sơ đồ chỉ hiển thị **phòng ban**. **Chi nhánh** (dù đã tạo) và **tenant gốc** không xuất hiện ⇒ không thể hiểu cơ cấu tổ chức.

## 2. Nguyên nhân gốc

Cả list và graph chỉ dựng từ `GET /organization/departments/tree` (chỉ phòng ban). Chi nhánh nằm ở bảng riêng bên phải; tenant gốc chưa từng được vẽ. Không có nút gốc chung để nhìn toàn cảnh.

## 3. Cách sửa (frontend-only, không đổi API)

Ghép **cây cơ cấu tổ chức** từ dữ liệu sẵn có (`branches` + `departments` + `tenant_name`):

- `OrgChartNode` với `kind: tenant | branch | department`.
- Gốc = **tenant** (tên workspace, tổng số thành viên).
- Con gốc = **các chi nhánh** (sắp theo mã) + **phòng ban không thuộc chi nhánh** (ví dụ phòng GENERAL mặc định).
- Dưới mỗi chi nhánh = các phòng ban của chi nhánh đó (nest theo `parent_id`).
- Cây list dùng `visibleOrgNodes()` (tôn trọng collapse theo id); graph dùng cùng cây, canvas thêm `kind` để tô khác nhóm (tenant/chi nhánh).
- Chi nhánh có nút Sửa/Xoá ngay trên cây; phòng ban giữ nguyên hành động cũ; tenant gốc chỉ hiển thị.
- i18n: `ORGANIZATION_CHART`, `ORGANIZATION_BRANCH_BADGE`.

## 4. Kiểm chứng

| Kiểm tra | Kết quả |
| :--- | :--- |
| `npm run build` (web) | **PASS**, 0 error |
| i18n parity | web 893/893 |
| QA browser (dev server mới :4300, headless Chrome) | **PASS** — xem bảng dưới |

| Bước | Cây (list) | Graph |
| :--- | :--- | :--- |
| Trước khi tạo gì | **1 dòng = tenant gốc** (không còn "Không có dữ liệu") | canvas có nút gốc |
| Sau khi tạo chi nhánh | 2 dòng: gốc (0px) + **chi nhánh** (14px) | canvas đổi (`hash` khác) |
| Sau khi tạo phòng ban | 3 dòng: gốc + chi nhánh + **phòng ban** | canvas đổi |

Ảnh minh chứng: `%TEMP%/opencode/orgchart/orgchart-{list,graph}.png` (chạy tạm, không lưu repo).

> **Ghi chú môi trường (quan trọng)**: dev server web ở cổng 4200 đang **rebuild lỗi từ lâu** (519 lỗi sau bundle cuối, gồm TS2322 cũ `"menu"/"md" is not assignable to IconName/SizeVariant`) nên **phục vụ bundle cũ** — đó là lý do thay đổi cây chưa thấy và lỗi TS2322 hiện ở editor. `ng build` hiện tại PASS; một dev server mới (`ng serve --port 4300`) build sạch và cây hiển thị đúng. **Cần restart dev server 4200** (`Ctrl+C` rồi `npm run web`) để nạp code mới.

## 5. Follow-up

1. Xác nhận lại trên trình duyệt sau khi restart dev server (list: tenant → chi nhánh → phòng ban; graph: đủ 3 loại nút).
2. Cân nhắc bỏ bảng chi nhánh bên phải (giờ đã có trên cây) hoặc giữ làm nơi sửa điện thoại/địa chỉ.
3. Dev server nên được restart trong quy trình khi đổi nhiều file shared (tránh cache cũ).
