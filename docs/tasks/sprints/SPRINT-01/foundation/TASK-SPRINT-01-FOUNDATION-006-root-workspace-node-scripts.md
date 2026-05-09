# TASK-SPRINT-01-FOUNDATION-006: Root Workspace Node Scripts cho install/update/format/build

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-006 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | DevOps |
| Người phụ trách | DevOps |
| Story Points | 3 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | — |

## Mô tả
Chuẩn hóa thao tác vận hành workspace bằng node scripts ở thư mục root để đội dự án có thể chạy đồng nhất các luồng cài dependencies cho project con, cập nhật dependency, format code bằng Prettier và build toàn bộ dự án.

## Phạm vi kỹ thuật

### Root workspace (`./`)
- Thiết kế scripts trong `package.json` root theo nhóm:
  - `install:*` để cài dependencies cho `open-erp-backend`, `open-erp-web`, `open-erp-mobile`
  - `deps:update:*` để cập nhật dependencies theo policy đã thống nhất
  - `format:*` để chạy Prettier toàn workspace
  - `build:*` để build từng project con và build tổng
- Định nghĩa convention tên script nhất quán và có tài liệu mô tả cách dùng.
- Thiết kế cơ chế fail-fast: dừng pipeline nếu một project con lỗi.

### Chuẩn Prettier
- Định nghĩa tập file áp dụng format và danh sách loại trừ.
- Quy định rõ script check định dạng và script fix định dạng.

## Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** Không áp dụng (task DevOps, không phát sinh lưu trữ nghiệp vụ).
- **Bảng / Collection:** Không phát sinh.
- **Index cần tạo:** Không.
- **Migration cần thiết:** Không.

## Thiết kế API
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| N/A | N/A | N/A | Task hạ tầng workspace, không phát sinh API runtime |

Chi tiết từng API:
```
N/A
```

## Giao thức & Công nghệ
- **Ngôn ngữ:** JSON script config + Node.js runtime
- **Framework:** npm workspaces hoặc script orchestration tại root
- **Giao thức:** CLI process orchestration
- **Thư viện đề xuất:** `npm-check-updates` (hoặc tương đương), `prettier`, `npm-run-all` (nếu cần)
- **Micro-frontend / Microservice liên quan:** `open-erp-web`, `open-erp-mobile`, `open-erp-backend`

## Deliverables dự kiến
- `package.json` (root): bổ sung nhóm scripts `install:*`, `deps:update:*`, `format:*`, `build:*`
- (Nếu cần) `.prettierignore` hoặc cấu hình liên quan ở root
- `docs/` task/index cập nhật liên quan tới vận hành

## Yêu cầu bảo mật
- [ ] Không đưa secrets/token vào script hoặc log
- [ ] Giới hạn script cập nhật dependency theo nguồn registry tin cậy
- [ ] Validate tham số đầu vào của script (nếu có)
- [ ] Không cho phép thực thi shell command tùy ý từ input người dùng

## Yêu cầu phi chức năng
- **Hiệu năng:** Chạy `install:all` và `build:all` ổn định trong môi trường CI/CD chuẩn.
- **Khả năng mở rộng:** Dễ bổ sung project con mới mà không đổi cấu trúc script hiện tại.
- **Logging & Monitoring:** Log rõ project nào đang chạy, project nào lỗi.
- **Xử lý lỗi:** Exit code khác 0 khi bất kỳ bước nào thất bại.

## Acceptance Criteria
- [ ] Có đầy đủ 4 nhóm script tại root: install, update dependency, format, build.
- [ ] Chạy `install:all` cài dependencies thành công cho 3 project con.
- [ ] Chạy `deps:update:all` tạo báo cáo package được cập nhật theo policy.
- [ ] Chạy `format:check` phát hiện sai format và `format:write` sửa được sai format.
- [ ] Chạy `build:all` lần lượt build backend, web, mobile và dừng ngay khi có lỗi.
- [ ] Tài liệu thao tác script được mô tả rõ cho team Dev/DevOps.
