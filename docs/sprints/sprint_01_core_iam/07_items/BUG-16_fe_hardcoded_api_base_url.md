# [BUG-16] Frontend Hardcode API Base URL 'http://localhost:8088'

- **Mã Lỗi**: BUG-16
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- `src/frontend/web/src/app/core/services/api.service.ts:11` hardcode `private baseUrl = 'http://localhost:8088';` — không đọc từ `environment` (Angular environment files) hay cấu hình runtime nào.
- **Tài liệu đối chiếu**:
  - `AGENTS.md`: nghiêm cấm hardcode URL, mọi cấu hình phải nạp động theo môi trường.
  - DES-03 (`../06_designs/ui_ux/CORE_IAM_UI_SPEC.md`): đặc tả thiết kế UI/UX, yêu cầu cấu hình theo môi trường triển khai.
- **Hậu Quả**: Build staging/production vẫn gọi `http://localhost:8088` → toàn bộ request thất bại (network error/CORS); không thể trỏ sang API staging/production nếu không sửa mã nguồn và build lại.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Frontend Web - API Layer (toàn bộ FEAT-01 → FEAT-06)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Mở `src/frontend/web/src/app/core/services/api.service.ts`, xem dòng 11.
2. Chạy `make web` ở chế độ production/staging (build với cấu hình environment tương ứng).
3. Mở DevTools → tab Network, thực hiện đăng nhập hoặc gọi bất kỳ API nào.
4. Quan sát URL request phát sinh.

## 3. Kết Quả Thực Tế (Actual Result)
- Mọi request đều trỏ tới `http://localhost:8088` bất kể môi trường build; trên trình duyệt truy cập staging/production sẽ lỗi `ERR_CONNECTION_REFUSED` hoặc gọi nhầm máy người dùng.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo `AGENTS.md` và DES-03, `baseUrl` phải được nạp từ `environment.ts`/`environment.prod.ts` (hoặc cấu hình runtime), mỗi môi trường trỏ đúng endpoint API của mình; không có chuỗi URL nào bị hardcode trong service.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
