# Tài liệu kỹ thuật chi tiết: TSK-2.9 - API Ký số & Chứng thực chữ ký số trên phần mềm
## Phân hệ: Ký số & Bảo mật chứng thư (PKI & Digital Signature - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng phân hệ APIs ký số tài liệu và dữ liệu đơn từ trong phần mềm OpenERP. Cho phép người dùng sử dụng chứng thư cá nhân được cấp ở TSK-2.8 để ký số xác nhận lên payload dữ liệu đơn từ hoặc tệp tài liệu PDF kết xuất từ OnlyOffice. Triển khai API chứng thực chữ ký số giúp kiểm tra tính hợp lệ của chữ ký và tính toàn vẹn của nội dung tài liệu.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Luồng xử lý Ký số & Chứng thực (Signing & Verification Flow)
* **Quy trình Ký số (Signing Process):**
  - Khi người dùng chọn ký duyệt đơn, Client gửi yêu cầu kèm mật khẩu bảo vệ khóa (`passphrase`).
  - Backend tải khóa riêng tư đã mã hóa từ DB, dùng `passphrase` để giải mã khóa riêng tư thành plaintext trong bộ nhớ tạm (memory only).
  - Backend tính toán mã băm (hash) của tài liệu/payload đơn từ, dùng khóa riêng tư ký lên mã băm đó để tạo chữ ký số (Signature).
  - Chữ ký số và thông tin chứng thư (Certificate serial) được đính kèm vào bản ghi lịch sử phê duyệt (`workflow_logs`).
* **Quy trình Xác minh (Verification Process):**
  - Hệ thống lấy thông tin chứng thư số X.509 đính kèm chữ ký.
  - Kiểm tra xem chứng thư đó có phải do Root CA của OpenERP cấp hay không (Verify Certificate Chain).
  - Kiểm tra hạn hiệu lực của chứng thư tại thời điểm ký.
  - Sử dụng khóa công khai trích xuất từ chứng thư để xác minh tính chính xác của chữ ký so với nội dung tài liệu hiện tại (Verify Hash).

```text
[Dữ liệu đơn/File PDF] ──► [Tính Hash] ────────────────────► [Verify Signature] ──► Kết quả (Hợp lệ / Không hợp lệ)
                                                                    ▲
[Chữ ký số] ────────────────────────────────────────────────────────┤
                                                                    │
[X.509 Cert] ──► [Trích xuất Khóa công khai] ──► [Xác thực chuỗi CA]─┘
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/signatures/sign-instance`** (Authorized)
  - Thực hiện ký số dữ liệu của một instance quy trình phê duyệt.
  - **Payload yêu cầu:**
    ```json
    {
      "instanceId": "uuid-workflow-instance-111",
      "stepId": "uuid-step-1234",
      "passphrase": "UserPasswordForEncryptingKey123!"
    }
    ```
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "logId": "uuid-log-signature-5555",
        "signature": "MEUCIQDYi566x6r43S...",
        "signedAt": "2026-06-21T12:10:00Z"
      }
    }
    ```

* **`POST /api/v1/signatures/verify`** (Public/Authorized)
  - Xác thực chữ ký số đính kèm một đơn từ hoặc file.
  - **Payload yêu cầu:**
    ```json
    {
      "instanceId": "uuid-workflow-instance-111"
    }
    ```
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "isValid": true,
        "signedBy": "nguyenvana@gotech.com",
        "commonName": "Nguyễn Văn A",
        "verificationDetails": {
          "certificateChainValid": true,
          "contentIntact": true,
          "certExpired": false
        }
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Nghiệp vụ Giải mã Khóa riêng tư & Ký số**
  - Viết logic giải mã an toàn khóa riêng tư của người dùng bằng mật khẩu gửi lên (sử dụng `crypto.pbkdf2` để suy dẫn khóa từ mật khẩu).
  - Thực hiện ký mật mã học (SHA256withRSA hoặc ECDSA-SHA256) trên payload dữ liệu JSON hoặc file nhị phân PDF.
* **Nhiệm vụ 2: Engine Xác minh Chữ ký & Chứng thư**
  - Viết thuật toán kiểm tra chuỗi chứng thực (Certificate Path Validation) từ chứng thư người dùng ngược lên Root CA.
  - Xây dựng API verify tổng quát cho phép xác thực bất kỳ file PDF nào có nhúng chữ ký số nội bộ.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Form xác nhận ký số**
  - Xây dựng Modal popup yêu cầu nhập mật khẩu cấp phát khóa khi người dùng nhấn nút "Ký số phê duyệt".
  - Hiển thị thông tin kiểm tra chữ ký dưới dạng các biểu tượng huy hiệu trực quan (đạt chuẩn xác minh, tệp gốc nguyên vẹn).

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Ký số trên di động**
  - Tích hợp bảo mật sinh trắc học (FaceID/TouchID) hoặc mật khẩu mã hóa để thực hiện ký nhanh đơn từ trực tiếp trên ứng dụng di động Ionic.

#### 3.4 UI/UX Designer
* Mockup giao diện hiển thị lịch sử ký của tài liệu/đơn từ kèm dấu triện xác minh màu xanh lá hoặc đỏ cảnh báo.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm tra ký số thành công với mật khẩu đúng.
  - Kiểm tra báo lỗi khi nhập sai mật khẩu giải mã khóa riêng tư.
  - Kiểm thử xác minh chữ ký: giả lập sửa đổi dữ liệu JSON của đơn sau khi đã ký, chạy API verify, đảm bảo kết quả trả về `isValid: false` và chỉ rõ nội dung bị sửa đổi (`contentIntact: false`).

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1:** Đảm bảo đã chạy qua di chuyển DB và tạo đầy đủ chứng thư ở TSK-2.8.
* **Bước 2 (Unit Test):** Chạy test suite xác thực chữ ký:
  ```bash
  npm run test -- src/features/ca/signature.spec.ts
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* APIs ký số dữ liệu và xác thực chứng thư hoạt động đúng mật mã học.
* Phát hiện và từ chối 100% các trường hợp chữ ký bị sửa đổi nội dung hoặc chứng thư hết hạn.
* Unit test bao phủ logic ký và verify đạt tỷ lệ coverage trên 90%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
