# TASK-SPRINT-01-AUTH-004: Hardening Token Security & Coverage Evidence

## Thông tin

| Thuộc tính       | Giá trị                               |
|------------------|----------------------------------------|
| Task ID          | TASK-SPRINT-01-AUTH-004               |
| Sprint           | Sprint 01                             |
| Cluster          | auth                                  |
| Loại             | Backend                               |
| Người phụ trách  | Backend                               |
| Story Points     | 3                                     |
| Trạng thái       | ⬜ TODO                               |
| Phụ thuộc        | TASK-SPRINT-01-AUTH-001               |

## Mô tả

Hoàn thiện các phần hardening bảo mật token còn lại sau vòng QA và cung cấp evidence coverage tin cậy cho module auth theo chuẩn CI.

## Phạm vi kỹ thuật

- Chuẩn hóa luồng refresh token cookie-first cho web client và backward-compatible cho mobile/API client.
- Hoàn thiện cảnh báo cấu hình khi fallback HS256 và bổ sung kiểm soát môi trường production.
- Cập nhật cấu hình test/coverage để xuất được số liệu coverage đáng tin cậy cho auth module.
- Bổ sung test case cho các nhánh bảo mật token còn thiếu.

## Acceptance Criteria

- [ ] Có evidence coverage module auth từ pipeline hoặc local chạy ổn định, không còn báo 0% giả.
- [ ] Tài liệu cấu hình JWT nêu rõ RS256 production và điều kiện fallback HS256.
- [ ] Bộ test auth cập nhật đầy đủ cho luồng cookie/body refresh token.

## Definition of Done

- [ ] Build + test pass
- [ ] Coverage evidence đính kèm trong task
- [ ] QA xác nhận đóng bug liên quan AUTH-QA-003
