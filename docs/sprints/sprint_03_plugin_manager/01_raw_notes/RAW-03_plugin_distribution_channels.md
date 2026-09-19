# [RAW-03] Ghi Chú Yêu Cầu Thô: Cơ Chế Phân Phối & Cài Đặt Plugin Đa Kênh

- **Ngày tiếp nhận**: 2026-09-19
- **Người cung cấp**: Khách hàng (Product Owner / Founder)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Yêu cầu trực tiếp từ khách hàng (phiên làm việc lập kế hoạch Sprint 03)
- **Cập nhật gần nhất**: 2026-09-19 — bổ sung phản hồi làm rõ của khách hàng (Mục 4).

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

> "Cần **cơ chế cho phép cái plugin qua Docker Hub, link image registry, file JAR backend + bản build web**.
>
> - Khi tôi hoặc kỹ thuật viên có một plugin đã đóng gói sẵn, phải đưa nó vào hệ thống được bằng 3 cách:
>   1. Nhập link **Docker Hub** (ví dụ `docker.io/open-erp/plugin-sales:1.2.0`).
>   2. Nhập link **Image Registry** bất kỳ (Harbor, GHCR, GitLab Registry, registry riêng của doanh nghiệp) — có thể cần tài khoản/mật khẩu để pull.
>   3. **Tải lên file**: file JAR backend + bản build Web (thư mục/zip) cho trường hợp không có registry hoặc máy chủ không ra internet (air-gapped).
> - Sau khi đưa vào, hệ thống phải kiểm tra được: đúng manifest, đúng phiên bản, có tương thích với Core hiện tại không, có phụ thuộc plugin nào không, checksum có khớp không.
> - Plugin sau khi đăng ký vào danh mục thì cài cho tenant như bình thường (liên quan yêu cầu quản lý plugin), không phải cài lại thủ công từng nơi.
> - Bắt buộc an toàn: chỉ Super Admin được đăng ký nguồn plugin; không cho phép nạp mã lạ từ URL không tin cậy; phải có checksum/kiểm tra toàn vẹn."

---

## 2. Bối Cảnh & Các Ràng Buộc Kèm Theo

1. **Hiện trạng**: chưa có bất kỳ cơ chế phân phối plugin nào. Danh mục plugin chỉ là cấu hình CSV trong `application.properties` (`openerp.platform.plugin-catalog`). Core chưa có cơ chế nạp/nuôi plugin động.
2. **Kiến trúc hiện tại**: Backend Quarkus là một Maven module duy nhất (modular monolith); Web là Angular 22 đóng gói tĩnh qua nginx; triển khai bằng Docker Compose/K8s với image registry cấu hình qua `DOCKER_REGISTRY`.
3. **Định hướng Blueprint**: plugin là đơn vị mở rộng độc lập; giao tiếp qua REST/Event Bus; mỗi plugin có SemVer, entity đăng ký Registry.
4. **Ràng buộc bảo mật**:
   - Chỉ Super Admin được đăng ký nguồn artifact/nâng cấp artifact của hệ thống.
   - Không hardcode URL; không cho phép SSRF (chỉ fetch từ registry/host trong allowlist cấu hình).
   - Bắt buộc xác minh toàn vẹn (checksum SHA-256; chữ ký số nếu có) trước khi kích hoạt.
   - Ghi audit toàn bộ thao tác đăng ký/cập nhật/gỡ artifact.
5. **Ràng buộc vận hành**:
   - Môi trường local dev tối giản tài nguyên (PostgreSQL + Redis), các dịch vụ nặng (MinIO, Kafka, MongoDB) bật on-demand bằng Docker Compose Profiles.
   - Phải hỗ trợ cả môi trường có internet (pull registry) và môi trường air-gapped (upload file).
6. **Kế thừa**: cơ chế phân phối phải đổ dữ liệu vào cùng Plugin Catalog của RAW-01 để Tenant cài đặt qua Marketplace.

---

## 3. Các Từ Khóa Nghiệp Vụ Chính

- Plugin Artifact (Gói plugin), Plugin Package, Artifact Registry/Repository.
- Docker Hub, OCI Image, Image Digest, Tag.
- Pull Credentials / Registry Secret, Allowlist Registry.
- JAR Bundle, Web Build Bundle, Manifest, Checksum (SHA-256), Chữ ký số (Signature).
- Compatibility Check, Dependency Check, Security Scan, Quarantine.
- Air-gapped / Offline Installation.
- Container-per-Tenant, Tự động deploy (Auto Deploy), Image Build từ JAR.
- UI Slot / UI Contribution (vùng hiển thị Web plugin: màn hình riêng hoặc nhúng vào màn hình Core/plugin khác).
- Web Components / Module Federation (nhúng trực tiếp), iframe sandbox (dự phòng).
- Rollback / Version Pinning (ghim phiên bản), Đa phiên bản song song.

---

## 4. Phản Hồi Làm Rõ Của Khách Hàng (2026-09-19)

> Toàn bộ câu hỏi mở đã được khách hàng trả lời trong phiên review Bước 1-2 ngày 2026-09-19. Phản hồi dưới đây đã được phản ánh vào tài liệu phân tích (ANL-03 v1.1).

- [x] **Q1 (Mô hình chạy plugin image)**: **Ưu tiên mỗi tenant một container** — vì nếu dùng 1 container chung thì khó hỗ trợ scale toàn hệ thống.
- [x] **Q2 (Deploy container)**: **Hệ thống tự động deploy**.
- [x] **Q3 (Cơ chế nạp JAR tải lên)**: Khi tải lên, **tự build thành 1 image rồi deploy** giống hệt cách dùng image từ Docker Hub/Registry (không nạp classloader vào lõi).
- [x] **Q4 (Web build)**: **Làm rõ lại (2026-09-19)**: web plugin có thể hiển thị **thành 1 màn hình riêng**, hoặc **nằm trong 1 màn hình đang có của Core hoặc của plugin khác** (UI Contribution vào UI Slot). Giao BA/Architect đề xuất kỹ thuật render tối ưu — chi tiết tại ANL-03 mục 4.4 (đề xuất iframe, chốt tại Bước 5/6).
- [x] **Q5 (Lưu trữ artifact)**: **Triển khai lưu trữ bằng MinIO**.
- [x] **Q6 (Ký số)**: **Ký số để giai đoạn sau**; Sprint 3 dùng **checksum SHA-256**.
- [x] **Q7 (Credentials registry)**: **Có** — **tầng nền tảng khai báo nhiều credential**, **tầng tenant cũng vậy** (đa credential theo từng phạm vi).
- [x] **Q8 (Migration DB của plugin)**: **Plugin phải tự chạy migrate**.
- [x] **Q9 (Đa phiên bản song song)**: **Có hỗ trợ** — tenant A dùng v1, tenant B dùng v2.
- [x] **Q10 (Bổ sung làm rõ 2026-09-19 — kỹ thuật nhúng UI)**: **Triển khai Web Components và/hoặc Module Federation ngay trong Sprint 03** để nhúng plugin vào các màn hình đã có của Core/plugin khác (không chỉ iframe). Iframe có thể giữ làm chế độ sandbox dự phòng cho plugin chưa hỗ trợ contract.
