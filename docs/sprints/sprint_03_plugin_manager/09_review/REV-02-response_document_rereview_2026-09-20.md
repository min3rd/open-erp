# [REV-02-RESPONSE] Phản Hồi Xử Lý Review Vòng 2 (REV-02)

- **Ngày**: 2026-09-20
- **Loại**: Phản hồi của đội dự án cho [REV-02 — Review lại tài liệu Sprint 03](REV-02_document_rereview_2026-09-20.md); không phải nghiệm thu hoặc đóng Sprint.
- **Kết luận**: **3/3 vấn đề High mở của REV-02 đã được xử lý ở mức tài liệu**; các item chờ Reviewer xác nhận đóng.

## Phát hiện vòng 2

| Item | Mức độ | Vấn đề |
| :--- | :--- | :--- |
| [BUG-86](../07_items/BUG-86_upgrade_rollback_data_contract.md) | High | API vẫn nhận `snapshot=false` cho nâng cấp BREAKING; rollback thủ công chưa bảo vệ dữ liệu phát sinh sau nâng cấp |
| [BUG-92](../07_items/BUG-92_core_slot_seed_conflict_target.md) | High | SQL seed Core slot không khớp partial unique index mới → chặn migration V3.0.0 |
| [BUG-93](../07_items/BUG-93_catalog_block_publish_bypass.md) | High | Thiếu trạng thái khóa cấp catalog và điều kiện chặn tenant publish/cài phiên bản mới sau khóa khẩn cấp |

## Cập Nhật Xử Lý (2026-09-20) — Bởi Đội Dự Án

- **BUG-86 (bổ sung)**: snapshot **bắt buộc** với `migration_policy = BREAKING` (API từ chối `snapshot=false` → `PLUGIN_SNAPSHOT_REQUIRED`); trước khi restore snapshot pre-upgrade phải tạo **preservation snapshot** dữ liệu hiện tại (không mất dữ liệu phát sinh sau nâng cấp); bổ sung `rollback_strategy = SNAPSHOT_RESTORE | DOWN_MIGRATION`; nếu tạo preservation snapshot thất bại → hủy rollback.
  - Tài liệu: DES-03-DB (cột `rollback_strategy`, quy tắc 10), DES-03-API mục 4.4, SOL-02 mục 4.4.
- **BUG-92**: sửa conflict target đúng partial unique index — `ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO NOTHING` (PostgreSQL 16 index_predicate inference); thêm mục kiểm chứng seed 2 lần.
  - Tài liệu: DES-03-DB mục 6.
- **BUG-93**: thêm trạng thái khóa **cấp catalog** (`plugin_catalog.catalog_status = ACTIVE | BLOCKED` + lý do/actor/thời điểm, độc lập `locked`); `P7` mở rộng `scope: VERSION | CATALOG`; thêm **`P25` unblock** (chỉ SUPER_ADMIN); trigger `trg_plugin_version_publish_guard`; chốt bảng chuyển trạng thái version (`BLOCKED → PUBLISHED` chỉ Platform); job đang chạy phải **kiểm tra lại trước ACTIVATE** và bù trừ nếu bị khóa giữa chừng; UI badge "Đã khóa" + nút Mở khóa.
  - Tài liệu: DES-03-DB mục 2.1/2.2/5, DES-03-API mục 3, DES-03-UI mục 3.1/3.2/4.1, ANL-01 BR-PLG-09, SOL-01 mục 4.3.

- **Trạng thái item**: BUG-86, BUG-92, BUG-93 đang `In Review` kèm "Ghi Chú Xử Lý" trong từng file.
- **Đề nghị**: Reviewer xác nhận đóng 3 item High vòng 2; khi 0 item High/Medium chưa xử lý → chuyển sang Bước 7 (Lập trình).
