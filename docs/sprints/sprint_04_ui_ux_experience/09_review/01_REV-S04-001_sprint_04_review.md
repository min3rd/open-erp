# [REV-S04-001] Nghiệm Thu & Đóng Sprint 04

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S04-001 / Sprint review / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | **Draft — chờ QA/PM/khách ký** / 0.1 / 2026-10-05 |
| Owner / reviewer | PM Agent / QA người + Khách hàng |
| Baseline | `5c2e0ca` (web + mobile build PASS, TR-S04-001 chạy trên baseline này) |
| Đầu vào | [TR-S04-001](../08_testing/02_TR-S04-001_sprint_04_test_report.md), [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md), [sprint_plan](../sprint_plan.md) |
| Đọc trước / đọc tiếp | [TR-S04-001](../08_testing/02_TR-S04-001_sprint_04_test_report.md) / — |

> **Agent không tự ký gate.** Tài liệu này tổng hợp bằng chứng và trạng thái; các cổng QA/PM/khách vẫn `Pending` cho tới khi người có thẩm quyền xác nhận.

## 1. Đối Chiếu DoD Sprint 04

| # | Điều kiện DoD | Trạng thái | Bằng chứng |
| :--- | :--- | :--- | :--- |
| 1 | CONF-S04-001 được khách xác nhận (nguồn + ngày) | **Đạt** | Approved 2026-10-05 (chỉ đạo trực tiếp, 20/20 câu) + §5.1 ghi thay đổi sau duyệt |
| 2 | 100% AC được QA browser (Web + Mobile 390×844), 0 console error, overflow 0 | **Đạt (đo tự động)** | TR-S04-001 v0.3 (baseline `772a211`): **18/18 TC PASS**, 0 console error, overflow 0 ở 1440 & 390 (web + Ionic); còn 1 nút 27px < 40px ở web 390 (Medium, không chặn) — **QA người chưa ký** |
| 3 | 4 theme × Light/Dark đạt AA, giữ mật độ, chỉ mặc định vuông vắn | **Đạt (đo tự động)** | TR TC-02: 16.30–17.93 (body), 4.74–7.58 (muted) ≥ 4.5; TC-03: font 12px, hàng 28px, `sharp` mặc định |
| 4 | Theme theo tenant / mode theo người dùng (AC-17) | **Đổi phạm vi** | CONF §5.1: 4 trục theo người dùng, tenant là mặc định; backend test 7/7 |
| 5 | RTL đầy đủ cho `ar`, không tràn ngang 390px (AC-16) | **Đạt** | TASK-371 + TR TC-17: `dir=rtl`, overflow 0 ở 1440 & 390 **web + Mobile Ionic thật**, 0 console error |
| 6 | Mỗi locale phát hành đạt 100% key (AC-15) | **Đạt** | `i18n:check:strict` 13/13 (web 944, mobile 494) |
| 7 | Icon từ npm `feather-icons` qua adapter, không thêm UI framework | **Đạt** | `icon-registry.ts` là nơi duy nhất import; BUG-131 đã bỏ SVG vẽ tay cuối cùng |
| 8 | `prefers-reduced-motion` tắt chuyển động không thiết yếu | **Đạt** | TR TC-06: 0 animation khi bật reduced-motion |
| 9 | 0 item `Critical`/`High` mở | **Đạt** | BUG-131…134 đã Resolved (gồm phần bảng platform của BUG-134); các item còn `In Review` là chờ QA chuyển Done, không phải bug mở |
| 10 | User Guide Sprint 04 + Developer Guide + deployment guide | **Đạt (bản nháp)** | `06_user_guides/sprint_04_ui_ux_experience_user_guide.md` (14 ảnh); `shared_ui_contribution_guide.md` mục Sprint 04; deployment: migration `V3.2.0` tự chạy, không có cấu hình mới |
| 11 | Không tăng thư viện bên thứ ba | **Đạt** | Chỉ `feather-icons` (ngoại lệ đã chốt Q19) |

## 2. Trạng Thái Cổng

| Gate | Trạng thái | Người quyết định | Ghi chú |
| :--- | :--- | :--- | :--- |
| Scope approval (CONF-S04-001) | **Approved** | Khách hàng | 2026-10-05 + §5.1 |
| Design ready (SOL/DES) | Draft | Architect/Reviewer | SOL/DES 0.1 chưa review kỹ thuật |
| QA sign-off | **Pending** | QA người | TR-S04-001 Draft: 15 PASS / 2 Not Run / 1 PASS-một-phần |
| PM đánh giá DoD | **Pending** | PM | Bảng §1 |
| Customer acceptance | **Pending** | Khách hàng | — |
| Closure | **Pending** | PM sau nghiệm thu | — |

## 3. Việc Còn Lại Trước Khi Đóng

1. **QA người chạy mẫu + ký QA sign-off** trên TR-S04-001 v0.3 (18/18 PASS đo tự động; 4 điểm nên kiểm tay ghi ở §3 của TR: FOUC first-paint, skeleton khi mạng chậm, điều hướng bàn phím qua mục disabled, mẫu lặp).
2. **PM đánh giá DoD** (§1) và **khách nghiệm thu**; sau đó ghi Closure.
3. (Tuỳ chọn, không chặn) 1 nút 27px < 40px tại web 390px; dọn tiếp nếu muốn.

## 3.1. Đề nghị duyệt (2026-10-06)

| Nội dung cần duyệt | Trạng thái sẵn sàng |
| :--- | :--- |
| Phạm vi & AC (CONF-S04-001 + §5.1) | Đã Approved 2026-10-05 |
| 18/18 TC theo TP-S04-001 | TR-S04-001 v0.3 — **PASS** trên baseline `772a211` |
| 0 bug `Critical`/`High` mở | BUG-121…134: 6 Resolved, 8 In Review (đã sửa, chờ QA chuyển Done) |
| Tài liệu bàn giao | User guide (14 ảnh) + Developer guide + TR/REV + 14 item |
| Build & chất lượng | Web + mobile PASS, **0 cảnh báo**; bundle web 558 kB; i18n 13/13 100% |
| Rủi ro còn lại | 1 touch target 27px (Medium); skeleton khi mạng chậm nên kiểm tay; RTL canvas sơ đồ cố định LTR (có chủ đích) |

## 4. Tổng Kết Sprint (số liệu)

| Hạng mục | Số lượng |
| :--- | :--- |
| Feature | 6 (FEAT-24…29) |
| Task | 20 (TASK-355…374) — 19 In Review, TASK-371 In Review |
| Bug trong sprint | 14 (BUG-121…134): 5 Resolved, 9 In Review |
| Test case | 18 (15 PASS, 2 Not Run, 1 PASS-một-phần) |
| i18n | 13 locale × 2 app, web 944 key, mobile 494 key, parity 100% |
| Build | web + mobile PASS (baseline `5c2e0ca`) |
