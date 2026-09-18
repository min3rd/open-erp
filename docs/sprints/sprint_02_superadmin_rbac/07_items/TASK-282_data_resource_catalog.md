# [TASK-282] API Danh Mục Resource Cho Ma Trận Data Policy

- **Mã Công Việc**: TASK-282
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục nhóm data-resource trong [BUG-61](BUG-61_missing_endpoints.md) — UI ma trận cần nguồn resource nhưng chưa có API.
- Mục tiêu: cung cấp catalog resource lấy từ Entity Registry để Frontend render ma trận 6 thao tác.
- Tài liệu thiết kế: [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §5.4; [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §3; `docs/system/entity_registry/README.md`.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] `GET /api/v1/iam/data-resources` — trả danh sách resource (code, tên hiển thị i18n key) từ Entity Registry (khuôn mẫu 3, bọc `items`).
- [ ] Chỉ trả các entity được phép phân quyền dữ liệu (đánh dấu trong registry), không lộ entity nội bộ.
- [ ] Sắp xếp theo domain/resource; hỗ trợ đa ngôn ngữ qua `description_key`/i18n key.
- [ ] Guard quyền đọc cấu hình IAM; test integration trên PostgreSQL thật.
- [ ] Cập nhật API spec với endpoint mới.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] API trả đúng catalog, envelope chuẩn, không hardcode chuỗi hiển thị.
- [ ] UI tiêu thụ được để vẽ ma trận (kiểm chứng cùng TASK-280).
- [ ] `mvn test` pass 100%.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm tra contract + dữ liệu nguồn registry.
- [ ] Không phát sinh regression.
