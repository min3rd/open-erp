# [FEAT-19] Cây Phòng Ban 2 Chế Độ Xem: Danh Sách Thụt Lề Theo Cấp & Sơ Đồ Cây (Graph)

- **Mã Tính Năng**: FEAT-19
- **Phân Loại**: Feature / UI Enhancement
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — QA-F2-19 PASS trên app thật)*
- **Ngày Tạo**: 2026-09-19

---

## 1. Mô Tả Yêu Cầu

> Màn Cơ cấu tổ chức (`/settings/organization`) cần **2 chế độ xem** cho cây phòng ban:
> 1. **Danh sách thụt lề theo cấp** (indented list): mỗi node thụt lề theo depth, có nút collapse/expand, dòng dense.
> 2. **Sơ đồ cây graph**: node + đường nối trực quan theo cấp (top-down hoặc left-right), zoom/scroll khi cây lớn.

- **Nền tảng**: Web (Desktop ≥1280px). Mobile giữ danh sách lồng nhau hiện có (read-only/tối giản) — không bắt buộc graph.
- **Chuyển đổi view**: segmented control / toggle ở thanh công cụ, giữ trạng thái expand khi đổi view.
- **Tương tác node**: click chọn node → panel/drawer chi tiết (tên, mã, trưởng phòng, số thành viên, hành động Sửa/Di chuyển/Thêm con) — **không modal**.

## 2. Yêu Cầu Kỹ Thuật

1. **Không dùng thư viện đồ thị bên thứ 3** (tuân thủ quy định hạn chế thư viện UI): tự dựng graph bằng HTML/CSS absolute-positioning hoặc SVG thuần trong component Angular, dữ liệu lấy từ API tree hiện có (`GET /organization/departments?tree=true`).
2. Layout thuật toán đơn giản: tính vị trí theo depth + thứ tự node (tidy tree cơ bản), đường nối elbow/bezier; hỗ trợ cây sâu tối đa 5 cấp.
3. Style ERP: dense, `rounded-none`, viền mỏng, màu theo design tokens hiện có; highlight node đang chọn; badge số thành viên.
4. Tách template `.html`; i18n 100% cho nhãn view/nút; không hardcode.
5. View state lưu localStorage (ưu tiên người dùng), mặc định indented list.

## 3. Tiêu Chí Nghiệm Thu

- [x] Chuyển đổi 2 view mượt, không mất trạng thái expand/selection.
- [x] Graph hiển thị đúng quan hệ cha–con ≤5 cấp; cây lớn scroll/zoom không vỡ layout, không tràn ngang.
- [x] Thao tác CRUD/move department vẫn hoạt động từ cả 2 view (drawer hiện có).
- [x] Build web PASS; 0 console error; QA chụp ảnh 2 view.

## Ghi Chú Triển Khai (Developer) — 2026-09-19

> **FE hoàn tất 2026-09-19, chờ QA xác nhận.**

- **Segmented control**: `list` ⇄ `graph` tại thanh công cụ khu vực cây; trạng thái lưu localStorage `openerp_org_view` (mặc định `list`). Trạng thái collapse (`collapsedIds`) và node đang chọn (`selectedId`) dùng chung cho cả 2 view nên không mất khi đổi view.
- **Indented list**: thụt lề theo depth, nút collapse/expand từng node, "Mở rộng/Thu gọn tất cả", dòng dense `rounded-none`; badge số thành viên; click node highlight chọn.
- **Graph**: dựng thuần HTML/CSS absolute + SVG elbow path (**không thư viện đồ thị**); tidy layout theo depth (post-order, node lá cấp x, cha = trung bình con), hỗ trợ cây sâu 5+ cấp; zoom 50%–160% bằng CSS transform + scroll container; toggle collapse trên node; highlight node chọn; badge số thành viên.
- **Panel chi tiết (không modal)**: click node (cả 2 view) mở panel inline bên dưới cây hiển thị tên/mã/chi nhánh/trưởng phòng/số thành viên/cấp + hành động **Thêm con / Sửa / Xóa** (mở drawer hiện có; "Di chuyển" thực hiện qua đổi phòng ban cha trong drawer Sửa — luồng move API giữ nguyên).
- **Dữ liệu**: tái sử dụng API tree hiện có + `GET /organization/memberships` để đếm thành viên theo phòng ban (không cần đổi backend).
- **Files**: `web/src/app/features/settings/organization/organization.component.{ts,html}`; i18n mới 13 key (vi/en parity 100%).
- Mobile giữ nguyên danh sách lồng nhau hiện có (không bắt buộc graph).
- Build `npm run build` Web PASS ngày 2026-09-19.
- **Chờ QA**: chụp ảnh 2 view, kiểm tra cây lớn scroll/zoom + CRUD/move từ graph, đo console.error = 0.

## Ghi Chú QA Xác Nhận (2026-09-19) — QA-F-19: PASS

- Tạo thêm chuỗi phòng ban 5 cấp (`QA-KD` → `QA-KD-B2B` → `QA-KD-B2B-L3 → L4 → L5`) để kiểm tra độ sâu.
- **View danh sách thụt lề**: 5 dòng thụt lề tăng dần `0px/14px/28px/42px/56px`; collapse root → còn 1 dòng; expand lại → đủ 5; click node → panel chi tiết inline (không modal) hiển thị tên/mã/chi nhánh/trưởng phòng/thành viên/cấp + 3 hành động.
- **View graph**: 5 node + **4 đường elbow SVG** nối đúng cha–con; tọa độ `top` tăng đúng theo cấp `24→128→232→336→440px`; collapse `B2B` trên list → graph cũng ẩn hậu duệ (còn 2 node) → **trạng thái collapse chia sẻ giữa 2 view**.
- **Zoom**: 100% → `+` = 110% → `−`×2 = 90%; nút reset tỷ lệ hoạt động.
- **F5**: giữ view `graph` qua `localStorage.openerp_org_view`; quay lại list lưu `'list'`.
- Không dùng thư viện đồ thị ngoài (SVG/HTML thuần). Console errors = 0.
- Ảnh: `QA-F-19_a_list_view_full_tree.png` → `QA-F-19_g_graph_after_f5_reload.png`.
- **Kết luận**: đạt toàn bộ tiêu chí nghiệm thu → **Done**.

## Ghi Chú Developer (2026-09-19) — Nâng cấp theo yêu cầu khách hàng 2026-09-19: chuyển Canvas engine, chờ QA

> **Trạng thái: `In Progress` — chuyển Canvas engine theo yêu cầu khách hàng 2026-09-19, chờ QA.** Không chạm backend.

- **Thay thế view Graph cũ (HTML absolute + SVG path) bằng Canvas 2D thuần (không thư viện)** — component mới `web/src/app/features/settings/organization/department-graph-canvas.component.{ts,html}`:
  - Node vẽ bằng `CanvasRenderingContext2D` (rect bo góc `rounded-sm`, name + code + badge số thành viên + nút collapse +/−); màu light/dark theo class `.dark` của `<html>` (MutationObserver vẽ lại khi đổi theme); canvas scale theo `devicePixelRatio` (tối đa 3×) nên nét trên màn retina.
  - Edge elbow bo góc (quadratic curve) nối tâm đáy cha → tâm đỉnh con; edge liên quan node đang chọn được tô đậm.
  - **Viewport culling**: chỉ vẽ node/edge giao với khung nhìn (bbox) — không tạo DOM node cho bất kỳ node dữ liệu nào; hit-testing O(n) theo thứ tự vẽ ngược.
  - **Zoom 25%–250%**: wheel quanh con trỏ (listener `{ passive: false }`), nút ±/Đặt lại/Vừa khung; **Pan**: kéo nền, giữ Space + kéo, hoặc phím mũi tên khi canvas focus; nhấp đúp node để căn giữa; `Fit view` tự canh toàn cây.
  - **Lưu viewport gần nhất** vào `localStorage.openerp_org_graph_viewport` (`{zoom, cx, cy}` — tâm khung nhìn theo toạ độ world, khôi phục đúng theo kích thước canvas).
  - Overlay hiển thị toạ độ con trỏ + mini legend; `data-node-count` / `data-zoom` phục vụ QA đo tự động.
- **Giữ nguyên view Indented List**; `viewMode`/`collapsedIds`/`selectedId` vẫn ở component cha nên không mất trạng thái khi đổi view/zoom; panel chi tiết + CRUD/move giữ nguyên qua `(nodeSelected)`/`(collapseToggled)`.
- i18n thêm 6 key parity vi/en: `ORGANIZATION_GRAPH_FIT_VIEW`, `ORGANIZATION_GRAPH_COORDINATES`, `ORGANIZATION_GRAPH_LEGEND_NODE/SELECTED/COLLAPSED`, `ORGANIZATION_GRAPH_HINT_PAN_ZOOM`; `styles.css` bổ sung touch target ≥40px cho nút toolbar canvas tại viewport ≤639px.
- **Kiểm chứng (harness Playwright tĩnh, dữ liệu giả cây 5 cấp)**:
  - Cây **500 node** render đủ (`data-node-count=500`), canvas 843×500 có nội dung (379 mẫu khác nền), 0 console error; zoom nút 25%→43%, wheel →88%, zoom out →73%, Fit →25%; pan đổi pixel thật; ~149 rAF frame/s khi tương tác.
  - Cây 4 node: click chọn mở panel chi tiết; nhấp đúp căn giữa; collapse root → 1 node, Mở rộng tất cả → 4 node; Đặt lại tỷ lệ → 100%.
  - Web 390×844 view Graph: overflow = 0, nút toolbar ≥40px, 0 console error.
- `npm run build` Web + Mobile **PASS** (2026-09-19).
- **Chờ QA**: xác nhận lại 2 view + tương tác canvas/zoom/pan trên app thật, chụp ảnh minh chứng, đo `console.error = 0`.

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-F2-19: PASS → Done

- **App thật** (`/settings/organization`, owner, Chrome 1440×900 DPR 2): cây thật 5 node/4 edge; canvas buffer `1686×1000` = CSS 843×500 × DPR 2 → nét đúng DPR.
- **Tương tác**: click node mở panel chi tiết (QA-KD); collapse/expand qua nút trên canvas (5→2→5 node); zoom wheel (0.92→1.15→0.73) + nút ±/Đặt lại/Vừa khung; clamp đúng **25%–250%**; pan kéo nền đổi viewport thật; double-click căn giữa chính xác (dx=0, dy=0); đổi view list⇄graph giữ collapse + selection; **F5 giữ viewport + view graph**.
- **Cây lớn 405 node** (seed SQL tạm 400 phòng ban `QZ-G-*`, xóa sau test): render cây thật + cây lớn; viewport culling `inView 25/405` khi fit; draw 0.63ms/lần (cây nhỏ 0.14ms); pan **~60 FPS**; zoom lớn hoạt động.
- **Dọn dẹp**: đã xóa toàn bộ 400 department giả; DB trở về 5 phòng ban; không sửa mã nguồn; console errors = 0.
- Ảnh: `../08_testing/screenshots/web/QA-F2-19_a..j` (10 ảnh). Kết luận: **đạt toàn bộ tiêu chí → Done**.
