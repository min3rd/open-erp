# SCR-SA-008 — Notification Preferences

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                               |
| --------------- | ----------------------------------------------------- |
| Mã màn hình     | SCR-SA-008                                            |
| Route           | /settings/notifications                               |
| Luồng liên quan | Cài đặt thông báo                                     |
| Mục tiêu        | Cấu hình kênh và loại thông báo cho người dùng/tenant |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: toggle kênh thông báo (Email, In-app, Push).
- Vùng B: ma trận loại thông báo theo module.
- Vùng C: cấu hình tần suất digest.
- Vùng D: nút lưu cấu hình.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid    | Vị trí thành phần chính            | Khoảng cách chính              |
| ---------- | ------- | ---------------------------------- | ------------------------------ |
| >=1024px   | 12 cột  | Matrix dạng bảng full width        | Row gap 12px, section gap 20px |
| <1024px    | 8/4 cột | Accordion theo từng loại thông báo | Padding 16px, item gap 10px    |

## 3. Đặc tả component

| Component              | Vị trí | Variant/State              | Dữ liệu đầu vào                       | Ràng buộc hiển thị                             |
| ---------------------- | ------ | -------------------------- | ------------------------------------- | ---------------------------------------------- |
| channel-toggle-group   | Vùng A | on, off, disabled          | channelAvailability, selectedChannels | Kênh không hỗ trợ theo plan hiển thị disabled  |
| preference-matrix      | Vùng B | editable, readonly         | notificationTypes, preferences        | Chỉ hiển thị loại thông báo user có quyền nhận |
| frequency-radio-group  | Vùng C | immediate, daily, weekly   | digestFrequency                       | Bắt buộc chọn 1 giá trị                        |
| save-preference-button | Vùng D | disabled, loading, enabled | hasChanges, isValid                   | Enable khi có thay đổi hợp lệ                  |

## 4. Hành động và phản hồi UI

| Trigger                     | Xử lý                           | Phản hồi UI                             |
| --------------------------- | ------------------------------- | --------------------------------------- |
| Bật/tắt kênh thông báo      | Cập nhật state matrix liên quan | Disable các ô không còn hiệu lực        |
| Chỉnh preference theo loại  | Cập nhật draft preferences      | Đánh dấu hasChanges                     |
| Nhấn Lưu                    | Gọi API update preferences      | Toast thành công và clear dirty state   |
| API trả kênh không khả dụng | Nhận metadata plan/channel      | Hiển thị cảnh báo tại channel tương ứng |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Toggle channel có animation trượt chuẩn 120ms.
- Accordion mở/đóng mềm để tránh mất ngữ cảnh.
- Toast thông báo lưu thành công/fail dạng fade.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: cập nhật preference và lưu thành công.
- Validation error: thiếu tần suất digest hoặc cấu hình mâu thuẫn.
- Expired: session hết hạn khi lưu.
- Permission: user không đủ quyền chỉnh cấu hình tenant-level.
- No-data: chưa có loại thông báo nào khả dụng.
- Offline: lưu thất bại do mất mạng, giữ local draft.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: notificationTypes, channelAvailability, digestFrequency, preferences.
- Ràng buộc theo subscription plan phải hiển thị rõ bằng chú thích.
- Thông điệp lỗi và cảnh báo dùng messageKey + metadata.
