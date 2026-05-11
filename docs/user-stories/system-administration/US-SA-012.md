# US-SA-012: Quản lý Danh mục dùng chung (Catalog Management)

**ID:** US-SA-012  
**Module:** System Administration  
**Sprint:** 02  
**Cluster:** System Admin nâng cao — Catalog  
**Loại:** Feature  
**Người phụ trách:** TBD  
**Trạng thái:** Chưa bắt đầu

---

## User Story

> **Là** Tenant Admin,  
> **Tôi muốn** quản lý các danh mục dùng chung cho toàn doanh nghiệp (loại sản phẩm, trạng thái đơn hàng, loại hợp đồng...),  
> **Để** chuẩn hóa dữ liệu và đảm bảo nhất quán trên toàn hệ thống.

---

## Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Tenant Admin xem được danh sách tất cả danh mục đã cấu hình, gồm: tên danh mục, mã, mô tả, số giá trị, trạng thái
- [ ] Tenant Admin tạo danh mục mới (ví dụ: "Loại hợp đồng") với tên và mã định danh
- [ ] Tenant Admin thêm/sửa/xóa giá trị trong từng danh mục (ví dụ: thêm "Hợp đồng lao động không xác định thời hạn")
- [ ] Giá trị danh mục đang được dùng trong dữ liệu không thể xóa — chỉ được đánh dấu inactive
- [ ] Hệ thống có sẵn một số danh mục mặc định không thể xóa (system catalogs)
- [ ] Mỗi tenant có danh mục riêng biệt, không ảnh hưởng đến tenant khác
- [ ] Danh mục có thể sắp xếp thứ tự hiển thị

---

## Độ ưu tiên: **Cao (Should Have)**

## Ước tính: **3 story points**
