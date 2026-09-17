# [MÃ_TÍNH_NĂNG] Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UI/UX Spec)

- **Tính năng**: [Tên tính năng]
- **Phụ trách**: Solution Architect / UI Designer Agent
- **Ngày lập**: YYYY-MM-DD

---

## 1. Bản Đồ Màn Hình & Điều Hướng (Screen Map & Navigation)
- `/dashboard/module` -> Danh sách bảng dữ liệu
- `/dashboard/module/new` -> Form tạo mới
- `/dashboard/module/:id` -> Chi tiết & Chỉnh sửa

---

## 2. Cấu Trúc Các Component Giao Diện (Component Hierarchy)
```
- ModuleContainer
  ├── ModuleHeader (Title, Actions: New, Export, Filter)
  ├── FilterBar (Search input, Status dropdown, DateRangePicker)
  ├── DataTable
  │   ├── TableHead (Sortable columns)
  │   └── TableRow (Data cells, Actions menu: View, Edit, Delete)
  └── PaginationControl (Page size, Current page, Total count)
```

---

## 3. Trạng Thái Giao Diện (UI States)
- **Loading State**: Hiển thị Skeleton loader khi đang fetch API.
- **Empty State**: Khi không có dữ liệu, hiển thị hình minh họa và nút "Tạo mới ngay".
- **Error State**: Banner cảnh báo kèm nút "Thử lại".
- **Success State**: Toast notification báo thành công khi hoàn tất thao tác.

---

## 4. Quy Tắc Validation Trên Form
- Trường bắt buộc đánh dấu `*` màu đỏ.
- Báo lỗi ngay khi `blur` hoặc khi bấm Submit.
