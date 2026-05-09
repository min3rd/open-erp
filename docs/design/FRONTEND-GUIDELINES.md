# Frontend Guidelines — Open ERP SaaS Platform

**Phiên bản:** 2.1  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** UI/UX Designer  
**Áp dụng cho:** Angular Web + Ionic Mobile  
**Tham chiếu:** [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) · [SCREEN-SPECS.md](SCREEN-SPECS.md)

---

## 1. Mục tiêu tài liệu

- Đồng bộ triển khai UI giữa web và mobile theo cùng thiết kế.
- Chuẩn hóa i18n bằng Transloco.
- Chuẩn hóa contract backend để FE render thông điệp đúng ngữ cảnh.
- Khẳng định định hướng Angular web dùng CSS, không dùng SCSS.

### 1.1 Quy chiếu bắt buộc cho FE agent

- Áp dụng mặc định cho mọi tác vụ FE agent trong `open-erp-web`; không cần lặp lại ràng buộc ở từng task frontend.
- FE agent phải tuân thủ tuyệt đối các quy định trong tài liệu này trước, trong và sau khi implement.
- Nếu có bất kỳ mâu thuẫn nào giữa task và tài liệu này: FE agent **MUST** dừng implement ngay, ghi rõ điểm mâu thuẫn vào task, và escalate cho Technical Leader để quyết định chính thức.
- FE agent **MUST NOT** tự ý bỏ qua hoặc nới lỏng quy định trong tài liệu này khi chưa có xác nhận bằng văn bản từ Technical Leader.

---

## 2. Quy định bắt buộc tuân thủ

Tất cả rule dưới đây là bắt buộc cho FE agent khi làm việc với Angular Web. Trừ khi có quyết định chính thức từ Technical Leader, các rule mang nhãn `MUST` và `MUST NOT` không được vi phạm.

### 2.1 TypeScript Best Practices

- `MUST`: Bật strict type checking ở toàn bộ dự án (`strict: true`) và giữ toàn bộ strict flags liên quan ở trạng thái bật.
- `MUST`: Khai báo kiểu tường minh cho input/output của hàm public, service API, model, DTO, state và signal.
- `MUST NOT`: Dùng `any`; nếu bắt buộc tạm thời, chỉ được dùng `unknown` kèm type guard rõ ràng.
- `MUST`: Dùng `readonly` cho dữ liệu không thay đổi và ưu tiên immutable update.
- `SHOULD`: Dùng union/discriminated union thay cho boolean flag mơ hồ.
- `MUST NOT`: Dùng non-null assertion (`!`) để "ép" compiler bỏ qua lỗi null/undefined nếu chưa xử lý dữ liệu đầu vào.

### 2.2 Angular Best Practices

- `MUST`: Dùng standalone architecture theo chuẩn Angular hiện hành.
- `MUST NOT`: Đặt `standalone: true` trong decorator; sử dụng cấu hình mặc định theo chuẩn project.
- `MUST`: Dùng Signals (`signal`, `computed`, `effect`) cho state nội bộ component khi phù hợp.
- `MUST`: Thiết lập Change Detection Strategy `OnPush` cho component hiển thị dữ liệu.
- `MUST`: Tổ chức lazy loading theo route-level để giảm initial bundle.
- `MUST NOT`: Dùng `@HostBinding` và `@HostListener`; thay bằng `host` metadata trong decorator.
- `MUST`: Dùng API hàm `input()` và `output()` cho component communication thay cho decorator legacy ở code mới.

### 2.3 Accessibility Requirements

- `MUST`: Đạt chuẩn WCAG 2.2 mức AA cho màn hình mới và màn hình được chỉnh sửa.
- `MUST`: Mọi control tương tác phải có accessible name hợp lệ (label, `aria-label`, hoặc `aria-labelledby`).
- `MUST`: Đảm bảo đầy đủ keyboard navigation (Tab/Shift+Tab, Enter/Space, Escape cho modal/dialog).
- `MUST`: Duy trì focus management đúng ngữ cảnh (mở modal, đóng modal, chuyển trang, submit lỗi).
- `MUST`: Chạy kiểm tra AXE trong quá trình QA FE; lỗi critical/blocker phải được xử lý trước khi chuyển review.
- `MUST NOT`: Chỉ dựa vào màu sắc để truyền đạt trạng thái lỗi/thành công/cảnh báo.

### 2.4 Components

- `MUST`: Component phải đơn nhiệm; tách smart/presentational khi logic dữ liệu và UI phức tạp.
- `MUST`: Dùng `input()`/`output()` với kiểu dữ liệu rõ ràng; không truyền object "túi đồ" không định nghĩa interface.
- `MUST`: Ưu tiên `changeDetection: ChangeDetectionStrategy.OnPush` cho mọi component trừ trường hợp đặc biệt đã được review.
- `MUST`: Dùng `NgOptimizedImage` cho toàn bộ static image render bằng `img`.
- `MUST NOT`: Nhúng business logic nặng trực tiếp trong component class hoặc template.
- `MUST`: Gắn `data-testid` hoặc `id` cho phần tử quan trọng phục vụ test tự động và manual test.

### 2.5 State Management

- `MUST`: Dùng Signals cho local state trong component.
- `SHOULD`: Với shared state phức tạp giữa nhiều feature, dùng store pattern nhất quán theo kiến trúc dự án.
- `MUST`: Mọi state async phải có đủ trạng thái `loading`, `success`, `empty`, `error`.
- `MUST NOT`: Mutate trực tiếp state object/array đang được bind vào UI; luôn tạo bản sao immutable khi cập nhật.
- `MUST`: Tách selector/computed state để template chỉ đọc state đã chuẩn hóa.

### 2.6 Templates

- `MUST`: Dùng native Angular control flow (`@if`, `@for`, `@switch`) cho code mới.
- `MUST NOT`: Dùng `ngClass` và `ngStyle`; thay bằng class/style binding tường minh.
- `MUST`: Ưu tiên `async` pipe khi bind Observable trong template; tránh subscribe thủ công chỉ để render.
- `MUST`: Giữ template thuần hiển thị, không viết logic rẽ nhánh phức tạp hoặc transform dữ liệu nặng trong template.
- `MUST`: Form nghiệp vụ phải dùng Reactive Forms; define validators rõ ràng theo SRS.
- `MUST`: Mọi text hiển thị phải đi qua i18n key (Transloco), không hardcode chuỗi trực tiếp.

### 2.7 Services

- `MUST`: Dùng `inject()` thay cho constructor injection trong code mới nếu không có ràng buộc đặc biệt.
- `MUST`: Service dùng toàn cục phải khai báo `providedIn: 'root'`.
- `MUST`: Service API phải khai báo kiểu response/request đầy đủ, map lỗi thống nhất theo contract backend.
- `MUST`: Tách rõ data-access service và facade/business service khi domain đủ lớn.
- `MUST NOT`: Đặt state trình bày (UI-only state) trong service dùng chung toàn app nếu không có nhu cầu chia sẻ thực sự.
- `MUST`: Đảm bảo service có chiến lược xử lý timeout/retry/fallback phù hợp với nghiệp vụ.

---

## 3. Quy ước bắt buộc cho Angular Web

### 3.1 Styling chuẩn Web

- Angular web dùng **CSS** cho toàn bộ component styles.
- Không tạo mới file `.scss` cho web.
- Global styles đặt trong `src/styles.css` và các file `.css` được import từ `styles.css`.
- Design tokens luôn dùng CSS custom properties `var(--token-name)`.

Cấu trúc đề xuất:

```text
src/
  styles.css
  styles/
    tokens.css
    typography.css
    layout.css
    utilities.css
```

### 3.2 Quy tắc token

- Không hardcode màu/spacing/radius trực tiếp trong component.
- Dùng token theo [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- Ưu tiên semantic token cho trạng thái: success, warning, error, info.

---

## 4. Internationalization với Transloco

### 4.1 Chuẩn thư viện

- FE dùng `@jsverse/transloco` (Transloco) làm chuẩn duy nhất cho i18n.
- Không dùng lẫn Angular built-in i18n và Transloco trong cùng màn hình.

### 4.2 Cấu trúc key

Quy ước key:

- `scope.screen.element.state`
- Ví dụ:
  - `auth.register.activation.sentTitle`
  - `auth.register.activation.resendCooldown`
  - `system.user.form.email.invalid`

### 4.3 Namespace đề xuất

- `common.*`
- `auth.*`
- `system.*`
- `modules.<moduleName>.*`
- `errors.*`

### 4.4 Quy tắc sử dụng

- Tất cả text hiển thị cho người dùng phải đi qua Transloco.
- Không hardcode chuỗi tiếng Việt trực tiếp trong template/component, trừ prototype tạm thời.
- Screen spec phải tham chiếu `messageKey` tương ứng khi có lỗi nghiệp vụ.

---

## 5. Contract Backend cho thông điệp UI

Backend trả về **key + metadata**, FE dùng Transloco để render.

### 5.1 Contract phản hồi đề xuất

```json
{
  "success": false,
  "code": "REGISTRATION_EMAIL_ALREADY_ACTIVATED",
  "messageKey": "errors.auth.register.activation.alreadyUsed",
  "metadata": {
    "email": "m***@company.com",
    "retryAfterSeconds": 60,
    "maxResendPerDay": 3
  },
  "fieldErrors": [
    {
      "field": "taxCode",
      "messageKey": "errors.auth.register.taxCode.invalid",
      "metadata": {
        "expected": "10_or_13_digits"
      }
    }
  ],
  "requestId": "req_01J..."
}
```

### 5.2 Quy tắc FE xử lý

- Ưu tiên render `messageKey` qua Transloco.
- Dùng `metadata` để nội suy biến động (email ẩn, số giây cooldown, giới hạn gửi lại).
- Với `fieldErrors`, map theo `field` để hiển thị lỗi inline đúng input.
- Nếu thiếu `messageKey`, fallback key mặc định `errors.common.unexpected`.

---

## 6. Định hướng UI Library dùng chung Web và Mobile

### 6.1 Mục tiêu

- Một bộ thiết kế và hành vi nhất quán giữa Angular web và Ionic mobile.
- Tách rõ lớp design token, component API, và adapter nền tảng.

### 6.2 Mô hình thư viện đề xuất

- `open-erp-ui-core`:
  - Token (màu, typography, spacing, motion)
  - Quy ước biến thể component
  - Spec hành vi và accessibility
- `open-erp-ui-web`:
  - Wrapper component cho Angular web (CSS-only)
- `open-erp-ui-mobile`:
  - Wrapper component cho Ionic/Angular mobile

### 6.3 Danh sách component parity ưu tiên

- Button
- Input/Textarea/Select
- Form field + inline validation
- Badge/Chip
- Modal/Drawer
- Toast/Alert
- Data card
- Empty state
- Skeleton/loading state

### 6.4 Quy tắc parity

- Tên variant thống nhất: `primary`, `secondary`, `ghost`, `danger`.
- Trạng thái thống nhất: `default`, `hover` (web), `focused`, `disabled`, `error`, `loading`.
- Mapping nền tảng chỉ khác ở rendering engine, không khác behavior nghiệp vụ.

---

## 7. Cập nhật đặc biệt cho flow đăng ký DN

- Luồng đăng ký DN dùng **activation link qua email**, không dùng OTP nhập tay.
- Các màn hình liên quan:
  - `SCR-AUTH-002`
  - `SCR-AUTH-003`
  - `SCR-AUTH-004`
  - `SCR-AUTH-005`
  - `SCR-AUTH-006`
- CTA gửi lại email kích hoạt phải hỗ trợ cooldown và giới hạn số lần theo metadata backend.

---

## 8. Checklist trước khi bàn giao UI

- [ ] Màn hình dùng đúng mã SCR và đúng flow.
- [ ] Web không dùng SCSS mới, chỉ dùng CSS.
- [ ] 100% text đi qua Transloco key.
- [ ] Xử lý đầy đủ contract `messageKey + metadata + fieldErrors`.
- [ ] Thành phần UI dùng đúng parity với thư viện dùng chung web/mobile.
- [ ] Kiểm thử responsive desktop/tablet/mobile theo screen spec.
