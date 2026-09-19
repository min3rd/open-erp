# [BUG-79] Hiển Thị Thời Gian Sai Chuẩn — Phải Theo Format & Múi Giờ Người Dùng (DB Lưu UTC)

- **Mã Lỗi**: BUG-79
- **Phân Loại**: Bug / Defect (UI Correctness + i18n)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: Khách hàng (yêu cầu bổ sung 2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Yêu Cầu

> Toàn bộ thông tin thời gian hiển thị trên giao diện (Web + Mobile) phải được định dạng theo **locale của trình duyệt/máy người dùng** và quy đổi về **múi giờ của người dùng**. Trong CSDL, mọi timestamp lưu dạng **UTC**.

- **Môi trường**: Web Desktop + Mobile 390x844.
- **Phạm vi ảnh hưởng (tối thiểu)**: Audit Logs (`created_at`), Tenant (`created_at`, `trial_ends_at`), Platform Users (`last_login_at`, `locked_at`), Admins (`last_login_at`, `created_at`), Sessions, Impersonation logs, Sample records, Branch/Department/Membership timestamps, các cột ngày trong bảng/drawer.

### Hiện trạng / Bằng chứng

- Backend serialize `Instant` — cần xác nhận chuẩn ISO-8601 UTC (hậu tố `Z`) trên mọi DTO.
- Frontend đang hiển thị chuỗi thô hoặc `DatePipe` mặc định không cấu hình timezone/locale → giờ UTC hoặc định dạng `MM/dd/yyyy` không thống nhất.
- Chưa có utility dùng chung `@shared` cho việc format ngày giờ.

## 2. Yêu Cầu Kỹ Thuật

1. **Backend**: mọi trường thời gian trả về ISO-8601 UTC có hậu tố `Z` (kiểm tra Jackson `JavaTimeModule`; không trả epoch number hoặc chuỗi không timezone).
2. **Shared util** `src/frontend/shared/utils/date.util.ts`:
   - `formatDateTime(value)`: dùng `Intl.DateTimeFormat(locale, { dateStyle:'short', timeStyle:'short', timeZone: browser })` — tự động theo máy người dùng.
   - `formatDate(value)` cho trường ngày; `formatRelative(value)` (tùy chọn) cho "x phút trước".
   - Xử lý null/invalid trả `—`; parse chuỗi UTC đúng (thêm `Z` nếu thiếu).
   - Locale lấy từ `navigator.language`/`LOCALE_ID` hiện có (vi/en).
3. **Áp dụng 100%**: Web + Mobile thay mọi chỗ hiển thị timestamp thô/DatePipe cũ bằng util mới (grep `| date`, `toLocaleString`, `created_at`, `last_login`, `trial_ends`, `locked_at`...).
4. **Kiểm thử**: QA kiểm chứng đổi timezone máy (ví dụ UTC+7 vs UTC) hiển thị đúng chênh lệch; format theo locale máy.

## 3. Tiêu Chí Nghiệm Thu

- [ ] Không còn màn hình hiển thị giờ UTC thô hoặc format lệch locale máy.
- [ ] Backend trả UTC `Z` nhất quán (có test).
- [ ] Shared util được dùng ở cả Web và Mobile; build PASS; i18n parity giữ nguyên.
- [ ] QA xác nhận với ít nhất 2 timezone khác nhau.

## Ghi Chú Tiến Độ (2026-09-19)

- **Backend UTC hoàn tất 2026-09-19; phần FE shared util còn lại do FE agent** (giữ `In Progress`):
  - `src/backend/.../resources/application.properties:49` — chốt tường minh `quarkus.jackson.write-dates-as-timestamps=false` để mọi `Instant` serialize ISO-8601 UTC có hậu tố `Z`, không trả epoch number.
  - Toàn bộ DTO platform dùng `java.time.Instant` + Jackson `JavaTimeModule` (Quarkus REST Jackson) → không phát hiện DTO lệch chuẩn cần sửa thêm.
- **Test**: `PlatformTimestampUtcApiTest` — khẳng định `data.items[0].created_at` của tenant list và audit log kết thúc bằng `Z` và `Instant.parse(...)` thành công.
- Kiểm chứng: full `mvn test` **187/187 PASS** (PostgreSQL + Redis thật, không H2).
- **Còn lại cho FE agent**: `src/frontend/shared/utils/date.util.ts` (`formatDateTime`/`formatDate`/`formatRelative` theo `navigator.language` + timezone máy), thay thế 100% chỗ hiển thị timestamp thô/DatePipe trên Web + Mobile.

## Ghi Chú Triển Khai (Developer) — 2026-09-19

> **FE hoàn tất 2026-09-19, chờ QA xác nhận (2 timezone).** Backend chuẩn hóa `Instant` UTC (`Z`) do Backend Agent triển khai song song; FE parse phòng thủ nếu payload thiếu hậu tố timezone.

- **Shared util mới**: `src/frontend/shared/utils/date.util.ts` (export qua `shared/utils/index.ts` → `@shared`):
  - `formatDateTime`, `formatDate`, `formatTime`, `formatRelative` dùng `Intl.DateTimeFormat`/`Intl.RelativeTimeFormat` với locale `navigator.language` (fallback `vi-VN`) + timezone máy người dùng.
  - Parse UTC: chuỗi thiếu `Z`/offset được coi là UTC (thêm `Z`; hỗ trợ `YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`); `null`/rỗng/invalid → `—`.
- **Đã thay thế toàn bộ 11 vị trí hiển thị timestamp** (grep `| date` = 0, `toLocaleString/DateString/TimeString` = 0):
  - **Web (8)**: Tenant list `created_at`; Platform Users `last_login_at`; Platform Admins `last_login_at`; Audit Logs `created_at` (list + detail drawer); Sample Records `created_at`; Account Sessions `last_active_at`; Platform Health "cập nhật lúc" (dùng `formatTime`).
  - **Mobile (3)**: Account Sessions `last_active_at` (bỏ DatePipe `dd/MM/yyyy HH:mm`); Account Security `enabled_at` (bỏ DatePipe); Sample Records `created_at` (bỏ DatePipe).
- Không còn dùng `DatePipe` mặc định cho timestamp; không phát sinh key i18n mới, vi/en parity giữ nguyên (Web 663/663, Mobile 452/452).
- Build `npm run build` Web + Mobile PASS ngày 2026-09-19.
- **Chờ QA**: đổi máy sang 2 timezone (ví dụ UTC+7 vs UTC) kiểm chứng chênh lệch + format theo locale; xác nhận backend trả UTC `Z` nhất quán.

## Ghi Chú QA Xác Nhận (2026-09-19) — QA-F-79: PASS

- Playwright context `timezoneId: 'Asia/Ho_Chi_Minh'` + `locale: 'vi-VN'` so với `timezoneId: 'UTC'` + `locale: 'en-US'`, **cùng một bản ghi** raw `created_at = 2026-09-19T04:01:16.392580Z`:
  - Audit logs: `11:01 19/9/26` (HCM/vi) vs `9/19/26, 4:01 AM` (UTC/en) → chênh đúng **+420 phút = +7h**.
  - `/platform/tenants` (created_at): `14:09 18/9/26` vs `9/18/26, 7:09 AM` → **+420 phút**.
- Format theo locale máy: vi-VN (`giờ ngày/tháng/năm`, 24h) và en-US (`tháng/ngày/năm, h:mm AM/PM`) khác nhau đúng chuẩn `Intl`.
- Giá trị null (`last_login_at` chưa có) hiển thị `—` (10 ô tại `/platform/users`, cả 2 context).
- Backend trả ISO-8601 UTC có hậu tố `Z` (đã xác nhận trước đó bằng `PlatformTimestampUtcApiTest`).
- Console errors = 0. Ảnh: `QA-F-79_a..f`.
- **Kết luận**: đạt toàn bộ tiêu chí nghiệm thu → **Done**.
