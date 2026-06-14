# Tài liệu kỹ thuật chi tiết: TSK-0.6 - Khởi tạo các UI Components cơ bản
## Phân hệ: Thư viện giao diện dùng chung (Shared UI Library - Sprint 0)

---

### 1. Mục tiêu công việc (Objective)
Thiết lập và lập trình các thành phần giao diện người dùng (UI Components) cơ bản và tái sử dụng cao trong thư viện dùng chung **`open-erp-ui`** (nhãn npm alias `@open-erp/shared-ui`). Các component này làm nền tảng xây dựng các trang tính năng ở Sprint 1 trên cả 2 dự án Web Angular (`open-erp-web`) và Mobile Ionic (`open-erp-mobile`), đảm bảo đồng bộ 100% theme màu Hồng Vàng (Rose Gold) và khả năng chuyển đổi Light/Dark Mode.

---

### 2. Thiết kế chi tiết các Components cơ bản

#### 2.1 Cấu trúc thư mục thư viện
Các components được phát triển theo mô hình Standalone Component của Angular:
```text
open-erp-ui/projects/shared-ui/src/lib/components/
├── button/
│   ├── button.component.ts      # Logic component Button
│   └── button.component.css     # Style đặc thù (nếu có)
├── input/
│   ├── input.component.ts       # Logic component Input hỗ trợ validate và icon
│   └── input.component.css
└── modal/
    ├── modal.component.ts       # Hộp thoại Modal hiệu ứng kính mờ (glassmorphism)
    └── modal.component.css
```

#### 2.2 Đặc tả kỹ thuật & Hướng dẫn sử dụng các Component

##### A. Component Nút bấm (Shared Button Component)
* **Thuộc tính đầu vào (Inputs):**
  - `label` (string): Nhãn hiển thị trên nút (có thể truyền key dịch Transloco).
  - `variant` ('primary' | 'secondary' | 'danger'): Định dạng nút. `primary` mặc định áp dụng màu Rose Gold.
  - `disabled` (boolean): Trạng thái vô hiệu hóa.
  - `isLoading` (boolean): Hiển thị icon loading xoay tròn.
* **Cấu hình style Tailwind:**
  - *Light Mode Primary:* Nền Rose Gold `#B76E79` (`bg-rose-gold-500`), hover sang `#A45964` (`hover:bg-rose-gold-600`), chữ trắng.
  - *Dark Mode Primary:* Nền Rose Gold `#B76E79` (`dark:bg-rose-gold-500`), hover sang `#C27D87`, chữ trắng.
  - *Hiệu ứng transitions:* `transition-all duration-150 ease-in-out`.

##### B. Component Nhập liệu (Shared Input Component)
* **Thuộc tính đầu vào (Inputs):**
  - `label` (string): Nhãn của ô nhập liệu.
  - `type` (string): `text`, `password`, `email`, `number`...
  - `placeholder` (string): Text gợi ý trong ô.
  - `control` (FormControl): Đối tượng Reactive Form Control để binding dữ liệu và validation.
  - `errorMessage` (string): Thông báo lỗi khi validation fail (ví dụ: "Email sai định dạng").
* **Cấu hình style Tailwind:**
  - *Light Mode:* Nền trắng, viền xám Slate (`border-slate-200`), khi focus viền đổi sang màu Rose Gold (`focus:border-rose-gold-500`).
  - *Dark Mode:* Nền Slate sẫm (`dark:bg-slate-800`), viền Slate xám (`dark:border-slate-700`), khi focus viền đổi sang Rose Gold.

##### C. Hộp thoại Popup (Shared Modal Component)
* **Thuộc tính đầu vào (Inputs):**
  - `isOpen` (boolean): Trạng thái đóng/mở.
  - `title` (string): Tiêu đề hộp thoại.
* **Đặc tính giao diện:**
  - Sử dụng hiệu ứng **Kính mờ (Glassmorphism)** cho phần nền phủ (backdrop overlay): `backdrop-blur-sm bg-black/40`.
  - Hộp thoại nổi lên ở giữa màn hình hỗ trợ bo góc `rounded-2xl` và đổ bóng `shadow-2xl`.

---

### 3. Công việc chi tiết của Frontend Leads (FE Web & Mobile)
* **Nhiệm vụ 1: Lập trình các Component Standalone**
  - Viết code TypeScript Angular cho `button.component.ts`, `input.component.ts`, `modal.component.ts` trong thư viện `open-erp-ui`.
* **Nhiệm vụ 2: Xuất bản Public API**
  - Đăng ký và export toàn bộ các component này trong file `public-api.ts` để các dự án bên ngoài có thể import:
    ```typescript
    export * from './lib/components/button/button.component';
    export * from './lib/components/input/input.component';
    export * from './lib/components/modal/modal.component';
    ```
* **Nhiệm vụ 3: Build và test thử nghiệm**
  - Chạy lệnh `npm run build` để xuất bản package nội bộ sang thư mục `/dist/`.
  - Cấu hình file `tsconfig.json` của Web Angular và Mobile Ionic trỏ alias `@open-erp/shared-ui` về thư mục build `/dist/` và chạy thử để kiểm tra khả năng import.

---

### 4. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Mã nguồn 3 component (Button, Input, Modal) được viết hoàn chỉnh trong `open-erp-ui` và hoạt động ổn định.
  - Cả 3 component đều hỗ trợ responsive, Light/Dark mode, màu Hồng Vàng Rose Gold và hỗ trợ truyền key đa ngôn ngữ Transloco.
  - Cả 2 client Web và Mobile đều có thể import và render các component này thành công mà không phát sinh lỗi compile.
  - Toàn bộ source code được review, approve và merge vào nhánh `develop`.
