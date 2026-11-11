# [TASK-461] Mobile Ionic 5-Tab & Dual-Mode Browser QA Testing

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-461 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-UI-S09-001](../06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) §4, §6 |
| depends_on / blocks / parent | TASK-460 / FEAT-47 / [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/web/**`, `src/frontend/mobile/**` |

## 1. Mục tiêu

1. Hỗ trợ giao diện Mobile Ionic 5-tab (CONF Q15):
   - Tab 1: Chấm công (Nút IN/OUT lớn, GPS Haversine indicator, ca hôm nay, trạng thái).
   - Tab 2: Lịch của tôi (Lịch làm việc theo tuần/tháng).
   - Tab 3: Đơn của tôi (Danh sách đơn, Drawer nộp đơn, timeline).
   - Tab 4: Duyệt đơn Manager (Inbox, duyệt/từ chối kèm lý do).
   - Tab 5: Xác nhận công (Xem chi tiết công kỳ, bấm Xác nhận/Từ chối).
2. Kiểm thử QA Browser hai chế độ (Dual-Mode Browser Testing):
   - Desktop Mode: độ phân giải >= 1280px, kiểm tra layout, drawer xếp tầng, grid mật độ cao.
   - Mobile Emulation Mode: viewport chuẩn 390x844 px, touch target >= 40px, safe-area padding, không tràn ngang (overflow = 0).
   - Đảm bảo 0 console error (`console.error`).
   - Chụp ảnh màn hình minh chứng cho báo cáo nghiệm thu Sprint 09.

