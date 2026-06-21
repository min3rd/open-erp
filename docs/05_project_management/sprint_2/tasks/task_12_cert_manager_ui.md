# Tài liệu kỹ thuật chi tiết: TSK-2.12 - Giao diện quản lý Chứng thư số & Ký số (Web)
## Phân hệ: Giao diện Người dùng (User Web UI - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng giao diện Web cho phép từng nhân viên hoặc phòng ban quản lý chứng thư số cá nhân của mình. Cung cấp tính năng yêu cầu cấp phát khóa mới, xem thông tin chi tiết chứng thư (thời hạn, nhà phát hành, mức độ tin cậy), thực hiện ký số thử nghiệm và hiển thị trạng thái xác thực trực quan của chữ ký trên các tài liệu đơn từ.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Thành phần Giao diện & Tính năng
* **Trang Quản lý Chứng thư số (My Certificates):**
  - Hiển thị trạng thái chứng thư hiện tại: *"Chưa có chứng thư"* hoặc *"Hoạt động"* (Màu xanh Rose Gold) / *"Hết hạn"* (Màu xám) / *"Bị thu hồi"* (Màu đỏ).
  - Nút *"Tạo chứng thư mới"*: Kích hoạt Modal popup hướng dẫn tạo cặp khóa cá nhân, yêu cầu nhập mật khẩu bảo mật (passphrase) hai lần để xác thực.
  - Hiển thị chi tiết: Tên cá nhân (CN), Phòng ban (OU), Doanh nghiệp (O), Quốc gia (C), Serial Number, Thời gian hiệu lực.
  - Hỗ trợ tải tệp chứng thư công khai (.crt/PEM) về máy tính cá nhân.
* **Component Huy hiệu Chứng thực (Verification Badges):**
  - Hiển thị ở cuối mỗi đơn từ đã được ký số.
  - Màu xanh Rose Gold/Xanh lá kèm biểu tượng khi xác thực thành công. Nhấp vào hiển thị popup chi tiết quá trình kiểm tra (Root CA hợp lệ, dữ liệu nguyên vẹn).

```text
┌────────────────────────────────────────────────────────┐
│ [Huy hiệu] Chứng thư số nội bộ hợp lệ                  │
│ Người ký: Nguyễn Văn A                                 │
│ Ngày ký: 21/06/2026 12:10                              │
│ Trạng thái: Toàn vẹn dữ liệu (Chưa bị chỉnh sửa)        │
└────────────────────────────────────────────────────────┘
```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (hỗ trợ và kiểm tra tích hợp các APIs ký số từ TSK-2.8 và TSK-2.9).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Giao diện Quản lý Chứng thư số cá nhân**
  - Xây dựng component `CertificateManager` hiển thị trạng thái và thông tin chứng thư.
  - Tích hợp modal điền passphrase và gọi API phát hành chứng thư mới.
* **Nhiệm vụ 2: Tích hợp Huy hiệu Xác minh Chữ ký số**
  - Xây dựng component `SignatureVerificationBadge` nhận vào kết quả kiểm tra chữ ký từ API để hiển thị trạng thái bảo mật của tài liệu (đã xác thực thành công hoặc bị giả mạo).

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi trực tiếp (được phân tách riêng ở TSK-2.14 cho phần di động).*

#### 3.4 UI/UX Designer
* Thiết kế huy hiệu chữ ký số (Digital Stamp) và layout hiển thị chứng thư mang tính trang trọng, bảo mật và tinh tế.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Tạo mới chứng thư cá nhân thành công -> Hiển thị đúng thông tin của tài khoản hiện tại.
  - Ký thử tài liệu -> Huy hiệu đổi thành trạng thái "Đã ký số".
  - Giả lập chứng thư bị hết hạn hoặc sai lệch hash -> Huy hiệu báo lỗi đỏ.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Web):** Chạy Web Client local:
  ```bash
  npm run start
  ```
* **Bước 2 (Gỡ lỗi):** Theo dõi console và gọi API trực tiếp để tạo mock data chứng thư kiểm chứng UI render ở các trạng thái khác nhau (Active, Expired, Revoked).

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Người dùng có thể tự tạo mới và quản lý vòng đời chứng thư cá nhân dễ dàng.
* Huy hiệu chứng thực hiển thị chính xác trạng thái an toàn mật mã của đơn từ.
* Giao diện chuẩn phong cách Rose Gold, đầy đủ đa ngôn ngữ.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
