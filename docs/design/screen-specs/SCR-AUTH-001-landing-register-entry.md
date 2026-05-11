# SCR-AUTH-001 — Landing / Register Entry

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                              |
| --------------- | -------------------------------------------------------------------- |
| Mã màn hình     | SCR-AUTH-001                                                         |
| Route           | /                                                                    |
| Luồng liên quan | Thu hút khách truy cập trước đăng ký                                 |
| Mục tiêu        | Giới thiệu giá trị sản phẩm và điều hướng vào đăng ký hoặc đăng nhập |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A (Header sticky): logo, menu điều hướng, CTA Đăng nhập, CTA Dùng thử.
- Vùng B (Hero): khối thông điệp giá trị bên trái, minh họa sản phẩm bên phải.
- Vùng C (Feature): lưới thẻ tính năng cốt lõi.
- Vùng D (Module): danh sách module nổi bật theo nghiệp vụ.
- Vùng E (Pricing/CTA): gói dùng thử và CTA đăng ký cuối trang.
- Vùng F (Footer): liên hệ, chính sách, liên kết tài liệu.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint   | Grid   | Vị trí thành phần chính                      | Khoảng cách chính                                   |
| ------------ | ------ | -------------------------------------------- | --------------------------------------------------- |
| >=1200px     | 12 cột | Hero 2 cột 6/6, Feature 4 cột, Pricing 3 cột | Container 1200px, gutter 24px, section spacing 96px |
| 768px-1199px | 8 cột  | Hero 2 cột 4/4, Feature 2 cột                | Container full, gutter 20px, section spacing 72px   |
| <768px       | 4 cột  | Hero 1 cột, Feature 1 cột, CTA full width    | Padding ngang 16px, section spacing 48px            |

## 3. Đặc tả component

| Component         | Vị trí      | Variant/State               | Dữ liệu đầu vào                   | Ràng buộc hiển thị                                             |
| ----------------- | ----------- | --------------------------- | --------------------------------- | -------------------------------------------------------------- |
| top-nav           | Vùng A      | default, scrolled           | menuItems, userState              | Sticky khi cuộn > 24px; trạng thái ẩn/hiện theo quyền truy cập |
| hero-content      | Vùng B trái | default                     | headline, subHeadline, ctaPrimary | Không vượt quá 2 dòng headline trên mobile                     |
| hero-illustration | Vùng B phải | static/animated nhẹ         | imageUrl                          | Ẩn nếu băng thông thấp hoặc lỗi tải ảnh                        |
| feature-card      | Vùng C      | default, hover              | title, description, icon          | Tối đa 6 thẻ; quá số lượng chuyển carousel trên mobile         |
| pricing-card      | Vùng E      | trial, standard, enterprise | planName, featureList, cta        | Chỉ hiển thị gói theo thị trường tenant                        |

## 4. Hành động và phản hồi UI

| Trigger                        | Xử lý                        | Phản hồi UI                                       |
| ------------------------------ | ---------------------------- | ------------------------------------------------- |
| Nhấn Dùng thử miễn phí         | Điều hướng đến /register     | Chuyển trang với loading bar đầu trang            |
| Nhấn Đăng nhập                 | Điều hướng đến /login        | Focus vào form đăng nhập                          |
| Nhấn mục menu trong trang      | Scroll đến section tương ứng | Smooth scroll 250ms, highlight mục menu hiện hành |
| Không tải được dữ liệu pricing | Fallback nội dung tĩnh       | Banner cảnh báo nhẹ, vẫn cho phép đăng ký         |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Animation xuất hiện theo tầng khi tải trang: Header -> Hero -> Feature (stagger 60ms).
- Hover card dùng transform nhẹ (dịch lên 4px) và shadow semantic.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: người dùng đọc thông tin, nhấn Dùng thử và sang SCR-AUTH-002.
- Validation error: không áp dụng cho form chính trên màn hình này.
- Permission: nếu tenant đã đăng nhập, CTA Dùng thử đổi thành Vào hệ thống.
- No-data: thiếu dữ liệu marketing thì fallback nội dung tĩnh.
- Offline: hiển thị thông báo mất kết nối, giữ CTA nội bộ nếu asset đã cache.

## 7. Dữ liệu hiển thị và quy tắc format

- Nội dung text dùng key i18n, không hard-code chuỗi theo ngôn ngữ.
- URL CTA lấy từ cấu hình môi trường theo kênh web/mobile web.
- Số liệu marketing (nếu có) định dạng theo locale tenant mặc định.
