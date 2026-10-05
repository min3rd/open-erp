# [ANL-S04-002] Hệ Thống Motion & Animation — Phân Tích Yêu Cầu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S04-002 / Phân tích / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) |
| Đọc trước / đọc tiếp | [ANL-S04-001](01_ANL-S04-001_theme_system_and_design_tokens.md) · đọc tiếp [ANL-S04-003](03_ANL-S04-003_icon_system_feather.md) |

> Phân tích này chỉ chốt **cách hiểu yêu cầu** (R2) và các **góc nghiệm thu**. Mức độ animation, ngưỡng FPS/thời lượng chính thức và phạm vi chuyển trang chỉ có hiệu lực tại Confirmation Gate.

## 1. Bối cảnh

Yêu cầu R2: hiện tại component chỉ **ẩn/hiện tức thời**, cần chuyển động cho các trạng thái mở/đóng, xuất hiện, chuyển trang và phản hồi tương tác. Chuyển động tốt giúp người dùng hiểu "cái gì vừa thay đổi"; chuyển động kém (chậm, giật, xuất hiện ở mọi nơi) làm ERP cảm giác nặng nề hơn. Vì sản phẩm ưu tiên mật độ cao và thao tác nhanh, phân tích này đặt **kỷ luật chuyển động** lên ngang hàng với việc thêm chuyển động.

## 2. Phạm vi & ngoại lệ

| Trong phạm vi (đề xuất) | Ngoài phạm vi (đề xuất) |
| :--- | :--- |
| Từ vựng chuyển động dùng chung (thời lượng, easing, keyframe) trong thư viện shared. | Hoạt ảnh minh họa/illustration mang tính trang trí. |
| Enter/exit cho popup menu, drawer, list, feedback hành động, loading/skeleton. | Chuyển cảnh cấp ứng dụng theo kiểu "điện ảnh". |
| Quy tắc bắt buộc giảm chuyển động theo `prefers-reduced-motion`. | Tối ưu vi mô từng màn hình nghiệp vụ của plugin. |
| Ngân sách hiệu năng và cách phơi bày chuyển động qua input/enum của component. | Thư viện animation chạy JS. |

## 3. Hiện trạng triển khai (đã kiểm chứng)

- **Đã triển khai**: chưa có module animation của Angular — không có `BrowserAnimations`/`provideAnimations`/`@angular/animations` trong cấu hình.
- **Đã triển khai**: chuyển động hiện tại chỉ là CSS `transition-*`:
  - `transition-colors` ở hầu hết nút/menu/input.
  - `transition-transform` ở mũi tên user-menu (`rotate-180`) và knob của sharp-toggle.
  - Drawer panel có `transition-transform ease-in-out duration-300`, nhưng panel được dựng bằng `@if (isOpen())` nên **mount ra trạng thái cuối**, không có enter/exit thật.
- **Đã triển khai**: `animate-spin` cho spinner của sharp-button; `animate-pulse` cho chấm trạng thái của operation-progress.
- **Đã triển khai**: popup menu (user-menu, notification-bell, section-nav) dùng `@if` — xuất hiện/biến mất tức thời, không motion.
- **Đã triển khai**: danh sách (`@for`) không có enter animation.
- **Chưa có**: bất kỳ xử lý `prefers-reduced-motion` nào.

## 4. Danh mục chuyển động cần có (đề xuất)

| # | Ngữ cảnh | Trạng thái | Kiểu chuyển động gợi ý | Bắt buộc? |
| :---: | :--- | :--- | :--- | :---: |
| M1 | Popup menu (user-menu, notification-bell, section-nav) | Enter/Exit | Fade + trượt nhẹ xuống (opacity/translate) | Có |
| M2 | Drawer (one/tầng xếp chồng) | Enter/Exit | Trượt từ phải; tầng dưới dịch nhẹ | Có |
| M3 | Dòng danh sách/bảng | Enter | Fade/stagger **giới hạn** | Không (tùy màn) |
| M4 | Chuyển trang (route) | Transition | Fade ngắn, không trượt ngang | Cân nhắc |
| M5 | Loading theo vùng | Shimmer/skeleton | Nhấp nháy nhẹ, không nhấp nháy gây mỏi mắt | Có |
| M6 | Skeleton → nội dung | Crossfade | Mờ dần skeleton, hiện nội dung | Có |
| M7 | Phản hồi hành động (nút, lưu) | Feedback | Trạng thái loading/đã xong, không "nảy" | Có |
| M8 | Mở rộng/thu gọn (accordion, section) | Toggle | Chiều cao/opacity mượt | Cân nhắc |

## 5. Từ vựng chuyển động dùng chung (đề xuất, CSS-first)

Đề xuất **không** dùng thư viện animation chạy JS. Nguyên nhân: (1) quy định hạn chế tối đa thư viện bên thứ ba; (2) nhu cầu chuyển động ở đây nhỏ và lặp lại — CSS + vài keyframe dùng chung là đủ; (3) tránh thêm dependency runtime và tăng bundle.

| Token | Giá trị gợi ý | Dùng cho |
| :--- | :--- | :--- |
| `duration-fast` | ~100–150ms | Hover, feedback nhỏ |
| `duration-base` | ~180–220ms | Menu, drawer, crossfade |
| `duration-slow` | ~280–320ms | Chuyển vùng lớn (cân nhắc) |
| `ease-standard` | ease-out / ease-in-out | Đa số enter/exit |
| `ease-emphasized` | nhấn mạnh khi mở drawer (tùy chọn) | Drawer, menu chính |

- Chỉ dùng thuộc tính **GPU-friendly**: `transform` và `opacity`.
- Không animate `width/height/top/left/margin` (gây layout thrash).
- Keyframe dùng chung đặt cạnh tầng token ở `src/frontend/shared/`; component chỉ tham chiếu token, không tự định nghĩa thời lượng rời rạc.

> **Ví dụ minh họa (không phải thiết kế chốt)**: một lớp `@utility` hoặc class shared cho "enter menu" = `opacity-0 translate-y-1 → opacity-100 translate-y-0` với `duration-base`.

## 6. Giảm chuyển động (bắt buộc)

- **BR-S04-011**: Tôn trọng `prefers-reduced-motion: reduce` — **vô hiệu hóa mọi chuyển động không thiết yếu** (menu, stagger, route, crossfade trang trí).
- **BR-S04-012**: Chuyển động **thiết yếu** (ví dụ chỉ báo loading/tiến trình) được phép giữ ở mức tối giản nhưng không gây nhấp nháy mạnh; ưu tiên thay bằng chỉ báo tĩnh rõ ràng.
- **BR-S04-013**: Khi giảm chuyển động, **không được mất thông tin trạng thái** — người dùng vẫn phải biết thao tác đang chạy/đã xong qua chữ, màu hoặc icon.

## 7. Ngân sách hiệu năng (đề xuất)

| Hạng mục | Ngân sách gợi ý |
| :--- | :--- |
| Thuộc tính animate | Chỉ `transform`, `opacity` |
| Thời lượng tối đa cho một phản hồi tương tác | ≤ ~300ms |
| Danh sách lớn | **Không stagger toàn bộ**; giới hạn số dòng đầu (ví dụ ≤ 10–15) hoặc bỏ stagger khi > ngưỡng |
| Tần suất | Không chạy chuyển động trên mỗi lần điều hướng/refresh nếu không cần |
| Mục tiêu mượt | Giữ 60 FPS trên máy dev phổ thông; không giật khi cuộn bảng dày |

Stagger trên bảng ERP có thể có hàng nghìn dòng — đây là điểm dễ phá hiệu năng nhất; đề xuất coi stagger là **tùy chọn theo màn hình**, mặc định tắt.

## 8. Cách phơi bày trong thư viện dùng chung

- Chuyển động được cấu hình qua **input/enum của component** (ví dụ một `MotionVariant` gộp chung hoặc tận dụng `SizeVariant`), **không** để mỗi màn hình tự viết class chuyển động.
- Drawer/menu/notification sở hữu enter/exit của chính chúng; màn hình nghiệp vụ không tự nhân bản chuyển động.
- Mọi keyframe/thời lượng nằm ở tầng shared; component Web và Mobile dùng chung nguồn.

## 9. User Stories

- **US-S04-004**: Là người dùng, tôi muốn menu/drawer mở ra mượt để theo kịp thay đổi trên màn hình.
- **US-S04-005**: Là người dùng nhạy cảm với chuyển động, tôi muốn hệ thống tôn trọng cài đặt giảm chuyển động của tôi.
- **US-S04-006**: Là người dùng, tôi muốn thấy phản hồi rõ khi thao tác đang xử lý, không bị "đóng băng" mơ hồ.

## 10. Luồng & hành vi (đề xuất)

1. Component mở: phát enter animation ngắn; đóng: phát exit rồi mới tháo khỏi DOM (khác với `@if` hiện tại).
2. Khi `prefers-reduced-motion` bật: hiện/ẩn tức thời nhưng vẫn đúng ngữ nghĩa trạng thái.
3. Vùng dữ liệu tải: hiện skeleton (M5), khi xong crossfade sang nội dung (M6) — **độc lập theo vùng**, không chặn cả màn hình.
4. Điều hướng route: mặc định không hoặc chỉ fade rất ngắn; tránh hiệu ứng nặng.

## 11. Rủi ro

| # | Rủi ro | Mức | Giảm thiểu (đề xuất) |
| :---: | :--- | :---: | :--- |
| 1 | Cảm giác **ì/chậm** do animation quá nhiều/nhiều nơi | High | Ngân sách thời lượng + chỉ dùng ở trạng thái có nghĩa. |
| 2 | Animation **mỗi lần điều hướng** gây sốt ruột khi thao tác liên tục | High | Mặc định không chuyển trang; chỉ fade ngắn nếu cần. |
| 3 | Stagger **danh sách lớn** gây giật | High | Ngưỡng chặn; mặc định tắt. |
| 4 | Xung đột **page transition của Ionic** trên Mobile | Medium | Không tùy biến sâu transition Ionic; kiểm thử 390×844. |
| 5 | Bỏ qua `prefers-reduced-motion` gây vấn đề khả dụng | High | BR-S04-011 + kiểm thử có/không bật cài đặt. |
| 6 | Exit animation làm chậm thao tác (chờ trước khi đóng) | Medium | Giữ exit rất ngắn; không chặn tương tác kế tiếp. |
| 7 | Animate thuộc tính gây layout thrash | Medium | Chỉ `transform`/`opacity`. |

## 12. Góc nghiệm thu (chuyển Confirmation)

1. Có enter/exit cho menu và drawer; trạng thái mở/đóng rõ ràng.
2. `prefers-reduced-motion` tắt được chuyển động không thiết yếu mà không mất thông tin.
3. Không giật khi cuộn bảng dày; stagger (nếu có) bị chặn theo ngưỡng.
4. Chỉ dùng `transform`/`opacity`; không có animation gây layout thrash.
5. Thời lượng phản hồi tương tác nằm trong ngân sách thống nhất.
6. Web (≥1280px) và Mobile (390×844) đều mượt, không lỗi console.

### Câu hỏi mở (chốt tại Confirmation)

- Q1: Mức độ animation mong muốn và ngưỡng FPS/thời lượng chấp nhận chính thức? — **✅ ĐÃ CHỐT 2026-10-05 (Q6/Q9): animation nhanh, ưu tiên hiệu năng cao** (giữ ngân sách ≤ 220ms cho chuyển động thường).
- Q2: Có bắt buộc chuyển trang (route transition) không, hay chỉ fade ngắn? — **✅ ĐÃ CHỐT 2026-10-05 (Q18): có, nhẹ**.
- Q3: Danh sách có cần stagger không, và ngưỡng số dòng tối đa là bao nhiêu? — *chưa hỏi riêng; đề xuất: chỉ ≤ 20 hàng đầu*.
- Q4: Skeleton/loading theo vùng có thuộc phạm vi Sprint 04 (R5) hay tách riêng? — **✅ ĐÃ CHỐT: thuộc Sprint 04** (xem ANL-S04-005).

## 13. Chưa kiểm chứng

Mức độ animation, ngân sách hiệu năng, phạm vi chuyển trang và stagger là **đề xuất phân tích**, chưa được khách hàng phê duyệt. Mọi kết luận chỉ có hiệu lực sau **Confirmation Gate (bước 04)**; trước đó các mục ở mục 12 được coi là **Chưa kiểm chứng**.
