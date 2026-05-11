# US-SA-023: Super Admin theo dõi sức khỏe hệ thống và sử dụng nền tảng

**ID:** US-SA-023  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Platform Monitoring  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Super Admin,  
> **Tôi muốn** theo dõi tổng quan sức khỏe và mức độ sử dụng của toàn bộ nền tảng,  
> **Để** chủ động phát hiện sự cố và đưa ra quyết định vận hành kịp thời.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Super Admin xem được dashboard nền tảng với: tổng số tenant (active/suspended/trial), tổng số người dùng đang hoạt động, API calls trong 24h, tỷ lệ lỗi API
- [ ] Biểu đồ xu hướng: số tenant đăng ký mới theo tuần/tháng, số người dùng tăng trưởng
- [ ] Danh sách tenant hoạt động nhiều nhất (theo số API calls, số người dùng)
- [ ] Cảnh báo khi: tỷ lệ lỗi API > 5%, thời gian phản hồi API > 1 giây (P95), storage gần đầy
- [ ] Super Admin nhận email cảnh báo khi có sự cố nghiêm trọng

---

## Độ ưu tiên: **Trung bình (Should Have)**

## Ước tính: **5 story points**
