# SCR-HR-007 — Offer Composer

## 1. Thông tin màn hình

| Thuộc tính      | Giá trị                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| Mã màn hình     | SCR-HR-007                                                                         |
| Route           | /hr/recruitment/offers/new                                                         |
| Luồng liên quan | FLOW-HR-S03-REC-001                                                                |
| Mục tiêu        | Soạn và gửi offer cho candidate đủ điều kiện với thời hạn phản hồi mặc định 7 ngày |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng

- Vùng A: thông tin candidate + requisition.
- Vùng B: form offer (position, lương, ngày bắt đầu, benefits, expiry).
- Vùng C: preview email offer và legal note.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính

| Breakpoint | Grid   | Vị trí thành phần chính     | Khoảng cách chính |
| ---------- | ------ | --------------------------- | ----------------- |
| >=1024px   | 12 cột | B:7 cột, C:5 cột            | Gap 20px          |
| <1024px    | 4 cột  | C xuống dưới dạng accordion | Gap 12px          |

## 3. Đặc tả component

| Component           | Vị trí | Variant/State              | Dữ liệu đầu vào | Ràng buộc hiển thị                  |
| ------------------- | ------ | -------------------------- | --------------- | ----------------------------------- |
| offer-form          | Vùng B | default, invalid, sending  | offerPayload    | expiry mặc định sentAt + 7 ngày     |
| salary-input        | Vùng B | default, error             | salary          | Chỉ nhận số dương                   |
| benefits-editor     | Vùng B | add/remove item            | benefits[]      | Giới hạn số mục theo policy tenant  |
| offer-email-preview | Vùng C | loading, ready             | templateData    | Render realtime theo form           |
| send-offer-button   | Footer | enabled, loading, disabled | formValidity    | Chỉ bật khi candidate ở stage OFFER |

## 4. Hành động và phản hồi UI

| Trigger                       | Xử lý                         | Phản hồi UI                        |
| ----------------------------- | ----------------------------- | ---------------------------------- |
| Nhập lương đề nghị            | Validate mức lương và format  | Hiển thị format VND ngay khi blur  |
| Nhấn Gửi offer                | Gọi API tạo offer + gửi email | Trạng thái SENT, chuyển SCR-HR-008 |
| Sửa expiry                    | Validate không nhỏ hơn sentAt | Cảnh báo nếu vượt policy tenant    |
| Candidate không ở stage OFFER | Chặn submit                   | Hiển thị banner rule vi phạm       |

## 5. Hiệu ứng hình ảnh/animation và âm thanh

- Email preview update bằng cross-fade 120ms.
- CTA gửi offer hiển thị progress line trong lúc gửi.
- Success state hiển thị icon xác nhận và trạng thái SENT.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ

- Happy path: gửi offer thành công, trạng thái SENT, expiry +7 ngày.
- Validation error: thiếu startDate, lương không hợp lệ, expiry sai.
- Expired: offer cũ đã expired không cho gửi lại cùng bản ghi.
- Permission: chỉ HR Staff/HR Manager có quyền gửi offer.
- No-data: thiếu template email tenant.
- Offline: không gửi được, cho phép lưu draft offer.

## 7. Dữ liệu hiển thị và quy tắc format

- Dữ liệu chính: candidateId, offeredPositionId, salary, startDate, benefits[], expiresAt, offerStatus.
- Lương hiển thị định dạng VND, không thập phân.
- Ngày hiệu lực hiển thị dd/MM/yyyy.
