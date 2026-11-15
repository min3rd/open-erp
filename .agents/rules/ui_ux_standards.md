# Quy Chuẩn Thiết Kế UI/UX ERP (High-Density, Sharp & Anti-Modal)

## 1. Mật Độ Thông Tin Cao (High-Density & Compact Design)
- **Typography nhỏ gọn**:
  - Font chữ chuẩn cho nội dung bảng và form: `text-xs` (12px) hoặc `text-sm` (13px).
  - Tiêu đề nhóm / Section headers: `text-sm font-semibold uppercase tracking-wider`.
- **Khoảng cách & Lề thu gọn (Tight Spacing)**:
  - Sử dụng padding và margin nhỏ: `p-1`, `p-1.5`, `p-2`, `gap-1`, `space-y-1.5`.
  - Hạn chế tối đa các khoảng trắng dư thừa (empty whitespace).
- **Bảng dữ liệu đậm đặc (Dense Data Tables)**:
  - Chiều cao dòng chuẩn: `28px` đến `34px`.
  - Căn số sang phải, text sang trái, badge trạng thái nhỏ gọn.
  - Cấu trúc cuộn tối ưu: **cố định Header (`thead`) và Footer (`tfoot` / thanh phân trang - tổng hợp)**, chỉ cuộn phần nội dung dữ liệu (`tbody`) bên trong khung bảng (chi tiết tại Mục 7).

## 2. Thiết Kế Vuông Vắn & Hiện Đại (Sharp / Squared Aesthetic)
- **Góc cạnh sắc nét**:
  - Mặc định (và **bắt buộc cho giao diện mặc định**) sử dụng `rounded-none` hoặc tối đa `rounded-sm` (1px - 2px).
  - Nghiêm cấm phong cách bo tròn lớn (`rounded-xl`, `rounded-full`).
  - **Ngoại lệ theo theme**: từ Sprint 04, các theme thay thế (không phải mặc định) được phép dùng hình dạng bo góc khác qua bộ token dùng chung `ShapeVariant` (ví dụ `SOFT` với `rounded-md`), miễn **không dùng bo tròn lớn kiểu consumer** và **vẫn giữ mật độ thông tin cao**. Theme mặc định luôn là `SHARP`.
- **Đường viền mỏng tinh tế**:
  - Sử dụng viền sắc nét: `border border-neutral-200 dark:border-neutral-800`.
  - Tương phản rõ ràng giữa nền và viền.

## 3. Triết Lý Điều Hướng Không Dùng Modal & Lưu Vết Thao Tác (Route-Driven State)
- **Nghiêm cấm lạm dụng Modal popup che khuất màn hình**. Thay thế 100% bằng 3 giải pháp:
  1. **Angular Router (Nested Routes / Child Outlets & Query Params)**:
     - **Nguyên tắc lưu vết thao tác (Route-Driven State Invariant)**: Code Frontend bắt buộc phải sử dụng triệt để Angular Router để lưu vết mọi thao tác của người dùng.
     - **Các trạng thái bắt buộc phản ánh lên URL**:
       - Chọn Tab nghiệp vụ (ví dụ: `?tab=records`, `?tab=approvals`, `?tab=shifts`).
       - Phân trang & kích thước trang (ví dụ: `?page=2&size=20`).
       - Bộ lọc & tìm kiếm (ví dụ: `?type=LEAVE&status=PENDING&q=Nguyen`).
       - Mở Drawer biểu mẫu/chi tiết (ví dụ: `?drawer=new-request` hoặc route con `/requests/new`).
       - Bản ghi đang chọn trong Master-Detail / Split-view (ví dụ: `?selected_id=req-123` hoặc route con `/approvals/:id`).
       - Bước trong quy trình đóng công / Stepper (ví dụ: `?step=3`).
     - **Đồng bộ hai chiều (Bidirectional Sync)**:
       - Khi người dùng click tab, đổi filter, mở drawer: cập nhật URL qua `router.navigate([], { queryParams: { ... }, queryParamsHandling: 'merge' })`.
       - Khi người dùng F5 reload, dán deep-link hoặc bấm nút Back/Forward của trình duyệt: component đọc query params / route params từ `ActivatedRoute` để khôi phục chính xác 100% trạng thái giao diện.
       - Cấm lưu trạng thái điều hướng thuần túy trong biến component nội bộ (`signal()` cục bộ) mà URL không đổi.
  2. **Drawer (Side Sheet / Slide-over trượt từ cạnh phải)**:
     - Dùng xem nhanh chi tiết hoặc nhập biểu mẫu mà vẫn giữ trọn vẹn ngữ cảnh bảng danh sách bên trái.
     - Hỗ trợ **xếp chồng đa tầng (Stacked Drawers)**.
     - **Quy chuẩn chân Drawer (Drawer Footer Invariant)**: Thùng chứa footer của component `app-drawer` đã có sẵn style nền và viền chuẩn (`px-4 py-2.5 border-t border-default bg-surface-muted flex justify-end gap-2`). Thẻ chiếu nội dung `<div drawer-footer>` bắt buộc phải trong suốt (`bg-transparent`), chỉ chứa các lớp bố cục (`flex items-center gap-2`). **Tuyệt đối cấm gán thêm `bg-surface`, `bg-*`, `border-t`, `p-*`** bên trong `[drawer-footer]` vì sẽ tạo ra khối hộp màu đen/2 lớp viền lồng nhau kỳ dị xung quanh nút bấm.
  3. **Chia Màn Hình Đa Phần (Split-Screen / Multi-Pane Layout)**:
     - Chia màn hình thành các cột hiển thị song song (Master-Detail).

## 4. Quy Chuẩn Nhãn Thuần Khiết & Tách Biệt Biểu Tượng (Pure Semantic Labels & Icon Separation)
- **Cấm Emoji Unicode trong chuỗi văn bản**:
  - Tuyệt đối không nhúng các ký tự emoji (`⚠️`, `✓`, `✕`, `🔒`, `📍`, `⏱️`, `➕`, `📌`, `💡`...) vào bên trong chuỗi nhãn (label), văn bản nút bấm, thẻ form, tiêu đề hoặc badge.
  - Chuỗi văn bản hiển thị phải trang trọng, cô đọng, đúng chuẩn ngôn ngữ nghiệp vụ ERP sắc nét.
- **Biểu tượng (Icon) phải tách biệt hoàn toàn**:
  - Khi cần biểu tượng minh họa cạnh nhãn (ví dụ icon xác nhận, cảnh báo, vị trí, khóa), bắt buộc phải sử dụng icon component hoặc SVG độc lập, được định kiểu kích thước và màu sắc qua Design Tokens (`inline-flex items-center gap-1.5`).
  - Biểu tượng đồ họa không bao giờ được nằm lẫn bên trong chuỗi dịch i18n hoặc ghép thủ công cạnh chuỗi i18n trong template.

## 5. 100% Đa Ngôn Ngữ Cho Toàn Bộ Nhãn & Mọi Giá Trị Hiển Thị (Zero-Raw Display Values)
- **Nguyên tắc không có ngoại lệ (Zero Exceptions)**:
  - 100% nhãn nút bấm, nhãn input, tiêu đề cột của bảng, tab menu.
  - **100% giá trị trạng thái enum hiển thị**: Tạo mapping từ điển cho từng trạng thái (`enum.order_status.pending`, `enum.timesheet_status.locked`, `attendance.status.in_office`). Tuyệt đối không để text tiếng Anh thô như `LOCKED`, `ACTIVE`.
  - **100% chuỗi nội suy tham số**: Đưa toàn bộ định dạng chuỗi vào từ điển kèm `{param}` (ví dụ: `attendance.gps.outside_with_distance`), không dùng phép cộng chuỗi hoặc ghép text cứng trong template HTML / component TypeScript.
  - **100% thuộc tính ngữ cảnh & trợ năng**: `aria-label`, `title`, tooltip, placeholder và thông báo xác nhận (confirm popup).

## 6. Tối Giản Nhãn Mô Tả, Tối Ưu Diện Tích & Ưu Tiên Icon Kèm Tooltip (High-Density Tooltip Guidance)

- **Tối ưu hóa tối đa diện tích màn hình hiển thị (Screen Real Estate)**:
  - Giảm thiểu tối đa khoảng cách đệm và khoảng trắng không cần thiết, hiển thị nhiều dữ liệu nghiệp vụ nhất trên một khung nhìn mà không cần cuộn trang.
- **Hạn chế nhãn phụ, cấm subtitle/description dài dòng mặc định**:
  - Mỗi màn hình hoặc panel chỉ giữ **một tiêu đề ngắn gọn** và tối đa **một dòng mục đích** nếu thực sự cần.
  - Nghiêm cấm đặt các khối card/banner mô tả chính sách dài, các đoạn giải thích quy trình hoặc nhiều lớp subtitle chiếm hàng chục pixel quý giá trên thanh header/toolbar.
- **Chuyển toàn bộ mô tả chi tiết & hướng dẫn vào Tooltip khi hover chuột**:
  - Sử dụng các **Icon trực quan, chuẩn ngữ nghĩa** (`info`, `help-circle`, `shield`, `clock`, `calendar`, `filter`, `settings`...) đặt cạnh tiêu đề hoặc trường dữ liệu.
  - Khi người dùng hover chuột vào icon hoặc phần tử, hiển thị **Tooltip** (`title` hoặc tooltip component/directive) chứa đầy đủ nội dung giải thích, hướng dẫn, SLA hoặc điều kiện nghiệp vụ.
  - Chuỗi văn bản trong tooltip phải được dịch 100% qua file từ điển i18n (`{{ 'KEY' | translate }}`).
- **Bảng cấu hình phải dùng cột dữ liệu**:
  - Loại đơn, các cấp duyệt, SLA, trạng thái, hành động — không dùng mô tả dài trong từng dòng.
- **Kiosk / màn hình cảm ứng**:
  - Ưu tiên icon + `aria-label`, nhãn chữ ngắn; không hiển thị badge/notice kỹ thuật không cần thiết.
  - Tối ưu diện tích chạm, tránh card quá lớn hoặc khoảng trống dư thừa.

## 7. Quy Chuẩn Màn Hình Dữ Liệu & Bảng ERP Toàn Diện (Data View & Table Invariant)

Mọi màn hình hiển thị danh sách/dữ liệu nghiệp vụ và component bảng dùng chung (`@shared/*`) **bắt buộc** đáp ứng đồng bộ 2 nhóm tiêu chuẩn sau (tuyệt đối không cài thư viện table bên thứ 3):

### 7.1. Màn hình hiển thị dữ liệu (Configurable Data Views)
- **Lọc & Sắp xếp tùy biến (Filter & Sort)**:
  - Mọi màn hình dữ liệu đều phải có thanh/bộ lọc nhiều tiêu chí (tìm kiếm nhanh, lọc theo trạng thái/khoảng thời gian/loại...) và cơ chế sắp xếp (`ASC`/`DESC`) theo cột.
  - Mọi trạng thái lọc, sắp xếp, trang và kích thước trang **bắt buộc đồng bộ hai chiều lên URL** qua Angular Router (theo Mục 3 — Route-Driven State).
- **Tùy chỉnh hiển thị cột & số lượng hàng**:
  - Hỗ trợ người dùng **bật/tắt ẩn-hiện các cột** (kiểm soát số lượng cột hiển thị).
  - Hỗ trợ người dùng **thay đổi thứ tự các cột** hiển thị (kéo thả trực tiếp trên header cột hoặc sắp xếp lại thứ tự trong bảng cấu hình cột + nút **Khôi phục mặc định**).
  - Hỗ trợ chọn **số lượng hàng hiển thị mỗi trang** (ví dụ `20 / 50 / 100` dòng/trang) phù hợp mật độ màn hình.
  - Lưu bền vững cấu hình cột/mật độ theo màn hình/người dùng (`localStorage` hoặc user preference) để giữ nguyên thiết lập khi quay lại.

### 7.2. Thành phần Table (`@shared/*` Data Table Architecture)
- **Cố định Header & Footer — Chỉ Scroll Content bên trong**:
  - Khung bảng phải thiết kế `flex-col` / vùng cuộn độc lập sao cho **Header cột (`thead`) luôn cố định phía trên (`sticky top-0 z-10`)** và **Footer (`tfoot` tổng hợp / thanh phân trang - đếm bản ghi) luôn cố định phía dưới**.
  - **Chỉ vùng nội dung các dòng dữ liệu (`tbody` / container nội bộ)** được phép cuộn dọc (và cuộn ngang có kiểm soát khi vượt bề rộng), tuyệt đối không để cuộn cả trang làm trôi mất Header hoặc thanh phân trang.
- **Đổi thứ tự cột, Lọc & Sắp xếp trực tiếp trên Table**:
  - Cho phép click header cột để chuyển trạng thái sắp xếp (`NONE` → `ASC` → `DESC`), mở bộ lọc cột hoặc đồng bộ thanh filter, và đổi thứ tự cột trực tiếp.
- **Context Menu Bắt Buộc (Right-Click Row / Cell / Header Menu)**:
  - Mọi bảng dữ liệu nghiệp vụ bắt buộc hỗ trợ **Context Menu (`contextmenu`)** cung cấp đầy đủ các chức năng thao tác khả dụng (theo quyền của người dùng), bao gồm tối thiểu: Xem chi tiết / Mở Drawer, Sửa, Sao chép giá trị/mã, Thao tác nghiệp vụ (Duyệt/Từ chối/Khóa/Mở khóa...), Xóa/Lưu trữ, Lọc nhanh theo giá trị ô đang chọn, Sắp xếp, Cấu hình cột.
  - Context Menu phải tuân thủ **Zero-Emoji**, icon SVG độc lập, **100% i18n**, đóng bằng `Esc` hoặc click ra ngoài, tự định vị không tràn mép viewport; trên Mobile (`390x844px`) phải có nút hành động/menu chạm tối thiểu `>= 40px` thay thế thao tác chuột phải mà vẫn không tràn ngang (`overflow = 0`).
