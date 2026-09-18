# [BUG-50] Bộ Phạm Vi Dữ Liệu Không Nhất Quán (CUSTOM vs NONE) & Tàn Dư ABAC/Anti-Modal

- **Mã Lỗi**: BUG-50
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Bộ 7 Data Scope mâu thuẫn giữa `CUSTOM` và `NONE`; schema còn trường ABAC đã tuyên bố out-of-scope; legend UI thiếu scope; mô tả tương tác UI vi phạm quy chuẩn Anti-Modal.

- **Môi trường**: Tài liệu Sprint (Local)
- **Bằng chứng (file:line)**:
  - `../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md:123` — bảng liệt kê scope `CUSTOM` ("Tùy biến bộ lọc").
  - `../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md:105` (mermaid) và `:167` (§5 Union Rule) — dùng `NONE`; `../04_confirmation/CONF-01_sprint_02_scope.md:35` chốt 7 scope gồm `NONE`.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:272` — cột `custom_conditions JSONB` còn treo trong schema; `CONF-01:48` tuyên bố ABAC nâng cao out-of-scope.
  - `../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md:82-87` — legend chỉ 6 nhãn (ALL/BR/DEPT/SUB/OWN/NO), thiếu `DEPARTMENT_AND_CHILDREN`.
  - `../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md:185` — ghi "Modal/Sheet trượt", trái `AGENTS.md`, `UI spec:20-21`, `CONF-01:91-92`.
- **Tài Liệu Đối Chiếu**: CONF-01 mục 1.5; SOL-02 §4 (bảng 7 scope SQL); DES-02-DB §4.5.

## 2. Tác Động
- Developer hiểu sai tập scope (`CUSTOM` hay `NONE`), schema/enum/UI lệch nhau; ma trận thiếu `DEPARTMENT_AND_CHILDREN` khiến cấu hình quyền sai.

## 3. Kết Quả Kỳ Vọng
- Thống nhất 7 scope: `ALL, BRANCH, DEPARTMENT_AND_CHILDREN, DEPARTMENT, OWN_AND_SUBORDINATES, OWN_ONLY, NONE` trên toàn bộ ANL/DES-DB/API/UI/i18n.
- Loại bỏ hoặc ghi chú deferred `custom_conditions`; bổ sung legend `DEPARTMENT_AND_CHILDREN`; thay "Modal/Sheet" bằng Drawer/Action Sheet.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Tài liệu đã đồng bộ `NONE` và đủ 7 scope.
- [ ] Schema/legend/i18n được cập nhật đầy đủ.
- [ ] QA xác nhận không còn mâu thuẫn phạm vi.

- **Ghi chú QA (2026-09-18)**: Chỉ cần tài liệu — đã chốt 7 scopes không CUSTOM tại ANL-02 §3.1, xóa `custom_conditions` ở DES-DB, bổ sung legend `DEPT+` ở DES-UI; hoàn tất.
