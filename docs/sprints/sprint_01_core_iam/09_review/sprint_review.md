# [09] Biên Bản Tổng Kết & Nghiệm Thu Đóng Sprint: Sprint 01 - Core IAM

- **Mã Biên Bản**: REV-01
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Phụ Trách**: PM Agent
- **Trạng Thái**: [x] ĐÃ ĐÓNG SPRINT (2026-09-18) - Khách hàng nghiệm thu

---

## 1. Mục Tiêu Sprint & Kết Quả Đạt Được
- **Mục tiêu**: Xây dựng hệ thống Core IAM hoàn chỉnh theo chuẩn SaaS Multi-Tenant, hỗ trợ đầy đủ 6 tính năng cốt lõi.
- **Tiến độ cam kết**: 6/6 Features trong `07_items/`.
- **Báo cáo Code Review**: [CODE_REVIEW_SPRINT_01.md](CODE_REVIEW_SPRINT_01.md) (REV-02) — phát hiện 9 `Critical` + 14 `High` + 8 `Medium`, đã lập 31 file `BUG` trong `07_items/`. Toàn bộ item > Medium phải `Done` trước khi đóng Sprint.

---

## 2. Kiểm Tra Ràng Buộc Đóng Sprint (Sprint Closure DoD Gate)
Trước khi đóng Sprint, PM Agent và QA Agent bắt buộc phải xác nhận 100% các điều kiện:

- [x] **Điều kiện 1: Mức độ ưu tiên**: Không còn bất kỳ task/bug nào ở mức `Critical` hoặc `High` chưa hoàn thành.
  - *Chốt 2026-09-18*: 100% item Critical/High/Medium/Low đều Done (46/46 BUG + FEAT-01→09); không còn item chưa hoàn thành.
- [x] **Điều kiện 2: Kiểm thử Backend**: 100% Automated Unit/Integration Tests của Quarkus Java đạt Pass.
  - *Kết quả 2026-09-18*: `mvn test` BUILD SUCCESS, **30/30 test PASS** (PostgreSQL + Redis thật, không H2); bổ sung `EntityRegistryServiceTest` và các test tồn đọng BUG-44; browser verify 6/6 PASS.
- [x] **Điều kiện 3: Kiểm thử Frontend**: QA/QC hoàn thành Browser Manual Testing trên Web Browser và thiết bị di động, không có lỗi console.
  - *Chốt 2026-09-18*: QA/QC + Khách hàng đã kiểm thử thủ công trên trình duyệt Web/điện thoại và thiết bị/mô phỏng Mobile; không lỗi console (puppeteer 0 error).
- [x] **Điều kiện 4: Hướng dẫn sử dụng**: Đã hoàn thiện tài liệu hướng dẫn sử dụng kèm hình ảnh trực quan tại `docs/06_user_guides/`.
  - *Chốt 2026-09-18*: UG-01 tại docs/06_user_guides/sprint_01_core_iam_user_guide.md kèm 25 ảnh (Web light/dark + Mobile + responsive).
- [x] **Điều kiện 5: Xác nhận của Khách hàng**: Khách hàng đã ký duyệt nghiệm thu kết quả Sprint.
  - *Chốt 2026-09-18*: Khách hàng xác nhận "Sprint 1 có thể đóng".

---

## 3. Báo Cáo Xử Lý BUG & QA Re-test (2026-09-18)

- **Báo cáo code review**: [CODE_REVIEW_SPRINT_01.md](CODE_REVIEW_SPRINT_01.md) (REV-02) - 9 Critical + 14 High + 8 Medium.
- **Báo cáo QA re-test**: [QA_RETEST_SPRINT_01.md](QA_RETEST_SPRINT_01.md) (REV-03) - toàn bộ Critical/High đã xử lý; backend 30/30 test PASS; Web + Mobile build PASS.
- **Lỗi phát sinh khi QA**: BUG-32 (hủy session chéo người dùng - High, đã sửa + test pass), BUG-33 (lỗi 4xx thành 500 - High, đã sửa + test pass), BUG-34 (401 body rỗng - Medium, đã xử lý: mọi 401 trả envelope `code=UNAUTHORIZED`).
- **Lỗi phát sinh từ manual test khách hàng (browser)**: BUG-35 (Tailwind thiếu `@source` cho thư viện shared - Critical, đã sửa + verify), BUG-36 (dark mode chưa đồng nhất - High, đã sửa + verify), BUG-37 (trạng thái UI chưa route hóa - High, đã refactor route Web + Mobile + verify 7/7 & 18/18 PASS).

### Tổng Kết Item Đã Xử Lý (Không Còn Item Hoãn)

| Mã | Tiêu Đề | Mức Độ | Lý Do Hoãn |
| :--- | :--- | :--- | :--- |
| BUG-24 | `TenantType` ORGANIZATION vs BUSINESS | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-25 | `ResponseKey` enum chưa dùng hết | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-26 | Entity Registry chưa đăng ký | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-27 | JWT issuer hardcode + khóa PEM môi trường | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-28 | FE API envelope mismatch | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-29 | UI state chưa đồng bộ (TopBar, checkbox) | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-30 | Form doanh nghiệp 1 bước, thiếu live-check slug/resend UI | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-31 | Schema drift DES-01 (JSONB, index, cột OTP) | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-34 | 401 body rỗng từ HTTP Security | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-41 | Fresh clone thiếu bootstrap khóa JWT | High | Đã xử lý trong review: thêm `scripts/dev/generate_jwt_keys.js` + tự động sinh khóa trong `run_backend.bat`/`.sh`, tài liệu local setup mục 3.5 |
| BUG-42 | CORS chưa cấu hình cho Production | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-43 | Thiếu key i18n cho `BAD_REQUEST`/`METHOD_NOT_ALLOWED`/`UNSUPPORTED_MEDIA_TYPE` | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-44 | Khoảng trống test coverage backend (select-tenant, backup code single-use, disable 2FA sai code, revoke sessions, hết hạn lock brute-force) | Medium | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-45 | DES-02 lệch mã lỗi API regenerate-backup-codes | Low | Đã xử lý trong đợt sửa 2026-09-18 (Done) |
| BUG-46 | Drawer tắt 2FA dùng nhầm key i18n cảnh báo | Medium | Đã xử lý trong review: thêm key `ACCOUNT_2FA_DISABLE_WARNING` (vi/en), drawer dùng đúng key |
| (Low) | Drawer width, pom artifact, vitest config, dead shims, aria, unused i18n, ShapeVariant, token expiry, focus-trap | Low | Đã xử lý trong đợt FEAT-07 (Done) |

---

## 4. Bài Học Kinh Nghiệm (Retrospective)
- **Điểm làm tốt**: Quy trình Sprint-Pack + Confirmation Gate giúp chặn lỗi sớm; QA automated (JUnit/RestAssured + puppeteer) phát hiện nhiều lỗi tích hợp trước khi khách hàng test; phản hồi khách hàng được xử lý trong ngày.
- **Điểm cần cải thiện**: Cấu hình Tailwind `@source` cho thư viện shared cần được kiểm tra ngay từ đầu; bộ test ban đầu dùng chung DB dev (đã tách `openerp_test`); cần chuẩn hóa điều hướng NavController cho Mobile ngay từ khi khởi tạo.
- **Hành động cho Sprint 02**: Bổ sung checklist "kiểm tra build config + test isolation + điều hướng" vào Definition of Ready; giữ puppeteer smoke test cho mỗi sprint.

---

## 5. Bàn Giao Sprint 01
- **Sản phẩm**: Core IAM hoàn chỉnh (Đăng ký cá nhân/doanh nghiệp, Đăng nhập & chọn Workspace, Quên mật khẩu, 2FA TOTP, Quản lý tài khoản) trên Web (Angular 22) + Mobile (Ionic 8), hỗ trợ theme Sáng/Tối/Hệ thống và responsive điện thoại.
- **Kiểm thử**: `mvn test` 30/30 PASS (PostgreSQL + Redis thật); browser/mobile automation PASS; hướng dẫn QA tại `08_testing/manual_test_guide.md`.
- **Tài liệu**: [UG-01 User Guide](../../06_user_guides/sprint_01_core_iam_user_guide.md) (25 ảnh), [TR-01 Test Report](../08_testing/test_reports/test_report_sprint_01.md), [Entity Registry](../../system/entity_registry/CORE_IAM_REGISTRY.md).
- **Xác nhận khách hàng**: Đồng ý đóng Sprint 01 ngày 2026-09-18.
