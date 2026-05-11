# TASK-SPRINT-01-FOUNDATION-009: Cài đặt trực tiếp Linux Server và Windows Server

## Thông tin

| Thuộc tính      | Giá trị                                                      |
| --------------- | ------------------------------------------------------------ |
| Task ID         | TASK-SPRINT-01-FOUNDATION-009                                |
| Sprint          | Sprint 01                                                    |
| Cluster         | foundation                                                   |
| Loại            | DevOps                                                       |
| Người phụ trách | DevOps                                                       |
| Story Points    | 5                                                            |
| Trạng thái      | ⏸️ HOLD                                                      |
| Phụ thuộc       | TASK-SPRINT-01-FOUNDATION-006, TASK-SPRINT-01-FOUNDATION-008 |

## Mô tả

Xây dựng bộ tài liệu và cấu hình chuẩn cho phương án cài đặt trực tiếp hệ thống lên Linux Server và Windows Server (không dùng container orchestration), phù hợp bối cảnh khách hàng on-premise.

> ⏸️ **HOLD** — Tạm dừng đến khi có bản release hoàn chỉnh đủ tất cả các phân hệ. Khi đó mới đóng gói thành các file cài đặt cho Windows Server và Linux Server.

## Phạm vi kỹ thuật

### Linux Server

- Thiết kế cấu trúc `deploy/install/linux/`.
- Xây dựng checklist cài runtime (Node.js, PM2/systemd, reverse proxy, MongoDB/Redis/RabbitMQ nếu self-host).
- Quy định service unit, cơ chế start/stop/restart, log rotation.

### Windows Server

- Thiết kế cấu trúc `deploy/install/windows/`.
- Xây dựng checklist cài runtime và chạy service bằng NSSM/Windows Service tương đương.
- Quy định cấu hình firewall, reverse proxy (IIS/Nginx), và log thư mục.

### Chuẩn vận hành chung

- Thiết kế quy trình nâng cấp phiên bản và rollback.
- Thiết kế quy trình backup/restore cấu hình tối thiểu.
- Định nghĩa matrix tương thích OS và phiên bản runtime được hỗ trợ.

## Thiết kế cơ sở dữ liệu

- **Service sở hữu data:** Không áp dụng.
- **Bảng / Collection:** Không phát sinh.
- **Index cần tạo:** Không.
- **Migration cần thiết:** Không.

## Thiết kế API

| Method | Endpoint | Auth | Mô tả                                               |
| ------ | -------- | ---- | --------------------------------------------------- |
| N/A    | N/A      | N/A  | Task runbook triển khai hạ tầng, không thêm API mới |

Chi tiết từng API:

```
N/A
```

## Giao thức & Công nghệ

- **Ngôn ngữ:** Markdown runbook + shell/powershell command guideline
- **Framework:** systemd/PM2 (Linux), Windows Service/NSSM (Windows)
- **Giao thức:** HTTP/TCP nội bộ theo kiến trúc microservice
- **Thư viện đề xuất:** PM2, Nginx/IIS, công cụ giám sát log chuẩn
- **Micro-frontend / Microservice liên quan:** Toàn bộ stack Sprint 01

## Deliverables dự kiến

- `deploy/install/linux/` (runbook, template service config, env template)
- `deploy/install/windows/` (runbook, template service config, env template)
- Tài liệu checklist preflight và post-deploy verification cho cả Linux/Windows

## Yêu cầu bảo mật

- [ ] Có checklist hardening tối thiểu cho Linux và Windows Server
- [ ] Không lưu plaintext secrets trong tài liệu mẫu
- [ ] Có yêu cầu bắt buộc TLS và giới hạn cổng mở
- [ ] Có hướng dẫn phân quyền tài khoản chạy service theo nguyên tắc least privilege

## Yêu cầu phi chức năng

- **Hiệu năng:** Quy trình cài đặt mới hoàn tất trong thời gian mục tiêu nội bộ.
- **Khả năng mở rộng:** Có thể thêm node/service mới theo runbook mà không thay đổi chuẩn chung.
- **Logging & Monitoring:** Có checklist tích hợp log/metric và đường dẫn log chuẩn.
- **Xử lý lỗi:** Có playbook khắc phục các lỗi cài đặt phổ biến.

## Acceptance Criteria

- [ ] Có đầy đủ thư mục `deploy/install/linux` và `deploy/install/windows`.
- [ ] Runbook Linux mô tả đầy đủ preflight, cài đặt, vận hành, rollback.
- [ ] Runbook Windows mô tả đầy đủ preflight, cài đặt, vận hành, rollback.
- [ ] Có checklist bảo mật tối thiểu cho cả hai hệ điều hành.
- [ ] Có checklist verify sau triển khai với tiêu chí pass/fail rõ ràng.
- [ ] Tài liệu được liên kết từ task index Sprint 01 và global task index.

## QA Reconciliation (2026-05-11)

- **Trạng thái chốt:** ⏸️ HOLD
- **Lý do chốt:** Giữ HOLD theo chỉ đạo user, chưa thực hiện kiểm chứng runtime/install trong Sprint 01.
- **Evidence tham chiếu:** ghi chú HOLD trực tiếp trong mô tả task và chỉ đạo reconciliation hiện tại.
