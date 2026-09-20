# [REV-02] Review lại tài liệu Sprint 03

- **Ngày**: 2026-09-20
- **Baseline**: HEAD `20b1dd4`, gồm bản sửa `b33da71`; working tree sạch trước review.
- **Kết luận**: **7/8 lỗi cũ được đóng ở mức tài liệu; BUG-86 chưa đạt; phát hiện thêm BUG-92 và BUG-93. Còn 3 High mở.** Chưa xác nhận bộ thiết kế sẵn sàng triển khai đầy đủ.

## Phát hiện còn mở

1. **High — [BUG-92](../07_items/BUG-92_core_slot_seed_conflict_target.md): SQL seed Core slot không khớp index mới.** DES-03-DB dòng 209–210 chỉ có partial unique index cho CORE, nhưng dòng 378 dùng `ON CONFLICT (slot_code)` không kèm predicate. SQL không suy ra được arbiter index; cần đồng bộ conflict target. Quy tắc đã đối chiếu [PostgreSQL 16 INSERT](https://www.postgresql.org/docs/16/sql-insert.html#SQL-ON-CONFLICT), chưa chạy SQL.
2. **High — [BUG-86](../07_items/BUG-86_upgrade_rollback_data_contract.md): snapshot vẫn có thể bị bỏ qua theo API, rollback thủ công thiếu mốc phục hồi an toàn.** DES-03-API dòng 178–183 dùng mặc định true nhưng nhận false; SOL-02 lại bắt buộc snapshot với BREAKING. P23 cũng chưa xử lý dữ liệu ghi sau nâng cấp/snapshot hết hạn. Cần server-enforced snapshot và precondition rollback rõ ràng; trả item về To Do.
3. **High — [BUG-93](../07_items/BUG-93_catalog_block_publish_bypass.md): khóa plugin chưa ngăn phát hành/cài phiên bản mới.** DDL chỉ lưu BLOCKED trên version; T15/T17 cho thêm/publish phiên bản nhưng chưa kiểm tra khóa catalog. Trái ANL-01 mục 4.6: chỉ Super Admin được mở khóa. Cần trạng thái khóa catalog và ma trận chuyển trạng thái/authorization cho các API và job.

## Xác nhận các sửa đổi cũ

| Item | Kết quả review tài liệu |
| :--- | :--- |
| BUG-84 | Done — DES-03-DB mục 4 đã seed/upsert placeholder trước JOIN, đối soát theo tenant/key và quy định fail-fast. Đóng lỗi mất entitlement do thứ tự seed; lỗi seed UI Slot mới theo dõi riêng BUG-92. |
| BUG-85 | Done — DES-03-DB mục 2.1 chốt plugin_key unique toàn cục; mục 2.3 thêm kiểm tra owner; DES-03-API mục 1 đồng bộ khóa. Đóng lỗi định danh mơ hồ. |
| BUG-87 | Done — DES-03-API T14–T18 và mục 4.3 đã bổ sung upload, version, publish, ownership và luồng DRAFT → PUBLISHED. Đóng thiếu luồng đăng ký; ràng buộc khóa khẩn cấp của luồng mới theo dõi riêng BUG-93. |
| BUG-88 | Done — DES-03-DB mục 2.5 dùng manifest của installed_version làm nguồn sự thật; registry chỉ là index theo owner/slot/contract; S1 và UI 5.2 đã đồng bộ. Đóng lỗi resolve scope/version; câu seed SQL không tương thích index mới theo dõi BUG-92. |
| BUG-89 | Done — P19–P23 đã đủ thao tác lifecycle theo tenant, audit actor platform thật và chặn Support Engineer ghi; UI 3.2 dẫn chiếu tương ứng. Đóng thiếu endpoint; chính sách an toàn rollback vẫn thuộc BUG-86. |
| BUG-90 | Done — AC-23.5 đã cho phép cả Official/private WC/MF, iframe dự phòng; UI và truy vết đã đồng bộ quyết định Gate. |
| BUG-91 | Done — AC-21.5 đã tách locked=true → ACTIVE và locked=false → NOT_INSTALLED; P3/P24 có locked và UI chỉnh metadata. Đóng mâu thuẫn AC đã báo. |

BUG-88 được đóng cho vấn đề resolve slot owner/version; BUG-92 là lỗi SQL seed phát sinh khi thay index. BUG-87 được đóng cho thiếu API custom lifecycle; BUG-93 theo dõi riêng tương tác giữa publish và khóa khẩn cấp. Không gộp các lỗi mới vào item cũ đã xử lý đúng phạm vi.

## Phương pháp và giới hạn

Đọc lại toàn bộ DB/API spec, đối chiếu các phần sửa trong SOL, UI, CONF, ANL và Reading Guide; so sánh thay đổi commit b33da71. Xác nhận là **review tĩnh thiết kế**, không phải chứng nhận chức năng đã chạy đúng. Chưa chạy backend, PostgreSQL, container hay browser; không đóng Sprint. Không xác minh lại benchmark thị trường trong lượt này.

Cập nhật trạng thái BUG-84/85/87/88/89/90/91 thành Done cho lỗi tài liệu; BUG-86 về To Do; tạo BUG-92/93 To Do. Các nhận định lịch sử ở REV-01 và bảng review lần 1 được giữ để truy vết; kết quả hiện hành là báo cáo này.

