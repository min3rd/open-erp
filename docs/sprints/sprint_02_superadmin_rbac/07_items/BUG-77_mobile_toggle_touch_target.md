# [BUG-77] Toggle Switch Trên Mobile Chỉ Cao 16px — Không Đạt Chuẩn Touch Target ≥ 40px

- **Mã Lỗi**: BUG-77
- **Phân Loại**: Bug / Defect (Mobile UX & Accessibility)
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Browser Dual-Mode Testing Sprint 02)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Trên bản Mobile Ionic 8 (viewport 390x844), các **toggle switch** trong màn Chi tiết vai trò (`/settings/roles/:roleId`) chỉ có kích thước thật **16px × 28px** (`class="relative inline-flex h-4 w-7"` của `SharpToggleComponent`), nhỏ hơn nhiều so với chuẩn touch target tối thiểu **≥ 40px** mà quy chuẩn UI/UX ERP Sprint 02 yêu cầu. Vùng chạm thực tế chỉ đúng bằng viên toggle, không được mở rộng ra hàng bao quanh. Cùng nhóm lỗi, nút mở/đóng cây phòng ban tại `/settings/organization` chỉ **24×24px**.

- **Môi trường**: Mobile emulation 390x844 (Chromium, `isMobile`, `hasTouch`, DPR 2), `http://localhost:8100`.
- **Tài khoản test**: `qa.owner02@example.com` (TENANT_ADMIN, tenant `qa-test-corp-02`).

### Bằng chứng (file:line + runtime)

- `src/frontend/shared/components/sharp-toggle/sharp-toggle.component.html:8` — `class="relative inline-flex h-4 w-7 ..."` (16×28px).
- `src/frontend/mobile/src/app/pages/settings/roles/role-detail/role-detail.page.html:91` — toggle quyền chức năng.
- `src/frontend/mobile/src/app/pages/settings/roles/role-detail/role-detail.page.html:202` — toggle gán vai trò cho user.
- `src/frontend/mobile/src/app/pages/settings/organization/organization.page.html:85-92` — nút mở/đóng cây phòng ban chỉ `w-6 h-6` = **24×24px** (đo runtime tại QA-M-03; nút không có vùng chạm mở rộng).
- Đo runtime trên trang Chi tiết vai trò (tab "Quyền chức năng"): 24/24 toggle có `getBoundingClientRect().height = 16px`; hàng bao quanh (`div.min-h-10`) = 41px nhưng **không phải vùng click** (chỉ phần text button và toggle nhận click).
  - Ảnh minh chứng: `../08_testing/screenshots/mobile/QA-M-02_b_role_detail_permissions_tab.png`; cây phòng ban: `QA-M-03_b_departments_tree_expanded.png`.
- Tab "Phạm vi dữ liệu" và danh sách vai trò không có vi phạm (các nút đều `min-h-10` = 40px).

### Các bước tái hiện (Reproduction Steps)

1. Mở `http://localhost:8100`, bật Device Emulation 390x844, đăng nhập `qa.owner02@example.com`.
2. Menu → "Vai trò & Phân quyền" → chạm vai trò `STAFF`.
3. Ở tab "Quyền chức năng", dùng DevTools đo `app-sharp-toggle button` → `16px × 28px`.
4. Thử chạm bằng ngón tay/emulation: rất dễ trượt ra ngoài, thao tác bật/tắt không chính xác.

## 2. Tác Động

- Trải nghiệm cảm ứng kém trên điện thoại: bật/tắt quyền dễ sai, tăng thao tác lặp.
- Vi phạm quy chuẩn DoD "Touch target ≥ 40px" của Sprint 02 cho bản Mobile.
- Ảnh hưởng cả toggle gán vai trò user trong cùng màn.

## 3. Kết Quả Kỳ Vọng

- Toggle trên Mobile có vùng chạm ≥ 40px: bọc toggle trong nút/hàng có `min-h-10` (hoặc `p-3 -m-3`) nhận sự kiện click, hoặc thêm prop kích thước mobile cho `SharpToggleComponent` (ví dụ `size="touch"` chỉ dùng ở Mobile).
- Nút mở/đóng cây phòng ban mobile cần vùng chạm ≥ 40px (ví dụ `w-10 h-10` hoặc thêm hit-area padding).
- Giữ nguyên kích thước hiển thị 16×28 cho Desktop (không phá vỡ mật độ cao).
- Sau khi sửa, đo lại 100% phần tử tương tác ≥ 40px trên các màn mobile Sprint 02.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer mở rộng vùng chạm toggle (Mobile-only) mà không đổi giao diện Desktop.
- [ ] QA đo lại `app-sharp-toggle button` ≥ 40px trên `/settings/roles/:id` (2 tab có toggle).
- [ ] Cập nhật `08_testing/test_report.md` (QA-M-02) sau khi sửa.

## Ghi Chú QA (2026-09-19)

- Phát hiện trong QA-M-02; các mục còn lại của case đều đạt (Action Sheet 7 scope, lưu thành công, overflow-x = 0).
- Không ảnh hưởng chức năng/backend; thuần túy kích thước vùng chạm trên thiết bị cảm ứng → mức **Medium**.

## Ghi Chú Triển Khai (Developer) — 2026-09-19

- **`SharpToggleComponent` (shared)**: thêm input `size: 'sm' | 'touch'` (mặc định `sm`). Khi `size="touch"`, nút switch thật có kích thước **40×44px** (`h-10 w-11`, vùng chạm ≥ 40px) nhưng track hiển thị vẫn giữ nguyên **16×28px** nên không phá mật độ Desktop. Bổ sung input `title` để hiển thị tooltip.
- **`role-detail.page.html` (Mobile)**: 2 toggle (quyền chức năng + gán vai trò user) chuyển sang `size="touch"` → mọi toggle đạt ≥ 40px.
- **`organization.page.html` (Mobile)**: nút mở/đóng cây phòng ban `w-6 h-6` (24×24) → `w-10 h-10` (40×40); placeholder lá đổi tương ứng để giữ thẳng hàng thụt lề.
- **Rà soát thêm**: nút đóng bottom sheet "khóa khẩn cấp" ở `platform/emergency` `w-8 h-8` (32×32) → `w-10 h-10` (40×40).
- Desktop không đổi (các usage Web vẫn dùng mặc định `sm`). Build Web + Mobile PASS ngày 2026-09-19.
- Chờ QA đo lại `app-sharp-toggle button` tại `/settings/roles/:id` (2 tab có toggle) + nút cây phòng ban mobile, cập nhật `08_testing/test_report.md` (QA-M-02/QA-M-03).

## Ghi Chú QA Re-test (2026-09-19) — QA-R-77: PASS

- Đo runtime Mobile 390×844 (`/settings/roles` → role `STAFF`):
  - Tab "Quyền chức năng": **24/24 toggle = 44×40px** (đạt ≥40).
  - Tab "Người dùng" (sau khi chọn user): toggle gán vai trò = **44×40px**.
  - `/settings/organization` tab Phòng ban: nút expand/collapse cây = **40×40px**.
- Overflow-x = 0 tại cả 3 màn; console errors = 0.
- Ảnh: `QA-R-77_a_roles_list.png`, `QA-R-77_b_role_detail_permissions.png`, `QA-R-77_c_role_detail_scopes.png`, `QA-R-77_d_role_detail_users.png`, `QA-R-77_e_organization_tree.png`.
- **Kết luận**: khắc phục đạt → giữ **Done**.
