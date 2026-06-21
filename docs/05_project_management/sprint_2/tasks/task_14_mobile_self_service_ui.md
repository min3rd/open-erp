# Tài liệu kỹ thuật chi tiết: TSK-2.14 - Giao diện Tự phục vụ & Phê duyệt nhanh nâng cao trên di động
## Phân hệ: Giao diện Người dùng Di động (Mobile Client UI - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng và nâng cấp cổng tự phục vụ nhân viên (Self-service Portal) và hộp thư phê duyệt nhanh trên ứng dụng di động (Ionic). Hỗ trợ nhân viên dễ dàng tạo mới đơn từ thông qua việc điền form động, xem tài liệu, và cho phép quản lý phê duyệt nhanh một chạm (Approve/Reject) kết hợp ký số xác thực bằng mã khóa bảo mật hoặc tích hợp sinh trắc học thiết bị (FaceID/TouchID).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Các màn hình & Luồng trải nghiệm di động (Mobile UX)
* **Cổng tự phục vụ di động (Self-service Portal):**
  - Màn hình chọn quy trình: Nghỉ phép, Tạm ứng, Đề xuất mua sắm...
  - Tự động lấy cấu trúc form động tương ứng để render giao diện nhập liệu tối ưu hóa cho màn hình cảm ứng di động.
  - Hỗ trợ tải ảnh chụp chứng từ trực tiếp từ Camera điện thoại.
* **Hộp thư duyệt nhanh (Quick Approval):**
  - Danh sách đơn cần duyệt rút gọn hiển thị các thông số quan trọng (Người yêu cầu, số tiền, deadline).
  - **Duyệt nhanh một chạm (One-touch / Swipe actions):** Hỗ trợ vuốt phải để phê duyệt nhanh (APPROVE), vuốt trái để từ chối nhanh (REJECT).
  - **Mật khẩu & Sinh trắc học ký số:** Khi phê duyệt, ứng dụng yêu cầu quét vân tay/khuôn mặt (Biometrics) hoặc nhập PIN để giải mã khóa riêng tư đã lưu trên thiết bị (hoặc gửi lên server ký số).

```text
[Mở ứng dụng Mobile] ──► [Hộp thư duyệt đơn] ──► [Vuốt phải duyệt đơn] ──► [Xác thực FaceID/TouchID] ──► [Đã Ký Số & Phê Duyệt]
```

#### 2.2 Đặc tả kỹ thuật di động
- Framework: Ionic (Angular) + Capacitor.
- Plugins sử dụng:
  - `@capacitor-community/biometric-auth` để giao tiếp với cảm biến sinh trắc học TouchID/FaceID.
  - `@capacitor/camera` để chụp ảnh chứng từ hóa đơn.
- Đồng bộ giao diện tối ưu hóa cho hiển thị trên iOS và Android với tone màu nhấn **Rose Gold (`#B76E79`)** và Dark Mode dịu mắt.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (hỗ trợ tích hợp và đảm bảo APIs hoạt động tối ưu với thiết bị di động).*

#### 3.2 Web Frontend Engineer (FE Web)
* *Không thuộc phạm vi trực tiếp.*

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Xây dựng Cổng tự phục vụ & Trình Render Form động trên Mobile**
  - Thiết kế màn hình tạo yêu cầu, tích hợp gọi danh mục quy trình.
  - Sử dụng Reactive Forms của Angular để sinh form động phù hợp với giao diện di động. Tích hợp plugin Camera chụp ảnh hóa đơn.
* **Nhiệm vụ 2: Triển khai Hộp thư duyệt nhanh và Ký số sinh trắc học**
  - Phát triển component duyệt nhanh bằng cử chỉ vuốt (Gesture swiping using Ionic Ion-Item-Options).
  - Tích hợp plugin `@capacitor-community/biometric-auth` để xác thực danh tính người dùng trước khi gọi API ký số.

#### 3.4 UI/UX Designer
* Cung cấp thiết kế giao diện di động cho cổng tự phục vụ, màn hình nhập liệu và các cử chỉ tương tác vuốt phê duyệt trực quan, dễ thao tác bằng một tay.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử di động:
  - Chạy ứng dụng trên giả lập iOS/Android, tạo mới yêu cầu, đính kèm ảnh chụp hóa đơn thành công.
  - Thực hiện vuốt để duyệt đơn -> Xác thực sinh trắc học thành công -> Đơn chuyển tiếp trạng thái chính xác.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Hạ tầng):** Đảm bảo thiết bị di động kết nối chung mạng Wifi với máy chủ phát triển Backend NestJS.
* **Bước 2 (Chạy App Mobile):** Khởi chạy Live-reload trên thiết bị thực hoặc giả lập:
  ```bash
  npx cap run android --livereload
  npx cap run ios --livereload
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Ứng dụng di động hoạt động mượt mà, không xảy ra xung đột plugin trên cả hai hệ điều hành Android và iOS.
* Tính năng tự phục vụ nhập đơn và duyệt nhanh qua vuốt cử chỉ hoạt động ổn định.
* Tích hợp thành công bảo mật vân tay/FaceID khi ký số phê duyệt.
* Đồng bộ 100% giao diện thương hiệu Rose Gold và chế độ đa ngôn ngữ.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
