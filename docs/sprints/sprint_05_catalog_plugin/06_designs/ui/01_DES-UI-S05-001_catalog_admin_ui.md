# [DES-UI-S05-001] Thiết kế UI quản trị danh mục & component trường danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S05-001 / Thiết kế UI / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [SOL-S05-001](../../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) (D15, D16), [DES-API-S05-001](../api/01_DES-API-S05-001_catalog_api.md) |
| Đọc trước / đọc tiếp | DES-API-S05-001 / [TP-S05-001](../../08_testing/01_TP-S05-001_sprint_05_test_plan.md) |

## 1. Nguyên tắc UI (bắt buộc theo quy chuẩn dự án)

- **Không modal**: dùng Router con + **Drawer** (trượt phải, xếp tầng) + **split-screen**.
- **Mật độ cao**: `text-xs`/`text-sm`, `p-1`/`p-2`, `gap-1`; mặc định **vuông vắn** (theme industrial).
- **i18n 100%**: không hardcode nhãn; mọi key mới phải có đủ 13 locale (web) / tập con (mobile).
- **Component dùng chung trước**: trường danh mục là component `@shared`, Web và Mobile cùng dùng.
- Trạng thái tải theo **vùng độc lập** (skeleton + Thử lại) theo mẫu Sprint 04.

## 2. Màn quản trị (Desktop) — Settings → Danh mục

Bố cục **split 3 cột** (không modal), mỗi cột tải độc lập:

```
┌── Loại danh mục (224px) ──┬── Bản ghi của loại (flex) ─────────────┬── Drawer chi tiết ──┐
│ [tìm loại…]               │ [tìm mã/tên…] [Trạng thái ▾] [as-of]   │ (mở khi chọn mục)   │
│ ● Tỉnh        (Hệ thống)  │ Chế độ xem: [Danh sách | Cây | Đa cha] │ • Thông tin         │
│ ● Huyện       (Hệ thống)  │ ─────────────────────────────────────  │ • Quan hệ (cha/con) │
│ ● Xã          (Hệ thống)  │ ☑ Hà Nội           3 cha   [Sửa] [Xoá] │ • Lịch sử phiên bản │
│ ● Ngành       (Hệ thống)  │ ☑ Hải Phòng        2 cha   [Sửa] [Xoá] │ • Nút: Lưu (phiên   │
│ ● Chức danh   (Tenant)    │ … (phân trang)                         │   bản mới) / Đóng   │
│ + Thêm loại (quyền)       │                                        │                     │
└───────────────────────────┴────────────────────────────────────────┴─────────────────────┘
```

| Thành phần | Chi tiết |
| :--- | :--- |
| **Cột 1 — Loại** | Danh sách loại (hệ thống trước, tenant sau) + badge `TREE/DAG`, `nhập tự do`, `SYSTEM_BACKED`. Chọn loại ⇒ cột 2 tải. Nút **Thêm loại** chỉ hiện khi có `catalog:type:manage`. Bấm vào badge quyền ⇒ mở drawer **Quyền theo loại** (ma trận vai trò × [xem/ghi], tái dùng bố cục `role-matrix`). |
| **Cột 2 — Bản ghi** | 3 chế độ xem: **Danh sách** (bảng, mặc định), **Cây** (theo đường đang chọn), **Đa cha** (nhóm theo số cha, cột "cha" hiện chip). Bộ lọc `q` (mã/tên), trạng thái, `as_of` (chỉ hiện khi loại có version). Phân trang server-side. Hàng có **context menu chuột phải** (Sửa, Thêm quan hệ, Thêm cha, Đóng hiệu lực, Xem lịch sử) theo mẫu Sprint 04. |
| **Drawer chi tiết** | 3 khối: **Thông tin** (mã, tên, mô tả, thuộc tính động theo `attributes_schema`, thứ tự), **Quan hệ** (danh sách cha kèm `relation_type` + nút "Thêm cha" mở drawer chọn; danh sách con), **Lịch sử** (read-only: phiên bản, hiệu lực, ai sửa). Sửa ⇒ cảnh báo rõ "Lưu sẽ tạo **phiên bản mới**". |
| **Drawer Import/Export** (Q7, N3) | Nút **Import** (chỉ khi có `catalog:item:manage`): chọn tệp **CSV hoặc `.xlsx`** → **kiểm tra trước** (`dry_run`) hiện bảng kết quả theo dòng (tạo/cập nhật/bỏ qua/lỗi + mã lỗi) → nút "Ghi vào danh mục" → báo cáo cuối (gồm số quan hệ cha–con đã tạo). Nút **Tải tệp mẫu** (CSV). Nút **Export**: xuất theo loại đang chọn hoặc tất cả (kèm cha/con, hiệu lực). |
| **Màn quản trị hệ thống (cổng Platform)** (N5) | Dùng lại bố cục 3 cột với cờ **"hệ thống"**: chỉ super admin thấy; quản trị loại + bản ghi hệ thống (`tenant_id IS NULL`) + quan hệ + import/export. Tenant không có màn này. |
| **Ghi đè danh mục hệ thống** (Q1/Q2) | Bản ghi tenant trùng `code` với mục hệ thống hiển thị badge **"Ghi đè"**; bản ghi tenant `INACTIVE` cùng `code` = **ẩn** mục hệ thống khỏi options của tenant (không ảnh hưởng tenant khác). |
| **Drawer thêm quan hệ** | Chọn cha (picker cùng component `catalog-picker`), chọn `relation_type` (chỉ các loại được phép của loại danh mục), `sort_order`. Lỗi chu trình hiển thị inline theo `code`. |

**Trạng thái**: mỗi cột có skeleton + thông báo lỗi + **Thử lại** riêng; empty state rõ ("Loại này chưa có bản ghi").

## 3. Component dùng chung — `catalog-picker` (`src/frontend/shared/components/`)

**Hợp đồng đã dựng (TASK-386, 2026-10-06 — dùng tên này khi lập trình):**

| Input/Output | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `typeCode` | `string` | Loại danh mục (bắt buộc) |
| `mode` | `CatalogPickerMode` (`single`/`multi`) | Thay cho `multiple` ở bản nháp |
| `parentId` | `string \| null` | Lọc phụ thuộc (ví dụ xã theo tỉnh) |
| `asOf` | `string \| null` | Đọc theo mốc hiệu lực |
| `placeholderKey` | `string \| null` | Khoá i18n cho placeholder |
| `allowFreeText` | `boolean` | Cho nhập giá trị tự do (mặc định theo schema loại) |
| `canInlineCreate` | `boolean` | Hiện nút "Lưu vào danh mục" (theo quyền `catalog:item:inline-create`) |
| `disabled` | `boolean` | Khoá trường |
| `size` | `SizeVariant` | Token kích thước dùng chung (mặc định `SM`) |
| `(selectionChange)` | `CatalogItemRef \| CatalogItemRef[] \| null` | Chọn/xoá (single = ref/null, multi = mảng) |
| `(freeTextChange)` | `string \| null` | Giá trị tự do người dùng gõ |

**Hành vi đã kiểm chứng (build web + mobile PASS, i18n 13 locale × 2 app 100%):**
1. Gõ tìm: debounce 250ms, gọi options (`page=0,size=20`), nút "tải thêm" ở cuối danh sách.
2. Không có kết quả + `allowFreeText` ⇒ dòng **"Dùng giá trị tự do: <text>"**.
3. `canInlineCreate` ⇒ nút **"Lưu vào danh mục"** (gọi `POST /catalog/lookup/{typeCode}/inline`, chọn mục mới; trùng mã/tên có thông báo riêng).
4. Bàn phím (↑/↓/Enter/Esc), click ngoài đóng, nút xoá, chip nhiều lựa chọn kèm tooltip mã, skeleton/trống/lỗi + thử lại.
5. Mobile: touch target ≥40px, không phụ thuộc hover, không tràn ngang ở 390px, padding safe-area.

**Chưa dựng (bổ sung khi màn hình cần)**: input hai chiều `value` + output `(inlineCreated)`; khởi tạo từ `catalog_item_id` đơn lẻ gọi **resolve theo lô** (endpoint `POST /catalog/lookup/{typeCode}/resolve` — dùng khi form lưu id thay vì text).

## 4. Mobile (Ionic) — phạm vi

| Chức năng | Desktop | Mobile |
| :--- | :---: | :---: |
| Quản trị loại/bản ghi/quan hệ/quyền | ✅ | ❌ (chỉ hiển thị thông báo "làm trên bản Web") |
| Tra cứu danh mục (xem cây/danh sách) | ✅ | ✅ (read-only) |
| Trường `catalog-picker` trong form | ✅ | ✅ |

## 5. Key i18n mới (dự kiến)

`CATALOG_SECTION_TITLE`, `CATALOG_TYPE_*` (nhãn loại), `CATALOG_FIELD_*` (thuộc tính động), `CATALOG_VIEW_LIST|TREE|MULTI_PARENT`, `CATALOG_RELATION_*`, `CATALOG_GRANT_*`, `CATALOG_HISTORY_*`, `CATALOG_FREE_TEXT_USE`, `CATALOG_INLINE_SAVE`, `PLUGIN_CATALOG_NAME|DESCRIPTION`, `PERM_CATALOG_*`, và các mã lỗi ở DES-API §6. Tất cả phải có đủ **13 locale** trước khi merge (`npm run i18n:check:strict`).

## 6. Truy vết AC

| AC | Đảm bảo bởi |
| :--- | :--- |
| AC-09 | Drawer **Quyền theo loại** + trạng thái chỉ đọc khi thiếu grant |
| AC-10/AC-11/AC-12 | Component `catalog-picker` (lazy, resolve theo lô, nhập tự do, inline-create) |
| AC-16 | Ma trận Desktop/Mobile (§4) khai báo trong manifest plugin |
| AC-17 | Chế độ xem **Đa cha** + danh sách cha trong drawer + breadcrumb theo đường đang chọn; không modal |
| AC-18/AC-19 | Drawer Import (dry-run + báo cáo theo dòng, CSV/`.xlsx`) và Export/Tải mẫu |
| AC-20 | Badge "Ghi đè" + trạng thái ẩn cục bộ trong danh sách và options |
| AC-22 | Màn quản trị hệ thống trong cổng Platform (cờ "hệ thống") |

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp bố cục 3 cột + component picker + ma trận nền tảng | Architect; chưa review |
| 0.2 | 2026-10-06 | Cập nhật §3 theo hợp đồng `catalog-picker` **đã dựng** (TASK-386): `mode`/`selectionChange`/`freeTextChange`, base URL token `CATALOG_API_BASE_URL`; ghi rõ 2 phần chưa dựng (`value` hai chiều, resolve theo lô) | Architect; nguồn: code shared + build web/mobile PASS |
