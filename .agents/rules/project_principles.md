# Các Nguyên Tắc Thiết Yếu Của Dự Án (Core Project Principles)

Tài liệu này định nghĩa các nguyên tắc phát triển phần mềm, quy chuẩn công nghệ và quy trình làm việc (workflow) bắt buộc phải tuân thủ trong suốt vòng đời phát triển của dự án Enterprise SaaS Platform.

---

## 1. Nguyên Tắc Công Nghệ (Technology Stack Principles)

Dự án bắt buộc phải sử dụng các phiên bản công nghệ mới nhất để đảm bảo hiệu năng và khả năng bảo trì lâu dài:

* **Backend:** Bắt buộc sử dụng phiên bản **NestJS mới nhất: 11** (hoặc mới hơn stable).
* **Frontend Web & Library:** Bắt buộc sử dụng phiên bản **Angular mới nhất: 22**.
* **CSS Framework:** Bắt buộc sử dụng phiên bản **Tailwind CSS mới nhất: 4**.
* **Đa Ngôn Ngữ (i18n):** Bắt buộc sử dụng thư viện **`@jsverse/transloco` mới nhất: 8**.

---

## 2. Nguyên Tắc Xử Lý Đa Ngôn Ngữ & Lỗi (Localization & Error Handling Principles)

Để đảm bảo hiệu năng mạng, khả năng mở rộng i18n và phân tách rạch ròi trách nhiệm (Separation of Concerns):

* **Trách nhiệm của Backend (NestJS):**
  - Backend **CHỈ** trả về các cấu trúc phản hồi dạng chuẩn chứa: `errorCode` (mã lỗi cụ thể), `messageKey` (key đại diện cho thông điệp lỗi để map với tệp dịch) và `data` (dữ liệu kèm theo).
  - Backend **TUYỆT ĐỐI KHÔNG** tự dịch thông điệp hoặc trả về các câu chữ thông điệp lỗi trực tiếp dạng ngôn ngữ tự nhiên đã biên dịch sẵn từ server.
* **Trách nhiệm của Frontend (Angular/Ionic):**
  - Frontend (Web/Mobile) nhận dữ liệu từ API và sử dụng thư viện **Transloco** để dịch động `messageKey` thành thông điệp hoàn chỉnh hiển thị cho người dùng dựa trên ngôn ngữ hiện tại của client.
  - Tất cả các text tĩnh hiển thị trên giao diện đều phải sử dụng thẻ/pipe của Transloco.

---

## 3. Quy Trình Làm Việc Tiêu Chuẩn (Standard Workflow Principles)

Mọi lập trình viên (bao gồm cả AI Coding Assistant) phải tuân thủ nghiêm ngặt quy trình làm việc khép kín sau:

1. **Đọc tài liệu (Read Docs):** Đọc kỹ các tài liệu thiết kế hệ thống, mô hình dữ liệu, API và các task spec liên quan trước khi viết code.
2. **Cập nhật tài liệu thiết kế (Update Docs):** Nếu phát hiện bất kỳ thay đổi, cải tiến nào so với thiết kế ban đầu, bắt buộc phải cập nhật trước vào các file tài liệu `.md` thiết kế liên quan.
3. **Thực hiện task (Execute Task):** Triển khai code theo đúng tài liệu và nguyên tắc đã thống nhất.
4. **Kiểm thử cục bộ (Local Testing):** Chạy và kiểm tra trực tiếp mã nguồn trên máy cá nhân (Dev Local) để xác nhận tính chính xác (build thành công, không lỗi lint/typescript, test pass).
5. **Cập nhật kết quả (Sync Results):** Cập nhật tiến độ vào danh sách công việc (`task.md`) và bổ sung các mô tả, hướng dẫn hoặc minh họa vào tài liệu tổng hợp thay đổi liên quan (`walkthrough.md`).

---

## 4. Cam Kết Tuân Thủ

> [!IMPORTANT]
> Toàn bộ các thành viên tham gia phát triển dự án phải luôn luôn đọc, hiểu và cam kết tuân thủ 100% các nguyên tắc trên. Bất kỳ sự sai lệch nào về phiên bản công nghệ hoặc quy trình làm việc đều không được chấp nhận.
