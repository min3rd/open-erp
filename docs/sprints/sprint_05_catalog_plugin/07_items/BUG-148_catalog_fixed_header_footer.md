# [BUG-148] Header/footer trang danh mục cuộn theo nội dung

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-148 / Bug giao diện / Sprint 05 |
| Mức độ / trạng thái | **Medium** / To Do (2026-10-28) |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | `CatalogAdminComponent`, plugin iframe host, [BUG-141](BUG-141_catalog_host_layout_and_sizing.md) |

## 1. Mô tả

Khi danh sách dài, cuộn trang làm **header** (tiêu đề, nút Nhập/Xuất, Thêm loại/bản ghi) và **footer phân trang** trôi khỏi màn hình; chỉ nên cuộn vùng nội dung (danh sách bản ghi), header/footer cố định.

## 2. Hiện trạng / nguyên nhân

- Root plugin UI dùng flow thường (`space-y-2`), không có chiều cao/flex cố định; iframe cuộn toàn bộ document.
- Header, bộ lọc và pagination nằm cùng luồng với bảng; không có `sticky`/`flex` tách vùng.
- Trong host core, topbar/menu đã cố định (`h-screen overflow-hidden`, `main overflow-y-auto`) nhưng nội dung plugin tự cuộn toàn trang.

## 3. Hướng sửa đề xuất

- Plugin layout: `h-full flex flex-col min-h-0`; header `shrink-0`; vùng nội dung `flex-1 min-h-0 overflow-y-auto`; footer phân trang `shrink-0`.
- Type list và item table có thể cuộn độc lập trong vùng nội dung; header bảng (`thead`) sticky trong vùng cuộn.
- Đảm bảo chiều cao iframe = viewport còn lại (đã có host fill); mobile safe-area cho footer.
- Không dùng `position: fixed` toạ độ tuyệt đối để tránh lệch khi host đổi kích thước.

## 4. Tiêu chí nghiệm thu

- [ ] Cuộn danh sách 100+ dòng: header và footer đứng yên; chỉ bảng/filter cuộn.
- [ ] `thead` sticky, không che dòng đầu; pagination luôn thấy.
- [ ] Web ≥1280px và mobile 390×844: không tràn ngang, không cắt footer, 0 console error.
- [ ] Kích thước iframe/header host thay đổi (resize) không tạo khoảng trống hoặc double scrollbar.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug từ yêu cầu chủ dự án | Chủ dự án |
