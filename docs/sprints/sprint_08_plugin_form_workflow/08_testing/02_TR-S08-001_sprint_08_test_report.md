# [TR-S08-001] Test Report Sprint 08 — Plugin Form builder & Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S08-001 / Báo cáo kiểm thử / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 — **chưa sign-off**: TC-E/TC-B/TC-S chưa chạy |
| Owner / reviewer | QA Agent / Chưa review |
| Đầu vào | [TP-S08-001](01_TP-S08-001_sprint_08_test_plan.md), baseline working tree 2026-11-02 |
| Đọc trước / đọc tiếp | [TP-S08-001](01_TP-S08-001_sprint_08_test_plan.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) |

## 1. Kết quả đã chạy (baseline working tree 2026-11-02, PostgreSQL + Redis thật qua `npm run infra`)

| Nhóm | Bộ test | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| TC-I Core | `mvn -f src/backend/pom.xml test` — 65 class | **278/278 PASS** | Bao gồm Event Hub/Proxy/Public Session compile-integrated; relay tắt ở `%test` |
| TC-I employee | `mvn -pl employee -am test` | **18/18 PASS** | Sau migration runtime sang engine (FEAT-42); ApprovalChainTest thuần giữ nguyên |
| TC-N form | `mvn -pl form -am test` — FormDocumentValidatorTest | **7/7 PASS** | ref unique/pattern, forward-only logic 2-pass, ref type immutable |
| TC-N workflow | `mvn -pl workflow -am test` — ExpressionEvaluatorTest | **6/6 PASS** | DSL điều kiện: EQ/NEQ/GT/GTE/LT/LTE/IN/CONTAINS, AND/OR, unknown-op fail-closed |
| Build WC | `npm run form:ui:build`, `workflow:ui:build` | PASS | Bundle vào META-INF/resources 2 plugin; i18n merge 13 locale |

Tổng cộng **309/309 PASS** ở mức unit + integration hiện có.

## 2. Chưa chạy (chặn sign-off — khônghiện Done (QA))

| Mục | Loại | Điều kiện cần |
| :--- | :--- | :--- |
| TC-E1 Cutover employee | E2E app thật | Deploy workflow + form + employee 1.2.0 lên tenant QA; regression đề xuất mới + đề xuất import + rollback drill (ADR-S08-004 §2.4) |
| TC-E2 Chuỗi form → workflow | E2E app thật | Submit form public → event hub → instance → duyệt 2 bước → entity write qua proxy |
| TC-B Browser Desktop/Mobile | Manual browser | Cả 2 WC ở Desktop ≥1280 + Mobile 390×844; 0 console error; chụp minh chứng |
| TC-S Bảo mật public | Negative REST | Anonymous token rỗng quyền/401 hết hạn/429 rate limit/cross-tenant |

## 3. Bug ghi nhận

Chưa có bug chính thức (chưa có finding từ TC-E/B/S). Phát hiện trong lúc dev (đã sửa): FormValue API không ổn định → đổi multipart byte[]; asset i18n ngoài workspace bị @angular/build từ chối → merge vào host `public/i18n` theo pattern chung.

## 4. Kết luận

**Không đủ dữ kiện để PASS/FAIL sprint** — implementation Done (Dev) với 309 test xanh, nhưng 4 nhóm kiểm thử cốt lõi (cutover, chuỗi tích hợp end-to-end, browser, bảo mật public) chưa chạy. QA sign-off chờ các mục §2.
