# US-SA-004: Làm mới token và duy trì phiên đăng nhập

**ID:** US-SA-004  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — Authentication  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** người dùng đang sử dụng hệ thống,  
> **Tôi muốn** phiên làm việc của tôi được duy trì liên tục mà không cần đăng nhập lại sau mỗi 15 phút,  
> **Để** không bị gián đoạn khi làm việc.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Khi access token hết hạn, client tự động dùng refresh token để lấy access token mới mà không cần người dùng đăng nhập lại
- [ ] Refresh token chỉ được dùng một lần (token rotation); sau khi dùng, hệ thống cấp refresh token mới
- [ ] Nếu refresh token hết hạn (sau 7 ngày không hoạt động), người dùng phải đăng nhập lại
- [ ] Khi refresh token bị dùng lại (detect reuse), hệ thống tự động thu hồi toàn bộ phiên và yêu cầu đăng nhập lại
- [ ] Người dùng có thể đăng xuất, sau đó refresh token bị thu hồi ngay lập tức
- [ ] Chức năng "đăng xuất tất cả thiết bị" thu hồi toàn bộ refresh token của tài khoản

---

## Độ ưu tiên: **Cao (Must Have)**

## Ước tính: **3 story points**
