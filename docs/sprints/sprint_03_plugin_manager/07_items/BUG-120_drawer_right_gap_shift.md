# [BUG-120] Drawer hở khoảng trống bên phải do shift luôn bật

| Trường | Giá trị |
| :--- | :--- |
| **Mã** | BUG-120 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | Chủ dự án (báo cáo trực tiếp) |
| **Ngày** | 2026-10-05 |
| **Trạng thái** | Done (QA-03 verified 2026-10-05 — gapRight=0) |
| **Liên quan** | `DrawerComponent`, BUG-119 |

## Triệu chứng

Drawer "Gán vai trò cho người dùng" hở một dải trống ~30px với mép phải màn hình.

## Nguyên nhân gốc

`DrawerComponent.panelClasses()` dịch panel trái `-translate-x-[30px]` khi `shiftLeft=true`.
`assign-users-drawer` đặt `[shiftLeft]="true"` **cố định**, nhưng việc dịch chỉ hợp lý khi có một
drawer khác **xếp trên** (để drawer dưới lộ ra). Không có drawer trên → hở 30px.

Đo thực tế: drawer `R=1250` trong viewport `1280` → `gapRight=30`.

## Cách sửa

`DrawerComponent` chỉ shift khi **thực sự có drawer xếp trên** trong `openStack` (đọc qua signal
để reactive), thay vì tin hoàn toàn vào input `shiftLeft` của caller. Caller cũ
(`account-drawer` dùng `isStackedRouteActive()`) giữ nguyên hành vi.

## Kiểm chứng

| Drawer | Trước | Sau |
| :--- | :--- | :--- |
| Gán người dùng (`w-[420px]`) | R=1250, gapRight=**30** | R=**1280**, gapRight=**0** |
| Thêm vai trò (`w-[440px]`) | R=1280, gapRight=0 | R=1280, gapRight=0 |
| Mobile drawer | R=390, gapRight=0 | R=390, gapRight=0 |

Đo bằng CDP `Emulation.setDeviceMetricsOverride` (1280×900 và 390×844), 0 console error.
