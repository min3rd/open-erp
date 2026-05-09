# SCR-HR-006 — Interview Result

## 1. Thông tin màn hình

| Thuộc tính | Giá trị |
|---|---|
| Mã màn hình | SCR-HR-006 |
| Route | /hr/recruitment/interviews/:id/result |
| Luồng liên quan | FLOW-HR-S03-REC-001 |
| Mục tiêu | Ghi nhận kết quả phỏng vấn và quyết định chuyển pipeline |

## 2. Layout chi tiết

### 2.1 Cấu trúc vùng
- Vùng A: thông tin buổi phỏng vấn.
- Vùng B: biểu mẫu chấm điểm và nhận xét theo tiêu chí.
- Vùng C: quyết định kết quả (đạt/không đạt/chờ thêm vòng).

### 2.2 Breakpoint, vị trí thành phần, khoảng cách chính
| Breakpoint | Grid | Vị trí thành phần chính | Khoảng cách chính |
|---|---|---|---|
| >=1024px | 12 cột | B:8 cột, C:4 cột | Gap 16px |
| <1024px | 4 cột | C thành sticky bottom action | Padding 16px |

## 3. Đặc tả component

| Component | Vị trí | Variant/State | Dữ liệu đầu vào | Ràng buộc hiển thị |
|---|---|---|---|---|
| score-form | Vùng B | editable, readonly, invalid | criteriaScores[], notes | Điểm từng tiêu chí 1-5 |
| decision-selector | Vùng C | PASS, FAIL, NEXT_ROUND | decision | PASS kích hoạt CTA tạo offer |
| interviewer-feedback-list | Vùng B | list, empty | feedbacks[] | Chỉ interviewer được sửa feedback của mình |
| save-result-button | Vùng C | enabled, loading | resultPayload | Disable nếu thiếu decision |
| follow-up-action-card | Vùng C | hidden, visible | decision | Hiển thị hướng đi tiếp theo |

## 4. Hành động và phản hồi UI

| Trigger | Xử lý | Phản hồi UI |
|---|---|---|
| Nhập điểm tiêu chí | Validate giới hạn điểm | Hiển thị lỗi tức thì nếu ngoài khoảng 1-5 |
| Nhấn Lưu kết quả | Gọi API lưu result | Cập nhật candidate stage và timeline |
| Chọn PASS | Gợi ý chuyển sang SCR-HR-007 | Hiện CTA tạo offer |
| Chọn FAIL | Yêu cầu nhập lý do từ chối | Hiện trường bắt buộc reason |

## 5. Hiệu ứng hình ảnh/animation và âm thanh
- Thang điểm đổi màu theo mức điểm.
- Card follow-up action xuất hiện bằng fade-up 140ms.
- Badge decision cập nhật bằng transform nhẹ.
- Không dùng âm thanh.

## 6. Case hiển thị theo luồng nghiệp vụ
- Happy path: lưu điểm và quyết định PASS, chuyển candidate sang OFFER.
- Validation error: thiếu decision, điểm ngoài phạm vi, thiếu reason khi FAIL.
- Locked: interview result đã khóa sau khi submit cuối cùng.
- Permission: interviewer không thuộc lịch không được nhập kết quả.
- No-data: không có tiêu chí chấm điểm cấu hình sẵn.
- Offline: chỉ cho lưu nháp local, chưa cho submit chính thức.

## 7. Dữ liệu hiển thị và quy tắc format
- Dữ liệu chính: interviewId, candidateId, criteriaScores, notes, decision, submittedBy, submittedAt.
- Điểm tổng hiển thị 1 chữ số thập phân.
- Dữ liệu lịch sử lưu immutable sau submit cuối.
