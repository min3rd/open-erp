# PRD — Phân hệ Accounting

# Kế toán – Tài chính

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 11, Sprint 12  
**Trạng thái:** Đang soạn thảo

---

## 1. Mục tiêu phân hệ

Phân hệ **Accounting** phục vụ toàn bộ nghiệp vụ tài chính kế toán của doanh nghiệp Việt Nam:

- **Kế toán tổng hợp:** Hạch toán, nhật ký chung, sổ cái, khóa sổ
- **Công nợ:** Phải thu, phải trả, đối chiếu, nhắc nợ
- **Thu chi và dòng tiền:** Phiếu thu/chi, quỹ tiền mặt, tài khoản ngân hàng
- **Hóa đơn điện tử:** Phát hành, ký số, quản lý theo quy định Nghị định 123/2020/NĐ-CP
- **Tích hợp MISA:** Đồng bộ dữ liệu với MISA AMIS, MISA SME.NET
- **Tích hợp eTax:** Kết nối cổng thuế điện tử, kê khai thuế
- **Báo cáo tài chính:** Báo cáo theo chuẩn Việt Nam (VAS)

---

## 2. Tính năng chính theo MoSCoW

### Must Have

| Tính năng                  | Mô tả                                               |
| -------------------------- | --------------------------------------------------- |
| Danh mục tài khoản kế toán | Hệ thống tài khoản theo chuẩn Bộ Tài chính Việt Nam |
| Bút toán và chứng từ       | Tạo/sửa bút toán, lưu chứng từ gốc                  |
| Nhật ký chung              | Sổ nhật ký chung, lọc theo kỳ                       |
| Sổ cái                     | Theo dõi số dư từng tài khoản                       |
| Công nợ phải thu           | Danh sách, theo dõi hạn, đối chiếu                  |
| Công nợ phải trả           | Quản lý NCC, theo dõi hạn thanh toán                |
| Phiếu thu / phiếu chi      | Tạo, phê duyệt, in phiếu                            |
| Quản lý quỹ tiền mặt       | Theo dõi số dư quỹ real-time                        |

### Should Have

| Tính năng                | Mô tả                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| Hóa đơn điện tử          | Phát hành, ký số, tra cứu theo quy định Việt Nam                  |
| Tích hợp hóa đơn điện tử | Kết nối MISA meInvoice, VNPT Invoice, Viettel SInvoice, BKAV, FPT |
| Tích hợp MISA            | Đồng bộ dữ liệu với MISA AMIS/SME.NET                             |
| Tích hợp eTax            | Kết nối thuedientu.gdt.gov.vn                                     |
| Tài khoản ngân hàng      | Quản lý TK ngân hàng, theo dõi giao dịch                          |
| Đối soát ngân hàng       | So khớp sao kê ngân hàng với phiếu thu/chi                        |
| Kỳ kế toán               | Mở/khóa kỳ, ngăn chỉnh sửa dữ liệu kỳ đã khóa                     |
| AI gợi ý định khoản      | Tự động đề xuất định khoản dựa trên nội dung chứng từ             |
| AI phát hiện sai lệch    | Cảnh báo bút toán bất thường, chứng từ thiếu                      |

### Could Have

| Tính năng                      | Mô tả                                              |
| ------------------------------ | -------------------------------------------------- |
| Báo cáo tài chính đầy đủ       | Bảng cân đối, P&L, Lưu chuyển tiền tệ, Thuyết minh |
| Báo cáo thuế                   | Tờ khai VAT, TNDN, TNCN                            |
| AI dự báo dòng tiền            | Dự báo thu chi theo tháng/quý                      |
| AI phân tích tài chính         | Insight tài chính tự động                          |
| Quản lý tài sản cố định cơ bản | Khai báo tài sản, khấu hao                         |
| Nhắc hạn kê khai thuế          | AI tự động nhắc lịch nộp thuế                      |

### Won't Have (v1.0)

- Phần mềm kế toán độc lập (mục tiêu là tích hợp với MISA, không thay thế)
- Lập ngân sách và kiểm soát ngân sách (Budgeting)
- Quản lý đầu tư tài chính

---

## 3. User Flows chính

### 3.1 Flow: Phát hành Hóa đơn điện tử

```
Nhân viên kế toán mở đơn hàng đã thanh toán
    → Tạo hóa đơn điện tử (tự động điền từ đơn hàng)
        → Kiểm tra thông tin: MST KH, hàng hóa, số tiền, thuế
            → Ký số hóa đơn (tích hợp nhà cung cấp hóa đơn)
                → Hệ thống gửi lên Tổng cục Thuế để xác thực
                    → Nhận mã hóa đơn của CQT
                        → Gửi hóa đơn PDF cho khách hàng qua email
                            → Lưu hóa đơn vào hệ thống
```

### 3.2 Flow: Đồng bộ MISA

```
Kế toán cấu hình kết nối MISA (API key, endpoint)
    → Mapping danh mục (tài khoản, khách hàng, hàng hóa)
        → Chạy đồng bộ thủ công hoặc tự động theo lịch
            → Hệ thống so khớp dữ liệu hai chiều
                → Báo cáo chênh lệch (nếu có)
                    → Kế toán xem xét và xử lý chênh lệch
                        → Xác nhận đồng bộ thành công
```

### 3.3 Flow: Đối chiếu Công nợ

```
Kế toán vào mục Công nợ phải thu
    → Lọc theo khách hàng / kỳ / trạng thái
        → Xem chi tiết: đơn hàng, số tiền, hạn thanh toán
            → Ghi nhận thanh toán (phiếu thu)
                → Hệ thống tự động đối chiếu
                    → Cập nhật số dư công nợ
                        → Gửi thông báo nhắc nợ tự động cho KH quá hạn
```

---

## 4. Business Rules quan trọng

- **BR-AC-001:** Hóa đơn điện tử sau khi ký số và gửi lên CQT không được xóa — chỉ được điều chỉnh/thay thế theo quy định pháp luật
- **BR-AC-002:** Bút toán trong kỳ đã khóa không được phép chỉnh sửa, phải tạo bút toán đảo và bút toán mới
- **BR-AC-003:** Tổng Nợ phải luôn bằng Tổng Có trong mỗi bút toán
- **BR-AC-004:** Phiếu chi vượt hạn mức cần phê duyệt từ cấp có thẩm quyền (cấu hình theo tenant)
- **BR-AC-005:** Dữ liệu kế toán phải lưu trữ tối thiểu 10 năm theo quy định pháp luật Việt Nam
- **BR-AC-006:** Thuế suất VAT được cấu hình theo từng loại hàng hóa/dịch vụ, hỗ trợ 0%, 5%, 8%, 10%
- **BR-AC-007:** Số hóa đơn điện tử theo ký hiệu mẫu số và ký hiệu hóa đơn đã đăng ký với cơ quan thuế

---

## 5. Tích hợp với phân hệ khác

| Phân hệ                          | Loại tích hợp | Mô tả                                                             |
| -------------------------------- | ------------- | ----------------------------------------------------------------- |
| **System Admin**                 | Phụ thuộc     | Cấu hình tenant, danh mục, phân quyền kế toán                     |
| **Sale & Logistics**             | Bidirectional | Đơn hàng → bút toán doanh thu; xuất kho → giá vốn; công nợ KH/NCC |
| **HR**                           | Read          | Dữ liệu tăng ca phục vụ tính lương                                |
| **AI Agent**                     | Bidirectional | AI gợi ý định khoản, phát hiện sai lệch, nhắc lịch thuế           |
| **Dashboard**                    | Read          | Dashboard tài chính: doanh thu, chi phí, công nợ, dòng tiền       |
| **MISA**                         | External API  | Đồng bộ dữ liệu kế toán hai chiều                                 |
| **eTax**                         | External API  | Kê khai thuế, nộp thuế điện tử                                    |
| **Nhà cung cấp hóa đơn điện tử** | External API  | Phát hành và tra cứu hóa đơn                                      |
