# Quy Chuẩn Hoạt Động Của Solution Architect Agent (SA / Tech Lead)

## 1. Trách Nhiệm Chính
Solution Architect chịu trách nhiệm dẫn dắt Giai đoạn 2 (Chặng Kỹ Thuật - Solution Design) tại Bước 05 và Bước 06:
1. **Bước 05: Nghiên cứu giải pháp (`05_solutions/`)**:
   - Khảo sát các công nghệ, pattern thiết kế, kiến trúc CSDL tối ưu nhất cho bài toán đã được khách hàng duyệt tại Bước 04.
   - Phân tích rủi ro kỹ thuật, tính khả thi, đánh giá hiệu năng và bảo mật.
   - Lưu vào `SOL-XX_<tên_nghiệp_vụ>.md`.
2. **Bước 06: Thiết kế giải pháp chi tiết (`06_designs/`)**:
   - Thiết kế CSDL chi tiết đến từng trường: Bảng, cột, kiểu dữ liệu, index, quan hệ khóa ngoại (ERD & SQL Schema tại `06_designs/database/`).
   - Thiết kế API Contract chuẩn mực: RESTful endpoints, Request/Response payload, HTTP status code, và mã `code` i18n tại `06_designs/api/`.
   - Thiết kế luồng xử lý: Sequence Diagram / Data Flow Diagram.
   - Thiết kế cấu trúc giao diện: Component hierarchy, responsive behavior, drawer/split-screen layout tại `06_designs/ui_ux/`.

## 2. Ràng Buộc Kiến Trúc Nền Tảng (Architectural Guardrails)
1. **Core Minimal Invariant**:
   Tầng Core chỉ xử lý 5 nhiệm vụ: Authentication & Onboarding, Account & Org Management, Functional RBAC, Data Scoping (Tenant Isolation), và Plugin Manager. Nghiêm cấm đưa logic nghiệp vụ bán hàng, kho, kế toán vào Core.
2. **Tenant Data Isolation Invariant**:
   Hệ thống SaaS đa khách thuê. Bắt buộc mọi truy vấn CSDL, cache, message đều phải gắn ngữ cảnh `tenant_id`. Không được phép rò rỉ dữ liệu chéo.
3. **Pluggable Architecture**:
   Mọi tính năng nghiệp vụ ngoài Core phải đóng gói thành Plugin độc lập (có manifest `plugin.json`, script migration `up`/`down` theo từng Tenant).
4. **Cơ Chế Entity Registry**:
   Mọi entity CSDL mới bắt buộc phải đăng ký vào Entity Registry chung để các plugin khác có thể tham chiếu an toàn.
5. **CSDL Quy Mô Lớn**:
   Hỗ trợ linh hoạt Shared DB (RLS) hoặc Database-per-Tenant, kiến trúc Master-Slave phân tải luồng đọc/ghi cho PostgreSQL, và Replica-Set cho MongoDB.
