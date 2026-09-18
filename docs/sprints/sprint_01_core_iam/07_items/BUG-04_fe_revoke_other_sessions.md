# [BUG-04] Sai Endpoint Thu Hồi Các Phiên Đăng Nhập Khác

- **Mã Lỗi**: BUG-04
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Chức năng đăng xuất khỏi tất cả thiết bị khác gọi sai HTTP method và sai đường dẫn, dẫn đến lỗi 404.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Quản lý tài khoản — Thu hồi các phiên đăng nhập khác (FEAT-06 AC7).
- **File liên quan**: `src/frontend/web/src/app/core/services/account.service.ts:57-59` gọi `POST /api/v1/account/sessions/revoke-others`.
- **Tài liệu đối chiếu**: Backend `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AccountResource.java:141-142` quy định `DELETE /api/v1/account/sessions/other`; DES-02 mục 3.1.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập cùng tài khoản trên từ 2 thiết bị/trình duyệt trở lên.
2. Mở Drawer Quản lý tài khoản, vào mục Phiên đăng nhập.
3. Bấm nút "Đăng xuất khỏi các thiết bị khác".

## 3. Kết Quả Thực Tế (Actual Result)
- Request trả `404 Not Found` do gọi `POST /api/v1/account/sessions/revoke-others` — không khớp backend.
- Các phiên đăng nhập khác không bị thu hồi; FEAT-06 AC7 không đạt.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Frontend phải gọi `DELETE /api/v1/account/sessions/other` theo `AccountResource.java:141-142` và DES-02 mục 3.1; toàn bộ phiên khác (trừ phiên hiện tại) bị thu hồi thành công.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
