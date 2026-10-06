# [REV-S04-001] Nghiệm Thu & Đóng Sprint 04

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S04-001 / Sprint review / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | **`[x]` ĐÓNG — DoD GATE PASS (2026-10-06)** / 1.0 / 2026-10-06 |
| Owner / reviewer | PM Agent / QA + Khách hàng (chủ dự án) |
| Baseline đóng | `772a211` (web + mobile build PASS, 0 cảnh báo; bundle web 558 kB) |
| Đầu vào | [TR-S04-001 v0.3](../08_testing/02_TR-S04-001_sprint_04_test_report.md), [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md), [sprint_plan](../sprint_plan.md) |
| Đọc trước / đọc tiếp | [TR-S04-001](../08_testing/02_TR-S04-001_sprint_04_test_report.md) / Sprint kế tiếp (chưa mở) |

> **Ghi nhận trung thực**: Sprint 04 được **ĐÓNG theo chỉ đạo trực tiếp của chủ dự án ngày 2026-10-06** ("à đóng sprint 4"), trên cơ sở báo cáo QA 18/18 PASS do agent chạy. **Không tạo chữ ký giả** thay QA/Reviewer độc lập — xem §6.

## 1. Đối Chiếu DoD Sprint 04

| # | Điều kiện DoD | Trạng thái | Bằng chứng |
| :--- | :--- | :--- | :--- |
| 1 | CONF-S04-001 được khách xác nhận (nguồn + ngày) | **Đạt** | Approved 2026-10-05 (chỉ đạo trực tiếp, 20/20 câu) + §5.1 ghi thay đổi sau duyệt |
| 2 | 100% AC được QA browser (Web + Mobile 390×844), 0 console error, overflow 0 | **Đạt** | TR-S04-001 v0.3 (baseline `772a211`): **18/18 TC PASS**, 0 console error, overflow 0 ở 1440 & 390 (web + Ionic) |
| 3 | 4 theme × Light/Dark đạt AA, giữ mật độ, chỉ mặc định vuông vắn | **Đạt** | TC-02: body 16.30–17.93, muted 4.74–7.58 (≥ 4.5); TC-03: font 12px, hàng 28px, `sharp` mặc định |
| 4 | Theme theo tenant / mode theo người dùng (AC-17) | **Đổi phạm vi đã duyệt** | CONF §5.1: 4 trục theo người dùng, tenant là mặc định; backend test 7/7 |
| 5 | RTL đầy đủ cho `ar`, không tràn ngang 390px (AC-16) | **Đạt** | TASK-371 + TC-17: `dir=rtl`, overflow 0 ở 1440 & 390 **web + Mobile Ionic thật**, 0 console error |
| 6 | Mỗi locale phát hành đạt 100% key (AC-15) | **Đạt** | `i18n:check:strict` 13/13 (web 944, mobile 494 key) |
| 7 | Icon từ npm `feather-icons` qua adapter, không thêm UI framework | **Đạt** | Icon vendor hoá thành dữ liệu (36 icon dùng thật); không SVG vẽ tay ngoài component icon |
| 8 | `prefers-reduced-motion` tắt chuyển động không thiết yếu | **Đạt** | TC-06: 0 animation khi bật reduced-motion |
| 9 | 0 item `Critical`/`High` mở | **Đạt** | BUG-121…134 **đều Done** (5 Resolved + 9 In Review → chuyển Done theo biên bản này); không còn bug mở |
| 10 | User Guide Sprint 04 + Developer Guide + deployment guide | **Đạt** | `06_user_guides/sprint_04_ui_ux_experience_user_guide.md` (14 ảnh); `shared_ui_contribution_guide.md` mục Sprint 04 + `npm run icons:gen`; deployment: migration `V3.2.0` tự chạy, không cấu hình mới |
| 11 | Không tăng thư viện bên thứ ba | **Đạt** | Chỉ `feather-icons` (ngoại lệ đã chốt Q19), nay là devDependency build-time |

> **KẾT LUẬN DoD**: `[x]` **SPRINT 04 ĐÓNG — DoD GATE PASS** (2026-10-06).

## 2. Trạng Thái Cổng

| Gate | Trạng thái | Người quyết định | Nguồn/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval (CONF-S04-001) | **Approved** | Khách hàng (chủ dự án) | Chỉ đạo trực tiếp 2026-10-05 + §5.1 |
| Design ready (SOL/DES) | Draft | Architect/Reviewer | SOL/DES 0.1; chưa review kỹ thuật độc lập (follow-up) |
| QA sign-off | **Approved** | Chủ dự án (thay QA) | Chỉ đạo 2026-10-06 trên TR-S04-001 v0.3 (18/18 PASS, agent-run) |
| PM đánh giá DoD | **Approved** | PM Agent | §1 bảng DoD — 11/11 Đạt |
| Customer acceptance | **Approved** | Khách hàng (chủ dự án) | Chỉ đạo trực tiếp 2026-10-06 ("à đóng sprint 4") |
| Closure | **Closed** | PM sau nghiệm thu | Biên bản này, baseline `772a211` |

## 3. Tổng Kết Sprint (số liệu)

| Hạng mục | Số lượng |
| :--- | :--- |
| Feature | 6 (FEAT-24…29) — Done |
| Task | 20 (TASK-355…374) — Done |
| Bug trong sprint | 14 (BUG-121…134) — Done |
| Test case | 18 — **18 PASS** (TR v0.3, baseline `772a211`) |
| Backend test | `UserUiPreferencesApiTest` 7/7, `TenantUiPreferencesApiTest` 4/4 (PostgreSQL thật) |
| i18n | 13 locale × 2 app, web 944 key, mobile 494 key, parity 100% |
| Build | web + mobile PASS, **0 cảnh báo**; bundle web 558.11 kB (từ 640.25 kB) |

## 4. Follow-up Sau Khi Đóng (không chặn)

| Việc | Mức | Ghi chú |
| :--- | :--- | :--- |
| 1 nút 27px < 40px tại web 390px | Medium | Nút phụ trong vùng lọc; chỉnh khi có yêu cầu |
| Skeleton khi mạng chậm (nhánh đang tải) | — | Kiểm tay 1 lần theo TC-13/14; đợt tự động chặn endpoint nên vùng lỗi hiện ngay |
| RTL canvas sơ đồ tổ chức | — | Cố định LTR có chủ đích để chữ không lật |
| Review kỹ thuật độc lập SOL/DES + smoke K8s staging | — | Việc của Architect/Deployer, không phải lỗi sản phẩm |
| Trạng thái thu gọn menu dọc lưu theo trình duyệt | Low | Chưa đồng bộ theo tài khoản (TASK-369 mở rộng nếu cần) |

## 5. Chữ Ký Phê Duyệt Nghiệm Thu (Customer Acceptance Sign-Off)

> Sprint 04 **ĐÓNG theo chỉ đạo trực tiếp của chủ dự án ngày 2026-10-06**. Dưới đây ghi **loại xác nhận** cho từng dòng — **KHÔNG tạo chữ ký giả**.

- **Chủ dự án (Product Owner)**: **ĐÃ XÁC NHẬN ĐÓNG** — chỉ đạo trực tiếp 2026-10-06 (qua hội thoại, chưa ký tay vào file).
- **QA Agent**: **ĐÃ KIỂM CHỨNG** — [TR-S04-001 v0.3](../08_testing/02_TR-S04-001_sprint_04_test_report.md): 18/18 TC PASS + backend 7/7 (agent-run bằng CDP headless + đo số liệu, không phải người thứ ba độc lập).
- **Đại diện PM Agent**: **ĐÃ GHI NHẬN ĐÓNG HỒ SƠ** — biên bản này (DoD 11/11 Đạt, 34/34 item Done).

> **Trạng thái**: `[x]` **ĐÓNG**. Nếu cần chữ ký tay/độc lập (khách hàng hoặc reviewer ngoài), in tài liệu này, ký và ghi ngày; khi đó cập nhật dòng tương ứng từ "xác nhận qua chỉ đạo" sang ngày ký thực tế.

## 6. Liên Kết Bàn Giao

| Loại | Đường dẫn |
| :--- | :--- |
| Đọc trước (bản đồ sprint) | [00_READING_GUIDE](../00_READING_GUIDE.md) |
| Kế hoạch / mốc | [sprint_plan](../sprint_plan.md) |
| Xác nhận phạm vi | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) |
| Báo cáo kiểm thử | [TR-S04-001](../08_testing/02_TR-S04-001_sprint_04_test_report.md) + [evidence/screenshots](../08_testing/evidence/screenshots/) |
| Hướng dẫn sử dụng | [sprint_04_ui_ux_experience_user_guide.md](../../../06_user_guides/sprint_04_ui_ux_experience_user_guide.md) |
| Hướng dẫn phát triển | [shared_ui_contribution_guide.md](../../../08_developer_guides/shared_ui_contribution_guide.md) |
| Danh mục item | [07_items/](../07_items/) — 34 item Done |
