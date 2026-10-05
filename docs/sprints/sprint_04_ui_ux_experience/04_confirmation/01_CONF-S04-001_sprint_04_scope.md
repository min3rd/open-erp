# [CONF-01] Biên Bản Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu Sprint 04

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S04-001 / Scope & AC / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | **Draft — PENDING khách hàng xác nhận** / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / **Khách hàng (Product Owner)** |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md), [ANL-S04-001…006](../02_analysis/), [BENCH-S04-001](../03_benchmarks/), [sprint_plan](../sprint_plan.md) |
| Đọc trước / đọc tiếp | [sprint_plan](../sprint_plan.md) / [SOL-S04-001](../05_solutions/01_SOL-S04-001_ui_platform_architecture.md) |

> **Gate**: tài liệu này **chưa được duyệt**. Mọi giá trị mặc định dưới đây là **đề xuất của BA**; khách hàng xác nhận hoặc chỉnh tại mục 5. Không có mã nguồn Sprint 04 nào được viết trước khi gate này đóng.

## 1. Phạm Vi Đề Xuất

### 1.1. In-scope

| # | Hạng mục | Nội dung |
| :---: | :--- | :--- |
| S1 | Theme & design tokens | Token hoá màu/khoảng cách/hình dạng; **registry 4 theme** (industrial mặc định, slate-blue, emerald, amber); mỗi theme đủ **Light + Dark**; theme **áp theo từng tenant**, đồng bộ cho mọi người dùng của tenant; **mode Light/Dark theo từng người dùng**; plugin kế thừa token chung. |
| S2 | Motion | Bộ chuyển động dùng chung cho popup/drawer/list/**route**/loading, **nhanh và nhẹ**; tôn trọng `prefers-reduced-motion`. |
| S3 | Icon Feather | Component icon chung dùng thư viện **`feather-icons` (npm, MIT — dữ liệu SVG, không phải UI lib)**; icon cho hành động dễ hiểu/độc lập; a11y (label/decorative). |
| S4 | Context menu | Chuột phải trên **tất cả màn danh sách** (**Desktop**); mục thiếu quyền **hiện mờ (disable) kèm lý do**; hỗ trợ bàn phím. **Mobile không dùng context menu.** |
| S5 | Loading & skeleton | **Thanh progress trên cùng trang** + skeleton theo vùng (trễ **150ms**); **mỗi vùng load độc lập**, có nút **Thử lại** theo vùng. |
| S6 | Đa ngôn ngữ | Language registry; **13 locale** đã duyệt (vi, en, zh-CN, ja, ko, es, fr, de, pt-BR, ru, ar, th, id); lazy dictionary; **RTL đầy đủ cho `ar` trong Sprint 04**; ngưỡng phát hành **100%**. |

### 1.2. Out-scope

- Nghiệp vụ mới, thay đổi API nghiệp vụ.
- Unit test frontend (chính sách dự án cấm).
- Dịch đủ 100% cho **mọi** ngôn ngữ ngay bản đầu (chỉ ngôn ngữ đạt ngưỡng mới phát hành).

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

| AC | Given/When/Then | Truy vết |
| :--- | :--- | :--- |
| **AC-01** | **Given** người dùng ở bất kỳ màn hình trong **một tenant**, **When** theme của tenant được đổi, **Then** màu/khoảng cách/hình dạng đổi toàn ứng dụng **cho mọi người dùng của tenant đó**, không flash sai theme khi tải lại. | R1 / S1 |
| **AC-02** | **Given** một theme đang chọn, **When** chuyển Light ⇄ Dark, **Then** theme đó có **đủ cả hai mode**, text đạt tương phản WCAG AA, `colorScheme` và Ionic đồng bộ. | R1 / S1 |
| **AC-03** | **Given** một theme bất kỳ, **When** so với mặc định, **Then** **không giảm mật độ thông tin** (cỡ chữ nhỏ nhất, khoảng cách hẹp giữ nguyên) và không gây tràn ngang ở 390px. Hình dạng góc do theme quyết định: **theme mặc định bắt buộc vuông vắn** (`rounded-none`/`rounded-sm`); theme thay thế được bo góc khác qua token `ShapeVariant` nhưng không dùng bo tròn lớn kiểu consumer. | R1 / ui_ux_standards |
| **AC-04** | **Given** một popup/drawer/list đang ẩn, **When** mở ra, **Then** có chuyển động vào/ra **nhanh** theo bộ motion (không còn ẩn/hiện tức thời) và không gây nhảy layout. | R2 / S2 |
| **AC-05** | **Given** hệ điều hành bật "giảm chuyển động", **When** dùng ứng dụng, **Then** chuyển động không thiết yếu bị tắt, chức năng không đổi. | R2 / S2 |
| **AC-06** | **Given** các hành động dễ hiểu/độc lập, **When** hiển thị, **Then** chúng có icon Feather từ một component chung; icon-only phải có `aria-label`/tooltip. | R3 / S3 |
| **AC-07** | **Given** không có icon trong thư viện, **When** developer cần thêm, **Then** thêm vào registry icon chung (không vẽ SVG rải rác trong template màn hình). | R3 / S3 |
| **AC-08** | **Given** một dòng trong danh sách (**Desktop**), **When** chuột phải, **Then** mở context menu tại con trỏ; mục thiếu quyền **hiện mờ kèm lý do**, mục hợp lệ thực thi như nút inline; không thay thế Drawer/route. | R4 / S4 |
| **AC-09** | **Given** context menu đang mở, **When** nhấn `Escape` / `Shift+F10` / phím mũi tên, **Then** điều hướng bàn phím và đóng đúng chuẩn `role="menu"`. | R4 / S4 |
| **AC-10** | **Given** thiết bị **Mobile**, **When** dùng danh sách, **Then** **không** có context menu; hành động vẫn qua nút/luồng hiện có. | R4 / S4 |
| **AC-11** | **Given** người dùng điều hướng/đang gọi API, **When** có hoạt động tải, **Then** **thanh progress ở trên cùng trang** hiển thị và kết thúc đúng lúc. | R5 / S5 |
| **AC-12** | **Given** một màn có nhiều vùng (bảng + danh sách phụ + bộ lọc), **When** tải, **Then** mỗi vùng hiển thị **skeleton riêng** và vùng nhanh hiện nội dung **trước**, không chờ vùng chậm. | R5 / S5 |
| **AC-13** | **Given** một vùng tải xong, **When** nội dung xuất hiện, **Then** không nhảy layout (skeleton đúng kích thước), trạng thái empty/error rõ ràng. | R5 / S5 |
| **AC-14** | **Given** người dùng chọn một ngôn ngữ mới, **When** áp dụng, **Then** toàn bộ chuỗi hiển thị đổi ngay, lưu lựa chọn, không lộ key thô; fallback về tiếng Anh khi thiếu. | R6 / S6 |
| **AC-15** | **Given** một ngôn ngữ trong registry, **When** chạy kiểm tra parity, **Then** báo đúng số key thiếu/còn thừa và **chỉ phát hành ngôn ngữ đạt 100% key** so với `en`. | R6 / S6 |
| **AC-16** | **Given** ngôn ngữ RTL `ar`, **When** hiển thị (Web + Mobile), **Then** **layout gương đầy đủ**, không tràn ngang 390px, icon hướng được lật hợp lý — **hoàn chỉnh trong Sprint 04**. | R6 / S6 |
| **AC-17** | **Given** theme được đổi bởi quản trị tenant, **When** người dùng khác trong tenant đăng nhập, **Then** họ nhận đúng theme của tenant (không phải sở thích riêng từng người). | R1 / S1 / Q2 |

## 3. Danh Sách Ngôn Ngữ (khách hàng đồng ý 2026-10-05)

| Ưu tiên | Locale | Ngôn ngữ | Hướng | Ghi chú |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `vi` | Tiếng Việt | LTR | Đã có |
| 2 | `en` | English | LTR | Đã có — locale tham chiếu (fallback) |
| 3 | `zh-CN` | 简体中文 | LTR | Đã duyệt |
| 4 | `ja` | 日本語 | LTR | Đã duyệt |
| 5 | `ko` | 한국어 | LTR | Đã duyệt |
| 6 | `es` | Español | LTR | Đã duyệt |
| 7 | `fr` | Français | LTR | Đã duyệt |
| 8 | `de` | Deutsch | LTR | Đã duyệt |
| 9 | `pt-BR` | Português (BR) | LTR | Đã duyệt |
| 10 | `ru` | Русский | LTR | Đã duyệt |
| 11 | `ar` | العربية | **RTL** | Đã duyệt — **buộc có khung RTL** |
| 12 | `th` | ไทย | LTR | Đã duyệt |
| 13 | `id` | Bahasa Indonesia | LTR | Đã duyệt |

> Q4/Q5 (thời điểm bật RTL, ngưỡng phủ key) chốt khi ký; mặc định đề xuất: **khung RTL trong Sprint 04**, bật `ar` khi đạt ngưỡng ≥ 95%.

## 4. Danh Sách Theme (chốt 4 theme 2026-10-05)

| Mã | Tên | Đặc điểm | Hình dạng | Light | Dark | Bắt buộc |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `industrial` | Industrial (**mặc định**) | Xám trung tính hiện tại | **Sharp (bắt buộc)** | ✓ | ✓ | ✓ |
| `slate-blue` | Slate Blue | Nền xanh xám, nhấn sky | Soft | ✓ | ✓ | ✓ |
| `emerald` | Emerald | Nền trung tính, nhấn xanh lá | Soft | ✓ | ✓ | ✓ |
| `amber` | Amber | Nền ấm, nhấn cam | Soft | ✓ | ✓ | ✓ |

> **Quy định hình dạng (chủ dự án chốt 2026-10-05)**: **chỉ theme mặc định bắt buộc vuông vắn**; theme thay thế được bo góc khác qua token `ShapeVariant`, nhưng **mọi theme phải giữ mật độ thông tin cao** và không dùng bo tròn lớn kiểu consumer (`rounded-xl`/`rounded-full`). Đã cập nhật [ui_ux_standards](../../../../.agents/rules/ui_ux_standards.md) mục 2.

## 5. Câu Hỏi Chốt — Trả Lời Của Khách Hàng (2026-10-05)

> Nguồn: trả lời trực tiếp của chủ dự án trong phiên làm việc 2026-10-05. Các mục còn trống là chưa trả lời riêng — dùng đề xuất và **chốt khi ký**.

| # | Câu hỏi | Trả lời của khách hàng | Trạng thái |
| :---: | :--- | :--- | :--- |
| Q1 | Số lượng theme bản đầu? | **4 theme**: industrial (mặc định), slate-blue, emerald, **amber** | ✅ Đã chốt |
| Q2 | Theme lưu theo tenant hay người dùng? | **Theo từng tenant** (áp cho toàn workspace của tenant) | ✅ Đã chốt |
| Q3 | Danh sách ngôn ngữ bản đầu? | **Đồng ý theo gợi ý**: vi, en, zh-CN, ja, ko, es, fr, de, pt-BR, ru, **ar**, th, id | ✅ Đã chốt |
| Q4 | Có làm RTL ngay Sprint 04 không? | **Bật đầy đủ ngay trong Sprint 04** — `ar` phải hoàn chỉnh RTL (Web + Mobile) | ✅ Đã chốt |
| Q5 | Ngưỡng phủ key để phát hành một locale? | **100% key** so với `en` (đủ hết mới phát hành) | ✅ Đã chốt |
| Q6 | Mức animation mong muốn? | **Nhanh, đảm bảo hiệu năng cao** | ✅ Đã chốt |
| Q7 | Context menu trên Mobile? | **Không cần** — chỉ Desktop | ✅ Đã chốt |
| Q8 | Thanh loading dạng nào? | **Trên cùng của trang** (top progress bar) | ✅ Đã chốt |
| Q9 | Ngưỡng hiệu năng? | **Cao** (theo Q6) — không tụt FPS, animation chỉ `transform`/`opacity` | ✅ Đã chốt |
| Q10 | Theme có được plugin bên thứ ba kế thừa? | **Có** — plugin dùng token chung, không hardcode màu | ✅ Đã chốt |
| Q11 | Hình dạng của theme thay thế? | **Chỉ theme mặc định vuông vắn**; theme khác bo góc khác qua `ShapeVariant`; mọi theme giữ mật độ cao | ✅ Đã chốt |
| Q12 | Mode Light/Dark theo ai? | **Theo từng người dùng** | ✅ Đã chốt |
| Q13 | Múi giờ hiển thị theo ai? | **Theo từng người dùng** | ✅ Đã chốt |
| Q14 | Mục context menu thiếu quyền xử lý sao? | **Hiện mờ (disable) kèm lý do** | ✅ Đã chốt |
| Q15 | Kiểu hiển thị mục context menu? | **Icon + nhãn chữ** | ✅ Đã chốt |
| Q16 | Trễ trước khi hiện skeleton? | **150ms** | ✅ Đã chốt |
| Q17 | Có nút "Thử lại" theo vùng khi lỗi? | **Có** | ✅ Đã chốt |
| Q18 | Có chuyển động khi đổi route/trang? | **Có, nhẹ** (fade/translate ngắn, tắt khi reduced-motion) | ✅ Đã chốt |
| Q19 | Nguồn bộ icon Feather? | **Cài npm package `feather-icons`** (MIT, dữ liệu SVG) — exception có chủ đích, xem SOL §2.3 | ✅ Đã chốt |
| Q20 | Context menu gắn cho màn nào? | **Tất cả màn danh sách** (Desktop) | ✅ Đã chốt |

**Hệ quả đã áp vào tài liệu**: AC-01/AC-17 (theme theo tenant, 4 theme), AC-10 (bỏ context menu Mobile, chỉ Desktop, **disable kèm lý do**), AC-11 (progress bar trên cùng), AC-15 (**100% key**), AC-16 (**RTL đầy đủ ngay**), §3 (13 ngôn ngữ), §4 (4 theme; hình dạng theo theme), SOL §2.3 (icon = npm `feather-icons`).

**Trạng thái chốt**: khách đã trả lời **đầy đủ 20 câu** ngày 2026-10-05. Việc còn lại chỉ là **ký xác nhận chính thức** tại mục 6 (gate vẫn `Pending` cho tới khi có chữ ký/nguồn).

## 6. Chữ Ký Xác Nhận (Customer Scope Approval)

> **Trạng thái: PENDING.** Không tự ký. Người có quyền xác nhận scope/AC ghi nguồn + phiên bản + ngày.

- **Đại diện Khách hàng (Product Owner)**: ........................................ (Ngày: ..../..../2026)
- **BA Agent (người lập)**: ........................................ (Ngày: ..../..../2026)

> Sau khi ký: cập nhật trạng thái tài liệu sang `Approved`, ghi nguồn/ngày, rồi mới chuyển bước 05–06 (SOL/DES).
