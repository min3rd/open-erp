# [ANL-S04-004] Phân Tích Nghiệp Vụ: Context Menu Cho Danh Sách (Chuột Phải Desktop)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S04-004 / Phân tích / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) — R4 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md), [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) / [ANL-S04-005](05_ANL-S04-005_loading_bar_and_skeletons.md), [ANL-S04-006](06_ANL-S04-006_i18n_language_expansion.md), [BENCH-S04-001](../03_benchmarks/01_BENCH-S04-001_design_system_motion_icons_ux_i18n.md) |

## 1. Bối cảnh

Yêu cầu gốc **R4**: "Context menu ở danh sách để tối đa trải nghiệm như desktop (chuột phải)". Trước Sprint 04, mọi danh sách đều đặt nút thao tác trực tiếp trong từng hàng. Với bảng mật độ cao (hàng 28–34px theo `ui_ux_standards`), việc này:

- Chiếm chiều ngang đáng kể cho cột "Actions" và làm hàng bị nén.
- Phình số nút lặp lại trên mỗi hàng, tăng nhiễu thị giác và chi phí bảo trì.
- Khác biệt với kỳ vọng desktop (chuột phải để mở thao tác theo ngữ cảnh).

Context menu ở đây là **lối tắt (accelerator)**, không thay thế cấu trúc anti-modal: mọi thao tác chi tiết/biểu mẫu vẫn mở bằng **Drawer** hoặc **router** (xem mục 3).

## 2. Phạm vi

| Loại | Nội dung |
| :--- | :--- |
| **In-scope (đề xuất)** | Một component `ContextMenu` + service dùng chung trong `src/frontend/shared/`; gắn vào các màn danh sách trọng yếu (roles, members, plugins, organization, các danh sách sample). Phân loại hành động, phân quyền, bàn phím/a11y, vị trí/flip. |
| **Out-of-scope** | Nghiệp vụ/API mới; thay thế Drawer/route; chặn menu trình duyệt ngoài phần tử được gắn; chốt hành vi Mobile (thuộc Confirmation). |
| **Tác nhân** | Người dùng Web desktop (chuột + bàn phím); người dùng Mobile (màn danh sách, chờ chốt parity). |

## 3. Hiện trạng triển khai (Đã triển khai)

| Khu vực | Hiện trạng | Nguồn |
| :--- | :--- | :--- |
| `role-matrix.component.html` | Nút/link "Sửa", "Xóa" nội tuyến mỗi hàng role; gate bằng `*appRequirePermission` | `src/frontend/web/src/app/features/settings/roles/role-matrix.component.html` |
| `members.component.html` | Nút "Sửa"/"Xóa" nội tuyến mỗi hàng; xác nhận xóa là **thanh xác nhận nội tuyến** (không modal) | `src/frontend/web/src/app/features/settings/members/members.component.html` |
| `plugin-marketplace.component.html` | Thẻ plugin có nút hành động (enable/disable/upgrade/uninstall) trên từng thẻ | `src/frontend/web/src/app/features/settings/plugins/plugin-marketplace.component.html` |
| `shared/components/table/` | Chỉ render header + row template + trạng thái loading/empty; **không có API tương tác hàng** | `src/frontend/shared/components/table/table.component.html` |
| `shared/components/drawer/` | Drawer xếp chồng, trap focus, Escape, khôi phục focus — **vẫn là bề mặt detail/edit** | `src/frontend/shared/components/drawer/drawer.component.ts` |
| Listener `contextmenu` | **Không tồn tại** trong mã nguồn frontend | grep `contextmenu|oncontextmenu` = 0 |

Kết luận hiện trạng: **Đã triển khai** mô hình nút nội tuyến; **chưa** có bất kỳ hạ tầng context menu nào.

## 4. User Story (đề xuất)

| ID | Với vai trò | Mong muốn | Để |
| :--- | :--- | :--- | :--- |
| US-S04-401 | Người dùng desktop | Chuột phải một hàng danh sách để mở menu thao tác theo ngữ cảnh | Thao tác nhanh không cần quét cột Actions |
| US-S04-402 | Người dùng bị giới hạn quyền | Chỉ thấy mục menu tôi được phép | Không bị dẫn tới hành động rồi thất bại 403 |
| US-S04-403 | Người dùng bàn phím | Mở menu bằng Shift+F10 / phím ContextMenu, điều hướng bằng phím | Dùng được không cần chuột |
| US-S04-404 | Người dùng Mobile | Có lối vào thao tác tương đương (long-press và/hoặc nút hiển thị) | Thao tác được trên cảm ứng |
| US-S04-405 | Developer | Dùng một component menu chung, cấu hình bằng dữ liệu | Không viết menu ad-hoc cho từng màn |

## 5. Phân loại hành động & ánh xạ bề mặt (đề xuất)

| Hành động | Icon Feather (đề xuất) | Bề mặt mở ra (anti-modal) | Quyền ví dụ |
| :--- | :--- | :--- | :--- |
| Xem | `eye` | Drawer detail hoặc route detail (`/…/:id`) | `core:*:read` |
| Sửa | `edit-2` | Drawer form hoặc router con (`/…/:id/edit`) | `core:*:manage` |
| Nhân bản | `copy` | Drawer form chế độ tạo, prefill từ hàng | `core:*:manage` |
| Xuất | `download` | Gọi API export, nhận `code`/`params` để hiển thị | `core:*:export` |
| Xóa | `trash-2` | Bề mặt xác nhận nội tuyến (như thanh xác nhận members hiện có) | `core:*:manage` |
| Chia sẻ | `share-2` | Sao chép deep link của route chi tiết | `core:*:read` |
| Bật/Tắt (plugin) | `toggle-*` | Gọi hành động trạng thái hiện có | `core:plugin:manage` |

Ghi chú: tên icon là gợi ý, chốt chính thức thuộc ANL-S04-003 (Icon Feather) theo [00_READING_GUIDE](../00_READING_GUIDE.md). Menu không chứa logic nghiệp vụ mới — nó gọi lại các handler hiện có (`openEditX`, `askDeleteX`…).

## 6. Quy tắc nghiệp vụ (đề xuất)

| ID | Quy tắc | Mức |
| :--- | :--- | :--- |
| BR-S04-401 | Context menu là **lối tắt**; mỗi hành động phải còn một lối vào hiển thị tương đương để không phụ thuộc chuột phải. | Quy định |
| BR-S04-402 | Mục menu **ẩn** khi người dùng thiếu quyền, nhất quán `RequirePermissionDirective` (ẩn trước thay vì hiện-rồi-403). Phương án "disable kèm lý do" là điểm chốt. | Đề xuất |
| BR-S04-403 | Không phá anti-modal: xem/sửa/tạo mở Drawer hoặc router; không mở modal. | Quy định |
| BR-S04-404 | Chỉ chặn `contextmenu` mặc định trên phần tử được gắn; các vùng khác giữ menu trình duyệt. | Quy định |
| BR-S04-405 | Menu đóng khi: chọn mục, Escape, click ngoài, cuộn vùng chứa, mở Drawer/route, resize. | Đề xuất |
| BR-S04-406 | Hàng không có hành động khả dụng: không mở menu (hoặc trạng thái rỗng — cần chốt). | Đề xuất |

## 7. Bàn phím & khả năng truy cập (đề xuất)

| Phím / thuộc tính | Hành vi |
| :--- | :--- |
| `Shift+F10`, phím `ContextMenu`/`Menu` | Mở menu cho hàng đang focus; mở ở vị trí hàng nếu không có con trỏ chuột |
| `ArrowUp` / `ArrowDown`, `Home` / `End` | Di chuyển giữa các mục menu |
| `Enter` / `Space` | Kích hoạt mục đang focus |
| `Escape` | Đóng menu, **trả focus về hàng gốc** |
| `Tab` | Đóng menu (menu không phải modal, không trap focus) |
| ARIA | Hàng: `aria-haspopup="menu"`, `aria-expanded`; menu: `role="menu"`; mục: `role="menuitem"`, `aria-disabled` |
| Focus | Roving tabindex trong menu; **không** trap focus (khác Drawer) |

Không có Angular CDK trong dự án; cần tự triển khai quản lý focus tối thiểu trong component chung, tương tự cách `DrawerComponent` tự xử lý focus/Escape.

## 8. Mobile — ĐÃ CHỐT: KHÔNG dùng context menu

> **Cập nhật theo Confirmation 2026-10-05 (Q7)**: khách hàng chốt **Mobile không cần context menu**. Mobile giữ **nút thao tác hiển thị** (phương án A); **không** triển khai long-press. Bảng dưới giữ làm lịch sử cân nhắc.

| Phương án | Ưu | Nhược |
| :--- | :--- | :--- |
| A. Giữ nút nội tuyến (chính) — **ĐÃ CHỌN** | Touch target rõ, luôn hiển thị, dễ khám phá | Tốn chỗ, không có "menu ngữ cảnh" |
| B. Long-press mở cùng menu | Đồng nhất với desktop | Xung đột chọn văn bản, ít khám phá |
| C. Cả hai: nút menu (⋮) + long-press | Cân bằng | Thêm một control |

Quyết định: dùng phương án **A** trên Mobile; long-press (B/C) **không** nằm trong phạm vi Sprint 04. Context menu là tính năng **chỉ Desktop** (AC-10).

## 9. Vị trí & flip gần biên viewport (đề xuất)

- Neo theo con trỏ (chuột) hoặc theo hàng (bàn phím).
- **Clamp** trong viewport với lề 8px; lật lên khi thiếu chỗ dưới; lật trái khi tràn phải.
- Đo lại sau render; đổi vị trí khi scroll/resize.
- z-index trên bảng, dưới Drawer; hoặc đóng menu khi Drawer mở.
- **Ràng buộc kỹ thuật quan trọng**: container bảng dùng `overflow-x-auto` → nếu render menu bên trong sẽ bị **cắt**. Menu phải render ở lớp overlay ngoài vùng cuộn (đề xuất một host component đặt ở app root, điều khiển bởi service).

## 10. Kiến trúc dùng chung (đề xuất)

| Hạng mục | Đề xuất |
| :--- | :--- |
| Component | `src/frontend/shared/components/context-menu/context-menu.component.ts` + `.html` (template tách riêng) |
| Model | `ContextMenuItem`: `{ id, labelKey, icon?, variant?, permission?, disabled?, disabledReasonKey?, run() }` trong `src/frontend/shared/models/` |
| Điều phối | `ContextMenuService` giữ trạng thái + một host render ở app root; hoặc directive `appContextMenu` trên hàng |
| Xuất khẩu | Bổ sung qua `src/frontend/shared/index.ts`; Web + Mobile dùng chung |
| Thư viện ngoài | Không thêm; tự triển khai tối giản |

## 11. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Phá thao tác chuột phải quen thuộc (copy/paste, mở tab) | High | Chỉ chặn trên phần tử được gắn; thêm mục "Sao chép" trong menu; giữ native nơi khác |
| Người dùng không biết có chuột phải | Medium | Giữ nút hiển thị (BR-S04-401) + gợi ý/`title` |
| Menu bị cắt bởi vùng cuộn bảng | Medium | Render ở overlay ngoài container (mục 9) |
| Long-press đụng chọn văn bản / cuộn Mobile | Medium | Timer + hủy theo chuyển động; mặc định giữ nút hiển thị |
| Hồi quy a11y (focus thất lạc) | Medium | Escape khôi phục focus, roving tabindex, test bàn phím thủ công |
| Menu lệch phân quyền so với nút nội tuyến | Medium | Dùng chung nguồn `permission`; QA đối chiếu hai lối vào |

## 12. Quyết định cần chốt (Confirmation)

| # | Câu hỏi mở | Nguồn |
| :---: | :--- | :--- |
| Q1 | Danh sách màn ưu tiên gắn context menu đợt đầu? | Mới — **✅ ĐÃ CHỐT 2026-10-05: TẤT CẢ màn danh sách (Desktop)** |
| Q2 | Thiếu quyền: **ẩn** hay **disable kèm lý do**? | Mới — **✅ ĐÃ CHỐT 2026-10-05: disable kèm lý do** |
| Q3 | Mobile có bắt buộc long-press không? | RAW §4 Q5 — **✅ ĐÃ CHỐT 2026-10-05: KHÔNG** |
| Q4 | Menu dùng icon+nhãn hay icon-only? | Mới (liên quan ANL-S04-003) — **✅ ĐÃ CHỐT 2026-10-05: icon + nhãn chữ** |
| Q5 | "Xuất"/"Chia sẻ" đã có trong scope hay để sau? | Mới — *chưa hỏi riêng; đề xuất: chỉ hành động đã có ở nút inline* |
| Q6 | Menu rỗng có mở không? | Mới — *chưa hỏi riêng; đề xuất: không mở khi rỗng* |

## 13. Chưa kiểm chứng

Đây là **phân tích Draft**, chưa phải scope/AC đã duyệt; **chưa có mã nguồn Sprint 04 nào được viết**. Mọi kết luận phạm vi, danh sách màn, hành vi Mobile và mức phân quyền chỉ có hiệu lực sau khi khách hàng xác nhận tại [Confirmation Gate](../00_READING_GUIDE.md#3-gate-riêng-biệt) (CONF-S04-001).
