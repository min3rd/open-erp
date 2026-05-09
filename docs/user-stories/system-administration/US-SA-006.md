# US-SA-006: Tenant Admin thiết lập thông tin doanh nghiệp lần đầu

**ID:** US-SA-006  
**Module:** System Administration  
**Sprint:** 01  
**Cluster:** SaaS Foundation — Tenant Onboarding  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu  

---

## User Story

> **Là** Tenant Admin đăng nhập lần đầu tiên,  
> **Tôi muốn** được hướng dẫn thiết lập thông tin doanh nghiệp qua một wizard đơn giản,  
> **Để** nhanh chóng cấu hình hệ thống phù hợp với tổ chức của tôi mà không cần hỗ trợ kỹ thuật.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Sau lần đăng nhập đầu tiên, Tenant Admin được chuyển đến Onboarding Wizard (có thể bỏ qua và làm sau)
- [ ] Wizard gồm các bước: (1) Thông tin doanh nghiệp, (2) Múi giờ & Ngôn ngữ, (3) Tạo phòng ban đầu tiên, (4) Mời người dùng, (5) Chọn phân hệ kích hoạt
- [ ] Tenant Admin nhập được: tên công ty, mã số thuế, địa chỉ, số điện thoại, logo
- [ ] Tenant Admin chọn múi giờ (mặc định: UTC+7) và ngôn ngữ (mặc định: Tiếng Việt)
- [ ] Tenant Admin có thể bỏ qua từng bước và hoàn thành sau
- [ ] Sau khi hoàn thành wizard, chuyển đến Dashboard chính
- [ ] Thông tin đã nhập được lưu ngay lập tức khi qua mỗi bước

---

## Độ ưu tiên: **Cao (Must Have)**  
## Ước tính: **5 story points**
