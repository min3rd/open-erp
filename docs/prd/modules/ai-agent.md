# PRD — Phân hệ AI Agent

# Trung tâm AI Điều phối Nghiệp vụ

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Sprint liên quan:** Sprint 13 (tích hợp toàn hệ thống), các sprint trước (tích hợp từng phân hệ)  
**Trạng thái:** Đang soạn thảo

---

## 1. Mục tiêu phân hệ

**AI Agent** trong Open ERP không phải là một phân hệ độc lập hoàn toàn — đây là **thành phần xuyên suốt** hoạt động trong tất cả các phân hệ, đóng vai trò:

> _"Trợ lý điều hành doanh nghiệp số — tự động hóa nghiệp vụ, hỗ trợ quyết định, và nâng cao hiệu suất vận hành."_

**AI Agent tập trung vào 5 nhiệm vụ chính:**

1. **Tự động hóa workflow:** Tự động thực hiện các bước nghiệp vụ lặp lại
2. **Phân tích và cảnh báo:** Phát hiện bất thường, cảnh báo sớm rủi ro
3. **Hỗ trợ ra quyết định:** Cung cấp insight, dự báo, đề xuất hành động
4. **Giao tiếp thông minh:** Trả lời câu hỏi nghiệp vụ bằng ngôn ngữ tự nhiên
5. **Tự động hóa báo cáo:** Sinh báo cáo, tóm tắt, biên bản tự động

---

## 2. Kiến trúc AI Agent

```
AI Agent Hub
├── Conversation Engine (LLM: OpenAI / Local LLM)
├── Tool Registry (danh sách công cụ theo phân hệ)
│   ├── System Admin Tools (user, permission, audit)
│   ├── Sale & Logistics Tools (order, inventory, shipping)
│   ├── HR Tools (employee, attendance, recruitment)
│   ├── Office Tools (task, document, meeting)
│   ├── Accounting Tools (voucher, invoice, report)
│   └── Dashboard Tools (KPI, analytics)
├── Memory & Context (lưu ngữ cảnh cuộc hội thoại)
├── RAG Engine (Retrieval-Augmented Generation — tra cứu tài liệu nội bộ)
└── Automation Scheduler (chạy workflow tự động theo lịch / trigger)
```

---

## 3. Tính năng chính theo MoSCoW

### Must Have

| Tính năng            | Mô tả                                                    |
| -------------------- | -------------------------------------------------------- |
| AI Chatbot nghiệp vụ | Hỏi đáp bằng ngôn ngữ tự nhiên về dữ liệu trong hệ thống |
| Nhắc việc thông minh | Nhắc deadline, phê duyệt tồn đọng, hạn hợp đồng          |
| Cảnh báo bất thường  | Phát hiện đăng nhập bất thường, giao dịch nghi ngờ       |
| AI tóm tắt           | Tóm tắt văn bản, biên bản họp, báo cáo dài               |

### Should Have

| Tính năng                   | Mô tả                                             |
| --------------------------- | ------------------------------------------------- |
| Tự động phân công công việc | AI gợi ý người xử lý phù hợp cho task             |
| AI dự báo                   | Dự báo doanh số, tồn kho, dòng tiền               |
| AI phân loại tự động        | Phân loại tài liệu, email, ticket                 |
| Sinh báo cáo tự động        | Báo cáo điều hành hàng tuần/tháng                 |
| AI gợi ý định khoản kế toán | Đề xuất bút toán dựa trên nội dung chứng từ       |
| Workflow automation         | Tự động chạy quy trình khi thỏa điều kiện trigger |
| AI sàng lọc CV              | Đánh giá và xếp hạng CV ứng viên                  |

### Could Have

| Tính năng           | Mô tả                                                 |
| ------------------- | ----------------------------------------------------- |
| AI đa phương thức   | Xử lý ảnh, scan tài liệu, OCR thông minh              |
| AI ghi biên bản họp | Tự động ghi và tóm tắt từ cuộc họp Jitsi              |
| RAG nội bộ          | Tra cứu thông tin từ tài liệu nội bộ của doanh nghiệp |
| AI sinh tài liệu    | Soạn thảo hợp đồng, công văn mẫu theo yêu cầu         |
| Tích hợp LLM nội bộ | Dùng Local LLM để bảo mật dữ liệu nhạy cảm            |

### Won't Have (v1.0)

- AI tự động thực hiện giao dịch tài chính (không có sự phê duyệt của người)
- AI thay thế hoàn toàn nhân sự trong quy trình phê duyệt
- AI tích hợp với hệ thống bên ngoài không được cấu hình trước

---

## 4. AI Agent theo từng phân hệ

### System Administration

- Phát hiện hành vi đăng nhập bất thường (IP lạ, giờ bất thường, quốc gia khác)
- Gợi ý phân quyền phù hợp theo chức danh và phòng ban
- Cảnh báo xung đột phân quyền (Segregation of Duties)
- Phân tích mức độ sử dụng hệ thống theo tenant

### Sale & Logistics

- Dự báo doanh số theo tháng/quý dựa trên dữ liệu lịch sử
- Cảnh báo thiếu hàng / tồn kho dư thừa theo ngưỡng cấu hình
- Gợi ý sản phẩm bán kèm (cross-sell / up-sell)
- Phân tích khả năng chốt đơn của từng lead
- Tối ưu tuyến giao hàng để giảm chi phí

### HR

- Sàng lọc CV tự động, chấm điểm phù hợp theo JD
- Cảnh báo nhân viên có nguy cơ nghỉ việc cao
- Phát hiện bất thường chấm công
- Gợi ý lộ trình phát triển nghề nghiệp
- Cân đối lịch làm việc tự động

### Office

- Tóm tắt nội dung cuộc họp và trích xuất action items
- Nhắc deadline thông minh theo độ ưu tiên và tải công việc
- Sinh văn bản mẫu (công văn, hợp đồng, biên bản)
- Gợi ý người xử lý công việc phù hợp

### Accounting

- Gợi ý định khoản kế toán từ nội dung chứng từ
- Phát hiện bút toán bất thường, sai lệch số liệu
- Nhắc lịch kê khai thuế, hạn nộp thuế
- Đối soát tự động giữa sao kê ngân hàng và phiếu thu/chi
- Dự báo dòng tiền theo tuần/tháng

---

## 5. Business Rules quan trọng

- **BR-AI-001:** AI chỉ được **đề xuất** hành động, không được tự thực hiện hành động có tác động tài chính hoặc nhân sự mà không có sự xác nhận của người dùng
- **BR-AI-002:** Mọi hành động AI thực hiện tự động (gửi email, tạo task, cập nhật trạng thái) phải được ghi vào audit log với nguồn là "AI Agent"
- **BR-AI-003:** Người dùng có thể xem lại lý do AI đưa ra đề xuất (explainability)
- **BR-AI-004:** Dữ liệu nhạy cảm (tài chính, nhân sự) chỉ được xử lý bởi AI trong tenant scope — không chia sẻ sang LLM public nếu không được cấu hình
- **BR-AI-005:** AI không được phép bypass quy trình phê duyệt (workflow approval)
- **BR-AI-006:** Tenant có thể tắt/bật tính năng AI cho từng phân hệ

---

## 6. Tích hợp với phân hệ khác

| Phân hệ            | Loại tích hợp | Mô tả                                                                         |
| ------------------ | ------------- | ----------------------------------------------------------------------------- |
| **Tất cả phân hệ** | Bidirectional | AI đọc dữ liệu từ tất cả phân hệ và có thể ghi lại hành động (qua API nội bộ) |
| **LangChain**      | Framework     | Orchestration framework cho AI Agent                                          |
| **OpenAI API**     | External      | LLM cho reasoning và generation                                               |
| **Local LLM**      | Optional      | Cho dữ liệu nhạy cảm cần bảo mật cao                                          |
| **Office / Jitsi** | Read          | Lấy transcript cuộc họp để tóm tắt và tạo biên bản                            |
