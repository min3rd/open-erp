# SCR-HR-004 — Candidate Detail & Stage

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-004 |
| Route | /hr/recruitment/candidates/:id |
| Luồng liên quan | FLOW-HR-S03-REC-001 |
| Mục tiêu | Quản lý hồ sơ ứng viên, CV, timeline và chuyển stage theo pipeline |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: header ứng viên, stage hiện tại, action nhanh.
- Vùng B: hồ sơ cá nhân + nguồn ứng tuyển + CV.
- Vùng C: timeline stage/interview/offer.
- Vùng D: action panel chuyển stage.

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | B:5 cột, C:4 cột, D:3 cột | Gap 16px |
| <1024px | 4 cột | C và D thành accordion | Gap 12px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| candidate-profile-card | Vùng B | loaded, redacted | candidateProfile | Mask contact nếu role hạn chế |
| cv-preview | Vùng B | loading, available, missing | cvFileUrl | Chỉ chấp nhận file PDF |
| stage-timeline | Vùng C | interactive, readonly | stageHistory[] | Không cho sửa lịch sử |
| stage-action-panel | Vùng D | enabled, disabled | allowedTransitions[] | Chỉ bật transition hợp lệ |
| ai-score-badge | Vùng A | high, medium, low, hidden | aiScore | Ẩn khi tenant tắt AI |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhấn chuyển stage | Gọi API update stage | Badge stage đổi, timeline thêm event mới |
| Nhấn Đặt lịch phỏng vấn | Điều hướng SCR-HR-005 | Prefill candidate và requisition |
| Nhấn Xem CV | Mở viewer PDF | Hiển thị CV trong drawer/modal |
| Nhấn Đưa vào pool từ chối | Gọi API cập nhật trạng thái REJECTED | Hiển thị lý do từ chối trong timeline |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Stage badge animate đổi màu 120ms.
- Timeline event mới fade-in 150ms.
- CV viewer mở với zoom-in nhẹ.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: cập nhật stage đúng thứ tự và lên lịch phỏng vấn thành công.
- Validation error: chuyển stage không hợp lệ.
- Expired: offer của candidate đã hết hạn, chặn action accept.
- Locked: candidate bị thao tác đồng thời, hiển thị conflict banner.
- Permission: role viewer chỉ được xem profile, không được chuyển stage.
- No-data: thiếu CV -> hiển thị placeholder + hướng dẫn tải lên.
- Offline: xem cache candidate, khóa action ghi.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: fullName, email, phone, source, stage, aiScore, interviews[], offers[].
- Stage hiển thị theo nhãn chuẩn APPLIED/SCREENING/INTERVIEW/OFFER/HIRED/REJECTED.
- Điểm aiScore hiển thị 0-100, làm tròn số nguyên.
- Dòng thời gian hiển thị theo dd/MM/yyyy HH:mm.
