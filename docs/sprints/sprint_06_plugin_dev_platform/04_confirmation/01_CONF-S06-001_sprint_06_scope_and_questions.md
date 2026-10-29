# [CONF-S06-001] Phạm vi, câu hỏi & quyết định xác nhận Sprint 06

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S06-001 / Scope & AC / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — 2026-10-29** / 1.2 / 2026-10-29 |
| Owner / reviewer | BA Agent / **Chủ dự án (Product Owner)** |
| Đầu vào | [RAW-S06-001](../01_raw_notes/01_RAW-S06-001_plugin_dev_platform_requirements.md), [ANL-S06-001](../02_analysis/01_ANL-S06-001_template_and_cli_interactive.md), [ANL-S06-002](../02_analysis/02_ANL-S06-002_core_rendered_ui_slots.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [05_solutions/](../05_solutions/) đã duyệt |

> **Gate: APPROVED (2026-10-29).** Chủ dự án đã trả lời **16/16 câu hỏi**, chốt **Q17 = APPROVED**; Q18 (đứng cạnh bell Core) được **Q19 thay thế** — plugin là nguồn thông báo duy nhất; Q20 chốt bell mở drawer trước, “Xem tất cả” mới sang trang danh sách. Scope/AC trong tài liệu này là baseline để chuyển sang bước 05 (SOL/ADR) và bước 06 (DES). Task chỉ được cấp sau khi có design tương ứng.

## 1. Phạm vi đề xuất (đã cập nhật theo câu trả lời Q1–Q20)

Xây **nền tảng phát triển plugin** trên hạ tầng Sprint 03–05, gồm 3 luồng:

1. **Template zero-DB thế hệ mới** — CLI sinh plugin đúng ADR-S05-001/002 và TASK-402; **migrate toàn bộ plugin cũ** (hiện có `catalog`) sang template 2.0.
2. **CLI tương tác** — tạo plugin/entity/field/validator/relation/CRUD; **sinh mã Angular + Java service/resource cho từng entity**; validate offline + `--core-url`.
3. **Core render UI extension** — **bỏ iframe hoàn toàn**; plugin UI dùng Web Component/Module Federation. Core và plugin đều có thể khai báo slot; Core là bên render. **Migrate catalog from iframe sang MF/WC trong Sprint 06.**

**Trong phạm vi đã chốt**

- Template backend: POJO, DTO, service/resource sinh theo entity dùng `PluginDataClient`, `plugin-sdk`, `migrations/` + checksum; không Panache/Flyway/datasource/`TENANT_ID`.
- Template web: Angular 22 standalone, Tailwind entry riêng, i18n, screen + contribution entry mẫu; **không còn iframe**.
- CLI wizard: bare `open-erp-cli` mở menu + `--interactive` từng lệnh; `create`, `generate entity/field/relation/crud`, `validate`, `dev`; `--non-interactive` cho CI.
- Manifest mở rộng: `entities[].fields[]`, `entities[].validators[]`, `relations[]`, `ui_manifest.contributions[]`, `ui_manifest.slots[]` (plugin-hosted), `ui_manifest.crud[]`.
- Core: `PluginSlotComponent` + loader WC/MF + error boundary; slot `core.layout.header.actions`, `core.settings.system.tabs`, `core.dashboard.widgets`, `core.settings.sections`.
- Plugin-hosted slot: plugin khai báo `ui_manifest.slots[]`; Core đồng bộ registry; plugin render bằng shared `PluginSlotComponent`; plugin khác đóng góp theo contract.
- Trang `/settings/system` với tab Core + tab plugin.
- **Plugin `in-app-notification` thật**: header bell + tab cấu hình; **thay bell Core** (Q19), bell mở drawer, “Xem tất cả” mới sang trang danh sách (Q20).
- Migrate `catalog` khỏi iframe sang MF/WC; migrate template toàn bộ plugin cũ.
- Cập nhật developer guides + user guide + QA browser desktop/mobile.

**Ngoài phạm vi**

- Marketplace/registry nâng cao; K8s staging; upgrade/rollback 2 version.
- Data-scope theo chi nhánh/phòng ban; import/export chung cho mọi entity.
- Tenant admin ẩn/đổi thứ tự contribution (Q15 chọn không).
- Viết lại notification Core thành plugin (plugin mới là `in-app-notification` độc lập, thay thế Core notification theo Q19).

## 2. Tiêu chí nghiệm thu nháp (cập nhật)

| AC | Nội dung | Nguồn |
| :--- | :--- | :--- |
| **AC-01** | `open-erp-cli create` sinh plugin không còn `Panache`, `quarkus-jdbc-postgresql`, `quarkus-flyway`, `datasource`, `TENANT_ID`; `mvn package` PASS. | R1 |
| **AC-02** | Wizard tạo plugin mới với ít nhất 1 entity; manifest + migration + POJO + permission được sinh đúng. | R2 |
| **AC-03** | Wizard thêm field với type/required/unique/validator; manifest + entity + migration + UI metadata đồng bộ; build PASS. | R2 |
| **AC-04** | Wizard khai báo quan hệ: FK trong cùng plugin; soft reference (UUID + display text) tới Core/plugin khác; `validate` từ chối target không tồn tại. | R2 + Q9 |
| **AC-05** | Wizard sinh màn CRUD Angular (list + form/drawer + service + route + i18n) và Java service/resource/DTO cho entity; build PASS; chạy desktop. | R2 + Q7/Q8 |
| **AC-06** | `validate` phát hiện manifest sai, field/validator sai, relation sai, slot không tồn tại/contract lệch, migration checksum sai; offline mặc định, `--core-url` kiểm tra registry/slot. | R2 + Q16 |
| **AC-07** | Plugin `ACTIVE` đăng ký contribution vào `core.layout.header.actions`; Core render component trong topbar, không import source plugin. | R3 |
| **AC-08** | Plugin `ACTIVE` đăng ký contribution vào `core.settings.system.tabs`; Core render tab + nội dung trong `/settings/system`; URL giữ tab. | R3 |
| **AC-09** | Tắt plugin ⇒ contribution biến mất khỏi header/tab; bật lại ⇒ xuất hiện; không reload thủ công. | R3 |
| **AC-10** | User thiếu quyền không thấy contribution; API vẫn trả 403 theo contract. | R3 |
| **AC-11** | Contribution sai `contract_version` hoặc entry lỗi bị skip + log; layout vẫn hoạt động. | R3 + Q13 |
| **AC-12** | Desktop ≥1280px + mobile 390×844: 0 `console.error`, không tràn ngang; i18n vi/en (tối thiểu) đúng. | R3 + DoD |
| **AC-13** | Tài liệu `create_new_plugin_guide`, `plugin_web_packaging_guide`, user guide Sprint 06 được cập nhật; có ảnh minh chứng. | R1–R3 |
| **AC-14** | Catalog hiện tại vẫn chạy sau thay đổi (screen, menu, API gateway) — regression PASS. | Ràng buộc |
| **AC-15** | **Không còn iframe** trong code/manifest/plugin host: `PluginRenderMode.IFRAME` bị loại bỏ hoặc deprecated có lộ trình; catalog chạy bằng MF/WC. | Q2 + Q13 |
| **AC-16** | Plugin khai báo slot riêng trong `ui_manifest.slots[]`; Core đồng bộ registry; plugin khác đóng góp và render qua shared `PluginSlotComponent`; host contract mismatch bị skip + log. | Q3 |
| **AC-17** | Plugin `in-app-notification` dùng template/CLI: header bell + tab cấu hình; bật/tắt theo lifecycle; không trùng menu riêng; **thay bell Core** (Q19). | Q12 + Q18/Q19 |
| **AC-18** | Toàn bộ plugin cũ (`catalog`) được migrate sang template 2.0; build + test PASS; không mất dữ liệu/không đổi API contract. | Q11 |
| **AC-19** | Mobile: header contribution render đúng nếu khai báo `platforms: [mobile]`; tab cấu hình desktop-only trong S06; overflow 0. | Q14 |
| **AC-20** | **Bỏ notification Core cũ**: bell/banner/API notification cũ không còn render trong Web/Mobile; `in-app-notification` là nguồn thông báo duy nhất. | Q19 |
| **AC-21** | **Platform defaults + tenant override**: platform admin cấu hình mặc định toàn hệ thống; tenant admin cấu hình riêng tenant, có thể kế thừa hoặc ghi đè từng trường; hai cấu hình độc lập. | Q19 |
| **AC-22** | **Bell mở drawer trước**: bấm chuông plugin mở drawer danh sách gần nhất, không đổi route; chỉ nút “Xem tất cả” mới điều hướng sang trang danh sách đầy đủ; đóng bằng Escape/overlay. | Q20 |

> AC sẽ được chốt cùng Q17; bảng này là hệ quả trực tiếp của 16 câu trả lời.

## 3. Câu hỏi và câu trả lời (Q1–Q20)

> Trả lời ngày 2026-10-29. Câu có `*` từng là câu chặn thiết kế.

| # | Câu hỏi | Lựa chọn | Đề xuất | **Trả lời** |
| :--- | :--- | :--- | :--- | :--- |
| **Q1*** | Có gói cả 3 luồng trong Sprint 06 không? | A. Cả 3 trong S06<br>B. Template + CLI trước, render S07<br>C. Render trước, CLI/template S07 | A | **A — cả 3 luồng** |
| **Q2*** | Màn hình plugin đầy đủ dùng gì? | A. Giữ iframe cho screen; slot dùng WC/MF<br>B. Chuyển screen sang WC/MF ngay<br>C. Bỏ iframe hoàn toàn | A | **C — bỏ iframe hoàn toàn** |
| **Q3*** | Ai được khai báo slot? | A. Chỉ Core<br>B. Core + plugin<br>C. Core + plugin nội bộ | A | **B — Core + plugin** |
| **Q4*** | Slot nào có trong v1? | A. Header actions<br>B. Settings tabs<br>C. Dashboard widgets<br>D. Settings sections<br>E. Khác | A + B + C | **A + B + C + D** |
| **Q5*** | “Màn cấu hình hệ thống” là gì? | A. Trang mới `/settings/system` có tab<br>B. Gắn vào `/settings/plugins`<br>C. Gắn vào `/settings`<br>D. Khác | A | **A — trang mới `/settings/system`** |
| **Q6*** | Contribution trong slot dùng render mode nào? | A. WC + MF<br>B. Thêm iframe<br>C. Chỉ WC<br>D. Chỉ MF | A | **A — WC + MF** |
| **Q7*** | Sinh màn CRUD bằng cách nào? | A. Renderer metadata<br>B. Sinh mã Angular<br>C. Hybrid metadata + override | C | **B — sinh mã Angular** |
| **Q8*** | Backend CRUD cho entity? | A. `PluginCrudResource` dùng chung<br>B. Sinh service/resource Java từng entity<br>C. Hybrid | C | **B — sinh service/resource Java từng entity** |
| **Q9*** | Quan hệ entity Core/plugin khác lưu thế nào? | A. Soft ref toàn bộ<br>B. FK cùng plugin + soft ref xuyên plugin<br>C. FK xuyên schema | B | **B — FK cùng plugin + soft ref xuyên plugin** |
| **Q10*** | CLI tương tác chạy thế nào? | A. Bare wizard + `--interactive`<br>B. `--interactive` từng lệnh<br>C. Lệnh `wizard` riêng | A | **A — bare wizard + `--interactive`** |
| **Q11** | Plugin cũ có được migrate template không? | A. Chỉ plugin mới + `upgrade --check`<br>B. Migrate catalog + toàn bộ plugin cũ<br>C. Chỉ plugin mới | A | **B — migrate catalog + toàn bộ plugin cũ** |
| **Q12*** | Plugin mẫu để chứng minh render? | A. `demo-slot` + tài liệu notification<br>B. `in-app-notification` thật<br>C. Test fixture<br>D. Cả demo + notification thật | A | **B — in-app-notification thật** |
| **Q13** | Catalog migrate khỏi iframe trong S06? | A. Không<br>B. Thêm contribution nhưng giữ screen<br>C. Migrate hoàn toàn sang slot/WC/MF | A | **C — migrate catalog sang MF/WC trong S06** |
| **Q14** | Slot có chạy trên Mobile không? | A. Header mobile; settings tab desktop trước<br>B. Tất cả desktop only<br>C. Tất cả desktop+mobile | A | **A — header mobile, tab desktop trước** |
| **Q15** | Tenant admin có được ẩn/đổi thứ tự contribution? | A. Không<br>B. Có hide/reorder<br>C. Platform admin disable toàn cục | A | **A — không; plugin ACTIVE + quyền là render** |
| **Q16** | `validate` cần Core chạy không? | A. Offline + `--core-url` tùy chọn<br>B. Bắt buộc Core<br>C. Chỉ offline | A | **A — offline + `--core-url` tùy chọn** |
| **Q18** | Notification plugin đứng cạnh hay thay bell Core? | A. Đứng cạnh bell Core<br>B. Thay bell Core<br>C. Ẩn bell Core khi plugin bật | A | **A — đứng cạnh bell Core** (S06) |
| **Q19** | Bổ sung 2026-10-29: hoàn thiện in-app notification trong S06 và bỏ notification Core cũ? Cấu hình platform/tenant thế nào? | A. Platform defaults + tenant override<br>B. Mỗi admin tự cấu hình của mình<br>C. Platform admin sửa cấu hình tenant | A | **A — platform defaults + tenant override; bỏ notification Core cũ** |
| **Q20** | Bổ sung 2026-10-29: hành vi nút bell plugin? | A. Mở drawer trước, “Xem tất cả” mới sang trang<br>B. Mở thẳng trang danh sách | A | **A — bell mở drawer; “Xem tất cả” mới điều hướng** |

### 3.1. Hệ quả của các lựa chọn khác đề xuất

| Câu | Lựa chọn | Hệ quả |
| :--- | :--- | :--- |
| Q2 | Bỏ iframe hoàn toàn | Phải bỏ `IFRAME` khỏi `PluginRenderMode`/loader sau khi migrate catalog; QA hồi quy catalog bắt buộc. |
| Q3 | Core + plugin slots | Phải thiết kế contract slot do plugin khai báo, đồng bộ `plugin_ui_slots`, host contract resolution. |
| Q4 | Thêm `core.settings.sections` | Thêm vị trí render + QA; cần đặc tả layout settings. |
| Q7 | Sinh mã Angular | CLI sinh list/form/drawer/service/route/i18n; nhiều file, cần test template. |
| Q8 | Sinh Java service/resource | Mỗi entity có DTO/service/resource; cần test backend trên PostgreSQL/Redis thật. |
| Q11 | Migrate toàn bộ plugin cũ | Catalog phải chuyển template 2.0 + MF/WC; rủi ro hồi quy High. |
| Q12 | Notification thật | Cần chốt phạm vi notification (đọc/đánh dấu đã đọc/cấu hình); Q18 chốt đứng cạnh bell Core, không thay thế. |
| Q13 | Migrate catalog | Khối lượng lớn: build MF/WC, route host, QA lại toàn bộ màn catalog + mobile. |

## 4. Rủi ro & giảm thiểu (cập nhật)

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Scope 3 luồng + migrate catalog + notification thật quá lớn | **Critical** | Chia phase trong sprint; render runtime + template là P1; catalog migration/notification P2; cắt bớt tính năng CLI nếu trễ; PM theo dõi hằng ngày |
| Bỏ iframe làm hỏng catalog/mobile | **High** | Migrate MF/WC có feature flag; QA regression AC-14/15; giữ loader iframe tạm trong thời gian migrate rồi xoá |
| Plugin-hosted slot contract phức tạp | High | Chỉ cho slot namespaced `pluginKey.*`; contract version + validate; test 2 plugin |
| Sinh mã Angular/Java nhiều file | High | Template test CI; generator idempotent; `--dry-run`; review mẫu |
| Notification trùng Core | Medium | Chốt phạm vi notification; dùng namespace/quyền riêng; không thay Core bell |
| Template mới vẫn lỗi | High | Smoke test `create → generate → build`; so sánh catalog |
| WC/MF ảnh hưởng CSS/layout | High | Shadow DOM, shared scope pin, error boundary, CSP |
| Catalog hồi quy | High | AC-14/18; QA desktop + mobile; migration/rollback |
| Tài liệu lệch code | Medium | Cập nhật guide trong cùng task; review trước DoD |

## 5. Câu chốt gate

**Q17: Chốt scope/AC đã cập nhật để chuyển sang bước 05 (SOL/ADR) và cấp task?**

- A. **APPROVED** — đồng ý toàn bộ scope/AC trong tài liệu này; mở bước 05–07. ✅ **ĐÃ CHỌN**
- B. **APPROVED có điều chỉnh** — đồng ý nhưng cần sửa các điểm ghi kèm.
- C. **PENDING** — còn điểm cần bàn; chưa mở bước 05.

**Q18: Plugin `in-app-notification` đứng cạnh hay thay bell Core trong Sprint 06?**

- A. **Đứng cạnh bell Core** — phương án ban đầu; **đã bị Q19 thay thế** (plugin là nguồn duy nhất).
- B. **Thay bell Core** — ẩn bell Core khi plugin bật; cần QA notification Core. ✅ **CHỐT THEO Q19**
- C. **Ẩn bell Core khi plugin bật** — cấu hình theo tenant.

## 6. Chữ ký xác nhận

> **Trạng thái: APPROVED 1.2 — 2026-10-29.**

| Vai trò | Xác nhận | Nguồn/ngày |
| :--- | :--- | :--- |
| Khách hàng (Product Owner) | ✅ **APPROVED toàn bộ scope/AC** | Chỉ đạo trực tiếp 2026-10-29 (Q17 A) |
| Khách hàng (Product Owner) | ✅ Q18 A — đứng cạnh bell Core (được Q19 thay thế) | Chỉ đạo trực tiếp 2026-10-29 |
| Khách hàng (Product Owner) | ✅ Q19 A + Q20 A — bỏ Core notification; bell mở drawer | Chỉ đạo trực tiếp 2026-10-29 |
| BA Agent (soạn thảo) | Đã cập nhật scope/AC theo câu trả lời | 2026-10-29 |

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Scope/AC nháp; 16 câu hỏi; gate Pending | BA Agent; RAW/ANL-S06 |
| 0.2 | 2026-10-29 | Ghi nhận 16/16 câu trả lời; cập nhật scope/AC (bỏ iframe, plugin slots, migrate catalog, notification thật, sinh mã Angular/Java); thêm Q17; gate vẫn Pending | BA Agent; hội thoại chủ dự án |
| **1.0** | 2026-10-29 | **Q17 APPROVED** toàn bộ scope/AC; Q18 chốt notification đứng cạnh bell Core; mở bước 05–06 | BA Agent; chỉ đạo trực tiếp chủ dự án |
| 1.1 | 2026-10-29 | Bổ sung Q19/AC-20/AC-21: bỏ notification Core cũ; platform defaults + tenant override | Chủ dự án; chỉ đạo trực tiếp |
| 1.2 | 2026-10-29 | Bổ sung Q20/AC-22: bell mở drawer, “Xem tất cả” mới sang trang; xác nhận bỏ bảng `tenant_notifications` | Chủ dự án; chỉ đạo trực tiếp |
