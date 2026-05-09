# SCR-HR-016 — Mobile My Profile Basic

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-016 |
| Route | /m/hr/profile |
| Luồng liên quan | FLOW-HR-S03-MOB-001 |
| Mục tiêu | Cho phép nhân viên xem và cập nhật thông tin liên hệ cơ bản của chính mình |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: profile header (avatar, tên, mã nhân viên).
- Vùng B: form thông tin liên hệ được phép sửa.
- Vùng C: block dữ liệu nhạy cảm readonly/masked.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| Mobile <=767px | 4 cột | Form full width theo section | Padding 16px, gap 12px |
| Tablet 768-1023px | 8 cột | Form 2 cột cho trường ngắn | Padding 20px, gap 16px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| profile-basic-form | Vùng B | editable, invalid, saving | email, phone, address | Chỉ trường cho phép mới editable |
| readonly-sensitive-block | Vùng C | masked | nationalId, bankAccount | Không cho sửa trên mobile Sprint 03 |
| save-button-mobile | Footer | enabled, loading, disabled | dirty + valid | Disable khi form không đổi |
| validation-inline | Vùng B | hidden, visible | errors | Hiển thị sát trường lỗi |
| profile-avatar | Vùng A | default | avatarUrl | Upload avatar ngoài phạm vi Sprint 03 |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Sửa email/phone/address | Validate tại client | Lỗi tức thời theo field |
| Nhấn Lưu | Gọi API cập nhật profile self | Toast thành công + cập nhật timestamp |
| Cố sửa trường nhạy cảm | Chặn chỉnh sửa | Hiển thị tooltip chính sách |
| Session hết hạn | Chuyển login | Banner thông báo hết phiên |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Field focus có highlight theo token accent.
- Save thành công hiển thị checkmark ngắn.
- Transition giữa section dùng slide nhẹ.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: cập nhật contact info thành công.
- Validation error: email/phone sai định dạng.
- Permission: chỉ được truy cập employeeId của chính user đăng nhập.
- No-data: thiếu địa chỉ hiện placeholder.
- Offline: cho lưu draft local chờ đồng bộ.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: fullName, employeeCode, email, phone, currentAddress, permanentAddress.
- Phone format VN +84 hoặc 0xxxxxxxxx.
- NationalId luôn mask.
