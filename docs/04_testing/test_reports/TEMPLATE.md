# [MÃ_TÍNH_NĂNG] Báo Cáo Kết Quả Kiểm Thử (Test Report)

- **Tính năng**: [Tên tính năng]
- **Phụ trách**: QA/QC Agent
- **Ngày kiểm thử**: YYYY-MM-DD
- **Kết luận chung**: [ ] ĐẠT CHUẨN PHÁT HÀNH (PASSED) / [ ] CHƯA ĐẠT (FAILED - Cần fix bug)

---

## 1. Tóm Tắt Kết Quả Kiểm Thử
- **Tổng số kịch bản test**: XX
- **Số kịch bản đạt (Passed)**: XX (xx%)
- **Số kịch bản trượt (Failed)**: XX (xx%)
- **Số kịch bản bỏ qua (Blocked / Skipped)**: XX

---

## 2. Kết Quả Chạy Automated Test
```bash
# Lệnh chạy: npm test / pytest / go test ...
# Kết quả thực tế:
PASS tests/modules/...
Test Suites: X passed, X total
Tests:       Y passed, Y total
Snapshots:   0 total
Time:        X.XX s
Coverage:    XX%
```

---

## 3. Danh Sách Lỗi Phát Hiện (Bug Log - Nếu Có)

| Bug ID | Mức Độ (Severity) | Mô Tả Lỗi | Trạng Thái | Người Xử Lý |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | High | Lỗi hiển thị sai định dạng ngày khi đổi timezone | Fixed | Developer Agent |
| **BUG-02** | Low | Nút quay lại chưa đổi màu khi hover | Open | Developer Agent |

---

## 4. Xác Nhận Của QA/QC
- Tính năng đã đủ điều kiện để chuyển giao sang bước cập nhật công việc và đóng gói: **[Xác Nhận]**.
