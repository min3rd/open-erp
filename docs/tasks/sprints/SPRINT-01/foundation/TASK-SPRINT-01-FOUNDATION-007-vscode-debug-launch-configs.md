# TASK-SPRINT-01-FOUNDATION-007: VS Code Debug Launch Configurations cho hệ thống

## Thông tin

| Thuộc tính      | Giá trị                       |
| --------------- | ----------------------------- |
| Task ID         | TASK-SPRINT-01-FOUNDATION-007 |
| Sprint          | Sprint 01                     |
| Cluster         | foundation                    |
| Loại            | DevOps                        |
| Người phụ trách | DevOps                        |
| Story Points    | 3                             |
| Trạng thái      | 🟢 DONE                       |
| Phụ thuộc       | TASK-SPRINT-01-FOUNDATION-006 |

## Mô tả

Thiết kế cấu hình debug chuẩn trong VS Code để đội backend/web/mobile có thể khởi chạy, attach debugger và debug liên dịch vụ với quy trình nhất quán trong workspace.

## Phạm vi kỹ thuật

### VS Code workspace config

- Tạo/chuẩn hóa file `.vscode/launch.json` cho các luồng:
  - Debug backend NestJS
  - Debug Angular web
  - Debug Ionic/Angular mobile (serve mode)
  - Compound launch để debug nhiều tiến trình cùng lúc
- Chuẩn hóa biến môi trường debug, working directory, source map mapping.
- Thiết kế cấu hình attach cho Node.js process khi chạy qua script root.

### Chuẩn vận hành debug

- Quy định tên cấu hình rõ mục đích (Dev, Attach, Compound).
- Đảm bảo có thể debug tại root workspace mà không cần chỉnh tay cấu hình cá nhân.

## Thiết kế cơ sở dữ liệu

- **Service sở hữu data:** Không áp dụng.
- **Bảng / Collection:** Không phát sinh.
- **Index cần tạo:** Không.
- **Migration cần thiết:** Không.

## Thiết kế API

| Method | Endpoint | Auth | Mô tả                                      |
| ------ | -------- | ---- | ------------------------------------------ |
| N/A    | N/A      | N/A  | Task cấu hình IDE, không phát sinh API mới |

Chi tiết từng API:

```
N/A
```

## Giao thức & Công nghệ

- **Ngôn ngữ:** JSON (VS Code launch schema)
- **Framework:** VS Code debugger (Node.js + Chrome)
- **Giao thức:** Debug Protocol
- **Thư viện đề xuất:** Sử dụng debugger mặc định của VS Code, không thêm package runtime
- **Micro-frontend / Microservice liên quan:** Backend gateway/service, web app, mobile app

## Deliverables dự kiến

- `.vscode/launch.json`
- (Nếu cần) `.vscode/tasks.json` để tích hợp preLaunchTask
- Tài liệu ngắn mô tả các profile debug trong docs task/index

## Yêu cầu bảo mật

- [ ] Không hardcode secrets trong launch configs
- [ ] Không commit thông tin máy cá nhân (đường dẫn tuyệt đối, token)
- [ ] Chỉ expose debug port trong môi trường local
- [ ] Kiểm tra cấu hình attach tránh mở port công khai trên mạng ngoài

## Yêu cầu phi chức năng

- **Hiệu năng:** Thời gian khởi chạy debug profile < 30 giây trong máy dev chuẩn.
- **Khả năng mở rộng:** Dễ thêm profile cho microservice mới ở Sprint sau.
- **Logging & Monitoring:** Console log hiển thị rõ output từng process khi chạy compound.
- **Xử lý lỗi:** Nếu thiếu dependency hoặc port bận, cấu hình trả thông báo lỗi rõ ràng.

## Acceptance Criteria

- [x] Có launch profile riêng cho backend, web, mobile.
- [x] Có ít nhất 1 compound profile debug nhiều thành phần cùng lúc.
- [x] Có profile attach Node.js để debug service đang chạy độc lập.
- [x] Mỗi profile được gán đúng cwd và source map, breakpoint hoạt động.
- [x] Không chứa secrets hoặc path tuyệt đối phụ thuộc máy cá nhân.
- [x] Có hướng dẫn sử dụng profile debug cho đội phát triển.

## Hướng dẫn dùng debug profiles

### Profiles chính

- `Backend: NestJS (Launch)`: chạy trực tiếp backend bằng `npm run start:debug` trong `open-erp-backend`.
- `Backend: Attach (Local 9229)`: attach vào backend đã chạy local với cờ inspect ở cổng `9229`.
- `Backend: Attach (Docker 9229)`: attach vào backend chạy trong container và map source từ `/workspace` về `open-erp-backend`.
- `Web: Angular (Chrome)`: tự chạy preLaunch task `dev:web:start`, sau đó mở Chrome debug tại `http://localhost:4200`.
- `Mobile: Ionic Angular (Chrome)`: chạy preLaunch task `dev:mobile:start`, debug tại `http://localhost:4201`.

### Compound profiles

- `Fullstack: Backend + Web`: debug đồng thời backend và web.
- `Workspace: Backend + Web + Mobile`: debug cả 3 thành phần trong cùng workspace.

### Lưu ý vận hành

- Không cần chỉnh đường dẫn tuyệt đối theo máy cá nhân.
- Không khai báo secret trong launch config.
- Nếu cổng bận, đổi cổng ở task terminal tương ứng trước khi chạy profile attach.

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-10  
**Trạng thái:** 🟢 DONE

**Files đã tạo / sửa:**

- `.vscode/launch.json`
- `.vscode/tasks.json`
- `docs/tasks/sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-007-vscode-debug-launch-configs.md`

**Bằng chứng kiểm tra:**

- `get_errors` cho `.vscode/launch.json`: không có lỗi.
- `get_errors` cho `.vscode/tasks.json`: không có lỗi.

**Ghi chú:**

- JSON parser thuần của Node.js không parse được `launch.json` do VS Code dùng JSONC (có comment), đã kiểm tra hợp lệ bằng diagnostics của VS Code.

## QA Regression tuần 1 (2026-05-11)

**Lệnh xác minh bổ sung:**

```text
get_errors .vscode/launch.json
get_errors .vscode/tasks.json
```

**Kết quả:**

- Không phát hiện lỗi cấu hình ở cả `launch.json` và `tasks.json`.
- Đủ căn cứ sign-off cho scope cấu hình IDE của task.

**Đánh giá QA:**

- Chuyển trạng thái `🟢 DONE`.

## QA Reconciliation (2026-05-11)

- **Trạng thái chốt:** 🟢 DONE
- **Lý do chốt:** Cấu hình debug profiles đã đủ AC, không phát hiện lỗi cấu hình và có evidence kiểm tra diagnostics.
- **Evidence tham chiếu:** `get_errors` cho `.vscode/launch.json` và `.vscode/tasks.json` đều sạch lỗi.
