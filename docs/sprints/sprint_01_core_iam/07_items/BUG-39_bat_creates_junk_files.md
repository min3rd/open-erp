# [BUG-39] Script `.bat` Tạo File Rác Do Ký Tự `>` Trong `echo`

- **Mã Lỗi**: BUG-39
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: Khách hàng
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Các script `scripts/dev/run_backend.bat`, `run_web.bat`, `run_mobile.bat`, `start_infra.bat`, `stop-dev.bat` dùng `echo ==> ...`. Trong CMD, ký tự `>` bị hiểu là toán tử chuyển hướng stdout, nên dòng lệnh trở thành `echo ==` và **ghi ra file rác** tên bắt đầu bằng `Khoi ...` tại thư mục làm việc hiện tại.

- **Môi trường**: Windows CMD
- **File Liên Quan**: `scripts/dev/*.bat`, `stop-dev.bat` (các dòng `echo ==>`).
- **Ảnh Hưởng**: Xuất hiện file rác trong project mỗi lần chạy script.

## 2. Các Bước Tái Hiện
1. Mở CMD tại thư mục project.
2. Chạy `scripts\dev\run_backend.bat` (hoặc `dev.bat`).
3. Liệt kê thư mục → thấy file `Khoi chay Backend Quarkus Java...`.

## 3. Kết Quả Thực Tế
- File rác được tạo; nội dung là `==` (do `echo ==`).

## 4. Kết Quả Kỳ Vọng
- Không dùng ký tự `>` trong `echo` của file `.bat`; dùng tiền tố an toàn như `[Open-ERP]`/`[Infra]` hoặc escape `^>`.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
dir /b
Khoi chay Backend Quarkus Java trong che do Dev (Live-Coding, port 8088)...
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (đổi toàn bộ `echo ==>` sang `echo [Open-ERP]`/`echo [Infra]`; bổ sung bước đảm bảo DB test trong `start_infra`).
- [x] QA đã re-test: chạy `scripts\dev\start_infra.bat` không sinh file rác (kiểm tra `dir` sạch).
- [x] Không gây lỗi phát sinh.
