# Tài liệu kỹ thuật chi tiết: TSK-1.10 - Màu sắc Rose Gold & Hiệu ứng Sao đêm lấp lánh
## Phân hệ: Hệ thống giao diện & Thẩm mỹ UI (Design System & Theme - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Cải tiến hệ thống màu sắc chủ đạo của ứng dụng (Web & Mobile) sang tone màu Hồng Ánh Vàng (Rose Gold) cao cấp và sang trọng. Nâng cấp các nút nhấn chính (Primary Buttons) và các thành phần tương tác quan trọng khác bằng cách bổ sung hiệu ứng "Sao đêm" (Starry Night / Sparkle Effect) lấp lánh ánh kim vàng chân thực thông qua CSS gradients, animations để mang lại trải nghiệm tương tác cao cấp và cuốn hút.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Bảng màu Rose Gold Ánh Kim nâng cấp (Metallic Rose Gold Palette)
Thay vì sử dụng màu hồng đơn thuần, hệ thống sẽ kết hợp giữa tone hồng phấn và nhũ vàng để tạo chiều sâu ánh kim loại. Bảng màu mở rộng trong Tailwind CSS:

```css
/* Khai báo biến CSS toàn cục trong root css */
:root {
  --color-rose-gold-gradient: linear-gradient(135deg, #B76E79 0%, #D4AF37 50%, #B76E79 100%);
  --color-star-gold: #FFDF00; /* Màu ánh kim vàng lấp lánh */
}
```

* **Màu nền nút bấm:** Sử dụng dải chuyển màu (Gradient) pha trộn giữa màu hồng vàng `#B76E79` làm chủ đạo, chuyển tiếp mượt mà qua các điểm nhấn màu nhũ vàng `#D4AF37` (hoặc `#E5A93B`) ở tâm để tạo độ bóng ánh kim.

#### 2.2 Kỹ thuật hiệu ứng "Sao đêm" lấp lánh (Starry Night Effect)
Hiệu ứng sao đêm lấp lánh được thiết lập bằng CSS thuần để tối ưu hiệu năng render:

* **Phương án 1: CSS Starry Sparkles on Hover (Hiệu ứng sao lấp lánh khi hover)**
  Sử dụng các pseudo-elements `::before` và `::after` kết hợp với kỹ thuật `background-image` dạng `radial-gradient` để tạo các hạt sao vàng nhỏ lấp lánh và chuyển động khi rê chuột.
* **Đoạn mã CSS mẫu tham khảo:**
  ```css
  .btn-starry-night {
    position: relative;
    background: var(--color-rose-gold-gradient);
    background-size: 200% auto;
    transition: background-position 0.5s ease, box-shadow 0.3s;
    overflow: hidden;
  }
  
  .btn-starry-night:hover {
    background-position: right center;
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
  }

  /* Tạo các điểm sao vàng phát sáng đè lên */
  .btn-starry-night::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
      radial-gradient(circle, var(--color-star-gold) 10%, transparent 11%),
      radial-gradient(circle, var(--color-star-gold) 15%, transparent 16%);
    background-size: 20px 20px, 30px 30px;
    background-position: 0 0, 15px 15px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .btn-starry-night:hover::after {
    opacity: 0.35;
    animation: sparkle-pulse 1.5s infinite alternate;
  }

  @keyframes sparkle-pulse {
    0% {
      background-position: 0 0, 15px 15px;
    }
    100% {
      background-position: 5px 10px, 20px 5px;
      filter: brightness(1.2);
    }
  }
  ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Nâng cấp Component Button trong Shared UI Library**
  - Chỉnh sửa `ButtonComponent` tại `open-erp-shared` để hỗ trợ thuộc tính (Input) `variant="starry"`.
  - Định nghĩa các class CSS tương ứng cho biến thể `starry` trong tệp style chung để toàn bộ các màn hình (như Đăng ký, Đăng nhập, Sơ đồ tổ chức) có thể tái sử dụng ngay lập tức bằng cách đổi thuộc tính.
* **Nhiệm vụ 2: Tích hợp hiệu ứng sao đêm lấp lánh**
  - Viết và tối ưu hiệu ứng chuyển động CSS keyframe cho các hạt sao lấp lánh mà không gây hiện tượng tụt FPS (Frame Per Second).

#### 3.2 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Triển khai hiệu ứng tương đương trên Ionic/Capacitor**
  - Tùy biến CSS của thẻ `<ion-button>` trong Mobile App bằng cách áp dụng biến CSS custom `background`, `box-shadow` và các thuộc tính tương tự như phiên bản Web.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

* **Bước 1 (Xem thử Component)**:
  - Khởi chạy ứng dụng Web để xem thử sự thay đổi trực tiếp trên các nút bấm của màn hình Đăng ký / Đăng nhập:
  ```bash
  npm run start --workspace=open-erp-web
  ```
* **Bước 2 (Kiểm tra CSS Performance)**:
  - Mở Chrome DevTools, chọn tab **Rendering** và bật **Paint flashing** để đảm bảo hiệu ứng sao đêm khi chạy chuyển động không gây repaint toàn bộ màn hình một cách lãng phí (chỉ sử dụng thuộc tính transform, opacity hoặc di chuyển vị trí background tối ưu).

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Hệ thống các nút bấm chính và thẻ hành động có màu hồng ánh vàng Rose Gold chuyển màu mượt mà.
  - Hiệu ứng sao đêm lấp lánh (Starry Night Effect) hiển thị bắt mắt, hoạt động chính xác khi hover/tương tác mà không làm giảm hiệu năng ứng dụng (đáp ứng 60FPS mượt mà).
  - Hoạt động đồng bộ trên cả 2 nền tảng Web Client và Mobile App.
  - Toàn bộ source code được tích hợp vào nhánh `develop`.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
Nhiệm vụ **TSK-1.10** đã được hoàn thành thành công và kiểm chứng hoạt động tốt trên cả Web và Mobile:
* **Mã nguồn Styles**: 
  - Khai báo các lớp `.rose-gold-gradient`, `.starry-night` và hiệu ứng `@keyframes starry-sparkle` trực tiếp tại [styles.css](../../../../open-erp-web/src/styles.css) (Web) và [global.scss](../../../../open-erp-mobile/src/global.scss) (Mobile).
* **Shared UI**:
  - Cập nhật [button.component.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/components/button/button.component.ts) để biến thể `primary` mặc định sử dụng gradient hồng vàng kim và hiệu ứng lấp lánh sao đêm khi tương tác.
* **Xác thực**:
  - Đã chạy biên dịch thành công hệ thống thư viện dùng chung (`npm run shared:build`) và web client (`npm run build --workspace=open-erp-web`).
