# PRD — Phân hệ Sale & Logistics

# Bán hàng và Kho vận

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 05, Sprint 06, Sprint 07, Sprint 08  
**Trạng thái:** Đang soạn thảo

---

## 1. Mục tiêu phân hệ

Phân hệ **Sale & Logistics** phục vụ toàn bộ chuỗi vận hành thương mại của doanh nghiệp:

- **Quản lý bán hàng:** Từ lead → báo giá → đơn hàng → hợp đồng → thanh toán
- **Quản lý khách hàng (CRM cơ bản):** Hồ sơ khách, lịch sử giao dịch, chính sách giá
- **Quản lý sản phẩm:** Danh mục, SKU, giá, thuộc tính, barcode
- **Quản lý kho:** Nhập/xuất/chuyển kho, tồn kho real-time, kiểm kê
- **Quản lý mua hàng:** Yêu cầu, đơn mua, nhà cung cấp
- **Quản lý vận chuyển:** Giao hàng, tracking, COD, đối tác vận chuyển
- **KPI và Dashboard:** Doanh số, kho, giao hàng, nhân viên

---

## 2. Tính năng chính theo MoSCoW

### Must Have

| Tính năng              | Mô tả                                              |
| ---------------------- | -------------------------------------------------- |
| Quản lý khách hàng     | Hồ sơ KH, phân nhóm, lịch sử giao dịch             |
| Quản lý sản phẩm & SKU | Danh mục, mã sản phẩm, đơn vị tính, giá            |
| Tạo và quản lý đơn bán | Tạo đơn, trạng thái xử lý, lịch sử đơn             |
| Quản lý kho cơ bản     | Nhập kho, xuất kho, tồn kho real-time              |
| Quản lý nhà cung cấp   | Hồ sơ NCC, chính sách mua, công nợ NCC             |
| Đơn mua hàng           | Tạo đơn mua, theo dõi trạng thái nhập hàng         |
| Báo giá                | Tạo báo giá, gửi khách hàng, chuyển thành đơn hàng |

### Should Have

| Tính năng               | Mô tả                                        |
| ----------------------- | -------------------------------------------- |
| Quản lý nhiều kho       | Nhiều kho địa lý khác nhau, chuyển kho       |
| Quản lý vận chuyển      | Đơn giao hàng, đối tác ship, tracking        |
| Quản lý COD             | Thu hộ tiền, đối soát COD với đối tác        |
| Barcode/QR code         | Quét mã khi nhập/xuất kho                    |
| Quản lý serial/lot      | Theo dõi serial number, lô sản phẩm          |
| Hợp đồng bán hàng       | Tạo hợp đồng, ký số, theo dõi                |
| KPI nhân viên sale      | Doanh số cá nhân, % đạt KPI                  |
| Chiết khấu & khuyến mãi | Chính sách giảm giá, chương trình khuyến mãi |
| AI dự báo doanh số      | Dự báo xu hướng doanh thu                    |
| AI cảnh báo tồn kho     | Cảnh báo thiếu hàng / tồn kho dư thừa        |

### Could Have

| Tính năng                   | Mô tả                             |
| --------------------------- | --------------------------------- |
| Quản lý lead và pipeline    | CRM pipeline, chăm sóc khách hàng |
| Combo/bundle sản phẩm       | Sản phẩm ghép, bundle giá         |
| Kiểm kê kho                 | Quy trình kiểm đếm định kỳ        |
| AI tối ưu tuyến giao hàng   | Gợi ý tuyến đường hiệu quả nhất   |
| AI phân tích hành vi KH     | Dự báo nhu cầu, gợi ý chăm sóc    |
| Dashboard vận hành realtime | Dashboard tích hợp tất cả KPI     |

### Won't Have (v1.0)

- Tích hợp sàn thương mại điện tử (Shopee, Lazada, Tiki)
- POS phần cứng tích hợp
- Quản lý đại lý/kênh phân phối phức tạp

---

## 3. User Flows chính

### 3.1 Flow: Quy trình Bán hàng cơ bản

```
Nhân viên sale tạo báo giá
    → Chọn khách hàng + sản phẩm + số lượng + giá
        → Áp dụng chính sách giá / chiết khấu
            → Gửi báo giá cho khách hàng (email)
                → Khách hàng xác nhận
                    → Chuyển thành Đơn hàng
                        → Kiểm tra tồn kho
                            → Tạo phiếu xuất kho
                                → Tạo đơn giao hàng
                                    → Giao hàng → Thu tiền
                                        → Cập nhật doanh thu & công nợ
```

### 3.2 Flow: Nhập kho từ Đơn mua hàng

```
Phòng mua hàng tạo Yêu cầu mua hàng (Purchase Request)
    → Phê duyệt bởi Manager
        → Tạo Đơn mua hàng (PO) → Gửi cho NCC
            → NCC giao hàng
                → Thủ kho kiểm nhận hàng hóa
                    → Tạo phiếu nhập kho
                        → Cập nhật tồn kho real-time
                            → Cập nhật công nợ NCC
```

### 3.3 Flow: Giao hàng và COD

```
Đơn hàng được xác nhận
    → Chọn đối tác vận chuyển
        → Tạo đơn giao hàng
            → In phiếu giao / Bàn giao shipper
                → Theo dõi trạng thái giao hàng (tracking)
                    → Giao thành công: thu COD → Chuyển khoản về
                    → Giao thất bại: tạo yêu cầu giao lại / hoàn hàng
```

---

## 4. Business Rules quan trọng

- **BR-SL-001:** Tồn kho không được phép âm trừ khi có cấu hình "cho phép bán trước"
- **BR-SL-002:** Đơn hàng đã xác nhận không được xóa, chỉ được hủy (với lý do và phê duyệt)
- **BR-SL-003:** Giá bán phải ≥ giá vốn (có thể cấu hình cảnh báo hoặc block)
- **BR-SL-004:** Chiết khấu vượt ngưỡng cần phê duyệt từ quản lý
- **BR-SL-005:** Khi đơn hàng hủy, tồn kho được hoàn trả tự động
- **BR-SL-006:** Mỗi lần nhập/xuất kho đều phải có chứng từ liên kết
- **BR-SL-007:** COD được đối soát theo ca làm việc của shipper
- **BR-SL-008:** Báo cáo tồn kho real-time được cập nhật ngay khi có phiếu nhập/xuất

---

## 5. Tích hợp với phân hệ khác

| Phân hệ          | Loại tích hợp | Mô tả                                                             |
| ---------------- | ------------- | ----------------------------------------------------------------- |
| **System Admin** | Phụ thuộc     | Dùng user, role, phòng ban, danh mục từ System Admin              |
| **Accounting**   | Bidirectional | Đơn hàng → tạo bút toán kế toán; công nợ KH/NCC đồng bộ           |
| **HR**           | Read          | Lấy danh sách nhân viên sale, nhân viên kho                       |
| **AI Agent**     | Bidirectional | AI nhận dữ liệu bán hàng để dự báo; AI gửi cảnh báo vào workflow  |
| **Dashboard**    | Read          | Dashboard tổng hợp KPI bán hàng và kho                            |
| **Office**       | Bidirectional | Tạo công việc từ đơn hàng; gửi thông báo qua Office notifications |
