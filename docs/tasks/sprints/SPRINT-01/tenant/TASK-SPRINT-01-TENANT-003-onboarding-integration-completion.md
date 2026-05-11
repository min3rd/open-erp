# TASK-SPRINT-01-TENANT-003: Onboarding Integration Completion

## Thông tin

| Thuộc tính       | Giá trị                                 |
|------------------|------------------------------------------|
| Task ID          | TASK-SPRINT-01-TENANT-003               |
| Sprint           | Sprint 01                               |
| Cluster          | tenant                                  |
| Loại             | Backend                                 |
| Người phụ trách  | Backend                                 |
| Story Points     | 3                                       |
| Trạng thái       | ⬜ TODO                                 |
| Phụ thuộc        | TASK-SPRINT-01-TENANT-001               |

## Mô tả

Hoàn thiện các integration còn thiếu trong luồng onboarding tenant sau vòng QA, tách khỏi phạm vi Sprint 1 core để kiểm soát rủi ro triển khai.

## Phạm vi kỹ thuật

- Tích hợp tạo Tenant Admin user thực tế trong luồng complete-onboarding.
- Tích hợp tạo MinIO bucket thực tế với cơ chế retry/fallback.
- Điều chỉnh thời điểm publish `tenant.created` theo đúng mốc hoàn tất onboarding wizard.
- Bổ sung test và tài liệu xử lý lỗi integration.

## Acceptance Criteria

- [ ] Complete-onboarding tạo Tenant Admin user thực tế thành công.
- [ ] Complete-onboarding tạo MinIO bucket tenant thực tế thành công.
- [ ] Event `tenant.created` chỉ phát khi wizard hoàn tất đúng mốc nghiệp vụ.
- [ ] Có test bao phủ các failure case chính của integration.

## Definition of Done

- [ ] Build + test pass
- [ ] QA xác nhận đóng TENANT-QA-004 và TENANT-QA-006
- [ ] Tài liệu task/index được cập nhật đồng bộ
