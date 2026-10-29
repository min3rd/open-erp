# [TASK-424] Hoàn thiện in-app notification & bỏ notification Core cũ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-424 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — platform defaults + tenant override; bell drawer; old bell/banner + `tenant_notifications` removed; plugin 1.0.7 / 1.1 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.1 (Q19, AC-20/21) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |

## 1. Mục tiêu

- `in-app-notification` là nguồn thông báo duy nhất; bỏ bell/banner/API notification Core khỏi Web/Mobile.
- Platform admin cấu hình defaults toàn hệ thống; tenant admin cấu hình riêng tenant (kế thừa hoặc ghi đè).
- Cấu hình platform và tenant độc lập, lưu bền, có audit người cập nhật.

## 2. Phạm vi

- Core: bảng `platform_notification_settings`, API platform GET/PUT, API tenant defaults read-only.
- Plugin: migration `V1.0.1` thêm `scope/display_name/support_email`; API `GET/PUT /settings`; UI tab cấu hình có inherit.
- Web: platform portal `/platform/notification-settings`; bỏ `NotificationBellComponent`/`NotificationBannerComponent` khỏi topbar/dashboard/settings.
- Mobile: bỏ bell/banner Core; giữ plugin bell trong header.

## 3. Kiểm chứng

- Platform admin đổi defaults → tenant admin thấy giá trị mặc định mới.
- Tenant admin bật inherit → effective = platform; tắt và nhập riêng → tenant giữ riêng.
- Web/Mobile 0 console error, overflow 0, touch ≥40px.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo task từ Q19/AC-20/21 | Chủ dự án; CONF 1.1 |
| 1.0 | 2026-10-29 | Platform defaults API/UI + tenant override; bỏ bell/banner Core; plugin 1.0.5 ACTIVE; QA PASS | QA/Developer; TR-S06-001 1.4 |
| 1.1 | 2026-10-29 | Bell mở drawer, “Xem tất cả” mới sang trang; bỏ bảng `tenant_notifications`; plugin 1.0.7; QA 19/19 PASS | QA/Developer; TR-S06-001 1.5 |
