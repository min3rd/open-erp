# [TASK-298] QA Responsive Mobile Cho Bản Web (Chưa Được Kiểm Thử)

- **Mã Công Việc**: TASK-298
- **Phân Loại**: Task / QA Coverage
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (2026-09-19)
- **Người Xử Lý (Assignee)**: QA/QC Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — 0px overflow 13/13 màn × 390/768; theo dõi thêm BUG-83 Medium)*
- **Ngày Tạo**: 2026-09-19

---

## 1. Mô Tả Công Việc

> QA Sprint 02 mới kiểm thử Web ở desktop (1440×900) và Mobile app Ionic (390×844) — **chưa kiểm thử bản Web ở viewport mobile/responsive**. Cần bổ sung kiểm thử bản Web trong chế độ Mobile Emulation (390×844, và tối thiểu 1 breakpoint tablet ~768px), xác nhận không tràn ngang và các màn Sprint 02 sử dụng được.

## 2. Phạm Vi Kiểm Thử (Web tại 390×844 + 768px)

- `/platform/tenants`, `/platform/users`, `/platform/audit-logs`, `/platform/health`, `/platform/admins`
- `/settings/roles` (split-screen 3 cột cần hành vi responsive hợp lý: xếp dọc/scroll ngang có kiểm soát, không vỡ layout)
- `/settings/organization` (2 view mới của FEAT-19), `/settings/members`, `/settings/branch-assignments`, `/settings/sample-records`
- Banner impersonation + drawers (trượt phải full-width trên mobile), bảng dense (scroll ngang trong container, không tràn body).

## 3. Yêu Cầu

1. Viewport 390×844 (mobile) + 768×1024 (tablet): đo `document.documentElement.scrollWidth <= clientWidth` (overflow = 0) cho từng màn; touch target ≥ 40px với phần tử tương tác chính.
2. 0 lỗi `console.error`.
3. Nếu phát hiện lỗi responsive: tạo BUG item mới (Medium/High theo mức độ) kèm ảnh + bước tái hiện; các lỗi Critical/High phải được sửa trước khi đóng Sprint.
4. Ảnh chụp lưu `08_testing/screenshots/web-responsive/`; cập nhật `08_testing/test_report.md` mục responsive + `test_plan.md` bổ sung TC tương ứng.

## 4. Tiêu Chí Nghiệm Thu

- [x] Toàn bộ màn Sprint 02 kiểm thử ở 390×844 và 768px, có bảng Pass/Fail + ảnh.
- [x] Overflow = 0 (hoặc bug được ghi nhận và xử lý).
- [x] 0 console error.

## 5. Ghi Chú Thực Thi QA (2026-09-19) — QA-RS

- Đã kiểm thử **26 lượt đo** (13 màn/trạng thái × 2 viewport 390×844 và 768×1024): 5 màn Platform, 5 màn Settings, organization 2 view, quota drawer, impersonation banner. Ảnh: `08_testing/screenshots/web-responsive/` (26 ảnh `QA-RS-*`).
- **768×1024: PASS toàn bộ** — overflow = 0 mọi màn; 0 console error.
- **390×844: FAIL 6/6 màn Platform + Drawer** — `scrollWidth 444 > clientWidth 390` (+54px) do `platform-topbar`; Drawer Hạn mức bị đẩy lệch (`x=40, w=390`) → **BUG-81 (High)**.
- **390×844: PASS** các màn Settings (roles, organization list/graph, members, branch-assignments, sample-records), impersonation banner, graph scroll/zoom — overflow = 0.
- **Console errors: 0** toàn bộ 26 lượt đo.
- Touch target tại 390: nhiều phần tử topbar <40px (theme 34-47×37, VI/EN 28×21, Đăng xuất 44×39, Menu 32×32, nav settings 35px) — ghi phụ lục trong BUG-81, ưu tiên sửa gộp.
- **Kết luận**: tiêu chí "Overflow = 0" **chưa đạt** ở viewport 390 → TASK-298 giữ **In Progress**; đóng sau khi BUG-81 được sửa và QA đo lại.

## Ghi Chú Developer (2026-09-19)

- BUG-81 đã được FE xử lý (`[x] Done`) — topbar wrap + drawer full-width mobile + touch target ≥40px (chi tiết tại `BUG-81_web_platform_390_overflow.md`). Giữ **In Progress** chờ QA đo lại đủ 13 màn/trạng thái × 390/768 và bổ sung ảnh nghiệm thu.

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-RS2: PASS → Done

- **26 lượt đo lại** (13 màn/trạng thái × 390×844 + 768×1024): **overflow = 0/0px toàn bộ** (trước đó 6 màn Platform + Drawer tràn +54px tại 390) → fix BUG-81 đạt.
- **Drawer Hạn mức**: 390 → `x=0, w=390, right=390` (full-width, không lệch); 768 → `x=308, w=460` (peek 40px như thiết kế desktop).
- **Touch target**: platform topbar đạt 100% tại 390 (theme 64×40, Sáng/Tối 40×40, VI/EN 40×40, Đăng xuất 68×40, 5 nav link cao 40px). Còn **shared topbar hamburger 32×32 + nav Settings cao 35px** tại 390 → tách **BUG-83 (Medium)**, không chặn DoD.
- **Console errors: 0** trên cả 26 lượt đo.
- Ảnh: `08_testing/screenshots/web-responsive/QA-RS2-{390,768}_*.png` (26 ảnh). Checklist nghiệm thu: 13 màn ✓, overflow = 0 ✓, 0 console error ✓ → **Done** (theo dõi BUG-83 Medium).
