# [RAW-02] Ghi Chú Yêu Cầu Thô: CLI Tạo Dự Án Plugin Mới

- **Ngày tiếp nhận**: 2026-09-19
- **Người cung cấp**: Khách hàng (Product Owner / Founder)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Yêu cầu trực tiếp từ khách hàng (phiên làm việc lập kế hoạch Sprint 03)
- **Cập nhật gần nhất**: 2026-09-19 — bổ sung phản hồi làm rõ của khách hàng (Mục 4) và yêu cầu bổ sung về command sinh entity/menu (Mục 1).

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

> "Cần có **CLI để tạo 1 dự án plugin mới cho hệ thống**.
>
> - Lập trình viên chỉ cần chạy một lệnh là sinh ra đầy đủ khung dự án plugin chuẩn: manifest `plugin.json`, project backend Quarkus Java, script migration `up`/`down` theo tenant, khung giao diện Web Angular (và Mobile Ionic nếu có), file i18n, cấu hình CI, hướng dẫn README.
> - Khung sinh ra phải **chạy được ngay**: build thành công, test backend chạy trên PostgreSQL/Redis thật, tuân thủ chuẩn Entity Registry, ResponseKey, mã lỗi i18n.
> - Phải chọn được loại plugin khi tạo: plugin gắn thẳng vào hệ thống (module) hay plugin đóng gói riêng (container/image). CLI phải đồng bộ với cơ chế đóng gói/phân phối plugin ở yêu cầu thứ 3.
> - Không cần thao tác thủ công copy-paste theo file hướng dẫn nữa.
>
> **Bổ sung (phiên review 2026-09-19)**: "Ngoài ra CLI còn phải có các command để hỗ trợ **sinh entity**, **đăng ký vào menu của hệ thống**, ..."

---

## 2. Bối Cảnh & Các Ràng Buộc Kèm Theo

1. **Hiện trạng**: quy trình tạo plugin đang là thủ công theo `docs/08_developer_guides/create_new_plugin_guide.md` (tạo tay `plugin.json`, pom.xml, migration, entity...), dễ sai sót, thiếu nhất quán giữa các plugin.
2. **Định hướng phân phối (liên quan RAW-03)**: plugin đóng gói dưới dạng container/image (Docker Hub, Image Registry) hoặc file JAR backend + bản build Web (upload → build image). CLI phải sinh cấu hình đóng gói tương ứng.
3. **Ràng buộc kỹ thuật dự án**:
   - Backend: Quarkus (Java 21), PostgreSQL + Redis thật khi test (CẤM H2).
   - Frontend: Angular >= 22 + Tailwind 4, tách template `.html`, 100% i18n, dùng chung `src/frontend/shared`, không viết unit test frontend.
   - Mọi component UI dùng chung phải nằm trong thư viện shared trước khi dùng.
4. **Trải nghiệm nhà phát triển**: CLI phải chạy được trên Windows/macOS/Linux (môi trường dev hiện tại là Windows), có cả chế độ hỏi đáp (interactive) và chế độ truyền tham số đầy đủ (non-interactive cho CI).
5. **Tài liệu**: sau khi CLI hoàn thành phải cập nhật `docs/08_developer_guides/create_new_plugin_guide.md` để hướng dẫn dùng CLI thay cho quy trình thủ công.

---

## 3. Các Từ Khóa Nghiệp Vụ Chính

- Scaffolding CLI (CLI sinh khung dự án), Template (mẫu khung), Generator.
- Plugin Manifest `plugin.json`, SemVer, Core Compatibility.
- Migration theo tenant, Entity Registry, **sinh entity (generate entity)**.
- **Đăng ký menu hệ thống (register menu)**.
- Distribution Packaging (đóng gói image / bundle), Checksum.
- Interactive mode, Non-interactive mode (CI), Exit code, Dry-run.
- Template Versioning (phiên bản bộ mẫu gắn với phiên bản Core).
- npm package / npx, Git submodule.

---

## 4. Phản Hồi Làm Rõ Của Khách Hàng (2026-09-19)

> Toàn bộ câu hỏi mở đã được khách hàng trả lời trong phiên review Bước 1-2 ngày 2026-09-19. Phản hồi dưới đây đã được phản ánh vào tài liệu phân tích (ANL-02 v1.1).

- [x] **Q1 (Công nghệ CLI)**: **Dùng Node.js**.
- [x] **Q2 (Tên lệnh & phân phối)**: **Đóng gói thành thư viện npm / chạy `npx` global** như các framework khác.
- [x] **Q3 (Vị trí dự án sinh ra)**: **Tách thành các repo riêng**, liên kết vào repo chính dưới dạng **git submodule**.
- [x] **Q4 (Màn hình quản trị mẫu)**: **Có sinh mẫu** (bao gồm seed quyền và menu mẫu).
- [x] **Q5 (Lệnh package/ký/checksum)**: **Có** — đóng gói JAR/image + checksum ngay từ Sprint 3.
- [x] **Q6 (Chọn database)**: **Có** hỗ trợ chọn PostgreSQL (mặc định) hoặc MongoDB.
- [x] **Q7 (Ngôn ngữ CLI)**: **Chỉ tiếng Anh**.
- [x] **Q8 (Sinh Dockerfile/K8s)**: **Có** sinh cấu hình Dockerfile/K8s cho plugin container.
- [x] **Q9 (Bổ sung)**: CLI còn phải có command **sinh entity**, **đăng ký menu vào hệ thống** và các command hỗ trợ tương tự.
