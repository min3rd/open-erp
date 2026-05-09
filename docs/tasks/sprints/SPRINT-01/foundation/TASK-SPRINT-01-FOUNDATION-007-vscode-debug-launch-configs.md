# TASK-SPRINT-01-FOUNDATION-007: VS Code Debug Launch Configurations cho hệ thống

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-007 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | DevOps |
| Người phụ trách | DevOps |
| Story Points | 3 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-006 |

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
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| N/A | N/A | N/A | Task cấu hình IDE, không phát sinh API mới |

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
- [ ] Có launch profile riêng cho backend, web, mobile.
- [ ] Có ít nhất 1 compound profile debug nhiều thành phần cùng lúc.
- [ ] Có profile attach Node.js để debug service đang chạy độc lập.
- [ ] Mỗi profile được gán đúng cwd và source map, breakpoint hoạt động.
- [ ] Không chứa secrets hoặc path tuyệt đối phụ thuộc máy cá nhân.
- [ ] Có hướng dẫn sử dụng profile debug cho đội phát triển.
