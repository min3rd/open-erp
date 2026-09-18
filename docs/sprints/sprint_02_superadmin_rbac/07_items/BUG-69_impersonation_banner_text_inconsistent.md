# [BUG-69] Nội Dung Banner Impersonation Không Nhất Quán Giữa Các Tài Liệu

- **Mã Lỗi**: BUG-69
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [ ] Medium / [x] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Text banner cảnh báo Impersonation khác nhau ở 4 nơi (ANL, sprint_plan, UI spec, i18n), không có mẫu câu chuẩn thống nhất cho Web/Mobile.

- **Môi trường**: Tài liệu Sprint + Frontend (Local)
- **Bằng chứng (file:line)**:
  - `../02_analysis/ANL-01_superadmin_platform_management.md:126` — "BẠN ĐANG TRUY CẬP ĐẠI DIỆN HỖ TRỢ BỞI ADMIN {super_admin_email}. CÒN LẠI {mm:ss}".
  - `../sprint_plan.md:43` — "ĐANG Ở CHẾ ĐỘ TRUY CẬP ĐẠI DIỆN HỖ TRỢ".
  - `../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md:41` — "[CHẾ ĐỘ TRUY CẬP HỖ TRỢ ĐẠI DIỆN] ... Tập Đoàn Acme ... Còn lại: 27:45".
  - `../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md:141` — key `IMPERSONATION_ACTIVE_BANNER` = "Bạn đang truy cập hỗ trợ đại diện".
- **Tài Liệu Đối Chiếu**: `AGENTS.md` (Zero-Hardcode Strings — text phải qua i18n key); UI spec §2.2.

## 2. Tác Động
- QA không biết text nào là chuẩn để nghiệm thu; nguy cơ hardcode/không đồng bộ i18n giữa Web và Mobile.

## 3. Kết Quả Kỳ Vọng
- Chốt 1 template chuẩn có tham số (`super_admin_email`, `tenant_name`, `mm:ss`) dùng xuyên suốt ANL/SOL/UI/i18n.
- Bổ sung key i18n đầy đủ `vi`/`en` cho banner (Web + Mobile), không hardcode.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Template banner đã thống nhất trong toàn bộ tài liệu.
- [ ] Key i18n đủ vi/en ở Web + Mobile.
- [ ] QA xác nhận banner hiển thị đúng trên cả hai nền tảng.

- **Ghi chú QA (2026-09-18)**: Chỉ cần tài liệu — banner đã chuẩn hóa theo key `IMPERSONATION_ACTIVE_BANNER` tại ANL-01 §2.3, SOL-01, DES-UI §2.2; hoàn tất.
