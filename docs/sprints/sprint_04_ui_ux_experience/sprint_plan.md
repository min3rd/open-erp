# Kế Hoạch Sprint 04 — Trải Nghiệm Giao Diện (UI/UX Platform)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | PLAN-S04 / Kế hoạch / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | PM Agent / Chưa review |
| Đầu vào | [RAW-S04-001](01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](00_READING_GUIDE.md) / [CONF-S04-001](04_confirmation/01_CONF-S04-001_sprint_04_scope.md) |

## 1. Mục tiêu

Nâng trải nghiệm giao diện Web **và** Mobile lên chuẩn sản phẩm thương mại mà **không giảm mật độ thông tin** và **không phá kiến trúc anti-modal**:

1. **Theme đa giao diện** với token dùng chung; mỗi theme có Light + Dark, giữ mật độ cao.
2. **Hệ chuyển động (motion)** nhất quán, có thể tắt theo `prefers-reduced-motion`.
3. **Bộ icon Feather** dùng thống nhất qua một component chung.
4. **Context menu** cho danh sách (chuột phải như desktop), tôn trọng phân quyền.
5. **Thanh loading + skeleton theo vùng**, mỗi vùng load độc lập.
6. **Đa ngôn ngữ** mở rộng, có lộ trình cho RTL.

## 2. Phạm vi

### 2.1. In-scope

- Tầng token/theme + registry theme; 2+ theme mỗi theme đủ Light/Dark (số lượng chốt tại Confirmation).
- Motion tokens + animation cho popup/drawer/list/route/loading.
- Component icon chung (Feather, không phụ thuộc runtime ngoài).
- Component context menu chung + tích hợp vào các màn danh sách trọng yếu.
- Component skeleton chung + thanh progress toàn cục + tách vùng load độc lập ở các màn đang gộp 1 call.
- Language registry + lazy dictionary + ≥ 5 ngôn ngữ (danh sách chốt tại Confirmation), khung RTL.
- Cập nhật shared UI library (`src/frontend/shared/`), i18n, Web + Mobile.

### 2.2. Out-of-scope

- Nghiệp vụ mới; thay đổi API nghiệp vụ.
- Viết unit/component test frontend (chính sách dự án — kiểm thử bằng trình duyệt).
- E2E/K8s staging (follow-up Sprint 03).
- Dịch đầy đủ ngay mọi ngôn ngữ: bản phát hành có thể chỉ **một số ngôn ngữ đủ 100%**, còn lại theo lộ trình.

## 3. Phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| :--- | :--- | :--- |
| Sprint 01–03 | Nền tảng | Shared UI library, enums token, i18n service, Drawer/route-state |
| TASK-348 phần phụ | Kỹ thuật | Context menu/loading áp lên chính các màn danh sách |
| Ràng buộc `ui_ux_standards` | Quy định | Mật độ cao bắt buộc mọi theme; vuông vắn **chỉ** bắt buộc theme mặc định; anti-modal |
| Icon Feather | Thư viện | Vendor dạng dữ liệu (không thêm runtime dep) — xem SOL |

## 4. Điều kiện hoàn thành (DoD)

- [ ] CONF-S04-001 được khách hàng xác nhận (nguồn + ngày).
- [ ] 100% AC trong CONF được kiểm chứng bởi QA browser (Web Desktop + Mobile 390×844), 0 console error, overflow = 0.
- [ ] Mỗi theme × mode (Light/Dark) đạt tương phản WCAG AA cho text; **mọi theme giữ mật độ cao**; **chỉ theme mặc định bắt buộc vuông vắn** (theme khác theo token `ShapeVariant`). Registry **4 theme** (industrial, slate-blue, emerald, amber).
- [ ] Theme áp **theo tenant** và hiển thị đúng cho mọi người dùng của tenant (AC-17); **mode theo từng người dùng**. *(Đã đổi theo chỉ đạo 2026-10-05: **cả 4 trục theo người dùng**, tenant là mặc định — xem CONF-S04-001 §5.1.)*
- [ ] **RTL đầy đủ cho `ar`** (Web + Mobile), không tràn ngang 390px (AC-16).
- [ ] Mỗi locale phát hành đạt **100% key** so với `en` (AC-15).
- [ ] Icon lấy từ npm **`feather-icons`** qua adapter chung, không thêm UI framework.
- [ ] `prefers-reduced-motion` tắt chuyển động không thiết yếu.
- [ ] 0 item `Critical`/`High` mở.
- [ ] User Guide Sprint 04 + cập nhật Developer Guide (shared UI, i18n) + deployment guide nếu có cấu hình mới.
- [ ] Không tăng thư viện bên thứ ba (Feather là dữ liệu vendored).

## 5. Mốc

| Mốc | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| M0 | 00–04 (RAW/ANL/BENCH/CONF) — **scope được duyệt** | **Xong** (CONF Approved 2026-10-05) |
| M1 | 05–06 (SOL/DES) — design ready | **Xong phần soạn** (SOL/DES 0.1); review kỹ thuật độc lập là follow-up |
| M2 | 07 — code + dev self-check | **Xong** (TASK-355…374 + BUG-121…134, build web/mobile PASS 0 cảnh báo) |
| M3 | 08 — QA browser theo AC | **Xong** — TR-S04-001 v0.3: 18/18 TC PASS (baseline `772a211`) |
| M4 | 09 — nghiệm thu & đóng | **Xong** — REV-S04-001: **ĐÓNG 2026-10-06** (DoD 11/11 Đạt) |

## 6. Rủi ro chính

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Ma trận tổ hợp theme × mode × ngôn ngữ × nền tảng bùng nổ | High | Chiến lược lấy mẫu QA; parity check tự động cho i18n |
| Theme làm giảm mật độ/xô lệch layout hiện có | Medium | Token chỉ đổi màu/spacing trong ngưỡng; kiểm regression mật độ |
| Animation gây cảm giác chậm trên danh sách lớn | Medium | Ngân sách hiệu năng, không stagger hàng loạt, tắt theo reduced-motion |
| Tách call làm tăng số request | Medium | Chỉ tách vùng thực sự độc lập; gộp phần phụ thuộc |
| Dịch thiếu gây lộ key/tiếng Anh lẫn | Medium | Fallback chain + parity check + chỉ phát hành locale đủ ngưỡng |
| RTL đụng toàn bộ layout | Medium | Làm khung trước, chỉ bật RTL khi có ngôn ngữ RTL được duyệt |
