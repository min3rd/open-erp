# Tài liệu kỹ thuật chi tiết: TSK-0.7 - Mở rộng các UI Components (Phase 1: Core)
## Phân hệ: Thư viện giao diện dùng chung (Shared UI Library - Sprint 0)

---

### 1. Mục tiêu công việc (Objective)
Mở rộng thư viện UI dùng chung **`open-erp-ui`** với các components cốt lõi thuộc **Phase 1: Core** nhằm đáp ứng nhu cầu xây dựng giao diện nghiệp vụ phức tạp ở các Sprint tiếp theo. Các component này phải đảm bảo 100% độc lập, viết bằng cú pháp Angular mới nhất, hỗ trợ đầy đủ responsive, tối ưu hóa khả năng dịch đa ngôn ngữ bằng Transloco và hỗ trợ 2 giao diện sáng/tối (Light/Dark Mode) đồng bộ cùng thương hiệu Hồng Vàng (Rose Gold).

---

### 2. Danh sách các Component được xây dựng (Phase 1: Core)

#### 2.1 Textarea Component (`oerp-textarea`)
- **Mô tả:** Ô nhập dữ liệu dạng văn bản nhiều dòng (multi-line).
- **Inputs:**
  - `label` (string)
  - `placeholder` (string)
  - `control` (FormControl)
  - `rows` (number - mặc định: 3)
  - `errorMessage` (string)

#### 2.2 Checkbox Component (`oerp-checkbox`)
- **Mô tả:** Ô chọn dạng checkbox đơn lẻ hoặc danh sách nhóm.
- **Inputs:**
  - `label` (string)
  - `checked` (boolean)
  - `disabled` (boolean)
- **Outputs:**
  - `checkedChange` (boolean)

#### 2.3 Radio Component (`oerp-radio`)
- **Mô tả:** Nhóm lựa chọn một giá trị duy nhất trong danh sách.
- **Inputs:**
  - `name` (string)
  - `options` (Array<{ label: string, value: any }>)
  - `control` (FormControl)

#### 2.4 Switch Component (`oerp-switch`)
- **Mô tả:** Nút bật/tắt (toggle) trạng thái.
- **Inputs:**
  - `label` (string)
  - `checked` (boolean)
  - `disabled` (boolean)
- **Outputs:**
  - `checkedChange` (boolean)

#### 2.5 Select Component (`oerp-select`)
- **Mô tả:** Hộp chọn dropdown tùy biến giao diện.
- **Inputs:**
  - `label` (string)
  - `placeholder` (string)
  - `options` (Array<{ label: string, value: any }>)
  - `control` (FormControl)
  - `errorMessage` (string)

#### 2.6 Badge Component (`oerp-badge`)
- **Mô tả:** Nhãn trạng thái/số nhỏ nổi bật (ví dụ: Hoàn thành, Đang xử lý, v.v.).
- **Inputs:**
  - `label` (string)
  - `color` ('primary' | 'success' | 'warning' | 'danger' | 'info')

#### 2.7 Avatar Component (`oerp-avatar`)
- **Mô tả:** Ảnh đại diện hoặc chữ cái viết tắt của tên người dùng.
- **Inputs:**
  - `src` (string - url ảnh)
  - `name` (string - tên để lấy chữ cái đầu)
  - `size` ('sm' | 'md' | 'lg')

#### 2.8 Card Component (`oerp-card`)
- **Mô tả:** Khung chứa nội dung thông tin được phân nhóm rõ ràng.
- **Inputs:**
  - `title` (string)
  - `subtitle` (string)

#### 2.9 Tabs Component (`oerp-tabs`)
- **Mô tả:** Thanh điều hướng chuyển đổi tab nội dung trên cùng màn hình.
- **Inputs:**
  - `tabs` (Array<{ id: string, label: string }>)
  - `activeTabId` (string)
- **Outputs:**
  - `tabChange` (string - tabId được chọn)

#### 2.10 Alert Component (`oerp-alert`)
- **Mô tả:** Thanh cảnh báo hệ thống hiển thị thông điệp phản hồi nhanh.
- **Inputs:**
  - `title` (string)
  - `message` (string)
  - `type` ('success' | 'warning' | 'error' | 'info')

#### 2.11 Skeleton Component (`oerp-skeleton`)
- **Mô tả:** Khung giả lập hiển thị khi đang tải dữ liệu.
- **Inputs:**
  - `width` (string)
  - `height` (string)
  - `shape` ('line' | 'circle' | 'rect')

#### 2.12 Table Component (`oerp-table`)
- **Mô tả:** Bảng dữ liệu chuẩn có phân trang và tùy chọn padding compact.
- **Inputs:**
  - `headers` (Array<string>)
  - `data` (Array<any>)

#### 2.13 Pagination Component (`oerp-pagination`)
- **Mô tả:** Thanh điều hướng phân trang dữ liệu.
- **Inputs:**
  - `totalItems` (number)
  - `pageSize` (number)
  - `currentPage` (number)
- **Outputs:**
  - `pageChange` (number)

#### 2.14 Toast Component & Service (`oerp-toast`)
- **Mô tả:** Hộp thông báo popup trượt nhanh ở góc màn hình.
- **ToastService:** Cung cấp hàm `showSuccess()`, `showError()`, `showWarning()`, `showInfo()`.

---

### 3. Tiêu chí hoàn thành (Definition of Done - DoD)
* Toàn bộ các component được lập trình hoàn chỉnh bằng Angular Standalone.
* Đăng ký xuất bản đầy đủ ở [public-api.ts](./../../projects/shared-ui/src/public-api.ts).
* Thư viện `open-erp-ui` biên dịch thành công không phát sinh lỗi qua lệnh `npm run build`.
