# [09] Biên Bản Tổng Kết & Nghiệm Thu Đóng Sprint: Sprint 01 - Core IAM

- **Mã Biên Bản**: REV-01
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Phụ Trách**: PM Agent
- **Trạng Thái**: [x] Đã xử lý toàn bộ bug - chờ QA Browser Manual Testing & commit để đóng Sprint

---

## 1. Mục Tiêu Sprint & Kết Quả Đạt Được
- **Mục tiêu**: Xây dựng hệ thống Core IAM hoàn chỉnh theo chuẩn SaaS Multi-Tenant, hỗ trợ đầy đủ 6 tính năng cốt lõi.
- **Tiến độ cam kết**: 6/6 Features trong `07_items/`.
- **Báo cáo Code Review**: [CODE_REVIEW_SPRINT_01.md](CODE_REVIEW_SPRINT_01.md) (REV-02) — phát hiện 9 `Critical` + 14 `High` + 8 `Medium`, đã lập 31 file `BUG` trong `07_items/`. Toàn bộ item > Medium phải `Done` trước khi đóng Sprint.

---

## 2. Kiểm Tra Ràng Buộc Đóng Sprint (Sprint Closure DoD Gate)
Trước khi đóng Sprint, PM Agent và QA Agent bắt buộc phải xác nhận 100% các điều kiện:

- [ ] **Điều kiện 1: Mức độ ưu tiên**: Không còn bất kỳ task/bug nào ở mức `Critical` hoặc `High` chưa hoàn thành.
  - *Tiến độ 2026-09-18*: 14/14 item Critical/High đã sửa; 12 item backend `Done` (automated test), 13 item Web/Mobile `In Review` chờ Browser Manual Testing. Không còn item Critical/High ở trạng thái `To Do`.
- [x] **Điều kiện 2: Kiểm thử Backend**: 100% Automated Unit/Integration Tests của Quarkus Java đạt Pass.
  - *Kết quả 2026-09-18*: `mvn test` BUILD SUCCESS, **30/30 test PASS** (PostgreSQL + Redis thật, không H2); bổ sung `EntityRegistryServiceTest` và các test tồn đọng BUG-44; browser verify 6/6 PASS.
- [ ] **Điều kiện 3: Kiểm thử Frontend**: QA/QC hoàn thành Browser Manual Testing trên Web Browser và thiết bị di động, không có lỗi console.
- [ ] **Điều kiện 4: Hướng dẫn sử dụng**: Đã hoàn thiện tài liệu hướng dẫn sử dụng kèm hình ảnh trực quan tại `docs/06_user_guides/`.
- [ ] **Điều kiện 5: Xác nhận của Khách hàng**: Khách hàng đã ký duyệt nghiệm thu kết quả Sprint.

---

## 3. Báo Cáo Xử Lý BUG & QA Re-test (2026-09-18)

- **Báo cáo code review**: [CODE_REVIEW_SPRINT_01.md](CODE_REVIEW_SPRINT_01.md) (REV-02) - 9 Critical + 14 High + 8 Medium.
- **Báo cáo QA re-test**: [QA_RETEST_SPRINT_01.md](QA_RETEST_SPRINT_01.md) (REV-03) - toàn bộ Critical/High đã xử lý; backend 30/30 test PASS; Web + Mobile build PASS.
- **Lỗi phát sinh khi QA**: BUG-32 (hủy session chéo người dùng - High, đã sửa + test pass), BUG-33 (lỗi 4xx thành 500 - High, đã sửa + test pass), BUG-34 (401 body rỗng - Medium, đã xử lý: mọi 401 trả envelope `code=UNAUTHORIZED`).
- **Lỗi phát sinh từ manual test khách hàng (browser)**: BUG-35 (Tailwind thiếu `@source` cho thư viện shared - Critical, đã sửa + verify), BUG-36 (dark mode chưa đồng nhất - High, đã sửa + verify), BUG-37 (trạng thái UI chưa route hóa - High, đã refactor route Web + Mobile + verify 7/7 & 18/18 PASS).

### Danh Sách Hoãn Sang Sprint 02 (Deferred Items)

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
| (Low) | Drawer width, pom artifact, vitest config, dead shims, aria, unused i18n... | Low | Xem mục 3 của REV-02 |
