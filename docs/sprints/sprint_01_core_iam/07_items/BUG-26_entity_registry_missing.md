# [BUG-26] Thiếu Entity Registry — Entity IAM Chưa Được Đăng Ký

- **Mã Lỗi**: BUG-26
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Hệ thống chưa triển khai cơ chế Entity Registry bắt buộc: không có annotation đăng ký, không có service registry, thư mục tài liệu registry trống và toàn bộ entity IAM chưa được đăng ký.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Core IAM — Nền tảng Entity Registry (dùng chung cho mọi plugin).
- **File liên quan**:
  - `src/backend/src/main/java/` — không tồn tại annotation `@RegisterEntity` (grep 0 kết quả).
  - `src/backend/src/main/java/` — không tồn tại `EntityRegistryService`.
  - `docs/system/entity_registry/` — thư mục tồn tại nhưng trống, không có file đăng ký entity nào.
  - Các entity IAM chưa được đăng ký: `users`, `tenants`, `user_tenants`, `user_credentials`, `user_two_factor`, `user_profiles`, `password_reset_tokens`.
- **Tài liệu đối chiếu**:
  - AGENTS.md — mục "Cơ Chế Entity Registry": mọi entity CSDL của module/plugin bắt buộc phải đăng ký vào Entity Registry chung.
  - `docs/system/architecture/SYSTEM_BLUEPRINT.md` mục 5.1 (dòng 182-188) — quy định bảng `sys_entity_registry`.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Tìm kiếm `@RegisterEntity` và `EntityRegistryService` trong `src/backend/src/main/java`.
2. Kiểm tra nội dung thư mục `docs/system/entity_registry/`.
3. Khởi chạy backend và truy vấn bảng `sys_entity_registry` (nếu tồn tại).

## 3. Kết Quả Thực Tế (Actual Result)
- Không có annotation, service hay bảng `sys_entity_registry`; grep không trả về kết quả nào.
- Thư mục `docs/system/entity_registry/` trống.
- 7 entity IAM không được đăng ký, các plugin khác không thể tham chiếu an toàn theo quy định.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Triển khai cơ chế Entity Registry theo SYSTEM_BLUEPRINT mục 5.1: annotation `@RegisterEntity`, `EntityRegistryService`, bảng `sys_entity_registry`.
- Đăng ký đầy đủ 7 entity IAM kèm metadata (tên bảng, khóa chính, tenant-scoped hay không).
- Ghi tài liệu đăng ký vào `docs/system/entity_registry/` để các plugin tham chiếu.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
