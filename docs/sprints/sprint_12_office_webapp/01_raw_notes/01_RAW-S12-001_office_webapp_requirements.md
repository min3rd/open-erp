# [RAW-S12-001] Yêu cầu gốc: Sprint 12 — Plugin Office WebApp

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S12-001 / Yêu cầu gốc / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-15 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Hội thoại trực tiếp với chủ dự án ngày 2026-11-15 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE.md](../00_READING_GUIDE.md) / [ANL-S12-001](../02_analysis/01_ANL-S12-001_office_webapp_plugin.md), [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) |

## 1. Nguồn yêu cầu

Hội thoại trực tiếp giữa chủ dự án (khách hàng) và Agent điều phối ngày **2026-11-15**.

## 2. Nguyên văn lời khách hàng

> "sprint 12: office webapp
> - sử dụng agent browser để sử dụng browser edge của tôi để sử dụng office 365
> - mục tiêu của sprint này là tạo ra 1 plugin để có thể xem/sửa các file định dạng của microsoft office ngay trên trình duyệt tương tự office 365 của microsoft. plugin có thể mở các file bằng client, không cần sự can thiệp của backend là tốt nhất
> - hãy viết các tài liệu bước đầu của sprint để tôi review"

## 3. Bóc tách yêu cầu thô

| # | Yêu cầu thô | Nguồn |
| :--- | :--- | :--- |
| R1 | Dùng `agent-browser` kết nối trình duyệt Microsoft Edge của người dùng để khảo sát trải nghiệm Office 365 | Hội thoại 2026-11-15 |
| R2 | Tạo **1 plugin** trong hệ thống Open-ERP để **xem và chỉnh sửa** các file định dạng Microsoft Office ngay trên trình duyệt | Hội thoại 2026-11-15 |
| R3 | Trải nghiệm giao diện và thao tác **tương tự Office 365** (Microsoft 365 for the Web: Word, Excel, PowerPoint) | Hội thoại 2026-11-15 |
| R4 | **Ưu tiên mở & xử lý file hoàn toàn phía Client**, hạn chế hoặc **không cần sự can thiệp của Backend** là tốt nhất | Hội thoại 2026-11-15 |
| R5 | Viết các tài liệu bước đầu (00–04) của Sprint 12 để chủ dự án review trước khi thiết kế/lập trình | Hội thoại 2026-11-15 |
| R6 | **Tự xây dựng từ đầu (Build from scratch), KHÔNG phụ thuộc thư viện bên thứ 3** (không dùng Univer, SheetJS, docx-preview, Tiptap, WASM bên ngoài...); áp dụng kiến trúc đã reverse-engineer từ Microsoft 365 Web | Hội thoại 2026-11-15 (chỉ đạo bổ sung) |

## 4. Ghi nhận thực tế khi kết nối `agent-browser` tới Edge (R1)

Ngày **2026-11-15**, Agent đã kiểm tra môi trường thực tế để thực hiện R1:
1. Kiểm tra tiến trình `msedge.exe`: trình duyệt Edge của người dùng đang chạy với `--profile-directory=Default`, nhưng **không bật cờ `--remote-debugging-port`**.
2. Chạy `agent-browser --auto-connect get url`: thất bại với thông báo `No running Chrome instance found. Launch Chrome with --remote-debugging-port or use --cdp`.
3. Chạy `agent-browser --executable-path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" open https://www.office.com`: mở được trang `https://m365.cloud.microsoft/` (`Microsoft 365 - Sign into Copilot`), nhưng ở trạng thái chưa đăng nhập vì không thể dùng chung thư mục profile đang bị phiên Edge chính khóa.
4. **Kết quả cập nhật (Chrome DevTools / `browser` subagent)**: Chủ dự án đã bật Remote Debugging trên Chrome và đăng nhập Microsoft 365; `browser` subagent đã truy cập trực tiếp Word Web, Excel Web và PowerPoint Web trên `https://m365.cloud.microsoft/` để thu thập đầy đủ thông số UI/UX thực tế đưa vào [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) (bản 0.2).

## 5. Diễn giải BA (tách bạch khỏi lời khách hàng)

1. **"Các file định dạng của Microsoft Office"**: Nhóm định dạng OOXML hiện đại gồm **Word (`.docx`)**, **Excel (`.xlsx`)**, **PowerPoint (`.pptx`)** là cốt lõi. Định dạng cũ nhị phân (`.doc`, `.xls`, `.ppt`) hoặc `.csv`/`.pdf` là câu hỏi cần làm rõ trong `CONF-S12-001`.
2. **"Xem/sửa ngay trên trình duyệt tương tự Office 365"**:
   - Người dùng mong đợi một giao diện làm việc chuyên biệt theo từng loại tài liệu: trình soạn thảo văn bản có phân trang/định dạng (Word), bảng tính có thanh công thức/nhiều sheet/hàm (Excel), trình chiếu có danh sách slide thu nhỏ bên trái và khung thiết kế slide (PowerPoint).
   - Thanh công cụ theo phong cách **Simplified Ribbon** (1 dòng gọn gàng mặc định như Office 365 Web, có thể mở rộng hoặc nhóm tab Home/Insert/Layout) phù hợp với quy chuẩn UI/UX mật độ cao, vuông vắn của Open-ERP.
3. **"Mở các file bằng client, không cần sự can thiệp của backend là tốt nhất"**:
   - **Pure Client-Side (Zero-Backend Processing)**: File được đọc trực tiếp qua `<input type="file">`, Drag & Drop, hoặc **File System Access API** (`showOpenFilePicker` / `showSaveFilePicker` trên Edge/Chrome) để đọc và ghi đè trực tiếp file trên máy người dùng mà không cần upload lên server.
   - **Tích hợp tùy chọn trong ERP**: Vì đây là plugin của Open-ERP, trong tương lai (hoặc ngay v1 nếu chốt) người dùng có thể muốn mở file đính kèm từ các module khác (Hồ sơ nhân viên, Quy trình, Lưu trữ) thông qua URL/Blob mà không cần backend convert định dạng — tức là backend chỉ đóng vai trò lưu trữ file thô (nếu có), còn toàn bộ parse/render/edit/export chạy 100% ở trình duyệt.
4. **Rủi ro kỹ thuật cần lưu ý sớm (chuyển Architect ở Bước 05)**:
   - Xử lý `.docx`, `.xlsx`, `.pptx` **100% client-side có chỉnh sửa (editing)** khó hơn nhiều so với chỉ xem (viewing):
     - Excel (`.xlsx`) có hệ sinh thái client-side trưởng thành (như **Univer**, **SheetJS**).
     - Word (`.docx`) có viewer tốt (`docx-preview`, `mammoth`) nhưng **full-fidelity DOCX editor** thuần JS/TS còn hạn chế; muốn sửa giữ nguyên định dạng phức tạp cần engine **WebAssembly (WASM)** (ví dụ nhân ONLYOFFICE biên dịch WASM hoặc Rust/WASM) có kích thước tải lớn (20–60MB) và cần kiểm tra kỹ giấy phép (AGPL vs MIT/Apache).
     - PowerPoint (`.pptx`) là định dạng khó nhất để **sửa** thuần client-side ở mức Office 365.

## 6. Ràng buộc đã biết (từ guardrails dự án)

1. **Plugin độc lập**: Đóng gói đúng chuẩn plugin của Open-ERP (Sprint 03 / Sprint 06), không đưa code nghiệp vụ vào Core.
2. **Frontend Stack**: Angular >= 22 + Tailwind CSS v4 (Web) và Ionic 8 + Angular (Mobile). Không viết unit test cho Frontend; kiểm thử QA bằng Dual-Mode Browser Testing (Desktop >= 1280px & Mobile 390x844px, 0 `console.error`).
3. **UI/UX & i18n**: Phong cách vuông vắn, mật độ thông tin cao, Anti-Modal (dùng Drawer/Split-screen/Nested Route), lưu vết trạng thái qua URL, **100% i18n** không hardcode text/emoji trong nhãn.
4. **Zero-Backend / Multi-tenant**: Nếu plugin vận hành thuần client-side (Zero-DB), không phát sinh bảng CSDL; nếu có lưu danh sách file gần đây hoặc cấu hình/file trên server, bắt buộc cô lập theo `tenant_id`.

## 7. Câu hỏi mở chuyển sang `CONF-S12-001`

1. Định dạng file hỗ trợ ở v1: cả 3 (`.docx`, `.xlsx`, `.pptx`) hay ưu tiên mức độ Xem vs Sửa khác nhau cho từng loại?
2. Mức độ chỉnh sửa kỳ vọng cho Word / Excel / PowerPoint (sửa cơ bản giữ cấu trúc hay full-fidelity như Office 365)?
3. Chiến lược Engine & License: chấp nhận WASM bundle nặng (chỉ tải khi mở plugin) hoặc thư viện AGPL, hay ưu tiên MIT/Apache nhẹ?
4. Nguồn mở file & lưu file: chỉ mở/lưu file local trên máy, hay tích hợp mở file từ URL/attachment của các plugin ERP khác?
5. Hỗ trợ Mobile (Ionic): chỉ Xem (Viewer) hay cần Sửa trên điện thoại?
6. Làm việc ngoại tuyến (Offline / IndexedDB draft recovery) có cần không?
