# [ANL-S04-005] Phân Tích Nghiệp Vụ: Thanh Loading Toàn Cục & Skeleton Theo Vùng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S04-005 / Phân tích / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) — R5 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md), [ANL-S04-004](04_ANL-S04-004_list_context_menu.md) / [ANL-S04-006](06_ANL-S04-006_i18n_language_expansion.md), [BENCH-S04-001](../03_benchmarks/01_BENCH-S04-001_design_system_motion_icons_ux_i18n.md) |

## 1. Bối cảnh

Yêu cầu gốc **R5**: "Thanh loading + skeleton cho từng vùng giao diện; mỗi vùng **load độc lập** để tăng trải nghiệm". Hiện tại phần lớn màn hình dùng một cờ `loading` chung và một dòng chữ `COMMON_LOADING`, nên một vùng chậm kéo cả màn hình chờ — kể cả những vùng đã sẵn dữ liệu.

## 2. Phạm vi

| Loại | Nội dung |
| :--- | :--- |
| **In-scope (đề xuất)** | Một `TopProgressBar` toàn cục; component `Skeleton`/`SkeletonTable` dùng chung; mô hình trạng thái vùng (idle/loading/empty/error/loaded); tách vùng load độc lập ở các màn gộp 1 call; a11y `aria-busy`/`aria-live`. |
| **Out-of-scope** | Thay đổi API nghiệp vụ; skeleton cho mọi màn (chỉ các màn trọng yếu đợt đầu); unit test frontend. |

## 3. Hiện trạng triển khai (Đã triển khai)

| Khu vực | Hiện trạng | Vấn đề UX |
| :--- | :--- | :--- |
| `shared/components/table/` | Input `loading` → render **một hàng** `COMMON_LOADING` | Không phản ánh hình dạng bảng; nhảy layout khi dữ liệu về |
| `organization.component.ts` | `forkJoin({branches, departments, memberships})` → **một** `loading` cho cả 3 vùng | Vùng chậm nhất chặn cả 3; xong mới gọi `applyDrawerMode` |
| `role-matrix.component.html` | 3 tín hiệu độc lập: `loadingRoles`/`loadingPermissions`/`loadingPolicies` | **Tiền lệ tốt**: mỗi vùng tự chờ riêng |
| `plugin-marketplace.component.html` | Một `loading()` cho toàn catalog; có khối `animate-pulse h-24` thô; `detailLoading` riêng cho Drawer | Khối pulse không đúng hình dạng nội dung; chưa phải skeleton |
| `shared/components/operation-progress/` | Component có sẵn cho vòng đời thao tác plugin (bước/trạng thái) | **Khác**: đây là tiến trình thao tác, không phải loading nạp dữ liệu |
| Thanh progress toàn cục | Không có | Không có tín hiệu khi điều hướng nhiều request |
| Skeleton theo hình dạng | Không có (chỉ vài khối pulse thô) | Nhảy layout, cảm giác chờ |
| `aria-busy` / `aria-live` | Không có trong mã nguồn | Trình đọc màn hình không biết trạng thái |

## 4. Nguyên tắc vùng load độc lập (đề xuất)

1. Mỗi vùng nội dung độc lập có **tín hiệu trạng thái riêng**; vùng chậm không được chặn vùng nhanh.
2. **Không nhân đôi HTTP** để tránh N+1: hoặc tách `forkJoin` thành các subscription độc lập, hoặc giữ một request nhưng phân giải dữ liệu theo vùng khi response về.
3. Lỗi một vùng **không** làm trắng cả trang; các vùng khác vẫn hiển thị.
4. Sau mutation, chỉ reload **vùng bị ảnh hưởng**.

## 5. Mô hình trạng thái vùng (đề xuất)

| Trạng thái | Ý nghĩa | Hiển thị |
| :--- | :--- | :--- |
| `idle` | Chưa bắt đầu nạp | Khung rỗng hoặc chưa render |
| `loading` | Đang nạp | Skeleton đúng hình dạng; `aria-busy="true"` |
| `empty` | Nạp xong, không có bản ghi | Thông điệp rỗng (i18n) |
| `error` | Nạp lỗi | Thông báo lỗi + nút thử lại; `role="alert"`/`aria-live` |
| `loaded` | Có dữ liệu | Nội dung thật |

Gợi ý định kiểu: signal `LoadState<T> = { status, data?, errorCode?, errorParams? }` trong `src/frontend/shared/models/`. Lỗi dùng `code`/`params` để tra từ điển, không hardcode message.

## 6. Skeleton theo loại component (đề xuất)

| Loại component | Hình dạng skeleton | Ghi chú |
| :--- | :--- | :--- |
| Bảng danh sách | N hàng × độ rộng cột ước lệ | Cao bằng hàng thật (28–34px); không nhảy layout |
| Thẻ (cards) | Lưới thẻ với các thanh xám | Dùng cho plugin/available items |
| Form | Các khối nhãn + ô nhập | Tránh nhảy khi field xuất hiện |
| Biểu đồ / graph | Khối chữ nhật cố định chiều cao | Organization graph là ví dụ |
| Chi tiết trong Drawer | Vài dòng text + khối | `detailLoading` hiện tại thay bằng skeleton |

Component chung: `SkeletonComponent` và `SkeletonTableComponent` tại `src/frontend/shared/components/skeleton/`, xuất qua `shared/index.ts`, dùng cho cả Web và Mobile.

## 7. Thanh progress toàn cục (đề xuất)

| Hạng mục | Đề xuất |
| :--- | :--- |
| Phạm vi tín hiệu | Đếm request đang bay (HTTP interceptor) + sự kiện điều hướng router |
| Hình thức | Thanh mảnh trên cùng (~2px), chạy khi có ≥ 1 hoạt động |
| Component | `TopProgressBarComponent` trong thư viện chung |
| Tương tác với skeleton | Thanh toàn cục cho biết "có hoạt động"; skeleton cho biết "vùng nào đang nạp" |
| Tránh trùng lặp | Không hiển thị thanh cho request tức thời (ngưỡng trễ); tránh "double spinner" với skeleton vùng |

## 8. Kỹ thuật wiring per region (đề xuất)

| Cách | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| A. Tách `forkJoin` → subscription độc lập | Mỗi vùng tự `.subscribe`, cập nhật tín hiệu riêng | Đúng cho vùng thật sự độc lập; tăng số request |
| B. Giữ một request, phân giải theo vùng | Callback gán từng phần khi response về | Giảm request nhưng vẫn chờ call chung |
| C. Kết hợp | Tách nơi độc lập, gộp nơi phụ thuộc | **Đề xuất** — chỉ tách vùng thật sự độc lập |

Với `organization`, branches/departments/memberships độc lập về dữ liệu → chọn A (3 vùng render riêng), nhưng giữ logic `applyDrawerMode` chờ dữ liệu cần thiết. Hủy request khi rời màn (destroy) để tránh cập nhật tín hiệu đã hủy.

## 9. Khả năng truy cập (đề xuất)

- Vùng đang nạp: `aria-busy="true"`.
- Skeleton: `aria-hidden="true"` để không đọc nội dung giả.
- Lỗi vùng: `role="alert"` (hoặc `aria-live="assertive"` cho lỗi), `aria-live="polite"` cho thông báo nạp xong.
- Nút "Thử lại" phải nhận focus được.

## 10. Hiệu năng & layout shift (đề xuất)

| Vấn đề | Giảm thiểu |
| :--- | :--- |
| Skeleton nháy cho response nhanh | Trễ hiển thị ~150–200ms; bỏ qua nếu dữ liệu về trước ngưỡng |
| Nhảy layout | Skeleton cố định chiều cao khớp nội dung thật |
| Quá nhiều request song song | Chỉ tách vùng độc lập; gộp phần phụ thuộc |
| Shimmer gây khó chịu | Tôn trọng `prefers-reduced-motion`; tắt hiệu ứng chuyển động |
| Bảng lớn | Giới hạn số hàng skeleton theo trang |

## 11. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Tách call làm tăng N request | Medium | Chỉ tách vùng độc lập thật; đo số request |
| Double spinner (bar + skeleton vùng) | Medium | Ngưỡng trễ; quy ước bar = toàn cục, skeleton = vùng |
| Skeleton sai hình dạng gây nhảy | Medium | Khớp kích thước nội dung thật; dùng chung component |
| Lỗi một vùng làm vỡ cả trang | High | Trạng thái lỗi cô lập theo vùng (BR-S04-502) |
| Tín hiệu cập nhật sau khi destroy | Medium | Hủy subscription khi rời màn |
| Hồi quy a11y | Low | `aria-busy`/`aria-live`; QA đọc màn hình thủ công |

## 12. Quyết định cần chốt (Confirmation)

| # | Câu hỏi mở | Nguồn |
| :---: | :--- | :--- |
| Q1 | Thanh loading dạng **top progress bar** toàn cục và/hoặc trong từng vùng? | RAW §4 Q6 — **✅ ĐÃ CHỐT 2026-10-05: trên cùng của trang (top progress bar), skeleton theo vùng** |
| Q2 | Danh sách màn ưu tiên tách vùng đợt đầu? | Mới |
| Q3 | Ngưỡng trễ skeleton (150ms/200ms/khác)? | Mới — **✅ ĐÃ CHỐT 2026-10-05: 150ms** |
| Q4 | Có cho phép hiển thị skeleton ở Drawer detail không? | Mới — *chưa hỏi riêng; đề xuất: có cho vùng dữ liệu nặng* |
| Q5 | Có cần "Thử lại" theo vùng hay chỉ thông báo lỗi? | Mới — **✅ ĐÃ CHỐT 2026-10-05: có nút "Thử lại" theo vùng** |

## 13. Chưa kiểm chứng

Đây là **phân tích Draft**, chưa phải scope/AC đã duyệt và **chưa có mã nguồn Sprint 04 nào được viết**. Ngưỡng hiệu năng, số vùng tách và hình thức thanh loading cần khách hàng xác nhận tại [Confirmation Gate](../00_READING_GUIDE.md#3-gate-riêng-biệt) (CONF-S04-001).
