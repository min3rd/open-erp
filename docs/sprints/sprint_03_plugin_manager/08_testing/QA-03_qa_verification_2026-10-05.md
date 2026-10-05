# [QA-03] Báo Cáo Kiểm Chứng QA — Sprint 03 (Đợt xác nhận 2026-10-05)

- **Mã Tài Liệu**: QA-03
- **Phạm Vi**: Kiểm chứng lại các item `Resolved`/`Implemented` chờ ký trước khi đóng Sprint 03
- **Phụ Trách**: QA Agent (chạy tự động theo chỉ đạo trực tiếp của chủ dự án ngày 2026-10-05)
- **Nguồn**: yêu cầu "QA verify lại, ok thì ký đóng Sprint 3"
- **Baseline**: commit `cde88ef` + các fix QA `a97730a`, `1953467`
- **Môi Trường**: PostgreSQL + Redis thật (không H2), backend `:8088`, web `:4200`, mobile `:8100`; headless Chrome (CDP), viewport `1280×900` và `390×844`
- **Kết Luận**: **PASS** — 0 lỗi tồn đọng; 2 lỗi phát hiện trong đợt này đã sửa và kiểm chứng lại.

> **Tính trung thực**: báo cáo này do **QA Agent tự chạy** (không phải chữ ký của người thứ ba độc lập). Việc đóng Sprint dựa trên **chỉ đạo trực tiếp của chủ dự án**, được ghi nhận rõ tại `09_review/sprint_review.md` mục 8/9.

---

## 1. Item Kiểm Chứng

| Mã | Mức | Kết quả QA | Bằng chứng |
| :--- | :---: | :---: | :--- |
| **BUG-117** | High | **PASS** | `DataPolicyApiTest 5/5`, `SampleRecordApiTest 7/7`, `SecurityContextServiceTest 4/4`, `PermissionFilterTest 5/5`; migration V3.0.4 + backfill admin `ALL` (log "ensured for N tenant(s)"). |
| **BUG-118** | High | **PASS** | `AuthResourceApiTest 18/18` (đăng ký tạo org gốc HQ + GENERAL + membership/assignment). |
| **BUG-119** | Medium | **PASS** | Browser: roles `/…/-/create` và org `/…/-/dept-create` mở từ URL và **giữ nguyên sau F5**; sửa lỗi deep-link org trong đợt này. |
| **BUG-120** | Medium | **PASS** | Browser: drawer gán người dùng `left=860 right=1280 gapRight=0` (flush mép phải). |
| **TASK-354** | Medium | **PASS** | `AccountAvatarApiTest 3/3` (upload → serve public → profile; ref có tiền tố `tenant-files/<tenantId>/avatars/`; chặn `.txt`/`.bmp` 400; ref thiếu 400, ref lạ 404); sửa lỗi envelope JSON của endpoint binary. |
| **BUG-98** | Medium | **PASS** | Browser: bell web hiện + popup mở (`app-notification-bell [role=menu]`), bell mobile hiện trong header, `overflowX=0`, **0 console error**; i18n parity `884/884` (web) · `475/475` (mobile). |
| **TASK-346** | Medium | **PASS** | `PluginOperationRecoveryTest 4/4` (chu trình bị chặn, chuỗi hợp lệ nhận, saga cũ phục hồi, saga mới giữ nguyên); regression plugin `29/29`. |
| **TASK-347** | Medium | **PASS** | CLI `node --test` `6/6` (upload multipart tới HTTP server cục bộ, kiểm method/path/Authorization/body). |

---

## 2. Lỗi Phát Hiện Trong Đợt QA (đã sửa)

| # | Lỗi | Mức | Nguyên nhân gốc | Cách sửa | Xác nhận |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | `GET /api/v1/account/avatar` trả envelope lỗi với `Content-Type: application/octet-stream` (client không parse được `code`) | Medium | `@Produces(APPLICATION_OCTET_STREAM)` của method áp cho **cả response lỗi**, đè media type của `GlobalExceptionMapper`. | Mapper set tường minh `MediaType.APPLICATION_JSON` (sửa ở tầng dùng chung, áp cho mọi resource khai `@Produces` phi-JSON). | `AccountAvatarApiTest` PASS; 33/33 suite |
| 2 | F5 trên `/settings/organization/…/dept-create` mở lại trang nhưng **drawer đóng** (deep-link không khôi phục) | Medium | `applyDrawerMode` bỏ qua **mọi** mode khi cây/chi nhánh còn rỗng; và callback sau `load()` dựa vào `pendingState` có thể chưa được set. | Chỉ chờ dữ liệu cho mode phụ thuộc node (`edit`/`delete`); `create` mở ngay. Callback dùng `pendingState ?? listState.current()` (đọc snapshot route). | Browser: reload `dialogOpen=true` |

> Lỗi #2 là **hồi quy của chính BUG-119** và đã được xác nhận lại sau khi sửa — minh chứng vai trò của QA browser thật.

---

## 3. Bằng Chứng Tổng Hợp

### 3.1. Backend (PostgreSQL + Redis thật, không H2)

| Lệnh | Kết quả |
| :--- | :--- |
| `mvn -o test -Dtest=AccountAvatarApiTest,AuthResourceApiTest,DataPolicyApiTest,SampleRecordApiTest` | **33/33 PASS**, BUILD SUCCESS |
| `mvn -o test -Dtest=SecurityContextServiceTest,PermissionFilterTest` | **9/9 PASS** |
| `mvn -o test -Dtest=PluginOperationRecoveryTest` | **4/4 PASS** |
| `mvn -o test -Dtest=PluginLifecycleApiTest,PluginCredentialAndUploadTest,PlatformPluginGovernanceApiTest,PluginBundleImageApiTest,PluginArtifactVerifierTest,OciRegistryClientTest` | **29/29 PASS** |
| `mvn -o test -Dtest=ImpersonationTimeoutJobTest` | **2/2 PASS** |

### 3.2. CLI

`node --test test/cli.test.mjs` → **6/6 PASS**.

### 3.3. Browser thật (headless Chrome, CDP)

| Kịch bản | Viewport | Kết quả |
| :--- | :---: | :--- |
| `bug120_assign` | 1280×900 | `gapRight=0`, dialog mở, 0 console error |
| `bug119_roles_create` | 1280×900 | URL `…/-/create`; reload → `dialogOpen=true` |
| `bug119_org_drawer` | 1280×900 | URL `…/-/dept-create`; reload → `dialogOpen=true` (sau fix) |
| `bug98_web_bell` | 1280×900 | bell hiện, menu mở, `overflowX=0`, 0 console error |
| `bug98_mobile` | 390×844 | nút chuông header hiện, `overflowX=0`, `smallCount=0`, 0 console error |

Ảnh minh chứng: `evidence/screenshots/qa03_2026-10-05/`.

### 3.4. Build & i18n

| Hạng mục | Kết quả |
| :--- | :--- |
| Web `npm run build` | PASS, 0 error |
| Mobile `npm run build` | PASS, 0 error |
| i18n parity vi↔en | Web 884/884 · Mobile 475/475, 0 lệch |

---

## 4. Kết Luận QA

- **8/8 item PASS.** Không còn item `Critical`/`High` mở; không còn item code dở.
- 2 lỗi Medium do QA phát hiện đã sửa, verify lại và commit (`a97730a`, `1953467`).
- **Đủ điều kiện kỹ thuật để đóng Sprint 03.**
- Ghi nhận trung thực: QA do agent tự chạy theo chỉ đạo chủ dự án; không thay thế chữ ký QA/Reviewer độc lập của người thứ ba.
