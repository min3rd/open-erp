# [BUG-76] Sau Đổi Mật Khẩu Bắt Buộc, Frontend Điều Hướng Vào Portal Với Token Cũ — Toàn Bộ API Platform Trả 403

- **Mã Lỗi**: BUG-76
- **Phân Loại**: Bug / Defect (Frontend UX, trái đặc tả DES-02-API §3.13)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Browser Dual-Mode Testing Sprint 02)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Luồng bắt buộc đổi mật khẩu Platform Admin bị **dead-end trên giao diện**: sau khi đổi mật khẩu thành công, `PlatformChangePasswordComponent` điều hướng thẳng tới `/platform/tenants` trong khi access token hiện tại **vẫn mang claim `must_change_password = true`**. Backend (đúng theo thiết kế DES-02-API §3.13 bước 4) chặn mọi API `/platform/**` với `403 PLATFORM_PASSWORD_CHANGE_REQUIRED`, khiến màn hình hiển thị banner đỏ "Bạn phải đổi mật khẩu trước khi tiếp tục" và bảng dữ liệu rỗng ngay sau khi người dùng vừa đổi mật khẩu.

- **Môi trường**: Web Desktop 1440x900, Chrome; backend Quarkus dev; PostgreSQL + Redis thật.
- **Tài khoản test**: `qa.sa02@example.com` (SUPER_ADMIN) cấp quyền SUPPORT_ENGINEER cho `qa.support02@example.com`.

### Bằng chứng (file:line)

- `src/frontend/web/src/app/features/platform/change-password/change-password.component.ts:69-71` — sau khi đổi mật khẩu thành công: `markPasswordChanged()` (chỉ set `sessionStorage`, không đổi token) rồi `this.router.navigateByUrl('/platform/tenants')` — **trái với đặc tả**.
- `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:604` (DES-02-API §3.13 bước 4): *"token cũ vẫn mang claim `must_change_password = true` nên tiếp tục bị chặn; đăng nhập lại để nhận token mới"*.
- `src/backend/.../platform/security/PlatformRoleRequiredFilter.java:137-142` — chặn bằng `PLATFORM_PASSWORD_CHANGE_REQUIRED` (hành vi đúng thiết kế).
- `src/backend/.../iam/service/AccountService.java:135-136` — DB đã clear cờ `must_change_password = false` (dữ liệu đúng, chỉ token cũ còn claim).

### Bằng chứng runtime

1. Đổi mật khẩu thành công (200) → DB `platform_super_admins.must_change_password = false`.
2. Gọi `GET /api/v1/platform/tenants` bằng **chính token vừa dùng để đổi mật khẩu** → `403 PLATFORM_PASSWORD_CHANGE_REQUIRED` (documented behavior).
3. Logout → đăng nhập lại → token mới → `GET /api/v1/platform/tenants` → **200** (workaround bắt buộc).
4. Ảnh minh chứng trạng thái dead-end: `../08_testing/screenshots/web/QA-W-07_e_support_tenants_readonly.png` (bảng "Không có dữ liệu" + banner đỏ dù vừa đổi mật khẩu thành công).
5. Console ghi 3 lỗi `403` cho các request platform ngay sau khi đổi mật khẩu.

### Các bước tái hiện (Reproduction Steps)

1. SUPER_ADMIN cấp quyền `SUPPORT_ENGINEER` cho một user mới (hoặc disable/reset password) → admin có `must_change_password=true`.
2. Đăng xuất → đăng nhập tài khoản SUPPORT_ENGINEER → tự động vào `/platform/change-password`.
3. Nhập mật khẩu hiện tại + mật khẩu mới hợp lệ → bấm "Đổi mật khẩu".
4. **Quan sát**: ứng dụng chuyển ngay tới `/platform/tenants`; banner đỏ "Bạn phải đổi mật khẩu trước khi tiếp tục"; danh sách "Không có dữ liệu"; mọi tab platform không tải được.
5. Chỉ khắc phục được bằng cách đăng xuất và đăng nhập lại.

## 2. Tác Động

- Luồng onboarding bắt buộc của Platform Admin (grant → đổi mật khẩu → làm việc) **bị chặn** ngay sau bước đổi mật khẩu; người dùng tưởng thao tác thất bại.
- QA-W-07 (read-only SUPPORT_ENGINEER) không thể kiểm chứng trên trình duyệt nếu không re-login thủ công.
- Sai lệch trạng thái UI ↔ token ↔ DB gây nhầm lẫn và tăng tải hỗ trợ.

## 3. Kết Quả Kỳ Vọng

- Sau khi đổi mật khẩu bắt buộc thành công, frontend **phải đăng xuất phiên hiện tại và điều hướng về `/login`** kèm thông báo (ví dụ `PASSWORD_CHANGE_SUCCESS` / yêu cầu đăng nhập lại), **hoặc** tự động gọi `/auth/login` lại để nhận token mới trước khi vào portal.
- Không được điều hướng vào `/platform/**` khi token còn claim `must_change_password=true`.
- Bổ sung kiểm thử hành vi (browser) cho luồng change-password của platform admin.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer sửa luồng điều hướng sau đổi mật khẩu (logout + /login hoặc re-login tự động).
- [ ] QA re-test: login SUPPORT_ENGINEER → đổi mật khẩu → phải được yêu cầu đăng nhập lại (không còn banner đỏ giả) → sau re-login vào `/platform/tenants` bình thường.
- [ ] Cập nhật `08_testing/test_report.md` (QA-W-07) sau khi sửa.

## Ghi Chú QA (2026-09-19)

- Phần backend/DB **đúng thiết kế** (cờ DB cleared, audit ghi nhận); lỗi thuộc **frontend routing**.
- QA-W-07 được xác nhận lại PASS ở phần read-only bằng token hợp lệ (đăng nhập lại) — xem `08_testing/test_report.md`.

## Ghi Chú Hoàn Thành (2026-09-19)

- **Quyết định thiết kế**: thực hiện **cả hai lớp phòng vệ** ở backend —
  1. *Thu hồi session*: khi đổi mật khẩu bắt buộc của platform admin thành công, toàn bộ session Redis của user bị thu hồi → token cũ không còn hợp lệ.
  2. *Không tin claim*: `PlatformRoleRequiredFilter` đối chiếu trạng thái thật từ DB `platform_super_admins.must_change_password` thay vì chỉ đọc claim trong JWT (xử lý cả 2 chiều: claim cũ `true` nhưng DB đã `false`, và DB reset `true` nhưng token cũ còn claim `false`).
- **Thay đổi**:
  - `src/backend/.../modules/iam/service/AccountService.java:110-119` — sau `releasePlatformAdminPasswordChange` (trả về `boolean`), gọi `sessionManager.revokeAllSessions(userId)` cho luồng đổi mật khẩu bắt buộc; luồng user thường giữ nguyên ngữ nghĩa `logout_other_devices`.
  - `src/backend/.../modules/platform/security/PlatformRoleRequiredFilter.java:153-162` — reconcile `must_change_password` theo DB; token cũ sau thay đổi bị chặn 401 (session đã thu hồi) / 403 (nếu DB vẫn yêu cầu đổi).
- **Test**: `PlatformPasswordChangeFlowTest` bổ sung bước 3b — token A sau `change-password` gọi `/platform/tenants` trả **401**; login lại (token mới, claim `false`) trả 200.
- **Còn lại cho FE agent**: `change-password.component.ts` cần logout + điều hướng `/login` kèm thông báo thay vì vào thẳng `/platform/tenants` (phần routing của bug).
- Kiểm chứng: full `mvn test` **187/187 PASS** (PostgreSQL + Redis thật, không H2).

## Ghi Chú QA Re-test (2026-09-19) — QA-R-76: PASS

- Kịch bản thực tế: grant `SUPPORT_ENGINEER` (must_change_password=true) → reset mật khẩu qua email Mailpit để có mật khẩu biết trước → login → app điều hướng `/platform/change-password`.
- Token cũ trước khi đổi bị chặn đúng thiết kế: **403 `PLATFORM_PASSWORD_CHANGE_REQUIRED`**; sau khi đổi mật khẩu thành công: token cũ gọi `/platform/tenants` → **401 `UNAUTHORIZED`** (session đã thu hồi).
- Frontend tự xóa phiên (`openerp_token` + `openerp_refresh_token` = cleared) và đưa về `/login`; không còn dead-end.
- Login lại bằng mật khẩu mới → vào portal bình thường (`/dashboard` → `/platform/tenants` render bảng, **không** lặp đổi mật khẩu, không banner đỏ).
- Console: 1 lỗi `401` tại thời điểm token cũ bị backend chặn — **đúng bản chất ca âm** (bằng chứng token bị thu hồi), không phải lỗi chức năng.
- Ảnh: `QA-R-76_a_mandatory_change_password_page.png`, `QA-R-76_b_change_password_filled.png`, `QA-R-76_c_after_submit.png`, `QA-R-76_d_relogin_portal_ok.png` (+ bộ `QA-R-76b_*`).
- **Kết luận**: luồng đổi mật khẩu bắt buộc an toàn, token cũ bị vô hiệu → giữ **Done**.
