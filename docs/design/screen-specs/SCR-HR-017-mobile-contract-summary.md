# SCR-HR-017 — Mobile Contract Summary

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-017 |
| Route | /m/hr/contracts |
| Luồng liên quan | FLOW-HR-S03-MOB-001 |
| Mục tiêu | Hiển thị tóm tắt hợp đồng lao động hiện hành và mốc quan trọng cho nhân viên |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: card hợp đồng hiện tại.
- Vùng B: timeline mốc start/end và trạng thái.
- Vùng C: thông tin tóm tắt quyền lợi cơ bản.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| Mobile <=767px | 4 cột | Các card xếp dọc | Padding 16px, gap 12px |
| Tablet 768-1023px | 8 cột | A và B 2 cột | Padding 20px, gap 16px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| current-contract-card | Vùng A | active, expired, terminated, empty | contractSummary | Chỉ hiển thị contract của chính user |
| contract-timeline | Vùng B | list | statusEvents[] | Không cho chỉnh sửa |
| key-terms-block | Vùng C | readonly | contractType, startDate, endDate | Không hiển thị dữ liệu lương chi tiết nếu policy ẩn |
| expiry-warning-banner | Top | hidden, 30days, 7days | daysToExpire | Hiển thị khi gần hết hạn |
| pull-refresh | Toàn trang | idle, refreshing | refreshState | Cập nhật dữ liệu mới nhất |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Mở màn hình | Gọi API contract summary | Render card trạng thái hợp đồng |
| Kéo để refresh | Tải lại dữ liệu | Cập nhật timeline và banner |
| Chạm banner hết hạn | Mở chi tiết liên hệ HR | Hiển thị thông tin hỗ trợ |
| Không có hợp đồng | Render empty state | CTA liên hệ HR |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Timeline dots xuất hiện theo thứ tự.
- Banner cảnh báo chuyển màu theo mốc 30/7 ngày.
- Pull refresh dùng hiệu ứng native.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: xem được contract summary và mốc thời gian.
- Expired: trạng thái EXPIRED hiển thị rõ và hướng dẫn liên hệ HR.
- Permission: chỉ xem dữ liệu của chính mình.
- No-data: chưa có hợp đồng.
- Offline: hiển thị dữ liệu cache kèm nhãn chưa đồng bộ.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: contractNumber, contractType, status, startDate, endDate, daysToExpire.
- Date format dd/MM/yyyy.
- Status text theo enum chuẩn DRAFT/ACTIVE/EXPIRED/TERMINATED.
