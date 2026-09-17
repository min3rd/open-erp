# Quy Chuẩn Lập Trình Dự Án (Coding Standards & Best Practices)

Tài liệu này bắt buộc áp dụng cho tất cả Developer Agent và lập trình viên khi tham gia viết mã nguồn trong dự án `open-erp`.

---

## 1. Quy Chuẩn Backend: Quarkus (Java 21+)

### 1.1. Kiến Trúc & Cấu Trúc Gói (Package Structure)
```
com.openerp.<module_or_plugin>/
├── domain/            # Entities, Enums, Value Objects
├── repository/        # Panache Repositories
├── service/           # Business Logic & Interfaces
├── rest/              # REST Endpoints / Controllers
├── dto/               # Request & Response DTOs
└── event/             # Kafka Producers & Consumers
```

### 1.2. Quy Tắc Lập Trình Cốt Lõi
- **Bắt buộc ngữ cảnh `tenant_id`**: Mọi Entity phải kế thừa `TenantBaseEntity` có chứa trường `tenant_id`. Không bao giờ bỏ qua điều kiện `tenant_id` trong truy vấn.
- **Tách bạch Giao Dịch Đọc / Ghi**:
  - Tác vụ đọc (Query / Find / List): Sử dụng `@Transactional(readOnly = true)` để tự động định tuyến sang Read-Replicas.
  - Tác vụ ghi (Create / Update / Delete): Sử dụng `@Transactional`.
- **Sử dụng DTO**: Tuyệt đối không trả Entity trực tiếp ra API Response. Luôn ánh xạ qua DTO để bảo vệ thông tin nội bộ.
- **Dependency Injection**: Ưu tiên Constructor Injection hoặc `@Inject` trên field của bean `@ApplicationScoped`.

### 1.3. Tiêu Chuẩn Unit Test Backend (Bắt Buộc)
- **Công nghệ**: JUnit 5, RestAssured, QuarkusTest, Panache Mocking.
- **Bao phủ**: 100% logic nghiệp vụ tính toán (giá cả, thuế, chiết khấu), quy trình duyệt đơn, và phân quyền cô lập dữ liệu giữa các Tenant.
- **Kiểm thử Multi-Tenant**: Mọi service phải có test case xác nhận Tenant A không thể truy vấn hoặc cập nhật dữ liệu của Tenant B.

---

## 2. Quy Chuẩn Frontend: Angular 22 & Ionic 8

### 2.1. Kiến Trúc Hướng Component (Standalone & Signals)
- **100% Standalone Components**: Không sử dụng `NgModule`.
- **Quản lý trạng thái bằng Signals**: Sử dụng `signal()`, `computed()`, và `effect()` thay vì biến cục bộ thông thường hoặc lạm dụng `BehaviorSubject`.
- **Control Flow Mới**: Bắt buộc dùng `@if`, `@for`, `@switch` thay cho `*ngIf`, `*ngFor`.

### 2.2. Quy Chuẩn UI/UX ERP: Nhỏ Gọn, Vuông Vắn & Mật Độ Cao
- **Typography Nhỏ Gọn (Compact Typography)**:
  - Dữ liệu bảng, form nhập liệu: `text-xs` (12px) hoặc `text-sm` (13px).
  - Tiêu đề cột / nhãn form: `text-xs font-medium text-neutral-500`.
  - Tiêu đề section: `text-sm font-semibold`.
- **Đệm & Lề Tối Thiểu (Tight Spacing)**:
  - Hạn chế tối đa khoảng trống dư thừa.
  - Dùng `p-1`, `p-1.5`, `p-2`, `gap-1`, `gap-2`, `space-y-1.5`.
  - Chiều cao dòng bảng (table row): `h-7` (28px) đến `h-8` (32px).
- **Thiết Kế Vuông Vắn (Sharp & Square Aesthetic)**:
  - Sử dụng góc vuông hoặc bo góc siêu nhỏ: `rounded-none` hoặc `rounded-sm` (1px - 2px).
  - Không sử dụng bo tròn lớn (`rounded-lg`, `rounded-xl`, `rounded-full`).
  - Viền mỏng, sắc nét: `border border-neutral-200 dark:border-neutral-800`.
- **Hạn chế thư viện bên thứ 3**: Tự xây dựng component trên nền HTML5 + Tailwind 4, không cài thư viện UI nặng nề từ npm.

### 2.3. Triết Lý Điều Hướng Không Dùng Modal (Anti-Modal Pattern)
- **Hạn chế tối đa Modal**: Nghiêm cấm sử dụng Modal pop-up nổi giữa màn hình che khuất dữ liệu làm việc.
- **Cơ chế thay thế bắt buộc**:
  1. **Angular Router (Nested Routes)**: Dùng route con để mở chi tiết mà vẫn giữ URL và breadcrumb điều hướng.
  2. **Drawer (Side Sheet trượt từ cạnh phải)**:
     - Dùng cho tác vụ tạo mới nhanh, xem chi tiết hoặc chỉnh sửa.
     - Hỗ trợ **xếp chồng đa tầng (Stacked Drawers)** khi mở thêm dữ liệu liên quan từ trong drawer hiện tại.
  3. **Split-Screen (Chia màn hình đa cột)**:
     - Chia layout thành 2 hoặc 3 cột cố định (ví dụ: Master-Detail — danh sách bên trái 35%, chi tiết bên phải 65%).

### 2.4. Chính Sách Không Viết Unit Test Frontend (Zero-Unit-Test Policy)
- **Tuyệt đối KHÔNG viết Unit Test cho Frontend**: Không tạo các file `.spec.ts` cho Angular components hay Ionic pages (tránh lãng phí thời gian và chi phí bảo trì giòn gãy khi code bằng AI).
- **Quy trình Kiểm thử QA/QC**: Bắt buộc thực hiện **Kiểm thử thủ công trên Trình duyệt (Browser Manual Testing)** để kiểm tra tính toàn vẹn giao diện, sự mượt mà của Drawer, font chữ nhỏ gọn và tính đáp ứng đa màn hình.

---

## 3. Quy Chuẩn Git & Commit Message
Tuân thủ chuẩn [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(<scope>): <mô tả>` (Tính năng mới)
- `fix(<scope>): <mô tả>` (Sửa lỗi)
- `refactor(<scope>): <mô tả>` (Tái cấu trúc mã nguồn)
- `docs(<scope>): <mô tả>` (Cập nhật tài liệu)
- `test(<scope>): <mô tả>` (Bổ sung test case Backend)
