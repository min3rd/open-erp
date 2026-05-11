# Mẫu Task Chuẩn

## Thông tin chung

- Task ID: TASK-SPRINT-<NN>-<CLUSTER>-<NNN>
- Tiêu đề: <tieu-de-ngan-gon>
- Sprint: <NN>
- Cluster: <cluster-kebab-case>
- Trạng thái: ⬜ TODO
- Loại: Frontend | Backend | Database | DevOps | Testing | QA | Security
- Ưu tiên: Cao | Trung bình | Thấp
- Ước tính: <so-gio-hoac-story-points>
- Agent chính: Product Owner | Business Analyst | UI/UX Designer | Technical Leader | Senior Frontend Programmer | Senior Backend Programmer | Senior DevOps | Senior QA
- Agent phối hợp: <danh-sach-agent-lien-quan-hoac-dau-gach-ngang>
- Người phụ trách: <ten-hoac-dau-gach-ngang>
- Phụ thuộc: <TASK-ID-khac-hoac-dau-gach-ngang>

## Mô tả

Mô tả ngắn gọn mục tiêu của task, kết quả mong đợi và giá trị nghiệp vụ.

## Tài liệu tham chiếu

- SRS: docs/srs/SRS-<module>.md#<section>
- Design: docs/design/screens/SCREEN-<man-hinh>.md
- Kiến trúc: docs/tasks/ARCHITECTURE.md
- User story: docs/user-stories/US-<module>.md

## Phân rã theo agent

### Product Owner / Business Analyst

- Mục tiêu nghiệp vụ: <muc-tieu-nghiep-vu>
- Yêu cầu chức năng cốt lõi:
  - [ ] Yêu cầu 1
  - [ ] Yêu cầu 2
- Acceptance criteria:
  - [ ] AC-1
  - [ ] AC-2

### UI/UX Designer

- Màn hình/flow liên quan:
  - [ ] docs/design/screens/SCREEN-<man-hinh-1>.md
  - [ ] docs/design/flows/FLOW-<luong-1>.md
- Trạng thái thiết kế: Chưa bắt đầu | Đang làm | Hoàn tất
- Checklist thiết kế:
  - [ ] Có đủ trạng thái default/loading/empty/error/success
  - [ ] Có guideline responsive (mobile/tablet/desktop)
  - [ ] Có guideline tương tác và thông báo lỗi

### Technical Leader

- Quyết định kỹ thuật chính: <tom-tat-adr-hoac-giai-phap>
- Service/MFE bị ảnh hưởng: <danh-sach>
- Ràng buộc tích hợp: <api-contract-event-contract>

### Senior Backend Programmer

- Phạm vi backend:
  - [ ] API
  - [ ] Dữ liệu/Migration
  - [ ] Business logic
- Đầu ra backend:
  - [ ] Endpoint và contract đã chốt
  - [ ] Unit test backend đạt yêu cầu
  - [ ] Cập nhật tài liệu API

### Senior Frontend Programmer

- Phạm vi frontend:
  - [ ] UI theo screen specs
  - [ ] Kết nối API
  - [ ] i18n và data-testid
- Đầu ra frontend:
  - [ ] Unit test frontend đạt yêu cầu
  - [ ] E2E/Playwright cho luồng chính
  - [ ] Ảnh evidence lưu đúng thư mục

### Senior DevOps

- Phạm vi hạ tầng/vận hành:
  - [ ] Cập nhật biến môi trường
  - [ ] Cập nhật CI/CD
  - [ ] Cập nhật cấu hình deploy/monitoring
- Đầu ra DevOps:
  - [ ] Tài liệu vận hành cập nhật
  - [ ] Pipeline chạy ổn định

### Senior QA

- Kế hoạch kiểm thử:
  - [ ] Test case đã tạo/cập nhật
  - [ ] Kết quả test functional
  - [ ] Kết quả regression (nếu có)
- Đầu ra QA:
  - [ ] Báo cáo bug/evidence
  - [ ] Xác nhận PASS để release hoặc nêu blocker

## Phạm vi công việc

- [ ] Đầu việc 1
- [ ] Đầu việc 2
- [ ] Đầu việc 3

## Thiết kế dữ liệu (nếu có)

- Service sở hữu data: <ten-service>
- Bảng/Collection:

| Trường | Kiểu | Ràng buộc    | Mô tả     |
| ------ | ---- | ------------ | --------- |
| id     | uuid | PK, not null | Định danh |

- Index cần tạo: <danh-sach-hoac-khong>
- Migration cần tạo: Có | Không

## Thiết kế API (nếu có)

| Method | Endpoint           | Auth       | Mô tả          |
| ------ | ------------------ | ---------- | -------------- |
| GET    | /api/v1/<resource> | Bearer JWT | Mô tả endpoint |

Chi tiết request/response:

POST /api/v1/<resource>
Request:
{
"field": "value"
}
Response:
{
"id": "uuid",
"field": "value"
}
Errors: 400, 401, 403, 404, 409, 500

## Bảo mật và compliance

- [ ] Xác thực
- [ ] Phân quyền
- [ ] Validate input
- [ ] Xử lý dữ liệu nhạy cảm
- [ ] Rate limiting (nếu cần)

## Yêu cầu phi chức năng

- Hiệu năng: <muc-tieu-response-time>
- Khả năng mở rộng: <huong-scale>
- Logging/Monitoring: <metric-can-theo-doi>
- Xử lý lỗi: <retry-fallback-timeout>

## Kế hoạch kiểm thử

- Unit test:
  - [ ] Test happy path
  - [ ] Test error path
  - [ ] Coverage >= 80%
- Integration/E2E (nếu có):
  - [ ] Luồng chính
  - [ ] Edge cases

## Bàn giao liên agent

- Bàn giao BA/PO -> UI/UX:
  - [ ] Đủ yêu cầu và AC
  - [ ] Không còn điểm mơ hồ nghiệp vụ
- Bàn giao UI/UX -> FE:
  - [ ] Có screen specs đầy đủ
  - [ ] Có flow và trạng thái lỗi
- Bàn giao TL -> FE/BE/DevOps:
  - [ ] Chốt kiến trúc và contract tích hợp
  - [ ] Chốt phạm vi triển khai từng bên
- Bàn giao FE/BE -> QA:
  - [ ] Có build deploy được trên môi trường test
  - [ ] Có hướng dẫn test và test data

## Câu hỏi / Thắc mắc

- [ ] <neu-co-thi-ghi-cau-hoi-vao-day>

## Kết quả thực hiện (điền khi làm)

- Ngày bắt đầu:
- Ngày hoàn thành:
- Branch/Commit:
- Files đã tạo/sửa:
  - <path-1> - <mo-ta>
  - <path-2> - <mo-ta>
- Ghi chú review:
  - <ghi-chu-1>

## Definition of Done

- [ ] Đã cập nhật trạng thái index toàn cục
- [ ] Đã cập nhật trạng thái index sprint
- [ ] Đã cập nhật index cluster (nếu có)
- [ ] Đã cập nhật trạng thái theo đúng agent chính/phối hợp
- [ ] Unit test đạt yêu cầu
- [ ] Tài liệu API được cập nhật (nếu có)
- [ ] Có evidence UI/UX, FE, BE, DevOps, QA phù hợp phạm vi task
- [ ] Sẵn sàng chuyển sang 🟡 REVIEW
