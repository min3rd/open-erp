# US-SA-016: AI gợi ý phân quyền theo chức danh

**ID:** US-SA-016  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — AI Security  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** AI gợi ý bộ quyền phù hợp khi tôi tạo role mới hoặc gán role cho người dùng mới,  
> **Để** tiết kiệm thời gian cấu hình và tránh cấp quyền dư thừa hoặc thiếu sót.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Khi Tenant Admin nhập tên role hoặc chức danh, AI gợi ý danh sách quyền phù hợp dựa trên mẫu phổ biến
- [ ] Gợi ý được hiển thị dưới dạng nhóm quyền có thể chọn/bỏ từng quyền một
- [ ] AI phát hiện và cảnh báo khi role có quyền xung đột (ví dụ: cùng một người vừa tạo đơn hàng vừa phê duyệt đơn hàng — vi phạm Segregation of Duties)
- [ ] AI đề xuất "quyền tối thiểu cần thiết" dựa trên phân tích sử dụng thực tế (nếu tenant đã có lịch sử)
- [ ] Tenant Admin có thể bỏ qua gợi ý và cấu hình thủ công hoàn toàn
- [ ] Giải thích ngắn gọn lý do AI đưa ra từng gợi ý

---

## Độ ưu tiên: **Thấp (Could Have)**

## Ước tính: **8 story points**
