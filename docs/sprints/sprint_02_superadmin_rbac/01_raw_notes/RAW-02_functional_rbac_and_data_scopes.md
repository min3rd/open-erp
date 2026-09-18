# [RAW-02] Ghi Chú Yêu Cầu Thô: Phân Quyền Chức Năng, Cơ Cấu Tổ Chức & Phân Quyền Dữ Liệu Đa Phạm Vi

- **Ngày tiếp nhận**: 2026-09-18
- **Người cung cấp**: Khách hàng (Product Owner / Enterprise Architect)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Yêu cầu trực tiếp từ khách hàng

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

> "Hệ thống ERP của chúng tôi bắt buộc phải có cơ chế phân quyền cực kỳ chặt chẽ và linh hoạt, gồm 2 phần riêng biệt nhưng kết hợp với nhau:
> 
> **1. Phân quyền chức năng (Functional RBAC)**:
> - Doanh nghiệp phải tự tạo được các Vai trò (Roles) theo thực tế của họ (ví dụ: Giám đốc kinh doanh, Kế toán kho, Trưởng phòng nhân sự, Nhân viên bán hàng).
> - Mỗi vai trò được bật/tắt các quyền cụ thể trên từng màn hình, từng tính năng (ví dụ: Quyền xem khách hàng, Quyền tạo đơn hàng, Quyền sửa bảng giá...).
> - Một người có thể được gán nhiều vai trò khác nhau.
> 
> **2. Phân quyền dữ liệu theo nhiều phạm vi (Data Permission Scopes) & Thao tác với dữ liệu (Data Operations)**:
> - Trong một công ty, không phải ai cũng được xem hết dữ liệu. Phải phân chia phạm vi rất rõ ràng:
>   + Cấp công ty: Xem toàn bộ dữ liệu của cả doanh nghiệp.
>   + Cấp chi nhánh: Chỉ xem được dữ liệu phát sinh tại Chi nhánh mà nhân viên đó làm việc (ví dụ: Chi nhánh Hà Nội, Chi nhánh TP.HCM).
>   + Cấp phòng ban: Chỉ xem được dữ liệu của Phòng ban mình.
>   + Cấp phòng ban và cấp dưới: Trưởng phòng xem được phòng ban mình và tất cả các tổ/nhóm con trực thuộc.
>   + Cấp quản lý trực tiếp: Người quản lý xem được dữ liệu do chính mình tạo ra và dữ liệu của tất cả nhân viên báo cáo trực tiếp/gián tiếp dưới quyền mình.
>   + Cấp cá nhân: Nhân viên chỉ được xem đúng các bản ghi do chính họ tạo hoặc được giao phụ trách.
> - Đi kèm với phạm vi là các thao tác tác động dữ liệu: Tạo mới (Create), Xem (Read), Chỉnh sửa (Update), Xóa (Delete), Xuất file (Export) và Chia sẻ quyền (Share). Ví dụ: Một nhân viên có thể được phép XEM đơn hàng toàn chi nhánh, nhưng chỉ được SỬA và XÓA đơn hàng do chính mình tạo; quyền XUẤT FILE Excel phải kiểm soát chặt để nhân viên không đem dữ liệu khách hàng ra ngoài.
> - Để làm được điều này, hệ thống phải cho phép doanh nghiệp cấu hình được Cơ cấu tổ chức: Danh sách Chi nhánh, Cây sơ đồ Phòng ban cha/con, và ai là người quản lý trực tiếp của ai."

---

## 2. Bối Cảnh & Ràng Buộc Triển Khai

1. **Kiểm soát tự động ở tầng Backend (Enforcement Engine)**:
   - Cơ chế phân quyền dữ liệu không được phụ thuộc vào việc lập trình viên frontend ẩn nút, hay lập trình viên backend nhớ viết câu lệnh `WHERE` thủ công.
   - Hệ thống phải có cơ chế can thiệp tầng sâu (Query Filter Interceptor) tự động chèn các điều kiện phạm vi vào câu truy vấn trước khi gửi xuống cơ sở dữ liệu.
2. **Giao diện ma trận phân quyền mật độ cao (Industrial Sharp Matrix)**:
   - Giao diện phân quyền phải gọn gàng, trực quan, cho phép người quản trị nhìn thấy cả 2 chiều: Quyền chức năng và Ma trận phạm vi dữ liệu trên cùng một màn hình hoặc Drawer, giảm thiểu số lần click chuột.
