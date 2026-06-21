# Tài liệu kỹ thuật chi tiết: TSK-2.8 - API Sinh và quản lý Chứng thư số nội bộ
## Phân hệ: Ký số & Bảo mật chứng thư (PKI & Digital Signature - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng hạ tầng chứng thư số nội bộ (Internal PKI CA) trên hệ thống OpenERP. Thiết lập API tự động tạo chứng thư gốc (Self-signed Root CA), cơ chế tự động sinh cặp khóa riêng tư/công khai (Private/Public Keypair) và phát hành chứng thư số X.509 nội bộ được ký bởi Root CA cho từng người dùng, phòng ban, và doanh nghiệp (Tenant) để chuẩn bị cho việc ký số tài liệu.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Kiến trúc PKI nội bộ (Internal Certificate Authority)
Hệ thống sử dụng các thư viện tiền mã hóa chuẩn (như `node-forge` hoặc module `crypto` có sẵn của NodeJS) để thực hiện các thao tác PKI:
1. **Root CA Initialization (Khởi tạo Root CA):** Hệ thống tự tạo cặp khóa Root và Chứng thư tự ký (Self-signed Root Certificate). Khóa riêng tư của Root CA được mã hóa AES-256 bằng Master Key lưu trong biến môi trường bảo mật của Server.
2. **User/Dept Certificate Issuance (Cấp phát Chứng thư cho User):**
   - Khi người dùng yêu cầu, Server sinh cặp khóa RSA 2048-bit (hoặc ECDSA prime256v1).
   - Server đóng gói thông tin người dùng (Common Name = User Email, Organization = Tenant Name) thành yêu cầu chứng thư và dùng khóa riêng tư của Root CA ký duyệt phát hành chứng thư số X.509 có thời hạn (ví dụ: 1 năm).
   - **Bảo mật khóa riêng tư (Private Key Storage):** Khóa riêng tư của người dùng được mã hóa bằng mật khẩu của chính họ kết hợp muối (Salt) và lưu vào bảng `user_certificates`. Hệ thống không bao giờ lưu khóa riêng tư dưới dạng rõ (plaintext).

```text
[Hệ thống: Root CA Private Key]
              │
              ▼ (Ký duyệt phát hành)
[Yêu cầu cấp phát X.509 của User] ──► [Sinh Cặp khóa RSA 2048-bit] ──► [Lưu DB: Cert X.509 & Khóa riêng tư mã hóa AES]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/ca/certificates/issue`** (Authorized)
  - Yêu cầu cấp mới chứng thư số cho tài khoản đang đăng nhập.
  - **Payload yêu cầu:**
    ```json
    {
      "passphrase": "UserPasswordForEncryptingKey123!" // Dùng để băm và sinh key mã hóa khóa riêng tư
    }
    ```
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "data": {
        "certificateId": "uuid-cert-8888",
        "subject": "CN=nguyenvana@gotech.com, O=GoTech, C=VN",
        "validFrom": "2026-06-21T12:00:00Z",
        "validTo": "2027-06-21T12:00:00Z",
        "serialNumber": "16584294028409"
      }
    }
    ```

* **`GET /api/v1/ca/certificates/my`** (Authorized)
  - Trả về chứng thư công khai hiện tại của người dùng đang đăng nhập (PEM format) để hiển thị thông tin hoặc tải về.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai Lõi sinh CA (Root CA Engine)**
  - Viết Service khởi tạo Root CA một lần duy nhất khi hệ thống Setup thông qua `node-forge`.
  - Thiết lập lưu trữ Root Certificate và Root Private Key mã hóa an toàn.
* **Nhiệm vụ 2: Triển khai API cấp phát Chứng thư X.509**
  - Viết API tiếp nhận yêu cầu sinh khóa của User. Sử dụng luồng Worker phụ (worker_threads) để xử lý sinh cặp khóa RSA nhằm tránh nghẽn luồng xử lý chính của NodeJS.
  - Mã hóa khóa riêng tư (Private Key) của user bằng thuật toán `aes-256-cbc` trước khi ghi xuống bảng `user_certificates`.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Giao diện Yêu cầu cấp khóa**
  - Thiết kế màn hình tạo yêu cầu cấp phát chữ ký số, bắt buộc nhập mật khẩu xác nhận của tài khoản để kích hoạt quy trình sinh khóa phía backend.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi trực tiếp (chỉ kế thừa thông qua API để kiểm tra xem user đã có cert chưa).*

#### 3.4 UI/UX Designer
* Thiết kế hộp thoại tạo khóa mới và giao diện hiển thị các thông tin chứng thư (Common Name, thời hạn, tổ chức) trực quan, tin cậy.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm tra tính hợp lệ của chứng thư X.509 sinh ra bằng lệnh OpenSSL cục bộ.
  - Đảm bảo khóa riêng tư lưu trong DB đã được mã hóa (không đọc được trực tiếp bằng mắt).
  - Kiểm tra chứng thư phát hành có cấu trúc phân cấp đúng Root CA của OpenERP.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Thư viện):** Cài đặt thư viện mã hóa `node-forge`:
  ```bash
  npm install node-forge
  npm install --save-dev @types/node-forge
  ```
* **Bước 2 (Gỡ lỗi):** Chạy test sinh root và cert user:
  ```bash
  npm run test -- src/features/ca/ca.spec.ts
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hệ thống sinh thành công chứng thư gốc tự ký tin cậy.
* APIs cấp phát chứng thư số X.509 hoạt động ổn định, cấu trúc tệp PEM chuẩn hóa.
* Khóa riêng tư của người dùng được mã hóa an toàn trước khi lưu trữ vào database.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
- **Trạng thái:** [x] Hoàn thành (Done)
- **Kết quả bàn giao:**
  - Thực thể `SystemCa` và `UserCertificate` lưu trữ thông tin chứng thư gốc CA và chứng thư người dùng.
  - `CaService` tự động sinh Root CA khi hệ thống khởi tạo lần đầu và mã hóa Root Private Key bằng Master Key qua AES-256-cbc.
  - Luồng sinh khóa RSA 2048-bit bất đồng bộ qua `crypto.generateKeyPair` giải quyết triệt để vấn đề block Event Loop, sau đó ký chứng thư bằng Root CA và mã hóa Private Key của user bằng khóa phái sinh PBKDF2 từ passphrase của user.
  - REST APIs:
    - `POST /api/v1/ca/certificates/issue`: Tạo/Cập nhật chứng thư số cá nhân.
    - `GET /api/v1/ca/certificates/my`: Lấy chứng thư số công khai PEM của user hiện tại.
  - Bộ unit test `ca.spec.ts` kiểm thử toàn diện module CA đạt 100% passed.
