# SCR-HR-011 — Employee Documents & Sensitive Data Panel

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-011                                                             |
| Route           | /hr/employees/:id/documents                                            |
| Luồng liên quan | FLOW-HR-S03-EMP-001                                                    |
| Mục tiêu        | Quản lý tài liệu đính kèm và vùng dữ liệu nhạy cảm của hồ sơ nhân viên |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: danh mục tài liệu theo loại.
- Vùng B: danh sách file + metadata upload.
- Vùng C: khu vực dữ liệu nhạy cảm (nationalId, bank account, taxCode) có cơ chế mask.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính              | Khoảng cách chính |
| ---------- | ------ | ------------------------------------ | ----------------- |
| >=1024px   | 12 cột | A:3 cột, B:5 cột, C:4 cột            | Gap 16px          |
| <1024px    | 4 cột  | A thành filter chips, C ở cuối trang | Gap 12px          |

## 3. Đặc tả component

| Component            | Vị trí | Variant/State                    | Dữ liệu đầu vào   | Ràng buộc hiển thị                    |
| -------------------- | ------ | -------------------------------- | ----------------- | ------------------------------------- |
| document-type-filter | Vùng A | selected, unselected             | docTypes[]        | Có loại Tất cả mặc định               |
| document-list        | Vùng B | loading, loaded, empty           | documents[]       | Chỉ file thuộc tenant/employee        |
| upload-dropzone      | Vùng B | idle, dragging, uploading, error | acceptedFileTypes | Chỉ nhận file theo policy             |
| sensitive-data-card  | Vùng C | masked, revealed                 | sensitiveFields   | Reveal cần quyền + xác nhận           |
| access-audit-hint    | Vùng C | info                             | lastAccessLog     | Luôn hiển thị nếu có truy cập gần đây |

## 4. Hành động và phản hồi UI

| Trigger                      | Xử lý                     | Phản hồi UI                       |
| ---------------------------- | ------------------------- | --------------------------------- |
| Upload tài liệu mới          | Gọi API upload            | Progress bar + cập nhật list      |
| Nhấn Reveal dữ liệu nhạy cảm | Kiểm tra quyền + xác nhận | Hiện dữ liệu tạm thời trong phiên |
| Xóa tài liệu                 | Confirm + gọi API delete  | Cập nhật list và toast            |
| Tải xuống tài liệu           | Gọi API signed URL        | Mở tải file an toàn               |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Dropzone highlight khi kéo file vào.
- Progress bar upload mượt theo phần trăm.
- Sensitive card reveal bằng blur-out 100ms.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: upload/xem tài liệu, reveal dữ liệu nhạy cảm đúng quyền.
- Validation error: file quá dung lượng hoặc sai định dạng.
- Locked: file bị khóa do virus-scan hoặc retention policy.
- Permission: không đủ quyền reveal chỉ thấy mask.
- No-data: chưa có tài liệu nào.
- Offline: tạm xếp hàng upload chờ mạng.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: documents[{type,fileName,url,uploadedAt}], nationalId, bankAccount, taxCode.
- File name tối đa 120 ký tự.
- UploadedAt format dd/MM/yyyy HH:mm.
