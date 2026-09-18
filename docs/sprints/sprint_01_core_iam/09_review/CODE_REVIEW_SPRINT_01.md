# [REV-02] Báo Cáo Review Mã Nguồn Sprint 01 - Core IAM

- **Mã Báo Cáo**: REV-02
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Người Thực Hiện**: QA/QC Agent (theo yêu cầu Khách hàng)
- **Ngày Thực Hiện**: 2026-09-18
- **Phạm Vi**: Toàn bộ `src/backend` (Quarkus Java), `src/frontend` (Angular 22 Web, thư viện shared), bộ test, đối chiếu `05_solutions`, `06_designs`, `07_items` và `AGENTS.md`.
- **Trạng Thái**: [x] Đã review xong - **CHƯA ĐẠT nghiệm thu Sprint**

---

## 1. Bằng Chứng Kiểm Chứng (Verification Evidence)

| Hạng Mục | Lệnh / Phương Pháp | Kết Quả |
| :--- | :--- | :--- |
| Backend Unit/Integration Test | `mvn test` tại `src/backend` (PostgreSQL thật, không H2) | **PASS** - 10/10 test, BUILD SUCCESS |
| Frontend Build | `ng build --configuration development` tại `src/frontend/web` | **PASS** |
| Đối chiếu API Contract | So sánh `DES-02` ↔ `AuthResource`/`AccountResource` ↔ service frontend | **FAIL** - xem BUG-02 → BUG-06, BUG-12 |
| Đối chiếu DB Schema | `DES-01` ↔ `V1.0.0__init_core_iam_schema.sql` | **FAIL** - xem BUG-24, BUG-31 |
| Guardrails AGENTS.md | i18n, Anti-Modal, Enum, ResponseKey, Redis, Entity Registry, bảo mật | **FAIL** - xem BUG-08 → BUG-27 |

---

## 2. Tổng Hợp 31 Lỗi Đã Ghi Nhận Trong `07_items/`

### 2.1. Mức `Critical` (9 lỗi) - Bắt buộc sửa trước khi đóng Sprint
| Mã | Tiêu Đề | Phân Hệ |
| :--- | :--- | :--- |
| [BUG-01](../07_items/BUG-01_mobile_ionic8_missing.md) | Chưa triển khai ứng dụng Mobile Ionic 8 | Mobile |
| [BUG-02](../07_items/BUG-02_fe_wrong_2fa_verify_endpoint.md) | FE gọi sai endpoint xác thực 2FA khi đăng nhập | Frontend |
| [BUG-03](../07_items/BUG-03_fe_regenerate_backup_codes.md) | FE sai endpoint + sai kiểu response tái tạo Backup Codes | Frontend |
| [BUG-04](../07_items/BUG-04_fe_revoke_other_sessions.md) | FE sai method/path thu hồi các phiên khác | Frontend |
| [BUG-05](../07_items/BUG-05_fe_payload_camelcase.md) | FE gửi payload camelCase trong khi API yêu cầu snake_case | Frontend |
| [BUG-06](../07_items/BUG-06_fe_response_key_mismatch.md) | FE sai key model Workspace Picker / AuthUser | Frontend |
| [BUG-07](../07_items/BUG-07_setup_2fa_drawer_not_initialized.md) | Drawer Setup 2FA không khởi tạo, thiếu QR Code | Frontend |
| [BUG-08](../07_items/BUG-08_bcrypt_instead_of_argon2id.md) | Dùng BCrypt thay vì Argon2id (trái CONF-01) | Backend Security |
| [BUG-09](../07_items/BUG-09_totp_secret_plaintext.md) | TOTP Secret lưu plaintext, không mã hóa AES-256-GCM | Backend Security |

### 2.2. Mức `High` (14 lỗi) - Bắt buộc sửa trước khi đóng Sprint
| Mã | Tiêu Đề | Phân Hệ |
| :--- | :--- | :--- |
| [BUG-10](../07_items/BUG-10_inmemory_sessions_bruteforce.md) | Session & Brute-force lưu in-memory thay vì Redis | Backend |
| [BUG-11](../07_items/BUG-11_bruteforce_missing_window.md) | Brute-force thiếu cửa sổ 10 phút, cột DB không dùng | Backend |
| [BUG-12](../07_items/BUG-12_missing_auth_endpoints.md) | Thiếu API `refresh`, `logout`, `resend-verification` | Backend/FE |
| [BUG-13](../07_items/BUG-13_reset_token_otp_plaintext_logs.md) | Reset token lưu raw, OTP plaintext, log lộ secret | Backend Security |
| [BUG-14](../07_items/BUG-14_2fa_attempt_lockout_missing.md) | Thiếu khóa 2FA sau 3 lần nhập sai | Backend |
| [BUG-15](../07_items/BUG-15_backup_codes_timing.md) | Backup Codes trả sai bước (setup thay vì enable) | Backend/FE |
| [BUG-16](../07_items/BUG-16_fe_hardcoded_api_base_url.md) | FE hardcode API Base URL `localhost:8088` | Frontend |
| [BUG-17](../07_items/BUG-17_fe_missing_auth_guard_interceptor.md) | Thiếu Auth Guard, Interceptor, xử lý 401/refresh | Frontend |
| [BUG-18](../07_items/BUG-18_fe_hardcoded_i18n_text.md) | Hardcode text UI + thiếu key i18n | Frontend |
| [BUG-19](../07_items/BUG-19_fe_alert_prompt_confirm.md) | Lạm dụng `alert/prompt/confirm` (vi phạm Anti-Modal) | Frontend |
| [BUG-20](../07_items/BUG-20_missing_authenticated_annotation.md) | Thiếu `@Authenticated` trên endpoint tài khoản | Backend |
| [BUG-21](../07_items/BUG-21_hardcoded_ip_address.md) | IP phiên hardcode `127.0.0.1` | Backend |
| [BUG-22](../07_items/BUG-22_business_registration_no_activation_email.md) | Đăng ký doanh nghiệp không gửi email kích hoạt | Backend |
| [BUG-23](../07_items/BUG-23_test_coverage_gaps.md) | Thiếu test RestAssured/tenant isolation, TC lệch test_plan | QA |

### 2.3. Mức `Medium` (8 lỗi) - Được phép hoãn nếu có lý do, nhưng phải theo dõi
| Mã | Tiêu Đề | Phân Hệ |
| :--- | :--- | :--- |
| [BUG-24](../07_items/BUG-24_tenant_type_enum_mismatch.md) | `TenantType` ORGANIZATION vs BUSINESS không đồng bộ | Data/Enum |
| [BUG-25](../07_items/BUG-25_response_key_not_used.md) | `ResponseKey` enum không dùng, params dùng literal | Backend |
| [BUG-26](../07_items/BUG-26_entity_registry_missing.md) | Chưa đăng ký Entity Registry | Backend |
| [BUG-27](../07_items/BUG-27_jwt_issuer_hardcoded_keys_config.md) | JWT issuer hardcode, khóa PEM chung môi trường | Backend |
| [BUG-28](../07_items/BUG-28_fe_api_envelope_mismatch.md) | FE envelope thiếu `success/message/params`, thừa `meta` | Frontend |
| [BUG-29](../07_items/BUG-29_ui_state_not_synced.md) | Profile update không refresh TopBar, checkbox login chết | Frontend |
| [BUG-30](../07_items/BUG-30_business_form_and_resend_gaps.md) | Form doanh nghiệp 1 bước, thiếu live-check slug & resend OTP | Frontend |
| [BUG-31](../07_items/BUG-31_schema_drift_des01.md) | Migration lệch DES-01 (JSONB, index, OTP trong Redis) | Database |

---

## 3. Danh Sách Lỗi Mức `Low` Chưa Lập File Riêng (Đề Xuất Gộp Backlog)

> Các điểm dưới đây đã được ghi nhận trong báo cáo; khi xử lý có thể gộp vào item `REFACTOR` hoặc `BUG` mức Low.

1. FE kích thước Drawer lệch DES-03: `max-w-xl` (~576px) vs 440px, setup `max-w-lg` vs 420px, disable `max-w-md` vs 380px; thiếu hiệu ứng đẩy Drawer cha.
2. `pom.xml` dùng artifact đã relocated `quarkus-resteasy-reactive-jackson` (khuyến nghị `quarkus-rest-jackson`) - Maven warning.
3. `tsconfig.spec.json` khai báo `vitest/globals` nhưng không có dependency; script `ng test` sẽ fail (Frontend không viết unit test nên nên gỡ cấu hình).
4. File shim chết: `web/src/app/core/services/i18n.service.ts`, `web/src/app/core/models/api.model.ts` (chỉ re-export `@shared`, không được import).
5. `pin-input.component.ts:18` hardcode mảng 6 ô dù có input `length`; thiếu `aria-label`.
6. `index.html` cố định `lang="en"` và `<title>Web</title>`.
7. Một số key i18n dư không dùng; `ShapeVariant` chưa được sử dụng.
8. Token lưu `localStorage` không kiểm tra hạn khi khởi động; Drawer thiếu focus-trap/`role="dialog"`.

---

## 4. Đánh Giá Điều Kiện Đóng Sprint (DoD Gate)

| Điều Kiện | Kết Quả |
| :--- | :--- |
| 100% item `Critical` đạt `Done` | **FAIL** - 9/9 đang `To Do` |
| 100% item `High` đạt `Done` | **FAIL** - 14/14 đang `To Do` |
| Backend test bao phủ logic + phân quyền Tenant (JUnit 5 + RestAssured) | **FAIL** - thiếu REST/tenant isolation test (BUG-23) |
| Frontend không còn lỗi console/console error | **CHƯA XÁC NHẬN** - cần Browser Manual Testing sau khi sửa |
| Tài liệu hướng dẫn sử dụng có hình ảnh | **CHƯA CÓ** |
| Biên bản nghiệm thu `sprint_review.md` | **CHƯA ĐÓNG** |

> **KẾT LUẬN**: Sprint 01 **CHƯA ĐỦ ĐIỀU KIỆN ĐÓNG**. Toàn bộ 23 item `Critical` + `High` phải được sửa và QA re-test đạt trước khi xem xét đóng Sprint.

---

## 5. Điểm Đã Đạt Chuẩn (Ghi Nhận Tích Cực)

- Angular 22 + Tailwind CSS v4; không sử dụng thư viện UI bên thứ 3.
- 100% component tách file `.html`; không có file `.spec.ts` (đúng chính sách).
- Thư viện shared đặt đúng `src/frontend/shared`, alias `@shared` cấu hình đúng.
- Design token enums dùng chung (`ColorVariant`, `SizeVariant`, `ShapeVariant`), không phân mảnh.
- Không có component Modal; dùng Drawer xếp chồng đúng định hướng Anti-Modal.
- i18n `vi.json`/`en.json` đồng bộ key; pipe/directive i18n hoạt động.
- Backend: response envelope code-based, DTO cố định (không `Map<String,Object>`), Flyway migration, Personal Workspace hoạt động, disable 2FA xác thực kép đúng, backup code single-use.
- `.gitignore` loại trừ `*.pem`, `target/`, `dist/`; không commit secret.

---

## 6. Hành Động Tiếp Theo (Next Actions)

1. Developer Agent xử lý lần lượt **BUG-01 → BUG-23** (Critical/High) theo thiết kế đã confirm.
2. QA/QC re-test: `mvn test` + Browser Manual Testing (drawer, i18n, luồng đăng ký/2FA), cập nhật mục 6 trong từng file BUG.
3. Các BUG-24 → BUG-31 (Medium) sửa trong Sprint 01 nếu còn nguồn lực, nếu không phải ghi rõ lý do và chuyển backlog Sprint 02.
4. Hoàn thiện tài liệu `docs/06_user_guides/` kèm hình ảnh trước khi đóng Sprint.
